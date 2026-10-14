"""Regression tests for the canonical public export of a shipped ledger.

THE DEFECT THEY HOLD. scripts/public_state.py wrote export(state), which redacts only private owner
messages. The archive of the accepted 2026-10-11 shipment came out carrying the Gmail draft id, the
bound private readback and routing file names with their hashes, the shipment manifest path, the
committer addresses from the deployment commit and absolute local paths. claude_checkpoint already
had the sanitizer for exactly that. The CLI now calls it.

Each fixture field below has the shape of a real shipped ledger. The tests prove four things.
  1 Every private field is gone from the exported bytes.
  2 Usage, the frozen envelope, limits, increments and the failed verdict evidence are the same
    values after the path token is expanded again, so the sanitizer changed nothing that is a charge
    or a verdict.
  3 The private ledger is never modified, and the CLI refuses to overwrite it.
  4 Importing either module and running the export is not recursive.
Run: python3 scripts/public_state_test.py
"""
import copy
import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import claude_checkpoint  # noqa: E402
import public_state  # noqa: E402

ROOT = "/work/dispatch-fixture"
DRAFT = "r-3070703765003976791"
ADDRESS = "someone.private@example.com"
REJECTED = {"kind": "panel_verdict", "round": 1, "ship": False, "score": 6.824,
            "note": "rejected, retained unchanged"}
USAGE = {"reboards": 24, "tts_calls": 13, "full_renders": 5, "storyboard_critics": 40}
ENVELOPE = {"reboards": 25, "tts_calls": 14, "full_renders": 6, "storyboard_critics": 41}
LIMITS = {"tts_calls": 14, "full_renders": 6}


def shipped_state():
    return {
        "schema": "dispatch_run_state/1", "run_id": "2099-01-01", "terminal_state": "shipped",
        "phase": "shipped", "usage": copy.deepcopy(USAGE), "resource_envelope": copy.deepcopy(ENVELOPE),
        "limits": copy.deepcopy(LIMITS),
        "deliverable": {"film_sha256": "ab" * 32, "board": ROOT + "/out/dispatch/deliverables/x/storyboard.json",
                        "film": ROOT + "/out/dispatch/deliverables/x/film.mp4",
                        "manifest": ROOT + "/out/dispatch/deliverables/x/manifest.json"},
        "events": [
            copy.deepcopy(REJECTED),
            {"kind": "repair_plan", "baselines": [{"path": ROOT + "/out/dispatch/storyboard.json",
                                                   "before_path": ROOT + "/out/dispatch/baseline-repair1/storyboard.json"}],
             "failure_evidence": "failed film at " + ROOT + "/out/dispatch/retained-film-panel2-rejected.mp4"},
        ],
        "shipment": {
            "film_sha256": "ab" * 32, "gmail_draft_id": DRAFT,
            "manifest_path": ROOT + "/out/dispatch/shipment.json",
            "live_url": "https://example.test/videos/#2099-01-01-edition",
            "evidence": {
                "delivery_routing": {"path": "out/dispatch/delivery-routing.private.json", "sha256": "cd" * 32},
                "gmail_readback": {"path": "out/dispatch/gmail-readback.private.json", "sha256": "ef" * 32},
                "email": {"path": "runs/2099-01-01/email.md", "sha256": "01" * 32}},
            "deployment": {"head_commit": {"author": {"name": "Someone", "email": ADDRESS},
                                           "committer": {"name": "Someone", "email": ADDRESS}}},
        },
    }


