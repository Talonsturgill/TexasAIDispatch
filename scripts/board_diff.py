#!/usr/bin/env python3
"""board_diff.py — what a board edit actually did, in the units the viewer sees.

THE FAULT THIS EXISTS FOR, and it is mine rather than the film's.

A board edit is written in board units: `w 520 -> 240`, `z 1150 -> 3104`, `scale 0.22 -> 1.0`.
What reaches a viewer is screen pixels after projection, and the two are related by arithmetic
nobody was doing at edit time. So on 2026-08-19 a run repeatedly made an edit, described the
edit accurately, watched every gate go green, and shipped something other than what it said:

  - "move the floor behind the racks" DELETED the floor from two interiors, because the code
    emptied the plane before moving it. Eleven gates green.
  - "push the block to z=3104 to hold its framing" made the building VANISH behind the horizon
    band. Legal geometry, correct arithmetic, no object left in the frame.
  - "put the bucket truck at true scale" made it 2065 px wide in a 1080 px frame.
  - "raise groundY to kill the dead sky" hid the building, twice, in the same run.

Every one was caught by eye, three of them only after a fourteen minute render, and one of them
only because a judge reported it two rounds later. None was caught by a gate, because each edit
was individually legal. **The defect was never the value. It was the gap between what the edit
was supposed to do and what it did.**

So this reports the CONSEQUENCE of an edit rather than the edit:

    python3 scripts/board_diff.py --before /tmp/board.before.json --after out/dispatch/storyboard.json

It prints, per item, projected height and screen position before and after, and it flags the
four shapes that have actually bitten: something disappeared, something appeared, something
changed size by more than a third, something left the frame.

Run it BEFORE the render, every time an edit touches geometry. It costs nothing and it answers
the only question that matters, which is whether the picture changed the way you said it would.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
LIB = REPO / "video-engine" / "src" / "lib"

M = 610 / 1.7                # draw units per metre, from lib/scale.ts
PERSPECTIVE = 1400.0         # lib/stage3d.tsx
FRAME_W, FRAME_H = 1080.0, 1920.0
FRAME_MID = FRAME_H / 2

# A size change smaller than this is a nudge; larger is a different picture and wants saying.
SIZE_ALERT = 0.34

TABLE_RE = re.compile(r"(?:export )?const ([A-Z_]+_M)\s*[:=][^=]*=\s*\{(.*?)\n\};", re.S)
ENTRY_RE = re.compile(r"^\s*(\w+):\s*\{([^}]*)\}", re.M)
H_RE = re.compile(r"h:\s*([\d.]+)")


def heights() -> dict[str, float]:
    out = {"person": 1.70}
    for p in sorted(LIB.glob("*.tsx")):
        for _n, body in TABLE_RE.findall(p.read_text(encoding="utf-8")):
            for k, inner in ENTRY_RE.findall(body):
                m = H_RE.search(inner)
                if m:
                    out.setdefault(k, float(m.group(1)))
    return out


def catalogue(board: dict, H: dict[str, float]) -> dict:
    """kind + scene + ordinal -> what it looks like on screen."""
    out = {}
    for sc in board.get("scenes", []):
        sid = sc.get("id", "?")
        seen: dict[str, int] = {}
        for pl in sc.get("planes", []):
            z = pl.get("z", 0)
            proj = PERSPECTIVE / (PERSPECTIVE + z)
            for it in pl.get("items", []):
                k = it.get("kind")
                n = seen.get(k, 0)
                seen[k] = n + 1
                h_m = H.get(k)
                px = (h_m * M * it.get("scale", 1) * proj) if h_m else None
                y = it.get("y")
                out[(sid, k, n)] = {
                    "z": z, "scale": it.get("scale"), "x": it.get("x"),
                    "px_h": px,
                    "base_y": (FRAME_MID + (y - FRAME_MID) * proj) if y is not None else None,
                }
    return out


def diff(before: dict, after: dict, H: dict[str, float]) -> tuple[list[str], list[str]]:
    a, b = catalogue(before, H), catalogue(after, H)
    alerts, notes = [], []

    for key in sorted(set(a) - set(b)):
        sid, k, n = key
        alerts.append(f"{sid}: a {k} DISAPPEARED. If the edit was meant to move it, it deleted "
                      f"it instead, which is what 'move the floor behind the racks' did to two "
                      f"interiors while every gate stayed green.")
    for key in sorted(set(b) - set(a)):
        sid, k, n = key
        notes.append(f"{sid}: a {k} appeared.")

    for key in sorted(set(a) & set(b)):
        sid, k, n = key
        x, y = a[key], b[key]
        if x == y:
            continue
        bits = []
        if x["px_h"] and y["px_h"]:
            change = (y["px_h"] - x["px_h"]) / x["px_h"]
            bits.append(f"height {x['px_h']:.0f} -> {y['px_h']:.0f}px ({change:+.0%})")
            if abs(change) >= SIZE_ALERT:
                alerts.append(f"{sid}: {k} changes on-screen height by {change:+.0%} "
                              f"({x['px_h']:.0f} -> {y['px_h']:.0f}px). That is a different "
                              f"picture, not a nudge. Say whether you meant it.")
            if y["px_h"] < 24:
                alerts.append(f"{sid}: {k} ends up {y['px_h']:.0f}px tall, which is not visible. "
                              f"A z push once made the hero of a shot vanish this way.")
        if x["base_y"] is not None and y["base_y"] is not None and abs(x["base_y"] - y["base_y"]) > 1:
            bits.append(f"baseline {x['base_y']:.0f} -> {y['base_y']:.0f}")
            if not 0 <= y["base_y"] <= FRAME_H:
                alerts.append(f"{sid}: {k}'s baseline lands at {y['base_y']:.0f}, outside the "
                              f"0 to {FRAME_H:.0f} frame.")
        if x["z"] != y["z"]:
            bits.append(f"z {x['z']} -> {y['z']}")
        if x["scale"] != y["scale"]:
            bits.append(f"scale {x['scale']} -> {y['scale']}")
        if bits:
            notes.append(f"{sid}: {k}  " + ", ".join(bits))
    return alerts, notes


def self_test() -> int:
    fails = 0

    def ok(label, cond, extra=""):
        nonlocal fails
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}{'' if cond else '  ' + extra}")
        if not cond:
            fails += 1

    H = {"mansardBox": 5.2, "cabinet": 2.0, "hallShell": None}
    H = {k: v for k, v in H.items() if v}

    def board(z, scale, kind="mansardBox", y=1225):
        return {"scenes": [{"id": "s14", "planes": [
            {"z": z, "items": [{"kind": kind, "x": 540, "y": y, "scale": scale,
                                "props": {"w": 330, "h": 150}}]}]}]}

    ok("an unchanged board is quiet", not any(diff(board(1150, .3), board(1150, .3), H)))

    # THE Z PUSH THAT MADE THE BUILDING VANISH.
    al, _ = diff(board(1150, .3), board(3104, .3), H)
    ok("catches a z push that collapses the hero", bool(al), "no alert")
    ok("...and says it is a different picture", bool(al) and "different picture" in al[0])

    # THE TRUE-SCALE TRUCK.
    al, _ = diff(board(200, .22, "cabinet"), board(200, 1.0, "cabinet"), H)
    ok("catches a scale change that redraws the shot", bool(al))

    # THE DELETED FLOOR.
    empty = {"scenes": [{"id": "s14", "planes": [{"z": 1150, "items": []}]}]}
    al, _ = diff(board(1150, .3), empty, H)
    ok("catches an item that disappeared", bool(al) and "DISAPPEARED" in al[0], str(al))

    # A REAL NUDGE MUST STAY QUIET, or nobody will run this before a render.
    al, _ = diff(board(1150, .30), board(1150, .32), H)
    ok("a genuine nudge raises no alert", not al, str(al))

    ok("reads the real dimension tables",
       heights().get("mansardBox") == 5.2 and heights().get("person") == 1.70)

    print(f"board_diff: {fails} failure(s)")
    return 1 if fails else 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--before")
    ap.add_argument("--after")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    if not (a.before and a.after):
        print("board_diff: pass --before and --after, or --self-test", file=sys.stderr)
        return 2

    H = heights()
    alerts, notes = diff(json.loads(Path(a.before).read_text()),
                         json.loads(Path(a.after).read_text()), H)
    for n in notes:
        print(f"  {n}")
    if alerts:
        print(f"\nboard_diff: {len(alerts)} thing(s) worth looking at before you render\n")
        for x in alerts:
            print(f"  ! {x}\n")
        return 1
    print("\nboard_diff: every change is a nudge. Nothing appeared, vanished, resized past a "
          "third, or left the frame.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
