"""Explicit isolated worker plans and private, observed session accounting. No paid calls."""
from __future__ import annotations
import argparse
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
POLICY = REPO / "config/agent_runtime.json"
TOKEN_KEYS = ("input_tokens", "cached_input_tokens", "cache_write_input_tokens",
              "output_tokens", "reasoning_output_tokens", "total_tokens")


def read(path):
    return json.loads(Path(path).read_text())


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def policy():
    return read(POLICY)


def assignment(role, edition):
    cfg = policy()
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(edition)):
        raise ValueError("assignment needs an ISO edition date")
    datetime.fromisoformat(edition)
    if edition < cfg["effective_date"]:
        return None
    if role not in cfg["roles"]:
        raise ValueError("unknown production role")
    row = cfg["roles"][role]
    return {"role": role, "policy": {"path": str(POLICY.resolve()), "sha256": digest(POLICY)},
            "model": row["model"], "reasoning_effort": row["reasoning_effort"],
            "fork_turns": cfg["fork_turns"], "resource": row["resource"]}


def bound(path):
    path = Path(path).resolve()
    return {"path": str(path), "sha256": digest(path)}


def references(value):
    if isinstance(value, dict):
        if "path" in value and "sha256" in value:
            yield value
        for item in value.values():
            yield from references(item)
    elif isinstance(value, list):
        for item in value:
            yield from references(item)


def validate_references(data):
    for row in references(data):
        if not re.fullmatch(r"[a-f0-9]{64}", str(row["sha256"])):
            raise ValueError("invalid input hash")
        if digest(row["path"]) != row["sha256"]:
            raise ValueError("assignment input changed: " + Path(row["path"]).name)


def contracts(role):
    files = ("AGENTS.md", "CLAUDE.md", "knowledge/craft/AGENT_RUNTIME.md",
             "config/quality_contract.json", "config/dispatch_rubric.yaml",
             policy()["roles"][role]["brief"])
    return [bound(REPO / file) for file in files]


def treatment_bindings(board_path):
    root = Path(board_path).parent
    return [bound(root / ("opening-" + variant + ".json")) for variant in ("a", "b")]


def treatment_assets(rows):
    result = {}
    public = (REPO / "video-engine/public").resolve()
    for row in rows:
        board = read(row["path"])
        import story_art
        errors = story_art.problems(board, repo=REPO)
        if errors:
            raise ValueError("treatment art is not current verified generation: " + "; ".join(errors))
        entries = (board.get("story_art") or {}).get("entries", [])
        if len(entries) != 2:
            raise ValueError("two-treatment assignment needs both actual generated raster assets")
        identities = set()
        for entry in entries:
            path = (public / entry["file"]).resolve()
            if not path.is_relative_to(public) or digest(path) != entry.get("sha256"):
                raise ValueError("treatment raster asset is missing or changed")
            identities.add(entry["sha256"])
            result[str(path)] = bound(path)
        if len(identities) != 2:
            raise ValueError("two distinct generated assets are required")
    return list(result.values())


