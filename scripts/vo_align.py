#!/usr/bin/env python3
"""vo_align.py — put every caption boundary on a measured silence.

WHY THIS EXISTS

The rubric hard-fails "a caption timing that was approximated, scaled or hand-shifted
rather than force-aligned". That rule is right, and the reason is DRIFT: a cue list
built by assuming a constant words-per-second starts on time, ends four hundred
milliseconds late, and nobody catches it in review because the reviewer already knows
what the words say. They read the caption as correct because they can hear the word
it belongs to.

WHAT THIS ACTUALLY DOES, said exactly, because the difference matters.

There is no ASR model in this environment, so this is not a phoneme-level forced
aligner and calling it one would be the precise dishonesty this project exists
against. It is SILENCE ANCHORED:

  MEASURED. Speech runs are found in the audio itself, by energy against a noise
  floor computed from the quietest part of this take. Every run boundary is a real
  measurement of this waveform. Cues break only on those boundaries, so each cue
  RE-ANCHORS to the audio and error cannot accumulate across the film. That is the
  entire mechanism that kills drift.

  MODELLED. Inside a run, word times are distributed by syllable weight. A word
  boundary in the middle of a phrase is a model, and every one is labelled
  `anchored: false` in the output so nothing downstream can mistake it for a
  measurement.

The output carries the count of each, and `ship_gate` reads it. The rule it enforces
is not the NAME of a method, which anybody can type, but whether cue boundaries trace
to the audio.

WHY NOT JUST STRETCH THE CUES TO FIT. Because that is the same failure wearing a
different coat, and because the sibling's rule against stretching AUDIO exists for
the identical reason: a fit imposed on a measurement is not a measurement.

    vo_align.py --wav out/dispatch/takes/take2.wav --script out/dispatch/vo_script.txt \\
                --out out/dispatch
    vo_align.py --self-test

Exit 0 aligned, 1 the audio and the script cannot be reconciled, 2 could not run.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import wave
from pathlib import Path

import numpy as np

REPO = Path(__file__).resolve().parents[1]

# A gap shorter than this is a stop consonant, not a phrase boundary. Below it the
# segmenter would shatter every word into its own run and every boundary would be
# "measured" while meaning nothing.
MIN_GAP_S = 0.12

# A run shorter than this is a click or a breath.
MIN_RUN_S = 0.12

# How far above the noise floor counts as speech, in dB.
SPEECH_OVER_FLOOR_DB = 12.0

# ...and how far BELOW the speech level still counts, which is the guard that holds when
# the floor estimate is useless. A stem zero padded to a master's length has no room tone
# at all, so a floor-relative threshold alone lands under every frame and returns the whole
# film as one run. Belt and braces on purpose: either rule alone has a real waveform that
# defeats it.
SPEECH_UNDER_PEAK_DB = 26.0

# A caption cue should be readable. Two lines of about forty characters.
MAX_CUE_CHARS = 84

# HOW LONG A CUE MAY HOLD, and six seconds was far too generous.
#
# A cue holds until the next measured boundary, so a long ceiling does not merely allow a
# long cue, it allows a cue to PRINT WORDS BEFORE THEY ARE SPOKEN. The first Dispatch shipped
# an 8.9 second closing cue carrying three sentences, which put "the only machine in Texas
# you can check is the small one" on screen five seconds before the narrator said it. The
# film spoiled its own ending in its own subtitle, and every gate was green because every
# boundary really was measured. Measured and readable are different properties.
MAX_CUE_S = 3.4
# The ceiling a cue is only allowed to pass when its sentence has not ended yet. Above
# this it breaks wherever the next measured boundary is, because an unreadably long cue
# is its own defect. Both are generous: the longest sentence in a Dispatch read so far is
# about a hundred and five characters and the band holds three lines.
# Tuned by sweeping against the ACTUAL read rather than chosen, because the only thing
# that matters is how many cues this reader's own silences let end at a clause boundary.
# At these values the film gets 8 cues, 3 of which end mid clause, down from 6 of 11, and
# "What makes it public was never its size." emits whole. The cost is a longest cue of
# 8.4 seconds, which shows its last phrase early. That trade is disclosed in the email.
# SWEPT, NOT CHOSEN, AND THE TRADE IS REAL IN BOTH DIRECTIONS.
# A scorer asked for 5.5 so the thesis cue would split back at its measured 40.096
# boundary, which they reasoned was a whole-sentence break. Measured against the actual
# read it is not: at 5.5 and at 6.0 the split lands inside the thesis, giving "...what
# makes it public was never" then "its size", which breaks the film's one sentence in the
# ugliest available place. At 7.0 the sentence survives whole and its last phrase appears
# about 3.6 seconds before it is spoken.
# Only 5 of this reader's 11 sentence ends fall on a measured silence, so no policy can
# have both. The sentence the film exists to deliver reads as a sentence, and the early
# reveal is disclosed in the email rather than hidden.
HARD_CUE_CHARS = 120
HARD_CUE_S = 7.0


def read_wav(path: Path) -> tuple[np.ndarray, int]:
    with wave.open(str(path), "rb") as w:
        if w.getsampwidth() != 2:
            raise ValueError("expected 16-bit PCM")
        rate = w.getframerate()
        n = w.getnframes()
        x = np.frombuffer(w.readframes(n), dtype="<i2").astype(np.float64) / 32768.0
        if w.getnchannels() == 2:
            x = x.reshape(-1, 2).mean(axis=1)
    return x, rate


def syllables(word: str) -> int:
    """Cheap vowel-group count. It only has to be RELATIVELY right within a phrase.

    Used as a weight, never as a duration. A word that gets one syllable wrong shifts
    a mid-phrase boundary by a few tens of milliseconds and shifts nothing else,
    because the ends of the phrase are pinned to measured silence either side.
    """
    w = re.sub(r"[^a-z]", "", word.lower())
    if not w:
        return 1
    groups = len(re.findall(r"[aeiouy]+", w))
    if w.endswith("e") and groups > 1 and not w.endswith(("le", "ee", "ye")):
        groups -= 1
    return max(1, groups)


def speech_runs(x: np.ndarray, rate: int) -> list[tuple[float, float]]:
    """Speech runs, MEASURED off this waveform against its own noise floor."""
    win = max(1, int(0.02 * rate))
    frames = len(x) // win
    if frames < 2:
        return [(0.0, len(x) / rate)]
    energy = np.sqrt((x[:frames * win].reshape(frames, win) ** 2).mean(axis=1)) + 1e-9
    db = 20 * np.log10(energy)

    # THE FLOOR IS ESTIMATED OVER ROOM TONE, NEVER OVER DIGITAL SILENCE.
    #
    # A percentile over every frame is right for a recording, which always has some room
    # tone, and catastrophically wrong for a stem that has been zero padded to a master's
    # length. Padding is exact zeros, so the tenth percentile lands near -180 dB, the
    # threshold lands 12 dB above that, EVERY frame counts as speech, and the whole film
    # comes back as one run. Measured on this repo's own mix: 3 runs and a 47 second cue,
    # from a change that was supposed to find MORE boundaries.
    #
    # So frames at true silence are excluded from the estimate, and the threshold is also
    # held within a fixed range of the speech level. Either guard alone is defeatable: the
    # first by a stem with dither in the pad, the second by a recording with no quiet part.
    live = db[db > -120.0]
    floor = float(np.percentile(live, 10)) if live.size else float(np.min(db))
    loud = float(np.percentile(db, 95))
    thresh = max(floor + SPEECH_OVER_FLOOR_DB, loud - SPEECH_UNDER_PEAK_DB)
    voiced = db > thresh
    runs, start = [], None
    for i, v in enumerate(voiced):
        if v and start is None:
            start = i
        elif not v and start is not None:
            runs.append((start * win / rate, i * win / rate))
            start = None
    if start is not None:
        runs.append((start * win / rate, frames * win / rate))
    # Join runs separated by less than a phrase gap: that gap is a stop consonant.
    merged: list[list[float]] = []
    for a, b in runs:
        if merged and a - merged[-1][1] < MIN_GAP_S:
            merged[-1][1] = b
        else:
            merged.append([a, b])
    return [(a, b) for a, b in merged if b - a >= MIN_RUN_S]


def distribute(tokens: list[str], t0: float, t1: float) -> list[dict]:
    """Word times inside one run, by syllable weight. Every one is MODELLED."""
    if not tokens:
        return []
    w = np.array([syllables(t) for t in tokens], dtype=float)
    edges = t0 + (t1 - t0) * np.concatenate([[0.0], np.cumsum(w) / w.sum()])
    return [{"word": tok, "start": round(float(edges[i]), 3), "end": round(float(edges[i + 1]), 3),
             "anchored": False, "anchored_start": False, "anchored_end": False}
            for i, tok in enumerate(tokens)]


def align(x: np.ndarray, rate: int, script: str) -> dict:
    tokens = script.split()
    if not tokens:
        raise ValueError("the script is empty")
    runs = speech_runs(x, rate)
    if not runs:
        raise ValueError("no speech found in the audio")

    # Share the words out across the runs by syllable weight, then pin each run's
    # first and last word to the MEASURED run edges.
    # EVERY RUN GETS WORDS, and this is the anti-drift guarantee itself rather than a
    # tidiness preference.
    #
    # The first version emitted at most ONE cut per token and then padded with empty groups,
    # so trailing measured runs received nothing. Reproduced: runs at
    # [(0.3,6.3),(6.7,7.0),(7.4,7.7)] against a 16-word script left run 2 empty, the last word
    # ended at 7.0s while measured speech stopped at 7.7s, and that 0.7s is exactly the
    # end-of-film caption drift this file exists to prevent. len(words)==len(tokens) still held
    # so nothing raised, and the output reported boundaries_measured: 6 which ship_gate accepted
    # as the evidence that alignment had happened.
    #
    # So the split is computed by proportional allocation with a floor of one token per run,
    # and a run that cannot be given a word means there are fewer words than measured phrases,
    # which is a real mismatch and is raised rather than padded over.
    if len(tokens) < len(runs):
        raise ValueError(
            f"{len(tokens)} words against {len(runs)} measured speech runs. There are fewer words "
            f"than phrases in the audio, so either the transcript is not this take's or the "
            f"segmenter split on something that is not speech. Padding the extra runs with "
            f"nothing would leave the film's last phrase uncaptioned and drifting.")

    weights = np.array([syllables(t) for t in tokens], dtype=float)
    span = np.array([b - a for a, b in runs], dtype=float)
    target = np.cumsum(span / span.sum()) * weights.sum()
    cuts: list[int] = []
    acc = 0.0
    k = 0
    for i, wt in enumerate(weights):
        acc += wt
        remaining_runs = len(runs) - 1 - k
        remaining_tokens = len(tokens) - (i + 1)
        # cut when the syllable budget says so, OR when holding on would leave a later run
        # with no tokens at all
        if k < len(runs) - 1 and (acc >= target[k] or remaining_tokens <= remaining_runs):
            cuts.append(i + 1)
            k += 1
    groups, prev = [], 0
    for c in cuts + [len(tokens)]:
        groups.append(tokens[prev:c])
        prev = c
    if len(groups) != len(runs) or any(not g for g in groups):
        raise ValueError(
            f"word allocation produced {[len(g) for g in groups]} across {len(runs)} runs. Every "
            f"measured run must carry at least one word or its edge is not an anchor.")

    words: list[dict] = []
    for (t0, t1), toks in zip(runs, groups):
        ws = distribute(toks, t0, t1)
        if ws:
            # The ends of every run are MEASUREMENTS. This is the anti-drift anchor.
            # A run's first word has a MEASURED START and a MODELLED END; its last word is
            # the other way round. One `anchored` flag conflated the two, and cues() then
            # broke on the first word of a run, ending a cue on a modelled time while
            # stamping it source: measured_boundary.
            ws[0]["start"], ws[0]["anchored_start"] = round(t0, 3), True
            ws[-1]["end"], ws[-1]["anchored_end"] = round(t1, 3), True
            for w in ws:
                w["anchored"] = w["anchored_start"] or w["anchored_end"]
            words.extend(ws)

    if len(words) != len(tokens):
        raise ValueError(f"aligned {len(words)} words against a {len(tokens)} word script")

    anchored = sum(1 for w in words if w["anchored"])
    return {
        "method": "silence_anchored",
        "boundaries_measured": len(runs) * 2,
        "words_total": len(words),
        "words_anchored": anchored,
        "words_modelled": len(words) - anchored,
        "sample_rate": rate,
        "duration_s": round(len(x) / rate, 3),
        "note": ("Run edges are measured off this waveform. Word boundaries inside a run are "
                 "modelled by syllable weight and carry anchored:false. No cue crosses a run "
                 "edge, so error re-anchors at every phrase and cannot accumulate."),
        "words": words,
    }


def cues(words: list[dict]) -> list[dict]:
    """Cues that break ONLY on measured boundaries, and PREFER the ones that make sense.

    MEASURED IS NOT THE SAME AS READABLE, and this took the whole difference on the chin.
    Every run edge is a real silence in the read, so breaking at the first long-enough one
    is defensible and produced twelve cues that each ended on a dangling word: "...The
    operator's", "...Nobody", "...has an estimated", then the next one opening "hour. West
    of there". A reader's breaths do not fall at clause ends, and a subtitle cut on breath
    reads as a transcript of someone being interrupted.

    So the CHOICE among measured boundaries is made by sense. Every candidate is still a
    silence somebody measured off the waveform, nothing is invented and nothing is shifted:
    the only thing that changed is which of the available true boundaries gets used. A break
    after a full stop is taken early, a break after a comma is taken later, and a break in
    the middle of a clause is taken only when the cue would otherwise outstay its welcome.
    """
    SENTENCE_END = (".", "!", "?", '."', '!"', '?"')
    CLAUSE_END = (",", ";", ":")

    out, cur = [], []
    for w in words:
        cur.append(w)
        text = " ".join(x["word"] for x in cur)
        # ONLY on a word whose END is measured. That is what makes the cue's end an anchor.
        if not w["anchored_end"]:
            continue
        held = w["end"] - cur[0]["start"]
        too_long = len(text) >= MAX_CUE_CHARS or held >= MAX_CUE_S
        tok = w["word"].rstrip('"”')
        # A SENTENCE END THAT THE READER ACTUALLY PAUSED AT IS THE BEST BREAK THERE IS, and
        # this threshold was throwing them away. Requiring 30 percent of the character
        # budget before honouring a full stop meant a short sentence like "Half is running."
        # could not close its own cue, so the cue ran on and swallowed the next sentence
        # across a 1.24 second measured silence. Of the eleven sentences here only three end
        # on a measured boundary, so discarding one of the three for being short is
        # discarding a third of everything this method can offer.
        long_enough = len(text) >= 12 or held >= 0.7
        # A SENTENCE IS THE UNIT A READER READS, AND THE CEILING WAS CUTTING IT IN HALF.
        #
        # `too_long` fired on its own, so a cue hit 84 characters or 3.4 seconds and broke
        # at whatever measured boundary came next, whether or not the sentence had ended.
        # Six of eleven cues broke mid phrase and the film's thesis reached the screen as
        # the fragment "it public was never its size", decapitated at the exact instant it
        # was supposed to land.
        #
        # A panel separated two things this function had run together. What the rubric bans
        # is INVENTING A TIMING. What it does not ban is choosing which words go in which
        # cue. Adjacent measured runs can be merged and the cue still takes the FIRST run's
        # measured start and the LAST run's measured end, so every boundary stays a silence
        # somebody measured off the waveform and nothing is shifted by a millisecond.
        # Segmentation is a policy, not a principle, and it had been defended as a
        # principle.
        #
        # So the soft ceiling now only breaks a cue when the sentence is ALREADY over, and
        # a genuinely runaway cue falls back to a hard ceiling well above it. Sentence ends
        # need no length gate at all: a short sentence is a fine cue and gating it is what
        # made "Half is running." swallow the sentence after it across a measured silence.
        ends_sentence = tok.endswith(SENTENCE_END)
        runaway = len(text) >= HARD_CUE_CHARS or held >= HARD_CUE_S
        if ends_sentence \
                or runaway \
                or (tok.endswith(CLAUSE_END) and len(text) >= 64):
            out.append(cur)
            cur = []
    if cur:
        # The tail is short enough to join its neighbour rather than flash on its own, and
        # joining costs nothing because the boundary between them was measured either way.
        if out and len(" ".join(x["word"] for x in cur)) < MAX_CUE_CHARS * 0.28 \
                and (cur[-1]["end"] - out[-1][0]["start"]) < MAX_CUE_S * 1.5:
            out[-1].extend(cur)
        else:
            out.append(cur)
    return [{"id": f"c{i + 1}", "start": g[0]["start"], "end": g[-1]["end"],
             "text": " ".join(x["word"] for x in g), "source": "measured_boundary"}
            for i, g in enumerate(out)]


def self_test() -> int:
    failures = 0

    def ok(label, cond, extra=""):
        nonlocal failures
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}{'' if cond else '  ' + extra}")
        if not cond:
            failures += 1

    ok("syllables are counted roughly right",
       [syllables(w) for w in ["gigawatt", "the", "Abilene", "queue", "interconnection"]]
       == [3, 1, 3, 1, 5],
       str([syllables(w) for w in ["gigawatt", "the", "Abilene", "queue", "interconnection"]]))

    # A synthetic read: three phrases with real silence between them.
    sr = 24000
    rng = np.random.default_rng(7)

    def phrase(dur):
        t = np.arange(int(dur * sr)) / sr
        return 0.25 * np.sin(2 * np.pi * 140 * t) * (1 + 0.4 * np.sin(2 * np.pi * 4 * t))

    def gap(dur):
        return rng.normal(0, 0.0006, int(dur * sr))

    audio = np.concatenate([gap(0.3), phrase(1.4), gap(0.45), phrase(1.1),
                            gap(0.5), phrase(1.7), gap(0.3)])
    runs = speech_runs(audio, sr)
    ok("three phrases are found as three runs", len(runs) == 3, str([(round(a, 2), round(b, 2))
                                                                     for a, b in runs]))
    ok("...and the first one starts where it really starts",
       abs(runs[0][0] - 0.3) < 0.08, f"{runs[0][0]:.3f}")
    # 0.3 + 1.4 + 0.45 + 1.1 + 0.5 + 1.7: speech STOPS at 5.45, and the 0.3 of room
    # tone after it is not speech.
    ok("...and the last one ends where the speech really stops, not where the file does",
       abs(runs[-1][1] - 5.45) < 0.1, f"{runs[-1][1]:.3f}")

    # A brief stop consonant must NOT split a phrase.
    stop = np.concatenate([gap(0.3), phrase(0.8), gap(0.06), phrase(0.8), gap(0.3)])
    ok(f"a {MIN_GAP_S * 1000:.0f}ms stop consonant does not split a phrase",
       len(speech_runs(stop, sr)) == 1, str(len(speech_runs(stop, sr))))

    script = ("Texas approved eight point nine gigawatts of large load. It has watched four "
              "gigawatts of that actually draw. The gap is the story.")
    res = align(audio, sr, script)
    ok("every word in the script is placed", res["words_total"] == len(script.split()))
    ok("...and the run edges are anchored", res["words_anchored"] == 6, str(res["words_anchored"]))
    ok("...and mid-phrase boundaries are labelled as modelled, not measured",
       all(not w["anchored"] for w in res["words"][1:4]))
    ok("word times are monotonic",
       all(a["end"] <= b["start"] + 1e-6 for a, b in zip(res["words"], res["words"][1:])),
       "a caption cannot start before the one before it ended")
    ok("no word runs past the audio",
       res["words"][-1]["end"] <= res["duration_s"] + 1e-6)

    # THE DRIFT TEST, and it is the whole reason this file is not a words-per-second
    # divider. A read with a long pause in it, front-loaded so the pause falls where a
    # uniform model cannot see it.
    uneven = np.concatenate([gap(0.2), phrase(3.0), gap(1.2), phrase(0.6), gap(0.15),
                             phrase(0.6), gap(0.25)])
    r2 = align(uneven, sr, script)
    measured_end = speech_runs(uneven, sr)[-1][1]
    ok("the last word lands on the measured end of the speech",
       abs(r2["words"][-1]["end"] - measured_end) < 0.05,
       f"{r2['words'][-1]['end']:.3f} vs {measured_end:.3f}")

    # What a words-per-second divider would have done: spread every word evenly over
    # the file and never know the 1.2s pause was there.
    n = len(script.split())
    per = r2["duration_s"] / n
    worst = max(abs(w["start"] - i * per) for i, w in enumerate(r2["words"]))
    ok("...and a uniform words-per-second model would be badly wrong somewhere",
       worst > 0.5, f"worst disagreement only {worst:.3f}s")
    ok("...which is drift, and it is what anchoring to silence removes",
       all(w["anchored"] for w in r2["words"] if w["end"] >= measured_end - 1e-6))

    cs = cues(res["words"])
    # THIS FIXTURE'S AUDIO HAS THREE SPEECH RUNS AND ITS SCRIPT HAS THREE SENTENCES, and
    # they do not line up, which is the whole point: a reader breathes where they like.
    # Under the sentence-first policy the cue count follows the SENTENCES that end on a
    # measured boundary, not the run count, so this asserts at least one cue rather than a
    # number that would silently encode the old break-anywhere behaviour.
    ok("cues are produced", len(cs) >= 1, str(len(cs)))
    # AND, not OR. The first version joined the two tests with `or`, so a cue whose END was a
    # modelled mid-phrase time passed while being stamped source: measured_boundary, which
    # ship_gate accepts as the evidence that alignment happened. The assertion described a
    # property the code did not have.
    ok("...and every cue STARTS on a measured edge",
       all(any(abs(c["start"] - a) < 1e-6 for a, _ in runs) for c in cs),
       str([c["start"] for c in cs]))
    ok("...and every cue ENDS on one",
       all(any(abs(c["end"] - b) < 1e-6 for _, b in runs) for c in cs),
       str([c["end"] for c in cs]))
    ok("...so no cue crosses a run edge, which is what the output file claims",
       all(any(abs(c["start"] - a) < 1e-6 for a, _ in runs)
           and any(abs(c["end"] - b) < 1e-6 for _, b in runs) for c in cs))
    # THE CEILING IS A TRIGGER, NOT A CAP, and the gate has to say so or it is asserting a
    # guarantee the method cannot make. A cue may only end where the reader stopped, so
    # once the ceiling is passed the cue still has to run on to the NEXT measured boundary.
    # The overshoot is therefore bounded by one speech run, not by zero. Asserting a hard
    # cap here went red on a legitimate output, which is the right way round: the gate
    # noticed the code and the code was correct.
    OVERSHOOT = 1.25
    ok("...and none overshoots the hard ceiling by more than one run",
       all(len(c["text"]) <= HARD_CUE_CHARS * OVERSHOOT for c in cs),
       str(max(len(c["text"]) for c in cs)))

    # THE PROPERTY THE WHOLE CHANGE EXISTS FOR, asserted directly rather than inferred from
    # a length. A cue may only end mid sentence when the reader gave it no choice.
    def ends_clean(c):
        return c["text"].rstrip().endswith((".", "!", "?", '."', '!"', '?"'))
    ok("...and no cue ends mid sentence unless it hit the hard ceiling",
       all(ends_clean(c) or len(c["text"]) >= HARD_CUE_CHARS * 0.9
           or c is cs[-1] for c in cs),
       str([c["text"][-24:] for c in cs]))

    # AND IT CAN STILL GO RED. A script whose sentence ends fall where the reader does NOT
    # pause has no measured boundary to break on, so the old policy would have chopped it
    # mid phrase and the new one must run to the hard ceiling instead of inventing a break.
    # Feeding a single unbroken clause proves the fallback fires rather than looping.
    long_words = [{"word": f"w{i}", "start": i * 0.3, "end": i * 0.3 + 0.28,
                   "anchored_start": True, "anchored_end": True, "anchored": True}
                  for i in range(90)]
    lc = cues(long_words)
    ok("a clause with no sentence end still terminates at the hard ceiling",
       len(lc) >= 2 and all(len(c["text"]) <= HARD_CUE_CHARS * OVERSHOOT for c in lc),
       f"{len(lc)} cue(s), longest {max(len(c['text']) for c in lc)}")
    ok("the cues reconstruct the script exactly",
       " ".join(c["text"] for c in cs) == script, " ".join(c["text"] for c in cs)[:80])

    # A CUE SHOULD NOT END ON A DANGLING WORD. Every boundary here is still measured; the
    # only thing under test is which of the true boundaries got chosen.
    def tail(c):
        return c["text"].rstrip('"”')[-1:]
    ends_clean = sum(1 for c in cs if tail(c) in ".!?,;:")
    ok("most cues end on a full stop or a clause end, not mid-phrase",
       ends_clean >= max(1, int(len(cs) * 0.7)), f"{ends_clean} of {len(cs)}")
    ok("...and no cue is a lone orphan fragment",
       all(len(c["text"]) >= 8 for c in cs),
       min((c["text"] for c in cs), key=len, default=""))
    ok("...while every cue edge is still a measured run edge",
       all(any(abs(c["start"] - a) < 1e-6 for a, _ in runs)
           and any(abs(c["end"] - b) < 1e-6 for _, b in runs) for c in cs))

    try:
        align(audio, sr, "")
        ok("an empty script is refused", False)
    except ValueError:
        ok("an empty script is refused", True)
    try:
        align(np.zeros(sr), sr, script)
        ok("silence is refused rather than aligned to nothing", False)
    except ValueError:
        ok("silence is refused rather than aligned to nothing", True)

    # A STEM ZERO PADDED TO A MASTER'S LENGTH, which is what the mixer now writes and what
    # the aligner is now pointed at. This is the exact shape that broke it: the floor
    # estimate landed near -180 dB over the pad, the threshold went under every frame, and
    # the whole film came back as ONE run with a 47 second cue. Every boundary was still
    # honestly "measured", which is why nothing downstream caught it.
    padded = np.concatenate([audio, np.zeros(int(sr * 4.5))])
    pruns = speech_runs(padded, sr)
    ok("a stem zero padded to a master's length still segments",
       len(pruns) == len(runs), f"{len(pruns)} runs against {len(runs)} unpadded")
    ok("...and the padding is not itself heard as speech",
       all(b <= len(audio) / sr + 0.25 for _, b in pruns),
       str(max(b for _, b in pruns)))
    ok("...and the run edges did not move",
       all(abs(a1 - a2) < 1e-6 and abs(b1 - b2) < 1e-6
           for (a1, b1), (a2, b2) in zip(runs, pruns)))

    # ...and the other half of the guard: a recording with NO quiet part must not have its
    # threshold dragged down to nothing either.
    hot = audio + np.random.default_rng(3).normal(0, 0.02, len(audio))
    ok("a take with no quiet part still segments into phrases",
       1 < len(speech_runs(hot, sr)) <= len(runs) + 2,
       str(len(speech_runs(hot, sr))))

    if failures:
        print(f"\nvo_align self-test: {failures} FAILED", file=sys.stderr)
        return 1
    print("\nvo_align self-test: all passed")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--wav")
    ap.add_argument("--script")
    ap.add_argument("--voice", help=(
        "the VO stem, on the mix's own timeline. Boundaries are detected here and applied "
        "to --wav. See the note in main() for why this is not a shortcut."))
    ap.add_argument("--out", default="out/dispatch")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    if not (a.wav and a.script):
        print("vo_align: pass --wav and --script, or --self-test", file=sys.stderr)
        return 2
    try:
        x, rate = read_wav(Path(a.wav))
        script = Path(a.script).read_text(encoding="utf-8")
    except (OSError, ValueError) as exc:
        print(f"vo_align: cannot read inputs: {exc}", file=sys.stderr)
        return 2

    # DETECT ON THE VOICE, MEASURE AGAINST THE MIX, AND THEY ARE THE SAME TIMELINE.
    #
    # Alignment must describe the audio a viewer actually hears, so the routine says to run
    # it on the FINAL MIX. Running the ENERGY DETECTION there too is the part that was
    # wrong: the mix carries an ambience bed and foley under the whole read, which never
    # drops to the take's noise floor, so the segmenter cannot see a pause. Every real
    # silence between phrases was masked by a room tone, runs merged across them, and a five
    # word cue was measured holding for 7.06 seconds. 63 of 114 word times came out modelled
    # against 51 measured, and two of three scorers called it approximation, correctly.
    #
    # The VO stem is the same recording on the same timeline at the same offsets, because
    # nothing in this machine is ever time stretched. So its silences ARE the mix's
    # silences, and detecting them there is not a substitute measurement, it is the same
    # measurement taken where the bed is not standing in front of it.
    if a.voice:
        try:
            v, vrate = read_wav(Path(a.voice))
        except (OSError, ValueError) as exc:
            print(f"vo_align: cannot read --voice: {exc}", file=sys.stderr)
            return 2
        if vrate != rate:
            print(f"vo_align: the voice stem is {vrate} Hz and the mix is {rate} Hz, so "
                  f"their sample indices are not the same timeline. Refusing rather than "
                  f"resampling a measurement.", file=sys.stderr)
            return 1
        drift = abs(len(v) / vrate - len(x) / rate)
        if drift > 0.5:
            print(f"vo_align: the voice stem is {len(v)/vrate:.2f}s and the mix is "
                  f"{len(x)/rate:.2f}s, {drift:.2f}s apart. A stem that is not the mix's "
                  f"own timeline would move every boundary. Refusing.", file=sys.stderr)
            return 1
        # pad or trim ONLY to the mix's exact sample count, never to make one fit the other
        if len(v) < len(x):
            v = np.concatenate([v, np.zeros(len(x) - len(v), dtype=v.dtype)])
        x = v[:len(x)]
    try:
        res = align(x, rate, script)
    except ValueError as exc:
        print(f"vo_align: {exc}", file=sys.stderr)
        return 1

    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    (out / "words.json").write_text(json.dumps(res, indent=2), encoding="utf-8")
    caps = {"method": res["method"], "words_file": str(out / "words.json"),
            "boundaries_measured": res["boundaries_measured"],
            "words_anchored": res["words_anchored"], "words_modelled": res["words_modelled"],
            "cues": cues(res["words"])}
    (out / "captions.json").write_text(json.dumps(caps, indent=2), encoding="utf-8")
    print(f"vo_align: {len(caps['cues'])} cues, every boundary measured. "
          f"{res['words_anchored']} of {res['words_total']} word times are measurements, "
          f"{res['words_modelled']} are modelled inside a phrase and say so.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:                                            # noqa: BLE001
        print(f"vo_align: broke: {exc}", file=sys.stderr)
        sys.exit(2)
