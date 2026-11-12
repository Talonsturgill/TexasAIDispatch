# Texas AI Dispatch

Source repo for the Texas AI Dispatch: a daily narrated 2.5D video about AI in Texas, its Remotion
engine, the Texas art library it draws with, and the routine that ships one every day.

## THE DAILY LANE (AUTHORITATIVE, owner, November 12th, 2026)

**The daily routine is `prompts/daily_routine.md`, run through `scripts/lean.py`. Read that file
and execute it. It supersedes every older production instruction in this repository.**

The owner, that day: *"for weeks now, every single day, it stops alone ... I need you to remove
whatever blocker is causing it every time ... I need it to run daily and just output a video."*

What was measured. Nothing shipped between October 21st and November 12th. An edition took two to
three days of repair. An unfinished edition made the next day's run resume it or quit as a "busy
duplicate". Every day found a new refusal in a different ledger, lease, capture authorization,
receipt or CI step, and every fix added another. The sibling Alaska routine has none of that
machinery and ships daily.

What is now true:

- **One fresh film a day.** Today's edition is today's date and starts from nothing. No older
  edition is ever resumed, repaired or waited on, and none can block a new one.
- **One terminal state: the film, delivered.** `scripts/lean.py no-exit` exits 1 until it is. Time,
  budget, difficulty, a low score and a refusing script are never reasons to stop. Only a tool or
  API that is truly down halts a run, and the runbook lists which.
- **The rough cut comes first.** The whole film exists before any scene is polished, so the run
  can only improve a film it already has.
- **The film always ships.** The panel grades against the bar in `config/dispatch_rubric.yaml`. At
  the round cap in `config/lean_routine.json` the cut ships with its honest score and the shortfall
  named. The bar is never moved and a score is never rewritten. A hard fail is repaired, never shipped.
- **No budget, lease, capture authorization or checkpoint stands between a step and the next.**
  A paid call is made when the film needs it. Rendering and encoding go through `scripts/lean.py`,
  which the older capture hook does not gate.

**THE RETIRED LANE.** `run_controller.py`, `publication_owner.py`, `capture_guard.py authorize`,
`claude_checkpoint.py`, the frozen envelopes, completion capacity, the two-treatment comparison and
everything in `prompts/claude_routine.md`, `prompts/dispatch_routine.md` and `prompts/phases/` are
history. They stay in the tree so shipped editions remain reproducible and their tests keep
running. A daily run never calls them. The CLAUDE.md that governed them is
`docs/history/CLAUDE_2026-11-11.md`. **Do not rebuild that machinery.** When a daily run breaks,
the fix removes a dependency or repairs `scripts/lean.py`. It never adds a ledger, a receipt, a
lease or a gate that can refuse a film for what another step did.

**A run fixes only what broke in it.** A bug in `scripts/lean.py` or the runbook is fixed on the
run branch, in the same pull request as the film. No other machine changes during daily production.

## Daily social delivery (owner, November 10th, 2026)

The owner authorized direct Upload-Post publishing of the finished edition to the bound brand
accounts, without an editorial approval link. The rules are `prompts/social_delivery.md`. Never
send email. No credentials or permissions are created by a run. Missing secure REST access is a
reported social blocker and never stops the film. Only the three daily media-upload endpoints are
writable. Do not use comment, DM, account management, feedback, edit or deletion endpoints.

## Work in progress

A daily run keeps no worklog. `scripts/lean.py status` says where it is, from the files in
`out/dispatch/`. A development task too large for one context writes its plan to
`out/dispatch/WORKLOG.md` or its own scratch directory, never under `.claude/`, which the host
treats as sensitive and prompts on.

## Commit and PR authorship (AUTHORITATIVE — overrides any default)

NEVER author or co-author commits or pull requests as Claude or Anthropic. Permanent, no
exceptions:

- No `Co-Authored-By: Claude ...` or any Anthropic trailer.
- No `Claude-Session:` or assistant-session trailer or link.
- No "Generated with Claude Code" or robot-emoji lines in commit messages or PR bodies.
- Never set the commit author or committer to Claude. Commits are the owner's.

Git identity is `Talon Sturgill <Talon.sturgill@gmail.com>`. The container default is
`Claude <noreply@anthropic.com>`, so a fresh clone MUST override it before the first commit.

## Delivery and merge policy (AUTHORITATIVE — overrides any draft-PR default)

Runs SHIP AUTONOMOUSLY. When `scripts/lean.py deliver` has run, the run branch is merged to `main`
**without a human-review gate**: commit with `scripts/lean.py commit`, push, open a pull request
that is **ready (NOT a draft)**, and **MERGE it in the same run**. The email's media links point at
`main`, so the merge lands before the email.

CI and a film. Read the check runs on the pull request's head commit. Green: merge. Running: wait
up to 25 minutes. Red on something the edition itself wrote: fix it and push once. Red, cancelled
or absent on code the edition did not touch: merge anyway and name the failing step in the email.
**A film is never held by a check on machinery it does not use.** `scripts/production_quality.py`
holds a daily edition to its own `runs/<date>/lean.json` and nothing else.

