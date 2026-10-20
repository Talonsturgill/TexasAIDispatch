"""Bind a prepaid capture to its real operator; claim it once without charging twice."""
from pathlib import Path
import fcntl
import json

OPERATIONS = {
    'preflight_animatic.py': 'quarter-scale animatic',
    'cinema_proof.py': 'finished cinematic hero and stage ablation batch',
    'claude_motion_review.py': 'exact-film motion-image review extraction',
    'opening_compare.py': 'two opening comparison batch',
}
FULL_OPERATION = 'full-resolution Dispatch render'
from claude_motion_review import PHONE_OPERATIONS


def resource_for(note):
    if note == FULL_OPERATION:
        return 'full_renders'
    if note in (*OPERATIONS.values(), *PHONE_OPERATIONS.values()):
        return 'preflight_renders'
    raise ValueError('unsupported prepared capture operation')


def input_identity(state_path, note):
    import run_controller as controller
    return (controller.full_render_identity(state_path) if note == FULL_OPERATION
            else controller.preflight_identity(state_path, note))


def operation_for(commands, root):
    from capture_guard import simple_commands, segment_is_capture, resolve
    if len(commands) != 1:
        raise ValueError('prepared capture requires one exact operator command')
    found = []
    for tokens, here in simple_commands(commands[0], str(root)):
        if not segment_is_capture(tokens):
            continue
        if (len(tokens) >= 2 and Path(tokens[0]).name == 'bash'
                and Path(tokens[1]).name == 'render_dispatch.sh'
                and resolve(tokens[1], here).resolve() == Path(root).resolve() / 'scripts/render_dispatch.sh'):
            found.append(FULL_OPERATION)
            continue
        if (len(tokens) < 2 or Path(tokens[0]).name not in ('python', 'python3')
                or Path(tokens[1]).name not in OPERATIONS
                or resolve(tokens[1], here) != Path(root).resolve() / 'scripts' / Path(tokens[1]).name):
            raise ValueError('prepared capture requires a supported checkout operator, not a raw or mixed capture')
        operation = OPERATIONS[Path(tokens[1]).name]
        if Path(tokens[1]).name == 'claude_motion_review.py' and any(t.split('=')[0] == '--phone-option' for t in tokens):
            flags = [i for i, t in enumerate(tokens) if t.split('=')[0] == '--phone-option']
            if len(flags) != 1:
                raise ValueError('prepared phone extraction needs one option')
            i = flags[0]
            option = tokens[i].partition('=')[2] if '=' in tokens[i] else (tokens[i+1] if i+1 < len(tokens) else '')
            if option not in PHONE_OPERATIONS:
                raise ValueError('prepared phone extraction needs option a or b')
            operation = PHONE_OPERATIONS[option]
        found.append(operation)
    if len(found) != 1:
        raise ValueError('prepared capture requires one supported render operator')
    return found[0]


def motion_output_precheck(tokens, here, package):
    """Catch an occupied decoder destination before buying or consuming a capture."""
    from capture_guard import UNRESOLVED, resolve
    flags = [i for i, token in enumerate(tokens)
             if token == '--out' or token.startswith('--out=')]
    if len(flags) != 1:
        raise ValueError('prepared motion extraction needs one explicit --out')
    index = flags[0]
    value = (tokens[index].partition('=')[2] if '=' in tokens[index]
             else (tokens[index + 1] if index + 1 < len(tokens) else ''))
    if not value or value.startswith('--') or UNRESOLVED.search(value):
        raise ValueError('prepared motion extraction needs a literal --out path')
    target = resolve(value, here)
    if target.exists() or target.is_symlink():
        raise ValueError('motion output already exists; verify and reuse it if current, or retain '
                         'the old directory in edition evidence before preparing a new capture; no capture charged')
    target, package = target.resolve(), Path(package).resolve()
    if target == package or not target.is_relative_to(package):
        raise ValueError('motion output must stay inside the owned board review package; no capture charged')


