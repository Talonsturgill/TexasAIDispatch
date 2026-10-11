"""Bind a spent infrastructure capture to one exact finish-current deficit.

The original independent report stays unchanged. This proof identifies the new
failed capture, not a new artistic verdict. Reserve and authorize every retry.
"""
import argparse
import json
from pathlib import Path
import re

REPO = Path(__file__).resolve().parents[1]
POLICY = REPO / 'config/capture_retry_capacity_v1.json'
POLICY_SHA256 = '3dbde65b53684fae9d6c976744086084b32810497137cea26354b3cbcb517e15'
KEY = 'capture_retry_evidence'


def digest(path):
    import hashlib
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def identity(plan):
    from autonomous_completion import canonical, sha
    proof = plan[KEY]
    return sha(canonical({'scope': 'capture-retry-capacity-v1', 'run_id': proof['run_id'],
                         'reservation_sha256': proof['reservation_sha256']}))


def eligible(state, plan, report):
    from autonomous_completion import EVENT, canonical, sha
    from capture_guard import SCHEMA, event_digest, normalize
    try:
        proof = plan[KEY]; auth = json.loads(proof['authorization_json'])
        source = state['events'][proof['source_grant_index']]
        reservation = state['events'][proof['reservation_index']]
        commands = [c for c in auth['commands'] if c['id'] == proof['command_id']]
        boards = [b for b in auth['boards'] if b['path'] == proof['board_path']]
        current = json.loads(proof['board_json'])
        return (proof['schema'] == 'dispatch_capture_retry_evidence/1'
            and sha(proof['policy_json']) == proof['policy_sha256'] == POLICY_SHA256
            and sha(proof['authorization_json']) == proof['authorization_sha256']
            and sha(proof['failure_log']) == proof['failure_log_sha256']
            and sha(proof['board_json']) == proof['board_sha256']
            and state.get('mode') == 'production' and state.get('terminal_state') is None
            and str(state['run_id'])[:10] >= '2026-10-09' and proof['run_id'] == state['run_id']
            and plan.get('completion_reason') == 'finish-current' and not plan.get('changed_inputs')
            and not plan.get('resources') and not plan.get('failed_film_sha256')
            and source['kind'] == EVENT and source['reason'] == 'finish-current'
            and type(proof['source_grant_index']) is int and type(proof['reservation_index']) is int
            and 0 <= proof['source_grant_index'] < proof['reservation_index']
            and sha(canonical(source)) == proof['source_grant_sha256']
            and source['failure_evidence_sha256'] == plan['failure_evidence_sha256']
            and json.loads(source['failure_evidence_json']) == report and report.get('verdict') == 'pass'
            and re.fullmatch(r'[a-f0-9]{64}', report.get('film_sha256', '')) is not None
            and reservation['kind'] == 'reserved' and reservation['resources'] == {'preflight_renders': 1}
            and event_digest(reservation) == proof['reservation_sha256']
            and auth['schema'] == SCHEMA and auth.get('allowed') is True
            and auth['headroom']['passed'] is True and auth['art_receipts_recorded'] is True
            and auth['housekeeping'].get('receipt_sha256') not in (None, 'none')
            and auth['render_reservation']['event_sha256'] == proof['reservation_sha256']
            and auth['render_reservation']['resource'] == 'preflight_renders'
            and len(commands) == 1 and commands[0].get('consumed')
            and commands[0]['id'] == sha(normalize(commands[0]['text']))
            and 'cinema_proof.py' in commands[0]['text']
            and proof['failure_log'].strip() == ('cinema_proof: s1 has no unique principal-picture event'
                                                 '\n\n[exited with code 1]')
            and not any(e.get('kind') == 'reserved' and e.get('resources',{}).get('preflight_renders')
                        for e in state['events'][proof['reservation_index']+1:])
            and len(boards) == 1 and boards[0]['sha256'] == proof['board_sha256']
            and current['date'] == str(state['run_id'])[:10]
            and current['cinematic_template'] == 'directed-film-v2')
    except (KeyError, TypeError, ValueError, AttributeError, IndexError):
        return False


