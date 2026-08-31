#!/usr/bin/env python3
"""Refuse a technically animated storyboard that still has no authored film grammar.

Pixel motion is necessary and `preflight_animatic.py` measures it. It is not sufficient: the
first Texas V1 moved in every shot and still read as a slideshow because each scene was a new
panel with no recurring subject, no performed turn, no bookend and no ending. This gate checks
the corresponding authoring contract before a render is spent. The rendered-pixel measurement
still runs afterward; prose here can never substitute for that proof.
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
DISPATCH = REPO / "video-engine" / "src" / "Dispatch.tsx"

STATIC_OPENERS = ("shows ", "sits ", "stands ", "waits ", "is ", "has ", "contains ")


def check(board: dict, dispatch_source: str = "") -> list[str]:
    errs: list[str] = []
    scenes = board.get("scenes") or []
    template = str(board.get("cinematic_template") or "").strip()
    if not template:
        errs.append(
            "the board names no cinematic_template. The generic plane renderer is a safe floor, "
            "not the authored lead-film path; compile and register an episode for this story.")
    elif dispatch_source and template not in dispatch_source:
        errs.append(
            f"cinematic_template {template!r} is not registered in Dispatch.tsx. An unknown "
            "episode must fail before rendering, not fall back to the generic slideshow path.")

    contract = board.get("cinematic_contract") or {}
    through = contract.get("throughline") or {}
    subject = str(through.get("subject") or "").strip()
    opening = str(through.get("opening_state") or "").strip()
    closing = str(through.get("closing_state") or "").strip()
    covered = set(str(x) for x in (through.get("scene_ids") or []))
    if not subject:
        errs.append("cinematic_contract.throughline.subject is missing")
    if not opening or not closing:
        errs.append("the throughline needs both an opening_state and a closing_state")
    elif opening.lower() == closing.lower():
        errs.append("the throughline opens and closes in the same state; nothing completed")
    minimum = math.ceil(len(scenes) * 0.75)
    actual = len(covered.intersection(str(s.get("id")) for s in scenes))
    if scenes and actual < minimum:
        errs.append(
            f"the throughline reaches {actual}/{len(scenes)} scenes; it must carry through at "
            f"least {minimum}, or the film resets into unrelated slides.")

    button = str(contract.get("button") or "").strip()
    if not button or len(button.split()) < 5:
        errs.append("cinematic_contract.button is missing or too slight to be an authored ending")
    reveal_scene = str(contract.get("turn_scene") or "").strip()
    scene_ids = {str(s.get("id")) for s in scenes}
    if reveal_scene not in scene_ids:
        errs.append("cinematic_contract.turn_scene must name the scene that performs the turn")

    for i, scene in enumerate(scenes):
        sid = str(scene.get("id") or f"scene-{i + 1}")
        sentence = scene.get("visual_sentence") or {}
        for field in ("subject", "action", "emotion", "annotation"):
            if not str(sentence.get(field) or "").strip():
                errs.append(f"{sid} visual_sentence.{field} is missing")
        action = str(sentence.get("action") or "").strip().lower()
        if action.startswith(STATIC_OPENERS):
            errs.append(
                f"{sid} visual_sentence.action starts {action.split()[0]!r}; write X DOES Y, "
                "not a description of a held composition.")
        length = float(scene.get("duration_s") or 0)
        events = scene.get("visual_events") or []
        needed = max(1, math.ceil(length / 5.0))
        if len(events) < needed:
            errs.append(
                f"{sid} runs {length:.2f}s with {len(events)} performed visual event(s); "
                f"it needs at least {needed}, one earned change per five-second window.")

    credits = str(board.get("credits") or "").strip()
    if "SOURCES" not in credits.upper():
        errs.append("the film has no SOURCES block in its burned-in ending")
    if "TEXASAIDOCKET.COM" not in credits.upper():
        errs.append("the burned-in ending does not tell the viewer where the Docket lives")
    if float(board.get("credits_s") or 0) < 5.0:
        errs.append("the sourced sign-off must hold at least five seconds at phone size")
    return errs


def self_test() -> int:
    scene = {
        "id": "s1", "duration_s": 4.9,
        "visual_sentence": {"subject": "report", "action": "skids into the lane",
                            "emotion": "surprise", "annotation": "ROAD CLUE"},
        "visual_events": [{"at_s": 1.0}],
    }
    good = {
        "cinematic_template": "fixture-v2",
        "cinematic_contract": {
            "throughline": {"subject": "one report", "opening_state": "unread",
                            "closing_state": "field queue", "scene_ids": ["s1"]},
            "turn_scene": "s1", "button": "The report found what the table dropped",
        },
        "scenes": [scene], "credits_s": 5.5,
        "credits": "SOURCES\nPRIMARY SOURCE\nTEXASAIDOCKET.COM",
    }
    failures = 0

    def ok(label: str, value: bool) -> None:
        nonlocal failures
        print(f"  {'ok  ' if value else 'FAIL'}  {label}")
        failures += 0 if value else 1

    ok("a compiled, throughlined, sourced film contract passes",
       not check(good, "fixture-v2"))
    no_thread = json.loads(json.dumps(good))
    no_thread["cinematic_contract"]["throughline"]["scene_ids"] = []
    ok("a set of disconnected scenes is refused", bool(check(no_thread, "fixture-v2")))
    static = json.loads(json.dumps(good))
    static["scenes"][0]["visual_sentence"]["action"] = "shows a report"
    ok("a composition description cannot pose as an action", bool(check(static, "fixture-v2")))
    long_hold = json.loads(json.dumps(good))
    long_hold["scenes"][0]["duration_s"] = 8.0
    ok("a long scene needs a second performed beat", bool(check(long_hold, "fixture-v2")))
    no_end = json.loads(json.dumps(good))
    no_end["credits"] = ""
    ok("a film without a sourced sign-off is refused", bool(check(no_end, "fixture-v2")))
    print(f"watchability_check: {failures} failure(s)")
    return 1 if failures else 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--board")
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()
    if args.self_test:
        return self_test()
    if not args.board:
        print("watchability_check: pass --board or --self-test", file=sys.stderr)
        return 2
    try:
        board = json.loads(Path(args.board).read_text(encoding="utf-8"))
        source = DISPATCH.read_text(encoding="utf-8")
    except (OSError, json.JSONDecodeError) as exc:
        print(f"watchability_check: cannot read inputs: {exc}", file=sys.stderr)
        return 2
    errs = check(board, source)
    for err in errs:
        print(f"  - {err}", file=sys.stderr)
    if errs:
        print(f"watchability_check: {len(errs)} problem(s)", file=sys.stderr)
        return 1
    print("watchability_check: compiled episode, visual sentences, throughline, turn and ending clear")
    return 0


if __name__ == "__main__":
    sys.exit(main())
