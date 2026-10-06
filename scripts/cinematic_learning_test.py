"""Learning never hides unfinished costs or promotes one edition's repeated notes."""
import json
import tempfile
import unittest
from datetime import date
from pathlib import Path
import cinematic_learning as c


class CinematicLearningTest(unittest.TestCase):
    def test_repeated_positive_score_notes_are_not_recurring_failures(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            for day in (4, 5):
                run = root / ('2026-10-' + str(day).zfill(2)); run.mkdir()
                (run / 'panel-round-1.json').write_text(json.dumps({
                    'notes': ['Excellent surface finish and believable contact.'],
                    'defects': []}))
            result = c.recurring(root, date(2026, 10, 6))
            self.assertFalse(result['due'])
            self.assertEqual([], result['findings'])

    def test_controller_release_mode_retains_deferral_despite_passing_card(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            for day, mode in ((7, 'bounded_creative_release'), (8, 'rubric_pass')):
                run = root / ('2026-10-' + str(day).zfill(2)); run.mkdir()
                (run / 'run_state.json').write_text(json.dumps({
                    'run_id': run.name, 'terminal_state': 'shipped',
                    'publication_mode': mode, 'usage': {'panel_rounds': 1}}))
                # Real retained editions can carry a passing latest card while the
                # controller preserves their original bounded creative release.
                (run / 'report_card.json').write_text(json.dumps({'ship': True, 'weighted_score': 7.061}))
            rows = c.report(root)['editions']
            self.assertTrue(rows[0]['artistic_deferral'])
            self.assertFalse(rows[0]['first_panel_pass'])
            self.assertEqual('bounded_creative_release', rows[0]['publication_mode'])
            self.assertFalse(rows[1]['artistic_deferral'])
            self.assertTrue(rows[1]['first_panel_pass'])
            self.assertEqual(7.061, rows[0]['score'])

    def test_next_five_and_later_unfinished_usage(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            for index in range(8):
                run = root / ('2026-10-' + str(7 + index).zfill(2)); run.mkdir()
                state = {'run_id': run.name, 'terminal_state': 'shipped' if index < 7 else None,
                         'phase': 'active_repair', 'usage': {'reboards': 3, 'reported_tokens': 123},
                         'created_at': '2026-10-07T01:00:00Z', 'updated_at': '2026-10-07T01:01:00Z'}
                (run / 'run_state.json').write_text(json.dumps(state))
            report = c.report(root)
            self.assertEqual(5, report['shipped_count'])
            self.assertEqual(6, len(report['editions']))
            self.assertFalse(report['editions'][-1]['shipped'])
            self.assertEqual(123, report['editions'][-1]['usage']['reported_tokens'])
            self.assertIsNone(report['editions'][-1]['account_tokens'])
            self.assertEqual(60, report['editions'][0]['elapsed_seconds'])

    def test_recurrence_requires_distinct_editions_and_retains_exact_failure(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp); one = root / '2026-10-04'; one.mkdir()
            original = {'blocking_defects': [{'observed': 'Contact is hidden by the front plate.', 'start_s': 3, 'end_s': 4}]}
            for n in range(3):
                (one / ('panel-round-' + str(n) + '.json')).write_text(json.dumps(original))
            result = c.recurring(root, date(2026, 10, 6))
            self.assertEqual([], result['findings'])
            two = root / '2026-10-05'; two.mkdir()
            (two / 'panel-round-1.json').write_text(json.dumps(original))
            result = c.recurring(root, date(2026, 10, 6))
            self.assertTrue(result['due'])
            self.assertEqual(2, result['findings'][0]['distinct_editions'])
            self.assertEqual(original['blocking_defects'][0], result['findings'][0]['evidence'][0]['original_finding'])
            result['last_engineering_decision'] = {'date': '2026-10-05', 'decision': 'advance'}
            self.assertFalse(c.recurring(root, date(2026, 10, 6), result)['due'])
            self.assertEqual([], c.recurring(root, date(2026, 11, 6))['findings'])
            (two / 'recurring-defects.json').write_text(json.dumps(result))
            self.assertEqual('2026-10-05', c.latest_decision(root)['date'])
            self.assertFalse(c.recurring(root, date(2026, 10, 6), {'last_engineering_decision': c.latest_decision(root)})['due'])
            self.assertTrue(all(not e['evidence']['path'].startswith('/') for e in result['findings'][0]['evidence']))


if __name__ == '__main__':
    unittest.main()
