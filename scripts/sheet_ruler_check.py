#!/usr/bin/env python3
"""sheet_ruler_check.py — the person standing next to a thing has to be the same size as it.

WHY THIS EXISTS

`clinic.tsx` states the rule the review sheets are built on: "THE MACHINE IS THE SUBJECT AND
THE PERSON IS THE SCALE. A gantry drawn without a person beside it could be any size." The
sheets honour it by putting a `<Ref>` cast member in the row. Ten rows out of twenty-four then
staged that person at a DIFFERENT scale from the thing being measured.

THE DEFECT IT IS FOR, and it is not hypothetical. The row where the driverless rig is signed
off drew the engineer at `scale={0.28}` against a rig at `scale={0.16}`. The person came out
1.75 times life size, so the truck read a third smaller than it is, and a cab roof drawn 12
percent too tall looked fine. `true_scale.mjs` measures components and would have caught the
roof if anyone had thought to measure it. Nobody did, because the picture looked right, and the
picture looked right because the ruler in it was wrong.

**A human reference staged differently from its subject is worse than no reference, because a
reviewer trusts it.** That is the whole of this file.

TWO THINGS IT CHECKS.

  THE RULER MATCHES. Every `<Ref scale={r}>` in a row must share its scale with something else
  staged in that row. A ruler nothing agrees with is measuring a world of its own.

  THE ROW AGREES WITH ITSELF. A row carrying a ruler may stage its subjects at ONE scale. Two
  subject scales plus a person is three worlds in one picture: the machine room row drew a
  2.38 m switchgear line-up and a 1.93 m CDU the same height, with a 1.7 m engineer taller
  than both. Every component in this engine is already true to its own metres, which is what
  makes a mixed staging scale a lie rather than a simplification.

A row that genuinely cannot hold one scale goes in EXEMPT with its reason. There is one, and
the reason is arithmetic rather than taste: a 0.15 m handset staged beside a 9 m siren mast is
five pixels.

WHAT IT CANNOT SEE, said plainly. It reads TSX with regular expressions. A scale passed through
a variable, a subject rendered from a map over data, or a row built by a helper component are
all beyond it. It is a lint. What it IS exact about is the pairing it reads, and an exemption
that stops matching is reported rather than left lying around.

    sheet_ruler_check.py
    sheet_ruler_check.py --self-test

Exit 0 clean, 1 a mismatch, 2 the checker could not run.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SHEETS = REPO / "video-engine" / "src"

# A row whose subjects genuinely cannot share one staging scale, with the reason. Not a
# licence for "this one looked better": the reason has to be a size somebody can check.
EXEMPT: dict[str, str] = {
    "The siren, and the phone":
        "a 0.15 m handset staged with a 9 m siren mast is five pixels, so the phone is blown "
        "up about six times and carries no scale claim. Its label on the sheet says so, and "
        "the ruler stands with the siren, which is the object that has a real size here.",
    "The town, the yard and the sensor":
        "three magnitudes on purpose, which is the row's subject. A 40 m grain elevator at "
        "the soil probe's 0.36 would be five thousand pixels on a 1080 sheet. The ruler goes "
        "to the probe, the one object here a viewer cannot size from memory, and the probe's "
        "label says the person belongs to that pairing.",
}

ROW_RE = re.compile(r"<Row\b.*?</Row>", re.S)
HEAD_RE = re.compile(r'head="([^"]*)"')
# `<Name ... scale={0.3} ...>` for any component. The name decides whether it is the ruler.
STAGED_RE = re.compile(r"<(\w[\w.]*)\b[^>]*?\bscale=\{([\d.]+)\}", re.S)
# A Ref with no scale at all takes the helper's default and mismatches in silence.
BARE_REF_RE = re.compile(r"<Ref\b(?![^>]*\bscale=)[^>]*>")


def sheet_files() -> list[Path]:
    """Every sheet that renders a human reference."""
    return sorted(p for p in SHEETS.glob("*.tsx") if "<Ref " in p.read_text(encoding="utf-8"))


def rows(src: str) -> list[tuple[str, str]]:
    """(head, block) for every <Row>...</Row>. Rows do not nest, so this is exact."""
    out = []
    for m in ROW_RE.finditer(src):
        block = m.group(0)
        head = HEAD_RE.search(block)
        out.append((head.group(1) if head else "(unnamed row)", block))
    return out


def row_problems(rel: str, head: str, block: str) -> list[str]:
    bad: list[str] = []
    staged = STAGED_RE.findall(block)
    refs = sorted({s for name, s in staged if name == "Ref"})
    subjects = sorted({s for name, s in staged if name != "Ref"})

    for _ in BARE_REF_RE.findall(block):
        bad.append(f"{rel}: row {head!r} has a <Ref> with no scale, so it takes the helper's "
                   f"default and agrees with its subject only by luck. State the scale.")

    if not refs:
        return bad
    if not subjects:
        bad.append(f"{rel}: row {head!r} carries a human reference and stages nothing with a "
                   f"scale prop, so the reference measures nothing. Drop the Ref or stage the "
                   f"subject.")
        return bad

    if head in EXEMPT:
        return bad

    if len(subjects) > 1:
        bad.append(f"{rel}: row {head!r} carries a human reference and stages its subjects at "
                   f"{len(subjects)} different scales ({', '.join(subjects)}). A row with a "
                   f"ruler gets one scale, because every component here is already true to its "
                   f"own metres and a second staging scale makes two of them disagree on the "
                   f"page while both are right in the table. Pick one, or list the row in "
                   f"EXEMPT in sheet_ruler_check.py with a size somebody can check.")
        return bad

    for r in refs:
        if r not in subjects:
            bad.append(f"{rel}: row {head!r} stages the human reference at {r} and its subject "
                       f"at {subjects[0]}. The person comes out "
                       f"{float(r) / float(subjects[0]):.2f} times the size it should be beside "
                       f"that subject, and a reviewer reads the row as true. Match the ruler to "
                       f"what it measures.")
    return bad


def check(verbose: bool = True) -> list[str]:
    bad: list[str] = []
    seen_rows = 0
    seen_refs = 0
    hit_exempt: set[str] = set()

    files = sheet_files()
    if not files:
        return ["no sheet renders a <Ref> at all, so this checker read nothing. Either the "
                "review sheets moved or the helper was renamed."]

    for path in files:
        src = path.read_text(encoding="utf-8")
        rel = str(path.relative_to(REPO))
        for head, block in rows(src):
            seen_rows += 1
            if "<Ref" in block:
                seen_refs += 1
            if head in EXEMPT and "<Ref" in block:
                hit_exempt.add(head)
            bad += row_problems(rel, head, block)

    if seen_rows == 0:
        bad.append("no <Row> block was found in any sheet, so this checker read nothing at all")

    # AN EXEMPTION THAT NO LONGER MATCHES ANYTHING IS A DEAD LICENCE. It sits in the file
    # looking like a considered decision while the row it excused has been renamed or fixed.
    for stale in sorted(set(EXEMPT) - hit_exempt):
        bad.append(f"EXEMPT carries {stale!r}, which is no longer a row with a human reference. "
                   f"Delete it rather than leaving a licence lying around.")

    if verbose and not bad:
        print(f"sheet ruler check: clean. {seen_refs} of {seen_rows} row(s) carry a human "
              f"reference, every one staged with what it measures. {len(EXEMPT)} row(s) "
              f"exempt, each with a size behind the reason.")
    return bad


# ---------------------------------------------------------------- self-test
def self_test() -> int:
    failures = 0

    def ok(label, cond, extra=""):
        nonlocal failures
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}{'' if cond else '  ' + extra}")
        if not cond:
            failures += 1

    matched = """<Row ground={600} head="A row that agrees with itself">
  <Freight.AutonomousRig x={860} y={560} scale={0.115} />
  <Ref x={1035} y={560} cast="engineer" scale={0.115} />
