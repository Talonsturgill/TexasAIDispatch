"""Finite compute delegation for one prepaid native capture. Never a publisher or reviewer."""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import shlex
import shutil
import subprocess
import tempfile

import claude_checkpoint as ck

REPOSITORY = 'Talonsturgill/TexasAIDispatch'
REQUEST_FILE = 'capture-request.json'
SCHEMA = 'dispatch_github_capture_request/1'
OPS = {
    'preflight': ('quarter-scale animatic', 'preflight_renders',
                  ['python', 'scripts/preflight_animatic.py', '--board', 'out/dispatch/storyboard.json',
                   '--state', 'out/dispatch/run_state.json']),
    'cinema': ('finished cinematic hero and stage ablation batch', 'preflight_renders',
               ['python', 'scripts/cinema_proof.py', '--board', 'out/dispatch/storyboard.json',
                '--mix', 'out/dispatch/mix.wav', '--state', 'out/dispatch/run_state.json']),
    'full': ('full-resolution Dispatch render', 'full_renders',
             ['bash', 'scripts/render_dispatch.sh']),
    'phone-motion': ('exact-phone-current motion-image review extraction', 'preflight_renders',
             ['python', 'scripts/claude_motion_review.py', '--phone-option', 'current',
              '--board', 'out/dispatch/storyboard.json', '--film', 'out/dispatch/preflight.mp4',
              '--out', 'out/dispatch/phone-motion-current', '--state', 'out/dispatch/run_state.json']),
    'full-motion': ('exact-film motion-image review extraction', 'preflight_renders',
             ['python', 'scripts/claude_motion_review.py', '--board', 'out/dispatch/storyboard.json',
              '--film', 'out/dispatch/film.mp4', '--out', 'out/dispatch/motion-review',
              '--state', 'out/dispatch/run_state.json'])}


def read(path):
    return json.loads(Path(path).read_text())


def digest(value):
    return hashlib.sha256(value if isinstance(value, bytes) else Path(value).read_bytes()).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':')).encode()


def request_at(repo, oid):
    if not re.fullmatch('[0-9a-f]{40}', oid):
        raise ValueError('capture request must be an immutable commit SHA')
    ck.git(repo, 'fetch', '--quiet', '--no-tags', 'origin', oid)
    raw = ck.show(repo, oid, REQUEST_FILE)
    return json.loads(raw), digest(raw)


def context_problems(request, env):
    expected = {'GITHUB_ACTIONS': 'true', 'GITHUB_REPOSITORY': REPOSITORY,
                'GITHUB_JOB': 'capture', 'GITHUB_EVENT_NAME': 'workflow_dispatch',
                'GITHUB_RUN_ATTEMPT': '1', 'GITHUB_SHA': request['source_commit'],
                'GITHUB_WORKFLOW_SHA': request['source_commit'],
                'GITHUB_ACTOR': request['github_actor'], 'GITHUB_TRIGGERING_ACTOR': request['github_actor']}
    errors = [key+' differs from delegated GitHub identity' for key, value in expected.items() if env.get(key) != value]
    if not re.fullmatch(r'\d+', env.get('GITHUB_RUN_ID', '')):
        errors.append('actual GitHub run ID is required')
    if not env.get('GITHUB_WORKFLOW_REF', '').startswith(REPOSITORY+'/.github/workflows/guards.yml@refs/heads/'):
        errors.append('delegation requires the exact guards workflow')
    if request.get('schema') != SCHEMA or request.get('operation') not in OPS:
        errors.append('unknown finite delegated operation')
    if request.get('repository') != REPOSITORY:
        errors.append('request repository differs')
    return errors


def prepaid(state, operation, event_sha):
    import capture_guard
    note, resource, _ = OPS[operation]
    matches = [e for e in state['events'] if capture_guard.event_digest(e) == event_sha]
    if (len(matches) != 1 or matches[0].get('kind') != 'reserved'
            or matches[0].get('note') != note or matches[0].get('resources') != {resource: 1}
            or any(e.get('kind') == 'prepared_capture_claimed' and e.get('event_sha256') == event_sha
                   for e in state['events'])):
        raise ValueError('delegated capture needs one original unused prepaid render event')
    return matches[0]


