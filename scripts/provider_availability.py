"""Charge one tiny generation probe before production or a restored-service recovery.

A successful model metadata GET proves authentication, not generation availability.
This probe supplies no film observations, scores or approval. It never buys credits.
"""
from __future__ import annotations
import argparse
import copy
import hashlib
import json
import os
from pathlib import Path
import re
import time
import uuid
import requests
from production_quality import policy, digest
from run_controller import read_state, reserve, record_telemetry, event, save, now

SCHEMA = 'dispatch_provider_availability/1'
EFFECTIVE_DATE = '2026-10-16'
GENERATION_PROTOCOL = 'bounded-json-generation-v2'


def encoded(value):
    return json.dumps(value, sort_keys=True, indent=2)+'\n'


def http_failure(response, key):
    body = response.text
    safe = body.replace(key, '[redacted]')
    safe = re.sub(r'AIza[0-9A-Za-z_\-]{30,}', '[redacted]', safe)
    return {'http_status': response.status_code, 'body_sha256': hashlib.sha256(body.encode()).hexdigest(),
            'sanitized_body': safe[:65536]}


def owned(path, root):
    path = Path(path).resolve()
    if not path.is_relative_to(Path(root).resolve()) or not path.is_file():
        raise ValueError('provider recovery evidence must exist in this current package')
    return path


def failed_attempt(path, state, evidence=None):
    """Admit a retained HTTP402 with no returned provider response, never a verdict."""
    path = owned(path, state.parent)
    if path.name != 'attempt.json' or any((path.parent/name).exists() for name in ('report.json', 'response.json')):
        raise ValueError('provider recovery requires a failed attempt without a completed response or verdict')
    value = json.loads(path.read_text()); ledger = read_state(state)
    relative = path.relative_to(state.parent.resolve()).parts
    startup = relative == ('provider-availability', 'startup', 'attempt.json')
    matches = [i for i, row in enumerate(ledger['events'])
               if row.get('kind') == ('provider_availability_probe' if startup else 'independent_review_transport')
               and all(row.get(key) == item for key, item in value.items() if key != 'schema')]
    if not matches or not (startup or relative[0] == 'independent-review-cache'):
        raise ValueError('failed provider attempt does not match its retained charged ledger event')
    failure = path.parent/('receipt.json' if startup else 'failure.json')
    if failure.is_file():
        diagnostic = json.loads(failure.read_text())
        if diagnostic.get('request_id') != value.get('request_id') or diagnostic.get('http_status') != 402:
            raise ValueError('restored-service recovery admits only the actual retained HTTP402')
        evidence = failure
    else:
        evidence = owned(evidence, state.parent) if evidence is not None else None
        if evidence is None or path.parent.name not in evidence.read_text() or not re.search(r'HTTP\s*402\b', evidence.read_text()):
            raise ValueError('legacy provider attempt needs its exact retained HTTP402 evidence and cache identity')
    return {'path': str(path), 'sha256': digest(path), 'request_id': value['request_id'],
            'ledger_event_index': matches[-1], 'evidence': {'path': str(evidence), 'sha256': digest(evidence)}}


def generation_problems(response):
    """A service probe needs generated tokens, not an audiovisual review verdict."""
    if (not isinstance(response, dict) or not isinstance(response.get('candidates'), list)
            or not response['candidates'] or not isinstance(response['candidates'][0], dict)
            or not isinstance(response.get('usageMetadata'), dict)):
        return ['provider returned no valid generated-token availability evidence']
    candidate = (response.get('candidates') or [{}])[0]
    usage = response.get('usageMetadata') or {}
    generated = sum(value for key in ('candidatesTokenCount', 'thoughtsTokenCount')
                    if type(value := usage.get(key)) is int and value > 0)
    content = candidate.get('content') or {}
    parts = content.get('parts') or [] if isinstance(content, dict) else []
    visible = any(isinstance(part, dict) and isinstance(part.get('text'), str) and part['text'].strip()
                  for part in parts) if isinstance(parts, list) else False
    if (response.get('error') or not response.get('responseId')
            or candidate.get('finishReason') not in ('STOP', 'MAX_TOKENS')
            or not (visible or generated) or type(usage.get('totalTokenCount')) is not int
            or usage['totalTokenCount'] <= 0):
        return ['provider returned no valid generated-token availability evidence']
    return []


