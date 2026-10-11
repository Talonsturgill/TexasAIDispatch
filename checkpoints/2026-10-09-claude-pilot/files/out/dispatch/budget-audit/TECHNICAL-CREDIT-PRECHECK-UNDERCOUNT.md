Independent critic 26 (same Opus High worker, precharged, 26 of 27 critics) classified R1 rights (missing CC BY music attribution on the closing card) and T1 technical_audio (sfx dur_s record omission) with technical_repair.findings, verbatim in technical-integrity-report-26.json. Plan repair-plan-15-technical-credit.json (technical-integrity scope, before-files = the registered old board 65b926ba and old sfx, failure evidence = that report) is written but NOT begun, NOT granted and NOT charged; the live board and sfx are the registered old bytes, the candidates are retained.

production-budget on the plan (retained as production-budget-technical-credit.log): feasible false, path finish-current, deficit {"preflight_renders": 2}; preflight_renders 21 of 21 used, required 2; storyboard_critics 26 of 27 used, required 0; full_renders 2 of 14, required 1.

Actual remaining capture footprint after the correction, counting both the hook precharge and the helper's own reservation for each capture, plus the review that the changed board forces:
- fresh timed animatic: hook precharge 1 + preflight_animatic internal reservation 1 = 2 preflight units
- fresh independent timed phone review of that animatic: 1 storyboard_critic (26 of 27 used, 1 left, but the precheck reports 0 required)
- native hero proof on the changed board: hook precharge 1 + cinema_proof internal reservation 1 (0 if every sample is cached) = 1 to 2 preflight units
- full render: hook precharge 1 + render_dispatch internal 1 = 2 full_renders (2 of 14 used, plenty)
Total real need: 3 to 4 preflight units and 1 critic; the precheck requires 2 preflight and 0 critics, so it undercounts the capture footprint of this correction by 1 to 2 preflight units and omits the forced fresh phone review.

Not granted on purpose: completion-capacity records one grant per failed-attempt identity ("this failed attempt already owns completion capacity" on every later try), so granting the undercounted 2 now would block recording the true remainder. Needed from source planning: for a technical-integrity correction that changes the board, count the fresh timed animatic (hook plus helper), the forced independent timed phone review, the hero proof (hook plus helper) and the full-render hook, then grant that exact deficit once.