def commit_record(repo, file, data, message, parent=None):
    blob = ck.git(repo, 'hash-object', '-w', '--stdin', data=canonical(data)).stdout.decode().strip()
    tree = ck.git(repo, 'mktree', data=f'100644 blob {blob}\t{file}\n'.encode()).stdout.decode().strip()
    args = ['commit-tree', tree, '-m', message]
    if parent:
        args += ['-p', parent]
    return ck.git(repo, *args, env={'GIT_AUTHOR_NAME': 'Talon Sturgill',
        'GIT_AUTHOR_EMAIL': 'Talon.sturgill@gmail.com', 'GIT_COMMITTER_NAME': 'Talon Sturgill',
        'GIT_COMMITTER_EMAIL': 'Talon.sturgill@gmail.com'}).stdout.decode().strip()


def claim_once(repo, ref, commit):
    # Git's empty expected old value is an atomic create-if-absent, not an overwrite.
    # Also refuse an identical ref explicitly: Git treats a same-OID push as a
    # successful no-op even when the lease's expected old value is empty.
    if ck.git(repo, 'ls-remote', '--heads', 'origin', ref).stdout.strip():
        raise ValueError('single-use capture request or render reservation was already claimed')
    ck.git(repo, 'push', '--quiet', '--force-with-lease='+ref+':', 'origin', commit+':'+ref)


def operation_precheck(repo, operation, state):
    """Use the original extractor admission before shipping or consuming a claim."""
    if operation not in ('phone-motion', 'full-motion'):
        return
    import capture_reservation
    repo = Path(repo).resolve()
    argv = OPS[operation][2]
    capture_reservation.motion_output_precheck(argv, repo, repo/'out/dispatch')
    board = repo/'out/dispatch/storyboard.json'
    if operation == 'phone-motion':
        from claude_motion_review import phone_inputs
        phone_inputs(repo/'out/dispatch/run_state.json', 'current', board, repo/'out/dispatch/preflight.mp4')
    else:
        deliverable = state.get('deliverable') or {}
        if (deliverable.get('review_only') is not False
                or deliverable.get('film_sha256') != digest(repo/'out/dispatch/film.mp4')
                or deliverable.get('board_sha256') != digest(board)):
            raise ValueError('full motion extraction requires the current registered exact native film')


