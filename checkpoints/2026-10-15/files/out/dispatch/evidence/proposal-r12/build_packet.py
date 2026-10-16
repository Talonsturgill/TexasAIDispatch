"""Freeze the R12 manifest and write the technical-integrity classification and proposal review packet. Run from the checkout root."""
import hashlib, json, os, stat
R = '/home/user/ed1015/TexasAIDispatch/'
P = R + 'out/dispatch/evidence/proposal-r12/'
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
names = ['build_split.py', 'stamp_renderer.py', 'dryrun.sh', 'storyboard-before.json', 'storyboard-a.json', 'storyboard-a-stamped.json',
         'storyboard-a-measured-diagnostic.json', 'words-r12-diagnostic.json', 'captions-r12-diagnostic.json', 'sfx_events-r12-diagnostic.json',
         'FloodStationFilm.tsx', 'FloodStationFilm.diff', 'modern_episode_registry.json', 'modern_episode_registry.diff', 'diff-before-to-r12.md',
         'failure/board_captions-at-54.1.txt', 'failure/board_retime-at-54.1.txt', 'failure/storyboard_check-old-structure-at-59.5.txt',
         'precheck-r12-diagnostic/' + os.listdir(P + 'precheck-r12-diagnostic')[0] + '/report.json']
m = {n: sha(P + n) for n in names}
json.dump(m, open(P + 'MANIFEST.sha256.json', 'w'), indent=2)
for n in names + ['MANIFEST.sha256.json']:
    os.chmod(P + n, os.stat(P + n).st_mode & ~(stat.S_IWUSR | stat.S_IWGRP | stat.S_IWOTH))
D = R + 'out/dispatch/'
script = D + 'vo_script.txt'
files = [P + 'failure/board_captions-at-54.1.txt', P + 'failure/board_retime-at-54.1.txt', P + 'failure/storyboard_check-old-structure-at-59.5.txt',
         P + 'diff-before-to-r12.md', P + 'FloodStationFilm.diff', P + 'modern_episode_registry.diff', P + 'build_split.py', P + 'stamp_renderer.py',
         P + 'storyboard-before.json', P + 'storyboard-a-measured-diagnostic.json', P + 'FloodStationFilm.tsx', P + 'words-r12-diagnostic.json',
         P + 'captions-r12-diagnostic.json', P + 'precheck-r12-diagnostic/' + os.listdir(P + 'precheck-r12-diagnostic')[0] + '/report.json',
         script, D + 'claims.json', D + 'sources/utsa.txt', D + 'evidence/take-7/takes-7/takes.json', D + 'evidence/take-7/soundcheck-7.log',
         P + 'MANIFEST.sha256.json']
text = f"""# Independent technical classification and review of the R12 measured scene-split correction (charged, precharged before dispatch)

You are the same independent read-only Opus High storyboard-critic that wrote the R8, R9 and R10 reports and the full-coverage code review, continuing with your context (a charged same-worker continuation). Keep your context and don't re-read files you already read in full unless one is listed below with a NEW hash. Read every listed file in full yourself, one at a time (large JSON in ranges until complete). Run nothing, launch no subagents, listen to no audio, and do not claim to. Return ONE JSON object plus a one-line note. Your reservation is storyboard_critics 22 of effective ceiling 22 on the controller ledger, made by the director before this dispatch. You can't verify that, so say so plainly. Every hash below is computed by the director with sha256sum. You compute none.

What happened. Take 7 (57.48 s file, one continuous synthesis) passed its verbatim soundcheck. Strict forced alignment then failed on the spoken figure, because the narrator breathes inside "ninety eight point eight two percent" and the segmenter split one recognized token into five voiced runs. The director fixed that in the aligner (merged, PR 187) and the real take 7 now aligns with all 132 words and 16 measured cues. The script (sha256 {sha(script)}) and the claims are UNCHANGED from the validated and independently passed bytes. Narration, source limits and attributions are not under review here.

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
2. Classification. Copy each blocking_defects object UNCHANGED, byte for byte, into technical_repair.findings as {{"finding": <that exact object>, "category": <one of source, rights, legibility, layout, technical_audio, captions, runtime>}}, one row per finding, and give technical_repair.basis. Only classify a finding technical if it really is one (measured runtime, caption timing against runtime and a hard scene ceiling). If any finding is really creative, say so and classify honestly, including by refusing to put it in a technical category.
3. The correction. Does the R12 bytes fix F1 to F3 without breaking another limit? Cover: sentence to picture match for every clause in the moved region (does "The announcement reports no field result." now sit over the stamped blank field result card, does the figure keep its on-device TinyML chip AI and early validation attribution in s7, does "It names no town with an installed station." keep the map), the new s7-event-3 slide-in (is it honest and motivated and does it hurt the figure shot), event widths, the 5.0 s shot ceiling, reward and gap timing, the s8 disclosure, scene s7 and s8 plane and item bindings, and anything the renderer can't draw as the board says. Say which parts of FloodStationFilm.tsx you read in full (it is short enough to read all of it).
4. Source and validation. State whether any sentence or claim wording changed (it did not) and so whether a fresh source validation is required.
5. Recurrence. These failures are in a new family (measured runtime crowding of one scene) and need a new mechanism (the scene is split at a measured clause boundary rather than stretching a scene or silencing breaths). Say whether it is a genuinely different mechanism from the five earlier failed narration mechanisms, and whether any earlier repair family applies.

Output keys, exactly:
- verdict ("revise" for the CURRENT accepted board bytes, which fail F1 to F3), reviewer_identity (your model and role, and what you could not verify).
- blocking_defects (the three objects), technical_repair {{findings, basis}}.
- observations.
- proposal_assessment {{fixes_F1, fixes_F2, fixes_F3, remaining_blockers, per_clause_picture_match, new_event_assessment, shot_and_event_arithmetic (yours), disclosure, notes}}.
- code_assessment {{renderer_before_sha256, renderer_after_sha256 "{sha(P + 'FloodStationFilm.tsx')}", views_checked, unsupported, parts_read_in_full}}.
- source_pivot {{requires_validation (false if no wording changed), script_sha256 "{sha(script)}", claim_ids}}.
- recurrence {{met, new_mechanism_is_different, assessment}}.
- reasoning, concerns, files_read_in_full (with the hash you were given for each).

Your response authorizes only a registered technical-integrity correction. It approves no take, caption, picture, film, score or shipment, and the exact applied bytes still need their own independent code review, timed phone review, native and final reviews.

Files (read all, in this order):
""" + ''.join(f"- {path} {sha(path)}\n" for path in files)
open(R + 'out/dispatch/classification-review-packet-r12.md', 'w').write(text)
print(len(text), sha(R + 'out/dispatch/classification-review-packet-r12.md'))
