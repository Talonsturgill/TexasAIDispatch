"""Nonrenewable resource envelope and visible-mechanism recurrence evidence."""
import argparse
import copy
import hashlib
import json
from pathlib import Path

VERSION = "quality-recovery/1"
OWNER_CONFIRMATION = "OWNER AUTHORIZED EXTRA STORYBOARD CRITIC CALLS"
OWNER_RESOURCE = "storyboard_critics"

def envelope_digest(envelope):
    return hashlib.sha256(json.dumps(envelope, sort_keys=True, separators=(",", ":")).encode()).hexdigest()

def authorization_problems(state, authorization, evidence_text):
    """Validate an operator-attested owner instruction, not an authenticated signature."""
    if not isinstance(authorization, dict):
        return ["owner authorization must be an object"]
    if (authorization.get("run_id") != state["run_id"]
            or authorization.get("resource") != OWNER_RESOURCE
            or type(authorization.get("additional_calls")) is not int
            or not 1 <= authorization["additional_calls"] <= 2):
        return ["owner authorization requires this run, storyboard_critics and exactly one or two calls"]
    if authorization.get("confirmation") != OWNER_CONFIRMATION:
        return ["owner authorization lacks explicit confirmation"]
    for field in ("approval_id", "owner_text", "source_message_reference"):
        if not isinstance(authorization.get(field), str) or not authorization[field].strip():
            return ["owner authorization requires " + field]
    if authorization.get("resource_envelope_sha256") != envelope_digest(state["resource_envelope"]):
        return ["owner authorization original resource envelope changed"]
    try:
        if hashlib.sha256(evidence_text.encode("utf-8")).hexdigest() != authorization.get("failure_evidence_sha256"):
            return ["owner authorization failure evidence changed"]
        failure = json.loads(evidence_text)
        if (not isinstance(failure, dict) or failure.get("verdict") != "revise"
                or not isinstance(failure.get("reviewer_identity"), str)
                or not failure["reviewer_identity"].strip()
                or not isinstance(failure.get("blocking_defects"), list)
                or not failure["blocking_defects"]):
            return ["owner authorization requires an identified critic rejection with blocking defects"]
    except (OSError, ValueError, TypeError):
        return ["owner authorization failure evidence is missing or unreadable"]
    return []

def owner_grant_problems(state):
    """Independently re-read retained authorization and rejection on every reservation."""
    grants = [e for e in state.get("events", []) if e.get("kind") == "owner_review_grant"]
    if not grants:
        return []
    if not enabled(state) or len(grants) != 1:
        return ["only one explicit owner review grant is allowed per frozen run"]
    frozen = [e.get("envelope") for e in state.get("events", [])
              if e.get("kind") == "resource_envelope_frozen"]
    if len(frozen) != 1 or frozen[0] != state.get("resource_envelope"):
        return ["owner review grant original envelope differs from its freeze event"]
    grant = grants[0]
    try:
        artifact = grant["authorization_json"]
        if not isinstance(artifact, str) or hashlib.sha256(artifact.encode("utf-8")).hexdigest() != grant["authorization_sha256"]:
            return ["retained owner authorization changed"]
        authorization = json.loads(artifact)
        evidence_text = grant["failure_evidence_json"]
        if not isinstance(evidence_text, str):
            return ["retained owner rejection evidence must contain exact JSON text"]
        errors = authorization_problems(state, authorization, evidence_text)
        if errors:
            return errors
        for key in ("approval_id", "run_id", "resource", "additional_calls", "failure_evidence_sha256"):
            if grant.get(key) != authorization.get(key):
                return ["owner review grant differs from its retained authorization"]
        if (type(grant.get("additional_calls")) is not int
                or type(grant.get("previous_ceiling")) is not int
                or type(grant.get("new_ceiling")) is not int
                or grant["previous_ceiling"] != state["resource_envelope"][OWNER_RESOURCE]
                or grant["new_ceiling"] != grant["previous_ceiling"] + grant["additional_calls"]):
            return ["owner review grant exceeds its exact authorized increment"]
    except (KeyError, OSError, ValueError, TypeError):
        return ["retained owner review authorization is missing or invalid"]
    return []

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
        return owner_grant_problems(state)
    freeze(state)
    recorded = [e["envelope"] for e in state["events"]
                if e.get("kind") == "resource_envelope_frozen"]
    if len(recorded) != 1 or recorded[0] != state["resource_envelope"]:
        return ["resource envelope differs from its original recorded allocation"]
    grant_errors = owner_grant_problems(state)
    if grant_errors:
        return grant_errors
    effective = dict(state["resource_envelope"])
    for grant in state["events"]:
        if grant.get("kind") == "owner_review_grant":
            effective[OWNER_RESOURCE] += grant["additional_calls"]
    errors = []
    for name, count in amounts.items():
        if state["usage"].get(name, 0) + count > effective.get(name, 0):
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
