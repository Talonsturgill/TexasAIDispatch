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
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
AXES_FILE = REPO / "config" / "composition_axes.yaml"
HISTORY = REPO / "ledger" / "dispatch_history.json"

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


def load_rule() -> dict:
    """The divergence rule, READ from config. Never restated here."""
    try:
        import yaml
        return yaml.safe_load(AXES_FILE.read_text(encoding="utf-8")) or {}
    except Exception:                                                   # noqa: BLE001
        return {}


def load_history() -> list[dict]:
    try:
        return json.loads(HISTORY.read_text(encoding="utf-8")).get("dispatches", [])
    except (OSError, json.JSONDecodeError):
        return []


def check_divergence(board: dict, history: list[dict], cfg: dict) -> list[str]:
    """Is this a DIFFERENT FILM from the last few, or the same one wearing a costume?

    THE DEFECT. The sibling shipped "a salmon video that looked just like the damn beluga video",
    and its free-text archetype label never caught it because both read as "single-hero portrait".
    A NEW SUBJECT IS NOT A NEW COMPOSITION.

    The first version of THIS file checked divergence between scenes inside one board and had no
    memory at all, so Dispatch 7 could be a shot-for-shot re-skin of Dispatch 6 and every gate
    stayed green. Scene-to-scene divergence is necessary and it is not this.
    """
    rule = (cfg.get("rule") or {})
    axes = list((cfg.get("axes") or {}).keys())
    if not axes:
        return [f"cannot read the composition axes from {AXES_FILE.relative_to(REPO)}. The "
                f"divergence rule lives there and nowhere else, so an unreadable file is a stop."]

    p: list[str] = []
    fp = board.get("fingerprint") or {}

    missing = [a for a in axes if not str(fp.get(a) or "").strip()]
    if missing:
        p.append(f"the fingerprint does not declare {', '.join(missing)}. All {len(axes)} axes are "
                 f"required, because an axis left blank is an axis that can never differ.")

    if rule.get("require_derived_from_scratch") and board.get("derived_from") != "scratch":
        p.append(f"derived_from is {board.get('derived_from')!r}. A scene copied from a prior file "
                 f"and re-skinned is the banned shortcut, and this gate refuses a board that admits "
                 f"to it. Design the composition from a blank page for THIS story.")

    note = str(board.get("divergence_note") or "")
    need = int(rule.get("divergence_note_min_chars") or 0)
    if len(note) < need:
        p.append(f"divergence_note is {len(note)} characters against a {need} minimum. Writing the "
                 f"sentence is what forces the thinking, and a run that cannot say how this differs "
                 f"has not designed anything.")

    if not history:
        return p                                    # nothing to diverge FROM yet, which is fine

    # 1) enough axes different from each of the last N
    n = int(rule.get("compare_last_n") or 2)
    need_diff = int(rule.get("min_diff_axes") or 4)
    for prev in history[-n:]:
        pf = prev.get("fingerprint") or {}
        if not pf:
            continue
        differ = [a for a in axes if str(fp.get(a) or "") != str(pf.get(a) or "")]
        if len(differ) < need_diff:
            same = [a for a in axes if a not in differ]
            p.append(f"only {len(differ)} of {len(axes)} axes differ from {prev.get('date')} "
                     f"\"{prev.get('topic', '')[:44]}\", against a minimum of {need_diff}. "
                     f"Identical on {', '.join(same)}. That is the same film wearing a costume.")

    # 2) THE SPATIAL SIGNATURE, which is the specific thing that made the salmon a clone
    sig_axes = rule.get("signature_axes") or []
    win = int(rule.get("signature_window") or 4)
    if sig_axes:
        mine = tuple(str(fp.get(a) or "") for a in sig_axes)
        for prev in history[-win:]:
            pf = prev.get("fingerprint") or {}
            if pf and tuple(str(pf.get(a) or "") for a in sig_axes) == mine:
                p.append(f"the spatial signature ({', '.join(sig_axes)}) = {mine} is identical to "
                         f"{prev.get('date')}. This exact triple is what made the sibling's salmon "
                         f"a clone of its beluga. Change where the camera stands, where the "
                         f"information sits, or which way the picture moves.")
                break

    # 3) the palette
    pwin = int(rule.get("palette_window") or 2)
    mine_pal = re.sub(r"[^a-z0-9]+", " ", str(fp.get("palette") or "").lower()).strip()
    for prev in history[-pwin:]:
        prev_pal = re.sub(r"[^a-z0-9]+", " ", str(
            (prev.get("fingerprint") or {}).get("palette") or prev.get("palette") or "").lower()
        ).strip()
        if mine_pal and prev_pal and mine_pal == prev_pal:
            p.append(f"the palette {mine_pal!r} is the one used on {prev.get('date')}. Two films "
                     f"in the same colour world read as one film in two parts.")
            break
    return p


