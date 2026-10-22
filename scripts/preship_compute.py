"""Fixed native preship operator; preserve the original mechanical verdict and logs."""
import hashlib
import json
import os
from pathlib import Path
import subprocess

NOTE = 'exact-film mechanical preship probes'
PACKAGE = 'out/dispatch/preship-compute'


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def current_inputs(repo, state):
    repo = Path(repo).resolve()
    package = repo/'out/dispatch'
    film, board = package/'film.mp4', package/'storyboard.json'
    deliverable = state.get('deliverable') or {}
    if (state.get('terminal_state') or deliverable.get('review_only') is not False
            or deliverable.get('film_sha256') != digest(film)
            or deliverable.get('board_sha256') != digest(board)):
        raise ValueError('preship probes require the current registered exact native film and board')
    return {'film_sha256':digest(film),'board_sha256':digest(board)}


def run(repo):
    import capture_reservation
    repo = Path(repo).resolve(); state_path = repo/'out/dispatch/run_state.json'
    bound = current_inputs(repo,read(state_path))
    identity = capture_reservation.input_identity(state_path,NOTE)
    output = repo/PACKAGE
    if output.exists():
        raise ValueError('preship compute evidence already exists; retain it before a changed attempt')
    accepted, reason = capture_reservation.claim(state_path,NOTE)
    if not accepted:
        raise ValueError(reason)
    output.mkdir(parents=True)
    verdict = repo/'out/gates/preship.json'
    # A stale local verdict cannot survive a failed operator or interruption.
    verdict.unlink(missing_ok=True)
    try:
        result = subprocess.run(['bash','scripts/run_with_env.sh','python','scripts/preship_check.py',
                                 '--board','out/dispatch/storyboard.json'],cwd=repo,
                                capture_output=True,timeout=3600)
    except subprocess.TimeoutExpired as exc:
        result = subprocess.CompletedProcess(exc.cmd,124,exc.stdout or b'',exc.stderr or b'')
    (output/'stdout.txt').write_bytes(result.stdout)
    (output/'stderr.txt').write_bytes(result.stderr)
    receipt = {'schema':'dispatch_remote_preship/1','exit_code':result.returncode,
               **bound,'input_identity':identity,'approval':False}
    (output/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
    if current_inputs(repo,read(state_path)) != bound or capture_reservation.input_identity(state_path,NOTE) != identity:
        raise ValueError('locked preship inputs changed during mechanical checks')
    if result.returncode == 0:
        raw = verdict.read_bytes()
        if json.loads(raw).get('board_sha256') != bound['board_sha256']:
            raise ValueError('original preship verdict belongs to another board')
        (output/'preship.json').write_bytes(raw)
        receipt['verdict_sha256'] = hashlib.sha256(raw).hexdigest()
    (output/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
    return result.returncode


def import_verdict(repo, result, request):
    """Called only after verified monotonic checkpoint import; never fabricate a pass."""
    import capture_reservation
    repo = Path(repo).resolve(); package = repo/PACKAGE
    receipt = read(package/'receipt.json')
    state_path = repo/'out/dispatch/run_state.json'
    current = current_inputs(repo,read(state_path))
    if (result.get('operation') != 'preship' or request.get('operation') != 'preship'
            or result.get('exit_code') != 0 or receipt.get('exit_code') != 0
            or receipt.get('schema') != 'dispatch_remote_preship/1'
            or any(receipt.get(k) != v for k,v in current.items())
            or receipt.get('input_identity') != capture_reservation.input_identity(state_path,NOTE)
            or digest(package/'preship.json') != receipt.get('verdict_sha256')):
        raise ValueError('remote preship verdict lacks the current exact film/input binding')
    raw = (package/'preship.json').read_bytes()
    if json.loads(raw).get('board_sha256') != current['board_sha256']:
        raise ValueError('original remote preship verdict board differs')
    target = repo/'out/gates/preship.json'
    if any(p.is_symlink() for p in (target,*target.parents)):
        raise ValueError('preship verdict import cannot follow symbolic links')
    target.parent.mkdir(parents=True,exist_ok=True)
    temporary = target.with_suffix('.import.tmp')
    temporary.write_bytes(raw); os.replace(temporary,target)


if __name__ == '__main__':
    raise SystemExit(run(Path(__file__).resolve().parents[1]))
