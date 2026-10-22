"""Exact retained October 21 clock regression; no rendering or model calls.

Unit tests isolate the projection from episode-file availability. The actual restored
edition must additionally run the unmocked modern, documentary and critic gates.
"""
import copy
import gzip
import json
from pathlib import Path
import unittest
from unittest.mock import patch

import board_retime
import art_direction
import critic_gate
import documentary_check
import measured_retime as adapter
import modern_film
import storyboard_check


class ApprovedMeasuredRetimeTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.files = json.loads(gzip.decompress((Path(__file__).parent /
            'fixtures/approved_retime_2026_10_21.json.gz').read_bytes()))

    def setUp(self):
        self.original = json.loads(self.files['opening-a.json'])
        self.captions = json.loads(self.files['captions.json'])
        self.words = json.loads(self.files['words.json'])
        self.report = json.loads(self.files['storyboard_critic.json'])
        # Asset-dependent checks are exercised in the actual restored edition, not
        # replaced in production. Clock, semantic identity and documentary checks run.
        self.gates = [patch.object(modern_film, 'problems', return_value=[]),
                      patch.object(modern_film, 'narration_problems', return_value=[]),
                      patch.object(art_direction, 'problems', return_value=[]),
                      patch.object(critic_gate, 'renderer_digest', return_value=self.report['renderer_sha256'])]
        for guard in self.gates:
            guard.start(); self.addCleanup(guard.stop)

    def prepared(self):
        return adapter.attach(copy.deepcopy(self.original), self.files['opening-a.json'],
                              self.files['storyboard_critic.json'])

    def projected(self):
        return adapter.compile(self.prepared(), self.captions, self.words)

    def test_exact_originals_and_real_clock_preserve_twenty_two_shots(self):
        self.assertEqual('ce491db1cc56620f11099690fce8d7d2c0edc034e836d00c66f8305a9d6a1b9d',
                         adapter.digest(self.files['opening-a.json']))
        self.assertEqual('08b4b02058545a30f45ca2881bc596e0b0ef9f725c709c8e4321b3eaebfc371a',
                         adapter.digest(self.files['storyboard_critic.json']))
        board = self.projected()
        self.assertEqual(22, len(board['film_direction']['shots']))
        self.assertEqual(adapter._semantic(self.original), adapter._semantic(board))
        self.assertEqual(self.report['concept_sha256'], critic_gate.concept_digest(board))
        self.assertEqual([], documentary_check.check(board))
        self.assertEqual([], storyboard_check.check(board))
        self.assertTrue(all(.2 <= e['duration_s'] <= 1.2
                            for s in board['scenes'] for e in s['visual_events']))
        self.assertEqual([], adapter.problems(board))
        self.assertEqual(self.files['storyboard_critic.json'], adapter.receipt(board)['critique_json'])

    def test_retime_and_recompile_are_idempotent(self):
        board = self.projected(); original = copy.deepcopy(board)
        modern_film.compile_narration(board, self.captions, self.words)
        self.assertEqual(original, board)
        board, errors = board_retime.retime(board, self.words['words'],
                narration_captions=self.captions, acoustic_words=self.words)
        self.assertEqual([], errors); self.assertEqual(original, board)

    def test_changed_view_binding_event_fraction_and_inserted_shot_are_refused(self):
        mutations = [lambda b: b['film_direction']['shots'][0].update(view='station-wide'),
            lambda b: b['film_direction']['shots'][0].update(narration_ids=['n1a']),
            lambda b: b['scenes'][0]['visual_events'][0].update(clause_fraction_end=.9),
            lambda b: b['film_direction']['shots'].append(copy.deepcopy(b['film_direction']['shots'][-1])),
            lambda b: b['film_direction'].update(closing_answer='A different final source conclusion.')]
        for change in mutations:
            with self.subTest(change=change):
                board = self.projected(); change(board)
                self.assertTrue(adapter.problems(board))
                with self.assertRaises(ValueError): critic_gate.concept_digest(board)

    def test_derived_shot_fraction_and_action_outputs_are_recomputed_not_ignored(self):
        for change in (lambda b:b['film_direction']['shots'][0].update(scene_fraction_end=.8),
                       lambda b:b['scenes'][0]['visual_events'][0].update(at_s=.01),
                       lambda b:b['scenes'][0]['visual_events'][0].update(duration_s=1.3),
                       lambda b:b['scenes'][0]['visual_events'][0].update(at_s_authored=.01)):
            board = self.projected(); change(board)
            self.assertTrue(adapter.problems(board))

    def test_changed_authored_fraction_is_not_admitted(self):
        board = copy.deepcopy(self.original)
        board['film_direction']['shots'][0]['scene_fraction_end'] = .6
        with self.assertRaisesRegex(ValueError, 'editorial anchors'):
            adapter.attach(board, self.files['opening-a.json'], self.files['storyboard_critic.json'])

    def test_original_report_bytes_and_acoustic_evidence_cannot_be_replaced(self):
        board = self.projected(); adapter.receipt(board)['critique_json'] += ' '
        self.assertTrue(adapter.problems(board))
        board = self.projected(); adapter.receipt(board)['words']['words'][0]['anchored_start'] = False
        self.assertTrue(adapter.problems(board))
        board = self.projected(); board['captions'][0]['text'] = 'Another claim.'
        self.assertTrue(adapter.problems(board))

    def test_original_gate_failures_are_not_swallowed(self):
        for gate in (modern_film.problems, modern_film.narration_problems):
            gate.return_value = ['required original gate failed']
            with self.assertRaisesRegex(ValueError, 'required original gate failed'):
                self.projected()
            gate.return_value = []

    def test_scene_floor_cannot_be_lowered_in_saved_provenance(self):
        board = self.projected(); adapter.receipt(board)['min_scene'] = .01
        self.assertTrue(adapter.problems(board))

    def test_changed_renderer_bytes_remain_a_failure(self):
        critic_gate.renderer_digest.return_value = '0' * 64
        with self.assertRaisesRegex(ValueError, 'different renderer bytes'):
            self.projected()

    def test_real_scene_ceiling_and_late_ending_are_solved_inside_measured_windows(self):
        board = self.projected()
        self.assertTrue(all(s['duration_s'] <= storyboard_check.HARD_MAX_SCENE_S for s in board['scenes']))
        changes = adapter.receipt(board)['scene_cut_adjustments']
        self.assertTrue(changes)
        for change in changes:
            lo, hi = change['measured_silence']
            self.assertLessEqual(lo, change['to_s']); self.assertLessEqual(change['to_s'], hi)
        final = board['scenes'][-1]
        self.assertGreaterEqual(final['visual_events'][-1]['at_s'],
                                final['duration_s']*storyboard_check.LATE_BEAT_FRACTION)
        self.assertEqual([], storyboard_check.check(board))

    def test_impossible_scene_ceiling_does_not_move_a_cut_into_spoken_words(self):
        board = {'runtime_s': 14, 'scenes': [
            {'id': 'a', 'start_s': 0, 'duration_s': 11},
            {'id': 'b', 'start_s': 11, 'duration_s': 3}],
            'narration_picture': {'clauses': [
                {'scene_id': 'a', 'start_s': .2, 'end_s': 10.5},
                {'scene_id': 'b', 'start_s': 11.5, 'end_s': 13.8}]}}
        with self.assertRaisesRegex(ValueError, 'unchanged scene limits'):
            adapter._constrain_scene_cuts(board, board_retime.MIN_SCENE_DEFAULT)


if __name__ == '__main__':
    unittest.main()
