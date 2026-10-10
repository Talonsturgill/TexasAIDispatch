"""Actual coverage failures fund review completion without buying approval or editing."""
import copy
from contextlib import redirect_stdout
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import autonomous_completion as capacity
import review_coverage as coverage
import run_controller as controller
import production_lifecycle as lifecycle
import repair_guard


class ReviewCoverageTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        cfg = self.root / 'config/autonomous_completion_coverage_v1.json'
        cfg.parent.mkdir()
        cfg.write_text(coverage.POLICY.read_text())
        self.start_patch(patch.object(coverage, 'POLICY', cfg))
        # Contract semantics have their own real suite; file/digest checks stay real here.
        self.required = self.start_patch(patch('agent_runtime.required_inputs'))
        self.state = self.root / 'state.json'
        self.assertTrue(controller.initialise(self.state, '2026-10-09-claude-pilot', 'production')[0])
        s = controller.read_state(self.state)
        capacity.adopt_code_policy(s)
        controller.save(self.state, s)
        self.assertTrue(controller.reserve(self.state, {'storyboard_critics': 4}, 'earlier charged work')[0])
        self.assertTrue(controller.reserve(self.state, {'storyboard_critics': 1}, 'original code review')[0])
        self.before = controller.read_state(self.state)
        self.report = self.make('report.json', {'reviewer_identity': 'independent Opus code critic',
            'limits': 'Not read in full: mandatory-guide.md.', 'verdict': {'a': 'pass', 'b': 'revise'}})
        self.renderer = self.make('video-engine/src/Episode.tsx', 'export const Episode = () => null;\n', text=True)
        renderer = [{'path': 'video-engine/src/Episode.tsx', 'sha256': coverage.digest(self.renderer)}]
        boards = [self.make(f'out/dispatch/{name}.json', {'date': '2026-10-09',
            'film_direction': {'version': 'directed-film-v2', 'variant': name, 'renderer_inputs': renderer}})
            for name in ('a', 'b', 'measured')]
        self.guide = self.make('mandatory-guide.md', 'The full current mandatory guide.\n', text=True)
        self.claims = self.make('claims.json', {'claims': [{'id': 'c1'}]})
        bound = lambda p: {'path': str(p), 'sha256': coverage.digest(p)}
        packet = {'role': 'storyboard-critic', 'date': '2026-10-09',
            'agent_assignment': {'model': 'claude-opus-5-5', 'effort': 'high'},
            'board': bound(boards[2]), 'claims': bound(self.claims),
            'treatments': [bound(x) for x in boards[:2]], 'asset_inputs': [bound(self.renderer)],
            'craft_readings': [bound(self.guide)]}
        self.old = self.make('original-packet.json', packet)
        self.current = self.make('current-packet.json', packet)
        index = len(self.before['events']) - 1
        self.receipt = self.make('receipt.json', {'schema': 'dispatch_review_coverage/1',
            'run_id': self.before['run_id'], 'agent_id': 'original_worker_18', 'role': 'code',
            'status': 'completed', 'provider_unavailable': False, 'model': 'claude-opus-5-5', 'effort': 'high',
            'action': 'SendMessage_same_id', 'director_identity': 'Sonnet director',
            'reviewer_identity': 'independent Opus code critic',
            'reported_limits': 'Not read in full: mandatory-guide.md.',
            'report_sha256': coverage.digest(self.report), 'reservation_event_index': index,
            'reservation_sha256': capacity.sha(capacity.canonical(self.before['events'][index])),
            'missing_inputs': [{**bound(self.guide), 'read_complete': False}]})
        self.plan = self.root / 'coverage-plan.json'
        coverage.prepare(self.state, self.receipt, self.report, self.old, self.current, self.plan)

    def start_patch(self, p):
        result = p.start(); self.addCleanup(p.stop); return result

    def make(self, name, data, text=False):
        p = self.root / name; p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(data if text else json.dumps(data)); return p

    def test_exact_one_deficit_preserves_frozen_history_and_protects_two_phones(self):
        before = self.state.read_bytes()
        budget = repair_guard.production_budget_precheck(self.before, review_coverage=True)
        self.assertEqual(budget['deficits'], {'storyboard_critics': 1})
        self.assertEqual(budget['resources']['reboards']['required'], 0)
        self.assertEqual(budget['resources']['storyboard_critics']['required'], 3)
        self.assertEqual(self.state.read_bytes(), before)
        ok, message = capacity.grant_capacity(self.state, self.plan)
        self.assertTrue(ok, message)
        s = controller.read_state(self.state)
        self.assertEqual(s['events'][:len(self.before['events'])], self.before['events'])
        self.assertEqual(s['usage'], self.before['usage'])
        self.assertEqual(s['resource_envelope'], self.before['resource_envelope'])
        self.assertEqual(s['phase'], self.before['phase'])
        grant = s['events'][-1]
        self.assertEqual(grant['resource_increments'], {'storyboard_critics': 1})
        self.assertTrue(grant['grants_no_review_approval'])
        self.assertEqual(capacity.replay(s)[1], [])
        self.assertEqual(lifecycle.allowance_problems(s), [])
        self.assertTrue(controller.reserve(self.state, {'storyboard_critics': 1}, 'actual same-ID full review')[0])
        s = controller.read_state(self.state)
        self.assertEqual(capacity.effective_envelope(s)['storyboard_critics'] - s['usage']['storyboard_critics'], 2)
        self.assertFalse(controller.finish(self.state, 'publishable')[0])

    def test_duplicate_renamed_plan_and_policy_mutation_rejected(self):
        self.assertTrue(capacity.grant_capacity(self.state, self.plan)[0])
        renamed = self.root / 'renamed.json'; renamed.write_bytes(self.plan.read_bytes())
        before = self.state.read_bytes()
        self.assertFalse(capacity.grant_capacity(self.state, renamed)[0])
        self.assertEqual(self.state.read_bytes(), before)
        s = controller.read_state(self.state)
        for field in ('policy_json', 'plan_json', 'failure_evidence_json', 'precheck_json'):
            changed = copy.deepcopy(s); changed['events'][-1][field] += ' '
            self.assertTrue(capacity.replay(changed)[1], field)
        changed = copy.deepcopy(s)
        changed['events'] = [e for e in changed['events'] if e['kind'] != coverage.ADOPTION]
        self.assertTrue(capacity.replay(changed)[1])

    def test_controller_budget_uses_coverage_route_before_and_after_exact_grant(self):
        for expected in (1, 0):
            before = self.state.read_bytes()
            output = io.StringIO()
            with patch('sys.argv', ['run_controller.py', '--state', str(self.state),
                                    'production-budget', '--repair-plan', str(self.plan)]), redirect_stdout(output):
                self.assertEqual(controller.main(), expected)
            result = json.loads(output.getvalue())
            self.assertEqual(result['path'], 'complete-review-coverage')
            self.assertEqual(result['resources']['storyboard_critics']['required'], 3)
            self.assertEqual(result['resources']['reboards']['required'], 0)
            self.assertEqual(self.state.read_bytes(), before)
            if expected:
                self.assertTrue(capacity.grant_capacity(self.state, self.plan)[0])

    def test_nested_handback_and_fresh_guides_preserve_production_and_old_packet(self):
        old_bytes = self.old.read_bytes()
        original_report = json.loads(self.report.read_text())
        self.report.write_text(json.dumps({'supported_handback': json.dumps(original_report)}))
        receipt = json.loads(self.receipt.read_text())
        receipt['report_sha256'] = coverage.digest(self.report)
        self.receipt.write_text(json.dumps(receipt))
        self.guide.write_text('The complete refreshed current mandatory guide.\n')
        current = json.loads(self.current.read_text())
        current['craft_readings'][0]['sha256'] = coverage.digest(self.guide)
        self.current.write_text(json.dumps(current))
        fresh = self.root / 'fresh-coverage-plan.json'
        coverage.prepare(self.state, self.receipt, self.report, self.old, self.current, fresh)
        self.assertEqual(self.old.read_bytes(), old_bytes)
        self.assertTrue(capacity.grant_capacity(self.state, fresh)[0])
        self.assertEqual(capacity.replay(controller.read_state(self.state))[1], [])

    def test_current_source_guide_claims_and_packets_cannot_drift(self):
        for p in (self.renderer, self.guide, self.claims, self.old, self.current):
            original = p.read_bytes(); p.write_bytes(original + b' ')
            before = self.state.read_bytes()
            self.assertFalse(capacity.grant_capacity(self.state, self.plan)[0], str(p))
            self.assertEqual(self.state.read_bytes(), before); p.write_bytes(original)

    def test_optional_self_review_changed_production_provider_and_missing_input_refused(self):
        original = json.loads(self.plan.read_text())
        edits = [lambda p: p.update(changed_inputs=[{'path': 'artist.tsx'}]),
                 lambda p: p.update(resources={'storyboard_critics': 50}),
                 lambda p: p.update(director_identity='independent Opus code critic')]
        for edit in edits:
            changed = copy.deepcopy(original); edit(changed)
            self.plan.write_text(json.dumps(changed))
            self.assertFalse(capacity.grant_capacity(self.state, self.plan)[0])
        for key, value in [('reported_limits', 'I read the full inputs; polish the card.'),
                           ('provider_unavailable', True), ('model', 'claude-haiku-5-5'),
                           ('effort', 'medium'), ('missing_inputs', []),
                           ('missing_inputs', [{'path': 'optional.md', 'sha256': 'a' * 64, 'read_complete': False}])]:
            changed = copy.deepcopy(original)
            receipt = json.loads(changed['coverage_evidence']['receipt_json']); receipt[key] = value
            text = json.dumps(receipt)
            changed['coverage_evidence'].update(receipt_json=text, receipt_sha256=capacity.sha(text))
            self.plan.write_text(json.dumps(changed))
            self.assertFalse(capacity.grant_capacity(self.state, self.plan)[0], key)

    def test_older_shipped_and_later_reviewer_charge_refused(self):
        for key, value in [('run_id', '2026-10-08'), ('terminal_state', 'shipped')]:
            s = copy.deepcopy(self.before); s[key] = value; controller.save(self.state, s)
            before = self.state.read_bytes()
            self.assertFalse(capacity.grant_capacity(self.state, self.plan)[0])
            self.assertEqual(self.state.read_bytes(), before)
        controller.save(self.state, self.before)
        self.assertTrue(controller.reserve(self.state, {'storyboard_critics': 1}, 'another actual reviewer')[0])
        self.assertFalse(capacity.grant_capacity(self.state, self.plan)[0])

    def test_prepare_cannot_overwrite_and_replay_survives_later_source_edits(self):
        with self.assertRaises(FileExistsError):
            coverage.prepare(self.state, self.receipt, self.report, self.old, self.current, self.plan)
        self.assertTrue(capacity.grant_capacity(self.state, self.plan)[0])
        self.renderer.write_text('export const Corrected = () => null;\n')
        self.assertEqual(capacity.replay(controller.read_state(self.state))[1], [])
        shipped = controller.read_state(self.state)
        shipped.update(terminal_state='shipped', phase='shipped')
        self.assertEqual(capacity.replay(shipped)[1], [])


if __name__ == '__main__':
    unittest.main()
