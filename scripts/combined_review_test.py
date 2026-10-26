"""Tiny native-hook fixtures; no provider, rendering or production evidence mutation."""
import copy
import base64
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

import claude_runtime as runtime
import combined_review as combined
import completion_yield as closure
import publication_owner
import routine_continuation


class CombinedReviewTests(unittest.TestCase):
    def write(self, path, value):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(value, sort_keys=True) + '\n')
        return path

    def setUp(self):
        temporary = tempfile.TemporaryDirectory(); self.addCleanup(temporary.cleanup)
        self.workspace = Path(temporary.name).resolve(); self.repo = self.workspace / 'Dispatch'
        self.root = self.repo / 'out/dispatch'; self.state_path = self.root / 'run_state.json'
        self.owner = publication_owner.identity('parent')
        self.state = {'mode': 'production', 'run_id': '2026-10-25', 'usage': {'storyboard_critics': 3},
                      'terminal_state': None, 'events': []}
        for i in range(3):
            self.state['events'].append({'kind': 'reserved', 'resources': {'storyboard_critics': 1},
                'note': 'fixture code attempt ' + str(i + 1), 'publication_owner_sha256': self.owner,
                'publication_epoch': 'original-epoch'})
        self.write(self.state_path, self.state)
        self.write(self.workspace / routine_continuation.MARKER, {'schema': routine_continuation.SCHEMA,
            'run_id': self.state['run_id'], 'state': str(self.state_path)})
        self.packet = self.write(self.root / 'third-packet.json', {'role': 'storyboard-critic', 'date': self.state['run_id']})
        self.report = {'packet_sha256': combined.bound(self.packet)['sha256'], 'review_scope': 'code-plan',
            'verdict': 'revise', 'reviewer_identity': 'original-critic', 'blocking_defects': ['Fixture missing physical contact.']}
        self.claim = self.native_return(self.packet, self.report, 2)
        self.failure = self.write(self.root / 'third-original.json', self.report)
        before = self.repo / 'Film-before.tsx'; before.write_text('original fixture source')
        current = self.repo / 'Film.tsx'; current.write_text('corrected fixture source')
        self.state['events'].append({'kind': 'repair_authorized', 'repair_plan_sha256': 'fixture-plan',
            'repair_plan': {'failure_evidence': str(self.failure),
                'failure_evidence_sha256': combined.bound(self.failure)['sha256'],
                'changed_inputs': [{'path': str(current), 'after_sha256': combined.bound(current)['sha256'],
                    'before_path': str(before), 'before_sha256': combined.bound(before)['sha256']}]}})
        self.write(self.state_path, self.state)

    def native_return(self, packet, report, index, *, agent='original-critic', kind='storyboard-critic'):
        event = self.state['events'][index]
        claim = self.write(self.root / 'worker-dispatch-claims' / ('critic-' + str(index) + '.json'), {
            'schema': 'dispatch_worker_dispatch_claim/1', 'run_id': self.state['run_id'],
            'role': 'storyboard-critic', 'packet_sha256': combined.bound(packet)['sha256'],
            'reservation_event_index': index, 'reservation_sha256': closure.digest(event),
            'owner_sha256': self.owner, 'epoch': 'original-epoch'})
        closure.record({'hook_event_name': 'SubagentStop', 'session_id': 'parent',
            'agent_type': kind, 'agent_id': agent,
            'last_assistant_message': json.dumps(report)}, self.workspace)
        return claim

    def phone_rejection_fixture(self):
        """Actual October26 response shape, with real fixture Read/Write hook provenance."""
        import image_read_receipt as image
        from image_read_receipt_test import PNG
        import visual_observations as visual
        subprocess.run(['git', 'init', '-q', str(self.repo)], check=True, capture_output=True)
        subprocess.run(['git', '-C', str(self.repo), 'remote', 'add', 'origin', image.REMOTE],
                       check=True, capture_output=True)
        for path in (self.root / closure.CRITIC_RECEIPTS).glob('*.json'):
            path.unlink()
        claims = self.write(self.root / 'claims.json', {'claims': []})
        board = self.write(self.root / 'storyboard.json', {'date': self.state['run_id'], 'scenes': []})
        comparison = self.write(self.root / 'retained-comparison.json', {'fixture': 'original silent A/B'})
        codes, phones, options, bindings = {}, {}, [], []
        label = 'storyboard-critic, isolated phone comparison task'
        actor_payload = {'session_id': 'parent', 'agent_id': 'native-phone',
                         'agent_type': 'dispatch-visual-critic', 'cwd': str(self.workspace)}
        for key in ('a', 'b'):
            picture = self.write(self.root / 'openings' / (key + '.json'), {'date': self.state['run_id']})
            film = self.root / 'openings' / (key + '.mp4'); film.write_bytes(('original film ' + key).encode())
            page = self.root / 'openings' / ('motion-third-' + key) / 'sequence-000.png'
            page.parent.mkdir(); page.write_bytes(PNG)
            payload = {**actor_payload, 'hook_event_name': 'PostToolUse', 'tool_name': 'Read',
                'tool_use_id': 'third-read-' + key, 'tool_input': {'file_path': str(page)},
                'tool_response': {'type': 'image', 'file': {'base64': base64.b64encode(PNG).decode(),
                                                           'type': 'image/png'}}}
            image.record(payload, self.workspace)
            event = next(visual.load(path) for path in (self.root / 'image-tool-delivery').glob('*.json')
                         if visual.load(path)['source_file'] == str(page.relative_to(self.repo)))
            note = {'schema': visual.SCHEMA, 'image_event_key': event['event_key'],
                    'page': event['source_file'], 'image_sha256': event['source_sha256'], 'received': True,
                    'objects': ['phone', 'guest hand'], 'actions': ['hand lowers the phone'], 'text': None,
                    'observed': 'The guest hand lowers the phone toward the table in the retained fixture.',
                    'literal_error': None}
            target = self.repo / event['observation_path']
            write = {**actor_payload, 'hook_event_name': 'PreToolUse', 'tool_name': 'Write',
                     'tool_use_id': 'third-write-' + key,
                     'tool_input': {'file_path': str(target), 'content': json.dumps(note)}}
            visual.guard(write, self.workspace)
            target.parent.mkdir(parents=True, exist_ok=True); target.write_text(json.dumps(note))
            visual.record_write({**write, 'hook_event_name': 'PostToolUse'}, self.workspace)
            sequence = self.write(page.parent / 'index.json', {'pages': [{'file': page.name,
                'sha256': visual.digest(page), 'samples': [{'frame': 0}, {'frame': 24}]}]})
            identity = {'concept_sha256': 'concept-' + key, 'renderer_sha256': 'original-renderer',
                        'quality_contract_sha256': 'original-quality',
                        'story_review': {'story_sha256': 'story-' + key, 'policy_sha256': 'story-policy',
                                         'claims_sha256': combined.bound(claims)['sha256']}}
            code_binding = {'review_scope': 'code-plan', **identity}
            bindings.append({'id': key, 'report_bindings': code_binding})
            codes[key] = {**copy.deepcopy(code_binding), 'verdict': 'pass', 'blocking_defects': [],
                          'reviewer_identity': 'original code critic'}
            phone_binding = {'review_scope': 'exact-muted-phone-preflight', **identity,
                             'reviewed_preflight_sha256': combined.bound(film)['sha256']}
            phones[key] = {**copy.deepcopy(phone_binding), 'verdict': 'revise', 'reviewer_identity': label,
                          'blocking_defects': [{'category': 'continuity', 'scene_id': 's3',
                              'defect': 'The same guest hand changes skin tone across the ordering cuts.'}]}
            options.append({'id': key, 'board': combined.bound(picture), 'film': combined.bound(film),
                'motion_sequence': combined.bound(sequence), 'report_bindings': phone_binding,
                'comparison': {'comparison_sha256': combined.bound(comparison)['sha256']}})
        code_packet = self.write(self.root / 'second-code-packet.json', {'role': 'storyboard-critic',
            'date': self.state['run_id'], 'claims': combined.bound(claims),
            'code_report_bindings': {'treatments': bindings}})
        self.native_return(code_packet, {'packet_sha256': combined.bound(code_packet)['sha256'],
                           'review_scope': 'code-plan', 'verdict': 'pass', 'code_reports': codes}, 1,
                           agent='native-code')
        self.packet = self.write(self.root / 'third-packet.json', {'role': 'storyboard-critic',
            'date': self.state['run_id'], 'phone_mode': 'comparison',
            'review_scope': 'exact-muted-phone-preflight', 'board': combined.bound(board),
            'claims': combined.bound(claims), 'phone_options': options,
            'public_visual_evidence': visual.CONTRACT, 'image_read_policy': runtime.image_read_policy(self.state['run_id'])})
        self.report = {'packet_sha256': combined.bound(self.packet)['sha256'],
            'schema_note': 'One original comparison handback; no top-level verdict or reviewer label.',
            'status': 'complete', 'role': 'storyboard-critic', 'review_scope': 'exact-muted-phone-preflight',
            'observation_directory': str(target.parent), 'phone_reports': phones,
            'selection': {'selected': 'b', 'comparison_sha256': combined.bound(comparison)['sha256'],
                          'reviewer_identity': label, 'blocking_defects': phones['b']['blocking_defects']},
            'consolidated_correction_for_selected_b': 'Preserve the same hand through the ordering cuts.'}
        self.native_return(self.packet, self.report, 2, agent='native-phone', kind='dispatch-visual-critic')
        self.write(self.failure, self.report)
        self.state['events'][-1]['repair_plan']['failure_evidence_sha256'] = combined.bound(self.failure)['sha256']
        self.write(self.state_path, self.state)
        self.write(self.root / 'openings/selection.json', self.report['selection'])
        self.coverage = self.write(self.root / 'third-phone-coverage.json', visual.coverage(self.packet, target.parent))
        return code_packet

    def test_original_third_phone_rejection_funds_combined_correction_with_retained_images(self):
        self.phone_rejection_fixture()
        before = self.state_path.read_bytes()
        proof = combined.eligibility(self.state_path)
        self.assertEqual(4, proof['critic_attempt'])
        self.assertEqual(combined.bound(self.coverage), proof['prior_phone_review']['image_coverage'])
        import review_limit
        remaining = review_limit.remaining_review_path(self.state, self.state_path)
        self.assertEqual((3, 2, True), (remaining['ordinary_required'], remaining['required'], remaining['feasible']))
        self.assertEqual(before, self.state_path.read_bytes())
        # New capture slots can change only after the old evidence is retained. The
        # original third-review image sequences and public observations stay intact.
        (self.root / 'openings/selection.json').unlink()
        (self.root / 'openings/a.mp4').write_bytes(b'new diagnostic capture fixture')
        self.assertEqual(proof, combined.eligibility(self.state_path))

    def test_phone_route_refuses_missing_original_code_pass_or_changed_public_observation(self):
        code_packet = self.phone_rejection_fixture()
        receipt = next((self.root / closure.CRITIC_RECEIPTS).glob(combined.bound(code_packet)['sha256'] + '-*.json'))
        original = receipt.read_bytes(); receipt.unlink()
        with self.assertRaises(ValueError): combined.budget_eligibility(self.state_path)
        receipt.write_bytes(original)
        fact = Path(combined.read(self.coverage)['sequences'][0]['pages'][0]['observation']['path'])
        fact.write_text(fact.read_text() + ' ')
        with self.assertRaisesRegex(ValueError, 'changed'):
            combined.budget_eligibility(self.state_path)

    def test_phone_route_refuses_parent_selection_and_transplanted_code_identity(self):
        code_packet = self.phone_rejection_fixture()
        self.write(self.root / 'openings/selection.json', {**self.report['selection'], 'selected': 'a'})
        with self.assertRaisesRegex(ValueError, 'existing comparison'):
            combined.budget_eligibility(self.state_path)
        self.write(self.root / 'openings/selection.json', self.report['selection'])
        # Even an original native pass cannot approve different rendered inputs.
        receipt = next((self.root / closure.CRITIC_RECEIPTS).glob(combined.bound(code_packet)['sha256'] + '-*.json'))
        original = combined.read(receipt)['report']; receipt.unlink()
        original['code_reports']['b']['renderer_sha256'] = 'different original renderer'
        self.native_return(code_packet, original, 1, agent='native-code')
        with self.assertRaisesRegex(ValueError, 'exact code-approved'):
            combined.budget_eligibility(self.state_path)

    def test_original_third_rejection_funds_one_combined_and_one_final_without_changing_ledger(self):
        before = self.state_path.read_bytes()
        proof = combined.eligibility(self.state_path)
        self.assertEqual(proof['critic_attempt'], 4)
        self.assertEqual(proof['reviewer_identity'], 'original-critic')
        import review_limit
        remaining = review_limit.remaining_review_path(self.state, self.state_path)
        self.assertEqual((3, 2, True), (remaining['ordinary_required'], remaining['required'], remaining['feasible']))
        self.assertEqual(before, self.state_path.read_bytes())
        self.state['usage']['storyboard_critics'] = 4
        self.state['events'].append({'kind': 'reserved', 'resources': {'storyboard_critics': 1},
            'note': 'fixture combined fourth', 'publication_owner_sha256': self.owner, 'publication_epoch': 'original-epoch'})
        self.write(self.state_path, self.state)
        self.assertEqual(proof, combined.eligibility(self.state_path, charged=True))

    def test_parent_report_without_native_completion_cannot_authorize_diagnostic_capture(self):
        for path in (self.root / closure.CRITIC_RECEIPTS).glob('*.json'):
            path.unlink()
        with self.assertRaisesRegex(ValueError, 'original critic response'):
            combined.budget_eligibility(self.state_path)
        import review_limit
        remaining = review_limit.remaining_review_path(self.state, self.state_path)
        self.assertFalse(remaining['combined_eligible'])
        self.assertEqual(3, remaining['required'])

    def test_route_refuses_wrong_count_narration_old_edition_or_existing_selection(self):
        for edit in ({'usage': {'storyboard_critics': 2}}, {'usage': {'storyboard_critics': 4}},
                     {'usage': {'storyboard_critics': 5}}, {'usage': {'storyboard_critics': 3, 'tts_calls': 1}},
                     {'run_id': '2026-10-24'}):
            self.write(self.state_path, {**self.state, **edit})
            with self.assertRaises(ValueError):
                combined.budget_eligibility(self.state_path)
        self.write(self.state_path, self.state)
        self.write(self.root / 'openings/selection.json', {'selected': 'a'})
        with self.assertRaisesRegex(ValueError, 'existing comparison'):
            combined.budget_eligibility(self.state_path)

    def test_capture_requires_authorized_correction_of_exact_original_rejection(self):
        self.state['events'].pop(); self.write(self.state_path, self.state)
        self.assertEqual(4, combined.budget_eligibility(self.state_path)['critic_attempt'])
        with self.assertRaisesRegex(ValueError, 'authorize'):
            combined.eligibility(self.state_path)

    def packet_fixture(self):
        source = self.repo / 'Film.tsx'
        claims = self.write(self.root / 'claims.json', {'claims': []})
        options = []
        for key in ('a', 'b'):
            board = {'date': self.state['run_id'], 'scenes': [{'id': 's1', 'visual_description': key}]}
            path = self.write(self.root / ('opening-' + key + '.json'), board)
            copy_path = self.write(self.root / 'openings' / (key + '.json'), board)
            film = self.root / 'openings' / (key + '.mp4'); film.write_bytes(('fixture film ' + key).encode())
            sequence = self.write(self.root / ('motion-' + key + '.json'), {'pages': []})
            self.write(self.root / 'openings' / (key + '-inspection.json'), {'fixture': True})
            options.append({'id': key, 'board': runtime.bound(copy_path), 'film': runtime.bound(film),
                'motion_sequence': runtime.bound(sequence), 'report_bindings': {'story_review': {}}})
        board = self.write(self.root / 'storyboard.json', combined.read(self.root / 'opening-a.json'))
        data = {'role': 'storyboard-critic', 'date': self.state['run_id'], 'instructions': 'Read current full guides.',
            'agent_assignment': runtime.assignment('storyboard-critic', self.state['run_id']),
            'agent_contracts': runtime.contracts('storyboard-critic'), 'brief': '.claude/agents/storyboard-critic.md',
            'board': runtime.bound(board), 'claims': runtime.bound(claims),
            'treatments': [runtime.bound(self.root / ('opening-' + key + '.json')) for key in ('a', 'b')]}
        base = self.write(self.root / 'base-packet.json', data)
        self.write(self.root / 'openings/comparison.json', {'combined_code_review': combined.eligibility(self.state_path)})
        return source, options, base

    def test_combined_packet_keeps_both_code_and_actual_film_bindings_and_refuses_timed_mode(self):
        source, options, base = self.packet_fixture()
        with patch('critic_gate.REPO', self.repo), patch('critic_gate.renderer_files', return_value=[source]), \
             patch.object(runtime, 'phone_options', side_effect=lambda *a, **k: copy.deepcopy(options)):
            result = runtime.phone_packet(base, self.state_path, ['a', 'b'], combined_code_review=True)
            self.assertEqual(['a', 'b'], [r['id'] for r in result['code_report_bindings']['treatments']])
            self.assertEqual(['a', 'b'], [r['id'] for r in result['phone_options']])
            self.assertFalse(combined.packet_problems(result))
            changed = copy.deepcopy(result); changed['code_report_bindings']['treatments'][1]['board']['sha256'] = 'changed'
            self.assertTrue(combined.packet_problems(changed))
            with self.assertRaisesRegex(ValueError, 'separate final'):
                runtime.phone_packet(base, self.state_path, ['current'], current=True, combined_code_review=True)

    def test_import_retains_original_verdicts_and_parent_edits_cannot_pass_selection(self):
        self.exercise_import_original_verdicts()

    def test_phone_rejection_uses_same_fourth_import_and_preserves_original_third_images(self):
        self.phone_rejection_fixture()
        prior = combined.budget_eligibility(self.state_path)['prior_phone_review']
        # Retain the original rejected selection before importing the new original.
        (self.root / 'openings/selection.json').rename(self.root / 'third-selection.json')
        self.exercise_import_original_verdicts()
        self.assertEqual(prior['image_coverage'], combined.bound(self.coverage))
        self.assertEqual(self.report['selection'], combined.read(self.root / 'third-selection.json'))

    def exercise_import_original_verdicts(self):
        source, options, base = self.packet_fixture()
        with patch('critic_gate.REPO', self.repo), patch('critic_gate.renderer_files', return_value=[source]), \
             patch.object(runtime, 'phone_options', side_effect=lambda *a, **k: copy.deepcopy(options)), \
             patch.object(runtime, 'image_coverage_problems', side_effect=lambda *args: []):
            packet = self.write(self.root / 'combined-packet.json', runtime.phone_packet(
                base, self.state_path, ['a', 'b'], combined_code_review=True))
            self.state['usage']['storyboard_critics'] = 4
            self.state['events'].append({'kind': 'reserved', 'resources': {'storyboard_critics': 1},
                'note': 'fixture combined fourth', 'publication_owner_sha256': self.owner, 'publication_epoch': 'original-epoch'})
            self.write(self.state_path, self.state)
            reports = {key: {'review_scope': 'code-plan', 'verdict': 'pass', 'reviewer_identity': 'original-critic',
                'story_review': {'claims_sha256': combined.bound(self.root / 'claims.json')['sha256']}} for key in ('a', 'b')}
            from visual_observations import actor
            directory = self.root / 'visual-observations' / actor({'session_id': 'parent',
                'agent_id': 'combined-critic', 'agent_type': 'dispatch-visual-critic'})
            response = {'schema': combined.HANDBACK, 'packet_sha256': combined.bound(packet)['sha256'],
                'reviewer_identity': 'original-critic', 'code_reports': reports,
                'selection': {'selected': 'a', 'reviewer_identity': 'original-critic'},
                'phone_review': {'verdict': 'revise', 'reviewer_identity': 'original-critic'},
                'observation_directory': str(directory)}
            claim = self.native_return(packet, response, 4, agent='combined-critic', kind='dispatch-visual-critic')
            handback = self.write(self.root / 'combined-original.json', response)
            coverage = self.write(self.root / 'coverage.json', {'sequences': [{'pages': [
                {'observation': {'path': str(directory / 'fixture-page.json')}}]}]})
            imported = combined.import_handback(packet, handback, claim, coverage)
            self.assertEqual('combined-critic', imported['native_reviewer_identity'])
            # A process interruption after writing selection cannot strand the same original import.
            combined.import_handback(packet, handback, claim, coverage)
            self.assertEqual(response['phone_review'], combined.read(self.root / 'openings/combined-phone-review.json'))
            with patch('critic_gate.problems', return_value=[]), \
                 patch('critic_gate.film_review_problems', return_value=['original phone REVISE']) as gate:
                self.assertIn('original phone REVISE', combined.completed_problems(self.root))
                self.assertEqual(response['phone_review'], gate.call_args.args[1])
            with patch('critic_gate.problems', return_value=[]), \
                 patch('critic_gate.film_review_problems', return_value=[]):
                self.assertEqual([], combined.completed_problems(self.root))
            altered = copy.deepcopy(response['phone_review']); altered['verdict'] = 'pass'
            self.write(self.root / 'openings/combined-phone-review.json', altered)
            self.assertTrue(combined.completed_problems(self.root))

    def test_original_paired_code_schema_is_eligible_and_reverted_correction_is_not(self):
        for path in (self.root / closure.CRITIC_RECEIPTS).glob('*.json'):
            path.unlink()
        code = {key: {**self.report, 'reviewer_identity': 'original-critic'} for key in ('a', 'b')}
        paired = {'schema': 'dispatch_storyboard_critic_code_handoff', 'review_scope': 'code-plan',
            'packet_sha256': self.report['packet_sha256'], 'combined_verdict': 'revise', 'reports': code}
        self.native_return(self.packet, paired, 2)
        self.write(self.failure, paired)
        self.state['events'][-1]['repair_plan']['failure_evidence_sha256'] = combined.bound(self.failure)['sha256']
        self.write(self.state_path, self.state)
        self.assertEqual(4, combined.eligibility(self.state_path)['critic_attempt'])
        (self.repo / 'Film.tsx').write_text('original fixture source')
        with self.assertRaisesRegex(ValueError, 'inputs or their original baselines changed'):
            combined.eligibility(self.state_path)

    def test_combined_plan_uses_guarded_opus_leaf_and_replans_after_one_charge(self):
        source, options, base = self.packet_fixture()
        brief = self.repo / '.claude/agents/storyboard-critic.md'; brief.parent.mkdir(parents=True)
        brief.write_bytes((runtime.REPO / '.claude/agents/storyboard-critic.md').read_bytes())
        with patch('critic_gate.REPO', self.repo), patch('critic_gate.renderer_files', return_value=[source]), \
             patch.object(runtime, 'phone_options', side_effect=lambda *a, **k: copy.deepcopy(options)):
            packet = self.write(self.root / 'combined-packet.json', runtime.phone_packet(
                base, self.state_path, ['a', 'b'], combined_code_review=True))
            contracts = combined.read(packet)['agent_contracts']
            with patch.object(runtime, 'REPO', self.repo), patch.object(runtime, 'contracts', return_value=contracts), \
                 patch('agent_runtime.required_inputs'), \
                 patch('publication_owner.enabled', return_value=True), patch('publication_owner.require_owner'), \
                 patch('publication_owner.has_unclaimed_worker_reservation', return_value=False), \
                 patch('publication_owner.claim_worker', return_value=None):
                plan = runtime.plan('storyboard-critic', packet, 'combined_fourth', 'Review both code treatments and both complete films.')
                self.assertFalse(plan['dispatch_ready'])
            self.state['usage']['storyboard_critics'] = 4
            self.state['events'].append({'kind': 'reserved', 'resources': {'storyboard_critics': 1},
                'note': 'fixture combined fourth', 'publication_owner_sha256': self.owner, 'publication_epoch': 'original-epoch'})
            self.write(self.state_path, self.state)
            claim = self.write(self.root / 'fourth-claim.json', {'fixture': 'one charged claim'})
            with patch.object(runtime, 'REPO', self.repo), patch.object(runtime, 'contracts', return_value=contracts), \
                 patch('agent_runtime.required_inputs'), \
                 patch('publication_owner.enabled', return_value=True), patch('publication_owner.require_owner'), \
                 patch('publication_owner.has_unclaimed_worker_reservation', return_value=True), \
                 patch('publication_owner.claim_worker', return_value=claim):
                plan = runtime.plan('storyboard-critic', packet, 'combined_fourth', 'Review both code treatments and both complete films.')
                self.assertTrue(plan['dispatch_ready'])
                self.assertEqual('dispatch-visual-critic', plan['agent_args']['subagent_type'])
                self.assertEqual(('claude-opus-5-5', 'high'), tuple(plan['assignment'][key] for key in ('model', 'effort')))
                with self.assertRaisesRegex(ValueError, 'Read-only code worker'):
                    runtime.plan('storyboard-critic', packet, 'combined_fourth', 'Review both code and films.', resume_agent='old-code-worker')


if __name__ == '__main__':
    unittest.main()
