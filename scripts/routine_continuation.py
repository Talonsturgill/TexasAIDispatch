"""Keep an explicitly armed production routine running through accepted shipment and closure.

The prelaunch Stop hook is inert for ordinary coding sessions and leaf agents. It performs
only local reads in production, approves no tool or permission, and never changes the ledger.
Official protocol: https://code.claude.com/docs/en/hooks#stop-decision-control
"""
import argparse
import json
import re
import shlex
import os
import subprocess
import sys
import time
from pathlib import Path

SCHEMA = 'dispatch_routine_continuation/1'
MARKER = '.claude/dispatch-production-continuation.json'
PROBE = '.claude/dispatch-continuation-probe.json'
REBIND = '.claude/dispatch-production-continuation-rebind.json'
BACKGROUND_WAIT_SECONDS = 60


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


def registered_workspace(workspace, state_path=None):
    """Use the primary workspace actually watched by the prelaunch Stop hook."""
    requested = Path(workspace).resolve()
    if state_path is not None:
        location(requested, state_path)
    for candidate in (requested, *requested.parents):
        record = candidate / '.claude/dispatch-capture-registration.json'
        if not record.is_file():
            continue
        saved = read(record)
        registration = saved.get('stop_registration')
        settings = read(candidate / '.claude/settings.json')
        if (saved.get('schema') != 'dispatch_capture_hook_registration/1'
                or not registration or registration not in settings.get('hooks', {}).get('Stop', [])):
            raise ValueError('the recorded primary Stop hook is not installed')
        hooks = registration.get('hooks', [])
        tokens = shlex.split(hooks[0].get('command', '')) if len(hooks) == 1 else []
        if (len(tokens) != 5 or tokens[0] != 'python3'
                or Path(tokens[1]).name != 'routine_continuation.py'
                or tokens[2:] != ['--workspace', str(candidate), '--hook']):
            raise ValueError('the primary Stop hook workspace cannot be verified')
        return candidate
    if os.environ.get('CLAUDE_CODE_REMOTE') == 'true':
        raise ValueError('no installed primary Stop hook was found; do not arm an unwatched folder')
    return requested


def restored_rebind(workspace, previous, state_path, state):
    """Retarget a missing restore only after verifying its retained ledger lineage."""
    from claude_checkpoint import monotonic_problems, restored_ledger, sha256
    if previous.get('schema') != SCHEMA or previous.get('run_id') != state['run_id']:
        raise ValueError('another production ledger is already armed; preserve its continuation')
    old_path = location(workspace, previous['state'])
    if old_path.exists():
        raise ValueError('the earlier armed ledger still exists; preserve its continuation')
    host = read(state_path.with_name('claude-host.json'))
    checkpoint = str(host.get('restored_from', ''))
    if host.get('run_id') != state['run_id'] or not re.fullmatch(r'[0-9a-f]{40}', checkpoint):
        raise ValueError('a missing armed ledger needs a verified checkpoint restoration')
    repo = state_path.parents[2]
    base = 'checkpoints/' + state['run_id']
    manifest = json.loads(git_bytes(repo, checkpoint, base + '/manifest.json'))
    original = git_bytes(repo, checkpoint, base + '/run_state.json')
    if (manifest.get('schema') != 'dispatch_claude_checkpoint/2'
            or manifest.get('run_id') != state['run_id']
            or manifest.get('terminal_state') == 'shipped'
            or manifest.get('ledger_sha256') != sha256(original)):
        raise ValueError('the restored checkpoint identity or ledger digest changed')
    retained = restored_ledger(json.loads(original), repo, manifest)
    if not retained.get('resource_envelope') or monotonic_problems(retained, state):
        raise ValueError('restored continuation must preserve the frozen envelope and cumulative history')
    return {'previous_marker': previous, 'state': str(state_path),
            'restored_from': checkpoint, 'ledger_sha256': manifest['ledger_sha256']}


def arm(workspace, state_path):
    workspace = registered_workspace(workspace, state_path)
    state_path = location(workspace, state_path)
    state = read(state_path)
    from publication_owner import require_owner
    require_owner(state_path, state)
    if (state.get('mode') != 'production' or state.get('terminal_state') is not None
            or not re.fullmatch(r'\d{4}-\d{2}-\d{2}[\w-]*', state.get('run_id', ''))
            or state_path.parts[-3:] != ('out', 'dispatch', 'run_state.json')):
        raise ValueError('arm only the selected unfinished production ledger')
    target = location(workspace, workspace / MARKER)
    target.parent.mkdir(parents=True, exist_ok=True)
    value = {'schema': SCHEMA, 'run_id': state['run_id'], 'state': str(state_path)}
    from bootstrap_claude_hooks import write_json
    if target.exists() and read(target) != value:
        proof = restored_rebind(workspace, read(target), state_path, state)
        audit = location(workspace, workspace / REBIND)
        history = read(audit) if audit.exists() else {'schema': SCHEMA, 'rebindings': []}
        if history.get('schema') != SCHEMA or not isinstance(history.get('rebindings'), list):
            raise ValueError('the continuation rebind history is invalid')
        write_json(audit, {**history, 'rebindings': history['rebindings'] + [proof]})
    write_json(target, value)
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


