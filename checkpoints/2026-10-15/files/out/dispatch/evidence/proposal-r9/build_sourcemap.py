"""Write the R9 source map and blocker answers under proposal-r9/. Run from the checkout root."""
import json
O = 'out/dispatch/evidence/proposal-r9/'
claims = {c['id']: c for c in json.load(open('out/dispatch/claims.json'))['claims']}
src = open('out/dispatch/sources/utsa.txt').read().split('\n')


def line_of(quote):
    key = quote.strip().strip('“”"')[:40]
    for i, line in enumerate(src, 1):
        if key in line or key in line.replace('’', "'"):
            return i
    return None


A = json.load(open(O + 'storyboard-a.json'))
rows = [{'sentence': c['text'], 'claims': [{'id': k, 'quote': claims[k]['quote'], 'source_line': line_of(claims[k]['quote'])}
                                           for k in c['claim_ids']]} for c in A['narration_picture']['clauses']]
json.dump({'schema': 'dispatch_r8_source_map/1', 'source': 'out/dispatch/sources/utsa.txt', 'rows': rows},
          open(O + 'source-map.json', 'w'), indent=2)
proj = json.load(open(O + 'duration-projection.json'))
md = ['# R9 source map and answers to the six report14 blockers (report sha 97a41235)', '',
      'All timings below are PROJECTED from measured take 5 and take 6 rates. Measured post-TTS retiming governs the actual film.', '']
for r in rows:
    md.append('- "' + r['sentence'] + '" -> ' + ', '.join('%s (source line %s)' % (x['id'], x['source_line']) for x in r['claims']))
md += ['', '## Blockers',
 '- R7-1 absolute no field result: "The university reports no field result." and "It names no town with an installed station." The university is the subject of both, so the antecedent chain holds, and nothing asserts the world has no field result.',
 '- R7-2 figure on the wrong model: the figure follows "The university reports early chip AI assessments." and the chip AI is named in the sentence before it. In the source the 98.82 percent belongs to the on-device TinyML AI (line 107, after the on-device paragraph at line 106). The hub model is introduced earlier as "a second, larger AI". The on-screen tag "Initial assessments after training" remains under the card in both treatments, and the word "training" (distorted in take 6) is not spoken.',
 '- R7-3 runtime and R8-1: words fell from 163 to 132 and sentences from 18 to 15. The slow envelope now takes the larger MEASURED word rate (0.33 s, take 5 was 0.3216) and the larger measured mean sentence gap (0.83 s, take 6). duration-projection.json gives speech end typical %s s, slow %s s, fast %s s against a runtime of %s s (limit 62 s). The s7 narration was trimmed by one word (validation moved into the sentence before the figure) so scene s7 is %s s at the slow envelope, under the 9.5 s ceiling. Envelope variants of both boards (envelope-fast-*, envelope-slow-*) were built and every mechanical gate was run on all six boards.' % (proj['a']['speech_end']['typical'], proj['a']['speech_end']['slow'], proj['a']['speech_end']['fast'], proj['a']['runtime_s'], next(sc['duration_s'] for sc in json.load(open(O + 'envelope-slow-a.json'))['scenes'] if sc['id'] == 's7')),
 '- R7-4 event widths: build_proposal.py asserts every event is at most 1.2 s on the slow projection and at least 0.2 s on the fast projection. The hook payoff ends at about %s s typical (limit 1.5 s).' % proj['a']['hook_end_typical_s'],
 '- R7-5 same-view cuts (artistic, still blocking until reviewed) and R8-2: shot boundaries are now event-aware. A shot sharing a clause with the shot before it starts midway between the previous event end and its own event start, a new clause starts its shot at the clause start, and the builder asserts every event lies wholly inside one shot and inside its own shot when it has one. B s3 now finishes the signature second-lens event inside water-marks before weather-row, B s1 street-yard starts before s1-event-1, and s6 paths complete inside the shot that draws them. The only same-view pairs left are validation-card then validation-card (A s7, B s7) and chip-glow then chip-glow (A s4), each a detail push joined by a continuous edit.',
 '- R8-3 chip-glow push: s4-event-1 moved to 0.55 to 0.80 of its clause and s4-event-2 to 0.36 to 0.60 of the next, so the renderer push from the detail shot start to the lamp event lasts about a second. The cut stays at the clause boundary because a shot may not cut into the spoken clause before it, which storyboard_check enforces (draft 1 of this revision failed that check and is retained in precheck-01).',
 '- R7-6 close direction and metadata: no direction field references another line by number, and verification, sentence_map and hashes describe the 15 sentence script.', '',
 'Open and honest: D1 (take 6 distortion) is unresolved until a take reconciles under pinned alignment. D2 (caption fit) is unresolved until a measured set passes. D5 stays a process observation.']
open(O + 'source-map.md', 'w').write('\n'.join(md) + '\n')
print('\n'.join(md[-9:]))
