"""Solve each note-check view's camera box from the probe's settled world bounds.

For a view, every shot (both treatments) that uses it contributes: its clause subjects, which must sit
wholly inside the safe picture rectangle, and every other object, which must be wholly inside it or
wholly out of sight (off frame, or below the caption band where the feed's own reserve covers it).
Visible type must reach LEGIBLE screen pixels. The largest zoom within the view's range wins.
"""
import json, itertools, sys
SP = sys.argv[1]
LEGIBLE = 26.0
BAND = dict(x0=40, y0=420, x1=900, y1=1200)
CHECK = dict(x0=40, y0=380, x1=900, y1=1220)
PANES = [(40, 392, 900, 796), (40, 812, 900, 1216)]
import os
M = float(os.environ.get('MARGIN', '0'))
SAFE_X0, SAFE_X1, SAFE_Y1, HIDE_Y = 36 + M, 912 - M, 1282 - M, 1421
ZR = {'wide': (1.0, 1.5), 'medium': (1.0, 1.95), 'close': (1.4, 3.2), 'detail': (1.6, 3.2), 'check': (1.0, 2.7), 'split': (0.9, 2.4)}
KEYWORDS = {'s2-pilots': ['DAX', 'Abridge'], 's2-platform': ['one unified system'], 's2-progress': ['working toward'],
            's2-post': ['UT Physicians'], 's3-nodate': ['no date'], 's3-refresher': ['Epic refresher'], 's3-rollout': ['physicians'],
            's4-release': ['Press release'], 's4-date': ['October 8th, 2026'], 's4-agreement': ['enterprise-wide'], 's4-initiative': ['REAL Health AI'],
            's5-framework': ['framework'], 's5-institutions': ['institution'], 's6-source': ['source'], 's6-note': ['Visit note'],
            's7-bill': ['Texas Senate Bill 1188'], 's7-effective': ['September 1st, 2025'], 's7-diagnosis': ['diagnosis'], 's7-aitag': ['AI'],
            's8-condition': ['review all AI-created records'], 's8-standards': ['Texas Medical Board standards'], 's8-records': ['records'],
            's9-diagnosis': ['diagnosis'], 's9-visitnote': ['visit note'], 's9-question': ['?'],
            's10-design': ['can verify'], 's10-statute': ['diagnostic use'], 's10-howwell': ['check works'], 's10-sources': ['Abridge release']}
SPLIT_ITEMS = {'post-split': [['s2-pilots'], ['s2-platform', 's2-progress']], 'scope-split': [['s9-visitnote', 's9-question'], ['s9-bill', 's9-diagnosis']]}
ENV = ('-room', '-desk')

def kind_of(view):
    return view.rsplit('-', 1)[1]

def load():
    usages = {}
    for t in 'ab':
        r = json.load(open(f'{SP}/probe-{t}.json'))
        for s in r['objects']:
            s['variant'] = t
            usages.setdefault(s['view'], []).append(s)
    return usages

def words_for(shot, keep=None):
    req = []
    for sid in shot['subjects']:
        if keep is not None and sid not in keep:
            continue
        req += KEYWORDS.get(sid, [])
    return req

def ymin_for(shot):
    # below the disclosure chip; below the county card while it shows (2 to 8.6 seconds)
    y = 236
    if shot['start'] < 8.6 and shot['end'] > 2.0:
        y = 290
    return y + M

def classify(shot):
    subs, others = [], []
    if shot['scene'] == 's1':
        subs.append({'key': 'speech-path', 'items': ['s1-speech'], 'bbox': [340, 590, 520, 860], 'texts': [], 'whole': True})
    if shot['view'].endswith('-check'):
        for o in shot['objects']:
            if o['key'] == 'reticle':
                subs.append(dict(o, whole=True))
    for o in shot['objects']:
        if o['key'] in ('arm', 'reticle') or any(o['key'].endswith(e) for e in ENV):
            continue
        is_sub = bool(set(o['items']) & set(shot['subjects']))
        (subs if is_sub else others).append(o)
    return subs, others

def screen(b, z, cx, cy, fx, fy):
    return (fx + (b[0] - cx) * z, fy + (b[1] - cy) * z, fx + (b[2] - cx) * z, fy + (b[3] - cy) * z)

def area(b): return max(0, b[2]-b[0])*max(0, b[3]-b[1])
def clipb(b, r): return (max(b[0], r[0]), max(b[1], r[1]), min(b[2], r[2]), min(b[3], r[3]))

