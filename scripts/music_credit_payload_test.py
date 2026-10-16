"""Actual mixed track attribution must survive into the copy-ready delivery body."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

import music
import music_credit_payload as credit
import email_check


class CreditTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.mix = self.root / 'mix.json'
        self.mix.write_text(json.dumps({'bed': True, 'bed_track_id': 'immersed',
                                       'tracks': [{'id': 'immersed', 'role': 'bed'}]}))
        self.email = self.root / 'email.md'
        self.base = 'Film\n-----BEGIN CAPTION-----\nA supported post.\n-----END CAPTION-----\n'
        self.email.write_text(self.base)

    def test_actual_cli_inserts_one_idempotent_block_after_caption(self):
        command = [sys.executable, str(Path(credit.__file__)), '--mix', str(self.mix), '--email', str(self.email)]
        for _ in range(2):
            result = subprocess.run(command, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
        text = self.email.read_text()
        self.assertEqual(text.count(credit.OPEN), 1)
        self.assertEqual(credit.problems(self.email, '2026-10-15'), [])
        track = next(t for t in music.load() if t['id'] == 'immersed')
        self.assertIn(music.credit_line(track), text)
        self.assertIn(track['source_url'], text)
        self.assertIn('https://creativecommons.org/licenses/by/4.0/', text)

    def test_missing_wrong_track_or_changed_license_fails(self):
        self.assertTrue(credit.problems(self.email, '2026-10-15'))
        good = self.base + credit.block(self.mix)
        for bad in [good.replace('Immersed', 'Another track'),
                    good.replace('by/4.0', 'by-nc/4.0'),
                    good.replace('trimmed and synced to picture', 'unmodified'),
                    good + '\n' + credit.block(self.mix)]:
            self.email.write_text(bad)
            self.assertTrue(credit.problems(self.email, '2026-10-15'))

    def test_unknown_or_unlicensed_mix_never_gets_a_credit(self):
        self.mix.write_text(json.dumps({'bed_track_id': 'unknown'}))
        with self.assertRaises(ValueError):
            credit.block(self.mix)
        self.mix.write_text('{}')
        with self.assertRaises(ValueError):
            credit.block(self.mix)

    def test_historical_email_keeps_original_contract(self):
        self.assertEqual(credit.problems(self.email, '2026-10-11'), [])

    def test_delivery_email_gate_requires_the_exact_credit_in_a_current_payload(self):
        source = Path(__file__).resolve().parents[1] / 'runs/2026-10-11/email.md'
        text = source.read_text().replace('2026-10-11', '2026-10-15')
        marker = '-----END CAPTION-----'
        index = text.index(marker) + len(marker)
        self.email.write_text(text[:index] + '\n\n' + credit.block(self.mix) + text[index:])
        self.assertEqual(email_check.check(self.email, '2026-10-15'), [])
        self.email.write_text(self.email.read_text().replace('CC BY 4.0', 'CC BY-NC 4.0'))
        self.assertTrue(any('music' in p for p in email_check.check(self.email, '2026-10-15')))


if __name__ == '__main__':
    unittest.main()
