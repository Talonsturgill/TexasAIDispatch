"""Check the GitHub-owned Claude model and effort route without starting a model."""
from __future__ import annotations
import argparse
import copy
import datetime
import re
import sys
import json
import os
from pathlib import Path
import tempfile
import unittest
import yaml
sys.path.insert(0, str(Path(__file__).resolve().parent))

REPO = Path(__file__).resolve().parents[1]


CAPTURE_PHRASES = ('charged render reservation', 'headroom', 'bash scripts/run_with_env.sh',
                   'genuine authored art receipts', 'scratch placeholder')
from capture_guard import CAPTURE_COMMAND, capture_problems, placeholder_art  # noqa: E402,F401


MECHANICAL_FORBIDDEN = ('.claude/', 'config/', 'prompts/', 'knowledge/', 'runs/', 'out/', 'ledger/',
                        'video-engine/src/', 'video-engine/public/', 'assets/', 'docs/')
MECHANICAL_TASKS = {'code-only-review': ('storyboard-critic', 'read-only'),
                    'mechanical-correction': ('scene-builder', 'edit')}
MECHANICAL_REQUIRES = ('failing_case', 'acceptance_results', 'unchanged_controls', 'mutation_checks')


def mechanical_route_problems(cfg):
    """The Haiku mechanical route is a narrow overlay, so its declaration is held to its proven scope."""
    errors = []
    route = cfg.get('mechanical_route')
    if not isinstance(route, dict):
        return ['mechanical_route must be a declaration']
    if (route.get('model'), route.get('effort'), route.get('spawn_model')) != ('claude-haiku-5-5', 'high', 'haiku'):
        errors.append('mechanical route must use the proven Haiku high assignment')
    tasks = route.get('tasks')
    if not isinstance(tasks, dict) or {k: (v.get('role'), v.get('mode')) for k, v in tasks.items()} != MECHANICAL_TASKS:
        errors.append('mechanical route admits only code-only-review on the storyboard critic and '
                      'read-only and mechanical-correction on the scene builder as an edit')
    for row in (tasks or {}).values():
        if row.get('role') not in cfg['roles'] or row.get('role') in ('picture', 'story', 'sound', 'validator'):
            errors.append('mechanical route can never admit a final scorer or the validator')
    allowed = route.get('allowed_paths')
    if (not isinstance(allowed, list) or not allowed or any(
            not (str(pat).startswith('video-engine/tests/') or (str(pat).startswith('scripts/') and str(pat).endswith('_test.py')))
            for pat in allowed)):
        errors.append('mechanical route paths are limited to gate tests and test scripts')
    forbidden = route.get('forbidden_prefixes')
    if not isinstance(forbidden, list) or not set(MECHANICAL_FORBIDDEN) <= set(forbidden):
        errors.append('mechanical route must forbid renderer, source, art, config, prompt and ledger paths')
    if not isinstance(route.get('correction_requires'), list) or not set(MECHANICAL_REQUIRES) <= set(route['correction_requires']):
        errors.append('mechanical corrections must require a failing case, acceptance results, controls and mutations')
    try:
        if route['effective_from'] < cfg['authorized_at']:
            errors.append('mechanical route cannot reach back past the Claude authorization date')
        datetime.date.fromisoformat(route['effective_from'])
    except (KeyError, ValueError, TypeError):
        errors.append('mechanical route needs a calendar effective_from date')
    return errors


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
        if cfg.get('schedule') != {'timezone': 'America/New_York', 'daily_time': '01:00'}:
            errors.append('Claude schedule declaration differs from the saved routine readback')
        if 'mechanical_route' in cfg:
            errors += mechanical_route_problems(cfg)
        authority = (repo / 'prompts/claude_routine.md').read_text()
        for required in ('prompts/dispatch_routine.md', 'finish --result shipped',
                         'Never send email or post socially', 'native_headroom.py',
                         'canonical phone playback', 'unsent Gmail draft',
                         "Derive today's calendar date in the schedule timezone",
                         "the cloud host's UTC date does not select an Eastern edition",
                         'A terminal shipped run is immutable', '<today>-claude-pilot',
                         'Resume an unfinished pilot instead of creating',
                         'verify that shipment and do not manufacture another ordinary edition',
                         'OLDEST unfinished edition', 'bootstrap_claude_hooks.py --workspace'):
            if required not in authority:
                errors.append('Claude entry point lacks required authority ' + required)
        for required in ('claude_environment_setup.sh', '--prelaunch-router', '--bind-only',
                         'Do not attempt mid-session registration',
                         'before any paid worker reservation',
                         'python scripts/env_check.py --require-voice',
                         'Never use a scratch tsconfig'):
            if required not in authority:
                errors.append('Claude entry point lacks prelaunch recovery authority ' + required)
        for name in ('.claude/agents/scene-builder.md', 'prompts/roles/scene-builder.md'):
            text = ' '.join((repo / name).read_text().split())
            for phrase in CAPTURE_PHRASES:
                if phrase not in text:
                    errors.append(name + ' lacks the capture protocol: ' + phrase)
        hooks = json.dumps(settings.get('hooks', {}).get('PreToolUse', []))
        if 'capture_guard.py hook' not in hooks or '"Bash"' not in hooks:
            errors.append('.claude/settings.json must register scripts/capture_guard.py hook for Bash')
        if '--repo-root' not in hooks:
            errors.append('the capture handler must select its active checkout with --repo-root')
        env = os.environ if environ is None else environ
        override = env.get('CLAUDE_CODE_EFFORT_LEVEL', '')
        if override not in ('', 'auto'):
            errors.append('Inherited CLAUDE_CODE_EFFORT_LEVEL overrides role effort; '
                          'resolve it in this routine environment before starting workers')
        # The host reports the effort its root session actually runs at. It must be the director's.
        root = env.get('CLAUDE_EFFORT', '')
        if root and root != cfg['primary']['effort']:
            errors.append('The root session runs at effort ' + root + ', not the director effort '
                          + cfg['primary']['effort'])
    except (OSError, ValueError, KeyError, TypeError) as exc:
        errors.append('Claude route is incomplete: ' + str(exc))
    return errors


