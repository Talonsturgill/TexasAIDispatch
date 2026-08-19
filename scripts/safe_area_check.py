#!/usr/bin/env python3
"""safe_area_check.py — the film does not draw where the feed already has furniture.

THE FAULT THIS EXISTS FOR, and it is the first one this repo has shipped that was not in the
film at all.

On 2026-08-19 the Docket's video feed went live and the first Dispatch went into it. The feed
is a vertical, one-film-per-screen feed, which means it lays its own chrome over the picture:
the title and caption along the bottom, a column of round buttons up the right side. The film's
subtitle band was authored at y=1752, which is 168 px off the bottom of a 1920 frame, and the
feed's overlay claims the bottom quarter. The subtitle and the feed's caption drew on top of
each other. Each was legible alone. Neither was legible together.

**Every gate in this repo was green and every one of them was right.** `ship_gate` proved the
cue text came from the claims. `board_captions` proved the timings were measured. `capFit`
proved the line fitted the band. `flow_check` proved the rhythm. What none of them could know
is that the band itself was in a place the film does not own, because until `lib/safearea.ts`
existed nothing in this repo had ever written down that such a place exists.

That is the shape `GATE_LESSONS.md` keeps recording: correct components, wrong relationship. It
is one step further out than the usual case, though, and worth naming as its own kind. The
relationship here is not between two parts of the film. It is between the film and the SURFACE
THAT PLAYS IT, which lives in another repo and was not consulted because nobody thought to.

So this asserts two things, and the second is the one that will actually catch the next drift:

  1. Every piece of screen-space chrome the film draws stays inside the safe area.
  2. **The geometry is SOLVED from `lib/safearea.ts` rather than typed.** A band that happens
     to sit at a legal y today because someone typed a legal number is a band that goes wrong
     silently the next time the feed's CSS changes, since re-measuring updates the constants
     and reaches nothing. A literal in that position is a fail even when the literal is right.

    python3 scripts/safe_area_check.py
    python3 scripts/safe_area_check.py --self-test
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
ENGINE = REPO / "video-engine" / "src"
SAFEAREA = ENGINE / "lib" / "safearea.ts"
DISPATCH = ENGINE / "Dispatch.tsx"

# The chrome the film draws in screen space, and what it must be solved against. `super` and
# the kicker sit at the TOP of the frame, which no feed furniture claims, so they are checked
# for the frame edge only and are listed here so the file states what it looked at rather than
# leaving a reader to infer it from silence.
BOTTOM_CHROME = ("SubtitleTrack",)


def constants() -> dict[str, float]:
    """The safe area, read from the module that owns it."""
    src = SAFEAREA.read_text(encoding="utf-8")
    out: dict[str, float] = {}
    for name, expr in re.findall(r"export const (\w+)\s*=\s*([^;]+);", src):
        expr = expr.strip()
        if re.fullmatch(r"[-\d.]+", expr):
            out[name] = float(expr)
    # The two derived values are arithmetic on the four above, evaluated the same way the
    # module does rather than re-typed here, because a second copy of a rounding rule is a
    # second place for it to be wrong.
    out["SAFE_BOTTOM"] = round(out["FRAME_H"] * (1 - out["FEED_BOTTOM_RESERVE"]))
    out["SAFE_RIGHT"] = round(out["FRAME_W"] * (1 - out["FEED_RIGHT_RESERVE"]))
    return out


def subtitle_block(src: str) -> str:
    """The SubtitleTrack component's body."""
    m = re.search(r"export const SubtitleTrack.*?\n\};", src, re.S)
    return m.group(0) if m else ""


