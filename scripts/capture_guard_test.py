"""The capture protocol is enforced at the command boundary. The observed 2026-10-10 command and the
independent audit's six reproductions are the fixtures, and the genuine capture path must still work."""
import hashlib
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
GENUINE = {'story_art': {'entries': [{'request_id': 'x', 'file': 'art/Hero.tsx', 'sha256': 'a' * 64,
                                      'creation_id': 'authored-' + 'b' * 20, 'created_at': '2026-10-10T02:00:00+00:00'}]},
           'film_direction': {'renderer_inputs': [{'path': 'src/Film.tsx', 'sha256': 'x'}]},
           'runtime_s': 4, 'scenes': [{'start_s': 0, 'duration_s': 4}]}
PLACEHOLDER = {'story_art': {'entries': [{'request_id': 'x', 'sha256': 'scratch', 'creation_id': 'scratch-inspection-only',
                                          'created_at': 'scratch'}]}}
WRAP = 'bash scripts/run_with_env.sh '


class Fixture(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name) / 'work'
        for d in ('out/dispatch', 'art', 'src'):
            (self.root / d).mkdir(parents=True)
        (self.root / 'art/Hero.tsx').write_text('export const Hero = 1;')
        (self.root / 'src/Film.tsx').write_text('export const Film = 1;')
        art = hashlib.sha256((self.root / 'art/Hero.tsx').read_bytes()).hexdigest()
        film = hashlib.sha256((self.root / 'src/Film.tsx').read_bytes()).hexdigest()
        board = json.loads(json.dumps(GENUINE))
        board['story_art']['entries'][0]['sha256'] = art
        board['film_direction']['renderer_inputs'][0]['sha256'] = film
        self.board = self.root / 'out/dispatch/storyboard.json'
        self.board.write_text(json.dumps(board))
        self.other = self.root / 'out/dispatch/unrelated.json'
        self.other.write_text(json.dumps(board, indent=1))
        self.state = self.root / 'out/dispatch/run_state.json'
        self.reserved = {'at': '2026-10-10T02:30:00Z', 'kind': 'reserved', 'note': 'phone preview',
                         'resources': {'preflight_renders': 1}}
        self.ledger(self.reserved)
        self.command = WRAP + f'npx --no-install remotion still Dispatch {self.root}/out/o.png --props={self.board}'

    def ledger(self, *events):
        self.state.write_text(json.dumps({'events': list(events)}))

    def authorize(self, commands=None, **kw):
        kw.setdefault('housekeeping', False)
        with mock.patch('authored_story_art.problems', return_value=[]), \
                mock.patch('native_headroom.estimate', return_value={'required_free_gib': 1}):
            return guard.authorize(self.root, self.state, [self.board], commands or [self.command], **kw)

    def hook(self, command, cwd=None, free=None):
        payload = {'tool_name': 'Bash', 'tool_input': {'command': command}, 'cwd': str(cwd or self.root)}
        with mock.patch.object(guard.shutil, 'disk_usage', return_value=mock.Mock(free=int((free if free is not None else 500) * 1024 ** 3))):
            return guard.decide(payload, self.root)


