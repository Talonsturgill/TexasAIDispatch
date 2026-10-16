"""Freeze the R9 manifest and write the follow-up review packet. Run from the checkout root."""
import hashlib, json, os, stat
R = '/home/user/ed1015/TexasAIDispatch/'
P = R + 'out/dispatch/evidence/proposal-r9/'
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
names = ['vo_script.txt', 'vo_bindings.json', 'vo_direction.json', 'storyboard-a.json', 'storyboard-b.json', 'envelope-fast-a.json',
         'envelope-fast-b.json', 'envelope-slow-a.json', 'envelope-slow-b.json', 'source-map.json', 'source-map.md', 'duration-projection.json',
         'opening-digests.txt', 'sentence-fit-probe.txt', 'diff-r8-to-r9.md', 'EVIDENCE-NOTES.md', 'build_proposal.py', 'build_sidecars.py',
         'build_sourcemap.py', 'build_diff.py']
m = {n: sha(P + n) for n in names}
json.dump(m, open(P + 'MANIFEST.sha256.json', 'w'), indent=2)
for n in names + ['MANIFEST.sha256.json']:
    os.chmod(P + n, os.stat(P + n).st_mode & ~(stat.S_IWUSR | stat.S_IWGRP | stat.S_IWOTH))
unchanged = ['out/dispatch/consolidated-review-packet-r8.md', 'out/dispatch/evidence/review-r8-recurrence-revise/report-verbatim.json',
             'out/dispatch/evidence/review-r7-source-pivot-revise/report-verbatim.json', 'out/dispatch/claims.json', 'out/dispatch/sources/utsa.txt',
             'knowledge/craft/VO_DIRECTION.md', 'config/documentary.json', 'config/modern_film.json',
             'video-engine/src/modern/episodes/2026-10-15/FloodStationFilm.tsx', 'out/dispatch/evidence/proposal-r8/MANIFEST.sha256.json']
text = f"""# Follow-up review of the R9 board revision (same Opus High critic, precharged continuation)

This is a changed-proposal content follow-up on your R8 REVISE (report sha256 {sha(R + 'out/dispatch/evidence/review-r8-recurrence-revise/report-verbatim.json')}). It is separately precharged by the director (storyboard_critics 16 of effective ceiling 19) before this message. You can't verify that, so say so. Keep your earlier context. Do NOT re-read the unchanged inputs below. Their exact current hashes are listed so you can confirm they are the ones you read. Read only the changed R9 files listed after them, in full. Run nothing and launch no agents.

Your R8 verdict stands unchanged and in the ledger. This review judges only the R9 bytes. One consolidated answer is wanted: R8-1, R8-2 and R8-3 together, each marked resolved, partly resolved or still open, plus anything NEW in the R9 diff. R7-5 stays artistic and blocking unless you judge it resolved from the board and the renderer you already read. All times are PROJECTED. The director's mechanical gates (picture_precheck with every gate except story_art, and story_art verified separately) passed on all six boards: typical, fast and slow envelopes of A and B. The slow envelope uses the larger MEASURED word rate (0.33 s, take 5 was 0.3216) and the larger measured mean sentence gap (0.83 s, take 6). Your own hand arithmetic is still wanted. The mechanical gates approve nothing.

What changed (full diff in diff-r8-to-r9.md):
- Script: two lines only. Line 11 now "The university reports early chip AI validation." Line 12 now "Accuracy was ninety eight point eight two percent." Judge whether the 98.82 percent stays attributed to the on-device TinyML chip AI as the university's reported early validation, and whether "validation" in line 11 plus "accuracy" in line 12 keeps validation accuracy, early, and the university as reporter. The words "after training" stay on screen only, as in R8.
- Boards: event-aware shot boundaries (every event lies wholly inside one shot, and inside its own shot when it has one), s4-event-1/2/3 re-placed so the chip-glow detail push has about a second, s1-event-3 and s7 events re-placed, rates and runtime recomputed.
- Direction, bindings, source map regenerated for the two changed lines.

Answer in the same JSON contract as the R8 packet with these differences: omit retired/replacement/reviewed_failure_sha256 unless you change your view (the recurrence finding is unchanged), keep source_pivot with proposed_script_sha256 "{m['vo_script.txt']}" and requires_validation, keep code_assessment limited to anything newly relevant, and for the verdict say "pass" only if no blocker remains. A pass authorizes only the registered repair correction and the separate fresh source validation. It approves no take, caption, picture, film, score or shipment. Return the complete JSON plus a one-line note.

Unchanged inputs (confirm hashes only):
""" + ''.join(f"- {R + f} {sha(R + f)}\n" for f in unchanged) + """
Changed R9 files (read all in full):
""" + ''.join(f"- {P + n} {m[n]}\n" for n in ['diff-r8-to-r9.md', 'vo_script.txt', 'vo_bindings.json', 'vo_direction.json', 'storyboard-a.json', 'storyboard-b.json', 'source-map.md', 'duration-projection.json', 'sentence-fit-probe.txt', 'EVIDENCE-NOTES.md']) + f"""
Also available if you want them, not required: envelope-fast-a.json, envelope-fast-b.json, envelope-slow-a.json, envelope-slow-b.json, MANIFEST.sha256.json ({sha(P + 'MANIFEST.sha256.json')}) and the retained gate logs under precheck-01-* (the failed first draft) and precheck-02-* in the same folder.
"""
open(R + 'out/dispatch/followup-review-packet-r9.md', 'w').write(text)
print(len(text), sha(R + 'out/dispatch/followup-review-packet-r9.md'), m['vo_script.txt'])
