"""Real Git source views recover space without changing production, history or authored work."""
from pathlib import Path
import subprocess
import tempfile
import unittest

import source_view as view


class SourceViews(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve(); self.repo = self.root/'TexasAIDispatch'
        subprocess.run(['git', 'init', '-q', str(self.repo)], check=True)
        self.git('config', 'user.name', 'Fixture'); self.git('config', 'user.email', 'fixture@example.com')
        self.git('remote', 'add', 'origin', view.REMOTE)
        self.film = self.repo/'runs/2026-10-01/dispatch.mp4'; self.film.parent.mkdir(parents=True)
        self.film.write_bytes(b'original archived movie fixture')
        self.metadata = self.film.parent/'report.json'; self.metadata.write_text('{"terminal_state":"shipped"}')
        self.source = self.repo/'renderer.tsx'; self.source.write_text('original renderer')
        self.git('add', '-A'); self.git('commit', '-qm', 'original archive and source')
        self.head = self.git('rev-parse', 'HEAD'); self.git('update-ref', 'refs/remotes/origin/main', self.head)

    def git(self, *args):
        return view.git(self.repo, *args)

    def test_prepare_is_recoverable_and_later_production_expands_its_own_inherited_view(self):
        original = self.film.read_bytes(); blob = self.git('rev-parse', 'HEAD:runs/2026-10-01/dispatch.mp4')
        plan = view.prepare(self.root); self.assertTrue(plan['eligible']); self.assertFalse(plan['applied'])
        self.assertTrue(self.film.is_file())
        done = view.prepare(self.root, apply=True); self.assertTrue(done['applied'])
        self.assertFalse(self.film.exists()); self.assertEqual(self.git('status', '--porcelain'), '')
        self.assertEqual(self.metadata.read_text(), '{"terminal_state":"shipped"}')
        self.assertEqual(self.git('rev-parse', 'HEAD'), self.head)
        self.assertEqual(subprocess.check_output(['git', '-C', str(self.repo), 'show', blob]), original)
        self.assertFalse(view.prepare(self.root, apply=True)['applied'])
        child = self.root/'edition'; self.git('worktree', 'add', '--detach', str(child), 'HEAD')
        self.assertFalse((child/'runs/2026-10-01/dispatch.mp4').exists())
        self.assertEqual((child/'runs/2026-10-01/report.json').read_text(), '{"terminal_state":"shipped"}')
        (child/'renderer.tsx').write_text('authored current renderer')
        (child/'out/dispatch').mkdir(parents=True)
        evidence = child/'out/dispatch/run_state.json'; evidence.write_bytes(b'original ledger and failed evidence')
        self.assertTrue(view.full_production_view(child))
        self.assertEqual((child/'runs/2026-10-01/dispatch.mp4').read_bytes(), original)
        self.assertEqual((child/'renderer.tsx').read_text(), 'authored current renderer')
        self.assertEqual(evidence.read_bytes(), b'original ledger and failed evidence')
        self.assertFalse(self.film.exists()); self.assertEqual(self.git('config', '--get', 'core.sparseCheckout'), 'true')
        self.assertFalse(view.full_production_view(child))

    def test_existing_linked_worktree_prevents_any_source_or_shared_config_change(self):
        child = self.root/'active'; self.git('worktree', 'add', '--detach', str(child), 'HEAD')
        (child/'renderer.tsx').write_text('active authored renderer')
        (child/'untracked-failure.txt').write_text('retained unique failed evidence')
        before = (self.repo/'.git/config').read_bytes(); current = (child/'renderer.tsx').read_bytes()
        result = view.prepare(self.root, apply=True)
        self.assertFalse(result['eligible']); self.assertIn('linked', result['reason'])
        self.assertEqual((self.repo/'.git/config').read_bytes(), before)
        self.assertEqual((child/'renderer.tsx').read_bytes(), current)
        self.assertTrue(self.film.exists()); self.assertTrue((child/'untracked-failure.txt').is_file())

    def test_dirty_unmerged_active_and_ignored_archive_evidence_are_preserved(self):
        for kind in ('dirty', 'unmerged', 'active', 'owner', 'ignored'):
            with self.subTest(kind=kind):
                if kind == 'dirty':
                    self.source.write_text('uncommitted owner work')
                elif kind == 'unmerged':
                    self.source.write_text('unmerged owner work'); self.git('add', '-A'); self.git('commit', '-qm', 'unmerged')
                elif kind == 'active':
                    (self.repo/'out/dispatch').mkdir(parents=True)
                elif kind == 'owner':
                    (self.root/'.claude').mkdir()
                    (self.root/'.claude/dispatch-production-continuation.json').write_text('{}')
                else:
                    (self.repo/'.git/info/exclude').write_text('runs/unique-secret.txt\n')
                    (self.repo/'runs/unique-secret.txt').write_bytes(b'unique ignored evidence')
                before = (self.repo/'.git/config').read_bytes()
                self.assertFalse(view.prepare(self.root, apply=True)['eligible'])
                self.assertTrue(self.film.exists()); self.assertEqual((self.repo/'.git/config').read_bytes(), before)
                if kind in ('dirty', 'unmerged'):
                    self.git('reset', '--hard', self.head)
                elif kind == 'active':
                    (self.repo/'out/dispatch').rmdir(); (self.repo/'out').rmdir()
                elif kind == 'owner':
                    (self.root/'.claude/dispatch-production-continuation.json').unlink()

    def test_foreign_origins_and_views_are_preserved(self):
        self.git('remote', 'set-url', 'origin', 'https://github.com/foreign/repository')
        self.assertFalse(view.prepare(self.root, apply=True)['eligible']); self.assertTrue(self.film.is_file())
        self.git('remote', 'set-url', 'origin', view.REMOTE)
        self.git('config', 'core.sparseCheckout', 'true')
        before = (self.repo/'.git/config').read_bytes()
        self.assertFalse(view.prepare(self.root, apply=True)['eligible'])
        self.assertEqual((self.repo/'.git/config').read_bytes(), before)


if __name__ == '__main__':
    unittest.main()
