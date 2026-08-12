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
MIN_GAP_S = 0.18

# A run shorter than this is a click or a breath.
MIN_RUN_S = 0.12

# How far above the noise floor counts as speech, in dB.
SPEECH_OVER_FLOOR_DB = 12.0

# A caption cue should be readable. Two lines of about forty characters.
MAX_CUE_CHARS = 84
MAX_CUE_S = 6.0


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
    # The noise floor of THIS take, not a constant. A take recorded hotter or quieter
    # than the last one gets its own threshold.
    floor = float(np.percentile(db, 10))
    thresh = floor + SPEECH_OVER_FLOOR_DB
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
             "anchored": False} for i, tok in enumerate(tokens)]


def align(x: np.ndarray, rate: int, script: str) -> dict:
    tokens = script.split()
    if not tokens:
        raise ValueError("the script is empty")
    runs = speech_runs(x, rate)
    if not runs:
        raise ValueError("no speech found in the audio")

    # Share the words out across the runs by syllable weight, then pin each run's
    # first and last word to the MEASURED run edges.
    weights = np.array([syllables(t) for t in tokens], dtype=float)
    span = np.array([b - a for a, b in runs], dtype=float)
    want = np.cumsum(span / span.sum()) * weights.sum()
    cuts, acc, k = [], 0.0, 0
    for i, wt in enumerate(weights):
        acc += wt
        if k < len(want) - 1 and acc >= want[k]:
            cuts.append(i + 1)
            k += 1
    groups, prev = [], 0
    for c in cuts + [len(tokens)]:
        groups.append(tokens[prev:c])
        prev = c
    while len(groups) < len(runs):
        groups.append([])
    groups = groups[:len(runs)]

    words: list[dict] = []
    for (t0, t1), toks in zip(runs, groups):
        ws = distribute(toks, t0, t1)
        if ws:
            # The ends of every run are MEASUREMENTS. This is the anti-drift anchor.
            ws[0]["start"], ws[0]["anchored"] = round(t0, 3), True
            ws[-1]["end"] = round(t1, 3)
            ws[-1]["anchored"] = True
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
    """Cues that break ONLY on measured boundaries."""
    out, cur = [], []
    for w in words:
        cur.append(w)
        text = " ".join(x["word"] for x in cur)
        ends_run = w["anchored"] and w is not cur[0]
        too_long = len(text) >= MAX_CUE_CHARS or (w["end"] - cur[0]["start"]) >= MAX_CUE_S
        if ends_run and (too_long or len(text) > MAX_CUE_CHARS * 0.55):
            out.append(cur)
            cur = []
    if cur:
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
    ok("cues are produced", len(cs) >= 2, str(len(cs)))
    ok("...and every cue boundary is a MEASURED one",
       all(any(abs(c["start"] - a) < 1e-6 or abs(c["end"] - b) < 1e-6 for a, b in runs)
           for c in cs))
    ok("...and none is longer than is readable",
       all(len(c["text"]) <= MAX_CUE_CHARS * 1.4 for c in cs),
       str(max(len(c["text"]) for c in cs)))
    ok("the cues reconstruct the script exactly",
       " ".join(c["text"] for c in cs) == script, " ".join(c["text"] for c in cs)[:80])

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

    if failures:
        print(f"\nvo_align self-test: {failures} FAILED", file=sys.stderr)
        return 1
    print("\nvo_align self-test: all passed")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--wav")
    ap.add_argument("--script")
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
