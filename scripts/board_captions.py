#!/usr/bin/env python3
"""Fold the ALIGNED caption cues into the board, so the burned-in subtitle is the
narration and not something else.

THE DEFECT THIS EXISTS FOR. The film rendered a dark band across the bottom of every
frame, in the subtitle's seat, in the subtitle's face, carrying `scene.caption`: an
editorial line written at storyboard time. The narration underneath it said something
else entirely. Every gate was green, because `ship_gate` checks that `captions.json`
exists and is honestly aligned and `storyboard_check` checks that `scene.caption` is
clean copy, and NOTHING checked that the text a viewer reads is the text a viewer hears.
A caption file that is never rendered is an accessibility artifact nobody sees, and a
band that looks like a subtitle and is not one is worse than no band at all.

So the cues become part of the board. THE BOARD IS THE PROPS is the rule this repo
renders by, and a second input file read at render time would put the subtitle outside
everything that gates the board. `board.captions` is inside it.

What this refuses, and each one shipped somewhere:

- a caption file whose method is not one of the two honest ones. `approximated`,
  `scaled` and `hand_shifted` are banned by the routine and are exactly what a run
  reaches for when alignment is inconvenient.
- a file that CLAIMS alignment while reporting no measured boundaries. The header is a
  string a run can type; `boundaries_measured` is a count something had to produce.
- a cue that runs past the end of the film, or backwards, or overlaps its neighbour.
  Any of those renders as a subtitle that outlives its words.
- an EMPTY cue list. A film with no subtitles at all passed every check once, because
  every per-cue assertion is vacuously true over nothing.

Run by EXIT CODE.

  python3 scripts/board_captions.py --board out/dispatch/storyboard.json \\
                                    --captions out/dispatch/captions.json
  python3 scripts/board_captions.py --self-test
"""
from __future__ import annotations

import argparse
import json
import sys

# The two methods the routine allows. Read the routine, not this list, for why: the
# point is that both MEASURE something on the final mix.
HONEST_METHODS = ("silence_anchored", "forced_alignment")


def fold(board: dict, caps: dict) -> tuple[dict, list[str]]:
    """Return (board, errors). The board is only modified when errors is empty."""
    errs: list[str] = []

    method = str(caps.get("method") or "")
    if method not in HONEST_METHODS:
        errs.append(
            f"caption method {method!r} is not one of {HONEST_METHODS}. Approximated, "
            f"scaled and hand shifted timings are banned outright, and the fix is to run "
            f"the alignment against the final mix rather than to relabel the file.")

    measured = int(caps.get("boundaries_measured") or 0)
    if measured <= 0:
        errs.append(
            f"the file names the method {method!r} but reports {measured} measured "
            f"boundaries. A header is a string a run can type. Nothing was measured.")

    cues = caps.get("cues") or []
    if not cues:
        errs.append(
            "the caption file carries NO cues, so every per-cue check below passes over "
            "nothing and the film would render with no subtitle at all.")

    last_s = 0.0
    for s in board.get("scenes") or []:
        last_s = max(last_s, float(s.get("start_s", 0)) + float(s.get("duration_s", 0)))
    runtime = max(float(board.get("runtime_s") or 0), last_s)

    prev_end = -1.0
    for i, c in enumerate(cues):
        where = f"cue {c.get('id') or i}"
        try:
            st, en = float(c["start"]), float(c["end"])
        except (KeyError, TypeError, ValueError):
            errs.append(f"{where} has no usable start and end.")
            continue
        if not str(c.get("text") or "").strip():
            errs.append(f"{where} carries no text, so it would paint an empty band.")
        if en <= st:
            errs.append(f"{where} ends at {en} and starts at {st}, which is backwards.")
        if st < prev_end - 1e-6:
            errs.append(
                f"{where} starts at {st}, before the previous cue ended at {prev_end}. "
                f"Overlapping cues render as two subtitles at once.")
        if en > runtime + 1e-6:
            errs.append(
                f"{where} ends at {en}, past the film's own {runtime} second runtime, so "
                f"its words are on screen after the picture they belong to is gone.")
        prev_end = max(prev_end, en)

    if errs:
        return board, errs

    board["captions"] = [
        {"id": str(c.get("id") or f"c{i + 1}"),
         "start": round(float(c["start"]), 3),
         "end": round(float(c["end"]), 3),
         "text": str(c["text"]).strip(),
         "source": str(c.get("source") or "")}
        for i, c in enumerate(cues)
    ]
    board["caption_method"] = method
    return board, []


