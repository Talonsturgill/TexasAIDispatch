"""No provider calls. Exercise reuse and rejection at the actual review entry point."""
import json
import multiprocessing
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import audiovisual_review as av

class ReviewReuse(unittest.TestCase):
    def test_lenses_share_complete_evidence_prefix_without_sharing_verdicts(self):
        import creative_release
        evidence = "exact source and guide bytes\n" * 1000
        assessment = creative_release.assessment_prompt("av")
        with patch.object(av, "source_context", return_value=evidence):
            prompts = {role: av.request_prompt(Path("film.mp4"), role)
                       for role in ("hero", "picture", "story", "sound")}
        common = evidence + "\n" + assessment + "\n"
        for role, prompt in prompts.items():
            self.assertTrue(prompt.startswith(common))
            self.assertEqual(prompt[len(common):], av.review_prompt(role))
            self.assertEqual(prompt.count(evidence), 1)
        self.assertEqual(len(set(prompts.values())), 4)

    def test_concurrent_lenses_keep_every_reservation_and_receipt(self):
        from unittest.mock import Mock
        ctx = multiprocessing.get_context("fork")
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            film = root / "film.mp4"; film.write_bytes(b"exact unchanged film")
            state = root / "run_state.json"; state.write_text('{"roles": []}')
            first_read, release, other_read = ctx.Event(), ctx.Event(), ctx.Event()
            started = [ctx.Event(), ctx.Event()]

            def reserve_fixture(path, resources, note):
                ledger = json.loads(path.read_text())
                role = note.rsplit(" ", 1)[-1]
                if role == "picture":
                    first_read.set()
                    if not release.wait(10):
                        raise AssertionError("first reservation was never released")
                else:
                    other_read.set()
                ledger["roles"].append(role)
                path.write_text(json.dumps(ledger))
                return True, "reserved"

            def worker(role, signal=None):
                if signal is not None:
                    signal.set()
                response = Mock(status_code=200)
                with patch.dict(av.os.environ, {"GEMINI_API_KEY": "fixture-only"}), \
                     patch.object(av, "cached_review", return_value=(root / ("cache-" + role), False)), \
                     patch.object(av, "reserve", side_effect=reserve_fixture), \
                     patch.object(av, "record_telemetry"), \
                     patch.object(av, "source_context", return_value="fixture source context"), \
                     patch.object(av, "media_part", return_value=({}, None, av.digest(film))), \
                     patch.object(av, "remove_upload"), \
                     patch.object(av.requests, "post", return_value=response), \
                     patch.object(av, "streamed_response", return_value={"usageMetadata": {"totalTokenCount": 7}}), \
                     patch.object(av, "av_problems", return_value=[]):
                    av.review(film, role, state, root / (role + ".json"))

            jobs = [ctx.Process(target=worker, args=("picture",))]
            jobs[0].start()
            try:
                self.assertTrue(first_read.wait(10))
                for role, signal in zip(("story", "sound"), started):
                    job = ctx.Process(target=worker, args=(role, signal))
                    jobs.append(job); job.start()
                for signal in started:
                    self.assertTrue(signal.wait(10))
                self.assertFalse(other_read.wait(.3), "a second lens reached the stale ledger")
            finally:
                release.set()
                for job in jobs:
                    job.join(10)
                    if job.is_alive():
                        job.terminate(); job.join()
            self.assertEqual([job.exitcode for job in jobs], [0, 0, 0])
            self.assertCountEqual(json.loads(state.read_text())["roles"], ["picture", "story", "sound"])
            for role in ("picture", "story", "sound"):
                receipt = json.loads((root / (role + ".json")).read_text())
                self.assertEqual(receipt["film_sha256"], av.digest(film))
                self.assertEqual(receipt["role"], role)

    def test_current_source_context_is_bound_and_does_not_supply_prior_verdicts(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); (root / "cinema").mkdir()
            (root / "storyboard.json").write_text('{"date":"2026-10-01"}')
            (root / "vo_script.txt").write_text("The target check can trigger retraction.")
            (root / "claims.json").write_text(json.dumps({"claims": [
                {"id": "c5", "verdict": "VERIFIED", "quote": "Delivery would cease.", "url": "https://example.test/source"},
                {"id": "bad", "verdict": "REJECTED", "quote": "Unsupported words"}]}))
            (root / "report_card.json").write_text('{"ship":true,"score":10}')
            film = root / 'cinema/hero.mp4'; film.write_bytes(b'current encoded film fixture')
            context = av.source_context(root / "cinema/hero.mp4")
            self.assertIn("not proof of what was spoken", context)
            self.assertIn(av.digest(root / "vo_script.txt"), context)
            self.assertIn("Delivery would cease.", context)
            self.assertNotIn("Unsupported words", context)
            self.assertNotIn('"ship": true', context)
            self.assertIn(av.digest(film), context)
            self.assertIn('do not guess a hash', context)
            film.write_bytes(b'different encoded film fixture')
            self.assertNotEqual(context, av.source_context(film))

    def test_future_context_excludes_nested_old_critique_and_keeps_current_evidence(self):
        import review_board_projection as views
        from review_board_projection_test import retained_board
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); film = root/'film.mp4'; film.write_bytes(b'exact film fixture')
            board = retained_board(); path = root/'storyboard.json'
            path.write_text(json.dumps(board)); before = path.read_bytes()
            (root/'vo_script.txt').write_text('Exact current authored transcript.')
            (root/'claims.json').write_text(json.dumps({'claims': [
                {'id': 'c1', 'verdict': 'VERIFIED', 'quote': 'Complete fetched quote.',
                 'url': 'https://example.test/source'}]}))
            context = json.loads(av.source_context(film).rsplit('\n', 1)[-1])
            self.assertEqual(context['bindings']['storyboard.json'], av.digest(path))
            self.assertEqual(context['narration_picture']['clauses'], board['narration_picture']['clauses'])
            self.assertEqual(context['fetched_source_excerpts'][0]['quote'], 'Complete fetched quote.')
            self.assertEqual(context['authored_transcript'], 'Exact current authored transcript.')
            self.assertEqual(context['review_board_projection'], views.TRANSPORT_NOTE)
            self.assertNotIn('critique_json', context['narration_picture']['timing_provenance']['approved_retime'])
            for name, content in context.get('craft_guides', {}).items():
                self.assertEqual(content, (av.Path(__file__).resolve().parents[1]/name).read_text())
            self.assertEqual(before, path.read_bytes())
            board['date'] = '2026-10-21'; path.write_text(json.dumps(board))
            old = json.loads(av.source_context(film).rsplit('\n', 1)[-1])
            self.assertEqual(old['narration_picture'], board['narration_picture'])
            self.assertNotIn('review_board_projection', old)

    def test_invalid_archival_proof_is_refused_before_av_reservation_or_provider(self):
        from review_board_projection_test import retained_board
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); film = root/'film.mp4'; film.write_bytes(b'exact film fixture')
            board = retained_board()
            board['narration_picture']['timing_provenance']['approved_retime']['critique_json'] += ' '
            (root/'storyboard.json').write_text(json.dumps(board))
            (root/'claims.json').write_text('{"claims":[]}')
            (root/'vo_script.txt').write_text('Current transcript.')
            with patch.dict(av.os.environ, {'GEMINI_API_KEY': 'fixture-only'}), \
                    patch.object(av, 'cached_review', return_value=(root/'cache', False)), \
                    patch.object(av, 'reserve') as reserve, \
                    patch.object(av.requests, 'post') as provider:
                with self.assertRaisesRegex(ValueError, 'critique bytes changed'):
                    av.review(film, 'story', root/'state.json', root/'receipt.json')
                reserve.assert_not_called(); provider.assert_not_called()

    def test_hero_scope_does_not_require_complete_film_credits(self):
        hero = av.review_prompt("hero")
        self.assertIn("short finished passage", hero)
        self.assertIn("not required inside this passage", hero)
        self.assertNotIn("held for at least five seconds", hero)
        self.assertIn("Still reject idle holds", hero)
        for role in ("picture", "story", "sound"):
            prompt = av.review_prompt(role)
            self.assertIn("held for at least five seconds", prompt)
            self.assertNotIn("not required inside this passage", prompt)
            self.assertIn("If audio is unavailable, set audio_access false and pass false", prompt)

    def test_source_limit_is_not_permission_for_weak_story_or_invented_claims(self):
        for role in ("picture", "story", "sound"):
            prompt = av.review_prompt(role)
            self.assertIn("actually says from your inference", prompt)
            self.assertIn("not a requirement to invent a", prompt)
            self.assertIn("Still reject an ending that fails to answer its opening question", prompt)
            self.assertIn("Do not grant a", prompt)
            self.assertIn("If audio is unavailable, set audio_access false and pass false", prompt)

    def test_legacy_cache_survives_tool_change_without_new_review(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); film = root / "film.mp4"; film.write_bytes(b"same rejected film")
            state = root / "run_state.json"; out = root / "review.json"
            cache = root / "cinema" / "review-cache" / "legacy-tool-digest"
            cache.mkdir(parents=True)
            raw = cache / "response.json"; raw.write_text('{"pass": false}')
            receipt = {"film_sha256": av.digest(film), "role": "story",
                       "response": {"file": raw.name, "sha256": av.digest(raw)}}
            (cache / "receipt.json").write_text(json.dumps(receipt))
            with patch.object(av, "reserve", side_effect=AssertionError("spent budget")), \
                 patch.object(av.requests, "post", side_effect=AssertionError("provider called")), \
                 patch.object(av, "av_problems", return_value=["retained rejection"]):
                with self.assertRaisesRegex(ValueError, "already reviewed"):
                    av.review(film, "story", state, out)
            self.assertEqual(json.loads(out.read_text())["film_sha256"], av.digest(film))

    def test_stream_preserves_real_chunks_and_rejects_incomplete_results(self):
        from unittest.mock import Mock
        chunks = [
            {"responseId": "real-provider-id", "candidates": [{"content": {"parts": [{"text": '{"pass":'}]}}]},
            {"responseId": "real-provider-id", "candidates": [{"content": {"parts": [{"text": "false}"}]}, "finishReason": "STOP"}],
             "usageMetadata": {"totalTokenCount": 123}}]
        response = Mock()
        response.iter_lines.return_value = [b"data: " + json.dumps(c).encode() for c in chunks]
        result = av.streamed_response(response)
        self.assertEqual(result["provider_chunks"], chunks)
        self.assertFalse(json.loads("".join(p["text"] for p in result["candidates"][0]["content"]["parts"]))["pass"])
        self.assertEqual(result["usageMetadata"]["totalTokenCount"], 123)
        response.iter_lines.return_value = [b"data: " + json.dumps(chunks[0]).encode()]
        with self.assertRaisesRegex(ValueError, "incomplete"):
            av.streamed_response(response)


    def test_exact_result_reused_before_reservation_or_network(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); film=root/"film.mp4"; film.write_bytes(b"exact film")
            state=root/"run_state.json"; out=root/"review.json"
            cache, reused=av.cached_review(film,"picture",state,out)
            self.assertFalse(reused)
            cache.mkdir(parents=True)
            raw=cache/"response.json"; raw.write_text('{"provider":"retained"}')
            receipt={"film_sha256":av.digest(film),"role":"picture",
                     "response":{"file":raw.name,"sha256":av.digest(raw)}}
            (cache/"receipt.json").write_text(json.dumps(receipt))
            with patch.object(av,"reserve",side_effect=AssertionError("spent budget")), \
                 patch.object(av.requests,"post",side_effect=AssertionError("provider called")), \
                 patch.object(av,"av_problems",return_value=[]):
                av.review(film,"picture",state,out)
            with patch.object(av,"reserve",side_effect=AssertionError("spent budget")), \
                 patch.object(av,"av_problems",return_value=["provider rejected the action"]):
                with self.assertRaisesRegex(ValueError,"already reviewed"):
                    av.review(film,"picture",state,out)
            self.assertFalse(av.cached_review(film,"sound",state,out)[1])
            film.write_bytes(b"repaired film")
            self.assertFalse(av.cached_review(film,"picture",state,out)[1])

if __name__ == "__main__": unittest.main()
