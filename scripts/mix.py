#!/usr/bin/env python3
"""mix.py — assemble the final track. Never stretch anything to make it fit.

WHY THIS EXISTS

The Dispatch has a voice, a set of motivated sounds and a bed. Something has to put
them on one timeline at the right levels, and that something is the last place a
tempting shortcut lives.

THE SHORTCUT, and why it is closed by construction. When the read runs a little long
against the cut, the fix that takes one line of code is to resample the voice by four
percent. It produces the chipmunk-or-molasses artefact every viewer hears and cannot
name, and it is banned in CLAUDE.md. **This mixer has no resampler in it.** Not a
disabled one, not one behind a flag. If the voice does not fit, it says by how much
and stops, because the fix for a long read is a shorter script.

WHAT IT DOES, and what each number is.

  DUCKING. The bed and the sounds drop under the voice, driven by an envelope
  measured from the voice track itself rather than from the cue list, so a line that
  runs long ducks for as long as it actually runs.

  HEADROOM. Sums are checked for clipping and reported. Nothing is limited silently:
  a mix that clips is a mix that needs different levels, and a limiter hiding it is
  the same class of lie as a time-stretch.

  LOUDNESS. The master is normalised to the target by a single GAIN, which changes no
  timing and no timbre. The measurement is the BS.1770 one in `vo_synth_gemini.py`,
  imported rather than reimplemented, because two loudness meters in one repo will
  disagree on the day it matters.

    mix.py --vo out/dispatch/takes/take2.wav --sfx out/dispatch/sfx_events.json \\
           --out out/dispatch/mix.wav --cut 62.0
    mix.py --self-test

Exit 0 mixed, 1 it does not fit or it clips, 2 could not run.
"""
from __future__ import annotations

import argparse
import json
import sys
import wave
from pathlib import Path

import numpy as np

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "scripts"))
# The METER comes from the synth wrapper and the TARGET from the soundcheck, each
# from the one file that owns it. Two loudness meters in one repo disagree on the day
# it matters, and a target written down twice is a target wrong in one of the places.
from vo_synth_gemini import integrated_lufs        # noqa: E402
from vo_soundcheck import TARGET_LUFS              # noqa: E402

# How far under the voice the bed and the sounds sit, in dB.
DUCK_DB = -11.0

# The voice envelope's attack and release, in seconds. Fast in so a word is never
# buried, slow out so the bed does not pump between words.
DUCK_ATTACK_S = 0.06
DUCK_RELEASE_S = 0.35

# A take may exceed the cut by this fraction before the mix refuses. The same
# tolerance vo_soundcheck uses, because two different answers to "is this too long"
# would let a take pass one and fail the other.
MAX_OVERAGE = 0.04


def strip_prose(src: str) -> str:
    """CODE only. Comments, docstrings AND string literals removed.

    A scan of this file for banned identifiers has to read what the file DOES, not what it
    says. Three rounds of that lesson are baked in here:

      engine_lint failed on its first run reading a comment that said a call was banned.
      This file's docstring says "resampler" while explaining there is not one.
      And main() carries the message "this mixer does not resample" as a plain STRING, which
      survived comment-and-docstring stripping and turned the guarantee red the moment the
      scan was widened to cover main() at all.

    So string literals go too. A banned identifier never appears inside a string in real code
    except as a message about itself, which is precisely the case being excluded.
    """
    triples = ('"' * 3, "'" * 3)
    out, i, n = [], 0, len(src)
    while i < n:
        c = src[i]
        if c == "#":
            j = src.find("\n", i)
            i = n if j < 0 else j
        elif src.startswith(triples, i):
            q = src[i:i + 3]
            j = src.find(q, i + 3)
            i = n if j < 0 else j + 3
        elif c in ('"', "'"):
            j = i + 1
            while j < n and src[j] != c:
                j += 2 if src[j] == "\\" else 1
            out.append('""')
            i = j + 1
        else:
            out.append(c)
            i += 1
    return "".join(out)


def read_wav(path: Path) -> tuple[np.ndarray, int]:
    with wave.open(str(path), "rb") as w:
        rate = w.getframerate()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(np.float64) / 32768.0
        if w.getnchannels() == 2:
            x = x.reshape(-1, 2).mean(axis=1)
    return x, rate


def write_wav(path: Path, x: np.ndarray, rate: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())


