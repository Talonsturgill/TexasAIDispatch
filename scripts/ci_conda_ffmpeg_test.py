"""Fail-closed lock installation and tool exposure. No package/network calls in unit fixtures."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest import mock

import ci_conda_ffmpeg as media
import ci_ffmpeg


class LockedMedia(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.lock = self.root/'explicit.txt'
        self.lines = ['@EXPLICIT',
            media.CHANNEL+'/linux-64/ffmpeg-9.0.2-gpl_example_107.conda#'+'a'*64,
            media.CHANNEL+'/linux-64/x264-1%21164.3095-example_3.conda#'+'b'*64]
        self.lock.write_text('\n'.join(self.lines)+'\n')
        self.packages = media.read_lock(self.lock)
        self.conda = self.root/'conda'; self.conda.write_text('# unit fixture only\n'); self.conda.chmod(0o755)
        self.github_path = self.root/'github-path'; self.github_path.write_text('unchanged-path\n')
        self.github_env = self.root/'github-env'; self.github_env.write_text('UNCHANGED=value\n')
        self.env = mock.patch.dict(os.environ, {'RUNNER_TEMP':str(self.root), 'GITHUB_PATH':str(self.github_path),
            'GITHUB_ENV':str(self.github_env), 'PYTHONPATH':'/must-not-enter-conda', 'PYTHONHOME':'/must-not-enter-conda'})
        self.env.start(); self.addCleanup(self.env.stop)

    def metadata(self, prefix, packages=None):
        target = Path(prefix)/'conda-meta'; target.mkdir(parents=True, exist_ok=True)
        for name, row in (packages or self.packages).items():
            (target/(name+'.json')).write_text(json.dumps(row))

    def checked(self, command, **kwargs):
        if command[1:] == ['--version']:
            return 'conda 26.9.4\n'
        self.assertEqual(command[1], 'create')
        prefix = Path(command[command.index('--prefix')+1]); self.metadata(prefix)
        return ''

    def tools(self, prefix, directory, packages):
        return Path(prefix)/'bin/ffmpeg', Path(prefix)/'bin/ffprobe'

    def test_committed_complete_lock_matches_retained_provenance(self):
        root = Path(media.__file__).resolve().parents[1]
        lock = root/'config/ci_ffmpeg_linux64.explicit.txt'
        packages = media.read_lock(lock)
        provenance = json.loads((root/'config/ci_ffmpeg_linux64.provenance.json').read_text())
        self.assertEqual(provenance['lock_sha256'], hashlib.sha256(lock.read_bytes()).hexdigest())
        self.assertEqual(len(packages), provenance['packages'])
        self.assertEqual(provenance['artifact_sha256_verified'], len(packages))
        self.assertEqual(packages['ffmpeg']['version'], '9.0.2')
        self.assertEqual(packages['ffmpeg']['sha256'], 'e7303cacf72e099c413bc9696edf47742bb25cc64c14d0290871586c97be1c2e')
        self.assertEqual(self.packages['x264']['version'], '1!164.3095')

    def test_unpinned_foreign_insecure_ambiguous_and_duplicate_artifacts_are_refused(self):
        original = self.lines[1]
        invalid = [original.replace('https:', 'http:'), original.replace('conda-forge', 'defaults'),
                   original.replace('conda.anaconda.org', 'unverified.example'),
                   original.split('#')[0], original.split('#')[0]+'#'+'a'*32,
                   original.replace('/linux-64/', '/osx-64/'), original.replace('/ffmpeg-', '/%2fetc/ffmpeg-'),
                   original.replace('.conda#', '.conda?untrusted=1#'), original.replace('gpl_', 'lgpl_'),
                   original.replace('https://', 'https://someone:secret@')]
        for line in invalid:
            self.lock.write_text('\n'.join([self.lines[0],line,self.lines[2]])+'\n')
            with self.subTest(line=line), self.assertRaises(ValueError):
                media.read_lock(self.lock)
        for lines in ([original,self.lines[2]], ['ffmpeg=9.0.2'], self.lines+[original], self.lines[:2]):
            self.lock.write_text('\n'.join(lines)+'\n')
            with self.assertRaises(ValueError): media.read_lock(self.lock)

    def test_installed_full_closure_must_match_each_field(self):
        prefix = self.root/'env'; self.metadata(prefix)
        media.validate_installed(prefix,self.packages)
        path = prefix/'conda-meta/ffmpeg.json'
        for field in ('name','version','build','url','sha256'):
            changed = {**self.packages['ffmpeg'],field:'changed'}; path.write_text(json.dumps(changed))
            with self.subTest(field=field), self.assertRaises(ValueError):
                media.validate_installed(prefix,self.packages)
        self.metadata(prefix)
        (prefix/'conda-meta/unexpected.json').write_text(json.dumps({**self.packages['ffmpeg'],'name':'extra'}))
        with self.assertRaises(ValueError): media.validate_installed(prefix,self.packages)

    def test_epoch_url_spelling_is_equivalent_but_other_changes_are_not(self):
        prefix = self.root/'env'; self.metadata(prefix)
        path = prefix/'conda-meta/x264.json'
        original = self.packages['x264']
        equivalent = original['url'].replace('%21', '!')
        path.write_text(json.dumps({**original, 'url': equivalent}))
        media.validate_installed(prefix,self.packages)
        # Equivalence is symmetric and never changes the expected hash or other fields.
        decoded_expected = {**self.packages, 'x264': {**original, 'url': equivalent}}
        self.metadata(prefix)
        media.validate_installed(prefix,decoded_expected)
        invalid = [equivalent.replace('https:', 'http:'), equivalent.replace('conda.anaconda.org', 'other.example'),
                   equivalent.replace('https://', 'https://someone@'), equivalent.replace('/linux-64/', '/noarch/'),
                   equivalent.replace('example_3', 'other_3'), equivalent+'?x=1', equivalent+'#extra',
                   equivalent.replace('!', '%2521'), equivalent.replace('/x264-', '/%2e%2e/x264-'),
                   equivalent.replace('conda.anaconda.org', 'conda.anaconda.org:443'),
                   ' '+equivalent, equivalent.replace('x264', 'x\t264')]
        for url in invalid:
            path.write_text(json.dumps({**original, 'url': url}))
            with self.subTest(url=url), self.assertRaises(ValueError):
                media.validate_installed(prefix,self.packages)
        path.write_text(json.dumps({**original, 'url': equivalent, 'sha256': 'c'*64}))
        with self.assertRaises(ValueError): media.validate_installed(prefix,self.packages)

    def test_missing_or_old_documented_solver_cannot_bootstrap_or_install(self):
        with mock.patch.object(media,'CONDA',self.root/'missing'), mock.patch.object(media,'checked') as run:
            with self.assertRaisesRegex(ValueError,'missing'): media.install_locked(self.lock)
            run.assert_not_called()
        with mock.patch.object(media,'CONDA',self.conda), \
                mock.patch.object(media,'checked',return_value='conda 24.8.1\n') as run:
            with self.assertRaisesRegex(ValueError,'24.9'): media.install_locked(self.lock)
            self.assertEqual(run.call_count,1)

    def test_installer_isolated_exact_channel_ssl_and_no_base_python_exposure(self):
        with mock.patch.object(media,'CONDA',self.conda), \
                mock.patch.object(media,'checked',side_effect=self.checked) as run, \
                mock.patch.object(media,'validate_tools',side_effect=self.tools):
            wrappers = media.install_locked(self.lock)
        self.assertEqual({p.name for p in wrappers.iterdir()},{'ffmpeg','ffprobe'})
        command = run.call_args_list[1].args[0]; options = run.call_args_list[1].kwargs
        self.assertIn('--no-default-packages',command); self.assertIn('--copy',command)
        self.assertIn('--override-channels',command); self.assertIn(media.CHANNEL,command)
        self.assertEqual(command[command.index('--file')+1],str(self.lock))
        self.assertEqual(options['timeout'],600)
        env = options['env']
        self.assertNotIn('PYTHONPATH',env); self.assertNotIn('PYTHONHOME',env)
        self.assertEqual(env['CONDA_SSL_VERIFY'],'true'); self.assertEqual(env['CONDA_EXTRA_SAFETY_CHECKS'],'true')
        self.assertEqual(env['CONDA_SAFETY_CHECKS'],'enabled')
        self.assertTrue(Path(env['HOME']).is_relative_to(wrappers.parent))
        self.assertTrue(Path(env['CONDA_PKGS_DIRS']).is_relative_to(wrappers.parent))
        self.assertIn(str(wrappers)+'\n',self.github_path.read_text())
        self.assertIn('DISPATCH_TEST_FFMPEG='+str(wrappers/'ffmpeg'),self.github_env.read_text())
        self.assertNotIn('/env/bin\n',self.github_path.read_text())
        self.assertNotIn('LD_LIBRARY_PATH',self.github_env.read_text())
        receipt = json.loads((wrappers.parent/'media-tooling.json').read_text())
        self.assertEqual(receipt['packages'],2); self.assertTrue(receipt['audio_probe'])

    def test_package_or_capability_failure_cannot_publish_any_path(self):
        for stage in ('validate_installed','validate_tools'):
            with mock.patch.object(media,'CONDA',self.conda), \
                    mock.patch.object(media,'checked',side_effect=self.checked), \
                    mock.patch.object(media,stage,side_effect=ValueError('verification failed')):
                with self.assertRaisesRegex(ValueError,'verification failed'): media.install_locked(self.lock)
            self.assertEqual(self.github_path.read_text(),'unchanged-path\n')
            self.assertEqual(self.github_env.read_text(),'UNCHANGED=value\n')

    def test_network_timeout_never_executes_media_or_publishes_paths(self):
        with mock.patch.object(media,'CONDA',self.conda), \
                mock.patch.object(media,'checked',side_effect=['conda 26.9.4\n',subprocess.TimeoutExpired('conda',600)]), \
                mock.patch.object(media,'validate_tools',side_effect=AssertionError('unverified binary executed')):
            with self.assertRaises(subprocess.TimeoutExpired): media.install_locked(self.lock)
        self.assertEqual(self.github_path.read_text(),'unchanged-path\n')
        self.assertEqual(self.github_env.read_text(),'UNCHANGED=value\n')

    def test_ci_entry_uses_lock_without_apt_or_system_smoke(self):
        with mock.patch.object(media,'install_locked',return_value=Path('/verified/media-bin')) as install, \
                mock.patch.object(ci_ffmpeg,'smoke',side_effect=AssertionError('system tooling substituted')), \
                mock.patch.object(ci_ffmpeg,'install',side_effect=AssertionError('apt attempted')):
            self.assertEqual(ci_ffmpeg.ensure(self.lock),Path('/verified/media-bin'))
            install.assert_called_once_with(self.lock)


class CapabilityRefusals(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name); (self.root/'bin').mkdir()
        for name in ('ffmpeg','ffprobe'):
            path=self.root/'bin'/name; path.write_text('unit executable fixture'); path.chmod(0o755)
        self.packages={'ffmpeg':{'version':'9.0.2'}}

    def checked(self, command, **kwargs):
        from env_check import FFMPEG_CAPABILITIES
        if command[1:] == ['-version']:
            return Path(command[0]).name+' version 9.0.2 test\n'
        if '-buildconf' in command:return '--enable-gpl --enable-libx264'
        for table,names in FFMPEG_CAPABILITIES.items():
            if '-'+table in command:return '\n'.join('... '+name+' fixture' for name in names)
        if command[0].endswith('ffprobe'):
            return '{"streams":[{"codec_name":"aac","sample_rate":"48000"}]}'
        return ''

    def test_required_video_and_audio_probes_are_not_skipped(self):
        with mock.patch.object(media,'checked',side_effect=self.checked) as run, \
                mock.patch.object(ci_ffmpeg,'smoke',return_value=True) as smoke:
            media.validate_tools(self.root,self.root,self.packages)
        smoke.assert_called_once_with(self.root,binaries=(str(self.root/'bin/ffmpeg'),str(self.root/'bin/ffprobe')))
        self.assertTrue(any('loudnorm=' in ' '.join(call.args[0]) for call in run.call_args_list))

    def test_wrong_version_missing_x264_filter_or_probe_fails_closed(self):
        for broken in ('version','build','filters','audio'):
            def checked(command,**kwargs):
                if broken=='version' and '-version' in command:return 'ffmpeg version 6.1.1 old'
                if broken=='build' and '-buildconf' in command:return '--enable-gpl'
                if broken=='filters' and '-filters' in command:return ''
                if broken=='audio' and command[0].endswith('ffprobe') and '-of' in command:return '{"streams":[]}'
                return self.checked(command,**kwargs)
            with self.subTest(broken=broken), mock.patch.object(media,'checked',side_effect=checked), \
                    mock.patch.object(ci_ffmpeg,'smoke',return_value=True):
                with self.assertRaises(ValueError): media.validate_tools(self.root,self.root,self.packages)
        with mock.patch.object(media,'checked',side_effect=self.checked), \
                mock.patch.object(ci_ffmpeg,'smoke',return_value=False):
            with self.assertRaisesRegex(ValueError,'decoded-frame'): media.validate_tools(self.root,self.root,self.packages)


if __name__=='__main__':
    unittest.main()
