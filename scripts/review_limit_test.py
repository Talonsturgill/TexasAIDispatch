"""Five real reservations are the end of editorial review, even after recovery."""
import copy
import json
from pathlib import Path
import tempfile
import subprocess
import sys
import unittest
from unittest.mock import patch

import creative_release
import modern_film
import review_limit as limit
import run_controller as controller


class ReviewLimit(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.state = self.root / 'run_state.json'
        self.assertTrue(controller.initialise(self.state, '2026-10-20', 'production')[0])

    def charge(self, count=1, note='offline actual code/phone review attempt'):
        return controller.reserve(self.state, {'storyboard_critics': count}, note)

    def test_real_sixth_reservation_refuses_before_any_ledger_mutation(self):
        for name in ('code', 'phone', 'retry', 'consolidated correction', 'final timed phone'):
            accepted, message = self.charge(note=name)
            self.assertTrue(accepted, message)
        before = self.state.read_bytes()
        accepted, message = self.charge()
        self.assertFalse(accepted); self.assertIn('hard five-review', message)
        self.assertEqual(before, self.state.read_bytes())
        self.assertEqual(5, json.loads(before)['usage']['storyboard_critics'])

    def test_bulk_charge_cannot_cross_the_limit(self):
        self.assertTrue(self.charge(4)[0]); before = self.state.read_bytes()
        self.assertFalse(self.charge(2)[0]); self.assertEqual(before, self.state.read_bytes())
        self.assertTrue(self.charge()[0])

    def test_first_review_refuses_actual_authored_deadlock_before_any_charge(self):
        fixture = json.loads((Path(__file__).parent / 'fixtures/retime_feasibility_2026_10_21.json').read_text())
        board = self.root / 'storyboard.json'
        board.write_text(json.dumps(fixture['original_s1_projection']))
        before = self.state.read_bytes()
        accepted, message = self.charge()
        self.assertFalse(accepted)
        self.assertIn('authored retime feasibility before first review', message)
        self.assertIn('s1-shot-1', message)
        self.assertEqual(before, self.state.read_bytes())

    def test_first_review_checks_other_treatment_and_accepts_compilable_plan(self):
        from retime_feasibility_test import valid
        board = self.root / 'storyboard.json'; board.write_text(json.dumps(valid()))
        other = valid(); other['film_direction']['shots'][0]['narration_ids'] = ['n1', 'n2']
        treatment = self.root / 'opening-b.json'; treatment.write_text(json.dumps(other))
        before = self.state.read_bytes()
        self.assertFalse(self.charge()[0]); self.assertEqual(before, self.state.read_bytes())
        treatment.write_text(json.dumps(valid()))
        accepted, message = self.charge()
        self.assertTrue(accepted, message)
        self.assertEqual(1, json.loads(self.state.read_text())['usage']['storyboard_critics'])

    def test_retained_four_review_recovery_is_not_a_new_code_review(self):
        self.assertTrue(self.charge(4)[0])
        (self.root / 'opening-a.json').write_text(json.dumps({'narration_picture': {'timing_mode': 'authored'}}))
        accepted, message = self.charge(note='reserved fifth exact timed phone')
        self.assertTrue(accepted, message)
        self.assertEqual(5, json.loads(self.state.read_text())['usage']['storyboard_critics'])

    def test_larger_ceilings_new_script_and_recovery_names_cannot_reset_counter(self):
        self.assertTrue(self.charge(5)[0])
        value = json.loads(self.state.read_text())
        value['limits']['storyboard_critics'] = 500
        value['escalation_ceiling']['storyboard_critics'] = 500
        value['events'].append({'kind': 'test_retained_source_pivot', 'new_script': 'new angle'})
        self.state.write_text(json.dumps(value)); before = self.state.read_bytes()
        for name in ('mandatory code', 'source pivot', 'process retry', 'owner capacity', 'review-context'):
            self.assertIn('hard five-review', self.charge(note=name)[1])
            self.assertEqual(before, self.state.read_bytes())

    def test_cap_closes_rebuild_and_all_creative_pivot_admission(self):
        self.assertTrue(self.charge(5)[0]); state = json.loads(self.state.read_text())
        for scope in ('standard', 'narration-performance', 'source-pivot'):
            self.assertTrue(limit.repair_problems(state, {'repair_scope': scope,
                'changed_inputs': [{'path': 'new-scene.tsx'}]}))
        self.assertTrue(limit.reservation_problems(state, {'reboards': 1}))
        self.assertTrue(limit.repair_problems(state, {'resources': {'storyboard_critics': 1}}))
        self.assertEqual([], limit.reservation_problems(state, {'full_renders': 1}))
        self.assertEqual([], limit.reservation_problems(state, {'audiovisual_reviews': 3}))
        self.assertEqual([], limit.reservation_problems(state, {'panel_rounds': 1, 'scorer_calls': 3}))

    def test_actual_completion_capacity_cannot_buy_a_sixth_attempt(self):
        import autonomous_completion
        self.assertTrue(self.charge(5)[0]); before = self.state.read_bytes()
        plan = self.root / 'completion.json'
        plan.write_text(json.dumps({'changed_inputs': [], 'resources': {'storyboard_critics': 1}}))
        accepted, message = autonomous_completion.grant_capacity(self.state, plan)
        self.assertFalse(accepted); self.assertIn('hard five-review', message)
        self.assertEqual(before, self.state.read_bytes())

    def test_history_keeps_counts_and_cloud_adoption_closes_an_old_overrun(self):
        value = json.loads(self.state.read_text()); value['run_id'] = '2026-10-19'
        value['usage']['storyboard_critics'] = 61
        with patch('publication_owner.enabled', return_value=False):
            self.assertFalse(limit.enabled(value))
        original = copy.deepcopy(value)
        with patch('publication_owner.enabled', return_value=True):
            self.assertTrue(limit.reached(value))
            self.assertTrue(limit.reservation_problems(value, {'storyboard_critics': 1}))
        self.assertEqual(original, value)
        value['terminal_state'] = 'shipped'
        self.assertFalse(limit.enabled(value))

    def test_diminishing_returns_preserve_the_final_review_path(self):
        self.assertTrue(self.charge(3)[0])
        value = json.loads(self.state.read_text())
        self.assertTrue(creative_release.finishing_required(value))
        self.assertEqual(2, limit.MAX_ROUNDS - limit.used(value))

    def test_actual_continuation_feedback_closes_creative_recovery_instead_of_extending_it(self):
        import routine_continuation
        self.assertTrue(self.charge(3)[0]); value = json.loads(self.state.read_text())
        hint = routine_continuation.capacity_recovery_hint(value)
        self.assertIn('FIVE cumulative editorial reviews', hint)
        self.assertIn('verified unsent draft with music', hint)
        self.assertNotIn('completion-capacity', hint)
        self.assertNotIn('retained_replacement decision', hint)
        self.assertEqual(3, value['usage']['storyboard_critics'])

    def test_last_slot_accepts_only_the_final_timed_phone_and_cannot_dispatch_six(self):
        self.assertTrue(self.charge(4)[0]); value = json.loads(self.state.read_text())
        self.assertTrue(limit.worker_plan_problems(value, {'role': 'storyboard-critic'}))
        current = {'role': 'storyboard-critic', 'phone_mode': 'current',
                   'review_scope': 'exact-muted-phone-preflight'}
        self.assertEqual([], limit.worker_plan_problems(value, current))
        value['usage']['storyboard_critics'] = 5
        self.assertEqual([], limit.worker_plan_problems(value, current, charged=True))
        self.assertTrue(limit.worker_plan_problems(value, current))
        value['usage']['storyboard_critics'] = 6
        self.assertTrue(limit.worker_plan_problems(value, current))

    def test_surface_boundary_keeps_timed_observations_and_actual_action(self):
        board = {'date': '2026-10-20', 'runtime_s': 10, 'narration_picture': {'clauses': []}}
        report = {'film_sha256': 'a'*64, 'modern_observations': {'film_sha256': 'a'*64},
                  'narration_picture_observations': {'film_sha256': 'a'*64, 'clauses': []}}
        for name in modern_film.policy()['review_criteria']:
            report['modern_observations'][name] = {'pass': True, 'start_s': 1, 'end_s': 2,
                'observed': 'The actual current image shows the performed source-bound action clearly.'}
        report['modern_observations']['finished_art']['pass'] = False
        self.assertEqual([], modern_film.review_problems(board, report, _scope=False, _surface_deferred=True))
        self.assertTrue(modern_film.review_problems(board, report, _scope=False))
        for name in ('performed_turn', 'visual_progression', 'pace', 'closing_answer'):
            changed = copy.deepcopy(report); changed['modern_observations'][name]['pass'] = False
            self.assertTrue(modern_film.review_problems(board, changed, _scope=False, _surface_deferred=True))
        report['modern_observations']['finished_art']['start_s'] = -1
        self.assertTrue(modern_film.review_problems(board, report, _scope=False, _surface_deferred=True))

    def test_surface_classification_cannot_defer_motion_pacing_or_ending(self):
        board = {'date': '2026-10-20'}
        self.assertEqual([], modern_film.assessment_problems(board,
            {'defects': [{'category': 'surface_finish'}]}, _surface_deferred=True))
        for category in ('motion', 'pacing', 'ending_artistry'):
            self.assertTrue(modern_film.assessment_problems(board,
                {'defects': [{'category': category}]}, _surface_deferred=True))


class ConditionalCodeRecovery(unittest.TestCase):
    """The real third handback can admit one source-backed correction, never a sixth call."""

    def setUp(self):
        import completion_yield
        import publication_owner
        import routine_continuation
        import review_recovery_packet as recovery
        self.recovery = recovery
        temporary = tempfile.TemporaryDirectory(); self.addCleanup(temporary.cleanup)
        self.workspace = Path(temporary.name).resolve(); self.repo = self.workspace / 'Dispatch'
        self.root = self.repo / 'out/dispatch'; self.root.mkdir(parents=True)
        self.state = self.root / 'run_state.json'
        self.owner = publication_owner.identity('fixture-parent')
        self.addCleanup(patch.stopall)
        patch('completion_progress.REPO', self.repo).start()
        patch('publication_owner.require_owner', return_value={
            'owner_sha256': self.owner, 'epoch': 'fixture-epoch'}).start()
        self.assertTrue(controller.initialise(self.state, '2026-10-25', 'production')[0])
        for number in range(2):
            accepted, message = controller.reserve(self.state, {'storyboard_critics': 1},
                                                  'original code attempt ' + str(number + 1))
            self.assertTrue(accepted, message)
        self.assertTrue(controller.reserve(self.state, {'reboards': 3}, 'initial and two corrected boards')[0])
        self.old = self.repo / 'video-engine/src/modern/episodes/2026-10-25/OldFilm.tsx'
        self.old.parent.mkdir(parents=True); self.old.write_text('export const OldFilm = () => <div/>;\n')
        self.new = self.old.with_name('ReplacementFilm.tsx')
        self.claims = self.write('claims.json', {'claims': [{'id': 'source-one', 'fact': 'Fixture original fact.'}]})
        self.board = self.write('storyboard.json', {'date': '2026-10-25', 'scenes': [],
            'story_contract': {'director_identity': 'fixture-director'}})
        self.before = self.write('before-board.json', json.loads(self.board.read_text()))
        value = controller.read_state(self.state)
        for number in range(2):
            failure = self.write('failure-' + str(number + 1) + '.json', {'verdict': 'revise',
                'reviewer_identity': 'independent prior critic', 'blocking_defects': ['Fixture contact ' + str(number)]})
            value['events'].extend([
                {'kind': 'repair_started', 'mechanism_id': 'old-mechanism', 'failure_family': 'continuity',
                 'failure_sha256': controller.digest(failure), 'repair_scope': 'standard'},
                {'kind': 'repair_authorized', 'repair_plan': {'failure_evidence': str(failure),
                 'failure_evidence_sha256': controller.digest(failure)}}])
        controller.save(self.state, value)
        self.packet = {'role': 'storyboard-critic', 'date': '2026-10-25',
                       'board': recovery.bound(self.board), 'claims': recovery.bound(self.claims)}
        with patch('critic_gate.renderer_files', return_value=[self.old]):
            self.packet['conditional_recovery'] = recovery.recovery_requirements(self.state, self.packet)
        self.packet_path = self.write('third-packet.json', self.packet)
        accepted, message = controller.reserve(self.state, {'storyboard_critics': 1},
                                               'original third code attempt', review_packet=self.packet_path)
        self.assertTrue(accepted, message)
        with patch('critic_gate.renderer_files', return_value=[self.old]):
            self.assertEqual(self.packet['conditional_recovery'],
                recovery.recovery_requirements(self.state, self.packet, charged=True))
        value = controller.read_state(self.state)
        self.index = len(value['events']) - 1
        self.claim = self.write('worker-dispatch-claims/third.json', {
            'schema': 'dispatch_worker_dispatch_claim/1', 'run_id': value['run_id'],
            'role': 'storyboard-critic', 'packet_sha256': controller.digest(self.packet_path),
            'reservation_event_index': self.index, 'reservation_sha256': completion_yield.digest(value['events'][self.index]),
            'owner_sha256': self.owner, 'epoch': 'fixture-epoch'})
        marker = self.workspace / routine_continuation.MARKER
        marker.parent.mkdir(parents=True, exist_ok=True)
        marker.write_text(json.dumps({'schema': routine_continuation.SCHEMA,
                                     'run_id': value['run_id'], 'state': str(self.state)}))
        request = self.packet['conditional_recovery']
        self.pivot = {'verdict': 'pass', 'reviewer_identity': 'independent fixture critic',
            'reviewed_failure_sha256': [row['sha256'] for row in request['prior_failures']],
            'retired_mechanism_id': 'old-mechanism', 'replacement_mechanism_id': 'replacement-mechanism',
            'source_basis': 'The retained original source supports a complete physical clamp movement.',
            'visible_difference': 'The replacement performs the complete contact action in one coherent scene.',
            'retained_replacement': {'schema': 'dispatch_retained_scene_replacement/1',
                'kind': 'whole-scene-replacement', 'source_evidence': recovery.bound(self.claims),
                'retired_inputs': [{'path': str(self.old), 'before_path': str(self.old),
                                    'before_sha256': controller.digest(self.old)}],
                'replacement_paths': [str(self.new)]}}
        # Match the genuine paired-code envelope: no top-level verdict or reviewer label.
        self.report = {'packet_sha256': controller.digest(self.packet_path), 'review_scope': 'code-plan',
            'combined_verdict': 'revise', 'reports': {key: {'review_scope': 'code-plan', 'verdict': 'revise',
                'reviewer_identity': 'independent fixture critic', 'blocking_defects': ['Missing physical contact.']}
                for key in ('a', 'b')}, 'recovery_review': self.pivot}

    def write(self, name, value):
        path = self.root / name; path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(value, sort_keys=True) + '\n'); return path

    def original(self):
        import completion_yield
        completion_yield.record({'hook_event_name': 'SubagentStop', 'session_id': 'fixture-parent',
            'agent_type': 'storyboard-critic', 'agent_id': 'actual-native-worker-id',
            'last_assistant_message': json.dumps(self.report)}, self.workspace)
        return completion_yield.original_critic_review(self.state, self.index)

    def plan(self):
        failure = self.write('third-original.json', self.report)
        plan = {'repair_scope': 'standard', 'director_identity': 'fixture-director',
            'mechanism_id': 'replacement-mechanism', 'failure_family': 'continuity',
            'failure_evidence': str(failure), 'failure_evidence_sha256': controller.digest(failure),
            'changed_inputs': [{'path': str(self.board), 'before_path': str(self.before),
                                'before_sha256': controller.digest(self.before)}], 'resources': {'reboards': 1}}
        for field in ('root_cause', 'repair', 'expected_visible_result', 'mechanism_change'):
            plan[field] = 'Replace the failed physical clamp implementation with the independently assessed source-backed scene.'
        if 'recovery_review' in self.report:
            plan['pivot_review'] = self.recovery.bound(self.write('original-pivot.json', self.report['recovery_review']))
            plan['retained_replacement'] = self.report['recovery_review']['retained_replacement']
        return self.write('repair-plan.json', plan)

    def test_original_conditional_pivot_admits_real_begin_repair_with_only_two_reviews_remaining(self):
        import production_lifecycle
        original = self.original()
        self.assertNotEqual(original['reviewer_identity'], self.pivot['reviewer_identity'])
        self.assertEqual([], self.recovery.recovery_problems(self.state, original))
        before = controller.read_state(self.state)
        path = limit.remaining_review_path(before, self.state)
        self.assertEqual((3, 2, True), (path['ordinary_required'], path['required'], path['feasible']))
        self.assertFalse(limit.unfundable(before, self.root))
        accepted, message = production_lifecycle.begin_repair(self.state, self.plan(), reserve_reboard=True)
        self.assertTrue(accepted, message)
        after = controller.read_state(self.state)
        self.assertEqual(before['events'], after['events'][:len(before['events'])])
        self.assertEqual(before['resource_envelope'], after['resource_envelope'])
        self.assertEqual((3, 4), (after['usage']['storyboard_critics'], after['usage']['reboards']))
        self.assertEqual([], self.recovery.recovery_problems(self.state, original))
        self.assertTrue(limit.remaining_review_path(after, self.state)['feasible'])

    def test_missing_original_pivot_preserves_failure_and_refuses_repair_without_charging(self):
        import production_lifecycle
        self.report.pop('recovery_review')
        original = self.original()
        self.assertTrue(self.recovery.recovery_problems(self.state, original))
        before = self.state.read_bytes()
        path = limit.remaining_review_path(controller.read_state(self.state), self.state)
        self.assertEqual((3, False), (path['required'], path['feasible']))
        self.assertTrue(limit.unfundable(controller.read_state(self.state), self.root))
        accepted, message = production_lifecycle.begin_repair(self.state, self.plan(), reserve_reboard=True)
        self.assertFalse(accepted)
        self.assertIn('whole failed scene', message)
        self.assertEqual(before, self.state.read_bytes())

    def test_original_unfundable_closure_retains_its_recorded_predicate(self):
        self.original()
        state = controller.read_state(self.state)
        state['events'].append({'kind': 'hard_limit_expenditure_closed', 'evidence': {
            'plan': {'reason': 'unfundable-required-review-before-film'}}})
        with patch.object(limit, 'remaining_review_path', side_effect=AssertionError('no historical reinterpretation')):
            self.assertTrue(limit.unfundable(state, self.root))
            self.write('opening-a-critic.json', {'verdict': 'revise'})
            self.assertFalse(limit.unfundable(state, self.root))


