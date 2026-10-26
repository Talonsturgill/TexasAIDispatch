"""Free pre-paid regression for the October 24 fragment-boundary failure."""
import copy
from contextlib import redirect_stderr
import io
import json
from pathlib import Path
import tempfile
import unittest
import five_round_fixture  # noqa: F401
from unittest.mock import patch

import daily_production
import modern_film
import run_controller
import vo_align
import vo_synth_gemini as synth


# Exact text/identity subset from checkpoint 371d5ead, storyboard Git blob
# 9ba86c5660a5c5d290a35dca169c4e3492077c5d. No audio or historical report is changed.
FAILED_CLAUSES = [
    ('n1a', 'In a cardiothoracic suite at Houston Methodist Hospital,'),
    ('n1b', 'four cameras on the walls of each operating room watched each case.'),
    ('n2a', 'The system timestamped'),
    ('n2b', 'patient entry, draping and room turnover.'),
    ('n3a', 'It also texted the surgeon'),
    ('n3b', 'when the patient was draped.'),
    ('n4a', 'A hospital study compared that suite'),
    ('n4b', 'with other Houston Methodist sites'),
    ('n4c', 'and found about 25 more surgeries a month.'),
    ('n5a', 'That is a rise of 7 percent.'),
    ('n5b', 'The 95 percent confidence interval'),
    ('n5c', 'runs from 8.3 to 41.0 cases a month.'),
    ('n6a', 'A placebo test did not reach conventional significance.'),
    ('n7a', 'The authors call the rise associated with the rollout,'),
    ('n7b', 'rather than caused by it.'),
    ('n8a', 'The rollout came bundled with other workflow changes,'),
    ('n8b', 'and the hospital holds a minority stake in the camera company.'),
    ('n9a', 'The paper leaves turnover time for future work.'),
    ('n9b', 'So the study does not show whether the rollout sped up room turnover.'),
]


def board_for(texts, date='2026-10-25'):
    clauses, cues, shots, events = [], [], [], []
    cursor = 0
    for i, text in enumerate(texts):
        identity, start, end = f'n{i+1}', i*2.5, i*2.5+2
        stop = cursor+len(modern_film.narration_tokens(text))
        clauses.append({'id': identity, 'text': text, 'scene_id': 's1',
                        'cue_ids': [identity], 'word_range': [cursor, stop],
                        'start_s': start, 'end_s': end, 'subject_ids': ['camera'],
                        'action_id': 'record', 'claim_ids': ['source'],
                        'event_ids': [identity+'-event']})
        cues.append({'id': identity, 'text': text, 'start': start, 'end': end})
        for part in range(2):
            shots.append({'id': identity+str(part), 'scene_id': 's1', 'view': 'camera',
                          'narration_ids': [identity], 'start_s': start+part, 'duration_s': 1})
        events.append({'id': identity+'-event', 'narration_id': identity,
                       'at_s': start+.2, 'duration_s': .5,
                       'clause_fraction_start': .1, 'clause_fraction_end': .35})
        cursor = stop
    return {'date': date, 'scenes': [{'id': 's1', 'start_s': 0,
              'duration_s': len(texts)*2.5, 'vo': ' '.join(texts), 'visual_events': events}],
            'captions': cues, 'film_direction': {'episode': 'offline', 'shots': shots},
            'narration_picture': {'version': 'narration-picture-v1', 'timing_mode': 'authored',
                                  'clauses': clauses}}


