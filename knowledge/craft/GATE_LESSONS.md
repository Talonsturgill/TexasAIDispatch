# Gate lessons — faults that shipped with every check passing

**Required reading before you add a gate, trust one, or conclude that a green suite means a
correct product.**

Every entry is a real fault from this repo. Each says what passed, what was actually wrong, and
what to check instead. The sibling record in `TexasAIDocket`'s `knowledge/shared/GATE_LESSONS.md`
carries the same discipline for the record and the site; this one is about the engine, the drawings
and the voice.

The through-line, and it does not change: **a checker sees what it reads, and the product is what a
viewer receives.** Everything below is a gap between those two things.

---

## 1. A gate can be connected to nothing, and it reports clean

`staging_check.py` refused an animal standing in a region it does not live in, had a full
self-test, was wired into CI, and ran green. It looked for `<RegionLight region="...">`.

**Every real scene wraps its world in `<Biome region="...">`.** So it had been running on the
review sheet and on nothing else. Proved by planting a javelina in the Rolling Plains, where it
does not live, and watching the check report clean.

This is the worst kind of gate, because it is **indistinguishable from one that works.** A red gate
tells you something. A gate guarding nothing tells you the same thing a passing gate does.

**What to check instead.** Make the checker count what it scanned, and make zero a FAILURE:

> scanned 4 scene files and found NO region blocks in any of them. Either no scene declares a
> region, or this checker is looking for a wrapper nothing uses.

That is the one question a green gate can never answer about itself, so you have to make it answer
it out loud. And the way to find out whether a gate is connected is not to read it. **It is to
break the product on purpose and watch.**

## 2. A fixture written by the same hand as the detector agrees with the detector

A self-test proves the checker does what its author thought. It cannot prove the author understood
the product. Every gate here passed its own suite while the five defects in entries 4 to 8 sat in
the shipped output.

**Drive the real thing end to end.** The proof scene found composition faults no gate had an
opinion about, and the fauna sheet found five drawing bugs `tsc` was structurally blind to.

## 3. Checking a NAME is checking a claim. Check the evidence

`ship_gate` refused captions unless `method == "forced_alignment"`. Anybody can type that string,
including a words-per-second divider relabelled by a run in a hurry.

The rule that matters is not what the method is called. It is **whether the boundaries were
measured off the waveform**, because re-anchoring at every phrase is the mechanism that stops drift.
So the gate now reads `boundaries_measured`, a count a divider cannot produce however it labels
itself.

**Generally: when a gate checks a self-reported label, ask what artefact the honest path produces
that the dishonest path cannot, and check for that.**

## 4. A rule about a SET cannot be enforced per item

The doctrine says *a herd of identical longhorns is the tell.* The code drew each animal's hide
with an independent random pick from a six-colour palette. Four of the six were the same tan
family, so a herd of four came back with three indistinguishable animals, and the comment about
variability was decorative.

A per-item random draw cannot enforce a property of the group. `herdHides(n)` shuffles and takes
**without replacement**, so the herd is varied by construction.

## 5. A thin shape with a thick outline fills solid

The jackrabbit's haunch was a crescent about five units across with a three-unit ink stroke. The
two sides of the stroke met in the middle and the animal grew a black hole in its side. Valid SVG,
clean typecheck, clean lint.

**A shape has to be thicker than twice its own outline.** Nothing but a render will tell you.

## 6. A shared form gradient is positioned for the shape it was designed around

The same haunch, once thick enough, filled uniformly dark. It used the body's `FormGradient`, and
it sits at the far end of the body's ramp, so it was painted entirely in the shade colour.

**A satellite shape takes a flat tone from the ramp, not the parent's gradient.** Which is also
what a haunch actually looks like: a form turning away, not a second lit volume.

## 7. Relative scale has to be arithmetic, never a comment

`FAUNA_AND_FLORA.md` says an armadillo is housecat-sized and warns against drawing it dog-sized.
The first `fauna.tsx` drew every species in whatever local frame was convenient, so `scale={1}`
meant nothing across species and an armadillo beside a longhorn came out the same size. **The
doctrine's own headline mistake, reintroduced by the API one layer below where anybody would look
for it.**

A comment cannot stop it. `SIZE_M` declares each animal's real dimension in metres and `fit()`
converts against the Character rig, so the relationship is right without anyone thinking about it.
The contact sheet carries a person, so the arithmetic is visible rather than asserted.

## 8. A profile view can delete the thing you are drawing

A longhorn in strict profile **has no horns.** They project toward and away from the viewer and
foreshorten to nothing. Every postcard in Texas turns the head to three-quarter for exactly this
reason, and nobody writes it down because everybody who draws one discovers it.

**Then it happened again, on a completely different subject.** A Houston slab's swangas are chrome
elbows protruding a foot past the wheel face: a cone pointing at the viewer, which in strict
profile is a plain wire wheel. A careful side view of the most distinctive wheel in Texas rendered
as a purple sedan.

The two fixes are different and the choice between them is the useful part. **Turn the view** when
the subject can carry it, as the longhorn's head does while its body stays in profile. **Restate
the fact in a dimension the view still has** when it cannot: the one thing an elbow does to a
silhouette is stand wider than the tyre and overhang the body, so the chrome is drawn larger than
the tyre and on top of the fender.

**Before drawing a subject, ask which view destroys its identifying feature**, and then ask which
of those two fixes the subject allows.

## 9. A delimiter that appears in its own instructions is not a delimiter

`vo_synth_gemini` fenced the spoken text between `BEGIN SCRIPT` and `END SCRIPT`, and the
instruction above it read *"read only the text between the BEGIN SCRIPT and END SCRIPT markers."*
Two openings. The real boundary was a guess, and a guess there is a narrator reading the director's
notes aloud.

**Assert your fence appears exactly once.** Describe a delimiter in the instructions; never quote it.

## 10. A checker that reads its own advice as a violation trains you to ignore it

`engine_lint` failed on its first run because `materials.tsx` documents that it does *not* use
`Math.random`. `mix.py`'s self-test proves there is no resampler in it by scanning its own source,
and its docstring says the word "resampler" four times while explaining that there is none.

**Strip comments and docstrings before scanning code, and preserve newlines so line numbers stay
true.**

## 11. A tokeniser is where a numeral gate goes wrong

A sibling's numeral lint used `\d{1,4}` and read "2,600 streamlines" as the number 600, so a
correct, computed, authorised figure was reported as unauthorised. **That is how a gate gets
switched off**, and a switched-off gate is worse than one that never existed, because somebody
believed it for a while.

A numeral is one token including its separators and its decimal part.

## 12. An assertion that cannot fail is not an assertion

Written in this repo, in a self-test, in earnest:

```python
ok("...before any call is made", any("before" not in x or True for x in r2))
```

`or True`. It passes on every input. **Every assertion needs an input that makes it fail**, and if
you cannot think of one, you have not written a test. The replacement runs the real function
against a junk credential and proves it returns without touching the network and without leaving a
file behind.

## 13. A dependency the CI does not install is a gate that fails, and the wrong fix makes it worse

The image gate failed on first push because CI had no Pillow. The tempting fix is to make the gate
skip when its dependency is missing. **A skipped test and a passing test are the same colour.**
Install the dependency.

## 14. Two files that agree by convention drift apart unwatched

`vo_synth_gemini` produces a pitch number and `vo_soundcheck` refuses on a threshold for it. A
paragraph in each saying they agree is worth nothing on the day somebody changes one.

Its self-test now synthesises a drone and a varied read and asserts the produced number falls the
right side of the *imported* threshold, and asserts the two files' tag vocabularies are identical.
**Pin interfaces with a test, not with a comment.**

## 15. Run gates by EXIT CODE, never by reading the last line

A report that prints advice on failure and one clean line on success looks reassuring either way
under `tail -1`. This has shipped a red gate before.

## 16. When a gate reports a fault, the data may be what is wrong

`staging_check`'s first real run reported four mis-placed animals. Two were correct. The other two
were an armadillo and a feral hog whose **habitat lists were simply wrong** — feral hogs are in
nearly every county in Texas, and the list said seven regions.

**A gate firing is a question, not a verdict.** Check the rule before you change the product.

## 17. A field of flat colour reads as longer than it is

The pickup was drawn from measurements: 6.75 m long, 3.99 m wheelbase, a 1.35 m bed rail on a
2.0 m body. Every number checked, and it rendered as a 1960s land yacht.

Two causes, and only the first is arithmetic. **The overhangs were the wrong way round** — on a
pickup the long overhang is at the REAR, because the bed hangs past the rear axle, and the front
wheel sits almost at the bumper. Swapping them gave the truck a 1.9 m nose.

