#!/usr/bin/env python3
"""ship_gate.py — the rubric's hard fails, checked by a machine instead of promised.

WHY THIS EXISTS

`config/dispatch_rubric.yaml` lists seven hard fails. Until this file existed they
were a list a tired model read at the end of a long run and agreed with. Six of the
seven can be checked mechanically, so they are, and the seventh is named as the one
that cannot.

THE HARD FAILS, and what each is actually for.

  A NUMERAL THAT TRACES TO NOTHING. The compute-not-generate law: every numeral this
  project publishes is produced by code, from data, and can be recomputed. A model
  told the answer is 8,927 that writes 8,297 has made an error nothing downstream
  catches. So every numeral in the script and on every slide must appear in the
  authorised set the claims file carries.

  The tokeniser is the part that has been wrong before. A sibling's numeral lint used
  \\d{1,4} and read "2,600 streamlines" as the number 600, so the real value failed to
  match and a correct figure was reported as unauthorised. A numeral is ONE token
  including its thousands separators and its decimal part, or the check is worse than
  nothing because it teaches you to override it.

  A CAPTION BOUNDARY THAT DOES NOT TRACE TO THE AUDIO. Approximated, scaled or
  hand-shifted timings drift, and the drift is invisible in review because the
  reviewer already knows what the words say and reads the caption as correct. The
  rule enforced here is not the NAME of a method, which anybody can type: it is the
  EVIDENCE, the count of boundaries actually measured off the waveform. A
  words-per-second divider cannot produce that number however it labels itself.

  TIME-STRETCHED AUDIO. Banned outright. It produces the chipmunk-or-molasses
  artefact every viewer hears and cannot name, and the fix for a long read is always
  a shorter script.

  A REGION THAT DOES NOT MATCH THE COUNTY. The first law of drawing Texas. Checked
  against config/county_regions.json, which is DATA so a correction is a data change.
  An unknown county is RECORDED, not refused: refusing one would stop a run over a
  gap in a lookup table, which is a checker deciding it matters more than the film.

  A RETIRED MOTIF. Checked on the FINAL copy, not only on the board, because a motif
  can arrive after Gate 0 in a line of narration nobody re-read.

  A BRIMMED HAT ON A RIG FLOOR. A hard hat over an FR hood is the only correct
  headgear there, and a Stetson in that frame is a safety violation a Texan sees
  instantly. `headgearConflict()` guards the engine; this guards the board.

  A HELD SLIDE. Longer than five seconds with no motion, emotion or revelation.

THE ONE THAT CANNOT BE CHECKED HERE. "Would a Texan from that county believe the
person who drew this had been there." That is the panel's, and no script will ever
have an opinion about it.

THE BAR IS READ, NEVER QUOTED. If a report card is passed, its score is compared
against `rubric.ship_threshold` READ OUT OF THE RUBRIC. The sibling lost five panel
rounds to that number living in two places.

    ship_gate.py --board out/dispatch/storyboard.json --claims out/dispatch/claims.json \\
                 --script out/dispatch/vo_script.txt --captions out/dispatch/captions.json \\
                 --audio out/dispatch/audio.json --report out/dispatch/report_card.json
    ship_gate.py --self-test

Exit 0 clear to ship, 1 a hard fail, 2 the gate could not run.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
RUBRIC = REPO / "config" / "dispatch_rubric.yaml"
COUNTY_MAP = REPO / "config" / "county_regions.json"

# ONE token per numeral, thousands separators and decimal part included. The sibling's
# \d{1,4} split "2,600" into "2" and "600" and then reported the correct figure as
# unauthorised, which is the failure mode that gets a gate switched off.
NUMERAL = re.compile(r"\d[\d,]*(?:\.\d+)?")

# Words that mean a timing was not force-aligned, whatever the method field claims.
NOT_ALIGNED = {"approximate", "approximated", "estimate", "estimated", "scaled", "manual",
               "hand", "hand-shifted", "eyeballed", "guess", "interpolated"}

# Methods whose boundaries come off the waveform. `silence_anchored` is what
# vo_align.py produces here; `forced_alignment` is what a phoneme-level aligner would
# produce if one is ever available. Nothing else ships.
ACCEPTED_ALIGNMENT = {"forced_alignment", "silence_anchored"}

RETIRED = {"six flags", "confederate", "loteria", "lotería", "calavera", "headdress",
           "wood type", "rope border", "cowhide"}

BRIMMED = {"felt-hat", "straw-hat", "stetson", "cowboy hat", "brimmed"}

# Matched on WORD BOUNDARIES, and "unit" is gone.
#
# The first version tested these as bare substrings, so "community", "opportunity" and
# "immunity" all contained "unit" and a rancher outside the community hall in Bandera was
# reported as wearing a felt hat on a rig floor. That is a Hill Country scene this show is
# built to draw, stopped by a message that makes no sense to whoever reads it, which is
# GATE_LESSONS 11 exactly: a correct product reported as a violation is how a gate gets
# switched off. The token actually meant is "pumping unit".
HAZARD = {"rig floor", "rig-floor", "drill floor", "derrick", "workover", "wellhead",
          "pumping unit", "pump unit", "flowback", "frac", "wireline", "coiled tubing"}

MAX_SCENE_S = 5.0
CURRENCIES = {"motion", "emotion", "revelation"}


def numerals(text: str) -> set[str]:
    """Every numeral a reader would see, normalised so 8,927 and 8927 are one thing."""
    return {m.group(0).replace(",", "").rstrip(".") for m in NUMERAL.finditer(text or "")}


def authorised(claims: dict) -> set[str]:
    """Every numeral the claims file actually supports.

    Takes them from the claim VALUES, and from any explicit authorised list, and also
    from the rendered text of each claim, because a claim that says "8.9 gigawatts"
    authorises 8.9 whether or not somebody remembered to put it in a value field.
    """
    out: set[str] = set()
    for c in claims.get("claims", []) or []:
        for k in ("value", "value_text", "text", "statement"):
            if c.get(k) is not None:
                out |= numerals(str(c[k]))
    out |= {str(x).replace(",", "") for x in (claims.get("authorised_numerals") or [])}
    return out


def read_threshold() -> float | None:
    """The bar, READ from the rubric. Never restated here, in any form."""
    try:
        import yaml
        return float(yaml.safe_load(RUBRIC.read_text(encoding="utf-8"))["rubric"]["ship_threshold"])
    except Exception:                                                   # noqa: BLE001
        return None


def check(board: dict, claims: dict, script: str, captions: dict, audio: dict,
          report: dict | None, county_map: dict) -> tuple[list[str], list[str]]:
    """Returns (hard_fails, notes). Notes are recorded, not refused."""
    fails: list[str] = []
    notes: list[str] = []
    scenes = sorted(board.get("scenes") or [], key=lambda s: float(s.get("start_s") or 0))

    # ---- 1. every numeral traces to a verified claim
    allowed = authorised(claims)
    surfaces = [("the script", script)]
    for s in scenes:
        for k in ("on_screen", "supers", "slide_text", "lower_third"):
            if s.get(k):
                surfaces.append((f"scene {s.get('id')} {k}", str(s[k])))
    for where, text in surfaces:
        for n in sorted(numerals(text) - allowed):
            fails.append(
                f"{where}: the numeral {n} traces to no verified claim. Every numeral this "
                f"project publishes is produced by code from data and can be recomputed. A "
                f"figure nobody computed is a figure nobody can check.")

    # ---- 2. every caption boundary traces to the audio
    #
    # The rule is NOT the name of a method, which anybody can type. It is whether the
    # cue boundaries were MEASURED off the waveform, because re-anchoring at every
    # phrase is the only thing that stops error accumulating across a film.
    # `vo_align.py` produces `silence_anchored`: it measures every run edge and says
    # plainly which word times inside a phrase are modelled. A phoneme-level forced
    # aligner would produce `forced_alignment`. Both anchor. A words-per-second
    # divider does not, whatever it calls itself, and it is caught by the evidence it
    # cannot produce rather than by the word it chose.
    method = str(captions.get("method") or "").lower()
    if method not in ACCEPTED_ALIGNMENT:
        fails.append(
            f"captions declare method {method!r}. Only {' or '.join(sorted(ACCEPTED_ALIGNMENT))} "
            f"ships. Approximated timings drift, and the drift is invisible in review because "
            f"the reviewer already knows what the words say and reads the caption as correct.")
    if any(w in method for w in NOT_ALIGNED):
        fails.append(f"captions method {method!r} says outright that the timings were not aligned")
    if not captions.get("words_file"):
        fails.append("captions name no words file, so the alignment they claim cannot be "
                     "traced to anything")
    # THE EVIDENCE, NOT THE CLAIM. A file that says it aligned and reports no
    # measurements did not align, and this is the check a relabelled approximation
    # cannot get past.
    if int(captions.get("boundaries_measured") or 0) <= 0:
        fails.append("captions report no measured boundaries. A method name is a claim; the "
                     "count of boundaries taken off the waveform is the evidence for it.")
    if not (captions.get("cues") or []):
        fails.append(
            "captions carry no cues at all. An empty list satisfied every per-cue rule below by "
            "vacuous truth, so a film with no captions cleared the caption gate outright.")
    for cue in captions.get("cues") or []:
        src = str(cue.get("source") or "").lower()
        if not src or src in NOT_ALIGNED:
            fails.append(f"caption cue {cue.get('id')} came from {cue.get('source')!r} rather "
                         f"than a measured boundary")

    # ---- 3. no time stretch
    #
    # FAILS CLOSED. A missing measurement is not compliance: `--audio` omitted entirely, or a
    # mix report that simply has no time_stretch key, used to clear the one thing CLAUDE.md
    # bans outright. The sibling check three lines above already gets this right for
    # boundaries_measured, so the asymmetry lived inside one function.
    st = audio.get("time_stretch")
    if st is None:
        fails.append(
            "the audio report declares no time_stretch. A missing measurement is not compliance: "
            "time-stretching is banned outright, so the mix has to SAY it did not, and mix.py "
            "writes the field for exactly that reason. Pass --audio out/dispatch/mix.json.")
    elif abs(float(st) - 1.0) > 1e-6:
        fails.append(
            f"audio was time-stretched by {st}. It is banned: it produces the "
            f"chipmunk-or-molasses artefact every viewer hears and cannot name. The fix for a "
            f"long read is a SHORTER SCRIPT and a re-synth of those lines.")
    for tr in audio.get("tracks") or []:
        s2 = tr.get("time_stretch")
        if s2 is not None and abs(float(s2) - 1.0) > 1e-6:
            fails.append(f"audio track {tr.get('id')} was time-stretched by {s2}")

    # ---- 4. the region comes from the county
    known = county_map.get("counties") or {}
    for s in scenes:
        county = str(s.get("county") or "").strip()
        region = s.get("region")
        if not county:
            fails.append(f"scene {s.get('id')} declares no county, so its region was chosen "
                         f"for how it looks")
            continue
        entry = known.get(county)
        if entry is None:
            notes.append(f"county {county!r} is not in config/county_regions.json. Recorded as "
                         f"{region!r} for next time. An unknown county is not a reason to stop "
                         f"a run, but a SECOND run disagreeing with this one is.")
            continue
        if entry.get("region") != region:
            fails.append(
                f"scene {s.get('id')}: {county} County is {entry.get('region')}, and the board "
                f"says {region}. A Texan forgives a stylized drawing and does not forgive being "
                f"told they live somewhere they don't."
                + (f" ({entry['note']})" if entry.get("note") else ""))

    # ---- 5. retired motifs, on the FINAL copy
    blob = (script + " " + " ".join(str(s.get(k, "")) for s in scenes
                                    for k in ("on_screen", "what_moves", "vo", "note"))).lower()
    for bad in sorted(RETIRED):
        if bad in blob:
            fails.append(f"the final copy carries a retired motif ({bad}). It can arrive after "
                         f"Gate 0, which is why this is checked twice.")

    # ---- 6. a brimmed hat where it is a safety violation
    for s in scenes:
        place = " ".join(str(s.get(k, "")) for k in ("on_screen", "location", "note")).lower()
        if not any(re.search(rf"(?<![a-z]){re.escape(h)}(?![a-z])", place) for h in HAZARD):
            continue
        for c in s.get("cast") or []:
            gear = str(c.get("headgear") or "").lower()
            if any(b in gear for b in BRIMMED):
                fails.append(
                    f"scene {s.get('id')}: {c.get('id')} wears {c.get('headgear')} on a rig "
                    f"floor. The only correct headgear there is a hard hat over an FR hood, and "
                    f"a Texan sees the violation instantly.")

    # ---- 7. a held slide
    for s in scenes:
        dur = float(s.get("duration_s") or 0)
        if dur > MAX_SCENE_S + 0.001 and s.get("beat") not in CURRENCIES:
            fails.append(f"scene {s.get('id')} holds {dur:.1f}s and pays in nothing")

    # ---- the bar, READ rather than restated
    if report is not None:
        thr = read_threshold()
        if thr is None:
            fails.append(f"cannot read rubric.ship_threshold from {RUBRIC}. The bar lives there "
                         f"and nowhere else, so an unreadable rubric is a stop.")
        else:
            score = float(report.get("score") or report.get("weighted_score") or 0)
            if score < thr:
                fails.append(f"the panel scored {score:.2f} against the rubric's {thr}")
            for hf in report.get("hard_fails") or []:
                fails.append(f"the panel raised a hard fail: {hf}")
    return fails, notes


def self_test() -> int:
    failures = 0

    def ok(label, cond, extra=""):
        nonlocal failures
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}{'' if cond else '  ' + extra}")
        if not cond:
            failures += 1

    # THE TOKENISER, which is the part that has been wrong before.
    ok("a thousands separator is ONE numeral, not two",
       numerals("2,600 streamlines") == {"2600"}, str(numerals("2,600 streamlines")))
    ok("...so a correct figure is not reported as unauthorised",
       "600" not in numerals("2,600 streamlines"))
    ok("a decimal survives", numerals("8.9 gigawatts") == {"8.9"})
    ok("a sentence-final full stop is not part of the number",
       numerals("It drew 4,012.") == {"4012"})
    ok("8,927 and 8927 are the same numeral", numerals("8,927") == numerals("8927"))

    claims = {"claims": [
        {"id": "c1", "value": 8926, "text": "8,926 MW approved to energize"},
        {"id": "c2", "value_text": "3,966 MW observed peak"},
        {"id": "c3", "text": "about 44 percent"},
    ]}
    aut = authorised(claims)
    ok("the authorised set is built from the claims", {"8926", "3966", "44"} <= aut, str(aut))

    def scene(i, **kw):
        s = {"id": f"s{i}", "start_s": (i - 1) * 5.0, "duration_s": 5.0, "beat": "motion",
             "region": "rolling_plains", "county": "Taylor", "on_screen": "a substation yard",
             "what_moves": "the camera pushes", "vo": "", "cast": [{"id": "rig-hand",
                                                                    "headgear": "hardhat"}]}
        s.update(kw)
        return s

    board = {"runtime_s": 40.0, "scenes": [scene(i) for i in range(1, 9)]}
    script = "Texas approved 8,926 megawatts and has watched 3,966 of it draw, about 44 percent."
    caps = {"method": "silence_anchored", "words_file": "out/dispatch/words.json",
            "boundaries_measured": 12, "cues": [{"id": "c1", "source": "measured_boundary"}]}
    audio = {"time_stretch": 1.0, "tracks": [{"id": "vo", "time_stretch": 1.0}]}
    cmap = json.loads(COUNTY_MAP.read_text(encoding="utf-8"))

    f, n = check(board, claims, script, caps, audio, None, cmap)
    ok("a clean package ships", not f, str(f))

    # 1. an untraceable numeral
    f, _ = check(board, claims, script + " Some 12,400 acres.", caps, audio, None, cmap)
    ok("a numeral that traces to nothing is a hard fail",
       any("12400 traces to no verified claim" in x for x in f), str(f[:1]))

    # 2. captions
    f, _ = check(board, claims, script, dict(caps, method="approximated"), audio, None, cmap)
    ok("approximated caption timings are a hard fail", any("Only forced_alignment" in x for x in f))
    f, _ = check(board, claims, script, dict(caps, words_file=""), audio, None, cmap)
    ok("...and alignment claimed with no words file behind it is too",
       any("cannot be traced" in x for x in f))
    # THE ONE A RELABELLED APPROXIMATION CANNOT GET PAST.
    f, _ = check(board, claims, script, dict(caps, boundaries_measured=0), audio, None, cmap)
    ok("...and a file that CLAIMS alignment while reporting no measurements is refused",
       any("the evidence for it" in x for x in f), str(f[:1]))
    f, _ = check(board, claims, script,
                 dict(caps, method="forced_alignment"), audio, None, cmap)
    ok("a real forced aligner would also be accepted", not f, str(f))
    f, _ = check(board, claims, script,
                 dict(caps, cues=[{"id": "q1", "source": "hand"}]), audio, None, cmap)
    ok("...and a single hand-shifted cue is caught even when the header says aligned",
       any("rather than a measured boundary" in x for x in f), str(f[:1]))

    # 3. time stretch
    f, _ = check(board, claims, script, caps, {"time_stretch": 1.04}, None, cmap)
    ok("time-stretched audio is a hard fail", any("time-stretched by 1.04" in x for x in f))
    ok("...and the message says the fix is a shorter script",
       any("SHORTER SCRIPT" in x for x in check(board, claims, script, caps,
                                                {"time_stretch": 1.04}, None, cmap)[0]))
    f, _ = check(board, claims, script, caps,
                 {"time_stretch": 1.0, "tracks": [{"id": "vo", "time_stretch": 0.94}]},
                 None, cmap)
    ok("...on any single track, not only the master", any("track vo" in x for x in f))

    # ---- FAILING CLOSED. A missing measurement is not compliance.
    f, _ = check(board, claims, script, caps, {}, None, cmap)
    ok("an ABSENT audio report is a hard fail, not a pass",
       any("declares no time_stretch" in x for x in f), str(f[:1]))
    f, _ = check(board, claims, script, caps, {"lufs": -16, "tracks": [{"id": "vo"}]}, None, cmap)
    ok("...and a report that simply omits the field is too",
       any("declares no time_stretch" in x for x in f), str(f[:1]))
    ok("...while the mix.py report, which always writes it, still ships",
       not check(board, claims, script, caps,
                 {"time_stretch": 1.0, "tracks": [{"id": "vo", "time_stretch": 1.0}]},
                 None, cmap)[0])

    f, _ = check(board, claims, script, dict(caps, cues=[]), audio, None, cmap)
    ok("a film with NO captions at all is refused",
       any("no cues at all" in x for x in f), str(f[:1]))
    ok("...and the message says why an empty list passed everything",
       any("vacuous truth" in x for x in f))

    # ---- WORD BOUNDARIES. "community" is not a rig floor.
    hill = {"runtime_s": 40.0, "scenes": [scene(i) for i in range(1, 9)]}
    hill["scenes"][1]["on_screen"] = "a rancher outside the community hall in Bandera"
    hill["scenes"][1]["cast"] = [{"id": "rancher", "headgear": "felt-hat"}]
    f, _ = check(hill, claims, script, caps, audio, None, cmap)
    ok("a felt hat outside the COMMUNITY hall is not a safety violation", not f, str(f[:1]))
    for word in ("opportunity", "immunity", "unity"):
        h2 = {"runtime_s": 40.0, "scenes": [scene(i) for i in range(1, 9)]}
        h2["scenes"][1]["on_screen"] = f"a hearing about {word} in Kerrville"
        h2["scenes"][1]["cast"] = [{"id": "rancher", "headgear": "felt-hat"}]
        ok(f"...nor one near the word {word!r}", not check(h2, claims, script, caps, audio,
                                                           None, cmap)[0])
    pu = {"runtime_s": 40.0, "scenes": [scene(i) for i in range(1, 9)]}
    pu["scenes"][1]["on_screen"] = "a hand at the pumping unit"
    pu["scenes"][1]["cast"] = [{"id": "rancher", "headgear": "straw-hat"}]
    ok("...but a straw hat at a PUMPING UNIT still is",
       any("rig floor" in x for x in check(pu, claims, script, caps, audio, None, cmap)[0]))

    # 4. region vs county. THE FIRST LAW.
    wrong = {"runtime_s": 40.0, "scenes": [scene(i) for i in range(1, 9)]}
    wrong["scenes"][2]["region"] = "piney_woods"
    f, _ = check(wrong, claims, script, caps, audio, None, cmap)
    ok("a county in the wrong region is a hard fail",
       any("Taylor County is rolling_plains" in x for x in f), str(f[:1]))
    ok("...and the message is the law, not a lookup error",
       any("somewhere they don't" in x for x in check(wrong, claims, script, caps, audio,
                                                      None, cmap)[0]))

    unknown = {"runtime_s": 40.0, "scenes": [scene(i, county="Loving") for i in range(1, 9)]}
    f, n = check(unknown, claims, script, caps, audio, None, cmap)
    ok("an UNKNOWN county is recorded, not refused", not f and any("Recorded as" in x for x in n),
       f"{f} / {n[:1]}")

    nocounty = {"runtime_s": 40.0, "scenes": [scene(i, county="") for i in range(1, 9)]}
    f, _ = check(nocounty, claims, script, caps, audio, None, cmap)
    ok("...but no county at all is a hard fail", any("chosen for how it looks" in x for x in f))

    # 5. a motif that arrives AFTER gate 0
    f, _ = check(board, claims, script + " Under the six flags of Texas.", caps, audio, None, cmap)
    ok("a retired motif in the final copy is caught even though the board was clean",
       any("retired motif" in x for x in f))

    # 6. a brimmed hat on a rig floor
    hat = {"runtime_s": 40.0, "scenes": [scene(i) for i in range(1, 9)]}
    hat["scenes"][1]["on_screen"] = "a rig floor at dusk"
    hat["scenes"][1]["cast"] = [{"id": "rancher", "headgear": "felt-hat"}]
    f, _ = check(hat, claims, script, caps, audio, None, cmap)
    ok("a brimmed hat on a rig floor is a hard fail", any("rig floor" in x for x in f), str(f[:1]))
    safe = {"runtime_s": 40.0, "scenes": [scene(i) for i in range(1, 9)]}
    safe["scenes"][1]["on_screen"] = "a rig floor at dusk"
    f, _ = check(safe, claims, script, caps, audio, None, cmap)
    ok("...while a hard hat on the same floor is fine", not f, str(f))

    # 7. a held slide
    held = {"runtime_s": 40.0, "scenes": [scene(i) for i in range(1, 9)]}
    held["scenes"][3]["duration_s"] = 8.0
    held["scenes"][3]["beat"] = "none"
    f, _ = check(held, claims, script, caps, audio, None, cmap)
    ok("a held slide that pays in nothing is a hard fail", any("pays in nothing" in x for x in f))

    # THE BAR IS READ, NEVER QUOTED.
    thr = read_threshold()
    ok("the bar is readable from the rubric", thr is not None, str(thr))
    src = Path(__file__).read_text(encoding="utf-8")
    body = src.split("def self_test", 1)[0]
    ok("...and this file does not restate it anywhere above the self-test",
       thr is None or str(thr) not in body,
       "the bar is written into ship_gate itself, which is the exact fault it guards")
    if thr is not None:
        f, _ = check(board, claims, script, caps, audio, {"score": thr - 0.1}, cmap)
        ok("a score under the bar is refused", any("against the rubric's" in x for x in f))
        f, _ = check(board, claims, script, caps, audio, {"score": thr}, cmap)
        ok("...and a score exactly at it ships", not f, str(f))
        f, _ = check(board, claims, script, caps, audio,
                     {"score": thr + 2, "hard_fails": ["the region is wrong"]}, cmap)
        ok("...and a panel hard fail outranks a high score", bool(f))

    if failures:
        print(f"\nship_gate self-test: {failures} FAILED", file=sys.stderr)
        return 1
    print("\nship_gate self-test: all passed")
    return 0


def load(path: str | None, default):
    if not path:
        return default
    p = Path(path)
    if p.suffix == ".txt":
        return p.read_text(encoding="utf-8")
    return json.loads(p.read_text(encoding="utf-8"))


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    for f in ("board", "claims", "script", "captions", "audio", "report"):
        ap.add_argument(f"--{f}")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    if not a.board:
        print("ship_gate: pass --board (and the rest), or --self-test", file=sys.stderr)
        return 2
    try:
        board = load(a.board, {})
        claims = load(a.claims, {})
        script = load(a.script, "")
        captions = load(a.captions, {})
        audio = load(a.audio, {})
        report = load(a.report, None) if a.report else None
        county_map = json.loads(COUNTY_MAP.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"ship_gate: cannot read inputs: {exc}", file=sys.stderr)
        return 2

    fails, notes = check(board, claims, script, captions, audio, report, county_map)
    for n in notes:
        print(f"  note: {n}")
    if fails:
        print(f"\nship gate: {len(fails)} HARD FAIL(S). This run does not merge.\n",
              file=sys.stderr)
        for x in fails:
            print(f"  - {x}", file=sys.stderr)
        return 1
    print("\nship gate: clear. The one thing left is the one no script can judge: would a Texan "
          "from that county believe the person who drew this had been there.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:                                            # noqa: BLE001
        print(f"ship_gate: broke: {exc}", file=sys.stderr)
        sys.exit(2)