def required_inputs(data, role):
    if data.get("agent_contracts") != contracts(role):
        raise ValueError("assignment lacks its current complete role and contract bindings")
    if role == "researcher" or (role == "validator" and "inputs" in data):
        if not isinstance(data.get("inputs"), list) or not data["inputs"]:
            raise ValueError("early source assignment has no actual inputs")
        if data.get("phase") != bound(REPO / "prompts/phases/01-research.md"):
            raise ValueError("early source assignment lacks its current phase")
        return
    for key in ("board", "claims"):
        if not isinstance(data.get(key), dict) or not all(k in data[key] for k in ("path", "sha256")):
            raise ValueError("assignment lacks its actual " + key)
    board = read(data["board"]["path"])
    if board.get("date") != data.get("date"):
        raise ValueError("packet edition differs from its actual board")
    if role != "validator":
        from daily_production import craft_reading_paths
        expected = [bound(path) for path in craft_reading_paths(board)]
        if data.get("craft_readings") != expected:
            raise ValueError("assignment lacks its complete current craft guides")
    if role in ("scene-builder", "storyboard-critic"):
        rows = data.get("treatments")
        if rows != treatment_bindings(data["board"]["path"]):
            raise ValueError("assignment needs both current complete treatment boards")
        variants = []
        for row in rows:
            treatment = read(row["path"])
            if treatment.get("date") != board.get("date"):
                raise ValueError("treatment belongs to another edition")
            variants.append((treatment.get("film_direction") or {}).get("variant"))
        if variants != ["a", "b"] or rows[0]["sha256"] == rows[1]["sha256"]:
            raise ValueError("two complete treatment variants must be distinct")
        assets = treatment_assets(rows)
        if data.get("asset_inputs") != assets or len(assets) != 2:
            raise ValueError("two treatments must share exactly two bound current raster assets")
        if role == "storyboard-critic":
            for row in rows:
                treatment = read(row["path"])
                inputs = (treatment.get("film_direction") or {}).get("renderer_inputs")
                import modern_film
                expected = modern_film.renderer_inputs(treatment["film_direction"]["episode"], repo=REPO)
                if inputs != expected:
                    raise ValueError("code critic needs the complete current renderer closure")
                if not isinstance(inputs, list) or not inputs:
                    raise ValueError("code critic needs actual renderer bindings for both treatments")
                public = REPO.resolve()
                for item in inputs:
                    path = (public / item["path"]).resolve()
                    if not path.is_relative_to(public) or digest(path) != item.get("sha256"):
                        raise ValueError("treatment renderer is missing or stale")
    if role in ("picture", "story", "sound"):
        for key in ("film", "av_receipt", "attention_player", "feed"):
            if not isinstance(data.get(key), dict) or not all(k in data[key] for k in ("path", "sha256")):
                raise ValueError("final scorer lacks current " + key)
        receipt = read(data["av_receipt"]["path"])
        if receipt.get("film_sha256") != data["film"]["sha256"] or receipt.get("role") != role:
            raise ValueError("final scorer audiovisual receipt belongs to another film or lens")


def input_packet(role, edition, inputs):
    if role not in ("researcher", "validator") or not inputs:
        raise ValueError("early source packet needs researcher/validator and actual input files")
    route = assignment(role, edition)
    if route is None:
        raise ValueError("early packet routing does not change historical editions")
    cfg = policy()
    data = {"role": role, "date": edition, "agent_assignment": route,
            "brief": cfg["roles"][role]["brief"], "inputs": [bound(p) for p in inputs],
            "agent_contracts": contracts(role),
            "phase": bound(REPO / "prompts/phases/01-research.md"),
            "instructions": "Use one assigned beat or source-validation scope. Read full fetched source bodies, the role brief and phase contracts. Return sourced findings or one consolidated source verdict. Never recursively delegate."}
    return data


def plan(role, packet_path, task_name, scope):
    if not re.fullmatch(r"[a-z][a-z0-9_]*", task_name):
        raise ValueError("task name needs lowercase letters, digits or underscores")
    if not scope.strip() or len(scope) > 1000:
        raise ValueError("assignment needs a compact, concrete scope")
    data = read(packet_path)
    route = assignment(role, data.get("date"))
    if route is None or data.get("role") != role or data.get("agent_assignment") != route:
        raise ValueError("packet does not carry the current role assignment")
    if route["fork_turns"] != "none":
        raise ValueError("role overrides require an isolated fork")
    required_inputs(data, role)
    validate_references(data)
    brief = REPO / policy()["roles"][role]["brief"]
    if data.get("brief") != str(brief.relative_to(REPO)):
        raise ValueError("packet names the wrong role brief")
    message = ("Work in " + str(REPO) + ". Read AGENTS.md, CLAUDE.md and " + str(brief) +
               ". Read the compact packet " + str(Path(packet_path).resolve()) +
               " (SHA256 " + digest(packet_path) + ") and every bound current guide in full. " +
               "Verify the bound inputs before use. Scope: " + scope.strip() +
               " Return one complete handoff or consolidated defect list with exact input hashes. " +
               "You are a leaf worker. Never spawn agents, send email or post socially. " +
               "Plans and code do not approve a film. Preserve actual failed evidence.")
    if len(message) > policy()["max_assignment_chars"]:
        raise ValueError("spawn message exceeds compact assignment limit")
    return {"assignment": route, "packet": bound(packet_path), "brief": bound(brief),
            "spawn_args": {"task_name": task_name, "fork_turns": "none", "model": route["model"],
                           "reasoning_effort": route["reasoning_effort"], "message": message},
            "reservation": "Use the existing controller reservation before execution. Three final scorers remain one atomic panel; this plan spends nothing."}


