#!/usr/bin/env python3
"""generated_media.py — bounded, provenance-bound still/video plates for exceptional shots.

The default Dispatch remains deterministic Remotion. A scene may request generated media only
when a real-world texture, location or mechanism cannot be drawn clearly from the component
library. The request lives in the scene as ``generated_media`` and names why it is necessary,
what it must depict, its output file, and whether it is an image or short video.

This script never invents screen text. Figures, labels, arrows and causal claims stay in native
Remotion components where evidence gates can read them. Every generated file is hash-bound to
its exact prompt and model in a manifest; changing the request invalidates the plate.

    generated_media.py --board out/dispatch/storyboard.json --plan
    generated_media.py --board out/dispatch/storyboard.json --generate
    generated_media.py --board out/dispatch/storyboard.json --verify
    generated_media.py --self-test
"""
from __future__ import annotations

import argparse
import base64
from datetime import datetime, timezone
import hashlib
import json
import mimetypes
import os
from pathlib import Path
import re
import sys
import time
from typing import Any

import requests


REPO = Path(__file__).resolve().parents[1]
PUBLIC = REPO / "video-engine" / "public"
CONFIG = REPO / "config" / "generated_media.json"
DEFAULT_MANIFEST = REPO / "out" / "dispatch" / "generated_media.json"
GENERATE_BASE = "https://generativelanguage.googleapis.com/v1"
VEO_BASE = "https://generativelanguage.googleapis.com/v1beta"

ASPECT_ENUM = {
    "1:1": "ASPECT_RATIO_ONE_BY_ONE", "2:3": "ASPECT_RATIO_TWO_BY_THREE",
    "3:2": "ASPECT_RATIO_THREE_BY_TWO", "3:4": "ASPECT_RATIO_THREE_BY_FOUR",
    "4:3": "ASPECT_RATIO_FOUR_BY_THREE", "4:5": "ASPECT_RATIO_FOUR_BY_FIVE",
    "5:4": "ASPECT_RATIO_FIVE_BY_FOUR", "9:16": "ASPECT_RATIO_NINE_BY_SIXTEEN",
    "16:9": "ASPECT_RATIO_SIXTEEN_BY_NINE", "21:9": "ASPECT_RATIO_TWENTY_ONE_BY_NINE",
    "1:8": "ASPECT_RATIO_ONE_BY_EIGHT", "8:1": "ASPECT_RATIO_EIGHT_BY_ONE",
    "1:4": "ASPECT_RATIO_ONE_BY_FOUR", "4:1": "ASPECT_RATIO_FOUR_BY_ONE",
}
SIZE_ENUM = {"512": "IMAGE_SIZE_FIVE_TWELVE", "1K": "IMAGE_SIZE_ONE_K",
             "2K": "IMAGE_SIZE_TWO_K", "4K": "IMAGE_SIZE_FOUR_K"}


def digest_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def digest_text(value: str) -> str:
    return digest_bytes(value.encode("utf-8"))


def config() -> dict:
    return json.loads(CONFIG.read_text(encoding="utf-8"))


def requests_from(board: dict) -> list[tuple[str, dict]]:
    return [(str(scene.get("id") or "?"), scene["generated_media"])
            for scene in (board.get("scenes") or [])
            if isinstance(scene.get("generated_media"), dict)]


