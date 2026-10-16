# Script trim before voice (2026-10-16)
The independently validated narration (validator pass 3, PASS) had 10 sentences and 168 whitespace words. Prior editions read about 2.57
words per second (113 words, 44.0 s), so it projected to about 65 s against the 62 s format ceiling in config/run_limits.json.
Action: deleted sentence s7 verbatim ("The parts for one prototype station cost roughly one hundred fifty to two hundred twenty dollars.").
No other word changed, no new wording, no new claim, and no qualifier was removed. Claims c1 to c20 and the PASS validation object are untouched
(c8 is simply unused in speech). Ids s1 to s6, s8, s9, s10 keep their validated meaning. Validated copies: validated-vo_script-10-sentences.txt
and validated-vo_bindings-10-sentences.json. The owner should know the spoken script now has 9 sentences. If the measured read still exceeds the
ceiling, more whole validated sentences are deleted, never reworded.

## Binding extension (2026-10-16)
script_evidence_check (planning mode) refused scene s8: the narration word "Deployment" appears in no quote of c1 or c10. The sentence is unchanged.
Binding s10 now cites c9 and c10. c9 is a validator-VERIFIED claim whose quote contains "suitable for deployment by small coastal municipalities,
homeowners' associations, agricultural operations and industrial sites". This adds support and removes none. The validator reviewed s10 against c10 only.
The owner should know the s10 binding differs from the reviewed one.
