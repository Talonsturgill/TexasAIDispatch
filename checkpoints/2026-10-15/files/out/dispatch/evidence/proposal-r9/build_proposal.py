"""Build the immutable R9 board-revision PROPOSALS from the retained opening boards.
Writes only under evidence/proposal-r9/. Every timing here is a PROJECTION from measured take 5 and
take 6 rates, never a measured alignment. Run from the checkout root with scripts/ on the path."""
import json, hashlib, sys
sys.path.insert(0, 'scripts')
from modern_film import narration_tokens
R = 'out/dispatch/'
OUT = R + 'evidence/proposal-r9/'

# (suffix, text, claim ids, event ids). One sentence per cue, at most 64 characters.
PLAN = {
 's1': [('a', 'Some people could have ankle-deep water in their yard.', ['c12'], ['s1-event-1', 's1-event-2']),
        ('b', 'UT San Antonio says the phone warning can come after that.', ['c12'], ['s1-event-3'])],
 's2': [('a', 'So its researchers built a flood station.', ['c1'], ['s2-event-1']),
        ('b', 'It charges itself from light and needs no cell tower.', ['c5', 'c6', 'c14'], ['s2-event-2', 's2-event-3'])],
 's3': [('a', 'Four optical sensors at different heights watch the water.', ['c2'], ['s3-event-1', 's3-event-2', 's3-event-3'])],
 's4': [('a', 'A small chip on the station runs the AI itself.', ['c3', 'c18'], ['s4-event-1']),
        ('b', 'So it judges flood risk without a central server.', ['c3'], ['s4-event-2', 's4-event-3'])],
 's5': [('a', 'Its radio signal can carry more than a half-mile in streets.', ['c6'], ['s5-event-1', 's5-event-2']),
        ('b', 'In open country, up to five miles, to a hub.', ['c6'], ['s5-event-3'])],
 's6': [('a', 'At the hub, a second, larger AI maps flood paths for responders.', ['c7', 'c16', 'c17', 'c20'],
         ['s6-event-1', 's6-event-2', 's6-event-3'])],
 's7': [('a', 'The university reports early chip AI validation.', ['c4', 'c18'], ['s7-event-1']),
        ('b', 'Accuracy was ninety eight point eight two percent.', ['c4'], ['s7-event-2']),
        ('c', 'The university reports no field result.', ['c4'], ['s7-event-3'])],
 's8': [('a', 'It names no town with an installed station.', ['c1', 'c10'], ['s8-event-1', 's8-event-2', 's8-event-3'])],
 's9': [('a', 'Deployment is still the goal.', ['c9', 'c10'], ['s9-event-1', 's9-event-2', 's9-event-3'])],
}
PLANB1 = [('a', PLAN['s1'][0][1], ['c12'], ['s1-event-0', 's1-event-1', 's1-event-2']), PLAN['s1'][1]]
# Clause-fraction windows by event position. Widths are checked against the slow projection below.
FRAC = {1: [(0.12, 0.38)], 2: [(0.08, 0.32), (0.52, 0.76)], 3: [(0.04, 0.26), (0.38, 0.62), (0.74, 0.96)]}
SPECIAL = {'s4-event-1': (0.55, 0.80), 's4-event-2': (0.36, 0.60), 's4-event-3': (0.70, 0.94), 's1-event-3': (0.30, 0.56), 's7-event-1': (0.40, 0.70), 's7-event-2': (0.30, 0.56), 's7-event-3': (0.30, 0.62),
           's5-event-1': (0.04, 0.26), 's5-event-2': (0.52, 0.78), 's5-event-3': (0.30, 0.62)}
HOOK = (0.02, 0.22)
# Measured rates. Take 5 (8 sentence gaps, no directed beats): 152 words, speech 0.58 to 54.66 s.
# Take 6: 57.88 s file. Per word speech time from take 5 is about 0.32 s once 8 gaps of 0.65 s are removed.
WORD_S = {'fast': 0.30, 'typical': 0.32, 'slow': 0.33}
GAP_S = {'fast': 0.60, 'typical': 0.68, 'slow': 0.83}
LEAD_S, HOLD_S = 0.30, 2.0
MAX_EVENT_S, MIN_EVENT_S, HOOK_BY_S, MAX_RUNTIME_S = 1.2, 0.2, 1.5, 62.0


