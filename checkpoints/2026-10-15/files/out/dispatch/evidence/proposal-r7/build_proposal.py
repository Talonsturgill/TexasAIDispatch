"""Build the immutable script-correction PROPOSALS from the authored boards. Writes only under proposal-r7/."""
import json, re, copy, hashlib, sys
sys.path.insert(0, 'scripts')
from modern_film import narration_tokens
R = 'out/dispatch/'
OUT = R + 'evidence/proposal-r7/'
# new sentences: id, text, claims, events, emphasis
PLAN = {
 's1': [('a', 'Some people could have ankle-deep water in their yard.', ['c12'], ['s1-event-1', 's1-event-2']),
        ('b', 'UT San Antonio says the phone warning can come after that.', ['c12'], ['s1-event-3'])],
 's2': [('a', 'So its researchers built a flood station.', ['c1'], ['s2-event-1']),
        ('b', 'It charges itself from light and needs no cell tower.', ['c5', 'c6', 'c14'], ['s2-event-2', 's2-event-3'])],
 's3': [('a', 'Four optical sensors at different heights watch the water.', ['c2'], ['s3-event-1', 's3-event-2']),
        ('b', 'The prototype also reads rain, temperature, humidity and light.', ['c2'], ['s3-event-3'])],
 's4': [('a', 'A small chip on the station runs the AI itself.', ['c3', 'c18'], ['s4-event-1']),
        ('b', 'So it judges flood risk without a central server.', ['c3'], ['s4-event-2', 's4-event-3'])],
 's5': [('a', 'When the risk rises, a radio signal leaves the station.', ['c6'], ['s5-event-1']),
        ('b', 'It can carry more than a half-mile through city streets.', ['c6'], ['s5-event-2']),
        ('c', 'In open country it can carry up to five miles, to a hub.', ['c6'], ['s5-event-3'])],
 's6': [('a', 'At the hub, a second, larger AI model draws a map.', ['c7', 'c16'], ['s6-event-1']),
        ('b', 'It shows how flooding could spread, for emergency responders.', ['c17', 'c20'], ['s6-event-2', 's6-event-3'])],
 's7': [('a', 'Validation accuracy was ninety eight point eight two percent.', ['c4'], ['s7-event-1']),
        ('b', 'The university reports it from early assessments after training.', ['c4'], ['s7-event-2']),
        ('c', 'There is no field result.', ['c4'], ['s7-event-3'])],
}
FRAC = {1: [(0.12, 0.38)], 2: [(0.08, 0.34), (0.52, 0.78)], 3: [(0.02, 0.22), (0.40, 0.62), (0.76, 0.96)]}
PLANB1 = [('a', 'Some people could have ankle-deep water in their yard.', ['c12'], ['s1-event-0', 's1-event-1', 's1-event-2']), ('b', 'UT San Antonio says the phone warning can come after that.', ['c12'], ['s1-event-3'])]
HOOK = (0.02, 0.22)

