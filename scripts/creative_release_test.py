"""Negative and integration tests for bounded creative release, without paid media."""
import copy
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import creative_release as c


class CreativeReleaseTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.repo = Path(self.tmp.name)
        self.root = self.repo / "out/dispatch"
        self.root.mkdir(parents=True)
        self.board = {"date": "2026-09-29", "scenes": [],
                      "story_contract": {"director_identity": "director"}}
        self.state = {"mode": "production", "run_id": "2026-09-29", "usage": {"reboards": 3}}
        self.report = {"verdict": "revise", "reviewer_identity": "critic", "reviewed_at": "now",
                       "reviewed_preflight_sha256": c.payload_digest("film"),
                       "blocking_defects": [{"id": "motion", "observed": "visible change is weak"}],
                       "phone_observations": {"dominant_action": {"pass": False, "observed": "weak visible development"}}}
        self.write("storyboard.json", self.board)
        self.write("claims.json", {"claims": []})
        self.write("run_state.json", self.state)
        (self.root / "preflight.mp4").write_bytes(b"retained exact film")
        self.report["reviewed_preflight_sha256"] = c.digest(self.root / "preflight.mp4")
        self.write("critic.json", self.report)
        self.assessment_path = c.template(self.root / "storyboard.json", self.root / "critic.json",
                                          self.root / "preflight.mp4", "phone", None)
        self.assessment = c.read(self.assessment_path)
        self.assessment.update(reviewer_identity="critic", reviewed_at="now")
        for item in self.assessment["retained_checks"].values():
            item.update({"pass": True, "observed": "Specific independently observed evidence supports this retained check."})
        for item in self.assessment["defects"]:
            item["category"] = "motion"
        self.save_assessment()

    def write(self, name, obj):
        (self.root / name).write_text(json.dumps(obj))

    def save_assessment(self):
        self.assessment_path.write_text(json.dumps(self.assessment))

    def allowed(self):
        return c.review_allows(self.board, self.report, self.root)


    def test_technical_charges_do_not_exhaust_creative_rounds(self):
        state = {"mode": "production", "run_id": "2026-09-30", "usage": {"reboards": 3},
                 "events": []}
        for _ in range(3):
            state["events"] += [{"kind": "repair_started", "repair_scope": "technical-integrity"},
                               {"kind": "reserved", "resources": {"reboards": 1}},
                               {"kind": "repair_authorized"}]
        self.assertEqual(c.creative_rounds(state), 0)
        self.assertFalse(c.cap_reached(state))
        self.assertEqual(state["usage"]["reboards"], 3)
        state["usage"]["reboards"] += 3
        state["events"].append({"kind": "reserved", "resources": {"reboards": 3}})
        self.assertTrue(c.cap_reached(state))
        state["run_id"] = "2026-09-29"
        self.assertEqual(c.creative_rounds(state), 6)

    def test_technical_batch_excludes_only_one_charge(self):
        state = {"run_id": "2026-09-30", "usage": {"reboards": 3}, "events": [
            {"kind": "repair_started", "repair_scope": "technical-integrity"},
            {"kind": "reserved", "resources": {"reboards": 2}},
            {"kind": "reserved", "resources": {"reboards": 1}}]}
        self.assertEqual(c.creative_rounds(state), 2)

    def test_technical_classification_covers_every_independent_finding(self):
        finding = {"id": "overprint", "observed": "Source title overlaps the attribution."}
        report = {"reviewer_identity": "critic", "blocking_defects": [finding],
                  "technical_repair": {"findings": [{"finding": finding, "category": "layout"}]}}
        self.write("technical.json", report)
        path = self.root / "technical.json"
        plan = {"director_identity": "director", "failure_evidence": str(path),
                "failure_evidence_sha256": c.digest(path)}
        state = {"run_id": "2026-09-30"}
        self.assertEqual(c.technical_repair_problems(state, plan), [])
        for key, value in (("reviewer_identity", "director"),
                           ("technical_repair", {"findings": []}),
                           ("technical_repair", {"findings": [{"finding": finding, "category": "motion"}]})):
            bad = copy.deepcopy(report)
            bad[key] = value
            path.write_text(json.dumps(bad))
            plan["failure_evidence_sha256"] = c.digest(path)
            self.assertTrue(c.technical_repair_problems(state, plan))
        path.write_text(json.dumps(report))
        self.assertTrue(c.technical_repair_problems(state, plan))

    def test_new_editions_cannot_defer_missing_picture_action(self):
        board = dict(self.board, date="2026-09-30")
        with patch.object(c, "eligible", return_value=True), patch.object(c, "review_allows", return_value=True):
            self.assertFalse(c.artistic_observation(board, self.report, "dominant_action", self.root))
            self.assertTrue(c.artistic_observation(board, self.report, "surface_finish", self.root))
            self.assertFalse(c.structural_allows(board, {"problems": [
                "scene s1 declares motion but changes only 0.003 of pixel range. It is a held slide in the animatic."
            ]}, self.root))

    def test_cap_is_dated_production_and_charged(self):
        self.assertTrue(c.cap_reached(self.state))
        for key, value in [("mode", "dry-run"), ("run_id", "2026-09-28"), ("usage", {"reboards": 2}), ("usage", {"reboards": True})]:
            self.assertFalse(c.cap_reached(dict(self.state, **{key: value})))

    def test_protect_completion_headroom_without_wake_bypass(self):
        state = dict(self.state, usage={"reboards": 1, "storyboard_critics": 5}, escalation_ceiling={"storyboard_critics": 7})
        self.assertTrue(c.finishing_required(state))
        self.assertFalse(c.cap_reached(state))
        self.assertFalse(c.finishing_required(dict(state, usage={"reboards": 0, "storyboard_critics": 5})))
        self.assertFalse(c.finishing_required(dict(state, usage={"reboards": 1, "storyboard_critics": 2})))
        self.assertFalse(c.finishing_required(dict(state, escalation_ceiling={"storyboard_critics": 8})))
        self.assertFalse(c.finishing_required(dict(state, escalation_ceiling={})))

    def test_genuine_rejection_retained_and_bound(self):
        original = (self.root / "critic.json").read_bytes()
        self.assertTrue(self.allowed())
        self.assertEqual((self.root / "critic.json").read_bytes(), original)
        self.assertEqual(self.report["verdict"], "revise")
        self.assertFalse(self.report["phone_observations"]["dominant_action"]["pass"])

    def test_every_retained_check_is_mandatory(self):
        for key in self.assessment["retained_checks"]:
            saved = copy.deepcopy(self.assessment)
            self.assessment["retained_checks"][key]["pass"] = False
            self.save_assessment()
            self.assertFalse(self.allowed(), key)
            self.assessment = saved
        self.save_assessment()

    def test_unknown_or_omitted_findings_refused(self):
        self.assessment["defects"][0]["category"] = "source"
        self.save_assessment()
        self.assertFalse(self.allowed())
        self.assessment["defects"][0]["category"] = "motion"
        self.assessment["defects"].pop()
        self.save_assessment()
        self.assertFalse(self.allowed(), "failed phone criterion cannot disappear")

    def test_failed_retained_phone_criterion_cannot_be_relabelled(self):
        report = {"phone_observations": {"continuity": {"pass": False}}}
        assessment = copy.deepcopy(self.assessment)
        assessment["defects"] = [{"finding": f, "category": "motion"} for f in c.findings(report)]
        self.assertTrue(c.assessment_problems(assessment, report, "phone"))

    def test_unexplained_rejection_not_score_only(self):
        assessment = copy.deepcopy(self.assessment)
        assessment.update(defects=[], score_only=True)
        self.assertTrue(c.assessment_problems(assessment, {"pass": False}, "phone"))
        assessment["scope"] = "av"
        self.assertTrue(c.assessment_problems(assessment, {"pass": False}, "av"))

    def test_changed_film_claims_report_and_identity_refused(self):
        for name in ["preflight.mp4", "claims.json", "critic.json"]:
            p = self.root / name
            old = p.read_bytes()
            p.write_bytes(old + b" ")
            self.assertFalse(self.allowed(), name)
            p.write_bytes(old)
        self.assessment["reviewer_identity"] = "director"
        self.save_assessment()
        self.assertFalse(self.allowed())

    def test_selection_assessment_requires_exact_selected_film(self):
        self.report["selected_film_sha256"] = self.report.pop("reviewed_preflight_sha256")
        self.write("selection.json", self.report)
        self.assessment_path = c.template(self.root / "storyboard.json", self.root / "selection.json",
                                          self.root / "preflight.mp4", "phone", None)
        fresh = c.read(self.assessment_path)
        fresh.update({k: self.assessment[k] for k in ("reviewer_identity", "reviewed_at", "retained_checks", "defects")})
        self.assessment = fresh; self.save_assessment()
        self.assertTrue(self.allowed())
        # Self-consistent sidecar hashes still cannot substitute another film.
        (self.root / "other.mp4").write_bytes(b"a different preview")
        self.assessment.update(film_file="other.mp4", film_sha256=c.digest(self.root / "other.mp4"))
        self.save_assessment()
        self.assertFalse(self.allowed())

    def test_stale_concept_refused_but_measured_retime_allowed(self):
        self.assertFalse(c.review_allows(dict(self.board, title="different story"), self.report, self.root))
        self.assertTrue(c.review_allows(dict(self.board, runtime_s=42, captions=[]), self.report, self.root))

    def test_structural_route_only_exact_motion_errors(self):
        report = {"pass": False, "problems": ["scene s1 declares revelation but changes only 0.0030 of pixel range. It is a held slide in the animatic."]}
        self.assertTrue(c.structural_allows(self.board, report, self.root))
        for problem in ["preflight must be quarter-scale 270x480, got 100x100", "decoder failed", "animatic duration mismatch"]:
            self.assertFalse(c.structural_allows(self.board, dict(report, problems=report["problems"] + [problem]), self.root))
        self.assertFalse(c.structural_allows(self.board, {"pass": False, "problems": []}, self.root))

    def test_panel_complete_unmodified_and_aggregate_integrity(self):
        def judge():
            return {"hard_fails": ["static composition"], "attention_review": {"pass": False},
                    "bounded_release": {"schema": "dispatch_creative_assessment/1", "scope": "panel",
                        "retained_checks": {k: {"pass": True, "observed": "Exact film and source evidence checked independently."}
                                            for k in c.policy()["retained_checks"]["panel"]},
                        "defects": [{"finding": "static composition", "category": "motion"}]}}
        report = {"score": 4.2, "ship": False, "hard_fails": ["static composition"], "judges": [judge() for _ in range(3)]}
        self.write("report_card.json", report)
        self.assertTrue(c.panel_allows(self.root / "storyboard.json", self.root / "report_card.json"))
        self.assertFalse(c.read(self.root / "report_card.json")["ship"])
        report["hard_fails"].append("missing native evidence")
        self.write("report_card.json", report)
        self.assertFalse(c.panel_allows(self.root / "storyboard.json", self.root / "report_card.json"))
        report["hard_fails"].pop(); report["judges"].pop()
        self.write("report_card.json", report)
        self.assertFalse(c.panel_allows(self.root / "storyboard.json", self.root / "report_card.json"))

    def test_package_copies_exact_rejected_evidence(self):
        dest = self.repo / "package"
        c.package_assessments(self.root, dest)
        self.assertEqual(c.digest(dest / "critic.json"), c.digest(self.root / "critic.json"))
        self.assertEqual(c.digest(dest / "preflight.mp4"), c.digest(self.root / "preflight.mp4"))

    def test_release_record_relative_root_preserves_exact_evidence(self):
        report = {"score": 6.0, "ship": False, "hard_fails": []}
        expected = c.release_record(self.root, self.board, report)
        relative = Path(os.path.relpath(self.root, Path.cwd()))
        self.assertEqual(c.release_record(relative, self.board, report), expected)
        self.assertEqual(expected["assessments"][0]["report_sha256"],
                         c.digest(self.root / "critic.json"))
        (self.root / "critic.json").write_text("{}")
        with self.assertRaisesRegex(ValueError, "missing, changed"):
            c.release_record(relative, self.board, report)

    def test_low_panel_without_ship_field_records_bounded_release(self):
        from run_controller import threshold
        # Isolate panel status: no earlier deferral can supply the release label.
        self.assessment_path.unlink()
        for key in ("score", "weighted_score"):
            report = {key: threshold() - .1, "hard_fails": []}
            record = c.release_record(self.root, self.board, report)
            self.assertEqual(record["publication_mode"], "bounded_creative_release")
            self.assertIsNone(record["original_panel_ship"])
        self.assertIsNone(c.release_record(self.root, self.board, {"score": threshold(), "hard_fails": []}))

    def test_av_route_retains_audible_access_and_provider_binding(self):
        import production_quality as q
        cinema = self.root / "cinema"; cinema.mkdir()
        film = self.root / "preflight.mp4"
        review = {"pass": False, "audio_access": True, "defects": ["Static source image"],
                  "visual_observations": [{"at_s": x, "observation": "Specific visible events observed in the actual film."} for x in (1, 2)],
                  "audio_observations": [{"at_s": x, "observation": "Specific audible words heard in the actual film."} for x in (1, 2)],
                  **{k: "Specific observed detail grounded in the actual film." for k in ("pacing", "comprehension", "weakest_interval", "dimensional_action")}}
        review["bounded_release"] = {"schema": "dispatch_creative_assessment/1", "scope": "av",
            "retained_checks": {k: {"pass": True, "observed": "Actual media evidence supports this retained criterion."} for k in c.policy()["retained_checks"]["av"]},
            "defects": [{"finding": "Static source image", "category": "motion"}]}
        def save():
            response = cinema / "picture-response.json"
            response.write_text(json.dumps({"responseId": "provider-1", "candidates": [{"content": {"parts": [{"text": json.dumps(review)}]}}]}))
            receipt = {"film_sha256": c.digest(film), "role": "picture", "request_id": "request-1",
                       "response": {"file": response.name, "sha256": c.digest(response)}}
            (cinema / "picture-review.json").write_text(json.dumps(receipt))
        save()
        with patch.object(q, "probe", return_value=(1080, 1920, 5)):
            self.assertFalse(q.av_problems(cinema / "picture-review.json", film, "picture"))
            review["audio_access"] = False; save()
            self.assertTrue(q.av_problems(cinema / "picture-review.json", film, "picture"))
            review["audio_access"] = True; save()
            (cinema / "picture-response.json").write_text("{}")
            self.assertTrue(q.av_problems(cinema / "picture-review.json", film, "picture"))

    def test_native_motion_deferral_keeps_presence_and_exact_pixels(self):
        import production_quality as q
        import numpy as np
        board = dict(self.board, scenes=[{"id": "s1", "picture": {"event_id": "detail"}}])
        samples = {"s1": [{k: {"kind": k} for k in ("normal", "without_stage")} for _ in range(3)]}
        cinema = self.root / "cinema"; cinema.mkdir()
        settings = {"min_stage_pixel_share": .1, "min_stage_action_pixel_share": .01, "max_final_frame_mae": 5}
        strength = [30]
        def pixels(kind):
            return np.full((10, 10, 3), strength[0] if kind == "normal" else 0, dtype=float)
        with patch("cinema_cache.sample_frames", return_value={"s1": [0, 2, 3]}), patch.object(q, "policy", return_value=settings), \
             patch.object(q, "asset", side_effect=lambda root, item: item["kind"]), patch.object(q, "image", side_effect=pixels), \
             patch.object(q, "scheduled_frame", return_value=np.zeros((10, 10, 3))):
            deferred = []
            self.assertFalse(q.stage_sample_problems(board, cinema, samples, deferred=deferred))
            self.assertEqual(len(deferred), 1)
            self.assertEqual(deferred[0]["observed_pixel_share"], 0)
            self.assertTrue(q.stage_sample_problems(board, cinema, samples, film=Path("film"), deferred=[]))
            strength[0] = 1
            self.assertTrue(q.stage_sample_problems(board, cinema, samples, deferred=[]))


if __name__ == "__main__":
    unittest.main()