def create(repo, source_repo, operation, out):
    import publication_owner
    import capture_guard
    repo, source_repo = Path(repo).resolve(), Path(source_repo).resolve()
    state_path = repo/'out/dispatch/run_state.json'
    owner = publication_owner.require_owner(state_path)
    if not owner or owner.get('runtime') != 'codex':
        raise ValueError('only the existing actual Codex publisher may delegate compute')
    state = read(state_path)
    operation_precheck(repo, operation, state)
    note, resource, _ = OPS[operation]
    events = [e for e in state['events'] if e.get('kind') == 'reserved' and e.get('note') == note
              and e.get('resources') == {resource: 1}]
    if not events:
        raise ValueError('reserve the exact native operation in the original controller first')
    event_sha = capture_guard.event_digest(events[-1]); prepaid(state, operation, event_sha)
    if (events[-1].get('publication_owner_sha256') != owner['owner_sha256']
            or events[-1].get('publication_epoch') != owner['epoch']):
        raise ValueError('the render charge must belong to the current original owner epoch')
    tip = ck.remote_tip(repo, state['run_id'], 'origin')
    manifest, raw = ck.verify_checkpoint(repo, tip, state['run_id'])
    if json.loads(raw) != ck.public_ledger(state, repo):
        raise ValueError('original charged ledger must be checkpointed unchanged before delegation')
    source = ck.git(source_repo, 'rev-parse', 'HEAD').stdout.decode().strip()
    ck.git(source_repo, 'cat-file', '-e', source+':scripts/github_capture.py')
    if ck.git(source_repo, 'diff', '--quiet', 'HEAD', '--', 'scripts', '.github/workflows/guards.yml', check=False).returncode:
        raise ValueError('commit the tested capture helpers and workflow before creating an immutable request')
    for relative in ck.git(source_repo, 'ls-tree', '-r', '--name-only', source, '--', 'scripts').stdout.decode().splitlines():
        target = repo/relative
        if not target.is_file() or digest(target) != digest(ck.show(source_repo, source, relative)):
            raise ValueError('episode helper differs from immutable workflow source: '+relative)
    # Fail on changed native inputs locally, before the remote one-use claim.
    code = ('from pathlib import Path; import sys, capture_reservation; '
            'print(capture_reservation.input_identity(Path(sys.argv[1]),sys.argv[2]))')
    actual = subprocess.check_output(['bash', 'scripts/run_with_env.sh', 'python', '-c', code,
                                     str(state_path), note], cwd=repo, text=True).strip()
    field = 'full_render_identity' if operation == 'full' else 'preflight_identity'
    if events[-1].get(field) != actual:
        raise ValueError('original prepaid render input identity is no longer current')
    # Actual authenticated dispatch account, never an owner name typed into a request.
    actor = subprocess.check_output(['gh', 'api', 'user', '--jq', '.login'], text=True).strip()
    request = {'schema': SCHEMA, 'repository': REPOSITORY, 'run_id': state['run_id'],
        'owner_sha256': owner['owner_sha256'], 'epoch': owner['epoch'], 'github_actor': actor,
        'checkpoint_oid': tip, 'ledger_sha256': manifest['ledger_sha256'], 'source_commit': source,
        'operation': operation, 'reservation_event_sha256': event_sha,
        'approval': False, 'publication_allowed': False}
    oid = commit_record(source_repo, REQUEST_FILE, request, 'Delegate one prepaid native capture', source)
    ref = 'refs/heads/codex/capture-requests/'+oid
    claim_once(source_repo, ref, oid)
    Path(out).write_text(json.dumps({'request_oid': oid, 'request_sha256': digest(canonical(request)),
        'request_ref': ref, 'request': request}, indent=2)+'\n')
    return read(out)


def require_delegate(state_path, state=None):
    """Validate original ownership on every controller write; never impersonate Codex."""
    import publication_owner
    state_path = Path(state_path).resolve(); repo = state_path.parents[2]
    activation = read(os.environ['DISPATCH_GITHUB_CAPTURE_REQUEST'])
    request, hashed = request_at(repo, activation['request_oid'])
    errors = context_problems(request, os.environ)
    if hashed != activation['request_sha256'] or os.environ.get('GITHUB_RUN_ID') != activation['github_run_id']:
        errors.append('immutable request or actual runner activation changed')
    claim_ref = 'refs/heads/codex/capture-claims/'+request['run_id']+'/'+request['reservation_event_sha256']
    listed = ck.git(repo, 'ls-remote', '--heads', 'origin', claim_ref).stdout.decode().split()
    if not listed or listed[0] != activation['claim_commit']:
        errors.append('single-use render claim is missing or changed')
    else:
        ck.git(repo, 'fetch', '--quiet', '--no-tags', 'origin', claim_ref)
        claim = json.loads(ck.show(repo, listed[0], 'claim.json'))
        expected_claim = {'request_oid': activation['request_oid'], 'request_sha256': hashed,
                          'github_run_id': os.environ['GITHUB_RUN_ID'],
                          'github_actor': os.environ['GITHUB_ACTOR']}
        if claim != expected_claim:
            errors.append('actual runner identity does not own this single-use claim')
    owner = publication_owner.read_remote(repo)
    if (not owner or owner.get('runtime') != 'codex' or owner['status'] != 'held'
            or any(owner.get(k) != request[k] for k in ('run_id', 'owner_sha256', 'epoch'))
            or publication_owner.instant(owner['expires_at']) <= publication_owner.now()):
        errors.append('original publisher lease or epoch is no longer held')
    current = state or read(state_path)
    manifest, raw = ck.verify_checkpoint(repo, request['checkpoint_oid'], request['run_id'])
    baseline = json.loads(raw); projected = ck.public_ledger(current, repo)
    errors += ck.monotonic_problems(baseline, projected)
    if current.get('usage') != baseline.get('usage') or current.get('terminal_state'):
        errors.append('compute delegation permits no extra charges or terminal publication')
    if errors:
        raise ValueError('delegated capture refused: '+'; '.join(errors))
    return owner


