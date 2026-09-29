"""Production repair checkpoints; only shipment is completion.

The owner authorized autonomous repair on 2026-09-26. Each batch is finite,
evidence-bound, reserved before spend, and cannot reuse the same failed attempt.
"""
from pathlib import Path
import hashlib
import json
import subprocess

from run_controller import (read_state, save, load_json, digest, event,
                            review_package_problems, repair_plan_evidence)

# These are batch sizes, never substitutes for rubric or AV approval.
BATCH = {"preflight_renders": 2, "full_renders": 1, "audiovisual_reviews": 4,
         "panel_rounds": 1, "scorer_calls": 3, "tts_calls": 2,
         "validator_agents": 1, "research_agents": 1, "voice_directors": 1,
         "reported_tokens": 100000}
NARRATION_SCOPE = "narration-performance"
SCOPES = {"standard", NARRATION_SCOPE}
NARRATION_BATCH = {"tts_calls": 2}


def plan_identity(plan):
    """Only the completed after hashes may change after the plan is bound."""
    bound = {**plan, "changed_inputs": [
        {k: v for k, v in item.items() if k != "after_sha256"}
        for item in plan.get("changed_inputs", [])]}
    return hashlib.sha256(json.dumps(bound, sort_keys=True).encode()).hexdigest()


def narration_inputs(path):
    """Freeze story evidence and the actual renderer during a direction-only edit."""
    from critic_gate import renderer_digest
    root = path.parent
    files = [root / name for name in ("vo_script.txt", "storyboard.json", "claims.json")]
    files += sorted(p for p in (root / "sources").rglob("*") if p.is_file())
    renderer = renderer_digest(load_json(root / "storyboard.json"))
    if not renderer:
        raise ValueError("narration-performance requires a bound cinematic renderer")
    return {"files": {str(p.resolve()): digest(p) for p in files}, "renderer_sha256": renderer}


def narration_plan_problems(path, plan):
    changed = plan.get("changed_inputs", [])
    if (not isinstance(changed, list) or len(changed) != 1
            or not isinstance(changed[0], dict) or not isinstance(changed[0].get("path"), str)
            or Path(changed[0]["path"]).resolve()
            != (path.parent / "vo_direction.json").resolve()):
        return ["narration-performance may change only this run's vo_direction.json"]
    requested = plan.get("resources")
    if (not isinstance(requested, dict) or set(requested) != {"tts_calls"}
            or type(requested["tts_calls"]) is not int or not 0 < requested["tts_calls"] <= 2):
        return ["narration-performance permits only one or two TTS calls"]
    return []


def active(state):
    return state.get("mode") == "production" and state.get("terminal_state") is None


def checkpoint(path, package, reason, blocker=None):
    state = read_state(path)
    if not active(state) or len(reason.strip()) < 20:
        return False, "checkpoint requires active production and a concrete next repair"
    errors = review_package_problems(state, package)
    if errors:
        return False, "; ".join(errors)
    state["phase"] = "active_repair"
    state.pop("release_status", None)
    state["repair_checkpoint"] = {"path": str(package.resolve()), "reason": reason,
                                 "film_sha256": state["deliverable"]["film_sha256"]}
    if blocker:
        state["repair_checkpoint"]["defect_ledger_sha256"] = digest(blocker)
    event(state, "repair_checkpoint", **state["repair_checkpoint"])
    save(path, state)
    return True, "checkpoint saved; production remains active and must continue to shipment"


