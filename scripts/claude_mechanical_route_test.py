"""The Haiku mechanical route is a narrow overlay, and these tests hold its boundary.

WHAT IT IS. One graded trial showed Haiku high can diagnose and mechanically repair a caption layout gate
when the case is strictly specified and the controls and mutations are named. The route admits exactly that
shape of work and nothing else. It is an overlay on the normal role packet, so every full current guide, hash
binding and controller resource stays. Any doubt refuses, and a refusal leaves the unchanged Opus assignment.

WHAT THEY PROVE.
  1 Admission works on both sides of every boundary: the effective date, each allowed and forbidden path,
    each required field of a correction, read only for a review.
  2 Final scorers, the validator, the researcher, the voice director and the initial authored build are
    never admitted, and a task on the wrong role is refused.
  3 The plan carries Haiku high spawn arguments only when admitted, and the same packet planned without the
    flag is exactly the unchanged assignment, with the same role, brief and reservation resource.
  4 A permissive admission would route forbidden work, so these tests catch a weakened check.
Run: python3 scripts/claude_mechanical_route_test.py
"""
import copy
import json
from pathlib import Path
import tempfile
import unittest
from unittest import mock

import claude_runtime as runtime

CFG = json.loads(runtime.POLICY.read_text())
ROUTE = CFG['mechanical_route']
DAY = ROUTE['effective_from']


def ref(path):
    """A named file with its current hash, as a packet must carry it. A missing file keeps a placeholder hash."""
    target = runtime.REPO / path
    return {'path': path, 'sha256': runtime.digest(target) if target.is_file() else '0' * 64}


REVIEW_PATHS = [ref('video-engine/tests/caption_board_fit.mjs')]
CORRECTION = {'task': 'mechanical-correction', 'paths': [ref('video-engine/tests/caption_board_fit.mjs'),
                                                        ref('scripts/agent_runtime_test.py')],
              'failing_case': 'repaired_settle_offset',
              'acceptance_results': ['repaired_settle_offset', 'repaired_alloy_max_lines'],
              'unchanged_controls': ['control_default_two_line', 'control_declared_fits_two_lines'],
              'mutation_checks': ['settle_offset_repair', 'alloy_template_repair']}
REVIEW = {'task': 'code-only-review', 'paths': REVIEW_PATHS, 'read_only': True}


def packet(role='scene-builder', spec=None, **extra):
    data = {'date': DAY, 'role': role, 'mechanical': copy.deepcopy(spec if spec is not None else CORRECTION)}
    data.update(extra)
    return data


