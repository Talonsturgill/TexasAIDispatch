"""Real grants preserve a missing-path forecast and add only one bound reconciliation."""
import copy
import json
import subprocess
import sys
import unittest
import five_round_fixture  # noqa: F401
from unittest.mock import patch

import autonomous_completion as completion
import capture_completion_budget as capture
import completion_forecast as forecast
import production_lifecycle as lifecycle
import run_controller as controller
import capture_completion_budget_test as fixtures


class ForecastReconciliationTest(unittest.TestCase):
    def setUp(self):
        fixture = fixtures.ComparisonCompletionBudgetTest()
        fixture.setUp()
        self.addCleanup(fixture.doCleanups)
        self.root, self.state, self.comparison = fixture.root, fixture.state, fixture.comparison
        self.original, self.report = fixture.original, fixture.report
        report = json.loads(self.report.read_text())
        report.pop('technical_repair')
        report['blocking_defects'] = ['The ending figure clips through the case.']
        report['modern_observations'] = {'film_sha256': report['film_sha256'],
                                         'finished_art': {'pass': False}}
        self.report.write_text(json.dumps(report) + '\n')
        plan = json.loads(self.original.read_text())
        source = self.root / 'video-engine/src/modern/episodes/2026-10-11/Film.tsx'
        source.parent.mkdir(parents=True)
        source.write_text('offline source fixture')
        baseline = self.root / 'source-baseline.tsx'
        baseline.write_bytes(source.read_bytes())
        plan.update(repair_scope='standard', failure_family='human-performance',
                    mechanism_id='attached-case-action-v1', resources={'reboards': 1},
                    failure_evidence_sha256=capture.sha(self.report.read_text()),
                    root_cause='The fixture ending uses an intersecting arm and case.',
                    mechanism_change='Replace the intersecting arm with an attached reachable joint.',
                    expected_visible_result='The independent viewer sees a continuous attached arm without overlap.',
                    changed_inputs=[{'path': str(source), 'before_path': str(baseline),
                                     'before_sha256': capture.sha(source.read_text())}])
        self.original.write_text(json.dumps(plan) + '\n')
        self.pregrant = controller.read_state(self.state)
        # Create a genuine historical three-preview grant under the original producer.
        with patch.object(forecast, 'admission_problems', return_value=[]):
            accepted, message = completion.grant_capacity(self.state, self.original)
        self.assertTrue(accepted, message)
        state = controller.read_state(self.state)
        self.parent_index = len(state['events']) - 1
        with patch.object(forecast, 'admission_problems', return_value=[]):
            accepted, message = lifecycle.begin_repair(self.state, self.original)
        self.assertTrue(accepted, message)
        self.assertTrue(controller.reserve(self.state, {'reboards': 1}, 'offline already charged builder')[0])
        self.before = controller.read_state(self.state)
        self.output = self.root / 'reconciliation.json'
        self.plan = forecast.prepare(self.state, self.parent_index, self.comparison, self.output)

    def test_real_cli_funds_complete_path_once_and_preserves_history(self):
        result = subprocess.run([sys.executable, str(forecast.REPO / 'scripts/run_controller.py'),
            '--state', str(self.state), 'completion-capacity', '--repair-plan', str(self.output)],
            capture_output=True, text=True)
        self.assertEqual(0, result.returncode, result.stdout + result.stderr)
        state = controller.read_state(self.state)
        row = state['events'][-1]
        self.assertEqual({'preflight_renders': 5, 'storyboard_critics': 1, 'full_renders': 1}, row['resource_increments'])
        self.assertEqual(self.before['events'], state['events'][:len(self.before['events'])])
        self.assertEqual(self.before['usage'], state['usage'])
        self.assertEqual(self.before['resource_envelope'], state['resource_envelope'])
        self.assertTrue(row['grants_no_review_approval'])
        self.assertEqual([], completion.replay(state)[1])
        self.assertEqual([], lifecycle.allowance_problems(state))
        original = self.state.read_bytes()
        self.assertFalse(completion.grant_capacity(self.state, self.output)[0])
        self.assertEqual(original, self.state.read_bytes())
        state['terminal_state'] = 'shipped'
        self.assertEqual([], completion.replay(state)[1])

    def test_new_ordinary_grant_refuses_the_missing_comparison_before_mutation(self):
        controller.save(self.state, self.pregrant)
        original = self.state.read_bytes()
        accepted, message = completion.grant_capacity(self.state, self.original)
        self.assertFalse(accepted)
        self.assertIn('complete two-treatment capture budget', message)
        self.assertEqual(original, self.state.read_bytes())

    def test_budget_cli_exposes_omission_and_new_complete_forecast_without_charging(self):
        original = self.state.read_bytes()
        cli = [sys.executable, str(forecast.REPO / 'scripts/run_controller.py'),
               '--state', str(self.state), 'production-budget', '--repair-plan']
        omitted = subprocess.run(cli + [str(self.original)], capture_output=True, text=True)
        self.assertEqual(1, omitted.returncode, omitted.stdout + omitted.stderr)
        self.assertIn('complete two-treatment capture budget', json.loads(omitted.stdout)['errors'][0])
        corrected = subprocess.run(cli + [str(self.output)], capture_output=True, text=True)
        self.assertEqual(1, corrected.returncode, corrected.stdout + corrected.stderr)
        budget = json.loads(corrected.stdout)
        self.assertEqual([], budget['errors'])
        self.assertEqual({'preflight_renders': 5, 'storyboard_critics': 1, 'full_renders': 1}, budget['deficits'])
        self.assertEqual(original, self.state.read_bytes())

    def test_new_complete_grant_passes_without_reconciliation(self):
        controller.save(self.state, self.pregrant)
        output = self.root / 'new-full-plan.json'
        capture.prepare_comparison(self.state, self.original, self.comparison, output)
        accepted, message = completion.grant_capacity(self.state, output)
        self.assertTrue(accepted, message)
        state = controller.read_state(self.state)
        budget = json.loads(state['events'][-1]['precheck_json'])
        self.assertEqual(8, budget['resources']['preflight_renders']['required'])
        self.assertEqual(4, budget['resources']['storyboard_critics']['required'])
        self.assertEqual([], completion.replay(state)[1])

    def test_new_source_repair_cannot_open_without_the_complete_profile(self):
        controller.save(self.state, self.pregrant)
        original = self.state.read_bytes()
        accepted, message = lifecycle.begin_repair(self.state, self.original)
        self.assertFalse(accepted)
        self.assertIn('complete two-treatment capture budget', message)
        self.assertEqual(original, self.state.read_bytes())

    def test_initial_code_repair_does_not_require_a_nonexistent_comparison(self):
        fresh = self.root / 'initial-run.json'
        self.assertTrue(controller.initialise(fresh, '2026-10-11-new', 'production')[0])
        state = controller.read_state(fresh)
        self.assertEqual([], forecast.admission_problems(state, json.loads(self.original.read_text())))
        self.assertTrue(forecast.admission_problems(self.pregrant, json.loads(self.original.read_text())))

    def test_any_later_paid_review_or_capture_refuses_reconciliation(self):
        for resource in ('storyboard_critics', 'preflight_renders', 'full_renders', 'audiovisual_reviews'):
            state = copy.deepcopy(self.before)
            controller.event(state, 'reserved', resources={resource: 1}, note='offline later attempt')
            self.assertFalse(forecast.eligible(state, self.plan, json.loads(self.report.read_text())))

    def test_changed_parent_policy_pair_or_report_refuses(self):
        for field in ('parent_grant_sha256', 'policy_json'):
            plan = copy.deepcopy(self.plan)
            plan[forecast.FIELD][field] += 'x'
            self.assertFalse(forecast.eligible(self.before, plan, json.loads(self.report.read_text())))
        report = json.loads(self.report.read_text())
        report['blocking_defects'] = ['different report']
        self.assertFalse(forecast.eligible(self.before, self.plan, report))
        (self.root / 'a.mp4').write_bytes(b'changed original comparison')
        original = self.state.read_bytes()
        self.assertFalse(completion.grant_capacity(self.state, self.output)[0])
        self.assertEqual(original, self.state.read_bytes())

    def test_ordinary_duplicate_failure_still_refuses(self):
        accepted, message = completion.grant_capacity(self.state, self.original)
        self.assertFalse(accepted)
        self.assertEqual(self.before, controller.read_state(self.state))


if __name__ == '__main__':
    unittest.main()