The second was not a number at all. **The bed side was one flat colour field the length of the
vehicle**, and a long unbroken field reads as longer than it measures. Adding the wheel arches
fixed the proportion without changing a single dimension.

**Correct measurements are necessary and are not sufficient.** What the eye reads is contrast and
interruption, and neither of those is in the spec.

## 18. A screen blend is invisible on a light ground

`sensing.tsx`'s methane plume used `mixBlendMode: screen` unconditionally, which is the right
choice over a night frame and does **nothing at all** over a near-white one, because screen only
ever brightens. It rendered as a faint smudge with an unreadable leak rate, and a day scene in this
show is light far more often than it is dark.

`tsc` cannot see a blend mode. A lint cannot either. **Only a render on the ground you will
actually use it over will tell you**, which is the same lesson as entries 5 and 6 arriving through
a third door: compositing, like stroke width and like gradient placement, is a property of the
CONTEXT a component lands in and not of the component.

The fix is a default that works on the common ground and an explicit `onDark` for the other one.

## 19. A file that exists and is never invoked is worse than a missing one

`.claude/agents/scorer.md` sat on disk, fully written, while Phase 6 of the routine said only "then
the panel" and never named the agent. **No run would ever have spawned it.** Eleven gates were
green, `tsc` was clean, and the repo looked complete.

This is the failure the whole project was set up to prevent, in the maintainer's words at the very
start: *you move stuff from the old repo into the new one and then forget to wire it up.* A missing
file announces itself. An unwired one does not, and the prompt keeps describing a capability the run
does not have.

**Check both directions, for agents and for scripts.** Orphans: everything on disk is invoked by
name. Ghosts: everything invoked exists. `scripts/wiring_check.py` does both.

And the trap inside the fix: **a `--self-test` mention is not wiring.** Every gate is in CI by
definition, so counting a CI self-test as invocation makes the orphan check structurally incapable
of failing for any gate — a checker that cannot go red about the thing it checks. Invocation means a
prompt or a workflow runs it *on real inputs*.

The gate was verified the only way that counts: the orphan was put back on purpose and the check
went red, then removed and it went green.

## 20. Two of a thing were one thing, and the one surface that would have shown it could not

An SVG gradient, clip path or filter is referenced by **document-global id**, and the browser takes
the first match in document order without a word about the rest. Every drawn thing in this library
built its ids out of `seed`:

```
const uid = `lh${seed}`;              // Longhorn, seed defaults to 5
```

so two longhorns staged without explicit distinct seeds both emitted `id="lh5_c"` and **the second
animal was painted with the first animal's coat.** The two-letter tags collided across modules too:
a whitetail and a civics water tower were both `wt`, so a deer and a tank at the same seed shared a
gradient.

Four checkers were green and each was blind for its own reason. `tsc` cannot see it, because an id
is a string. `engine_lint` reads colour literals. `staging_check` reads which animal stands in which
region. `composition_check` reads which composition ids exist.

**The part worth keeping is why the review sheet could not find it.** The fauna sheet's herd row
stages five longhorns as `seed={51 + i * 7}` — deliberately distinct, because a person typing a herd
can see the result and fixes it on sight. So the single surface built to show a herd is the one
surface **structurally incapable of reproducing the defect**, and every eye-check of it passed
honestly. Then `Dispatch.tsx` arrived, placing elements from board JSON where `seed` is optional,
and unseeded duplicates went from unlikely to ordinary in the same commit.

**A hand-authored review surface is written by someone avoiding the failure. Data-driven staging is
written by a routine that does not know the failure exists.** When staging moves from the first to
the second, the review surfaces stop covering it and nothing announces the change.

Three separate fixes, and the split between them is the lesson:

- **Ids come from `useId()`.** Unique per instance, stable for a given tree, and *invisible*.
- **Appearance may NOT come from `useId()`**, because tree position shifts when a sibling appears on
  a frame condition, and an animal whose coat changed mid-shot would be far worse than two that
  matched. It comes from the element's **address on the board**, which is distinct per instance and
  identical on every frame.
- **The address arithmetic adds rather than hashes.** The first version hashed `scene/plane/item`
  and collided four times in two hundred draws, exactly as the birthday bound predicts. Hashing the
  scene and *adding* the position inside the modulus makes same-scene collisions impossible instead
  of unlikely, and the test enumerates all 32,768 positions rather than sampling. **A gate that goes
  red one run in fifty is a gate people learn to re-run.**

And the assertion that was wrong on the first pass, in the file written to catch this: it asked
whether a hide colour was *present in the markup*. On a document with two gradients sharing an id
both colours are present and only one is drawn, so it passed while the duplicate check beside it was
correctly red. **Assert what a browser would paint, not what the document contains** — resolve
`url(#x)` to the first definition the way the renderer does.

Verified the only way that counts: the seed-derived uid was put back in `fauna.tsx` on purpose, both
assertions went red, and it was removed and they went green.

## 21. An assertion that cannot fail, in the file written to stop that

Three of them, in three different gates, each dressed as the conclusion of the real
assertions around it:

```python
ok("a story sharing only channel words is fresh", check_entities(...)[0] or True)
ok("no key is reported as blocked, with its own exit code", blocked_code() == 3)
ok("...so a time-stretch cannot be reached from here even by accident", True)
```

The first is unfailable by construction. The second compares a function to the constant it
returns, so it holds however `main()` actually behaves, and what the routine needs to know is what
the PROCESS exits with when the credential is missing. The third is a literal, placed immediately
after a loop of seven real checks so it reads as their summary while asserting nothing.

**The `or True` one is the instructive one, because it was also testing the wrong thing.** Its
fixture shared a subject token with an earlier entry, so it re-proved the line above it about a
single overlap and never staged what its own label promised. The `or True` had been appended to
stop a line failing rather than to fix what it measured, and the label kept describing the test
that was intended. **A label is a claim about a test. When they drift apart the label is what gets
read, and the test is what runs.**

Two more found in the same sweep, both silent rather than tautological. `recent()` returned the
whole ledger when no `--today` was passed, and neither subcommand passes one, so `--days` was a
no-op on every real invocation and the dedupe window was all of history. That direction of failure
is the dangerous one: **a window that never ends does not miss repeats, it invents them**, and a
gate that calls a new story a repeat is a gate a run learns to argue past. And the mixer's
banned-word loop could have iterated over an empty list and printed nothing, so the summary line
now checks that the scan covered every function in the file rather than asserting `True`.

The general form of the question is now a gate of its own. `scripts/mutation_check.py` makes each
declared threshold vacuous, one at a time, and requires that gate's own `--self-test` to go red.
**A threshold that survives its own mutation is a threshold nothing is holding.** All eleven were
caught, which is the first evidence in this repo that the self-tests are connected to the numbers
they name rather than merely green. It runs in five seconds, which is the whole argument for
keeping it in CI rather than doing it once by hand and trusting the memory of it.

## 22. Gate 0 gated a document that was not the film

`storyboard_check.py` read scenes whose `planes` were the labels a director writes -- sky, far
ridge, mid, near band, hero. `Dispatch.tsx` renders scenes whose `planes` are `{z, items}`
carrying named components. **Nothing converted one into the other and nothing compared them.**

So every rule in the most expensive gate in the routine -- the composition fingerprint, the
cross-run divergence memory, the never-two-films-alike guarantee, the beat mix, the tiling, the
silent-first rule -- was being enforced against a board that was **not the thing Remotion would
render**. A board could pass Gate 0 and stage nothing at all. The prompt's own Phase 5 line was
`--props=...`, an ellipsis, because there was no step that produced the props and nobody had
noticed there needed to be one.

It is the same shape as entry 19, one level up. There, a file existed and nothing invoked it.
Here, a *check* existed and nothing connected it to the artifact. **A gate is defined by the
artifact it reads, not by the rules it contains**, and this one had drifted onto a neighbour.

Two things kept it invisible. `len(planes)` is 5 for both shapes, so the plane-count rule passed
either way. And the two halves were written months apart by different concerns, each internally
coherent, so reading either file alone showed nothing wrong.

**THE BOARD IS THE PROPS.** One document, gated and then rendered by path. The staging half is
now checked as hard as the planning half -- every `kind` is a registry name, elements made of data
have their data, planes run far to near with distinct z, nothing is sited where it does not
belong, and a scene that stages nothing is refused -- because every one of those is a fault
`Dispatch.tsx` hits at render time with the research, the script and the voice already paid for.

And the trap inside the fix: the self-test's own fixture still used the old plane shape, so it
passed while proving the checker worked on a document the product does not use. That is the same
fault a third time, in the test for it.

