#!/usr/bin/env python3
"""bar_check.py — the ship threshold appears in exactly one file.

WHY THIS EXISTS

The sibling lost FIVE panel rounds in a single run to a number written down twice. Its routine
prompt said the bar was 9.0. The rubric had said 7.5 for two weeks. The panel was briefed 9.0,
scored the film 7.08, and returned ship:false on a cut that was already over the real bar. Two
judges flagged the divergence unprompted and the run kept grading against the wrong number
anyway.

Nothing was broken. Both numbers were written by somebody being careful. **A number restated in
a second place is a number that will be wrong in one of them**, and the only fix that holds is
to make the second place impossible.

So: `config/dispatch_rubric.yaml` may contain `ship_threshold`. Nothing else in the repo may
contain a bare score-shaped number presented as the bar.

    bar_check.py
    bar_check.py --self-test

Exit 0 clean, 1 the bar is written down twice, 2 the checker could not run.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
RUBRIC = REPO / "config" / "dispatch_rubric.yaml"

# A threshold ASSERTION: a bar-ish word, then a number, close together. Deliberately narrow.
# "the bar is read out of the rubric" must not trip it, so a sentence only counts when an actual
# numeral follows the word.
# `holds the bar AT 7.5` slipped straight through the first version, which only knew the bar
# as "is", "was" or "of". It sat in `.claude/WORKLOG.md`, a file `CLAUDE.md` orders every agent
# to read FIRST, and it misbriefed all three judges on four consecutive panel rounds. Each one
# flagged the divergence unprompted, which is the sibling's exact failure re-enacted here while
# a gate written for that failure stayed green.
# The verbs are enumerated rather than made into a wildcard, because a pattern loose enough to
# catch every phrasing also catches "the bar is read out of the rubric", and a gate that fails
# correct prose is one somebody deletes.
CLAIM = re.compile(
    r"(ship[_ ]?threshold"
    r"|(?:the |a )?\bbar\b (?:is|was|of|at|to|stands? at|holds? at|sits? at)"
    r"|holds? the \bbar\b (?:at|to)"
    r"|\bbar\b:|threshold (?:is|of|at|:)"
    r"|scores? (?:above|below|of))"
    r"[^\n\d]{0,24}(\d+(?:\.\d+)?)", re.I)

SCAN_EXT = {".md", ".py", ".yaml", ".yml", ".txt", ".tsx", ".ts", ".json"}
SKIP_DIRS = {"node_modules", ".git", "out", "runs", "docs"}


def offenders(root: Path) -> list[str]:
    out = []
    for f in sorted(root.rglob("*")):
        if not f.is_file() or f.suffix not in SCAN_EXT:
            continue
        if any(p in SKIP_DIRS for p in f.parts):
            continue
        try:
            rel = f.relative_to(root).as_posix()
        except ValueError:
            rel = f.name
        if rel == "config/dispatch_rubric.yaml":
            continue                      # the one legitimate home
        if rel.endswith("scripts/bar_check.py"):
            continue                      # this file quotes the incident on purpose
        text = f.read_text(encoding="utf-8", errors="ignore")
        for m in CLAIM.finditer(text):
            line = text[:m.start()].count("\n") + 1
            out.append(
                f"{rel}:{line}: '{m.group(0).strip()}' states the bar. It lives in "
                f"config/dispatch_rubric.yaml and nowhere else. Read it, never restate it.")
    return out


def self_test() -> int:
    import tempfile
    failures = 0

    def ok(label, cond, extra=""):
        nonlocal failures
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}{'' if cond else '  ' + extra}")
        if not cond:
            failures += 1

    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        (root / "config").mkdir()
        (root / "config" / "dispatch_rubric.yaml").write_text("rubric:\n  ship_threshold: 7.5\n",
                                                             encoding="utf-8")
        (root / "prompts").mkdir()

        # THE ACTUAL INCIDENT, replayed.
        (root / "prompts" / "r.md").write_text("Brief the panel: the bar is 9.0.\n", encoding="utf-8")
        ok("a bar restated in a prompt is CAUGHT", offenders(root) != [])
        ok("...and it names the file and line", "prompts/r.md:1" in offenders(root)[0])

        (root / "prompts" / "r.md").write_text(
            "READ rubric.ship_threshold out of config/dispatch_rubric.yaml and brief THAT.\n",
            encoding="utf-8")
        ok("...while an instruction to READ the bar passes", offenders(root) == [])

        (root / "prompts" / "r.md").write_text("ship_threshold: 8.2\n", encoding="utf-8")
        ok("a second ship_threshold key anywhere is CAUGHT", offenders(root) != [])

        (root / "prompts" / "r.md").write_text("The rubric holds the bar. Do not restate it.\n",
                                               encoding="utf-8")
        ok("prose about the bar with no numeral in it passes", offenders(root) == [])

        (root / "prompts" / "r.md").write_text("A film that scores above 7.5 ships.\n",
                                               encoding="utf-8")
        ok("a threshold smuggled into a sentence is CAUGHT", offenders(root) != [])

        # Written first as `all("dispatch_rubric" not in o ...)`, which failed, because EVERY
        # offender message contains that path: the message's whole job is to say where the bar
        # belongs. The assertion has to look at the reported PATH, which is the text before the
        # first colon, not at the advice that follows it.
        ok("the rubric itself is never reported as an offender",
           all(not o.split(":")[0].endswith("dispatch_rubric.yaml") for o in offenders(root)))

    live = offenders(REPO)
    # THE PHRASING THAT ESCAPED, and it escaped into the one file CLAUDE.md orders every agent
    # to read first, where it misbriefed all three judges on four consecutive panel rounds.
    ok("catches 'holds the bar at N', which the first pattern missed",
       bool(CLAIM.search("the rubric holds the bar at 7.5 WITH the reason")))
    ok("...and 'the bar stands at N'", bool(CLAIM.search("the bar stands at 7.0 today")))
    # AND THE PROSE IT MUST NOT TOUCH. Widening the pattern immediately went red on
    # scale_check's own docstring, where a goalpost crossbar sits at 5.04 m.
    ok("does NOT read a goalpost crossbar as a threshold",
       not CLAIM.search("a goalpost crossbar at 5.04 m, against its own docstring"))
    ok("...and does not flag a sentence that says the bar is READ rather than what it is",
       not CLAIM.search("the bar is read out of the rubric and never quoted"))

    ok("the shipped repo states the bar exactly once", live == [], str(live[:2]))

    if failures:
        print(f"\nbar_check self-test: {failures} FAILED", file=sys.stderr)
        return 1
    print("\nbar_check self-test: all passed")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    if not RUBRIC.exists():
        print(f"bar_check: {RUBRIC} is missing. The bar has to live somewhere.", file=sys.stderr)
        return 2
    bad = offenders(REPO)
    if not bad:
        val = re.search(r"ship_threshold:\s*([\d.]+)", RUBRIC.read_text(encoding="utf-8"))
        print(f"bar: stated once, in config/dispatch_rubric.yaml"
              + (f" ({val.group(1)})" if val else ""))
        return 0
    print(f"bar_check: the bar is written down in {len(bad)} other place(s)\n")
    for b in bad:
        print(f"  - {b}")
    print("\n  A number restated in a second place is a number that will be wrong in one of\n"
          "  them. The sibling lost five panel rounds to exactly this.")
    return 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:                                            # noqa: BLE001
        print(f"bar_check: broke: {exc}", file=sys.stderr)
        sys.exit(2)
