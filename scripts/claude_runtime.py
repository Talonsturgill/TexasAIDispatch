"""Claude-native compact leaf plans and private observed token accounting."""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import fnmatch
import hashlib
import json
import os
import posixpath
from pathlib import Path
import re
import agent_runtime

REPO = Path(__file__).resolve().parents[1]
POLICY = REPO / 'config/claude_runtime.json'


def read(path):
    return json.loads(Path(path).read_text())


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def bound(path):
    return {'path': str(Path(path).resolve()), 'sha256': digest(path)}


def assignment(role, edition):
    cfg = read(POLICY)
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', str(edition)):
        raise ValueError('Claude assignment requires its actual calendar date')
    datetime.fromisoformat(edition)
    if edition < cfg['authorized_at'] or role not in cfg['roles']:
        raise ValueError('Claude route does not replace historical assignments')
    row = cfg['roles'][role]
    return dict(host='claude', role=role, policy=bound(POLICY), model=row['model'],
                effort=row['effort'], agent=row['agent'], resource=row['resource'], context='isolated')


def contracts(role):
    row = read(POLICY)['roles'][role]
    files = ['AGENTS.md', 'CLAUDE.md', 'prompts/claude_routine.md',
             'config/claude_runtime.json', 'config/quality_contract.json',
             'config/dispatch_rubric.yaml', '.claude/agents/' + row['agent'] + '.md']
    if role == 'scene-builder':
        files.append('prompts/roles/scene-builder.md')
    return [bound(REPO / path) for path in files]


def input_packet(role, edition, inputs):
    if role not in ('researcher', 'validator') or not inputs:
        raise ValueError('Early source packet needs researcher/validator and actual inputs')
    route = assignment(role, edition)
    return {'role': role, 'date': edition, 'agent_assignment': route,
            'brief': '.claude/agents/' + route['agent'] + '.md',
            'inputs': [bound(path) for path in inputs], 'agent_contracts': contracts(role),
            'phase': bound(REPO / 'prompts/phases/01-research.md'),
            'instructions': 'Read the full current sources and relevant phase contracts. '
                            'Return one source-backed handoff. Never spawn additional agents.' +
                            (' Include your complete dated validation object and current verified '
                             'claim ids; the director retains your original response and saves '
                             'that object unchanged before paid picture work.'
                             if role == 'validator' else '')}


# The initial builder authors source and runs cheap code checks. A capture needs a charged render
# reservation, passed headroom, the wrapper and genuine art receipts, none of which exist yet.
CAPTURE_DENIED = {'allowed': False, 'requires': ['charged render reservation', 'computed passed native headroom',
                                                 'bash scripts/run_with_env.sh', 'genuine authored art receipts']}


def authoring_packet(board_path, claims_path):
    from daily_production import craft_reading_paths
    board = read(board_path); role = 'scene-builder'; route = assignment(role, board['date'])
    data = {'role': role, 'date': board['date'], 'mode': 'initial_authored_build',
            'agent_assignment': route, 'brief': '.claude/agents/scene-builder.md',
            'agent_contracts': contracts(role), 'board': bound(board_path), 'claims': bound(claims_path),
            'treatments': agent_runtime.treatment_bindings(board_path),
            'craft_readings': [bound(path) for path in craft_reading_paths(board)],
            'phase': bound(REPO / 'prompts/phases/02-picture.md'),
            'capture': CAPTURE_DENIED}
    initial_authoring_inputs(data)
    return data


def initial_authoring_inputs(data):
    """The first builder creates source groups; only later critics receive executed art."""
    import authored_story_art
    from daily_production import craft_reading_paths
    if data.get('role') != 'scene-builder' or data.get('agent_contracts') != contracts('scene-builder'):
        raise ValueError('Only the initial builder can receive planned authored inputs')
    board = read(data['board']['path'])
    if not authored_story_art.selected(board) or board.get('date') != data['date']:
        raise ValueError('Initial authored build needs its explicit current board')
    if data.get('phase') != bound(REPO / 'prompts/phases/02-picture.md'):
        raise ValueError('Initial authored build lacks its current picture phase')
    if data.get('craft_readings') != [bound(path) for path in craft_reading_paths(board)]:
        raise ValueError('Initial authored build lacks full current guides')
    rows = agent_runtime.treatment_bindings(data['board']['path'])
    if data.get('treatments') != rows or len(rows) != 2 or rows[0]['sha256'] == rows[1]['sha256']:
        raise ValueError('Initial authored build needs two distinct complete treatment boards')
    for index, row in enumerate(rows):
        treatment = read(row['path'])
        if (not authored_story_art.selected(treatment) or treatment.get('date') != board['date']
                or treatment['film_direction'].get('variant') != ('a', 'b')[index]
                or treatment['story_art']['requests'] != board['story_art']['requests']
                or treatment['story_art'].get('entries')):
            raise ValueError('Initial authoring must share two fresh planned groups; recorded art uses the normal packet')
        errors = authored_story_art.request_problems(treatment)
        if errors:
            raise ValueError('; '.join(errors))
    if not data.get('claims'):
        raise ValueError('Initial authored build needs its actual current claims')


