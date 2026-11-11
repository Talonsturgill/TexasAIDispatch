"""Dependency-free, fail-closed storage proof for exact phone contact sheets.

This is not a native renderer profile. Admission never imports the decoder or its
third-party dependencies; the real preparation still validates phone_inputs.
"""
import hashlib
import json
import math
from pathlib import Path
import shlex
import shutil

POLICY = 'config/phone_review_storage_v1.json'
PROOF = 'config/phone_review_storage_proof_v1.json'
MODE = 'phone-review-sheets-v1'
EXPECTED = {'schema': 'dispatch-phone-review-storage/1', 'max_duration_s': 300,
            'duration_tolerance_s': 0.15, 'max_frames': 9004, 'fps': 30,
            'sample_stride': 6, 'samples_per_sheet': 5, 'max_samples': 1502,
            'max_sheets': 301, 'sample_width': 390, 'sample_height': 693,
            'sheet_width': 1210, 'max_sheet_height': 1494,
            'max_png_bytes': 6 * 1024**2, 'max_index_bytes': 1024**2, 'max_failure_bytes': 4096,
            'reserve_gib': 5}
FILES = ('scripts/phone_review_storage.py', 'scripts/claude_motion_review.py',
         'scripts/verify_phone_review_storage.py', 'scripts/phone_review_storage_test.py',
         'scripts/claude_motion_review_test.py', 'scripts/motion_review_operations.py',
         'scripts/capture_reservation.py', 'scripts/capture_guard.py', 'scripts/run_controller.py',
         'scripts/native_headroom.py', 'scripts/bounded_capture.py',
         'scripts/run_with_env.sh', 'scripts/preflight_animatic.py',
         'requirements.txt', 'video-engine/public/fonts/Manrope-Var.ttf',
         'scripts/operation_storage.py', 'scripts/operation_storage_test.py')


from operation_storage import FILES as OPERATION_FILES
FILES += OPERATION_FILES


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def closure(root):
    return {name: sha(Path(root) / name) for name in FILES}


def verified(root):
    root = Path(root)
    try:
        proof = json.loads((root / PROOF).read_text())
        evidence = proof['evidence']
        if (json.loads((root / POLICY).read_text()) != EXPECTED
                or proof.get('schema') != 'dispatch-phone-review-storage-proof/1'
                or proof.get('verified') is not True
                or proof.get('policy_sha256') != sha(root / POLICY)
                or proof.get('files') != closure(root)
                or evidence.get('schema') != 'dispatch-phone-review-storage-exercise/1'
                or evidence.get('files') != proof['files']
                or evidence.get('policy_sha256') != proof['policy_sha256']
                or evidence.get('exact_decoded_pixels') is not True
                or evidence.get('full_sample_coverage') is not True
                or evidence.get('native_exact_decoded_pixels') is not True
                or evidence.get('high_entropy_sheet', {}).get('dimensions') != [1210, 1494]
                or not 5 * 1024**2 < evidence['high_entropy_sheet']['bytes'] <= EXPECTED['max_png_bytes']
                or evidence.get('bounds') != bounds()):
            return None
        return {**proof['files'], POLICY: sha(root / POLICY), PROOF: sha(root / PROOF)}
    except (OSError, ValueError, KeyError, TypeError):
        return None


def bounds():
    output = (EXPECTED['max_sheets'] * EXPECTED['max_png_bytes']
              + EXPECTED['max_index_bytes'] + EXPECTED['max_failure_bytes'])
    return {'max_frames': EXPECTED['max_frames'], 'max_samples': EXPECTED['max_samples'],
            'max_sheets': EXPECTED['max_sheets'], 'max_output_bytes': output,
            'reserve_gib': EXPECTED['reserve_gib'],
            'required_free_gib': math.ceil(output / 1024**3 + EXPECTED['reserve_gib'])}


def paths(option):
    if option == 'current':
        board, film = 'out/dispatch/storyboard.json', 'out/dispatch/preflight.mp4'
        outputs = {'out/dispatch/phone-motion-current'}
    elif option in ('a', 'b'):
        board, film = ('out/dispatch/openings/' + option + ext for ext in ('.json', '.mp4'))
        # The local routine and the hosted capture route each have a fixed spelling.
        outputs = {'out/dispatch/openings/' + prefix + option for prefix in ('motion-', 'phone-motion-')}
    else:
        return None
    return {'--board': {board}, '--film': {film}, '--out': outputs,
            '--state': {'out/dispatch/run_state.json'}}


def canonical(root, value, choices):
    """Literal canonical paths only, with no symlink in any owned component."""
    root = Path(root).resolve()
    path = Path(value)
    for choice in choices:
        expected = root / choice
        if value not in (choice, str(expected)):
            continue
        if any((root / Path(*Path(choice).parts[:i])).is_symlink()
               for i in range(1, len(Path(choice).parts) + 1)):
            return False
        return path.is_absolute() and path.resolve() == expected or (root / path).resolve() == expected
    return False


