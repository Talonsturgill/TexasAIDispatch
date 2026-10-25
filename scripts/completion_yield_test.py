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

    def test_same_original_metadata_completion_retains_all_responses_and_judgments(self):
        original = self.payloads[0]; updated = json.loads(original['last_assistant_message'])
        updated['coverage_completion'] = {'metadata_only': True, 'actual_pages': 67}
        closure.record({**original, 'last_assistant_message': json.dumps(updated)}, self.workspace)
        panel = closure.read(self.plan['panel']); panel['judges'][0] = updated
        self.write(Path(self.plan['panel']), panel)
        evidence = self.validate()
        receipts = [p for p in evidence['files'] if closure.RECEIPTS in p]
        self.assertEqual(len(receipts), 4)
        changed = copy.deepcopy(updated); changed['score'] += .1
        closure.record({**original, 'last_assistant_message': json.dumps(changed)}, self.workspace)
        panel['judges'][0] = changed; self.write(Path(self.plan['panel']), panel)
        with self.assertRaisesRegex(ValueError, 'change an original judgment'):
            self.validate()

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


class ExhaustedRequiredReviewTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.repo = Path(self.tmp.name).resolve() / 'Dispatch'
        self.out = self.repo / 'out/dispatch'; self.out.mkdir(parents=True)
        self.path = self.out / 'run_state.json'
        self.failure = self.out / 'evidence/narration-2/failure.txt'
        self.failure.parent.mkdir(parents=True); self.failure.write_text('Original measured alignment refusal.\n')
        self.report = self.out / 'storyboard_critic.json'
        self.report.write_text(json.dumps({'review_scope': 'code-plan', 'verdict': 'PASS'}))
        envelope = {'storyboard_critics': 7, 'full_renders': 14}
        events = [{'kind': 'resource_envelope_frozen', 'envelope': envelope}]
        for i in range(6):
            events.append({'kind': 'reserved', 'resources': {'storyboard_critics': 1}, 'at': str(i),
                           'publication_owner_sha256': 'original-owner', 'publication_epoch': 'original-epoch'})
        events.append({'kind': 'repair_authorized', 'repair_plan': {
            'failure_evidence': str(self.failure), 'failure_evidence_sha256': run_controller.digest(self.failure)}})
        self.state = {'schema': run_controller.SCHEMA, 'run_id': '2026-10-24', 'mode': 'production',
                      'terminal_state': None, 'resource_envelope': envelope, 'events': events,
                      'usage': {'storyboard_critics': 6, 'full_renders': 0, 'reported_tokens': 123}}
        self.claim = self.out / 'worker-dispatch-claims/original.json'; self.claim.parent.mkdir()
        self.claim.write_text(json.dumps({'schema': 'dispatch_worker_dispatch_claim/1',
            'run_id': self.state['run_id'], 'role': 'storyboard-critic', 'reservation_event_index': 5,
            'reservation_sha256': closure.digest(events[5]), 'owner_sha256': 'original-owner',
            'epoch': 'original-epoch', 'packet_sha256': 'original-spent-packet'}))
        self.plan = {'reason': closure.EXHAUSTED_REQUIRED_REVIEW, 'failure_evidence': str(self.failure)}
        self.save()

    def save(self):
        self.path.write_text(json.dumps(self.state, indent=2) + '\n')

    def validate(self):
        return closure.validate_plan(self.path, self.plan)

    def test_original_overrun_is_retained_without_reset_or_native_panel_validation(self):
        before = self.path.read_bytes(); evidence = self.validate()
        self.assertEqual(self.path.read_bytes(), before)
        self.assertIn('out/dispatch/worker-dispatch-claims/original.json', evidence['files'])
        self.assertEqual(evidence['ledger_prefix_sha256'], closure.digest(self.state['events']))
        self.assertFalse(evidence['production_finished']); self.assertFalse(evidence['shipment_authorized'])
        with patch.object(closure, 'validate', side_effect=AssertionError('final panel unchanged')):
            self.validate()

    def test_unused_budget_and_available_final_reservation_cannot_close(self):
        for change, message in [('unused', 'exhausted'), ('final', 'reserved final'),
                                ('miscount', 'cumulative'), ('envelope', 'frozen')]:
            original = copy.deepcopy(self.state)
            if change == 'unused': self.state['usage']['storyboard_critics'] = 4
            if change == 'final': self.state['events'][5]['final_timed_phone'] = {'packet': 'unclaimed'}
            if change == 'miscount': self.state['usage']['storyboard_critics'] = 7
            if change == 'envelope': self.state['resource_envelope'] = {'storyboard_critics': 8}
            self.save()
            with self.subTest(change=change), self.assertRaisesRegex(ValueError, message):
                self.validate()
            self.state = original
        self.save()

    def make_unfundable(self):
        """Three code reviews spent, no opening evidence: the remaining two cannot fund a film."""
        events = self.state['events']
        self.state['events'] = events[:4] + [events[7]]
        self.state['usage']['storyboard_critics'] = 3
        self.claim.write_text(json.dumps({'schema': 'dispatch_worker_dispatch_claim/1',
            'run_id': self.state['run_id'], 'role': 'storyboard-critic', 'reservation_event_index': 3,
            'reservation_sha256': closure.digest(self.state['events'][3]), 'owner_sha256': 'original-owner',
            'epoch': 'original-epoch', 'packet_sha256': 'original-spent-packet'}))
        self.plan = {'reason': closure.UNFUNDABLE_REQUIRED_REVIEW, 'failure_evidence': str(self.failure)}
        self.save()

    def test_unfundable_path_closes_at_the_third_review_without_opening_evidence(self):
        self.make_unfundable()
        before = self.path.read_bytes(); evidence = self.validate()
        self.assertEqual(self.path.read_bytes(), before)
        self.assertEqual(evidence['plan']['reason'], closure.UNFUNDABLE_REQUIRED_REVIEW)
        self.assertFalse(evidence['production_finished']); self.assertFalse(evidence['shipment_authorized'])
        self.assertIn('out/dispatch/worker-dispatch-claims/original.json', evidence['files'])

    def test_unfundable_reason_cannot_close_a_fundable_or_unfinished_path(self):
        self.make_unfundable()
        for change, message in [('early', 'exhausted'), ('selection', 'exhausted'), ('code-a', 'exhausted'),
                                ('code-b', 'exhausted'), ('final', 'reserved final'), ('film', 'native film'),
                                ('exhausted-name', 'exhausted')]:
            original = copy.deepcopy(self.state); plan = dict(self.plan); extra = None
            if change == 'early':
                self.state['events'].pop(3); self.state['usage']['storyboard_critics'] = 2
            if change == 'selection': extra = self.out / 'openings/selection.json'
            if change == 'code-a': extra = self.out / 'opening-a-critic.json'
            if change == 'code-b': extra = self.out / 'opening-b-critic.json'
            if change == 'final': self.state['events'][3]['final_timed_phone'] = {'packet': 'unclaimed'}
            if change == 'film': self.state['deliverable'] = {'film': 'original.mp4'}
            if change == 'exhausted-name': self.plan['reason'] = closure.EXHAUSTED_REQUIRED_REVIEW
            if extra is not None:
                extra.parent.mkdir(parents=True, exist_ok=True); extra.write_text('{}')
            self.save()
            with self.subTest(change=change), self.assertRaisesRegex(ValueError, message):
                self.validate()
            if extra is not None: extra.unlink()
            self.state = original; self.plan = plan; self.save()

    def test_exhausted_hint_and_unfundable_hint_name_their_own_supported_commands(self):
        self.make_unfundable()
        hint = routine_continuation.capacity_recovery_hint(self.state, self.out)
        self.assertIn('--unfundable-required-review', hint); self.assertIn('NOT SHIPPED', hint)
        self.assertNotIn('completion-capacity', hint); self.assertNotIn('ask the owner', hint)
        (self.out / 'opening-a-critic.json').write_text('{}')
        hint = routine_continuation.capacity_recovery_hint(self.state, self.out)
        self.assertNotIn('--unfundable-required-review', hint)
        self.assertIn('FIVE cumulative editorial reviews', hint)

    def test_exact_five_closes_only_when_no_final_packet_was_reserved(self):
        self.state['events'].pop(6)
        self.state['usage']['storyboard_critics'] = 5
        self.save()
        self.assertFalse(self.validate()['production_finished'])
        self.state['events'][5]['final_timed_phone'] = {}
        self.save()
        with self.assertRaisesRegex(ValueError, 'reserved final'):
            self.validate()

    def test_native_work_final_phone_and_one_time_manual_route_cannot_close(self):
        for change, message in [('film', 'native film'), ('render', 'native film'),
                                ('panel', 'native film'), ('phone', 'exact-phone'), ('manual', 'ordinary')]:
            original = copy.deepcopy(self.state)
            if change == 'film': self.state['deliverable'] = {'film': 'original.mp4'}
            if change == 'render': self.state['usage']['full_renders'] = 1
            if change == 'panel': self.state['usage']['panel_rounds'] = 1
            if change == 'phone': self.report.write_text(json.dumps({'review_scope': 'exact-muted-phone-preflight'}))
            if change == 'manual': self.state['events'].append({'kind': 'owner_codex_repair_granted'})
            self.save()
            with self.subTest(change=change), self.assertRaisesRegex(ValueError, message):
                self.validate()
            self.state = original; self.report.write_text(json.dumps({'review_scope': 'code-plan', 'verdict': 'PASS'}))
        self.save()

    def test_original_failure_and_worker_claim_cannot_be_replaced(self):
        self.failure.write_text('Director replacement failure description.\n')
        with self.assertRaisesRegex(ValueError, 'original repair ledger'):
            self.validate()
        self.failure.write_text('Original measured alignment refusal.\n')
        claim = closure.read(self.claim); claim['reservation_sha256'] = 'changed'
        self.claim.write_text(json.dumps(claim))
        with self.assertRaisesRegex(ValueError, 'original worker claim'):
            self.validate()

    def test_close_requires_original_checkpoint_then_appends_only_one_nonterminal_event(self):
        original = copy.deepcopy(self.state)
        with patch('publication_owner.require_owner'), patch('claude_checkpoint.mirror'), \
                patch('claude_checkpoint.save_with_recovery'), \
                patch.object(closure, 'checkpoint_proof', side_effect=ValueError('original checkpoint absent')):
            with self.assertRaisesRegex(ValueError, 'original checkpoint absent'):
                closure.close(self.path, self.plan)
        self.assertEqual(closure.read(self.path), original)
        with patch('publication_owner.require_owner'), patch('claude_checkpoint.mirror'), \
                patch('claude_checkpoint.save_with_recovery'), \
                patch.object(closure, 'checkpoint_proof', return_value='verified') as proof:
            self.assertEqual(closure.close(self.path, self.plan), 'verified')
            self.assertEqual(proof.call_count, 2)
            closed = closure.read(self.path); original_events = closed.pop('events')
            self.assertEqual(original_events[:-1], original['events'])
            self.assertTrue(closed.pop('updated_at'))  # Ordinary append-only controller timestamp.
            self.assertEqual(closed, {k: v for k, v in original.items() if k != 'events'})
            before = self.path.read_bytes(); closure.close(self.path, self.plan)
            self.assertEqual(self.path.read_bytes(), before)
            actual = closure.read(self.path)
            for payload in ({}, {'background_tasks': []}, {'background_tasks': [], 'session_crons': [{}]},
                            {'background_tasks': [{'id': 'paid-child'}], 'session_crons': []}):
                self.assertFalse(closure.permits(payload, self.path, actual))
            self.assertTrue(closure.permits({'background_tasks': [], 'session_crons': []}, self.path, actual))
            self.assertTrue(closure.admission_problems(actual, {'storyboard_critics': 1}))
            self.assertFalse(closure.admission_problems(actual, {'reported_tokens': 17}))

    def test_stop_names_supported_command_without_permission_or_capacity(self):
        hint = routine_continuation.capacity_recovery_hint(self.state)
        self.assertIn('--exhausted-required-review', hint)
        self.assertIn('NOT SHIPPED', hint)
        self.assertNotIn('completion-capacity', hint)
        self.assertNotIn('ask the owner', hint)

    def test_checkpoint_refuses_omitted_original_worker_claim(self):
        import claude_checkpoint as checkpoint
        evidence = self.validate()
        files = [{'path': p, 'sha256': sha} for p, sha in evidence['files'].items()]
        ledger = checkpoint.ledger_text(self.state, self.repo).encode()
        with patch.object(checkpoint, 'remote_tip', return_value='actual-checkpoint'), \
                patch.object(checkpoint, 'verify_checkpoint', return_value=({'files': files}, ledger)) as verify:
            self.assertEqual(closure.checkpoint_proof(self.path, evidence), 'actual-checkpoint')
            verify.return_value = ({'files': files + [{'path': 'out/dispatch/worker-dispatch-claims/omitted.json',
                                                     'sha256': 'original'}]}, ledger)
            with self.assertRaisesRegex(ValueError, 'every original checkpoint worker claim'):
                closure.checkpoint_proof(self.path, evidence)


