#!/usr/bin/env python3
"""Exercise destructive cleanup using isolated miniature Git repositories."""

import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time
import unittest
from unittest import mock

from dispatch_housekeeping import Archive, Housekeeping, cleanup_lock, has_symlink_component, main


def command(*args, cwd=None):
    return subprocess.run(args, cwd=cwd, check=True, capture_output=True, text=True).stdout.strip()


class HousekeepingTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="dispatch-cleanup-test-")
        self.root = Path(self.temp.name).resolve()
        self.trees = self.root / ".worktrees"
        self.trees.mkdir()
        self.dispatch = self.root / "repositories/TexasAIDispatch"
        self.docket = self.root / "repositories/TexasAIDocket"
        for repo in (self.dispatch, self.docket):
            repo.mkdir(parents=True)
            command("git", "init", "-b", "main", cwd=repo)
            command("git", "config", "user.name", "Cleanup test", cwd=repo)
            command("git", "config", "user.email", "cleanup@example.invalid", cwd=repo)
            (repo / ".gitignore").write_text("out/\nnode_modules/\nassets/sfx/*.wav\n__pycache__/\n", encoding="utf-8")
            (repo / "README").write_text("fixture\n", encoding="utf-8")
        self.states = {}
        feed = []
        for day in range(1, 5):
            run_id = f"2026-10-0{day}"
            movie = f"movie-{day}".encode()
            digest = hashlib.sha256(movie).hexdigest()
            state = {
                "run_id": run_id, "terminal_state": "shipped",
                "deliverable": {"film_sha256": digest, "review_only": False},
                "shipment": {"verified_at": f"2026-10-0{day}T12:00:00Z", "film_sha256": digest},
            }
            self.states[run_id] = state
            run = self.dispatch / "runs" / run_id
            run.mkdir(parents=True)
            (run / "dispatch.mp4").write_bytes(movie)
            (run / "run_state.json").write_text(json.dumps(state), encoding="utf-8")
            feed.append({"video": f"/runs/{run_id}/dispatch.mp4"})
        (self.docket / "docs/videos").mkdir(parents=True)
        (self.docket / "docs/videos/videos.json").write_text(json.dumps({"videos": feed}), encoding="utf-8")
        for repo in (self.dispatch, self.docket):
            command("git", "add", ".", cwd=repo)
            command("git", "commit", "-m", "archive", cwd=repo)
            command("git", "update-ref", "refs/remotes/origin/main", "HEAD", cwd=repo)

    def tearDown(self):
        self.temp.cleanup()

    def tree(self, name, run_id=None, repo=None):
        repo = repo or self.dispatch
        target = self.trees / name
        command("git", "worktree", "add", "-b", name, str(target), "main", cwd=repo)
        if run_id:
            package = target / "out/dispatch"
            package.mkdir(parents=True)
            (package / "run_state.json").write_text(json.dumps(self.states[run_id]), encoding="utf-8")
            (package / "intermediate.mp4").write_bytes(b"scratch")
        self.age(target)
        return target

    def age(self, tree):
        old = time.time() - 48 * 3600
        gitdir = Path(command("git", "rev-parse", "--absolute-git-dir", cwd=tree))
        for file in [tree, gitdir / "HEAD", *tree.glob("out/**/run_state.json")]:
            os.utime(file, (old, old))

    def cleaner(self, **kwargs):
        return Housekeeping(self.root, activity=[], **kwargs)

    def populate(self):
        return [self.tree(f"edition-{day}", f"2026-10-0{day}") for day in range(1, 5)]

    def test_retention_keeps_two_newest_and_plan_changes_nothing(self):
        trees = self.populate()
        plan = self.cleaner().plan()
        self.assertEqual({Path(a["path"]).name for a in plan}, {"edition-1", "edition-2"})
        self.assertTrue(all(tree.exists() for tree in trees))
        self.assertTrue((self.dispatch / "runs/2026-10-01/dispatch.mp4").exists())

    def test_apply_removes_worktrees_but_keeps_git_history_and_archive(self):
        trees = self.populate()
        cleaner = self.cleaner()
        with mock.patch("dispatch_housekeeping.live_paths", return_value=[]):
            removed = cleaner.apply(cleaner.plan())
        self.assertEqual(len(removed), 2)
        self.assertFalse(trees[0].exists())
        self.assertTrue(trees[2].exists())
        self.assertEqual(command("git", "show", "edition-1:README", cwd=self.dispatch), "fixture")
        self.assertEqual((self.dispatch / "runs/2026-10-01/dispatch.mp4").read_bytes(), b"movie-1")

    def test_sibling_cloud_checkouts_preserve_the_same_retention_and_archive(self):
        self.dispatch = self.dispatch.rename(self.root / "TexasAIDispatch")
        self.docket = self.docket.rename(self.root / "TexasAIDocket")
        trees = self.populate()
        cleaner = Housekeeping(self.root, activity=[], repositories=(self.dispatch, self.docket))
        self.assertEqual({Path(a['path']).name for a in cleaner.plan()}, {'edition-1', 'edition-2'})
        with mock.patch('dispatch_housekeeping.live_paths', return_value=[]):
            self.assertEqual(len(cleaner.apply(cleaner.plan())), 2)
        self.assertTrue(trees[2].exists())
        self.assertTrue((self.dispatch / 'runs/2026-10-01/dispatch.mp4').exists())

    def test_cloud_mode_refuses_a_missing_sibling_path(self):
        with mock.patch('sys.argv', ['housekeeping', '--workspace', str(self.root),
                                    '--dispatch-repo', str(self.dispatch)]):
            with self.assertRaises(SystemExit) as error:
                main()
        self.assertEqual(error.exception.code, 2)

    def test_unfinished_state_survives_even_on_a_merged_branch(self):
        target = self.tree("unfinished", "2026-10-01")
        file = target / "out/dispatch/run_state.json"
        state = json.loads(file.read_text())
        state["terminal_state"] = None
        file.write_text(json.dumps(state))
        self.age(target)
        self.assertFalse(self.cleaner().plan())

    def test_publishable_is_not_verified_shipment(self):
        target = self.tree("publishable", "2026-10-01")
        file = target / "out/dispatch/run_state.json"
        state = json.loads(file.read_text())
        state["terminal_state"] = "publishable"
        file.write_text(json.dumps(state))
        self.assertFalse(self.cleaner().plan())

    def test_dirty_and_untracked_worktrees_survive(self):
        dirty = self.tree("dirty")
        untracked = self.tree("untracked")
        (dirty / "README").write_text("changed")
        (untracked / "new-source").write_text("unique")
        self.assertFalse(self.cleaner().plan())

    def test_unmerged_commits_survive(self):
        target = self.tree("unmerged")
        (target / "README").write_text("new commit")
        command("git", "add", ".", cwd=target)
        command("git", "commit", "-m", "unmerged", cwd=target)
        self.age(target)
        self.assertFalse(self.cleaner().plan())

    def test_active_and_locked_worktrees_survive(self):
        active = self.tree("active")
        locked = self.tree("locked")
        command("git", "worktree", "lock", str(locked), cwd=self.dispatch)
        cleaner = Housekeeping(self.root, activity=[active / "README"])
        self.assertFalse(cleaner.plan())

    def test_unknown_ignored_outputs_survive(self):
        target = self.tree("unknown")
        (target / "out").mkdir()
        (target / "out/unique-art.png").write_bytes(b"original")
        self.assertFalse(self.cleaner().plan())

    def test_missing_feed_entry_blocks_archive_validation(self):
        feed = self.docket / "docs/videos/videos.json"
        feed.write_text('{"videos": []}')
        command("git", "add", ".", cwd=self.docket)
        command("git", "commit", "-m", "no feed", cwd=self.docket)
        command("git", "update-ref", "refs/remotes/origin/main", "HEAD", cwd=self.docket)
        self.assertIsNone(Archive(self.root).shipped("2026-10-01"))

    def test_changed_archived_movie_is_rejected(self):
        movie = self.dispatch / "runs/2026-10-01/dispatch.mp4"
        movie.write_bytes(b"incorrect bytes")
        command("git", "add", ".", cwd=self.dispatch)
        command("git", "commit", "-m", "changed movie", cwd=self.dispatch)
        command("git", "update-ref", "refs/remotes/origin/main", "HEAD", cwd=self.dispatch)
        self.assertIsNone(Archive(self.root).shipped("2026-10-01"))

    def test_recent_checkouts_survive(self):
        target = self.tree("recent")
        os.utime(target, None)
        self.assertFalse(self.cleaner().plan())

    def test_symlinked_package_survives(self):
        target = self.tree("symlink")
        (target / "out").mkdir()
        (target / "out/external").symlink_to(self.dispatch / "runs/2026-10-01", target_is_directory=True)
        self.assertTrue(has_symlink_component(target / "out/external/run_state.json", target))
        self.assertFalse(self.cleaner().plan())

    def test_revalidation_preserves_a_new_edit(self):
        target = self.tree("changed-during-cleanup")
        cleaner = self.cleaner()
        plan = cleaner.plan()
        (target / "README").write_text("new edit")
        with mock.patch("dispatch_housekeeping.live_paths", return_value=[]):
            self.assertEqual(cleaner.apply(plan), [])
        self.assertTrue(target.exists())

    def test_canonical_checkout_and_unrelated_repo_survive(self):
        outsider = self.root / "unrelated"
        outsider.mkdir()
        self.assertFalse(self.cleaner().plan())
        self.assertTrue(self.dispatch.exists())
        self.assertTrue(outsider.exists())

    def test_cleanup_lock_refuses_overlap(self):
        with cleanup_lock(self.root):
            with self.assertRaises(BlockingIOError):
                with cleanup_lock(self.root):
                    self.fail("overlapping cleanup was accepted")

    def test_protected_path_survives(self):
        target = self.tree("protected")
        self.assertFalse(self.cleaner(protect=(target,)).plan())

    def test_canonical_scratch_removal_keeps_two_recent_packages(self):
        for day in range(1, 5):
            package = self.dispatch / "out" / f"dispatch-2026-10-0{day}"
            package.mkdir(parents=True)
            (package / "run_state.json").write_text(json.dumps(self.states[f"2026-10-0{day}"]))
            old = time.time() - 48 * 3600
            os.utime(package / "run_state.json", (old, old))
        cleaner = self.cleaner()
        self.assertEqual({a["kind"] for a in cleaner.plan()}, {"scratch"})
        with mock.patch("dispatch_housekeeping.live_paths", return_value=[]):
            self.assertEqual(len(cleaner.apply(cleaner.plan())), 2)
        self.assertFalse((self.dispatch / "out/dispatch-2026-10-01").exists())
        self.assertTrue((self.dispatch / "out/dispatch-2026-10-04").exists())

    def test_nested_unfinished_state_prevents_parent_deletion(self):
        target = self.tree("nested", "2026-10-01")
        nested = target / "out/dispatch/repairs/pending"
        nested.mkdir(parents=True)
        (nested / "run_state.json").write_text('{"terminal_state": null}')
        self.assertFalse(self.cleaner().plan())

    def test_private_configuration_is_not_disposable(self):
        target = self.tree("private", "2026-10-01")
        (target / "out/dispatch/.env").write_text("fixture-only")
        self.assertFalse(self.cleaner().plan())

    def test_old_feed_worktree_retires_but_recent_feed_is_retained(self):
        self.populate()
        old = self.tree("feed-old", repo=self.docket)
        recent = self.tree("feed-recent", repo=self.docket)
        command("git", "branch", "-m", "claude/dispatch-2026-10-01", cwd=old)
        command("git", "branch", "-m", "claude/dispatch-2026-10-04", cwd=recent)
        for target in (old, recent):
            cache = target / "out/article-media/tmp"
            cache.mkdir(parents=True)
            (cache / "proof.png").write_bytes(b"generated")
            self.age(target)
        paths = {a["path"] for a in self.cleaner().plan()}
        self.assertIn(str(old), paths)
        self.assertNotIn(str(recent), paths)

    def test_required_disk_headroom_returns_nonzero_without_deleting(self):
        args = ["housekeeping", "--workspace", str(self.root), "--require-headroom", "--summary"]
        with mock.patch("sys.argv", args), mock.patch("dispatch_housekeeping.live_paths", return_value=[]), \
                mock.patch("dispatch_housekeeping.shutil.disk_usage", return_value=mock.Mock(free=1024)), \
                mock.patch("builtins.print"):
            self.assertEqual(main(), 3)
        self.assertTrue(self.dispatch.exists())

    def test_malformed_nested_metadata_preserves_the_package(self):
        target = self.tree("bad-metadata", "2026-10-01")
        file = target / "out/dispatch/run_state.json"
        state = json.loads(file.read_text())
        state["shipment"] = None
        file.write_text(json.dumps(state))
        self.assertFalse(self.cleaner().plan())

    def test_private_env_in_generated_output_preserves_the_worktree(self):
        target = self.tree("feed-private", repo=self.docket)
        command("git", "branch", "-m", "claude/dispatch-2026-10-01", cwd=target)
        cache = target / "out/article-media/tmp"
        cache.mkdir(parents=True)
        (cache / ".env.local").write_text("fixture-only")
        self.age(target)
        self.assertFalse(self.cleaner().plan())


if __name__ == "__main__":
    unittest.main(verbosity=2)
