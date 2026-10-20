"""Recompress an owned edition store, retaining unreachable objects and peer checkouts."""
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


def store_scope(repo, state_path, state, common, layout):
    paths = {Path(row[9:].decode()).resolve() for row in layout.split(b'\0')
             if row.startswith(b'worktree ')}
    if paths == {repo} and common == repo / '.git' and (repo / '.git').is_dir():
        return 'isolated-edition-clone', paths
    # claude_checkpoint.restore creates a linked worktree, not a standalone clone.
    # Admit only that selected production tree plus its primary source checkout.
    # A third checkout, borrowed objects or an unregistered selection stay refused.
    if (paths != {repo, common.parent} or not (repo / '.git').is_file()
            or not (common.parent / '.git').is_dir()):
        raise ValueError('preserve shared Git storage outside the selected edition and primary checkout')
    from routine_continuation import MARKER, SCHEMA, read, registered_workspace
    try:
        primary = registered_workspace(repo, state_path)
        marker = read(primary / MARKER)
        selected = Path(marker['state']).resolve()
        if (marker.get('schema') != SCHEMA or marker.get('run_id') != state['run_id']
                or selected != state_path or not all(path.is_relative_to(primary) for path in paths)):
            raise ValueError('the selected production continuation differs')
    except (OSError, ValueError, KeyError, TypeError) as exc:
        raise ValueError('shared Git compaction needs the actual registered selected production: ' + str(exc)) from exc
    return 'registered-edition-worktree', paths


def worktree_state(paths):
    return {str(path): git(path, 'status', '--porcelain=v1', '-z', '--untracked-files=all')
            for path in sorted(paths)}


def compact(repo, apply=False):
    repo = Path(repo)
    if (repo.is_symlink() or (repo / '.git').is_symlink()
            or not ((repo / '.git').is_dir() or (repo / '.git').is_file())):
        raise ValueError('compact only the real selected edition checkout; preserve shared worktrees')
    repo = repo.resolve()
    common = Path(git(repo, 'rev-parse', '--git-common-dir').decode().strip())
    common = repo / common
    if common.is_symlink() or (common / 'objects/info/alternates').exists():
        raise ValueError('preserve shared or borrowed Git object storage')
    common = common.resolve()
    if any(common.rglob('*.lock')) or (common / 'gc.pid').exists():
        raise ValueError('another Git operation is active; wait for its actual lock to clear')
    state_path = repo / 'out/dispatch/run_state.json'
    if not state_path.is_file():
        raise ValueError('select the unfinished production ledger before compacting shared Git storage')
    state_bytes = state_path.read_bytes()
    state = json.loads(state_bytes)
    if state.get('mode') != 'production' or state.get('terminal_state') is not None:
        raise ValueError('compact only the selected unfinished production edition')
    layout = git(repo, 'worktree', 'list', '--porcelain', '-z')
    scope, paths = store_scope(repo, state_path, state, common, layout)
    from publication_owner import require_owner
    require_owner(state_path, state)
    original = objects(repo)
    refs = git(repo, 'show-ref', '--head')
    index_and_work = worktree_state(paths)
    free_before = shutil.disk_usage(repo).free
    if apply:
        # Official Git: --keep-unreachable preserves packed AND loose unreachable objects.
        # https://git-scm.com/docs/git-repack#Documentation/git-repack.txt---keep-unreachable
        git(repo, '-c', 'pack.threads=1', 'repack', '-a', '-d', '--keep-unreachable')
        if (not original.issubset(objects(repo)) or refs != git(repo, 'show-ref', '--head')
                or layout != git(repo, 'worktree', 'list', '--porcelain', '-z')
                or index_and_work != worktree_state(paths)
                or state_bytes != state_path.read_bytes()):
            raise ValueError('post-compaction object/ref/workspace proof changed; preserve all evidence and inspect concurrent activity')
    free_after = shutil.disk_usage(repo).free
    return {'schema': 'dispatch_owned_git_compaction/1', 'ok': True, 'applied': apply,
            'run_id': state['run_id'], 'object_count_preserved': len(original),
            'store_scope': scope, 'worktree_count_preserved': len(paths),
            'worktree_layout_sha256': hashlib.sha256(layout).hexdigest(),
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
