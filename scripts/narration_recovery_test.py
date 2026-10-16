"""Actual charged voice rejection, late accounting and funded review remain distinct."""
import copy
from contextlib import nullcontext, redirect_stdout
import io
import json
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import patch

import autonomous_completion as capacity
import modern_code_recovery_test as fixture
import narration_recovery as voice
import production_lifecycle as lifecycle
import run_controller as controller


class NarrationRecoveryTest(unittest.TestCase):
    start = fixture.ModernCodeRecoveryTest.start
    write = fixture.ModernCodeRecoveryTest.write

    def setUp(self, *, critic_ceiling=None):
        text = voice.POLICY.read_text()
        fixture.ModernCodeRecoveryTest.setUp(self)
        self.start(patch.object(voice, 'POLICY', self.write('config/autonomous_completion_narration_v1.json', text, text=True)))
        self.state = self.root / 'out/dispatch/run_state.json'
        scope = (patch.object(controller, 'ceilings', return_value={**controller.ceilings(),
                  'storyboard_critics': critic_ceiling}) if critic_ceiling else nullcontext())
        with scope:
            self.assertTrue(controller.initialise(self.state, '2026-10-15', 'production')[0])
        board = json.loads(self.boards[2].read_text()); board['date'] = '2026-10-15'
        self.board = self.write('out/dispatch/storyboard.json', board)
        self.write('out/dispatch/vo_script.txt', 'The pilot has no reported deployment.', text=True)
        self.direction = self.write('out/dispatch/vo_direction.json', {'overall': 'Connected read.'})
        self.source = self.write('out/dispatch/sources/research.txt', 'No deployed town is reported.', text=True)
        failures = []
        for i in range(2):
            failure = self.write(f'out/dispatch/failed-{i}.json', {'error': 'closing word is not reconciled ' + str(i)})
            failures.append(failure)
            baseline = self.write(f'out/dispatch/direction-before-{i}.json', self.direction.read_text(), text=True)
            plan = {'repair_scope': 'narration-performance', 'mechanism_id': 'voice-' + str(i),
                    'director_identity': 'Sonnet director', 'failure_family': 'unclassified',
                    'root_cause': 'The actual final word is not intelligible in the retained acoustic evidence.',
                    'repair': 'Direct the same approved sentence with a complete and intelligible final phrase.',
                    'mechanism_change': 'Change the relative pace of the closing phrase while preserving every word.',
                    'expected_visible_result': 'The unchanged closing sentence reconciles with the actual recorded acoustic words.',
                    'failure_evidence': str(failure), 'failure_evidence_sha256': voice.digest(failure),
                    'resources': {'tts_calls': 2}, 'changed_inputs': [{'path': str(self.direction),
                    'before_path': str(baseline), 'before_sha256': voice.digest(baseline)}]}
            proposal = self.write(f'out/dispatch/repair-{i}.json', plan)
            self.assertTrue(lifecycle.begin_repair(self.state, proposal)[0])
            self.direction.write_text(json.dumps({'overall': 'Connected read ' + str(i)}))
            plan['changed_inputs'][0]['after_sha256'] = voice.digest(self.direction)
            proposal.write_text(json.dumps(plan))
            self.assertTrue(lifecycle.authorize_repair(self.state, proposal)[0])
        self.assertTrue(controller.reserve(self.state, {'storyboard_critics': 6}, 'retained fixture reviews')[0])
        note = 'independent pivot review for narration repair after two failed takes'
        self.assertTrue(controller.reserve(self.state, {'storyboard_critics': 1}, note)[0])
        state = controller.read_state(self.state); reserved = len(state['events']) - 1
        self.report = self.write('out/dispatch/original-rejection.json', {
            'verdict': 'revise', 'reviewer_identity': 'Independent Opus High voice critic',
            'retired_mechanism_id': 'voice-1', 'replacement_mechanism_id': 'rushed-close',
            'reviewed_failure_sha256': [voice.digest(p) for p in failures],
            'visible_difference': 'The retained final phrase is compressed and its closing consonant is not completed.',
            'source_basis': 'Both actual retained acoustic reports disagree with the unchanged source-backed script.',
            'reasoning': 'A faster close repeats the observed failure; the new proposal needs a different tempo.'})
        ref = lambda p: {'path': str(p), 'sha256': voice.digest(p)}
        self.audio = self.write('out/dispatch/failed-take.wav', 'Synthetic PCM fixture, no actual listening claimed.', text=True)
        self.asr = self.write('out/dispatch/acoustic-asr.json', {'words': ['wrong']})
        packet = self.write('out/dispatch/packet.md', 'Full narration-performance proposal changes only vo_direction.json.', text=True)
        incident = {'agent_id': 'actual_voice_actor_123', 'precharged': False,
                    'invalid_for_authorization': True, 'observed_at': controller.now(),
                    'handback': ref(self.write('out/dispatch/uncharged-handback.json', {'verdict': 'pass'})),
                    'proposal': ref(proposal),
                    'disclosure': ref(self.write('out/dispatch/incident.md', 'Actual uncharged substantive continuation; never a precharge.', text=True))}
        receipt = {'schema': 'dispatch_narration_pivot_recovery/1', 'run_id': state['run_id'],
                   'director_identity': 'Sonnet director', 'role': 'recurrence-pivot', 'status': 'completed',
                   'model': 'claude-opus-5-5', 'effort': 'high', 'provider_unavailable': False,
                   'agent_id': 'actual_voice_actor_123', 'reviewer_identity': 'Independent Opus High voice critic',
                   'reservation_event_index': reserved, 'reservation_note': note,
                   'reservation_sha256': capacity.sha(capacity.canonical(state['events'][reserved])),
                   'report_sha256': voice.digest(self.report), 'unreserved_continuations': [incident],
                   'retained_inputs': [{**ref(p), 'kind': kind} for p, kind in
                       [(self.audio, 'audio'), (self.asr, 'asr'), (baseline, 'baseline'), (packet, 'packet'),
                        *[(p, 'failure') for p in failures]]]}
        self.receipt = self.write('out/dispatch/receipt.json', receipt)
        self.plan = self.root / 'out/dispatch/capacity.json'
        voice.prepare(self.state, self.receipt, self.report, self.plan)
        self.before = controller.read_state(self.state)

    def grant(self):
        ok, message = capacity.grant_capacity(self.state, self.plan)
        self.assertTrue(ok, message)

    def review(self):
        state = controller.read_state(self.state)
        gi = max(i for i,e in enumerate(state['events']) if e.get('kind') in voice.FUNDING_KINDS)
        self.assertTrue(controller.reserve(self.state, {'storyboard_critics': 1}, 'actual precharged narration pivot continuation')[0])
        state = controller.read_state(self.state); ri = len(state['events']) - 1
        report = json.loads(self.report.read_text()); report.update(verdict='pass', replacement_mechanism_id='complete-close')
        passed = self.write(f'out/dispatch/properly-charged-pass-{ri}.json', report)
        receipt = {'schema': 'dispatch_precharged_narration_review/1', 'run_id': state['run_id'],
            'grant_event_index': gi, 'grant_sha256': capacity.sha(capacity.canonical(state['events'][gi])),
            'reservation_event_index': ri, 'reservation_sha256': capacity.sha(capacity.canonical(state['events'][ri])),
            'model': 'claude-opus-5-5', 'effort': 'high', 'provider_unavailable': False,
            'agent_id': 'actual_voice_actor_123', 'reviewer_identity': report['reviewer_identity'],
            'direction_sha256': voice.digest(self.direction), 'report_sha256': voice.digest(passed),
            'mechanism_id': 'complete-close', 'started_at': state['events'][ri]['at'], 'completed_at': controller.now()}
        return self.write(f'out/dispatch/fresh-review-receipt-{ri}.json', receipt), passed

    def test_complete_path_only_exact_deficits_and_original_history_preserved(self):
        out = io.StringIO(); before = self.state.read_bytes()
        with patch('sys.argv', ['controller', '--state', str(self.state), 'production-budget', '--repair-plan', str(self.plan)]), redirect_stdout(out):
            self.assertEqual(controller.main(), 1)
        budget = json.loads(out.getvalue())
        self.assertEqual(budget['deficits'], {'storyboard_critics': 5})
        self.assertEqual(budget['resources']['image_generations']['required'], 0)
        self.assertEqual(self.state.read_bytes(), before)
        self.grant(); state = controller.read_state(self.state)
        self.assertEqual(state['usage'], self.before['usage'])
        self.assertEqual(state['resource_envelope'], self.before['resource_envelope'])
        self.assertEqual(state['events'][:len(self.before['events'])], self.before['events'])
        self.assertEqual(state['events'][-1]['resource_increments'], {'storyboard_critics': 5})
        self.assertEqual(capacity.replay(state)[1], [])
        self.assertFalse(controller.finish(self.state, 'publishable')[0])
        self.assertFalse(capacity.grant_capacity(self.state, self.plan)[0])

    def test_late_debit_once_cannot_substitute_for_precharged_review(self):
        self.grant(); self.assertFalse(controller.reserve(self.state, {'tts_calls': 1}, 'must wait')[0])
        voice.settle(self.state, self.plan); once = self.state.read_bytes()
        voice.settle(self.state, self.plan); self.assertEqual(self.state.read_bytes(), once)
        self.assertEqual(controller.read_state(self.state)['usage']['storyboard_critics'], 8)
        self.assertFalse(controller.reserve(self.state, {'preflight_renders': 1}, 'must wait')[0])
        receipt, passed = self.review()
        voice.verify_review(self.state, self.plan, receipt, passed)
        self.assertTrue(controller.reserve(self.state, {'tts_calls': 1}, 'actual newly permitted synthesis')[0])
        self.assertEqual(capacity.replay(controller.read_state(self.state))[1], [])

    def test_wrong_or_stale_original_evidence_and_self_review_refused(self):
        plan = json.loads(self.plan.read_text())
        for key, value in [('verdict', 'pass'), ('reviewer_identity', plan['director_identity']),
                           ('reviewed_failure_sha256', []), ('source_basis', '')]:
            report = json.loads(self.report.read_text()); report[key] = value
            self.assertFalse(voice.eligible(self.before, plan, report), key)
        for path in (self.source, self.board, self.direction, self.audio, self.asr, self.report):
            raw = path.read_bytes(); path.write_bytes(raw + b' ')
            self.assertFalse(capacity.grant_capacity(self.state, self.plan)[0], path)
            path.write_bytes(raw)

    def test_retroactive_timestamp_late_reservation_or_wrong_direction_refused(self):
        self.grant(); voice.settle(self.state, self.plan); receipt, passed = self.review()
        original = receipt.read_text()
        for key, value in [('started_at', '2020-01-01T00:00:00+00:00'),
                           ('direction_sha256', '0' * 64), ('model', 'claude-sonnet-5-5')]:
            data = json.loads(original); data[key] = value; receipt.write_text(json.dumps(data))
            with self.assertRaises(ValueError): voice.verify_review(self.state, self.plan, receipt, passed)
        receipt.write_text(original)
        state = controller.read_state(self.state)
        late = next(i for i,e in enumerate(state['events']) if e.get('note', '').startswith('LATE CHARGE'))
        data = json.loads(original); data.update(reservation_event_index=late,
            reservation_sha256=capacity.sha(capacity.canonical(state['events'][late])))
        receipt.write_text(json.dumps(data))
        with self.assertRaises(ValueError): voice.verify_review(self.state, self.plan, receipt, passed)

    def test_missing_adoption_or_mutated_grant_and_verified_evidence_fail_replay(self):
        self.grant(); voice.settle(self.state, self.plan); receipt, passed = self.review()
        voice.verify_review(self.state, self.plan, receipt, passed)
        state = controller.read_state(self.state)
        mutated = copy.deepcopy(state); mutated['events'][-1]['report_json'] += ' '
        self.assertTrue(capacity.replay(mutated)[1])
        mutated = copy.deepcopy(state); mutated['events'] = [e for e in mutated['events'] if e.get('kind') != voice.ADOPTION]
        self.assertTrue(capacity.replay(mutated)[1])
        state.update(terminal_state='shipped', phase='shipped')
        self.assertEqual(capacity.replay(state)[1], [])

    def test_actual_capacity_and_verified_review_survive_checkpoint_root_change(self):
        import claude_checkpoint as checkpoint
        import critic_gate
        self.grant(); voice.settle(self.state, self.plan); receipt, passed = self.review()
        voice.verify_review(self.state, self.plan, receipt, passed)
        state = controller.read_state(self.state)
        public, origins = checkpoint.public_projection(state, self.root)
        with tempfile.TemporaryDirectory() as td:
            destination = Path(td) / 'restored'
            shutil.copytree(self.root, destination)
            manifest = {'repo_root': str(self.root), 'grant_origin_roots': origins}
            restored = checkpoint.restored_ledger(public, destination, manifest)
            new_state = destination / self.state.relative_to(self.root)
            new_state.write_text(json.dumps(restored))
            metadata = destination / checkpoint.GRANT_ROOTS_FILE
            metadata.parent.mkdir(parents=True, exist_ok=True)
            metadata.write_text(json.dumps({'schema': 1, 'entries': origins}))
            with patch.object(voice, 'POLICY', destination / 'config/autonomous_completion_narration_v1.json'), patch.object(critic_gate, 'REPO', destination):
                self.assertEqual(capacity.replay(restored)[1], [])
                plan = json.loads((destination / self.plan.relative_to(self.root)).read_text())
                self.assertEqual(voice.file_problems(new_state, plan), [])
                projected_again, next_origins = checkpoint.public_projection(restored, destination)
                self.assertEqual(public['events'], projected_again['events'])
                self.assertEqual(origins, next_origins)

    def test_already_funded_path_records_no_increment_and_still_requires_new_review(self):
        # A separate edition starts with a larger frozen allocation. No spend or
        # existing snapshot is changed to construct the already-funded case.
        self.setUp(critic_ceiling=20)
        before = controller.read_state(self.state)
        self.grant(); state = controller.read_state(self.state)
        self.assertEqual(state['events'][-1]['kind'], voice.READY)
        self.assertEqual(state['events'][-1]['resource_increments'], {})
        self.assertEqual(state['usage'], before['usage'])
        self.assertEqual(state['escalation_ceiling'], before['escalation_ceiling'])
        self.assertFalse(controller.reserve(self.state, {'tts_calls': 1}, 'still pending')[0])
        voice.settle(self.state, self.plan); receipt, passed = self.review()
        voice.verify_review(self.state, self.plan, receipt, passed)
        self.assertEqual(capacity.replay(controller.read_state(self.state))[1], [])

    def test_later_actual_revise_does_not_require_approval_of_retired_proposal(self):
        self.grant(); voice.settle(self.state, self.plan); receipt, passed = self.review()
        rejected = json.loads(passed.read_text()); rejected['verdict'] = 'revise'
        passed.write_text(json.dumps(rejected))
        state = controller.read_state(self.state); ri = len(state['events']) - 1
        actual = json.loads(self.receipt.read_text())
        actual.update(reservation_event_index=ri, reservation_note=state['events'][ri]['note'],
                      reservation_sha256=capacity.sha(capacity.canonical(state['events'][ri])),
                      report_sha256=voice.digest(passed), unreserved_continuations=[])
        next_receipt = self.write('out/dispatch/next-rejection-receipt.json', actual)
        next_plan = self.root / 'out/dispatch/next-capacity.json'
        voice.prepare(self.state, next_receipt, passed, next_plan)
        ok, message = capacity.grant_capacity(self.state, next_plan); self.assertTrue(ok, message)
        self.assertFalse(controller.reserve(self.state, {'tts_calls': 1}, 'still needs current review')[0])
        self.plan = next_plan
        # review() binds the most recent funding scope.
        receipt, approved = self.review()
        voice.verify_review(self.state, self.plan, receipt, approved)
        self.assertTrue(controller.reserve(self.state, {'tts_calls': 1}, 'newly cleared current proposal')[0])


if __name__ == '__main__': unittest.main()