def check_beat_mix(beat: str, history: list[dict], cfg: dict) -> list[str]:
    """Is this show still about the application layer, or has it drifted back to filings?

    knowledge/texas/APPLICATIONS.md is emphatic that the default Dispatch is somebody using a tool
    and that a decision is context. Left alone a routine drifts toward whatever is easiest to
    source, and what is easiest to source is a filing. So the mix is checked the same way the
    pictures are, over a rolling window.
    """
    mix = cfg.get("beat_mix") or {}
    if not mix or not beat:
        return []
    app = set(mix.get("application_beats") or [])
    ctx = set(mix.get("context_beats") or [])
    if beat not in app | ctx:
        return [f"beat {beat!r} is not in config/composition_axes.yaml's beat_mix. Either it is a "
                f"typo or the mix needs a decision about it."]
    win = int(mix.get("window") or 7)
    recent = [e.get("beat") for e in history[-(win - 1):] if e.get("beat")] + [beat]
    p: list[str] = []
    share = sum(1 for b in recent if b in app) / max(1, len(recent))
    floor = float(mix.get("min_application_share") or 0)
    if share < floor:
        p.append(f"only {share:.0%} of the last {len(recent)} Dispatches lead with an application "
                 f"beat, against a {floor:.0%} floor. This show is about the application layer and "
                 f"it has drifted back toward the record. The docket next door already covers that.")
    cap = int(mix.get("max_same_beat") or 99)
    same = recent.count(beat)
    if same > cap:
        p.append(f"{beat!r} would lead {same} times in the last {len(recent)}, against a cap of "
                 f"{cap}. Variety is about the subject as well as the picture.")
    return p


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

    # ---------------------------------------------------------------- THE VARIETY ENGINE
    #
    # These exercise the CROSS-RUN memory, which is the part that did not exist at all
    # until the maintainer asked where the variety engine was. Everything above this
    # line checks one board against itself, and a board can be internally varied and
    # still be yesterday's film with a new hero in it.
    cfg = load_rule()
    ok("the axes and the rule are readable from config",
       bool(cfg.get("axes")) and bool(cfg.get("rule")),
       f"cannot read {AXES_FILE}")
    axes = list((cfg.get("axes") or {}).keys())
    ok("...and there are enough axes for the min_diff rule to be satisfiable",
       len(axes) >= int((cfg.get("rule") or {}).get("min_diff_axes") or 0),
       f"{len(axes)} axes against a min_diff of {(cfg.get('rule') or {}).get('min_diff_axes')}")

    def fp(**kw):
        base = {a: f"{a}-A" for a in axes}
        base.update(kw)
        return base

    def bd(**kw):
        b = {"derived_from": "scratch", "divergence_note": "x" * 200, "fingerprint": fp()}
        b.update(kw)
        return b

    hist = [{"date": "2026-08-10", "topic": "yesterday", "fingerprint": fp()}]
    ok("an IDENTICAL fingerprint is refused",
       any("wearing a costume" in x for x in check_divergence(bd(), hist, cfg)),
       str(check_divergence(bd(), hist, cfg)[:1]))

    # Change enough axes and it passes. This is the one that proves the gate can go GREEN,
    # which matters as much as proving it can go red: a gate that always fails gets ignored.
    #
    # The palette has to be among what changes, and that is the RULE rather than a fixture
    # convenience: the first version of this test varied the four cheapest axes and left the
    # colour world alone, and the palette rule correctly refused it. A different film in
    # yesterday's palette reads as one film in two parts.
    need = int(cfg["rule"]["min_diff_axes"])
    changed = {a: f"{a}-B" for a in axes[:need]}
    changed["palette"] = "a genuinely different colour world"
    ok("...and changing enough axes, palette included, clears it",
       not check_divergence(bd(fingerprint=fp(**changed)), hist, cfg),
       str(check_divergence(bd(fingerprint=fp(**changed)), hist, cfg)))

    # THE SALMON AND THE BELUGA. Differ on plenty of axes but keep the spatial triple.
    sig = cfg["rule"]["signature_axes"]
    lots = {a: f"{a}-B" for a in axes if a not in sig}
    r = check_divergence(bd(fingerprint=fp(**lots)), hist, cfg)
    ok("a board that differs everywhere EXCEPT the spatial signature is still refused",
       any("spatial signature" in x for x in r), str(r))
    ok("...and the message names the triple that decided it",
       any(all(a in x for a in sig) for x in r if "spatial signature" in x))

    # The palette.
    ph = [{"date": "2026-08-10", "topic": "y", "fingerprint": fp(palette="caliche + sodium vapour")}]
    pb = bd(fingerprint=fp(**{a: f"{a}-B" for a in axes[:need]}, palette="Caliche + Sodium Vapour"))
    ok("the same palette in different case is still the same palette",
       any("colour world" in x for x in check_divergence(pb, ph, cfg)),
       str(check_divergence(pb, ph, cfg)))

    ok("a board copied from a prior file is refused",
       any("banned shortcut" in x for x in check_divergence(bd(derived_from="last week"), [], cfg)))
    ok("a stub divergence note is refused",
       any("has not designed anything" in x
           for x in check_divergence(bd(divergence_note="different"), [], cfg)))
    miss = check_divergence(bd(fingerprint={axes[0]: "x"}), [], cfg)
    ok("a fingerprint missing axes is refused",
       any("can never differ" in x for x in miss), str(miss[:1]))
    ok("the FIRST ever Dispatch has nothing to diverge from and is allowed",
       not check_divergence(bd(), [], cfg))

    # ---- THE BEAT MIX, which is variety of SUBJECT rather than of picture
    mix = cfg.get("beat_mix") or {}
    app = (mix.get("application_beats") or ["oilfield"])[0]
    ctx = (mix.get("context_beats") or ["record-and-rule"])[0]
    drift = [{"date": f"2026-08-0{i}", "beat": ctx} for i in range(1, 7)]
    r = check_beat_mix(ctx, drift, cfg)
    ok("a show that has drifted back to filings is refused",
       any("drifted back toward the record" in x for x in r), str(r))
    ok("...and a run led by an application beat is fine",
       not any("drifted" in x for x in check_beat_mix(
           app, [{"date": "2026-08-0" + str(i), "beat": app} for i in range(1, 5)], cfg)))
    ok("...though the SAME application beat too many times is still refused",
       any("Variety is about the subject" in x for x in check_beat_mix(
           app, [{"date": f"2026-08-0{i}", "beat": app} for i in range(1, 7)], cfg)))
    ok("a beat that is not in the mix at all is refused",
       any("not in config" in x for x in check_beat_mix("vibes", [], cfg)))

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
    cfg = load_rule()
    history = load_history()
    problems = check(board)
    problems += check_divergence(board, history, cfg)
    problems += check_beat_mix(str(board.get("beat") or ""), history, cfg)
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
