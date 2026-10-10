"""Check the GitHub-owned Claude model and effort route without starting a model."""
from __future__ import annotations
import argparse
import copy
import re
import json
import os
from pathlib import Path
import tempfile
import unittest
import yaml

REPO = Path(__file__).resolve().parents[1]


CAPTURE_PHRASES = ('charged render reservation', 'headroom', 'bash scripts/run_with_env.sh',
                   'genuine authored art receipts', 'scratch placeholder')
CAPTURE_COMMAND = re.compile(r'remotion\s+(still|render)|ffmpeg\b.*\s-i\s|preflight_animatic|cinema_proof|render_dispatch')


def placeholder_art(board):
    """Authored art entries that are not genuine receipts, so a scratch props file is never proof."""
    rows = (board.get('story_art') or {}).get('entries') or []
    return [row.get('request_id') for row in rows
            if str(row.get('sha256')) == 'scratch' or not re.fullmatch(r'[0-9a-f]{64}', str(row.get('sha256', '')))
            or str(row.get('creation_id', '')).startswith('scratch') or str(row.get('created_at')) == 'scratch']


def capture_problems(command, packet=None, board=None):
    """Whether a capture or render command may run now. The October 10th private still failed all of it."""
    if not CAPTURE_COMMAND.search(command):
        return []
    errors = []
    capture = (packet or {}).get('capture') or {}
    if capture.get('allowed') is not True:
        errors.append('the packet does not authorize a capture')
    if not (capture.get('render_reservation') or {}).get('event_sha256'):
        errors.append('no charged controller render reservation')
    headroom = capture.get('headroom') or {}
    if headroom.get('passed') is not True or not headroom.get('required_free_gib'):
        errors.append('no computed and passed native headroom check')
    if 'scripts/run_with_env.sh' not in command:
        errors.append('the command is not run through bash scripts/run_with_env.sh')
    if capture.get('art_receipts_recorded') is not True:
        errors.append('genuine authored art receipts are not recorded')
    if board is not None and placeholder_art(board):
        errors.append('the props carry scratch placeholder art entries')
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
        authority = (repo / 'prompts/claude_routine.md').read_text()
        for required in ('prompts/dispatch_routine.md', 'finish --result shipped',
                         'Never send email or post socially', 'native_headroom.py',
                         'canonical phone playback', 'unsent Gmail draft',
                         "Derive today's calendar date in the schedule timezone",
                         "the cloud host's UTC date does not select an Eastern edition",
                         'A terminal shipped run is immutable', '<today>-claude-pilot',
                         'Resume an unfinished pilot instead of creating',
                         'verify that shipment and do not manufacture another ordinary edition',
                         'OLDEST unfinished edition'):
            if required not in authority:
                errors.append('Claude entry point lacks required authority ' + required)
        for name in ('.claude/agents/scene-builder.md', 'prompts/roles/scene-builder.md'):
            text = ' '.join((repo / name).read_text().split())
            for phrase in CAPTURE_PHRASES:
                if phrase not in text:
                    errors.append(name + ' lacks the capture protocol: ' + phrase)
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

    def test_the_observed_private_capture_is_refused(self):
        observed = ('cd video-engine; npx --no-install remotion still Dispatch /tmp/a-f030.png '
                    '--props=/tmp/inspect-a.json --frame=30 --log=error')
        placeholder = {'story_art': {'entries': [{'request_id': 'chart-and-citations', 'sha256': 'scratch',
                                                  'creation_id': 'scratch-inspection-only', 'created_at': 'scratch'}]}}
        found = capture_problems(observed, packet={'capture': {'allowed': False}}, board=placeholder)
        for expected in ('does not authorize', 'no charged controller render reservation', 'native headroom',
                         'run_with_env.sh', 'receipts are not recorded', 'placeholder art'):
            self.assertTrue(any(expected in e for e in found), expected)
        half_scale = 'npx --no-install remotion still bundle Dispatch out.png --props=p.json --frame=40 --scale=0.5'
        self.assertTrue(capture_problems(half_scale, packet={}, board=placeholder))
        cheap = 'cd video-engine && npx tsc --noEmit'
        self.assertEqual([], capture_problems(cheap, packet={}, board=placeholder))
        genuine = {'story_art': {'entries': [{'request_id': 'x', 'sha256': 'a' * 64, 'creation_id': 'authored-' + 'b' * 20,
                                              'created_at': '2026-10-10T02:00:00+00:00'}]}}
        allowed = {'capture': {'allowed': True, 'render_reservation': {'event_sha256': 'c' * 64, 'resource': 'preflight_renders'},
                               'headroom': {'passed': True, 'required_free_gib': 12.5}, 'art_receipts_recorded': True}}
        self.assertEqual([], capture_problems('bash scripts/run_with_env.sh npx remotion still Dispatch o.png', allowed, genuine))
        self.assertTrue(capture_problems('bash scripts/run_with_env.sh npx remotion still Dispatch o.png', allowed, placeholder))
        self.assertTrue(capture_problems('npx remotion still Dispatch o.png', allowed, genuine))

    def test_edition_selection_contract_cannot_disappear(self):
        p = self.repo / 'prompts/claude_routine.md'
        text = p.read_text()
        self.assertEqual([], problems(self.repo, {}))
        for phrase in ("verify that shipment and do not manufacture another ordinary edition",
                       'Resume an unfinished pilot instead of creating', 'OLDEST unfinished edition'):
            p.write_text(text.replace(phrase, 'x'))
            self.assertTrue(any('lacks required authority' in e for e in problems(self.repo, {})), phrase)
        p.write_text(text)

    def test_missing_leaf(self):
        (self.repo / '.claude/agents/scene-builder.md').unlink()
        self.assertTrue(problems(self.repo, {}))


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
