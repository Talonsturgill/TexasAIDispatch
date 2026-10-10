# Take 4 (script punctuation, repair 9): line 4 fixed, line 3 blocked by cue segmentation

Take 4 (46.0 s) failed duration by 0.24 s; compact_take.py (the documented bounded silence-only recovery) removed 6.89 s of measured dead air to 39.15 s, speech speed 1.0, soundcheck chose take1_compact (accuracy 0.991). Mix, alignment on the final mix and captions built. Reports: out/dispatch/takes/take1_compact.json.

Measured gaps now (words.json): credentials, -> and 0.28 s, citations. -> To 0.28 s, plus every sentence join (0.20 to 0.28 s).
Aligner cue output: 13 cues. Line 4 splits as wanted (c6 "The answers carry citations." | c7 "To medical literature and clinical guidelines."), so n4a|n4b now map to measured cues.
Line 3 does NOT split: c5 is the whole sentence "Clinicians sign in with their usual credentials, and ask in plain language." (75 characters, 4.0 s). vo_align.cues breaks a cue only at a sentence end or past MAX_CUE_CHARS/HARD_CUE_S, and split_at_cuts splits only at SCENE starts. The comma pause is measured but not a cue boundary.
Result: board_retime refuses again: "authored clause must equal complete measured cue text" for n3a|n3b.
No tts or critic call was spent in this step beyond take 4 (tts_calls 8 of 12).

Options (not taken without owner/maintainer say-so):
1. Text change: make line 3 two sentences, "Clinicians sign in with their usual credentials. They ask in plain language." Changes one spoken word, needs story re-review, a new take, a new comparison and phone review.
2. Narrow tooling change: let vo_align.cues split a cue at a measured silence of at least 0.24 s that coincides with an authored narration_picture clause boundary (clause text taken from the board). Same silence the aligner already measured, no timing invented. Keeps all picture, script and approvals.