def adapt_packet(data):
    data = dict(data); role = data['role']; route = assignment(role, data['date'])
    data.update(agent_assignment=route, agent_contracts=contracts(role),
                brief='.claude/agents/' + route['agent'] + '.md')
    data.setdefault('capture', CAPTURE_DENIED)
    if role in ('scene-builder', 'storyboard-critic'):
        data['treatments'] = agent_runtime.treatment_bindings(data['board']['path'])
        data['asset_inputs'] = agent_runtime.treatment_assets(data['treatments'])
    return data


def motion_inputs(data):
    """Only complete current movie-derived imagery reaches an image-only final judge."""
    import claude_motion_review
    sequence = data.get('motion_sequence') or {}
    if not sequence.get('path') or not sequence.get('sha256'):
        raise ValueError('Claude final review needs complete exact-film motion-image access')
    if digest(sequence['path']) != sequence['sha256']:
        raise ValueError('Claude motion sequence index changed after packet binding')
    errors = claude_motion_review.problems(sequence['path'], data['board']['path'], data['film']['path'])
    if errors:
        raise ValueError('; '.join(errors))


def image_read_policy():
    return {'schema': 'dispatch_claude_image_read_policy/1', 'images_per_model_step': 1,
            'parallel_image_reads': False, 'note_before_next_read': True,
            'missing_image': 'return partial immediately; no repeated bulk reads',
            'coverage_schema': 'dispatch_claude_image_coverage/1'}


def image_reading(data):
    """Keep image delivery bounded; this supplies no creative observation or approval."""
    data['image_read_policy'] = image_read_policy()
    data['instructions'] += (' Image delivery is sequential: issue ONE image Read, wait for it, and record '
        'the page filename, first/last frame and a concrete visible observation before the next image Read. '
        'Never send parallel image Reads or a bulk image batch. Earlier images can leave the host window; '
        'retain your actual textual observations and consolidate from those notes without bulk rereading. '
        'If a page is stripped or unseen, return partial immediately with its exact identity; do not infer '
        'pixels from source code, timestamps or earlier stills. In the final handback also return a separate '
        'coverage object with schema dispatch_claude_image_coverage/1, packet_sha256, and sequences in packet '
        'order. Each sequence has index_sha256 and pages in index order; each page has file, first_frame, '
        'last_frame, received (true only when actually seen), and observed (at least thirty characters '
        'describing its actual visible content). Preserve every required guide, timed observation and honest verdict.')
    return data


def image_policy_inputs(data):
    if data.get('image_read_policy') != image_read_policy():
        raise ValueError('Claude image review needs the current sequential delivery and retained-notes policy')


