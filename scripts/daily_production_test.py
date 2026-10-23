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

    def test_final_scorer_packet_rejects_retained_prior_film_feed_sheet(self):
        for name in ("film.mp4", "feed-composite.png", "attention-review.html", "cinema/picture-review.json"):
            path = self.root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text("fixture " + name)
        report = self.root / "feed-composite.json"
        evidence = {"schema": "dispatch_feed_composite/1", "pass": True,
                    "film_sha256": d.digest(self.root / "film.mp4"),
                    "contact_sheet_sha256": d.digest(self.root / "feed-composite.png")}
        report.write_text(json.dumps(evidence))
        self.assertEqual(d.digest(self.root / "feed-composite.png"),
                         d.packet(self.bp, self.cp, "picture")["feed"]["sha256"])
        for key in ("film_sha256", "contact_sheet_sha256", "pass"):
            changed = dict(evidence)
            changed[key] = False if key == "pass" else "0" * 64
            report.write_text(json.dumps(changed))
            with self.subTest(key=key), self.assertRaisesRegex(ValueError, "exact current film"):
                d.packet(self.bp, self.cp, "picture")
        report.unlink()
        with self.assertRaisesRegex(ValueError, "missing or unreadable"):
            d.packet(self.bp, self.cp, "picture")

    def test_preship_builds_feed_sheet_from_the_same_final_film_before_panel(self):
        import preship_check
        commands = dict(preship_check.gates(self.bp, self.cp, self.root / "vo_script.txt",
                        self.root / "captions.json", self.root / "mix.json",
                        self.root / "sfx_events.json", self.root / "run_state.json"))
        command = commands["feed_composite"]
        for option, filename in (("--film", "film.mp4"), ("--board", "storyboard.json"),
                                 ("--manifest", "render-manifest.json"),
                                 ("--out", "feed-composite.png"), ("--report", "feed-composite.json")):
            self.assertEqual(str(self.root / filename), command[command.index(option) + 1])

    def final_feed_fixture(self):
        for name in ('film.mp4', 'attention-review.html', 'cinema/picture-review.json',
                     'cinema/story-review.json', 'cinema/sound-review.json'):
            path = self.root / name; path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text('Fixture ' + name)
        feed = self.root / 'supplemental' / 'feed-current-film.png'
        feed.parent.mkdir(); feed.write_text('Current film contact sheet fixture')
        evidence = {'schema': 'dispatch_feed_composite/1', 'pass': True,
                    'film_sha256': d.digest(self.root / 'film.mp4'),
                    'contact_sheet_sha256': d.digest(feed)}
        feed.with_suffix('.json').write_text(json.dumps(evidence))
        return feed, evidence

    def test_unique_current_feed_binds_all_final_roles_without_replacing_old_evidence(self):
        feed, evidence = self.final_feed_fixture()
        old_feed = self.root / 'feed-composite.png'; old_feed.write_text('Original prior film sheet')
        old_report = old_feed.with_suffix('.json'); old_report.write_text(json.dumps(
            dict(evidence, film_sha256='0'*64, contact_sheet_sha256=d.digest(old_feed))))
        original = old_feed.read_bytes(), old_report.read_bytes()
        for role in ('picture', 'story', 'sound'):
            with self.subTest(role=role):
                data = d.packet(self.bp, self.cp, role, feed_path=feed)
                self.assertEqual(data['feed'], {'path': str(feed.resolve()), 'sha256': d.digest(feed)})
                self.assertEqual(original, (old_feed.read_bytes(), old_report.read_bytes()))
                with self.assertRaisesRegex(ValueError, 'exact current film'):
                    d.packet(self.bp, self.cp, role)

    def test_unique_feed_requires_current_film_sheet_and_paired_report(self):
        feed, evidence = self.final_feed_fixture()
        report = feed.with_suffix('.json')
        for key in ('film_sha256', 'contact_sheet_sha256', 'pass'):
            with self.subTest(key=key):
                report.write_text(json.dumps(dict(evidence, **{key: False if key == 'pass' else '0'*64})))
                with self.assertRaisesRegex(ValueError, 'exact current film'):
                    d.packet(self.bp, self.cp, 'sound', feed_path=feed)
        report.unlink()
        with self.assertRaisesRegex(ValueError, 'missing or unreadable'):
            d.packet(self.bp, self.cp, 'sound', feed_path=feed)

    def test_unique_feed_cannot_escape_board_package_or_alias_paired_report(self):
        feed, evidence = self.final_feed_fixture()
        outside = self.root.parent / (self.root.name + '-outside.png')
        outside.write_bytes(feed.read_bytes())
        outside.with_suffix('.json').write_text(json.dumps(evidence))
        self.addCleanup(outside.unlink); self.addCleanup(outside.with_suffix('.json').unlink)
        with self.assertRaisesRegex(ValueError, 'actual board package'):
            d.packet(self.bp, self.cp, 'picture', feed_path=outside)
        for target in (feed, feed.with_suffix('.json')):
            original = target.read_bytes(); target.unlink()
            target.symlink_to(outside if target == feed else outside.with_suffix('.json'))
            with self.assertRaisesRegex(ValueError, 'actual board package'):
                d.packet(self.bp, self.cp, 'picture', feed_path=feed)
            target.unlink(); target.write_bytes(original)

    def test_unique_feed_is_rejected_for_nonfinal_packet_roles_and_cli_actions(self):
        feed, _ = self.final_feed_fixture()
        for role in ('validator', 'scene-builder', 'storyboard-critic', 'vo-director'):
            with self.subTest(role=role), self.assertRaisesRegex(ValueError, 'only to a final'):
                d.packet(self.bp, self.cp, role, feed_path=feed)
        for extra in ([], ['--packet', 'validator'], ['--packet', 'picture', '--digest'],
                      ['--packet', 'sound', '--scoreboard'], ['--catalog-check'], ['--structure-only']):
            with self.subTest(extra=extra), patch('sys.argv', ['daily_production.py', '--feed', str(feed), *extra]), \
                    contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit) as error:
                d.main()
            self.assertEqual(error.exception.code, 2)

    def test_unique_feed_cli_writes_the_same_bound_final_packet(self):
        feed, _ = self.final_feed_fixture()
        out = self.root / 'sound-packet.json'
        args = ['daily_production.py', '--board', str(self.bp), '--claims', str(self.cp),
                '--packet', 'sound', '--feed', str(feed), '--out', str(out)]
        with patch('sys.argv', args), contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(d.main(), 0)
        self.assertEqual(json.loads(out.read_text())['feed'],
                         {'path': str(feed.resolve()), 'sha256': d.digest(feed)})

    def structure_cli(self, *extra):
        args = ["daily_production.py", "--board", str(self.bp), "--claims", str(self.cp),
                "--structure-only", *extra]
        output = io.StringIO()
        with patch("sys.argv", args), contextlib.redirect_stdout(output):
            result = d.main()
        return result, output.getvalue()

    def test_structure_precheck_runs_before_any_independent_report_exists(self):
        (self.root/"storyboard_critic.json").unlink()
        with patch.object(d, "pre_voice_problems", side_effect=AssertionError("no late review")):
            result, output = self.structure_cli()
        self.assertEqual(0, result)
        self.assertIn("independent review still required", output)

    def test_structure_precheck_refuses_observed_role_and_source_defects(self):
        for label, mutate, message in [
            ("missing consequence", lambda b: b["story_contract"]["scenes"][2].update(role="evidence"),
             "story needs a human consequence and a closing answer"),
            ("missing answer", lambda b: b["story_contract"]["scenes"][-1].update(role="limit"),
             "story needs a human consequence and a closing answer"),
            ("unknown claim", lambda b: b["story_contract"]["scenes"][0].update(claim_ids=["c9"]),
             "VERIFIED source bindings"),
            ("missing scene claim", lambda b: b["scenes"][0].update(vo_claims=["c9"]),
             "omits claims used by its actual scene"),
            ("scene order", lambda b: b["story_contract"]["scenes"].reverse(),
             "current scene order exactly once"),
        ]:
            with self.subTest(label=label):
                changed = copy.deepcopy(self.board); mutate(changed)
                self.bp.write_text(json.dumps(changed))
                result, output = self.structure_cli()
                self.assertEqual(1, result)
                self.assertIn(message, output)

    def test_structure_mode_cannot_be_silently_overridden_by_another_action(self):
        for args in (("--digest",), ("--packet", "storyboard-critic"), ("--scoreboard",)):
            with self.subTest(args=args), contextlib.redirect_stderr(io.StringIO()):
                with self.assertRaises(SystemExit) as error:
                    self.structure_cli(*args)
                self.assertEqual(2, error.exception.code)

    def test_picture_precheck_checks_story_before_paid_critique(self):
        import picture_precheck
        tasks = dict(picture_precheck.checks(self.bp, self.cp))
        self.assertEqual(["python", "scripts/daily_production.py", "--board", str(self.bp.resolve()),
                          "--claims", str(self.cp.resolve()), "--structure-only"],
                         tasks["story_structure"])
        self.assertIn("script_evidence", tasks)
        self.assertIn("caption_fit", tasks)

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

    def test_source_credit_numerals_fail_before_voice_and_accept_a_complete_quote(self):
        self.board.update(date="2026-10-22", credits="SOURCES\nDroneLife, March 14th, 2025")
        self.save()
        self.assertTrue(any("credits:" in e for e in d.pre_voice_problems(self.bp, self.cp)))
        self.claims["claims"][0]["quote"] += " Published March 14, 2025."
        self.cp.write_text(json.dumps(self.claims))
        self.assertFalse(any("credits:" in e for e in d.pre_voice_problems(self.bp, self.cp)))

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

    def test_literal_clause_examples_reach_future_builder_and_critic_packets_only(self):
        import modern_film
        for edition in ('2026-10-21', '2026-10-22'):
            self.board['date'] = edition; self.save()
            # The tiny board tests packet instructions; it has no paid worker or authored assets.
            with patch('agent_runtime.assignment', return_value=None):
                for role in ('scene-builder', 'storyboard-critic', 'validator'):
                    packet = d.packet(self.bp, self.cp, role)
                    with patch.object(modern_film, 'literal_clause_instruction', return_value=''):
                        prior = d.packet(self.bp, self.cp, role)
                    expected = (modern_film.literal_clause_instruction(self.board)
                                if role != 'validator' else '')
                    self.assertEqual(packet['instructions'], prior['instructions'] + expected)
                    self.assertEqual(set(packet), set(prior))
                    self.assertLessEqual(len(d.packet_text(packet)), d.handoff_limit(edition, False))
                    if expected:
                        for phrase in ('AI alerts', 'spoken date', '"approved"', 'Air Max',
                                       'callable source', 'chronological pixels', 'no review, report field'):
                            self.assertIn(phrase, packet['instructions'])

    def test_future_critic_packet_generates_bound_reading_view_without_replacing_board(self):
        import review_board_projection as views
        from review_board_projection_test import retained_board
        self.board.update(date='2026-10-22', narration_picture=retained_board()['narration_picture'])
        self.save(); before = self.bp.read_bytes()
        with patch('agent_runtime.assignment', return_value=None):
            packet = d.packet(self.bp, self.cp, 'storyboard-critic')
        self.assertEqual(packet['board']['sha256'], d.digest(self.bp))
        self.assertIn(packet['board']['sha256'], packet[views.FIELD])
        self.assertEqual(views.validate_native(packet), views.NATIVE_NOTE)
        self.assertEqual(before, self.bp.read_bytes())

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

    def test_adopted_narration_capacity_is_bound_in_actual_worker_readings(self):
        state = self.bp.parent / 'run_state.json'
        state.write_text(json.dumps({'events': [{'kind': 'autonomous_completion_narration_adopted'},
                                               {'kind': 'autonomous_completion_validation_adopted'}],
                                     'run_id': '2026-10-15', 'usage': {}, 'phase': 'active_repair'}))
        self.board['date'] = '2026-10-15'; self.save()
        packet = d.packet(self.bp, self.cp, 'vo-director', state)
        amendment = d.REPO / 'config/autonomous_completion_narration_v1.json'
        self.assertIn({'path': str(amendment.resolve()), 'sha256': d.digest(amendment)},
                      packet['completion_readings'])
        amendment = d.REPO / 'config/source_validation_completion_v1.json'
        self.assertIn({'path': str(amendment.resolve()), 'sha256': d.digest(amendment)},
                      packet['completion_readings'])

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

