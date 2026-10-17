"""A failed pivot buys one continuation, preserving the full original repair path."""
import copy
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import autonomous_completion as a
import capture_completion_budget as capture
import film_pivot_capacity as f
import run_controller as c


class FilmPivotCapacityTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name).resolve(); self.package = self.root / 'out/dispatch'
        self.package.mkdir(parents=True); self.state = self.package / 'run_state.json'
        # Existing comparison validation has its own real paired-capture suite.
        # Stub only that already-tested transport while exercising real grants,
        # receipts, source baselines, charge accounting and replay here.
        for p in (patch.object(capture, 'eligible', return_value=True),
                  patch.object(capture, 'file_problems', return_value=[]),
                  patch.object(f, 'REPO', self.root),
                  patch('critic_gate.concept_digest', return_value='concept'),
                  patch('critic_gate.renderer_digest', return_value='renderer')):
            p.start(); self.addCleanup(p.stop)
        self.assertTrue(c.initialise(self.state, '2026-10-15', 'production')[0])
        state = c.read_state(self.state)
        for key in a.resource_requirements(state):
            state['usage'][key] = state['resource_envelope'][key]
        c.event(state, 'reserved', resources={k: state['usage'][k] for k in a.resource_requirements(state)},
                note='offline fixture for retained cumulative production charges')
        for i in (1, 2):
            c.event(state, 'repair_started', failure_family='source-framing',
                    mechanism_id='old-' + str(i), failure_sha256=str(i) * 64, repair_scope='standard',
                    plan_sha256='a' * 64, baselines=[{'path': 'retained-fixture', 'before_sha256': 'b' * 64}])
        c.save(self.state, state)
        board = self.write('storyboard.json', {'date': '2026-10-15'})
        baseline = self.write('baseline-board.json', {'date': '2026-10-15'})
        claims = self.write('claims.json', {'claims': []})
        film = self.package / 'preflight.mp4'; film.write_bytes(b'exact failed timed film')
        original = {'verdict': 'revise', 'reviewer_identity': 'independent-phone',
                    'review_scope': 'exact-muted-phone-preflight',
                    'film_sha256': f.digest(film), 'concept_sha256': 'concept',
                    'renderer_sha256': 'renderer', 'story_review': {'claims_sha256': f.digest(claims)},
                    'blocking_defects': ['The performed answer is absent from the current film.'],
                    'modern_observations': {'film_sha256': f.digest(film), 'performed_turn': {'pass': False}}}
        evidence = self.write('original-review.json', original)
        parent = {'director_identity': 'director', 'repair_scope': 'standard',
                  'failure_family': 'source-framing', 'mechanism_id': 'physical-replacement',
                  'failed_film_sha256': f.digest(film), 'failure_evidence': str(evidence),
                  'failure_evidence_sha256': f.digest(evidence), 'resources': {'reboards': 1},
                  'repair': 'Use the source-supported station action and readable water map.',
                  'mechanism_change': 'Retire placards and perform physical causal station changes.',
                  'expected_visible_result': 'The station and closing answer visibly complete their actions.',
                  'changed_inputs': [{'path': str(board), 'before_path': str(baseline), 'before_sha256': f.digest(board)}],
                  'capture_completion_budget': {'schema': capture.COMPARISON_SCHEMA,
                                               'policy_json': capture.COMPARISON_POLICY.read_text()}}
        parent_path = self.write('parent-plan.json', parent)
        accepted, message = a.grant_capacity(self.state, parent_path)
        self.assertTrue(accepted, message)
        state = c.read_state(self.state)
        source_index = len(state['events']) - 1; source = state['events'][source_index]
        self.assertEqual(source['reason'], 'modern-film-floor')
        self.assertTrue(c.reserve(self.state, {'storyboard_critics': 1}, 'same worker agent_pivot_123')[0])
        state = c.read_state(self.state); index = len(state['events']) - 1
        report = {'role': 'storyboard-critic', 'review_scope': 'recurrence-pivot', 'verdict': 'revise',
                  'reviewer_identity': 'independent-pivot', 'retired_mechanism_id': 'old-1',
                  'replacement_mechanism_id': parent['mechanism_id'],
                  'reviewed_failure_sha256': ['1' * 64, '2' * 64],
                  'visible_difference': 'Physical station actions replace placards, but the new proposal still omits a source-backed closing action.',
                  'source_basis': 'The unchanged source describes a prototype, sensor heights and future deployment goals.'}
        self.report = self.write('pivot-report.json', report)
        receipt = {'schema': 'dispatch_pivot_recovery/1', 'run_id': state['run_id'],
                   'role': 'recurrence-pivot', 'status': 'completed', 'provider_unavailable': False,
                   'model': 'claude-opus-5-5', 'effort': 'high', 'action': 'SendMessage_same_id',
                   'agent_id': 'agent_pivot_123', 'source_grant_event_index': source_index,
                   'source_grant_sha256': f.sha(f.canonical(source)), 'reservation_event_index': index,
                   'reservation_sha256': f.sha(f.canonical(state['events'][index])),
                   'reviewer_identity': report['reviewer_identity'], 'report_sha256': f.digest(self.report),
                   'reported_rejection': report['visible_difference']}
        self.receipt = self.write('receipt.json', receipt)
        self.rejected = self.write('rejected-plan.json', parent)
        revised = copy.deepcopy(parent); revised['repair'] += ' Fold the plan beside the bench prototype.'
        registry = self.root / 'config/modern_episode_registry.json'; registry.parent.mkdir(); registry.write_text('{}')
        registry_before = self.write('registry-before.json', {})
        registry.write_bytes(registry_before.read_bytes())
        revised['changed_inputs'].append({'path': str(registry), 'before_path': str(registry_before),
                                          'before_sha256': f.digest(registry)})
        self.revised = self.write('revised-plan.json', revised)
        message = 'Review ' + str(self.rejected) + ' with sha256 ' + f.digest(self.rejected)
        assignment = {k: receipt[k] for k in ('run_id', 'agent_id', 'source_grant_event_index',
                         'source_grant_sha256', 'reservation_event_index', 'reservation_sha256')}
        assignment.update(schema='dispatch_pivot_assignment_binding/1', tool_use_id='toolu_fixture123',
                          observed_at=state['events'][index]['at'], assignment_arguments_sha256='a' * 64,
                          assignment_text=message, message_sha256=f.sha(message),
                          rejected_proposal_path=str(self.rejected), rejected_proposal_sha256=f.digest(self.rejected))
        self.assignment = self.write('assignment.json', assignment)
        self.plan_path = self.package / 'capacity-plan.json'
        f.prepare(self.state, self.receipt, self.report, self.rejected, self.revised, self.plan_path, self.assignment)
        self.plan = json.loads(self.plan_path.read_text()); self.before = c.read_state(self.state)

    def write(self, name, value):
        path = self.package / name; path.write_text(json.dumps(value, indent=2) + '\n'); return path

    def test_one_exact_increment_preserves_charges_and_rejected_evidence(self):
        report_before = self.report.read_bytes()
        accepted, message = a.grant_capacity(self.state, self.plan_path)
        self.assertTrue(accepted, message)
        state = c.read_state(self.state); grant = state['events'][-1]
        self.assertEqual(grant['resource_increments'], {'storyboard_critics': 1})
        self.assertEqual(state['resource_envelope'], self.before['resource_envelope'])
        self.assertEqual(state['usage'], self.before['usage'])
        self.assertEqual(state['events'][:len(self.before['events'])], self.before['events'])
        self.assertTrue(grant['grants_no_review_approval']); self.assertEqual(self.report.read_bytes(), report_before)
        self.assertFalse(self.plan['changed_inputs']); self.assertFalse(state.get('active_repair'))
        self.assertEqual(a.replay(state)[1], [])
        self.assertTrue(c.reserve(self.state, {'storyboard_critics': 1}, 'same worker continuation agent_pivot_123')[0])
        state = c.read_state(self.state); state['terminal_state'] = 'shipped'
        self.assertEqual(a.replay(state)[1], [])

    def test_duplicate_and_renamed_capacity_leave_ledger_unchanged(self):
        self.assertTrue(a.grant_capacity(self.state, self.plan_path)[0])
        before = self.state.read_bytes(); value = copy.deepcopy(self.plan); value['repair'] = 'Renamed prose.'
        self.plan_path.write_text(json.dumps(value))
        self.assertFalse(a.grant_capacity(self.state, self.plan_path)[0]); self.assertEqual(self.state.read_bytes(), before)
        # Reformatting the same report and updating a derived receipt cannot
        # turn one actual charged rejection into another capacity identity.
        text = self.report.read_text() + '\n'
        value['failure_evidence_sha256'] = f.sha(text)
        receipt = json.loads(value[f.FIELD]['receipt_json']); receipt['report_sha256'] = f.sha(text)
        receipt_text = json.dumps(receipt)
        value[f.FIELD].update(receipt_json=receipt_text, receipt_sha256=f.sha(receipt_text))
        self.assertEqual(f.identity(value), f.identity(self.plan))
        self.assertFalse(f.eligible(c.read_state(self.state), value, json.loads(text)))
        self.assertEqual(self.state.read_bytes(), before)

    def test_checkpoint_codec_preserves_original_grants_for_resume_and_public_archive(self):
        import claude_checkpoint as checkpoint
        self.assertEqual(f.canonical({'source': 'water \u2192 chip'}), a.canonical({'source': 'water \u2192 chip'}))
        self.assertTrue(a.grant_capacity(self.state, self.plan_path)[0])
        state = c.read_state(self.state)
        projected, origins = checkpoint.public_projection(state, self.root)
        restored = checkpoint.restored_ledger(projected, self.root / 'later-host',
                     {'repo_root': str(self.root), 'grant_origin_roots': origins})
        self.assertEqual(a.replay(restored)[1], [])
        for before, after in zip(state['events'], restored['events']):
            if before.get('kind') == a.EVENT:
                for key in ('plan_json', 'failure_evidence_json', 'precheck_json'):
                    self.assertEqual(before[key], after[key])

    def test_invalid_receipt_role_scope_model_source_and_identity_refused(self):
        for key, value in [('model', 'claude-haiku-5-5'), ('effort', 'medium'), ('status', 'running'),
                           ('role', 'phone'), ('provider_unavailable', True), ('agent_id', 'other_agent_123'),
                           ('source_grant_sha256', 'bad'), ('reservation_sha256', 'bad')]:
            plan = copy.deepcopy(self.plan); receipt = json.loads(plan[f.FIELD]['receipt_json']); receipt[key] = value
            text = json.dumps(receipt); plan[f.FIELD].update(receipt_json=text, receipt_sha256=f.sha(text))
            self.assertFalse(f.eligible(self.before, plan, json.loads(self.report.read_text())), key)
        report = json.loads(self.report.read_text())
        for change in ({'verdict': 'pass'}, {'review_scope': 'phone'}, {'reviewer_identity': 'director'},
                       {'retired_mechanism_id': 'physical-replacement'}, {'reviewed_failure_sha256': []}):
            self.assertFalse(f.eligible(self.before, self.plan, {**report, **change}))

    def test_current_and_retained_input_mutations_refused_before_grant(self):
        for path in (self.package / 'preflight.mp4', self.package / 'claims.json', self.revised,
                     self.package / 'baseline-board.json'):
            before = path.read_bytes(); path.write_bytes(b'changed')
            self.assertTrue(f.file_problems(self.state, self.plan), str(path)); path.write_bytes(before)
        self.assertEqual(f.file_problems(self.state, self.plan), [])

    def test_actual_assignment_binds_proposal_and_no_technical_history_is_counted(self):
        report = json.loads(self.report.read_text())
        for key, value in [('rejected_proposal_sha256', 'b' * 64), ('agent_id', 'other_agent_123'),
                           ('observed_at', '2000-01-01T00:00:00Z'), ('message_sha256', 'b' * 64),
                           ('assignment_text', 'An unrelated assignment.'), ('tool_use_id', 'not-a-tool')]:
            plan = copy.deepcopy(self.plan); assignment = json.loads(plan[f.FIELD]['assignment_json'])
            assignment[key] = value; text = json.dumps(assignment)
            plan[f.FIELD].update(assignment_json=text, assignment_sha256=f.sha(text))
            self.assertFalse(f.eligible(self.before, plan, report), key)
        plan = copy.deepcopy(self.plan); proposal = json.loads(plan[f.FIELD]['rejected_proposal_json'])
        proposal['repair'] += ' This was never the assigned proposal.'
        text = json.dumps(proposal); plan[f.FIELD].update(rejected_proposal_json=text, rejected_proposal_sha256=f.sha(text))
        self.assertFalse(f.eligible(self.before, plan, report))
        state = copy.deepcopy(self.before)
        for event in state['events']:
            if event.get('kind') == 'repair_started': event['repair_scope'] = 'technical-integrity'
        self.assertFalse(f.eligible(state, self.plan, report))

    def test_old_report_cannot_be_reused_with_a_fresh_critic_reservation(self):
        self.assertTrue(a.grant_capacity(self.state, self.plan_path)[0])
        self.assertTrue(c.reserve(self.state, {'storyboard_critics': 1}, 'same worker agent_pivot_123')[0])
        state = c.read_state(self.state); plan = copy.deepcopy(self.plan)
        for key in ('receipt', 'assignment'):
            value = json.loads(plan[f.FIELD][key + '_json'])
            value.update(reservation_event_index=len(state['events']) - 1,
                         reservation_sha256=f.sha(f.canonical(state['events'][-1])))
            if key == 'assignment':
                value.update(observed_at=state['events'][-1]['at'], tool_use_id='toolu_fixtureSecond123',
                             assignment_arguments_sha256='b' * 64)
            text = json.dumps(value); plan[f.FIELD].update({key + '_json': text, key + '_sha256': f.sha(text)})
        self.assertFalse(f.eligible(state, plan, json.loads(self.report.read_text())))

    def test_native_rejection_uses_registered_snapshot_for_both_capture_schemas(self):
        film = self.package / 'snapshots/failed-native.mp4'; film.parent.mkdir()
        film.write_bytes((self.package / 'preflight.mp4').read_bytes())
        snapshot = {'film': str(film), 'film_sha256': f.digest(film), 'manifest_sha256': 'd' * 64, 'review_only': False}
        state = {'events': [{'kind': 'deliverable_registered', **snapshot}]}
        for schema in (capture.SCHEMA, capture.COMPARISON_SCHEMA):
            parent = {'failed_film_sha256': f.digest(film), 'capture_completion_budget': {'schema': schema}}
            self.assertEqual(f.film_relative(state, parent, {'film_sha256': f.digest(film)}, snapshot),
                             'out/dispatch/snapshots/failed-native.mp4')
        plan = copy.deepcopy(self.plan)
        plan[f.FIELD]['original_film_relative'] = 'out/dispatch/snapshots/failed-native.mp4'
        (self.package / 'preflight.mp4').unlink()
        self.assertEqual(f.file_problems(self.state, plan), [])

    def test_both_routes_protect_four_calls_without_borrowing_a_code_only_route(self):
        import repair_guard
        for route in ('host', 'provider'):
            budget = capture.apply_budget(self.before, self.plan, repair_guard.production_budget_precheck(
                copy.deepcopy(self.before), review_route=route, mandatory_repair=True))
            original = copy.deepcopy(budget)
            result = f.apply_budget(self.plan, budget)
            self.assertEqual(result['resources']['storyboard_critics']['required'], 4)
            self.assertEqual(result['deficits'], {'storyboard_critics': 1})
            self.assertEqual(budget, original)
        self.assertEqual(f.required_counts(self.plan, {'storyboard_critics': 3})['storyboard_critics'], 4)

    def test_revision_cannot_drop_baselines_add_arbitrary_files_or_approve_edits(self):
        report = json.loads(self.report.read_text())
        for mutation in ('drop', 'extra', 'unchanged', 'family'):
            plan = copy.deepcopy(self.plan); revised = json.loads(plan[f.FIELD]['revised_proposal_json'])
            if mutation == 'drop': revised['changed_inputs'].pop(0)
            if mutation == 'extra': revised['changed_inputs'][-1]['path'] = str(self.root / 'unrelated.txt')
            if mutation == 'unchanged': revised = json.loads(plan[f.FIELD]['rejected_proposal_json'])
            if mutation == 'family': revised['failure_family'] = 'human-performance'
            text = json.dumps(revised); plan[f.FIELD].update(revised_proposal_json=text, revised_proposal_sha256=f.sha(text))
            self.assertFalse(f.eligible(self.before, plan, report), mutation)
        plan = copy.deepcopy(self.plan); plan['changed_inputs'] = [{'path': 'anything'}]
        self.assertFalse(f.eligible(self.before, plan, report))
        plan = copy.deepcopy(self.plan); plan['resources'] = {'reboards': 1}
        self.assertFalse(f.eligible(self.before, plan, report))

    def test_later_call_or_production_change_and_other_deficits_refused(self):
        state = copy.deepcopy(self.before)
        for event in ({'kind': 'reserved', 'resources': {'storyboard_critics': 1}},
                      {'kind': 'reserved', 'resources': {'preflight_renders': 1}}, {'kind': 'repair_started'}):
            changed = copy.deepcopy(state); changed['events'].append(event)
            self.assertFalse(f.eligible(changed, self.plan, json.loads(self.report.read_text())))
        changed = c.read_state(self.state)
        changed['usage']['preflight_renders'] += 1
        c.event(changed, 'reserved', resources={'preflight_renders': 1}, note='later actual capture')
        c.save(self.state, changed); before = self.state.read_bytes()
        self.assertFalse(a.grant_capacity(self.state, self.plan_path)[0]); self.assertEqual(self.state.read_bytes(), before)


if __name__ == '__main__':
    unittest.main()
