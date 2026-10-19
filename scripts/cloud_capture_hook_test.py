"""Restored checkout routing fails closed while preserving the capture gate."""
import tempfile
import unittest
import json
from pathlib import Path
from unittest.mock import patch

import cloud_capture_hook as router
import bootstrap_claude_hooks as bootstrap
from capture_guard_test import Fixture


class RoutingTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.workspace = Path(self.temp.name)
        self.repo = self.workspace / 'work/edition'
        (self.repo / 'scripts').mkdir(parents=True)
        (self.repo / 'config').mkdir()
        (self.repo / 'video-engine').mkdir()
        (self.repo / 'scripts/capture_guard.py').write_text('fixture')
        (self.repo / 'config/claude_runtime.json').write_text('{}')

    def payload(self, command, cwd=None):
        return {'tool_name': 'Bash', 'cwd': str(cwd or self.workspace), 'tool_input': {'command': command}}

    def test_wrapped_restored_checkout_routes_to_its_ledger(self):
        command = f"bash scripts/run_with_env.sh bash -c 'cd {self.repo}/video-engine && npx remotion still Dispatch x.png --props=../board.json'"
        with patch.object(router.guard, 'decide', return_value='real denial') as decide:
            self.assertEqual(router.decision(self.payload(command), self.workspace), 'real denial')
            self.assertEqual(decide.call_args.args[1], str(self.repo.resolve()))

    def test_capture_without_authorization_is_denied(self):
        reason = router.decision(self.payload('npx remotion still Dispatch x.png', self.repo), self.workspace)
        self.assertIn('no current capture authorization', reason)

    def test_actual_direct_wrapper_probe_routes_and_is_denied_without_authorization(self):
        command = f"scripts/run_with_env.sh bash -c 'cd {self.repo}/video-engine && npx remotion still --help'"
        reason = router.decision(self.payload(command), self.workspace)
        self.assertIn('no current capture authorization', reason)

    def test_unrelated_read_is_allowed(self):
        self.assertIsNone(router.decision(self.payload('git status --short'), self.workspace))

    def test_unknown_outside_and_multiple_roots_are_denied(self):
        for command in ('npx remotion still Dispatch x.png',
                        'cd /tmp && npx remotion still Dispatch x.png',
                        'cd "$UNKNOWN" && npx remotion still Dispatch x.png'):
            self.assertIn('Capture refused', router.decision(self.payload(command), self.workspace))
        other = self.workspace / 'other'
        (other / 'scripts').mkdir(parents=True); (other / 'config').mkdir()
        (other / 'scripts/capture_guard.py').write_text('fixture')
        (other / 'config/claude_runtime.json').write_text('{}')
        command = f'cd {self.repo} && npx remotion still Dispatch a.png; cd {other} && npx remotion still Dispatch b.png'
        self.assertIn('exactly one', router.decision(self.payload(command), self.workspace))

    def test_prelaunch_registration_can_use_external_installed_tools(self):
        tools = self.workspace / 'tools'
        (tools / 'scripts').mkdir(parents=True)
        (tools / 'scripts/cloud_capture_hook.py').write_text('fixture')
        (tools / 'scripts/routine_continuation.py').write_text('fixture')
        (tools / 'scripts/image_read_receipt.py').write_text('fixture')
        (tools / 'scripts/claude_session_start.py').write_text('fixture')
        primary = self.workspace / 'primary'; primary.mkdir()
        result = bootstrap.bootstrap(primary, tools, prelaunch_router=True)
        self.assertFalse(result['capture_authorized'])
        self.assertFalse(result['live_hook_observed'])
        settings = json.loads((primary / '.claude/settings.json').read_text())
        self.assertIn('routine_continuation.py', settings['hooks']['Stop'][0]['hooks'][0]['command'])
        self.assertEqual(settings['hooks']['PostToolUse'][0]['matcher'], 'Read')
        self.assertIn('image_read_receipt.py', settings['hooks']['PostToolUse'][0]['hooks'][0]['command'])


class AuthorizedRoutingTests(Fixture):
    def test_real_guard_consumes_one_authorization_in_restored_checkout(self):
        (self.root / 'scripts').mkdir(); (self.root / 'config').mkdir()
        (self.root / 'scripts/capture_guard.py').write_text('fixture')
        (self.root / 'config/claude_runtime.json').write_text('{}')
        self.authorize()
        payload = {'tool_name': 'Bash', 'cwd': str(self.root), 'tool_input': {'command': self.command}}
        self.assertIsNone(router.decision(payload, self.root.parent))
        self.assertIn('already used', router.decision(payload, self.root.parent))


if __name__ == '__main__':
    unittest.main()
