"""Read-only checkpoint catalog; the retained checkpoint codec stays unchanged."""
import argparse
from contextlib import contextmanager
import json
from pathlib import Path
import sys
from uuid import uuid4

import claude_checkpoint as checkpoint


@contextmanager
def fetched_snapshot(repo, remote, ref):
    """Hold one fetched commit independently of every other caller's FETCH_HEAD."""
    private = 'refs/dispatch-discovery/' + uuid4().hex
    commit = None
    try:
        checkpoint.git(repo, 'fetch', '--quiet', '--no-tags', '--no-write-fetch-head',
                       remote, ref + ':' + private)
        commit = checkpoint.git(repo, 'rev-parse', private + '^{commit}').stdout.decode().strip()
        yield commit
    finally:
        held = checkpoint.git(repo, 'rev-parse', '--verify', '--quiet', private, check=False)
        if held.returncode == 0:
            actual = held.stdout.decode().strip()
            if commit is not None and actual != commit:
                raise checkpoint.CheckpointError('catalog snapshot ref changed; preserve it: ' + private)
            checkpoint.git(repo, 'update-ref', '-d', private, actual)


def discover(repo=checkpoint.REPO, remote='origin'):
    repo = Path(repo)
    listed = checkpoint.git(repo, 'ls-remote', '--heads', remote,
                            'refs/heads/' + checkpoint.BRANCH + '*')
    found = []
    import publication_owner
    import failed_editions
    ownership = publication_owner.read_remote(repo) if remote == 'origin' else {}
    for line in listed.stdout.decode().splitlines():
        _, ref = line.split('\t')
        run_id = ref[len('refs/heads/' + checkpoint.BRANCH):]
        if not checkpoint.RUN_ID.fullmatch(run_id):
            continue
        with fetched_snapshot(repo, remote, ref) as commit:
            manifest = json.loads(checkpoint.show(repo, commit,
                                                  f'{checkpoint.ROOT}/{run_id}/manifest.json'))
            if (not isinstance(manifest, dict) or manifest.get('schema') != checkpoint.SCHEMA
                    or manifest.get('run_id') != run_id):
                raise checkpoint.CheckpointError('catalog manifest belongs to another run or schema')
            done = manifest.get('terminal_state') == 'shipped' and manifest.get('shipment_recorded')
            failed = (not done and run_id[:10] >= failed_editions.EFFECTIVE and bool(
                failed_editions.verified(repo, run_id, ownership or {}, checkpoint_commit=commit)))
            found.append({'run_id': run_id, 'commit': commit, 'saved_at': manifest['saved_at'],
                          'phase': manifest['phase'], 'created_at': manifest.get('created_at'),
                          'source_pin': manifest.get('source_pin'), 'files': len(manifest['files']),
                          'finished': bool(done), 'failed_retained': failed, 'usage': manifest.get('usage')})
    return sorted(found, key=lambda row: row['saved_at'], reverse=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, default=checkpoint.REPO)
    parser.add_argument('--remote', default='origin')
    parser.add_argument('--oldest-unfinished', action='store_true')
    args = parser.parse_args()
    try:
        found = discover(args.repo, args.remote)
        print(json.dumps(checkpoint.oldest_unfinished(found) if args.oldest_unfinished else found,
                         indent=2))
    except (checkpoint.CheckpointError, OSError, ValueError, KeyError) as exc:
        print('checkpoint discovery: ' + str(exc), file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
