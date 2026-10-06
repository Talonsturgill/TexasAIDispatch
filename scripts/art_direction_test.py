"""Mutate executable profile bindings, not artistic verdicts."""
import copy
import json
import tempfile
import unittest
from pathlib import Path
import art_direction as a
import daily_production as d
import critic_gate
import cinematic_lab


class ArtDirectionTest(unittest.TestCase):
    def setUp(self):
        self.board = json.loads((a.REPO / 'experiments/cinematic-upgrade-2026-10-06/b.json').read_text())

    def test_dated_requirement_preserves_historical_inputs(self):
        self.assertEqual([], a.problems({'date': '2026-10-03'}))
        self.assertFalse(a.required({'date': 'test-fixture'}))
        self.assertIn('requires', ' '.join(a.problems({'date': '2026-10-07'})))
        self.assertEqual([], a.problems(self.board))

    def test_bad_lights_palette_subjects_and_assets_refused(self):
        mutations = [lambda p: p['palette'].update(hero='#bad'),
                     lambda p: p['lighting']['key'].update(position=[0, float('nan'), 2]),
                     lambda p: p['lighting'].update(exposure=0),
                     lambda p: p['hero'].update(subject_ids=['absent-subject']),
                     lambda p: p['hero'].update(asset='../unrelated-file'),
                     lambda p: p['signature_shot'].update(event_id='s4-event-1')]
        for mutate in mutations:
            board = copy.deepcopy(self.board); mutate(board['art_direction'])
            self.assertTrue(a.problems(board))

    def test_actual_scene_event_and_pose_bounds(self):
        board = copy.deepcopy(self.board)
        board['quality_plan']['scenes'][0]['medium'] = 'dimensional'
        self.assertIn('cover dimensional', ' '.join(a.problems(board)))
        shot = {'position': [3, 2, 5], 'target': [0, 0, 0], 'fov': 40,
                'reason': 'Follow the current sourced contact event in this scene.',
                'event_id': 's1-event-1', 'to': {'position': [3, 2, 5], 'target': [1, 0, 0], 'fov': 40}}
        board['art_direction']['shots']['s1'] = shot
        self.assertEqual([], a.problems(board))
        shot['event_id'] = 's2-event-1'; self.assertTrue(a.problems(board))
        shot['event_id'] = 's1-event-1'; shot['to']['fov'] = 0; self.assertTrue(a.problems(board))
        board = copy.deepcopy(self.board); board['art_direction']['flat_shots']['s1']['scale'] = 4
        self.assertTrue(a.problems(board))

    def test_overshoot_needs_free_prop_and_event_clock_remains_bounded(self):
        event = self.board['scenes'][0]['visual_events'][0]
        event['motion']['curve'] = 'landing'
        self.assertIn('free-prop', ' '.join(a.problems(self.board)))
        event['motion']['free_prop_reason'] = 'Fixture-only free landing object; not a machine contact.'
        self.assertEqual([], a.problems(self.board))
        event['motion']['anticipation'] = .9
        self.assertTrue(a.problems(self.board))

    def test_current_guides_and_actual_renderer_consumers_are_bound(self):
        paths = d.craft_reading_paths(self.board)
        self.assertIn(a.POLICY, paths)
        self.assertIn(a.REPO / 'knowledge/craft/ART_DIRECTION.md', paths)
        files = critic_gate.renderer_files(self.board)
        for name in ['ArtDirection', 'ProofContext', 'CartonIllustratedAction']:
            self.assertTrue(any(name.casefold() in p.name.casefold() for p in files), name)
        plain = copy.deepcopy(self.board); plain.pop('art_direction')
        self.assertNotEqual(critic_gate.concept_digest(plain), critic_gate.concept_digest(self.board))

    def test_lab_failures_and_capacity_never_reset_original_usage(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / 'ledger.json'
            cinematic_lab.change(path, 'charged', 'native_renders', 4, 'Actual attempts including failure')
            with self.assertRaises(ValueError):
                cinematic_lab.change(path, 'charged', 'native_renders', 1, 'Beyond original allowance')
            cinematic_lab.change(path, 'capacity_increment', 'native_renders', 1, 'Explicit owner engineering authorization')
            cinematic_lab.change(path, 'charged', 'native_renders', 1, 'Actual recovery attempt')
            state = json.loads(path.read_text())
            self.assertEqual(4, state['original_limits']['native_renders'])
            self.assertEqual(5, state['usage']['native_renders'])
            self.assertEqual(['charged', 'capacity_increment', 'charged'], [e['kind'] for e in state['events']])
    def test_only_unambiguous_provider_timestamp_transport_is_normalized(self):
        from cinematic_lab_review import parsed_result
        raw = {'candidates': [{'content': {'parts': [{'text': '{"winner":"first","start_s":06.2,"end_s":08.0,"observed":"06.2 is retained text"}'}]}}]}
        result, changes = parsed_result(raw)
        self.assertEqual(6.2, result['start_s'])
        self.assertEqual('06.2 is retained text', result['observed'])
        self.assertEqual(2, len(changes))
        raw['candidates'][0]['content']['parts'][0]['text'] = '{"score":07.2}'
        with self.assertRaises(ValueError):
            parsed_result(raw)
    def test_normal_audiovisual_provider_receives_actual_current_art_guides(self):
        from audiovisual_review import source_context
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root/'storyboard.json').write_text(json.dumps(self.board))
            (root/'claims.json').write_text(json.dumps({'claims': []}))
            (root/'vo_script.txt').write_text('Fixture-only transcript, never film evidence.')
            context = source_context(root/'film.mp4')
            self.assertIn('knowledge/craft/ART_DIRECTION.md', context)
            self.assertIn('craft_guides_sha256', context)
            self.assertIn(d.digest(a.REPO/'knowledge/craft/ART_DIRECTION.md'), context)
            self.board.pop('art_direction')
            (root/'storyboard.json').write_text(json.dumps(self.board))
            self.assertNotIn('craft_guides', source_context(root/'film.mp4'))


if __name__ == '__main__':
    unittest.main()
