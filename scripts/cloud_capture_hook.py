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
    command = (payload.get('tool_input') or {}).get('command', '')
    cwd = payload.get('cwd') or workspace
    if not guard.is_capture(command, cwd):
        return None
    try:
        captures = [(tokens, directory) for tokens, directory in guard.simple_commands(command, cwd)
                    if guard.is_capture(' '.join(tokens), directory)]
        roots = {checkout(directory, workspace) for _, directory in captures}
        if len(roots) != 1:
            raise ValueError('one capture call must use exactly one Dispatch checkout')
        return guard.decide(payload, str(roots.pop()))
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
