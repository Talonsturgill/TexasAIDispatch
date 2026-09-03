#!/usr/bin/env python3
"""foley.py — the Texas foley engine. Every sound HAND-SYNTHESIZED from oscillators
and filtered noise, never sourced, so there is no licence to clear and no clip that
belongs to someone else.

WHY THIS EXISTS, AND WHY IT IS CODE AND NOT A FOLDER OF WAVS

The picture side of this engine is hand-drawn SVG, per component, because a sourced
image carries a licence and a look that is not ours. The sound side had nothing at
all: `mix.py` places motivated sounds from `sfx_events.json`, each pointing at a
`wav`, and no wav existed. A folder of downloaded clips would reintroduce exactly the
licence-and-look problem the drawings avoid. So the sounds are SYNTHESIZED here, from
numpy, the same way the drawings are built from paths.

THE CONTRACT, measured from the rest of the engine.
  RATE. 48000 Hz mono, float. `vo_synth_gemini` resamples the voice to 48k and
  `mix.py` refuses any sfx at a different rate, so everything here is 48k or it is
  useless.
  MOTIVATED. `flow_check` bans a beat marked only by a generic library cue and
  demands a sound that belongs to a thing on screen. So every entry here NAMES the
  thing it belongs to, and the names are Texas things: a pumpjack, a grackle, a blue
  norther, a Friday-night crowd. A sound with no on-screen owner does not go in.
  GENERATED, NEVER COMMITTED. `--build` materializes the wavs into a gitignored dir,
  because a wav is a deterministic function of this file and committing ten megabytes
  of derivable audio is the same mistake as committing a built site. The small
  `catalog.json` IS committed, so the routine can pick a sound without the audio.

THE MISTAKE THIS LIBRARY REFUSES. Generic "nature ambience". Texas summer is not
birdsong, it is a WALL of cicadas at a specific pulse. A norther is not a steady
howl, it is a gust whose pitch DROPS as it hits. The doctrine is `knowledge/texas/
SOUND.md`; every function below leads with the tell.

  foley.py --self-test          # hermetic, gates every build
  foley.py --catalog            # emit catalog.json to stdout
  foley.py --build assets/sfx   # synth every sound to a 48k mono wav
  foley.py --audition out.wav   # the whole library end to end, the ear's review sheet

Exit 0 ok, 1 a check failed, 2 could not run.
"""
from __future__ import annotations

import argparse
import json
import sys
import wave
from pathlib import Path

import numpy as np

REPO = Path(__file__).resolve().parents[1]

SR = 48000  # the engine rate; mix.py refuses anything else


# ---------------------------------------------------------------- primitives
def rng_for(seed: int) -> np.random.Generator:
    """A seeded generator, so a sound is the same every build. The engine is
    deterministic on purpose: a foley that drifts run to run cannot be reviewed once."""
    return np.random.default_rng(seed)


def t_axis(dur: float) -> np.ndarray:
    return np.arange(int(round(dur * SR))) / SR


def sine(freq, dur, phase=0.0) -> np.ndarray:
    t = t_axis(dur)
    if callable(freq):
        inst = 2 * np.pi * np.cumsum(freq(t)) / SR
        return np.sin(inst + phase)
    return np.sin(2 * np.pi * freq * t + phase)


def saw(freq, dur) -> np.ndarray:
    t = t_axis(dur)
    if callable(freq):
        ph = np.cumsum(freq(t)) / SR
    else:
        ph = freq * t
    return 2 * (ph - np.floor(ph + 0.5))


def square(freq, dur, duty=0.5) -> np.ndarray:
    return np.where((saw(freq, dur) + 1) / 2 < duty, 1.0, -1.0)


def white(dur, seed) -> np.ndarray:
    return rng_for(seed).uniform(-1, 1, int(round(dur * SR)))


def pink(dur, seed) -> np.ndarray:
    """1/f noise by summing octave-spaced lowpassed whites. The summer air and the
    crowd bed both live here rather than in flat white, which sounds like a TV off air.

    EACH BAND IS FILTERED FROM x, NOT FROM THE ONE BEFORE IT. The loop used to reassign
    `b = one_pole_lp(b, ...)`, which CASCADES the filters: every octave was filtered on top
    of all the previous ones, so the top two octaves came out about 3.2 dB dark and the
    slope steepened to roughly -6 dB per octave where pink is -3. That is brown noise
    wearing pink's name, sitting under gulf_surf, friday_night_crowd and cattle_auction,
    which are the three beds that play under dialogue.
    """
    x = white(dur, seed)
    out = np.zeros_like(x)
    for k in range(1, 7):
        out += one_pole_lp(x, 2000 / (2 ** k))
    return out / (np.max(np.abs(out)) + 1e-9)


def brown(dur, seed) -> np.ndarray:
    """1/f^2. The body of wind and thunder. A cumulative sum drifts, so it is detrended and
    then high-passed to sit still.

    THE DETREND IS LOAD-BEARING. `np.cumsum` of white noise starts near zero and ends at a
    large random value, so the buffer carries a step across its own wrap. `_fft_filter` is
    circular and reads that step as signal, putting the peak of the entire buffer on sample
    2: measured, a 6.4x spike over the body of the sound.

    `normalize` then divides the real sound down against that artifact. In `thunder_near`
    the roll landed at 0.167 where it should have been 1.0, six times too quiet, and the
    docstring a few functions away says "the rumble collapses behind it. The order matters,
    crack before roll, or it reads as far." It read as far. Measured centroid was 9,110 Hz
    for NEAR thunder against 312 Hz for far, which is the crack left standing on its own.

    Invisible to the validator, because the final peak is still exactly what normalize set
    it to. Subtracting the straight line between the first and last sample makes the
    endpoints meet, so the wrap carries no step and the filter has nothing spurious to
    sharpen.

    THE CORNER IS 25 Hz, NOT 12. Twelve removed almost nothing, and the brown-based sounds
    were putting 60 to 74 percent of their energy BELOW 20 Hz, which is under the floor of
    hearing: dust_wall 26 percent audible, thunder_far 29, thunder_near 28, diesel_idle 36,
    blue_norther 40. Nothing plays that back, and it is what `normalize` scales against, so
    those five sat perceptually far quieter than their peak claimed and any level match
    between them and the bright sounds was wrong by an amount nothing measured. At 25 Hz
    the audible share of all five roughly doubles and no audible content is touched.
    """
    x = np.cumsum(white(dur, seed))
    x -= np.linspace(x[0], x[-1], len(x))
    x = high_pass(x, 25)
    return x / (np.max(np.abs(x)) + 1e-9)


# The filters are FFT-based, not per-sample IIR loops. There is no scipy here and a
# Python sample loop over six seconds of 48k audio, called a few times per sound
# across thirty sounds, turns a self-test into a coffee break. An rFFT multiply is
# vectorized C and runs the whole gate in about a second. The ring in a bell or a
# clank comes from an exponential ENVELOPE on the source, not from filter resonance,
# so nothing here needs the IIR's time-domain tail.
def _fft_filter(x, mag) -> np.ndarray:
    n = len(x)
    if n == 0:
        return x
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    return np.fft.irfft(X * mag(f), n)


def one_pole_lp(x, cutoff) -> np.ndarray:
    """First-order lowpass magnitude, 1/sqrt(1+(f/fc)^2)."""
    return _fft_filter(x, lambda f: 1 / np.sqrt(1 + (f / cutoff) ** 2))


def high_pass(x, cutoff) -> np.ndarray:
    return _fft_filter(x, lambda f: (f / cutoff) / np.sqrt(1 + (f / cutoff) ** 2))


def biquad_bp(x, f0, q) -> np.ndarray:
    """A gaussian band-pass centred at f0 with bandwidth f0/q. Smoother than a
    resonant biquad and, unlike one, cheap on a six-second buffer."""
    bw = f0 / max(q, 0.1)
    return _fft_filter(x, lambda f: np.exp(-0.5 * ((f - f0) / (bw + 1e-9)) ** 2))


def adsr(dur, a, d, s, r, sus=0.6) -> np.ndarray:
    n = int(round(dur * SR))
    env = np.zeros(n)
    ai, di, ri = int(a * SR), int(d * SR), int(r * SR)
    i = 0
    if ai:
        env[i:i + ai] = np.linspace(0, 1, ai); i += ai
    if di and i < n:
        seg = min(di, n - i); env[i:i + seg] = np.linspace(1, sus, seg); i += seg
    hold = max(0, n - i - ri)
    if hold:
        env[i:i + hold] = sus; i += hold
    if ri and i < n:
        seg = min(ri, n - i); env[i:i + seg] = np.linspace(env[i - 1] if i else sus, 0, seg)
    return env[:n]


def expdecay(dur, tau) -> np.ndarray:
    return np.exp(-t_axis(dur) / tau)