def image_coverage_problems(packet_path, coverage_path):
    """Check complete declared access to exact pages; never supply or change a verdict."""
    try:
        data, coverage = read(packet_path), read(coverage_path)
        if not isinstance(data, dict) or not isinstance(coverage, dict):
            return ['image coverage and packet must be objects']
        image_policy_inputs(data)
        refs = ([r['motion_sequence'] for r in data['phone_options']] if data.get('role') == 'storyboard-critic'
                else [data['motion_sequence']])
        if (coverage.get('schema') != 'dispatch_claude_image_coverage/1'
                or coverage.get('packet_sha256') != digest(packet_path)):
            return ['image coverage does not bind the exact current packet']
        rows = coverage.get('sequences')
        if not isinstance(rows, list) or len(rows) != len(refs):
            return ['image coverage omits a required whole-film sequence']
        errors = []
        for ref, row in zip(refs, rows, strict=True):
            if not isinstance(row, dict):
                errors.append('image coverage has a malformed sequence'); continue
            if digest(ref['path']) != ref['sha256'] or row.get('index_sha256') != ref['sha256']:
                errors.append('image coverage index bytes or identity changed'); continue
            pages = read(ref['path'])['pages']; notes = row.get('pages')
            if not isinstance(notes, list) or len(notes) != len(pages):
                errors.append('image coverage omits chronological pages'); continue
            for page, note in zip(pages, notes, strict=True):
                if not isinstance(note, dict):
                    errors.append('image coverage has a malformed page observation'); continue
                image = Path(ref['path']).parent / page['file']
                if (Path(page['file']).name != page['file'] or image.is_symlink()
                        or not image.is_file() or digest(image) != page['sha256']):
                    errors.append('image coverage page bytes are missing or changed')
                if (note.get('file') != page['file'] or type(note.get('first_frame')) is not int
                        or type(note.get('last_frame')) is not int
                        or note.get('first_frame') != page['samples'][0]['frame']
                        or note.get('last_frame') != page['samples'][-1]['frame']):
                    errors.append('image coverage reorders or misidentifies a page')
                if (note.get('received') is not True or not isinstance(note.get('observed'), str)
                        or len(note['observed'].strip()) < 30):
                    errors.append('image coverage has an unseen page or no concrete retained observation')
        return errors
    except (OSError, ValueError, TypeError, KeyError, IndexError) as exc:
        return ['image coverage unavailable: ' + str(exc)]


def phone_options(state_path, sequences, current=False):
    """Compute bindings for comparison movies or the current timed movie; no creative answers."""
    import claude_motion_review as motion
    import critic_gate
    import daily_production
    import quality_contract
    from action_admission import source_claims_digest
    state_path = Path(state_path).resolve(); output = state_path.parent / 'openings'
    rows = []
    for option, sequence in zip(('current',) if current else ('a', 'b'), sequences, strict=True):
        board, film = ((state_path.parent / 'storyboard.json', state_path.parent / 'preflight.mp4') if current else
                       (output / (option + '.json'), output / (option + '.mp4')))
        comparison = motion.phone_inputs(state_path, option, board, film)
        errors = motion.problems(sequence, board, film, True, comparison)
        if errors:
            raise ValueError('; '.join(errors))
        data = read(board)
        rows.append({'id': option, 'board': bound(board), 'film': bound(film),
                     'motion_sequence': bound(sequence), 'comparison': comparison,
                     'report_bindings': {'review_scope': 'exact-muted-phone-preflight',
                         'reviewed_preflight_sha256': digest(film),
                         'concept_sha256': critic_gate.concept_digest(data),
                         'renderer_sha256': critic_gate.renderer_digest(data),
                         'quality_contract_sha256': quality_contract.fingerprint(),
                         'modern_observations': {'film_sha256': digest(film)},
                         'narration_picture_observations': {'film_sha256': digest(film)},
                         'action_reviews': [{'action_id': action['id'],
                             'module_sha256': action['module']['sha256'],
                             'source_claims_sha256': source_claims_digest(action)}
                             for action in data.get('action_proposals', [])],
                         'story_review': {'story_sha256': daily_production.story_digest(data),
                             'policy_sha256': digest(daily_production.POLICY)}}})
    return rows


def phone_packet(packet_path, state_path, sequences, current=False):
    data = read(packet_path)
    if data.get('role') != 'storyboard-critic':
        raise ValueError('phone packet requires the existing independent storyboard critic')
    if Path(data['board']['path']).resolve().parent != Path(state_path).resolve().parent:
        raise ValueError('phone packet must use the current owned edition')
    data['review_scope'] = 'exact-muted-phone-preflight'
    data['phone_state'] = str(Path(state_path).resolve())
    data['phone_mode'] = 'current' if current else 'comparison'
    data['phone_options'] = phone_options(state_path, sequences, current)
    if current and data['board'] != data['phone_options'][0]['board']:
        raise ValueError('current phone packet needs the exact current timed board binding')
    for row in data['phone_options']:
        row['report_bindings']['story_review']['claims_sha256'] = data['claims']['sha256']
    data['instructions'] += (' Review every chronological image page for ' +
        ('the exact current timed film' if current else 'both options') + ' before the director rationale. '
        'These images establish only their sampled pixels, with no direct playback or listening. '
        'Return one consolidated ' + ('exact-phone review' if current else 'comparison/selection and exact-phone review') +
        ' as JSON in your handback; '
        'the director saves it unchanged. Copy the supplied mechanical bindings exactly, then supply your '
        'own verdict and all required timed observations. Unproven motion stays unresolved. '
        'After the complete chronological viewing, consolidate the handback. Recheck only named '
        'uncertain intervals; return unresolved findings instead of repeated viewing to pursue a pass. '
        'Do not run Bash, write files, invent hashes, or infer approval from structural measurements.')
    image_reading(data)
    phone_review_inputs(data)
    return data


