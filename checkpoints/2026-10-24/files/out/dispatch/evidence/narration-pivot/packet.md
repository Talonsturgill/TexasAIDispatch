# Independent narration recurrence-pivot review (edition 2026-10-24)

You are the independent Opus reviewer. Read only the files named here. You do not hear audio. Decide whether the proposed REPLACEMENT mechanism is genuinely different from the two failed ones and plausibly addresses the measured defect. You approve no film, no script and no clause boundary. Return JSON only (schema at the end).

## Locked inputs (unchanged, do not propose edits to them)
- out/dispatch/vo_script.txt (locked narration, 10 lines)
- out/dispatch/storyboard.json, narration_picture.clauses (the declared clause edges, 19 clauses; several fall mid sentence)
- scripts/vo_align.py: --clause-boundaries requires at least CLAUSE_PAUSE_S = 0.24 s of anchored measured silence at every declared mid-line clause boundary. Splicing, inserting silence, stretching and hand-shifting are banned (knowledge/craft/CREATIVE_DIRECTION.md line 162).

## Failed mechanisms (retired)
1. narration-word-clarity-authors. Failure: out/dispatch/evidence/narration-1/failure.txt (sha256 1b0e0675dfb132b9fa76872eb5fd7447e123eed67a08f8e5204b82a0c7fc1ad7). Per-line direction to articulate "authors". Result: take 2 aligns lexically but runs unpunctuated clause breaks together.
2. narration-clause-breath-breaks. Failure: out/dispatch/evidence/narration-2/failure.txt (sha256 2d83e743a274f6481058b18df12e41b129e47ddc3acf4c5683ff3760f8258638). Per-line direction text "take a clear audible breath after the word X". Result: take 3, measured in out/dispatch/evidence/narration-3/failure.txt (sha256 2440352420ecae3d45bd9a033ca5cbb0bf0e4e90091bbcb12a9e9e6d647df39a). The reader did not leave the breath at timestamped|patient, surgeon|when, suite|with, sites|and (0.0 to 0.22 s, waveform shows only 10 to 20 dB dips).
Prompts: out/dispatch/takes-2/prompt.txt and out/dispatch/takes-3/prompt.txt. Takes: out/dispatch/takes-2/take1.wav, out/dispatch/takes-3/take1.wav.

## Proposed replacement mechanism: narration-clause-line-layout
Both failures asked the reader, in prose in the preamble and per-line intents, to pause. The replacement stops asking in prose and changes how the spoken text is presented to the reader: inside the fence, each declared narration clause (storyboard narration_picture.clauses, in order) starts on its own line. The words, their order and the vo_script.txt bytes are unchanged (the code refuses unless the clause texts joined equal the script words exactly). A one-paragraph layout note tells the reader each line is its own spoken phrase with a short natural breath between lines, and lines inside one sentence still read as that sentence. Implemented in scripts/vo_synth_gemini.py build_prompt behind vo_direction.json "clause_layout": true (diff: `git diff scripts/vo_synth_gemini.py`). The per-line "take a clear audible breath after X" sentences are removed from the intents so the prose request is no longer the mechanism. A built prompt example is in out/dispatch/evidence/narration-pivot/prompt-preview.txt.

Visible difference: the fenced text the reader receives changes from 10 paragraph lines to 19 clause lines, and the prose pause request is replaced by structural line breaks. Expected result: measured silence at each declared clause boundary, so vo_align derives captions and clause windows from the audio with no edit.

Source basis: the board's own declared clauses (storyboard.json narration_picture.clauses) and the measured failure evidence above.

## Questions
1. Is this a genuine mechanism change rather than a rename or rewording of the retired prose instruction? 2. Any reason it could break the locked script, the soundcheck, claims or the renderer? 3. Is it plausible, given the evidence, to produce the measured silence? Be strict. PASS only if 1 is yes and 2 has no blocker.

## Return exactly this JSON
{"verdict":"pass"|"revise","reviewer_identity":"<your identity>","retired_mechanism_id":"narration-clause-breath-breaks","replacement_mechanism_id":"narration-clause-line-layout","reviewed_failure_sha256":["1b0e0675dfb132b9fa76872eb5fd7447e123eed67a08f8e5204b82a0c7fc1ad7","2d83e743a274f6481058b18df12e41b129e47ddc3acf4c5683ff3760f8258638","2440352420ecae3d45bd9a033ca5cbb0bf0e4e90091bbcb12a9e9e6d647df39a"],"visible_difference":"<at least 40 characters>","source_basis":"<at least 30 characters>","findings":["..."]}
