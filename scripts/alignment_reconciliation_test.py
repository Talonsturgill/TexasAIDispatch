"""Negative regression coverage for lexical reconciliation, without provider calls."""
import copy
import json
import tempfile
import unittest
import wave
from pathlib import Path

import numpy as np
from alignment_reconciliation import reconcile, requantize
from compact_take import compact
from vo_align import acoustic_groups, digest


class EvidenceTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.rate = 48000
        tone = (np.sin(np.arange(24000) * .03) * 8000).astype("<i2")
        source = np.concatenate([tone, np.zeros(48000, dtype="<i2"), tone])
        def wav(name, samples):
            path = self.root / name
            with wave.open(str(path), "wb") as w:
                w.setparams((1, 2, self.rate, 0, "NONE", "not compressed"))
                w.writeframes(samples.tobytes())
            return path
        self.source = wav("source.wav", source)
        y, cuts = compact(source.astype(float)/32768, self.rate, -38, .48, .3, .12)
        self.compact = wav("compact.wav", (y*32767).astype("<i2"))
        self.voice = wav("voice.wav", np.concatenate([np.zeros(100, dtype="<i2"),
                                requantize((y*32767).astype("<i2")), np.zeros(100, dtype="<i2")]))
        def js(name, data):
            path=self.root/name;path.write_text(json.dumps(data));return path
        self.script=self.root/"script.txt"; self.script.write_text("Womb Watch and an analyzed recording")
        self.asr=js("asr.json", {})
        self.aliases=[dict(heard=h,script="Womb Watch",kind="proper-name-tokenization",
                          occurrence=1,reason="sourced name",source="fixture source")
                      for h in ("WoomWatch","WombWatch")]
        self.heard=[dict(text=t,center=.2+i*.2) for i,t in enumerate(
                    ["WoomWatch","and","and","analyzed","recording"])]
        self.takes=js("takes.json",[dict(id="take1",wav=str(self.source),
                                       transcript="WombWatch and an analyzed recording")])
        report=js("compact.json",dict(source_sha256=digest(self.source),output_sha256=digest(self.compact),
                 time_stretch=1.,threshold_dbfs=-38,min_silence_s=.48,
                 max_retained_internal_silence_s=.3,retained_edge_silence_s=.12,removed_intervals=cuts))
        event=dict(kind="telemetry",resource="tts_calls",note="verbatim soundcheck with fixture",
                   reported_tokens=10)
        state=js("state.json",dict(events=[event]))
        self.data=dict(schema="dispatch_alignment_reconciliation/1",
             voice_sha256=digest(self.voice),script_sha256=digest(self.script),asr_sha256=digest(self.asr),
             source_take_id="take1",state_file=str(state),soundcheck_event=event,voice_offset_samples=100,
             corrections=[dict(heard="and",script="an",occurrence=2,acoustic_word_index=2,
                               dtw_center_s=self.heard[2]["center"])])
        for k,f in dict(takes=self.takes,source=self.source,compact=self.compact,silence_edit=report).items():
            self.data[k]=dict(file=str(f),sha256=digest(f))
        self.path=self.root/"evidence.json"

    def run_evidence(self, data=None):
        self.path.write_text(json.dumps(self.data if data is None else data))
        heard, proof = reconcile(self.path,self.voice,self.script,self.asr,self.heard,self.aliases)
        groups, evidence=acoustic_groups(self.script.read_text().split(),[(0.,2.)],heard,self.aliases)
        return heard, evidence

    def test_exact_and_shared_anchor(self):
        revised,evidence=self.run_evidence()
        self.assertEqual([w["center"] for w in revised],[w["center"] for w in self.heard])
        self.assertEqual(evidence[0]["dtw_center_s"],evidence[1]["dtw_center_s"])
        self.assertEqual(self.heard[2]["text"],"and")

    def test_stale_binding(self):
        for key in ("voice_sha256","script_sha256","asr_sha256"):
            bad=copy.deepcopy(self.data);bad[key]="0"*64
            with self.subTest(key=key),self.assertRaises(ValueError):self.run_evidence(bad)

    def test_wrong_occurrence(self):
        bad=copy.deepcopy(self.data)
        bad["corrections"][0].update(occurrence=1,acoustic_word_index=1,dtw_center_s=self.heard[1]["center"])
        with self.assertRaises(ValueError):self.run_evidence(bad)

    def test_forbidden_substitution(self):
        for a,b in (("is","isn't"),("one","two"),("and","the"),("an","and")):
            bad=copy.deepcopy(self.data);bad["corrections"][0].update(heard=a,script=b)
            with self.subTest(pair=(a,b)),self.assertRaises(ValueError):self.run_evidence(bad)

    def test_missing_and_added_words(self):
        for text in ("WombWatch and analyzed recording","WombWatch and an extra analyzed recording",
                     "WombWatch and an analyzed recording isn't"):
            take=json.loads(self.takes.read_text());take[0]["transcript"]=text
            self.takes.write_text(json.dumps(take));self.data["takes"]["sha256"]=digest(self.takes)
            with self.subTest(text=text),self.assertRaises(ValueError):self.run_evidence()

    def test_wrong_pcm_even_with_updated_hash(self):
        with wave.open(str(self.voice),"rb") as w: samples=np.frombuffer(w.readframes(w.getnframes()),dtype="<i2").copy()
        samples[200]+=3
        with wave.open(str(self.voice),"wb") as w:
            w.setparams((1,2,self.rate,0,"NONE","not compressed"));w.writeframes(samples.tobytes())
        self.data["voice_sha256"]=digest(self.voice)
        with self.assertRaises(ValueError):self.run_evidence()

    def test_false_soundcheck_event(self):
        self.data["soundcheck_event"]["reported_tokens"]=9
        with self.assertRaises(ValueError):self.run_evidence()

    def test_article_alias_cannot_bypass_evidence(self):
        with self.assertRaises(ValueError):
            acoustic_groups(["an"],[(0,2)],[dict(text="and",center=1)],
                            [dict(heard="and",script="an",source="fixture",reason="assertion")])

    def test_name_expansion_requires_explicit_kind_and_occurrence(self):
        for key in ("kind","occurrence","source"):
            alias=copy.deepcopy(self.aliases[:1]);alias[0].pop(key)
            with self.subTest(key=key),self.assertRaises(ValueError):
                acoustic_groups(["Womb","Watch"],[(0,2)],self.heard[:1],alias)

    def test_archive_preserves_receipt_and_all_references(self):
        import os
        import shutil
        from alignment_reconciliation import package
        old = Path.cwd()
        try:
            os.chdir(self.root)
            out = Path("out"); out.mkdir()
            for name in ("alignment_aliases.json", "mix_vo.wav", "vo_script.txt", "acoustic-asr.json"):
                (out / name).write_bytes(b"fixture")
            data=copy.deepcopy(self.data)
            data["state_file"]="state.json"
            for key in ("takes", "source", "compact", "silence_edit"):
                data[key]["file"]=Path(data[key]["file"]).name
            receipt=out/"alignment_reconciliation.json"
            receipt.write_text(json.dumps(data))
            original=receipt.read_bytes()
            # deliver_run.sh passes the absolute repository output directory.
            package(out.resolve(), Path("delivery").resolve())
            with self.assertRaises(ValueError):
                package(self.root.parent / "outside-repository", Path("rejected"))
            shutil.rmtree(out)
            root=Path("delivery/alignment-evidence")
            self.assertEqual((root/receipt).read_bytes(),original)
            for row in json.loads((root/"manifest.json").read_text()):
                self.assertEqual(digest(root/row["file"]),row["sha256"])
        finally:
            os.chdir(old)


if __name__ == "__main__":
    unittest.main()
