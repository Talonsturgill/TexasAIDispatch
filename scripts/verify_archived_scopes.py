"""Verify immutable shipped scope evidence with its authenticated release producer.

Current production still uses review_scope.py against the current renderer. This audit
resolves only completed archives under runs/, retaining the original code and receipt.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import tarfile
import tempfile

REPO = Path(__file__).resolve().parents[1]


def read(path):
    return json.loads(Path(path).read_text())


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def release_pin(root, repo=REPO):
    root, repo = Path(root).resolve(), Path(repo).resolve()
    if root.parent != repo / 'runs' or not re.fullmatch(r'\d{4}-\d{2}-\d{2}(?:-[a-z0-9-]+)?', root.name):
        raise ValueError('Only a dated durable archive can use historical verification')
    state = read(root / 'run_state.json'); shipment = read(root / 'shipment-public.json')
    scope = read(root / 'finished-art-scope.json')
    film_hash = digest(root / 'dispatch.mp4')
    if (state.get('terminal_state') != 'shipped' or state.get('run_id') != root.name
            or not shipment.get('verified_at') or not state.get('shipment')
            or any(value != film_hash for value in (state['deliverable']['film_sha256'],
                state['shipment']['film_sha256'], shipment['film_sha256'], scope['film_sha256']))):
        raise ValueError('Historical verification requires the exact accepted shipped film')
    for name, expected in scope['files'].items():
        if Path(name).name != name or digest(root / name) != expected:
            raise ValueError('Original archived scope input changed')
    pin = shipment['dispatch']['merge_sha']
    if not re.fullmatch(r'[a-f0-9]{40}', str(pin)):
        raise ValueError('Original release commit is missing or malformed')
    return pin, scope['producer_sha256']


def verify(root, repo=REPO):
    repo, root = Path(repo).resolve(), Path(root).resolve()
    pin, producer_hash = release_pin(root, repo)
    if subprocess.run(['git', 'cat-file', '-e', pin + '^{commit}'], cwd=repo,
                      stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode:
        subprocess.run(['git', 'fetch', '--no-tags', 'origin', pin], cwd=repo, check=True)
    producer = subprocess.check_output(['git', 'show', pin + ':scripts/review_scope.py'], cwd=repo)
    if hashlib.sha256(producer).hexdigest() != producer_hash:
        raise ValueError('Release producer differs from the sealed archived receipt')
    # No media copies and no checkout mutation. Only the original dependency source and
    # public assets are extracted; the verifier reads the actual current archive in place.
    paths = ['scripts', 'config', 'knowledge', 'video-engine/src', 'video-engine/public',
             'video-engine/scripts', 'video-engine/package-lock.json']
    with tempfile.TemporaryDirectory(prefix='dispatch-original-scope-') as temp:
        source = Path(temp); bundle = source / 'source.tar'
        with bundle.open('wb') as output:
            subprocess.run(['git', 'archive', pin, *paths], cwd=repo, stdout=output, check=True)
        with tarfile.open(bundle) as archive:
            archive.extractall(source, filter='data')
        bundle.unlink()
        if digest(source / 'scripts/review_scope.py') != producer_hash:
            raise ValueError('Extracted original producer bytes changed')
        subprocess.run([sys.executable, str(source / 'scripts/review_scope.py'),
                        '--out', str(root), '--verify'], cwd=source, check=True)
    print('Shipped archive verified against its exact original release:', root.name, pin)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=REPO / 'runs')
    args = parser.parse_args()
    if args.root.resolve() != REPO / 'runs':
        parser.error('The durable runs directory is the only historical audit boundary')
    for receipt in sorted(args.root.glob('*/finished-art-scope.json')):
        verify(receipt.parent)