class Admission(unittest.TestCase):
    def admit(self, role, task, spec, **extra):
        return runtime.mechanical_admission(role, packet(role, spec, **extra), task)

    def test_review_and_correction_are_admitted_on_their_roles(self):
        review = self.admit('storyboard-critic', 'code-only-review', REVIEW)
        self.assertEqual((review['model'], review['effort'], review['spawn_model'], review['mode']),
                         ('claude-haiku-5-5', 'high', 'haiku', 'read-only'))
        fix = self.admit('scene-builder', 'mechanical-correction', CORRECTION)
        self.assertEqual((fix['model'], fix['effort'], fix['mode']), ('claude-haiku-5-5', 'high', 'edit'))

    def test_effective_date_boundary(self):
        previous = '2026-10-13'
        self.assertLess(previous, DAY)
        with self.assertRaisesRegex(ValueError, 'before'):
            runtime.mechanical_admission('scene-builder', packet(date=previous), 'mechanical-correction')
        self.assertTrue(runtime.mechanical_admission('scene-builder', packet(date=DAY), 'mechanical-correction'))
        self.assertTrue(runtime.mechanical_admission('scene-builder', packet(date='2099-01-01'), 'mechanical-correction'))

    def test_roles_that_must_keep_their_assignment_are_refused(self):
        for role in ('picture', 'story', 'sound', 'validator', 'researcher', 'vo-director'):
            for task, spec in (('code-only-review', REVIEW), ('mechanical-correction', CORRECTION)):
                with self.assertRaises(ValueError, msg=(role, task)):
                    self.admit(role, task, spec)

    def test_a_task_on_the_wrong_role_is_refused(self):
        with self.assertRaises(ValueError):
            self.admit('scene-builder', 'code-only-review', REVIEW)
        with self.assertRaises(ValueError):
            self.admit('storyboard-critic', 'mechanical-correction', CORRECTION)
        with self.assertRaises(ValueError):
            self.admit('scene-builder', 'anything-else', CORRECTION)

    def test_initial_authored_build_always_keeps_opus(self):
        with self.assertRaisesRegex(ValueError, 'initial authored build'):
            self.admit('scene-builder', 'mechanical-correction', CORRECTION, mode='initial_authored_build')

    def test_path_boundaries(self):
        refused = ['video-engine/src/lib/DispatchOverlays.tsx', 'video-engine/src/modern/episodes/x/Film.tsx',
                   'video-engine/public/x.png', 'config/claude_runtime.json', 'prompts/phases/02-picture.md',
                   'knowledge/craft/x.md', 'runs/2026-10-11/run_state.json', 'out/dispatch/run_state.json',
                   '.claude/agents/scorer.md', 'ledger/dispatch_history.json', 'assets/x', 'docs/x',
                   'scripts/run_controller.py', 'scripts/shipment_check.py', 'scripts/public_state.py',
                   'video-engine/tests/../src/x.tsx', '../outside_test.py', '/abs/video-engine/tests/x.mjs',
                   'video-engine/tests/*', 'video-engine/tests/a?.mjs', 'video-engine/tests/./x.mjs',
                   'video-engine/tests', 'scripts/x_test.mjs']
        for path in refused:
            spec = copy.deepcopy(CORRECTION); spec['paths'] = [ref(path)]
            with self.assertRaises(ValueError, msg=path):
                self.admit('scene-builder', 'mechanical-correction', spec)
        allowed = ['video-engine/tests/caption_board_fit.mjs', 'video-engine/tests/cinema_pixels.py',
                   'scripts/public_state_test.py']
        for path in allowed:
            spec = copy.deepcopy(CORRECTION); spec['paths'] = [ref(path)]
            self.assertTrue(self.admit('scene-builder', 'mechanical-correction', spec), path)
        # One forbidden file among allowed ones refuses the whole packet.
        spec = copy.deepcopy(CORRECTION); spec['paths'] = [ref(p) for p in allowed + ['video-engine/src/lib/DispatchOverlays.tsx']]
        with self.assertRaises(ValueError):
            self.admit('scene-builder', 'mechanical-correction', spec)

    def test_files_must_exist_and_carry_their_current_hash(self):
        for entry in (ref('scripts/does_not_exist_test.py'), 'scripts/agent_runtime_test.py',
                      {'path': 'scripts/agent_runtime_test.py'},
                      dict(ref('scripts/agent_runtime_test.py'), sha256='f' * 64)):
            spec = copy.deepcopy(CORRECTION); spec['paths'] = [entry]
            with self.assertRaises(ValueError, msg=entry):
                self.admit('scene-builder', 'mechanical-correction', spec)

    def test_an_alias_to_forbidden_source_is_refused(self):
        # Fixture links sit inside the repository under allowed names and point at forbidden files.
        made = []
        try:
            for name, target in (('scripts/zz_alias_file_test.py', '../prompts/claude_routine.md'),
                                 ('video-engine/tests/zz_alias_src.mjs', '../src/lib/DispatchOverlays.tsx')):
                link = runtime.REPO / name
                if not (runtime.REPO / name).parent.joinpath(target).resolve().is_file():
                    continue
                link.symlink_to(target); made.append(link)
                spec = copy.deepcopy(CORRECTION); spec['paths'] = [ref(name)]
                with self.assertRaisesRegex(ValueError, 'alias', msg=name):
                    self.admit('scene-builder', 'mechanical-correction', spec)
            self.assertTrue(made)
            # Mutation: the earlier checks alone (name, pattern, existence, hash, containment) admit the alias.
            link = made[0]; target = link.resolve()
            self.assertTrue(link.is_file() and runtime.REPO.resolve() in target.parents
                            and ref(link.relative_to(runtime.REPO).as_posix())['sha256'] == runtime.digest(target))
        finally:
            for link in made:
                link.unlink()

    def test_correction_fields_must_be_named_lists_of_names(self):
        for key, bad in (('acceptance_results', 42), ('unchanged_controls', {'x': 1}), ('mutation_checks', True),
                         ('failing_case', '  '), ('failing_case', ['x']), ('acceptance_results', 'x')):
            with self.assertRaises(ValueError, msg=(key, bad)):
                self.admit('scene-builder', 'mechanical-correction', dict(CORRECTION, **{key: bad}))

    def test_a_correction_needs_every_required_field(self):
        for key in ROUTE['correction_requires']:
            for bad in (None, '', [], ['ok', ' ']):
                spec = copy.deepcopy(CORRECTION); spec.pop(key, None)
                if bad is not None:
                    spec[key] = bad
                with self.assertRaises(ValueError, msg=(key, bad)):
                    self.admit('scene-builder', 'mechanical-correction', spec)

    def test_a_review_must_be_read_only(self):
        for change in ({'read_only': False}, {'read_only': 'yes'}, {'edits': ['x']}):
            spec = dict(REVIEW, **change)
            with self.assertRaises(ValueError, msg=change):
                self.admit('storyboard-critic', 'code-only-review', spec)

    def test_a_packet_without_its_declaration_or_naming_another_task_is_refused(self):
        with self.assertRaises(ValueError):
            runtime.mechanical_admission('scene-builder', {'date': DAY, 'role': 'scene-builder'}, 'mechanical-correction')
        with self.assertRaises(ValueError):
            self.admit('scene-builder', 'mechanical-correction', dict(CORRECTION, task='code-only-review'))

    def test_the_packet_must_be_blind(self):
        for key in ('expected', 'expected_findings', 'answers', 'hidden_answers'):
            with self.assertRaisesRegex(ValueError, 'blind'):
                self.admit('scene-builder', 'mechanical-correction', dict(CORRECTION, **{key: ['x']}))
            with self.assertRaisesRegex(ValueError, 'blind'):
                self.admit('scene-builder', 'mechanical-correction', CORRECTION, **{key: ['x']})


