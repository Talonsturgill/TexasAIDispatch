"""Real controller funding covers paired charges and retains original admission evidence."""
import copy
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import autonomous_completion as completion
import capture_completion_budget as footprint
import production_lifecycle as lifecycle
import run_controller as controller


class ComparisonCompletionBudgetTest(unittest.TestCase):
    schema = footprint.COMPARISON_SCHEMA
    preflight_required = 5
    native_required = 1
    prepared = False

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.state = self.root / 'run_state.json'
        self.assertTrue(controller.initialise(self.state, '2026-10-11-test', 'production')[0])
        state = controller.read_state(self.state)
        for name in completion.resource_requirements(state):
            state['usage'][name] = state['resource_envelope'][name]
        state['usage']['preflight_renders'] -= 2
        state['usage']['full_renders'] -= 1
        controller.event(state, 'reserved', resources={k: state['usage'][k]
                         for k in completion.resource_requirements(state)}, note='offline charged history')
        controller.save(self.state, state)
        notes = (('two opening comparison batch',) if self.prepared else
                 ('capture authorization reservation for opening comparison', 'two opening comparison batch'))
        for note in notes:
            self.assertTrue(controller.reserve(self.state, {'preflight_renders': 1}, note)[0])
        if self.prepared:
            # The Claude prepared handoff charges once and then claims that same reservation.
            state = controller.read_state(self.state)
            controller.event(state, 'prepared_capture_claimed')
            controller.save(self.state, state)
        state = controller.read_state(self.state)
        entry = len(state['events']) - (2 if self.prepared else 1)
        options = []
        for key in ('a', 'b'):
            row = {'id': key}
            for kind, suffix in (('board', 'json'), ('film', 'mp4')):
                path = self.root / (key + '.' + suffix)
                path.write_bytes(('offline ' + key + kind + ' fixture').encode())
                row[kind] = {'file': path.name, 'sha256': footprint.hashlib.sha256(path.read_bytes()).hexdigest()}
            options.append(row)
        self.comparison = self.root / 'comparison.json'
        self.comparison.write_text(json.dumps({'schema': 'dispatch-opening-comparison/1',
            'inspection_pass': True, 'inspection_problems': [], 'options': options,
            'reservation': {'run_id': state['run_id'], 'event_index': entry,
                            'identity': state['events'][entry]['preflight_identity']}}) + '\n')
        self.assertTrue(controller.reserve(self.state, {'full_renders': 1}, 'full-resolution Dispatch render')[0])
        state = controller.read_state(self.state)
        film = footprint.sha('synthetic rejected film fixture')
        controller.event(state, 'deliverable_registered', film_sha256=film,
                         manifest_sha256=footprint.sha('manifest fixture'), review_only=False)
        controller.save(self.state, state)
        self.before = copy.deepcopy(state)
        finding = 'The end card credits a different music track from the mixed bed.'
        self.report = self.root / 'independent-rights.json'
        self.report.write_text(json.dumps({'verdict': 'revise', 'reviewer_identity': 'independent-opus',
            'film_sha256': film, 'blocking_defects': [finding],
            'technical_repair': {'findings': [{'finding': finding, 'category': 'rights'}]}}) + '\n')
        self.original = self.root / 'original-plan.json'
        self.original.write_text(json.dumps({'director_identity': 'sonnet-director',
            'repair_scope': 'technical-integrity', 'failed_film_sha256': film,
            'failure_evidence': str(self.report), 'failure_evidence_sha256': footprint.sha(self.report.read_text()),
            'resources': {'preflight_renders': 5, 'full_renders': 1},
            'repair': 'Correct the credit and renew the retained comparison on current bytes.'}) + '\n')
        self.plan_path = self.root / 'complete-path-plan.json'
        # Reproduce the original v2 producer for historical grant/replay coverage.
        with patch.object(footprint, 'CURRENT_COMPARISON_SCHEMA', self.schema):
            footprint.prepare_comparison(self.state, self.original, self.comparison, self.plan_path)
        self.plan = json.loads(self.plan_path.read_text())

    def test_complete_path_preserves_all_prior_charges_and_replays(self):
        original = self.original.read_bytes()
        accepted, message = completion.grant_capacity(self.state, self.plan_path)
        self.assertTrue(accepted, message)
        state = controller.read_state(self.state)
        row = state['events'][-1]
        budget = json.loads(row['precheck_json'])
        self.assertEqual(self.preflight_required, budget['resources']['preflight_renders']['required'])
        self.assertEqual(4, budget['resources']['storyboard_critics']['required'])
        self.assertEqual(self.native_required, budget['resources']['full_renders']['required'])
        self.assertEqual(state['usage'], self.before['usage'])
        self.assertEqual(state['resource_envelope'], self.before['resource_envelope'])
        self.assertEqual(state['events'][:len(self.before['events'])], self.before['events'])
        self.assertEqual(original, self.original.read_bytes())
        self.assertEqual([], completion.replay(state)[1])
        self.assertEqual([], lifecycle.allowance_problems(state))
        self.assertTrue(row['grants_no_review_approval'])
        self.assertIsNone(state['terminal_state'])

    def test_old_plan_requirements_are_unchanged(self):
        required = completion.resource_requirements(self.before)
        self.assertEqual(required, footprint.required_counts(self.before, {}, required))

    def test_changed_option_film_refuses_admission(self):
        (self.root / 'a.mp4').write_bytes(b'changed offline fixture')
        accepted, message = completion.grant_capacity(self.state, self.plan_path)
        self.assertFalse(accepted)
        self.assertIn('changed', message)
        self.assertEqual(self.before['usage'], controller.read_state(self.state)['usage'])

    def test_wrong_pair_or_third_treatment_is_ineligible(self):
        for mutation in ('pair', 'options'):
            plan = copy.deepcopy(self.plan)
            proof = plan[footprint.FIELD]
            if mutation == 'pair':
                proof['hook_event_index'] = proof['entry_event_index']
            else:
                receipt = json.loads(proof['comparison_json'])
                receipt['options'].append(copy.deepcopy(receipt['options'][0]))
                proof['comparison_json'] = json.dumps(receipt)
                proof['comparison_sha256'] = footprint.sha(proof['comparison_json'])
            self.assertFalse(footprint.eligible(self.before, plan))

    def test_mutated_policy_refuses_and_no_budget_is_added(self):
        plan = copy.deepcopy(self.plan)
        plan[footprint.FIELD]['policy_json'] += ' '
        self.assertFalse(footprint.eligible(self.before, plan))
        self.assertEqual(self.before, controller.read_state(self.state))

    def test_actual_controller_cli_uses_complete_path(self):
        result = subprocess.run([sys.executable, str(footprint.REPO / 'scripts/run_controller.py'),
            '--state', str(self.state), 'completion-capacity', '--repair-plan', str(self.plan_path)],
            capture_output=True, text=True)
        self.assertEqual(0, result.returncode, result.stdout + result.stderr)
        state = controller.read_state(self.state)
        budget = json.loads(state['events'][-1]['precheck_json'])
        self.assertEqual(self.preflight_required, budget['resources']['preflight_renders']['required'])
        self.assertEqual([], completion.replay(state)[1])

    def test_optional_polish_cannot_prepare_capacity(self):
        report = json.loads(self.report.read_text())
        report['technical_repair']['findings'][0]['category'] = 'artistic-preference'
        self.report.write_text(json.dumps(report))
        plan = json.loads(self.original.read_text())
        plan['failure_evidence_sha256'] = footprint.sha(self.report.read_text())
        self.original.write_text(json.dumps(plan))
        with self.assertRaises(ValueError):
            footprint.prepare_comparison(self.state, self.original, self.comparison, self.root / 'optional.json')
        self.assertEqual(self.before, controller.read_state(self.state))


