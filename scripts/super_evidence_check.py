#!/usr/bin/env python3
"""super_evidence_check.py — a number on screen must be evidenced FOR THE THING IT SITS ON.

THE DEFECT THIS EXISTS FOR, and it shipped past a full green suite four rounds running.

`numeral_lint` and `ship_gate` both prove that every numeral in published copy appears in the
authorised set computed from `claims.json`. That is a real check and it catches invented
figures. It cannot catch the fault that actually keeps happening here, because the fault does
not involve an invented figure at all:

    s11 printed the super "about ninety nanoseconds a day" over a shot whose readout, caption
    and character are the EPW port. 90 is a real, fetched, authorised number. It belongs to
    NAMD, a different code by a different group, and the claim it comes from (c17) is PARTIAL
    with a note reading "The subject matter of the simulation is NOT verified and is not
    stated." The frame stated it. Every numeral gate was green.

    s09 printed "the number comes from an analyst" over the caption carrying Abilene's fifty
    thousand accelerators. c19's own note says that figure "is attributed to the operator".
    The analyst framing belongs to a different claim about a different quantity.

Both are the same shape: THE RIGHT NUMBER OVER THE WRONG PICTURE. A set-membership test cannot
see it, because membership is a property of the number and this is a property of the pairing.

So this gate reads the pairing. A scene's `super` is checked against ITS OWN `super_claim` and
nothing else, and the claim has to actually carry what the super says:

  1. A super containing any figure, digits or spelled out, MUST name a `super_claim`.
  2. `super_claim` must resolve to a claim that exists.
  3. That claim must be VERIFIED. A super is the headline of a shot, and a PARTIAL claim is
     one the fact check refused to stand behind whole. c17 is exactly that.
  4. Every figure in the super must appear in THAT claim's own statement, value_text, quote or
     note. Not in the claims file. In that claim.
  5. Every proper noun in the super must appear in that claim's own text, so a result cannot
     be moved to a different institution or machine.

WHAT THIS GATE DOES NOT DO. It does not read the caption or the VO. Those are bound to the
audio and cannot be changed without a re-synth, so a run that finds a fault there has a
different and more expensive decision to make. It is written down as the next extension rather
than half-built here.

    python3 scripts/super_evidence_check.py --board out/dispatch/storyboard.json \
        --claims out/dispatch/claims.json
    python3 scripts/super_evidence_check.py --self-test
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

# ----------------------------------------------------------------- number words
UNITS = {
    "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7,
    "eight": 8, "nine": 9, "ten": 10, "eleven": 11, "twelve": 12, "thirteen": 13,
    "fourteen": 14, "fifteen": 15, "sixteen": 16, "seventeen": 17, "eighteen": 18,
    "nineteen": 19, "twenty": 20, "thirty": 30, "forty": 40, "fifty": 50, "sixty": 60,
    "seventy": 70, "eighty": 80, "ninety": 90,
}
# the ordinal forms this house style actually writes, "August 12th" and "the 24th of July"
ORDINALS = {
    "first": 1, "second": 2, "third": 3, "fourth": 4, "fifth": 5, "sixth": 6, "seventh": 7,
    "eighth": 8, "ninth": 9, "tenth": 10, "twelfth": 12, "twentieth": 20, "thirtieth": 30,
}
SCALES = {"thousand": 1_000, "million": 1_000_000, "billion": 1_000_000_000}

_WORD = re.compile(r"[a-z]+", re.I)


def _words(text: str) -> list[str]:
    return [w.lower() for w in _WORD.findall(text)]


def spelled_numbers(text: str) -> set[int]:
    """The value each MAXIMAL run of number words spells. Only the whole run, never a part.

    THE FIRST VERSION OF THIS EMITTED PARTIAL RUNS AND THAT WAS THE BUG. It returned 4 for
    "four hundred", 40 for "forty eight" and {2, 200, 213} for "two hundred thirteen
    thousand", on the theory that a source might spell a figure differently and more
    candidates meant more chances to match. The check requires every figure it is handed to be
    present in the cited claim, so every partial became a demand the source could not meet,
    and the gate went red on four supers that were correct. GATE_LESSONS calls this the way a
    gate gets itself disabled: a correct product reported as a violation.

    A reader takes one value off the screen. "two hundred thirteen thousand" is 213000, and
    213000 is the only thing that has to be evidenced.

    ONE IS EXCLUDED WHEN IT STANDS ALONE, deliberately and with the cost stated. English uses
    a bare "one" as a determiner, and "both rooms, one scale" is a sentence about matching
    scale rather than a published figure. Every value from two up is still checked, and a
    genuine figure of one would be written with its unit by a writer who meant it.
    """
    out: set[int] = set()
    toks = _words(text)
    i = 0
    while i < len(toks):
        if toks[i] not in UNITS and toks[i] not in ORDINALS and toks[i] != "hundred":
            i += 1
            continue
        total = current = 0
        run: list[str] = []
        while i < len(toks):
            t = toks[i]
            if t in UNITS:
                current += UNITS[t]
            elif t in ORDINALS:
                current += ORDINALS[t]
            elif t == "hundred":
                current = (current or 1) * 100
            elif t in SCALES:
                total += (current or 1) * SCALES[t]
                current = 0
            else:
                break
            run.append(t)
            i += 1
        value = total + current
        if value and run != ["one"]:
            out.add(value)
    return out


_DIGITS = re.compile(r"\d[\d,]*(?:\.\d+)?")


def digit_numbers(text: str) -> set[float]:
    """Digit runs, plus a digit run multiplied by a scale word that follows it.

    "2 million gallons" has to produce 2000000 as well as 2, or a super that spells the figure
    out long can never match a source that writes it short.
    """
    out: set[float] = set()
    for m in _DIGITS.finditer(text):
        raw = m.group(0).rstrip(",")
        try:
            v = float(raw.replace(",", ""))
        except ValueError:
            continue
        out.add(v)
        tail = text[m.end():m.end() + 14].lower()
        for name, mult in SCALES.items():
            if re.match(r"[\s-]*" + name, tail):
                out.add(v * mult)
    return out


def figures(text: str) -> set[float]:
    return {float(v) for v in spelled_numbers(text)} | digit_numbers(text)


# ----------------------------------------------------------------- proper nouns
# Words this house style capitalises that name nothing: sentence openers are not an issue
# because supers are written lower case, but a month is a real word in a date and it is
# checked like any other, since a claim that carries the date carries the month with it.
_PROPER = re.compile(r"\b([A-Z][a-z]{2,})\b")
_PROPER_STOP = {"The", "This", "That", "There", "Nobody", "Somebody", "Texas"}


def proper_nouns(text: str) -> set[str]:
    return {w for w in _PROPER.findall(text) if w not in _PROPER_STOP}


# ----------------------------------------------------------------- the check
def claim_text(c: dict) -> str:
    return " ".join(str(c.get(k) or "") for k in ("statement", "value_text", "quote", "note"))


def evidence_text(c: dict) -> str:
    """ONLY THE FETCHED SENTENCE, and this distinction is the whole of the second check.

    `statement` and `value_text` are written by the model that read the source. `quote` is what
    the source actually says. A figure present only in the first two has been asserted, not
    evidenced, and it is wearing a VERIFIED badge while it does so, which is worse than an
    obviously unsourced number because nothing downstream will question it.

    A judge found exactly this and named it the single thing most likely to embarrass the show:
    a readout row printing `on Vista | 30 times faster` against a claim whose quote is entirely
    about three years of porting and contains no speed-up figure of any kind.

    THE ONE LEGITIMATE EXCEPTION IS A TABLE, and it is declared per claim rather than inferred.
    A source that publishes a queue table is quoted by one representative row, and the remaining
    rows live in `value_text`. That claim sets `quote_is_excerpt: true` with `excerpt_of` saying
    what the excerpt is one row of. The exception is then auditable: it is a field somebody
    wrote on purpose, not a hole the checker leaves open for everything.
    """
    if c.get("quote_is_excerpt"):
        return " ".join(str(c.get(k) or "") for k in ("quote", "value_text"))
    return str(c.get("quote") or "")


def printed_figures(board: dict):
    """Every figure a READOUT prints, which is the surface no gate has ever read.

    A super is one line and gets checked against its own claim. A readout is a table of rows,
    it carries no claim binding at all, and it is where the numbers actually live: the queue
    table, the speed-ups, the water. Five of eleven figures printed by the readouts in this
    film appeared in no fetched sentence anywhere in the claims file.
    """
    for sc in board.get("scenes", []):
        for pl in sc.get("planes", []):
            for it in pl.get("items", []):
                if it.get("kind") != "readout":
                    continue
                props = it.get("props") or {}
                for row in props.get("rows") or []:
                    for cell in (row if isinstance(row, (list, tuple)) else [row]):
                        for v in figures(str(cell)):
                            yield sc.get("id", "?"), str(cell), v


def check_printed_figures_are_quoted(board: dict, claims: dict) -> list[str]:
    """RULE 6. A figure on a readout appears in some claim's FETCHED text.

    Deliberately checked against the whole file rather than one bound claim, because a readout
    carries no `super_claim` and inventing one would be a schema change made by a gate. This is
    the weaker form of the super rule and it still catches what has actually shipped.
    """
    fails: list[str] = []
    evidence = " ".join(evidence_text(c) for c in claims.get("claims", []))
    have = figures(evidence)
    seen: set[tuple[str, float]] = set()
    for sid, cell, v in printed_figures(board):
        if v in have or (sid, v) in seen:
            continue
        seen.add((sid, v))
        fails.append(
            f"{sid}: a readout prints {cell!r}, and {v:g} appears in no claim's fetched quote. "
            f"It may well sit in a claim's statement or value_text, which is exactly the fault: "
            f"those are written by the model that read the source and the quote is what the "
            f"source says. If the figure is genuinely in the source, widen that claim's quote to "
            f"the sentence carrying it. If the source publishes a table, set "
            f"`quote_is_excerpt: true` on the claim with `excerpt_of` naming what it excerpts. "
            f"If neither, the row does not go on screen.")
    return fails


def check(board: dict, claims: dict) -> tuple[list[str], list[str]]:
    fails: list[str] = []
    notes: list[str] = []
    by_id = {c["id"]: c for c in claims.get("claims", [])}

    for sc in board.get("scenes", []):
        sid = sc.get("id", "?")
        sup = (sc.get("super") or "").strip()
        if not sup:
            continue
        cid = sc.get("super_claim")
        figs = figures(sup)

        if figs and not cid:
            fails.append(
                f"{sid}: super {sup!r} states a figure ({sorted(figs)}) and names no "
                f"super_claim. A figure on screen traces to one claim or it does not go on "
                f"screen.")
            continue
        if not cid:
            notes.append(f"{sid}: super {sup!r} carries no figure and no claim, which is fine.")
            continue
        c = by_id.get(cid)
        if c is None:
            fails.append(f"{sid}: super_claim {cid!r} is not a claim in the claims file.")
            continue

        verdict = (c.get("verdict") or "").upper()
        if verdict != "VERIFIED":
            fails.append(
                f"{sid}: super {sup!r} cites {cid}, whose verdict is {verdict or 'MISSING'}. A "
                f"super is the headline of the shot and a claim the fact check would not stand "
                f"behind whole cannot carry one. c17 is the worked example: its note says the "
                f"subject matter is not verified, and the frame stated it anyway.")

        text = claim_text(c)
        have = figures(text)
        missing = sorted(f for f in figs if f not in have)
        if missing:
            fails.append(
                f"{sid}: super {sup!r} states {missing} but {cid} does not carry that figure "
                f"anywhere in its own statement, value_text, quote or note. The number may well "
                f"be real and authorised somewhere else in the file, which is exactly the fault: "
                f"it is the right number over the wrong picture.")

        low = text.lower()
        absent = sorted(n for n in proper_nouns(sup) if n.lower() not in low)
        if absent:
            fails.append(
                f"{sid}: super {sup!r} names {absent}, which {cid} never mentions. A result "
                f"cannot be moved to a different institution, machine or place by a headline.")

    fails += check_printed_figures_are_quoted(board, claims)
    return fails, notes


# ----------------------------------------------------------------- self test
def self_test() -> int:
    fails = 0

    def ok(label, cond, extra=""):
        nonlocal fails
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}{'' if cond else '  ' + extra}")
        if not cond:
            fails += 1

    ok("spells 'forty eight' as 48", 48 in spelled_numbers("forty eight hours"))
    ok("spells 'four hundred' as 400", 400 in spelled_numbers("four hundred petabytes"))
    ok("spells 'fifty thousand' as 50000", 50_000 in spelled_numbers("fifty thousand accelerators"))
    ok("spells 'two hundred thirteen thousand' as 213000",
       213_000 in spelled_numbers("two hundred thirteen thousand square feet"))
    ok("spells 'two million' as 2000000", 2_000_000 in spelled_numbers("two million gallons"))
    ok("reads '24th' out of a date", 24 in figures("dated July 24th"))
    ok("reads '213,000-square-foot' as 213000", 213_000 in digit_numbers("a 213,000-square-foot building"))
    ok("reads '2 million' as 2000000", 2_000_000 in digit_numbers("about 2 million gallons"))
    ok("reads '80-fold' as 80", 80 in digit_numbers("an 80-fold acceleration"))
    # THE FALSE POSITIVES THAT THE FIRST VERSION SHIPPED, each one now a case.
    ok("does NOT emit 4 for 'four hundred'", spelled_numbers("four hundred petabytes") == {400})
    ok("does NOT emit 40 for 'forty eight'", spelled_numbers("forty eight hours") == {48})
    ok("does NOT emit 2 or 213 for the long form",
       spelled_numbers("two hundred thirteen thousand square feet") == {213_000})
    ok("a bare 'one' is a determiner, not a figure",
       spelled_numbers("both rooms, one scale") == set())
    ok("...but two is still a figure", spelled_numbers("two rooms") == {2})

    CLAIMS = {"claims": [
        {"id": "c15", "verdict": "VERIFIED",
         "statement": "an EPW team achieved an 80-fold acceleration on Horizon test nodes",
         "quote": "the group's EPW team achieved an 80-fold acceleration in optical absorption "
                  "spectra calculations on Horizon test nodes"},
        {"id": "c17", "verdict": "PARTIAL",
         "statement": "NAMD work on Vista reaches about 90 nanoseconds of simulated time per day",
         "quote": "they're getting simulation rates of about 90 nanoseconds per day",
         "note": "The subject matter of the simulation is NOT verified and is not stated."},
        {"id": "c20", "verdict": "VERIFIED",
         "statement": "Epoch AI states power capacities have not been reported consistently",
         "quote": "Power capacities for the Stargate sites have not been reported consistently."},
    ]}

    def board(*scenes):
        return {"scenes": list(scenes)}

    f, _ = check(board({"id": "s11", "super": "eighty times faster, on test nodes",
                        "super_claim": "c15"}), CLAIMS)
    ok("the corrected s11 super passes", not f, str(f))

    # THE DEFECT, REPLAYED. 90 is real, fetched and authorised. It belongs to another result.
    f, _ = check(board({"id": "s11", "super": "about ninety nanoseconds a day",
                        "super_claim": "c15"}), CLAIMS)
    ok("catches the right number over the wrong picture", bool(f), "no fail raised")

    # ...and the claim it DOES come from is PARTIAL, which is the second half of the same fault.
    f, _ = check(board({"id": "s11", "super": "about ninety nanoseconds a day",
                        "super_claim": "c17"}), CLAIMS)
    ok("catches a super resting on a PARTIAL claim", bool(f), "no fail raised")

    f, _ = check(board({"id": "s09", "super": "fifty thousand in one building"}), CLAIMS)
    ok("catches a figure with no super_claim at all", bool(f), "no fail raised")

    f, _ = check(board({"id": "sx", "super": "faster on Vista", "super_claim": "c15"}), CLAIMS)
    ok("catches a machine the cited claim never names", bool(f), "no fail raised")

    f, _ = check(board({"id": "s02", "super": "this is what is in it"}), CLAIMS)
    ok("a super with no figure and no claim is fine", not f, str(f))

    f, _ = check(board({"id": "s09", "super": "nobody publishes the power",
                        "super_claim": "c20"}), CLAIMS)
    ok("a sourced qualitative super passes", not f, str(f))

    f, _ = check(board({"id": "sy", "super": "ninety nanoseconds", "super_claim": "c99"}), CLAIMS)
    ok("catches a super_claim that does not exist", bool(f), "no fail raised")

    # ---------------------------------------------------------------- readouts
    # THE SURFACE NO GATE HAS EVER READ. A super is one line bound to one claim; a readout is a
    # table of rows bound to nothing, and it is where the numbers actually live.
    def rd(*rows):
        return {"scenes": [{"id": "s11", "planes": [{"z": 90, "items": [
            {"kind": "readout", "x": 0, "y": 0, "props": {"title": "t", "rows": list(rows)}}]}]}]}

    TABLED = {"claims": [dict(CLAIMS["claims"][0]),
                         {"id": "c6", "verdict": "VERIFIED",
                          "statement": "the queue table is fully specified",
                          "quote": "gb | Grace Blackwell | 128 | 48 hrs | 1 SU",
                          "value_text": "gb-large, 512 nodes, 48 hours, 1 SU",
                          "quote_is_excerpt": True,
                          "excerpt_of": "one representative row of the published queue table"}]}

    f, _ = check(rd(["on test nodes", "80 times faster"]), CLAIMS)
    ok("a readout figure that IS in a fetched quote passes", not f, str(f))

    # THE DEFECT, REPLAYED: 30 is in c16's statement and in no quote anywhere.
    f, _ = check(rd(["on Vista", "30 times faster"]), CLAIMS)
    ok("catches a readout figure evidenced only by a model-written statement",
       bool(f), "no fail raised")
    ok("...and says to widen the quote or drop the row",
       bool(f) and "widen that claim's quote" in f[0], f[0] if f else "")

    # THE ONE LEGITIMATE EXCEPTION, and it must be DECLARED rather than inferred.
    f, _ = check(rd(["gb-large", "512 nodes"]), CLAIMS)
    ok("a table row absent from the quote fails when nothing declares an excerpt", bool(f))
    f, _ = check(rd(["gb-large", "512 nodes"]), TABLED)
    ok("...and passes once the claim declares quote_is_excerpt", not f, str(f))

    print(f"super_evidence_check: {fails} failure(s)")
    return 1 if fails else 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--board")
    ap.add_argument("--claims")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    if not (a.board and a.claims):
        print("super_evidence_check: pass --board and --claims, or --self-test", file=sys.stderr)
        return 2

    board = json.loads(Path(a.board).read_text())
    claims = json.loads(Path(a.claims).read_text())
    fails, notes = check(board, claims)
    for n in notes:
        print(f"  note  {n}")
    if fails:
        print(f"\nsuper_evidence_check: {len(fails)} problem(s)\n")
        for f in fails:
            print(f"  - {f}\n")
        return 1
    print("\nsuper_evidence_check: every super is evidenced for the shot it sits on.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
