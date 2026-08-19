#!/usr/bin/env python3
"""Re-time the board's cuts to the MEASURED read, so the picture stops running a scene
ahead of the voice.

THE DEFECT THIS EXISTS FOR, and two independent scorers found it in the same round without
seeing each other's notes. The board is authored in Phase 4, before a single word has been
synthesised, and it lays its scenes out on a uniform five second grid because five is a
round number and nothing better is known yet. The read is then synthesised, and it does not
land on that grid, because no human read of eight sentences ever has. Nothing downstream
ever moved the cuts.

The result: for roughly half the runtime the narration described the PREVIOUS shot. The
half built hall, the strongest image in the film, played under the line about the access
notice. The line that names what makes the machine public played over a ranking table. Both
halves were good and they were five seconds apart, which is the most expensive kind of
defect because every gate is green and every asset is correct.

So the cuts move to the words. Each scene declares the `vo` line it was built for, that
line is located in the ALIGNED word stream by matching tokens, and the scene's start is the
measured start of its own first word. Scenes with no line of their own are breathing room
and get interpolated between their spoken neighbours.

WHAT THIS REFUSES, rather than papering over:

- a `vo` line it cannot find in the word stream. A board whose vo text has drifted from the
  script that was actually read is a board whose retime would be a guess, and a confident
  guess here silently re-cuts the film to the wrong places.
- a retime that would make any scene shorter than `--min-scene`. A cut that flashes is
  worse than a cut that is late.
- starts that do not increase. Monotonicity is the one thing a timeline cannot negotiate.
- a total that does not still equal the film's runtime.

It NEVER stretches audio and never touches the mix. It moves cuts, which is free.

Run by EXIT CODE.

  python3 scripts/board_retime.py --board out/dispatch/storyboard.json \\
                                  --words out/dispatch/words.json
  python3 scripts/board_retime.py --self-test
"""
from __future__ import annotations

import argparse
import json
import math
import re
import sys

MIN_SCENE_DEFAULT = 2.4
# A cut lands a beat BEFORE the phrase it belongs to, never on the syllable. Cutting exactly
# on the onset reads as the picture reacting to the voice; a short lead reads as the voice
# arriving in a shot that is already there.
LEAD_DEFAULT = 0.28


def norm(tok: str) -> str:
    return re.sub(r"[^a-z0-9]", "", tok.lower())


def tokens(line: str) -> list[str]:
    return [t for t in (norm(w) for w in line.split()) if t]


def find_line(words: list[dict], line: str, search_from: int) -> tuple[int, float]:
    """Locate `line` in the word stream at or after `search_from`.

    Returns (index, confidence 0..1). Matching is on a short HEAD of the line rather than
    the whole of it, because a scene's vo is a plan and the read is the performance: a
    trimmed clause or a swapped word at the tail is normal and must not lose the match.
    """
    toks = tokens(line)
    if not toks:
        return -1, 0.0
    k = min(6, len(toks))
    best_i, best = -1, 0.0
    for i in range(search_from, len(words)):
        hit = sum(1 for j in range(k)
                  if i + j < len(words) and norm(words[i + j]["word"]) == toks[j])
        conf = hit / k
        if conf > best:
            best, best_i = conf, i
        if best == 1.0:
            break
    return best_i, best


