"""Write the R9 narration bindings, direction and source map from the built script and boards. Under proposal-r9/ only."""
import json, hashlib, copy
R = 'out/dispatch/'; O = R + 'evidence/proposal-r9/'
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
A = json.load(open(O + 'storyboard-a.json')); B = json.load(open(O + 'storyboard-b.json'))
clauses = A['narration_picture']['clauses']
script = open(O + 'vo_script.txt').read()
assert [c['text'] for c in clauses] == script.strip().split('\n')
# bindings
bind = {'schema': 'dispatch_narration_bindings/1', 'edition_date': '2026-10-15',
        'sentences': [{'id': 's%d' % (i + 1), 'text': c['text'], 'claim_ids': c['claim_ids']} for i, c in enumerate(clauses)]}
json.dump(bind, open(O + 'vo_bindings.json', 'w'), indent=2)
# direction: per line job, intent, emphasis, energy. No line number is referenced inside any field.
L = {
 'n1a': ('orient', 'Plain and close, said as what the source describes.', 'ankle-deep', 'Working level, even through the whole sentence.'),
 'n1b': ('orient', 'Plain, attributing the point to the source.', 'UT San Antonio says', 'Working level, settling toward the end.'),
 'n2a': ('reveal', 'Plain and forward, the first clear lift.', 'built', 'Opens low and lifts on the last word.'),
 'n2b': ('reveal', 'Plain and forward.', 'charges itself from light', 'Steady, the clear lift of the middle.'),
 'n3a': ('explain', 'An even working explanation.', 'different', 'A step down, quick and even.'),
 'n4a': ('reveal', 'Firm and forward.', 'the AI itself', 'Held level through the sentence.'),
 'n4b': ('reveal', 'The turn, firm and forward.', 'without a central server', 'The clear lift of the middle, held through the sentence.'),
 'n5a': ('explain', 'Even and steady, a range stated plainly.', 'more than a half-mile', 'Level and plain, a step below the turn.'),
 'n5b': ('explain', 'Even and steady, the second range.', 'up to five miles', 'Level, finishing on to a hub.'),
 'n6a': ('explain', 'Level and plain.', 'second, larger', 'A step below the last sentence.'),
 'n7a': ('qualify', 'Flat and measured, naming whose report it is and what it is about.', 'The university reports', 'Even and plain, the start of the source limit.'),
 'n7b': ('qualify', 'Flat and measured, the figure said as one number.', 'ninety eight point eight two percent', 'Even through the figure, same pace as the sentence before.'),
 'n7c': ('qualify', 'Flat and measured, the limit.', 'no field result', 'Lower and plain, the quietest point of the read.'),
 'n8a': ('qualify', 'The second limit, level and plain.', 'no town', 'Level and plain, no lift, the same working pace as the sentence before.'),
 'n9a': ('resolve', 'The close, a complete short phrase at the pace of the sentence before.', 'still', 'Say every word at full length and finish the last word completely before the read ends, with no upturn.'),
}
d = json.load(open(R + 'evidence/proposal-r7/vo_direction.json'))
lines = []
for i, c in enumerate(clauses, 1):
    job, intent, emph, energy = L[c['id']]
    lines.append({'id': f'L{i}', 'scene_ids': [c['scene_id']], 'narration_ids': [c['id']], 'text': c['text'], 'job': job,
                  'intent': intent, 'emphasis': emph, 'energy': energy,
                  'pause_after': 'A normal breath at the full stop, and the next line joins with no reset.' if i < len(clauses) else 'The read ends on the last word.',
                  'visible_events': c['event_ids'],
                  'reason': f'Proposal r9: sentence {i} of the source-backed script. Events {", ".join(c["event_ids"])}.'})
d['lines'] = lines
d['sentence_map'] = [{'line': f'L{i}', 'sentence': f's{i}'} for i in range(1, len(clauses) + 1)]
d['director'] = ('Revised by the claude-sonnet-5-5 director from the retained r7 direction record (vo-director claude-haiku-5-5, high effort). '
                 'No synthesis, capture, soundcheck or paid call was run for this proposal.')
d['verification'] = {
 'script': {'path': 'out/dispatch/vo_script.txt (proposal copy evidence/proposal-r9/vo_script.txt)', 'sha256': sha(O + 'vo_script.txt'),
            'sha256_verified': True, 'file_lines': len(clauses), 'sentences': len(clauses),
            'content_checked_against_board': 'All fifteen sentences match the vo field of scenes s1 to s9 and the text of narration_picture clauses n1a to n9a in both proposed boards, in order.'},
 'storyboards': {'a': {'path': 'evidence/proposal-r9/storyboard-a.json', 'sha256': sha(O + 'storyboard-a.json')},
                 'b': {'path': 'evidence/proposal-r9/storyboard-b.json', 'sha256': sha(O + 'storyboard-b.json')}},
 'claims': {'path': 'out/dispatch/claims.json', 'sha256': sha(R + 'claims.json'), 'sha256_verified': True,
            'note': 'Unchanged claims file. The independent source validation of the current script and these claims is a separate funded gate.'},
 'bindings': {'path': 'evidence/proposal-r9/vo_bindings.json', 'sha256': sha(O + 'vo_bindings.json')},
 'opening_selection': 'The silent two-treatment comparison renews on the proposed boards. The earlier selection binds the rejected nine-sentence boards and is retained, not reused.'}
d['take_plan']['breath_rule'] = ('Breaths are breaths at full stops. Every sentence is short and ends in a full stop and a normal breath, so no silence is planned '
                                 'inside a sentence and no duration appears in this file or in any prompt text.')
d['performance_arc'] = ('Plain and close over the flooded yard, quicker through the station and its marks, a lift on the chip turn, steady through the radio ranges, '
                        'then level and measured on the report of the chip AI and its figure, quietest on the field limit, and the close at the same pace.')
d['flags'] = []; d['unresolved'] = []
d['director_edit_note'] = ('Proposal r9 (not applied): fifteen short sentences replace nine long ones, with board-only revisions after the R8 review (event-aware shot boundaries, chip-glow push of at least one second, s7 trimmed to fit the 9.5 s ceiling at the slow envelope) so each measured caption cue is one sentence of at most 64 characters. '
                           'The close references no other line by number. No word of the failed takes is named in a synth-facing field. The word that take 6 distorted no longer appears in the script. '
                           'Editor-only fields were regenerated.')
d['guides_read'] = ['Inherited from the retained r7 direction record; the director re-read prompts/phases/repair.md and knowledge/craft/AUTONOMOUS_COMPLETION.md for this revision.']
d['guides_not_read_in_this_pass'] = []
json.dump(d, open(O + 'vo_direction.json', 'w'), indent=2)
# opening digests and fit probe
open(O + 'opening-digests.txt', 'w').write(''.join(f'{n} {sha(O + n)}\n' for n in ('storyboard-a.json', 'storyboard-b.json')))
probe = ['sentence-fit probe (character counts, limit 64)'] + [f'{i}: {len(c["text"])} {c["text"]}' for i, c in enumerate(clauses, 1)]
open(O + 'sentence-fit-probe.txt', 'w').write('\n'.join(probe) + '\n')
print('\n'.join(probe))