class RemainingReviewPath(unittest.TestCase):
    """Real controller charges with tiny evidence fixtures; no render or provider calls."""

    edition = '2026-10-25'

    def setUp(self):
        from types import SimpleNamespace
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name); self.state = self.root / 'run_state.json'
        self.assertTrue(controller.initialise(self.state, self.edition, 'production')[0])
        # Route eligibility has its own original-handback tests. Missing proof cannot
        # discount this fixture's three pending independent gates.
        self.combined = SimpleNamespace(
            budget_eligibility=lambda *a, **k: (_ for _ in ()).throw(ValueError('no original handback')),
            eligibility=lambda *a, **k: (_ for _ in ()).throw(ValueError('not ready')))
        self.addCleanup(patch.stopall)
        original = sys.modules.get('combined_review')
        sys.modules['combined_review'] = self.combined
        def restore_combined():
            if original is None:
                sys.modules.pop('combined_review', None)
            else:
                sys.modules['combined_review'] = original
        self.addCleanup(restore_combined)
        for name in ('quality_contract.plan_problems', 'daily_production.review_problems',
                     'daily_production.action_problems', 'independent_review.evidence_problems'):
            patch(name, return_value=[]).start()
        patch('creative_release.review_allows', return_value=False).start()
        for ordinal in range(1, 4):
            accepted, message = controller.reserve(self.state, {'storyboard_critics': 1},
                                                  'retained code attempt ' + str(ordinal))
            self.assertTrue(accepted, message)

    def write(self, name, value):
        path = self.root / name; path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(value)); return path

    def code_passes(self):
        import critic_gate
        claims = self.write('claims.json', {'claims': []})
        for option in ('a', 'b'):
            board = {'date': self.edition, 'scenes': [], 'option': option}
            self.write('opening-' + option + '.json', board)
            self.write('opening-' + option + '-critic.json', {
                'verdict': 'pass', 'review_scope': 'code-plan',
                'concept_sha256': critic_gate.concept_digest(board),
                'reviewer_identity': 'independent fixture critic', 'reviewed_at': self.edition + 'T10:00:00Z',
                'weakest_frame': 'The closing scene has the least activity.',
                'story_review': {'claims_sha256': controller.digest(claims)}})
        self.write('storyboard.json', json.loads((self.root / 'opening-a.json').read_text()))

    def packet(self, mode):
        return {'role': 'storyboard-critic', 'review_scope': 'exact-muted-phone-preflight',
                'phone_mode': mode}

    def test_three_failed_reviews_preserve_envelope_but_cannot_fund_ordinary_path(self):
        import repair_guard
        import autonomous_completion
        state = controller.read_state(self.state); before = self.state.read_bytes()
        budget = repair_guard.production_budget_precheck(state, state_path=self.state)
        row = budget['resources']['storyboard_critics']
        self.assertEqual((3, 5, 3, 2), (row['required'], row['ceiling'], row['used'], row['remaining']))
        self.assertEqual({'storyboard_critics': 1}, budget['deficits'])
        self.assertFalse(budget['feasible'])
        self.assertEqual(7, state['resource_envelope']['storyboard_critics'])
        self.assertEqual(3, autonomous_completion.finish_phone_critics(state, True, self.state))
        self.assertEqual(before, self.state.read_bytes())

    def test_fourth_code_is_refused_before_any_ledger_change(self):
        before = self.state.read_bytes()
        accepted, message = controller.reserve(self.state, {'storyboard_critics': 1}, 'another code attempt')
        self.assertFalse(accepted); self.assertIn('needs 3', message)
        self.assertEqual(before, self.state.read_bytes())
        state = controller.read_state(self.state)
        self.assertTrue(limit.worker_plan_problems(state, {'role': 'storyboard-critic'}, state_path=self.state))

    def test_real_code_hashes_and_claims_protect_the_two_remaining_phone_slots(self):
        self.code_passes(); state = controller.read_state(self.state)
        path = limit.remaining_review_path(state, self.state)
        self.assertTrue(path['completed']['code']); self.assertEqual(2, path['required'])
        self.assertTrue(path['feasible'])
        board = json.loads((self.root / 'opening-b.json').read_text()); board['option'] = 'changed'
        self.write('opening-b.json', board)
        stale = limit.remaining_review_path(state, self.state)
        self.assertFalse(stale['completed']['code']); self.assertEqual(3, stale['required'])
        self.assertFalse(stale['feasible'])
        self.code_passes(); self.write('claims.json', {'claims': ['changed source']})
        self.assertFalse(limit.remaining_review_path(state, self.state)['completed']['code'])

    def test_comparison_four_and_final_five_replans_do_not_double_charge(self):
        self.code_passes()
        comparison = self.packet('comparison'); comparison_path = self.write('phone-packet.json', comparison)
        with patch('agent_runtime.validate_references'), patch('claude_runtime.phone_review_inputs'):
            accepted, message = controller.reserve(self.state, {'storyboard_critics': 1}, 'silent comparison',
                                                   review_packet=comparison_path)
            self.assertTrue(accepted, message)
            state = controller.read_state(self.state)
            path = limit.remaining_review_path(state, self.state, comparison, charged=True)
            self.assertEqual((1, 1), (path['required'], path['remaining'])); self.assertTrue(path['feasible'])
            self.assertEqual([], limit.worker_plan_problems(state, comparison, charged=True, state_path=self.state))
            self.assertTrue(limit.worker_plan_problems(state, comparison, state_path=self.state))
            self.write('openings/comparison.json', {'fixture': 'already tested by its owning gate'})
            self.write('openings/selection.json', {'selected': 'a'})
            final = self.packet('current'); final_path = self.write('final-packet.json', final)
            binding = {'final_timed_phone': {'packet_identity': limit.packet_identity(final)}}
            with patch('creative_production.opening_problems', return_value=[]), \
                    patch('review_limit.final_reservation_binding', return_value=binding):
                self.assertEqual(1, limit.remaining_review_path(state, self.state, final)['required'])
                accepted, message = controller.reserve(self.state, {'storyboard_critics': 1}, 'final timed phone',
                                                       review_packet=final_path)
                self.assertTrue(accepted, message)
                final_state = controller.read_state(self.state)
                path = limit.remaining_review_path(final_state, self.state, final, charged=True)
                self.assertEqual((0, 0), (path['required'], path['remaining']))
                self.assertTrue(path['feasible'])
                self.assertEqual([], limit.worker_plan_problems(final_state, final, charged=True, state_path=self.state))
                self.assertEqual(5, final_state['usage']['storyboard_critics'])

    def test_only_verified_combined_route_fits_three_rejections_and_one_final_phone(self):
        proof = {'original_handback_sha256': 'a' * 64}
        self.combined.budget_eligibility = lambda *a, **k: proof
        self.combined.eligibility = lambda *a, **k: proof
        state = controller.read_state(self.state)
        path = limit.remaining_review_path(state, self.state)
        self.assertEqual((3, 2), (path['ordinary_required'], path['required']))
        self.assertTrue(path['combined_eligible']); self.assertTrue(path['feasible'])
        packet = {**self.packet('comparison'), 'combined_code_review': proof}
        packet_path = self.write('combined-packet.json', packet)
        with patch('agent_runtime.validate_references'), patch('claude_runtime.phone_review_inputs'):
            accepted, message = controller.reserve(self.state, {'storyboard_critics': 1}, 'combined fourth',
                                                   review_packet=packet_path)
            self.assertTrue(accepted, message)
            self.assertEqual([], limit.worker_plan_problems(controller.read_state(self.state), packet,
                                                            charged=True, state_path=self.state))
            changed = {**packet, 'combined_code_review': {'original_handback_sha256': 'b' * 64}}
            self.assertTrue(limit.worker_plan_problems(controller.read_state(self.state), changed,
                                                       charged=True, state_path=self.state))


