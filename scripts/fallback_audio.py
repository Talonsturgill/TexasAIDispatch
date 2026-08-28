#!/usr/bin/env python3
"""Build a review-only visual cut when no narrated take can be produced.

This is not a publication fallback. It creates an exact-length silent PCM master and an explicit
failed-caption report so the existing render path can still produce a playable MP4 for review.
The hard-fail gates remain red by design; a missing credential must not become either a silent
public film or an empty run.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
import tempfile
import wave
from pathlib import Path

RATE = 48000


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def runtime(board: dict) -> float:
    declared = float(board.get("runtime_s") or 0)
    scene_end = max((float(s.get("start_s") or 0) + float(s.get("duration_s") or 0)
                     for s in board.get("scenes") or []), default=0.0)
    value = max(declared, scene_end)
    if value <= 0:
        raise ValueError("the board has no positive runtime")
    return value


def build(board_path: Path, wav_path: Path, report_path: Path, captions_path: Path) -> None:
    board = json.loads(board_path.read_text(encoding="utf-8"))
    seconds = runtime(board)
    samples = int(round(seconds * RATE))
    wav_path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(wav_path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        block = b"\0\0" * RATE
        left = samples
        while left:
            n = min(left, RATE)
            w.writeframesraw(block[:n * 2])
            left -= n
        w.writeframes(b"")

    report = {
        "schema": "dispatch_review_fallback_audio/1",
        "review_only": True,
        "reason": "no narrated take was available; this master exists to prevent an empty run",
        "duration_s": round(seconds, 3),
        "sample_rate": RATE,
        "channels": 1,
        "time_stretch": 1.0,
        "tracks": [{"id": "visual-review-silence", "time_stretch": 1.0}],
        "master_file": str(wav_path),
        "master_sha256": digest(wav_path),
    }
    captions = {
        "schema": "dispatch_review_fallback_captions/1",
        "review_only": True,
        "method": "unavailable_no_narrated_take",
        "words_file": None,
        "boundaries_measured": 0,
        "cues": [],
    }
    report_path.parent.mkdir(parents=True, exist_ok=True)
    captions_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    captions_path.write_text(json.dumps(captions, indent=2) + "\n", encoding="utf-8")


def self_test() -> int:
    failures = 0

    def ok(label: str, condition: bool) -> None:
        nonlocal failures
        print(f"  {'ok  ' if condition else 'FAIL'}  {label}")
        failures += 0 if condition else 1

    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        board = root / "board.json"
        wav = root / "mix.wav"
        report = root / "mix.json"
        captions = root / "captions.json"
        board.write_text(json.dumps({
            "runtime_s": 2.25,
            "scenes": [{"start_s": 0, "duration_s": 2.25}],
        }) + "\n", encoding="utf-8")
        build(board, wav, report, captions)
        with wave.open(str(wav), "rb") as w:
            ok("fallback audio is mono 48 kHz PCM", w.getnchannels() == 1
               and w.getframerate() == RATE and w.getsampwidth() == 2)
            ok("fallback audio exactly spans the board", w.getnframes() == int(2.25 * RATE))
        rep = json.loads(report.read_text())
        caps = json.loads(captions.read_text())
        ok("the master hash is honest", rep["master_sha256"] == digest(wav))
        ok("the artifacts say review-only rather than impersonating a pass",
           rep["review_only"] and caps["review_only"] and caps["boundaries_measured"] == 0)
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        from ship_gate import ACCEPTED_ALIGNMENT
        ok("the shipping gate cannot mistake fallback captions for aligned narration",
           caps["method"] not in ACCEPTED_ALIGNMENT)
        try:
            runtime({"scenes": []})
            empty_refused = False
        except ValueError:
            empty_refused = True
        ok("an empty board is refused rather than rendered as success", empty_refused)
    print(f"fallback_audio: {failures} failure(s)")
    return 1 if failures else 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--board")
    ap.add_argument("--wav")
    ap.add_argument("--report")
    ap.add_argument("--captions")
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()
    if args.self_test:
        return self_test()
    if not all((args.board, args.wav, args.report, args.captions)):
        print("fallback_audio: --board, --wav, --report and --captions are required",
              file=sys.stderr)
        return 2
    try:
        build(Path(args.board), Path(args.wav), Path(args.report), Path(args.captions))
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"fallback_audio: cannot build review-only audio: {exc}", file=sys.stderr)
        return 1
    print("fallback_audio: review-only visual cut audio is ready; never publish this fallback")
    return 0


if __name__ == "__main__":
    sys.exit(main())