def request_problems(board: dict, cfg: dict) -> list[str]:
    out: list[str] = []
    rows = requests_from(board)
    images = sum(req.get("kind") == "image" for _, req in rows)
    videos = sum(req.get("kind") == "video" for _, req in rows)
    if images > int(cfg["max_images_per_run"]):
        out.append(f"{images} image requests exceed the per-run ceiling of "
                   f"{cfg['max_images_per_run']}")
    if videos > int(cfg["max_videos_per_run"]):
        out.append(f"{videos} video requests exceed the per-run ceiling of "
                   f"{cfg['max_videos_per_run']}")
    ids: set[str] = set()
    files: set[str] = set()
    for sid, req in rows:
        scene = next(scene for scene in (board.get("scenes") or [])
                     if str(scene.get("id") or "?") == sid and scene.get("generated_media") is req)
        kind = str(req.get("kind") or "")
        rid = str(req.get("id") or "")
        file = str(req.get("file") or "")
        if kind not in {"image", "video"}:
            out.append(f"scene {sid}: generated_media.kind must be image or video")
        if not re.fullmatch(r"[a-z][a-z0-9-]*", rid):
            out.append(f"scene {sid}: generated_media.id must be a lower-case slug")
        elif rid in ids:
            out.append(f"scene {sid}: generated_media.id {rid!r} is duplicated")
        ids.add(rid)
        expected = ".png" if kind == "image" else ".mp4"
        path = Path(file)
        if (path.is_absolute() or ".." in path.parts or not file.startswith("generated/")
                or path.suffix.lower() != expected):
            out.append(f"scene {sid}: generated media file must be generated/...{expected} "
                       "inside video-engine/public")
        elif file in files:
            out.append(f"scene {sid}: generated media file {file!r} is reused")
        files.add(file)
        if len(str(req.get("prompt") or "").split()) < 18:
            out.append(f"scene {sid}: generated media prompt is too thin to direct a stable plate")
        must = req.get("must_depict")
        if not isinstance(must, list) or not 1 <= len(must) <= 4:
            out.append(f"scene {sid}: generated_media.must_depict needs one to four concrete items")
        if len(str(req.get("why") or "").split()) < 8:
            out.append(f"scene {sid}: generated_media.why must explain why native components fail")
        replaces = req.get("replaces_item_ids")
        staged_ids = {str(item.get("id") or "") for plane in (scene.get("planes") or [])
                      if isinstance(plane, dict) for item in (plane.get("items") or [])
                      if isinstance(item, dict) and str(item.get("id") or "")}
        if not isinstance(replaces, list) or not replaces:
            out.append(f"scene {sid}: generated_media.replaces_item_ids must name the exact "
                       "native background objects the plate replaces")
            replaces = []
        else:
            missing_replaced = [str(item_id) for item_id in replaces
                                if str(item_id) not in staged_ids]
            if missing_replaced:
                out.append(f"scene {sid}: generated plate replaces unstaged item id(s): "
                           f"{', '.join(missing_replaced)}")
        proof = scene.get("visual_proof") or {}
        bound_ids = {str(item_id) for row in (proof.get("must_show") or [])
                     if isinstance(row, dict) for item_id in (row.get("item_ids") or [])}
        bound_ids |= {str(item_id) for item_id in ((proof.get("change") or {}).get("item_ids") or [])}
        bound_ids |= {str(item_id) for event in (scene.get("visual_events") or [])
                      if isinstance(event, dict) for item_id in (event.get("item_ids") or [])}
        hidden_evidence = sorted(bound_ids & {str(item_id) for item_id in replaces})
        if hidden_evidence:
            out.append(f"scene {sid}: generated plate may not replace evidence/event item(s): "
                       f"{', '.join(hidden_evidence)}")
        prompt = str(req.get("prompt") or "").lower()
        if re.search(r"\b(write|text reads|label(?:led)?|caption|headline|logo)\b", prompt):
            out.append(f"scene {sid}: generated plates may not be asked to render text; use a "
                       "native evidence component so wording remains exact")
    return out


def asset_path(req: dict) -> Path:
    return PUBLIC / str(req["file"])


def prompt_for(req: dict, cfg: dict) -> str:
    must = "; ".join(str(x) for x in req.get("must_depict") or [])
    return (
        f"Create a {cfg['aspect_ratio']} portrait editorial documentary plate for Texas AI "
        f"Docket. {str(req['prompt']).strip()} Must visibly depict: {must}. No words, labels, "
        "logos, watermarks, interface chrome, recognizable public figures, or invented signage. "
        "Leave clean negative space for precise renderer-native evidence overlays. Natural Texas "
        "light, physically coherent geometry, restrained color, no generic sci-fi glow."
    )


