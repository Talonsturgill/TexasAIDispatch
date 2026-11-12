#!/usr/bin/env python3
"""Real Git snapshots for cross-day, released-only feed recovery; no network or production writes."""
import contextlib
import hashlib
import io
import json
from pathlib import Path
import subprocess
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

import lean
import publish_feed


class FeedRecovery(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.repo, self.docket = self.root / "dispatch", self.root / "docket"
        for repo in (self.repo, self.docket):
            repo.mkdir()
            self.git(repo, "init", "-q", "-b", "main")
            self.git(repo, "config", "user.name", "Fixture")
            self.git(repo, "config", "user.email", "fixture@example.invalid")
        self.date = "2026-11-11"
        self.board = {"title": "The empty seat", "beat": "the-road"}
        self.film = b"released film fixture"
        self.release(self.date)
        self.commit_main(self.repo)
        self.target = self.docket / "docs/videos/videos.json"
        self.save(self.target, {"media_base": lean.RAW, "videos": []})
        self.commit_main(self.docket)
        self.entry = publish_feed.entry(self.date, self.board, "A sourced caption.", "Harris", False, False)
        self.args = SimpleNamespace(date=self.date, docket=str(self.docket), county="Harris", caption="A sourced caption.")

    def git(self, repo, *args):
        return subprocess.run(["git", *args], cwd=repo, check=True, capture_output=True).stdout

    def save(self, path, data):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data))

    def commit_main(self, repo):
        self.git(repo, "add", ".")
        self.git(repo, "commit", "-qm", "Fixture snapshot")
        self.git(repo, "update-ref", "refs/remotes/origin/main", "HEAD")

    def release(self, date):
        dest = self.repo / "runs" / date
        self.save(dest / "storyboard.json", self.board)
        self.save(dest / "lean.json", {"schema": "lean_edition/1", "date": date,
            "title": self.board["title"], "film_sha256": hashlib.sha256(self.film).hexdigest()})
        (dest / "dispatch.mp4").write_bytes(self.film)
        (dest / "poster.png").write_bytes(b"poster")

    def feed(self):
        with patch.object(lean, "REPO", self.repo), contextlib.redirect_stdout(io.StringIO()):
            return lean.cmd_feed(self.args)

    def test_new_day_and_unmerged_local_release_do_not_hide_old_pending(self):
        self.release("2026-11-12")
        self.save(self.repo / "out/dispatch/lean_run.json", {"date": "2026-11-12"})
        result = lean.pending_feeds(self.repo, self.docket)
        self.assertEqual([r["date"] for r in result["pending"]], [self.date])
        self.assertEqual(result["pending"][0]["status"], "missing")
        self.assertEqual(len(result["dispatch_main"]), 40)

    def test_pending_uses_main_not_unmerged_worktree_feed(self):
        self.save(self.target, {"videos": [self.entry]})
        self.assertEqual(len(lean.pending_feeds(self.repo, self.docket)["pending"]), 1)
        self.commit_main(self.docket)
        self.assertEqual(lean.pending_feeds(self.repo, self.docket)["pending"], [])

    def test_explicit_date_recovers_without_marker_and_repeats_without_write(self):
        self.assertEqual(self.feed(), 0)
        before = self.target.read_bytes()
        self.args.caption = "Different copy must not replace the existing caption."
        self.assertEqual(self.feed(), 0)
        self.assertEqual(self.target.read_bytes(), before)
        self.assertEqual(json.loads(before)["videos"], [self.entry])
        self.assertFalse((self.repo / "out").exists())

    def test_recovery_reads_main_not_mutated_same_named_local_film_or_board(self):
        (self.repo / "runs" / self.date / "dispatch.mp4").write_bytes(b"unreleased replacement")
        self.save(self.repo / "runs" / self.date / "storyboard.json", {"title": "Wrong"})
        self.feed()
        self.assertEqual(json.loads(self.target.read_bytes())["videos"][0]["title"], "The empty seat")

    def test_unmerged_date_and_review_only_artifacts_cannot_be_published(self):
        self.release("2026-11-12")
        self.args.date = "2026-11-12"
        with self.assertRaisesRegex(lean.Problem, "not a complete released"):
            self.feed()
        self.args.date = "../review/2026-11-11"
        with self.assertRaisesRegex(lean.Problem, "YYYY-MM-DD"):
            self.feed()

    def test_conflicting_or_duplicate_entry_refused_without_changes(self):
        for rows in ([dict(self.entry, title="Changed title")], [self.entry, self.entry],
                     [dict(self.entry, id="different-id")]):
            self.save(self.target, {"videos": rows})
            before = self.target.read_bytes()
            with self.assertRaisesRegex(lean.Problem, "conflicting card"):
                self.feed()
            self.assertEqual(before, self.target.read_bytes())

    def test_absolute_urls_count_and_foreign_media_base_does_not(self):
        row = dict(self.entry, video=lean.RAW + self.entry["video"], poster=lean.RAW + self.entry["poster"])
        self.assertEqual(lean.feed_identity_status({"videos": [row]}, self.entry), "listed")
        self.assertEqual(lean.feed_identity_status({"media_base": "https://other.invalid", "videos": [self.entry]}, self.entry), "conflict")

    def test_empty_foreign_base_feed_cannot_publish_wrong_host_media(self):
        self.save(self.target, {"media_base": "https://other.invalid", "videos": []})
        self.commit_main(self.docket)
        before = self.target.read_bytes()
        with self.assertRaisesRegex(lean.Problem, "media_base"):
            self.feed()
        self.assertEqual(before, self.target.read_bytes())

    def test_older_recovery_does_not_displace_newer_films(self):
        newer = dict(self.entry, id="newer", date="2026-11-12", video="/runs/2026-11-12/dispatch.mp4")
        older = dict(self.entry, id="older", date="2026-10-21", video="/runs/2026-10-21/dispatch.mp4")
        self.save(self.target, {"videos": [newer, older]})
        self.commit_main(self.docket)
        self.feed()
        self.assertEqual(json.loads(self.target.read_bytes())["videos"], [newer, self.entry, older])

    def test_dirty_other_worker_worktree_is_never_edited(self):
        (self.docket / "someone-elses-work.txt").write_text("in progress")
        before = self.target.read_bytes()
        with self.assertRaisesRegex(lean.Problem, "not clean"):
            self.feed()
        self.assertEqual(before, self.target.read_bytes())

    def test_released_media_hash_mismatch_is_refused(self):
        (self.repo / "runs" / self.date / "dispatch.mp4").write_bytes(b"changed on main without matching release")
        self.commit_main(self.repo)
        before = self.target.read_bytes()
        with self.assertRaisesRegex(lean.Problem, "film bytes"):
            self.feed()
        self.assertEqual(before, self.target.read_bytes())

    def test_prior_entries_preserved_when_recovering_missing_card(self):
        older = dict(self.entry, id="older", date="2026-10-21", video="/runs/2026-10-21/dispatch.mp4", custom={"keep": True})
        self.save(self.target, {"media_base": lean.RAW, "videos": [older], "other": "preserve"})
        self.commit_main(self.docket)
        self.feed()
        feed = json.loads(self.target.read_bytes())
        self.assertEqual(feed["videos"], [self.entry, older])
        self.assertEqual(feed["other"], "preserve")

    def test_read_failure_is_not_an_empty_queue(self):
        self.git(self.docket, "update-ref", "-d", "refs/remotes/origin/main")
        with self.assertRaises(lean.Problem):
            lean.pending_feeds(self.repo, self.docket)

    def test_fresh_container_rediscovers_pending_without_local_receipt(self):
        clone = self.root / "fresh"
        self.git(self.root, "clone", "-q", str(self.repo), str(clone))
        before = self.target.read_bytes()
        result = lean.pending_feeds(clone, self.docket)
        self.assertEqual(result["pending"][0]["id"], self.entry["id"])
        self.assertEqual(before, self.target.read_bytes())


if __name__ == "__main__":
    unittest.main()
