"""Write the r13 follow-up message for the precharged same-worker continuation. Mechanical values only; no judgments."""
import hashlib, json
R = '/home/user/ed1015/TexasAIDispatch/'
P = R + 'out/dispatch/evidence/proposal-r13/'
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
dg = json.load(open(P + 'digests-r13.json'))
rep22 = R + 'out/dispatch/evidence/review-r12-technical-classification/report-verbatim.json'
guides = ['AGENTS.md', 'CLAUDE.md', 'config/art_direction.json', 'config/authored_story_art.json', 'config/autonomous_completion_narration_v1.json',
          'config/autonomous_completion_v2.json', 'config/claude_runtime.json', 'config/dispatch_rubric.yaml', 'config/quality_contract.json',
          'config/source_validation_completion_v1.json', 'config/story_art.json', 'knowledge/craft/ART_DIRECTION.md', 'knowledge/craft/AUTHORED_STORY_ART.md',
          'knowledge/craft/AUTONOMOUS_COMPLETION.md', 'knowledge/craft/MODERN_FILM.md', 'knowledge/craft/STORY_ART.md', 'knowledge/craft/cinematic_reference_bank.json',
          'knowledge/craft/visual-storytelling/README.md', 'knowledge/craft/visual-storytelling/explanatory-animation.md',
          'knowledge/craft/visual-storytelling/news-reporting.md', 'knowledge/craft/visual-storytelling/viewer-plan.md',
          'prompts/claude_routine.md', 'prompts/roles/scene-builder.md']
new = ['opening-a-final.json', 'opening-b-restamped.json', 'storyboard-before.json', 'FloodStationFilm.tsx', 'FloodStationFilm.diff', 'modern_episode_registry.json',
       'modern_episode_registry.diff', 'measured-intervals-r13.md', 'words-r13-diagnostic.json', 'captions-r13-diagnostic.json', 'digests-r13.json',
       'critic-packet-r13.json', 'MANIFEST.sha256.json']
def digs(k, path):
    d = dg[k]
    return (f'  board_path "{path}", board_sha256 {d["board_sha256"]}, concept_sha256 {d["concept_sha256"]}, renderer_sha256 {d["renderer_sha256"]},\n'
            f'  quality_contract_sha256 {d["quality_contract_sha256"]}, story_review.story_sha256 {d["story_sha256"]}, story_review.policy_sha256 {d["policy_sha256"]}, story_review.claims_sha256 {d["claims_sha256"]}')
text = f"""Charged same-worker continuation (storyboard_critics 23 of effective ceiling 25 reserved before this message): fresh gate-format code-plan reports for BOTH changed treatments after the r13 timing revision.

Preserved and unchanged: your report 22 (sha256 {sha(rep22)}, path {rep22}) classifying F1 (runtime), F2 (captions), F3 (runtime) as technical and raising two remaining blockers R12-a (s6 flood-path spread crosses the equal-split cut) and R12-b (s4 turn crosses its cut). Script 67d7ae45 (sha256 67d7ae453299483c5539290989560cdffa5ce4c6ad75fdfaef5929793d7feadf), claims 49b2379c and the valid source PASS are unchanged. No new voice or source validation is requested. The director changed only event windows for r13, listed under "Moved event windows" in measured-intervals-r13.md: s6-event-2 and s6-event-3 (n6a), s4-event-2 (n4b) and, as your minor notes, s2-event-3 (n2b) and s3-event-3 (n3a). Nothing else differs from the R12 bytes you reviewed. The director checked mechanically, with the real pipeline on retained take 7, that every event now lies wholly inside the shot that draws it and that a second full pass is byte identical. That approves nothing.

Your job now is the new substantive judgment, in the existing gate output contract, for BOTH changed boards. Judge the r13 bytes yourself. Don't carry an old grade, and the director will not author, rebind or edit any of it. Read every file below in full, one Read per step (boards and word tables in ranges until complete). Files whose hash is unchanged from your earlier full reads may be marked read_in_full only if you really read them in full in your context, otherwise read them now. Mark nothing read that you did not read. Run nothing and launch no agents.

The two boards:
- opening_a is the r13 measured treatment A board, applied after approval to BOTH /home/user/ed1015/TexasAIDispatch/out/dispatch/opening-a.json and /home/user/ed1015/TexasAIDispatch/out/dispatch/storyboard.json as identical bytes. Runtime 59.4 s, measured timing from retained take 7. Read {P}opening-a-final.json.
- opening_b is treatment B, unchanged except that film_direction.renderer_inputs is restamped to the new renderer and registry bytes (only those two entries change). It keeps its projected 54.1 s timing and the old s7 structure, and the renderer follows its old ids. It is not the selected film but still a complete treatment that the gate covers. Read {P}opening-b-restamped.json, to be applied as /home/user/ed1015/TexasAIDispatch/out/dispatch/opening-b.json (live bytes now: sha256 {sha(R + 'out/dispatch/opening-b.json')}).

Mechanical values computed by the director with the gate code (use exactly these instead of null, in the matching report):
- reports.opening_a:
{digs('opening-a', '/home/user/ed1015/TexasAIDispatch/out/dispatch/opening-a.json')}
- reports.opening_b:
{digs('opening-b', '/home/user/ed1015/TexasAIDispatch/out/dispatch/opening-b.json')}
- reports.storyboard_critic:
{digs('storyboard', '/home/user/ed1015/TexasAIDispatch/out/dispatch/storyboard.json')}
Each report: review_scope "code-plan", treatment "a" for opening_a and storyboard_critic and "b" for opening_b, reviewer_identity (your honest identity and limits), reviewed_at a full ISO 8601 UTC timestamp. The canonical packet the tool built for the final bytes is {P}critic-packet-r13.json (it names the scratch checkout /home/user/ed1015/dry that holds the same bytes as the files below, with the same guide hashes).

Return ONE complete handoff in the same shape as before: reports.opening_a, reports.opening_b, reports.storyboard_critic (each with verdict, strongest_frame, weakest_frame, blocking_defects, code_observations, action_reviews, story_review with verdict, blocking_defects, one_viewing_summary, opening_to_ending and weakest_transition), plus per_input_table and honest_limits. Add one top-level key technical_findings: one row each for F1, F2, F3, R12-a and R12-b (and the s2/s3 minor notes) saying resolved, still open or partly, with the measured numbers you relied on. A timing-only prose approval is not wanted: if you pass, the reports must carry your full judgments.

Judge in particular: every measured clause against its subject and performed action, each event wholly inside the shot that draws it (use the Events table in the intervals file and your own arithmetic), the 9.5 s scene and 5.0 s shot ceilings, reward gaps, the first reward, the s6 flood-path spread now performed in flood-paths, the s4 lamp-and-tag turn completing inside its detail shot, the s7 slide-in, the s8 stamp then map, B's old ids under the changed renderer, and the figure attribution (on-device TinyML chip AI, early validation, university as the reporter).

Files (read all, in this order):
- {rep22} {sha(rep22)}
""" + ''.join(f'- {P}{n} {sha(P + n)}\n' for n in new) + ''.join(f'- {R}{g} {sha(R + g)}\n' for g in guides)
open(R + 'out/dispatch/followup-review-message-r13.txt', 'w').write(text)
print(len(text), sha(R + 'out/dispatch/followup-review-message-r13.txt'))
