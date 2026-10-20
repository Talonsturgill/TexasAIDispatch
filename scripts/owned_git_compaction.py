"""Recompress only an isolated edition's Git objects, retaining unreachable objects too."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import shutil
import subprocess


def git(repo, *args):
    done = subprocess.run(['git', '-C', str(repo), *args], capture_output=True, timeout=300)
    if done.returncode:
        raise ValueError('owned Git compaction failed at ' + args[0] + ': ' + done.stderr.decode(errors='replace')[-2000:])
    return done.stdout


def objects(repo):
    return set(git(repo, 'cat-file', '--batch-all-objects', '--batch-check=%(objectname)').splitlines())


def compact(repo, apply=False):
    repo = Path(repo)
    if repo.is_symlink() or not (repo / '.git').is_dir() or (repo / '.git').is_symlink():
        raise ValueError('compact only the real isolated edition clone; preserve shared worktrees')
    repo = repo.resolve()
    common = Path(git(repo, 'rev-parse', '--git-common-dir').decode().strip())
    common = (repo / common).resolve()
    if common != repo / '.git' or (common / 'objects/info/alternates').exists():
        raise ValueError('preserve shared or borrowed Git object storage')
    if len(git(repo, 'worktree', 'list', '--porcelain').split(b'worktree ')) != 2:
        raise ValueError('preserve Git storage shared by another checkout')
    if any(common.rglob('*.lock')) or (common / 'gc.pid').exists():
        raise ValueError('another Git operation is active; wait for its actual lock to clear')
    state_path = repo / 'out/dispatch/run_state.json'
    state_bytes = state_path.read_bytes()
    state = json.loads(state_bytes)
    if state.get('mode') != 'production' or state.get('terminal_state') is not None:
        raise ValueError('compact only the selected unfinished production edition')
    from publication_owner import require_owner
    require_owner(state_path, state)
    original = objects(repo)
    refs = git(repo, 'show-ref', '--head')
    index_and_work = git(repo, 'status', '--porcelain=v1', '--untracked-files=all')
    free_before = shutil.disk_usage(repo).free
    if apply:
        # Official Git: --keep-unreachable preserves packed AND loose unreachable objects.
        # https://git-scm.com/docs/git-repack#Documentation/git-repack.txt---keep-unreachable
        git(repo, '-c', 'pack.threads=1', 'repack', '-a', '-d', '--keep-unreachable')
        if (not original.issubset(objects(repo)) or refs != git(repo, 'show-ref', '--head')
                or index_and_work != git(repo, 'status', '--porcelain=v1', '--untracked-files=all')
                or state_bytes != state_path.read_bytes()):
            raise ValueError('post-compaction object/ref/workspace proof changed; preserve all evidence and inspect concurrent activity')
    free_after = shutil.disk_usage(repo).free
    return {'schema': 'dispatch_owned_git_compaction/1', 'ok': True, 'applied': apply,
            'run_id': state['run_id'], 'object_count_preserved': len(original),
            'object_set_sha256': hashlib.sha256(b'\n'.join(sorted(original))).hexdigest(),
            'refs_sha256': hashlib.sha256(refs).hexdigest(),
            'ledger_sha256': hashlib.sha256(state_bytes).hexdigest(),
            'free_bytes_before': free_before, 'free_bytes_after': free_after,
            'observed_free_delta_bytes': free_after - free_before,
            'quality_or_release_approval': False,
            'next': 'Recompute native_headroom.py and rerun housekeeping with the full unchanged required_free_gib.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    boundary = (args.repo.resolve() / 'out/dispatch').resolve()
    if not boundary.is_relative_to(args.repo.resolve()) or not args.out.resolve().is_relative_to(boundary):
        parser.error('retain the compaction receipt inside this edition scratch directory')
    if args.out.exists() or args.out.is_symlink():
        parser.error('preserve the existing receipt; choose a fresh output path')
    args.out.parent.mkdir(parents=True, exist_ok=True)
    try:
        result = compact(args.repo, args.apply)
    except (OSError, ValueError, subprocess.TimeoutExpired) as exc:
        with args.out.open('x') as stream:
            json.dump({'schema': 'dispatch_owned_git_compaction/1', 'ok': False,
                       'apply_requested': args.apply, 'error': str(exc),
                       'recorded_at': datetime.now(timezone.utc).isoformat()}, stream, indent=2)
        raise
    result['recorded_at'] = datetime.now(timezone.utc).isoformat()
    with args.out.open('x') as stream:
        json.dump(result, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
