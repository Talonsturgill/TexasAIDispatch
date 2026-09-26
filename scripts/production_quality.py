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

def policy():
    return json.loads(POLICY.read_text())

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

def stage_sample_problems(board, root, samples, film=None):
    """Measure actual rendered 3D pixels before spending an audiovisual review."""
    errors = []
    ids = board["cinema"]["dimensional_scene_ids"]
    if sorted(samples) != sorted(ids):
        return ["cinematic proof must cover every declared dimensional scene"]
    scenes = {s["id"]: s for s in board["scenes"]}
    for sid in ids:
        scene = scenes[sid]
        pair = samples[sid]
        ev = scene["visual_events"][0]
        times = [float(scene["start_s"]) + float(ev["at_s"]),
                 float(scene["start_s"]) + float(ev["at_s"]) + float(ev["duration_s"])]
        effects = []
        for idx, at in enumerate(times):
            normal = image(asset(root, pair[idx]["normal"]))
            removed = image(asset(root, pair[idx]["without_stage"]))
            effect = normal - removed
            effects.append(effect)
            area = float((np.max(np.abs(effect), axis=2) > 12).mean())
            if area < policy()["min_stage_pixel_share"]:
                errors.append(sid + " has too little visible CinematicStage content")
            if film is not None:
                current = frame(film, round(at * 30) / 30, 270, 480).astype(float)
                if float(np.abs(current - normal).mean()) > policy()["max_final_frame_mae"]:
                    errors.append(sid + " final pixels differ from the approved preview")
        moving = float((np.max(np.abs(effects[1] - effects[0]), axis=2) > 12).mean())
        if moving < policy()["min_stage_action_pixel_share"]:
            errors.append(sid + " dimensional subject does not visibly develop during its action")
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
        for key, expected in (("board_sha256", digest(board_path)), ("engine_sha256", engine_sha256()),
                              ("generated_media_sha256", generated_media_sha256(board_path)),
                              ("policy_sha256", digest(POLICY))):
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
        errors += stage_sample_problems(board, root, proof["samples"], film=film)
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
        if review.get("pass") is not True:
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

def publication_problems(board_path, film, judges=None):
    board = read(board_path)
    if not required(board):
        return []
    errors = preview_problems(board_path, film.parent / "cinema", film=film)
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
