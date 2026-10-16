"""Cloud setup refuses unsafe placement and corrupt downloads before replacing caches."""
import hashlib
import io
import json
import shutil
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import cloud_bootstrap as cloud


class BootstrapTests(unittest.TestCase):
    def node_fixture(self, folder):
        engine = Path(folder)/'repo/video-engine'; engine.mkdir(parents=True)
        cache = Path(folder)/'cache'; lock = engine/'package-lock.json'; lock.write_text('frozen-lock')
        target = engine/'node_modules'; (target/'package').mkdir(parents=True)
        (target/'package/runtime.js').write_text('export const pinned = true;')
        (target/'package/runtime.js').chmod(0o755)
        (target/'.dispatch-lock.sha256').write_text(cloud.digest(lock))
        (target/'alias').symlink_to('package')
        locked = cache/'node'/cloud.digest(lock)/'node_modules'
        return engine, cache, target, locked

    def test_prelaunch_promotes_instead_of_copying_and_binding_is_idempotent(self):
        with tempfile.TemporaryDirectory() as folder:
            engine, cache, target, locked = self.node_fixture(folder)
            before = cloud.node_tree(target)
            self.assertEqual(cloud.share_node_runtime(engine, cache)['operation'], 'promote')
            self.assertFalse(locked.exists()); self.assertFalse(target.is_symlink())
            cloud.share_node_runtime(engine, cache, apply=True)
            self.assertTrue(target.is_symlink()); self.assertEqual(target.resolve(), locked.resolve())
            self.assertEqual(cloud.node_tree(locked), before)
            self.assertEqual(cloud.share_node_runtime(engine, cache, apply=True)['operation'], 'already-shared')

    def test_only_exact_duplicate_is_removed_and_shared_runtime_is_unchanged(self):
        with tempfile.TemporaryDirectory() as folder:
            engine, cache, target, locked = self.node_fixture(folder)
            shutil.copytree(target, locked, symlinks=True)
            before = cloud.node_tree(locked)
            self.assertEqual(cloud.share_node_runtime(engine, cache)['operation'], 'deduplicate')
            cloud.share_node_runtime(engine, cache, apply=True)
            self.assertTrue(target.is_symlink()); self.assertEqual(cloud.node_tree(locked), before)
            self.assertFalse(list(engine.glob('.dispatch-node-duplicate-*')))

    def test_changed_bytes_modes_or_foreign_entries_are_preserved(self):
        for change in ('bytes', 'mode', 'extra'):
            with tempfile.TemporaryDirectory() as folder:
                engine, cache, target, locked = self.node_fixture(folder)
                shutil.copytree(target, locked, symlinks=True)
                if change == 'bytes': (target/'package/runtime.js').write_text('unrelated edit')
                elif change == 'mode': (target/'package/runtime.js').chmod(0o644)
                else: (target/'keep').write_text('unrelated')
                before = cloud.node_tree(target)
                with self.assertRaisesRegex(ValueError, 'Different runtime trees preserved'):
                    cloud.share_node_runtime(engine, cache, apply=True)
                self.assertFalse(target.is_symlink()); self.assertEqual(cloud.node_tree(target), before)

    def test_failed_link_restores_original_tree(self):
        with tempfile.TemporaryDirectory() as folder:
            engine, cache, target, locked = self.node_fixture(folder)
            before = cloud.node_tree(target)
            with patch.object(Path, 'symlink_to', side_effect=OSError('fixture link failure')):
                with self.assertRaisesRegex(OSError, 'link failure'):
                    cloud.share_node_runtime(engine, cache, apply=True)
            self.assertFalse(target.is_symlink()); self.assertFalse(locked.exists())
            self.assertEqual(cloud.node_tree(target), before)

    def test_pin_change_detaches_only_owned_link_and_retains_old_runtime(self):
        with tempfile.TemporaryDirectory() as folder:
            engine, cache, target, locked = self.node_fixture(folder)
            cloud.share_node_runtime(engine, cache, apply=True)
            before = cloud.node_tree(locked)
            cloud.detach_owned_node_link(target, cache)
            self.assertFalse(target.exists()); self.assertEqual(cloud.node_tree(locked), before)
            foreign = Path(folder)/'foreign'; foreign.mkdir(); target.symlink_to(foreign)
            with self.assertRaisesRegex(ValueError, 'Foreign node_modules link preserved'):
                cloud.detach_owned_node_link(target, cache)
            self.assertTrue(target.is_symlink())

    def test_legacy_binding_reuses_pinned_python_and_preserves_other_cache(self):
        with tempfile.TemporaryDirectory() as folder:
            cache = Path(folder) / 'installed'; legacy = Path(folder) / 'home/.cache/texas-ai-dispatch'
            with self.assertRaisesRegex(ValueError, 'installed'):
                cloud.bind_legacy_cache(cache, legacy)
            (cache / 'venv/bin').mkdir(parents=True)
            (cache / 'venv/bin/python').write_text('fixture')
            self.assertTrue(cloud.bind_legacy_cache(cache, legacy))
            self.assertTrue(cloud.bind_legacy_cache(cache, legacy))
            self.assertEqual((legacy / 'venv/bin/python').read_text(), 'fixture')
            legacy.unlink(); legacy.mkdir(); (legacy / 'keep').write_text('unrelated')
            self.assertFalse(cloud.bind_legacy_cache(cache, legacy))
            self.assertEqual((legacy / 'keep').read_text(), 'unrelated')

    def test_bind_reuses_only_exact_locked_cache_and_preserves_existing(self):
        with tempfile.TemporaryDirectory() as folder:
            repo = Path(folder) / 'repo'; cache = Path(folder) / 'cache'
            engine = repo / 'video-engine'; engine.mkdir(parents=True)
            lock = engine / 'package-lock.json'; lock.write_text('locked')
            with self.assertRaisesRegex(ValueError, 'not provisioned'):
                cloud.bind_node_runtime(repo, cache)
            locked = cache / 'node' / cloud.digest(lock) / 'node_modules'
            locked.mkdir(parents=True)
            (locked / '.dispatch-lock.sha256').write_text(cloud.digest(lock))
            cloud.bind_node_runtime(repo, cache)
            cloud.bind_node_runtime(repo, cache)
            self.assertEqual((engine / 'node_modules').resolve(), locked.resolve())
            (engine / 'node_modules').unlink(); (engine / 'node_modules').mkdir()
            with self.assertRaisesRegex(ValueError, 'preserved'):
                cloud.bind_node_runtime(repo, cache)

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