class PublicExport(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.private = self.tmp / "private.json"
        self.state = shipped_state()
        self.private.write_text(json.dumps(self.state, indent=2))
        self.before = hashlib.sha256(self.private.read_bytes()).hexdigest()

    def run_cli(self, out, *extra):
        return subprocess.run([sys.executable, str(HERE / "public_state.py"), "--state", str(self.private),
                               "--out", str(out), "--root", ROOT, *extra],
                              capture_output=True, text=True)

    def test_old_export_alone_leaks_the_genuine_fields(self):
        # The defect: export() by itself leaves every one of these in the bytes it would publish.
        raw = json.dumps(public_state.export(self.state))
        for leak in (DRAFT, ADDRESS, "gmail-readback.private.json", "delivery-routing.private.json", ROOT):
            self.assertIn(leak, raw, leak + " should be present in the unsanitized export")

    def test_cli_output_carries_no_private_field(self):
        out = self.tmp / "public.json"
        done = self.run_cli(out)
        self.assertEqual(done.returncode, 0, done.stderr)
        text = out.read_text()
        for leak in (DRAFT, ADDRESS, "gmail-readback.private.json", "delivery-routing.private.json", ROOT):
            self.assertNotIn(leak, text, leak + " leaked into the public export")
        public = json.loads(text)
        # A local receipt path survives only as a checkout relative token, never as an absolute path.
        self.assertTrue(public["shipment"]["manifest_path"].startswith(claude_checkpoint.TOKEN + "/"))
        self.assertEqual(public["terminal_state"], "shipped")
        self.assertTrue(public["shipment"]["live_url"].startswith("https://example.test/"))
        self.assertEqual(public["shipment"]["evidence"]["email"]["sha256"], "01" * 32)
        self.assertEqual(public["shipment"]["film_sha256"], "ab" * 32)

    def test_charges_envelope_and_failed_verdict_are_unchanged(self):
        out = self.tmp / "public.json"
        self.assertEqual(self.run_cli(out).returncode, 0)
        public = json.loads(out.read_text())
        self.assertEqual(public["usage"], USAGE)
        self.assertEqual(public["resource_envelope"], ENVELOPE)
        self.assertEqual(public["limits"], LIMITS)
        self.assertEqual(public["events"][0], REJECTED)
        # The failed film's evidence keeps its meaning, only the local root became the token.
        expanded = claude_checkpoint.expand(public["events"][1], ROOT)
        self.assertEqual(expanded, self.state["events"][1])

    def test_private_ledger_is_never_modified(self):
        out = self.tmp / "public.json"
        self.assertEqual(self.run_cli(out).returncode, 0)
        self.assertEqual(hashlib.sha256(self.private.read_bytes()).hexdigest(), self.before)

    def test_cli_refuses_to_overwrite_the_private_ledger(self):
        done = self.run_cli(self.private)
        self.assertNotEqual(done.returncode, 0)
        self.assertEqual(hashlib.sha256(self.private.read_bytes()).hexdigest(), self.before)

    def test_default_root_comes_from_the_state_location(self):
        repo = Path("/somewhere/else")
        in_checkout = Path("/work/dispatch-fixture/out/dispatch/run_state.json")
        self.assertEqual(public_state.default_root(in_checkout, repo), Path("/work/dispatch-fixture"))
        self.assertEqual(public_state.default_root(Path("/tmp/loose/state.json"), repo), repo)

    def test_export_is_not_recursive(self):
        # claude_checkpoint imports public_state lazily inside public_ledger and public_state imports
        # claude_checkpoint lazily inside sanitized_export, so neither import runs the other at load.
        done = subprocess.run([sys.executable, "-c",
                               "import sys; sys.path.insert(0, %r); import public_state; import claude_checkpoint; "
                               "assert 'claude_checkpoint' in sys.modules; print('ok')" % str(HERE)],
                              capture_output=True, text=True)
        self.assertEqual(done.returncode, 0, done.stderr)
        text = public_state.sanitized_export(copy.deepcopy(self.state), ROOT)
        self.assertNotIn(DRAFT, text)

    def test_mutation_without_the_sanitizer_is_caught(self):
        # If the CLI went back to writing export(state), the leak test above must fail on it.
        raw = json.dumps(public_state.export(self.state))
        self.assertIn(DRAFT, raw)
        self.assertIn(ADDRESS, raw)


if __name__ == "__main__":
    unittest.main(verbosity=2)
