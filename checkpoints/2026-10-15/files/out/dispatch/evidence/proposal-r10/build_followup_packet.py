"""Freeze the R10 manifest and write the source-pivot diagnosis packet. Run from the checkout root."""
import hashlib, json, os, stat
R = '/home/user/ed1015/TexasAIDispatch/'
P = R + 'out/dispatch/evidence/proposal-r10/'
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
names = ['vo_script.txt', 'vo_bindings.json', 'vo_direction.json', 'storyboard-a.json', 'storyboard-b.json', 'envelope-fast-a.json',
         'envelope-fast-b.json', 'envelope-slow-a.json', 'envelope-slow-b.json', 'source-map.json', 'source-map.md', 'duration-projection.json',
         'opening-digests.txt', 'sentence-fit-probe.txt', 'diff-r9-to-r10.md', 'EVIDENCE-NOTES.md', 'build_proposal.py', 'build_sidecars.py',
         'build_sourcemap.py', 'build_diff.py']
m = {n: sha(P + n) for n in names}
json.dump(m, open(P + 'MANIFEST.sha256.json', 'w'), indent=2)
for n in names + ['MANIFEST.sha256.json']:
    os.chmod(P + n, os.stat(P + n).st_mode & ~(stat.S_IWUSR | stat.S_IWGRP | stat.S_IWOTH))
V = R + 'out/dispatch/evidence/validation-r9-revise/validation-object-verbatim.json'
cur = R + 'out/dispatch/vo_script.txt'
text = f"""# Independent source-pivot diagnosis of the validator REVISE and review of the R10 correction (same Opus High critic, precharged continuation)

This is a charged changed-proposal content follow-up on your earlier reviews (R8 REVISE, then the R9 PASS, report sha256 1fddfa69056d425a544f44f9d3b96432bba2ebc78cfce3f300c73c58cdf53c1c). The director reserved storyboard_critics 17 of effective ceiling 19 before this message. You can't verify that, so say so. Keep your context. Don't re-read what you already read in the R9 review. Read only the files listed at the end, in full. Run nothing and launch no agents.

What happened. The R9 correction was applied under the registered repair (script sha256 {sha(cur)}). The fresh independent Opus High source validator then returned REVISE (object sha256 {sha(V)}). It proved all 20 claims verbatim against the live page and the snapshot and approved 13 of 15 sentences. It rejected sentence 13 "The university reports no field result." as worded, because the evidence shows only that this one announcement reports no field result, and a UTSA grant final report (GLO E014) exists that it could not read. It said sentence 14 "It names no town with an installed station." is supported once sentence 13 names the announcement. It also ruled the sentence 11 and 12 pair (chip AI validation, then accuracy) supported. Its required edit: attribute sentence 13 to the announcement.

The director built the frozen R10 correction (proposal-r10, manifest {sha(P + 'MANIFEST.sha256.json')}). It changes ONE sentence, line 13 of the script, to "The announcement reports no field result." That keeps the word count (so scene s7 keeps its slow envelope margin) and makes "It" in sentence 14 mean the announcement. Boards, bindings and direction change only in the four text fields that carry that sentence. Timing, shots, events and every other byte are unchanged (diff-r9-to-r10.md lists it). All mechanical gates pass on all six R10 boards (typical, fast and slow envelopes of A and B), and story_art is verified separately. Those approve nothing.

Give ONE consolidated answer in your usual JSON contract, as the independent source-pivot diagnosis the controller requires:
1. Diagnose the validator REVISE. Is the s13 defect real against the source and claims you already read? Is any other sentence, claim binding or limit affected, including the validator's rulings on the s11/s12 pair?
2. Because the CURRENT applied R9 script fails the independent validation, the verdict for the current bytes is "revise" and blocking_defects must name the s13 defect (release blocker). Then assess the frozen R10 proposal separately in proposal_assessment: does it fix the defect without breaking another limit, caption fit (sentence 13 is now 41 characters), antecedent chain, runtime or any gate?
3. source_pivot: requires_validation true, script_before_sha256 "{sha(cur)}" (the currently applied script), proposed_script_sha256 "{m['vo_script.txt']}", source_basis, claim_ids.
4. State whether the recurrence finding (mechanism sentence-per-cue-caption-boundaries replacing caption-boundary-silent-beats) is unchanged and met.
Your response approves no take, caption, picture, film, score or shipment, and a later fresh validation of the R10 bytes is still required.

Files (read in full):
""" + ''.join(f"- {path} {sha(path)}\n" for path in [V, P + 'diff-r9-to-r10.md', P + 'vo_script.txt', P + 'vo_bindings.json', P + 'source-map.md', P + 'EVIDENCE-NOTES.md', P + 'sentence-fit-probe.txt'])
open(R + 'out/dispatch/followup-review-packet-r10.md', 'w').write(text)
print(len(text), sha(R + 'out/dispatch/followup-review-packet-r10.md'), m['vo_script.txt'])