def stage(repo, request_oid, expected_sha, destination):
    repo, destination = Path(repo).resolve(), Path(destination).resolve()
    request, hashed = request_at(repo, request_oid)
    if hashed != expected_sha:
        raise ValueError('request bytes differ from workflow dispatch')
    errors = context_problems(request, os.environ)
    if errors:
        raise ValueError('; '.join(errors))
    if ck.remote_tip(repo, request['run_id'], 'origin') != request['checkpoint_oid']:
        raise ValueError('checkpoint advanced before the single-use capture claim; create a fresh request')
    manifest, raw = ck.verify_checkpoint(repo, request['checkpoint_oid'], request['run_id'])
    if manifest['ledger_sha256'] != request['ledger_sha256']:
        raise ValueError('checkpoint ledger hash differs from request')
    prepaid(json.loads(raw), request['operation'], request['reservation_event_sha256'])
    import publication_owner
    owner = publication_owner.read_remote(repo)
    if (not owner or owner.get('runtime') != 'codex' or owner.get('status') != 'held'
            or any(owner.get(k) != request[k] for k in ('run_id', 'owner_sha256', 'epoch'))
            or publication_owner.instant(owner['expires_at']) <= publication_owner.now()):
        raise ValueError('original Codex owner must remain live throughout capture')
    claim = {'request_oid': request_oid, 'request_sha256': hashed,
             'github_run_id': os.environ['GITHUB_RUN_ID'], 'github_actor': os.environ['GITHUB_ACTOR']}
    commit = commit_record(repo, 'claim.json', claim, 'Claim one delegated render')
    claim_once(repo, 'refs/heads/codex/capture-claims/'+request['run_id']+'/'+request['reservation_event_sha256'], commit)
    ck.restore(repo, request['run_id'], dest=destination)
    # The immutable request source supplies current gate helpers, while restore keeps
    # the recorded renderer/art/source closure and every original checkpoint byte.
    shutil.copytree(repo/'scripts', destination/'scripts', dirs_exist_ok=True)
    activation = destination/'out/dispatch/github-capture-activation.json'
    activation.write_text(json.dumps({**claim, 'claim_commit': commit}, indent=2)+'\n')
    return {'destination': str(destination), 'activation': str(activation), 'request': request}


