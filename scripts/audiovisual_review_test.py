"""No provider calls. Exercise reuse and rejection at the actual review entry point."""
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import audiovisual_review as av

class ReviewReuse(unittest.TestCase):
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
