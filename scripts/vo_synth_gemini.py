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
                       --out out/dispatch/takes --takes 2 \\
                       --run-state out/dispatch/run_state.json
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
import subprocess
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
# THE SOUNDCHECK'S EYES, and it was pointed at a model that does not exist.
#
# `gemini-3.1-flash-preview` is not a published model id. The 3.1 flash family ships as
# `-lite-preview`, `-image-preview` and `-tts-preview`, and the plain text one is
# `gemini-3-flash-preview` without the point one. So every take SYNTHESISED CORRECTLY and
# then 404'd on the transcription a line later, the loop counted that as a take failure,
# and three good reads were thrown away and retried into the failover. The run reported
# "no take was rendered" for a voice step whose audio was fine.
#
# Nothing could have caught it earlier. `--self-test` is hermetic and never calls the API,
# which is right, and the name only has to be wrong once to burn every take of every run.
# It is now checked against the live model list rather than typed from memory.
MODEL_TRANSCRIBE = "gemini-3-flash-preview"
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
    """The director's notes, as a preamble. Never as tags inside the spoken text.

    `pause_after` IS DELIBERATELY NOT SENT TO THE READER, and 2026-08-28 is the day
    that was measured rather than assumed.

    The direction that day named a pause after all eight lines, 0.7 to 1.4 seconds
    each, about 7.5 seconds of intended silence. The take came back with ELEVEN gaps
    over 1.5 seconds, one of 3.56, roughly TWENTY seconds of dead air in a 56.7 second
    read. Worse than the total: one 2 second hole opened INSIDE line 4, between "a
    contractor sits in" and "a small office on the rig", which no reader would ever
    leave. A judge watching the finished film saw the caption track go empty for three
    seconds mid-sentence and called a hard fail on the caption timing. The captions
    were right. Every cue sat on a measured boundary. The READ had a hole in it.

    THE RULE THIS LEAVES: A PAUSE THE FILM NEEDS IS AN EDIT, NOT A PERFORMANCE.
    `board_retime` cuts the picture to the voice, so the film takes its breathing room
    from where the cuts land. Silence a reader leaves is screen time with nothing
    happening in it, and it is the one thing in this pipeline that cannot be fixed
    afterwards without either a re-synth or the time-stretch this project bans.

    So the plan keeps `pause_after`, because it is real intent and the EDITOR reads it.
    The reader is asked for continuity instead, and asked exactly once.
    """
    lines = []
    if plan.get("overall"):
        lines.append(str(plan["overall"]).strip())
    for i, ln in enumerate(plan.get("lines", []), 1):
        bits = [f"Line {i}"]
        for k in ("intent", "emphasis", "energy"):
            if ln.get(k) not in (None, ""):
                bits.append(f"{k.replace('_', ' ')}: {ln[k]}")
        lines.append("; ".join(bits))
    return "\n".join(lines)


