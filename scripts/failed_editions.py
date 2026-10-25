"""Retain an exhausted failed edition without shipping it or resetting its budget."""
from datetime import date
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import tempfile
from zoneinfo import ZoneInfo

import claude_checkpoint as checkpoint
import completion_yield as closure

SCHEMA = 'dispatch_failed_edition/1'
FIELD = 'failed_editions'
EFFECTIVE = '2026-10-24'


def day(value):
    if not checkpoint.RUN_ID.fullmatch(value):
        raise ValueError('failed-edition retention requires an actual edition identity')
    return date.fromisoformat(value[:10])


def _infeasible_evidence(repo, commit, run_id, manifest, ledger):
    """Reprove a fourth original combined rejection without rendering or resuming it."""
    state = json.loads(ledger); rows = {r['path']: r for r in manifest['files']}
    closure.require(len(rows) == len(manifest['files'])
                    and not {'out/dispatch/film.mp4', 'out/dispatch/cinema/hero.mp4'} & set(rows),
                    'do not retire a native film or ambiguous checkpoint inventory')
    claims = {p for p in rows if p.startswith('out/dispatch/worker-dispatch-claims/')}
    receipts = {p for p in rows if p.startswith('out/dispatch/' + closure.CRITIC_RECEIPTS + '/')
                and not PurePosixPath(p).name.startswith('handback-')}
    closure.require(bool(claims) and bool(receipts), 'retain the actual original native critic completion')
    with tempfile.TemporaryDirectory(prefix='dispatch-infeasible-proof-') as temporary:
        root = Path(temporary).resolve() / 'Dispatch'; state_path = root / 'out/dispatch/run_state.json'
        state_path.parent.mkdir(parents=True); state_path.write_bytes(ledger)
        def materialize(rel):
            closure.require(isinstance(rel, str) and '\0' not in rel
                            and not PurePosixPath(rel).is_absolute() and '..' not in PurePosixPath(rel).parts
                            and PurePosixPath(rel).as_posix() == rel,
                            'failure evidence path must stay inside its owned checkpoint')
            row = rows[rel]
            closure.require(type(row.get('size')) is int and 0 < row['size'] <= 8 * 1024 * 1024,
                            'administrative failure proof only materializes bounded original JSON evidence')
            target = root / rel; target.parent.mkdir(parents=True, exist_ok=True)
            checkpoint.materialize_checkpoint_file(repo, commit, run_id, row, target)
            return target
        for rel in sorted(claims | receipts):
            materialize(rel)
        reservations = [i for i, event in enumerate(state['events']) if event.get('kind') == 'reserved'
                        and event.get('resources', {}).get('storyboard_critics')]
        closure.require(bool(reservations), 'retain the actual paid critic reservations')
        originals = []
        for rel in sorted(receipts):
            receipt, claim, _ = closure.critic_completion(root, root / rel)
            if claim['reservation_event_index'] == reservations[-1]:
                originals.append((rel, receipt))
        closure.require(len(originals) == 1, 'retain the one complete original critic response for this charged attempt')
        receipt_path, receipt = originals[0]
        packets = [p for p, row in rows.items() if p.startswith('out/dispatch/') and p.endswith('.json')
                   and row['sha256'] == receipt['packet_sha256']]
        closure.require(bool(packets), 'retain the exact original paid critic packet')
        materialize(sorted(packets)[0])
        evidence = closure.validate_infeasible_review(state_path, {
            'reason': closure.INFEASIBLE_REQUIRED_REVIEW, 'critic_completion': receipt_path})
        closure.require(all(rows[p]['sha256'] == sha for p, sha in evidence['files'].items())
                        and {p for p in evidence['files'] if p.startswith('out/dispatch/worker-dispatch-claims/')} == claims,
                        'retain every original failure and worker claim')
    return evidence


