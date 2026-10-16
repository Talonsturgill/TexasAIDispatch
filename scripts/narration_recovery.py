"""Fund a charged narration pivot rejection and audit an actual late review debit."""
import argparse
import hashlib
import json
from pathlib import Path
import re

REASON = 'mandatory-narration-pivot'
ADOPTION = 'autonomous_completion_narration_adopted'
VERIFIED = 'narration_recovery_review_verified'
READY = 'narration_recovery_capacity_verified'
FUNDING_KINDS = {'mandatory_completion_grant', READY}
POLICY = Path(__file__).resolve().parents[1] / 'config/autonomous_completion_narration_v1.json'
POLICY_SHA256 = '76124df1718c1d86481a48c592a4a282e2eb0fdbeb9642626135ff698eb282da'


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def frozen(path):
    from production_lifecycle import narration_inputs
    root = POLICY.parent.parent.resolve()
    data = narration_inputs(Path(path))
    return {**data, 'files': {str(Path(p).resolve().relative_to(root)): h
                             for p, h in data['files'].items()}}


def current_path(value, proof):
    root = POLICY.parent.parent.resolve()
    path = Path(value)
    if path.is_absolute():
        path = path.relative_to(Path(proof['origin_root']))
    result = (root / path).resolve()
    if not result.is_relative_to(root):
        raise ValueError('narration evidence is outside its retained checkout')
    return result


def identity(plan):
    from autonomous_completion import canonical, sha
    receipt = json.loads(plan['narration_recovery_evidence']['receipt_json'])
    return sha(canonical({'scope': REASON, 'run_id': receipt['run_id'],
                          'reservation_sha256': receipt['reservation_sha256']}))


def required(plan, counts, state=None):
    """Critics still needed from here: the reserve of four plus any unaccounted incident,
    less the properly charged review once it is verified. A settled late charge is already
    in usage, so counting it again demands capacity the grant never promised."""
    from autonomous_completion import canonical, sha
    receipt = json.loads(plan['narration_recovery_evidence']['receipt_json'])
    need = 4
    if state is None:
        need += len(receipt['unreserved_continuations'])
    else:
        notes = {e.get('note') for e in state['events'] if e.get('kind') == 'reserved'}
        need += sum('LATE CHARGE: unreserved narration content review; not a precharge or authorization; '
                    + sha(canonical(i)) not in notes for i in receipt['unreserved_continuations'])
        key = identity(plan)
        need -= any(e.get('kind') == VERIFIED and e.get('capacity_identity') == key
                    for e in state['events'])
    return {**counts, 'storyboard_critics': need, 'image_generations': 0}


def apply_budget(state, plan, budget):
    if plan.get('completion_reason') != REASON or not budget.get('resources'):
        return budget
    counts = required(plan, {k: v['required'] for k, v in budget['resources'].items()}, state)
    rows = {k: {**v, 'required': counts[k]} for k, v in budget['resources'].items()}
    deficits = {k: v['required'] - v['remaining'] for k, v in rows.items()
                if v['required'] > v['remaining']}
    return {**budget, 'resources': rows, 'deficits': deficits, 'feasible': not deficits,
            'path': REASON}


def admission_problems(state, plan):
    receipt = json.loads(plan['narration_recovery_evidence']['receipt_json'])
    if any(e.get('kind') == 'reserved' and e.get('resources', {}).get('storyboard_critics')
           for e in state['events'][receipt['reservation_event_index'] + 1:]):
        return ['narration recovery requires the latest actual charged pivot rejection']
    return []


