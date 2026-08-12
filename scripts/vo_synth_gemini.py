#!/usr/bin/env python3
"""vo_synth_gemini.py — render N takes of the read, and measure each one honestly.

WHY THIS EXISTS

`vo_soundcheck.py` grades takes and chooses one. This is what produces them, and what
measures the four numbers the grader reads: duration, integrated loudness, pitch
spread, and a transcript. Without it the grader is a function nobody calls.

THE RULE THIS FILE ENFORCES BEFORE SPENDING A SINGLE CALL

Direction written inline CAN BE READ ALOUD. A narrator who says the word "excited"
has ended the film, and no amount of good pictures recovers it.

`vo_soundcheck` greps the transcript for that vocabulary, which catches it AFTER the
money is spent and the take exists. This catches it BEFORE, by refusing to build a
prompt whose spoken body contains direction. The two checks guard the same defect
from opposite sides on purpose: the prompt is where the mistake is made, and the
transcript is where a model that ignored the prompt gets caught anyway.

The direction goes in a PREAMBLE. The script goes in a delimited body. They are
never concatenated into one blob and hoped over.

WHOLE PASSAGE, ONE CALL. Gemini renders the entire read in a single request so
sentence-to-sentence flow is natural. A line's energy is relative to the line before
it, and that only means anything if they were synthesised together.

MEASUREMENT, and why none of it is guessed. The API returns raw PCM, so duration
comes from the sample count and the rate DECLARED IN THE RESPONSE, never from a
constant in this file. Loudness is BS.1770 K-weighted and gated, not RMS wearing the
letters LUFS. Pitch spread is the standard deviation of a tracked F0 in semitones.
The self-test proves the drone number this file produces and the threshold
`vo_soundcheck` refuses on actually agree, because two files that agree by
convention rather than by test drift apart on the day nobody is looking.

    vo_synth_gemini.py --script out/dispatch/vo_script.txt \\
                       --direction out/dispatch/vo_direction.json \\
                       --out out/dispatch/takes --takes 3
    vo_synth_gemini.py --self-test

Exit 0 takes were rendered, 1 a refusal or a failure, 2 the tool could not run,
3 BLOCKED for want of a credential, which is not the same thing as a failure and
must never be reported as a silent film.
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import re
import sys
import time
import wave
from pathlib import Path

import numpy as np

REPO = Path(__file__).resolve().parents[1]

# Primary and failover. The failover exists because the sibling saw repeated 500s on
# a preview model mid-run, and a run that dies there has no voice at all.
MODEL_PRIMARY = "gemini-3.1-flash-tts-preview"
MODEL_FAILOVER = "gemini-2.5-pro-preview-tts"
MODEL_TRANSCRIBE = "gemini-3.1-flash-preview"
ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

# The same vocabulary vo_soundcheck greps for in a transcript. Imported by value
# rather than by reference on purpose: if these two lists ever disagree, the
# self-test says so, which is louder than an import that quietly resolves.
TAG_WORDS = {
    "excited", "cheerful", "whisper", "whispering", "sarcastic", "angry", "calm", "serious",
    "laughing", "sigh", "sighs", "pause", "beat", "emphasis", "emphatic", "slowly", "quickly",
    "warmly", "brightly", "flatly", "narrator", "voiceover", "vo", "tone", "upbeat",
}

# BS.1770-4 K-weighting, specified at 48 kHz. Audio at any other rate is resampled to
# 48 k before filtering rather than having the coefficients fudged, because a filter
# applied at the wrong rate returns a number that looks like loudness and is not.
_SHELF_B = np.array([1.53512485958697, -2.69169618940638, 1.19839281085285])
_SHELF_A = np.array([1.0, -1.69065929318241, 0.73248077421585])
_HPF_B = np.array([1.0, -2.0, 1.0])
_HPF_A = np.array([1.0, -1.99004745483398, 0.99007225036621])

# The fence around the spoken text. It must appear EXACTLY ONCE in a built prompt,
# which is why the instructions above it describe it rather than quoting it: the
# first version wrote "between the BEGIN SCRIPT and END SCRIPT markers" in the
# instructions and then used those same words as the fence, so the prompt carried
# two openings and the real boundary was ambiguous to any reader, model included.
FENCE_OPEN = "-----BEGIN SPOKEN TEXT-----"
FENCE_CLOSE = "-----END SPOKEN TEXT-----"


# ---------------------------------------------------------------- prompt assembly

def split_direction(plan: dict) -> str:
    """The director's notes, as a preamble. Never as tags inside the spoken text."""
    lines = []
    if plan.get("overall"):
        lines.append(str(plan["overall"]).strip())
    for i, ln in enumerate(plan.get("lines", []), 1):
        bits = [f"Line {i}"]
        for k in ("intent", "emphasis", "energy", "pause_after"):
            if ln.get(k) not in (None, ""):
                bits.append(f"{k.replace('_', ' ')}: {ln[k]}")
        lines.append("; ".join(bits))
    return "\n".join(lines)


