"""Offline dependency mutations; synthetic fixture bytes never approve a film."""
import copy
import json
import tempfile
import unittest
import wave
from pathlib import Path
from unittest.mock import patch
import cinema_cache as c
import cinema_proof as p

class CacheTest(unittest.TestCase):
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
    def test_phone_rejection_stops_even_cached_production(self):
        (self.root/"preflight.mp4").write_bytes(b"test")
        (self.root/"preflight.json").write_text("{}")
        (self.root/"storyboard_critic.json").write_text("{}")
        with patch.object(p,"plan_problems",return_value=[]),patch.object(p.critic_gate,"film_review_problems",return_value=["rejected"]), \
             patch.object(p,"reserve") as reserve:
            with self.assertRaisesRegex(ValueError,"phone visual review"):p.build(self.bp,self.mix,self.root/"state")
            reserve.assert_not_called()

if __name__=="__main__":unittest.main()
