"""Check the GitHub-owned Claude model and effort route without starting a model."""
from __future__ import annotations
import argparse
import copy
import json
import os
from pathlib import Path
import tempfile
import unittest
import yaml

REPO = Path(__file__).resolve().parents[1]


def problems(repo=REPO, environ=None):
    repo = Path(repo)
    errors = []
    try:
        cfg = json.loads((repo / 'config/claude_runtime.json').read_text())
        settings = json.loads((repo / '.claude/settings.json').read_text())
        if cfg['primary'] != {'model': 'claude-sonnet-5-5', 'effort': 'medium'}:
            errors.append('Claude director must use the owner-selected Sonnet route')
        if (settings.get('model'), settings.get('effortLevel')) != (
                cfg['primary']['model'], cfg['primary']['effort']):
            errors.append('Claude project settings differ from the runtime route')
        if settings.get('attribution') != {'commit': '', 'pr': '', 'sessionUrl': False}:
            errors.append('Owner commit and PR attribution must be preserved')
        names = {}
        for role, row in cfg['roles'].items():
            path = repo / '.claude/agents' / (row['agent'] + '.md')
            parts = path.read_text().split('---', 2)
            if len(parts) != 3 or parts[0].strip():
                raise ValueError('Invalid leaf definition ' + path.name)
            front = yaml.safe_load(parts[1])
            expected = (row['agent'], row['model'], row['effort'])
            if (front.get('name'), front.get('model'), front.get('effort')) != expected:
                errors.append('Claude leaf route differs for ' + role)
            prior = names.setdefault(row['agent'], expected)
            if prior != expected:
                errors.append('Shared leaf has incompatible model or effort assignments')
        if set(cfg['roles']) != {'researcher', 'validator', 'scene-builder',
                                'storyboard-critic', 'vo-director', 'picture', 'story', 'sound'}:
            errors.append('Claude route must preserve the existing production roles')
        authority = (repo / 'prompts/claude_routine.md').read_text()
        for required in ('prompts/dispatch_routine.md', 'finish --result shipped',
                         'Never send email or post socially', 'native_headroom.py',
                         'canonical phone playback', 'unsent Gmail draft'):
            if required not in authority:
                errors.append('Claude entry point lacks required authority ' + required)
        env = os.environ if environ is None else environ
        override = env.get('CLAUDE_CODE_EFFORT_LEVEL', '')
        if override not in ('', 'auto'):
            errors.append('Inherited CLAUDE_CODE_EFFORT_LEVEL overrides role effort; '
                          'resolve it in this routine environment before starting workers')
    except (OSError, ValueError, KeyError, TypeError) as exc:
        errors.append('Claude route is incomplete: ' + str(exc))
    return errors


class ContractTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.repo = Path(self.tmp.name)
        files = ['config/claude_runtime.json', '.claude/settings.json',
                 'prompts/claude_routine.md']
        cfg = json.loads((REPO / files[0]).read_text())
        files += list({'.claude/agents/' + row['agent'] + '.md'
                       for row in cfg['roles'].values()})
        for name in files:
            target = self.repo / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes((REPO / name).read_bytes())

    def test_current_route(self):
        self.assertEqual([], problems(self.repo, {}))

    def test_inherited_effort_is_not_silently_accepted(self):
        self.assertTrue(problems(self.repo, {'CLAUDE_CODE_EFFORT_LEVEL': 'max'}))

    def test_wrong_worker_model(self):
        p = self.repo / '.claude/agents/researcher.md'
        p.write_text(p.read_text().replace('claude-haiku-5-5', 'claude-opus-5-5'))
        self.assertTrue(problems(self.repo, {}))

    def test_wrong_director_effort(self):
        p = self.repo / '.claude/settings.json'
        data = json.loads(p.read_text()); data['effortLevel'] = 'max'
        p.write_text(json.dumps(data))
        self.assertTrue(problems(self.repo, {}))

    def test_missing_leaf(self):
        (self.repo / '.claude/agents/scene-builder.md').unlink()
        self.assertTrue(problems(self.repo, {}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--self-test', action='store_true')
    args = parser.parse_args()
    if args.self_test:
        suite = unittest.defaultTestLoader.loadTestsFromTestCase(ContractTests)
        result = unittest.TextTestRunner(verbosity=1).run(suite)
        raise SystemExit(not result.wasSuccessful())
    errors = problems()
    print('\n'.join(errors) if errors else 'Claude Sonnet director and explicit leaf routes verified.')
    raise SystemExit(bool(errors))