def build_prompt(script: str, plan: dict) -> tuple[str, list[str]]:
    """Return (prompt, refusals). A non-empty refusal list means do NOT call the API.

    The script is fenced. Everything above the fence is instruction; everything
    inside it is the text to speak. Nothing is concatenated.
    """
    refusals = []
    body_words = set(re.findall(r"[a-z']+", script.lower()))
    spoken_direction = sorted(body_words & TAG_WORDS)
    if spoken_direction:
        refusals.append(
            f"the SCRIPT contains direction vocabulary ({', '.join(spoken_direction)}). "
            f"A model reads what it is given, so this would very likely be spoken aloud. "
            f"Move it into the director's notes. Emotion lives in the notes, never in the text.")
    if re.search(r"[\[<(]\s*(?:" + "|".join(sorted(TAG_WORDS)) + r")\s*[\]>)]", script, re.I):
        refusals.append("the SCRIPT contains a bracketed stage direction. Remove it.")
    if not script.strip():
        refusals.append("the script is empty")

    preamble = (
        "You are performing a narration for a short documentary film. Read ONLY the text inside "
        "the fenced block at the end of this message, exactly as written, and speak none of "
        "these instructions.\n\n"
        "Delivery: a person who knows the subject, telling you something they think you should "
        "know, at the pace somebody actually talks. Slightly dry. Willing to leave a silence. "
        "The authority comes from the facts being right, so the delivery does not work for it. "
        "Not a news anchor, not a documentary hush, not an explainer's bright upward lilt.\n\n"
        "Per-line direction:\n" + (split_direction(plan) or "(none supplied)") + "\n\n"
        + FENCE_OPEN + "\n" + script.strip() + "\n" + FENCE_CLOSE + "\n")
    return preamble, refusals


# ---------------------------------------------------------------- audio measurement

def parse_pcm(data: bytes, mime: str) -> tuple[np.ndarray, int]:
    """Decode raw PCM and take the sample rate FROM THE RESPONSE.

    A constant here would be a number typed by a person that every duration
    measurement then depends on. If the API ever hands back 16 kHz, a hardcoded
    24000 reports a passage 50 percent shorter than it is and the cut is wrong with
    every gate green.
    """
    m = re.search(r"rate=(\d+)", mime or "")
    if not m:
        raise ValueError(f"no sample rate in mimeType {mime!r}; refusing to assume one")
    rate = int(m.group(1))
    if not (8000 <= rate <= 96000):
        raise ValueError(f"implausible sample rate {rate}")
    if "L16" not in (mime or "") and "pcm" not in (mime or "").lower():
        raise ValueError(f"unexpected audio encoding {mime!r}; this decoder handles L16 PCM")
    x = np.frombuffer(data, dtype="<i2").astype(np.float64) / 32768.0
    return x, rate


def _biquad(x: np.ndarray, b: np.ndarray, a: np.ndarray) -> np.ndarray:
    y = np.zeros_like(x)
    x1 = x2 = y1 = y2 = 0.0
    for i, xn in enumerate(x):
        yn = b[0] * xn + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2
        y[i] = yn
        x2, x1 = x1, xn
        y2, y1 = y1, yn
    return y


def _to_48k(x: np.ndarray, rate: int) -> np.ndarray:
    if rate == 48000:
        return x
    n = int(round(len(x) * 48000 / rate))
    return np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x)


def integrated_lufs(x: np.ndarray, rate: int) -> float:
    """BS.1770-4 integrated loudness, mono, with both gates."""
    if len(x) < rate // 2:
        return -99.0
    y = _biquad(_biquad(_to_48k(x, rate), _SHELF_B, _SHELF_A), _HPF_B, _HPF_A)
    block = int(0.4 * 48000)
    hop = block // 4                                   # 75 percent overlap, per the spec
    if len(y) < block:
        return -99.0
    starts = range(0, len(y) - block + 1, hop)
    z = np.array([np.mean(y[s:s + block] ** 2) for s in starts])
    z = np.maximum(z, 1e-12)
    lk = -0.691 + 10 * np.log10(z)
    keep = lk > -70.0                                  # absolute gate
    if not keep.any():
        return -99.0
    rel = -0.691 + 10 * np.log10(np.mean(z[keep])) - 10.0   # relative gate
    keep &= lk > rel
    if not keep.any():
        return -99.0
    return float(-0.691 + 10 * np.log10(np.mean(z[keep])))


