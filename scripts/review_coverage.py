"""Fund completion of an independently disclosed incomplete code review, never approval."""
import hashlib
import json
from pathlib import Path
import re

REASON = 'mandatory-review-coverage'
ADOPTION = 'autonomous_completion_coverage_adopted'
POLICY = Path(__file__).resolve().parents[1] / 'config/autonomous_completion_coverage_v1.json'
POLICY_SHA256 = '7939c89e72eb0f65df3a11032e3f8c7b0bdcbd4dc4c2379c63680e46ee998d7b'


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def strings(value):
    if isinstance(value, str):
        yield value
        if value.lstrip().startswith(('{', '[')):
            try:
                decoded = json.loads(value)
            except ValueError:
                pass
            else:
                yield from strings(decoded)
    elif isinstance(value, dict):
        for item in value.values():
            yield from strings(item)
    elif isinstance(value, list):
        for item in value:
            yield from strings(item)


def references(value):
    if isinstance(value, dict):
        if set(value) >= {'path', 'sha256'}:
            yield {'path': value['path'], 'sha256': value['sha256']}
        for item in value.values():
            yield from references(item)
    elif isinstance(value, list):
        for item in value:
            yield from references(item)


def identity(plan):
    from autonomous_completion import canonical, sha
    receipt = json.loads(plan['coverage_evidence']['receipt_json'])
    return sha(canonical({'scope': REASON, 'run_id': receipt['run_id'],
                          'reservation_sha256': receipt['reservation_sha256'],
                          'report_sha256': receipt['report_sha256']}))


def eligible(state, plan, report):
    from autonomous_completion import CODE_ADOPTION, canonical, sha
    try:
        proof = plan['coverage_evidence']
        receipt = json.loads(proof['receipt_json'])
        old = json.loads(proof['original_packet_json'])
        current = json.loads(proof['current_packet_json'])
        if (sha(proof['policy_json']) != POLICY_SHA256 or proof['policy_sha256'] != POLICY_SHA256
                or any(sha(proof[k + '_json']) != proof[k + '_sha256']
                       for k in ('receipt', 'original_packet', 'current_packet'))
                or state.get('mode') != 'production' or state.get('terminal_state') is not None
                or str(state.get('run_id', ''))[:10] < '2026-10-09'
                or not any(e.get('kind') == CODE_ADOPTION for e in state['events'])
                or plan.get('changed_inputs') or plan.get('resources') != {'storyboard_critics': 3}
                or receipt.get('schema') != 'dispatch_review_coverage/1'
                or receipt.get('run_id') != state['run_id'] or receipt.get('role') != 'code'
                or receipt.get('status') != 'completed' or receipt.get('provider_unavailable') is not False
                or receipt.get('model') != 'claude-opus-5-5' or receipt.get('effort') != 'high'
                or receipt.get('action') != 'SendMessage_same_id'
                or not re.fullmatch(r'[A-Za-z0-9_-]{8,100}', receipt.get('agent_id', ''))
                or receipt.get('report_sha256') != plan['failure_evidence_sha256']
                or not receipt.get('reviewer_identity') or receipt['reviewer_identity'] == plan['director_identity']
                or receipt['reviewer_identity'] not in set(strings(report))):
            return False
        quote = receipt['reported_limits']
        if (not isinstance(quote, str) or not re.search(r'not read in full|not.*read.*full|read.*in part', quote, re.I)
                or quote not in '\n'.join(strings(report))):
            return False
        index = receipt['reservation_event_index']
        if type(index) is not int or not 0 <= index < len(state['events']):
            return False
        reservation = state['events'][index]
        if (reservation.get('kind') != 'reserved' or reservation.get('resources') != {'storyboard_critics': 1}
                or sha(canonical(reservation)) != receipt['reservation_sha256']
                or any(e.get('kind') == 'reserved' and e.get('resources', {}).get('storyboard_critics')
                       for e in state['events'][index + 1:])):
            return False
        for packet in (old, current):
            route = packet['agent_assignment']
            if (packet.get('role') != 'storyboard-critic' or packet.get('date') != str(state['run_id'])[:10]
                    or route.get('model') != receipt['model'] or route.get('effort') != receipt['effort']):
                return False
        # New instructions may be current; the production inputs must stay byte-identical.
        for key in ('board', 'claims', 'treatments', 'asset_inputs'):
            if old.get(key) != current.get(key) or not old.get(key):
                return False
        old_refs = {x['path']: x['sha256'] for x in references(old)}
        current_refs = {x['path']: x['sha256'] for x in references(current)}
        required = {x['path']: x['sha256'] for key in ('agent_contracts', 'craft_readings', 'completion_readings')
                    for x in references(old.get(key, []))}
        required.update({x['path']: x['sha256'] for x in references(old['board'])})
        required.update({x['path']: x['sha256'] for x in references(old['treatments'])})
        missing = receipt['missing_inputs']
        if (not isinstance(missing, list) or not missing
                or len({x['path'] for x in missing}) != len(missing)
                or any(x.get('read_complete') is not False or required.get(x['path']) != x.get('sha256')
                       or x['path'] not in current_refs for x in missing)):
            return False
        rows = proof['inputs']
        actual = {x['path']: x['sha256'] for x in rows}
        return (len(actual) == len(rows) and current_refs.items() <= actual.items()
                and all(re.fullmatch(r'[a-f0-9]{64}', x['sha256']) for x in rows)
                and old_refs.get(old['board']['path']) == old['board']['sha256'])
    except (KeyError, TypeError, ValueError, AttributeError):
        return False


