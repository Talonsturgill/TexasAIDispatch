# Take 5 on the authorized runtime board, exact gate findings (2026-10-16)
Authorized board: runtime_s 56.16 (repair-plan-runtime1, reboard 4). Measured retime passed, remix at cut 61.16 (-16.02 LUFS, time_stretch 1.0, offset 0.30), align 13 cues all boundaries measured, fold and retime stable on the second pass (0 scenes moved). modern_film rc 0.
Passing: storyboard_check, shot_coherence, staging, board_scale, floor, script_evidence, super_evidence, place_check.
Failing, unchanged from the failure logs in cheap2.log:
1. caption_board_fit: caption c1 would exceed the lower two-line band. Long measured cues: c1 119 chars/6.48 s, c2 96/5.36, c7 89/4.96, c9 105/6.24, c10 118/6.12. Take 5 offers no measured pause of 0.24 s inside them, so clause segmentation cannot split them. Phase 03 says to direct natural clause pauses (or shorten the script) and synthesize a charged take.
2. documentary_check and watchability_check: hook payoff s1-event-1 ends 1.57 s against 1.5 s (first word at 0.58 s); s3-event-2 1.2961 s, s3-event-3 1.2421 s and s7-event-1 1.3294 s against the 1.2 s maximum. These are derived from authored clause_fraction widths times the measured clause lengths.
Counters: tts_calls 10 of 12 (one take plus soundcheck left), validator_agents 3 of 3, critics 9 of 12.
