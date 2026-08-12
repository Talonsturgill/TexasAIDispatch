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
| V0 | Foundation: CLAUDE.md, guards, port manifest, this file | **IN PROGRESS** |
| V1 | The Texas research the vernacular doc owes us | TODO |
| V2 | Engine port, the state-agnostic ~50%: stage3d, lighting, motion, materials, FX, voice, props, records, simulation, vision, screenlight, absence, nameengine, bench | TODO |
| V3 | **The Texas cast.** Character rig, outfits, headgear, built demographically first | TODO |
| V4 | Texas biomes: the regions, each with its own light and green | TODO |
| V5 | Texas fauna: the species, drawn correctly | TODO |
| V6 | Texas props, vehicles, civics: pumpjack, substation, cattle guard, water tower, pickup | TODO |
| V7 | The scripts: 37 port near-verbatim, the rest rebuild | TODO |
| V8 | The routine prompt, the 9 agents, the craft doctrine | TODO |
| V9 | Proof: render a real Dispatch end to end | TODO |

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