## 23. True scale is a system, not a per-file choice

`fauna`, `vehicles` and `civics` fit every drawing to a real dimension, so `scale={1}` means one
thing and a longhorn beside a person is right without anyone thinking about it. `kit` did not.
Eleven objects were drawn at whatever size read well in a review sheet, so `scale` there was a
private convention per component that a board author had to discover by rendering.

It stayed invisible while scenes were hand-authored, because a person tuning a number until the
frame looks right does not care what the number means. It surfaced the moment a board wrote the
number from story data: a data centre came out shorter than the two people standing in front of
it, and a grain elevator at `scale: 1` was seven frame-heights tall.

**Converting the module is the easy half.** The ripple is that every existing call site's number
now means something else, and the conversion is exact -- divide by the fit factor -- but only if
you find them all, including the ones inside computed expressions in `biomes.tsx` that a regex for
`scale={0.9}` will not match.

The honest limit, written down rather than papered over: a gate that checked staged size from the
height tables **would not have caught the frame that started this**. The centre pivot was the
right height and forty feet too wide, because a quarter-mile machine is ten times longer than it
is tall and the tables carry only height. A width-blind size gate would have gone green on a
broken frame and been worse than no gate, so there is not one. The tools that work here are true
scale so the numbers compose, and a render you actually look at.

## 24. An `<svg>` clips, and a plane that recedes cannot reach the edge it was clipped to

Each plane in `Dispatch.tsx` is an `<svg width={1080} viewBox="0 0 1080 1920">`, and an SVG clips
to its viewport. So no plane could draw one pixel outside the frame. Meanwhile `Plane` scales a
receding layer DOWN about the frame centre, so a ground treatment sized exactly to the frame
arrived on screen about a hundred pixels narrow, with bare ground showing down both margins.

Sizing the treatment wider does nothing, because the clip happens first. The fix is one line --
`style={{overflow: 'visible'}}` -- and the reason it is worth an entry is that **the symptom
points at the wrong file.** It looks like a sizing bug in the board, and every attempt to fix it
there fails silently in a way that reads as "not wide enough yet".

Nothing errored. The film simply looked like it had a border nobody gave it, on every scene.

## 25. A gradient painted per shape prints every shape's edge

`RainCell` drew a convective cell as ten overlapping ellipses, each filled with the same
top-to-bottom gradient. It rendered as a **nautilus shell**. Three rewrites went at the geometry
-- the lobe count, the offsets, the shear, the proportion of tower to lobe -- and every one of
them produced a differently shaped shell, because the geometry was never the problem.

A gradient applied per shape runs top-to-bottom of **that shape's own bounding box**. So every
lobe in the cluster arrived carrying its own dark underside, and a column of dark undersides is a
row of visible arcs that the eye assembles into a spiral. **The cluster was being painted as ten
shapes when it needed to be painted as one mass.**

The fix is not a better gradient. It is a flat fill for the whole cluster so the overlaps are
invisible, then a second smaller pass up the lit side and a shaded rank along the base. Same
shapes, same positions, and it stops being a shell.

It is the same law as the horizon-haze note in `biomes.tsx` -- *a fill that reaches full strength
exactly where its shape is cut prints its own edge into the picture* -- and lesson 5's stroke
width and 18's blend mode: **a paint is a property of the CONTEXT a shape lands in, not of the
shape.** That is now four separate doors onto one rule, which is how you know it is the rule.

The trap inside the fix: the highlight pass printed circles of its own the first time, because it
was drawn at high opacity against the flat mass. The second layer is subject to the same law as
the first.

**Honest note on the state of it.** `RainCell` is the weakest drawing in the library. It is
structurally right now and it is not yet a storm anyone would photograph, and it took nine renders
to get that far. It is written down rather than quietly left because the next person to open that
component should know it is a known-soft spot and not a finished one.

## 26. Six sheets shipped, three looked at

The application sheets were written, registered, typechecked, passed every gate and merged. Three
of the six had never been rendered. **A review surface nobody renders is exactly the artifact the
sheet was built to prevent**, and it took writing the sheets to reproduce the fault one level up.

What the three unlooked-at ones were hiding:

**The truck was a CAB-OVER.** Flat front, windshield straight above the bumper, no hood. That is a
European truck. Every Class 8 lane-haul tractor on a Texas interstate is a conventional with a
long hood ahead of the windshield -- the fleet this beat is actually about runs Peterbilt 579s and
Volvo VNLs -- and the hood is not a detail, it is most of the silhouette. On the one beat where
Texas is genuinely first. A Texan reads a cab-over as "not from here" as fast as they read a straw
hat on a High Plains farmer.

`tsc` was clean, `engine_lint` was clean, `paint_ids` was clean, `registry_check` was clean. **Not
one of eleven gates can tell you the vehicle is from the wrong continent.** Only a person looking
can, and only if the sheet exists AND somebody renders it.

The trailer had the same form gradient as the tractor and rendered as a CYLINDER -- a tanker, on
the beat about dry vans. Entry 25's law again, arriving a fifth time: a box has one flat face and
takes a flat fill; a gradient that curves across a face says the face is curved.

And the plain bug underneath both: the cab path was a long chain of relative `l` and `q` segments,
one of which ran the wall 119 units DOWN from the roof and put a slab of blue below the road
surface. **A long relative path is a chain where one wrong link moves everything after it.** The
rewrite is absolute coordinates throughout, for a shape somebody has to be able to reason about.

The rule this leaves: **rendering the review surface is part of shipping it, not a follow-up.**
A sheet that has not been looked at is not a review, it is a promise of one.

## 27. A gate that reads a field nobody writes

`ship_gate.py` checks seven hard fails. Three of them read scene keys off the board, and each
section carried its own hand-written tuple of key names. Between them those three tuples named
**six fields the board has never had**: `supers`, `slide_text`, `lower_third`, `vo`, `note` and
`location`. None of the three named `super`, which is the only authored string `Dispatch.tsx`
paints on screen.

So the compute-not-generate gate, the retired-motif gate and the rig-floor headgear gate all ran
over an empty string for their entire life, and all three reported clear. Confirmed by planting
into the real `examples/board.json`:

- `super = "8,297 megawatts approved"`, a numeral authorised by nothing, **zero hard fails**.
- `super = "Six Flags Over Texas"`, the motif retired because one of the six is the Confederate
  flag, **zero hard fails**.

The same strings in `supers`, a key nothing renders and nothing writes, were **caught**. The gate
rejected the fabrication in a dead field and shipped it in the live one.

**A misconfigured gate and a clean film are the same exit code.** That is what makes this class
different from a gate that is merely wrong: there is no symptom anywhere. It prints its success
line, CI goes green, and nothing in the output distinguishes "checked and found nothing" from
"looked in a place that does not exist".

The root cause is one line of the self-test. The fixture built its own `scene()` dict carrying
`vo` and a `cast[].headgear`, and no `super` at all. **The gate was written against the fixture
rather than against the board**, and nothing ever compared the two. Every planted defect in the
self-test was planted in a field only the fixture had, so the tests passed honestly and proved
nothing about a real board.

Three things fix it, and the third is the one that generalises:

1. The field names live in one place, `SCENE_COPY` and `SCENE_DIRECTION`, not in three tuples.
2. `schema_bound()` refuses any name that is in neither the renderer's `Scene` interface nor any
   scene of the board under check. **A name that writes to nothing is a hard fail**, so the next
   phantom announces itself instead of passing.
3. The self-test asserts its own fixture is a subset of `examples/board.json`. A fixture nobody
   compares to a real artifact is a second schema, and a gate written against it checks a film
   that does not exist.

**Ask of every gate: what would this print if the thing it reads were missing entirely?** If the
answer is "the success line", the gate is not connected to anything.

## 28. Two functions, three documents, zero call sites

`headgearConflict()` and `seasonalHat()` in `Character.tsx` are careful, well documented, and
were called by **nothing**. Not by `Character`, not by `CastElement`, not by any gate.

Three places said otherwise. `prompts/dispatch_routine.md` said `headgearConflict()` "refuses
that pairing". It said `seasonalHat()` "takes the Dispatch date". `ship_gate.py` carried the
comment "`headgearConflict()` guards the engine; this guards the board." Every one of those
sentences described a function no code path reaches.

That is worse than an absent check, because the documentation is the thing a reader consults
before deciding whether a risk is covered, and here it said yes three times.

