"""No providers: current review content stays exact while verified history stays opaque."""
import copy
import gzip
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import measured_retime
import review_board_projection as views


def retained_board(date='2026-10-22'):
    files = json.loads(gzip.decompress((Path(__file__).parent /
        'fixtures/approved_retime_2026_10_21.json.gz').read_bytes()))
    original = json.loads(files['opening-a.json'])
    board = measured_retime.attach(copy.deepcopy(original), files['opening-a.json'],
                                   files['storyboard_critic.json'])
    board['date'] = date  # Synthetic future transport eligibility, never a production edit.
    return board


class ProjectionTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name); self.board = retained_board()
        self.path = self.root/'storyboard.json'; self.write_board()

    def write_board(self):
        self.path.write_text(json.dumps(self.board, indent=2) + '\n')
        self.ref = {'path': str(self.path), 'sha256': views.sha(self.path.read_bytes())}

    def test_exact_current_fields_remain_and_only_verified_archive_becomes_hashes(self):
        self.board['source_note'] = 'The literal critique_json is current source text.'
        self.write_board(); before = self.path.read_bytes(); original = copy.deepcopy(self.board)
        view = views.project(self.board, self.ref['sha256'])
        expected = copy.deepcopy(original)
        expected['narration_picture']['timing_provenance']['approved_retime'] = views.archive(view)
        self.assertEqual(view, expected)
        self.assertEqual(self.board, original)
        self.assertEqual(self.path.read_bytes(), before)
        proof = views.archive(original); marker = views.archive(view)
        self.assertEqual(marker['source_board_sha256'], self.ref['sha256'])
        self.assertEqual(marker['canonical_archive_sha256'], views.sha(views.canonical(proof).encode()))
        self.assertEqual(marker['archived_critique_sha256'], proof['critique_sha256'])
        self.assertEqual(marker['archived_board_sha256'], proof['board_sha256'])
        self.assertEqual(view['narration_picture']['clauses'], original['narration_picture']['clauses'])
        self.assertNotIn('board_json', marker); self.assertNotIn('critique_json', marker)
        self.assertLess(len(views.canonical(marker)), len(views.canonical(proof)) // 100)

    def test_historical_boards_and_unknown_current_fields_are_unchanged(self):
        old = retained_board('2026-10-21')
        self.assertEqual(old, views.project(old, 'a'*64))
        ordinary = {'date': '2026-10-22', 'source': {'board_json': 'literal source evidence'}}
        self.assertEqual(ordinary, views.project(ordinary, 'a'*64))
        data = {'role': 'picture', 'date': '2026-10-21', 'board': self.ref}
        self.assertEqual(data, views.bind_native(copy.deepcopy(data)))

    def test_changed_original_review_or_unknown_archive_is_not_hidden(self):
        for mutate in (lambda proof: proof.update(critique_json=proof['critique_json'] + ' '),
                       lambda proof: proof.update(board_json=proof['board_json'] + ' '),
                       lambda proof: proof.update(schema='unverified-history')):
            bad = copy.deepcopy(self.board); mutate(views.archive(bad))
            with self.assertRaises(ValueError): views.project(bad, self.ref['sha256'])

    def test_native_views_bind_all_current_boards_without_changing_report_identities(self):
        second = copy.deepcopy(self.board); second['title'] += ' alternate'
        alternate = self.root/'alternate.json'; alternate.write_text(json.dumps(second))
        alt_ref = {'path': str(alternate), 'sha256': views.sha(alternate.read_bytes())}
        data = {'role': 'storyboard-critic', 'date': self.board['date'], 'board': self.ref,
                'treatments': [self.ref], 'phone_options': [{'id': 'b', 'board': alt_ref}],
                'code_report_bindings': {'treatments': [{'board': self.ref,
                    'report_bindings': {'concept_sha256': views.archive(self.board)['concept_sha256']}}]}}
        before = copy.deepcopy(data); views.bind_native(data)
        self.assertEqual({self.ref['sha256'], alt_ref['sha256']}, set(data[views.FIELD]))
        for key in before: self.assertEqual(before[key], data[key])
        self.assertEqual(views.validate_native(data), views.NATIVE_NOTE)
        view_ref = data[views.FIELD][self.ref['sha256']]
        view_path = Path(view_ref['path']); view = json.loads(view_path.read_text())
        self.assertEqual(views.sha(view_path.read_bytes()), view_ref['sha256'])
        self.assertEqual(views.archive(view)['source_board_sha256'], self.ref['sha256'])
        view['narration_picture']['clauses'][0]['text'] += ' changed'
        view_path.write_text(views.canonical(view) + '\n')
        view_ref['sha256'] = views.sha(view_path.read_bytes())
        with self.assertRaisesRegex(ValueError, 'view is missing or changed'):
            views.validate_native(data)

    def test_native_claude_and_codex_assignments_route_to_real_views_before_dispatch(self):
        import agent_runtime
        import claude_runtime
        for runtime, prompt_key, args_key in ((claude_runtime, 'prompt', 'agent_args'),
                                               (agent_runtime, 'message', 'spawn_args')):
            data = {'role': 'story', 'date': self.board['date'], 'board': self.ref,
                    'agent_assignment': runtime.assignment('story', self.board['date']),
                    'brief': '.claude/agents/scorer.md'}
            views.bind_native(data)
            packet = self.root/'packet.json'; packet.write_text(json.dumps(data))
            before = packet.read_bytes()
            # Existing media/guide gates have separate fixtures. This exercises the real
            # projection validator and assignment route, without spawning a worker.
            with patch('agent_runtime.required_inputs'), \
                    patch('publication_owner.enabled', return_value=False), \
                    patch('publication_owner.local_workspace', return_value=False), \
                    patch.object(claude_runtime, 'motion_inputs'), \
                    patch.object(claude_runtime, 'image_policy_inputs'):
                result = runtime.plan('story', packet, 'story', 'Review this exact film independently.')
                self.assertIn('review_board_views', result[args_key][prompt_key])
                self.assertIn('machine identities only', result[args_key][prompt_key])
                self.assertEqual(before, packet.read_bytes())
                self.assertEqual(self.ref, json.loads(packet.read_text())['board'])
                self.assertTrue(Path(data[views.FIELD][self.ref['sha256']]['path']).is_file())
                data.pop(views.FIELD); packet.write_text(json.dumps(data))
                with self.assertRaisesRegex(ValueError, 'bindings are missing or changed'):
                    runtime.plan('story', packet, 'story', 'Review this exact film independently.')

    def test_common_and_treatment_provider_views_keep_sources_guides_and_original_hashes(self):
        import independent_packet_compaction as compact
        import independent_review
        package = self.root/'out/dispatch'; (package/'openings').mkdir(parents=True)
        common = package/'storyboard.json'; common.write_bytes(self.path.read_bytes())
        a = package/'openings/a.json'; a.write_bytes(common.read_bytes())
        b = package/'openings/b.json'; other = copy.deepcopy(self.board)
        other['film_direction']['variant'] = 'b'; b.write_text(json.dumps(other))
        text = {'board': self.board, 'claims': {'claims': [{'quote': 'Exact fetched source quote.'}]},
            'files': {str(path.relative_to(self.root)): path.read_text() for path in (a, b)}}
        guide = 'Complete current guide, including all strict review criteria.\n' * 80
        text['files']['knowledge/craft/current-guide.md'] = guide
        before = copy.deepcopy(text)
        with patch.object(independent_review, 'REPO', self.root):
            result, bindings = independent_review.bounded_packet(text, common, 'code',
                {'board_sha256': views.sha(common.read_bytes())})
            again, again_bindings = independent_review.bounded_packet(result, common, 'code', bindings)
        self.assertEqual(result, again); self.assertEqual(bindings, again_bindings)
        self.assertEqual(text, before); self.assertEqual(result['claims'], text['claims'])
        self.assertEqual(result['files']['knowledge/craft/current-guide.md'], guide)
        self.assertEqual(bindings['board_sha256'], views.sha(common.read_bytes()))
        for path in (a, b):
            item = result['files'][str(path.relative_to(self.root))]
            expected = views.project(json.loads(path.read_text()), views.sha(path.read_bytes()))
            self.assertEqual(compact.document(item, result['board']), expected)
            self.assertEqual(item['original_sha256'], views.sha(path.read_bytes()))
        prompt = independent_review.prompt('code', result)
        self.assertIn(views.TRANSPORT_NOTE, prompt)
        self.assertNotIn('"critique_json":', prompt); self.assertNotIn('"board_json":', prompt)
        self.assertEqual(views.archive(self.board)['critique_json'], views.archive(json.loads(common.read_text()))['critique_json'])


if __name__ == '__main__':
    unittest.main()
