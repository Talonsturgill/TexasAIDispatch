# Handoff: daily lane setup and current truth

The current production path is the daily lane added on November 12th, 2026. Older controller
machinery remains as historical evidence and regression coverage, not as a launch path. Shipped
edition directories under `runs/` are immutable.

## 1. Start the routine

Use `prompts/CLAUDE_ROUTINE_PROMPT.txt` for the scheduled trigger. The compatibility trigger at
`prompts/ROUTINE_PROMPT.txt` gives the same current instruction. Both send the run to
`prompts/daily_routine.md`, which is the only production runbook.

At wake, fetch current `main`, read `CLAUDE.md` and read `prompts/daily_routine.md` in full. The
runbook creates one fresh film for the current date. It never resumes, repairs or waits on an
unfinished older edition. A production run reaches `shipped` only after the film is delivered,
committed, merged and recorded by the daily lane.

## 2. Runtime and credentials

Every Dispatch command goes through `bash scripts/run_with_env.sh ...`. The wrapper activates the
available pinned runtime and loads the voice credential without copying or printing it.

- Local setup stores the Gemini key with `scripts/set-dispatch-gemini-key.sh` outside the
  repository.
- A hosted runner provides `GEMINI_API_KEY` in its environment.
- `generativelanguage.googleapis.com` must be reachable for voice synthesis.
- A compatible Remotion browser and the pinned media tools must be available. The runbook's wake
  step checks and repairs that runtime before production.

Never commit a key, pass it on a command line or print it. A missing key or an unavailable voice
API is reported exactly as the runbook requires.

## 3. Repository and delivery access

The routine needs push access to this repository. The Docket feed step also needs access to
`Talonsturgill/TexasAIDocket`, where Dispatch may change only `docs/videos/videos.json` and
regenerate the site from committed inputs.

The Gmail connector is used only to create and verify the unsent delivery draft. Never send email.
Current social delivery follows `prompts/social_delivery.md`. Missing access is reported per
destination and does not unship the film.

## 4. Current production state

The live command surface is `scripts/lean.py`. It owns initialization, board checks, voice,
measured caption alignment, timing, stills, cuts, final checks, panel records, delivery, commit,
feed reconciliation, draft preparation and the final receipt. Run commands by exit code.

The whole film exists as a rough cut before scene polish. Current limits and measurements live in
their committed configuration files. The ship threshold remains only in
`config/dispatch_rubric.yaml`; do not restate it in an operator document.

Daily scratch lives under `out/dispatch/`. A daily run keeps no `.claude/WORKLOG.md`.
`scripts/lean.py status` reports the current step from the scratch artifacts. A larger development
task may keep a temporary worklog under its own scratch directory.

## 5. Retired lane

The old controller, ledgers, leases, completion capacity, capture authorization, review packages,
historical routine and phase prompts are retained so shipped editions and their tests can be
reproduced. Do not rebuild them, use them to start a daily film or make a current film wait for
their state.

For a quick code-path check on a maintenance branch, run the daily self-test and feed regression
through the wrapper. The pull request must still pass every required repository check on its exact
head before merge.
