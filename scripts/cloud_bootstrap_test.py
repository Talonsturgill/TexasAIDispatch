"""Cloud setup refuses unsafe placement and corrupt downloads before replacing caches."""
import hashlib
import io
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
            with patch.object(cloud.urllib.request, 'urlopen', return_value=io.BytesIO(b'corrupt')):
                with self.assertRaisesRegex(ValueError, 'hash failed'):
                    cloud.model_cache(model, cfg)
            self.assertEqual(b'previous', model.read_bytes())

    def test_verified_model_is_reused_without_network(self):
        with tempfile.TemporaryDirectory() as directory:
            model = Path(directory) / 'model.bin'; model.write_bytes(b'expected')
            with patch.object(cloud.urllib.request, 'urlopen') as fetch:
                cloud.model_cache(model, {'sha256': hashlib.sha256(b'expected').hexdigest()})
                fetch.assert_not_called()


if __name__ == '__main__':
    unittest.main()
