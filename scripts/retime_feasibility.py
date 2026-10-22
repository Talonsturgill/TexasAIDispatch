"""Free authored-clock feasibility check. Never produces measured timing or approval."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import documentary_check
import modern_film


def problems(board):
    """Check the compiler's topology and project its formulas on the planning clock.

    Real speech can change durations. Passing this gate says only that the authored
    plan is internally compilable; acoustic alignment and measured gates still run.
    No input is changed and no synthetic word or acoustic evidence is constructed.
    """
    plan = board.get('narration_picture') or {}
    errors = modern_film.narration_event_problems(board)
    if plan.get('timing_mode') != 'authored':
        return errors
    clauses = plan.get('clauses') or []
    shots = (board.get('film_direction') or {}).get('shots') or []
    if not clauses or not shots:
        return ['authored retiming requires narration clauses and executable shots']
    scenes = {s['id']: s for s in board.get('scenes', [])}
    by_id = {c.get('id'): c for c in clauses}
    if None in by_id or len(by_id) != len(clauses):
        errors.append('authored narration clauses need unique nonempty identities')
    assigned = {cid: [] for cid in by_id}
    for shot in shots:
        ids = shot.get('narration_ids')
        if not isinstance(ids, list) or len(ids) != 1 or ids[0] not in by_id:
            errors.append(f"{shot.get('id')}: authored shot needs exactly one known narration clause")
            continue
        cid = ids[0]
        if shot.get('scene_id') != by_id[cid].get('scene_id'):
            errors.append(f"{shot.get('id')}: shot and narration clause belong to different scenes")
        assigned[cid].append(shot)
    for cid, group in assigned.items():
        if not group:
            errors.append(f"{cid}: no exclusive executable shot for the narration clause")

    doc = documentary_check.policy()
    film = modern_film.policy()
    projected_shots, projected_events = {}, {}
    for sid, scene in scenes.items():
        rows = [c for c in clauses if c.get('scene_id') == sid]
        for index, row in enumerate(rows):
            cid = row['id']
            start, end = row.get('start_s'), row.get('end_s')
            if not all(modern_film.finite(x) for x in (start, end)) or end <= start:
                errors.append(f"{cid}: authored clause needs a finite positive window")
                continue
            lo = scene['start_s'] if index == 0 else (rows[index-1]['end_s'] + start) / 2
            hi = scene['start_s'] + scene['duration_s'] if index+1 == len(rows) else (end + rows[index+1]['start_s']) / 2
            group = assigned[cid]
            for n, shot in enumerate(group):
                a = lo + (hi-lo)*n/len(group)
                b = lo + (hi-lo)*(n+1)/len(group)
                projected_shots[shot['id']] = (a, b)
                if b <= a or b-a > film['max_shot_s'] + .0001:
                    errors.append(f"{shot['id']}: projected authored shot is empty or exceeds the shot limit")
        for event in scene.get('visual_events', []):
            eid = event.get('id')
            row = by_id.get(event.get('narration_id'))
            if not row or row.get('scene_id') != sid:
                errors.append(f"{eid}: event needs a known narration clause in its scene")
                continue
            values = (row.get('start_s'), row.get('end_s'),
                      event.get('clause_fraction_start'), event.get('clause_fraction_end'))
            if not all(modern_film.finite(x) for x in values) or values[1] <= values[0] or values[3] <= values[2]:
                errors.append(f"{eid}: event needs finite ordered authored clause fractions")
                continue
            start, end, low, high = values
            a, b = start + low*(end-start), start + high*(end-start)
            projected_events[eid] = (a, b)
            duration = round(b-a, 4)
            if not doc['min_transition_s'] <= duration <= doc['max_transition_s']:
                errors.append(f"{eid}: projected authored action duration {duration:g}s is outside directed range")
            if a < scene['start_s']-.001 or b > scene['start_s']+scene['duration_s']+.001:
                errors.append(f"{eid}: projected authored event leaves its scene")
            at, declared = event.get('at_s'), event.get('duration_s')
            if (not all(modern_film.finite(x) for x in (at, declared))
                    or abs(a-scene['start_s']-at) > .011 or abs(duration-declared) > .011):
                errors.append(f"{eid}: authored event window disagrees with its clause-fraction projection")
    # Preserve the compiler's ordered subdivision, including several useful views
    # of one clause. Do not permit interleaved clause ownership to reorder the film.
    cursor = None
    for shot in shots:
        interval = projected_shots.get(shot.get('id'))
        if interval is None:
            continue
        a, b = interval
        if cursor is not None and abs(a-cursor) > .011:
            errors.append(f"{shot['id']}: projected authored shots have a gap, overlap or reordered clause")
        cursor = b
        event = projected_events.get(shot.get('event_id'))
        if event is None or event[0] >= b or event[1] <= a:
            errors.append(f"{shot['id']}: projected authored shot has no overlapping performed event")
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--board', type=Path, required=True)
    args = parser.parse_args()
    try:
        board = json.loads(args.board.read_text())
        errors = problems(board)
        print(json.dumps({'schema': 'dispatch_authored_retime_feasibility/1',
                          'planning_only': True, 'approval': False,
                          'applicable': (board.get('narration_picture') or {}).get('timing_mode') == 'authored',
                          'pass': not errors, 'problems': errors}))
        return int(bool(errors))
    except (OSError, ValueError, KeyError, TypeError, ZeroDivisionError) as exc:
        print('authored retime feasibility refused: ' + str(exc))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
