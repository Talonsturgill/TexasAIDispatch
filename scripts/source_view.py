"""Prepare a recoverable source-cache view before production, preserving every live worktree."""
import argparse
import json
from pathlib import Path
import shutil
import subprocess

REMOTE = 'https://github.com/Talonsturgill/TexasAIDispatch'
PATTERNS = '/*\n!/runs/**/*.mp4\n'


def git(repo, *args, optional=False):
    result = subprocess.run(['git', '-C', str(repo), *args], capture_output=True, text=True)
    if result.returncode:
        if optional and result.returncode == 1:
            return ''
        raise ValueError('source-view Git operation failed: ' + args[0])
    return result.stdout.strip()


def sparse_file(repo):
    path = Path(git(repo, 'rev-parse', '--git-path', 'info/sparse-checkout'))
    return path if path.is_absolute() else repo / path


def prepare(workspace, *, apply=False):
    """Eligible only before a source clone acquires any production worktree or run."""
    workspace = Path(workspace).resolve(); repo = workspace / 'TexasAIDispatch'
    result = {'schema': 'dispatch_prelaunch_source_view/1', 'eligible': False,
              'applied': False, 'canonical_history_deleted': False, 'permissions_changed': False}
    def skip(reason):
        return {**result, 'reason': reason}
    if (repo.is_symlink() or not (repo / '.git').is_dir() or (repo / '.git').is_symlink()):
        return skip('no real primary source clone; preserve it')
    if any((repo / '.git' / name).is_symlink() for name in ('config', 'config.worktree', 'info')):
        return skip('source configuration has a symbolic link; preserve it')
    if git(repo, 'remote', 'get-url', 'origin').removesuffix('.git') != REMOTE:
        return skip('foreign repository; preserve it')
    if git(repo, 'status', '--porcelain', '--untracked-files=normal'):
        return skip('changed source clone; preserve it')
    trees = git(repo, 'worktree', 'list', '--porcelain').splitlines()
    if sum(line.startswith('worktree ') for line in trees) != 1:
        return skip('linked production or other worktree exists; preserve every view')
    if ((repo / 'out/dispatch').exists()
            or (workspace / '.claude/dispatch-production-continuation.json').exists()):
        return skip('production package or owner marker exists; preserve it')
    if git(repo, 'ls-files', '--others', '--', 'runs/'):
        return skip('untracked or ignored archive evidence exists; preserve it')
    if git(repo, 'config', '--local', '--get', 'core.worktree', optional=True):
        return skip('nonstandard shared worktree setting; preserve it')
    if git(repo, 'config', '--local', '--get', 'core.sparseCheckout', optional=True).lower() == 'true':
        return skip('shared sparse configuration already exists; preserve it')
    head = git(repo, 'rev-parse', 'HEAD')
    if git(repo, 'merge-base', head, 'origin/main') != head:
        return skip('source has unmerged commits; preserve it')
    pattern = sparse_file(repo)
    if any(p.is_symlink() for p in (pattern, *pattern.parents)):
        return skip('sparse view is a symbolic link; preserve it')
    before = {'head': head, 'branch': git(repo, 'symbolic-ref', '--short', '-q', 'HEAD', optional=True),
              'worktree_config': git(repo, 'config', '--local', '--get', 'extensions.worktreeConfig', optional=True),
              'sparse': git(repo, 'config', '--get', 'core.sparseCheckout', optional=True),
              'cone': git(repo, 'config', '--get', 'core.sparseCheckoutCone', optional=True),
              'patterns': pattern.read_text() if pattern.exists() else None}
    own_view = before['sparse'].lower() == 'true' and before['patterns'] == PATTERNS
    movies = [line for line in git(repo, 'ls-files', '-t', '--', 'runs/').splitlines()
              if line.endswith('.mp4')]
    if own_view and all(line.startswith('S ') for line in movies):
        return {**result, 'eligible': True, 'reason': 'already prepared', 'before': before}
    if not own_view and (before['sparse'].lower() == 'true' or pattern.exists()):
        return skip('another source view exists; preserve it')
    result.update(eligible=True, before=before)
    if not apply:
        return result
    available = shutil.disk_usage(repo).free
    git(repo, 'config', '--local', 'extensions.worktreeConfig', 'true')
    git(repo, 'config', '--worktree', 'core.sparseCheckout', 'true')
    git(repo, 'config', '--worktree', 'core.sparseCheckoutCone', 'false')
    pattern.parent.mkdir(parents=True, exist_ok=True); pattern.write_text(PATTERNS)
    git(repo, 'read-tree', '-mu', 'HEAD')
    if git(repo, 'status', '--porcelain') or git(repo, 'rev-parse', 'HEAD') != head:
        raise ValueError('source view did not preserve the original clean source HEAD')
    result.update(applied=True, free_bytes_before=available, free_bytes_after=shutil.disk_usage(repo).free)
    return result


def full_production_view(repo):
    """A new or restored edition must retain the full historical and renderer input view."""
    repo = Path(repo).resolve()
    if git(repo, 'config', '--get', 'core.sparseCheckout', optional=True).lower() != 'true':
        return False
    # Called on the newly created owned worktree, never on the primary source cache.
    if (repo / '.git').is_dir():
        raise ValueError('full production view requires an isolated linked worktree')
    if (git(repo, 'remote', 'get-url', 'origin').removesuffix('.git') != REMOTE
            or sparse_file(repo).read_text() != PATTERNS):
        raise ValueError('preserve a foreign production source view')
    git(repo, 'sparse-checkout', 'disable')
    return True


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    p = sub.add_parser('prepare'); p.add_argument('--workspace', type=Path, required=True)
    p.add_argument('--apply', action='store_true')
    p = sub.add_parser('full'); p.add_argument('--repo', type=Path, required=True)
    args = parser.parse_args()
    if args.command == 'prepare':
        result = prepare(args.workspace, apply=args.apply)
    else:
        result = {'full_production_view_restored': full_production_view(args.repo)}
    print(json.dumps(result))


if __name__ == '__main__':
    main()
