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


    def encoded_fixture(self, body=None):
        body = body or (b'{"public_evidence":"original byte-bound page"}\n' * 300)
        encoded = ck.encoded_storage(body)
        self.manifest['files'] = [{
            'path': 'evidence.json', 'sha256': ck.sha256(body), 'size': len(body),
            'storage': {'encoding': 'gzip/1', 'size': len(encoded), 'sha256': ck.sha256(encoded)}}]
        (self.files / 'evidence.json').write_bytes(encoded)
        return body, encoded

    @mock.patch.object(ck, 'MAX_FILE', 1024)
    def test_lossless_deterministic_roundtrip_and_duplicate_storage(self):
        body, encoded = self.encoded_fixture()
        self.assertEqual(encoded, ck.encoded_storage(body))
        self.assertLess(len(encoded), ck.MAX_FILE)
        duplicate = copy.deepcopy(self.manifest['files'][0]); duplicate['path'] = 'duplicate.json'
        self.manifest['files'].append(duplicate)
        (self.files / 'duplicate.json').write_bytes(encoded)
        commit = self.commit()
        self.assertEqual(ck.verify_checkpoint(self.repo, commit, self.run_id), (self.manifest, self.ledger))
        for row in self.manifest['files']:
            target = self.repo / ('restored-' + row['path'])
            ck.materialize_checkpoint_file(self.repo, commit, self.run_id, row, target)
            self.assertEqual(target.read_bytes(), body)

    @mock.patch.object(ck, 'MAX_FILE', 1024)
    def test_encoded_corruption_truncation_and_trailing_members_refused(self):
        _, encoded = self.encoded_fixture()
        for bad in [encoded[:-1], encoded + b'extra', encoded + encoded,
                    encoded[:20] + bytes([encoded[20] ^ 1]) + encoded[21:]]:
            with self.subTest(length=len(bad)):
                row = self.manifest['files'][0]
                row['storage'].update(size=len(bad), sha256=ck.sha256(bad))
                (self.files / 'evidence.json').write_bytes(bad)
                with self.assertRaises(ck.CheckpointError):
                    self.verify()

    @mock.patch.object(ck, 'MAX_FILE', 1024)
    def test_encoded_metadata_and_original_bindings_fail_closed(self):
        self.encoded_fixture()
        original = copy.deepcopy(self.manifest)
        mutations = [('encoding', 'zip'), ('size', True), ('size', 1025),
                     ('sha256', 'f' * 64), ('extra', 'unsupported')]
        for key, value in mutations:
            with self.subTest(key=key, value=value):
                self.manifest = copy.deepcopy(original)
                self.manifest['files'][0]['storage'][key] = value
                with self.assertRaises(ck.CheckpointError):
                    self.verify()
        for key, value in [('size', 1025), ('size', ck.MAX_TOTAL + 1), ('sha256', '0' * 64),
                           ('path', 'evidence.mp4')]:
            with self.subTest(original_key=key):
                self.manifest = copy.deepcopy(original)
                self.manifest['files'][0][key] = value
                with self.assertRaises(ck.CheckpointError):
                    self.verify()

    @mock.patch.object(ck, 'MAX_FILE', 1024)
    def test_oversized_stored_blob_and_raw_blob_refused(self):
        self.encoded_fixture()
        (self.files / 'evidence.json').write_bytes(b'x' * 1025)
        with self.assertRaisesRegex(ck.CheckpointError, 'stored blob exceeds'):
            self.verify()
        self.manifest['files'][0].pop('storage')
        with self.assertRaisesRegex(ck.CheckpointError, 'stored blob exceeds'):
            self.verify()

    @mock.patch.object(ck, 'MAX_FILE', 1024)
    def test_materializer_refuses_missing_symlink_and_unsafe_path(self):
        self.encoded_fixture()
        row = self.manifest['files'][0]
        path = self.files / row['path']
        path.unlink(); path.symlink_to('a.bin')
        commit = self.commit()
        with self.assertRaisesRegex(ck.CheckpointError, 'not a regular blob'):
            ck.materialize_checkpoint_file(self.repo, commit, self.run_id, row, self.repo / 'result')
        for relative in ['absent.json', '../outside.json', '/outside.json', 'bad\0.json']:
            with self.subTest(path=relative), self.assertRaises(ck.CheckpointError):
                ck.materialize_checkpoint_file(self.repo, commit, self.run_id,
                    {**row, 'path': relative}, self.repo / 'result')


if __name__ == '__main__':
    unittest.main()
