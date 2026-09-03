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
# LUFS_TOLERANCE was deleted on 2026-08-19. Nothing read it. The equality check it belonged to
# was replaced on purpose by LUFS_RESCUE_FLOOR and LUFS_RESCUE_CEILING below, for the reason
# written out there, and the constant was left behind unread. A dead threshold is worse than no
# threshold: `mutation_check` reported it as guarded by nothing, which was true and was never
# going to be fixable, because a value nothing reads cannot be held by any test.

# THE RANGE A RAW TAKE HAS TO BE IN, which is NOT the same thing as the target above.
#
# This check used to be `abs(lufs - TARGET_LUFS) > LUFS_TOLERANCE`, applied to the RAW
# TAKE. `mix.py` imports TARGET_LUFS from this file and normalises the finished master to
# it with a single gain (`gain = 10 ** ((target_lufs - measured) / 20)`), so the level a
# take is rendered at is BY DESIGN not the level that ships. The gate was holding an
# intermediate artifact to the specification of the final one.
#
# It is not a theoretical fault. On the first real run every take from the primary model
# came back between -18 and -22 LUFS with word accuracy 1.000, no spoken tags, healthy
# pitch variance, and two of the three inside the cut, and all three were refused for a
# property the very next step in the pipeline exists to correct.
#
# THE RULE THAT IS ACTUALLY WORTH ENFORCING HERE is whether the mixer's single gain can
# rescue the take. Too quiet and normalising up lifts the noise floor with it. Above the
# target by much and the synth has probably already clipped, and no gain undoes that.
# So this is a floor and a ceiling rather than an equality, and the equality still lives
# in `mix.py`, which refuses outright when normalising to the target would clip.
LUFS_RESCUE_FLOOR = -14.0        # dB below target
LUFS_RESCUE_CEILING = 6.0        # dB above target

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


def fidelity_tokens(s: str) -> list[str]:
    """Words used by the prose-fidelity checks, with spoken figures removed.

    Figures have their own stricter comparison below, where spelled-out and digit forms are
    canonicalised and a wrong value is a hard failure. Counting those same figures again as raw
    prose tokens made a correct ``twenty-four thousand`` / ``24,000`` transcription look like
    three dropped words plus two insertions. Removing only the numeric phrase here keeps the
    responsibilities separate: prose checks prose, and ``figure_mismatch`` checks the value.
    """
    out: list[str] = []
    live_figure = False
    for tok in figure_tokens(s):
        if tok[0].isdigit() or tok in _UNITS or tok in _TENS or tok in _SCALES:
            live_figure = True
            continue
        if live_figure and tok in {"and", "point"}:
            continue
        live_figure = False
        out.append(tok)
    return out


def word_accuracy(script: str, transcript: str) -> float:
    """Share of the SCRIPT's words that survived into the transcript, in order.

    A plain set comparison would score a take that says every word in a scrambled order as
    perfect, so this is a longest-common-subsequence ratio rather than a bag of words.
    """
    a, b = fidelity_tokens(script), fidelity_tokens(transcript)
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
    a, b = fidelity_tokens(script), fidelity_tokens(transcript)
    if not b:
        return 0.0
    # Multiset difference: a doubled word counts once as an insertion, which is right, because
    # saying "approved approved" adds one word that is not in the script.
    from collections import Counter
    extra = Counter(b) - Counter(a)
    # Keep the historical denominator (all spoken tokens), so separating figure notation from
    # prose does not silently tighten the documented six-percent tolerance on short scripts.
    return sum(extra.values()) / max(1, len(normalise(transcript)))


def spoken_tags(transcript: str) -> list[str]:
    """Direction the model read aloud. The check that saves a film from embarrassment."""
    words = set(normalise(transcript))
    # A tag is only a tag when it is bracketed in the SCRIPT sense or stands alone oddly; here
    # we look for the vocabulary appearing at all, because none of these words belongs in a
    # Dispatch script about the grid in the first place.
    return sorted(words & TAG_WORDS)


# ---------------------------------------------------------------- the figures
#
# THE CHECK THIS SHOW MOST NEEDED AND DID NOT HAVE.
#
# `word_accuracy` is an ordered LCS over normalised tokens, which is the right shape for
# prose and is BLIND TO A MISREAD NUMBER on this project, for a reason nobody would guess:
# the script spells its figures out ("fifty thousand") so the model reads them the way a
# person says them, and the transcriber writes them back as DIGITS ("50,000"). Those tokens
# never match, so a figure contributes the same small accuracy loss whatever the take
# actually said.
#
# Measured on a real run. Three takes came back and one of them said FIFTY FIVE THOUSAND
# where the script says fifty thousand. It scored word accuracy 0.974, exactly the same as
# the take that said it correctly, and it was refused only because it also ran long. Had it
# been the short one, this machine would have published a wrong number in a film whose
# entire argument is that only a checkable number is worth anything.
#
# So figures are canonicalised on BOTH sides and compared as figures. A mismatch is its own
# refusal rather than a rounding error inside an accuracy ratio.
_UNITS = {"zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6,
          "seven": 7, "eight": 8, "nine": 9, "ten": 10, "eleven": 11, "twelve": 12,
          "thirteen": 13, "fourteen": 14, "fifteen": 15, "sixteen": 16, "seventeen": 17,
          "eighteen": 18, "nineteen": 19}
