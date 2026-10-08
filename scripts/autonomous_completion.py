"""Audited owner-standing capacity for mandatory completion, never review approval."""
from __future__ import annotations

import copy
import hashlib
import json
from pathlib import Path

POLICY = Path(__file__).resolve().parents[1] / "config/autonomous_completion.json"
POLICY_SHA256 = "244d816a1239810909a3add2b78541fb7c6ebb56e84c7611ece2b31a393760e9"
MODERN_POLICY = POLICY.with_name('autonomous_completion_v2.json')
MODERN_POLICY_SHA256 = '8e43da161760b01520f6bce796bab3071ee3345a1cc63dd7ec04e42bdbfde81b'
EVENT = "mandatory_completion_grant"
ADOPTION = "autonomous_completion_adopted"
MAX_REQUIRED = {"reboards": 1, "storyboard_critics": 3, "preflight_renders": 3,
                "full_renders": 1, "audiovisual_reviews": 11, "panel_rounds": 1,
                "scorer_calls": 3, "tts_calls": 2, "voice_directors": 1}


def resource_requirements(state):
    result = dict(MAX_REQUIRED)
    if str(state.get('run_id', ''))[:10] >= '2026-10-08':
        result['image_generations'] = 2
    return result


def selected_policy(state):
    records = [e for e in state.get('events', [])
               if isinstance(e, dict) and e.get('kind') == ADOPTION]
    if records:
        return MODERN_POLICY if records[0].get('policy_sha256') == MODERN_POLICY_SHA256 else POLICY
    return MODERN_POLICY if str(state.get('run_id', ''))[:10] >= '2026-10-08' else POLICY


