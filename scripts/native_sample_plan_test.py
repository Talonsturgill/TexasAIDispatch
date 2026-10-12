"""Catch the observed two-event scene at code precheck, preserving the native floor."""
import contextlib
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest import mock

import modern_film_proof
import native_sample_plan as sampler
import picture_precheck


class NativePlanning(unittest.TestCase):
    def board(self):
        return modern_film_proof.board('a')

    def test_actual_directed_fixture_keeps_three_distinct_native_samples(self):
        board = self.board()
        result = sampler.plan(board)
        self.assertEqual(set(s['id'] for s in board['scenes']), set(result['samples']))
        self.assertTrue(all(len(set(v)) == 3 and v == sorted(v) for v in result['samples'].values()))
        self.assertFalse(result['capture'])
        self.assertFalse(result['approval'])

    def test_observed_two_event_scene_is_refused_without_lowering_the_sampler(self):
        board = self.board()
        board['scenes'][0]['visual_events'] = board['scenes'][0]['visual_events'][:2]
        with mock.patch('modern_film.problems', return_value=[]):
            with self.assertRaisesRegex(ValueError, 'unique complete current scene'):
                sampler.plan(board)

    def test_unadmitted_renderer_still_fails(self):
        board = self.board()
        board['film_direction']['renderer_inputs'] = []
        with self.assertRaisesRegex(ValueError, 'unadmitted directed'):
            sampler.plan(board)

    def test_cli_preserves_failure_and_modern_precheck_invokes_it(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'board.json'
            board = self.board()
            board['scenes'][0]['visual_events'] = board['scenes'][0]['visual_events'][:2]
            path.write_text(json.dumps(board))
            with contextlib.redirect_stderr(io.StringIO()), mock.patch('modern_film.problems', return_value=[]):
                self.assertEqual(1, sampler.main(['--board', str(path)]))
            tasks = dict(picture_precheck.checks(path, Path(folder) / 'claims.json'))
            self.assertEqual(['python', 'scripts/native_sample_plan.py', '--board', str(path.resolve())],
                             tasks['native_sample_plan'])


if __name__ == '__main__':
    unittest.main()