def opening_output_precheck(package):
    """Never buy a replacement batch over retained or partial comparison evidence."""
    output = Path(package) / 'openings'
    if output.is_symlink() or (output.exists() and
            (not output.is_dir() or any(output.iterdir()))):
        raise ValueError('opening comparison output already exists; verify and reuse a current pair, '
                         'or retain the entire old package in edition evidence before preparing '
                         'a changed batch; no capture charged')


def prepare(root, state_path, commands, resource=None):
    import run_controller as controller
    from capture_guard import event_digest
    root, state_path = Path(root).resolve(), Path(state_path).resolve()
    if state_path != root / 'out/dispatch/run_state.json':
        raise ValueError('prepared capture must use this checkout ledger')
    note = operation_for(commands, root)
    owned_resource = resource_for(note)
    if resource is not None and resource != owned_resource:
        raise ValueError('prepared operator uses ' + owned_resource)
    from capture_guard import simple_commands, resolve
    for tokens, here in simple_commands(commands[0], str(root)):
        if len(tokens) < 2 or Path(tokens[1]).name not in (*OPERATIONS, 'render_dispatch.sh'):
            continue
        expected = {'state': state_path, 'board': root / 'out/dispatch/storyboard.json',
                    'mix': root / 'out/dispatch/mix.wav', 'film': root / 'out/dispatch/film.mp4'}
        if note == OPERATIONS['opening_compare.py']:
            expected = {'state': state_path, 'root': root / 'out/dispatch'}
            # The inspection-only lane never buys a new render. Require the two literal
            # paths so no unsupported flag can redirect or change this operation.
            args, supplied = iter(tokens[2:]), set()
            for token in args:
                if token == '--retain-failed-inspection' and token not in supplied:
                    supplied.add(token)
                    continue
                flag, equal, value = token.partition('=')
                if flag not in ('--state', '--root') or flag in supplied:
                    raise ValueError('prepared comparison needs distinct canonical --root and --state only')
                supplied.add(flag)
                value = value if equal else next(args, '')
                if not value or resolve(value, here) != expected[flag[2:]]:
                    raise ValueError('prepared ' + flag + ' must use the canonical current input')
            if not {'--root', '--state'}.issubset(supplied):
                raise ValueError('prepared comparison needs explicit canonical --root and --state')
            opening_output_precheck(root / 'out/dispatch')
            from opening_compare import owned_boards
            owned_boards(root / 'out/dispatch', state_path)
        if note == FULL_OPERATION:
            expected.update({flag: root / 'out/dispatch' / name for flag, name in {
                'captions': 'captions.json', 'preflight': 'preflight.json',
                'preflight-film': 'preflight.mp4', 'silent': 'silent.mp4',
                'started': 'render_started', 'manifest': 'render-manifest.json',
                'rescue-report': 'rescue.json'}.items()})
            args = tokens[2:]
            if len(args) % 2 or len(set(args[::2])) != len(args[::2]) or any(
                    arg not in {'--' + flag for flag in expected} for arg in args[::2]):
                raise ValueError('prepared full render needs distinct supported flag/value pairs')
        if note in PHONE_OPERATIONS.values():
            option = next(k for k, v in PHONE_OPERATIONS.items() if v == note)
            expected.update(board=root / ('out/dispatch/openings/' + option + '.json'),
                            film=root / ('out/dispatch/openings/' + option + '.mp4'))
            if option == 'current':
                expected.update(board=root / 'out/dispatch/storyboard.json', film=root / 'out/dispatch/preflight.mp4')
        for index, token in enumerate(tokens):
            for flag, path in expected.items():
                if token == '--' + flag or token.startswith('--' + flag + '='):
                    value = token.partition('=')[2] if '=' in token else (tokens[index+1] if index+1 < len(tokens) else '')
                    if not value or resolve(value, here) != path:
                        raise ValueError('prepared --' + flag + ' must use the canonical current input')
        if Path(tokens[1]).name == 'claude_motion_review.py':
            motion_output_precheck(tokens, here, expected['board'].parent)
    if note == OPERATIONS['claude_motion_review.py']:
        state = controller.read_state(state_path)
        deliverable = state.get('deliverable') or {}
        if (deliverable.get('review_only') is not False
                or deliverable.get('film_sha256') != controller.digest(root / 'out/dispatch/film.mp4')
                or deliverable.get('board_sha256') != controller.digest(root / 'out/dispatch/storyboard.json')):
            raise ValueError('prepared motion extraction needs the registered exact native film and board')
    elif note in PHONE_OPERATIONS.values():
        from claude_motion_review import phone_inputs
        phone_inputs(state_path, option, expected['board'], expected['film'])
    elif note == FULL_OPERATION:
        import music
        problems = music.verify_package(root / 'out/dispatch/credits.txt', root / 'out/dispatch/mix.json',
                                        root / 'out/dispatch/storyboard.json', root / 'out/dispatch/mix.wav', music.load())
        if problems:
            raise ValueError('full-render music package: ' + '; '.join(problems))
        input_identity(state_path, note)
    prepare_options = {'_prepare_full': True} if note == FULL_OPERATION else {}
    accepted, message = controller.reserve(state_path, {owned_resource: 1}, note,
                                           _use_prepared_capture=False, **prepare_options)
    if not accepted:
        raise ValueError(message)
    state = controller.read_state(state_path)
    reservation = state['events'][-1]
    field = 'full_render_identity' if note == FULL_OPERATION else 'preflight_identity'
    return {'schema': 'dispatch_prepared_capture/1', 'operation': note, 'resource': owned_resource,
            'run_id': state['run_id'], 'event_sha256': event_digest(reservation),
            'input_identity': reservation[field]}


