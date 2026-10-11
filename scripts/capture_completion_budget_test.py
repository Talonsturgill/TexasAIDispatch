"""Real controller funding covers paired charges and retains original admission evidence."""
import copy
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import autonomous_completion as completion
import capture_completion_budget as footprint
import production_lifecycle as lifecycle
import run_controller as controller


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
