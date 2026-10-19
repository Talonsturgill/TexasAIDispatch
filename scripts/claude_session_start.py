"""Refresh the owned tools checkout on every cloud start, including cached VM starts.

The environment setup installs this SessionStart hook before Claude launches. The
hook updates source from the same GitHub main, without changing hook registration,
permissions, model, effort, production files or ledger. Paid-work codec guards remain.
"""
import argparse
import fcntl
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

TOOLS = Path('/opt/texas-dispatch-tools')
ORIGIN = 'https://github.com/Talonsturgill/TexasAIDispatch.git'
SCHEMA = 'dispatch_session_start/1'
BOUND_FILES = ('public_state.py', 'claude_checkpoint.py', 'routine_continuation.py',
               'cloud_capture_hook.py', 'capture_guard.py', 'capture_reservation.py',
               'image_read_receipt.py', 'claude_session_start.py', 'visual_observations.py')


def git(tools, *args):
    done = subprocess.run(['git', '-C', str(tools), *args], capture_output=True,
                          text=True, timeout=90)
    if done.returncode:
        # Never echo transport output, which may contain credential-bearing URLs.
        raise ValueError('tools Git operation failed: ' + args[0])
    return done.stdout.strip()


def refresh(tools, workspace, origin=ORIGIN):
    tools, workspace = Path(tools), Path(workspace)
    if tools.is_symlink() or not (tools / '.git').is_dir():
        raise ValueError('expected the real preinstalled tools checkout')
    tools, workspace = tools.resolve(), workspace.resolve()
    if tools.is_relative_to(workspace) or workspace.is_relative_to(tools):
        raise ValueError('tools cache must be outside the production workspace')
    if git(tools, 'remote', 'get-url', 'origin') != origin:
        raise ValueError('the preinstalled tools origin changed')
    # A cache is disposable source, but unknown edits still belong to their owner.
    if git(tools, 'status', '--porcelain', '--untracked-files=normal'):
        raise ValueError('preserve changed tools cache; no checkout was attempted')
    previous = git(tools, 'rev-parse', 'HEAD')
    git(tools, 'fetch', '--quiet', '--depth', '1', 'origin', 'main')
    target = git(tools, 'rev-parse', 'FETCH_HEAD')
    for name in BOUND_FILES:
        git(tools, 'cat-file', '-e', target + ':scripts/' + name)
    git(tools, 'checkout', '--quiet', '--detach', target)
    bindings = {name: hashlib.sha256((tools / 'scripts' / name).read_bytes()).hexdigest()
                for name in BOUND_FILES}
    if git(tools, 'status', '--porcelain', '--untracked-files=normal'):
        raise ValueError('the refreshed tools checkout is not clean')
    from visual_observations import install
    visual_leaves = install(tools, workspace)
    return {'schema': SCHEMA, 'hook_event_name': 'SessionStart', 'ok': True,
            'previous_head': previous, 'head': target, 'workspace': str(workspace),
            'tools': str(tools), 'source_sha256': bindings,
            'permissions_changed': False, 'capture_authorized': False,
            'visual_leaves': visual_leaves}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--workspace', type=Path, required=True)
    args = parser.parse_args()
    if os.environ.get('CLAUDE_CODE_REMOTE') != 'true':
        return 0
    payload = json.load(sys.stdin)
    if payload.get('hook_event_name') != 'SessionStart':
        raise ValueError('expected an actual SessionStart event')
    # This lock serializes cache refresh only; it never locks a producer or a ledger.
    with (TOOLS.parent / '.texas-dispatch-start.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        receipt = refresh(TOOLS, args.workspace)
    directory = args.workspace.resolve() / '.claude'
    directory.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile('w', dir=directory, delete=False) as stream:
        temporary = Path(stream.name)
        json.dump(receipt, stream, indent=2)
        stream.write('\n')
    temporary.replace(directory / 'dispatch-session-start.json')
    print('Dispatch cached tools refreshed at SessionStart to ' + receipt['head'] +
          '. Read .claude/dispatch-session-start.json before production; retain all codec and quality gates.')
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (OSError, ValueError, subprocess.SubprocessError) as exc:
        print('Dispatch SessionStart refresh failed (' + type(exc).__name__ +
              '); preserve the failed evidence and repair startup before paid work.', file=sys.stderr)
        raise SystemExit(1)
