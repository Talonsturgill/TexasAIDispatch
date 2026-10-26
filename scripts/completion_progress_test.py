"""A new name, changed coordinates or more capacity cannot renew failed staging."""
import copy
import json
from pathlib import Path
import tempfile
import unittest
import five_round_fixture  # noqa: F401
from unittest.mock import patch

import completion_progress as progress


class CompletionProgress(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.repo = Path(self.temp.name).resolve()
        self.addCleanup(patch.stopall)
        patch.object(progress, 'REPO', self.repo).start()
        self.source = self.repo / 'out/dispatch/claims.json'
        self.source.parent.mkdir(parents=True); self.source.write_text('{"claims":["retained source"]}')
        self.old = self.repo / 'video-engine/src/OldCreek.tsx'
        self.old.parent.mkdir(parents=True)
        self.old.write_text('export const OldCreek=()=> <rect x={20} fill="tan"/>;')
        self.before = self.repo / 'out/dispatch/before-creek.tsx'
        self.before.write_bytes(self.old.read_bytes())
        self.new = self.old.with_name('ReplacementCreek.tsx')
        self.state = {'run_id': '2026-10-21', 'mode': 'production',
                      'usage': {'reboards': 3}, 'events': []}
        self.plan = {'repair_scope': 'standard', 'director_identity': 'director',
                     'mechanism_id': 'fourth-new-name', 'failure_family': 'continuity',
                     'failure_evidence_sha256': 'a'*64,
                     'changed_inputs': [{'path': str(self.repo / 'out/dispatch/storyboard.json')}]}

    def replacement(self):
        proof = {'schema': progress.SCHEMA, 'kind': 'whole-scene-replacement',
                 'source_evidence': {'path': str(self.source), 'sha256': progress.digest(self.source)},
                 'retired_inputs': [{'path': str(self.old), 'before_path': str(self.before),
                                     'before_sha256': progress.digest(self.before)}],
                 'replacement_paths': [str(self.new)]}
        report = self.repo / 'out/dispatch/original-independent-pivot.json'
        report.write_text(json.dumps({'verdict': 'pass', 'reviewer_identity': 'independent-opus',
                                     progress.FIELD: proof}))
        self.plan.update({progress.FIELD: proof,
                          'pivot_review': {'path': str(report), 'sha256': progress.digest(report)}})
        return proof, report

    def test_reproduces_capacity_spiral_despite_names_families_and_large_grants(self):
        original = copy.deepcopy(self.state)
        for name, family in [('creek-patch-v13', 'continuity'), ('bank-v14', 'unclassified'),
                             ('last-polish-v15', 'source-framing')]:
            self.plan.update(mechanism_id=name, failure_family=family)
            self.state['escalation_ceiling'] = {'storyboard_critics': 5000}
            self.assertIn('creative boundary', progress.admission_problems(self.state, self.plan)[0])
        self.assertEqual(original['usage'], self.state['usage'])
        self.assertEqual([], self.state['events'])

    def test_real_capacity_entry_refuses_before_an_increment_or_charge(self):
        import autonomous_completion as capacity
        import run_controller as controller
        path = self.repo / 'out/dispatch/run_state.json'
        self.assertTrue(controller.initialise(path, '2026-10-21', 'production')[0])
        for _ in range(3):
            accepted, message = controller.reserve(path, {'reboards': 1}, 'offline charged-repair fixture')
            self.assertTrue(accepted, message)
        plan = self.repo / 'out/dispatch/plan.json'; plan.write_text(json.dumps(self.plan))
        before = path.read_bytes()
        accepted, message = capacity.grant_capacity(path, plan)
        self.assertFalse(accepted)
        self.assertIn('creative boundary', message)
        self.assertEqual(before, path.read_bytes())

    def test_history_and_initial_three_batches_are_not_rewritten(self):
        for date, rounds in [('2026-10-19', 13), ('2026-10-21', 2)]:
            state = {**self.state, 'run_id': date, 'usage': {'reboards': rounds}}
            self.assertEqual([], progress.admission_problems(state, self.plan))
        state = {**self.state, 'active_repair': {'progress_replacement_required': False},
                 'events': [{'kind': 'repair_started', 'progress_replacement_required': False}]}
        self.assertEqual([], progress.authorization_problems(state, self.plan, {}))

    def test_finishing_unchanged_cut_and_independently_classified_technical_path_remain(self):
        self.assertEqual([], progress.admission_problems(self.state, {**self.plan, 'changed_inputs': []}))
        self.assertEqual([], progress.admission_problems(self.state,
            {**self.plan, 'repair_scope': 'technical-integrity'}))

    def test_restored_old_edition_cannot_keep_legacy_spiral_after_a_new_owned_reservation(self):
        import publication_owner
        import run_controller as controller
        path = self.repo / 'out/dispatch/run_state.json'
        self.assertTrue(controller.initialise(path, '2026-10-19', 'production')[0])
        for _ in range(3):
            self.assertTrue(controller.reserve(path, {'reboards': 1}, 'offline old charged batch')[0])
        before = json.loads(path.read_text())
        self.assertFalse(progress.enabled(before))
        with patch.object(publication_owner, 'require_owner', return_value={
                'owner_sha256': 'a'*64, 'epoch': 'new-owned-epoch'}):
            self.assertTrue(controller.reserve(path, {'storyboard_critics': 1}, 'offline rollout reservation')[0])
        after = json.loads(path.read_text())
        self.assertEqual(before['events'], after['events'][:-1])
        self.assertIn('resource_envelope', before)
        for name in ('repair_policy', 'quality_contract', 'creative_policy', 'resource_envelope'):
            self.assertEqual(before.get(name), after.get(name))
        self.assertTrue(progress.enabled(after))
        self.assertIn('creative boundary', progress.admission_problems(after, self.plan)[0])
        after['terminal_state'] = 'shipped'
        self.assertFalse(progress.enabled(after))

    def test_rollout_does_not_retroactively_change_an_already_admitted_batch(self):
        state = {**self.state, 'run_id': '2026-10-19', 'events': [
            {'kind': 'repair_started'},
            {'kind': 'reserved', progress.ROLLOUT_FIELD: progress.EFFECTIVE_DATE,
             'publication_owner_sha256': 'a'*64, 'publication_epoch': 'new-epoch'}],
            'active_repair': {'failure_sha256': 'original-failure'}}
        self.assertEqual([], progress.authorization_problems(state, self.plan, {}))
        state['events'].append({'kind': 'repair_started', 'progress_replacement_required': True})
        state['active_repair']['progress_replacement_required'] = True
        self.assertIn('creative boundary', progress.authorization_problems(state, self.plan, {})[0])

    def test_whole_replacement_needs_original_independent_decision_and_current_source(self):
        proof, report = self.replacement()
        self.assertEqual([], progress.admission_problems(self.state, self.plan))
        proof['kind'] = 'cosmetic-adjustment'
        self.assertTrue(progress.admission_problems(self.state, self.plan))
        proof['kind'] = 'whole-scene-replacement'
        report.write_text(report.read_text() + ' ')
        self.assertIn('changed', progress.admission_problems(self.state, self.plan)[0])

    def test_stale_or_unrelated_source_and_changed_retired_bytes_refuse(self):
        self.replacement(); self.source.write_text('{}')
        self.assertIn('source changed', progress.admission_problems(self.state, self.plan)[0])
        self.replacement(); self.old.write_text('altered old evidence')
        self.assertIn('baseline', progress.admission_problems(self.state, self.plan)[0])

    def test_real_renderer_closure_must_retire_the_failed_implementation(self):
        self.replacement(); self.new.write_text('export const Fresh=()=> <svg><path d="new"/><circle/></svg>;')
        router = self.old.parent / 'Dispatch.tsx'
        router.write_text("import {Fresh} from './ReplacementCreek';\n"
                          "if(cinematic_template === 'fixture-v2'){ return <Fresh/>; }")
        for name in ('CinematicStage.tsx', 'Studio.tsx', 'ProofContext.tsx', 'projection.ts'):
            path = self.old.parent / 'lib/cinema' / name
            path.parent.mkdir(parents=True, exist_ok=True); path.write_text('// Offline graph fixture.\n')
        (self.old.parent / 'lib/direction.ts').write_text('// Offline graph fixture.\n')
        board = {'cinematic_template': 'fixture-v2'}
        with patch('critic_gate.REPO', self.repo):
            self.new.write_text("import {OldCreek} from './OldCreek';\n" + self.new.read_text())
            self.assertIn('renderer closure', progress.authorization_problems(self.state, self.plan, board)[0])
            self.new.write_text('export const Fresh=()=> <svg><path d="new"/><circle/></svg>;')
            self.assertEqual([], progress.authorization_problems(self.state, self.plan, board))

    def test_renaming_and_numeric_style_edits_are_not_a_whole_replacement(self):
        self.replacement()
        self.new.write_text('export const NewCreek=()=> <rect x={75} fill="brown"/>;')
        with patch('critic_gate.renderer_files', return_value=[self.new]):
            self.assertIn('renamed code', progress.authorization_problems(self.state, self.plan, {})[0])

    def test_a_failed_replacement_path_cannot_reenter_under_another_name(self):
        proof, _ = self.replacement()
        self.state['events'] = [{'kind': 'repair_started', 'failure_sha256': 'b'*64,
                                 progress.FIELD: copy.deepcopy(proof)}]
        self.assertIn('route is exhausted', progress.admission_problems(self.state, self.plan)[0])
        self.state['events'][0]['failure_sha256'] = self.plan['failure_evidence_sha256']
        self.assertEqual([], progress.admission_problems(self.state, self.plan))

    def test_new_module_and_mechanism_cannot_renew_a_rejected_whole_replacement(self):
        proof, _ = self.replacement()
        self.state['events'] = [{'kind': 'repair_started', 'failure_sha256': 'b'*64,
                                 progress.FIELD: copy.deepcopy(proof)}]
        self.new = self.old.with_name('AnotherEntirelyNewScene.tsx')
        self.plan['mechanism_id'] = 'eighth-new-description'
        self.replacement()
        self.assertIn('source-pivot', progress.admission_problems(self.state, self.plan)[0])

    def test_forged_source_pivot_field_does_not_reset_the_route(self):
        proof, _ = self.replacement()
        self.state['events'] = [{'kind': 'repair_started', 'failure_sha256': 'b'*64,
                                 progress.FIELD: proof}]
        self.plan['source_validation_completion'] = {'schema': 'pretend'}
        self.assertIn('route is exhausted', progress.admission_problems(self.state, self.plan)[0])

    def test_source_epoch_requires_actual_current_source_validation(self):
        proof, _ = self.replacement()
        self.state['events'] = [
            {'kind': 'repair_started', 'failure_sha256': 'b'*64, progress.FIELD: proof},
            {'kind': 'mandatory_completion_grant',
             'plan_json': json.dumps({'source_validation_completion': {'offline_fixture': True}})}]
        self.new = self.old.with_name('NewValidatedAngle.tsx'); self.replacement()
        with patch('validation_completion.source_validation_problems', return_value=['missing actual validation']):
            self.assertIn('route is exhausted', progress.admission_problems(self.state, self.plan)[0])
        with patch('validation_completion.source_validation_problems', return_value=[]):
            self.assertEqual([], progress.admission_problems(self.state, self.plan))

    def test_real_capacity_entry_cannot_fund_a_second_replacement(self):
        import autonomous_completion as capacity
        import run_controller as controller
        path = self.repo / 'out/dispatch/run_state.json'
        self.assertTrue(controller.initialise(path, '2026-10-21', 'production')[0])
        for _ in range(3):
            self.assertTrue(controller.reserve(path, {'reboards': 1}, 'offline charged repair fixture')[0])
        proof, _ = self.replacement()
        state = controller.read_state(path)
        retained_plan = self.repo / 'out/dispatch/first-replacement-plan.json'
        retained_plan.write_text(json.dumps(self.plan))
        controller.event(state, 'repair_started', failure_sha256='b'*64,
                         plan_sha256=progress.digest(retained_plan),
                         baselines=copy.deepcopy(proof['retired_inputs']), grants={},
                         **{progress.FIELD: proof})
        controller.save(path, state)
        self.new = self.old.with_name('RenamedNewScene.tsx'); self.replacement()
        plan = self.repo / 'out/dispatch/plan.json'; plan.write_text(json.dumps(self.plan))
        before = path.read_bytes()
        accepted, message = capacity.grant_capacity(path, plan)
        self.assertFalse(accepted)
        self.assertIn('route is exhausted', message)
        self.assertEqual(before, path.read_bytes())


if __name__ == '__main__':
    unittest.main()
