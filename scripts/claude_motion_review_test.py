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


class PhoneMotionReview(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import opening_compare
        cls.temp = tempfile.TemporaryDirectory(); cls.root = Path(cls.temp.name)
        cls.output = cls.root / 'openings'; cls.output.mkdir()
        cls.state = cls.root / 'run_state.json'
        cls.state.write_text(json.dumps({'run_id': '2026-10-15'}))
        options = []
        for key in ('a', 'b'):
            board, film = cls.output / (key + '.json'), cls.output / (key + '.mp4')
            board.write_text(json.dumps({'date': '2026-10-15', 'runtime_s': 1.4, 'credits_s': 0}))
            subprocess.run([motion.FFMPEG, '-v', 'error', '-f', 'lavfi', '-i',
                'testsrc2=size=270x480:rate=30:duration=1.4', '-c:v', 'libx264',
                '-preset', 'ultrafast', '-crf', '16', str(film)], check=True)
            report = cls.output / (key + '-inspection.json')
            report.write_text(json.dumps({'board_sha256': motion.digest(board), 'film_sha256': motion.digest(film),
                'renderer_sha256': None, 'inspector_sha256': opening_compare.inspection_producer(),
                'pass': True, 'problems': []}))
            options.append({'id': key, 'board': {'file': board.name, 'sha256': motion.digest(board)},
                'film': {'file': film.name, 'sha256': motion.digest(film)},
                'inspection': {'file': report.name, 'sha256': motion.digest(report)}})
        cls.comparison = cls.output / 'comparison.json'
        cls.comparison.write_text(json.dumps({'options': options, 'renderer_sha256': None}))
        cls.board, cls.film = cls.output / 'a.json', cls.output / 'a.mp4'
        cls.binding = motion.phone_inputs(cls.state, 'a', cls.board, cls.film)
        cls.index = motion.build(cls.board, cls.film, cls.output / 'motion-a', True, cls.binding)
        binding_b = motion.phone_inputs(cls.state, 'b', cls.output / 'b.json', cls.output / 'b.mp4')
        cls.index_b = motion.build(cls.output / 'b.json', cls.output / 'b.mp4', cls.output / 'motion-b', True, binding_b)

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def test_real_phone_clip_covers_complete_clock_and_final_frame(self):
        self.assertEqual(motion.problems(self.index, self.board, self.film, True, self.binding), [])
        data = json.loads(self.index.read_text())
        self.assertEqual(data['schema'], motion.PHONE_SCHEMA)
        self.assertEqual([s['frame'] for p in data['pages'] for s in p['samples']], [0, 6, 12, 18, 24, 30, 36, 41])

    def test_phone_clip_and_index_never_satisfy_native_final_profile(self):
        with self.assertRaisesRegex(ValueError, 'native portrait'):
            motion.problems(self.index, self.board, self.film)
        packet = {'board': {'path': str(self.board)}, 'film': {'path': str(self.film)},
                  'motion_sequence': {'path': str(self.index), 'sha256': motion.digest(self.index)}}
        with self.assertRaises(ValueError):
            claude_runtime.motion_inputs(packet)

    def test_midpoint_only_or_changed_comparison_is_refused(self):
        target = self.index.parent / 'sparse.json'; data = json.loads(self.index.read_text())
        data['pages'] = data['pages'][:1]; data['sample_count'] = 5
        target.write_text(json.dumps(data))
        self.assertTrue(motion.problems(target, self.board, self.film, True, self.binding))
        self.assertTrue(motion.problems(self.index, self.board, self.film, True, {**self.binding, 'comparison_sha256': '0'*64}))

    def test_wrong_option_terminal_and_failed_structural_evidence_refused(self):
        with self.assertRaisesRegex(ValueError, 'canonical'):
            motion.phone_inputs(self.state, 'b', self.board, self.film)
        original = self.state.read_bytes()
        try:
            self.state.write_text('{"run_id":"2026-10-15","terminal_state":"shipped"}')
            with self.assertRaisesRegex(ValueError, 'active edition'):
                motion.phone_inputs(self.state, 'a', self.board, self.film)
        finally:
            self.state.write_bytes(original)
        original = self.comparison.read_bytes()
        try:
            data = json.loads(original); data['options'][0]['inspection']['sha256'] = '0'*64
            self.comparison.write_text(json.dumps(data))
            with self.assertRaises(ValueError):
                motion.phone_inputs(self.state, 'a', self.board, self.film)
        finally:
            self.comparison.write_bytes(original)

    def test_packet_supplies_real_bindings_and_refuses_changed_rows(self):
        packet = self.root / 'base-packet.json'
        packet.write_text(json.dumps({'role': 'storyboard-critic', 'board': {'path': str(self.root/'storyboard.json')},
            'claims': {'path': str(self.root/'claims.json'), 'sha256': 'c'*64}, 'instructions': ''}))
        data = claude_runtime.phone_packet(packet, self.state, [self.index, self.index_b])
        claude_runtime.phone_review_inputs(data)
        self.assertEqual(data['phone_options'][0]['report_bindings']['reviewed_preflight_sha256'], motion.digest(self.film))
        self.assertEqual(data['phone_options'][0]['report_bindings']['story_review']['claims_sha256'], 'c'*64)
        data['phone_options'][0]['report_bindings']['concept_sha256'] = '0'*64
        with self.assertRaisesRegex(ValueError, 'bindings changed'):
            claude_runtime.phone_review_inputs(data)


if __name__ == '__main__':
    unittest.main()
