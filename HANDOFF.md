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

**Audition the voice before the first real run** and record the pick in `config/voices.yaml`. The
sibling auditioned several and chose one for warmth; that choice is theirs and not automatically
ours. `knowledge/craft/VO_DIRECTION.md` describes the read this show is going for: a person who
knows the subject, telling you something they think you should know, slightly dry and willing to
leave a silence.

**Without the key, everything else still runs** and the run reports the voice step as blocked
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
people authored in one pass, ten biomes, the industrial and rural kit. The routine prompt, five
agents, the rubric that holds the bar. Three gates with self-tests, wired into CI. A proof scene
that renders 150 frames with three composed camera moves.

**Not done, and the honest list.** The synth wrapper that actually calls Gemini (the soundcheck
that grades its output is written and tested). The mix and the forced-alignment step for captions.
The ship gate and the flow check. Fauna. The storyboard check that Gate 0 calls. Those are the
remaining scripts named in `prompts/dispatch_routine.md`, and a run cannot complete without them,
which is why the worklog still lists Wave V7 as partial rather than done.

`.claude/WORKLOG.md` carries the wave table and every decision's reasoning. Read it first.
