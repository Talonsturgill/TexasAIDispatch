"""Offline scope regressions. Fixture native/image hooks never authorize a real production."""
import copy
import json
from pathlib import Path
import unittest
from unittest.mock import patch

import combined_review as combined
import completion_yield as closure
import selected_treatment as selected
import combined_review_test


class SelectedTreatmentTests(unittest.TestCase):
    def setUp(self):
        self.fixture = combined_review_test.CombinedReviewTests(methodName='runTest')
        self.fixture.setUp()
        self.addCleanup(self.fixture.doCleanups)
        f = self.fixture
        f.phone_rejection_fixture()
        f.state['events'][0] = {'kind': 'reserved', 'resources': {'preflight_renders': 1},
                                'note': 'two opening comparison batch', 'preflight_identity': 'original-capture'}
        f.write(f.state_path, f.state)
        self.archive = f.root / 'retained/openings'
        options = []
        packet = combined.read(f.packet)
        for row in packet['phone_options']:
            key = row['id']
            board = {'date': f.state['run_id'], 'title': 'Fixture public source', 'runtime_s': 6,
                     'native_media': [], 'creative_direction': {'viewer_question': 'Who receives the original record?'},
                     'scenes': [{'id': 's1', 'start_s': 0, 'duration_s': 6,
                                 'vo': 'The record reaches the reader.', 'vo_claims': ['c1']}],
                     'treatment': key}
            path = f.write(self.archive / (key + '.json'), board)
            movie = self.archive / (key + '.mp4'); movie.write_bytes(Path(row['film']['path']).read_bytes())
            f.write(f.root / ('opening-' + key + '.json'), board)
            row['board'] = combined.bound(path)
            options.append({'id': key, 'concept_sha256': 'distinct-' + key,
                            'board': {'file': path.name, 'sha256': combined.bound(path)['sha256']},
                            'film': {'file': movie.name, 'sha256': combined.bound(movie)['sha256']}})
        comparison = f.write(self.archive / 'comparison.json', {
            'schema': 'dispatch-opening-comparison/1', 'options': options,
            'reservation': {'identity': 'original-capture', 'run_id': f.state['run_id'], 'event_index': 0}})
        f.write(f.root / 'openings/comparison.json', {'options': copy.deepcopy(options)})
        sha = combined.bound(comparison)['sha256']
        import claude_motion_review as motion
        from PIL import Image
        metadata = {'width': 270, 'height': 480, 'fps': 30, 'frames': 25, 'duration_s': 25 / 30}
        inspection = patch('claude_motion_review.inspect', return_value=metadata)
        inspection.start(); self.addCleanup(inspection.stop)  # Fixture movies are byte strings, never rendered.
        for row in packet['phone_options']:
            row['comparison']['comparison_sha256'] = sha
            sequence_path = Path(row['motion_sequence']['path']); sequence = combined.read(sequence_path)
            page = sequence['pages'][0]; page_path = sequence_path.parent / page['file']
            with Image.open(page_path) as picture:
                page.update(width=picture.width, height=picture.height, bytes=page_path.stat().st_size)
            page['samples'] = [{'frame': n, 'at_s': n / 30} for n in motion.sample_indices(metadata['frames'])]
            sequence.update(schema=motion.PHONE_SCHEMA, film_sha256=row['film']['sha256'],
                board_sha256=row['board']['sha256'], phone=metadata, sample_fps=motion.FPS,
                phone_width=motion.WIDTH, sample_count=len(page['samples']), comparison=row['comparison'])
            f.write(sequence_path, sequence); row['motion_sequence'] = combined.bound(sequence_path)
        # Regenerate only fixture-native handback/claim after constructing exact fixture inputs.
        for path in (f.root / closure.CRITIC_RECEIPTS).glob(combined.bound(f.packet)['sha256'] + '-*.json'):
            path.unlink()
        f.write(f.packet, packet)
        f.report['packet_sha256'] = combined.bound(f.packet)['sha256']
        f.report['selection'].update(comparison_sha256=sha, director_identity='fixture director',
            reason='B follows the record continuously into the reader hand.',
            rejected_reason='A loses the record behind the opening door before the reader appears.')
        f.native_return(f.packet, f.report, 2, agent='native-phone', kind='dispatch-visual-critic')
        import visual_observations
        f.write(f.coverage, visual_observations.coverage(f.packet, Path(f.report['observation_directory'])))

    def adopt(self):
        f = self.fixture
        with patch('run_controller.save', side_effect=lambda path, state: f.write(path, state)):
            return selected.adopt(f.state_path)

    def admitted_story_repair(self):
        f = self.fixture
        state = combined.read(f.state_path)
        baselines = []
        for name in ('claims.json', 'opening-a.json', 'opening-b.json'):
            path = f.root / name; before = f.root / 'pivot-before' / name
            before.parent.mkdir(parents=True, exist_ok=True); before.write_bytes(path.read_bytes())
            baselines.append({'path': str(path), 'before_path': str(before),
                              'before_sha256': combined.bound(path)['sha256']})
        plan = f.write(f.root / 'source-pivot-plan.json', {
            'retire_selection': True, 'changed_inputs': baselines,
            'failure_evidence_sha256': combined.bound(f.failure)['sha256']})
        state['active_repair'] = {'plan': str(plan), 'plan_sha256': combined.bound(plan)['sha256'],
                                 'failure_sha256': combined.bound(f.failure)['sha256'], 'baselines': baselines}
        state['events'].append({'kind': 'repair_started', 'plan_sha256': combined.bound(plan)['sha256'],
                               'failure_sha256': combined.bound(f.failure)['sha256'], 'baselines': baselines})
        f.write(f.state_path, state)
        return plan

    def retire(self, plan):
        f = self.fixture
        with patch('run_controller.save', side_effect=lambda path, state: f.write(path, state)):
            return selected.retire(f.state_path, plan)

    def test_admitted_pivot_retires_choice_before_edit_restores_pair_without_spending(self):
        import agent_runtime
        import review_limit
        f = self.fixture; proof = self.adopt(); plan = self.admitted_story_repair()
        before = combined.read(f.state_path)
        retirement = self.retire(plan)
        after = combined.read(f.state_path)
        self.assertEqual(after['events'][:-1], before['events'])
        self.assertEqual(after['usage'], before['usage'])
        self.assertEqual(after['active_repair'], before['active_repair'])
        self.assertFalse(retirement['approval']); self.assertFalse(retirement['grants_resources'])
        f.write(f.root / 'claims.json', {'claims': ['independently sourced new story']})
        for key in ('a', 'b'):
            board = combined.read(f.root / ('opening-' + key + '.json'))
            board['scenes'][0]['vo'] = 'The new source identifies a different public action.'
            f.write(f.root / ('opening-' + key + '.json'), board)
            f.write(f.root / ('opening-' + key + '-critic.json'), {
                'review_scope': 'code-plan', 'verdict': 'pass',
                'story_review': {'claims_sha256': combined.bound(f.root / 'claims.json')['sha256']}})
        self.assertIsNone(selected.selection_proof(f.state_path))
        self.assertIsNone(agent_runtime.selected_treatment_scope({
            'role': 'scene-builder', 'board': {'path': str(f.root / 'opening-b.json')}}))
        with patch('critic_gate.problems', side_effect=lambda board, report:
                   ['A needs genuine correction'] if board['treatment'] == 'a' else []) as gate:
            complete, errors = review_limit.review_evidence(after, f.state_path)
        self.assertFalse(complete['code']); self.assertFalse(errors)
        self.assertEqual(gate.call_count, 2)
        self.assertEqual(self.retire(plan), retirement)
        self.assertEqual(combined.read(f.state_path), after)
        # The retained independent graph still proves the old choice and old rejected film.
        archived = f.root / retirement['archive']
        self.assertEqual(selected.packaged_selection(archived / 'run_state.json', proof), proof)
        with self.assertRaisesRegex(ValueError, 'source claims changed'):
            self.adopt()

    def test_retirement_requires_admitted_unchanged_plan_and_inputs(self):
        f = self.fixture; self.adopt()
        plan = f.write(f.root / 'unadmitted.json', {'retire_selection': True})
        before = combined.read(f.state_path)
        with self.assertRaisesRegex(ValueError, 'active repair'):
            self.retire(plan)
        self.assertEqual(combined.read(f.state_path), before)
        plan = self.admitted_story_repair()
        path = f.root / 'opening-a.json'; board = combined.read(path)
        board['scenes'][0]['vo'] += ' Already changed.'; f.write(path, board)
        with self.assertRaisesRegex(ValueError, 'before editing'):
            self.retire(plan)

    def test_retired_evidence_tampering_never_silently_returns_pair(self):
        f = self.fixture; self.adopt(); plan = self.admitted_story_repair(); event = self.retire(plan)
        before = combined.read(f.state_path)
        bad = copy.deepcopy(before); bad['events'][-1]['adoption_event_index'] = 0
        f.write(f.state_path, bad)
        with self.assertRaisesRegex(ValueError, 'original adoption'):
            selected.selection_proof(f.state_path)
        f.write(f.state_path, before)
        archive = f.root / event['archive']
        claims = archive / selected.PACKAGE / 'out/dispatch/claims.json'
        claims.write_text('{"tampered":true}')
        with self.assertRaisesRegex(ValueError, 'bytes changed'):
            selected.selection_proof(f.state_path)

    def test_retirement_cannot_readopt_old_review_and_newer_choice_is_explicit(self):
        f = self.fixture; proof = self.adopt(); plan = self.admitted_story_repair(); self.retire(plan)
        with self.assertRaisesRegex(ValueError, 'later genuine'):
            self.adopt()
        # This seam test supplies only a future verifier result, never authorizes a real review.
        fresh = {**proof, 'original_review_event_index': proof['original_review_event_index'] + 20}
        with patch('selected_treatment.latest_selection', return_value=fresh['original_review_event_index']), \
             patch('selected_treatment.original_selection', return_value=fresh):
            self.assertEqual(self.adopt(), fresh)
        self.assertEqual(selected.active_adoption(combined.read(f.state_path))['proof'], fresh)

    def test_retired_proof_packages_after_changed_story_and_without_original_scratch(self):
        import shutil
        from claude_checkpoint import portable
        f = self.fixture; self.adopt(); plan = self.admitted_story_repair(); self.retire(plan)
        f.write(f.root / 'claims.json', {'claims': ['new original source']})
        destination = f.repo / 'runs' / f.state['run_id']
        f.write(destination / 'run_state.json', portable(combined.read(f.state_path), f.repo))
        shutil.copy2(f.root / 'claims.json', destination / 'claims.json')
        self.assertEqual(selected.package(f.root, destination), [])
        f.root.rename(f.repo / 'unavailable-original-scratch')
        self.assertIsNone(selected.selection_proof(destination / 'run_state.json'))

    def test_pending_retirement_funds_full_pair_without_old_combined_discount(self):
        import review_limit
        f = self.fixture; self.adopt(); plan = self.admitted_story_repair()
        state = combined.read(f.state_path); state['run_id'] = '2026-10-29'
        with patch('review_limit.review_evidence', return_value=(dict(code=True, comparison=True, timed_phone=False), [])), \
             patch('combined_review.budget_eligibility', return_value={'fixture': 'old combined eligibility'}):
            path = review_limit.remaining_review_path(state, f.state_path, repair_plan=combined.read(plan))
        self.assertEqual(path['pending'], ['code', 'comparison', 'timed_phone'])
        self.assertEqual(path['required'], 3)
        self.assertFalse(path['combined_eligible'])

    def test_original_native_choice_freezes_b_without_clearing_rejections_or_spending(self):
        f = self.fixture
        before = copy.deepcopy(combined.read(f.state_path))
        originals = {p: p.read_bytes() for p in (f.root / closure.CRITIC_RECEIPTS).glob('*.json')}
        proof = self.adopt()
        after = combined.read(f.state_path)
        self.assertEqual(proof['selected'], 'b')
        self.assertFalse(proof['approval'])
        self.assertEqual(after['events'][:-1], before['events'])
        self.assertEqual(after['usage'], before['usage'])
        self.assertEqual(after['events'][-1]['kind'], selected.KIND)
        self.assertEqual(proof, selected.selection_proof(f.state_path))
        self.assertTrue(all(p.read_bytes() == raw for p, raw in originals.items()))
        self.assertEqual(f.report['phone_reports']['b']['verdict'], 'revise')
        self.assertEqual(self.adopt(), proof)
        self.assertEqual(len(after['events']), len(combined.read(f.state_path)['events']))

    def test_missing_native_selection_coverage_or_changed_bytes_never_admit(self):
        f = self.fixture
        self.adopt()
        for path in [f.coverage, self.archive / 'a.mp4']:
            original = path.read_bytes()
            path.write_bytes(original + b' ')
            with self.assertRaises((ValueError, json.JSONDecodeError)):
                selected.selection_proof(f.state_path)
            path.write_bytes(original)
        note = Path(combined.read(f.coverage)['sequences'][0]['pages'][0]['observation']['path'])
        note.write_text(note.read_text() + ' ')
        with self.assertRaisesRegex(ValueError, 'changed'):
            self.adopt()

    def test_visual_correction_preserves_choice_but_changed_words_or_claims_do_not(self):
        f = self.fixture; self.adopt()
        path = f.root / 'opening-b.json'; board = combined.read(path)
        board['visual_repair'] = 'The actual hand now stays in the same place.'
        board['scenes'][0]['duration_s'] = 7
        f.write(path, board)
        self.assertEqual(selected.selection_proof(f.state_path)['selected'], 'b')
        board['scenes'][0]['vo'] += ' A different claim.'; f.write(path, board)
        with self.assertRaisesRegex(ValueError, 'narration changed'):
            selected.selection_proof(f.state_path)
        board['scenes'][0]['vo'] = 'The record reaches the reader.'; f.write(path, board)
        (f.root / 'claims.json').write_text('{"claims":["new"]}')
        with self.assertRaisesRegex(ValueError, 'source claims changed'):
            selected.selection_proof(f.state_path)

    def test_tampered_adoption_and_missing_original_do_not_fall_back_to_pair(self):
        f = self.fixture; self.adopt()
        state = combined.read(f.state_path)
        state['events'][-1]['proof']['selected'] = 'a'; f.write(f.state_path, state)
        with self.assertRaisesRegex(ValueError, 'adoption'):
            selected.selection_proof(f.state_path)
        state['events'][-1]['proof']['selected'] = 'b'; f.write(f.state_path, state)
        Path(state['events'][-1]['proof']['original_review']['path']).unlink()
        with self.assertRaises(ValueError):
            selected.selection_proof(f.state_path)

    def test_initial_and_historical_states_without_adoption_are_unaffected(self):
        f = self.fixture
        self.assertIsNone(selected.selection_proof(f.state_path))
        state = combined.read(f.state_path); state['terminal_state'] = 'shipped'; f.write(f.state_path, state)
        self.assertIsNone(selected.selection_proof(f.state_path))
        with self.assertRaisesRegex(ValueError, 'unfinished'):
            self.adopt()

    def test_only_known_unselected_motion_failure_is_retained_as_history(self):
        f = self.fixture; proof = self.adopt()
        motion = 'scene s1 declares motion but changes only 0.0 of pixel range. It is a held slide in the animatic.'
        a = f.write(f.root / 'a-inspection.json', {'pass': False, 'problems': [motion]})
        receipt = {'options': [{'id': 'a', 'inspection': {'file': a.name, 'sha256': combined.bound(a)['sha256']}},
                               {'id': 'b'}]}
        errors = ['opening a: ' + motion, 'opening b: ' + motion, 'opening a: structural inspection has stale film_sha256']
        with patch('opening_compare.inspection_problems', return_value=errors):
            actual = selected.inspection_problems(receipt, f.root, f.state_path)
        self.assertEqual(actual, errors[1:])
        self.assertEqual(proof['selected'], 'b')

    def test_original_combined_shape_retains_a_revise_and_checks_selected_code_and_phone(self):
        """The actual fourth response has paired code, one selected phone report and an original choice."""
        f = self.fixture
        packet = combined.read(f.packet)
        packet['phone_state'] = str(f.state_path)
        for option in packet['phone_options']:
            for key in ('modern_observations', 'narration_picture_observations'):
                option['report_bindings'][key] = {'film_sha256': option['film']['sha256']}
        code_packet = combined.read(f.root / 'second-code-packet.json')
        packet['code_report_bindings'] = code_packet['code_report_bindings']
        code_original = closure.original_critic_review(f.state_path, 1)
        codes = copy.deepcopy(code_original['report']['code_reports'])
        label = f.report['selection']['reviewer_identity']
        for code in codes.values():
            code['reviewer_identity'] = label
        codes['a'].update(verdict='revise', blocking_defects=[{
            'scene_id': 's1', 'category': 'contact_and_consequence',
            'defect': 'The departing server is absent; a swinging door alone performs no exit.'}])
        for path in (f.root / closure.CRITIC_RECEIPTS).glob(combined.bound(f.packet)['sha256'] + '-*.json'):
            path.unlink()
        f.write(f.packet, packet)
        report = {'schema': combined.HANDBACK, 'packet_sha256': combined.bound(f.packet)['sha256'],
                  'reviewer_identity': label, 'code_reports': codes,
                  'selection': f.report['selection'], 'phone_review': f.report['phone_reports']['b'],
                  'observation_directory': f.report['observation_directory']}
        claim = f.native_return(f.packet, report, 2, agent='native-phone', kind='dispatch-visual-critic')
        import visual_observations
        f.write(f.coverage, visual_observations.coverage(f.packet, Path(report['observation_directory'])))
        proof = self.adopt()
        self.assertEqual(proof['selected'], 'b')
        handback = f.write(f.root / 'original-combined.json', report)
        reports = {'opening-a-critic.json': codes['a'], 'opening-b-critic.json': codes['b'],
                   'openings/selection.json': report['selection'],
                   'openings/combined-phone-review.json': report['phone_review']}
        for name, value in reports.items():
            f.write(f.root / name, value)
        f.write(f.root / 'openings/combined-review.json', {
            'schema': combined.SCHEMA, 'packet': combined.bound(f.packet), 'handback': combined.bound(handback),
            'claim': combined.bound(claim), 'coverage': combined.bound(f.coverage),
            'native_reviewer_identity': 'native-phone',
            'reports': {name: combined.bound(f.root / name) for name in reports}})
        inspection = f.write(f.root / 'openings/b-inspection.json', {'fixture': True})
        current = combined.read(f.root / 'openings/comparison.json')
        current['options'][1]['inspection'] = {'file': inspection.name, 'sha256': combined.bound(inspection)['sha256']}
        f.write(f.root / 'openings/comparison.json', current)
        with patch('critic_gate.problems', return_value=[]) as code_check, \
             patch('critic_gate.film_review_problems', return_value=['selected B still fails motion']):
            errors = combined.completed_problems(f.root)
        self.assertEqual(code_check.call_count, 1, errors)
        self.assertEqual(code_check.call_args.args[0]['treatment'], 'b')
        self.assertEqual(errors, ['selected B still fails motion'])
        self.assertEqual(combined.read(f.root / 'opening-a-critic.json')['verdict'], 'revise')
        # The original fourth-style response omits nested film hashes. Choice survives;
        # acceptance does not gain those missing fields and stays a separate strict gate.
        self.assertNotIn('modern_observations', report['phone_review'])
        self.assertEqual(report['phone_review']['verdict'], 'revise')
        current['combined_code_review'] = {'fixture': 'original native diagnostic comparison'}
        f.write(f.root / 'openings/comparison.json', current)
        import shutil
        from claude_checkpoint import portable
        destination = f.repo / 'runs' / f.state['run_id']
        f.write(destination / 'run_state.json', portable(combined.read(f.state_path), f.repo))
        shutil.copy2(f.root / 'claims.json', destination / 'claims.json')
        for name in ('comparison.json', 'selection.json', 'b-inspection.json'):
            target = destination / 'openings' / name; target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(f.root / 'openings' / name, target)
        selected.package(f.root, destination)
        f.root.rename(f.repo / 'original-scratch-unavailable')
        with patch('critic_gate.problems', return_value=[]) as code_check, \
             patch('critic_gate.film_review_problems', return_value=['selected B still fails motion']):
            errors = combined.completed_problems(destination)
        self.assertEqual(code_check.call_count, 1, errors)
        self.assertEqual(errors, ['selected B still fails motion'])

    def test_initial_combined_route_is_one_first_assignment_and_never_a_reset(self):
        f = self.fixture
        state = {'mode': 'production', 'run_id': '2026-10-29', 'usage': {'storyboard_critics': 0},
                 'events': [], 'terminal_state': None}
        f.write(f.state_path, state)
        (f.root / 'openings/selection.json').unlink()
        proof = combined.eligibility(f.state_path)
        self.assertEqual((proof['route'], proof['critic_attempt']), ('initial-selection', 1))
        state['usage']['storyboard_critics'] = 1
        state['events'].append({'kind': 'reserved', 'resources': {'storyboard_critics': 1}})
        f.write(f.state_path, state)
        self.assertEqual(combined.eligibility(f.state_path, charged=True), proof)
        with self.assertRaises(ValueError):
            combined.eligibility(f.state_path)
        state['usage']['storyboard_critics'] = 0
        f.write(f.state_path, state)
        with self.assertRaisesRegex(ValueError, 'reset'):
            combined.eligibility(f.state_path)

    def test_corrected_selection_packages_original_graph_and_survives_source_removal(self):
        import shutil
        from claude_checkpoint import portable
        f = self.fixture; proof = self.adopt()
        board = combined.read(f.root / 'opening-b.json')
        board['visual_repair'] = 'The selected hand performs the entire action at readable scale.'
        f.write(f.root / 'opening-b.json', board)
        destination = f.repo / 'runs' / f.state['run_id']
        f.write(destination / 'run_state.json', portable(combined.read(f.state_path), f.repo))
        shutil.copy2(f.root / 'claims.json', destination / 'claims.json')
        files = selected.package(f.root, destination)
        self.assertTrue(files)
        self.assertNotIn('out/dispatch/run_state.json', files)  # No private production ledger export.
        self.assertEqual(proof['selected'], selected.selection_proof(destination / 'run_state.json')['selected'])
        f.root.rename(f.repo / 'original-scratch-unavailable')
        self.assertEqual('b', selected.selection_proof(destination / 'run_state.json')['selected'])
        capsule = destination / selected.PACKAGE
        index = combined.read(capsule / 'index.json')
        page = next(row for row in index['files'] if row['path'].endswith('.png'))
        (capsule / page['path']).write_bytes(b'changed reviewed pixels')
        with self.assertRaisesRegex(ValueError, 'bytes changed'):
            selected.selection_proof(destination / 'run_state.json')

    def test_initial_diagnostic_reaches_choice_without_waiving_dimensions_or_selected_motion(self):
        f = self.fixture
        state = {'mode': 'production', 'run_id': '2026-10-29', 'usage': {'storyboard_critics': 0},
                 'events': [], 'terminal_state': None}
        f.write(f.state_path, state); (f.root / 'openings/selection.json').unlink()
        diagnostic = combined.eligibility(f.state_path)
        motion = 'scene s1 declares motion but changes only 0.0 of pixel range. It is a held slide in the animatic.'
        options = []
        for key in ('a', 'b'):
            path = f.write(f.root / (key + '-inspection.json'), {'pass': False, 'problems': [motion]})
            options.append({'id': key, 'inspection': {'file': path.name, 'sha256': combined.bound(path)['sha256']}})
        receipt = {'options': options, 'combined_code_review': diagnostic}
        errors = ['opening a: ' + motion, 'opening b: ' + motion, 'opening b: wrong dimensions']
        with patch('opening_compare.inspection_problems', return_value=errors):
            self.assertEqual(selected.inspection_problems(receipt, f.root, f.state_path), errors[-1:])
            with patch('selected_treatment.selection_proof', return_value={'selected': 'b'}):
                self.assertEqual(selected.inspection_problems(receipt, f.root, f.state_path), errors[1:])


if __name__ == '__main__':
    unittest.main()
