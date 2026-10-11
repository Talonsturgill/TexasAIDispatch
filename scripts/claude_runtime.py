"""Claude-native compact leaf plans and private observed token accounting."""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
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


def plan(role, packet_path, task_name, scope):
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
    if len(message) > 1800:
        raise ValueError('Claude assignment exceeds the compact handoff limit')
    return {'assignment': route, 'packet': bound(packet_path), 'brief': bound(REPO / expected),
            'agent_args': {'subagent_type': route['agent'], 'description': task_name[:50], 'prompt': message},
            'model_binding': 'The versioned leaf definition pins the exact model and effort. '
                             'Do not substitute Codex model or fork arguments.',
            'reservation': 'Reserve the existing controller resource before executing this plan. '
                           'The three final scorers remain one atomic charged panel.'}


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
    p = sub.add_parser('plan'); p.add_argument('--role', required=True); p.add_argument('--packet', type=Path, required=True)
    p.add_argument('--task-name', required=True); p.add_argument('--scope', required=True)
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
    elif args.action == 'plan':
        result = plan(args.role, args.packet, args.task_name, args.scope)
    elif args.action == 'measure':
        cfg = dict(read(POLICY)); cfg['effective_date'] = cfg['authorized_at']
        result = agent_runtime.measurements(args.runs, cfg)
    else:
        since = datetime.fromisoformat(args.since.replace('Z', '+00:00')) if args.since else None
        result = usage_report(args.session, since, args.phases)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(result, indent=2) + '\n')
    print('Current Claude ' + args.action + ' saved. No worker, provider or render was started.')