</Row>"""
    ok("a row whose ruler matches its subject passes",
       row_problems("x.tsx", "A row that agrees with itself", matched) == [])

    # THE ORIGINAL DEFECT, REPLAYED EXACTLY. A gate that has only ever seen corrected code
    # proves that it runs, not that it works.
    original = """<Row ground={600} head="The rig, and the silhouette that changed">
  <Freight.AutonomousRig x={760} y={560} scale={0.16} />
  <Ref x={1010} y={560} cast="engineer" scale={0.28} />
</Row>"""
    got = row_problems("x.tsx", "The rig, and the silhouette that changed", original)
    ok("the rig row's 0.28 ruler against a 0.16 rig IS caught", len(got) == 1, str(got))
    ok("...and it reports the 1.75x the reviewer was actually shown",
       bool(got) and "1.75 times" in got[0], str(got))

    two = """<Row ground={2080} head="Where the power lands">
  <Compute.Switchgear x={90} y={2080} scale={0.22} />
  <Compute.CoolingDistributionUnit x={800} y={2080} scale={0.28} />
  <Ref x={1010} y={2080} cast="engineer" scale={0.22} />
</Row>"""
    got = row_problems("x.tsx", "Where the power lands", two)
    ok("a row with a ruler and TWO subject scales is caught even though the ruler matches one",
       len(got) == 1 and "2 different scales" in got[0], str(got))

    bare = """<Row ground={600} head="A row with a bare Ref">
  <Freight.AutonomousRig x={860} y={560} scale={0.115} />
  <Ref x={1035} y={560} cast="engineer" />
