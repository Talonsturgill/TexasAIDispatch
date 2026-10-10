"""Cloud setup refuses unsafe placement and corrupt downloads before replacing caches."""
import hashlib
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import cloud_bootstrap as cloud


class BootstrapTests(unittest.TestCase):
    def test_local_runtime_is_not_replaced(self):
        with patch.object(cloud.platform, 'system', return_value='Darwin'):
            with self.assertRaisesRegex(ValueError, 'Linux-only'):
                cloud.install()

    def test_source_tree_cannot_be_used_as_runtime_cache(self):
        with patch.object(cloud.platform, 'system', return_value='Linux'), patch.object(cloud, 'cache_root', return_value=cloud.REPO):
            with self.assertRaisesRegex(ValueError, 'outside'):
                cloud.install()

    def test_corrupt_download_retains_existing_model(self):
        with tempfile.TemporaryDirectory() as directory:
            model = Path(directory) / 'model.bin'; model.write_bytes(b'previous')
            cfg = {'url': 'https://example.invalid/model', 'sha256': hashlib.sha256(b'expected').hexdigest()}
            with patch.object(cloud.urllib.request, 'urlopen', side_effect=lambda *a, **k: io.BytesIO(b'corrupt')):
                with self.assertRaisesRegex(ValueError, 'hash failed'):
                    cloud.model_cache(model, cfg, attempts=2)
            self.assertEqual(b'previous', model.read_bytes())

    def test_truncated_stream_is_resumed_to_the_same_pinned_hash(self):
        whole = b'0123456789' * 100
        calls = []

        class Reply(io.BytesIO):
            def __init__(self, data, status, length):
                super().__init__(data); self.status = status
                self.headers = {'Content-Length': str(length)}
            def __enter__(self): return self
            def __exit__(self, *a): return False

        def opener(request, timeout=None):
            start = int((request.headers.get('Range') or 'bytes=0-').split('=')[1].rstrip('-'))
            calls.append(start)
            # The first reply ends cleanly short, as the cloud proxy did. Its length header says so.
            data = whole[start:700] if not start else whole[start:]
            return Reply(data, 206 if start else 200, len(whole) - start)

        with tempfile.TemporaryDirectory() as directory:
            model = Path(directory) / 'model.bin'
            cfg = {'url': 'https://example.invalid/model', 'sha256': hashlib.sha256(whole).hexdigest()}
            cloud.model_cache(model, cfg, opener=opener)
            self.assertEqual(whole, model.read_bytes())
            self.assertEqual([0, 700], calls)
            self.assertFalse(model.with_suffix('.download').exists())

    def test_truncated_server_that_ignores_range_restarts_instead_of_appending(self):
        whole = b'abcdefghij' * 50
        replies = [whole[:300], whole]

        def opener(request, timeout=None):
            return io.BytesIO(replies.pop(0))

        with tempfile.TemporaryDirectory() as directory:
            model = Path(directory) / 'model.bin'
            cloud.model_cache(model, {'url': 'https://example.invalid/m', 'sha256': hashlib.sha256(whole).hexdigest()}, opener=opener)
            self.assertEqual(whole, model.read_bytes())

    def test_pinned_alignment_model_is_unchanged(self):
        cfg = json.loads((cloud.REPO / 'config/alignment.json').read_text())
        self.assertEqual('c6138d6d58ecc8322097e0f987c32f1be8bb0a18532a3f88f734d1bbf9c41e5d', cfg['sha256'])
        self.assertIn('5359861c739e955e79d9a303bcbc70fb988958b1', cfg['url'])

    def test_verified_model_is_reused_without_network(self):
        with tempfile.TemporaryDirectory() as directory:
            model = Path(directory) / 'model.bin'; model.write_bytes(b'expected')
            with patch.object(cloud.urllib.request, 'urlopen') as fetch:
                cloud.model_cache(model, {'sha256': hashlib.sha256(b'expected').hexdigest()})
                fetch.assert_not_called()


if __name__ == '__main__':
    unittest.main()
