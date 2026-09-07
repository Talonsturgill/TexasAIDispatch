# September 6th, 2026 production run

## Owner directive

The active daily heartbeat directs this repository's versioned master routine to run today's
Texas AI Dispatch end to end, publish only from a clearing production controller, verify the live
site, and leave a verified Gmail draft without sending it.

## Measured starting point

- Current date: September 6th, 2026 in America/New_York.
- Fresh branch `claude/dispatch-2026-09-06` from `origin/main` at `b4544b284d01`.
- September 3rd completed scratch preserved under `out/archive/2026-09-03-production-complete/`.
- No September 6th local or remote Dispatch branch and no same-day run state existed.
- Current Docket live status reports build date September 6th, 108 items, spec 2.
- Docket has unrelated active daily and maintenance work; use an isolated worktree for any feed
  publication and never touch the user's dirty Docket checkout.

## Waves

| Wave | Status | Evidence |
| --- | --- | --- |
| Wake, instructions, dated branch, production controller | IN PROGRESS | Repository tree matches current Dispatch `main`; preflight next. |
| Docket-first research, validation, story selection | TODO | |
| Storyboard, critic, animatic, narration and sound | TODO | |
| Full film, gates and bounded panel | TODO | |
| Dispatch delivery and exact-head merge | TODO | |
| Docket feed, deployment and live Computer Use proof | TODO | |
| Gmail draft readback and cleanup | TODO | |

## Hard boundaries

- Run every repository command through `bash scripts/run_with_env.sh`.
- Reserve every expensive action before spending it; resume same-day state, never reset it.
- Do not publish below the current rubric or overwrite prior shipped artifacts.
- If publication cannot clear, commit a complete playable `needs_review` package.
- Never print or copy the Gemini credential. Never send email or post to social accounts.
