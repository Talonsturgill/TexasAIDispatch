"""Protect the full remaining path after a charged recurrence pivot rejection."""
import argparse
import json
from pathlib import Path
import re

import modern_code_recovery as modern

REASON = 'mandatory-pivot-recovery'
ADOPTION = 'autonomous_completion_pivot_adopted'
POLICY = Path(__file__).resolve().parents[1] / 'config/autonomous_completion_pivot_v1.json'
POLICY_SHA256 = '9343953d430d9bbdbb7534b2cf5d4f9deee4b3e698292f835d0341ce866fc6cf'


def identity(plan):
    from autonomous_completion import canonical, sha
    receipt = json.loads(plan['pivot_recovery_evidence']['receipt_json'])
    # Renaming a proposal or rewriting report whitespace cannot buy another grant.
    return sha(canonical({'scope': REASON, 'run_id': receipt['run_id'],
                          'reservation_sha256': receipt['reservation_sha256']}))


def frozen_inputs_equal(current, original):
    """Current instructions may refresh; production bytes and core guides stay fixed."""
    for key in ('schema', 'modern_json', 'guide_text', 'reviewed_board_path', 'renderer_sha256'):
        if current[key] != original[key]:
            return False
    new_packet, old_packet = json.loads(current['packet_json']), json.loads(original['packet_json'])
    if any(new_packet.get(k) != old_packet.get(k) for k in
           ('role', 'date', 'agent_assignment', 'board', 'claims', 'treatments', 'asset_inputs')):
        return False
    rows = lambda p: {x['path']: x for x in p['inputs'] if x['kind'] in {'board', 'claims', 'renderer'}}
    return rows(current) == rows(original)


def eligible(state, plan, report):
    from autonomous_completion import CODE_ADOPTION, EVENT, canonical, sha
    try:
        proof = plan['pivot_recovery_evidence']; receipt = json.loads(proof['receipt_json'])
        old = json.loads(proof['rejected_proposal_json'])
        index, reserved = receipt['source_grant_event_index'], receipt['reservation_event_index']
        if (proof.get('schema') != 'dispatch_pivot_recovery_evidence/1'
                or sha(proof['policy_json']) != POLICY_SHA256 or proof['policy_sha256'] != POLICY_SHA256
                or any(sha(proof[k + '_json']) != proof[k + '_sha256']
                       for k in ('receipt', 'rejected_proposal'))
                or state.get('mode') != 'production' or state.get('terminal_state') is not None
                or str(state.get('run_id', ''))[:10] < '2026-10-09'
                or not any(e.get('kind') == CODE_ADOPTION for e in state['events'])
                or not any(e.get('kind') == modern.ADOPTION for e in state['events'])
                or receipt.get('schema') != 'dispatch_pivot_recovery/1'
                or receipt.get('run_id') != state['run_id'] or receipt.get('role') != 'recurrence-pivot'
                or receipt.get('status') != 'completed' or receipt.get('provider_unavailable') is not False
                or receipt.get('model') != 'claude-opus-5-5' or receipt.get('effort') != 'high'
                or receipt.get('action') != 'SendMessage_same_id'
                or not re.fullmatch(r'[A-Za-z0-9_-]{8,100}', receipt.get('agent_id', ''))
                or type(index) is not int or type(reserved) is not int
                or not 0 <= index < reserved < len(state['events'])
                or report.get('verdict') != 'revise' or report.get('film_sha256')
                or not report.get('reviewer_identity')
                or receipt.get('reviewer_identity') != report['reviewer_identity']
                or report['reviewer_identity'] == plan.get('director_identity')
                or receipt.get('report_sha256') != plan.get('failure_evidence_sha256')
                or len(report.get('visible_difference', '')) < 40 or len(report.get('source_basis', '')) < 30
                or receipt.get('reported_rejection') != report['visible_difference']):
            return False
        grant, reservation = state['events'][index], state['events'][reserved]
        if (grant.get('kind') != EVENT or grant.get('reason') != modern.REASON
                or sha(canonical(grant)) != receipt['source_grant_sha256']
                or reservation.get('kind') != 'reserved'
                or reservation.get('resources') != {'storyboard_critics': 1}
                or sha(canonical(reservation)) != receipt['reservation_sha256']
                or receipt['agent_id'] not in reservation.get('note', '')
                or any(e.get('kind') == 'repair_started'
                       or e.get('kind') == 'reserved' and e.get('resources', {}).get('reboards')
                       for e in state['events'][index + 1:])):
            return False
        source_plan = json.loads(grant['plan_json'])
        source_report = json.loads(grant['failure_evidence_json'])
        if (sha(grant['failure_evidence_json']) != grant['failure_evidence_sha256']
                or not frozen_inputs_equal(plan['modern_code_evidence'], source_plan['modern_code_evidence'])
                or not modern.eligible(state, plan, source_report)
                or old.get('failure_evidence_sha256') != grant['failure_evidence_sha256']
                or plan.get('failure_family') != old.get('failure_family')
                or plan.get('director_identity') != old.get('director_identity')
                or old.get('mechanism_id') != report.get('replacement_mechanism_id')
                or not all(old.get(k) and plan.get(k) for k in
                           ('repair', 'mechanism_change', 'expected_visible_result'))
                or all(old.get(k) == plan.get(k) for k in
                       ('repair', 'mechanism_change', 'expected_visible_result'))
                or plan.get('resources') != source_plan.get('resources')
                or plan.get('changed_inputs') != source_plan.get('changed_inputs')):
            return False
        failures = [e for e in state['events'][:index] if e.get('kind') == 'repair_started'
                    and e.get('failure_family') == plan['failure_family']]
        known = {e.get('failure_sha256') for e in failures}
        return (len(failures) >= 2 and report.get('retired_mechanism_id') in
                {e.get('mechanism_id') for e in failures}
                and known <= set(report.get('reviewed_failure_sha256', []))
                and grant['failure_evidence_sha256'] in report.get('reviewed_failure_sha256', []))
    except (KeyError, TypeError, ValueError, AttributeError):
        return False


