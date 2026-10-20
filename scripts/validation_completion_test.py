"""A mandatory script pivot funds fresh validation without replaying an old PASS."""
import copy
import contextlib
import hashlib
import io
import json
import shutil
import tempfile
import unittest
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

import autonomous_completion as capacity
import claude_checkpoint as checkpoint
import narration_recovery
import production_lifecycle as lifecycle
import run_controller as controller
import validation_completion as source
import capture_completion_budget as capture_budget


class SourceCompletionTest(unittest.TestCase):
    def fixture(self, drained=True, comparison=False):
        tmp = tempfile.TemporaryDirectory(); self.addCleanup(tmp.cleanup)
        self.repo = Path(tmp.name); self.root = self.repo / 'out/dispatch'; self.root.mkdir(parents=True)
        self.state = self.root / 'run_state.json'
        self.addCleanup(patch.stopall)
        patch.object(source, 'REPO', self.repo).start()
        self.script = self.root / 'vo_script.txt'; self.script.write_text('A long source-backed sentence needs a measured split.\n')
        self.baseline = self.root / 'before.txt'; self.baseline.write_bytes(self.script.read_bytes())
        self.proposed = self.root / 'proposed.txt'; self.proposed.write_text('A source-backed sentence. A measured split.\n')
        self.claims = self.root / 'claims.json'; self.claims.write_text(json.dumps({'claims': [{'id': 'c1', 'verdict': 'VERIFIED'}]}))
        (self.root / 'storyboard.json').write_text('{"date":"2026-10-15"}')
        def frozen(_):
            return {'files': {str(p.relative_to(self.repo)): source.digest(p)
                              for p in (self.script, self.claims, self.root / 'storyboard.json')},
                    'renderer_sha256': 'a' * 64}
        patch.object(narration_recovery, 'frozen', frozen).start()
        self.assertTrue(controller.initialise(self.state, '2026-10-15', 'production')[0])
        state = controller.read_state(self.state)
        if drained:
            for name in (*capacity.resource_requirements(state), 'validator_agents'):
                state['usage'][name] = state['resource_envelope'][name]
            state['usage']['storyboard_critics'] -= 1
            if comparison:
                state['usage']['preflight_renders'] -= 2
            controller.event(state, 'reserved', resources=dict(state['usage']), note='offline fixture of earlier charged work')
            controller.save(self.state, state)
        if comparison:
            for key in ('a', 'b'):
                (self.root / ('opening-' + key + '.json')).write_text(json.dumps({'date': '2026-10-15', 'variant': key}))
            for note in ('capture authorization reservation for opening comparison', 'two opening comparison batch'):
                self.assertTrue(controller.reserve(self.state, {'preflight_renders': 1}, note)[0])
            state = controller.read_state(self.state)
            options = []
            for key in ('a', 'b'):
                row = {'id': key}
                for kind, suffix in (('board', 'json'), ('film', 'mp4')):
                    path = self.root / (key + '.' + suffix)
                    path.write_bytes(('offline ' + key + kind + ' fixture').encode())
                    row[kind] = {'file': path.name, 'sha256': source.digest(path)}
                options.append(row)
            self.comparison = self.root / 'comparison.json'
            self.comparison.write_text(json.dumps({'schema': 'dispatch-opening-comparison/1',
                'inspection_pass': True, 'inspection_problems': [], 'options': options,
                'reservation': {'run_id': state['run_id'], 'event_index': len(state['events']) - 1,
                    'identity': state['events'][-1]['preflight_identity']}}))
        self.assertTrue(controller.reserve(self.state, {'storyboard_critics': 1}, 'offline independent source-pivot fixture')[0])
        state = controller.read_state(self.state)
        index = len(state['events']) - 1
        stamp = (datetime.now(timezone.utc) - timedelta(seconds=5)).isoformat()
        state['events'][index]['at'] = stamp
        controller.save(self.state, state)
        finding = {'id': 'caption', 'problem': 'The measured cue exceeds the phone caption band.'}
        report = {'verdict': 'revise', 'reviewer_identity': 'offline independent critic',
                  'blocking_defects': [finding], 'technical_repair': {'findings': [{'finding': finding, 'category': 'captions'}]},
                  'observations': [{'category': 'other', 'observed': 'An earlier heuristic did not replace strict alignment.'}],
                  'source_pivot': {'requires_validation': True, 'script_before_sha256': source.digest(self.script),
                                   'proposed_script_sha256': source.digest(self.proposed), 'claim_ids': ['c1'],
                                   'source_basis': 'The same verified primary claim supports these shorter source-backed sentences.'}}
        self.report = self.root / 'independent.json'; self.report.write_text(json.dumps(report))
        receipt = {'schema': 'dispatch_source_pivot_review/1', 'run_id': state['run_id'], 'role': 'source-pivot',
                   'status': 'completed', 'provider_unavailable': False, 'model': 'claude-opus-5-5', 'effort': 'high',
                   'agent_id': 'offline-critic', 'reviewer_identity': report['reviewer_identity'],
                   'reservation_event_index': index, 'reservation_sha256': hashlib.sha256(source.canonical(state['events'][index]).encode()).hexdigest(),
                   'started_at': stamp, 'completed_at': stamp, 'report_sha256': source.digest(self.report)}
        receipt.update(raw_response_path='out/dispatch/evidence/source-pivot/handback-full.txt',
                       transcript_path='out/dispatch/evidence/source-pivot/agent-transcript-cumulative.jsonl',
                       note='Accounting of the completed fixture call only.')
        self.receipt = self.root / 'review-call.json'; self.receipt.write_text(json.dumps(receipt))
        self.plan = self.root / 'plan.json'
        self.plan.write_text(json.dumps({'repair_scope': 'technical-integrity', 'director_identity': 'offline director',
            'mechanism_id': 'short-source-sentences', 'failure_family': 'unclassified',
            'root_cause': 'The measured long cue cannot fit the required phone caption band.',
            'repair': 'Use the independently proposed shorter source-backed sentences and revalidate them.',
            'mechanism_change': 'Measured sentence gaps replace the unreliable directed internal beats.',
            'expected_visible_result': 'Every caption uses a readable complete phrase and a measured edge.',
            'failure_evidence': str(self.report), 'failure_evidence_sha256': source.digest(self.report),
            'resources': {'validator_agents': 1, 'tts_calls': 2},
            'changed_inputs': [{'path': str(self.script), 'before_path': str(self.baseline), 'before_sha256': source.digest(self.baseline)}]}))
        self.bound = self.root / 'bound.json'
        source.prepare(self.state, self.plan, self.receipt, self.proposed, self.bound)

    def test_exact_deficits_no_approval_and_real_fresh_validator_required(self):
        self.fixture()
        before = controller.read_state(self.state)
        ok, message = capacity.grant_capacity(self.state, self.bound)
        self.assertTrue(ok, message)
        state = controller.read_state(self.state)
        grant = state['events'][-1]
        self.assertEqual(grant['resource_increments']['validator_agents'], 1)
        self.assertEqual(grant['resource_increments']['tts_calls'], 2)
        self.assertEqual(grant['resource_increments']['storyboard_critics'], 4)
        self.assertEqual(state['resource_envelope'], before['resource_envelope'])
        self.assertEqual(state['usage'], before['usage'])
        self.assertEqual(state['events'][:len(before['events'])], before['events'])
        self.assertEqual(lifecycle.allowance_problems(state), [])
        self.assertFalse(controller.reserve(self.state, {'tts_calls': 1})[0])
        ok, message = lifecycle.begin_repair(self.state, self.bound)
        self.assertTrue(ok, message)
        self.assertTrue(controller.reserve(self.state, {'reboards': 1}, 'registered script correction fixture')[0])
        self.script.write_text('A corrected source sentence. A measured split.\n')
        plan = json.loads(self.bound.read_text())
        plan['changed_inputs'][0]['after_sha256'] = source.digest(self.script)
        self.bound.write_text(json.dumps(plan))
        ok, message = lifecycle.authorize_repair(self.state, self.bound)
        self.assertTrue(ok, message)
        self.assertTrue(controller.reserve(self.state, {'validator_agents': 1}, 'fresh source validation fixture')[0])
        state = controller.read_state(self.state); index = len(state['events']) - 1; event = state['events'][index]
        report = {'result': 'PASS', 'date': '2026-10-15', 'reviewer_identity': 'offline source validator',
                  'source': 'offline independently verified primary fixture',
                  'rejected': ['No submitted source claim required rejection.'],
                  'required_edits_applied': ['The exact shorter script was independently checked.'],
                  'script_sha256': source.digest(self.script), 'claims_sha256': source.digest(self.claims), 'verified_claim_ids': ['c1']}
        (self.root / 'validation.json').write_text(json.dumps(report))
        receipt = {'schema': 'dispatch_precharged_source_validation/1', 'run_id': state['run_id'], 'role': 'validator',
                   'status': 'completed', 'provider_unavailable': False, 'model': 'claude-opus-5-5', 'effort': 'high',
                   'agent_id': 'offline-validator', 'reviewer_identity': report['reviewer_identity'],
                   'reservation_event_index': index, 'reservation_sha256': hashlib.sha256(source.canonical(event).encode()).hexdigest(),
                   'report_sha256': source.digest(self.root / 'validation.json'), 'script_sha256': source.digest(self.script),
                   'claims_sha256': source.digest(self.claims), 'started_at': event['at'], 'completed_at': event['at']}
        target = self.root / 'source-validation-call.json'; target.write_text(json.dumps(receipt))
        self.assertEqual(source.source_validation_problems(state, self.root), [])
        for field, value in [('model', 'claude-haiku-5-5'), ('reservation_event_index', 0), ('script_sha256', '0' * 64), ('role', 'critic')]:
            bad = {**receipt, field: value}; target.write_text(json.dumps(bad))
            self.assertTrue(source.source_validation_problems(state, self.root), field)
        target.write_text(json.dumps(receipt))
        source.certificate(self.root)
        archive = self.repo / 'runs/2026-10-15'; archive.mkdir(parents=True)
        for name in ('source-validation-certificate.json', 'validation.json', 'vo_script.txt', 'claims.json'):
            shutil.copy2(self.root / name, archive / name)
        public = checkpoint.public_ledger(state, self.repo)
        self.assertEqual(source.source_validation_problems(public, archive), [])
        self.assertNotIn(str(self.repo), (archive / 'source-validation-certificate.json').read_text())
        self.assertTrue(controller.reserve(self.state, {'tts_calls': 1})[0])
        self.script.write_text('A later unreviewed script.')
        self.assertTrue(source.source_validation_problems(controller.read_state(self.state), self.root))

    def test_zero_deficit_still_records_requirement_and_survives_projection(self):
        self.fixture(drained=False)
        ok, message = capacity.grant_capacity(self.state, self.bound)
        self.assertTrue(ok, message)
        state = controller.read_state(self.state)
        self.assertEqual(state['events'][-1]['kind'], source.READY)
        self.assertEqual(state['events'][-1]['resource_increments'], {})
        self.assertTrue(source.source_validation_problems(state, self.root))
        portable, origins = checkpoint.public_projection(state, self.repo)
        restored = checkpoint.restored_ledger(portable, Path('/offline/restored-checkout'), {'repo_root': str(self.repo), 'grant_origin_roots': origins})
        self.assertEqual(lifecycle.allowance_problems(restored), [])
        self.assertEqual(restored['usage'], state['usage'])
        self.assertFalse(capacity.grant_capacity(self.state, self.bound)[0])

    def test_admission_rejects_false_or_uncharged_provenance(self):
        self.fixture()
        state = controller.read_state(self.state); plan = json.loads(self.bound.read_text()); report = json.loads(self.report.read_text())
        for key, value in [('model', 'claude-sonnet-5-5'), ('reservation_event_index', 0), ('report_sha256', '0' * 64), ('reviewer_identity', 'offline director')]:
            bad = copy.deepcopy(plan); receipt = json.loads(bad[source.FIELD]['receipt_json']); receipt[key] = value
            text = json.dumps(receipt); bad[source.FIELD]['receipt_json'] = text; bad[source.FIELD]['receipt_sha256'] = hashlib.sha256(text.encode()).hexdigest()
            self.assertFalse(source.eligible(state, bad, report), key)
        bad = copy.deepcopy(plan); bad['resources']['validator_agents'] = 2
        self.assertFalse(source.eligible(state, bad, report))
        bad_report = copy.deepcopy(report); bad_report['source_pivot']['requires_validation'] = False
        self.assertFalse(source.eligible(state, plan, bad_report))
        bad = copy.deepcopy(plan); bad.pop(source.FIELD)
        self.assertIsNone(capacity.mandatory_reason(state, bad, self.report.read_text()))

    def test_changed_proposal_or_original_inputs_refuse_grant_without_writes(self):
        self.fixture()
        before = self.state.read_bytes()
        self.proposed.write_text('Unreviewed replacement proposal.')
        self.assertFalse(capacity.grant_capacity(self.state, self.bound)[0])
        self.assertEqual(self.state.read_bytes(), before)

    def test_original_policy_grants_replay_unchanged_before_new_amendment(self):
        self.fixture()
        legacy = json.loads(self.plan.read_text()); legacy['resources'].pop('validator_agents')
        old = self.root / 'legacy-plan.json'; old.write_text(json.dumps(legacy))
        self.assertTrue(capacity.grant_capacity(self.state, old)[0])
        history = controller.read_state(self.state)['events']
        self.assertTrue(controller.reserve(self.state, {'storyboard_critics': 1}, 'second independent source-pivot fixture')[0])
        state = controller.read_state(self.state); index = len(state['events']) - 1
        report = json.loads(self.report.read_text())
        report['source_pivot']['source_basis'] += ' A fresh independent follow-up assesses the proposed source correction.'
        new_report = self.root / 'followup.json'; new_report.write_text(json.dumps(report))
        receipt = json.loads(self.receipt.read_text())
        receipt.update(reservation_event_index=index, reservation_sha256=hashlib.sha256(source.canonical(state['events'][index]).encode()).hexdigest(),
                       report_sha256=source.digest(new_report), started_at=state['events'][index]['at'], completed_at=state['events'][index]['at'])
        new_receipt = self.root / 'followup-call.json'; new_receipt.write_text(json.dumps(receipt))
        plan = json.loads(self.plan.read_text()); plan.update(failure_evidence=str(new_report), failure_evidence_sha256=source.digest(new_report))
        new_plan = self.root / 'followup-plan.json'; new_plan.write_text(json.dumps(plan))
        bound = self.root / 'followup-bound.json'; source.prepare(self.state, new_plan, new_receipt, self.proposed, bound)
        ok, message = capacity.grant_capacity(self.state, bound)
        self.assertTrue(ok, message)
        state = controller.read_state(self.state)
        self.assertEqual(state['events'][:len(history)], history)
        self.assertEqual(lifecycle.allowance_problems(state), [])

    def test_renamed_report_cannot_reuse_the_same_paid_review(self):
        self.fixture(); self.assertTrue(capacity.grant_capacity(self.state, self.bound)[0])
        plan = json.loads(self.bound.read_text()); report = json.loads(self.report.read_text())
        report['source_pivot']['source_basis'] += ' Cosmetic new wording.'
        target = self.root / 'renamed-report.json'; target.write_text(json.dumps(report))
        plan.update(failure_evidence=str(target), failure_evidence_sha256=source.digest(target))
        receipt = json.loads(plan[source.FIELD]['receipt_json']); receipt['report_sha256'] = source.digest(target)
        text = json.dumps(receipt); plan[source.FIELD]['receipt_json'] = text
        plan[source.FIELD]['receipt_sha256'] = hashlib.sha256(text.encode()).hexdigest()
        target = self.root / 'renamed-plan.json'; target.write_text(json.dumps(plan))
        before = self.state.read_bytes()
        self.assertFalse(capacity.grant_capacity(self.state, target)[0])
        self.assertEqual(self.state.read_bytes(), before)

    def test_other_blocking_classification_is_not_waived(self):
        self.fixture()
        state = controller.read_state(self.state); plan = json.loads(self.bound.read_text()); report = json.loads(self.report.read_text())
        report['technical_repair']['findings'][0]['category'] = 'other'
        text = json.dumps(report); plan['failure_evidence_sha256'] = hashlib.sha256(text.encode()).hexdigest()
        receipt = json.loads(plan[source.FIELD]['receipt_json']); receipt['report_sha256'] = plan['failure_evidence_sha256']
        raw = json.dumps(receipt); plan[source.FIELD]['receipt_json'] = raw; plan[source.FIELD]['receipt_sha256'] = hashlib.sha256(raw.encode()).hexdigest()
        self.assertIsNone(capacity.mandatory_reason(state, plan, text))

    def test_mixed_source_pivot_keeps_standard_accounting_and_all_rejections(self):
        self.fixture(comparison=True)
        plan = json.loads(self.bound.read_text()); plan['repair_scope'] = 'standard'
        report = json.loads(self.report.read_text())
        artistic = {'id': 'framing', 'criterion': 'shot variety', 'problem': 'The proposed cut repeats identical framing.'}
        report['blocking_defects'].append(artistic)
        target = self.root / 'mixed-report.json'; target.write_text(json.dumps(report))
        plan.update(failure_evidence=str(target), failure_evidence_sha256=source.digest(target))
        receipt = json.loads(plan[source.FIELD]['receipt_json']); receipt['report_sha256'] = source.digest(target)
        raw = json.dumps(receipt); plan[source.FIELD]['receipt_json'] = raw; plan[source.FIELD]['receipt_sha256'] = hashlib.sha256(raw.encode()).hexdigest()
        call = self.root / 'mixed-call.json'; call.write_text(raw); plan[source.FIELD]['receipt_file'] = str(call)
        bound = self.root / 'mixed-plan.json'; bound.write_text(json.dumps(plan))
        source_bound = self.root / 'prepared-mixed-source-plan.json'
        source.prepare(self.state, bound, call, self.proposed, source_bound)
        bound = source_bound
        original_state = controller.read_state(self.state)
        original_script = self.script.read_bytes(); original_plan = bound.read_bytes()
        complete = self.root / 'complete-source-comparison-plan.json'
        capture_budget.prepare_comparison(self.state, bound, self.comparison, complete)
        self.assertEqual(original_state, controller.read_state(self.state))
        self.assertEqual(original_plan, bound.read_bytes())
        precheck = io.StringIO()
        with patch.object(sys, 'argv', ['run_controller.py', '--state', str(self.state),
                'production-budget', '--review-route', 'host', '--repair-plan', str(complete)]), contextlib.redirect_stdout(precheck):
            self.assertEqual(1, controller.main(), precheck.getvalue())
        self.assertEqual(1, json.loads(precheck.getvalue())['deficits']['validator_agents'])
        self.assertEqual(original_state, controller.read_state(self.state))
        ok, message = capacity.grant_capacity(self.state, complete)
        self.assertTrue(ok, message)
        state = controller.read_state(self.state)
        self.assertEqual(state['events'][-1]['reason'], source.REASON)
        self.assertEqual(json.loads(state['events'][-1]['plan_json'])['repair_scope'], 'standard')
        self.assertEqual(json.loads(state['events'][-1]['failure_evidence_json'])['blocking_defects'][-1], artistic)
        self.assertEqual(json.loads(state['events'][-1]['failure_evidence_json'])['verdict'], 'revise')
        self.assertFalse(controller.reserve(self.state, {'tts_calls': 1})[0])
        self.assertEqual(lifecycle.allowance_problems(state), [])
        self.assertEqual(original_script, self.script.read_bytes())
        self.assertEqual(original_state['usage'], state['usage'])
        budget = json.loads(state['events'][-1]['precheck_json'])
        for name, count in {'validator_agents': 1, 'storyboard_critics': 4, 'tts_calls': 2,
                            'preflight_renders': 8, 'audiovisual_reviews': 11, 'full_renders': 2,
                            'panel_rounds': 1, 'scorer_calls': 3}.items():
            self.assertEqual(count, budget['resources'][name]['required'], name)
        output = io.StringIO()
        with patch.object(sys, 'argv', ['run_controller.py', '--state', str(self.state),
                'production-budget', '--review-route', 'host', '--repair-plan', str(complete)]), contextlib.redirect_stdout(output):
            self.assertEqual(0, controller.main(), output.getvalue())
        self.assertTrue(json.loads(output.getvalue())['feasible'])


    def test_progress_boundary_keeps_real_precharged_source_pivot_reachable(self):
        import completion_progress as progress
        self.fixture()
        plan = json.loads(self.plan.read_text()); plan['repair_scope'] = 'standard'
        self.plan.write_text(json.dumps(plan))
        output = self.root / 'progress-source-plan.json'
        prepared = source.prepare(self.state, self.plan, self.receipt, self.proposed, output)
        state = controller.read_state(self.state)
        # The retained fixture keeps its original date; exercise the new boundary without rewriting it.
        with patch.object(progress, 'replacement_required', return_value=True):
            self.assertEqual([], progress.admission_problems(state, prepared))
            prepared['failure_evidence_sha256'] = '0' * 64
            self.assertIn('original independent', progress.admission_problems(state, prepared)[0])


if __name__ == '__main__':
    unittest.main()
