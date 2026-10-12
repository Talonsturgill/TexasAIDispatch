"""Offline dependency mutations; synthetic fixture bytes never approve a film."""
import copy
from contextlib import ExitStack
import json
import tempfile
import unittest
import wave
from pathlib import Path
from unittest.mock import patch
import cinema_cache as c
import cinema_proof as p
import cinema_provenance as provenance

class CacheTest(unittest.TestCase):
    def test_native_comparison_keeps_exact_frame_at_fractional_cut(self):
        import subprocess
        import production_quality as q
        from PIL import Image
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            for index, color in enumerate(["red", "green", "blue", "yellow"]):
                Image.new("RGB", (32, 32), color).save(root / f"frame-{index}.png")
            film = root / "cut.mp4"
            subprocess.run([q.FFMPEG, "-v", "error", "-framerate", "30", "-i",
                str(root / "frame-%d.png"), "-c:v", "libx264", "-crf", "16",
                "-pix_fmt", "yuv420p", str(film)], check=True)
            exact = q.scheduled_frame(film, 2, 32, 32)
            following = q.scheduled_frame(film, 3, 32, 32)
            self.assertGreater(float(exact[:, :, 2].mean()), 200)
            self.assertLess(float(exact[:, :, 0].mean()), 20)
            self.assertGreater(float(following[:, :, 0].mean()), 200)
            self.assertGreater(float(following[:, :, 1].mean()), 200)
            for invalid in [-1, True, 2.0]:
                with self.assertRaises(ValueError):
                    q.scheduled_frame(film, invalid)

    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name)
        self.board={"date":"2026-09-28","cinematic_template":"daily-actions-v1",
            "cinema":{"hero_scene_id":"a","dimensional_scene_ids":["a"]},
            "scenes":[{"id":name,"start_s":i,"duration_s":1,"super":name,
                       "visual_events":[{"id":name,"at_s":.1,"duration_s":.2}]} for i,name in enumerate(["a","b"])],
            "captions":[{"text":"Opening words","start":0,"end":1},{"text":"Closing words","start":1,"end":2}]}
        self.bp=self.root/"storyboard.json"
        self.mix=self.root/"mix.wav"
        self.save();self.audio()
    def save(self):
        self.bp.write_text(json.dumps(self.board))
    def audio(self,first=1,second=2):
        with wave.open(str(self.mix),"wb") as dst:
            dst.setparams((1,2,48000,0,"NONE","not compressed"))
            dst.writeframes(first.to_bytes(2,"little")*48000+second.to_bytes(2,"little")*48000)
    def test_unrelated_picture_edits_reuse_but_hero_changes_invalidate(self):
        key=c.picture_key(self.bp,[0,29])
        self.assertTrue(c.isolated(self.board),"projection profile must match the reviewed implementation")
        self.board["scenes"][1]["super"]="Different ending"
        self.board["captions"][1]["text"]="Different final words"
        self.board["credits"]="Different credit"
        self.save()
        self.assertEqual(key,c.picture_key(self.bp,[0,29]))
        self.board["captions"][0]["text"]="Changed opening"
        self.save();self.assertNotEqual(key,c.picture_key(self.bp,[0,29]))
        self.assertNotEqual(key,c.picture_key(self.bp,[0,30]))
        self.board["captions"][0]["text"]="Opening words"
        self.board["__cinemaProofWithoutStage"]=True;self.save()
        self.assertNotEqual(key,c.picture_key(self.bp,[0,29]))
    def test_asset_and_renderer_changes_invalidate(self):
        baseline=c.picture_key(self.bp,[0,29])
        real=c.file_sha256
        def changed(path):
            return "f"*64 if "fonts" in path.parts else real(path)
        with patch.object(c,"file_sha256",changed):
            self.assertNotEqual(baseline,c.picture_key(self.bp,[0,29]))
        with patch.object(c,"current_profile",return_value={}):
            self.assertEqual("full-inputs",c.picture_recipe(self.bp,[0,29])["scope"])
            old=c.picture_key(self.bp,[0,29])
            self.board["scenes"][1]["super"]="Changed";self.save()
            self.assertNotEqual(old,c.picture_key(self.bp,[0,29]))
        self.assertNotIn(c.ENGINE/"Dispatch.tsx",c.closure())
    def test_art_light_palette_camera_and_motion_invalidate_cached_hero(self):
        self.board['art_direction'] = {'palette': {'hero': '#bc854d'},
            'lighting': {'exposure': 1}, 'shots': {'a': {'target': [0, 0, 0]}}}
        self.save(); baseline = c.picture_key(self.bp, [0, 29])
        for branch, key, value in [('palette', 'hero', '#987654'), ('lighting', 'exposure', 1.2),
                                   ('shots', 'a', {'target': [1, 0, 0]})]:
            original = copy.deepcopy(self.board['art_direction'])
            self.board['art_direction'][branch][key] = value
            self.save(); self.assertNotEqual(baseline, c.picture_key(self.bp, [0, 29]))
            self.board['art_direction'] = original
        self.board['scenes'][0]['visual_events'][0]['motion'] = {'curve': 'contact'}
        self.save(); self.assertNotEqual(baseline, c.picture_key(self.bp, [0, 29]))
    def test_unknown_routes_gaps_and_credits_use_full_binding(self):
        self.board["cinematic_template"]="unknown"
        self.assertEqual("full-inputs",c.project(self.board,[0,29])[1])
        self.board["cinematic_template"]="daily-actions-v1"
        self.board["scenes"][0]["duration_s"]=.5
        self.assertEqual("full-inputs",c.project(self.board,[0,29])[1])
        self.assertEqual("full-inputs",c.project(self.board,[60,70])[1])
    def test_pcm_reuses_only_identical_audible_samples(self):
        key=c.audio_segment(self.mix,[0,29])
        self.audio(second=3);self.assertEqual(key,c.audio_segment(self.mix,[0,29]))
        self.audio(first=4);self.assertNotEqual(key,c.audio_segment(self.mix,[0,29]))
        out=self.root/"cut.wav";c.audio_segment(self.mix,[0,29],out)
        with wave.open(str(out)) as src:self.assertEqual(48000,src.getnframes())
        with self.assertRaises(ValueError):c.audio_segment(self.mix,[0,90])
    def test_corrupted_cache_refuses_reuse(self):
        file=self.root/"test.mp4";file.write_bytes(b"synthetic fixture")
        self.assertIsNone(c.lookup(self.root/"cache","test"))
        saved=c.retain(self.root/"cache","test",file)
        self.assertEqual(saved,c.lookup(self.root/"cache","test"))
        saved.write_bytes(b"changed")
        with self.assertRaisesRegex(ValueError,"bytes changed"):c.lookup(self.root/"cache","test")
    def test_producer_reuses_bytes_without_reserving_or_inventing_review(self):
        (self.root/"preflight.mp4").write_bytes(b"synthetic phone fixture")
        (self.root/"preflight.json").write_text("{}")
        (self.root/"storyboard_critic.json").write_text("{}")
        charges=[];batches=[]
        def command(argv,cwd=None):
            if argv[0]=="node":
                spec=json.loads(Path(argv[-1]).read_text());batches.append(spec)
                for job in spec["jobs"]:Path(job["output"]).write_bytes(b"synthetic "+job["kind"].encode())
            else:Path(argv[-1]).write_bytes(b"synthetic mux")
        with patch.object(p,"plan_problems",return_value=[]),patch.object(p.critic_gate,"film_review_problems",return_value=[]), \
             patch.object(p,"stage_sample_problems",return_value=[]),patch.object(p,"run",side_effect=command), \
             patch.object(p,"reserve",side_effect=lambda *a:(charges.append(a) or (True,"reserved"))):
            p.build(self.bp,self.mix,self.root/"state.json")
            self.assertEqual(1,len(charges));self.assertEqual(5,len(batches[0]["jobs"]))
            hero=self.root/"cinema/hero.mp4";old=c.file_sha256(hero)
            review=self.root/"cinema/hero-review.json";review.write_text("retained test rejection")
            self.board["scenes"][1]["super"]="Edited ending";self.save()
            p.build(self.bp,self.mix,self.root/"state.json")
            self.assertEqual(1,len(charges));self.assertEqual(old,c.file_sha256(hero))
            self.assertEqual("retained test rejection",review.read_text())
            proof=json.loads((self.root/"cinema/proof.json").read_text())
            self.assertEqual(c.file_sha256(self.bp),proof["board_sha256"])
            self.assertEqual([],c.binding_problems(self.bp,proof,self.mix))
            self.assertEqual(0,proof["reuse"]["rendered_jobs"])
            proof["reuse"]["hero_audio_key"]="changed"
            self.assertIn("hero audible samples changed",c.binding_problems(self.bp,proof,self.mix))
            proof["reuse"]["version"]="unknown"
            self.assertIn("unknown cinematic reuse contract",c.binding_problems(self.bp,proof,self.mix))
            self.assertTrue(c.binding_problems(self.bp,{}))
    def test_archive_verification_uses_producer_environment_without_reusing_foreign_cache(self):
        frames=c.hero_frames(self.board)
        environment=c.picture_recipe(self.bp,frames)["environment"]
        record={"version":c.SCHEMA,"render_environment":environment,
                "hero_picture_key":c.picture_key(self.bp,frames),
                "hero_audio_key":c.audio_segment(self.mix,frames),
                "sample_keys":{sid:[{kind:c.sample_key(self.bp,frame,kind=="without_stage")
                    for kind in ("normal","without_stage")} for frame in times]
                    for sid,times in c.sample_frames(self.board).items()}}
        proof={"reuse":record}
        with patch.object(c.platform,"platform",return_value="foreign-ci-host"):
            self.assertNotEqual(record["hero_picture_key"],c.picture_key(self.bp,frames))
            self.assertEqual([],provenance.binding_problems(self.bp,proof,self.mix))
            self.board["captions"][0]["text"]="Changed opening";self.save()
            self.assertIn("hero render dependencies changed",provenance.binding_problems(self.bp,proof,self.mix))
            self.board["captions"][0]["text"]="Opening words";self.save()
            self.audio(first=7)
            self.assertIn("hero audible samples changed",provenance.binding_problems(self.bp,proof,self.mix))
        record["render_environment"]=["another-host",environment[1],environment[2]]
        self.assertTrue(provenance.binding_problems(self.bp,proof,self.mix))
        record["render_environment"]=["invalid"]
        self.assertEqual(["invalid recorded render environment"],provenance.binding_problems(self.bp,proof,self.mix))

    def test_phone_rejection_stops_even_cached_production(self):
        (self.root/"preflight.mp4").write_bytes(b"test")
        (self.root/"preflight.json").write_text("{}")
        (self.root/"storyboard_critic.json").write_text("{}")
        with patch.object(p,"plan_problems",return_value=[]),patch.object(p.critic_gate,"film_review_problems",return_value=["rejected"]), \
             patch.object(p,"reserve") as reserve:
            with self.assertRaisesRegex(ValueError,"phone visual review"):p.build(self.bp,self.mix,self.root/"state")
            reserve.assert_not_called()

    def proof_fixture(self, stage_errors):
        """Stub rendering only; exercise real retention keys and file verification."""
        for name in ("preflight.json", "storyboard_critic.json"):
            (self.root/name).write_text("{}")
        (self.root/"preflight.mp4").write_bytes(b"synthetic phone fixture")
        def command(argv, cwd=None):
            if argv[0] == "node":
                spec = json.loads(Path(argv[-1]).read_text())
                for job in spec["jobs"]:
                    Path(job["output"]).write_bytes(b"synthetic " + job["kind"].encode())
                Path(spec["report"]).write_text('{"synthetic_test_batch":true}\n')
            else:
                Path(argv[-1]).write_bytes(b"synthetic mux")
        stack = ExitStack()
        self.addCleanup(stack.close)
        for target, name in ((p, "plan_problems"), (p.critic_gate, "film_review_problems")):
            stack.enter_context(patch.object(target, name, return_value=[]))
        stage = stack.enter_context(patch.object(p, "stage_sample_problems", return_value=stage_errors))
        def inspect(*args, **kwargs):
            kwargs["observations"].append({"synthetic_test_measurement": True})
            return stage.return_value
        stage.side_effect = inspect
        command_mock = stack.enter_context(patch.object(p, "run", side_effect=command))
        reserve = stack.enter_context(patch.object(p, "reserve", return_value=(True, "reserved")))
        return stage, command_mock, reserve

    def test_failed_stage_retains_exact_evidence_and_reuses_without_approval(self):
        errors = ["a stage sample failed its occupancy check"]
        samples = patch.object(c, "sample_frames", return_value={"a": [3, 6, 9]})
        samples.start()
        self.addCleanup(samples.stop)
        stage, commands, reserve = self.proof_fixture(errors)
        root = self.root/"cinema"
        root.mkdir()
        # Previously published evidence and its actual rejection must survive failure.
        for name in ("proof.json", "hero.mp4", "hero-review.json"):
            (root/name).write_bytes(b"earlier evidence")
        for attempt in range(2):
            with self.assertRaisesRegex(ValueError, "exact failed evidence retained"):
                p.build(self.bp, self.mix, self.root/"state.json")
            archives = sorted((root/"failed-proofs").iterdir())
            self.assertEqual(attempt+1, len(archives))
            self.assertEqual(1, reserve.call_count)
            self.assertEqual(2, commands.call_count)  # One batch and one mux, total.
            for name in ("proof.json", "hero.mp4", "hero-review.json"):
                self.assertEqual(b"earlier evidence", (root/name).read_bytes())
        originals = {a: (a/"proof.json").read_bytes() for a in archives}
        for archive in archives:
            proof = json.loads((archive/"proof.json").read_text())
            self.assertIs(proof["pass"], False)
            self.assertEqual(errors, proof["problems"])
            self.assertEqual([{"synthetic_test_measurement": True}], proof["principal_picture_measurements"])
            self.assertEqual(3, len(proof["samples"]["a"]))
            self.assertEqual(self.bp.read_bytes(), (archive/"props.json").read_bytes())
            self.assertEqual([], c.binding_problems(self.bp, proof, self.mix))
            for name, sha in proof["retained_files"].items():
                self.assertEqual(sha, c.file_sha256(archive/name))
            self.assertEqual(proof["hero"]["sha256"], c.file_sha256(archive/proof["hero"]["file"]))
            for pairs in proof["samples"].values():
                for pair in pairs:
                    for entry in pair.values():
                        self.assertEqual(entry["sha256"], c.file_sha256(archive/entry["file"]))
        rendered = next(a for a in archives if (a/"batch-report.json").exists())
        self.assertTrue((rendered/"batch.json").exists())
        self.assertTrue((rendered/"hero-silent.mp4").exists())
        stage.return_value = []
        p.build(self.bp, self.mix, self.root/"state.json")
        self.assertEqual(1, reserve.call_count)
        self.assertEqual(2, commands.call_count)
        self.assertEqual(3, stage.call_count)  # Cached bytes still undergo the check.
        for archive, original in originals.items():
            self.assertEqual(original, (archive/"proof.json").read_bytes())

    def test_failed_dependencies_archive_but_never_enter_reusable_cache(self):
        self.proof_fixture([])
        expected = p.current_bindings(self.bp, self.mix)
        for kind in ("reuse", "current_inputs"):
            with self.subTest(kind=kind), ExitStack() as stack:
                if kind == "reuse":
                    stack.enter_context(patch.object(c, "binding_problems", return_value=["hero render dependencies changed"]))
                else:
                    stack.enter_context(patch.object(p, "current_bindings", side_effect=[expected, {**expected, "board_sha256":"changed"}]))
                with self.assertRaisesRegex(ValueError, "exact failed evidence retained"):
                    p.build(self.bp, self.mix, self.root/"state.json")
                root = self.root/"cinema"
                self.assertFalse((root/"render-cache").exists())
                self.assertFalse((root/"proof.json").exists())
                self.assertFalse((root/"hero.mp4").exists())
        self.assertEqual(2, len(list((root/"failed-proofs").iterdir())))

