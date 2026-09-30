#!/usr/bin/env python3
"""Fail closed on missing cinematic pixels, finished previews and audiovisual evidence."""
from __future__ import annotations
import argparse
import json
import math
import os
import subprocess
import sys
from pathlib import Path
import numpy as np
from PIL import Image
from render_manifest import file_sha256 as digest, engine_sha256, generated_media_sha256
from preflight_animatic import frame, probe, FFMPEG
from vo_soundcheck import TARGET_LUFS

REPO = Path(__file__).resolve().parents[1]
POLICY = REPO / "config/cinematic_production.json"

def policy_path(board=None):
    import creative_production as creative
    return creative.POLICY if board and creative.required(board) else POLICY

def policy(board=None):
    return json.loads(policy_path(board).read_text())

def required(board):
    return bool(board.get("cinema")) or str(board.get("date") or "") >= policy()["effective_date"]

def read(path):
    return json.loads(Path(path).read_text())

def finite(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)

def image(path):
    with Image.open(path) as im:
        if im.size != (1080, 1920):
            raise ValueError("cinematic proof must use full-resolution frames")
        return np.asarray(im.convert("RGB").resize((270, 480)), dtype=float)

def plan_problems(board):
    import creative_production as creative
    if creative.required(board):
        return creative.plan_problems(board)
    if not required(board):
        return []
    plan = board.get("cinema") or {}
    scenes = {s["id"]: s for s in board.get("scenes", [])}
    ids = plan.get("dimensional_scene_ids") or []
    errors = []
    if plan.get("version") != policy()["version"]:
        errors.append("cinema plan must use the current production version")
    if not isinstance(ids, list) or len(set(ids)) != len(ids) or any(i not in scenes for i in ids):
        return errors + ["dimensional_scene_ids must name unique current scenes"]
    if not scenes or next(iter(scenes)) not in ids:
        errors.append("the opening scene must use CinematicStage")
    if plan.get("hero_scene_id") not in ids:
        errors.append("the hero scene must be a dimensional story scene")
    passage_end = plan.get("hero_passage_end_scene_id", plan.get("hero_scene_id"))
    if passage_end not in ids:
        errors.append("hero passage must end on a dimensional story scene")
    elif plan.get("hero_scene_id") in ids:
        ordered = list(scenes)
        if ordered.index(passage_end) < ordered.index(plan.get("hero_scene_id")):
            errors.append("hero passage cannot end before its opening scene")
        if not all(sid in ids for sid in ordered[ordered.index(plan.get("hero_scene_id")):ordered.index(passage_end)+1]):
            errors.append("every hero passage scene must have dimensional stage coverage")
    coverage = sum(float(scenes[i]["duration_s"]) for i in ids)
    if coverage < float(board.get("runtime_s") or 0) * policy()["min_dimensional_runtime_share"]:
        errors.append("dimensional action must cover the required share of story runtime")
    for key in ("visible_action", "human_consequence", "source_limit"):
        if len(str(plan.get(key) or "").strip()) < 20:
            errors.append("cinema plan needs a concrete " + key)
    return errors

def asset(root, item):
    p = (root / item["file"]).resolve()
    if not p.is_relative_to(root.resolve()) or not p.is_file() or digest(p) != item["sha256"]:
        raise ValueError("cinematic evidence file missing, changed or outside its package")
    return p

