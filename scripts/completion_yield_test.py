"""Hard-cap cost closure keeps original rejection, completion evidence and shipment guards."""
import copy
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import completion_yield as closure
import publication_owner
import review_limit
import routine_continuation
import run_controller

FIXTURE = Path(__file__).with_name('fixtures') / 'completion_yield_failed_panel.json'


class CompletionYieldTests(unittest.TestCase):
    def write(self, path, value):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(value, indent=2) + '\n')
        return path

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.workspace = Path(self.tmp.name).resolve(); self.repo = self.workspace / 'Dispatch'
        self.out = self.repo / 'out/dispatch'; self.out.mkdir(parents=True)
        self.path = self.out / 'run_state.json'; owner = publication_owner.identity('parent')
        self.event = {'kind': 'reserved', 'resources': {'panel_rounds': 1, 'scorer_calls': 3},
                      'publication_owner_sha256': owner, 'publication_epoch': 'original-epoch'}
        self.state = {'schema': run_controller.SCHEMA, 'run_id': '2026-10-21', 'mode': 'production',
                      'terminal_state': None, 'phase': 'review', 'limits': run_controller.limits(),
                      'usage': {'storyboard_critics': 5, 'panel_rounds': 1, 'scorer_calls': 3},
                      'resource_envelope': {'unchanged_original': True}, 'events': [self.event]}
        original = closure.read(FIXTURE)
        self.board = {'date': self.state['run_id'], 'runtime_s': 60,
                      'narration_picture': {'clauses': [{k: r[k] for k in ('id', 'start_s', 'end_s')}
                                                       for r in original['narration_picture_observations']['clauses']]}}
        self.write(self.out / 'storyboard.json', self.board)
        (self.out / 'film.mp4').write_bytes(b'exact immutable native film fixture')
        self.write(self.out / 'render-manifest.json', {'fixture': True})
        self.state['deliverable'] = {k: str(self.out / v) for k, v in
                                    [('film', 'film.mp4'), ('board', 'storyboard.json'), ('manifest', 'render-manifest.json')]}
        self.state['deliverable'].update({k + '_sha256': run_controller.digest(Path(v))
                                         for k, v in list(self.state['deliverable'].items())})
        self.write(self.path, self.state)
        self.write(self.workspace / routine_continuation.MARKER,
                   {'schema': routine_continuation.SCHEMA, 'run_id': self.state['run_id'], 'state': str(self.path)})
        self.plan = {'panel': str(self.out / 'report_card.json'), 'packets': {}, 'coverage': {}}
        page = self.out / 'motion-review/sequence-000.png'; page.parent.mkdir()
        page.write_bytes(b'original diagnostic PNG fixture')
        sequence = self.write(page.parent / 'index.json', {'pages': [{'file': page.name, 'sha256': run_controller.digest(page)}]})
        judges = []; self.payloads = []
        for role in closure.ROLES:
            response = self.write(self.out / 'cinema' / (role + '-response.json'), {'responseId': role})
            av = self.write(response.with_name(role + '-review.json'), {'role': role,
                'response': {'file': response.name, 'sha256': run_controller.digest(response)}})
            packet = {'role': role, 'date': self.state['run_id'],
                      'film': {'path': self.state['deliverable']['film'], 'sha256': self.state['deliverable']['film_sha256']},
                      'board': {'path': self.state['deliverable']['board'], 'sha256': self.state['deliverable']['board_sha256']},
                      'av_receipt': {'path': str(av), 'sha256': run_controller.digest(av)},
                      'motion_sequence': {'path': str(sequence), 'sha256': run_controller.digest(sequence)}}
            packet_path = self.write(self.out / (role + '-packet.json'), packet)
            packet_sha = run_controller.digest(packet_path)
            self.plan['packets'][role] = str(packet_path)
            self.plan['coverage'][role] = str(self.write(self.out / (role + '-coverage.json'), {'packet_sha256': packet_sha}))
            judge = copy.deepcopy(original)
            judge.update(reviewer_identity=role + '-independent-identity', audiovisual_role=role,
                         audiovisual_receipt_sha256=run_controller.digest(av), packet_sha256=packet_sha,
                         film_sha256=packet['film']['sha256'], board_sha256=packet['board']['sha256'])
            for key in ('attention_review', 'modern_observations', 'narration_picture_observations'):
                judge[key]['film_sha256'] = packet['film']['sha256']
            claim = {'schema': 'dispatch_worker_dispatch_claim/1', 'run_id': self.state['run_id'],
                     'role': role, 'task_name': role + '_score', 'packet_sha256': packet_sha,
                     'reservation_event_index': 0, 'reservation_sha256': closure.digest(self.event),
                     'owner_sha256': owner, 'epoch': self.event['publication_epoch']}
            self.write(self.out / 'worker-dispatch-claims' / (role + '.json'), claim)
            payload = {'hook_event_name': 'SubagentStop', 'session_id': 'parent', 'agent_id': role + '-worker', 'agent_type': 'dispatch-visual-scorer',
                       'last_assistant_message': json.dumps(judge)}
            closure.record(payload, self.workspace); self.payloads.append(payload); judges.append(judge)
        self.write(Path(self.plan['panel']), {'ship': False, 'judges': judges})
        # These are the expensive/current-evidence dependencies, not the tested original-response,
        # observation, ownership, accounting or remote-checkpoint bindings.
        for target, value in [('run_controller.deliverable_problems', []), ('preship_check.current_for', (True, 'current')),
                              ('agent_runtime.validate_references', None), ('claude_runtime.motion_inputs', None),
                              ('claude_runtime.image_coverage_problems', []), ('production_quality.av_problems', []),
                              ('production_quality.probe', (1080, 1920, 63))]:
            p = patch(target, return_value=value); p.start(); self.addCleanup(p.stop)

    def validate(self):
        return closure.validate(self.path, self.plan)

    def close_event(self):
        evidence = self.validate(); self.state['events'].append({'kind': closure.KIND, 'evidence': evidence})
        self.write(self.path, self.state); return evidence

    def test_production_shaped_original_failure_is_complete_but_never_passed(self):
        before = self.path.read_bytes(); panel = Path(self.plan['panel']).read_bytes()
        evidence = self.validate()
        self.assertFalse(evidence['production_finished']); self.assertFalse(evidence['shipment_authorized'])
        self.assertEqual(self.path.read_bytes(), before); self.assertEqual(Path(self.plan['panel']).read_bytes(), panel)
        self.assertTrue(closure.complete_judge(closure.read(self.plan['panel'])['judges'][0], self.board,
                                             self.state['deliverable']['film_sha256']))

    def test_missing_malformed_and_stale_evidence_refused(self):
        for edit in ('modern', 'clauses', 'classification', 'score', 'film', 'verdict'):
            judge = copy.deepcopy(closure.read(self.plan['panel'])['judges'][0])
            if edit == 'modern': judge['modern_observations'].pop('closing_answer')
            if edit == 'clauses': judge['narration_picture_observations']['clauses'].pop()
            if edit == 'classification': judge['bounded_release']['defects'] = []
            if edit == 'score': judge['score'] = float('nan')
            if edit == 'film': judge['modern_observations']['film_sha256'] = 'wrong'
            if edit == 'verdict': judge['ship'] = 'false'
            with self.subTest(edit=edit), self.assertRaises((ValueError, KeyError)):
                closure.complete_judge(judge, self.board, self.state['deliverable']['film_sha256'])

    def test_honest_credit_tail_failure_uses_actual_full_film_duration(self):
        judge = copy.deepcopy(closure.read(self.plan['panel'])['judges'][0])
        judge['attention_review'].update(weakest_at_s=60.5, weakest_end_s=62.8)
        self.assertTrue(closure.complete_judge(judge, self.board, self.state['deliverable']['film_sha256'], 63))
        with self.assertRaisesRegex(ValueError, 'weakest interval'):
            closure.complete_judge(judge, self.board, self.state['deliverable']['film_sha256'], 62)

    def test_director_replacement_and_missing_completion_cannot_close(self):
        panel = closure.read(self.plan['panel']); panel['judges'][0]['score'] += .01
        self.write(Path(self.plan['panel']), panel)
        with self.assertRaisesRegex(ValueError, 'original completed'):
            self.validate()
        self.write(Path(self.plan['panel']), {'ship': False, 'judges': [json.loads(p['last_assistant_message']) for p in self.payloads]})
        next((self.out / closure.RECEIPTS).glob('*.json')).unlink()
        with self.assertRaisesRegex(ValueError, 'original completed'):
            self.validate()

    def test_completed_receipt_is_immutable_and_has_distinct_real_agent(self):
        closure.record(self.payloads[0], self.workspace)
        changed = {**self.payloads[0], 'agent_id': 'another-worker'}
        with self.assertRaisesRegex(ValueError, 'preserve the original'):
            closure.record(changed, self.workspace)

    def test_handback_is_retained_only_after_native_stop(self):
        role = 'picture'; receipt = next((self.out / closure.RECEIPTS).glob(run_controller.digest(Path(self.plan['packets'][role])) + '-*.json'))
        receipt.unlink(); payload = self.payloads[0]
        closure.record({**payload, 'hook_event_name': 'PostToolUse', 'tool_name': 'SubagentHandback',
                        'tool_input': {'message': payload['last_assistant_message']}}, self.workspace)
        self.assertFalse(receipt.exists())
        closure.record({**payload, 'last_assistant_message': 'Handback delivered.'}, self.workspace)
        self.assertTrue(receipt.exists())

    def test_other_actor_and_score_only_failure_cannot_create_cost_closure(self):
        receipt = next((self.out / closure.RECEIPTS).glob(run_controller.digest(Path(self.plan['packets']['picture'])) + '-*.json'))
        receipt.unlink()
        closure.record({**self.payloads[0], 'agent_type': 'scene-builder'}, self.workspace)
        self.assertFalse(receipt.exists())
        judge = json.loads(self.payloads[0]['last_assistant_message'])
        judge['hard_fails'] = []; judge['defects'] = []
        judge['bounded_release']['defects'] = []; judge['bounded_release']['score_only'] = True
        self.assertFalse(closure.complete_judge(judge, self.board, self.state['deliverable']['film_sha256']))

    def test_exhausted_panel_guidance_does_not_restart_repairs(self):
        from panel_triage import recovery_guidance
        guidance = recovery_guidance(self.board, self.state)
        self.assertIn('completion_yield.py', guidance)
        self.assertIn('NOT SHIPPED', guidance)
        self.assertNotIn('prompts/phases/repair.md', guidance)

    def test_reservation_and_all_workers_close_before_prepared_capture_but_allow_late_accounting(self):
        self.close_event()
        for resource in ('research_agents', 'full_renders', 'scorer_calls', 'storyboard_critics', 'reboards'):
            self.assertTrue(review_limit.reservation_problems(self.state, {resource: 1}))
        for role in ('validator', 'scene-builder', 'storyboard-critic', 'picture'):
            self.assertTrue(review_limit.worker_plan_problems(self.state, {'role': role}, charged=True))
        self.assertFalse(review_limit.reservation_problems(self.state, {'reported_tokens': 91}))
        with patch('claude_checkpoint.require_backed') as backed, patch('capture_reservation.claim') as claim:
            ok, message = run_controller.reserve(self.path, {'full_renders': 1})
        self.assertFalse(ok); self.assertIn('expenditure is closed', message)
        backed.assert_not_called(); claim.assert_not_called()

    def test_only_empty_known_host_registries_can_yield(self):
        self.close_event()
        with patch.object(closure, 'checkpoint_proof', return_value='remote-commit') as proof:
            for payload in ({}, {'background_tasks': []}, {'background_tasks': [], 'session_crons': [{}]},
                            {'background_tasks': [{'status': 'running', 'id': 'paid-child'}], 'session_crons': []}):
                self.assertFalse(closure.permits(payload, self.path, self.state))
            proof.assert_not_called()
            self.assertTrue(closure.permits({'background_tasks': [], 'session_crons': []}, self.path, self.state))
        self.assertIsNone(closure.read(self.path)['terminal_state'])

    def test_checkpoint_requires_exact_ledger_and_all_original_files(self):
        import claude_checkpoint as checkpoint
        evidence = self.close_event()
        self.assertIn('out/dispatch/motion-review/sequence-000.png', evidence['files'])
        self.assertIn('out/dispatch/cinema/picture-response.json', evidence['files'])
        files = [{'path': p, 'sha256': h} for p, h in evidence['files'].items()]
        ledger = checkpoint.ledger_text(self.state, self.repo).encode()
        with patch.object(checkpoint, 'remote_tip', return_value='immutable'), \
                patch.object(checkpoint, 'verify_checkpoint', return_value=({'files': files}, ledger)) as verify:
            self.assertEqual(closure.checkpoint_proof(self.path, evidence), 'immutable')
            verify.return_value = ({'files': files[:-1]}, ledger)
            with self.assertRaisesRegex(ValueError, 'omits original'):
                closure.checkpoint_proof(self.path, evidence)
            verify.return_value = ({'files': files}, b'old ledger')
            with self.assertRaisesRegex(ValueError, 'exact current ledger'):
                closure.checkpoint_proof(self.path, evidence)

    def test_active_subscription_precedes_expenditure_yield_and_does_not_release_owner(self):
        self.close_event()
        payload = {'hook_event_name': 'Stop', 'session_id': 'parent', 'background_tasks': [], 'session_crons': []}
        with patch('publication_owner.waiting_reason', return_value=None), patch('publication_owner.heartbeat_hook'), \
                patch.object(routine_continuation, 'closure_problems', return_value=['not shipped']), \
                patch('native_task_wait.eligible', return_value=[{'task_id': 'active'}]), \
                patch('native_task_wait.retain') as retain, patch.object(closure, 'permits') as permits, \
                patch('publication_owner.release') as release:
            self.assertIsNone(routine_continuation.decision(payload, self.workspace))
            retain.assert_called_once(); permits.assert_not_called(); release.assert_not_called()

    def test_close_is_nonterminal_idempotent_and_checkpoint_failure_never_reopens_spend(self):
        with patch('publication_owner.require_owner'), patch('claude_checkpoint.mirror'), \
                patch('claude_checkpoint.save_with_recovery'), patch.object(closure, 'checkpoint_proof', return_value='remote'):
            self.assertEqual(closure.close(self.path, self.plan), 'remote')
            before = self.path.read_bytes(); closure.close(self.path, self.plan)
            self.assertEqual(self.path.read_bytes(), before)
        actual = closure.read(self.path)
        self.assertIsNone(actual['terminal_state']); self.assertEqual(actual['usage'], self.state['usage'])
        self.assertEqual(actual['resource_envelope'], self.state['resource_envelope'])
        with patch.object(closure, 'checkpoint_proof', side_effect=ValueError('missing remote evidence')):
            with self.assertRaisesRegex(ValueError, 'missing remote evidence'):
                closure.permits({'background_tasks': [], 'session_crons': []}, self.path, actual)
        self.assertTrue(closure.admission_problems(actual, {'full_renders': 1}))


if __name__ == '__main__':
    unittest.main()
