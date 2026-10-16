"""Prepare one linked read-timeout recovery; never replace a returned verdict."""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import re

from production_quality import digest, policy as av_policy
from run_controller import read_state, now

SCHEMA = 'dispatch-provider-read-timeout-recovery/1'
POLICY = Path(__file__).resolve().parents[1] / 'config/provider_read_timeout_retry.json'
POLICY_SHA256 = 'e3f3a695f6cf50d9999e4dfbe2896a9a3862ee468af1ec54f0a915df32e710bd'


def sha(text):
    return hashlib.sha256(text.encode()).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'))


def owned(path, root):
    path = Path(path).resolve()
    if not path.is_relative_to(root) or not path.is_file():
        raise ValueError('timeout evidence must exist in the owned production package')
    return path


def proof_problems(proof, attempt_sha=None):
    """Verify portable original evidence without inventing a service or film pass."""
    try:
        receipt = json.loads(proof['receipt'])
        policy = json.loads(receipt['policy_json'])
        parent = json.loads(proof['failed_attempt'])
        context = json.loads(receipt['parent_context_json'])
        transport = json.loads(receipt['transport_event_json'])
        reservation = json.loads(receipt['reservation_event_json'])
        telemetry = json.loads(receipt['telemetry_event_json'])
        failure = json.loads(receipt['failure_json'])
        if (receipt.get('schema') != SCHEMA
                or sha(proof['receipt']) != proof['receipt_sha256']
                or sha(receipt['policy_json']) != POLICY_SHA256
                or receipt['policy_sha256'] != POLICY_SHA256
                or policy.get('schema') != 'dispatch-provider-read-timeout-policy/1'
                or policy.get('max_recoveries') != 1
                or policy.get('original_read_timeout_s') != 180
                or policy.get('recovery_read_timeout_s') != 540
                or receipt.get('read_timeout_s') != 540
                or receipt['after_attempt']['sha256'] != sha(proof['failed_attempt'])
                or (attempt_sha is not None and attempt_sha != receipt['after_attempt']['sha256'])):
            raise ValueError('timeout recovery policy or original attempt changed')
        rid, role = parent['request_id'], parent['role']
        if (context['request_id'] != rid or context['role'] != role
                or context['model'] != av_policy()['av_model']
                or context['bindings'] != parent['bindings']
                or context['host_failure'] != parent['host_failure']
                or sha(canonical(context)) != parent['review_context_sha256']
                or transport.get('kind') != 'independent_review_transport'
                or any(transport.get(k) != v for k, v in parent.items())
                or reservation.get('kind') != 'reserved'
                or reservation.get('resources') != {'audiovisual_reviews': 1}
                or reservation.get('note') != 'independent transport ' + role
                or telemetry.get('kind') != 'telemetry'
                or telemetry.get('resource') != 'audiovisual_reviews'
                or telemetry.get('note') != rid + ' independent ' + role
                or telemetry.get('reported_tokens') != 0
                or not (receipt['reservation_event_index'] < receipt['transport_event_index']
                        < receipt['telemetry_event_index'])):
            raise ValueError('timeout recovery lacks the exact charged original request and telemetry')
        if (failure.get('request_id') != rid or failure.get('exception_type') != 'ReadTimeout'
                or failure.get('response_complete') is not False
                or failure.get('read_timeout_s') != 180 or 'http_status' in failure):
            raise ValueError('timeout recovery admits only an actual read timeout without a response')
        if receipt.get('legacy'):
            if (receipt['after_attempt']['sha256'] not in policy['legacy_attempt_sha256']
                    or telemetry.get('elapsed_ms', 0) < 180000
                    or not re.search(r'^independent_review: independent provider ReadTimeout; no approval recorded\s*$',
                                     receipt['failure_evidence'], re.M)):
                raise ValueError('legacy timeout recovery lacks its pinned actual failure')
        else:
            if (json.loads(receipt['failure_evidence']) != failure
                    or parent.get('provider_reservation_event_index') != receipt['reservation_event_index']
                    or parent.get('provider_reservation_sha256') != sha(canonical(reservation))):
                raise ValueError('structured timeout failure or original reservation changed')
        if sha(receipt['failure_evidence']) != receipt['failure_evidence_sha256']:
            raise ValueError('timeout failure evidence changed')
    except (KeyError, ValueError, TypeError, AttributeError):
        return ['timeout recovery proof is incomplete, changed or not an actual charged read timeout']
    return []


