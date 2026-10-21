"""Preinstalled hook for a multi-repository Claude workspace.

Select the checkout from the actual capture command's working directory. The
unchanged capture guard still validates and durably consumes its authorization.
Never register a different hook after the agent has started.
"""
import argparse
import json
from pathlib import Path
import sys

import capture_guard as guard


def checkout(directory, workspace):
    if directory is None:
        raise ValueError('capture working directory is unresolved')
    directory = Path(directory).resolve()
    workspace = Path(workspace).resolve()
    if not directory.is_relative_to(workspace):
        raise ValueError('capture checkout is outside the primary workspace')
    for parent in (directory, *directory.parents):
        if parent == workspace:
            break
        if (parent / 'scripts/capture_guard.py').is_file() and (parent / 'config/claude_runtime.json').is_file():
            return parent
    raise ValueError('capture command has no identifiable Dispatch checkout')


def decision(payload, workspace):
    if payload.get('tool_name') != 'Bash':
        return None
    ownership_error = None
    try:
        from publication_owner import heartbeat_hook
        heartbeat_hook(payload, workspace)
    except Exception:
        # Read-only diagnosis remains possible; an ownership failure cannot skip capture admission.
        ownership_error = 'Publication ownership could not be verified. Inspect publication_owner.py status before another capture.'
    command = (payload.get('tool_input') or {}).get('command', '')
    cwd = payload.get('cwd') or workspace
    # The pinned node tree is shared outside edition workspaces. Deleting a path
    # through its node_modules link caused an interactive host permission stop.
    # Reject that cleanup before permission evaluation; use owned storage recovery.
    if 'node_modules' in command:
        try:
            for tokens, directory in guard.simple_commands(command, cwd):
                if not tokens or Path(tokens[0]).name not in ('rm', 'rmdir'):
                    continue
                for value in tokens[1:]:
                    if value.startswith('-') or 'node_modules' not in value:
                        continue
                    target = (Path(directory or cwd) / value).resolve()
                    if not target.is_relative_to(Path(workspace).resolve()):
                        return ('Shared runtime cleanup refused before host approval: preserve the external '
                                'node cache and use the versioned owned-storage recovery path. '
                                'Recompute native headroom against the current board; keep native PNG and CRF16.')
        except (ValueError, OSError):
            pass  # The unchanged capture guard still handles every capture command.
    if not guard.is_capture(command, cwd):
        return None
    try:
        captures = [(tokens, directory) for tokens, directory in guard.simple_commands(command, cwd)
                    if guard.is_capture(' '.join(tokens), directory)]
        roots = {checkout(directory, workspace) for _, directory in captures}
        if len(roots) != 1:
            raise ValueError('one capture call must use exactly one Dispatch checkout')
        root = roots.pop()
        if ownership_error:
            return ownership_error  # Deny before consuming the unchanged capture authorization.
        from publication_owner import require_owner
        state_path = root / 'out/dispatch/run_state.json'
        if state_path.is_file():
            require_owner(state_path)
        return guard.decide(payload, str(root))
    except Exception as exc:
        return 'Capture refused. Prelaunch workspace guard could not verify the checkout: ' + str(exc)[:200]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--workspace', type=Path, required=True)
    args = parser.parse_args()
    payload = json.load(sys.stdin)
    reason = decision(payload, args.workspace)
    if reason:
        print(json.dumps({'hookSpecificOutput': {'hookEventName': 'PreToolUse',
              'permissionDecision': 'deny', 'permissionDecisionReason': reason}}))


if __name__ == '__main__':
    main()
