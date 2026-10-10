"""The capture protocol at the command boundary, not only in prose.

On 2026-10-10 a builder ran native Remotion stills outside the wrapper, before any render reservation
or headroom check, against scratch placeholder art. Prompt text did not stop it. This is the hook that
does. `.claude/settings.json` registers `hook` as a PreToolUse command for every Bash call, subagents
included. A capture or render command is denied unless `out/dispatch/capture-authorization.json` holds a
current authorization the director issued with `authorize`, and the authorization is narrow:

- bound to the exact board files (path and sha256), the renderer inputs the boards name, and the
  authored art modules, all rechecked against the files at the moment of the command;
- bound to the exact capture commands it lists, each usable once, consumed durably by the hook before the
  command is allowed, so a second identical capture needs a new authorization;
- issued only from a fresh charged render reservation that no earlier authorization used and that is not a
  late-accounting charge, after passed native headroom and a portable housekeeping run whose receipt is kept;
- rechecked for current disk headroom at the command, and denied when any --props or --board input is
  unreadable, unresolved (a shell variable, a command substitution) or not one of the authorized boards,
  or when a props board carries scratch placeholder art.

Everything else, including cheap code checks, passes untouched.
"""
from __future__ import annotations

import argparse
import fcntl
import hashlib
import json
import os
import re
import shlex
import shutil
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
CAPTURE_COMMAND = re.compile(r'remotion\s+(still|render)|ffmpeg\b.*\s-i\s|preflight_animatic|cinema_proof|render_dispatch|opening_compare')
RENDER_RESOURCES = ('preflight_renders', 'full_renders', 'cleanup_renders', 'rescue_renders')
AUTHORIZATION = 'out/dispatch/capture-authorization.json'
USED = 'out/dispatch/capture-authorizations-used.json'
SCHEMA = 'dispatch_capture_authorization/2'
LIFETIME = timedelta(minutes=45)
INPUT_FLAG = re.compile(r'^--(props|board)(?:=(.*))?$')
UNRESOLVED = re.compile(r'[$`]|^~|\$\(|\{\{')


def now():
    return datetime.now(timezone.utc)


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def normalize(command):
    return ' '.join(command.split())


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


def is_capture(command):
    return bool(CAPTURE_COMMAND.search(strip_text_payloads(command)))


def command_inputs(command):
    """Every --props and --board value the command names, quotes honored. None when it cannot be read."""
    try:
        tokens = shlex.split(strip_text_payloads(command))
    except ValueError:
        return None
    found = []
    for index, token in enumerate(tokens):
        match = INPUT_FLAG.match(token)
        if not match:
            continue
        value = match.group(2) if match.group(2) is not None else (tokens[index + 1] if index + 1 < len(tokens) else '')
        found.append((match.group(1), value))
    return found


def resolve(value, cwd):
    path = Path(value)
    return path if path.is_absolute() else Path(cwd) / path


def bound_hashes(board, root):
    """Renderer inputs the board names and the authored art modules its receipts name, by current bytes."""
    root = Path(root)
    renderer = {row['path']: sha(root / row['path']) for row in (board.get('film_direction') or {}).get('renderer_inputs', [])}
    art = {row['file']: sha(root / row['file']) for row in (board.get('story_art') or {}).get('entries', [])}
    return {'renderer_inputs': renderer, 'authored_art': art}


