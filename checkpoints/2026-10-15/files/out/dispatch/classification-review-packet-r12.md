# Independent technical classification and review of the R12 measured scene-split correction (charged, precharged before dispatch)

You are the same independent read-only Opus High storyboard-critic that wrote the R8, R9 and R10 reports and the full-coverage code review, continuing with your context (a charged same-worker continuation). Keep your context and don't re-read files you already read in full unless one is listed below with a NEW hash. Read every listed file in full yourself, one at a time (large JSON in ranges until complete). Run nothing, launch no subagents, listen to no audio, and do not claim to. Return ONE JSON object plus a one-line note. Your reservation is storyboard_critics 22 of effective ceiling 22 on the controller ledger, made by the director before this dispatch. You can't verify that, so say so plainly. Every hash below is computed by the director with sha256sum. You compute none.

What happened. Take 7 (57.48 s file, one continuous synthesis) passed its verbatim soundcheck. Strict forced alignment then failed on the spoken figure, because the narrator breathes inside "ninety eight point eight two percent" and the segmenter split one recognized token into five voiced runs. The director fixed that in the aligner (merged, PR 187) and the real take 7 now aligns with all 132 words and 16 measured cues. The script (sha256 67d7ae453299483c5539290989560cdffa5ce4c6ad75fdfaef5929793d7feadf) and the claims are UNCHANGED from the validated and independently passed bytes. Narration, source limits and attributions are not under review here.

