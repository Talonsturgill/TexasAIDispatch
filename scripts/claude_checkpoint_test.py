"""A checkpoint lets a fresh container resume the same ledger, and never carries private material."""
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import claude_checkpoint as ck

SCRIPTS = Path(__file__).resolve().parent


def sh(*args, cwd=None, env=None):
    return subprocess.run(args, cwd=cwd, check=True, capture_output=True, text=True,
                          env={**os.environ, **(env or {})}).stdout


class CheckpointTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        root = Path(self.tmp.name)
        self.origin = root / "origin.git"
        sh("git", "init", "--bare", "-q", str(self.origin))
        self.repo = self.clone(root / "work")
        (self.repo / "README.md").write_text("seed\n")
        sh("git", "add", "-A", cwd=self.repo)
        sh("git", "commit", "-qm", "seed", cwd=self.repo)
        sh("git", "push", "-q", "origin", "HEAD:refs/heads/main", cwd=self.repo)
        self.state = self.repo / "out/dispatch/run_state.json"
        sh(sys.executable, str(SCRIPTS / "run_controller.py"), "--state", str(self.state), "init",
           "--run-id", "2026-10-09-claude-pilot", "--mode", "production", cwd=self.repo)
        (self.repo / ".gitignore").write_text("out/\n")
        scratch = self.repo / "out/dispatch"
        (scratch / "claims.json").write_text('{"claims": ["c1"]}')
        (scratch / "vo").mkdir()
        (scratch / "vo/take-1.wav").write_bytes(b"RIFF paid audio")
        (scratch / "tmp").mkdir()
        (scratch / "tmp/scratch.json").write_text("{}")
        (scratch / "gmail-readback.json").write_text('{"draft_id": "r-private"}')
        (scratch / "delivery-routing.json").write_text('{"recipient": "x@example.com"}')
        src = self.repo / "video-engine/src/authored"
        src.mkdir(parents=True)
        (src / "Hero.tsx").write_text("export const Hero = () => null;\n")

    def clone(self, path):
        sh("git", "clone", "-q", str(self.origin), str(path))
        sh("git", "config", "user.name", "Test", cwd=path); sh("git", "config", "user.email", "t@example.com", cwd=path)
        return Path(path)

    def test_save_mirrors_resumable_state_and_leaves_the_checkout_alone(self):
        before = sh("git", "status", "--porcelain", cwd=self.repo)
        branch = sh("git", "branch", "--show-current", cwd=self.repo).strip()
        result = ck.save(self.repo, self.state, "test", environ={})
        self.assertTrue(result["changed"])
        self.assertEqual(before, sh("git", "status", "--porcelain", cwd=self.repo))
        self.assertEqual(branch, sh("git", "branch", "--show-current", cwd=self.repo).strip())
        names = sh("git", "ls-tree", "-r", "--name-only", result["commit"], cwd=self.repo).splitlines()
        base = "checkpoints/2026-10-09-claude-pilot/"
        self.assertIn(base + "files/out/dispatch/vo/take-1.wav", names)
        self.assertIn(base + "files/video-engine/src/authored/Hero.tsx", names)
        self.assertIn(base + "run_state.json", names)
        self.assertFalse([n for n in names if "gmail" in n or "routing" in n or "/tmp/" in n])
        manifest = json.loads(sh("git", "show", result["commit"] + ":" + base + "manifest.json", cwd=self.repo))
        reasons = {row["path"]: row["reason"] for row in manifest["excluded"]}
        self.assertIn("out/dispatch/gmail-readback.json", reasons)
        self.assertIn("out/dispatch/tmp/scratch.json", reasons)

    def test_unchanged_state_adds_no_commit_and_changes_add_one(self):
        first = ck.save(self.repo, self.state, "a", environ={})
        again = ck.save(self.repo, self.state, "b", environ={})
        self.assertFalse(again["changed"])
        self.assertEqual(first["commit"], again["commit"])
        (self.repo / "out/dispatch/claims.json").write_text('{"claims": ["c1", "c2"]}')
        third = ck.save(self.repo, self.state, "c", environ={})
        self.assertTrue(third["changed"])
        parents = sh("git", "rev-list", "--parents", "-n", "1", third["commit"], cwd=self.repo).split()
        self.assertEqual([first["commit"]], parents[1:])

    def test_a_fresh_container_discovers_and_restores_the_same_ledger_and_files(self):
        ck.save(self.repo, self.state, "phase picture", environ={})
        original = json.loads(self.state.read_text())
        fresh = self.clone(Path(self.tmp.name) / "fresh")
        found = ck.discover(fresh)
        self.assertEqual(["2026-10-09-claude-pilot"], [row["run_id"] for row in found])
        self.assertFalse(found[0]["finished"])
        restored = ck.restore(fresh, "2026-10-09-claude-pilot")
        self.assertEqual("wake", restored["phase"])
        ledger = json.loads((fresh / "out/dispatch/run_state.json").read_text())
        for key in ("run_id", "limits", "usage", "resource_envelope", "events", "mode"):
            self.assertEqual(original[key], ledger[key], key)
        self.assertEqual(b"RIFF paid audio", (fresh / "out/dispatch/vo/take-1.wav").read_bytes())
        self.assertTrue((fresh / "video-engine/src/authored/Hero.tsx").is_file())
        self.assertFalse((fresh / "out/dispatch/gmail-readback.json").exists())

    def test_restore_never_replaces_an_active_ledger(self):
        ck.save(self.repo, self.state, "x", environ={})
        self.state.write_text(self.state.read_text().replace('"wake"', '"research"'))
        with self.assertRaisesRegex(ValueError, "refusing to overwrite"):
            ck.restore(self.repo, "2026-10-09-claude-pilot")

    def test_tampered_checkpoint_is_refused(self):
        result = ck.save(self.repo, self.state, "x", environ={})
        fresh = self.clone(Path(self.tmp.name) / "fresh")
        tip = ck.fetch_checkpoint(fresh, "2026-10-09-claude-pilot", "origin")
        manifest, _ = ck.verify_checkpoint(fresh, tip, "2026-10-09-claude-pilot")
        manifest["ledger_sha256"] = "0" * 64
        with self.assertRaises(ValueError):
            # Same check restore runs, against a manifest that no longer matches its ledger.
            import hashlib
            ledger = ck.show(fresh, tip, "checkpoints/2026-10-09-claude-pilot/run_state.json")
            if hashlib.sha256(ledger).hexdigest() != manifest["ledger_sha256"]:
                raise ValueError("checkpoint ledger differs from its manifest")

    def test_credential_in_an_included_file_fails_closed_without_printing_it(self):
        token = "supersecretvalue-0123456789abcdef"
        (self.repo / "out/dispatch/research_notes.md").write_text("note " + token)
        with self.assertRaises(ValueError) as caught:
            ck.save(self.repo, self.state, "x", environ={"EXAMPLE_API_KEY": token})
        self.assertNotIn(token, str(caught.exception))
        self.assertIn("research_notes.md", str(caught.exception))
        shaped = "AIza" + "A" * 35
        (self.repo / "out/dispatch/research_notes.md").write_text(shaped)
        with self.assertRaises(ValueError):
            ck.save(self.repo, self.state, "x", environ={})

    def test_shipped_checkpoint_is_reported_finished(self):
        state = json.loads(self.state.read_text())
        state.update(terminal_state="shipped", shipment={"verified_at": "2026-10-10T00:00:00Z"})
        shipped = self.repo / "out/dispatch/shipped_state.json"
        shipped.write_text(json.dumps(state))
        ck.save(self.repo, shipped, "shipped", environ={}, push=True)
        fresh = self.clone(Path(self.tmp.name) / "fresh")
        self.assertTrue(ck.discover(fresh)[0]["finished"])


if __name__ == "__main__":
    unittest.main()