class Boundary(Fixture):
    def test_the_observed_private_capture_is_denied_by_the_real_hook_process(self):
        observed = ('cd video-engine && time (npx --no-install remotion still Dispatch /tmp/a-f030.png '
                    '--props=/tmp/inspect-a.json --frame=30 --log=error)')
        done = subprocess.run([sys.executable, str(SCRIPT), 'hook'], capture_output=True, text=True,
                              input=json.dumps({'tool_name': 'Bash', 'tool_input': {'command': observed}, 'cwd': str(self.root)}),
                              env={**os.environ, 'CLAUDE_PROJECT_DIR': str(self.root)})
        out = json.loads(done.stdout)['hookSpecificOutput']
        self.assertEqual('deny', out['permissionDecision'])
        self.assertIn('no current capture authorization', out['permissionDecisionReason'])

    def test_every_capture_form_is_denied_without_authorization(self):
        for command in ('npx --no-install remotion still bundle Dispatch o.png --scale=0.5', WRAP + 'npx remotion render Dispatch out.mp4',
                        WRAP + 'python scripts/preflight_animatic.py --board b.json', WRAP + 'python scripts/cinema_proof.py --board b.json',
                        'bash scripts/render_dispatch.sh', 'ffmpeg -y -i in.png out.mp4', WRAP + 'python scripts/opening_compare.py --root x'):
            self.assertIsNotNone(self.hook(command), command)

    def test_cheap_code_checks_and_ordinary_commands_pass_untouched(self):
        for command in ('cd video-engine && npx tsc --noEmit', WRAP + 'python scripts/engine_lint.py', 'git status',
                        'ffprobe -v error -i film.mp4', WRAP + 'python scripts/storyboard_check.py --board b.json',
                        'git commit -m "ran remotion still outside the wrapper"', "cat > n.md <<'EOF'\nremotion still Dispatch o.png\nEOF\n"):
            self.assertIsNone(self.hook(command), command)
        self.assertIsNotNone(self.hook("cat > n.md <<'EOF'\nx\nEOF\nnpx remotion still Dispatch o.png"))

    def test_the_genuine_capture_path_works_once_and_only_once(self):
        self.authorize()
        self.assertIsNone(self.hook(self.command))
        again = self.hook(self.command)
        self.assertIn('already used', again)
        # The same bytes as a second capture need a fresh reservation and a new authorization.
        with self.assertRaisesRegex(ValueError, 'no fresh unused charged render reservation'):
            self.authorize()
        self.ledger(self.reserved, dict(self.reserved, at='2026-10-10T02:50:00Z'))
        self.authorize()
        self.assertIsNone(self.hook(self.command))

    def test_audit_1_one_authorization_cannot_cover_repeated_captures(self):
        self.authorize()
        self.assertIsNone(self.hook(self.command))
        for _ in range(3):
            self.assertIn('already used', self.hook(self.command))

    def test_audit_2_quoted_props_with_placeholder_art_cannot_bypass(self):
        placeholder = self.root / 'out/dispatch/bad.json'
        placeholder.write_text(json.dumps(PLACEHOLDER))
        command = WRAP + f'npx remotion still Dispatch o.png --props="{placeholder}"'
        self.authorize([command])
        reason = self.hook(command)
        self.assertIn('placeholder', reason)
        self.assertIn('not one of the authorized boards', reason)
        single = WRAP + f"npx remotion still Dispatch o.png --props '{placeholder}'"
        self.assertIn('placeholder', self.hook(single))

    def test_audit_3_unresolved_props_variables_fail_closed(self):
        for value in ('$SP/inspect-a.json', '${SP}/a.json', '`pwd`/a.json', '$(pwd)/a.json', '~/a.json'):
            command = WRAP + f'npx remotion still Dispatch o.png --props={value}'
            reason = self.hook(command)
            self.assertIsNotNone(reason, value)
        self.ledger(self.reserved, dict(self.reserved, at='x2'))
        command = WRAP + 'npx remotion still Dispatch o.png --props=$SP/inspect-a.json'
        self.authorize([command])
        self.assertIn('unresolved --props input', self.hook(command))

    def test_audit_4_an_unrelated_board_is_not_allowed(self):
        command = WRAP + f'python scripts/preflight_animatic.py --board {self.other}'
        self.authorize([command])
        self.assertIn('is not one of the authorized boards', self.hook(command))
        unreadable = WRAP + f'python scripts/preflight_animatic.py --board {self.root}/out/missing.json'
        self.ledger(self.reserved, dict(self.reserved, at='x3'))
        self.authorize([unreadable])
        self.assertIn('unreadable --board input', self.hook(unreadable))

    def test_a_command_the_authorization_does_not_list_is_denied(self):
        self.authorize()
        other = self.command + ' --scale=0.5'
        self.assertIn('not one the authorization lists', self.hook(other))

    def test_changed_board_renderer_input_or_art_after_authorization_is_denied(self):
        self.authorize()
        (self.root / 'src/Film.tsx').write_text('export const Film = 2;')
        self.assertIn('renderer inputs changed', self.hook(self.command))
        (self.root / 'src/Film.tsx').write_text('export const Film = 1;')
        (self.root / 'art/Hero.tsx').write_text('export const Hero = 2;')
        self.assertIn('authored art changed', self.hook(self.command))
        (self.root / 'art/Hero.tsx').write_text('export const Hero = 1;')
        self.board.write_text(self.board.read_text() + ' ')
        self.assertIn('authorized board changed', self.hook(self.command))

    def test_headroom_is_rechecked_at_the_command(self):
        self.authorize()
        self.assertIn('current native headroom is below', self.hook(self.command, free=0.001))
        self.assertIsNone(self.hook(self.command, free=500))

    def test_expired_authorization_and_missing_wrapper_are_denied(self):
        self.authorize()
        auth = json.loads((self.root / guard.AUTHORIZATION).read_text())
        auth['expires_at'] = (datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat()
        (self.root / guard.AUTHORIZATION).write_text(json.dumps(auth))
        self.assertIn('expired', self.hook(self.command))
        with self.assertRaisesRegex(ValueError, 'not a wrapped capture command'):
            self.authorize(['npx remotion still Dispatch o.png'])

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


class Authorize(Fixture):
    def test_no_fresh_charged_render_reservation_means_no_authorization(self):
        for events in ([], [{'at': 'x', 'kind': 'reserved', 'resources': {'research_agents': 1}}],
                       [dict(self.reserved, note='LATE CHARGE for procedural defect: unreserved builder still')]):
            self.ledger(*events)
            with self.assertRaisesRegex(ValueError, 'no fresh unused charged render reservation'):
                self.authorize()
        self.assertFalse((self.root / guard.AUTHORIZATION).exists())

    def test_placeholder_receipts_and_missing_headroom_refuse(self):
        self.board.write_text(json.dumps(dict(PLACEHOLDER, runtime_s=4, scenes=[{'start_s': 0, 'duration_s': 4}])))
        with self.assertRaisesRegex(ValueError, 'genuine authored art receipts'):
            self.authorize()
        self.board.write_text(json.dumps(GENUINE))
        with mock.patch('authored_story_art.problems', return_value=[]), mock.patch('native_headroom.estimate', return_value={'required_free_gib': 10 ** 9}):
            with self.assertRaisesRegex(ValueError, 'native headroom failed'):
                guard.authorize(self.root, self.state, [self.board], [self.command], housekeeping=False)

    def test_housekeeping_runs_with_apply_fetch_and_the_computed_minimum_and_keeps_its_receipt(self):
        seen = {}

        def fake(command, **kwargs):
            seen['command'] = command
            return subprocess.CompletedProcess(command, 0, stdout='{"headroom_ready": true}', stderr='')

        record = self.authorize(housekeeping=True, run=fake)
        for flag in ('--apply', '--fetch', '--summary', '--require-headroom'):
            self.assertIn(flag, seen['command'])
        self.assertEqual('1', seen['command'][seen['command'].index('--min-free-gib') + 1])
        receipt = Path(record['housekeeping']['receipt'])
        self.assertEqual(hashlib.sha256(receipt.read_bytes()).hexdigest(), record['housekeeping']['receipt_sha256'])
        self.assertEqual(0, json.loads(receipt.read_text())['exit_code'])

    def test_a_failed_housekeeping_run_refuses_and_keeps_the_receipt(self):
        fake = lambda command, **kwargs: subprocess.CompletedProcess(command, 3, stdout='no headroom', stderr='')
        with self.assertRaisesRegex(ValueError, 'housekeeping --require-headroom failed'):
            self.authorize(housekeeping=True, run=fake)
        self.assertTrue(list((self.root / 'out/dispatch').glob('capture-housekeeping-*.json')))
        self.assertFalse((self.root / guard.AUTHORIZATION).exists())


if __name__ == '__main__':
    unittest.main()
