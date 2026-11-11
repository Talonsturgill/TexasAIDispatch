"""Operation-specific disk estimates, not a universal filesystem hard cap.

The existing five GiB reserve is unchanged. Existing retained files already
reduce statvfs free space. This adds NEW retained outputs, public bundle copies
and checkpoint Git work. A remote writer can grow arbitrary history; neither a
local measurement nor MAX_TOTAL bounds that. Normal checkpoint durability and
failure/recovery remain authoritative and are never bypassed.
"""
import json
import math
import os
from pathlib import Path
import shlex
import shutil
import subprocess
import sys

GIB = 1024 ** 3
MIB = 1024 ** 2
MODE = 'operation-storage-v1'
FILES = ('scripts/operation_storage.py', 'scripts/operation_storage_test.py',
         'scripts/verify_operation_storage.py', 'scripts/preflight_animatic.py',
         'scripts/preship_compute.py', 'scripts/preship_check.py', 'scripts/place_check.py',
         'scripts/place_probes.mjs', 'scripts/place_probe_loader.cjs',
         'scripts/feed_composite_check.py', 'scripts/vo_align.py',
         'scripts/claude_checkpoint.py', 'scripts/checkpoint_image_data.py',
         'scripts/public_state.py', 'scripts/cinema_cache.py', 'scripts/extract_frames.sh',
         'scripts/documentary_review.py', 'scripts/documentary_check.py', 'config/feed_layout.json')


def tree_bytes(path):
    """Logical OR allocated bytes, whichever is larger; sparse files are not free."""
    path = Path(path)
    if not path.is_dir() or path.is_symlink():
        raise ValueError('storage input directory is missing or symbolic: ' + str(path))
    total = 0
    for file in path.rglob('*'):
        if file.is_symlink():
            raise ValueError('storage input contains a symbolic link: ' + str(file))
        if file.is_file():
            stat = file.stat()
            total += max(stat.st_size, getattr(stat, 'st_blocks', 0) * 512)
    return total


def checkpoint_cost(root, new_unique_bytes):
    from claude_checkpoint import MAX_TOTAL, required, build_bundle
    if not required(Path(root) / 'out/dispatch/run_state.json'):
        return {'git_object_allowance_bytes': 0, 'checkpoint_work_bytes': 0,
                'checkpoint_package_allowance_bytes': 0}
    common = subprocess.check_output(['git', '-C', str(root), 'rev-parse',
                                      '--git-common-dir'], text=True).strip()
    objects = (Path(root) / common).resolve() / 'objects'
    if (os.environ.get('GIT_OBJECT_DIRECTORY') or os.environ.get('GIT_ALTERNATE_OBJECT_DIRECTORIES')
            or ((objects/'info/alternates').is_file() and (objects/'info/alternates').read_text().strip())):
        raise ValueError('external Git object stores are outside the measured checkpoint profile')
    # Round the measured shared object store up, so ledger-only writes do not
    # invalidate an authorization for a few KiB. Growth past the bucket fails
    # the existing exact-profile hook recheck and requires a fresh assessment.
    existing = math.ceil(tree_bytes(objects) / GIB) * GIB
    # Read the same public projection and candidates that save() will retain.
    # This does not write, fetch, charge, mirror, or change any recovery behavior.
    _, manifest, ledger, _, _ = build_bundle(root, Path(root)/'out/dispatch/run_state.json',
                                             'read-only storage planning')
    current = manifest['storage_accounting']['unique_blob_bytes']
    # 64 MiB buckets tolerate the small authorization/ledger files written by
    # preparation. New outputs are costed separately, never counted as free.
    quantum = 64*MIB
    package = min(MAX_TOTAL, math.ceil((current + new_unique_bytes) / quantum) * quantum)
    # New local loose objects and a FULL allowed incoming checkpoint package,
    # both copied again by a possible repack, plus the measured existing store.
    # A peer adding multiple historical versions is not bounded by this model.
    return {'git_object_allowance_bytes': existing,
            'checkpoint_package_allowance_bytes': package,
            'checkpoint_work_bytes': existing + 2*(package + MAX_TOTAL)}