def eligible(state, plan, report):
    from autonomous_completion import canonical, sha
    try:
        proof = plan['narration_recovery_evidence']
        receipt = json.loads(proof['receipt_json'])
        index = receipt['reservation_event_index']
        if (state.get('mode') != 'production' or state.get('terminal_state') is not None
                or str(state['run_id'])[:10] < '2026-10-15'
                or plan.get('changed_inputs') or plan.get('repair_scope') != 'capacity-only'
                or proof.get('schema') != 'dispatch_narration_recovery_evidence/1'
                or sha(proof['policy_json']) != POLICY_SHA256 or proof['policy_sha256'] != POLICY_SHA256
                or sha(proof['receipt_json']) != proof['receipt_sha256']
                or receipt.get('schema') != 'dispatch_narration_pivot_recovery/1'
                or receipt.get('run_id') != state['run_id'] or receipt.get('role') != 'recurrence-pivot'
                or receipt.get('status') != 'completed' or receipt.get('provider_unavailable') is not False
                or receipt.get('model') != 'claude-opus-5-5' or receipt.get('effort') != 'high'
                or not re.fullmatch(r'[A-Za-z0-9_-]{8,100}', receipt.get('agent_id', ''))
                or type(index) is not int or not 0 <= index < len(state['events'])
                or report.get('verdict') != 'revise' or report.get('film_sha256')
                or not report.get('reviewer_identity')
                or receipt.get('reviewer_identity') != report['reviewer_identity']
                or report['reviewer_identity'] == plan.get('director_identity')
                or receipt.get('report_sha256') != plan['failure_evidence_sha256']
                or len(report.get('visible_difference', '')) < 40
                or len(report.get('source_basis', '')) < 30
                or len(report.get('reasoning', '')) < 40):
            return False
        event = state['events'][index]
        if (event.get('kind') != 'reserved' or event.get('resources') != {'storyboard_critics': 1}
                or sha(canonical(event)) != receipt['reservation_sha256']
                or event.get('note') != receipt['reservation_note']
                or not re.search(r'pivot.*narration|narration.*pivot', event.get('note', ''), re.I)
                or 'LATE CHARGE' in event.get('note', '').upper()):
            return False
        prior = [e for e in state['events'][:index] if e.get('kind') == 'repair_started'
                 and e.get('repair_scope') == 'narration-performance']
        reviewed = report['reviewed_failure_sha256']
        inputs = receipt['retained_inputs']
        if (len(prior) < 2 or not isinstance(reviewed, list)
                or not {e['failure_sha256'] for e in prior} <= set(reviewed)
                or report.get('retired_mechanism_id') not in {e['mechanism_id'] for e in prior}
                or not report.get('replacement_mechanism_id')
                or report['replacement_mechanism_id'] == report['retired_mechanism_id']
                or not set(reviewed) <= {r['sha256'] for r in inputs if r['kind'] == 'failure'}
                or not {'audio', 'asr', 'baseline', 'packet'} <= {r['kind'] for r in inputs}):
            return False
        incidents = receipt['unreserved_continuations']
        if not isinstance(incidents, list) or len(incidents) > 1:
            return False
        for row in incidents:
            if (row.get('agent_id') != receipt['agent_id']
                    or row.get('precharged') is not False or row.get('invalid_for_authorization') is not True
                    or not row.get('observed_at') or not row.get('disclosure')
                    or not {'handback', 'proposal', 'disclosure'} <= set(row)):
                return False
        frozen = proof['frozen_inputs']
        return (bool(frozen['files']) and re.fullmatch(r'[a-f0-9]{64}', frozen['renderer_sha256'])
                and plan.get('resources') == {'storyboard_critics': 4 + len(incidents)}
                and all(re.fullmatch(r'[a-f0-9]{64}', r['sha256']) for r in inputs))
    except (KeyError, TypeError, ValueError, AttributeError):
        return False


def file_problems(state_path, plan):
    proof = plan['narration_recovery_evidence']
    receipt = json.loads(proof['receipt_json'])
    root = POLICY.parent.parent.resolve()
    try:
        if digest(POLICY) != POLICY_SHA256 or frozen(state_path) != proof['frozen_inputs']:
            return ['narration recovery policy, source, script, board or renderer changed']
        refs = [proof['direction'], {'path': proof['receipt_file'], 'sha256': proof['receipt_sha256']},
                {'path': plan['failure_evidence'], 'sha256': plan['failure_evidence_sha256']},
                *receipt['retained_inputs']]
        for incident in receipt['unreserved_continuations']:
            refs += [incident[k] for k in ('handback', 'proposal', 'disclosure')]
        paths = set()
        for ref in refs:
            path = current_path(ref['path'], proof)
            if not path.is_relative_to(root) or digest(path) != ref['sha256']:
                return ['narration recovery retained input is changed or outside this checkout']
            paths.add(path)
        packets = [current_path(r['path'], proof).read_text()
                   for r in receipt['retained_inputs'] if r['kind'] == 'packet']
        report = json.loads(current_path(plan['failure_evidence'], proof).read_text())
        script = proof['frozen_inputs']['files']['out/dispatch/vo_script.txt']
        baselines = [r['sha256'] for r in receipt['retained_inputs'] if r['kind'] == 'baseline']
        if not any(all(h in p for h in report['reviewed_failure_sha256'])
                   and script in p and any(h in p for h in baselines) for p in packets):
            return ['original narration packet does not bind all failed findings, locked script and direction baseline']
        if len(paths) < 7:
            return ['narration recovery needs separate original evidence files']
    except (OSError, KeyError, ValueError, TypeError) as exc:
        return ['narration recovery could not verify retained inputs: ' + str(exc)]
    return []