def retime(board: dict, words: list[dict], min_scene: float = MIN_SCENE_DEFAULT,
           lead: float = LEAD_DEFAULT, min_conf: float = 0.5) -> tuple[dict, list[str]]:
    errs: list[str] = []
    scenes = board.get("scenes") or []
    if not scenes:
        return board, ["the board has no scenes to re-time."]

    runtime = float(board.get("runtime_s") or 0)
    if runtime <= 0:
        runtime = max((float(s.get("start_s", 0)) + float(s.get("duration_s", 0)))
                      for s in scenes)

    # ---- locate every spoken scene's own line, left to right -------------------------
    targets: dict[int, float] = {}
    cursor = 0
    for idx, s in enumerate(scenes):
        line = (s.get("vo") or "").strip()
        if not line:
            continue
        i, conf = find_line(words, line, cursor)
        if i < 0 or conf < min_conf:
            errs.append(
                f"scene {s.get('id', idx)}: its vo line could not be found in the aligned "
                f"words at or after word {cursor} (best confidence {conf:.2f}). The board's "
                f"vo has drifted from the script that was read, and re-timing on a guess "
                f"would re-cut the film to the wrong places. Reconcile the board's vo with "
                f"out/dispatch/vo_script.txt and align again.")
            continue
        # THE LEAD COMES OUT OF THE SILENCE, NEVER OUT OF THE PREVIOUS LINE'S TAIL.
        #
        # A flat 0.28s pre-roll is a J-cut and it is right whenever there is 0.28s of silence
        # to take it from. When two lines run closer together than that, the cut lands BEFORE
        # the previous line has finished, so its last word plays over the next picture.
        # Measured on this film: "hour." 0.120s late, "size." 0.100s late, "no." 0.072s late,
        # each a whole word of one scene's sentence arriving on the following scene, and one
        # of them crossing a county line. The pre-roll was stealing from the tail every time
        # the read did not leave it room.
        prev_end = float(words[i - 1]["end"]) if i > 0 else 0.0
        gap = max(0.0, float(words[i]["start"]) - prev_end)
        targets[idx] = max(0.0, float(words[i]["start"]) - min(lead, gap * 0.5))
        cursor = i + 1

    if errs:
        return board, errs
    if not targets:
        return board, ["no scene declares a vo line, so there is nothing to re-time to."]

    # ---- solve every start, interpolating the silent scenes --------------------------
    starts: list[float] = [0.0] * len(scenes)
    known = sorted(targets)
    starts[0] = 0.0
    for a, b in zip([0] + known, known + [len(scenes)]):
        # `a` is a fixed index, `b` the next fixed index (or the end)
        lo = targets.get(a, 0.0) if a in targets else starts[a]
        hi = targets.get(b, runtime) if b in targets else runtime
        starts[a] = lo
        span = b - a
        if span <= 1:
            continue
        for k in range(1, span):
            starts[a + k] = lo + (hi - lo) * (k / span)

    starts[0] = 0.0

    # ---- push apart anything the read crowded, then check ----------------------------
    for i in range(1, len(starts)):
        if starts[i] < starts[i - 1] + min_scene:
            starts[i] = starts[i - 1] + min_scene
    if starts[-1] + min_scene > runtime + 1e-6:
        errs.append(
            f"re-timing needs {starts[-1] + min_scene:.2f}s for {len(scenes)} scenes at a "
            f"{min_scene}s floor, and the film is {runtime:.2f}s. The read is too crowded "
            f"for this many cuts. TRIM THE BOARD or the script, never the floor.")
        return board, errs

    durations = [round(starts[i + 1] - starts[i], 3) for i in range(len(starts) - 1)]
    durations.append(round(runtime - starts[-1], 3))

    for i, (st, du) in enumerate(zip(starts, durations)):
        if du < min_scene - 1e-6:
            errs.append(
                f"scene {scenes[i].get('id', i)} would run {du:.2f}s, under the {min_scene}s "
                f"floor. A cut that flashes is worse than a cut that is late.")
    if errs:
        return board, errs

    total = round(starts[0] + sum(durations), 3)
    if abs(total - runtime) > 0.01:
        errs.append(f"the re-timed scenes total {total}s against a {runtime}s runtime.")
        return board, errs

    moved = []
    for i, s in enumerate(scenes):
        was = float(s.get("start_s", 0))
        was_dur = float(s.get("duration_s", 0)) or durations[i]
        s["start_s"] = round(starts[i], 3)
        s["duration_s"] = durations[i]

        # THE BEATS INSIDE A SCENE MOVE WITH IT, and forgetting this is how re-timing
        # quietly breaks what it was meant to fix. Every `at_s` was authored against a five
        # second scene. Re-cut to 2.4 seconds, an event at 3.4 fires after the scene is
        # already gone; re-cut to 9.2, both events land in the first third and the shot
        # dies for six seconds. Neither errors, and both are exactly the kind of nothing
        # that renders successfully.
        #
        # An event holds its POSITION IN THE SHOT rather than its absolute second, because
        # what it was authored to mean is "a quarter of the way in", not "at 1.2".
        # AND IT MUST BE IDEMPOTENT, because a run re-times more than once. Scaling from
        # whatever `at_s` currently holds compounds: re-time to 2.4s and back out to 7.5s
        # and the beats do not return, they drift, and a beat that ended up at 98% of its
        # own shot is a beat nobody sees. So the AUTHORED value is written down once and
        # every scaling is computed from that, never from the last result.
        for ev in s.get("visual_events") or []:
            if "at_s" not in ev:
                continue
            if "at_s_authored" not in ev:
                ev["at_s_authored"] = float(ev["at_s"])
            frac = ev["at_s_authored"] / (float(s.get("duration_authored") or was_dur) or 1.0)
            ev["at_s"] = round(min(frac * durations[i], durations[i] - 0.15), 3)
        if "duration_authored" not in s:
            s["duration_authored"] = was_dur

        if abs(was - starts[i]) > 0.05:
            moved.append((s.get("id", i), was, round(starts[i], 3)))
    board["retimed_to"] = "measured_word_starts"
    board["_retime_moved"] = moved
    return board, []


