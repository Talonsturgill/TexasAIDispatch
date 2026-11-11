"""Install a complete SHA256-locked CI media environment without changing host tools."""
import hashlib
import json
import os
from pathlib import Path
import re
import shlex
import subprocess
import tempfile
from urllib.parse import urlsplit

CHANNEL = 'https://conda.anaconda.org/conda-forge'
CONDA = Path('/usr/share/miniconda/bin/conda')


def canonical_artifact_url(value):
    """Allow only the epoch separator's equivalent URL spelling, not general unquoting."""
    if not isinstance(value, str):
        raise ValueError('locked package URL must be a string')
    url = urlsplit(value)
    path = url.path.replace('%21', '!')
    if (not value.startswith(CHANNEL + '/') or any(char.isspace() for char in value)
            or url.scheme != 'https' or url.netloc != 'conda.anaconda.org' or '?' in value or '#' in value
            or not re.fullmatch(r'/conda-forge/(linux-64|noarch)/[A-Za-z0-9_.!+-]+\.(conda|tar\.bz2)', path)):
        raise ValueError('package URL must identify an exact official conda-forge artifact')
    return 'https://conda.anaconda.org' + path


def read_lock(path):
    """Only complete explicit conda-forge artifact URLs with SHA256 qualify."""
    text = Path(path).read_text()
    lines = [line.strip() for line in text.splitlines() if line.strip() and not line.lstrip().startswith('#')]
    if not lines or lines.pop(0) != '@EXPLICIT':
        raise ValueError('media tooling needs an explicit artifact lock, never a runtime dependency solve')
    packages = {}
    for line in lines:
        url = urlsplit(line)
        if not re.fullmatch(r'[0-9a-f]{64}', url.fragment):
            raise ValueError('every locked package needs an exact official conda-forge URL and SHA256')
        artifact_url = line.rsplit('#', 1)[0]
        filename = canonical_artifact_url(artifact_url).rsplit('/', 1)[1]
        stem = filename[:-6] if filename.endswith('.conda') else filename[:-8]
        try:
            name, version, build = stem.rsplit('-', 2)
        except ValueError as exc:
            raise ValueError('malformed locked package filename') from exc
        if not name or name in packages:
            raise ValueError('locked package names must be unique')
        packages[name] = {'name': name, 'version': version, 'build': build,
                          'url': artifact_url, 'sha256': url.fragment}
    ffmpeg = packages.get('ffmpeg')
    if not ffmpeg or not ffmpeg['build'].startswith('gpl_') or 'x264' not in packages:
        raise ValueError('locked media tooling requires the GPL FFmpeg build and its x264 dependency')
    return packages


def validate_installed(prefix, packages):
    """Check the complete installed closure before executing either media binary."""
    records = {}
    for path in (Path(prefix) / 'conda-meta').glob('*.json'):
        row = json.loads(path.read_text())
        name = row.get('name')
        if name in records:
            raise ValueError('duplicate installed package record')
        records[name] = {key: row.get(key) for key in ('name', 'version', 'build', 'url', 'sha256')}
        records[name]['url'] = canonical_artifact_url(records[name]['url'])
    expected = {name: {**row, 'url': canonical_artifact_url(row['url'])} for name, row in packages.items()}
    if records != expected:
        raise ValueError('installed package URLs, versions, builds or SHA256 differ from the complete lock')


def checked(command, *, env=None, timeout=60):
    result = subprocess.run(command, env=env, text=True, capture_output=True, timeout=timeout)
    if result.returncode:
        raise ValueError('media tooling command failed: ' + (result.stderr or result.stdout)[-1500:])
    return result.stdout + result.stderr


def validate_tools(prefix, directory, packages):
    from ci_ffmpeg import smoke
    from env_check import FFMPEG_CAPABILITIES, missing_ffmpeg_capabilities_from
    encoder, probe = (Path(prefix) / 'bin' / name for name in ('ffmpeg', 'ffprobe'))
    version = packages['ffmpeg']['version']
    for name, binary in (('ffmpeg', encoder), ('ffprobe', probe)):
        if not binary.is_file() or not os.access(binary, os.X_OK):
            raise ValueError('locked ' + name + ' executable is missing')
        if not checked([str(binary), '-version']).startswith(name + ' version ' + version + ' '):
            raise ValueError(name + ' executable version differs from the locked package')
    build = checked([str(encoder), '-hide_banner', '-buildconf'])
    if '--enable-gpl' not in build or '--enable-libx264' not in build:
        raise ValueError('locked FFmpeg does not enable GPL and libx264')
    tables = {table: checked([str(encoder), '-hide_banner', '-' + table]) for table in FFMPEG_CAPABILITIES}
    missing = missing_ffmpeg_capabilities_from(tables)
    if missing:
        raise ValueError('locked FFmpeg lacks required capabilities: ' + ', '.join(missing))
    if not smoke(directory, binaries=(str(encoder), str(probe))):
        raise ValueError('locked FFmpeg failed the real H.264 encoding and decoded-frame probe')
    # The production audio gate also needs a full audio filter/encoder build.
    audio = Path(directory) / 'audio-smoke.m4a'
    checked([str(encoder), '-nostdin', '-v', 'error', '-f', 'lavfi', '-i',
             'sine=frequency=440:sample_rate=48000:duration=1', '-af',
             'loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000,alimiter=limit=0.9:level=false',
             '-c:a', 'aac', '-y', str(audio)])
    data = json.loads(checked([str(probe), '-v', 'error', '-select_streams', 'a:0',
                              '-show_entries', 'stream=codec_name,sample_rate', '-of', 'json', str(audio)]))
    if data.get('streams') != [{'codec_name': 'aac', 'sample_rate': '48000'}]:
        raise ValueError('locked FFmpeg failed the AAC/loudness/resampling probe')
    return encoder, probe


