"""Derive a current renderer test without rewriting the dated experiment."""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import re
import tempfile

from modern_film import REPO, renderer_inputs

FOLDER = Path('experiments/modern-film-2026-10-07')
FROZEN = {
    'board-a.json': '510480480671b3643c2d44bb5544ee8e45ac190ab25b09e7ad4fa466e5628960',
    'board-ci-2026-10-09-claude.json': 'b8f7ef16dc03787cc586be5bfd94393b33daef6f7dc6f2aeeca17bb0a5b4d398',
    'ci-fixture-2026-10-09-claude.json': '5c2f4ea3b8775e873b24d210ed7609f4ac9ac8dd09f0559f6ffb0946655d43de',
}
GLOBALS = frozenset(('video-engine/src/modern/registry.tsx',
                     'video-engine/src/modern/StoryArt.tsx',
                     'config/modern_episode_registry.json'))


def digest(data):
    return hashlib.sha256(data).hexdigest()


def bindings(rows):
    if not isinstance(rows, list) or not rows:
        raise ValueError('renderer inputs are missing')
    result = {}
    for row in rows:
        if (not isinstance(row, dict) or set(row) != {'path', 'sha256'}
                or not isinstance(row['path'], str) or not row['path']
                or row['path'] in result
                or not isinstance(row['sha256'], str)
                or not re.fullmatch(r'[0-9a-f]{64}', row['sha256'])):
            raise ValueError('invalid or duplicate renderer input')
        result[row['path']] = row['sha256']
    return result


def derive(baseline, inputs):
    original = baseline['film_direction']['renderer_inputs']
    before, after = bindings(original), bindings(inputs)
    if list(before) != list(after):
        raise ValueError('renderer input paths or order changed')
    changed = [{'path': path, 'before_sha256': value, 'current_sha256': after[path]}
               for path, value in before.items() if value != after[path]]
    if any(row['path'] not in GLOBALS for row in changed):
        raise ValueError('undeclared renderer bytes changed')
    board = copy.deepcopy(baseline)
    board['film_direction']['renderer_inputs'] = copy.deepcopy(inputs)
    return board, changed


def prepare(repo=REPO):
    root = Path(repo) / FOLDER
    original = {}
    for name, expected in FROZEN.items():
        data = (root / name).read_bytes()
        if digest(data) != expected:
            raise ValueError('frozen fixture bytes changed: ' + name)
        original[name] = json.loads(data)
    baseline = original['board-a.json']
    dated = original['board-ci-2026-10-09-claude.json']
    old_receipt = original['ci-fixture-2026-10-09-claude.json']
    expected, old_changed = derive(baseline, dated['film_direction']['renderer_inputs'])
    if dated != expected or old_receipt['changed_bindings'] != old_changed:
        raise ValueError('dated fixture changed outside its declared renderer bindings')
    board, changed = derive(baseline, renderer_inputs(baseline['film_direction']['episode'], repo=repo))
    data = (json.dumps(board, indent=2) + '\n').encode()
    # A sibling preserves the original relative artwork paths for every existing gate.
    with tempfile.NamedTemporaryFile(prefix='.board-ci-current-', suffix='.json', dir=root, delete=False) as f:
        f.write(data)
        path = Path(f.name)
    receipt = {'schema': 'dispatch-current-ci-fixture/1', 'frozen_files': FROZEN,
               'current_fixture_sha256': digest(data), 'changed_bindings': changed}
    path.with_suffix('.receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
    return path


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, default=REPO)
    args = parser.parse_args()
    print(prepare(args.repo))
