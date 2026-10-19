"""A corrected public task keeps all gates and charges without treating refusal as outage."""
import copy
from datetime import datetime, timezone
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

import autonomous_completion as completion
import claude_runtime as runtime
import independent_review
import review_prompt_repair as repair
import run_controller as controller


class PromptRepairTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name).resolve(); self.package = self.root/'out/dispatch'
        self.package.mkdir(parents=True); self.state = self.package/'run_state.json'
        root_patch = patch.object(repair, 'REPO', self.root)
        root_patch.start(); self.addCleanup(root_patch.stop)
        self.assertTrue(controller.initialise(self.state, '2026-10-19', 'production')[0])
        def ref(name, text):
            p = self.package/name; p.write_text(text)
            return {'path': str(p), 'sha256': repair.digest(p)}
        board = ref('storyboard.json', '{"date":"2026-10-19","story_contract":{"director_identity":"separate Sonnet director"}}')
        claims = ref('claims.json', '{"claims":[]}')
        guide = ref('guide.md', 'Original public visual review guide.')
        self.old = {'role': 'storyboard-critic', 'date': '2026-10-19', 'board': board,
            'claims': claims, 'brief': guide, 'instructions': 'Review both complete films with the full rubric.',
            'phone_mode': 'comparison', 'phone_options': [
                {'id': name, 'board': board, 'film': ref(name+'.mp4', name+' unchanged film bytes'),
                 'motion_sequence': ref(name+'-index.json', '{"pages":[]}')}
                for name in ('a', 'b')], 'image_read_policy': runtime.image_read_policy('2026-10-19')}
        self.original = self.package/'original-packet.json'; self.original.write_text(json.dumps(self.old))
        self.new = copy.deepcopy(self.old)
        Path(guide['path']).write_text('Current public visual facts guide; final conclusions only.')
        self.new['brief']['sha256'] = repair.digest(guide['path'])
        runtime.image_reading(self.new)
        self.revised = self.package/'revised-packet.json'; self.revised.write_text(json.dumps(self.new))
        for number in range(7):
            ok, message = controller.reserve(self.state, {'storyboard_critics': 1},
                ('failed current phone ' + repair.digest(self.original)[:8]) if number == 6 else 'prior actual review')
            self.assertTrue(ok, message)
        state = controller.read_state(self.state); index = len(state['events'])-1
        self.error = self.package/'actual-refusal.txt'
        self.error.write_text("API Error: Opus 5.5's safeguards flagged this message [reasoning_extraction].")
        self.receipt = {'schema': 'dispatch_review_prompt_failure/1', 'run_id': state['run_id'],
            'role': 'phone', 'status': 'refused', 'verdict': None, 'category': 'reasoning_extraction',
            'provider_unavailable': False, 'model': 'claude-opus-5-5', 'effort': 'high',
            'actor': 'actual_phone_actor_123', 'director_identity': 'separate Sonnet director',
            'observed_at': datetime.now(timezone.utc).isoformat(), 'error': self.error.read_text(),
            'error_evidence': {'path': str(self.error), 'sha256': repair.digest(self.error)},
            'reservation_event_index': index, 'reservation_sha256': repair.sha(repair.canonical(state['events'][index])),
            'original_packet_sha256': repair.digest(self.original)}
        self.receipt_path = self.package/'receipt.json'; self.receipt_path.write_text(json.dumps(self.receipt))
        self.output = self.package/'capacity.json'
        self.plan = repair.prepare(self.state, self.receipt_path, self.original, self.revised, self.output)

    def test_real_grant_funds_four_reviews_and_full_remaining_path_without_changing_history(self):
        before = controller.read_state(self.state)
        ok, message = completion.grant_capacity(self.state, self.output)
        self.assertTrue(ok, message)
        after = controller.read_state(self.state)
        self.assertEqual(after['resource_envelope'], before['resource_envelope'])
        self.assertEqual(after['usage'], before['usage'])
        self.assertEqual(after['events'][:len(before['events'])], before['events'])
        grant = after['events'][-1]
        self.assertEqual(grant['reason'], repair.REASON)
        self.assertTrue(grant['grants_no_review_approval'])
        precheck = json.loads(grant['precheck_json'])
        self.assertEqual(precheck['resources']['storyboard_critics']['required'], 4)
        for key in ('reboards', 'preflight_renders', 'full_renders', 'audiovisual_reviews', 'scorer_calls', 'tts_calls'):
            self.assertGreater(precheck['resources'][key]['required'], 0)
        self.assertFalse(completion.replay(after)[1])
        self.assertFalse(completion.grant_capacity(self.state, self.output)[0])
        self.assertTrue(controller.reserve(self.state, {'storyboard_critics': 1}, 'new public facts task precharge')[0])
        self.assertFalse(completion.replay(controller.read_state(self.state))[1])

    def test_refusal_never_becomes_a_provider_outage_and_only_corrected_same_model_task_qualifies(self):
        self.assertNotIn('reasoning_extraction', independent_review.ERRORS)
        state = controller.read_state(self.state)
        for change in ({'provider_unavailable': True}, {'role': 'code'}, {'category': 'general_harms'},
                       {'model': 'claude-sonnet-5-5'}, {'status': 'completed'}, {'verdict': 'pass'}):
            bad = copy.deepcopy(self.plan); receipt = {**self.receipt, **change}
            text = json.dumps(receipt); bad[repair.FIELD]['receipt_json'] = text
            bad[repair.FIELD]['receipt_sha256'] = bad['failure_evidence_sha256'] = repair.sha(text)
            self.assertFalse(repair.eligible(state, bad, receipt), change)
        for change in ({'provider': 'other'}, {'model': 'claude-sonnet-5-5'}, {'context': 'same'}, {'attempts': 2}):
            bad = copy.deepcopy(self.plan); bad['retry'].update(change)
            self.assertFalse(repair.eligible(state, bad, self.receipt), change)

    def test_controller_cli_reports_the_complete_path_before_the_correction(self):
        result = subprocess.run([sys.executable, str(Path(controller.__file__)), '--state', str(self.state),
            'production-budget', '--review-route', 'host', '--repair-plan', str(self.output)],
            capture_output=True, text=True)
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        budget = json.loads(result.stdout)
        self.assertEqual(budget['resources']['storyboard_critics']['required'], 4)
        self.assertEqual(budget['deficits']['storyboard_critics'], 4)
        self.assertFalse(budget['feasible'])

    def test_changed_footage_removed_guides_and_unchanged_prompt_are_ineligible(self):
        state = controller.read_state(self.state)
        for change in ('film', 'guide', 'contract', 'instructions'):
            bad = copy.deepcopy(self.plan); new = copy.deepcopy(self.new)
            if change == 'film': new['phone_options'][0]['film']['sha256'] = '0'*64
            elif change == 'guide': new.pop('brief')
            elif change == 'contract': new.pop('public_visual_evidence')
            else: new['instructions'] = self.old['instructions']
            text = json.dumps(new); bad[repair.FIELD]['revised_packet_json'] = text
            bad[repair.FIELD]['revised_packet_sha256'] = repair.sha(text)
            self.assertFalse(repair.eligible(state, bad, self.receipt), change)

    def test_stale_or_modified_current_evidence_cannot_receive_capacity(self):
        self.error.write_text('different response')
        before = self.state.read_bytes()
        self.assertFalse(completion.grant_capacity(self.state, self.output)[0])
        self.assertEqual(self.state.read_bytes(), before)

    def test_actual_error_receipt_is_captured_mechanically_without_a_call_or_ledger_change(self):
        before = self.state.read_bytes(); output = self.package/'captured-receipt.json'
        receipt = repair.record_failure(self.state, self.error, self.receipt['actor'], self.original, output)
        self.assertEqual(receipt['reservation_sha256'], self.receipt['reservation_sha256'])
        self.assertEqual(receipt['error'], self.error.read_text())
        self.assertFalse(receipt['provider_unavailable'])
        self.assertEqual(receipt['director_identity'], 'separate Sonnet director')
        self.assertEqual(self.state.read_bytes(), before)
        with self.assertRaises(FileExistsError):
            repair.record_failure(self.state, self.error, self.receipt['actor'], self.original, output)

    def test_the_real_multiline_host_refusal_is_captured_and_other_text_is_not(self):
        real = ("API Error: Opus 5.5's safeguards flagged this message (https://www.anthropic.com/legal/aup). "
                "This sometimes happens with safe, normal conversations.\n\nDetails: `[reasoning_extraction]`\n\n"
                "Request ID: req_example\n")
        path = self.package/'real-refusal.txt'; path.write_text(real)
        output = self.package/'real-receipt.json'
        receipt = repair.record_failure(self.state, path, self.receipt['actor'], self.original, output)
        self.assertEqual(receipt['error'], real)
        for text in (real.replace('reasoning_extraction', 'general_harms'),
                     real.replace('Opus 5.5', 'Another model'), 'a different failure'):
            path.write_text(text)
            with self.assertRaises(ValueError):
                repair.record_failure(self.state, path, self.receipt['actor'], self.original,
                                      self.package/('bad-' + str(abs(hash(text))) + '.json'))

    def test_new_fact_protocol_is_separate_from_legacy_policy_and_contains_no_evaluation_field(self):
        self.assertNotIn('public_visual_evidence', self.old)
        self.assertEqual(self.new['image_read_policy'], self.old['image_read_policy'])
        self.assertEqual(self.new['public_visual_evidence']['fields'], ['page', 'objects', 'actions', 'text'])
        self.assertIn('only in the final review JSON', self.new['instructions'])
        self.assertFalse(controller.read_state(self.state)['terminal_state'])


if __name__ == '__main__':
    unittest.main()