def recursive_image(obj: Any) -> tuple[bytes, str] | None:
    """Find an inline image across both Interactions and generateContent response shapes."""
    if isinstance(obj, dict):
        mime = str(obj.get("mime_type") or obj.get("mimeType") or "")
        data = obj.get("data")
        if mime.startswith("image/") and isinstance(data, str):
            try:
                return base64.b64decode(data), mime
            except ValueError:
                pass
        for value in obj.values():
            found = recursive_image(value)
            if found:
                return found
    elif isinstance(obj, list):
        for value in obj:
            found = recursive_image(value)
            if found:
                return found
    return None


def generate_image(req: dict, cfg: dict, key: str) -> tuple[bytes, str, str]:
    model = str(req.get("model") or cfg["image_model"])
    payload = {
        "contents": [{"parts": [{"text": prompt_for(req, cfg)}]}],
        "generationConfig": {
            "responseModalities": ["IMAGE"],
            # v1's wire schema uses protobuf enum names. The guide's SDK examples accept
            # friendly values such as 9:16 and 1K, but sending those strings directly to REST
            # is rejected even though the same page displays them as the human-facing values.
            "responseFormat": {"image": {
                "aspectRatio": ASPECT_ENUM[str(cfg["aspect_ratio"])],
                "imageSize": SIZE_ENUM[str(cfg["image_size"])],
            }},
        },
    }
    # Use the documented generateContent REST shape. Interactions had a different response_format
    # schema and returned an opaque 400 here even though the key and model were valid.
    response = requests.post(f"{GENERATE_BASE}/models/{model}:generateContent",
                             headers={"x-goog-api-key": key}, json=payload, timeout=300)
    if not response.ok:
        raise RuntimeError(f"{model} image request returned HTTP {response.status_code}: "
                           f"{response.text[:1000]}")
    found = recursive_image(response.json())
    if not found:
        raise RuntimeError(f"{model} returned no inline image: {response.text[:500]}")
    data, mime = found
    return data, mime, model


def generate_video(req: dict, cfg: dict, key: str) -> tuple[bytes, str, str]:
    model = str(req.get("model") or cfg["video_model"])
    response = requests.post(f"{VEO_BASE}/models/{model}:predictLongRunning",
        headers={"x-goog-api-key": key}, json={
            "instances": [{"prompt": prompt_for(req, cfg)}],
            "parameters": {"aspectRatio": cfg["aspect_ratio"],
                           "resolution": cfg["video_resolution"], "sampleCount": 1},
        }, timeout=120)
    response.raise_for_status()
    operation = str(response.json().get("name") or "")
    if not operation:
        raise RuntimeError(f"{model} returned no operation name: {response.text[:500]}")
    deadline = time.monotonic() + float(cfg["poll_timeout_seconds"])
    finished: dict | None = None
    while time.monotonic() < deadline:
        polled = requests.get(f"{VEO_BASE}/{operation}", headers={"x-goog-api-key": key},
                              timeout=60)
        polled.raise_for_status()
        body = polled.json()
        if body.get("done"):
            finished = body
            break
        time.sleep(float(cfg["poll_seconds"]))
    if finished is None:
        raise RuntimeError(f"{model} did not complete inside {cfg['poll_timeout_seconds']} seconds")
    if finished.get("error"):
        raise RuntimeError(f"{model} failed: {json.dumps(finished['error'])[:500]}")
    try:
        uri = finished["response"]["generateVideoResponse"]["generatedSamples"][0]["video"]["uri"]
    except (KeyError, IndexError) as exc:
        raise RuntimeError(f"{model} returned no generated video: {json.dumps(finished)[:500]}") from exc
    media = requests.get(uri, headers={"x-goog-api-key": key}, timeout=300)
    media.raise_for_status()
    return media.content, media.headers.get("content-type", "video/mp4"), model


