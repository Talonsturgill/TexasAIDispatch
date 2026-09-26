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
    for name, count in {"reboards": 1, "storyboard_critics": 2}.items():
        old = state["escalation_ceiling"][name]
        state["escalation_ceiling"][name] = max(state["escalation_ceiling"][name],
                                               state["usage"][name] + count)
        grants[name] = {"from": old, "to": state["escalation_ceiling"][name]}
    state["active_repair"] = {"failure_sha256": failure_hash, "baselines": baselines,
                             "plan": str(plan_path.resolve()), "plan_sha256": digest(plan_path),
                             "reboards_before": state["usage"]["reboards"]}
    state["phase"] = "active_repair"
    state.pop("release_status", None)
    event(state, "repair_started", failure_sha256=failure_hash,
          plan_sha256=digest(plan_path), baselines=baselines, grants=grants,
          authorization="owner standing autonomous repair instruction 2026-09-26")
    save(path, state)
    return True, "one structural repair batch opened; reserve its reboard before editing"


def authorize_repair(path, plan_path):
    state = read_state(path)
    current = state.get("active_repair")
    if not active(state) or not current:
        return False, "begin-repair must bind failure evidence and baseline before editing"
    if state["usage"]["reboards"] <= current["reboards_before"]:
        return False, "reserve the corrective reboard before changing production inputs"
    proof, error = repair_plan_evidence(state, "repair_batch", plan_path)
    if error:
        return False, error
    plan = proof["repair_plan"]
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
    if any(name not in BATCH or type(n) is not int or not 0 < n <= BATCH[name]
           for name, n in requested.items()):
        return False, "repair request exceeds a bounded batch allowance"
    if ("panel_rounds" in requested or "scorer_calls" in requested) and (
            requested.get("panel_rounds") != 1 or requested.get("scorer_calls") != 3):
        return False, "a repair panel still requires all three independent scorers"
    grants = {}
    for name, count in requested.items():
        before = state["escalation_ceiling"][name]
        after = max(before, state["usage"][name] + count)
        state["escalation_ceiling"][name] = after
        grants[name] = {"from": before, "to": after}
    state.pop("active_repair")
    event(state, "repair_authorized", resource="repair_batch", grants=grants, **proof)
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
    caps = ceilings()
    for e in state.get("events", []):
        if e.get("kind") == "repair_started":
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
            for name, grant in e.get("grants", {}).items():
                if (name not in BATCH or grant["from"] != caps[name]
                        or not caps[name] <= grant["to"] <= caps[name] + BATCH[name]):
                    return ["repair authorization exceeds its batch"]
                caps[name] = grant["to"]
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