def instant(value):
    value = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    if value.tzinfo is None:
        raise ValueError("audit timestamp needs a timezone")
    return value


def session_summary(path, through=None):
    raw = Path(path).read_bytes()
    records = [json.loads(line) for line in raw.splitlines() if line.strip()]
    if not records or records[0].get("type") != "session_meta":
        raise ValueError("not a local session log")
    meta = records[0]["payload"]
    start = instant(records[0]["timestamp"])
    usage, modes, spawns, calls = None, set(), [], {}
    for record in records:
        stamp = instant(record["timestamp"])
        if stamp < start or (through and stamp > through):
            continue
        body = record.get("payload", {})
        if record["type"] == "turn_context":
            modes.add((body.get("model"), body.get("effort", body.get("reasoning_effort"))))
        if record["type"] == "event_msg" and body.get("type") == "token_count" and body.get("info"):
            current = body["info"].get("total_token_usage")
            if current:
                if any(type(current.get(k)) is not int or current[k] < 0 for k in TOKEN_KEYS):
                    raise ValueError("invalid cumulative token counter")
                if current["cached_input_tokens"] > current["input_tokens"] or current["reasoning_output_tokens"] > current["output_tokens"]:
                    raise ValueError("overlapping token subsets are invalid")
                if current["total_tokens"] != current["input_tokens"] + current["output_tokens"]:
                    raise ValueError("total token counter is inconsistent")
                if usage and any(current[k] < usage[k] for k in TOKEN_KEYS):
                    raise ValueError("session counters reset; do not guess account usage")
                usage = {k: current[k] for k in TOKEN_KEYS}
        if record["type"] == "response_item" and body.get("type") == "function_call" and body.get("name", "").endswith("spawn_agent"):
            args = json.loads(body["arguments"])
            row = {k: args.get(k) for k in ("task_name", "fork_turns", "model", "reasoning_effort")}
            row.update(observed_at=record["timestamp"], execution_status="unknown")
            spawns.append(row); calls[body["call_id"]] = row
        if record["type"] == "response_item" and body.get("type") == "function_call_output" and body.get("call_id") in calls:
            output = body.get("output", "")
            calls[body["call_id"]]["execution_status"] = "unavailable" if "collab spawn failed" in output else "returned"
    if usage:
        usage["uncached_input_tokens"] = usage["input_tokens"] - usage["cached_input_tokens"]
    source = meta.get("source")
    spawn = source.get("subagent", {}).get("thread_spawn", {}) if isinstance(source, dict) else {}
    return {"session_id": meta["id"], "parent_session_id": spawn.get("parent_thread_id"),
            "role": spawn.get("agent_path", "director"), "session_sha256": hashlib.sha256(raw).hexdigest(),
            "model_effort": [{"model": m, "reasoning_effort": e} for m, e in sorted(modes, key=str)],
            "usage": usage, "spawn_attempts": spawns}


