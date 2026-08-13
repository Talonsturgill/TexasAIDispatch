#!/usr/bin/env python3
"""vo_soundcheck.py — pick the best take, and refuse the ones that are wrong.

WHY THIS EXISTS

Gemini TTS renders the whole passage in one call for natural sentence-to-sentence flow, which is
right, and it means a bad take is bad for sixty seconds rather than for one line. So N takes are
rendered and this decides which one ships. Without it, take 1 ships every time and "best of N" is
a comment rather than a mechanism.

THE FIVE THINGS A TAKE CAN GET WRONG, and every one has been seen in the sibling.

  WORDS. The model dropped, doubled or invented a word. Measured by transcribing the take and
  diffing against the script. This is the only check that can catch the model saying something
  the script does not say, which is the worst failure available to a narrated film.

  A SPOKEN TAG. The single most embarrassing failure mode. Direction written as an inline tag can
  be READ ALOUD, so a narrator says the word "excited" and the film is over. This is why
  knowledge/craft/VO_DIRECTION.md puts emotion in the DIRECTOR'S NOTES and never in a tag, and why
  this check greps the transcript for the tag vocabulary.

  MONOTONE. A read at one pitch for sixty seconds is a drone however warm the voice is. Measured
  as the variance of the pitch track, not by listening.

  DURATION. A take that runs long against the cut. **The fix is never a time-stretch.** Stretching
  audio to fit is banned in CLAUDE.md because it produces the chipmunk-or-molasses artefact that
  every viewer hears and cannot name. The fix is a SHORTER SCRIPT, so this reports the overage and
  the run trims.

  LOUDNESS. Off-target integrated loudness, which platforms will normalise anyway, badly.

    vo_soundcheck.py --takes out/dispatch/takes --script out/dispatch/vo_script.txt
    vo_soundcheck.py --self-test

Exit 0 a take passed and was chosen, 1 no take passed, 2 the checker could not run.
"""
from __future__ import annotations

import argparse
import json
import math
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]

# Direction vocabulary that has been read aloud by a TTS model. If any of these appears in a
# transcript, the model spoke a stage direction and the take is dead however good it sounds.
TAG_WORDS = {
    "excited", "cheerful", "whisper", "whispering", "sarcastic", "angry", "calm", "serious",
    "laughing", "sigh", "sighs", "pause", "beat", "emphasis", "emphatic", "slowly", "quickly",
    "warmly", "brightly", "flatly", "narrator", "voiceover", "vo", "tone", "upbeat",
}

# Integrated loudness target. -16 LUFS is the conventional target for speech-forward social
# video, and it is an EXTERNAL number rather than one measured from our own takes, which would
# drift toward whatever we happened to render first.
TARGET_LUFS = -16.0
LUFS_TOLERANCE = 1.5

# Below this, a read is a drone. Pitch variance in semitones, measured over voiced frames.
MIN_PITCH_VARIANCE = 1.8

# A take may run this fraction over the cut before it is refused. Over it, the script is trimmed.
MAX_OVERAGE = 0.04

# How much of a transcript may be words the script does not contain. Small and non-zero: a
# transcriber mishears an occasional word, and refusing at exactly zero would make this the
# always-red gate that teaches a run to argue past it.
MAX_INSERTION = 0.06


def normalise(s: str) -> list[str]:
    return re.findall(r"[a-z0-9']+", s.lower())


def word_accuracy(script: str, transcript: str) -> float:
    """Share of the SCRIPT's words that survived into the transcript, in order.

    A plain set comparison would score a take that says every word in a scrambled order as
    perfect, so this is a longest-common-subsequence ratio rather than a bag of words.
    """
    a, b = normalise(script), normalise(transcript)
    if not a:
        return 0.0
    # LCS length, O(len(a) * len(b)) which is fine for a sixty second script
    prev = [0] * (len(b) + 1)
    for x in a:
        cur = [0]
        for j, y in enumerate(b):
            cur.append(prev[j] + 1 if x == y else max(cur[j], prev[j + 1]))
        prev = cur
    return prev[len(b)] / len(a)


def insertion_rate(script: str, transcript: str) -> float:
    """Share of the TRANSCRIPT that is NOT in the script.

    THE HOLE IN word_accuracy. LCS measures how much of `a` survives into `b`, and it is
    monotonically unaffected by anything ADDED to `b`. Measured: a transcript equal to the
    script plus "And that is why everyone should be worried." scores 1.000 and passes; so does
    one that doubles every other word. The module header claims this file catches "dropped,
    doubled or invented" words, and it caught exactly one of the three.

    A TTS model appending an editorialising sentence is the worst failure available to a
    narrated film, which is the header's own phrase for it, and it shipped green. The spoken-tag
    grep only catches it if the invention happens to use direction vocabulary, and a short one
    fits inside the 4 percent duration tolerance.
    """
    a, b = normalise(script), normalise(transcript)
    if not b:
        return 0.0
    # Multiset difference: a doubled word counts once as an insertion, which is right, because
    # saying "approved approved" adds one word that is not in the script.
    from collections import Counter
    extra = Counter(b) - Counter(a)
    return sum(extra.values()) / len(b)


