"""Compaction reduces real duplicate input while preserving every current semantic field."""
import copy
from contextlib import chdir
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import independent_packet_compaction as compact
import independent_review
from modern_film import renderer_seed_paths


class Compaction(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.repo = Path(self.temp.name).resolve(); self.package = self.repo/'out/dispatch'
        self.package.mkdir(parents=True)
        self.current = 'video-engine/src/modern/episodes/current/Film.tsx'
        self.hero = 'video-engine/src/modern/episodes/current/Hero.tsx'
        self.old = 'video-engine/src/modern/episodes/older/Film.tsx'
        self.oldhero = 'video-engine/src/modern/episodes/older/Hero.tsx'
        self.utility = 'video-engine/src/modern/episodes/older/utility.ts'
        self.shared = 'video-engine/src/modern/shared.ts'
        registry = {'episodes': {'now': {'module': self.current, 'assets': [self.hero], 'authored_art': True},
            'old': {'module': self.old, 'assets': [self.oldhero, self.utility], 'authored_art': True}}}
        self.write('config/modern_episode_registry.json', json.dumps(registry))
        for name in renderer_seed_paths('now', self.repo):
            if not (self.repo/name).exists():
                self.write(name, '{}' if name.endswith('.json') else '// shared runtime fixture\n')
        self.write(self.current, "import {shared} from '../../shared';\nimport {utility} from '../older/utility';\nexport const Film = shared + utility;\n")
        self.write(self.hero, 'export const Hero = "current performed source";\n')
        self.write(self.old, "import {shared} from '../../shared';\n"+'// old unused source\n'*18000)
        self.write(self.oldhero, '// older inactive artwork\n'*18000)
        self.write(self.utility, 'export const utility = 3;\n')
        self.write(self.shared, 'export const shared = 4;\n')
        self.write('video-engine/src/modern/registry.tsx',
                   "import {Film} from './episodes/current/Film';\nimport {Old} from './episodes/older/Film';\n")
        self.board = {'date': '2026-10-15', 'film_direction': {'episode': 'now', 'variant': 'a'},
            'scenes': [{'id': 's1', 'vo': 'Every factual qualifier is preserved.',
                        'data': [{'index': i, 'text': 'Complete current action evidence.'} for i in range(800)]}],
            'nested/~key': {'remove': 1, 'value': [True, None, 4]}}
        self.a = copy.deepcopy(self.board); self.a['preview'] = {'width': 270, 'height': 480}
        self.b = copy.deepcopy(self.a); self.b['film_direction']['variant'] = 'b'
        self.b['nested/~key'].pop('remove'); self.b['nested/~key']['value'][2] = 9
        self.b['scenes'][0]['vo'] = self.board['scenes'][0]['vo']
        self.write('out/dispatch/openings/a.json', json.dumps(self.a, indent=4))
        self.write('out/dispatch/openings/b.json', json.dumps(self.b, indent=4))
        self.guide = 'Full current guide\nNo criterion is removed.\n'*100
        self.text = {'board': self.board, 'claims': {'claims': [{'id': 'c1', 'quote': 'Exact fetched source.'}]},
            'files': {name: (self.repo/name).read_text() for name in
                (self.current, self.hero, self.old, self.oldhero, self.utility, self.shared,
                 'out/dispatch/openings/a.json', 'out/dispatch/openings/b.json')},
            'retained_host_media_review': {'handback': 'Original partial finding and explicit retraction.'}}
        self.text['files']['knowledge/craft/current-guide.md'] = self.guide

    def write(self, name, value):
        path = self.repo/name; path.parent.mkdir(parents=True, exist_ok=True); path.write_text(value)

    def test_lossless_boards_round_trip_with_original_byte_hashes(self):
        original = copy.deepcopy(self.text)
        result, policy_sha = compact.compact(self.text, self.package, 'phone', self.repo)
        self.assertEqual(self.text, original)
        for key, expected in (('a', self.a), ('b', self.b)):
            name = 'out/dispatch/openings/'+key+'.json'; value = result['files'][name]
            self.assertEqual(compact.document(value, result['board']), expected)
            self.assertEqual(value['original_sha256'], compact.sha(self.repo/name))
        self.assertEqual(result['files']['knowledge/craft/current-guide.md'], self.guide)
        self.assertEqual(result['claims'], original['claims'])
        self.assertEqual(result['retained_host_media_review'], original['retained_host_media_review'])
        self.assertEqual(policy_sha, compact.sha(compact.POLICY))

    def test_only_inactive_registered_source_bodies_become_inventories(self):
        result, _ = compact.compact(self.text, self.package, 'phone', self.repo)
        self.assertEqual({r['path'] for r in result['inactive_renderer_source_inventory']}, {self.old, self.oldhero})
        for name in (self.current, self.hero, self.utility, self.shared):
            self.assertEqual(result['files'][name], self.text['files'][name])
        for row in result['inactive_renderer_source_inventory']:
            self.assertEqual(row['sha256'], compact.sha(self.repo/row['path']))

    def test_compaction_is_idempotent_and_keeps_the_original_size_ceiling(self):
        first, _ = compact.compact(self.text, self.package, 'phone', self.repo)
        second, _ = compact.compact(first, self.package, 'phone', self.repo)
        self.assertEqual(first, second)
        self.assertGreater(len(json.dumps(self.text)), 500000)
        self.assertLess(len(json.dumps(first)), 500000)
        with patch.object(independent_review, 'REPO', self.repo):
            bounded, _ = independent_review.bounded_packet(self.text, self.package/'storyboard.json', 'phone', {})
            self.assertEqual(bounded, first)
            oversized = copy.deepcopy(self.text); oversized['retained_host_media_review']['handback'] = 'x'*500001
            with self.assertRaisesRegex(ValueError, 'bounded text size'):
                independent_review.bounded_packet(oversized, self.package/'storyboard.json', 'phone', {})

    def test_code_scope_keeps_all_callable_source_and_history_stays_unchanged(self):
        code, _ = compact.compact(self.text, self.package, 'code', self.repo)
        self.assertEqual(code['files'][self.old], self.text['files'][self.old])
        self.assertEqual(code['files'][self.oldhero], self.text['files'][self.oldhero])
        historical = copy.deepcopy(self.text); historical['board']['date'] = '2026-10-14'
        result, policy = compact.compact(historical, self.package, 'phone', self.repo)
        self.assertEqual(result, historical); self.assertIsNone(policy)

    def test_delta_handles_root_lists_deletions_and_escaped_keys(self):
        for a, b in ((None, {'a': [1, 2]}), ([1, 2], [3]),
                     ({'a/b': {'~k': 3}, 'gone': 1}, {'a/b': {'~k': 4}, 'new': None})):
            self.assertEqual(compact.apply_delta(a, compact.delta(a, b)), b)

    def test_stable_shot_ids_preserve_long_unchanged_shots_across_insertions(self):
        a = [{'id': str(i), 'action': 'Complete unchanged action '*100} for i in range(20)]
        b = copy.deepcopy(a); b.insert(3, {'id': 'inserted', 'action': 'A useful new angle.'})
        b[14]['action'] = 'Changed action.'
        rows = compact.delta(a, b)
        self.assertEqual(compact.apply_delta(a, rows), b)
        self.assertLess(len(json.dumps(rows)), len(json.dumps(b)) // 5)

    def code_reports(self):
        self.write('out/dispatch/storyboard.json', json.dumps(self.board))
        report = {'verdict': 'pass', 'review_scope': 'code plan, no pixels',
                  'renderer_sha256': compact.sha(self.repo/self.hero),
                  'story_review': {'claims_sha256': 'current-claims'}, 'notes': 'Original complete code findings.'}
        self.write('out/dispatch/opening-a-critic.json', json.dumps(report))
        return report

    def code_gate(self, board, report):
        return [] if report['renderer_sha256'] == compact.sha(self.repo/self.hero) else ['changed renderer']

    def test_phone_code_inventory_requires_actual_current_code_gate_passes(self):
        report = self.code_reports()
        with patch('critic_gate.problems', side_effect=self.code_gate) as gate, \
             patch('critic_gate.concept_digest', return_value='concept'), \
             patch('critic_gate.renderer_digest', side_effect=lambda b: compact.sha(self.repo/self.hero)), \
             patch('critic_gate.renderer_files', return_value=[self.repo/self.hero, self.repo/self.current]):
            context, bindings = compact.phone_code_context(self.text, self.package/'storyboard.json',
                                                           {'claims_sha256': 'current-claims'})
            self.assertEqual(gate.call_count, 3)
            self.assertIn('verified_code_plan_context_sha256', bindings)
            self.assertEqual(next(iter(context['verified_code_plan_context']['reports'].values()))['report'], report)
            result, _ = compact.compact(context, self.package, 'phone', self.repo)
            self.assertNotIn(self.hero, result['files'])
            self.assertEqual({r['path'] for r in result['verified_code_source_inventory']}, {self.hero, self.current})
            self.assertEqual(result['files']['knowledge/craft/current-guide.md'], self.guide)
            self.assertEqual(result['board'], self.board)
            self.assertEqual(result['claims'], self.text['claims'])
            self.assertEqual(compact.compact(result, self.package, 'phone', self.repo)[0], result)

    def test_relative_absolute_and_dot_paths_have_identical_bounded_evidence(self):
        self.code_reports()
        original = copy.deepcopy(self.text)
        with chdir(self.repo), patch.object(independent_review, 'REPO', self.repo), \
             patch('critic_gate.problems', side_effect=self.code_gate), \
             patch('critic_gate.concept_digest', return_value='concept'), \
             patch('critic_gate.renderer_digest', side_effect=lambda b: compact.sha(self.repo/self.hero)), \
             patch('critic_gate.renderer_files', return_value=[self.repo/self.hero, self.repo/self.current]):
            outputs = [independent_review.bounded_packet(self.text, path, 'phone', {'claims_sha256': 'current-claims'})
                       for path in (self.package/'storyboard.json', Path('out/dispatch/storyboard.json'),
                                    Path('out/dispatch/../dispatch/storyboard.json'))]
        self.assertEqual(outputs[0], outputs[1]); self.assertEqual(outputs[0], outputs[2])
        self.assertLess(len(independent_review.packet_json(outputs[0][0])), 500000)
        self.assertEqual(self.text, original)
        old = {'date': '2026-10-14'}; relative = Path('out/dispatch/storyboard.json')
        self.assertEqual(compact.current_paths(old, relative, None), (relative, None))

    def final_reports(self):
        report = self.code_reports()
        self.write('out/dispatch/claims.json', json.dumps(self.text['claims']))
        claims_sha = compact.sha(self.package/'claims.json')
        report['story_review']['claims_sha256'] = claims_sha
        self.write('out/dispatch/opening-a-critic.json', json.dumps(report))
        return report, {'claims_sha256': claims_sha}

    def test_final_amendment_retains_full_review_inputs_and_original_code_reports(self):
        report, bound = self.final_reports(); policy_before = compact.POLICY.read_bytes()
        with patch('critic_gate.problems', side_effect=self.code_gate), \
             patch('critic_gate.concept_digest', return_value='concept'), \
             patch('critic_gate.renderer_digest', side_effect=lambda b: compact.sha(self.repo/self.hero)), \
             patch('critic_gate.renderer_files', return_value=[self.repo/self.hero, self.repo/self.current]):
            for role in ('picture','story','sound'):
                context, bindings = compact.final_code_context(self.text, self.package/'storyboard.json', bound, role)
                self.assertEqual(compact.sha(compact.FINAL_POLICY), bindings['provider_final_code_context_policy_sha256'])
                result, _ = compact.compact(context, self.package, role, self.repo)
                self.assertNotIn(self.hero, result['files'])
                self.assertNotIn(self.current, result['files'])
                self.assertEqual(self.guide, result['files']['knowledge/craft/current-guide.md'])
                self.assertEqual(self.board, result['board'])
                self.assertEqual(self.text['claims'], result['claims'])
                self.assertEqual(self.text['retained_host_media_review'], result['retained_host_media_review'])
                self.assertEqual(report, next(iter(result['verified_code_plan_context']['reports'].values()))['report'])
                for row in result['verified_code_source_inventory']:
                    self.assertEqual(compact.sha(self.repo/row['path']), row['sha256'])
                self.assertEqual(result, compact.compact(result, self.package, role, self.repo)[0])
            self.assertEqual(self.text, compact.final_code_context(self.text, self.package/'storyboard.json', bound, 'code')[0])
            historical = copy.deepcopy(self.text); historical['board']['date'] = '2026-10-14'
            self.assertEqual(historical, compact.final_code_context(historical,self.package/'storyboard.json',bound,'picture')[0])
        self.assertEqual(policy_before, compact.POLICY.read_bytes())

    def test_final_inventory_refuses_stale_code_claims_reports_or_amendment(self):
        report, bound = self.final_reports()
        with patch('critic_gate.problems', side_effect=self.code_gate), \
             patch('critic_gate.concept_digest', return_value='concept'), \
             patch('critic_gate.renderer_digest', side_effect=lambda b: compact.sha(self.repo/self.hero)), \
             patch('critic_gate.renderer_files', return_value=[self.repo/self.hero, self.repo/self.current]):
            context, _ = compact.final_code_context(self.text,self.package/'storyboard.json',bound,'picture')
            result, _ = compact.compact(context,self.package,'picture',self.repo)
            changed = copy.deepcopy(result)
            changed['verified_code_plan_context']['reports']['opening-a-critic.json']['report']['notes'] = 'Edited finding'
            with self.assertRaisesRegex(ValueError,'stale or changed'): compact.compact(changed,self.package,'picture',self.repo)
            changed = copy.deepcopy(result); changed['verified_code_plan_context']['final_policy_sha256'] = 'f'*64
            with self.assertRaisesRegex(ValueError,'amendment changed'): compact.compact(changed,self.package,'picture',self.repo)
            self.write(self.hero, 'changed renderer bytes')
            unverified, bindings = compact.final_code_context(self.text,self.package/'storyboard.json',bound,'picture')
            self.assertEqual(self.text,unverified)
            self.assertNotIn('provider_final_code_context_policy_sha256',bindings)
            with self.assertRaisesRegex(ValueError,'stale or changed'): compact.compact(result,self.package,'picture',self.repo)

    def test_stale_missing_wrong_claims_or_phone_verdict_keeps_full_source(self):
        report = self.code_reports()
        with patch('critic_gate.problems', side_effect=self.code_gate):
            for mutation in ('claims', 'source', 'phone', 'missing'):
                value = copy.deepcopy(report)
                if mutation == 'claims': value['story_review']['claims_sha256'] = 'old-claims'
                if mutation == 'source': value['renderer_sha256'] = 'old-renderer'
                if mutation == 'phone': value['reviewed_preflight_sha256'] = 'a-phone-film'
                self.write('out/dispatch/opening-a-critic.json', json.dumps(value))
                if mutation == 'missing': (self.package/'opening-a-critic.json').unlink()
                result, bindings = compact.phone_code_context(self.text, self.package/'storyboard.json',
                                                              {'claims_sha256': 'current-claims'})
                self.assertEqual(result, self.text)
                self.assertNotIn('verified_code_plan_context_sha256', bindings)
                result, _ = compact.compact(result, self.package, 'phone', self.repo)
                self.assertEqual(result['files'][self.hero], self.text['files'][self.hero])

    def test_compact_wire_serialization_preserves_every_value(self):
        value, _ = compact.compact(self.text, self.package, 'phone', self.repo)
        encoded = independent_review.packet_json(value)
        self.assertEqual(compact.decode_shared(json.loads(encoded)), value)
        self.assertLess(len(encoded), len(json.dumps(value)))

    def test_shared_wire_preserves_full_guides_types_and_literal_reference_keys(self):
        paragraph = 'Complete original guide text with its source limits and actual observation requirements. '*8
        value = {'files': {'guide-a': 'Guide A\n\n'+(paragraph+'\n\n')*100,
                           'guide-b': 'Guide B\n\n'+(paragraph+'\n\n')*100},
                 'literal': [{'$v': 'an original field'}, {'$literal': {'key': 'original'}},
                             {'$text': ['original', 'field']}, True, 1, -0.0],
                 'packet_compaction': {'version': 'current'}}
        before = copy.deepcopy(value); encoded = compact.encode_shared(value)
        self.assertIn(encoded['schema'], (compact.SHARED_SCHEMA, compact.KEY_SCHEMA))
        decoded = compact.decode_shared(json.loads(json.dumps(encoded)))
        self.assertEqual(compact.canonical(decoded), compact.canonical(before))
        self.assertEqual(value, before)
        self.assertLess(len(compact.canonical(encoded)), len(compact.canonical(value))//2)
        changed = copy.deepcopy(encoded)
        changed['values'][next(iter(changed['values']))] = 'Edited original text.'
        with self.assertRaisesRegex(ValueError, 'complete original input'): compact.decode_shared(changed)
        for values in ({'0': {'$v': '0'}}, {}):
            with self.assertRaisesRegex(ValueError, 'cyclic or absent'):
                compact.decode_shared({'schema': compact.SHARED_SCHEMA, 'values': values,
                                       'packet': {'$v': '0'}, 'original_sha256': 'unreachable'})

    def test_repeated_short_hashes_and_clauses_fit_without_losing_current_evidence(self):
        import hashlib
        rows = [{'sha256': hashlib.sha256(str(i % 24).encode()).hexdigest(),
                 'source_limit': 'Prototype evidence does not establish field accuracy.',
                 'observed': 'Original independent finding stays unchanged.',
                 'index': i} for i in range(2600)]
        value = {'board': self.text['board'], 'files': {'actual_findings': rows},
                 'packet_compaction': {'version': 'current'}}
        before = copy.deepcopy(value)
        self.assertGreater(len(compact.canonical(value)), 500_000)
        encoded = independent_review.packet_json(value)
        self.assertLess(len(encoded), 500_000)
        self.assertEqual(compact.canonical(compact.decode_shared(json.loads(encoded))),
                         compact.canonical(before))
        self.assertEqual(value, before)
        self.assertEqual(encoded, independent_review.packet_json(value))

    def test_short_unique_values_and_historical_packets_stay_complete(self):
        import hashlib
        value = {'rows': [hashlib.sha256(str(i).encode()).hexdigest() for i in range(1800)]}
        self.assertEqual(compact.encode_shared(value), value)
        self.assertEqual(independent_review.packet_json(value),
                         json.dumps(value, sort_keys=True, separators=(',', ':')))

    def test_hashes_repeated_only_twice_save_space_and_roundtrip(self):
        import hashlib
        rows = [{'index': i, 'sha256': hashlib.sha256(str(i // 2).encode()).hexdigest()}
                for i in range(1800)]
        value = {'rows': rows}
        encoded = compact.encode_shared(value)
        self.assertIn(encoded['schema'], (compact.SHARED_SCHEMA, compact.KEY_SCHEMA))
        self.assertTrue(any(isinstance(item, str) and len(item) == 64
                            for item in encoded['values'].values()))
        self.assertLess(len(compact.canonical(encoded)), len(compact.canonical(value)))
        self.assertEqual(compact.decode_shared(encoded), value)

    def test_repeated_keys_and_literal_control_keys_roundtrip_without_value_loss(self):
        import hashlib
        value = {'rows': [{'current_complete_observation': hashlib.sha256(str(i).encode()).hexdigest(),
                           'retained_original_finding': 'Unique original note '+str(i),
                           '~0': {'$v': 'literal original'},
                           '~~literal': {'$text': ['literal original text']},
                           'literal_control': {'$literal': {'original': i}}}
                          for i in range(900)]}
        original = copy.deepcopy(value)
        encoded = compact.encode_shared(value)
        self.assertEqual(compact.KEY_SCHEMA, encoded['schema'])
        self.assertIn('current_complete_observation', encoded['keys'].values())
        self.assertLess(len(compact.canonical(encoded)), len(compact.canonical(value)))
        self.assertEqual(original, compact.decode_shared(encoded))
        self.assertEqual(value, original)
        self.assertEqual(encoded, compact.encode_shared(value))

    def test_shared_key_table_refuses_tampering_unknown_aliases_and_collisions(self):
        import hashlib
        value = {'current_complete_observation': 'Original independent note', 'other': 1}
        wire = {'schema':compact.KEY_SCHEMA, 'values':{}, 'keys':{'0':'current_complete_observation'},
                'packet':{'~0':'Original independent note', 'other':1},
                'original_sha256':hashlib.sha256(compact.canonical(value).encode()).hexdigest()}
        self.assertEqual(value, compact.decode_shared(wire))
        for keys, pattern in [({'0':'Changed field'},'complete original input'),
                              ({},'absent key reference'), ({'0':False},'malformed')]:
            changed = copy.deepcopy(wire); changed['keys'] = keys
            with self.assertRaisesRegex(ValueError, pattern): compact.decode_shared(changed)
        changed = copy.deepcopy(wire)
        changed['packet']['current_complete_observation'] = 'Duplicate original field'
        with self.assertRaisesRegex(ValueError, 'duplicate decoded keys'): compact.decode_shared(changed)

    def test_historical_shared_wire_keeps_literal_tilde_keys_unchanged(self):
        import hashlib
        original = {'~0': {'$v':'literal original'}, 'notes': ['Original complete finding.']}
        wire = {'schema':compact.SHARED_SCHEMA, 'values':{'0':'Original complete finding.'},
                'packet':{'~0':{'$literal':{'$v':'literal original'}}, 'notes':[{'$v':'0'}]},
                'original_sha256':hashlib.sha256(compact.canonical(original).encode()).hexdigest()}
        self.assertEqual(original, compact.decode_shared(wire))

    def test_native_handback_keeps_complete_prose_json_fields_and_original_hash(self):
        import hashlib
        coverage = {'received':False, 'notes':['Original observation.', 'Later explicit retraction.'],
                    'unknown':None, 'pages':[{'page':0, 'received':True}, {'page':1, 'received':False}]}
        prefix = 'Original native notes remain unchanged.\n```json\n'
        suffix = '\n```\nThe remaining image was unseen.\n'
        original = prefix+json.dumps(coverage, indent=2)+suffix
        encoded = compact.native_handback(original)
        self.assertEqual('dispatch_lossless_native_handback/1', encoded['schema'])
        self.assertEqual(hashlib.sha256(original.encode()).hexdigest(), encoded['original_sha256'])
        self.assertEqual([{'text':prefix}, {'json':coverage,
            'original_sha256':hashlib.sha256(json.dumps(coverage,indent=2).encode()).hexdigest()},
            {'text':suffix}], encoded['parts'])
        self.assertEqual('Plain complete original note.', compact.native_handback('Plain complete original note.'))
        duplicate = '{"note":"Original", "note":"Retraction"}'
        self.assertEqual(duplicate, compact.native_handback(duplicate))

    def test_prior_review_keeps_all_original_findings_and_rechecks_unchanged_artifact(self):
        import independent_review_test as fixtures
        host = fixtures.AvailabilityTest('test_actual_capacity_error_is_distinct_from_rejection')
        host.setUp(); self.addCleanup(host.doCleanups)
        value = copy.deepcopy(host.value); value['verdict'] = 'revise'
        value['blocking_defects'] = ['Original independent failure remains rejected.']
        report, _ = host.call(raw=host.raw(value))
        name = 'out/dispatch/old-phone-review.json'; self.write(name, json.dumps(report, indent=2))
        original = (self.repo/name).read_bytes(); text = copy.deepcopy(self.text)
        text['files'][name] = original.decode()
        result, _ = compact.compact(text, self.package, 'phone', self.repo)
        prior = result['files'][name]
        self.assertEqual(prior['schema'], 'dispatch_verified_prior_review/1')
        self.assertEqual(prior['original_sha256'], compact.sha(self.repo/name))
        self.assertEqual(prior['provider_result'], independent_review.response_object(report['provider_evidence']['response']))
        self.assertEqual(prior['review']['verdict'], 'revise')
        self.assertEqual(prior['review']['blocking_defects'], value['blocking_defects'])
        self.assertEqual(result['files']['knowledge/craft/current-guide.md'], self.guide)
        self.assertEqual(compact.compact(result, self.package, 'phone', self.repo)[0], result)
        self.assertEqual((self.repo/name).read_bytes(), original)
        report['verdict'] = 'pass'; self.write(name, json.dumps(report))
        with self.assertRaisesRegex(ValueError, 'unverified'):
            compact.compact(result, self.package, 'phone', self.repo)

    def test_registry_retains_every_entry_and_original_data_hash(self):
        text = copy.deepcopy(self.text)
        name = 'config/modern_episode_registry.json'
        text['files'][name] = (self.repo/name).read_text()
        result, _ = compact.compact(text, self.package, 'phone', self.repo)
        self.assertEqual(compact.document(result['files'][name], self.board), json.loads(text['files'][name]))
        self.assertEqual(result['files'][name]['original_sha256'], compact.sha(self.repo/name))
        self.assertEqual(set(compact.document(result['files'][name], self.board)['episodes']), {'now', 'old'})


if __name__ == '__main__':
    unittest.main()
