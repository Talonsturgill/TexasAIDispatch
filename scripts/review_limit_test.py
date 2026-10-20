"""Five real reservations are the end of editorial review, even after recovery."""
import copy
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import creative_release
import modern_film
import review_limit as limit
import run_controller as controller


class ReviewLimit(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.state = self.root / 'run_state.json'
        self.assertTrue(controller.initialise(self.state, '2026-10-20', 'production')[0])

    def charge(self, count=1, note='offline actual code/phone review attempt'):
        return controller.reserve(self.state, {'storyboard_critics': count}, note)

    def test_real_sixth_reservation_refuses_before_any_ledger_mutation(self):
        for name in ('code', 'phone', 'retry', 'consolidated correction', 'final timed phone'):
            accepted, message = self.charge(note=name)
            self.assertTrue(accepted, message)
        before = self.state.read_bytes()
        accepted, message = self.charge()
        self.assertFalse(accepted); self.assertIn('hard five-review', message)
        self.assertEqual(before, self.state.read_bytes())
        self.assertEqual(5, json.loads(before)['usage']['storyboard_critics'])

    def test_bulk_charge_cannot_cross_the_limit(self):
        self.assertTrue(self.charge(4)[0]); before = self.state.read_bytes()
        self.assertFalse(self.charge(2)[0]); self.assertEqual(before, self.state.read_bytes())
        self.assertTrue(self.charge()[0])

    def test_larger_ceilings_new_script_and_recovery_names_cannot_reset_counter(self):
        self.assertTrue(self.charge(5)[0])
        value = json.loads(self.state.read_text())
        value['limits']['storyboard_critics'] = 500
        value['escalation_ceiling']['storyboard_critics'] = 500
        value['events'].append({'kind': 'test_retained_source_pivot', 'new_script': 'new angle'})
        self.state.write_text(json.dumps(value)); before = self.state.read_bytes()
        for name in ('mandatory code', 'source pivot', 'process retry', 'owner capacity', 'review-context'):
            self.assertIn('hard five-review', self.charge(note=name)[1])
            self.assertEqual(before, self.state.read_bytes())

    def test_cap_closes_rebuild_and_all_creative_pivot_admission(self):
        self.assertTrue(self.charge(5)[0]); state = json.loads(self.state.read_text())
        for scope in ('standard', 'narration-performance', 'source-pivot'):
            self.assertTrue(limit.repair_problems(state, {'repair_scope': scope,
                'changed_inputs': [{'path': 'new-scene.tsx'}]}))
        self.assertTrue(limit.reservation_problems(state, {'reboards': 1}))
        self.assertTrue(limit.repair_problems(state, {'resources': {'storyboard_critics': 1}}))
        self.assertEqual([], limit.reservation_problems(state, {'full_renders': 1}))
        self.assertEqual([], limit.reservation_problems(state, {'audiovisual_reviews': 3}))
        self.assertEqual([], limit.reservation_problems(state, {'panel_rounds': 1, 'scorer_calls': 3}))

    def test_actual_completion_capacity_cannot_buy_a_sixth_attempt(self):
        import autonomous_completion
        self.assertTrue(self.charge(5)[0]); before = self.state.read_bytes()
        plan = self.root / 'completion.json'
        plan.write_text(json.dumps({'changed_inputs': [], 'resources': {'storyboard_critics': 1}}))
        accepted, message = autonomous_completion.grant_capacity(self.state, plan)
        self.assertFalse(accepted); self.assertIn('hard five-review', message)
        self.assertEqual(before, self.state.read_bytes())

    def test_history_keeps_counts_and_cloud_adoption_closes_an_old_overrun(self):
        value = json.loads(self.state.read_text()); value['run_id'] = '2026-10-19'
        value['usage']['storyboard_critics'] = 61
        with patch('publication_owner.enabled', return_value=False):
            self.assertFalse(limit.enabled(value))
        original = copy.deepcopy(value)
        with patch('publication_owner.enabled', return_value=True):
            self.assertTrue(limit.reached(value))
            self.assertTrue(limit.reservation_problems(value, {'storyboard_critics': 1}))
        self.assertEqual(original, value)
        value['terminal_state'] = 'shipped'
        self.assertFalse(limit.enabled(value))

    def test_diminishing_returns_preserve_the_final_review_path(self):
        self.assertTrue(self.charge(3)[0])
        value = json.loads(self.state.read_text())
        self.assertTrue(creative_release.finishing_required(value))
        self.assertEqual(2, limit.MAX_ROUNDS - limit.used(value))

    def test_surface_boundary_keeps_timed_observations_and_actual_action(self):
        board = {'date': '2026-10-20', 'runtime_s': 10, 'narration_picture': {'clauses': []}}
        report = {'film_sha256': 'a'*64, 'modern_observations': {'film_sha256': 'a'*64},
                  'narration_picture_observations': {'film_sha256': 'a'*64, 'clauses': []}}
        for name in modern_film.policy()['review_criteria']:
            report['modern_observations'][name] = {'pass': True, 'start_s': 1, 'end_s': 2,
                'observed': 'The actual current image shows the performed source-bound action clearly.'}
        report['modern_observations']['finished_art']['pass'] = False
        self.assertEqual([], modern_film.review_problems(board, report, _scope=False, _surface_deferred=True))
        self.assertTrue(modern_film.review_problems(board, report, _scope=False))
        for name in ('performed_turn', 'visual_progression', 'pace', 'closing_answer'):
            changed = copy.deepcopy(report); changed['modern_observations'][name]['pass'] = False
            self.assertTrue(modern_film.review_problems(board, changed, _scope=False, _surface_deferred=True))
        report['modern_observations']['finished_art']['start_s'] = -1
        self.assertTrue(modern_film.review_problems(board, report, _scope=False, _surface_deferred=True))

    def test_surface_classification_cannot_defer_motion_pacing_or_ending(self):
        board = {'date': '2026-10-20'}
        self.assertEqual([], modern_film.assessment_problems(board,
            {'defects': [{'category': 'surface_finish'}]}, _surface_deferred=True))
        for category in ('motion', 'pacing', 'ending_artistry'):
            self.assertTrue(modern_film.assessment_problems(board,
                {'defects': [{'category': category}]}, _surface_deferred=True))


if __name__ == '__main__':
    unittest.main()