def _proof(repo, commit, run_id, *, full=True):
    """Use the existing strict failure validator and only small working-copy files."""
    base = checkpoint.ROOT + '/' + run_id
    if full:
        manifest, ledger = checkpoint.verify_checkpoint(repo, commit, run_id)
    else:
        manifest = json.loads(checkpoint.show(repo, commit, base + '/manifest.json'))
        ledger = checkpoint.show(repo, commit, base + '/run_state.json')
    closure.require(manifest.get('schema') == checkpoint.SCHEMA and manifest.get('run_id') == run_id
                    and hashlib.sha256(ledger).hexdigest() == manifest.get('ledger_sha256'),
                    'failed-edition checkpoint identity or original ledger changed')
    state = json.loads(ledger)
    closure.require(state.get('run_id') == run_id and not manifest.get('terminal_state')
                    and not manifest.get('shipment_recorded'), 'retain failure without claiming shipment')
    closed_reasons = [e.get('evidence', {}).get('plan', {}).get('reason') for e in state['events']
                      if e.get('kind') == closure.KIND]
    native = any(r['path'].startswith('out/dispatch/' + closure.CRITIC_RECEIPTS + '/')
                 for r in manifest['files'])
    if (run_id[:10] >= '2026-10-25' and state.get('usage', {}).get('storyboard_critics') == 4
            and (closed_reasons == [closure.INFEASIBLE_REQUIRED_REVIEW] or not closed_reasons and native)):
        evidence = _infeasible_evidence(repo, commit, run_id, manifest, ledger)
        return {'schema': SCHEMA, 'run_id': run_id, 'checkpoint': commit,
                'ledger_sha256': manifest['ledger_sha256'], 'manifest_sha256': closure.digest(manifest),
                'source_pin': manifest['source_pin'], 'repo_root': manifest['repo_root'],
                'original_state': {k: state[k] for k in ('resource_envelope', 'usage', 'events')},
                'evidence': evidence, 'production_finished': False, 'shipment_authorized': False}
    originals = [e['repair_plan'] for e in state['events'] if e.get('kind') == 'repair_authorized'
                 and e.get('repair_plan', {}).get('failure_evidence')]
    closure.require(bool(originals), 'retain the original ledger-bound failure')
    failure = originals[-1]['failure_evidence']
    prefix = '{REPO}/'
    closure.require(isinstance(failure, str) and failure.startswith(prefix),
                    'failure checkpoint must retain its portable original path')
    failure = failure[len(prefix):]
    rows = {r['path']: r for r in manifest['files']}
    closure.require(len(rows) == len(manifest['files']) and 'out/dispatch/film.mp4' not in rows,
                    'do not retire a native film or ambiguous checkpoint inventory')
    required = {failure, 'out/dispatch/storyboard_critic.json'} | {
        p for p in rows if p.startswith('out/dispatch/worker-dispatch-claims/')}
    closure.require(required <= set(rows), 'original failure or critic evidence is missing')
    # This administrative route never restores media, renderer assets or a production checkout.
    with tempfile.TemporaryDirectory(prefix='dispatch-failed-proof-') as temporary:
        root = Path(temporary).resolve() / 'Dispatch'; state_path = root / 'out/dispatch/run_state.json'
        state_path.parent.mkdir(parents=True); state_path.write_bytes(ledger)
        for rel in sorted(required):
            closure.require(isinstance(rel, str) and '\0' not in rel
                            and not PurePosixPath(rel).is_absolute() and '..' not in PurePosixPath(rel).parts
                            and PurePosixPath(rel).as_posix() == rel,
                            'failure evidence path must stay inside its owned checkpoint')
            row = rows[rel]
            closure.require(type(row.get('size')) is int and 0 < row['size'] <= 1024 * 1024,
                            'administrative failure proof only materializes small original evidence')
            target = root / rel; target.parent.mkdir(parents=True, exist_ok=True)
            checkpoint.materialize_checkpoint_file(repo, commit, run_id, row, target)
        # Preserve the producer's unfundable proof: present opening evidence must be
        # seen before deciding whether the remaining path is still available.
        for name in ('openings/selection.json', 'opening-a-critic.json', 'opening-b-critic.json'):
            rel = 'out/dispatch/' + name
            if rel in rows:
                closure.require(type(rows[rel].get('size')) is int and 0 < rows[rel]['size'] <= 1024 * 1024,
                                'administrative failure proof only materializes small original evidence')
                target = root / rel; target.parent.mkdir(parents=True, exist_ok=True)
                checkpoint.materialize_checkpoint_file(repo, commit, run_id, rows[rel], target)
        evidence, refusal = None, None
        for reason in closure.PRE_FILM_REASONS:
            try:
                evidence = closure.validate_exhausted_review(state_path, {
                    'reason': reason, 'failure_evidence': failure})
                break
            except ValueError as error:
                refusal = refusal or error
        if evidence is None:
            raise refusal
        closure.require(evidence['files'] == {p: rows[p]['sha256'] for p in required},
                        'retain every original failure and worker claim')
    return {'schema': SCHEMA, 'run_id': run_id, 'checkpoint': commit,
            'ledger_sha256': manifest['ledger_sha256'], 'manifest_sha256': closure.digest(manifest),
            'source_pin': manifest['source_pin'], 'repo_root': manifest['repo_root'],
            'original_state': {k: state[k] for k in ('resource_envelope', 'usage', 'events')},
            'evidence': evidence, 'production_finished': False, 'shipment_authorized': False}


def verified(repo, run_id, record=None):
    """A flag alone never removes an unfinished production from selection."""
    import publication_owner as owner
    record = owner.read_remote(repo) if record is None else record
    proof = (record or {}).get(FIELD, {}).get(run_id)
    if proof is None:
        return None
    closure.require(isinstance(proof, dict) and proof.get('schema') == SCHEMA
                    and proof.get('run_id') == run_id, 'failed-edition disposition is malformed')
    ref = 'refs/heads/' + checkpoint.BRANCH + run_id
    from checkpoint_discovery import fetched_snapshot
    with fetched_snapshot(repo, 'origin', ref) as commit:
        closure.require(commit == proof.get('checkpoint'),
                        'retained failed checkpoint changed; preserve both records and repair its source')
        actual = _proof(repo, commit, run_id, full=False)
    closure.require(actual == proof, 'failed-edition disposition does not match original evidence')
    return proof


