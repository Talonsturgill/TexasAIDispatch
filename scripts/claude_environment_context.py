"""Describe the selected Dispatch workspace to auto mode, preserving every permission rule."""
from __future__ import annotations

import argparse
import copy
import json
import os
from pathlib import Path
import subprocess
import tempfile

REPO = Path(__file__).resolve().parents[1]
REMOTE = 'https://github.com/Talonsturgill/TexasAIDispatch'


def entries(workspace):
    return [
        'Primary use of Claude Code: source-backed Texas AI Dispatch video production, independent '
        'review, durable checkpointing and verified unsent draft preparation. Email and social sending '
        'remain prohibited.',
        'Trusted repo: ' + REMOTE + '. The cloud session starts in ' + str(Path(workspace).resolve()) +
        ', above the selected checkout. A restored worktree belongs to this selected repository only '
        'when its configured Git remote matches this exact owner and repository.',
        'Data retention: out/dispatch in that verified checkout is the routine-owned edition scratch '
        'tree. It contains authored inputs, media, original reviewer failures, cumulative resource '
        'ledgers and receipts. scripts/claude_checkpoint.py validates and mirrors public-safe evidence '
        'to this repository. checkpoint-unbacked.json is an application durability status marker: '
        'recover saves validated evidence before clearing it. It is not a Claude permission control. '
        'Some render-cache artifacts are duplicate producer copies; relocation requires a matching '
        'canonical SHA256 and byte count while retaining unique and failed evidence. '
        'Canonical and failed evidence, original charges and frozen envelopes remain retained.',
        'Render admission: scripts/capture_guard.py authorize --prepare checks the edition ledger, '
        'exact input hashes, native headroom and housekeeping before charging one supported capture '
        'and writing out/dispatch/capture-authorization.json. Its exact command is usable once; '
        'out/dispatch/capture-authorizations-used.json retains consumption. These are application '
        'production records. The command does not edit Claude settings, permission rules or hooks, '
        'and it grants no generic Bash access. cinema_proof.py renders native evidence using that '
        'exact prepaid record after the capture hook consumes it. Host approval checks still apply.',
        'Application workload budgets: scripts/run_controller.py completion-capacity validates the '
        'pinned owner completion policy, retained independent evidence and complete remaining-path '
        'deficits before appending an allowance event to out/dispatch/run_state.json. It retains '
        'the original frozen envelope, cumulative usage and every earlier grant. It changes only '
        'this edition application ledger, not Claude permissions, account spending, billing limits '
        'or service access. scripts/completion_forecast.py only prepares hash-bound evidence for '
        'a previously omitted two-treatment capture forecast; it grants no capacity itself. '
        'The controller records any exact missing capacity separately under the pinned policy. '
        'Each actual retry is separately charged before execution.',
        'Secrets management: credentials stay in the existing cloud bindings and external runtime. '
        'Never print or publish credentials, private routing, Gmail identifiers or private delivery '
        'receipts. This context adds no service, credential, permission exception or sending authority.'
    ]


def augmented(current, workspace):
    if not isinstance(current, dict):
        raise ValueError('user settings must be a JSON object')
    result = copy.deepcopy(current)
    auto = result.setdefault('autoMode', {})
    if not isinstance(auto, dict):
        raise ValueError('existing autoMode settings must be an object')
    environment = auto.setdefault('environment', ['$defaults'])
    if not isinstance(environment, list) or not all(isinstance(row, str) for row in environment):
        raise ValueError('existing autoMode environment must be an array of strings')
    for row in entries(workspace):
        if row not in environment:
            environment.append(row)
    return result


def controls(settings):
    result = copy.deepcopy(settings)
    if isinstance(result.get('autoMode'), dict):
        result['autoMode'].pop('environment', None)
        if not result['autoMode']:
            result.pop('autoMode')
    return result


def configure(settings_path, workspace, repo=REPO, apply=False):
    repo = Path(repo).resolve()
    remote = subprocess.check_output(['git', '-C', str(repo), 'remote', 'get-url', 'origin'], text=True).strip()
    if remote.removesuffix('.git') not in (REMOTE, 'git@github.com:Talonsturgill/TexasAIDispatch'):
        raise ValueError('context requires the selected Dispatch remote')
    target = Path(settings_path).expanduser()
    if target.is_symlink() or target.parent.is_symlink():
        raise ValueError('user settings cannot be a symbolic link')
    target = target.resolve()
    if any((parent / '.git').exists() for parent in target.parents):
        raise ValueError('auto-mode context belongs in user settings outside a Git checkout')
    before = target.read_bytes() if target.exists() else None
    current = json.loads(before) if before is not None else {}
    updated = augmented(current, workspace)
    if controls(current) != controls(updated):
        raise ValueError('permission or unrelated settings changed')
    changed = current != updated
    if apply and changed:
        target.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        with tempfile.NamedTemporaryFile(mode='w', dir=target.parent, delete=False) as stream:
            temporary = Path(stream.name)
            try:
                stream.write(json.dumps(updated, indent=2) + '\n')
                stream.flush(); os.fsync(stream.fileno())
                if (target.read_bytes() if target.exists() else None) != before:
                    raise ValueError('user settings changed concurrently')
                if target.exists():
                    temporary.chmod(target.stat().st_mode & 0o777)
                temporary.replace(target)
            finally:
                temporary.unlink(missing_ok=True)
    return {'schema': 'dispatch_claude_environment_context/1', 'settings_path': str(target),
            'applied': bool(apply and changed), 'changed': changed, 'controls_unchanged': True,
            'environment_entries': entries(workspace)}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--workspace', type=Path, required=True)
    parser.add_argument('--settings', type=Path, default=Path(os.environ.get('CLAUDE_CONFIG_DIR') or Path.home() / '.claude') / 'settings.json')
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args(argv)
    try:
        print(json.dumps(configure(args.settings, args.workspace, apply=args.apply)))
    except (OSError, ValueError, subprocess.CalledProcessError):
        # Invalid settings and remote URLs may contain private values; do not echo them.
        print(json.dumps({'ok': False, 'error': 'Dispatch environment context was not applied; inspect the configured user-settings shape and selected remote.'}))
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