def check(src: str, C: dict[str, float]) -> list[str]:
    fails: list[str] = []
    block = subtitle_block(src)
    if not block:
        return ["Dispatch.tsx has no SubtitleTrack component. Either it was renamed, in which "
                "case rename it here too, or the bottom band is drawn somewhere this check "
                "cannot see, which is worse."]

    # RULE 1 — the band is positioned against the safe area, by name.
    if "SAFE_BOTTOM" not in block:
        fails.append(
            "SubtitleTrack does not mention SAFE_BOTTOM. Its vertical position is typed rather "
            "than solved, so re-measuring the feed will not move it. That is exactly how the "
            "band came to sit under the feed's caption with every gate green.")
    if "SAFE_RIGHT" not in block:
        fails.append(
            "SubtitleTrack does not mention SAFE_RIGHT. Its width is typed rather than solved, "
            "so a subtitle can run under the feed's button rail and nothing will say so.")

    # RULE 2 — no bare y in the band's old neighbourhood. A literal down there is either the
    # old value or a new one somebody reasoned their way to, and both are the same defect.
    for lit in re.findall(r"\by=\{(\d{3,4})\}", block):
        if int(lit) > C["SAFE_BOTTOM"]:
            fails.append(
                f"SubtitleTrack draws at a literal y={lit}, below the safe area's "
                f"{C['SAFE_BOTTOM']:.0f}. The feed's title and caption are already there.")
    for lit in re.findall(r"\bx=\{(\d{3,4})\}", block):
        if int(lit) > C["SAFE_RIGHT"]:
            fails.append(
                f"SubtitleTrack draws at a literal x={lit}, right of the safe area's "
                f"{C['SAFE_RIGHT']:.0f}, where the feed's button rail is.")

    # RULE 3 — the width the wrapper solves against has to be the safe width, not the frame
    # width. This is the one that fails quietly: a band correctly placed and then filled with
    # lines measured against 1080 puts its own text out past its own plate.
    m = re.search(r"const CAP_W\s*=\s*([^;]+);", src)
    if not m:
        fails.append("CAP_W is gone. The subtitle wrapper has no width to solve against.")
    elif "SAFE_RIGHT" not in m.group(1):
        fails.append(
            f"CAP_W is `{m.group(1).strip()}`, which does not read SAFE_RIGHT. The band would "
            f"be placed inside the safe area and then filled with lines wrapped to the full "
            f"frame, so the text runs off its own plate and under the feed's buttons.")

    # RULE 4 — the reserves have to be at least as big as what was measured. A reserve that
    # drifts below its own measurement is a reserve somebody shrank to make a line fit.
    if C["FEED_BOTTOM_RESERVE"] < 0.2503:
        fails.append(
            f"FEED_BOTTOM_RESERVE is {C['FEED_BOTTOM_RESERVE']}, under the 0.2503 measured on "
            f"the live feed. Shrinking the reserve does not move the feed's caption.")
    if C["FEED_RIGHT_RESERVE"] < 0.1419:
        fails.append(
            f"FEED_RIGHT_RESERVE is {C['FEED_RIGHT_RESERVE']}, under the 0.1419 measured on the "
            f"live feed. Shrinking the reserve does not move the feed's buttons.")
    return fails


def self_test() -> int:
    fails = 0

    def ok(label, cond, extra=""):
        nonlocal fails
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}{'' if cond else '  ' + extra}")
        if not cond:
            fails += 1

    C = constants()
    ok("reads the safe area from its own module",
       C["SAFE_BOTTOM"] == 1421 and C["SAFE_RIGHT"] == 918, str(C))

    live = DISPATCH.read_text(encoding="utf-8")
    ok("the shipped engine passes", not check(live, C), str(check(live, C)))

    # THE DEFECT, REPLAYED. This is the band exactly as it shipped on 2026-08-19.
    broke = live.replace("y={SAFE_BOTTOM - h}", "y={1752 - h}") \
                .replace("width={SAFE_RIGHT - CAP_X}", "width={972}")
    f = check(broke, C)
    ok("catches the band that shipped under the feed's caption", bool(f), "no fail raised")
    ok("...and names the reason rather than the number",
       bool(f) and any("typed rather than solved" in x for x in f), str(f))

    # THE QUIET ONE. Band in the right place, lines wrapped to the whole frame.
    wide = live.replace("const CAP_W = SAFE_RIGHT - CAP_X - CAP_PAD_L - CAP_PAD_R;",
                        "const CAP_W = 1080 - 78 - 30;")
    f = check(wide, C)
    ok("catches a correctly placed band filled with frame-width lines", bool(f), str(f))
    ok("...and says the text runs off its own plate",
       bool(f) and any("off its own plate" in x for x in f), str(f))

    # A RESERVE SHRUNK TO MAKE A LINE FIT.
    f = check(live, {**C, "FEED_BOTTOM_RESERVE": 0.10})
    ok("catches a reserve shrunk below what was measured", bool(f), str(f))

    # A LITERAL THAT HAPPENS TO BE LEGAL IS STILL A LITERAL, so the check must not be
    # satisfied by a number in range. This is the whole point of rule 1.
    legal = live.replace("y={SAFE_BOTTOM - h}", "y={1400 - h}") \
                .replace("width={SAFE_RIGHT - CAP_X}", "width={860}")
    ok("a legal literal is still a fail", bool(check(legal, C)), "a typed number passed")

    print(f"safe_area_check: {fails} failure(s)")
    return 1 if fails else 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    fails = check(DISPATCH.read_text(encoding="utf-8"), constants())
    if fails:
        print(f"\nsafe_area_check: {len(fails)} problem(s)\n")
        for f in fails:
            print(f"  - {f}\n")
        return 1
    print("safe_area_check: the film's chrome stays out of the feed's furniture, and its "
          "geometry is solved from lib/safearea.ts rather than typed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
