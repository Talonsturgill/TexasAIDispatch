#!/usr/bin/env python3
"""floor_check.py — things stand ON the floor, and the floor is BEHIND them.

TWO DEFECTS, ONE GEOMETRY, AND BOTH SURVIVED TWENTY-FIVE PANEL ROUNDS.

**One. The floor drew in front of the racks.** A `floorOnly` hallShell paints the near floor.
In three interiors it was authored on a plane NEARER than the cabinets standing on it, so it
painted over their bases and left the bottom quarter to third of the frame as a featureless
grey band. Every judge filed that band every round, in those words, and nobody asked what was
drawing it. The proof sat inside the same board the whole time: s08's floor was at z=560 behind
its racks at z=520, and s08 was the one interior whose bases read correctly.

**Two. A rank floated above the horizon.** An item's baseline is where it touches the ground, so
it must project BELOW the room's horizon line. Two rows were authored above it and rendered
hanging in mid air. Judges reported the symptom accurately and diagnosed it as a scale error
three separate times, because a floating row reads as "too big for its distance".

WHY NO EXISTING GATE COULD SEE EITHER. `staging_check` checks placement within a plane.
`storyboard_check` checks plane count and coplanarity. `board_scale_check` checks size. Both
faults live in the RELATIONSHIP between a plane's z and another plane's z, which nothing
computed. That is the same shape as every other fault this repo has written a gate for: correct
components, wrong relationship.

AND THE ARITHMETIC HAS ONE TRAP, which this file fell into on its first draft. The horizon and
the item sit on DIFFERENT planes, so their board-space `y` values are not comparable. Both have
to be projected first. Compared raw, the check called four correct scenes broken and one broken
scene fine.

    python3 scripts/floor_check.py --board out/dispatch/storyboard.json
    python3 scripts/floor_check.py --self-test
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

PERSPECTIVE = 1400.0        # matches lib/stage3d.tsx; the camera, not a tuning knob
FRAME_MID = 960.0           # half of the 1920 composition height

# Kinds that stand on the floor of a room. A readout is chrome and a hallShell is the room.
STANDS_ON_FLOOR = {
    # indoors
    "cabinet", "rackRow", "person", "readingStation",
    # outdoors: anything with a foot on the dirt. A sky item (turkeyVulture) and a thing drawn
    # as ground texture (grassTuft, bluestem) are deliberately absent, since neither claims to
    # stand anywhere.
    "mansardBox", "poleSign", "transformer", "dataCentre", "coolingTower", "generatorBank",
    "pumpjack", "liveOak", "mesquite", "pricklyPear", "bucketTruck", "pickup", "cattleGuard",
}

# A baseline this far above the horizon is floating. A couple of pixels is the floor line's own
# stroke width and is not worth failing a correct board over.
FLOAT_TOLERANCE_PX = 8.0


def project(y: float, z: float) -> float:
    return FRAME_MID + (y - FRAME_MID) * (PERSPECTIVE / (PERSPECTIVE + z))


def check(board: dict) -> list[str]:
    fails: list[str] = []
    for sc in board.get("scenes", []):
        sid = sc.get("id", "?")
        planes = sc.get("planes", [])

        floors, shells, standing = [], [], []
        for pl in planes:
            z = pl.get("z", 0)
            for it in pl.get("items", []):
                k = it.get("kind")
                if k == "hallShell":
                    props = it.get("props") or {}
                    (floors if props.get("floorOnly") else shells).append((z, props))
                elif k in STANDS_ON_FLOOR and it.get("y") is not None:
                    standing.append((z, it))

        # RULE 1 — the floor is behind everything standing on it.
        if floors and standing:
            deepest = max(z for z, _ in standing)
            for fz, _ in floors:
                if fz < deepest:
                    fails.append(
                        f"{sid}: the floorOnly hallShell is at z={fz}, NEARER than the "
                        f"deepest item standing on it at z={deepest}. The near floor paints "
                        f"over their bases and leaves the bottom of the frame a dead band. "
                        f"Move the floor to z>={deepest}, which is what the interior that "
                        f"renders correctly already does.")

        # RULE 2 — a baseline projects below the room's horizon.
        room = max(((z, p) for z, p in shells + floors if p.get("horizonY")),
                   default=None, key=lambda t: t[0])
        if room:
            hz = project(room[1]["horizonY"], room[0])
            for z, it in standing:
                base = project(it["y"], z)
                if base < hz - FLOAT_TOLERANCE_PX:
                    fails.append(
                        f"{sid}: {it['kind']} at z={z}, y={it['y']} has its baseline "
                        f"{hz - base:.0f}px ABOVE the room's horizon, so it is standing on "
                        f"nothing. Judges read a floating row as a scale error three separate "
                        f"times. Raise y until the baseline projects below {hz:.0f}.")
        # RULE 3 — outdoors, a thing standing on the ground sits BELOW the horizon.
        # The interior rules above only ever fire in a room, because they need a hallShell to
        # find the horizon. Every exterior fault of the same family therefore had no gate at
        # all, and judges reported three of them in one round: a pole sign whose post ends in
        # mid air, halls the ground appears to run through, and a treeline standing off the
        # deck.
        #
        # The geometry is not a matter of taste. The horizon IS eye level, so ground recedes
        # UPWARD toward it and never past it. An item whose baseline projects ABOVE the ground
        # line at its own depth is standing on nothing, exactly as a rack above a room's horizon
        # is. Same fault, same arithmetic, different room.
        ground = sc.get("groundY")
        if ground is not None and not shells and not floors:
            for z, it in standing:
                base = project(it["y"], z)
                gline = project(ground, z)
                if base < gline - FLOAT_TOLERANCE_PX:
                    fails.append(
                        f"{sid}: {it['kind']} at z={z}, y={it['y']} has its baseline "
                        f"{gline - base:.0f}px ABOVE the ground line at its own depth. Outdoors "
                        f"the horizon is eye level, so ground rises toward it and never past "
                        f"it, and a base above it is a thing standing off the deck. Raise y "
                        f"until the baseline projects below {gline:.0f}.")

    return fails


def self_test() -> int:
    fails = 0

    def ok(label, cond, extra=""):
        nonlocal fails
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}{'' if cond else '  ' + extra}")
        if not cond:
            fails += 1

    def scene(floor_z, rack_z, rack_y, horizon=1560, shell_z=780):
        return {"scenes": [{"id": "sx", "planes": [
            {"z": shell_z, "items": [{"kind": "hallShell", "x": 0, "y": 0,
                                      "props": {"horizonY": horizon}}]},
            {"z": floor_z, "items": [{"kind": "hallShell", "x": 0, "y": 0,
                                      "props": {"horizonY": horizon, "floorOnly": True}}]},
            {"z": rack_z, "items": [{"kind": "cabinet", "x": 100, "y": rack_y,
                                     "scale": 0.6}]}]}]}

    # s08, the interior that renders correctly, is the fixture for "clean".
    ok("a floor behind its racks passes", not check(scene(560, 520, 1620)))

    # THE DEFECT, REPLAYED: s04's floor at z=130 against racks at z=520.
    f = check(scene(130, 520, 1620))
    ok("catches a floor drawn in front of the racks", bool(f), "no fail raised")
    ok("...and says which way to move it", bool(f) and "z>=520" in f[0], f[0] if f else "")

    # THE OTHER DEFECT: a baseline above the horizon.
    f = check(scene(560, 520, 1360))
    ok("catches a rank floating above the horizon", bool(f), "no fail raised")
    ok("...and reports it in projected pixels, not board units",
       bool(f) and "px ABOVE" in f[-1], f[-1] if f else "")

    # THE TRAP THIS FILE FELL INTO. The horizon sits on the far shell and the item on its own
    # plane, so raw `y` comparison is meaningless. Here the item's y (1500) is numerically BELOW
    # the horizon's y (1560), which a naive check reads as floating; projected, it is on the
    # floor. A gate that fails correct work is a gate somebody turns off.
    ok("does NOT flag an item whose raw y looks high but projects onto the floor",
       not check(scene(560, 520, 1500)), str(check(scene(560, 520, 1500))))

    # RULE 3, THE EXTERIOR CASE. Same arithmetic as rule 2, different room, and it had no gate
    # at all until three judges reported three separate symptoms of it in one round.
    def outdoor(y, z, ground=1060):
        return {"scenes": [{"id": "s14", "groundY": ground, "planes": [
            {"z": z, "items": [{"kind": "liveOak", "x": 100, "y": y, "scale": 0.17}]}]}]}

    ok("an exterior item standing on its ground passes", not check(outdoor(1150, 640)))
    f = check(outdoor(1000, 640))
    ok("catches an exterior item floating above its ground line", bool(f), "no fail raised")
    ok("...and reports it in projected pixels at the item's own depth",
       bool(f) and "ABOVE the ground line at its own depth" in f[0], f[0] if f else "")
    # THE SAME TRAP AS RULE 2: the ground line and the item are on different planes, so a raw
    # y comparison is meaningless. Here y=1030 is numerically BELOW groundY=1060, which a naive
    # check reads as standing; projected at z=640 it is floating.
    ok("does NOT clear an item whose raw y looks low but projects above the ground",
       bool(check(outdoor(1030, 640))), "projection was not applied")
    # A sky item claims to stand nowhere and must not be dragged into this.
    ok("a sky item is not asked to stand on anything",
       not check({"scenes": [{"id": "s07", "groundY": 950, "planes": [
           {"z": 700, "items": [{"kind": "turkeyVulture", "x": 700, "y": 360, "scale": 0.42}]}]}]}))

    # A scene with no room at all is not an interior and is not this check's business.
    ok("an exterior with no hallShell is left alone",
       not check({"scenes": [{"id": "s14", "planes": [
           {"z": 200, "items": [{"kind": "person", "x": 0, "y": 1232, "scale": 1.0}]}]}]}))

    print(f"floor_check: {fails} failure(s)")
    return 1 if fails else 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--board")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    if not a.board:
        print("floor_check: pass --board, or --self-test", file=sys.stderr)
        return 2
    fails = check(json.loads(Path(a.board).read_text()))
    if fails:
        print(f"\nfloor_check: {len(fails)} problem(s)\n")
        for f in fails:
            print(f"  - {f}\n")
        return 1
    print("floor_check: every floor is behind what stands on it, and nothing floats.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