def effective_report(repo=REPO, environ=None):
    """What the root session and each leaf will actually run at, read from the files and the host
    environment rather than assumed. A leaf's effort is its frontmatter; the host exposes no
    per-call effort to a script, so leaf entries say where the value was read."""
    repo = Path(repo); env = os.environ if environ is None else environ
    cfg = json.loads((repo / 'config/claude_runtime.json').read_text())
    settings = json.loads((repo / '.claude/settings.json').read_text())
    leaves = {}
    for role, row in cfg['roles'].items():
        front = yaml.safe_load((repo / '.claude/agents' / (row['agent'] + '.md')).read_text().split('---', 2)[1])
        leaves[role] = {'agent': row['agent'], 'model': front.get('model'), 'effort': front.get('effort'),
                        'read_from': '.claude/agents/' + row['agent'] + '.md frontmatter'}
    return {'schema': 'dispatch_effective_effort/1',
            'root': {'model': settings.get('model'), 'settings_effortLevel': settings.get('effortLevel'),
                     'host_CLAUDE_EFFORT': env.get('CLAUDE_EFFORT') or None,
                     'CLAUDE_CODE_EFFORT_LEVEL_override': env.get('CLAUDE_CODE_EFFORT_LEVEL') or None,
                     'max_subagent_spawn_depth': env.get('CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH') or None,
                     'claude_code_version': env.get('CLAUDE_CODE_VERSION') or None},
            'leaves': leaves, 'problems': problems(repo, env)}


class ContractTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.repo = Path(self.tmp.name)
        files = ['config/claude_runtime.json', '.claude/settings.json',
                 'prompts/claude_routine.md', 'prompts/roles/scene-builder.md']
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

    def test_root_effort_must_match_the_director(self):
        self.assertEqual([], problems(self.repo, {'CLAUDE_EFFORT': 'medium'}))
        self.assertTrue(problems(self.repo, {'CLAUDE_EFFORT': 'high'}))

    def test_effective_report_names_every_role_and_flags_a_wrong_leaf(self):
        report = effective_report(self.repo, {'CLAUDE_EFFORT': 'medium'})
        self.assertEqual(
            {'researcher': ('claude-haiku-5-5', 'high'), 'vo-director': ('claude-haiku-5-5', 'high'),
             'validator': ('claude-opus-5-5', 'high'), 'scene-builder': ('claude-opus-5-5', 'high'),
             'storyboard-critic': ('claude-opus-5-5', 'high'), 'picture': ('claude-sonnet-5-5', 'medium'),
             'story': ('claude-sonnet-5-5', 'medium'), 'sound': ('claude-sonnet-5-5', 'medium')},
            {role: (row['model'], row['effort']) for role, row in report['leaves'].items()})
        self.assertEqual([], report['problems'])
        p = self.repo / '.claude/agents/validator.md'
        p.write_text(p.read_text().replace('effort: high', 'effort: low'))
        self.assertTrue(effective_report(self.repo, {})['problems'])

    def test_wrong_worker_model(self):
        p = self.repo / '.claude/agents/researcher.md'
        p.write_text(p.read_text().replace('claude-haiku-5-5', 'claude-opus-5-5'))
        self.assertTrue(problems(self.repo, {}))

    def test_wrong_director_effort(self):
        p = self.repo / '.claude/settings.json'
        data = json.loads(p.read_text()); data['effortLevel'] = 'max'
        p.write_text(json.dumps(data))
        self.assertTrue(problems(self.repo, {}))

    def test_builder_capture_protocol_cannot_disappear(self):
        for name in ('.claude/agents/scene-builder.md', 'prompts/roles/scene-builder.md'):
            p = self.repo / name
            if not p.exists():
                p.parent.mkdir(parents=True, exist_ok=True)
                p.write_bytes((REPO / name).read_bytes())
            text = p.read_text()
            self.assertEqual([], problems(self.repo, {}))
            for phrase in CAPTURE_PHRASES:
                # Wrapped lines hold the phrases, so flatten the body (never the YAML header) first.
                head, sep, body = text.partition('\n---\n') if text.startswith('---') else ('', '', text)
                p.write_text(head + sep + ' '.join(body.split()).replace(phrase, 'x'))
                self.assertTrue(any('lacks the capture protocol' in e for e in problems(self.repo, {})), (name, phrase))
            p.write_text(text)

    def test_the_hook_registration_cannot_disappear(self):
        p = self.repo / '.claude/settings.json'
        data = json.loads(p.read_text())
        self.assertEqual([], problems(self.repo, {}))
        data.pop('hooks'); p.write_text(json.dumps(data))
        self.assertTrue(any('capture_guard.py hook' in e for e in problems(self.repo, {})))

    def test_edition_selection_contract_cannot_disappear(self):
        p = self.repo / 'prompts/claude_routine.md'
        text = p.read_text()
        self.assertEqual([], problems(self.repo, {}))
        for phrase in ("verify that shipment and do not manufacture another ordinary edition",
                       'Resume an unfinished pilot instead of creating', 'OLDEST unfinished edition'):
            p.write_text(text.replace(phrase, 'x'))
            self.assertTrue(any('lacks required authority' in e for e in problems(self.repo, {})), phrase)
        p.write_text(text)

    def edit_config(self, change):
        p = self.repo / 'config/claude_runtime.json'
        data = json.loads(p.read_text()); change(data); p.write_text(json.dumps(data))

    def test_schedule_declaration_matches_the_saved_routine(self):
        self.assertEqual([], problems(self.repo, {}))
        self.edit_config(lambda d: d['schedule'].update(daily_time='03:00'))
        self.assertTrue(any('saved routine readback' in e for e in problems(self.repo, {})))
        self.edit_config(lambda d: d['schedule'].update(daily_time='01:00', timezone='UTC'))
        self.assertTrue(any('saved routine readback' in e for e in problems(self.repo, {})))

    def test_mechanical_route_stays_inside_its_proven_scope(self):
        self.assertEqual([], problems(self.repo, {}))
        cases = {
            'a different model': lambda d: d['mechanical_route'].update(model='claude-opus-5-5'),
            'a lower effort': lambda d: d['mechanical_route'].update(effort='medium'),
            'a final scorer': lambda d: d['mechanical_route']['tasks'].update({'code-only-review': {'role': 'picture'}}),
            'the validator': lambda d: d['mechanical_route']['tasks'].update({'mechanical-correction': {'role': 'validator'}}),
            'a review that may edit': lambda d: d['mechanical_route']['tasks']['code-only-review'].update(mode='edit'),
            'a correction that is read-only': lambda d: d['mechanical_route']['tasks']['mechanical-correction'].update(mode='read-only'),
            'an extra task': lambda d: d['mechanical_route']['tasks'].update({'research': {'role': 'researcher'}}),
            'renderer source': lambda d: d['mechanical_route']['allowed_paths'].append('video-engine/src/*'),
            'a config path': lambda d: d['mechanical_route']['allowed_paths'].append('config/*'),
            'a dropped forbidden prefix': lambda d: d['mechanical_route']['forbidden_prefixes'].remove('video-engine/src/'),
            'a dropped required control': lambda d: d['mechanical_route']['correction_requires'].remove('unchanged_controls'),
            'a past effective date': lambda d: d['mechanical_route'].update(effective_from='2026-10-01'),
        }
        for label, change in cases.items():
            self.setUp()
            self.edit_config(change)
            self.assertTrue(problems(self.repo, {}), label)

    def test_missing_leaf(self):
        (self.repo / '.claude/agents/scene-builder.md').unlink()
        self.assertTrue(problems(self.repo, {}))

    def test_multi_repository_hook_scope_cannot_disappear(self):
        p = self.repo / 'prompts/claude_routine.md'
        p.write_text(p.read_text().replace('bootstrap_claude_hooks.py --workspace', 'x'))
        self.assertTrue(any('lacks required authority' in e for e in problems(self.repo, {})))

    def test_checkout_selection_cannot_disappear(self):
        p = self.repo / '.claude/settings.json'
        p.write_text(p.read_text().replace(' --repo-root', ''))
        self.assertTrue(any('--repo-root' in e for e in problems(self.repo, {})))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--self-test', action='store_true')
    parser.add_argument('--effective', type=Path, help='write the effective root and leaf effort report here')
    args = parser.parse_args()
    if args.effective:
        report = effective_report()
        args.effective.parent.mkdir(parents=True, exist_ok=True)
        args.effective.write_text(json.dumps(report, indent=2) + '\n')
        print(json.dumps(report, indent=2))
        raise SystemExit(bool(report['problems']))
    if args.self_test:
        suite = unittest.defaultTestLoader.loadTestsFromTestCase(ContractTests)
        result = unittest.TextTestRunner(verbosity=1).run(suite)
        raise SystemExit(not result.wasSuccessful())
    errors = problems()
    print('\n'.join(errors) if errors else 'Claude Sonnet director and explicit leaf routes verified.')
    raise SystemExit(bool(errors))