def project(subs_all, mode):
    cursor = LEAD_S; rows = []
    for k, (sid, suf, text, claims, evs) in enumerate(subs_all):
        words = len(narration_tokens(text)); length = words * WORD_S[mode]
        rows.append({'clause': 'n' + sid[1:] + suf, 'words': words, 'start': round(cursor, 3), 'end': round(cursor + length, 3)})
        cursor += length + (GAP_S[mode] if k < len(subs_all) - 1 else 0)
    return rows, cursor


def flat(label):
    out = []
    for sid in ['s%d' % i for i in range(1, 10)]:
        for suf, text, claims, evs in (PLANB1 if (label == 'b' and sid == 's1') else PLAN[sid]):
            out.append((sid, suf, text, claims, evs))
    return out


def build(path, label, mode='typical'):
    b = json.load(open(path))
    subs_all = flat(label)
    typ, typ_end = project(subs_all, mode)
    slow, slow_end = project(subs_all, 'slow')
    fast, fast_end = project(subs_all, 'fast')
    window = {r['clause']: (r['start'], r['end']) for r in typ}
    scenes = {s['id']: s for s in b['scenes']}
    old = {c['id']: c for c in b['narration_picture']['clauses']}
    shots_old = b['film_direction']['shots']
    # scene boundaries from the typical projection
    first_start = {}
    for sid, suf, *_ in subs_all:
        first_start.setdefault(sid, window['n' + sid[1:] + suf][0])
    order = ['s%d' % i for i in range(1, 10)]
    starts = {sid: (0.0 if sid == 's1' else round(first_start[sid] - LEAD_S, 3)) for sid in order}
    runtime = round(typ_end + HOLD_S, 1)
    ends = {sid: (starts[order[i + 1]] if i < 8 else runtime) for i, sid in enumerate(order)}
    newclauses, newcues, newshots, evclause = [], [], [], {}
    cursor = 0
    for sid in order:
        s = scenes[sid]; n = 'n' + sid[1:]; parent = old[n]
        subs = PLANB1 if (label == 'b' and sid == 's1') else PLAN[sid]
        s['start_s'] = starts[sid]; s['duration_s'] = round(ends[sid] - starts[sid], 3); s['duration_authored'] = s['duration_s']
        s['vo'] = ' '.join(t for _, t, _, _ in subs)
        s['vo_claims'] = sorted({c for _, _, cl, _ in subs for c in cl}, key=lambda x: int(x[1:]))
        for suf, text, claims, evs in subs:
            cid = n + suf; a, z = window[cid]; cnt = len(narration_tokens(text))
            newcues.append({'id': cid + '-a', 'start': a, 'end': z, 'text': text, 'source': 'authored_estimate'})
            row = dict(parent); row.update(id=cid, text=text, cue_ids=[cid + '-a'], claim_ids=claims, event_ids=evs,
                                           start_s=a, end_s=z, word_range=[cursor, cursor + cnt])
            cursor += cnt; newclauses.append(row)
            for j, e in enumerate(evs):
                fr = FRAC[len(evs)][j]
                if e in SPECIAL: fr = SPECIAL[e]
                if e == ('s1-event-0' if label == 'b' else 's1-event-1'): fr = HOOK
                evclause[e] = (cid, fr)
        for e in s['visual_events']:
            cid, fr = evclause[e['id']]
            e['narration_id'] = cid; e['clause_fraction_start'], e['clause_fraction_end'] = fr
    cl = {c['id']: c for c in newclauses}
    # shots: one per distinct picture. A clause with no picture of its own extends the previous shot.
    for sid in order:
        subs = PLANB1 if (label == 'b' and sid == 's1') else PLAN[sid]
        n = 'n' + sid[1:]
        sc = sorted([dict(x) for x in shots_old if x['scene_id'] == sid], key=lambda x: x['start_s'])
        by = {}
        for x in sc: by.setdefault(evclause[x['event_id']][0], []).append(x)
        groups = []  # (shot, [clause ids]) in order
        for suf, *_ in subs:
            cid = n + suf
            if by.get(cid):
                for x in by[cid]: groups.append([x, [cid]])
            elif groups:
                groups[-1][1].append(cid)
            else:
                groups.append(None); pending = cid
        if groups and groups[0] is None:  # first clause with no picture: next shot starts with it
            groups = groups[1:]; groups[0][1].insert(0, pending)
        # A merged shot longer than the 5.0 s hold ceiling becomes two shots of one view: the second is a
        # detail push (the renderer implements that push for validation-card), joined by a continuous edit.
        split = []
        for x, cids in groups:
            if len(cids) > 1 and x['view'] == 'validation-card':
                y = dict(x); y.update(framing='detail', transition='continuous',
                                      event_id=[e for e in evclause if evclause[e][0] == cids[1]][0],
                                      purpose='The same validation card pushes in on its bar end and the initial assessments tag while the figure is read.')
                split += [[x, [cids[0]]], [y, cids[1:]]]
            else:
                split.append([x, cids])
        groups = split
        scene_end = ends[sid]
        # Event-aware windows. A shot starts at its clause start (scene start for the first), or, when it shares a
        # clause with the shot before it, midway between the previous event's end and its own event's start, so every
        # event completes inside the shot that draws it. The chip-glow detail push needs a full second before its lamp event.
        evs = sorted([e for e in b['scenes'] if e['id'] == sid][0]['visual_events'],
                     key=lambda e: cl[e['narration_id']]['start_s'] + e['clause_fraction_start'] * (cl[e['narration_id']]['end_s'] - cl[e['narration_id']]['start_s']))
        def win_of(e):
            c = cl[e['narration_id']]; ln = c['end_s'] - c['start_s']
            return c['start_s'] + e['clause_fraction_start'] * ln, c['start_s'] + e['clause_fraction_end'] * ln
        order_ids = [e['id'] for e in evs]
        starts_g = []
        for gi, (x, cids) in enumerate(groups):
            own = order_ids.index(x['event_id']); ea, ez = win_of(evs[own])
            if gi == 0:
                t = starts[sid]
            else:
                prev_end = win_of(evs[own - 1])[1]
                t = cl[cids[0]]['start_s'] if cids[0] != groups[gi - 1][1][-1] and cl[cids[0]]['start_s'] >= prev_end else (prev_end + ea) / 2
            if x['view'] == 'chip-glow' and x['framing'] == 'detail' and gi > 0:
                t = min(t, ea - 1.1)
            assert gi == 0 or t > starts_g[-1] + 0.3, (label, sid, gi, t)
            if gi and cids[0] != groups[gi - 1][1][-1]:
                assert t >= cl[groups[gi - 1][1][-1]]['end_s'] - 1e-6, ('a shot may not cut into the spoken clause before it', label, sid, t)
            starts_g.append(round(t, 4))
        for gi, (x, cids) in enumerate(groups):
            x['_a'] = starts_g[gi]; x['_z'] = starts_g[gi + 1] if gi + 1 < len(groups) else scene_end
        # every event lies wholly inside one shot, and inside its own shot when it has one
        for e in evs:
            ea, ez = win_of(e)
            own = [g for g in groups if g[0]['event_id'] == e['id']]
            for g in own:
                assert g[0]['_a'] - .011 <= ea and ez <= g[0]['_z'] + .011, (label, e['id'], g[0]['view'], ea, ez, g[0]['_a'], g[0]['_z'])
            assert any(g[0]['_a'] - .011 <= ea and ez <= g[0]['_z'] + .011 for g in groups), (label, e['id'])
        for k, (x, cids) in enumerate(groups, 1):
            x['id'] = f'{sid}-shot-{k}'; x['narration_ids'] = cids
            x['start_s'] = x.pop('_a'); x['duration_s'] = round(x.pop('_z') - x['start_s'], 4)
            x['scene_fraction_start'] = round((x['start_s'] - starts[sid]) / (scene_end - starts[sid]), 6)
            x['scene_fraction_end'] = round((x['start_s'] + x['duration_s'] - starts[sid]) / (scene_end - starts[sid]), 6)
            pass
            newshots.append(x)
    # same-view pairs are legal only with a different framing and a continuous transition
    for p, q in zip(newshots, newshots[1:]):
        if p['scene_id'] == q['scene_id'] and p['view'] == q['view']:
            assert p['framing'] != q['framing'] and q['transition'] in ('continuous', 'match'), (label, p['id'], q['id'])
        assert (q['start_s'] - p['start_s']) <= 5.0 + 1e-9
    b['narration_picture']['clauses'] = newclauses
    b['captions'] = newcues
    b['film_direction']['shots'] = newshots
    b['runtime_s'] = runtime
    ev = {e['id']: e for s in b['scenes'] for e in s['visual_events']}
    sc_by = {s['id']: s for s in b['scenes']}
    for s in b['scenes']:
        for e in s['visual_events']:
            c = cl[e['narration_id']]; ln = c['end_s'] - c['start_s']
            e['at_s'] = round(c['start_s'] + e['clause_fraction_start'] * ln - s['start_s'], 4)
            e['duration_s'] = round((e['clause_fraction_end'] - e['clause_fraction_start']) * ln, 4)
            e['at_s_authored'], e['duration_s_authored'] = e['at_s'], e['duration_s']
    for r in b['film_direction']['rewards']:
        sid = r['event_id'].split('-')[0]; e = ev[r['event_id']]
        r['at_s'] = round(sc_by[sid]['start_s'] + e['at_s'] + e['duration_s'] * r['event_fraction'], 4)
        owner = [x for x in newshots if x['scene_id'] == sid and x['start_s'] - .011 <= r['at_s'] <= x['start_s'] + x['duration_s'] + .011]
        r['shot_id'] = owner[0]['id']
    # stale per-scene sentence_to_shot clause text follows the new narration
    for edit in b['creative_direction']['edits']:
        edit['sentence_to_shot']['clause'] = sc_by[edit['scene_id']]['vo']
    b['narration_picture']['timing_mode'] = 'authored'
    b['narration_picture']['cue_plan'] = ('Provisional authored cue estimate for the silent two-treatment comparison only, projected from '
        'measured take 5 and take 6 rates. board_retime.py replaces it with measured_caption_boundaries after acoustic alignment; it approves nothing.')
    # width audit against the slow and fast projections
    widths = []
    lens = {r['clause']: (r['end'] - r['start']) for r in typ}
    for e in ev.values():
        c = e['narration_id']; w = (e['clause_fraction_end'] - e['clause_fraction_start'])
        sl = w * lens[c] * WORD_S['slow'] / WORD_S[mode]; fa = w * lens[c] * WORD_S['fast'] / WORD_S[mode]
        widths.append({'event': e['id'], 'clause': c, 'typical_s': round(w * lens[c], 3), 'slow_s': round(sl, 3), 'fast_s': round(fa, 3)})
        assert sl <= MAX_EVENT_S and fa >= MIN_EVENT_S, (label, e['id'], sl, fa)
    hook_ev = 's1-event-0' if label == 'b' else 's1-event-1'
    hook_end = ev[hook_ev]['at_s'] + ev[hook_ev]['duration_s']
    assert hook_end * WORD_S['slow'] / WORD_S[mode] <= HOOK_BY_S, hook_end
    assert runtime <= MAX_RUNTIME_S
    b['hook_payoff_s'] = round(hook_end, 3)
    json.dump(b, open(OUT + (f'storyboard-{label}.json' if mode == 'typical' else f'envelope-{mode}-{label}.json'), 'w'), indent=2)
    return b, {'typical': typ, 'slow': slow, 'fast': fast, 'speech_end': {'typical': round(typ_end, 2), 'slow': round(slow_end, 2), 'fast': round(fast_end, 2)},
               'runtime_s': runtime, 'event_widths': widths, 'hook_end_typical_s': round(hook_end, 3)}


