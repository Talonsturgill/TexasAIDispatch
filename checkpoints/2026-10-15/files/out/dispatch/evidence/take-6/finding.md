# Take 6 outcome (2026-10-16), repair 5 caption-boundary-silent-beats
Direction: v3 (45ce7b56), authorized under narration-performance repair 5, pivot review review-repair5-v3-pass. One take plus soundcheck, tts_calls 12 of ceiling 12 now.
Producer statuses: vo_synth 0 (57.88 s, -17.2 LUFS, spread 6.91 st), vo_soundcheck 0 (chose take1, accuracy 0.979, cut 60.0).
Alignment in a no-charge copy (sim-take6, mix cut 65.0, offset 0.30): vo_align exit 1, "ASR does not reconcile with the locked script: - training + troning". Gemini's own transcript of the take also reads "after troning" and "that is installed one". So the narrator said troning, it is not a whisper-only miss. Everything else reconciled in the log.
Likely cause, unverified: L7 energy named the spoken word training as a beat anchor ("another after training"), a lexical-leak or distortion risk the reviewer flagged as acceptable because soundcheck would catch it.
No ASR override, alias, splice or timing edit was made. The take, its transcript, the sim mix and the align log are retained. The real board, mix and captions are unchanged (still take 5 on the runtime1 board).