The board half had its own version of the same fault. `ship_gate` read `scene.cast[].headgear`,
an optional parallel declaration **no board in this repo writes**. What actually renders is
`planes[].items[kind=person].props.cast` resolved through the roster, so the rancher, who is
`straw-hat` in `CAST` and carries no `headgear` field anywhere, cleared the rig-floor check on
every scene of every board.

Fixed both ways. `ship_gate` resolves the hat from the placement through the roster, parsed out
of the engine and **fail-closed**: a roster it cannot parse raises rather than returning a short
table, because a gate that clears every scene against an empty roster is the same defect again.
`tests/cast_safety.mjs` calls `headgearConflict()` on all thirteen entries, so the rule is live,
and the roster is one keystroke from a felt hat on FR coveralls.

**A function is dead until something calls it, and a comment saying it guards something is not a
call site.** When a doc claims a protection, check the callers before believing it.

## 29. The habitat rule was connected to a review sheet, not to the film

`staging_check` refuses an animal standing somewhere it does not live. It works, its coverage
rule has found a real gap before, and its own docstring warns that "a region passed through a
variable" is beyond it.

That warning was the whole defect and nobody followed it through. The rule matches a literal
`region="high_plains"` in TSX. `Dispatch.tsx` renders `region={scene.region}`. Instrumented, the
placement rule evaluates **exactly five animal placements, all five inside `ProofScene.tsx`**, a
by-hand composition no run renders. **Zero in a Dispatch, ever.**

So the gate written to stop a pronghorn in the Piney Woods had never looked at a frame of a
film. Confirmed by planting into the real `examples/board.json`: a pronghorn in the Piney Woods,
and a javelina in the Rolling Plains which is the literal example in this file's own docstring,
both cleared Gate 0.

Entry 22's shape exactly: **the gate drifted onto a neighbouring artifact when staging moved
from hand-authored TSX to board JSON.** Nothing broke, because nothing was watching the move.

The fix is not a cleverer regex. The board is JSON, the scene names its own region and every
placement names its own kind, so on that artifact this is not a lint at all, it is a lookup.
`--board` does the lookup, and the run and CI both pass the storyboard.

**Its first run against the committed example board found four wrong placements**, in the file
this repo offers as its reference:

- two cattle egrets over irrigated cotton in Hale County, outside the range the map lists
- **two Longhorns at a feedyard bunk in Castro County**, which is wrong twice: wrong region for
  the breed, and wrong animal for the use, because commercial Panhandle feedyards run Angus
  crosses. `FeedlotPen` already draws its own cattle at the bunk, so the Longhorns were
  redundant as well as wrong. The board reached for the Longhorn because it is **the only
  bovine in the library**, which is a real gap worth closing: the iconic animal is the only one
  available, so it gets cast everywhere, which is exactly what the habitat map exists to stop.

The egrets were changed to grackles, which the map already places on the High Plains, rather
than widening `cattleEgret`'s range. **Widening the data to make a gate green is the ratchet
failure**, and a range fact typed from memory is the compute-not-generate law broken on a
different surface. Whether cattle egrets belong on the High Plains is a question for a source,
and it is left open here rather than answered by whoever needed the build to pass.

**When a gate's docstring names something it cannot see, that sentence is a bug report.** Read
it as a defect awaiting confirmation, not as a limitation already accepted.

## 30. A validator whose every check was unreachable

`foley.py` synthesises 31 sounds and `_valid()` checks five things: dtype, NaN, length, clipping
and silence. **Four of the five cannot fire on anything this file produces.** Every sound
function ends in `normalize(x, peak)`, which sets `max(abs(x))` to exactly `peak`, so the clip
test, the silence test, the length test and the dtype test are structurally unreachable. Only
the NaN test could ever go red.

Proved by breaking the product rather than by reading it. Replacing `_fft_filter` with the
identity kills every lowpass, highpass and bandpass in the library, turning `cicada_wall` and
`rattlesnake` alike into raw white noise. **Self-test: "all passed (31 sounds)", exit 0.** So did
every sound replaced by one impulse and six seconds of silence. So did a 0.5 Hz sine, which is
below hearing. So did noise at amplitude 1e-8, normalised up to 0.85 and reported CLEAN.

The self-test's own red-team block fed `_valid` three synthetic buffers it built itself. Those
are the only inputs on which those thresholds fire. **The gate was tested against inputs that
could not come from the thing it guards.**

And `build()`, which is the command the routine actually runs, never called `_valid` at all. It
returned a literal 0 after writing 31 files, while `write_wav` clipped to [-1, 1] on the way to
disk so a clipping buffer was silently hard-clipped and still reported success.

The lesson is not "add a check". It is that **amplitude is invisible after a normalize**, so an
amplitude gate on a normalised library measures the constant it just set. What can actually
break here is the FILTERING, so the check has to be spectral. Spectral flatness separates them
cleanly with no per-sound taste required: white noise measures 0.56, and the flattest real sound
in the library, the rattlesnake, measures 0.33.

Measuring finally also found the bugs that had been sitting in the DSP:

- **`brown()` put the peak of every buffer on its own wrap.** `np.cumsum` of white noise starts
  near zero and ends at a large random value, and `_fft_filter` is circular, so the step across
  the wrap was read as signal: a 6.4x spike on sample 2. `normalize` then divided the real sound
  down against the artifact. `thunder_near`'s roll ended up six times too quiet, and its
  docstring says "the rumble collapses behind it. The order matters, crack before roll, or it
  reads as far." It read as far, at a measured 9,110 Hz centroid for NEAR thunder against 312 Hz
  for far.
- **`pink()` cascaded its filters instead of summing independent ones**, so it was about 3.2 dB
  dark in the top two octaves and sloped at -6 dB per octave where pink is -3. Brown noise
  wearing pink's name, under the three beds that play beneath dialogue.
- **Three sounds high-passed white noise with no upper bound**, leaving it flat to the 24 kHz
  Nyquist. A cow's low measured 6,902 Hz. A shoulder-pad thud measured 9,276 Hz.
- **Five sounds put 60 to 74 percent of their energy below 20 Hz**, under the floor of hearing,
  and that is what `normalize` scaled against, so they were far quieter than their peak claimed.

Every one of those was inaudible to a peak measurement and every one changed what a sound IS.

The catalog assertion beside it was the same shape in miniature:
`[c["name"] for c in catalog()] == list(SOUNDS)`, where `catalog()` builds its list by iterating
`SOUNDS` and copying the key into `"name"`. It compared `list(SOUNDS)` to `list(SOUNDS)` and
could not fail on any input. It now compares the **committed** `assets/sfx/catalog.json`, which
carries each sound's measured centroid and flatness, so the tracked interface is a fingerprint
of the sound rather than of its name.

**Ask of any threshold: what value could the code produce that would trip it?** If the answer is
none, the check is decoration, however carefully it is written.

## 31. Seventeen tables of real dimensions, one of them checked

TRUE SCALE is this engine's founding law. One metre constant, a per-module `*_M` table of real
dimensions, and `fit(key, local)` mapping a component's local box onto its real size, so a
longhorn and a pickup on the same plane are right relative to each other.

**Seventeen modules export a `*_M` table. One was read by any gate.** `staging_check` enforces
the rule properly and only on `fauna.tsx`, because that is the module it was written for, and
`engine_lint` only asserts that `610 / 1.7` appears exactly once. Nobody widened it when
sixteen more tables arrived. The rule was never repealed, it was simply never extended, and
that is quieter than a repeal.

Behind the unchecked sixteen, measured off the rendered drawings:

- **A marching band 13 cm tall.** `HBCUBand` fitted on a SOUSAPHONE and then multiplied the
  result by `0.16`, which cancels the metre conversion it had just performed. The drum major
  stood ankle high on any cast member sharing the plane.
- **A 0.92 m tortilla.** `Comal` fitted on the paletero CART's entry, because its own
  `TEJANO_M.comal` recorded `0.02`, the height of a disc off the burner, which no top-down
  drawing can be scaled by. So the entry sat orphaned and the drawing borrowed a freezer box.
- **A 1.03 m raspa cup** on the same borrowed entry, scaling QUADRATICALLY, because every path
  coordinate is already a multiple of `h`, so halving `h` quartered the drawing.

Three things came out of fixing it, and the second is the one worth stealing.

**A multiplied `fit()` is almost always a bug.** `fit()` returns the complete scale. Multiplying
it cancels the conversion. Five of the nine in the library are legitimate (a `scale` prop, real
sexual dimorphism in grackles and whitetail, a fixed-local grass tuft, a ratio between two
instruments) and each is now exempted BY NAME WITH A REASON, never by a pattern. A stale
exemption that no longer matches anything fails, so a licence cannot outlive what it excused.

