"""Regression tests for the canonical public export of a shipped ledger.

THE DEFECT THEY HOLD. scripts/public_state.py wrote export(state), which redacts only private owner
messages. The archive of the accepted 2026-10-11 shipment first came out carrying the Gmail draft id, the
bound private readback and routing file names with their hashes, the committer addresses from the deployment
commit and absolute local paths. claude_checkpoint already had the sanitizer for exactly that. The CLI now
calls it, and then refuses what a key name sanitizer can't see.

Each fixture field below has the shape of a real shipped ledger. The tests prove these things.
  1 Every private field is gone from the exported bytes. The checkout relative shipment manifest path survives
    only as a {REPO} token, never as an absolute path.
  2 Usage, the frozen envelope, limits, increments and the failed verdict evidence are the same values after the
    path token is expanded again, so the sanitizer changed nothing that is a charge or a verdict.
  3 The private ledger is never modified. The CLI refuses to overwrite it, including through a hard link.
  4 Importing either module does not import the other, and running the export is not recursive.
  5 The export refuses, and writes nothing, for credential-shaped text, a value that sat under a private key and
    survives under a neutral one, an absolute path from any other root, and a charge key the sanitizer would
    have replaced with a digest.
  6 A mutation that sends the CLI back to the unsanitized export is caught by the leak assertions.
An independent read only review by the Haiku mechanical route found the original weaknesses in these tests.
Run: python3 scripts/public_state_test.py
"""
import copy
import hashlib
import io
import json
import os
import subprocess
import sys
import tempfile
import unittest
from contextlib import redirect_stderr
from pathlib import Path
from unittest import mock

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import claude_checkpoint  # noqa: E402
import public_state  # noqa: E402

ROOT = "/work/dispatch-fixture"
DRAFT = "r-3070703765003976791"
ADDRESS = "someone.private@example.com"
ROUTING_PATH = "out/dispatch/delivery-routing.private.json"
READBACK_PATH = "out/dispatch/gmail-readback.private.json"
ROUTING_SHA = "cd" * 32
READBACK_SHA = "ef" * 32
REJECTED = {"kind": "panel_verdict", "round": 1, "ship": False, "score": 6.824,
            "note": "rejected, retained unchanged"}
USAGE = {"reboards": 24, "tts_calls": 13, "full_renders": 5, "storyboard_critics": 40}
ENVELOPE = {"reboards": 25, "tts_calls": 14, "full_renders": 6, "storyboard_critics": 41}
LIMITS = {"tts_calls": 14, "full_renders": 6}
ESCALATIONS = [{"resource": "tts_calls", "additional": 1, "reason": "mandatory completion"}]
CEILING = {"tts_calls": 16}
PRIVATE_FIELDS = (DRAFT, ADDRESS, READBACK_PATH, ROUTING_PATH, ROUTING_SHA, READBACK_SHA, ROOT)


def shipped_state():
    return {
        "schema": "dispatch_run_state/1", "run_id": "2099-01-01", "terminal_state": "shipped",
        "phase": "shipped", "usage": copy.deepcopy(USAGE), "resource_envelope": copy.deepcopy(ENVELOPE),
        "limits": copy.deepcopy(LIMITS), "escalations": copy.deepcopy(ESCALATIONS),
        "escalation_ceiling": copy.deepcopy(CEILING),
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
                "delivery_routing": {"path": ROUTING_PATH, "sha256": ROUTING_SHA},
                "gmail_readback": {"path": READBACK_PATH, "sha256": READBACK_SHA},
                "email": {"path": "runs/2099-01-01/email.md", "sha256": "01" * 32}},
            "deployment": {"head_commit": {"author": {"name": "Someone", "email": ADDRESS},
                                           "committer": {"name": "Someone", "email": ADDRESS}}},
        },
    }


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.private = self.tmp / "private.json"
        self.state = shipped_state()
        self.write_private(self.state)

    def write_private(self, state):
        self.private.write_text(json.dumps(state, indent=2))
        self.before = hashlib.sha256(self.private.read_bytes()).hexdigest()

    def cli(self, out, *extra, root=True):
        args = [sys.executable, str(HERE / "public_state.py"), "--state", str(self.private), "--out", str(out)]
        if root:
            args += ["--root", ROOT]
        return subprocess.run(args + list(extra), capture_output=True, text=True)

    def assert_no_private_field(self, text):
        for leak in PRIVATE_FIELDS:
            self.assertNotIn(leak, text, leak + " leaked into the public export")

    def assert_refused(self, state, message, out_name="public.json"):
        self.write_private(state)
        out = self.tmp / out_name
        done = self.cli(out)
        self.assertNotEqual(done.returncode, 0, done.stdout)
        self.assertIn(message, done.stderr)
        self.assertFalse(out.exists(), "a refused export must write nothing")
        self.assertEqual(hashlib.sha256(self.private.read_bytes()).hexdigest(), self.before)