def build_prompt(script: str, plan: dict,
                 evidence_dir: Path | None = None) -> tuple[str, list[str]]:
    """Return (prompt, refusals). A non-empty refusal list means do NOT call the API.

    The script is fenced. Everything above the fence is instruction; everything
    inside it is the text to speak. Nothing is concatenated.
    """
    refusals = []
    body_words = set(re.findall(r"[a-z']+", script.lower()))
    # THE SCRIPT'S EVIDENCE IS CHECKED BEFORE A CALL IS SPENT, for the same reason the
    # direction vocabulary is. On 2026-08-28 a line asserting that the man at the screen
    # was the man the machine displaced went into the voice, the mix, the captions and two
    # full renders, and was found by a judge reading the finished film in panel round
    # three. Nothing had read the narration for evidence, because ship_gate reads it only
    # for numerals and that sentence had none.
    #
    # A fault here is free. The same fault after this line costs a TTS call, an alignment,
    # a retime and a render.
    # The directory is PASSED IN, never read off a module-level argparse namespace.
    # It was `Path(a.script).parent`, which resolves only because main() happens to
    # leave `a` in module scope, so every caller that is not main() -- the self-test
    # included -- died on NameError. The self-test caught it the first time it ran
    # after the evidence gate was added, which is the whole reason it exists.
    board_for_evidence = (evidence_dir / "storyboard.json") if evidence_dir else None
    claims_for_evidence = (evidence_dir / "claims.json") if evidence_dir else None
    if board_for_evidence and claims_for_evidence and board_for_evidence.exists() \
            and claims_for_evidence.exists():
        proof = subprocess.run(
            [sys.executable, str(Path(__file__).with_name("script_evidence_check.py")),
             "--board", str(board_for_evidence), "--claims", str(claims_for_evidence)],
            capture_output=True, text=True)
        if proof.returncode != 0:
            refusals.append(
                "the SCRIPT is not evidenced. Every narrated line must name the claims it "
                "rests on and every figure and name in it must sit in one of their fetched "
                "quotes:\n" + (proof.stdout or proof.stderr).strip())

    # THE DIRECTION CARRIES A SECOND COPY OF THE SCRIPT, AND ON 2026-08-28 THE READER
    # PICKED THE STALE ONE.
    #
    # Every line in vo_direction.json has a `text` field, and the intents quote their
    # own lines back ("Their own crews is the answer to the line before it"). So a
    # built prompt contains the script twice: once in the notes, once inside the fence.
    # Round 5 changed line 7 from "Their own crews" to "Their own people" on the
    # validator's finding that no fetched quote says crews, updated vo_script.txt, and
    # did not update the notes. The take came back saying "Their own crews".
    #
    # This is CLAUDE.md's founding defect wearing different clothes. A number restated
    # in a second place is a number that will be wrong in one of them, and so is a LINE.
    # The prompt was internally contradictory and nothing read it for that, so the call
    # was spent and the word the evidence forbids went into the voice anyway.
    #
    # The fix is not "remember to sync". It is that a disagreement between the two
    # copies REFUSES, before the call, naming both.
    fenced = [ln.strip() for ln in script.strip().splitlines() if ln.strip()]
    noted = [str(ln.get("text", "")).strip() for ln in plan.get("lines", [])]
    if any(noted) and len(noted) == len(fenced):
        for i, (want, got) in enumerate(zip(fenced, noted), 1):
            if want != got:
                refusals.append(
                    f"line {i} of the DIRECTION disagrees with the script it directs. The "
                    f"prompt would carry both and the reader may speak either.\n"
                    f"      script: {want}\n"
                    f"      notes : {got}")
    elif any(noted) and len(noted) != len(fenced):
        refusals.append(
            f"the direction plans {len(noted)} line(s) and the script has {len(fenced)}. "
            f"One of them is stale, and the prompt would carry both.")

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
        "know, at the pace somebody actually talks. Slightly dry. "
        "The authority comes from the facts being right, so the delivery does not work for it. "
        "Not a news anchor, not a documentary hush, not an explainer's bright upward lilt.\n\n"
        # ONE INSTRUCTION ABOUT SILENCE, AND IT ASKS FOR LESS OF IT. The line above used to
        # read "Willing to leave a silence", which was the third separate request for silence
        # in a prompt that already named a pause after every line. See split_direction for the
        # twenty seconds of dead air that bought. The film gets its air from the edit.
        "Pacing: read it as one continuous passage. A normal breath at a full stop is right. "
        "Never pause inside a sentence, and never hold a silence between sentences. The film "
        "is cut to this recording afterwards and the edit puts in every pause it needs, so "
        "silence left here becomes a hole in the finished picture.\n\n"
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
    # CASE INSENSITIVE, and the case is the whole bug. RFC 2586 spells the subtype
    # `audio/L16`, and the API returns `audio/l16; rate=24000; channels=1` in lower case.
    # This test was `"L16" not in mime`, so every take from the PRIMARY model was decoded,
    # rejected as an unknown encoding, and counted as a failure, and after two of them the
    # run fell over to the secondary and shipped from there. Nothing said so above a line
    # of stderr. config/voices.yaml describes the failover as the answer to repeated 500s,
    # which is a different situation entirely, so the ledger would have recorded a voice
    # the film was never read in.
    low = (mime or "").lower()
    if "l16" not in low and "pcm" not in low:
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


def count_speech_runs(x: np.ndarray, rate: int) -> int:
    """HOW MANY PAUSES THE READER ACTUALLY TOOK, which decides how well the take captions.

    A caption boundary may only sit on a measured silence, so a take with few pauses leaves the
    segmenter nothing to choose from and forces long cards that break mid sentence. Nothing in
    this pipeline measured it, so a re-synth could be better on accuracy, pitch, duration and
    loudness and still ship worse captions than the take it replaced. It did exactly that.

    Deliberately imported from `vo_align` rather than reimplemented: that module owns what
    counts as a silence, and a second copy of the threshold here is the fault this repo's own
    law names.
    """
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from vo_align import speech_runs
    return len(speech_runs(x, rate))