def ok_camera(z, cx, cy, fx, fy, usage_sets, rect):
    """Text-level rule: every word is wholly inside the safe picture, or wholly out of sight; visible words
    are legible; each subject shows at least one whole word (or most of its geometry if it has none)."""
    X0, Y0, X1, Y1 = rect
    vis = []
    for row in usage_sets:
        subs, others, ymin = row[:3]
        need_words = row[3] if len(row) > 3 else []
        sy0 = max(ymin, Y0 + 4)
        sx0, sx1, sy1 = max(SAFE_X0, X0 + 4), min(SAFE_X1, X1 - 4), min(SAFE_Y1, Y1 - 4)
        def text_state(tx):
            s = screen(tx['bbox'], z, cx, cy, fx, fy)
            if s[0] >= sx0 and s[2] <= sx1 and s[1] >= sy0 and s[3] <= sy1:
                return 'in'
            if s[2] <= X0 or s[0] >= X1 or s[3] <= Y0 or s[1] >= min(Y1, HIDE_Y):
                return 'out'
            return 'cut'
        for o in subs + others:
            states = [text_state(tx) for tx in o.get('texts', [])]
            if 'cut' in states:
                return False, 'cut text '+o['key']+' '+str([tx['t'] for tx,st in zip(o.get('texts',[]),states) if st=='cut'][:2])
            for tx, st in zip(o.get('texts', []), states):
                if st == 'in' and tx['size'] * z < LEGIBLE - 1e-6:
                    return False, 'small text '+o['key']+' '+tx['t']
            if any(st == 'in' for st in states):
                vis.append(o)
        seen_words = set()
        for o in subs + others:
            for tx in o.get('texts', []):
                if text_state(tx) == 'in':
                    seen_words.add(tx['t'])
        for wd in need_words:
            if wd not in seen_words:
                return False, 'keyword missing ' + wd
        for o in subs:
            s = screen(o['bbox'], z, cx, cy, fx, fy)
            inside = clipb(s, (sx0, sy0, sx1, sy1))
            need = .5 if o.get('texts') else .8
            if area(inside) < need * area(s) - 1e-6:
                return False, 'subject area '+o['key']
            if o.get('texts') and not any(text_state(tx) == 'in' for tx in o['texts']):
                return False, 'subject no word '+o['key']
            if o.get('whole'):
                if s[0] < sx0 or s[2] > sx1 or s[1] < sy0 or s[3] > sy1:
                    return False, 'subject not whole '+o['key']
            vis.append(o)
    return True, vis

WHY = [{}]
def solve_single(usage_sets, kind, band, zr, rect=(0, 0, 1080, 1920), forbid=()):
    WHY[0] = {}
    fx, fy = (band['x0'] + band['x1']) / 2, (band['y0'] + band['y1']) / 2
    allsub = [o for row in usage_sets for o in row[0]]
    if not allsub:
        return None
    ux0 = min(o['bbox'][0] for o in allsub); ux1 = max(o['bbox'][2] for o in allsub)
    uy0 = min(o['bbox'][1] for o in allsub); uy1 = max(o['bbox'][3] for o in allsub)
    z = zr[1]
    order = 'down' if kind != 'wide' else 'up'
    zs = [round(zr[1] - i * 0.04, 3) for i in range(int((zr[1] - zr[0]) / 0.04) + 1)]
    if order == 'up':
        zs = zs[::-1]
    for z in zs:
        # feasible centre interval from the subjects alone, then a fine search inside it
        # a loose search window round the subjects; ok_camera applies the exact text-level rule
        cxlo, cxhi = ux0 - 120, ux1 + 120
        cylo, cyhi = uy0 - 160, uy1 + 160
        best = None
        reasons = {}
        mx, my = (ux0 + ux1) / 2, (uy0 + uy1) / 2
        step = 8
        cxs = [cxlo + i * step for i in range(int((cxhi - cxlo) / step) + 1)] or [cxlo]
        cys = [cylo + i * step for i in range(int((cyhi - cylo) / step) + 1)] or [cylo]
        cxs.sort(key=lambda v: abs(v - mx)); cys.sort(key=lambda v: abs(v - my))
        for cx in cxs:
            for cy in cys:
                ok, vis = ok_camera(z, cx, cy, fx, fy, usage_sets, rect)
                if not ok: reasons[vis] = reasons.get(vis, 0) + 1; WHY[0] = reasons
                if ok and not any(o['key'] in forbid for o in vis):
                    best = (z, cx, cy, vis); break
            if best:
                break
        if best and order == 'down':
            z0, cx0, cy0, _ = best
            for zf in [round(z0 + 0.03 - i * 0.01, 3) for i in range(3)]:
                if zf > zr[1]:
                    continue
                hit = None
                for dx in range(-16, 17, 2):
                    for dy in range(-16, 17, 2):
                        ok, vis2 = ok_camera(zf, cx0 + dx, cy0 + dy, fx, fy, usage_sets, rect)
                        if ok and not any(o['key'] in forbid for o in vis2):
                            hit = (zf, cx0 + dx, cy0 + dy, vis2); break
                    if hit: break
                if hit:
                    best = hit; break
        if best:
            z, cx, cy, vis = best
            w, h = (band['x1'] - band['x0']) / z, (band['y1'] - band['y0']) / z
            return dict(z=z, cx=cx, cy=cy, box=[round(cx - w / 2, 1), round(cy - h / 2, 1), round(cx + w / 2, 1), round(cy + h / 2, 1)],
                        visible=sorted({o['key'] for o in vis}))
    return None

