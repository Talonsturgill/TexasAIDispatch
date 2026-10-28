"""Negative and integration tests for bounded creative release, without paid media."""
import copy
import json
import os
import tempfile
import unittest
import five_round_fixture  # noqa: F401
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

    def test_fifth_review_can_retain_only_a_genuine_surface_rejection_without_regrading(self):
        import modern_film
        self.board.update(date='2026-10-20', runtime_s=10, narration_picture={'clauses': []})
        self.state.update(run_id=self.board['date'], usage={'reboards': 1, 'storyboard_critics': 5})
        self.report['blocking_defects'] = [{'id': 'surface', 'observed': 'Small decorative marks weaken the water surface finish.'}]
        self.report['phone_observations'] = {'dominant_action': {'pass': True},
                                           'surface_finish': {'pass': False, 'observed': 'Small marks remain.'}}
        film = self.report['reviewed_preflight_sha256']
        self.report['modern_observations'] = {'film_sha256': film}
        for name in modern_film.policy()['review_criteria']:
            self.report['modern_observations'][name] = {'pass': name != 'finished_art',
                'start_s': 1, 'end_s': 2,
                'observed': 'The current visible source-bound action is readable and physically performed.'}
        self.report['narration_picture_observations'] = {'film_sha256': film, 'clauses': []}
        self.write('storyboard.json', self.board); self.write('run_state.json', self.state)
        self.write('critic.json', self.report)
        self.assessment_path = c.template(self.root/'storyboard.json', self.root/'critic.json',
                                          self.root/'preflight.mp4', 'phone', None)
        self.assessment = c.read(self.assessment_path)
        self.assessment.update(reviewer_identity='critic', reviewed_at='now')
        for row in self.assessment['retained_checks'].values():
            row.update({'pass': True, 'observed': 'Specific independently observed evidence proves this retained check.'})
        for row in self.assessment['defects']:
            row['category'] = 'surface_finish'
        self.save_assessment(); original = (self.root/'critic.json').read_bytes()
        with patch('creative_production.treatment_problems', return_value=[]), patch.object(c, 'REPO', self.repo):
            self.assertTrue(self.allowed())
            self.assertEqual([], modern_film.review_problems(self.board, self.report))
            self.state['usage']['storyboard_critics'] = 2; self.write('run_state.json', self.state)
            self.assertFalse(self.allowed())
            self.state['usage']['storyboard_critics'] = 3; self.write('run_state.json', self.state)
            self.assertTrue(self.allowed())
            self.assessment['retained_checks']['source']['pass'] = False; self.save_assessment()
            self.assertFalse(self.allowed())
        self.assertEqual(original, (self.root/'critic.json').read_bytes())
        self.assertEqual('revise', self.report['verdict'])


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

    def test_measured_runtime_family_rejects_nonruntime_and_mixed_findings(self):
        path = self.root / 'runtime-technical.json'
        findings = [{'id': 'F1', 'observed': 'The measured take exceeds the film runtime.'},
                    {'id': 'F2', 'observed': 'The dense measured clause exceeds the caption limit.'}]
        plan = {'director_identity': 'director', 'failure_family': 'measured-runtime-crowding',
                'failure_evidence': str(path)}
        for categories, accepted in [(('runtime', 'captions'), True),
                                      (('runtime', 'runtime'), True),
                                      (('captions', 'captions'), False),
                                      (('runtime', 'source'), False),
                                      (('runtime', 'motion'), False)]:
            with self.subTest(categories=categories):
                path.write_text(json.dumps({'reviewer_identity': 'critic',
                    'blocking_defects': findings, 'technical_repair': {'findings': [
                        {'finding': item, 'category': category}
                        for item, category in zip(findings, categories)]}}))
                plan['failure_evidence_sha256'] = c.digest(path)
                self.assertEqual(not c.technical_repair_problems({'run_id': '2026-10-15'}, plan), accepted)

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


