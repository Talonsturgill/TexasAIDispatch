"""Build the two planned treatment boards for 2026-10-25 from spec.py (director scratch)."""
import copy, hashlib, json, re, sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO / 'scripts'))
sys.path.insert(0, str(Path(__file__).parent))
from spec import *  # noqa
from modern_film import narration_tokens  # noqa

OUT = REPO / 'out/dispatch'
BASE = json.loads((REPO / 'runs/2026-10-21/openings/a.json').read_text())
from spec import FILM_FILE
sha = lambda p: hashlib.sha256((REPO / p).read_bytes()).hexdigest()
r4 = lambda x: round(x, 4)


def clause_clock():
    t, rows, scene_start, order = 0.0, [], {}, []
    by_scene = {}
    for c in CLAUSES:
        by_scene.setdefault(c[1], []).append(c)
    clock = {}
    cursor = 0.0
    scenes = {}
    for sid in by_scene:
        s0 = cursor
        at = s0 + (LEAD if sid == 's1' else 0.36)
        for cid, _, text, _c in by_scene[sid]:
            words = len(text.split())
            dur = r4(0.30 * words + 0.45)
            clock[cid] = (r4(at), r4(at + dur))
            at += dur + GAP_IN
        end = r4(at - GAP_IN + 0.3)
        scenes[sid] = (r4(s0), r4(end - s0))
        cursor = end
    return clock, scenes, cursor


