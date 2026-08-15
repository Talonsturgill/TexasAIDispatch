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

The press box is the entry to read when this feels abstract. `TOWN_M.pressBox` says 3.2 m. The
drawing says `height={h * 0.30}`, which measures 2.10 m. **The measurement was taken, written
down, and then overruled by a fraction nobody checked**, and it is still like that today, in the
recorded list, waiting for somebody to convert it.