def legacy_probe_failure(path, state, target):
    """One linked repair for the retired eight-token audiovisual-parser defect."""
    state = Path(state).resolve()
    path = owned(path, state.parent)
    base = state.parent/'provider-availability'/('after-'+target['sha256'] if target else 'startup')
    if path != base/'receipt.json':
        raise ValueError('parser recovery must target its original canonical availability receipt')
    value = json.loads(path.read_text()); attempt_path = base/'attempt.json'
    attempt = json.loads(attempt_path.read_text()); ledger = read_state(state)
    if (value.get('schema') != SCHEMA or value.get('available') is not False
            or value.get('http_status') != 200 or value.get('response')
            or (base/'response.json').exists() or attempt.get('generation_protocol')
            or value.get('after_attempt') != target or attempt.get('after_attempt') != target
            or value.get('request_id') != attempt.get('request_id')):
        raise ValueError('parser recovery requires the retained legacy HTTP200 probe without a completed response')
    index = value.get('reservation_event_index', -1)
    if (type(index) is not int or not 0 <= index < len(ledger['events'])
            or ledger['events'][index] != value.get('reservation')
            or value['reservation'].get('kind') != 'reserved'
            or value['reservation'].get('resources') != {'audiovisual_reviews': 1}
            or not any(row.get('kind') == 'provider_availability_probe'
                       and all(row.get(key) == item for key, item in attempt.items() if key != 'schema')
                       for row in ledger['events'])
            or not any(row.get('kind') == 'provider_availability_result'
                       and row.get('request_id') == value['request_id']
                       and row.get('receipt_sha256') == digest(path)
                       and row.get('available') is False and row.get('http_status') == 200
                       for row in ledger['events'])):
        raise ValueError('legacy parser failure lacks its exact charged attempt and retained result')
    return {'path': str(path), 'sha256': digest(path), 'receipt': path.read_text(),
            'attempt_sha256': digest(attempt_path), 'attempt': attempt_path.read_text(),
            'request_id': value['request_id'], 'reservation_event_index': index}


def proof_problems(proof, attempt_sha=None):
    try:
        receipt_bytes = proof['receipt']; receipt = json.loads(receipt_bytes)
        response_bytes = proof['response']; response = json.loads(response_bytes)
        errors = []
        if (receipt.get('schema') != SCHEMA or receipt.get('available') is not True
                or receipt.get('http_status') != 200 or receipt.get('model') != policy()['av_model']
                or not response.get('candidates') or response.get('error')
                or receipt['response']['sha256'] != hashlib.sha256(response_bytes.encode()).hexdigest()
                or proof['receipt_sha256'] != hashlib.sha256(receipt_bytes.encode()).hexdigest()):
            errors.append('provider generation availability proof is incomplete or changed')
        errors.extend(generation_problems(response))
        prior = receipt.get('after_probe')
        if prior:
            failed = json.loads(prior['receipt']); attempt = json.loads(prior['attempt'])
            if (prior['sha256'] != hashlib.sha256(prior['receipt'].encode()).hexdigest()
                    or prior['attempt_sha256'] != hashlib.sha256(prior['attempt'].encode()).hexdigest()
                    or failed.get('available') is not False or failed.get('http_status') != 200
                    or failed.get('response') or attempt.get('generation_protocol')
                    or failed.get('request_id') != prior['request_id']
                    or attempt.get('request_id') != prior['request_id']
                    or failed.get('after_attempt') != receipt.get('after_attempt')
                    or receipt['reservation_event_index'] <= prior['reservation_event_index']):
                errors.append('legacy parser recovery provenance is incomplete or changed')
        if attempt_sha is not None and (receipt.get('after_attempt') or {}).get('sha256') != attempt_sha:
            errors.append('availability proof belongs to another failed provider attempt')
        if proof.get('failed_attempt') is not None and (receipt.get('after_attempt') or {}).get('sha256') != hashlib.sha256(proof['failed_attempt'].encode()).hexdigest():
            errors.append('retained failed attempt differs from the successful generation probe target')
        if (receipt.get('reservation', {}).get('kind') != 'reserved'
                or receipt.get('reservation', {}).get('resources') != {'audiovisual_reviews': 1}):
            errors.append('availability probe lacks its actual single precharged request')
        return errors
    except (KeyError, TypeError, ValueError):
        return ['provider generation availability proof is malformed']


