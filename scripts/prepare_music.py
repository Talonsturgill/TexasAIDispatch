#!/usr/bin/env python3
"""Decode one approved registry asset to the engine rate without changing its duration.

The registry stores source-quality files, including MP3. mix.py deliberately reads only PCM WAV
and refuses mismatched rates; pretending the MP3 was already a 48 kHz WAV made the documented
music path impossible. This is the explicit bridge. It writes a hash-bound manifest so delivery
can prove the prepared file came from the selected registry row and was rate-converted, not
time-stretched or silently substituted.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
ENGINE_RATE = 48000
SCHEMA = "dispatch_music_preparation/1"


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def audio_facts(path: Path) -> dict:
    raw = json.loads(subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries",
         "stream=codec_name,sample_rate,channels,duration", "-of", "json", str(path)],
        check=True, capture_output=True, text=True).stdout)
    if not raw.get("streams"):
        raise ValueError(f"{path} has no audio stream")
    stream = raw["streams"][0]
    return {"codec": str(stream.get("codec_name") or ""),
            "sample_rate": int(stream["sample_rate"]),
            "channels": int(stream["channels"]),
            "duration_s": float(stream["duration"])}


def build_manifest(track_id: str, source: Path, prepared: Path) -> dict:
    source_facts, prepared_facts = audio_facts(source), audio_facts(prepared)
    return {
        "schema": SCHEMA,
        "created_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "track_id": track_id,
        "source_file": str(source),
        "source_sha256": sha256(source),
        "source_audio": source_facts,
        "prepared_file": str(prepared),
        "prepared_sha256": sha256(prepared),
        "prepared_audio": prepared_facts,
        "time_stretch": 1.0,
    }


def manifest_problems(manifest: dict, track_id: str, source: Path, prepared: Path) -> list[str]:
    out: list[str] = []
    if manifest.get("schema") != SCHEMA:
        return [f"music preparation is not {SCHEMA}"]
    if manifest.get("track_id") != track_id:
        out.append(f"music preparation belongs to {manifest.get('track_id')!r}, not {track_id!r}")
    if not source.is_file() or manifest.get("source_sha256") != sha256(source):
        out.append("the registry source is missing or differs from the prepared manifest")
    if not prepared.is_file() or manifest.get("prepared_sha256") != sha256(prepared):
        out.append("the prepared WAV is missing or differs from the prepared manifest")
        return out
    source_facts, facts = audio_facts(source), audio_facts(prepared)
    if facts["codec"] != "pcm_s16le" or facts["sample_rate"] != ENGINE_RATE \
            or facts["channels"] != 1:
        out.append(f"prepared audio must be mono 16-bit PCM at {ENGINE_RATE} Hz, got {facts}")
    try:
        recorded_source = manifest["source_audio"]
        recorded_prepared = manifest["prepared_audio"]
        if (int(recorded_source["sample_rate"]) != source_facts["sample_rate"]
                or abs(float(recorded_source["duration_s"])
                       - source_facts["duration_s"]) > 0.001):
            out.append("the source audio facts differ from the file now presented")
        if (int(recorded_prepared["sample_rate"]) != facts["sample_rate"]
                or int(recorded_prepared["channels"]) != facts["channels"]
                or abs(float(recorded_prepared["duration_s"]) - facts["duration_s"]) > 0.001):
            out.append("the prepared audio facts differ from the file now presented")
        if abs(source_facts["duration_s"] - facts["duration_s"]) > 0.1:
            out.append(f"preparation changed duration by "
                       f"{abs(source_facts['duration_s'] - facts['duration_s']):.3f}s; this is not a "
                       "sample-rate conversion anymore")
        if float(manifest.get("time_stretch")) != 1.0:
            out.append("music preparation reports time_stretch other than 1.0")
    except (KeyError, TypeError, ValueError):
        out.append("music preparation is missing numeric duration or time-stretch evidence")
    return out


def registry_source(track_id: str) -> tuple[dict, Path]:
    sys.path.insert(0, str(REPO / "scripts"))
    from music import load, problems_with

    track = next((t for t in load() if t.get("id") == track_id), None)
    if not track:
        raise ValueError(f"no track {track_id!r} in the music registry")
    problems = problems_with(track)
    if track.get("enabled") is not True:
        problems.append(f"{track_id}: disabled; no approved playable asset")
    if problems:
        raise ValueError("; ".join(problems))
    return track, REPO / str(track["file"])


def prepare(track_id: str, out: Path, manifest_path: Path) -> None:
    _, source = registry_source(track_id)
    out.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(prefix=out.stem + ".", suffix=".wav", dir=out.parent)
    os.close(fd)
    tmp = Path(tmp_name)
    try:
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(source),
                        "-map_metadata", "-1", "-vn", "-ac", "1", "-ar", str(ENGINE_RATE),
                        "-c:a", "pcm_s16le", str(tmp)], check=True)
        manifest = build_manifest(track_id, source, tmp)
        problems = manifest_problems(manifest, track_id, source, tmp)
        if problems:
            raise ValueError("; ".join(problems))
        os.replace(tmp, out)
        manifest["prepared_file"] = str(out)
        manifest["prepared_sha256"] = sha256(out)
        manifest_path.parent.mkdir(parents=True, exist_ok=True)
        manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    finally:
        if tmp.exists():
            tmp.unlink()


def verify(manifest_path: Path, track_id: str, prepared: Path) -> list[str]:
    _, source = registry_source(track_id)
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    return manifest_problems(manifest, track_id, source, prepared)


def self_test() -> int:
    failures = 0

    def ok(label: str, condition: bool, detail: str = "") -> None:
        nonlocal failures
        print(f"  {'ok  ' if condition else 'FAIL'}  {label}{'' if condition else '  ' + detail}")
        failures += 0 if condition else 1

    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        source, prepared = root / "source.wav", root / "prepared.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i",
                        "sine=frequency=330:sample_rate=44100:duration=2.2", "-ac", "2",
                        str(source)], check=True)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(source), "-ac", "1",
                        "-ar", str(ENGINE_RATE), "-c:a", "pcm_s16le", str(prepared)], check=True)
        manifest = build_manifest("fixture", source, prepared)
        ok("a 44.1 kHz source becomes a bound 48 kHz mono PCM asset",
           not manifest_problems(manifest, "fixture", source, prepared))
        ok("sample-rate conversion preserves duration",
           abs(audio_facts(source)["duration_s"] - audio_facts(prepared)["duration_s"]) < 0.01)
        prepared.write_bytes(prepared.read_bytes() + b"substituted")
        ok("a substituted prepared file is refused",
           any("differs" in p for p in manifest_problems(
               manifest, "fixture", source, prepared)))
        prepared.write_bytes(prepared.read_bytes()[:-11])
        changed = dict(manifest, track_id="another")
        ok("a manifest from another track is refused",
           any("belongs" in p for p in manifest_problems(
               changed, "fixture", source, prepared)))
    print(f"prepare_music: {failures} failure(s)")
    return 1 if failures else 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--track")
    ap.add_argument("--out")
    ap.add_argument("--manifest")
    ap.add_argument("--verify", action="store_true")
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()
    if args.self_test:
        return self_test()
    if not args.track or not args.out or not args.manifest:
        print("prepare_music: --track, --out, and --manifest are required", file=sys.stderr)
        return 2
    try:
        if args.verify:
            problems = verify(Path(args.manifest), args.track, Path(args.out))
            for problem in problems:
                print(f"  - {problem}", file=sys.stderr)
            if problems:
                return 1
            print("prepare_music: prepared WAV matches the selected registry source")
            return 0
        prepare(args.track, Path(args.out), Path(args.manifest))
        print(f"prepare_music: {args.track} -> {args.out} at {ENGINE_RATE} Hz, time_stretch 1.0")
        return 0
    except (OSError, ValueError, KeyError, json.JSONDecodeError,
            subprocess.CalledProcessError) as exc:
        print(f"prepare_music: refused: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
