# WORKLOG — the Texas AI Dispatch, from an empty repo to a shipped video

Written before any code, per the rule that has kept this work resumable across every compaction
so far. **Read this first. Resume from the wave table. Update it after every commit.**

## The directive

> "time to move on to the next big phase, the video automation via the texasaidispatch repo, so
> for this one u must know its gonna take hours, so just don't short us, it needs to be just as
> great if not better than the Alaska videos, you have a huge headstart and reference by having
> the alaskaaiweeekly repo to be able to check out whenever you want, spend a ton of time on
> making it feel like Texas local, making out characters cowboys and whatever the heck else
> screams Texas, massive task, go slow, be great!"

Plus, mid-turn: **"I will be Gemini tts for voice system."**

## The measured starting point (2026-08-12)

`TexasAIDispatch` is an **empty repo**. Zero refs, zero commits. Everything below is new.

The source machine, `alaska-ai-weekly`, measured rather than estimated:

| | count |
|---|---|
| Python | 28,951 lines / 120 files |
| TypeScript + TSX | 30,861 lines / 66 files |
| routine prompt | 1,765 lines |
| craft doctrine | 7,681 lines / 17 docs |
| agents | 9 |
| `video-engine/src/lib` | 29 modules |
| scripts carrying NO Alaska name | **37 of 61** |
| lib modules carrying NO Alaska name | **15 of 29** |

Largest lib modules: `fauna` 2062, `Character` 1255, `kit` 1098, `biomes` 985, `lighting` 786,
`civics` 673, `bench` 670.

## What is LIVE and what is RETIRED, verified in the source

This is the first thing to get right, because porting retired doctrine would poison the whole
build. `dispatch_routine.md` line ~530 names the dead list explicitly.

- **LIVE:** the Remotion 2.5D engine. `video-engine/`, Remotion + React 19 + hand-authored SVG,
  depth via `lib/stage3d.tsx` (one shared virtual camera, real browser 3D projection). Doctrine
  in `docs/craft/STAGE3D.md`. Exemplars `Nenana3D.tsx` and `IGSHook.tsx`.
- **RETIRED, never for new work:** `dimensional.py`, `DIMENSIONAL_CRAFT.md`, `render_v3.py`,
  `chrome_tundra.py`, and the whole per-frame PIL/Taichi raymarcher. The `.claude/skills/
  alaska-dispatch/` skill (44 files) is history only. **Do not port any of it.**
- **VOICE, decided by the owner this session: Gemini TTS.** `gemini-3.1-flash-tts-preview`
  primary with `gemini-2.5-pro-preview-tts` as the failover, whole-passage synth, best-of-N,
  gated by a soundcheck (word accuracy, no spoken-tag leak, pitch variance, duration, loudness).
  The chatterbox voice-clone path does NOT port. Texas needs its own auditioned voice and a
  `GEMINI_API_KEY`.

## The headstart nobody has to rebuild

`TexasAIDocket` already carries **24 Texas knowledge docs**, including `TEXAS_VERNACULAR`,
`TEXAS_PRONUNCIATION` (which the narrator needs), `TEXAS_CITIES`, `TEXAS_HISTORY`,
`TEXAS_LANGUAGE`, `TEXAS_ATTITUDES`. The visual system, brand tokens, fonts and geodata are
built and shipped there.

**That repo is REFERENCE for this one.** This repo writes exactly one file into it,
`docs/videos/videos.json`, via the publish step, and nothing else, ever.

## The one law this build is most likely to break

`TEXAS_VERNACULAR.md` names it, and it is worth quoting because it cuts directly against the
easy reading of the directive:

> **Default character equals white man in a hat.** Vector libraries get built in the order they
> are needed, and the first character authored becomes the default reach forever. **Build the
> cast demographically FIRST, before any episode needs it**, so the easy reach is not the wrong
> reach.

So: cowboys yes, and the doc's own base set opens with a rancher in a straw hat and pearl snaps.
Cowboys ONLY, no. The cast gets built in Wave V3 as a whole cast, in one pass, before any episode
needs a character. A hat is real on a rancher at a sale barn and a costume on a Houston software
executive, and the library has to know the difference.

Second law, same doc: **"A Texan forgives a stylized drawing. A Texan does not forgive being told
they live somewhere they don't."** Style is free. Place is not. The Panhandle and Houston do not
share a green.

## Waves

