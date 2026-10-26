"""The builder visual proof is a free, bounded, diagnostic capture that can never stand in for a review."""
import json
from pathlib import Path
import tempfile
import unittest

import builder_proof as proof
import claude_motion_review
import creative_production
import opening_compare


class BuilderProofTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(); self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name).resolve() / 'out/dispatch'; self.root.mkdir(parents=True)
        self.state_path = self.root / 'run_state.json'
        self.state = {'mode': 'production', 'run_id': '2026-10-26', 'terminal_state': None, 'events': []}
        self.save()

    def save(self):
        self.state_path.write_text(json.dumps(self.state) + '\n')

    def test_admits_an_active_production_edition_and_counts_real_batches(self):
        first = proof.eligibility(self.state_path)
        self.assertEqual((first['batch'], first['max_batches'], first['approval']), (1, proof.MAX_BATCHES, False))
        proof.record(self.root, 'a' * 64, first)
        second = proof.eligibility(self.state_path)
        self.assertEqual(second['batch'], 2)
        proof.record(self.root, 'b' * 64, second)
        with self.assertRaisesRegex(ValueError, 'limited to'):
            proof.eligibility(self.state_path)

    def test_an_unfinished_attempt_does_not_use_up_a_batch(self):
        self.assertEqual(proof.eligibility(self.state_path)['batch'], 1)
        self.assertEqual(proof.eligibility(self.state_path)['batch'], 1)

    def test_refuses_what_it_was_not_built_for(self):
        cases = [({'mode': 'rehearsal'}, 'active production'), ({'terminal_state': 'shipped'}, 'active production'),
                 ({'run_id': '2026-10-25'}, 'applies from'), ({'deliverable': {'film_sha256': 'x'}}, 'native film'),
                 ({'shipment': {'verified_at': 'x'}}, 'native film')]
        for change, message in cases:
            with self.subTest(change=change):
                self.setUp(); self.state.update(change); self.save()
                with self.assertRaisesRegex(ValueError, message):
                    proof.eligibility(self.state_path)

    def test_a_malformed_log_is_preserved_not_reset(self):
        (self.root / proof.LOG).write_text('{"not": "a list"}\n')
        with self.assertRaisesRegex(ValueError, 'malformed'):
            proof.eligibility(self.state_path)

    def test_the_real_comparison_refuses_a_proof_receipt(self):
        board = {'date': '2026-10-26', 'run_id': '2026-10-26', 'scenes': []}
        (self.root / 'storyboard.json').write_text(json.dumps(board))
        (self.root / 'openings').mkdir()
        (self.root / 'openings/comparison.json').write_text(json.dumps({'builder_proof': proof.eligibility(self.state_path)}))
        (self.root / 'openings/selection.json').write_text('{}')
        errors = creative_production.opening_problems(self.root / 'storyboard.json')
        self.assertEqual(len(errors), 1)
        self.assertIn('builder proof', errors[0])

    def test_a_proof_is_never_a_paid_phone_review_sequence(self):
        (self.root / 'storyboard.json').write_text('{}')
        board = self.root / 'openings/a.json'; board.parent.mkdir()
        board.write_text(json.dumps({'date': '2026-10-26'}))
        (self.root / 'openings/comparison.json').write_text(json.dumps({'builder_proof': {'batch': 1}}))
        with self.assertRaisesRegex(ValueError, 'builder proof'):
            claude_motion_review.phone_inputs(self.state_path, 'a', board, self.root / 'openings/a.mp4')

    def test_the_two_diagnostic_captures_cannot_be_combined(self):
        with self.assertRaisesRegex(ValueError, 'different diagnostic'):
            opening_compare.build(self.root, self.state_path, combined_code_review=True, builder_proof=True)


if __name__ == '__main__':
    unittest.main()
