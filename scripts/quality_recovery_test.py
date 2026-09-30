"""Offline regressions for actual September26 false approvals and runaway retries."""
import copy
import json
import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path
import quality_contract as q
import repair_guard as g
import run_controller as c
import production_lifecycle as life

class RecoveryTest(unittest.TestCase):
    def test_distinct_technical_faults_do_not_create_a_creative_pivot(self):
        state = c.read_state(self.path)
        for mechanism in ['runtime', 'lexical']:
            c.event(state, 'repair_started', mechanism_id=mechanism,
                    failure_family='unclassified', repair_scope='technical-integrity')
        plan = {'mechanism_id':'caption-occupancy', 'failure_family':'unclassified',
                'repair_scope':'technical-integrity', 'director_identity':'director'}
        self.assertEqual(g.plan_problems(state, plan), [])
        for event in state['events']:
            if event.get('kind') == 'repair_started': event['mechanism_id'] = 'caption-occupancy'
        self.assertTrue(g.plan_problems(state, plan))
        plan['repair_scope'] = 'standard'
        self.assertEqual(g.plan_problems(state, plan), [])
        for event in state['events']:
            if event.get('kind') == 'repair_started': event['repair_scope'] = 'standard'
        self.assertTrue(g.plan_problems(state, plan))

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.path = Path(self.tmp.name) / "state.json"
        # Retained September 27 fixtures keep their historical frozen allocation.
        # The new default must not silently enlarge already-started editions.
        with patch.object(c, "ceilings", return_value={**c.ceilings(), "storyboard_critics": 6}):
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

    def pivot_fixture(self):
        state = c.read_state(self.path)
        for i in range(2):
            c.event(state, "repair_started", mechanism_id="old-name-" + str(i),
                    failure_family="capture-and-analysis", failure_sha256=str(i))
        plan = {"mechanism_id": "new-physical-action", "failure_family": "capture-and-analysis",
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
        return state, plan, review, evidence

    def test_renaming_same_failure_family_does_not_reset_it(self):
        state, plan, review, evidence = self.pivot_fixture()
        # The actual planned mechanism must be the independently approved replacement.
        self.assertFalse(g.plan_problems(state, plan))

    def test_pivot_rejects_unapproved_plan_mechanism(self):
        state, plan, _, _ = self.pivot_fixture()
        plan["mechanism_id"] = "arbitrary-unreviewed-action"
        self.assertTrue(g.plan_problems(state, plan))

    def test_pivot_rejects_retired_replacement_and_unknown_history(self):
        state, plan, review, evidence = self.pivot_fixture()
        # Include the planned mechanism in history so equality is independently tested.
        c.event(state, "repair_started", mechanism_id=plan["mechanism_id"],
                failure_family=plan["failure_family"], failure_sha256="2")
        evidence["reviewed_failure_sha256"].append("2")
        for retired in (plan["mechanism_id"], "never-failed-mechanism"):
            with self.subTest(retired=retired):
                evidence["retired_mechanism_id"] = retired
                review.write_text(json.dumps(evidence))
                plan["pivot_review"]["sha256"] = c.digest(review)
                self.assertTrue(g.plan_problems(state, plan))

    def test_pivot_retains_independence_failure_coverage_and_source_requirements(self):
        state, plan, review, evidence = self.pivot_fixture()
        for changes in ({"reviewer_identity": "director"}, {"reviewer_identity": ""},
                        {"verdict": "revise"}, {"reviewed_failure_sha256": ["0"]},
                        {"visible_difference": ""}, {"source_basis": ""}):
            with self.subTest(changes=changes):
                review.write_text(json.dumps({**evidence, **changes}))
                plan["pivot_review"]["sha256"] = c.digest(review)
                self.assertTrue(g.plan_problems(state, plan))

    def test_pivot_rejects_stale_evidence_hash(self):
        state, plan, review, evidence = self.pivot_fixture()
        evidence["visible_difference"] += " The source-supported action is unchanged."
        review.write_text(json.dumps(evidence))
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
        prior = state["escalation_ceiling"]["audiovisual_reviews"]
        state["escalation_ceiling"]["audiovisual_reviews"]=79
        c.event(state, "owner_agent_extension", resource="audiovisual_reviews",
                previous_ceiling=prior, new_ceiling=79, repair_revision="retained-legacy-owner-extension")
        before=copy.deepcopy(state["usage"])
        state["repair_policy"]=g.VERSION;g.freeze(state)
        self.assertEqual(before,state["usage"])
        self.assertEqual(state["resource_envelope"]["audiovisual_reviews"],79)
        self.assertFalse(g.envelope_problems(state,{"audiovisual_reviews":4}))
        self.assertTrue(g.envelope_problems(state,{"audiovisual_reviews":5}))

    def test_legacy_adoption_refuses_unrecorded_ceiling_change(self):
        state = c.read_state(self.path)
        state.pop("resource_envelope")
        state["events"] = [e for e in state["events"] if e["kind"] != "resource_envelope_frozen"]
        state["escalation_ceiling"]["storyboard_critics"] += 100
        before = copy.deepcopy(state)
        with self.assertRaisesRegex(ValueError, "invalid legacy allowances"):
            g.freeze(state)
        self.assertEqual(state, before)

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


    def second_owner_fixture(self, av=False):
        _, failure, approval, data = self.owner_fixture()
        self.assertTrue(c.grant_owner_review(self.path, approval, failure, 2, g.OWNER_CONFIRMATION)[0])
        state = c.read_state(self.path)
        data.update(approval_id="owner-message-456", source_message_reference="conversation/456",
                    owner_text="I explicitly approve a second grant of exactly two critics for this edition.",
                    previous_grant_sha256=g.envelope_digest(state["events"][-1]))
        if av:
            film = self.path.parent / "hero.mp4"
            film.write_bytes(b"retained exact hero bytes")
            raw = {"responseId": "provider-id", "candidates": [{"content": {"parts": [
                {"text": json.dumps({"pass": False, "audio_access": True,
                                    "defects": ["The visible action remains unclear."]})}]}}]}
            response = self.path.parent / "hero-response.json"
            response.write_text(json.dumps(raw))
            receipt = {"schema": "dispatch_audiovisual_review/1", "role": "hero",
                       "review_scope": "passage", "model": "independent-model", "request_id": "request",
                       "film_sha256": c.digest(film),
                       "response": {"file": response.name, "sha256": c.digest(response)}}
            failure.write_text(json.dumps(receipt))
            data.update(failure_film=str(film), failure_film_sha256=c.digest(film),
                        failure_response_json=response.read_text(), failure_evidence_sha256=c.digest(failure))
        approval.write_text(json.dumps(data))
        return state, failure, approval, data

    def test_second_explicit_grant_is_bounded_and_chained(self):
        before, failure, approval, data = self.second_owner_fixture()
        self.assertTrue(c.grant_owner_review(self.path, approval, failure, 2, g.OWNER_CONFIRMATION)[0])
        after = c.read_state(self.path)
        self.assertEqual(after["resource_envelope"], before["resource_envelope"])
        self.assertEqual(after["usage"], before["usage"])
        self.assertEqual(after["events"][:-1], before["events"])
        self.assertEqual(after["escalation_ceiling"]["storyboard_critics"], 10)
        self.assertFalse(life.allowance_problems(after))
        self.assertTrue(c.reserve(self.path, {"storyboard_critics": 5})[0])
        self.assertFalse(c.reserve(self.path, {"storyboard_critics": 1})[0])
        for changes in ({}, {"approval_id": "third", "source_message_reference": "third",
                              "owner_text": "Another explicit grant", "previous_grant_sha256": g.envelope_digest(after["events"][-1])}):
            approval.write_text(json.dumps({**data, **changes}))
            self.assertFalse(c.grant_owner_review(self.path, approval, failure, 2, g.OWNER_CONFIRMATION)[0])

    def test_second_grant_rejects_replays_missing_chain_and_tampering(self):
        before, failure, approval, data = self.second_owner_fixture()
        first = json.loads(before["events"][-1]["authorization_json"])
        variants = [{key: first[key]} for key in ("approval_id", "source_message_reference", "owner_text")]
        variants += [{"previous_grant_sha256": None}, {"previous_grant_sha256": "stale"}]
        for changes in variants:
            approval.write_text(json.dumps({**data, **changes}))
            self.assertFalse(c.grant_owner_review(self.path, approval, failure, 2, g.OWNER_CONFIRMATION)[0])
            self.assertEqual(c.read_state(self.path), before)
        approval.write_text(json.dumps(data))
        self.assertTrue(c.grant_owner_review(self.path, approval, failure, 2, g.OWNER_CONFIRMATION)[0])
        after = c.read_state(self.path)
        after["events"][-2]["usage_unchanged"] += 1
        self.assertTrue(g.owner_grant_problems(after))

    def test_second_grant_accepts_bound_av_rejection_and_archive(self):
        before, failure, approval, data = self.second_owner_fixture(av=True)
        self.assertTrue(c.grant_owner_review(self.path, approval, failure, 2, g.OWNER_CONFIRMATION)[0])
        state = c.read_state(self.path)
        Path(data["failure_film"]).unlink()
        (self.path.parent / "hero-response.json").unlink()
        failure.unlink(); approval.unlink()
        self.assertFalse(g.owner_grant_problems(state))
        self.assertFalse(life.allowance_problems(state))
        tampered = copy.deepcopy(state)
        auth = json.loads(tampered["events"][-1]["authorization_json"])
        auth["failure_response_json"] += " "
        tampered["events"][-1]["authorization_json"] = json.dumps(auth)
        import hashlib
        tampered["events"][-1]["authorization_sha256"] = hashlib.sha256(json.dumps(auth).encode()).hexdigest()
        self.assertTrue(g.owner_grant_problems(tampered))

    def test_av_grant_rejects_changed_film_response_and_nonrejection(self):
        before, failure, approval, data = self.second_owner_fixture(av=True)
        for path in (Path(data["failure_film"]), self.path.parent / "hero-response.json"):
            original = path.read_bytes()
            path.write_bytes(original + b"changed")
            self.assertFalse(c.grant_owner_review(self.path, approval, failure, 2, g.OWNER_CONFIRMATION)[0])
            self.assertEqual(c.read_state(self.path), before)
            path.write_bytes(original)
        receipt = json.loads(failure.read_text())
        import hashlib
        for review in ({"pass": True, "audio_access": True, "defects": ["defect"]},
                       {"pass": False, "audio_access": False, "defects": ["defect"]},
                       {"pass": False, "audio_access": True, "defects": []}):
            raw = json.loads(data["failure_response_json"])
            raw["candidates"][0]["content"]["parts"][0]["text"] = json.dumps(review)
            text = json.dumps(raw)
            variant = {**data, "failure_response_json": text}
            bad = {**receipt, "response": {**receipt["response"], "sha256": hashlib.sha256(text.encode()).hexdigest()}}
            self.assertTrue(g.av_rejection_problems(variant, bad))

    def test_budget_precheck_is_read_only_and_reports_exact_deficits(self):
        state, failure, approval, _ = self.second_owner_fixture()
        state["usage"].update(storyboard_critics=state["escalation_ceiling"]["storyboard_critics"], preflight_renders=state["resource_envelope"]["preflight_renders"]-1,
                              audiovisual_reviews=state["resource_envelope"]["audiovisual_reviews"]-2)
        before = copy.deepcopy(state)
        result = g.production_budget_precheck(state)
        self.assertEqual(result["deficits"], {"storyboard_critics": 3, "preflight_renders": 2, "audiovisual_reviews": 2})
        self.assertEqual(state, before)
        self.assertFalse(result["feasible"])
        self.assertTrue(c.grant_owner_review(self.path, approval, failure, 2, g.OWNER_CONFIRMATION)[0])
        result = g.production_budget_precheck(c.read_state(self.path))
        self.assertTrue(result["feasible"])
        legacy = copy.deepcopy(state); legacy.pop("resource_envelope")
        legacy_before = copy.deepcopy(legacy)
        self.assertTrue(g.production_budget_precheck(legacy)["errors"])
        self.assertEqual(legacy, legacy_before)

    def test_prevoice_repair_keeps_final_timed_phone_and_native_hero_in_budget(self):
        state = c.read_state(self.path)
        before = copy.deepcopy(state)
        result = g.production_budget_precheck(state)
        self.assertEqual(result["resources"]["storyboard_critics"]["required"], 3)
        self.assertEqual(result["resources"]["preflight_renders"]["required"], 3)
        self.assertEqual(result["resources"]["tts_calls"]["required"], 2)
        self.assertEqual(result["resources"]["voice_directors"]["required"], 1)
        # Two slots cover plan and silent picture, but leave the timed cut unreviewed.
        state["usage"]["storyboard_critics"] = state["resource_envelope"]["storyboard_critics"] - 2
        self.assertEqual(g.production_budget_precheck(state)["deficits"]["storyboard_critics"], 1)
        self.assertEqual(before["usage"]["storyboard_critics"], 0)
        state["usage"]["tts_calls"] = 1
        self.assertEqual(g.production_budget_precheck(state)["resources"]["tts_calls"]["required"], 2)

    def test_creative_cap_budget_finishes_current_cut_without_new_creative_round(self):
        state = c.read_state(self.path)
        state["run_id"] = "2026-09-29"
        state["usage"]["reboards"] = 3
        state["usage"]["storyboard_critics"] = state["resource_envelope"]["storyboard_critics"] - 1
        result = g.production_budget_precheck(state)
        self.assertTrue(result["feasible"])
        self.assertEqual(result["path"], "finish-current")
        self.assertEqual(result["resources"]["reboards"]["required"], 0)
        self.assertEqual(result["resources"]["storyboard_critics"]["required"], 1)
        self.assertEqual(result["resources"]["preflight_renders"]["required"], 2)
        self.assertEqual(result["resources"]["audiovisual_reviews"]["required"], 4)
        self.assertEqual(result["resources"]["scorer_calls"]["required"], 3)

    def test_completion_headroom_routes_to_finishing_before_creative_cap(self):
        state = c.read_state(self.path)
        state["run_id"] = "2026-09-29"
        state["usage"].update(reboards=1, storyboard_critics=4)
        result = g.production_budget_precheck(state)
        self.assertEqual(result["path"], "finish-current")
        self.assertEqual(result["resources"]["storyboard_critics"]["required"], 1)
        self.assertTrue(result["feasible"])

    def test_budget_cli_never_changes_ledger_on_pass_failure_or_tampering(self):
        import subprocess
        import sys
        state = c.read_state(self.path)
        for variant, code in ((state, 0),
                ({**state, "usage": {**state["usage"], "reboards": state["resource_envelope"]["reboards"]}}, 1),
                ({**state, "resource_envelope": {**state["resource_envelope"], "full_renders": 999}}, 1)):
            c.save(self.path, variant)
            before = self.path.read_bytes()
            result = subprocess.run([sys.executable, str(Path(c.__file__)), "--state", str(self.path),
                                     "production-budget"], text=True, capture_output=True)
            self.assertEqual(result.returncode, code, result.stderr)
            self.assertEqual(self.path.read_bytes(), before)
            self.assertEqual(json.loads(result.stdout)["feasible"], code == 0)

    def narration_fixture(self):
        _, rejection, approval, _ = self.owner_fixture()
        self.assertTrue(c.grant_owner_review(self.path, approval, rejection, 2, g.OWNER_CONFIRMATION)[0])
        self.assertTrue(c.reserve(self.path, {"storyboard_critics": 2, "tts_calls": 2})[0])
        root = self.path.parent
        for name, content in (("vo_script.txt", "The unchanged source-backed narration."),
                              ("storyboard.json", '{"scenes": [], "cinematic_template": "daily-actions-v1"}'),
                              ("claims.json", '{"claims": []}'),
                              ("vo_direction.json", '{"pace": "too slow"}')):
            (root / name).write_text(content)
        (root / "sources").mkdir()
        (root / "sources" / "primary.txt").write_text("Retained fetched primary evidence")
        direction = root / "vo_direction.json"
        baseline = root / "direction.before.json"
        baseline.write_bytes(direction.read_bytes())
        failed_take = root / "failed.wav"
        failed_take.write_bytes(b"retained rejected take")
        failure = root / "soundcheck.txt"
        failure.write_text("The audible full passage failed its verbatim soundcheck.")
        plan = root / "narration-repair.json"
        data = {"repair_scope": "narration-performance", "mechanism_id": "continuous-spoken-take",
                "failure_family": "human-performance", "director_identity": "voice-director",
                "root_cause": "The take delayed the opening line with exaggerated pauses.",
                "repair": "Direct a continuous full passage with natural connected speech.",
                "mechanism_change": "The spoken delivery removes exaggerated performance pauses.",
                "expected_visible_result": "The same supported narration fits the existing story sequence.",
                "failure_evidence": str(failure), "failure_evidence_sha256": c.digest(failure),
                "changed_inputs": [{"path": str(direction), "before_path": str(baseline),
                                    "before_sha256": c.digest(baseline)}],
                "resources": {"tts_calls": 2}}
        plan.write_text(json.dumps(data))
        return plan, data

    def finish_narration_edit(self, plan, data):
        source = Path(data["changed_inputs"][0]["path"])
        source.write_text('{"pace": "connected natural speech"}')
        data["changed_inputs"][0]["after_sha256"] = c.digest(source)
        plan.write_text(json.dumps(data))

    def test_narration_scope_preserves_granted_ledger_and_final_phone_capacity(self):
        plan, data = self.narration_fixture()
        before = c.read_state(self.path)
        self.assertEqual(before["usage"]["storyboard_critics"], 7)
        self.assertEqual(before["escalation_ceiling"]["storyboard_critics"], 8)
        failed_take = (self.path.parent / "failed.wav").read_bytes()
        # The same retained inputs still require two visual calls in standard scope.
        data.pop("repair_scope")
        plan.write_text(json.dumps(data))
        self.assertIn("nonrenewable", life.begin_repair(self.path, plan)[1])
        data["repair_scope"] = "narration-performance"
        plan.write_text(json.dumps(data))
        with patch("critic_gate.renderer_digest", return_value=None):
            self.assertFalse(life.begin_repair(self.path, plan)[0])
        self.assertTrue(life.begin_repair(self.path, plan)[0])
        self.assertFalse(life.authorize_repair(self.path, plan)[0])  # unchanged direction
        self.finish_narration_edit(plan, data)
        ok, message = life.authorize_repair(self.path, plan)
        self.assertTrue(ok, message)
        after = c.read_state(self.path)
        for key in ("usage", "resource_envelope", "escalation_ceiling", "limits"):
            self.assertEqual(after[key], before[key])
        self.assertEqual(after["events"][:len(before["events"])], before["events"])
        self.assertFalse(life.allowance_problems(after))
        self.assertEqual((self.path.parent / "failed.wav").read_bytes(), failed_take)
        self.assertFalse(life.authorize_repair(self.path, plan)[0])
        self.assertFalse(life.begin_repair(self.path, plan)[0])
        self.assertTrue(c.reserve(self.path, {"tts_calls": 2})[0])
        self.assertTrue(c.reserve(self.path, {"storyboard_critics": 1})[0])
        self.assertFalse(c.reserve(self.path, {"storyboard_critics": 1})[0])

    def test_narration_scope_rejects_other_inputs_and_resources(self):
        plan, data = self.narration_fixture()
        before = c.read_state(self.path)
        variants = [{**data, "repair_scope": "unknown"},
                    {**data, "changed_inputs": data["changed_inputs"] * 2}]
        for name in ("vo_script.txt", "storyboard.json", "claims.json", "other/vo_direction.json"):
            row = {**data["changed_inputs"][0], "path": str(self.path.parent / name)}
            variants.append({**data, "changed_inputs": [row]})
        for count in (0, -1, 3, True, 1.5):
            variants.append({**data, "resources": {"tts_calls": count}})
        for resource in ("full_renders", "preflight_renders", "storyboard_critics", "audiovisual_reviews",
                         "panel_rounds", "scorer_calls", "voice_directors", "reported_tokens"):
            variants.append({**data, "resources": {"tts_calls": 2, resource: 1}})
        for variant in variants:
            with self.subTest(variant=variant):
                plan.write_text(json.dumps(variant))
                self.assertFalse(life.begin_repair(self.path, plan)[0])
                self.assertEqual(c.read_state(self.path), before)

    def test_narration_authorization_rejects_frozen_input_changes(self):
        plan, data = self.narration_fixture()
        with patch("critic_gate.renderer_digest", return_value="renderer-before"):
            self.assertTrue(life.begin_repair(self.path, plan)[0])
            self.finish_narration_edit(plan, data)
            before = c.read_state(self.path)
            for name in ("vo_script.txt", "storyboard.json", "claims.json", "sources/primary.txt",
                         "direction.before.json", "soundcheck.txt"):
                with self.subTest(name=name):
                    p = self.path.parent / name
                    retained = p.read_bytes()
                    p.write_text("tampered baseline or production input")
                    self.assertFalse(life.authorize_repair(self.path, plan)[0])
                    self.assertEqual(c.read_state(self.path), before)
                    p.write_bytes(retained)
            extra = self.path.parent / "sources" / "new.txt"
            extra.write_text("Unreviewed source")
            self.assertFalse(life.authorize_repair(self.path, plan)[0])
            extra.unlink()
            with patch("critic_gate.renderer_digest", return_value="renderer-changed"):
                self.assertFalse(life.authorize_repair(self.path, plan)[0])
            self.assertTrue(life.authorize_repair(self.path, plan)[0])

    def test_narration_authorization_rejects_plan_rewrite(self):
        plan, data = self.narration_fixture()
        self.assertTrue(life.begin_repair(self.path, plan)[0])
        self.finish_narration_edit(plan, data)
        before = c.read_state(self.path)
        duplicate = self.path.parent / "replacement.before.json"
        duplicate.write_bytes(Path(data["changed_inputs"][0]["before_path"]).read_bytes())
        for changes in ({"repair_scope": "standard"}, {"repair_scope": "unknown"},
                        {"mechanism_id": "unapproved-new-mechanism"},
                        {"resources": {"tts_calls": 2, "full_renders": 1}},
                        {"resources": {"tts_calls": 1}},
                        {"changed_inputs": [{**data["changed_inputs"][0], "before_path": str(duplicate)}]}):
            with self.subTest(changes=changes):
                plan.write_text(json.dumps({**data, **changes}))
                self.assertFalse(life.authorize_repair(self.path, plan)[0])
                self.assertEqual(c.read_state(self.path), before)
        plan.write_text(json.dumps(data))
        self.assertTrue(life.authorize_repair(self.path, plan)[0])
        after = c.read_state(self.path)
        for event_index, grant in ((-2, {"reboards": {"from": 10, "to": 10}}),
                                   (-1, {"full_renders": {"from": 14, "to": 14}})):
            forged = copy.deepcopy(after)
            forged["events"][event_index]["grants"] = grant
            self.assertTrue(life.allowance_problems(forged))

    def test_narration_scope_cannot_renew_tts_envelope(self):
        plan, data = self.narration_fixture()
        state = c.read_state(self.path)
        state["usage"]["tts_calls"] = state["resource_envelope"]["tts_calls"] - 1
        c.save(self.path, state)
        self.assertIn("nonrenewable", life.begin_repair(self.path, plan)[1])
        data["resources"] = {"tts_calls": 1}
        plan.write_text(json.dumps(data))
        self.assertTrue(life.begin_repair(self.path, plan)[0])
        self.finish_narration_edit(plan, data)
        # Work charged after begin is still deducted at authorization.
        self.assertTrue(c.reserve(self.path, {"tts_calls": 1})[0])
        self.assertIn("nonrenewable", life.authorize_repair(self.path, plan)[1])

if __name__ == "__main__":
    unittest.main()