def target(attempt_path, state, evidence=None):
    state = Path(state).resolve(); root = state.parent
    attempt_path = owned(attempt_path, root)
    parts = attempt_path.relative_to(root).parts
    if (len(parts) != 3 or parts[0] != 'independent-review-cache'
            or not re.fullmatch('[0-9a-f]{64}', parts[1]) or parts[2] != 'attempt.json'
            or any((attempt_path.parent/name).exists() for name in ('response.json', 'report.json'))):
        raise ValueError('timeout recovery needs the original cache without a response or verdict; no retry chains')
    ledger = read_state(state)
    if ledger.get('terminal_state'):
        raise ValueError('timeout recovery requires active production')
    raw = attempt_path.read_text(); parent = json.loads(raw)
    request_path = owned(attempt_path.with_name('request.json'), root)
    request = json.loads(request_path.read_text()); context = request['context']
    if (sha(request['prompt']) != context['prompt_sha256']
            or sha(canonical(request['input'])) != context['input_sha256']):
        raise ValueError('original timeout request bytes changed')
    events = ledger['events']
    matches = [i for i, e in enumerate(events) if e.get('kind') == 'independent_review_transport'
               and all(e.get(k) == v for k, v in parent.items())]
    if not matches:
        raise ValueError('timeout original request is absent from the actual ledger')
    transport = matches[-1]
    reservations = [i for i in range(transport) if events[i].get('kind') == 'reserved'
                    and events[i].get('resources') == {'audiovisual_reviews': 1}
                    and events[i].get('note') == 'independent transport ' + parent['role']]
    if 'provider_reservation_event_index' in parent:
        selected = parent['provider_reservation_event_index']
        if (type(selected) is not int or selected not in reservations
                or sha(canonical(events[selected])) != parent.get('provider_reservation_sha256')):
            raise ValueError('original timeout provider precharge changed')
        reservations = [selected]
    telemetry = [i for i in range(transport+1, len(events)) if events[i].get('kind') == 'telemetry'
                 and events[i].get('note') == parent['request_id'] + ' independent ' + parent['role']]
    if (not reservations or not telemetry or any(e.get('kind') == 'independent_review_response'
            and e.get('request_id') == parent['request_id'] for e in events)):
        raise ValueError('timeout request lacks its precharge and failed telemetry or already returned a response')
    failure_path = attempt_path.with_name('failure.json')
    legacy = not failure_path.is_file()
    if legacy:
        evidence = owned(evidence, root) if evidence is not None else None
        if evidence is None:
            raise ValueError('pinned legacy timeout needs the exact retained producer log')
        failure_text = evidence.read_text()
        failure = {'request_id': parent['request_id'], 'exception_type': 'ReadTimeout',
                   'response_complete': False, 'read_timeout_s': 180}
    else:
        evidence = failure_path
        failure_text = failure_path.read_text(); failure = json.loads(failure_text)
    receipt = {'schema': SCHEMA, 'prepared_at': now(), 'read_timeout_s': 540,
        'policy_json': POLICY.read_text(), 'policy_sha256': POLICY_SHA256,
        'after_attempt': {'path': str(attempt_path), 'sha256': sha(raw)},
        'parent_request_sha256': digest(request_path), 'parent_context_json': canonical(context),
        'failure_evidence_path': str(evidence), 'failure_evidence': failure_text,
        'failure_evidence_sha256': sha(failure_text), 'failure_json': canonical(failure), 'legacy': legacy,
        'transport_event_index': transport, 'transport_event_json': canonical(events[transport]),
        'reservation_event_index': reservations[-1], 'reservation_event_json': canonical(events[reservations[-1]]),
        'telemetry_event_index': telemetry[-1], 'telemetry_event_json': canonical(events[telemetry[-1]])}
    return receipt, raw


def prepare(state, after_attempt, failure_evidence=None):
    from independent_review import claim
    root = Path(state).resolve().parent
    after_attempt = owned(after_attempt, root)
    parts = after_attempt.relative_to(root).parts
    if len(parts) != 3 or parts[0] != 'independent-review-cache' or parts[2] != 'attempt.json':
        raise ValueError('timeout recovery needs its original owned cache')
    with claim(after_attempt.with_name('transport.lock')):
        receipt, parent = target(after_attempt, state, failure_evidence)
        text = json.dumps(receipt, indent=2)+'\n'
        proof = {'receipt': text, 'receipt_sha256': sha(text), 'failed_attempt': parent}
        errors = proof_problems(proof)
        if errors:
            raise ValueError('; '.join(errors))
        path = after_attempt.with_name('read-timeout-recovery.json')
        with path.open('x') as stream:
            stream.write(text)
        return path


def recovery_proof(receipt_path, attempt_path, state):
    receipt_path = owned(receipt_path, Path(state).resolve().parent)
    if receipt_path != Path(attempt_path).resolve().with_name('read-timeout-recovery.json'):
        raise ValueError('timeout recovery receipt must be beside its original attempt')
    text = receipt_path.read_text(); saved = json.loads(text)
    actual, parent = target(attempt_path, state, saved['failure_evidence_path'])
    actual['prepared_at'] = saved['prepared_at']
    if actual != saved:
        raise ValueError('timeout recovery original evidence changed')
    proof = {'receipt': text, 'receipt_sha256': sha(text), 'failed_attempt': parent}
    errors = proof_problems(proof, digest(attempt_path))
    if errors:
        raise ValueError('; '.join(errors))
    return proof


def check_inputs(proof, text, bindings, prompt):
    receipt = json.loads(proof['receipt'])
    if receipt.get('schema') != SCHEMA:
        return 180
    context = json.loads(receipt['parent_context_json'])
    current = {k: v for k, v in bindings.items() if k != 'provider_availability_sha256'}
    if (context['bindings'] != current or context['input_sha256'] != sha(canonical(text))
            or context['prompt_sha256'] != sha(prompt)):
        raise ValueError('timeout recovery requires the exact same provider, model, scope and input context')
    return receipt['read_timeout_s']


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state', type=Path, required=True)
    parser.add_argument('--after-attempt', type=Path, required=True)
    parser.add_argument('--failure-evidence', type=Path)
    args = parser.parse_args()
    try:
        print(prepare(args.state, args.after_attempt, args.failure_evidence))
    except (OSError, ValueError, KeyError, TypeError) as exc:
        parser.exit(1, 'provider_timeout_retry: '+str(exc)+'\n')


if __name__ == '__main__':
    main()
