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


def narration_required(board):
    return bool(board.get('narration_picture')) or (required(board) and not board.get('reference_only')
        and str(board.get('date', '')) >= policy().get('narration_picture_effective_date', '9999'))


def narration_tokens(text):
    return [re.sub(r'[^a-z0-9]', '', w.lower()) for w in text.split()
            if re.sub(r'[^a-z0-9]', '', w.lower())]


def narration_digest(value):
    return hashlib.sha256(json.dumps(value,sort_keys=True,separators=(',',':')).encode()).hexdigest()


def cue_digest(cues):
    return narration_digest([{k:c.get(k) for k in ('id','start','end','text','source')} for c in cues])


def narration_problems(board, captions=None, words=None, script=None, claims=None):
    """Check coverage and executable bindings, without pretending metadata judges pixels."""
    if not narration_required(board):
        return []
    errors = []
    plan = board.get('narration_picture') or {}
    clauses = plan.get('clauses') or []
    if plan.get('version') != 'narration-picture-v1' or not clauses:
        return ['every current film needs its complete narration-picture contract']
    registry = json.loads((REPO/'config/modern_episode_registry.json').read_text())['episodes']
    views = registry.get((board.get('film_direction') or {}).get('episode'), {}).get('narration_views', {})
    shots = (board.get('film_direction') or {}).get('shots', [])
    scenes = {s['id']: s for s in board.get('scenes', [])}
    cues = {c['id']: c for c in (captions or {}).get('cues', board.get('captions', []))}
    planning = captions is None and plan.get('timing_mode') == 'authored'
    if captions is not None and plan.get('timing_mode') != 'measured_caption_boundaries':
        errors.append('production narration-picture clock is still an authored estimate')
    seen, covered, cursor = set(), [], 0
    verified = {c['id'] for c in (claims or {}).get('claims', []) if c.get('verdict') == 'VERIFIED'}
    for row in clauses:
        cid = row.get('id')
        if not cid or cid in seen:
            errors.append('narration clauses must have unique ordered identities')
        seen.add(cid)
        ids = row.get('cue_ids') or []
        group = [cues.get(k) for k in ids]
        if not ids or any(c is None for c in group):
            errors.append(str(cid)+': measured caption clause is missing'); continue
        covered.extend(ids)
        text = ' '.join(c['text'] for c in group)
        if narration_tokens(row.get('text', '')) != narration_tokens(text):
            errors.append(str(cid)+': clause text or qualifier drifted from the measured voice')
        start, end = group[0]['start'], group[-1]['end']
        if (not finite(row.get('start_s')) or not finite(row.get('end_s'))
                or abs(row['start_s']-start)>.001 or abs(row['end_s']-end)>.001):
            errors.append(str(cid)+': picture clock is not the current measured clause clock')
        if not planning and any(c.get('source') != 'measured_boundary' for c in group):
            errors.append(str(cid)+': clause boundaries must be measured, never proportional')
        count = len(narration_tokens(text))
        if row.get('word_range') != [cursor, cursor+count]:
            errors.append(str(cid)+': positional spoken-word coverage is stale or incomplete')
        cursor += count
        scene = scenes.get(row.get('scene_id'))
        if not scene or start < scene['start_s']-.001 or end > scene['start_s']+scene['duration_s']+.001:
            errors.append(str(cid)+': clause leaves its source-bound scene')
        if not row.get('subject_ids') or not row.get('action_id') or not row.get('claim_ids'):
            errors.append(str(cid)+': concrete subject, action and source are required')
        if claims is not None and not set(row.get('claim_ids', [])).issubset(verified):
            errors.append(str(cid)+': narrated action lacks current verified source evidence')
        relevant = sorted([s for s in shots if cid in s.get('narration_ids', [])], key=lambda s:s['start_s'])
        at = start
        for shot in relevant:
            view = views.get(shot.get('view'), {})
            if (shot.get('scene_id') != row.get('scene_id')
                    or row.get('action_id') not in view.get('action_ids', [])
                    or not set(row.get('subject_ids', [])).issubset(view.get('subject_ids', []))):
                errors.append(str(cid)+': renderer view depicts an incompatible subject or action')
            if shot['start_s'] <= at+.001:
                at = max(at, shot['start_s']+shot['duration_s'])
        if at < end-.001:
            errors.append(str(cid)+': matching performed picture does not cover the spoken clause')
        if not row.get('event_ids') or any(not any(e.get('id')==eid for e in (scene or {}).get('visual_events', []))
                                          for eid in row.get('event_ids', [])):
            errors.append(str(cid)+': executed source-bound event is missing')
    if covered != list(cues):
        errors.append('every measured spoken cue must be covered once in original order')
    authored = ' '.join(row.get('text', '') for row in clauses)
    if narration_tokens(authored) != narration_tokens(script if script is not None else ' '.join(s.get('vo','') for s in scenes.values())):
        errors.append('narration-picture contract omits or duplicates spoken words or qualifiers')
    if words is not None and narration_tokens(authored) != narration_tokens(' '.join(w['word'] for w in words['words'])):
        errors.append('positional clause coverage differs from the acoustic word stream')
    provenance=plan.get('timing_provenance') or {}
    if captions is not None and provenance.get('cue_content_sha256') != cue_digest(captions['cues']):
        errors.append('narration picture is bound to stale caption content')
    if words is not None and 'method' in words and provenance.get('word_content_sha256') != narration_digest(words):
        errors.append('narration picture is bound to stale acoustic word evidence')
    if captions is not None and any(c.get('start_measured') is not True or c.get('end_measured') is not True
                                    for c in captions['cues']):
        errors.append('external caption provenance does not establish measured clause boundaries')
    return errors