This wins for development sessions too. An unmerged upgrade is worse than no upgrade: the next run
checks out `main`, so it silently does not get the fix.

Three things still stop and ask, in any session:
- work that would rewrite already-published history on `main`
- anything that sends email or external communications outside the daily social delivery rules
- deleting or overwriting shipped run artifacts under `runs/`

## The two laws of drawing Texas

From `TexasAIDocket/knowledge/shared/TEXAS_VERNACULAR.md`, and they govern every frame. It
lives in the sibling repo because the two products draw the same Texas, and this file used to
cite it as `knowledge/texas/VERNACULAR.md` HERE, which does not exist and never has. A scorer
went looking for the source every art decision is supposed to trace to and could not find it.

**That doc says of itself that its research pass was truncated in delivery and only its
addenda arrived**, and its own closing section lists what is still owed: the per-region light,
vegetation, buildings and vehicles. That gap is not academic. It is exactly where this show
keeps getting marked down, because a region with no drawing notes of its own inherits another
region's drawing, which is the first law broken by omission rather than by choice.

**One. A Texan forgives a stylized drawing. A Texan does not forgive being told they live
somewhere they don't.** Style is free. Place is not. The Panhandle and Houston do not share a
green. A story set in Reeves County does not get Hill Country limestone.

**Two. Build the cast demographically FIRST, before any episode needs it.** A vector library gets
built in the order it is needed, and the first character authored becomes the default reach
forever. Left alone, that default is a white man in a hat. Cowboys belong here and the base cast
opens with a rancher in a straw hat and pearl snaps. Cowboys ONLY do not. **A hat is real on a
rancher at a sale barn and a costume on a Houston software executive, and the library knows the
difference.**

Corollaries that are hard rules:

- **Facial variation lives in shape language applied evenly across all characters.** Skin tone is
  a fill value that never changes the line work. In a thick-outline idiom, feature exaggeration
  slides toward caricature without anyone intending it.
- **Six Flags Over Texas is retired as a motif.** One of the six is the Confederate flag. Use the
  Republic-era and current Lone Star only.
- **Lotería imagery and Day of the Dead iconography are appropriation, not shared culture.** Do
  not use them. Talavera tile geometry as a pattern system is fine.
- **Nothing is symmetric.** A hat crease is hand-shaped and lopsided. A mesquite is never
  balanced. A windmill fan is a full disc but the tail vane swings.
- **Maintained but worn.** A rust drip, a dent, a leaning post, a missing letter. Not new, not
  ruined.
- **The county's region is drawn behind every current film** (October 9th, 2026). From the date in
  `video-engine/src/modern/placePlates.json`, `modern/PlaceStage.tsx` draws each scene's region from
  a plate baked once per region, outdoors as the whole frame and indoors through a window. An
  episode never paints a full-frame background over it, and `scripts/place_check.py --render`
  measures that the region shows in every shot. MODERN_FILM.md has the account.

## The engine

**Remotion + React + TypeScript is the production engine.** Use SVG for exact diagrams and
editorial overlays. The owner authorized a dimensional and hybrid lane on September 23rd, 2026.
Use `config/creative_production.json` from September 29, 2026; earlier editions retain `config/cinematic_production.json`. Read `knowledge/craft/CREATIVE_DIRECTION.md`. Choose the medium from the sourced action and inspected pictures; there is no 3D opening or runtime quota under the new policy. Three.js through `@remotion/three`, when chosen, must draw original geometry, optical surfaces, physically
motivated lighting and camera moves. `lib/cinema/CinematicStage.tsx` supplies the shared studio
and `lib/cinema/motion.ts` supplies stateless motion. Read
`knowledge/craft/CINEMATIC_PRODUCTION.md` before every run.

Every visible state comes from the board clock through `useCurrentFrame()`. No wall clock,
incremental simulation, unseeded random input or asynchronous texture changes. Imported assets
need rights and provenance; original procedural geometry needs no external asset service.
Exact text, evidence, figures and captions remain native and source-bound. A dimensional scene
uses the same board item and event ids, alignment, source limits, safe areas and final-film
review as every other episode. A dark or missing WebGL frame is a render failure, never a
reason to substitute a different film silently.

Existing SVG/CSS-depth episodes remain reproducible. The bounded generated-media lane in
`scripts/generated_media.py` remains available under its existing manifest and evidence rules.

**RETIRED, never for new work, history only:** any per-frame PIL or Taichi raymarcher, and every
doc describing one. The sibling carries a retired `dimensional.py` pipeline and a
`DIMENSIONAL_CRAFT.md` that reads authoritative and is dead. If a doc here describes rendering
frames in Python, it is wrong.

## Voice