if __name__ == '__main__':
    A, pa = build(R + 'openings/a.json', 'a')
    B, pb = build(R + 'openings/b.json', 'b')
    for md in ('fast', 'slow'):
        build(R + 'openings/a.json', 'a', md); build(R + 'openings/b.json', 'b', md)
    script = '\n'.join(c['text'] for c in A['narration_picture']['clauses']) + '\n'
    assert script == '\n'.join(c['text'] for c in B['narration_picture']['clauses']) + '\n'
    open(OUT + 'vo_script.txt', 'w').write(script)
    words = len(script.split())
    proj = {'schema': 'dispatch_runtime_projection/1', 'words': words, 'sentences': len(script.strip().split('\n')),
            'rates': {'word_s': WORD_S, 'gap_s': GAP_S, 'lead_s': LEAD_S, 'hold_s': HOLD_S},
            'basis': 'Take 5: 152 words, 8 sentence gaps near 0.65 s, speech 0.58 to 54.66 s, about 0.3216 s per word. Take 6: 57.88 s file, eight sentence gaps of 0.6 s or more with mean 0.83 s, about 0.31 s per voiced word. The slow envelope takes the larger measured word rate (0.33) and the larger measured mean gap (0.83). Envelope variants of both boards are built for fast, typical and slow so the real gates run on each.',
            'a': pa, 'b': pb, 'max_runtime_s': MAX_RUNTIME_S, 'projection_only': True}
    json.dump(proj, open(OUT + 'duration-projection.json', 'w'), indent=2)
    print(script); print(words, 'words', proj['sentences'], 'sentences', pa['speech_end'], 'runtime', pa['runtime_s'], pb['runtime_s'])
