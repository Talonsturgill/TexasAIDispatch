"""Verify complete MIME delivery without accounts, network calls or fabricated receipts."""
import base64
import copy
import html
import json
from email.message import EmailMessage
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

import gmail_mime_check as check
import music_credit_payload as credit


class MimeDelivery(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.run = self.root / "2026-10-21"
        self.run.mkdir()
        (self.run / "mix.json").write_text(json.dumps({"bed_track_id": "immersed"}))
        self.body = ("A supported film\n-----BEGIN CAPTION-----\nA supported caption.\n"
                     "-----END CAPTION-----\n\n" + credit.block(self.run / "mix.json"))
        (self.run / "email.md").write_text(self.body)
        for name, data in (("dispatch-720.mp4", b"actual fixture phone bytes"),
                           ("poster.png", b"actual fixture poster bytes")):
            (self.run / name).write_bytes(data)
        self.routing = self.root / "routing.json"
        self.routing.write_text(json.dumps({"run_id": self.run.name, "recipient": "owner@example.org"}))
        self.full = {"id": "actual-fixture-message", "label_ids": ["DRAFT"], "payload": {
            "headers": [{"name": "To", "value": "owner@example.org"},
                        {"name": "Subject", "value": "A supported film"}],
            "mime_type": "text/html", "body": {"content": "<pre>" + html.escape(self.body) + "</pre>"}}}
        self.message = EmailMessage()
        self.message["Subject"] = "A supported film"
        self.message["To"] = "owner@example.org"
        self.message.set_content(self.body)
        self.message.add_alternative("<pre>" + html.escape(self.body) + "</pre>", subtype="html")
        for name, kind in (("dispatch-720.mp4", "video/mp4"), ("poster.png", "image/png")):
            major, minor = kind.split("/")
            self.message.add_attachment((self.run / name).read_bytes(), maintype=major,
                                        subtype=minor, filename=name)
        self.full_path, self.raw_path = self.root / "full.json", self.root / "raw.json"

    def inputs(self, full=None, message=None, raw_updates=None):
        full = self.full if full is None else full
        message = self.message if message is None else message
        raw = {"id": "actual-fixture-message", "label_ids": ["DRAFT"],
               "raw": base64.urlsafe_b64encode(message.as_bytes()).decode().rstrip("=")}
        raw.update(raw_updates or {})
        self.full_path.write_text(json.dumps(full))
        self.raw_path.write_text(json.dumps(raw))

    def verify(self):
        return check.verify(self.full_path, self.raw_path, "actual-fixture-draft", self.run, self.routing)

    def test_connector_full_and_raw_bind_exact_body_and_attachment_bytes(self):
        self.inputs()
        record, envelope = self.verify()
        self.assertTrue(record["pass"], record)
        self.assertEqual(envelope["message"], self.full)
        self.assertEqual(len(record["attachments"]), 2)
        self.assertEqual(record["full"], check.bound(self.full_path))

    def test_native_api_and_unchanged_tool_envelope_are_supported(self):
        native = copy.deepcopy(self.full)
        native["labelIds"] = native.pop("label_ids")
        native["payload"]["mimeType"] = native["payload"].pop("mime_type")
        content = native["payload"]["body"].pop("content")
        native["payload"]["body"]["data"] = base64.urlsafe_b64encode(content.encode()).decode()
        for full in (native, {"structuredContent": self.full},
                     {"id": "actual-fixture-draft", "message": self.full}):
            with self.subTest(full=list(full)):
                self.inputs(full=full)
                self.assertTrue(self.verify()[0]["pass"], self.verify()[0])

    def test_wrong_subject_in_either_representation_fails(self):
        wrong = copy.deepcopy(self.full)
        wrong["payload"]["headers"][1]["value"] = "Wrong film"
        self.inputs(full=wrong)
        self.assertFalse(self.verify()[0]["pass"])
        message = copy.deepcopy(self.message)
        message.replace_header("Subject", "Wrong film")
        self.inputs(message=message)
        self.assertFalse(self.verify()[0]["pass"])

    def test_stale_message_sent_or_missing_label_and_wrong_routing_fail(self):
        for update in ({"id": "previous-message"}, {"label_ids": ["DRAFT", "SENT"]},
                       {"label_ids": []}):
            self.inputs(raw_updates=update)
            self.assertFalse(self.verify()[0]["pass"], update)
        for update in ({"run_id": "2026-10-19", "recipient": "owner@example.org"},
                       {"run_id": self.run.name, "recipient": "someone@example.org"}):
            self.routing.write_text(json.dumps(update))
            self.inputs()
            self.assertFalse(self.verify()[0]["pass"], update)

    def test_cc_and_changed_plain_or_html_body_fail(self):
        for variant in ("cc", "plain", "html"):
            message = copy.deepcopy(self.message)
            if variant == "cc":
                message["Cc"] = "extra@example.org"
            else:
                alternative = message.get_payload()[0].get_payload()[variant == "html"]
                alternative.set_content("Changed payload", subtype=variant)
            self.inputs(message=message)
            self.assertFalse(self.verify()[0]["pass"], variant)

    def test_missing_duplicate_wrong_type_and_changed_attachment_fail(self):
        for variant in ("missing", "duplicate", "type", "bytes"):
            message = copy.deepcopy(self.message)
            if variant == "missing":
                message.get_payload().pop()
            elif variant == "duplicate":
                message.attach(copy.deepcopy(message.get_payload()[-1]))
            elif variant == "type":
                message.get_payload()[-1].replace_header("Content-Type", "image/jpeg")
            else:
                message.get_payload()[-1].set_payload(base64.b64encode(b"other poster").decode())
            self.inputs(message=message)
            self.assertFalse(self.verify()[0]["pass"], variant)

    def test_consistently_wrong_music_credit_still_fails_actual_mix_binding(self):
        self.body = self.body.replace("CC BY 4.0", "CC BY-NC 4.0")
        (self.run / "email.md").write_text(self.body)
        self.full["payload"]["body"]["content"] = html.escape(self.body)
        message = copy.deepcopy(self.message)
        alternatives = message.get_payload()[0].get_payload()
        alternatives[0].set_content(self.body)
        alternatives[1].set_content(html.escape(self.body), subtype="html")
        self.inputs(message=message)
        self.assertTrue(any("music credits differ" in p for p in self.verify()[0]["problems"]))

    def test_malformed_or_missing_raw_returns_failure(self):
        for update in ({"raw": "not!base64"}, {"raw": ""}, {"raw": None}):
            self.inputs(raw_updates=update)
            self.assertFalse(self.verify()[0]["pass"])

    def test_cli_writes_private_proof_and_unchanged_message_envelope(self):
        self.inputs()
        out, readback = self.root / "proof.json", self.root / "readback.json"
        command = [sys.executable, check.__file__, "--full", str(self.full_path), "--raw", str(self.raw_path),
                   "--draft-id", "actual-fixture-draft", "--run", str(self.run), "--routing", str(self.routing),
                   "--out", str(out), "--readback", str(readback)]
        before = self.full_path.read_bytes(), self.raw_path.read_bytes()
        result = subprocess.run(command, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(json.loads(readback.read_text())["message"], self.full)
        self.assertEqual(out.stat().st_mode & 0o777, 0o600)
        self.assertEqual(readback.stat().st_mode & 0o777, 0o600)
        self.assertEqual(before, (self.full_path.read_bytes(), self.raw_path.read_bytes()))
        command[command.index("--out") + 1] = str(self.full_path)
        result = subprocess.run(command, capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(before[0], self.full_path.read_bytes())


if __name__ == "__main__":
    unittest.main()
