"""Modern code admission preserves mandatory floors and frozen board semantics."""
import copy
from contextlib import redirect_stdout
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import autonomous_completion as capacity
import critic_gate
import modern_code_recovery as modern
import production_lifecycle as lifecycle
import run_controller as controller
import repair_guard


class ModernCodeRecoveryTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name).resolve()
        origin = modern.POLICY.parent.parent
        for rel in ('config/autonomous_completion_modern_code_v1.json',
                    'config/modern_film.json', 'knowledge/craft/MODERN_FILM.md'):
            self.write(rel, (origin / rel).read_text(), text=True)
        self.start(patch.object(modern, 'POLICY', self.root / 'config/autonomous_completion_modern_code_v1.json'))
        self.start(patch.object(critic_gate, 'REPO', self.root))
        self.start(patch('agent_runtime.required_inputs'))  # Real role contracts have their own suite.
        self.state = self.root / 'state.json'
        self.assertTrue(controller.initialise(self.state, '2026-10-09-claude-pilot', 'production')[0])
        state = controller.read_state(self.state); capacity.adopt_code_policy(state); controller.save(self.state, state)
        self.assertTrue(controller.reserve(self.state, {'reboards': state['resource_envelope']['reboards'],
                                                      'storyboard_critics': 6}, 'retained actual fixture work')[0])
        self.before = controller.read_state(self.state)
        self.renderer = self.write('video-engine/src/modern/DirectedFilm.tsx', 'export const DirectedFilm = () => null;\n', text=True)
        self.write('video-engine/src/Dispatch.tsx', "import { DirectedFilm } from './modern/DirectedFilm';\nif (cinematic_template === 'directed-film-v2') {return <DirectedFilm/>;}\n", text=True)
        for rel in ('CinematicStage.tsx', 'Studio.tsx', 'ProofContext.tsx', 'projection.ts'):
            self.write('video-engine/src/lib/cinema/' + rel, 'export {};\n', text=True)
        self.write('video-engine/src/lib/direction.ts', 'export {};\n', text=True)
        base = {'date': '2026-10-09', 'cinematic_template': 'directed-film-v2', 'runtime_s': 49,
                'scenes': [{'id': 's1', 'narration': 'A reported clinical use.'}],
                'film_direction': {'version': 'directed-film-v2', 'renderer_inputs': [
                    {'path': str(self.renderer.relative_to(self.root)), 'sha256': modern.digest(self.renderer)}]}}
        self.boards = []
        for name in ('a', 'b', 'measured'):
            board = copy.deepcopy(base); board['film_direction']['variant'] = name
            self.boards.append(self.write('out/dispatch/' + name + '.json', board))
        self.claims = self.write('out/dispatch/claims.json', {'claims': [{'id': 'c1'}]})
        self.asset = self.write('video-engine/src/modern/ChartHero.tsx', 'export const ChartHero = () => null;\n', text=True)
        ref = lambda p: {'path': str(p), 'sha256': modern.digest(p)}
        packet = {'role': 'storyboard-critic', 'date': '2026-10-09',
                  'agent_assignment': {'model': 'claude-opus-5-5', 'effort': 'high'},
                  'board': ref(self.boards[2]), 'treatments': [ref(x) for x in self.boards[:2]],
                  'claims': ref(self.claims), 'asset_inputs': [ref(self.asset)]}
        self.packet = self.write('packet.json', packet)
        board = json.loads(self.boards[1].read_text())
        self.report = self.write('report.json', {'verdict': 'revise', 'treatment': 'b',
            'reviewer_identity': 'independent Opus High code critic',
            'concept_sha256': critic_gate.concept_digest(board), 'renderer_sha256': critic_gate.renderer_digest(board),
            'story_review': {'claims_sha256': modern.digest(self.claims)},
            'blocking_defects': [{'id': 'NB1', 'category': 'motion', 'scene_id': 's1', 'time_s': 1.29,
                                 'defect': 'The arm stretches 24 percent during the source-bound push.'}]})
        self.baseline = self.write('out/dispatch/before.tsx', self.renderer.read_text(), text=True)
        self.proposal = self.write('proposal.json', {'director_identity': 'Sonnet director',
            'mechanism_id': 'constant-length-arm', 'failure_family': 'human-performance', 'repair_scope': 'standard',
            'root_cause': 'A fixed elbow formula stretches the arm during the push.',
            'repair': 'Solve the arm joints continuously while preserving the existing source-bound action.',
            'mechanism_change': 'Replace the stretching translation with a constant-length continuous joint solve.',
            'expected_visible_result': 'The arm keeps a constant length through the push and fingers blend continuously.',
            'failure_evidence': str(self.report), 'failure_evidence_sha256': modern.digest(self.report),
            'resources': {'preflight_renders': 2}, 'changed_inputs': [
                {'path': str(self.renderer), 'before_path': str(self.baseline), 'before_sha256': modern.digest(self.renderer)}]})
        self.plan = self.root / 'bound-plan.json'
        modern.prepare(self.state, self.proposal, self.packet, self.plan)

    def start(self, p):
        result = p.start(); self.addCleanup(p.stop); return result

    def write(self, name, value, text=False):
        p = self.root / name; p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(value if text else json.dumps(value)); return p

    def test_renderer_only_admission_funds_full_path_and_preserves_all_history(self):
        plan = json.loads(self.plan.read_text())
        self.assertEqual([x['path'] for x in plan['changed_inputs']], [str(self.renderer)])
        before = self.state.read_bytes(); out = io.StringIO()
        with patch('sys.argv', ['controller', '--state', str(self.state), 'production-budget', '--repair-plan', str(self.plan)]), redirect_stdout(out):
            self.assertEqual(controller.main(), 1)
        budget = json.loads(out.getvalue())
        self.assertEqual(budget['resources']['storyboard_critics']['required'], 4)
        self.assertEqual(budget['deficits'], {'reboards': 1, 'storyboard_critics': 3})
        self.assertEqual(self.state.read_bytes(), before)
        ok, msg = capacity.grant_capacity(self.state, self.plan); self.assertTrue(ok, msg)
        state = controller.read_state(self.state)
        self.assertEqual(state['events'][:len(self.before['events'])], self.before['events'])
        self.assertEqual(state['usage'], self.before['usage'])
        self.assertEqual(state['resource_envelope'], self.before['resource_envelope'])
        self.assertEqual(capacity.replay(state)[1], [])
        self.assertEqual(lifecycle.allowance_problems(state), [])
        self.assertTrue(state['events'][-1]['grants_no_review_approval'])
        self.assertFalse(controller.finish(self.state, 'publishable')[0])
        ok, msg = lifecycle.begin_repair(self.state, self.plan); self.assertTrue(ok, msg)
        self.assertTrue(controller.reserve(self.state, {'reboards': 1}, 'actual corrective builder')[0])
        self.renderer.write_text('export const DirectedFilm = () => "continuous joints";\n')
        plan['changed_inputs'][0]['after_sha256'] = modern.digest(self.renderer)
        self.plan.write_text(json.dumps(plan))
        self.assertTrue(modern.rebound_problems(plan))  # Stale derived hashes are refused.
        for row in plan['modern_code_evidence']['inputs']:
            if row['kind'] == 'board': Path(row['path']).write_text(json.dumps(modern.rebound_board(plan, row)))
        ok, msg = lifecycle.authorize_repair(self.state, self.plan); self.assertTrue(ok, msg)
        self.assertEqual(capacity.replay(controller.read_state(self.state))[1], [])

    def test_duplicate_and_mutated_policy_evidence_or_budget_refused(self):
        self.assertTrue(capacity.grant_capacity(self.state, self.plan)[0])
        before = self.state.read_bytes()
        self.assertFalse(capacity.grant_capacity(self.state, self.plan)[0])
        self.assertEqual(self.state.read_bytes(), before)
        for key in ('policy_json', 'plan_json', 'failure_evidence_json', 'precheck_json'):
            state = controller.read_state(self.state); state['events'][-1][key] += ' '
            self.assertTrue(capacity.replay(state)[1], key)
        state = controller.read_state(self.state)
        state['events'] = [e for e in state['events'] if e['kind'] != modern.ADOPTION]
        self.assertTrue(capacity.replay(state)[1])

    def test_stale_guide_board_claim_renderer_packet_and_baseline_refused(self):
        for p in (self.renderer, self.baseline, self.packet, self.claims, *self.boards,
                  self.root / 'knowledge/craft/MODERN_FILM.md', self.root / 'config/modern_film.json'):
            data = p.read_bytes(); p.write_bytes(data + b' ')
            before = self.state.read_bytes()
            ok, msg = capacity.grant_capacity(self.state, self.plan)
            self.assertFalse(ok, (str(p), msg)); self.assertEqual(self.state.read_bytes(), before)
            p.write_bytes(data)

    def test_self_review_optional_categories_film_scope_and_changed_board_refused(self):
        original = json.loads(self.plan.read_text())
        for mutate in (lambda p: p.update(director_identity='independent Opus High code critic'),
                       lambda p: p['changed_inputs'].append({'path': str(self.boards[1]), 'before_path': str(self.boards[1]),
                                                            'before_sha256': modern.digest(self.boards[1])})):
            plan = copy.deepcopy(original); mutate(plan); self.plan.write_text(json.dumps(plan))
            self.assertFalse(capacity.grant_capacity(self.state, self.plan)[0])
        report = json.loads(self.report.read_text())
        for key, value in [('film_sha256', 'a' * 64), ('concept_sha256', 'b' * 64),
                           ('renderer_sha256', 'c' * 64), ('verdict', 'pass'),
                           ('blocking_defects', [{'category': 'optional-polish', 'scene_id': 's1', 'time_s': 1,
                                                 'defect': 'Change a decorative color.'}])]:
            changed = copy.deepcopy(report); changed[key] = value
            self.report.write_text(json.dumps(changed)); plan = copy.deepcopy(original)
            plan['failure_evidence_sha256'] = modern.digest(self.report); self.plan.write_text(json.dumps(plan))
            self.assertFalse(capacity.grant_capacity(self.state, self.plan)[0], key)

    def test_board_semantics_and_bound_plan_cannot_change_during_correction(self):
        self.assertTrue(capacity.grant_capacity(self.state, self.plan)[0])
        self.assertTrue(lifecycle.begin_repair(self.state, self.plan)[0])
        self.assertTrue(controller.reserve(self.state, {'reboards': 1}, 'actual corrective builder')[0])
        self.renderer.write_text('export const DirectedFilm = () => "corrected";\n')
        plan = json.loads(self.plan.read_text()); plan['changed_inputs'][0]['after_sha256'] = modern.digest(self.renderer)
        for row in plan['modern_code_evidence']['inputs']:
            if row['kind'] == 'board': Path(row['path']).write_text(json.dumps(modern.rebound_board(plan, row)))
        board = json.loads(self.boards[0].read_text()); board['scenes'][0]['narration'] = 'Unauthorized new narration.'
        self.boards[0].write_text(json.dumps(board)); self.plan.write_text(json.dumps(plan))
        self.assertFalse(lifecycle.authorize_repair(self.state, self.plan)[0])
        plan['modern_code_evidence']['inputs'][0]['sha256'] = 'd' * 64
        self.plan.write_text(json.dumps(plan))
        self.assertIn('bound plan', lifecycle.authorize_repair(self.state, self.plan)[1])

    def test_undeclared_source_or_artwork_change_cannot_hide_in_metadata_rebind(self):
        plan = json.loads(self.plan.read_text())
        self.renderer.write_text('export const DirectedFilm = () => "corrected";\n')
        for row in plan['modern_code_evidence']['inputs']:
            if row['kind'] == 'board': Path(row['path']).write_text(json.dumps(modern.rebound_board(plan, row)))
        self.assertEqual(modern.rebound_problems(plan), [])
        for p in (self.asset, self.claims, self.root / 'video-engine/src/Dispatch.tsx'):
            data = p.read_bytes(); p.write_bytes(data + b' ')
            self.assertTrue(modern.rebound_problems(plan), str(p)); p.write_bytes(data)

    def test_older_shipped_overwrite_and_later_shipped_replay(self):
        with self.assertRaises(FileExistsError): modern.prepare(self.state, self.proposal, self.packet, self.plan)
        for key, value in [('run_id', '2026-10-08'), ('terminal_state', 'shipped')]:
            state = copy.deepcopy(self.before); state[key] = value; controller.save(self.state, state)
            self.assertFalse(capacity.grant_capacity(self.state, self.plan)[0])
        controller.save(self.state, self.before)
        self.assertTrue(capacity.grant_capacity(self.state, self.plan)[0])
        state = controller.read_state(self.state); state.update(terminal_state='shipped', phase='shipped')
        self.assertEqual(capacity.replay(state)[1], [])

    def test_repeated_family_still_requires_independent_source_backed_pivot(self):
        state = copy.deepcopy(self.before)
        state['events'] += [{'kind': 'repair_started', 'mechanism_id': name,
                             'failure_family': 'human-performance', 'failure_sha256': h * 64}
                            for name, h in (('old-stretch', 'a'), ('old-pose-switch', 'b'))]
        plan = json.loads(self.plan.read_text())
        self.assertTrue(repair_guard.plan_problems(state, plan))
        pivot = self.write('pivot.json', {'verdict': 'pass', 'reviewer_identity': 'independent Opus pivot critic',
            'retired_mechanism_id': 'old-stretch', 'replacement_mechanism_id': plan['mechanism_id'],
            'reviewed_failure_sha256': ['a' * 64, 'b' * 64],
            'visible_difference': 'A constant-length continuous joint solve replaces the previously stretched translation and abrupt pose switch.',
            'source_basis': 'The same source-bound asking and returned citation action stays intact with continuously articulated hands.'})
        plan['pivot_review'] = {'path': str(pivot), 'sha256': modern.digest(pivot)}
        self.assertEqual(repair_guard.plan_problems(state, plan), [])
        review = json.loads(pivot.read_text()); review['reviewer_identity'] = plan['director_identity']
        pivot.write_text(json.dumps(review)); plan['pivot_review']['sha256'] = modern.digest(pivot)
        self.assertTrue(repair_guard.plan_problems(state, plan))


if __name__ == '__main__': unittest.main()
