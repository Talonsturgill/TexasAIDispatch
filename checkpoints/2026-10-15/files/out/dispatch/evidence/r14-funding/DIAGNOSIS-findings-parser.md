# Read-only diagnosis: why completion-capacity refuses the genuine provider phone verdict (2026-10-17)

No grant, count, report, plan, capture or spend was changed. Reproduced by importing the owning functions (no state write).

## Evidence hashes
- provider phone report (verified, PR190 child recovery): out/dispatch/provider-phone-report-r14-recovery.json sha256 6c6bc249d3f348001ad118276af4122c3d5dfe649a04a74231c61c2af3faf305
- canonical selection from the same call: out/dispatch/openings/selection.json sha256 10708194ab3ae60683a48bf616ebc7d78e8773125fe99b727ead708c550dd5ea (its denied use as plan evidence is NOT retried)
- plan refused: out/dispatch/evidence/r14-funding/finish-current-plan-r14-verdict.json sha256 d06990cc1ed0fea5e7ee9b6b9f8b5e7f0942f2f55d90e57356067df10a33c395 (failure_evidence = the report above, failure_evidence_sha256 6c6bc249...)
- no-plan budgets: budget-noplan-{host,provider}.json and budget-noplan-after-grant-*.json (deficit preflight_renders 1)

## Provider phone report: fields and scope
Top level: film_sha256, board_sha256, verdict "pass", notes, strongest_frame, weakest_frame, blocking_defects [] , story_review{verdict pass, blocking_defects [], one_viewing_summary, opening_to_ending, weakest_transition, story_sha256, policy_sha256, claims_sha256}, action_reviews[6], phone_observations{7 criteria, all pass true with start_s/end_s/observed}, narration_picture_observations[15], modern_observations{film_sha256 plus 7 pass true}, retained_findings_review[1] (original finding "Partial review due to host transport [media removed: request limit]", status resolved_by_full_context), bounded_release, review_context_sha256, reviewer_identity gemini, reviewed_at, concept/renderer/quality_contract sha256, review_scope, reviewed_preflight_sha256 (a.mp4 21b078b2...), provider_evidence{schema, role "phone", model, request_id, bindings, host_failure, input/prompt/response hashes, availability_recovery, prompt, input, response}.
bounded_release: {schema "dispatch_creative_assessment/1", scope "phone", retained_checks{source, rights, legibility, comprehension each pass true with observed text}, defects []}. No score_only key.

## The assessment problem (scripts/creative_release.py findings(), lines ~140-165)
1. Ordinary collections are empty and every phone observation passes, so found = {}.
2. Because found is empty and 'bounded_release' is present, the "sole embedded finding collection" branch runs.
3. rows = [] and assessment.get('score_only') is not True, so the empty-score-only shortcut doesn't apply.
4. The guard raises: assessment.scope != 'panel' (here 'phone') and provider_evidence.role not in (picture, story, sound) (here 'phone'): ValueError "sole embedded findings require verified independent panel provider evidence".
5. A later check would also raise "sole embedded finding collection must be nonempty" for rows []. Both conditions fail a verified phone-scope, empty-defects, passing report.
Reproduced read-only: findings(report) raises that ValueError; autonomous_completion.mandatory_reason(state, plan, evidence_text) catches ValueError and returns None.

## Producer command and original refusal
Command: python scripts/run_controller.py completion-capacity --repair-plan out/dispatch/evidence/r14-funding/finish-current-plan-r14-verdict.json (wrapped with scripts/run_with_env.sh and an explicit cd), exit 1.
Output (completion-capacity-verdict.log): "completion capacity requires exact independent mandatory evidence; optional polish and research are excluded"
Preceding production-budget on the same plan (host and provider): feasible false, deficits {preflight_renders: 1}, path finish-current, errors [].

## Held until a reviewed fix lands
completion-capacity for the one-preflight deficit, the timed phone (capture_guard authorization, headroom 20 GiB), native hero and full render, 3 audiovisual lenses, 3 separate scorers, delivery, the unsent draft, shipped and archive. PR189 stays held.
