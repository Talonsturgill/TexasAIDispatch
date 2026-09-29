"""Shared observable criteria for planning, phone review and audiovisual lenses."""
import hashlib
import json
import math
from pathlib import Path
PATH = Path(__file__).resolve().parents[1] / "config/quality_contract.json"

def policy():
    return json.loads(PATH.read_text())

def required(board):
    return bool(board.get("quality_contract")) or str(board.get("date", "")) >= policy()["effective_date"]

def fingerprint():
    return hashlib.sha256(PATH.read_bytes()).hexdigest()

def prompt():
    p = policy()
    return "\n".join([p["version"], *[k + ": " + v for k, v in p["criteria"].items()], p["review_rule"]])


def phone_problems(board, report):
    if not required(board):
        return []
    errors = []
    if report.get("quality_contract_sha256") != fingerprint():
        errors.append("phone review does not bind the shared quality criteria")
    observations = report.get("phone_observations") or {}
    import creative_release as bounded
    for key in policy()["criteria"]:
        if key == "sound":
            continue  # A muted phone review must not invent audible evidence.
        item = observations.get(key) or {}
        start, end = item.get("start_s"), item.get("end_s")
        if ((item.get("pass") is not True and not bounded.artistic_observation(board, report, key)) or type(start) not in (int, float)
                or type(end) not in (int, float) or not math.isfinite(start)
                or not math.isfinite(end) or not 0 <= start < end
                or len(str(item.get("observed", "")).strip()) < 30):
            errors.append("phone review lacks passing timed " + key)
    if report.get("blocking_defects") and not bounded.review_allows(board, report):
        errors.append("unresolved observed defects remain in the phone review")
    return errors

def plan_problems(board):
    if not required(board):
        return []
    plan = board.get("quality_plan") or {}
    if plan.get("contract_sha256") != fingerprint():
        return ["visual treatment must bind the shared quality contract before preflight"]
    rows = plan.get("scenes") or []
    indexed = {r.get("scene_id"): r for r in rows if isinstance(r, dict)}
    errors = []
    for scene in board.get("scenes", []):
        row = indexed.get(scene.get("id"), {})
        for field in ("subject", "action", "consequence", "source_basis", "medium_evidence"):
            if len(str(row.get(field, "")).strip()) < 20:
                errors.append(str(scene.get("id")) + " lacks a filmable treatment: " + field)
        import creative_production as creative
        media = creative.policy()["media"] if creative.required(board) else ("dimensional", "source-footage", "source-excerpt", "diagram")
        if row.get("medium") not in media:
            errors.append(str(scene.get("id")) + " lacks an explicit production medium")
    return errors