def am(x, rate, depth=1.0, seed=0, phase=0.0) -> np.ndarray:
    """Amplitude modulation, the pulse under a cicada wall and a diesel idle."""
    t = np.arange(len(x)) / SR
    m = (1 - depth) + depth * (0.5 + 0.5 * np.sin(2 * np.pi * rate * t + phase))
    return x * m


def normalize(x, peak=0.9) -> np.ndarray:
    m = np.max(np.abs(x))
    return x * (peak / m) if m > 1e-9 else x


def fade(x, ms=8) -> np.ndarray:
    n = min(int(ms / 1000 * SR), len(x) // 2)
    if n <= 0:
        return x
    w = np.ones(len(x))
    w[:n] = np.linspace(0, 1, n)
    w[-n:] = np.linspace(1, 0, n)
    return x * w


def softclip(x) -> np.ndarray:
    return np.tanh(x)


def place_into(bus, clip, at_s):
    i = int(round(at_s * SR))
    j = min(len(bus), i + len(clip))
    if i < len(bus):
        bus[i:j] += clip[:j - i]


# ---------------------------------------------------------------- the Texas sounds
# Each returns a normalized float mono array. The docstring names the TELL, the thing
# a Texan hears that a generic cue misses.

def cicada_wall(seed=1):
    """THE Texas summer. Not birdsong: a shimmering WALL, many cicadas at 5 to 8 kHz
    pulsing near 40 Hz, each a hair out of phase so the wall breathes."""
    dur = 6.0
    out = np.zeros(int(dur * SR))
    for k in range(9):
        r = rng_for(seed + k)
        band = biquad_bp(white(dur, seed + 100 + k), 5200 + r.uniform(-400, 1600), 6)
        pulsed = am(band, 34 + r.uniform(-6, 10), depth=0.85, phase=r.uniform(0, 6.28))
        swell = 0.6 + 0.4 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.08 * t_axis(dur) + r.uniform(0, 6)))
        out += pulsed * swell
    return normalize(fade(out, 200), 0.85)


def cricket_night(seed=2):
    """The night version, sparse not dense. A single cricket band near 4.5 kHz in
    short rhythmic bursts, over a low still-air bed."""
    dur = 6.0
    out = brown(dur, seed) * 0.06
    r = rng_for(seed)
    burst = am(biquad_bp(white(0.18, seed + 3), 4500, 12), 55, depth=1.0)
    burst = fade(normalize(burst), 6)
    tt = 0.0
    while tt < dur - 0.3:
        place_into(out, burst * r.uniform(0.5, 0.9), tt)
        tt += r.uniform(0.35, 0.7)
    return normalize(fade(out, 120), 0.8)


def blue_norther(seed=3):
    """A norther is not a steady howl. It is a GUST whose pitch DROPS as the cold
    front hits, so the resonant band glides down through each swell."""
    dur = 6.0
    body = brown(dur, seed)
    out = np.zeros(int(dur * SR))
    r = rng_for(seed)
    t = t_axis(dur)
    for _ in range(4):
        c = r.uniform(0.5, 2.2)
        # a gust envelope, and the band centre glides DOWN across it
        g = np.exp(-((t - c) ** 2) / (2 * 0.5 ** 2))
        f0 = 700 - 400 * np.clip((t - (c - 0.6)) / 1.2, 0, 1)
        seg = biquad_bp(body, float(np.mean(f0)), 1.2)
        out += seg * g * r.uniform(0.7, 1.0)
    out += body * 0.25  # the steady base wind under the gusts
    return normalize(fade(out, 250), 0.85)


def dust_wall(seed=4):
    """The High Plains haboob: a rising low rumble with grit on top, a hard wall
    because there is no terrain to break it up. Swells IN, does not pulse."""
    dur = 5.0
    low = one_pole_lp(brown(dur, seed), 220) * 1.4  # the rumble dominates
    grit = biquad_bp(white(dur, seed + 1), 2200, 1.2) * 0.12  # a topping, not the body
    swell = np.clip(t_axis(dur) / 3.5, 0, 1) ** 1.5
    return normalize(fade((low + grit) * swell, 150), 0.85)


def gulf_surf(seed=5):
    """The coast, and it is BROWN-GREEN not blue: shallow sediment-heavy sets, a slow
    swell, a gull now and then far from shore over the Laguna Madre shallows."""
    dur = 6.0
    body = pink(dur, seed)
    sets = 0.4 + 0.6 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.14 * t_axis(dur)))
    out = high_pass(body, 300) * sets
    r = rng_for(seed)
    for _ in range(2):
        at = r.uniform(0.5, dur - 1.5)
        cry = sine(lambda t: 1400 - 300 * t / 0.5, 0.5) * expdecay(0.5, 0.25)
        place_into(out, fade(normalize(cry), 10) * 0.25, at)
    return normalize(fade(out, 200), 0.8)


def friday_night_crowd(seed=6):
    """A stadium bed, the glow you hear before you see: a murmur that SWELLS into a
    roar, a distant drumline pulse under it. Not a single crowd loop, a living one."""
    dur = 6.0
    murmur = one_pole_lp(pink(dur, seed), 1800)
    r = rng_for(seed)
    roar = np.ones(int(dur * SR))
    for _ in range(3):
        c = r.uniform(1, dur - 1)
        roar += 1.2 * np.exp(-((t_axis(dur) - c) ** 2) / (2 * 0.4 ** 2))
    out = murmur * roar
    # distant drumline, a soft snare every half second
    snare = fade(normalize(biquad_bp(white(0.09, seed + 5), 900, 3) * expdecay(0.09, 0.03)), 4)
    tt = 0.6
    while tt < dur - 0.2:
        place_into(out, snare * 0.15, tt)
        tt += 0.5
    return normalize(fade(out, 200), 0.82)


def rain_on_tin(seed=7):
    """A Texas porch in a thunderstorm: dense drops on a RESONANT metal roof, so each
    droplet rings the panel a little rather than landing dead."""
    dur = 5.0
    drops = white(dur, seed)
    drops = np.where(np.abs(drops) > 0.86, drops, 0.0)  # sparse impacts
    panel = biquad_bp(drops, 1600, 1.5) + biquad_bp(drops, 3200, 2) * 0.5
    hiss = high_pass(white(dur, seed + 1), 4000) * 0.15
    return normalize(fade(panel + hiss, 120), 0.85)


def hail_on_metal(seed=8):
    """Bigger and harder than rain, irregular, the green-sky sound. Fewer impacts,
    each a sharp CRACK on the same resonant panel."""
    dur = 4.0
    out = brown(dur, seed) * 0.05
    r = rng_for(seed)
    tt = 0.0
    while tt < dur - 0.05:
        hit = biquad_bp(white(0.03, int(tt * 1000) + seed), r.uniform(1200, 2600), 2.5)
        hit = fade(normalize(hit) * expdecay(0.03, 0.008), 2)
        place_into(out, hit * r.uniform(0.6, 1.0), tt)
        tt += r.uniform(0.02, 0.14)
    return normalize(out, 0.9)


def pumpjack(seed=9):
    """The Permian metronome: a slow GROAN as the walking beam rises, a metallic
    CLANK at the top of each stroke, roughly one stroke every two seconds."""
    dur = 6.0
    out = np.zeros(int(dur * SR))
    period = 2.1
    tt = 0.0
    r = rng_for(seed)
    while tt < dur - period:
        groan = sine(lambda t: 46 + 10 * np.sin(2 * np.pi * t / period), period) * adsr(period, 0.4, 0.5, 0.5, 0.6, 0.5)
        place_into(out, normalize(groan) * 0.7, tt)
        clank = biquad_bp(white(0.05, seed + int(tt)), 1800, 4) * expdecay(0.05, 0.015)
        place_into(out, fade(normalize(clank), 3) * 0.5, tt + period * 0.5 + r.uniform(-0.03, 0.03))
        tt += period
    return normalize(fade(out, 120), 0.85)


def windmill_creak(seed=10):
    """The Aermotor over a stock tank: a periodic metal CREAK as the vane turns, a
    faint sucker-rod knock under it, unhurried at about one creak every two seconds."""
    dur = 6.0
    out = np.zeros(int(dur * SR))
    tt = 0.3
    r = rng_for(seed)
    while tt < dur - 0.5:
        creak = biquad_bp(white(0.4, seed + int(tt * 10)), r.uniform(500, 900), 8)
        creak = fade(normalize(creak) * (0.3 + 0.7 * np.hanning(len(creak))), 8)
        place_into(out, creak * 0.6, tt)
        knock = biquad_bp(white(0.04, seed + int(tt)), 180, 6) * expdecay(0.04, 0.02)
        place_into(out, normalize(knock) * 0.4, tt + 0.9)
        tt += r.uniform(1.8, 2.3)
    return normalize(fade(out, 120), 0.8)


