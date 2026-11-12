"""Revalidate one unused prepared capture without charging or changing its inputs.

Preparation may checkpoint enough Git objects to cross a storage-cost bucket.
Keep the existing guard and proof closure unchanged: this explicit recovery checks
the same exact command, charge, source bytes and current publication lease, then
renews only its measured headroom and bounded expiry. It cannot replay a dispatch.
"""
from pathlib import Path
import argparse
import copy
import fcntl
import hashlib
import json
import os
import tempfile

import capture_guard as guard
import capture_reservation as prepared
import run_controller as controller

REPO = Path(__file__).resolve().parents[1]


def require(value, message):
    if not value:
        raise ValueError(message)


def read(path):
    return json.loads(Path(path).read_text())


def owned(root, path):
    path = Path(path)
    if not path.is_absolute():
        path = root / path
    require(not any(p.is_symlink() for p in (path, *path.parents))
            and path.resolve().is_relative_to(root), 'capture revalidation paths must remain owned and nonsymlinked')
    return path.resolve()


def atomic_bytes(path, data):
    """Replace locally and fsync; never touch the ledger or used-reservation log."""
    fd, name = tempfile.mkstemp(prefix=path.name + '.', dir=path.parent)
    try:
        with os.fdopen(fd, 'wb') as handle:
            handle.write(data); handle.flush(); os.fsync(handle.fileno())
        os.replace(name, path)
        directory = os.open(path.parent, os.O_RDONLY)
        try:
            os.fsync(directory)
        finally:
            os.close(directory)
    finally:
        Path(name).unlink(missing_ok=True)


def identity(root, state_path, auth, used):
    """Validate issuance and the paid operation, without reserving or claiming it."""
    import publication_owner
    state = controller.read_state(state_path)
    require(not state.get('terminal_state'), 'cannot revalidate a terminal edition')
    commands = auth.get('commands') or []
    require(auth.get('schema') == guard.SCHEMA and auth.get('allowed') is True
            and len(commands) == 1 and commands[0].get('consumed') is False,
            'only one existing unused authorized command can be revalidated')
    command = commands[0]['text']
    require(command == guard.normalize(command) and commands[0]['id'] == hashlib.sha256(command.encode()).hexdigest(),
            'authorized command identity changed')
    note = prepared.operation_for([command], root); resource = prepared.resource_for(note)
    receipt = auth.get('prepared_capture') or {}; paid = auth.get('render_reservation') or {}
    require(receipt.get('schema') == 'dispatch_prepared_capture/1'
            and receipt.get('operation') == note and receipt.get('resource') == resource
            and receipt.get('run_id') == state.get('run_id') and paid.get('resource') == resource
            and receipt.get('event_sha256') == paid.get('event_sha256'),
            'prepared operation, edition or reservation differs')
    event_sha = receipt['event_sha256']
    events = [e for e in state['events'] if guard.event_digest(e) == event_sha]
    require(len(events) == 1, 'retain exactly one original charged capture event')
    event = events[0]; field = 'full_render_identity' if note == prepared.FULL_OPERATION else 'preflight_identity'
    require(event.get('kind') == 'reserved' and event.get('resources') == {resource: 1}
            and event.get('note') == note and paid.get('note') == note and paid.get('at') == event.get('at')
            and event.get(field) == receipt.get('input_identity')
            and (note == prepared.FULL_OPERATION or event.get('preflight_identity_version') == 3),
            'original charged operator identity changed')
    require(not any(e.get('kind') == 'prepared_capture_claimed' and e.get('event_sha256') == event_sha
                    for e in state['events']), 'the prepared capture was already claimed')
    issuances = [entry for entry in used if entry.get('event_sha256') == event_sha]
    require(len(issuances) == 1 and issuances[0].get('issued_at') == auth.get('issued_at'),
            'retain the one original used-reservation issuance; revalidation cannot mint one')
    owner = publication_owner.require_owner(state_path, state)
    if event.get('publication_owner_sha256') or event.get('publication_epoch') or owner is not None:
        require(owner is not None and event.get('publication_owner_sha256') == owner.get('owner_sha256')
                and event.get('publication_epoch') == owner.get('epoch'),
                'current publication lease does not own this charged capture')
    require(receipt['input_identity'] == prepared.input_identity(state_path, note, version=3),
            'prepared capture inputs changed')
    housekeeping = auth.get('housekeeping') or {}
    kept = owned(root, housekeeping['receipt'])
    require(kept.is_file() and guard.sha(kept) == housekeeping.get('receipt_sha256')
            and housekeeping.get('exit_code') == 0, 'original successful housekeeping receipt changed')
    for board in auth.get('boards') or []:
        owned(root, board['path'])
    require(auth.get('headroom', {}).get('storage_profile') is not None,
            'only an existing verified operation storage profile can be revalidated')
    return command


def candidate(root, auth, command, previous_sha):
    """Recompute actual costs, never substitute source bindings or lower a gate."""
    from bounded_capture import plan
    boards = [(owned(root, row['path']), read(owned(root, row['path']))) for row in auth['boards']]
    profile = plan(root, [command], boards)
    require(profile is not None and profile['bindings'] == auth.get('bound', {}).get('capture_storage'),
            'capture source or proof bindings changed; unused refresh cannot migrate source')
    free_bytes = guard.shutil.disk_usage(root).free
    require(free_bytes >= profile['required_free_gib'] * 1024**3, 'current native headroom is below the recomputed operation requirement')
    result = copy.deepcopy(auth); moment = guard.now()
    result['headroom'] = {'passed': True, 'required_free_gib': profile['required_free_gib'],
                          'free_gib': round(free_bytes / 1024**3, 3), 'storage_profile': profile}
    result['expires_at'] = (moment + guard.LIFETIME).isoformat()
    result['revalidation'] = {'schema': 'dispatch_unused_capture_revalidation/1', 'at': moment.isoformat(),
        'previous_authorization_sha256': previous_sha, 'previous_expires_at': auth['expires_at'],
        'same_charge': auth['prepared_capture']['event_sha256']}
    errors = guard.capture_problems(command, result, str(root), root)
    require(not errors, '; '.join(errors))
    return result