def build(path, label):
    b = json.load(open(path))
    scenes = {s['id']: s for s in b['scenes']}
    old = {c['id']: c for c in b['narration_picture']['clauses']}
    newclauses, newcues = [], []
    cursor = 0
    shots = b['film_direction']['shots']
    newshots = []
    for s in b['scenes']:
        sid = s['id']; n = 'n' + sid[1:]
        parent = old[n]
        subs = PLANB1 if (label == 'b' and sid == 's1') else PLAN.get(sid)
        if not subs:
            cnt = len(narration_tokens(parent['text'])); parent = dict(parent); parent['word_range'] = [cursor, cursor + cnt]; cursor += cnt
            newclauses.append(parent)
            cue = next(c for c in b['captions'] if c['id'] in parent['cue_ids']); newcues.extend([c for c in b['captions'] if c['id'] in parent['cue_ids']])
            newshots += [x for x in shots if x['scene_id'] == sid]
            continue
        s['vo'] = ' '.join(t for _, t, _, _ in subs)
        s['vo_claims'] = sorted({c for _, _, cl, _ in subs for c in cl}, key=lambda x: int(x[1:]))
        total = sum(len(t) for _, t, _, _ in subs)
        lo, hi = s['start_s'] + (0.3 if sid == 's1' else 0.2), s['start_s'] + s['duration_s'] - 0.3
        at = lo
        evmap = {}
        for k, (suf, text, claims, evs) in enumerate(subs):
            cid = n + suf; cue = cid + '-a'
            span = (hi - lo) * len(text) / total
            newcues.append({'id': cue, 'start': round(at, 3), 'end': round(at + span, 3), 'text': text, 'source': 'authored_estimate'})
            at += span
            cnt = len(narration_tokens(text))
            row = {k2: v for k2, v in parent.items()}
            row.update(id=cid, text=text, cue_ids=[cue], claim_ids=claims, event_ids=evs,
                       start_s=newcues[-1]['start'], end_s=newcues[-1]['end'], word_range=[cursor, cursor + cnt])
            cursor += cnt
            newclauses.append(row)
            for j, e in enumerate(evs):
                fr = FRAC[len(evs)][j]
                if len(evs) == 1 and k == len(subs) - 1: fr = (0.30, 0.62)
                evmap[e] = (cid, fr)
        for e in s['visual_events']:
            cid, fr = evmap[e['id']]
            e['narration_id'] = cid
            e['clause_fraction_start'], e['clause_fraction_end'] = HOOK if e['id'] == ('s1-event-0' if label == 'b' else 's1-event-1') else fr
        # shots: assign by event, add where a clause has none, reflow evenly
        sc = [dict(x) for x in shots if x['scene_id'] == sid]
        clause_of = {e: evmap[e][0] for e in evmap}
        for x in sc:
            x['narration_ids'] = [clause_of[x['event_id']]]
        have = {x['narration_ids'][0] for x in sc}
        for suf, text, claims, evs in subs:
            cid = n + suf
            if cid not in have:
                base = sc[min(len(sc) - 1, ord(suf) - 97 - 1 if ord(suf) > 97 else 0)]
                new = dict(base); new.update(id=sid + '-shot-x' + suf, event_id=evs[0], narration_ids=[cid], transition='cut',
                    purpose=base['purpose'], carry=base['carry'])
                sc.append(new)
        sc.sort(key=lambda x: (x['narration_ids'][0], x['event_id']))
        for i, x in enumerate(sc, 1):
            x['id'] = f'{sid}-shot-{i}'
        starts = [s['start_s']] + [c['start'] for c in newcues[-len(subs) + 1:]] if len(subs) > 1 else [s['start_s']]
        ends = starts[1:] + [s['start_s'] + s['duration_s']]
        wins = {n + suf: (a, z) for (suf, _, _, _), a, z in zip(subs, starts, ends)}
        for cid, (a, z) in wins.items():
            group = [x for x in sc if x['narration_ids'][0] == cid]
            d = (z - a) / len(group)
            for i, x in enumerate(group):
                x['start_s'] = round(a + i * d, 4); x['duration_s'] = round(d, 4)
                x['scene_fraction_start'] = round((x['start_s'] - s['start_s']) / s['duration_s'], 6)
                x['scene_fraction_end'] = round((x['start_s'] + x['duration_s'] - s['start_s']) / s['duration_s'], 6)
        newshots += sc
    b['narration_picture']['clauses'] = newclauses
    b['captions'] = newcues
    b['film_direction']['shots'] = newshots
    ev = {e['id']: e for s in b['scenes'] for e in s['visual_events']}
    cl = {c['id']: c for c in newclauses}
    sc = {s['id']: s for s in b['scenes']}
    for s in b['scenes']:
        for e in s['visual_events']:
            c = cl[e['narration_id']]; ln = c['end_s'] - c['start_s']
            e['at_s'] = round(c['start_s'] + e['clause_fraction_start'] * ln - s['start_s'], 4)
            e['duration_s'] = round((e['clause_fraction_end'] - e['clause_fraction_start']) * ln, 4)
            e['at_s_authored'], e['duration_s_authored'] = e['at_s'], e['duration_s']
    for r in b['film_direction']['rewards']:
        sid = r['event_id'].split('-')[0]; e = ev[r['event_id']]
        r['at_s'] = round(sc[sid]['start_s'] + e['at_s'] + e['duration_s'] * r['event_fraction'], 4)
        owner = [x for x in newshots if x['scene_id'] == sid and x['start_s'] - .011 <= r['at_s'] <= x['start_s'] + x['duration_s'] + .011]
        r['shot_id'] = owner[0]['id']
    b['narration_picture']['timing_mode'] = 'authored'
    json.dump(b, open(OUT + f'storyboard-{label}.json', 'w'), indent=2)
    return b

A = build(R + 'openings/a.json', 'a')
B = build(R + 'openings/b.json', 'b')
script = '\n'.join(c['text'] for c in A['narration_picture']['clauses']) + '\n'
open(OUT + 'vo_script.txt', 'w').write(script)
print(script)