class PublicExport(Base):
    def test_cli_output_carries_no_private_field(self):
        out = self.tmp / "public.json"
        done = self.cli(out)
        self.assertEqual(done.returncode, 0, done.stderr)
        text = out.read_text()
        self.assert_no_private_field(text)
        public = json.loads(text)
        self.assertEqual(public["terminal_state"], "shipped")
        self.assertTrue(public["shipment"]["live_url"].startswith("https://example.test/"))
        self.assertEqual(public["shipment"]["evidence"]["email"]["sha256"], "01" * 32)
        self.assertEqual(public["shipment"]["film_sha256"], "ab" * 32)
        # A local receipt path survives only as a checkout relative token, never as an absolute path.
        self.assertTrue(public["shipment"]["manifest_path"].startswith(claude_checkpoint.TOKEN + "/"))

    def test_charges_envelope_increments_and_failed_verdict_are_unchanged(self):
        out = self.tmp / "public.json"
        self.assertEqual(self.cli(out).returncode, 0)
        public = json.loads(out.read_text())
        self.assertEqual(public["usage"], USAGE)
        self.assertEqual(public["resource_envelope"], ENVELOPE)
        self.assertEqual(public["limits"], LIMITS)
        self.assertEqual(public["escalations"], ESCALATIONS)
        self.assertEqual(public["escalation_ceiling"], CEILING)
        self.assertEqual(public["events"][0], REJECTED)
        # The failed film's evidence keeps its meaning, only the local root became the token.
        self.assertEqual(claude_checkpoint.expand(public["events"][1], ROOT), self.state["events"][1])

    def test_private_ledger_is_never_modified(self):
        self.assertEqual(self.cli(self.tmp / "public.json").returncode, 0)
        self.assertEqual(hashlib.sha256(self.private.read_bytes()).hexdigest(), self.before)

    def test_default_root_comes_from_the_state_location(self):
        repo = Path("/somewhere/else")
        self.assertEqual(public_state.default_root(Path("/work/dispatch-fixture/out/dispatch/run_state.json"), repo),
                         Path("/work/dispatch-fixture"))
        self.assertEqual(public_state.default_root(Path("/tmp/loose/state.json"), repo), repo)

    def test_cli_without_root_replaces_the_checkout_the_state_lives_in(self):
        checkout = self.tmp / "checkout"
        (checkout / "out" / "dispatch").mkdir(parents=True)
        state = json.loads(json.dumps(self.state).replace(ROOT, str(checkout)))
        path = checkout / "out" / "dispatch" / "run_state.json"
        path.write_text(json.dumps(state))
        out = self.tmp / "public.json"
        done = subprocess.run([sys.executable, str(HERE / "public_state.py"), "--state", str(path), "--out", str(out)],
                              capture_output=True, text=True)
        self.assertEqual(done.returncode, 0, done.stderr)
        self.assertNotIn(str(checkout), out.read_text())
        self.assertIn(claude_checkpoint.TOKEN, out.read_text())


