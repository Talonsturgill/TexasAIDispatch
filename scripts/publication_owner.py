"""One cloud publisher at a time, with append-only ownership and prepaid worker claims."""
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
import argparse
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import tempfile
import time
from uuid import uuid4
from zoneinfo import ZoneInfo

import claude_checkpoint as checkpoint
from checkpoint_discovery import fetched_snapshot

SCHEMA = 'dispatch_publication_owner/1'
REF = 'refs/heads/claude/publication-owner'
FILE = 'publication.json'
MARKER = '.claude/dispatch-publication-owner.json'
PRIMARY = Path('/home/user')
EFFECTIVE = '2026-10-21'
LEASE_SECONDS = 7200
PULSE_SECONDS = 60
RESOURCES = {'researcher': 'research_agents', 'validator': 'validator_agents',
             'scene-builder': 'reboards', 'storyboard-critic': 'storyboard_critics',
             'voice-director': 'voice_directors', 'picture': 'scorer_calls',
             'story': 'scorer_calls', 'sound': 'scorer_calls'}


def now():
    return datetime.now(timezone.utc)


def enabled():
    return (os.environ.get('CLAUDE_CODE_REMOTE') == 'true'
            and now().astimezone(ZoneInfo('America/New_York')).date().isoformat() >= EFFECTIVE)


def stamp(value):
    return value.astimezone(timezone.utc).isoformat()


def instant(value):
    parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if parsed.tzinfo is None:
        raise ValueError('publication ownership needs an actual timezone')
    return parsed


def identity(session=None):
    value = session or os.environ.get('CLAUDE_CODE_SESSION_ID')
    if not isinstance(value, str) or not value or len(value) > 256:
        raise ValueError('the actual Claude session identity is unavailable; inspect startup before paid work')
    return hashlib.sha256(value.encode()).hexdigest()


def load(path):
    return json.loads(Path(path).read_text())


def write(path, data):
    path = Path(path)
    if path.is_symlink():
        raise ValueError('preserve the symlink at the publication metadata path')
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile('w', dir=path.parent, delete=False) as stream:
        temporary = Path(stream.name)
        json.dump(data, stream, indent=2, sort_keys=True)
        stream.write('\n')
    temporary.replace(path)


def wait_path(workspace, owner):
    return Path(workspace) / '.claude/publication-waits' / (owner + '.json')


def record_wait(workspace, owner, repo, result):
    write(wait_path(workspace, owner), {'schema': SCHEMA, 'owner_sha256': owner,
          'repo': str(repo), 'observed_at': stamp(now()), **result})


@contextmanager
def locked(workspace):
    directory = Path(workspace) / '.claude'
    directory.mkdir(parents=True, exist_ok=True)
    with (directory / '.dispatch-publication.lock').open('a') as stream:
        fcntl.flock(stream, fcntl.LOCK_EX)
        yield


def read_remote(repo):
    listed = checkpoint.git(repo, 'ls-remote', '--heads', 'origin', REF)
    if not listed.stdout.strip():
        return None
    with fetched_snapshot(repo, 'origin', REF) as commit:
        value = json.loads(checkpoint.show(repo, commit, FILE))
    if (not isinstance(value, dict) or value.get('schema') != SCHEMA
            or not checkpoint.RUN_ID.fullmatch(value.get('run_id', ''))
            or not re.fullmatch(r'[0-9a-f]{64}', value.get('owner_sha256', ''))
            or not re.fullmatch(r'[0-9a-f]{32}', value.get('epoch', ''))
            or value.get('status') not in ('held', 'complete')):
        raise ValueError('publication ownership metadata is invalid; preserve it and repair its source')
    instant(value['expires_at'])
    return {**value, 'commit': commit}


def append(repo, value, parent):
    value = {**value, 'previous_commit': parent}
    encoded = (json.dumps(value, sort_keys=True, indent=2) + '\n').encode()
    blob = checkpoint.git(repo, 'hash-object', '-w', '--stdin', data=encoded).stdout.decode().strip()
    tree = checkpoint.git(repo, 'mktree', data=f'100644 blob {blob}\t{FILE}\n'.encode()).stdout.decode().strip()
    args = ['commit-tree', tree, '-m', 'Record Dispatch publication ownership']
    if parent:
        args += ['-p', parent]
    author = {'GIT_AUTHOR_NAME': 'Talon Sturgill', 'GIT_AUTHOR_EMAIL': 'Talon.sturgill@gmail.com',
              'GIT_COMMITTER_NAME': 'Talon Sturgill', 'GIT_COMMITTER_EMAIL': 'Talon.sturgill@gmail.com'}
    commit = checkpoint.git(repo, *args, env=author).stdout.decode().strip()
    # A normal fast-forward push is the ownership compare-and-swap. Never force this ref.
    checkpoint.git(repo, 'push', '--quiet', 'origin', commit + ':' + REF)
    return {**value, 'commit': commit}


