"""Real partial clones keep prelaunch source available without downloading archived films."""
import hashlib
import os
from pathlib import Path
import subprocess
import tempfile
import unittest


def git(repo, *args):
    return subprocess.run(['git', '-C', str(repo), *args], check=True,
                          capture_output=True, text=True).stdout.strip()


class PrelaunchCheckoutTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.source = self.root / 'source'
        self.cache = self.root / 'prelaunch'
        subprocess.run(['git', 'init', '-q', '-b', 'main', str(self.source)], check=True)
        git(self.source, 'config', 'user.name', 'Test')
        git(self.source, 'config', 'user.email', 'test@example.com')
        git(self.source, 'config', 'uploadpack.allowFilter', 'true')
        for path in ('scripts/tool.py', 'config/runtime.json', 'assets/font.dat',
                     'video-engine/src/Film.tsx', 'prompts/routine.md',
                     'knowledge/guide.md', '.claude/agents/critic.md', 'requirements.txt'):
            target = self.source / path
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text('required source ' + path)
        self.film = self.source / 'runs/2026-10-01/dispatch.mp4'
        self.film.parent.mkdir(parents=True)
        self.film.write_bytes(os.urandom(1024 * 1024))
        git(self.source, 'add', '-A')
        git(self.source, 'commit', '-qm', 'source and published fixture')
        self.film_oid = git(self.source, 'rev-parse', 'HEAD:runs/2026-10-01/dispatch.mp4')
        self.film_hash = hashlib.sha256(self.film.read_bytes()).hexdigest()
        setup = (Path(__file__).parent / 'claude_environment_setup.sh').read_text()
        self.checkout_script = setup.split('\ncd "$dispatch_tools"\n', 1)[0]
        self.assertNotEqual(self.checkout_script, setup)
        self.checkout_script = self.checkout_script.replace(
            'dispatch_tools=/opt/texas-dispatch-tools', 'dispatch_tools=' + str(self.cache))
        self.checkout_script = self.checkout_script.replace(
            'https://github.com/Talonsturgill/TexasAIDispatch.git', self.source.as_uri())

    def prepare(self):
        subprocess.run(['bash', '-c', self.checkout_script], check=True, capture_output=True)

    def local_objects(self):
        return git(self.cache, 'cat-file', '--batch-all-objects',
                   '--batch-check=%(objectname)').splitlines()

    def test_fresh_cache_keeps_source_and_does_not_fetch_archived_media(self):
        self.prepare()
        self.assertEqual((self.cache / 'scripts/tool.py').read_bytes(),
                         (self.source / 'scripts/tool.py').read_bytes())
        self.assertTrue((self.cache / 'assets/font.dat').is_file())
        self.assertTrue((self.cache / 'video-engine/src/Film.tsx').is_file())
        self.assertTrue((self.cache / 'requirements.txt').is_file())
        self.assertFalse((self.cache / 'runs').exists())
        self.assertNotIn(self.film_oid, self.local_objects())
        self.assertEqual(git(self.cache, 'rev-parse', 'HEAD'), git(self.source, 'rev-parse', 'HEAD'))
        self.assertEqual(hashlib.sha256(self.film.read_bytes()).hexdigest(), self.film_hash)
        self.assertEqual(git(self.source, 'status', '--porcelain'), '')

    def test_cached_partial_checkout_updates_source_without_fetching_archived_media(self):
        self.prepare()
        (self.source / 'scripts/tool.py').write_text('updated required source')
        git(self.source, 'add', 'scripts/tool.py')
        git(self.source, 'commit', '-qm', 'update tool')
        self.prepare()
        self.assertEqual((self.cache / 'scripts/tool.py').read_text(), 'updated required source')
        self.assertFalse((self.cache / 'runs').exists())
        self.assertNotIn(self.film_oid, self.local_objects())

    def test_existing_full_cache_is_preserved(self):
        subprocess.run(['git', 'clone', '-q', '--depth', '1', self.source.as_uri(), str(self.cache)],
                       check=True, capture_output=True)
        self.prepare()
        self.assertEqual(hashlib.sha256((self.cache / 'runs/2026-10-01/dispatch.mp4').read_bytes()).hexdigest(),
                         self.film_hash)
        self.assertEqual(git(self.cache, 'status', '--porcelain'), '')


if __name__ == '__main__':
    unittest.main()
