"""Protect one same-worker pivot continuation without approving a rejected repair."""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import re

REPO = Path(__file__).resolve().parents[1]
POLICY = REPO / 'config/film_pivot_capacity_v1.json'
POLICY_SHA256 = '884106e7164292d263e8c4c8377b5264334a8115e2f9eba4132483d97dd67dd7'
REASON = 'mandatory-film-pivot-capacity'
FIELD = 'film_pivot_capacity_evidence'


def sha(text):
    return hashlib.sha256(text.encode()).hexdigest()


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'))


def identity(plan):
    proof = plan[FIELD]
    receipt = json.loads(proof['receipt_json'])
    return sha(canonical({'scope': REASON, 'run_id': receipt['run_id'],
                          'reservation_sha256': receipt['reservation_sha256']}))


def baselines(plan):
    rows = plan.get('changed_inputs')
    if not isinstance(rows, list) or not rows:
        raise ValueError('missing production baselines')
    result = {}
    for row in rows:
        path = row['path']
        if (not isinstance(path, str) or not path or path in result
                or not row.get('before_path')
                or not re.fullmatch(r'[a-f0-9]{64}', str(row.get('before_sha256', '')))):
            raise ValueError('invalid or duplicate production baseline')
        result[path] = {k: row[k] for k in ('path', 'before_path', 'before_sha256')}
    return result


def eligible(state, plan, report):
    """Portable proof binds the real parent grant and charged failed pivot."""
    from autonomous_completion import EVENT, reviewed_film_sha256
    try:
        proof = plan[FIELD]
        receipt = json.loads(proof['receipt_json'])
        rejected = json.loads(proof['rejected_proposal_json'])
        revised = json.loads(proof['revised_proposal_json'])
        if (plan.get('completion_reason') != REASON or plan.get('changed_inputs')
                or plan.get('resources') or plan.get('failed_film_sha256')
                or state.get('mode') != 'production' or state.get('terminal_state') is not None
                or str(state.get('run_id', ''))[:10] < '2026-10-09'
                or proof.get('schema') != 'dispatch_film_pivot_capacity/1'
                or sha(proof['policy_json']) != POLICY_SHA256 or proof['policy_sha256'] != POLICY_SHA256
                or any(sha(proof[k + '_json']) != proof[k + '_sha256'] for k in
                       ('receipt', 'rejected_proposal', 'revised_proposal'))
                or receipt.get('schema') != 'dispatch_pivot_recovery/1'
                or receipt.get('run_id') != state['run_id'] or receipt.get('role') != 'recurrence-pivot'
                or receipt.get('status') != 'completed' or receipt.get('provider_unavailable') is not False
                or receipt.get('model') != 'claude-opus-5-5' or receipt.get('effort') != 'high'
                or receipt.get('action') != 'SendMessage_same_id'
                or not re.fullmatch(r'[A-Za-z0-9_-]{8,100}', receipt.get('agent_id', ''))
                or report.get('verdict') != 'revise' or report.get('film_sha256')
                or report.get('review_scope') != 'recurrence-pivot'
                or not report.get('reviewer_identity')
                or receipt.get('reviewer_identity') != report['reviewer_identity']
                or report['reviewer_identity'] == plan.get('director_identity')
                or receipt.get('report_sha256') != plan.get('failure_evidence_sha256')
                or receipt.get('reported_rejection') != report.get('visible_difference')
                or len(report.get('visible_difference', '')) < 40 or len(report.get('source_basis', '')) < 30):
            return False
        index, reserved = receipt['source_grant_event_index'], receipt['reservation_event_index']
        if (type(index) is not int or type(reserved) is not int
                or not 0 <= index < reserved < len(state['events'])):
            return False
        source, charge = state['events'][index], state['events'][reserved]
        parent = json.loads(source['plan_json'])
        original = json.loads(source['failure_evidence_json'])
        if (source.get('kind') != EVENT or source.get('reason') != 'modern-film-floor'
                or sha(canonical(source)) != receipt['source_grant_sha256']
                or sha(source['failure_evidence_json']) != source['failure_evidence_sha256']
                or original.get('verdict') != 'revise'
                or reviewed_film_sha256(original) != parent.get('failed_film_sha256')
                or charge.get('kind') != 'reserved' or charge.get('resources') != {'storyboard_critics': 1}
                or sha(canonical(charge)) != receipt['reservation_sha256']
                or receipt['agent_id'] not in charge.get('note', '')
                or plan.get('director_identity') != parent.get('director_identity')
                or plan.get('capture_completion_budget') != parent.get('capture_completion_budget')
                or not plan.get('capture_completion_budget')):
            return False
        # No correction or capture has occurred since the protected original path.
        if any(e.get('kind') == 'repair_started' or e.get('kind') == 'reserved'
               and set(e.get('resources', {})) - {'storyboard_critics', 'reported_tokens'}
               for e in state['events'][index + 1:]):
            return False
        if any(e.get('kind') == 'reserved' and e.get('resources', {}).get('storyboard_critics')
               for e in state['events'][reserved + 1:]):
            return False
        if any(p.get('kind') == EVENT and identity(json.loads(p['plan_json'])) == identity(plan)
               for p in state['events'] if json.loads(p.get('plan_json', '{}')).get('completion_reason') == REASON):
            return False
        for proposal in (rejected, revised):
            if (proposal.get('failure_evidence_sha256') != source['failure_evidence_sha256']
                    or proposal.get('failed_film_sha256') != parent['failed_film_sha256']
                    or any(proposal.get(k) != parent.get(k) for k in
                           ('director_identity', 'failure_family', 'repair_scope', 'mechanism_id', 'resources'))):
                return False
        if (report.get('replacement_mechanism_id') != revised.get('mechanism_id')
                or rejected == revised
                or all(rejected.get(k) == revised.get(k) for k in
                       ('repair', 'mechanism_change', 'expected_visible_result'))):
            return False
        previous = [e for e in state['events'][:index] if e.get('kind') == 'repair_started'
                    and e.get('failure_family') == parent['failure_family']]
        # The original film report is already bound by the parent grant and
        # both proposals. The pivot's list follows the recurrence guard's prior
        # failure collection; its rejection is never treated as pivot approval.
        known = {e['failure_sha256'] for e in previous}
        if (len(previous) < 2 or not known <= set(report.get('reviewed_failure_sha256', []))
                or report.get('retired_mechanism_id') not in {e.get('mechanism_id') for e in previous}
                or report.get('retired_mechanism_id') == revised.get('mechanism_id')):
            return False
        old = baselines(parent)
        root = Path(proof['checkout_root'])
        allowed = {str(root / p) for p in json.loads(proof['policy_json'])['additional_baseline_paths']}
        for proposal in (rejected, revised):
            new = baselines(proposal)
            if any(new.get(path) != row for path, row in old.items()) or set(new) - set(old) - allowed:
                return False
        return (proof['original_film_sha256'] == parent['failed_film_sha256']
                and proof['original_concept_sha256'] == original['concept_sha256']
                and proof['original_renderer_sha256'] == original['renderer_sha256']
                and proof['original_claims_sha256'] == original['story_review']['claims_sha256'])
    except (OSError, ValueError, KeyError, TypeError, AttributeError, IndexError):
        return False