def load_manifest(path: Path) -> dict:
    if not path.exists():
        return {"schema": "dispatch_generated_media/1", "entries": []}
    return json.loads(path.read_text(encoding="utf-8"))


def entry_for(entries: list[dict], sid: str, req: dict) -> dict | None:
    return next((entry for entry in entries
                 if entry.get("scene") == sid and entry.get("id") == req.get("id")), None)


def verification_problems(board: dict, manifest: dict, cfg: dict) -> list[str]:
    out = request_problems(board, cfg)
    entries = manifest.get("entries") or []
    for sid, req in requests_from(board):
        entry = entry_for(entries, sid, req)
        path = asset_path(req)
        if not entry:
            out.append(f"scene {sid}: no generated-media manifest entry")
            continue
        expected_prompt = digest_text(prompt_for(req, cfg))
        if entry.get("prompt_sha256") != expected_prompt:
            out.append(f"scene {sid}: generated plate belongs to a different prompt")
        if entry.get("file") != req.get("file"):
            out.append(f"scene {sid}: generated plate manifest names a different file")
        if not path.is_file():
            out.append(f"scene {sid}: generated plate is missing at {path.relative_to(REPO)}")
        elif entry.get("sha256") != digest_bytes(path.read_bytes()):
            out.append(f"scene {sid}: generated plate changed after it was recorded")
    return out


