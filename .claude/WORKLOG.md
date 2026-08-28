# WORKLOG — the August 28th Dispatch, round 5 corrective pass

Written 2026-08-28 after panel round 4. Delete when every wave is DONE.

## The owner's directive, verbatim

> make it so that a "failed run" does not exist. No such thing. Definition of done is a
> delivered video. get that one to ship quality since its close, relax any guard it takes to
> get u there, then lets relax whatever rule forced u into failure permeanently, we wanted to
> reduce spend which is great. but an empty run is worse than an expensive one

And, on the missing pre-synthesis layer:

> shouldn't there be a layer in between where you figure out if everything that you want the
> voice to say is actually accurate and, like, it's actually what you want instead of wasting
> synthesis TTS?

**The reading that governs every decision below.** Relax SPEND guards. Never relax TRUTH
guards. "Ship quality" means raise the film until it clears the bar in `dispatch_rubric.yaml`,
never lower the bar. The rubric threshold, the seven hard fails, the
numeral-traces-to-a-fetched-quote rule, the ban on time-stretching and the alignment evidence
are all unreachable from escalation, and `config/run_limits.json` says so in its own `_why`.

## Where round 4 left it

| judge | score | ship | note |
|---|---|---|---|
| picture | 6.60 | false | diagnosed the deck geometry correctly for the first time |
| place | 6.97 | false | weakest axis for three rounds running |
| story | 6.04 | false | **plus a hard fail**, and four unsupported sentences |

Round 3 was a mean of 6.986. Round 4 is worse, and it is worse because the story judge read
the pixels and the quotes harder than any judge before it, not because the film regressed.
That is the panel working.

## What round 4 actually found, and what is true

Verified independently before acting. Two of the three biggest findings I confirmed by
measurement rather than by reading the report.

1. **The caption hard fail is real, but the aligner is not the fault.** Every cue in
   `captions.json` carries `source: measured_boundary` with `start_measured` and
   `end_measured` both true, so no cue boundary is approximated. The 3.04 s hole the judge
   saw between "contractor sits in" and "a small office on the rig" is IN THE AUDIO: I
   measured `mix_vo.wav` at -55 dB from 22.6 s to 25.4 s. `take2.wav` carries eleven pauses
   over 1.5 s, one of 3.56 s, roughly twenty seconds of dead air in a 56.7 s read. **The
   caption track is honest and the READ is broken.** The fix is a re-synth, not an aligner.
2. **Four sentences assert what no fetched quote carries.** Confirmed against `claims.json`
   line by line. Two are the film's first image and its last line.
3. **Four of nine scenes do not deliver their declared hero.** Confirmed by looking at the
   frames. s4 is the worst: its hero is "the lit window" and the render shows no window, no
   screens and no contractor, just half a sky over a grey slab.

## Why `script_evidence_check` did not catch finding 2

Because it cannot, and it says so in its own docstring and its own self-test. It proves every
NUMERAL and every PROPER NOUN traces to a cited quote. "painted", "on a gate", "off the price
of a well" and "Nobody stands under it" are all common words, and a claim made in common words
is invisible to it. The gate I added yesterday is worth keeping and it is not the whole
answer. **The validator agent reading the script against the quotes is the layer that catches
this, and round 4's story judge is the proof it works.** Wave A moves that read BEFORE
synthesis rather than after it.

## Waves

| # | wave | status |
|---|---|---|
| A | script truth: rewrite lines 1, 3, 6, 8 against the quotes; re-run `script_evidence_check`; validator audit BEFORE any TTS spend | TODO |
| B | board integrity: s7 `on_screen` stops re-asserting the struck claim; declare c14 under s6's readout; drop decorative c9 from s5; date the Dallas Fed survey on screen; fingerprint metaphor off "gate" | TODO |
| C | picture, engine: hard-noon contact shadows across all nine scenes; the deck stops reading as corrugated roofing | TODO |
| D | picture, board: s4 must contain its hero; s8 pumpjack whole in frame; s9 stops being 70 percent empty sky; s6 machine out from under the frame edge | TODO |
| E | voice: one re-synth of the corrected script, directed to kill the dead air; re-align, re-mix | TODO |
| F | render, panel round 5, deliver | TODO |

## Budget at the start of this pass

Target / ceiling, from `run_limits.json`. Escalation grants between the two and records the
event; only the ceiling refuses.

    full_renders      7 / 14        preflight_renders  8 / 16
    tts_calls         8 / 12        panel_rounds       4 / 9
    scorer_calls     12 / 27        reboards           3 / 10

`remotion still` is not metered and is the right tool for checking a framing fix. Use it.

**tts_calls is the tight one.** Four left, and a take costs two (synthesis plus verbatim
soundcheck). That is one read and one retry. Wave A has to be finished and audited before a
single call is spent, which is exactly the ordering the owner asked for.

## A contradiction in CLAUDE.md this pass has to resolve

The escalation paragraph says escalation buys more ATTEMPTS at the bar and raises
`panel_rounds` to a ceiling of 9. The paragraph below it still says "Reserving round five locks
`hard_fail_cleanup`", which was written under the old fixed-allowance model and would end
iteration at exactly the round this pass needs. Both cannot be in force. Fix the prose in
Wave F, in the same commit as the ledger entry, and say which one governs and why.