def audit_session(path, through=None):
    cutoff = instant(through) if through else None
    root = session_summary(path, cutoff)
    rows = [root]
    for candidate in sorted(Path(path).parent.glob("*.jsonl")):
        if candidate.resolve() == Path(path).resolve():
            continue
        with candidate.open() as stream:
            line = stream.readline()
        meta = json.loads(line).get("payload", {})
        source = meta.get("source")
        spawn = source.get("subagent", {}).get("thread_spawn", {}) if isinstance(source, dict) else {}
        if spawn.get("parent_thread_id") == root["session_id"]:
            if cutoff and instant(json.loads(line)["timestamp"]) > cutoff:
                continue
            rows.append(session_summary(candidate, cutoff))
    totals = None
    if all(row["usage"] is not None for row in rows):
        totals = {k: sum(row["usage"][k] for row in rows) for k in (*TOKEN_KEYS, "uncached_input_tokens")}
    return {"schema": "dispatch_agent_usage/1", "through": through, "sessions": rows,
            "observed_codex_usage": totals, "billing_cost_usd": None,
            "accounting_note": policy()["accounting_note"],
            "completeness": "direct local sessions only; missing/remote sessions and billing remain unknown"}


def measurements(runs):
    cfg = policy()
    baseline, editions = [], []
    for path in sorted(Path(runs).glob("*/run_state.json")):
        state = read(path)
        identity = state.get("run_id", "")
        is_baseline = identity in cfg["baseline_editions"]
        if not is_baseline and identity[:10] < cfg["effective_date"]:
            continue
        if not is_baseline and sum(row["shipped"] for row in editions) >= cfg["measurement_editions"] and state.get("terminal_state") == "shipped":
            continue
        card = path.with_name("report_card.json")
        report = read(card) if card.exists() else {}
        usage = state.get("usage", {})
        row = {"run_id": identity, "shipped": state.get("terminal_state") == "shipped",
               "state": state.get("terminal_state") or state.get("phase"), "usage": usage,
               "score": report.get("weighted_score", report.get("score")),
               "first_panel_pass": report.get("ship") is True and usage.get("panel_rounds") == 1,
               "elapsed_seconds": None, "billing_cost_usd": None}
        if state.get("created_at") and state.get("updated_at"):
            row["elapsed_seconds"] = (instant(state["updated_at"]) - instant(state["created_at"])).total_seconds()
        (baseline if is_baseline else editions).append(row)
    return {"policy": cfg["version"], "baseline": baseline, "editions": editions,
            "target_editions": cfg["measurement_editions"],
            "shipped_count": sum(row["shipped"] for row in editions),
            "cost_ratio": None, "quality_multiplier": None,
            "evidence_status": "observed production outcomes only; targets remain unproven"}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    group = p.add_mutually_exclusive_group(required=True)
    group.add_argument("--plan", action="store_true")
    group.add_argument("--input-packet", action="store_true")
    group.add_argument("--audit-session", type=Path)
    group.add_argument("--measure", action="store_true")
    p.add_argument("--role", choices=sorted(policy()["roles"]))
    p.add_argument("--edition")
    p.add_argument("--input", type=Path, action="append", default=[])
    p.add_argument("--packet", type=Path)
    p.add_argument("--task-name")
    p.add_argument("--scope", default="")
    p.add_argument("--through")
    p.add_argument("--runs", type=Path, default=REPO / "runs")
    p.add_argument("--out", type=Path)
    a = p.parse_args()
    try:
        if a.plan:
            if not all((a.role, a.packet, a.task_name)):
                p.error("plan needs role, packet and task-name")
            data = plan(a.role, a.packet, a.task_name, a.scope)
        elif a.input_packet:
            data = input_packet(a.role, a.edition, a.input)
        elif a.audit_session:
            data = audit_session(a.audit_session, a.through)
        else:
            data = measurements(a.runs)
        if a.out:
            a.out.parent.mkdir(parents=True, exist_ok=True)
            a.out.write_text(json.dumps(data, indent=2) + "\n")
        else:
            print(json.dumps(data, indent=2))
        return 0
    except (ValueError, KeyError, TypeError, OSError) as exc:
        print("agent runtime refused: " + str(exc))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