| # | Wave | Status |
|---|---|---|
| V0 | Foundation: CLAUDE.md, guards, port manifest, this file | **DONE** |
| V1 | The Texas research the vernacular doc owes us | **DONE** — REGIONS, CAST, FAUNA_AND_FLORA, KIT, CULTURE |
| V2 | Engine port: stage3d verbatim, lighting REBUILT regional, voice/motion/materials ported | **DONE** |
| V3 | **The Texas cast.** Character rig, outfits, headgear, built demographically first | **DONE** — 10 authored in one commit, rendered and looked at |
| V4 | Texas biomes: the regions, each with its own light and green | **DONE** — 10 regions, rendered and compared |
| V5 | Texas fauna: the species, drawn correctly | **DONE** — 15 species at TRUE SCALE against the Character rig, rendered and looked at five times; `staging_check` written |
| V6 | Texas kit: pumpjack, data centre, transformer, lattice tower, turbine, windmill, stock tank, cattle guard, water tower, mesquite, prickly pear | **DONE** |
| V7 | The scripts | **DONE** — all ten the routine calls, each with a `--self-test` replaying the defect it exists for, all wired into CI and the routine: `engine_lint`, `bar_check`, `staging_check`, `storyboard_check`, `flow_check`, `vo_synth_gemini`, `vo_soundcheck`, `vo_align`, `mix`, `ship_gate` |
| V8 | The routine prompt, the agents, the rubric | **DONE** — `dispatch_routine.md`, 5 agents, `dispatch_rubric.yaml` |
| V9 | Proof: the engine renders end to end | **DONE** — a 5s clip, 150 frames, three composed camera moves |
| V10 | Vehicles: the fleet, at true scale | **DONE** — pickup, stock trailer, transformer haul, tanker, bucket truck, slab. Rendered and looked at four times |
| V11 | **The application layer.** The show is about AI IN USE, not about policy | **DONE** — `APPLICATIONS.md` written against sources, Phase 1 beats rebuilt application-first, the two context beats capped at one each |
| V12 | **The variety engine.** No two Dispatches the same film | **DONE** — `composition_axes.yaml` (9 axes, Texas vocab), `dedupe.py` (topic + fingerprint memory), cross-run divergence and beat-mix rules in `storyboard_check` |
| V13 | **Sensing.** How you draw a machine LOOKING at something | **DONE** — detections that jitter, a ragged mask, a sweep, the invisible plume, a readout, and `wrong` as a first-class prop so the counter-image cannot be omitted |
| V15 | Wiring: nothing on disk unreachable, nothing named missing | **DONE** — found `scorer` orphaned, fixed it, and gated it |
| V14 | Civics: the Capitol, the courthouse, the hearing room | **DONE** — the dome PINK, the tower centred, the dais taking a seat count |

## Wave N — the nostalgia expansion (2026-08-14, current)

### The directive

> "okay now lets pivot to the artifact library for the video generating automation, spend a
> session making those 10x better, and also increasing the amount of artifacts by 10x. this
> aspect we want to feel super local so launch a research team to really help you get into the
> mind of texans, and also to see visually what they saw growing up, and then fram our atficats
> and scenes to that, I'm talking big time nostalgia for it all, this is a massive and hours-long
> task so take your time, this is the stuff that the video engine should be able to access and
> use and the stuff that Texans should love to see and recognize and connect with, be Great!
> WOW the hell out of them"

Plus, immediately after: **"and that's all of course in the video automation repo the dispatch."**

### The measured starting point (2026-08-14, HEAD `0ea5fad`)

| | count |
|---|---|
| `video-engine/src` | 10,393 lines / 31 files |
| `src/lib` modules | 21 |
| elements reachable through `registry.tsx` | **79** |
| review sheets in `Root.tsx` | 12 |
| `biomes.tsx` | 338 lines, the thinnest module carrying the most weight |

What does NOT exist: any module for the roadside, the home, the school, the stadium, Tejano and
border Texas, or Black Texas. The library can draw an oilfield and a data hall and can't draw the
drive there, the house at the end of it, or the Friday night everybody in the frame grew up going
to. That is the gap the directive names, and it is the reason a Dispatch currently looks like an
explainer about Texas rather than a film made by somebody from there.

### The reframe this wave turns on

Everything in the library so far answers **what the story is about**. Nostalgia is not a subject.
It is what the story is set IN, in the corner of the frame, unremarked. A viewer does not
recognise a Dairy Queen because the film is about Dairy Queen. They recognise it because it went
past the window while somebody was talking about something else, exactly the way it did every
Saturday of their childhood.

So this wave adds a **fifth house rule** to the four the engine already runs on:

> **RECOGNITION OVER DECORATION.** An artifact earns its place by being recognised, not by being
> pretty. The test is whether a Texan looks at it and thinks *I have been there* rather than
> *that is nice*. Which means specificity beats polish every time: the right rusted gin sign
> badly drawn lands, and a beautiful generic barn does not.

The existing four stand and this one composes with them. "Maintained but worn" and "nothing is
symmetric" are already recognition rules by another name. This one says out loud what they were
reaching for.

### The research team

Six agents, running in parallel, each returning per-artifact JSON (`name`, `what`,
`why_it_lands`, `geometry`, `palette`, `era_markers`, `regional`, `variants`, `scene_role`) plus
a blunt "what an outsider gets wrong" section, because the outsider mistake is the single most
useful thing a research doc can carry. FAUNA_AND_FLORA proved that in Wave V1 by leading every
entry with it.

| # | brief |
|---|---|
| 1 | Roadside and small-town Texas: the drive-by inventory |
| 2 | Growing up in Texas: school, Friday night lights, mums, the bluebonnet photo |
| 3 | Tejano, Mexican-American and border Texas |
| 4 | The working land and what Texas runs on, with precise MOTION for each |
| 5 | The nine Texases, plus a `sky_states` array |
| 6 | The Texas home and yard, plus Black Texas: Juneteenth, Black rodeo, zydeco, SLAB, PVAMU |


### Scope added mid-wave (owner, 2026-08-14)

Five directives arrived after the first six research briefs, each widening the wave. All
five are in scope and none of them replaces the artifact work.

> "landmarks, anything Texas and famous, cartoons, shows, famous faces and names, actors,
> folklores, cowboys, old ads and commercials, brands, that can all bring about nostalgia
> also, launch some agents at any of those things that u didn't already"

> "also geographical accuracy and topography, lat and long, get our system extremely well
> versed with the landscape and how the actual land works and has worked historically"

> "also sounds, this is huge, and sfx library you need to build out based on texas"

> "also songs and tracks, we can lean Texas on those instead of always using the generic
> kevin McLeod song u can find that day lol"

**THE IP LINE, AND IT IS NOT OPTIONAL.** Three of those five directives point straight at
material this project does not own: brands, characters, real people's faces, and recorded
music. The library's answer is the same in every case and it is already written into
`roadside.tsx`: **draw the FORM, never the MARK.** A thirty foot orange and white striped
A-frame is a building type and the flying letter is a trademark. A propane tank in an alley
is Texas and a cartoon character is somebody's property. A conjunto arrangement is an idiom
and a recording of one is a licence.

This is not timidity. The research keeps confirming that the FORM carries essentially all of
the recognition anyway, which is the whole finding: a Texan recognises the striped A-frame
from a mile away because it was built to be seen from an aeroplane, and the wordmark is not
what they are reading at that distance. So every research brief for this half was written to
return the protected element and the free vernacular underneath it as separate fields, and
`engine_lint` refuses a brand string in the roadside module.

Seven further agents, running:

| brief | why |
|---|---|
| landmarks and built icons | the Capitol, the missions, Cadillac Ranch, the escarpment profiles |
| Texas on screen | the SETTINGS those shows made legible, never the characters |
| brands, old ads, the sign layer | the generic forms, and what real Texas signage actually looks like |
| folklore and working cowboy craft | the hat crease by trade, the saddle, and La Llorona handled with respect |
| physical geography and land history | so a Reeves County story stops getting Hill Country limestone |
| the sound of Texas | an SFX library with real rates, and distance behaviour for flat country |
| Texas music | an ORIGINAL house sound spec, plus an honest map of what is legally usable |

### The modules

| # | module | what it holds | status |
|---|---|---|---|
| 1 | `flora.tsx` | the plant silhouettes every region is built from | |
| 2 | `skies.tsx` | Texas sky states as full-frame backdrops | |
| 3 | `biomes.tsx` (expand) | the nine regions with true horizons | |
| 4 | `roadside.tsx` | the drive-by Texas | |
| 5 | `hometown.tsx` | school, stadium, the year's rituals | |
| 6 | `tejano.tsx` | Tejano, Mexican-American and border Texas | |
| 7 | `homeplace.tsx` | the house, the yard and the lease | |
| 8 | `blacktexas.tsx` | Juneteenth, Black rodeo, zydeco, SLAB, freedmen's towns | |
| 9 | registry + sheets | every artifact reachable, a review sheet per module | |
| 10 | `knowledge/texas/NOSTALGIA.md` | the doctrine, so the next run inherits it | |

Order is deliberate. `flora` and `skies` are the primitives every other module composes from, so
they land first or the regions get built twice.

### Rules specific to this wave

