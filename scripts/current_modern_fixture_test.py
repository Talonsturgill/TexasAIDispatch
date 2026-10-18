"""Current CI keeps the frozen experiment and rejects unrelated input drift."""
import copy
import json
from pathlib import Path
import tempfile
import unittest

import current_modern_fixture as fixture


class CurrentFixture(unittest.TestCase):
    def setUp(self):
        self.baseline = json.loads((fixture.REPO / fixture.FOLDER / 'board-a.json').read_text())
        self.inputs = copy.deepcopy(self.baseline['film_direction']['renderer_inputs'])

    def test_only_declared_global_changes_are_derived(self):
        for row in self.inputs:
            if row['path'] in fixture.GLOBALS:
                row['sha256'] = 'a' * 64
        before = copy.deepcopy(self.baseline)
        board, changed = fixture.derive(self.baseline, self.inputs)
        self.assertEqual({r['path'] for r in changed}, fixture.GLOBALS)
        self.assertEqual(self.baseline, before)
        board['film_direction']['renderer_inputs'] = before['film_direction']['renderer_inputs']
        self.assertEqual(board, before)

    def test_added_removed_reordered_duplicate_and_unknown_bytes_fail(self):
        variants = [self.inputs + [{'path': 'unknown.tsx', 'sha256': 'a' * 64}],
                    self.inputs[:-1], list(reversed(self.inputs)), self.inputs + [self.inputs[0]]]
        unknown = copy.deepcopy(self.inputs)
        next(r for r in unknown if r['path'] not in fixture.GLOBALS)['sha256'] = 'b' * 64
        variants.append(unknown)
        for rows in variants:
            with self.subTest(rows=rows), self.assertRaises(ValueError):
                fixture.derive(self.baseline, rows)

    def test_actual_current_fixture_preserves_frozen_files_and_relative_paths(self):
        root = fixture.REPO / fixture.FOLDER
        before = {name: (root / name).read_bytes() for name in fixture.FROZEN}
        path = fixture.prepare()
        try:
            self.assertEqual(path.parent, root)
            current = json.loads(path.read_text())
            current['film_direction']['renderer_inputs'] = self.inputs
            self.assertEqual(current, self.baseline)
            self.assertEqual(before, {name: (root / name).read_bytes() for name in before})
            self.assertEqual(json.loads(path.with_suffix('.receipt.json').read_text())['current_fixture_sha256'],
                             fixture.digest(path.read_bytes()))
        finally:
            path.unlink()
            path.with_suffix('.receipt.json').unlink()

    def test_each_frozen_file_tamper_fails_before_output(self):
        for changed in fixture.FROZEN:
            with self.subTest(file=changed), tempfile.TemporaryDirectory() as directory:
                repo = Path(directory)
                root = repo / fixture.FOLDER
                root.mkdir(parents=True)
                for name in fixture.FROZEN:
                    data = (fixture.REPO / fixture.FOLDER / name).read_bytes()
                    (root / name).write_bytes(data + (b' ' if name == changed else b''))
                with self.assertRaisesRegex(ValueError, 'frozen fixture bytes changed'):
                    fixture.prepare(repo)
                self.assertEqual(set(p.name for p in root.iterdir()), set(fixture.FROZEN))


if __name__ == '__main__':
    unittest.main()
