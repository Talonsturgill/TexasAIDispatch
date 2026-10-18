# R15h remaining path, step to reservation (read from the real ledger after reservation event 469)
Ledger counts (usage / ceiling / remaining): storyboard_critics 45/47/2, preflight_renders 45/53/8, full_renders 4/14/10, audiovisual_reviews 17/43/26, panel_rounds 1/9/8, scorer_calls 3/27/24, tts_calls 14/16/2, reboards 14/14/0 (reboard 464 already charged and open, plan sha 51b2f8fd).
Spent and retained: grant 461 (original), repair_started 462, reboard 464, grant 465 (forecast floor, one-time, not rerun), critic 44 pivot+code (event 467), critic 45 prepaid second code check (event 469, SENT to critic 44 as continuation, not recharged).
| Step | Reservation | Count |
|---|---|---|
| authorize-repair on open plan (after pivot PASS, code PASS) | none, reboard 464 | 0 |
| opening_compare hook and entry (renew A and B) | preflight_renders | 2 |
| comparison phone sequences A and B | preflight_renders | 2 |
| comparison critic (silent two-treatment) | storyboard_critics | 1 (unreserved) |
| final timed phone preview + current sequence | preflight_renders | 2 (1 timed phone + 1 sequence) |
| final timed phone critic | storyboard_critics | 1 (unreserved) |
| native hero proof | preflight_renders | 1 |
| final exact-film motion extraction | preflight_renders | 1 |
| preflight total | | 8 of 8 remaining |
| full native render (PNG/CRF16) | full_renders | 1 of 10 (2 conservative) |
| hero + three AV lenses + provider recovery | audiovisual_reviews | up to 11 of 26 |
| fresh atomic panel, three separate scorers | panel_rounds 1, scorer_calls 3 | 1 of 8, 3 of 24 |
| TTS | none (no new narration), 2 held in reserve | 0 |
Verified: production-budget (no plan, supported current phase) feasible, no deficits, evidence production-budget-current-phase-after-code45.json (host) and -provider.json. The forecast-reconciliation plan shows a false deficit of 1-2 critics because its 8/4/2 floor is one-time and critics 44 and 45 were spent after grant 465. Refusals preserved: completion-capacity-forecast-2.log, completion-capacity-authorize-plan.log, production-budget-complete-v2-before.json. No new grant requested, no new reboard batch.
Remaining AV/panel/scorer/audio requirements unchanged: hero review, three exact-byte AV lenses, caption alignment on final mix, loudness and true peak, music credit end card, three genuine probe-first scorers with complete guides, delivery gates.
