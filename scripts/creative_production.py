"""Current creative decisions and their executable, source-bound evidence.

Hashes establish identity, never artistic quality. Existing independent critics and
the three audible final-film lenses judge whether these choices work on screen.
"""
from __future__ import annotations
import copy
import hashlib
import json
import math
from pathlib import Path

POLICY = Path(__file__).resolve().parents[1] / "config/creative_production.json"


def read(path):
    return json.loads(Path(path).read_text())


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def fingerprint(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def policy():
    return read(POLICY)


def required(board):
    return str(board.get("date") or "") >= policy()["effective_date"]


def treatment_required(board):
    return str(board.get("date") or "") >= policy()["treatment_effective_date"]


def treatment_problems(board):
    if not treatment_required(board):
        return []
    errors = []
    scenes = board.get("scenes", [])
    if (scenes and board.get("cinematic_template") == "editorial-v1"
            and all((s.get("picture") or {}).get("medium") in
                    {"source-still", "source-excerpt", "diagram"} for s in scenes)):
        errors.append("whole-film static source pictures and fading boxes need a different visual treatment before spending")
    edits = (board.get("creative_direction") or {}).get("edits", [])
    if len(edits) >= 3 and len({str(e.get("leave_on", "")).strip() for e in edits}) == 1:
        errors.append("repeated cut instructions do not direct the individual picture changes")
    return errors


def concrete(value, length=25):
    return isinstance(value, str) and len(value.strip()) >= length


def finite(value):
    return type(value) in (int, float) and math.isfinite(value)


def candidate_problems(selected):
    stakes = selected.get("visual_stakes") or {}
    errors = []
    for key in ("affected_person", "physical_subject", "visible_change", "consequence", "opening_question", "answer", "asset_fit"):
        if not concrete(stakes.get(key)):
            errors.append("selected story needs concrete visual_stakes." + key)
    sources = {s.get("url") for s in selected.get("sources", [])}
    if not stakes.get("source_urls") or not set(stakes["source_urls"]) <= sources:
        errors.append("visual stakes must bind fetched candidate sources")
    return errors


def scene_medium(board, scene):
    rows = (board.get("quality_plan") or {}).get("scenes", [])
    return next((r.get("medium") for r in rows if r.get("scene_id") == scene["id"]), None)


def plan_problems(board):
    if not required(board):
        return []
    plan = board.get("creative_direction") or {}
    errors = treatment_problems(board)
    if plan.get("policy_sha256") != digest(POLICY):
        errors.append("creative direction must bind the current dated policy")
    for key in ("viewer_question", "visible_answer", "emotional_turn", "medium_choice"):
        if not concrete(plan.get(key)):
            errors.append("creative direction lacks " + key)
    scenes = board.get("scenes", [])
    ids = [s["id"] for s in scenes]
    if [r.get("scene_id") for r in (board.get("quality_plan") or {}).get("scenes", [])] != ids:
        errors.append("current quality treatments must follow the complete scene order")
    cinema = board.get("cinema") or {}
    if cinema.get("version") != policy()["version"]:
        errors.append("cinema plan must use the current medium-neutral version")
    hero = cinema.get("hero_scene_id")
    end = cinema.get("hero_passage_end_scene_id", hero)
    if hero not in ids or end not in ids or ids.index(end) < ids.index(hero):
        errors.append("hero must name a complete ordered passage in the current film")
    for key in ("visible_action", "human_consequence", "source_limit"):
        if not concrete(cinema.get(key), 20):
            errors.append("cinema plan needs a concrete " + key)
    dimensional = [s["id"] for s in scenes if scene_medium(board, s) == "dimensional"]
    if cinema.get("dimensional_scene_ids", []) != dimensional:
        errors.append("dimensional scene inventory must match the chosen media; no quota applies")
    media = {m.get("file"): m for m in board.get("native_media", [])}
    edits = plan.get("edits") or []
    if [r.get("scene_id") for r in edits] != ids:
        errors.append("edit direction must cover the complete ordered sequence")
    for row in edits:
        for key in ("enter_on", "leave_on", "next_connection"):
            if not concrete(row.get(key)):
                errors.append("edit direction lacks a concrete " + key)
        scene = next((s for s in scenes if s["id"] == row.get("scene_id")), {})
        event = next((e for e in scene.get("visual_events", []) if e.get("id") == row.get("cut_after_event_id")), None)
        if (not event or not finite(event.get("at_s")) or not finite(event.get("duration_s"))
                or event["at_s"] + event["duration_s"] > float(scene.get("duration_s") or 0) + .001):
            errors.append("edit must resolve its actual picture event before the cut")
    for scene in scenes:
        sid = scene["id"]
        medium = scene_medium(board, scene)
        if medium not in policy()["media"]:
            errors.append(sid + " has no supported story-led medium")
        if board.get("cinematic_template") == "editorial-v1" and medium != "dimensional":
            picture = scene.get("picture") or {}
            if not picture.get("id") or scene.get("planes"):
                errors.append(sid + " source picture requires its real element id and no unused staging planes")
            if picture.get("medium") != medium:
                errors.append(sid + " renderer picture differs from its reviewed medium")
            if medium in ("source-footage", "source-still", "source-excerpt"):
                asset = media.get(picture.get("file"), {})
                if not asset or asset.get("sha256") != picture.get("sha256"):
                    errors.append(sid + " picture lacks the exact inspected source asset")
                if medium == "source-footage" and (not finite(picture.get("trim_start_s")) or picture["trim_start_s"] < 0):
                    errors.append(sid + " footage requires its source trim")
                if medium == "source-footage" and (not finite(picture.get("trim_end_s")) or not finite(picture.get("trim_start_s"))
                        or picture["trim_end_s"] - picture["trim_start_s"] < float(scene.get("duration_s") or 0)):
                    errors.append(sid + " footage trim must cover its complete scene at original speed")
                stage = picture.get("source_stage") or {}
                stage_valid = (all(finite(stage.get(k)) for k in ("x", "y", "width", "height"))
                               and 60 <= stage["x"] < stage["x"] + stage["width"] <= 890
                               and 280 <= stage["y"] < stage["y"] + stage["height"] <= 1240)
                if not stage_valid:
                    errors.append(sid + " source stage must exclude the editorial header, caption band and feed rail")
                focus = picture.get("focus")
                if stage_valid and focus and all(finite(focus.get(k)) for k in ("x", "y", "width", "height")):
                    if not (stage["x"] <= focus["x"] * 10.8
                            and (focus["x"] + focus["width"]) * 10.8 <= stage["x"] + stage["width"]
                            and stage["y"] <= focus["y"] * 19.2
                            and (focus["y"] + focus["height"]) * 19.2 <= stage["y"] + stage["height"]):
                        errors.append(sid + " source focus must remain inside its bounded picture stage")
                crop = picture.get("crop", {"x": 50, "y": 50})
                if any(not finite(crop.get(k)) or not 0 <= crop[k] <= 100 for k in ("x", "y")):
                    errors.append(sid + " source crop must lie inside its image")
            transform = picture.get("source_transform")
            if transform is not None and (
                    medium not in ("source-still", "source-excerpt")
                    or any(not finite(transform.get(k)) for k in ("scale", "translate_x", "translate_y"))
                    or not .5 <= transform.get("scale", 0) <= 1.5
                    or abs(transform.get("translate_x", 0)) > 500
                    or abs(transform.get("translate_y", 0)) > 500):
                errors.append(sid + " source framing must be a finite bounded static image transform")
            if not concrete(picture.get("disclosure"), 5):
                errors.append(sid + " picture requires a truthful source or illustration disclosure")
            if medium == "diagram":
                if picture.get("relationship") not in ("parallel", "sequence"):
                    errors.append(sid + " diagram must declare parallel or sequential source semantics")
                nodes = picture.get("nodes") or []
                if not 2 <= len(nodes) <= 4 or any(not n.get("label") or not n.get("claim_id") for n in nodes):
                    errors.append(sid + " diagram needs two to four source-bound nodes")
                claims = set(scene.get("vo_claims") or [])
                if any(n.get("claim_id") not in claims for n in nodes):
                    errors.append(sid + " diagram nodes must refer to the scene's sourced claims")
                if any(len(str(n.get("label") or "")) > 28 for n in nodes):
                    errors.append(sid + " diagram labels exceed their readable phone boxes")
            events = {e.get("id") for e in scene.get("visual_events", [])}
            if picture.get("event_id") not in events:
                errors.append(sid + " picture reveal must follow a current visual event")
            focus = picture.get("focus")
            if focus and (any(not finite(focus.get(k)) for k in ("x", "y", "width", "height"))
                          or not 0 <= focus["x"] < focus["x"] + focus["width"] <= 100
                          or not 0 <= focus["y"] < focus["y"] + focus["height"] <= 100):
                errors.append(sid + " focus annotation must stay inside the source picture")
            if medium in ("source-still", "source-excerpt") and not focus and not scene.get("intentional_hold"):
                errors.append(sid + " source image needs a motivated detail reveal or brief intentional hold")
            proof = scene.get("visual_proof") or {}
            refs = {r for item in proof.get("must_show", []) for r in item.get("item_ids", [])}
            if refs != {picture.get("id")} or not concrete(proof.get("mute_takeaway")):
                errors.append(sid + " visual proof must identify the actual rendered picture")
            if not concrete(picture.get("subject")):
                errors.append(sid + " picture needs the inspected subject that its critic verifies")
        hold = scene.get("intentional_hold")
        if hold and (sid == ids[0] or medium not in ("source-still", "source-excerpt") or not concrete(hold)
                     or float(scene.get("duration_s") or 0) > policy()["max_intentional_hold_s"]):
            errors.append(sid + " intentional hold must be a brief, justified source image")
    sound = plan.get("sound") or {}
    for key in ("perspective", "music_arc", "voice_arc"):
        if not concrete(sound.get(key)):
            errors.append("sound direction lacks " + key)
    cues = sound.get("cues") or []
    if not cues or len({c.get("id") for c in cues}) != len(cues):
        errors.append("sound direction needs unique motivated cues")
    events = {e.get("id"): s for s in scenes for e in s.get("visual_events", [])}
    for cue in cues:
        if cue.get("event_id") not in events or cue.get("role") not in ("environment", "contact", "sonification", "quiet"):
            errors.append("sound cue needs a current event and explicit audible role")
        if not concrete(cue.get("intent")) or not concrete(cue.get("provenance")):
            errors.append("sound cue needs audible intent and truthful provenance")
        if not finite(cue.get("duration_s")) or cue["duration_s"] <= 0:
            errors.append("sound cue needs a finite positive duration")
        if cue.get("event_id") in events and finite(cue.get("duration_s")):
            scene = events[cue["event_id"]]
            ev = next(e for e in scene["visual_events"] if e.get("id") == cue["event_id"])
            if float(ev.get("at_s") or 0) >= float(scene.get("duration_s") or 0):
                errors.append("sound cue starts outside its visible scene")
        if cue.get("role") == "quiet" and (not finite(cue.get("gain")) or not 0 <= cue["gain"] <= .5):
            errors.append("quiet cue must deliberately reduce the background bus")
    if not any(c.get("role") == "quiet" for c in cues):
        errors.append("sound direction needs one deliberate background contrast")
    return sorted(set(errors))


def opening_digest(board):
    """Retiming and measured captions do not invent a new opening concept."""
    scenes = copy.deepcopy(board["scenes"] if treatment_required(board) else board["scenes"][:1])
    for scene in scenes:
        for key in ("start_s", "duration_s", "duration_authored", "caption"):
            scene.pop(key, None)
        for ev in scene.get("visual_events", []):
            for key in ("at_s", "duration_s", "at_s_authored", "duration_s_authored"):
                ev.pop(key, None)
    content = {"scenes": scenes} if treatment_required(board) else {"scene": scenes[0]}
    return fingerprint({**content, "template": board.get("cinematic_template"),
                        "media": board.get("native_media", [])})


def opening_producer(legacy_orchestrator_sha256=None):
    repo = POLICY.parents[1]
    files = [repo / "scripts/opening_compare.py", repo / "video-engine/scripts/render-batch.mjs",
             repo / "video-engine/package-lock.json"]
    files += sorted(p for p in (repo / "video-engine/public/fonts").glob("*") if p.is_file())
    hashes = {str(p.relative_to(repo)): digest(p) for p in files}
    if legacy_orchestrator_sha256 is not None:
        hashes["scripts/opening_compare.py"] = legacy_orchestrator_sha256
    return fingerprint(hashes)


def opening_problems(board_path):
    board_path = Path(board_path)
    board = read(board_path)
    if not required(board):
        return []
    try:
        root = board_path.parent / "openings"
        receipt = read(root / "comparison.json")
        review = read(root / "selection.json")
        from critic_gate import renderer_digest
        errors = []
        if receipt.get("policy_sha256") != digest(POLICY) or (not treatment_required(board) and receipt.get("renderer_sha256") != renderer_digest(board)):
            errors.append("opening comparison uses stale policy or renderer inputs")
        from opening_compare import adoption_problems
        adopted = bool(receipt.get("inspection_adoption")) and not adoption_problems(receipt, root)
        if receipt.get("inspection_adoption") and not adopted:
            errors.append("retained opening inspection adoption is invalid")
        if receipt.get("producer_sha256") != opening_producer() and not adopted:
            errors.append("opening comparison uses stale capture tools or fonts")
        options = receipt["options"]
        from opening_compare import inspection_problems
        errors += inspection_problems(receipt, root, allow_bounded=True)
        ledger = read(board_path.with_name("run_state.json"))
        reservation = receipt["reservation"]
        event = ledger["events"][reservation["event_index"]]
        if (reservation["run_id"] != ledger["run_id"] or reservation["run_id"] != board.get("date")
                or event.get("kind") != "reserved" or event.get("resources") != {"preflight_renders": 1}
                or event.get("preflight_identity") != reservation["identity"]
                or event.get("note") != "two opening comparison batch"):
            errors.append("opening batch has no matching cumulative reservation")
        if (len(options) != policy()["opening_options"] or {r["id"] for r in options} != {"a", "b"}
                or len({r["concept_sha256"] for r in options}) != 2 or len({r["film"]["sha256"] for r in options}) != 2):
            errors.append("opening comparison must contain exactly two distinct concepts")
        for option in options:
            for key in ("board", "film"):
                ref = option[key]
                p = (root / ref["file"]).resolve()
                if not p.is_relative_to(root.resolve()) or digest(p) != ref["sha256"]:
                    errors.append("opening comparison evidence changed: " + key)
            option_board = read(root / option["board"]["file"])
            if treatment_required(board) and option.get("renderer_sha256") != renderer_digest(option_board):
                errors.append("opening treatment uses stale renderer inputs")
            if opening_digest(option_board) != option["concept_sha256"]:
                errors.append("opening concept does not match its board")
        comparison_hashes = {digest(root / "comparison.json")}
        if adopted:
            comparison_hashes.add(receipt["inspection_adoption"]["original_comparison"]["sha256"])
        if review.get("comparison_sha256") not in comparison_hashes:
            errors.append("opening choice belongs to different comparison bytes")
        chosen = next((r for r in options if r["id"] == review.get("selected")), None)
        if chosen and treatment_required(board) and chosen.get("renderer_sha256") != renderer_digest(board):
            errors.append("selected treatment renderer differs from the current film")
        if not chosen or chosen["concept_sha256"] != opening_digest(board):
            errors.append("current opening is not the selected concept")
        if not review.get("reviewer_identity") or review.get("reviewer_identity") == review.get("director_identity") or not review.get("director_identity"):
            errors.append("opening choice requires the existing independent phone critic")
        if review.get("director_identity") != (board.get("story_contract") or {}).get("director_identity"):
            errors.append("opening choice must identify the actual story director")
        if not concrete(review.get("reason")) or not concrete(review.get("rejected_reason")):
            errors.append("opening choice needs comparative observed reasons")
        from creative_release import review_allows
        if review.get("blocking_defects") != [] and not review_allows(board, review, board_path.parent, scope="phone"):
            errors.append("chosen opening has unresolved blocking defects")
        return errors
    except (OSError, ValueError, KeyError, TypeError, IndexError) as exc:
        return ["current two-opening evidence unavailable: " + str(exc)]


def voice_problems(board, plan):
    if not required(board):
        return []
    errors = []
    sound = (board.get("creative_direction") or {}).get("sound") or {}
    if plan.get("sound_direction_sha256") != fingerprint(sound):
        errors.append("voice direction is not bound to the current sound and performance arc")
    lines = plan.get("lines") or []
    scenes = board.get("scenes", [])
    if len(lines) != len(scenes):
        errors.append("voice director must cover every current narration line")
    for scene, line in zip(scenes, lines):
        for key in ("intent", "energy"):
            if not concrete(line.get(key), 12):
                errors.append("voice direction lacks specific line " + key)
        emphasis = str(line.get("emphasis") or "").strip()
        if not emphasis or emphasis.lower() not in str(scene.get("vo") or "").lower():
            errors.append("voice emphasis must name an exact phrase in the spoken line")
    return errors


def sound_timeline(board):
    events = {e["id"]: (s, e) for s in board["scenes"] for e in s.get("visual_events", [])}
    result = []
    for cue in board["creative_direction"]["sound"]["cues"]:
        scene, event = events[cue["event_id"]]
        start = float(scene["start_s"]) + float(event["at_s"])
        end = min(float(scene["start_s"]) + float(scene["duration_s"]), start + float(cue["duration_s"]))
        result.append({**cue, "at_s": start, "duration_s": end-start})
    return result


def mix_binding(board):
    return fingerprint({"sound": board["creative_direction"]["sound"], "timeline": sound_timeline(board)})


def picture_scene(board, scene):
    return required(board) and board.get("cinematic_template") == "editorial-v1" and scene_medium(board, scene) != "dimensional"


def mix_problems(board, report):
    if not required(board):
        return []
    errors = []
    try:
        expected = sound_timeline(board)
        binding = mix_binding(board)
    except (KeyError, TypeError, ValueError) as exc:
        return ["current sound direction is incomplete: " + str(exc)]
    if report.get("sound_direction_sha256") != binding:
        errors.append("mix was not executed from the current sound direction and picture clock")
    if report.get("sound_cues") != expected:
        errors.append("mix does not account for every directed sound cue")
    return errors
