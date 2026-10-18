"""Regress the observed phone/hero double charge without weakening single-use capture."""
import copy
import contextlib
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
        self.root = Path(self.temp.name).resolve()
        (self.root / 'out/dispatch').mkdir(parents=True)
        (self.root / 'scripts').mkdir()
        for name in (*prepared.OPERATIONS, 'capture_reservation.py'):
            (self.root / 'scripts' / name).write_text('# pinned operator\n')
        self.state = self.root / 'out/dispatch/run_state.json'
        self.board = self.state.with_name('storyboard.json')
        self.board.write_text('{"runtime_s":4,"scenes":[]}')
        for key in ('a', 'b'):
            self.state.with_name('opening-' + key + '.json').write_bytes(self.board.read_bytes())
        (self.root / 'video-engine/scripts').mkdir(parents=True)
        (self.root / 'video-engine/scripts/render-batch.mjs').write_text('// pinned batch renderer\n')
        (self.root / 'video-engine/package-lock.json').write_text('{}')
        self.patch = mock.patch.object(controller, 'REPO', self.root)
        self.patch.start()
        self.addCleanup(self.patch.stop)
        controller.initialise(self.state, 'reservation-regression', 'production')

    def command(self, name):
        command = 'bash scripts/run_with_env.sh python scripts/' + name + ' --board out/dispatch/storyboard.json'
        return command + (' --out out/dispatch/motion-review' if name == 'claude_motion_review.py' else '')

    def native_inputs(self):
        film = self.state.parent / 'film.mp4'
        film.write_bytes(b'registered native movie fixture')
        state = controller.read_state(self.state)
        state['deliverable'] = {'review_only': False, 'film_sha256': controller.digest(film),
                                'board_sha256': controller.digest(self.board)}
        controller.save(self.state, state)

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
        self.assertEqual(len(prepared.OPERATIONS), len(set(identities)))
        self.assertEqual(controller.preflight_identity(self.state, 'animatic'), identities[0])
        self.assertEqual(controller.preflight_identity(self.state, 'hero'), identities[1])
        self.assertEqual(controller.preflight_identity(self.state, 'arbitrary rewritten note'), identities[0])

    def test_native_motion_operator_succeeds_with_only_one_funded_entry(self):
        film = self.state.parent / 'film.mp4'
        film.write_bytes(b'registered native movie fixture')
        state = controller.read_state(self.state)
        state['deliverable'] = {'review_only': False, 'film_sha256': controller.digest(film),
                                'board_sha256': controller.digest(self.board)}
        state['limits']['preflight_renders'] = state['escalation_ceiling']['preflight_renders'] = 1
        controller.save(self.state, state)
        self.authorise('claude_motion_review.py')
        note = prepared.OPERATIONS['claude_motion_review.py']
        self.assertTrue(controller.reserve(self.state, {'preflight_renders': 1}, note)[0])
        self.assertEqual(controller.read_state(self.state)['usage']['preflight_renders'], 1)
        self.assertFalse(controller.reserve(self.state, {'preflight_renders': 1}, note)[0])
        self.assertEqual(controller.read_state(self.state)['usage']['preflight_renders'], 1)

    def test_occupied_motion_output_refuses_before_charge_and_keeps_evidence(self):
        self.native_inputs()
        output = self.state.parent / 'motion-review'
        output.mkdir()
        old = output / 'index.json'; old.write_bytes(b'actual earlier film index')
        before = self.state.read_bytes()
        with self.assertRaisesRegex(ValueError, 'motion output already exists'):
            prepared.prepare(self.root, self.state, [self.command('claude_motion_review.py')])
        self.assertEqual(before, self.state.read_bytes())
        self.assertEqual(b'actual earlier film index', old.read_bytes())
        output.rename(output.with_name('motion-review-retained'))
        self.authorise('claude_motion_review.py')
        self.assertTrue(prepared.claim(self.state, prepared.OPERATIONS['claude_motion_review.py'])[0])
        self.assertEqual(1, controller.read_state(self.state)['usage']['preflight_renders'])
        self.assertEqual(b'actual earlier film index', (output.with_name('motion-review-retained') / 'index.json').read_bytes())

    def test_real_authorization_refuses_occupied_output_then_claims_one_fresh_charge(self):
        board = {'runtime_s': 4, 'scenes': [], 'story_art': {'entries': [{
            'request_id': 'test-hero', 'file': 'scripts/capture_reservation.py',
            'sha256': guard.sha(self.root / 'scripts/capture_reservation.py'),
            'creation_id': 'authored-' + 'a' * 20, 'created_at': '2026-10-17T00:00:00Z'}]},
            'film_direction': {'renderer_inputs': []}}
        self.board.write_text(json.dumps(board)); self.native_inputs()
        output = self.state.parent / 'motion-review'; output.mkdir()
        (output / 'index.json').write_bytes(b'retained earlier index')
        command = self.command('claude_motion_review.py')
        before = self.state.read_bytes()
        with mock.patch('authored_story_art.problems', return_value=[]), \
                mock.patch('native_headroom.estimate', return_value={'required_free_gib': 1}), \
                mock.patch.object(guard.shutil, 'disk_usage', return_value=mock.Mock(free=500 * 1024 ** 3)):
            with self.assertRaisesRegex(ValueError, 'motion output already exists'):
                guard.authorize(self.root, self.state, [self.board], [command], housekeeping=False, prepare=True)
            self.assertEqual(before, self.state.read_bytes())
            self.assertFalse((self.root / guard.AUTHORIZATION).exists())
            output.rename(output.with_name('motion-review-original'))
            guard.authorize(self.root, self.state, [self.board], [command], housekeeping=False, prepare=True)
            self.assertIsNone(guard.decide({'tool_name': 'Bash', 'tool_input': {'command': command},
                                           'cwd': str(self.root)}, self.root))
            self.assertTrue(controller.reserve(self.state, {'preflight_renders': 1},
                                               prepared.OPERATIONS['claude_motion_review.py'])[0])
        self.assertEqual(1, controller.read_state(self.state)['usage']['preflight_renders'])
        self.assertEqual(b'retained earlier index', (output.with_name('motion-review-original') / 'index.json').read_bytes())

    def test_motion_destination_file_and_broken_symlink_preserve_zero_charge(self):
        output = self.state.parent / 'motion-review'
        before = self.state.read_bytes()
        output.write_bytes(b'retained original file')
        with self.assertRaisesRegex(ValueError, 'motion output already exists'):
            prepared.prepare(self.root, self.state, [self.command('claude_motion_review.py')])
        self.assertEqual(before, self.state.read_bytes())
        self.assertEqual(b'retained original file', output.read_bytes())
        output.rename(output.with_name('motion-review-original'))
        output.symlink_to('missing-target')
        with self.assertRaisesRegex(ValueError, 'motion output already exists'):
            prepared.prepare(self.root, self.state, [self.command('claude_motion_review.py')])
        self.assertEqual(before, self.state.read_bytes())
        self.assertTrue(output.is_symlink())

    def test_motion_output_requires_one_owned_literal_destination_before_charge(self):
        command = self.command('claude_motion_review.py')
        before = self.state.read_bytes()
        for changed in (command.replace(' --out out/dispatch/motion-review', ''),
                        command + ' --out out/dispatch/duplicate',
                        command.replace('out/dispatch/motion-review', '/tmp/foreign-motion-review'),
                        command.replace('out/dispatch/motion-review', '$MOTION_OUTPUT')):
            with self.subTest(command=changed), self.assertRaises(ValueError):
                prepared.prepare(self.root, self.state, [changed])
            self.assertEqual(before, self.state.read_bytes())

    def test_phone_motion_destination_is_checked_before_charge(self):
        output = self.state.parent / 'openings'; output.mkdir()
        destination = output / 'motion-a'; destination.mkdir()
        command = ('bash scripts/run_with_env.sh python scripts/claude_motion_review.py --phone-option a'
                   ' --board out/dispatch/openings/a.json --film out/dispatch/openings/a.mp4'
                   ' --state out/dispatch/run_state.json --out=out/dispatch/openings/motion-a')
        before = self.state.read_bytes()
        with self.assertRaisesRegex(ValueError, 'motion output already exists'):
            prepared.prepare(self.root, self.state, [command])
        self.assertEqual(before, self.state.read_bytes())

    def test_exact_phone_options_precharge_once_and_bind_encoded_inputs(self):
        output = self.state.parent / 'openings'; output.mkdir()
        (output / 'comparison.json').write_text('{}')
        identities = []
        for option in ('a', 'b'):
            (output / (option + '.json')).write_text('{}')
            (output / (option + '.mp4')).write_bytes(option.encode())
            command = ('bash scripts/run_with_env.sh python scripts/claude_motion_review.py --phone-option ' + option
                + ' --board out/dispatch/openings/' + option + '.json --film out/dispatch/openings/' + option
                + '.mp4 --state out/dispatch/run_state.json --out out/dispatch/openings/motion-' + option)
            note = prepared.PHONE_OPERATIONS[option]
            self.assertEqual(prepared.operation_for([command], self.root), note)
            with mock.patch('claude_motion_review.phone_inputs', return_value={}):
                receipt = prepared.prepare(self.root, self.state, [command])
            identities.append(receipt['input_identity'])
            auth = {'prepared_capture': receipt, 'render_reservation': {'event_sha256': receipt['event_sha256']},
                    'commands': [{'text': command, 'consumed': True}]}
            (self.root / guard.AUTHORIZATION).write_text(json.dumps(auth))
            before = controller.read_state(self.state)['usage']['preflight_renders']
            self.assertTrue(prepared.claim(self.state, note)[0])
            self.assertEqual(controller.read_state(self.state)['usage']['preflight_renders'], before)
            self.assertFalse(prepared.claim(self.state, note)[0])
            (output / (option + '.mp4')).write_bytes(b'changed encoded film')
            self.assertNotEqual(receipt['input_identity'], controller.preflight_identity(self.state, note))
        self.assertNotEqual(*identities)
        self.assertEqual(controller.read_state(self.state)['usage']['preflight_renders'], 2)

    def test_phone_prepare_refuses_wrong_board_before_charge(self):
        before = controller.read_state(self.state)['usage']
        command = self.command('claude_motion_review.py') + ' --phone-option a'
        with self.assertRaisesRegex(ValueError, 'canonical current input'):
            prepared.prepare(self.root, self.state, [command])
        self.assertEqual(controller.read_state(self.state)['usage'], before)

    def test_current_timed_phone_capture_claims_once_and_binds_its_receipt(self):
        film = self.state.parent / 'preflight.mp4'; film.write_bytes(b'current timed movie')
        report = self.state.parent / 'preflight.json'; report.write_text('{}')
        command = self.command('claude_motion_review.py') + ' --phone-option current --film out/dispatch/preflight.mp4'
        note = prepared.PHONE_OPERATIONS['current']
        with mock.patch('claude_motion_review.phone_inputs', return_value={}):
            receipt = prepared.prepare(self.root, self.state, [command])
        auth = {'prepared_capture': receipt, 'render_reservation': {'event_sha256': receipt['event_sha256']},
                'commands': [{'text': command, 'consumed': True}]}
        (self.root / guard.AUTHORIZATION).write_text(json.dumps(auth))
        self.assertTrue(prepared.claim(self.state, note)[0])
        self.assertFalse(prepared.claim(self.state, note)[0])
        self.assertEqual(controller.read_state(self.state)['usage']['preflight_renders'], 1)
        report.write_text('{"changed":true}')
        self.assertNotEqual(receipt['input_identity'], controller.preflight_identity(self.state, note))

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

    def test_real_infrastructure_retry_keeps_spent_charge_and_claims_new_receipt_once(self):
        old, _ = self.authorise()
        failure = self.state.parent / 'actual-tool-denial.fixture.txt'
        failure.write_text('Fixture of original host tool response: execution denied after capture hook consumption.\n')
        accepted, _ = controller.retry_preflight(self.state, 'hero', failure,
            'Fixture of supported specific approval for the exact denied command')
        self.assertTrue(accepted)
        new, _ = self.authorise()
        self.assertNotEqual(old['event_sha256'], new['event_sha256'])
        self.assertEqual(2, controller.read_state(self.state)['usage']['preflight_renders'])
        self.assertTrue(prepared.claim(self.state, prepared.OPERATIONS['cinema_proof.py'])[0])
        self.assertFalse(prepared.claim(self.state, prepared.OPERATIONS['cinema_proof.py'])[0])
        self.assertFalse(controller.retry_preflight(self.state, 'hero', failure,
            'Fixture of supported specific approval for the exact denied command')[0])
        self.assertEqual(2, controller.read_state(self.state)['usage']['preflight_renders'])

    def test_relative_retry_matches_the_canonical_prepared_reservation(self):
        old, _ = self.authorise()
        failure = self.state.parent / 'transport-failure.fixture.txt'
        failure.write_text('Synthetic test transport failure after the hook consumed the record.\n')
        with contextlib.chdir(self.root):
            accepted, message = controller.retry_preflight(Path('out/dispatch/run_state.json'),
                'hero', failure, 'Fixture of supported approval of the exact native capture command')
        self.assertTrue(accepted, message)
        new, _ = self.authorise()
        self.assertNotEqual(old['event_sha256'], new['event_sha256'])
        self.assertEqual(2, controller.read_state(self.state)['usage']['preflight_renders'])

    def test_original_relative_reservation_keeps_its_own_retry_identity(self):
        failure = self.state.parent / 'legacy-transport-failure.fixture.txt'
        failure.write_text('Synthetic test infrastructure failure for a legacy relative-path reservation.\n')
        with contextlib.chdir(self.root):
            relative = Path('out/dispatch/run_state.json')
            self.assertTrue(controller.reserve(relative, {'preflight_renders': 1}, 'hero',
                _use_prepared_capture=False)[0])
            original = controller.read_state(relative)['events'][-1]['preflight_identity']
            accepted, message = controller.retry_preflight(relative, 'hero', failure,
                'Fixture of supported approval for the exact legacy operation')
            self.assertTrue(accepted, message)
            self.assertEqual(original, controller.read_state(relative)['preflight_retry'])
            self.assertTrue(controller.reserve(relative, {'preflight_renders': 1}, 'hero',
                _use_prepared_capture=False)[0])
        self.assertEqual(2, controller.read_state(self.state)['usage']['preflight_renders'])

    def test_retry_refuses_changed_inputs_without_a_matching_reservation(self):
        self.authorise()
        self.board.write_text('{"runtime_s":5,"scenes":[]}')
        failure = self.state.parent / 'other-inputs.fixture.txt'
        failure.write_text('Synthetic test failure does not authorize different production inputs.\n')
        with contextlib.chdir(self.root):
            accepted, message = controller.retry_preflight(Path('out/dispatch/run_state.json'),
                'hero', failure, 'Fixture of supported approval that cannot replace input bindings')
        self.assertFalse(accepted)
        self.assertIn('no previous reservation', message)
        self.assertEqual(1, controller.read_state(self.state)['usage']['preflight_renders'])
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
            self.assertTrue(controller.reserve(self.state, {'preflight_renders': 1}, prepared.OPERATIONS['cinema_proof.py'])[0])
            self.assertEqual(1, controller.read_state(self.state)['usage']['preflight_renders'])
            self.assertIn('already used', guard.decide(payload, self.root))
            self.assertFalse(prepared.claim(self.state, prepared.OPERATIONS['cinema_proof.py'])[0])
            self.assertEqual(auth['prepared_capture']['event_sha256'],
                             controller.read_state(self.state)['events'][-1]['event_sha256'])

    def comparison_inputs(self):
        board = {'runtime_s': 4, 'scenes': [], 'story_art': {'entries': [{
            'request_id': 'test-hero', 'file': 'scripts/capture_reservation.py',
            'sha256': guard.sha(self.root / 'scripts/capture_reservation.py'),
            'creation_id': 'authored-' + 'a' * 20, 'created_at': '2026-10-18T00:00:00Z'}]},
            'film_direction': {'renderer_inputs': []}}
        boards = [self.state.with_name('opening-' + key + '.json') for key in ('a', 'b')]
        for key, path in zip(('a', 'b'), boards):
            path.write_text(json.dumps({**board, 'treatment': key}))
        command = ('bash scripts/run_with_env.sh python scripts/opening_compare.py'
                   ' --root out/dispatch --state out/dispatch/run_state.json')
        return boards, command

    def test_comparison_prepares_claims_and_consumes_exactly_once_with_both_boards(self):
        boards, command = self.comparison_inputs()
        (self.state.parent / 'openings').mkdir()  # An empty destination is safe.
        with mock.patch('authored_story_art.problems', return_value=[]), \
                mock.patch('native_headroom.estimate', return_value={'required_free_gib': 1}), \
                mock.patch.object(guard.shutil, 'disk_usage', return_value=mock.Mock(free=500 * 1024 ** 3)):
            auth = guard.authorize(self.root, self.state, boards, [command],
                                   housekeeping=False, prepare=True)
            before = copy.deepcopy(controller.read_state(self.state))
            self.assertEqual(before['usage']['preflight_renders'], 1)
            payload = {'tool_name': 'Bash', 'tool_input': {'command': command}, 'cwd': str(self.root)}
            self.assertIsNone(guard.decide(payload, self.root))
            self.assertTrue(controller.reserve(self.state, {'preflight_renders': 1},
                                              prepared.OPERATIONS['opening_compare.py'])[0])
            self.assertEqual(before['usage'], controller.read_state(self.state)['usage'])
            self.assertIn('already used', guard.decide(payload, self.root))
            self.assertFalse(prepared.claim(self.state, prepared.OPERATIONS['opening_compare.py'])[0])
            self.assertEqual(auth['prepared_capture']['event_sha256'],
                             controller.read_state(self.state)['events'][-1]['event_sha256'])

    def test_occupied_or_partial_comparison_is_preserved_and_refused_before_any_charge(self):
        boards, command = self.comparison_inputs()
        output = self.state.parent / 'openings'; output.mkdir()
        partial = output / 'a.mp4'; partial.write_bytes(b'unfinished render evidence')
        for complete in (False, True):
            if complete:
                (output / 'comparison.json').write_text('{"original":"retained review"}')
                (output / 'b.mp4').write_bytes(b'rejected treatment b')
            evidence = {p: p.read_bytes() for p in output.iterdir()}
            before = self.state.read_bytes()
            with mock.patch('authored_story_art.problems', return_value=[]), \
                    mock.patch('native_headroom.estimate', return_value={'required_free_gib': 1}), \
                    mock.patch.object(guard.shutil, 'disk_usage', return_value=mock.Mock(free=500 * 1024 ** 3)), \
                    self.assertRaisesRegex(ValueError, 'opening comparison output already exists'):
                guard.authorize(self.root, self.state, boards, [command],
                                housekeeping=False, prepare=True)
            self.assertEqual(before, self.state.read_bytes())
            self.assertEqual(evidence, {p: p.read_bytes() for p in output.iterdir()})
            self.assertFalse((self.root / guard.AUTHORIZATION).exists())
            self.assertFalse((self.root / guard.USED).exists())

    def test_comparison_preparation_refuses_foreign_paths_inspection_and_unsupported_flags(self):
        _, command = self.comparison_inputs()
        before = self.state.read_bytes()
        for changed in (command.replace('out/dispatch --state', '/tmp/foreign --state'),
                        command.replace('--state out/dispatch/run_state.json', '--state /tmp/foreign.json'),
                        command + ' --inspect-retained', command + ' --board out/dispatch/storyboard.json',
                        command + ' --root out/dispatch', command.replace('--root out/dispatch', ''),
                        command + ' --out /tmp/foreign'):
            with self.subTest(command=changed), self.assertRaises(ValueError):
                prepared.prepare(self.root, self.state, [changed])
            self.assertEqual(before, self.state.read_bytes())

    def test_comparison_authorization_cannot_bind_only_one_treatment(self):
        boards, command = self.comparison_inputs()
        before = self.state.read_bytes()
        with mock.patch('authored_story_art.problems', return_value=[]), \
                mock.patch('native_headroom.estimate', return_value={'required_free_gib': 1}), \
                mock.patch.object(guard.shutil, 'disk_usage', return_value=mock.Mock(free=500 * 1024 ** 3)), \
                self.assertRaisesRegex(ValueError, 'both canonical current treatment boards'):
            guard.authorize(self.root, self.state, boards[:1], [command], housekeeping=False, prepare=True)
        self.assertEqual(before, self.state.read_bytes())

    def full_inputs(self):
        board = {'runtime_s': 1, 'credits_s': 1, 'scenes': [], 'credits': 'SOURCE\n',
                 'story_art': {'entries': [{'request_id': 'test-hero',
                   'file': 'scripts/capture_reservation.py',
                   'sha256': guard.sha(self.root / 'scripts/capture_reservation.py'),
                   'creation_id': 'authored-' + 'a' * 20, 'created_at': '2026-10-17T00:00:00Z'}]}}
        self.board.write_text(json.dumps(board))
        for name, data in {'mix.wav': b'RIFF actual sound fixture', 'captions.json': b'[]',
                           'words.json': b'[]', 'vo_script.txt': b'Source-backed narration.',
                           'claims.json': b'[]', 'credits.txt': b'SOURCE\n',
                           'preflight.json': b'{}', 'preflight.mp4': b'approved preview bytes'}.items():
            (self.state.parent / name).write_bytes(data)
        (self.state.parent / 'mix.json').write_text(json.dumps({'bed': False, 'duration_s': 2,
            'master_sha256': controller.digest(self.state.parent / 'mix.wav')}))
        for name in ('scripts/render_dispatch.sh', 'video-engine/src/Film.tsx',
                     'video-engine/scripts/credit-tail-render.mjs', 'config/feed_layout.json'):
            path = self.root / name; path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text('pinned source fixture')
        return 'bash scripts/run_with_env.sh bash scripts/render_dispatch.sh'

    def full_authorise(self):
        command = self.full_inputs()
        with mock.patch('authored_story_art.problems', return_value=[]), \
                mock.patch('native_headroom.estimate', return_value={'required_free_gib': 1}), \
                mock.patch.object(guard.shutil, 'disk_usage', return_value=mock.Mock(free=500 * 1024 ** 3)):
            auth = guard.authorize(self.root, self.state, [self.board], [command],
                                   resource='full_renders', housekeeping=False, prepare=True)
            payload = {'tool_name': 'Bash', 'tool_input': {'command': command}, 'cwd': str(self.root)}
            self.assertIsNone(guard.decide(payload, self.root))
        return command, auth

    def test_full_entry_claims_the_only_funded_charge_after_the_real_hook(self):
        state = controller.read_state(self.state)
        state['limits']['full_renders'] = state['escalation_ceiling']['full_renders'] = 1
        controller.save(self.state, state)
        command, auth = self.full_authorise()
        self.assertEqual('full_renders', auth['render_reservation']['resource'])
        self.assertEqual(1, controller.read_state(self.state)['usage']['full_renders'])
        self.assertTrue(controller.reserve(self.state, {'full_renders': 1}, prepared.FULL_OPERATION)[0])
        self.assertEqual(1, controller.read_state(self.state)['usage']['full_renders'])
        self.assertFalse(controller.reserve(self.state, {'full_renders': 1}, prepared.FULL_OPERATION)[0])
        self.assertEqual(1, controller.read_state(self.state)['usage']['full_renders'])
        self.assertIn('already used', guard.decide({'tool_name': 'Bash',
            'tool_input': {'command': command}, 'cwd': str(self.root)}, self.root))

    def test_legacy_unprepared_full_charge_retains_its_original_ledger_contract(self):
        self.assertTrue(controller.reserve(self.state, {'full_renders': 1}, prepared.FULL_OPERATION)[0])
        state = controller.read_state(self.state)
        self.assertEqual(1, state['usage']['full_renders'])
        self.assertNotIn('full_render_identity', state['events'][-1])

    def test_full_claim_refuses_changed_sound_captions_sources_preview_and_operators(self):
        self.full_authorise()
        before = self.state.read_bytes()
        for relative in ('out/dispatch/storyboard.json', 'out/dispatch/mix.wav', 'out/dispatch/mix.json',
                         'out/dispatch/captions.json', 'out/dispatch/words.json', 'out/dispatch/vo_script.txt',
                         'out/dispatch/claims.json', 'out/dispatch/credits.txt', 'out/dispatch/preflight.json',
                         'out/dispatch/preflight.mp4', 'scripts/render_dispatch.sh',
                         'video-engine/src/Film.tsx', 'video-engine/scripts/credit-tail-render.mjs',
                         'config/feed_layout.json'):
            path = self.root / relative; original = path.read_bytes()
            with self.subTest(relative=relative):
                path.write_bytes(original + b' changed')
                self.assertFalse(prepared.claim(self.state, prepared.FULL_OPERATION)[0])
                self.assertEqual(before, self.state.read_bytes())
            path.write_bytes(original)

    def test_full_prepare_refuses_invalid_music_or_missing_production_input_before_spend(self):
        command = self.full_inputs()
        before = self.state.read_bytes()
        report = self.state.parent / 'mix.json'; original = report.read_bytes()
        for invalid in (b'{not-json', b'{"bed":true,"bed_track_id":"sincerely","duration_s":2}'):
            with self.subTest(invalid=invalid), self.assertRaisesRegex(ValueError, 'music package'):
                report.write_bytes(invalid)
                prepared.prepare(self.root, self.state, [command], resource='full_renders')
            self.assertEqual(before, self.state.read_bytes())
        report.unlink()
        with self.assertRaisesRegex(ValueError, 'music package'):
            prepared.prepare(self.root, self.state, [command], resource='full_renders')
        report.write_bytes(original)
        (self.state.parent / 'claims.json').unlink()
        with self.assertRaisesRegex(ValueError, 'input is missing'):
            prepared.prepare(self.root, self.state, [command], resource='full_renders')
        self.assertEqual(before, self.state.read_bytes())

    def test_full_prepare_refuses_foreign_inputs_unsupported_flags_and_wrong_resource(self):
        command = self.full_inputs()
        before = self.state.read_bytes()
        for flag in ('state', 'board', 'mix', 'captions', 'preflight', 'preflight-film',
                     'film', 'silent', 'started', 'manifest', 'rescue-report'):
            with self.subTest(flag=flag), self.assertRaisesRegex(ValueError, 'canonical current input'):
                prepared.prepare(self.root, self.state, [command + ' --' + flag + ' /tmp/foreign'])
        for suffix in (' --unknown x', ' --mix', ' --mix out/dispatch/mix.wav --mix out/dispatch/mix.wav'):
            with self.subTest(suffix=suffix), self.assertRaisesRegex(ValueError, 'flag/value'):
                prepared.prepare(self.root, self.state, [command + suffix])
        with self.assertRaisesRegex(ValueError, 'uses full_renders'):
            prepared.prepare(self.root, self.state, [command], resource='preflight_renders')
        with self.assertRaises(ValueError):
            prepared.prepare(self.root, self.state, [command.replace('scripts/render_dispatch.sh', '/tmp/render_dispatch.sh')])
        self.assertEqual(before, self.state.read_bytes())

    def test_full_claim_requires_consumed_hook_exact_resource_and_matching_operator(self):
        _, auth = self.full_authorise()
        before = self.state.read_bytes()
        for changed in ('unconsumed', 'wrong-resource', 'wrong-operator'):
            broken = copy.deepcopy(auth)
            if changed == 'unconsumed': broken['commands'][0]['consumed'] = False
            if changed == 'wrong-resource': broken['prepared_capture']['resource'] = 'preflight_renders'
            if changed == 'wrong-operator': broken['commands'][0]['text'] = self.command('cinema_proof.py')
            (self.root / guard.AUTHORIZATION).write_text(json.dumps(broken))
            self.assertFalse(prepared.claim(self.state, prepared.FULL_OPERATION)[0])
            self.assertEqual(before, self.state.read_bytes())

    def test_full_guard_refuses_a_foreign_authorized_board_before_any_charge(self):
        command = self.full_inputs()
        foreign = self.board.with_name('foreign-board.json'); foreign.write_bytes(self.board.read_bytes())
        before = self.state.read_bytes()
        with mock.patch('authored_story_art.problems', return_value=[]), \
                mock.patch('native_headroom.estimate', return_value={'required_free_gib': 1}), \
                mock.patch.object(guard.shutil, 'disk_usage', return_value=mock.Mock(free=500 * 1024 ** 3)), \
                self.assertRaisesRegex(ValueError, 'canonical current board'):
            guard.authorize(self.root, self.state, [foreign], [command],
                            resource='full_renders', housekeeping=False, prepare=True)
        self.assertEqual(before, self.state.read_bytes())


if __name__ == '__main__':
    unittest.main()
