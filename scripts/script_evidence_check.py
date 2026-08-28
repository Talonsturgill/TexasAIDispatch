#!/usr/bin/env python3
"""script_evidence_check.py - what the NARRATOR says, checked BEFORE it is synthesised.

WHY THIS EXISTS, AND WHY IT RUNS WHERE IT RUNS

On 2026-08-28 the August 28th Dispatch narrated this line:

    "The contractor who did that work sits in a small office on the rig, at a screen."

Claim c2's fetched quote supports only that a contractor sits in an office using controls
on a screen to operate robotic machinery. NOTHING in the claims file says that person had
previously worked the floor. So the film asserted a DISPLACEMENT the sources do not carry,
in the narrator's own voice, as its emotional spine.

It was found by a judge, reading the finished film, in panel round three.

THE ORDERING IS THE WHOLE POINT, and it is what this file changes. Everything that read
the script read it too late or too narrowly:

  `ship_gate` reads the script for NUMERALS. That is the compute-not-generate law and it
  is right, but the sentence above contains no numeral, so nothing in it was checkable.
  It also runs in Phase 6, after the voice exists and after a render.

  `super_evidence_check` does exactly this job for SUPERS and refuses to do it for the
  VO. Its own docstring says why: "Those are bound to the audio, so a fault found there
  costs a re-synth and is a different decision. Extending it there is the next upgrade,
  not a half-built branch of this one." That deferred upgrade is this file.

  The PANEL reads it, and a panel is the most expensive reader in the machine.

A fault in the script is free before synthesis and costs a TTS call, an alignment, a
retime and a full render after it. So this runs in Phase 5 BEFORE `vo_synth_gemini.py`,
and `vo_synth` refuses to spend a call until it has passed, which is the same shape as
its existing refusal on direction vocabulary.

WHAT IT CHECKS, AND HONESTLY WHAT IT CANNOT

EVERY SCENE'S `vo` LINE MUST NAME THE CLAIMS IT RESTS ON, in `vo_claims`, the same way a
super names its `super_claim`. Then every PROPER NOUN and every NUMERAL in that line must
appear in the fetched `quote` of one of those claims, verified rather than partial.

That catches a wrong name, a wrong figure, a right figure over the wrong subject, and a
line resting on a claim that does not actually carry it.

**IT CANNOT CATCH A SEMANTIC ASSERTION MADE ENTIRELY IN COMMON WORDS.** "who did that
work" has no proper noun and no numeral in it, and no regex is going to know that it
claims displacement. Saying otherwise would make this the fourth gate in GATE_LESSONS
that reported all clear on something it never looked at.

What it does instead is force the author to WRITE DOWN, per line, which claims that line
stands on. That is the moment the gap becomes visible: naming c2 beside a sentence about
somebody's previous job is a question a writer has to answer. The reader that closes the
rest of it is the pre-synthesis claim audit the routine now requires, which is cheap
because it spends no voice and no render.

    script_evidence_check.py --board out/dispatch/storyboard.json --claims out/dispatch/claims.json
    script_evidence_check.py --self-test

Exit 0 clean, 1 a line is not evidenced, 2 the checker could not run.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]

# One numeral is one token INCLUDING its separators and decimal part. A tokeniser that
# splits "2,600" into 2 and 600 reports a correct figure as unauthorised, which teaches a
# run to override the gate. GATE_LESSONS 11.
NUMERAL = re.compile(r"\d[\d,.]*\d|\d")

# ANY capitalised word, INCLUDING at the start of a sentence.
#
# The first version of this skipped sentence-initial words, on the theory that they are
# capitalised for grammar. Its own self-test caught what that costs: "Chevron runs the
# rig." passed, because the one place a writer is most likely to put the subject of a
# sentence is the one place the gate was not looking. A false positive here is a visible
# argument about a word; a false negative is a wrong company name in a narrated film. So
# every capitalised word is checked and the grammar words are named below instead.
PROPER = re.compile(r"\b([A-Z][a-z]{2,})\b")

# Words that are capitalised for grammar rather than because they name something, plus
# the show's own house vocabulary. A name in here is one nothing needs to evidence.
NOT_NAMES = {
    "The", "This", "That", "There", "They", "Their", "These", "Those", "Then", "Than",
    "And", "But", "For", "Nobody", "Somebody", "Anybody", "Behind", "Past", "Two",
    "What", "When", "Where", "With", "Without", "About", "After", "Before", "Every",
    "Most", "Some", "One", "Its", "His", "Her", "Our", "Your", "Not", "Now", "Here",
    "Only", "Just", "Still", "Behind", "Under", "Over", "Out", "Off", "Into", "From",
}


def load(path: Path) -> dict:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def verified_quotes(claims: dict) -> dict[str, str]:
    """id -> fetched quote, for VERIFIED claims only.

    A PARTIAL or UNVERIFIED claim is not evidence. That is the same tightening the rubric
    took on 2026-08-19, when a film printed a readout against a VERIFIED claim whose quote
    contained no such figure: the evidence is the QUOTE, never the statement written about
    it, and a claim that could not be stood up is not evidence at any strength.
    """
    out = {}
    for c in claims.get("claims") or []:
        if str(c.get("verdict", "")).upper() == "VERIFIED" and str(c.get("quote", "")).strip():
            out[str(c.get("id"))] = str(c["quote"])
    return out


def tokens(text: str) -> tuple[set[str], set[str]]:
    numerals = {m.group(0).rstrip(".,") for m in NUMERAL.finditer(text)}
    names = {m.group(1) for m in PROPER.finditer(text)} - NOT_NAMES
    return numerals, names


def normalise(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", s.lower())


def check(board: dict, claims: dict) -> list[str]:
    quotes = verified_quotes(claims)
    if not quotes:
        return ["the claims file carries no VERIFIED claim with a fetched quote, so no line "
                "of narration can be evidenced against it. That is a stop, not a pass."]
    problems: list[str] = []
    for scene in board.get("scenes") or []:
        sid = scene.get("id", "?")
        vo = str(scene.get("vo") or "").strip()
        if not vo:
            continue
        cited = scene.get("vo_claims")
        if not cited:
            problems.append(
                f"scene {sid}: the narration says {vo[:64]!r} and the board does not say what "
                f"it rests on. Add `vo_claims`. A super has to name its claim and a spoken "
                f"sentence reaches more people than a super does.")
            continue
        missing = [c for c in cited if c not in quotes]
        if missing:
            problems.append(
                f"scene {sid}: cites {', '.join(missing)}, which is not a VERIFIED claim with a "
                f"fetched quote. A PARTIAL or UNVERIFIED claim is not evidence.")
            continue
        # TWO POOLS, AND THE DIFFERENCE IS THE COMPUTE-NOT-GENERATE LAW.
        #
        # A FIGURE must sit in the fetched QUOTE. That is the rubric's top hard fail and
        # it does not bend: a number is a claim about the world.
        #
        # A NAME may also be evidenced by the claim's own url or source_type, because that
        # is PROVENANCE rather than a claim about the world. "the Dallas Fed asked" is a
        # statement about which document this came from, and it is evidenced by the
        # document being dallasfed.org. Requiring a survey to quote its own publisher's
        # name back would refuse correct attribution, and a gate that refuses correct work
        # is a gate a run learns to argue past.
        pool = normalise(" ".join(quotes[c] for c in cited))
        by_id = {str(c.get("id")): c for c in (claims.get("claims") or [])}
        name_pool = pool + normalise(" ".join(
            str(by_id.get(c, {}).get("url", "")) + " " + str(by_id.get(c, {}).get("source_type", ""))
            for c in cited))
        nums, names = tokens(vo)
        for n in sorted(nums):
            if normalise(n) not in pool:
                problems.append(
                    f"scene {sid}: the narration says the figure {n!r}, which appears in no "
                    f"quote of {', '.join(cited)}. The evidence is the QUOTE, never a statement "
                    f"written about it.")
        for name in sorted(names):
            if normalise(name) not in name_pool:
                problems.append(
                    f"scene {sid}: the narration names {name!r}, which appears in no quote of "
                    f"{', '.join(cited)}. A result cannot be moved to a different company, "
                    f"machine or place by a sentence.")
    return problems


def self_test() -> int:
    failures = 0

    def ok(label: str, cond: bool, extra: str = "") -> None:
        nonlocal failures
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}{'' if cond else '  ' + extra}")
        if not cond:
            failures += 1

    claims = {"claims": [
        {"id": "c2", "verdict": "VERIFIED",
         "quote": "an ExxonMobil contractor sits in a small office on a drilling rig, using "
                  "controls on a screen to operate robotic machinery"},
        {"id": "c4", "verdict": "VERIFIED",
         "quote": "operates more than 30 drilling rigs in the Permian Basin, two of which are "
                  "automated rigs"},
        {"id": "c28", "verdict": "UNVERIFIED", "quote": ""},
    ]}

    def board(vo, cited=("c2",)):
        s = {"id": "s1", "vo": vo}
        if cited is not None:
            s["vo_claims"] = list(cited)
        return {"scenes": [s]}

    ok("an evidenced line passes",
       not check(board("A contractor sits in a small office on the rig."), claims))

    ok("A LINE THAT NAMES NO CLAIM IS REFUSED, which is the discipline that would have "
       "made the August 28th displacement line a question somebody had to answer",
       any("does not say what it rests on" in p
           for p in check(board("The contractor who did that work sits at a screen.", None), claims)))

    ok("a figure absent from the cited quote is caught",
       any("figure" in p for p in check(board("Exxon runs more than 90 rigs.", ("c4",)), claims)))

    ok("a figure present in the cited quote passes",
       not check(board("More than 30 rigs in the Permian.", ("c4",)), claims))

    # The fixture that taught this: "Exxon runs more than 30 rigs in the Permian" cites c4,
    # whose quote is "operates more than 30 drilling rigs in the Permian Basin, two of which
    # are automated rigs" and never says Exxon. The figure is evidenced and the SUBJECT is
    # not, which is the right-number-over-the-wrong-picture fault one layer up in the VO.
    ok("a right figure attached to an unevidenced subject is caught",
       any("names" in p and "Exxon" in p
           for p in check(board("Exxon runs more than 30 rigs in the Permian.", ("c4",)), claims)))

    ok("a name absent from the cited quote is caught EVEN AT THE START OF A SENTENCE, "
       "which is exactly where a writer puts a subject",
       any("names" in p for p in check(board("Chevron runs the rig.", ("c4",)), claims)))

    prov = {"claims": [{"id": "c17", "verdict": "VERIFIED",
                        "quote": "By how much do you expect artificial intelligence to lower "
                                 "your firm's break-even price for new wells",
                        "url": "https://www.dallasfed.org/research/surveys/des/2025/2504",
                        "source_type": "Federal Reserve Bank of Dallas Energy Survey"}]}
    ok("a name evidenced by the source's own identity passes, because attribution is "
       "provenance rather than a claim about the world",
       not check(board("most producers the Dallas Fed asked", ("c17",)), prov))
    ok("...but a FIGURE still has to be in the quote, because a number is a claim",
       any("figure" in p for p in check(board("The Dallas Fed asked 45 firms.", ("c17",)), prov)))

    ok("citing an UNVERIFIED claim is refused, because a claim that could not be stood up "
       "is not evidence at any strength",
       any("not a VERIFIED claim" in p
           for p in check(board("A customer nobody named.", ("c28",)), claims)))

    ok("citing a claim that does not exist is refused",
       any("not a VERIFIED claim" in p for p in check(board("Anything.", ("c99",)), claims)))

    ok("an empty claims file is a STOP rather than a silent pass",
       bool(check(board("A contractor sits at a screen."), {"claims": []})))

    # THE HONEST LIMIT, asserted so nobody later mistakes this gate for more than it is.
    ok("a purely semantic assertion in common words is NOT caught, and this file says so "
       "rather than pretending otherwise",
       not check(board("The contractor who did that work sits in a small office on the rig, "
                       "at a screen.", ("c2",)), claims))

    print(f"script_evidence_check: {failures} failure(s)")
    return 1 if failures else 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--board")
    ap.add_argument("--claims")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    if not a.board or not a.claims:
        ap.print_usage(sys.stderr)
        print("script_evidence_check: --board and --claims are required", file=sys.stderr)
        return 2
    try:
        problems = check(load(Path(a.board)), load(Path(a.claims)))
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"script_evidence_check: could not run: {exc}", file=sys.stderr)
        return 2
    if problems:
        print(f"\nscript_evidence_check: {len(problems)} problem(s). "
              f"THIS IS THE CHEAP PLACE: nothing has been synthesised yet.\n")
        for p in problems:
            print(f"  - {p}")
        return 1
    print("script_evidence_check: every narrated line names its claims and every figure and "
          "name in it sits in one of their fetched quotes.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
