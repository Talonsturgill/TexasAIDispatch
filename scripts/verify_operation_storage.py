"""Real local Git checkpoint exercise. No production reservation or remote writes."""
import argparse
import json
from pathlib import Path
import random
import subprocess

import claude_checkpoint as checkpoint
import operation_storage as storage
import run_controller


def exercise(directory):
    directory = Path(directory).resolve(); directory.mkdir(parents=True, exist_ok=False)
    repo = directory/'fixture'; repo.mkdir()
    origin = directory/'origin.git'
    def git(*args):
        return subprocess.check_output(['git', '-C', str(repo), *args], stderr=subprocess.PIPE)
    git('init', '-q')
    git('config', 'user.name', 'Talon Sturgill')
    git('config', 'user.email', 'Talon.sturgill@gmail.com')
    subprocess.run(['git', 'init', '--bare', '-q', str(origin)], check=True)
    git('remote', 'add', 'origin', str(origin))
    (repo/'.gitignore').write_text('out/\n')
    source = repo/'video-engine/src'; source.mkdir(parents=True)
    (source/'fixture.ts').write_text('export const fixture = true;\n')
    (repo/'video-engine/public').mkdir()
    git('add', '.'); git('commit', '-qm', 'Engineering checkpoint cost fixture')
    package = repo/'out/dispatch'; package.mkdir(parents=True)
    state = package/'run_state.json'
    accepted, note = run_controller.initialise(state, '2026-08-01-storage-cost-fixture', 'rehearsal')
    if not accepted: raise ValueError(note)
    first = random.Random(173).randbytes(8*storage.MIB)
    (package/'evidence.bin').write_bytes(first)
    (package/'same-evidence.bin').write_bytes(first)
    before = storage.tree_bytes(repo/'.git/objects')
    saved = checkpoint.save(repo, state, 'first engineering fixture', environ={})
    manifest = json.loads(checkpoint.show(repo, saved['commit'],
        'checkpoints/2026-08-01-storage-cost-fixture/manifest.json'))
    if manifest['storage_accounting']['unique_blob_bytes'] != len(first):
        raise ValueError('checkpoint did not deduplicate identical retained bytes')
    if manifest['storage_accounting']['logical_bytes'] != 2*len(first):
        raise ValueError('logical checkpoint accounting changed')
    accepted, note = run_controller.reserve(state, {'preflight_renders': 1}, 'engineering cost fixture')
    if not accepted: raise ValueError(note)
    (package/'new-evidence.bin').write_bytes(random.Random(174).randbytes(8*storage.MIB))
    second = checkpoint.save(repo, state, 'changed engineering fixture', environ={})
    after = storage.tree_bytes(repo/'.git/objects')
    git('repack', '-ad')
    packed = storage.tree_bytes(repo/'.git/objects')
    prior = checkpoint.show(repo, saved['commit'],
        'checkpoints/2026-08-01-storage-cost-fixture/files/out/dispatch/evidence.bin')
    if prior != first or json.loads(state.read_text())['usage']['preflight_renders'] != 1:
        raise ValueError('checkpoint/repack changed evidence or its single charge')
    if after-before > 4*checkpoint.MAX_TOTAL or packed > after+storage.GIB:
        raise ValueError('local checkpoint fixture exceeded its conservative model')
    from bounded_capture import closure
    result = {'files': closure(Path(__file__).resolve().parents[1]), 'schema': 'dispatch-operation-storage-exercise/1',
        'scope': 'real temporary local Git remote, immutable evidence and monotonic charge; no production action',
        'checkpoint_fixture': {'first': saved, 'second': second, 'logical_bytes': 2*len(first),
            'unique_bytes': len(first), 'objects_before': before, 'objects_after': after,
            'objects_after_repack': packed, 'retained_evidence_unchanged': True, 'preflight_usage': 1},
        'checkpoint_policy': {'max_file_bytes': checkpoint.MAX_FILE, 'max_package_bytes': checkpoint.MAX_TOTAL},
        'limits': 'This is an operation estimate, not a hard cap on arbitrary remote-history growth or compiler output.'}
    target = directory/'exercise.json'; target.write_text(json.dumps(result, indent=2)+'\n')
    return target


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', type=Path, required=True)
    print(exercise(parser.parse_args().out))