def verified_proof(receipt_path, state):
    receipt_path = owned(receipt_path, state.parent)
    receipt = json.loads(receipt_path.read_text())
    response_path = owned(receipt_path.parent/receipt['response']['file'], state.parent)
    proof = {'receipt': receipt_path.read_text(), 'receipt_sha256': digest(receipt_path),
             'response': response_path.read_text()}
    errors = proof_problems(proof)
    target = receipt.get('after_attempt') or {}
    if receipt.get('after_probe'):
        actual = legacy_probe_failure(receipt['after_probe']['path'], state, target or None)
        if actual != receipt['after_probe']:
            errors.append('original failed availability probe changed')
    ledger = read_state(state); index = receipt.get('reservation_event_index', -1)
    if (type(index) is not int or not 0 <= index < len(ledger['events'])
            or ledger['events'][index] != receipt.get('reservation')
            or index <= target.get('ledger_event_index', -1)):
        errors.append('availability probe was not charged after its actual failed provider request')
    if not any(row.get('kind') == 'provider_availability_result'
               and row.get('request_id') == receipt.get('request_id')
               and row.get('receipt_sha256') == digest(receipt_path)
               and row.get('available') is True for row in ledger['events']):
        errors.append('successful generation probe is absent from the retained ledger')
    if errors:
        raise ValueError('; '.join(errors))
    return proof


def recovery_proof(receipt_path, attempt_path, state):
    proof = verified_proof(receipt_path, state)
    proof['failed_attempt'] = Path(attempt_path).read_text()
    receipt = json.loads(proof['receipt']); target = receipt.get('after_attempt') or {}
    errors = proof_problems(proof, digest(attempt_path))
    actual = failed_attempt(attempt_path, state, Path(target['evidence']['path']))
    if actual != target:
        errors.append('failed provider attempt or original failure evidence changed')
    if errors: raise ValueError('; '.join(errors))
    return proof


def research_receipt(state, edition):
    """Bind early Claude workers to real generation availability on this ledger."""
    state = Path(state).resolve(); ledger = read_state(state)
    if str(ledger.get('run_id', ''))[:10] != edition or ledger.get('terminal_state'):
        raise ValueError('early provider check belongs to another or finished edition')
    for path in sorted((state.parent/'provider-availability').rglob('receipt.json')):
        try:
            proof = verified_proof(path, state); receipt = json.loads(proof['receipt'])
            target = receipt.get('after_attempt')
            if target and Path(target['path']).parent.name != 'startup':
                continue
            if target:
                recovery_proof(path, Path(target['path']), state)
            return {'path': str(path), 'sha256': proof['receipt_sha256']}
        except (ValueError, OSError, KeyError, TypeError):
            continue
    raise ValueError('run provider_availability.py before research; metadata GET or credential presence is insufficient')


def probe(state, *, after_attempt=None, failure_evidence=None, after_probe=None):
    state = Path(state).resolve(); ledger = read_state(state)
    if ledger.get('terminal_state'):
        raise ValueError('provider availability cannot charge a finished edition')
    target = failed_attempt(after_attempt, state, failure_evidence) if after_attempt else None
    identity = ('after-'+target['sha256']) if target else 'startup'
    root = state.parent/'provider-availability'/identity
    previous = legacy_probe_failure(after_probe, state, target) if after_probe else None
    if previous:
        root = root/'generation-recovery'
    from independent_review import claim
    with claim(root/'probe.lock'):
        return probe_claimed(state, target, root, previous)


