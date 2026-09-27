"""Cheap story continuity, demonstrated actions and compact daily handoffs.

These checks bind a human editorial verdict to the actual story and source inputs.
They do not infer causality or artistic quality from word counts or hashes.
"""
from __future__ import annotations
import argparse
import copy
import hashlib
import json
import re
from pathlib import Path
from datetime import date, datetime

REPO = Path(__file__).resolve().parents[1]
POLICY = REPO / "config/daily_production.json"
CATALOG = REPO / "config/production_actions.json"


def read(path):
    return json.loads(Path(path).read_text())


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def policy():
    return read(POLICY)


def targets():
    limits = read(REPO / "config/run_limits.json")["resources"]
    return {key: limits[key] for key in policy()["target_resources"]}


def in_window(value):
    try:
        return date.fromisoformat(str(value)[:10]) >= date.fromisoformat(policy()["effective_date"])
    except ValueError:
        return False


def required(board):
    return board.get("daily_production") is True or in_window(board.get("date"))


def story_digest(board):
    # Measured timing and subtitles do not change the causal story. The final phone
    # and audiovisual gates still bind those exact bytes separately.
    scenes = []
    for scene in board.get("scenes", []):
        row = copy.deepcopy(scene)
        for key in ("start_s", "duration_s", "duration_authored", "caption"):
            row.pop(key, None)
        for event in row.get("visual_events", []):
            for key in ("at_s", "duration_s", "at_s_authored", "duration_s_authored"):
                event.pop(key, None)
        scenes.append(row)
    data = {"contract": board.get("story_contract"), "scenes": scenes,
            "title": board.get("title"), "native_media": board.get("native_media"),
            "cinematic_template": board.get("cinematic_template")}
    return hashlib.sha256(json.dumps(data, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def bound(item, root=REPO):
    path = (root / item["path"]).resolve()
    if not path.is_relative_to(root.resolve()) or not path.is_file() or digest(path) != item["sha256"]:
        raise ValueError("missing, changed or out-of-scope production evidence: " + str(item.get("path")))
    return path


def catalog_problems(catalog=None):
    data = read(CATALOG) if catalog is None else catalog
    errors = []
    try:
        release = data["provenance"]
        film = bound(release["film"])
        bound(release["source_renderer"])
        state = read(bound(release["state"]))
        if state.get("terminal_state") != "shipped" or state["shipment"]["film_sha256"] != digest(film):
            errors.append("action provenance is not a verified shipped film")
        from production_quality import av_problems
        requests = []
        for role in ("picture", "story", "sound"):
            receipt = bound(release["reviews"][role])
            errors += av_problems(receipt, film, role)
            requests.append(read(receipt).get("request_id"))
        if len(set(requests)) != 3:
            errors.append("action provenance needs three separate audiovisual identities")
        board = read(bound(release["board"]))
        scenes = {s["id"]: s for s in board["scenes"]}
        for action in data["actions"]:
            bound(action["module"])
            if action["source_scene"] not in scenes or not action.get("exports") or not action.get("limits"):
                errors.append("action lacks a reviewed scene, callable exports or scope limits")
        ids = [a["id"] for a in data["actions"]]
        if len(ids) != len(set(ids)):
            errors.append("duplicate demonstrated action id")
    except (OSError, ValueError, KeyError, TypeError) as exc:
        errors.append(str(exc))
    return errors


def structure_problems(board, claims=None):
    if not required(board):
        return []
    errors = []
    contract = board.get("story_contract") or {}
    for key in policy()["story_fields"]:
        value = contract.get(key)
        if not isinstance(value, str) or not 12 <= len(value.strip()) <= 280:
            errors.append("story contract needs one concrete, compact " + key)
    scenes = board.get("scenes", [])
    ids = [s.get("id") for s in scenes]
    rows = contract.get("scenes") or []
    if [r.get("scene_id") for r in rows] != ids or not ids or len(set(ids)) != len(ids):
        errors.append("story rows must cover the current scene order exactly once")
    verified = None if claims is None else {
        c["id"] for c in claims.get("claims", [])
        if c.get("verdict") == "VERIFIED" and str(c.get("quote", "")).strip()
    }
    allowed_roles = {"action", "mechanism", "consequence", "evidence", "limit", "answer"}
    for row in rows:
        if row.get("role") not in allowed_roles or len(str(row.get("advances", "")).strip()) < 20:
            errors.append("each scene must explain how its picture advances the causal story")
        refs = row.get("claim_ids")
        if not isinstance(refs, list) or not refs or (verified is not None and not set(refs) <= verified):
            errors.append("story scene lacks current VERIFIED source bindings")
    for scene, row in zip(scenes, rows):
        stated = set(scene.get("vo_claims") or [])
        if scene.get("super_claim"):
            stated.add(scene["super_claim"])
        if not stated <= set(row.get("claim_ids") or []):
            errors.append("story row omits claims used by its actual scene")
    if rows and (rows[-1].get("role") != "answer" or not any(r.get("role") == "consequence" for r in rows)):
        errors.append("story needs a human consequence and a closing answer")
    cuts = contract.get("transitions") or []
    pairs = list(zip(ids, ids[1:]))
    if [(r.get("from"), r.get("to")) for r in cuts] != pairs:
        errors.append("every current cut needs one ordered continuity explanation")
    for cut in cuts:
        if cut.get("kind") not in policy()["transition_kinds"]:
            errors.append("cut needs an explicit continuity kind")
        for key in ("because", "visible_bridge"):
            if len(str(cut.get(key, "")).strip()) < 20:
                errors.append("cut lacks a concrete " + key)
        if cut.get("kind") == "source-example":
            disclosure = str(cut.get("disclosure", "")).strip()
            destination = next((s for s in scenes if s.get("id") == cut.get("to")), {})
            if not 20 <= len(disclosure) <= 72 or destination.get("production_disclosure") != disclosure:
                errors.append("a different source example needs its truthful disclosure in the rendered scene")
    return errors


def action_problems(board):
    if not required(board):
        return []
    errors = catalog_problems()
    catalog = {a["id"]: a for a in read(CATALOG)["actions"]}
    dimensional = set((board.get("cinema") or {}).get("dimensional_scene_ids", []))
    for scene in board.get("scenes", []):
        if scene.get("id") not in dimensional:
            continue
        action = catalog.get(scene.get("production_action"))
        if not action:
            errors.append(str(scene.get("id")) + " requires a demonstrated action; choose another supported treatment before voice")
        elif len(scene.get("visual_events") or []) < action["min_events"]:
            errors.append(str(scene.get("id")) + " lacks the demonstrated action's event sequence")
    # The provided route executes these ids directly. A custom composition must call
    # the actual library symbols; final film review still proves visible execution.
    if board.get("cinematic_template") != "daily-actions-v1":
        from critic_gate import renderer_files
        try:
            sources = [p.read_text() for p in renderer_files(board)
                       if p.name not in ("Dispatch.tsx", "ProvenActions.tsx")]
            for action_id in {s.get("production_action") for s in board.get("scenes", [])
                              if s.get("id") in dimensional}:
                if action_id in catalog and not any(
                    "production/ProvenActions" in source and
                    any(re.search(r"<" + re.escape(name) + r"\b", source) for name in catalog[action_id]["exports"])
                    for source in sources):
                    errors.append(str(action_id) + " is declared but its library action has no renderer call")
            if any(s.get("production_disclosure") for s in board.get("scenes", [])) and not any(
                    "production_disclosure" in source for source in sources):
                errors.append("custom renderer does not display the current source-example disclosure")
        except (ValueError, OSError) as exc:
            errors.append(str(exc))
    return errors


def review_problems(board, report):
    if not required(board):
        return []
    errors = structure_problems(board)
    review = report.get("story_review") or {}
    if review.get("story_sha256") != story_digest(board):
        errors.append("story changed since continuity approval; review the whole sequence before spending")
    if review.get("policy_sha256") != digest(POLICY):
        errors.append("story review does not bind the current daily contract")
    if review.get("verdict") != "pass" or review.get("blocking_defects") != []:
        errors.append("story or continuity defects remain unresolved")
    director = (board.get("story_contract") or {}).get("director_identity")
    identity = report.get("reviewer_identity")
    if not director or not identity or director == identity:
        errors.append("story approval requires the independent critic, distinct from the director")
    for key in ("one_viewing_summary", "opening_to_ending", "weakest_transition"):
        if len(str(review.get(key, "")).strip()) < 30:
            errors.append("independent story review lacks " + key)
    return errors


def pre_voice_problems(board_path, claims_path, script=None):
    board = read(board_path)
    if not required(board):
        return []
    report_path = Path(board_path).with_name("storyboard_critic.json")
    report = read(report_path) if report_path.exists() else {}
    errors = structure_problems(board, read(claims_path)) + action_problems(board) + review_problems(board, report)
    if (report.get("story_review") or {}).get("claims_sha256") != digest(claims_path):
        errors.append("source evidence changed since the independent story review")
    if script is not None:
        narrated = " ".join(str(s.get("vo", "")) for s in board.get("scenes", []))
        if " ".join(narrated.split()) != " ".join(script.split()):
            errors.append("spoken script differs from the story that the critic approved")
    return sorted(set(errors))


def packet(board_path, claims_path, role, state_path=None):
    """Bound references, not copied history. Reviewers load their assigned sources themselves."""
    board, claims = read(board_path), read(claims_path)
    data = {
        "role": role, "date": board["date"], "story_sha256": story_digest(board),
        "board": {"path": str(Path(board_path).resolve()), "sha256": digest(board_path)},
        "claims": {"path": str(Path(claims_path).resolve()), "sha256": digest(claims_path)},
        "story": board.get("story_contract"),
        "quality_contract": "config/quality_contract.json",
        "rubric": "config/dispatch_rubric.yaml",
        "brief": ".claude/agents/" + ("scorer" if role in ("picture", "story", "sound") else role) + ".md",
        "instructions": "Read the bound current inputs and your brief. Load cited source evidence as needed. Do not copy production history. Return one consolidated verdict. Never infer audio access from text.",
    }
    if role in ("picture", "story", "sound"):
        root = Path(board_path).parent
        for key, name in (("film", "film.mp4"), ("av_receipt", f"cinema/{role}-review.json"),
                          ("attention_player", "attention-review.html"), ("feed", "feed-composite.png")):
            p = root / name
            if not p.is_file():
                raise ValueError("final reviewer packet is missing " + str(p))
            data[key] = {"path": str(p.resolve()), "sha256": digest(p)}
    if state_path:
        state = read(state_path)
        data["usage"] = state["usage"]
        data["phase"] = state["phase"]
        ledger = Path(state_path).with_name("current-defects.json")
        if ledger.exists():
            data["defects"] = {"path": str(ledger.resolve()), "sha256": digest(ledger)}
    encoded = json.dumps(data, indent=2)
    if len(encoded) > policy()["handoff_max_chars"]:
        raise ValueError("handoff exceeds the compact packet limit; shorten the story contract, retain source paths")
    return data


def scoreboard(runs=REPO / "runs", state_path=None):
    rows = []
    candidates = {}
    paths = list(Path(runs).glob("*/run_state.json"))
    if state_path and Path(state_path).is_file():
        paths.append(Path(state_path))
    for path in paths:
        state = read(path)
        if not in_window(state.get("run_id")):
            continue
        run_id = state["run_id"]
        previous = candidates.get(run_id)
        if not previous or state.get("updated_at", "") >= previous[1].get("updated_at", ""):
            candidates[run_id] = (path, state)
    shipped = 0
    for run_id, (path, state) in sorted(candidates.items()):
        if shipped >= policy()["measurement_editions"]:
            break
        shipped += state.get("terminal_state") == "shipped"
        # Include unfinished editions so a costly nonshipment cannot disappear.
        usage = state.get("usage", {})
        report_path = path.with_name("report_card.json")
        report = read(report_path) if report_path.exists() else {}
        rows.append({
            "run_id": state["run_id"], "state": state.get("terminal_state") or state.get("phase"),
            "shipped": state.get("terminal_state") == "shipped",
            "score": report.get("weighted_score", report.get("score")),
            "usage": usage, "first_panel_pass": report.get("ship") is True and usage.get("panel_rounds") == 1,
            "over_targets": {k: {"used": usage.get(k, 0), "target": v} for k, v in targets().items()
                             if usage.get(k, 0) > v},
            "elapsed_seconds": None,
            "account_tokens": None,
            "accounting_note": "reported_tokens covers provider telemetry only; Codex conversation and agent totals are unavailable here",
        })
        if state.get("created_at") and state.get("updated_at"):
            try:
                rows[-1]["elapsed_seconds"] = (datetime.fromisoformat(state["updated_at"].replace("Z","+00:00")) -
                                               datetime.fromisoformat(state["created_at"].replace("Z","+00:00"))).total_seconds()
            except ValueError:
                pass
    return {"policy": policy()["version"], "target_editions": policy()["measurement_editions"],
            "editions": rows, "shipped_count": sum(r["shipped"] for r in rows),
            "evidence_status": "observations only; production reliability is not established by tooling tests"}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--board", type=Path)
    p.add_argument("--claims", type=Path)
    p.add_argument("--state", type=Path)
    p.add_argument("--catalog-check", action="store_true")
    p.add_argument("--digest", action="store_true")
    p.add_argument("--packet", choices=["validator", "storyboard-critic", "vo-director", "picture", "story", "sound"])
    p.add_argument("--scoreboard", action="store_true")
    p.add_argument("--out", type=Path)
    a = p.parse_args()
    try:
        if a.catalog_check:
            errors = catalog_problems()
            print("\n".join(errors) if errors else "demonstrated action provenance verified")
            return int(bool(errors))
        if a.scoreboard:
            data = scoreboard(state_path=a.state)
        elif not a.board:
            p.error("--board is required")
        elif a.digest:
            data = {"story_sha256": story_digest(read(a.board)), "policy_sha256": digest(POLICY)}
        elif not a.claims:
            p.error("--claims is required")
        elif a.packet:
            data = packet(a.board, a.claims, a.packet, a.state)
        else:
            errors = pre_voice_problems(a.board, a.claims)
            print("\n".join(errors) if errors else "current story and demonstrated action checks pass")
            return int(bool(errors))
        if a.out:
            a.out.parent.mkdir(parents=True, exist_ok=True)
            a.out.write_text(json.dumps(data, indent=2) + "\n")
        else:
            print(json.dumps(data, indent=2))
        return 0
    except (OSError, ValueError, KeyError, TypeError) as exc:
        print("daily production refused: " + str(exc))
        return 1

if __name__ == "__main__":
    raise SystemExit(main())
