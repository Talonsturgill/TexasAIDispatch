"""Planning-only regressions for the retained October 21 authoring failure."""
import copy
import json
from pathlib import Path
import unittest

import retime_feasibility as gate


def valid():
    return {
        'narration_picture': {'timing_mode': 'authored', 'clauses': [
            {'id': 'n1', 'scene_id': 's1', 'start_s': .1, 'end_s': 1.9},
            {'id': 'n2', 'scene_id': 's1', 'start_s': 2.1, 'end_s': 3.9}]},
        'scenes': [{'id': 's1', 'start_s': 0, 'duration_s': 4, 'visual_events': [
            {'id': 'e1', 'narration_id': 'n1', 'clause_fraction_start': 0,
             'clause_fraction_end': .5, 'at_s': .1, 'duration_s': .9},
            {'id': 'e2', 'narration_id': 'n1', 'clause_fraction_start': .5,
             'clause_fraction_end': 1, 'at_s': 1, 'duration_s': .9},
            {'id': 'e3', 'narration_id': 'n2', 'clause_fraction_start': 0,
             'clause_fraction_end': .5, 'at_s': 2.1, 'duration_s': .9}]}],
        'film_direction': {'shots': [
            {'id': 'wide', 'scene_id': 's1', 'narration_ids': ['n1'], 'event_id': 'e1'},
            {'id': 'detail', 'scene_id': 's1', 'narration_ids': ['n1'], 'event_id': 'e2'},
            {'id': 'answer', 'scene_id': 's1', 'narration_ids': ['n2'], 'event_id': 'e3'}]}}


class FeasibilityTest(unittest.TestCase):
    def test_original_approved_failure_collects_topology_and_duration(self):
        fixture = json.loads((Path(__file__).parent / 'fixtures' /
                              'retime_feasibility_2026_10_21.json').read_text())
        self.assertEqual(fixture['original_board_sha256'],
                         'ce491db1cc56620f11099690fce8d7d2c0edc034e836d00c66f8305a9d6a1b9d')
        board = fixture['original_s1_projection']
        before = copy.deepcopy(board)
        errors = gate.problems(board)
        self.assertTrue(any('s1-shot-1' in x and 'exactly one' in x for x in errors))
        self.assertTrue(any('n1a: no exclusive' in x for x in errors))
        self.assertTrue(any('s1-event-2' in x and '4.1s' in x for x in errors))
        self.assertTrue(any('window disagrees' in x for x in errors))
        self.assertEqual(board, before)

    def test_several_framings_per_clause_pass_without_mutation(self):
        board = valid()
        before = copy.deepcopy(board)
        self.assertEqual(gate.problems(board), [])
        self.assertEqual(board, before)

    def test_same_clause_shots_cannot_interleave_another_clause(self):
        board = valid()
        shots = board['film_direction']['shots']
        shots[1], shots[2] = shots[2], shots[1]
        self.assertTrue(any('reordered clause' in x for x in gate.problems(board)))

    def test_declared_short_duration_does_not_hide_long_projection(self):
        board = valid()
        row = board['narration_picture']['clauses'][0]
        row['end_s'] = 3
        event = board['scenes'][0]['visual_events'][0]
        event['clause_fraction_end'] = 1
        self.assertTrue(any('projected authored action duration 2.9s' in x
                            for x in gate.problems(board)))

    def test_unknown_event_clause_and_nonfinite_fraction_fail(self):
        board = valid()
        events = board['scenes'][0]['visual_events']
        events[0]['narration_id'] = 'missing'
        events[1]['clause_fraction_end'] = float('nan')
        errors = gate.problems(board)
        self.assertTrue(any('known narration clause' in x for x in errors))
        self.assertTrue(any('finite ordered' in x for x in errors))

    def test_measured_boards_are_left_to_strict_measured_gates(self):
        board = valid()
        board['narration_picture']['timing_mode'] = 'measured_caption_boundaries'
        board['film_direction']['shots'][0]['narration_ids'] = ['n1', 'n2']
        self.assertEqual(gate.problems(board), [])

    def test_future_authored_and_measured_checks_share_primary_deadlines(self):
        board = valid()
        board['date'] = '2026-10-22'
        clauses = board['narration_picture']['clauses']
        clauses[0]['event_ids'] = ['e1', 'e2']
        clauses[1]['event_ids'] = ['e1', 'e3']  # retain e1 after its completion
        self.assertEqual([], gate.problems(board))
        for mode in ('authored', 'measured_caption_boundaries'):
            late = copy.deepcopy(board)
            late['narration_picture']['timing_mode'] = mode
            late['scenes'][0]['visual_events'][0]['at_s'] = 2.3
            self.assertTrue(any('complete action leaves its primary' in e
                                for e in gate.problems(late)))

    def test_empty_authored_plan_is_not_feasible(self):
        self.assertTrue(gate.problems({'narration_picture': {'timing_mode': 'authored'}}))

    def test_picture_precheck_includes_gate_and_preserves_modern_check(self):
        import picture_precheck
        from unittest.mock import patch
        with patch.object(Path, 'read_text', return_value=json.dumps({'film_direction': {}})):
            names = [x[0] for x in picture_precheck.checks('board.json', 'claims.json')]
        self.assertIn('authored_retime_feasibility', names)
        self.assertIn('modern_film', names)


if __name__ == '__main__':
    unittest.main()