class NarrationPlanningTest(unittest.TestCase):
    def setUp(self):
        self.texts = ['The cameras record patient entry.', 'The surgeon gets a text.']
        self.board = board_for(self.texts)
        self.script = self.board['scenes'][0]['vo']
        self.plan = {'overall': 'Conversational and direct.',
                     'lines': [{'text': self.script, 'intent': 'Explain the observed sequence.',
                                'energy': 'Level, then slightly lower.', 'emphasis': 'patient entry'}]}

    def test_actual_failed_plan_refuses_before_future_paid_work(self):
        historical = board_for([text for _, text in FAILED_CLAUSES], '2026-10-24')
        for row, (identity, _) in zip(historical['narration_picture']['clauses'], FAILED_CLAUSES):
            row['id'] = identity
        retained = copy.deepcopy(historical)
        self.assertEqual([], modern_film.narration_plan_problems(historical))
        diagnostic = copy.deepcopy(historical); diagnostic['date'] = '2026-10-25'
        errors = modern_film.narration_plan_problems(diagnostic)
        for identity in ('n2a', 'n3a', 'n4a', 'n4b', 'n5b'):
            self.assertTrue(any(e.startswith(identity+': unpunctuated') for e in errors))
        for identity in ('n1b', 'n9b'):
            self.assertTrue(any(e.startswith(identity+': narration clause exceeds') for e in errors))
        self.assertEqual(historical, retained)

    def test_valid_short_sentence_can_have_multiple_shots(self):
        self.assertEqual([], modern_film.narration_plan_problems(self.board, self.script))
        with tempfile.TemporaryDirectory() as td:
            root = Path(td); (root/'config').mkdir()
            (root/'config/modern_film.json').write_text(json.dumps(modern_film.policy()))
            (root/'config/modern_episode_registry.json').write_text(json.dumps({'episodes': {
                'offline': {'narration_views': {'camera': {
                    'subject_ids': ['camera'], 'action_ids': ['record']}}}}}))
            self.assertEqual([], modern_film.narration_problems(self.board, repo=root))
        self.assertEqual(4, len(self.board['film_direction']['shots']))

    def test_dated_voice_guide_binding_preserves_frozen_modern_guide(self):
        import modern_code_recovery
        root = Path(__file__).resolve().parents[1]
        guide = root / 'knowledge/craft/VO_DIRECTION.md'
        for date, reference, expected in [('2026-10-24', False, False),
                                           ('2026-10-25', False, True),
                                           ('2026-10-25', True, False)]:
            board = board_for(self.texts, date)
            board['reference_only'] = reference
            with self.subTest(date=date, reference=reference):
                paths = daily_production.craft_reading_paths(board, repo=root)
                bindings = [{'path': str(p.resolve()), 'sha256': daily_production.digest(p)}
                            for p in paths]
                bound_voice = [row for row in bindings if row['path'] == str(guide)]
                self.assertEqual(int(expected), len(bound_voice))
                if expected:
                    self.assertEqual(daily_production.digest(guide), bound_voice[0]['sha256'])
        self.assertEqual(modern_code_recovery.GUIDE_SHA256,
                         modern_code_recovery.digest(root / 'knowledge/craft/MODERN_FILM.md'))

    def test_existing_complete_clause_punctuation_remains_available(self):
        for texts in [('The study found an association,', 'rather than a proven cause.'),
                      ('The camera records;', 'the surgeon receives a text.'),
                      ('The paper states the limit:', 'turnover time was not measured.'),
                      ('The surgeon reads it.', 'The crew begins.')]:
            with self.subTest(texts=texts):
                self.assertEqual([], modern_film.narration_plan_problems(board_for(texts)))

    def test_punctuation_or_qualifier_changes_cannot_fake_script_agreement(self):
        for text in ('The cameras record patient entry,', 'The cameras record entry.'):
            changed = copy.deepcopy(self.board)
            changed['narration_picture']['clauses'][0]['text'] = text
            self.assertTrue(any('exactly match' in e for e in
                                modern_film.narration_plan_problems(changed, self.script)))

    def test_dangling_function_word_and_dense_clause_refuse_free(self):
        bad = board_for(['The system records with,', 'a camera.'])
        self.assertTrue(any('function word' in e for e in modern_film.narration_plan_problems(bad)))
        with patch.object(vo_align, 'PHONE_FIT_CUE_CHARS', 20):
            self.assertTrue(any('20-character' in e for e in
                                modern_film.narration_plan_problems(self.board)))

    def test_clause_layout_changes_only_whitespace_and_maps_scene_notes(self):
        laid, labels, errors = synth.narration_layout(self.board, self.script)
        self.assertEqual([], errors)
        self.assertEqual('\n'.join(self.texts), laid)
        self.assertEqual(self.script, ' '.join(laid.split()))
        self.assertEqual(['Fenced lines 1 through 2'], labels)
        self.assertIn(labels[0], synth.split_direction(self.plan, labels))
        changed = copy.deepcopy(self.board)
        changed['narration_picture']['clauses'][1]['scene_id'] = 'wrong-scene'
        self.assertTrue(synth.narration_layout(changed, self.script)[2])

    def test_single_pacing_authority_rejects_conflicting_notes(self):
        self.assertEqual([], synth.narration_pacing_problems(self.board, self.plan))
        for value in ('Take a clear audible breath after timestamped.',
                      'Never pause after this line.', 'Run together with the next line.'):
            changed = copy.deepcopy(self.plan); changed['lines'][0]['intent'] = value
            self.assertTrue(synth.narration_pacing_problems(self.board, changed))
        self.assertNotIn('avoid equal pauses after every line', synth.pacing_notes(self.board).lower())
        self.assertNotIn('never pause', synth.pacing_notes(self.board).lower())

    def test_packet_gate_precedes_paid_critic_or_voice_director(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td); board = root/'storyboard.json'; claims = root/'claims.json'
            board.write_text(json.dumps(board_for(['The system timestamped', 'patient entry.'])))
            claims.write_text('{}')
            for role in ('storyboard-critic', 'vo-director'):
                with self.subTest(role=role), self.assertRaisesRegex(ValueError, 'pre-paid narration'):
                    daily_production.packet(board, claims, role)

    def test_first_controller_reservation_refuses_bad_plan_without_charging(self):
        from retime_feasibility_test import valid
        board = valid(); board['date'] = '2026-10-25'
        rows = board['narration_picture']['clauses']
        rows[0].update(text='The system timestamped', event_ids=['e1', 'e2'])
        rows[1].update(text='patient entry.', event_ids=['e3'])
        board['scenes'][0]['vo'] = ' '.join(row['text'] for row in rows)
        with tempfile.TemporaryDirectory() as td:
            root = Path(td); state = root/'run_state.json'; candidate = root/'storyboard.json'
            self.assertTrue(run_controller.initialise(state, '2026-10-25', 'production')[0])
            candidate.write_text(json.dumps(board)); before = state.read_bytes()
            accepted, message = run_controller.reserve(state, {'storyboard_critics': 1},
                                                       'offline first code review')
            self.assertFalse(accepted)
            self.assertIn('unpunctuated narration boundary', message)
            self.assertEqual(before, state.read_bytes())
            rows[0]['text'], rows[1]['text'] = self.texts
            board['scenes'][0]['vo'] = ' '.join(self.texts)
            candidate.write_text(json.dumps(board))
            accepted, message = run_controller.reserve(state, {'storyboard_critics': 1},
                                                       'offline first code review')
            self.assertTrue(accepted, message)
            self.assertEqual(1, json.loads(state.read_text())['usage']['storyboard_critics'])

    def test_actual_synth_entry_refuses_before_reservation_or_api(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td); evidence = root/'evidence'; evidence.mkdir()
            bad = board_for(['The system timestamped', 'patient entry.'])
            (evidence/'storyboard.json').write_text(json.dumps(bad))
            with patch('creative_production.voice_problems', return_value=[]), \
                    patch('creative_production.opening_problems', return_value=[]), \
                    patch('creative_production.required', return_value=False), \
                    patch('daily_production.required', return_value=False), \
                    patch.object(synth, 'synth_one') as paid, \
                    patch.object(synth, 'reserve_tts_call') as reservation, redirect_stderr(io.StringIO()):
                status = synth.run(bad['scenes'][0]['vo'], {'lines': []}, root/'takes',
                                   1, 'unused', 'unused', evidence_dir=evidence)
            self.assertEqual(1, status)
            paid.assert_not_called(); reservation.assert_not_called()
            self.assertFalse((root/'takes').exists())

    def test_real_prompt_fence_has_only_locked_words_and_matching_labels(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td); (root/'storyboard.json').write_text(json.dumps(self.board))
            with patch('creative_production.voice_problems', return_value=[]), \
                    patch('creative_production.opening_problems', return_value=[]), \
                    patch('creative_production.required', return_value=False), \
                    patch('daily_production.required', return_value=False):
                prompt, errors = synth.build_prompt(self.script, self.plan, root)
            self.assertEqual([], errors)
            self.assertEqual(1, prompt.count(synth.FENCE_OPEN))
            self.assertEqual('\n'.join(self.texts),
                             prompt.split(synth.FENCE_OPEN)[1].split(synth.FENCE_CLOSE)[0].strip())
            self.assertIn('Fenced lines 1 through 2', prompt)


if __name__ == '__main__':
    unittest.main()