def claim(state_path, note):
    """The hook must have durably consumed the matching authorization before this call."""
    import capture_guard as guard
    import run_controller as controller
    state_path = Path(state_path).resolve()
    root = controller.REPO.resolve()
    resource = resource_for(note)
    field = 'full_render_identity' if note == FULL_OPERATION else 'preflight_identity'
    auth_path = root / guard.AUTHORIZATION
    if not auth_path.is_file():
        return controller.reserve(state_path, {resource: 1}, note, _use_prepared_capture=False)
    auth = json.loads(auth_path.read_text())
    prepared = auth.get('prepared_capture')
    if prepared is None:
        return controller.reserve(state_path, {resource: 1}, note, _use_prepared_capture=False)
    with open(str(state_path) + '.capture-claim.lock', 'w') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        state = controller.read_state(state_path)
        receipt = prepared.get('event_sha256')
        errors = []
        if state_path != root / 'out/dispatch/run_state.json':
            errors.append('prepared ledger path differs')
        if (prepared.get('schema') != 'dispatch_prepared_capture/1'
                or prepared.get('operation') != note
                or prepared.get('resource', 'preflight_renders') != resource
                or operation_for([c['text'] for c in auth.get('commands', [])], root) != note):
            errors.append('prepared operator differs')
        if state.get('terminal_state') or state.get('run_id') != prepared.get('run_id'):
            errors.append('prepared ledger differs or is terminal')
        if (prepared.get('input_identity') != input_identity(state_path, note)
                or auth.get('render_reservation', {}).get('event_sha256') != receipt):
            errors.append('prepared inputs or reservation changed')
        if not all(c.get('consumed') for c in auth.get('commands', [])):
            errors.append('capture hook has not consumed this command')
        reservation = next((e for e in state.get('events', []) if guard.event_digest(e) == receipt), None)
        if (not reservation or reservation.get('kind') != 'reserved'
                or reservation.get('resources') != {resource: 1}
                or reservation.get('note') != note
                or reservation.get(field) != prepared.get('input_identity')):
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