def sha(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"))


def policy_problems(text):
    """Pin approved public policy bytes and the digest of the private instruction."""
    if not isinstance(text, str) or sha(text) not in (POLICY_SHA256, MODERN_POLICY_SHA256):
        return ["standing completion policy is missing, mutated or not the approved version"]
    try:
        policy = json.loads(text)
        modern = sha(text) == MODERN_POLICY_SHA256
        expected = set(MAX_REQUIRED) | ({'image_generations'} if modern else set())
        if (policy["schema"] != ('dispatch_autonomous_completion/2' if modern else 'dispatch_autonomous_completion/1')
                or set(policy["eligible_resources"]) != expected):
            return ["standing completion policy schema or resource scope is invalid"]
    except (ValueError, KeyError, TypeError):
        return ["standing completion policy is unreadable"]
    return []


def adopt(state, policy_path=None, *, explicit_existing_run=False):
    """Future initialization or explicit existing-run opt-in; grants no calls."""
    from run_controller import event
    text = Path(policy_path or selected_policy(state)).read_text(encoding="utf-8")
    errors = policy_problems(text)
    if str(state.get('run_id', ''))[:10] >= '2026-10-08' and sha(text) != MODERN_POLICY_SHA256:
        errors.append('current production requires the modern completion policy; legacy capacity cannot waive its art floor')
    if errors:
        raise ValueError("; ".join(errors))
    if state.get("mode") != "production" or state.get("terminal_state") is not None:
        raise ValueError("standing completion adoption requires active unfinished production")
    if (str(state.get("run_id", ""))[:10] < json.loads(text)["effective_date"]
            and not explicit_existing_run):
        raise ValueError("standing completion policy does not rewrite historical editions")
    records = [e for e in state.get("events", []) if e.get("kind") == ADOPTION]
    if records:
        if len(records) != 1 or records[0].get("policy_sha256") != sha(text):
            raise ValueError("standing completion adoption is duplicated or changed")
        return
    event(state, ADOPTION, policy_json=text, policy_sha256=sha(text),
          authorization_source_label=json.loads(text)["authorization_source_label"],
          owner_source_text_sha256=json.loads(text)["owner_source_text_sha256"],
          explicit_existing_run=explicit_existing_run,
          grants_no_resources=True)


def mandatory_reason(state, plan, evidence_text):
    """Recheck retained evidence without relying on the director's category label."""
    from creative_release import findings, MOTION_ERRORS, finishing_required, payload_digest
    try:
        report = json.loads(evidence_text)
        director = plan["director_identity"]
        reviewer = report["reviewer_identity"]
        if not director or not reviewer or reviewer == director:
            return None
        if sha(evidence_text) != plan["failure_evidence_sha256"]:
            return None
        if set(plan.get("resources", {})) - set(resource_requirements(state)):
            return None
        original = findings(report)
        finish_requested = plan.get("completion_reason") == "finish-current"
        if not original:
            return "finish-current" if finish_requested and finishing_required(state) else None
        if report.get("verdict") != "revise":
            return None
        if plan.get("repair_scope") == "technical-integrity":
            rows = report["technical_repair"]["findings"]
            allowed = {"source", "rights", "legibility", "layout", "technical_audio", "captions", "runtime"}
            if (len(rows) == len({payload_digest(x) for x in original})
                    and {payload_digest(x["finding"]) for x in rows} == {payload_digest(x) for x in original}
                    and all(x["category"] in allowed for x in rows)):
                return "retained-integrity"
            return None
        film = report.get("film_sha256")
        if not isinstance(film, str) or len(film) != 64 or film != plan.get("failed_film_sha256"):
            return None
        modern = report.get('modern_observations') or {}
        if (str(state.get('run_id', ''))[:10] >= '2026-10-08'
                and modern.get('film_sha256') == film
                and any(isinstance(item, dict) and item.get('pass') is False for item in modern.values())):
            return 'modern-film-floor'
        if (report.get("phone_observations") or {}).get("dominant_action", {}).get("pass") is False:
            return "minimum-action"
        for finding in original:
            if isinstance(finding, dict):
                if finding.get("criterion") == "dominant_action":
                    return "minimum-action"
                problem = finding.get("problem", "")
            else:
                problem = finding
            if isinstance(problem, str) and any(pattern.search(problem) for pattern in MOTION_ERRORS):
                return "minimum-action"
        if finish_requested and finishing_required(state):
            # This protects outstanding final reviews, not a failed minimum
            # picture action or a new optional aesthetic repair.
            if not plan.get("changed_inputs"):
                return "finish-current"
    except (ValueError, KeyError, TypeError, AttributeError):
        return None
    return None


def replay(state):
    """Reconstruct only the effective envelope; the original allocation is immutable."""
    effective = copy.deepcopy(state.get("resource_envelope", {}))
    events = state.get("events", [])
    adopted, seen = False, set()
    try:
        for index, row in enumerate(events):
            kind = row.get("kind")
            if kind == ADOPTION:
                errors = policy_problems(row.get("policy_json"))
                if errors or adopted or row.get("policy_sha256") != sha(row.get('policy_json', '')) or row.get("grants_no_resources") is not True:
                    return effective, errors or ["standing completion adoption is invalid or duplicated"]
                policy = json.loads(row["policy_json"])
                if (row.get("authorization_source_label") != policy["authorization_source_label"]
                        or row.get("owner_source_text_sha256") != policy["owner_source_text_sha256"]):
                    return effective, ["standing completion authorization provenance changed"]
                if (str(state.get("run_id", ""))[:10] < "2026-10-03"
                        and row.get("explicit_existing_run") is not True):
                    return effective, ["standing completion policy cannot rewrite historical editions"]
                adopted = True
                adopted_sha = row['policy_sha256']
            elif kind == "owner_review_grant":
                effective[row["resource"]] += row["additional_calls"]
            elif kind == EVENT:
                if not adopted or row.get("run_id") != state.get("run_id"):
                    raise ValueError("grant without this run's standing authorization")
                if row.get("grants_no_review_approval") is not True:
                    raise ValueError("capacity cannot approve a review or a film")
                if policy_problems(row.get("policy_json")) or row.get("policy_sha256") != adopted_sha:
                    raise ValueError("mutated retained policy")
                if row.get("original_envelope_sha256") != sha(canonical(state["resource_envelope"])):
                    raise ValueError("original envelope changed")
                texts = [("plan_json", "plan_sha256"), ("failure_evidence_json", "failure_evidence_sha256"),
                         ("precheck_json", "precheck_sha256")]
                if any(sha(row[key]) != row[digest] for key, digest in texts):
                    raise ValueError("retained plan, precheck or evidence changed")
                plan = json.loads(row["plan_json"])
                # Replay eligibility at admission, before this grant changes caps
                # or later charged work changes the finishing threshold.
                admission = copy.deepcopy(state)
                admission["usage"] = row["usage_unchanged"]
                admission["escalation_ceiling"] = row["previous_ceiling"]
                admission["events"] = events[:index]
                reason = mandatory_reason(admission, plan, row["failure_evidence_json"])
                if reason is None or reason != row.get("reason"):
                    raise ValueError("optional or unclassified work cannot receive completion capacity")
                # One failed attempt owns one grant, even with renamed plan text.
                identity = row["failure_evidence_sha256"]
                if identity in seen:
                    raise ValueError("a failed attempt already owns completion capacity")
                seen.add(identity)
                budget = json.loads(row["precheck_json"])
                rows = budget["resources"]
                expected_required = resource_requirements(state)
                if set(rows) != set(expected_required):
                    raise ValueError("precheck omits required completion resources")
                usage = row["usage_unchanged"]
                if (set(usage) != set(state["usage"])
                        or any(type(n) is not int or n < 0 or n > state["usage"][k] for k, n in usage.items())):
                    raise ValueError("grant resets or invents usage")
                deficits = {}
                required = dict(expected_required)
                required["voice_directors"] = int(not usage.get("voice_directors", 0))
                if reason == "finish-current":
                    required.update(reboards=0, storyboard_critics=1,
                                    preflight_renders=2, audiovisual_reviews=8)
                    if 'image_generations' in required:
                        required['image_generations'] = 0
                for name, maximum in expected_required.items():
                    item = rows[name]
                    if (type(item["required"]) is not int or item["required"] != required[name]
                            or item["used"] != usage[name] or item["ceiling"] != effective[name]
                            or item["remaining"] != effective[name] - usage[name]):
                        raise ValueError("completion precheck allocation or required count is invalid")
                    if item["required"] > item["remaining"]:
                        deficits[name] = item["required"] - item["remaining"]
                if not deficits or deficits != budget["deficits"] or deficits != row["resource_increments"]:
                    raise ValueError("completion grant differs from the exact resource deficits")
                if row["previous_envelope"] != effective:
                    raise ValueError("completion envelope chain changed")
                effective = {k: n + deficits.get(k, 0) for k, n in effective.items()}
                if row["new_envelope"] != effective:
                    raise ValueError("completion grant adds resources outside its deficits")
                before, after = row["previous_ceiling"], row["new_ceiling"]
                if set(before) != set(effective) or after != {
                        k: max(n, effective[k]) if k in deficits else n for k, n in before.items()}:
                    raise ValueError("completion allowance chain changed")
    except (KeyError, TypeError, ValueError, AttributeError) as exc:
        return effective, ["invalid mandatory completion grant: " + str(exc)]
    return effective, []


def effective_envelope(state):
    result, errors = replay(state)
    if errors:
        raise ValueError("; ".join(errors))
    return result


def grant_capacity(state_path, plan_path, policy_path=None):
    """Grant only deficits, before the ordinary reservation charges any actual work."""
    from run_controller import read_state, save, event
    from repair_guard import envelope_problems, production_budget_precheck
    from production_lifecycle import allowance_problems
    state = read_state(Path(state_path))
    policy_path = policy_path or selected_policy(state)
    if state.get("mode") != "production" or state.get("terminal_state") is not None:
        return False, "completion capacity requires active production"
    errors = envelope_problems(state, {}) + allowance_problems(state)
    if errors:
        return False, "; ".join(errors)
    try:
        plan_text = Path(plan_path).read_text(encoding="utf-8")
        plan = json.loads(plan_text)
        evidence = Path(plan["failure_evidence"]).read_text(encoding="utf-8")
        reason = mandatory_reason(state, plan, evidence)
        if reason is None:
            return False, "completion capacity requires exact independent mandatory evidence; optional polish and research are excluded"
        if any(e.get("kind") == EVENT and e.get("failure_evidence_sha256") == sha(evidence) for e in state["events"]):
            return False, "this failed attempt already owns completion capacity; retain its grants and reservations"
        adopt(state, policy_path, explicit_existing_run=True)
        budget = production_budget_precheck(state, review_route="host", phone_complete=False,
                    minimum_action_failed=reason == "minimum-action",
                    mandatory_repair=reason in {"minimum-action", "retained-integrity", "modern-film-floor"})
        if not budget.get("resources"):
            return False, "completion precheck failed: " + "; ".join(budget.get("errors", []))
        increments = budget["deficits"]
        if not increments:
            save(Path(state_path), state)
            return True, "mandatory completion already has protected capacity; no resources added"
        old = effective_envelope(state)
        new = {k: n + increments.get(k, 0) for k, n in old.items()}
        caps = copy.deepcopy(state["escalation_ceiling"])
        raised = {k: max(n, new[k]) if k in increments else n for k, n in caps.items()}
        policy_text = Path(policy_path).read_text(encoding="utf-8")
        event(state, EVENT, run_id=state["run_id"], reason=reason,
              resource_increments=increments, previous_envelope=old, new_envelope=new,
              previous_ceiling=caps, new_ceiling=raised,
              original_envelope_sha256=sha(canonical(state["resource_envelope"])),
              usage_unchanged=copy.deepcopy(state["usage"]), policy_json=policy_text,
              policy_sha256=sha(policy_text), plan_json=plan_text, plan_sha256=sha(plan_text),
              failure_evidence_json=evidence, failure_evidence_sha256=sha(evidence),
              precheck_json=canonical(budget), precheck_sha256=sha(canonical(budget)),
              grants_no_review_approval=True)
        state["escalation_ceiling"] = raised
        errors = replay(state)[1] + allowance_problems(state)
        if errors:
            return False, "; ".join(errors)
        save(Path(state_path), state)
        return True, "mandatory completion capacity granted exact deficits: " + canonical(increments)
    except (OSError, ValueError, KeyError, TypeError) as exc:
        return False, "completion capacity could not bind policy, plan or evidence: " + str(exc)