**A metre entry that nothing draws is the table being outvoted.** Twenty-six were orphaned. Two
belong to components sized to the FRAME rather than to the world, which is a real category: a
crop field filling to a vanishing point, and a convective cell that is genuinely 900 m tall and
would be 322,938 draw units in a 1080 wide frame. Those are marked `ref: true` in the data, next
to the dimension, where a reader sees it. The other twenty-four are sub-parts drawn as
fractions of a fitted parent, which is real debt, and it is RECORDED rather than hidden: a new
orphan fails, and an entry that is no longer an orphan ALSO fails, so paying one off forces its
line out of the file. **A debt list that can only shrink is a ratchet. One that only grows is a
drawer.**

**Reading the source cannot tell you the size.** `scale_check` catches the whole-component
failures and structurally cannot see whether what came out is right, because that depends on
path coordinates it does not evaluate. `tests/true_scale.mjs` renders each component and reads
the emitted scale back off the markup. Its self-test replays the band's pre-fix code and
requires the measurement to come out at 0.133 m, so the gate is provably able to go red instead
of only ever seeing corrected code.

The press box was the entry to read when this felt abstract, and it is now the one to read for
what paying a line off looks like. `TOWN_M.pressBox` said 3.2 m, the drawing said
`height={h * 0.30}` inside a parent fitted to a 7 m bleacher, and it rendered 2.10 m. **The
measurement was taken, written down, and then overruled by a fraction nobody checked.**

Converting it turned up the reason all twenty-four existed. **There was no tool for it.** A
component calls `fit` once, on its whole self, and everything inside is drawn in the parent's
local frame, so a sub-part cannot call `fit` again without scaling twice. With no idiom for the
ratio, a fraction is what anybody would reach for. `subber()` in `scale.ts` is that idiom now,
and it is a ratio of the two measurements rather than a constant, so it stays right when either
is revised. The press box measures 3.200 m.

Two things the fix itself taught, both about the harness rather than the drawing:

**The measurement read `NaN` and reported a failure for the wrong reason.** A component that
flips its facing emits `scale(sx sy)`, and the regex matched only `scale(n)`. A wrong number is
better than a missing one here, because `NaN` reads as "the drawing is broken" and would have
sent somebody hunting a drawing that was correct.

**Rendering a component outside an `<svg>` makes React warn about the casing of
`linearGradient`.** That is the harness being wrong about the context, not the drawing being
wrong, and a warning nobody can act on is one everybody learns to scroll past. The probe renders
inside an `<svg>` now, which is the only place these are ever used.


## 32. The debt list caught two of its own rows as false

Entry 31 left twenty-four sub-parts recorded as drawn by an eyeballed fraction. Working through
them, the list turned out to be wrong about three of its own rows, in two different ways, and
both are worth more than the conversions were.

**Two were never debt at all.** `flora.tsx` picks its orchard species at render:

    fit(crop === 'peach' ? 'peachTree' : 'citrusTree', 70)

`scale_check` matched only `fit('k'`, so it could see neither name, and both entries read as
measured and never drawn. **The checker's blind spot became two lines of recorded debt for
dimensions that were being used correctly the whole time.** A gate that reports a correct
drawing as a fault is the fastest way to get a gate switched off, and this one had written its
own false report down where it looked like a considered decision. The first argument is now read
whole and paren balanced, so a key selected at render counts. The strict rule survives for the
plain form: a literal naming nothing is still a typo and still fails.

**Seventeen were not "drawn by a fraction", they were NOT DRAWN.** Nothing in the library
references a church pew, a Leslie cabinet, a trail ride wagon or a drive-in order post. Those
are measurements somebody took for components that do not exist yet. Calling that debt in the
drawing is false: there is no drawing. The list is now two lists, `WRONG_SIZE` and
`NOT_DRAWN_YET`, counted separately, **because one number covering both would mean nothing.**
Two drawn at the wrong size is a fact somebody can act on this week. Nineteen of something
undifferentiated is a number people learn to ignore.

**And two of them are not being fixed today, on purpose.** The CT couch renders 1.06 m against
its declared 0.75 m, and lowering it moves the couch relative to the BORE it has to run into.
The freight cab roof renders 4.48 m against a 4.15 m rig, so the roof is above the whole rig
with the mast standing on it, and the fix is a redraw of a silhouette that was hand-shaped and
already corrected once for being a cab-over. Both are provably wrong and both need a rendered
frame in front of a person. **Changing a drawing you cannot look at, on the strength of
arithmetic, is how the cab-over got drawn in the first place.** They are recorded with the
measurement, the reason, and what it would take.

The rule this leaves: **a debt list is a claim, and claims get checked.** Ratchet the count so
it can only shrink, split it so the number means something, and expect the list itself to be
wrong about some of its own rows.

---

## 33. "It needs a rendered frame in front of a person" was true, and it was not a reason to wait

Entry 32 parked two defects because fixing them meant changing a drawing on the strength of
arithmetic, and it named the risk correctly. It then drew the wrong conclusion, because the
rendered frame was one command away the whole time:

    npx remotion still ClinicSheet out.png \
      --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell

About twenty seconds per sheet. Both drawings were obviously wrong the moment anyone looked, and
looking also turned up things no amount of reasoning about the source had found.

**The CT was two machines pretending to be one.** The bore was not merely high, it was 1.41 m
across, which is a linac drum face and double a CT bore. The couch had been raised to 1.06 m to
meet it, because a couch at its declared 0.75 m could not have reached that aperture at all. One
shell, one aperture and one couch height were serving a 1.98 m CT and a 2.4 m linac, and the
picture closed by bending the one dimension the table had already measured. **A shared component
whose two cases have genuinely different dimensions gets drawn to one of them, and the other case
then bends whatever is adjacent until the picture closes.**

**The truck's cab roof was the smallest of its problems.** The van trailer's floor was drawn
BELOW the fifth wheel plate it rests on, so the trailer passed through its own coupling, and its
roof sat 0.87 m below the cab. The tyres were 1.24 m where a 22.5 inch tyre is 1.04 m, and at
that radius the drive duals overlapped each other. The roof pod rendered 0.92 m because it was
scaled by `0.42 / (K * scale)`, an expression that cancels the STAGING scale as well as the
parent's fit, so the same truck got a pod six times bigger at one staging than another. **No
single measurement could have caught that one**, which is why the check for it is a ratio of the
pod's size at two stagings and not a size.

The general rule that expression is now written to: **to place a true-scale child inside a
true-scale parent, pass `scale={1 / K}`.** Cancel the parent's fit and nothing else. Divide by
`K * scale` and the child stops riding the vehicle it belongs to.

**And the reason all of this survived review.** The row where the rig is signed off drew the
human reference at `scale={0.28}` against a rig at `scale={0.16}`, so the engineer stood 1.75
times life size and the truck read a third smaller than it is. Ten rows across the review sheets
do this. The sheets exist to be looked at, and the ruler in them was wrong. **A human reference
staged at a different scale from its subject is worse than no reference, because a reviewer
trusts it.** The Ref now carries the subject's own staging scale. The same row also cropped 161 px
of its subject off the canvas, and a row that cannot show its subject cannot review it.

The rule this leaves: **if a defect is parked because it needs eyes, go and use your eyes.**
`WRONG_SIZE` is for a drawing somebody has looked at and cannot yet fix. It is never for one
nobody has looked at, and "somebody has to see this" describes a twenty second command, not a
blocker.

---

## 34. The ruler in the picture was wrong, in eleven rows out of fourteen

Entry 33 found the review sheets drawing the human reference at a different staging scale from
the thing it measures, and fixed the two rows needed to verify that entry's own work. Going
back for the rest, the count was not eight. **It was eleven of the fourteen rows that carry a
reference at all**, because three had a bare `<Ref>` taking the helper's 0.32 default, which a
scan for mismatched numbers cannot see. A default nobody chose is not agreement, it is silence.

Three kinds, and only the first is the obvious one.

**A number typed once and never compared.** A centre pivot at 0.1 with a person at the default
0.32. A rack row at 0.17 with a person at 0.3. Each is a single wrong character, and each makes
every component in the row unreviewable.

**A row that stages its own subjects at two scales.** The machine room drew a 2.38 m switchgear
line-up and a 1.93 m CDU the same height, with a 1.7 m engineer taller than both. Every one of
those three is correct in its own metre table. **That is what makes a mixed staging scale a lie
rather than a simplification**: nothing is wrong except the picture.

**A scale hidden one level down.** `RobotPair` staged its arms at 0.4 inside a helper while the
row staged the person at 0.3. No checker could see the pair, because the number was not in the
row. The fix is not a smarter checker. **A row states its own scale**, so the helper takes it as
a prop.