def admission_problems(state, plan):
    receipt = json.loads(plan['pivot_recovery_evidence']['receipt_json'])
    if any(e.get('kind') == 'reserved' and e.get('resources', {}).get('storyboard_critics')
           for e in state['events'][receipt['reservation_event_index'] + 1:]):
        return ['pivot recovery requires the latest actual charged independent pivot rejection']
    return []


def file_problems(plan):
    errors = modern.file_problems(plan)
    try:
        root = POLICY.parent.parent.resolve(); proof = plan['pivot_recovery_evidence']
        if modern.digest(POLICY) != POLICY_SHA256:
            errors.append('pivot recovery policy differs from its pinned bytes')
        for key in ('receipt', 'rejected_proposal'):
            path = Path(proof[key + '_path']).resolve()
            if not path.is_relative_to(root) or path.read_text() != proof[key + '_json']:
                errors.append('pivot recovery receipt or rejected proposal differs from retained bytes')
    except (OSError, ValueError, KeyError, TypeError) as exc:
        errors.append('pivot recovery evidence could not be verified: ' + str(exc))
    return errors


def prepare(state_path, receipt_path, report_path, rejected_proposal, revised_plan, output):
    from autonomous_completion import sha
    from run_controller import read_state
    state = read_state(Path(state_path)); plan = json.loads(Path(revised_plan).read_text())
    receipt_text = Path(receipt_path).read_text(); report_text = Path(report_path).read_text()
    old_text = Path(rejected_proposal).read_text()
    plan.update(completion_reason=REASON, failure_evidence=str(Path(report_path).resolve()),
                failure_evidence_sha256=sha(report_text))
    plan['pivot_recovery_evidence'] = {'schema': 'dispatch_pivot_recovery_evidence/1',
        'policy_json': POLICY.read_text(), 'policy_sha256': POLICY_SHA256,
        'receipt_json': receipt_text, 'receipt_sha256': sha(receipt_text),
        'receipt_path': str(Path(receipt_path).resolve()),
        'rejected_proposal_json': old_text, 'rejected_proposal_sha256': sha(old_text),
        'rejected_proposal_path': str(Path(rejected_proposal).resolve())}
    if not eligible(state, plan, json.loads(report_text)):
        raise ValueError('retained charged pivot rejection does not bind this unchanged mandatory code repair')
    errors = admission_problems(state, plan) + file_problems(plan)
    if errors:
        raise ValueError('; '.join(errors))
    with Path(output).open('x') as stream:
        json.dump(plan, stream, indent=2); stream.write('\n')
    return plan


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('state', 'receipt', 'report', 'rejected-proposal', 'revised-plan', 'output'):
        parser.add_argument('--' + name, type=Path, required=True)
    args = parser.parse_args()
    prepare(args.state, args.receipt, args.report, args.rejected_proposal, args.revised_plan, args.output)
    print('Bound actual recurrence pivot recovery; no capacity, reservation or approval granted.')