class PlannedCorrectionBudget(unittest.TestCase):
    """Fund the post-correction gates before the builder can invalidate current approval."""

    edition = '2026-10-26'
    setUp = RemainingReviewPath.setUp
    write = RemainingReviewPath.write
    code_passes = RemainingReviewPath.code_passes

    def plan(self):
        self.code_passes()
        source = self.root / 'Scene.tsx'; source.write_text('export const Scene = () => <div/>;\n')
        before = self.root / 'Scene.before.tsx'; before.write_bytes(source.read_bytes())
        failure = self.write('original-phone-rejection.json', {'verdict': 'revise',
            'review_scope': 'exact-muted-phone-preflight', 'reviewer_identity': 'original fixture critic',
            'reviewed_preflight_sha256': 'f' * 64,
            'blocking_defects': [{'category': 'comprehension', 'defect': 'The object visibly loses contact.'}]})
        plan = {'repair_scope': 'standard', 'director_identity': 'fixture director',
            'mechanism_id': 'continuous-object-contact', 'failure_family': 'continuity',
            'failure_evidence': str(failure), 'failure_evidence_sha256': controller.digest(failure),
            'changed_inputs': [{'path': str(source), 'before_path': str(before),
                                'before_sha256': controller.digest(before)}], 'resources': {'reboards': 1}}
        for field in ('root_cause', 'repair', 'mechanism_change', 'expected_visible_result'):
            plan[field] = 'Keep the independently rejected object in physical contact throughout the complete performed scene.'
        return self.write('planned-correction.json', plan)

    def allow_combined(self):
        # The peer combined-review suite proves native original phone/code/coverage
        # provenance. This fixture isolates the real controller's admission timing.
        self.combined.budget_eligibility = lambda *a, **k: {'original_phone_failure': 'fixture'}

    def test_current_code_approval_cannot_fund_planned_source_changes(self):
        import production_lifecycle
        plan = self.plan(); state = controller.read_state(self.state)
        current = limit.remaining_review_path(state, self.state)
        self.assertTrue(current['completed']['code']); self.assertEqual(2, current['required'])
        forecast = limit.remaining_review_path(state, self.state, repair_plan=controller.load_json(plan))
        self.assertEqual(['code', 'comparison', 'timed_phone'], forecast['invalidated'])
        self.assertEqual((3, False), (forecast['required'], forecast['feasible']))
        before = self.state.read_bytes()
        ok, message = production_lifecycle.begin_repair(self.state, plan, reserve_reboard=True)
        self.assertFalse(ok); self.assertIn('complete remaining path', message)
        self.assertEqual(before, self.state.read_bytes())

    def test_genuine_combined_route_admits_and_authorizes_one_already_charged_correction(self):
        import production_lifecycle
        import repair_guard
        plan_path = self.plan(); self.allow_combined(); before = controller.read_state(self.state)
        ok, message = production_lifecycle.begin_repair(self.state, plan_path, reserve_reboard=True)
        self.assertTrue(ok, message)
        opened = controller.read_state(self.state)
        self.assertEqual((3, 1), (opened['usage']['storyboard_critics'], opened['usage']['reboards']))
        self.assertEqual(before['events'], opened['events'][:len(before['events'])])
        plan = controller.load_json(plan_path); row = plan['changed_inputs'][0]
        paid = repair_guard.production_budget_precheck(opened, state_path=self.state, repair_plan=plan)
        self.assertTrue(paid['feasible'], paid)
        self.assertEqual(0, paid['resources']['reboards']['required'])
        unrelated = {**plan, 'failure_evidence_sha256': 'e' * 64}
        other = repair_guard.production_budget_precheck(opened, state_path=self.state, repair_plan=unrelated)
        self.assertEqual(1, other['resources']['reboards']['required'])
        Path(row['path']).write_text('export const Scene = () => <section><div/></section>;\n')
        row['after_sha256'] = controller.digest(Path(row['path'])); plan_path.write_text(json.dumps(plan))
        usage = copy.deepcopy(opened['usage']); envelope = copy.deepcopy(opened['resource_envelope'])
        ok, message = production_lifecycle.authorize_repair(self.state, plan_path)
        self.assertTrue(ok, message)
        closed = controller.read_state(self.state)
        self.assertEqual(usage, closed['usage']); self.assertEqual(envelope, closed['resource_envelope'])
        self.assertNotIn('active_repair', closed)

    def test_corrective_charge_uses_bound_baselines_not_mutable_plan_omissions(self):
        import production_lifecycle
        plan = self.plan(); self.allow_combined()
        self.assertTrue(production_lifecycle.begin_repair(self.state, plan)[0])
        original_plan = controller.load_json(plan); original_plan['changed_inputs'] = []
        plan.write_text(json.dumps(original_plan))
        self.combined.budget_eligibility = lambda *a, **k: (_ for _ in ()).throw(ValueError('original proof unavailable'))
        before = self.state.read_bytes()
        ok, message = controller.reserve(self.state, {'reboards': 1}, 'attempt an unfunded source correction')
        self.assertFalse(ok); self.assertIn('needs 3', message)
        self.assertEqual(before, self.state.read_bytes())

    def test_capture_reserve_includes_both_comparison_films_and_final_timed_preview(self):
        import repair_guard
        plan_path = self.plan(); plan = controller.load_json(plan_path); self.allow_combined()
        # Today's observed twelve remaining units fund all seven prepared operators.
        # Retain actual fixture charges and its original envelope throughout.
        available = controller.read_state(self.state)['resource_envelope']['preflight_renders']
        ok, message = controller.reserve(self.state, {'preflight_renders': available - 12}, 'retained original captures')
        self.assertTrue(ok, message)
        ready = repair_guard.production_budget_precheck(controller.read_state(self.state),
                                                        state_path=self.state, repair_plan=plan)
        self.assertEqual((7, 12), (ready['resources']['preflight_renders']['required'],
                                  ready['resources']['preflight_renders']['remaining']))
        self.assertTrue(ready['feasible'], ready)
        ok, message = controller.reserve(self.state, {'preflight_renders': 10}, 'hero')
        self.assertTrue(ok, message)
        state = controller.read_state(self.state); before = self.state.read_bytes()
        budget = repair_guard.production_budget_precheck(state, state_path=self.state, repair_plan=plan)
        self.assertEqual(7, budget['resources']['preflight_renders']['required'])
        self.assertEqual(5, budget['deficits']['preflight_renders'])
        self.assertEqual(2, budget['resources']['storyboard_critics']['required'])
        self.assertFalse(budget['feasible']); self.assertEqual(before, self.state.read_bytes())
        import production_lifecycle
        ok, message = production_lifecycle.begin_repair(self.state, plan_path, reserve_reboard=True)
        self.assertFalse(ok); self.assertIn('preflight_renders', message)
        self.assertEqual(before, self.state.read_bytes())
        historical = copy.deepcopy(state); historical['run_id'] = '2026-10-25'
        with patch.object(limit, 'review_evidence', return_value=(
                {'code': False, 'comparison': False, 'timed_phone': False}, [])):
            old = repair_guard.production_budget_precheck(historical, state_path=self.state, repair_plan=plan)
        self.assertEqual(2, old['resources']['preflight_renders']['required'])
        for comparison, timed, expected in ((True, False, 4), (True, True, 2)):
            with self.subTest(comparison_passed=comparison, timed_passed=timed), \
                    patch.object(limit, 'review_evidence', return_value=(
                        {'code': True, 'comparison': comparison, 'timed_phone': timed}, [])):
                pending = repair_guard.production_budget_precheck(state, state_path=self.state)
            self.assertEqual(expected, pending['resources']['preflight_renders']['required'])

    def test_current_frozen_context_repair_reuses_exhausted_synthesis_and_art(self):
        from review_context_test import ContextTest
        import production_lifecycle
        import repair_guard
        fixture = ContextTest('test_charged_repair_preserves_envelope_and_all_prior_events')
        fixture.setUp(); self.addCleanup(fixture.doCleanups)
        state = controller.read_state(fixture.state)
        state['run_id'] = self.edition
        controller.save(fixture.state, state)
        fixture.board['date'] = self.edition
        fixture.write('storyboard.json', fixture.board); fixture.write('before.json', fixture.board)
        board_hash = controller.digest(fixture.before)
        for artifact in ('preflight.json', 'proof.json'):
            value = controller.load_json(fixture.root / artifact); value['board_sha256'] = board_hash
            fixture.write(artifact, value)
        diagnosis = controller.load_json(fixture.diagnosis)
        diagnosis['bindings']['board_sha256'] = board_hash
        fixture.write('diagnosis.json', diagnosis)
        fixture.plan['diagnosis'] = fixture.ref(fixture.diagnosis)
        fixture.plan['failed_proof'] = fixture.ref(fixture.proof)
        fixture.plan['changed_inputs'][0]['before_sha256'] = board_hash
        fixture.write('plan.json', fixture.plan)
        exhausted = {name: state['resource_envelope'][name]
                     for name in ('tts_calls', 'image_generations')}
        ok, message = controller.reserve(fixture.state, exhausted, 'retained original synthesis and artwork')
        self.assertTrue(ok, message)
        state = controller.read_state(fixture.state)
        generic = repair_guard.production_budget_precheck(state, state_path=fixture.state,
                                                          repair_plan=fixture.plan)
        self.assertFalse(generic['feasible'])
        self.assertGreater(generic['deficits']['tts_calls'], 0)
        self.assertGreater(generic['deficits']['image_generations'], 0)
        before = copy.deepcopy(state)
        ok, message = production_lifecycle.begin_repair(fixture.state, fixture.plan_path)
        self.assertTrue(ok, message)
        ok, message = controller.reserve(fixture.state, {'reboards': 1}, 'frozen excerpt expansion')
        self.assertTrue(ok, message)
        fixture.expand()
        ok, message = production_lifecycle.authorize_repair(fixture.state, fixture.plan_path)
        self.assertTrue(ok, message)
        after = controller.read_state(fixture.state)
        self.assertEqual(before['resource_envelope'], after['resource_envelope'])
        self.assertEqual(before['events'], after['events'][:len(before['events'])])
        for name in exhausted:
            self.assertEqual(before['usage'][name], after['usage'][name])
        self.assertEqual([], production_lifecycle.allowance_problems(after))

    def test_existing_narrow_frozen_scopes_do_not_reopen_unmodified_code(self):
        state = controller.read_state(self.state)
        plan = {'changed_inputs': [{'path': '/episode/out/dispatch/vo_direction.json'}]}
        self.assertEqual(['timed_phone'], limit.planned_invalidations(state,
            {**plan, 'repair_scope': 'narration-performance'}))
        self.assertEqual([], limit.planned_invalidations(state,
            {**plan, 'repair_scope': 'review-context'}))
        self.assertEqual([], limit.planned_invalidations(state,
            {**plan, 'repair_scope': 'technical-integrity'}))
        self.assertEqual(['code', 'comparison', 'timed_phone'], limit.planned_invalidations(state,
            {'repair_scope': 'technical-integrity', 'changed_inputs': [{'path': '/episode/video-engine/src/Scene.tsx'}]}))