def busy(value):
    return {'status': 'busy', 'run_id': value['run_id'], 'expires_at': value['expires_at'],
            'owner_sha256': value['owner_sha256'], 'review_approval': False,
            'provider_unavailable': False}


def checkpoint_record(repo, run_id):
    ref = 'refs/heads/' + checkpoint.BRANCH + run_id
    if not checkpoint.git(repo, 'ls-remote', '--heads', 'origin', ref).stdout.strip():
        return None
    with fetched_snapshot(repo, 'origin', ref) as commit:
        base = checkpoint.ROOT + '/' + run_id
        manifest = json.loads(checkpoint.show(repo, commit, base + '/manifest.json'))
        if manifest.get('schema') != checkpoint.SCHEMA or manifest.get('run_id') != run_id:
            raise ValueError('publication checkpoint belongs to another run or schema')
        raw = checkpoint.show(repo, commit, base + '/run_state.json')
        if hashlib.sha256(raw).hexdigest() != manifest['ledger_sha256']:
            raise ValueError('publication checkpoint ledger differs from its manifest')
        return manifest, json.loads(raw)


def completed_proof(repo, run_id, record=None):
    record = record or checkpoint_record(repo, run_id)
    if record is None:
        return None
    manifest, state = record
    if (manifest.get('terminal_state') != 'shipped' or manifest.get('shipment_recorded') is not True
            or state.get('terminal_state') != 'shipped' or not state.get('shipment')):
        return None
    finished = [row for row in state.get('events', [])
                if row.get('kind') == 'finished' and row.get('result') == 'shipped'
                and row.get('shipment_sha256')]
    if not finished:
        return None
    with fetched_snapshot(repo, 'origin', 'refs/heads/main') as commit:
        try:
            archive = json.loads(checkpoint.show(repo, commit, 'runs/' + run_id + '/run_state.json'))
        except checkpoint.CheckpointError as exc:
            if 'does not exist' in str(exc):
                return None  # A real shipped checkpoint can precede its required archive.
            raise
    archive_finished = [row for row in archive.get('events', [])
                        if row.get('kind') == 'finished' and row.get('result') == 'shipped']
    if (archive.get('run_id') != run_id or archive.get('terminal_state') != 'shipped'
            or not archive.get('shipment') or archive.get('usage') != state.get('usage')
            or archive.get('resource_envelope') != state.get('resource_envelope')
            or not archive_finished
            or archive_finished[-1].get('shipment_sha256') != finished[-1]['shipment_sha256']):
        return None
    return {'shipment_sha256': finished[-1]['shipment_sha256'],
            'archive_commit': commit, 'run_id': run_id}


def acquire(repo, run_id, workspace=PRIMARY, *, session=None, moment=None):
    if not checkpoint.RUN_ID.fullmatch(run_id):
        raise ValueError('invalid publication run identity')
    repo, workspace, moment = Path(repo).resolve(), Path(workspace).resolve(), moment or now()
    owner = identity(session)
    with locked(workspace):
        marker = workspace / MARKER
        local = load(marker) if marker.is_file() else None
        value = read_remote(repo)
        if value and value['status'] == 'complete' and value['run_id'] == run_id:
            record_wait(workspace, owner, repo, {'status': 'resolved', 'run_id': run_id})
            return {'status': 'complete', 'run_id': run_id, 'review_approval': False}
        if value and value['status'] == 'held' and instant(value['expires_at']) > moment:
            if (value['owner_sha256'] == owner and value['run_id'] == run_id
                    and (not local or (local.get('owner_sha256') == owner
                         and local.get('epoch') == value['epoch'] and local.get('run_id') == run_id))):
                if not local:
                    write(marker, {**value, 'repo': str(repo), 'verified_at': stamp(moment)})
                record_wait(workspace, owner, repo, {'status': 'resolved', 'run_id': run_id})
                return {'status': 'owned', 'run_id': run_id, 'epoch': value['epoch']}
            result = busy(value)
            record_wait(workspace, owner, repo, result)
            return result
        previous_proof = None
        if value and value['status'] == 'held':
            previous_proof = completed_proof(repo, value['run_id'])
            if previous_proof and value['run_id'] == run_id:
                record_wait(workspace, owner, repo, {'status': 'resolved', 'run_id': run_id})
                return {'status': 'complete', 'run_id': run_id, 'proof': previous_proof,
                        'review_approval': False}
            if not previous_proof and value['run_id'] != run_id:
                return {'status': 'resume_required', 'run_id': value['run_id'], 'review_approval': False,
                        'provider_unavailable': False}
        if value is None:
            legacy = checkpoint_record(repo, run_id)
            if legacy:
                proof = completed_proof(repo, run_id, legacy)
                if proof:
                    record_wait(workspace, owner, repo, {'status': 'resolved', 'run_id': run_id})
                    return {'status': 'complete', 'run_id': run_id, 'proof': proof, 'review_approval': False}
                expiry = instant(legacy[0]['saved_at']) + timedelta(seconds=LEASE_SECONDS)
                if expiry > moment:
                    result = {'status': 'busy', 'run_id': run_id, 'expires_at': stamp(expiry),
                              'legacy_checkpoint': True, 'review_approval': False, 'provider_unavailable': False}
                    record_wait(workspace, owner, repo, result)
                    return result
        previous = value['commit'] if value else None
        proposed = {'schema': SCHEMA, 'run_id': run_id, 'owner_sha256': owner,
                    'epoch': uuid4().hex, 'status': 'held', 'acquired_at': stamp(moment),
                    'heartbeat_at': stamp(moment), 'expires_at': stamp(moment + timedelta(seconds=LEASE_SECONDS)),
                    'previous_commit': previous, 'review_approval': False, 'provider_unavailable': False}
        if previous_proof:
            proposed['previous_publication'] = previous_proof
        try:
            held = append(repo, proposed, previous)
        except checkpoint.CheckpointError as exc:
            if not any(text in str(exc) for text in ('(fetch first)', '(non-fast-forward)', 'cannot lock ref')):
                raise  # Authentication, malformed results and unknown errors never become "busy".
            winner = read_remote(repo)
            if winner is None:
                raise
            result = busy(winner)
            record_wait(workspace, owner, repo, result)
            return result
        write(marker, {**held, 'repo': str(repo), 'verified_at': stamp(moment)})
        record_wait(workspace, owner, repo, {'status': 'resolved', 'run_id': run_id})
        return {'status': 'owned', 'run_id': run_id, 'epoch': held['epoch'],
                'fresh_reservations_required': True, 'review_approval': False}