def parse(command, root):
    from phone_review_storage import canonical
    if any(c in command for c in '$`;&|<>\n\r(){}*?[]\\'):
        return None
    try:
        args = shlex.split(command)
        if (len(args) < 4 or args[:2] != ['bash', 'scripts/run_with_env.sh']
                or args[2] not in ('python', 'python3')):
            return None
        name = args[3]
        definitions = {
            'scripts/preflight_animatic.py': {
                '--board': 'storyboard.json', '--film': 'preflight.mp4', '--claims': 'claims.json',
                '--sheet': 'preflight-contact-sheet.png', '--report': 'preflight.json', '--state': 'run_state.json'},
            'scripts/claude_motion_review.py': {
                '--board': 'storyboard.json', '--film': 'film.mp4', '--out': 'motion-review', '--state': 'run_state.json'},
            'scripts/preship_compute.py': {}}
        if name not in definitions or not all(canonical(root, item, {item}) for item in (args[1], name)):
            return None
        expected = definitions[name]; values = {}; tail = iter(args[4:])
        for token in tail:
            flag, equal, value = token.partition('=')
            if flag not in expected or flag in values:
                return None
            value = value if equal else next(tail, '')
            if not canonical(root, value, {'out/dispatch/' + expected[flag]}):
                return None
            values[flag] = value
        required = ({'--board', '--film', '--out'} if name.endswith('claude_motion_review.py')
                    else {'--board'} if name.endswith('preflight_animatic.py') else set())
        if not required <= values.keys():
            return None
        effective = {'out/dispatch/' + value for value in expected.values()}
        effective |= {'out/dispatch/storyboard.json', 'out/dispatch/run_state.json'}
        if name.endswith('preflight_animatic.py'):
            effective |= {'out/dispatch/attention-review' + ext for ext in ('.json', '.png', '.html')}
        if name.endswith('preship_compute.py'):
            effective |= {'out/gates', 'out/dispatch/preship-compute', 'out/dispatch/film.mp4',
                          'out/dispatch/feed-composite.png', 'out/dispatch/feed-composite.json'}
        if any(not canonical(root, value, {value}) for value in effective):
            return None
        from capture_reservation import operation_for
        operation_for([command], root)
        return Path(name).name
    except (OSError, ValueError):
        return None


def workload(root, name, boards):
    from run_controller import board_runtime
    from claude_checkpoint import MAX_FILE, MAX_TOTAL
    from phone_review_storage import EXPECTED
    data = boards[0][1]
    runtimes = [board_runtime(board) for _, board in boards]
    if any(not math.isfinite(value) or value <= 0 for value in runtimes):
        raise ValueError('operation duration must be finite and positive')
    counts = [math.ceil(value * 30) for value in runtimes]
    frames = max(counts)
    if any(not 1 <= count <= 9004 for count in counts):
        raise ValueError('operation duration is outside the exercised 300 second route')
    scenes = len(data.get('scenes') or [])
    board_bytes = len(json.dumps(data).encode())
    events = len(data.get('attention_beats') or [])
    scene_sheet = math.ceil(scenes / 4) * 1440 * 844 * 4
    attention_sheet = math.ceil(events / 2) * 1440 * 380 * 4
    reports = 4 * board_bytes + MIB
    shots = len((data.get('film_direction') or {}).get('shots') or [])
    # Existing renderer inspects both formats against the same 9 MiB cap.
    batch = 60 * 9437184
    source = tree_bytes(Path(root) / 'video-engine/public') + tree_bytes(Path(root) / 'video-engine/src')
    if name == 'preflight_animatic.py':
        # Current JPEG/CRF32, 270x480 route, not a native full-frame sequence.
        working = batch
        retained = MAX_FILE + scene_sheet + attention_sheet + reports
        bundles = 2 * source  # bundle public copy plus cache/build copy
        dimensions = [270, 480]
    elif name == 'claude_motion_review.py':
        samples = math.ceil(frames / 6) + (0 if (frames - 1) % 6 == 0 else 1)
        retained = math.ceil(samples / 5) * EXPECTED['max_png_bytes'] + MIB + 4096
        working = bundles = 0  # decoder streams to memory; only PNG pages reach disk
        dimensions = [390, 693]
    elif name == 'preship_compute.py':
        # Each shot has black AND white native stills, even if exempt shots would
        # actually be skipped. Both diagnostic bundles may coexist until exit.
        working = 2 * shots * 9437184 + 10 * 270 * 480 * 4
        retained = 1350 * 960 * 4 + MAX_FILE  # feed sheet plus all reports/logs
        bundles = 4 * source
        dimensions = [1080, 1920]
    elif name == 'cinema_proof.py':
        # Three samples per scene, normal AND without-stage. Staging, cache and
        # canonical/failure copies coexist. Include silent+mixed staging, both
        # cache videos, canonical hero, PCM, board props and reports.
        stills = 6 * scenes * 9437184
        working = max(batch, 3 * stills)
        retained = 6 * MAX_FILE + 2 * board_bytes + reports
        bundles, dimensions = 2 * source, [1080, 1920]
    elif name == 'opening_compare.py':
        # Both previews and their inspections are retained; no full native movie.
        working = batch
        retained = sum(MAX_FILE + math.ceil(len(b.get('scenes') or []) / 4)*1440*844*4
                       + math.ceil(len(b.get('attention_beats') or []) / 2)*1440*380*4
                       + 4*len(json.dumps(b).encode()) + MIB for _, b in boards)
        bundles, dimensions = 2 * source, [270, 480]
    elif name == 'render_dispatch.sh':
        working = batch
        retained = 2 * MAX_FILE + (scenes + 2) * 9437184 + scene_sheet + attention_sheet + reports
        bundles, dimensions = 2 * source, [1080, 1920]
    else:
        # Existing proved native batches. The complete allowed checkpoint
        # package is a deliberately generous new-output allowance.
        working, retained, bundles, dimensions = batch, MAX_TOTAL, 2 * source, [1080, 1920]
    unique = (3 * MAX_FILE + 6 * scenes * 9437184 + 2 * board_bytes + reports
              if name == 'cinema_proof.py' else retained)
    costs = checkpoint_cost(root, unique)
    total = 5 * GIB + working + retained + bundles + costs['checkpoint_work_bytes']
    return {'dimensions': dimensions, 'frames': frames, 'working_bytes': working,
            'new_retained_bytes': retained, 'bundle_copy_bytes': bundles, **costs,
            'reserve_gib': 5, 'required_free_gib': math.ceil(total / GIB),
            'estimate_kind': 'measured-operation-cost-not-universal-hard-cap'}


