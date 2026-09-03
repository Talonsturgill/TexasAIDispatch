# September 3rd, 2026 production run

## Current owner directive and checkpoint

"run the video pipeline end-end all the way through so we can see ur best output, and also turn this into a daily task that you run"

- Fresh branch `claude/dispatch-2026-09-03` from `origin/main` at `6d0a540471c7`.
- The September 1st run below is historical and fully shipped. Its completed scratch is preserved at `out/archive/2026-09-01-production-complete/`.
- Current controller: `out/dispatch/run_state.json`, production run `2026-09-03`.
- Environment, engine, staging, composition, wiring and TypeScript preflight passed.
- Three independent reserved researchers completed road, clinic and water reports. Selected the fresh Ralls irrigation field day. Independent semantic audit PASS, with no fabricated savings or autonomous nozzle-control claims.
- Bespoke eight-scene irrigation film authored and wired through the registry. Critic corrections removed a repeated card, retained the sensor and advice object, and made the limitation a scoped question. First animatic rendered, motion/hook passed and contact sheet inspected. Caption-area and contrast corrections batched before final timing.
- VO direction is locked, with Ralls pronunciation verified in the Texas Almanac. Two complete Gemini takes passed soundcheck after repairing ordinal normalization with wrong-date regression tests; take 2 was selected. The final mix is 43.2 seconds, unchanged speed, with eight motivated sounds and no music bed.
- Found and repaired a production timing defect: proportional assignment attached the wrong script words to real pauses. Pinned whisper.cpp DTW now identifies each word's speech run, while actual waveform silence still supplies cue edges. Eleven correct cues, all eight line starts anchored, and stable picture/foley retime verified. Preship and delivery independently recompute acoustic evidence; stale or mismatched inputs fail closed. External model cache is in the wrapper `.models/whisper/`, no credential involved.
- The first full-resolution film rendered at 1080 by 1920, 48.7 seconds including credits. Computer Use playback reached the credits with decoded video and no playback error. The three independent panel scores averaged 6.915 and did not clear publication. Hook and craft drove the corrective pass; no hard failure was established.
- First-panel fixes bring the sensor into the opening feed-safe composition, reduce long headings, separate human feet from the pivot tires, and direct both gestures toward equipment. A waveform inspection also confirmed a quiet final consonant lost at the speech-core threshold. Two-threshold speech-edge hysteresis repairs it without hand timing. Positive and negative regressions pass, and all 32 threshold mutations are caught. The fourth reserved animatic verifies the final feed-safe framing before the second full render. All current 13 preship gates pass.
- The second panel averaged 7.282 but one reviewer found a 5.10-second static credit hold. Corrective reboard 3 changed only credits_s to 5.0. The fifth animatic and third full-resolution render are 48.2 seconds. Final film SHA256 is 6144297b0f4cc1c645530b0de67e0a3f45f968503f1c24c69577ca7dd3483e51. Browser playback reached the sourced ending with no error; independent end analysis measured a 4.60-second static interval. Panel 3 averages 7.282, all three judges say ship, no hard failures. No further creative edits.
- Phone export completed at 720 by 1280 and 8,218,013 bytes, versus 24,106,836 bytes for the master. The standalone FFmpeg selection is tested against the real missing-dylib failure of Remotion's private binary.
- Delivery verification found a real ordering deadlock: verify-only called closed-run check-package before the required finish step. Added read-only check-verification without weakening check-delivery. Passing open candidates remain open and unable to publish; missing/below-bar/hard-fail reports, changed media, and review-only rescues are rejected. Closed runs still require their exact approved report. Controller self-tests pass and the complete delivery gates are rerunning before finish.
- Dispatch release, isolated Docket feed/deployment/live Computer Use and unsent Gmail verification remain to do. No production release claim yet.
- The Docket checkout now contains unrelated dirty water work. Use an isolated checkout for feed publication; do not follow the historical clean-checkout instruction below.
- Daily heartbeat `texas-ai-dispatch-daily` is ACTIVE at 7 a.m. Eastern. It reads the master routine and resumes the day's run. Local execution requires the Mac and Codex app running.
- Every expensive action must be reserved first. Every Dispatch command uses `bash scripts/run_with_env.sh`. Never expose credentials or send email. A passing panel is not delivery.

---

## Historical September 1st checkpoint (subsequently completed and published)

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
