"""Fund one required source validation after an independently diagnosed script pivot."""
import argparse
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
POLICY = REPO / 'config/source_validation_completion_v1.json'
POLICY_SHA256 = 'd08bc6044dd1adba91b1b27880921b2e574860b4a7981404a3a7a69184d2b82d'
FIELD = 'source_validation_completion'
ADOPTION = 'autonomous_completion_validation_adopted'
READY = 'source_validation_capacity_verified'
REASON = 'mandatory-source-pivot'
CALL_KEYS = ('schema', 'run_id', 'role', 'status', 'provider_unavailable', 'model', 'effort',
             'agent_id', 'reviewer_identity', 'reservation_event_index', 'reservation_sha256',
             'started_at', 'completed_at', 'report_sha256', 'script_sha256', 'claims_sha256')


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True)


def at(value):
    stamp = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if not stamp.tzinfo:
        raise ValueError('review timestamps require a timezone')
    return stamp


def identity(plan):
    receipt = json.loads(plan[FIELD]['receipt_json'])
    return hashlib.sha256(canonical({'scope': FIELD, 'run_id': receipt['run_id'],
                                    'reservation_sha256': receipt['reservation_sha256']}).encode()).hexdigest()


def located(value, proof):
    path = Path(value)
    if path.is_absolute():
        path = path.resolve().relative_to(Path(proof['repo_root']).resolve())
    result = (REPO / path).resolve()
    if not result.is_relative_to(REPO.resolve()):
        raise ValueError('source validation evidence is outside this checkout')
    return result


def eligible(state, plan, report):
    """Portable admission only; actual file checks run before the grant."""
    from autonomous_completion import resource_requirements
    try:
        proof = plan[FIELD]
        receipt = json.loads(proof['receipt_json'])
        index = receipt['reservation_event_index']
        event = state['events'][index]
        pivot = report['source_pivot']
        changed = {str(Path(row['path']).name): row for row in plan['changed_inputs']}
        if (state.get('mode') != 'production' or state.get('terminal_state') is not None
                or str(state['run_id'])[:10] < '2026-10-15'
                or plan.get('repair_scope') not in ('standard', 'technical-integrity')
                or report.get('verdict') != 'revise' or not report.get('blocking_defects')
                or type(plan.get('resources', {}).get('validator_agents')) is not int
                or plan['resources']['validator_agents'] != 1
                or set(plan['resources']) - set(resource_requirements(state, plan))
                or any(type(value) is not int or value < 1 for value in plan['resources'].values())
                or proof['schema'] != 'dispatch_source_validation_completion/1'
                or proof['policy_sha256'] != POLICY_SHA256
                or hashlib.sha256(proof['policy_json'].encode()).hexdigest() != POLICY_SHA256
                or hashlib.sha256(proof['receipt_json'].encode()).hexdigest() != proof['receipt_sha256']
                or receipt['schema'] != 'dispatch_source_pivot_review/1'
                or receipt.get('role') != 'source-pivot' or receipt.get('status') != 'completed'
                or receipt.get('provider_unavailable') is not False
                or receipt['model'] != 'claude-opus-5-5' or receipt['effort'] != 'high'
                or receipt['reviewer_identity'] != report['reviewer_identity']
                or receipt['reviewer_identity'] == plan['director_identity']
                or not receipt['agent_id'] or type(index) is not int or index < 0
                or receipt['run_id'] != state['run_id']
                or event.get('kind') != 'reserved' or event.get('resources') != {'storyboard_critics': 1}
                or hashlib.sha256(canonical(event).encode()).hexdigest() != receipt['reservation_sha256']
                or receipt['report_sha256'] != plan['failure_evidence_sha256']
                or any(row.get('kind') == 'reserved' and row.get('resources', {}).get('storyboard_critics')
                       for row in state['events'][index + 1:])
                or not at(event['at']) <= at(receipt['started_at']) <= at(receipt['completed_at']) <= datetime.now(timezone.utc)
                or pivot.get('requires_validation') is not True
                or pivot['script_before_sha256'] != changed['vo_script.txt']['before_sha256']
                or proof['frozen_inputs']['files']['out/dispatch/vo_script.txt'] != pivot['script_before_sha256']
                or pivot['proposed_script_sha256'] != proof['proposed_script']['sha256']
                or pivot['script_before_sha256'] == pivot['proposed_script_sha256']
                or len(str(pivot.get('source_basis', '')).strip()) < 30
                or not isinstance(pivot.get('claim_ids'), list) or not pivot['claim_ids']):
            return False
        return True
    except (KeyError, ValueError, TypeError, IndexError, AttributeError):
        return False


