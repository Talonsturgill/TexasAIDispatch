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

  AND THE ONE THAT MADE EVERY RULE ABOVE ORNAMENTAL. The board this gated and the
  props Remotion rendered were TWO DIFFERENT DOCUMENTS. This file read scenes whose
  `planes` were the labels a director writes -- sky, far ridge, mid, near band, hero
  -- and `Dispatch.tsx` renders scenes whose `planes` are `{z, items}` carrying named
  components. Nothing converted one into the other and nothing compared them, so
  every divergence rule, every fingerprint and every no-two-films-alike guarantee was
  being enforced against a document THAT WAS NOT THE FILM. A board could pass Gate 0
  and stage nothing at all.

  THE BOARD IS THE PROPS NOW. One document, gated here and handed to Remotion
  unchanged. A plane carries its director's `label` and its `z` and its `items`, and
  the staging half is checked as hard as the planning half: every `kind` is a name
  the registry has, the elements made of data have their data, the planes run far to
  near, nothing is sited where it does not belong, and a scene that stages nothing is
  refused. `Dispatch.tsx` throws on an unknown name at render time; this refuses it an
  hour earlier, which is the whole argument for Gate 0.

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
#
# READ THE RUBRIC'S WORDING, because this gate did not. The hard fail is "a held slide
# longer than five seconds WITH NO MOTION, EMOTION OR REVELATION", and this refused on
# duration alone while printing that sentence back as its reason. The two are not the same
# rule and the difference is not academic: once the board is re-timed to the measured read,
# a scene is as long as its own sentence takes to say, and the film's closing line takes
# 5.1 seconds. Under duration-alone there is no board that both marries the words to the
# pictures and passes, so the gate was quietly forcing a choice the rubric never asked for.
#
# A scene over the ceiling now has to EARN it: a composed camera move, and a beat landing
# in its back half so the shot is not dead in its tail. That is what "with no motion" means
# and it is checkable. Nothing earns its way past the absolute ceiling.
MAX_SCENE_S = 5.0
HARD_MAX_SCENE_S = 9.5

# A long scene's last beat must land at least this far through it. A shot whose events all
# fire in the first third and then holds for six seconds is the held slide the rule is for,
# whatever its camera is doing.
LATE_BEAT_FRACTION = 0.55

# Motifs that are retired, from knowledge/texas/CULTURE.md. Named here so a board
# carrying one is refused before it is drawn rather than after.
RETIRED = {"six flags", "confederate", "loteria", "lotería", "calavera", "headdress",
           "wood type", "rope border", "cowhide"}


SITING_FILE = REPO / "config" / "siting.yaml"


def plane_signature(planes: list) -> tuple:
    """A hashable, comparable shape for one scene's plane stack.

    It carries the director's LABEL and the KINDS staged on each plane, which makes
    it a stronger divergence signal than the labels alone: two scenes that put the
    same components on the same planes are the same shot whatever the planes are
    called. It also has to be hashable, because the divergence rule puts these in a
    set, and a list of dicts is not -- which is how unifying the two board shapes
    would have crashed this file rather than weakening it.
    """
    out = []
    for pl in planes:
        if isinstance(pl, dict):
            kinds = tuple(sorted(str(i.get("kind", "")) for i in (pl.get("items") or [])))
            out.append((str(pl.get("label", "")), kinds))
        else:
            out.append((str(pl), ()))
    return tuple(out)


def signature(scene: dict) -> tuple:
    """What a scene actually looks like, ignoring the words used to describe it.

    Two scenes with the same move, the same plane stack and the same hero are the
    same shot however differently their prose reads. This is the whole reason the
    divergence check is not a set of camera_strategy strings.
    """
    return (scene.get("camera_strategy", ""),
            plane_signature(scene.get("planes", []) or []),
            scene.get("hero", ""))


