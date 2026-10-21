"""Compaction preserves actual refs, unreferenced objects, dirty files and ledger bytes."""
import subprocess
import sys
import unittest
import json
from pathlib import Path
from unittest import mock

from claude_checkpoint_test import Base, sh
import claude_checkpoint as checkpoint
import routine_continuation as continuation
import owned_git_compaction as compact


class OwnedCompaction(Base):
    def restored_selection(self):
        self.init_ledger()
        self.save('real linked edition fixture')
        tree = self.root / 'selected-edition'
        checkpoint.restore(self.repo, self.ledger()['run_id'], dest=tree)
        state = tree / 'out/dispatch/run_state.json'
        registration = {'hooks': [{'command': 'python3 ' + str(self.repo / 'scripts/routine_continuation.py')
                                   + ' --workspace ' + str(self.root.resolve()) + ' --hook'}]}
        folder = self.root / '.claude'; folder.mkdir()
        (folder / 'dispatch-capture-registration.json').write_text(json.dumps({
            'schema': 'dispatch_capture_hook_registration/1', 'stop_registration': registration}))
        (folder / 'settings.json').write_text(json.dumps({'hooks': {'Stop': [registration]}}))
        continuation.arm(self.root, state)
        return tree, state

    def test_real_compaction_keeps_unreachable_and_dirty_evidence_without_changing_ledger(self):
        self.init_ledger()
        loose = subprocess.run(['git', '-C', str(self.repo), 'hash-object', '-w', '--stdin'],
            input=b'unreferenced actual fixture evidence', capture_output=True, check=True).stdout.strip()
        source = self.repo / 'video-engine/src/base.tsx'
        source.write_text('retain dirty authored source\n')
        unknown = self.repo / 'unknown-evidence.txt'; unknown.write_text('retain untracked evidence\n')
        before = (self.state.read_bytes(), source.read_bytes(), unknown.read_bytes())
        refs = compact.git(self.repo, 'show-ref', '--head')
        result = compact.compact(self.repo, apply=True)
        self.assertTrue(result['ok'])
        self.assertFalse(result['quality_or_release_approval'])
        self.assertIn(loose, compact.objects(self.repo))
        self.assertEqual(refs, compact.git(self.repo, 'show-ref', '--head'))
        self.assertEqual(before, (self.state.read_bytes(), source.read_bytes(), unknown.read_bytes()))

    def test_shared_worktree_is_refused_without_touching_common_objects(self):
        self.init_ledger()
        tree = self.root / 'shared-checkout'
        sh('git', 'worktree', 'add', '--detach', str(tree), cwd=self.repo)
        before = compact.objects(self.repo)
        with self.assertRaisesRegex(ValueError, 'shared'):
            compact.compact(tree, apply=True)
        with self.assertRaisesRegex(ValueError, 'shared'):
            compact.compact(self.repo, apply=True)
        self.assertEqual(before, compact.objects(self.repo))

    def test_actual_checkpoint_restore_worktree_compacts_with_all_evidence_and_primary_unchanged(self):
        tree, state = self.restored_selection()
        loose = subprocess.run(['git', '-C', str(tree), 'hash-object', '-w', '--stdin'],
            input=b'unreferenced restored-edition evidence', capture_output=True, check=True).stdout.strip()
        selected_source = tree / 'video-engine/src/base.tsx'
        selected_source.write_bytes(b'retain selected dirty source')
        primary_source = self.repo / 'README.md'; primary_source.write_bytes(b'retain primary dirty source')
        unknown = self.repo / 'unknown-evidence.txt'; unknown.write_bytes(b'retain primary untracked evidence')
        before = {p:p.read_bytes() for p in (state, self.state, selected_source, primary_source, unknown)}
        refs = compact.git(tree, 'show-ref', '--head')
        layout = compact.git(tree, 'worktree', 'list', '--porcelain', '-z')
        statuses = compact.worktree_state({tree.resolve(), self.repo.resolve()})
        result = compact.compact(tree, apply=True)
        self.assertEqual(result['store_scope'], 'registered-edition-worktree')
        self.assertEqual(result['worktree_count_preserved'], 2)
        self.assertFalse(result['quality_or_release_approval'])
        self.assertIn(loose, compact.objects(tree))
        self.assertEqual(refs, compact.git(tree, 'show-ref', '--head'))
        self.assertEqual(layout, compact.git(tree, 'worktree', 'list', '--porcelain', '-z'))
        self.assertEqual(statuses, compact.worktree_state({tree.resolve(), self.repo.resolve()}))
        self.assertEqual(before, {p:p.read_bytes() for p in before})

    def test_restored_worktree_refuses_a_different_armed_ledger_before_repacking(self):
        tree, _ = self.restored_selection()
        marker = self.root / continuation.MARKER
        value = json.loads(marker.read_text()); value['state'] = str(self.state.resolve())
        marker.write_text(json.dumps(value))
        before = compact.objects(tree)
        with mock.patch.object(compact, 'git', wraps=compact.git) as calls, \
                self.assertRaisesRegex(ValueError, 'registered selected production'):
            compact.compact(tree, apply=True)
        self.assertFalse(any('repack' in call.args for call in calls.call_args_list))
        self.assertEqual(before, compact.objects(tree))

    def test_restored_worktree_refuses_a_third_checkout_and_preserves_its_dirty_evidence(self):
        tree, _ = self.restored_selection()
        peer = self.root / 'unrelated-checkout'
        sh('git', 'worktree', 'add', '--detach', str(peer), cwd=self.repo)
        evidence = peer / 'unrelated.txt'; evidence.write_bytes(b'preserve unrelated work')
        before = compact.objects(tree)
        with self.assertRaisesRegex(ValueError, 'shared Git storage'):
            compact.compact(tree, apply=True)
        self.assertEqual(b'preserve unrelated work', evidence.read_bytes())
        self.assertEqual(before, compact.objects(tree))

    def test_restored_worktree_refuses_an_uninstalled_registration_and_worktree_lock(self):
        tree, _ = self.restored_selection()
        settings = self.root / '.claude/settings.json'
        before = settings.read_bytes()
        settings.write_text('{"hooks":{}}')
        with self.assertRaisesRegex(ValueError, 'primary Stop hook'):
            compact.compact(tree, apply=True)
        settings.write_bytes(before)
        gitdir = compact.git(tree, 'rev-parse', '--absolute-git-dir').decode().strip()
        lock = Path(gitdir) / 'index.lock'; lock.write_text('preserve actual writer')
        with self.assertRaisesRegex(ValueError, 'active'):
            compact.compact(tree, apply=True)
        self.assertEqual('preserve actual writer', lock.read_text())

    def test_restored_worktree_still_requires_the_actual_publication_owner(self):
        tree, _ = self.restored_selection()
        with mock.patch('publication_owner.require_owner', side_effect=ValueError('not the actual owner')), \
                mock.patch.object(compact, 'git', wraps=compact.git) as calls, \
                self.assertRaisesRegex(ValueError, 'actual owner'):
            compact.compact(tree, apply=True)
        self.assertFalse(any('repack' in call.args for call in calls.call_args_list))

    def test_active_git_lock_and_borrowed_objects_are_refused(self):
        self.init_ledger()
        lock = self.repo / '.git/index.lock'; lock.write_text('actual writer fixture')
        before = compact.objects(self.repo)
        with self.assertRaisesRegex(ValueError, 'active'):
            compact.compact(self.repo, apply=True)
        self.assertTrue(lock.is_file())
        lock.unlink()
        alternates = self.repo / '.git/objects/info/alternates'
        alternates.write_text(str(self.repo / '.git/objects') + '\n')
        with self.assertRaisesRegex(ValueError, 'borrowed'):
            compact.compact(self.repo, apply=True)
        self.assertTrue(alternates.is_file())
        self.assertEqual(before, compact.objects(self.repo))

    def test_cli_refuses_existing_receipt_before_repacking(self):
        self.init_ledger()
        receipt = self.state.parent / 'existing-compaction.json'
        receipt.write_bytes(b'preserve the original actual receipt')
        before = set((self.repo / '.git/objects/pack').iterdir())
        result = subprocess.run([sys.executable, compact.__file__, '--repo', str(self.repo),
            '--apply', '--out', str(receipt)], capture_output=True)
        self.assertNotEqual(0, result.returncode)
        self.assertIn(b'preserve the existing receipt', result.stderr)
        self.assertEqual(before, set((self.repo / '.git/objects/pack').iterdir()))
        self.assertEqual(b'preserve the original actual receipt', receipt.read_bytes())


if __name__ == '__main__':
    unittest.main()