def prepare(state_path, receipt_path, report_path, output):
    from autonomous_completion import sha
    from run_controller import read_state
    state = read_state(Path(state_path)); text = Path(receipt_path).read_text()
    receipt = json.loads(text); report_text = Path(report_path).read_text()
    direction = Path(state_path).parent / 'vo_direction.json'
    plan = {'completion_reason': REASON, 'repair_scope': 'capacity-only',
            'director_identity': receipt['director_identity'], 'changed_inputs': [],
            'resources': {'storyboard_critics': 4 + len(receipt['unreserved_continuations'])},
            'failure_evidence': str(Path(report_path).resolve()), 'failure_evidence_sha256': sha(report_text),
            'narration_recovery_evidence': {'schema': 'dispatch_narration_recovery_evidence/1',
                'policy_json': POLICY.read_text(), 'policy_sha256': POLICY_SHA256,
                'receipt_json': text, 'receipt_sha256': sha(text), 'receipt_file': str(Path(receipt_path).resolve()),
                'origin_root': str(POLICY.parent.parent.resolve()), 'frozen_inputs': frozen(state_path),
                'direction': {'path': str(direction.resolve()), 'sha256': digest(direction)}}}
    if not eligible(state, plan, json.loads(report_text)):
        raise ValueError('actual charged complete narration pivot rejection is not bound')
    errors = file_problems(state_path, plan)
    if errors:
        raise ValueError('; '.join(errors))
    with Path(output).open('x') as stream:
        json.dump(plan, stream, indent=2); stream.write('\n')
    return plan


def settle(state_path, plan_path):
    """Debit observed past work once, visibly late; it can authorize no review."""
    from autonomous_completion import EVENT, canonical, sha
    from run_controller import read_state, reserve
    state = read_state(Path(state_path)); plan = json.loads(Path(plan_path).read_text())
    if not any(e.get('kind') in FUNDING_KINDS and e.get('reason') == REASON
               and json.loads(e['plan_json']) == plan for e in state['events']):
        raise ValueError('late accounting requires its admitted capacity grant first')
    receipt = json.loads(plan['narration_recovery_evidence']['receipt_json'])
    proof = plan['narration_recovery_evidence']
    for incident in receipt['unreserved_continuations']:
        for key in ('handback', 'proposal', 'disclosure'):
            ref = incident[key]
            if digest(current_path(ref['path'], proof)) != ref['sha256']:
                raise ValueError('actual unreserved review evidence changed')
        note = 'LATE CHARGE: unreserved narration content review; not a precharge or authorization; ' + sha(canonical(incident))
        state = read_state(Path(state_path))
        if any(e.get('kind') == 'reserved' and e.get('note') == note for e in state['events']):
            continue
        ok, message = reserve(Path(state_path), {'storyboard_critics': 1}, note)
        if not ok:
            raise ValueError(message)


def verification_problems(state, row, index):
    """Replay a real post-grant reservation and exact independent handback."""
    from autonomous_completion import EVENT, canonical, sha
    from datetime import datetime
    try:
        receipt = json.loads(row['receipt_json']); report = json.loads(row['report_json'])
        gi, ri = receipt['grant_event_index'], receipt['reservation_event_index']
        if (sha(row['receipt_json']) != row['receipt_sha256']
                or sha(row['report_json']) != row['report_sha256']
                or type(gi) is not int or type(ri) is not int or not 0 <= gi < ri < index
                or receipt.get('schema') != 'dispatch_precharged_narration_review/1'
                or receipt.get('run_id') != state['run_id']
                or receipt.get('model') != 'claude-opus-5-5' or receipt.get('effort') != 'high'
                or receipt.get('provider_unavailable') is not False
                or not re.fullmatch(r'[A-Za-z0-9_-]{8,100}', receipt.get('agent_id', ''))):
            return ['narration review lacks exact post-grant independent provenance']
        grant, reservation = state['events'][gi], state['events'][ri]
        plan = json.loads(grant['plan_json']); proof = plan['narration_recovery_evidence']
        original = json.loads(grant['failure_evidence_json'])
        if (grant.get('kind') not in FUNDING_KINDS or grant.get('reason') != REASON
                or row.get('capacity_identity') != identity(plan)
                or sha(canonical(grant)) != receipt['grant_sha256']
                or reservation.get('kind') != 'reserved'
                or reservation.get('resources') != {'storyboard_critics': 1}
                or 'LATE CHARGE' in reservation.get('note', '').upper()
                or sha(canonical(reservation)) != receipt['reservation_sha256']
                or not datetime.fromisoformat(reservation['at']) <= datetime.fromisoformat(receipt['started_at'])
                    <= datetime.fromisoformat(receipt['completed_at']) <= datetime.fromisoformat(row['at'])
                or report.get('verdict') != 'pass' or not report.get('reviewer_identity')
                or report['reviewer_identity'] == plan['director_identity']
                or receipt.get('reviewer_identity') != report['reviewer_identity']
                or receipt.get('direction_sha256') != proof['direction']['sha256']
                or receipt.get('report_sha256') != row['report_sha256']
                or not receipt.get('mechanism_id')
                or report.get('replacement_mechanism_id') != receipt['mechanism_id']
                or not set(original['reviewed_failure_sha256']) <= set(report.get('reviewed_failure_sha256', []))
                or len(report.get('visible_difference', '')) < 40 or len(report.get('source_basis', '')) < 30):
            return ['narration review is stale, uncharged, late-accounted or not an independent pass']
        incidents = json.loads(proof['receipt_json'])['unreserved_continuations']
        for incident in incidents:
            note = 'LATE CHARGE: unreserved narration content review; not a precharge or authorization; ' + sha(canonical(incident))
            if not any(e.get('kind') == 'reserved' and e.get('note') == note
                       for e in state['events'][gi + 1:ri]):
                return ['actual unreserved review must be accounted before the fresh reservation']
    except (KeyError, TypeError, ValueError, AttributeError) as exc:
        return ['narration review verification is incomplete: ' + str(exc)]
    return []


