"""Reproduce cached startup drift using real Git checkouts and preserve unsafe inputs."""
import hashlib
import io
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

import claude_session_start as start


def git(repo, *args):
    return subprocess.run(['git', '-C', str(repo), *args], check=True,
                          capture_output=True, text=True).stdout.strip()


class SessionStartTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name).resolve()
        self.source = self.root / 'source'; self.tools = self.root / 'tools'
        self.workspace = self.root / 'workspace'; self.workspace.mkdir()
        subprocess.run(['git', 'init', '-q', '-b', 'main', str(self.source)], check=True)
        git(self.source, 'config', 'user.name', 'Fixture')
        git(self.source, 'config', 'user.email', 'fixture@example.com')
        for name in start.BOUND_FILES:
            target = self.source / 'scripts' / name; target.parent.mkdir(exist_ok=True)
            target.write_text('old cached source ' + name)
        import visual_observations
        for name in visual_observations.ROLE_NAMES:
            target = self.source / 'config/claude_agents' / (name + '.md')
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text((visual_observations.REPO / 'config/claude_agents' / target.name).read_text())
        git(self.source, 'add', '-A'); git(self.source, 'commit', '-qm', 'cached setup')
        subprocess.run(['git', 'clone', '-q', self.source.as_uri(), str(self.tools)], check=True)
        self.cached = git(self.tools, 'rev-parse', 'HEAD')
        (self.source / 'scripts/public_state.py').write_text('current production codec')
        git(self.source, 'add', '-A'); git(self.source, 'commit', '-qm', 'new production codec')
        self.current = git(self.source, 'rev-parse', 'HEAD')

    def refresh(self):
        return start.refresh(self.tools, self.workspace, self.source.as_uri())

    def test_cached_start_updates_to_current_main_and_keeps_production_and_settings_untouched(self):
        ledger = self.workspace / 'run_state.json'; ledger.write_bytes(b'unchanged ledger and charges')
        settings = self.workspace / '.claude/settings.json'; settings.parent.mkdir()
        settings.write_text('{"permissions":{"deny":["send"]},"model":"sonnet"}')
        # A cached host already has its owned observers installed. New bindings now
        # include that observer source, so retain the actual installed settings baseline.
        import visual_observations
        visual_observations.install(self.tools, self.workspace)
        old_settings = settings.read_bytes()
        receipt = self.refresh()
        self.assertEqual((receipt['previous_head'], receipt['head']), (self.cached, self.current))
        self.assertEqual(git(self.tools, 'rev-parse', 'HEAD'), self.current)
        self.assertEqual(receipt['source_sha256']['public_state.py'],
                         hashlib.sha256(b'current production codec').hexdigest())
        self.assertEqual(ledger.read_bytes(), b'unchanged ledger and charges')
        self.assertEqual(settings.read_bytes(), old_settings)
        self.assertFalse(receipt['permissions_changed']); self.assertFalse(receipt['capture_authorized'])
        self.assertEqual(self.refresh()['head'], self.current)

    def test_dirty_tools_are_preserved_without_checkout(self):
        for relative in ('scripts/public_state.py', 'untracked-evidence.txt'):
            target = self.tools / relative; target.write_text('preserve this exact failed evidence')
            with self.assertRaisesRegex(ValueError, 'preserve changed tools cache'):
                self.refresh()
            self.assertEqual(target.read_text(), 'preserve this exact failed evidence')
            self.assertEqual(git(self.tools, 'rev-parse', 'HEAD'), self.cached)
            git(self.tools, 'checkout', '--', 'scripts/public_state.py') if relative.startswith('scripts/') else target.unlink()

    def test_old_cached_start_installs_new_completion_observer_from_fresh_source(self):
        # Reproduce the already-saved startup function: it imports install only AFTER checkout.
        # No saved environment edit or agent turn is needed to discover the new observer.
        settings = self.workspace / '.claude/settings.json'; settings.parent.mkdir()
        foreign = {'hooks': [{'type': 'command', 'command': 'foreign-stop'}]}
        settings.write_text(json.dumps({'model': 'saved-sonnet', 'effortLevel': 'medium',
            'permissions': {'deny': ['send']}, 'hooks': {'Stop': [foreign]}}))
        (self.source / 'scripts/completion_yield.py').write_text('new native completion observer')
        git(self.source, 'add', '-A'); git(self.source, 'commit', '-qm', 'completion observer rollout')
        receipt = self.refresh(); saved = json.loads(settings.read_text())
        self.assertEqual(receipt['previous_head'], self.cached)
        self.assertEqual(receipt['head'], git(self.source, 'rev-parse', 'HEAD'))
        self.assertEqual(saved['model'], 'saved-sonnet'); self.assertEqual(saved['effortLevel'], 'medium')
        self.assertEqual(saved['permissions'], {'deny': ['send']})
        self.assertIn(foreign, saved['hooks']['Stop'])
        self.assertIn(str(self.tools / 'scripts/completion_yield.py'),
                      saved['hooks']['SubagentStop'][0]['hooks'][0]['command'])
        before = settings.read_bytes(); self.refresh(); self.assertEqual(settings.read_bytes(), before)

    def test_foreign_origin_symlink_and_production_nested_cache_are_refused(self):
        with self.assertRaisesRegex(ValueError, 'origin changed'):
            start.refresh(self.tools, self.workspace)
        alias = self.root / 'alias'; alias.symlink_to(self.tools, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, 'real preinstalled'):
            start.refresh(alias, self.workspace, self.source.as_uri())
        with self.assertRaisesRegex(ValueError, 'outside the production'):
            start.refresh(self.tools, self.root, self.source.as_uri())

    def test_missing_required_source_refuses_before_switching_the_cache(self):
        git(self.source, 'rm', '-q', 'scripts/capture_guard.py')
        git(self.source, 'commit', '-qm', 'incomplete source fixture')
        with self.assertRaisesRegex(ValueError, 'cat-file'):
            self.refresh()
        self.assertEqual(git(self.tools, 'rev-parse', 'HEAD'), self.cached)

    def test_actual_cli_event_gate_never_runs_for_local_or_unrelated_events(self):
        with patch('sys.argv', ['start', '--workspace', str(self.workspace)]), \
                patch.dict(start.os.environ, {'CLAUDE_CODE_REMOTE': 'false'}), \
                patch.object(start, 'refresh') as refresh:
            self.assertEqual(start.main(), 0); refresh.assert_not_called()
        with patch('sys.argv', ['start', '--workspace', str(self.workspace)]), \
                patch.dict(start.os.environ, {'CLAUDE_CODE_REMOTE': 'true'}), \
                patch('sys.stdin', io.StringIO(json.dumps({'hook_event_name': 'Stop'}))):
            with self.assertRaisesRegex(ValueError, 'actual SessionStart'):
                start.main()


if __name__ == '__main__':
    unittest.main()
