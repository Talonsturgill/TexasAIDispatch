"""Retain the actual unused rights charge; reject a reset, extra grant or reused receipt."""
import copy
import json
import tempfile
import unittest
import subprocess
import sys
import os
from pathlib import Path

import autonomous_completion as capacity
import production_lifecycle as lifecycle
import rights_repair_precharge as recovery
import run_controller as controller


class UnusedRightsReboard(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory(); self.addCleanup(temp.cleanup)
        self.root = Path(temp.name); self.scratch = self.root / 'out/dispatch'
        self.scratch.mkdir(parents=True)
        self.state = self.scratch / 'run_state.json'
        self.assertTrue(controller.initialise(self.state, '2026-10-15', 'production')[0])
        state = controller.read_state(self.state)
        for name in capacity.MAX_REQUIRED:
            state['usage'][name] = state['resource_envelope'][name]
        controller.event(state, 'reserved', resources={k: state['usage'][k] for k in capacity.MAX_REQUIRED},
                         note='offline fixture representing previously charged production')
        controller.save(self.state, state)
        self.original_envelope = copy.deepcopy(state['resource_envelope'])
        finding = {'criterion': 'rights', 'problem': 'The current film omits the mixed recording attribution.'}
        self.failure = self.scratch / 'classification.json'
        self.failure.write_text(json.dumps({'verdict': 'revise', 'reviewer_identity': 'independent-critic',
            'film_sha256': 'a' * 64, 'blocking_defects': [finding],
            'technical_repair': {'findings': [{'finding': finding, 'category': 'rights'}]}}))
        source = self.scratch / 'storyboard.json'; source.write_text('{"credits":"SOURCE"}')
        baseline = self.scratch / 'storyboard.before.json'; baseline.write_bytes(source.read_bytes())
        self.plan = self.scratch / 'plan.json'
        self.plan.write_text(json.dumps({'director_identity': 'director', 'repair_scope': 'technical-integrity',
            'mechanism_id': 'licensed-endcard-credit', 'failure_family': 'rights',
            'failed_film_sha256': 'a' * 64, 'failure_evidence': str(self.failure),
            'failure_evidence_sha256': controller.digest(self.failure),
            'root_cause': 'The mixed recording has no generated attribution on the current end card.',
            'repair': 'Add the exact generated music attribution to the current end-card data only.',
            'mechanism_change': 'The existing credit tail now performs the complete licensed attribution.',
            'expected_visible_result': 'The source and music artist attribution are readable in the credit tail.',
            'changed_inputs': [{'path': str(source), 'before_path': str(baseline),
                                'before_sha256': controller.digest(baseline)}],
            'resources': {'reboards': 1, 'preflight_renders': 2, 'full_renders': 1,
                          'audiovisual_reviews': 4, 'panel_rounds': 1, 'scorer_calls': 3}}))
        accepted, message = capacity.grant_capacity(self.state, self.plan); self.assertTrue(accepted, message)
        self.assertTrue(controller.reserve(self.state, {'reboards': 1}, 'unused charge after refused begin fixture')[0])
        self.before = copy.deepcopy(controller.read_state(self.state))
        self.receipt = recovery.event_sha(self.before['events'][-1])

    def test_same_funded_failure_cannot_buy_more_capacity(self):
        before = self.state.read_bytes()
        self.assertFalse(capacity.grant_capacity(self.state, self.plan)[0])
        self.assertEqual(before, self.state.read_bytes())

    def test_new_rights_grant_records_all_four_actual_capture_operators(self):
        import capture_completion_budget as capture
        state = controller.read_state(self.state)
        row = next(e for e in reversed(state['events']) if e.get('kind') == capacity.EVENT)
        budget = json.loads(row['precheck_json'])
        self.assertEqual(budget['resources']['preflight_renders']['required'], 4)
        self.assertEqual(row['resource_increments']['preflight_renders'], 4)
        self.assertEqual(row[capture.RIGHTS_FIELD], budget[capture.RIGHTS_FIELD])
        self.assertEqual(sum(json.loads(row[capture.RIGHTS_FIELD]['policy_json'])['preflight_operators'].values()), 4)
        self.assertEqual(self.original_envelope, state['resource_envelope'])
        self.assertEqual([], capacity.replay(state)[1])
        for mutation in ('policy', 'missing-profile'):
            changed = copy.deepcopy(state)
            event = next(e for e in reversed(changed['events']) if e.get('kind') == capacity.EVENT)
            if mutation == 'policy': event[capture.RIGHTS_FIELD]['policy_json'] += ' '
            else: event.pop(capture.RIGHTS_FIELD)
            self.assertTrue(capacity.replay(changed)[1], mutation)

    def test_historical_three_unit_rights_grant_keeps_its_exact_replay(self):
        import capture_completion_budget as capture
        from unittest.mock import patch
        path = self.scratch / 'legacy-count-state.json'
        self.assertTrue(controller.initialise(path, '2026-10-15-legacy-count-fixture', 'production')[0])
        state = controller.read_state(path)
        for name in capacity.MAX_REQUIRED:
            state['usage'][name] = state['resource_envelope'][name]
        controller.event(state, 'reserved', resources={k: state['usage'][k] for k in capacity.MAX_REQUIRED},
                         note='offline legacy charged history fixture')
        controller.save(path, state); original = copy.deepcopy(state)
        # Reproduce the earlier producer; the new replay must not reinterpret its count.
        with patch.object(capture, 'live_budget_state', side_effect=lambda s, p: copy.deepcopy(s)):
            accepted, message = capacity.grant_capacity(path, self.plan)
        self.assertTrue(accepted, message)
        legacy = controller.read_state(path); row = legacy['events'][-1]
        self.assertNotIn(capture.RIGHTS_FIELD, row)
        self.assertEqual(json.loads(row['precheck_json'])['resources']['preflight_renders']['required'], 3)
        self.assertEqual(legacy['events'][:len(original['events'])], original['events'])
        self.assertEqual(legacy['usage'], original['usage'])
        self.assertEqual([], capacity.replay(legacy)[1])

    def test_actual_budget_cli_reports_four_operators_and_the_exact_prepaid_receipt(self):
        self.assertTrue(lifecycle.begin_repair(self.state, self.plan, prepaid_reboard=self.receipt)[0])
        before = self.state.read_bytes()
        done = subprocess.run([sys.executable, str(Path(controller.__file__)), '--state', str(self.state),
                               'production-budget', '--repair-plan', str(self.plan)], capture_output=True, text=True)
        self.assertEqual(done.returncode, 0, done.stderr + done.stdout)
        budget = json.loads(done.stdout)
        self.assertEqual(budget['resources']['preflight_renders']['required'], 4)
        self.assertEqual(budget['prepaid_reboard']['reservation_sha256'], self.receipt)
        self.assertEqual(before, self.state.read_bytes())

    def test_complete_path_counts_the_verified_prepaid_unit_without_resetting_usage(self):
        from repair_guard import production_budget_precheck
        import capture_completion_budget as capture
        from unittest.mock import patch
        before = production_budget_precheck(self.before, mandatory_repair=True)
        self.assertEqual(before['deficits']['reboards'], 1)
        self.assertTrue(lifecycle.begin_repair(self.state, self.plan, prepaid_reboard=self.receipt)[0])
        state = controller.read_state(self.state)
        budget = production_budget_precheck(state, mandatory_repair=True)
        self.assertTrue(budget['feasible'], budget)
        self.assertEqual(budget['resources']['reboards']['required'], 1)
        self.assertEqual(budget['resources']['reboards']['remaining'], 0)
        self.assertEqual(budget['resources']['reboards']['prepaid'], 1)
        self.assertEqual(budget['prepaid_reboard']['reservation_sha256'], self.receipt)
        self.assertEqual(state['usage'], self.before['usage'])
        # Isolate capture-policy selection; the controller's prepaid binding above is real.
        counts = {k: row['required'] for k, row in budget['resources'].items()}
        with patch.object(capture, 'required_counts', return_value=counts):
            updated = capture.apply_budget(state, {capture.FIELD: {'schema': 'fixture'}}, budget)
        self.assertTrue(updated['feasible'], updated)
        for altered in ('reference', 'counter'):
            changed = copy.deepcopy(state)
            if altered == 'reference': changed['active_repair']['prepaid_reboard']['reservation_sha256'] = '0'*64
            if altered == 'counter': changed['usage']['reboards'] += 1
            self.assertFalse(production_budget_precheck(changed, mandatory_repair=True)['feasible'])

    def test_real_read_only_proposal_leaves_the_ledger_unchanged(self):
        before = self.state.read_bytes()
        command = [sys.executable, str(Path(recovery.__file__)), '--state', str(self.state),
                   '--plan', str(self.plan), '--receipt', self.receipt]
        done = subprocess.run(command, capture_output=True, text=True)
        self.assertEqual(done.returncode, 0, done.stderr)
        self.assertEqual(json.loads(done.stdout)['reservation_sha256'], self.receipt)
        self.assertEqual(before, self.state.read_bytes())
        plan = controller.load_json(self.plan)
        Path(plan['changed_inputs'][0]['path']).write_text('changed before authorization')
        done = subprocess.run(command, capture_output=True, text=True)
        self.assertNotEqual(done.returncode, 0)
        self.assertIn('baseline changed', done.stderr)
        self.assertEqual(before, self.state.read_bytes())

    def test_exact_unused_charge_opens_and_authorizes_without_another_charge_or_grant(self):
        accepted, message = lifecycle.begin_repair(self.state, self.plan, prepaid_reboard=self.receipt)
        self.assertTrue(accepted, message)
        self.assertIn('prepaid reboard', message)
        self.assertIn('no additional reboard', message)
        opened = controller.read_state(self.state)
        self.assertEqual(opened['usage'], self.before['usage'])
        self.assertEqual(opened['resource_envelope'], self.original_envelope)
        self.assertEqual(opened['events'][:len(self.before['events'])], self.before['events'])
        self.assertNotIn('reboards', opened['events'][-1]['grants'])
        self.assertEqual([], lifecycle.allowance_problems(opened))
        plan = controller.load_json(self.plan)
        Path(plan['changed_inputs'][0]['path']).write_text('{"credits":"SOURCE; MUSIC artist and licence"}')
        plan['changed_inputs'][0]['after_sha256'] = controller.digest(Path(plan['changed_inputs'][0]['path']))
        self.plan.write_text(json.dumps(plan))
        accepted, message = lifecycle.authorize_repair(self.state, self.plan); self.assertTrue(accepted, message)
        final = controller.read_state(self.state)
        self.assertEqual(final['usage'], self.before['usage'])
        self.assertEqual([], lifecycle.allowance_problems(final))
        self.assertEqual(final['events'][-1]['opening_reboard']['reservation_sha256'], self.receipt)
        before = self.state.read_bytes()
        self.assertFalse(lifecycle.begin_repair(self.state, self.plan, prepaid_reboard=self.receipt)[0])
        self.assertEqual(before, self.state.read_bytes())

    def test_foreign_receipt_changed_live_baseline_and_incompatible_modes_refuse_before_writes(self):
        before = self.state.read_bytes()
        self.assertFalse(lifecycle.begin_repair(self.state, self.plan, prepaid_reboard='0'*64)[0])
        self.assertFalse(lifecycle.begin_repair(self.state, self.plan, prepaid_reboard=self.receipt,
                                              reserve_reboard=True)[0])
        plan = controller.load_json(self.plan)
        source = Path(plan['changed_inputs'][0]['path']); original = source.read_bytes()
        source.write_bytes(original+b'changed')
        self.assertFalse(lifecycle.begin_repair(self.state, self.plan, prepaid_reboard=self.receipt)[0])
        source.write_bytes(original)
        self.assertEqual(before, self.state.read_bytes())

    def test_another_paid_operation_closes_unused_charge_recovery(self):
        self.assertTrue(controller.reserve(self.state, {'reported_tokens': 1}, 'offline extra paid-work fixture')[0])
        before = self.state.read_bytes()
        self.assertFalse(lifecycle.begin_repair(self.state, self.plan, prepaid_reboard=self.receipt)[0])
        self.assertEqual(before, self.state.read_bytes())

    def test_original_grant_family_inputs_and_single_use_reference_are_checked(self):
        events = self.before['events']; plan = controller.load_json(self.plan)
        self.assertTrue(recovery.reference(events, self.receipt, plan))
        for changes in ({'failure_family': 'document-handling'}, {'repair_scope': 'standard'},
                        {'failure_evidence_sha256': 'b'*64}, {'changed_inputs': []}):
            with self.subTest(changes=changes), self.assertRaises((ValueError, KeyError)):
                recovery.reference(events, self.receipt, {**plan, **changes})
        self.assertTrue(lifecycle.begin_repair(self.state, self.plan, prepaid_reboard=self.receipt)[0])
        state = controller.read_state(self.state)
        for field, value in (('reservation_sha256', '0'*64), ('reservation_event_index', 0),
                             ('grant_event_index', 0), ('baselines', {})):
            changed = copy.deepcopy(state)
            changed['events'][-1]['prepaid_reboard'][field] = value
            self.assertTrue(lifecycle.allowance_problems(changed), field)

    def test_real_git_checkpoint_restore_preserves_the_charge_and_claim_across_paths(self):
        import claude_checkpoint as checkpoint
        from unittest.mock import patch
        def git(*args, cwd=self.root):
            return subprocess.run(['git', *args], cwd=cwd, check=True, capture_output=True, text=True).stdout.strip()
        origin = self.root.parent / (self.root.name + '-origin.git')
        fresh = self.root / 'fresh'; destination = self.root / 'restored'
        subprocess.run(['git', 'init', '--bare', '-q', str(origin)], check=True)
        self.addCleanup(__import__('shutil').rmtree, origin)
        git('init', '-q'); git('checkout', '-q', '-b', 'main')
        git('config', 'user.name', 'Test'); git('config', 'user.email', 'fixture@example.com')
        (self.root / '.gitignore').write_text('out/\nfresh/\nrestored/\n')
        source = self.root / 'video-engine/src/fixture.tsx'; source.parent.mkdir(parents=True)
        source.write_text('export const fixture = true;')
        git('add', '.gitignore', 'video-engine'); git('commit', '-qm', 'fixture source')
        git('remote', 'add', 'origin', str(origin)); git('push', '-q', 'origin', 'main')
        git('symbolic-ref', 'HEAD', 'refs/heads/main', cwd=origin)
        self.assertTrue(lifecycle.begin_repair(self.state, self.plan, prepaid_reboard=self.receipt)[0])
        with patch.object(checkpoint, 'PRELAUNCH_TOOLS', self.root / 'absent-tools'), \
                patch.dict(os.environ, {'DISPATCH_CHECKPOINT_BACKOFF': '0'}):
            checkpoint.save(self.root, self.state, 'actual unused rights fixture', environ={})
            subprocess.run(['git', 'clone', '-q', str(origin), str(fresh)], check=True)
            git('config', 'user.name', 'Test', cwd=fresh); git('config', 'user.email', 'fixture@example.com', cwd=fresh)
            checkpoint.restore(fresh, '2026-10-15', dest=destination)
            restored = controller.read_state(destination / 'out/dispatch/run_state.json')
            self.assertEqual([], lifecycle.allowance_problems(restored))
            self.assertEqual(self.before['usage'], restored['usage'])
            self.assertEqual(self.receipt, restored['active_repair']['prepaid_reboard']['reservation_sha256'])


if __name__ == '__main__':
    unittest.main()