def compile_narration(board, captions, words):
    """Derive clauses, cuts and event windows from measured speech, never scene fractions."""
    plan = board['narration_picture']; cues = {c['id']:c for c in captions['cues']}
    cursor = 0
    for row in plan['clauses']:
        group = [cues[k] for k in row['cue_ids']]
        if narration_tokens(row['text']) != narration_tokens(' '.join(c['text'] for c in group)):
            raise ValueError('authored clause must equal complete measured cue text')
        count = len(narration_tokens(row['text']))
        row.update(start_s=group[0]['start'], end_s=group[-1]['end'], word_range=[cursor,cursor+count])
        cursor += count
    plan['timing_mode']='measured_caption_boundaries'
    provenance=plan.setdefault('timing_provenance',{})
    provenance['cue_content_sha256']=cue_digest(captions['cues'])
    if 'method' in words: provenance['word_content_sha256']=narration_digest(words)
    scenes = {s['id']:s for s in board['scenes']}
    rows = {r['id']:r for r in plan['clauses']}
    for sid,scene in scenes.items():
        scene_rows = [r for r in plan['clauses'] if r['scene_id']==sid]
        for n,row in enumerate(scene_rows):
            lo = scene['start_s'] if n==0 else (scene_rows[n-1]['end_s']+row['start_s'])/2
            hi = scene['start_s']+scene['duration_s'] if n+1==len(scene_rows) else (row['end_s']+scene_rows[n+1]['start_s'])/2
            assigned = [s for s in board['film_direction']['shots'] if s.get('narration_ids')==[row['id']]]
            if not assigned: raise ValueError('spoken clause has no authored executable shot')
            # Only subdivisions within one identical spoken subject/action use a fraction.
            # A clause handoff always comes from acoustic boundaries above.
            for k,shot in enumerate(assigned):
                a=lo+(hi-lo)*k/len(assigned);b=lo+(hi-lo)*(k+1)/len(assigned)
                shot.update(start_s=round(a,4),duration_s=round(b-a,4),
                    scene_fraction_start=(a-scene['start_s'])/scene['duration_s'],
                    scene_fraction_end=(b-scene['start_s'])/scene['duration_s'])
        for event in scene['visual_events']:
            row=rows[event['narration_id']]
            start=row['start_s']+float(event['clause_fraction_start'])*(row['end_s']-row['start_s'])
            end=row['start_s']+float(event['clause_fraction_end'])*(row['end_s']-row['start_s'])
            event.update(at_s=round(start-scene['start_s'],4),duration_s=round(end-start,4))
    events={e['id']:(s,e) for s in board['scenes'] for e in s['visual_events']}
    for reward in board['film_direction']['rewards']:
        scene,event=events[reward['event_id']]
        reward['at_s']=round(scene['start_s']+event['at_s']+event['duration_s']*reward['event_fraction'],4)
        owner=next((s for s in board['film_direction']['shots'] if event['narration_id'] in s.get('narration_ids',[])
                    and s['start_s']-.001<=reward['at_s']<s['start_s']+s['duration_s']+.001),None)
        if owner is None: raise ValueError('performed clause reward leaves its actual picture')
        reward['shot_id']=owner['id']
    errors=narration_problems(board,captions,words)
    if errors: raise ValueError('; '.join(errors))
    return board


