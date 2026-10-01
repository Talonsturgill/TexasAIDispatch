"""Finite artistic iteration; honest rejected evidence and delivery integrity remain.

This routes only explicitly classified artistic defects after the owner-set cap.
It never edits a score, original report, provider response or technical measurement.
Unknown defects and incomplete evidence stay blocking. Run the normal delivery path.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
POLICY = REPO / "config/creative_release.json"


def read(path):
    return json.loads(Path(path).read_text())


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def payload_digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":"),
                                     ensure_ascii=False).encode()).hexdigest()


def policy():
    return read(POLICY)


def technical_repair_problems(state, plan):
    from creative_production import treatment_required
    if not treatment_required({"date": str(state.get("run_id", ""))[:10]}):
        return ["technical repair accounting starts with the new treatment policy"]
    try:
        path = Path(plan["failure_evidence"])
        if digest(path) != plan["failure_evidence_sha256"]:
            raise ValueError("changed failure")
        report = read(path)
        rows = report["technical_repair"]["findings"]
        original = {payload_digest(x) for x in findings(report)}
        reviewer = report.get("reviewer_identity")
        allowed = {"source", "rights", "legibility", "layout", "technical_audio", "captions", "runtime"}
        if (not reviewer or reviewer == plan.get("director_identity") or not original
                or len(rows) != len(original)
                or {payload_digest(x["finding"]) for x in rows} != original
                or any(x["category"] not in allowed for x in rows)):
            raise ValueError("unclassified or artistic findings")
    except (OSError, ValueError, KeyError, TypeError):
        return ["technical repair needs independent classification of every exact failure; artistry stays creative"]
    return []


def creative_rounds(state):
    count = (state.get("usage") or {}).get("reboards", 0)
    if type(count) is not int:
        return count
    from creative_production import treatment_required
    if not treatment_required({"date": str(state.get("run_id", ""))[:10]}):
        return count
    # Exclude at most one charged reboard per predeclared technical batch.
    # Unpaired charges remain creative. Never rewrite cumulative usage.
    technical, pending = 0, False
    for event in state.get("events", []):
        if event.get("kind") == "repair_started":
            pending = event.get("repair_scope") in {"technical-integrity", "review-context"}
        elif event.get("kind") == "reserved" and event.get("resources", {}).get("reboards", 0):
            charged = event["resources"]["reboards"]
            if pending and type(charged) is int and charged > 0:
                technical += 1
            pending = False
        elif event.get("kind") == "repair_authorized":
            pending = False
    return max(0, count - technical)


def cap_reached(state):
    # Creative rounds are separate from charged technical corrections.
    count = creative_rounds(state)
    date = str(state.get("run_id", ""))[:10]
    return (state.get("mode") == "production"
            and bool(re.fullmatch(r"\d{4}-\d{2}-\d{2}", date))
            and date >= policy()["effective_date"]
            and type(count) is int and count >= policy()["max_creative_repair_rounds"])


def finishing_required(state):
    """Stop artistry before it consumes the remaining mandatory review path.

    The effective ceiling is the controller's frozen envelope plus replayed owner
    grants, never the current config default. run_discipline verifies that ledger.
    """
    if cap_reached(state):
        return True
    p = policy()
    usage = state.get("usage") or {}
    spent, rounds = usage.get("storyboard_critics", 0), usage.get("reboards", 0)
    ceiling = (state.get("escalation_ceiling") or {}).get("storyboard_critics")
    date = str(state.get("run_id", ""))[:10]
    return (state.get("mode") == "production" and bool(re.fullmatch(r"\d{4}-\d{2}-\d{2}", date))
            and date >= p["effective_date"] and all(type(x) is int for x in (spent, rounds, ceiling))
            and rounds >= p["min_prior_reboards_for_headroom_stop"]
            and spent >= p["min_prior_critics_for_headroom_stop"]
            and 0 <= ceiling - spent < p["next_complete_creative_round_critics"])


def eligible(board, root=None, state=None):
    try:
        state = state if state is not None else read(Path(root or REPO / "out/dispatch") / "run_state.json")
        from creative_production import treatment_problems
        return (not treatment_problems(board) and finishing_required(state)
                and str(board.get("date", "")) == str(state.get("run_id", ""))[:10])
    except (OSError, ValueError, TypeError):
        return False


def findings(report):
    """All explicit rejection findings, including nested story/attention reviews."""
    found = {}
    for owner in (report, report.get("story_review") or {}, report.get("attention_review") or {}):
        for key in ("blocking_defects", "defects", "hard_fails"):
            value = owner.get(key, [])
            if not isinstance(value, list):
                raise ValueError("review findings must be lists")
            for item in value:
                found[payload_digest(item)] = item
    for criterion, observation in (report.get("phone_observations") or {}).items():
        if observation.get("pass") is not True:
            item = {"phone_observation": criterion, "observation": observation}
            found[payload_digest(item)] = item
    return list(found.values())


def assessment_problems(assessment, report, scope):
    errors = []
    if assessment.get("schema") != "dispatch_creative_assessment/1" or assessment.get("scope") != scope:
        errors.append("wrong artistic assessment schema or scope")
    checks = assessment.get("retained_checks") or {}
    for key in policy()["retained_checks"].get(scope, ["invalid_scope"]):
        item = checks.get(key) or {}
        if item.get("pass") is not True or len(str(item.get("observed", "")).strip()) < 20:
            errors.append("retained integrity unproven: " + key)
    rows = assessment.get("defects")
    if not isinstance(rows, list):
        return errors + ["artistic assessment must enumerate every original finding"]
    try:
        original = {payload_digest(x) for x in findings(report)}
        assessed = [payload_digest(x["finding"]) for x in rows]
        if set(assessed) != original or len(set(assessed)) != len(assessed):
            errors.append("assessment does not cover the exact original findings once")
        for row in rows:
            if row.get("category") not in policy()["defer_categories"]:
                errors.append("non-artistic or unknown finding remains blocking")
            finding = row.get("finding")
            if (isinstance(finding, dict) and "phone_observation" in finding
                    and finding["phone_observation"] not in {"dominant_action", "surface_finish", "closing_payoff"}):
                errors.append("retained phone criterion remains blocking")
        if not original and (scope != "panel" or assessment.get("score_only") is not True
                             or (report.get("attention_review") or {}).get("pass") is False):
            errors.append("empty findings need an explicit score-only assessment")
    except (ValueError, TypeError, KeyError):
        errors.append("malformed artistic findings")
    return errors


def bound(root, file, sha):
    path = (root / str(file or "")).resolve()
    if not path.is_relative_to(root.resolve()) or not path.is_file() or digest(path) != sha:
        raise ValueError("assessment evidence is missing, changed or outside package")
    return path


def review_allows(board, report, root=None, scope="phone", *, embedded=False):
    """Separate release eligibility from an unchanged creative rejection.

    embedded=True is only for the parsed, hash-verified original provider response
    or each independently authored panel judge. Existing callers still check its
    exact film, identities, timestamps, source bindings and observation coverage.
    """
    root = Path(root or REPO / "out/dispatch")
    if not eligible(board, root):
        return False
    from creative_production import treatment_required
    if (treatment_required(board) and scope == "phone"
            and (report.get("phone_observations") or {}).get("dominant_action", {}).get("pass") is False):
        return False
    try:
        if embedded:
            assessment = report.get("bounded_release") or {}
        else:
            assessment = read(root / "creative-assessments" / (payload_digest(report) + ".json"))
            source = bound(root, assessment.get("report_file"), assessment.get("report_sha256"))
            if payload_digest(read(source)) != payload_digest(report):
                return False
            if assessment.get("report_payload_sha256") != payload_digest(report):
                return False
            film = bound(root, assessment.get("film_file"), assessment.get("film_sha256"))
            expected = (report.get("reviewed_preflight_sha256") or report.get("film_sha256")
                        or report.get("selected_film_sha256"))
            if expected and digest(film) != expected:
                return False
            from critic_gate import concept_digest
            if assessment.get("concept_sha256") != concept_digest(board):
                return False
            if assessment.get("claims_sha256") != digest(root / "claims.json"):
                return False
            identity = assessment.get("reviewer_identity")
            director = (board.get("story_contract") or {}).get("director_identity")
            if not identity or identity == director or not assessment.get("reviewed_at"):
                return False
            # Classification belongs to the reviewer of this exact evidence.
            if report.get("reviewer_identity") and identity != report["reviewer_identity"]:
                return False
        return not assessment_problems(assessment, report, scope)
    except (OSError, ValueError, TypeError, KeyError):
        return False


def artistic_observation(board, report, criterion, root=None):
    # Recognition, causal truth and continuity remain non-deferrable.
    from creative_production import treatment_required
    if treatment_required(board) and criterion == "dominant_action":
        return False
    return criterion in {"dominant_action", "surface_finish", "closing_payoff"} and review_allows(board, report, root)


MOTION_ERRORS = (
    re.compile(r"scene \S+ declares (?:motion|revelation) but changes only [\d.]+ of pixel range\. It is a held slide in the animatic\."),
    re.compile(r"the first two seconds change only [\d.]+ of pixel range\. The declared hook did not become visible motion or revelation\."),
)


def structural_allows(board, report, root=None):
    """Only the measured motion floor; wrong dimensions/duration/bytes still fail."""
    from creative_production import treatment_required
    if treatment_required(board):
        return False
    problems = report.get("problems")
    if not eligible(board, root) or not isinstance(problems, list) or not problems:
        return False
    return all(isinstance(p, str) and any(r.fullmatch(p) for r in MOTION_ERRORS) for p in problems)


def panel_allows(board_path, report_path):
    """The complete genuine panel remains, including every original score/failure."""
    board_path, report_path = Path(board_path), Path(report_path)
    try:
        board, report = read(board_path), read(report_path)
        judges = report.get("judges")
        if not eligible(board, report_path.parent) or not isinstance(judges, list) or len(judges) != 3:
            return False
        # Aggregate-only defects may come from technical publication gates: never defer them.
        actual = {str(x) for j in judges for x in j.get("hard_fails", [])}
        if set(map(str, report.get("hard_fails", []))) != actual:
            return False
        return all(review_allows(board, judge, report_path.parent, "panel", embedded=True) for judge in judges)
    except (OSError, ValueError, TypeError, KeyError):
        return False


def assessment_prompt(scope):
    checks = ", ".join(policy()["retained_checks"][scope])
    cats = ", ".join(policy()["defer_categories"])
    return ("Keep your genuine pass/reject verdict and all defects. Also return bounded_release with "
            "schema dispatch_creative_assessment/1, scope " + scope + ", retained_checks keyed by " + checks +
            ", each {pass:boolean, observed:specific evidence at least20 characters}; defects as "
            "[{finding:exact original defect object or string,category:category}]. Cover every original "
            "defect exactly once. Artistic categories: " + cats + ". For factual, rights, unreadability, "
            "misleading implication, technical audio or caption defects use a non-artistic category, "
            "which remains blocking. If no defects exist, use defects:[] and score_only:true. "
            "This classification never asks you to change scores, invent access, or report a pass.")


def package_assessments(source, destination):
    """Retain separate assessments and all referenced original evidence at delivery."""
    import shutil
    source, destination = Path(source).resolve(), Path(destination).resolve()
    for item in (source / "creative-assessments").glob("*.json"):
        assessment = read(item)
        files = [item]
        for key in ("report", "film"):
            files.append(bound(source, assessment.get(key + "_file"), assessment.get(key + "_sha256")))
        for file in files:
            target = destination / file.relative_to(source)
            target.parent.mkdir(parents=True, exist_ok=True)
            if target.exists() and digest(target) != digest(file):
                raise ValueError("refusing to replace different packaged rejection evidence")
            shutil.copy2(file, target)


def release_record(root, board, report):
    """Disclose every retained artistic deferral, even if the later panel passes."""
    root = Path(root).resolve()
    if not eligible(board, root):
        return None
    evidence = []
    for path in sorted((root / "creative-assessments").glob("*.json")):
        assessment = read(path)
        original = bound(root, assessment.get("report_file"), assessment.get("report_sha256"))
        film = bound(root, assessment.get("film_file"), assessment.get("film_sha256"))
        evidence.append({"assessment_file": str(path.relative_to(root)), "assessment_sha256": digest(path),
                         "report_file": str(original.relative_to(root)), "report_sha256": digest(original),
                         "film_file": str(film.relative_to(root)), "film_sha256": digest(film),
                         "defects": assessment.get("defects", [])})
    proof_path = root / "cinema/proof.json"
    native = read(proof_path).get("bounded_creative_findings", []) if proof_path.is_file() else []
    rejected_av = []
    for path in sorted((root / "cinema").glob("*-review.json")):
        receipt = read(path)
        response = bound(path.parent, receipt["response"]["file"], receipt["response"]["sha256"])
        data = read(response)
        review = json.loads("".join(p.get("text", "") for p in data["candidates"][0]["content"]["parts"] if not p.get("thought")))
        if review.get("pass") is False:
            rejected_av.append({"receipt_file": str(path.relative_to(root)), "receipt_sha256": digest(path),
                                "defects": review.get("defects", [])})
    from run_controller import threshold
    # Use the same supported score aliases and rubric source as release authorization.
    # Older valid report shapes can omit the convenience `ship` field.
    score = float(report.get("score") or report.get("weighted_score") or 0)
    panel_deferred = report.get("ship") is False or score < threshold() or bool(report.get("hard_fails"))
    if not (evidence or native or rejected_av or panel_deferred):
        return None
    return {"schema": "dispatch_bounded_release/1", "publication_mode": "bounded_creative_release",
            "policy_sha256": digest(POLICY), "repair_rounds": creative_rounds(read(root / "run_state.json")),
            "assessments": evidence, "native_findings": native, "rejected_audiovisual_reviews": rejected_av,
            "original_panel_score": score, "original_panel_ship": report.get("ship"),
            "original_panel_hard_fails": report.get("hard_fails", []),
            "notice": "Released after the finite creative repair cap; original artistic rejections remain visible. Integrity and shipment checks remain required."}


def template(board_path, report_path, film, scope, output):
    root = Path(board_path).parent.resolve()
    board, report = read(board_path), read(report_path)
    from critic_gate import concept_digest
    result = {"schema": "dispatch_creative_assessment/1", "scope": scope,
              "report_file": str(Path(report_path).resolve().relative_to(root)),
              "report_sha256": digest(report_path), "report_payload_sha256": payload_digest(report),
              "film_file": str(Path(film).resolve().relative_to(root)), "film_sha256": digest(film),
              "concept_sha256": concept_digest(board), "claims_sha256": digest(root / "claims.json"),
              "reviewer_identity": "", "reviewed_at": "",
              "retained_checks": {k: {"pass": False, "observed": ""} for k in policy()["retained_checks"][scope]},
              "defects": [{"finding": x, "category": "unclassified"} for x in findings(report)],
              "score_only": not bool(findings(report))}
    output = Path(output) if output else root / "creative-assessments" / (payload_digest(report) + ".json")
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("x") as f:
        f.write(json.dumps(result, indent=2, ensure_ascii=False) + "\n")
    return output


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--template", action="store_true")
    p.add_argument("--board", type=Path, required=True)
    p.add_argument("--report", type=Path, required=True)
    p.add_argument("--film", type=Path)
    p.add_argument("--scope", choices=("phone", "av", "panel"), default="phone")
    p.add_argument("--output", type=Path)
    a = p.parse_args()
    if a.template:
        if not a.film:
            p.error("--template requires --film")
        print(template(a.board, a.report, a.film, a.scope, a.output))
        return 0
    allowed = review_allows(read(a.board), read(a.report), a.board.parent, a.scope)
    print("bounded creative eligibility: " + ("eligible; original rejection retained" if allowed else "not eligible"))
    return 0 if allowed else 1


if __name__ == "__main__":
    raise SystemExit(main())