def file_problems(plan):
    from autonomous_completion import sha
    errors = []
    try:
        proof = plan[KEY]; root = REPO.resolve()
        if digest(POLICY) != POLICY_SHA256:
            errors.append('capture retry policy differs from its pinned bytes')
        for field in ('authorization', 'failure_log', 'board'):
            path = (root / proof[field + '_path']).resolve()
            expected = proof['failure_log'] if field == 'failure_log' else proof[field + '_json']
            if not path.is_relative_to(root) or path.read_text() != expected:
                errors.append('capture retry retained bytes changed: ' + field)
        for row in proof['input_bindings']:
            path = (root / row['path']).resolve()
            if not path.is_relative_to(root) or digest(path) != row['sha256']:
                errors.append('capture retry production input changed: ' + row['path'])
        original = json.loads(proof['authorization_json'])
        bindings = {row['path']: row['sha256'] for row in proof['input_bindings']}
        mandatory = {proof['board_path']} | { 'out/dispatch/' + name for name in
            ('claims.json','mix.wav','captions.json','words.json','vo_script.txt')}
        mandatory.update(str(p.relative_to(root)) for p in (root/'out/dispatch/sources').rglob('*') if p.is_file())
        if len(bindings) != len(proof['input_bindings']) or not mandatory <= set(bindings):
            errors.append('capture retry lacks complete unique source, story, audio and caption bindings')
        if any(bindings.get(p) != h for files in original['bound'].values() for p,h in files.items()):
            errors.append('capture retry differs from the failed capture renderer or artwork bindings')
        from capture_guard import analyze, command_inputs, resolve
        command = next(c for c in original['commands'] if c['id'] == proof['command_id'])
        segments = analyze(command['text'], str(root))
        if not segments or any(Path(t).name != 'cinema_proof.py' for tokens,_ in segments
                               for t in tokens if Path(t).name.endswith('_proof.py')):
            errors.append('capture retry command does not name the actual native proof tool')
        declared = [resolve(value,cwd).resolve() for tokens,cwd in segments or []
                    for flag,value in command_inputs(tokens) if flag == 'board']
        if declared != [(root/proof['board_path']).resolve()]:
            errors.append('capture retry command does not bind the exact current board')
        import cinema_cache
        board = root / proof['board_path']; data = json.loads(board.read_text())
        schedule = cinema_cache.sample_frames(data)
        if set(schedule) != set(s['id'] for s in data['scenes']) or any(len(v) != 3 for v in schedule.values()):
            errors.append('capture retry requires the repaired real sampler for every current scene')
        if digest(root / 'out/dispatch/preflight.mp4') != json.loads(Path(plan['failure_evidence']).read_text())['film_sha256']:
            errors.append('capture retry must retain the independently passed timed phone bytes')
    except (OSError, ValueError, KeyError, TypeError) as exc:
        errors.append('capture retry could not verify retained infrastructure evidence: ' + str(exc))
    return errors


def prepare(state_path, authorization, failure_log, output):
    from autonomous_completion import EVENT, canonical, sha
    from run_controller import read_state
    from capture_guard import event_digest
    state = read_state(Path(state_path)); root = REPO.resolve()
    auth_text = Path(authorization).read_text(); auth = json.loads(auth_text)
    log = Path(failure_log).read_text()
    source_index = max(i for i,e in enumerate(state['events']) if e.get('kind') == EVENT and e.get('reason') == 'finish-current')
    source = state['events'][source_index]; plan = json.loads(source['plan_json'])
    plan['resources'] = {}; plan.pop('failed_film_sha256', None)
    reservation_index = next(i for i,e in enumerate(state['events']) if e.get('kind') == 'reserved'
        and event_digest(e) == auth['render_reservation']['event_sha256'])
    command = next(c for c in auth['commands'] if c.get('consumed') and 'cinema_proof.py' in c['text'])
    board_path = 'out/dispatch/storyboard.json'; board = root / board_path
    paths = {root / b['path'] for b in auth['boards']}
    paths.update(root / p for files in auth['bound'].values() for p in files)
    paths.update(p for p in board.parent.rglob('*') if p.is_file()
                 and (p.name in {'claims.json','mix.wav','captions.json','words.json','vo_script.txt'}
                      or 'sources' in p.relative_to(board.parent).parts))
    plan[KEY] = {'schema': 'dispatch_capture_retry_evidence/1', 'run_id': state['run_id'],
        'policy_json': POLICY.read_text(), 'policy_sha256': POLICY_SHA256,
        'source_grant_index': source_index, 'source_grant_sha256': sha(canonical(source)),
        'reservation_index': reservation_index, 'reservation_sha256': auth['render_reservation']['event_sha256'],
        'command_id': command['id'], 'authorization_path': str(Path(authorization).resolve().relative_to(root)),
        'authorization_json': auth_text, 'authorization_sha256': sha(auth_text),
        'failure_log_path': str(Path(failure_log).resolve().relative_to(root)),
        'failure_log': log, 'failure_log_sha256': sha(log), 'board_path': board_path,
        'board_json': board.read_text(), 'board_sha256': digest(board),
        'input_bindings': [{'path': str(p.resolve().relative_to(root)), 'sha256': digest(p)} for p in sorted(paths)]}
    if not eligible(state, plan, json.loads(source['failure_evidence_json'])):
        raise ValueError('actual spent capture and retained sampler failure do not bind the passed current cut')
    errors = file_problems(plan)
    if errors:
        raise ValueError('; '.join(errors))
    with Path(output).open('x') as stream:
        json.dump(plan, stream, indent=2); stream.write('\n')
    return plan


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('state', 'authorization', 'failure-log', 'output'):
        parser.add_argument('--' + name, type=Path, required=True)
    args = parser.parse_args()
    prepare(args.state, args.authorization, args.failure_log, args.output)
    print('Bound actual spent infrastructure capture; no capacity or review approval granted.')