def build(variant):
    other = 'b' if variant == 'a' else 'a'
    clock, sc_clock, total = clock_cache
    b = copy.deepcopy(BASE)
    for k in ('native_media', 'retimed_to', 'retime_evidence', 'captions', 'caption_method'):
        b.pop(k, None)
    b['date'] = EDITION; b['edition_id'] = EDITION; b['run_id'] = EDITION
    b['title'] = 'Who takes the order'
    b['topic'] = ("Wok & Karahi, a family restaurant in Spring, replaced its only server with an AI host named Haniya that takes orders "
                  "by table code and phone and requires payment before cooking, and the owner's savings and tip claims are his own account")
    b['beat'] = 'what-texas-makes'
    b['entities'] = ['Wok & Karahi', 'Haniya', 'Spring']
    b['credits_s'] = CREDITS_S
    b['runtime_s'] = r4(total)
    b['credits'] = ('TEXAS AI DOCKET\nSOURCES\nFOX 26 Houston, October 20th, 2026\nMuslim Mirror, October 19th, 2026\n'
                    'KPRC Click2Houston, October 21st, 2026\n29 CFR 531.54\nILLUSTRATION\nOriginal authored diagrams, no brand marks')
    b['fauna_scope'] = {'status': 'none', 'reason': 'This restaurant story names no animal action, habitat or wildlife claim.'}
    # scenes
    scenes, claims_by_scene = [], {}
    for cid, sid, text, cl in CLAUSES:
        claims_by_scene.setdefault(sid, [])
        for x in cl:
            if x not in claims_by_scene[sid]:
                claims_by_scene[sid].append(x)
    clause_rows = {c[0]: c for c in CLAUSES}
    for sid, S in SCENES.items():
        start, dur = sc_clock[sid]
        vo = ' '.join(c[2] for c in CLAUSES if c[1] == sid)
        events = []
        for suffix, cid, f0, f1, curve, ctype, what, subj, snd in S['events']:
            if cid is None:
                length = 1.2
                at_abs = start + dur - 3.0
                events.append(dict(id=f'{sid}-{suffix}', at_s_authored=r4(at_abs - start), duration_s_authored=r4(length),
                                   item_ids=subj, what=what, motion=dict(curve=curve, anticipation=0.0, settle=0.03),
                                   at_s=r4(at_abs - start), duration_s=r4(length)))
                continue
            cs, ce = clock[cid]
            span = ce - cs
            length = min(1.2, max(0.5, (f1 - f0) * span))
            length = min(length, {'s1-event-1': 0.85}.get(f'{sid}-{suffix}', 9))
            at_abs = cs + f0 * span
            at_abs = min(at_abs, ce - length)
            events.append(dict(id=f'{sid}-{suffix}', at_s_authored=r4(at_abs - start), duration_s_authored=r4(length),
                               item_ids=subj, what=what, motion=dict(curve=curve, anticipation=0.0, settle=0.03),
                               narration_id=cid, clause_fraction_start=(at_abs - cs) / span,
                               clause_fraction_end=(at_abs + length - cs) / span,
                               at_s=r4(at_abs - start), duration_s=r4(length)))
        planes = [dict(z=z, label=label, items=[dict(id=i, kind='applicationRecord', x=540, y=900, scale=1,
                                                   props=dict(label=dict(S['items'])[i])) for i in ids])
                  for z, label, ids in S['planes']]
        mute, must, change = S['proof']
        on = ' '.join(e['what'] for e in events)
        cam = CAMERA[variant][sid]
        scenes.append(dict(
            id=sid, start_s=start, duration_s=dur, duration_authored=dur, county='Harris', region='gulf',
            interior=S['interior'], cast=[], beat=S['beat'], story_role=S['role'], vo=vo,
            vo_claims=claims_by_scene[sid], super='', caption='', on_screen=on, what_moves=on,
            production_disclosure=S['disclosure'], visual_events=events, camera_strategy=cam,
            visual_family=f'order-{sid}-{variant}', payload_mode='picture', treatment=variant, hero=S['hero'][:62],
            place_plate='gulf-houston',
            visual_sentence=dict(subject=S['subject'], action=on, emotion=S['emotion'], annotation=S['disclosure']),
            planes=planes,
            visual_proof=dict(mute_takeaway=mute,
                              must_show=[dict(concept=c, item_ids=i) for c, i in must],
                              change=dict(description=change[0], item_ids=change[1])),
            hook_strategy='visual_anomaly', hook_payoff_s=0.75))
    b['scenes'] = scenes
    sc = {s['id']: s for s in scenes}
    ev = {e['id']: (s, e) for s in scenes for e in s['visual_events']}
    # narration picture
    cursor = 0
    clauses = []
    for i, (cid, sid, text, cl) in enumerate(CLAUSES, 1):
        n = len(narration_tokens(text))
        subj, evs = [], []
        for e in sc[sid]['visual_events']:
            if e.get('narration_id') == cid:
                evs.append(e['id'])
                subj += [x for x in e['item_ids'] if x not in subj]
        clauses.append(dict(id=cid, text=text, cue_ids=[f'c{i}'], scene_id=sid, subject_ids=sorted(subj),
                            action_id=SCENES[sid]['action'], claim_ids=cl, event_ids=evs,
                            start_s=clock[cid][0], end_s=clock[cid][1], word_range=[cursor, cursor + n]))
        cursor += n
    b['narration_picture'] = dict(version='narration-picture-v1', timing_mode='authored',
        cue_plan='Provisional authored cue estimate for the silent two-treatment comparison only. board_retime.py replaces it with measured_caption_boundaries after acoustic alignment; it approves nothing.',
        clauses=clauses)
    b['captions'] = [dict(id=f'c{i}', start=clock[c[0]][0], end=clock[c[0]][1], text=c[2], source='authored_estimate',
                          start_measured=False, end_measured=False) for i, c in enumerate(CLAUSES, 1)]
    # film direction
    shots, rewards = [], []
    for sid in SCENES:
        st, du = sc_clock[sid]
        scene_end = st + du
        evs = {e['id']: e for e in sc[sid]['visual_events']}
        spec = SHOTS[variant][sid]
        ev_start = lambda e: st + e['at_s']
        ev_end = lambda e: st + e['at_s'] + e['duration_s']
        starts = []
        for n, (view, framing, trans, cid, esuf) in enumerate(spec):
            e = evs[f'{sid}-{esuf}']
            if n == 0:
                starts.append(st)
            else:
                prev = evs[f'{sid}-{spec[n - 1][4]}']
                if spec[n - 1][3] != cid:
                    starts.append(clock[cid][0])
                else:
                    a, bnd = ev_end(prev), ev_start(e)
                    starts.append(r4(max(starts[-1] + 0.5, min(bnd, (a + bnd) / 2 if a > bnd else bnd) - 0.05)))
        starts.append(scene_end)
        for n, (view, framing, trans, cid, esuf) in enumerate(spec):
            e = evs[f'{sid}-{esuf}']
            s0, s1 = starts[n], starts[n + 1]
            shots.append(dict(id=f'{sid}-shot-{n + 1}', scene_id=sid, start_s=r4(s0), duration_s=r4(s1 - s0),
                              framing=framing, transition=trans, view=view, event_id=e['id'], purpose=e['what'],
                              carry=SCENES[sid]['subject'][:90], narration_ids=[cid],
                              scene_fraction_start=(s0 - st) / du, scene_fraction_end=(s1 - st) / du))
    ev = {e['id']: (s, e) for s in scenes for e in s['visual_events']}
    kinds = {'location_reveal': 'reveal', 'mechanism': 'action', 'resolution': 'consequence', 'consequence': 'consequence',
             'evidence': 'evidence', 'human_action': 'action', 'comparison': 'comparison'}
    ctypes = {f"{sid}-{x[0]}": x[5] for sid in SCENES for x in SCENES[sid]['events']}
    for sh in shots:
        s, e = ev[sh['event_id']]
        e0, e1 = s['start_s'] + e['at_s'], s['start_s'] + e['at_s'] + e['duration_s']
        lo, hi = max(e0, sh['start_s']), min(e1, sh['start_s'] + sh['duration_s'])
        assert hi > lo, ('shot does not overlap its event', sh['id'], sh['event_id'])
        t = lo + 0.25 * (hi - lo)
        rewards.append(dict(shot_id=sh['id'], event_id=e['id'], at_s=r4(t), kind=kinds[ctypes[e['id']]],
                            visible_change=e['what'], event_fraction=r4((t - e0) / e['duration_s'])))
    rewards.sort(key=lambda r: (r['at_s'], r['event_id']))
