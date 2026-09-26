"""No provider calls. Exercise reuse and rejection at the actual review entry point."""
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import audiovisual_review as av

class ReviewReuse(unittest.TestCase):
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
