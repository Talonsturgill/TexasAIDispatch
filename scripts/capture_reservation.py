"""Bind a prepaid capture to its real operator; claim it once without charging twice."""
from pathlib import Path
import fcntl
import json

OPERATIONS = {
    'preflight_animatic.py': 'quarter-scale animatic',
    'cinema_proof.py': 'finished cinematic hero and stage ablation batch',
    'claude_motion_review.py': 'exact-film motion-image review extraction',
}


def operation_for(commands, root):
    from capture_guard import simple_commands, segment_is_capture, resolve
    if len(commands) != 1:
        raise ValueError('prepared capture requires one exact operator command')
    found = []
    for tokens, here in simple_commands(commands[0], str(root)):
        if not segment_is_capture(tokens):
            continue
        if (len(tokens) < 2 or Path(tokens[0]).name not in ('python', 'python3')
                or Path(tokens[1]).name not in OPERATIONS
                or resolve(tokens[1], here) != Path(root).resolve() / 'scripts' / Path(tokens[1]).name):
            raise ValueError('prepared capture requires a supported checkout operator, not a raw or mixed capture')
        found.append(OPERATIONS[Path(tokens[1]).name])
    if len(found) != 1:
        raise ValueError('prepared capture requires one supported render operator')
    return found[0]


def prepare(root, state_path, commands):
    import run_controller as controller
    from capture_guard import event_digest
    root, state_path = Path(root).resolve(), Path(state_path).resolve()
    if state_path != root / 'out/dispatch/run_state.json':
        raise ValueError('prepared capture must use this checkout ledger')
    note = operation_for(commands, root)
    from capture_guard import simple_commands, resolve
    for tokens, here in simple_commands(commands[0], str(root)):
        if len(tokens) < 2 or Path(tokens[1]).name not in OPERATIONS:
            continue
        expected = {'state': state_path, 'board': root / 'out/dispatch/storyboard.json',
                    'mix': root / 'out/dispatch/mix.wav', 'film': root / 'out/dispatch/film.mp4'}
        for index, token in enumerate(tokens):
            for flag, path in expected.items():
                if token == '--' + flag or token.startswith('--' + flag + '='):
                    value = token.partition('=')[2] if '=' in token else (tokens[index+1] if index+1 < len(tokens) else '')
                    if not value or resolve(value, here) != path:
                        raise ValueError('prepared --' + flag + ' must use the canonical current input')
    if note == OPERATIONS['claude_motion_review.py']:
        state = controller.read_state(state_path)
        deliverable = state.get('deliverable') or {}
        if (deliverable.get('review_only') is not False
                or deliverable.get('film_sha256') != controller.digest(root / 'out/dispatch/film.mp4')
                or deliverable.get('board_sha256') != controller.digest(root / 'out/dispatch/storyboard.json')):
            raise ValueError('prepared motion extraction needs the registered exact native film and board')
    accepted, message = controller.reserve(state_path, {'preflight_renders': 1}, note, _use_prepared_capture=False)
    if not accepted:
        raise ValueError(message)
    state = controller.read_state(state_path)
    reservation = state['events'][-1]
    return {'schema': 'dispatch_prepared_capture/1', 'operation': note,
            'run_id': state['run_id'], 'event_sha256': event_digest(reservation),
            'input_identity': reservation['preflight_identity']}


def claim(state_path, note):
    """The hook must have durably consumed the matching authorization before this call."""
    import capture_guard as guard
    import run_controller as controller
    state_path = Path(state_path).resolve()
    root = controller.REPO.resolve()
    auth_path = root / guard.AUTHORIZATION
    if not auth_path.is_file():
        return controller.reserve(state_path, {'preflight_renders': 1}, note, _use_prepared_capture=False)
    auth = json.loads(auth_path.read_text())
    prepared = auth.get('prepared_capture')
    if prepared is None:
        return controller.reserve(state_path, {'preflight_renders': 1}, note, _use_prepared_capture=False)
    with open(str(state_path) + '.capture-claim.lock', 'w') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        state = controller.read_state(state_path)
        receipt = prepared.get('event_sha256')
        errors = []
        if state_path != root / 'out/dispatch/run_state.json':
            errors.append('prepared ledger path differs')
        if (prepared.get('schema') != 'dispatch_prepared_capture/1'
                or prepared.get('operation') != note
                or operation_for([c['text'] for c in auth.get('commands', [])], root) != note):
            errors.append('prepared operator differs')
        if state.get('terminal_state') or state.get('run_id') != prepared.get('run_id'):
            errors.append('prepared ledger differs or is terminal')
        if (prepared.get('input_identity') != controller.preflight_identity(state_path, note)
                or auth.get('render_reservation', {}).get('event_sha256') != receipt):
            errors.append('prepared inputs or reservation changed')
        if not all(c.get('consumed') for c in auth.get('commands', [])):
            errors.append('capture hook has not consumed this command')
        reservation = next((e for e in state.get('events', []) if guard.event_digest(e) == receipt), None)
        if (not reservation or reservation.get('kind') != 'reserved'
                or reservation.get('resources') != {'preflight_renders': 1}
                or reservation.get('note') != note
                or reservation.get('preflight_identity') != prepared.get('input_identity')):
            errors.append('no matching charged operation')
        if any(e.get('kind') == 'prepared_capture_claimed' and e.get('event_sha256') == receipt
               for e in state.get('events', [])):
            errors.append('prepared capture was already claimed')
        if errors:
            return False, 'capture reservation: ' + '; '.join(errors)
        controller.event(state, 'prepared_capture_claimed', event_sha256=receipt,
                         operation=note, input_identity=prepared['input_identity'])
        controller.save(state_path, state)
        return True, 'capture reservation: matching prepaid operation claimed once; no second charge'
