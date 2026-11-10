"""Frame-align the authored planning clock of both 2026-11-10 treatments.

Scene-builder, 2026-11-10 (reservation event 32). Failure evidence:
out/dispatch/builder-proof-render-failure-2026-11-10.log. DirectedFilm rounds shot starts
to native frames while narration clauses stay active until their exact two-decimal end,
so frame 257 showed s2-shot-3 under the still-active clause n2b.

This moves every clause boundary, scene boundary and shot cut onto a whole 1/30 s frame
(nearest frame, half up like Math.round), stored as the exact double k/30 so JS
`frame/fps` compares equal at the boundary frame. Event windows are regenerated from the
frozen clause fractions, rewards from the frozen event fractions, and shot fractional
anchors from the frame-aligned cuts, using modern_film.compile_narration's formulas.
Narration ids, words, cue ids, claim ids, subject/action ids, views and fractions are
unchanged. Planning clock only: board_retime replaces it after voice. Approves nothing.

Usage: python3 frame_snap.py --root out/dispatch [--write]
"""
from __future__ import annotations

import argparse
import copy
import json
import math
from pathlib import Path

FPS = 30


def frame(t):
    return math.floor(t * FPS + 0.5)


def timing_body(board):
    return {
        'scenes': [(s['id'], s['start_s'], s['duration_s']) for s in board['scenes']],
        'clauses': [(c['id'], c['scene_id'], c['start_s'], c['end_s'], c['cue_ids'], c['word_range'], c['text'])
                    for c in board['narration_picture']['clauses']],
        'captions': [(c['id'], c['start'], c['end'], c['text']) for c in board['captions']],
        'events': [(e['id'], e['narration_id'], e['clause_fraction_start'], e['clause_fraction_end'])
                   for s in board['scenes'] for e in s['visual_events']],
        'runtime': board['runtime_s'],
    }


def frame_map(board):
    values = {s['start_s'] for s in board['scenes']}
    values.add(max(s['start_s'] + s['duration_s'] for s in board['scenes']))
    for c in board['narration_picture']['clauses']:
        values.update((c['start_s'], c['end_s']))
    ordered = sorted(values)
    mapping = {t: frame(t) for t in ordered}
    frames = [mapping[t] for t in ordered]
    if any(b <= a for a, b in zip(frames, frames[1:])):
        raise ValueError('frame snapping collapses or reorders distinct boundaries')
    return mapping


def snap(board):
    board = copy.deepcopy(board)
    fm = frame_map(board)
    scenes = board['scenes']
    end_t = max(s['start_s'] + s['duration_s'] for s in scenes)
    kscene = {}
    for i, s in enumerate(scenes):
        ks = fm[s['start_s']]
        ke = fm[scenes[i + 1]['start_s']] if i + 1 < len(scenes) else fm[end_t]
        kscene[s['id']] = (ks, ke)
        s['start_s'] = ks / FPS
        s['duration_s'] = (ke - ks) / FPS
        s['duration_authored'] = s['duration_s']
    board['runtime_s'] = fm[end_t] / FPS

    plan = board['narration_picture']
    kclause = {}
    for c in plan['clauses']:
        kclause[c['id']] = (fm[c['start_s']], fm[c['end_s']])
        c['start_s'] = kclause[c['id']][0] / FPS
        c['end_s'] = kclause[c['id']][1] / FPS
    cue_owner = {cue: c for c in plan['clauses'] for cue in c['cue_ids']}
    for cue in board['captions']:
        owner = cue_owner[cue['id']]
        if len(owner['cue_ids']) != 1:
            raise ValueError('one cue per clause expected on this planning board')
        cue['start'], cue['end'] = owner['start_s'], owner['end_s']

    # Shots: the authored projection (scene edge or clause handoff midpoint), whole frames.
    shots = board['film_direction']['shots']
    rows_by_scene = {}
    for c in plan['clauses']:
        rows_by_scene.setdefault(c['scene_id'], []).append(c)
    for sid, rows in rows_by_scene.items():
        ks, ke = kscene[sid]
        for n, row in enumerate(rows):
            lo = ks if n == 0 else (kclause[rows[n - 1]['id']][1] + kclause[row['id']][0]) / 2
            hi = ke if n + 1 == len(rows) else (kclause[row['id']][1] + kclause[rows[n + 1]['id']][0]) / 2
            group = [s for s in shots if s.get('narration_ids') == [row['id']]]
            if not group:
                raise ValueError(row['id'] + ': no exclusive shot')
            cuts = [lo + (hi - lo) * k / len(group) for k in range(len(group) + 1)]
            cuts = [ks if k == 0 and n == 0 else math.floor(x + 0.5) for k, x in enumerate(cuts)]
            for k, shot in enumerate(group):
                a, b = cuts[k], cuts[k + 1]
                if b <= a:
                    raise ValueError(shot['id'] + ': empty frame-aligned shot')
                shot['start_s'] = a / FPS
                shot['duration_s'] = (b - a) / FPS
                shot['scene_fraction_start'] = (a - ks) / (ke - ks)
                shot['scene_fraction_end'] = (b - ks) / (ke - ks)

    # Events from frozen clause fractions (compile_narration's formula and precision).
    clauses = {c['id']: c for c in plan['clauses']}
    for s in scenes:
        for e in s['visual_events']:
            row = clauses[e['narration_id']]
            start = row['start_s'] + float(e['clause_fraction_start']) * (row['end_s'] - row['start_s'])
            end = row['start_s'] + float(e['clause_fraction_end']) * (row['end_s'] - row['start_s'])
            e['at_s'] = round(start - s['start_s'], 4)
            e['duration_s'] = round(end - start, 4)
            e['at_s_authored'] = e['at_s']
            e['duration_s_authored'] = e['duration_s']

    # Rewards from frozen event fractions; the owning shot must not change.
    events = {e['id']: (s, e) for s in scenes for e in s['visual_events']}
    for reward in board['film_direction']['rewards']:
        s, e = events[reward['event_id']]
        reward['at_s'] = round(s['start_s'] + e['at_s'] + e['duration_s'] * reward['event_fraction'], 4)
        owner = next((x for x in shots if e['narration_id'] in x.get('narration_ids', [])
                      and x['start_s'] - .001 <= reward['at_s'] < x['start_s'] + x['duration_s'] + .001), None)
        if owner is None or owner['id'] != reward['shot_id']:
            raise ValueError(reward['event_id'] + ': reward would change its owning shot')
    return board