- **Every artifact is rendered and LOOKED AT.** Waves V3, V5 and V10 each found bugs no typecheck
  could see, and V3 found three in one pass. A sheet that has not been opened is not a sheet.
- **True scale or it does not ship.** `KIT_M` declares metres, `fit()` converts. A drawing sized
  by eye against a stage that has a real metre in it is the defect `staging_check` exists for.
- **Reachable or it does not exist.** `registry_check` fails on an element that is authored and
  not registered, because an unregistered name renders an empty plane with no error.
- **Culture is drawn with the same care as the cast.** `CULTURE.md` already bans lotería and Day
  of the Dead iconography. Modules 6 and 8 are exactly where that rule gets tested, and the
  answer is the same as it was for the cast: draw the real thing specifically, or don't draw it.

## Rules this work obeys

1. **Alaska is REFERENCE ONLY.** Never write to those repos. Never copy ledger memory.
2. **Every gate is replayed against the defect it exists for** and watched go red. The docket
   repo's `GATE_LESSONS.md` is 16 entries of what happens otherwise, and entry 15 is the one to
   remember here: a fixture written by the same hand as the detector agrees with the detector.
3. **No numeral typed.** Same law as the docket. A figure in a script or on a frame traces to a
   claim, and a claim traces to a fetched source.
4. **Ported means rebuilt for Texas, not copied.** Alaska's fauna is Alaska's. A moose is not a
   longhorn with different antlers.
5. **The bar is read, never quoted.** Alaska lost five panel rounds to a stale `9.0` typed into a
   prompt while the rubric said 7.5. The threshold lives in the rubric file and nowhere else.
6. No Claude or Anthropic attribution on any commit or PR. Git identity is
   `Talon Sturgill <Talon.sturgill@gmail.com>`.

## Log

- 2026-08-12 — surveyed the source machine, established live vs retired, confirmed the repo is
  empty, set the git identity, wrote this file.
- 2026-08-12 — Wave V1. Five research docs, written against sources rather than from memory.
  REGIONS is the ten Gould ecoregions (TPWD, Leaflet 492, 1960), each with its LIGHT first because
  light is what makes a Panhandle frame unmistakably not a Houston frame even when both contain a
  data centre. CAST resolves the cowboy question honestly: hats are real on a rancher, a Ranger, a
  sheriff, a rodeo competitor and a norteño musician, and a costume on a Houston executive or
  anyone on a rig floor where a hard hat is a safety requirement. The straw-to-felt season is
  drawable and dated, Easter to Labor Day, with Texas Monthly on record that Texans bend it because
  the heat runs past September. FAUNA leads every entry with THE MISTAKE, because the mistake is
  what an outsider draws. KIT is the industrial and civic inventory, maintained but worn. CULTURE
  is written before the cast is drawn rather than after, and its provisions are enforced by
  construction: one head geometry system, skin as a fill token that never touches the line work,
  and an evenly spaced ramp, so the caricature failure mode is structurally hard rather than merely
  discouraged.
- 2026-08-12 — Waves V2 and V3. stage3d ports VERBATIM and says so in its header: it is a
  camera, a projection and a light model with no state in it, and rewriting it to look original
  would throw away the only part of a port that is already correct. lighting is a REBUILD: the
  colour maths and the four-stop ramp port, but the sibling's single low dawn key does not,
  because Texas has ten lights and one global key would make every region the same place. The
  relationship that carries it is shadeDrop against humidity: the Gulf has the smallest shadow
  drop in the set because the air fills every shadow, the Trans-Pecos the largest because nothing
  does, and the Hill Country gets a bright cool fill because limestone bounces light UP into the
  shade, which is the region's whole tell and almost nobody draws it.
- 2026-08-12 — the cast rig, and a defect in the source worth not inheriting. That rig hardcodes
  `const skinShade = '#c99268'` and uses it for every character's shadow side, ear crease, neck AO
  and nose line. It is a value tuned for ONE skin tone, so on a dark-skinned character the shadow
  is LIGHTER than the base and the shading inverts. A rig whose shadow constant only works at one
  end of the ramp cannot draw a cast. Here it is derived through the same tones() ramp as
  everything else, and the sheet proves it across all eight tones.
- 2026-08-12 — three bugs found by RENDERING the cast and looking at it, none of which a
  typecheck could see. Every hat drew as a ring around the character's face, because the head
  circle sits at cy -58 while the headgear was authored around the origin. Then the fix had the
  sign backwards and put the hats at the neck, which also hid the hair behind the torso and made
  the whole cast look bald. And `y` was documented as the feet anchor while the local origin is
  at the shoulders, so a caller placing a figure on a ground line got it floating a third of a
  body above it. GATE_LESSONS 15 again, from a new direction: the fixture agrees with the author.