def capture_problems(command, auth, cwd, root, free_gib=None):
    """Why a capture command may not run now. Empty means it may."""
    if not is_capture(command):
        return []
    errors = []
    if not auth or auth.get('allowed') is not True or auth.get('schema') != SCHEMA:
        return ['the packet does not authorize a capture; no current capture authorization exists']
    if not (auth.get('render_reservation') or {}).get('event_sha256'):
        errors.append('no charged controller render reservation')
    headroom = auth.get('headroom') or {}
    if headroom.get('passed') is not True or not headroom.get('required_free_gib'):
        errors.append('no computed and passed native headroom check')
    elif (free_gib if free_gib is not None else round(shutil.disk_usage(root).free / (1024 ** 3), 3)) < headroom['required_free_gib']:
        errors.append('current native headroom is below the %s GiB required' % headroom['required_free_gib'])
    if not (auth.get('housekeeping') or {}).get('receipt_sha256'):
        errors.append('no kept portable housekeeping receipt')
    if auth.get('art_receipts_recorded') is not True:
        errors.append('genuine authored art receipts are not recorded')
    if 'scripts/run_with_env.sh' not in command:
        errors.append('the command is not run through bash scripts/run_with_env.sh')
    expires = auth.get('expires_at')
    if not expires or datetime.fromisoformat(expires) < now():
        errors.append('the capture authorization has expired')
    entry = next((c for c in auth.get('commands', []) if c.get('id') == hashlib.sha256(normalize(command).encode()).hexdigest()), None)
    if entry is None:
        errors.append('this exact command is not one the authorization lists')
    elif entry.get('consumed'):
        errors.append('this authorized capture was already used; a second capture needs a new reservation and authorization')
    boards = {b['sha256']: b['path'] for b in auth.get('boards', [])}
    for item in auth.get('boards', []):
        try:
            if sha(item['path']) != item['sha256']:
                errors.append('authorized board changed after authorization: ' + item['path'])
        except OSError:
            errors.append('authorized board is unreadable: ' + item['path'])
    inputs = command_inputs(command)
    if inputs is None:
        errors.append('the command could not be parsed, so its capture inputs are unreadable')
        inputs = []
    for flag, value in inputs:
        if not value or UNRESOLVED.search(value):
            errors.append('unresolved --%s input %r; capture inputs must be concrete files' % (flag, value))
            continue
        path = resolve(value, cwd)
        try:
            digest = sha(path)
            data = json.loads(path.read_text())
        except (OSError, ValueError):
            errors.append('unreadable --%s input %s' % (flag, value))
            continue
        if digest not in boards:
            errors.append('--%s %s is not one of the authorized boards' % (flag, value))
        if placeholder_art(data):
            errors.append('the %s input carries scratch placeholder art entries' % flag)
    for kind, files in (auth.get('bound') or {}).items():
        for file, expected in files.items():
            try:
                if sha(Path(root) / file) != expected:
                    errors.append('%s changed after authorization: %s' % (kind.replace('_', ' '), file))
            except OSError:
                errors.append('%s is missing: %s' % (kind.replace('_', ' '), file))
    return errors


def consume(project, command):
    """Mark the authorized command used before it is allowed, atomically and durably."""
    path = Path(project) / AUTHORIZATION
    lock = Path(str(path) + '.lock')
    with open(lock, 'w') as handle:
        fcntl.flock(handle, fcntl.LOCK_EX)
        auth = json.loads(path.read_text())
        digest = hashlib.sha256(normalize(command).encode()).hexdigest()
        for entry in auth['commands']:
            if entry['id'] == digest:
                if entry.get('consumed'):
                    return False
                entry['consumed'] = now().isoformat()
        tmp = path.with_suffix('.tmp')
        tmp.write_text(json.dumps(auth, indent=2) + '\n')
        with open(tmp, 'rb') as written:
            os.fsync(written.fileno())
        os.replace(tmp, path)
    return True


def decide(payload, project):
    """The hook decision for one tool call. Returns the denial reason or None."""
    if payload.get('tool_name') != 'Bash':
        return None
    command = (payload.get('tool_input') or {}).get('command', '')
    if not is_capture(command):
        return None
    try:
        auth = json.loads((Path(project) / AUTHORIZATION).read_text())
    except (OSError, ValueError):
        auth = None
    errors = capture_problems(command, auth, payload.get('cwd') or project, project)
    if errors:
        return ('Capture refused. ' + '; '.join(dict.fromkeys(errors)) + '. Author source and run cheap code checks. '
                'Only the director issues a capture authorization (scripts/capture_guard.py authorize) after a fresh charged render '
                'reservation, passed native headroom and housekeeping, and recorded authored receipts.')
    if not consume(project, command):
        return 'Capture refused. this authorized capture was already used; a second capture needs a new reservation and authorization.'
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
        reason = ('Capture refused because the guard could not verify it: ' + str(exc)[:160]) if is_capture(command) else None
    if reason:
        print(json.dumps({'hookSpecificOutput': {'hookEventName': 'PreToolUse', 'permissionDecision': 'deny',
                                                 'permissionDecisionReason': reason}}))
    return 0