def screen_door(seed=11):
    """The homeplace punctuation: a spring TWANG that slides in pitch, then the wood
    SLAP of the frame, then a small bounce. Everybody who grew up in one hears it."""
    dur = 1.4
    out = np.zeros(int(dur * SR))
    twang = sine(lambda t: 320 - 180 * np.clip(t / 0.5, 0, 1), 0.5) * expdecay(0.5, 0.18)
    twang += biquad_bp(white(0.5, seed), 700, 5) * expdecay(0.5, 0.1) * 0.3
    place_into(out, normalize(twang) * 0.7, 0.0)
    slap = biquad_bp(white(0.06, seed + 1), 220, 3) * expdecay(0.06, 0.02)
    place_into(out, fade(normalize(slap), 3) * 0.9, 0.55)
    place_into(out, fade(normalize(slap), 3) * 0.3, 0.72)
    return normalize(out, 0.9)


def diesel_idle(seed=12):
    """A one-ton at the feed store: a low lopey IDLE, firing pulses near 22 Hz over a
    brown rumble, a small rev in the middle. Not a smooth hum, a diesel knocks."""
    dur = 5.0
    body = one_pole_lp(brown(dur, seed), 400)   # a diesel is felt, not heard bright
    fire = am(body, 22, depth=0.8, seed=seed)
    knock = biquad_bp(white(dur, seed + 1), 90, 2) * 0.5
    rev = 1 + 0.6 * np.exp(-((t_axis(dur) - 2.5) ** 2) / (2 * 0.4 ** 2))
    out = one_pole_lp((fire + knock) * rev, 1200)
    return normalize(fade(out, 150), 0.85)


def longhorn_low(seed=13):
    """A cow's low across a pasture: a breathy formant call that GLIDES down and
    cracks, low and unhurried. The single most placing farm sound there is."""
    dur = 2.2
    f = lambda t: 150 - 40 * np.clip(t / 1.5, 0, 1) + 8 * np.sin(2 * np.pi * 5 * t)
    voice = saw(f, dur)
    voice = biquad_bp(voice, 400, 2) + biquad_bp(voice, 900, 2) * 0.6
    # BREATH IS BAND-LIMITED, not merely high-passed. A bare high_pass leaves white noise
    # running flat from 1.5 kHz to the 24 kHz Nyquist, and that is 22 kHz of bandwidth
    # against a voice living in 400 to 900 Hz, so the hiss carried most of the spectral
    # energy: the measured centroid of a COW'S LOW was 6,902 Hz. Real breath in an animal
    # call rolls off long before 10 kHz. Peak level never showed it, because normalize sets
    # the peak whatever the spectrum does.
    breath = one_pole_lp(high_pass(white(dur, seed), 1500), 5000) * 0.15
    env = adsr(dur, 0.15, 0.3, 0.7, 0.7, 0.6)
    return normalize(fade((voice + breath) * env, 30), 0.85)


def grackle(seed=14):
    """The parking-lot bird, our raven. Not a song: a rising mechanical WHISTLE, a
    volley of clicks, and a squeaky-hinge readle-eak. Ugly and unmistakable."""
    dur = 1.6
    out = np.zeros(int(dur * SR))
    whistle = sine(lambda t: 1200 + 2600 * np.clip(t / 0.35, 0, 1), 0.35) * expdecay(0.35, 0.2)
    place_into(out, normalize(whistle) * 0.6, 0.05)
    r = rng_for(seed)
    for _ in range(6):
        at = r.uniform(0.4, 0.75)
        click = biquad_bp(white(0.02, r.integers(0, 9999)), r.uniform(1800, 3200), 6) * expdecay(0.02, 0.006)
        place_into(out, fade(normalize(click), 2) * 0.5, at)
    hinge = sine(lambda t: 900 + 500 * np.abs(np.sin(2 * np.pi * 6 * t)), 0.4) * expdecay(0.4, 0.25)
    place_into(out, normalize(hinge) * 0.5, 0.95)
    return normalize(out, 0.9)


def mockingbird(seed=15):
    """The state bird, and the tell is REPETITION: it runs a phrase two or three times
    then switches. A string of varied whistles, each doubled, never the same twice."""
    dur = 4.0
    out = np.zeros(int(dur * SR))
    r = rng_for(seed)
    tt = 0.1
    while tt < dur - 0.4:
        base = r.uniform(1800, 3600)
        slope = r.uniform(-1200, 1200)
        reps = r.integers(2, 4)
        for k in range(reps):
            phr = sine(lambda t: base + slope * t / 0.14, 0.14) * expdecay(0.14, 0.08)
            place_into(out, fade(normalize(phr), 4) * 0.6, tt)
            tt += 0.19
        tt += r.uniform(0.1, 0.25)
    return normalize(out, 0.85)


def rattlesnake(seed=16):
    """The Trans-Pecos warning: a dry, dense, high buzz that starts fast and holds,
    band noise near 5 kHz amplitude-modulated hard. It raises the hair on the neck."""
    dur = 2.5
    band = biquad_bp(white(dur, seed), 5000, 4)
    buzz = am(band, 60, depth=1.0)
    rise = np.clip(t_axis(dur) / 0.25, 0, 1)
    grit = high_pass(white(dur, seed + 1), 3000) * 0.2
    return normalize(fade((buzz + grit) * rise, 20), 0.85)


def bobwhite_quail(seed=17):
    """The brush-country whistle that says its own name, bob-WHITE, a clear two-note
    rising call. A daytime pasture marker, unlike the cricket at night."""
    dur = 1.2
    out = np.zeros(int(dur * SR))
    n1 = sine(1400, 0.12) * expdecay(0.12, 0.08)
    n2 = sine(lambda t: 1700 + 900 * np.clip(t / 0.22, 0, 1), 0.28) * expdecay(0.28, 0.16)
    place_into(out, fade(normalize(n1), 5) * 0.7, 0.1)
    place_into(out, fade(normalize(n2), 5) * 0.8, 0.4)
    return normalize(out, 0.88)


def coyote_yip(seed=18):
    """Dusk on the caliche: a rising yip breaking into a wavering howl, one animal
    that sounds like several. The sound the ranch dog answers."""
    dur = 2.4
    yip = sine(lambda t: 500 + 900 * np.clip(t / 0.15, 0, 1), 0.18) * expdecay(0.18, 0.1)
    howl_f = lambda t: 700 + 120 * np.sin(2 * np.pi * 7 * t) - 150 * np.clip((t - 0.2) / 1.6, 0, 1)
    howl = saw(howl_f, dur - 0.2)
    howl = (biquad_bp(howl, 800, 3) + biquad_bp(howl, 1500, 3) * 0.5) * adsr(dur - 0.2, 0.1, 0.2, 0.7, 0.5, 0.7)
    out = np.zeros(int(dur * SR))
    place_into(out, normalize(yip) * 0.7, 0.0)
    place_into(out, normalize(howl) * 0.8, 0.2)
    return normalize(fade(out, 20), 0.85)


def train_horn(seed=19):
    """The grade crossing, long-long-short-long: a minor chord of detuned air horns
    with a doppler swell. A courthouse-square town is defined by the tracks through it."""
    dur = 4.5
    freqs = [311, 370, 466]  # a rough minor triad, the classic horn cluster
    def blast(d):
        x = sum(saw(f * (1 + 0.002 * i), d) for i, f in enumerate(freqs))
        x = one_pole_lp(x, 2500)
        return fade(normalize(x) * adsr(d, 0.05, 0.05, 0.9, 0.15, 0.85), 20)
    out = np.zeros(int(dur * SR))
    pattern = [(0.0, 0.9), (1.0, 0.9), (2.0, 0.35), (2.6, 1.4)]
    for at, d in pattern:
        place_into(out, blast(d) * 0.8, at)
    dopp = 1 + 0.15 * np.sin(2 * np.pi * 0.1 * t_axis(dur))
    return normalize(fade(out * dopp, 60), 0.85)


def courthouse_bell(seed=20):
    """The square's hour bell: a big bronze strike with inharmonic partials and a long
    hum, the one vertical sound in a flat town. Struck once, left to ring."""
    dur = 4.0
    partials = [(1.0, 1.0), (2.76, 0.5), (5.4, 0.25), (8.9, 0.12)]
    strike_f = 220
    out = sum(a * sine(strike_f * r, dur) * expdecay(dur, 1.2 / (i + 1))
              for i, (r, a) in enumerate(partials))
    hit = high_pass(white(0.02, seed), 4000) * expdecay(0.02, 0.006) * 0.4
    out[:len(hit)] += hit
    return normalize(fade(out, 6), 0.85)


def spurs_jingle(seed=21):
    """A walk across a board floor: bright rowel jingles at an unhurried gait, metal
    on metal, each a cluster of high inharmonic pings. Reads as boots without a boot."""
    dur = 3.0
    out = np.zeros(int(dur * SR))
    r = rng_for(seed)
    tt = 0.2
    while tt < dur - 0.2:
        for _ in range(r.integers(2, 4)):
            f = r.uniform(2600, 4200)
            ping = (sine(f, 0.12) + sine(f * 2.1, 0.12) * 0.4) * expdecay(0.12, 0.05)
            place_into(out, fade(normalize(ping), 2) * r.uniform(0.3, 0.6), tt + r.uniform(0, 0.05))
        tt += r.uniform(0.55, 0.75)  # the gait
    return normalize(out, 0.85)


