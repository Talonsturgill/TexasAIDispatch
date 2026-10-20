"""Actual host packets and deduplicated Claude transcript usage stay explicit."""
import json
import copy
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import claude_runtime as runtime


class RuntimeTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)

    def test_compact_image_instructions_keep_the_same_policy_and_complete_coverage_schema(self):
        original={'role':'picture','date':'2026-10-15','instructions':'Read all bound guides.',
                  'motion_sequence':{'path':'/owned/index.json','sha256':'a'*64}}
        verbose=runtime.image_reading(dict(original))
        compact=runtime.image_reading(dict(original),compact=True)
        self.assertEqual(verbose['image_read_policy'],compact['image_read_policy'])
        self.assertEqual(original['motion_sequence'],compact['motion_sequence'])
        self.assertLess(len(compact['instructions']),len(verbose['instructions']))
        for required in ('ONE','partial','never infer pixels','dispatch_claude_image_coverage/1',
                         'packet_sha256','sequences','index_sha256','pages','file','first_frame',
                         'last_frame','received','observed','thirty characters','timed observations'):
            self.assertIn(required,compact['instructions'])

    def test_compact_current_scorer_still_probes_before_any_full_review(self):
        data=runtime.image_reading({'role':'picture','date':'2026-10-17',
                                    'instructions':'Read all current full guides.'},compact=True)
        self.assertTrue(data['instructions'].startswith('First test actual image access:'))
        self.assertEqual(runtime.image_read_policy('2026-10-17'),data['image_read_policy'])
        for instruction in ('before guides/source','literal error','page identity','partial/no verdict',
                            'stop','all full guides','whole sequence'):
            self.assertIn(instruction,data['instructions'])

    def test_early_packet_uses_claude_leaf_arguments(self):
        source = self.root / 'source.json'; source.write_text('{"source":"current"}')
        packet = self.root / 'packet.json'
        packet.write_text(json.dumps(runtime.input_packet('researcher', '2026-10-09', [source])))
        result = runtime.plan('researcher', packet, 'researcher', 'Research the assigned sourced physical action.')
        self.assertEqual('researcher', result['agent_args']['subagent_type'])
        self.assertEqual('claude-haiku-5-5', result['assignment']['model'])
        self.assertEqual('high', result['assignment']['effort'])
        self.assertNotIn('run_in_background', result['agent_args'])
        self.assertNotIn('spawn_args', result)
        self.assertLessEqual(len(result['agent_args']['prompt']), 1800)

    def test_cloud_plan_refuses_inherited_sparse_production_before_any_paid_worker(self):
        with patch.dict('os.environ', {'CLAUDE_CODE_REMOTE': 'true'}), \
                patch('source_view.git', return_value='true'), \
                self.assertRaisesRegex(ValueError, 'before reserving any content worker'):
            runtime.plan('researcher', self.root/'not-started.json', 'researcher', 'Inspect current sources.')

    def cloud_visual_fixture(self):
        import bootstrap_claude_hooks
        import visual_observations
        primary = (self.root / 'primary').resolve()
        primary.mkdir()
        bootstrap_claude_hooks.bootstrap(primary, runtime.REPO, prelaunch_router=True)
        visual_observations.install(runtime.REPO, primary)
        data = runtime.image_reading({'role': 'picture', 'date': '2026-10-20',
            'agent_assignment': runtime.assignment('picture', '2026-10-20'),
            'brief': '.claude/agents/scorer.md', 'instructions': 'Read every current guide.'})
        packet = self.root / 'cloud-visual.json'
        packet.write_text(json.dumps(data))
        return primary, packet

    def test_cloud_visual_plan_checks_the_registered_primary_without_changing_home_or_settings(self):
        primary, packet = self.cloud_visual_fixture()
        process_home = self.root / 'different-process-home'
        original_home = os.environ.get('HOME')
        settings = primary / '.claude/settings.json'
        before = settings.read_bytes()
        with patch.dict('os.environ', {'CLAUDE_CODE_REMOTE': 'true'}), \
                patch('source_view.git', return_value=''), \
                patch('pathlib.Path.home', return_value=process_home), \
                patch.object(runtime, 'CLOUD_PRIMARY_WORKSPACE', primary), \
                patch('agent_runtime.required_inputs'), patch('agent_runtime.validate_references'), \
                patch.object(runtime, 'motion_inputs'):
            result = runtime.plan('picture', packet, 'picture', 'Review the exact final film independently.')
        self.assertEqual('dispatch-visual-scorer', result['agent_args']['subagent_type'])
        self.assertEqual(original_home, os.environ.get('HOME'))
        self.assertEqual(before, settings.read_bytes())
        self.assertFalse(process_home.exists())

    def test_cloud_primary_still_refuses_a_missing_actual_write_hook_before_returning_arguments(self):
        primary, packet = self.cloud_visual_fixture()
        settings = primary / '.claude/settings.json'
        data = json.loads(settings.read_text())
        data['hooks']['PostToolUse'] = [row for row in data['hooks']['PostToolUse']
                                       if row['matcher'] != 'Write']
        settings.write_text(json.dumps(data))
        before = settings.read_bytes()
        with patch.dict('os.environ', {'CLAUDE_CODE_REMOTE': 'true'}), \
                patch('source_view.git', return_value=''), \
                patch.object(runtime, 'CLOUD_PRIMARY_WORKSPACE', primary), \
                patch('agent_runtime.required_inputs'), patch('agent_runtime.validate_references'), \
                patch.object(runtime, 'motion_inputs'), \
                self.assertRaisesRegex(ValueError, 'primary-scope visual hooks are missing or changed'):
            runtime.plan('picture', packet, 'picture', 'Review the exact final film independently.')
        self.assertEqual(before, settings.read_bytes())

    def test_cloud_primary_path_matches_the_saved_prelaunch_setup_contract(self):
        setup = (runtime.REPO / 'scripts/claude_environment_setup.sh').read_text()
        for command in ('scripts/bootstrap_claude_hooks.py', 'scripts/visual_observations.py install'):
            self.assertIn(command + ' --workspace ' + str(runtime.CLOUD_PRIMARY_WORKSPACE), setup)

    def test_current_early_workers_require_actual_provider_availability(self):
        source = self.root/'source.json'; source.write_text('{}')
        with patch('provider_availability.research_receipt', side_effect=ValueError('generation probe missing')):
            for role in ('researcher', 'validator'):
                with self.assertRaisesRegex(ValueError, 'generation probe missing'):
                    runtime.input_packet(role, '2026-10-16', [source])
        receipt = self.root/'receipt.json'; receipt.write_text('{"actual":"bound receipt"}')
        with patch('provider_availability.research_receipt', side_effect=lambda *args: runtime.bound(receipt)):
            data = runtime.input_packet('researcher', '2026-10-16', [source])
            packet = self.root/'packet.json'; packet.write_text(json.dumps(data))
            self.assertEqual(runtime.plan('researcher', packet, 'researcher', 'Research the sourced action.')['assignment']['model'], 'claude-haiku-5-5')
            data['provider_availability']['sha256'] = '0'*64; packet.write_text(json.dumps(data))
            with self.assertRaisesRegex(ValueError, 'availability receipt'):
                runtime.plan('researcher', packet, 'researcher', 'Research the sourced action.')

    def test_changed_packet_input_is_rejected(self):
        source = self.root / 'source.json'; source.write_text('{}')
        packet = self.root / 'packet.json'
        packet.write_text(json.dumps(runtime.input_packet('validator', '2026-10-09', [source])))
        source.write_text('{"changed":true}')
        with self.assertRaisesRegex(ValueError, 'changed'):
            runtime.plan('validator', packet, 'validator', 'Validate current source claims.')

    def code_data(self, edition='2026-10-20'):
        source = self.root / 'Film.tsx'; source.write_text('export const Film = 1;')
        claims = self.root / 'claims.json'; claims.write_text('{"claims":[]}')
        for option in ('a', 'b'):
            (self.root / ('opening-' + option + '.json')).write_text(json.dumps({
                'date': edition, 'scenes': [{'id': 's1', 'visual_description': option}]}))
        board = self.root / 'storyboard.json'; board.write_bytes((self.root / 'opening-a.json').read_bytes())
        role = 'storyboard-critic'
        return {'role': role, 'date': edition, 'agent_assignment': runtime.assignment(role, edition),
                'brief': '.claude/agents/storyboard-critic.md', 'agent_contracts': runtime.contracts(role),
                'board': runtime.bound(board), 'claims': runtime.bound(claims),
                'treatments': [runtime.bound(self.root / ('opening-' + option + '.json')) for option in ('a', 'b')]}, source

    def test_code_bindings_supply_both_actual_story_hashes_without_any_grade(self):
        import critic_gate
        import daily_production
        data, source = self.code_data()
        with patch.object(critic_gate, 'REPO', self.root), patch.object(critic_gate, 'renderer_files', return_value=[source]), \
                patch('agent_runtime.treatment_assets', return_value=[]):
            result = runtime.code_report_bindings(data)
            self.assertEqual(result, runtime.adapt_packet(data)['code_report_bindings'])
        self.assertEqual(['a', 'b'], [row['id'] for row in result['treatments']])
        for row in result['treatments']:
            board = runtime.read(row['board']['path'])
            self.assertEqual(daily_production.story_digest(board), row['report_bindings']['story_review']['story_sha256'])
            self.assertEqual(data['claims']['sha256'], row['report_bindings']['story_review']['claims_sha256'])
        self.assertNotEqual(*[row['report_bindings']['story_review']['story_sha256'] for row in result['treatments']])
        self.assertNotRegex(json.dumps(result), r'"(?:verdict|score|pass|blocking_defects)"')

    def test_future_code_plan_requires_fresh_bindings_before_returning_json_only_arguments(self):
        import critic_gate
        data, source = self.code_data()
        packet = self.root / 'code.json'
        with patch.object(critic_gate, 'REPO', self.root), patch.object(critic_gate, 'renderer_files', return_value=[source]), \
                patch('agent_runtime.required_inputs'):
            packet.write_text(json.dumps(data))
            with self.assertRaisesRegex(ValueError, 'bindings are missing or stale'):
                runtime.plan('storyboard-critic', packet, 'code_review', 'Review both callable treatments at code scope.')
            data['code_report_bindings'] = runtime.code_report_bindings(data)
            packet.write_text(json.dumps(data))
            result = runtime.plan('storyboard-critic', packet, 'code_review', 'Review both callable treatments at code scope.')
            self.assertIn('complete gate-ready JSON', result['agent_args']['prompt'])
            self.assertNotIn('or consolidated defect list', result['agent_args']['prompt'])
            self.assertEqual(('claude-opus-5-5', 'high'), tuple(result['assignment'][k] for k in ('model', 'effort')))
            source.write_text('export const Film = 2;')
            with self.assertRaisesRegex(ValueError, 'bindings are missing or stale'):
                runtime.plan('storyboard-critic', packet, 'code_review', 'Review both callable treatments at code scope.')

    def test_historical_code_plan_does_not_require_or_rewrite_future_report_bindings(self):
        data, _ = self.code_data('2026-10-19')
        packet = self.root / 'code.json'; packet.write_text(json.dumps(data))
        with patch('agent_runtime.required_inputs'):
            result = runtime.plan('storyboard-critic', packet, 'code_review', 'Review both callable treatments at code scope.')
        self.assertIn('or consolidated defect list', result['agent_args']['prompt'])
        self.assertNotIn('run_in_background', result['agent_args'])

    def test_historical_assignment_is_not_replaced(self):
        with self.assertRaises(ValueError):
            runtime.assignment('picture', '2026-10-08')

    def future_source_packet(self, role='researcher', edition='2026-10-20'):
        source = self.root / ('story_selection.json' if role == 'validator' else 'source.json')
        source.write_text(json.dumps({'schema': 'dispatch_story_selection/1', 'selected': {
            'movement': {'object': 'AI cameras on sanitation brush trucks'}}}))
        receipt = self.root / 'receipt.json'; receipt.write_text('{"fixture":true}')
        patcher = patch('provider_availability.research_receipt', return_value=runtime.bound(receipt))
        patcher.start(); self.addCleanup(patcher.stop)
        packet = self.root / 'packet.json'
        packet.write_text(json.dumps(runtime.input_packet(role, edition, [source])))
        return packet

    def test_future_research_plan_requires_actual_subject_before_a_worker_can_be_planned(self):
        packet = self.future_source_packet()
        with self.assertRaisesRegex(ValueError, 'needs --subject'):
            runtime.plan('researcher', packet, 'researcher', 'Research the sourced action.')

    def test_future_duplicate_is_refused_with_retained_real_archive_evidence(self):
        packet = self.future_source_packet(); before = packet.read_bytes()
        with self.assertRaisesRegex(ValueError, '2026-09-26.*brush truck'):
            runtime.plan('researcher', packet, 'researcher', 'Research the sourced action.',
                         subject='AI cameras on sanitation brush trucks')
        reports = list(self.root.glob('packet-subject-*.json'))
        self.assertEqual(len(reports), 1)
        result = json.loads(reports[0].read_text())
        self.assertFalse(result['fresh'])
        self.assertEqual(packet.read_bytes(), before)

    def test_future_validator_checks_bound_selection_instead_of_the_generic_scope(self):
        packet = self.future_source_packet(role='validator')
        with self.assertRaisesRegex(ValueError, 'repeated story subject before paid validator'):
            runtime.plan('validator', packet, 'validator', 'Independently verify every source.',
                         subject='An unrelated fresh subject cannot replace the bound selection')
        self.assertFalse(json.loads(next(self.root.glob('packet-subject-*.json')).read_text())['fresh'])

    def test_fresh_subject_keeps_haiku_route_compact_prompt_and_exact_report_binding(self):
        packet = self.future_source_packet()
        result = runtime.plan('researcher', packet, 'researcher', 'Research the sourced action.',
                              subject='MD Anderson SPACER T cells cut a mucin barrier')
        self.assertEqual(result['assignment']['model'], 'claude-haiku-5-5')
        self.assertEqual(result['assignment']['effort'], 'high')
        self.assertIs(result['agent_args']['run_in_background'], False)
        self.assertLessEqual(len(result['agent_args']['prompt']), 1800)
        self.assertIn('mucin barrier', result['agent_args']['prompt'])
        report = result['story_subject_screen']
        self.assertEqual(runtime.digest(report['path']), report['sha256'])
        self.assertTrue(json.loads(Path(report['path']).read_text())['fresh'])

    def test_active_october19_policy_is_unchanged(self):
        packet = self.future_source_packet(edition='2026-10-19')
        with patch('dedupe.check_subject', side_effect=AssertionError('must preserve active policy')):
            result = runtime.plan('researcher', packet, 'researcher', 'Research the sourced action.')
        self.assertNotIn('story_subject_screen', result)
        self.assertNotIn('run_in_background', result['agent_args'])

    def test_future_final_panel_keeps_three_independent_scorers_available_for_concurrent_execution(self):
        for role in ('picture', 'story', 'sound'):
            with self.subTest(role=role):
                data = runtime.image_reading({'role': role, 'date': '2026-10-20',
                    'agent_assignment': runtime.assignment(role, '2026-10-20'),
                    'brief': '.claude/agents/scorer.md', 'instructions': 'Read every current guide.'})
                packet = self.root / (role + '.json'); packet.write_text(json.dumps(data))
                with patch('agent_runtime.required_inputs'), patch('agent_runtime.validate_references'), \
                        patch.object(runtime, 'motion_inputs'):
                    result = runtime.plan(role, packet, role, 'Review the exact final film independently.')
                self.assertNotIn('run_in_background', result['agent_args'])
                self.assertEqual('dispatch-visual-scorer', result['agent_args']['subagent_type'])
                self.assertEqual(('claude-sonnet-5-5', 'medium', 'scorer_calls'),
                    tuple(result['assignment'][field] for field in ('model', 'effort', 'resource')))

    def test_phone_scope_cannot_launch_from_midpoint_only_packet(self):
        role = 'storyboard-critic'; edition = '2026-10-15'
        packet = self.root / 'sparse-phone.json'
        packet.write_text(json.dumps({'role': role, 'date': edition,
            'agent_assignment': runtime.assignment(role, edition),
            'brief': '.claude/agents/storyboard-critic.md'}))
        with patch('agent_runtime.required_inputs'), patch('agent_runtime.validate_references'):
            with self.assertRaisesRegex(ValueError, 'both complete exact-phone motion sequences'):
                runtime.plan(role, packet, 'critic', 'Review both exact phone films.')

    def test_image_only_final_plan_requires_sequential_delivery_policy(self):
        packet = self.root / 'final-packet.json'; role = 'picture'; edition = '2026-10-15'
        data = {'role': role, 'date': edition, 'agent_assignment': runtime.assignment(role, edition),
                'brief': '.claude/agents/scorer.md', 'instructions': ''}
        packet.write_text(json.dumps(data))
        with patch('agent_runtime.required_inputs'), patch('agent_runtime.validate_references'), patch.object(runtime, 'motion_inputs'):
            with self.assertRaisesRegex(ValueError, 'sequential delivery'):
                runtime.plan(role, packet, 'picture', 'Independently review the exact final film.')
            runtime.image_reading(data); packet.write_text(json.dumps(data))
            result = runtime.plan(role, packet, 'picture', 'Independently review the exact final film.')
            self.assertEqual(result['assignment']['model'], 'claude-sonnet-5-5')
            data['image_read_policy']['parallel_image_reads'] = True; packet.write_text(json.dumps(data))
            with self.assertRaisesRegex(ValueError, 'sequential delivery'):
                runtime.plan(role, packet, 'picture', 'Independently review the exact final film.')

    def test_probe_first_policy_preserves_historical_packets(self):
        historical = {'schema': 'dispatch_claude_image_read_policy/1', 'images_per_model_step': 1,
            'parallel_image_reads': False, 'note_before_next_read': True,
            'missing_image': 'return partial immediately; no repeated bulk reads',
            'coverage_schema': 'dispatch_claude_image_coverage/1'}
        for edition in (None, '2026-10-09', '2026-10-16'):
            with self.subTest(edition=edition):
                self.assertEqual(historical, runtime.image_read_policy(edition))
                data = {'date': edition, 'instructions': 'Original required guides.'}
                runtime.image_reading(data)
                self.assertTrue(data['instructions'].startswith('Original required guides.'))
                runtime.image_policy_inputs(data)

    def test_future_phone_and_final_packets_require_probe_before_full_guide_reading(self):
        for role in ('storyboard-critic', 'picture', 'story', 'sound'):
            with self.subTest(role=role):
                data = {'role': role, 'date': '2026-10-17', 'instructions': 'Read all required guides.'}
                runtime.image_reading(data)
                self.assertTrue(data['instructions'].startswith('First test actual image access:'))
                self.assertIn('partial coverage and no verdict', data['instructions'])
                self.assertIn('then read every required full guide', data['instructions'])
                self.assertIn('Read all required guides.', data['instructions'])
                runtime.image_policy_inputs(data)
                data['image_read_policy'].pop('access_probe')
                with self.assertRaisesRegex(ValueError, 'sequential delivery'):
                    runtime.image_policy_inputs(data)

    def test_october20_public_image_descriptions_require_the_current_packet_policy(self):
        self.assertNotIn('note_channel', runtime.image_read_policy('2026-10-19'))
        for compact in (False, True):
            with self.subTest(compact=compact):
                data = {'role': 'storyboard-critic', 'date': '2026-10-20',
                        'instructions': 'Read the complete bound guides.'}
                runtime.image_reading(data, compact=compact)
                self.assertEqual('write_tool_artifact', data['image_read_policy']['note_channel'])
                self.assertEqual('brief_public_image_description', data['image_read_policy']['note_scope'])
                self.assertEqual('immediate_after_read', data['image_read_policy']['unavailable_observation_timing'])
                self.assertIn('public image annotations', data['instructions'])
                self.assertIn('guarded Write tool', data['instructions'])
                runtime.image_policy_inputs(data)
                for mutate in (lambda p:p.pop('note_channel'),
                               lambda p:p.update(note_channel='receipt_only'),
                               lambda p:p.update(note_scope='tool_delivery_receipt'),
                               lambda p:p.pop('unavailable_observation_timing')):
                    changed = copy.deepcopy(data); mutate(changed['image_read_policy'])
                    with self.assertRaisesRegex(ValueError, 'sequential delivery'):
                        runtime.image_policy_inputs(changed)

    def test_future_plan_refuses_a_legacy_access_policy_before_starting_a_worker(self):
        edition = '2026-10-17'
        data = {'role': 'picture', 'date': edition,
                'agent_assignment': runtime.assignment('picture', edition),
                'brief': '.claude/agents/scorer.md', 'instructions': '',
                'image_read_policy': runtime.image_read_policy('2026-10-16')}
        packet = self.root / 'future-packet.json'
        packet.write_text(json.dumps(data))
        with patch('agent_runtime.required_inputs'), patch('agent_runtime.validate_references'), patch.object(runtime, 'motion_inputs'):
            with self.assertRaisesRegex(ValueError, 'sequential delivery'):
                runtime.plan('picture', packet, 'picture', 'Review the exact final film.')
            runtime.image_reading(data); packet.write_text(json.dumps(data))
            result = runtime.plan('picture', packet, 'picture', 'Review the exact final film.')
            self.assertEqual('claude-sonnet-5-5', result['assignment']['model'])

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

    def test_initial_authoring_packet_never_authorizes_a_capture(self):
        self.assertFalse(runtime.CAPTURE_DENIED['allowed'])
        self.assertIn('charged render reservation', runtime.CAPTURE_DENIED['requires'])

    def test_usage_without_identity_is_not_guessed(self):
        path = self.root / 'session.jsonl'
        path.write_text(json.dumps({'type': 'assistant', 'message': {'usage': {'output_tokens': 1}}}) + '\n')
        with self.assertRaisesRegex(ValueError, 'identity'):
            runtime.usage_report([path])

    def test_phase_entry_makes_an_active_edition_durable_and_stops_when_it_cannot(self):
        from unittest.mock import patch
        import claude_checkpoint
        (self.root / 'run_state.json').write_text('{}')
        with patch.object(claude_checkpoint, 'repo_of', return_value=self.root), \
                patch.object(claude_checkpoint, 'save_with_recovery',
                             side_effect=claude_checkpoint.UnbackedError('remote unreachable')):
            with self.assertRaises(claude_checkpoint.UnbackedError):
                runtime.phase('research', self.root)
        # The marker is written first so the failed phase entry itself is visible.
        marker = json.loads((self.root / 'claude-phases.jsonl').read_text().splitlines()[-1])
        self.assertEqual('research', marker['phase'])
        with patch.object(claude_checkpoint, 'repo_of', return_value=self.root), \
                patch.object(claude_checkpoint, 'save_with_recovery',
                             return_value={'commit': 'a' * 40, 'files': 3}) as save:
            runtime.phase('picture', self.root)
            save.assert_called_once()
        with patch.object(claude_checkpoint, 'save_with_recovery') as save:
            runtime.phase('audio-render', self.root, checkpoint=False)
            save.assert_not_called()

    def test_phase_without_an_edition_writes_only_its_marker(self):
        from unittest.mock import patch
        import claude_checkpoint
        with patch.object(claude_checkpoint, 'save_with_recovery') as save:
            runtime.phase('research', self.root)
            save.assert_not_called()


if __name__ == '__main__':
    unittest.main()