def begin_repair(path, plan_path):
    """Reserve the board edit BEFORE modifying it, eliminating the old circular gate."""
    state = read_state(path)
    if not active(state):
        return False, "repair needs active production; reopen a legacy stopped run first"
    if state.get("active_repair"):
        return False, "finish the existing repair batch before starting another"
    plan = load_json(plan_path)
    from repair_guard import plan_problems, envelope_problems
    scope = plan.get("repair_scope", "standard")
    if not isinstance(scope, str) or scope not in SCOPES:
        return False, "unknown repair_scope"
    opening = {} if scope == NARRATION_SCOPE else {"reboards": 1, "storyboard_critics": 2}
    errors = plan_problems(state, plan) + envelope_problems(state, opening)
    if scope == NARRATION_SCOPE:
        errors += narration_plan_problems(path, plan)
        if not errors:
            errors += envelope_problems(state, plan["resources"])
        try:
            frozen_inputs = narration_inputs(path)
        except (OSError, ValueError, KeyError, TypeError) as exc:
            errors.append(f"narration-performance needs current story inputs: {exc}")
    if errors:
        return False, "; ".join(errors)
    for field in ("root_cause", "repair", "expected_visible_result", "mechanism_change"):
        if len(str(plan.get(field, "")).strip()) < 30:
            return False, f"repair plan needs concrete {field}, including all current defects"
    evidence = Path(plan["failure_evidence"])
    if not evidence.is_file() or digest(evidence) != plan.get("failure_evidence_sha256"):
        return False, "repair failure evidence is missing or changed"
    failure_hash = digest(evidence)
    # A new plan or different wording cannot charge another batch against one verdict.
    if any(e.get("kind") == "repair_started" and e.get("failure_sha256") == failure_hash
           for e in state["events"]):
        return False, "this failed attempt already owns a repair batch; reuse its reservations"
    baselines = []
    for item in plan.get("changed_inputs", []):
        source, before = Path(item["path"]), Path(item["before_path"])
        if (not source.is_file() or not before.is_file()
                or digest(source) != item.get("before_sha256")
                or digest(before) != item.get("before_sha256")):
            return False, "begin-repair requires retained, unchanged baseline inputs before editing"
        baselines.append({"path": str(source.resolve()), "before_path": str(before.resolve()),
                          "before_sha256": digest(before)})
    if not baselines:
        return False, "name the production inputs to change and preserve their baselines"
    # One board correction and two independent critic calls (plan, then actual phone cut).
    # They are allowances, not calls: the existing consume command charges before each use.
    grants = {}
    for name, count in opening.items():
        old = state["escalation_ceiling"][name]
        state["escalation_ceiling"][name] = max(state["escalation_ceiling"][name],
                                               state["usage"][name] + count)
        grants[name] = {"from": old, "to": state["escalation_ceiling"][name]}
    state["active_repair"] = {"failure_sha256": failure_hash, "baselines": baselines,
                             "plan": str(plan_path.resolve()), "plan_sha256": digest(plan_path),
                             "reboards_before": state["usage"]["reboards"], "repair_scope": scope}
    if scope == NARRATION_SCOPE:
        state["active_repair"].update(frozen_inputs=frozen_inputs, plan_identity=plan_identity(plan))
    state["phase"] = "active_repair"
    state.pop("release_status", None)
    event(state, "repair_started", failure_sha256=failure_hash,
          plan_sha256=digest(plan_path), baselines=baselines, grants=grants, repair_scope=scope,
          frozen_inputs=state["active_repair"].get("frozen_inputs"),
          plan_identity=state["active_repair"].get("plan_identity"),
          authorization="diagnosed repair within recorded run envelope" if state.get("repair_policy") else "legacy autonomous repair instruction 2026-09-26",
          mechanism_id=plan.get("mechanism_id"), failure_family=plan.get("failure_family", "unclassified"),
          director_identity=plan.get("director_identity"))
    save(path, state)
    if scope == NARRATION_SCOPE:
        return True, "narration-performance repair opened; change only direction before authorization"
    return True, "one structural repair batch opened; reserve its reboard before editing"


