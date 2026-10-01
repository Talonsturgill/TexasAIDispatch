"""Evidence-bound native excerpt expansion; never a different film or verdict."""
from __future__ import annotations
import copy
import json
from pathlib import Path
from creative_production import fingerprint, digest

SCOPE = "review-context"
FIELDS = ("hero_scene_id", "hero_passage_end_scene_id")
# Exact independent source audit is required in addition to this narrow admission.
TEMPLATES = {"pod-delivery-v1"}
BATCH = {"preflight_renders": 2, "full_renders": 1, "audiovisual_reviews": 4,
         "panel_rounds": 1, "scorer_calls": 3}


def read(path):
    return json.loads(Path(path).read_text())


def bound(ref):
    path = Path(ref["path"])
    if not path.is_file() or digest(path) != ref["sha256"]:
        raise ValueError("review-context evidence changed or missing")
    return path


def core(board):
    result = copy.deepcopy(board)
    for key in FIELDS:
        result["cinema"].pop(key, None)
    return result


def window(board):
    cinema = board["cinema"]
    return {"hero_scene_id": cinema["hero_scene_id"],
            "hero_passage_end_scene_id": cinema.get("hero_passage_end_scene_id", cinema["hero_scene_id"])}


def diagnosed_window(row, board):
    result = {key: row[key] for key in FIELDS}
    scenes = {s["id"]: s for s in board["scenes"]}
    first, last = scenes[result[FIELDS[0]]], scenes[result[FIELDS[1]]]
    expected = {"start_scene": first["id"], "end_scene": last["id"]}
    for key, value in expected.items():
        if key in row and row[key] != value:
            raise ValueError("diagnosed excerpt aliases disagree with scene ids")
    for key, value in (("start_s", float(first.get("start_s", 0))),
                       ("end_s", float(last.get("start_s", 0)) + float(last.get("duration_s", 0)))):
        if key in row and (type(row[key]) not in (int, float) or not abs(row[key] - value) < .001):
            raise ValueError("diagnosed excerpt clock disagrees with frozen board")
    return result


def expansion_problems(before, after, proposed):
    try:
        if core(before) != core(after):
            raise ValueError("review-context may change only the two hero window fields")
        if window(after) != proposed:
            raise ValueError("review-context range differs from the independent diagnosis")
        ids = [s["id"] for s in before["scenes"]]
        a, z = (ids.index(window(before)[key]) for key in FIELDS)
        b, y = (ids.index(proposed[key]) for key in FIELDS)
        if not 0 <= b <= a <= z <= y < len(ids) or (b, y) == (a, z):
            raise ValueError("review-context must strictly expand and retain the rejected passage")
        if y - b + 1 > 4:
            raise ValueError("review-context expansion is limited to four contiguous story scenes")
    except (KeyError, ValueError, TypeError) as exc:
        return [str(exc)]
    return []


def dependencies(path):
    from critic_gate import renderer_digest
    from render_manifest import engine_sha256, generated_media_sha256, PUBLIC
    from cinema_cache import picture_recipe
    board = read(path)
    recipe = picture_recipe(path, [0, round(float(board["runtime_s"]) * 30) - 1])
    public_assets = {p.relative_to(PUBLIC).as_posix(): digest(p) for p in sorted(PUBLIC.rglob("*")) if p.is_file()}
    return {"renderer_sha256": renderer_digest(board), "engine_sha256": engine_sha256(), "public_assets": public_assets,
            "media_sha256": generated_media_sha256(path), "environment": recipe.get("environment"),
            "recipe_engine": recipe.get("engine"), "recipe_media": recipe.get("media")}


def frozen_inputs(state_path, plan):
    root = state_path.parent
    names = ("vo_script.txt", "vo_direction.json", "claims.json", "story_selection.json",
             "preflight.mp4", "preflight.json", "storyboard_critic.json", "mix.wav", "mix.json",
             "captions.json", "align.json", "alignment.json", "alignment-evidence.json",
             "vo_alignment.json", "sfx_events.json", "audio-proof.json", "soundcheck.json",
             "vo_soundcheck.json", "native_media.json", "credits.txt", "music.json", "music-proof.json",
             "words.json", "voice.wav", "vo.wav", "voice-stem.wav", "mix_voice.wav")
    files = [root / n for n in names if (root / n).is_file()]
    for pattern in ("*alignment*", "*align*", "*asr*", "*soundcheck*"):
        files += [p for p in root.glob(pattern) if p.is_file()]
    required = {"vo_script.txt", "claims.json", "preflight.mp4", "preflight.json", "storyboard_critic.json", "mix.wav", "mix.json", "captions.json"}
    if not required.issubset({p.name for p in files}):
        raise ValueError("review-context requires current script, claims, mix and full phone evidence")
    inventories = {}
    for name in ("sources", "takes", "openings", "alignment", "audio"):
        files += sorted(p for p in (root / name).rglob("*") if p.is_file())
        inventories[str((root / name).resolve())] = sorted(str(p.resolve()) for p in (root / name).rglob("*") if p.is_file())
    for key in ("diagnosis", "failed_hero", "failure_response", "failed_proof"):
        files.append(bound(plan[key]))
    files.append(Path(plan["failure_evidence"]))
    return {"files": {str(p.resolve()): digest(p) for p in files}, "inventories": inventories,
            "dependencies": dependencies(root / "storyboard.json"),
            "core_sha256": fingerprint(core(read(root / "storyboard.json")))}


