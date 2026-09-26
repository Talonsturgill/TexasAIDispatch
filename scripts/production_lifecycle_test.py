"""Regression tests for the September 26 premature production stop."""
import base64
import copy
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import run_controller as c
import production_lifecycle as life
import shipment_check as ship
import critic_gate


class LifecycleTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.state = self.root / "run_state.json"
        c.initialise(self.state, "2026-09-26", "production")

    def write(self, name, data):
        p = self.root / name
        p.write_text(json.dumps(data))
        return p

    def plan(self):
        source = self.root / "scene.tsx"
        baseline = self.root / "scene.before.tsx"
        source.write_text("unrecognizable mechanism")
        baseline.write_bytes(source.read_bytes())
        failure = self.write("review.json", {"pass": False, "weakest": "floating record; no consequence"})
        return self.write("plan.json", {
            "root_cause": "The capture object floats without a physical transfer.",
            "repair": "Replace the floating card with a source-grounded camera action.",
            "mechanism_change": "The truck now crosses the optical plane and exposes the surface.",
            "expected_visible_result": "Contact and the recorded street detail remain identifiable.",
            "failure_evidence": str(failure), "failure_evidence_sha256": c.digest(failure),
            "changed_inputs": [{"path": str(source), "before_path": str(baseline),
                                "before_sha256": c.digest(baseline)}],
            "resources": {"preflight_renders": 2, "full_renders": 1,
                          "audiovisual_reviews": 4, "panel_rounds": 1, "scorer_calls": 3}})

    def test_september26_stop_is_rejected(self):
        state = c.read_state(self.state)
        state["usage"]["reboards"] = state["escalation_ceiling"]["reboards"]
        state["usage"]["storyboard_critics"] = state["escalation_ceiling"]["storyboard_critics"]
        c.save(self.state, state)
        self.assertFalse(c.reserve(self.state, {"reboards": 1})[0])
        self.assertEqual(c.read_state(self.state)["phase"], "repair_planning")
        self.assertFalse(c.finish(self.state, "needs_review", reason="ceiling reached")[0])
        self.assertIsNone(c.read_state(self.state)["terminal_state"])
        # An exhausted board resource no longer disables unrelated judging.
        with patch("preship_check.current_for", return_value=(True, "current")):
            self.assertTrue(c.reserve_panel(self.state, 3)[0])
        plan = self.plan()
        before_usage = c.read_state(self.state)["usage"]
        self.assertTrue(life.begin_repair(self.state, plan)[0])
        self.assertEqual(c.read_state(self.state)["usage"], before_usage)
        self.assertFalse(life.authorize_repair(self.state, plan)[0])
        self.assertTrue(c.reserve(self.state, {"reboards": 1})[0])
        self.assertFalse(life.authorize_repair(self.state, plan)[0])
        data = c.load_json(plan)
        source = Path(data["changed_inputs"][0]["path"])
        source.write_text("truck intersects camera field; recorded image persists")
        data["changed_inputs"][0]["after_sha256"] = c.digest(source)
        plan.write_text(json.dumps(data))
        self.assertTrue(life.authorize_repair(self.state, plan)[0])
        self.assertFalse(life.authorize_repair(self.state, plan)[0])
        self.assertFalse(life.begin_repair(self.state, plan)[0])
        self.assertFalse(life.allowance_problems(c.read_state(self.state)))
        self.assertEqual(c.read_state(self.state)["usage"]["reboards"], before_usage["reboards"] + 1)
        altered = c.read_state(self.state)
        altered["escalation_ceiling"]["full_renders"] += 1
        self.assertTrue(life.allowance_problems(altered))

    def test_publishable_is_release_permission_not_completion(self):
        report = self.write("report.json", {"score": c.threshold(), "ship": True, "hard_fails": []})
        state = c.read_state(self.state)
        state["deliverable"] = {"film_sha256": "f" * 64}
        c.save(self.state, state)
        with patch.object(c, "deliverable_problems", return_value=[]), patch.object(c, "cinematic_report_problems", return_value=[]):
            self.assertTrue(c.finish(self.state, "publishable", report=report)[0])
            self.assertIsNone(c.read_state(self.state)["terminal_state"])
            self.assertTrue(c.check_delivery(self.state, report)[0])
            self.assertFalse(c.finish(self.state, "shipped")[0])
            self.assertFalse(c.finish(self.state, "shipped", shipment=self.root / "absent")[0])
            self.assertIsNone(c.read_state(self.state)["terminal_state"])
            report.write_text('{"score": 0, "ship": false}')
            self.assertFalse(c.check_delivery(self.state, report)[0])

    def test_checkpoint_keeps_ledger_active(self):
        package = self.root / "checkpoint"
        package.mkdir()
        state = c.read_state(self.state)
        saved = {}
        for file, key in (("dispatch.mp4", "film"), ("storyboard.json", "board"),
                          ("render-manifest.json", "manifest")):
            p = package / file
            p.write_text(file)
            saved[key + "_sha256"] = c.digest(p)
        state["deliverable"] = saved
        c.save(self.state, state)
        usage = copy.deepcopy(state["usage"])
        self.assertTrue(life.checkpoint(self.state, package, "Repair the capture action before the next exact-film review")[0])
        self.assertEqual(c.read_state(self.state)["usage"], usage)
        self.assertIsNone(c.read_state(self.state)["terminal_state"])
        script = (c.REPO / "scripts/package_review_run.sh").read_text()
        self.assertNotIn("finish --result needs_review", script)
        self.assertIn('checkpoint', script)

    def test_preship_errors_and_bypass_cannot_purchase_panel(self):
        with patch("preship_check.current_for", side_effect=OSError("missing evidence")):
            self.assertFalse(c.reserve_panel(self.state, 3)[0])
        self.assertFalse(c.reserve_panel(self.state, 3, skip_preship=True)[0])
        self.assertEqual(c.read_state(self.state)["usage"]["scorer_calls"], 0)

    def test_pending_resumes_mutable_state_and_ignores_old_schema(self):
        old = self.root / "old/out/dispatch"
        old.mkdir(parents=True)
        (old / "run_state.json").write_text(json.dumps({"run_id": "2026-09-21", "mode": "production"}))
        current = self.root / "current/out/dispatch"
        current.mkdir(parents=True)
        c.save(current / "run_state.json", c.read_state(self.state))
        archived = self.root / "current/runs/review/edition"
        archived.mkdir(parents=True)
        state = c.read_state(self.state)
        state["terminal_state"] = "needs_review"
        c.save(archived / "run_state.json", state)
        listing = f"worktree {self.root / 'old'}\n\nworktree {self.root / 'current'}\n"
        with patch.object(life.subprocess, "check_output", return_value=listing):
            result = life.pending(self.root)
            self.assertEqual(len(result), 1)
            self.assertEqual(result[0]["state"], str(current / "run_state.json"))
            state["terminal_state"] = "shipped"
            c.save(current / "run_state.json", state)
            self.assertFalse(life.pending(self.root))

    def test_phone_plan_does_not_prove_finished_assets(self):
        board = {"date": "2026-09-26"}
        report = {"verdict": "pass", "reviewer_identity": "critic", "reviewed_at": "now",
                  "weakest_frame": "close", "concept_sha256": critic_gate.concept_digest(board),
                  "review_scope": "exact-muted-phone-preflight", "reviewed_preflight_sha256": "film"}
        preflight = {"pass": True, "board_sha256": "board", "film_sha256": "film", "renderer_sha256": None}
        self.assertEqual(len(critic_gate.film_review_problems(board, report, preflight, "board", "film")), 4)
        report["phone_observations"] = {
            k: {"pass": True, "start_s": i, "end_s": i + 1,
                "observed": "The observed object changes state with a readable consequence."}
            for i, k in enumerate(("subject_recognition", "contact_and_consequence", "surface_finish", "closing_payoff"))}
        self.assertFalse(critic_gate.film_review_problems(board, report, preflight, "board", "film"))
        report["phone_observations"]["surface_finish"]["pass"] = False
        self.assertTrue(critic_gate.film_review_problems(board, report, preflight, "board", "film"))