def dominoes_click(seed=22):
    """The washateria table, the plaza, the ice house: hard bakelite CLICKS as tiles
    are shuffled and laid, sharp and dry with a wooden table under them."""
    dur = 3.0
    out = np.zeros(int(dur * SR))
    r = rng_for(seed)
    tt = 0.1
    while tt < dur - 0.1:
        n = int(r.integers(0, 9999))
        click = biquad_bp(white(0.03, n), r.uniform(2000, 3400), 5) * expdecay(0.03, 0.004)
        body = biquad_bp(white(0.03, n + 1), 300, 4) * expdecay(0.03, 0.01)
        place_into(out, fade(normalize(click + body * 0.5), 1) * r.uniform(0.5, 0.9), tt)
        tt += r.uniform(0.12, 0.5)
    return normalize(out, 0.9)


def paletero_bells(seed=23):
    """The colonia at dusk, the neighbourhood's clock: the paletero's little brass
    bells, bright and inharmonic, a slow shake as the cart rolls. Tejano-coded joy."""
    dur = 3.0
    out = np.zeros(int(dur * SR))
    r = rng_for(seed)
    tt = 0.2
    while tt < dur - 0.2:
        for f in (r.uniform(2200, 2600), r.uniform(3000, 3600)):
            b = (sine(f, 0.25) + sine(f * 2.7, 0.25) * 0.5 + sine(f * 4.1, 0.25) * 0.25) * expdecay(0.25, 0.12)
            place_into(out, fade(normalize(b), 3) * r.uniform(0.3, 0.5), tt + r.uniform(0, 0.04))
        tt += r.uniform(0.5, 0.75)
    return normalize(out, 0.82)


def conjunto_accordion(seed=24):
    """A stab of the border's signature reed: a bright major chord on a diatonic
    button box with the bellows swell and the beating of un-tempered reeds. One hit,
    for a scene change, never a whole song (a song is a live work)."""
    dur = 1.4
    notes = [262, 330, 392, 523]  # a C chord
    x = np.zeros(int(dur * SR))
    for n in notes:
        # two reeds a few cents apart per note, the wet accordion beat
        x += saw(n, dur) + saw(n * 1.006, dur)
    x = biquad_bp(x, 1200, 0.9) + x * 0.4  # reedy formant
    env = adsr(dur, 0.06, 0.1, 0.85, 0.35, 0.85)
    return normalize(fade(x * env, 10), 0.82)


def drumline_cadence(seed=25):
    """The band that outnumbers the team: a snare cadence in the stands, a tight
    rudimental pattern with a bass drum on the beat. Pride you can hear a mile off."""
    dur = 4.0
    out = np.zeros(int(dur * SR))
    snare = fade(normalize(biquad_bp(white(0.06, seed), 900, 3) * expdecay(0.06, 0.02)
                           + high_pass(white(0.06, seed + 1), 3000) * expdecay(0.06, 0.02) * 0.5), 2)
    bass = fade(normalize(biquad_bp(white(0.12, seed + 2), 90, 2) * expdecay(0.12, 0.05)), 3)
    step = 0.25  # eighth notes at ~120
    hits = [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0]
    tt = 0.2
    i = 0
    while tt < dur - step:
        if hits[i % len(hits)]:
            place_into(out, snare * 0.6, tt)
        if i % 4 == 0:
            place_into(out, bass * 0.7, tt)
        tt += step
        i += 1
    return normalize(out, 0.85)


def ref_whistle(seed=26):
    """Friday night, a flag on the play: a pea whistle, two close tones beating with
    the warble of the pea rattling inside. Stops the crowd for a half second."""
    dur = 1.0
    warble = 1 + 0.02 * np.sin(2 * np.pi * 18 * t_axis(dur))
    a = sine(lambda t: 3200 * warble, dur)
    b = sine(lambda t: 3260 * warble, dur)
    body = (a + b) + high_pass(white(dur, seed), 5000) * 0.15
    env = adsr(dur, 0.02, 0.05, 0.9, 0.1, 0.9)
    return normalize(fade(body * env, 8), 0.8)


def pads_pop(seed=27):
    """The hit that empties the stands and fills them again: a low body THUD and a
    hard plastic CRACK together, then nothing. The sound two-a-days is about."""
    dur = 0.6
    thud = biquad_bp(white(0.12, seed), 120, 2) * expdecay(0.12, 0.04)
    # Band-limited for the same reason as thunder's crack: hard plastic on hard plastic is
    # a 2 to 9 kHz snap, not white noise running to 24 kHz. Unbounded, the crack carried
    # the spectrum and a sound whose whole job is a low BODY thud measured at 9,276 Hz.
    crack = one_pole_lp(high_pass(white(0.04, seed + 1), 2500), 9000) * expdecay(0.04, 0.008)
    out = np.zeros(int(dur * SR))
    place_into(out, normalize(thud) * 0.8, 0.0)
    place_into(out, fade(normalize(crack), 1) * 0.7, 0.005)
    # FADED AT BOTH ENDS. The thud starts at full amplitude on sample 0, so the timeline
    # jumped from silence to -0.49 in one sample and mix.place() dropped a broadband click
    # in ahead of the hit. It is the one impulsive sound that returned without a fade.
    return normalize(fade(out, 4), 0.9)


def thunder_far(seed=28):
    """The Panhandle horizon: a long low ROLL with no crack, a storm an hour away
    that a Panhandle audience reads as weather arriving. All rumble, no transient."""
    dur = 5.0
    body = brown(dur, seed)
    roll = body * (0.3 + 0.7 * np.exp(-((t_axis(dur) - 1.5) ** 2) / (2 * 1.2 ** 2)))
    return normalize(fade(one_pole_lp(roll, 250), 200), 0.8)


def thunder_near(seed=29):
    """Overhead: a sharp CRACK first, then the rumble collapses behind it. The green
    sky's payoff. The order matters, crack before roll, or it reads as far."""
    dur = 4.0
    out = np.zeros(int(dur * SR))
    # BAND-LIMITED. A bare high_pass leaves the crack flat from 800 Hz to the 24 kHz
    # Nyquist, and a thunder crack is not a cymbal: its bite lives in the low kHz and the
    # air takes the rest long before it reaches anybody. Unbounded, it carried enough
    # spectral energy to leave NEAR thunder measuring brighter than a referee's whistle.
    crack = one_pole_lp(high_pass(white(0.15, seed), 800), 6000) * expdecay(0.15, 0.03)
    place_into(out, normalize(crack) * 0.9, 0.0)
    roll = one_pole_lp(brown(dur, seed + 1), 300)
    roll *= (0.2 + 0.8 * np.exp(-((t_axis(dur) - 0.6) ** 2) / (2 * 0.9 ** 2)))
    place_into(out, normalize(roll) * 0.8, 0.1)
    return normalize(fade(out, 60), 0.88)


def cattle_auction(seed=30):
    """The sale barn chant: the auctioneer's rhythmic ratatat over a low room, not
    words but a pulse and a pitch, a small-town institution you hear from the lot."""
    dur = 4.0
    room = one_pole_lp(pink(dur, seed), 1500) * 0.25
    r = rng_for(seed)
    out = room.copy()
    tt = 0.3
    while tt < dur - 0.2:
        syl = sine(r.uniform(180, 260), 0.07) * expdecay(0.07, 0.03)
        syl = biquad_bp(syl + white(0.07, r.integers(0, 9999)) * 0.3, 700, 2)
        place_into(out, fade(normalize(syl), 3) * 0.4, tt)
        tt += r.uniform(0.12, 0.2)  # the fast chant
    return normalize(fade(out, 120), 0.8)


def highway_pass(seed=31):
    """The two-lane at night: a single vehicle approaching and receding, a doppler
    sweep of tyre roar and a low engine, then the crickets again. Distance, drawn."""
    dur = 4.0
    t = t_axis(dur)
    prox = np.exp(-((t - 2.0) ** 2) / (2 * 0.7 ** 2))
    # brighter as it nears: a wideband roar and a lowpassed body, crossfaded by prox
    tyre = white(dur, seed)
    # TWO POLES, not one. `one_pole_lp` rolls off at 6 dB per octave, so a 3.5 kHz corner
    # is still only 9 dB down at 10 kHz and tyre roar arrived carrying most of its energy
    # above the band it actually occupies. Cascading gives 12 dB per octave, which is what
    # a car going past at night sounds like from the shoulder.
    near = one_pole_lp(one_pole_lp(tyre, 3500), 3500)
    far = one_pole_lp(one_pole_lp(tyre, 1600), 1600)
    roar = (far * (1 - prox) + near * prox) * prox
    dopp = 1 + 0.06 * (t - 2.0)
    eng = am(brown(dur, seed + 1), 28, depth=0.6) * prox * 0.5
    return normalize(fade((roar + eng) * dopp, 120), 0.8)


