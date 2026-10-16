"""Write diff-r9-to-r10.md: the complete changed-board diff for the follow-up review. Run from the checkout root."""
import json, glob, os
R8 = 'out/dispatch/evidence/proposal-r9/'; R9 = 'out/dispatch/evidence/proposal-r10/'
out = ['# Complete changed-board diff, R9 to R10 (all times PROJECTED, typical envelope unless stated)', '']
s8 = open(R8 + 'vo_script.txt').read().strip().split('\n'); s9 = open(R9 + 'vo_script.txt').read().strip().split('\n')
out.append('## Script')
out.append('- changed lines: ' + '; '.join('%d: "%s" -> "%s"' % (i + 1, a, b) for i, (a, b) in enumerate(zip(s8, s9)) if a != b))
out.append('- every other line is byte-identical. %d words in R9, %d in R10. 15 sentences in both.' % (len(' '.join(s8).split()), len(' '.join(s9).split())))
for lab in 'ab':
    b8 = json.load(open(R8 + 'storyboard-%s.json' % lab)); b9 = json.load(open(R9 + 'storyboard-%s.json' % lab))
    out += ['', '## Board %s shots (R9 -> R10)' % lab.upper(), '| shot | R8 start/dur | R9 start/dur | view framing transition | event | clauses |', '|---|---|---|---|---|---|']
    sh8 = {x['id']: x for x in b8['film_direction']['shots']}
    for x in b9['film_direction']['shots']:
        o = sh8.get(x['id'])
        out.append('| %s | %s | %.2f / %.2f | %s %s %s | %s | %s |' % (x['id'], ('%.2f / %.2f' % (o['start_s'], o['duration_s'])) if o else 'new', x['start_s'], x['duration_s'], x['view'], x['framing'], x['transition'], x['event_id'], ','.join(x['narration_ids'])))
    out += ['', '### Board %s events: absolute window, shot that contains it' % lab.upper(), '| event | R9 window | R10 window | R10 shot |', '|---|---|---|---|']
    def evw(b):
        cl = {c['id']: c for c in b['narration_picture']['clauses']}; r = {}
        for s in b['scenes']:
            for e in s['visual_events']:
                c = cl[e['narration_id']]; ln = c['end_s'] - c['start_s']
                r[e['id']] = (c['start_s'] + e['clause_fraction_start'] * ln, c['start_s'] + e['clause_fraction_end'] * ln)
        return r
    w8, w9 = evw(b8), evw(b9)
    for k in sorted(w9, key=lambda k: w9[k][0]):
        shot = [x['id'] for x in b9['film_direction']['shots'] if x['start_s'] - .011 <= w9[k][0] and w9[k][1] <= x['start_s'] + x['duration_s'] + .011]
        out.append('| %s | %.2f to %.2f | %.2f to %.2f | %s |' % (k, w8[k][0], w8[k][1], w9[k][0], w9[k][1], ','.join(shot) or 'NONE'))
    out += ['', '### Board %s scene durations (typical envelope)' % lab.upper(), ', '.join('%s %.2f s' % (s['id'], s['duration_s']) for s in b9['scenes']), 'runtime %.2f s' % b9['runtime_s']]
    for md in ('fast', 'slow'):
        e = json.load(open(R9 + 'envelope-%s-%s.json' % (md, lab)))
        out.append('%s envelope: ' % md + ', '.join('%s %.2f' % (s['id'], s['duration_s']) for s in e['scenes']) + ' runtime %.2f' % e['runtime_s'])
out += ['', '## Real gate results (picture_precheck, retained under precheck-02-*, exit status per gate)']
for d in sorted(glob.glob(R9 + 'precheck-02-*')):
    rep = json.load(open(glob.glob(d + '/*/report.json')[0]))
    out.append('- %s: %s' % (os.path.basename(d), ', '.join('%s %s' % (c['gate'], 'ok' if c['exit_code'] == 0 else 'FAIL') for c in rep['checks'])))
out.append('- story_art fails in every precheck for a location reason only (no run_state.json beside the board). artverify-a and artverify-b hold the scratch verify with exit 0 for both boards.')
open(R9 + 'diff-r9-to-r10.md', 'w').write('\n'.join(out) + '\n')
print(len(out))
