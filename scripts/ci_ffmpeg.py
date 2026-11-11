"""Provision verified CI FFmpeg from a complete conda lock or signed Ubuntu archives."""
import argparse
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

MIRRORS = ('https://security.ubuntu.com/ubuntu', 'https://us.archive.ubuntu.com/ubuntu')
KEYRING = Path('/usr/share/keyrings/ubuntu-archive-keyring.gpg')
UPDATE_SECONDS = 90
DOWNLOAD_SECONDS = 180
TRUST_FAILURE = re.compile(r'NO_PUBKEY|BADSIG|EXPKEYSIG|not signed|invalid signature|'
                          r'signatures? (?:could not|couldn.t|cannot|can.t)|'
                          r'Hash Sum mismatch|Clearsigned file|Certificate verification failed', re.I)


def run(command, **kwargs):
    result = subprocess.run(command, text=True, capture_output=True, **kwargs)
    if result.stdout:
        print(result.stdout, end='', flush=True)
    if result.stderr:
        print(result.stderr, end='', flush=True)
    return result


def smoke(directory, binaries=None):
    """Check the real encoder and decoder, not just two executable filenames."""
    encoder, probe = binaries or (shutil.which('ffmpeg'), shutil.which('ffprobe'))
    if not encoder or not probe:
        return False
    film = Path(directory) / 'ffmpeg-smoke.mp4'
    result = run([encoder, '-nostdin', '-v', 'error', '-f', 'lavfi', '-i',
                  'testsrc2=size=16x16:rate=30:duration=0.1', '-an', '-c:v', 'libx264',
                  '-pix_fmt', 'yuv420p', '-y', str(film)], timeout=30)
    if result.returncode:
        return False
    result = run([probe, '-v', 'error', '-select_streams', 'v:0', '-count_frames',
                  '-show_entries', 'stream=codec_name,width,height,r_frame_rate,nb_read_frames',
                  '-of', 'json', str(film)], timeout=30)
    if result.returncode:
        return False
    try:
        row = json.loads(result.stdout)['streams'][0]
        return (row['codec_name'], row['width'], row['height'], row['r_frame_rate'], row['nb_read_frames']) == (
            'h264', 16, 16, '30/1', '3')
    except (ValueError, KeyError, IndexError, TypeError):
        return False


def ubuntu_release():
    data = {}
    for line in Path('/etc/os-release').read_text().splitlines():
        key, separator, value = line.partition('=')
        if separator:
            data[key] = value.strip('"')
    if data.get('ID') != 'ubuntu' or data.get('VERSION_CODENAME') != 'noble':
        raise ValueError('FFmpeg installer supports the Ubuntu 24.04 CI runner only')
    architecture = run(['dpkg', '--print-architecture'])
    if architecture.returncode or architecture.stdout.strip() != 'amd64':
        raise ValueError('FFmpeg installer requires the official Ubuntu amd64 archive')
    if not KEYRING.is_file():
        raise ValueError('the existing Ubuntu archive signing keyring is missing')
    return 'noble'


def apt_options(directory):
    return [item for value in (
        'Dir::Etc::sourcelist=' + str(directory / 'sources.list'), 'Dir::Etc::sourceparts=-',
        'Dir::State::lists=' + str(directory / 'lists'), 'Dir::Cache::archives=' + str(directory / 'archives'),
        'Acquire::Retries=1', 'Acquire::http::Timeout=15', 'Acquire::https::Timeout=15',
        'Acquire::https::Verify-Peer=true', 'Acquire::https::Verify-Host=true',
        'Acquire::AllowInsecureRepositories=false', 'Acquire::AllowDowngradeToInsecureRepositories=false',
        'APT::Get::AllowUnauthenticated=false', 'APT::Update::Error-Mode=any',
        'Acquire::Languages=none', 'Dpkg::Lock::Timeout=30') for item in ('-o', value)]


def apt(directory, action, seconds=None):
    command = ['sudo', '-n', 'env', 'DEBIAN_FRONTEND=noninteractive']
    if seconds is not None:
        # timeout runs privileged too, so it can stop all download subprocesses.
        # It is NEVER applied to the package-installation/dpkg phase.
        command += ['timeout', '--signal=TERM', '--kill-after=5s', str(seconds) + 's']
    return run(command + ['apt-get', *apt_options(directory), *action])


def install(directory):
    release = ubuntu_release()
    for number, mirror in enumerate(MIRRORS):
        attempt = directory / ('mirror-%d' % number)
        attempt.mkdir()
        for name in ('lists', 'archives'):
            (attempt / name / 'partial').mkdir(parents=True)
        source = '\n'.join('deb [arch=amd64 signed-by=%s] %s %s main universe' % (KEYRING, mirror, suite)
                           for suite in (release, release + '-updates', release + '-security'))
        (attempt / 'sources.list').write_text(source + '\n')
        print('Checking signed Ubuntu packages at ' + mirror, flush=True)
        ready = True
        for action, seconds in ((['update'], UPDATE_SECONDS),
                                (['--yes', '--no-install-recommends', '--download-only', 'install', 'ffmpeg'],
                                 DOWNLOAD_SECONDS)):
            result = apt(attempt, action, seconds)
            if result.returncode:
                if TRUST_FAILURE.search((result.stdout or '') + (result.stderr or '')):
                    raise ValueError('Ubuntu package authenticity verification failed; no installation attempted')
                ready = False
                print('Mirror download failed with exit %d; trying the next official mirror.' % result.returncode,
                      flush=True)
                break
        if not ready:
            continue
        # All package bytes have passed apt's authenticated download phase. No
        # network or timer is allowed around dpkg, and a failed install is not retried.
        result = apt(attempt, ['--yes', '--no-install-recommends', '--no-download', 'install', 'ffmpeg'])
        if result.returncode:
            raise ValueError('FFmpeg offline package installation failed; not retrying a possible partial install')
        return
    raise ValueError('both official Ubuntu mirrors failed their bounded metadata/download phases')


def ensure(conda_lock=None):
    if conda_lock is not None:
        from ci_conda_ffmpeg import install_locked
        return install_locked(conda_lock)
    # No global apt sources, keys, TLS policy or cache are rewritten. This owned
    # temporary tree may contain root-owned apt files after an attempted install.
    directory = Path(tempfile.mkdtemp(prefix='dispatch-ffmpeg-', dir=os.environ.get('RUNNER_TEMP')))
    directory.chmod(0o755)
    used_apt = False
    try:
        if smoke(directory):
            print('PASS FFmpeg H.264 encode and decoded-frame probe')
            return
        used_apt = True
        install(directory)
        if not smoke(directory):
            raise ValueError('installed FFmpeg failed the H.264 encode/decoded-frame probe')
        print('PASS installed FFmpeg H.264 encode and decoded-frame probe')
    finally:
        if used_apt:
            # This exact mkdtemp-owned path is the only cleanup target. Run only
            # after apt has exited, never while dpkg is in progress.
            cleaned = run(['sudo', '-n', 'rm', '-rf', '--', str(directory)])
            if cleaned.returncode:
                print('Could not remove the isolated CI apt scratch directory: ' + str(directory), flush=True)
        else:
            shutil.rmtree(directory)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ensure', action='store_true', required=True)
    parser.add_argument('--conda-lock', type=Path, help='use this complete SHA256-locked isolated CI toolchain')
    args = parser.parse_args()
    try:
        ensure(args.conda_lock)
        return 0
    except (OSError, ValueError, subprocess.SubprocessError) as exc:
        print('FAIL FFmpeg provisioning: ' + str(exc), flush=True)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