class InfeasibleRequiredReviewTests(unittest.TestCase):
    def write(self, path, value):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(value, indent=2) + '\n')
        return path

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.workspace = Path(self.tmp.name).resolve(); self.repo = self.workspace / 'Dispatch'
        self.out = self.repo / 'out/dispatch'; self.path = self.out / 'run_state.json'
        owner = publication_owner.identity('parent'); envelope = {'storyboard_critics': 7, 'full_renders': 14}
        self.state = {'schema': run_controller.SCHEMA, 'run_id': '2026-10-25', 'mode': 'production',
            'terminal_state': None, 'resource_envelope': envelope,
            'usage': {'storyboard_critics': 4, 'full_renders': 0, 'reported_tokens': 123},
            'events': [{'kind': 'resource_envelope_frozen', 'envelope': envelope}] + [
                {'kind': 'reserved', 'resources': {'storyboard_critics': 1}, 'at': str(i),
                 'publication_owner_sha256': owner, 'publication_epoch': 'original-epoch'} for i in range(4)]}
        self.write(self.path, self.state)
        self.packet = self.write(self.out / 'combined-packet.json', {
            'role': 'storyboard-critic', 'date': self.state['run_id'], 'phone_mode': 'comparison',
            'review_scope': 'exact-muted-phone-preflight', 'combined_code_review': {'original_binding': True}})
        self.claim = self.write(self.out / 'worker-dispatch-claims/fourth.json', {
            'schema': 'dispatch_worker_dispatch_claim/1', 'run_id': self.state['run_id'],
            'role': 'storyboard-critic', 'reservation_event_index': 4,
            'reservation_sha256': closure.digest(self.state['events'][4]), 'owner_sha256': owner,
            'epoch': 'original-epoch', 'packet_sha256': run_controller.digest(self.packet)})
        self.report = {'schema': 'dispatch_combined_code_phone_handback/1',
            'packet_sha256': run_controller.digest(self.packet), 'reviewer_identity': 'fourth-native-worker',
            'code_reports': {key: {'review_scope': 'code-plan', 'verdict': 'revise',
                'reviewer_identity': 'fourth-native-worker',
                'blocking_defects': [{'category': 'motion', 'defect': 'The required contact never completes.'}]}
                for key in ('a', 'b')}, 'selection': {'selected': 'a', 'reviewer_identity': 'fourth-native-worker'},
            'phone_review': {'review_scope': 'exact-muted-phone-preflight', 'verdict': 'revise',
                'reviewer_identity': 'fourth-native-worker',
                'blocking_defects': [{'category': 'motion', 'defect': 'The contact remains unresolved in the current film.'}]}}
        self.write(self.workspace / routine_continuation.MARKER, {
            'schema': routine_continuation.SCHEMA, 'run_id': self.state['run_id'], 'state': str(self.path)})
        self.refresh_receipt()

    def refresh_receipt(self):
        for path in (self.out / closure.CRITIC_RECEIPTS).glob('*.json'):
            path.unlink()  # Independent temporary test fixture only.
        self.payload = {'hook_event_name': 'SubagentStop', 'session_id': 'parent',
            'agent_id': 'fourth-native-worker', 'agent_type': 'dispatch-visual-critic',
            'last_assistant_message': json.dumps(self.report)}
        closure.record(self.payload, self.workspace)
        self.receipt = next((self.out / closure.CRITIC_RECEIPTS).glob('*.json'))
        self.plan = {'reason': closure.INFEASIBLE_REQUIRED_REVIEW, 'critic_completion': str(self.receipt)}

    def validate(self):
        return closure.validate_plan(self.path, self.plan)

    def test_four_actual_attempts_close_only_proven_infeasible_mandatory_path(self):
        original = self.path.read_bytes(); evidence = self.validate()
        self.assertEqual(evidence['review_path']['remaining'], 1)
        self.assertEqual(evidence['review_path']['required'], 2)
        self.assertFalse(evidence['production_finished']); self.assertFalse(evidence['shipment_authorized'])
        self.assertEqual(self.path.read_bytes(), original)
        self.assertEqual(closure.read(self.path)['usage']['storyboard_critics'], 4)

    def test_original_handback_helper_requires_hook_response_and_immutable_packet_claim(self):
        handback = self.write(self.out / 'returned-handback.json', self.report)
        self.assertEqual(closure.verify_original_handback(self.repo, self.packet, handback, self.claim), self.report)
        result = closure.original_critic_review(self.path, 4)
        self.assertEqual(result['reviewer_identity'], 'fourth-native-worker')
        self.assertEqual(result['report'], self.report)
        changed = copy.deepcopy(self.report); changed['phone_review']['verdict'] = 'pass'
        self.write(handback, changed)
        with self.assertRaisesRegex(ValueError, 'absent or ambiguous'):
            closure.verify_original_handback(self.repo, self.packet, handback, self.claim)
        self.write(handback, self.report); self.packet.write_text('{"changed": true}')
        with self.assertRaisesRegex(ValueError, 'exact paid packet'):
            closure.verify_original_handback(self.repo, self.packet, handback, self.claim)

    def test_missing_original_and_director_summary_never_create_rejection(self):
        self.receipt.unlink()
        self.write(self.out / 'storyboard_critic.json', self.report)
        self.write(self.out / 'WORKLOG.json', {'claim': 'The missing fourth worker returned REVISE.'})
        with self.assertRaisesRegex(ValueError, 'original critic response'):
            self.validate()

    def test_optional_surface_finish_and_incomplete_or_other_worker_reports_refused(self):
        original = copy.deepcopy(self.report)
        for case in ('surface', 'missing', 'identity', 'pass'):
            self.report = copy.deepcopy(original)
            if case == 'surface':
                for row in [*self.report['code_reports'].values(), self.report['phone_review']]:
                    row['blocking_defects'][0]['category'] = 'surface_finish'
            if case == 'missing': self.report['code_reports'].pop('b')
            if case == 'identity': self.report['phone_review']['reviewer_identity'] = 'another-worker'
            if case == 'pass':
                self.report['code_reports']['a']['verdict'] = self.report['phone_review']['verdict'] = 'pass'
            self.refresh_receipt()
            with self.subTest(case=case), self.assertRaises(ValueError):
                self.validate()

    def test_no_reserved_final_phone_native_work_count_reset_or_extra_review(self):
        original = copy.deepcopy(self.state)
        for case in ('three', 'five', 'final', 'native', 'manual', 'envelope'):
            self.state = copy.deepcopy(original)
            if case == 'three': self.state['usage']['storyboard_critics'] = 3
            if case == 'five': self.state['usage']['storyboard_critics'] = 5
            if case == 'final': self.state['events'][4]['final_timed_phone'] = {}
            if case == 'native': self.state['usage']['full_renders'] = 1
            if case == 'manual': self.state['events'].append({'kind': 'owner_codex_repair_granted'})
            if case == 'envelope': self.state['resource_envelope'] = {'storyboard_critics': 8}
            self.write(self.path, self.state)
            with self.subTest(case=case), self.assertRaises(ValueError):
                self.validate()
        self.state = original; self.write(self.path, original)
        hero = self.out / 'cinema/hero.mp4'; hero.parent.mkdir(); hero.write_bytes(b'original native hero')
        with self.assertRaisesRegex(ValueError, 'native film'):
            self.validate()

    def test_only_native_stop_completes_a_handback_and_parent_cannot_change_receipt(self):
        self.receipt.unlink()
        closure.record({**self.payload, 'hook_event_name': 'PostToolUse', 'tool_name': 'SubagentHandback',
                        'tool_input': {'message': self.payload['last_assistant_message']}}, self.workspace)
        self.assertFalse(self.receipt.exists())
        closure.record({**self.payload, 'last_assistant_message': 'Handback delivered.'}, self.workspace)
        self.assertTrue(self.receipt.exists())
        with self.assertRaisesRegex(ValueError, 'preserve the original'):
            closure.record({**self.payload, 'agent_id': 'parent-replacement'}, self.workspace)

    def test_close_requires_full_original_checkpoint_and_keeps_actual_four(self):
        with patch('publication_owner.require_owner'), patch('claude_checkpoint.save_with_recovery'), \
                patch.object(closure, 'checkpoint_proof', side_effect=ValueError('missing original checkpoint')):
            with self.assertRaisesRegex(ValueError, 'original checkpoint'):
                closure.close(self.path, self.plan)
        self.assertEqual(closure.read(self.path), self.state)
        with patch('publication_owner.require_owner'), patch('claude_checkpoint.mirror'), \
                patch('claude_checkpoint.save_with_recovery'), \
                patch.object(closure, 'checkpoint_proof', return_value='full-checkpoint') as proof:
            closure.close(self.path, self.plan)
            self.assertEqual(proof.call_count, 2)
            state = closure.read(self.path)
            self.assertEqual(state['usage']['storyboard_critics'], 4)
            self.assertIsNone(state['terminal_state'])
            self.assertFalse(closure.permits({'background_tasks': [{'id': 'paid-worker'}], 'session_crons': []}, self.path, state))
            self.assertTrue(closure.permits({'background_tasks': [], 'session_crons': []}, self.path, state))


if __name__ == '__main__':
    unittest.main()
