"""Offline regression for selecting existing pauses at declared narration boundaries."""
import copy
from contextlib import redirect_stdout
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import modern_film
import board_retime
import vo_align


class ClauseCueTest(unittest.TestCase):
    def setUp(self):
        self.texts = ["Clinicians sign in with their usual credentials,", "and ask in plain language."]
        self.words, self.clauses = [], []
        for identity, text, start, end in zip(["login", "question"], self.texts,
                                             [11.58, 14.32], [14.04, 15.62]):
            tokens = text.split()
            first = len(self.words)
            for i, token in enumerate(tokens):
                self.words.append({"word": token,
                    "start": start+(end-start)*i/len(tokens),
                    "end": start+(end-start)*(i+1)/len(tokens),
                    "anchored_start": i == 0, "anchored_end": i+1 == len(tokens)})
            self.clauses.append({"id": identity, "text": text,
                                 "word_range": [first, len(self.words)]})

    def captions(self):
        meta, _ = vo_align.clause_contract(self.words, self.clauses)
        return {"cues": vo_align.cues(self.words, clauses=self.clauses),
                "narration_clause_segmentation": meta}

    def test_actual_pause_reproduction_preserves_every_word_and_edge(self):
        before = copy.deepcopy(self.words)
        legacy = vo_align.cues(self.words)
        current = self.captions()["cues"]
        self.assertEqual(len(legacy), 1)
        self.assertEqual([c["text"] for c in current], self.texts)
        self.assertEqual([c["start"] for c in current], [11.58, 14.32])
        self.assertEqual([c["end"] for c in current], [14.04, 15.62])
        self.assertTrue(all(c["source"] == "measured_boundary" for c in current))
        self.assertEqual(self.words, before)

    def test_authored_times_cannot_move_the_split(self):
        before = self.captions()
        for c in self.clauses:
            c.update(start_s=900, end_s=999, cue_ids=["provisional"])
        self.assertEqual(self.captions(), before)

    def test_no_pause_modelled_edge_and_nonfinite_edges_refuse(self):
        for field, value, offset in [
                ("anchored_end", False, 6), ("anchored_start", False, 7),
                ("end", 14.32, 6), ("end", 14.081, 6),
                ("end", float("nan"), 6), ("start", float("inf"), 7),
                ("end", True, 6)]:
            with self.subTest(field=field, value=value, offset=offset):
                words = copy.deepcopy(self.words)
                words[offset][field] = value
                with self.assertRaises(ValueError):
                    vo_align.cues(words, clauses=self.clauses)

    def test_exact_threshold_and_existing_short_sentence_pause(self):
        self.words[6]["end"] = 14.08
        self.assertEqual(len(self.captions()["cues"]), 2)
        self.words[6].update(word="credentials.", end=14.12)
        self.clauses[0]["text"] = self.texts[0].replace(",", ".")
        self.assertEqual(len(vo_align.cues(self.words)), 2)
        self.assertEqual(len(self.captions()["cues"]), 2)

    def test_coverage_drift_duplicate_and_missing_qualifier_refuse(self):
        cases = []
        altered = copy.deepcopy(self.clauses); altered[0]["text"] = altered[0]["text"].replace("usual ", "")
        cases.append(altered)
        altered = copy.deepcopy(self.clauses); altered[1]["id"] = altered[0]["id"]
        cases.append(altered)
        altered = copy.deepcopy(self.clauses); altered[1]["word_range"] = [0, 5]
        cases.append(altered)
        altered = copy.deepcopy(self.clauses); altered[0]["word_range"] = [False, 7]
        cases.extend([altered, self.clauses[:1], list(reversed(self.clauses))])
        for clauses in cases:
            with self.subTest(clauses=clauses), self.assertRaises(ValueError):
                vo_align.cues(self.words, clauses=clauses)

    def board(self):
        rows = copy.deepcopy(self.clauses)
        views, shots, events = {}, [], []
        for i, row in enumerate(rows):
            identity = row["id"]
            row.update(cue_ids=["old-"+identity], scene_id="s1", subject_ids=[identity],
                       action_id=identity, claim_ids=["offline-fixture"], event_ids=[identity])
            views[identity] = {"subject_ids": [identity], "action_ids": [identity]}
            shots.append({"id": identity, "scene_id": "s1", "view": identity,
                          "narration_ids": [identity], "start_s": i, "duration_s": 1})
            events.append({"id": identity, "narration_id": identity,
                           "clause_fraction_start": .1, "clause_fraction_end": .8})
        return {"reference_only": True, "runtime_s": 16,
                "scenes": [{"id": "s1", "start_s": 0, "duration_s": 16,
                            "vo": " ".join(self.texts), "visual_events": events}],
                "narration_picture": {"version": "narration-picture-v1", "clauses": rows},
                "film_direction": {"episode": "offline-fixture", "shots": shots, "rewards": []}}, views

    def compile(self, board, captions, words=None):
        _, views = self.board()
        with tempfile.TemporaryDirectory() as d:
            root = Path(d); (root/"config").mkdir()
            (root/"config/modern_episode_registry.json").write_text(json.dumps(
                {"episodes": {"offline-fixture": {"narration_views": views}}}))
            with patch.object(modern_film, "REPO", root):
                return modern_film.compile_narration(board, captions,
                    {"method": "offline-test-fixture", "words": words or self.words})

    def test_fresh_ids_are_bound_by_complete_text_and_compilation_is_stable(self):
        board, _ = self.board()
        caps = self.captions()
        self.compile(board, caps)
        self.assertEqual([r["cue_ids"] for r in board["narration_picture"]["clauses"]], [["c1"], ["c2"]])
        self.assertEqual(board["narration_picture"]["timing_mode"], "measured_caption_boundaries")
        before = copy.deepcopy(board)
        self.compile(board, caps)
        self.assertEqual(board, before)

    def test_rebound_metadata_shifted_edges_modelled_and_extra_cues_refuse(self):
        caps = self.captions()
        cases = []
        altered = copy.deepcopy(caps); altered["narration_clause_segmentation"]["contract_sha256"] = "0"*64
        cases.append(altered)
        altered = copy.deepcopy(caps); altered["cues"][0]["end"] += .1
        cases.append(altered)
        altered = copy.deepcopy(caps); altered["cues"][0]["source"] = "modelled_edge"
        cases.append(altered)
        altered = copy.deepcopy(caps); altered["cues"][1]["id"] = "c1"
        cases.append(altered)
        altered = copy.deepcopy(caps); altered["cues"].append(copy.deepcopy(altered["cues"][-1]))
        cases.append(altered)
        for candidate in cases:
            with self.subTest(candidate=candidate), self.assertRaises(ValueError):
                self.compile(self.board()[0], candidate)
        changed_words = copy.deepcopy(self.words); changed_words[0]["start"] += .1
        with self.assertRaises(ValueError):
            self.compile(self.board()[0], caps, changed_words)

    def test_cli_verifies_recorded_mode_without_changing_historical_default(self):
        # The ASR stage is an explicit offline stub; its method cannot pass shipment.
        import numpy as np
        with tempfile.TemporaryDirectory() as d:
            root = Path(d); output = root/"out"; output.mkdir()
            voice = root/"voice.wav"; voice.write_bytes(b"offline-waveform-fixture")
            script = root/"script.txt"; script.write_text(" ".join(self.texts))
            board, _ = self.board()
            board["narration_picture"]["timing_mode"] = "authored"
            board_path = root/"board.json"; board_path.write_text(json.dumps(board))
            policy = json.loads((vo_align.REPO/"config/alignment.json").read_text())
            raw = {"offline": "no model or provider call"}
            def transcribe(path, target):
                (target/"acoustic-asr.json").write_text(json.dumps(raw))
                meta = {"voice_sha256": vo_align.digest(path),
                        "asr_sha256": vo_align.digest(target/"acoustic-asr.json"),
                        "model_sha256": policy["sha256"], "version": policy["version"],
                        "flash_attention": False}
                (target/"acoustic-asr-meta.json").write_text(json.dumps(meta))
                return raw, meta
            def aligned(*args):
                return {"method": "offline-test-fixture", "words": copy.deepcopy(self.words),
                        "boundaries_measured": 4, "words_anchored": 4,
                        "words_modelled": len(self.words)-4, "words_total": len(self.words),
                        "acoustic_matching": []}
            args = ["vo_align.py", "--wav", str(voice), "--voice", str(voice),
                    "--script", str(script), "--out", str(output), "--cuts", str(board_path)]
            with patch.object(vo_align, "read_wav", return_value=(np.zeros(10), 48000)), \
                    patch.object(vo_align, "transcribe", side_effect=transcribe), \
                    patch.object(vo_align, "acoustic_words", return_value=[]), \
                    patch.object(vo_align, "align", side_effect=aligned), redirect_stdout(io.StringIO()):
                with patch("sys.argv", args):
                    self.assertEqual(vo_align.main(), 0)
                historical = json.loads((output/"captions.json").read_text())
                self.assertNotIn("narration_clause_segmentation", historical)
                with patch("sys.argv", args+["--clause-boundaries"]):
                    self.assertEqual(vo_align.main(), 0)
                measured = (output/"captions.json").read_bytes()
                with patch("sys.argv", args+["--verify"]):
                    self.assertEqual(vo_align.main(), 0)
                self.assertEqual((output/"captions.json").read_bytes(), measured)
                board["narration_picture"]["clauses"][0]["text"] += " omitted"
                board_path.write_text(json.dumps(board))
                with patch("sys.argv", args+["--verify"]):
                    self.assertEqual(vo_align.main(), 1)
                self.assertEqual((output/"captions.json").read_bytes(), measured)

    def test_retime_passes_actual_evidence_to_its_first_modern_compilation(self):
        board, _ = self.board()
        for event in board["scenes"][0]["visual_events"]:
            event.update(at_s=.5, duration_s=.5)
        caps = self.captions()
        board["captions"] = caps["cues"]
        acoustic = {"method": "offline-test-fixture", "words": self.words}
        calls = []
        def inspect(passed_board, passed_caps, passed_words):
            calls.append((passed_caps, passed_words))
            self.compile(passed_board, passed_caps, passed_words["words"])
            # Scope is cue binding only; this is no production film approval.
            return []
        with patch.object(modern_film, "retime", side_effect=inspect):
            result, errors = board_retime.retime(board, self.words,
                narration_captions=caps, acoustic_words=acoustic)
        self.assertEqual(errors, [])
        self.assertEqual(calls, [(caps, acoustic)])
        self.assertEqual(result["narration_picture"]["timing_mode"], "measured_caption_boundaries")


if __name__ == "__main__":
    unittest.main()