class ProductionPanelSurfaceReleaseTests(unittest.TestCase):
    """The final native panel bridge runs without a render or provider call."""
    def setUp(self):
        import modern_film
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name) / "retained-edition"
        self.root.mkdir()
        self.board = {"date": "2026-10-21", "runtime_s": 10,
                      "narration_picture": {"clauses": [{"id": "c1", "start_s": 1, "end_s": 2}]}}
        self.board_path = self.root / "storyboard.json"
        self.board_path.write_text(json.dumps(self.board))
        self.state = {"mode": "production", "run_id": self.board["date"],
                      "usage": {"reboards": 1, "storyboard_critics": 5}}
        self.save_state()
        self.film = self.root / "film.mp4"
        self.film.write_bytes(b"synthetic binding fixture; never rendered or published")
        sha = c.digest(self.film)
        for name in ("mix.json", "attention-review.json"):
            (self.root / name).write_text("{}")
        cinema = self.root / "cinema"; cinema.mkdir()
        observed = "Specific independent evidence supports this exact-film observation."
        self.judges = []
        for role in ("picture", "story", "sound"):
            response = cinema / (role + "-response.json")
            response.write_text(json.dumps({"responseId": "synthetic-" + role}))
            receipt = cinema / (role + "-review.json")
            receipt.write_text(json.dumps({"response": {"file": response.name, "sha256": c.digest(response)}}))
            judge = {"film_sha256": sha, "audiovisual_role": role,
                     "audiovisual_receipt_sha256": c.digest(receipt), "hard_fails": [], "ship": True,
                     "modern_observations": {"film_sha256": sha, **{
                         key: {"pass": True, "start_s": 1, "end_s": 2, "observed": observed}
                         for key in modern_film.policy()["review_criteria"]}},
                     "narration_picture_observations": {"film_sha256": sha, "clauses": [
                         {"id": "c1", "start_s": 1, "end_s": 2, "pass": True, "observed": observed}]},
                     "attention_review": {"film_sha256": sha, "pass": True,
                         "weakest_at_s": 1, "weakest_end_s": 2, **{key: observed for key in (
                             "hook_observed", "continuity_observed", "remembered_image", "weakest_interval",
                             "audio_basis", "pacing_observed", "comprehension_observed")}},
                     "bounded_release": {"schema": "dispatch_creative_assessment/1", "scope": "panel",
                         "score_only": True, "defects": [], "retained_checks": {
                             key: {"pass": True, "observed": observed}
                             for key in c.policy()["retained_checks"]["panel"]}}}
            self.judges.append(judge)
        sound = self.judges[-1]
        sound["ship"] = False
        sound["hard_fails"] = ["The inspector silhouette has limited surface detail."]
        sound["modern_observations"]["finished_art"]["pass"] = False
        sound["bounded_release"].update(score_only=False, defects=[{
            "finding": sound["hard_fails"][0], "category": "surface_finish"}])
        # Keep real ledger/classification/film/AV bindings. Unrelated native and
        # asset gates have separate tests; no test starts a media process.
        mocker = patch.object(c, "REPO", Path(self.tmp.name) / "unrelated-source")
        mocker.start(); self.addCleanup(mocker.stop)
        for target in ("creative_production.treatment_problems", "story_art.problems",
                "story_art.charge_problems", "production_quality.preview_problems",
                "production_quality.audio_problems", "production_quality.av_problems",
                "creative_production.opening_problems", "creative_production.mix_problems",
                "documentary_review.direction.check", "documentary_review.report_problems"):
            mocker = patch(target, side_effect=lambda *args, **kwargs: [])
            mocker.start(); self.addCleanup(mocker.stop)

    def save_state(self):
        (self.root / "run_state.json").write_text(json.dumps(self.state))

    def errors(self):
        import documentary_review
        return documentary_review.publication_problems(self.board_path, self.film, self.judges)

    def archived_package(self, critics=5):
        """Real immutable Git closure; all media and receipts here are test fixtures."""
        import subprocess
        self.archive_repo = Path(self.tmp.name) / "archive-repo"
        package = self.archive_repo / "runs" / self.board["date"]
        package.parent.mkdir(parents=True)
        self.root.rename(package)
        self.root = package
        self.board_path = package / "storyboard.json"
        self.film = (package / "film.mp4").rename(package / "dispatch.mp4")
        report = package / "report_card.json"
        report.write_text(json.dumps({"judges": self.judges}))
        film_sha = c.digest(self.film)
        self.state.update(phase="publishing", terminal_state=None, release_status="publishable",
                          usage={"reboards": 1, "storyboard_critics": critics},
                          final_report={"sha256": c.digest(report), "film_sha256": film_sha},
                          deliverable={"film_sha256": film_sha},
                          events=[{"kind": "release_authorized", "result": "publishable",
                                   "report_sha256": c.digest(report)}])
        self.save_state()
        def git(*args):
            return subprocess.check_output(["git", *args], cwd=self.archive_repo,
                                           stderr=subprocess.PIPE, text=True).strip()
        git("init", "-q"); git("config", "user.name", "Archive fixture")
        git("config", "user.email", "fixture@example.invalid")
        git("add", "--all"); git("commit", "-qm", "Synthetic publishing fixture")
        self.archive_base = git("rev-parse", "HEAD")
        self.state.update(phase="shipped", terminal_state="shipped",
                          shipment={"film_sha256": film_sha, "manifest_sha256": "a" * 64})
        self.state["events"].append({"kind": "finished", "result": "shipped",
                                     "at": "2026-10-23T09:56:00Z", "shipment_sha256": "a" * 64})
        self.save_state()
        git("add", "--all"); git("commit", "-qm", "Synthetic accepted archive fixture")
        return git

    def archive_context(self):
        import archive_source_identity as archive
        return archive.validation_context(self.archive_repo, self.archive_base, self.board["date"])

    def test_shipped_surface_boundary_is_bound_to_validated_package_and_resets(self):
        import archive_source_identity as archive
        import review_limit
        self.archived_package(); original = copy.deepcopy(self.judges)
        self.assertIn("modern engagement or finish unproven: finished_art", self.errors())
        self.assertFalse(archive.retained_finishing(self.root))
        with self.archive_context():
            self.assertTrue(archive.retained_finishing(self.root))
            self.assertFalse(archive.retained_finishing(self.root.parent / "another-edition"))
            self.assertFalse(review_limit.enabled(self.state))
            self.assertFalse(review_limit.finishing(self.state))
            self.assertEqual([], self.errors())
        self.assertFalse(archive.retained_finishing(self.root))
        self.assertEqual(original, self.judges)
        self.assertFalse(self.judges[-1]["ship"])

    def test_shipped_archive_cannot_invent_prior_finishing_boundary(self):
        self.archived_package(critics=2)
        with self.archive_context():
            self.assertIn("modern engagement or finish unproven: finished_art", self.errors())

    def test_shipped_archive_keeps_independent_assessment_and_integrity_failures(self):
        import modern_film
        self.archived_package(); original = copy.deepcopy(self.judges[-1])
        cases = ["missing", "unclassified", "category"] + list(original["bounded_release"]["retained_checks"])
        with self.archive_context():
            for change in cases:
                with self.subTest(change=change):
                    self.judges[-1] = copy.deepcopy(original)
                    judge = self.judges[-1]
                    if change == "missing": del judge["bounded_release"]
                    elif change == "unclassified": judge["bounded_release"]["defects"] = []
                    elif change == "category": judge["bounded_release"]["defects"][0]["category"] = "pacing"
                    else: judge["bounded_release"]["retained_checks"][change]["pass"] = False
                    self.assertTrue(self.errors())
            self.judges[-1] = copy.deepcopy(original)
            for key in modern_film.policy()["review_criteria"]:
                if key == "finished_art":
                    continue
                with self.subTest(observation=key):
                    self.judges[-1] = copy.deepcopy(original)
                    self.judges[-1]["modern_observations"][key]["pass"] = False
                    self.assertTrue(self.errors())

    def test_shipped_archive_boundary_refuses_changed_state_and_cleans_on_error(self):
        import archive_source_identity as archive
        self.archived_package()
        with self.assertRaisesRegex(RuntimeError, "test publication failure"):
            with self.archive_context():
                self.state["usage"]["storyboard_critics"] = 6
                self.save_state()
                self.assertFalse(archive.retained_finishing(self.root))
                self.assertTrue(self.errors())
                raise RuntimeError("test publication failure")
        self.assertFalse(archive.retained_finishing(self.root))
        with self.assertRaises(ValueError):
            with self.archive_context():
                self.fail("changed committed evidence must not be admitted")

    def test_original_surface_rejection_reaches_publication_without_regrading(self):
        original = copy.deepcopy(self.judges)
        self.assertEqual([], self.errors())
        self.assertEqual(original, self.judges)
        self.assertFalse(self.judges[-1]["ship"])

    def test_assessment_category_film_and_receipt_remain_required(self):
        original = copy.deepcopy(self.judges[-1])
        for change in ("missing", "unclassified", "scope", "source", "category", "film", "receipt"):
            with self.subTest(change=change):
                self.judges[-1] = copy.deepcopy(original)
                judge = self.judges[-1]; assessment = judge["bounded_release"]
                if change == "missing": del judge["bounded_release"]
                elif change == "unclassified": assessment["defects"] = []
                elif change == "scope": assessment["scope"] = "phone"
                elif change == "source": assessment["retained_checks"]["source"]["pass"] = False
                elif change == "category": assessment["defects"][0]["category"] = "pacing"
                elif change == "film": judge["modern_observations"]["film_sha256"] = "wrong-film"
                else: judge["audiovisual_receipt_sha256"] = "wrong-receipt"
                self.assertTrue(self.errors())

    def test_pre_boundary_and_wrong_edition_cannot_defer_surface(self):
        for usage, run_id in ((2, "2026-10-21"), (5, "2026-10-22")):
            with self.subTest(usage=usage, run_id=run_id):
                self.state.update(run_id=run_id, usage={"reboards": 1, "storyboard_critics": usage})
                self.save_state()
                self.assertIn("modern engagement or finish unproven: finished_art", self.errors())

    def test_missing_or_malformed_surface_observation_stays_blocking(self):
        original = copy.deepcopy(self.judges[-1]["modern_observations"])
        for change in ("missing", "empty", "untimed", "out_of_film"):
            with self.subTest(change=change):
                self.judges[-1]["modern_observations"] = copy.deepcopy(original)
                rows = self.judges[-1]["modern_observations"]
                if change == "missing": del rows["finished_art"]
                elif change == "empty": rows["finished_art"]["observed"] = ""
                elif change == "untimed": del rows["finished_art"]["start_s"]
                else: rows["finished_art"]["end_s"] = 20
                self.assertIn("modern engagement or finish unproven: finished_art", self.errors())

    def test_other_observations_and_audio_remain_blocking(self):
        import modern_film
        original = copy.deepcopy(self.judges[-1])
        for key in modern_film.policy()["review_criteria"]:
            if key == "finished_art": continue
            with self.subTest(criterion=key):
                self.judges[-1] = copy.deepcopy(original)
                self.judges[-1]["modern_observations"][key]["pass"] = False
                self.assertIn("modern engagement or finish unproven: " + key, self.errors())
        self.judges[-1] = copy.deepcopy(original)
        self.judges[-1]["narration_picture_observations"]["clauses"][0]["pass"] = False
        self.assertIn("narration-picture relationship unproven: c1", self.errors())
        self.judges[-1] = original
        with patch("production_quality.av_problems", return_value=["reviewer lacked audible-media access"]):
            self.assertIn("reviewer lacked audible-media access", self.errors())