- 2026-08-12 — Waves V4 and V6. The kit leads with the pumpjack, and its phase is derived from
  the seed by DEFAULT so a field is automatically out of step and a caller has to work to
  synchronise it rather than the reverse. That inversion is the whole lesson of the KIT doc: every
  unit in a real field is at a different point in its stroke, and a synchronised row is the tell.
  The transformer gets radiator fins and bushings because without them it is a shipping container.
  The conductor takes a catenary sag because a straight line between tower tops is the tell.
- 2026-08-12 — `engine_lint.py`, written after the SECOND corrupted colour literal in one
  session. `'#2b3category'` and `'#e0b<CJK>88'` are both valid TypeScript strings, and a browser
  drops an unparseable colour silently and paints the default, so the frame renders and the region
  is quietly the wrong colour. Two is a pattern and a pattern gets a gate. It also refuses
  Math.random in a render, a zero-sag conductor, a pumpjack pinned to a constant phase, and two
  regions sharing a green, which is the vernacular law in the one place it is checkable.
- 2026-08-12 — that gate failed on its own first run, on a false positive, and the fix is the
  more useful half. materials.tsx carries the line "no Math.random (banned for Remotion
  determinism)", which is the module CORRECTLY documenting that it does not do the thing, and the
  gate read its own rule as a violation. Comments are now stripped before scanning, with the
  newlines preserved so reported line numbers stay accurate. A gate that fires on a docstring
  describing the rule it enforces is a gate that gets switched off in a week.
- 2026-08-12 — Waves V8 and V9. The routine prompt carries the showstopper standard, the one
  outcome law with its hatch ledger, the degradation ladder and the two laws of drawing Texas. The
  rubric holds the bar at 7.5 WITH the reason recalibrating off 9.0 was right: 9.0 was implicitly
  calibrated against a painterly fidelity this brand deliberately does not use, so the ceiling on
  every run became the house style itself and the panel's weakest axis was "the flat vector
  characters" for nine straight rounds while every concrete defect got fixed.
- 2026-08-12 — `bar_check.py`. The sibling lost FIVE panel rounds in one run to a number written
  down twice: the prompt said 9.0, the rubric said 7.5, and the panel was briefed the wrong one and
  returned ship:false on a cut already over the real bar. Two judges flagged the divergence
  unprompted and the run kept grading against the wrong number anyway. Nothing was broken and both
  numbers were written by somebody being careful, which is why the only fix that holds is to make
  the second place impossible. Its own self-test then failed on an assertion I wrote wrong: every
  offender message contains the string `config/dispatch_rubric.yaml`, because the message's whole
  job is to say where the bar belongs, so `"dispatch_rubric" not in o` matched its own advice.
- 2026-08-12 — the proof scene renders 150 frames end to end. Two composition faults found by
  looking rather than by any gate: a near plane inside a dollyThrough scales up hard as the camera
  closes, so a foreground element near frame centre grows across the subject and reads as a bug
  instead of as depth; and the pumpjack field sat entirely behind the slab, which loses the one
  composition this show is built on. Both fixed by moving things, not by changing the engine.
- 2026-08-12 — `vo_soundcheck.py`. Best-of-N is a comment rather than a mechanism unless
  something decides, so this does. Five refusals, each seen in the sibling. Word accuracy is an
  ordered LCS ratio rather than a bag of words, because a bag would score a take that says every
  word in the wrong order as perfect. The spoken-tag check is the one that saves a film from
  embarrassment: inline direction CAN be read aloud, and a narrator who says the word "excited"
  has ended the piece, which is why the craft doc puts emotion in the director's notes and never
  in a tag. A duration failure says TRIM THE SCRIPT and names the overage, because time-stretching
  is banned and produces the artefact every viewer hears and cannot name.
- 2026-08-12 — `knowledge/craft/VO_DIRECTION.md`. The rule that matters is that direction is
  written as intent, emphasis, pace and energy, which are things a model PERFORMS, and never as an
  adjective in a tag, which is a thing a model may PRONOUNCE. The soundcheck greps for the tag
  vocabulary anyway, because a rule that depends on everyone remembering it is not a rule, but the
  check is a net rather than a method. Also: spell a Texas name phonetically IN THE SCRIPT, since
  the model reads what it is given and a note in a plan it never sees does nothing. Mexia, Boerne,
  Bexar, Manchaca, Refugio, Palacios.