def file_problems(state_path, plan):
    try:
        from narration_recovery import frozen
        proof = plan[FIELD]
        report = json.loads(Path(plan['failure_evidence']).read_text())
        if (POLICY.read_text() != proof['policy_json'] or frozen(state_path) != proof['frozen_inputs']
                or digest(located(proof['proposed_script']['path'], proof)) != proof['proposed_script']['sha256']
                or digest(located(proof['receipt_file'], proof)) != proof['receipt_sha256']):
            return ['source pivot policy, proposed script, receipt or original inputs changed']
        claims = json.loads((Path(state_path).parent / 'claims.json').read_text())
        verified = {row['id'] for row in claims['claims'] if row.get('verdict') == 'VERIFIED'}
        if not set(report['source_pivot']['claim_ids']) <= verified:
            return ['source pivot cites unverified claim ids']
        for row in plan['changed_inputs']:
            path = located(row['path'], proof)
            if (not path.is_relative_to((REPO / 'out/dispatch').resolve())
                    or digest(path) != row['before_sha256']
                    or digest(located(row['before_path'], proof)) != row['before_sha256']):
                return ['source pivot needs current unchanged inputs and retained baselines']
    except (OSError, ValueError, KeyError, TypeError):
        return ['source pivot evidence is unavailable or unreadable']
    return []


def apply_budget(state, plan, budget):
    if FIELD not in plan:
        return budget
    from autonomous_completion import effective_envelope
    rows = {name: dict(row) for name, row in budget['resources'].items()}
    effective = effective_envelope(state)
    for name, count in json.loads(plan[FIELD]['policy_json'])['minimum_remaining'].items():
        rows[name] = {'required': max(rows.get(name, {}).get('required', 0), count),
                      'used': state['usage'][name], 'ceiling': effective[name],
                      'remaining': effective[name] - state['usage'][name]}
    deficits = {name: row['required'] - row['remaining'] for name, row in rows.items()
                if row['required'] > row['remaining']}
    return {**budget, 'resources': rows, 'deficits': deficits, 'feasible': not deficits}


def prepare(state_path, plan_path, receipt_file, proposed_script, output):
    from autonomous_completion import mandatory_reason
    from narration_recovery import frozen
    from run_controller import read_state
    state_path = Path(state_path)
    plan = json.loads(Path(plan_path).read_text())
    report = json.loads(Path(plan['failure_evidence']).read_text())
    receipt_text = Path(receipt_file).read_text()
    plan[FIELD] = {'schema': 'dispatch_source_validation_completion/1', 'repo_root': str(REPO.resolve()),
                   'policy_json': POLICY.read_text(), 'policy_sha256': POLICY_SHA256,
                   'receipt_json': receipt_text, 'receipt_sha256': hashlib.sha256(receipt_text.encode()).hexdigest(),
                   'receipt_file': str(Path(receipt_file).resolve()),
                   'proposed_script': {'path': str(Path(proposed_script).resolve()), 'sha256': digest(proposed_script)},
                   'frozen_inputs': frozen(state_path)}
    state = read_state(state_path)
    errors = file_problems(state_path, plan)
    if not eligible(state, plan, report) or mandatory_reason(state, plan, Path(plan['failure_evidence']).read_text()) not in ('retained-integrity', REASON) or errors:
        raise ValueError('; '.join(errors) or 'source pivot needs its actual charged independent source rejection')
    with Path(output).open('x') as stream:
        json.dump(plan, stream, indent=2); stream.write('\n')
    return plan


