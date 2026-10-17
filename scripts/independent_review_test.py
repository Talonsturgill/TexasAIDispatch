"""Capacity recovery cannot relax evidence, refund work or buy another verdict."""
import copy
import hashlib
import json
import tempfile
import subprocess
import sys
import unittest
from pathlib import Path
from unittest.mock import patch, Mock
import independent_review as r
import run_controller as c
import repair_guard as g
import quality_contract as q
import documentary_review as d


class AvailabilityTest(unittest.TestCase):
    def test_av_context_omits_only_opaque_signatures_without_editing_raw(self):
        raw = {'responseId': 'original', 'usageMetadata': {'totalTokenCount': 9},
               'candidates': [{'finishReason': 'STOP', 'content': {'parts': [
                   {'thought': True, 'text': 'Retained provider reasoning.', 'thoughtSignature': 'opaque'},
                   {'text': '{"pass":false,"defects":["Exact original rejection"]}',
                    'thoughtSignature': 'another opaque signature'}]}}]}
        original = copy.deepcopy(raw)
        context = r.audiovisual_context(raw)
        self.assertEqual(raw, original)
        self.assertEqual(r.response_object(context), r.response_object(raw))
        self.assertEqual(context['usageMetadata'], raw['usageMetadata'])
        for before, after in zip(raw['candidates'][0]['content']['parts'],
                                 context['candidates'][0]['content']['parts']):
            self.assertEqual(after, {k: v for k, v in before.items() if k != 'thoughtSignature'})

    def test_declared_same_source_excerpts_preserve_intervening_text(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'source.txt'
            raw = 'The unit showed spikes.\nAn intervening limitation.\nThe condition remains unconfirmed.'
            path.write_text(raw)
            row = {'id': 'c6', 'quote': 'The unit showed spikes.\nThe condition remains unconfirmed.',
                   'quote_is_excerpt': True}
            result = r.source_windows(path, [row], context_chars=2)
            self.assertEqual(result['excerpt_groups'][0]['text'], raw)
            self.assertEqual(result['excerpt_groups'][0]['original_quote'], row['quote'])
            quotes = [q for w in result['windows'] for q in w['quotes']]
            self.assertEqual([q['excerpt_index'] for q in quotes], [0, 1])
            for q in quotes:
                self.assertEqual(q['text'], raw[q['raw_start']:q['raw_end']])
            self.assertEqual(result['full_source_sha256'], r.digest(path))
            self.assertEqual(path.read_text(), raw)
            for change in ({'quote_is_excerpt': False}, {'quote_is_excerpt': 'true'},
                           {'quote': row['quote'].replace('unconfirmed', 'confirmed')},
                           {'quote': row['quote'].replace('\n', ' ')},
                           {'quote': 'The condition remains unconfirmed.\nThe unit showed spikes.'},
                           {'quote': 'Spikes.\nThe condition remains unconfirmed.'}):
                with self.assertRaises(ValueError):
                    r.source_windows(path, [{**row, **change}])

    def test_composite_quotes_keep_both_authentic_sources_and_fail_closed(self):
        row = {'id': 'c02', 'quote': 'Robot unloading.\\nAustin address.',
               'quote_sources': [{'excerpt': 'Robot unloading.', 'url': 'https://u.example',
                                  'source_snapshot': 'university.txt'},
                                 {'quote': 'Austin address.', 'url': 'https://c.example',
                                  'source_snapshot': 'company.txt'}]}
        parts = r.source_segments(row)
        self.assertEqual([p['source_snapshot'] for p in parts], ['university.txt', 'company.txt'])
        self.assertEqual([p['quote'] for p in parts], ['Robot unloading.', 'Austin address.'])
        self.assertEqual([p['id'] for p in parts], ['c02', 'c02'])
        self.assertEqual(r.source_segments({**row, 'quote': 'Robot unloading.\nAustin address.'}), parts)
        for change in ({'quote': 'Changed claim.'}, {'quote_sources': [{'quote': 'Robot unloading.'}]}):
            with self.assertRaises(ValueError):
                r.source_segments({**row, **change})

    def test_reader_link_annotation_preserves_raw_context_without_word_substitution(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'source.txt'
            path.write_text('L55: cite15†Contoro Robotics†contoro.com is building robots.')
            result = r.source_windows(path, [{'id': 'c02', 'quote': 'Contoro Robotics is building robots.'}])
            self.assertIn('†contoro.com', result['windows'][0]['quotes'][0]['text'])
            self.assertEqual(result['full_source_sha256'], r.digest(path))
            with self.assertRaises(ValueError):
                r.source_windows(path, [{'id': 'c02', 'quote': 'Contoro Robotics is selling robots.'}])

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

    def call(self, response=None, raw=None, availability=None, post_error=None, stream_error=None, real_stream=False):
        streamer = r.streamed_response if real_stream else (lambda _: self.context_response(raw or self.raw()))
        with patch.dict(r.os.environ, {'GEMINI_API_KEY': 'test-key'}), \
                patch.object(r, 'packet', return_value=(getattr(self, 'packet_text', {'current': 'evidence'}), self.bindings)), \
                patch.object(r, 'media_part', return_value=({'test': 'media'}, None, 'film')), \
                patch.object(r.requests, 'post', return_value=response or Mock(status_code=200), side_effect=post_error) as post, \
                patch.object(r, 'streamed_response', side_effect=stream_error or streamer):
            result = r.run(self.root/'board.json', self.root/'claims.json', self.root/'film.mp4',
                           'phone', self.failure_path, self.state, self.root/'phone.json', availability=availability)
            self.last_post_kwargs = post.call_args.kwargs if post.call_args else None
            return result, post.call_count

    def timeout_attempt(self, error=None):
        with self.assertRaisesRegex(ValueError, type(error).__name__ if error else 'ReadTimeout'):
            self.call(post_error=error or r.requests.ReadTimeout('test timeout'))
        return next((self.root/'independent-review-cache').glob('*/attempt.json'))

    def test_one_charged_read_timeout_child_preserves_original_and_reuses_its_verdict(self):
        import provider_timeout_retry as timeout
        import provider_availability as availability
        attempt = self.timeout_attempt()
        original = attempt.read_bytes(); before = c.read_state(self.state)
        self.assertEqual(before['usage']['audiovisual_reviews'], 1)
        receipt = timeout.prepare(self.state, attempt)
        self.assertEqual(c.read_state(self.state), before)
        proof = availability.recovery_proof(receipt, attempt, self.state)
        self.assertEqual(availability.proof_problems(proof), [])
        result, count = self.call(availability=receipt)
        self.assertEqual(count, 1)
        self.assertEqual(self.last_post_kwargs['timeout'], (30, 540))
        self.assertEqual(r.evidence_problems(result), [])
        self.assertEqual(attempt.read_bytes(), original)
        self.assertEqual(c.read_state(self.state)['resource_envelope'], before['resource_envelope'])
        self.assertEqual(c.read_state(self.state)['usage']['audiovisual_reviews'], 2)
        same, count = self.call(availability=receipt)
        self.assertEqual(same, result); self.assertEqual(count, 0)
        self.assertEqual(c.read_state(self.state)['usage']['audiovisual_reviews'], 2)
        with self.assertRaises(FileExistsError):timeout.prepare(self.state, attempt)
        child = attempt.parent/'availability-recovery/attempt.json'
        with self.assertRaisesRegex(ValueError, 'original.*cache'):
            timeout.prepare(self.state, child)

    def test_timeout_child_refuses_changed_scope_input_and_prompt_before_spend(self):
        import provider_timeout_retry as timeout
        attempt = self.timeout_attempt(); receipt = timeout.prepare(self.state, attempt)
        before = c.read_state(self.state)
        self.bindings['claims_sha256'] = 'different-claims'
        with self.assertRaisesRegex(ValueError, 'exact same'):
            self.call(availability=receipt)
        self.bindings['claims_sha256'] = 'claims'
        self.packet_text = {'current': 'changed evidence'}
        with self.assertRaisesRegex(ValueError, 'exact same'):
            self.call(availability=receipt)
        del self.packet_text
        with patch.object(r, 'prompt', return_value='changed prompt'):
            with self.assertRaisesRegex(ValueError, 'exact same'):
                self.call(availability=receipt)
        self.assertEqual(c.read_state(self.state), before)

    def test_streamed_read_timeout_keeps_wrapped_cause_and_gets_one_child(self):
        import provider_timeout_retry as timeout
        from urllib3.exceptions import ReadTimeoutError
        response = r.requests.Response(); response.status_code = 200
        response.raw = Mock()
        response.raw.stream.side_effect = ReadTimeoutError(None, '/stream', 'read timed out')
        with self.assertRaisesRegex(ValueError, 'ConnectionError'):
            self.call(response=response, real_stream=True)
        attempt = next((self.root/'independent-review-cache').glob('*/attempt.json'))
        failure = json.loads(attempt.with_name('failure.json').read_text())
        self.assertEqual(failure['exception_type'], 'ConnectionError')
        self.assertEqual(failure['read_timeout_cause'], 'urllib3.ReadTimeoutError')
        self.assertFalse(attempt.with_name('response.json').exists())
        receipt = timeout.prepare(self.state, attempt)
        result, count = self.call(availability=receipt)
        self.assertEqual(count, 1); self.assertEqual(self.last_post_kwargs['timeout'], (30, 540))
        self.assertEqual(r.evidence_problems(result), [])
        self.assertEqual(c.read_state(self.state)['usage']['audiovisual_reviews'], 2)

    def test_timeout_recognition_uses_the_exception_cause_never_error_text(self):
        import provider_timeout_retry as timeout
        from urllib3.exceptions import ReadTimeoutError
        for error in (r.requests.ConnectionError('ReadTimeoutError: read timed out'),
                      r.requests.ConnectTimeout('read timeout'),
                      r.requests.HTTPError('ReadTimeout'), r.requests.ConnectionError(OSError('timeout'))):
            with self.subTest(error=type(error).__name__):self.assertIsNone(timeout.read_timeout_cause(error))
        inner = ReadTimeoutError(None, '/stream', 'idle')
        outer = r.requests.ConnectionError('request failed'); outer.__cause__ = inner
        self.assertEqual(timeout.read_timeout_cause(outer), 'urllib3.ReadTimeoutError')

    def test_timeout_recovery_never_retries_a_response_or_a_rejection(self):
        import provider_timeout_retry as timeout
        self.value['verdict'] = 'revise'
        self.value['blocking_defects'] = ['The visible change is incomplete.']
        result, _ = self.call()
        attempt = next((self.root/'independent-review-cache').glob('*/attempt.json'))
        before = c.read_state(self.state)
        with self.assertRaisesRegex(ValueError, 'without a response or verdict'):
            timeout.prepare(self.state, attempt)
        self.assertEqual(result['verdict'], 'revise')
        self.assertEqual(c.read_state(self.state), before)

    def test_unpinned_legacy_log_and_other_transport_errors_do_not_qualify(self):
        import provider_timeout_retry as timeout
        attempt = self.timeout_attempt(r.requests.ConnectTimeout('different failure'))
        log = self.root/'unrelated.log'
        log.write_text('independent_review: independent provider ReadTimeout; no approval recorded\n')
        before = c.read_state(self.state)
        with self.assertRaisesRegex(ValueError, 'incomplete, changed or not an actual'):
            timeout.prepare(self.state, attempt, log)
        self.assertEqual(c.read_state(self.state), before)
        self.assertFalse(attempt.with_name('read-timeout-recovery.json').exists())

    def test_timeout_evidence_and_longer_window_cannot_be_rebound(self):
        import provider_timeout_retry as timeout
        import provider_availability as availability
        attempt = self.timeout_attempt(); receipt = timeout.prepare(self.state, attempt)
        before = c.read_state(self.state)
        proof = availability.recovery_proof(receipt, attempt, self.state)
        bad = copy.deepcopy(proof); value = json.loads(bad['receipt']); value['read_timeout_s'] = 999
        bad['receipt'] = json.dumps(value); bad['receipt_sha256'] = timeout.sha(bad['receipt'])
        self.assertTrue(availability.proof_problems(bad))
        failure = attempt.with_name('failure.json'); original = failure.read_text()
        failure.write_text(original+' ')
        with self.assertRaisesRegex(ValueError, 'original evidence changed'):
            availability.recovery_proof(receipt, attempt, self.state)
        failure.write_text(original)
        request = attempt.with_name('request.json'); data = json.loads(request.read_text())
        data['context']['model'] = 'unconfigured-model'; request.write_text(json.dumps(data))
        with self.assertRaises(ValueError):availability.recovery_proof(receipt, attempt, self.state)
        self.assertEqual(c.read_state(self.state), before)

    def context_response(self, raw):
        value = copy.deepcopy(raw)
        request_id = next(row['request_id'] for row in reversed(c.read_state(self.state)['events'])
                          if row.get('kind') == 'independent_review_transport')
        attempt = next(path for path in (self.root/'independent-review-cache').rglob('attempt.json')
                       if json.loads(path.read_text())['request_id'] == request_id)
        context_sha = json.loads(attempt.read_text())['review_context_sha256']
        review = r.response_object(value)
        review['review_context_sha256'] = context_sha
        value['candidates'][0]['content']['parts'][0]['text'] = json.dumps(review)
        return value

    def offline(self):
        with patch.dict(r.os.environ, {'GEMINI_API_KEY': ''}), \
             patch.object(r, 'packet', return_value=({'current': 'evidence'}, self.bindings)), \
             patch.object(r.requests, 'post', side_effect=AssertionError('reprojection bought another verdict')):
            return r.run(self.root/'board.json', self.root/'claims.json', self.root/'film.mp4',
                         'phone', self.failure_path, self.state, self.root/'phone.json', reproject_only=True)

    def test_narration_action_rows_keep_original_findings_without_proposal_stamps(self):
        value = copy.deepcopy(self.value)
        narrative = {'action_id': 'yard-floods-before-warning', 'verdict': 'revise',
                     'blocking_defects': ['Original independent defect.']}
        value['action_reviews'] = [narrative, {'action_id': 'registered', 'verdict': 'pass'}]
        bindings = {**self.bindings, 'actions': {'registered': {'module_sha256': 'actual-code',
                                                              'source_claims_sha256': 'actual-source'}}}
        report = r.project(self.raw(value), bindings, 'phone', r.policy()['av_model'], 'actual-time')
        self.assertEqual(report['action_reviews'][0], narrative)
        self.assertEqual(report['action_reviews'][1]['module_sha256'], 'actual-code')
        self.assertEqual(report['action_reviews'][1]['verdict'], 'pass')

    def test_direct_narration_clause_collection_wraps_exact_rows_without_inference(self):
        rows = [{'id': 'n1', 'pass': False, 'start_s': 1, 'end_s': 2,
                 'observed': 'The station action is absent.'}]
        value = copy.deepcopy(self.value); value['narration_picture_observations'] = rows
        raw = self.raw(value); before = copy.deepcopy(raw)
        report = r.project(raw, self.bindings, 'phone', r.policy()['av_model'], 'actual-time')
        self.assertEqual(report['narration_picture_observations'], {'film_sha256': 'film', 'clauses': rows})
        self.assertEqual(raw, before)
        self.assertFalse(report['narration_picture_observations']['clauses'][0]['pass'])
        for malformed in [None, 'not observed', {'clauses': []}]:
            value['narration_picture_observations'] = malformed
            result = r.project(self.raw(value), self.bindings, 'phone', r.policy()['av_model'], 'actual-time')
            if not isinstance(malformed, dict):
                self.assertEqual(result['narration_picture_observations'], malformed)

    def test_complete_response_reprojects_offline_without_charge_or_new_identity(self):
        original, _ = self.call()
        cache = next((self.root/'independent-review-cache').glob('*/report.json')).parent
        cache.joinpath('report.json').unlink()
        before = self.state.read_bytes()
        response_bytes = cache.joinpath('response.json').read_bytes()
        self.assertEqual(self.offline(), original)
        self.assertEqual(self.state.read_bytes(), before)
        self.assertEqual(cache.joinpath('response.json').read_bytes(), response_bytes)

    def test_legacy_missing_context_recovers_only_the_exact_original_timestamp(self):
        original, _ = self.call()
        cache = next((self.root/'independent-review-cache').glob('*/report.json')).parent
        for name in ('report.json', 'request.json'): cache.joinpath(name).unlink()
        before = self.state.read_bytes(); attempt = cache.joinpath('attempt.json').read_bytes()
        self.assertEqual(self.offline(), original)
        recovered = json.loads(cache.joinpath('request.json').read_text())
        self.assertEqual(recovered['context']['reviewed_at'], original['reviewed_at'])
        self.assertEqual(recovered['legacy_reconstruction']['exact_context_sha256'],
                         json.loads(attempt)['review_context_sha256'])
        self.assertEqual(self.state.read_bytes(), before)
        self.assertEqual(cache.joinpath('attempt.json').read_bytes(), attempt)

    def test_legacy_context_refuses_changed_input_instead_of_guessing_a_time(self):
        self.call()
        cache = next((self.root/'independent-review-cache').glob('*/report.json')).parent
        for name in ('report.json', 'request.json'): cache.joinpath(name).unlink()
        with patch.dict(r.os.environ, {'GEMINI_API_KEY': ''}), \
             patch.object(r, 'packet', return_value=({'different': 'input'}, self.bindings)), \
             patch.object(r.requests, 'post', side_effect=AssertionError('unbound provider retry')):
            with self.assertRaisesRegex(ValueError, 'not recovered exactly'):
                r.run(self.root/'board.json', self.root/'claims.json', self.root/'film.mp4', 'phone',
                      self.failure_path, self.state, self.root/'phone.json', reproject_only=True)
        self.assertFalse(cache.joinpath('request.json').exists())
        self.assertEqual(c.read_state(self.state)['usage']['audiovisual_reviews'], 1)

    def test_reprojection_refuses_changed_request_response_and_missing_response(self):
        with self.assertRaisesRegex(ValueError, 'no retained provider response'): self.offline()
        original, _ = self.call()
        cache = next((self.root/'independent-review-cache').glob('*/report.json')).parent
        cache.joinpath('report.json').unlink(); request_path = cache/'request.json'
        request_bytes = request_path.read_bytes(); request = json.loads(request_bytes)
        request['input'] = {'other': 'evidence'}; request_path.write_text(json.dumps(request))
        with self.assertRaisesRegex(ValueError, 'request context changed'): self.offline()
        request_path.write_bytes(request_bytes)
        raw = json.loads(cache.joinpath('response.json').read_text())
        raw['candidates'][0]['content']['parts'][0]['text'] += ' '
        cache.joinpath('response.json').write_text(json.dumps(raw))
        with self.assertRaisesRegex(ValueError, 'response bytes changed'): self.offline()
        self.assertEqual(c.read_state(self.state)['usage']['audiovisual_reviews'], 1)

    def test_request_context_is_durable_before_provider_post(self):
        def post(*args, **kwargs):
            cache = next((self.root/'independent-review-cache').glob('*/attempt.json')).parent
            request = json.loads(cache.joinpath('request.json').read_text())
            attempt = json.loads(cache.joinpath('attempt.json').read_text())
            self.assertEqual(r.fingerprint(request['context']), attempt['review_context_sha256'])
            self.assertEqual(c.read_state(self.state)['usage']['audiovisual_reviews'], 1)
            return Mock(status_code=200)
        with patch.dict(r.os.environ, {'GEMINI_API_KEY': 'test-key'}), \
             patch.object(r, 'packet', return_value=({'current': 'evidence'}, self.bindings)), \
             patch.object(r, 'media_part', return_value=({'test': 'media'}, None, 'film')), \
             patch.object(r.requests, 'post', side_effect=post), \
             patch.object(r, 'streamed_response', side_effect=lambda _: self.context_response(self.raw())):
            r.run(self.root/'board.json', self.root/'claims.json', self.root/'film.mp4', 'phone',
                  self.failure_path, self.state, self.root/'phone.json')

    def test_actual_capacity_error_is_distinct_from_rejection(self):
        self.assertFalse(r.failure_problems(self.failure, 'phone'))
        for change in ({'error': 'revise'}, {'verdict': 'revise'}, {'role': 'sound'}, {'actor': ''}):
            self.assertTrue(r.failure_problems({**self.failure, **change}, 'phone'))

    def test_media_limit_requires_exact_single_read_failure_and_bound_evidence(self):
        failure = {**self.failure, 'error': r.MEDIA_LIMIT_ERROR, 'raw_error': r.MEDIA_LIMIT_ERROR,
                   'media_probe': {'single_image_read': True, 'media_received': False, **{
                       key: {'path': key, 'sha256': 'a'*64} for key in ('image', 'packet', 'coverage', 'handback')}}}
        self.assertFalse(r.failure_problems(failure, 'phone'))
        for change in ({'raw_error': 'context_length_exceeded'}, {'verdict': 'revise'}):
            self.assertTrue(r.failure_problems({**failure, **change}, 'phone'))
        for change in ({'single_image_read': False}, {'media_received': True}, {'coverage': {}}):
            self.assertTrue(r.failure_problems({**failure, 'media_probe': {**failure['media_probe'], **change}}, 'phone'))
        self.assertTrue(r.failure_problems({**failure, 'role': 'code'}, 'code'))

    def test_media_limit_admission_checks_actual_unseen_page_and_retained_bytes(self):
        import claude_runtime
        image = self.root/'sequence-000.png'; image.write_bytes(b'owned image fixture bytes')
        index = self.root/'index.json'; index.write_text(json.dumps({'pages': [
            {'file': image.name, 'sha256': r.digest(image)}]}))
        packet = self.root/'host-packet.json'
        data = claude_runtime.image_reading({'role': 'storyboard-critic', 'instructions': '',
            'board': {'sha256': 'board'}, 'claims': {'sha256': 'claims'}, 'phone_mode': 'current',
            'phone_options': [{'film': {'sha256': 'film'},
                              'motion_sequence': {'path': str(index), 'sha256': r.digest(index)}}]})
        packet.write_text(json.dumps(data))
        coverage = self.root/'coverage.json'; value = {'schema': 'dispatch_claude_image_coverage/1',
            'packet_sha256': r.digest(packet), 'sequences': [{'index_sha256': r.digest(index),
                'pages': [{'file': image.name, 'received': False}]}]}
        coverage.write_text(json.dumps(value))
        handback = self.root/'handback.txt'; handback.write_text('Single image returned '+r.MEDIA_LIMIT_ERROR)
        failure = {**self.failure, 'error': r.MEDIA_LIMIT_ERROR, 'raw_error': r.MEDIA_LIMIT_ERROR,
            'media_probe': {'single_image_read': True, 'media_received': False, **{
                key: {'path': str(path), 'sha256': r.digest(path)} for key, path in
                (('image', image), ('packet', packet), ('coverage', coverage), ('handback', handback))}}}
        self.assertFalse(r.failure_problems(failure, 'phone'))
        self.assertEqual(r.media_limit_packet(failure, self.root), data)
        retained = r.retained_media_review({}, failure)['retained_host_media_review']
        self.assertEqual(retained['handback'], handback.read_text())
        self.assertEqual(retained['handback_sha256'], r.digest(handback))
        before = copy.deepcopy(c.read_state(self.state)['usage']); output = self.root/'prepared-media-failure.json'
        with patch.object(r, 'packet', return_value=({}, self.bindings)), \
                patch.object(r.requests, 'post', side_effect=AssertionError('preparation started a provider')):
            prepared = r.prepare_media_limit(self.root/'board.json', self.root/'claims.json', self.root/'film.mp4',
                'phone', self.state, self.failure['actor'], packet, coverage, handback, image, output)
            self.assertEqual(prepared['reservation'], self.failure['reservation'])
            self.assertFalse(r.failure_problems(prepared, 'phone'))
            with self.assertRaisesRegex(ValueError, 'do not overwrite'):
                r.prepare_media_limit(self.root/'board.json', self.root/'claims.json', self.root/'film.mp4',
                    'phone', self.state, self.failure['actor'], packet, coverage, handback, image, output)
        self.assertEqual(c.read_state(self.state)['usage'], before)
        value['sequences'][0]['pages'][0]['received'] = True; coverage.write_text(json.dumps(value))
        failure['media_probe']['coverage']['sha256'] = r.digest(coverage)
        with self.assertRaisesRegex(ValueError, 'actual unseen page'):
            r.media_limit_packet(failure, self.root)
        image.write_bytes(b'changed fixture')
        with self.assertRaisesRegex(ValueError, 'evidence changed'):
            r.media_limit_packet(failure, self.root)

    def comparison_fixture(self):
        a, b = self.root/'a.mp4', self.root/'b.mp4'; a.write_bytes(b'film-a'); b.write_bytes(b'film-b')
        text = {'current': 'evidence', 'provider_packet_policy': {'deduplicate_exact_media': True},
                'media': [{'path': str(p), 'sha256': r.digest(p)} for p in (a, b)],
                'independent_opening_comparison': {'a': {'film': str(a)}, 'b': {'film': str(b)}}}
        base = {k: v for k, v in self.bindings.items() if k != 'film_sha256'}
        bindings = {**base, 'opening_comparison_sha256': 'comparison', 'director_identity': 'actual director',
            'opening_options': {key: {**base, 'film_sha256': r.digest(path), 'board_sha256': 'board-'+key,
                'concept_sha256': 'concept-'+key} for key, path in (('a', a), ('b', b))}}
        value = {'selection': {'selected': 'b', 'reason': 'B shows a clearly completed contact before its result.',
            'rejected_reason': 'A holds the source subject too small during its corresponding action.', 'blocking_defects': []},
            'reports': {'a': {**copy.deepcopy(self.value), 'verdict': 'revise',
                              'blocking_defects': ['Exact observed original A defect']},
                        'b': copy.deepcopy(self.value)}}
        return text, base, bindings, self.raw(value)

    def test_comparison_transports_both_movies_once_and_preserves_independent_choice(self):
        text, base, bindings, raw = self.comparison_fixture()
        self.failure['assignment'] = r.transport_assignment('phone', self.failure['actor'], bindings)
        self.failure_path.write_text(json.dumps(self.failure))
        selection = self.root / 'openings/selection.json'
        with patch.dict(r.os.environ, {'GEMINI_API_KEY': 'test-key'}), \
                patch.object(r, 'packet', return_value=(copy.deepcopy(text), base)), \
                patch.object(r, 'comparison_scope', return_value=(text, bindings)), \
                patch.object(r, 'media_part', side_effect=lambda path, key: ({'test': path.name}, None, r.digest(path))) as media, \
                patch.object(r.requests, 'post', return_value=Mock(status_code=200)) as post, \
                patch.object(r, 'streamed_response', side_effect=lambda _: self.context_response(raw)):
            first = r.run(self.root/'board.json', self.root/'claims.json', None, 'phone', self.failure_path,
                          self.state, self.root/'phone.json', compare_openings=True, selection_out=selection)
            # A local projection/output failure must resume the actual two-film verdict offline.
            next((self.root/'independent-review-cache').glob('*/report.json')).unlink()
            selection.unlink()
            second = r.run(self.root/'board.json', self.root/'claims.json', None, 'phone', self.failure_path,
                           self.state, self.root/'phone.json', compare_openings=True, selection_out=selection,
                           reproject_only=True)
            changed = copy.deepcopy(bindings); changed['opening_comparison_sha256'] = 'changed-labels'
            with patch.object(r, 'comparison_scope', return_value=(text, changed)):
                with self.assertRaisesRegex(ValueError, 'cached independent evidence'):
                    r.run(self.root/'board.json', self.root/'claims.json', None, 'phone', self.failure_path,
                          self.state, self.root/'phone.json', compare_openings=True, selection_out=selection)
        self.assertEqual(post.call_count, 1); self.assertEqual(media.call_count, 2)
        self.assertEqual(first, second); self.assertEqual(c.read_state(self.state)['usage']['audiovisual_reviews'], 1)
        self.assertEqual(first['reviewed_preflight_sha256'], bindings['opening_options']['b']['film_sha256'])
        chosen = json.loads(selection.read_text())
        self.assertEqual(chosen['selected'], 'b'); self.assertFalse(r.evidence_problems(chosen))
        self.assertFalse(r.evidence_problems(first))
        command = [sys.executable, str(r.REPO/'scripts/independent_review.py'), '--verify', str(selection)]
        checked = subprocess.run(command, capture_output=True, text=True)
        self.assertEqual(checked.returncode, 0, checked.stderr)
        original = r.response_object(first['provider_evidence']['response'])
        self.assertEqual(original['reports']['a']['blocking_defects'], ['Exact observed original A defect'])
        chosen['selected'] = 'a'; self.assertTrue(r.evidence_problems(chosen))
        selection.write_text(json.dumps(chosen))
        checked = subprocess.run(command, capture_output=True, text=True)
        self.assertEqual(checked.returncode, 1, checked.stderr)
        with self.assertRaisesRegex(ValueError, 'overwrite'):
            r.save_selection(second, selection)
        first['verdict'] = 'revise'; self.assertTrue(r.evidence_problems(first))

    def test_comparison_projection_refuses_missing_report_or_invalid_choice(self):
        _, _, bindings, raw = self.comparison_fixture()
        value = r.response_object(raw); value['review_context_sha256'] = 'actual-context'
        raw = self.raw(value)
        good = r.project(raw, bindings, 'phone', r.policy()['av_model'], 'actual-time')
        self.assertEqual(good['concept_sha256'], 'concept-b')
        selected_a = copy.deepcopy(value); selected_a['selection']['selected'] = 'a'
        rejected = r.project(self.raw(selected_a), bindings, 'phone', r.policy()['av_model'], 'actual-time')
        self.assertEqual(rejected['verdict'], 'revise')
        self.assertEqual(rejected['blocking_defects'], ['Exact observed original A defect'])
        self.assertEqual(rejected['reviewed_preflight_sha256'], bindings['opening_options']['a']['film_sha256'])
        for bad in ({**value, 'reports': {'b': value['reports']['b']}},
                    {**value, 'selection': {**value['selection'], 'selected': 'c'}}):
            with self.assertRaises(ValueError):
                r.project(self.raw(bad), bindings, 'phone', r.policy()['av_model'], 'actual-time')

    def test_comparison_scope_binds_each_actual_board_and_movie_before_spend(self):
        import opening_compare
        root = self.root/'openings'; root.mkdir()
        common = {'date': '2026-10-15', 'title': 'Source-grounded test fixture', 'runtime_s': 1,
            'credits_s': 0, 'story_contract': {'director_identity': 'actual director'},
            'scenes': [{'id': 's1', 'start_s': 0, 'duration_s': 1, 'vo': 'A supported source action.', 'vo_claims': ['c1']}]}
        board_path = self.root/'board.json'; board_path.write_text(json.dumps(common))
        options, media = [], []
        for key in ('a', 'b'):
            board = root/(key+'.json'); board.write_text(json.dumps({**common, 'variant': key}))
            film = root/(key+'.mp4'); film.write_bytes(('encoded-fixture-'+key).encode())
            inspection = root/(key+'-inspection.json')
            inspection.write_text(json.dumps({'pass': True, 'problems': [], 'board_sha256': r.digest(board),
                'film_sha256': r.digest(film), 'renderer_sha256': None,
                'inspector_sha256': opening_compare.inspection_producer()}))
            options.append({'id': key, 'board': {'file': board.name, 'sha256': r.digest(board)},
                'film': {'file': film.name, 'sha256': r.digest(film)},
                'inspection': {'file': inspection.name, 'sha256': r.digest(inspection)}})
            media.append({'path': str(film), 'sha256': r.digest(film)})
        comparison = root/'comparison.json'; comparison.write_text(json.dumps({'options': options, 'renderer_sha256': None}))
        _, bindings = r.comparison_scope(board_path, self.root/'claims.json', {'files': {}, 'media': media},
                                         {k: v for k, v in self.bindings.items() if k != 'film_sha256'})
        self.assertEqual(bindings['opening_comparison_sha256'], r.digest(comparison))
        self.assertEqual(set(bindings['opening_options']), {'a', 'b'})
        for key in ('a', 'b'):
            self.assertEqual(bindings['opening_options'][key]['film_sha256'], r.digest(root/(key+'.mp4')))
        with self.assertRaisesRegex(ValueError, 'attach both'):
            r.comparison_scope(board_path, self.root/'claims.json', {'files': {}, 'media': media[:1]}, self.bindings)

    def test_actual_thread_limit_requires_exact_retained_transport_error(self):
        failure = {**self.failure, 'error': 'agent thread limit reached',
                   'raw_error': 'collab tool failed: agent thread limit reached'}
        self.assertFalse(r.failure_problems(failure, 'phone'))
        spawn_failure = {**failure, 'raw_error': 'collab spawn failed: agent thread limit reached'}
        self.assertEqual(r.failure_problems(spawn_failure, 'phone'), [])
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

    def test_changed_teaching_context_cannot_buy_another_same_film_verdict(self):
        self.call()
        with patch.dict(r.os.environ, {'GEMINI_API_KEY': 'test-key'}), \
                patch.object(r, 'packet', return_value=({'current': 'changed craft guide'}, self.bindings)), \
                patch.object(r, 'reserve', side_effect=AssertionError('spent budget')), \
                patch.object(r.requests, 'post', side_effect=AssertionError('provider called')):
            with self.assertRaisesRegex(ValueError, 'no verdict retry'):
                r.run(self.root/'board.json', self.root/'claims.json', self.root/'film.mp4',
                      'phone', self.failure_path, self.state, self.root/'phone.json')
        self.assertEqual(c.read_state(self.state)['usage']['audiovisual_reviews'], 1)

    def test_failed_provider_attempt_remains_charged_and_cannot_poll(self):
        with self.assertRaisesRegex(ValueError, 'HTTP 503'):
            self.call(response=Mock(status_code=503, text='{"error":{"message":"unavailable"}}'))
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
        paths = ['config/agent_runtime.json', 'config/dispatch_rubric.yaml', 'config/quality_contract.json',
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
        claims.write_text(json.dumps({'claims': [{'id': 'c1', 'quote': 'installed camera count is separate from detections',
                                                'source_snapshot': 'out/dispatch/sources/source.txt'}]}))
        shipped = fixture/'runs/2026-09-28'
        shipped.mkdir(parents=True)
        (shipped/'dispatch.mp4').write_bytes(b'released fixture inventory')
        (shipped/'storyboard.json').write_text(json.dumps({'date': '2026-09-28', 'native_media': []}))
        unfinished = fixture/'runs/2026-09-29'
        unfinished.mkdir()
        (unfinished/'storyboard.json').write_text(json.dumps({'date': '2026-09-29', 'native_media': []}))
        with patch.object(r, 'REPO', fixture):
            text, bindings = r.packet(board, claims, 'code', None)
            context = text['files']['out/dispatch/sources/source.txt']
            self.assertEqual(context['windows'][0]['text'], source.read_text())
            self.assertEqual(bindings['source_snapshots_sha256']['out/dispatch/sources/source.txt'], r.digest(source))
            self.assertIn('knowledge/craft/CREATIVE_DIRECTION.md', text['files'])
            self.assertIn('runs/2026-09-28/storyboard.json', text['files'])
            self.assertEqual(text['files']['runs/2026-09-28/storyboard.json'],
                             (shipped/'storyboard.json').read_text())
            self.assertNotIn('runs/2026-09-29/storyboard.json', text['files'])
            self.assertNotIn('craft_readings_sha256', bindings)
            # New workers must actually receive the guide bytes. Local references
            # alone can't teach a provider role or bind its current context.
            import shutil
            shutil.copytree(actual_repo/'knowledge/craft/visual-storytelling',
                            fixture/'knowledge/craft/visual-storytelling')
            current = json.loads(board.read_text())
            current.update(date='2026-10-03', creative_direction={
                'medium_choice': 'News report; Explanatory animation. Follow the same sourced example.'})
            board.write_text(json.dumps(current))
            taught, taught_bindings = r.packet(board, claims, 'code', None)
            for name in ('knowledge/craft/AUTONOMOUS_COMPLETION.md', 'config/autonomous_completion.json',
                         'config/autonomous_completion_narration_v1.json', 'config/source_validation_completion_v1.json'):
                target = fixture / name; target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes((actual_repo / name).read_bytes())
            (root / 'run_state.json').write_text(json.dumps({'events': [
                {'kind': 'autonomous_completion_narration_adopted'},
                {'kind': 'autonomous_completion_validation_adopted'}]}))
            recovered, recovered_bindings = r.packet(board, claims, 'code', None)
            amendment = 'config/autonomous_completion_narration_v1.json'
            self.assertEqual(recovered['files'][amendment], (fixture / amendment).read_text())
            self.assertEqual(recovered_bindings['completion_readings_sha256'][amendment], r.digest(fixture / amendment))
            amendment = 'config/source_validation_completion_v1.json'
            self.assertEqual(recovered['files'][amendment], (fixture / amendment).read_text())
            self.assertEqual(recovered_bindings['completion_readings_sha256'][amendment], r.digest(fixture / amendment))
            (root / 'run_state.json').unlink()
            method = 'knowledge/craft/visual-storytelling/viewer-plan.md'
            guide = fixture/method
            self.assertEqual(taught['files'][method], guide.read_text())
            self.assertEqual(taught_bindings['craft_readings_sha256'][method], r.digest(guide))
            self.assertIn('knowledge/craft/visual-storytelling/explanatory-animation.md', taught['files'])
            self.assertNotIn('knowledge/craft/visual-storytelling/cinematic-scene.md', taught['files'])
            # Actual provider recovery must carry the new teaching text and bind it,
            # without requiring a host failure for this offline transport regression.
            for name in ['knowledge/craft/ART_DIRECTION.md', 'config/art_direction.json',
                         'knowledge/craft/cinematic_reference_bank.json', 'prompts/roles/scene-builder.md']:
                target = fixture/name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes((actual_repo/name).read_bytes())
            current = json.loads(board.read_text())
            current['art_direction'] = {'version': 'directed-world-v1'}  # transport-only fixture, never approval
            board.write_text(json.dumps(current))
            directed, directed_bindings = r.packet(board, claims, 'code', None)
            method_art = 'knowledge/craft/ART_DIRECTION.md'
            self.assertEqual((fixture/method_art).read_text(), directed['files'][method_art])
            self.assertEqual(r.digest(fixture/method_art), directed_bindings['craft_readings_sha256'][method_art])
            self.assertIn('config/art_direction.json', directed['files'])
            self.assertIn('knowledge/craft/cinematic_reference_bank.json', directed['files'])
            old_directed = r.fingerprint(directed)
            (fixture/method_art).write_text((fixture/method_art).read_text() + '\nFixture-only changed craft instruction.\n')
            changed_art, _ = r.packet(board, claims, 'code', None)
            self.assertNotEqual(old_directed, r.fingerprint(changed_art))
            current.pop('art_direction'); board.write_text(json.dumps(current))
            original_story = taught_bindings['story_sha256']
            guide.write_text(guide.read_text() + '\nFixture-only changed teaching context.\n')
            retaught, retaught_bindings = r.packet(board, claims, 'code', None)
            self.assertNotEqual(r.fingerprint(taught), r.fingerprint(retaught))
            self.assertNotEqual(taught_bindings['craft_readings_sha256'], retaught_bindings['craft_readings_sha256'])
            self.assertEqual(original_story, retaught_bindings['story_sha256'])
            text, bindings = retaught, retaught_bindings
            old_hash = r.fingerprint(text)
            source.write_text(source.read_text() + ' New retained source context.')
            changed_text, changed_bindings = r.packet(board, claims, 'code', None)
            self.assertNotEqual(old_hash, r.fingerprint(changed_text))
            self.assertNotEqual(bindings, changed_bindings)
            source.write_text('Unquoted retained context. ' * 25_000 + source.read_text())
            compact, _ = r.packet(board, claims, 'code', None)
            self.assertLess(len(json.dumps(compact)), 500_000)
            self.assertLess(len(json.dumps(compact['files']['out/dispatch/sources/source.txt'])), 10_000)
            future = {**current, 'date': '2026-10-10'}
            from daily_production import craft_reading_paths
            for path in craft_reading_paths(future, actual_repo):
                target = fixture/path.relative_to(actual_repo)
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(path.read_bytes())
            board.write_text(json.dumps(future))
            with patch.object(r, 'provider_packet_policy', return_value=None):
                legacy, _ = r.packet(board, claims, 'code', None)
            projected, projected_bindings = r.packet(board, claims, 'code', None)
            prior_key = 'runs/2026-09-28/storyboard.json'
            self.assertEqual(projected['files'][prior_key]['original_sha256'], r.digest(shipped/'storyboard.json'))
            self.assertEqual(projected_bindings['prior_board_sha256'], r.digest(shipped/'storyboard.json'))
            self.assertEqual(projected_bindings['provider_packet_policy_sha256'], r.digest(fixture/'config/agent_runtime.json'))
            for name in set(legacy['files']) - {prior_key}:
                self.assertEqual(projected['files'][name], legacy['files'][name])
            for key in ('board', 'claims', 'media'):
                self.assertEqual(projected[key], legacy[key])
            self.assertEqual(projected['files']['knowledge/craft/MODERN_FILM.md'], (actual_repo/'knowledge/craft/MODERN_FILM.md').read_text())
            self.assertEqual(projected['files']['knowledge/craft/STORY_ART.md'], (actual_repo/'knowledge/craft/STORY_ART.md').read_text())
            board.write_text(json.dumps(current))
            oversized = root/'story_selection.json'
            oversized.write_text(json.dumps({'unaltered_non_source': 'x' * 500_000}))
            with self.assertRaisesRegex(ValueError, 'bounded text size'):
                r.packet(board, claims, 'code', None)
            oversized.unlink()
            with self.assertRaisesRegex(ValueError, 'both current complete treatment artifacts'):
                r.packet(board, claims, 'phone', None)
            source.unlink()
            with self.assertRaisesRegex(ValueError, 'snapshot missing'):
                r.packet(board, claims, 'code', None)


class ProviderPacketTest(unittest.TestCase):
    def test_prior_inventory_keeps_picture_provenance_and_full_byte_identity(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root/'runs/2026-10-09/storyboard.json'
            path.parent.mkdir(parents=True)
            board = {'date': '2026-10-09', 'title': 'Prior film', 'topic': 'A prior source',
                     'native_media': [{'file': 'evidence/source.mp4', 'rights_basis': 'Source permission'}],
                     'story_art': {'entries': [{'request_id': 'original', 'sha256': 'original bytes'}]},
                     'visual_research': {'inspected': 'Actual source picture'},
                     'scenes': [{'id': 's1', 'picture': {'subject': 'Original picture'},
                                 'generated_media': {'file': 'generated/clip.mp4'},
                                 'vo': 'Unrelated prior narration.'}],
                     'story_contract': {'rationale': 'Unrelated prior rationale.'}}
            path.write_text(json.dumps(board))
            with patch.object(r, 'REPO', root):
                projected = r.prior_media_inventory(path)
                self.assertEqual(projected['original_sha256'], r.digest(path))
                self.assertEqual(projected['original_path'], 'runs/2026-10-09/storyboard.json')
                for key in ('native_media', 'story_art', 'visual_research'):
                    self.assertEqual(projected['retained'][key], board[key])
                self.assertEqual(projected['retained']['scenes'][0]['picture'], board['scenes'][0]['picture'])
                self.assertEqual(projected['retained']['scenes'][0]['generated_media'], board['scenes'][0]['generated_media'])
                self.assertNotIn('vo', projected['retained']['scenes'][0])
                self.assertNotIn('story_contract', projected['retained'])
                before = copy.deepcopy(projected)
                board['story_contract']['rationale'] = 'Changed unrelated historical byte.'
                path.write_text(json.dumps(board))
                changed = r.prior_media_inventory(path)
                self.assertEqual(before['retained'], changed['retained'])
                self.assertNotEqual(before['original_sha256'], changed['original_sha256'])

    def test_policy_is_dated(self):
        self.assertIsNone(r.provider_packet_policy({'date': '2026-10-09'}))
        self.assertTrue(r.provider_packet_policy({'date': '2026-10-10'})['prior_media_inventory'])

    def test_exact_duplicate_native_bytes_attach_once_and_changed_alias_fails(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            paths = [root/name for name in ('first.png', 'alias.png', 'distinct.png')]
            for path, raw in zip(paths, (b'native-original', b'native-original', b'native-distinct')):
                path.write_bytes(raw)
            rows = [{'path': str(path), 'sha256': r.digest(path)} for path in paths]
            original = {'media': rows}
            legacy = []
            r.append_picture_evidence(legacy, original, None, 'unused', [])
            self.assertEqual(len([x for x in legacy if 'inlineData' in x]), 3)
            compact = {**original, 'provider_packet_policy': {'deduplicate_exact_media': True}}
            parts = []
            r.append_picture_evidence(parts, compact, None, 'unused', [])
            images = [x['inlineData']['data'] for x in parts if 'inlineData' in x]
            self.assertEqual(len(images), 2)
            self.assertEqual([r.base64.b64decode(x) for x in images], [b'native-original', b'native-distinct'])
            self.assertEqual(len([x for x in parts if 'text' in x]), 3)
            self.assertEqual(original['media'], rows)
            unsupported = root/'alias.exe'; unsupported.write_bytes(b'native-original')
            with self.assertRaisesRegex(ValueError, 'format is unsupported'):
                r.append_picture_evidence([], {**compact, 'media': rows + [{'path': str(unsupported), 'sha256': r.digest(unsupported)}]}, None, 'unused', [])
            paths[1].write_bytes(b'changed-alias')
            with self.assertRaisesRegex(ValueError, 'picture evidence changed'):
                r.append_picture_evidence([], compact, None, 'unused', [])

    def test_clip_hash_is_checked_after_provider_upload(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)/'clip.mp4'
            path.write_bytes(b'original clip')
            text = {'media': [{'path': str(path), 'sha256': r.digest(path)}]}
            uploads = []
            with patch.object(r, 'media_part', return_value=({}, 'temporary-upload', 'changed clip')):
                with self.assertRaisesRegex(ValueError, 'clip changed during transport'):
                    r.append_picture_evidence([], text, None, 'unused', uploads)
            self.assertEqual(uploads, ['temporary-upload'])


class SourceWindowTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.path = Path(self.tmp.name) / 'source.txt'

    def test_blank_line_excerpts_keep_exact_source_and_fail_closed(self):
        raw = 'Customer operations began.\nA separate qualification.\nOctober 5, 2026'
        self.path.write_text(raw)
        row = {'id': 'c1', 'quote': 'Customer operations began.\n\nOctober 5, 2026',
               'quote_is_excerpt': True}
        result = r.source_windows(self.path, [row], context_chars=2)
        self.assertEqual(result['excerpt_groups'][0]['text'], raw)
        self.assertEqual(result['excerpt_groups'][0]['original_quote'], row['quote'])
        self.assertEqual(result['full_source_sha256'], r.digest(self.path))
        self.assertEqual(self.path.read_text(), raw)
        for change in ({'quote_is_excerpt': False}, {'quote_is_excerpt': 'true'},
                       {'quote': row['quote'].replace('5,', '6,')},
                       {'quote': row['quote'].replace('\n\n', ' ')},
                       {'quote': 'October 5, 2026.\n\nCustomer operations began.'}):
            with self.subTest(change=change), self.assertRaises(ValueError):
                r.source_windows(self.path, [{**row, **change}])

    def test_merged_windows_keep_all_quotes_occurrences_and_exact_slices(self):
        raw = b'Before\r\nA pod descends.  It can retract.\r\nA\n pod\t descends. After'
        self.path.write_bytes(raw)
        rows = [{'id': 'c1', 'quote': 'A pod descends.'}, {'id': 'c2', 'quote': 'It can retract.'}]
        context = r.source_windows(self.path, rows, context_chars=12)
        self.assertEqual(len(context['windows']), 1)
        window = context['windows'][0]
        source = raw.decode('utf-8')
        self.assertEqual(window['text'], source[window['raw_start']:window['raw_end']])
        self.assertEqual(window['claim_ids'], ['c1', 'c2'])
        quotes = window['quotes']
        self.assertEqual(len(quotes), 3)
        for item in quotes:
            self.assertEqual(item['text'], source[item['raw_start']:item['raw_end']])
            self.assertIn(item['text'], window['text'])
        repeated = [item for item in quotes if item['claim_id'] == 'c1']
        self.assertEqual([item['occurrence_index'] for item in repeated], [0, 1])
        self.assertEqual([item['occurrence_count'] for item in repeated], [2, 2])
        self.assertEqual(context['full_source_sha256'], hashlib.sha256(raw).hexdigest())
        self.assertEqual(self.path.read_bytes(), raw)

    def test_missing_nonexact_or_unquoted_verified_claims_fail(self):
        self.path.write_text('The pod can retract.')
        for row in [{'id': 'c1', 'quote': 'The pod cannot retract.'},
                    {'id': 'c1', 'quote': 'the pod can retract.'},
                    {'id': 'c1', 'verdict': 'VERIFIED'}, {'id': 'c1', 'quote': '   '}]:
            with self.assertRaises(ValueError):
                r.source_windows(self.path, [row])

    def test_unsliced_byte_change_remains_bound(self):
        self.path.write_text('prefix' * 1000 + 'Exact quote.' + 'suffix' * 1000)
        rows = [{'id': 'c1', 'quote': 'Exact quote.'}]
        before = r.source_windows(self.path, rows, context_chars=20)
        self.path.write_text('PREFIX' + self.path.read_text()[6:])
        after = r.source_windows(self.path, rows, context_chars=20)
        self.assertEqual(before['windows'], after['windows'])
        self.assertNotEqual(before['full_source_sha256'], after['full_source_sha256'])
        self.assertNotEqual(r.fingerprint(before), r.fingerprint(after))


if __name__ == '__main__':
    unittest.main()