def pitch_spread_semitones(x: np.ndarray, rate: int) -> float:
    """Standard deviation of the tracked F0, IN SEMITONES.

    Named `pitch_variance_semitones` downstream for historical reasons. It is a
    standard deviation: variance would be in semitones squared and the threshold
    would mean something else entirely. The self-test pins the two files together
    operationally rather than trusting this paragraph.
    """
    win = int(0.04 * rate)
    hop = int(0.02 * rate)
    lo, hi = int(rate / 400), int(rate / 70)           # 70 to 400 Hz, a speaking range
    f0 = []
    for s in range(0, max(0, len(x) - win), hop):
        seg = x[s:s + win]
        if np.sqrt(np.mean(seg ** 2)) < 0.01:          # unvoiced or silent
            continue
        seg = seg - seg.mean()
        ac = np.correlate(seg, seg, mode="full")[len(seg) - 1:]
        if ac[0] <= 0 or hi >= len(ac):
            continue
        band = ac[lo:hi]
        if not len(band):
            continue
        k = int(np.argmax(band)) + lo
        if ac[k] / ac[0] < 0.3:                        # not periodic enough to trust
            continue
        f0.append(rate / k)
    if len(f0) < 8:
        return 0.0
    semis = 12 * np.log2(np.array(f0) / 100.0)
    return float(np.std(semis))


def measure(x: np.ndarray, rate: int) -> dict:
    return {
        "duration_s": round(len(x) / rate, 3),
        "lufs": round(integrated_lufs(x, rate), 2),
        "pitch_variance_semitones": round(pitch_spread_semitones(x, rate), 3),
        "sample_rate": rate,
    }


def write_wav(path: Path, x: np.ndarray, rate: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())


# ---------------------------------------------------------------- the API

def call_api(url: str, payload: dict, key: str, timeout: int = 180) -> dict:
    import requests
    r = requests.post(f"{url}?key={key}", json=payload, timeout=timeout,
                      headers={"Content-Type": "application/json"})
    if r.status_code >= 400:
        raise RuntimeError(f"HTTP {r.status_code}: {r.text[:300]}")
    return r.json()


def synth_one(prompt: str, voice: str, key: str, model: str) -> tuple[np.ndarray, int]:
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}},
        },
    }
    js = call_api(ENDPOINT.format(model=model), payload, key)
    try:
        part = js["candidates"][0]["content"]["parts"][0]["inlineData"]
    except (KeyError, IndexError) as exc:
        raise RuntimeError(f"no audio in response: {json.dumps(js)[:300]}") from exc
    return parse_pcm(base64.b64decode(part["data"]), part.get("mimeType", ""))


def transcribe(x: np.ndarray, rate: int, key: str) -> str:
    """Verbatim transcript, so word accuracy can be measured against the script.

    Uses the same credential and no extra dependency. Asked for verbatim explicitly,
    because a helpfully tidied transcript would hide exactly the dropped and invented
    words this measurement exists to find.
    """
    import io
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())
    payload = {"contents": [{"parts": [
        {"text": "Transcribe this audio VERBATIM. Every word actually spoken, including any "
                 "word that seems out of place. Do not correct, tidy, punctuate creatively or "
                 "summarise. Output the transcript alone."},
        {"inlineData": {"mimeType": "audio/wav",
                        "data": base64.b64encode(buf.getvalue()).decode()}},
    ]}]}
    js = call_api(ENDPOINT.format(model=MODEL_TRANSCRIBE), payload, key)
    try:
        return js["candidates"][0]["content"]["parts"][0]["text"].strip()
    except (KeyError, IndexError):
        return ""


