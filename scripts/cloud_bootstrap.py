"""Idempotent Linux cloud setup with external caches and the production alignment pins."""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path
import platform
import shutil
import subprocess
import sys
import urllib.request

REPO = Path(__file__).resolve().parents[1]


def digest(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1048576), b''):
            h.update(chunk)
    return h.hexdigest()


def cache_root(environ=None):
    env = os.environ if environ is None else environ
    return Path(env.get('DISPATCH_CLOUD_CACHE') or
                Path(env.get('XDG_CACHE_HOME') or Path.home() / '.cache') / 'texas-ai-dispatch')


def changed(source, marker):
    return not Path(marker).is_file() or Path(marker).read_text().strip() != digest(source)


def run(args, cwd=REPO):
    subprocess.run([str(arg) for arg in args], cwd=cwd, check=True)


def model_cache(path, cfg, attempts=5, opener=None):
    """Fetch the pinned model, resuming a stream the network cut short. The pinned URL and SHA-256
    never change: a partial file is never accepted, only continued with a Range request until the
    original hash verifies. On 2026-10-10 a cloud proxy ended the download cleanly 1.67 MB early
    (485,939,276 of 487,614,201 bytes) and the old one-shot copy failed the hash with nothing to
    resume from. A failed attempt keeps its bytes, a verified model replaces the cache atomically,
    and an unverifiable one leaves the previous cache untouched."""
    if path.is_file() and digest(path) == cfg['sha256']:
        return
    opener = opener or urllib.request.urlopen
    partial = path.with_suffix('.download')
    failures = []
    for attempt in range(1, attempts + 1):
        have = partial.stat().st_size if partial.is_file() else 0
        headers = {'Range': 'bytes=%d-' % have} if have else {}
        mode = 'wb'
        try:
            with opener(urllib.request.Request(cfg['url'], headers=headers), timeout=60) as response:
                if have and getattr(response, 'status', 200) == 206:
                    mode = 'ab'
                expected = response.headers.get('Content-Length') if hasattr(response, 'headers') else None
                before = have if mode == 'ab' else 0
                with partial.open(mode) as stream:
                    shutil.copyfileobj(response, stream)
            received = partial.stat().st_size - before
            if expected is not None and int(expected) != received:
                failures.append({'attempt': attempt, 'truncated': True, 'received': received, 'expected': int(expected)})
        except (OSError, ValueError) as exc:
            failures.append({'attempt': attempt, 'error': type(exc).__name__})
        if partial.is_file() and digest(partial) == cfg['sha256']:
            partial.replace(path)
            return
        if partial.is_file() and mode == 'ab':
            # A continued file that is complete and still wrong is corrupt, not short: start over.
            if failures and not failures[-1].get('truncated') and not failures[-1].get('error'):
                partial.unlink()
        failures.append({'attempt': attempt, 'hash_verified': False,
                         'bytes': partial.stat().st_size if partial.is_file() else 0})
    raise ValueError('Alignment model hash failed; the previous cache was retained ' + json.dumps(failures[-3:]))


def install():
    if platform.system() != 'Linux':
        raise ValueError('Cloud installation is Linux-only; use the existing local workspace runtime')
    cfg = json.loads((REPO / 'config/cloud_bootstrap.json').read_text())
    alignment = json.loads((REPO / 'config/alignment.json').read_text())
    if cfg['whisper_tag'] != 'v' + alignment['version']:
        raise ValueError('Cloud Whisper pin differs from the production alignment contract')
    cache = cache_root(); cache.mkdir(parents=True, exist_ok=True)
    if cache.resolve().is_relative_to(REPO):
        raise ValueError('The cloud runtime cache must remain outside the source repository')
    # Full distro FFmpeg retains concat, source filters, libx264 and AAC. Never substitute
    # a lean bundled renderer binary or reduce the native capture format.
    if any(not shutil.which(name) for name in ('ffmpeg', 'ffprobe', 'cmake', 'c++', 'lsof')):
        prefix = [] if os.geteuid() == 0 else ['sudo', '-n']
        run(prefix + ['apt-get', '-o', 'Acquire::Retries=1', 'update'])
        run(prefix + ['apt-get', 'install', '-y', '--no-install-recommends',
                      'ffmpeg', 'cmake', 'build-essential', 'pkg-config', 'python3-venv', 'lsof'])
    if any(not shutil.which(name) for name in ('node', 'npm', 'npx', 'git')):
        raise ValueError('The Claude environment must provide Node, npm, npx and Git before setup')
    node_major = int(subprocess.check_output(['node', '--version'], text=True).strip().lstrip('v').split('.')[0])
    if node_major < 22:
        raise ValueError('Use the existing Node 22-or-newer Claude runtime')
    venv = cache / 'venv'; python = venv / 'bin/python'
    if not python.is_file():
        run([sys.executable, '-m', 'venv', venv])
    req = REPO / cfg['requirements']; stamp = cache / 'requirements.sha256'
    if changed(req, stamp):
        run([python, '-m', 'pip', 'install', '--disable-pip-version-check', '-r', req])
        stamp.write_text(digest(req) + '\n')
    engine = REPO / 'video-engine'; lock = REPO / cfg['node_lock']
    npm_stamp = engine / 'node_modules/.dispatch-lock.sha256'
    if changed(lock, npm_stamp):
        run(['npm', 'ci', '--no-audit', '--no-fund'], engine)
        npm_stamp.write_text(digest(lock) + '\n')
    run(['npx', '--no-install', 'remotion', 'browser', 'ensure'], engine)
    source = cache / ('whisper-' + alignment['version'])
    binary = cache / 'bin/whisper-cli'; binary.parent.mkdir(exist_ok=True)
    build_stamp = cache / 'whisper-commit.txt'
    if not binary.is_file() or not build_stamp.is_file() or build_stamp.read_text().strip() != cfg['whisper_commit']:
        if not source.exists():
            run(['git', 'clone', '--depth', '1', '--branch', cfg['whisper_tag'], cfg['whisper_repository'], source])
        observed = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=source, text=True).strip()
        if observed != cfg['whisper_commit']:
            raise ValueError('Official Whisper tag does not resolve to the frozen production commit')
        run(['cmake', '-S', source, '-B', source / 'build', '-DGGML_CUDA=OFF',
             '-DBUILD_SHARED_LIBS=OFF', '-DWHISPER_BUILD_TESTS=OFF'])
        run(['cmake', '--build', source / 'build', '--target', 'whisper-cli', '-j', str(min(4, os.cpu_count() or 1))])
        shutil.copy2(source / 'build/bin/whisper-cli', binary)
        build_stamp.write_text(cfg['whisper_commit'] + '\n')
    model_cache(cache / alignment['filename'], alignment)
    print('Pinned Python, locked Remotion, managed browser and acoustic alignment cache ready.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--install', action='store_true')
    args = parser.parse_args()
    if args.install:
        install()
    else:
        from env_check import report
        code, lines = report(require_voice=True)
        print('\n'.join(lines)); raise SystemExit(code)
