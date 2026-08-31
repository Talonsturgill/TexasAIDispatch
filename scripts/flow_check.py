#!/usr/bin/env python3
"""flow_check.py — does the picture keep moving, and is the ear moving with it.

WHY THIS EXISTS

`storyboard_check` proves every scene is composed. This proves the scenes add up to
something that does not let go. A film can pass every per-scene check and still be a
sequence of good frames with nothing pulling the viewer across the joins.

It runs on the CUT, after the render, against the beat map and the sound events.

THE DEFECTS IT IS FOR.

  A REST. A stretch of runtime where nothing visually changes. The showstopper
  standard says every five seconds pays in motion, emotion or revelation, and the
  place that rule breaks is never inside a scene, it is across a boundary: two
  adjacent scenes that each individually move, in the same direction, at the same
  rate, read as one long drift with nothing happening in it.

  A SILENT PICTURE. A beat with no motivated sound. Not a music bed, which covers
  everything and therefore marks nothing, but a sound that belongs to a thing on
  screen. A pumpjack that strokes silently is a drawing; the same pumpjack with its
  bearing groan is a place.

  SAY IT, DON'T SHOW IT. A VO line whose subject never appears in the picture during
  the window in which it is spoken. This is the single commonest way an explainer
  gets made by accident: the voice carries the information and the picture becomes
  decoration behind it.

  A WALL OF SOUND, which is the opposite failure. Every beat stacked with events
  marks nothing at all, because emphasis needs somewhere quiet to stand against.

WHAT IT CANNOT SEE. Whether the pictures are any good. That is the `flow-critic`
agent, which runs after this on the montage. Objective first, taste second, always
in that order, because a critic arguing about a fault a script could have named is a
critic not spending its attention on the thing only it can judge.

    flow_check.py --board out/dispatch/storyboard.json --sfx out/dispatch/sfx_events.json
    flow_check.py --self-test

Exit 0 clean, 1 the cut does not flow, 2 the checker could not run.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

import shot_coherence

REPO = Path(__file__).resolve().parents[1]

# Longest stretch with no visual event before the eye is resting. Chosen from the
# showstopper standard's own five seconds, not from taste.
MAX_REST_S = 5.0

# A sound that belongs to nothing on screen is a sound effect. These are the words a
# generic library cue hides behind, and a beat marked only by one of them is not
# motivated by anything.
UNMOTIVATED = {"whoosh", "swoosh", "riser", "impact", "boom", "sweep", "transition",
               "stinger", "braam", "hit", "swell"}

# Words that carry no picture, so a VO line made only of them cannot be checked for
# coverage and does not need to be.
STOP = set("""a an and are as at be been but by can could did do does for from had has have he
her his how i if in into is it its me my no not of on or our out she should so than that the
their them then there these they this those to too was we were what when where which who will
with would you your it's we're there's about over under more most less least very just also
than while because after before during between across through""".split())


def words(s: str) -> set[str]:
    return {w for w in re.findall(r"[a-z0-9']+", (s or "").lower()) if w not in STOP and len(w) > 2}


def overlaps(a0: float, a1: float, b0: float, b1: float) -> bool:
    return a0 < b1 and b0 < a1


def check(board: dict, sfx: list[dict]) -> list[str]:
    p: list[str] = []
    scenes = sorted(board.get("scenes") or [], key=lambda s: float(s.get("start_s") or 0))
    if not scenes:
        return ["no scenes to flow"]
    # Gate 0 should already have run this. Re-running it here makes flow_check honest when called
    # directly and prevents its own later word-overlap heuristic from becoming a weaker answer.
    p += shot_coherence.check(board)
    runtime = float(board.get("runtime_s") or 0)

    # ---- A REST, measured ACROSS boundaries rather than inside scenes.
    # Two adjacent scenes that move the same way at the same rate are one long drift.
    # A SCENE BOUNDARY IS ONLY AN EVENT WHEN SOMETHING CHANGES ACROSS IT.
    #
    # The first version appended an unconditional "scene begins" for every scene, and Gate 0
    # caps every scene at 5.0s, so the >MAX_REST_S condition could never be true on any board
    # storyboard_check had accepted. Proof: an eight-scene forty-second board with
    # `visual_events: []` on every single scene passed BOTH gates with zero problems. No visual
    # event existed anywhere in the film and the rest check stayed silent.
    #
    # The docstring already said the rule breaks across a boundary between two scenes that move
    # the same way; the code just applied that idea to a different check three lines down.
    # A CUT IS NOT AN EVENT.
    #
    # The rule is that every five seconds PAYS in motion, emotion or revelation, and a hard cut
    # to another static picture pays in nothing. So the gap is measured between DECLARED VISUAL
    # EVENTS and scene starts are not counted among them.
    #
    # The first version appended an unconditional "scene begins" per scene. Gate 0 caps a scene
    # at 5.0s, so the >MAX_REST_S condition was unreachable on any board Gate 0 had accepted:
    # an eight-scene forty-second board with `visual_events: []` on every single scene passed
    # both gates with zero problems, and no visual event existed anywhere in the film.
    #
    # Counting a boundary only when the shot changes across it — the first attempt at this fix —
    # is no better, because that case is already caught by the "cut changes nothing" check twenty
    # lines down. It would have made this check redundant rather than working.
    events: list[tuple[float, str]] = []
    for s in scenes:
        start = float(s.get("start_s") or 0)
        for e in s.get("visual_events") or []:
            events.append((start + float(e.get("at_s") or 0), str(e.get("what") or "an event")))
    events.sort()
    prev_t, prev_what = 0.0, "the first frame"
    for t, what in events + [(runtime, "the last frame")]:
        if t - prev_t > MAX_REST_S + 0.001:
            p.append(f"a rest of {t - prev_t:.1f}s between {prev_what} at {prev_t:.1f}s and "
                     f"{what} at {t:.1f}s. Every five seconds pays in motion, emotion or "
                     f"revelation, and this stretch pays in nothing.")
        prev_t, prev_what = t, what

    # A scene boundary is only an event if something actually changes across it.
    for a, b in zip(scenes, scenes[1:]):
        if (a.get("camera_strategy") == b.get("camera_strategy")
                and a.get("hero") == b.get("hero")
                and a.get("region") == b.get("region")):
            p.append(f"the cut from {a.get('id')} to {b.get('id')} changes nothing: same move, "
                     f"same hero, same region. On screen that join does not exist, so the two "
                     f"scenes are one long drift however they are labelled.")

    # ---- A MOTIVATED SOUND ON EVERY BEAT.
    for s in scenes:
        s0 = float(s.get("start_s") or 0)
        s1 = s0 + float(s.get("duration_s") or 0)
        mine = [e for e in sfx
                if overlaps(s0, s1, float(e.get("at_s") or 0),
                            float(e.get("at_s") or 0) + float(e.get("dur_s") or 0.1))]
        if not mine:
            p.append(f"scene {s.get('id')} has no sound event. A music bed covers everything and "
                     f"therefore marks nothing. The picture needs one sound that belongs to a "
                     f"thing in it.")
            continue
        on = shot_coherence.scene_visual_tokens(s)
        motivated = [e for e in mine
                     if words(e.get("source", "")) & on
                     and not (words(e.get("source", "")) & UNMOTIVATED)]
        if not motivated:
            names = ", ".join(sorted({str(e.get("source", "?")) for e in mine}))
            p.append(f"scene {s.get('id')}: every sound in it ({names}) is motivated by nothing "
                     f"on screen. A library whoosh marks a cut; a bearing groan marks a place.")
        if len(mine) > 6:
            p.append(f"scene {s.get('id')} stacks {len(mine)} sound events into "
                     f"{s1 - s0:.1f}s. Emphasis needs somewhere quiet to stand against, and a "
                     f"wall of sound marks nothing at all.")

    # ---- SAY IT, SHOW IT.
    uncovered = []
    for s in scenes:
        vo = str(s.get("vo") or "").strip()
        if not vo:
            continue
        subject = words(vo)
        shown = shot_coherence.scene_visual_tokens(s)
        if subject and not (subject & shown):
            uncovered.append((s.get("id"), vo[:60]))
    for sid, line in uncovered:
        p.append(f"scene {sid}: the voice says \"{line}...\" and the picture shows none of it. "
                 f"That is an explainer: the voice carries the information and the picture is "
                 f"decoration behind it.")
    if scenes and len(uncovered) > len(scenes) / 2:
        p.append(f"{len(uncovered)} of {len(scenes)} scenes are voice-carried. This is not a "
                 f"list of local faults, it is the shape of the film.")
    return p


def self_test() -> int:
    failures = 0

    def ok(label, cond, extra=""):
        nonlocal failures
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}{'' if cond else '  ' + extra}")
        if not cond:
            failures += 1

    moves = sorted({"dollyThrough", "orbitReveal", "craneDown", "truckAcross", "riseWith"})

    def board(n=6):
        scenes = []
        for i in range(1, n + 1):
            scenes.append({
                "id": f"s{i}", "start_s": (i - 1) * 5.0, "duration_s": 5.0,
                "camera_strategy": moves[i % len(moves)], "hero": f"pumpjack{i}",
                "region": "high_plains",
                "on_screen": f"a pumpjack{i} beside a substation transformer",
                "what_moves": f"the pumpjack{i} strokes and the camera pushes past",
                "vo": "The transformer beside that pumpjack is the whole constraint.",
                "cast": [{"id": "rancher"}],
                "planes": [{"items": [
                    {"id": f"pump-{i}", "kind": "pumpjack"},
                    {"id": f"transformer-{i}", "kind": "transformer"},
                ]}],
                "visual_proof": {
                    "mute_takeaway": "a transformer visibly constrains the working pumpjack",
                    "must_show": [{"concept": "transformer pumpjack",
                                   "item_ids": [f"pump-{i}", f"transformer-{i}"]}],
                    "change": {"description": "the pumpjack beam moves beside the transformer",
                               "item_ids": [f"pump-{i}", f"transformer-{i}"]},
                },
                "visual_events": [{"at_s": 2.5, "what": "the beam reaches bottom",
                                   "item_ids": [f"pump-{i}"]}],
            })
        return {"runtime_s": n * 5.0, "scenes": scenes}

    def sfx(n=6):
        return [{"at_s": (i - 1) * 5.0 + 1.0, "dur_s": 1.2, "source": "pumpjack bearing groan"}
                for i in range(1, n + 1)]

    ok("a flowing cut passes", not check(board(), sfx()), str(check(board(), sfx())))

    # THE REST.
    quiet = board()
    quiet["scenes"][2]["visual_events"] = []
    quiet["scenes"][3]["visual_events"] = []
    quiet["scenes"][2]["duration_s"] = 5.0
    # remove the boundary event by merging: scene 3 now runs 10s with nothing in it
    quiet["scenes"] = [s for s in quiet["scenes"] if s["id"] != "s4"]
    quiet["scenes"][2]["duration_s"] = 10.0
    for i, s in enumerate(quiet["scenes"]):
        s["start_s"] = sum(float(x["duration_s"]) for x in quiet["scenes"][:i])
    quiet["runtime_s"] = sum(float(s["duration_s"]) for s in quiet["scenes"])
    r = check(quiet, sfx())
    ok("a stretch with nothing happening is refused", any("a rest of" in x for x in r), str(r[:2]))

    # THE ONE THAT COULD NEVER FIRE. Every scene composed, every scene EMPTY.
    hollow = board()
    for sc in hollow["scenes"]:
        sc["visual_events"] = []
    r = check(hollow, sfx())
    ok("a film where NO scene contains a single visual event is refused",
       any("a rest of" in x for x in r), str(r[:2]))
    try:
        sys.path.insert(0, str(REPO / "scripts"))
        import storyboard_check as _sb
        sb_board = {"runtime_s": 30.0, "scenes": [
            {"id": s["id"], "start_s": s["start_s"], "duration_s": s["duration_s"],
             "region": s["region"], "county": "Taylor", "camera_strategy": s["camera_strategy"],
             "planes": ["sky", "ridge", "mid", "near", "hero"], "hero": s["hero"],
             "cast": [{"id": "rancher"}], "beat": ["motion", "emotion", "revelation"][i % 3],
             "on_screen": s["on_screen"], "what_moves": s["what_moves"]}
            for i, s in enumerate(hollow["scenes"])]}
        ok("...which is exactly why this check has to be the one that catches it",
           not [x for x in _sb.check(sb_board) if "rest" in x])
    except ImportError:
        ok("storyboard_check is importable for the cross-check", False)

    # A cut that changes nothing.
    same = board()
    same["scenes"][2]["camera_strategy"] = same["scenes"][1]["camera_strategy"]
    same["scenes"][2]["hero"] = same["scenes"][1]["hero"]
    r = check(same, sfx())
    ok("a cut between two identical shots is refused",
       any("that join does not exist" in x for x in r), str(r[:2]))

    # SILENT PICTURE.
    r = check(board(), sfx()[:-2])
    ok("a scene with no sound at all is refused", any("no sound event" in x for x in r))
    ok("...and the message says why a music bed does not count",
       any("marks nothing" in x for x in r))

    # UNMOTIVATED SOUND.
    generic = [{"at_s": (i - 1) * 5.0 + 1.0, "dur_s": 0.6, "source": "whoosh"}
               for i in range(1, 7)]
    r = check(board(), generic)
    ok("a beat marked only by a library whoosh is refused",
       any("motivated by nothing" in x for x in r), str(r[:1]))

    # A WALL OF SOUND.
    wall = sfx() + [{"at_s": 1.0 + j * 0.4, "dur_s": 0.2, "source": "pumpjack1 clank"}
                    for j in range(8)]
    r = check(board(), wall)
    ok("a beat with a sound stacked on every frame is refused",
       any("wall of sound" in x for x in r))

    # SAY IT, SHOW IT.
    talky = board()
    talky["scenes"][1]["vo"] = "Interconnection queues in another state decided this outcome."
    r = check(talky, sfx())
    ok("a VO line whose subject is nowhere in the picture is refused",
       any("decoration behind it" in x for x in r), str(r[:1]))

    allt = board()
    for s in allt["scenes"]:
        s["vo"] = "Regulatory timelines shifted beneath everyone involved."
    r = check(allt, sfx())
    ok("...and a film that is mostly voice-carried is named as a SHAPE, not a list",
       any("the shape of the film" in x for x in r))

    # A scene with no VO is legitimate: silence over a picture is a choice.
    mute = board()
    mute["scenes"][3]["vo"] = ""
    ok("a scene with no VO is fine, because silence over a picture is a choice",
       not any("decoration" in x for x in check(mute, sfx())))

    ok("an empty cut is refused", bool(check({"runtime_s": 0, "scenes": []}, [])))

    if failures:
        print(f"\nflow_check self-test: {failures} FAILED", file=sys.stderr)
        return 1
    print("\nflow_check self-test: all passed")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--board", help="out/dispatch/storyboard.json")
    ap.add_argument("--sfx", help="out/dispatch/sfx_events.json")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    if not (a.board and a.sfx):
        print("flow_check: pass --board and --sfx, or --self-test", file=sys.stderr)
        return 2
    try:
        board = json.loads(Path(a.board).read_text(encoding="utf-8"))
        raw = json.loads(Path(a.sfx).read_text(encoding="utf-8"))
        sfx = raw if isinstance(raw, list) else raw.get("events", [])
    except (OSError, json.JSONDecodeError) as exc:
        print(f"flow_check: cannot read inputs: {exc}", file=sys.stderr)
        return 2
    problems = check(board, sfx)
    if problems:
        print(f"flow: {len(problems)} problem(s)\n", file=sys.stderr)
        for x in problems:
            print(f"  - {x}", file=sys.stderr)
        return 1
    print("flow: clean. Now spawn flow-critic on the montage for taste.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:                                            # noqa: BLE001
        print(f"flow_check: broke: {exc}", file=sys.stderr)
        sys.exit(2)