# ------------------------------------------------------------------ the self-test
def _self_test() -> int:
    fails = []

    def ok(label, cond):
        fails.append(label) if not cond else None
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}")

    board = {"runtime_s": 10, "scenes": [{"start_s": 0, "duration_s": 10}]}
    good = {"method": "silence_anchored", "boundaries_measured": 4,
            "cues": [{"id": "c1", "start": 0.2, "end": 4.0, "text": "one",
                      "source": "measured_boundary"},
                     {"id": "c2", "start": 4.2, "end": 9.0, "text": "two",
                      "source": "measured_boundary"}]}

    b, e = fold(json.loads(json.dumps(board)), good)
    ok("an honestly aligned file folds into the board", not e)
    ok("...and the board now carries the cues the renderer reads", len(b.get("captions", [])) == 2)
    ok("...and it records the method beside them", b.get("caption_method") == "silence_anchored")

    b2, e2 = fold(json.loads(json.dumps(board)),
                  dict(good, method="approximated"))
    ok("an approximated file is refused", bool(e2))
    ok("...and the board is left without captions rather than half filled",
       "captions" not in b2)

    _, e3 = fold(json.loads(json.dumps(board)), dict(good, boundaries_measured=0))
    ok("a file that CLAIMS alignment and measured nothing is refused", bool(e3))

    _, e4 = fold(json.loads(json.dumps(board)), dict(good, cues=[]))
    ok("an EMPTY cue list is refused, not passed vacuously", bool(e4))

    _, e5 = fold(json.loads(json.dumps(board)), dict(good, cues=[
        {"id": "c1", "start": 0.2, "end": 5.0, "text": "one"},
        {"id": "c2", "start": 4.0, "end": 9.0, "text": "two"}]))
    ok("overlapping cues are refused", bool(e5))

    _, e6 = fold(json.loads(json.dumps(board)), dict(good, cues=[
        {"id": "c1", "start": 0.2, "end": 14.0, "text": "one"}]))
    ok("a cue that outlives the film is refused", bool(e6))

    _, e7 = fold(json.loads(json.dumps(board)), dict(good, cues=[
        {"id": "c1", "start": 4.0, "end": 0.2, "text": "one"}]))
    ok("a backwards cue is refused", bool(e7))

    _, e8 = fold(json.loads(json.dumps(board)), dict(good, cues=[
        {"id": "c1", "start": 0.2, "end": 4.0, "text": "   "}]))
    ok("an empty band is refused", bool(e8))

    # the runtime is taken from the SCENES too, not only the declared runtime_s, because
    # a board whose scenes run past its own runtime_s is a board this would otherwise
    # measure against the shorter of the two and refuse a legitimate cue.
    long_board = {"runtime_s": 5, "scenes": [{"start_s": 0, "duration_s": 10}]}
    _, e9 = fold(long_board, good)
    ok("the film's real length comes from the scenes, not only from runtime_s", not e9)

    print()
    print("board_captions self-test: " + ("all passed" if not fails else f"{len(fails)} FAILED"))
    return 1 if fails else 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--board")
    ap.add_argument("--captions")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()

    if a.self_test:
        return _self_test()
    if not (a.board and a.captions):
        print("board_captions: --board and --captions are both required", file=sys.stderr)
        return 2

    board = json.load(open(a.board))
    caps = json.load(open(a.captions))
    board, errs = fold(board, caps)
    if errs:
        for e in errs:
            print(f"  FAIL  {e}")
        return 1
    with open(a.board, "w") as fh:
        json.dump(board, fh, indent=2, ensure_ascii=False)
    print(f"board_captions: folded {len(board['captions'])} {board['caption_method']} "
          f"cues into {a.board}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