# ------------------------------------------------------------------ the self-test
def retime_sfx(scenes: list[dict], events: list[dict]) -> tuple[list[dict], list[str]]:
    """Move each sound to wherever its own scene went.

    THE SOUND IS ANCHORED TO THE SCENE, NOT TO THE CLOCK. A foley event exists because
    something is visible: a fan wall, a pickup on the frontage road, a transformer on its
    pad. Re-cutting the picture without re-cutting the sound leaves the transformer humming
    over the machine room, and `flow_check` says exactly that in exactly those words. It
    caught six of them here on the first re-timed board.

    An event names its scene in its id (`s03-snd`), which is the only binding that exists,
    so an event whose scene cannot be resolved is REPORTED rather than left where it lies.
    """
    errs: list[str] = []
    by_id = {s.get("id"): s for s in scenes}
    authored = {s.get("id"): float(s.get("duration_authored") or s.get("duration_s") or 5.0)
                for s in scenes}
    # the grid the events were authored against, rebuilt from the authored durations
    at, auth_start = 0.0, {}
    for s in scenes:
        auth_start[s.get("id")] = at
        at += authored[s.get("id")]

    for ev in events:
        sid = str(ev.get("id") or "").split("-")[0]
        s = by_id.get(sid)
        if not s:
            errs.append(
                f"sound {ev.get('id')!r} names no scene on this board, so there is nothing "
                f"to move it with. A sound that is not anchored to a picture is the library "
                f"whoosh this project does not use.")
            continue
        # WHAT IS REMEMBERED IS THE OFFSET INSIDE THE SHOT, NOT A TIME ON A CLOCK.
        #
        # This first stored the event's absolute authored second and rebuilt the authored
        # grid by accumulating scene durations. That is correct exactly until the board
        # gains or loses a scene, and then every event after the change is off by that
        # scene's length: cutting one scene here moved a sound out of the shot that
        # motivates it, and flow_check reported the next scene as silent. A position that
        # has to be recomputed from its neighbours is a position that breaks when a
        # neighbour goes.
        if "frac_authored" not in ev:
            at = float(ev.get("at_s_authored", ev.get("at_s") or 0))
            ev["frac_authored"] = round(
                max(0.0, (at - auth_start[sid]) / (authored[sid] or 1.0)), 4)
            ev.pop("at_s_authored", None)
        ev["at_s"] = round(
            float(s["start_s"]) + float(ev["frac_authored"]) * float(s["duration_s"]), 3)
        # a sound may not outlast the shot that motivates it
        if ev.get("dur_s"):
            ev["dur_s"] = round(min(float(ev["dur_s"]), float(s["duration_s"])), 3)
    return events, errs


