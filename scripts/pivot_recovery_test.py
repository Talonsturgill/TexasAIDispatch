"""Charged pivot recovery funds only exact deficits and preserves recurrence gates."""
import copy
from contextlib import redirect_stdout
import io
import json
from pathlib import Path
import unittest
from unittest.mock import patch

import autonomous_completion as capacity
import modern_code_recovery as modern
import modern_code_recovery_test as fixture
import pivot_recovery as pivot
import production_lifecycle as lifecycle
import repair_guard
import run_controller as controller


class PivotRecoveryTest(unittest.TestCase):
    # Reuse the real current-board/renderer closure fixture without rerunning its tests.
    setUp_fixture = fixture.ModernCodeRecoveryTest.setUp
    start = fixture.ModernCodeRecoveryTest.start
    write = fixture.ModernCodeRecoveryTest.write

    def setUp(self):
        policy_text = pivot.POLICY.read_text()
        self.setUp_fixture()
        policy = self.write('config/autonomous_completion_pivot_v1.json', policy_text, text=True)
        self.start(patch.object(pivot, 'POLICY', policy))
        state = controller.read_state(self.state)
        state['events'] += [{'kind': 'repair_started', 'mechanism_id': name,
                             'failure_family': 'human-performance', 'failure_sha256': h * 64,
                             'plan_sha256': 'c' * 64, 'baselines': {'retained.tsx': 'd' * 64},
                             'grants': {}}
                            for name, h in (('old-stretch', 'a'), ('old-pose-switch', 'b'))]
        controller.save(self.state, state)
        self.assertTrue(capacity.grant_capacity(self.state, self.plan)[0])
        state = controller.read_state(self.state); grant_index = len(state['events']) - 1
        grant = state['events'][grant_index]
        self.assertTrue(controller.reserve(self.state, {'storyboard_critics': 1},
                                           'actual failed pivot 1, same worker opus_actor_123')[0])
        self.assertTrue(controller.reserve(self.state, {'storyboard_critics': 1},
                                           'actual failed pivot 2, same worker opus_actor_123')[0])
        state = controller.read_state(self.state); reserved = len(state['events']) - 1
        old = json.loads(self.plan.read_text()); old['mechanism_id'] = 'contact-fixed-shoulder'
        self.rejected = self.write('out/dispatch/rejected-proposal.json', old)
        self.pivot_report = self.write('out/dispatch/pivot-revise.json', {
            'verdict': 'revise', 'reviewer_identity': 'independent Opus High recurrence critic',
            'retired_mechanism_id': 'old-stretch', 'replacement_mechanism_id': old['mechanism_id'],
            'reviewed_failure_sha256': ['a' * 64, 'b' * 64, modern.digest(self.report)],
            'visible_difference': 'Continuous contact changes the performed action, but the fixed shoulder cannot reach the tool lip with constant arm lengths.',
            'source_basis': 'The current renderer arm dimensions and retained source-bound physical card push show an unreachable contact point.'})
        receipt = {'schema': 'dispatch_pivot_recovery/1', 'run_id': state['run_id'],
                   'role': 'recurrence-pivot', 'status': 'completed', 'provider_unavailable': False,
                   'model': 'claude-opus-5-5', 'effort': 'high', 'action': 'SendMessage_same_id',
                   'agent_id': 'opus_actor_123', 'reviewer_identity': 'independent Opus High recurrence critic',
                   'report_sha256': modern.digest(self.pivot_report),
                   'reported_rejection': json.loads(self.pivot_report.read_text())['visible_difference'],
                   'source_grant_event_index': grant_index, 'source_grant_sha256': capacity.sha(capacity.canonical(grant)),
                   'reservation_event_index': reserved,
                   'reservation_sha256': capacity.sha(capacity.canonical(state['events'][reserved]))}
        self.receipt = self.write('out/dispatch/pivot-receipt.json', receipt)
        revised = copy.deepcopy(old)
        revised.update(mechanism_id='continuous-contact-lean',
            repair='Carry the card continuously with constant limb lengths and a smoothly leaning torso so the contact point remains reachable.',
            mechanism_change='Continuous contact is performed by a leaning torso and constant-length joint solve rather than an unreachable fixed shoulder.',
            expected_visible_result='The fingertip stays on the card every frame with continuous torso, shoulder and finger motion and no clamping or stretching.')
        self.revised = self.write('out/dispatch/revised-modern-plan.json', revised)
        self.recovery = self.root / 'out/dispatch/pivot-recovery.json'
        pivot.prepare(self.state, self.receipt, self.pivot_report, self.rejected, self.revised, self.recovery)
        self.pivot_before = controller.read_state(self.state)

    def test_actual_two_pivot_failures_fund_exact_two_critics_without_reset(self):
        before = self.state.read_bytes(); out = io.StringIO()
        with patch('sys.argv', ['controller', '--state', str(self.state), 'production-budget', '--repair-plan', str(self.recovery)]), redirect_stdout(out):
            self.assertEqual(controller.main(), 1)
        budget = json.loads(out.getvalue())
        self.assertEqual(budget['deficits'], {'storyboard_critics': 2})
        self.assertEqual(budget['resources']['storyboard_critics']['required'], 4)
        self.assertEqual(self.state.read_bytes(), before)
        ok, msg = capacity.grant_capacity(self.state, self.recovery); self.assertTrue(ok, msg)
        state = controller.read_state(self.state)
        self.assertEqual(state['events'][:len(self.pivot_before['events'])], self.pivot_before['events'])
        self.assertEqual(state['usage'], self.pivot_before['usage'])
        self.assertEqual(state['resource_envelope'], self.pivot_before['resource_envelope'])
        self.assertEqual(state['events'][-1]['resource_increments'], {'storyboard_critics': 2})
        self.assertEqual(capacity.replay(state)[1], [])
        self.assertEqual(lifecycle.allowance_problems(state), [])
        self.assertFalse(controller.finish(self.state, 'publishable')[0])
        out = io.StringIO()
        with patch('sys.argv', ['controller', '--state', str(self.state), 'production-budget', '--repair-plan', str(self.recovery)]), redirect_stdout(out):
            self.assertEqual(controller.main(), 0)

    def test_actual_independent_pivot_pass_is_required_before_edit(self):
        self.assertTrue(capacity.grant_capacity(self.state, self.recovery)[0])
        self.assertFalse(lifecycle.begin_repair(self.state, self.recovery)[0])
        self.assertTrue(controller.reserve(self.state, {'storyboard_critics': 1},
                                           'next independent pivot, same worker opus_actor_123')[0])
        plan = json.loads(self.recovery.read_text())
        report = json.loads(self.pivot_report.read_text())
        report.update(verdict='pass', replacement_mechanism_id=plan['mechanism_id'])
        passed = self.write('out/dispatch/pivot-pass.json', report)
        plan['pivot_review'] = {'path': str(passed), 'sha256': modern.digest(passed)}
        self.recovery.write_text(json.dumps(plan))
        self.assertEqual(repair_guard.plan_problems(controller.read_state(self.state), plan), [])
        ok, msg = lifecycle.begin_repair(self.state, self.recovery); self.assertTrue(ok, msg)
        self.assertTrue(controller.reserve(self.state, {'reboards': 1}, 'actual existing Opus corrective builder')[0])
        self.renderer.write_text('export const DirectedFilm = () => "reachable continuous contact";\n')
        plan['changed_inputs'][0]['after_sha256'] = modern.digest(self.renderer)
        for row in plan['modern_code_evidence']['inputs']:
            if row['kind'] == 'board': Path(row['path']).write_text(json.dumps(modern.rebound_board(plan, row)))
        self.recovery.write_text(json.dumps(plan))
        ok, msg = lifecycle.authorize_repair(self.state, self.recovery); self.assertTrue(ok, msg)
        self.assertEqual(capacity.replay(controller.read_state(self.state))[1], [])

    def test_duplicate_renamed_report_or_proposal_cannot_buy_capacity(self):
        self.assertTrue(capacity.grant_capacity(self.state, self.recovery)[0])
        before = self.state.read_bytes()
        self.assertFalse(capacity.grant_capacity(self.state, self.recovery)[0])
        self.assertEqual(self.state.read_bytes(), before)
        plan = json.loads(self.recovery.read_text()); identity = pivot.identity(plan)
        plan['mechanism_id'] = 'renamed-proposal'
        self.assertEqual(pivot.identity(plan), identity)
        for key in ('policy_json', 'plan_json', 'failure_evidence_json', 'precheck_json'):
            state = controller.read_state(self.state); state['events'][-1][key] += ' '
            self.assertTrue(capacity.replay(state)[1], key)
        state = controller.read_state(self.state)
        state['events'] = [e for e in state['events'] if e['kind'] != pivot.ADOPTION]
        self.assertTrue(capacity.replay(state)[1])

    def test_unbound_worker_reservation_grant_self_review_and_pass_refused(self):
        original = json.loads(self.recovery.read_text())
        for key, value in [('agent_id', 'wrong_worker_123'), ('effort', 'low'),
                           ('provider_unavailable', True), ('reservation_sha256', 'd' * 64),
                           ('source_grant_sha256', 'e' * 64), ('reservation_event_index', 1)]:
            plan = copy.deepcopy(original); receipt = json.loads(plan['pivot_recovery_evidence']['receipt_json'])
            receipt[key] = value; text = json.dumps(receipt)
            plan['pivot_recovery_evidence'].update(receipt_json=text, receipt_sha256=capacity.sha(text))
            self.recovery.write_text(json.dumps(plan))
            before = self.state.read_bytes()
            self.assertFalse(capacity.grant_capacity(self.state, self.recovery)[0], key)
            self.assertEqual(self.state.read_bytes(), before)
        self.recovery.write_text(json.dumps(original))
        for key, value in [('verdict', 'pass'), ('reviewer_identity', original['director_identity']),
                           ('reviewed_failure_sha256', []), ('retired_mechanism_id', 'unrelated')]:
            report = json.loads(self.pivot_report.read_text()); report[key] = value
            self.assertFalse(pivot.eligible(controller.read_state(self.state), original, report), key)

    def test_unchanged_proposal_or_mutated_production_scope_refused(self):
        original = json.loads(self.recovery.read_text()); old = json.loads(self.rejected.read_text())
        for mutate in (lambda p: p.update({k: old[k] for k in ('repair', 'mechanism_change', 'expected_visible_result')}),
                       lambda p: p['modern_code_evidence'].update(renderer_sha256='a' * 64),
                       lambda p: p['changed_inputs'].append({'path': str(self.asset)}),
                       lambda p: p.update(failure_family='cosmetic'),
                       lambda p: p.update(resources={'image_generations': 2})):
            plan = copy.deepcopy(original); mutate(plan); self.recovery.write_text(json.dumps(plan))
            self.assertFalse(capacity.grant_capacity(self.state, self.recovery)[0])
        self.recovery.write_text(json.dumps(original))
        for path in (self.receipt, self.rejected, self.renderer, self.claims, self.asset, self.boards[2]):
            raw = path.read_bytes(); path.write_bytes(raw + b' ')
            self.assertFalse(capacity.grant_capacity(self.state, self.recovery)[0], path)
            path.write_bytes(raw)

    def test_current_completion_readings_can_refresh_without_changing_production(self):
        plan = json.loads(self.recovery.read_text())
        proof = plan['modern_code_evidence']; packet = json.loads(proof['packet_json'])
        guide = self.write('knowledge/craft/current-completion.md', 'Current mandatory recovery instructions.\n', text=True)
        ref = {'path': str(guide), 'sha256': modern.digest(guide)}
        packet['completion_readings'] = [ref]; text = json.dumps(packet)
        self.packet.write_text(text)
        proof.update(packet_json=text, packet_sha256=capacity.sha(text))
        proof['inputs'].append({**ref, 'kind': 'reference'})
        self.recovery.write_text(json.dumps(plan))
        self.assertTrue(pivot.frozen_inputs_equal(proof, json.loads(self.plan.read_text())['modern_code_evidence']))
        self.assertTrue(capacity.grant_capacity(self.state, self.recovery)[0])
        guide.write_text('Stale guide bytes')
        self.assertTrue(pivot.file_problems(plan))

    def test_only_latest_unspent_active_pivot_can_admit_and_later_ship_replays(self):
        with self.assertRaises(FileExistsError):
            pivot.prepare(self.state, self.receipt, self.pivot_report, self.rejected, self.revised, self.recovery)
        for mutate in (lambda s: s.update(terminal_state='shipped'),
                       lambda s: s.update(run_id='2026-10-08'),
                       lambda s: s['events'].append({'kind': 'reserved', 'resources': {'storyboard_critics': 1}}),
                       lambda s: s['events'].append({'kind': 'reserved', 'resources': {'reboards': 1}})):
            state = copy.deepcopy(self.pivot_before); mutate(state); controller.save(self.state, state)
            self.assertFalse(capacity.grant_capacity(self.state, self.recovery)[0])
        controller.save(self.state, self.pivot_before)
        self.assertTrue(capacity.grant_capacity(self.state, self.recovery)[0])
        state = controller.read_state(self.state); state.update(terminal_state='shipped', phase='shipped')
        self.renderer.write_text('later released source')
        self.assertEqual(capacity.replay(state)[1], [])


if __name__ == '__main__': unittest.main()
