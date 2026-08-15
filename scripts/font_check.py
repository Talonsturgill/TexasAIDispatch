#!/usr/bin/env python3
"""font_check.py — the film is set in the faces this repo ships, or it is not the film.

WHY THIS EXISTS

Every drawing in the engine asked for `Georgia, serif`, at 74 text sites, and the repo shipped
no font at all. Georgia is a Microsoft face and is not on a Linux render box, so `fc-match
Georgia` returned DejaVu Serif and the film was set in whatever the render machine happened to
have. Two more stacks asked for a monospace nobody supplied.

**The film was not the same film on two machines**, and that is worse than a wrong typeface.
Every width in the picture came from a face nobody chose, so a panel sized to hold a line held
it or did not depending on the host, and the caption about an emergency ran off the phone it
was drawn on. `tests/type_fit.mjs` measures text against its box, and every one of those
measurements is against a face this repo has to control for the numbers to mean anything.

FOUR THINGS.

  SHIPPED. Every file `lib/fonts.tsx` declares must exist under `video-engine/public/fonts`.
  A face declared and not shipped is the original defect with extra steps.

  NAMED. Every family named in a font stack in the engine must be one of those, or a generic
  fallback. This is what catches a new drawing typing a face nobody has.

  ONE PLACE. No `fontFamily` string literal outside `lib/type.ts`. The stack was written out
  74 times and was wrong in all 74 at once, which is the same argument the metre constant won.

  LICENSED. The licence travels with the fonts. All three are SIL Open Font License 1.1, which
  permits embedding and redistribution, and `public/fonts/OFL.txt` has to be there to say so.

WHAT IT CANNOT SEE. Whether the renderer actually loaded the face at frame time. That is
`withFonts` and `delayRender`'s job, and `composition_check.py` is what refuses a composition
that skips the wrapper.

    font_check.py
    font_check.py --self-test

Exit 0 clean, 1 a problem, 2 the checker could not run.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
ENGINE = REPO / "video-engine" / "src"
FONTS_TSX = ENGINE / "lib" / "fonts.tsx"
TYPE_TS = ENGINE / "lib" / "type.ts"
PUBLIC = REPO / "video-engine" / "public"

# Generic CSS families. A stack is allowed to end on one so a missing file degrades to
# something rather than to nothing.
GENERIC = {"serif", "sans-serif", "monospace", "system-ui", "ui-monospace", "cursive",
           "fantasy", "-apple-system"}

# Faces a stack may name as an intermediate fallback without shipping them. These are the
# host faces a machine might genuinely have, and naming one is a courtesy rather than a
# dependency: the shipped face is always first.
FALLBACK_OK = {"Georgia", "Times New Roman", "Helvetica", "Arial", "Segoe UI", "Roboto"}

FACE_RE = re.compile(r"\{family:\s*'([^']+)',\s*file:\s*'([^']+)'")
STACK_RE = re.compile(r"fontFamily[=:]\s*[\"']([^\"']+)[\"']")
LITERAL_RE = re.compile(r"fontFamily=\"[^\"]+\"")


def declared_faces(src: str) -> list[tuple[str, str]]:
    return FACE_RE.findall(src)


def families_in(stack: str) -> list[str]:
    """The family names a CSS font stack lists, unquoted and untrimmed of nothing else."""
    return [p.strip().strip("\"'") for p in stack.split(",")]


def check(verbose: bool = True) -> list[str]:
    bad: list[str] = []

    if not FONTS_TSX.exists():
        return [f"{FONTS_TSX.relative_to(REPO)} is missing, so nothing declares what this film "
                f"is set in and this checker read nothing at all"]

    faces = declared_faces(FONTS_TSX.read_text(encoding="utf-8"))
    if not faces:
        bad.append(f"{FONTS_TSX.relative_to(REPO)} declares no FACES, so either the list moved "
                   f"or the format changed and this check is reading nothing.")
    shipped = {f for f, _ in faces}

    # SHIPPED
    for family, rel in faces:
        path = PUBLIC / rel
        if not path.exists():
            bad.append(f"{family} is declared in fonts.tsx as {rel} and that file is not in "
                       f"video-engine/public. A face declared and not shipped renders as "
                       f"whatever the machine has, which is the defect this file exists for.")

    # LICENSED
    if not (PUBLIC / "fonts" / "OFL.txt").exists():
        bad.append("video-engine/public/fonts/OFL.txt is missing. The fonts are redistributed "
                   "under SIL OFL 1.1 and the licence has to travel with them.")

    # NAMED, and ONE PLACE
    for path in sorted(ENGINE.rglob("*.tsx")) + [TYPE_TS]:
        rel = path.relative_to(REPO)
        src = path.read_text(encoding="utf-8")
        if path != TYPE_TS:
            for m in LITERAL_RE.finditer(src):
                line = src[:m.start()].count("\n") + 1
                bad.append(f"{rel}:{line}: a font stack is written out here. Stacks live in "
                           f"lib/type.ts as FONT.display, FONT.body and FONT.mono. This one was "
                           f"written out 74 times and was wrong in all 74 at once.\n"
                           f"        {m.group(0)}")
        for stack in STACK_RE.findall(src):
            for fam in families_in(stack):
                if fam in GENERIC or fam in FALLBACK_OK or fam in shipped:
                    continue
                bad.append(f"{rel}: the stack {stack!r} names {fam!r}, which this repo does not "
                           f"ship and is not a generic fallback. Add it to FACES in fonts.tsx "
                           f"and put the file in public/fonts, or use one of {sorted(shipped)}.")

    if verbose and not bad:
        names = ", ".join(sorted(shipped))
        print(f"font check: clean. {len(faces)} face file(s) shipped for {len(shipped)} "
              f"family({names}), every stack in lib/type.ts, licence present.")
    return bad


# ---------------------------------------------------------------- self-test
def self_test() -> int:
    failures = 0

    def ok(label, cond, extra=""):
        nonlocal failures
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}{'' if cond else '  ' + extra}")
        if not cond:
            failures += 1

    ok("a FACES entry parses to a family and a file",
       declared_faces("{family: 'Fraunces', file: 'fonts/Fraunces-Var.ttf', weight: '400 700'}")
       == [("Fraunces", "fonts/Fraunces-Var.ttf")])
    ok("...and two of them parse to two",
       len(declared_faces("{family: 'A', file: 'a.ttf'} {family: 'B', file: 'b.ttf'}")) == 2)

    ok("a stack splits into its families",
       families_in('"Fraunces", Georgia, serif') == ["Fraunces", "Georgia", "serif"])
    ok("...and a single family stack is one",
       families_in("Manrope") == ["Manrope"])

    # THE ORIGINAL DEFECT, REPLAYED. The stack the engine shipped for three weeks.
    ok("the shipped Georgia stack IS caught as a written-out literal",
       bool(LITERAL_RE.search('<text fontFamily="Georgia, serif">x</text>')))
    ok("...and the expression form that replaced it is not",
       not LITERAL_RE.search("<text fontFamily={FONT.display}>x</text>"))

    ok("a generic family is allowed", "serif" in GENERIC)
    ok("an unshipped face is not silently allowed",
       "Comic Sans MS" not in GENERIC and "Comic Sans MS" not in FALLBACK_OK)

    problems = check(verbose=False)
    ok("the real engine holds", problems == [], str(problems))
    ok("the three faces are on disk",
       all((PUBLIC / rel).exists() for _, rel in
           declared_faces(FONTS_TSX.read_text(encoding="utf-8"))))

    print("\nfont_check self-test: " + ("all passed" if failures == 0 else f"{failures} FAILED"))
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
        print(f"font check: {len(problems)} problem(s)\n")
        for p in problems:
            print(f"  - {p}\n")
        return 1
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print(f"font_check could not run: {exc}", file=sys.stderr)
        sys.exit(2)
