"""Standing grants add only mandatory deficits and preserve charged rejected history."""
import copy
import json
import tempfile
import unittest
import subprocess
import sys
from pathlib import Path

import autonomous_completion as capacity
import production_lifecycle as lifecycle
import repair_guard as guard
import run_controller as controller


class CompletionCapacityTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.state = self.root / "run_state.json"
        self.assertTrue(controller.initialise(self.state, "2026-10-03", "production")[0])
        state = controller.read_state(self.state)
        for name in capacity.MAX_REQUIRED:
            state["usage"][name] = state["resource_envelope"][name]
        controller.event(state, "reserved", resources={k: state["usage"][k] for k in capacity.MAX_REQUIRED},
                         note="offline fixture representing already charged production")
        controller.save(self.state, state)
        self.before = copy.deepcopy(state)
        self.report = self.root / "rejection.json"
        self.report.write_text(json.dumps({"verdict": "revise", "reviewer_identity": "independent-critic",
            "film_sha256": "a" * 64, "blocking_defects": [{"criterion": "dominant_action",
             "problem": "The carton does not visibly withdraw from the stack."}]}))
        self.plan = self.root / "plan.json"
        self.write_plan()

    def write_plan(self, **changes):
        plan = {"director_identity": "director", "repair_scope": "standard",
                "failed_film_sha256": "a" * 64, "failure_evidence": str(self.report),
                "failure_evidence_sha256": capacity.sha(self.report.read_text()),
                "resources": {"preflight_renders": 3, "full_renders": 1},
                "repair": "Restore observable source-bound carton handling in the existing treatment."}
        plan.update(changes)
        self.plan.write_text(json.dumps(plan))

    def grant(self):
        accepted, message = capacity.grant_capacity(self.state, self.plan)
        self.assertTrue(accepted, message)
        return controller.read_state(self.state)

    def test_exact_deficits_and_original_usage_retained(self):
        state = self.grant()
        grant = next(e for e in state["events"] if e["kind"] == capacity.EVENT)
        required = dict(capacity.MAX_REQUIRED); required["voice_directors"] = 0
        self.assertEqual(grant["resource_increments"], {k: n for k, n in required.items() if n})
        self.assertEqual(state["resource_envelope"], self.before["resource_envelope"])
        self.assertEqual(state["usage"], self.before["usage"])
        self.assertEqual(state["events"][:len(self.before["events"])], self.before["events"])
        self.assertEqual(lifecycle.allowance_problems(state), [])
        self.assertEqual(guard.envelope_problems(state, {"tts_calls": 2}), [])
        self.assertIsNone(state["terminal_state"])
        self.assertNotIn("bounded_release", state)
        self.assertTrue(grant["grants_no_review_approval"])
        self.assertFalse(controller.reserve(self.state, {"research_agents": 999})[0])

    def test_calls_remain_reserved_and_charged(self):
        self.grant()
        used = controller.read_state(self.state)["usage"]["tts_calls"]
        self.assertTrue(controller.reserve(self.state, {"tts_calls": 1}, "mandatory take")[0])
        state = controller.read_state(self.state)
        self.assertEqual(state["usage"]["tts_calls"], used + 1)
        self.assertEqual(state["events"][-1]["kind"], "reserved")
        self.assertEqual(lifecycle.allowance_problems(state), [])

    def test_no_duplicate_or_renamed_failure_grant(self):
        self.grant()
        self.write_plan(repair="Renamed prose does not create a fresh failed attempt or a fresh grant.")
        before = self.state.read_bytes()
        self.assertFalse(capacity.grant_capacity(self.state, self.plan)[0])
        self.assertEqual(self.state.read_bytes(), before)

    def test_director_optional_polish_and_research_refused(self):
        for change in [{"director_identity": "independent-critic"},
                       {"resources": {"research_agents": 1}},
                       {"repair_scope": "technical-integrity"}]:
            self.write_plan(**change)
            self.assertFalse(capacity.grant_capacity(self.state, self.plan)[0])
        report = json.loads(self.report.read_text())
        report["blocking_defects"] = ["Smooth the final camera easing."]
        self.report.write_text(json.dumps(report)); self.write_plan()
        self.assertFalse(capacity.grant_capacity(self.state, self.plan)[0])

    def test_pinned_policy_and_retained_artifact_mutations_blocked(self):
        state = self.grant()
        for field in ["policy_json", "plan_json", "failure_evidence_json", "precheck_json"]:
            altered = copy.deepcopy(state)
            grant = next(e for e in altered["events"] if e["kind"] == capacity.EVENT)
            grant[field] += " "
            self.assertTrue(capacity.replay(altered)[1], field)
        altered = copy.deepcopy(state)
        grant = next(e for e in altered["events"] if e["kind"] == capacity.EVENT)
        changed = json.loads(grant["policy_json"]); changed["owner_text"] = "Forged standing instruction"
        grant["policy_json"] = json.dumps(changed); grant["policy_sha256"] = capacity.sha(grant["policy_json"])
        self.assertTrue(capacity.replay(altered)[1])
        altered = copy.deepcopy(state); altered["resource_envelope"]["tts_calls"] += 1
        self.assertTrue(guard.envelope_problems(altered, {}))
        altered = copy.deepcopy(state); altered["escalation_ceiling"]["tts_calls"] += 1
        self.assertTrue(lifecycle.allowance_problems(altered))

    def test_grant_cannot_hide_increment_or_approve_film(self):
        state = self.grant()
        for field, value in [("resource_increments", {"tts_calls": 100}),
                             ("grants_no_review_approval", False),
                             ("reason", "optional-polish")]:
            altered = copy.deepcopy(state)
            next(e for e in altered["events"] if e["kind"] == capacity.EVENT)[field] = value
            self.assertTrue(capacity.replay(altered)[1])

    def test_legacy_without_standing_policy_retains_previous_rules(self):
        path = self.root / "legacy.json"
        controller.initialise(path, "2026-09-30", "production")
        state = controller.read_state(path)
        self.assertFalse(any(e["kind"] == capacity.ADOPTION for e in state["events"]))
        self.assertEqual(capacity.effective_envelope(state), state["resource_envelope"])
        state["usage"]["tts_calls"] = state["resource_envelope"]["tts_calls"]
        self.assertTrue(guard.envelope_problems(state, {"tts_calls": 1}))

    def test_future_initialisation_pins_policy_without_extra_capacity(self):
        state = self.before
        records = [e for e in state["events"] if e["kind"] == capacity.ADOPTION]
        self.assertEqual(len(records), 1)
        self.assertEqual(capacity.policy_problems(records[0]["policy_json"]), [])
        self.assertEqual(capacity.effective_envelope(state), state["resource_envelope"])

    def test_finish_current_replays_after_caps_and_later_usage_grow(self):
        report = json.loads(self.report.read_text())
        report["blocking_defects"] = ["The final easing could be smoother."]
        self.report.write_text(json.dumps(report))
        self.write_plan(completion_reason="finish-current")
        state = self.grant()
        grant = next(e for e in state["events"] if e["kind"] == capacity.EVENT)
        self.assertEqual(grant["reason"], "finish-current")
        self.assertEqual(grant["resource_increments"]["storyboard_critics"], 1)
        self.assertNotIn("reboards", grant["resource_increments"])
        self.assertEqual(capacity.replay(state)[1], [])
        self.assertTrue(controller.reserve(self.state, {"storyboard_critics": 1}, "final independent phone")[0])
        self.assertEqual(lifecycle.allowance_problems(controller.read_state(self.state)), [])

    def test_finish_label_cannot_shrink_failed_minimum_action_path(self):
        self.write_plan(completion_reason="finish-current")
        state = self.grant()
        grant = next(e for e in state["events"] if e["kind"] == capacity.EVENT)
        self.assertEqual(grant["reason"], "minimum-action")
        self.assertEqual(grant["resource_increments"]["storyboard_critics"], 3)
        budget = guard.production_budget_precheck(state, minimum_action_failed=True, mandatory_repair=True)
        self.assertTrue(budget["feasible"], budget)
        self.assertFalse(guard.production_budget_precheck(state, minimum_action_failed=True)["feasible"])

    def test_independent_retained_integrity_gets_full_path_after_creative_cap(self):
        finding = {"problem": "Caption is clipped by the phone edge."}
        report = {"verdict": "revise", "reviewer_identity": "independent-critic",
                  "blocking_defects": [finding], "technical_repair": {"findings": [
                      {"finding": finding, "category": "legibility"}]}}
        self.report.write_text(json.dumps(report)); self.write_plan(repair_scope="technical-integrity")
        state = self.grant()
        grant = next(e for e in state["events"] if e["kind"] == capacity.EVENT)
        self.assertEqual(grant["reason"], "retained-integrity")
        self.assertEqual(grant["resource_increments"]["storyboard_critics"], 3)
        self.assertEqual(grant["resource_increments"]["audiovisual_reviews"], 11)

    def test_partial_headroom_receives_only_actual_deficits(self):
        state = controller.read_state(self.state)
        state["usage"]["tts_calls"] -= 1
        state["usage"]["audiovisual_reviews"] -= 8
        state["usage"]["full_renders"] -= 1
        controller.save(self.state, state)
        grant = next(e for e in self.grant()["events"] if e["kind"] == capacity.EVENT)
        self.assertEqual(grant["resource_increments"]["tts_calls"], 1)
        self.assertEqual(grant["resource_increments"]["audiovisual_reviews"], 3)
        self.assertNotIn("full_renders", grant["resource_increments"])

    def test_existing_run_requires_explicit_capacity_command_to_adopt(self):
        state = controller.read_state(self.state)
        state["events"] = [e for e in state["events"] if e["kind"] != capacity.ADOPTION]
        controller.save(self.state, state)
        self.assertEqual(capacity.effective_envelope(state), state["resource_envelope"])
        state = self.grant()
        self.assertEqual(len([e for e in state["events"] if e["kind"] == capacity.ADOPTION]), 1)

    def test_controller_command_and_readonly_precheck(self):
        cli = Path(controller.__file__)
        result = subprocess.run([sys.executable, str(cli), "--state", str(self.state),
                    "completion-capacity", "--repair-plan", str(self.plan)], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        before = self.state.read_bytes()
        result = subprocess.run([sys.executable, str(cli), "--state", str(self.state),
                    "production-budget", "--repair-plan", str(self.plan)], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertTrue(json.loads(result.stdout)["feasible"])
        self.assertEqual(self.state.read_bytes(), before)

    def test_explicit_old_active_adoption_but_shipped_refused(self):
        path = self.root / "older-active.json"
        controller.initialise(path, "2026-09-30", "production")
        state = controller.read_state(path)
        state["usage"]["reboards"] = state["resource_envelope"]["reboards"]
        state["usage"]["storyboard_critics"] = state["resource_envelope"]["storyboard_critics"]
        controller.save(path, state)
        self.assertFalse(any(e["kind"] == capacity.ADOPTION for e in state["events"]))
        accepted, message = capacity.grant_capacity(path, self.plan)
        self.assertTrue(accepted, message)
        active = controller.read_state(path)
        adoption = next(e for e in active["events"] if e["kind"] == capacity.ADOPTION)
        self.assertTrue(adoption["explicit_existing_run"])
        self.assertEqual(lifecycle.allowance_problems(active), [])
        changed = copy.deepcopy(active)
        next(e for e in changed["events"] if e["kind"] == capacity.ADOPTION)["explicit_existing_run"] = False
        self.assertTrue(capacity.replay(changed)[1])
        active["terminal_state"] = "shipped"
        controller.save(path, active)
        before = path.read_bytes()
        self.assertFalse(capacity.grant_capacity(path, self.plan)[0])
        self.assertEqual(path.read_bytes(), before)


if __name__ == "__main__":
    unittest.main()