def file_problems(state_path, plan):
    """Validate original source and retained proposal bytes before adding capacity."""
    from critic_gate import concept_digest, renderer_digest
    try:
        proof = plan[FIELD]; root = REPO.resolve()
        if digest(POLICY) != POLICY_SHA256 or proof['checkout_root'] != str(root):
            return ['film pivot capacity policy or checkout changed']
        for key in ('receipt', 'rejected_proposal', 'revised_proposal'):
            path = Path(proof[key + '_path']).resolve()
            if not path.is_relative_to(root) or path.read_text() != proof[key + '_json']:
                return ['film pivot capacity retained evidence changed: ' + key]
        package = Path(state_path).resolve().parent
        if package != root / 'out/dispatch':
            return ['film pivot capacity must use the canonical production ledger']
        board = json.loads((package / 'storyboard.json').read_text())
        if (board.get('date') != json.loads(proof['receipt_json'])['run_id'][:10]
                or concept_digest(board) != proof['original_concept_sha256']
                or renderer_digest(board) != proof['original_renderer_sha256']
                or digest(package / 'claims.json') != proof['original_claims_sha256']
                or digest(package / 'preflight.mp4') != proof['original_film_sha256']):
            return ['film pivot capacity production input changed before the continuation']
        for row in baselines(json.loads(proof['revised_proposal_json'])).values():
            for key in ('path', 'before_path'):
                path = Path(row[key]).resolve()
                if not path.is_relative_to(root) or digest(path) != row['before_sha256']:
                    return ['film pivot capacity baseline changed or escaped checkout']
    except (OSError, ValueError, KeyError, TypeError, AttributeError) as exc:
        return ['film pivot capacity could not verify retained inputs: ' + str(exc)]
    return []


def prepare(state_path, receipt_path, report_path, rejected_proposal, revised_proposal, output):
    from run_controller import read_state
    state = read_state(Path(state_path))
    receipt_text = Path(receipt_path).read_text(); receipt = json.loads(receipt_text)
    source = state['events'][receipt['source_grant_event_index']]
    original = json.loads(source['failure_evidence_json'])
    plan = copy.deepcopy(json.loads(source['plan_json']))
    report_text = Path(report_path).read_text()
    plan.update(completion_reason=REASON, changed_inputs=[], resources={},
                failure_evidence=str(Path(report_path).resolve()), failure_evidence_sha256=sha(report_text))
    plan.pop('failed_film_sha256', None); plan.pop('pivot_review', None)
    proof = {'schema': 'dispatch_film_pivot_capacity/1', 'policy_json': POLICY.read_text(),
             'policy_sha256': POLICY_SHA256, 'checkout_root': str(REPO.resolve()),
             'original_film_sha256': json.loads(source['plan_json'])['failed_film_sha256'],
             'original_concept_sha256': original['concept_sha256'],
             'original_renderer_sha256': original['renderer_sha256'],
             'original_claims_sha256': original['story_review']['claims_sha256']}
    for key, path in (('receipt', receipt_path), ('rejected_proposal', rejected_proposal),
                      ('revised_proposal', revised_proposal)):
        text = Path(path).read_text()
        proof.update({key + '_path': str(Path(path).resolve()), key + '_json': text, key + '_sha256': sha(text)})
    plan[FIELD] = proof
    if not eligible(state, plan, json.loads(report_text)):
        raise ValueError('film pivot capacity needs the actual charged rejection and unchanged funded repair')
    errors = file_problems(state_path, plan)
    if errors:
        raise ValueError('; '.join(errors))
    with Path(output).open('x') as stream:
        json.dump(plan, stream, indent=2); stream.write('\n')
    return plan


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('state', 'receipt', 'report', 'rejected-proposal', 'revised-proposal', 'output'):
        parser.add_argument('--' + name, type=Path, required=True)
    args = parser.parse_args()
    prepare(args.state, args.receipt, args.report, args.rejected_proposal, args.revised_proposal, args.output)
    print('Bound one same-worker film pivot capacity request; no grant, reservation, repair or review approval.')