class PlanWiring(unittest.TestCase):
    """plan() keeps its normal validation. The standard input checks are stubbed here because they need a
    whole edition, and the point under test is only what the overlay adds to an otherwise valid plan."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        for target in ('required_inputs', 'validate_references'):
            patcher = mock.patch.object(runtime.agent_runtime, target, lambda *a, **k: None)
            patcher.start(); self.addCleanup(patcher.stop)

    def write(self, role, spec):
        data = {'date': DAY, 'role': role, 'agent_assignment': runtime.assignment(role, DAY),
                'brief': '.claude/agents/' + CFG['roles'][role]['agent'] + '.md', 'mechanical': spec}
        path = self.root / (role + '.json'); path.write_text(json.dumps(data))
        return path

    def test_the_overlay_adds_haiku_arguments_and_nothing_else(self):
        for role, task, spec in (('storyboard-critic', 'code-only-review', REVIEW),
                                 ('scene-builder', 'mechanical-correction', CORRECTION)):
            path = self.write(role, spec)
            default = runtime.plan(role, path, 'task_one', 'Check the named gate test.')
            overlay = runtime.plan(role, path, 'task_one', 'Check the named gate test.', task)
            self.assertNotIn('model', default['agent_args']); self.assertNotIn('effort', default['agent_args'])
            self.assertNotIn('mechanical', default)
            self.assertEqual((overlay['agent_args']['model'], overlay['agent_args']['effort']), ('haiku', 'high'))
            self.assertEqual(overlay['mechanical']['model'], 'claude-haiku-5-5')
            # The role, its leaf brief, its packet and its reservation are exactly the unchanged ones.
            self.assertEqual(overlay['assignment'], default['assignment'])
            self.assertEqual(overlay['assignment']['model'], 'claude-opus-5-5')
            self.assertEqual(overlay['assignment']['resource'], CFG['roles'][role]['resource'])
            self.assertEqual(overlay['agent_args']['subagent_type'], default['agent_args']['subagent_type'])
            self.assertEqual(overlay['brief'], default['brief']); self.assertEqual(overlay['packet'], default['packet'])
            self.assertLessEqual(len(overlay['agent_args']['prompt']), 1800)
            self.assertIn('Never send email or post socially', overlay['agent_args']['prompt'])

    def test_the_free_text_scope_can_not_widen_the_admitted_files(self):
        path = self.write('scene-builder', CORRECTION)
        ok = 'Fix the gate in scripts/agent_runtime_test.py and video-engine/tests/caption_board_fit.mjs.'
        self.assertTrue(runtime.plan('scene-builder', path, 'task_one', ok, 'mechanical-correction'))
        for scope in ('Also change scripts/public_state.py to match.', 'Inspect scripts/claude_checkpoint.py first.',
                      'Edit video-engine/src/lib/DispatchOverlays.tsx', 'Update config/claude_runtime.json'):
            with self.assertRaises(ValueError, msg=scope):
                runtime.plan('scene-builder', path, 'task_one', scope, 'mechanical-correction')
            # The unchanged assignment accepts the same wording, because only the overlay is narrowed.
            self.assertTrue(runtime.plan('scene-builder', path, 'task_one', scope))

    def test_an_unsupported_request_fails_closed_while_the_default_plan_still_works(self):
        bad = dict(CORRECTION, paths=[ref('video-engine/src/lib/DispatchOverlays.tsx')])
        path = self.write('scene-builder', bad)
        self.assertTrue(runtime.plan('scene-builder', path, 'task_one', 'Fix the named gate.'))
        with self.assertRaises(ValueError):
            runtime.plan('scene-builder', path, 'task_one', 'Fix the named gate.', 'mechanical-correction')

    def test_a_permissive_admission_would_route_forbidden_work(self):
        # Mutation: with the admission check weakened, renderer source is routed to Haiku. The real check
        # refuses it, so these tests would fail if someone loosened the route.
        bad = dict(CORRECTION, paths=[ref('video-engine/src/lib/DispatchOverlays.tsx')])
        path = self.write('scene-builder', bad)
        weakened = lambda role, data, task: {'route': 'x', 'mode': 'edit', 'paths': [], 'spawn_model': 'haiku',
                                             'effort': 'high', 'model': 'claude-haiku-5-5'}
        with mock.patch.object(runtime, 'mechanical_admission', weakened):
            routed = runtime.plan('scene-builder', path, 'task_one', 'Fix the named gate.', 'mechanical-correction')
        self.assertEqual(routed['agent_args']['model'], 'haiku')
        with self.assertRaises(ValueError):
            runtime.plan('scene-builder', path, 'task_one', 'Fix the named gate.', 'mechanical-correction')

    def test_the_default_assignments_are_unchanged(self):
        for role, row in CFG['roles'].items():
            self.assertEqual((runtime.assignment(role, DAY)['model'], runtime.assignment(role, DAY)['effort']),
                             (row['model'], row['effort']))
        self.assertEqual(runtime.assignment('storyboard-critic', DAY)['model'], 'claude-opus-5-5')
        self.assertEqual(runtime.assignment('scene-builder', DAY)['model'], 'claude-opus-5-5')


if __name__ == '__main__':
    unittest.main(verbosity=2)
