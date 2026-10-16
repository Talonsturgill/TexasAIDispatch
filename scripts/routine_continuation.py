"""Keep an explicitly armed production routine running through accepted shipment and closure.

The prelaunch Stop hook is inert for ordinary coding sessions and leaf agents. It performs
only local reads in production, approves no tool or permission, and never changes the ledger.
Official protocol: https://code.claude.com/docs/en/hooks#stop-decision-control
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

SCHEMA = 'dispatch_routine_continuation/1'
MARKER = '.claude/dispatch-production-continuation.json'
PROBE = '.claude/dispatch-continuation-probe.json'


def read(path):
    value = json.loads(Path(path).read_text())
    if not isinstance(value, dict):
        raise ValueError('expected a JSON object')
    return value


def location(workspace, value):
    path = Path(value).resolve()
    if not path.is_relative_to(Path(workspace).resolve()):
        raise ValueError('the production path is outside this workspace')
    return path


def arm(workspace, state_path):
    workspace = Path(workspace).resolve()
    state_path = location(workspace, state_path)
    state = read(state_path)
    if (state.get('mode') != 'production' or state.get('terminal_state') is not None
            or not re.fullmatch(r'\d{4}-\d{2}-\d{2}[\w-]*', state.get('run_id', ''))
            or state_path.parts[-3:] != ('out', 'dispatch', 'run_state.json')):
        raise ValueError('arm only the selected unfinished production ledger')
    target = location(workspace, workspace / MARKER)
    target.parent.mkdir(parents=True, exist_ok=True)
    value = {'schema': SCHEMA, 'run_id': state['run_id'], 'state': str(state_path)}
    if target.exists() and read(target) != value:
        raise ValueError('another production ledger is already armed; preserve its continuation')
    target.write_text(json.dumps(value, indent=2) + '\n')
    return value


def git_bytes(repo, ref, path):
    result = subprocess.run(['git', '-C', str(repo), 'show', ref + ':' + path],
                            capture_output=True, timeout=10)
    if result.returncode:
        raise ValueError('the durable closure is not available in the fetched remote')
    return result.stdout


def closure_problems(state, state_path):
    """Use accepted controller state plus byte-identical remote archive and finished checkpoint."""
    if (state.get('terminal_state') != 'shipped' or not state.get('shipment')
            or not any(row.get('kind') == 'finished' and row.get('result') == 'shipped'
                       and row.get('shipment_sha256') for row in state.get('events', []))):
        return ['accepted finish --result shipped is still required']
    repo = state_path.parents[2]
    run_id = state['run_id']
    rel = 'runs/' + run_id + '/run_state.json'
    archive = repo / rel
    published = git_bytes(repo, 'origin/main', rel)
    public = json.loads(published)
    if (not archive.is_file() or archive.read_bytes() != published
            or public.get('terminal_state') != 'shipped' or not public.get('shipment')
            or public.get('run_id') != run_id or public.get('usage') != state.get('usage')):
        return ['the accepted public shipment archive must match origin/main']
    # save() sets this local ref only after the push and remote-tip readback succeed.
    # Single-branch cloud clones do not create origin/claude/checkpoint/* refs.
    manifest = json.loads(git_bytes(repo, 'refs/heads/claude/checkpoint/' + run_id,
                                   'checkpoints/' + run_id + '/manifest.json'))
    if (manifest.get('run_id') != run_id or manifest.get('terminal_state') != 'shipped'
            or manifest.get('shipment_recorded') is not True):
        return ['save and verify the finished durable checkpoint after the archive']
    return []


def decision(payload, workspace):
    if payload.get('hook_event_name') != 'Stop':
        return None
    workspace = Path(workspace).resolve()
    marker = workspace / MARKER
    if not marker.is_file():
        # A harmless one-shot host probe never arms or completes a production ledger.
        probe = workspace / PROBE
        if probe.is_file():
            value = read(probe)
            if value.get('schema') == SCHEMA and value.get('observed') is False:
                value.update(observed=True, hook_event_name='Stop')
                probe.write_text(json.dumps(value, indent=2) + '\n')
                return 'Dispatch continuation probe observed the actual Stop event. Read the probe receipt, then finish this nonproduction test.'
        return None
    try:
        armed = read(marker)
        state_path = location(workspace, armed['state'])
        state = read(state_path)
        if armed.get('schema') != SCHEMA or state.get('run_id') != armed.get('run_id') or state.get('mode') != 'production':
            raise ValueError('the armed production identity changed')
        problems = closure_problems(state, state_path)
        if not problems:
            return None
        reason = '; '.join(problems)
    except (OSError, ValueError, KeyError, TypeError, subprocess.TimeoutExpired):
        reason = 'the selected production ledger or durable closure cannot yet be verified'
    running = [str(row.get('id')) for row in payload.get('background_tasks', [])
               if row.get('status') == 'running' and row.get('id')]
    wait = (' Collect or wait through the actual task tools for running task(s) ' + ', '.join(running) + '.'
            if running else '')
    return ('Texas production remains unfinished: ' + reason + '.' + wait +
            ' Continue the same edition through prompts/claude_routine.md and its versioned recovery.'
            ' Internal repair or capacity needs do not require owner permission. Use a tool to inspect'
            ' the actual state and take the next required action; do not repeat a final waiting message.'
            ' Preserve all failures, charges and gates. Never send email or post socially.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--workspace', type=Path, required=True)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--arm', type=Path, metavar='STATE')
    group.add_argument('--hook', action='store_true')
    group.add_argument('--probe', action='store_true')
    args = parser.parse_args()
    if args.arm:
        arm(args.workspace, args.arm)
        print('Production continuation armed for the selected retained ledger; no capacity or permissions changed.')
    elif args.probe:
        if (args.workspace / MARKER).exists():
            raise ValueError('a probe cannot replace an armed production continuation')
        target = location(args.workspace, args.workspace / PROBE)
        target.parent.mkdir(parents=True, exist_ok=True)
        with target.open('x') as stream:
            json.dump({'schema': SCHEMA, 'observed': False}, stream)
        print('Nonproduction one-shot Stop probe armed; no production ledger created.')
    else:
        reason = decision(json.load(sys.stdin), args.workspace)
        if reason:
            print(json.dumps({'decision': 'block', 'reason': reason}))


if __name__ == '__main__':
    main()
