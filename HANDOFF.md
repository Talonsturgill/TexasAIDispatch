# Handoff — credentials, routine setup, and current truth

One Dispatch shipped on 2026-08-18. It exposed the failure modes the current machine is designed
around: 27 panel rounds, 81 scorer calls, repeated visual constructions, text-heavy scenes, an
ill-fitting 1923 fiddle bed, and subtitles colliding with the live feed overlay. The shipped run
under `runs/2026-08-18/` is regression evidence and must not be rewritten.

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

The model is `gemini-3.1-flash-tts-preview` with `gemini-2.5-pro-preview-tts` as the failover on
repeated 500s. Every synthesis and verbatim-soundcheck request debits the same run ledger. Four
external audio-model calls is the hard run-wide ceiling, including retries and later batches.

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

## What is done and what remains operational

The engine, Texas knowledge, agents, rubric, licence checks, caption/alignment path, and product
gates are present. The remediation adds:

- one atomic controller for calls, tokens, elapsed time, preflights, renders, panels, and terminal
  state;
- an early structural board gate plus quarter-scale animatic and measured pixel-motion check;
- one correction and two panels, with a machine-computed report card that preserves any judge's
  hard fail;
- a run-wide four-call voice quota instead of a per-batch suggestion;
- an opt-in music registry that requires a playable file and mood/use/energy/era/avoid fit, with
  measured bed level relative to voice;
- final-film mobile and desktop feed compositing; and
- `deliver_run.sh --verify-only`, which runs the package checks without writing a ledger, run
  artifact, commit, PR, merge, or feed entry.

On a fresh renderer, either set `REMOTION_BROWSER_EXECUTABLE` to an existing compatible headless
shell or allow Remotion to manage one. The repository no longer pins a runner-specific `/opt`
browser revision.

The next real routine execution should begin in `dry-run` mode with publishing disabled. It needs
the Gemini key and a render-capable runner to exercise the external voice and Remotion browser;
only after that rehearsal is green should the scheduled production routine be enabled.

`.claude/WORKLOG.md` was the build's wave table and was deleted on 2026-08-19 when its last
wave went DONE, which is what `CLAUDE.md` says to do with it. The reasoning did not go with
it: the craft lessons live in `knowledge/craft/GATE_LESSONS.md`, and every gate carries the
defect it exists for in its own docstring plus a `--self-test` that replays it.