class ExactEffectNormalizationTests(unittest.TestCase):
    def setUp(self):
        self.report = {"pass": False, "audio_access": True, "defects": [
            {"time": "00:20.0", "subject": "Approval gate illustration",
             "effect": "Generic block shapes and labels replace visible physical context, diminishing visual craft."},
            {"time": "00:40.6", "subject": "Credit sign-off card",
             "effect": "The closing attribution display holds for under five full seconds before cutting off."}]}
        self.assessment = {"schema": "dispatch_creative_assessment/1", "scope": "av",
            "retained_checks": {key: {"pass": True, "observed": "Exact original reviewer observation preserves this integrity check."}
                                for key in c.policy()["retained_checks"]["av"]},
            "defects": [{"finding": item["effect"], "category": category}
                        for item, category in zip(self.report["defects"], ["style", "ending_artistry"])]}

    def test_real_response_shape_resolves_losslessly_without_mutation(self):
        original_report, original_assessment = copy.deepcopy(self.report), copy.deepcopy(self.assessment)
        derived = c.normalize_assessment_findings(self.assessment, self.report)
        self.assertFalse(c.assessment_problems(self.assessment, self.report, "av"))
        self.assertEqual(self.report, original_report)
        self.assertEqual(self.assessment, original_assessment)
        self.assertFalse(self.report["pass"])
        self.assertEqual(derived["finding_normalization"]["report_payload_sha256"], c.payload_digest(self.report))
        for index, row in enumerate(derived["defects"]):
            self.assertEqual(row["finding"], self.report["defects"][index])
            self.assertEqual(row["original_finding"], self.assessment["defects"][index]["finding"])
            self.assertEqual(row["category"], self.assessment["defects"][index]["category"])

    def test_ambiguous_effect_and_nonexact_strings_fail(self):
        ambiguous = copy.deepcopy(self.report)
        ambiguous["defects"].append({**ambiguous["defects"][0], "time": "00:21.0"})
        self.assertTrue(c.assessment_problems(self.assessment, ambiguous, "av"))
        for text in ["unknown finding", " " + self.report["defects"][0]["effect"],
                     self.report["defects"][0]["effect"].lower()]:
            changed = copy.deepcopy(self.assessment); changed["defects"][0]["finding"] = text
            self.assertTrue(c.assessment_problems(changed, self.report, "av"))

    def test_duplicate_missing_extra_and_changed_objects_fail(self):
        candidates = []
        duplicate = copy.deepcopy(self.assessment); duplicate["defects"].append(copy.deepcopy(duplicate["defects"][0])); candidates.append(duplicate)
        missing = copy.deepcopy(self.assessment); missing["defects"].pop(); candidates.append(missing)
        extra = copy.deepcopy(self.assessment); extra["defects"].append({"finding": "extra", "category": "style"}); candidates.append(extra)
        changed = copy.deepcopy(self.assessment); changed["defects"][0]["finding"] = {**self.report["defects"][0], "time": "00:22.0"}; candidates.append(changed)
        mixed_duplicate = copy.deepcopy(self.assessment); mixed_duplicate["defects"][1]["finding"] = copy.deepcopy(self.report["defects"][0]); candidates.append(mixed_duplicate)
        for value in candidates:
            self.assertTrue(c.assessment_problems(value, self.report, "av"))

    def test_normalization_never_waives_retained_checks_or_categories(self):
        for key in self.assessment["retained_checks"]:
            changed = copy.deepcopy(self.assessment); changed["retained_checks"][key]["pass"] = False
            self.assertTrue(c.assessment_problems(changed, self.report, "av"))
        for category in ["runtime", "captions", "source", "unclassified"]:
            changed = copy.deepcopy(self.assessment); changed["defects"][1]["category"] = category
            self.assertTrue(c.assessment_problems(changed, self.report, "av"))