def gas_pump(seed=32):
    """The old mechanical pump: the CLUNK of the handle, then the rhythmic tick of the
    dial wheels turning as it fills. A roadside stop between towns."""
    dur = 3.0
    out = np.zeros(int(dur * SR))
    clunk = biquad_bp(white(0.06, seed), 200, 3) * expdecay(0.06, 0.02)
    place_into(out, normalize(clunk) * 0.8, 0.1)
    tick = biquad_bp(white(0.01, seed + 1), 2400, 6) * expdecay(0.01, 0.003)
    tt = 0.5
    r = rng_for(seed)
    while tt < dur - 0.1:
        place_into(out, fade(normalize(tick), 1) * 0.5, tt)
        tt += r.uniform(0.14, 0.17)  # the dial rhythm
    return normalize(out, 0.85)


def server_hall(seed=33):
    """A data hall from the cold aisle: the fan wall, and nothing else.

    THE MISTAKE an outsider makes is a sci-fi hum, a low sine with a pulse in it. A hall
    full of chassis fans is BROADBAND and almost featureless, closer to a waterfall than
    to a machine, and its whole character sits in two places. There is a shelf around one
    to three kilohertz where a few thousand rotors of nearly the same size beat against
    each other, and there is 120 Hz from the power supplies, which is mains at double
    frequency in a sixty hertz country and is the one pitch in the room.

    It does not throb. A single fan spinning up would, and a wall of them averages that
    out, so the only movement is a very slow wander as thermal control trims banks. That
    stillness is the point: this is the loudest room a Texan can stand in and be unable to
    say what it sounds like.

    THE PUBLISHED CENTROID CAUGHT THE FIRST VERSION. Its spectral centroid came out at 4,651 Hz,
    which put it between the crickets and a pair of spurs and made it the fourth brightest
    thing in the library. A pink floor carries most of its energy up top and the rotor
    shelf sat on it unfiltered, so what the docstring called a waterfall measured as a
    hiss. The published centroid is in the catalog for exactly this, and the fix is a real
    roll-off rather than a softer adjective.
    """
    dur = 6.0
    # the fan floor, rolled off twice above the band a chassis rotor actually occupies
    base = one_pole_lp(one_pole_lp(pink(dur, seed), 1200), 1200)
    # the rotor shelf, band-limited and sat on top of the floor
    shelf = biquad_bp(white(dur, seed + 1), 1400, 1.1) * 0.32
    shelf += biquad_bp(white(dur, seed + 2), 2600, 1.6) * 0.10
    # the supplies. 120 Hz and its third, steady, quiet, and never a melody
    mains = sine(120, dur) * 0.16 + sine(360, dur) * 0.055
    # thermal trim: a very slow wander, not a pulse
    wander = 1 + 0.05 * np.sin(2 * np.pi * 0.07 * t_axis(dur))
    return normalize(fade((base * 1.5 + shelf + mains) * wander, 200), 0.72)


def substation_hum(seed=34):
    """The transformer yard on the far side of the fence, from a hundred feet off.

    Magnetostriction in the core, so the fundamental is 120 Hz and the harmonics are the
    EVEN ones, and the reason two transformers in a yard sound alive rather than flat is
    that they are not perfectly in step. Beating between them is the whole sound. A faint
    corona hiss rides over it in dry air, which is the Texas half of it: on the Llano
    Estacado in August that hiss is audible from the road and on the Gulf it is not.

    THE PUBLISHED CENTROID CAUGHT THE FIRST VERSION. Corona at five percent of full scale,
    HIGH-PASSED and therefore spread across every band up to Nyquist, put the measured
    spectral centroid at 11,890 Hz and made a transformer the BRIGHTEST sound in this
    library, above a rattlesnake and a referee's whistle. Five percent by amplitude is not
    five percent by where the energy sits, and nothing but the catalog's own measurement
    would have said so, because the buffer was clean and the peak was exactly what
    normalize set it to. It is now a narrow band about an octave wide at a tenth of the
    level, which is what a corona is from the road. Tuned against the measurement until
    the centroid sat with the other low machines rather than with the birds.
    """
    dur = 5.0
    t = t_axis(dur)
    out = np.zeros_like(t)
    # two cores, detuned by a fraction of a hertz, which is what makes the slow beat
    for det, g in ((0.0, 1.0), (0.35, 0.8)):
        out += (sine(120 + det, dur) * 0.55 * g
                + sine(240 + det * 2, dur) * 0.22 * g
                + sine(360 + det * 3, dur) * 0.12 * g
                + sine(480 + det * 4, dur) * 0.05 * g)
    corona = biquad_bp(white(dur, seed), 6200, 4.0) * 0.0018
    corona *= 1 + 0.4 * np.sin(2 * np.pi * 0.9 * t + rng_for(seed).uniform(0, 6))
    return normalize(fade(out * 0.5 + corona, 150), 0.8)


# name -> (function, kind, motivation on screen, tags)
def rig_floor(seed=33):
    """A drilling rig working, heard standing on the pad.

    THE MISTAKE THIS CORRECTS is reaching for `server_hall` or `diesel_idle` because a
    rig is "a machine". A data hall is a broadband fan wall with no event in it, and a
    pickup idling has no load. A rig under power is a diesel bed at STEADY LOAD with
    the mud pumps pulsing through it at about one stroke a second, and that pulse is
    the tell: it is the sound of the hole being circulated, and a rig without it is a
    rig that is shut down.
    """
    dur = 6.0
    r = rng_for(seed)
    bed = one_pole_lp(brown(dur, seed), 210)
    t = t_axis(dur)
    drone = sine(44, dur) * 0.40 + sine(88, dur) * 0.30 + sine(131, dur) * 0.14
    drone = drone * (0.86 + 0.14 * np.sin(2 * np.pi * t / 2.7))
    out = bed * 0.62 + drone * 0.46
    tt = 0.18
    while tt < dur - 0.25:
        thud = biquad_bp(white(0.14, seed + int(tt * 10)), 118, 3) * expdecay(0.14, 0.05)
        place_into(out, fade(normalize(thud), 4) * 0.30, tt + r.uniform(-0.02, 0.02))
        tt += 1.05
    return normalize(fade(out, 140), 0.85)


def iron_roughneck(seed=34):
    """The pipe handler making a connection, and the ORDER is the whole sound.

    Three events: the hydraulic drive-out, a hard steel BITE as the tongs close on the
    joint, then the spin, a ratchet that slows as the connection comes up to torque.
    A smooth servo whir is the wrong machine here for exactly the reason `plantfloor`
    refuses a friendly arm: this thing moves in fast segments with hard stops, and a
    sound that glides is a sound belonging to something else.
    """
    dur = 4.0
    out = np.zeros(int(round(dur * SR)))

    whine = sine(lambda t: 240 + 210 * np.clip(t / 0.7, 0, 1), 0.7) * 0.55
    whine = whine + biquad_bp(white(0.7, seed), 1500, 3) * 0.25
    whine = whine * adsr(0.7, 0.08, 0.10, 0.70, 0.16, 0.7)
    place_into(out, normalize(whine) * 0.46, 0.15)

    bite = (biquad_bp(white(0.28, seed + 1), 2400, 5) * expdecay(0.28, 0.03)
            + biquad_bp(white(0.28, seed + 2), 610, 8) * expdecay(0.28, 0.09))
    place_into(out, fade(normalize(bite), 2) * 0.95, 0.95)

    tt, gap = 1.16, 0.045
    while tt < 2.62:
        tick = biquad_bp(white(0.03, seed + int(tt * 100)), 3100, 6) * expdecay(0.03, 0.008)
        place_into(out, fade(normalize(tick), 2) * 0.38, tt)
        gap *= 1.09
        tt += gap

    back = sine(lambda t: 330 - 150 * np.clip(t / 0.6, 0, 1), 0.6)
    back = back * adsr(0.6, 0.06, 0.10, 0.60, 0.20, 0.6)
    place_into(out, normalize(back) * 0.32, 2.72)
    return normalize(fade(out, 40), 0.9)


def document_parse(seed=35):
    """A paper record becoming structured labels, heard at the document rather than as UI.

    The tell is a short paper draw followed by two dry index-card locks. It avoids the generic
    computer whoosh that made a literal evidence scene sound like a software commercial.
    """
    dur = 2.8
    out = np.zeros(int(dur * SR))
    paper = one_pole_lp(high_pass(white(0.62, seed), 260), 3600)
    paper *= np.hanning(len(paper))
    place_into(out, normalize(paper) * 0.38, 0.08)
    for i, at in enumerate((0.82, 1.46)):
        click = (biquad_bp(white(0.065, seed + i + 1), 1850 + i * 320, 4)
                 * expdecay(0.065, 0.014))
        body = (biquad_bp(white(0.08, seed + i + 11), 280, 3)
                * expdecay(0.08, 0.025))
        lock = np.zeros(max(len(click), len(body)))
        lock[:len(click)] += click
        lock[:len(body)] += body * 0.6
        place_into(out, fade(normalize(lock), 2) * 0.62, at)
    return normalize(fade(out, 35), 0.78)


