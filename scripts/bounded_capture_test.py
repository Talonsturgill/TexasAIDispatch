"""No lower disk admission without an exact, measured, native bounded route."""
import copy
import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import bounded_capture as bounded
import capture_guard as guard
import native_headroom
import run_controller as controller
from capture_guard_test import Fixture, WRAP


class Bounded(Fixture):
    def setUp(self):
        super().setUp()
        for name in bounded.FILES:
            target = self.root / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text('tested ' + name)
        (self.root / 'config').mkdir(exist_ok=True)
        (self.root / bounded.POLICY).write_text(json.dumps(bounded.EXPECTED))
        (self.root / 'video-engine/package-lock.json').write_text(json.dumps({'packages': {
            'node_modules/@remotion/renderer': {'version': '4.0.399'}}}))
        data = json.loads(self.board.read_text())
        data.update(cinematic_template='directed-film-v2', runtime_s=1778/30,
                    scenes=[{'start_s': 0, 'duration_s': 1778/30}])
        self.board.write_text(json.dumps(data))
        self.command = WRAP + 'python3 scripts/cinema_proof.py --board out/dispatch/storyboard.json'
        self.proof()
        self.reserved.update(note='finished cinematic hero and stage ablation batch', preflight_identity_version=3)
        with mock.patch.object(controller, 'REPO', self.root):
            self.reserved['preflight_identity'] = controller.preflight_identity(self.state, self.reserved['note'])
        self.ledger(self.reserved)

    def authorize(self, commands=None, **kw):
        with mock.patch.object(controller, 'REPO', self.root):
            return super().authorize(commands, **kw)

    def proof(self):
        (self.root / bounded.PROOF).write_text(json.dumps({
            'schema': 'dispatch-bounded-png-proof/1', 'verified': True,
            'policy_sha256': bounded.sha(self.root / bounded.POLICY), 'files': bounded.closure(self.root)}))

    def plan(self, command=None):
        return bounded.plan(self.root, [command or self.command],
                            [(self.board, json.loads(self.board.read_text()))])

    def test_legacy_floor_unchanged_and_bounded_reserve_kept(self):
        self.assertEqual(19, native_headroom.estimate(json.loads(self.board.read_text()))['required_free_gib'])
        self.assertEqual(6, self.plan()['required_free_gib'])
        self.assertEqual(5, self.plan()['reserve_gib'])
        data = json.loads(self.board.read_text()); data['cinematic_template'] = 'daily-actions-v1'
        self.board.write_text(json.dumps(data))
        self.assertIsNone(self.plan(), 'unverified daily route must retain legacy headroom')

    def test_advisory_cli_requires_exact_command_and_current_proof(self):
        output = self.root / 'out/dispatch/headroom.json'
        args = ['--board', str(self.board), '--out', str(output)]
        before = self.state.read_bytes()
        def run(extra=()):
            with mock.patch.object(native_headroom, 'REPO', self.root), \
                    mock.patch.object(native_headroom.shutil, 'disk_usage', return_value=mock.Mock(free=18 * 1024**3)), \
                    contextlib.redirect_stdout(io.StringIO()):
                code = native_headroom.main([*args, *extra])
            return code, json.loads(output.read_text())
        code, legacy = run()
        self.assertEqual((1, 19), (code, legacy['required_free_gib']))
        code, bounded_result = run(['--capture-command', self.command])
        self.assertEqual((0, 6), (code, bounded_result['required_free_gib']))
        self.assertTrue(bounded_result['advisory_only'])
        code, raw = run(['--capture-command', WRAP + 'npx remotion render Dispatch x.mp4'])
        self.assertEqual((1, 19), (code, raw['required_free_gib']))
        (self.root / bounded.PROOF).write_text('{}')
        code, stale = run(['--capture-command', self.command])
        self.assertEqual((1, 19), (code, stale['required_free_gib']))
        self.assertEqual(before, self.state.read_bytes())
        self.assertFalse((self.root / guard.AUTHORIZATION).exists())

    def test_every_bound_file_invalidates_proof(self):
        self.assertIn('scripts/run_with_env.sh', bounded.FILES)
        for name in bounded.FILES:
            path = self.root / name
            before = path.read_bytes()
            path.write_bytes(before + b'changed')
            self.assertIsNone(self.plan(), name)
            path.write_bytes(before)
        for name in (bounded.POLICY, bounded.PROOF):
            path = self.root / name
            before = path.read_bytes()
            path.unlink()
            self.assertIsNone(self.plan(), name)
            path.write_bytes(before)

    def test_unknown_preview_raw_mixed_and_redirected_commands_use_legacy(self):
        for command in (
                WRAP + 'python3 scripts/preflight_animatic.py',
                WRAP + 'npx remotion render Dispatch output.mp4',
                WRAP + 'node video-engine/scripts/render-batch.mjs spec.json',
                self.command + ' --preview true', self.command + ' --board unrelated.json',
                self.command + '; npx remotion render Dispatch x.mp4',
                self.command + ' --mix elsewhere.wav',
                'DISPATCH_MODE=legacy ' + self.command,
                self.command.replace('scripts/cinema_proof.py', '../other/scripts/cinema_proof.py')):
            self.assertIsNone(self.plan(command), command)

    def test_wrong_board_template_and_paths_use_legacy(self):
        data = json.loads(self.board.read_text())
        data['cinematic_template'] = 'old-template'
        self.assertIsNone(bounded.plan(self.root, [self.command], [(self.board, data)]))
        data['cinematic_template'] = 'directed-film-v2'
        self.assertIsNone(bounded.plan(self.root, [self.command], [(self.other, data)]))
        self.assertIsNone(bounded.plan(self.root, [self.command, self.command], [(self.board, data)]))

    def test_policy_and_pinned_version_cannot_expand_budget(self):
        path = self.root / bounded.POLICY
        data = json.loads(path.read_text()); data['max_frames'] = 600
        path.write_text(json.dumps(data)); self.proof()
        self.assertIsNone(self.plan())
        path.write_text(json.dumps(bounded.EXPECTED))
        lock = self.root / 'video-engine/package-lock.json'
        lock.write_text(json.dumps({'packages': {'node_modules/@remotion/renderer': {'version': '4.0.400'}}}))
        self.proof(); self.assertIsNone(self.plan())

    def test_authorization_revalidates_profile_hashes_floor_and_cwd(self):
        auth = self.authorize()
        self.assertEqual(6, auth['headroom']['required_free_gib'])
        self.assertEqual([], guard.capture_problems(self.command, auth, self.root, self.root, free_gib=6))
        self.assertTrue(guard.capture_problems(self.command, auth, self.root, self.root, free_gib=5.99))
        stripped = copy.deepcopy(auth); del stripped['headroom']['storage_profile']
        self.assertTrue(guard.capture_problems(self.command, stripped, self.root, self.root, free_gib=100))
        changed = copy.deepcopy(auth); changed['headroom']['required_free_gib'] = 1
        self.assertTrue(guard.capture_problems(self.command, changed, self.root, self.root, free_gib=6))
        self.assertTrue(guard.capture_problems(self.command, auth, self.root.parent, self.root, free_gib=6))
        (self.root / 'video-engine/scripts/bounded-png-render.mjs').write_text('unbounded replacement')
        self.assertTrue(guard.capture_problems(self.command, auth, self.root, self.root, free_gib=100))

    def test_old_or_unrelated_charge_cannot_confer_bounded_headroom(self):
        for mutation in ({'preflight_identity_version': 2}, {'note': 'quarter-scale animatic'},
                         {'preflight_identity': 'unrelated'}):
            event = {**self.reserved, **mutation}; self.ledger(event)
            auth = self.authorize()
            self.assertNotIn('storage_profile', auth['headroom'])
            # Retain no outstanding authorization between independent fixture cases.
            (self.root / guard.AUTHORIZATION).unlink()
            (self.root / guard.USED).unlink()

    def test_full_and_comparison_routes_require_their_canonical_boards(self):
        board = json.loads(self.board.read_text())
        full = WRAP + 'bash scripts/render_dispatch.sh'
        self.assertEqual(6, bounded.plan(self.root, [full], [(self.board, board)])['required_free_gib'])
        rows = []
        for key in ('a', 'b'):
            path = self.board.with_name('opening-' + key + '.json')
            path.write_text(json.dumps(board)); rows.append((path, board))
        command = WRAP + 'python3 scripts/opening_compare.py --root out/dispatch --state out/dispatch/run_state.json'
        self.assertEqual(6, bounded.plan(self.root, [command], rows)['required_free_gib'])
        self.assertIsNone(bounded.plan(self.root, [command], rows[:1]))

    def test_missing_proof_reverts_before_charge(self):
        (self.root / bounded.PROOF).unlink()
        before = self.state.read_bytes()
        with mock.patch('authored_story_art.problems', return_value=[]), mock.patch.object(
                guard.shutil, 'disk_usage', return_value=mock.Mock(free=18 * 1024**3)):
            with self.assertRaisesRegex(ValueError, 'native headroom failed'):
                guard.authorize(self.root, self.state, [self.board], [self.command], housekeeping=False)
        self.assertEqual(before, self.state.read_bytes())

    def test_v3_binds_helper_while_v1_v2_remain_reproducible(self):
        note = 'finished cinematic hero and stage ablation batch'
        with mock.patch.object(controller, 'REPO', self.root):
            before = {v: controller.preflight_identity(self.state, note, version=v) for v in (1,2,3)}
            (self.root / 'video-engine/scripts/bounded-png-render.mjs').write_text('changed helper')
            after = {v: controller.preflight_identity(self.state, note, version=v) for v in (1,2,3)}
        self.assertEqual(before[1], after[1]); self.assertEqual(before[2], after[2])
        self.assertNotEqual(before[3], after[3])


if __name__ == '__main__':
    unittest.main()
