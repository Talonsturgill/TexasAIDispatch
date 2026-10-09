"""Scope integration rejects altered, negative and unrelated review evidence."""
import copy
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import review_scope as scope
import modern_film


class ScopeTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.board = {'date': '2026-10-09', 'runtime_s': 36.9, 'credits_s': 5,
                      'credits': 'Required source and illustration sign-off',
                      'scenes': [{'id': 's1', 'start_s': 0, 'duration_s': 36.9}],
                      'story_art': {'entries': [{'file': 'a', 'sha256': 'asset'},
                                                {'file': 'b', 'sha256': 'asset'}]},
                      'narration_picture': {'clauses': [{'id': 'n'+str(i), 'start_s': i,
                                                       'end_s': i+.5} for i in range(10)]}}
        rows = {k: {'pass': True, 'start_s': 0, 'end_s': 1,
                   'observed': 'Concrete performed current artwork and source-backed action.'}
                for k in modern_film.policy()['review_criteria']}
        rows['film_sha256'] = 'film'
        rows['finished_art'] = {'pass': True, 'start_s': 0, 'end_s': 41.9,
                                'observed': 'Truck and facility have clean alpha, directional lighting and grounded surfaces.'}
        self.report = {'ship': True, 'score': 7.48, 'hard_fails': [], 'defects': [],
                       'film_sha256': 'film', 'modern_observations': rows,
                       'narration_picture_observations': {'film_sha256': 'film', 'clauses': [
                           dict(c, pass_=True, observed='The actual subject performs its exact spoken action.')
                           for c in self.board['narration_picture']['clauses']]}}
        for c in self.report['narration_picture_observations']['clauses']:
            c['pass'] = c.pop('pass_')
        self.report['provider_evidence'] = {'bindings': {'film_sha256': 'film',
                    'board_sha256': 'board', 'claims_sha256': 'claims', 'renderer_sha256': 'renderer'},
                    'input': {'board': self.board}, 'response_sha256': 'raw', 'request_id': 'request',
                    'input_sha256': 'input', 'prompt_sha256': 'prompt', 'host_failure': {},
                    'role': 'sound', 'model': 'model', 'reviewed_at': 'time'}
        self.diagnosis = {'verdict': 'revise', 'film_sha256': 'film', 'board_sha256': 'board',
                          'blocking_defects': ['modern engagement or finish unproven: finished_art'],
                          'original_provider_score': {'sha256': 'report',
                          'modern_finished_art': copy.deepcopy(rows['finished_art'])}}
        self.write()
        self.patches = [patch('independent_review.evidence_problems', return_value=[]),
                        patch('critic_gate.renderer_digest', return_value='renderer'),
                        patch('review_scope.subprocess.check_output', return_value='41.900000'),
                        patch('review_scope.sha', side_effect=self.hash)]
        for p in self.patches:
            p.start(); self.addCleanup(p.stop)

    def hash(self, path):
        name = Path(path).name
        return {'film.mp4': 'film', 'dispatch.mp4': 'film', 'storyboard.json': 'board',
                'claims.json': 'claims', 'scorer-sound-01.json': 'report', 'a': 'asset', 'b': 'asset'}.get(name, name)

    def write(self):
        for name, value in [('scorer-sound-01.json', self.report),
                            ('render-manifest.json', {'film_sha256': 'film', 'board_sha256': 'board'}),
                            ('final-review-scope-diagnosis.json', self.diagnosis)]:
            (self.root / name).write_text(json.dumps(value))
        (self.root / 'film.mp4').write_bytes(b'fixture film')

    def derive(self):
        return scope.derive(self.board, self.report, self.root, self.diagnosis)

    def test_positive_intersection_retains_original(self):
        before = copy.deepcopy(self.report)
        data = self.derive()
        self.assertEqual(data['derived_story_intersection'], [0, 36.9])
        self.assertEqual(self.report, before)
        self.assertEqual(self.report['modern_observations']['finished_art']['end_s'], 41.9)

    def test_negative_missing_wrong_interval_and_conclusory(self):
        original = copy.deepcopy(self.report)
        for change in ({'pass': False}, {'start_s': 37}, {'end_s': 42}, {'end_s': 38},
                       {'observed': 'Fine'}, {'observed': 'This generic animation seems polished enough overall.'}):
            self.report = copy.deepcopy(original)
            self.report['modern_observations']['finished_art'].update(change)
            self.write()
            with self.assertRaises(ValueError): self.derive()
        self.report = copy.deepcopy(original)
        del self.report['modern_observations']['finished_art']; self.write()
        with self.assertRaises(ValueError): self.derive()

    def test_other_criteria_and_all_clauses_remain_strict(self):
        original = copy.deepcopy(self.report)
        for key in modern_film.policy()['review_criteria']:
            if key == 'finished_art': continue
            self.report = copy.deepcopy(original)
            self.report['modern_observations'][key]['pass'] = False; self.write()
            with self.assertRaises(ValueError): self.derive()
        for i in range(10):
            self.report = copy.deepcopy(original)
            self.report['narration_picture_observations']['clauses'][i]['pass'] = False; self.write()
            with self.assertRaises(ValueError): self.derive()

    def test_transport_changed_film_renderer_and_credit_padding_fail(self):
        with patch('independent_review.evidence_problems', return_value=['raw response changed']):
            with self.assertRaises(ValueError): self.derive()
        with patch('critic_gate.renderer_digest', return_value='changed'):
            with self.assertRaises(ValueError): self.derive()
        with patch('review_scope.subprocess.check_output', return_value='42.9'):
            with self.assertRaises(ValueError): self.derive()
        self.report['provider_evidence']['bindings']['film_sha256'] = 'changed'; self.write()
        with self.assertRaises(ValueError): self.derive()

    def test_changed_score_or_original_file_rejected(self):
        self.report['score'] = 9
        with self.assertRaises(ValueError): self.derive()
        self.report['hard_fails'] = ['source']
        self.write()
        with self.assertRaises(ValueError): self.derive()

    def test_receipt_binds_producer_diagnosis_art_manifest_captions_words(self):
        data = self.derive()
        (self.root / scope.NAME).write_text(json.dumps(data))
        # Exercise exact receipt comparison, the same rule used by portable admission.
        for name in ('review_scope.py', 'final-review-scope-diagnosis.json', 'captions.json',
                     'words.json', 'mix.json', 'a'):
            def changed(path, target=name):
                return 'changed' if Path(path).name == target else self.hash(path)
            with patch('review_scope.sha', side_effect=changed):
                try:
                    current = self.derive()
                except ValueError:
                    continue
                self.assertNotEqual(current, data, name)
        (self.root / 'render-manifest.json').write_text(json.dumps({'film_sha256': 'changed', 'board_sha256': 'board'}))
        with self.assertRaises(ValueError): self.derive()

    def test_package_preserves_original_bytes_and_refuses_replacement(self):
        (self.root / 'storyboard.json').write_text(json.dumps(self.board))
        (self.root / scope.NAME).write_text(json.dumps(self.derive()))
        destination = self.root / 'archive'
        original = (self.root / 'scorer-sound-01.json').read_bytes()
        scope.package(self.root, destination)
        self.assertEqual((destination / 'scorer-sound-01.json').read_bytes(), original)
        with patch('review_scope.sha', side_effect=lambda p: 'changed' if Path(p).parent == destination else self.hash(p)):
            with self.assertRaises(ValueError): scope.package(self.root, destination)

    def test_private_routing_refused_technical_provenance_preserved(self):
        self.assertFalse(scope.privacy_problems({'path': '/Users/name/native-proof.png', 'to': 's2'}))
        for value in ({'gmail_draft_id': 'private'}, {'recipient': 'x@example.com'},
                      {'api_key': 'secret'}, {'owner_message': 'private owner prose'}):
            self.assertTrue(scope.privacy_problems(value))


if __name__ == '__main__':
    unittest.main()