def simulate(board):
    """Replay DirectedFilm's native interval and active-clause rule for every story frame."""
    errors = []
    shots = board['film_direction']['shots']
    intervals = [(s, round(s['start_s'] * FPS), round((s['start_s'] + s['duration_s']) * FPS)) for s in shots]
    # JS Math.round is half up; Python round is half even. Reproduce Math.round.
    intervals = [(s, math.floor(s['start_s'] * FPS + .5), math.floor((s['start_s'] + s['duration_s']) * FPS + .5))
                 for s, _, _ in intervals]
    end = max(s['start_s'] + s['duration_s'] for s in board['scenes'])
    clauses = board['narration_picture']['clauses']
    for f in range(math.floor(end * FPS + .5)):
        t = f / FPS
        idx = math.floor(t * FPS + 1e-7)
        match = [s for s, a, b in intervals if a <= idx < b]
        if len(match) != 1:
            errors.append(f'frame {f}: {len(match)} shots')
            continue
        active = [c['id'] for c in clauses if c['start_s'] <= t < c['end_s']]
        if any(cid not in match[0].get('narration_ids', []) for cid in active):
            errors.append(f'frame {f}: {match[0]["id"]} under active clause {active}')
    return errors


def aligned(board):
    errors = []
    def on_frame(name, t):
        if abs(t * FPS - round(t * FPS)) > 1e-9:
            errors.append(f'{name} {t!r} is not on a whole frame')
    for s in board['scenes']:
        on_frame(s['id'] + ' start', s['start_s'])
        on_frame(s['id'] + ' end', s['start_s'] + s['duration_s'])
    for c in board['narration_picture']['clauses']:
        on_frame(c['id'] + ' start', c['start_s'])
        on_frame(c['id'] + ' end', c['end_s'])
    for c in board['captions']:
        on_frame(c['id'] + ' start', c['start'])
        on_frame(c['id'] + ' end', c['end'])
    for s in board['film_direction']['shots']:
        on_frame(s['id'] + ' start', s['start_s'])
        on_frame(s['id'] + ' end', s['start_s'] + s['duration_s'])
    on_frame('runtime', board['runtime_s'])
    return errors


def invariant(before, after):
    """Everything except the planning-clock numbers stays byte-for-byte the same."""
    def strip(b):
        b = copy.deepcopy(b)
        b.pop('runtime_s')
        for s in b['scenes']:
            for k in ('start_s', 'duration_s', 'duration_authored'):
                s.pop(k)
            for e in s['visual_events']:
                for k in ('at_s', 'duration_s', 'at_s_authored', 'duration_s_authored'):
                    e.pop(k)
        for c in b['narration_picture']['clauses']:
            c.pop('start_s'); c.pop('end_s')
        for c in b['captions']:
            c.pop('start'); c.pop('end')
        for s in b['film_direction']['shots']:
            for k in ('start_s', 'duration_s', 'scene_fraction_start', 'scene_fraction_end'):
                s.pop(k)
        for r in b['film_direction']['rewards']:
            r.pop('at_s')
        return b
    return strip(before) == strip(after)


def main():
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument('--root', type=Path, default=Path('out/dispatch'))
    p.add_argument('--write', action='store_true')
    args = p.parse_args()
    boards = {k: json.loads((args.root / f'opening-{k}.json').read_text()) for k in ('a', 'b')}
    story = json.loads((args.root / 'storyboard.json').read_text())
    if story != boards['a']:
        raise SystemExit('storyboard.json must equal opening-a.json before snapping')
    if timing_body(boards['a']) != timing_body(boards['b']):
        raise SystemExit('treatments do not share one planning clock')
    report = {}
    out = {}
    for k, b in boards.items():
        new = snap(b)
        report[k] = {'before_sim_failures': simulate(b)[:3], 'after_sim_failures': simulate(new),
                     'after_alignment_failures': aligned(new), 'non_clock_fields_unchanged': invariant(b, new)}
        out[k] = new
    if timing_body(out['a']) != timing_body(out['b']):
        raise SystemExit('snapped treatments diverged')
    print(json.dumps(report, indent=1))
    ok = all(not r['after_sim_failures'] and not r['after_alignment_failures'] and r['non_clock_fields_unchanged']
             for r in report.values())
    if args.write and ok:
        for k, b in out.items():
            (args.root / f'opening-{k}.json').write_text(json.dumps(b, indent=2) + '\n')
        (args.root / 'storyboard.json').write_text(json.dumps(out['a'], indent=2) + '\n')
    return 0 if ok else 1


if __name__ == '__main__':
    raise SystemExit(main())
