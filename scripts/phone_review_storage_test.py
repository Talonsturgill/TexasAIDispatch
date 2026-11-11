"""Phone-only admission, exact encoded pixels, storage bounds and failure cleanup."""
import argparse
import copy
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest import mock

import bounded_capture
import capture_guard as guard
import native_headroom
import phone_review_storage as storage
from capture_guard_test import Fixture, WRAP


class Admission(Fixture):
    def setUp(self):
        super().setUp()
        for name in storage.FILES:
            path = self.root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text('unit fixture source ' + name)
        (self.root / 'config').mkdir(exist_ok=True)
        (self.root / storage.POLICY).write_text(json.dumps(storage.EXPECTED))
        data = json.loads(self.board.read_text())
        data.update(runtime_s=1778/30, scenes=[{'start_s': 0, 'duration_s': 1778/30}])
        self.board.write_text(json.dumps(data))
        output = self.root / 'out/dispatch/openings'; output.mkdir()
        for option in ('a', 'b'):
            (output / (option + '.json')).write_text(json.dumps(data))
            (output / (option + '.mp4')).write_bytes(b'fixture input, never decoded')
        (self.board.parent / 'preflight.mp4').write_bytes(b'fixture input, never decoded')
        (self.board.parent / 'preflight.json').write_text('{}')
        (output / 'comparison.json').write_text('{}')
        self.proof()

    def proof(self):
        # Synthetic unit-test evidence only, never written to the actual checkout.
        files = storage.closure(self.root); policy = storage.sha(self.root / storage.POLICY)
        evidence = {'schema': 'dispatch-phone-review-storage-exercise/1', 'files': files,
                    'policy_sha256': policy, 'exact_decoded_pixels': True, 'full_sample_coverage': True, 'native_exact_decoded_pixels': True,
                    'high_entropy_sheet': {'dimensions': [1210, 1494], 'bytes': 5 * 1024**2 + 1},
                    'bounds': storage.bounds()}
        (self.root / storage.PROOF).write_text(json.dumps({
            'schema': 'dispatch-phone-review-storage-proof/1', 'verified': True,
            'files': files, 'policy_sha256': policy, 'evidence': evidence}))

    def canonical_command(self, option='a', prefix='motion-'):
        inputs = storage.paths(option)
        output = ('out/dispatch/phone-motion-current' if option == 'current'
                  else 'out/dispatch/openings/' + prefix + option)
        return (WRAP + 'python scripts/claude_motion_review.py --phone-option ' + option
                + ' --board ' + next(iter(inputs['--board']))
                + ' --film ' + next(iter(inputs['--film']))
                + ' --state out/dispatch/run_state.json --out ' + output)

    def boards(self, option='a'):
        path = self.root / next(iter(storage.paths(option)['--board']))
        return [(path, json.loads(path.read_text()))]

    def plan(self, command=None, option='a'):
        return bounded_capture.plan(self.root, [command or self.canonical_command(option)], self.boards(option))

    def test_all_canonical_phone_routes_have_separate_seven_gib_profile(self):
        self.assertEqual(19, native_headroom.estimate(self.boards()[0][1])['required_free_gib'])
        for option in ('a', 'b', 'current'):
            for prefix in ('motion-', 'phone-motion-'):
                profile = self.plan(self.canonical_command(option, prefix), option)
                self.assertEqual((storage.MODE, 7, 5, 301, 1502, 9004), tuple(profile[k] for k in (
                    'mode', 'required_free_gib', 'reserve_gib', 'max_sheets', 'max_samples', 'max_frames')))
        self.assertEqual(storage.bounds()['max_output_bytes'], 301 * 6 * 1024**2 + 1024**2 + 4096)

    def test_native_verify_mixed_shell_abbreviated_duplicate_and_redirected_commands_fail_closed(self):
        command = self.canonical_command()
        for changed in (command.replace('--phone-option a ', ''), command + ' --verify',
                        command + ' --phone-option b', command + ' --out elsewhere',
                        command + '; echo next', command + ' | cat', command + '\necho next',
                        command + ' > output', 'env ' + command,
                        WRAP + "bash -lc '" + command + "'", command + ' # ignored',
                        command.replace('--phone-option', '--phone-opt'), command + ' --unknown true',
                        command.replace('motion-a', '$OUT'), command.replace('motion-a', '../motion-a'),
                        command.replace('openings/a.mp4', 'film.mp4'), command.replace('motion-a', 'other'),
                        command.replace('scripts/claude_motion_review.py', '../foreign/claude_motion_review.py')):
            self.assertIsNone(self.plan(changed), changed)
        for flag in ('--state out/dispatch/run_state.json', '--phone-option a'):
            self.assertIsNone(self.plan(command.replace(flag, '')))

    def test_exact_equals_flags_are_supported_without_syntax_expansion(self):
        command = self.canonical_command().replace('--phone-option a', '--phone-option=a').replace(
            '--out out/dispatch/openings/motion-a', '--out=out/dispatch/openings/motion-a')
        self.assertEqual(self.plan(command)['required_free_gib'], 7)

    def test_wrong_boards_multiple_commands_and_nonfinite_duration_use_legacy(self):
        command = self.canonical_command()
        self.assertIsNone(bounded_capture.plan(self.root, [command], self.boards('b')))
        self.assertIsNone(bounded_capture.plan(self.root, [command, command], self.boards()))
        self.assertIsNone(bounded_capture.plan(self.root, [command], self.boards() + self.boards()))
        path, data = self.boards()[0]
        for duration in (float('nan'), float('inf'), -1, 301):
            self.assertIsNone(bounded_capture.plan(self.root, [command], [(path, {**data, 'runtime_s': duration})]))

    def test_symlink_output_parent_board_film_and_operator_are_never_admitted(self):
        for name in ('scripts/claude_motion_review.py', 'out/dispatch/openings/a.json',
                     'out/dispatch/openings/a.mp4'):
            path = self.root / name; saved = path.with_name(path.name + '.kept')
            path.rename(saved); path.symlink_to(saved)
            self.assertIsNone(self.plan(), name)
            path.unlink(); saved.rename(path)
        target = self.root / 'out/dispatch/openings/motion-a'
        target.symlink_to(self.root / 'unowned')
        self.assertIsNone(self.plan())
        target.unlink()
        parent = target.parent; saved = parent.with_name('kept-openings')
        parent.rename(saved); parent.symlink_to(saved, target_is_directory=True)
        self.assertIsNone(self.plan())

    def test_every_executable_source_and_proof_is_bound(self):
        for name in (*storage.FILES, storage.POLICY, storage.PROOF):
            path = self.root / name; original = path.read_bytes()
            path.write_bytes(original + b' changed')
            self.assertIsNone(self.plan(), name)
            path.write_bytes(original)
        proof = self.root / storage.PROOF
        proof.unlink()
        self.assertIsNone(self.plan())

    def test_advisory_estimate_neither_spends_nor_authorizes(self):
        board = self.boards()[0][0]; before = self.state.read_bytes()
        result = native_headroom.capture_estimate(self.root, [board], self.canonical_command())
        self.assertEqual(result['required_free_gib'], 7)
        self.assertTrue(result['advisory_only'])
        self.assertEqual(before, self.state.read_bytes())
        self.assertFalse((self.root / guard.AUTHORIZATION).exists())
        (self.root / storage.PROOF).unlink()
        self.assertEqual(native_headroom.capture_estimate(self.root, [board], self.canonical_command())['required_free_gib'], 19)

    def authorization(self):
        profile = self.plan(); command = self.canonical_command()
        return {'schema': guard.SCHEMA, 'allowed': True,
                'render_reservation': {'event_sha256': 'fixture charged event'},
                'headroom': {'passed': True, 'required_free_gib': 7, 'storage_profile': profile},
                'housekeeping': {'receipt_sha256': 'fixture housekeeping receipt'},
                'art_receipts_recorded': True, 'expires_at': (guard.now() + guard.LIFETIME).isoformat(),
                'boards': [{'path': str(p.relative_to(self.root)), 'sha256': storage.sha(p)} for p, _ in self.boards()],
                'bound': {'capture_storage': profile['bindings']},
                'commands': [{'text': command, 'id': guard.hashlib.sha256(guard.normalize(command).encode()).hexdigest(),
                              'consumed': False}]}

    def test_hook_rechecks_source_floor_and_single_use(self):
        auth = self.authorization(); command = self.canonical_command()
        self.assertEqual([], guard.capture_problems(command, auth, self.root, self.root, free_gib=16))
        self.assertTrue(guard.capture_problems(command, auth, self.root, self.root, free_gib=6.99))
        auth['commands'][0]['consumed'] = True
        self.assertTrue(guard.capture_problems(command, auth, self.root, self.root, free_gib=16))
        auth['commands'][0]['consumed'] = False
        (self.root / 'scripts/claude_motion_review.py').write_text('changed decoder')
        self.assertTrue(guard.capture_problems(command, auth, self.root, self.root, free_gib=100))

    def test_runtime_rechecks_consumed_auth_sources_and_actual_arguments(self):
        auth = self.authorization(); auth['commands'][0]['consumed'] = True
        target = self.root / guard.AUTHORIZATION
        target.write_text(json.dumps(auth))
        values = storage.operation(self.canonical_command(), self.root)
        args = argparse.Namespace(**{k[2:].replace('-', '_'): (v if k == '--phone-option' else self.root / v)
                                     for k, v in values.items()}, verify=False)
        with mock.patch.object(Path, 'cwd', return_value=self.root):
            storage.runtime_check(self.root, args)
            args.out = self.root / 'out/dispatch/openings/other'
            with self.assertRaisesRegex(ValueError, 'authorization'):
                storage.runtime_check(self.root, args)
            args.out = self.root / values['--out']
            (self.root / storage.PROOF).unlink()
            with self.assertRaisesRegex(ValueError, 'authorization'):
                storage.runtime_check(self.root, args)

    def test_bare_hook_planning_never_imports_decoder_pillow_or_numpy(self):
        script = '''
import builtins, json, sys
sys.path.insert(0, sys.argv[1])
original = builtins.__import__
def checked(name, *args, **kwargs):
    if name.split('.')[0] in ('PIL', 'numpy', 'claude_motion_review', 'preflight_animatic', 'run_controller'):
        raise AssertionError('heavy hook import: ' + name)
    return original(name, *args, **kwargs)
builtins.__import__ = checked
from pathlib import Path
import bounded_capture
root = Path(sys.argv[2]); board = root / 'out/dispatch/openings/a.json'
assert bounded_capture.plan(root, [sys.argv[3]], [(board, json.loads(board.read_text()))])['required_free_gib'] == 7
'''
        done = subprocess.run([sys.executable, '-S', '-c', script, str(Path(storage.__file__).parent),
                               str(self.root), self.canonical_command()], capture_output=True, text=True)
        self.assertEqual(done.returncode, 0, done.stderr)

    def test_prepare_at_sixteen_gib_keeps_phone_inspection_and_single_charge(self):
        import capture_reservation as reservation
        import run_controller as controller
        command = self.canonical_command(); board = self.boards()[0][0]
        with mock.patch.object(controller, 'REPO', self.root), \
                mock.patch('authored_story_art.problems', return_value=[]), \
                mock.patch.object(guard.shutil, 'disk_usage', return_value=mock.Mock(free=16 * 1024**3)):
            self.state.unlink(); controller.initialise(self.state, 'phone-storage-regression', 'production')
            before = self.state.read_bytes()
            with mock.patch('claude_motion_review.phone_inputs', side_effect=ValueError('actual inspection refused')):
                with self.assertRaisesRegex(ValueError, 'actual inspection refused'):
                    guard.authorize(self.root, self.state, [board], [command], housekeeping=False, prepare=True)
            self.assertEqual(before, self.state.read_bytes())
            with mock.patch('claude_motion_review.phone_inputs', return_value={}) as inspection:
                auth = guard.authorize(self.root, self.state, [board], [command], housekeeping=False, prepare=True)
                inspection.assert_called_once_with(self.state, 'a', board, board.with_suffix('.mp4'))
            self.assertEqual(auth['headroom']['required_free_gib'], 7)
            self.assertEqual(controller.read_state(self.state)['usage']['preflight_renders'], 1)
            auth['commands'][0]['consumed'] = True
            (self.root / guard.AUTHORIZATION).write_text(json.dumps(auth))
            film = board.with_suffix('.mp4'); original = film.read_bytes(); film.write_bytes(b'changed encoded input')
            self.assertFalse(reservation.claim(self.state, reservation.PHONE_OPERATIONS['a'])[0])
            film.write_bytes(original)
            self.assertTrue(reservation.claim(self.state, reservation.PHONE_OPERATIONS['a'])[0])
            self.assertFalse(reservation.claim(self.state, reservation.PHONE_OPERATIONS['a'])[0])
            self.assertEqual(controller.read_state(self.state)['usage']['preflight_renders'], 1)

    def test_missing_proof_at_sixteen_gib_refuses_before_inspection_or_charge(self):
        import run_controller as controller
        (self.root / storage.PROOF).unlink(); before = self.state.read_bytes()
        with mock.patch.object(controller, 'REPO', self.root), \
                mock.patch('authored_story_art.problems', return_value=[]), \
                mock.patch('claude_motion_review.phone_inputs', side_effect=AssertionError('inspection started')), \
                mock.patch.object(guard.shutil, 'disk_usage', return_value=mock.Mock(free=16 * 1024**3)):
            with self.assertRaisesRegex(ValueError, '19 required'):
                guard.authorize(self.root, self.state, [self.boards()[0][0]], [self.canonical_command()],
                                housekeeping=False, prepare=True)
        self.assertEqual(before, self.state.read_bytes())


