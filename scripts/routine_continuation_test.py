"""A real unfinished production cannot become a successful early final response."""
import copy
import hashlib
import json
import tempfile
import unittest
import subprocess
import sys
import time
from pathlib import Path
from unittest.mock import Mock, patch

import routine_continuation as continuation
import bootstrap_claude_hooks as bootstrap


class ContinuationTests(unittest.TestCase):
    def setUp(self):
        remote = patch.dict(continuation.os.environ, {'CLAUDE_CODE_REMOTE': 'false'})
        remote.start(); self.addCleanup(remote.stop)
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.workspace = Path(self.tmp.name).resolve()
        self.repo = self.workspace / 'restore/edition'
        self.root = self.repo / 'out/dispatch'; self.root.mkdir(parents=True)
        self.state = self.root / 'run_state.json'
        self.value = {'run_id': '2026-10-15', 'mode': 'production', 'terminal_state': None, 'events': []}
        self.save()
        self.payload = {'hook_event_name': 'Stop', 'stop_hook_active': True}

    def save(self):
        self.state.write_text(json.dumps(self.value))

    def arm(self):
        continuation.arm(self.workspace, self.state)

    def install_primary_hooks(self):
        (self.repo / 'scripts').mkdir(exist_ok=True)
        for name in ('cloud_capture_hook.py', 'routine_continuation.py', 'image_read_receipt.py', 'claude_session_start.py'):
            (self.repo / 'scripts' / name).write_text('# fixture\n')
        bootstrap.bootstrap(self.workspace, self.repo, prelaunch_router=True)

    def test_nested_edition_arm_is_watched_by_the_actual_primary_stop_hook(self):
        self.install_primary_hooks()
        nested = self.repo.parent
        before = self.state.read_bytes()
        continuation.arm(nested, self.state)
        self.assertTrue((self.workspace / continuation.MARKER).is_file())
        self.assertFalse((nested / continuation.MARKER).exists())
        self.assertIn('remains unfinished', continuation.decision(self.payload, self.workspace))
        self.assertEqual(self.state.read_bytes(), before)

    def test_missing_or_changed_primary_registration_cannot_report_successful_cloud_arm(self):
        with patch.dict(continuation.os.environ, {'CLAUDE_CODE_REMOTE': 'true'}):
            with self.assertRaisesRegex(ValueError, 'unwatched folder'):
                self.arm()
        self.install_primary_hooks()
        target = self.workspace / '.claude/settings.json'
        settings = json.loads(target.read_text()); settings['hooks']['Stop'] = []
        target.write_text(json.dumps(settings))
        with self.assertRaisesRegex(ValueError, 'not installed'):
            continuation.arm(self.repo.parent, self.state)
        self.assertFalse((self.workspace / continuation.MARKER).exists())

    def test_ordinary_coding_and_leaf_events_are_inert(self):
        self.assertIsNone(continuation.decision(self.payload, self.workspace))
        self.arm()
        self.assertIsNone(continuation.decision({'hook_event_name': 'SubagentStop'}, self.workspace))

    def test_early_final_and_repeated_waiting_continue_without_ledger_mutation(self):
        self.arm(); before = self.state.read_bytes()
        for _ in range(2):
            reason = continuation.decision({**self.payload, 'background_tasks': [{'id': 'critic14', 'status': 'running'}]}, self.workspace)
            self.assertIn('critic14', reason)
            self.assertIn('same edition', reason)
            self.assertIn('do not repeat a final waiting message', reason)
        self.assertEqual(self.state.read_bytes(), before)

    def test_repeated_waiting_on_a_real_harness_task_is_bounded_and_still_blocked(self):
        self.arm(); before = self.state.read_bytes()
        payload = {**self.payload, 'background_tasks': [{'id': 'ci-monitor', 'status': 'running'}]}
        pause = Mock()
        result = continuation.response(payload, self.workspace, pause=pause)
        pause.assert_called_once_with(20)
        self.assertEqual(result['decision'], 'block')
        self.assertIn('ci-monitor', result['reason'])
        self.assertEqual(self.state.read_bytes(), before)

    def test_first_stop_no_running_task_coding_and_leaf_events_never_wait(self):
        pause = Mock()
        self.assertIsNone(continuation.response(self.payload, self.workspace, pause=pause))
        self.arm()
        for payload in ({**self.payload, 'stop_hook_active': False,
                         'background_tasks': [{'id': 'ci', 'status': 'running'}]},
                        self.payload,
                        {**self.payload, 'background_tasks': [{'id': 'done', 'status': 'completed'}]}):
            self.assertEqual(continuation.response(payload, self.workspace, pause=pause)['decision'], 'block')
        self.assertIsNone(continuation.response({'hook_event_name': 'SubagentStop'}, self.workspace, pause=pause))
        pause.assert_not_called()

    def test_wait_rechecks_accepted_archive_before_returning(self):
        self.arm()
        payload = {**self.payload, 'background_tasks': [{'id': 'archive', 'status': 'running'}]}
        manifest = {'run_id': '2026-10-15', 'terminal_state': 'shipped', 'shipment_recorded': True}
        published = None
        def finish_fixture(seconds):
            nonlocal published
            self.assertEqual(seconds, 20)
            self.value.update(terminal_state='shipped', shipment={'fixture': True},
                events=[{'kind': 'finished', 'result': 'shipped', 'shipment_sha256': 'a'*64}])
            self.save()
            archive = self.repo / 'runs/2026-10-15/run_state.json'; archive.parent.mkdir(parents=True)
            archive.write_text(json.dumps(self.value)); published = archive.read_bytes()
        def git_bytes(repo, ref, path):
            return published if ref == 'origin/main' else json.dumps(manifest).encode()
        with patch.object(continuation, 'git_bytes', side_effect=git_bytes):
            self.assertIsNone(continuation.response(payload, self.workspace, pause=finish_fixture))

    def test_real_hook_cli_waits_once_and_preserves_the_unfinished_fixture(self):
        self.arm(); before = self.state.read_bytes()
        payload = {**self.payload, 'background_tasks': [{'id': 'fixture-ci', 'status': 'running'}]}
        started = time.monotonic()
        done = subprocess.run([sys.executable, str(Path(continuation.__file__)),
                               '--workspace', str(self.workspace), '--hook'],
                              input=json.dumps(payload), capture_output=True, text=True, timeout=45)
        self.assertEqual(done.returncode, 0, done.stderr)
        self.assertGreaterEqual(time.monotonic() - started, 20)
        self.assertEqual(json.loads(done.stdout)['decision'], 'block')
        self.assertEqual(self.state.read_bytes(), before)

    def test_broken_or_changed_production_identity_cannot_signal_completion(self):
        self.arm()
        self.state.write_text('broken')
        self.assertIn('cannot yet be verified', continuation.decision(self.payload, self.workspace))
        self.value['run_id'] = '2026-10-16'; self.save()
        self.assertIn('cannot yet be verified', continuation.decision(self.payload, self.workspace))

    def test_arbitrary_terminal_label_cannot_finish(self):
        self.arm()
        self.value.update(terminal_state='shipped', shipment={'fixture': True}); self.save()
        self.assertIn('accepted finish', continuation.decision(self.payload, self.workspace))

    def test_shipped_requires_matching_public_archive_and_finished_checkpoint(self):
        self.arm()
        self.value.update(terminal_state='shipped', shipment={'fixture': True}, events=[{'kind': 'finished', 'result': 'shipped', 'shipment_sha256': 'a' * 64}]); self.save()
        archive = self.repo / 'runs/2026-10-15/run_state.json'; archive.parent.mkdir(parents=True)
        archive.write_text(json.dumps(self.value)); published = archive.read_bytes()
        manifest = {'run_id': '2026-10-15', 'terminal_state': 'shipped', 'shipment_recorded': True}
        def git_bytes(repo, ref, path):
            self.assertIn(ref, ('origin/main', 'refs/heads/claude/checkpoint/2026-10-15'))
            return published if ref == 'origin/main' else json.dumps(manifest).encode()
        with patch.object(continuation, 'git_bytes', side_effect=git_bytes):
            self.assertIsNone(continuation.decision(self.payload, self.workspace))
            manifest['terminal_state'] = None
            self.assertIn('finished durable checkpoint', continuation.decision(self.payload, self.workspace))
            manifest['terminal_state'] = 'shipped'
            archive.write_text('{}')
            self.assertIn('origin/main', continuation.decision(self.payload, self.workspace))

    def test_probe_is_one_shot_and_cannot_replace_production(self):
        target = self.workspace / continuation.PROBE; target.parent.mkdir()
        target.write_text(json.dumps({'schema': continuation.SCHEMA, 'observed': False}))
        self.assertIn('actual Stop event', continuation.decision(self.payload, self.workspace))
        self.assertTrue(continuation.read(target)['observed'])
        self.assertIsNone(continuation.decision(self.payload, self.workspace))
        self.arm()
        self.assertIn('production remains unfinished', continuation.decision(self.payload, self.workspace))

    def test_arm_refuses_foreign_paths_and_existing_other_run(self):
        self.arm()
        before = (self.workspace / continuation.MARKER).read_bytes()
        with self.assertRaises(ValueError):
            continuation.arm(self.workspace, Path('/outside/run_state.json'))
        self.value['run_id'] = '2026-10-16'; self.save()
        with self.assertRaises(ValueError):
            self.arm()
        self.assertEqual(before, (self.workspace / continuation.MARKER).read_bytes())

    def restored_fixture(self):
        from claude_checkpoint import public_ledger, restored_ledger
        self.value.update(resource_envelope={'original': 3}, usage={'research_agents': 1},
                          limits={'research_agents': 3},
                          events=[{'kind': 'reserved', 'resources': {'research_agents': 1},
                                   'path': str(self.repo / 'out/dispatch/claims.json')}])
        self.save(); self.arm()
        retained = json.dumps(public_ledger(self.value, self.repo)).encode()
        manifest = {'schema': 'dispatch_claude_checkpoint/2', 'run_id': self.value['run_id'],
                    'terminal_state': None, 'ledger_sha256': hashlib.sha256(retained).hexdigest()}
        state = self.workspace / 'restore2/edition/out/dispatch/run_state.json'
        state.parent.mkdir(parents=True)
        current = restored_ledger(json.loads(retained), state.parents[2], manifest)
        state.write_text(json.dumps(current))
        host = state.with_name('claude-host.json')
        host.write_text(json.dumps({'run_id': self.value['run_id'], 'restored_from': 'a' * 40}))
        self.state.unlink()
        def git_bytes(repo, ref, path):
            self.assertEqual(repo, state.parents[2]); self.assertEqual(ref, 'a' * 40)
            return json.dumps(manifest).encode() if path.endswith('/manifest.json') else retained
        return state, current, manifest, git_bytes

    def test_missing_restore_rebinds_same_verified_edition_without_changing_ledger(self):
        state, current, manifest, source = self.restored_fixture()
        current['usage']['research_agents'] += 1
        current['events'].append({'kind': 'reserved', 'resources': {'research_agents': 1}})
        state.write_text(json.dumps(current)); before = state.read_bytes()
        with patch.object(continuation, 'git_bytes', side_effect=source):
            continuation.arm(self.workspace, state)
        self.assertEqual(before, state.read_bytes())
        marker = continuation.read(self.workspace / continuation.MARKER)
        self.assertEqual(marker['state'], str(state))
        audit = continuation.read(self.workspace / continuation.REBIND)
        self.assertEqual(audit['rebindings'][0]['previous_marker']['state'], str(self.state))
        self.assertEqual(audit['rebindings'][0]['ledger_sha256'], manifest['ledger_sha256'])
        audit_before = (self.workspace / continuation.REBIND).read_bytes()
        continuation.arm(self.workspace, state)
        self.assertEqual(audit_before, (self.workspace / continuation.REBIND).read_bytes())
        self.assertIn('accepted finish', continuation.decision(self.payload, self.workspace))

    def test_rebind_preserves_live_previous_ledger_and_unverified_restores(self):
        state, current, manifest, source = self.restored_fixture()
        original_marker = (self.workspace / continuation.MARKER).read_bytes()
        for problem in ('old_still_exists', 'missing_host', 'other_run', 'bad_checkpoint', 'bad_digest',
                        'changed_envelope', 'lower_usage', 'missing_history', 'shipped_checkpoint'):
            with self.subTest(problem=problem):
                candidate = copy.deepcopy(current)
                host = {'run_id': current['run_id'], 'restored_from': 'a' * 40}
                manifest['terminal_state'] = None
                if problem == 'old_still_exists': self.save()
                if problem == 'other_run': host['run_id'] = '2026-10-16'
                if problem == 'bad_checkpoint': host['restored_from'] = 'not-a-checkpoint'
                if problem == 'bad_digest': manifest['ledger_sha256'] = 'b' * 64
                if problem == 'changed_envelope': candidate['resource_envelope'] = {'original': 4}
                if problem == 'lower_usage': candidate['usage']['research_agents'] = 0
                if problem == 'missing_history': candidate['events'] = []
                if problem == 'shipped_checkpoint': manifest['terminal_state'] = 'shipped'
                state.write_text(json.dumps(candidate))
                state.with_name('claude-host.json').write_text(json.dumps(host))
                if problem == 'missing_host': state.with_name('claude-host.json').unlink()
                with patch.object(continuation, 'git_bytes', side_effect=source):
                    with self.assertRaises((ValueError, OSError)):
                        continuation.arm(self.workspace, state)
                self.assertEqual(original_marker, (self.workspace / continuation.MARKER).read_bytes())
                self.assertFalse((self.workspace / continuation.REBIND).exists())
                self.state.unlink(missing_ok=True)
                if problem == 'bad_digest':
                    import claude_checkpoint
                    manifest['ledger_sha256'] = hashlib.sha256(json.dumps(
                        claude_checkpoint.public_ledger(self.value, self.repo)).encode()).hexdigest()

    def test_prelaunch_registration_is_additive_idempotent_and_preserves_permissions(self):
        scripts = self.repo / 'scripts'; scripts.mkdir()
        for name in ('cloud_capture_hook.py', 'routine_continuation.py', 'image_read_receipt.py', 'claude_session_start.py'):
            (scripts / name).write_text('# offline fixture\n')
        directory = self.workspace / '.claude'; directory.mkdir()
        target = directory / 'settings.json'
        foreign = {'hooks': [{'type': 'command', 'command': 'keep-foreign-stop'}]}
        settings = {'model': 'keep-model', 'effortLevel': 'keep-effort', 'permissions': {'deny': ['keep']}, 'env': {'KEEP': 'fixture'}, 'hooks': {'Stop': [foreign]}}
        target.write_text(json.dumps(settings))
        bootstrap.bootstrap(self.workspace, self.repo, prelaunch_router=True)
        before = target.read_bytes()
        bootstrap.bootstrap(self.workspace, self.repo, prelaunch_router=True)
        self.assertEqual(before, target.read_bytes())
        result = json.loads(before)
        self.assertIn(foreign, result['hooks']['Stop'])
        self.assertEqual(len(result['hooks']['Stop']), 2)
        for key in ('model', 'effortLevel', 'permissions', 'env'):
            self.assertEqual(result[key], settings[key])


if __name__ == '__main__':
    unittest.main()