def authorize_repair(path, plan_path):
    state = read_state(path)
    current = state.get("active_repair")
    if not active(state) or not current:
        return False, "begin-repair must bind failure evidence and baseline before editing"
    scope = current.get("repair_scope", "standard")
    if not isinstance(scope, str) or scope not in SCOPES:
        return False, "unknown repair_scope"
    if scope != NARRATION_SCOPE and state["usage"]["reboards"] <= current["reboards_before"]:
        return False, "reserve the corrective reboard before changing production inputs"
    proof, error = repair_plan_evidence(state, "repair_batch", plan_path)
    if error:
        return False, error
    plan = proof["repair_plan"]
    if plan.get("repair_scope", "standard") != scope:
        return False, "repair_scope changed after begin-repair"
    if scope == NARRATION_SCOPE:
        errors = narration_plan_problems(path, plan)
        if plan_identity(plan) != current.get("plan_identity"):
            errors.append("narration-performance plan changed after begin-repair")
        try:
            if narration_inputs(path) != current.get("frozen_inputs"):
                errors.append("narration-performance changed frozen story or renderer inputs")
        except (OSError, ValueError, KeyError, TypeError):
            errors.append("narration-performance lost frozen story or renderer inputs")
        if errors:
            return False, "; ".join(errors)
    if plan["failure_evidence_sha256"] != current["failure_sha256"]:
        return False, "repair plan replaced the failed attempt"
    actual = sorted((str(Path(x["path"]).resolve()), x["before_sha256"])
                    for x in plan["changed_inputs"])
    expected = sorted((x["path"], x["before_sha256"]) for x in current["baselines"])
    if actual != expected:
        return False, "repair must change the inputs registered before the edit"
    requested = plan.get("resources")
    if not isinstance(requested, dict) or not requested:
        return False, "list the resources needed for this correction"
    batch = NARRATION_BATCH if scope == NARRATION_SCOPE else BATCH
    if any(name not in batch or type(n) is not int or not 0 < n <= batch[name]
           for name, n in requested.items()):
        return False, "repair request exceeds a bounded batch allowance"
    if ("panel_rounds" in requested or "scorer_calls" in requested) and (
            requested.get("panel_rounds") != 1 or requested.get("scorer_calls") != 3):
        return False, "a repair panel still requires all three independent scorers"
    from repair_guard import envelope_problems
    errors = envelope_problems(state, requested)
    if errors:
        return False, "; ".join(errors)
    grants = {}
    for name, count in requested.items():
        before = state["escalation_ceiling"][name]
        after = max(before, state["usage"][name] + count)
        state["escalation_ceiling"][name] = after
        grants[name] = {"from": before, "to": after}
    state.pop("active_repair")
    event(state, "repair_authorized", resource="repair_batch", grants=grants, repair_scope=scope, **proof)
    save(path, state)
    return True, "changed-input repair batch authorized; reserve each attempt before spending"


def pending(repo):
    """Find active editions across actual Git worktrees; never reset their ledgers."""
    output = subprocess.check_output(["git", "-C", str(repo), "worktree", "list", "--porcelain"], text=True)
    found = []
    for line in output.splitlines():
        if not line.startswith("worktree "):
            continue
        root = Path(line[9:])
        candidates = [root / "out/dispatch/run_state.json"]
        # A crash may leave only the committed checkpoint.
        candidates += list((root / "runs/review").glob("*/run_state.json"))
        candidates += list((root / "runs").glob("*/run_state.json"))
        for path in candidates:
            if not path.is_file():
                continue
            state = load_json(path)
            date = str(state.get("run_id", ""))[:10]
            if state.get("mode") != "production" or date < "2026-09-26":
                continue  # Historical archives retain their original contract.
            state = read_state(path)
            found.append({"run_id": state["run_id"], "state": str(path),
                          "worktree": str(root), "phase": state.get("phase"),
                          "legacy_terminal": state.get("terminal_state"),
                          "shipment_recorded": bool(state.get("shipment")),
                          "film_sha256": (state.get("deliverable") or {}).get("film_sha256")})
    # The mutable controller wins over the committed crash snapshot for each edition.
    found.sort(key=lambda x: (x["run_id"], "/out/dispatch/" not in x["state"]))
    unique = {}
    shipped = {item["run_id"] for item in found
               if item["legacy_terminal"] == "shipped" and item["shipment_recorded"]}
    for item in found:
        unique.setdefault(item["run_id"], item)
    return [item for item in unique.values() if item["run_id"] not in shipped]


