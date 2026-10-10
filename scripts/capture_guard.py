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


SHELLS = {'bash', 'sh', 'zsh', 'dash'}
PREFIXES = {'time', 'command', 'exec', 'nohup', 'env', 'nice', 'sudo'}
CAPTURE_SCRIPTS = {'preflight_animatic.py', 'cinema_proof.py', 'opening_compare.py', 'render_dispatch.sh'}


def newlines_as_separators(text):
    """An unquoted newline ends a command, exactly like a semicolon."""
    out, quote = [], None
    for char in text:
        if quote:
            quote = None if char == quote else quote
        elif char in '\'"':
            quote = char
        elif char == '\n':
            out.append(' ; ')
            continue
        out.append(char)
    return ''.join(out)


def tokenize(text):
    lexer = shlex.shlex(newlines_as_separators(text), posix=True, punctuation_chars=';&|()<>')
    lexer.whitespace_split = True
    return list(lexer)


UNKNOWN = None   # a working directory the guard can't model; relative capture inputs then fail closed


def simple_commands(command, cwd, depth=0):
    """Every simple command the shell would run with the directory it runs in, recursing into the wrapper,
    bash -c and -lc strings and eval. Directory changes are scoped: a subshell restores on its close, and a
    cd the guard can't model (no argument, a variable, a dash, pushd) makes later relative inputs unreadable.
    Raises ValueError when the text can't be read."""
    if depth > 6:
        raise ValueError('shell nesting is too deep to inspect')
    tokens = tokenize(strip_text_payloads(command))
    found, current, here, stack = [], [], cwd, []

    def flush():
        nonlocal current, here
        if current:
            walk(current, here, found, depth)
            if current[0] == 'cd':
                target = current[1] if len(current) == 2 and not UNRESOLVED.search(current[1]) and current[1] not in ('-',) else None
                here = str(resolve(target, here)) if target is not None and here is not None else UNKNOWN
            elif current[0] in ('pushd', 'popd'):
                here = UNKNOWN
        current = []

    for token in tokens:
        if token and set(token) <= set(';&|<>()'):
            # shlex joins runs like ");" and "&&" into one token, so read each character.
            for char in token:
                if char == '(':
                    flush(); stack.append(here)
                elif char == ')':
                    flush(); here = stack.pop() if stack else here
                else:
                    flush()
        else:
            current.append(token)
    flush()
    return found


def walk(tokens, cwd, found, depth):
    tokens = list(tokens)
    while tokens and (re.fullmatch(r'[A-Za-z_]\w*=.*', tokens[0]) or Path(tokens[0]).name in PREFIXES):
        tokens = tokens[1:]
    if not tokens:
        return
    name = Path(tokens[0]).name
    if name == 'eval':
        for inner in tokens[1:]:
            for item in simple_commands(inner, cwd, depth + 1):
                found.append(item)
        return
    if name in SHELLS:
        rest = tokens[1:]
        for index, token in enumerate(rest):
            if token.startswith('-') and not token.startswith('--') and 'c' in token[1:] and index + 1 < len(rest):
                for inner in simple_commands(rest[index + 1], cwd, depth + 1):
                    found.append(inner)
                return
        for index, token in enumerate(rest):
            if Path(token).name == 'run_with_env.sh':
                walk(rest[index + 1:], cwd, found, depth)
                return
            if not token.startswith('-'):
                break
    found.append((tokens, cwd))


def segment_is_capture(tokens):
    """Capture-looking words anywhere in a command, whatever prefix or keyword precedes them, so a form the
    parser did not model (time -p, env -i, then, an unknown wrapper) still fails closed."""
    names = [Path(t).name for t in tokens]
    for index, word in enumerate(names):
        if word == 'remotion' and index + 1 < len(names) and names[index + 1] in ('still', 'render'):
            return True
        if word == 'ffmpeg' and '-i' in tokens[index + 1:]:
            return True
        if word in CAPTURE_SCRIPTS and index > 0 and (names[index - 1].startswith('python') or names[index - 1] in SHELLS):
            return True
    return False


def analyze(command, cwd):
    """The capture segments of a command, or None when it cannot be parsed but looks like a capture."""
    try:
        segments = simple_commands(command, cwd)
    except ValueError:
        return None if CAPTURE_COMMAND.search(strip_text_payloads(command)) else []
    return [(t, d) for t, d in segments if t and segment_is_capture(t)]


def is_capture(command, cwd='.'):
    found = analyze(command, cwd)
    return found is None or bool(found)


def command_inputs(tokens):
    """Every --props and --board value in one capture segment, quotes honored."""
    found = []
    for index, token in enumerate(tokens):
        match = INPUT_FLAG.match(token)
        if not match:
            continue
        value = match.group(2) if match.group(2) is not None else (tokens[index + 1] if index + 1 < len(tokens) else '')
        found.append((match.group(1), value))
    return found


def resolve(value, cwd):
    path = Path(os.path.expanduser(value)) if value.startswith('~') else Path(value)
    if path.is_absolute():
        return path
    if cwd is UNKNOWN:
        raise OSError('the working directory is not known, so %r can not be resolved' % value)
    return Path(cwd) / path