def publish_tools(directory, encoder, probe):
    """Expose only the two checked tools, never conda Python or shared libraries."""
    wrappers = Path(directory) / 'media-bin'
    wrappers.mkdir()
    for name, executable in (('ffmpeg', encoder), ('ffprobe', probe)):
        path = wrappers / name
        path.write_text('#!/bin/sh\nexec ' + shlex.quote(str(executable)) + ' "$@"\n')
        path.chmod(0o755)
    if any(char in str(wrappers) for char in '\r\n'):
        raise ValueError('media wrapper path must not contain line breaks')
    # GitHub applies these to subsequent steps only, after all validation passed.
    if os.environ.get('GITHUB_PATH'):
        with open(os.environ['GITHUB_PATH'], 'a') as handle:
            handle.write(str(wrappers) + '\n')
    if os.environ.get('GITHUB_ENV'):
        with open(os.environ['GITHUB_ENV'], 'a') as handle:
            handle.write('DISPATCH_TEST_FFMPEG=' + str(wrappers / 'ffmpeg') + '\n')
    return wrappers


def install_locked(lock):
    lock = Path(lock).resolve()
    packages = read_lock(lock)
    if not CONDA.is_file() or not os.access(CONDA, os.X_OK):
        raise ValueError('the documented runner Miniconda executable is missing; no unverified bootstrap is allowed')
    version = checked([str(CONDA), '--version'])
    match = re.match(r'conda (\d+)\.(\d+)', version)
    if not match or tuple(map(int, match.groups())) < (24, 9):
        raise ValueError('runner conda must support SHA256 explicit locks (24.9 or newer)')
    directory = Path(tempfile.mkdtemp(prefix='dispatch-conda-media-', dir=os.environ.get('RUNNER_TEMP')))
    prefix = directory / 'env'
    home = directory / 'home'; home.mkdir()
    config = directory / 'condarc'
    config.write_text('channels:\n  - ' + CHANNEL + '\ndefault_channels: []\nssl_verify: true\n')
    env = {key: value for key, value in os.environ.items() if key not in ('PYTHONHOME', 'PYTHONPATH')}
    env.update(HOME=str(home), XDG_CACHE_HOME=str(directory/'cache'), CONDARC=str(config),
               CONDA_PKGS_DIRS=str(directory/'pkgs'), CONDA_ENVS_PATH=str(directory/'envs'),
               CONDA_SSL_VERIFY='true', CONDA_SAFETY_CHECKS='enabled', CONDA_EXTRA_SAFETY_CHECKS='true',
               CONDA_REMOTE_CONNECT_TIMEOUT_SECS='15', CONDA_REMOTE_READ_TIMEOUT_SECS='30',
               CONDA_REMOTE_MAX_RETRIES='1', CONDA_REPORT_ERRORS='false', CONDA_NOTIFY_OUTDATED_CONDA='false')
    # The only installation target and cache are this new owned scratch tree.
    # Timing out this isolated environment cannot interrupt dpkg or a live env.
    checked([str(CONDA), 'create', '--yes', '--copy', '--no-default-packages', '--override-channels',
             '--channel', CHANNEL, '--prefix', str(prefix), '--file', str(lock)], env=env, timeout=600)
    validate_installed(prefix, packages)
    encoder, probe = validate_tools(prefix, directory, packages)
    receipt = {'schema': 'dispatch-ci-media-tooling/1', 'source': CHANNEL,
               'lock_sha256': hashlib.sha256(lock.read_bytes()).hexdigest(),
               'packages': len(packages), 'ffmpeg': packages['ffmpeg'], 'conda_version': version.strip(),
               'h264_probe': True, 'audio_probe': True, 'required_capabilities': True}
    (directory/'media-tooling.json').write_text(json.dumps(receipt, indent=2)+'\n')
    wrappers = publish_tools(directory, encoder, probe)
    print('PASS locked conda-forge FFmpeg ' + packages['ffmpeg']['version'] + ' via ' + str(wrappers))
    return wrappers
