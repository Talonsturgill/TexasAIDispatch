"""Offline native provenance fixtures; no production reports or ledger edits."""
import copy
import hashlib
import json
from pathlib import Path
import shutil
import unittest
from unittest.mock import patch

import selected_repair as repair
import selected_treatment as selected
from combined_review import read, bound
import completion_yield as native
import selected_treatment_test


class SelectedRepairTests(unittest.TestCase):
    def setUp(self):
        self.fixture = selected_treatment_test.SelectedTreatmentTests(methodName='runTest'); self.fixture.setUp()
        self.addCleanup(self.fixture.doCleanups)
        self.f = f = self.fixture.fixture
        import run_controller
        f.state.update(schema=run_controller.SCHEMA, limits=run_controller.ceilings())
        f.write(f.state_path, f.state)
        self.source = f.repo / 'video-engine/Film.tsx'
        self.source.parent.mkdir(parents=True, exist_ok=True); self.source.write_text('before fixture source')
        self.before = bound(self.source)['sha256']
        self.rows = [{'path': 'video-engine/Film.tsx', 'sha256': self.before}]
        # Rebind fixture-native originals after adding a renderer identity to the tiny boards.
        packet = read(f.packet)
        for option in packet['phone_options']:
            key = option['id']; path = self.fixture.archive / (key + '.json')
            board = read(path); board['film_direction'] = {'episode': 'fixture', 'renderer_inputs': self.rows}
            f.write(path, board); f.write(f.root / ('opening-' + key + '.json'), board)
            option['board'] = bound(path)
            sequence = read(option['motion_sequence']['path']); sequence['board_sha256'] = bound(path)['sha256']
            f.write(Path(option['motion_sequence']['path']), sequence)
            option['motion_sequence'] = bound(option['motion_sequence']['path'])
        comparison_path = self.fixture.archive / 'comparison.json'; comparison = read(comparison_path)
        for option in comparison['options']:
            option['board']['sha256'] = bound(self.fixture.archive / option['board']['file'])['sha256']
        f.write(comparison_path, comparison)
        for option in packet['phone_options']:
            option['comparison']['comparison_sha256'] = bound(comparison_path)['sha256']
            sequence = read(option['motion_sequence']['path']); sequence['comparison'] = option['comparison']
            f.write(Path(option['motion_sequence']['path']), sequence); option['motion_sequence'] = bound(option['motion_sequence']['path'])
        for path in (f.root / native.CRITIC_RECEIPTS).glob(bound(f.packet)['sha256'] + '-*.json'):
            path.unlink()
        f.write(f.packet, packet); f.report['packet_sha256'] = bound(f.packet)['sha256']
        f.report['selection']['comparison_sha256'] = bound(comparison_path)['sha256']
        f.native_return(f.packet, f.report, 2, agent='native-phone', kind='dispatch-visual-critic')
        import visual_observations
        f.write(f.coverage, visual_observations.coverage(f.packet, Path(f.report['observation_directory'])))
        shutil.copytree(self.fixture.archive, f.root / 'openings', dirs_exist_ok=True)
        f.write(f.root / 'openings/selection.json', f.report['selection'])
        self.proof = self.fixture.adopt()
        f.write(f.root / 'storyboard.json', read(f.root / 'opening-b.json'))
        self.admit()
        self.patches = [patch.object(repair, 'REPO', f.repo),
            patch('modern_film.renderer_inputs', side_effect=lambda episode, repo: [
                {'path': 'video-engine/Film.tsx', 'sha256': bound(self.source)['sha256']}]),
            patch('critic_gate.problems', side_effect=self.code_problems)]
        for item in self.patches:
            item.start(); self.addCleanup(item.stop)

    def code_problems(self, board, report):
        # This suite isolates graph provenance. Full critic plan/action checks have their own fixtures.
        from critic_gate import concept_digest
        return [] if report.get('concept_sha256') == concept_digest(board) else ['changed current concept']

    def admit(self):
        f = self.f; state = read(f.state_path)
        baseline = f.root / 'repair-1/baseline/Film.tsx'; baseline.parent.mkdir(parents=True)
        shutil.copy2(self.source, baseline)
        failure = f.write(f.root / 'repair-1/failure.json', f.report)
        row = {'path': str(self.source), 'before_path': str(baseline), 'before_sha256': self.before}
        state['events'].append({'kind': 'repair_started', 'failure_sha256': bound(failure)['sha256'], 'baselines': [copy.deepcopy(row)], 'plan_sha256': 'a'*64,
            'repair_scope': 'standard', 'director_identity': 'fixture director', 'mechanism_id': 'source-correction'})
        state['events'].append({'kind': 'reserved', 'resources': {'reboards': 1}})
        self.source.write_text('corrected fixture source')
        row['after_sha256'] = bound(self.source)['sha256']
        plan = {'director_identity': 'fixture director', 'mechanism_id': 'source-correction', 'failure_evidence': str(failure), 'failure_evidence_sha256': bound(failure)['sha256'], 'changed_inputs': [row]}
        plan_path = f.write(f.root / 'repair-plan.json', plan)
        revision = hashlib.sha256(json.dumps([(str(self.source), row['after_sha256'])], sort_keys=True).encode()).hexdigest()
        state['events'].append({'kind': 'repair_authorized', 'repair_plan': plan,
            'repair_plan_sha256': bound(plan_path)['sha256'], 'repair_revision': revision})
        for name in ('opening-b.json', 'storyboard.json'):
            board = read(f.root / name); board['film_direction']['renderer_inputs'][0]['sha256'] = row['after_sha256']
            f.write(f.root / name, board)
        self.authorized = len(state['events']) - 1
        state['events'].append({'kind': 'reserved', 'resources': {'storyboard_critics': 1},
            'publication_owner_sha256': f.owner, 'publication_epoch': 'original-epoch'})
        f.state = state; f.write(f.state_path, state)
        from critic_gate import concept_digest
        bindings = {'review_scope': 'code-plan', 'concept_sha256': concept_digest(read(f.root / 'opening-b.json'))}
        packet = f.write(f.root / 'current-code-packet.json', {'role': 'storyboard-critic', 'date': state['run_id'],
            'claims': bound(f.root / 'claims.json'), 'code_report_bindings': {'treatments': [{'id': 'b', 'report_bindings': bindings}]}})
        report = {**bindings, 'packet_sha256': bound(packet)['sha256'], 'verdict': 'pass', 'blocking_defects': []}
        f.native_return(packet, report, len(state['events']) - 1)

    def check(self):
        return repair.opening_problems(self.f.root / 'storyboard.json')

    def test_corrected_source_requires_fresh_native_pass_and_preserves_history(self):
        state = self.f.state_path.read_bytes()
        self.assertEqual(self.check(), [])
        self.assertFalse(repair.provenance(self.f.root / 'storyboard.json')['approval'])
        self.assertEqual(state, self.f.state_path.read_bytes())
        self.assertEqual(read(self.f.coverage)['packet_sha256'], self.proof['original_packet']['sha256'])
        from critic_gate import film_review_problems
        self.assertTrue(film_review_problems(read(self.f.root / 'storyboard.json'), {}, {}, 'new-board', 'new-film'))

    def test_uncharged_reordered_or_changed_authorization_fails(self):
        state = read(self.f.state_path)
        for index, replacement in [(self.authorized - 1, {'kind': 'no charge'}),
                                   (self.authorized - 2, {'kind': 'no admitted repair'}),
                                   (self.authorized, {'kind': 'no authorization'})]:
            bad = copy.deepcopy(state); bad['events'][index] = replacement
            self.f.write(self.f.state_path, bad); self.assertTrue(self.check())
        self.f.write(self.f.state_path, state)
        self.assertEqual(self.check(), [])

    def test_actual_storyboard_not_only_selected_board_is_bound(self):
        board = read(self.f.root / 'storyboard.json'); board['scenes'][0]['vo'] = 'An unauthorized different story.'
        self.f.write(self.f.root / 'storyboard.json', board)
        self.assertIn('chosen story', '; '.join(self.check()))

    def test_missing_original_motion_and_changed_baseline_fail(self):
        path = Path(read(self.f.packet)['phone_options'][0]['motion_sequence']['path'])
        original = path.read_bytes(); path.unlink()
        self.assertTrue(self.check()); path.write_bytes(original)
        (self.f.root / 'repair-1/baseline/Film.tsx').write_text('substituted baseline')
        self.assertIn('baseline', '; '.join(self.check()))

    def test_extra_dependency_and_unregistered_source_fail(self):
        board = read(self.f.root / 'opening-b.json'); board['film_direction']['renderer_inputs'].append({'path':'other.tsx','sha256':'a'*64})
        self.f.write(self.f.root / 'opening-b.json', board)
        self.assertIn('dependencies', '; '.join(self.check()))

    def test_stale_or_substituted_native_pass_fails(self):
        path = next((self.f.root / native.CRITIC_RECEIPTS).glob(bound(self.f.root / 'current-code-packet.json')['sha256'] + '-*.json'))
        value = read(path); value['report']['verdict'] = 'revise'; self.f.write(path, value)
        self.assertTrue(self.check())

    def test_portable_package_survives_missing_original_scratch_and_event_tampering(self):
        f = self.f; destination = f.repo / 'runs' / f.state['run_id']; destination.mkdir(parents=True)
        for name in ('run_state.json', 'storyboard.json', 'claims.json'):
            shutil.copy2(f.root / name, destination / name)
        repair.package_openings(f.root, destination)
        f.root.rename(f.repo / 'original-scratch-unavailable')
        self.assertEqual(repair.opening_problems(destination / 'storyboard.json'), [])
        state = read(destination / 'run_state.json'); state['events'][self.authorized - 1]['resources'] = {'reboards': 2}
        f.write(destination / 'run_state.json', state)
        self.assertTrue(repair.opening_problems(destination / 'storyboard.json'))

    def test_completed_phone_attempt_is_retained_without_granting_phone_approval(self):
        f = self.f; state = read(f.state_path)
        state['events'].append({'kind': 'reserved', 'resources': {'storyboard_critics': 1},
            'publication_owner_sha256': f.owner, 'publication_epoch': 'original-epoch'})
        f.state = state; f.write(f.state_path, state)
        packet = f.write(f.root / 'later-phone-packet.json', {'role': 'storyboard-critic',
            'date': state['run_id'], 'phone_mode': 'selected'})
        report = {'packet_sha256': bound(packet)['sha256'], 'review_scope': 'exact-muted-phone-preflight',
                  'verdict': 'revise', 'blocking_defects': ['Fixture new phone observation.']}
        f.native_return(packet, report, len(state['events']) - 1)
        destination = f.repo / 'runs' / f.state['run_id']; destination.mkdir(parents=True)
        for name in ('run_state.json', 'storyboard.json', 'claims.json'):
            shutil.copy2(f.root / name, destination / name)
        repair.package_openings(f.root, destination)
        f.root.rename(f.repo / 'original-scratch-unavailable')
        self.assertEqual(repair.opening_problems(destination / 'storyboard.json'), [])
        import review_limit
        complete, errors = review_limit.review_evidence(state, destination / 'run_state.json')
        self.assertEqual(errors, [])
        self.assertEqual(complete, {'code': True, 'comparison': True, 'timed_phone': False})

    def test_admitted_scope_director_and_mechanism_are_not_replaceable(self):
        state = read(self.f.state_path)
        for field in ('repair_scope', 'director_identity', 'mechanism_id', 'plan_sha256'):
            bad = copy.deepcopy(state); bad['events'][self.authorized - 2][field] = 'substituted'
            self.f.write(self.f.state_path, bad); self.assertTrue(self.check())
        self.f.write(self.f.state_path, state)

    def test_existing_verified_context_continuation_remains_the_only_exception(self):
        board = read(self.f.root / 'storyboard.json'); board['cinema'] = {'hero_scene_id': 'wider-context'}
        self.f.write(self.f.root / 'storyboard.json', board)
        self.assertTrue(self.check())
        with patch('review_context.required_baseline', return_value=self.f.root / 'opening-b.json') as gate:
            self.assertEqual(self.check(), []); gate.assert_called_once()

    def test_no_adoption_delegates_ordinary_errors_without_filtering(self):
        state = read(self.f.state_path); state['events'] = state['events'][:4]; self.f.write(self.f.state_path, state)
        with patch('creative_production.opening_problems', return_value=['ordinary refusal']) as ordinary:
            self.assertEqual(self.check(), ['ordinary refusal']); ordinary.assert_called_once()


if __name__ == '__main__':
    unittest.main()