def operation(command, root):
    try:
        # Reject syntax before shlex removes quoting/escaping. No shell expansion,
        # continuation, substitution, glob, redirection or compound program qualifies.
        if any(c in command for c in '$`;&|<>\n\r(){}*?[]\\'):
            return None
        args = shlex.split(command)
        if (len(args) < 4 or args[:2] != ['bash', 'scripts/run_with_env.sh']
                or args[2] not in ('python', 'python3')
                or args[3] != 'scripts/claude_motion_review.py'
                or not canonical(root, args[1], {args[1]})
                or not canonical(root, args[3], {args[3]})):
            return None
        values = {}
        tail = iter(args[4:])
        for token in tail:
            flag, equal, value = token.partition('=')
            if flag not in ('--phone-option', '--board', '--film', '--out', '--state') or flag in values:
                return None
            values[flag] = value if equal else next(tail, '')
        if set(values) != {'--phone-option', '--board', '--film', '--out', '--state'}:
            return None
        expected = paths(values['--phone-option'])
        if expected is None or any(not canonical(root, values[flag], choices) for flag, choices in expected.items()):
            return None
        from capture_reservation import operation_for
        from motion_review_operations import PHONE_OPERATIONS
        if operation_for([command], root) != PHONE_OPERATIONS[values['--phone-option']]:
            return None
        return values
    except (OSError, ValueError):
        return None


def plan(root, commands, boards):
    if len(commands) != 1 or len(boards) != 1:
        return None
    values = operation(commands[0], root)
    if values is None:
        return None
    board, data = boards[0]
    if not canonical(root, str(board), paths(values['--phone-option'])['--board']):
        return None
    try:
        duration = float(data['runtime_s']) + float(data.get('credits_s') or 0)
        if not math.isfinite(duration) or not 0 < duration <= 300.15:
            return None
    except (ValueError, KeyError, TypeError):
        return None
    bindings = verified(root)
    if bindings is None:
        return None
    return {'mode': MODE, 'operator': 'claude_motion_review.py',
            'phone_option': values['--phone-option'], **bounds(), 'bindings': bindings}


def check_meta(meta, phone=True):
    if ((meta['width'], meta['height'], meta['fps']) != ((270, 480, 30) if phone else (1080, 1920, 30))
            or not isinstance(meta['frames'], int) or not 1 <= meta['frames'] <= EXPECTED['max_frames']
            or not math.isfinite(meta['duration_s']) or not 0 < meta['duration_s'] <= 300
            or abs(meta['frames'] / 30 - meta['duration_s']) > .15):
        raise ValueError('phone extraction exceeds its proved encoded duration or frame bounds')


def check_space(directory, remaining_sheets, index_pending=True):
    if not 0 <= remaining_sheets <= EXPECTED['max_sheets']:
        raise ValueError('phone extraction exceeds its proved sheet count')
    needed = (EXPECTED['reserve_gib'] * 1024**3 + remaining_sheets * EXPECTED['max_png_bytes']
              + (EXPECTED['max_index_bytes'] if index_pending else 0) + EXPECTED['max_failure_bytes'])
    if shutil.disk_usage(directory).free < needed:
        raise ValueError('phone extraction needs the five GiB reserve plus its remaining bounded output')


def runtime_check(root, args):
    """Recheck the lower-profile source and exact invocation after hook consumption.

    Legacy admission remains available. Only an authorization claiming this lower
    profile requires this proof; the normal controller still owns charging/claiming.
    """
    from capture_guard import AUTHORIZATION
    path = Path(root) / AUTHORIZATION
    if not path.is_file():
        return
    auth = json.loads(path.read_text())
    profile = (auth.get('headroom') or {}).get('storage_profile')
    if args.phone_option is None and profile and profile.get('mode') == 'operation-storage-v1':
        return  # The native route is checked by operation_storage.runtime_check.
    phone_binding = PROOF in auth.get('bound', {}).get('capture_storage', {})
    if (not profile or profile.get('mode') != MODE) and not phone_binding:
        return
    commands = auth.get('commands') or []
    boards = [(Path(root) / row['path'], json.loads((Path(root) / row['path']).read_text()))
              for row in auth.get('boards', [])]
    from bounded_capture import plan as capture_plan
    current = capture_plan(root, [row['text'] for row in commands], boards)
    values = operation(commands[0]['text'], root) if len(commands) == 1 else None
    if (current != profile or current is None or not values
            or Path.cwd().resolve() != Path(root).resolve()
            or not commands[0].get('consumed')
            or auth.get('bound', {}).get('capture_storage') != current['bindings']
            or auth.get('headroom', {}).get('required_free_gib') != current['required_free_gib']
            or args.phone_option != values['--phone-option'] or args.verify
            or any(Path(getattr(args, flag[2:])).resolve() != (Path(root) / values[flag]).resolve()
                   for flag in ('--board', '--film', '--state', '--out'))):
        raise ValueError('phone storage authorization or exact source-bound invocation changed')


def main():
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--verify-proof', action='store_true', required=True)
    parser.parse_args()
    if verified(Path(__file__).resolve().parents[1]) is None:
        print('FAIL phone contact-sheet proof is missing or stale; legacy headroom remains required.')
        return 1
    print('PASS exact phone contact-sheet storage proof. No render, reservation or creative approval.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