class ShipmentTest(unittest.TestCase):
    setUp = LifecycleTest.setUp
    write = LifecycleTest.write
    def test_remote_checks_and_actual_media_are_required(self):
        body = "Watch the source-grounded film.\nThe email remains a draft."
        gmail = {"id": "draft-1", "message": {"id": "message-1", "labelIds": ["DRAFT"],
                 "payload": {"mimeType": "text/plain", "headers": [{"name": "To", "value": "owner@example.com"}],
                             "body": {"data": base64.urlsafe_b64encode(body.encode()).decode()}}}}
        self.assertFalse(ship.draft_problems(gmail, "owner@example.com", body))
        wrong = copy.deepcopy(gmail)
        wrong["message"]["labelIds"].append("SENT")
        self.assertTrue(ship.draft_problems(wrong, "owner@example.com", body))
        self.assertTrue(ship.draft_problems(gmail, "wrong@example.com", body))
        self.assertTrue(ship.draft_problems(gmail, "owner@example.com", "another edition"))
        master = b"actual final film bytes"
        mobile = self.root / "phone.mp4"
        mobile.write_bytes(b"phone rendition bytes")
        film_hash = __import__("hashlib").sha256(master).hexdigest()
        live = "https://texasaidocket.com/videos/#2026-09-26-test"
        mobile_url = "https://media.example/phone.mp4"
        shot = self.root / "phone.png"
        shot.write_bytes(b"retained screenshot fixture")
        def bound(p): return {"path": str(p), "sha256": c.digest(p)}
        phone = {"url": live, "master_sha256": film_hash, "viewport": {"width": 390},
                 "tool": "Computer Use", "observed_at": c.now(), "screenshots": [bound(shot)],
                 "samples": [{"currentSrc": mobile_url, "readyState": 4, "paused": False,
                              "error": None, "currentTime": t} for t in (2, 4)]}
        email = self.root / "email.md"
        email.write_text(body)
        raw = self.write("gmail.json", gmail)
        playback = self.write("phone.json", phone)
        routing = self.write("routing.json", {"run_id": "2026-09-26", "recipient": "owner@example.com"})
        manifest_data = {"run_id": "2026-09-26", "film_sha256": film_hash,
                         "dispatch_pr": "https://github.com/Talonsturgill/TexasAIDispatch/pull/1",
                         "feed_pr": "https://github.com/Talonsturgill/TexasAIDocket/pull/2",
                         "deployment_run_id": 42, "live_url": live,
                         "expected_recipient": "owner@example.com", "delivery_routing": bound(routing),
                         "mobile": bound(mobile), "email": bound(email),
                         "gmail_readback": bound(raw), "phone_playback": bound(playback)}
        manifest = self.write("shipment.json", manifest_data)
        state = c.read_state(self.state)
        state["deliverable"] = {"film_sha256": film_hash}
        feed = {"media_base": "https://media.example", "videos": [{
            "date": "2026-09-26", "id": "2026-09-26-test", "video": "/master.mp4",
            "video_mobile": "/phone.mp4", "poster": "/poster.png", "poster_thumb": "/thumb.jpg"}]}
        bad = {}
        def github(endpoint):
            if "/pulls/" in endpoint:
                return {"merged": True, "head": {"sha": "head"}, "merge_commit_sha": "merge"}
            if "/check-runs" in endpoint:
                return {"total_count": 1, "check_runs": [{"status": "completed", "conclusion": bad.get("ci", "success")}]}
            return {"status": "completed", "conclusion": "success", "name": "pages build and deployment",
                    "head_sha": bad.get("deploy", "merge")}
        def fetch(url, **kwargs):
            data = json.dumps(feed).encode() if url.endswith("videos.json") else (
                bad.get("master", master) if url.endswith("master.mp4") else mobile.read_bytes())
            return 200, data, {}
        with patch.object(ship, "gh", side_effect=github), patch.object(ship, "fetch", side_effect=fetch), patch.object(ship, "media_problems", return_value=[]):
            self.assertFalse(ship.verify_shipment(state, manifest)[1])
            c.save(self.state, state)
            with patch.object(c, "check_package", return_value=(True, "exact quality evidence")):
                self.assertTrue(c.finish(self.state, "shipped", shipment=manifest)[0])
                self.assertEqual(c.read_state(self.state)["terminal_state"], "shipped")
                self.assertFalse(c.reopen(self.state, "cannot alter a shipped edition")[0])
            for name, value in (("ci", "failure"), ("deploy", "stale"), ("master", b"stale film")):
                bad[name] = value
                self.assertTrue(ship.verify_shipment(state, manifest)[1], name)
                bad.clear()
            raw.write_text(json.dumps(wrong))
            self.assertTrue(ship.verify_shipment(state, manifest)[1])
            # Do not accept a rehashed sent message either.
            manifest_data["gmail_readback"] = bound(raw)
            manifest.write_text(json.dumps(manifest_data))
            self.assertTrue(ship.verify_shipment(state, manifest)[1])
        phone["samples"][-1]["currentTime"] = 2
        self.assertTrue(ship.playback_problems(phone, live, mobile_url, film_hash))


if __name__ == "__main__":
    unittest.main()
