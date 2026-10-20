"""A genuine paid completion wake can end polling, never end production."""
import copy
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch

import native_task_wait as wait
import routine_continuation as continuation


class NativeWait(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.workspace = Path(self.temp.name).resolve()
        self.state = self.workspace / 'edition/out/dispatch/run_state.json'
        self.state.parent.mkdir(parents=True)
        event = {'kind': 'reserved', 'resources': {'storyboard_critics': 1},
                 'publication_owner_sha256': 'a'*64, 'publication_epoch': 4}
        self.value = {'run_id': '2026-10-21', 'mode': 'production', 'terminal_state': None,
                      'usage': {'storyboard_critics': 1}, 'events': [event]}
        self.state.write_text(json.dumps(self.value))
        claim = {'schema': 'dispatch_worker_dispatch_claim/1', 'run_id': self.value['run_id'],
                 'role': 'storyboard-critic', 'task_name': 'phone_visual_facts', 'reservation_event_index': 0,
                 'reservation_sha256': hashlib.sha256(json.dumps(event, sort_keys=True, separators=(',', ':')).encode()).hexdigest(),
                 'owner_sha256': 'a'*64, 'epoch': 4}
        self.claim = self.state.parent / 'worker-dispatch-claims/actual-claim.json'
        self.claim.parent.mkdir(); self.claim.write_text(json.dumps(claim))
        self.payload = {'hook_event_name': 'Stop', 'stop_hook_active': True,
                        'background_tasks': [{'id': 'actual-native-task', 'type': 'subagent',
                                              'status': 'running', 'agent_type': 'dispatch-visual-critic',
                                              'description': 'phone_visual_facts_' + hashlib.sha256(self.claim.read_bytes()).hexdigest()[:8]}]}

    def test_paid_host_registry_task_yields_without_mutating_the_controller(self):
        before = self.state.read_bytes()
        with patch.dict(continuation.os.environ, {'CLAUDE_CODE_REMOTE': 'false'}):
            continuation.arm(self.workspace, self.state)
            pause = Mock()
            self.assertIsNone(continuation.response(self.payload, self.workspace, pause=pause))
            pause.assert_not_called()
        self.assertEqual(before, self.state.read_bytes())
        receipt = next((self.state.parent / 'native-completion-waits').glob('*.json'))
        self.assertFalse(json.loads(receipt.read_text())['production_finished'])
        self.assertIsNone(self.value['terminal_state'])

    def test_completion_or_failure_wakes_back_into_required_production(self):
        with patch.dict(continuation.os.environ, {'CLAUDE_CODE_REMOTE': 'false'}):
            continuation.arm(self.workspace, self.state)
            for status in ('completed', 'failed', 'stopped'):
                payload = copy.deepcopy(self.payload); payload['background_tasks'][0]['status'] = status
                result = continuation.response(payload, self.workspace, pause=Mock())
                self.assertEqual('block', result['decision'])
                self.assertIn('same edition', result['reason'])

    def test_no_registry_unpaid_work_monitor_or_fake_text_cannot_allow_a_yield(self):
        for change in ({'type': 'shell'}, {'type': 'monitor'}, {'agent_type': 'foreign-agent'},
                       {'description': 'unfunded'}, {'id': ''}):
            payload = copy.deepcopy(self.payload); payload['background_tasks'][0].update(change)
            self.assertEqual([], wait.eligible(payload, self.state, self.value))
        self.assertEqual([], wait.eligible({'last_assistant_message': 'A paid critic is running'}, self.state, self.value))
        self.claim.unlink()
        self.assertEqual([], wait.eligible(self.payload, self.state, self.value))

    def test_wrong_owner_epoch_resource_or_changed_reservation_cannot_yield(self):
        for change in ({'publication_owner_sha256': 'b'*64}, {'publication_epoch': 5},
                       {'resources': {'research_agents': 1}}):
            value = copy.deepcopy(self.value); value['events'][0].update(change)
            self.assertEqual([], wait.eligible(self.payload, self.state, value))

    def test_old_editions_and_finished_states_keep_their_original_lifecycle(self):
        for change in ({'run_id': '2026-10-19'}, {'terminal_state': 'shipped'}, {'mode': 'practice'}):
            self.assertEqual([], wait.eligible(self.payload, self.state, {**self.value, **change}))

    def test_write_receipt_cannot_follow_symlinks(self):
        tasks = wait.eligible(self.payload, self.state, self.value)
        outside = self.workspace / 'outside'; outside.mkdir()
        (self.state.parent / 'native-completion-waits').symlink_to(outside, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, 'real package'):
            wait.retain(self.state, tasks)
        self.assertEqual([], list(outside.iterdir()))


if __name__ == '__main__':
    unittest.main()
