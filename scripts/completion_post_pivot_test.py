"""Two real planning debits must not strand the still-unedited exact-phone repair."""
import copy
import json
from pathlib import Path
import unittest
from unittest.mock import patch

import autonomous_completion as completion
import claude_checkpoint as checkpoint
import capture_completion_budget as capture
import capture_completion_budget_test as fixtures
import completion_forecast as forecast
import production_lifecycle as lifecycle
import run_controller as controller


class PostPivotForecast(unittest.TestCase):
    def setUp(self):
        fixture = fixtures.ComparisonCompletionBudgetTest()
        fixture.setUp(); self.addCleanup(fixture.doCleanups)
        self.root, self.state, self.comparison = fixture.root, fixture.state, fixture.comparison
        for context in (patch.object(forecast, 'REPO', self.root),
                        patch.object(completion, 'rejected_phone_binding_problems', return_value=[])):
            context.start(); self.addCleanup(context.stop)
        self.report = fixture.report
        report = json.loads(self.report.read_text())
        report.pop('technical_repair')
        report.pop('film_sha256')
        report.update(review_scope='exact-muted-phone-preflight',
            reviewed_preflight_sha256=capture.sha('actual offline phone fixture'),
            modern_observations={'film_sha256': capture.sha('actual offline phone fixture'), 'pace': {'pass': False}},
            blocking_defects=['One wide lot is held for too long; the declared close never appears.'])
        self.report.write_text(json.dumps(report) + '\n')
        source = self.root / 'video-engine/src/modern/episodes/2026-10-11/Film.tsx'
        source.parent.mkdir(parents=True); source.write_text('retained pre-correction source\n')
        baseline = self.root / 'source-before.tsx'; baseline.write_bytes(source.read_bytes())
        self.source, self.baseline = source, baseline
        state = controller.read_state(self.state)
        for i in (1, 2):
            controller.event(state, 'repair_started', repair_scope='standard', failure_family='human-performance',
                mechanism_id='old-' + str(i), failure_sha256=str(i) * 64,
                plan_sha256='a' * 64, baselines=[{'path': str(source), 'before_sha256': capture.sha(source.read_text())}])
        controller.save(self.state, state)
        plan = {'director_identity': 'director', 'repair_scope': 'standard',
            'failure_family': 'human-performance', 'mechanism_id': 'fixed-landmarks-and-new-close',
            'failed_film_sha256': report['reviewed_preflight_sha256'],
            'failure_evidence': str(self.report), 'failure_evidence_sha256': capture.sha(self.report.read_text()),
            'resources': {'reboards': 1}, 'root_cause': 'The source motion and close framing are absent.',
            'changed_inputs': [{'path': str(source), 'before_path': str(baseline), 'before_sha256': capture.sha(source.read_text())}],
            'repair': 'Move the subject past fixed landmarks and stage a distinct foreground view.',
            'mechanism_change': 'Use displacement relative to fixed landmarks and a new foreground composition.',
            'expected_visible_result': 'The subject visibly travels and the close shows new content.'}
        self.original = self.root / 'original-phone-plan.json'
        self.original.write_text(json.dumps(plan) + '\n')
        accepted, message = completion.grant_capacity(self.state, self.original)
        self.assertTrue(accepted, message)
        self.parent = len(controller.read_state(self.state)['events']) - 1
        for note in ('charged independent first pivot', 'charged independent replacement pivot'):
            self.assertTrue(controller.reserve(self.state, {'storyboard_critics': 1}, note)[0])
        self.pivot = self.root / 'pivot-pass.json'
        self.pivot.write_text(json.dumps({'verdict': 'pass', 'reviewer_identity': 'independent-opus',
            'retired_mechanism_id': 'old-1', 'replacement_mechanism_id': plan['mechanism_id'],
            'reviewed_failure_sha256': ['1' * 64, '2' * 64],
            'visible_difference': 'A locked camera and distinct foreground composition replace the previous following camera and relabel.',
            'source_basis': 'The retained source supports the current carrying the subject and the interim measures.'}) + '\n')
        plan.update(changed_inputs=[{'path': str(source), 'before_path': str(baseline),
                                    'before_sha256': capture.sha(source.read_text())}],
                    pivot_review={'path': str(self.pivot), 'sha256': capture.sha(self.pivot.read_text())})
        self.repair = self.root / 'passed-pivot-repair.json'; self.repair.write_text(json.dumps(plan) + '\n')
        self.before = controller.read_state(self.state)
        self.output = self.root / 'post-pivot-capacity.json'

    def prepare(self):
        return forecast.prepare(self.state, self.parent, self.comparison, self.output, self.repair)

    def test_actual_underfunding_then_real_reconciliation_and_repair_admission(self):
        self.assertEqual(1, completion.effective_envelope(self.before)['storyboard_critics'] - self.before['usage']['storyboard_critics'])
        with patch.object(forecast, 'admission_problems', return_value=[]):
            self.assertFalse(lifecycle.begin_repair(self.state, self.repair)[0])
        plan = self.prepare()
        before_files = (self.report.read_bytes(), self.pivot.read_bytes(), self.source.read_bytes())
        accepted, message = completion.grant_capacity(self.state, self.output)
        self.assertTrue(accepted, message)
        state = controller.read_state(self.state); grant = state['events'][-1]
        self.assertEqual(5, grant['resource_increments']['storyboard_critics'])
        self.assertEqual(self.before['events'], state['events'][:len(self.before['events'])])
        self.assertEqual(self.before['usage'], state['usage'])
        self.assertEqual(self.before['resource_envelope'], state['resource_envelope'])
        self.assertEqual(before_files, (self.report.read_bytes(), self.pivot.read_bytes(), self.source.read_bytes()))
        self.assertTrue(grant['grants_no_review_approval'])
        self.assertEqual([], completion.replay(state)[1])
        projected, roots = checkpoint.public_projection(state, self.root)
        restored = checkpoint.restored_ledger(projected, self.root,
            {'repo_root': str(self.root), 'grant_origin_roots': roots})
        self.assertEqual(grant['plan_json'], restored['events'][-1]['plan_json'])
        self.assertEqual([], completion.replay(restored)[1])
        # Two retained actual incidents can be honestly debited without consuming the code/phone path.
        for note in ('late debit: retained actual retry incident one', 'late debit: retained actual retry incident two'):
            self.assertTrue(controller.reserve(self.state, {'storyboard_critics': 1}, note)[0])
        accepted, message = lifecycle.begin_repair(self.state, Path(plan[forecast.FIELD]['repair_plan_path']))
        self.assertTrue(accepted, message)
        self.assertEqual([], completion.replay(controller.read_state(self.state))[1])

    def test_duplicate_reconciliation_preserves_bytes_and_original_policy(self):
        original_policy = forecast.POLICY.read_bytes()
        self.prepare(); self.assertTrue(completion.grant_capacity(self.state, self.output)[0])
        before = self.state.read_bytes()
        self.assertFalse(completion.grant_capacity(self.state, self.output)[0])
        self.assertEqual(before, self.state.read_bytes())
        self.assertEqual(original_policy, forecast.POLICY.read_bytes())

    def test_capture_or_reboard_after_original_grant_is_ineligible(self):
        plan = self.prepare(); report = json.loads(self.report.read_text())
        for resource in ('preflight_renders', 'full_renders', 'reboards', 'audiovisual_reviews'):
            state = copy.deepcopy(self.before)
            controller.event(state, 'reserved', resources={resource: 1}, note='later execution fixture')
            self.assertFalse(forecast.eligible(state, plan, report))

    def test_changed_pivot_baseline_or_parent_is_refused(self):
        plan = self.prepare(); report = json.loads(self.report.read_text())
        changed = copy.deepcopy(plan); changed[forecast.FIELD]['parent_grant_sha256'] += 'x'
        self.assertFalse(forecast.eligible(self.before, changed, report))
        changed = copy.deepcopy(plan); changed[forecast.FIELD]['pivot_review_json'] += ' '
        self.assertFalse(forecast.eligible(self.before, changed, report))
        self.source.write_text('already edited source')
        before = self.state.read_bytes()
        self.assertFalse(completion.grant_capacity(self.state, self.output)[0])
        self.assertEqual(before, self.state.read_bytes())

    def test_future_phone_planning_grant_requires_complete_comparison_before_first_grant(self):
        plan = json.loads(self.original.read_text())
        plan['changed_inputs'] = []
        future = {'run_id': '2026-10-21', 'events': []}
        self.assertTrue(forecast.admission_problems(future, plan))
        self.assertFalse(plan.get('changed_inputs'))


if __name__ == '__main__':
    unittest.main()
