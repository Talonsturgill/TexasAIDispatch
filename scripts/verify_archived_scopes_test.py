"""Historical verification cannot admit active work or altered sealed evidence."""
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch
import verify_archived_scopes as archive


class ArchiveTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.repo = Path(self.temp.name); self.root = self.repo / 'runs/2026-10-09'
        self.root.mkdir(parents=True)
        (self.root / 'dispatch.mp4').write_bytes(b'original film')
        (self.root / 'storyboard.json').write_text('original board')
        self.film = archive.digest(self.root / 'dispatch.mp4')
        self.write('run_state.json', {'run_id': '2026-10-09', 'terminal_state': 'shipped',
            'deliverable': {'film_sha256': self.film}, 'shipment': {'film_sha256': self.film}})
        self.write('shipment-public.json', {'verified_at': '2026-10-09T14:40:00Z',
            'film_sha256': self.film, 'dispatch': {'merge_sha': 'a' * 40}})
        self.write('finished-art-scope.json', {'film_sha256': self.film,
            'producer_sha256': hashlib.sha256(b'original producer').hexdigest(),
            'files': {'storyboard.json': archive.digest(self.root / 'storyboard.json')}})

    def write(self, name, value):
        (self.root / name).write_text(json.dumps(value))

    def test_original_shipped_pin_is_retained(self):
        self.assertEqual(archive.release_pin(self.root, self.repo)[0], 'a' * 40)

    def test_active_or_publishable_work_cannot_use_historical_route(self):
        state = archive.read(self.root / 'run_state.json')
        for terminal in (None, 'publishable', 'needs_review'):
            state['terminal_state'] = terminal; self.write('run_state.json', state)
            with self.assertRaises(ValueError): archive.release_pin(self.root, self.repo)
        with self.assertRaises(ValueError): archive.release_pin(self.repo / 'out/dispatch', self.repo)

    def test_changed_film_or_bound_input_is_rejected(self):
        (self.root / 'dispatch.mp4').write_bytes(b'changed film')
        with self.assertRaises(ValueError): archive.release_pin(self.root, self.repo)
        (self.root / 'dispatch.mp4').write_bytes(b'original film')
        (self.root / 'storyboard.json').write_text('changed board')
        with self.assertRaises(ValueError): archive.release_pin(self.root, self.repo)

    def test_malformed_pin_is_rejected_before_git(self):
        shipment = archive.read(self.root / 'shipment-public.json')
        shipment['dispatch']['merge_sha'] = '--invalid-option'
        self.write('shipment-public.json', shipment)
        with self.assertRaises(ValueError): archive.release_pin(self.root, self.repo)

    def test_changed_producer_cannot_verify_an_original_receipt(self):
        with patch('verify_archived_scopes.subprocess.run', return_value=Mock(returncode=0)), \
             patch('verify_archived_scopes.subprocess.check_output', return_value=b'changed producer'):
            with self.assertRaises(ValueError): archive.verify(self.root, self.repo)


if __name__ == '__main__':
    unittest.main()
