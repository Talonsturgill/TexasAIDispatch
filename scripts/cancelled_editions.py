"""Explicit owner cancellation retains evidence and permits a later date, never shipment."""
import argparse
from datetime import date
import hashlib
import json
from pathlib import Path
import re
from zoneinfo import ZoneInfo

import claude_checkpoint as checkpoint
import completion_yield as closure

SCHEMA = 'dispatch_owner_cancelled_edition/1'
ARCHIVE = 'refs/heads/claude/cancelled/'
ATTESTATION = 'Operator retained explicit owner cancellation of this edition; no shipment or review approval.'


def proof(repo, commit, run_id, authority, *, full=False):
    """Bind cancellation to the complete unchanged original checkpoint, not a reset ledger."""
    if full:
        manifest, ledger = checkpoint.verify_checkpoint(repo, commit, run_id)
    else:
        base = checkpoint.ROOT + '/' + run_id
        manifest = json.loads(checkpoint.show(repo, commit, base + '/manifest.json'))
        ledger = checkpoint.show(repo, commit, base + '/run_state.json')
    state = json.loads(ledger)
    closure.require(manifest.get('schema') == checkpoint.SCHEMA
                    and manifest.get('run_id') == state.get('run_id') == run_id
                    and state.get('mode') == 'production'
                    and hashlib.sha256(ledger).hexdigest() == manifest.get('ledger_sha256')
                    and not manifest.get('terminal_state') and not manifest.get('shipment_recorded')
                    and not state.get('terminal_state') and not state.get('shipment'),
                    'owner cancellation needs the exact unfinished production checkpoint')
    closure.require(isinstance(authority, dict)
                    and authority.get('action') == 'cancel-edition'
                    and authority.get('run_id') == run_id
                    and authority.get('attestation') == ATTESTATION
                    and re.fullmatch(r'[0-9a-f]{64}', str(authority.get('instruction_sha256', ''))),
                    'retain the explicit edition-bound owner cancellation')
    import publication_owner as owner
    owner.instant(authority['at'])
    return {'schema': SCHEMA, 'run_id': run_id, 'checkpoint': commit,
            'archive_ref': ARCHIVE + run_id,
            'ledger_sha256': manifest['ledger_sha256'], 'manifest_sha256': closure.digest(manifest),
            'source_pin': manifest['source_pin'], 'repo_root': manifest['repo_root'],
            'original_state': {k: state[k] for k in ('resource_envelope', 'usage', 'events')},
            'evidence': authority, 'production_finished': False, 'shipment_authorized': False}


def verify(repo, commit, run_id, retained):
    closure.require(commit == retained.get('checkpoint'),
                    'cancelled checkpoint changed; preserve the cancellation and investigate new work')
    actual = proof(repo, commit, run_id, retained.get('evidence'))
    closure.require(actual == retained, 'owner cancellation differs from its retained original evidence')
    remote = checkpoint.git(repo, 'ls-remote', '--heads', 'origin', actual['archive_ref']).stdout.decode().split()
    closure.require(remote == [commit, actual['archive_ref']],
                    'cancelled edition needs its exact recoverable archive branch')
    return actual


def cancel(repo, run_id, authorization, workspace=None, *, confirmed=False, moment=None, prove_only=False):
    """Archive first, then append disposition through normal expired-lease CAS fencing."""
    import failed_editions as failed
    import publication_owner as owner
    from checkpoint_discovery import fetched_snapshot
    repo = Path(repo).resolve(); workspace = Path(workspace or owner.PRIMARY).resolve()
    moment = moment or owner.now()
    closure.require(confirmed, 'explicit owner cancellation confirmation is required')
    request = json.loads(Path(authorization).read_text())
    closure.require(request.get('action') == 'cancel-edition' and request.get('run_id') == run_id
                    and isinstance(request.get('instruction'), str) and bool(request['instruction'].strip()),
                    'retain the owner instruction for this exact edition')
    closure.require(failed.day(run_id) >= date.fromisoformat(failed.EFFECTIVE)
                    and failed.day(run_id) < moment.astimezone(ZoneInfo('America/New_York')).date(),
                    'cancel only an older edition so a later daily edition can start')
    authority = {'action': 'cancel-edition', 'run_id': run_id, 'at': owner.stamp(moment),
                 'instruction_sha256': hashlib.sha256(request['instruction'].encode()).hexdigest(),
                 'attestation': ATTESTATION}
    with owner.locked(workspace):
        value = owner.read_remote(repo)
        existing = failed.verified(repo, run_id, value or {})
        if existing:
            closure.require(existing.get('schema') == SCHEMA,
                            'preserve the existing exhausted-failure disposition')
            return {'status': 'owner_cancelled', 'changed': False, 'proof': existing, 'shipped': False}
        closure.require(value and value['status'] == 'held' and value['run_id'] == run_id,
                        'cancel only the original held unfinished edition')
        closure.require(owner.instant(value['expires_at']) <= moment,
                        'preserve the live publication owner; an expired lease is required')
        with fetched_snapshot(repo, 'origin', 'refs/heads/' + checkpoint.BRANCH + run_id) as commit:
            retained = proof(repo, commit, run_id, authority, full=True)
            if prove_only:
                return {'status': 'cancellation_proven', 'changed': False, 'proof': retained, 'shipped': False}
            # A second durable ref makes recovery explicit. Never delete or force an existing ref.
            archive = retained['archive_ref']
            rows = checkpoint.git(repo, 'ls-remote', '--heads', 'origin', archive).stdout.decode().split()
            closure.require(not rows or rows == [commit, archive], 'preserve the existing cancellation archive')
            if not rows:
                checkpoint.git(repo, 'push', '--quiet', '--force-with-lease=' + archive + ':',
                               'origin', commit + ':' + archive)
            verify(repo, commit, run_id, retained)
        canonical = 'refs/heads/' + checkpoint.BRANCH + run_id
        def unchanged_checkpoint():
            rows = checkpoint.git(repo, 'ls-remote', '--heads', 'origin', canonical).stdout.decode().split()
            closure.require(rows == [retained['checkpoint'], canonical],
                            'checkpoint advanced during cancellation; preserve all work and re-evaluate the disposition')
        unchanged_checkpoint()
        proposed = {k: v for k, v in value.items() if k != 'commit'}
        # Reuse the existing durable disposition catalog/readers with a distinct truthful schema.
        proposed[failed.FIELD] = {**value.get(failed.FIELD, {}), run_id: retained}
        result = owner.append(repo, proposed, value['commit'])
        unchanged_checkpoint()
        return {'status': 'owner_cancelled', 'changed': True, 'proof': retained,
                'ownership_commit': result['commit'], 'shipped': False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, default=checkpoint.REPO)
    parser.add_argument('--workspace', type=Path)
    parser.add_argument('--run-id', required=True)
    parser.add_argument('--authorization', type=Path, required=True)
    parser.add_argument('--confirm-owner-cancellation', action='store_true')
    parser.add_argument('--prove-only', action='store_true')
    args = parser.parse_args()
    result = cancel(args.repo, args.run_id, args.authorization, args.workspace,
                    confirmed=args.confirm_owner_cancellation, prove_only=args.prove_only)
    retained = result.pop('proof')
    print(json.dumps({**result, 'run_id': retained['run_id'], 'checkpoint': retained['checkpoint'],
                      'archive_ref': retained['archive_ref'], 'shipment_authorized': False}, indent=2))


if __name__ == '__main__':
    main()