def registry_facts() -> tuple[set[str], dict[str, list[str]]]:
    """The placeable names and their required props, READ FROM THE REGISTRY.

    Never restated here. `registry.tsx` is where a name becomes a component, so it
    is the only place that knows what the names are, and a second list in this file
    would be right on the day it was written and wrong on the next one.
    """
    src = (REPO / "video-engine" / "src" / "lib" / "registry.tsx").read_text(encoding="utf-8")
    m = re.search(r"export const ELEMENTS: Record<string, React\.FC<any>> = \{(.*?)\n\};",
                  src, re.S)
    if not m:
        raise ValueError("registry.tsx has no ELEMENTS map in the shape this reads. "
                         "Gate 0 cannot check a board's element names without it.")
    names = set(re.findall(r"^\s*([A-Za-z][A-Za-z0-9]*):", m.group(1), re.M))

    req: dict[str, list[str]] = {}
    r = re.search(r"export const REQUIRED: Record<string, string\[\]> = \{(.*?)\n\};",
                  src, re.S)
    if r:
        for name, body in re.findall(r"^\s*([A-Za-z][A-Za-z0-9]*):\s*\[(.*?)\],",
                                     r.group(1), re.M):
            req[name] = re.findall(r"'([^']+)'", body)
    return names, req


def staging_problems(sid: str, scene: dict, planes: list, names: set[str],
                     required: dict[str, list[str]], siting: dict) -> list[str]:
    """THE HALF THAT WAS NEVER CHECKED, because it lived in a different document.

    Everything here is a fault `Dispatch.tsx` would hit at RENDER time with the run's
    research, script and voice already paid for. Gate 0 is the cheap place, so it is
    checked here instead.
    """
    out: list[str] = []
    staged = 0
    zs: list[float] = []

    for pi, pl in enumerate(planes):
        where = f"scene {sid} plane {pi}"
        if not isinstance(pl, dict):
            out.append(
                f"{where}: a plane is {pl!r}, a bare label. A plane is `{{z, label, items}}` "
                f"now: THE BOARD IS THE PROPS, so a plane that carries no z and no items "
                f"cannot be rendered. This shape used to pass here and produce an empty "
                f"film, which is the fault that made every other rule in this file "
                f"ornamental.")
            continue
        if not isinstance(pl.get("z"), (int, float)):
            out.append(f"{where}: no numeric z. Depth is what the camera moves through and "
                       f"a plane without one has no place in the stack.")
        else:
            zs.append(float(pl["z"]))
        if not str(pl.get("label") or "").strip():
            out.append(f"{where}: no label. The label is what a director boards and what the "
                       f"divergence signature reads, so a stack of unnamed planes reads as "
                       f"the same stack every time.")

        items = pl.get("items")
        if items is None:
            out.append(f"{where}: no items key at all. An empty list is a deliberate empty "
                       f"plane and is fine; a missing key is a plane nobody finished.")
            continue
        if not isinstance(items, list):
            out.append(f"{where}: items is {type(items).__name__}, not a list.")
            continue

        for ii, it in enumerate(items):
            at = f"scene {sid} plane {pi} item {ii}"
            if not isinstance(it, dict):
                out.append(f"{at}: not an object.")
                continue
            kind = str(it.get("kind") or "")
            if not kind:
                out.append(f"{at}: no kind.")
                continue
            staged += 1
            if kind not in names:
                near = sorted(n for n in names if n[:4].lower() == kind[:4].lower())
                out.append(
                    f"{at}: \"{kind}\" is not a name the registry has, so the render throws "
                    f"here with the whole run already paid for."
                    + (f" Did you mean {', '.join(near[:4])}?" if near else
                       " Add it to ELEMENTS or stage something that exists."))
                continue
            need = required.get(kind, [])
            bag = {**it, **(it.get("props") or {})}
            missing = [k for k in need if bag.get(k) is None]
            if missing:
                out.append(
                    f"{at}: {kind} is missing {', '.join(missing)}. Without "
                    f"{'them' if len(missing) > 1 else 'it'} the element computes NaN geometry "
                    f"and draws NOTHING, which renders without error and loses the plane "
                    f"silently. Put {'them' if len(missing) > 1 else 'it'} in \"props\".")
            rule = siting.get(kind)
            if rule and scene.get("region") in set(rule.get("regions") or []):
                out.append(
                    f"{at}: {kind} in {scene.get('region')}. {str(rule.get('why', '')).strip()} "
                    f"A Texan reads a mis-sited machine as fast as a mis-sited animal.")

    if zs and zs != sorted(zs, reverse=True):
        out.append(f"scene {sid}: the planes are not ordered far to near ({zs}). They are drawn "
                   f"in board order, so a shuffled stack puts the foreground behind the sky.")
    if len(set(zs)) != len(zs):
        out.append(f"scene {sid}: two planes share a z ({zs}). Coplanar layers have no parallax "
                   f"between them, which is the one thing the depth was for.")
    if staged == 0:
        out.append(f"scene {sid}: stages nothing. Every plane is empty, so this renders as a "
                   f"biome with a caption over it and reports success.")
    return out


