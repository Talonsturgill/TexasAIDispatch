"""Actual host packets and deduplicated Claude transcript usage stay explicit."""
import json
from pathlib import Path
import tempfile
import unittest
import claude_runtime as runtime


class RuntimeTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)

    def test_early_packet_uses_claude_leaf_arguments(self):
        source = self.root / 'source.json'; source.write_text('{"source":"current"}')
        packet = self.root / 'packet.json'
        packet.write_text(json.dumps(runtime.input_packet('researcher', '2026-10-09', [source])))
        result = runtime.plan('researcher', packet, 'researcher', 'Research the assigned sourced physical action.')
        self.assertEqual('researcher', result['agent_args']['subagent_type'])
        self.assertEqual('claude-haiku-5-5', result['assignment']['model'])
        self.assertEqual('high', result['assignment']['effort'])
        self.assertNotIn('spawn_args', result)
        self.assertLessEqual(len(result['agent_args']['prompt']), 1800)

    def test_changed_packet_input_is_rejected(self):
        source = self.root / 'source.json'; source.write_text('{}')
        packet = self.root / 'packet.json'
        packet.write_text(json.dumps(runtime.input_packet('validator', '2026-10-09', [source])))
        source.write_text('{"changed":true}')
        with self.assertRaisesRegex(ValueError, 'changed'):
            runtime.plan('validator', packet, 'validator', 'Validate current source claims.')

    def test_historical_assignment_is_not_replaced(self):
        with self.assertRaises(ValueError):
            runtime.assignment('picture', '2026-10-08')

    def planned_boards(self):
        requests = []
        for role in ('hero', 'support'):
            requests.append({'id': role, 'role': role,
                'file': 'video-engine/src/modern/episodes/2026-10-09-claude-pilot/' + role + '.tsx',
                'export': role.title() + 'Rig', 'prompt': ' '.join(['finished'] * 32),
                'purpose': 'A fresh recognizable subject performs the current action.',
                'source_limit': 'Illustration of the sourced mechanism; no invented result.',
                'scene_ids': ['s1'], 'action_uses': [{'scene_id': 's1', 'event_id': 'e1',
                    'view': 'wide', 'action_id': 'move', 'subject_ids': [role]}]})
        board = {'date': '2026-10-09', 'scenes': [{'id': 's1', 'visual_events': [{'id': 'e1'}]}],
                 'film_direction': {'episode': 'new-pilot', 'variant': 'a', 'shots': [{'scene_id': 's1', 'view': 'wide'}]},
                 'story_art': {'version': 'authored-story-art-v1', 'runtime': 'claude-sonnet-v1',
                    'edition_id': '2026-10-09-claude-pilot', 'requests': requests}}
        for variant in ('a', 'b'):
            board['film_direction']['variant'] = variant
            (self.root / ('opening-' + variant + '.json')).write_text(json.dumps(board))
        board['film_direction']['variant'] = 'a'
        path = self.root / 'storyboard.json'; path.write_text(json.dumps(board))
        claims = self.root / 'claims.json'; claims.write_text('{"claims":[]}')
        return path, claims

    def test_initial_builder_can_create_art_before_it_exists(self):
        board, claims = self.planned_boards()
        packet = self.root / 'builder.json'
        packet.write_text(json.dumps(runtime.authoring_packet(board, claims)))
        result = runtime.plan('scene-builder', packet, 'initial_builder', 'Build both complete source-bound treatments.')
        self.assertEqual('scene-builder', result['agent_args']['subagent_type'])
        self.assertEqual('claude-opus-5-5', result['assignment']['model'])
        self.assertEqual('high', result['assignment']['effort'])

    def test_initial_builder_cannot_receive_stale_guides(self):
        board, claims = self.planned_boards()
        data = runtime.authoring_packet(board, claims); data['craft_readings'] = []
        with self.assertRaisesRegex(ValueError, 'guides'):
            runtime.initial_authoring_inputs(data)

    def test_initial_packet_cannot_be_used_for_a_critic(self):
        board, claims = self.planned_boards()
        data = runtime.authoring_packet(board, claims); data['role'] = 'storyboard-critic'
        with self.assertRaisesRegex(ValueError, 'Only'):
            runtime.initial_authoring_inputs(data)

    def test_streamed_content_blocks_are_counted_once(self):
        path = self.root / 'session.jsonl'
        message = {'id': 'msg-one', 'model': 'claude-sonnet-5-5',
                   'usage': {'input_tokens': 10, 'cache_creation_input_tokens': 20,
                             'cache_read_input_tokens': 100, 'output_tokens': 5}}
        first = {'type': 'assistant', 'timestamp': '2026-10-09T23:00:00Z', 'message': message}
        second = json.loads(json.dumps(first)); second['message']['usage']['output_tokens'] = 12
        path.write_text(json.dumps(first) + '\n' + json.dumps(second) + '\n')
        report = runtime.usage_report([path])
        self.assertEqual(1, report['api_calls'])
        self.assertEqual(12, report['totals']['output_tokens'])
        self.assertEqual(10, report['totals']['input_tokens'])
        self.assertEqual(100, report['totals']['cache_read_input_tokens'])
        self.assertIsNone(report['calls'][0]['observed_effort'])
        self.assertIsNone(report['account_bill_usd'])

    def test_copied_message_is_not_counted_in_two_sessions(self):
        row = {'type': 'assistant', 'message': {'id': 'shared', 'model': 'claude-sonnet-5-5',
                                               'usage': {'input_tokens': 5, 'output_tokens': 9}}}
        paths = [self.root / 'root.jsonl', self.root / 'child.jsonl']
        for path in paths:
            path.write_text(json.dumps(row) + '\n')
        self.assertEqual(1, runtime.usage_report(paths)['api_calls'])

    def test_phase_attribution_uses_recorded_utc_markers(self):
        phases = self.root / 'phases.jsonl'
        phases.write_text(json.dumps({'at': '2026-10-09T22:00:00Z', 'phase': 'research'}) + '\n')
        session = self.root / 'session.jsonl'
        session.write_text(json.dumps({'type': 'assistant', 'timestamp': '2026-10-09T22:01:00Z',
            'message': {'id': 'phase-call', 'usage': {'input_tokens': 17, 'output_tokens': 3}}}) + '\n')
        result = runtime.usage_report([session], phases=phases)
        self.assertEqual(17, result['observed_phases']['research']['input_tokens'])
        self.assertEqual('research', result['calls'][0]['observed_phase'])

    def test_usage_without_identity_is_not_guessed(self):
        path = self.root / 'session.jsonl'
        path.write_text(json.dumps({'type': 'assistant', 'message': {'usage': {'output_tokens': 1}}}) + '\n')
        with self.assertRaisesRegex(ValueError, 'identity'):
            runtime.usage_report([path])

    def test_phase_entry_checkpoints_an_active_edition_but_never_blocks_on_it(self):
        from unittest.mock import patch
        import claude_checkpoint
        (self.root / 'run_state.json').write_text('{}')
        with patch.object(claude_checkpoint, 'save', side_effect=RuntimeError('remote unreachable')):
            runtime.phase('research', self.root)
        marker = json.loads((self.root / 'claude-phases.jsonl').read_text().splitlines()[-1])
        self.assertEqual('research', marker['phase'])
        with patch.object(claude_checkpoint, 'save', return_value={'commit': 'a' * 40, 'files': 3}) as save:
            runtime.phase('picture', self.root)
            save.assert_called_once()
        with patch.object(claude_checkpoint, 'save') as save:
            runtime.phase('audio-render', self.root, checkpoint=False)
            save.assert_not_called()

    def test_phase_without_an_edition_writes_only_its_marker(self):
        from unittest.mock import patch
        import claude_checkpoint
        with patch.object(claude_checkpoint, 'save') as save:
            runtime.phase('research', self.root)
            save.assert_not_called()


if __name__ == '__main__':
    unittest.main()
