"""Recompute a retained approved edit on the measured clock without approving new art.

This explicit recovery adapter keeps the original board and independent report as exact
JSON text. Every use reproduces the projection and verifies all semantic fields. It is
not an admission path for newly authored boards or a replacement for exact-film review.
"""
from __future__ import annotations

import copy
import hashlib
import json
import math

SCHEMA = 'dispatch-approved-measured-retime/1'
KEY = 'approved_retime'


def digest(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def receipt(board):
    return ((board.get('narration_picture') or {}).get('timing_provenance') or {}).get(KEY)


def originals(proof):
    if not isinstance(proof, dict) or proof.get('schema') != SCHEMA:
        raise ValueError('approved retime requires its original provenance schema')
    values = []
    for key in ('board', 'critique'):
        text = proof.get(key + '_json')
        if not isinstance(text, str) or digest(text) != proof.get(key + '_sha256'):
            raise ValueError('approved retime original ' + key + ' bytes changed')
        values.append(json.loads(text))
    board, report = values
    if receipt(board):
        raise ValueError('approved retime cannot chain or replace an earlier approval')
    import critic_gate
    from independent_review import evidence_problems
    if (report.get('verdict') != 'pass' or evidence_problems(report)
            or report.get('concept_sha256') != critic_gate.concept_digest(board)
            or not report.get('reviewer_identity') or not report.get('reviewed_at')):
        raise ValueError('approved retime requires the genuine passing original concept report')
    if proof.get('concept_sha256') != report['concept_sha256']:
        raise ValueError('approved retime changed the original independent concept identity')
    return board, report


def _semantic(board):
    """Only clock/caption/credit outputs can differ; unknown fields stay binding."""
    data = copy.deepcopy(board)
    for key in ('runtime_s', 'credits_s', 'credits', 'captions', 'caption_method',
                'retimed_to', 'retime_evidence', '_retime_moved'):
        data.pop(key, None)
    narration = data['narration_picture']
    narration.pop('timing_provenance', None)
    narration.pop('timing_mode', None)
    for clause in narration['clauses']:
        for key in ('start_s', 'end_s', 'word_range', 'cue_ids'):
            clause.pop(key, None)
    for shot in data['film_direction']['shots']:
        for key in ('start_s', 'duration_s', 'scene_fraction_start', 'scene_fraction_end'):
            shot.pop(key, None)
    for reward in data['film_direction']['rewards']:
        reward.pop('at_s', None)
    for scene in data['scenes']:
        for key in ('start_s', 'duration_s', 'duration_authored', 'caption'):
            scene.pop(key, None)
        for event in scene.get('visual_events', []):
            # The baseline's absolute action clock remains the projection input.
            for key in ('at_s', 'duration_s', 'at_s_authored', 'duration_s_authored'):
                event.pop(key, None)
    return data


def attach(board, original_text, critique_text):
    """Opt in explicitly while still on the unchanged approved authored board."""
    original = json.loads(original_text)
    report = json.loads(critique_text)
    proof = {'schema': SCHEMA, 'board_json': original_text,
             'board_sha256': digest(original_text), 'critique_json': critique_text,
             'critique_sha256': digest(critique_text),
             'concept_sha256': report.get('concept_sha256')}
    originals(proof)
    if receipt(board) or _semantic(board) != _semantic(original):
        raise ValueError('approved retime cannot adopt a changed creative plan')
    for current, prior in zip(board['film_direction']['shots'], original['film_direction']['shots']):
        if any(current.get(k) != prior.get(k) for k in ('scene_fraction_start', 'scene_fraction_end')):
            raise ValueError('approved retime cannot replace the original editorial anchors')
    for current, prior in zip(board['scenes'], original['scenes']):
        for event, old in zip(current['visual_events'], prior['visual_events']):
            if any(event.get(k) != old.get(k) for k in ('at_s_authored', 'duration_s_authored')):
                raise ValueError('approved retime cannot replace the original physical action anchors')
    board['narration_picture'].setdefault('timing_provenance', {})[KEY] = proof
    return board


def _warp(points, value):
    for (left, a), (right, b) in zip(points, points[1:]):
        if left - .00001 <= value <= right + .00001:
            if right <= left or b <= a:
                raise ValueError('approved retime has non-increasing acoustic anchors')
            return a + (value-left) * (b-a) / (right-left)
    raise ValueError('approved retime authored action leaves its source-bound scene')


def _constrain_scene_cuts(board, min_scene):
    """Keep every cut in measured inter-scene silence while satisfying both floors."""
    import storyboard_check
    scenes = board['scenes']
    groups = [[c for c in board['narration_picture']['clauses'] if c['scene_id'] == s['id']]
              for s in scenes]
    if any(not group for group in groups):
        raise ValueError('approved scene constraint requires complete measured spoken scene bounds')
    preferred = [s['start_s'] for s in scenes] + [board['runtime_s']]
    lower, upper = [0.0], [0.0]
    for left, right in zip(groups, groups[1:]):
        lo, hi = left[-1]['end_s'], right[0]['start_s']
        if not math.isfinite(lo) or not math.isfinite(hi) or hi <= lo:
            raise ValueError('approved scene cut has no genuine measured silence interval')
        lower.append(lo); upper.append(hi)
    lower.append(board['runtime_s']); upper.append(board['runtime_s'])
    ceiling = storyboard_check.HARD_MAX_SCENE_S
    # Propagate difference constraints to a fixed point before choosing any cut.
    for _ in range(len(preferred)*2):
        before = (lower[:], upper[:])
        for i in range(len(scenes)):
            lower[i+1] = max(lower[i+1], lower[i]+min_scene)
            upper[i+1] = min(upper[i+1], upper[i]+ceiling)
        for i in range(len(scenes)-1, -1, -1):
            lower[i] = max(lower[i], lower[i+1]-ceiling)
            upper[i] = min(upper[i], upper[i+1]-min_scene)
        if any(lo > hi+.000001 for lo, hi in zip(lower, upper)):
            raise ValueError('approved scenes cannot fit measured silence within the unchanged scene limits')
        if before == (lower, upper):
            break
    cuts = [0.0]
    for i in range(1, len(preferred)):
        lo = max(lower[i], cuts[-1]+min_scene)
        hi = min(upper[i], cuts[-1]+ceiling)
        if lo > hi+.000001:
            raise ValueError('approved measured scene cut has no admissible position')
        cuts.append(round(min(max(preferred[i], lo), hi), 4))
    changes = []
    for i, scene in enumerate(scenes):
        if abs(cuts[i]-preferred[i]) > .00001:
            changes.append({'scene_id': scene['id'], 'from_s': preferred[i], 'to_s': cuts[i],
                            'measured_silence': [groups[i-1][-1]['end_s'], groups[i][0]['start_s']],
                            'reason': 'unchanged scene duration floor and ceiling'})
        scene.update(start_s=cuts[i], duration_s=round(cuts[i+1]-cuts[i], 4))
    return changes


def _project(board, proof, captions, words, min_scene, lead):
    original, report = originals(proof)
    if _semantic(board) != _semantic(original):
        raise ValueError('approved retime changed shots, sources, actions, event fractions or another creative field')
    import board_retime
    import modern_film as modern
    import documentary_check
    import critic_gate
    import storyboard_check
    if report.get('renderer_sha256') != critic_gate.renderer_digest(original):
        raise ValueError('approved retime original reviewer belongs to different renderer bytes')
    if (not isinstance(min_scene, (int, float)) or not math.isfinite(min_scene)
            or min_scene < board_retime.MIN_SCENE_DEFAULT or lead != board_retime.LEAD_DEFAULT):
        raise ValueError('approved retime preserves the standard scene floor and measured lead')
    expected = copy.deepcopy(original)
    for key in ('runtime_s', 'credits_s', 'credits'):
        if key in board:
            expected[key] = copy.deepcopy(board[key])
    expected['captions'] = copy.deepcopy(captions['cues'])
    expected['caption_method'] = captions['method']
    expected, errors = board_retime.retime(expected, words['words'], min_scene, lead,
                                         _compile_modern=False)
    if errors:
        raise ValueError('; '.join(errors))
    modern.compile_narration_clock(expected, captions, words)
    scene_adjustments = _constrain_scene_cuts(expected, min_scene)
    old_scenes = {s['id']: s for s in original['scenes']}
    new_scenes = {s['id']: s for s in expected['scenes']}
    old_clauses = {c['id']: c for c in original['narration_picture']['clauses']}
    clocks = {}
    for sid, scene in new_scenes.items():
        old = old_scenes[sid]
        points = [(old['start_s'], scene['start_s'])]
        for clause in expected['narration_picture']['clauses']:
            if clause['scene_id'] != sid:
                continue
            prior = old_clauses[clause['id']]
            points += [(prior['start_s'], clause['start_s']), (prior['end_s'], clause['end_s'])]
        points += [(old['start_s']+old['duration_s'], scene['start_s']+scene['duration_s'])]
        if any(right <= left or b <= a for (left, a), (right, b) in zip(points, points[1:])):
            raise ValueError('approved retime requires distinct ordered authored and measured clause edges')
        clocks[sid] = points
    for shot, prior in zip(expected['film_direction']['shots'], original['film_direction']['shots']):
        scene = new_scenes[shot['scene_id']]
        points = clocks[shot['scene_id']]
        start = _warp(points, prior['start_s'])
        end = _warp(points, prior['start_s']+prior['duration_s'])
        start, duration = modern.measured_shot_interval(start, end)
        shot.update(start_s=start, duration_s=duration,
                    scene_fraction_start=(start-scene['start_s'])/scene['duration_s'],
                    scene_fraction_end=(start+duration-scene['start_s'])/scene['duration_s'])
    adjustments = []
    cfg = json.loads((modern.REPO/'config/documentary.json').read_text())
    hook = expected.get('documentary', {}).get('hook_payoff_event')
    for sid, scene in new_scenes.items():
        old = old_scenes[sid]
        for event, prior in zip(scene['visual_events'], old['visual_events']):
            begin = old['start_s'] + prior['at_s']
            start = _warp(clocks[sid], begin)
            end = _warp(clocks[sid], begin+prior['duration_s'])
            # Do not stretch an approved brisk action into a whole spoken clause.
            duration = min(prior['duration_s'], end-start)
            clauses = [c for c in expected['narration_picture']['clauses']
                       if c['scene_id'] == sid and (c['id'] == event['narration_id']
                                                   or event['id'] in c.get('event_ids', []))]
            if not clauses:
                raise ValueError('approved action has no original narrated subject interval')
            low = max(scene['start_s'], min(c['start_s'] for c in clauses))
            high = min(scene['start_s']+scene['duration_s'], max(c['end_s'] for c in clauses))-duration
            if (scene['duration_s'] > storyboard_check.MAX_SCENE_S+.001
                    and prior is old['visual_events'][-1]):
                # Round upward so a decimal boundary cannot land microscopically early.
                late = math.ceil(scene['duration_s']*storyboard_check.LATE_BEAT_FRACTION*10000)/10000
                low = max(low, scene['start_s']+late)
            for shot in expected['film_direction']['shots']:
                if shot.get('event_id') == event['id']:
                    low = max(low, shot['start_s']-duration+.0002)
                    high = min(high, shot['start_s']+shot['duration_s']-.0002)
            for reward in expected['film_direction']['rewards']:
                if reward['event_id'] == event['id']:
                    shot = next(s for s in expected['film_direction']['shots'] if s['id'] == reward['shot_id'])
                    offset = duration*reward['event_fraction']
                    low = max(low, shot['start_s']-offset)
                    high = min(high, shot['start_s']+shot['duration_s']-offset)
            if event['id'] == hook:
                high = min(high, cfg['first_payoff_by_s']-duration)
            if low > high+.00001:
                raise ValueError('approved action cannot fit its measured narration, original shot/reward and payoff constraints: '+event['id'])
            moved = min(max(start, low), high)
            if abs(moved-start) > .00001:
                adjustments.append({'event_id': event['id'], 'from_s': round(start, 4),
                                    'to_s': round(moved, 4),
                                    'reason': 'original narration, shot, reward and payoff constraints'})
            start = moved
            event.update(at_s=round(start-scene['start_s'], 4), duration_s=round(duration, 4),
                         at_s_authored=prior.get('at_s_authored', prior['at_s']),
                         duration_s_authored=prior.get('duration_s_authored', prior['duration_s']))
        if any(b['at_s'] < a['at_s'] for a, b in zip(scene['visual_events'], scene['visual_events'][1:])):
            raise ValueError('approved measured retime would reverse the authored physical action order')
    events = {e['id']: (s, e) for s in expected['scenes'] for e in s['visual_events']}
    for reward in expected['film_direction']['rewards']:
        scene, event = events[reward['event_id']]
        reward['at_s'] = round(scene['start_s']+event['at_s']+event['duration_s']*reward['event_fraction'], 4)
    errors = modern.narration_problems(expected, captions, words)
    errors += modern.problems(expected) + documentary_check.check(expected) + storyboard_check.check(expected)
    if errors:
        raise ValueError('; '.join(sorted(set(errors))))
    expected.pop('_retime_moved', None)
    proof = copy.deepcopy(proof)
    proof.update(captions=copy.deepcopy(captions), words=copy.deepcopy(words),
                 min_scene=min_scene, lead=lead, adjustments=adjustments,
                 scene_cut_adjustments=scene_adjustments)
    expected['narration_picture']['timing_provenance'][KEY] = proof
    return expected


def compile(board, captions, words, *, min_scene=None, lead=None):
    proof = receipt(board)
    if proof is None:
        raise ValueError('approved retime requires explicit retained approval')
    import board_retime
    min_scene = proof.get('min_scene', board_retime.MIN_SCENE_DEFAULT) if min_scene is None else min_scene
    lead = proof.get('lead', board_retime.LEAD_DEFAULT) if lead is None else lead
    expected = _project(board, proof, captions, words, min_scene, lead)
    board.clear(); board.update(expected)
    return board


def problems(board):
    proof = receipt(board)
    if proof is None:
        return []
    try:
        expected = _project(board, proof, proof['captions'], proof['words'], proof['min_scene'], proof['lead'])
        current = copy.deepcopy(board)
        current.pop('_retime_moved', None)
        if current != expected:
            return ['approved measured retime does not reproduce its exact original plan and acoustic evidence']
        return []
    except (KeyError, TypeError, ValueError, OSError) as exc:
        return ['approved measured retime provenance invalid: ' + str(exc)]


def approved_identity(board):
    errors = problems(board)
    if errors:
        raise ValueError('; '.join(errors))
    return receipt(board)['concept_sha256']
