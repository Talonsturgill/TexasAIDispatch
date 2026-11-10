"""Fail-closed admission for the independently exercised bounded PNG renderer.

Legacy callers never receive a lower estimate. A proof binds the exact executable
closure; changing even one helper requires a new measured verification.
"""
import hashlib
import json
import math
import shlex
from pathlib import Path

POLICY = 'config/bounded_png_capture_v1.json'
PROOF = 'config/bounded_png_capture_proof_v1.json'
EXPECTED = {'schema': 'dispatch-bounded-png-capture/1', 'max_frames': 60,
            'width': 1080, 'height': 1920, 'fps': 30, 'image_format': 'png',
            'crf': 16, 'pixel_format': 'yuv420p', 'remotion_version': '4.0.399', 'max_png_bytes_per_frame': 9437184, 'reserve_gib': 5}
FILES = ('video-engine/scripts/bounded-png-render.mjs',
         'video-engine/scripts/render-batch.mjs', 'video-engine/scripts/credit-tail-render.mjs',
         'video-engine/package-lock.json', 'video-engine/package.json',
         'scripts/cinema_proof.py', 'scripts/opening_compare.py', 'scripts/render_dispatch.sh',
         'scripts/bounded_capture.py', 'scripts/native_headroom.py', 'scripts/capture_guard.py',
         'scripts/run_with_env.sh',
         'video-engine/scripts/verify-bounded-png.mjs',
         'video-engine/scripts/bounded-png-render.test.mjs', 'scripts/bounded_capture_test.py')
OPERATORS = {'cinema_proof.py': 'python', 'opening_compare.py': 'python', 'render_dispatch.sh': 'bash'}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def closure(root):
    root = Path(root)
    return {name: sha(root / name) for name in FILES}


def verified(root):
    root = Path(root)
    try:
        policy = json.loads((root / POLICY).read_text())
        proof = json.loads((root / PROOF).read_text())
        if (policy != EXPECTED or proof.get('schema') != 'dispatch-bounded-png-proof/1'
                or proof.get('verified') is not True or proof.get('policy_sha256') != sha(root / POLICY)
                or proof.get('files') != closure(root)):
            return None
        lock = json.loads((root / 'video-engine/package-lock.json').read_text())
        if lock['packages']['node_modules/@remotion/renderer']['version'] != EXPECTED['remotion_version']:
            return None
        return {**closure(root), POLICY: sha(root / POLICY), PROOF: sha(root / PROOF)}
    except (OSError, ValueError, KeyError, TypeError):
        return None


def operation(command, root):
    """Only literal single canonical wrapper invocations qualify, never shell programs."""
    root = Path(root).resolve()
    try:
        args = shlex.split(command)
        if len(args) < 4 or args[0] != 'bash' or args[1] != 'scripts/run_with_env.sh':
            return None
        if any(any(c in arg for c in '$`;&|<>\n') for arg in args):
            return None
        name = Path(args[3]).name
        if name not in OPERATORS or args[2] not in ({'python', 'python3'} if OPERATORS[name] == 'python' else {'bash'}):
            return None
        if (root / args[3]).resolve() != root / 'scripts' / name:
            return None
        # The existing prepared-operation parser independently checks the operator identity.
        from capture_reservation import operation_for
        operation_for([command], root)
        if name == 'cinema_proof.py':
            values = {'--board': 'storyboard.json', '--mix': 'mix.wav', '--state': 'run_state.json'}
            switches = set()
        elif name == 'opening_compare.py':
            values = {'--root': '', '--state': 'run_state.json'}
            switches = {'--retain-failed-inspection', '--combined-code-review', '--builder-proof'}
        else:
            values = {'--' + k: v for k, v in {
                'board':'storyboard.json','mix':'mix.wav','state':'run_state.json',
                'captions':'captions.json','preflight':'preflight.json','preflight-film':'preflight.mp4',
                'silent':'silent.mp4','film':'film.mp4','started':'render_started',
                'manifest':'render-manifest.json','rescue-report':'rescue.json'}.items()}
            switches = set()
        seen = set()
        tail = iter(args[4:])
        for token in tail:
            flag, equal, value = token.partition('=')
            if flag in seen:
                return None
            seen.add(flag)
            if flag in switches and not equal:
                continue
            if flag not in values:
                return None
            value = value if equal else next(tail, '')
            if not value or (root / value).resolve() != root / 'out/dispatch' / values[flag]:
                return None
        return name
    except (ValueError, OSError):
        return None


def plan(root, commands, boards):
    if len(commands) != 1:
        return None
    name = operation(commands[0], root)
    if name is None:
        return None
    expected = ({'out/dispatch/opening-a.json', 'out/dispatch/opening-b.json'}
                if name == 'opening_compare.py' else {'out/dispatch/storyboard.json'})
    root = Path(root).resolve()
    if len(boards) != len(expected) or {str(Path(p).resolve()) for p, _ in boards} != {str(root / p) for p in expected}:
        return None
    # Restrict admission to the modern route exercised by the proof. Other templates
    # and any future fallback retain the original full-frame headroom requirement.
    if any(b.get('cinematic_template') != 'directed-film-v2' for _, b in boards):
        return None
    bindings = verified(root)
    if bindings is None:
        return None
    # Incompressible PNG can exceed RGBA; include scanline/zlib/chunk overhead and
    # a full extra MiB per frame. The original five GiB reserve remains untouched.
    working = EXPECTED['max_frames'] * (EXPECTED['max_png_bytes_per_frame'])
    return {'mode': 'bounded-png-v1', 'operator': name, 'max_frames': 60,
            'required_free_gib': math.ceil(working / 1024**3 + 5),
            'reserve_gib': 5, 'bindings': bindings}


def main():
    import argparse
    parser = argparse.ArgumentParser(description='Verify the exact bounded-capture source proof without issuing permission.')
    parser.add_argument('--verify-proof', action='store_true', required=True)
    parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    if verified(root) is None:
        print('FAIL bounded capture proof is missing or stale; full-frame headroom remains required.')
        return 1
    print('PASS bounded capture proof matches policy, renderer, operators and verification assertions.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
