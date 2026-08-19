#!/usr/bin/env python3
"""board_scale_check.py — what the BOARD's `scale` values mean in metres.

THE DEFECT THIS EXISTS FOR, measured rather than argued.

`scale_check.py` reads the ENGINE and proves every module's dimension table is wired to a
`fit()`. It is a good gate and it is blind to the fault below, because the fault is not in the
engine. Every component here is fitted correctly and renders at true size at `scale: 1`. The
board then multiplies that by a number, and the board had been using that number as a distance
dial. `z` is the distance dial. `scale` is natural variation, a tall tree against a short one.

Run against the board that shipped, the arithmetic is a doll's house:

    pickup        0.20  ->  0.40 m      a pickup you could carry
    transformer   0.08  ->  0.36 m      a 4.5 m pad transformer as a shoebox
    bucketTruck   0.22  ->  0.75 m      knee high on the lineworker standing beside it
    pumpjack      0.115 ->  0.75 m
    poleSign      0.08  ->  0.88 m
    mansardBox    0.30  ->  1.56 m      a building shorter than the person who works in it
    dataCentre    0.062 ->  0.74 m

Three judges found three separate faults in one round and all three were this one arithmetic.
One wrote that the bucket truck "reads as a cup" in the lineworker's hand. One wrote that the
pumpjack "reads as a pipeline or a satellite dish". One wrote that the block "reads as an open
picnic pavilion". Nobody was looking at a drawing error. They were looking at correct drawings
of the wrong size, and the reason it half works is that almost everything outdoors is miniature
together, so it only breaks visibly where a correctly scaled PERSON stands next to one.

That is why no gate saw it. `staging_check` checks placement, `scale_check` checks the source,
and the product of a table height and a board number was a quantity nothing computed.

HOW THIS GATE IS ENFORCED, and the waiver list is the honest part.

Failing every item at once would make this gate the thing standing between the show and any
delivery at all, and a gate that blocks all work is a gate that gets commented out. So the
current state is written down as DEBT, per kind, with the worst scale each kind is currently
allowed. Anything NEW, or anything that gets WORSE than the recorded debt, fails immediately.
The list is a ledger of what is owed and it is meant to shrink. It is not a permission slip:
every line in it is a defect, and a run that improves one lowers the number in the same commit.

    python3 scripts/board_scale_check.py --board out/dispatch/storyboard.json
    python3 scripts/board_scale_check.py --board ... --report   # the full table, exit 0
    python3 scripts/board_scale_check.py --self-test
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
LIB = REPO / "video-engine" / "src" / "lib"

# `scale` is natural variation. A live oak may be half again the height of its neighbour and a
# person may be a head shorter. Nothing legitimate is a fifth of its own species.
SCALE_MIN, SCALE_MAX = 0.5, 2.0

# SOME KINDS VARY MUCH LESS THAN THAT, and the generic band is useless on them. A person is the
# case that matters, because the person is the reference object the whole engine is measured
# against. Adult height spans maybe a fifth, not a factor of four, so a technician at `scale:
# 1.25` is 2.12 m and sailed straight through the generic band on the first version of this
# gate. The tighter band is what catches it. Anything outside a kind's band still falls through
# to the debt ledger, so a deliberate child or a deliberate giant is written down rather than
# waved past.
BANDS: dict[str, tuple[float, float]] = {
    "person": (0.82, 1.12),        # 1.39 m to 1.90 m, which is the adult range this cast draws
}

# THE DEBT. kind -> (worst scale currently tolerated, why it is here).
# Every line is a defect that has shipped. Lower a number when a run fixes one; never raise one.
DEBT: dict[str, tuple[float, str]] = {
    "bluestem":     (0.05,  "a 1.2 m bunchgrass drawn at 6 cm, used as verge texture"),
    "bucketTruck":  (0.22,  "0.75 m beside a 1.79 m lineworker. A judge called it a cup."),
    "cattleGuard":  (0.50,  "0.15 m. A cattle guard is a pit, so the error reads as texture."),
    "coolingTower": (0.15,  "1.35 m against a 9 m tower"),
    "dataCentre":   (0.062, "0.74 m. The Abilene hall as a footstool."),
    "liveOak":      (0.1668, "2.34 m. A live oak that a person could look over."),
    "mansardBox":   (0.30,  "1.56 m. The building is shorter than the people inside it."),
    "mesquite":     (0.12,  "0.72 m, and it is drawn with the live oak's canopy besides"),
    "pickup":       (0.20,  "0.40 m"),
    "poleSign":     (0.08,  "0.88 m against an 11 m sign"),
    "pricklyPear":  (0.30,  "0.36 m, which is a young pad cluster and nearly defensible"),
    "pumpjack":     (0.115, "0.75 m. A judge read it as a satellite dish."),
    "rackRow":      (0.34,  "0.88 m"),
    "readingStation": (0.72, "0.94 m, close enough that it is the cheapest line to clear"),
    "transformer":  (0.08,  "0.36 m against a 4.5 m pad transformer"),
    "cabinet":      (0.50,  "1.00 m against a 2 m rack cabinet"),
    # THE REFERENCE OBJECT ITSELF, which is the worst line in this ledger. A person at 1.19 m
    # is a child and a person at 2.12 m is nearly seven feet, and every other size in the film
    # is judged by eye against them. Fixing this is the highest value line here, not the
    # cheapest, because it is what makes every other error visible.
    # PAID OFF 2026-08-19, and the line stays as the record rather than as a waiver. The board
    # carried a 1.19 m technician in s02 and 2.12 m people in s05 and s09; all four persons are
    # now 1.0, which is 1.70 m, which is the definition the metre itself comes from. A person is
    # also the safe one to fix, because a person is about a third as wide as tall, so correcting
    # the height cannot push the width out of frame the way it does on a vehicle.
    # No entry means no tolerance: any person off the band now fails outright.
}

TABLE_RE = re.compile(r"(?:export )?const ([A-Z_]+_M)\s*[:=][^=]*=\s*\{(.*?)\n\};", re.S)
ENTRY_RE = re.compile(r"^\s*(\w+):\s*\{([^}]*)\}", re.M)
H_RE = re.compile(r"h:\s*([\d.]+)")


def measured_heights(lib: Path) -> dict[str, float]:
    """kind -> real height in metres, from the modules' own dimension tables.

    `person` is seeded by hand and it is the only one that is, because a person is not IN a
    dimension table: the person IS the table. `lib/scale.ts` defines the metre as 610 draw
    units over 1.70 m, taken from the Character rig sole to crown, so `person` at `scale: 1` is
    1.70 m BY CONSTRUCTION and every other measurement in the engine is expressed against it.
    Leaving the reference object out of the check meant the one item whose size defines all the
    others was the one item nothing could check, and the board had a technician at 1.19 m and
    two people at 2.12 m.
    """
    out: dict[str, float] = {"person": 1.70}
    for p in sorted(lib.glob("*.tsx")):
        for _name, body in TABLE_RE.findall(p.read_text(encoding="utf-8")):
            for key, inner in ENTRY_RE.findall(body):
                m = H_RE.search(inner)
                if m:
                    out.setdefault(key, float(m.group(1)))
    return out


def board_items(board: dict):
    for sc in board.get("scenes", []):
        for pl in sc.get("planes", []):
            for it in pl.get("items", []):
                yield sc.get("id", "?"), pl.get("z"), it


def check(board: dict, heights: dict[str, float]) -> tuple[list[str], list[str], list[str]]:
    fails: list[str] = []
    unmeasured: set[str] = set()
    rows: list[str] = []

    for sid, z, it in board_items(board):
        kind = it.get("kind")
        scale = it.get("scale")
        if scale is None:
            continue
        h = heights.get(kind)
        if h is None:
            unmeasured.add(kind)
            continue
        real = h * scale
        rows.append(f"    {sid:<5} z={str(z):<6} {kind:<16} scale {scale:<8} -> {real:6.2f} m")
        lo_band, hi_band = BANDS.get(kind, (SCALE_MIN, SCALE_MAX))
        if lo_band <= scale <= hi_band:
            continue
        allowed, why = DEBT.get(kind, (None, ""))
        # A debt line records the tolerated RANGE, because a kind can be wrong in both
        # directions at once and `person` is. Recording only the high side let every low value
        # through under it, which is the shape of a waiver that quietly stops meaning anything.
        # A bare number is shorthand for "this far below the band and no further".
        lo_ok, hi_ok = (allowed if isinstance(allowed, tuple)
                        else (allowed, None) if allowed is not None else (None, None))
        if lo_ok is not None and lo_band > scale >= lo_ok - 1e-9:
            continue
        if hi_ok is not None and hi_band < scale <= hi_ok + 1e-9:
            continue
        if allowed is None:
            fails.append(
                f"{sid}: {kind} at scale {scale} is {real:.2f} m, against a measured "
                f"{h:.1f} m. `scale` is natural variation, not distance. Use `z` for distance, "
                f"or add this kind to DEBT with the reason it had to ship wrong.")
        else:
            fails.append(
                f"{sid}: {kind} at scale {scale} is {real:.2f} m. The debt ledger already "
                f"tolerates {allowed} for this kind ({why}), and this is WORSE. The ledger is "
                f"meant to shrink.")

    notes = [f"{k} has no measured height in any module's *_M table, so nothing can check it"
             for k in sorted(unmeasured)]
    return fails, notes, rows


def self_test() -> int:
    fails = 0

    def ok(label, cond, extra=""):
        nonlocal fails
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}{'' if cond else '  ' + extra}")
        if not cond:
            fails += 1

    H = {"pickup": 2.0, "person": 1.7, "windmill": 10.0}

    def board(*items):
        return {"scenes": [{"id": "s01", "planes": [{"z": 100, "items": list(items)}]}]}

    f, _, _ = check(board({"kind": "person", "scale": 1.0}), H)
    ok("true scale passes", not f, str(f))
    f, _, _ = check(board({"kind": "windmill", "scale": 1.15}), H)
    ok("natural variation passes", not f, str(f))

    # THE PERSON BAND, which is tighter than the generic one and has to be tested as itself.
    # This case used a person at 1.15 before the band existed, and retiring the person debt line
    # turned it red: 1.15 is 1.95 m, six foot five, which the band is right to refuse. The band
    # stayed and the case moved to a kind that carries the generic band, which is what the case
    # was actually about.
    f, _, _ = check(board({"kind": "person", "scale": 1.10}), H)
    ok("a 1.87 m person passes", not f, str(f))
    f, _, _ = check(board({"kind": "person", "scale": 0.85}), H)
    ok("a 1.45 m person passes", not f, str(f))
    f, _, _ = check(board({"kind": "person", "scale": 1.25}), H)
    ok("a 2.12 m person fails now the debt is paid", bool(f), "no fail raised")
    f, _, _ = check(board({"kind": "person", "scale": 0.70}), H)
    ok("a 1.19 m adult fails now the debt is paid", bool(f), "no fail raised")

    # THE DEFECT, REPLAYED: a kind with no debt line, used as a distance dial.
    f, _, _ = check(board({"kind": "windmill", "scale": 0.1}), H)
    ok("catches a fresh kind used as a distance dial", bool(f), "no fail raised")
    ok("...and says what it means in metres", bool(f) and "1.00 m" in f[0], f[0] if f else "")

    # A kind ON the ledger at its recorded worst is tolerated, and worse is not.
    f, _, _ = check(board({"kind": "pickup", "scale": 0.20}), H)
    ok("the recorded debt is tolerated", not f, str(f))
    f, _, _ = check(board({"kind": "pickup", "scale": 0.10}), H)
    ok("catches debt getting WORSE", bool(f), "no fail raised")
    f, _, _ = check(board({"kind": "pickup", "scale": 0.60}), H)
    ok("a run that IMPROVES a debt line passes", not f, str(f))

    _, n, _ = check(board({"kind": "ufo", "scale": 0.2}), H)
    ok("reports a kind with no measured height", bool(n), "no note raised")

    heights = measured_heights(LIB)
    ok("reads the real tables", len(heights) > 40 and heights.get("mansardBox") == 5.2,
       f"{len(heights)} keys, mansardBox={heights.get('mansardBox')}")

    print(f"board_scale_check: {fails} failure(s)")
    return 1 if fails else 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--board")
    ap.add_argument("--report", action="store_true", help="print every item and exit 0")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    if not a.board:
        print("board_scale_check: pass --board, or --self-test", file=sys.stderr)
        return 2

    heights = measured_heights(LIB)
    board = json.loads(Path(a.board).read_text())
    fails, notes, rows = check(board, heights)

    if a.report:
        print("  every board item, and what its scale means in metres:")
        print("\n".join(rows))
        print()
    for n in notes:
        print(f"  note  {n}")
    if fails:
        print(f"\nboard_scale_check: {len(fails)} problem(s)\n")
        for f in fails:
            print(f"  - {f}\n")
        return 1
    owed = len(DEBT)
    print(f"\nboard_scale_check: clean against the ledger. {owed} kinds still carry scale debt, "
          f"and every one of them is a defect waiting for a run to lower it.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