class SoleProviderFindingsTests(unittest.TestCase):
    def setUp(self):
        import independent_review as r
        self.r = r
        self.value = {'score': 6.9, 'ship': False, 'hard_fails': [],
                      'attention_review': {'pass': False},
                      'bounded_release': {'schema': 'dispatch_creative_assessment/1', 'scope': 'panel',
                          'retained_checks': {key: {'pass': True, 'observed': 'Specific independent retained integrity observation.'}
                                              for key in c.policy()['retained_checks']['panel']},
                          'defects': [{'finding': 'Static approval placards weaken physical storytelling.', 'category': 'style'},
                                     {'finding': 'The closing composition feels abrupt.', 'category': 'ending_artistry'}]}}

    def report(self, value=None, role='picture'):
        r = self.r
        resource = 'storyboard_critics' if role == 'phone' else 'scorer_calls'
        reservation = {'kind': 'reserved', 'resources': {resource: 1}}
        failure = {'schema': 'dispatch_review_transport_failure/1', 'role': role,
                   'actor': 'independent-fixture', 'observed_at': 'now', 'error': 'server_overloaded',
                   'reservation': reservation, 'reservation_sha256': r.fingerprint(reservation),
                   'reservation_event_index': 0}
        bindings = {'film_sha256': 'film', 'av_receipt_sha256': 'receipt'}
        if role == 'phone':
            import quality_contract as q
            bindings.update(concept_sha256='concept', renderer_sha256='renderer',
                            quality_contract_sha256=q.fingerprint(), story_sha256='story',
                            policy_sha256='policy', claims_sha256='claims', actions={})
        proof = {'schema': 'dispatch_independent_provider/1', 'role': role,
                 'model': r.policy()['av_model'], 'request_id': 'fixture-request', 'reviewed_at': 'now',
                 'bindings': bindings,
                 'prompt': 'independent fixed rubric',
                 'input': {'exact': 'fixture evidence', 'board': self.phone_board() if role == 'phone' else {}},
                 'host_failure': failure}
        proof['prompt_sha256'] = __import__('hashlib').sha256(proof['prompt'].encode()).hexdigest()
        proof['input_sha256'] = r.fingerprint(proof['input'])
        value = copy.deepcopy(self.value if value is None else value)
        value['review_context_sha256'] = r.fingerprint(r.review_context(proof))
        raw = {'responseId': 'fixture-response', 'candidates': [{'finishReason': 'STOP',
                'content': {'parts': [{'text': json.dumps(value)}]}}]}
        proof.update(response=raw, response_sha256=r.fingerprint(raw))
        result = r.project(raw, proof['bindings'], role, proof['model'], proof['reviewed_at'])
        result['provider_evidence'] = proof
        return result

    def phone_board(self):
        return {'date': '2026-10-15', 'runtime_s': 5, 'narration_picture': {'clauses': [
            {'id': 'n1', 'start_s': 1, 'end_s': 2}]}}

    def phone_report(self, **changes):
        import quality_contract as q, modern_film as m
        observation = {'pass': True, 'start_s': 1, 'end_s': 2,
                       'observed': 'The water reaches the pole and the station indicator visibly lights.'}
        value = {'verdict': 'pass', 'blocking_defects': [],
                 'story_review': {'verdict': 'pass', 'blocking_defects': []},
                 'action_reviews': [],
                 'phone_observations': {key: copy.deepcopy(observation) for key in q.policy()['criteria'] if key != 'sound'},
                 'modern_observations': {key: copy.deepcopy(observation) for key in m.policy()['review_criteria']},
                 'narration_picture_observations': {'clauses': [{'id': 'n1', **observation}]},
                 'bounded_release': {'schema': 'dispatch_creative_assessment/1',
                                     'scope': 'phone', 'defects': [],
                                     'retained_checks': {key: {'pass': True, 'observed': 'Independent retained integrity observation.'}
                                                         for key in c.policy()['retained_checks']['phone']}}}
        value.update(changes)
        return self.report(value, 'phone')

    def test_verified_passing_phone_empty_classification_is_not_rejection(self):
        report = self.phone_report()
        before = copy.deepcopy(report)
        self.assertEqual(self.r.evidence_problems(report), [])
        self.assertEqual(c.findings(report), [])
        self.assertEqual(report, before)
        # Empty phone findings never admit a bounded artistic release.
        self.assertTrue(c.assessment_problems(report['bounded_release'], report, 'phone'))

        import autonomous_completion as capacity
        state = {'mode': 'production', 'run_id': '2026-10-15', 'usage': {'reboards': 3}}
        text = json.dumps(report)
        plan = {'director_identity': 'director', 'completion_reason': 'finish-current',
                'failure_evidence_sha256': capacity.sha(text), 'resources': {},
                'failed_film_sha256': report['reviewed_preflight_sha256']}
        self.assertEqual(capacity.mandatory_reason(state, plan, text), 'finish-current')
        self.assertIsNone(capacity.mandatory_reason(state, {**plan, 'failed_film_sha256': 'other-film'}, text))
        plan.pop('completion_reason')
        self.assertIsNone(capacity.mandatory_reason(state, plan, text))

    def test_empty_phone_requires_original_verified_pass_and_matching_scope(self):
        missing = self.phone_report(); missing.pop('provider_evidence')
        changed = self.phone_report(); changed['provider_evidence']['response']['responseId'] = 'edited'
        projection = self.phone_report(); projection['notes'] = 'not in original response'
        candidates = [missing, changed, projection, self.phone_report(verdict='revise')]
        for field, value in [('scope', 'panel'), ('schema', 'unknown'),
                             ('defects', [{'finding': 'retained finding', 'category': 'style'}])]:
            assessment = copy.deepcopy(self.phone_report()['bounded_release'])
            assessment[field] = value
            candidates.append(self.phone_report(bounded_release=assessment))
        for report in candidates:
            with self.assertRaises(ValueError): c.findings(report)

    def test_phone_explicit_failure_precedes_empty_classification(self):
        for changes, expected in [({'blocking_defects': ['source gap']}, ['source gap']),
                                  ({'story_review': {'blocking_defects': ['story gap']}}, ['story gap'])]:
            self.assertEqual(c.findings(self.phone_report(**changes)), expected)
        report = self.phone_report(phone_observations={'dominant_action': {
            'pass': False, 'observed': 'Required contact never occurs.'}})
        self.assertEqual(c.findings(report)[0]['phone_observation'], 'dominant_action')

    def test_empty_phone_refuses_missing_coverage_and_nested_failures(self):
        candidates = [self.phone_report(phone_observations={}),
                      self.phone_report(story_review={'verdict': 'revise', 'blocking_defects': []}),
                      self.phone_report(action_reviews=[{'action_id': 'water', 'verdict': 'revise', 'blocking_defects': []}]),
                      self.phone_report(action_reviews=[{'action_id': 'water', 'verdict': 'pass', 'hard_fails': ['contact absent']}]),
                      self.phone_report(attention_review={'pass': False}),
                      self.phone_report(narration_picture_observations={}),
                      self.phone_report(modern_observations={})]
        modern = copy.deepcopy(self.phone_report()['modern_observations'])
        modern['performed_turn']['pass'] = False
        candidates.append(self.phone_report(modern_observations=modern))
        observations = copy.deepcopy(self.phone_report()['phone_observations'])
        next(iter(observations.values()))['start_s'] = float('nan')
        candidates.append(self.phone_report(phone_observations=observations))
        for report in candidates:
            with self.assertRaises(ValueError): c.findings(report)

    def test_verified_only_collection_preserves_original_rejection_and_values(self):
        report = self.report()
        before = copy.deepcopy(report)
        self.assertEqual(self.r.evidence_problems(report), [])
        self.assertEqual(c.findings(report), [row['finding'] for row in self.value['bounded_release']['defects']])
        self.assertFalse(c.assessment_problems(report['bounded_release'], report, 'panel'))
        self.assertEqual(report, before)
        self.assertEqual(report['score'], 6.9)
        self.assertFalse(report['ship']); self.assertFalse(report['attention_review']['pass'])
        sound = copy.deepcopy(self.value); sound.update(score=7.2, ship=True)
        sound['attention_review']['pass'] = True
        sound['bounded_release']['defects'].pop(0)
        self.assertEqual(c.findings(self.report(sound, 'sound')), [sound['bounded_release']['defects'][0]['finding']])

    def test_unverified_host_raw_projection_scope_and_role_reject(self):
        changed = self.report(); changed.pop('provider_evidence')
        candidates = [changed]
        changed = self.report(); changed['provider_evidence']['response']['responseId'] = 'edited'; candidates.append(changed)
        changed = self.report(); changed['score'] = 9; candidates.append(changed)
        changed = copy.deepcopy(self.value); changed['bounded_release']['scope'] = 'av'; candidates.append(self.report(changed))
        changed = copy.deepcopy(self.value); changed['bounded_release']['schema'] = 'unknown'; candidates.append(self.report(changed))
        changed = self.report(); changed['provider_evidence']['role'] = 'phone'; candidates.append(changed)
        for report in candidates:
            with self.assertRaises(ValueError): c.findings(report)

    def test_standard_findings_take_precedence_and_never_union(self):
        for key in ('hard_fails', 'defects', 'blocking_defects'):
            value = copy.deepcopy(self.value); value[key] = ['source gap']
            report = self.report(value)
            self.assertEqual(c.findings(report), ['source gap'])
            self.assertTrue(c.assessment_problems(report['bounded_release'], report, 'panel'))
        value = copy.deepcopy(self.value); value['phone_observations'] = {'dominant_action': {'pass': False, 'observed': 'Action not visible.'}}
        report = self.report(value)
        self.assertEqual(len(c.findings(report)), 1)
        self.assertIn('phone_observation', c.findings(report)[0])
        self.assertTrue(c.assessment_problems(report['bounded_release'], report, 'panel'))

    def test_empty_malformed_duplicate_and_retained_failure_reject(self):
        for rows in ([], {}, [None], [{'finding': '   '}], [{'finding': 12}],
                     [self.value['bounded_release']['defects'][0]] * 2):
            value = copy.deepcopy(self.value); value['bounded_release']['defects'] = rows
            with self.assertRaises(ValueError): c.findings(self.report(value))
        for key in self.value['bounded_release']['retained_checks']:
            value = copy.deepcopy(self.value); value['bounded_release']['retained_checks'][key]['pass'] = False
            report = self.report(value)
            self.assertTrue(c.assessment_problems(report['bounded_release'], report, 'panel'))
        value = copy.deepcopy(self.value); value['bounded_release']['defects'][0]['category'] = 'runtime'
        report = self.report(value)
        self.assertTrue(c.assessment_problems(report['bounded_release'], report, 'panel'))

    def test_future_scorer_prompt_requests_complete_top_level_collection(self):
        self.assertIn('top-level defects list covering every bounded_release.defects.finding verbatim',
                      self.r.prompt('picture', {}))
        self.assertNotIn('top-level defects list', self.r.prompt('code', {}))


class LiveCreativePolicy(unittest.TestCase):
    def test_live_policy_records_the_owner_lift(self):
        live = json.loads((Path(__file__).resolve().parents[1] / 'config/creative_release.json').read_text())
        self.assertEqual(6, live['max_creative_repair_rounds'])


if __name__ == "__main__":
    unittest.main()