def unchanged(state_path, frozen):
    try:
        board = state_path.parent / "storyboard.json"
        return (all(digest(Path(p)) == sha for p, sha in frozen["files"].items())
                and all(sorted(str(p.resolve()) for p in Path(folder).rglob("*") if p.is_file()) == inventory
                        for folder, inventory in frozen["inventories"].items())
                and dependencies(board) == frozen["dependencies"]
                and fingerprint(core(read(board))) == frozen["core_sha256"])
    except (OSError, ValueError, KeyError, TypeError):
        return False


def plan_problems(state_path, plan):
    try:
        root = state_path.parent
        changed = plan["changed_inputs"]
        if len(changed) != 1 or Path(changed[0]["path"]).resolve() != (root / "storyboard.json").resolve():
            raise ValueError("review-context changes only this run storyboard.json")
        before_path = Path(changed[0]["before_path"])
        before = read(before_path)
        if digest(before_path) != changed[0]["before_sha256"]:
            raise ValueError("review-context baseline changed")
        diagnosis = read(bound(plan["diagnosis"]))
        receipt_path = Path(plan["failure_evidence"])
        if digest(receipt_path) != plan["failure_evidence_sha256"]:
            raise ValueError("review-context failure receipt changed")
        receipt = read(receipt_path)
        raw_path = bound(plan["failure_response"])
        raw = read(raw_path)
        review = json.loads("".join(p.get("text", "") for p in raw["candidates"][0]["content"]["parts"] if not p.get("thought")))
        hero = bound(plan["failed_hero"])
        proof = read(bound(plan["failed_proof"]))
        if (proof.get("board_sha256") != digest(before_path) or proof.get("hero", {}).get("sha256") != digest(hero)
                or proof.get("mix_sha256") != digest(root / "mix.wav")):
            raise ValueError("review-context rejected hero lacks exact native board and mix provenance")
        if (receipt.get("schema") != "dispatch_audiovisual_review/1" or receipt.get("role") != "hero"
                or receipt.get("review_scope") != "passage" or receipt.get("film_sha256") != digest(hero)
                or receipt["response"]["sha256"] != digest(raw_path)
                or not receipt.get("request_id") or not receipt.get("model") or not raw.get("responseId")
                or review.get("pass") is not False or review.get("audio_access") is not True
                or not review.get("defects")):
            raise ValueError("review-context requires the exact genuine rejected native hero")
        if (diagnosis.get("schema") != "dispatch-hero-context-diagnosis/1"
                or not diagnosis.get("reviewer_identity") or diagnosis["reviewer_identity"] == plan["director_identity"]
                or diagnosis["reviewer_identity"] != read(root / "storyboard_critic.json").get("reviewer_identity")
                or not diagnosis.get("reviewed_at") or len(diagnosis.get("source_basis", "")) < 30
                or len(diagnosis.get("context_explanation", "")) < 40):
            raise ValueError("review-context needs independent source-context diagnosis")
        bindings = {"board_sha256": digest(before_path), "phone_report_sha256": digest(root / "storyboard_critic.json"),
                    "phone_film_sha256": digest(root / "preflight.mp4"),
                    "failure_receipt_sha256": digest(receipt_path), "failure_response_sha256": digest(raw_path),
                    "failed_hero_sha256": digest(hero)}
        if diagnosis.get("bindings") != bindings or diagnosed_window(diagnosis["old_excerpt"], before) != window(before):
            raise ValueError("review-context diagnosis belongs to different evidence")
        from creative_release import payload_digest
        assessments = diagnosis["original_defect_assessments"]
        original = {payload_digest(x) for x in review["defects"]}
        assessed = [payload_digest(x["finding"]) for x in assessments]
        if (set(assessed) != original or len(assessed) != len(original)
                or any(x.get("category") not in {"excerpt-context", "retained-artistry"} for x in assessments)
                or not any(x.get("category") == "excerpt-context" for x in assessments)):
            raise ValueError("review-context diagnosis must cover every original finding without waiving integrity")
        dep = dependencies(before_path)
        if proof.get("engine_sha256") != dep["engine_sha256"]:
            raise ValueError("review-context rejected native engine differs from current renderer")
        audit = diagnosis["renderer_audit"]
        if (before.get("cinematic_template") not in TEMPLATES or audit.get("template") != before["cinematic_template"]
                or audit.get("renderer_sha256") != dep["renderer_sha256"]
                or audit.get("engine_sha256") != dep["engine_sha256"]
                or audit.get("non_rendered_fields") != ["cinema." + k for k in FIELDS]
                or len(audit.get("observed", "")) < 40):
            raise ValueError("review-context requires exact admitted-template non-rendered field audit")
        proposed = diagnosed_window(diagnosis["proposed_excerpt"], before)
        candidate = copy.deepcopy(before); candidate["cinema"].update(proposed)
        errors = expansion_problems(before, candidate, proposed)
        if errors:
            return errors
        from critic_gate import film_review_problems
        errors = film_review_problems(before, read(root / "storyboard_critic.json"), read(root / "preflight.json"),
                                     digest(before_path), digest(root / "preflight.mp4"))
        if errors or (read(root / "storyboard_critic.json").get("story_review") or {}).get("claims_sha256") != digest(root / "claims.json"):
            raise ValueError("review-context requires a current exact full-film independent phone pass")
        resources = plan.get("resources")
        if (not isinstance(resources, dict) or not resources or resources.get("preflight_renders", 0) < 1
                or resources.get("audiovisual_reviews", 0) < 1
                or any(k not in BATCH or type(v) is not int or not 0 < v <= BATCH[k] for k, v in resources.items())):
            raise ValueError("review-context requires charged native render and fresh hero review within the envelope")
        return []
    except (OSError, ValueError, KeyError, TypeError, IndexError, AttributeError) as exc:
        return ["review-context evidence invalid: " + str(exc)]