class LosslessScorerTransport(unittest.TestCase):
    def current(self, role='picture'):
        return {'role':role, 'date':'2026-10-15',
            'instructions':'Read every guide, page and timed observation. ' * 20,
            'motion_sequence':{'path':'/owned/current/motion-review/index.json','sha256':'a'*64},
            'image_read_policy':{'images_per_model_step':1,'missing_image':'return partial'},
            'craft_readings':[{'path':'/owned/current/knowledge/craft/guide-'+str(n)+'.md',
                               'sha256':str(n % 10)*64} for n in range(61)],
            'story':{'reference':'board','field':'story_contract'}}

    def test_layout_only_compression_preserves_every_value_and_the_unchanged_cap(self):
        self.assertEqual(10000,d.policy()['handoff_max_chars'])
        # The dated Claude scorer cap leaves every other role and date on the shared cap.
        self.assertEqual(10000,d.handoff_limit('2026-10-19',False))
        self.assertEqual(10000,d.handoff_limit('2026-10-18',True))
        self.assertEqual(12000,d.handoff_limit('2026-10-19',True))
        for role in ('picture','story','sound'):
            data=self.current(role); original=copy.deepcopy(data)
            self.assertGreater(len(json.dumps(data,indent=2)),10000)
            text=d.packet_text(data)
            self.assertLessEqual(len(text),10000)
            self.assertEqual(original,json.loads(text)); self.assertEqual(original,data)

    def test_current_storyboard_critic_packet_uses_the_same_lossless_transport(self):
        data=self.current('storyboard-critic'); original=copy.deepcopy(data)
        data.pop('motion_sequence'); data.pop('image_read_policy'); original=copy.deepcopy(data)
        self.assertGreater(len(json.dumps(data,indent=2)),10000)
        text=d.packet_text(data)
        self.assertLessEqual(len(text),10000)
        self.assertEqual(original,json.loads(text)); self.assertEqual(original,data)
        data['date']='2026-10-14'
        self.assertEqual(json.dumps(data,indent=2)+'\n',d.packet_text(data))
        data['date']='2026-10-15'; data['instructions']='x'*11000
        self.assertGreater(len(d.packet_text(data)),10000)

    def test_codex_builder_layout_excess_preserves_complete_bound_packet(self):
        import agent_runtime
        root = Path('/owned/current')
        data = self.current('scene-builder')
        data.pop('motion_sequence'); data.pop('image_read_policy')
        data['local_recovery'] = {'runtime':'codex', 'run_id':'2026-10-21', 'epoch':'actual-owner-epoch'}
        data['date'] = '2026-10-21'
        data['board'] = {'path':str(root/'out/dispatch/storyboard.json'), 'sha256':'b'*64}
        data['treatments'] = [{'path':str(root/('out/dispatch/opening-'+v+'.json')), 'sha256':v*64}
                              for v in ('a','b')]
        with patch.object(agent_runtime,'REPO',root):
            compact = agent_runtime.compact_packet_bindings(data)
            # Actual observed builder packet: 10570 layout characters, below 10000 without layout.
            data['instructions'] += 'x' * (10569-len(json.dumps(compact,indent=2)))
            original = copy.deepcopy(data); expected = agent_runtime.compact_packet_bindings(data)
            self.assertEqual(10570,len(json.dumps(expected,indent=2)+'\n'))
            encoded = d.packet_text(data)
            self.assertLessEqual(len(encoded),10000)
            self.assertEqual(expected,json.loads(encoded))
            self.assertEqual(original,data)
            self.assertEqual(original['craft_readings'],agent_runtime.expand_packet_bindings(json.loads(encoded))['craft_readings'])
            data['instructions'] += 'x'*10000
            self.assertGreater(len(d.packet_text(data)),10000)
            self.assertEqual(agent_runtime.compact_packet_bindings(data),json.loads(d.packet_text(data)))
        self.assertEqual(10000,d.policy()['handoff_max_chars'])

    def test_other_builder_runtimes_keep_existing_layout(self):
        data = self.current('scene-builder')
        data.pop('motion_sequence'); data.pop('image_read_policy')
        self.assertGreater(len(json.dumps(data,indent=2)),10000)
        self.assertEqual(json.dumps(data,indent=2)+'\n',d.packet_text(data))

    def test_small_and_historical_packets_keep_their_exact_original_serialization(self):
        small={'role':'picture','date':'2026-10-15','instructions':'Read all current guides.'}
        self.assertEqual(json.dumps(small,indent=2)+'\n',d.packet_text(small))
        for date in ('2026-10-09','2026-10-14'):
            data=self.current();data['date']=date
            self.assertEqual(json.dumps(data,indent=2)+'\n',d.packet_text(data))

    def test_real_payload_excess_remains_over_the_same_cap(self):
        data=self.current();data['instructions']='x'*11000
        self.assertGreater(len(d.packet_text(data)),d.policy()['handoff_max_chars'])
        self.assertEqual(data,json.loads(d.packet_text(data)))

    def test_cli_file_and_stdout_use_the_same_lossless_bounded_transport(self):
        data=self.current()
        with tempfile.TemporaryDirectory() as temp:
            target=Path(temp)/'picture.json'
            args=['daily_production','--packet','picture','--board','board.json','--claims','claims.json']
            with patch('sys.argv',args+['--out',str(target)]),patch.object(d,'packet',return_value=data):
                self.assertEqual(0,d.main())
            self.assertLessEqual(target.stat().st_size,10000)
            self.assertEqual(data,json.loads(target.read_text()))
            output=io.StringIO()
            with patch('sys.argv',args),patch.object(d,'packet',return_value=data),contextlib.redirect_stdout(output):
                self.assertEqual(0,d.main())
            self.assertEqual(target.read_text(),output.getvalue())


def load_tests(loader, tests, pattern):
    from creative_production_test import CreativeTest
    from art_direction_test import ArtDirectionTest
    from cinematic_learning_test import CinematicLearningTest
    tests.addTests(loader.loadTestsFromTestCase(CreativeTest))
    tests.addTests(loader.loadTestsFromTestCase(ArtDirectionTest))
    tests.addTests(loader.loadTestsFromTestCase(CinematicLearningTest))
    return tests


if __name__ == "__main__":
    unittest.main()