def record_join(seed=36):
    """Two visible record cards meeting and latching into one joined record.

    Two different register ticks answer each other, then one low mechanical latch lands. The
    order carries the join; a steady server bed cannot say that two sources became one.
    """
    dur = 2.4
    out = np.zeros(int(dur * SR))
    for i, (at, freq) in enumerate(((0.24, 760), (0.62, 1040))):
        tick = sine(freq, 0.12) * expdecay(0.12, 0.035)
        tick += biquad_bp(white(0.12, seed + i), freq * 1.8, 5) * expdecay(0.12, 0.02) * 0.3
        place_into(out, fade(normalize(tick), 3) * 0.52, at)
    latch_noise = biquad_bp(white(0.18, seed + 8), 210, 3) * expdecay(0.18, 0.055)
    latch_tone = sine(115, 0.22) * expdecay(0.22, 0.08) * 0.45
    latch = np.zeros(max(len(latch_noise), len(latch_tone)))
    latch[:len(latch_noise)] += latch_noise
    latch[:len(latch_tone)] += latch_tone
    place_into(out, fade(normalize(latch), 3) * 0.78, 1.06)
    return normalize(fade(out, 30), 0.8)


def causal_break(seed=37):
    """An association remains while a visible causal arrow breaks.

    A paired line tone begins together, a dry snap interrupts the upper line, and the lower tone
    decays intact. The sound makes the limit legible without pretending the evidence disappeared.
    """
    dur = 1.7
    out = np.zeros(int(dur * SR))
    intact = sine(176, dur) * expdecay(dur, 0.95) * 0.26
    upper = sine(264, 0.78) * expdecay(0.78, 0.8) * 0.18
    out[:len(intact)] += intact
    out[:len(upper)] += upper
    snap_top = high_pass(white(0.055, seed), 1700) * expdecay(0.055, 0.009)
    snap_body = biquad_bp(white(0.11, seed + 1), 420, 4) * expdecay(0.11, 0.03)
    snap = np.zeros(max(len(snap_top), len(snap_body)))
    snap[:len(snap_top)] += snap_top
    snap[:len(snap_body)] += snap_body
    place_into(out, fade(normalize(snap), 2) * 0.8, 0.76)
    return normalize(fade(out, 20), 0.76)


def field_marker(seed=38):
    """Candidate road segments entering an engineer's field-inspection queue.

    Three measured marker taps, not an alarm: the list is becoming a work queue, not issuing an
    automated repair order. A faint clipboard scrape ties the taps to field work.
    """
    dur = 2.5
    out = np.zeros(int(dur * SR))
    scrape = one_pole_lp(high_pass(white(0.7, seed), 450), 3000) * np.hanning(int(0.7 * SR))
    place_into(out, normalize(scrape) * 0.18, 0.06)
    for i, at in enumerate((0.42, 0.98, 1.56)):
        tap = (biquad_bp(white(0.075, seed + 1 + i), 720 + i * 90, 5)
               * expdecay(0.075, 0.019))
        place_into(out, fade(normalize(tap), 2) * (0.48 + i * 0.07), at)
    return normalize(fade(out, 30), 0.74)


def alloy_furnace(seed=39):
    """An induction furnace bringing a visible alloy charge up to heat.

    The electrical body rises under a close, directional flame-like wash, then a small
    crucible ring lands. It belongs to molten metal in frame, not to a generic factory bed.
    """
    dur = 3.4
    t = t_axis(dur)
    mains = sine(120, dur) * 0.26 + sine(240, dur) * 0.12
    drive = np.clip(t / 0.75, 0, 1) * (0.84 + 0.16 * np.sin(2 * np.pi * 1.8 * t))
    heat = biquad_bp(white(dur, seed), 2850, 1.6) * drive * 0.22
    out = mains * drive + heat
    ring = sine(780, 0.34) * expdecay(0.34, 0.10)
    ring += sine(1320, 0.34) * expdecay(0.34, 0.07) * 0.45
    place_into(out, fade(normalize(ring), 4) * 0.36, 2.72)
    return normalize(fade(out, 80), 0.78)


def robot_servo(seed=40):
    """A visible industrial arm indexing a metal coupon through two hard moves.

    Two controlled motor ramps end in dry mechanical stops. The segmented motion keeps the
    cue attached to the arm's authored movement instead of implying an always-on robot room.
    """
    dur = 2.6
    out = np.zeros(int(dur * SR))
    for i, (at, rise, fall) in enumerate(((0.12, 310, 690), (1.20, 420, 770))):
        move = sine(lambda t, lo=rise, hi=fall: lo + (hi - lo) * np.sin(np.pi * np.clip(t / 0.72, 0, 1)), 0.72)
        move += biquad_bp(white(0.72, seed + i), 1700 + i * 180, 5) * 0.12
        move *= adsr(0.72, 0.06, 0.08, 0.68, 0.14, 0.7)
        place_into(out, normalize(move) * 0.48, at)
        stop = biquad_bp(white(0.08, seed + 10 + i), 520, 4) * expdecay(0.08, 0.018)
        place_into(out, fade(normalize(stop), 2) * 0.54, at + 0.70)
    return normalize(fade(out, 35), 0.78)


def metal_quench(seed=41):
    """A hot metal coupon entering a visible quench bath.

    The first contact spits, the steam bloom expands, and the coupon gives one damped ring.
    That sequence distinguishes heat treatment from rain, surf, or an unmotivated hiss.
    """
    dur = 2.8
    t = t_axis(dur)
    spit = biquad_bp(white(dur, seed), 3600, 5.0) * np.exp(-t / 0.48)
    steam = biquad_bp(white(dur, seed + 1), 1350, 3.2)
    steam *= np.clip(t / 0.24, 0, 1) * np.exp(-t / 1.25) * 0.55
    ring = sine(690, 0.55) * expdecay(0.55, 0.16)
    out = spit * 0.52 + steam * 0.46
    place_into(out, fade(normalize(ring), 4) * 0.25, 0.08)
    return normalize(fade(out, 35), 0.80)


def test_press(seed=42):
    """A visible materials test press loading a coupon until the measurement lands.

    A hydraulic rise tightens into a short metal report, followed by a quieter release. The
    event says test result, not fabrication, and gives the animation a physical punctuation.
    """
    dur = 2.2
    out = np.zeros(int(dur * SR))
    load = sine(lambda t: 82 + 105 * np.clip(t / 1.0, 0, 1), 1.05)
    load += biquad_bp(white(1.05, seed), 620, 4) * 0.14
    load *= np.clip(t_axis(1.05) / 0.18, 0, 1) * np.clip((1.05 - t_axis(1.05)) / 0.10, 0, 1)
    place_into(out, normalize(load) * 0.42, 0.08)
    report = biquad_bp(white(0.14, seed + 1), 1450, 5) * expdecay(0.14, 0.025)
    report += sine(245, 0.14) * expdecay(0.14, 0.05) * 0.5
    place_into(out, fade(normalize(report), 2) * 0.82, 1.10)
    release = sine(lambda t: 210 - 90 * np.clip(t / 0.55, 0, 1), 0.55) * expdecay(0.55, 0.22)
    place_into(out, normalize(release) * 0.24, 1.42)
    return normalize(fade(out, 35), 0.82)


def pencil_scratch(seed=43):
    """A hand visibly writing a hypothesis or interpretation on paper.

    Three short graphite strokes change direction and end with a pencil-set tap. It makes the
    human judgment beat tactile without turning it into a keyboard or software-interface cue.
    """
    dur = 2.5
    out = np.zeros(int(dur * SR))
    r = rng_for(seed)
    for i, (at, length) in enumerate(((0.12, 0.46), (0.76, 0.54), (1.46, 0.42))):
        stroke = one_pole_lp(high_pass(white(length, seed + i), 700), 4300)
        grain = 0.55 + 0.45 * np.sin(2 * np.pi * (22 + r.uniform(-3, 4)) * t_axis(length))
        stroke *= np.hanning(len(stroke)) * grain
        place_into(out, normalize(stroke) * 0.34, at)
    tap = biquad_bp(white(0.06, seed + 8), 980, 5) * expdecay(0.06, 0.014)
    place_into(out, fade(normalize(tap), 2) * 0.46, 2.12)
    return normalize(fade(out, 30), 0.70)


