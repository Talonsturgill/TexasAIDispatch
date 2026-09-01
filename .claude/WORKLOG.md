# September 1st, 2026 production run

## Owner directive

"okay lets test, run the FULL automation end to end. and i mean full."

## Measured starting point

- Run date: September 1st, 2026 in America/New_York.
- Dispatch started clean at `origin/main` merge `b8dae4f`.
- Daily branch: `claude/dispatch-2026-09-01`.
- The prior August 30th dry-run scratch package was preserved under
  `out/archive/2026-08-30-dry-run-before-2026-09-01-production/`.
- Production controller `2026-09-01` is active in production mode.
- Local Docket checkout is clean but six commits behind current `origin/main`; it must be
  fast-forwarded from the remote before the feed lane begins.

## Waves

| Wave | Status | Evidence |
| --- | --- | --- |
| Wake, instructions, toolchain, production controller | DONE | All environment, registry, wiring, type and composition checks green. The helper now normalizes stale `bash -lc` triggers so they retain the repository toolchain. |
| Docket-first research, validation, story selection | DONE | Selected Docket record `tx-2026-0090`; three official sources re-fetched; claims `c1` through `c9` verified; four overclaims rejected before script lock. |
| Storyboard, critique, animatic, narration, sound | DONE | Ten-scene alloy-coupon throughline; three reviewed animatics including the final timed board; Gemini take 1 chosen from two full reads; 56.5-second mix with 14 visible-action foley events and the licensed project-original Texas bed. |
| Authored film, render, deterministic gates, panel | IN PROGRESS | Bespoke `alloy-loop-v1` episode and six materials-lab foley cues are authored. Gate 0, evidence, alignment, flow, music-package, generated-media, engine, scale and floor checks are green. Full-resolution render is next. |
| Dispatch delivery PR and merge | TODO | |
| Docket feed PR, merge, live proof | TODO | |
| Gmail draft artifact and draft creation | TODO | |
| Retrospective and cleanup | TODO | |

## Constraints

- Production mode only. A render is not completion.
- Every Dispatch command runs through `bash scripts/run_with_env.sh`.
- Never expose the Gemini credential.
- Never send email. Create a draft only.
- Never overwrite shipped run artifacts.
- If publication does not clear, preserve a complete playable `needs_review` package.

## Recorded degradation

- This run was executed in a single agent lane. The three research lenses, validator,
  storyboard critic, voice director and final flow review were therefore performed serially
  with separate briefs and artifacts rather than delegated to concurrent agents. Controller
  limits and all independent product gates remain enforced; the final panel will use three
  separately scored lenses and preserve each JSON verdict.
