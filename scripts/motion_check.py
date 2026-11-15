#!/usr/bin/env python3
"""THE STILLNESS CHECK. Finds the stretches of a finished film where the picture stops moving.

A short-form viewer swipes on a held frame. The board can promise a new beat every few seconds
and the picture can still sit dead between them, because a drawing that does not act is a slide
however good it looks. This measures the cut itself:

  1. Decode the film small (135 x 240, grey, 10 fps) with the ffmpeg the pipeline already has.
  2. For each frame, the mean absolute change from the frame before, in 0 to 255 grey levels, over
     the picture's rows only (the caption and chip bands change on every word by themselves).
  3. Report every run of at least MIN_S seconds whose change stays under STILL_LEVEL, outside
     the credits.

`lean.py check` lists each run as a note (a judgement call, never a blocker), with the times, so
the run knows which shot to give an action. The threshold sits under the slow camera push and
the film grain on their own (measured on the November 14th film), so a shot with only the push and nothing acting still reads as still.

Usage:
  python3 scripts/motion_check.py out/dispatch/film.mp4 [--story-s 98.4]
  python3 scripts/motion_check.py --selftest
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

W, H, FPS = 135, 240, 10
STILL_LEVEL = 0.8     # grey levels of mean change per frame at 10 fps, picture rows only
MIN_S = 1.6
# The word captions (src/look/Captions.tsx, from about y 1120 to the safe bottom at 1421) and the
# label chip band (y 250 to 400) change on their own every word, so they are left out: the question
# is whether the PICTURE moves. Fractions of frame height.
MASKED_ROWS = ((0.58, 0.76), (0.13, 0.21))


def frame_changes(path: Path) -> np.ndarray:
    proc = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-an", "-vf",
                           f"fps={FPS},scale={W}:{H},format=gray", "-f", "rawvideo", "-"],
                          capture_output=True, check=True)
    frames = np.frombuffer(proc.stdout, dtype=np.uint8)
    n = len(frames) // (W * H)
    if n < 2:
        return np.zeros(0)
    frames = frames[: n * W * H].reshape(n, H, W).astype(np.int16)
    keep = np.ones(H, dtype=bool)
    for a, b in MASKED_ROWS:
        keep[int(a * H):int(b * H)] = False
    return np.abs(np.diff(frames[:, keep, :], axis=0)).mean(axis=(1, 2))


def still_runs(changes: np.ndarray, story_s: float | None = None, level: float = STILL_LEVEL,
               min_s: float = MIN_S) -> list[tuple[float, float]]:
    end = len(changes) if story_s is None else min(len(changes), int(story_s * FPS))
    runs, start = [], None
    for i in range(end):
        still = changes[i] < level
        if still and start is None:
            start = i
        if (not still or i == end - 1) and start is not None:
            stop = i if not still else i + 1
            if (stop - start) / FPS >= min_s:
                runs.append((round((start + 1) / FPS, 1), round((stop + 1) / FPS, 1)))
            start = None
    return runs


def notes(path: Path, story_s: float | None) -> list[str]:
    runs = still_runs(frame_changes(path), story_s)
    return [f"the picture barely moves from {a:.1f}s to {b:.1f}s ({b - a:.1f}s). Give that shot an action "
            "on screen, not only the camera push" for a, b in runs]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("film", nargs="?")
    ap.add_argument("--story-s", type=float)
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        return selftest()
    if not a.film:
        ap.error("give a film path")
    found = notes(Path(a.film), a.story_s)
    if a.json:
        print(json.dumps(found))
    else:
        print("\n".join(found) if found else "stillness check: the picture moves throughout")
    return 0


def selftest() -> int:
    fails = 0

    def ok(name: str, cond: bool) -> None:
        nonlocal fails
        print(("PASS " if cond else "FAIL ") + name)
        fails += 0 if cond else 1

    moving = np.full(50, 6.0)
    ok("a picture that keeps moving has no still run", still_runs(moving) == [])
    held = np.concatenate([np.full(20, 6.0), np.full(25, 0.3), np.full(20, 6.0)])
    runs = still_runs(held)
    ok("a 2.5 s held frame is found at its own time", len(runs) == 1 and abs(runs[0][0] - 2.1) < 0.15
       and abs(runs[0][1] - 4.6) < 0.15)
    short = np.concatenate([np.full(20, 6.0), np.full(8, 0.3), np.full(20, 6.0)])
    ok("a held frame under the minimum is a beat, not a stall", still_runs(short) == [])
    tail = np.concatenate([np.full(30, 6.0), np.full(40, 0.2)])
    ok("the credits after the story are never reported", still_runs(tail, story_s=3.0) == [])
    ok("a still run at the very end of the story is still reported", len(still_runs(tail)) == 1)
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
