#!/usr/bin/env python3
"""THE BEAT GRID. Where the music bed's beats fall, so the picture can land on them.

Motion designers cut, stamp and hit on the beat. The daily film's bed starts at sample zero and
tiles (scripts/mix.py), so a beat time measured on the track file is a beat time in the film. This
script measures every enabled track once and writes config/music/beats.json, a small committed
table. `lean.py time` copies the film's slice of it onto the board as `beats`, and the renderer
(video-engine/src/look/studio.tsx) lands label chips, the hook's words and the light pulse on them.

No librosa. It needs only numpy and the ffmpeg the pipeline already has, so CI needs nothing new:

  1. ONSET ENVELOPE. Mono at 11025 Hz, a 1024-point STFT every 256 samples, log magnitude, and the
     positive spectral flux summed across bins. Peaks are where notes start.
  2. TEMPO. Autocorrelate the envelope over lags from 70 to 180 BPM, weighted toward 120 (the
     tempo most pop and library music sits near), and keep the best lag. A parabolic fit refines it
     below one hop.
  3. PHASE. Slide a comb of that period across one period of offsets and keep the offset whose
     teeth sit on the most onset energy.
  4. BEATS. Lay the comb across the track, then pull each tooth to the strongest onset within 7% of
     a period, so a performance that drifts (the 1920s fiddle records) stays on its own beat.

Usage:
  python3 scripts/beat_grid.py                 # measure every enabled track with a file
  python3 scripts/beat_grid.py --track wholesome
  python3 scripts/beat_grid.py --selftest
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

REPO = Path(__file__).resolve().parents[1]
TRACKS = REPO / "config" / "music" / "tracks.json"
OUT = REPO / "config" / "music" / "beats.json"

SR = 11025
N_FFT = 1024
HOP = 256
BPM_MIN, BPM_MAX, BPM_PRIOR = 70.0, 180.0, 120.0
# An STFT frame is stamped at its first sample, but it hears a note at its centre, and the flux
# compares it with the frame before. Half a window plus one hop puts a beat back on the note.
LATENCY_S = (N_FFT / 2 + HOP) / SR


def decode(path: Path) -> np.ndarray:
    proc = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(SR),
                           "-f", "f32le", "-"], capture_output=True, check=True)
    return np.frombuffer(proc.stdout, dtype=np.float32).astype(np.float64)


def onset_envelope(y: np.ndarray) -> np.ndarray:
    if len(y) < N_FFT:
        return np.zeros(1)
    frames = 1 + (len(y) - N_FFT) // HOP
    idx = np.arange(N_FFT)[None, :] + HOP * np.arange(frames)[:, None]
    spec = np.abs(np.fft.rfft(y[idx] * np.hanning(N_FFT)[None, :], axis=1))
    logs = np.log1p(100.0 * spec)
    flux = np.maximum(0.0, np.diff(logs, axis=0)).sum(axis=1)
    flux = np.concatenate([[0.0], flux])
    # subtract a local mean so a crescendo does not read as a stream of onsets
    k = max(1, int(round(0.5 * SR / HOP)))
    local = np.convolve(flux, np.ones(2 * k + 1) / (2 * k + 1), mode="same")
    env = np.maximum(0.0, flux - local)
    peak = env.max()
    return env / peak if peak > 0 else env


def tempo(env: np.ndarray) -> tuple[float, float]:
    """Return (period in hops, confidence 0..1)."""
    fps = SR / HOP
    lo = int(np.floor(60.0 * fps / BPM_MAX))
    hi = int(np.ceil(60.0 * fps / BPM_MIN))
    e = env - env.mean()
    n = len(e)
    if n <= hi + 2:
        return 60.0 * fps / BPM_PRIOR, 0.0
    spec = np.fft.rfft(e, 2 * n)
    ac = np.fft.irfft(spec * np.conj(spec))[: hi + 2]
    ac = ac / (ac[0] if ac[0] > 0 else 1.0)
    lags = np.arange(lo, hi + 1)
    bpm = 60.0 * fps / lags
    prior = np.exp(-0.5 * (np.log2(bpm / BPM_PRIOR) / 0.9) ** 2)
    score = ac[lags] * prior
    i = int(np.argmax(score))
    lag = float(lags[i])
    if 0 < i < len(lags) - 1:   # parabolic refinement between hops
        a, b, c = score[i - 1], score[i], score[i + 1]
        den = a - 2 * b + c
        if den != 0:
            lag += 0.5 * (a - c) / den
    conf = float(max(0.0, min(1.0, ac[lags[i]])))
    return lag, conf


def beats_from(env: np.ndarray, period: float) -> list[float]:
    n = len(env)
    if n == 0 or period <= 0:
        return []
    offsets = np.arange(0.0, period, 0.5)
    best, best_off = -1.0, 0.0
    for off in offsets:
        teeth = np.arange(off, n, period).round().astype(int)
        teeth = teeth[teeth < n]
        s = env[teeth].sum()
        if s > best:
            best, best_off = s, off
    win = max(1, int(round(0.07 * period)))
    out = []
    for t in np.arange(best_off, n, period):
        c = int(round(t))
        a, b = max(0, c - win), min(n, c + win + 1)
        if a >= b:
            continue
        seg = env[a:b]
        j = a + int(np.argmax(seg)) if seg.max() > 0.08 else c
        out.append(j * HOP / SR + LATENCY_S)
    # a pulled tooth can never pass its neighbour
    clean = []
    for t in out:
        if not clean or t - clean[-1] > 0.5 * period * HOP / SR:
            clean.append(round(t, 3))
    return clean


def measure(y: np.ndarray) -> dict:
    env = onset_envelope(y)
    period, conf = tempo(env)
    bpm = 60.0 * SR / HOP / period
    return {"bpm": round(bpm, 2), "confidence": round(conf, 3), "duration_s": round(len(y) / SR, 3),
            "beats": beats_from(env, period)}


def slice_for(entry: dict, runtime_s: float) -> list[float]:
    """The film's beats: the track's beats, repeated as mix.py tiles the bed, up to runtime_s."""
    beats = [float(b) for b in entry.get("beats", [])]
    dur = float(entry.get("duration_s") or 0)
    if not beats or dur <= 0:
        return []
    out, k = [], 0
    while True:
        base = k * dur
        if base > runtime_s:
            break
        out.extend(round(base + b, 3) for b in beats if base + b <= runtime_s)
        k += 1
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--track", action="append")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        return selftest()
    tracks = json.loads(TRACKS.read_text())
    table = json.loads(OUT.read_text()) if OUT.exists() else {}
    for t in tracks:
        if a.track and t["id"] not in a.track:
            continue
        if not a.track and not t.get("enabled"):
            continue
        path = REPO / t["file"]
        if not path.exists():
            print(f"skip {t['id']}: {t['file']} is not in this checkout")
            continue
        entry = measure(decode(path))
        table[t["id"]] = entry
        print(f"{t['id']}: {entry['bpm']} BPM, confidence {entry['confidence']}, {len(entry['beats'])} beats "
              f"over {entry['duration_s']} s")
    OUT.write_text(json.dumps(dict(sorted(table.items())), indent=1) + "\n")
    print(f"wrote {OUT.relative_to(REPO)}")
    return 0


def selftest() -> int:
    fails = 0

    def ok(name: str, cond: bool) -> None:
        nonlocal fails
        print(("PASS " if cond else "FAIL ") + name)
        fails += 0 if cond else 1

    for bpm in (96.0, 120.0, 140.0):
        dur, step = 20.0, 60.0 / bpm
        y = np.zeros(int(SR * dur))
        click = np.exp(-np.arange(400) / 60.0) * np.sin(2 * np.pi * 1800 * np.arange(400) / SR)
        first = 0.31
        for t in np.arange(first, dur - 0.1, step):
            i = int(t * SR)
            y[i:i + 400] += click
        m = measure(y)
        ok(f"a {bpm:.0f} BPM click track measures within 2 BPM", abs(m["bpm"] - bpm) < 2.0)
        errs = [min(abs(b - t) for t in np.arange(first, dur, step)) for b in m["beats"]]
        ok(f"every {bpm:.0f} BPM beat lands within 30 ms of a click", max(errs) < 0.03)
    s = slice_for({"beats": [0.5, 1.0], "duration_s": 1.2}, 3.0)
    ok("the film's slice repeats the beats as the bed tiles", s == [0.5, 1.0, 1.7, 2.2, 2.9])
    ok("an empty entry gives no beats", slice_for({}, 10.0) == [])
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