def run(repo):
    repo = Path(repo).resolve(); state_path = repo/'out/dispatch/run_state.json'
    owner = require_delegate(state_path)
    activation = read(os.environ['DISPATCH_GITHUB_CAPTURE_REQUEST'])
    request, _ = request_at(repo, activation['request_oid'])
    note, resource, argv = OPS[request['operation']]
    import capture_guard
    import capture_reservation
    catalog = repo/'assets/sfx/catalog.json'
    if catalog.is_file() and any(not (repo/row['wav']).is_file() for row in read(catalog)):
        subprocess.run(['bash','scripts/run_with_env.sh','python','scripts/foley.py',
                        '--build','assets/sfx'],cwd=repo,check=True)
    state = read(state_path); event = prepaid(state, request['operation'], request['reservation_event_sha256'])
    operation_precheck(repo, request['operation'], state)
    # These existing gates compute complete native-frame storage and perform the real
    # portable housekeeping check on this runner before authorization or capture.
    command = 'bash scripts/run_with_env.sh '+shlex.join(argv)
    subprocess.run(['bash', 'scripts/run_with_env.sh', 'python', 'scripts/native_headroom.py',
                    '--board', 'out/dispatch/storyboard.json', '--out',
                    'out/dispatch/github-native-headroom.json'], cwd=repo, check=True)
    auth = capture_guard.authorize(repo, state_path, [repo/'out/dispatch/storyboard.json'],
                                   [command], resource=resource, housekeeping=True)
    if auth['render_reservation']['event_sha256'] != request['reservation_event_sha256']:
        raise ValueError('runner authorization selected another render charge')
    field = 'full_render_identity' if request['operation'] == 'full' else 'preflight_identity'
    identity = capture_reservation.input_identity(state_path, note)
    if event.get(field) != identity:
        raise ValueError('restored render inputs differ from the original charged identity')
    auth['prepared_capture'] = {'schema': 'dispatch_prepared_capture/1', 'operation': note,
        'resource': resource, 'run_id': state['run_id'], 'event_sha256': request['reservation_event_sha256'],
        'input_identity': identity}
    capture_guard.atomic_json(repo/capture_guard.AUTHORIZATION, auth)
    errors = capture_guard.capture_problems(command, auth, repo, repo)
    if errors or not capture_guard.consume(repo, command):
        raise ValueError('finite capture authorization refused: '+'; '.join(errors))
    try:
        result = subprocess.run(['bash', 'scripts/run_with_env.sh', *argv], cwd=repo, timeout=5400)
        exit_code = result.returncode
    except subprocess.TimeoutExpired:
        exit_code = 124  # Preserve actual partial outputs and the original charge.
    receipt = {'schema': 'dispatch_github_capture_result/1', 'request_oid': activation['request_oid'],
               'request_sha256': activation['request_sha256'], 'owner_sha256': owner['owner_sha256'],
               'epoch': owner['epoch'], 'github_run_id': os.environ['GITHUB_RUN_ID'],
               'source_commit': request['source_commit'],
               'operation': request['operation'], 'exit_code': exit_code,
               'approval': False, 'publication_allowed': False}
    (repo/'out/dispatch/github-capture-result.json').write_text(json.dumps(receipt, indent=2)+'\n')
    saved = ck.save_with_recovery(repo, state_path, 'delegated GitHub native capture result')
    receipt['checkpoint_oid'] = saved['commit']
    output = repo/'out/github-capture-public-result.json'
    output.write_text(json.dumps(receipt, indent=2)+'\n')
    return receipt