def matches_state(proof, state):
    """Match the retained ledger; only truthful closure and retrospective accounting may follow."""
    if (not isinstance(proof, dict) or proof.get('schema') != SCHEMA
            or proof.get('run_id') != state.get('run_id') or state.get('mode') != 'production'
            or state.get('terminal_state') or state.get('shipment')):
        return False
    try:
        projected = checkpoint.public_ledger(state, proof['repo_root'])
        original = proof['original_state']; count = len(original['events'])
        paid = lambda usage: {k: v for k, v in usage.items() if k != 'reported_tokens'}
        if (projected['resource_envelope'] != original['resource_envelope']
                or paid(projected['usage']) != paid(original['usage'])
                or projected['events'][:count] != original['events']):
            return False
        for event in projected['events'][count:]:
            if event.get('kind') == closure.KIND:
                if event.get('evidence') != proof['evidence']:
                    return False
            elif event.get('kind') == 'reserved' and set(event.get('resources', {})) == {'reported_tokens'}:
                continue
            elif event.get('kind') == 'telemetry' and event.get('reported_tokens') is not None:
                continue
            else:
                return False
        return True
    except (ValueError, KeyError, TypeError, OSError):
        return False


def retained(repo, run_id, state=None, record=None):
    proof = verified(repo, run_id, record)
    if proof is not None and state is not None and not matches_state(proof, state):
        raise ValueError('local failed ledger differs from its retained original charges or evidence')
    return proof


def assert_not_retained(repo, run_id, record=None):
    import publication_owner as owner
    if day(run_id) < date.fromisoformat(EFFECTIVE):
        return  # Historical shipped/manual editions retain their original lifecycle.
    record = owner.read_remote(repo) if record is None else record
    for previous in (record or {}).get(FIELD, {}):
        if day(previous) == day(run_id) and verified(repo, previous, record):
            raise ValueError('failed edition date is retained without shipment; no same-date restart or budget reset')


def retain(repo, run_id, next_date, workspace=None, *, moment=None, prove_only=False):
    """Append only failure metadata; later acquisition uses the existing expired-lease fencing."""
    import publication_owner as owner
    repo = Path(repo).resolve(); workspace = Path(workspace or owner.PRIMARY).resolve()
    moment = moment or owner.now()
    today = moment.astimezone(ZoneInfo('America/New_York')).date()
    requested = date.fromisoformat(next_date)
    closure.require(day(run_id) >= date.fromisoformat(EFFECTIVE) and requested > day(run_id)
                    and (prove_only or requested == today and today > day(run_id)),
                    'retained failure permits only the actual later daily date')
    from checkpoint_discovery import fetched_snapshot
    with owner.locked(workspace):
        value = owner.read_remote(repo)
        closure.require(value and value['status'] == 'held' and value['run_id'] == run_id,
                        'retain only the original held failed edition')
        closure.require(owner.instant(value['expires_at']) <= moment,
                        'preserve the live publication owner; an expired lease is required')
        existing = verified(repo, run_id, value)
        if existing:
            return {'status': 'failed_retained', 'proof': existing, 'changed': False, 'shipped': False}
        with fetched_snapshot(repo, 'origin', 'refs/heads/' + checkpoint.BRANCH + run_id) as commit:
            proof = _proof(repo, commit, run_id)
        if prove_only:
            return {'status': 'failure_proven', 'proof': proof, 'changed': False, 'shipped': False}
        proposed = {k: v for k, v in value.items() if k != 'commit'}
        proposed[FIELD] = {**value.get(FIELD, {}), run_id: proof}
        # This normal CAS changes no lease/owner/status and cannot supersede a racing heartbeat.
        result = owner.append(repo, proposed, value['commit'])
        return {'status': 'failed_retained', 'proof': proof, 'changed': True,
                'ownership_commit': result['commit'], 'shipped': False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['retain'])
    parser.add_argument('--repo', type=Path, default=checkpoint.REPO)
    parser.add_argument('--workspace', type=Path)
    parser.add_argument('--run-id', required=True)
    parser.add_argument('--next-date', required=True)
    parser.add_argument('--prove-only', action='store_true')
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    result = retain(args.repo, args.run_id, args.next_date, args.workspace, prove_only=args.prove_only)
    if args.output:
        closure.immutable(args.output, result)
    proof = result['proof']
    print(json.dumps({k: v for k, v in result.items() if k != 'proof'} | {
        'run_id': proof['run_id'], 'checkpoint': proof['checkpoint'], 'ledger_sha256': proof['ledger_sha256'],
        'editorial_attempts': proof['original_state']['usage']['storyboard_critics']}, indent=2))


if __name__ == '__main__':
    main()
