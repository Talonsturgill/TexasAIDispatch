# Handoff — what only you can do

Everything in this repo works when run by hand. These are the things that need an account, a key
or a click, and none of them blocks the build.

---

## 1. Create the routine

At claude.ai/code/routines. **One routine.**

| routine | prompt file | cadence |
|---|---|---|
| Texas AI Dispatch | `prompts/dispatch_routine.md` | daily |

The trigger prompt is the contents of `prompts/ROUTINE_PROMPT.txt`, which says only *read that
file from main and execute it*. That indirection is deliberate: the real instructions stay
versioned and reviewable in the repo rather than living in a settings box nobody diffs.

**Set permissions to `bypassPermissions`.** An unattended run wedges forever on a permission
prompt with nobody there to answer it.

**Connectors:** Gmail, for the draft. Nothing else is required.

---

## 2. The Gemini key

The voice is Gemini TTS, which is the one part of this machine that cannot run without a
credential.

Set `GEMINI_API_KEY` in the routine environment. `generativelanguage.googleapis.com` has to be
reachable under the environment's network policy.

Cost is small per Dispatch, and the model is `gemini-3.1-flash-tts-preview` with
`gemini-2.5-pro-preview-tts` as the failover on repeated 500s.

**Audition the voice before the first real run.** `config/voices.yaml` carries a DEFAULT so the
machine runs rather than blocking on a preference, and it says so in the file. It also carries the
method: synthesise the same real Dispatch passage in every candidate, grade them all with
`vo_soundcheck.py`, and only listen once the measured takes are ranked. A voice that reads a
pleasant paragraph well and lands a figure badly is the wrong voice for a show whose whole subject
is figures. Record the winner in the same file.

`knowledge/craft/VO_DIRECTION.md` describes the read: a person who knows the subject, telling you
something they think you should know, slightly dry and willing to leave a silence.

**Without the key, everything else still runs.** `vo_synth_gemini.py` exits 3, which means BLOCKED
and is deliberately not the same exit code as failed. The run reports the voice step as blocked
rather than shipping a silent film.

---

## 3. Push access to the docket repo

The publish step writes exactly one file into `TexasAIDocket`: `docs/videos/videos.json`, the feed
manifest. The routine environment needs push access to that repo for the step to land.

**That is the only file this repo writes there, ever.**

---

## What is done and what is not

**Done.** The research (`knowledge/texas/`, five docs written against sources). The engine:
`stage3d` ported verbatim, `lighting` rebuilt with ten regional lights, the cast rig with ten
people authored in one pass, ten biomes, the industrial and rural kit, and fifteen species of
fauna drawn at true scale against the cast rig. The routine prompt, five agents, the rubric that
holds the bar. A proof scene that renders 150 frames with three composed camera moves.

**Every script the routine calls now exists**, each with a `--self-test` that replays the defect
it was built for, and all ten are wired into CI:

| gate | what it refuses |
|---|---|
| `engine_lint` | a corrupted colour literal, which a browser drops silently and paints the default |
| `bar_check` | the ship threshold written down in more than one place |
| `staging_check` | an animal standing in a region it does not live in |
| `storyboard_check` | a relabel pretending to be composition divergence, before a frame is rendered |
| `flow_check` | a rest across a cut, a beat with no motivated sound, a picture the voice carries |
| `vo_synth_gemini` | a prompt whose spoken body contains direction, refused before a call is spent |
| `vo_soundcheck` | the take that reads a stage direction aloud, and the drone |
| `vo_align` | caption boundaries that do not trace to measured silence |
| `mix` | a read that does not fit. There is no resampler in that file, and its self-test proves the absence |
| `ship_gate` | the rubric's hard fails, six of the seven checked mechanically |

**Still open, and the honest list.** The engine renders a proof scene, not yet a full Dispatch
from a story: nothing has been driven end to end with real research through to a delivered file,
because that needs the routine to actually run. Wave V7's alignment is silence-anchored rather
than phoneme-level, which is stated plainly wherever it is claimed. The commercial wing
(`TexasAIScanner`) has not started.

`.claude/WORKLOG.md` was the build's wave table and was deleted on 2026-08-19 when its last
wave went DONE, which is what `CLAUDE.md` says to do with it. The reasoning did not go with
it: the craft lessons live in `knowledge/craft/GATE_LESSONS.md`, and every gate carries the
defect it exists for in its own docstring plus a `--self-test` that replays it.
