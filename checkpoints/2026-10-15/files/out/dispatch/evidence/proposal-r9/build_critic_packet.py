"""Write the consolidated recurrence and code approval packet for the R8 proposals. Run from the checkout root."""
import hashlib, json
R = '/home/user/ed1015/TexasAIDispatch/'
O = R + 'out/dispatch/evidence/proposal-r8/'
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
files = [
 'out/dispatch/evidence/review-r7-source-pivot-revise/report-verbatim.json',
 'out/dispatch/evidence/review-r7-source-pivot-revise/handback-full.txt',
 'out/dispatch/evidence/review-r6-classification-revise/report-verbatim.json',
 'out/dispatch/evidence/take-6/finding.md',
 'out/dispatch/evidence/take-6/beat-landing-measurement.md',
 'out/dispatch/evidence/take5-caption-fit-and-event-duration-findings-20261016.md',
 'out/dispatch/vo_script.txt',
 'out/dispatch/evidence/proposal-r7/vo_script.txt',
 'out/dispatch/evidence/proposal-r8/vo_script.txt',
 'out/dispatch/evidence/proposal-r8/vo_bindings.json',
 'out/dispatch/evidence/proposal-r8/vo_direction.json',
 'out/dispatch/evidence/proposal-r8/storyboard-a.json',
 'out/dispatch/evidence/proposal-r8/storyboard-b.json',
 'out/dispatch/evidence/proposal-r8/source-map.json',
 'out/dispatch/evidence/proposal-r8/source-map.md',
 'out/dispatch/evidence/proposal-r8/duration-projection.json',
 'out/dispatch/evidence/proposal-r8/sentence-fit-probe.txt',
 'out/dispatch/evidence/proposal-r8/EVIDENCE-NOTES.md',
 'out/dispatch/evidence/proposal-r8/MANIFEST.sha256.json',
 'out/dispatch/evidence/proposal-r8/build_proposal.py',
 'out/dispatch/openings/a.json',
 'out/dispatch/openings/b.json',
 'out/dispatch/claims.json',
 'out/dispatch/sources/utsa.txt',
 'knowledge/craft/VO_DIRECTION.md',
 'config/documentary.json',
 'config/modern_film.json',
 'video-engine/src/modern/episodes/2026-10-15/FloodStationFilm.tsx',
]
known = ['bdd6fdbf9aaa532b0ccfc16ab0713da70b8b7ebae5590422abc20b58e0e2e2cf',
         'c5df62a9a17ca4bdefa484469232696b8d70038dd4b0e128d81dbfa9b6feb161',
         '32c76d037256c2734e9fcb5debb94a856925a92d0a46d31e058b00decd6df6f5',
         'fcb6ae0ec7ec30eb6e56df090b99a94d9fde9dacf4ce1827d915cdc2f914375c',
         'b1c5d58dd3cdf2ccbced0a8eb10705fdc36c33496801126cb3ca2f7e8122e9fa']