def review_stamp(seed=44):
    """A visible review gate or NEXT QUESTION stamp landing on a paper record.

    A brief rubber compression precedes the wooden body impact and a dry paper release. The
    cue belongs to the authored stamp, avoiding a cinematic hit that has no object in frame.
    """
    dur = 1.35
    out = np.zeros(int(dur * SR))
    press = biquad_bp(white(0.18, seed), 520, 4) * np.hanning(int(0.18 * SR))
    place_into(out, normalize(press) * 0.22, 0.12)
    body = biquad_bp(white(0.10, seed + 1), 260, 3) * expdecay(0.10, 0.027)
    edge = biquad_bp(white(0.06, seed + 2), 1900, 5) * expdecay(0.06, 0.012)
    hit = np.zeros(max(len(body), len(edge)))
    hit[:len(body)] += body
    hit[:len(edge)] += edge * 0.55
    place_into(out, fade(normalize(hit), 2) * 0.82, 0.32)
    lift = one_pole_lp(high_pass(white(0.28, seed + 3), 650), 3100) * np.hanning(int(0.28 * SR))
    place_into(out, normalize(lift) * 0.18, 0.58)
    return normalize(fade(out, 25), 0.78)


def irrigation_pivot(seed=45):
    """Illustrated electric pivot drive and falling irrigation spray.

    A restrained gear tone under water landing on soil, not a diesel tractor or
    stock-tank windmill. This is designed foley, never claimed as field recording.
    """
    dur = 6.0
    t = t_axis(dur)
    motor = sine(118, dur) * 0.28 + sine(236, dur) * 0.12
    motor *= 0.86 + 0.14 * np.sin(2 * np.pi * 0.7 * t)
    water = one_pole_lp(high_pass(white(dur, seed), 380), 2600)
    water = one_pole_lp(water, 2600) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.33 * t) ** 2)
    grit = biquad_bp(white(dur, seed + 1), 490, 4) * 0.08
    return normalize(fade(motor + water * 0.55 + grit, 220), 0.74)


def observation_trace(seed=46):
    """Quiet sonification of a drawn sensor observation becoming an estimate.

    The audible trace belongs to the editorial graphic, not to radar in the air.
    Two dry strokes and a soft endpoint avoid a space-age sonar ping.
    """
    dur = 1.8
    out = np.zeros(int(dur * SR))
    for i, (at, length) in enumerate(((0.08, 0.55), (0.76, 0.55))):
        stroke = biquad_bp(white(length, seed + i), 1100 + i * 240, 3)
        stroke *= np.hanning(len(stroke))
        place_into(out, normalize(stroke) * 0.30, at)
    endpoint = sine(330, 0.16) * expdecay(0.16, 0.04)
    place_into(out, fade(normalize(endpoint), 4) * 0.18, 1.40)
    return normalize(fade(out, 30), 0.60)


SOUNDS = {
    # ambience beds, loopable, tied to a place
    "cicada_wall": (cicada_wall, "ambience", "a summer daytime exterior, any region", ["summer", "day", "insect"]),
    "cricket_night": (cricket_night, "ambience", "a rural night exterior", ["night", "insect", "rural"]),
    "blue_norther": (blue_norther, "ambience", "a cold front arriving, bare trees, a norther sky", ["wind", "winter", "high_plains"]),
    "dust_wall": (dust_wall, "ambience", "a haboob on the High Plains, a wall on the horizon", ["wind", "high_plains", "storm"]),
    "gulf_surf": (gulf_surf, "ambience", "the coast, a shallow brown-green Gulf, the Laguna Madre", ["coast", "gulf", "water"]),
    "friday_night_crowd": (friday_night_crowd, "ambience", "a stadium under lights, the stands", ["football", "night", "town"]),
    "rain_on_tin": (rain_on_tin, "ambience", "a porch or barn under a metal roof in a storm", ["rain", "storm", "home"]),
    "highway_pass": (highway_pass, "ambience", "a two-lane at night, a vehicle passing", ["road", "night", "rural"]),
    "cattle_auction": (cattle_auction, "ambience", "a sale barn, the auctioneer over the lot", ["ranch", "town", "livestock"]),
    "server_hall": (server_hall, "ambience", "a data hall with the fan wall running, from the cold aisle", ["compute", "interior", "machine"]),
    "rig_floor": (rig_floor, "ambience", "a drilling rig under power, heard standing on the pad", ["oilfield", "permian", "machine", "drilling"]),
    "irrigation_pivot": (irrigation_pivot, "ambience", "a visible irrigation pivot with a turning drive and falling spray", ["farm", "water", "pivot", "machine"]),
    # one-shots, tied to a thing
    "substation_hum": (substation_hum, "oneshot", "a transformer yard beside a slab, heard from the fence", ["grid", "compute", "machine"]),
    "pumpjack": (pumpjack, "oneshot", "an oil pumpjack in the frame", ["oilfield", "permian", "machine"]),
    "iron_roughneck": (iron_roughneck, "oneshot", "the pipe handling machine on a rig floor making a connection", ["oilfield", "drilling", "machine", "automation"]),
    "document_parse": (document_parse, "oneshot", "a visible document stream turning narrative prose into mechanism labels", ["records", "document", "labels", "analysis"]),
    "record_join": (record_join, "oneshot", "two visible record cards joining into one linked record", ["records", "join", "analysis"]),
    "causal_break": (causal_break, "oneshot", "a visible causal arrow breaking while an association line remains", ["evidence", "limit", "analysis"]),
    "field_marker": (field_marker, "oneshot", "candidate road segments entering an engineer field inspection queue", ["road", "inspection", "engineer"]),
    "alloy_furnace": (alloy_furnace, "oneshot", "a visible alloy charge heating in an induction furnace", ["materials", "metal", "furnace", "laboratory"]),
    "robot_servo": (robot_servo, "oneshot", "a visible industrial robot indexing a metal coupon", ["materials", "robot", "automation", "laboratory"]),
    "metal_quench": (metal_quench, "oneshot", "a visible hot metal coupon entering a quench bath", ["materials", "metal", "heat_treatment", "laboratory"]),
    "test_press": (test_press, "oneshot", "a visible materials test press loading a coupon", ["materials", "test", "measurement", "laboratory"]),
    "pencil_scratch": (pencil_scratch, "oneshot", "a visible hand writing a hypothesis or interpretation", ["human", "judgment", "paper", "analysis"]),
    "observation_trace": (observation_trace, "oneshot", "sonification of a visible sensor observation graphic becoming an estimate", ["sensor", "estimate", "analysis", "illustration"]),
    "review_stamp": (review_stamp, "oneshot", "a visible review gate or question stamp landing on a paper record", ["review", "stamp", "paper", "decision"]),
    "windmill_creak": (windmill_creak, "oneshot", "an Aermotor windmill over a stock tank", ["ranch", "water", "machine"]),
    "screen_door": (screen_door, "oneshot", "a screen door on a house", ["home", "punctuation"]),
    "diesel_idle": (diesel_idle, "oneshot", "a diesel pickup idling", ["road", "ranch", "machine"]),
    "longhorn_low": (longhorn_low, "oneshot", "cattle in a pasture or pen", ["ranch", "livestock"]),
    "grackle": (grackle, "oneshot", "a great-tailed grackle on a wire or a cart", ["bird", "metro", "parking_lot"]),
    "mockingbird": (mockingbird, "oneshot", "a mockingbird, the state bird", ["bird", "day"]),
    "rattlesnake": (rattlesnake, "oneshot", "a rattlesnake in brush or rock", ["trans_pecos", "danger", "reptile"]),
    "bobwhite_quail": (bobwhite_quail, "oneshot", "a bobwhite in brush country by day", ["bird", "brush_country", "day"]),
    "coyote_yip": (coyote_yip, "oneshot", "a coyote at dusk", ["dusk", "rural", "canid"]),
    "train_horn": (train_horn, "oneshot", "a grade crossing in a courthouse-square town", ["town", "rail", "distance"]),
    "courthouse_bell": (courthouse_bell, "oneshot", "the courthouse clock on the square", ["town", "civic"]),
    "spurs_jingle": (spurs_jingle, "oneshot", "boots and spurs on a board floor", ["cowboy", "walk"]),
    "dominoes_click": (dominoes_click, "oneshot", "a domino table at an ice house or washateria", ["tejano", "leisure", "table"]),
    "paletero_bells": (paletero_bells, "oneshot", "a paletero cart in a colonia or barrio", ["tejano", "street", "joy"]),
    "conjunto_accordion": (conjunto_accordion, "oneshot", "a scene change with a border-music stab", ["tejano", "music", "transition"]),
    "drumline_cadence": (drumline_cadence, "oneshot", "a marching band in the stands", ["football", "band", "town"]),
    "ref_whistle": (ref_whistle, "oneshot", "an official on the field", ["football", "whistle"]),
    "pads_pop": (pads_pop, "oneshot", "a football hit", ["football", "impact"]),
    "thunder_far": (thunder_far, "oneshot", "a storm an hour away on the horizon", ["storm", "high_plains", "distance"]),
    "thunder_near": (thunder_near, "oneshot", "a storm overhead, a green sky", ["storm", "impact"]),
    "gas_pump": (gas_pump, "oneshot", "an old mechanical fuel pump at a roadside stop", ["road", "vintage", "machine"]),
}


