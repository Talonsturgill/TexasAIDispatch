"""Dependency-bound reuse for the isolated daily renderer; unknown code uses full bindings."""
from __future__ import annotations
import hashlib
import json
import math
import os
import platform
import re
import shutil
import wave
from pathlib import Path
from render_manifest import REPO, ENGINE, PUBLIC, file_sha256, engine_sha256, generated_media_sha256

PROFILE = REPO / "config/render_reuse.json"
FPS = 30
SCHEMA = "cinema-artifact-cache/1"


def digest_json(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def closure(entry=ENGINE / "daily.tsx"):
    """Conservative static dependency closure. Type-only imports have no render effects."""
    found, pending = set(), [entry.resolve()]
    while pending:
        path = pending.pop()
        if path in found:
            continue
        if not path.is_relative_to(REPO) or not path.is_file():
            raise ValueError("unresolved render dependency: " + str(path))
        found.add(path)
        text = path.read_text()
        text = re.sub(r"import\s+type\b[^;]+;", "", text)
        imports = re.findall(r"(?:import|export)\s+(?!type\b)(?:[^;]*?\sfrom\s*)?['\"](\.[^'\"]+)['\"]", text)
        for relative in imports:
            base = path.parent / relative
            options = [base] if base.suffix else [base.with_suffix(x) for x in (".tsx", ".ts", ".mjs", ".js", ".json", ".css")] + [base / "index.tsx", base / "index.ts"]
            dependency = next((p.resolve() for p in options if p.is_file()), None)
            if dependency is None:
                raise ValueError("unresolved render import: " + relative)
            pending.append(dependency)
    return sorted(found)


def current_profile():
    return {p.relative_to(REPO).as_posix(): file_sha256(p) for p in closure()}


def isolated(board):
    if board.get("cinematic_template") != "daily-actions-v1" or not PROFILE.is_file():
        return False
    profile = json.loads(PROFILE.read_text())
    # A renderer edit retires this projection contract until its dependency behavior is
    # explicitly revalidated. It must never silently start reading unbound outside props.
    return profile.get("files") == current_profile()


def hero_frames(board):
    scenes = {s["id"]: s for s in board["scenes"]}
    plan = board["cinema"]
    first = scenes[plan["hero_scene_id"]]
    last = scenes[plan.get("hero_passage_end_scene_id", first["id"])]
    return [round(float(first["start_s"]) * FPS),
            round((float(last["start_s"]) + float(last["duration_s"])) * FPS) - 1]


def project(board, frames):
    """Only this pinned route is proven independent of scenes outside the requested frames."""
    if not isolated(board):
        return board, "full-inputs"
    start, end = frames
    scenes = [s for s in board["scenes"] if math.ceil(s["start_s"]*FPS) <= end
              and math.ceil((s["start_s"]+s["duration_s"])*FPS)-1 >= start]
    if start < 0 or end < start or any(sum(math.ceil(s["start_s"]*FPS) <= f < math.ceil((s["start_s"]+s["duration_s"])*FPS) for s in scenes) != 1 for f in range(start,end+1)):
        return board, "full-inputs"
    cues = [c for c in board.get("captions", [])
            if math.ceil(c["start"]*FPS) <= end and math.ceil(c["end"]*FPS)-1 >= start]
    used = {s.get("source_footage", {}).get("file") for s in scenes}
    # The literal textures are included below even when there is no dynamic video.
    data = {"cinematic_template": board["cinematic_template"], "scenes": scenes, "captions": cues,
            "__cinemaProofWithoutStage": board.get("__cinemaProofWithoutStage", False),
            "native_media": [m for m in board.get("native_media", []) if m.get("file") in used]}
    return data, "isolated-daily-scenes"


def picture_recipe(board_path, frames):
    board = json.loads(Path(board_path).read_text())
    props, scope = project(board, frames)
    files = [REPO / "video-engine/package-lock.json", REPO / "video-engine/package.json",
             REPO / "video-engine/scripts/render-batch.mjs", Path(__file__).resolve()]
    assets = set()
    if scope == "isolated-daily-scenes":
        files += closure()
        files.append(PROFILE)
        for p in closure():
            text = p.read_text()
            for relative in re.findall(r"staticFile\(\s*['\"]([^'\"]+)['\"]\s*\)", text):
                assets.add((PUBLIC / relative).resolve())
        assets.update(p.resolve() for p in (PUBLIC / "fonts").rglob("*") if p.is_file())
        for scene in props["scenes"]:
            for field in ("source_footage", "generated_media"):
                if scene.get(field, {}).get("file"):
                    assets.add((PUBLIC / scene[field]["file"]).resolve())
        engine = digest_json({p.relative_to(REPO).as_posix(): file_sha256(p) for p in files})
        media = {}
        for path in sorted(assets):
            if not path.is_relative_to(PUBLIC.resolve()):
                raise ValueError("render asset leaves public directory")
            media[path.relative_to(PUBLIC).as_posix()] = file_sha256(path)
    else:
        engine = digest_json({"engine": engine_sha256(),
                              "tools": {p.relative_to(REPO).as_posix(): file_sha256(p) for p in files}})
        media = generated_media_sha256(Path(board_path))
    browser = os.environ.get("REMOTION_BROWSER_EXECUTABLE")
    return {"version": SCHEMA, "scope": scope, "frames": frames, "props": props, "engine": engine,
            "media": media, "environment": [platform.platform(), platform.machine(),
                file_sha256(Path(browser)) if browser and Path(browser).is_file() else "managed-pinned-browser"],
            "capture": {"width":1080,"height":1920,"fps":FPS,"gl":"angle","image_format":"png","crf":16}}


def picture_key(board_path, frames):
    return digest_json(picture_recipe(board_path, frames))


def audio_segment(mix, frames, out=None):
    """Hash exact source PCM samples, not the unrelated remainder of the final mix."""
    with wave.open(str(mix), "rb") as src:
        params = src.getparams()
        if src.getcomptype() != "NONE":
            raise ValueError("hero reuse requires the mastered uncompressed PCM mix")
        first = round(frames[0] / FPS * params.framerate)
        count = round((frames[1]-frames[0]+1) / FPS * params.framerate)
        if first < 0 or first + count > src.getnframes():
            raise ValueError("mastered mix does not cover the complete hero")
        src.setpos(first)
        pcm = src.readframes(count)
    if len(pcm) != count * params.nchannels * params.sampwidth:
        raise ValueError("hero PCM segment is truncated")
    key = hashlib.sha256(json.dumps([params.nchannels,params.sampwidth,params.framerate,count]).encode()+pcm).hexdigest()
    if out:
        with wave.open(str(out), "wb") as dst:
            dst.setparams(params)
            dst.writeframes(pcm)
    return key


def sample_frames(board):
    import creative_production as creative
    current = creative.required(board)
    result = {}
    for scene in board["scenes"]:
        if not current and scene["id"] not in board["cinema"]["dimensional_scene_ids"]:
            continue
        if current:
            event_id = (scene.get("picture") or {}).get("event_id")
            matches = [e for e in scene.get("visual_events", []) if e.get("id") == event_id]
            if not event_id or len(matches) != 1:
                raise ValueError(scene["id"] + " has no unique principal-picture event")
            event = matches[0]
            at, duration = float(event["at_s"]), float(event["duration_s"])
            scene_duration = float(scene["duration_s"])
            if (not all(math.isfinite(v) for v in (at, duration, scene_duration))
                    or at < 0 or duration <= 0 or at + duration > scene_duration + 1e-6):
                raise ValueError(scene["id"] + " principal-picture event leaves its scene")
        else:
            event = scene["visual_events"][0]
        start = float(scene["start_s"]) + float(event["at_s"])
        first, last = round(start*FPS), round((start+float(event["duration_s"]))*FPS)
        if current:
            last = min(last, round((float(scene["start_s"])+float(scene["duration_s"]))*FPS)-1)
            middle = round((start + float(event["duration_s"]) / 2) * FPS)
            if not first < middle < last:
                raise ValueError(scene["id"] + " principal-picture event needs distinct native samples")
            result[scene["id"]] = [first, middle, last]
        else:
            result[scene["id"]] = [first, last]
    return result


def sample_key(board_path, frame, removed):
    return digest_json({"picture":picture_key(board_path,[frame,frame]),"without_stage":removed})


def lookup(root, key):
    path = Path(root) / key / "entry.json"
    if not path.exists():
        return None
    item = json.loads(path.read_text())
    payload = path.parent / item["file"]
    if (item.get("key") != key or not payload.resolve().is_relative_to(path.parent.resolve())
            or not payload.is_file() or file_sha256(payload) != item.get("sha256")):
        raise ValueError("retained cinematic cache bytes changed; preserve evidence and repair the cache")
    return payload


def retain(root, key, path):
    folder = Path(root) / key
    folder.mkdir(parents=True,exist_ok=True)
    payload = folder / ("artifact" + Path(path).suffix)
    staged = folder / (payload.name + ".tmp")
    shutil.copyfile(path,staged)
    os.replace(staged,payload)
    record = folder / "entry.tmp"
    record.write_text(json.dumps({"key":key,"file":payload.name,"sha256":file_sha256(payload)})+"\n")
    os.replace(record,folder / "entry.json")
    return payload


def binding_problems(board_path, proof, mix=None):
    """Current proof still binds the complete board, mix and engine in production_quality."""
    errors = []
    record = proof.get("reuse")
    if not record:
        if str(json.loads(Path(board_path).read_text()).get("date","")) >= "2026-09-28":
            errors.append("current cinematic proof lacks dependency-bound render evidence")
        return errors
    if record.get("version") != SCHEMA:
        errors.append("unknown cinematic reuse contract")
    board = json.loads(Path(board_path).read_text())
    frames = hero_frames(board)
    if record.get("hero_picture_key") != picture_key(board_path,frames):
        errors.append("hero render dependencies changed")
    if mix is not None and record.get("hero_audio_key") != audio_segment(mix,frames):
        errors.append("hero audible samples changed")
    expected = {sid:[{kind:sample_key(board_path,frame,kind=="without_stage")
                     for kind in ("normal","without_stage")} for frame in times]
                for sid,times in sample_frames(board).items()}
    if record.get("sample_keys") != expected:
        errors.append("cinematic stage sample dependencies changed")
    return errors
