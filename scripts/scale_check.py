#!/usr/bin/env python3
"""scale_check.py — TRUE SCALE, on every module that claims it, not just on fauna.

WHY THIS EXISTS

`scale={1}` means one thing everywhere. That is the founding law of this engine: one metre
constant in `lib/scale.ts`, a per-module `*_M` table of real dimensions, and `fit(key, local)`
mapping a component's local draw box onto its real size. A longhorn and a pickup staged on the
same plane at the same scale are the right size relative to each other, and a Texan can tell.

THE DEFECT THIS EXISTS FOR. Seventeen modules export a `*_M` table. **One of them was read by
any gate.** `staging_check` enforces the rule beautifully and only on `fauna.tsx`, because that
is the module it was written for, and `engine_lint` only asserts that `610 / 1.7` appears once.
So sixteen tables sat unchecked, and a deep review measured what had drifted behind them:

  a marching band whose members render 13 cm tall
  a football field 2.79 m from goal line to goal line
  a goalpost crossbar at 5.04 m, against its own docstring saying "the crossbar sits ten feet up"
  a tortilla 0.92 m across, on a griddle sized from an ICE CREAM CART's metre entry

Every one of those shipped with `tsc` clean, `engine_lint` clean, `paint_ids` clean and
`registry_check` clean, because none of them is a check about size.

WHAT IT CHECKS

  KEYS EXIST   every `fit('k', ...)` names a key in that module's own table. A fit against a
               missing key throws at render time, which is the good case; this catches it first.

  NO ORPHANS   every table entry is used by some `fit()`. An orphan is a dimension somebody
               measured, wrote down, and then drew by eyeballed fraction anyway, which is the
               table quietly stopping being the source of truth.

  NO EXTRA MULTIPLIER   a `fit()` result is a complete answer and must not be multiplied by
               anything. `fit('sousaphone', h) * 0.16` cancels the metre conversion it just did,
               which is how the band ended up ankle-high on a cast member. Legitimate exceptions
               exist and each is EXEMPTED BY NAME WITH A REASON below, never by a pattern.

WHAT IT CANNOT SEE, said plainly. It reads TSX with regular expressions. It cannot tell you a
sub-part drawn at `h * 0.56` is the wrong fraction of a correctly fitted whole, which is exactly
the goalpost crossbar. Catching that needs the drawing measured rather than the source read, and
that is a different gate. This one catches the whole-component failures and the bookkeeping.

    scale_check.py
    scale_check.py --self-test

Exit 0 clean, 1 a problem, 2 the checker could not run.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
LIB = REPO / "video-engine" / "src" / "lib"

# A `fit()` result multiplied by something, exempted by FILE AND LINE CONTENT rather than by a
# pattern, because "allow a multiplier when it looks deliberate" is not a rule anybody can check.
# Each entry names why the multiplier is not cancelling the metre conversion.
#
# The test is a substring of the offending line, so moving the code does not silently re-exempt
# something else, and changing what it does breaks the match and demands a fresh decision.
MULTIPLIER_EXEMPT: dict[str, str] = {
    "fit('redDrink', h) * scale":
        "the component's own scale prop, which every drawable composes with. Not a fraction of "
        "the fit, the staging multiplier applied on top of it.",
    "fit('grackle', 60) * (female ? 0.78 : 1)":
        "great-tailed grackles are strongly dimorphic and the female really is about three "
        "quarters the male. A real dimension, not a fudge.",
    "fit('whitetail', 100) * (southTexas ? 0.88 : 1)":
        "South Texas whitetail are genuinely smaller than Hill Country deer. Same reasoning as "
        "the grackle: the multiplier is a fact about the animal.",
    "fit('bluestem', 60) * (h / 30)":
        "GrassTuft's paths are FIXED local coordinates rather than multiples of h, so h is a "
        "height multiplier here and not a local extent. The ratio converts between the two.",
    "fit('bajoSexto', h) / fit('accordion', h) * 0.42":
        "a RATIO of two fits, sizing one instrument against the other inside a parent already "
        "scaled to the accordion. Both metre entries are still doing their job.",
}

# A SUB-PART THAT IS DRAWN AS A FRACTION OF ITS FITTED PARENT, and has not been converted.
#
# This is real debt and it is recorded rather than hidden. Each of these is a dimension
# somebody measured and wrote down, while the drawing sizes that part by an eyeballed
# fraction of the parent's local box. The press box is the worked example: TOWN_M says 3.2 m
# and the drawing says `height={h * 0.30}`, which measures 2.10 m, so the table has been
# outvoted by a fraction nobody checked.
#
# The idiom for doing it properly is not obvious, which is why there are so many: inside a
# parent already scaled by K, a sub-part of real size S needs local extent S * M / K, which
# works out as `localParent * (S / parentMetres)`. Converting each one means re-deriving that
# part's path coordinates, which is drawing work and not a rename.
#
# THE LIST MAY ONLY SHRINK. A new orphan that is not in here fails, and an entry in here that
# is no longer an orphan also fails, so fixing one forces its line out of this file. That is
# the whole mechanism: the debt is countable, it blocks nothing that already ships, and it
# cannot quietly grow.
UNFITTED_SUBPART: dict[str, str] = {
    "BLACKTX_M.brickStreet": "a laid street surface, drawn as a fraction of the block",
    "BLACKTX_M.choirLoft": "drawn as a fraction of the sanctuary interior",
    "BLACKTX_M.churchPew": "drawn as a fraction of the sanctuary interior",
    "BLACKTX_M.organLeslie": "drawn as a fraction of the sanctuary interior",
    "BLACKTX_M.pitStack": "the barbecue pit's stack, drawn off the pit body",
    "BLACKTX_M.sousaphone": "the horn a band member carries, drawn off the player",
    "BLACKTX_M.trailWagon": "drawn as a fraction of the trail scene",
    "CLINIC_M.couch": "waiting room seating, drawn off the room",
    "CLINIC_M.infusionPole": "drawn off the chair beside it",
    "FLORA_M.citrusTree": "a Valley citrus, no component draws one yet",
    "FLORA_M.paintbrush": "Indian paintbrush, drawn inside a wildflower field",
    "FLORA_M.peachTree": "a Hill Country peach, no component draws one yet",
    "FOOTBALL_M.chainPole": "the chain crew's pole, drawn off the chain run",
    "FREIGHT_M.tractor": "the tractor unit, drawn as part of the whole rig",
    "HOME_M.entryArch": "a ranch entry arch, drawn off the fence line",
    "HOME_M.pecanYard": "a yard pecan, drawn off the house",
    "TOWN_M.chainLink": "chain link fencing, drawn off the field it encloses",
    "TOWN_M.pressBox": "MEASURED WRONG TODAY. The table says 3.2 m and the drawing says "
                       "h * 0.30, which renders 2.10 m, 34 percent short.",
    "PLANT_M.palletStack": "drawn off the plant floor bay",
    "ROAD_M.orderPost": "a drive-in order post, drawn off the canopy",
    "TEJANO_M.charola": "a flat aluminium tray, and its entry records thickness, which is "
                        "the same fault the comal had. It needs an across dimension.",
    "TEJANO_M.mercadoStall": "drawn as a fraction of the mercado row",
    "TEJANO_M.paleteroUmbrella": "the canopy above the cart, drawn off the cart",
    "TEJANO_M.quinceCourt": "a court member, drawn off the quinceañera group",
}

TABLE_RE = re.compile(r"(?:export )?const ([A-Z_]+_M)\s*[:=][^=]*=\s*\{(.*?)\n\};", re.S)
ENTRY_RE = re.compile(r"^\s*(\w+):\s*\{([^}]*)\}", re.M)
FIT_RE = re.compile(r"fit\('(\w+)'")
# a fit(...) call, allowing one level of nested parens, followed by * or /
MULT_RE = re.compile(r"fit\([^()]*(?:\([^()]*\))?[^()]*\)\s*[*/]")


def strip_comments(src: str) -> str:
    """Block and line comments out, so a fit() named in prose is not read as a call."""
    src = re.sub(r"/\*.*?\*/", "", src, flags=re.S)
    return re.sub(r"^\s*//.*$", "", src, flags=re.M)


def modules() -> list[Path]:
    return sorted(p for p in LIB.glob("*.tsx"))


def table_of(src: str) -> tuple[str, set[str], set[str]] | None:
    """(table name, every key, the keys marked `ref: true`).

    A `ref` entry is REFERENCE and not a scale input: it belongs to a component sized to the
    FRAME rather than to the world, like a crop field filling to a vanishing point or a
    convective cell that is 900 m tall and would be 322,938 draw units at true scale. The
    dimension is recorded because somebody drawing that thing needs to know it, and there is
    nothing for `fit` to map it onto.
    """
    m = TABLE_RE.search(src)
    if not m:
        return None
    keys, ref = set(), set()
    for key, body in ENTRY_RE.findall(m.group(2)):
        keys.add(key)
        if re.search(r"\bref:\s*true\b", body):
            ref.add(key)
    return m.group(1), keys, ref


def orphan_problems(rel: str, name: str, keys: set[str], ref: set[str],
                    used: set[str]) -> tuple[list[str], set[str]]:
    """(problems, the debt entries this module accounted for).

    Split out from `check` so the ratchet is testable on inputs rather than only on whatever
    the engine happens to contain today. A rule that can only be exercised by the real
    library is a rule nobody can prove goes red.
    """
    bad: list[str] = []
    seen: set[str] = set()
    for k in sorted(keys - used - ref):
        qualified = f"{name}.{k}"
        if qualified in UNFITTED_SUBPART:
            seen.add(qualified)
            continue
        bad.append(f"{rel}: {name}.{k} is measured and never drawn. Either a sub-part is being "
                   f"sized by an eyeballed fraction instead of this entry, or the entry is "
                   f"speculative. Both make the table stop being the truth. If it is a sub-part "
                   f"nobody has converted yet, record it in UNFITTED_SUBPART with what is true "
                   f"about it. If the component is sized to the FRAME rather than to the world, "
                   f"mark the entry `ref: true` in the table.")
    for k in sorted(ref & used):
        bad.append(f"{rel}: {name}.{k} is marked `ref: true` and something fits on it. A "
                   f"reference dimension is not a scale input. Drop the flag or drop the fit.")
    return bad, seen


def check(verbose: bool = True) -> list[str]:
    bad: list[str] = []
    seen_tables = 0
    used_exempt: set[str] = set()
    seen_debt: set[str] = set()

    for path in modules():
        raw = path.read_text(encoding="utf-8")
        src = strip_comments(raw)
        got = table_of(src)
        if got is None:
            continue
        seen_tables += 1
        name, keys, ref = got
        used = set(FIT_RE.findall(src))
        rel = path.relative_to(REPO)

        for k in sorted(used - keys):
            bad.append(f"{rel}: fit('{k}') names no entry in {name}. It throws at render, and a "
                       f"scene that throws is a scene nobody sees.")
        orphan_bad, orphan_seen = orphan_problems(str(rel), name, keys, ref, used)
        bad += orphan_bad
        seen_debt |= orphan_seen

        for i, line in enumerate(raw.splitlines(), 1):
            if line.lstrip().startswith("//") or not MULT_RE.search(line):
                continue
            hit = next((k for k in MULTIPLIER_EXEMPT if k in line), None)
            if hit:
                used_exempt.add(hit)
                continue
            bad.append(
                f"{rel}:{i}: a fit() result is multiplied. `fit()` already returns the complete "
                f"scale that makes this thing its real size, so multiplying it cancels the metre "
                f"conversion. If the multiplier is a real dimension, add it to "
                f"MULTIPLIER_EXEMPT in scale_check.py with the reason.\n"
                f"        {line.strip()}")

    if seen_tables == 0:
        bad.append("no *_M table was found in any module, so this checker read nothing at all")

    # AN EXEMPTION THAT NO LONGER MATCHES ANYTHING IS A DEAD LICENCE. It stays in the file
    # looking like a considered decision while the code it excused has moved or gone.
    for stale in sorted(set(MULTIPLIER_EXEMPT) - used_exempt):
        bad.append(f"MULTIPLIER_EXEMPT carries {stale!r}, which matches nothing in the engine "
                   f"any more. Delete it rather than leaving a licence lying around.")

    # THE DEBT LIST MAY ONLY SHRINK. An entry that is no longer an orphan has been paid off,
    # and leaving it here would keep a licence open for a fault that is fixed. This is what
    # makes the list a ratchet rather than a drawer.
    for paid in sorted(set(UNFITTED_SUBPART) - seen_debt):
        bad.append(f"UNFITTED_SUBPART still lists {paid}, which is now drawn to its own "
                   f"dimension. Delete that line: the debt is paid and the list only shrinks.")

    if verbose and not bad:
        print(f"scale check: clean. {seen_tables} metre table(s), every key either drawn or "
              f"declared reference, every fit whole. {len(UNFITTED_SUBPART)} sub-part(s) still "
              f"drawn by fraction, recorded and shrinking.")
    return bad


# ---------------------------------------------------------------- self-test
def self_test() -> int:
    failures = 0

    def ok(label, cond, extra=""):
        nonlocal failures
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}{'' if cond else '  ' + extra}")
        if not cond:
            failures += 1

    good = """export const DEMO_M: Record<string, {h: number}> = {
  post: {h: 2.4},
  bell: {h: 0.76},
};
const fit = fitter(DEMO_M);
export const Post: React.FC<X> = () => { const K = fit('post', 90); };
export const Bell: React.FC<X> = () => { const K = fit('bell', 40); };
"""
    t = table_of(good)
    ok("a table parses", t is not None and t[0] == "DEMO_M" and t[1] == {"post", "bell"}, str(t))
    ok("fit calls parse", set(FIT_RE.findall(good)) == {"post", "bell"})

    ok("a bare fit is not read as multiplied", not MULT_RE.search("const K = fit('post', 90);"))
    ok("a multiplied fit IS caught", bool(MULT_RE.search("const K = fit('post', 90) * 0.16;")))
    ok("...including one with a parenthesised multiplier",
       bool(MULT_RE.search("const K = fit('cart', 90) * (h / 70);")))
    ok("...and a divided one", bool(MULT_RE.search("const K = fit('post', 90) / 2;")))
    ok("a fit inside a template scale() is still seen",
       bool(MULT_RE.search("scale(${fit('drink', h) * scale})")))

    ok("a comment mentioning fit() is not a call",
       set(FIT_RE.findall(strip_comments("// see fit('ghost', 9)\nconst K = fit('post', 9);")))
       == {"post"})

    # THE REFERENCE FLAG, which is how a frame-sized component declares it has nothing to fit.
    reffed = """export const DEMO_M: Record<string, {h: number; ref?: boolean}> = {
  post: {h: 2.4},
  sky: {h: 900, ref: true, note: 'a storm cell, drawn to the frame'},
};
export const Post: React.FC<X> = () => { const K = fit('post', 90); };
"""
    t2 = table_of(reffed)
    ok("a ref entry is read as reference rather than as a scale input",
       t2 is not None and t2[1] == {"post", "sky"} and t2[2] == {"sky"}, str(t2))
    ok("...and a plain entry is not mistaken for one",
       table_of(good) is not None and table_of(good)[2] == set())

    # THE RATCHET, both directions, because a debt list that only grows is a drawer.
    new_orphan, seen = orphan_problems("demo.tsx", "DEMO_M", {"post", "ghost"}, set(), {"post"})
    ok("a NEW orphan nobody recorded is refused",
       any("measured and never drawn" in p for p in new_orphan), str(new_orphan))
    recorded, seen = orphan_problems("hometown.tsx", "TOWN_M", {"pressBox"}, set(), set())
    ok("...and one already recorded as debt is allowed through",
       not recorded and seen == {"TOWN_M.pressBox"}, f"{recorded} / {seen}")
    reffed_ok, _ = orphan_problems("water.tsx", "WATER_M", {"rainCell"}, {"rainCell"}, set())
    ok("...and a ref entry is not an orphan at all", not reffed_ok, str(reffed_ok))
    clash, _ = orphan_problems("water.tsx", "WATER_M", {"rainCell"}, {"rainCell"}, {"rainCell"})
    ok("...while fitting ON a ref entry is refused, since reference is not a scale input",
       any("not a scale input" in p for p in clash), str(clash))

    # THE REAL ENGINE. A fixture proves the checker works and says nothing about the library.
    real = check(verbose=False)
    ok("every metre table in the engine holds", not real,
       "\n      " + "\n      ".join(real[:8]))

    tables = [table_of(strip_comments(p.read_text(encoding="utf-8"))) for p in modules()]
    n = len([t for t in tables if t])
    ok(f"it reaches every module that declares a table ({n})", n >= 17, str(n))

    if failures:
        print(f"\nscale_check self-test: {failures} FAILED", file=sys.stderr)
        return 1
    print("\nscale_check self-test: all passed")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    try:
        problems = check()
    except OSError as exc:
        print(f"scale_check: cannot run: {exc}", file=sys.stderr)
        return 2
    if problems:
        print(f"scale check: {len(problems)} problem(s)\n", file=sys.stderr)
        for p in problems:
            print(f"  - {p}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