def import_result(repo, checkpoint_oid):
    """Import verified monotonic capture results without replacing source or history."""
    import publication_owner
    repo = Path(repo).resolve(); path = repo/'out/dispatch/run_state.json'
    owner = publication_owner.require_owner(path)
    state = read(path)
    if ck.remote_tip(repo, state['run_id'], 'origin') != checkpoint_oid:
        raise ValueError('import requires the current original checkpoint branch tip')
    ck.git(repo, 'fetch', '--quiet', '--no-tags', 'origin', checkpoint_oid)
    base = f'checkpoints/{state["run_id"]}'
    # Shared verifier streams every immutable blob in one bounded Git batch.
    manifest, raw = ck.verify_checkpoint(repo,checkpoint_oid,state['run_id'])
    result = json.loads(ck.show(repo, checkpoint_oid,
        f'checkpoints/{state["run_id"]}/files/out/dispatch/github-capture-result.json'))
    if not owner or any(result.get(k) != owner.get(k) for k in ('owner_sha256', 'epoch')):
        raise ValueError('returned capture belongs to another publication owner epoch')
    request, hashed = request_at(repo, result['request_oid'])
    if (hashed != result.get('request_sha256') or request['source_commit'] != result.get('source_commit')
            or request['run_id'] != state['run_id']):
        raise ValueError('returned result differs from its immutable helper source request')
    ck.git(repo, 'merge-base', '--is-ancestor', request['checkpoint_oid'], checkpoint_oid)
    new = json.loads(raw)
    errors = ck.monotonic_problems(ck.public_ledger(state, repo), new)
    if errors:
        raise ValueError('capture import would regress ledger: '+'; '.join(errors))
    changed = []
    for row in manifest['files']:
        rel = Path(row['path'])
        if rel.is_absolute() or '..' in rel.parts:
            raise ValueError('unsafe checkpoint capture path')
        # All original blobs are verified above; materialize changed outputs only.
        spec = checkpoint_oid+':'+base+'/files/'+row['path']
        if str(rel).startswith('out/dispatch/') and rel.name != 'run_state.json':
            target = repo/rel
            if any(p.is_symlink() for p in (target, *target.parents)):
                raise ValueError('capture import cannot overwrite a symbolic link')
            if not target.is_file() or digest(target) != row['sha256']:
                changed.append((target,spec,row['sha256']))
    temporary_root = repo/'out/dispatch/tmp'
    temporary_root.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='github-capture-import-',dir=temporary_root) as staging:
        staged = []
        for index,(target,spec,expected) in enumerate(changed):
            temporary = Path(staging)/str(index)
            with temporary.open('wb') as stream:
                subprocess.run(['git','-C',str(repo),'show',spec],stdout=stream,check=True)
            if digest(temporary) != expected:
                raise ValueError('staged capture output differs from verified blob')
            staged.append((target,temporary))
        for target,temporary in staged:
            if target.is_file():
                backup = repo/'out/dispatch/github-capture-import-baseline'/digest(target)
                backup.parent.mkdir(parents=True, exist_ok=True)
                if not backup.exists(): shutil.copyfile(target,backup)
            target.parent.mkdir(parents=True, exist_ok=True)
            os.replace(temporary,target)
    restored = ck.restored_ledger(new, repo, manifest)
    origins = manifest.get('grant_origin_roots') or [
        {'event_index':index,'authorization_sha256':ck.grant_anchor(grant),'root':manifest['repo_root']}
        for index,grant in enumerate(new.get('events',[])) if grant.get('kind') in ck.GRANT_KINDS]
    publication_owner.write(repo/ck.GRANT_ROOTS_FILE,{'schema':1,'entries':origins})
    publication_owner.write(path, restored)
    return {'checkpoint_oid': checkpoint_oid, 'changed_files': len(changed), 'monotonic': True, 'approval': False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='action', required=True)
    p = sub.add_parser('request'); p.add_argument('--repo', type=Path, required=True)
    p.add_argument('--source-repo', type=Path, required=True); p.add_argument('--operation', choices=OPS, required=True)
    p.add_argument('--out', type=Path, required=True)
    p = sub.add_parser('stage'); p.add_argument('--repo', type=Path, default=Path(__file__).resolve().parents[1])
    p.add_argument('--request', required=True); p.add_argument('--request-sha256', required=True)
    p.add_argument('--destination', type=Path, required=True)
    p = sub.add_parser('run'); p.add_argument('--repo', type=Path, default=Path(__file__).resolve().parents[1])
    p = sub.add_parser('import'); p.add_argument('--repo', type=Path, required=True); p.add_argument('--checkpoint', required=True)
    args = parser.parse_args()
    try:
        if args.action == 'request': result = create(args.repo, args.source_repo, args.operation, args.out)
        elif args.action == 'stage': result = stage(args.repo, args.request, args.request_sha256, args.destination)
        elif args.action == 'run': result = run(args.repo)
        else: result = import_result(args.repo, args.checkpoint)
        print(json.dumps(result, indent=2)); return int(result.get('exit_code', 0) != 0)
    except (OSError, ValueError, KeyError, ck.CheckpointError, subprocess.SubprocessError) as exc:
        print('delegated GitHub capture refused: '+str(exc)); return 1


if __name__ == '__main__':
    raise SystemExit(main())
