# R8 proposal build history (honest account, written 2026-10-16 by the director)

The R8 proposal was built iteratively with `build_proposal.py` writing to fixed paths. Earlier drafts were OVERWRITTEN by later
builds, and two earlier `precheck-*` directories were DELETED by the director with `rm -rf` before rebuilding. That was a mistake:
failed check batches must be retained. The original bytes of those drafts and logs no longer exist and are NOT recreated here.
What survives is the director's transcription of what the actual tools printed in this session, below, labelled as transcription.

## Overwritten drafts (bytes lost, described from the build output)
- draft 1: 18 sentences from the r7 plan with a reduced s3 and merged s6, 158 words, runtime from a 3.2 s hold.
  Real `picture_precheck` output (transcribed): failed storyboard_check, watchability_check, documentary_check, shot_coherence,
  script_evidence, modern_film, native_sample_plan, story_art on BOTH boards. Messages seen: "scene s5: 11.3s is past the 9.5s ceiling",
  "scene s7: 9.7s is past the 9.5s ceiling", "scene s9: 5.1s is longer than 5s and its last beat lands at 1.5s",
  "modern shot has invalid timing or an overlong hold", "viewer reward gap 4.31s exceeds 4.0s",
  "scene s5: the narration names 'Rising', which appears in no quote of c6".
- draft 2 (143 words, 16 sentences, s5 two sentences, hold 2.6 s): failed watchability_check, documentary_check ("viewer reward gap 4.05s exceeds 4.0s"),
  story_art on A, and on B also storyboard_check, shot_coherence, modern_film, native_sample_plan ("modern shot has invalid timing or an overlong hold",
  caused by the merged B s7 validation-card shot of 6.78 s over the 5.0 s ceiling).
- draft 3 (hold 2.0 s, B s7 split into a close and a detail push): failed only watchability_check and documentary_check ("viewer reward gap 4.05s"),
  between s1-event-3 and s2-event-1, plus story_art in the proposal folder (no run_state.json beside the board).
- draft 4 (s1-event-3 moved later in its clause): only story_art failed in the picture_precheck, because the proposal folder has no run_state.json.
  That batch IS retained: `precheck-a/12a2133e-...` and `precheck-b/b74888dc-...`. `artverify-a` and `artverify-b` hold the scratch verify of
  authored_story_art with a copied run_state.json and claims.json, exit 0 for both boards.

## Gate rules respected
No caption, action, framing, closing, source or event gate was lowered or bypassed to make a draft pass. Fixes changed the proposal text, shot structure and timing.

## Timing is projected
Every start, end, event time, cue and runtime in these boards is a PROJECTION from measured take 5 and take 6 rates (duration-projection.json).
`timing_mode` is `authored`. Measured post-TTS retiming governs the actual film.

## From here on
Each failed or superseded batch is copied into `attempts/NN-<label>/` before any rebuild. Nothing under `precheck-*` is deleted.