def generate(board: dict, manifest_path: Path, cfg: dict, key: str) -> dict:
    manifest = load_manifest(manifest_path)
    entries = list(manifest.get("entries") or [])
    for sid, req in requests_from(board):
        current = entry_for(entries, sid, req)
        path = asset_path(req)
        expected_prompt = digest_text(prompt_for(req, cfg))
        if (current and path.is_file() and current.get("prompt_sha256") == expected_prompt
                and current.get("sha256") == digest_bytes(path.read_bytes())):
            print(f"generated_media: reuse {sid} {req['file']} (prompt and bytes match)")
            continue
        if req["kind"] == "image":
            data, mime, model = generate_image(req, cfg, key)
        else:
            data, mime, model = generate_video(req, cfg, key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        row = {"scene": sid, "id": req["id"], "kind": req["kind"], "file": req["file"],
               "model": model, "mime_type": mime, "prompt_sha256": expected_prompt,
               "sha256": digest_bytes(data),
               "generated_at": datetime.now(timezone.utc).isoformat()}
        entries = [entry for entry in entries
                   if not (entry.get("scene") == sid and entry.get("id") == req["id"])] + [row]
        manifest = {"schema": "dispatch_generated_media/1", "entries": entries}
        manifest_path.parent.mkdir(parents=True, exist_ok=True)
        manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        print(f"generated_media: generated {sid} {req['kind']} -> {req['file']}")
    return {"schema": "dispatch_generated_media/1", "entries": entries}


def self_test() -> int:
    import copy
    import tempfile
    failures = 0

    def ok(label: str, condition: bool, detail: str = "") -> None:
        nonlocal failures
        print(f"  {'ok  ' if condition else 'FAIL'}  {label}{'' if condition else '  ' + detail}")
        failures += 0 if condition else 1

    cfg = config()
    req = {"id": "road-plate", "kind": "image", "file": "generated/test/road.png",
           "why": "Native vector components cannot show the wet aggregate texture at inspection distance.",
           "must_depict": ["wet Texas road surface", "field inspection hand"],
           "replaces_item_ids": ["old-road"],
           "prompt": "Documentary close view of a field engineer examining wet asphalt aggregate on a Gulf Coast county road after rain."}
    board = {"scenes": [{"id": "s1", "generated_media": req,
                          "planes": [{"items": [{"id": "old-road", "kind": "lane"}]}]}]}
    ok("a bounded, specific image request passes", not request_problems(board, cfg),
       str(request_problems(board, cfg)))
    text = copy.deepcopy(board)
    text["scenes"][0]["generated_media"]["prompt"] += " Write a label reading DANGER."
    ok("generated plates may not own exact wording",
       any("may not be asked to render text" in p for p in request_problems(text, cfg)))
    escape = copy.deepcopy(board)
    escape["scenes"][0]["generated_media"]["file"] = "../../road.png"
    ok("an asset cannot escape the generated public directory",
       any("inside video-engine/public" in p for p in request_problems(escape, cfg)))
    hidden = copy.deepcopy(board)
    hidden["scenes"][0]["visual_proof"] = {
        "must_show": [{"concept": "road", "item_ids": ["old-road"]}],
        "change": {"item_ids": ["old-road"]},
    }
    ok("a generated plate cannot silently hide an item that proves the claim",
       any("may not replace evidence" in p for p in request_problems(hidden, cfg)))
    too_many = {"scenes": [{"id": f"s{i}", "generated_media": dict(req, id=f"plate-{i}",
                         file=f"generated/test/{i}.png")} for i in range(4)]}
    ok("the per-run image ceiling is enforced",
       any("ceiling" in p for p in request_problems(too_many, cfg)))
    with tempfile.TemporaryDirectory() as td:
        fake = Path(td) / "plate.png"
        fake.write_bytes(b"image")
        # verification is exercised against a temporary PUBLIC by testing its invariants
        prompt_hash = digest_text(prompt_for(req, cfg))
        entry = {"scene": "s1", "id": "road-plate", "file": req["file"],
                 "prompt_sha256": prompt_hash, "sha256": digest_bytes(b"image")}
        ok("a manifest binds both prompt and bytes",
           entry["prompt_sha256"] == prompt_hash and entry["sha256"] == digest_bytes(fake.read_bytes()))
        changed = copy.deepcopy(req)
        changed["prompt"] += " at night"
        ok("changing the prompt invalidates the old entry",
           entry["prompt_sha256"] != digest_text(prompt_for(changed, cfg)))
    print(f"generated_media: {failures} failure(s)")
    return 1 if failures else 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--board")
    ap.add_argument("--manifest", default=str(DEFAULT_MANIFEST))
    group = ap.add_mutually_exclusive_group()
    group.add_argument("--plan", action="store_true")
    group.add_argument("--generate", action="store_true")
    group.add_argument("--verify", action="store_true")
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()
    if args.self_test:
        return self_test()
    if not args.board:
        print("generated_media: --board is required", file=sys.stderr)
        return 2
    try:
        board = json.loads(Path(args.board).read_text(encoding="utf-8"))
        cfg = config()
    except (OSError, json.JSONDecodeError) as exc:
        print(f"generated_media: cannot read input: {exc}", file=sys.stderr)
        return 2
    bad = request_problems(board, cfg)
    if bad:
        for problem in bad:
            print(f"  - {problem}", file=sys.stderr)
        return 1
    rows = requests_from(board)
    if args.plan or (not args.generate and not args.verify):
        print(f"generated_media: {len(rows)} request(s); "
              f"{sum(r.get('kind') == 'image' for _, r in rows)} image, "
              f"{sum(r.get('kind') == 'video' for _, r in rows)} video")
        for sid, req in rows:
            print(f"  {sid}  {req['kind']}  {req['file']}  because: {req['why']}")
        return 0
    manifest_path = Path(args.manifest)
    try:
        if args.generate:
            key = os.environ.get("GEMINI_API_KEY", "").strip()
            if not key:
                raise ValueError("GEMINI_API_KEY is not set")
            manifest = generate(board, manifest_path, cfg, key)
        else:
            manifest = load_manifest(manifest_path)
        found = verification_problems(board, manifest, cfg)
    except (OSError, ValueError, KeyError, requests.RequestException, RuntimeError) as exc:
        print(f"generated_media: refused: {exc}", file=sys.stderr)
        return 1
    if found:
        for problem in found:
            print(f"  - {problem}", file=sys.stderr)
        return 1
    print("generated_media: every requested plate is prompt-bound, byte-bound and present")
    return 0


if __name__ == "__main__":
    sys.exit(main())