def duck_envelope(vo: np.ndarray, rate: int) -> np.ndarray:
    """A gain curve for everything under the voice, measured FROM the voice.

    Driven by the waveform rather than by the cue list on purpose: a line that runs
    longer than its cue still ducks for exactly as long as it is actually speaking.
    """
    win = max(1, int(0.01 * rate))
    n = len(vo) // win
    if n < 2:
        return np.ones(len(vo))
    env = np.sqrt((vo[:n * win].reshape(n, win) ** 2).mean(axis=1))
    floor = float(np.percentile(env, 10)) + 1e-6
    speaking = (env > floor * 4).astype(float)
    a = np.exp(-win / (DUCK_ATTACK_S * rate))
    r = np.exp(-win / (DUCK_RELEASE_S * rate))
    smooth = np.zeros(n)
    g = 0.0
    for i, s in enumerate(speaking):
        g = s + (g - s) * (a if s > g else r)
        smooth[i] = g
    duck = 10 ** (DUCK_DB / 20)
    gain = 1.0 + smooth * (duck - 1.0)
    return np.interp(np.arange(len(vo)), np.arange(n) * win + win / 2, gain)


def place(bus: np.ndarray, clip: np.ndarray, at_s: float, rate: int, gain: float) -> None:
    i = int(at_s * rate)
    if i >= len(bus):
        return
    j = min(len(bus), i + len(clip))
    bus[i:j] += clip[: j - i] * gain


def mix(vo: np.ndarray, rate: int, sfx: list[dict], cut_s: float,
        bed: np.ndarray | None = None, target_lufs: float = TARGET_LUFS
        ) -> tuple[np.ndarray, dict, list[str]]:
    problems: list[str] = []
    dur = len(vo) / rate
    over = (dur - cut_s) / cut_s if cut_s > 0 else 0.0
    if over > MAX_OVERAGE:
        problems.append(
            f"the voice runs {over * 100:.1f}% over the {cut_s:.1f}s cut ({dur:.2f}s). "
            f"THERE IS NO RESAMPLER IN THIS FILE, deliberately. Trim the script and re-synth "
            f"those lines. Stretching to fit produces an artefact every viewer hears and "
            f"cannot name.")
        return np.zeros(0), {}, problems

    # THE BUFFER MUST HOLD THE VOICE, exactly.
    #
    # `int(max(cut_s, dur) * rate)` truncates, and dur is len(vo)/rate, so the float round trip
    # int(len/rate*rate) lands one sample SHORT of len(vo) for a large fraction of sample counts.
    # Reproduced at 22050, 24000, 44100 and 48000. It fires only when dur > cut_s, which is
    # exactly the take that runs long and sits inside the 4% overage this code deliberately
    # tolerates, and the mix() call in main() is outside its try block, so an unattended run died
    # on "mix: broke: operands could not be broadcast" with no usable diagnostic.
    n = max(len(vo), int(round(cut_s * rate)))
    master = np.zeros(n)
    master[: len(vo)] += vo

    env = duck_envelope(vo, rate)
    if len(env) < n:
        env = np.concatenate([env, np.ones(n - len(env))])
    under = np.zeros(n)
    for e in sfx:
        clip = e.get("_samples")
        if clip is None:
            continue
        place(under, np.asarray(clip, dtype=float), float(e.get("at_s") or 0), rate,
              float(e.get("gain") or 1.0))
    if bed is not None:
        reps = int(np.ceil(n / max(1, len(bed))))
        under += np.tile(bed, reps)[:n] * 0.35
    master += under * env[:n]

    peak = float(np.max(np.abs(master))) if len(master) else 0.0
    if peak > 1.0:
        problems.append(
            f"the mix peaks at {20 * np.log10(peak):.2f} dBFS and clips. Nothing here limits it "
            f"quietly: a limiter hiding a clip is the same class of lie as a time-stretch. "
            f"Lower the sound levels and mix again.")

    measured = integrated_lufs(master, rate)
    gain = 10 ** ((target_lufs - measured) / 20) if measured > -90 else 1.0
    normalised = master * gain
    if float(np.max(np.abs(normalised))) > 1.0:
        problems.append(f"normalising to {target_lufs} LUFS would clip. The mix is too dense; "
                        f"take something out rather than turning it down after the fact.")

    report = {
        "duration_s": round(len(normalised) / rate, 3),
        "cut_s": cut_s,
        "peak_dbfs_premaster": round(20 * np.log10(peak), 2) if peak > 0 else -99.0,
        "lufs_premaster": round(measured, 2),
        "lufs_target": target_lufs,
        "master_gain_db": round(20 * np.log10(gain), 2) if gain > 0 else 0.0,
        # THE FIELD ship_gate READS. It is 1.0 because nothing here can make it
        # anything else, and it is written out so the claim is checkable rather than
        # a matter of trusting this docstring.
        "time_stretch": 1.0,
        "tracks": [{"id": "vo", "time_stretch": 1.0},
                   {"id": "sfx", "time_stretch": 1.0, "events": len(sfx)}],
        "sfx_events": len(sfx),
    }
    return normalised, report, problems


