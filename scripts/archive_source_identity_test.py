#!/usr/bin/env python3
"""Exercise source-bound archive admission with real Git commits and blobs."""
import copy
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

import archive_source_identity as archive


class ArchiveSourceIdentityTest(unittest.TestCase):
    day = "2026-10-19"

    def git(self, *args):
        return subprocess.check_output(["git", *args], cwd=self.repo, stderr=subprocess.PIPE).decode().strip()

    def write(self, name, value):
        path = self.repo / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(value if isinstance(value, bytes) else (json.dumps(value, sort_keys=True) + "\n").encode())
        return path

    def commit(self):
        self.git("add", "--all")
        self.git("commit", "-qm", "Synthetic archive fixture")
        return self.git("rev-parse", "HEAD")

    def runfile(self, name):
        return "runs/" + self.day + "/" + name

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.repo = Path(self.temp.name)
        self.git("init", "-q")
        self.git("config", "user.name", "Archive fixture")
        self.git("config", "user.email", "fixture@example.invalid")
        self.dependencies = archive.CAPTURE | {"scripts/" + p for p in archive.INSPECTOR} | {"video-engine/public/fonts/font.woff2"}
        for name in self.dependencies:
            self.write(name, ("original " + name).encode())
        original_source = self.commit()
        original = {p: archive._file_sha(self.repo / p) for p in self.dependencies}
        capture = archive.CAPTURE | {"video-engine/public/fonts/font.woff2"}
        self.identity = {"producer": archive._fingerprint({p: original[p] for p in capture}),
                         "inspector": archive._fingerprint({p: original["scripts/" + p] for p in archive.INSPECTOR})}
        film = self.write(self.runfile("dispatch.mp4"), b"exact published film")
        report = self.write(self.runfile("report_card.json"), {"film_sha256": archive._file_sha(film), "judges": ["picture", "story", "sound"]})
        self.write(self.runfile("storyboard.json"), {"date": self.day, "run_id": self.day})
        options = []
        for option in ("a", "b"):
            path = self.write(self.runfile("openings/" + option + ".json"), {"inspector_sha256": self.identity["inspector"], "pass": True})
            options.append({"id": option, "inspection": {"file": path.name, "sha256": archive._file_sha(path)}})
        self.write(self.runfile("openings/comparison.json"), {"producer_sha256": self.identity["producer"], "options": options})
        self.write(self.runfile("openings/selection.json"), {"selected": "a", "reviewer_identity": "independent"})
        self.old = {"mode": "production", "run_id": self.day, "phase": "publishing", "terminal_state": None,
                    "release_status": "publishable", "usage": {"scorers": 3}, "resource_envelope": {"scorers": 3},
                    "limits": {"scorers": 3}, "escalations": [],
                    "final_report": {"sha256": archive._file_sha(report), "film_sha256": archive._file_sha(film)},
                    "deliverable": {"film_sha256": archive._file_sha(film)},
                    "events": [{"kind": "reserved", "resources": {"scorers": 3}},
                               {"kind": "release_authorized", "result": "publishable", "report_sha256": archive._file_sha(report)}]}
        self.write(self.runfile("run_state.json"), self.old)
        self.base = self.commit()
        self.write("scripts/opening_compare.py", b"reviewed orchestration-only revision")
        self.config = {"schema": "dispatch-retained-capture-sources/1", "sources": [{
            "original_source": original_source, "original_dependencies": original,
            "current_dependencies": {p: archive._file_sha(self.repo / p) for p in self.dependencies}}]}
        self.write(archive.CONFIG, self.config)
        self.new = copy.deepcopy(self.old)
        self.new.update(phase="shipped", terminal_state="shipped", updated_at="2026-10-21T01:00:00Z",
                        shipment={"film_sha256": archive._file_sha(film), "manifest_sha256": "a" * 64})
        self.new["events"].append({"kind": "finished", "result": "shipped", "at": "2026-10-21T01:00:00Z",
                                   "shipment_sha256": "a" * 64})
        self.write(self.runfile("run_state.json"), self.new)
        self.write(self.runfile("email.md"), b"Archived delivery copy.")
        self.commit()

    def context(self):
        return archive.validation_context(self.repo, self.base, self.day)

    def rejected(self):
        with self.assertRaises(ValueError):
            with self.context():
                self.fail("invalid closure was admitted")
        self.assertIsNone(archive.historical_identity("producer"))

    def mutate_state(self, change):
        state = copy.deepcopy(self.new)
        change(state)
        self.write(self.runfile("run_state.json"), state)
        self.commit()

    def test_exact_closure_binds_and_resets_identity(self):
        self.assertIsNone(archive.historical_identity("producer"))
        with self.context():
            self.assertEqual(archive.historical_identity("producer"), self.identity["producer"])
            self.assertEqual(archive.historical_identity("inspector"), self.identity["inspector"])
        self.assertIsNone(archive.historical_identity("inspector"))

    def test_exception_resets_identity(self):
        with self.assertRaisesRegex(RuntimeError, "publication gate failed"):
            with self.context():
                raise RuntimeError("publication gate failed")
        self.assertIsNone(archive.historical_identity("producer"))

    def test_changed_media_is_rejected(self):
        self.write(self.runfile("dispatch.mp4"), b"substituted media")
        self.commit()
        self.rejected()

    def test_rewritten_report_with_updated_ledger_hash_is_rejected(self):
        path = self.write(self.runfile("report_card.json"), {"judges": ["invented approval"]})
        self.mutate_state(lambda s: s["final_report"].update(sha256=archive._file_sha(path)))
        self.rejected()

    def test_rewritten_inspector_and_updated_reference_is_rejected(self):
        path = self.write(self.runfile("openings/a.json"), {"inspector_sha256": self.identity["inspector"], "pass": False})
        receipt_path = self.repo / self.runfile("openings/comparison.json")
        receipt = json.loads(receipt_path.read_text())
        receipt["options"][0]["inspection"]["sha256"] = archive._file_sha(path)
        self.write(self.runfile("openings/comparison.json"), receipt)
        self.commit()
        self.rejected()

    def test_deleted_evidence_is_rejected(self):
        (self.repo / self.runfile("openings/selection.json")).unlink()
        self.commit()
        self.rejected()

    def test_uncommitted_media_substitution_is_rejected(self):
        self.write(self.runfile("dispatch.mp4"), b"uncommitted replacement")
        self.rejected()

    def test_uncommitted_ledger_substitution_is_rejected(self):
        self.write(self.runfile("run_state.json"), self.old)
        self.rejected()

    def test_added_evidence_is_rejected(self):
        self.write(self.runfile("unreviewed.json"), {})
        self.commit()
        self.rejected()

    def test_prior_event_rewrite_is_rejected(self):
        self.mutate_state(lambda s: s["events"][0].update(resources={"scorers": 0}))
        self.rejected()

    def test_usage_rewrite_is_rejected(self):
        self.mutate_state(lambda s: s["usage"].update(scorers=0))
        self.rejected()

    def test_frozen_envelope_rewrite_is_rejected(self):
        self.mutate_state(lambda s: s["resource_envelope"].update(scorers=30))
        self.rejected()

    def test_unrecorded_grant_is_rejected(self):
        self.mutate_state(lambda s: s["escalations"].append({"scorers": 3}))
        self.rejected()

    def test_shipment_hash_mismatch_is_rejected(self):
        self.mutate_state(lambda s: s["shipment"].update(manifest_sha256="b" * 64))
        self.rejected()

    def test_shipment_film_mismatch_is_rejected(self):
        self.mutate_state(lambda s: s["shipment"].update(film_sha256="b" * 64))
        self.rejected()

    def repeat_shipment(self, state):
        state["events"].append({"kind": "finished", "result": "shipped", "at": "2026-10-21T02:00:00Z",
                                "shipment_sha256": "b" * 64})
        state["shipment"]["manifest_sha256"] = "b" * 64
        state["updated_at"] = "2026-10-21T02:00:00Z"

    def test_two_consecutive_shipment_receipts_are_accepted(self):
        self.mutate_state(self.repeat_shipment)
        with self.context():
            self.assertEqual(archive.historical_identity("producer"), self.identity["producer"])
        current = json.loads((self.repo / self.runfile("run_state.json")).read_text())
        self.assertEqual(current["events"][:-1], self.new["events"])
        self.assertEqual(current["shipment"]["manifest_sha256"], "b" * 64)

    def test_nonfinished_appended_event_is_rejected(self):
        self.mutate_state(lambda s: s["events"].append({"kind": "reserved", "resources": {"scorers": 1}}))
        self.rejected()

    def test_original_publication_receipt_rewrite_is_rejected(self):
        self.mutate_state(lambda s: s["events"][len(self.old["events"]) - 1].update(report_sha256="c" * 64))
        self.rejected()

    def test_invalid_earlier_shipment_receipt_is_rejected(self):
        def change(state):
            self.repeat_shipment(state)
            state["events"][-2]["shipment_sha256"] = "invalid"
        self.mutate_state(change)
        self.rejected()

    def test_earlier_shipment_without_timestamp_is_rejected(self):
        def change(state):
            self.repeat_shipment(state)
            state["events"][-2]["at"] = " "
        self.mutate_state(change)
        self.rejected()

    def test_latest_receipt_must_bind_current_shipment(self):
        def change(state):
            self.repeat_shipment(state)
            state["shipment"]["manifest_sha256"] = "a" * 64
        self.mutate_state(change)
        self.rejected()

    def test_new_edition_gets_no_historical_identity(self):
        with archive.validation_context(self.repo, self.base, "2026-10-21"):
            self.assertIsNone(archive.historical_identity("producer"))

    def test_unknown_source_gets_no_historical_identity(self):
        self.config["sources"][0]["original_dependencies"]["scripts/opening_compare.py"] = "b" * 64
        self.write(archive.CONFIG, self.config)
        self.commit()
        with self.context():
            self.assertIsNone(archive.historical_identity("producer"))

    def test_changed_current_dependency_is_rejected(self):
        self.write("scripts/preflight_animatic.py", b"unreviewed measurement change")
        self.commit()
        self.rejected()

    def test_uncommitted_config_is_rejected(self):
        self.config["sources"] = []
        self.write(archive.CONFIG, self.config)
        self.rejected()

    def test_nonterminal_run_gets_no_historical_identity(self):
        self.write(self.runfile("run_state.json"), self.old)
        self.commit()
        with self.context():
            self.assertIsNone(archive.historical_identity("producer"))


if __name__ == "__main__":
    unittest.main()