class DirectedActionSamplingTest(unittest.TestCase):
    def board(self):
        import modern_film_proof
        board = modern_film_proof.board('a')
        board.pop('action_proposals', None)
        for scene in board['scenes']:
            scene.pop('picture', None)
            scene.pop('production_action', None)
        return board

    def test_admitted_directed_route_needs_no_legacy_picture_fields(self):
        import modern_film
        board = self.board()
        self.assertEqual([], modern_film.problems(board))
        self.assertEqual([0, 60, 120], c.sample_frames(board)['s1'])
        self.assertEqual(set(s['id'] for s in board['scenes']), set(c.sample_frames(board)))
        event = c.principal_event(board, board['scenes'][0])
        self.assertEqual(['s1-event-1', 's1-event-2', 's1-event-3'], event['source_event_ids'])
        self.assertEqual('cooling-check-v2', event['admitted_direction_id'])
        self.assertNotIn('admitted_action_id', event)

    def test_unadmitted_direction_or_renderer_cannot_supply_native_samples(self):
        mutations = [lambda p: p.update(version='old'),
                     lambda p: p.update(renderer_inputs=[]),
                     lambda p: p.update(episode='unknown'),
                     lambda p: p['shots'][0].update(event_id='absent'),
                     lambda p: p['shots'][1].update(start_s=3)]
        for mutation in mutations:
            with self.subTest(mutation=mutation):
                board = self.board(); mutation(board['film_direction'])
                with self.assertRaisesRegex(ValueError, 'unadmitted directed'):
                    c.sample_frames(board)

    def test_complete_unique_finite_in_scene_events_remain_required(self):
        for update in [{'id': 's1-event-1'}, {'at_s': -1}, {'at_s': float('nan')},
                       {'duration_s': 0}, {'duration_s': True}, {'duration_s': 20}]:
            with self.subTest(update=update):
                board = self.board(); board['scenes'][0]['visual_events'][2].update(update)
                with self.assertRaises(ValueError):
                    c.sample_frames(board)
        board = self.board()
        wrong = copy.deepcopy(board['scenes'][0]); wrong['super'] = 'Different scene'
        with self.assertRaisesRegex(ValueError, 'unique complete'):
            c.principal_event(board, wrong)
        board['scenes'][0]['visual_events'] = board['scenes'][0]['visual_events'][:2]
        with self.assertRaises(ValueError):
            c.sample_frames(board)

    def test_directed_measurements_retain_source_binding_and_mandatory_floors(self):
        import numpy as np
        import production_quality as q
        board = self.board()
        samples = {s['id']: [{'normal': {'file': 'normal'}, 'without_stage': {'file': 'removed'}}] * 3
                   for s in board['scenes']}
        with patch.object(q, 'asset', side_effect=lambda root, item: Path(item['file'])), \
                patch.object(q, 'image', side_effect=lambda path: np.full((480, 270, 3),
                    70 if path.name == 'normal' else 0, dtype=float)), \
                patch('creative_release.eligible', return_value=True):
            deferred, observations = [], []
            errors = q.stage_sample_problems(board, Path('synthetic'), samples,
                                            deferred=deferred, observations=observations)
        self.assertEqual([], deferred)
        self.assertTrue(any('does not visibly develop' in e for e in errors))
        first = observations[0]
        self.assertEqual('cooling-check-v2', first['admitted_direction_id'])
        self.assertEqual(['s1-event-1', 's1-event-2', 's1-event-3'], first['source_event_ids'])
        with patch.object(q, 'asset', side_effect=lambda root, item: Path(item['file'])), \
                patch.object(q, 'image', return_value=np.zeros((480, 270, 3))):
            self.assertTrue(any('too little visible principal picture' in e
                                for e in q.stage_sample_problems(board, Path('synthetic'), samples)))