The measured read then exposed three current failures on the accepted board bytes (storyboard-before.json, authored runtime 54.1 s):
- F1. board_retime refuses: the measured read needs 57.90 s for 9 scenes at the 2.4 s floor and the film is 54.10 s.
- F2. board_captions fails: cues c15 and c16 end at 54.8 and 57.36 s, past the film's own 54.10 s runtime.
- F3. Even with the runtime set to the measured read plus the authored 2.0 s closing hold (the director's diagnostic copy, 59.5 s, using the real take 7 words), scene s7 retimes to 11.3 s, past the 9.5 s scene ceiling that nothing earns its way past (failure/storyboard_check-old-structure-at-59.5.txt). Sentences 11 to 13 (clauses n7a, n7b, n7c) are 10.6 s of speech with breaths around the figure, against 8.76 s projected from takes 5 and 6.

The director built an immutable R12 correction, frozen under proposal-r12 and listed by MANIFEST.sha256.json. It is NOT applied to production. It does exactly this:
1. runtime_s 54.1 to 59.4 (measured speech end 57.36 s plus the 2.0 s hold, rounded up to 0.1 s).
2. Clause n7c "The announcement reports no field result." and its stamp shot move from scene s7 to the front of scene s8, as clause n8a with event s8-event-0 and the no-field-card view. The old n8a becomes n8b. Scene s7 keeps sentences 11 and 12 and gains a third event, s7-event-3, where the blank field result card slides in at the edge during the figure sentence (the director's way to keep the 3 event minimum for a directed scene). Scene s8 keeps its map events. New item ids s8-valcard, s8-valbar, s8-assess, s8-card2 and s8-blank carry the two-card shot, and the scene s8 disclosure becomes "Illustration. Not a real report or map".
3. FloodStationFilm.tsx and the registry change as in the two diffs. The renderer follows the board it is given, so the retained treatment B board (unchanged, not used further, treatment A was selected in the accepted comparison) still resolves its old s7 ids.
4. Timing is the MEASURED output of the real pipeline on the retained take 7 words (vo_align with --cuts and --clause-boundaries, board_captions, board_retime), run on a scratch copy of the repo that holds the proposed renderer and registry bytes. A second full pass was byte identical (0 scenes moved). All 14 free picture gates pass on it (precheck report.json). Those gates approve nothing.

Decide five things honestly.
1. The three current findings. Write them as blocking_defects, exactly three objects (F1, F2, F3), each with id, classification, criterion, problem and fix, true to the failure texts. Judge whether each is a real release blocker.
2. Classification. Copy each blocking_defects object UNCHANGED, byte for byte, into technical_repair.findings as {"finding": <that exact object>, "category": <one of source, rights, legibility, layout, technical_audio, captions, runtime>}, one row per finding, and give technical_repair.basis. Only classify a finding technical if it really is one (measured runtime, caption timing against runtime and a hard scene ceiling). If any finding is really creative, say so and classify honestly, including by refusing to put it in a technical category.
3. The correction. Does the R12 bytes fix F1 to F3 without breaking another limit? Cover: sentence to picture match for every clause in the moved region (does "The announcement reports no field result." now sit over the stamped blank field result card, does the figure keep its on-device TinyML chip AI and early validation attribution in s7, does "It names no town with an installed station." keep the map), the new s7-event-3 slide-in (is it honest and motivated and does it hurt the figure shot), event widths, the 5.0 s shot ceiling, reward and gap timing, the s8 disclosure, scene s7 and s8 plane and item bindings, and anything the renderer can't draw as the board says. Say which parts of FloodStationFilm.tsx you read in full (it is short enough to read all of it).
4. Source and validation. State whether any sentence or claim wording changed (it did not) and so whether a fresh source validation is required.
5. Recurrence. These failures are in a new family (measured runtime crowding of one scene) and need a new mechanism (the scene is split at a measured clause boundary rather than stretching a scene or silencing breaths). Say whether it is a genuinely different mechanism from the five earlier failed narration mechanisms, and whether any earlier repair family applies.

Output keys, exactly:
- verdict ("revise" for the CURRENT accepted board bytes, which fail F1 to F3), reviewer_identity (your model and role, and what you could not verify).
- blocking_defects (the three objects), technical_repair {findings, basis}.
- observations.
- proposal_assessment {fixes_F1, fixes_F2, fixes_F3, remaining_blockers, per_clause_picture_match, new_event_assessment, shot_and_event_arithmetic (yours), disclosure, notes}.
- code_assessment {renderer_before_sha256, renderer_after_sha256 "b8f8cc3b38a12749016215ec65da64ed8d78fde4c8a8353d16166b19cc879ca0", views_checked, unsupported, parts_read_in_full}.
- source_pivot {requires_validation (false if no wording changed), script_sha256 "67d7ae453299483c5539290989560cdffa5ce4c6ad75fdfaef5929793d7feadf", claim_ids}.
- recurrence {met, new_mechanism_is_different, assessment}.
- reasoning, concerns, files_read_in_full (with the hash you were given for each).

Your response authorizes only a registered technical-integrity correction. It approves no take, caption, picture, film, score or shipment, and the exact applied bytes still need their own independent code review, timed phone review, native and final reviews.

Files (read all, in this order):
- /home/user/ed1015/TexasAIDispatch/out/dispatch/evidence/proposal-r12/failure/board_captions-at-54.1.txt 5ca51cb3e8834ae7eba2de35db9830d01f0d7f5ea37225e7b882a735b1e0b448
- /home/user/ed1015/TexasAIDispatch/out/dispatch/evidence/proposal-r12/failure/board_retime-at-54.1.txt 2dc6b5236f4e5d57ba56b676231535b82299f8501cad65d28eefe45373b4cac9
- /home/user/ed1015/TexasAIDispatch/out/dispatch/evidence/proposal-r12/failure/storyboard_check-old-structure-at-59.5.txt 9079a5dc4073afc92990cd55a4a9d3d139adcd85d5aa16cff2d125f84b905280
- /home/user/ed1015/TexasAIDispatch/out/dispatch/evidence/proposal-r12/diff-before-to-r12.md 3867dee06d087631b20a304b922c79eb86c164474efcc83f6ae3cc8344ec1932
- /home/user/ed1015/TexasAIDispatch/out/dispatch/evidence/proposal-r12/FloodStationFilm.diff 2b6b08fb48806fce89f7444e6b6daaef4c68520ee32bfc118b52336ae9836288
- /home/user/ed1015/TexasAIDispatch/out/dispatch/evidence/proposal-r12/modern_episode_registry.diff b7e4c839a03d6e17f9b74a6fdff0f7e42fb0e149d4e0f2497bd58aab73dbbab2
- /home/user/ed1015/TexasAIDispatch/out/dispatch/evidence/proposal-r12/build_split.py 40b0a62c893fecf78429ad3b19c378105f6abc76736d3f1b08f60b3def103f82
- /home/user/ed1015/TexasAIDispatch/out/dispatch/evidence/proposal-r12/stamp_renderer.py 701843b4cf4df09e29aa39314359222241f849e465cc9be204a986fd7a515ea9
- /home/user/ed1015/TexasAIDispatch/out/dispatch/evidence/proposal-r12/storyboard-before.json 25e8ae1d03bc65223717efae65454c61d711a9306b68b9327cc5ca5d5a7ff720
- /home/user/ed1015/TexasAIDispatch/out/dispatch/evidence/proposal-r12/storyboard-a-measured-diagnostic.json 4a8c8364f11ef2ca595a9ea5b8c0ca15fd1a05272bf9ff56c15ca5bf6e07392a
- /home/user/ed1015/TexasAIDispatch/out/dispatch/evidence/proposal-r12/FloodStationFilm.tsx b8f8cc3b38a12749016215ec65da64ed8d78fde4c8a8353d16166b19cc879ca0
- /home/user/ed1015/TexasAIDispatch/out/dispatch/evidence/proposal-r12/words-r12-diagnostic.json 99dd69cda7ffd247b568644719d02e56080752a48fcb8d717e39f57555623378
- /home/user/ed1015/TexasAIDispatch/out/dispatch/evidence/proposal-r12/captions-r12-diagnostic.json a6b0e45a7a95340f5f264c625fe6aab281a34b66c292fa9174445d03fbb4ed86
- /home/user/ed1015/TexasAIDispatch/out/dispatch/evidence/proposal-r12/precheck-r12-diagnostic/087e6006-e620-4fd2-a932-a1ad0e531641/report.json 76e3f1f894e3f16ae219d8ba4f31fd17776b65ef91026c5172fb9ac88dc5db8c
- /home/user/ed1015/TexasAIDispatch/out/dispatch/vo_script.txt 67d7ae453299483c5539290989560cdffa5ce4c6ad75fdfaef5929793d7feadf
- /home/user/ed1015/TexasAIDispatch/out/dispatch/claims.json 49b2379c63534c1685c5fcd480bbf0aa8cadee104811bfe9abb29cbb14f6438e
- /home/user/ed1015/TexasAIDispatch/out/dispatch/sources/utsa.txt 9ec493983d1b4b41a043b5eb934563ca37c64e1f98a2bb88bca90a8e49b551c9
- /home/user/ed1015/TexasAIDispatch/out/dispatch/evidence/take-7/takes-7/takes.json 0a78e394a75e2b16b7e44d6fa7765380de20cd5632f97272cdfd0c7eb5b1cc64
- /home/user/ed1015/TexasAIDispatch/out/dispatch/evidence/take-7/soundcheck-7.log de2d674a0e99fe3516da76ee7add65f16a477ca497ee3ed07255eab59bbb4511
- /home/user/ed1015/TexasAIDispatch/out/dispatch/evidence/proposal-r12/MANIFEST.sha256.json 7e19f5caa39200d65762e1879ff30c08c7fc9bee9c03e27cf831016301761714