def bound_hashes(board, root):
    """Renderer inputs the board names and the authored art modules its receipts name, by current bytes."""
    root = Path(root)
    renderer = {row['path']: sha(root / row['path']) for row in (board.get('film_direction') or {}).get('renderer_inputs', [])}
    art = {row['file']: sha(root / row['file']) for row in (board.get('story_art') or {}).get('entries', [])}
    return {'renderer_inputs': renderer, 'authored_art': art}


def capture_problems(command, auth, cwd, root, free_gib=None):
    """Why a capture command may not run now. Empty means it may."""
    segments = analyze(command, cwd)
    if segments == []:
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
            if sha(resolve(item['path'], root)) != item['sha256']:
                errors.append('authorized board changed after authorization: ' + item['path'])
        except OSError:
            errors.append('authorized board is unreadable: ' + item['path'])
    if segments is None:
        errors.append('the command could not be parsed, so its capture inputs are unreadable')
        segments = []
    for tokens, here in segments:
        for flag, value in command_inputs(tokens):
            if not value or UNRESOLVED.search(value):
                errors.append('unresolved --%s input %r; capture inputs must be concrete files' % (flag, value))
                continue
            try:
                path = resolve(value, here)
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
    """Mark the authorized command used before it is allowed, atomically and durably. For a Claude host
    edition the consumption is also made durable on the remote checkpoint and read back, so a replaced
    container can't reuse a command or reservation that was already dispatched."""
    path = Path(project) / AUTHORIZATION
    lock = Path(str(path) + '.lock')
    digest = hashlib.sha256(normalize(command).encode()).hexdigest()
    with open(lock, 'w') as handle:
        fcntl.flock(handle, fcntl.LOCK_EX)
        auth = json.loads(path.read_text())
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
    mirror_consumption(project, digest)
    return True


def mirror_consumption(project, digest):
    """Remote proof of consumption. Raises, so the hook denies, when it can't be made and verified."""
    state = Path(project) / 'out/dispatch/run_state.json'
    import claude_checkpoint as ck
    if not ck.required(state):
        return
    repo = ck.repo_of(state)
    run_id = json.loads(state.read_text())['run_id']
    ck.save_with_recovery(repo, state, 'capture authorization consumed ' + digest[:12])
    tip = ck.remote_tip(repo, run_id, 'origin')
    stored = json.loads(ck.show(repo, tip, 'checkpoints/%s/files/%s' % (run_id, AUTHORIZATION)))
    if not any(c.get('id') == digest and c.get('consumed') for c in stored.get('commands', [])):
        raise ValueError('the consumed authorization is not on the remote checkpoint')


def decide(payload, project):
    """The hook decision for one tool call. Returns the denial reason or None."""
    if payload.get('tool_name') != 'Bash':
        return None
    command = (payload.get('tool_input') or {}).get('command', '')
    cwd = payload.get('cwd') or project
    if not is_capture(command, cwd):
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
    try:
        if not consume(project, command):
            return 'Capture refused. this authorized capture was already used; a second capture needs a new reservation and authorization.'
    except Exception as exc:
        return ('Capture refused. the consumption of this authorization could not be made durable and verified on the remote '
                'checkpoint (%s). The authorization is spent. Reserve and authorize again.' % str(exc)[:160])
    return None


def hook(project=None):
    try:
        payload = json.load(sys.stdin)
    except ValueError:
        return 0
    project = project or os.environ.get('CLAUDE_PROJECT_DIR') or payload.get('cwd') or os.getcwd()
    try:
        reason = decide(payload, project)
    except Exception as exc:  # a capture command fails closed, every other command is never blocked by a bug here
        command = (payload.get('tool_input') or {}).get('command', '')
        reason = ('Capture refused because the guard could not verify it: ' + str(exc)[:160]) if is_capture(command, payload.get('cwd') or project) else None
    if reason:
        print(json.dumps({'hookSpecificOutput': {'hookEventName': 'PreToolUse', 'permissionDecision': 'deny',
                                                 'permissionDecisionReason': reason}}))
    return 0


def relative(path, root):
    try:
        return str(Path(path).resolve().relative_to(Path(root).resolve()))
    except ValueError:
        return str(Path(path).resolve())


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
        if not is_capture(command, str(root)) or 'scripts/run_with_env.sh' not in command:
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
              'boards': [{'path': relative(p, root), 'sha256': sha(p)} for p, _ in boards], 'bound': bound,
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
    h = sub.add_parser('hook')
    h.add_argument('--repo-root', action='store_true',
                   help='use this handler checkout for the ledger, including from a multi-repository session root')
    p = sub.add_parser('authorize')
    p.add_argument('--state', default='out/dispatch/run_state.json')
    p.add_argument('--board', action='append', required=True, help='each exact board the capture may use')
    p.add_argument('--command', action='append', required=True, help='each exact wrapped capture command, usable once')
    p.add_argument('--resource')
    p.add_argument('--root', default=str(REPO))
    args = parser.parse_args(argv)
    if args.action == 'hook':
        return hook(str(REPO) if args.repo_root else None)
    try:
        print(json.dumps(authorize(args.root, args.state, args.board, args.command, args.resource), indent=2))
    except (ValueError, OSError) as exc:
        print(json.dumps({'error': str(exc)}), file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    raise SystemExit(main())