def allowance_problems(state):
    """Reconstruct allowances from recorded actions; a hand-raised cap fails."""
    from run_controller import ceilings
    from repair_guard import owner_grant_problems
    errors = owner_grant_problems(state)
    if errors:
        return errors
    events = state.get("events", [])
    caps = ceilings()
    recorded_base = [e["ceiling_snapshot"] for e in events
                     if e.get("kind") == "initialised" and "ceiling_snapshot" in e]
    if recorded_base:
        if (len(recorded_base) != 1 or not isinstance(recorded_base[0], dict)
                or set(recorded_base[0]) != set(caps)
                or any(type(v) is not int or v < 0 for v in recorded_base[0].values())):
            return ["initial allocation snapshot is invalid"]
        caps = dict(recorded_base[0])
    elif events and str(state.get("run_id", ""))[:10] < "2026-09-29":
        # Pre-snapshot history used the old critic default. Empty history is
        # fresh initialization and is checked against current configuration.
        caps["storyboard_critics"] = 6
    if state.get("repair_policy"):
        frozen = [(i, e.get("envelope")) for i, e in enumerate(events)
                  if e.get("kind") == "resource_envelope_frozen"]
        if (len(frozen) != 1 or frozen[0][1] != state.get("resource_envelope")
                or not isinstance(frozen[0][1], dict)
                or set(frozen[0][1]) != set(caps)
                or any(type(v) is not int or v < 0 for v in frozen[0][1].values())):
            return ["recorded frozen resource envelope is missing or changed"]
        # New-run defaults must not rewrite old allocations. Legacy adoption
        # snapshots all prior grants; replay only events after that snapshot.
        index, envelope = frozen[0]
        caps = dict(envelope)
        events = events[index + 1:]
    for e in events:
        if e.get("kind") in {"repair_started", "repair_authorized"}:
            scope = e.get("repair_scope", "standard")
            if not isinstance(scope, str) or scope not in SCOPES:
                return ["unknown repair_scope in allowance history"]
        if e.get("kind") == "repair_started":
            if scope == NARRATION_SCOPE and (e.get("grants") or not e.get("frozen_inputs")
                                            or not e.get("plan_identity")):
                return ["narration-performance start must bind inputs without visual grants"]
            if not e.get("failure_sha256") or not e.get("plan_sha256") or not e.get("baselines"):
                return ["repair batch lacks bound failure or baseline evidence"]
            for name, grant in e.get("grants", {}).items():
                if name not in {"reboards", "storyboard_critics"}:
                    return ["repair start grants an unexpected resource"]
                count = 1 if name == "reboards" else 2
                if grant["from"] != caps[name] or not caps[name] <= grant["to"] <= caps[name] + count:
                    return ["repair start grants exceed the bounded batch"]
                caps[name] = grant["to"]
        elif e.get("kind") == "repair_authorized":
            if not e.get("repair_revision") or not e.get("repair_plan_sha256"):
                return ["repair authorization lacks changed-input evidence"]
            batch = NARRATION_BATCH if scope == NARRATION_SCOPE else BATCH
            for name, grant in e.get("grants", {}).items():
                if (name not in batch or grant["from"] != caps[name]
                        or not caps[name] <= grant["to"] <= caps[name] + batch[name]):
                    return ["repair authorization exceeds its batch"]
                caps[name] = grant["to"]
        elif e.get("kind") == "owner_review_grant":
            name = e["resource"]
            if e["previous_ceiling"] != caps[name]:
                return ["owner review grant lacks a matching allowance chain"]
            caps[name] = e["new_ceiling"]
        elif e.get("kind") in {"owner_preflight_extension", "owner_agent_extension"}:
            name = e["resource"]
            if not e.get("repair_revision") or e["previous_ceiling"] != caps[name]:
                return ["legacy owner extension lacks a matching evidence chain"]
            caps[name] = e["new_ceiling"]
    if caps != state["escalation_ceiling"]:
        return ["controller ceilings differ from the recorded repair allowances"]
    if any(state["usage"][k] > caps[k] for k in caps if k != "reported_tokens"):
        return ["unreserved work exceeded its recorded allowance"]
    return []
