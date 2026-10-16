"""Compaction reduces real duplicate input while preserving every current semantic field."""
import copy
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


if __name__ == '__main__':
    unittest.main()
