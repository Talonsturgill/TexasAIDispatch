"""Primary-workspace hook registration is scoped, additive and idempotent."""
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import bootstrap_claude_hooks as boot
import capture_guard as guard


class BootstrapTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.workspace = Path(self.temp.name) / 'workspace'
        self.repo = self.workspace / 'Dispatch'
        (self.repo / 'scripts').mkdir(parents=True)
        (self.repo / 'scripts/capture_guard.py').write_text('# fixture\n')
        self.directory = self.workspace / '.claude'
        self.directory.mkdir()
        self.target = self.directory / 'settings.json'
        self.foreign = {'matcher': 'Write', 'hooks': [{'type': 'command', 'command': 'foreign'}]}
        self.settings = {'model': 'unrelated-model', 'effortLevel': 'max',
                         'env': {'KEEP': 'private-fixture'}, 'permissions': {'deny': ['Read(private)']},
                         'hooks': {'PreToolUse': [self.foreign], 'Stop': [{'hooks': []}]}}
        self.target.write_text(json.dumps(self.settings))

    def load(self):
        return json.loads(self.target.read_text())

    def test_preserves_settings_and_unrelated_hooks(self):
        result = boot.bootstrap(self.workspace, self.repo)
        after = self.load()
        for key in ('model', 'effortLevel', 'env', 'permissions'):
            self.assertEqual(after[key], self.settings[key])
        self.assertEqual(after['hooks']['Stop'], self.settings['hooks']['Stop'])
        self.assertIn(self.foreign, after['hooks']['PreToolUse'])
        self.assertFalse(result['capture_authorized'])
        self.assertFalse(result['live_hook_observed'])

    def test_idempotent(self):
        boot.bootstrap(self.workspace, self.repo)
        before = self.target.read_bytes()
        boot.bootstrap(self.workspace, self.repo)
        self.assertEqual(self.target.read_bytes(), before)
        self.assertEqual(len(self.load()['hooks']['PreToolUse']), 2)

    def test_restored_checkout_replaces_only_previous_registration(self):
        boot.bootstrap(self.workspace, self.repo)
        restored = self.workspace / 'restore/pilot'
        (restored / 'scripts').mkdir(parents=True)
        (restored / 'scripts/capture_guard.py').write_text('# fixture\n')
        result = boot.bootstrap(self.workspace, restored)
        entries = self.load()['hooks']['PreToolUse']
        self.assertEqual(len(entries), 2)
        self.assertIn(self.foreign, entries)
        self.assertIn(str(restored), entries[-1]['hooks'][0]['command'])
        self.assertNotIn(str(self.repo), entries[-1]['hooks'][0]['command'])
        self.assertEqual(result['active_checkout'], str(restored.resolve()))

    def test_paths_with_spaces_are_quoted(self):
        spaced = self.workspace / 'restore/my pilot'
        (spaced / 'scripts').mkdir(parents=True)
        (spaced / 'scripts/capture_guard.py').write_text('# fixture\n')
        boot.bootstrap(self.workspace, spaced)
        self.assertIn("'", self.load()['hooks']['PreToolUse'][-1]['hooks'][0]['command'])

    def test_repo_or_nonancestor_workspace_refused(self):
        before = self.target.read_bytes()
        for workspace in (self.repo, self.workspace.parent / 'foreign'):
            with self.assertRaises(ValueError):
                boot.bootstrap(workspace, self.repo)
        self.assertEqual(self.target.read_bytes(), before)

    def test_git_workspace_refused(self):
        (self.workspace / '.git').mkdir()
        before = self.target.read_bytes()
        with self.assertRaises(ValueError):
            boot.bootstrap(self.workspace, self.repo)
        self.assertEqual(self.target.read_bytes(), before)

    def test_symlink_outside_workspace_refused(self):
        foreign = Path(self.temp.name) / 'private.json'
        foreign.write_text('{}')
        self.target.unlink()
        self.target.symlink_to(foreign)
        with self.assertRaises(ValueError):
            boot.bootstrap(self.workspace, self.repo)
        self.assertEqual(foreign.read_text(), '{}')

    def test_invalid_settings_and_registration_preserved(self):
        for text in ('not-json', '[]', '{"hooks": []}', '{"hooks": {"PreToolUse": {}}}'):
            self.target.write_text(text)
            with self.assertRaises(ValueError):
                boot.bootstrap(self.workspace, self.repo)
            self.assertEqual(self.target.read_text(), text)
        self.target.write_text(json.dumps(self.settings))
        record = self.directory / 'dispatch-capture-registration.json'
        record.write_text('{"schema": "other"}')
        before = self.target.read_bytes()
        with self.assertRaises(ValueError):
            boot.bootstrap(self.workspace, self.repo)
        self.assertEqual(self.target.read_bytes(), before)

    def test_missing_handler_refused(self):
        (self.repo / 'scripts/capture_guard.py').unlink()
        with self.assertRaises(ValueError):
            boot.bootstrap(self.workspace, self.repo)

    def test_explicit_checkout_overrides_primary_project_scope(self):
        payload = {'tool_name': 'Bash', 'cwd': str(self.workspace),
                   'tool_input': {'command': 'remotion still --help'}}
        with patch('sys.stdin', io.StringIO(json.dumps(payload))), patch('sys.stdout', io.StringIO()), \
             patch.dict('os.environ', {'CLAUDE_PROJECT_DIR': str(self.workspace)}), \
             patch.object(guard, 'decide', return_value=None) as decide:
            guard.hook(str(self.repo))
        self.assertEqual(decide.call_args.args[1], str(self.repo))

    def test_unregistered_capture_is_still_denied(self):
        payload = {'tool_name': 'Bash', 'cwd': str(self.repo),
                   'tool_input': {'command': 'remotion still --help'}}
        self.assertIn('no current capture authorization', guard.decide(payload, str(self.repo)))

    def test_hook_cli_selects_its_own_checkout(self):
        with patch.object(guard, 'hook', return_value=0) as hook:
            self.assertEqual(guard.main(['hook', '--repo-root']), 0)
        hook.assert_called_once_with(str(guard.REPO))


if __name__ == '__main__':
    unittest.main()
