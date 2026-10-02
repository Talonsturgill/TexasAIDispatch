"""Narrow excerpt expansion never buys another film, review result or budget."""
import copy
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import review_context as r
import production_lifecycle as life
import run_controller as c
import repair_guard as budget
import creative_release
import audiovisual_review


class ContextTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name); self.state = self.root / "run_state.json"
        c.initialise(self.state, "2026-10-01", "production")
        self.dep = {"renderer_sha256": "renderer", "engine_sha256": "engine", "environment": "env"}
        self.dep_patch = patch.object(r, "dependencies", side_effect=lambda p: copy.deepcopy(self.dep))
        self.dep_patch.start(); self.addCleanup(self.dep_patch.stop)
        # Source/phone gates have separate complete regression suites. This fixture
        # isolates the new identity, mutation and ledger boundary.
        self.phone_patch = patch("critic_gate.film_review_problems", return_value=[])
        self.phone_patch.start(); self.addCleanup(self.phone_patch.stop)
        self.board = {"date": "2026-10-01", "cinematic_template": "pod-delivery-v1", "runtime_s": 40,
                      "cinema": {"hero_scene_id": "s8", "hero_passage_end_scene_id": "s8"},
                      "captions": [{"text": "The check retains the pod.", "start": 1, "end": 2}],
                      "scenes": [{"id": "s" + str(i), "vo": "Source supported words", "picture": {"id": "p" + str(i)}} for i in range(1, 9)]}
        self.board_path = self.write("storyboard.json", self.board)
        self.before = self.write("before.json", self.board)
        for name in ("vo_script.txt", "mix.wav", "captions.json", "mix.json"):
            (self.root / name).write_text("retained exact input")
        self.claims = self.write("claims.json", {"claim": "exact fetched evidence"})
        (self.root / "preflight.mp4").write_bytes(b"exact current full film")
        self.write("preflight.json", {"pass": True, "board_sha256": c.digest(self.before), "film_sha256": c.digest(self.root / "preflight.mp4"), "renderer_sha256": "renderer"})
        self.write("storyboard_critic.json", {"reviewer_identity": "independent-context-critic", "story_review": {"claims_sha256": c.digest(self.claims)}})
        (self.root / "preflight.mp4").write_bytes(b"exact current full film")
        sources = self.root / "sources"; sources.mkdir(); (sources / "source.txt").write_text("retained source")
        self.hero = self.root / "retained-hero.mp4"; self.hero.write_bytes(b"rejected exact native excerpt")
        self.raw = self.write("raw.json", {"responseId": "genuine-provider-response", "candidates": [{"content": {"parts": [{"text": json.dumps({"pass": False, "audio_access": True, "defects": ["Caption needs the preceding conditional target context."]})}]}}]})
        self.receipt = self.write("receipt.json", {"schema": "dispatch_audiovisual_review/1", "role": "hero", "review_scope": "passage", "film_sha256": c.digest(self.hero), "request_id": "paid-request", "model": "provider-model", "response": {"file": self.raw.name, "sha256": c.digest(self.raw)}})
        self.proof = self.write("proof.json", {"board_sha256": c.digest(self.before), "hero": {"sha256": c.digest(self.hero)}, "mix_sha256": c.digest(self.root / "mix.wav"), "engine_sha256": "engine"})
        self.diagnosis = self.write("diagnosis.json", {"schema": "dispatch-hero-context-diagnosis/1", "reviewer_identity": "independent-context-critic", "reviewed_at": "2026-10-01T12:00:00Z",
            "source_basis": "The exact fetched source describes a conditional unsuitable target and retention.",
            "context_explanation": "The excerpt begins after the target condition, so the existing caption refers to a check the viewer has not seen.",
            "bindings": {"board_sha256": c.digest(self.before), "phone_report_sha256": c.digest(self.root / "storyboard_critic.json"), "phone_film_sha256": c.digest(self.root / "preflight.mp4"), "failure_receipt_sha256": c.digest(self.receipt), "failure_response_sha256": c.digest(self.raw), "failed_hero_sha256": c.digest(self.hero)},
            "old_excerpt": r.window(self.board), "proposed_excerpt": {"hero_scene_id": "s5", "hero_passage_end_scene_id": "s8"},
            "original_defect_assessments": [{"finding": "Caption needs the preceding conditional target context.", "category": "excerpt-context"}],
            "renderer_audit": {"template": "pod-delivery-v1", "renderer_sha256": "renderer", "engine_sha256": "engine", "non_rendered_fields": ["cinema." + k for k in r.FIELDS], "observed": "The exact renderer forwards scenes and captions only; neither hero window field reaches the picture renderer."}})
        self.plan = {"repair_scope": r.SCOPE, "director_identity": "director", "mechanism_id": "retained-pod", "failure_family": "source-framing",
                     "root_cause": "The isolated closing passage omits the previously observed target condition.",
                     "repair": "Expand the native passage to include the condition and required source limit.",
                     "mechanism_change": "The reviewed native window expands without changing any authored film input.",
                     "expected_visible_result": "The reviewer sees the unchanged target condition before the closing caption.",
                     "failure_evidence": str(self.receipt), "failure_evidence_sha256": c.digest(self.receipt),
                     "diagnosis": self.ref(self.diagnosis), "failure_response": self.ref(self.raw), "failed_hero": self.ref(self.hero), "failed_proof": self.ref(self.proof),
                     "changed_inputs": [{"path": str(self.board_path), "before_path": str(self.before), "before_sha256": c.digest(self.before)}],
                     "resources": {"preflight_renders": 1, "audiovisual_reviews": 1}}
        self.plan_path = self.write("plan.json", self.plan)

    def write(self, name, value):
        p = self.root / name; p.write_text(json.dumps(value)); return p

    def ref(self, path):
        return {"path": str(path), "sha256": c.digest(path)}

    def begin(self):
        self.assertFalse(r.plan_problems(self.state, self.plan))
        self.assertTrue(life.begin_repair(self.state, self.plan_path)[0])
        self.assertTrue(c.reserve(self.state, {"reboards": 1})[0])

    def expand(self):
        board = copy.deepcopy(self.board); board["cinema"]["hero_scene_id"] = "s5"
        self.write("storyboard.json", board)
        self.plan["changed_inputs"][0]["after_sha256"] = c.digest(self.board_path)
        self.write("plan.json", self.plan)

    def test_charged_repair_preserves_envelope_and_all_prior_events(self):
        initial = c.read_state(self.state)
        self.begin(); self.expand()
        self.assertTrue(life.authorize_repair(self.state, self.plan_path)[0])
        state = c.read_state(self.state)
        self.assertEqual(state["resource_envelope"], initial["resource_envelope"])
        self.assertEqual(state["events"][:len(initial["events"])], initial["events"])
        self.assertEqual(state["usage"]["reboards"], 1)
        self.assertEqual(state["usage"]["storyboard_critics"], 0)
        self.assertEqual(creative_release.creative_rounds(state), 0)
        self.assertFalse(life.allowance_problems(state))
        self.assertEqual(r.phone_baseline(self.board_path), self.before)
        self.assertFalse(life.begin_repair(self.state, self.plan_path)[0])
        self.assertEqual(c.read_state(self.state)["usage"], state["usage"])

    def test_denied_authored_board_changes(self):
        for field in ("scene", "script", "caption", "template", "picture"):
            with self.subTest(field=field):
                changed = copy.deepcopy(self.board); changed["cinema"]["hero_scene_id"] = "s5"
                if field == "scene": changed["scenes"][0]["id"] = "different"
                if field == "script": changed["scenes"][0]["vo"] = "New script"
                if field == "caption": changed["captions"][0]["text"] = "New caption"
                if field == "template": changed["cinematic_template"] = "arbitrary-renderer"
                if field == "picture": changed["scenes"][0]["picture"]["id"] = "new-art"
                self.assertTrue(r.expansion_problems(self.board, changed, {"hero_scene_id": "s5", "hero_passage_end_scene_id": "s8"}))

    def test_denied_frozen_source_script_mix_renderer_mutation(self):
        frozen = r.frozen_inputs(self.state, self.plan)
        for relative in ("vo_script.txt", "mix.wav", "mix.json", "captions.json", "sources/source.txt", "preflight.mp4"):
            p = self.root / relative; original = p.read_bytes(); p.write_bytes(original + b" changed")
            self.assertFalse(r.unchanged(self.state, frozen), relative); p.write_bytes(original)
        self.dep["renderer_sha256"] = "changed"
        self.assertFalse(r.unchanged(self.state, frozen))
        self.dep["renderer_sha256"] = "renderer"
        (self.root / "sources/new.txt").write_text("new evidence")
        self.assertFalse(r.unchanged(self.state, frozen))

    def test_missing_diagnosis_and_wrong_body_rejection_fail_before_charge(self):
        original = self.plan["diagnosis"]
        self.plan["diagnosis"] = {"path": str(self.root / "missing.json"), "sha256": "missing"}
        self.write("plan.json", self.plan)
        self.assertFalse(life.begin_repair(self.state, self.plan_path)[0])
        self.assertEqual(c.read_state(self.state)["usage"]["reboards"], 0)
        self.plan["diagnosis"] = original
        raw = r.read(self.raw); raw["responseId"] = "changed-body"; self.write("raw.json", raw)
        self.assertTrue(r.plan_problems(self.state, self.plan))

    def test_no_shrink_relocation_or_more_than_four_scene_expansion(self):
        for first, last in (("s8", "s8"), ("s1", "s8"), ("s5", "s7"), ("s7", "s6")):
            proposed = {"hero_scene_id": first, "hero_passage_end_scene_id": last}
            changed = copy.deepcopy(self.board); changed["cinema"].update(proposed)
            self.assertTrue(r.expansion_problems(self.board, changed, proposed))

    def test_authorize_refuses_unregistered_edit_and_more_than_one_reboard(self):
        self.begin(); self.expand()
        board = r.read(self.board_path); board["scenes"][0]["vo"] = "different"
        self.write("storyboard.json", board); self.plan["changed_inputs"][0]["after_sha256"] = c.digest(self.board_path); self.write("plan.json", self.plan)
        self.assertFalse(life.authorize_repair(self.state, self.plan_path)[0])
        self.expand(); self.assertTrue(c.reserve(self.state, {"reboards": 1})[0])
        self.assertFalse(life.authorize_repair(self.state, self.plan_path)[0])

    def test_budget_rejected_hero_cannot_claim_finish_current(self):
        state = c.read_state(self.state); state["usage"].update(storyboard_critics=7, reboards=1)
        before = copy.deepcopy(state)
        blocked = budget.production_budget_precheck(state, phone_complete=True, hero_rejected=True)
        self.assertFalse(blocked["feasible"]); self.assertEqual(blocked["path"], "hero-repair-required")
        ready = budget.production_budget_precheck(state, phone_complete=True, hero_rejected=True, context_ready=True)
        self.assertTrue(ready["feasible"]); self.assertEqual(ready["path"], "review-context-repair")
        self.assertEqual(ready["resources"]["reboards"]["required"], 1)
        self.assertEqual(ready["resources"]["storyboard_critics"]["required"], 0)
        self.assertEqual(ready["resources"]["audiovisual_reviews"]["required"], 8)
        self.assertEqual(state, before)

    def test_context_budget_protects_all_three_provider_scorer_recoveries(self):
        state = c.read_state(self.state)
        state["usage"].update(storyboard_critics=7, reboards=1)
        for route in ("host", "provider"):
            for remaining in (7, 8):
                with self.subTest(route=route, remaining=remaining):
                    state["usage"]["audiovisual_reviews"] = state["resource_envelope"]["audiovisual_reviews"] - remaining
                    before = copy.deepcopy(state)
                    result = budget.production_budget_precheck(state, review_route=route, phone_complete=True,
                                                              hero_rejected=True, context_ready=True)
                    self.assertEqual(result["feasible"], remaining == 8)
                    self.assertEqual(result["deficits"], {"audiovisual_reviews": 1} if remaining == 7 else {})
                    self.assertEqual(result["resources"]["audiovisual_reviews"]["required"], 8)
                    self.assertEqual(result["resources"]["tts_calls"]["required"], 0)
                    self.assertIn("exact frozen voice/mix reuse", result["scope"])
                    self.assertEqual(state, before)

    def test_structural_hero_budget_keeps_full_review_path_and_frozen_ledger(self):
        state = c.read_state(self.state)
        before = copy.deepcopy(state)
        result = budget.production_budget_precheck(state, hero_rejected=True, structural_ready=True)
        self.assertTrue(result["feasible"])
        self.assertEqual(result["path"], "structural-hero-repair")
        self.assertEqual(result["resources"]["storyboard_critics"]["required"], 3)
        self.assertEqual(result["resources"]["audiovisual_reviews"]["required"], 11)
        self.assertEqual(state, before)
        state["usage"]["storyboard_critics"] = state["resource_envelope"]["storyboard_critics"] - 2
        self.assertFalse(budget.production_budget_precheck(state, hero_rejected=True, structural_ready=True)["feasible"])
        state["usage"].update(reboards=3, storyboard_critics=0)
        result = budget.production_budget_precheck(state, hero_rejected=True, structural_ready=True)
        self.assertFalse(result["feasible"])
        self.assertEqual(result["path"], "hero-repair-required")

    def test_structural_budget_plan_rejects_missing_or_changed_evidence(self):
        receipt = self.root / "missing-hero-review.json"
        self.assertFalse(budget.structural_hero_plan_ready(self.state, {}, receipt))
        plan = {"repair_scope": "standard", "failure_evidence": str(receipt), "failure_evidence_sha256": "changed"}
        self.assertFalse(budget.structural_hero_plan_ready(self.state, plan, receipt))

    def test_same_byte_hero_rejection_remains_cached_without_paid_call(self):
        cache = self.root / "cinema/review-cache/old-tool-key"; cache.mkdir(parents=True)
        (cache / self.raw.name).write_bytes(self.raw.read_bytes())
        (cache / "receipt.json").write_bytes(self.receipt.read_bytes())
        out = self.root / "new-review.json"
        with patch.object(audiovisual_review, "av_problems", return_value=["retained rejection"]), patch.object(audiovisual_review, "reserve") as reserve:
            with self.assertRaisesRegex(ValueError, "same film and lens already reviewed"):
                audiovisual_review.cached_review(self.hero, "hero", self.state, out)
            reserve.assert_not_called()
        self.assertEqual(r.read(out)["film_sha256"], c.digest(self.hero))
        self.assertEqual((cache / self.raw.name).read_bytes(), self.raw.read_bytes())

    def test_new_passing_phone_report_cannot_bypass_frozen_context(self):
        self.begin(); self.expand()
        self.assertTrue(life.authorize_repair(self.state, self.plan_path)[0])
        self.assertFalse(r.phone_problems(self.board_path))
        report = r.read(self.root / "storyboard_critic.json")
        report["verdict"] = "pass"; report["concept_sha256"] = "newly rebound report"
        self.write("storyboard_critic.json", report)
        # The normal film gate is mocked green. Frozen scope must still refuse.
        self.assertTrue(r.phone_problems(self.board_path))
        with self.assertRaisesRegex(ValueError, "frozen"):
            r.required_baseline(self.board_path)

    def test_diagnosis_cannot_introduce_an_unreserved_reviewer(self):
        diagnosis = r.read(self.diagnosis)
        diagnosis["reviewer_identity"] = "arbitrary-new-reviewer"
        self.write("diagnosis.json", diagnosis); self.plan["diagnosis"] = self.ref(self.diagnosis)
        self.assertTrue(r.plan_problems(self.state, self.plan))

    def test_literal_font_bytes_and_asset_inventory_are_bound(self):
        import render_manifest
        public = self.root / "public"; (public / "fonts").mkdir(parents=True)
        font = public / "fonts/body.woff2"; font.write_bytes(b"original font")
        with patch.object(render_manifest, "PUBLIC", public), patch.object(render_manifest, "engine_sha256", return_value="engine"), patch.object(render_manifest, "generated_media_sha256", return_value="media"), patch("critic_gate.renderer_digest", return_value="renderer"), patch("cinema_cache.picture_recipe", return_value={"environment": "env", "engine": "engine", "media": "media"}):
            # Invoke the real dependency collector outside the fixture stub.
            self.dep_patch.stop()
            try:
                before = r.dependencies(self.board_path)
                font.write_bytes(b"changed font")
                self.assertNotEqual(r.dependencies(self.board_path), before)
                font.write_bytes(b"original font"); (public / "new.png").write_bytes(b"new asset")
                self.assertNotEqual(r.dependencies(self.board_path), before)
            finally:
                self.dep_patch.start()

    def test_colocated_baseline_does_not_recurse_in_structural_consumer(self):
        import preflight_animatic
        self.begin(); self.expand()
        self.assertTrue(life.authorize_repair(self.state, self.plan_path)[0])
        self.assertIsNone(r.required_baseline(self.before))
        with patch("critic_gate.renderer_digest", return_value="renderer"):
            self.assertFalse(r.preflight_problems(r.read(self.root / "preflight.json"), self.board_path, self.root / "preflight.mp4"))
            self.assertTrue(preflight_animatic.report_problems(r.read(self.root / "preflight.json"), self.board_path, self.root / "preflight.mp4"))

    def test_original_inspector_bytes_and_opening_bindings_are_preserved(self):
        import preflight_animatic
        expected = "9af51468c89b757af8a40693805ebe2a11c75c825902e6d02fa3b6692f33f386"
        self.assertEqual(c.digest(Path(preflight_animatic.__file__)), expected)
        # Old receipts still name this exact inspector; the wrapper adds no inspection.
        frozen_receipt = {"inspector_sha256": expected}
        self.assertEqual(frozen_receipt["inspector_sha256"], c.digest(Path(preflight_animatic.__file__)))

    def test_wrapper_requires_exact_frozen_artifacts_and_denies_unsafe_context(self):
        self.begin(); self.expand()
        self.assertTrue(life.authorize_repair(self.state, self.plan_path)[0])
        saved = r.read(self.root / "preflight.json")
        duplicate = self.root / "duplicate.mp4"; duplicate.write_bytes((self.root / "preflight.mp4").read_bytes())
        self.assertTrue(r.preflight_problems(saved, self.board_path, duplicate))
        self.assertTrue(r.preflight_problems({**saved, "extra": "rewritten"}, self.board_path, self.root / "preflight.mp4"))
        (self.root / "mix.wav").write_bytes(b"unauthorized mix")
        with patch("preflight_animatic.report_problems", return_value=[]) as original:
            self.assertTrue(r.preflight_problems(saved, self.board_path, self.root / "preflight.mp4"))
            original.assert_not_called()

    def test_wrapper_normal_verification_keeps_original_direction_and_critic_gates(self):
        with patch("documentary_check.check", return_value=["bad direction"]), patch("critic_gate.check", return_value=[]), patch.object(r, "preflight_problems", return_value=[]):
            self.assertEqual(r.main(["--board", str(self.board_path), "--film", str(self.root / "preflight.mp4"), "--verify-report", str(self.root / "preflight.json")]), 1)
        with patch("documentary_check.check", return_value=[]), patch("critic_gate.check", return_value=["bad critic"]), patch.object(r, "preflight_problems", return_value=[]):
            self.assertEqual(r.main(["--board", str(self.board_path), "--film", str(self.root / "preflight.mp4"), "--verify-report", str(self.root / "preflight.json")]), 1)


if __name__ == "__main__":
    unittest.main()
