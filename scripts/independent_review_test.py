"""Capacity recovery cannot relax evidence, refund work or buy another verdict."""
import copy
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch, Mock
import independent_review as r
import run_controller as c
import repair_guard as g
import quality_contract as q
import documentary_review as d


class AvailabilityTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.state = self.root / 'run_state.json'
        c.initialise(self.state, '2026-09-30', 'production')
        self.failure = {'schema': 'dispatch_review_transport_failure/1', 'role': 'phone',
                        'actor': '/root/phone_finish', 'observed_at': '2026-09-30T14:20:00Z',
                        'error': 'Selected model is at capacity. Please try a different model.'}
        self.failure_path = self.root / 'failure.json'
        self.failure_path.write_text(json.dumps(self.failure))
        self.bindings = dict(concept_sha256='concept', renderer_sha256='renderer',
                             quality_contract_sha256=q.fingerprint(), story_sha256='story',
                             policy_sha256='policy', claims_sha256='claims', board_sha256='board',
                             actions={}, film_sha256='film')
        c.reserve(self.state, {'storyboard_critics': 1}, 'assigned independent phone worker')
        ledger = c.read_state(self.state)
        self.failure['reservation_event_index'] = len(ledger['events']) - 1
        self.failure['reservation'] = ledger['events'][-1]
        self.failure['reservation_sha256'] = r.fingerprint(self.failure['reservation'])
        self.failure['assignment'] = {'role': 'phone', 'actor': self.failure['actor'],
                                     'board_sha256': 'board', 'film_sha256': 'film'}
        self.failure_path.write_text(json.dumps(self.failure))
        self.value = {'verdict': 'pass', 'weakest_frame': 'The completed supported camera image at the final cut.',
                      'blocking_defects': [], 'story_review': {'verdict': 'pass', 'blocking_defects': [],
                      'one_viewing_summary': 'Installed equipment and observed detections are distinct recorded outcomes.',
                      'opening_to_ending': 'The supported camera action ends with a clearly disclosed absent detection count.',
                      'weakest_transition': 'The final return to the camera is slower than the preceding supported transfer.'},
                      'action_reviews': [], 'phone_observations': {}}
        for key in q.policy()['criteria']:
            if key != 'sound':
                self.value['phone_observations'][key] = {'pass': True, 'start_s': 2, 'end_s': 4,
                    'observed': 'The supported camera image visibly lands above the caption band and holds its result.'}

    def raw(self, value=None):
        return {'responseId': 'independent-response', 'usageMetadata': {'totalTokenCount': 25},
                'candidates': [{'finishReason': 'STOP', 'content': {'parts': [
                    {'text': json.dumps(self.value if value is None else value)}]}}]}

    def call(self, response=None, raw=None):
        with patch.dict(r.os.environ, {'GEMINI_API_KEY': 'test-key'}), \
                patch.object(r, 'packet', return_value=({'current': 'evidence'}, self.bindings)), \
                patch.object(r, 'media_part', return_value=({'test': 'media'}, None, 'film')), \
                patch.object(r.requests, 'post', return_value=response or Mock(status_code=200)) as post, \
                patch.object(r, 'streamed_response', side_effect=lambda _: self.context_response(raw or self.raw())):
            result = r.run(self.root/'board.json', self.root/'claims.json', self.root/'film.mp4',
                           'phone', self.failure_path, self.state, self.root/'phone.json')
            return result, post.call_count

    def context_response(self, raw):
        value = copy.deepcopy(raw)
        attempt = next((self.root/'independent-review-cache').glob('*/attempt.json'))
        context_sha = json.loads(attempt.read_text())['review_context_sha256']
        review = r.response_object(value)
        review['review_context_sha256'] = context_sha
        value['candidates'][0]['content']['parts'][0]['text'] = json.dumps(review)
        return value

    def test_actual_capacity_error_is_distinct_from_rejection(self):
        self.assertFalse(r.failure_problems(self.failure, 'phone'))
        for change in ({'error': 'revise'}, {'verdict': 'revise'}, {'role': 'sound'}, {'actor': ''}):
            self.assertTrue(r.failure_problems({**self.failure, **change}, 'phone'))

    def test_actual_thread_limit_requires_exact_retained_transport_error(self):
        failure = {**self.failure, 'error': 'agent thread limit reached',
                   'raw_error': 'collab tool failed: agent thread limit reached'}
        self.assertFalse(r.failure_problems(failure, 'phone'))
        for change in ({'raw_error': ''}, {'raw_error': 'agent thread limit reached'},
                       {'raw_error': 'other tool failed: agent thread limit reached'},
                       {'raw_error': 'collab tool failed: agent thread limit reached later'},
                       {'error': 'server_overloaded'},
                       {'error': 'collab tool failed: agent thread limit reached'}):
            self.assertTrue(r.failure_problems({**failure, **change}, 'phone'))

    def test_frozen_critic_exhaustion_routes_without_refund(self):
        self.assertTrue(c.reserve(self.state, {'storyboard_critics': 6}, 'retained attempts')[0])
        before = copy.deepcopy(c.read_state(self.state)['resource_envelope'])
        report, calls = self.call()
        state = c.read_state(self.state)
        self.assertEqual(calls, 1)
        self.assertEqual(state['usage']['storyboard_critics'], 7)
        self.assertEqual(state['usage']['audiovisual_reviews'], 1)
        self.assertEqual(state['resource_envelope'], before)
        self.assertFalse(r.evidence_problems(report))
        self.assertFalse(q.phone_problems({'date': '2026-09-30'}, report))
        self.assertTrue(g.production_budget_precheck(state, 'provider')['feasible'])

    def test_completed_rejection_is_cached_unchanged(self):
        failed = copy.deepcopy(self.value)
        failed['verdict'] = 'revise'
        failed['blocking_defects'] = ['The completed image is hidden by the caption band.']
        failed['phone_observations']['contact_and_consequence']['pass'] = False
        report, _ = self.call(raw=self.raw(failed))
        self.assertEqual(report['verdict'], 'revise')
        self.assertTrue(q.phone_problems({'date': '2026-09-30'}, report))
        retained, calls = self.call()
        self.assertEqual(retained, report)
        self.assertEqual(calls, 0)
        self.assertEqual(c.read_state(self.state)['usage']['audiovisual_reviews'], 1)

    def test_failed_provider_attempt_remains_charged_and_cannot_poll(self):
        with self.assertRaisesRegex(ValueError, 'HTTP 503'):
            self.call(response=Mock(status_code=503))
        self.assertEqual(c.read_state(self.state)['usage']['audiovisual_reviews'], 1)
        with self.assertRaisesRegex(ValueError, 'no paid retry'):
            self.call()
        self.assertEqual(c.read_state(self.state)['usage']['audiovisual_reviews'], 1)

    def test_changed_verdict_or_film_binding_fails_provenance(self):
        report, _ = self.call()
        for change in ('verdict', 'film', 'raw', 'identity'):
            modified = copy.deepcopy(report)
            if change == 'verdict': modified['verdict'] = 'revise'
            elif change == 'film': modified['reviewed_preflight_sha256'] = 'other-film'
            elif change == 'raw': modified['provider_evidence']['response']['responseId'] = 'other-response'
            else: modified['reviewer_identity'] = 'director'
            self.assertTrue(r.evidence_problems(modified), change)

    def test_changed_inputs_during_request_do_not_create_verdict(self):
        with patch.dict(r.os.environ, {'GEMINI_API_KEY': 'test-key'}), \
                patch.object(r, 'packet', side_effect=[({'current': 'evidence'}, self.bindings),
                                                     ({'current': 'changed'}, self.bindings)]), \
                patch.object(r, 'media_part', return_value=({}, None, 'film')), \
                patch.object(r.requests, 'post', return_value=Mock(status_code=200)), \
                patch.object(r, 'streamed_response', side_effect=lambda _: self.context_response(self.raw())):
            with self.assertRaisesRegex(ValueError, 'inputs changed'):
                r.run(self.root/'board', self.root/'claims', self.root/'film', 'phone',
                      self.failure_path, self.state, self.root/'phone.json')
        self.assertFalse((self.root/'phone.json').exists())
        self.assertEqual(c.read_state(self.state)['usage']['audiovisual_reviews'], 1)

    def test_provider_budget_protects_all_separate_scorers_and_lenses(self):
        state = c.read_state(self.state)
        state['usage']['reboards'] = 3
        state['usage']['storyboard_critics'] = state['resource_envelope']['storyboard_critics']
        before = copy.deepcopy(state)
        result = g.production_budget_precheck(state, 'provider')
        self.assertTrue(result['feasible'])
        self.assertEqual(result['resources']['audiovisual_reviews']['required'], 8)
        self.assertEqual(result['resources']['scorer_calls']['required'], 3)
        self.assertEqual(result['resources']['storyboard_critics']['required'], 0)
        self.assertEqual(state, before)
        state['usage']['audiovisual_reviews'] = state['resource_envelope']['audiovisual_reviews'] - 7
        self.assertEqual(g.production_budget_precheck(state, 'provider')['deficits']['audiovisual_reviews'], 1)

    def test_simultaneous_rebinding_of_proof_and_report_fails(self):
        report, _ = self.call()
        for binding, field in (('film_sha256', 'reviewed_preflight_sha256'),
                               ('renderer_sha256', 'renderer_sha256'),
                               ('claims_sha256', None)):
            changed = copy.deepcopy(report)
            changed['provider_evidence']['bindings'][binding] = 'new-bytes'
            if field: changed[field] = 'new-bytes'
            else: changed['story_review']['claims_sha256'] = 'new-bytes'
            self.assertTrue(r.evidence_problems(changed), binding)
        removed = {k: v for k, v in report.items() if k != 'provider_evidence'}
        self.assertTrue(r.evidence_problems(removed))

    def test_unreserved_or_other_scope_cannot_recover(self):
        self.failure['reservation_event_index'] = 999
        self.failure_path.write_text(json.dumps(self.failure))
        with self.assertRaisesRegex(ValueError, 'retained ledger'):
            self.call()
        self.failure['reservation_event_index'] = 2
        self.failure['assignment']['film_sha256'] = 'other-film'
        self.failure_path.write_text(json.dumps(self.failure))
        with self.assertRaisesRegex(ValueError, 'another assigned input scope'):
            self.call()
        self.assertEqual(c.read_state(self.state)['usage']['audiovisual_reviews'], 0)

    def test_completed_host_rejection_cannot_buy_fallback(self):
        (self.root/'phone-critic-current.json').write_text(json.dumps({
            'verdict': 'revise', 'reviewed_preflight_sha256': 'film'}))
        with self.assertRaisesRegex(ValueError, 'no replacement verdict'):
            self.call()
        self.assertEqual(c.read_state(self.state)['usage']['audiovisual_reviews'], 0)

    def test_atomic_claim_blocks_parallel_duplicate_before_spending(self):
        cache = self.root/'independent-review-cache'/r.fingerprint(['phone', 'film'])
        with r.claim(cache/'transport.lock'):
            with self.assertRaisesRegex(ValueError, 'no duplicate paid call'):
                self.call()
        report, calls = self.call()
        self.assertEqual(calls, 1)
        self.assertEqual(c.read_state(self.state)['usage']['audiovisual_reviews'], 1)

    def test_completed_opening_verdicts_cannot_buy_replacement(self):
        for verdict in ('pass', 'revise'):
            path = self.root/'opening-a-critic.json'
            path.write_text(json.dumps({'verdict': verdict, 'reviewed_preflight_sha256': 'film'}))
            with self.assertRaisesRegex(ValueError, 'no replacement verdict'):
                self.call()
            self.assertEqual(c.read_state(self.state)['usage']['audiovisual_reviews'], 0)
            path.unlink()

    def test_real_packet_supplies_fetched_sources_and_creative_contract(self):
        actual_repo = r.REPO
        fixture = self.root/'fixture'
        paths = ['config/dispatch_rubric.yaml', 'config/quality_contract.json',
                 'config/documentary.json', 'config/creative_production.json', 'config/story_visuals.json',
                 'knowledge/craft/BOUNDED_CREATIVE_RELEASE.md', 'knowledge/craft/CREATIVE_DIRECTION.md',
                 '.claude/agents/storyboard-critic.md']
        for name in paths:
            target = fixture/name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes((actual_repo/name).read_bytes())
        root = fixture/'out/dispatch'
        (root/'sources').mkdir(parents=True)
        source = root/'sources/source.txt'
        source.write_text('Actual retained primary report says the installed camera count is separate from detections.')
        board = root/'storyboard.json'
        board.write_text(json.dumps({'date': '2026-09-30', 'scenes': [], 'story_contract': {'scenes': []}}))
        claims = root/'claims.json'
        claims.write_text(json.dumps({'claims': [{'id': 'c1', 'source_snapshot': 'out/dispatch/sources/source.txt'}]}))
        shipped = fixture/'runs/2026-09-28'
        shipped.mkdir(parents=True)
        (shipped/'dispatch.mp4').write_bytes(b'released fixture inventory')
        (shipped/'storyboard.json').write_text(json.dumps({'date': '2026-09-28', 'native_media': []}))
        unfinished = fixture/'runs/2026-09-29'
        unfinished.mkdir()
        (unfinished/'storyboard.json').write_text(json.dumps({'date': '2026-09-29', 'native_media': []}))
        with patch.object(r, 'REPO', fixture):
            text, _ = r.packet(board, claims, 'code', None)
            self.assertIn(source.read_text(), text['files'].values())
            self.assertIn('knowledge/craft/CREATIVE_DIRECTION.md', text['files'])
            self.assertIn('runs/2026-09-28/storyboard.json', text['files'])
            self.assertNotIn('runs/2026-09-29/storyboard.json', text['files'])
            with self.assertRaisesRegex(ValueError, 'both current complete treatment artifacts'):
                r.packet(board, claims, 'phone', None)
            source.unlink()
            with self.assertRaisesRegex(ValueError, 'snapshot missing'):
                r.packet(board, claims, 'code', None)


if __name__ == '__main__':
    unittest.main()
