#!/usr/bin/env python3
"""engine_lint.py — the defects a TypeScript compiler is structurally blind to.

WHY THIS EXISTS

`tsc` typechecks the engine and says nothing about whether a frame is correct. Every
check below is a real defect that compiled cleanly.

  A CORRUPTED COLOUR LITERAL. `'#2b3category'` and `'#e0b<CJK>88'` both shipped into this
  repo inside otherwise fine-looking palette tables, and both are valid TypeScript
  strings. The browser silently drops an unparseable colour and paints the default,
  so the frame renders and the region is quietly the wrong colour. Two in one session
  is a pattern, and a pattern gets a gate.

  Math.random IN A RENDER. Remotion renders frames independently, so a random value
  draws something different every frame and, worse, differently on a re-render. A
  critic who asks for one fix and gets a different picture back has no way to tell
  whether the fix worked. Every generator in this engine is seeded.

  A STRAIGHT CONDUCTOR. A transmission line between two towers sags in a catenary,
  and a straight line between tower tops is the tell that nobody looked.

  A SYNCHRONISED PUMPJACK FIELD. Every unit in a real field is at a different point
  in its stroke. knowledge/texas/KIT.md leads with it because it is the single most
  recognisable Texas industrial silhouette and the easiest one to get wrong.

  A REGION THAT SHARES A GREEN. The vernacular law is that the Panhandle and Houston
  do not look alike. Two regions with the same vegetation or ground colour is that
  law broken in the one place it is checkable.

    engine_lint.py            check the engine
    engine_lint.py --self-test

Exit 0 clean, 1 a defect, 2 the checker could not run.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
LIB = REPO / "video-engine" / "src"

HEX_OK = re.compile(r"[0-9a-fA-F]{3}|[0-9a-fA-F]{6}")

# COMMENTS ARE NOT CODE, and forgetting that made this gate fail on its own first run.
# materials.tsx carries the line "All texture is generated from seeded integer loops — no
# Math.random (banned for Remotion determinism)", which is the module CORRECTLY documenting
# that it does not do the thing, and the gate reported it as doing the thing. A gate that
# fires on a docstring describing the rule it enforces is a gate that gets switched off in
# a week, and this repo has now written that lesson down three times in one day.
BLOCK_COMMENT = re.compile(r"/\*.*?\*/", re.S)
LINE_COMMENT = re.compile(r"//[^\n]*")


def strip_comments(text: str) -> str:
    """Blank out comments, PRESERVING line numbers so a report still points at the right
    line. Replacing with spaces rather than deleting is what keeps that true."""
    def blank(m):
        return re.sub(r"[^\n]", " ", m.group(0))
    return LINE_COMMENT.sub(blank, BLOCK_COMMENT.sub(blank, text))
# A colour literal is a quoted string starting with '#'. `.replace('#','')` is the one
# legitimate bare '#', so an empty body is allowed and anything else is not.
HEX_LIT = re.compile(r"['\"]#([^'\"]*)['\"]")


def bad_hex(text: str) -> list[tuple[int, str]]:
    out = []
    for m in HEX_LIT.finditer(text):
        body = m.group(1)
        if body == "":
            continue                      # `.replace('#', '')`
        if not HEX_OK.fullmatch(body):
            out.append((text[:m.start()].count("\n") + 1, m.group(0)))
    return out


def check_files(root: Path) -> list[str]:
    problems: list[str] = []
    files = sorted(root.rglob("*.tsx")) + sorted(root.rglob("*.ts"))
    if not files:
        return ["no engine sources found"]

    for f in files:
        rel = f.relative_to(root.parent.parent) if root.parent.parent in f.parents else f.name
        raw = f.read_text(encoding="utf-8")
        t = strip_comments(raw)

        for line, lit in bad_hex(t):
            problems.append(
                f"{rel}:{line}: {lit} is not a colour. A browser drops an unparseable "
                f"colour silently and paints the default, so the frame renders and the "
                f"region is quietly wrong.")

        for m in re.finditer(r"Math\.random\s*\(", t):
            line = t[:m.start()].count("\n") + 1
            problems.append(
                f"{rel}:{line}: Math.random() in a render. Remotion renders frames "
                f"independently, so this draws differently every frame AND differently on "
                f"a re-render, which makes a review round meaningless. Seed it.")

        # a Conductor with sag explicitly zeroed
        for m in re.finditer(r"<Conductor[^>]*sag=\{0\}", t):
            line = t[:m.start()].count("\n") + 1
            problems.append(
                f"{rel}:{line}: a conductor with zero sag. A transmission line hangs in a "
                f"catenary and a straight line between tower tops is the tell.")

        # a pumpjack field where every unit is handed the same phase
        for m in re.finditer(r"<Pumpjack[^>]*phase=\{([^}]+)\}", t):
            expr = m.group(1).strip()
            line = t[:m.start()].count("\n") + 1
            if re.fullmatch(r"-?\d+(\.\d+)?", expr):
                problems.append(
                    f"{rel}:{line}: a pumpjack pinned to the constant phase {expr}. In a real "
                    f"field every unit is at a different point in its stroke, and a "
                    f"synchronised row is the tell that nobody looked.")
    return problems


def check_palettes(root: Path) -> list[str]:
    """No two regions share a green or a ground. The vernacular law, where it is checkable."""
    f = root / "lib" / "biomes.tsx"
    if not f.exists():
        return []
    t = f.read_text(encoding="utf-8")
    block = re.search(r"BIOMES:\s*Record<RegionName,\s*BiomePalette>\s*=\s*\{(.*?)\n\};", t, re.S)
    if not block:
        return ["biomes.tsx: could not find the BIOMES table to check it"]

    entries = re.findall(r"(\w+):\s*\{(.*?)\},", block.group(1), re.S)
    problems = []
    for field in ("veg", "ground"):
        seen: dict[str, str] = {}
        for name, body in entries:
            m = re.search(rf"{field}:\s*'(#[0-9a-fA-F]{{3,6}})'", body)
            if not m:
                continue
            val = m.group(1).lower()
            if val in seen:
                problems.append(
                    f"biomes.tsx: {name} and {seen[val]} share {field} {val}. The vernacular "
                    f"law is that the Panhandle and Houston do not look alike, and two "
                    f"regions with one palette is that law broken where it is checkable.")
            seen[val] = name
    return problems


def self_test() -> int:
    import tempfile
    failures = 0

    def ok(label, cond, extra=""):
        nonlocal failures
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}{'' if cond else '  ' + extra}")
        if not cond:
            failures += 1

    # THE TWO THAT ACTUALLY SHIPPED, replayed.
    ok("a CJK character inside a hex is CAUGHT", bad_hex("const a = '#e0b徒88';") != [])
    ok("a word inside a hex is CAUGHT", bad_hex("fill: '#2b3category',") != [])
    ok("a real hex passes", bad_hex("const a = '#ffe8c4'; const b = '#abc';") == [])

    # THE FALSE POSITIVE THIS GATE SHIPPED WITH, replayed. materials.tsx documents that it
    # uses seeded loops and NOT Math.random, and the gate read its own rule as a violation.
    doc = "// All texture is from seeded loops - no Math.random (banned for determinism)\n"
    ok("a comment describing the rule is not a violation of it",
       "Math.random" not in strip_comments(doc))
    ok("...and stripping a comment preserves the line count, so reports stay accurate",
       strip_comments(doc).count("\n") == doc.count("\n"))
    ok("...while real code on the next line is still seen",
       "Math.random" in strip_comments(doc + "const x = Math.random();"))
    ok("a block comment is stripped too",
       "Math.random" not in strip_comments("/* uses Math.random nowhere */"))
    ok("the legitimate bare hash in .replace('#','') is not flagged",
       bad_hex("hex.replace('#', '')") == [])
    ok("an 8-digit hex is refused, since SVG fill does not take one",
       bad_hex("fill: '#ffe8c4ff'") != [])

    with tempfile.TemporaryDirectory() as td:
        root = Path(td) / "src"
        (root / "lib").mkdir(parents=True)

        (root / "lib" / "a.tsx").write_text("const x = Math.random();\n", encoding="utf-8")
        ok("Math.random in the engine is CAUGHT",
           any("Math.random" in p for p in check_files(root)))
        (root / "lib" / "a.tsx").write_text("const x = rnd(seed, 1);\n", encoding="utf-8")
        ok("a seeded generator passes", check_files(root) == [])

        (root / "lib" / "a.tsx").write_text("<Conductor x1={0} y1={0} x2={9} y2={0} sag={0} />\n",
                                            encoding="utf-8")
        ok("a straight conductor is CAUGHT", any("catenary" in p for p in check_files(root)))

        (root / "lib" / "a.tsx").write_text("<Pumpjack frame={f} phase={0} />\n", encoding="utf-8")
        ok("a pumpjack field pinned to one phase is CAUGHT",
           any("stroke" in p for p in check_files(root)))
        (root / "lib" / "a.tsx").write_text("<Pumpjack frame={f} phase={rnd(seed, i)} />\n",
                                            encoding="utf-8")
        ok("...but a derived phase passes", check_files(root) == [])

        (root / "lib" / "biomes.tsx").write_text(
            "export const BIOMES: Record<RegionName, BiomePalette> = {\n"
            "  a: {veg: '#5f7047', ground: '#111111'},\n"
            "  b: {veg: '#5f7047', ground: '#222222'},\n"
            "};\n", encoding="utf-8")
        ok("two regions sharing a green are CAUGHT",
           any("share veg" in p for p in check_palettes(root)))
        (root / "lib" / "biomes.tsx").write_text(
            "export const BIOMES: Record<RegionName, BiomePalette> = {\n"
            "  a: {veg: '#5f7047', ground: '#111111'},\n"
            "  b: {veg: '#2f4a36', ground: '#222222'},\n"
            "};\n", encoding="utf-8")
        ok("...and distinct greens pass", check_palettes(root) == [])

    # the shipped engine
    live = check_files(LIB) + check_palettes(LIB)
    ok("the shipped engine is clean", live == [], str(live[:3]))

    if failures:
        print(f"\nengine_lint self-test: {failures} FAILED", file=sys.stderr)
        return 1
    print("\nengine_lint self-test: all passed")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()

    if not LIB.exists():
        print(f"engine_lint: {LIB} does not exist", file=sys.stderr)
        return 2
    problems = check_files(LIB) + check_palettes(LIB)
    if not problems:
        n = len(list(LIB.rglob("*.tsx")))
        print(f"engine lint: clean, {n} engine source(s)")
        return 0
    print(f"engine lint: {len(problems)} problem(s)\n")
    for p in problems:
        print(f"  - {p}")
    return 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:                                            # noqa: BLE001
        print(f"engine_lint: broke: {exc}", file=sys.stderr)
        sys.exit(2)