_TENS = {"twenty": 20, "thirty": 30, "forty": 40, "fifty": 50, "sixty": 60,
         "seventy": 70, "eighty": 80, "ninety": 90}
_SCALES = {"hundred": 100, "thousand": 1000, "million": 1000000, "billion": 1000000000}

# Dates arrive as "ninth" in the script and "9th" in an equally faithful transcript.
# Compare their values, including wrong or dropped ordinals, rather than treating
# the correct date as an invented numeral and the suffix as invented prose.
_ORDINALS = dict(zip(
    "first second third fourth fifth sixth seventh eighth ninth tenth eleventh twelfth "
    "thirteenth fourteenth fifteenth sixteenth seventeenth eighteenth nineteenth twentieth "
    "thirtieth fortieth fiftieth sixtieth seventieth eightieth ninetieth hundredth thousandth millionth billionth".split(),
    "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen "
    "sixteen seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety "
    "hundred thousand million billion".split()))


def figure_tokens(text: str) -> list[str]:
    tokens = re.findall(r"\d[\d,]*(?:st|nd|rd|th)?\b|[a-z']+", (text or "").lower())
    return [re.sub(r"(\d)(?:st|nd|rd|th)$", r"\1", tok) if tok[0].isdigit()
            else _ORDINALS.get(tok, tok) for tok in tokens]


def figures(text: str) -> list[int]:
    """Every figure a listener would hear, whether it was written as words or as digits.

    Deliberately integers only. This show's spoken figures are counts and ranks, and a
    decimal that reads as "point three" would need its own handling the day one is spoken.
    """
    out: list[int] = []
    cur = 0        # the number being assembled from words
    part = 0       # the part below the current scale word
    live = False
    for tok in figure_tokens(text):
        if tok and tok[0].isdigit():
            if live:
                out.append(cur + part); cur = part = 0; live = False
            out.append(int(tok.replace(",", "")))
            continue
        if tok in _UNITS:
            part += _UNITS[tok]; live = True
        elif tok in _TENS:
            part += _TENS[tok]; live = True
        elif tok == "hundred":
            part = max(1, part) * 100; live = True
        elif tok in _SCALES:
            cur += max(1, part) * _SCALES[tok]; part = 0; live = True
        elif tok == "and" and live:
            continue
        elif live:
            out.append(cur + part); cur = part = 0; live = False
    if live:
        out.append(cur + part)
    return out


