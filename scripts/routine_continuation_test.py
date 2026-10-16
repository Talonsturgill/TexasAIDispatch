"""A real unfinished production cannot become a successful early final response."""
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import routine_continuation as continuation
import bootstrap_claude_hooks as bootstrap


class ContinuationTests(unittest.TestCase):
    def setUp(self):
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

    def test_prelaunch_registration_is_additive_idempotent_and_preserves_permissions(self):
        scripts = self.repo / 'scripts'; scripts.mkdir()
        for name in ('cloud_capture_hook.py', 'routine_continuation.py'):
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
