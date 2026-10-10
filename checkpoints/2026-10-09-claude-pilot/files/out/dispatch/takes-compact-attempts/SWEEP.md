Silence-only compaction sweep on take 4 (take1.wav, 46.04 s), documented bounded tool compact_take.py, max retained internal silence in seconds, speech speed 1.0 for all:
- 0.3 (default): removed 6.89 s, 39.15 s. Mixed with vo-at 0.25. Retime failed on the modern timeline (the last scene stretched to the 44 s runtime) and the first reward landed at 1.64 s.
- 0.7: 43.35 s. vo_align refused, ASR heard "what" for "That" (is UTMB's own report), not reconcilable and not aliasable.
- 0.6: vo_align refused, declared clause boundary had no sufficient measured silence.
- 0.5, 0.55, 0.65: vo_align passed with 14 cues.
Chosen 0.65, the longest retained pause that aligns. The selection used the aligner and the retime gates as the test, no ASR text was edited, and no timing was typed. Also corrected: the first mix used --vo-at 0.25 on top of the take's own 0.29 s lead, doubling the hook space. The remix uses --vo-at 0.0.