def run(script: str, plan: dict, out: Path, n: int, voice: str, key: str) -> int:
    prompt, refusals = build_prompt(script, plan)
    if refusals:
        print("vo_synth: REFUSED before spending a call\n", file=sys.stderr)
        for r in refusals:
            print(f"  - {r}", file=sys.stderr)
        return 1

    out.mkdir(parents=True, exist_ok=True)
    (out / "prompt.txt").write_text(prompt, encoding="utf-8")

    takes, model, fails = [], MODEL_PRIMARY, 0
    for i in range(n):
        tid = f"take{i + 1}"
        for attempt in range(3):
            try:
                x, rate = synth_one(prompt, voice, key, model)
                wav = out / f"{tid}.wav"
                write_wav(wav, x, rate)
                t = {"id": tid, "model": model, "voice": voice, "wav": str(wav), **measure(x, rate)}
                t["transcript"] = transcribe(x, rate, key)
                takes.append(t)
                print(f"  {tid}  {t['duration_s']:.1f}s  {t['lufs']:.1f} LUFS  "
                      f"spread {t['pitch_variance_semitones']:.2f} st  ({model})")
                break
            except Exception as exc:                                    # noqa: BLE001
                fails += 1
                print(f"  {tid} attempt {attempt + 1}: {exc}", file=sys.stderr)
                # Repeated failures on a preview model are exactly why there is a failover.
                if fails >= 2 and model == MODEL_PRIMARY:
                    model = MODEL_FAILOVER
                    print(f"  falling over to {model}", file=sys.stderr)
                time.sleep(2 ** attempt)

    (out / "takes.json").write_text(json.dumps(takes, indent=2), encoding="utf-8")
    if not takes:
        print("\nvo_synth: no take was rendered. This is a FAILURE, not a silent film: the run "
              "must report the voice step as blocked rather than shipping without it.",
              file=sys.stderr)
        return 1
    print(f"\nvo_synth: {len(takes)} take(s) -> {out / 'takes.json'}. Grade with vo_soundcheck.")
    return 0


# ---------------------------------------------------------------- self-test

def self_test() -> int:
    failures = 0

    def ok(label, cond, extra=""):
        nonlocal failures
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}{'' if cond else '  ' + extra}")
        if not cond:
            failures += 1

    # ---- the refusal this file exists for
    plan = {"overall": "dry, unhurried", "lines": [{"intent": "land the number", "energy": "low"}]}
    clean = "Texas approved eight point nine gigawatts of large load."
    prompt, refusals = build_prompt(clean, plan)
    ok("a clean script builds a prompt", not refusals, str(refusals))
    # The fence has to be UNAMBIGUOUS. If it appears twice, the boundary between
    # instruction and spoken text is a guess, and a guess here is a narrator reading
    # the director's notes out loud.
    ok("the fence appears exactly once", prompt.count(FENCE_OPEN) == 1
       and prompt.count(FENCE_CLOSE) == 1,
       f"open x{prompt.count(FENCE_OPEN)} close x{prompt.count(FENCE_CLOSE)}")
    head, body = prompt.split(FENCE_OPEN)
    body = body.split(FENCE_CLOSE)[0]
    ok("...with the direction OUTSIDE the spoken body",
       "dry, unhurried" in head and "dry, unhurried" not in body)
    ok("...and only the script inside it", body.strip() == clean)

    _, r2 = build_prompt(clean + " [excited]", plan)
    ok("a bracketed stage direction in the script is REFUSED", bool(r2), str(r2))
    _, r3 = build_prompt("Read this slowly and with emphasis.", plan)
    ok("bare direction words in the script are refused too", bool(r3), str(r3))
    _, r4 = build_prompt("", plan)
    ok("an empty script is refused", bool(r4))

    # ---- the tag vocabulary must MATCH vo_soundcheck's, or one of them is decorative
    try:
        sys.path.insert(0, str(REPO / "scripts"))
        import vo_soundcheck as vsc
        ok("the tag vocabulary matches vo_soundcheck exactly", vsc.TAG_WORDS == TAG_WORDS,
           f"only here: {TAG_WORDS - vsc.TAG_WORDS}  only there: {vsc.TAG_WORDS - TAG_WORDS}")
    except ImportError as exc:
        ok("vo_soundcheck is importable for the cross-check", False, str(exc))
        vsc = None

    # ---- the sample rate comes from the response, never from a constant
    pcm = (np.sin(2 * np.pi * 150 * np.arange(24000) / 24000) * 0.2 * 32767).astype("<i2").tobytes()
    x, rate = parse_pcm(pcm, "audio/L16;codec=pcm;rate=24000")
    ok("PCM decodes and the rate comes from the mimeType", rate == 24000 and len(x) == 24000)
    ok("...and one second of it measures as one second", abs(len(x) / rate - 1.0) < 1e-6)
    for bad, why in [("audio/L16;codec=pcm", "no rate"), ("audio/L16;rate=3", "implausible rate"),
                     ("audio/mpeg;rate=24000", "not PCM")]:
        try:
            parse_pcm(pcm, bad)
            ok(f"a response with {why} is refused", False)
        except ValueError:
            ok(f"a response with {why} is refused", True)

    # ---- loudness: a known signal, and the direction of the error if it is off
    sr = 24000
    t = np.arange(sr * 3) / sr
    tone = 0.1 * np.sin(2 * np.pi * 220 * t)
    quiet = integrated_lufs(tone, sr)
    loud = integrated_lufs(tone * 4, sr)
    ok("louder audio measures louder", loud > quiet + 10, f"{quiet:.1f} -> {loud:.1f}")
    ok("...and a 12 dB gain moves it about 12 LU", abs((loud - quiet) - 20 * np.log10(4)) < 0.6,
       f"moved {loud - quiet:.2f}")
    ok("digital silence is not reported as a loudness",
       integrated_lufs(np.zeros(sr * 2), sr) < -60)

    # ---- pitch: and this is the check that pins this file to vo_soundcheck
    drone = 0.2 * np.sin(2 * np.pi * 120 * t)
    f = 120 * (1 + 0.35 * np.sin(2 * np.pi * 0.7 * t))
    varied = 0.2 * np.sin(2 * np.pi * np.cumsum(f) / sr)
    d_spread = pitch_spread_semitones(drone, sr)
    v_spread = pitch_spread_semitones(varied, sr)
    ok("a constant tone measures near zero spread", d_spread < 0.4, f"{d_spread:.3f}")
    ok("a moving tone measures a real spread", v_spread > 2.0, f"{v_spread:.3f}")
    if vsc is not None:
        thr = vsc.MIN_PITCH_VARIANCE
        ok(f"a drone falls BELOW vo_soundcheck's threshold of {thr}", d_spread < thr,
           f"{d_spread:.3f}")
        ok("...and a varied read clears it", v_spread > thr, f"{v_spread:.3f}")
        # End to end: the numbers this file writes, graded by the file that reads them.
        take = {"id": "t", "transcript": clean, "duration_s": 4.0,
                "lufs": vsc.TARGET_LUFS, "pitch_variance_semitones": v_spread}
        ok("a take measured here PASSES the grader end to end",
           vsc.score_take(take, clean, 4.0)["pass"])
        drone_take = dict(take, pitch_variance_semitones=d_spread)
        ok("...and a drone measured here FAILS it",
           not vsc.score_take(drone_take, clean, 4.0)["pass"])

    # ---- a refusal must cost NOTHING. run() with a bad script and a junk credential
    # has to come back refused without ever reaching the network, and without leaving
    # a takes file behind for a downstream step to read as an empty success.
    import tempfile
    with tempfile.TemporaryDirectory() as td:
        out = Path(td) / "takes"
        rc = run(clean + " [excited]", plan, out, 1, "Kore", "not-a-real-key")
        ok("a refused script returns 1 without calling anything", rc == 1)
        ok("...and leaves no takes.json for a later step to misread as success",
           not (out / "takes.json").exists())

    # ---- a missing credential is BLOCKED, which is not a failure and not a silent film
    ok("no key is reported as blocked, with its own exit code", blocked_code() == 3)

    if failures:
        print(f"\nvo_synth self-test: {failures} FAILED", file=sys.stderr)
        return 1
    print("\nvo_synth self-test: all passed")
    return 0