def remote_identity(root, state_path, auth):
    """Do not overwrite a newer saved consumption or change its exact unused command."""
    import claude_checkpoint as checkpoint
    require(checkpoint.required(state_path), 'unused refresh requires the original durable checkpoint authorization')
    state = read(state_path); tip = checkpoint.remote_tip(root, state['run_id'], 'origin')
    require(tip, 'no durable checkpoint is available for unused capture revalidation')
    prefix = 'checkpoints/' + state['run_id'] + '/files/'
    old_files = {}
    for name in (guard.AUTHORIZATION, guard.USED):
        raw = checkpoint.show(root, tip, prefix + name)
        if raw:
            old_files[name] = raw
    new_files = {name: (root / name).read_bytes() for name in (guard.AUTHORIZATION, guard.USED)}
    errors = checkpoint.authorization_problems(old_files, new_files)
    require(not errors, '; '.join(errors))
    old = json.loads(old_files[guard.AUTHORIZATION]) if guard.AUTHORIZATION in old_files else {}
    require(old.get('render_reservation', {}).get('event_sha256') == auth['prepared_capture']['event_sha256'],
            'checkpoint does not retain this original unused authorization; save it through the supported checkpoint workflow first')
    if old:
        fields = ('schema', 'allowed', 'commands', 'boards', 'bound', 'prepared_capture', 'render_reservation',
                  'issued_at', 'art_receipts_recorded', 'housekeeping')
        require(all(old.get(key) == auth.get(key) for key in fields),
                'the exact saved unused authorization identity changed')


def refresh(root=REPO, state_path=None):
    """Serialize with issuance/consumption, fence remote replay, and preserve failure bytes."""
    import claude_checkpoint as checkpoint
    root = Path(root).resolve()
    state_path = owned(root, state_path or 'out/dispatch/run_state.json')
    require(state_path == root / 'out/dispatch/run_state.json', 'revalidation requires the canonical controller ledger')
    auth_path = owned(root, guard.AUTHORIZATION); used_path = owned(root, guard.USED)
    lock_path = owned(root, str(auth_path) + '.lock')
    with lock_path.open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        original, state_bytes, used_bytes = auth_path.read_bytes(), state_path.read_bytes(), used_path.read_bytes()
        auth = json.loads(original); used = json.loads(used_bytes)
        command = identity(root, state_path, auth, used)
        previous_sha = hashlib.sha256(original).hexdigest()
        # First validate all non-expiry/non-cost bindings before any checkpoint.
        candidate(root, auth, command, previous_sha)
        checkpoint.require_backed(state_path)
        remote_identity(root, state_path, auth)
        # Existing monotonic checks refuse remote-consumed/local-unused replay. Any
        # fetch/checkpoint growth occurs BEFORE the final cost measurement below.
        checkpoint.mirror(state_path, 'before unused capture authorization revalidation')
        require((auth_path.read_bytes(), state_path.read_bytes(), used_path.read_bytes()) ==
                (original, state_bytes, used_bytes), 'capture inputs changed during checkpoint verification')
        identity(root, state_path, auth, used)
        result = candidate(root, auth, command, previous_sha)
        history = owned(root, guard.HISTORY); history.mkdir(exist_ok=True)
        kept = owned(root, history / (previous_sha + '.json'))
        if kept.exists():
            require(kept.read_bytes() == original, 'retained authorization history changed')
        else:
            atomic_bytes(kept, original)
        try:
            # Tiny history/auth additions can also cross the checkpoint-candidate
            # bucket. Stabilize locally under the lock, without another checkpoint.
            for _ in range(3):
                atomic_bytes(auth_path, (json.dumps(result, indent=2) + '\n').encode())
                current = candidate(root, auth, command, previous_sha)
                if current['headroom']['storage_profile'] == result['headroom']['storage_profile']:
                    require(state_path.read_bytes() == state_bytes and used_path.read_bytes() == used_bytes,
                            'controller or issuance changed during revalidation')
                    return result
                result = current
            raise ValueError('storage costs did not stabilize; preserve the unused authorization and recheck capacity')
        except BaseException:
            atomic_bytes(auth_path, original)
            raise
    # The unmodified hook checkpoints consumption before allowing execution. A
    # restart before consumption may safely refresh the still-unused saved auth.


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state', default='out/dispatch/run_state.json')
    args = parser.parse_args(argv)
    try:
        result = refresh(REPO, args.state)
        print(json.dumps({'revalidated': True, 'new_charge': False,
            'event_sha256': result['prepared_capture']['event_sha256'],
            'command': result['commands'][0]['text'], 'expires_at': result['expires_at'],
            'required_free_gib': result['headroom']['required_free_gib']}, indent=2))
        return 0
    except (OSError, ValueError, KeyError, TypeError, RuntimeError) as exc:
        print(json.dumps({'revalidated': False, 'error': str(exc)}))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