def phone_review_inputs(data):
    rows = data.get('phone_options') or []
    mode = data.get('phone_mode', 'comparison'); current = mode == 'current'
    if mode not in ('comparison', 'current') or data.get('review_scope') != 'exact-muted-phone-preflight' or len(rows) != (1 if current else 2):
        raise ValueError('Claude phone review needs ' + ('the complete current timed sequence' if current else
                                                       'both complete exact-phone motion sequences'))
    expected = phone_options(data['phone_state'], [r['motion_sequence']['path'] for r in rows], current)
    if current and data['board'] != expected[0]['board']:
        raise ValueError('current phone packet needs the exact current timed board binding')
    for row in expected:
        row['report_bindings']['story_review']['claims_sha256'] = data['claims']['sha256']
    if rows != expected:
        raise ValueError('Claude phone review inputs or computed bindings changed')


def mechanical_admission(role, data, task):
    """Admit one packet to the Haiku mechanical route, or refuse so the Opus assignment stays.

    The route is an overlay on the normal role packet. The packet keeps its full current guides and
    hash bindings and the role keeps its controller resource, so nothing here lowers a gate or a
    reservation. It admits two task kinds on two roles, only after its effective date, only for
    gate tests, never for an initial authored build, and only for a blind, strictly specified packet.
    Every doubt raises, because a refused overlay costs nothing and the default route is unchanged.
    """
    policy = read(POLICY)
    cfg = policy.get('mechanical_route')
    if not isinstance(cfg, dict):
        raise ValueError('No mechanical route is declared')
    from claude_contract_check import mechanical_route_problems
    errors = mechanical_route_problems(policy)
    if errors:
        raise ValueError('; '.join(errors))
    row = (cfg['tasks'] or {}).get(task)
    if not row or row['role'] != role:
        raise ValueError('Mechanical route does not admit ' + str(role) + ' for ' + str(task))
    if str(data.get('date')) < cfg['effective_from']:
        raise ValueError('Mechanical route does not apply to editions before ' + cfg['effective_from'])
    if data.get('mode') == 'initial_authored_build':
        raise ValueError('The initial authored build always keeps its Opus assignment')
    spec = data.get('mechanical')
    if not isinstance(spec, dict) or spec.get('task') != task:
        raise ValueError('Packet lacks its mechanical declaration for ' + str(task))
    if any(key in data or key in spec for key in ('expected', 'expected_findings', 'answers', 'hidden_answers')):
        raise ValueError('A mechanical packet must be blind: expected findings stay outside it')
    paths = spec.get('paths')
    if not isinstance(paths, list) or not paths:
        raise ValueError('Mechanical packet names no files')
    bound_paths = []
    for entry in paths:
        path = entry.get('path') if isinstance(entry, dict) else entry
        if (not isinstance(path, str) or path != posixpath.normpath(path) or path.startswith('/')
                or '..' in path.split('/') or any(ch in path for ch in '*?[')):
            raise ValueError('Mechanical path is not a plain repository path: ' + str(path))
        if any(path.startswith(prefix) for prefix in cfg['forbidden_prefixes']):
            raise ValueError('Mechanical route never touches ' + path)
        if not any(fnmatch.fnmatchcase(path, pattern) for pattern in cfg['allowed_paths']):
            raise ValueError('Mechanical route is limited to gate tests: ' + path)
        target = (REPO / path).resolve()
        if not target.is_file() or REPO.resolve() not in target.parents:
            raise ValueError('Mechanical file does not exist in the repository: ' + path)
        # An alias would pass the name checks above while the bytes belong to another file, so the resolved
        # repository path must be the admitted exact name, and each link on the way is refused.
        if target.relative_to(REPO.resolve()).as_posix() != path or any(
                (REPO / Path(*path.split('/')[:n])).is_symlink() for n in range(1, len(path.split('/')) + 1)):
            raise ValueError('Mechanical file is an alias, not the named file: ' + path)
        if not isinstance(entry, dict) or entry.get('sha256') != digest(target):
            raise ValueError('Mechanical file must be named with its current sha256: ' + path)
        bound_paths.append({'path': path, 'sha256': entry['sha256']})
    if row['mode'] == 'read-only':
        if spec.get('read_only') is not True or spec.get('edits'):
            raise ValueError('A code-only review must be read-only')
    else:
        for key in cfg['correction_requires']:
            value = spec.get(key)
            if key == 'failing_case':
                if not isinstance(value, str) or not value.strip():
                    raise ValueError('A mechanical correction needs one named failing case')
            elif not (isinstance(value, list) and value and all(isinstance(v, str) and v.strip() for v in value)):
                raise ValueError('A mechanical correction needs its ' + key + ' as a list of names')
    return {'route': cfg['version'], 'task': task, 'role': role, 'mode': row['mode'], 'paths': bound_paths,
            'model': cfg['model'], 'effort': cfg['effort'], 'spawn_model': cfg['spawn_model'],
            'effective_from': cfg['effective_from'], 'evidence': cfg['evidence'], 'scope_note': cfg['scope_note']}