def probe_claimed(state, target, root, previous=None):
    ledger = read_state(state)
    if ledger.get('terminal_state'):
        raise ValueError('provider availability cannot charge a finished edition')
    receipt_path = root/'receipt.json'
    if receipt_path.is_file():
        value = json.loads(receipt_path.read_text())
        if value.get('available') is not True:
            raise ValueError('provider availability already failed; no unchanged paid probe or polling')
        verified_proof(receipt_path, state)
        return receipt_path
    if (root/'attempt.json').exists():
        raise ValueError('provider availability probe already recorded; no unchanged paid retry')
    key = os.environ.get('GEMINI_API_KEY')
    if not key:
        raise ValueError('configured provider credential is unavailable')
    # Protect the entire remaining route after this extra unscored service request.
    from repair_guard import production_budget_precheck
    remaining = copy.deepcopy(ledger); remaining['usage']['audiovisual_reviews'] += 1
    budget = production_budget_precheck(remaining, 'provider')
    if not budget['feasible']:
        raise ValueError('fund the complete remaining provider route plus availability probe first')
    from independent_review import claim
    with claim(state.with_name(state.name+'.independent.lock'), blocking=True):
        accepted, message = reserve(state, {'audiovisual_reviews': 1}, 'unscored provider generation availability')
        if not accepted: raise ValueError(message)
        charged = read_state(state)
        index = max(i for i, row in enumerate(charged['events']) if row.get('kind') == 'reserved')
    root.mkdir(parents=True, exist_ok=True)
    request_id = str(uuid.uuid4()); model = policy()['av_model']
    attempt = {'schema': SCHEMA, 'request_id': request_id, 'model': model, 'started_at': now(),
               'after_attempt': target, 'generation_protocol': GENERATION_PROTOCOL,
               'after_probe': previous, 'reservation_event_index': index, 'reservation': charged['events'][index]}
    (root/'attempt.json').write_text(encoded(attempt))
    with claim(state.with_name(state.name+'.independent.lock'), blocking=True):
        charged = read_state(state)
        event(charged, 'provider_availability_probe', **{k: v for k, v in attempt.items() if k != 'schema'})
        save(state, charged)
    started = time.monotonic(); tokens = 0; status = None
    receipt = {**attempt, 'available': False, 'http_status': None}
    try:
        response = requests.post('https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent',
            headers={'x-goog-api-key': key}, json={'contents': [{'role': 'user', 'parts': [{'text': 'Reply OK.'}]}],
                'generationConfig': {'maxOutputTokens': 64}}, timeout=(30, 90))
        status = response.status_code; receipt['http_status'] = status
        if status != 200:
            receipt.update(http_failure(response, key))
            receipt['error'] = 'configured provider generation returned HTTP '+str(status)
            raise ValueError(receipt['error'])
        body = response.text
        safe = http_failure(response, key)['sanitized_body']
        body_path = root/'response-body.txt'; body_path.write_text(safe)
        receipt['raw_response'] = {'file': body_path.name, 'sha256': digest(body_path),
                                   'original_sha256': hashlib.sha256(body.encode()).hexdigest()}
        raw = json.loads(safe)
        response_path = root/'response.json'; response_path.write_text(encoded(raw))
        tokens = int((raw.get('usageMetadata') or {}).get('totalTokenCount') or 0)
        receipt['response'] = {'file': response_path.name, 'sha256': digest(response_path)}
        problems = generation_problems(raw)
        if problems: raise ValueError('; '.join(problems))
        receipt['available'] = True
    except ValueError as exc:
        receipt['error'] = str(exc)
        raise
    except requests.RequestException as exc:
        receipt['error'] = 'provider generation '+type(exc).__name__
        raise ValueError(receipt['error']) from None
    finally:
        receipt['finished_at'] = now(); receipt_path.write_text(encoded(receipt))
        with claim(state.with_name(state.name+'.independent.lock'), blocking=True):
            record_telemetry(state, 'audiovisual_reviews', round((time.monotonic()-started)*1000), tokens,
                             request_id+' unscored provider generation availability')
            charged = read_state(state)
            event(charged, 'provider_availability_result', request_id=request_id, available=receipt['available'],
                  http_status=status, receipt_sha256=digest(receipt_path))
            save(state, charged)
    return receipt_path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state', type=Path, default=Path('out/dispatch/run_state.json'))
    parser.add_argument('--after-attempt', type=Path)
    parser.add_argument('--failure-evidence', type=Path)
    parser.add_argument('--after-probe', type=Path, help='one linked repair of the retired HTTP200 stream-parser defect')
    args = parser.parse_args()
    try:
        path = probe(args.state, after_attempt=args.after_attempt, failure_evidence=args.failure_evidence,
                     after_probe=args.after_probe)
        print('provider_availability: generation available; no film approval; receipt '+str(path))
        return 0
    except (ValueError, OSError, KeyError, TypeError) as exc:
        print('provider_availability: '+str(exc))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