def measure(x: np.ndarray, rate: int) -> dict:
    return {
        "duration_s": round(len(x) / rate, 3),
        "lufs": round(integrated_lufs(x, rate), 2),
        "pitch_variance_semitones": round(pitch_spread_semitones(x, rate), 3),
        "speech_runs": count_speech_runs(x, rate),
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


class CallBudgetExhausted(RuntimeError):
    """The shared run ledger refused an external audio-model call."""


def response_tokens(js: dict) -> int:
    """Return provider-reported usage when the endpoint supplies it."""
    usage = js.get("usageMetadata") or {}
    value = usage.get("totalTokenCount")
    if value is None:
        value = sum(int(usage.get(k) or 0) for k in (
            "promptTokenCount", "candidatesTokenCount", "thoughtsTokenCount"))
    try:
        return max(0, int(value or 0))
    except (TypeError, ValueError):
        return 0


def reserve_tts_call(state_path: Path, note: str) -> None:
    sys.path.insert(0, str(REPO / "scripts"))
    from run_controller import reserve

    accepted, message = reserve(state_path, {"tts_calls": 1}, note)
    if not accepted:
        raise CallBudgetExhausted(message)


def budgeted_api(url: str, payload: dict, key: str, state_path: Path, note: str) -> dict:
    """Reserve before the network, then record observed time and tokens afterward."""
    sys.path.insert(0, str(REPO / "scripts"))
    from run_controller import record_telemetry

    reserve_tts_call(state_path, note)
    started = time.monotonic()
    js: dict | None = None
    try:
        js = call_api(url, payload, key)
        return js
    finally:
        elapsed_ms = int(round((time.monotonic() - started) * 1000))
        tokens = response_tokens(js) if js is not None else 0
        accepted, message = record_telemetry(
            state_path, "tts_calls", elapsed_ms, tokens, note)
        if not accepted and sys.exc_info()[0] is None:
            raise CallBudgetExhausted(message)


def synth_one(prompt: str, voice: str, key: str, model: str,
              state_path: Path) -> tuple[np.ndarray, int]:
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}},
        },
    }
    js = budgeted_api(ENDPOINT.format(model=model), payload, key, state_path,
                      f"voice synthesis with {model}")
    try:
        part = js["candidates"][0]["content"]["parts"][0]["inlineData"]
    except (KeyError, IndexError) as exc:
        raise RuntimeError(f"no audio in response: {json.dumps(js)[:300]}") from exc
    return parse_pcm(base64.b64decode(part["data"]), part.get("mimeType", ""))


def transcribe(x: np.ndarray, rate: int, key: str, state_path: Path) -> str:
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
    js = budgeted_api(ENDPOINT.format(model=MODEL_TRANSCRIBE), payload, key, state_path,
                      f"verbatim soundcheck with {MODEL_TRANSCRIBE}")
    try:
        return js["candidates"][0]["content"]["parts"][0]["text"].strip()
    except (KeyError, IndexError):
        return ""


