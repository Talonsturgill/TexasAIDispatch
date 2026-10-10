"""The capture protocol at the command boundary, not only in prose.

On 2026-10-10 a builder ran native Remotion stills outside the wrapper, before any render reservation
or headroom check, against scratch placeholder art. Prompt text did not stop it. This is the hook that
does. `.claude/settings.json` registers `hook` as a PreToolUse command for every Bash call, subagents
included. A capture or render command is denied unless `out/dispatch/capture-authorization.json`
carries a current authorization the director issued with `authorize`, which itself requires a charged
reservation not used before, passed native headroom and housekeeping, and genuine authored receipts.
Everything else, including cheap code checks, passes untouched.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
CAPTURE_COMMAND = re.compile(r'remotion\s+(still|render)|ffmpeg\b.*\s-i\s|preflight_animatic|cinema_proof|render_dispatch|opening_compare')
RENDER_RESOURCES = ('preflight_renders', 'full_renders', 'cleanup_renders', 'rescue_renders')
AUTHORIZATION = 'out/dispatch/capture-authorization.json'
LIFETIME = timedelta(minutes=45)


def now():
    return datetime.now(timezone.utc)


def placeholder_art(board):
    """Authored art entries that are not genuine receipts, so a scratch props file is never proof."""
    rows = (board.get('story_art') or {}).get('entries') or []
    return [row.get('request_id') for row in rows
            if str(row.get('sha256')) == 'scratch' or not re.fullmatch(r'[0-9a-f]{64}', str(row.get('sha256', '')))
            or str(row.get('creation_id', '')).startswith('scratch') or str(row.get('created_at')) == 'scratch']


def strip_text_payloads(command):
    """Drop heredoc bodies and commit messages so words inside them are not read as commands."""
    command = re.sub(r"<<-?\s*(['\"]?)(\w+)\1.*?\n\2\b", ' ', command, flags=re.S)
    return re.sub(r"(?:-m|--message)\s+(\"[^\"]*\"|'[^']*')", ' ', command)


def capture_problems(command, packet=None, board=None):
    """Whether a capture or render command may run now."""
    if not CAPTURE_COMMAND.search(strip_text_payloads(command)):
        return []
    errors = []
    capture = (packet or {}).get('capture') or {}
    if capture.get('allowed') is not True:
        errors.append('the packet does not authorize a capture')
    if not (capture.get('render_reservation') or {}).get('event_sha256'):
        errors.append('no charged controller render reservation')
    headroom = capture.get('headroom') or {}
    if headroom.get('passed') is not True or not headroom.get('required_free_gib'):
        errors.append('no computed and passed native headroom check')
    if 'scripts/run_with_env.sh' not in command:
        errors.append('the command is not run through bash scripts/run_with_env.sh')
    if capture.get('art_receipts_recorded') is not True:
        errors.append('genuine authored art receipts are not recorded')
    expires = capture.get('expires_at')
    if capture.get('allowed') is True and (not expires or datetime.fromisoformat(expires) < now()):
        errors.append('the capture authorization has expired')
    if board is not None and placeholder_art(board):
        errors.append('the props carry scratch placeholder art entries')
    return errors


def props_boards(command, cwd):
    boards = []
    for match in re.finditer(r'--props[= ]\s*([^\s\'"]+)', command):
        path = Path(match.group(1))
        path = path if path.is_absolute() else Path(cwd) / path
        try:
            boards.append(json.loads(path.read_text()))
        except (OSError, ValueError):
            continue
    return boards


def decide(payload, project):
    """The hook decision for one tool call. Returns the denial reason or None."""
    if payload.get('tool_name') != 'Bash':
        return None
    command = (payload.get('tool_input') or {}).get('command', '')
    if not CAPTURE_COMMAND.search(strip_text_payloads(command)):
        return None
    packet = {}
    try:
        packet = {'capture': json.loads((Path(project) / AUTHORIZATION).read_text())}
    except (OSError, ValueError):
        pass
    cwd = payload.get('cwd') or project
    errors = capture_problems(command, packet, None)
    for board in props_boards(command, cwd):
        errors += [e for e in capture_problems(command, packet, board) if 'placeholder' in e]
    if errors:
        return ('Capture refused. ' + '; '.join(dict.fromkeys(errors)) + '. Author source and run cheap code checks. '
                'Only the director issues a capture authorization (scripts/capture_guard.py authorize) after a charged render '
                'reservation, passed native headroom and housekeeping, and recorded authored receipts.')
    return None


def hook():
    try:
        payload = json.load(sys.stdin)
    except ValueError:
        return 0
    project = os.environ.get('CLAUDE_PROJECT_DIR') or payload.get('cwd') or os.getcwd()
    try:
        reason = decide(payload, project)
    except Exception as exc:  # a capture command fails closed, every other command is never blocked by a bug here
        command = (payload.get('tool_input') or {}).get('command', '')
        reason = ('Capture refused because the guard could not verify it: ' + str(exc)[:160]) if CAPTURE_COMMAND.search(strip_text_payloads(command)) else None
    if reason:
        print(json.dumps({'hookSpecificOutput': {'hookEventName': 'PreToolUse', 'permissionDecision': 'deny',
                                                 'permissionDecisionReason': reason}}))
    return 0


def event_digest(event):
    return hashlib.sha256(json.dumps(event, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def authorize(root, state_path, board_path, resource=None, housekeeping=True):
    """Issue one capture authorization from facts, never from a flag the caller types."""
    import authored_story_art
    from native_headroom import estimate
    root = Path(root)
    state = json.loads(Path(state_path).read_text())
    board = json.loads(Path(board_path).read_text())
    used_path = root / 'out/dispatch/capture-authorizations-used.json'
    used = json.loads(used_path.read_text()) if used_path.is_file() else []
    candidates = [e for e in state.get('events', []) if e.get('kind') == 'reserved'
                  and any(k in (e.get('resources') or {}) for k in RENDER_RESOURCES)
                  and (resource is None or resource in (e.get('resources') or {}))
                  and event_digest(e) not in {u['event_sha256'] for u in used}]
    if not candidates:
        raise ValueError('no unused charged render reservation in the ledger; reserve the render first')
    reservation = candidates[-1]
    problems = authored_story_art.problems(board, root)
    if problems or placeholder_art(board):
        raise ValueError('genuine authored art receipts are not recorded: ' + '; '.join(problems[:3] or ['placeholder entries']))
    plan = estimate(board)
    free = round(shutil.disk_usage(root).free / (1024 ** 3), 3)
    if free < plan['required_free_gib']:
        raise ValueError('native headroom failed: %s GiB free, %s required' % (free, plan['required_free_gib']))
    if housekeeping:
        docket = root.parent / 'TexasAIDocket'
        done = subprocess.run([sys.executable, str(REPO / 'scripts/dispatch_housekeeping.py'), '--workspace', str(root.parent),
                               '--dispatch-repo', str(root), '--docket-repo', str(docket), '--summary', '--require-headroom',
                               '--min-free-gib', str(plan['required_free_gib'])], capture_output=True, text=True)
        if done.returncode:
            raise ValueError('portable housekeeping --require-headroom failed: ' + done.stdout[-200:])
    issued = now()
    record = {'allowed': True, 'render_reservation': {'event_sha256': event_digest(reservation),
                                                      'resource': next(k for k in RENDER_RESOURCES if k in reservation['resources']),
                                                      'at': reservation['at'], 'note': reservation.get('note', '')[:200]},
              'headroom': {'passed': True, 'required_free_gib': plan['required_free_gib'], 'free_gib': free},
              'housekeeping': {'required_headroom_passed': bool(housekeeping)}, 'art_receipts_recorded': True,
              'board': str(board_path), 'issued_at': issued.isoformat(), 'expires_at': (issued + LIFETIME).isoformat()}
    (root / AUTHORIZATION).write_text(json.dumps(record, indent=2) + '\n')
    used.append({'event_sha256': record['render_reservation']['event_sha256'], 'issued_at': record['issued_at']})
    used_path.write_text(json.dumps(used, indent=2) + '\n')
    return record


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='action', required=True)
    sub.add_parser('hook')
    p = sub.add_parser('authorize')
    p.add_argument('--state', default='out/dispatch/run_state.json')
    p.add_argument('--board', default='out/dispatch/storyboard.json')
    p.add_argument('--resource')
    p.add_argument('--root', default=str(REPO))
    args = parser.parse_args(argv)
    if args.action == 'hook':
        return hook()
    try:
        print(json.dumps(authorize(args.root, args.state, args.board, args.resource), indent=2))
    except (ValueError, OSError) as exc:
        print(json.dumps({'error': str(exc)}), file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    raise SystemExit(main())