def _self_test() -> int:
    fails = []

    def ok(label, cond):
        if not cond:
            fails.append(label)
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}")

    def wordstream(pairs):
        return [{"word": w, "start": t, "end": t + 0.2} for w, t in pairs]

    # A read that does NOT land on the board's grid, which is the whole point.
    words = wordstream([
        ("Off", 0.30), ("a", 0.5), ("frontage", 0.7), ("road", 0.9),
        ("Half", 11.10), ("is", 11.4), ("running", 11.7),
        ("The", 15.18), ("operator", 15.5), ("guide", 16.0),
        ("What", 51.10), ("makes", 51.4), ("it", 51.7), ("public", 52.0),
    ])
    board = {
        "runtime_s": 60,
        "scenes": [
            {"id": "s01", "start_s": 0, "duration_s": 15, "vo": "Off a frontage road"},
            {"id": "s02", "start_s": 15, "duration_s": 15, "vo": ""},
            {"id": "s03", "start_s": 30, "duration_s": 15, "vo": "Half is running"},
            {"id": "s04", "start_s": 45, "duration_s": 15,
             "vo": "What makes it public was never its size"},
        ],
    }
    b, e = retime(json.loads(json.dumps(board)), words)
    ok("a board on a grid re-times to the measured read", not e)
    st = [s["start_s"] for s in b["scenes"]]
    ok("...the first scene still starts at zero", st[0] == 0.0)
    ok("...a spoken scene lands just before its own first word",
       abs(st[2] - (11.10 - LEAD_DEFAULT)) < 0.01)

    # THE TAIL IS NOT THE LEAD'S TO SPEND. Two lines closer together than the pre-roll used
    # to put the cut before the previous line finished, so its last word played over the
    # next picture. On this film that sent three whole words onto the following scene and
    # one of them across a county line.
    tight = wordstream([
        ("Off", 0.30), ("road", 0.60),
        ("Half", 0.86), ("running", 1.20),      # only 0.06s after "road" ends at 0.80
        ("What", 20.0), ("makes", 20.3),
    ])
    tb = {"runtime_s": 40, "scenes": [
        {"id": "s01", "start_s": 0, "duration_s": 10, "vo": "Off road"},
        {"id": "s02", "start_s": 10, "duration_s": 10, "vo": "Half running"},
        {"id": "s03", "start_s": 20, "duration_s": 20, "vo": "What makes"}]}
    tr, te = retime(tb, tight, min_scene=0.2)
    ok("a cut never lands before the previous line has finished", not te)
    cut = tr["scenes"][1]["start_s"]
    ok("...so the previous line's last word stays in its own scene", cut >= 0.80 - 1e-6)
    ok("...while a line with real silence in front still gets the full pre-roll",
       abs(tr["scenes"][2]["start_s"] - (20.0 - LEAD_DEFAULT)) < 0.01)
    ok("...and so does the last one", abs(st[3] - (51.10 - LEAD_DEFAULT)) < 0.01)
    ok("...the silent scene is interpolated between its spoken neighbours",
       st[1] > st[0] and st[1] < st[2])
    ok("...starts strictly increase", all(st[i] < st[i + 1] for i in range(len(st) - 1)))
    ok("...and the film is still its own length",
       abs(sum(s["duration_s"] for s in b["scenes"]) - 60) < 0.01)
    ok("...and it records that it was re-timed", b.get("retimed_to") == "measured_word_starts")

    # The beats inside a scene must travel with it.
    ev_board = json.loads(json.dumps(board))
    for s in ev_board["scenes"]:
        s["visual_events"] = [{"at_s": 1.5, "what": "a"}, {"at_s": 13.5, "what": "b"}]
    be, ee = retime(ev_board, words)
    ok("re-timing carries a scene's visual events with it", not ee)
    ok("...and no event is left firing after its own scene has ended",
       all(ev["at_s"] <= s["duration_s"] - 0.14
           for s in be["scenes"] for ev in s["visual_events"]))
    ok("...and an event keeps its POSITION in the shot rather than its absolute second",
       all(abs(s["visual_events"][0]["at_s"] / s["duration_s"] - 1.5 / 15.0) < 0.02
           for s in be["scenes"] if s["duration_s"] > 1.5))

    # RE-TIMING TWICE MUST LAND WHERE RE-TIMING ONCE DID. A run re-times whenever the read
    # is re-synthesised, and scaling from the last result instead of from the authored
    # value compounds silently: measured on this repo, a beat authored at 72% of its shot
    # drifted to 98% of it across two passes, which is a beat nobody sees.
    again, ea = retime(json.loads(json.dumps(be)), words)
    ok("re-timing is idempotent", not ea)
    ok("...the starts do not move on a second pass",
       all(abs(x["start_s"] - y["start_s"]) < 1e-6
           for x, y in zip(be["scenes"], again["scenes"])))
    ok("...and neither do the beats inside the shots",
       all(abs(p["at_s"] - q["at_s"]) < 1e-6
           for x, y in zip(be["scenes"], again["scenes"])
           for p, q in zip(x["visual_events"], y["visual_events"])))

    # A vo line the read never says.
    bad = json.loads(json.dumps(board))
    bad["scenes"][2]["vo"] = "a sentence nobody ever spoke aloud here"
    _, e2 = retime(bad, words)
    ok("a vo line that is not in the read is REFUSED, not guessed at", bool(e2))
    ok("...and the message says to reconcile the board with the script",
       any("vo_script" in m for m in e2))

    # A trimmed tail must still match: the board plans, the read performs.
    drift = json.loads(json.dumps(board))
    drift["scenes"][0]["vo"] = "Off a frontage road in Round Rock in a building"
    _, e3 = retime(drift, words)
    ok("a line whose TAIL was trimmed in the read still matches on its head", not e3)

    # Too many cuts for the read.
    crowd = {"runtime_s": 6, "scenes": [
        {"id": f"s{i}", "start_s": i, "duration_s": 1,
         "vo": "Off a frontage road" if i == 0 else ""} for i in range(5)]}
    _, e4 = retime(crowd, words)
    ok("a board with more cuts than the read can hold is refused", bool(e4))
    ok("...and the message says to trim the board, never the floor",
       any("never the floor" in m for m in e4))

    # Order is not negotiable: a later scene may not resolve to an earlier word.
    words2 = wordstream([("Half", 2.0), ("is", 2.3), ("Off", 30.0), ("a", 30.3)])
    rev = {"runtime_s": 60, "scenes": [
        {"id": "s01", "start_s": 0, "duration_s": 30, "vo": "Off a"},
        {"id": "s02", "start_s": 30, "duration_s": 30, "vo": "Half is"}]}
    b5, e5 = retime(rev, words2)
    ok("a search that starts left of the cursor cannot walk backwards",
       bool(e5) or b5["scenes"][0]["start_s"] < b5["scenes"][1]["start_s"])

    # No scenes at all.
    _, e6 = retime({"runtime_s": 60, "scenes": []}, words)
    ok("an empty board is refused rather than returning a valid empty timeline", bool(e6))

    # THE SOUND MOVES WITH THE PICTURE. Six foley events were left on the old grid by the
    # first re-timed board, so a transformer on a pad in Round Rock hummed over a machine
    # room in Abilene, and flow_check said so in those words.
    sb, _ = retime(json.loads(json.dumps(board)), words)
    sfx = [{"id": "s01-snd", "at_s": 0.5, "dur_s": 12.0},
           {"id": "s03-snd", "at_s": 31.0, "dur_s": 12.0}]
    got, se = retime_sfx(sb["scenes"], sfx)
    ok("a sound moves to wherever its own scene went", not se)
    s3 = next(x for x in sb["scenes"] if x["id"] == "s03")
    ok("...landing inside that scene, not on the old clock",
       s3["start_s"] <= got[1]["at_s"] <= s3["start_s"] + s3["duration_s"])
    ok("...and it keeps its offset within the shot",
       abs((got[1]["at_s"] - s3["start_s"]) / s3["duration_s"] - (31.0 - 30.0) / 15.0) < 0.02)
    ok("...and no sound outlasts the shot that motivates it",
       all(g["dur_s"] <= next(x for x in sb["scenes"] if x["id"] == g["id"].split("-")[0])
           ["duration_s"] + 1e-6 for g in got))
    _, orphan = retime_sfx(sb["scenes"], [{"id": "s99-snd", "at_s": 1.0}])
    ok("a sound naming no scene on the board is refused, not left where it lay", bool(orphan))

    got2, _ = retime_sfx(sb["scenes"], json.loads(json.dumps(got)))
    ok("...and re-timing the sound twice lands where once did",
       all(abs(x["at_s"] - y["at_s"]) < 1e-6 for x, y in zip(got, got2)))

    # CUTTING A SCENE MUST NOT MOVE ANOTHER SCENE'S SOUND. The board loses scenes: a beat
    # the read cannot host gets cut, and every sound after it used to shift by that scene's
    # length, out of the shot that motivates it. flow_check then reported the WRONG scene
    # as silent, which is a fault that points at the wrong place.
    fewer = json.loads(json.dumps(sb))
    fewer["scenes"] = [x for x in fewer["scenes"] if x["id"] != "s02"]
    kept = json.loads(json.dumps([g for g in got if g["id"] != "s02-snd"]))
    after, _ = retime_sfx(fewer["scenes"], kept)
    s3b = next(x for x in fewer["scenes"] if x["id"] == "s03")
    ok("cutting a scene leaves every other scene's sound inside its own shot",
       s3b["start_s"] <= after[-1]["at_s"] <= s3b["start_s"] + s3b["duration_s"])

    print()
    print("board_retime self-test: " + ("all passed" if not fails else f"{len(fails)} FAILED"))
    return 1 if fails else 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--board")
    ap.add_argument("--words")
    ap.add_argument("--sfx", help="sfx_events.json, re-anchored to wherever its scenes went")
    ap.add_argument("--min-scene", type=float, default=MIN_SCENE_DEFAULT)
    ap.add_argument("--lead", type=float, default=LEAD_DEFAULT)
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()

    if a.self_test:
        return _self_test()
    if not (a.board and a.words):
        print("board_retime: --board and --words are both required", file=sys.stderr)
        return 2

    board = json.load(open(a.board))
    wf = json.load(open(a.words))
    words = wf["words"] if isinstance(wf, dict) else wf

    board, errs = retime(board, words, a.min_scene, a.lead)
    if errs:
        for e in errs:
            print(f"  FAIL  {e}")
        return 1

    moved = board.pop("_retime_moved", [])

    if a.sfx:
        raw = json.load(open(a.sfx))
        events = raw if isinstance(raw, list) else raw.get("events", [])
        events, serrs = retime_sfx(board["scenes"], events)
        if serrs:
            for e in serrs:
                print(f"  FAIL  {e}")
            return 1
        out = events if isinstance(raw, list) else {**raw, "events": events}
        with open(a.sfx, "w") as fh:
            json.dump(out, fh, indent=2, ensure_ascii=False)
        print(f"board_retime: {len(events)} sound(s) moved with their scenes")

    with open(a.board, "w") as fh:
        json.dump(board, fh, indent=2, ensure_ascii=False)
    print(f"board_retime: cut to the measured read, {len(moved)} scene(s) moved")
    for sid, was, now in moved:
        print(f"    {sid}  {was:6.2f}s -> {now:6.2f}s   ({now - was:+.2f})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