def event_digest(event):
    return hashlib.sha256(json.dumps(event, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def housekeeping_run(root, required, run=subprocess.run):
    """Portable startup housekeeping with the computed minimum. Its real receipt is kept beside the authorization."""
    root = Path(root)
    docket = root.parent / 'TexasAIDocket'
    command = [sys.executable, str(REPO / 'scripts/dispatch_housekeeping.py'), '--workspace', str(root.parent),
               '--dispatch-repo', str(root), '--docket-repo', str(docket), '--apply', '--fetch', '--summary',
               '--require-headroom', '--min-free-gib', str(required)]
    done = run(command, capture_output=True, text=True)
    receipt = root / ('out/dispatch/capture-housekeeping-%s.json' % now().strftime('%Y%m%dT%H%M%S'))
    receipt.write_text(json.dumps({'command': command, 'exit_code': done.returncode, 'stdout': done.stdout,
                                   'stderr': done.stderr[-2000:], 'at': now().isoformat()}, indent=2) + '\n')
    if done.returncode:
        raise ValueError('portable housekeeping --require-headroom failed (receipt kept at %s): %s' % (receipt, done.stdout[-200:]))
    return {'receipt': str(receipt), 'receipt_sha256': sha(receipt), 'exit_code': 0, 'min_free_gib': required}


def authorize(root, state_path, board_paths, commands, resource=None, housekeeping=True, run=subprocess.run):
    """Issue one capture authorization from facts, never from a flag the caller types."""
    import authored_story_art
    from native_headroom import estimate
    root = Path(root)
    state = json.loads(Path(state_path).read_text())
    boards = [(Path(p), json.loads(Path(p).read_text())) for p in board_paths]
    if not boards or not commands:
        raise ValueError('name the exact boards and the exact capture commands to authorize')
    for command in commands:
        if not is_capture(command) or 'scripts/run_with_env.sh' not in command:
            raise ValueError('not a wrapped capture command: ' + command[:80])
    used_path = root / USED
    used = json.loads(used_path.read_text()) if used_path.is_file() else []
    candidates = [e for e in state.get('events', []) if e.get('kind') == 'reserved'
                  and any(k in (e.get('resources') or {}) for k in RENDER_RESOURCES)
                  and 'LATE CHARGE' not in str(e.get('note', '')).upper()
                  and (resource is None or resource in (e.get('resources') or {}))
                  and event_digest(e) not in {u['event_sha256'] for u in used}]
    if not candidates:
        raise ValueError('no fresh unused charged render reservation in the ledger (late-accounting charges do not count); reserve the render first')
    reservation = candidates[-1]
    bound = {'renderer_inputs': {}, 'authored_art': {}}
    plans = []
    for path, board in boards:
        problems = authored_story_art.problems(board, root)
        if problems or placeholder_art(board):
            raise ValueError('genuine authored art receipts are not recorded: ' + '; '.join(problems[:3] or ['placeholder entries']))
        for kind, files in bound_hashes(board, root).items():
            bound[kind].update(files)
        plans.append(estimate(board))
    required = max(p['required_free_gib'] for p in plans)
    free = round(shutil.disk_usage(root).free / (1024 ** 3), 3)
    if free < required:
        raise ValueError('native headroom failed: %s GiB free, %s required' % (free, required))
    kept = housekeeping_run(root, required, run) if housekeeping else {'receipt': None, 'receipt_sha256': 'none', 'exit_code': 0}
    issued = now()
    record = {'schema': SCHEMA, 'allowed': True,
              'render_reservation': {'event_sha256': event_digest(reservation),
                                     'resource': next(k for k in RENDER_RESOURCES if k in reservation['resources']),
                                     'at': reservation['at'], 'note': str(reservation.get('note', ''))[:200]},
              'boards': [{'path': str(p.resolve()), 'sha256': sha(p)} for p, _ in boards], 'bound': bound,
              'commands': [{'id': hashlib.sha256(normalize(c).encode()).hexdigest(), 'text': normalize(c), 'consumed': False} for c in commands],
              'headroom': {'passed': True, 'required_free_gib': required, 'free_gib': free}, 'housekeeping': kept,
              'art_receipts_recorded': True, 'issued_at': issued.isoformat(), 'expires_at': (issued + LIFETIME).isoformat()}
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
    p.add_argument('--board', action='append', required=True, help='each exact board the capture may use')
    p.add_argument('--command', action='append', required=True, help='each exact wrapped capture command, usable once')
    p.add_argument('--resource')
    p.add_argument('--root', default=str(REPO))
    args = parser.parse_args(argv)
    if args.action == 'hook':
        return hook()
    try:
        print(json.dumps(authorize(args.root, args.state, args.board, args.command, args.resource), indent=2))
    except (ValueError, OSError) as exc:
        print(json.dumps({'error': str(exc)}), file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    raise SystemExit(main())
