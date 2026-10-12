"""Regress the observed phone/hero double charge without weakening single-use capture."""
import copy
import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import capture_guard as guard
import capture_reservation as prepared
import run_controller as controller


class Reservation(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / 'out/dispatch').mkdir(parents=True)
        (self.root / 'scripts').mkdir()
        for name in (*prepared.OPERATIONS, 'capture_reservation.py'):
            (self.root / 'scripts' / name).write_text('# pinned operator\n')
        self.state = self.root / 'out/dispatch/run_state.json'
        self.board = self.state.with_name('storyboard.json')
        self.board.write_text('{"runtime_s":4,"scenes":[]}')
        self.patch = mock.patch.object(controller, 'REPO', self.root)
        self.patch.start()
        self.addCleanup(self.patch.stop)
        controller.initialise(self.state, 'reservation-regression', 'production')

    def command(self, name):
        return 'bash scripts/run_with_env.sh python scripts/' + name + ' --board out/dispatch/storyboard.json'

    def authorise(self, name='cinema_proof.py'):
        command = self.command(name)
        receipt = prepared.prepare(self.root, self.state, [command])
        state = controller.read_state(self.state)
        event = next(e for e in state['events'] if guard.event_digest(e) == receipt['event_sha256'])
        auth = {'prepared_capture': receipt,
                'render_reservation': {'event_sha256': guard.event_digest(event)},
                'commands': [{'text': command, 'consumed': 'host-consumed'}]}
        (self.root / guard.AUTHORIZATION).write_text(json.dumps(auth))
        return receipt, auth

    def test_actual_operator_claims_one_charge_and_cannot_claim_twice(self):
        self.authorise()
        before = copy.deepcopy(controller.read_state(self.state))
        self.assertTrue(prepared.claim(self.state, prepared.OPERATIONS['cinema_proof.py'])[0])
        after = controller.read_state(self.state)
        self.assertEqual(before['usage'], after['usage'])
        self.assertFalse(prepared.claim(self.state, prepared.OPERATIONS['cinema_proof.py'])[0])
        self.assertEqual(after['usage'], controller.read_state(self.state)['usage'])

    def test_real_phone_hero_and_motion_operations_have_distinct_identities(self):
        identities = [controller.preflight_identity(self.state, note) for note in prepared.OPERATIONS.values()]
        self.assertEqual(3, len(set(identities)))
        self.assertEqual(controller.preflight_identity(self.state, 'animatic'), identities[0])
        self.assertEqual(controller.preflight_identity(self.state, 'hero'), identities[1])
        self.assertEqual(controller.preflight_identity(self.state, 'arbitrary rewritten note'), identities[0])

    def test_operator_source_is_part_of_the_actual_render_input_identity(self):
        note = prepared.OPERATIONS['cinema_proof.py']
        before = controller.preflight_identity(self.state, note)
        (self.root / 'scripts/cinema_proof.py').write_text('# corrected reservation handoff\n')
        self.assertNotEqual(before, controller.preflight_identity(self.state, note))

    def test_unchanged_operation_cannot_be_prepared_again(self):
        self.authorise()
        before = controller.read_state(self.state)['usage']
        with self.assertRaisesRegex(ValueError, 'identical preflight inputs'):
            prepared.prepare(self.root, self.state, [self.command('cinema_proof.py')])
        self.assertEqual(before, controller.read_state(self.state)['usage'])

    def test_hook_consumption_is_required(self):
        _, auth = self.authorise()
        auth['commands'][0]['consumed'] = False
        (self.root / guard.AUTHORIZATION).write_text(json.dumps(auth))
        self.assertFalse(prepared.claim(self.state, prepared.OPERATIONS['cinema_proof.py'])[0])

    def test_wrong_operator_cannot_claim_the_prepaid_hero(self):
        self.authorise()
        before = controller.read_state(self.state)['usage']
        self.assertFalse(prepared.claim(self.state, prepared.OPERATIONS['preflight_animatic.py'])[0])
        self.assertEqual(before, controller.read_state(self.state)['usage'])

    def test_changed_inputs_cannot_claim_an_old_charge(self):
        self.authorise()
        self.board.write_text('{"runtime_s":5,"scenes":[]}')
        self.assertFalse(prepared.claim(self.state, prepared.OPERATIONS['cinema_proof.py'])[0])

    def test_fabricated_event_and_terminal_ledger_are_rejected(self):
        _, auth = self.authorise()
        auth['prepared_capture']['event_sha256'] = '0' * 64
        auth['render_reservation']['event_sha256'] = '0' * 64
        (self.root / guard.AUTHORIZATION).write_text(json.dumps(auth))
        self.assertFalse(prepared.claim(self.state, prepared.OPERATIONS['cinema_proof.py'])[0])
        _, auth = self.authorise('preflight_animatic.py')
        state = controller.read_state(self.state)
        state['terminal_state'] = 'shipped'
        controller.save(self.state, state)
        self.assertFalse(prepared.claim(self.state, prepared.OPERATIONS['preflight_animatic.py'])[0])

    def test_raw_mixed_or_foreign_capture_cannot_acquire_a_prepared_charge(self):
        for command in ('bash scripts/run_with_env.sh npx remotion still Dispatch out/a.png',
                        self.command('cinema_proof.py') + '; npx remotion still Dispatch out/a.png',
                        'bash scripts/run_with_env.sh python /tmp/cinema_proof.py --board out/dispatch/storyboard.json'):
            with self.subTest(command=command), self.assertRaises(ValueError):
                prepared.prepare(self.root, self.state, [command])
        self.assertEqual(0, controller.read_state(self.state)['usage']['preflight_renders'])

    def test_foreign_state_board_or_mix_cannot_acquire_a_charge(self):
        for flag in ('state', 'board', 'mix'):
            with self.subTest(flag=flag), self.assertRaisesRegex(ValueError, 'canonical current input'):
                prepared.prepare(self.root, self.state, [self.command('cinema_proof.py') + ' --' + flag + ' /tmp/foreign.json'])
        self.assertEqual(0, controller.read_state(self.state)['usage']['preflight_renders'])

    def test_motion_identity_is_bound_to_the_registered_native_bytes(self):
        state = controller.read_state(self.state)
        state['deliverable'] = {'film_sha256': 'a' * 64}
        controller.save(self.state, state)
        first = controller.preflight_identity(self.state, prepared.OPERATIONS['claude_motion_review.py'])
        state['deliverable']['film_sha256'] = 'b' * 64
        controller.save(self.state, state)
        self.assertNotEqual(first, controller.preflight_identity(self.state, prepared.OPERATIONS['claude_motion_review.py']))

    def test_legacy_unprepared_operator_still_charges_normally(self):
        self.assertTrue(prepared.claim(self.state, prepared.OPERATIONS['cinema_proof.py'])[0])
        self.assertEqual(1, controller.read_state(self.state)['usage']['preflight_renders'])

    def test_authorization_real_hook_consumption_and_operator_use_one_charge(self):
        board = {'runtime_s': 4, 'scenes': [], 'story_art': {'entries': [{
            'request_id': 'test-hero', 'file': 'scripts/capture_reservation.py',
            'sha256': guard.sha(self.root / 'scripts/capture_reservation.py'),
            'creation_id': 'authored-' + 'a' * 20, 'created_at': '2026-10-12T00:00:00Z'}]},
            'film_direction': {'renderer_inputs': []}}
        self.board.write_text(json.dumps(board))
        command = self.command('cinema_proof.py')
        with mock.patch('authored_story_art.problems', return_value=[]), \
                mock.patch('native_headroom.estimate', return_value={'required_free_gib': 1}), \
                mock.patch.object(guard.shutil, 'disk_usage', return_value=mock.Mock(free=500 * 1024 ** 3)):
            auth = guard.authorize(self.root, self.state, [self.board], [command],
                                   housekeeping=False, prepare=True)
            self.assertEqual(1, controller.read_state(self.state)['usage']['preflight_renders'])
            payload = {'tool_name': 'Bash', 'tool_input': {'command': command}, 'cwd': str(self.root)}
            self.assertIsNone(guard.decide(payload, self.root))
            self.assertTrue(prepared.claim(self.state, prepared.OPERATIONS['cinema_proof.py'])[0])
            self.assertEqual(1, controller.read_state(self.state)['usage']['preflight_renders'])
            self.assertIn('already used', guard.decide(payload, self.root))
            self.assertFalse(prepared.claim(self.state, prepared.OPERATIONS['cinema_proof.py'])[0])
            self.assertEqual(auth['prepared_capture']['event_sha256'],
                             controller.read_state(self.state)['events'][-1]['event_sha256'])


if __name__ == '__main__':
    unittest.main()