def spoken_tags(transcript: str) -> list[str]:
    """Direction the model read aloud. The check that saves a film from embarrassment."""
    words = set(normalise(transcript))
    # A tag is only a tag when it is bracketed in the SCRIPT sense or stands alone oddly; here
    # we look for the vocabulary appearing at all, because none of these words belongs in a
    # Dispatch script about the grid in the first place.
    return sorted(words & TAG_WORDS)


def score_take(take: dict, script: str, cut_seconds: float) -> dict:
    """Grade one take. Returns the verdict and every measurement behind it."""
    acc = word_accuracy(script, take.get("transcript", ""))
    tags = spoken_tags(take.get("transcript", ""))
    var = float(take.get("pitch_variance_semitones", 0.0))
    dur = float(take.get("duration_s", 0.0))
    lufs = float(take.get("lufs", -99.0))

    overage = (dur - cut_seconds) / cut_seconds if cut_seconds > 0 else 0.0

    ins = insertion_rate(script, take.get("transcript", ""))

    fails = []
    if acc < 0.97:
        fails.append(f"word accuracy {acc:.3f}: the take does not say what the script says")
    if ins > MAX_INSERTION:
        fails.append(
            f"the take says {ins * 100:.1f}% words that are NOT in the script. Word accuracy is an "
            f"LCS ratio and is blind to anything ADDED, so a narrator appending a sentence of its "
            f"own scores a perfect 1.000. A model saying something the script does not say is the "
            f"worst failure a narrated film has.")
    if tags:
        fails.append(f"spoke a stage direction out loud: {', '.join(tags)}")
    if var < MIN_PITCH_VARIANCE:
        fails.append(f"pitch variance {var:.2f} semitones is a drone")
    if overage > MAX_OVERAGE:
        fails.append(
            f"runs {overage * 100:.1f}% over the cut. TRIM THE SCRIPT and re-synth those lines. "
            f"Do NOT time-stretch: it is banned, and it produces an artefact every viewer hears "
            f"and cannot name")
    if abs(lufs - TARGET_LUFS) > LUFS_TOLERANCE:
        fails.append(f"integrated loudness {lufs:.1f} LUFS against a {TARGET_LUFS} target")

    # The composite is only used to RANK passing takes. It never overrides a fail.
    rank = acc * 3 + min(var, 6.0) / 6 - abs(lufs - TARGET_LUFS) / 10 - max(0.0, overage) * 4
    return {"id": take.get("id"), "pass": not fails, "fails": fails, "rank": round(rank, 4),
            "accuracy": round(acc, 4), "insertion": round(ins, 4), "tags": tags,
            "pitch_variance": var, "duration_s": dur, "lufs": lufs,
            "overage": round(overage, 4)}


def choose(takes: list[dict], script: str, cut_seconds: float) -> dict:
    scored = [score_take(t, script, cut_seconds) for t in takes]
    passing = [s for s in scored if s["pass"]]
    passing.sort(key=lambda s: -s["rank"])
    return {"chosen": passing[0]["id"] if passing else None,
            "takes": sorted(scored, key=lambda s: -s["rank"])}