def paid_work_problems(state, amounts):
    if not set(amounts) - {'storyboard_critics', 'reported_tokens'}:
        return []
    funding = [(i, e) for i,e in enumerate(state['events'])
               if e.get('kind') in FUNDING_KINDS and e.get('reason') == REASON]
    if not funding:
        return []
    from autonomous_completion import canonical, sha
    for _, grant in funding:
        plan = json.loads(grant['plan_json'])
        receipt = json.loads(plan['narration_recovery_evidence']['receipt_json'])
        for incident in receipt['unreserved_continuations']:
            note = 'LATE CHARGE: unreserved narration content review; not a precharge or authorization; ' + sha(canonical(incident))
            if not any(e.get('kind') == 'reserved' and e.get('note') == note for e in state['events']):
                return ['actual unreserved narration review remains unaccounted']
    # A later actual charged REVISE admits a new scope. It retains the earlier
    # rejection rather than requiring a pass on an abandoned proposal forever.
    index, grant = funding[-1]; key = identity(json.loads(grant['plan_json']))
    if not any(e.get('kind') == VERIFIED and e.get('capacity_identity') == key
               and not verification_problems(state, e, i)
               for i, e in enumerate(state['events']) if i > index):
        return ['funded narration recovery still needs its properly precharged independent review; no dependent paid work']
    return []


def verify_review(state_path, plan_path, receipt_path, report_path):
    from autonomous_completion import sha
    from run_controller import event, read_state, save
    state = read_state(Path(state_path)); plan = json.loads(Path(plan_path).read_text())
    errors = file_problems(state_path, plan)
    if errors:
        raise ValueError('; '.join(errors))
    text = Path(receipt_path).read_text(); report = Path(report_path).read_text()
    row = event(state, VERIFIED, capacity_identity=identity(plan), receipt_json=text,
                receipt_sha256=sha(text), report_json=report, report_sha256=sha(report),
                approves_no_audio_or_film=True)
    row = state['events'][-1]
    errors = verification_problems(state, row, len(state['events']) - 1)
    if errors:
        raise ValueError('; '.join(errors))
    save(Path(state_path), state)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state', type=Path, required=True)
    parser.add_argument('--settle-unreserved', type=Path)
    parser.add_argument('--verify-review', type=Path)
    for name in ('receipt', 'report', 'output'):
        parser.add_argument('--' + name, type=Path)
    args = parser.parse_args()
    if args.verify_review:
        if not all((args.receipt, args.report)):
            parser.error('verify requires --receipt and --report')
        verify_review(args.state, args.verify_review, args.receipt, args.report)
        print('Properly precharged independent narration review verified; audio and film gates remain.')
    elif args.settle_unreserved:
        settle(args.state, args.settle_unreserved)
        print('Actual unreserved work accounted once as late, without approval or fresh execution.')
    else:
        if not all((args.receipt, args.report, args.output)):
            parser.error('prepare requires --receipt, --report and --output')
        prepare(args.state, args.receipt, args.report, args.output)
        print('Bound actual narration pivot rejection. No capacity, review or film approval granted.')
