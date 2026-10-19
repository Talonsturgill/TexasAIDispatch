"""Fund one corrected public-evidence task; a safeguard refusal is never an outage."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re

REPO = Path(__file__).resolve().parents[1]
POLICY = REPO / 'config/review_prompt_repair_v1.json'
POLICY_SHA256 = '781d5ac5c511bb2f12d9a8595f04513951403085570ad0e22c562c1b979c2e7d'
REASON = 'mandatory-public-review-prompt-repair'
FIELD = 'public_review_prompt_repair'
PUBLIC_CONTRACT = {'schema': 'dispatch_public_visual_facts/1',
                   'fields': ['page', 'objects', 'actions', 'text'],
                   'content': 'visible content only', 'evaluation': 'final report only'}
PUBLIC_INSTRUCTION = ('After each image Read, provide a brief public image description as a factual '
    'JSON record with page, objects, actions and text in ordinary assistant text BEFORE another Read. '
    'Record only visible objects, visible actions and literal on-screen text; use null for unknowns. '
    'Put quality findings and brief public explanations only in the final review JSON. '
    'Preserve these factual records for the coverage report. ')
ERROR_PREFIX = "API Error: Opus 5.5's safeguards flagged this message [reasoning_extraction]"
CORE = ('role', 'date', 'story_sha256', 'board', 'claims', 'story', 'quality_contract', 'rubric',
        'treatments', 'asset_inputs', 'selection', 'opening_comparison', 'narration_picture',
        'review_scope', 'phone_mode', 'phone_options')


def sha(text):
    return hashlib.sha256(text.encode()).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'))


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def references(value):
    if isinstance(value, dict):
        if {'path', 'sha256'} <= value.keys():
            yield value
        for child in value.values():
            yield from references(child)
    elif isinstance(value, list):
        for child in value:
            yield from references(child)


def portable(data):
    root = str(Path(data['board']['path']).parents[2])
    return json.loads(json.dumps(data).replace(root + '/', '<checkout>/'))


def identity(plan):
    receipt = json.loads(plan[FIELD]['receipt_json'])
    return sha(canonical({'scope': REASON, 'run_id': receipt['run_id'],
                          'reservation_sha256': receipt['reservation_sha256']}))


def required_counts(plan, counts):
    return {**counts, 'storyboard_critics': 4}


def apply_budget(plan, budget):
    if plan.get('completion_reason') != REASON or not budget.get('resources'):
        return budget
    rows = {k: {**v, 'required': 4 if k == 'storyboard_critics' else v['required']}
            for k, v in budget['resources'].items()}
    deficits = {k: v['required'] - v['remaining'] for k, v in rows.items()
                if v['required'] > v['remaining']}
    return {**budget, 'resources': rows, 'deficits': deficits, 'feasible': not deficits,
            'path': REASON}


def eligible(state, plan, receipt):
    try:
        proof = plan[FIELD]; policy = json.loads(proof['policy_json'])
        old = json.loads(proof['original_packet_json']); new = json.loads(proof['revised_packet_json'])
        index = receipt['reservation_event_index']
        if (state.get('mode') != 'production' or state.get('terminal_state') is not None
                or str(state['run_id'])[:10] < '2026-10-19'
                or plan.get('completion_reason') != REASON or plan.get('repair_scope') != 'capacity-only'
                or plan.get('changed_inputs') or plan.get('resources')
                or plan.get('retry') != policy['retry']
                or sha(proof['policy_json']) != POLICY_SHA256 or proof['policy_sha256'] != POLICY_SHA256
                or any(sha(proof[k + '_json']) != proof[k + '_sha256']
                       for k in ('receipt', 'original_packet', 'revised_packet'))
                or json.loads(proof['receipt_json']) != receipt
                or plan['failure_evidence_sha256'] != proof['receipt_sha256']
                or receipt.get('schema') != 'dispatch_review_prompt_failure/1'
                or receipt.get('run_id') != state['run_id'] or receipt.get('role') != 'phone'
                or receipt.get('status') != 'refused' or receipt.get('verdict') is not None
                or receipt.get('category') != 'reasoning_extraction'
                or receipt.get('provider_unavailable') is not False
                or receipt.get('model') != 'claude-opus-5-5' or receipt.get('effort') != 'high'
                or not re.fullmatch(r'[A-Za-z0-9_-]{8,100}', receipt.get('actor', ''))
                or type(index) is not int or not 0 <= index < len(state['events'])
                or len(receipt.get('error', '')) > 8192
                or not receipt.get('error', '').lstrip().startswith(ERROR_PREFIX)
                or receipt.get('original_packet_sha256') != proof['original_packet_sha256']
                or old.get('public_visual_evidence') == PUBLIC_CONTRACT
                or new.get('public_visual_evidence') != PUBLIC_CONTRACT
                or PUBLIC_INSTRUCTION not in new.get('instructions', '')
                or old == new or old.get('role') != 'storyboard-critic'
                or old.get('date') != str(state['run_id'])[:10]
                or old.get('phone_mode') != 'comparison' or len(old.get('phone_options', [])) != 2):
            return False
        charge = state['events'][index]
        if (charge.get('kind') != 'reserved' or charge.get('resources') != {'storyboard_critics': 1}
                or sha(canonical(charge)) != receipt['reservation_sha256']
                or proof['original_packet_sha256'][:8] not in charge.get('note', '')
                or any(e.get('kind') == 'reserved' and e.get('resources', {}).get('storyboard_critics')
                       for e in state['events'][index + 1:])
                or any(e.get('reason') == REASON for e in state['events'])):
            return False
        observed = datetime.fromisoformat(receipt['observed_at'].replace('Z', '+00:00'))
        charged = datetime.fromisoformat(charge['at'].replace('Z', '+00:00'))
        if observed.tzinfo is None or charged.tzinfo is None or observed < charged:
            return False
        left, right = portable(old), portable(new)
        if any(left.get(k) != right.get(k) for k in CORE):
            return False
        if not {r['path'] for r in references(left)} <= {r['path'] for r in references(right)}:
            return False
        from claude_runtime import image_policy_inputs
        image_policy_inputs(new)
        return True
    except (KeyError, ValueError, TypeError, AttributeError, IndexError):
        return False


def file_problems(state_path, plan):
    try:
        root = REPO.resolve(); proof = plan[FIELD]
        if digest(POLICY) != POLICY_SHA256 or not Path(state_path).resolve().is_relative_to(root):
            return ['prompt repair requires its pinned policy and owned production checkout']
        for key in ('receipt', 'original_packet', 'revised_packet'):
            p = Path(proof[key + '_path']).resolve()
            if not p.is_relative_to(root) or p.read_text() != proof[key + '_json']:
                return ['prompt repair retained evidence changed: ' + key]
        receipt = json.loads(proof['receipt_json']); error = receipt['error_evidence']
        p = Path(error['path']).resolve()
        if (not p.is_relative_to(root) or digest(p) != error['sha256']
                or receipt['error'] != p.read_text()):
            return ['retain the actual native refusal without converting it to unavailability']
        current = json.loads(proof['revised_packet_json'])
        for ref in references(current):
            p = Path(ref['path']).resolve()
            if not p.is_relative_to(root) or digest(p) != ref['sha256']:
                return ['prompt repair current guide, source, board or film changed: ' + str(p)]
        package = Path(state_path).resolve().parent
        for key, filename in (('board', 'storyboard.json'), ('claims', 'claims.json')):
            if current[key]['sha256'] != digest(package / filename):
                return ['prompt repair belongs to other current ' + key]
    except (OSError, ValueError, KeyError, TypeError) as exc:
        return ['prompt repair evidence could not be verified: ' + str(exc)]
    return []


def record_failure(state_path, error_path, actor, original_path, output):
    """Bind existing host evidence and the latest charge without another model call."""
    from run_controller import read_state
    state = read_state(Path(state_path)); old = json.loads(Path(original_path).read_text())
    error = Path(error_path).read_text()
    if len(error) > 8192 or not error.lstrip().startswith(ERROR_PREFIX):
        raise ValueError('retain the actual legacy native refusal; no other error qualifies')
    matches = [(i, row) for i, row in enumerate(state['events'])
               if row.get('kind') == 'reserved' and row.get('resources', {}).get('storyboard_critics')]
    if not matches:
        raise ValueError('no actual charged phone attempt exists')
    index, charge = matches[-1]
    packet_sha = digest(original_path)
    if packet_sha[:8] not in charge.get('note', ''):
        raise ValueError('the latest actual charge does not identify this original packet')
    board = json.loads(Path(old['board']['path']).read_text())
    director = board['story_contract']['director_identity']
    receipt = {'schema': 'dispatch_review_prompt_failure/1', 'run_id': state['run_id'],
        'role': 'phone', 'status': 'refused', 'verdict': None, 'category': 'reasoning_extraction',
        'provider_unavailable': False, 'model': 'claude-opus-5-5', 'effort': 'high',
        'actor': actor, 'director_identity': director, 'observed_at': datetime.now(timezone.utc).isoformat(),
        'error': error, 'error_evidence': {'path': str(Path(error_path).resolve()), 'sha256': digest(error_path)},
        'reservation_event_index': index, 'reservation_sha256': sha(canonical(charge)),
        'original_packet_sha256': packet_sha}
    with Path(output).open('x') as stream:
        json.dump(receipt, stream, indent=2); stream.write('\n')
    return receipt


def prepare(state_path, receipt_path, original_path, revised_path, output):
    from run_controller import read_state
    state = read_state(Path(state_path)); receipt_text = Path(receipt_path).read_text()
    proof = {'policy_json': POLICY.read_text(), 'policy_sha256': POLICY_SHA256}
    for key, path in (('receipt', receipt_path), ('original_packet', original_path), ('revised_packet', revised_path)):
        text = Path(path).read_text()
        proof.update({key + '_json': text, key + '_sha256': sha(text), key + '_path': str(Path(path).resolve())})
    receipt = json.loads(receipt_text)
    plan = {'completion_reason': REASON, 'repair_scope': 'capacity-only', 'resources': {},
            'changed_inputs': [], 'director_identity': receipt['director_identity'],
            'failure_evidence': str(Path(receipt_path).resolve()), 'failure_evidence_sha256': sha(receipt_text),
            'retry': json.loads(proof['policy_json'])['retry'], FIELD: proof}
    if not eligible(state, plan, receipt):
        raise ValueError('the charged refusal and genuinely corrected public-evidence packet are not bound')
    errors = file_problems(state_path, plan)
    if errors:
        raise ValueError('; '.join(errors))
    with Path(output).open('x') as stream:
        json.dump(plan, stream, indent=2); stream.write('\n')
    return plan


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state', type=Path, required=True)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--receipt', type=Path)
    group.add_argument('--capture-receipt', type=Path)
    parser.add_argument('--error-evidence', type=Path)
    parser.add_argument('--actor')
    parser.add_argument('--original-packet', type=Path, required=True)
    parser.add_argument('--revised-packet', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    a = parser.parse_args()
    if a.capture_receipt:
        if not a.error_evidence or not a.actor:
            parser.error('--capture-receipt needs the actual --error-evidence and --actor')
        record_failure(a.state, a.error_evidence, a.actor, a.original_packet, a.capture_receipt)
    prepare(a.state, a.receipt or a.capture_receipt, a.original_packet, a.revised_packet, a.output)
    print('Public-evidence prompt repair prepared; no call, capacity, refusal override or review approval granted.')


if __name__ == '__main__':
    main()
