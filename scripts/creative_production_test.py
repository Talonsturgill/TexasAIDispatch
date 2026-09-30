#!/usr/bin/env python3
"""Regression evidence only; fixture reviews never authorize a production film."""
import copy
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch
import numpy as np
from PIL import Image, ImageDraw
import creative_production as c
import production_quality as quality
import cinema_cache
import opening_compare
import run_controller
import preflight_animatic
from mix import background_direction, direct_events, mix


def fixture():
    note = "Fixture-only explicit source and visible consequence for this test."
    board = {"date": "2026-09-29", "reference_only": True, "cinematic_template": "editorial-v1", "runtime_s": 6,
             "story_contract": {"director_identity": "fixture-director"}, "native_media": [],
             "cinema": {"version": c.policy()["version"], "hero_scene_id": "s1", "hero_passage_end_scene_id": "s2",
                        "dimensional_scene_ids": [], **{k: note for k in ("visible_action", "human_consequence", "source_limit")}},
             "scenes": [], "quality_plan": {"scenes": []}}
    for i in range(2):
        sid = f"s{i+1}"
        board["scenes"].append({"id": sid, "start_s": i*3, "duration_s": 3, "vo": "The record reaches the reader.",
            "vo_claims": ["c1"], "planes": [], "camera_strategy": "sourcePicture", "visual_events": [{"id": sid+"-reveal", "at_s": .1, "duration_s": 1.2}],
            "picture": {"id": sid+"-picture", "medium": "diagram", "subject": note, "event_id": sid+"-reveal",
                        "disclosure": "Illustration", "relationship": "sequence", "nodes": [{"label": "record", "claim_id": "c1"}, {"label": "reader", "claim_id": "c1"}]},
            "visual_proof": {"mute_takeaway": note, "must_show": [{"concept": "record to reader", "item_ids": [sid+"-picture"]}]}})
        board["quality_plan"]["scenes"].append({"scene_id": sid, "medium": "diagram"})
    board["creative_direction"] = {"policy_sha256": c.digest(c.POLICY),
        **{k: note for k in ("viewer_question", "visible_answer", "emotional_turn", "medium_choice")},
        "edits": [{"scene_id": s["id"], "cut_after_event_id": s["id"]+"-reveal", **{k: note for k in ("enter_on", "leave_on", "next_connection")}} for s in board["scenes"]],
        "sound": {**{k: note for k in ("perspective", "music_arc", "voice_arc")}, "cues": [
            {"id": "s1-contact", "event_id": "s1-reveal", "role": "contact", "duration_s": .3, "intent": note, "provenance": note},
            {"id": "s2-quiet", "event_id": "s2-reveal", "role": "quiet", "duration_s": .6, "gain": 0, "intent": note, "provenance": note}]}}
    return board


class CreativeTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.board = fixture()

    def write(self, name, data):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data, indent=2)+"\n")
        return path


    def test_rejected_september29_treatment_fails_before_spend_for_new_editions(self):
        board = c.read(Path(__file__).resolve().parents[1] / "runs/2026-09-29/storyboard.json")
        self.assertEqual(c.treatment_problems(board), [])
        board["date"] = "2026-09-30"
        errors = c.treatment_problems(board)
        self.assertEqual(len(errors), 2)
        self.assertTrue(any("whole-film static" in e for e in c.plan_problems(board)))

    def test_visual_body_can_change_but_facts_and_clock_cannot(self):
        a = copy.deepcopy(self.board)
        a["date"] = "2026-09-30"
        b = copy.deepcopy(a)
        b["scenes"][1]["picture"]["subject"] = "A physically transferred original record reaches the reader."
        self.assertEqual(opening_compare.body(a), opening_compare.body(b))
        self.assertNotEqual(c.opening_digest(a), c.opening_digest(b))
        for key, value in (("vo", "A different claim."), ("vo_claims", ["other"]), ("duration_s", 7)):
            changed = copy.deepcopy(b)
            changed["scenes"][1][key] = value
            self.assertNotEqual(opening_compare.body(a), opening_compare.body(changed))
        b["date"] = a["date"] = "2026-09-29"
        self.assertNotEqual(opening_compare.body(a), opening_compare.body(b))
        self.assertEqual(c.opening_digest(a), c.opening_digest(b))

    def test_new_full_treatment_digest_survives_retiming(self):
        a = copy.deepcopy(self.board)
        a["date"] = "2026-09-30"
        b = copy.deepcopy(a)
        for scene in b["scenes"]:
            scene["start_s"] += 1
            scene["duration_s"] += .5
            scene["visual_events"][0]["at_s"] += .2
        self.assertEqual(c.opening_digest(a), c.opening_digest(b))

    def test_effective_date_preserves_old_policy(self):
        old = {"date": "2026-09-28"}
        self.assertFalse(c.required(old))
        self.assertEqual(quality.policy_path(old), quality.POLICY)
        self.assertEqual(quality.policy_path(self.board), c.POLICY)
        self.assertEqual(c.plan_problems(old), [])

    def test_no_dimensional_quota_but_complete_native_picture_coverage(self):
        self.assertEqual(quality.plan_problems(self.board), [])
        self.assertEqual(set(cinema_cache.sample_frames(self.board)), {"s1", "s2"})
        self.assertIn("every required picture", quality.stage_sample_problems(self.board, self.root, {})[0])
        self.board["cinema"]["dimensional_scene_ids"] = ["s1"]
        self.assertTrue(c.plan_problems(self.board))

    def test_each_non3d_scene_needs_real_picture_and_action_pixels(self):
        samples = {}
        for sid in ("s1", "s2"):
            pairs = []
            for i in range(3):
                normal = Image.new("RGB", (1080, 1920), "black")
                ImageDraw.Draw(normal).rectangle((50+i*250, 400, 450+i*250, 1400), fill="orange")
                normal.save(self.root/f"{sid}-{i}.png")
                Image.new("RGB", (1080, 1920), "black").save(self.root/f"{sid}-{i}-removed.png")
                pairs.append({k: {"file": n, "sha256": c.digest(self.root/n)} for k, n in
                              (("normal", f"{sid}-{i}.png"), ("without_stage", f"{sid}-{i}-removed.png"))})
            samples[sid] = pairs
        self.assertEqual(quality.stage_sample_problems(self.board, self.root, samples), [])
        samples["s2"][2] = samples["s2"][0]
        self.assertTrue(any("visibly develop" in e for e in quality.stage_sample_problems(self.board, self.root, samples)))

    def test_hold_never_licenses_static_opening_or_long_still(self):
        scene = self.board["scenes"][0]
        scene["intentional_hold"] = "Read the source detail before the next consequence."
        self.assertTrue(any("intentional hold" in e for e in c.plan_problems(self.board)))

    def test_native_samples_follow_designated_picture_event_not_entry(self):
        scene = self.board["scenes"][0]
        scene["visual_events"].insert(0, {"id": "entry", "at_s": 0, "duration_s": .25})
        self.assertEqual(cinema_cache.sample_frames(self.board)["s1"], [3, 21, 39])
        scene["picture"]["event_id"] = "missing"
        with self.assertRaisesRegex(ValueError, "principal-picture event"):
            cinema_cache.sample_frames(self.board)
        scene["picture"]["event_id"] = "s1-reveal"
        scene["visual_events"].append(copy.deepcopy(scene["visual_events"][1]))
        with self.assertRaisesRegex(ValueError, "unique"):
            cinema_cache.sample_frames(self.board)

    def test_legacy_native_samples_keep_first_event_pair(self):
        board = copy.deepcopy(self.board)
        board["date"] = "2026-09-28"
        board["cinema"]["dimensional_scene_ids"] = ["s1"]
        board["scenes"][0]["visual_events"].insert(0, {"id": "entry", "at_s": 0, "duration_s": .25})
        self.assertEqual(cinema_cache.sample_frames(board), {"s1": [0, 8]})

    def test_native_reveal_keeps_baseline_and_requires_midpoint_and_result(self):
        board = copy.deepcopy(self.board); board["scenes"] = board["scenes"][:1]
        blank = np.zeros((100, 100, 3), dtype=float)
        full = blank.copy(); full[10:70, 10:70] = 100
        tiny = blank.copy(); tiny[10:15, 10:15] = 100
        pictures = [blank, full, full]
        samples = {"s1": [{k: {"index": i, "kind": k} for k in ("normal", "without_stage")}
                          for i in range(3)]}
        def pixels(item):
            return pictures[item["index"]] if item["kind"] == "normal" else blank
        with patch.object(quality, "asset", side_effect=lambda root, item: item), \
             patch.object(quality, "image", side_effect=pixels), \
             patch.object(quality, "scheduled_frame", return_value=full):
            observations=[]
            self.assertEqual(quality.stage_sample_problems(board, self.root, samples,
                                                           observations=observations), [])
            self.assertEqual([v["phase"] for v in observations], ["onset", "midpoint", "completion"])
            self.assertEqual(observations[0]["visible_pixel_share"], 0)
            self.assertFalse(observations[0]["occupancy_required"])
            self.assertTrue(all(v["occupancy_required"] for v in observations[1:]))
            # Even the exempt onset must match the actual film, not an invented baseline.
            self.assertTrue(any("final pixels" in e for e in quality.stage_sample_problems(
                board, self.root, samples, film=Path("fixture"))))
            for index, bad in ((1, blank), (2, blank), (1, tiny), (2, tiny)):
                pictures[index]=bad
                with self.subTest(index=index, tiny=bad is tiny):
                    self.assertTrue(any("too little visible" in e for e in
                        quality.stage_sample_problems(board, self.root, samples)))
                pictures[index]=full
            samples["s1"].pop()
            self.assertTrue(any("complete principal-picture" in e for e in
                quality.stage_sample_problems(board, self.root, samples)))

    def test_missing_source_asset_and_false_medium_fail(self):
        self.board["quality_plan"]["scenes"][0]["medium"] = "source-still"
        self.board["scenes"][0]["picture"].update(medium="source-still", file="evidence/missing.png", sha256="a"*64)
        self.assertTrue(any("exact inspected source" in e for e in c.plan_problems(self.board)))
        self.board["scenes"][0]["picture"]["medium"] = "diagram"
        self.assertTrue(any("differs from" in e for e in c.plan_problems(self.board)))

    def test_diagram_relationship_requires_an_explicit_meaning(self):
        picture = self.board["scenes"][0]["picture"]
        for valid in ("parallel", "sequence"):
            picture["relationship"] = valid
            self.assertEqual(c.plan_problems(self.board), [])
        for invalid in ("", "causal", None):
            picture["relationship"] = invalid
            self.assertTrue(any("source semantics" in e for e in c.plan_problems(self.board)))

    def test_static_source_framing_rejects_nonfinite_and_excessive_offsets(self):
        scene = self.board["scenes"][0]
        picture = scene["picture"]
        picture.update(medium="source-excerpt", file="evidence/example.png", sha256="a"*64,
                       focus={"x": 10, "y": 40, "width": 60, "height": 10},
                       source_stage={"x": 60, "y": 300, "width": 830, "height": 940})
        self.board["native_media"] = [{"file": picture["file"], "sha256": picture["sha256"]}]
        self.board["quality_plan"]["scenes"][0]["medium"] = "source-excerpt"
        picture["source_transform"] = {"scale": 1, "translate_x": -55, "translate_y": -280}
        self.assertEqual(c.plan_problems(self.board), [])
        for key, value in (("scale", float("nan")), ("translate_y", -501), ("translate_x", True), ("scale", 3)):
            old = picture["source_transform"][key]
            picture["source_transform"][key] = value
            self.assertTrue(any("finite bounded" in e for e in c.plan_problems(self.board)))
            picture["source_transform"][key] = old

    def test_source_stage_prevents_header_caption_and_feed_overprint(self):
        scene = self.board["scenes"][0]
        picture = scene["picture"]
        picture.update(medium="source-excerpt", file="evidence/example.png", sha256="a"*64,
                       focus={"x": 10, "y": 40, "width": 60, "height": 10},
                       source_stage={"x": 60, "y": 300, "width": 830, "height": 940})
        self.board["native_media"] = [{"file": picture["file"], "sha256": picture["sha256"]}]
        self.board["quality_plan"]["scenes"][0]["medium"] = "source-excerpt"
        self.assertEqual(c.plan_problems(self.board), [])
        for key, value in (("y", 0), ("height", 1300), ("width", 1080), ("x", float("nan"))):
            previous = picture["source_stage"][key]
            picture["source_stage"][key] = value
            self.assertTrue(any("exclude" in e for e in c.plan_problems(self.board)))
            picture["source_stage"][key] = previous
        picture["focus"]["y"] = 10
        self.assertTrue(any("inside its bounded" in e for e in c.plan_problems(self.board)))

    def test_hero_passage_and_edit_sequence_must_be_complete(self):
        self.board["cinema"]["hero_passage_end_scene_id"] = "missing"
        self.board["creative_direction"]["edits"].reverse()
        errors = c.plan_problems(self.board)
        self.assertTrue(any("hero" in e for e in errors))
        self.assertTrue(any("complete ordered" in e for e in errors))

    def test_edit_cannot_cut_before_its_picture_event_resolves(self):
        self.board["scenes"][0]["visual_events"][0]["duration_s"] = 4
        self.assertTrue(any("before the cut" in e for e in c.plan_problems(self.board)))

    def test_attention_events_bind_actual_source_picture_elements(self):
        from documentary_check import timeline
        self.board["attention_beats"] = []
        for scene in self.board["scenes"]:
            scene["visual_events"][0]["item_ids"] = [scene["picture"]["id"]]
            self.board["attention_beats"].append({"event_id": scene["picture"]["event_id"], "item_ids": [scene["picture"]["id"]],
                "change_type": "reveal", **{k: "Concrete fixture-only action description." for k in
                ("viewer_reward", "visible_change", "continuity_from", "sound_action")}})
        self.assertEqual(timeline(self.board)[1], [])
        self.board["scenes"][0]["visual_events"][0]["item_ids"] = ["invented"]
        self.assertTrue(timeline(self.board)[1])

    def test_tangible_stakes_bind_fetched_sources(self):
        selected = {"sources": [{"url": "https://example.org/source"}], "visual_stakes": {}}
        self.assertGreater(len(c.candidate_problems(selected)), 5)
        selected["visual_stakes"] = {k: "A concrete fixture subject changes with an observed consequence." for k in
                                    ("affected_person", "physical_subject", "visible_change", "consequence", "opening_question", "answer", "asset_fit")}
        selected["visual_stakes"]["source_urls"] = ["https://example.org/source"]
        self.assertEqual(c.candidate_problems(selected), [])
        selected["visual_stakes"]["source_urls"] = ["https://example.org/invented"]
        self.assertTrue(c.candidate_problems(selected))

    def test_voice_direction_reaches_current_arc_and_exact_spoken_emphasis(self):
        plan = {"sound_direction_sha256": c.fingerprint(self.board["creative_direction"]["sound"]),
                "lines": [{"intent": "Reveal the record's destination.", "energy": "Ease into the consequence.", "emphasis": "reaches the reader"} for _ in range(2)]}
        self.assertEqual(c.voice_problems(self.board, plan), [])
        from vo_synth_gemini import split_direction
        self.assertIn("Ease into the consequence", split_direction(plan))
        plan["lines"][0]["emphasis"] = "unspoken phrase"
        self.assertTrue(c.voice_problems(self.board, plan))
        plan["sound_direction_sha256"] = "stale"
        self.assertTrue(any("current sound" in e for e in c.voice_problems(self.board, plan)))

    def test_sound_execution_anchors_trims_fades_and_preserves_sample_clock(self):
        rate = 24000
        events = [{"id": "s1-contact", "event_id": "s1-reveal", "gain": .1, "_samples": np.ones(rate)}]
        prepared, cues = direct_events(self.board, events, rate)
        self.assertEqual(prepared[0]["at_s"], .1)
        self.assertEqual(len(prepared[0]["_samples"]), 7200)
        self.assertEqual(prepared[0]["_samples"][0], 0)
        self.assertEqual(prepared[0]["_samples"][1000], 1)
        envelope = background_direction(rate*6, rate, cues)
        self.assertEqual(envelope[round(3.4*rate)], 0)
        self.assertEqual(envelope[rate], 1)
        vo = .02*np.sin(2*np.pi*170*np.arange(rate*6)/rate)
        plain, _, _ = mix(vo, rate, [], 6)
        quiet, _, _ = mix(vo, rate, [], 6, sound_cues=cues)
        np.testing.assert_array_equal(plain, quiet)  # Voice is never silenced by background cues.
        played, _, _ = mix(vo, rate, prepared, 6, sound_cues=cues)
        silent, _, _ = mix(vo, rate, [{**prepared[0], "gain": 0}], 6, sound_cues=cues)
        self.assertEqual(len(played), len(vo))
        np.testing.assert_array_equal(plain, silent)
        self.assertGreater(np.max(np.abs(played-silent)), .001)
        bed = .02*np.sin(2*np.pi*330*np.arange(rate*6)/rate)
        audible, _, errors = mix(vo, rate, [], 6, bed=bed, bed_gap_db=18, bed_track_id="fixture-bed")
        contrasted, _, quiet_errors = mix(vo, rate, [], 6, bed=bed, bed_gap_db=18, bed_track_id="fixture-bed", sound_cues=cues)
        self.assertEqual(errors + quiet_errors, [])
        def tone_level(signal, hz):
            segment = signal[round(3.2*rate):round(3.6*rate)]
            return abs(np.sum(segment*np.exp(-2j*np.pi*hz*np.arange(len(segment))/rate)))
        self.assertGreater(tone_level(audible, 330)/tone_level(audible, 170), .01)
        self.assertLess(tone_level(contrasted, 330)/tone_level(contrasted, 170), .00001)

    def test_sound_drift_or_missing_clip_fails(self):
        report = {"sound_direction_sha256": c.mix_binding(self.board), "sound_cues": c.sound_timeline(self.board)}
        self.assertEqual(c.mix_problems(self.board, report), [])
        self.board["scenes"][0]["visual_events"][0]["at_s"] = .3
        self.assertTrue(c.mix_problems(self.board, report))
        with self.assertRaises(ValueError):
            direct_events(self.board, [], 24000)
        with self.assertRaises(ValueError):
            direct_events(self.board, [{"id": "s1-contact", "event_id": "s1-reveal", "_samples": np.zeros(2)}], 24000)

    def comparison_fixture(self):
        self.write("storyboard.json", self.board)
        options = []
        for i, key in enumerate(("a", "b")):
            b = copy.deepcopy(self.board)
            b["scenes"][0]["picture"]["nodes"][0]["label"] = "record" if i == 0 else "document"
            bp = self.write(f"openings/{key}.json", b)
            film = self.root/f"openings/{key}.mp4"
            film.write_bytes(b"explicit fixture bytes " + key.encode())
            options.append({"id": key, "concept_sha256": c.opening_digest(b),
                            "board": {"file": bp.name, "sha256": c.digest(bp)},
                            "film": {"file": film.name, "sha256": c.digest(film)}})
        self.write("run_state.json", {"run_id": "2026-09-29", "events": [{"kind": "reserved", "resources": {"preflight_renders": 1},
                     "preflight_identity": "fixture-batch", "note": "two opening comparison batch"}]})
        receipt = self.write("openings/comparison.json", {"options": options, "policy_sha256": c.digest(c.POLICY), "renderer_sha256": "fixture-renderer", "producer_sha256": c.opening_producer(),
                             "reservation": {"identity": "fixture-batch", "run_id": "2026-09-29", "event_index": 0}})
        with patch("preflight_animatic.inspect_animatic", return_value=({"schema": "dispatch_preflight/1"}, [])), \
             patch("critic_gate.renderer_digest", return_value="fixture-renderer"):
            opening_compare.inspect_options(receipt.parent, c.read(receipt))
        choice = {"comparison_sha256": c.digest(receipt), "selected": "a", "director_identity": "fixture-director", "reviewer_identity": "fixture-critic",
                  "reason": "Fixture-only observed difference in the first pictured relationship.",
                  "rejected_reason": "Fixture-only weaker opening misses the visible relationship.", "blocking_defects": []}
        self.write("openings/selection.json", choice)
        return choice

    def test_opening_inspections_measure_static_and_moving_exact_films(self):
        output = self.root / "openings"
        output.mkdir()
        options = []
        for key, source in (("a", "color=c=navy:s=270x480:r=10"),
                            ("b", "testsrc2=s=270x480:r=10")):
            board = {"runtime_s": 2, "scenes": [{"id": "s1", "start_s": 0,
                     "duration_s": 2, "beat": "motion"}]}
            bp = self.write(f"openings/{key}.json", board)
            film = output / f"{key}.mp4"
            subprocess.run([preflight_animatic.FFMPEG, "-v", "error", "-f", "lavfi", "-i", source,
                            "-t", "2", "-c:v", "libx264", "-pix_fmt", "yuv420p", str(film)], check=True)
            options.append({"id": key, "board": {"file": bp.name, "sha256": c.digest(bp)},
                            "film": {"file": film.name, "sha256": c.digest(film)}})
        with patch("critic_gate.renderer_digest", return_value="fixture-renderer"):
            receipt = opening_compare.inspect_options(output, {"options": options})
            reports = [c.read(output / o["inspection"]["file"]) for o in options]
            self.assertFalse(reports[0]["pass"])
            self.assertTrue(reports[1]["pass"])
            self.assertIn("held slide", " ".join(reports[0]["problems"]))
            self.assertFalse(receipt["inspection_pass"])
            self.assertTrue(all(e.startswith("opening a:") for e in receipt["inspection_problems"]))
            self.assertEqual(reports[1]["film_sha256"], options[1]["film"]["sha256"])

    def test_both_inspection_failures_survive_first_inspector_exception(self):
        self.comparison_fixture()
        output = self.root / "openings"
        receipt = c.read(output / "comparison.json")
        with patch("critic_gate.renderer_digest", return_value="fixture-renderer"), \
             patch("preflight_animatic.inspect_animatic", side_effect=[RuntimeError("broken decode"),
                   ({"schema": "dispatch_preflight/1"}, ["static second opening"])]) as inspect:
            result = opening_compare.inspect_options(output, receipt)
        self.assertEqual(inspect.call_count, 2)
        self.assertEqual(len(result["inspection_problems"]), 2)
        self.assertIn("broken decode", result["inspection_problems"][0])
        self.assertIn("static second", result["inspection_problems"][1])
        self.assertTrue(all((output / o["inspection"]["file"]).exists() for o in result["options"]))

    def test_opening_gate_rejects_missing_tampered_or_stale_inspection(self):
        self.comparison_fixture()
        output = self.root / "openings"
        receipt = c.read(output / "comparison.json")
        with patch("critic_gate.renderer_digest", return_value="fixture-renderer"):
            self.assertEqual(opening_compare.inspection_problems(receipt, output), [])
            old = copy.deepcopy(receipt)
            del old["options"][1]["inspection"]
            self.assertTrue(opening_compare.inspection_problems(old, output))
            report_path = output / receipt["options"][0]["inspection"]["file"]
            report = c.read(report_path)
            report["inspector_sha256"] = "stale inspector"
            report_path.write_text(json.dumps(report))
            self.assertTrue(opening_compare.inspection_problems(receipt, output))
            receipt["options"][0]["inspection"]["sha256"] = c.digest(report_path)
            self.assertTrue(any("stale inspector_sha256" in e for e in opening_compare.inspection_problems(receipt, output)))

    def test_finishing_selection_retains_rejected_alternate_but_never_selected_failure(self):
        self.comparison_fixture()
        output = self.root / 'openings'
        receipt = c.read(output / 'comparison.json')
        motion = 'the first two seconds change only 0.0050 of pixel range. The declared hook did not become visible motion or revelation.'
        with patch('critic_gate.renderer_digest', return_value='fixture-renderer'), \
             patch('preflight_animatic.inspect_animatic', side_effect=[({'schema': 'dispatch_preflight/1'}, [motion]), ({'schema': 'dispatch_preflight/1'}, [])]):
            receipt = opening_compare.inspect_options(output, receipt)
        rejected, selected = receipt['options']
        board = c.read(output / selected['board']['file'])
        board['date'] = '2026-09-30'
        # The fixture concept is rebound because this is a dated treatment test.
        selected['concept_sha256'] = c.opening_digest(board)
        choice = {'selected': 'b', 'comparison_sha256': c.digest(output / 'comparison.json'),
                  'reviewer_identity': 'fixture-critic', 'director_identity': 'fixture-director', 'blocking_defects': [],
                  'rejected_inspection': {'option_id': 'a', 'report_sha256': rejected['inspection']['sha256'], 'problems': [motion]}}
        ledger = {'mode': 'production', 'run_id': '2026-09-30', 'usage': {'reboards': 3}, 'events': []}
        before = (output / rejected['inspection']['file']).read_bytes()
        with patch('critic_gate.renderer_digest', return_value='fixture-renderer'):
            self.assertEqual(c.finishing_inspection_problems(board, receipt, choice, output, ledger), [])
            self.assertEqual((output / rejected['inspection']['file']).read_bytes(), before)
            for bad in ({**choice, 'selected': 'a'}, {**choice, 'comparison_sha256': 'stale'},
                        {**choice, 'reviewer_identity': 'fixture-director'}, {**choice, 'rejected_inspection': {}},
                        {**choice, 'blocking_defects': ['missing principal action']}):
                self.assertTrue(c.finishing_inspection_problems(board, receipt, bad, output, ledger))
            self.assertTrue(c.finishing_inspection_problems(board, receipt, choice, output, {**ledger, 'usage': {'reboards': 0}}))
            drift = copy.deepcopy(board);drift['scenes'][0]['vo'] = 'Changed source claim'
            self.assertTrue(c.finishing_inspection_problems(drift, receipt, choice, output, ledger))
            for key, value in [('film_sha256', 'stale'), ('inspector_sha256', 'stale'), ('inspection_error', 'decoder failed'),
                               ('problems', ['wrong dimensions']), ('problems', [motion, 'wrong duration']),
                               ('problems', [motion, 'source evidence missing'])]:
                path = output / rejected['inspection']['file'];report = json.loads(before);report[key] = value
                path.write_text(json.dumps(report));rejected['inspection']['sha256'] = c.digest(path)
                bad = copy.deepcopy(choice);bad['rejected_inspection']['report_sha256'] = rejected['inspection']['sha256']
                bad['rejected_inspection']['problems'] = report['problems']
                self.assertTrue(c.finishing_inspection_problems(board, receipt, bad, output, ledger))
                path.write_bytes(before);rejected['inspection']['sha256'] = c.digest(path)
            selected_path = output / selected['inspection']['file'];saved = selected_path.read_bytes()
            report = json.loads(saved);report.update({'pass': False, 'problems': [motion]})
            selected_path.write_text(json.dumps(report));selected['inspection']['sha256'] = c.digest(selected_path)
            self.assertTrue(c.finishing_inspection_problems(board, receipt, choice, output, ledger))
            selected_path.write_bytes(saved);selected['inspection']['sha256'] = c.digest(selected_path)
            missing = output / rejected['inspection']['file'];missing.unlink()
            self.assertTrue(c.finishing_inspection_problems(board, receipt, choice, output, ledger))
            missing.write_bytes(before)
            missing.write_bytes(before + b' ')
            self.assertTrue(c.finishing_inspection_problems(board, receipt, choice, output, ledger))

    def test_diagnostic_cli_does_not_approve_failed_inspections(self):
        with patch("opening_compare.build", return_value={"inspection_pass": False}), \
             patch("opening_compare.inspection_problems", return_value=["opening a: held slide"]), \
             patch("builtins.print"):
            with patch("sys.argv", ["opening_compare.py"]):
                self.assertEqual(opening_compare.main(), 1)
            with patch("sys.argv", ["opening_compare.py", "--retain-failed-inspection"]):
                self.assertEqual(opening_compare.main(), 0)

    def test_bounded_motion_route_preserves_failure_and_exact_binding_checks(self):
        self.comparison_fixture()
        output = self.root / "openings"
        receipt = c.read(output / "comparison.json")
        with patch("critic_gate.renderer_digest", return_value="fixture-renderer"), \
             patch("preflight_animatic.inspect_animatic", return_value=({"schema": "dispatch_preflight/1"}, ["fixture motion failure"])):
            receipt = opening_compare.inspect_options(output, receipt)
        before = (output / "comparison.json").read_bytes()
        with patch("critic_gate.renderer_digest", return_value="fixture-renderer"), \
             patch("creative_release.structural_allows", return_value=True):
            self.assertTrue(opening_compare.inspection_problems(receipt, output))
            self.assertEqual(opening_compare.inspection_problems(receipt, output, allow_bounded=True), [])
            self.assertEqual((output / "comparison.json").read_bytes(), before)
            report_path = output / receipt["options"][0]["inspection"]["file"]
            report = c.read(report_path)
            self.assertFalse(report["pass"])
            report["film_sha256"] = "wrong film"
            report_path.write_text(json.dumps(report))
            receipt["options"][0]["inspection"]["sha256"] = c.digest(report_path)
            self.assertTrue(opening_compare.inspection_problems(receipt, output, allow_bounded=True))
            report["film_sha256"] = receipt["options"][0]["film"]["sha256"]
            report["inspection_error"] = "decoder failed"
            report_path.write_text(json.dumps(report))
            receipt["options"][0]["inspection"]["sha256"] = c.digest(report_path)
            self.assertTrue(opening_compare.inspection_problems(receipt, output, allow_bounded=True))

    def legacy_comparison_fixture(self):
        choice = self.comparison_fixture()
        output = self.root / "openings"
        receipt = c.read(output / "comparison.json")
        receipt["producer_sha256"] = c.opening_producer(opening_compare.LEGACY_ORCHESTRATOR_SHA256)
        for option in receipt["options"]:
            option.pop("inspection")
        for key in ("inspection_pass", "inspection_problems"):
            receipt.pop(key)
        path = self.write("openings/comparison.json", receipt)
        choice["comparison_sha256"] = c.digest(path)
        self.write("openings/selection.json", choice)
        return receipt

    def test_legacy_inspection_preserves_capture_and_independent_selection(self):
        original = self.legacy_comparison_fixture()
        output = self.root / "openings"
        original_bytes = (output / "comparison.json").read_bytes()
        choice_bytes = (output / "selection.json").read_bytes()
        with patch("critic_gate.renderer_digest", return_value="fixture-renderer"), \
             patch("preflight_animatic.inspect_animatic", return_value=({"schema": "dispatch_preflight/1"}, [])), \
             patch("run_controller.reserve") as reserve, patch("opening_compare.subprocess.run") as execute:
            self.assertTrue(c.opening_problems(self.root / "storyboard.json"))
            receipt = opening_compare.inspect_retained(self.root, self.root / "run_state.json")
            self.assertEqual(receipt["producer_sha256"], original["producer_sha256"])
            self.assertEqual(opening_compare.capture_record(receipt), original)
            archive = output / receipt["inspection_adoption"]["original_comparison"]["file"]
            self.assertEqual(archive.read_bytes(), original_bytes)
            self.assertEqual((output / "selection.json").read_bytes(), choice_bytes)
            self.assertEqual(c.opening_problems(self.root / "storyboard.json"), [])
            reserve.assert_not_called()
            execute.assert_not_called()
            receipt["reservation"]["identity"] = "invented replacement"
            self.assertTrue(opening_compare.adoption_problems(receipt, output))

    def test_legacy_adoption_refuses_unknown_capture_or_changed_renderer_before_writes(self):
        original = self.legacy_comparison_fixture()
        output = self.root / "openings"
        with patch("critic_gate.renderer_digest", return_value="fixture-renderer"), \
             patch("preflight_animatic.inspect_animatic") as inspect:
            unknown = copy.deepcopy(original)
            unknown["producer_sha256"] = "unrecognized capture"
            path = self.write("openings/comparison.json", unknown)
            before = path.read_bytes()
            files_before = set(output.iterdir())
            with self.assertRaises(ValueError):
                opening_compare.inspect_retained(self.root, self.root / "run_state.json")
            self.assertEqual(path.read_bytes(), before)
            self.assertEqual(set(output.iterdir()), files_before)
            inspect.assert_not_called()
        path = self.write("openings/comparison.json", original)
        before = path.read_bytes()
        with patch("critic_gate.renderer_digest", return_value="changed renderer or asset"):
            with self.assertRaises(ValueError):
                opening_compare.inspect_retained(self.root, self.root / "run_state.json")
        self.assertEqual(path.read_bytes(), before)

    def test_packaged_legacy_inspections_validate_without_source_package(self):
        import shutil
        self.legacy_comparison_fixture()
        output = self.root / "openings"
        destination = self.root / "delivered"
        destination.mkdir()
        for name in ("storyboard.json", "run_state.json"):
            shutil.copy2(self.root / name, destination / name)
        with patch("critic_gate.renderer_digest", return_value="fixture-renderer"), \
             patch("preflight_animatic.inspect_animatic", return_value=({"schema": "dispatch_preflight/1"}, [])):
            receipt = opening_compare.inspect_retained(self.root, self.root / "run_state.json")
            expected = {"comparison.json", "selection.json",
                        receipt["inspection_adoption"]["original_comparison"]["file"]}
            for option in receipt["options"]:
                expected.update(option[key]["file"] for key in ("board", "film", "inspection"))
            copied = opening_compare.package_openings(self.root, destination)
            self.assertEqual(set(copied), expected)
            for name in expected:
                self.assertEqual((output / name).read_bytes(), (destination / "openings" / name).read_bytes())
            output.rename(self.root / "source-openings-unavailable")
            self.assertEqual(c.opening_problems(destination / "storyboard.json"), [])
            report = destination / "openings" / receipt["options"][1]["inspection"]["file"]
            report.unlink()
            self.assertTrue(c.opening_problems(destination / "storyboard.json"))

    def test_opening_packaging_refuses_missing_evidence_and_overwrites(self):
        import shutil
        self.comparison_fixture()
        destination = self.root / "delivered"
        destination.mkdir()
        for name in ("storyboard.json", "run_state.json"):
            shutil.copy2(self.root / name, destination / name)
        with patch("critic_gate.renderer_digest", return_value="fixture-renderer"):
            opening_compare.package_openings(self.root, destination)
            changed = destination / "openings" / "a.mp4"
            changed.write_bytes(b"retained unrelated bytes")
            with self.assertRaisesRegex(ValueError, "overwrite different"):
                opening_compare.package_openings(self.root, destination)
            self.assertEqual(changed.read_bytes(), b"retained unrelated bytes")
            receipt = c.read(self.root / "openings/comparison.json")
            (self.root / "openings" / receipt["options"][0]["inspection"]["file"]).unlink()
            with self.assertRaises(ValueError):
                opening_compare.package_openings(self.root, self.root / "missing-evidence-output")
            self.assertFalse((self.root / "missing-evidence-output").exists())

    def test_cached_comparison_gets_both_inspections_without_another_render(self):
        self.comparison_fixture()
        output = self.root / "openings"
        receipt = c.read(output / "comparison.json")
        for option in receipt["options"]:
            del option["inspection"]
            self.write(f"opening-{option['id']}.json", c.read(output / option["board"]["file"]))
        self.write("openings/comparison.json", receipt)
        cp = self.write("claims.json", {"claims": []})
        self.write("story_selection.json", {})
        for key in ("a", "b"):
            self.write(f"opening-{key}-critic.json", {"story_review": {"claims_sha256": c.digest(cp)}})
        with patch("storyboard_check.check", return_value=[]), patch("daily_production.structure_problems", return_value=[]), \
             patch("documentary_check.check", return_value=[]), patch("super_evidence_check.check", return_value=([], [])), \
             patch("script_evidence_check.check", return_value=[]), patch("story_selection_check.problems", return_value=[]), \
             patch("engine_lint.check_files", return_value=[]), patch("critic_gate.problems", return_value=[]), \
             patch("critic_gate.renderer_digest", return_value="fixture-renderer"), \
             patch("run_controller.preflight_identity", return_value="fixture-batch"), \
             patch("run_controller.read_state", return_value=c.read(self.root / "run_state.json")), \
             patch("run_controller.reserve") as reserve, patch("opening_compare.subprocess.run") as execute, \
             patch("preflight_animatic.inspect_animatic", return_value=({"schema": "dispatch_preflight/1"}, ["held slide"])) as inspect:
            result = opening_compare.build(self.root, self.root / "run_state.json")
            self.assertEqual(inspect.call_count, 2)
            self.assertFalse(result["inspection_pass"])
            reserve.assert_not_called()
            self.assertFalse(any("render-batch.mjs" in str(call) for call in execute.call_args_list))
            for field in ("identity", "renderer_sha256", "producer_sha256"):
                stale = copy.deepcopy(result)
                if field == "identity":
                    stale["reservation"][field] = "previous batch"
                else:
                    stale[field] = "previous dependency"
                retained = self.write("openings/comparison.json", stale)
                before = retained.read_bytes()
                files_before = set(output.iterdir())
                inspect.reset_mock()
                with self.assertRaises(ValueError):
                    opening_compare.build(self.root, self.root / "run_state.json")
                self.assertEqual(retained.read_bytes(), before)
                self.assertEqual(set(output.iterdir()), files_before)
                inspect.assert_not_called()

    def test_current_treatments_bind_each_renderer_and_selected_film(self):
        self.board["date"] = "2026-09-30"
        choice = self.comparison_fixture()
        receipt = c.read(self.root/"openings/comparison.json")
        receipt["reservation"]["run_id"] = self.board["date"]
        ledger = c.read(self.root/"run_state.json")
        ledger["run_id"] = self.board["date"]
        self.write("run_state.json", ledger)
        for option in receipt["options"]:
            option["renderer_sha256"] = "renderer-" + option["id"]
        self.write("openings/comparison.json", receipt)
        choice["comparison_sha256"] = c.digest(self.root/"openings/comparison.json")
        self.write("openings/selection.json", choice)
        def renderer(board):
            label = board["scenes"][0]["picture"]["nodes"][0]["label"]
            return "renderer-b" if label == "document" else "renderer-a"
        with patch("critic_gate.renderer_digest", side_effect=renderer), \
             patch("opening_compare.inspection_problems", return_value=[]):
            self.assertEqual(c.opening_problems(self.root/"storyboard.json"), [])
            receipt["options"][1]["renderer_sha256"] = "stale"
            self.write("openings/comparison.json", receipt)
            errors = c.opening_problems(self.root/"storyboard.json")
            self.assertTrue(any("stale renderer" in error for error in errors))

    def test_opening_choice_is_exact_byte_bound_and_independent(self):
        choice = self.comparison_fixture()
        with patch("critic_gate.renderer_digest", return_value="fixture-renderer"):
            self.assertEqual(c.opening_problems(self.root/"storyboard.json"), [])
            choice["reviewer_identity"] = "fixture-director"
            self.write("openings/selection.json", choice)
            self.assertTrue(c.opening_problems(self.root/"storyboard.json"))
            choice["reviewer_identity"] = "fixture-critic"
            self.write("openings/selection.json", choice)
            (self.root/"openings/b.mp4").write_bytes(b"changed fixture")
            self.assertTrue(c.opening_problems(self.root/"storyboard.json"))

    def test_only_opening_changes_and_paid_batch_failure_is_retained(self):
        alternative = copy.deepcopy(self.board)
        alternative["scenes"][0]["picture"]["nodes"][0]["label"] = "document"
        self.assertEqual(opening_compare.body(self.board), opening_compare.body(alternative))
        alternative["scenes"][1]["vo"] = "Changed body."
        self.assertNotEqual(opening_compare.body(self.board), opening_compare.body(alternative))
        alternative["scenes"][1]["vo"] = self.board["scenes"][1]["vo"]
        self.write("storyboard.json", self.board)
        self.write("opening-a.json", self.board)
        self.write("opening-b.json", alternative)
        cp = self.write("claims.json", {"claims": []})
        self.write("story_selection.json", {})
        for key in ("a", "b"):
            self.write(f"opening-{key}-critic.json", {"story_review": {"claims_sha256": c.digest(cp)}})
        state = self.root/"run_state.json"
        run_controller.initialise(state, "2026-09-29", "dry-run")
        def fail_render(command, **kwargs):
            if "render-batch.mjs" in command[1]:
                raise subprocess.CalledProcessError(1, "fixture-render")
            return subprocess.CompletedProcess(command, 0)
        with patch("storyboard_check.check", return_value=[]), patch("daily_production.structure_problems", return_value=[]), \
             patch("documentary_check.check", return_value=[]), \
             patch("super_evidence_check.check", return_value=([], [])), patch("script_evidence_check.check", return_value=[]), \
             patch("story_selection_check.problems", return_value=[]), patch("engine_lint.check_files", return_value=[]), \
             patch("critic_gate.problems", return_value=[]), patch("critic_gate.renderer_digest", return_value="fixture-renderer"), \
             patch("run_controller.preflight_identity", return_value="fixture-batch"), \
             patch("opening_compare.subprocess.run", side_effect=fail_render) as render:
            with self.assertRaises(subprocess.CalledProcessError):
                opening_compare.build(self.root, state)
            self.assertEqual(run_controller.read_state(state)["usage"]["preflight_renders"], 1)
            jobs = c.read(self.root/"openings/batch.json")["jobs"]
            self.assertEqual(len(jobs), c.policy()["opening_preview_jobs"])
            self.assertTrue(all(j["preview"] is True for j in jobs))
            with self.assertRaises(ValueError):
                opening_compare.build(self.root, state)
            self.assertEqual(sum("render-batch.mjs" in call.args[0][1] for call in render.call_args_list), 1)
            self.assertEqual(run_controller.read_state(state)["usage"]["preflight_renders"], 1)

    def test_opening_comparison_can_choose_between_3d_and_source_media(self):
        alternate = copy.deepcopy(self.board)
        alternate["scenes"][0].pop("picture")
        alternate["scenes"][0]["production_action"] = "document-accumulation-v1"
        alternate["quality_plan"]["scenes"][0]["medium"] = "dimensional"
        alternate["cinema"]["dimensional_scene_ids"] = ["s1"]
        self.assertEqual(opening_compare.body(self.board), opening_compare.body(alternate))

    def test_source_diagram_labels_cannot_borrow_an_unrelated_figure(self):
        from super_evidence_check import check
        self.board["scenes"][0]["picture"]["nodes"][0]["label"] = "30 wells"
        claims = {"claims": [{"id": "c1", "verdict": "VERIFIED", "quote": "One record reaches the reader."},
                             {"id": "c2", "verdict": "VERIFIED", "quote": "30 wells elsewhere."}]}
        self.assertTrue(check(self.board, claims)[0])


if __name__ == "__main__":
    unittest.main()