class PreparedFlowComparisonBudgetTest(ComparisonCompletionBudgetTest):
    """The Claude prepared handoff has no separate hook charge; the batch entry is its own hook."""
    schema = footprint.PHONE_COMPARISON_SCHEMA
    preflight_required = 8
    native_required = 2
    prepared = True

    def test_wrong_pair_or_third_treatment_is_ineligible(self):
        plan = copy.deepcopy(self.plan)
        plan[footprint.FIELD]['hook_event_index'] = plan[footprint.FIELD]['entry_event_index'] - 1
        self.assertFalse(footprint.eligible(self.before, plan))
        plan = copy.deepcopy(self.plan)
        proof = plan[footprint.FIELD]
        receipt = json.loads(proof['comparison_json'])
        receipt['options'].append(copy.deepcopy(receipt['options'][0]))
        proof['comparison_json'] = json.dumps(receipt)
        proof['comparison_sha256'] = footprint.sha(proof['comparison_json'])
        self.assertFalse(footprint.eligible(self.before, plan))

    def test_unclaimed_single_entry_is_not_a_prepared_hook(self):
        state = copy.deepcopy(self.before)
        entry = self.plan[footprint.FIELD]['entry_event_index']
        state['events'][entry + 1] = {**state['events'][entry + 1], 'kind': 'other'}
        self.assertFalse(footprint.eligible(state, self.plan))

    def test_prepared_entry_funds_the_complete_path(self):
        proof = self.plan[footprint.FIELD]
        self.assertEqual(proof['hook_event_index'], proof['entry_event_index'])
        self.assertTrue(footprint.comparison_eligible(controller.read_state(self.state), self.plan))
        accepted, message = completion.grant_capacity(self.state, self.plan_path)
        self.assertTrue(accepted, message)


