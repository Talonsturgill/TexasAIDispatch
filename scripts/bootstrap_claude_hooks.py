"""Register the Dispatch capture hook at the cloud session's primary workspace.

Multi-repository sessions start above the repository checkouts. Only hook registration is
merged; model, effort, environment, permissions and unrelated hooks are preserved. Run again
from the restored production checkout so the handler uses that checkout's ledger and inputs.
This does not authorize a capture or simulate a host event.
"""
from __future__ import annotations

import argparse
import json
import os
import shlex
import tempfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SCHEMA = 'dispatch_capture_hook_registration/1'


def write_json(path, data):
    with tempfile.NamedTemporaryFile(mode='w', dir=path.parent, delete=False) as stream:
        temporary = Path(stream.name)
        try:
            stream.write(json.dumps(data, indent=2) + '\n')
            stream.flush()
            os.fsync(stream.fileno())
            if path.exists():
                os.chmod(temporary, path.stat().st_mode & 0o777)
            temporary.replace(path)
        finally:
            temporary.unlink(missing_ok=True)


def bootstrap(workspace, repo=None, prelaunch_router=False):
    repo = Path(repo or REPO).resolve()
    workspace = Path(workspace).resolve()
    if not prelaunch_router and (workspace == repo or not repo.is_relative_to(workspace)):
        raise ValueError('the primary workspace must be an ancestor above the Dispatch checkout')
    # Do not modify tracked settings in this or another repository.
    if any((p / '.git').exists() for p in (workspace, *workspace.parents)):
        raise ValueError('the primary workspace must be outside a Git checkout')
    handler = repo / ('scripts/cloud_capture_hook.py' if prelaunch_router else 'scripts/capture_guard.py')
    if not handler.is_file():
        raise ValueError('the active checkout capture handler is missing')
    stop_handler = repo / 'scripts/routine_continuation.py'
    if prelaunch_router and not stop_handler.is_file():
        raise ValueError('the production continuation handler is missing')
    image_handler = repo / 'scripts/image_read_receipt.py'
    if prelaunch_router and not image_handler.is_file():
        raise ValueError('the image tool-delivery observer is missing')
    start_handler = repo / 'scripts/claude_session_start.py'
    if prelaunch_router and not start_handler.is_file():
        raise ValueError('the per-session cached-tools refresh is missing')
    directory = workspace / '.claude'
    target = directory / 'settings.json'
    record = directory / 'dispatch-capture-registration.json'
    if any(not p.resolve().is_relative_to(workspace) for p in (directory, target, record)):
        raise ValueError('the primary settings paths must stay inside the primary workspace')
    current = json.loads(target.read_text()) if target.exists() else {}
    if not isinstance(current, dict):
        raise ValueError('primary settings must be a JSON object')
    hooks = current.setdefault('hooks', {})
    if not isinstance(hooks, dict):
        raise ValueError('existing hooks must be a JSON object')
    entries = hooks.setdefault('PreToolUse', [])
    if not isinstance(entries, list):
        raise ValueError('existing PreToolUse entries must be an array')
    previous = json.loads(record.read_text()) if record.exists() else None
    if previous is not None and (not isinstance(previous, dict) or previous.get('schema') != SCHEMA
                                 or not isinstance(previous.get('registration'), dict)):
        raise ValueError('the previous Dispatch registration has an unknown schema')
    command = ('python3 %s --workspace %s' % (shlex.quote(str(handler)), shlex.quote(str(workspace)))
               if prelaunch_router else 'python3 %s hook --repo-root' % shlex.quote(str(handler)))
    registration = {'matcher': 'Bash', 'hooks': [{'type': 'command', 'command': command}]}
    # Only replace the exact entry this helper previously installed. Foreign entries survive.
    if previous:
        entries[:] = [e for e in entries if e != previous.get('registration')]
    if registration not in entries:
        entries.append(registration)
    stop_registration = previous.get('stop_registration') if previous else None
    image_registration = previous.get('image_registration') if previous else None
    start_registration = previous.get('start_registration') if previous else None
    if prelaunch_router:
        stops = hooks.setdefault('Stop', [])
        if not isinstance(stops, list):
            raise ValueError('existing Stop entries must be an array')
        if stop_registration:
            stops[:] = [entry for entry in stops if entry != stop_registration]
        stop_registration = {'hooks': [{'type': 'command', 'command':
            'python3 %s --workspace %s --hook' % (shlex.quote(str(stop_handler)), shlex.quote(str(workspace)))}]}
        if stop_registration not in stops:
            stops.append(stop_registration)
        images = hooks.setdefault('PostToolUse', [])
        if not isinstance(images, list):
            raise ValueError('existing PostToolUse entries must be an array')
        if image_registration:
            images[:] = [entry for entry in images if entry != image_registration]
        image_registration = {'matcher': 'Read', 'hooks': [{'type': 'command', 'command':
            'python3 %s --workspace %s' % (shlex.quote(str(image_handler)), shlex.quote(str(workspace)))}]}
        if image_registration not in images:
            images.append(image_registration)
        # Added only by prelaunch setup. Cached environments retain this command,
        # which refreshes its owned source at every actual start or resume.
        if start_handler.is_file():
            starts = hooks.setdefault('SessionStart', [])
            if not isinstance(starts, list):
                raise ValueError('existing SessionStart entries must be an array')
            if start_registration:
                starts[:] = [entry for entry in starts if entry != start_registration]
            start_registration = {'matcher': 'startup|resume', 'hooks': [{'type': 'command',
                'timeout': 240, 'command': 'python3 %s --workspace %s' %
                (shlex.quote(str(start_handler)), shlex.quote(str(workspace)))}]}
            if start_registration not in starts:
                starts.append(start_registration)
    directory.mkdir(parents=True, exist_ok=True)
    write_json(target, current)
    saved = {'schema': SCHEMA, 'repo': str(repo), 'registration': registration}
    if stop_registration:
        saved['stop_registration'] = stop_registration
    if image_registration:
        saved['image_registration'] = image_registration
    if start_registration:
        saved['start_registration'] = start_registration
    write_json(record, saved)
    return {'ok': True, 'workspace': str(workspace), 'active_checkout': str(repo),
            'capture_handler': str(handler), 'capture_authorized': False,
            'live_hook_observed': False}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--workspace', type=Path, required=True)
    parser.add_argument('--prelaunch-router', action='store_true', help='environment setup only, before Claude launches')
    args = parser.parse_args(argv)
    try:
        print(json.dumps(bootstrap(args.workspace, prelaunch_router=args.prelaunch_router)))
    except (OSError, ValueError, TypeError) as exc:
        print(json.dumps({'ok': False, 'error': str(exc)}))
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