def source_validation_problems(state, root):
    """Fresh script validation is required before dependent paid production."""
    grants = [(i, row) for i, row in enumerate(state.get('events', []))
              if row.get('kind') in ('mandatory_completion_grant', READY)
              and FIELD in json.loads(row.get('plan_json', '{}'))]
    if not grants:
        return []
    try:
        grant_index, grant = grants[-1]
        call = Path(root) / 'source-validation-call.json'
        public_certificate = not call.is_file()
        if not call.is_file():
            call = Path(root) / 'source-validation-certificate.json'
        receipt = json.loads(call.read_text())
        if public_certificate and (receipt.get('certificate_schema') != 'dispatch_source_validation_certificate/1'
                                   or not re.fullmatch(r'[0-9a-f]{64}', receipt.get('original_receipt_sha256', ''))):
            return ['source validation archive certificate is missing its original provenance']
        report_file = Path(root) / 'validation.json'
        report = json.loads(report_file.read_text())
        index = receipt['reservation_event_index']; event = state['events'][index]
        script_hash, claims_hash = (digest(Path(root) / name) for name in ('vo_script.txt', 'claims.json'))
        authorized = any(row.get('kind') == 'repair_authorized'
                         and any(Path(item['path']).name == 'vo_script.txt' and item.get('after_sha256') == script_hash
                                 for item in row.get('repair_plan', {}).get('changed_inputs', []))
                         for row in state['events'][grant_index + 1:])
        if (type(index) is not int or not grant_index < index < len(state['events'])
                or receipt.get('schema') != 'dispatch_precharged_source_validation/1'
                or receipt.get('role') != 'validator' or receipt.get('status') != 'completed'
                or receipt.get('provider_unavailable') is not False
                or event.get('kind') != 'reserved' or event.get('resources') != {'validator_agents': 1}
                or hashlib.sha256(canonical(event).encode()).hexdigest() != receipt['reservation_sha256']
                or receipt.get('model') != 'claude-opus-5-5' or receipt.get('effort') != 'high'
                or not receipt.get('agent_id') or receipt['run_id'] != state['run_id']
                or receipt['report_sha256'] != digest(report_file)
                or receipt['script_sha256'] != script_hash or not authorized
                or receipt['claims_sha256'] != claims_hash
                or report.get('script_sha256') != script_hash or report.get('claims_sha256') != claims_hash
                or report.get('result') not in ('PASS', 'PASS_WITH_DROPS')
                or not report.get('source')
                or any(not isinstance(report.get(key), list) or not report[key]
                       or any(not isinstance(value, str) or not value.strip() for value in report[key])
                       for key in ('rejected', 'required_edits_applied'))
                or report.get('date') != str(state['run_id'])[:10]
                or set(report.get('verified_claim_ids', [])) != {row['id'] for row in json.loads((Path(root) / 'claims.json').read_text())['claims'] if row.get('verdict') == 'VERIFIED'}
                or receipt.get('reviewer_identity') != report.get('reviewer_identity')
                or not receipt.get('reviewer_identity')
                or receipt['reviewer_identity'] == json.loads(grant['plan_json'])['director_identity']
                or not at(event['at']) <= at(receipt['started_at']) <= at(receipt['completed_at']) <= datetime.now(timezone.utc)):
            return ['mandatory source pivot still requires its actual precharged current Opus High validation PASS']
    except (OSError, ValueError, KeyError, TypeError, IndexError):
        return ['mandatory source pivot still requires its actual precharged current Opus High validation PASS']
    return []


def certificate(root):
    call = Path(root) / 'source-validation-call.json'
    receipt = json.loads(call.read_text())
    result = {key: receipt[key] for key in CALL_KEYS}
    result.update(certificate_schema='dispatch_source_validation_certificate/1', original_receipt_sha256=digest(call))
    text = json.dumps(result, indent=2) + '\n'
    if re.search(r'/Users/|/home/|/private/|/tmp/|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}', text):
        raise ValueError('source validation certificate needs a compact public reviewer identity; retain local paths in the private handoff')
    (Path(root) / 'source-validation-certificate.json').write_text(text)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--state', type=Path, required=True)
    p.add_argument('--plan', type=Path)
    p.add_argument('--receipt', type=Path)
    p.add_argument('--proposed-script', type=Path)
    p.add_argument('--output', type=Path)
    p.add_argument('--verify-validation', action='store_true')
    a = p.parse_args()
    from run_controller import read_state
    if a.verify_validation:
        state = read_state(a.state)
        errors = source_validation_problems(state, a.state.parent)
        if errors:
            raise ValueError('; '.join(errors))
        if any(row.get('kind') in ('mandatory_completion_grant', READY)
               and FIELD in json.loads(row.get('plan_json', '{}')) for row in state['events']):
            certificate(a.state.parent)
        print('Current precharged source validation verified; all film and shipment gates remain.')
    else:
        if not all((a.plan, a.receipt, a.proposed_script, a.output)):
            p.error('prepare requires --plan, --receipt, --proposed-script and --output')
        prepare(a.state, a.plan, a.receipt, a.proposed_script, a.output)
        print('Bound mandatory script pivot. No capacity or production approval granted.')


if __name__ == '__main__':
    main()