def plan(root, commands, boards):
    from phone_review_storage import canonical
    if len(commands) != 1 or len(boards) != 1:
        return None
    name = parse(commands[0], root)
    if name is None or not canonical(root, str(boards[0][0]), {'out/dispatch/storyboard.json'}):
        return None
    if boards[0][1].get('cinematic_template') != 'directed-film-v2':
        return None
    try:
        from bounded_capture import verified
        bindings = verified(root)
        if name == 'claude_motion_review.py':
            from phone_review_storage import verified as sheets_verified
            sheets = sheets_verified(root)
            if sheets is None:
                return None
            bindings = {**(bindings or {}), **sheets} if bindings else None
        if bindings is None:
            return None
        return {'mode': MODE, 'operator': name, **workload(root, name, boards), 'bindings': bindings}
    except (OSError, ValueError, KeyError, TypeError, subprocess.SubprocessError):
        return None


def with_checkpoint_cost(root, profile, boards):
    """Keep existing non-checkpoint profiles; include durability for host editions."""
    from claude_checkpoint import required
    if not required(Path(root) / 'out/dispatch/run_state.json'):
        return profile
    costs = workload(root, profile['operator'], boards)
    if profile['mode'] == 'phone-review-sheets-v1':
        # Phone variants use the same bounded sheets, not a renderer or bundle.
        costs = workload(root, 'claude_motion_review.py', boards)
    return {**profile, **costs}


def runtime_check(root):
    """After hook consumption, before work: exact source, paths and free space."""
    from capture_guard import AUTHORIZATION
    path = Path(root) / AUTHORIZATION
    if not path.is_file():
        return
    auth = json.loads(path.read_text()); profile = (auth.get('headroom') or {}).get('storage_profile')
    if not profile or profile.get('mode') != MODE:
        return
    commands = auth.get('commands') or []
    boards = [(Path(root) / row['path'], json.loads((Path(root) / row['path']).read_text()))
              for row in auth.get('boards', [])]
    current = plan(root, [row['text'] for row in commands], boards)
    actual = 'bash scripts/run_with_env.sh python scripts/' + Path(sys.argv[0]).name
    actual += ' ' + shlex.join(sys.argv[1:])
    if (current is None or current != profile or parse(actual, root) != profile['operator']
            or Path.cwd().resolve() != Path(root).resolve()
            or len(commands) != 1 or not commands[0].get('consumed')
            or auth.get('bound', {}).get('capture_storage') != current['bindings']
            or shutil.disk_usage(root).free < current['required_free_gib'] * GIB):
        raise ValueError('operation storage source, invocation or current headroom changed')
