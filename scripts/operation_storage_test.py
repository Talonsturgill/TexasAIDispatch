"""Canonical admission and actual-cost accounting, including negative fixtures."""
import json
import shutil
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest import mock

import bounded_capture as bounded
import capture_guard as guard
import claude_checkpoint as checkpoint
import operation_storage as storage
import phone_review_storage as phone
from capture_guard_test import Fixture, WRAP


class OperationCosts(Fixture):
    def setUp(self):
        super().setUp()
        for name in set(bounded.FILES + phone.FILES):
            target = self.root / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text('synthetic unit source ' + name)
        for name in ('src', 'public'):
            (self.root / 'video-engine' / name).mkdir(parents=True, exist_ok=True)
        (self.root / 'video-engine/package-lock.json').write_text(json.dumps({'packages': {
            'node_modules/@remotion/renderer': {'version': '4.0.399'}}}))
        data = json.loads(self.board.read_text())
        data.update(cinematic_template='directed-film-v2', runtime_s=1778/30,
                    scenes=[{'start_s': 0, 'duration_s': 1778/30}] * 20,
                    film_direction={'shots': [{}] * 20})
        self.board.write_text(json.dumps(data))
        self.boards = [(self.board, data)]
        (self.root / bounded.POLICY).write_text(json.dumps(bounded.EXPECTED))
        (self.root / bounded.PROOF).write_text(json.dumps({
            'schema': 'dispatch-bounded-png-proof/1', 'verified': True,
            'policy_sha256': bounded.sha(self.root / bounded.POLICY), 'files': bounded.closure(self.root)}))
        (self.root / phone.POLICY).write_text(json.dumps(phone.EXPECTED))
        # Refresh after the shared policy changed. Synthetic evidence stays in tmp.
        value = json.loads((self.root / bounded.PROOF).read_text())
        value['files'] = bounded.closure(self.root)
        (self.root / bounded.PROOF).write_text(json.dumps(value))
        files = phone.closure(self.root); policy = phone.sha(self.root / phone.POLICY)
        evidence = {'schema': 'dispatch-phone-review-storage-exercise/1', 'files': files,
                    'policy_sha256': policy, 'exact_decoded_pixels': True,
                    'native_exact_decoded_pixels': True, 'full_sample_coverage': True,
                    'high_entropy_sheet': {'dimensions': [1210, 1494], 'bytes': 5*storage.MIB+1},
                    'bounds': phone.bounds()}
        (self.root / phone.PROOF).write_text(json.dumps({
            'schema': 'dispatch-phone-review-storage-proof/1', 'verified': True,
            'files': files, 'policy_sha256': policy, 'evidence': evidence}))
        self.commands = [
            WRAP + 'python scripts/preflight_animatic.py --board out/dispatch/storyboard.json',
            WRAP + 'python scripts/claude_motion_review.py --board out/dispatch/storyboard.json '
                   '--film out/dispatch/film.mp4 --out out/dispatch/motion-review --state out/dispatch/run_state.json',
            WRAP + 'python scripts/preship_compute.py']

    def plan(self, command):
        return bounded.plan(self.root, [command], self.boards)

    def test_canonical_remaining_operators_keep_five_gib_reserve(self):
        for command in self.commands:
            result = self.plan(command)
            self.assertEqual(storage.MODE, result['mode'])
            self.assertEqual(5, result['reserve_gib'])
            self.assertLess(result['required_free_gib'], 19)
        preview, native, preship = map(self.plan, self.commands)
        self.assertEqual([270, 480], preview['dimensions'])
        self.assertEqual([390, 693], native['dimensions'])
        self.assertEqual(0, native['working_bytes'])
        self.assertEqual(2*20*9437184+10*270*480*4, preship['working_bytes'])
        self.assertEqual(60*6*storage.MIB + storage.MIB + 4096, native['new_retained_bytes'])

    def test_unknown_shell_duplicate_noncanonical_and_symlink_fail_legacy(self):
        for command in self.commands:
            for change in (command+' --verify', command+' --unknown true', command+'; true',
                           command+' > /tmp/log', command+' # comment', 'env '+command,
                           command.replace('scripts/', '../foreign/', 1), command+'\ntrue'):
                self.assertIsNone(self.plan(change), change)
        preflight = self.commands[0]
        for change in (preflight+' --board out/dispatch/storyboard.json',
                       preflight.replace('--board', '--boa'),
                       preflight+' --film elsewhere.mp4', preflight+' --inspect-only'):
            self.assertIsNone(self.plan(change), change)
        path = self.root/'out/dispatch/motion-review'; path.symlink_to('/tmp/foreign')
        self.assertIsNone(self.plan(self.commands[1]))

    def test_omitted_default_paths_cannot_follow_symlinks(self):
        for name in ('preflight.mp4', 'preflight.json', 'preflight-contact-sheet.png',
                     'claims.json', 'attention-review.png'):
            path = self.board.parent/name
            original = path.read_bytes() if path.is_file() else None
            if path.exists(): path.unlink()
            path.symlink_to(self.root/'elsewhere')
            self.assertIsNone(self.plan(self.commands[0]), name)
            path.unlink()
            if original is not None: path.write_bytes(original)

    def test_all_source_mutations_invalidate_new_profiles(self):
        for name in storage.FILES:
            path = self.root/name; before = path.read_bytes()
            path.write_bytes(before+b' changed')
            for command in self.commands:
                self.assertIsNone(self.plan(command), name)
            path.write_bytes(before)
        value = json.loads((self.root/phone.PROOF).read_text())
        del value['evidence']['native_exact_decoded_pixels']
        (self.root/phone.PROOF).write_text(json.dumps(value))
        self.assertIsNone(self.plan(self.commands[1]))

    def test_shared_objects_new_checkpoint_copies_and_retained_output_are_additive(self):
        # The producer's 3.9 GiB shared object store rounds to four GiB.
        with mock.patch.object(checkpoint, 'required', return_value=True), \
             mock.patch.object(storage.subprocess, 'check_output', return_value='/fixture/common'), \
             mock.patch.object(checkpoint, 'build_bundle', return_value=(None, {'storage_accounting': {'unique_blob_bytes': 88*storage.MIB}}, '', None, None)), \
             mock.patch.object(storage, 'tree_bytes', side_effect=lambda p: int(3.9*storage.GIB)
                               if Path(p).name == 'objects' else 48*storage.MIB):
            result = self.plan(self.commands[0])
            self.assertEqual(4*storage.GIB, result['git_object_allowance_bytes'])
            self.assertEqual(4*storage.GIB+2*(256*storage.MIB+checkpoint.MAX_TOTAL), result['checkpoint_work_bytes'])
            self.assertEqual(13, result['required_free_gib'])
            self.assertEqual(192*storage.MIB, result['bundle_copy_bytes'])
            self.assertGreater(result['new_retained_bytes'], checkpoint.MAX_FILE)
            before = result['required_free_gib']
            with mock.patch.object(storage, 'tree_bytes', side_effect=lambda p: int(5.1*storage.GIB)
                                   if Path(p).name == 'objects' else 48*storage.MIB):
                self.assertGreater(self.plan(self.commands[0])['required_free_gib'], before)
        # No existing retained directory is added twice; it already lowers free.
        retained = self.board.parent/'kept-failure.mp4'; retained.write_bytes(b'kept')
        before = self.plan(self.commands[0])
        retained.write_bytes(b'kept' * 10000)
        self.assertEqual(before, self.plan(self.commands[0]))

    def test_missing_shared_store_fails_closed_and_noncheckpoint_remains_available(self):
        with mock.patch.object(checkpoint, 'required', return_value=True), \
             mock.patch.object(storage.subprocess, 'check_output', return_value='/missing/objects'):
            self.assertIsNone(self.plan(self.commands[0]))
        self.assertIsNotNone(self.plan(self.commands[0]))

    def test_real_checkpoint_prepare_consume_and_claim_do_not_invalidate_cost_bucket(self):
        import run_controller as controller
        import capture_reservation as reservation
        def git(*args):
            return subprocess.check_output(['git', '-C', str(self.root), *args], stderr=subprocess.PIPE)
        git('init', '-q')
        git('config', 'user.name', 'Talon Sturgill')
        git('config', 'user.email', 'Talon.sturgill@gmail.com')
        origin = self.root/'.git/fixture-origin.git'
        subprocess.run(['git', 'init', '--bare', '-q', str(origin)], check=True)
        git('remote', 'add', 'origin', str(origin))
        (self.root/'.gitignore').write_text('out/\n')
        git('add', '.'); git('commit', '-qm', 'Engineering storage authorization fixture')
        self.state.unlink()
        controller.initialise(self.state, '2026-08-01-storage-authorization', 'rehearsal')
        (self.board.parent/'claude-host.json').write_text('{}')
        checkpoint.save(self.root, self.state, 'engineering baseline', environ={})
        command = self.commands[0]
        with mock.patch.object(controller, 'REPO', self.root), \
             mock.patch.object(checkpoint, 'PRELAUNCH_TOOLS', self.root/'absent-tools'), \
             mock.patch('authored_story_art.problems', return_value=[]), \
             mock.patch.object(storage.Path, 'cwd', return_value=self.root), \
             mock.patch.object(storage.sys, 'argv', ['scripts/preflight_animatic.py', '--board',
                                                     'out/dispatch/storyboard.json']), \
             mock.patch.object(storage.shutil, 'disk_usage', return_value=mock.Mock(free=16*storage.GIB)):
            before = self.state.read_bytes()
            needed = self.plan(command)['required_free_gib']
            with mock.patch.object(storage.shutil, 'disk_usage', return_value=mock.Mock(free=(needed-1)*storage.GIB)):
                with self.assertRaisesRegex(ValueError, 'headroom failed'):
                    guard.authorize(self.root, self.state, [self.board], [command], housekeeping=False, prepare=True)
            self.assertEqual(before, self.state.read_bytes())
            auth = guard.authorize(self.root, self.state, [self.board], [command], housekeeping=False, prepare=True)
            profile = auth['headroom']['storage_profile']
            self.assertEqual([], guard.capture_problems(command, auth, self.root, self.root, free_gib=16))
            self.assertTrue(guard.consume(self.root, command))
            storage.runtime_check(self.root)
            self.assertTrue(reservation.claim(self.state, 'quarter-scale animatic')[0])
            self.assertEqual(controller.read_state(self.state)['usage']['preflight_renders'], 1)
            self.assertEqual(profile, self.plan(command))
            self.assertFalse(reservation.claim(self.state, 'quarter-scale animatic')[0])

    def test_both_opening_boards_are_costed_and_validated(self):
        first = storage.workload(self.root, 'opening_compare.py', self.boards)
        pair = storage.workload(self.root, 'opening_compare.py', self.boards * 2)
        self.assertEqual(2 * first['new_retained_bytes'], pair['new_retained_bytes'])
        invalid = [(self.board, {**self.boards[0][1], 'runtime_s': 301})]
        with self.assertRaises(ValueError):
            storage.workload(self.root, 'opening_compare.py', self.boards + invalid)

    def test_current_free_space_and_source_are_rechecked_after_consumption(self):
        command = self.commands[0]; profile = self.plan(command)
        auth = {'headroom': {'storage_profile': profile},
                'commands': [{'text': command, 'consumed': True}],
                'boards': [{'path': 'out/dispatch/storyboard.json'}],
                'bound': {'capture_storage': profile['bindings']}}
        (self.root/guard.AUTHORIZATION).write_text(json.dumps(auth))
        with mock.patch.object(storage.Path, 'cwd', return_value=self.root), \
             mock.patch.object(storage.sys, 'argv', ['scripts/preflight_animatic.py', '--board',
                                                     'out/dispatch/storyboard.json']), \
             mock.patch.object(storage.shutil, 'disk_usage', return_value=mock.Mock(free=16*storage.GIB)):
            storage.runtime_check(self.root)
            with mock.patch.object(storage.shutil, 'disk_usage', return_value=mock.Mock(free=5*storage.GIB)):
                with self.assertRaises(ValueError): storage.runtime_check(self.root)
            with mock.patch.object(storage.sys, 'argv', ['scripts/preflight_animatic.py', '--board', 'elsewhere']):
                with self.assertRaises(ValueError): storage.runtime_check(self.root)
            (self.root/'scripts/preship_compute.py').write_text('changed')
            with self.assertRaises(ValueError): storage.runtime_check(self.root)


if __name__ == '__main__':
    unittest.main()
