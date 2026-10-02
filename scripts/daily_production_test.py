"""Offline mutation tests. Fixture verdicts are test data, never film approval."""
import contextlib
import io
import copy
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import daily_production as d
import critic_gate


def selection_fixture():
    sentence="The fixture shows a specific sourced action and its observable consequence."
    selected={k:sentence for k in ("title","beat","county","texas_link","why_today","consequence",
        "application_change","counter_image","earned_take")}
    selected.update(record_status="candidate-for-record",
        movement={"actor":"City staff","action":"sent notices","object":"property notices","event_type":"published","date":"2026-09-28"},
        agency={"next_step":sentence,"who_can_act":"Affected property owners","open":"unknown"},
        sources=[{"url":"https://example.org/source","source_type":"primary","retrieved":"2026-09-28"}],
        filmability={"action_support":[{"image":image,"medium":"demonstrated-action",
            "action_id":"document-accumulation-v1","source_url":"https://example.org/source",
            "pictured_action":sentence,"scope_fit":"Illustrative papers accumulate; the fixture claims no literal count."}
            for image in ("opening","mechanism","consequence")],"asset_leads":[]})
    return {"schema":"dispatch_story_selection/1","edition_date":"2026-09-28","selected":selected,
        "rejected":[{"title":"Unsupported alternative","reason":"The available pictures cannot show the central action."}]}


def fixture():
    ids = ["action", "change", "human", "answer"]
    board = {"date": "2026-09-28", "title": "Test fixture", "cinematic_template": "daily-actions-v1",
             "cinema": {"dimensional_scene_ids": []}, "scenes": [
                 {"id": i, "vo": "The city sends notices.", "vo_claims": ["c1"], "super": "",
                  "start_s": n*5, "duration_s": 5} for n, i in enumerate(ids)]}
    contract = {key: "Specific sourced detail for this test fixture only." for key in d.policy()["story_fields"]}
    contract.update(director_identity="test-director", scenes=[
        {"scene_id": i, "role": role, "claim_ids": ["c1"],
         "advances": "A specific pictured change advances this fixture's causal sequence."}
        for i, role in zip(ids, ["action", "mechanism", "consequence", "answer"])],
        transitions=[{"from": a, "to": b, "kind": "causal-consequence",
                      "because": "The preceding action creates the next observed state.",
                      "visible_bridge": "The same physical document continues into the next picture."}
                     for a, b in zip(ids, ids[1:])])
    board["story_contract"] = contract
    claims = {"claims": [{"id": "c1", "verdict": "VERIFIED", "quote": "The city sends notices."}]}
    return board, claims


def fixture_review(board, claims):
    return {"reviewer_identity": "test-critic", "story_review": {
        "story_sha256": d.story_digest(board), "policy_sha256": d.digest(d.POLICY),
        "claims_sha256": d.digest(claims), "verdict": "pass", "blocking_defects": [],
        "one_viewing_summary": "Fixture-only description of the action and its human consequence.",
        "opening_to_ending": "Fixture-only description of how the ending answers the opening.",
        "weakest_transition": "Fixture-only inspection of the weakest cut between two scenes."}}


class DailyTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.board, self.claims = fixture()
        self.bp, self.cp = self.root/"storyboard.json", self.root/"claims.json"
        self.cp.write_text(json.dumps(self.claims))
        self.report = fixture_review(self.board, self.cp)
        (self.root/"story_selection.json").write_text(json.dumps(selection_fixture()))
        self.save()

    def save(self):
        self.bp.write_text(json.dumps(self.board))
        (self.root/"storyboard_critic.json").write_text(json.dumps(self.report))

    def test_story_mutations_invalidate_full_sequence_review(self):
        self.assertEqual([], d.pre_voice_problems(self.bp, self.cp))
        for label, mutate in [
            ("narration", lambda b: b["scenes"][0].update(vo="The city stops sending notices.")),
            ("scene order", lambda b: b["scenes"].reverse()),
            ("removed scene", lambda b: b["scenes"].pop(1)),
            ("source limit", lambda b: b["story_contract"].update(source_limit="The outcome is now known.")),
            ("picture", lambda b: b["scenes"][0].update(production_action="unsupported-human-rig")),
        ]:
            changed = copy.deepcopy(self.board); mutate(changed)
            self.assertTrue(d.review_problems(changed, self.report), label)

    def test_measured_caption_and_timing_work_reuses_story_review(self):
        changed = copy.deepcopy(self.board)
        changed["captions"] = [{"text": "Measured words", "start": 0, "end": 2}]
        changed["scenes"][0].update(start_s=.25, duration_s=6, caption="A derived caption")
        self.assertEqual(d.story_digest(self.board), d.story_digest(changed))
        self.assertEqual([], d.review_problems(changed, self.report))

    def test_missing_causal_links_sources_and_independence_fail(self):
        for mutate in [
            lambda b: b["story_contract"].pop("actor"),
            lambda b: b["story_contract"]["transitions"].pop(),
            lambda b: b["story_contract"]["scenes"][0].update(claim_ids=["unknown"]),
            lambda b: b["story_contract"]["scenes"][-1].update(role="mechanism"),
        ]:
            b=copy.deepcopy(self.board);mutate(b)
            self.assertTrue(d.structure_problems(b,self.claims))
        self.report["reviewer_identity"]="test-director"
        self.assertTrue(d.review_problems(self.board,self.report))

    def test_changed_quote_or_spoken_text_fails_before_voice(self):
        self.claims["claims"][0]["quote"]="The city halted all notices."
        self.cp.write_text(json.dumps(self.claims))
        self.assertIn("source evidence changed", " ".join(d.pre_voice_problems(self.bp,self.cp)))
        self.assertIn("spoken script differs", " ".join(d.pre_voice_problems(self.bp,self.cp,"Another script.")))

    def test_preview_refuses_before_reservation(self):
        import preflight_animatic as p
        self.board.pop("story_contract");self.save()
        with patch.object(p.subprocess,"run") as cmd, patch("engine_lint.check_files",return_value=[]), \
             patch("super_evidence_check.check",return_value=([],None)), patch("run_controller.reserve") as reserve, patch.object(d,"catalog_problems",return_value=[]):
            cmd.return_value.returncode=0
            with self.assertRaisesRegex(RuntimeError,"no animatic was spent"):
                p.render(self.bp,self.root/"preview.mp4",self.root/"state.json",self.cp)
            reserve.assert_not_called()
            self.assertEqual(1,cmd.call_count)  # only the cheap board check

    def test_synthesis_entry_refuses_without_provider_spend(self):
        import vo_synth_gemini as v
        self.board.pop("story_contract");self.save()
        with patch.object(v,"synth_one") as synth, contextlib.redirect_stderr(io.StringIO()):
            result=v.run("The city sends notices.",{},self.root/"takes",1,"Kore","test-placeholder",
                         evidence_dir=self.root)
            self.assertEqual(1,result)
            synth.assert_not_called()
        self.assertFalse((self.root/"takes/takes.json").exists())

    def test_missing_claims_cannot_skip_the_synthesis_gate(self):
        import vo_synth_gemini as v
        self.cp.unlink()
        with patch.object(v,"synth_one") as synth, contextlib.redirect_stderr(io.StringIO()):
            result=v.run(" ".join(s["vo"] for s in self.board["scenes"]),{},self.root/"takes",
                         1,"Kore","test-placeholder",evidence_dir=self.root)
            self.assertEqual(1,result)
            synth.assert_not_called()

    def test_catalog_rejects_stale_module_and_unknown_action(self):
        self.assertEqual([],d.catalog_problems())
        catalog=d.read(d.CATALOG)
        catalog["actions"][0]["module"]["sha256"]="0"*64
        self.assertTrue(d.catalog_problems(catalog))
        self.board["cinema"]["dimensional_scene_ids"]=["action"]
        self.board["scenes"][0]["production_action"]="unknown"
        self.assertTrue(d.action_problems(self.board))

    def test_shared_module_is_in_current_renderer_digest(self):
        files=critic_gate.renderer_files(self.board)
        self.assertIn(d.REPO/"video-engine/src/lib/production/ProvenActions.tsx",files)
        baseline=critic_gate.renderer_digest(self.board)
        original=Path.read_bytes
        def changed(path):
            raw=original(path)
            return raw+b"\n// changed contact" if path.name=="ProvenActions.tsx" else raw
        with patch.object(Path,"read_bytes",changed):
            self.assertNotEqual(baseline,critic_gate.renderer_digest(self.board))

    def test_packet_is_compact_and_does_not_copy_history(self):
        state=self.root/"run_state.json"
        state.write_text(json.dumps({"usage":{"full_renders":1},"phase":"boarding","events":["x"*100000]}))
        packet=d.packet(self.bp,self.cp,"storyboard-critic",state)
        encoded=json.dumps(packet)
        self.assertLess(len(encoded),d.policy()["handoff_max_chars"])
        self.assertNotIn("events",encoded)
        with self.assertRaises(ValueError):
            d.packet(self.bp,self.cp,"picture")

    def test_current_craft_readings_are_bound_compact_and_keep_historical_packets(self):
        self.assertNotIn("craft_readings", d.packet(self.bp,self.cp,"storyboard-critic"))
        self.assertEqual([], d.craft_reading_paths({"date":"test-fixture"}))
        self.board.update(date="2026-10-03", creative_direction={
            "medium_choice":"News report; Explanatory animation. The same source sample carries the explanation."})
        self.save()
        packet=d.packet(self.bp,self.cp,"storyboard-critic")
        paths=[Path(row["path"]) for row in packet["craft_readings"]]
        self.assertIn(d.REPO/"knowledge/craft/visual-storytelling/viewer-plan.md", paths)
        self.assertIn(d.REPO/"knowledge/craft/visual-storytelling/explanatory-animation.md", paths)
        self.assertNotIn(d.REPO/"knowledge/craft/visual-storytelling/cinematic-scene.md", paths)
        for row in packet["craft_readings"]:
            self.assertEqual(d.digest(row["path"]), row["sha256"])
        self.assertEqual(d.story_digest(self.board), packet["story_sha256"])
        self.assertLess(len(json.dumps(packet)), d.policy()["handoff_max_chars"])
        self.assertNotIn("craft_readings", d.packet(self.bp,self.cp,"validator"))
        self.board["creative_direction"]["medium_choice"]="An unnamed illustrative treatment."
        self.assertEqual(7,len(d.craft_reading_paths(self.board)))

    def test_oversized_story_details_use_the_exact_bound_board_without_dropping_review(self):
        self.board["story_contract"]["scenes"] = [{"observation": "source-backed sequence " * 700}]
        self.board["story_contract"]["transitions"] = [{"observation": "same subject " * 700}]
        self.save()
        packet = d.packet(self.bp,self.cp,"storyboard-critic")
        self.assertLess(len(json.dumps(packet, indent=2)), d.policy()["handoff_max_chars"])
        self.assertEqual({"reference":"board", "field":"story_contract"}, packet["story_detail"])
        self.assertEqual(d.digest(self.bp), packet["board"]["sha256"])
        self.assertEqual(d.story_digest(self.board), packet["story_sha256"])
        self.assertEqual(self.board["story_contract"]["opening_question"], packet["story"]["opening_question"])
        self.assertIn("including scenes and transitions", packet["instructions"])
        self.assertNotIn("scenes", packet["story"])

    def test_explicit_second_run_guide_opt_in_preserves_first_edition(self):
        self.board["date"]="2026-10-02"
        self.board.setdefault("creative_direction",{})["medium_choice"]="Educational explainer / Explanatory animation"
        self.assertEqual([],d.craft_reading_paths(self.board))
        self.board["creative_direction"]["medium_choice"] += "; owner requested viewer-plan.md early"
        names={p.name for p in d.craft_reading_paths(self.board)}
        self.assertEqual({"viewer-plan.md","README.md","news-reporting.md","explanatory-animation.md"},names)

    def test_scoreboard_keeps_failed_editions_and_honest_unknown_account_usage(self):
        run=self.root/"2026-09-28";run.mkdir()
        (run/"run_state.json").write_text(json.dumps({"run_id":"2026-09-28","phase":"active_repair",
            "usage":{"full_renders":2,"panel_rounds":2,"reported_tokens":1234}}))
        row=d.scoreboard(self.root)["editions"][0]
        self.assertFalse(row["shipped"])
        self.assertIn("full_renders",row["over_targets"])
        self.assertIsNone(row["account_tokens"])

    def test_measurement_window_includes_active_state_and_stops_after_five_shipments(self):
        for day in range(28, 31):
            run=self.root/f"2026-09-{day}";run.mkdir()
            (run/"run_state.json").write_text(json.dumps({"run_id":run.name,"terminal_state":"shipped"}))
        for day in range(1, 5):
            run=self.root/f"2026-10-{day:02}";run.mkdir()
            (run/"run_state.json").write_text(json.dumps({"run_id":run.name,"terminal_state":"shipped"}))
        rows=d.scoreboard(self.root)
        self.assertEqual(5,rows["shipped_count"])
        self.assertEqual("2026-10-02",rows["editions"][-1]["run_id"])
        second=self.root/"second.json"
        second.write_text(json.dumps({"run_id":"2026-10-02-second","phase":"research"}))
        extra=d.scoreboard(self.root,second)
        self.assertEqual(5,extra["shipped_count"])
        self.assertEqual("2026-10-02-second",extra["editions"][-1]["run_id"])
        self.assertFalse(extra["editions"][-1]["shipped"])
        active=self.root/"active.json"
        active.write_text(json.dumps({"run_id":"2026-09-29","updated_at":"later","phase":"active_repair"}))
        rows=d.scoreboard(self.root,active)
        self.assertEqual(6,len(rows["editions"]))
        self.assertFalse(rows["editions"][1]["shipped"])
        self.assertFalse(d.required({"date":"test-fixture"}))

    def test_source_example_disclosure_reaches_the_actual_scene(self):
        cut=self.board["story_contract"]["transitions"][0]
        cut.update(kind="source-example",disclosure="A separate published example")
        self.assertTrue(d.structure_problems(self.board,self.claims))
        self.board["scenes"][1]["production_disclosure"]=cut["disclosure"]
        self.assertEqual([],d.structure_problems(self.board,self.claims))


    def test_candidate_fit_stops_unsupported_mechanisms_before_voice(self):
        import story_selection_check as selection
        candidate=selection_fixture()
        self.assertEqual([],selection.problems(candidate))
        candidate["selected"]["filmability"]["action_support"][0]["action_id"]="unproven-human-rig"
        self.assertTrue(selection.problems(candidate))
        (self.root/"story_selection.json").write_text(json.dumps(candidate))
        self.assertTrue(d.pre_voice_problems(self.bp,self.cp))
        (self.root/"story_selection.json").unlink()
        self.assertIn("candidate selection", " ".join(d.pre_voice_problems(self.bp,self.cp)))

    def test_candidate_footage_needs_actual_asset_inspection_and_rights(self):
        candidate=selection_fixture()["selected"]
        row=candidate["filmability"]["action_support"][-1]
        row.update(medium="source-footage",asset_url="https://example.org/clip")
        self.assertTrue(d.candidate_problems(candidate))
        candidate["filmability"]["asset_leads"]=[{"url":row["asset_url"],
            "inspection":"Actual fixture description of visible action and its limits.",
            "rights_basis":"Explicit synthetic permission evidence for this test fixture only."}]
        self.assertEqual([],d.candidate_problems(candidate))
        candidate["filmability"]["action_support"][0]["source_url"]="https://example.org/not-fetched"
        self.assertTrue(d.candidate_problems(candidate))

    def test_shipped_history_is_exempt(self):
        self.assertEqual([],d.pre_voice_problems(d.REPO/"runs/2026-09-26/storyboard.json",
                                                d.REPO/"runs/2026-09-26/claims.json"))


class StoryVisualTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.runs = Path(self.temp.name)
        prior = self.runs / "2026-09-26"
        prior.mkdir()
        (prior / "dispatch.mp4").write_bytes(b"fixture")
        (prior / "storyboard.json").write_text(json.dumps({"native_media": [
            {"file": "evidence/old.mp4", "sha256": "a"*64,
             "source_url": "https://example.org/clip/7013390/"}]}))
        self.board = {"date": "2026-09-29", "scenes": [{"id": "site", "vo_claims": ["c1"]}],
            "visual_research": {"searches": [{"query": "actual facility official media",
                "finding": "The official operator page shows the named physical site."}],
                "candidates": [], "decision": "No reusable footage adds information; use the source-bound explanatory action."}}

    def media(self):
        self.board["native_media"] = [{"file": "evidence/site.png", "sha256": "b"*64,
            "source_url": "https://example.org/current-site", "story_role": "actual-site",
            "subject": "The reported operator's named physical facility.",
            "relevance": "The image identifies the specific facility discussed in claim c1.",
            "inspection": "The source caption and pictured sign identify the same physical site.",
            "rights_basis": "Fixture operator permission explicitly permits publication of this photo.",
            "scene_ids": ["site"], "claim_ids": ["c1"]}]
        self.board["visual_research"]["candidates"] = [{"url": "https://example.org/current-site",
            "decision": "use", "reason": "It shows the actual physical site named by the source."}]
        return self.board["native_media"][0]

    def test_no_useful_asset_can_move_on(self):
        self.assertEqual([], d.visual_problems(self.board, self.runs))
        self.board.pop("visual_research")
        self.assertTrue(d.visual_problems(self.board, self.runs))

    def test_actual_site_still_passes_and_generic_unbound_media_fails(self):
        item = self.media()
        self.assertEqual([], d.visual_problems(self.board, self.runs))
        item["story_role"] = "mood"
        self.assertTrue(d.visual_problems(self.board, self.runs))
        item["story_role"] = "actual-site"; item["claim_ids"] = ["invented"]
        self.assertTrue(d.visual_problems(self.board, self.runs))

    def test_reuse_rejected_across_gap_and_crop_or_rename(self):
        item = self.media(); item["sha256"] = "a"*64
        self.assertIn("previous shipped", " ".join(d.visual_problems(self.board, self.runs)))
        item["sha256"] = "b"*64
        item["source_url"] = "https://example.org/clip/7013390?utm_source=new#crop"
        self.assertIn("previous shipped", " ".join(d.visual_problems(self.board, self.runs)))
        item["source_url"] = "https://example.org/current-site"; item["original_sha256"] = "a"*64
        self.assertIn("previous shipped", " ".join(d.visual_problems(self.board, self.runs)))

    def test_second_same_day_edition_checks_the_first_shipped_assets(self):
        first=self.runs/"2026-09-29"
        first.mkdir()
        (first/"dispatch.mp4").write_bytes(b"first shipped film")
        (first/"storyboard.json").write_text(json.dumps({"native_media":[{"sha256":"c"*64}]}))
        self.board["run_id"]="2026-09-29-second"
        item=self.media();item["sha256"]="c"*64
        self.assertIn("previous shipped", " ".join(d.visual_problems(self.board,self.runs)))
        item["sha256"]="b"*64
        self.assertEqual([], d.visual_problems(self.board,self.runs))
        self.board["run_id"]="2026-09-28-second"
        self.assertTrue(d.visual_problems(self.board,self.runs))

    def test_search_bounds_and_review_binding(self):
        before = d.story_digest(self.board)
        self.board["visual_research"]["decision"] += " Changed decision."
        self.assertNotEqual(before, d.story_digest(self.board))
        self.board["visual_research"]["searches"] *= 7
        self.assertTrue(d.visual_problems(self.board, self.runs))

    def test_current_repeated_reading_clip_fails_next_edition_gate(self):
        board = d.read(d.REPO / "runs/2026-09-28/storyboard.json")
        board["date"] = "2026-09-29"
        board["visual_research"] = self.board["visual_research"]
        self.assertIn("previous shipped", " ".join(d.structure_problems(board)))

    def test_missing_previous_inventory_fails_closed(self):
        (self.runs / "2026-09-26/storyboard.json").unlink()
        self.assertIn("inventory unavailable", " ".join(d.visual_problems(self.board, self.runs)))

    def test_historical_boards_remain_unchanged(self):
        self.board["date"] = "2026-09-28"; self.board.pop("visual_research")
        self.assertEqual([], d.visual_problems(self.board, self.runs))

def load_tests(loader, tests, pattern):
    from creative_production_test import CreativeTest
    tests.addTests(loader.loadTestsFromTestCase(CreativeTest))
    return tests


if __name__ == "__main__":
    unittest.main()
