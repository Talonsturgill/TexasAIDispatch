"""A concrete repeated subject cannot hide behind new entity labels before paid work."""
import json
from pathlib import Path
import tempfile
import unittest

import dedupe


class SubjectScreenTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.repo = Path(self.tmp.name)
        (self.repo / 'ledger').mkdir()
        self.history = self.repo / 'ledger/dispatch_history.json'
        self.entry = {'date': '2026-09-26', 'topic': 'Dallas camera notices and reported yard work',
                      'entities': ['Dallas', 'Sarrah Morrison']}
        self.history.write_text(json.dumps({'dispatches': [self.entry]}))
        self.archive = self.repo / 'runs/2026-09-26'; self.archive.mkdir(parents=True)
        (self.archive / 'vo_script.txt').write_text(
            'A camera on a Dallas brush truck can photograph a house as it passes.\n')
        (self.archive / 'storyboard.json').write_text(json.dumps(
            {**self.entry, 'title': 'A notice changes a day'}))

    def check(self, subject, edition='2026-10-19'):
        return dedupe.check_subject(subject, edition, self.repo)

    def test_observed_brush_subject_is_caught_when_entity_only_check_returns_fresh(self):
        # The object is from the actual retained October19 selection. Entity labels
        # intentionally omit the person named in September26's metadata.
        self.assertTrue(dedupe.check_entities([self.entry], 'Rover AI, code compliance')[0])
        before = self.history.read_bytes()
        result = self.check('AI cameras on sanitation brush trucks')
        self.assertFalse(result['fresh'])
        self.assertEqual(result['matches'][0]['phrase'], 'brush truck')
        self.assertIn('camera', result['matches'][0]['metadata_tokens'])
        self.assertEqual(self.history.read_bytes(), before)

    def test_actual_new_mucin_subject_remains_fresh(self):
        self.assertTrue(self.check('MD Anderson SPACER T cells cut a mucin barrier')['fresh'])

    def test_different_camera_application_in_the_same_city_remains_fresh(self):
        self.assertTrue(self.check('AI cameras on Dallas fire trucks scan road damage')['fresh'])

    def test_channel_words_and_shared_generic_technique_do_not_reject_a_new_story(self):
        (self.archive / 'vo_script.txt').write_text(
            'Texas AI computer vision helps a person inspect an image in Dallas.\n')
        self.assertTrue(self.check('Houston camera computer vision detects crop disease')['fresh'])
        self.assertNotIn(('dalla', 'camera'), dedupe.subject_phrases('Dallas cameras'))

    def test_a_phrase_alone_without_a_separate_metadata_anchor_is_not_a_repeat(self):
        self.assertTrue(self.check('Brush trucks deliver replacement batteries')['fresh'])

    def test_the_real_window_excludes_old_subjects_without_modifying_history(self):
        self.assertTrue(self.check('AI cameras on sanitation brush trucks', '2026-11-01')['fresh'])

    def test_missing_narration_never_silently_returns_fresh(self):
        (self.archive / 'vo_script.txt').unlink()
        with self.assertRaisesRegex(ValueError, 'narration is unavailable'):
            self.check('AI cameras on sanitation brush trucks')

    def test_same_date_second_edition_is_also_inspected(self):
        second = self.repo / 'runs/2026-09-26-second'; second.mkdir()
        (second / 'vo_script.txt').write_text('A robot lifts a warm package.\n')
        (second / 'storyboard.json').write_text(json.dumps({'title': 'Second film',
            'topic': 'Delivery robot enters a clinic', 'entities': ['Delivery robot']}))
        self.history.write_text(json.dumps({'dispatches': [self.entry, {'date': '2026-09-26',
            'topic': 'Delivery robot enters a clinic', 'entities': ['Delivery robot']}]}))
        result = self.check('Delivery robot lifts a warm package')
        self.assertFalse(result['fresh'])
        self.assertEqual(len(result['inspected']), 2)

    def test_unlisted_same_date_scratch_is_not_treated_as_a_published_story(self):
        scratch = self.repo / 'runs/2026-09-26-unfinished'; scratch.mkdir()
        (scratch / 'vo_script.txt').write_text('A robot lifts a warm package.\n')
        (scratch / 'storyboard.json').write_text(json.dumps({'title': 'Unfinished',
            'topic': 'Delivery robot enters a clinic', 'entities': ['Delivery robot']}))
        result = self.check('Delivery robot lifts a warm package')
        self.assertTrue(result['fresh'])
        self.assertEqual(len(result['inspected']), 1)

    def test_external_symlink_cannot_supply_subject_evidence(self):
        narration = self.archive / 'vo_script.txt'; narration.unlink()
        outside = self.repo / 'outside.txt'; outside.write_text('private')
        narration.symlink_to(outside)
        with self.assertRaisesRegex(ValueError, 'real runs archive'):
            self.check('AI cameras on sanitation brush trucks')


if __name__ == '__main__':
    unittest.main()
