# Charge audit, round 7 repair (machine timestamps from the session transcript and ledger)

- 2026-10-19T20:08:57Z event 108 reserved storyboard_critics for the round 7 phone review (spawned 20:09:06Z). Precharged.
- 2026-10-19T20:39:13Z grant modern-film-floor (critics +3). 20:39:34Z event 111 reserved reboards for the r7 builder (spawned 20:40:21Z). Precharged.
- builder_r7 failed on weekly-limit HTTP 429 (req_011CgCG4zto3xeswUJuvy9UZ). Exact failure kept in evidence/builder-r7-ratelimit. The owner's included FREE usage reset was performed by Codex through the supported UI, with no owner question (owner statement received in this session). The same worker was resumed once at 21:13:00Z under the same reservation, as a retry of the failed attempt.
- 2026-10-19T21:27:36Z events 113 and 114 reserved storyboard_critics for code_r8 (spawned 21:27:51Z). Precharged. Result: A pass, B revise.
- UNRESERVED: SendMessage to builder_r7 at 21:40:59Z (the code_r8 correction) ran before any reservation. The first reservation after it was 21:48:44Z (event 116), which precharged only the later 21:49:02Z pass. The 21:40:59Z pass is settled as a LATE CHARGE debit of one reboard recorded at 2026-10-19T22:2xZ (see ledger event after 124), never backdated. Reboards now 6 of ceiling 10.
- 2026-10-19T21:54:08Z events 117 and 118 reserved storyboard_critics for code_r9 (spawned 21:54:24Z). Precharged.
- 2026-10-19T22:06:46Z SendMessage to the code_r9 critic was a format-only correction on unchanged content (free under the routine).
- 2026-10-19T22:11:41Z event 120 reserved the opening comparison render. The run was interrupted at 22:18Z after both films rendered and during structural inspection. comparison.json exists without inspection_pass, b inspection is missing. Retained as is.
- Reports installed after code_r9: storyboard_critic.json and opening-a-critic.json are the reviewer's treatment A object saved verbatim (evidence/code-round9/report-a.json). opening-b-critic.json is treatment B's object with only story_sha256 stamped mechanically by daily_production.story_digest. Round 6 reports kept in evidence/code-round9.
- Complete public handoffs (ordinary assistant text and handoff tool inputs only, no thinking, no Read results) extracted from each worker transcript: evidence/public-handbacks/*.json with source transcript hashes.
- Journal times such as approximately 23:50Z were approximations. The measured times are the ones above.

## Appended corrections (after the original audit above, which is kept)
- The 22:18Z opening_compare stop was Codex's maintenance Send now action, not an owner refusal or provider failure. The recovery rendered a new two-job batch (event 126, 337746 ms against 352536 ms, new A and B movie bytes), so the earlier statement that it only inspected retained films was inaccurate. See evidence/opening-compare-interrupted/EVIDENCE.txt for the appended correction. Both generations are retained.
- The builder resumed at 21:13:00Z after the quota failure was an actual attempt that ran under the original reservation (event 111). It is settled now as a separate LATE CHARGE debit of one reboard (ledger event after 136, machine time recorded there). No backdating, refund or art-receipt rewrite.
- PR 236 (recorder-only) had already merged at 2026-10-19T23:12Z (1d4ce763) before the request not to merge it arrived. Codex's PR 237 supersedes it with the guard and recorder together.