class Refusals(Base):
    def test_overwriting_the_private_ledger_is_refused_with_a_message(self):
        done = self.cli(self.private)
        self.assertNotEqual(done.returncode, 0)
        self.assertIn("must never overwrite the private ledger", done.stderr)
        self.assertEqual(hashlib.sha256(self.private.read_bytes()).hexdigest(), self.before)

    def test_a_hard_link_to_the_private_ledger_is_refused(self):
        link = self.tmp / "hardlink.json"
        os.link(self.private, link)
        done = self.cli(link)
        self.assertNotEqual(done.returncode, 0)
        self.assertIn("must never overwrite the private ledger", done.stderr)
        self.assertEqual(hashlib.sha256(self.private.read_bytes()).hexdigest(), self.before)

    def test_credential_shaped_text_is_refused_and_nothing_is_written(self):
        state = shipped_state()
        state["events"][0]["note"] = "key ghp_" + "A" * 36 + " was pasted into a note"
        self.assert_refused(state, "credential-shaped content")
        state = shipped_state()
        state["events"][1]["failure_evidence"] = "-----BEGIN RSA PRIVATE KEY-----"
        self.assert_refused(state, "credential-shaped content")

    def test_a_private_value_under_a_neutral_key_is_refused(self):
        for index, (label, change) in enumerate((
                ("a draft id in free text", lambda s: s["events"][1].update(failure_evidence="draft " + DRAFT + " failed")),
                ("a routing file name in free text", lambda s: s["events"][0].update(note="see " + ROUTING_PATH)),
                ("a private digest copied to a neutral key", lambda s: s.update(note_sha=READBACK_SHA)))):
            state = shipped_state(); change(state)
            self.assert_refused(state, "private key survived under a neutral one", out_name="value%d.json" % index)

    def test_an_absolute_path_from_another_root_is_refused(self):
        for index, path in enumerate(("/home/someoneelse/work/out/x.json", "/tmp/claude-0/scratch/y.txt", "/Users/dev/z.log")):
            state = shipped_state()
            state["events"][0]["note"] = "see " + path
            self.assert_refused(state, "absolute local path survived", out_name="path%d.json" % index)

    def test_a_charge_key_the_sanitizer_would_digest_is_refused(self):
        # A usage key that merely contains a private word would be replaced by a digest, which alters a charge.
        state = shipped_state()
        state["usage"]["routing_calls"] = 2
        self.assert_refused(state, "altered usage")
        state = shipped_state()
        state["escalations"][0]["recipient_note"] = "x"
        self.assert_refused(state, "altered escalations")

    def test_a_clean_ledger_with_harmless_lookalikes_still_exports(self):
        state = shipped_state()
        state["events"][0]["note"] = "the tmp directory and home page were reviewed; see runs/2099-01-01/email.md"
        self.write_private(state)
        done = self.cli(self.tmp / "public.json")
        self.assertEqual(done.returncode, 0, done.stderr)


class Structure(Base):
    def run_child(self, program):
        return subprocess.run([sys.executable, "-c", "import sys; sys.path.insert(0, %r); %s" % (str(HERE), program)],
                              capture_output=True, text=True)

    def test_importing_one_module_does_not_import_the_other(self):
        first = self.run_child("import public_state; assert 'claude_checkpoint' not in sys.modules, 'public_state imported claude_checkpoint'")
        self.assertEqual(first.returncode, 0, first.stderr)
        second = self.run_child("import claude_checkpoint; assert 'public_state' not in sys.modules, 'claude_checkpoint imported public_state'")
        self.assertEqual(second.returncode, 0, second.stderr)

    def test_the_export_runs_without_recursion_in_both_directions(self):
        # sanitized_export calls claude_checkpoint, which calls public_state.export, and none of it loops.
        text = public_state.sanitized_export(copy.deepcopy(self.state), ROOT)
        self.assertEqual(json.loads(text)["usage"], USAGE)
        self.assertEqual(claude_checkpoint.ledger_text(copy.deepcopy(self.state), ROOT), text)


class Mutation(Base):
    def test_sending_the_cli_back_to_the_raw_export_is_caught_by_the_leak_assertions(self):
        raw = lambda state, root: json.dumps(public_state.export(state), indent=2)
        out = self.tmp / "mutated.json"
        with mock.patch.object(public_state, "sanitized_export", raw):
            public_state.main(["--state", str(self.private), "--out", str(out), "--root", ROOT])
        with self.assertRaises(AssertionError):
            self.assert_no_private_field(out.read_text())

    def test_removing_the_private_value_sweep_would_publish_a_free_text_draft_id(self):
        state = shipped_state()
        state["events"][1]["failure_evidence"] = "draft " + DRAFT + " failed"
        sanitized = claude_checkpoint.ledger_text(copy.deepcopy(state), ROOT)
        self.assertIn(DRAFT, sanitized)                 # the key route alone does not catch it
        with self.assertRaises(ValueError):
            public_state.sanitized_export(state, ROOT)  # the sweep does

    def test_a_refusal_exits_with_a_message_and_writes_nothing(self):
        state = shipped_state(); state["events"][0]["note"] = "see /home/x/y"
        self.write_private(state)
        out = self.tmp / "none.json"
        with redirect_stderr(io.StringIO()), self.assertRaises(SystemExit) as caught:
            public_state.main(["--state", str(self.private), "--out", str(out), "--root", ROOT])
        self.assertIn("absolute local path", str(caught.exception))
        self.assertFalse(out.exists())


if __name__ == "__main__":
    unittest.main(verbosity=2)