def stage_sample_problems(board, root, samples, film=None, deferred=None, observations=None):
    """Measure the principal picture, independent of its chosen medium."""
    from cinema_cache import sample_frames
    import creative_production as creative
    errors = []
    schedule = sample_frames(board)
    ids = list(schedule)
    if sorted(samples) != sorted(ids):
        return ["cinematic proof must cover every required picture scene"]
    scenes = {s["id"]: s for s in board["scenes"]}
    for sid in ids:
        scene = scenes[sid]
        pair = samples[sid]
        times = [f / 30 for f in schedule[sid]]
        current_policy = creative.required(board)
        if len(pair) != len(times) or (current_policy and len(times) != 3):
            errors.append(sid + " lacks the complete principal-picture sample schedule")
            continue
        effects = []
        for idx, at in enumerate(times):
            normal = image(asset(root, pair[idx]["normal"]))
            removed = image(asset(root, pair[idx]["without_stage"]))
            effect = normal - removed
            effects.append(effect)
            area = float((np.max(np.abs(effect), axis=2) > 12).mean())
            # The event's onset is a measured baseline: a reveal can begin empty.
            # Mid-action and completion must each independently meet the same floor.
            occupancy_required = not current_policy or idx > 0
            if current_policy and observations is not None:
                from cinema_cache import principal_event
                event = principal_event(board, scene)
                measurement = {"scene_id": sid, "event_id": event["id"],
                    "phase": ("onset", "midpoint", "completion")[idx], "at_s": at,
                    "visible_pixel_share": area, "occupancy_required": occupancy_required,
                    "required_pixel_share": policy(board)["min_stage_pixel_share"]}
                if event.get("admitted_action_id"):
                    measurement.update({"admitted_action_id": event["admitted_action_id"],
                                        "source_event_ids": event["source_event_ids"]})
                observations.append(measurement)
            if occupancy_required and area < policy(board)["min_stage_pixel_share"]:
                errors.append(sid + " has too little visible principal picture content")
            if film is not None:
                current = frame(film, round(at * 30) / 30, 270, 480).astype(float)
                if float(np.abs(current - normal).mean()) > policy(board)["max_final_frame_mae"]:
                    errors.append(sid + " final pixels differ from the approved preview")
        moving = float((np.max(np.abs(effects[-1] - effects[0]), axis=2) > 12).mean())
        deliberate_hold = creative.required(board) and scene.get("intentional_hold")
        import creative_release as bounded
        state_root = Path(root).parent.parent if Path(root).parent.name == "cinema" else Path(root).parent
        if not deliberate_hold and moving < policy(board)["min_stage_action_pixel_share"]:
            finding = sid + " principal picture does not visibly develop during its action"
            if (deferred is not None and bounded.eligible(board, state_root)
                    and not creative.treatment_required(board)):
                deferred.append({"scene_id": sid, "category": "motion", "finding": finding,
                                 "observed_pixel_share": moving,
                                 "required_pixel_share": policy(board)["min_stage_action_pixel_share"]})
            else:
                errors.append(finding)
    return errors


def preview_problems(board_path, root, mix=None, film=None):
    board = read(board_path)
    if not required(board):
        return []
    errors = plan_problems(board)
    if errors:
        return errors
    try:
        root = Path(root)
        proof = read(root / "proof.json")
        from cinema_provenance import binding_problems
        errors += binding_problems(board_path, proof, mix)
        for key, expected in (("board_sha256", digest(board_path)), ("engine_sha256", engine_sha256()),
                              ("generated_media_sha256", generated_media_sha256(board_path)),
                              ("policy_sha256", digest(policy_path(board)))):
            if proof.get(key) != expected:
                errors.append("cinematic preview has stale " + key)
        if mix is not None and proof.get("mix_sha256") != digest(mix):
            errors.append("cinematic preview used a different final mix")
        clip = asset(root, proof["hero"])
        hero = next(s for s in board["scenes"] if s["id"] == board["cinema"]["hero_scene_id"])
        passage_end = next(s for s in board["scenes"] if s["id"] == board["cinema"].get("hero_passage_end_scene_id", hero["id"]))
        passage_duration = float(passage_end["start_s"]) + float(passage_end["duration_s"]) - float(hero["start_s"])
        w, h, dur = probe(clip)
        if (w, h) != (1080, 1920) or abs(dur - passage_duration) > .12:
            errors.append("hero preview must contain the full declared passage at delivery resolution")
        errors += av_problems(root / "hero-review.json", clip, "hero")
        deferred, observations = [], []
        errors += stage_sample_problems(board, root, proof["samples"], film=film,
                                       deferred=deferred, observations=observations)
        if deferred != proof.get("bounded_creative_findings", []):
            errors.append("native proof must retain every measured deferred artistic finding")
        if observations != proof.get("principal_picture_measurements", []):
            errors.append("native proof must retain every principal-picture occupancy measurement")
    except (OSError, ValueError, KeyError, TypeError, IndexError, subprocess.SubprocessError) as exc:
        errors.append("cinematic preview unavailable: " + str(exc))
    return errors