def figure_mismatch(script: str, transcript: str) -> list[str]:
    """Figures the take did not say, and figures it said that the script does not have."""
    want, got = figures(script), figures(transcript)
    from collections import Counter
    w, g = Counter(want), Counter(got)
    missing = sorted((w - g).elements())
    extra = sorted((g - w).elements())
    problems = []
    if missing:
        problems.append(f"the script says {', '.join(f'{n:,}' for n in missing)} and the take "
                        f"does not")
    if extra:
        problems.append(f"the take says {', '.join(f'{n:,}' for n in extra)} and the script "
                        f"does not")
    return problems


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
    for m in figure_mismatch(script, take.get("transcript", "")):
        fails.append(f"A FIGURE IS WRONG. {m}. Word accuracy cannot see this, because the "
                     f"script spells figures out and the transcriber writes them as digits, "
                     f"so the tokens never match whatever the take said.")
    if var < MIN_PITCH_VARIANCE:
        fails.append(f"pitch variance {var:.2f} semitones is a drone")
    if overage > MAX_OVERAGE:
        fails.append(
            f"runs {overage * 100:.1f}% over the cut. TRIM THE SCRIPT and re-synth those lines. "
            f"Do NOT time-stretch: it is banned, and it produces an artefact every viewer hears "
            f"and cannot name")
    delta = lufs - TARGET_LUFS
    if delta < LUFS_RESCUE_FLOOR:
        fails.append(
            f"integrated loudness {lufs:.1f} LUFS is {-delta:.1f} dB under the {TARGET_LUFS} "
            f"target. mix.py normalises with a single gain, and lifting a take this quiet "
            f"lifts its noise floor with it")
    elif delta > LUFS_RESCUE_CEILING:
        fails.append(
            f"integrated loudness {lufs:.1f} LUFS is {delta:.1f} dB over the {TARGET_LUFS} "
            f"target, which is the level a take that clipped during synthesis comes back at. "
            f"No gain undoes clipping")

    # The composite is only used to RANK passing takes. It never overrides a fail.
    # HOW WELL THE TAKE CAPTIONS, which nothing here measured until 2026-08-19.
    #
    # Captions may only break where the reader actually stopped, so the number of PAUSES in a
    # take decides how many cue boundaries exist to choose from. A take with few pauses forces
    # long cards that break mid sentence, and three judges in a row docked craft and voice for
    # exactly that while every soundcheck metric stayed green, because accuracy, pitch variance,
    # duration and loudness are all blind to it.
    #
    # Measured, not assumed: a re-synth chosen on the old metrics alone came back with 43 of 117
    # word times measured against the previous take's 56 of 114, and its captions went from 3 of
    # 8 cues ending mid sentence to 5 of 6. The take was better on every graded axis and worse on
    # screen.
    #
    # This is a RANKING TERM and not a hard fail. A read with few pauses is not wrong, it is
    # just harder to caption, and a gate that refused it would be refusing a legitimate
    # performance over a downstream formatting cost.
    pauses = take.get("speech_runs")
    pause_bonus = 0.0 if pauses is None else min(pauses, 14) / 14 * 1.5

    rank = (acc * 3 + min(var, 6.0) / 6 - abs(lufs - TARGET_LUFS) / 10
            - max(0.0, overage) * 4 + pause_bonus)
    return {"id": take.get("id"), "pass": not fails, "fails": fails, "rank": round(rank, 4),
            "speech_runs": pauses,
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

    # ---------------------------------------------------------------- THE FIGURES
    #
    # The case that motivated the check, verbatim from a real run. All three takes came back
    # with word accuracy 0.974 and one of them said FIFTY FIVE THOUSAND where the script says
    # fifty thousand. The accuracy metric could not tell them apart.
    ok("a figure spelled out and the same figure in digits are the same figure",
       figures("an estimated fifty thousand") == figures("an estimated 50,000"),
       f'{figures("an estimated fifty thousand")} vs {figures("an estimated 50,000")}')
    ok("equivalent figure notation does not lower prose accuracy",
       word_accuracy("an estimated fifty thousand", "an estimated 50,000") == 1.0,
       str(word_accuracy("an estimated fifty thousand", "an estimated 50,000")))
    ok("...or count as invented prose",
       insertion_rate("an estimated fifty thousand", "an estimated 50,000") == 0.0,
       str(insertion_rate("an estimated fifty thousand", "an estimated 50,000")))
    ok("...and a MISREAD figure is caught, which word accuracy cannot do",
       bool(figure_mismatch("an estimated fifty thousand", "an estimated 55,000")))
    ok("...while the correct reading passes",
       not figure_mismatch("an estimated fifty thousand", "an estimated 50,000"))
    ok("a dropped figure is caught too",
       bool(figure_mismatch("rank sixty six and rank ninety", "rank 66 and rank")))
    ok("compound figures parse",
       figures("twenty four places ahead") == [24],
       str(figures("twenty four places ahead")))
    ok("the real Ralls date has the same value in either transcript spelling",
       figures("September ninth") == figures("September 9th") == [9])
    ok("ordinal spelling is neither lost nor invented prose",
       word_accuracy("near Ralls on September ninth", "near Ralls on September 9th") == 1.0
       and insertion_rate("near Ralls on September ninth", "near Ralls on September 9th") == 0.0)
    ok("a wrong ordinal date stays a hard figure failure",
       bool(figure_mismatch("September ninth", "September 19th")))
    ok("a dropped ordinal stays a failure",
       bool(figure_mismatch("September ninth", "September")))
    ok("compound ordinal dates preserve the whole number",
       figures("the twenty-first") == figures("the 21st") == [21])
    # AND IT HAS TO REACH THE VERDICT, not just exist as a function. A take that says the
    # wrong number must be refused even when every other measurement is clean.
    misread = take("m", transcript="an estimated 55,000 accelerators")
    ok("a take that misreads a figure is REFUSED on the verdict",
       not score_take(misread, "an estimated fifty thousand accelerators", 8.0)["pass"],
       str(score_take(misread, "an estimated fifty thousand accelerators", 8.0)["fails"]))

    ok("a take loud enough to have clipped in synthesis is refused",
       not score_take(take("h", lufs=-9.0), script, 8.0)["pass"])
    # THE FLOOR AND THE CEILING, and both have to be able to go red or the range is
    # decoration. -31 is seventeen dB under target, which no single gain rescues.
    ok("a take too quiet for the mixer's gain to rescue is refused",
       not score_take(take("h2", lufs=-31.0), script, 8.0)["pass"])
    # AND THE CASE THE OLD RULE GOT WRONG. A take a few dB under target is exactly what
    # mix.py is built to normalise, and refusing it threw away three clean reads on the
    # first real run of this machine.
    ok("a take a few dB under target PASSES, because the mixer normalises",
       score_take(take("h3", lufs=-21.8), script, 8.0)["pass"],
       str(score_take(take("h3", lufs=-21.8), script, 8.0)["fails"]))

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
