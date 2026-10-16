# Budget diagnostics preserved at the provider ReadTimeout hold (2026-10-16), no grant or evidence altered

Command for every file (wrapped, explicit cd): `python scripts/run_controller.py production-budget --review-route {host|provider} --repair-plan <plan>`.
- plan-enriched-actually-used.json is the plan actually used for the single audited grant and the repair (comparison-enriched, renewed-two-treatment-complete-path minimums, created with capture_completion_budget.py --comparison on the preserved retained package). Its minimums still count the opening comparison and the later captures as if none were spent: preflight 5, critics 4.
- plan-finish-only-r13b.json is the finish-current plan bound to report 24, without a comparison. It is the diagnostic for the actual remaining cut (comparison and both option extractions already done and charged).
Results at ledger state ledger-now.json (preflight_renders 24 of 25, storyboard_critics 27 of 29, audiovisual_reviews 6 of 43):
- enriched, host and provider: infeasible, deficits preflight_renders 4, storyboard_critics 2.
- finish-only, host: infeasible, deficit preflight_renders 1 (critics fit). finish-only, provider: infeasible, deficit preflight_renders 1.
The original provider timeout evidence: provider-compare.log, provider-cache-attempt.json, evidence/r14-phone-transport/PROVIDER-TIMEOUT.md and provider-attempt-1 (request.json, ledger events 261 to 264). The consumed comparison-enriched minimum is retained as is; no grant was requested from either plan after the ReadTimeout.