def capacity_recovery_hint(state):
    """Name the existing recovery route without granting or reserving anything."""
    usage = state.get('usage')
    used = usage.get('storyboard_critics') if isinstance(usage, dict) else None
    ceilings = [row.get('storyboard_critics') for row in
                (state.get('limits'), state.get('escalation_ceiling')) if isinstance(row, dict)]
    ceilings = [value for value in ceilings if type(value) is int and value >= 0]
    if type(used) is not int or not ceilings or used < max(ceilings):
        return ''
    return (' Critic capacity is exhausted. Before another substantive review, read the'
            ' finish-current section of knowledge/craft/AUTONOMOUS_COMPLETION.md.'
            ' Prepare a capacity-only finish-current plan with changed_inputs:[] bound to'
            ' the actual retained independent passing report, then run production-budget'
            ' and completion-capacity through the runtime wrapper. Verify current bindings'
            ' when using phone evidence. Preserve every separate grant and charge.'
            ' If two narration repairs failed, precharge the required Opus recurrence-pivot'
            ' review before a third repair; capacity never approves that repair.'
            ' After its real handback, recheck and fund the complete remaining path before'
            ' changing production inputs. Retain a literal refusal and repair its specific'
            ' cause; repeating the same owner-wait message is not a recovery action.'
            ' For the actual legacy public-visual task refusal, use the bounded corrected-prompt'
            ' procedure in prompts/phases/repair.md. Never declare a safeguard refusal an outage'
            ' or retry an already spent PASS voucher.')


def decision(payload, workspace):
    if payload.get('hook_event_name') != 'Stop':
        return None
    workspace = Path(workspace).resolve()
    from publication_owner import heartbeat_hook, waiting_reason
    waiting = waiting_reason(payload, workspace)
    if waiting:
        return waiting
    ownership_error = None
    try:
        heartbeat_hook(payload, workspace)
    except Exception:
        ownership_error = 'publication ownership needs source-backed recovery before another paid attempt'
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
    state = None
    try:
        armed = read(marker)
        state_path = location(workspace, armed['state'])
        state = read(state_path)
        if armed.get('schema') != SCHEMA or state.get('run_id') != armed.get('run_id') or state.get('mode') != 'production':
            raise ValueError('the armed production identity changed')
        problems = closure_problems(state, state_path)
        if not problems:
            from publication_owner import enabled, release
            if enabled():
                release(state_path.parents[2], state_path, workspace, session=payload.get('session_id'))
            return None
        reason = '; '.join(problems + ([ownership_error] if ownership_error else []))
    except (OSError, ValueError, KeyError, TypeError, subprocess.TimeoutExpired, RuntimeError):
        reason = 'the selected production ledger or durable closure cannot yet be verified'
    running = [str(row.get('id')) for row in payload.get('background_tasks', [])
               if row.get('status') == 'running' and row.get('id')]
    wait = (' Collect or block through the actual task tools for running task(s) ' + ', '.join(running) + '.'
            ' When TaskOutput is available, load its schema and request a blocking wait on that exact ID'
            ' for up to sixty seconds. Do not poll transcript sizes or launch another monitor.'
            if running else '')
    recovery = capacity_recovery_hint(state) if state is not None and not running else ''
    return ('Texas production remains unfinished: ' + reason + '.' + wait +
            recovery +
            ' Continue the same edition through prompts/claude_routine.md and its versioned recovery.'
            ' Internal repair or capacity needs do not require owner permission. Use a tool to inspect'
            ' the actual state and take the next required action; do not repeat a final waiting message.'
            ' Preserve all failures, charges and gates. Never send email or post socially.')


def response(payload, workspace, pause=None):
    """Bound repeated waiting feedback without allowing an unfinished production to stop."""
    reason = decision(payload, workspace)
    if reason is None:
        return None
    from publication_owner import waiting_reason
    if (payload.get('stop_hook_active') is True
            and ((Path(workspace) / MARKER).is_file() or waiting_reason(payload, workspace))):
        (pause or time.sleep)(BACKGROUND_WAIT_SECONDS)
        # Back off an unchanged final/wait loop even when no worker is running.
        # A real writer may have completed the accepted archive during the wait.
        # Recheck the same closure; never turn a running-task flag into permission to finish.
        reason = decision(payload, workspace)
        if reason is None:
            return None
    return {'decision': 'block', 'reason': reason}


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
        watched = registered_workspace(args.workspace, args.arm)
        print('Production continuation armed at ' + str(watched / MARKER) +
              ' for the selected retained ledger; no capacity or permissions changed.')
    elif args.probe:
        args.workspace = registered_workspace(args.workspace)
        if (args.workspace / MARKER).exists():
            raise ValueError('a probe cannot replace an armed production continuation')
        target = location(args.workspace, args.workspace / PROBE)
        target.parent.mkdir(parents=True, exist_ok=True)
        with target.open('x') as stream:
            json.dump({'schema': SCHEMA, 'observed': False}, stream)
        print('Nonproduction one-shot Stop probe armed; no production ledger created.')
    else:
        result = response(json.load(sys.stdin), args.workspace)
        if result is not None:
            print(json.dumps(result))


if __name__ == '__main__':
    main()