class DecoderBounds(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import claude_motion_review as motion
        cls.motion = motion
        cls.temp = tempfile.TemporaryDirectory(); cls.root = Path(cls.temp.name)
        cls.space = mock.patch.object(storage.shutil, 'disk_usage', return_value=mock.Mock(free=20 * 1024**3))
        cls.space.start()
        cls.board = cls.root / 'board.json'; cls.film = cls.root / 'phone.mp4'
        cls.board.write_text('{"runtime_s":1.4}')
        subprocess.run([motion.FFMPEG, '-v', 'error', '-f', 'lavfi', '-i',
                        'testsrc2=size=270x480:rate=30:duration=1.4', '-c:v', 'libx264',
                        '-preset', 'ultrafast', str(cls.film)], check=True)

    @classmethod
    def tearDownClass(cls):
        cls.space.stop()
        cls.temp.cleanup()

    def destination(self):
        return self.root / self._testMethodName

    def test_maximum_duration_tolerance_covers_9004_frames_1502_samples_301_sheets(self):
        storage.check_meta(dict(width=270, height=480, fps=30, frames=9004, duration_s=300))
        self.assertEqual(len(self.motion.sample_indices(9004)), 1502)
        for changes in ({'frames': 9005}, {'frames': 0}, {'duration_s': 300.01},
                        {'duration_s': float('nan')}, {'width': 1080}, {'fps': 29}):
            with self.assertRaises(ValueError):
                storage.check_meta(dict(width=270, height=480, fps=30, frames=9004, duration_s=300, **{}) | changes)

    def test_current_free_reserve_plus_remaining_output_is_checked_exactly(self):
        required = 5 * 1024**3 + 301 * 6 * 1024**2 + 1024**2 + 4096
        for free, passes in ((required, True), (required - 1, False)):
            with mock.patch.object(storage.shutil, 'disk_usage', return_value=mock.Mock(free=free)):
                if passes:
                    storage.check_space(self.root, 301)
                else:
                    with self.assertRaises(ValueError):
                        storage.check_space(self.root, 301)
        with mock.patch.object(storage.shutil, 'disk_usage', return_value=mock.Mock(free=5 * 1024**3 + 4096)):
            storage.check_space(self.root, 0, index_pending=False)
            with self.assertRaises(ValueError):
                storage.check_space(self.root, 0)

    def test_real_encoded_fixture_and_high_entropy_maximum_sheet(self):
        from verify_phone_review_storage import exercise
        report = json.loads(exercise(self.destination()).read_text())
        self.assertTrue(report['exact_decoded_pixels'])
        self.assertEqual(report['fixture']['sample_indices'], [0, 6, 12, 18, 24, 30, 36, 41])
        self.assertGreater(report['high_entropy_sheet']['bytes'], 5 * 1024**2)
        self.assertLessEqual(report['high_entropy_sheet']['bytes'], 6 * 1024**2)

    def test_low_disk_refuses_before_launch_and_retains_failure_receipt(self):
        with mock.patch.object(storage.shutil, 'disk_usage', return_value=mock.Mock(free=5 * 1024**3)), \
                mock.patch.object(self.motion.subprocess, 'Popen', side_effect=AssertionError('decoder launched')):
            # Metadata probing also uses Popen, so retain the real inspected metadata first.
            with mock.patch.object(self.motion, 'inspect', return_value=dict(width=270, height=480, fps=30,
                                                                           frames=42, duration_s=1.4)):
                with self.assertRaises(ValueError):
                    self.motion.build(self.board, self.film, self.destination(), True)
        self.assertTrue((self.destination() / 'failure.json').is_file())
        self.assertTrue(self.film.is_file())

    def test_encode_failure_kills_and_reaps_decoder_and_retains_failure_receipt(self):
        original = subprocess.Popen; processes = []
        def start(*args, **kwargs):
            proc = original(*args, **kwargs); processes.append(proc); return proc
        with mock.patch.object(self.motion, 'encode_phone_sheet', side_effect=ValueError('byte cap refusal')), \
                mock.patch.object(self.motion.subprocess, 'Popen', side_effect=start):
            with self.assertRaisesRegex(ValueError, 'byte cap'):
                self.motion.build(self.board, self.film, self.destination(), True)
        self.assertTrue(all(p.poll() is not None for p in processes))
        self.assertTrue((self.destination() / 'failure.json').is_file())

    def test_falling_free_space_retains_partial_sheets_and_failure_receipt(self):
        calls = []
        def space(directory, remaining, index_pending=True):
            calls.append(remaining)
            if len(calls) == 3:
                raise ValueError('remaining output no longer fits')
        with mock.patch.object(storage, 'check_space', side_effect=space):
            with self.assertRaisesRegex(ValueError, 'remaining output'):
                self.motion.build(self.board, self.film, self.destination(), True)
        self.assertEqual(calls, [2, 2, 1])
        self.assertTrue((self.destination() / 'failure.json').is_file())
        self.assertTrue((self.destination() / 'sequence-000.png').is_file())
        self.assertFalse((self.destination() / 'index.json').exists())
        self.assertLessEqual((self.destination() / 'failure.json').stat().st_size, 4096)

    def test_preexisting_package_is_preserved(self):
        self.destination().mkdir(); evidence = self.destination() / 'retained'; evidence.write_text('keep')
        with self.assertRaises(FileExistsError):
            self.motion.build(self.board, self.film, self.destination(), True)
        self.assertEqual(evidence.read_text(), 'keep')

    def test_wrong_sheet_dimensions_or_oversized_encoding_never_reach_disk(self):
        from PIL import Image
        with self.assertRaisesRegex(ValueError, 'dimensions'):
            self.motion.encode_phone_sheet(Image.new('RGB', (1210, 1495)))
        def oversized(image, stream, **kwargs):
            stream.write(b'x' * (6 * 1024**2 + 1))
        with mock.patch.object(Image.Image, 'save', oversized):
            with self.assertRaisesRegex(ValueError, 'byte cap'):
                self.motion.encode_phone_sheet(Image.new('RGB', (1210, 1494)))

    def test_process_launch_and_font_failures_leave_no_partial_output(self):
        meta = dict(width=270, height=480, fps=30, frames=42, duration_s=1.4)
        with mock.patch.object(self.motion, 'inspect', return_value=meta), \
                mock.patch.object(self.motion.subprocess, 'Popen', side_effect=OSError('launch failed')):
            with self.assertRaisesRegex(OSError, 'launch failed'):
                self.motion.build(self.board, self.film, self.destination(), True)
        self.assertTrue((self.destination() / 'failure.json').is_file())
        font_target = self.destination().with_name(self.destination().name + '-font')
        with mock.patch.object(self.motion, 'inspect', return_value=meta), \
                mock.patch.object(self.motion.ImageFont, 'truetype', side_effect=OSError('font failed')), \
                mock.patch.object(self.motion.subprocess, 'Popen', side_effect=AssertionError('decoder launched')):
            with self.assertRaisesRegex(OSError, 'font failed'):
                self.motion.build(self.board, self.film, font_target, True)
        self.assertFalse(font_target.exists())

    def test_decoded_underflow_and_extra_samples_are_retained_failures(self):
        for frames, duration, message in ((48, 1.6, 'ended before'), (36, 1.2, 'unindexed')):
            board = self.root / ('declared-%d.json' % frames)
            board.write_text(json.dumps({'runtime_s': duration}))
            output = self.destination().with_name('declared-%d-output' % frames)
            meta = dict(width=270, height=480, fps=30, frames=frames, duration_s=duration)
            with mock.patch.object(self.motion, 'inspect', return_value=meta):
                with self.assertRaisesRegex(ValueError, message):
                    self.motion.build(board, self.film, output, True)
            self.assertTrue((output / 'failure.json').is_file())
            self.assertFalse((output / 'index.json').exists())

    def test_noisy_stalled_decoder_is_drained_killed_and_reaped(self):
        original = subprocess.Popen; processes = []
        def start(*args, **kwargs):
            proc = original([sys.executable, '-c',
                'import sys,time; sys.stderr.write("error"*30000); sys.stderr.flush(); time.sleep(30)'], **kwargs)
            processes.append(proc); return proc
        original_timer = self.motion.threading.Timer
        meta = dict(width=270, height=480, fps=30, frames=42, duration_s=1.4)
        with mock.patch.object(self.motion, 'inspect', return_value=meta), \
                mock.patch.object(self.motion.subprocess, 'Popen', side_effect=start), \
                mock.patch.object(self.motion.threading, 'Timer', side_effect=lambda duration, callback: original_timer(.2, callback)):
            with self.assertRaisesRegex(ValueError, 'ended before'):
                self.motion.build(self.board, self.film, self.destination(), True)
        self.assertTrue(all(p.poll() is not None for p in processes))
        self.assertLessEqual((self.destination() / 'failure.json').stat().st_size, 4096)

    def test_failed_completed_index_is_not_usable_review_evidence(self):
        binding = {'option': 'a', 'fixture': True}
        index = self.motion.build(self.board, self.film, self.destination(), True, binding)
        self.assertEqual(self.motion.problems(index, self.board, self.film, True, binding), [])
        (index.parent/'failure.json').write_text('{"complete":false}')
        self.assertTrue(self.motion.problems(index, self.board, self.film, True, binding))


if __name__ == '__main__':
    unittest.main()
