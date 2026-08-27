# Texas AI Dispatch

Source repo for the Texas AI Dispatch: a daily narrated 2.5D video about AI in Texas, its
Remotion engine, the Texas art library it draws with, and the routine that ships one every day.

## Work in progress

If `.claude/WORKLOG.md` exists, READ IT FIRST. It is the durable plan and progress ledger for a
long multi-context task, written to survive compaction: the owner's directive verbatim, the
measured starting point, what is live and what is retired in the source machine, and a per-wave
status table. Resume from that table and update it after every commit. Delete the file when its
waves are all DONE.

Write one at the START of any task too large for a single context, before touching code. A plan
that lives only in context does not survive compaction.

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

Runs SHIP AUTONOMOUSLY only from controller state `publishable`. When a run's gates pass, the run branch is merged to `main` **without a
human-review gate**: commit the artifacts, push, open a PR that is **ready (NOT a draft)**, and
**MERGE it in the same run**. The email's media links point at published URLs, so the merge lands
before the email. The email is the only human touchpoint and it gates the POST, not the merge.
Failed runs commit evidence to their branch and do NOT merge.

This wins for development sessions too. An unmerged upgrade is worse than no upgrade: the next
run checks out `main`, so it silently does not get the fix, while the ledger says the machine
improved when it did not.

Three things still stop and ask, in any session:
- work that would rewrite already-published history on `main`
- anything that SENDS rather than drafts (these routines never send)
- deleting or overwriting shipped run artifacts under `runs/`

## THE BOUNDED RUN CONTRACT

A Dispatch run has exactly two terminal states: `publishable` or `needs_review`.

- `publishable` requires a hash-bound final report at or above the rubric with no hard fail.
- `needs_review` preserves the complete package when a gate, budget, credential, or final panel
  prevents unattended publication. It never writes the feed or merges run artifacts.

`scripts/run_controller.py` owns every expensive allowance in `config/run_limits.json`: three
researchers and one validator, one reboard, bounded animatics, four external audio-model calls,
four full renders, and two three-judge panels. A reservation happens before spend. A new shell,
folder, or batch cannot reset the run ledger.

The routine gets one corrective pass after the first finished-cut panel. The second panel is
final. There is no instruction to keep polishing below bar, which is how the first film reached
27 rounds and 81 scorer calls while regressing.

An explicit owner override is recorded by the controller for a human owner only. The unattended
routine never invokes or recommends it.

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

## The engine

**Remotion + React + hand-authored SVG.** No WebGL, no canvas, no image assets. Depth is real
browser 3D projection through one shared virtual camera in `video-engine/src/lib/stage3d.tsx`.

**RETIRED, never for new work, history only:** any per-frame PIL or Taichi raymarcher, and every
doc describing one. The sibling carries a retired `dimensional.py` pipeline and a
`DIMENSIONAL_CRAFT.md` that reads authoritative and is dead. If a doc here describes rendering
frames in Python, it is wrong.

## Voice

**Gemini TTS**, owner's decision. `gemini-3.1-flash-tts-preview` primary,
`gemini-2.5-pro-preview-tts` as the failover on repeated 500s. Each take synthesises the whole
passage for natural sentence-to-sentence flow and spends a second call on verbatim soundcheck.
The run-wide controller permits four external audio-model calls total across every retry and
batch, so the normal path is two takes and a fifth call is mechanically refused.

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
| `TexasAIDocket` | the record, the site, the carousel. **This repo writes exactly one file there: `docs/videos/videos.json`**, appended by the publish step. Nothing else, ever. |
| `TexasAIScanner` | the Bottleneck Scanner backend. No overlap. |

The Alaska repos (`alaskaaicarousels`, `alaska-ai-weekly`, `alaska-ai-scanner`) are REFERENCE
ONLY. Never write to them. Never copy their ledger memory: the dedupe gates compare against recent
history and Alaska's would poison them.

## Layout

- `prompts/` — `dispatch_routine.md` is the single source of truth for the routine.
  `ROUTINE_PROMPT.txt` is the thin pointer pasted into the routines UI.
- `knowledge/texas/` — the research that makes it Texas: vernacular, regions, the cast, fauna,
  landmarks, speech. Every art decision traces here.
  **`APPLICATIONS.md` is where a STORY comes from, and it corrects a real error.** This show is
  about the application layer: somebody using a tool, at work, in a real place. A docket tracks
  decisions and one already publishes next door every day, and this show is not its video edition.
  The first beat list here had nine entries and six were policy or infrastructure, which is a
  different and much smaller show.
- `knowledge/craft/` — how the show is made: stage3d authoring, visual flow, hook craft, VO
  direction, the showstopper standard.
  **`GATE_LESSONS.md` is required reading before you add a gate, trust one, or conclude that a
  green suite means a correct product.** It is the record of faults that shipped here with every
  check passing, and each entry names what to check instead. A green suite has already been wrong
  about whether a gate was connected to anything at all, about the colour of a shape, about the
  size of an animal standing beside a person, about a delimiter that appeared twice, and about an
  assertion that could not fail on any input. The way to find out whether a gate works is not to
  read it. It is to break the product on purpose and watch.
- `config/` — brand, voices, the rubric that holds the bar, sources.
- `scripts/` — the gates and the build steps. Run them by EXIT CODE, never by last line.
- `video-engine/` — the Remotion project. `src/lib/` is the reusable cast and juice.
- `assets/` — fonts, voice reference, committed art data.
- `out/` — per-run scratch (gitignored). `runs/` — shipped artifacts.

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
