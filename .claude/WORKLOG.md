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
| A | script truth, audited BEFORE any TTS spend | **DONE** |
| B | board integrity: struck claims out of the shot directions, c14 declared, survey dated | **DONE** |
| C | picture, engine: contact shadows vary with the region's air | **DONE** |
| D | picture, board: every scene contains its declared hero; the derrick is in the rig scenes | **DONE** |
| E | voice: re-synth, re-align, re-mix, re-cut | **DONE** |
| F | render, panel round 5, deliver | **SUPERSEDED, see below** |
| G | delivery gates, corrective render, panel round 6, deliver | IN PROGRESS |

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


## What Wave A actually returned, and why it was worth the ordering

The pre-synthesis audit found EIGHT blocking faults, three of which no judge had
reached, and every one was free to fix at that moment. Two were not wording problems at
all. Two claims had been stored with excerpts too narrow to carry what the film said, and
a re-fetch settled both in the film's favour:

- c5 held only "A drawing of the Grim Reaper illustrates the risk...", which places the
  drawing nowhere, so the placard's rendered words traced to `value_text` rather than to a
  quote. The source sentence before it reads "a gate surrounds the drilling floor with a
  sign reading 'Red Zone: Restricted Area.'" The gate is real. The whole threshold
  metaphor is evidenced rather than invented, and the round 4 judge's "the film invented
  the placement" was right about the FILE and wrong about the world.
- c4 began at "operates more than 30 drilling rigs", naming nobody.

**The lesson is about excerpt width, not about wording.** A quote clipped too tight reads
as a fabrication downstream, and the repair is a re-fetch, never a rewrite that says less
than the source does.

## Three engine and tooling faults this pass found by breaking things on purpose

1. **The reader was handed two scripts.** `vo_direction.json` restates every line, so the
   prompt carried the script twice and the model spoke the stale copy. `build_prompt` now
   refuses on disagreement. This is CLAUDE.md's founding defect applied to a LINE rather
   than to a number.
2. **The evidence gate was dead code under `--self-test`.** Every assertion passed
   `evidence_dir=None`, so a missing `subprocess` import and a reference to an argparse
   global both shipped green. GATE_LESSONS' recurring shape exactly.
3. **A caption ceiling was passed without ever being crossed.** The cue sat at 77
   characters, inside every limit, declined a measured boundary for ending on "are", and
   the next boundary was seven seconds later. 182 characters, 11.7 seconds. Both break
   rules now look ahead at what declining a boundary costs.

## A finding too big for this run, recorded rather than acted on

**The virtual camera frames about three metres of world.** `PERSPECTIVE = 1400` with
`M = 610/1.7` puts 1080 draw units across roughly 3.0 m at z=0, and the Biome's own filled
backdrop planes make anything past z of about 880 invisible, which caps the reduction at
about 0.61. So an 8.4 m drill floor, a 10 m pumpjack and a 44 m derrick CANNOT be framed
whole at true scale, and the library's answer has quietly been to author far objects at
sub-true `scale`, which is the one thing `scale.ts` exists to forbid.

Every framing fault in round 4 is downstream of this. It was worked around this run by
per-scene scale, because re-architecting the depth ceiling mid-run would have burned the
renders that were the point. **The real fix is to move the Biome's backdrop planes back so
z up to about 3000 is usable**, and it is a proposal, not a change made here.


## Round 5 cleared the bar and could not be delivered

| judge | score | ship |
|---|---|---|
| picture | 7.13 | yes |
| place | 7.38 | yes |
| story | 6.81 | no |
| **mean** | **7.110** | over the bar, no hard fail from any judge |

Round 4's caption hard fail is retired on evidence rather than assertion. The story judge
checked all eighteen cue boundaries against `words.json` individually rather than trusting the
`measured_boundary` label, and found eighteen of eighteen on a word flagged anchored.

**Then `deliver_run.sh` found three red gates on the exact board that panel had just cleared**,
and `finish --result publishable` had already been called, so the controller correctly refused
the render that would have fixed them. The run was reopened with a scar.

That ordering fault is now the routine's own rule and a GATE_LESSONS entry: **a passing panel is
not permission to close.** Three judges read the film, the board, the claims and the frames.
They never open `board_scale_check`'s debt ledger or run `flow_check`, so their verdict is not
evidence about either. The gates are the cheap half and they run first now.

## Corrected in the round 6 render

- The kicker caption **silently discarded** everything past three lines, cutting s8's meaning
  clause and its whole collection-date provenance. It shrinks to fit now, and the plate and the
  text are sized from ONE fit rather than two calls.
- The pumpjack's crank floated disconnected because the component's comment claimed a pitman arm
  it never drew. Isolated by re-rendering with the vegetation plane off, which killed every
  filter theory. The rod is drawn now.
- Contact shadows, second tuning. The first was linear in clarity and left High Plains
  mid-range, so a judge reported no shadow for the second round running.
- `run_discipline` was enforcing the spend target as a cap. Third file with that bug.
- The derrick is recorded as measured DEBT with the arithmetic that makes it unavoidable.

## Shipping with these known, priced and unfixed

Stated plainly so the next run starts from them rather than rediscovering them:

1. **No fence in either scene the narration calls "past the fence."** No component exists and
   building one unreviewed at the end of a passing run was the worse risk. Top item for tomorrow.
2. **Line 8 drops c17's five-year horizon** and **c6's injury statistic is narrated unattributed**
   though it is an Exxon executive's, in a film about Exxon. Both need a re-synth and the
   external audio calls are spent at their ceiling.
3. **s9 is the weakest frame in the film** and the longest scene in it.
4. **Place has been the weakest axis four rounds running**, and the root cause has not moved: the
   per-region light TEXAS_VERNACULAR says it never delivered.
