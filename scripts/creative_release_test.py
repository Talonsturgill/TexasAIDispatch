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
        reservation = {'kind': 'reserved', 'resources': {'scorer_calls': 1}}
        failure = {'schema': 'dispatch_review_transport_failure/1', 'role': role,
                   'actor': 'independent-fixture', 'observed_at': 'now', 'error': 'server_overloaded',
                   'reservation': reservation, 'reservation_sha256': r.fingerprint(reservation),
                   'reservation_event_index': 0}
        proof = {'schema': 'dispatch_independent_provider/1', 'role': role,
                 'model': r.policy()['av_model'], 'request_id': 'fixture-request', 'reviewed_at': 'now',
                 'bindings': {'film_sha256': 'film', 'av_receipt_sha256': 'receipt'},
                 'prompt': 'independent fixed rubric', 'input': {'exact': 'fixture evidence'}, 'host_failure': failure}
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


if __name__ == "__main__":
    unittest.main()
