# Admission refusal for the genuine host phone REVISE (2026-10-17)
capture_completion_budget --comparison refused: "comparison funding needs retained paid bytes and independent mandatory admission".
mandatory_reason(state, plan, report) returns None for the exact report review-r15-current-timed-phone/storyboard_critic.json (sha f2dd8a81...).
Cause: scripts/autonomous_completion.py mandatory_reason requires report["film_sha256"] (line 385), but a Claude host exact-phone report binds the film as reviewed_preflight_sha256 plus modern_observations.film_sha256 (claude_runtime.phone_options report_bindings). The report has verdict revise, modern_observations.film_sha256 equal to the failed film, and failed modern observations (first_frame, performed_turn, pace, finished_art) and phone dominant_action pass=false.
Plan bound: repair-plan-r15.json (sha 3eafeaab...), failed_film_sha256 1b294576..., failure_evidence = the saved report unchanged.
Fix: owning-code change through a reviewed PR, falling back to reviewed_preflight_sha256 only for review_scope exact-muted-phone-preflight, with tests.