def plan(role, packet_path, task_name, scope, mechanical_task=None):
    from claude_contract_check import problems
    errors = problems()
    if errors:
        raise ValueError('; '.join(errors))
    if not re.fullmatch(r'[a-z][a-z0-9_]*', task_name) or not scope.strip() or len(scope) > 1000:
        raise ValueError('Claude leaf needs a compact named scope')
    data = read(packet_path); route = assignment(role, data.get('date'))
    if data.get('role') != role or data.get('agent_assignment') != route:
        raise ValueError('Claude packet does not carry its exact current host role')
    if data.get('mode') == 'initial_authored_build':
        initial_authoring_inputs(data)
    else:
        agent_runtime.required_inputs(data, role, contracts(role))
    agent_runtime.validate_references(data)
    if role in ('picture', 'story', 'sound'):
        motion_inputs(data)
        image_policy_inputs(data)
    if role == 'storyboard-critic' and (data.get('review_scope') == 'exact-muted-phone-preflight'
                                       or re.search(r'\bphone\b', scope, re.I)):
        phone_review_inputs(data)
        image_policy_inputs(data)
    expected = '.claude/agents/' + route['agent'] + '.md'
    if data.get('brief') != expected:
        raise ValueError('Claude packet names the wrong leaf brief')
    message = ('Work in ' + str(REPO) + '. Read the current compact packet ' +
               str(Path(packet_path).resolve()) + ' (SHA256 ' + digest(packet_path) +
               ') and every bound current guide in full. Verify the inputs before use. Scope: ' +
               scope.strip() + ' Return one complete handoff or consolidated defect list with exact '
               'hashes. Do NOT launch or spawn any subagents; do the work yourself and return your '
               'result. Never send email or post socially. Preserve actual rejected evidence. '
               'A code plan does not approve a rendered film.')
    admitted = mechanical_admission(role, data, mechanical_task) if mechanical_task else None
    if admitted:
        named = {row['path'] for row in admitted['paths']}
        for token in re.findall(r"[\w./-]+(?:/[\w.-]+|\.(?:py|mjs|cjs|js|tsx?|json|ya?ml|md|sh))", scope):
            if token.strip('.') not in named:
                raise ValueError('Mechanical scope names a file outside the admitted paths: ' + token)
    if admitted:
        message += (' Mechanical route ' + admitted['route'] + ' scope: touch only the files named in the packet'
                    + (', read-only.' if admitted['mode'] == 'read-only' else
                       ' and report each required named result, control and mutation check from a real run.'))
    if len(message) > 1800:
        raise ValueError('Claude assignment exceeds the compact handoff limit')
    result = {'assignment': route, 'packet': bound(packet_path), 'brief': bound(REPO / expected),
              'agent_args': {'subagent_type': route['agent'], 'description': task_name[:50], 'prompt': message},
              'model_binding': 'The versioned leaf definition pins the exact model and effort. '
                               'Do not substitute Codex model or fork arguments.',
              'reservation': 'Reserve the existing controller resource before executing this plan. '
                             'The three final scorers remain one atomic charged panel.'}
    if admitted:
        # The spawn arguments override the leaf definition for this one task. The role, its brief, its
        # complete guides and its controller resource are exactly the ones the Opus assignment carries.
        result['agent_args'].update(model=admitted['spawn_model'], effort=admitted['effort'])
        result['mechanical'] = admitted
        result['model_binding'] = ('Mechanical route ' + admitted['route'] + ' overrides only the spawn model and '
                                   'effort for this admitted task. Any refusal keeps the unchanged Opus assignment.')
    return result