def audio_measurement(film):
    r = subprocess.run([FFMPEG, "-hide_banner", "-nostats", "-i", str(film),
                        "-vn", "-af", "loudnorm=print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True, check=True)
    text = r.stderr
    data = json.loads(text[text.rfind("{"):text.rfind("}") + 1])
    return {"integrated_lufs": float(data["input_i"]), "true_peak_dbtp": float(data["input_tp"])}

def audio_problems(film):
    try:
        result = audio_measurement(film)
        loud, peak = result["integrated_lufs"], result["true_peak_dbtp"]
        errors = []
        if not finite(loud) or abs(loud - TARGET_LUFS) > policy()["loudness_tolerance_lu"]:
            errors.append(f"final encoded audio is {loud} LUFS; target is {TARGET_LUFS}")
        if not finite(peak) or peak > policy()["max_true_peak_dbtp"]:
            errors.append(f"final encoded audio peaks at {peak} dBTP")
        return errors
    except (OSError, ValueError, KeyError, subprocess.SubprocessError) as exc:
        return ["final audio measurement unavailable: " + str(exc)]

def av_problems(path, film, role):
    try:
        receipt = read(path)
        root = Path(path).parent
        response = read(asset(root, receipt["response"]))
        if receipt.get("film_sha256") != digest(film) or receipt.get("role") != role:
            return ["audiovisual review belongs to another film or reviewer"]
        if not receipt.get("request_id") or not response.get("responseId"):
            return ["audiovisual review lacks provider response evidence"]
        parts = response["candidates"][0]["content"]["parts"]
        review = json.loads("".join(p.get("text", "") for p in parts if not p.get("thought")))
        errors = []
        if review.get("audio_access") is not True:
            errors.append(role + " reviewer lacked audible-media access")
        import creative_release as bounded
        dispatch_root = root.parent if root.name == "cinema" else root
        board_file = dispatch_root / "storyboard.json"
        bounded_eligible = (board_file.is_file() and bounded.review_allows(
            read(board_file), review, dispatch_root, "av", embedded=True))
        if review.get("pass") is not True and not bounded_eligible:
            errors.append(role + " audiovisual reviewer rejected the film; inspect its recorded defects")
        duration = probe(film)[2]
        for key in ("visual_observations", "audio_observations"):
            notes = review.get(key)
            if not isinstance(notes, list) or len(notes) < 2:
                errors.append(role + " lacks timestamped " + key)
                continue
            for n in notes:
                if not finite(n.get("at_s")) or not 0 <= n["at_s"] < duration or len(str(n.get("observation", "")).strip()) < 20:
                    errors.append(role + " has invalid " + key)
        for key in ("pacing", "comprehension", "weakest_interval", "dimensional_action"):
            if len(str(review.get(key) or "").strip()) < 20:
                errors.append(role + " lacks " + key)
        return errors
    except (OSError, ValueError, KeyError, TypeError, IndexError, subprocess.SubprocessError) as exc:
        return ["audiovisual evidence unavailable: " + str(exc)]

# One explicit owner decision, not a reusable unattended override. New films and
# changed bytes remain subject to the ordinary cinematic and panel contract.
OWNER_RELEASE_2026_09_25 = (
    "0c21df37a82e3bf58b49e6205a23021b6a99d126f67161c26101d5ac3b3d10bf",
    "9368dc8510a3ea7d4c7123590be4473134f234e5d2fa284aa9b83f107d6e1972",
    "e99abf3f75a977c5dd48b0342bec05f8d77ed84a961ca84dd11ca142aec2395b",
)

def owner_release_problems(board_path, film):
    root = Path(board_path).parent
    approval = root / "owner_release.json"
    if not approval.is_file():
        return None
    try:
        actual = (digest(film), digest(board_path), digest(approval))
        if actual != OWNER_RELEASE_2026_09_25:
            return ["owner exception applies only to the exact September 25 film, board and approval"]
        report = read(root / "report_card.json")
        if (report.get("publication_mode") != "owner_directed_exception"
                or report.get("score") is not None or report.get("judges") != []
                or report.get("picture_review") != "rejected"
                or report.get("film_sha256") != actual[0]):
            return ["owner release must preserve rejected review and unscored status honestly"]
        from validation_check import check
        return audio_problems(film) + check(root / "validation.json", root / "claims.json", board_path)
    except (OSError, ValueError, KeyError, TypeError) as exc:
        return ["owner release evidence unavailable: " + str(exc)]


def publication_problems(board_path, film, judges=None):
    owner_errors = owner_release_problems(board_path, film)
    if owner_errors is not None:
        return owner_errors
    board = read(board_path)
    if not required(board):
        return []
    errors = preview_problems(board_path, film.parent / "cinema", film=film)
    import creative_production as creative
    errors += creative.opening_problems(board_path)
    if creative.required(board):
        try:
            errors += creative.mix_problems(board, read(Path(board_path).with_name("mix.json")))
        except (OSError, ValueError) as exc:
            errors.append("directed mix evidence unavailable: " + str(exc))
    errors += audio_problems(film)
    if judges is not None:
        if not isinstance(judges, list) or len(judges) != 3:
            return errors + ["three audiovisual-informed independent judges required"]
        seen = set()
        provider_ids = set()
        for judge in judges:
            role = judge.get("audiovisual_role")
            if role not in ("picture", "story", "sound") or role in seen:
                errors.append("judges must each use their own picture, story or sound review")
                continue
            seen.add(role)
            receipt = film.parent / "cinema" / (role + "-review.json")
            errors += av_problems(receipt, film, role)
            try:
                r = read(receipt)
                response = read(asset(receipt.parent, r["response"]))
                identity = response.get("responseId")
                if identity in provider_ids:
                    errors.append("independent judges reused the same provider response")
                provider_ids.add(identity)
            except (OSError, ValueError, KeyError, TypeError):
                errors.append("provider response identity is unavailable")
            if judge.get("audiovisual_receipt_sha256") != digest(receipt):
                errors.append(role + " judge did not bind its audiovisual receipt")
    return errors

def changed_runs(base, repo=REPO):
    result = subprocess.run(["git", "diff", "--name-only", base, "HEAD", "--", "runs/"],
                            cwd=repo, capture_output=True, text=True, check=True)
    affected = set()
    for name in result.stdout.splitlines():
        parts = Path(name).parts
        if len(parts) >= 3 and parts[1] != "review" and parts[2] != "email.md":
            affected.add(parts[1])
    errors = []
    for day in sorted(affected):
        directory = repo / "runs" / day
        try:
            board = directory / "storyboard.json"
            data = read(board)
            if data.get("date") != day:
                errors.append(day + " board date differs from its delivery directory")
                continue
            if day < policy()["effective_date"]:
                errors.append(day + " is a historical edition; new or rewritten published artifacts are refused")
                continue
            if required(data):
                report = read(directory / "report_card.json")
                errors += [day + ": " + e for e in publication_problems(
                    board, directory / "dispatch.mp4", report.get("judges", []))]
        except (OSError, ValueError, KeyError, TypeError) as exc:
            errors.append(day + " production package unavailable: " + str(exc))
    return errors

def ci_problems():
    """Run from the existing CI guard; no workflow-edit permission is needed."""
    try:
        event = read(Path(os.environ["GITHUB_EVENT_PATH"]))
        base = (event.get("pull_request") or {}).get("base", {}).get("sha") or event.get("before")
        if not base or set(base) == {"0"}:
            # Manual runs also validate the latest commit rather than silently skipping.
            subprocess.run(["git", "fetch", "--deepen=1", "origin", os.environ.get("GITHUB_SHA", "main")],
                           cwd=REPO, capture_output=True, text=True, check=True)
            base = "HEAD^"
        exists = subprocess.run(["git", "cat-file", "-e", base + "^{commit}"],
                                cwd=REPO, capture_output=True)
        if exists.returncode:
            subprocess.run(["git", "fetch", "--depth=1", "origin", base],
                           cwd=REPO, capture_output=True, text=True, check=True)
        return changed_runs(base)
    except (OSError, ValueError, KeyError, subprocess.SubprocessError) as exc:
        return ["cinematic CI comparison unavailable: " + str(exc)]

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--board")
    p.add_argument("--changed-runs", action="store_true")
    p.add_argument("--base", default="HEAD^")
    p.add_argument("--film")
    p.add_argument("--mix")
    p.add_argument("--preview", action="store_true")
    a = p.parse_args()
    if a.changed_runs:
        errors = changed_runs(a.base or "HEAD^")
        for e in errors:
            print("production_quality: " + e, file=sys.stderr)
        return int(bool(errors))
    if not a.board:
        p.error("--board is required")
    board = Path(a.board)
    errors = preview_problems(board, board.parent / "cinema", Path(a.mix) if a.mix else None) if a.preview else publication_problems(board, Path(a.film))
    for e in errors:
        print("production_quality: " + e, file=sys.stderr)
    return int(bool(errors))

if __name__ == "__main__":
    sys.exit(main())