def current(repo, run_id, workspace=PRIMARY, *, session=None, moment=None):
    workspace, repo, moment = Path(workspace), Path(repo), moment or now()
    owner = identity(session)
    marker = workspace / MARKER
    if not marker.is_file():
        raise ValueError('acquire publication ownership before restoring or paying for this edition')
    with locked(workspace):
        local = load(marker)
        if (local.get('run_id') != run_id or local.get('owner_sha256') != owner
                or local.get('status') != 'held' or instant(local['expires_at']) <= moment):
            raise ValueError('this context does not own publication; preserve its work and wait for the active owner')
        if (moment - instant(local['verified_at'])).total_seconds() < PULSE_SECONDS:
            return local
        value = read_remote(repo)
        if (not value or value['status'] != 'held' or value['epoch'] != local['epoch']
                or value['owner_sha256'] != owner or instant(value['expires_at']) <= moment):
            write(marker, {**local, 'status': 'fenced', 'observed_at': stamp(moment)})
            raise ValueError('publication ownership changed; retain every result and do not dispatch another worker')
        refreshed = {k: v for k, v in value.items() if k != 'commit'}
        refreshed.update(heartbeat_at=stamp(moment), expires_at=stamp(moment + timedelta(seconds=LEASE_SECONDS)))
        held = append(repo, refreshed, value['commit'])
        local.update(held, verified_at=stamp(moment))
        write(marker, local)
        return local


def require_owner(state_path, state=None):
    if not enabled():
        return None
    state_path = Path(state_path).resolve()
    state = state or load(state_path)
    if state.get('mode') != 'production':
        return None
    if not state_path.is_relative_to(PRIMARY.resolve()):
        raise ValueError('cloud publication ledger is outside its primary workspace')
    return current(state_path.parents[2], state['run_id'], workspace=PRIMARY)


def heartbeat_hook(payload, workspace):
    if not enabled():
        return
    marker = Path(workspace) / MARKER
    if not marker.is_file():
        return  # Bootstrap and an observer waiting for the owner remain read-only.
    value = load(marker)
    if value.get('owner_sha256') == identity(payload.get('session_id')) and value.get('status') == 'held':
        current(value['repo'], value['run_id'], workspace, session=payload.get('session_id'))


def waiting_reason(payload, workspace):
    if not enabled() or not payload.get('session_id'):
        return None
    path = wait_path(workspace, identity(payload['session_id']))
    if not path.is_file():
        return None
    value = load(path)
    if value.get('status') != 'busy':
        return None
    return ('Another active publisher owns ' + value['run_id'] + '. Keep this scheduled session open. '
            'Run python scripts/publication_owner.py acquire with --wait-seconds 55 against the actual ownership condition, '
            'then rerun the checkpoint catalog and select the current unfinished edition or today. '
            'Do not restore the active owner, reuse its reservation, buy a duplicate worker or ask for permission.')