def run(script: str, plan: dict, out: Path, n: int, voice: str, key: str,
        state_path: Path | None = None, evidence_dir: Path | None = None) -> int:
    prompt, refusals = build_prompt(script, plan, evidence_dir)
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
                if state_path is None:
                    raise ValueError("a run state is required before an external call")
                x, rate = synth_one(prompt, voice, key, model, state_path)
                # THE ENGINE RATE IS 48 kHz AND THIS IS WHERE THE TAKE JOINS IT.
                #
                # This file's own header says "vo_synth_gemini resamples Gemini's 24k to
                # 48k", CLAUDE.md says it, and foley.py repeats it as the contract every
                # sound in the library is built against. Nothing did it. `_to_48k` existed
                # and was called in exactly one place, inside `integrated_lufs`, to satisfy
                # BS.1770's 48 kHz specification, so the resampler was present, correct and
                # wired to the measurement instead of to the artifact.
                #
                # The take was written at whatever the API returned, which is 24 kHz, and
                # the fault surfaced at the very end of the run in `mix.py`, which refuses a
                # sound at a rate other than the voice's and named a 48 kHz foley wav as the
                # odd one out. The mixer was right and it was pointing at the wrong file.
                x, rate = _to_48k(x, rate), 48000
                transcript = transcribe(x, rate, key, state_path)
                wav = out / f"{tid}.wav"
                write_wav(wav, x, rate)
                t = {"id": tid, "model": model, "voice": voice, "wav": str(wav), **measure(x, rate)}
                t["transcript"] = transcript
                takes.append(t)
                print(f"  {tid}  {t['duration_s']:.1f}s  {t['lufs']:.1f} LUFS  "
                      f"spread {t['pitch_variance_semitones']:.2f} st  ({model})")
                break
            except CallBudgetExhausted as exc:
                print(f"  {tid}: {exc}", file=sys.stderr)
                print("vo_synth: the run-wide call budget closed further voice attempts. Use "
                      "the best completed take and finish a playable video; starting a new "
                      "takes directory cannot reset it.", file=sys.stderr)
                return 1
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
    # THE ENGINE RATE, asserted on the thing that actually reaches the mixer. The header of
    # this file, CLAUDE.md and foley.py all state that a take is resampled to 48 kHz, and
    # for the whole of this machine's life none of them was true: `_to_48k` was only ever
    # called on the way into the loudness meter. mix.py refuses a mismatched rate, so the
    # cost was a run reaching its final step with a finished film and no usable voice.
    up = _to_48k(x, rate)
    ok("a take is resampled to the 48 kHz engine rate", len(up) == 48000)
    ok("...and resampling does not change how long it is",
       abs(len(up) / 48000 - len(x) / rate) < 1e-3)
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
        # THE EVIDENCE GATE HAS TO ACTUALLY RUN IN A TEST, not just exist.
        #
        # Every assertion above passes `evidence_dir=None`, so the whole evidence branch
        # was dead code under --self-test. It shipped with `subprocess` never imported
        # and with `Path(a.script)` reaching for an argparse namespace that only exists
        # inside main(). The suite was green both times. The first real invocation died
        # on NameError, before the API call, which is the one piece of luck in it.
        #
        # GATE_LESSONS' recurring shape exactly: a green suite measuring something
        # narrower than the thing it appeared to certify. So the gate is exercised on a
        # real board and a real claims file, and the assertion is that it RETURNS A
        # VERDICT rather than raising.
        ev = REPO / "out" / "dispatch"
        if (ev / "storyboard.json").exists() and (ev / "claims.json").exists():
            try:
                _, ev_refusals = build_prompt(clean, plan, ev)
                ev_ran = True
            except Exception as exc:                                    # noqa: BLE001
                ev_ran, ev_refusals = False, [f"raised {exc!r}"]
            ok("the evidence gate runs against a real board instead of being skipped",
               ev_ran, str(ev_refusals))
        ok("...and leaves no takes.json for a later step to misread as success",
           not (out / "takes.json").exists())

    # THE QUOTA BELONGS TO THE RUN, not to a CLI batch or an output directory. What
    # changed on 2026-08-28 is what the quota DOES when it is reached.
    #
    # This used to assert that a fifth call is refused, full stop. Under the target and
    # ceiling model it is granted and recorded instead, and only the CEILING refuses.
    # The reason is in run_limits.json: an empty run is worse than an expensive one, and
    # a cap that turns a nearly finished film into no film has not saved money. The old
    # assertion was written against the old contract and would now fail a correct
    # machine, which is the most expensive kind of stale test there is.
    #
    # So this proves BOTH ends, because a budget that only ever grants is not a budget:
    # a call past the target is granted and leaves a `budget_escalated` event behind,
    # and a call past the ceiling is still refused.
    with tempfile.TemporaryDirectory() as td:
        sys.path.insert(0, str(REPO / "scripts"))
        from run_controller import initialise, read_state, ceilings
        state = Path(td) / "run_state.json"
        initialise(state, "voice-budget-test", "dry-run")
        target = int(read_state(state)["limits"]["tts_calls"])
        ceiling = int(ceilings().get("tts_calls", target))
        ok("the ceiling is above the target, so escalation has somewhere to go",
           ceiling > target, f"target {target}, ceiling {ceiling}")

        for i in range(target):
            reserve_tts_call(state, f"batch {i + 1}")
        try:
            reserve_tts_call(state, "one past the target, in a brand new batch")
            granted = True
        except CallBudgetExhausted:
            granted = False
        ok("a call past the TARGET is granted rather than ending the run", granted)
        ok("...and it is recorded as an escalation rather than passing silently",
           any(e.get("resource") == "tts_calls"
               for e in read_state(state).get("escalations", [])))

        while True:
            try:
                reserve_tts_call(state, "walking up to the ceiling")
            except CallBudgetExhausted:
                break
            if int(read_state(state)["usage"]["tts_calls"]) > ceiling + 2:
                break
        used = int(read_state(state)["usage"]["tts_calls"])
        ok("...and the CEILING still refuses, so escalation is not an open tab",
           used == ceiling, f"stopped at {used}, ceiling {ceiling}")

    # ---- a missing credential is BLOCKED, which is not a failure and not a silent film
    #
    # This used to read `ok(..., blocked_code() == 3)`, comparing a function to the
    # constant it returns. That assertion holds however main() actually behaves, and
    # what a run needs to know is not what the constant says, it is what the PROCESS
    # exits with when the key is absent. Three exit codes matter here and they mean
    # different things to the routine: 3 blocked, 2 a usage or input error, 1 a real
    # failure. So the process is run.
    import os as _os
    import subprocess
    with tempfile.TemporaryDirectory() as td:
        script_path = Path(td) / "vo.txt"
        script_path.write_text(clean, encoding="utf-8")
        env = {k: v for k, v in _os.environ.items() if k != "GEMINI_API_KEY"}
        r = subprocess.run([sys.executable, str(Path(__file__).resolve()),
                            "--script", str(script_path), "--out", str(Path(td) / "takes")],
                           capture_output=True, env=env, timeout=120)
        ok("with no key the PROCESS exits 3, blocked rather than failed",
           r.returncode == 3, f"exit {r.returncode}: {r.stderr.decode()[:120]}")
        ok("...and says so on stderr, so a run reports blocked instead of shipping silence",
           b"BLOCKED" in r.stderr and b"silent film" in r.stderr, r.stderr.decode()[:160])
        ok("...and leaves no takes behind",
           not (Path(td) / "takes" / "takes.json").exists())
        # 3 has to be distinguishable from the codes either side of it, or the
        # routine cannot tell a missing credential from a broken input.
        r2 = subprocess.run([sys.executable, str(Path(__file__).resolve())],
                            capture_output=True, env=env, timeout=120)
        ok("...and a usage error is 2, a DIFFERENT code, so the two are distinguishable",
           r2.returncode == 2 and r2.returncode != r.returncode, f"exit {r2.returncode}")

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
    ap.add_argument("--takes", type=int, default=2)
    ap.add_argument("--run-state", default="out/dispatch/run_state.json",
                    help="shared run ledger; synthesis and transcription both debit it")
    ap.add_argument("--voice", default=None, help="overrides config/voices.yaml")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()

    if a.self_test:
        return self_test()
    if not a.script:
        print("vo_synth: pass --script, or --self-test", file=sys.stderr)
        return 2
    if a.takes < 1:
        print("vo_synth: --takes must be positive", file=sys.stderr)
        return 2

    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not key:
        print("vo_synth: BLOCKED. GEMINI_API_KEY is not set, so no take can be rendered.\n"
              "Everything else in this run still works. Report the voice step as blocked and "
              "do NOT ship a silent film. If no prior take exists, use fallback_audio.py to "
              "produce an explicitly review-only visual MP4 instead of ending empty.",
              file=sys.stderr)
        return blocked_code()

    state_path = Path(a.run_state)
    try:
        sys.path.insert(0, str(REPO / "scripts"))
        from run_controller import read_state
        state = read_state(state_path)
        # THE HEADROOM COMES FROM THE CONTROLLER'S RULE, NOT A SECOND COPY OF IT.
        # This read `limits - usage`, which was the whole rule right up until the
        # controller learned to escalate past the spend target toward a hard ceiling on
        # 2026-08-28. After that it was a stale duplicate: it refused, before spending
        # anything, work the controller would have granted, and the run could not
        # re-synth a line the panel had shown was WRONG. A budget rule written down in
        # two places is a rule that will be wrong in one of them, which is this repo's
        # founding defect, so the ceiling is read from the same ledger the controller
        # writes rather than re-derived here.
        ceiling = int((state.get("escalation_ceiling") or {}).get(
            "tts_calls", state["limits"]["tts_calls"]))
        headroom = max(int(state["limits"]["tts_calls"]), ceiling)
        remaining = headroom - int(state["usage"]["tts_calls"])
    except (OSError, ValueError, KeyError, json.JSONDecodeError) as exc:
        print(f"vo_synth: cannot read the shared run state {state_path}: {exc}", file=sys.stderr)
        return 2
    minimum_calls = a.takes * 2
    if minimum_calls > remaining:
        print(f"vo_synth: {a.takes} take(s) require at least {minimum_calls} external calls "
              f"(synthesis plus verbatim soundcheck), but this run has {remaining} left. "
              "Choose fewer takes before spending anything.", file=sys.stderr)
        return 1

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

    return run(script, plan, Path(a.out), a.takes, voice, key, state_path,
               evidence_dir=Path(a.script).parent)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:                                            # noqa: BLE001
        print(f"vo_synth: broke: {exc}", file=sys.stderr)
        sys.exit(2)