def phone_baseline(board_path):
    board_path = Path(board_path)
    from run_controller import read_state
    state_path = board_path.with_name("run_state.json")
    state = read_state(state_path)
    from production_lifecycle import allowance_problems
    if allowance_problems(state):
        raise ValueError("review-context allowance history invalid")
    for event in reversed(state.get("events", [])):
        if event.get("kind") != "repair_authorized" or event.get("repair_scope") != SCOPE:
            continue
        plan = event["repair_plan"]
        frozen = event["frozen_inputs"]
        if not unchanged(state_path, frozen) or plan_problems(state_path, plan):
            raise ValueError("review-context frozen inputs or diagnosis changed")
        item = plan["changed_inputs"][0]
        if digest(board_path) != item["after_sha256"]:
            raise ValueError("review-context current board changed after authorization")
        old = Path(item["before_path"])
        errors = expansion_problems(read(old), read(board_path), diagnosed_window(read(bound(plan["diagnosis"]))["proposed_excerpt"], read(old)))
        if errors:
            raise ValueError("; ".join(errors))
        return old
    raise ValueError("no authorized review-context repair for current board")


def phone_problems(board_path):
    from critic_gate import film_review_problems
    board_path = Path(board_path); root = board_path.parent
    board = read(board_path); report = read(root / "storyboard_critic.json")
    structural = read(root / "preflight.json"); film_hash = digest(root / "preflight.mp4")
    try:
        baseline = required_baseline(board_path)
    except (OSError, ValueError, KeyError, TypeError) as exc:
        return ["review-context frozen phone evidence invalid: " + str(exc)]
    if baseline is not None:
        return film_review_problems(read(baseline), report, structural, digest(baseline), film_hash)
    return film_review_problems(board, report, structural, digest(board_path), film_hash)


def required_baseline(board_path):
    """A current context scope cannot fall back to a newly rewritten passing report."""
    from run_controller import read_state
    if Path(board_path).name != "storyboard.json":
        return None
    state_path = Path(board_path).with_name("run_state.json")
    if not state_path.is_file():
        return None
    state = read_state(state_path)
    for event in reversed(state.get("events", [])):
        if event.get("kind") in {"repair_started", "repair_authorized"}:
            if event.get("repair_scope") == SCOPE:
                if state.get("active_repair"):
                    raise ValueError("review-context must be authorized before production continues")
                return phone_baseline(board_path)
            return None
    return None