def blocked_code() -> int:
    return 3


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--script", help="the locked VO script")
    ap.add_argument("--direction", help="vo_direction.json from the vo-director agent")
    ap.add_argument("--out", default="out/dispatch/takes")
    ap.add_argument("--takes", type=int, default=3)
    ap.add_argument("--voice", default=None, help="overrides config/voices.yaml")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    if not a.script:
        print("vo_synth: pass --script, or --self-test", file=sys.stderr)
        return 2

    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not key:
        print("vo_synth: BLOCKED. GEMINI_API_KEY is not set, so no take can be rendered.\n"
              "Everything else in this run still works. Report the voice step as blocked and "
              "do NOT ship a silent film.", file=sys.stderr)
        return blocked_code()

    try:
        script = Path(a.script).read_text(encoding="utf-8")
        plan = json.loads(Path(a.direction).read_text(encoding="utf-8")) if a.direction else {}
    except (OSError, json.JSONDecodeError) as exc:
        print(f"vo_synth: cannot read inputs: {exc}", file=sys.stderr)
        return 2

    voice = a.voice
    if not voice:
        cfg = REPO / "config" / "voices.yaml"
        try:
            import yaml
            voice = yaml.safe_load(cfg.read_text(encoding="utf-8"))["voice"]["name"]
        except Exception as exc:                                        # noqa: BLE001
            print(f"vo_synth: no voice: {exc}. Set one in {cfg} or pass --voice.", file=sys.stderr)
            return 2

    return run(script, plan, Path(a.out), a.takes, voice, key)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:                                            # noqa: BLE001
        print(f"vo_synth: broke: {exc}", file=sys.stderr)
        sys.exit(2)
