"""Real Git ownership races and restored-reservation replay must fail before paid work."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
import json
from threading import Barrier, Lock
import unittest
from unittest.mock import patch

import claude_checkpoint as checkpoint
import claude_runtime as runtime
import cloud_capture_hook as router
import publication_owner as owner
import routine_continuation as continuation
import run_controller as controller
from claude_checkpoint_test import Base, RUN, sh

MOMENT = datetime(2026, 10, 21, 5, 0, tzinfo=timezone.utc)


class PublicationOwnership(Base):
    def test_every_native_role_uses_its_actual_configured_controller_resource(self):
        for role, route in runtime.read(runtime.POLICY)['roles'].items():
            self.assertEqual(route['resource'], owner.RESOURCES.get(role), role)

    def take(self, repo=None, workspace=None, session='first', moment=MOMENT):
        return owner.acquire(repo or self.repo, RUN, workspace or self.root / 'primary',
                             session=session, moment=moment)

    def owned(self):
        self.init_ledger()
        self.take()
        for target, value in ((owner, 'PRIMARY'),):
            context = patch.object(target, value, self.root / 'primary')
            context.start(); self.addCleanup(context.stop)
        for context in (patch.object(owner, 'enabled', return_value=True),
                        patch.object(owner, 'now', return_value=MOMENT),
                        patch.dict('os.environ', {'CLAUDE_CODE_SESSION_ID': 'first'})):
            context.start(); self.addCleanup(context.stop)
        # A real cloud edition lives inside the primary workspace.
        self.state = self.root / 'primary' / 'edition/out/dispatch/run_state.json'
        self.state.parent.mkdir(parents=True)
        self.state.write_text(json.dumps({'run_id': RUN, 'mode': 'production', 'events': []}))
        return self.state

    def test_two_actual_git_creators_have_one_winner_without_force_or_ledger_writes(self):
        self.init_ledger(); before = self.state.read_bytes()
        other = self.clone(self.root / 'second')
        barrier, mutex, seen = Barrier(2), Lock(), set()
        read = owner.read_remote

        def concurrent_read(repo):
            value = read(repo)
            with mutex:
                first = str(repo) not in seen
                seen.add(str(repo))
            if first:
                barrier.wait(timeout=10)
            return value

        with patch.object(owner, 'read_remote', side_effect=concurrent_read), ThreadPoolExecutor(2) as pool:
            jobs = [pool.submit(self.take, repo, self.root / ('host-' + name), name)
                    for repo, name in ((self.repo, 'one'), (other, 'two'))]
            results = [job.result(timeout=30) for job in jobs]
        self.assertEqual(['busy', 'owned'], sorted(row['status'] for row in results))
        self.assertEqual(before, self.state.read_bytes())
        current = owner.read_remote(self.repo)
        self.assertEqual('held', current['status'])
        self.assertNotIn('one', json.dumps(current))
        self.assertNotIn('two', json.dumps(current))
        self.assertEqual('1', sh('git', 'rev-list', '--count', owner.REF, cwd=self.origin).strip())

    def test_live_owner_observer_cannot_arm_or_reuse_the_other_marker(self):
        self.owned()
        marker = self.root / 'primary' / owner.MARKER
        before = (marker.read_bytes(), self.state.read_bytes())
        result = self.take(workspace=self.root / 'primary', session='observer')
        self.assertEqual('busy', result['status'])
        reason = continuation.decision({'hook_event_name': 'Stop', 'session_id': 'observer'}, self.root / 'primary')
        self.assertIsNone(reason)
        pause = unittest.mock.Mock()
        self.assertIsNone(continuation.response({'hook_event_name': 'Stop', 'session_id': 'observer',
                                                'stop_hook_active': True}, self.root / 'primary', pause=pause))
        pause.assert_not_called()
        self.assertEqual(before, (marker.read_bytes(), self.state.read_bytes()))
        with patch.dict('os.environ', {'CLAUDE_CODE_SESSION_ID': 'observer'}), \
                self.assertRaisesRegex(ValueError, 'does not own publication'):
            owner.require_owner(self.state)

    def test_heartbeat_appends_without_replacing_history_and_fences_changed_ownership(self):
        self.take()
        initial = owner.read_remote(self.repo)
        next_time = MOMENT + timedelta(seconds=61)
        refreshed = owner.current(self.repo, RUN, self.root / 'primary', session='first', moment=next_time)
        self.assertEqual(initial['commit'], refreshed['previous_commit'])
        self.assertGreater(owner.instant(refreshed['expires_at']), owner.instant(initial['expires_at']))
        self.assertEqual('2', sh('git', 'rev-list', '--count', owner.REF, cwd=self.origin).strip())
        changed = {k: v for k, v in owner.read_remote(self.repo).items() if k != 'commit'}
        changed.update(owner_sha256=owner.identity('other'), epoch='a' * 32)
        owner.append(self.repo, changed, refreshed['commit'])
        with self.assertRaisesRegex(ValueError, 'ownership changed'):
            owner.current(self.repo, RUN, self.root / 'primary', session='first',
                          moment=next_time + timedelta(seconds=61))

    def test_authentication_error_never_becomes_a_busy_success(self):
        with patch.object(owner, 'read_remote', side_effect=checkpoint.CheckpointError('HTTP 403')), \
                self.assertRaisesRegex(checkpoint.CheckpointError, '403'):
            self.take()
        self.assertFalse((self.root / 'primary' / owner.MARKER).exists())

    def test_expired_lease_requires_old_unfinished_identity_and_fresh_epoch(self):
        original = self.take()
        expired = MOMENT + timedelta(seconds=owner.LEASE_SECONDS + 1)
        result = owner.acquire(self.repo, '2026-10-22', self.root / 'second-primary',
                               session='other', moment=expired)
        self.assertEqual('resume_required', result['status'])
        self.assertEqual(RUN, result['run_id'])
        next_owner = self.take(workspace=self.root / 'second-primary', session='other', moment=expired)
        self.assertNotEqual(original['epoch'], next_owner['epoch'])
        self.assertFalse(next_owner['review_approval'])

    def test_restored_old_reservation_has_no_claim_but_new_owned_call_is_single_use(self):
        state_path = self.owned()
        state = owner.load(state_path)
        state['events'].append({'kind': 'reserved', 'resources': {'storyboard_critics': 1}})
        owner.write(state_path, state)
        with patch.object(checkpoint, 'mirror') as mirror:
            self.assertFalse(owner.claim_worker(state_path, 'storyboard-critic', 'storyboard_critics', 'b' * 64, 'critic'))
            state['events'].append({'kind': 'reserved', 'resources': {'storyboard_critics': 1},
                                    **owner.reservation_fields(state_path, state)})
            owner.write(state_path, state)
            claim = owner.claim_worker(state_path, 'storyboard-critic', 'storyboard_critics', 'b' * 64, 'critic')
            self.assertTrue(claim.is_file())
            self.assertFalse(owner.claim_worker(state_path, 'storyboard-critic', 'storyboard_critics', 'c' * 64, 'changed_packet'))
            mirror.assert_called_once()
        self.assertEqual(state, owner.load(state_path))

    def test_atomic_panel_has_three_distinct_single_use_role_claims(self):
        state_path = self.owned()
        state = owner.load(state_path)
        state['events'].append({'kind': 'reserved', 'resources': {'panel_rounds': 1, 'scorer_calls': 3},
                                **owner.reservation_fields(state_path, state)})
        owner.write(state_path, state)
        with patch.object(checkpoint, 'mirror') as mirror:
            for role in ('picture', 'story', 'sound'):
                self.assertTrue(owner.claim_worker(state_path, role, 'scorer_calls', 'b' * 64, role))
                self.assertFalse(owner.claim_worker(state_path, role, 'scorer_calls', 'b' * 64, role))
            self.assertEqual(3, mirror.call_count)
        self.assertEqual(state, owner.load(state_path))

    def test_claim_checkpoint_failure_does_not_refund_or_allow_replay(self):
        state_path = self.owned()
        state = owner.load(state_path)
        state['events'].append({'kind': 'reserved', 'resources': {'reboards': 1},
                                **owner.reservation_fields(state_path, state)})
        owner.write(state_path, state)
        with patch.object(checkpoint, 'mirror', side_effect=checkpoint.CheckpointError('storage')):
            with self.assertRaisesRegex(checkpoint.CheckpointError, 'storage'):
                owner.claim_worker(state_path, 'scene-builder', 'reboards', 'b' * 64, 'builder')
        self.assertFalse(owner.claim_worker(state_path, 'scene-builder', 'reboards', 'b' * 64, 'builder'))
        self.assertEqual(state, owner.load(state_path))

    def test_runtime_withholds_arguments_until_owned_reservation_and_blocks_replay(self):
        state_path = self.owned()
        repo = state_path.parents[2]
        role = 'scene-builder'
        brief = '.claude/agents/scene-builder.md'
        (repo / brief).parent.mkdir(parents=True)
        (repo / brief).write_bytes((runtime.REPO / brief).read_bytes())
        packet = state_path.parent / 'builder-packet.json'
        packet.write_text(json.dumps({'role': role, 'date': '2026-10-21',
            'brief': brief, 'agent_assignment': runtime.assignment(role, '2026-10-21')}))
        state = owner.load(state_path)
        with patch.object(runtime, 'REPO', repo), patch.object(runtime, 'contracts', return_value=[]), \
                patch('agent_runtime.required_inputs'), patch('agent_runtime.validate_references'), \
                patch.object(checkpoint, 'mirror'):
            refused = runtime.plan(role, packet, 'builder', 'Correct the bound current scene.')
            self.assertFalse(refused['dispatch_ready'])
            self.assertNotIn('agent_args', refused)
            state['events'].append({'kind': 'reserved', 'resources': {'reboards': 1}, 'note': 'first',
                                    **owner.reservation_fields(state_path, state)})
            owner.write(state_path, state)
            admitted = runtime.plan(role, packet, 'builder', 'Correct the bound current scene.')
            self.assertTrue(admitted['dispatch_ready'])
            self.assertEqual(('claude-opus-5-5', 'high'),
                tuple(admitted['assignment'][key] for key in ('model', 'effort')))
            import native_task_wait
            with patch.object(native_task_wait, 'EFFECTIVE_DATE', RUN[:10]):
                tasks = native_task_wait.eligible({'background_tasks': [{
                    'id': 'native-task', 'type': 'subagent', 'status': 'running',
                    'agent_type': admitted['agent_args']['subagent_type'],
                    'description': admitted['agent_args']['description']}]}, state_path, owner.load(state_path))
            self.assertEqual(['native-task'], [task['task_id'] for task in tasks])
            refused = runtime.plan(role, packet, 'different_name', 'Correct the bound current scene.')
            self.assertFalse(refused['dispatch_ready'])
            self.assertNotIn('agent_args', refused)
            state['events'].append({'kind': 'reserved', 'resources': {'reboards': 1}, 'note': 'second',
                                    **owner.reservation_fields(state_path, state)})
            owner.write(state_path, state)
            resumed = runtime.plan(role, packet, 'builder', 'Correct the bound current scene.', resume_agent='actual_existing_worker')
            self.assertEqual('actual_existing_worker', resumed['resume']['agent_id'])
            self.assertNotIn('agent_args', resumed)
        self.assertEqual(state, owner.load(state_path))

    def test_controller_new_charge_is_owned_and_foreign_context_cannot_change_ledger(self):
        self.init_ledger()
        original = self.state.read_bytes()
        state_path = self.owned()
        state_path.write_bytes(original)
        before = owner.load(state_path)
        with patch.object(checkpoint, 'mirror'):
            self.assertTrue(controller.reserve(state_path, {'reboards': 1}, 'actual new owned call')[0])
        state = owner.load(state_path)
        charge = state['events'][-1]
        self.assertEqual(owner.identity('first'), charge['publication_owner_sha256'])
        self.assertEqual(before['usage']['reboards'] + 1, state['usage']['reboards'])
        saved = state_path.read_bytes()
        with patch.dict('os.environ', {'CLAUDE_CODE_SESSION_ID': 'other'}), \
                self.assertRaisesRegex(ValueError, 'does not own publication'):
            controller.reserve(state_path, {'reboards': 1}, 'foreign restored reservation')
        self.assertEqual(saved, state_path.read_bytes())

    def test_hard_five_real_plan_charge_replan_keeps_fourth_review_and_final_slot(self):
        self.init_ledger(); original = self.state.read_bytes()
        state_path = self.owned(); state_path.write_bytes(original)
        repo = state_path.parents[2]
        role, brief = 'storyboard-critic', '.claude/agents/storyboard-critic.md'
        (repo / brief).parent.mkdir(parents=True, exist_ok=True)
        (repo / brief).write_bytes((runtime.REPO / brief).read_bytes())
        packet = state_path.parent / 'phone-packet.json'
        data = {'role': role, 'date': '2026-10-21', 'brief': brief,
                'agent_assignment': runtime.assignment(role, '2026-10-21'),
                'review_scope': 'exact-muted-phone-preflight', 'phone_mode': 'comparison'}
        packet.write_text(json.dumps(data))
        with patch.object(runtime, 'REPO', repo), patch.object(runtime, 'contracts', return_value=[]), \
                patch('agent_runtime.required_inputs'), patch('agent_runtime.validate_references'), \
                patch.object(runtime, 'phone_review_inputs'), patch.object(runtime, 'image_policy_inputs'), \
                patch.object(checkpoint, 'mirror'):
            for index in range(3):
                self.assertTrue(controller.reserve(state_path, {'storyboard_critics': 1}, 'offline prior review')[0])
                self.assertTrue(owner.claim_worker(state_path, role, 'storyboard_critics', 'b' * 64,
                                                  'prior_' + str(index)))
            inspect = runtime.plan(role, packet, 'phone_four', 'Inspect the current phone comparison.')
            self.assertFalse(inspect['dispatch_ready'])
            self.assertTrue(controller.reserve(state_path, {'storyboard_critics': 1}, 'fourth comparison')[0])
            fourth = runtime.plan(role, packet, 'phone_four', 'Inspect the current phone comparison.')
            self.assertTrue(fourth['dispatch_ready'])
            self.assertEqual(owner.load(state_path)['usage']['storyboard_critics'], 4)
            with self.assertRaisesRegex(ValueError, 'fifth review'):
                runtime.plan(role, packet, 'another_comparison', 'Inspect another phone comparison.')
            data['phone_mode'] = 'current'; packet.write_text(json.dumps(data))
            self.assertFalse(runtime.plan(role, packet, 'phone_final', 'Inspect the final timed phone film.')['dispatch_ready'])
            self.assertTrue(controller.reserve(state_path, {'storyboard_critics': 1}, 'fifth final timed phone')[0])
            self.assertTrue(runtime.plan(role, packet, 'phone_final', 'Inspect the final timed phone film.')['dispatch_ready'])
            saved = state_path.read_bytes()
            self.assertFalse(controller.reserve(state_path, {'storyboard_critics': 1}, 'sixth refused')[0])
            self.assertEqual(saved, state_path.read_bytes())

    def test_real_checkpoint_restore_keeps_owned_charge_and_consumed_worker_claim(self):
        self.init_ledger()
        self.take(workspace=self.root)
        (self.state.parent / 'claude-host.json').write_text('{}')
        self.save('before actual owned reservation')
        with patch.object(owner, 'PRIMARY', self.root), patch.object(owner, 'enabled', return_value=True), \
                patch.object(owner, 'now', return_value=MOMENT), \
                patch.dict('os.environ', {'CLAUDE_CODE_SESSION_ID': 'first'}):
            self.assertTrue(controller.reserve(self.state, {'reboards': 1}, 'owned builder attempt')[0])
            claim = owner.claim_worker(self.state, 'scene-builder', 'reboards', 'b' * 64, 'builder')
            original = self.ledger()
            fresh = self.clone(self.root / 'fresh-restore-tools')
            destination = self.root / 'restored-edition'
            checkpoint.restore(fresh, RUN, dest=destination)
            restored_state = destination / 'out/dispatch/run_state.json'
            restored_claim = destination / claim.relative_to(self.repo)
            self.assertEqual(claim.read_bytes(), restored_claim.read_bytes())
            restored = owner.load(restored_state)
            self.assertEqual(original['events'][-1], restored['events'][-1])
            self.assertEqual(original['usage'], restored['usage'])
            self.assertEqual(original['resource_envelope'], restored['resource_envelope'])
            self.assertFalse(owner.claim_worker(restored_state, 'scene-builder', 'reboards', 'b' * 64, 'builder'))

    def test_release_refuses_unfinished_and_retains_lease_until_exact_closure(self):
        self.init_ledger(); self.take()
        before = owner.read_remote(self.repo)
        with self.assertRaisesRegex(ValueError, 'accepted finish'):
            owner.release(self.repo, self.state, self.root / 'primary', session='first')
        self.assertEqual(before, owner.read_remote(self.repo))
        state = self.ledger()
        state['events'].append({'kind': 'finished', 'result': 'shipped', 'shipment_sha256': 'b' * 64})
        self.write_ledger(state)
        with patch.object(continuation, 'closure_problems', return_value=[]):
            result = owner.release(self.repo, self.state, self.root / 'primary', session='first')
        self.assertEqual('complete', result['status'])
        self.assertEqual('complete', owner.read_remote(self.repo)['status'])
        self.assertEqual('complete', self.take(session='other')['status'])

    def test_ownership_failure_denies_capture_before_consuming_original_authorization(self):
        payload = {'tool_name': 'Bash', 'tool_input': {'command': 'npx remotion still Dispatch x.png'}}
        with patch.object(owner, 'heartbeat_hook', side_effect=ValueError('lost owner')), \
                patch.object(router, 'checkout', return_value=self.repo), \
                patch.object(router.guard, 'decide', return_value='exact original capture denial') as decide:
            self.assertIn('ownership could not be verified', router.decision(payload, self.root))
            decide.assert_not_called()
        with patch.object(owner, 'heartbeat_hook', side_effect=ValueError('lost owner')):
            self.assertIsNone(router.decision({'tool_name': 'Bash', 'tool_input': {'command': 'git status --short'}}, self.root))


if __name__ == '__main__':
    unittest.main()