def reservation_fields(state_path, state):
    owner = require_owner(state_path, state)
    return ({'publication_owner_sha256': owner['owner_sha256'], 'publication_epoch': owner['epoch']}
            if owner else {})


def claim_worker(state_path, role, resource, packet_sha256, task_name):
    owner = require_owner(state_path)
    if owner is None:
        return None
    if RESOURCES.get(role) != resource:
        raise ValueError('worker claim names the wrong controller resource')
    state_path = Path(state_path)
    with locked(PRIMARY):
        state = load(state_path)
        choices = [(index, row) for index, row in enumerate(state.get('events', []))
                   if row.get('kind') == 'reserved' and (row.get('resources') or {}).get(resource)]
        if not choices:
            return False
        index, event = choices[-1]
        if (event.get('publication_owner_sha256') != owner['owner_sha256']
                or event.get('publication_epoch') != owner['epoch']):
            return False  # A restore never transfers another host's spent reservation.
        fingerprint = hashlib.sha256(json.dumps(event, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
        path = state_path.parent / 'worker-dispatch-claims' / (fingerprint + '-' + role + '.json')
        path.parent.mkdir(parents=True, exist_ok=True)
        claim = {'schema': 'dispatch_worker_dispatch_claim/1', 'run_id': state['run_id'],
                 'role': role, 'task_name': task_name, 'packet_sha256': packet_sha256,
                 'reservation_event_index': index, 'reservation_sha256': fingerprint,
                 'owner_sha256': owner['owner_sha256'], 'epoch': owner['epoch'],
                 'created_at': stamp(now()), 'creative_approval': False}
        try:
            with path.open('x') as stream:
                json.dump(claim, stream, indent=2, sort_keys=True)
                stream.write('\n')
        except FileExistsError:
            return False
        checkpoint.mirror(state_path, 'claim worker dispatch ' + role)
        return path


def release(repo, state_path, workspace=PRIMARY, *, session=None):
    state = load(state_path)
    from routine_continuation import closure_problems
    problems = closure_problems(state, Path(state_path))
    if problems:
        raise ValueError('publication remains owned until verified shipment and archive: ' + '; '.join(problems))
    with locked(workspace):
        value = read_remote(repo)
        marker = Path(workspace) / MARKER
        local = load(marker) if marker.is_file() else None
        if not local or local.get('run_id') != state['run_id'] or local.get('owner_sha256') != identity(session):
            return {'status': 'complete', 'run_id': state['run_id'], 'remote_owner_unchanged': True}
        if not value or value['epoch'] != local['epoch'] or value['owner_sha256'] != identity(session):
            # The accepted canonical closure is already proven. Do not modify another owner's lease.
            write(Path(workspace) / MARKER, {**local, 'status': 'complete', 'completed_at': stamp(now())})
            return {'status': 'complete', 'run_id': state['run_id'], 'remote_owner_unchanged': True}
        complete = {k: v for k, v in value.items() if k != 'commit'}
        complete.update(status='complete', completed_at=stamp(now()),
                        shipment_sha256=next(row['shipment_sha256'] for row in reversed(state['events'])
                            if row.get('kind') == 'finished' and row.get('result') == 'shipped'))
        final = append(repo, complete, value['commit'])
        write(Path(workspace) / MARKER, {**local, **final})
        return {'status': 'complete', 'run_id': state['run_id']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['acquire', 'status', 'release'])
    parser.add_argument('--repo', type=Path, default=checkpoint.REPO)
    parser.add_argument('--workspace', type=Path, default=PRIMARY)
    parser.add_argument('--run-id')
    parser.add_argument('--state', type=Path)
    parser.add_argument('--wait-seconds', type=int, default=0)
    args = parser.parse_args()
    if not 0 <= args.wait_seconds <= 55:
        parser.error('wait at most 55 seconds on the actual ownership condition')
    deadline = time.monotonic() + args.wait_seconds
    while True:
        if args.action == 'acquire':
            if not args.run_id:
                parser.error('acquire requires --run-id')
            result = acquire(args.repo, args.run_id, args.workspace)
        elif args.action == 'release':
            if not args.state:
                parser.error('release requires --state')
            result = release(args.repo, args.state, args.workspace)
        else:
            value = read_remote(args.repo)
            result = value or {'status': 'unowned'}
        if result['status'] != 'busy' or time.monotonic() >= deadline:
            print(json.dumps(result, indent=2))
            return 0
        time.sleep(min(5, deadline - time.monotonic()))


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (checkpoint.CheckpointError, OSError, ValueError, KeyError, TypeError) as exc:
        print('publication ownership: ' + str(exc), file=sys.stderr)
        raise SystemExit(1)
