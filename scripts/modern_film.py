"""Active directing route and timed engagement evidence. Never an aesthetic self-grade."""
from pathlib import Path
import hashlib
import json
import math
import re

REPO = Path(__file__).resolve().parents[1]


def policy(repo=REPO):
    return json.loads((Path(repo) / 'config/modern_film.json').read_text())


def required(board):
    # Explicit opt-in supports an isolated engineering comparison without changing history.
    edition = str(board.get('date', ''))[:10]
    return 'film_direction' in board or bool(re.fullmatch(r'\d{4}-\d{2}-\d{2}', edition) and edition >= policy()['effective_date'])


def finite(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def prose(value):
    return isinstance(value, str) and len(value.strip()) >= 20


def renderer_inputs(episode, repo=REPO):
    root = Path(repo).resolve()
    entry = json.loads((root / 'config/modern_episode_registry.json').read_text())['episodes'][episode]
    files = [entry['module'], *entry['assets'], 'video-engine/src/modern/DirectedFilm.tsx',
             'video-engine/src/modern/registry.tsx', 'video-engine/src/modern/types.ts',
             'video-engine/src/modern/StoryArt.tsx',
             'config/modern_episode_registry.json', 'config/modern_film.json']
    rows = []
    for file in files:
        path = (root / file).resolve()
        if not path.is_relative_to(root) or not path.is_file():
            raise ValueError('modern renderer input missing or outside repository')
        rows.append({'path': file, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
    return rows


def capture_timing(board):
    """Freeze fractional editorial anchors before code/phone approval, never audio timing."""
    if not required(board) or not isinstance(board.get('film_direction'), dict):
        return
    scenes = {s['id']: s for s in board['scenes']}
    plan = board['film_direction']
    for shot in plan['shots']:
        scene = scenes[shot['scene_id']]
        shot.setdefault('scene_fraction_start', (shot['start_s'] - scene['start_s']) / scene['duration_s'])
        shot.setdefault('scene_fraction_end', (shot['start_s'] + shot['duration_s'] - scene['start_s']) / scene['duration_s'])
    events = {e['id']: (s, e) for s in board['scenes'] for e in s['visual_events']}
    for reward in plan['rewards']:
        scene, event = events[reward['event_id']]
        reward.setdefault('event_fraction', (reward['at_s'] - scene['start_s'] - event['at_s']) / event['duration_s'])


def retime(board):
    """Derive shot and reward times from the actual retimed scenes and events."""
    if not required(board):
        return []
    try:
        scenes = {s['id']: s for s in board['scenes']}
        for shot in board['film_direction']['shots']:
            scene = scenes[shot['scene_id']]
            start = scene['start_s'] + scene['duration_s'] * shot['scene_fraction_start']
            end = scene['start_s'] + scene['duration_s'] * shot['scene_fraction_end']
            shot.update(start_s=round(start, 4), duration_s=round(end-start, 4))
        events = {e['id']: (s, e) for s in board['scenes'] for e in s['visual_events']}
        for reward in board['film_direction']['rewards']:
            scene, event = events[reward['event_id']]
            reward['at_s'] = round(scene['start_s'] + event['at_s'] + event['duration_s'] * reward['event_fraction'], 4)
    except (KeyError, TypeError, ZeroDivisionError):
        return ['modern retiming requires frozen shot and event anchors from the approved board']
    return problems(board)


def problems(board, repo=REPO):
    if not required(board):
        return []
    cfg = policy(repo)
    plan = board.get('film_direction')
    if not isinstance(plan, dict):
        return ['modern production requires film_direction; the old renderer is historical only']
    errors = []
    import story_art
    errors += story_art.problems(board, repo)
    if plan.get('version') != cfg['version'] or board.get('cinematic_template') != cfg['template']:
        errors.append('modern production must use the active directed-film-v2 renderer')
    registry = json.loads((Path(repo) / 'config/modern_episode_registry.json').read_text())['episodes']
    episode = registry.get(plan.get('episode'))
    if not episode:
        return errors + ['modern film needs a registered authored episode, never a legacy template fallback']
    try:
        if plan.get('renderer_inputs') != renderer_inputs(plan['episode'], repo):
            errors.append('modern episode and shared renderer bytes changed since boarding')
        registry_code = (Path(repo) / 'video-engine/src/modern/registry.tsx').read_text()
        if not re.search(r"['\"]" + re.escape(plan['episode']) + r"['\"]\s*:", registry_code):
            errors.append('episode is declared but not registered in the actual renderer')
        for file in [episode['module'], *episode['assets']]:
            if Path(file).suffix not in ('.ts', '.tsx'):
                continue
            text = (Path(repo) / file).read_text()
            if re.search(r"(?:from\s*['\"][^'\"]*(?:Episode|InspectionAction)|cinematic_template\s*[:=]\s*['\"](?:cooling-inspection|editorial|paper-dossier))", text):
                errors.append('modern episode imports a retired whole-episode renderer')
        implementation = (Path(repo) / episode['module']).read_text()
        for view in episode['views']:
            if not re.search(r"case\s*['\"]" + re.escape(view) + r"['\"]\s*:", implementation):
                errors.append('modern registry view has no executable case in the episode')
    except (OSError, KeyError, ValueError):
        errors.append('modern episode renderer inputs are unavailable')
    for key in ('angle', 'opening_promise', 'performed_turn', 'closing_answer'):
        if not prose(plan.get(key)):
            errors.append('modern direction needs concrete ' + key)
    scenes = {s['id']: s for s in board.get('scenes', [])}
    events = {e['id']: (sid, s['start_s'] + e['at_s'], s['start_s'] + e['at_s'] + e.get('duration_s', 0))
              for sid, s in scenes.items() for e in s.get('visual_events', []) if e.get('id')}
    shots = plan.get('shots')
    if not isinstance(shots, list) or not shots:
        return errors + ['modern film requires its executed shot timeline']
    ids, cursor, sizes = set(), 0.0, set()
    for row in shots:
        if not isinstance(row, dict):
            errors.append('modern shot must be an object')
            continue
        sid, key = row.get('scene_id'), row.get('id')
        if not key or key in ids:
            errors.append('modern shots need unique identities')
        ids.add(key)
        start, duration = row.get('start_s'), row.get('duration_s')
        if not finite(start) or not finite(duration) or duration <= 0 or duration > cfg['max_shot_s']:
            errors.append('modern shot has invalid timing or an overlong hold')
            continue
        if abs(start - cursor) > .011:
            errors.append('modern shot timeline has a missing or overlapping interval')
        cursor = start + duration
        scene = scenes.get(sid)
        if not scene or start < scene['start_s'] - .011 or cursor > scene['start_s'] + scene['duration_s'] + .011:
            errors.append('modern shot must stay inside its current source-bound scene')
        lo, hi = row.get('scene_fraction_start'), row.get('scene_fraction_end')
        if (not finite(lo) or not finite(hi) or not 0 <= lo < hi <= 1.000001
                or scene and (abs(start-scene['start_s']-scene['duration_s']*lo)>.011
                              or abs(cursor-scene['start_s']-scene['duration_s']*hi)>.011)):
            errors.append('modern shot needs frozen fractional editorial anchors consistent with measured retiming')
        event = events.get(row.get('event_id'))
        if not event or event[0] != sid or event[1] >= cursor or event[2] <= start:
            errors.append('modern shot needs an actual overlapping performed event')
        if row.get('view') not in episode['views']:
            errors.append('modern shot names an unimplemented episode view')
        if row.get('framing') not in cfg['framings'] or row.get('transition') not in cfg['transitions']:
            errors.append('modern shot needs a supported framing and physical edit')
        sizes.add(row.get('framing'))
        if not prose(row.get('purpose')) or not prose(row.get('carry')):
            errors.append('modern shot must explain new information and conserved identity')
    runtime = max((s['start_s'] + s['duration_s'] for s in scenes.values()), default=0)
    if abs(cursor - runtime) > .011:
        errors.append('modern shots must cover the complete story before credits')
    if len(sizes) < cfg['min_framings']:
        errors.append('modern edit repeats one tableau instead of distinct shot sizes')
    rewards = plan.get('rewards')
    if not isinstance(rewards, list) or not rewards:
        return errors + ['modern direction needs physical actions, reactions or informative reveals']
    times = []
    for row in rewards:
        event = events.get(row.get('event_id'))
        shot = next((s for s in shots if s.get('id') == row.get('shot_id')), {})
        t = row.get('at_s')
        if not finite(row.get('event_fraction')) or not 0 <= row['event_fraction'] <= 1:
            errors.append('modern reward needs its frozen event fraction')
        if (not event or not finite(t) or not shot or event[0] != shot.get('scene_id')
                or not event[1] - .011 <= t <= event[2] + .011
                or not shot['start_s'] - .011 <= t <= shot['start_s'] + shot['duration_s'] + .011
                or row.get('kind') not in cfg['reward_kinds'] or not prose(row.get('visible_change'))):
            errors.append('modern reward must bind a visible current event at its executed shot time')
        else:
            times.append(t)
    times.sort()
    if not times or times[0] > cfg['first_reward_by_s']:
        errors.append('modern opening delays its first visible change')
    if times and max(b - a for a, b in zip([0, *times], [*times, runtime])) > cfg['max_reward_interval_s'] + .011:
        errors.append('modern timeline leaves an unearned interval without new information')
    return sorted(set(errors))


def review_problems(board, report, film_sha=None):
    if not required(board):
        return []
    rows = report.get('modern_observations')
    if not isinstance(rows, dict):
        return ['current film needs timed independent modern_observations']
    errors = []
    expected = film_sha or report.get('film_sha256') or report.get('reviewed_preflight_sha256')
    if not expected or rows.get('film_sha256') != expected:
        errors.append('modern observations describe different or unbound film bytes')
    runtime = float(board.get('runtime_s', 0))
    for key in policy()['review_criteria']:
        item = rows.get(key) or {}
        start, end = item.get('start_s'), item.get('end_s')
        if (item.get('pass') is not True or not finite(start) or not finite(end)
                or not 0 <= start < end <= runtime + .1 or not prose(item.get('observed'))):
            errors.append('modern engagement or finish unproven: ' + key)
    return errors


def assessment_problems(board, assessment):
    if not required(board):
        return []
    if any(row.get('category') in policy()['nondeferrable_categories'] for row in assessment.get('defects', [])):
        return ['modern film cannot defer pacing, performed motion, finish or the closing answer']
    return []


def review_instruction(board):
    if not required(board):
        return ''
    keys = ', '.join(policy()['review_criteria'])
    return ('Watch the complete current film at normal speed before reading its rationale. '
            'Return modern_observations with film_sha256 and timed fields ' + keys +
            ', each with pass, start_s, end_s and concrete observed. First_frame tests a readable '
            'scroll-stop question or action; visual_progression requires successive new information, '
            'not scanning the same prop. Shot_variety requires visibly different useful framing. '
            'Performed_turn and closing_answer must occur in picture. Pace rejects long empty holds '
            'and repetitive movements even if every source claim is correct. Finished_art rejects '
            'placeholder kit, flat box props, dull surfaces, unmodeled volume or tiny actions. '
            'Require deliberately finished silhouettes, visible light/shade, surface detail and grounded contact. '
            'Finished_art must identify this edition\'s fresh hero and supporting art in the actual film, '
            'and reject generated assets that are unused, merely decorative or replaced by old library props. '
            'Do not reward a palette declaration, number of cuts, '
            'technical gates or a director rationale. These current requirements cannot use artistic '
            'deferral. Preserve actual failed observations and source limits. ')


if __name__ == '__main__':
    import argparse
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--board', type=Path, required=True)
    args = p.parse_args()
    errors = problems(json.loads(args.board.read_text()))
    print('\n'.join(errors) if errors else 'Active directed film route, executed shot timeline and fresh artwork verified.')
    raise SystemExit(bool(errors))