def phase(name, root, checkpoint=True):
    if not re.fullmatch(r'[a-z][a-z0-9_-]*', name):
        raise ValueError('Invalid phase name')
    root = Path(root); root.mkdir(parents=True, exist_ok=True)
    with (root / 'claude-phases.jsonl').open('a') as stream:
        stream.write(json.dumps({'at': datetime.now(timezone.utc).isoformat(), 'phase': name}) + '\n')
    # Every phase entry makes the resumable edition durable. A checkpoint that cannot be made, after
    # storage and transport recovery, stops here: paid work must never run on an unbacked ledger.
    state = root / 'run_state.json'
    if checkpoint and state.is_file() and os.environ.get('DISPATCH_CHECKPOINT') != '0':
        import claude_checkpoint
        saved = claude_checkpoint.save_with_recovery(claude_checkpoint.repo_of(state), state, 'phase ' + name)
        print('Checkpoint ' + saved['commit'][:10] + ' saved: ' + str(saved['files']) + ' files.')


def usage_report(paths, since=None, phases=None):
    """No source messages leave this reader. Unknown effort and billing stay unknown."""
    calls, sources = {}, []
    markers = sorted((read_marker for read_marker in (json.loads(line) for line in Path(phases).read_text().splitlines())
                      if read_marker.get('at') and read_marker.get('phase')), key=lambda row: row['at']) if phases else []
    keys = ('input_tokens', 'cache_creation_input_tokens', 'cache_read_input_tokens', 'output_tokens')
    for path in paths:
        path = Path(path); raw = path.read_bytes()
        sources.append({'name': path.name, 'sha256': hashlib.sha256(raw).hexdigest()})
        for line in raw.splitlines():
            try:
                entry = json.loads(line)
            except ValueError:
                continue
            stamp = entry.get('timestamp')
            if since and (not stamp or datetime.fromisoformat(stamp.replace('Z', '+00:00')) < since):
                continue
            msg = entry.get('message')
            if entry.get('type') != 'assistant' or not isinstance(msg, dict) or not msg.get('usage'):
                continue
            identity = msg.get('id')
            if not identity:
                raise ValueError('Observed API usage lacks a message identity; do not count it twice')
            usage = msg['usage']
            row = {'message_id': identity, 'model': msg.get('model'), 'session': path.name,
                   'role': entry.get('agentType') or entry.get('subagentType'),
                   'observed_effort': entry.get('effort') or msg.get('effort'),
                   'timestamp': stamp, 'usage': {key: int(usage.get(key) or 0) for key in keys}}
            preceding = [marker for marker in markers if stamp and
                         datetime.fromisoformat(marker['at'].replace('Z', '+00:00')) <=
                         datetime.fromisoformat(stamp.replace('Z', '+00:00'))]
            row['observed_phase'] = preceding[-1]['phase'] if preceding else None
            if any(value < 0 for value in row['usage'].values()):
                raise ValueError('Negative usage is not valid telemetry')
            old = calls.get(identity)
            if old is None or row['usage']['output_tokens'] > old['usage']['output_tokens']:
                calls[identity] = row
    totals = {key: sum(row['usage'][key] for row in calls.values()) for key in keys}
    models, phase_totals = {}, {}
    for row in calls.values():
        key = row['model'] or 'unknown'
        models.setdefault(key, {name: 0 for name in keys})
        for name in keys:
            models[key][name] += row['usage'][name]
        phase_key = row['observed_phase'] or 'unknown'
        phase_totals.setdefault(phase_key, {name: 0 for name in keys})
        for name in keys:
            phase_totals[phase_key][name] += row['usage'][name]
    return {'schema': 'dispatch_claude_usage/1', 'observed_at': datetime.now(timezone.utc).isoformat(),
            'api_calls': len(calls), 'totals': totals, 'models': models, 'observed_phases': phase_totals,
            'calls': list(calls.values()), 'sources': sources, 'account_bill_usd': None,
            'scope': 'Observed Claude transcript API messages only. Cache categories are distinct. '
                     'Host-only calls, compaction, subscription billing and external providers are separate. '
                     'Missing model, role or effort is unknown, never inferred from the requested route. '
                     'Phase attribution uses retained UTC markers and call timestamps, not inferred task content.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='action', required=True)
    p = sub.add_parser('input-packet'); p.add_argument('--role', required=True)
    p.add_argument('--date', required=True); p.add_argument('--input', action='append', type=Path, required=True)
    p.add_argument('--out', type=Path, required=True)
    p = sub.add_parser('authoring-packet'); p.add_argument('--board', type=Path, required=True)
    p.add_argument('--claims', type=Path, required=True); p.add_argument('--out', type=Path, required=True)
    p = sub.add_parser('phone-packet'); p.add_argument('--packet', type=Path, required=True)
    p.add_argument('--state', type=Path, required=True)
    p.add_argument('--sequence-a', type=Path); p.add_argument('--sequence-b', type=Path)
    p.add_argument('--sequence-current', type=Path)
    p.add_argument('--out', type=Path, required=True)
    p = sub.add_parser('verify-images'); p.add_argument('--packet', type=Path, required=True)
    p.add_argument('--coverage', type=Path, required=True); p.add_argument('--out', type=Path, required=True)
    p = sub.add_parser('plan'); p.add_argument('--role', required=True); p.add_argument('--packet', type=Path, required=True)
    p.add_argument('--task-name', required=True); p.add_argument('--scope', required=True)
    p.add_argument('--mechanical-task', choices=['code-only-review', 'mechanical-correction'])
    p.add_argument('--out', type=Path, required=True)
    p = sub.add_parser('phase'); p.add_argument('name'); p.add_argument('--root', type=Path, default=Path('out/dispatch'))
    p = sub.add_parser('audit'); p.add_argument('--session', type=Path, action='append', required=True)
    p.add_argument('--since'); p.add_argument('--phases', type=Path); p.add_argument('--out', type=Path, required=True)
    p = sub.add_parser('measure'); p.add_argument('--runs', type=Path, default=REPO / 'runs')
    p.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    if args.action == 'phase':
        phase(args.name, args.root); raise SystemExit(0)
    if args.action == 'input-packet':
        result = input_packet(args.role, args.date, args.input)
    elif args.action == 'authoring-packet':
        result = authoring_packet(args.board, args.claims)
    elif args.action == 'phone-packet':
        if (args.sequence_current and (args.sequence_a or args.sequence_b)) or (not args.sequence_current and not (args.sequence_a and args.sequence_b)):
            parser.error('phone-packet needs either both comparison sequences or one current timed sequence')
        result = phone_packet(args.packet, args.state,
                              [args.sequence_current] if args.sequence_current else [args.sequence_a, args.sequence_b],
                              current=bool(args.sequence_current))
    elif args.action == 'plan':
        result = plan(args.role, args.packet, args.task_name, args.scope, args.mechanical_task)
    elif args.action == 'verify-images':
        errors = image_coverage_problems(args.packet, args.coverage)
        result = {'schema': 'dispatch_claude_image_coverage_verification/1', 'complete': not errors,
                  'packet_sha256': digest(args.packet),
                  'coverage_sha256': digest(args.coverage) if args.coverage.is_file() else None,
                  'problems': errors, 'basis': 'Declared exact-page access and retained observations only; no creative approval.'}
    elif args.action == 'measure':
        cfg = dict(read(POLICY)); cfg['effective_date'] = cfg['authorized_at']
        result = agent_runtime.measurements(args.runs, cfg)
    else:
        since = datetime.fromisoformat(args.since.replace('Z', '+00:00')) if args.since else None
        result = usage_report(args.session, since, args.phases)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(result, indent=2) + '\n')
    if args.action == 'verify-images' and not result['complete']:
        print('Claude image coverage incomplete: ' + '; '.join(result['problems']))
        raise SystemExit(1)
    print('Current Claude ' + args.action + ' saved. No worker, provider or render was started.')