def file_problems(plan):
    try:
        root = POLICY.parent.parent.resolve()
        proof = plan['coverage_evidence']
        for row in proof['inputs']:
            path = Path(row['path']).resolve()
            if not path.is_relative_to(root) or digest(path) != row['sha256']:
                return ['coverage review input is stale or outside this checkout']
        for key in ('original_packet', 'current_packet'):
            path = Path(proof[key + '_path']).resolve()
            if not path.is_relative_to(root) or path.read_text() != proof[key + '_json']:
                return ['coverage packet differs from its retained bytes']
        from agent_runtime import validate_references
        from claude_runtime import contracts
        from agent_runtime import required_inputs
        current = json.loads(proof['current_packet_json'])
        validate_references(current)
        required_inputs(current, 'storyboard-critic', contracts('storyboard-critic'))
    except (OSError, ValueError, KeyError, TypeError) as exc:
        return ['coverage evidence could not be verified: ' + str(exc)]
    return []


def prepare(state_path, receipt_path, report_path, original_packet, current_packet, output):
    from autonomous_completion import canonical, sha
    from run_controller import read_state
    state = read_state(Path(state_path))
    receipt_text = Path(receipt_path).read_text()
    receipt = json.loads(receipt_text)
    report_text = Path(report_path).read_text()
    old_text, current_text = Path(original_packet).read_text(), Path(current_packet).read_text()
    current = json.loads(current_text)
    rows = {x['path']: x for x in references(current)}
    # Include complete current renderer closures, which are stored in each board.
    for item in [current['board'], *current['treatments']]:
        board = json.loads(Path(item['path']).read_text())
        root = POLICY.parent.parent.resolve()
        for renderer in board['film_direction']['renderer_inputs']:
            path = str((root / renderer['path']).resolve())
            rows[path] = {'path': path, 'sha256': renderer['sha256']}
    proof = {'policy_json': POLICY.read_text(), 'policy_sha256': POLICY_SHA256,
             'receipt_json': receipt_text, 'receipt_sha256': sha(receipt_text),
             'original_packet_json': old_text, 'original_packet_sha256': sha(old_text),
             'current_packet_json': current_text, 'current_packet_sha256': sha(current_text),
             'original_packet_path': str(Path(original_packet).resolve()),
             'current_packet_path': str(Path(current_packet).resolve()), 'inputs': list(rows.values())}
    plan = {'director_identity': receipt['director_identity'], 'completion_reason': REASON,
            'repair_scope': 'review-coverage', 'changed_inputs': [],
            'resources': {'storyboard_critics': 3}, 'coverage_evidence': proof,
            'failure_evidence': str(Path(report_path).resolve()), 'failure_evidence_sha256': sha(report_text)}
    if not eligible(state, plan, json.loads(report_text)):
        raise ValueError('retained independent handback does not prove this unchanged assignment is incomplete')
    errors = file_problems(plan)
    if errors:
        raise ValueError('; '.join(errors))
    with Path(output).open('x') as stream:
        json.dump(plan, stream, indent=2); stream.write('\n')
    return plan


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('state', 'receipt', 'report', 'original-packet', 'current-packet', 'output'):
        parser.add_argument('--' + name, type=Path, required=True)
    args = parser.parse_args()
    prepare(args.state, args.receipt, args.report, args.original_packet, args.current_packet, args.output)
    print('Bound unchanged review-coverage plan. No capacity, reservation or approval granted.')
