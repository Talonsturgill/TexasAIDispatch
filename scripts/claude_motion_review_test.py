"""Real encoded-film coverage and refusal tests; no model or provider calls."""
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

import numpy as np
from PIL import Image
import claude_motion_review as motion
import capture_guard
import claude_runtime
from preflight_animatic import frame


class MotionReview(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(); cls.root = Path(cls.temp.name)
        cls.film = cls.root/'film.mp4'; cls.board = cls.root/'board.json'
        cls.board.write_text(json.dumps({'runtime_s': 1.4, 'credits_s': 0}))
        subprocess.run([motion.FFMPEG, '-v', 'error', '-f', 'lavfi', '-i',
            'testsrc2=size=1080x1920:rate=30:duration=1.4', '-c:v', 'libx264',
            '-preset', 'ultrafast', '-crf', '16', str(cls.film)], check=True)
        cls.index = motion.build(cls.board, cls.film, cls.root/'sequence')

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def copied(self):
        data = json.loads(self.index.read_text()); target = self.index.parent/'test-index.json'
        target.write_text(json.dumps(data)); return target, data

    def test_real_native_clip_covers_whole_clock_and_final_frame(self):
        data = json.loads(self.index.read_text())
        self.assertEqual(motion.problems(self.index, self.board, self.film), [])
        actual = [s['frame'] for p in data['pages'] for s in p['samples']]
        self.assertEqual(actual, [0, 6, 12, 18, 24, 30, 36, 41])
        self.assertEqual(data['sample_count'], 8)
        self.assertIn('No authored rerender', data['basis'])
        self.assertNotIn('pass', data)

    def test_pixels_are_decoded_from_film(self):
        page = json.loads(self.index.read_text())['pages'][0]
        with Image.open(self.index.parent/page['file']) as image:
            actual = np.asarray(image.crop((10, 60, 400, 753)))
        np.testing.assert_array_equal(actual, frame(self.film, 0, 390, 693))

    def test_reordered_or_missing_samples_are_refused(self):
        target, data = self.copied()
        data['pages'][0]['samples'].reverse(); target.write_text(json.dumps(data))
        self.assertTrue(motion.problems(target, self.board, self.film))
        data['pages'][0]['samples'].pop(); target.write_text(json.dumps(data))
        self.assertTrue(motion.problems(target, self.board, self.film))

    def test_timestamps_cannot_be_retimed(self):
        target, data = self.copied(); data['pages'][0]['samples'][0]['at_s'] = .1
        target.write_text(json.dumps(data))
        self.assertTrue(motion.problems(target, self.board, self.film))

    def test_changed_source_or_page_bytes_are_refused(self):
        other = self.root/'other-board.json'; other.write_text('{"runtime_s":1.39}')
        self.assertTrue(motion.problems(self.index, other, self.film))
        target, data = self.copied(); data['pages'][0]['sha256'] = '0'*64
        target.write_text(json.dumps(data))
        self.assertTrue(motion.problems(target, self.board, self.film))

    def test_page_path_cannot_escape_sequence(self):
        target, data = self.copied(); data['pages'][0]['file'] = '../film.mp4'
        target.write_text(json.dumps(data))
        self.assertTrue(motion.problems(target, self.board, self.film))

    def test_outputs_cannot_overwrite_original_sequence(self):
        with self.assertRaises(FileExistsError):
            motion.build(self.board, self.film, self.index.parent)

    def test_refused_entry_charge_prevents_decode(self):
        args = ['--board', str(self.board), '--film', str(self.film), '--out', str(self.root/'blocked')]
        state = {'deliverable': {'review_only': False, 'film_sha256': motion.digest(self.film),
                                'board_sha256': motion.digest(self.board)}}
        with patch('run_controller.read_state', return_value=state), \
             patch('run_controller.reserve', return_value=(False, 'actual budget refusal')), \
             patch.object(motion, 'build', side_effect=AssertionError('decode started')):
            self.assertEqual(motion.main(args), 1)

    def test_unregistered_or_terminal_film_cannot_start_extraction(self):
        args = ['--board', str(self.board), '--film', str(self.film), '--out', str(self.root/'blocked')]
        for state in ({}, {'terminal_state': 'shipped'}):
            with patch('run_controller.read_state', return_value=state), \
                 patch('run_controller.reserve', side_effect=AssertionError('spent')):
                self.assertEqual(motion.main(args), 1)

    def test_verify_does_not_spend_or_capture(self):
        args = ['--board', str(self.board), '--film', str(self.film), '--out', str(self.index.parent), '--verify']
        with patch('run_controller.reserve', side_effect=AssertionError('spent')):
            self.assertEqual(motion.main(args), 0)
        command = 'bash scripts/run_with_env.sh python scripts/claude_motion_review.py --board b.json --film f.mp4 --out motion'
        self.assertTrue(capture_guard.is_capture(command))
        self.assertFalse(capture_guard.is_capture(command+' --verify'))
        self.assertTrue(capture_guard.capture_problems(command, None, '.', '.'))

    def test_final_assignment_requires_bound_complete_sequence(self):
        packet = {'board': {'path': str(self.board)}, 'film': {'path': str(self.film)}}
        with self.assertRaisesRegex(ValueError, 'motion-image access'):
            claude_runtime.motion_inputs(packet)
        packet['motion_sequence'] = {'path': str(self.index), 'sha256': motion.digest(self.index)}
        claude_runtime.motion_inputs(packet)
        packet['motion_sequence']['sha256'] = '0'*64
        with self.assertRaisesRegex(ValueError, 'index changed'):
            claude_runtime.motion_inputs(packet)


if __name__ == '__main__':
    unittest.main()