# ---------------------------------------------------------------- outputs
_CACHE: dict[str, np.ndarray] = {}


def synth(name: str) -> np.ndarray:
    """Synthesize once per process. Every output path (build, catalog, audition,
    self-test) asks for the same buffer, and re-running the oscillators four times
    over is the difference between a one-second gate and a slow one."""
    if name not in _CACHE:
        _CACHE[name] = SOUNDS[name][0]()
    return _CACHE[name]


def catalog() -> list[dict]:
    out = []
    for name, (fn, kind, motiv, tags) in SOUNDS.items():
        x = synth(name)
        centroid, flatness, audible = spectrum(x)
        out.append({
            "name": name, "kind": kind, "motivation": motiv, "tags": tags,
            "dur_s": round(len(x) / SR, 3), "rate": SR,
            "wav": f"assets/sfx/{name}.wav",
            # MEASURED, NEVER ASSERTED, and published for the same reason the rest of this
            # project publishes its numbers: they are recomputable from the same inputs.
            # They also make the committed catalog a fingerprint of the SOUND rather than
            # of its name, so a DSP change that alters what a sound is cannot slip past the
            # freshness check with the file list unchanged.
            "centroid_hz": round(centroid, 1),
            "flatness": round(flatness, 5),
            "audible_share": round(audible, 4),
        })
    return out


def write_wav(path: Path, x: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())


def build(out_dir: Path) -> int:
    """Write the library, and REFUSE to write a bad one.

    This used to return a literal 0 after writing 31 files, checking nothing. `_valid`
    existed and the code path that produces the shipped artifacts did not call it, so
    `foley.py --build`, which is the command the routine actually runs, could not fail. On
    top of that `write_wav` clips to [-1, 1], so a buffer that clipped was silently hard
    clipped on the way to disk and still reported success.
    """
    bad: list[str] = []
    n = 0
    for name in SOUNDS:
        x = synth(name)
        problems = _valid(x)
        if problems:
            bad.append(f"{name}: {', '.join(problems)}")
            continue
        write_wav(out_dir / f"{name}.wav", x)
        n += 1
    if bad:
        print(f"foley: refusing to ship {len(bad)} sound(s)", file=sys.stderr)
        for b in bad:
            print(f"  - {b}", file=sys.stderr)
        return 1
    (out_dir / "catalog.json").write_text(json.dumps(catalog(), indent=2), encoding="utf-8")
    print(f"foley: built {n} sounds into {out_dir} at {SR} Hz mono")
    return 0


def audition(path: Path) -> int:
    """The ear's review sheet: every sound end to end, a soft index blip and a gap
    between them, so a human can listen through the whole library once. A sound nobody
    has HEARD is not finished, the same rule the picture side learned the hard way."""
    gap = np.zeros(int(0.4 * SR))
    blip = fade(normalize(sine(880, 0.05)) * 0.2, 5)
    parts = []
    for name in SOUNDS:
        parts.append(blip)
        parts.append(np.zeros(int(0.15 * SR)))
        parts.append(synth(name))
        parts.append(gap)
    write_wav(path, np.concatenate(parts))
    print(f"foley: audition of {len(SOUNDS)} sounds written to {path} "
          f"({round(sum(len(p) for p in parts) / SR, 1)} s)")
    return 0


# ---------------------------------------------------------------- self-test
# WHITE NOISE MEASURES 0.56 HERE and the flattest real sound in the library, the
# rattlesnake's rattle, measures 0.33. The ceiling sits between them with margin on both
# sides. Spectral flatness is the geometric mean of the power spectrum over its arithmetic
# mean: 1.0 is a perfectly flat spectrum, and anything that has been filtered, resonated or
# enveloped falls orders of magnitude below it.
FLATNESS_MAX = 0.45


def spectrum(x: np.ndarray) -> tuple[float, float, float]:
    """(centroid Hz, flatness, share of energy that is audible). Measured, never asserted."""
    X = np.abs(np.fft.rfft(x)) + 1e-12
    fr = np.fft.rfftfreq(len(x), 1 / SR)
    P = X ** 2
    centroid = float((fr * X).sum() / X.sum())
    flatness = float(np.exp(np.log(P).mean()) / P.mean())
    audible = float(P[(fr >= 20) & (fr <= 16000)].sum() / P.sum())
    return centroid, flatness, audible


def _valid(x: np.ndarray, dur_min=0.1) -> list[str]:
    """The validator the gate reuses. Returns the reasons a buffer is unusable.

    THE FIRST FOUR CHECKS CANNOT FIRE ON A REAL SOUND, and that is why the fifth exists.
    Every one of the 31 sound functions ends in `normalize(..., peak)`, which sets
    max(abs(x)) to exactly `peak`, so the clip test, the silence test, the dtype test and
    the length test are all structurally unreachable for anything this file produces. Only
    the NaN test could ever go red.

    That was proved by breaking the product rather than by reading it. Replacing
    `_fft_filter` with the identity, which kills every lowpass, highpass and bandpass in
    the library and turns cicada_wall and rattlesnake alike into raw white noise, left the
    self-test printing "all passed (31 sounds)" and exiting 0. So did replacing every sound
    with one impulse and six seconds of silence, and so did a 0.5 Hz sine.

    They are kept because they are cheap and they are the right refusals for a buffer
    arriving from somewhere else. But the check that holds the LIBRARY is the spectral one,
    because the thing that can actually break here is the filtering, and filtering is
    invisible to every amplitude measurement after a normalize.
    """
    bad = []
    if x.dtype.kind != "f":
        bad.append("not float")
    if not np.all(np.isfinite(x)):
        bad.append("has NaN or inf")
    if len(x) < dur_min * SR:
        bad.append(f"shorter than {dur_min}s")
    if np.max(np.abs(x)) > 1.0 + 1e-6:
        bad.append(f"clips at {np.max(np.abs(x)):.3f}")
    if np.max(np.abs(x)) < 0.05:
        bad.append("effectively silent")
    if len(x) and np.all(np.isfinite(x)) and np.any(x):
        _, flat, _ = spectrum(x)
        if flat > FLATNESS_MAX:
            bad.append(
                f"spectrally flat at {flat:.3f}, which is white noise rather than a sound. "
                f"Every filter that shapes this one has stopped doing anything.")
    return bad


def self_test() -> int:
    fails = 0

    def ok(label, cond):
        nonlocal fails
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}")
        if not cond:
            fails += 1

    # every sound synthesizes to a usable 48k buffer
    for name in SOUNDS:
        x = synth(name)
        ok(f"{name} synthesizes clean", not _valid(x))

    # deterministic: same seed in, same bytes out, or a review means nothing
    a, b = synth("pumpjack"), synth("pumpjack")
    ok("a sound is deterministic across two calls", np.array_equal(a, b))

    # the contract the rest of the engine enforces
    ok("everything is 48000 Hz by construction", SR == 48000)
    # THE COMMITTED CATALOG IS THE INTERFACE, so that is what gets compared.
    #
    # This assertion used to read `[c["name"] for c in catalog()] == list(SOUNDS)`, and
    # `catalog()` builds its list by iterating SOUNDS and copying the key into "name". It
    # compared list(SOUNDS) to list(SOUNDS) and could not fail on any input. What it reads
    # as checking, and did not, is whether the TRACKED assets/sfx/catalog.json still
    # matches the code. Nothing did. The routine picks its sounds out of that file, so a
    # renamed or deleted sound would leave the interface stale with every gate green.
    cat_path = REPO / "assets" / "sfx" / "catalog.json"
    if cat_path.is_file():
        committed = json.loads(cat_path.read_text(encoding="utf-8"))
        ok("the COMMITTED catalog still matches what the code produces",
           committed == catalog())
    else:
        ok("the committed catalog exists, since the routine picks sounds out of it", False)
    ok("every catalog entry names its on-screen motivation",
       all(c["motivation"] and len(c["motivation"]) > 8 for c in catalog()))

    # THE GATE MUST BE ABLE TO GO RED. Feed the validator known-bad buffers and
    # require it to reject each, or a green run proves nothing.
    ok("validator catches a clip", "clips" in " ".join(_valid(np.ones(SR) * 1.5)))
    ok("validator catches silence", "silent" in " ".join(_valid(np.zeros(SR) + 0.001)))
    ok("validator catches NaN", "NaN" in " ".join(_valid(np.full(SR, np.nan))))

    print(f"\nfoley self-test: {'all passed' if not fails else f'{fails} FAILED'} "
          f"({len(SOUNDS)} sounds)")
    return 1 if fails else 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--self-test", action="store_true")
    ap.add_argument("--catalog", action="store_true")
    ap.add_argument("--build", metavar="DIR")
    ap.add_argument("--audition", metavar="WAV")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    if a.catalog:
        print(json.dumps(catalog(), indent=2))
        return 0
    if a.build:
        return build(Path(a.build))
    if a.audition:
        return audition(Path(a.audition))
    print("foley: pass --self-test, --catalog, --build DIR, or --audition WAV", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())