Two rows genuinely cannot hold one scale and are exempt with the arithmetic, not with taste: a
0.15 m handset beside a 9 m siren mast is five pixels, and a 40 m grain elevator at the soil
probe's staging is five thousand. In both the ruler goes to the object a viewer cannot size from
memory, it stands next to that object rather than between the two, and **the label on the sheet
says so**, because a reviewer reads the sheet and not the source comment.

### What the corrected ruler immediately found

`Compute.RackRow` rendered **8.51 m against a declared 2.6 m**, nearly four times a rack. It
nested a fitted `Cabinet` with `scale={(d * 0.62) / (K * scale)}`, the roof pod's mistake in a
second module, written by a different route, three commits apart. At staging 1 the form looks
plausible, which is why two authors wrote it and no render caught it.

**The rule, and it is now a gate rather than a paragraph.** To place a true-scale child inside a
true-scale parent, pass `scale={x / K}`. Cancel your own fit and nothing else, so the staging
scale still reaches the child and the child rides the parent. `scale_check` refuses
`/ (K * scale)` in any module, and its self-test replays both shipped forms.

The through-line of 33 and 34 together: **a gate that measures a component cannot tell you the
component is being compared against something wrong.** `true_scale` would have caught the cab
roof and the rack row at any time in the last three weeks. Nobody ran it on them, because the
picture looked right, and the picture looked right because the ruler in it was wrong.

---

## 35. Nothing in this repo had ever read a character

`HandsetAlert` drew "FLASH FLOOD WARNING" as one line at font size 9, inside a panel 70 units
wide. The string is about 111 units. On the one beat this show has about an emergency message,
the message ran off the glass, and the body line went with it.

It passed everything. `tsc` sees a string. `engine_lint` reads colour literals. `scale_check`
and `true_scale` measure drawings and treat a text node as opaque. Twenty-nine `<text>` elements
in the library and **not one gate had ever looked at what was in one.**

**Shortening the string would have fixed the string.** `headline` and `body` are props, so the
next caller writes a longer warning and the panel overflows again with no warning of its own. A
drawing that accepts text has to be able to set that text, so the banner now wraps at the
panel's real inside width and the panel grows to hold the lines. The lock screen furniture below
it follows the banner down instead of being drawn at a fixed y through it.

**The widths were measured, not guessed and not read out of a font table.** A probe rendered
real strings through the real renderer and the ink was measured off the PNG. Those measurements
are the gate's fixtures, and the per-class estimate has to sit above every one of them:

    FLASH FLOOD WARNING   369 px    0.647 em/char   bold
    MMMMMMMMMM            282 px    0.940 em/char   bold
    Move to higher ...    340 px    0.436 em/char   regular

**An optimistic estimator makes every check downstream worthless while still reporting green**,
which is why that half of the self-test runs first and is the load-bearing half.

### The bound was wrong the first time, and the plant found it

The first version of the check asked whether the banner was inside the glass. A planted body of
one long sentence produced a **thirteen line banner ending at 61.5**, inside the glass and
swamping the phone, and the check passed it. The real bound is not the glass, it is the home
indicator: the lock screen furniture has to still have somewhere to be. Both numbers now come
out of the component, so the gate cannot pass while the picture collides. **Planting a defect is
how you find out your bound is the wrong bound**, and the first plant passing is the useful
result, not the failure.

### And the thing underneath all of it

Every drawing in this engine asks for `Georgia, serif`, and **the repo ships no font at all.**
`fc-match Georgia` on the render box returns DejaVu Serif. Sixty-two text sites, plus thirteen
more asking for JetBrains Mono, render in whatever the machine happened to have, so the film's
type is not the same film on two machines and every width in it is a width nobody chose. The
measurements above were taken from that substitute.

Wrapping is what makes this survivable rather than fatal: **a wrong width estimate moves a line
break, where the hand-set font size it replaced moved text off the edge.** Choosing the
typeface, and shipping it, is a design decision and it is still open.

---

## 36. A width table belongs to a face, and the face has to be one you ship

Entry 35 ended by naming the thing underneath it: 74 text sites asked for `Georgia, serif` and
the repo shipped no font. Georgia is a Microsoft face, so `fc-match Georgia` on a Linux render
box returns DejaVu Serif and **the film was not the same film on two machines.** The engine now
sets in the site's three faces, Fraunces, Manrope and JetBrains Mono, shipped in
`video-engine/public/fonts` under the OFL that permits it.

**The bit that would have gone wrong quietly.** `lib/type.ts` estimates how wide a string is,
and those numbers had been measured off DejaVu Serif. Manrope's lowercase is wider: a run of n's
is 0.62 em against DejaVu's 0.497, so the moment the typeface changed the old `lower: 0.52` sat
**under** the truth. Nothing would have reported it. Every gate would have stayed green while the
one check that reads characters quietly started under-counting, which is the exact failure the
entry above says makes everything downstream worthless.

So the widths were measured again, in both faces at both weights, and the fixtures are now the
widest of the four per string. **A width table is not a constant, it is a measurement of a
specific face, and it expires when the face changes.**

The two pathological runs are now asserted to be the ONLY strings the estimate goes under on. A
caveat that is only written in a comment drifts; one the self-test pins cannot.

### Three smaller things worth keeping

**One stack, not seventy-four.** The same argument the metre constant won. A stack restated at 74
sites was wrong at all 74 at once, and `font_check.py` now refuses a `fontFamily` literal
anywhere but `lib/type.ts`.

**Declared is not shipped.** The check that matters most is the dullest: every face
`lib/fonts.tsx` declares must be a file on disk. A face declared and not shipped is the original
defect with extra steps.

**Loaded is not declared either.** Remotion captures a frame the moment React settles, so a font
still arriving is a frame in the fallback, and it looks like every other frame. `withFonts` holds
the capture with `delayRender`, and `composition_check.py` refuses a composition registered
without it, because twenty-three registrations is twenty-three chances to forget and the one that
forgot would look correct until somebody measured a glyph.

### And the reason a review sheet earns its keep

The migration was checked by rendering all sixteen compositions and comparing edge bleed against
the pre-change renders, byte for byte at the margins. Identical. **That is a cheap, total answer
to "did changing the typeface break a layout"**, and it exists only because the sheets exist.

## Round twelve: three faults, one shape, and none of them a gate's fault

Nothing in this entry was caught by a check. Every one of them was found by looking at a
frame, and the reason is the same in all three: **a gate reads a file, and a viewer reads a
silhouette.** No assertion in this repo has ever been able to look at a shape and say what
object it is. That is not a gap to close with a cleverer gate. It is the argument for
rendering a still and reading it before believing anything.

### The stand was seeded per scene, so one place was four places

`Vegetation` took the scene's seed. Four Round Rock shots therefore grew four different
stands of live oak at four different scales, and four Abilene shots four different brakes of
mesquite. Every gate passed, because every frame was internally correct. A scorer read it as
four locations and said so on the place axis, and was right.

**Standing woody plants are landmarks and belong to the REGION, not the shot.** Grass may keep
the scene seed, because nobody tracks a tuft across a cut. The general rule: ask of any
randomised element whether a viewer is supposed to recognise it from the shot before. If yes,
it cannot be seeded on the shot.

### A drawing can be correct in code and wrong on screen, and this is the fourth time

`LimbedOak` computed five limbs, placed a lobe on each limb tip, and read as a green blob. The
lobes were `w*0.20` to `w*0.30` hung on tips about `w*0.15` apart, so each one overlapped both
neighbours and the crown closed. **A lobe has to be smaller than the gap it hangs over or there
is no gap.** Separating them then produced five ringed circles on five bare ribs, which reads
as broccoli, because each lobe carried its own ink outline and a viewer counts outlines. The
crown is one silhouette made of lobes, which is not the same object as many outlined lobes:
draw them twice, fat in ink underneath and in leaf colour on top, and the union has one edge.

Four instances of this shape now, and they are worth listing together because the list is the
lesson. A caption file honestly aligned that never reached the picture. A credits colon fixed
in a file the renderer does not read. A board edited after its own render. And a `Canopy`
centre ellipse that painted over the limb geometry both tree components had just computed.

### When something reads as the wrong object, change the geometry

The dead pole sign took three passes and stayed a basketball goal. The starburst came off. The
open frame was filled. The reader board was filled. Each fix was correct about the part it
touched and none of them moved the shape: a narrower box centred on the pole, floating in the
gap under a wider board, is a hoop under a backboard whatever colour it is painted. It only
stopped being one when the reader board moved flush against the cabinet's bottom rail at the
cabinet's full width, which is also where a real one is.

