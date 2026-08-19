#!/usr/bin/env python3
"""Refuse a film that is older than the board it claims to be a render of.

THE DEFECT THIS EXISTS FOR. A scorer graded a cut and reported that the film opens on a
server aisle while the board says it opens on a building off a frontage road, and that the
credits card prints a colon the board's credits string does not contain. Both were true.
The board had been edited after the render and nothing rebuilt from it, so the run was
grading, scoring and about to ship a film that was not a function of its own inputs.

Every gate was green, and every gate was RIGHT: `storyboard_check` reads the board,
`flow_check` reads the board, `ship_gate` reads the board. Not one of them reads the FILM.
The whole gate suite can pass on a board that no frame was ever rendered from, and the
greener the suite the more confident the wrong answer looks. GATE_LESSONS has this shape
recorded twice already in other clothes: a caption file that was honestly aligned and never
reached the picture, and a credits string fixed in a file the renderer does not read.

So this compares MODIFICATION TIMES, which is the only thing that can catch it. It is a
crude check and it is the right crude check: it does not care what changed, only that the
product is downstream of its inputs in time.

  python3 scripts/freshness_check.py --film out/dispatch/film.mp4 \\
      --inputs out/dispatch/storyboard.json out/dispatch/mix.wav out/dispatch/captions.json
  python3 scripts/freshness_check.py --self-test

Exit 0 fresh, 1 stale, 2 could not run.
"""
from __future__ import annotations

import argparse
import os
import sys
import tempfile
import time
from pathlib import Path

# A render takes minutes and its inputs are written seconds before it starts, so the film's
# mtime is legitimately LATER than every input. Any slack here would only forgive a real
# staleness, so there is none: the film must be strictly newer, to the second.
SLACK_S = 0.0


def check(film: Path, inputs: list[Path]) -> list[str]:
    errs: list[str] = []
    if not film.exists():
        return [f"{film} does not exist, so there is nothing to ship. A run that reports a "
                f"delivered video without one is the fault this whole suite is for."]
    fm = film.stat().st_mtime
    for src in inputs:
        if not src.exists():
            errs.append(f"{src} does not exist, so the film cannot be traced to it.")
            continue
        sm = src.stat().st_mtime
        if sm > fm + SLACK_S:
            errs.append(
                f"{src.name} was modified {sm - fm:.0f}s AFTER {film.name} was written. The "
                f"film is not a render of the board it is about to ship with. Re-render, "
                f"re-mux and re-extract the frames, then run this again. Do NOT reason about "
                f"whether the change 'would have mattered' -- that judgement is exactly what "
                f"a stale render defeats.")
    return errs


def _self_test() -> int:
    fails = []

    def ok(label, cond):
        if not cond:
            fails.append(label)
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}")

    with tempfile.TemporaryDirectory() as d:
        d = Path(d)
        board = d / "board.json"
        mix = d / "mix.wav"
        film = d / "film.mp4"

        board.write_text("{}")
        mix.write_text("x")
        time.sleep(0.02)
        film.write_text("v")
        ok("a film written after its inputs is fresh", not check(film, [board, mix]))

        time.sleep(0.02)
        board.write_text("{} ")                      # the board moves on
        errs = check(film, [board, mix])
        ok("a board edited AFTER the render is refused", bool(errs))
        ok("...and the message names the file that moved",
           any("board.json" in e for e in errs))
        ok("...and it says to re-render rather than to judge whether it mattered",
           any("would have mattered" in e for e in errs))
        ok("...and an input that did NOT move is not blamed",
           not any("mix.wav" in e for e in errs))

        # the fault this catches is one-sided: a film newer than everything is always fine
        os.utime(film, (time.time() + 5, time.time() + 5))
        ok("a film newer than every input passes", not check(film, [board, mix]))

        missing = check(film, [d / "nope.json"])
        ok("an input that does not exist is refused, not skipped", bool(missing))
        ok("a film that does not exist is refused", bool(check(d / "gone.mp4", [board])))

    print()
    print("freshness self-test: " + ("all passed" if not fails else f"{len(fails)} FAILED"))
    return 1 if fails else 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--film")
    ap.add_argument("--inputs", nargs="*", default=[])
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return _self_test()
    if not a.film:
        print("freshness_check: pass --film and --inputs, or --self-test", file=sys.stderr)
        return 2
    errs = check(Path(a.film), [Path(x) for x in a.inputs])
    if errs:
        print("freshness: the film is STALE\n", file=sys.stderr)
        for e in errs:
            print(f"  - {e}", file=sys.stderr)
        return 1
    print(f"freshness: {a.film} is newer than all {len(a.inputs)} of its inputs.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