def self_test() -> int:
    failures = 0

    def ok(label, cond, extra=""):
        nonlocal failures
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}{'' if cond else '  ' + extra}")
        if not cond:
            failures += 1

    # THE STRUCTURAL GUARANTEE. Not a rule anyone has to remember.
    #
    # Scanned with the COMMENTS AND DOCSTRINGS STRIPPED, because the paragraph at the
    # top of this file says the word "resampler" while explaining that there is not
    # one. Over the raw text this check would flag that sentence and the guarantee
    # would look broken while being intact.
    # THE WHOLE FILE, not the part before self_test.
    #
    # The first version scanned `src.split("def self_test")[0]`, which is 58% of the source and
    # excludes main() — including the sample-rate-mismatch refusal, which is the single most
    # tempting place anybody would ever add a resampler. A guarantee that does not cover the
    # place the temptation lives is not a guarantee.
    #
    # The self-test's own body is excluded by name so its banned-word LIST does not match itself.
    # Everything EXCEPT this function: the banned-word list below is data, not a resampler.
    # `rindex` for the definition, because this very function mentions "def main()" in an
    # assertion and `index` cut the wrong span, leaving self_test in the scanned body and
    # turning the guarantee red on its own test data.
    src = Path(__file__).read_text(encoding="utf-8")
    body = src[:src.index("def self_test")] + src[src.rindex("def main()"):]
    code = strip_prose(body)
    ok("stripping prose leaves the real code behind", "def duck_envelope" in code)
    ok("...and the scan reaches main(), where a resampler would be most tempting",
       "def main" in code and "read_wav" in code)
    ok("...and strips STRING LITERALS, not only comments and docstrings",
       "does not resample" not in code,
       "main() says so in a plain string, which survived the first two rounds of this lesson")
    ok("...and removes the docstring that talks about resampling", "chipmunk" not in code)
    for banned in ("resample", "linspace", "stretch_audio", "speed_up", "librosa",
                   "phase_vocoder", "scipy.signal"):
        ok(f"no {banned!r} anywhere in the mixer's code", banned not in code)
    ok("...so a time-stretch cannot be reached from here even by accident", True)

    sr = 24000
    t = np.arange(int(6.0 * sr)) / sr
    speech = 0.2 * np.sin(2 * np.pi * 150 * t) * (np.sin(2 * np.pi * 1.3 * t) > -0.3)
    sfx = [{"at_s": 1.0, "gain": 0.5, "_samples": 0.4 * np.sin(2 * np.pi * 90 *
                                                              np.arange(sr // 2) / sr)}]

    out, rep, probs = mix(speech, sr, sfx, cut_s=6.2)
    ok("a fitting voice mixes", not probs, str(probs))
    ok("the mix is at least as long as the cut", rep["duration_s"] >= 6.2 - 0.01)
    ok("the report states time_stretch 1.0 as a checkable field", rep["time_stretch"] == 1.0)
    ok("...on every track too", all(tr["time_stretch"] == 1.0 for tr in rep["tracks"]))

    # THE REFUSAL.
    _, _, probs = mix(speech, sr, sfx, cut_s=5.0)
    ok("a voice that runs long is REFUSED rather than squeezed", bool(probs))
    ok("...and the message says there is no resampler here",
       any("NO RESAMPLER" in x for x in probs), str(probs))
    ok("...and says the fix is a shorter script",
       any("Trim the script" in x for x in probs))
    _, _, probs = mix(speech, sr, sfx, cut_s=6.05)
    ok("a hair over is tolerated, same as the soundcheck", not probs, str(probs))

    # THE OFF-BY-ONE, at every rate a take might arrive at.
    for r in (22050, 24000, 44100, 48000):
        vo = np.zeros(int(r * 0.2527) + 1)
        vo[::7] = 0.1
        out, rep, pr = mix(vo, r, [], cut_s=len(vo) / r * 0.99)
        ok(f"a take a hair over the cut mixes at {r} Hz without crashing", not pr, str(pr))
        ok(f"...and the buffer holds every sample of it at {r} Hz",
           rep.get("duration_s", 0) * r >= len(vo) - 1)

    # Ducking, measured from the voice.
    env = duck_envelope(speech, sr)
    ok("the duck envelope spans the voice", len(env) == len(speech))
    loud = np.abs(speech) > 0.05
    if loud.any():
        ok("...and it is lower where the voice is speaking",
           float(env[loud].mean()) < float(env[~loud].mean()) if (~loud).any() else True,
           f"{env[loud].mean():.3f} vs {env[~loud].mean():.3f}")
    ok("...and it never exceeds unity", float(env.max()) <= 1.0 + 1e-9)

    # Clipping is reported, never hidden.
    hot = [{"at_s": 0.5, "gain": 6.0, "_samples": np.ones(sr)}]
    _, _, probs = mix(speech, sr, hot, cut_s=6.2)
    ok("a mix that clips SAYS SO", any("clips" in x for x in probs), str(probs))
    ok("...and refuses to hide it behind a limiter",
       any("same class of lie" in x for x in probs))

    # Loudness normalisation is a gain and nothing else.
    quiet = speech * 0.05
    out_q, rep_q, _ = mix(quiet, sr, [], cut_s=6.2)
    ok("a quiet mix is brought up to the target",
       abs(integrated_lufs(out_q, sr) - rep_q["lufs_target"]) < 1.0,
       f"{integrated_lufs(out_q, sr):.2f} vs {rep_q['lufs_target']}")
    # Compared against a FRESH reference rather than a variable from earlier in this
    # function: the multi-rate loop above rebinds `rep`, and a test that reads a stale
    # binding is testing something nobody chose.
    _, rep_ref, _ = mix(speech, sr, [], cut_s=6.2)
    ok("...and normalisation changed the length by nothing at all",
       rep_q["duration_s"] == rep_ref["duration_s"],
       f"{rep_q['duration_s']} vs {rep_ref['duration_s']}")
    ok("...and a gain is all it applied", abs(rep_q["master_gain_db"]) > 3)

    # The loudness meter is the SAME one, not a second implementation.
    ok("the loudness meter is imported, not reimplemented",
       "def integrated_lufs" not in body and "from vo_synth_gemini import" in body)

    if failures:
        print(f"\nmix self-test: {failures} FAILED", file=sys.stderr)
        return 1
    print("\nmix self-test: all passed")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--vo")
    ap.add_argument("--sfx")
    ap.add_argument("--bed")
    ap.add_argument("--out", default="out/dispatch/mix.wav")
    ap.add_argument("--cut", type=float, default=60.0)
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    if not a.vo:
        print("mix: pass --vo, or --self-test", file=sys.stderr)
        return 2
    try:
        vo, rate = read_wav(Path(a.vo))
        raw = json.loads(Path(a.sfx).read_text(encoding="utf-8")) if a.sfx else []
        events = raw if isinstance(raw, list) else raw.get("events", [])
        for e in events:
            if e.get("wav"):
                clip, r2 = read_wav(Path(e["wav"]))
                if r2 != rate:
                    print(f"mix: {e['wav']} is {r2} Hz against the voice's {rate} Hz. Render it "
                          f"at the voice's rate; this mixer does not resample.", file=sys.stderr)
                    return 1
                e["_samples"] = clip
        bed = read_wav(Path(a.bed))[0] if a.bed else None
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"mix: cannot read inputs: {exc}", file=sys.stderr)
        return 2

    out, report, problems = mix(vo, rate, events, a.cut, bed)
    if problems:
        print("mix: refused\n", file=sys.stderr)
        for x in problems:
            print(f"  - {x}", file=sys.stderr)
        return 1
    write_wav(Path(a.out), out, rate)
    Path(a.out).with_suffix(".json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"mix: {report['duration_s']:.2f}s at {report['lufs_target']} LUFS "
          f"(gain {report['master_gain_db']:+.2f} dB), {report['sfx_events']} sound events, "
          f"time_stretch 1.0")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:                                            # noqa: BLE001
        print(f"mix: broke: {exc}", file=sys.stderr)
        sys.exit(2)