**Recolouring the parts leaves the drawing that made the wrong shape exactly where it was.**
The same fault in a second file the same day: the bucket truck's compartment doors were
`fill="none"` over a near-white body, so they took the body's colour and became four white
crates on a flatbed. An unfilled shape is made of whatever is behind it, and what is behind it
is never what the shape is supposed to be made of.

### A scale that is random is a scale that is wrong

The rolling-plains mesquites drew `scale` from the seed with no reference to how far down the
frame they stood. A tree nearer the camera was as likely to be drawn small as large, so the
picture was telling the eye two different distances for one tree. That is a scale error in the
strict sense `lib/scale.ts` exists to prevent, and the metre file cannot catch it, because
every individual tree was a legal size. **Size comes from depth. The seed varies it a little
around that and never sets it.**

The same block was also drawing crowns over twice as wide as the lane they were stratified
into, which is why stratifying x had not stopped them merging into a hedge. A spacing rule is
worth nothing until the thing being spaced is measured against it, and the ceiling should be
solved against the spacing rather than chosen and hoped for.

## The wait that watched itself, and why the waiter was retired

A step that takes ninety seconds held a run for forty minutes, and nothing anywhere
reported a problem, because the failure and the success look identical from outside.

The script wanted to wait out a render and wrote the obvious thing:

```
while pgrep -f "remotion render Dispatch" >/dev/null; do sleep 15; done
```

`pgrep -f` matches the FULL COMMAND LINE of every process on the box, and the waiting
shell's own command line contains the pattern, because it is right there in the `while`
condition. The loop matched itself. The condition was true forever and could not become
false no matter what the render did.

**The same mistake was then made a second time, at the top level, within the hour**, by a
wait written as `while pgrep -f finish_render.sh; do sleep 10; done`. That is the tell
that it is not a typo. It is the obvious thing to write, it is wrong, and it is invisible:
a self-matching wait and a genuinely slow job produce identical evidence, which is no
evidence at all.

The first repair was `scripts/waitfor.sh`, and getting it right took three tries that its own
self-test caught one after another. The helper has since been retired: full renders now run
synchronously through `scripts/render_dispatch.sh`, which is simpler evidence than discovering a
process after launch. Each failed waiter is still worth keeping here, because each was a plausible
answer that did not work:

1. **Excluding `$$` is not enough.** The subshell that runs `pgrep` is a child and carries
   the pattern too.
2. **Excluding the process GROUP is not enough either.** The harness wrapper that launched
   the script is an ANCESTOR in a different group, and its command line contains the whole
   command string. The unit that has to be excluded is the ancestor chain, walked with
   `ps -o ppid=`.
3. **A pid you cannot inspect is not evidence the job is running.** The `$(...)` subshells
   the loop spawns to read `ps` carry the pattern and then exit, so `pgrep` returns pids
   that are already gone. Counting that empty answer as a live match kept the loop spinning
   even after the exclusion was correct, which is the original bug wearing a third hat: the
   waiter seeing its own machinery and calling it the job.

Two rules fall out, and the current render wrapper enforces the stronger form.

**Prefer a synchronous command. If background work is genuinely required, retain its PID rather
than rediscovering it by pattern.** A pid cannot match itself and needs no exclusion reasoning.

**Every wait carries a deadline.** A wait that cannot time out can hang the run, and the
bounded terminal contract says a blocked run becomes `needs_review`, which it cannot do from
inside an infinite loop. Note that in the failing self-test runs above, the deadline is the only
reason anything was ever reported at all. The guard that saved the diagnosis was the
belt, not the braces.

---

## The right number over the wrong picture

**What shipped, four rounds running, with every numeral gate green.**

Scene s11 printed the super "about ninety nanoseconds a day" over a shot whose readout, caption
and character are all one researcher's three year EPW port. Ninety is a real number. It was
fetched, it was verified enough to be in the claims file, and it was in the authorised set that
`ship_gate` and `numeral_lint` check against. It belongs to NAMD, a different code by a
different group. The claim it comes from is PARTIAL, and that claim's own note reads "The subject
matter of the simulation is NOT verified and is not stated." The frame stated it.

Scene s09 printed "the number comes from an analyst" over the caption carrying Abilene's fifty
thousand accelerators. That figure's claim says in its own note that it "is attributed to the
operator". The analyst framing belonged to a different claim about a different quantity, two
paragraphs away in the same source.

**Why every gate was green, and why it always would have been.**

A numeral gate answers "is this figure a member of the authorised set". That is a property of the
figure. Both defects are properties of the PAIRING: the figure and the picture it sits on. A
set-membership test is structurally incapable of seeing the difference, so no amount of
tightening it would ever have caught this. The check that was missing was not a stricter version
of a check that existed. It was a check of a different kind.

This is the general shape and it is worth naming, because this repo keeps meeting it: **a gate
that validates a component in isolation cannot see a fault that lives in the relationship between
two components.** The oak that was the right shape and a quarter the height of the transformer
beside it was the same shape. So was the arm outline that was correct and drawn at
`opacity={0.001}`.

**What to check instead.** `scripts/super_evidence_check.py`. A super is checked against its own
`super_claim` and nothing else: the claim must exist, must be VERIFIED rather than PARTIAL, and
must itself carry every figure and every proper noun the super states. Not the claims file. That
claim.

**And its own first version proved the second lesson in this file.** It emitted partial number
runs on the theory that more candidate values meant more chances to match a differently spelled
source, reading 4 out of "four hundred", 40 out of "forty eight", and 1 out of the "one" in "both
rooms, one scale". Since the check demands every figure it is handed be evidenced, each partial
became a demand no source could meet, and the gate went red on four supers that were correct.
**A gate that fails correct work is a gate somebody turns off**, and the only repair it would
have accepted was rewriting good copy to satisfy a parser. Each of those four is a self-test case
now.

**How it was proven, and this is the only proof that counts.** Not by reading it. It was run
against the board that had actually shipped the defect, where it goes red and names s11, and then
against the corrected board, where it goes green. A gate that has never been shown the fault it
was written for is a gate nobody has tested.

---

## True scale is not a free win, and the check still is what said so

The board was authoring every exterior object at a fraction of true scale, using `scale` as a
distance dial when `z` is the distance dial. `board_scale_check.py` measures it: a 0.40 m pickup,
a 0.36 m pad transformer, a 1.56 m building, a 0.75 m bucket truck standing beside a 2.12 m
lineworker. Three judges filed three separate craft defects in one round and every one was that
arithmetic.

The obvious repair is to set `scale: 1.0` everywhere and solve `z` to hold the same apparent
size, which preserves the framing exactly for anything shot on its own. **Half of that repair is
wrong, and one check still cost forty seconds and proved it.**

At true scale the bucket truck at z=420 renders 938px tall and **2065px wide in a 1080px frame**.
It swallowed the shot: the truck body became abstract slabs across the midground, the bucket a
white box floating at head height, and the data centre the scene is about vanished behind it. The
result was far worse than the toy it replaced.

**WIDTH IS THE BINDING CONSTRAINT AND HEIGHT IS THE ONE EVERY DIMENSION TABLE RECORDS.** Every
`*_M` entry is a height, `fit()` solves on height, and every size argument in this file until now
was made in heights. A bucket truck is roughly 2.2 times wider than tall and a strip building is
3.5 times wider than tall, so the moment either is honest about its height in a 9:16 frame, its
width leaves the picture. The board's miniature scales were not only an error. They were also
compensating for a camera that sits closer than any vehicle or building can be shot from.

So the fix is a re-stage, not a multiplier: the object goes to true scale AND much further out,
where it is small because it is FAR rather than small because it is a toy. For that truck the
arithmetic is z near 4000, giving 318px tall and 700px wide, against a 587px person at z=55.

Two rules fall out.

**A size prescription that names only a height is half a prescription.** Ask what the object's
width does at that size before applying it.

**Gate 0 is cheaper than a render and it caught the rest.** The same restructure put seven planes
in one scene and two planes at the same z in another, and `storyboard_check` refused both before
a frame was drawn. The one thing it could not tell me was what the frame would look like, which
is exactly and only what a check still is for.

---

## groundY is coupled to every fixed-y item in the scene, and it has now hidden the building twice

A scorer prescribes it in almost every round, because dead sky is the easiest defect to see and
raising the horizon is the obvious cure. It has been applied twice and it has failed twice, the
same way both times.

