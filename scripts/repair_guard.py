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
        if isinstance(failure, dict) and failure.get("schema") == "dispatch_audiovisual_review/1":
            return av_rejection_problems(authorization, failure)
        if (not isinstance(failure, dict) or failure.get("verdict") != "revise"
                or not isinstance(failure.get("reviewer_identity"), str)
                or not failure["reviewer_identity"].strip()
                or not isinstance(failure.get("blocking_defects"), list)
                or not failure["blocking_defects"]):
            return ["owner authorization requires an identified critic rejection with blocking defects"]
    except (OSError, ValueError, TypeError):
        return ["owner authorization failure evidence is missing or unreadable"]
    return []

def av_rejection_problems(authorization, receipt):
    """Require an actual provider rejection, not a parser failure."""
    try:
        text = authorization["failure_response_json"]
        raw = json.loads(text)
        review = json.loads("".join(p.get("text", "") for p in
            raw["candidates"][0]["content"]["parts"] if not p.get("thought")))
        film_hash = authorization["failure_film_sha256"]
        if (not isinstance(film_hash, str) or len(film_hash) != 64
                or any(c not in "0123456789abcdef" for c in film_hash)
                or receipt.get("film_sha256") != film_hash
                or receipt.get("role") != "hero" or receipt.get("review_scope") != "passage"
                or not receipt.get("request_id") or not receipt.get("model") or not raw.get("responseId")
                or hashlib.sha256(text.encode("utf-8")).hexdigest() != receipt["response"]["sha256"]
                or review.get("pass") is not False or review.get("audio_access") is not True
                or not isinstance(review.get("defects"), list) or not review["defects"]):
            return ["owner authorization requires exact bound hero audiovisual rejection"]
    except (KeyError, ValueError, TypeError, IndexError, AttributeError):
        return ["owner authorization audiovisual rejection evidence is invalid"]
    return []


def owner_grant_problems(state):
    """Revalidate at most two explicit grants; accept historical single grants."""
    grants = [e for e in state.get("events", []) if e.get("kind") == "owner_review_grant"]
    if not grants:
        return []
    if not enabled(state) or len(grants) > 2:
        return ["at most two explicit owner review grants are allowed per frozen run"]
    frozen = [e.get("envelope") for e in state.get("events", [])
              if e.get("kind") == "resource_envelope_frozen"]
    if len(frozen) != 1 or frozen[0] != state.get("resource_envelope"):
        return ["owner review grant original envelope differs from its freeze event"]
    ceiling = state["resource_envelope"][OWNER_RESOURCE]
    seen = {key: set() for key in ("approval_id", "source_message_reference", "owner_text")}
    try:
        for index, grant in enumerate(grants):
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
            for key in seen:
                value = authorization[key].strip()
                if value in seen[key]:
                    return ["owner review grant replays an earlier owner instruction"]
                seen[key].add(value)
            if index and authorization.get("previous_grant_sha256") != envelope_digest(grants[index - 1]):
                return ["second owner review grant requires the exact prior grant digest"]
            for key in ("approval_id", "run_id", "resource", "additional_calls", "failure_evidence_sha256"):
                if grant.get(key) != authorization.get(key):
                    return ["owner review grant differs from its retained authorization"]
            if (type(grant.get("additional_calls")) is not int
                    or type(grant.get("previous_ceiling")) is not int
                    or type(grant.get("new_ceiling")) is not int
                    or grant["previous_ceiling"] != ceiling
                    or grant["new_ceiling"] != ceiling + grant["additional_calls"]):
                return ["owner review grant exceeds its exact authorized increment"]
            ceiling = grant["new_ceiling"]
    except (KeyError, OSError, ValueError, TypeError):
        return ["retained owner review authorization is missing or invalid"]
    return []


def production_budget_precheck(state, review_route="host", phone_complete=False):
    """Read-only complete remaining review path, including the final timed phone."""
    from creative_release import finishing_required
    finishing = finishing_required(state)
    if review_route not in ("host", "provider"):
        raise ValueError("unknown independent review route")
    required = {"reboards": 0 if finishing else 1,
                "storyboard_critics": (int(not phone_complete) if finishing else 3) if review_route == "host" else 0,
                "preflight_renders": 2 if finishing else 3,
                "full_renders": 1, "audiovisual_reviews": (7 if phone_complete else 8) if finishing else 11,
                "panel_rounds": 1, "scorer_calls": 3}
    # Charged synthesis can be a failed take. Always retain one take/soundcheck
    # pair in the conservative plan; spending history never proves reusable audio.
    required["tts_calls"] = 2
    required["voice_directors"] = int(not state.get("usage", {}).get("voice_directors", 0))
    snapshot = copy.deepcopy(state)
    if not enabled(snapshot) or "resource_envelope" not in snapshot:
        errors = ["production budget precheck requires an existing frozen envelope"]
    else:
        errors = envelope_problems(snapshot, {})
        from production_lifecycle import allowance_problems
        errors += allowance_problems(snapshot)
    if errors:
        return {"feasible": False, "errors": errors, "resources": {}, "deficits": {}}
    effective = dict(snapshot["resource_envelope"])
    for grant in snapshot["events"]:
        if grant.get("kind") == "owner_review_grant":
            effective[OWNER_RESOURCE] += grant["additional_calls"]
    rows = {name: {"required": count, "ceiling": effective.get(name, 0),
                   "used": snapshot["usage"].get(name, 0),
                   "remaining": effective.get(name, 0) - snapshot["usage"].get(name, 0)}
            for name, count in required.items()}
    deficits = {name: row["required"] - row["remaining"] for name, row in rows.items()
                if row["remaining"] < row["required"]}
    return {"feasible": not deficits, "errors": [], "resources": rows, "deficits": deficits,
            "review_route": review_route,
            "current_phone_reused": bool(phone_complete and finishing),
            "path": "finish-current" if finishing else "complete-visual-repair",
            "scope": "Conservative complete path including independent provider recovery, three separate scorers and one take/soundcheck pair. No allowance, voice reuse or shipment approval"}

def enabled(state):
    return state.get("repair_policy") == VERSION

def freeze(state):
    """Existing charged history survives adoption; no allowance is added."""
    from run_controller import event
    if enabled(state) and "resource_envelope" not in state:
        from production_lifecycle import allowance_problems
        legacy = copy.deepcopy(state)
        legacy.pop("repair_policy", None)
        errors = allowance_problems(legacy)
        if errors:
            raise ValueError("cannot freeze invalid legacy allowances: " + "; ".join(errors))
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
        retired = review.get("retired_mechanism_id")
        failed_mechanisms = {e.get("mechanism_id") for e in previous}
        if (review.get("verdict") != "pass"
                or not review.get("reviewer_identity")
                or review["reviewer_identity"] == plan["director_identity"]
                or not retired
                or retired not in failed_mechanisms
                or retired == mechanism
                or review.get("replacement_mechanism_id") != mechanism
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