</Row>"""
    ok("a Ref with no scale at all is caught, since it takes a default nobody chose",
       any("no scale" in p for p in row_problems("x.tsx", "A row with a bare Ref", bare)))

    lone = """<Row ground={600} head="A ruler measuring nothing">
  <Freight.CabView x={40} y={960} w={480} h={560} />
  <Ref x={1035} y={560} cast="engineer" scale={0.3} />
</Row>"""
    ok("a ruler with no staged subject is caught",
       any("measures nothing" in p for p in row_problems("x.tsx", "A ruler measuring nothing", lone)))

    ok("a row with no ruler is not this checker's business",
       row_problems("x.tsx", "No ruler", '<Row head="No ruler"><A scale={0.1} /></Row>') == [])

    # AN EXEMPT ROW IS EXCUSED FROM THE SCALE RULES AND NOTHING ELSE.
    name = next(iter(EXEMPT))
    mixed = f'<Row head="{name}"><A scale={{0.1}} /><B scale={{3.4}} />' \
            f'<Ref cast="hydrologist" scale={{0.1}} /></Row>'
    ok("the exempt row is allowed its two scales", row_problems("x.tsx", name, mixed) == [])
    bare_exempt = f'<Row head="{name}"><A scale={{0.1}} /><Ref cast="hydrologist" /></Row>'
    ok("...but is still refused a Ref with no scale",
       any("no scale" in p for p in row_problems("x.tsx", name, bare_exempt)))

    # ROWS DO NOT NEST, so two rows in one file are read as two.
    ok("two rows in one file are read separately",
       len(rows('<Row head="a"><Ref scale={1} /></Row>\n<Row head="b"><X scale={2} /></Row>')) == 2)

    ok("the whole engine's sheets hold", check(verbose=False) == [], str(check(verbose=False)))
    files = sheet_files()
    ok(f"it reaches the sheets that carry a reference ({len(files)})", len(files) >= 1,
       str([f.name for f in files]))

    print("\nsheet_ruler_check self-test: "
          + ("all passed" if failures == 0 else f"{failures} FAILED"))
    return 0 if failures == 0 else 1


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--self-test", action="store_true",
                    help="prove the checker can go red, then check the engine")
    args = ap.parse_args()
    if args.self_test:
        return self_test()

    problems = check()
    if problems:
        print(f"sheet ruler check: {len(problems)} problem(s)\n")
        for p in problems:
            print(f"  - {p}\n")
        return 1
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # a checker that cannot run must not read as clean
        print(f"sheet_ruler_check could not run: {exc}", file=sys.stderr)
        sys.exit(2)