text = f"""# Consolidated recurrence and code approval of the R8 proposals (charged, precharged before dispatch)

You are a NEW independent Read-only Opus High reviewer (storyboard-critic). Read every listed file in full yourself, one at a time. Run nothing, launch no subagents, listen to no audio, and do not claim to. Return ONE JSON object plus a one-line note. Your reservation is storyboard_critics 15 of 15 on the controller ledger, made by the director before this dispatch. You can't verify that, so say so plainly. Every hash below is computed by the director with sha256sum. You compute none.

Context. The prior independent report (report 14, sha256 97a412350b3c3cb4772fb5f63393c132ed4164405d2a565fdb482015e1a1cdc4) returned REVISE on the r7 proposals with six blockers R7-1 to R7-6 and left D1 to D5 of report 13 standing. The director built immutable R8 proposals answering all six. They are frozen under proposal-r8 and listed by MANIFEST.sha256.json. They are NOT applied to production. The admission proposal r7 stays rejected and immutable. All timings in the R8 boards are PROJECTED from measured take 5 and take 6 rates, never measured. R7-5 is an artistic blocker and stays blocking unless you judge it resolved from the board and the renderer code. You have not seen pixels, so say what you can and can't establish. The director's mechanical gates (storyboard_check, watchability_check, documentary_check, shot_coherence, staging, board scale, floor, script_evidence, super_evidence, modern_film, native_sample_plan, caption_board_fit with 15 cues in two lines, authored_story_art verify) passed on both boards. Those are mechanical and approve nothing.

Decide four things honestly.
1. Is each of R7-1 to R7-6 resolved, still open, or partly resolved by the R8 bytes, and what exactly blocks release of the R8 script and boards or of a take made from them? Judge the 98.82 percent attribution (must belong to the on-device TinyML chip AI, with the university as the reporter, early assessments, validation accuracy), the university attribution of the field result limit, runtime and event widths against the projection (do your own arithmetic from the packet values and say it is yours), and varied useful framing.
2. Code approval. The renderer FloodStationFilm.tsx is unchanged and bound by hash. Check that every shot view and framing the R8 boards name is implemented there, that the detail pushes the boards rely on exist for the views that use them (chip-glow, validation-card, no-field-card, no-server), that the renderer honours the events and clause ids the boards now carry, and name any view or event the renderer can't draw as the board says. Say which renderer parts you read in full.
3. Recurrence. The failed narration mechanisms are in the five failure hashes below (repair_started events 77, 87, 99, 111, 138). The retired mechanism is caption-boundary-silent-beats, which relied on short silent beats inside long sentences and measurably did not land. The proposed replacement mechanism_id is sentence-per-cue-caption-boundaries. Judge whether it is a genuinely different, source-backed mechanism and not a refinement, and give the visible difference.
4. Source validation. State whether the R8 script needs a fresh independent source validation (it does if its sentences or claim wording changed from the validated script), citing the claim ids you rely on.

Output keys, exactly:
- verdict ("pass" or "revise"), reviewer_identity (your model and role, and what you could not verify), report14_sha256 (cite the sha above).
- original_findings_assessment: one entry per R7-1 to R7-6 and D1 to D5 (id, status resolved_by_proposal / still_open / partly_resolved / not_applicable, classification RELEASE BLOCKER / PROCESS OBSERVATION / ARTISTIC, reason).
- blocking_defects: only what blocks. Use [] if none. Unknown or artistic blockers stay blocking.
- observations.
- retired_mechanism_id ("caption-boundary-silent-beats"), replacement_mechanism_id ("sentence-per-cue-caption-boundaries"), reviewed_failure_sha256 (echo exactly this list: {json.dumps(known)}), visible_difference (at least 40 characters), source_basis (at least 30 characters), recurrence {{met, assessment}}.
- source_pivot {{requires_validation, script_before_sha256 "350fce431c5d01daec9d7df80796cdc0e073d7aa1859185f4fa02d32abe6cc83", proposed_script_sha256 "{sha(O + 'vo_script.txt')}", source_basis, claim_ids}}.
- code_assessment {{renderer_sha256 "{sha(R + 'video-engine/src/modern/episodes/2026-10-15/FloodStationFilm.tsx')}", views_checked, unsupported, parts_read_in_full}}.
- proposal_assessment: per sentence (15): claim limits intact or not, characters, caption fit; boards A and B; direction; projection arithmetic (yours).
- reasoning, concerns, files_read_in_full (with the hash you were given for each).

A pass authorizes only the registered repair correction and the fresh source validation. It approves no take, caption, picture, film, score or shipment.

Files (read all, in this order):
"""
for f in files:
    text += f"- {R + f} {sha(R + f)}\n"
open(R + 'out/dispatch/consolidated-review-packet-r8.md', 'w').write(text)
print(len(text), sha(R + 'out/dispatch/consolidated-review-packet-r8.md'))