def prose(value):
    return isinstance(value, str) and len(value.strip()) >= 20


def renderer_inputs(episode, repo=REPO):
    root = Path(repo).resolve()
    entry = json.loads((root / 'config/modern_episode_registry.json').read_text())['episodes'][episode]
    # The place stage draws every current film's region, so its code, its plates' manifest (which
    # holds every layer's sha256) and its county map are renderer bytes like the episode's own.
    files = [entry['module'], *entry['assets'], 'video-engine/src/modern/DirectedFilm.tsx',
             'video-engine/src/modern/registry.tsx', 'video-engine/src/modern/types.ts',
             'video-engine/src/modern/StoryArt.tsx', 'video-engine/src/modern/PlaceStage.tsx',
             'video-engine/src/modern/CountyLocator.tsx', 'video-engine/src/modern/placePlates.json',
             'video-engine/src/modern/texasCounties.json',
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
    if board.get('narration_picture'):
        try:
            compile_narration(board, {'cues':board['captions']},
                              {'words':[{'word':w} for s in board['scenes'] for w in s.get('vo','').split()]})
            return problems(board)
        except (KeyError, ValueError, TypeError) as exc:
            return ['measured narration-picture retiming failed: '+str(exc)]
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
    errors = narration_problems(board)
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
        item = rows.get(key)
        if not isinstance(item, dict):
            errors.append('modern engagement or finish unproven: ' + key)
            continue
        start, end = item.get('start_s'), item.get('end_s')
        if (item.get('pass') is not True or not finite(start) or not finite(end)
                or not 0 <= start < end <= runtime + .1 or not prose(item.get('observed'))):
            errors.append('modern engagement or finish unproven: ' + key)
    if narration_required(board):
        observations=report.get('narration_picture_observations')
        if not isinstance(observations, dict):
            return errors + ['exact-film narration-picture observations must be an object']
        expected_rows={c['id']:c for c in (board.get('narration_picture') or {}).get('clauses', [])}
        actual=observations.get('clauses')
        if not isinstance(actual, list):
            return errors + ['exact-film narration-picture clauses must be a list']
        if any(not isinstance(row, dict) or not isinstance(row.get('id'), str) for row in actual):
            return errors + ['exact-film narration-picture clauses must contain identified object rows']
        if observations.get('film_sha256') != expected or [c.get('id') for c in actual] != list(expected_rows):
            errors.append('exact-film narration-picture review must cover every spoken clause')
        for row in actual:
            clause=expected_rows.get(row.get('id'), {})
            if (row.get('pass') is not True or not prose(row.get('observed'))
                    or row.get('start_s') != clause.get('start_s') or row.get('end_s') != clause.get('end_s')):
                errors.append('narration-picture relationship unproven: '+str(row.get('id')))
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
    clause_instruction=(' Also return narration_picture_observations with the actual film_sha256 and '
        'clauses in authored order, each with id, pass, exact start_s/end_s from narration_picture '
        'and observed. Inspect every spoken clause against the actual pictured subject and performed '
        'action at those times. Captions, labels, declared event metadata and matching topic words '
        'do not depict an absent action. Reject early cutaways, wrong condition identities, '
        'missing causal steps or unpictured qualifications. State precisely what the picture does '
        'while the words are heard; do not copy the director rationale. '
        if narration_required(board) else '')
    return (clause_instruction+'Watch the complete current film at normal speed before reading its rationale. '
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
    p.add_argument('--captions', type=Path)
    p.add_argument('--words', type=Path)
    p.add_argument('--script', type=Path)
    p.add_argument('--claims', type=Path)
    args = p.parse_args()
    board=json.loads(args.board.read_text())
    errors = problems(board)
    if args.captions:
        captions=json.loads(args.captions.read_text())
        words=json.loads(args.words.read_text()) if args.words else None
        script=args.script.read_text() if args.script else None
        claims=json.loads(args.claims.read_text()) if args.claims else None
        errors+=narration_problems(board,captions,words,script,claims)
    print('\n'.join(errors) if errors else 'Active directed film route, executed shot timeline and fresh artwork verified.')
    raise SystemExit(bool(errors))
