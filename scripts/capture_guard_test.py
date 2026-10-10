"""The capture protocol is enforced at the command boundary. The observed 2026-10-10 command is the fixture."""
import json
import os
import subprocess
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest import mock

import capture_guard as guard

SCRIPT = Path(guard.__file__)
OBSERVED = ('cd video-engine && time (npx --no-install remotion still Dispatch /tmp/a-f030.png '
            '--props=/tmp/inspect-a.json --frame=30 --log=error)')
PLACEHOLDER = {'story_art': {'entries': [{'request_id': 'x', 'sha256': 'scratch', 'creation_id': 'scratch-inspection-only',
                                          'created_at': 'scratch'}]}}
GENUINE = {'story_art': {'entries': [{'request_id': 'x', 'sha256': 'a' * 64, 'creation_id': 'authored-' + 'b' * 20,
                                      'created_at': '2026-10-10T02:00:00+00:00'}]}}


def authorization(minutes=30):
    return {'allowed': True, 'render_reservation': {'event_sha256': 'c' * 64, 'resource': 'preflight_renders'},
            'headroom': {'passed': True, 'required_free_gib': 16}, 'art_receipts_recorded': True,
            'expires_at': (datetime.now(timezone.utc) + timedelta(minutes=minutes)).isoformat()}