`groundY` moves the horizon. It does NOT move the items, whose `y` baselines are authored
absolutely. Raise it and the near plane's ground fill rises with it, over the top of everything
staged on the planes behind. On round 21 it orphaned the mansard box and turned dead sky into
dead ground. On round 24, with `groundY` at 880 instead of 1060, **the building disappeared from
the closing shot entirely** and the frame became a transformer and a pole sign in an empty
field. Nothing errored. Every gate stayed green. The film simply no longer contained its subject.

**The cure for dead sky is never the horizon on its own.** In this shot it was the building's
authored WIDTH: a 3.47:1 block spans a 9:16 frame end to end, so it read as an awning rather
than a building, and cutting `props.w` from 520 to 240 gave it two end walls, a visible
storefront and a legible small-in-its-yard read at the same horizon and the same scale. The sky
above it stayed exactly as tall and stopped mattering, because the frame finally had a subject.

If the horizon genuinely must move, every item standing on that ground moves with it in the same
edit, and the pair is verified with a check still before it reaches a render.

**Why there is no gate here, stated rather than skipped.** The failure is an occlusion between a
near plane's ground fill and items on farther planes, so seeing it requires resolving what is
drawn over what, which is the renderer's job and not a board property. A height-versus-horizon
heuristic was drafted and thrown away because near-plane items legitimately sit far below the
horizon line, so it would have failed correct scenes, and this file already records what that
costs. The honest artifact is this entry plus the rule that a `groundY` change is verified with a
still. A gate that cannot be written correctly is worth less than a lesson that is.

---

## The number was in the statement, not in the quote, and it wore a VERIFIED badge

`claims.json` gives every claim a `statement`, a `value_text`, a `quote` and a `verdict`. Three
of those are written by the model that read the source. **One is the source.** Nothing enforced
the difference, so a figure asserted in a `statement` was indistinguishable, to every gate in
this repo, from a figure somebody actually fetched.

The film printed a readout row reading `on Vista | 30 times faster`. The claim behind it is
marked VERIFIED, and its quote is entirely about three years of porting a code from CPUs to
GPUs. **It contains no speed-up figure of any kind.** A judge found it, called it the single
thing most likely to embarrass this show, and was right: an unsourced number that looks
unsourced gets questioned, and an unsourced number wearing a verification badge does not.

Measured across the whole board, **five of eleven figures printed by readouts appeared in no
fetched sentence anywhere in the claims file.**

**Why every existing gate was green, again.** `numeral_lint` and `ship_gate` check a numeral
against `authorised_numerals`, a set computed from the claims file. `30` is in that set. The
check is set membership, and the fault is one layer down, in whether the claim's own evidence
carries what the claim asserts. And `super_evidence_check`, written for exactly this family of
fault, only ever read SUPERS. **A readout carries no claim binding at all**, and a readout is
where the numbers actually live: the queue table, the speed-ups, the water.

**What to check instead.** `super_evidence_check` now reads readout rows too, against
`evidence_text()` rather than the whole claim, and `evidence_text()` is the `quote` and nothing
else. The one legitimate exception is a table, where a source publishes rows and the quote
captures one of them, and it is DECLARED per claim as `quote_is_excerpt` with `excerpt_of`
naming what it excerpts, rather than inferred by the checker. An exception somebody wrote on
purpose can be audited; a hole the checker leaves open for everything cannot.

**And the repair was not the same in both places, which is the part worth remembering.** The
queue table was real: a re-fetch returned all four rows verbatim, so the quote was widened and
the film keeps its best readout. The Vista figure was not there to find. Its source is serving a
500 today with no archived copy, so it could not even be re-checked, and the row came off the
screen. **A gate that had only ever said "drop it" would have cost the queue table too. Re-fetch
first, then drop what is genuinely not there.**

The wider finding, recorded because it will outlive this run: five of twenty claims in this film
cite one press release that is currently unreachable. Their quotes were captured at fetch time
and remain the evidence, but nothing in this repo records that a source has since gone dark, and
a run that needed to re-verify one of them today could not.

---

## The take was better on every graded axis and worse on screen

`vo_soundcheck` grades a take on word accuracy, spoken-tag leakage, pitch variance, duration
against the cut, and loudness. Five real measurements, every one of them earned by a defect that
shipped. **None of them can see how well a take CAPTIONS**, and captions are half of what a
viewer reads.

The mechanism, and it is not obvious until it bites: a caption boundary may only sit on a
measured silence, because approximated timings are a hard fail. So **the number of pauses in a
read decides how many boundaries the segmenter has to choose from.** A take with few pauses
forces long cards that break mid sentence, and no amount of work on the segmenter can fix it,
because the boundaries genuinely are not there.

Measured on 2026-08-19, re-synthesising one line to correct an unsourced phrase:

| | old take | new take, chosen on the old metrics |
|---|---|---|
| word accuracy | 0.974 | 0.974 |
| loudness after mix | -18.91 LUFS | **-17.88 LUFS**, a dB better |
| line 1 sourcing | unsourced | **corrected** |
| pauses in the read | **29** | 23 |
| word times measured | 56 of 114 | 43 of 117 |
| cues ending mid sentence | 3 of 8 | **5 of 6** |
| longest caption card | 9.9 s, 124 chars | **11.0 s, 141 chars** |

Better on truth, better on loudness, tied on accuracy, and visibly worse in the frame. Three
judges had already docked craft and voice for mid-sentence cards, so this would have traded a
truth fix for a regression in the axis those same judges were complaining about, and every
metric in the soundcheck would have stayed green while it happened.

**What to check instead.** `vo_synth_gemini` now records `speech_runs` per take, counted by
importing `vo_align.speech_runs` rather than reimplementing the silence threshold, and
`vo_soundcheck` carries it as a RANKING term. Deliberately not a hard fail: a read with few
pauses is a legitimate performance, it is just expensive to caption, and refusing it outright
would be a gate overruling a director on a formatting cost.

**The general lesson, which is the one worth carrying.** Every metric here was added because
something shipped wrong, so the metric set is a list of past failures rather than a description
of what "good" means. That is the right way to build it and it has a permanent blind spot: the
next defect is by construction the one nothing measures. When a change comes back green on every
axis and worse in the product, do not re-read the metrics. **Ask what the product has that the
metrics do not.**

---

## The film was right. The place it was drawn in belonged to somebody else.

**2026-08-19. Eleven gates green, and a subtitle nobody could read.**

The Docket's video feed went live as a vertical, one-film-per-screen feed, which lays its own
title, caption and button rail over the picture. The first Dispatch went into it with its
subtitle band at `y=1752`, 168 px off the bottom of a 1920 frame. The feed's overlay claims the
bottom quarter. The two drew on top of each other, and each was perfectly legible alone.

**Every gate was green and every one of them was right.** `ship_gate` proved the cue text came
from the claims. `board_captions` proved the timings were measured against the final mix.
`capFit` proved the line fitted its band. `flow_check` proved the rhythm. Nothing was wrong with
the subtitle, the band, the frame or the film.

**What none of them could know is that a quarter of the frame belongs to somebody else**, because
nothing in this repo had ever written down that such a place exists.

**This is one step further out than the usual entry here, and that is the point.** The catalogue
above is full of faults with correct components and a wrong relationship, and every one of those
relationships was between two things inside this repo: a plane's z and another plane's z, a
figure and the claim under it, a table's height and a board's scale. This one is between the film
and the SURFACE THAT PLAYS IT, which lives in a different repo and was never consulted, because
nobody thought of it as a party to the composition at all.

**What to check instead.** `video-engine/src/lib/safearea.ts` writes the reserve down, MEASURED
off the live feed in a browser at the phone viewport that gives the worst case, with the snippet
for re-measuring it. `SubtitleTrack` solves its position and its width against those constants,
and `CAP_W` wraps to the safe width rather than the frame width, which is the half that would
have failed quietly: a band correctly placed and then filled with lines measured against the
whole frame puts its own text off its own plate. `safe_area_check` runs in Phase 6 and in
`deliver_run.sh`.

**The rule that gate actually enforces is the one worth copying.** It refuses a TYPED number in
that geometry EVEN WHEN THE TYPED NUMBER IS LEGAL. A band that happens to sit somewhere legal
today does not move when the feed's CSS changes and the constants are re-measured, so it would
go wrong silently exactly once, on a day nobody was looking at that file. Its self-test asserts
that a legal literal still fails, which is the assertion the rest of this catalogue would have
wanted a dozen times.

**The general lesson.** Ask what else is drawing on the frame. A composition is not finished at
the edge of the picture when the picture is delivered inside something. The entry above says
"ask what the product has that the metrics do not". This one says: **ask what the product is
DELIVERED INTO, and whether anything in this repo has written that down.**