def main():
    usages = load()
    result = {}
    for view, shots in sorted(usages.items()):
        kind = kind_of(view)
        if kind == 'wide' and shots[0]['scene'] in ('s1', 's2', 's3', 's4', 's5'):
            # the whole-room wide stays the identity camera; report whether it holds
            sets = [(*classify(s), ymin_for(s)) for s in shots]
            ok, vis = ok_camera(1.0, 470, 810, 470, 810, sets, (0, 0, 1080, 1920))
            result[view] = dict(identity=True, ok=ok, shots=[s['variant'] + ':' + s['shot'] for s in shots])
            if not ok:
                # say what breaks it
                bad = []
                for (subs, others, ym) in sets:
                    for o in subs + others:
                        s = screen(o['bbox'], 1, 470, 810, 470, 810)
                        if o.get('minText') and o['minText'] < LEGIBLE: bad.append((o['key'], 'text', o['minText']))
                        if s[2] > SAFE_X1 or s[0] < SAFE_X0 or s[3] > SAFE_Y1 or s[1] < ym: bad.append((o['key'], 'bounds', [round(v) for v in s]))
                result[view]['why'] = sorted({str(b) for b in bad})
            continue
        if kind == 'split':
            res = None
            subj_keys = sorted({o['key'] for s in shots for o in classify(s)[0]})
            masks = [1] if SPLIT_ITEMS.get(view) else range(1, 2 ** len(subj_keys) - 1)
            for mask in masks:
                part0 = {k for i, k in enumerate(subj_keys) if mask >> i & 1}
                cams = []
                okall = True
                vis0 = set()
                for p in (0, 1):
                    want = part0 if p == 0 else set(subj_keys) - part0
                    sets = []
                    iso = SPLIT_ITEMS.get(view)
                    for s in shots:
                        subs, others = classify(s)
                        if iso:
                            keep = set(iso[p])
                            subs = [dict(o, whole=(o['bbox'][2]-o['bbox'][0] <= 420 and o['bbox'][3]-o['bbox'][1] <= 260)) for o in subs if set(o['items']) & keep or o['key'] in keep]
                            others = [o for o in others if (set(o['items']) & keep or o['key'] in keep) and o['key'] != 'tabs']
                            sets.append((subs, others, ymin_for(s), words_for(s, keep)))
                            continue
                        sub_p = [o for o in subs if o['key'] in want]
                        oth_p = others + [o for o in subs if o['key'] not in want]
                        sets.append((sub_p, oth_p, ymin_for(s)))
                    P = PANES[p]
                    band = dict(x0=P[0] + 10, y0=P[1] + 10, x1=P[2] - 10, y1=P[3] - 10)
                    r = solve_single(sets, 'split', band, ZR['split'], rect=P, forbid=vis0 if p == 1 else ())
                    if not r:
                        okall = False; break
                    cams.append(r)
                    if p == 0:
                        vis0 = set(r['visible'])
                if okall:
                    score = min(c['z'] for c in cams)
                    if not res or score > res['score']:
                        res = dict(score=score, panes=cams, part0=sorted(part0))
            result[view] = res or dict(fail=True, subjects=subj_keys)
            continue
        sets = [(*classify(s), ymin_for(s), words_for(s)) for s in shots]
        band = CHECK if kind == 'check' else BAND
        r = solve_single(sets, kind, band, ZR[kind])
        result[view] = r or dict(fail=True, subjects=sorted({o['key'] for s in sets for o in s[0]}), why=sorted(WHY[0].items(), key=lambda kv: -kv[1])[:4])
        result[view]['shots'] = [s['variant'] + ':' + s['shot'] for s in shots]
    json.dump(result, open(f'{SP}/solve.json', 'w'), indent=1)
    for v, r in result.items():
        if r.get('identity'):
            print(f"{v:18s} identity ok={r['ok']} {r.get('why','')}")
        elif r.get('fail'):
            print(f"{v:18s} FAIL subjects={r.get('subjects')} shots={r.get('shots')} why={r.get('why')}")
        elif 'panes' in r:
            print(f"{v:18s} split z={[round(c['z'],2) for c in r['panes']]} boxes={[c['box'] for c in r['panes']]} part0={r['part0']} vis={[c['visible'] for c in r['panes']]}")
        else:
            print(f"{v:18s} z={r['z']:.2f} box={r['box']} vis={r['visible']} shots={r['shots']}")

main()
