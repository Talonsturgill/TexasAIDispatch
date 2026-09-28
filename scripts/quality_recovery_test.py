"""Offline regressions for actual September26 false approvals and runaway retries."""
import copy
import json
import tempfile
import unittest
from pathlib import Path
import quality_contract as q
import repair_guard as g
import run_controller as c
import production_lifecycle as life

class RecoveryTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.path = Path(self.tmp.name) / "state.json"
        c.initialise(self.path, "2026-09-27", "production")

    def test_repair_cannot_renew_total_allocation(self):
        state = c.read_state(self.path)
        before = copy.deepcopy(state["resource_envelope"])
        state["usage"]["reboards"] = before["reboards"]
        c.save(self.path, state)
        self.assertFalse(c.reserve(self.path, {"reboards": 1})[0])
        self.assertEqual(c.read_state(self.path)["resource_envelope"], before)
        self.assertIsNone(c.read_state(self.path)["terminal_state"])
        self.assertTrue(g.envelope_problems(state, {"reboards": 1}))
        # Changing the current ceiling cannot enlarge the independently recorded envelope.
        state["escalation_ceiling"]["reboards"] += 500
        self.assertTrue(g.envelope_problems(state, {"reboards": 1}))
        state["resource_envelope"]["reboards"] += 500
        self.assertTrue(g.envelope_problems(state, {"reboards": 1}))

    def test_real_repair_entry_cannot_create_another_budget(self):
        state=c.read_state(self.path)
        state["usage"]["reboards"]=state["resource_envelope"]["reboards"]
        c.save(self.path,state)
        plan=Path(self.tmp.name)/"plan.json"
        plan.write_text(json.dumps({"mechanism_id":"supported-capture",
                                   "failure_family":"capture-and-analysis",
                                   "director_identity":"director"}))
        before=copy.deepcopy(state["escalation_ceiling"])
        ok,message=life.begin_repair(self.path,plan)
        self.assertFalse(ok)
        self.assertIn("nonrenewable",message)
        self.assertEqual(c.read_state(self.path)["escalation_ceiling"],before)

    def test_renaming_same_failure_family_does_not_reset_it(self):
        state = c.read_state(self.path)
        for i in range(2):
            c.event(state, "repair_started", mechanism_id="old-name-" + str(i),
                    failure_family="capture-and-analysis", failure_sha256=str(i))
        plan = {"mechanism_id": "new-name", "failure_family": "capture-and-analysis",
                "director_identity": "director"}
        self.assertTrue(g.plan_problems(state, plan))
        review = Path(self.tmp.name) / "pivot.json"
        evidence = {"verdict":"pass", "reviewer_identity":"critic",
                    "retired_mechanism_id":"old-name-1", "replacement_mechanism_id":"new-physical-action",
                    "reviewed_failure_sha256":["0","1"],
                    "visible_difference":"The captured object now performs a different observable physical transformation.",
                    "source_basis":"The retained primary source describes this specific captured condition."}
        review.write_text(json.dumps(evidence))
        plan["pivot_review"] = {"path":str(review), "sha256":c.digest(review)}
        self.assertFalse(g.plan_problems(state, plan))
        evidence["reviewer_identity"] = "director"
        review.write_text(json.dumps(evidence));plan["pivot_review"]["sha256"]=c.digest(review)
        self.assertTrue(g.plan_problems(state, plan))

    def test_phone_pass_cannot_hide_dominant_subject_failure(self):
        board = {"date":"2026-09-27"}
        report = {"quality_contract_sha256":q.fingerprint(), "phone_observations":{}}
        for key in q.policy()["criteria"]:
            if key != "sound":
                report["phone_observations"][key] = {
                    "pass":True, "start_s":2.1,"end_s":4.14,
                    "observed":"The same supported subject is clearly selected and the result remains readable."}
        self.assertFalse(q.phone_problems(board, report))
        for key in ("dominant_action", "surface_finish", "contact_and_consequence", "continuity"):
            failed = copy.deepcopy(report)
            failed["phone_observations"][key]["pass"] = False
            self.assertTrue(q.phone_problems(board, failed),key)
        tiny = copy.deepcopy(report);tiny["blocking_defects"]=["The focal pile occupies only90 phone pixels."]
        self.assertTrue(q.phone_problems(board,tiny))
        # Muted reviewers are never asked to manufacture audible evidence.
        self.assertNotIn("sound", report["phone_observations"])

    def test_criteria_change_invalidates_phone_binding(self):
        report = {"quality_contract_sha256":"old"}
        self.assertTrue(q.phone_problems({"date":"2026-09-27"},report))
        self.assertFalse(q.phone_problems({"date":"2026-09-25"},report))

    def test_unfilmable_treatment_cannot_enter_preflight(self):
        board={"date":"2026-09-27","scenes":[{"id":"s1"}]}
        self.assertTrue(q.plan_problems(board))
        row={"scene_id":"s1","medium":"dimensional"}
        for field in ("subject","action","consequence","source_basis","medium_evidence"):
            row[field]="Specific source-backed physical action with retained visual evidence."
        board["quality_plan"]={"contract_sha256":q.fingerprint(),"scenes":[row]}
        self.assertFalse(q.plan_problems(board))
        row.pop("medium_evidence")
        self.assertTrue(q.plan_problems(board))

    def test_legacy_adoption_preserves_every_charge(self):
        state=c.read_state(self.path);state.pop("repair_policy");state.pop("resource_envelope")
        state["events"]=[e for e in state["events"] if e["kind"]!="resource_envelope_frozen"]
        state["usage"]["audiovisual_reviews"]=75
        state["escalation_ceiling"]["audiovisual_reviews"]=79
        before=copy.deepcopy(state["usage"])
        state["repair_policy"]=g.VERSION;g.freeze(state)
        self.assertEqual(before,state["usage"])
        self.assertEqual(state["resource_envelope"]["audiovisual_reviews"],79)
        self.assertFalse(g.envelope_problems(state,{"audiovisual_reviews":4}))
        self.assertTrue(g.envelope_problems(state,{"audiovisual_reviews":5}))

    def owner_fixture(self, calls=2):
        state = c.read_state(self.path)
        state["usage"]["storyboard_critics"] = 5
        c.event(state, "reserved", resources={"storyboard_critics": 5}, note="retained earlier calls")
        c.save(self.path, state)
        failure = Path(self.tmp.name) / "rejection.json"
        failure.write_text(json.dumps({"verdict": "revise", "reviewer_identity": "independent-critic",
                                       "blocking_defects": ["The physical capture lacks source support."]}))
        approval = Path(self.tmp.name) / "approval.json"
        data = {"approval_id": "owner-message-123", "run_id": state["run_id"],
                "resource": "storyboard_critics", "additional_calls": calls,
                "confirmation": g.OWNER_CONFIRMATION,
                "owner_text": f"I approve exactly {calls} additional storyboard critic calls for this edition.",
                "source_message_reference": "retained-conversation/owner-message-123",
                "resource_envelope_sha256": g.envelope_digest(state["resource_envelope"]),
                "failure_evidence": str(failure), "failure_evidence_sha256": c.digest(failure)}
        approval.write_text(json.dumps(data))
        return state, failure, approval, data

    def test_owner_grant_requires_exact_explicit_authorization(self):
        before, failure, approval, data = self.owner_fixture()
        for changes in ({"run_id": "wrong-run"}, {"resource": "full_renders"},
                        {"additional_calls": True}, {"additional_calls": 0}, {"additional_calls": -1}, {"additional_calls": 3},
                        {"additional_calls": 1}, {"confirmation": "yes"}, {"owner_text": ""},
                        {"source_message_reference": ""}, {"approval_id": ""},
                        {"failure_evidence_sha256": "stale"}, {"failure_evidence": "/wrong/file"},
                        {"resource_envelope_sha256": "stale"}):
            with self.subTest(changes=changes):
                approval.write_text(json.dumps({**data, **changes}))
                self.assertFalse(c.grant_owner_review(self.path, approval, failure, 2, g.OWNER_CONFIRMATION)[0])
                self.assertEqual(c.read_state(self.path), before)
        approval.write_text(json.dumps(data))
        for artifact, calls, confirmation in ((None, 2, g.OWNER_CONFIRMATION),
                (approval.with_name("missing.json"), 2, g.OWNER_CONFIRMATION),
                (approval, 2, ""), (approval, True, g.OWNER_CONFIRMATION),
                (approval, 3, g.OWNER_CONFIRMATION)):
            self.assertFalse(c.grant_owner_review(self.path, artifact, failure, calls, confirmation)[0])
            self.assertEqual(c.read_state(self.path), before)

    def test_owner_grant_preserves_history_and_reserves_only_exact_increment(self):
        before, failure, approval, _ = self.owner_fixture()
        self.assertTrue(c.grant_owner_review(self.path, approval, failure, 2, g.OWNER_CONFIRMATION)[0])
        granted = c.read_state(self.path)
        self.assertEqual(granted["usage"], before["usage"])
        self.assertEqual(granted["resource_envelope"], before["resource_envelope"])
        self.assertEqual(granted["events"][:-1], before["events"])
        self.assertEqual(granted["escalation_ceiling"]["storyboard_critics"], 8)
        self.assertEqual(granted["limits"], before["limits"])
        self.assertFalse(life.allowance_problems(granted))
        self.assertTrue(c.reserve(self.path, {"storyboard_critics": 3})[0])
        self.assertEqual(c.read_state(self.path)["usage"]["storyboard_critics"], 8)
        self.assertFalse(c.reserve(self.path, {"storyboard_critics": 1})[0])
        self.assertFalse(life.allowance_problems(c.read_state(self.path)))

    def test_owner_grant_never_replays_or_renews(self):
        _, failure, approval, data = self.owner_fixture()
        self.assertTrue(c.grant_owner_review(self.path, approval, failure, 2, g.OWNER_CONFIRMATION)[0])
        before = c.read_state(self.path)
        for changes in ({}, {"approval_id": "different-message"}):
            approval.write_text(json.dumps({**data, **changes}))
            self.assertFalse(c.grant_owner_review(self.path, approval, failure, 2, g.OWNER_CONFIRMATION)[0])
            self.assertEqual(c.read_state(self.path), before)
        duplicate = copy.deepcopy(before)
        duplicate["events"].append(copy.deepcopy(duplicate["events"][-1]))
        self.assertTrue(g.envelope_problems(duplicate, {"storyboard_critics": 1}))
        self.assertTrue(life.allowance_problems(duplicate))

    def test_one_call_owner_grant_does_not_round_up_to_two(self):
        _, failure, approval, _ = self.owner_fixture(calls=1)
        self.assertTrue(c.grant_owner_review(self.path, approval, failure, 1, g.OWNER_CONFIRMATION)[0])
        self.assertEqual(c.read_state(self.path)["escalation_ceiling"]["storyboard_critics"], 7)
        self.assertTrue(c.reserve(self.path, {"storyboard_critics": 2})[0])
        self.assertFalse(c.reserve(self.path, {"storyboard_critics": 1})[0])

    def test_owner_grant_rechecks_retained_evidence_at_reservation(self):
        _, failure, approval, _ = self.owner_fixture()
        self.assertTrue(c.grant_owner_review(self.path, approval, failure, 2, g.OWNER_CONFIRMATION)[0])
        before = c.read_state(self.path)
        for key, value in (("authorization_json", "{}"), ("failure_evidence_json", "{}"),
                           ("additional_calls", 3), ("approval_id", "forged"),
                           ("new_ceiling", 9), ("failure_evidence_sha256", "stale")):
            with self.subTest(key=key):
                state = copy.deepcopy(before)
                state["events"][-1][key] = value
                c.save(self.path, state)
                self.assertFalse(c.reserve(self.path, {"storyboard_critics": 1})[0])
                self.assertEqual(c.read_state(self.path)["usage"], before["usage"])
                self.assertTrue(life.allowance_problems(state))
        state = copy.deepcopy(before)
        state["events"][-1].pop("authorization_json")
        self.assertTrue(g.envelope_problems(state, {"storyboard_critics": 1}))
        # Even changing both copies of the original envelope breaks the owner's binding.
        state = copy.deepcopy(before)
        state["resource_envelope"]["storyboard_critics"] += 1
        state["events"][0]["envelope"]["storyboard_critics"] += 1
        self.assertTrue(g.envelope_problems(state, {"storyboard_critics": 1}))

    def test_owner_evidence_is_self_contained_after_archive_relocation(self):
        _, failure, approval, _ = self.owner_fixture()
        self.assertTrue(c.grant_owner_review(self.path, approval, failure, 2, g.OWNER_CONFIRMATION)[0])
        relocated = Path(self.tmp.name) / "archive" / "state.json"
        c.save(relocated, c.read_state(self.path))
        self.path.unlink(); failure.unlink(); approval.unlink()
        self.assertFalse(life.allowance_problems(c.read_state(relocated)))
        self.assertTrue(c.reserve(relocated, {"storyboard_critics": 3})[0])

    def test_owner_grant_rejects_nonfailure_and_legacy_extension(self):
        before, failure, approval, data = self.owner_fixture()
        for report in ({"verdict": "pass", "reviewer_identity": "critic", "blocking_defects": ["defect"]},
                       {"verdict": "revise", "reviewer_identity": "", "blocking_defects": ["defect"]},
                       {"verdict": "revise", "reviewer_identity": "critic", "blocking_defects": []}):
            failure.write_text(json.dumps(report))
            approval.write_text(json.dumps({**data, "failure_evidence_sha256": c.digest(failure)}))
            self.assertFalse(c.grant_owner_review(self.path, approval, failure, 2, g.OWNER_CONFIRMATION)[0])
            self.assertEqual(c.read_state(self.path), before)
        self.assertFalse(c.extend_agent_ceiling(self.path, "storyboard_critics", "owner directed", True)[0])
        self.assertFalse(c.extend_preflight_ceiling(self.path, 99, "owner directed", True)[0])
        self.assertEqual(c.read_state(self.path), before)

if __name__ == "__main__":
    unittest.main()
