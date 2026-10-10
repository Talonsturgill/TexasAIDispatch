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


def bootstrap(workspace, repo=None):
    repo = Path(repo or REPO).resolve()
    workspace = Path(workspace).resolve()
    if workspace == repo or not repo.is_relative_to(workspace):
        raise ValueError('the primary workspace must be an ancestor above the Dispatch checkout')
    # Do not modify tracked settings in this or another repository.
    if any((p / '.git').exists() for p in (workspace, *workspace.parents)):
        raise ValueError('the primary workspace must be outside a Git checkout')
    handler = repo / 'scripts/capture_guard.py'
    if not handler.is_file():
        raise ValueError('the active checkout capture handler is missing')
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
    registration = {'matcher': 'Bash', 'hooks': [{'type': 'command',
                    'command': 'python3 %s hook --repo-root' % shlex.quote(str(handler))}]}
    # Only replace the exact entry this helper previously installed. Foreign entries survive.
    if previous:
        entries[:] = [e for e in entries if e != previous.get('registration')]
    if registration not in entries:
        entries.append(registration)
    directory.mkdir(parents=True, exist_ok=True)
    write_json(target, current)
    write_json(record, {'schema': SCHEMA, 'repo': str(repo), 'registration': registration})
    return {'ok': True, 'workspace': str(workspace), 'active_checkout': str(repo),
            'capture_handler': str(handler), 'capture_authorized': False,
            'live_hook_observed': False}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--workspace', type=Path, required=True)
    args = parser.parse_args(argv)
    try:
        print(json.dumps(bootstrap(args.workspace)))
    except (OSError, ValueError, TypeError) as exc:
        print(json.dumps({'ok': False, 'error': str(exc)}))
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
