"""Offline CI provisioning regressions. Never installs packages or changes apt state."""
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest import mock

import ci_ffmpeg as installer


def result(code=0, stdout='', stderr=''):
    return subprocess.CompletedProcess([], code, stdout, stderr)


class Provisioning(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.release = mock.patch.object(installer, 'ubuntu_release', return_value='noble')
        self.release.start(); self.addCleanup(self.release.stop)

    def test_healthy_existing_encoder_only_smokes_without_sudo_or_apt(self):
        with mock.patch.object(installer, 'smoke', return_value=True), \
                mock.patch.object(installer, 'install', side_effect=AssertionError('install attempted')), \
                mock.patch.object(installer, 'run', side_effect=AssertionError('sudo attempted')):
            installer.ensure()

    def test_first_official_mirror_uses_verified_download_then_untimed_offline_install(self):
        with mock.patch.object(installer, 'run', return_value=result()) as run:
            installer.install(self.root)
        commands = [call.args[0] for call in run.call_args_list]
        self.assertEqual(len(commands), 3)
        self.assertIn('90s', commands[0]); self.assertIn('180s', commands[1])
        self.assertIn('--download-only', commands[1])
        self.assertIn('--no-download', commands[2])
        self.assertNotIn('timeout', commands[2]); self.assertEqual(run.call_args_list[2].kwargs, {})
        source = (self.root / 'mirror-0/sources.list').read_text()
        self.assertEqual(source.count(installer.MIRRORS[0]), 3)
        self.assertNotIn(installer.MIRRORS[1], source)
        self.assertIn('signed-by=/usr/share/keyrings/ubuntu-archive-keyring.gpg', source)
        for suite in ('noble', 'noble-updates', 'noble-security'):
            self.assertIn(' ' + suite + ' main universe', source)
        for command in commands:
            self.assertIn('Dir::Etc::sourceparts=-', command)
            self.assertIn('Acquire::Retries=1', command)
            self.assertIn('Acquire::https::Timeout=15', command)
            self.assertIn('Acquire::https::Verify-Peer=true', command)
            self.assertIn('Acquire::https::Verify-Host=true', command)
            self.assertIn('Acquire::AllowInsecureRepositories=false', command)
            self.assertIn('APT::Get::AllowUnauthenticated=false', command)
            self.assertIn('APT::Update::Error-Mode=any', command)
            self.assertNotIn('--allow-unauthenticated', command)
            self.assertIn('Dir::State::lists=' + str(self.root / 'mirror-0/lists'), command)
            self.assertIn('Dir::Cache::archives=' + str(self.root / 'mirror-0/archives'), command)

    def test_metadata_timeout_fails_over_to_distinct_official_mirror_and_fresh_lists(self):
        with mock.patch.object(installer, 'run', side_effect=[result(124), result(), result(), result()]) as run:
            installer.install(self.root)
        commands = [call.args[0] for call in run.call_args_list]
        self.assertEqual(len(commands), 4)
        self.assertEqual(commands[0][-1], 'update'); self.assertEqual(commands[1][-1], 'update')
        self.assertIn('Dir::State::lists=' + str(self.root / 'mirror-1/lists'), commands[1])
        source = (self.root / 'mirror-1/sources.list').read_text()
        self.assertIn(installer.MIRRORS[1], source); self.assertNotIn(installer.MIRRORS[0], source)
        self.assertIn('--no-download', commands[-1])

    def test_incomplete_package_download_never_starts_dpkg_before_successful_failover(self):
        with mock.patch.object(installer, 'run', side_effect=[result(), result(100), result(), result(), result()]) as run:
            installer.install(self.root)
        commands = [call.args[0] for call in run.call_args_list]
        self.assertEqual(sum('--no-download' in command for command in commands), 1)
        self.assertIn('Dir::State::lists=' + str(self.root / 'mirror-1/lists'), commands[-1])

    def test_both_mirrors_unavailable_never_install_or_bypass_authentication(self):
        with mock.patch.object(installer, 'run', return_value=result(100)) as run:
            with self.assertRaisesRegex(ValueError, 'both official'):
                installer.install(self.root)
        self.assertEqual(run.call_count, 2)
        self.assertTrue(all(call.args[0][-1] == 'update' for call in run.call_args_list))

    def test_signature_key_checksum_and_tls_errors_fail_closed_without_other_mirror(self):
        for error in ('NO_PUBKEY deadbeef', 'BADSIG bad signature', 'repository is not signed',
                      'Hash Sum mismatch', 'Certificate verification failed'):
            with self.subTest(error=error), tempfile.TemporaryDirectory() as root, \
                    mock.patch.object(installer, 'run', return_value=result(100, stderr=error)) as run:
                with self.assertRaisesRegex(ValueError, 'authenticity'):
                    installer.install(Path(root))
                self.assertEqual(run.call_count, 1)
        with tempfile.TemporaryDirectory() as root, mock.patch.object(installer, 'run', side_effect=[
                result(), result(100, stderr='Hash Sum mismatch')]) as run:
            with self.assertRaisesRegex(ValueError, 'authenticity'):
                installer.install(Path(root))
            self.assertEqual(run.call_count, 2)

    def test_install_failure_is_not_retried_after_possible_dpkg_mutation(self):
        with mock.patch.object(installer, 'run', side_effect=[result(), result(), result(100)]) as run:
            with self.assertRaisesRegex(ValueError, 'possible partial install'):
                installer.install(self.root)
        self.assertEqual(run.call_count, 3)
        self.assertNotIn('timeout', run.call_args_list[-1].args[0])

    def test_installed_binary_must_pass_smoke_and_only_owned_scratch_is_cleaned(self):
        with mock.patch.object(installer, 'smoke', side_effect=[False, False]), \
                mock.patch.object(installer, 'install') as install, \
                mock.patch.object(installer, 'run', return_value=result()) as run:
            with self.assertRaisesRegex(ValueError, 'encode/decoded-frame'):
                installer.ensure()
            owned = install.call_args.args[0]
            self.assertTrue(owned.name.startswith('dispatch-ffmpeg-'))
            self.assertEqual(run.call_args.args[0], ['sudo', '-n', 'rm', '-rf', '--', str(owned)])
            # Mock sudo did not clean the test's temporary directory.
            installer.shutil.rmtree(owned)


class Smoke(unittest.TestCase):
    def test_real_codec_and_frame_probe_are_required(self):
        row = {'codec_name': 'h264', 'width': 16, 'height': 16, 'r_frame_rate': '30/1', 'nb_read_frames': '3'}
        for change in ({}, {'codec_name': 'mpeg4'}, {'nb_read_frames': '2'}, {'height': 32}):
            with mock.patch.object(installer.shutil, 'which', side_effect=['/bin/ffmpeg', '/bin/ffprobe']), \
                    mock.patch.object(installer, 'run', side_effect=[result(), result(stdout=json.dumps({'streams': [row | change]}))]) as run:
                self.assertEqual(installer.smoke(Path('/fixture')), not bool(change))
                self.assertIn('libx264', run.call_args_list[0].args[0])
                self.assertIn('-count_frames', run.call_args_list[1].args[0])
                self.assertEqual(run.call_args_list[0].kwargs['timeout'], 30)

    def test_missing_binaries_encode_failure_and_malformed_probe_do_not_pass(self):
        with mock.patch.object(installer.shutil, 'which', return_value=None), \
                mock.patch.object(installer, 'run', side_effect=AssertionError('ran missing binary')):
            self.assertFalse(installer.smoke(Path('/fixture')))
        for outcomes in ([result(1)], [result(), result(1)], [result(), result(stdout='{}')]):
            with mock.patch.object(installer.shutil, 'which', return_value='/bin/fixture'), \
                    mock.patch.object(installer, 'run', side_effect=outcomes):
                self.assertFalse(installer.smoke(Path('/fixture')))


class UbuntuRelease(unittest.TestCase):
    def test_other_platform_or_architecture_is_not_given_ubuntu_packages(self):
        with mock.patch.object(Path, 'read_text', return_value='ID=debian\nVERSION_CODENAME=trixie\n'), \
                mock.patch.object(installer, 'run', side_effect=AssertionError('package command started')):
            with self.assertRaisesRegex(ValueError, 'Ubuntu 24.04'):
                installer.ubuntu_release()
        with mock.patch.object(Path, 'read_text', return_value='ID=ubuntu\nVERSION_CODENAME=noble\n'), \
                mock.patch.object(installer, 'run', return_value=result(stdout='arm64\n')):
            with self.assertRaisesRegex(ValueError, 'amd64'):
                installer.ubuntu_release()

    def test_missing_signing_keyring_does_not_trigger_untrusted_fallback(self):
        with mock.patch.object(Path, 'read_text', return_value='ID=ubuntu\nVERSION_CODENAME=noble\n'), \
                mock.patch.object(installer, 'run', return_value=result(stdout='amd64\n')), \
                mock.patch.object(Path, 'is_file', return_value=False):
            with self.assertRaisesRegex(ValueError, 'signing keyring'):
                installer.ubuntu_release()


if __name__ == '__main__':
    unittest.main()