def load_siting() -> dict[str, dict]:
    """Where a machine does not belong. Absent file means no siting rule, not a pass
    dressed as one, so its absence is reported by the caller rather than swallowed."""
    if not SITING_FILE.exists():
        raise FileNotFoundError(f"no siting rules at {SITING_FILE}")
    import yaml
    data = yaml.safe_load(SITING_FILE.read_text(encoding="utf-8")) or {}
    return data.get("never_in", {}) or {}


def load_rule() -> dict:
    """The divergence rule, READ from config. Never restated here."""
    try:
        import yaml
        return yaml.safe_load(AXES_FILE.read_text(encoding="utf-8")) or {}
    except Exception:                                                   # noqa: BLE001
        return {}


def load_history() -> tuple[list[dict], str | None]:
    """(entries, error). An UNREADABLE ledger is an error, never an empty history.

    The first version returned [] for both, and check_divergence returns early on an empty
    history with the comment "nothing to diverge FROM yet, which is fine". That is true for the
    very first Dispatch and false for a read failure, and the two were indistinguishable to the
    caller: one trailing comma from a hand-edit disabled the entire cross-run variety engine and
    the run shipped a shot-for-shot re-skin of yesterday with Gate 0 green.

    load_rule() already got this right by returning an explicit stop, so the asymmetry lived
    inside one file.
    """
    if not HISTORY.exists():
        return [], None                      # a genuinely fresh repo, which is fine
    try:
        return json.loads(HISTORY.read_text(encoding="utf-8")).get("dispatches", []), None
    except (OSError, json.JSONDecodeError) as exc:
        try:
            where = HISTORY.relative_to(REPO)
        except ValueError:
            where = HISTORY                  # a test may point this outside the repo
        return [], (f"cannot read {where}: {exc}. The variety engine's whole "
                    f"memory lives there, so an unreadable ledger silently turns off every "
                    f"cross-run check. That is a stop, not an empty history.")


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
    if not mix:
        return ["config/composition_axes.yaml declares no beat_mix, so the application-layer "
                "drift rule is running on nothing."]
    if not beat:
        return ["the board declares no top-level `beat`, so the beat-mix rule cannot run at all. "
                "Omitting the field turned off the entire 'has this show drifted back to filings' "
                "check while Gate 0 reported clean. Name the beat this Dispatch leads with."]
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

    # The registry and the siting rules are READ, never restated. A failure to read
    # either is a STOP rather than a skip: a Gate 0 that quietly drops half its rules
    # because a file moved is the fail-open this repo keeps finding.
    try:
        names, required = registry_facts()
    except (OSError, ValueError) as exc:
        return [f"cannot read the registry: {exc}. Gate 0 cannot check what a board stages "
                f"without it, and running the rest would report a pass on half the rules."]
    try:
        siting = load_siting()
    except (OSError, ImportError) as exc:
        return [f"cannot read config/siting.yaml: {exc}. Same reason: a missing rule file is "
                f"a stop, not a silent pass."]

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
        p += staging_problems(sid, s, planes, names, required, siting)
        if s.get("beat") not in CURRENCIES:
            p.append(f"scene {sid}: beat {s.get('beat')!r} is not one of "
                     f"{', '.join(sorted(CURRENCIES))}. Every five seconds pays in one of them.")
        dur = float(s.get("duration_s") or 0)
        if dur <= 0:
            p.append(f"scene {sid}: no duration")
        elif dur > MAX_SCENE_S + 0.001:
            moves = s.get("camera_strategy") in MOVES
            beats = [float(e.get("at_s") or 0) for e in (s.get("visual_events") or [])]
            pays_late = any(t >= dur * LATE_BEAT_FRACTION for t in beats)
            if dur > HARD_MAX_SCENE_S + 0.001:
                p.append(f"scene {sid}: {dur:.1f}s is past the {HARD_MAX_SCENE_S:.1f}s "
                         f"ceiling, which nothing earns its way past. Split it.")
            elif not moves:
                p.append(f"scene {sid}: {dur:.1f}s is longer than {MAX_SCENE_S:.0f}s and its "
                         f"camera is {s.get('camera_strategy')!r}, which is not a composed "
                         f"move. That is the held slide the rubric hard-fails. Split it or "
                         f"make it move.")
            elif not pays_late:
                last = max(beats) if beats else 0.0
                p.append(f"scene {sid}: {dur:.1f}s is longer than {MAX_SCENE_S:.0f}s and its "
                         f"last beat lands at {last:.1f}s, in the first "
                         f"{LATE_BEAT_FRACTION * 100:.0f}% of it. The shot is dead in its "
                         f"tail, which is a held slide however the camera is moving. Give it "
                         f"a beat past {dur * LATE_BEAT_FRACTION:.1f}s or split it.")
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

    def planes(i):
        """A real staged stack, because THE BOARD IS THE PROPS.

        The fixture used to be `["sky", "ridge", "mid", "near", "hero"]` -- the shape
        this file gated and Remotion could not render. Keeping it here would have
        meant the self-test proving the checker works on a document the product does
        not use, which is the same fault one layer up.
        """
        return [
            {"z": 900, "label": "sky", "items": [
                {"kind": "turkeyVulture", "x": 700, "y": 300, "scale": 0.5}]},
            {"z": 600, "label": "ridge", "items": [
                {"kind": "windTurbine", "x": 900, "y": 950, "scale": 0.6}]},
            {"z": 380, "label": "mid", "items": [
                {"kind": "centrePivot", "x": 60, "y": 1020, "scale": 1.0},
                {"kind": "soilProbe", "x": 520, "y": 1080, "scale": 1.0}]},
            {"z": 180, "label": "near", "items": [
                {"kind": "person", "x": 340, "y": 1400, "scale": 0.8,
                 "props": {"cast": "rancher", "pose": "hands-hips"}}]},
            {"z": 60, "label": "hero", "items": [
                {"kind": "mesquite", "x": -80, "y": 2040, "scale": 5.0,
                 "props": {"seedNote": i}}]},
        ]

    def scene(i, **kw):
        s = {"id": f"s{i}", "start_s": (i - 1) * 5.0, "duration_s": 5.0,
             "region": "high_plains", "county": "Taylor", "camera_strategy": "dollyThrough",
             "planes": planes(i), "hero": f"h{i}",
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

    # THE HELD SLIDE RULE, broken on purpose from four directions. Duration alone is not
    # the fault and never was: the rubric names duration PLUS stillness.
    held = board()
    held["scenes"][2]["duration_s"] = 7.0
    held["scenes"][2]["camera_strategy"] = "hold"
    ok("a scene held past five seconds with no composed move is refused",
       any("held slide" in x for x in check(held)))

    dead = board()
    dead["scenes"][2]["duration_s"] = 7.0
    dead["scenes"][2]["visual_events"] = [{"at_s": 0.6, "what": "a"}, {"at_s": 1.8, "what": "b"}]
    ok("...and so is one whose beats all fire in its first third, however it moves",
       any("dead in its tail" in x for x in check(dead)))
    ok("...and the message names the second the next beat has to beat",
       any("Give it a beat past" in x for x in check(dead)))

    earned = board()
    earned["scenes"][2]["duration_s"] = 7.0
    earned["scenes"][2]["visual_events"] = [{"at_s": 1.4, "what": "a"}, {"at_s": 5.2, "what": "b"}]
    ok("...but a long scene with a composed move and a beat in its back half is allowed",
       not any("held slide" in x or "dead in its tail" in x for x in check(earned)))

    absurd = board()
    absurd["scenes"][2]["duration_s"] = 14.0
    absurd["scenes"][2]["visual_events"] = [{"at_s": 1.0, "what": "a"}, {"at_s": 12.0, "what": "b"}]
    ok("...and nothing earns its way past the absolute ceiling",
       any("ceiling, which nothing earns" in x for x in check(absurd)))

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

    # ------------------------------------------------------------- THE BOARD IS THE PROPS
    #
    # Everything below here checks the STAGING half, which used to live in a second
    # document nothing gated. Each case is a fault Dispatch.tsx would hit at render
    # time with the run's research, script and voice already paid for.
    names, required = registry_facts()
    ok("the registry's names are READ rather than restated here",
       "centrePivot" in names and "pumpjack" in names and len(names) > 40, f"{len(names)}")
    ok("...and so are the props the data-driven elements need",
       required.get("sweep") == ["x", "y", "w", "h", "p"], str(required.get("sweep")))
    ok("the siting rules are readable",
       "centrePivot" in load_siting(), str(sorted(load_siting())))

    old_shape = board()
    old_shape["scenes"][2]["planes"] = ["sky", "ridge", "mid", "near", "hero"]
    ok("THE OLD PLANNING-ONLY BOARD IS REFUSED, because it renders an empty film",
       any("a bare label" in x for x in check(old_shape)))

    ghost = board()
    ghost["scenes"][1]["planes"][2]["items"][0]["kind"] = "windPivot"
    got = check(ghost)
    ok("a kind the registry does not have is refused BEFORE the render",
       any("is not a name the registry has" in x for x in got))
    ok("...and the message suggests what was meant",
       any("Did you mean" in x and "windTurbine" in x for x in got), str(got[:2]))

    bare = board()
    bare["scenes"][1]["planes"][2]["items"].append({"kind": "sweep", "x": 40, "y": 60})
    ok("an element made of data, staged without its data, is refused",
       any("missing w, h, p" in x for x in check(bare)), str(check(bare)[:2]))

    empty = board()
    for pl in empty["scenes"][3]["planes"]:
        pl["items"] = []
    ok("a scene that stages nothing is refused",
       any("stages nothing" in x for x in check(empty)))

    shuffled = board()
    shuffled["scenes"][1]["planes"][0]["z"] = 10
    ok("planes out of far-to-near order are refused",
       any("not ordered far to near" in x for x in check(shuffled)))

    coplanar = board()
    coplanar["scenes"][1]["planes"][1]["z"] = coplanar["scenes"][1]["planes"][0]["z"]
    ok("two planes at the same z are refused, because parallax was the point",
       any("share a z" in x for x in check(coplanar)))

    unlabelled = board()
    unlabelled["scenes"][1]["planes"][2]["label"] = ""
    ok("a plane with no label is refused", any("no label" in x for x in check(unlabelled)))

    # SITING. The same class of error as a pronghorn in the Piney Woods.
    mis = board()
    for s in mis["scenes"]:
        s["region"] = "gulf"
        s["county"] = "Chambers"
    got = check(mis)
    ok("a centre pivot in the Gulf marsh is refused",
       any("centrePivot in gulf" in x for x in got), str([g for g in got if "gulf" in g][:1]))
    ok("...and the refusal explains the geography rather than citing a rule number",
       any("rice under levee" in x for x in got))
    ok("...while the same pivot on the High Plains is fine",
       not any("centrePivot in" in x for x in check(board())))

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

    # ---- A CORRUPT LEDGER IS A STOP, NOT AN EMPTY HISTORY
    import tempfile as _tf
    import os as _os
    global HISTORY
    _real = HISTORY
    try:
        with _tf.TemporaryDirectory() as td:
            bad = Path(td) / "dispatch_history.json"
            bad.write_text('{"dispatches": [ , ]}', encoding="utf-8")
            HISTORY = bad
            entries, err = load_history()
            ok("a corrupt ledger returns an ERROR, not an empty history",
               entries == [] and err is not None, f"{entries} / {err}")
            ok("...and the message says the variety engine is off",
               bool(err) and "silently turns off" in err, str(err))
            good = Path(td) / "ok.json"
            good.write_text('{"dispatches": [{"date": "2026-08-10"}]}', encoding="utf-8")
            HISTORY = good
            ok("a readable ledger loads", load_history() == ([{"date": "2026-08-10"}], None))
            HISTORY = Path(td) / "absent.json"
            ok("a MISSING ledger is a fresh repo and is fine", load_history() == ([], None))
    finally:
        HISTORY = _real
    _os.environ.pop("_", None)

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
    ok("a board that declares NO beat is refused rather than skipped",
       any("cannot run at all" in x for x in check_beat_mix("", [], cfg)),
       str(check_beat_mix("", [], cfg)))
    ok("...and the message says omitting it turned the whole rule off",
       any("drifted back to filings" in x or "turned off" in x
           for x in check_beat_mix("", [], cfg)))

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
    history, hist_err = load_history()
    problems = check(board)
    if hist_err:
        problems.append(hist_err)
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
