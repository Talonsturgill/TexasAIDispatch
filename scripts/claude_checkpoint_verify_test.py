"""Stream every checkpoint artifact without launching one Git process per file."""
import copy
import hashlib
import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import claude_checkpoint as ck


class CheckpointVerification(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.repo = Path(temporary.name)
        self.run_id = '2026-10-21'
        self.base = self.repo / ck.ROOT / self.run_id
        self.files = self.base / 'files'
        self.files.mkdir(parents=True)
        self.git('init', '-q')
        self.git('config', 'user.name', 'Checkpoint test')
        self.git('config', 'user.email', 'checkpoint@example.com')
        self.ledger = b'{"run_id":"2026-10-21","events":[]}\n'
        (self.base / 'run_state.json').write_bytes(self.ledger)
        self.payload = bytes(range(256)) * 8193
        self.manifest = {'schema': ck.SCHEMA, 'run_id': self.run_id,
                         'ledger_sha256': ck.sha256(self.ledger), 'files': []}
        for name, body in [('a.bin', self.payload), ('duplicate.bin', self.payload),
                           ('empty.bin', b''), ('line\nbreak.bin', b'newline path')]:
            (self.files / name).write_bytes(body)
            self.manifest['files'].append({'path': name, 'sha256': ck.sha256(body), 'size': len(body)})

    def git(self, *args):
        return subprocess.run(['git', '-C', str(self.repo), *args], check=True,
                              capture_output=True).stdout

    def commit(self):
        (self.base / 'manifest.json').write_text(json.dumps(self.manifest))
        self.git('add', '-A')
        self.git('commit', '-qm', 'checkpoint fixture')
        return self.git('rev-parse', 'HEAD').decode().strip()

    def verify(self):
        return ck.verify_checkpoint(self.repo, self.commit(), self.run_id)

    def test_exact_return_three_processes_and_per_call_oid_reuse(self):
        commit = self.commit()
        real_popen = subprocess.Popen
        real_sha256 = hashlib.sha256
        processes = []
        hashed = []

        class Digest:
            def __init__(self):
                self.digest = real_sha256()
                self.bytes = 0
                self.largest_chunk = 0
                hashed.append(self)

            def update(self, data):
                self.largest_chunk = max(self.largest_chunk, len(data))
                self.bytes += len(data)
                self.digest.update(data)

            def hexdigest(self):
                return self.digest.hexdigest()

        def popen(args, **kwargs):
            processes.append(args)
            return real_popen(args, **kwargs)

        for call in range(2):
            with mock.patch.object(ck.subprocess, 'Popen', side_effect=popen), \
                    mock.patch.object(ck.hashlib, 'sha256', side_effect=Digest):
                self.assertEqual(ck.verify_checkpoint(self.repo, commit, self.run_id),
                                 (self.manifest, self.ledger))
            self.assertEqual(len(processes), 3 * (call + 1))
            self.assertEqual(sum(d.bytes == len(self.payload) for d in hashed), call + 1)
            self.assertTrue(all(d.largest_chunk <= 1 << 20 for d in hashed))
        self.assertEqual(sum('cat-file' in command for command in processes), 2)

    def test_corrupted_artifact_bytes_refused(self):
        (self.files / 'a.bin').write_bytes(b'corrupt')
        with self.assertRaisesRegex(ck.CheckpointError, 'file differs'):
            self.verify()

    def test_duplicate_oid_still_checks_each_manifest_row(self):
        self.manifest['files'][1]['sha256'] = '0' * 64
        with self.assertRaisesRegex(ck.CheckpointError, 'duplicate.bin'):
            self.verify()

    def test_corrupted_ledger_refused(self):
        (self.base / 'run_state.json').write_bytes(b'{}')
        with self.assertRaisesRegex(ck.CheckpointError, 'ledger differs'):
            self.verify()

    def test_corrupted_manifest_binding_refused(self):
        self.manifest['run_id'] = '2026-10-20'
        with self.assertRaisesRegex(ck.CheckpointError, 'another run or schema'):
            self.verify()

    def test_missing_path_refused(self):
        (self.files / 'a.bin').unlink()
        with self.assertRaisesRegex(ck.CheckpointError, 'file is missing'):
            self.verify()

    def test_missing_git_object_refused(self):
        commit = self.commit()
        oid = self.git('rev-parse', f'{commit}:{ck.ROOT}/{self.run_id}/files/a.bin').decode().strip()
        (self.repo / '.git/objects' / oid[:2] / oid[2:]).unlink()
        with self.assertRaisesRegex(ck.CheckpointError, 'missing or is not a blob'):
            ck.verify_checkpoint(self.repo, commit, self.run_id)

    def test_symbolic_link_is_not_an_accepted_regular_blob(self):
        path = self.files / 'a.bin'
        path.unlink()
        path.symlink_to('duplicate.bin')
        self.manifest['files'][0].update(sha256=ck.sha256(b'duplicate.bin'), size=13)
        with self.assertRaisesRegex(ck.CheckpointError, 'not a regular blob'):
            self.verify()

    def test_tree_at_manifest_file_path_refused(self):
        path = self.files / 'a.bin'
        path.unlink()
        path.mkdir()
        (path / 'nested').write_bytes(b'child')
        with self.assertRaisesRegex(ck.CheckpointError, 'file is missing'):
            self.verify()

    def test_invalid_or_duplicate_paths_refused(self):
        original = copy.deepcopy(self.manifest)
        for path in ['../run_state.json', '/a.bin', 'dir//a.bin', './a.bin', '']:
            with self.subTest(path=path):
                self.manifest = copy.deepcopy(original)
                self.manifest['files'][0]['path'] = path
                with self.assertRaisesRegex(ck.CheckpointError, 'invalid or repeated'):
                    self.verify()
        self.manifest = copy.deepcopy(original)
        self.manifest['files'].append(copy.deepcopy(self.manifest['files'][0]))
        with self.assertRaisesRegex(ck.CheckpointError, 'invalid or repeated'):
            self.verify()

    def test_declared_size_refused_when_wrong(self):
        self.manifest['files'][0]['size'] -= 1
        with self.assertRaisesRegex(ck.CheckpointError, 'size differs'):
            self.verify()

    def test_historical_manifest_without_optional_size_still_accepted(self):
        for row in self.manifest['files']:
            row.pop('size')
        self.assertEqual(self.verify(), (self.manifest, self.ledger))


if __name__ == '__main__':
    unittest.main()