class FinalPhoneReservation(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name); self.output = self.root / 'out/dispatch'
        self.output.mkdir(parents=True); self.state = self.output / 'run_state.json'
        self.assertTrue(controller.initialise(self.state, '2026-10-24', 'production')[0])
        self.assertTrue(controller.reserve(self.state, {'storyboard_critics': 4}, 'four earlier attempts')[0])

    def packet(self, *, authored=False, silent=False):
        import claude_runtime as runtime
        import claude_motion_review as motion
        import critic_gate
        board = self.output / 'storyboard.json'; film = self.output / 'preflight.mp4'
        # A tiny mechanical timing fixture, never a creative or acoustic production verdict.
        text = 'Software flags the leak.'
        captions = {'cues': [{'id': 'c1', 'text': text, 'start': .3, 'end': 1.6,
                    'source': 'measured_boundary', 'start_measured': True, 'end_measured': True}]}
        words = {'method': 'offline-test-fixture', 'words': [
            {'word': word, 'start': start, 'end': end}
            for word, start, end in [('Software', .3, .55), ('flags', .6, .8),
                                     ('the', .9, 1.0), ('leak.', 1.2, 1.6)]]}
        data = {'date': '2026-10-24', 'runtime_s': 1.8, 'credits_s': 0,
                'scenes': [{'id': 's1', 'start_s': 0, 'duration_s': 1.8, 'vo': text,
                    'visual_events': [{'id': 'e1', 'narration_id': 'n1', 'at_s': .4, 'duration_s': .5,
                                       'clause_fraction_start': .1, 'clause_fraction_end': .8}]}],
                'film_direction': {'episode': 'leak-review-v1', 'shots': [
                    {'id': 'shot1', 'scene_id': 's1', 'view': 'alert-panel', 'event_id': 'e1',
                     'narration_ids': ['n1'], 'start_s': 0, 'duration_s': 1.8}]},
                'narration_picture': {'version': 'narration-picture-v1',
                    'timing_mode': 'authored' if authored else 'measured_caption_boundaries',
                    'timing_provenance': {'cue_content_sha256': modern_film.cue_digest(captions['cues']),
                                          'word_content_sha256': modern_film.narration_digest(words)},
                    'clauses': [{'id': 'n1', 'cue_ids': ['c1'], 'text': text, 'start_s': .3, 'end_s': 1.6,
                        'word_range': [0, 4], 'scene_id': 's1', 'subject_ids': ['s2-alert'],
                        'action_id': 'software-alert-claim', 'claim_ids': ['test-claim'], 'event_ids': ['e1']}]}}
        if silent:
            data.pop('narration_picture')
        board.write_text(json.dumps(data))
        (self.output / 'captions.json').write_text(json.dumps(captions))
        (self.output / 'words.json').write_text(json.dumps(words))
        (self.output / 'vo_script.txt').write_text(text)
        subprocess.run([motion.FFMPEG, '-v', 'error', '-f', 'lavfi', '-i',
            'testsrc2=size=270x480:rate=30:duration=1.8', '-c:v', 'libx264',
            '-preset', 'ultrafast', '-crf', '16', str(film)], check=True)
        (self.output / 'preflight.json').write_text(json.dumps({'pass': True, 'problems': [],
            'renderer_sha256': critic_gate.renderer_digest(data),
            'board_sha256': motion.digest(board), 'film_sha256': motion.digest(film)}))
        binding = motion.phone_inputs(self.state, 'current', board, film)
        index = motion.build(board, film, self.output / 'timed-motion', True, binding)
        claims = self.output / 'claims.json'; claims.write_text('{}')
        data = {'role': 'storyboard-critic', 'date': '2026-10-24',
                'agent_assignment': runtime.assignment('storyboard-critic', '2026-10-24'),
                'board': runtime.bound(board), 'claims': runtime.bound(claims),
                'phone_state': str(self.state), 'phone_mode': 'current',
                'review_scope': 'exact-muted-phone-preflight',
                'phone_options': runtime.phone_options(self.state, [index], True),
                'phone_decision_scope': runtime.phone_decision_scope()}
        data['phone_options'][0]['report_bindings']['story_review']['claims_sha256'] = runtime.digest(claims)
        path = self.output / 'current-phone-packet.json'; path.write_text(json.dumps(data))
        return path, data

    def test_generic_fifth_cannot_be_spent_for_code_pivot_or_named_phone(self):
        before = self.state.read_bytes()
        for note in ('code correction', 'narration pivot', 'final timed phone', 'owner-granted extra review'):
            ok, message = controller.reserve(self.state, {'storyboard_critics': 1}, note)
            self.assertFalse(ok); self.assertIn('--review-packet', message)
            self.assertEqual(before, self.state.read_bytes())

    def test_bulk_reservation_cannot_hide_the_protected_fifth(self):
        other = self.root / 'bulk.json'
        self.assertTrue(controller.initialise(other, '2026-10-24', 'production')[0])
        before = other.read_bytes()
        self.assertFalse(controller.reserve(other, {'storyboard_critics': 5}, 'bulk reviews')[0])
        self.assertEqual(before, other.read_bytes())

    def test_real_current_phone_packet_can_spend_fifth_once_and_bind_dispatch(self):
        packet, data = self.packet()
        ok, message = controller.reserve(self.state, {'storyboard_critics': 1},
                                          'final timed phone', review_packet=packet)
        self.assertTrue(ok, message)
        value = controller.read_state(self.state)
        self.assertEqual(5, value['usage']['storyboard_critics'])
        bound = value['events'][-1]['final_timed_phone']
        self.assertEqual(controller.digest(packet), bound['packet']['sha256'])
        self.assertEqual([], limit.worker_plan_problems(value, data, charged=True))
        changed = copy.deepcopy(data); changed['instructions'] = 'different paid task'
        self.assertTrue(limit.worker_plan_problems(value, changed, charged=True))
        before = self.state.read_bytes()
        self.assertFalse(controller.reserve(self.state, {'storyboard_critics': 1},
                                            'repeat final phone', review_packet=packet)[0])
        self.assertEqual(before, self.state.read_bytes())

    def test_authored_clock_cannot_spend_the_final_timed_slot(self):
        packet, _ = self.packet(authored=True); before = self.state.read_bytes()
        ok, message = controller.reserve(self.state, {'storyboard_critics': 1},
                                         'claimed final phone', review_packet=packet)
        self.assertFalse(ok); self.assertIn('still an authored estimate', message)
        self.assertEqual(before, self.state.read_bytes())

    def test_silent_current_preview_cannot_spend_the_final_timed_slot(self):
        packet, _ = self.packet(silent=True); before = self.state.read_bytes()
        ok, message = controller.reserve(self.state, {'storyboard_critics': 1},
                                         'claimed final phone', review_packet=packet)
        self.assertFalse(ok); self.assertIn('complete narration-picture contract', message)
        self.assertEqual(before, self.state.read_bytes())

    def test_actual_claude_plan_charge_replan_preserves_packet_and_claims_once(self):
        import claude_runtime as runtime
        import publication_owner as owner
        import claude_checkpoint as checkpoint
        packet, data = self.packet()
        brief = '.claude/agents/' + data['agent_assignment']['agent'] + '.md'
        (self.root / brief).parent.mkdir(parents=True)
        (self.root / brief).write_bytes((runtime.REPO / brief).read_bytes())
        data['brief'] = brief; packet.write_text(json.dumps(data)); packet_before = packet.read_bytes()
        identity = {'owner_sha256': 'a' * 64, 'epoch': 'offline-test-epoch'}
        # Only external ownership/remote checkpoint transport and unrelated guide inventory
        # are isolated. Actual phone/clock/hash validation, plans, charges and claims execute.
        with patch.object(runtime, 'REPO', self.root), \
                patch.object(owner, 'enabled', return_value=True), \
                patch.object(owner, 'require_owner', return_value=identity), \
                patch.object(owner, 'local_workspace', return_value=self.root), \
                patch.object(checkpoint, 'mirror'), patch('agent_runtime.required_inputs'), \
                patch.object(runtime, 'contracts', return_value=[]), \
                patch.object(runtime, 'image_policy_inputs'):
            planned = runtime.plan('storyboard-critic', packet, 'phone_final', 'Inspect the exact timed phone.')
            self.assertFalse(planned['dispatch_ready'])
            self.assertEqual(packet_before, packet.read_bytes())
            ok, message = controller.reserve(self.state, {'storyboard_critics': 1},
                                              'final timed phone', review_packet=packet)
            self.assertTrue(ok, message)
            ready = runtime.plan('storyboard-critic', packet, 'phone_final', 'Inspect the exact timed phone.')
            self.assertTrue(ready['dispatch_ready'])
            self.assertTrue(Path(ready['reservation_claim']['path']).is_file())
            self.assertEqual(packet_before, packet.read_bytes())
            with self.assertRaisesRegex(ValueError, 'hard five-review'):
                runtime.plan('storyboard-critic', packet, 'phone_again', 'Repeat the exact timed phone.')

    def test_wrong_scope_foreign_state_and_stale_media_refuse_without_charge(self):
        packet, data = self.packet(); before = self.state.read_bytes()
        for key, value in [('phone_mode', 'comparison'), ('review_scope', 'code-plan'),
                           ('phone_state', str(self.root / 'other-state.json'))]:
            changed = copy.deepcopy(data); changed[key] = value
            packet.write_text(json.dumps(changed))
            self.assertFalse(controller.reserve(self.state, {'storyboard_critics': 1},
                                                'final phone', review_packet=packet)[0])
            self.assertEqual(before, self.state.read_bytes())
        packet.write_text(json.dumps(data))
        board = Path(data['board']['path']); board.write_text(board.read_text() + '\n')
        ok, message = controller.reserve(self.state, {'storyboard_critics': 1},
                                         'final phone', review_packet=packet)
        self.assertFalse(ok); self.assertIn('input changed', message)
        self.assertEqual(before, self.state.read_bytes())

    def test_normal_policy_rejects_unverified_owner_grants(self):
        data = limit.policy()
        data['owner_grants'] = [{'edition': '2026-10-24', 'extra_reviews': 1,
                                'authority': 'Unverified claimed owner instruction ' * 3}]
        path = self.root / 'policy.json'; path.write_text(json.dumps(data))
        before = self.state.read_bytes()
        with patch.object(limit, 'POLICY', path):
            with self.assertRaisesRegex(ValueError, 'hard five-review'):
                controller.reserve(self.state, {'storyboard_critics': 1}, 'extra review')
        self.assertEqual(before, self.state.read_bytes())


if __name__ == '__main__':
    unittest.main()
