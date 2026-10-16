# capture_completion_budget refusal and held fix (retained, 2026-10-16)

Command (wrapped, cwd restored checkout, main b003ab0):
python scripts/capture_completion_budget.py --state out/dispatch/run_state.json --plan out/dispatch/evidence/r8-funding/source-capacity-plan.json --comparison out/dispatch/openings/comparison.json --output out/dispatch/evidence/r8-funding/complete-source-capacity-plan.json

Output (exit 1): capture completion budget: comparison funding needs retained paid bytes and independent mandatory admission

Diagnosis: autonomous_completion.mandatory_reason returns 'mandatory-source-pivot' for the plan, but
capture_completion_budget.prepare_comparison admits only retained-integrity, minimum-action, modern-film-floor,
mandatory-code-integrity and finish-current. The comparison itself is eligible (events 25 and 27, inspection_pass true).

Director's attempted live edit of scripts/capture_completion_budget.py in the restored production checkout was DENIED by the
auto mode classifier as [Security Weaken]. Not retried. A clean clone /home/user/ed1015/fix (branch fix/source-pivot-comparison-funding-2026-10-16)
was created and left UNEDITED and unpushed. Owner (2026-10-16) will land the clean correction with a combined source-prepare to
capture-budget to controller grant regression and exact-head CI. HOLD: no production edits, paid workers, grants or retries until merged.

Successful input retained unchanged: source-capacity-plan.json (validation_completion prepare exit 0), built from source-plan.json and baseline/.
