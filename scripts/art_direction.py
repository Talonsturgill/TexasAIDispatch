"""Validate executable art choices before spending on voice or rendering.

This validates inputs and source/scene references. Artistic approval still comes
from the existing independent film reviews, never from this checker.
"""
from pathlib import Path
from datetime import date
import json
import math
import re

REPO = Path(__file__).resolve().parents[1]
POLICY = REPO / 'config/art_direction.json'


def required(board):
    cfg = json.loads(POLICY.read_text())
    if 'art_direction' in board:
        return True
    try:
        return date.fromisoformat(str(board.get('date', ''))[:10]) >= date.fromisoformat(cfg['effective_date'])
    except ValueError:
        return False


def finite(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def vector(value):
    return isinstance(value, list) and len(value) == 3 and all(finite(v) and abs(v) <= 1000 for v in value)


def prose(value):
    return isinstance(value, str) and len(value.strip()) >= 20


def problems(board, repo=REPO):
    if not required(board):
        return []
    cfg = json.loads(POLICY.read_text())
    art = board.get('art_direction')
    if not isinstance(art, dict):
        return ['current board requires an executable art_direction profile']
    errors = []
    if art.get('version') != cfg['profile_version']:
        errors.append('art direction uses an unsupported profile version')
    palette = art.get('palette') or {}
    if not isinstance(palette, dict) or set(palette) != set(cfg['palette_roles']) or any(
            not isinstance(c, str) or not re.fullmatch(r'#[0-9a-fA-F]{6}', c) for c in palette.values()):
        errors.append('art palette requires seven named six-digit colors')
    for key in ('palette_reason', 'shape_language', 'focal_hierarchy', 'motion_language'):
        if not prose(art.get(key)):
            errors.append('art direction requires concrete ' + key)
    lights = art.get('lighting') or {}
    if not isinstance(lights, dict):
        lights = {}
    if not prose(lights.get('motivation')):
        errors.append('lighting needs its scene-specific motivation or retained source lighting')
    for key, lo, hi in (('ambient', 0, 2), ('exposure', .2, 3)):
        if not finite(lights.get(key)) or not lo <= lights[key] <= hi:
            errors.append('lighting has invalid ' + key)
    for key in ('key', 'fill', 'rim'):
        row = lights.get(key) or {}
        if not isinstance(row, dict) or not vector(row.get('position')) or not re.fullmatch(
                r'#[0-9a-fA-F]{6}', str(row.get('color', ''))) or not finite(row.get('intensity')) or not 0 <= row['intensity'] <= 150:
            errors.append('lighting has an invalid ' + key + ' light')
    scenes = {s['id']: s for s in board.get('scenes', [])}
    events = {e.get('id'): (s['id'], e) for s in scenes.values() for e in s.get('visual_events', []) if e.get('id')}
    subjects = {i for s in scenes.values() for e in s.get('visual_events', []) for i in e.get('item_ids', [])}
    hero = art.get('hero') or {}
    if not isinstance(hero, dict):
        hero = {}
    if not all(prose(hero.get(k)) for k in ('silhouette', 'finish')):
        errors.append('hero needs a recognizable silhouette and specified finish')
    refs = hero.get('subject_ids')
    if not isinstance(refs, list) or not refs or any(not isinstance(i, str) for i in refs) or not set(refs) <= subjects:
        errors.append('hero subjects must be actual current event subjects')
    asset = str(hero.get('asset', ''))
    if asset.startswith('source:'):
        if not any(m.get('file') == asset[7:] and m.get('sha256') for m in board.get('native_media', [])):
            errors.append('hero source asset lacks the current native-media binding')
    else:
        candidate = (Path(repo) / asset).resolve()
        if not asset or not candidate.is_relative_to(Path(repo).resolve()) or not candidate.is_file():
            errors.append('hero asset must resolve inside the current renderer repository')
    signature = art.get('signature_shot') or {}
    if not isinstance(signature, dict) or signature.get('scene_id') not in scenes or events.get(
            signature.get('event_id'), (None,))[0] != signature.get('scene_id') or not prose(signature.get('reason')):
        errors.append('signature shot must reveal an actual event in its current scene')
    shots = art.get('shots')
    if not isinstance(shots, dict):
        shots = {}
        errors.append('art shots must be a scene-keyed object')
    mediums = {r.get('scene_id'): r.get('medium') for r in (board.get('quality_plan') or {}).get('scenes', [])}
    dimensional = {sid for sid in scenes if mediums.get(sid) == 'dimensional'}
    if not dimensional <= set(shots) or not set(shots) <= set(scenes):
        errors.append('art shots must cover dimensional scenes and name only current scenes')
    for sid, shot in shots.items():
        if not isinstance(shot, dict):
            errors.append('invalid art shot ' + sid)
            continue
        if not prose(shot.get('reason')):
            errors.append(sid + ' shot needs a purpose tied to the action')
        for pose in [shot] + ([shot['to']] if 'to' in shot else []):
            if not isinstance(pose, dict) or not vector(pose.get('position')) or not vector(pose.get('target')) or not finite(pose.get('fov')) or not 15 <= pose['fov'] <= 120 or pose['position'] == pose['target']:
                errors.append(sid + ' shot needs a finite distinct camera/target and bounded lens')
        if 'to' in shot and events.get(shot.get('event_id'), (None,))[0] != sid:
            errors.append(sid + ' camera move must follow an actual event in that scene')
    flat = art.get('flat_shots', {})
    if not isinstance(flat, dict):
        flat = {}
        errors.append('flat shots must be a scene-keyed object')
    if board.get('cinematic_template') == 'carton-unload-illustrated-v1' and set(flat) != set(scenes):
        errors.append('illustrated carton route requires a flat shot for every current scene')
    for sid, shot in flat.items():
        if sid not in scenes or not isinstance(shot, dict) or not prose(shot.get('reason')) or any(
                not finite(shot.get(k)) or abs(shot[k]) > 400 for k in ('x', 'y')) or not finite(shot.get('scale')) or not .5 <= shot['scale'] <= 3 or ('follow_load' in shot and not isinstance(shot['follow_load'], bool)):
            errors.append('flat shot requires current scene, bounded framing and concrete purpose')
    for sid, event in events.values():
        motion = event.get('motion')
        if not isinstance(motion, dict) or motion.get('curve') not in cfg['motion_curves']:
            errors.append(sid + ' event requires a supported explicit motion curve')
            continue
        for key, maximum in (('anticipation', cfg['max_anticipation_fraction']), ('settle', cfg['max_settle_fraction'])):
            value = motion.get(key, 0)
            if not finite(value) or not 0 <= value <= maximum:
                errors.append(sid + ' event has invalid ' + key)
        if motion['curve'] == 'landing' and not prose(motion.get('free_prop_reason')):
            errors.append(sid + ' landing overshoot requires a free-prop reason; never overshoot a constrained contact')
    return sorted(set(errors))
