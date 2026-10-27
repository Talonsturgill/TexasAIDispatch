"""Run the CI suites a change can reach, in CI's environment, and say which failures are new.

THE FAILURE IT EXISTS FOR. On October 26th and 27th each tooling PR needed two or three 13 minute
CI cycles to find tests the author could have run: a suite that still assumed the old review cap,
a wiring check that flagged a new helper, a count that the live config no longer matched. Locally
the same suites looked broken for a reason that had nothing to do with the change (a cloud
workspace variable and missing packages), so the signal was thrown away and CI became the only test.

WHAT IT DOES. It lists the files that differ from origin/main, picks every *_test.py that is
itself changed or names a changed module, runs each with CLAUDE_CODE_REMOTE unset (as CI does),
and runs the same suite on a clean checkout of origin/main. A failure counts as NEW only when the
clean checkout has fewer failures and errors than the change. Exit 0 means no new failure.
It buys nothing and charges nothing.
"""
import argparse
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
COUNT = re.compile(r'(failures|errors)=(\d+)')


def git(*args, cwd=REPO):
    return subprocess.run(['git', *args], cwd=cwd, check=True, capture_output=True, text=True).stdout


def changed(base):
    names = git('diff', '--name-only', base).split() + git('ls-files', '--others', '--exclude-standard').split()
    return sorted({n for n in names if (REPO / n).exists()})


def reach(files):
    """Every suite that is changed or whose text names a changed module."""
    modules = {Path(f).stem for f in files if f.startswith('scripts/') and f.endswith('.py')
               and not f.endswith('_test.py')}
    configs = {Path(f).name for f in files if f.startswith('config/')}
    tests = []
    for test in sorted((REPO / 'scripts').glob('*_test.py')):
        text = test.read_text(errors='ignore')
        rel = test.relative_to(REPO).as_posix()
        if (rel in files or any(re.search(r'\b' + re.escape(m) + r'\b', text) for m in modules)
                or any(c in text for c in configs)):
            tests.append(rel)
    return tests


def run(root, test):
    env = {k: v for k, v in os.environ.items() if k != 'CLAUDE_CODE_REMOTE'}
    launcher = ['bash', 'scripts/run_with_env.sh', 'python'] if (root / 'scripts/run_with_env.sh').exists() else [sys.executable]
    done = subprocess.run([*launcher, test], cwd=root, env=env, capture_output=True, text=True, timeout=900)
    tail = (done.stdout + done.stderr).strip().splitlines()[-1:] or ['']
    counts = dict((k, int(v)) for k, v in COUNT.findall(tail[0]))
    return {'ok': done.returncode == 0, 'bad': sum(counts.values()) or (0 if done.returncode == 0 else 1),
            'tail': tail[0]}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('--base', default='origin/main')
    parser.add_argument('--list', action='store_true', help='only name the suites a change reaches')
    args = parser.parse_args(argv)
    files = changed(args.base)
    tests = reach(files)
    print('changed files:', len(files), ' reachable suites:', len(tests))
    if args.list:
        print('\n'.join(tests))
        return 0
    new = []
    with tempfile.TemporaryDirectory(prefix='ci-preview-') as tmp:
        clean = Path(tmp) / 'base'
        git('worktree', 'add', '--detach', str(clean), args.base)
        try:
            for test in tests:
                mine = run(REPO, test)
                if mine['ok']:
                    print('ok     ', test)
                    continue
                theirs = run(clean, test)
                verdict = 'NEW    ' if mine['bad'] > theirs['bad'] else 'same   '
                print(verdict, test, '|', mine['tail'], '| main:', theirs['tail'])
                if verdict.startswith('NEW'):
                    new.append(test)
        finally:
            subprocess.run(['git', 'worktree', 'remove', '--force', str(clean)], cwd=REPO, check=False,
                           capture_output=True)
    print('new failures:', len(new))
    return 1 if new else 0


if __name__ == '__main__':
    raise SystemExit(main())