def self_test() -> int:
    failures = 0

    def ok(label, cond, extra=""):
        nonlocal failures
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}{'' if cond else '  ' + extra}")
        if not cond:
            failures += 1

    script = ("Texas approved eight point nine gigawatts of large load. It has watched four "
              "gigawatts of it actually draw.")

    def take(tid, transcript=None, var=3.2, dur=8.0, lufs=-16.0):
        return {"id": tid, "transcript": transcript if transcript is not None else script,
                "pitch_variance_semitones": var, "duration_s": dur, "lufs": lufs}

    ok("a clean take passes", score_take(take("a"), script, 8.0)["pass"])

    # THE ONE THAT ENDS A FILM.
    spoken = script + " excited"
    s = score_take(take("b", spoken), script, 8.0)
    ok("a take that reads a stage direction ALOUD is refused", not s["pass"])
    ok("...and the report names the word", "excited" in s["fails"][0], str(s["fails"]))

    # Words dropped.
    dropped = "Texas approved eight point nine gigawatts of large load."
    ok("a take that drops half the script is refused",
       not score_take(take("c", dropped), script, 8.0)["pass"])

    # Word ORDER matters: a bag of words would score this perfect.
    scrambled = " ".join(reversed(normalise(script)))
    ok("a take that says every word in the wrong order is refused",
       not score_take(take("d", scrambled), script, 8.0)["pass"])

    # THE HOLE LCS LEAVES. Everything added to the transcript is invisible to it.
    invented = script + " And that is why everyone should be worried."
    ok("...but an LCS ratio scores an INVENTED sentence as perfect",
       word_accuracy(script, invented) == 1.0, str(word_accuracy(script, invented)))
    s2 = score_take(take("inv", invented), script, 8.0)
    ok("a take that invents a whole sentence is refused", not s2["pass"], str(s2["fails"]))
    ok("...and the message says LCS is blind to additions",
       any("blind to anything ADDED" in x for x in s2["fails"]))
    doubled = "Texas Texas approved approved eight point nine gigawatts of large load. It has " \
              "watched four gigawatts of it actually draw."
    ok("a take that doubles words is refused",
       not score_take(take("dbl", doubled), script, 8.0)["pass"])
    # Tested on insertion_rate DIRECTLY rather than through score_take, because on this
    # 21-word fixture the 0.97 accuracy floor means exact match and would decide the result.
    # On a real sixty-second script of ~150 words it allows four, which is the point.
    ok("...while a single mis-transcribed word is under the insertion ceiling",
       insertion_rate(script, script.replace("watched", "watch")) < MAX_INSERTION,
       f"{insertion_rate(script, script.replace('watched', 'watch')):.3f} vs {MAX_INSERTION}")
    ok("...because refusing at exactly zero is the always-red gate that gets argued past",
       MAX_INSERTION > 0)
    ok("an identical transcript inserts nothing", insertion_rate(script, script) == 0.0)
    ok("...and a dropped word is not counted as an insertion",
       insertion_rate(script, " ".join(script.split()[:-3])) == 0.0,
       "that is word_accuracy's job, and double-counting would make both numbers unreadable")

    ok("a monotone take is refused", not score_take(take("e", var=0.7), script, 8.0)["pass"])

    over = score_take(take("f", dur=9.2), script, 8.0)
    ok("a take that runs long is refused", not over["pass"])
    ok("...and the message says TRIM rather than stretch",
       any("TRIM THE SCRIPT" in x for x in over["fails"]), str(over["fails"]))
    ok("...while a take a hair over is tolerated", score_take(take("g", dur=8.2), script, 8.0)["pass"])

    ok("an off-target loudness is refused", not score_take(take("h", lufs=-9.0), script, 8.0)["pass"])

    # Choosing.
    res = choose([take("lo", var=2.0), take("hi", var=5.0), take("bad", "nope")], script, 8.0)
    ok("the best PASSING take is chosen", res["chosen"] == "hi", str(res["chosen"]))
    ok("...and a failing take is never chosen however it ranks",
       all(t["id"] != "bad" or not t["pass"] for t in res["takes"]))

    none = choose([take("x", "nope"), take("y", var=0.1)], script, 8.0)
    ok("no passing take returns no choice rather than the least bad one", none["chosen"] is None)

    if failures:
        print(f"\nvo_soundcheck self-test: {failures} FAILED", file=sys.stderr)
        return 1
    print(f"\nvo_soundcheck self-test: all passed (target {TARGET_LUFS} LUFS, "
          f"min variance {MIN_PITCH_VARIANCE} semitones)")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--takes", help="JSON file of rendered takes with their measurements")
    ap.add_argument("--script", help="the locked VO script")
    ap.add_argument("--cut", type=float, default=60.0, help="the cut length in seconds")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    if not (a.takes and a.script):
        print("vo_soundcheck: pass --takes and --script, or --self-test", file=sys.stderr)
        return 2
    try:
        takes = json.loads(Path(a.takes).read_text(encoding="utf-8"))
        script = Path(a.script).read_text(encoding="utf-8")
    except (OSError, json.JSONDecodeError) as exc:
        print(f"vo_soundcheck: cannot read inputs: {exc}", file=sys.stderr)
        return 2

    res = choose(takes if isinstance(takes, list) else takes.get("takes", []), script, a.cut)
    for t in res["takes"]:
        mark = "CHOSEN" if t["id"] == res["chosen"] else ("pass" if t["pass"] else "FAIL")
        print(f"  [{mark:>6}] {t['id']}  acc {t['accuracy']:.3f}  var {t['pitch_variance']:.2f}  "
              f"{t['duration_s']:.1f}s  {t['lufs']:.1f} LUFS")
        for fl in t["fails"]:
            print(f"           - {fl}")
    if res["chosen"] is None:
        print("\nvo_soundcheck: NO TAKE PASSED. Re-synth. If the failures are duration, the fix "
              "is a shorter script, never a stretch.", file=sys.stderr)
        return 1
    print(f"\nvo_soundcheck: chose {res['chosen']}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:                                            # noqa: BLE001
        print(f"vo_soundcheck: broke: {exc}", file=sys.stderr)
        sys.exit(2)
