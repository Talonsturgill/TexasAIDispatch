"""Compaction preserves actual refs, unreferenced objects, dirty files and ledger bytes."""
import subprocess
import sys
import unittest

from claude_checkpoint_test import Base, sh
import owned_git_compaction as compact


class OwnedCompaction(Base):
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