class CustomActionSamplingTest(unittest.TestCase):
    def board(self):
        return {"date": "2026-09-30", "cinematic_template": "source-action-v1",
                "action_proposals": [{"id": "source-action"}],
                "cinema": {"dimensional_scene_ids": ["s1"]},
                "scenes": [{"id": "s1", "start_s": 0, "duration_s": 4,
                            "production_action": "source-action", "visual_events": [
                    {"id": "capture", "at_s": 0, "duration_s": .8},
                    {"id": "handoff", "at_s": 1.2, "duration_s": .8},
                    {"id": "seat", "at_s": 2.4, "duration_s": .8}]}]}

    def test_admitted_custom_action_samples_whole_conserved_sequence(self):
        board = self.board()
        with patch("action_admission.board_problems", return_value=[]) as admission:
            self.assertEqual(c.sample_frames(board), {"s1": [0, 48, 96]})
            event = c.principal_event(board, board["scenes"][0])
            self.assertEqual(event["source_event_ids"], ["capture", "handoff", "seat"])
            admission.assert_called_with(board)

    def test_missing_or_unadmitted_action_cannot_supply_native_picture(self):
        board = self.board()
        with patch("action_admission.board_problems", return_value=["actual source module binding is stale"]):
            with self.assertRaisesRegex(ValueError, "unadmitted"):
                c.sample_frames(board)
        board["action_proposals"] = []
        with self.assertRaisesRegex(ValueError, "no unique"):
            c.sample_frames(board)

    def test_invalid_source_event_or_duplicate_identity_fails(self):
        for update in ({"at_s": -1}, {"at_s": float("nan")}, {"duration_s": 0},
                       {"duration_s": True}, {"duration_s": 9}, {"id": "capture"}):
            board = self.board()
            board["scenes"][0]["visual_events"][2].update(update)
            with patch("action_admission.board_problems", return_value=[]):
                with self.assertRaises(ValueError):
                    c.sample_frames(board)

    def test_daily_picture_event_scope_remains_explicit(self):
        board = self.board()
        board["cinematic_template"] = "daily-actions-v1"
        with self.assertRaisesRegex(ValueError, "no unique"):
            c.sample_frames(board)
        board["scenes"][0]["picture"] = {"event_id": "handoff"}
        self.assertEqual(c.sample_frames(board), {"s1": [36, 48, 60]})

    def test_current_native_action_floor_cannot_be_deferred_at_cap(self):
        import numpy as np
        import production_quality as q
        board = self.board()
        board["scenes"][0]["picture"] = {"event_id": "handoff"}
        samples = {"s1": [{"normal": {"file": "normal"},
                            "without_stage": {"file": "removed"}}] * 3}
        with patch.object(q, "asset", side_effect=lambda root, item: Path(item["file"])), \
                patch.object(q, "image", side_effect=lambda path: np.full((480, 270, 3),
                                  70 if path.name == "normal" else 0, dtype=float)), \
                patch("creative_release.eligible", return_value=True):
            deferred = []
            errors = q.stage_sample_problems(board, Path("synthetic"), samples, deferred=deferred)
            self.assertTrue(any("does not visibly develop" in e for e in errors))
            self.assertEqual(deferred, [])
            board["date"] = "2026-09-29"
            self.assertFalse(q.stage_sample_problems(board, Path("synthetic"), samples, deferred=deferred))
            self.assertEqual(len(deferred), 1)


if __name__=="__main__":unittest.main()