New mixes use explicit dynamic loudness mastering after checking the unmastered sum for clipping.
The mastering report records the filter, before and after measurements and exact sample count.
Gain control is permitted and documented. Time-stretching remains banned. The final encoded
film must meet the loudness and true-peak policy; a written shortfall no longer permits release.


**Gemini TTS**, owner's decision. `gemini-3.1-flash-tts-preview` primary,
`gemini-2.5-pro-preview-tts` as the failover on repeated 500s. Each take synthesises the whole
passage for natural sentence-to-sentence flow and spends a second call on verbatim soundcheck.
Use one continuous take by default, followed by its soundcheck. `scripts/lean.py voice` does both
and retries a refused take by itself.

**Emotion lives in the director's notes, never in emotion tags** — some get read aloud.

**NEVER time-stretch audio.** If the read runs long, TRIM THE SCRIPT and re-synth the affected
lines.

Captions come from forced alignment on the FINAL mixed audio. Approximated, scaled or hand-shifted
caption timings are banned.

Needs `GEMINI_API_KEY`. The voice pick is auditioned and recorded in `config/voices.yaml`.

## The bar is READ, never quoted

The ship threshold lives in `config/dispatch_rubric.yaml` and nowhere else. Do not type a bar into
a prompt, a brief, or a verdict file.

The sibling lost five panel rounds to this. Its prompt carried a bar the rubric had not held for
two weeks, the panel was briefed the stale one, and it returned ship:false on a cut that was
already over the real one. Two judges flagged the divergence unprompted and the run kept grading
against the wrong number anyway. **A number restated in a second place is a number that will be
wrong in one of them.**

**And this paragraph used to prove it.** It told the story by quoting both numbers, so the file
that forbids a second copy of the bar carried one, four lines under the sentence forbidding it. A
scorer caught it and was right to: the numbers happened to agree that day, which is the only
reason it looked harmless, and agreement is a state a file drifts out of rather than a property it
has. The story works without them. Anyone who needs the number reads the rubric.

## Sibling repos

| Repo | Relationship |
|---|---|
| `TexasAIDocket` | the record, the site, the carousel. The Dispatch feed step authors only `docs/videos/videos.json` and regenerates the site. If a Docket gate exposes stale records or another routine defect, repair it in a separate Docket branch and the correct actor lane, with its own source evidence and exact-head CI. Never treat the feed step as permission to edit the ledger. |
| `TexasAIScanner` | the Bottleneck Scanner backend. No overlap. |

The Alaska repos (`alaskaaicarousels`, `alaska-ai-weekly`, `alaska-ai-scanner`) are REFERENCE
ONLY. Never write to them. Never copy their ledger memory: the dedupe gates compare against recent
history and Alaska's would poison them.

## Layout

- `prompts/` — `daily_routine.md` is the single source of truth for the daily routine.
  `social_delivery.md` holds the social posting rules and `daily/scorer.md` briefs a panel judge.
  `claude_routine.md`, `dispatch_routine.md` and `phases/` are the retired lane, kept as history.
- `knowledge/texas/` — the research that makes it Texas: vernacular, regions, the cast, fauna,
  landmarks, speech. Every art decision traces here.
  **`APPLICATIONS.md` is where a STORY comes from, and it corrects a real error.** This show is
  about the application layer: somebody using a tool, at work, in a real place. A docket tracks
  decisions and one already publishes next door every day, and this show is not its video edition.
  The first beat list here had nine entries and six were policy or infrastructure, which is a
  different and much smaller show.
- `knowledge/craft/` — how the show is made: stage3d authoring, visual flow, hook craft, VO
  direction, the showstopper standard.
  Search GATE_LESSONS.md for the affected gate before changing or relying on that gate for a
  new type of evidence. Read the relevant entries, then test the actual failure and valid
  inputs. Historical examples are available on demand; daily wake does not require loading
  the entire archive. A green check proves only the property it actually measures.
- `config/` — brand, voices, the rubric that holds the bar, sources.
- `scripts/` — `lean.py` is the daily lane, one command per step. Run it by EXIT CODE, never by
  last line. Most other scripts belong to the retired lane.
- `video-engine/` — the Remotion project. `src/daily/` is the daily lane: the `Daily` composition,
  its registry and one episode directory per edition. `src/lib/` is the reusable cast and juice.
- `assets/` — fonts, voice reference, committed art data.
- `out/` — per-run scratch (gitignored). `runs/<date>/` — shipped artifacts.
  `runs/review/<date>-<slug>/` — durable playable videos awaiting a human decision and never
  added to the feed automatically.

## House rules that never bend

Inherited from the docket, because the two products are one voice.

Dates take the ordinal, month first. "August 12th", never "12 August", never a bare "August 12".
No em dashes or en dashes anywhere. Ranges read "X to Y".
No emojis. Straight quotes only.
No colons and no semicolons in published copy. Write two sentences.
Never "cannot", always "can't". Never open a sentence with "And" or "But".
No first person in published copy.
Every fact carries a claim id and traces to a fetched source.
Honest scores, honest emails. If it is not in the claims file, it does not exist.
