"""Exercise actual user-settings preservation without touching the user's real configuration."""
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch
import claude_environment_context as context


class ContextTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.repo = self.root / 'repo'
        subprocess.run(['git', 'init', '-q', str(self.repo)], check=True)
        subprocess.run(['git', '-C', str(self.repo), 'remote', 'add', 'origin', context.REMOTE + '.git'], check=True)
        self.path = self.root / 'user/.claude/settings.json'
        self.path.parent.mkdir(parents=True)
        self.current = {'model': 'existing-model', 'effortLevel': 'medium',
            'env': {'FIXTURE_VALUE': 'placeholder-only'},
            'permissions': {'allow': ['Read(./known.txt)'], 'deny': ['Bash(send *)'], 'ask': ['Bash(risky *)']},
            'hooks': {'Stop': [{'hooks': [{'type': 'command', 'command': 'existing-hook'}]}]},
            'autoMode': {'environment': ['$defaults', 'Existing owner context'],
                         'allow': ['$defaults', 'Existing narrow exception'],
                         'soft_deny': ['$defaults'], 'hard_deny': ['$defaults', 'Existing boundary'],
                         'classifyAllShell': True}}
        self.path.write_text(json.dumps(self.current)); self.path.chmod(0o640)

    def test_apply_preserves_all_rules_hooks_model_bindings_and_existing_context(self):
        result = context.configure(self.path, self.root / 'workspace', self.repo, apply=True)
        actual = json.loads(self.path.read_text())
        self.assertEqual(context.controls(self.current), context.controls(actual))
        self.assertEqual(self.current['autoMode']['environment'], actual['autoMode']['environment'][:2])
        self.assertEqual(0o640, self.path.stat().st_mode & 0o777)
        self.assertTrue(result['controls_unchanged'])
        self.assertNotIn('placeholder-only', json.dumps(result))
        before = self.path.read_bytes()
        self.assertFalse(context.configure(self.path, self.root / 'workspace', self.repo, apply=True)['changed'])
        self.assertEqual(before, self.path.read_bytes())

    def test_empty_config_inherits_every_default_rule_and_proposal_writes_nothing(self):
        self.path.unlink()
        result = context.configure(self.path, self.root, self.repo)
        self.assertTrue(result['changed']); self.assertFalse(self.path.exists())
        context.configure(self.path, self.root, self.repo, apply=True)
        actual = json.loads(self.path.read_text())
        self.assertEqual('$defaults', actual['autoMode']['environment'][0])
        self.assertEqual({'autoMode'}, set(actual))
        self.assertEqual({'environment'}, set(actual['autoMode']))

    def test_invalid_existing_settings_never_change(self):
        for invalid in ([], {'autoMode': []}, {'autoMode': {'environment': 'wrong'}},
                        {'autoMode': {'environment': [{}]}}):
            with self.subTest(invalid=invalid):
                self.path.write_text(json.dumps(invalid)); before = self.path.read_bytes()
                with self.assertRaises(ValueError):
                    context.configure(self.path, self.root, self.repo, apply=True)
                self.assertEqual(before, self.path.read_bytes())

    def test_unselected_repo_and_project_settings_are_refused(self):
        original = self.path.read_bytes()
        subprocess.run(['git', '-C', str(self.repo), 'remote', 'set-url', 'origin', 'https://example.com/other.git'], check=True)
        with self.assertRaises(ValueError):
            context.configure(self.path, self.root, self.repo, apply=True)
        self.assertEqual(original, self.path.read_bytes())
        subprocess.run(['git', '-C', str(self.repo), 'remote', 'set-url', 'origin', context.REMOTE], check=True)
        with self.assertRaises(ValueError):
            context.configure(self.repo / '.claude/settings.json', self.root, self.repo, apply=True)
        self.assertFalse((self.repo / '.claude').exists())

    def test_symlink_target_is_refused_with_original_bytes_retained(self):
        original = self.path.read_bytes()
        link = self.root / 'settings-link.json'; link.symlink_to(self.path)
        with self.assertRaises(ValueError):
            context.configure(link, self.root, self.repo, apply=True)
        self.assertEqual(original, self.path.read_bytes())

    def test_a_concurrent_settings_edit_is_preserved(self):
        newer = json.dumps({'model': 'concurrent-owner-choice'}).encode()
        with patch.object(context.os, 'fsync', side_effect=lambda _: self.path.write_bytes(newer)):
            with self.assertRaisesRegex(ValueError, 'concurrently'):
                context.configure(self.path, self.root, self.repo, apply=True)
        self.assertEqual(newer, self.path.read_bytes())


if __name__ == '__main__':
    unittest.main()
