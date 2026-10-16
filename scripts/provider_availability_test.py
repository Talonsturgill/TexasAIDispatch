"""Real ledger/cache checks for a service probe and one no-verdict recovery."""
import copy
import json
from pathlib import Path
import unittest
from unittest.mock import Mock, patch
import independent_review as review
import independent_review_test as fixtures
import provider_availability as availability
import run_controller as controller


class ProviderAvailability(unittest.TestCase):
    def setUp(self):
        self.host = fixtures.AvailabilityTest('test_actual_capacity_error_is_distinct_from_rejection')
        self.host.setUp(); self.addCleanup(self.host.doCleanups)
        self.root, self.state = self.host.root, self.host.state
        self.raw = {'responseId': 'availability-only', 'usageMetadata': {'totalTokenCount': 8},
                    'candidates': [{'finishReason': 'STOP', 'content': {'parts': [{'text': 'OK'}]}}]}

    def failed(self):
        with self.assertRaisesRegex(ValueError, 'HTTP 402'):
            self.host.call(response=Mock(status_code=402, text='{"error":{"code":402,"message":"credits unavailable test-key"}}'))
        return next((self.root/'independent-review-cache').glob('*/attempt.json'))

    def probe(self, attempt=None, status=200, **kwargs):
        before = controller.read_state(self.state)['usage']['audiovisual_reviews']
        def post(*args, **options):
            self.assertEqual(controller.read_state(self.state)['usage']['audiovisual_reviews'], before+1)
            self.assertEqual(options['json']['generationConfig']['maxOutputTokens'], 8)
            self.assertEqual(options['json']['contents'][0]['parts'], [{'text': 'Reply OK.'}])
            return Mock(status_code=status, text='{"error":{"message":"credits unavailable test-key"}}')
        with patch.dict(availability.os.environ, {'GEMINI_API_KEY': 'test-key'}), \
             patch.object(availability.requests, 'post', side_effect=post), \
             patch.object(availability, 'streamed_response', return_value=self.raw):
            return availability.probe(self.state, after_attempt=attempt, **kwargs)

    def test_startup_is_charged_once_and_is_no_film_approval(self):
        path = self.probe()
        self.assertFalse((self.root/'phone.json').exists())
        proof = availability.verified_proof(path, self.state)
        self.assertEqual(availability.proof_problems(proof), [])
        with patch.object(availability.requests, 'post', side_effect=AssertionError('duplicate provider')):
            self.assertEqual(availability.probe(self.state), path)
        self.assertEqual(controller.read_state(self.state)['usage']['audiovisual_reviews'], 1)

    def test_402_probe_stays_failed_and_cannot_poll(self):
        with self.assertRaisesRegex(ValueError, 'HTTP 402'): self.probe(status=402)
        with patch.object(availability.requests, 'post', side_effect=AssertionError('duplicate provider')):
            with self.assertRaisesRegex(ValueError, 'no unchanged paid'): availability.probe(self.state)
        self.assertEqual(controller.read_state(self.state)['usage']['audiovisual_reviews'], 1)

    def test_successful_probe_enables_one_linked_charged_review(self):
        attempt = self.failed(); original = attempt.read_bytes()
        path = self.probe(attempt)
        self.assertFalse((self.root/'phone.json').exists())
        report, calls = self.host.call(availability=path)
        self.assertEqual(calls, 1)
        self.assertEqual(review.evidence_problems(report), [])
        self.assertEqual(attempt.read_bytes(), original)
        self.assertEqual(controller.read_state(self.state)['usage']['audiovisual_reviews'], 3)
        self.assertIn('availability_recovery', report['provider_evidence'])
        cached, calls = self.host.call(availability=path)
        self.assertEqual(cached, report); self.assertEqual(calls, 0)
        self.assertEqual(controller.read_state(self.state)['usage']['audiovisual_reviews'], 3)

    def test_recovery_keeps_original_rejection_and_has_no_second_recovery(self):
        attempt = self.failed(); path = self.probe(attempt)
        rejected = copy.deepcopy(self.host.value); rejected['verdict'] = 'revise'
        report, _ = self.host.call(raw=self.host.raw(rejected), availability=path)
        self.assertEqual(report['verdict'], 'revise')
        cached, calls = self.host.call(availability=path)
        self.assertEqual(cached['verdict'], 'revise'); self.assertEqual(calls, 0)
        self.assertEqual(controller.read_state(self.state)['usage']['audiovisual_reviews'], 3)

    def test_failed_health_never_enables_review(self):
        attempt = self.failed()
        with self.assertRaisesRegex(ValueError, 'HTTP 402'): self.probe(attempt, status=402)
        path = next((self.root/'provider-availability').glob('*/receipt.json'))
        with patch.object(review.requests, 'post', side_effect=AssertionError('unavailable review')):
            with self.assertRaises((ValueError, KeyError)): self.host.call(availability=path)
        self.assertEqual(controller.read_state(self.state)['usage']['audiovisual_reviews'], 2)

    def test_completed_response_or_verdict_refuses_probe_before_charge(self):
        attempt = self.failed()
        for name in ('response.json', 'report.json'):
            path = attempt.parent/name; path.write_text('{}')
            with self.assertRaisesRegex(ValueError, 'completed response or verdict'): self.probe(attempt)
            path.unlink()
        self.assertEqual(controller.read_state(self.state)['usage']['audiovisual_reviews'], 1)

    def test_failure_error_is_retained_without_credential(self):
        attempt = self.failed(); value = json.loads((attempt.parent/'failure.json').read_text())
        self.assertEqual(value['http_status'], 402)
        self.assertNotIn('test-key', value['sanitized_body'])
        self.assertIn('[redacted]', value['sanitized_body'])
        self.assertTrue(value['body_sha256'])

    def test_legacy_402_evidence_must_bind_actual_cache(self):
        attempt = self.failed(); (attempt.parent/'failure.json').unlink()
        evidence = self.root/'retained-failure.md'; evidence.write_text('HTTP 402 but a different request.')
        with self.assertRaisesRegex(ValueError, 'cache identity'): self.probe(attempt, failure_evidence=evidence)
        evidence.write_text('Actual HTTP 402 at '+str(attempt))
        path = self.probe(attempt, failure_evidence=evidence)
        self.assertEqual(availability.recovery_proof(path, attempt, self.state)['receipt_sha256'], review.digest(path))

    def test_tampered_receipt_response_or_attempt_cannot_enable_recovery(self):
        attempt = self.failed(); path = self.probe(attempt)
        original = path.read_bytes(); response = path.parent/'response.json'; response_bytes = response.read_bytes()
        response.write_text('{}')
        with self.assertRaisesRegex(ValueError, 'proof'): availability.recovery_proof(path, attempt, self.state)
        response.write_bytes(response_bytes)
        value = json.loads(original); value['model'] = 'other-model'; path.write_text(json.dumps(value))
        with self.assertRaises(ValueError): availability.recovery_proof(path, attempt, self.state)
        path.write_bytes(original)
        value = json.loads(attempt.read_text()); value['request_id'] = 'different'; attempt.write_text(json.dumps(value))
        with self.assertRaises(ValueError): availability.recovery_proof(path, attempt, self.state)
        self.assertEqual(controller.read_state(self.state)['usage']['audiovisual_reviews'], 2)

    def test_entire_remaining_route_must_be_funded_before_probe(self):
        with patch('repair_guard.production_budget_precheck', return_value={'feasible': False}), \
             patch.object(availability.requests, 'post', side_effect=AssertionError('unfunded provider')):
            with self.assertRaisesRegex(ValueError, 'complete remaining'): self.probe()
        self.assertEqual(controller.read_state(self.state)['usage']['audiovisual_reviews'], 0)

    def test_failed_child_is_charged_and_cannot_repeat(self):
        attempt = self.failed(); path = self.probe(attempt)
        with self.assertRaisesRegex(ValueError, 'HTTP 503'):
            self.host.call(response=Mock(status_code=503, text='{"error":"unavailable"}'), availability=path)
        with self.assertRaisesRegex(ValueError, 'no paid retry'):
            self.host.call(availability=path)
        self.assertEqual(controller.read_state(self.state)['usage']['audiovisual_reviews'], 3)

    def test_real_startup_receipt_unlocks_only_its_current_active_edition(self):
        path = self.probe()
        self.assertEqual(availability.research_receipt(self.state, '2026-09-30')['sha256'], review.digest(path))
        with self.assertRaisesRegex(ValueError, 'another or finished'):
            availability.research_receipt(self.state, '2026-10-16')
        value = json.loads(path.read_text()); value['available'] = False; path.write_text(json.dumps(value))
        with self.assertRaisesRegex(ValueError, 'before research'):
            availability.research_receipt(self.state, '2026-09-30')

    def test_startup_402_has_one_linked_recovery_after_service_is_restored(self):
        with self.assertRaisesRegex(ValueError, 'HTTP 402'): self.probe(status=402)
        attempt = self.root/'provider-availability/startup/attempt.json'
        path = self.probe(attempt)
        self.assertEqual(availability.research_receipt(self.state, '2026-09-30')['sha256'], review.digest(path))
        self.assertEqual(controller.read_state(self.state)['usage']['audiovisual_reviews'], 2)

    def test_metadata_only_or_missing_success_event_never_enables_workers(self):
        path = self.probe(); response = path.parent/'response.json'
        proof = availability.verified_proof(path, self.state)
        proof['response'] = '{"name":"models/gemini-3.8-flash","supportedGenerationMethods":["generateContent"]}'
        self.assertTrue(availability.proof_problems(proof))
        ledger = controller.read_state(self.state)
        ledger['events'] = [row for row in ledger['events'] if row.get('kind') != 'provider_availability_result']
        controller.save(self.state, ledger)
        with self.assertRaisesRegex(ValueError, 'absent from the retained ledger'):
            availability.verified_proof(path, self.state)


if __name__ == '__main__': unittest.main()
