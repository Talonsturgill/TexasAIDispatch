"""Catalog snapshots survive unrelated fetches without touching production ledgers."""
import unittest
from unittest import mock
import json
import sys

import checkpoint_discovery as catalog
import claude_checkpoint as checkpoint
import run_controller as controller
from claude_checkpoint_test import Base, RUN, sh


class DiscoverySnapshots(Base):
    def two_checkpoints(self):
        self.init_ledger('dry-run')
        first = self.save('first fixture')
        second_repo = self.clone(self.root / 'second')
        second_state = second_repo / 'out/dispatch/run_state.json'
        controller.initialise(second_state, '2026-10-20', 'dry-run')
        second = checkpoint.save(second_repo, second_state, 'second fixture', environ={})
        return first, second, second_state

    def test_unrelated_fetch_between_fetch_and_read_cannot_change_the_catalog_snapshot(self):
        first, second, second_state = self.two_checkpoints()
        before = (self.state.read_bytes(), second_state.read_bytes())
        fresh = self.clone(self.root / 'fresh')
        original_git = checkpoint.git
        foreign_fetches = []

        def interleaved_git(repo, *args, **kwargs):
            result = original_git(repo, *args, **kwargs)
            if args[0] == 'fetch':
                # Exactly the startup race: another fetch replaces the shared FETCH_HEAD
                # after the checkpoint fetch returned but before its consumer reads it.
                original_git(repo, 'fetch', '--quiet', 'origin', 'refs/heads/main')
                foreign_fetches.append(True)
            return result

        with mock.patch.object(checkpoint, 'git', side_effect=interleaved_git):
            rows = catalog.discover(fresh)
        self.assertEqual(2, len(foreign_fetches))
        self.assertEqual({RUN: first['commit'], '2026-10-20': second['commit']},
                         {row['run_id']: row['commit'] for row in rows})
        self.assertEqual(before, (self.state.read_bytes(), second_state.read_bytes()))
        self.assertEqual('', sh('git', 'for-each-ref', 'refs/dispatch-discovery', cwd=fresh))

    def test_missing_manifest_fails_and_releases_only_its_temporary_ref(self):
        self.two_checkpoints()
        sh('git', 'push', '-q', 'origin', 'HEAD:refs/heads/claude/checkpoint/2026-10-21', cwd=self.repo)
        fresh = self.clone(self.root / 'fresh')
        before = self.state.read_bytes()
        with self.assertRaises(checkpoint.CheckpointError):
            catalog.discover(fresh)
        self.assertEqual(before, self.state.read_bytes())
        self.assertEqual('', sh('git', 'for-each-ref', 'refs/dispatch-discovery', cwd=fresh))

    def test_actual_cli_selects_the_oldest_unfinished_without_changing_either_ledger(self):
        first, _, second_state = self.two_checkpoints()
        before = (self.state.read_bytes(), second_state.read_bytes())
        fresh = self.clone(self.root / 'fresh')
        selected = json.loads(sh(sys.executable, catalog.__file__, '--repo', str(fresh),
                                 '--oldest-unfinished'))
        self.assertEqual(RUN, selected['run_id'])
        self.assertEqual(first['commit'], selected['commit'])
        self.assertEqual(before, (self.state.read_bytes(), second_state.read_bytes()))
        self.assertEqual('', sh('git', 'for-each-ref', 'refs/dispatch-discovery', cwd=fresh))


if __name__ == '__main__':
    unittest.main()