class Boundary(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.project = Path(self.tmp.name)
        (self.project / 'out/dispatch').mkdir(parents=True)

    def authorize(self, **kw):
        (self.project / guard.AUTHORIZATION).write_text(json.dumps(kw or authorization()))

    def run_hook(self, command, cwd=None):
        payload = {'tool_name': 'Bash', 'tool_input': {'command': command}, 'cwd': str(cwd or self.project)}
        done = subprocess.run([sys.executable, str(SCRIPT), 'hook'], input=json.dumps(payload), capture_output=True, text=True,
                              env={**os.environ, 'CLAUDE_PROJECT_DIR': str(self.project)})
        self.assertEqual(0, done.returncode, done.stderr)
        return json.loads(done.stdout)['hookSpecificOutput'] if done.stdout.strip() else None

    def test_the_observed_private_capture_is_denied_by_the_real_hook(self):
        out = self.run_hook(OBSERVED)
        self.assertEqual('deny', out['permissionDecision'])
        for expected in ('does not authorize', 'no charged controller render reservation', 'native headroom', 'run_with_env.sh', 'receipts'):
            self.assertIn(expected, out['permissionDecisionReason'])

    def test_every_capture_form_is_denied_without_authorization(self):
        for command in ('npx --no-install remotion still bundle Dispatch o.png --scale=0.5',
                        'bash scripts/run_with_env.sh npx remotion render Dispatch out.mp4',
                        'bash scripts/run_with_env.sh python scripts/preflight_animatic.py --board b.json',
                        'bash scripts/run_with_env.sh python scripts/cinema_proof.py --board b.json',
                        'bash scripts/render_dispatch.sh', 'ffmpeg -y -i in.png out.mp4',
                        'bash scripts/run_with_env.sh python scripts/opening_compare.py --root out/dispatch'):
            self.assertEqual('deny', self.run_hook(command)['permissionDecision'], command)

    def test_cheap_code_checks_and_ordinary_commands_pass_untouched(self):
        for command in ('cd video-engine && npx tsc --noEmit', 'bash scripts/run_with_env.sh python scripts/engine_lint.py',
                        'git status', 'ffprobe -v error -i film.mp4', 'bash scripts/run_with_env.sh python scripts/storyboard_check.py'):
            self.assertIsNone(self.run_hook(command), command)

    def test_words_inside_commit_messages_and_heredocs_are_not_commands(self):
        self.assertIsNone(self.run_hook('git commit -m "ran remotion still outside the wrapper"'))
        self.assertIsNone(self.run_hook("cat > note.md <<'EOF'\nremotion still Dispatch o.png\nEOF\n"))
        self.assertEqual('deny', self.run_hook("cat > note.md <<'EOF'\nx\nEOF\nnpx remotion still Dispatch o.png")['permissionDecision'])

    def test_a_current_authorization_through_the_wrapper_allows_and_stays_bounded(self):
        self.authorize()
        wrapped = 'bash scripts/run_with_env.sh python scripts/preflight_animatic.py --board b.json'
        self.assertIsNone(self.run_hook(wrapped))
        self.assertEqual('deny', self.run_hook('npx remotion still Dispatch o.png')['permissionDecision'])  # wrapper still required
        self.authorize(**authorization(minutes=-1))
        self.assertIn('expired', self.run_hook(wrapped)['permissionDecisionReason'])

    def test_placeholder_props_are_denied_even_with_an_authorization(self):
        self.authorize()
        props = self.project / 'inspect-a.json'
        props.write_text(json.dumps(PLACEHOLDER))
        command = f'bash scripts/run_with_env.sh npx remotion still Dispatch o.png --props={props}'
        self.assertIn('placeholder', self.run_hook(command)['permissionDecisionReason'])
        props.write_text(json.dumps(GENUINE))
        self.assertIsNone(self.run_hook(command))

    def test_the_guard_fails_closed_for_captures_and_open_for_everything_else(self):
        with mock.patch.object(guard, 'decide', side_effect=RuntimeError('boom')):
            payload = {'tool_name': 'Bash', 'tool_input': {'command': 'npx remotion still Dispatch o.png'}}
            with mock.patch('sys.stdin', new=__import__('io').StringIO(json.dumps(payload))), mock.patch('builtins.print') as shown:
                guard.hook()
            self.assertIn('deny', shown.call_args[0][0])
            payload['tool_input']['command'] = 'git status'
            with mock.patch('sys.stdin', new=__import__('io').StringIO(json.dumps(payload))), mock.patch('builtins.print') as shown:
                guard.hook()
            shown.assert_not_called()


class Authorize(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name) / 'work'
        (self.root / 'out/dispatch').mkdir(parents=True)
        self.state = self.root / 'out/dispatch/run_state.json'
        self.board = self.root / 'out/dispatch/storyboard.json'
        self.board.write_text(json.dumps(dict(GENUINE, runtime_s=4, scenes=[{'start_s': 0, 'duration_s': 4}])))
        self.reserved = {'at': '2026-10-10T02:30:00Z', 'kind': 'reserved', 'note': 'preview', 'resources': {'preflight_renders': 1}}

    def ledger(self, *events):
        self.state.write_text(json.dumps({'events': list(events)}))

    def attempt(self, **patches):
        with mock.patch('authored_story_art.problems', return_value=[]), mock.patch('native_headroom.estimate', return_value={'required_free_gib': 1}):
            return guard.authorize(self.root, self.state, self.board, housekeeping=False, **patches)

    def test_no_charged_render_reservation_means_no_authorization(self):
        self.ledger({'at': 'x', 'kind': 'reserved', 'resources': {'research_agents': 1}})
        with self.assertRaisesRegex(ValueError, 'no unused charged render reservation'):
            self.attempt()
        self.assertFalse((self.root / guard.AUTHORIZATION).exists())

    def test_a_reservation_authorizes_once(self):
        self.ledger(self.reserved)
        record = self.attempt()
        self.assertTrue(record['allowed'])
        self.assertEqual('preflight_renders', record['render_reservation']['resource'])
        with self.assertRaisesRegex(ValueError, 'no unused charged render reservation'):
            self.attempt()
        self.ledger(self.reserved, dict(self.reserved, at='2026-10-10T02:40:00Z'))
        self.assertTrue(self.attempt()['allowed'])

    def test_placeholder_or_unrecorded_receipts_and_missing_headroom_refuse(self):
        self.ledger(self.reserved)
        self.board.write_text(json.dumps(dict(PLACEHOLDER, runtime_s=4, scenes=[{'start_s': 0, 'duration_s': 4}])))
        with self.assertRaisesRegex(ValueError, 'genuine authored art receipts'):
            self.attempt()
        self.board.write_text(json.dumps(dict(GENUINE, runtime_s=4, scenes=[{'start_s': 0, 'duration_s': 4}])))
        with mock.patch('authored_story_art.problems', return_value=[]), \
                mock.patch('native_headroom.estimate', return_value={'required_free_gib': 10 ** 9}):
            with self.assertRaisesRegex(ValueError, 'native headroom failed'):
                guard.authorize(self.root, self.state, self.board, housekeeping=False)


if __name__ == '__main__':
    unittest.main()
