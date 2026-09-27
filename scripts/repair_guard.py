"""Nonrenewable resource envelope and visible-mechanism recurrence evidence."""
import argparse
import copy
import json
from pathlib import Path

VERSION = "quality-recovery/1"

def enabled(state):
    return state.get("repair_policy") == VERSION

def freeze(state):
    """Existing charged history survives adoption; no allowance is added."""
    from run_controller import event
    if enabled(state) and "resource_envelope" not in state:
        state["resource_envelope"] = copy.deepcopy(state["escalation_ceiling"])
        event(state, "resource_envelope_frozen", envelope=state["resource_envelope"],
              telemetry_scope="External provider tokens only; Codex/account consumption is separate")

def envelope_problems(state, amounts):
    if not enabled(state):
        return []
    freeze(state)
    recorded = [e["envelope"] for e in state["events"]
                if e.get("kind") == "resource_envelope_frozen"]
    if len(recorded) != 1 or recorded[0] != state["resource_envelope"]:
        return ["resource envelope differs from its original recorded allocation"]
    errors = []
    for name, count in amounts.items():
        if state["usage"].get(name, 0) + count > state["resource_envelope"].get(name, 0):
            errors.append(name + " exceeds the nonrenewable run envelope")
    return errors

def plan_problems(state, plan):
    if not enabled(state):
        return []
    mechanism = str(plan.get("mechanism_id", "")).strip()
    if not mechanism:
        return ["repair requires a stable visible mechanism_id across revisions"]
    if len(str(plan.get("director_identity", "")).strip()) == 0:
        return ["repair requires director identity"]
    # Group by independent rejection evidence as well as the producer's name.
    # A renamed mechanism cannot reset an unclassified sequence.
    family = str(plan.get("failure_family", "unclassified"))
    allowed = {"human-performance", "capture-and-analysis", "document-handling",
               "source-framing", "continuity", "unclassified"}
    if family not in allowed:
        return ["failure_family must use the shared rejection taxonomy"]
    previous = [e for e in state["events"] if e.get("kind") == "repair_started"
                and (e.get("mechanism_id") == mechanism
                     or e.get("failure_family", "unclassified") == family)]
    if len(previous) < 2:
        return []
    from run_controller import digest
    try:
        ref = plan["pivot_review"]
        p = Path(ref["path"])
        if digest(p) != ref["sha256"]:
            return ["pivot review evidence changed"]
        review = json.loads(p.read_text())
        known = {e["failure_sha256"] for e in previous}
        if (review.get("verdict") != "pass"
                or not review.get("reviewer_identity")
                or review["reviewer_identity"] == plan["director_identity"]
                or not review.get("retired_mechanism_id")
                or not review.get("replacement_mechanism_id")
                or review["replacement_mechanism_id"] == mechanism
                or not known.issubset(set(review.get("reviewed_failure_sha256", [])))
                or len(str(review.get("visible_difference", "")).strip()) < 40
                or len(str(review.get("source_basis", "")).strip()) < 30):
            return ["repeated mechanism requires independent source-backed replacement review"]
    except (KeyError, OSError, ValueError, TypeError):
        return ["two failed repairs require a hash-bound independent medium or story pivot"]
    return []

def main():
    from run_controller import read_state, save
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--state", type=Path, required=True)
    ap.add_argument("--adopt", action="store_true")
    args = ap.parse_args()
    state = read_state(args.state)
    if args.adopt:
        state["repair_policy"] = VERSION
        freeze(state)
        save(args.state, state)
    print(json.dumps({"policy": state.get("repair_policy"),
                      "usage": state["usage"],
                      "envelope": state.get("resource_envelope"),
                      "account_usage": "Not measured by provider telemetry; inspect host usage separately"},
                     indent=2))

if __name__ == "__main__":
    main()
