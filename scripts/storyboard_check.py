#!/usr/bin/env python3
"""storyboard_check.py — Gate 0. The last cheap place to fix a film.

WHY THIS EXISTS

Everything after this point costs a render. A board that passes here and is wrong
costs an hour; the same fault caught here costs a paragraph. So this runs BEFORE any
scene code exists, and the `storyboard-critic` agent runs after it, on the objective
facts this establishes rather than on vibes.

It checks what can be checked mechanically. Taste is the critic's job and this file
does not pretend to have any.

THE DEFECTS IT IS FOR, each one seen for real.

  A RELABEL PRETENDING TO BE DIVERGENCE. Six scenes that all say dollyThrough over
  the same six planes with the same hero, differing only in the caption. On the page
  it reads as a varied board because the words differ. On screen it is one shot
  played six times. So divergence is measured on the COMPOSITION SIGNATURE, not on
  the label.

  A STATIC CAMERA. The engine's whole value is a composed move through real depth. A
  scene that declares no move wastes it, and a board full of them is a slideshow.

  A FILM THAT PAYS IN ONE CURRENCY. The showstopper standard says every five seconds
  pays in motion, emotion or revelation. A board where every scene says "motion" has
  no turn in it and nobody remembers an image from it.

  A GAP. Scenes that do not tile the runtime leave dead air that nobody notices until
  the mix, when it is expensive.

  A REGION THAT IS NOT A REGION. The first law of drawing Texas is that a Texan does
  not forgive being told they live somewhere they don't, and the region comes from
  the story's county. A typo'd region name silently falls back to a default light.

  A BOARD THAT CANNOT BE TOLD MUTED. Most viewers see it silent first. A scene with
  nothing declared on screen and nothing declared moving is a voiceover with a colour
  behind it.

    storyboard_check.py --board out/dispatch/storyboard.json
    storyboard_check.py --self-test

Exit 0 clean, 1 the board is not ready, 2 the checker could not run.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]

REGIONS = {"high_plains", "rolling_plains", "cross_timbers", "blackland", "post_oak",
           "piney_woods", "gulf", "south_texas", "hill_country", "trans_pecos"}

MOVES = {"dollyThrough", "orbitReveal", "craneDown", "truckAcross", "riseWith"}

CURRENCIES = {"motion", "emotion", "revelation"}

# The degradation ladder's floor. Shorter than this is not a Dispatch.
MIN_RUNTIME_S = 35.0

# A scene that holds longer than this without paying is a held slide, which the
# rubric lists as a hard fail.
MAX_SCENE_S = 5.0

# Motifs that are retired, from knowledge/texas/CULTURE.md. Named here so a board
# carrying one is refused before it is drawn rather than after.
RETIRED = {"six flags", "confederate", "loteria", "lotería", "calavera", "headdress",
           "wood type", "rope border", "cowhide"}


def signature(scene: dict) -> tuple:
    """What a scene actually looks like, ignoring the words used to describe it.

    Two scenes with the same move, the same plane stack and the same hero are the
    same shot however differently their prose reads. This is the whole reason the
    divergence check is not a set of camera_strategy strings.
    """
    return (scene.get("camera_strategy", ""),
            tuple(scene.get("planes", [])),
            scene.get("hero", ""))


def check(board: dict) -> list[str]:
    p: list[str] = []
    scenes = board.get("scenes") or []
    if not scenes:
        return ["the board has no scenes"]

    runtime = float(board.get("runtime_s") or 0)
    if runtime < MIN_RUNTIME_S:
        p.append(f"runtime {runtime:.0f}s is under the {MIN_RUNTIME_S:.0f}s floor in the "
                 f"degradation ladder. Rung (b) says a shorter film is allowed with the "
                 f"shortfall named, but not shorter than this.")

    # ---- structure, per scene
    for i, s in enumerate(scenes, 1):
        sid = s.get("id") or f"#{i}"
        move = s.get("camera_strategy", "")
        if move not in MOVES:
            p.append(f"scene {sid}: camera_strategy {move!r} is not a composed move. "
                     f"Pick one of {', '.join(sorted(MOVES))}. A scene with a static camera "
                     f"wastes the engine.")
        if s.get("region") not in REGIONS:
            p.append(f"scene {sid}: region {s.get('region')!r} is not one of the ten. A name "
                     f"that is not a region falls back to a default light, so the frame is lit "
                     f"for somewhere else and nothing says so.")
        if not str(s.get("county") or "").strip():
            p.append(f"scene {sid}: no county. The region comes FROM the county, so a region "
                     f"without one was chosen for how it looks.")
        planes = s.get("planes") or []
        if not 4 <= len(planes) <= 6:
            p.append(f"scene {sid}: {len(planes)} planes. Four to six, or there is no depth "
                     f"for the camera to move through.")
        if s.get("beat") not in CURRENCIES:
            p.append(f"scene {sid}: beat {s.get('beat')!r} is not one of "
                     f"{', '.join(sorted(CURRENCIES))}. Every five seconds pays in one of them.")
        dur = float(s.get("duration_s") or 0)
        if dur <= 0:
            p.append(f"scene {sid}: no duration")
        elif dur > MAX_SCENE_S + 0.001:
            p.append(f"scene {sid}: {dur:.1f}s is longer than {MAX_SCENE_S:.0f}s. The rubric "
                     f"hard-fails a held slide longer than that with no motion, emotion or "
                     f"revelation. Split it or make it move.")
        # SILENT FIRST. Most viewers see it muted.
        if not str(s.get("on_screen") or "").strip():
            p.append(f"scene {sid}: nothing declared on screen. It cannot be told muted.")
        if not str(s.get("what_moves") or "").strip():
            p.append(f"scene {sid}: nothing declared moving. A frame that does not move is a "
                     f"slide with a voice over it.")
        blob = " ".join(str(s.get(k, "")) for k in ("on_screen", "what_moves", "note")).lower()
        for bad in sorted(RETIRED):
            if bad in blob:
                p.append(f"scene {sid}: carries a retired motif ({bad}). "
                         f"knowledge/texas/CULTURE.md says why.")

    # ---- the tiling. Gaps become dead air nobody finds until the mix.
    ordered = sorted(scenes, key=lambda s: float(s.get("start_s") or 0))
    cursor = 0.0
    for s in ordered:
        sid = s.get("id") or "?"
        start = float(s.get("start_s") or 0)
        if abs(start - cursor) > 0.05:
            kind = "a gap" if start > cursor else "an overlap"
            p.append(f"scene {sid}: {kind} of {abs(start - cursor):.2f}s at {start:.2f}s. "
                     f"The scenes must tile the runtime with no dead air.")
        cursor = start + float(s.get("duration_s") or 0)
    if abs(cursor - runtime) > 0.05:
        p.append(f"the scenes cover {cursor:.2f}s but the runtime is {runtime:.2f}s")

    # ---- DIVERGENCE, on the signature rather than the label
    sigs = [signature(s) for s in ordered]
    for i in range(1, len(sigs)):
        if sigs[i] == sigs[i - 1]:
            a, b = ordered[i - 1].get("id"), ordered[i].get("id")
            p.append(f"scenes {a} and {b} are the SAME SHOT: same move, same planes, same hero. "
                     f"Different prose is not different composition.")
    if len(sigs) > 2 and len(set(sigs)) < max(2, len(sigs) // 2):
        p.append(f"{len(set(sigs))} distinct compositions across {len(sigs)} scenes. The board "
                 f"reads as varied because the captions differ; on screen it is one shot "
                 f"repeated.")
    moves = [s.get("camera_strategy") for s in ordered]
    if len(set(moves)) == 1 and len(moves) > 2:
        p.append(f"every scene uses {moves[0]}. One move for a whole film is a house style "
                 f"nobody chose.")

    # ---- currency mix. A film that pays only in motion has no turn in it.
    beats = [s.get("beat") for s in ordered]
    if len(ordered) >= 3 and len(set(beats) & CURRENCIES) < 2:
        p.append(f"every scene pays in the same currency ({beats[0]!r}). The showstopper "
                 f"standard trades in three, and a film with no revelation in it is a summary "
                 f"of the news with pictures on top.")
    if len(ordered) >= 4 and "revelation" not in beats:
        p.append("no scene is a revelation. Nobody remembers an image from a film that never "
                 "shows them something they did not already have.")

    # ---- a face somewhere. "If a stretch has no face on screen, ask why."
    if not any(s.get("cast") for s in ordered):
        p.append("no scene has cast. Emotion is what makes information land as story, and a "
                 "film with no face in it has nowhere to put any.")
    return p


def self_test() -> int:
    failures = 0

    def ok(label, cond, extra=""):
        nonlocal failures
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}{'' if cond else '  ' + extra}")
        if not cond:
            failures += 1

    def scene(i, **kw):
        s = {"id": f"s{i}", "start_s": (i - 1) * 5.0, "duration_s": 5.0,
             "region": "high_plains", "county": "Taylor", "camera_strategy": "dollyThrough",
             "planes": ["sky", "ridge", "mid", "near", "hero"], "hero": f"h{i}",
             "cast": [{"id": "rancher", "emotion": "worried"}], "beat": "motion",
             "on_screen": "a substation yard", "what_moves": "the camera pushes past a pole"}
        s.update(kw)
        return s

    def board(n=8, **kw):
        moves = sorted(MOVES)
        scenes = [scene(i, camera_strategy=moves[i % len(moves)],
                        beat=["motion", "emotion", "revelation"][i % 3]) for i in range(1, n + 1)]
        b = {"runtime_s": n * 5.0, "scenes": scenes}
        b.update(kw)
        return b

    ok("a good board passes", not check(board()), str(check(board())))

    # THE DEFECT THIS FILE IS FOR: a relabel pretending to be divergence.
    same = board()
    for s in same["scenes"]:
        s["camera_strategy"] = "dollyThrough"
        s["hero"] = "the same pumpjack"
        s["on_screen"] = f"a different sentence number {s['id']}"
    r = check(same)
    ok("six scenes that are one shot with different prose are REFUSED", bool(r))
    ok("...and the report says composition, not wording",
       any("SAME SHOT" in x or "one shot" in x for x in r), str(r[:2]))

    st = board()
    st["scenes"][2]["camera_strategy"] = "static"
    ok("a static camera is refused",
       any("static camera" in x for x in check(st)), str(check(st)))

    one = board()
    for s in one["scenes"]:
        s["beat"] = "motion"
    ok("a film that pays only in motion is refused",
       any("same currency" in x for x in check(one)))

    nr = board(5)
    for i, s in enumerate(nr["scenes"]):
        s["beat"] = ["motion", "emotion"][i % 2]
    ok("...and a film with no revelation in it is named separately",
       any("no scene is a revelation" in x for x in check(nr)))

    gap = board()
    gap["scenes"][3]["start_s"] += 1.5
    ok("a gap in the tiling is refused", any("a gap of" in x for x in check(gap)),
       str(check(gap)[:2]))

    lap = board()
    lap["scenes"][3]["start_s"] -= 1.5
    ok("...and so is an overlap", any("an overlap of" in x for x in check(lap)))

    bad_region = board()
    bad_region["scenes"][1]["region"] = "hill country"          # a space, not an underscore
    ok("a region name that is not a region is refused",
       any("is not one of the ten" in x for x in check(bad_region)))
    ok("...because it would silently fall back to a default light",
       any("nothing says so" in x for x in check(bad_region)))

    no_county = board()
    no_county["scenes"][0]["county"] = ""
    ok("a region with no county behind it is refused",
       any("chosen for how it looks" in x for x in check(no_county)))

    mute = board()
    mute["scenes"][2]["on_screen"] = "   "
    ok("a scene that cannot be told muted is refused",
       any("told muted" in x for x in check(mute)))

    still = board()
    still["scenes"][2]["what_moves"] = ""
    ok("a scene with nothing moving is refused",
       any("slide with a voice over it" in x for x in check(still)))

    held = board()
    held["scenes"][2]["duration_s"] = 7.0
    ok("a scene held past five seconds is refused",
       any("held slide" in x for x in check(held)))

    short = board(6)
    short["runtime_s"] = 30.0
    short["scenes"] = short["scenes"][:6]
    ok("a film under the 35s floor is refused",
       any("floor in the degradation ladder" in x for x in check(short)))

    motif = board()
    motif["scenes"][4]["on_screen"] = "a rope border around the six flags of Texas"
    r = check(motif)
    ok("a retired motif is refused before it is drawn", any("retired motif" in x for x in r))

    faceless = board()
    for s in faceless["scenes"]:
        s["cast"] = []
    ok("a film with no face anywhere is refused",
       any("nowhere to put any" in x for x in check(faceless)))

    thin = board()
    thin["scenes"][1]["planes"] = ["sky", "hero"]
    ok("two planes is not depth", any("no depth" in x for x in check(thin)))

    ok("an empty board is refused", bool(check({"runtime_s": 60, "scenes": []})))

    if failures:
        print(f"\nstoryboard_check self-test: {failures} FAILED", file=sys.stderr)
        return 1
    print("\nstoryboard_check self-test: all passed")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--board", help="out/dispatch/storyboard.json")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    if not a.board:
        print("storyboard_check: pass --board, or --self-test", file=sys.stderr)
        return 2
    try:
        board = json.loads(Path(a.board).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"storyboard_check: cannot read the board: {exc}", file=sys.stderr)
        return 2
    problems = check(board)
    if problems:
        print(f"storyboard: {len(problems)} problem(s). This is the CHEAP place to fix "
              f"them.\n", file=sys.stderr)
        for x in problems:
            print(f"  - {x}", file=sys.stderr)
        return 1
    print(f"storyboard: clean, {len(board.get('scenes', []))} scenes, "
          f"{float(board.get('runtime_s', 0)):.0f}s. Now spawn storyboard-critic for taste.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:                                            # noqa: BLE001
        print(f"storyboard_check: broke: {exc}", file=sys.stderr)
        sys.exit(2)