class CompletePhoneComparisonBudgetTest(ComparisonCompletionBudgetTest):
    schema = footprint.PHONE_COMPARISON_SCHEMA
    preflight_required = 8
    native_required = 2

    def test_default_producer_uses_new_policy_and_preserves_old_policy_bytes(self):
        old = footprint.COMPARISON_POLICY.read_bytes()
        output = self.root / 'new-default-plan.json'
        footprint.prepare_comparison(self.state, self.original, self.comparison, output)
        proof = json.loads(output.read_text())[footprint.FIELD]
        self.assertEqual(self.schema, proof['schema'])
        policy = json.loads(proof['policy_json'])
        self.assertEqual(8, sum(policy['preflight_operators'].values()))
        self.assertEqual(2, policy['native_render_hook_and_entry'])
        self.assertEqual(old, footprint.COMPARISON_POLICY.read_bytes())
        self.assertEqual(self.before, controller.read_state(self.state))

    def test_both_routes_cover_every_pending_operator(self):
        for route in ('host', 'provider'):
            result = subprocess.run([sys.executable, str(footprint.REPO / 'scripts/run_controller.py'),
                '--state', str(self.state), 'production-budget', '--review-route', route,
                '--repair-plan', str(self.plan_path)], capture_output=True, text=True)
            self.assertEqual(1, result.returncode, result.stdout + result.stderr)
            budget = json.loads(result.stdout)
            self.assertEqual(8, budget['resources']['preflight_renders']['required'])
            self.assertEqual(2, budget['resources']['full_renders']['required'])

    def test_old_policy_cannot_be_claimed_as_new_evidence(self):
        plan = copy.deepcopy(self.plan)
        proof = plan[footprint.FIELD]
        proof.update(policy_json=footprint.COMPARISON_POLICY.read_text(),
                     policy_sha256=footprint.COMPARISON_POLICY_SHA256)
        self.assertFalse(footprint.eligible(self.before, plan))
        self.assertEqual(self.before, controller.read_state(self.state))


class CaptureCompletionBudgetTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.state = self.root / 'run_state.json'
        self.assertTrue(controller.initialise(self.state, '2026-10-09-test', 'production')[0])
        state = controller.read_state(self.state)
        for name in completion.resource_requirements(state):
            state['usage'][name] = state['resource_envelope'][name]
        state['usage']['full_renders'] -= 2
        controller.event(state, 'reserved', resources={k: state['usage'][k]
                         for k in completion.resource_requirements(state)}, note='offline charged history')
        controller.save(self.state, state)
        self.assertTrue(controller.reserve(self.state, {'full_renders': 1}, 'native hook precharge')[0])
        hook = controller.read_state(self.state)['events'][-1]
        self.assertTrue(controller.reserve(self.state, {'full_renders': 1}, 'full-resolution Dispatch render')[0])
        state = controller.read_state(self.state)
        entry = state['events'][-1]
        self.film = footprint.sha('synthetic native film fixture')
        controller.event(state, 'deliverable_registered', film_sha256=self.film,
                         manifest_sha256=footprint.sha('synthetic manifest fixture'), review_only=False)
        controller.save(self.state, state)
        self.before = copy.deepcopy(state)
        command = 'bash scripts/run_with_env.sh bash scripts/render_dispatch.sh'
        self.auth = self.root / 'spent-authorization.json'
        self.auth.write_text(json.dumps({'schema': 'dispatch_capture_authorization/2', 'allowed': True,
            'render_reservation': {'resource': 'full_renders', 'at': hook['at'],
                'event_sha256': footprint.sha(footprint.canonical(hook))},
            'commands': [{'id': footprint.sha(command), 'text': command, 'consumed': entry['at']}],
            'headroom': {'passed': True, 'free_gib': 20, 'required_free_gib': 17},
            'housekeeping': {'exit_code': 0}, 'art_receipts_recorded': True}) + '\n')
        finding = {'criterion': 'rights', 'problem': 'The native ending omits the required CC BY music credit.'}
        self.report = self.root / 'independent-rights.json'
        self.report.write_text(json.dumps({'verdict': 'revise', 'reviewer_identity': 'independent-opus',
            'film_sha256': self.film, 'blocking_defects': [finding],
            'technical_repair': {'findings': [{'finding': finding, 'category': 'rights'}]}}) + '\n')
        self.original = self.root / 'original-plan.json'
        self.original.write_text(json.dumps({'director_identity': 'sonnet-director',
            'repair_scope': 'technical-integrity', 'failed_film_sha256': self.film,
            'failure_evidence': str(self.report), 'failure_evidence_sha256': footprint.sha(self.report.read_text()),
            'resources': {'reboards': 1, 'preflight_renders': 6, 'full_renders': 2},
            'repair': 'Add the source-generated attribution to the existing closing card.'}) + '\n')
        self.plan_path = self.root / 'funded-footprint-plan.json'
        self.original_bytes = self.original.read_bytes()
        self.report_bytes = self.report.read_bytes()
        footprint.prepare(self.state, self.original, self.auth, self.plan_path)
        self.plan = json.loads(self.plan_path.read_text())

    def grant(self):
        accepted, message = completion.grant_capacity(self.state, self.plan_path)
        self.assertTrue(accepted, message)
        return controller.read_state(self.state)

    def test_full_remaining_path_and_original_evidence_preserved(self):
        state = self.grant()
        row = state['events'][-1]
        budget = json.loads(row['precheck_json'])
        self.assertEqual(budget['resources']['preflight_renders']['required'], 6)
        self.assertEqual(budget['resources']['full_renders']['required'], 2)
        for name in ('audiovisual_reviews', 'scorer_calls', 'panel_rounds', 'tts_calls', 'storyboard_critics'):
            self.assertEqual(budget['resources'][name]['required'], completion.resource_requirements(state)[name])
        self.assertEqual(row['reason'], 'retained-integrity')
        self.assertTrue(row['grants_no_review_approval'])
        self.assertEqual(state['usage'], self.before['usage'])
        self.assertEqual(state['resource_envelope'], self.before['resource_envelope'])
        self.assertEqual(state['events'][:len(self.before['events'])], self.before['events'])
        self.assertEqual(self.report.read_bytes(), self.report_bytes)
        self.assertEqual(self.original.read_bytes(), self.original_bytes)
        self.assertEqual(completion.replay(state)[1], [])
        self.assertEqual(lifecycle.allowance_problems(state), [])
        self.assertIsNone(state['terminal_state'])

    def test_real_controller_cli_reports_same_exact_native_deficits(self):
        result = subprocess.run([sys.executable, str(footprint.REPO / 'scripts/run_controller.py'),
            '--state', str(self.state), 'production-budget', '--repair-plan', str(self.plan_path)],
            capture_output=True, text=True)
        self.assertEqual(result.returncode, 1, result.stderr)
        budget = json.loads(result.stdout)
        self.assertEqual(budget['deficits']['preflight_renders'], 6)
        self.assertEqual(budget['deficits']['full_renders'], 2)
        self.assertEqual(budget['capture_charging'], 'hook-and-entry')

    def test_existing_unflagged_grants_keep_original_requirement(self):
        accepted, message = completion.grant_capacity(self.state, self.original)
        self.assertTrue(accepted, message)
        state = controller.read_state(self.state)
        row = state['events'][-1]
        self.assertEqual(json.loads(row['precheck_json'])['resources']['preflight_renders']['required'], 3)
        self.assertEqual(json.loads(row['precheck_json'])['resources']['full_renders']['required'], 1)
        self.assertEqual(completion.replay(state)[1], [])
        before = self.state.read_bytes()
        self.assertFalse(completion.grant_capacity(self.state, self.plan_path)[0])
        self.assertEqual(self.state.read_bytes(), before)

    def test_changed_policy_authorization_or_source_pair_refused(self):
        for key in ('policy_sha256', 'authorization_sha256', 'entry_event_sha256'):
            plan = copy.deepcopy(self.plan); plan[footprint.FIELD][key] = '0' * 64
            self.plan_path.write_text(json.dumps(plan))
            before = self.state.read_bytes()
            self.assertFalse(completion.grant_capacity(self.state, self.plan_path)[0], key)
            self.assertEqual(self.state.read_bytes(), before)
        self.plan_path.write_text(json.dumps(self.plan))
        self.auth.write_text(self.auth.read_text() + ' ')
        self.assertFalse(completion.grant_capacity(self.state, self.plan_path)[0])

    def test_unconsumed_or_unrelated_native_capture_refused(self):
        for field, value in [('consumed', False), ('text', 'bash scripts/run_with_env.sh python unrelated.py')]:
            plan = copy.deepcopy(self.plan)
            auth = json.loads(plan[footprint.FIELD]['authorization_json'])
            auth['commands'][0][field] = value
            raw = json.dumps(auth)
            plan[footprint.FIELD].update(authorization_json=raw, authorization_sha256=footprint.sha(raw))
            self.assertFalse(footprint.eligible(self.before, plan))
        altered = copy.deepcopy(self.before)
        index = self.plan[footprint.FIELD]['entry_event_index']
        altered['events'][index]['resources']['full_renders'] = 2
        self.assertFalse(footprint.eligible(altered, self.plan))

    def test_no_optional_self_review_historical_or_terminal_admission(self):
        for key, value in [('run_id', '2026-10-08'), ('mode', 'lab'), ('terminal_state', 'shipped')]:
            altered = copy.deepcopy(self.before); altered[key] = value
            self.assertFalse(footprint.eligible(altered, self.plan))
        report = json.loads(self.report.read_text()); report['reviewer_identity'] = 'sonnet-director'
        self.report.write_text(json.dumps(report))
        plan = copy.deepcopy(self.plan); plan['failure_evidence_sha256'] = footprint.sha(self.report.read_text())
        self.plan_path.write_text(json.dumps(plan))
        self.assertFalse(completion.grant_capacity(self.state, self.plan_path)[0])

    def test_independent_report_cannot_name_another_film(self):
        report = json.loads(self.report.read_text()); report['film_sha256'] = 'f' * 64
        self.report.write_text(json.dumps(report))
        plan = copy.deepcopy(self.plan); plan['failure_evidence_sha256'] = footprint.sha(self.report.read_text())
        self.plan_path.write_text(json.dumps(plan))
        self.assertFalse(completion.grant_capacity(self.state, self.plan_path)[0])

    def test_summarized_classification_cannot_reuse_a_passing_phone_budget(self):
        report = json.loads(self.report.read_text())
        report['technical_repair']['findings'][0]['finding']['problem'] = 'Shortened attribution summary.'
        self.report.write_text(json.dumps(report))
        plan = copy.deepcopy(self.plan); plan['failure_evidence_sha256'] = footprint.sha(self.report.read_text())
        self.plan_path.write_text(json.dumps(plan))
        result = subprocess.run([sys.executable, str(footprint.REPO / 'scripts/run_controller.py'),
            '--state', str(self.state), 'production-budget', '--repair-plan', str(self.plan_path)],
            capture_output=True, text=True)
        self.assertEqual(result.returncode, 1, result.stderr)
        budget = json.loads(result.stdout)
        self.assertEqual(budget['resources'], {})
        self.assertEqual(budget['path'], 'technical-diagnosis-required')
        self.assertFalse(completion.grant_capacity(self.state, self.plan_path)[0])

    def test_duplicate_grant_and_later_shipped_replay(self):
        state = self.grant()
        before = self.state.read_bytes()
        plan = copy.deepcopy(self.plan); plan['repair'] += ' Renamed description.'
        self.plan_path.write_text(json.dumps(plan))
        self.assertFalse(completion.grant_capacity(self.state, self.plan_path)[0])
        self.assertEqual(self.state.read_bytes(), before)
        state['terminal_state'] = 'shipped'
        self.assertEqual(completion.replay(state)[1], [])
        row = state['events'][-1]
        budget = json.loads(row['precheck_json']); budget['resources']['preflight_renders']['required'] += 1
        row['precheck_json'] = completion.canonical(budget); row['precheck_sha256'] = completion.sha(row['precheck_json'])
        self.assertTrue(completion.replay(state)[1])

    def test_prepare_is_read_only_exclusive_and_cannot_stack_footprints(self):
        self.assertEqual(controller.read_state(self.state), self.before)
        with self.assertRaises(FileExistsError):
            footprint.prepare(self.state, self.original, self.auth, self.plan_path)
        with self.assertRaises(ValueError):
            footprint.prepare(self.state, self.plan_path, self.auth, self.root / 'second.json')


if __name__ == '__main__':
    unittest.main()
