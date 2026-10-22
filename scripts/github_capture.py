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
    'openings': ('two opening comparison batch', 'preflight_renders',
                 ['python', 'scripts/opening_compare.py', '--root', 'out/dispatch',
                  '--state', 'out/dispatch/run_state.json']),
    'preship': ('exact-film mechanical preship probes', 'preflight_renders',
                ['python', 'scripts/preship_compute.py']),
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
    'phone-motion-a': ('exact-phone-a motion-image review extraction', 'preflight_renders',
             ['python', 'scripts/claude_motion_review.py', '--phone-option', 'a',
              '--board', 'out/dispatch/openings/a.json', '--film', 'out/dispatch/openings/a.mp4',
              '--out', 'out/dispatch/openings/phone-motion-a', '--state', 'out/dispatch/run_state.json']),
    'phone-motion-b': ('exact-phone-b motion-image review extraction', 'preflight_renders',
             ['python', 'scripts/claude_motion_review.py', '--phone-option', 'b',
              '--board', 'out/dispatch/openings/b.json', '--film', 'out/dispatch/openings/b.mp4',
              '--out', 'out/dispatch/openings/phone-motion-b', '--state', 'out/dispatch/run_state.json']),
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
    if operation == 'preship':
        from preship_compute import current_inputs
        current_inputs(repo,state)
        if (Path(repo)/'out/dispatch/preship-compute').exists():
            raise ValueError('preship compute evidence already exists; retain it before another attempt')
        return
    if operation == 'openings':
        from capture_reservation import opening_output_precheck
        from opening_compare import owned_boards
        package = Path(repo)/'out/dispatch'
        opening_output_precheck(package)
        owned_boards(package, package/'run_state.json')
        return
    if operation not in ('phone-motion', 'phone-motion-a', 'phone-motion-b', 'full-motion'):
        return
    import capture_reservation
    repo = Path(repo).resolve()
    argv = OPS[operation][2]
    board = repo/argv[argv.index('--board')+1]
    capture_reservation.motion_output_precheck(argv, repo, board.parent)
    if '--phone-option' in argv:
        from claude_motion_review import phone_inputs
        phone_inputs(repo/'out/dispatch/run_state.json', argv[argv.index('--phone-option')+1],
                     board, repo/argv[argv.index('--film')+1])
    else:
        deliverable = state.get('deliverable') or {}
        if (deliverable.get('review_only') is not False
                or deliverable.get('film_sha256') != digest(repo/'out/dispatch/film.mp4')
                or deliverable.get('board_sha256') != digest(board)):
            raise ValueError('full motion extraction requires the current registered exact native film')


def checkout_operation_precheck(repo, operation, state):
    """Import every admission dependency from the restored edition, never the staging checkout."""
    code = ('from pathlib import Path; import json,sys; sys.path.insert(0,"scripts"); '
            'import github_capture; '
            'github_capture.operation_precheck(Path.cwd(),sys.argv[1],json.load(sys.stdin))')
    try:
        result = subprocess.run(['bash', 'scripts/run_with_env.sh', 'python', '-c', code, operation],
                                cwd=repo, input=json.dumps(state), text=True,
                                capture_output=True, timeout=120)
    except subprocess.TimeoutExpired as exc:
        raise ValueError('restored checkout admission exceeded its finite 120-second limit') from exc
    if result.returncode:
        raise ValueError('restored checkout admission refused: ' + (result.stderr or result.stdout)[-4000:].strip())


def current_identity(repo, state_path, note):
    # -c does not add the checkout's scripts directory as a script-file invocation does.
    code = ('from pathlib import Path; import sys; sys.path.insert(0,"scripts"); '
            'import capture_reservation; '
            'print(capture_reservation.input_identity(Path(sys.argv[1]),sys.argv[2]))')
    return subprocess.check_output(['bash','scripts/run_with_env.sh','python','-c',code,
                                    str(state_path),note],cwd=repo,text=True).strip()


STAGE_STEP = 'Verify immutable request and claim its original charge once'
INSTALL_STEP = "Install the episode's locked renderer and managed browser"
EXECUTE_STEP = 'Execute only the fixed prepaid operation and checkpoint its bytes'
CONTINUATION = 'dispatch_unstarted_capture_continuation/1'


def claim_ref(request):
    namespace = 'capture-continuations' if request.get('unstarted_continuation') else 'capture-claims'
    return 'refs/heads/codex/'+namespace+'/'+request['run_id']+'/'+request['reservation_event_sha256']


def continuation_request_ref(request):
    return ('refs/heads/codex/capture-continuation-requests/'+request['run_id']+'/'+
            request['reservation_event_sha256'])


def github_api(endpoint, *, raw=False):
    command = ['gh', 'api', 'repos/'+REPOSITORY+'/'+endpoint]
    result = subprocess.run(command, capture_output=True)
    # New gh versions refuse ANSI in raw job logs unless explicitly requested.
    if raw and result.returncode and b'--allow-escape-sequences' in result.stderr:
        result = subprocess.run(command[:2]+['--allow-escape-sequences']+command[2:], capture_output=True)
    result.check_returncode()
    return result.stdout if raw else json.loads(result.stdout)


def unstarted_proof(repo, original_oid, current):
    """Read the actual predecessor claim and completed GitHub attempt; never infer from a receipt."""
    original, hashed = request_at(repo, original_oid)
    if original.get('unstarted_continuation'):
        raise ValueError('an unstarted continuation cannot itself be continued')
    bindings = ('schema', 'repository', 'run_id', 'owner_sha256', 'epoch', 'github_actor',
                'operation', 'reservation_event_sha256', 'ledger_sha256')
    if any(original.get(key) != current.get(key) for key in bindings):
        raise ValueError('unstarted continuation changed the original owner, charge or ledger')
    base = ck.ROOT+'/'+original['run_id']
    manifest = json.loads(ck.show(repo, original['checkpoint_oid'], base+'/manifest.json'))
    raw = ck.show(repo, original['checkpoint_oid'], base+'/run_state.json')
    if (manifest.get('schema') != ck.SCHEMA or manifest.get('run_id') != original['run_id']
            or manifest.get('ledger_sha256') != original['ledger_sha256']
            or digest(raw) != original['ledger_sha256']):
        raise ValueError('original continuation ledger binding differs')
    prepaid(json.loads(raw), original['operation'], original['reservation_event_sha256'])
    ref = claim_ref(original)
    listed = ck.git(repo, 'ls-remote', '--heads', 'origin', ref).stdout.decode().split()
    if not listed:
        raise ValueError('unstarted continuation requires its existing original claim')
    oid = listed[0]
    ck.git(repo, 'fetch', '--quiet', '--no-tags', 'origin', ref)
    claim = json.loads(ck.show(repo, oid, 'claim.json'))
    run_id = claim.get('github_run_id', '')
    expected = {'request_oid': original_oid, 'request_sha256': hashed,
                'github_actor': original['github_actor'], 'github_run_id': run_id}
    if claim != expected or not re.fullmatch(r'\d+', str(run_id)):
        raise ValueError('original single-use claim differs from the requested predecessor')
    run = github_api('actions/runs/'+str(run_id))
    required = {'id': int(run_id), 'run_attempt': 1, 'status': 'completed', 'conclusion': 'failure',
                'event': 'workflow_dispatch', 'head_sha': original['source_commit'],
                'path': '.github/workflows/guards.yml'}
    if (any(run.get(key) != value for key, value in required.items())
            or any((run.get(key) or {}).get('login') != original['github_actor']
                   for key in ('actor', 'triggering_actor'))):
        raise ValueError('original capture must be one completed failed first GitHub attempt')
    jobs = github_api('actions/runs/'+str(run_id)+'/attempts/1/jobs?per_page=100')
    rows = jobs.get('jobs', [])
    matches = [job for job in rows if job.get('name') == 'capture']
    if (jobs.get('total_count') != len(rows) or len(matches) != 1
            or any(job.get('name') != 'capture' and job.get('conclusion') != 'skipped' for job in rows)):
        raise ValueError('original capture job evidence is incomplete or ambiguous')
    job = matches[0]
    if any(job.get(key) != value for key, value in {
            'run_id': int(run_id), 'run_attempt': 1, 'head_sha': original['source_commit'],
            'status': 'completed', 'conclusion': 'failure'}.items()):
        raise ValueError('original capture job identity or completion differs')
    steps = {}
    for name, conclusion in ((STAGE_STEP, 'failure'), (INSTALL_STEP, 'skipped'), (EXECUTE_STEP, 'skipped')):
        matching = [step for step in job.get('steps', []) if step.get('name') == name]
        if (len(matching) != 1 or matching[0].get('status') != 'completed'
                or matching[0].get('conclusion') != conclusion):
            raise ValueError('original native installation or execution was not provably skipped')
        steps[name] = matching[0]
    if not steps[STAGE_STEP]['number'] < steps[INSTALL_STEP]['number'] < steps[EXECUTE_STEP]['number']:
        raise ValueError('original capture step order differs')
    log = github_api('actions/jobs/'+str(job['id'])+'/logs', raw=True)
    refusal = [line for line in log.decode().splitlines()
               if 'delegated GitHub capture refused: restored edition fails its audit:' in line]
    if len(refusal) != 1 or ck.SECRET_TEXT.search(refusal[0]):
        raise ValueError('retain the actual unstarted restore-audit failure from GitHub')
    return {'schema': CONTINUATION, 'original_request_oid': original_oid,
            'original_request_sha256': hashed, 'original_claim_commit': oid,
            'run': {key: run[key] for key in (*required, 'actor', 'triggering_actor')},
            'job': job, 'job_log_sha256': digest(log), 'restore_refusal': refusal,
            'workflow_sha256': digest(ck.show(repo, original['source_commit'], '.github/workflows/guards.yml'))}


def verify_continuation(repo, request, request_oid):
    proof = request.get('unstarted_continuation')
    if proof is None:
        return
    if (not isinstance(proof, dict) or proof.get('schema') != CONTINUATION
            or unstarted_proof(repo, proof['original_request_oid'], request) != proof):
        raise ValueError('unstarted continuation predecessor proof changed')
    listed = ck.git(repo, 'ls-remote', '--heads', 'origin', continuation_request_ref(request)).stdout.decode().split()
    if not listed or listed[0] != request_oid:
        raise ValueError('this is not the original reservation\'s one immutable continuation request')


def create(repo, source_repo, operation, out, continue_unstarted_request=None):
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
    actual = current_identity(repo,state_path,note)
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
    if continue_unstarted_request:
        request['unstarted_continuation'] = unstarted_proof(repo, continue_unstarted_request, request)
        if ck.git(source_repo, 'ls-remote', '--heads', 'origin', continuation_request_ref(request)).stdout.strip():
            raise ValueError('this original reservation already has its one unstarted continuation')
    oid = commit_record(source_repo, REQUEST_FILE, request, 'Delegate one prepaid native capture', source)
    ref = (continuation_request_ref(request) if continue_unstarted_request
           else 'refs/heads/codex/capture-requests/'+oid)
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
    verify_continuation(repo, request, activation['request_oid'])
    reference = claim_ref(request)
    listed = ck.git(repo, 'ls-remote', '--heads', 'origin', reference).stdout.decode().split()
    if not listed or listed[0] != activation['claim_commit']:
        errors.append('single-use render claim is missing or changed')
    else:
        ck.git(repo, 'fetch', '--quiet', '--no-tags', 'origin', reference)
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
    if ck.git(repo,'rev-parse','HEAD').stdout.decode().strip() != request['source_commit']:
        raise ValueError('staging checkout differs from immutable request helper source')
    if ck.git(repo,'diff','--quiet','HEAD','--','scripts',check=False).returncode:
        raise ValueError('staging helper source has uncommitted changes')
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
    verify_continuation(repo, request, request_oid)
    ck.restore(repo, request['run_id'], dest=destination,helper_source=repo/'scripts')
    restored_state = read(destination/'out/dispatch/run_state.json')
    event = prepaid(restored_state, request['operation'], request['reservation_event_sha256'])
    field = 'full_render_identity' if request['operation'] == 'full' else 'preflight_identity'
    if (restored_state != ck.restored_ledger(json.loads(raw), destination, manifest)
            or current_identity(destination, destination/'out/dispatch/run_state.json',
                                OPS[request['operation']][0]) != event.get(field)):
        raise ValueError('restored ledger or prepaid native input identity changed before claim')
    checkout_operation_precheck(destination, request['operation'], restored_state)
    owner = publication_owner.read_remote(repo)
    if (not owner or owner.get('runtime') != 'codex' or owner.get('status') != 'held'
            or any(owner.get(k) != request[k] for k in ('run_id', 'owner_sha256', 'epoch'))
            or publication_owner.instant(owner['expires_at']) <= publication_owner.now()):
        raise ValueError('original Codex owner was fenced before the capture claim')
    verify_continuation(repo, request, request_oid)
    claim = {'request_oid': request_oid, 'request_sha256': hashed,
             'github_run_id': os.environ['GITHUB_RUN_ID'], 'github_actor': os.environ['GITHUB_ACTOR']}
    commit = commit_record(repo, 'claim.json', claim, 'Claim one delegated render')
    claim_once(repo, claim_ref(request), commit)
    # The immutable request source supplies current gate helpers, while restore keeps
    # the recorded renderer/art/source closure and every original checkpoint byte.
    # restore installed this exact helper source before its isolated audit.
    activation = destination/'out/dispatch/github-capture-activation.json'
    activation.write_text(json.dumps({**claim, 'claim_commit': commit}, indent=2)+'\n')
    return {'destination': str(destination), 'activation': str(activation), 'request': request}


def perform_capture(repo, state_path, request, phase):
    note, resource, argv = OPS[request['operation']]
    boards = ([repo/('out/dispatch/opening-'+key+'.json') for key in ('a','b')]
              if request['operation'] == 'openings' else
              [repo/argv[argv.index('--board')+1]] if '--board' in argv else
              [repo/'out/dispatch/storyboard.json'])
    import capture_guard
    import capture_reservation
    phase('deterministic-foley')
    catalog = repo/'assets/sfx/catalog.json'
    if catalog.is_file() and any(not (repo/row['wav']).is_file() for row in read(catalog)):
        subprocess.run(['bash','scripts/run_with_env.sh','python','scripts/foley.py',
                        '--build','assets/sfx'],cwd=repo,check=True)
    phase('input-admission')
    state = read(state_path); event = prepaid(state, request['operation'], request['reservation_event_sha256'])
    operation_precheck(repo, request['operation'], state)
    # These existing gates compute complete native-frame storage and perform the real
    # portable housekeeping check on this runner before authorization or capture.
    command = 'bash scripts/run_with_env.sh '+shlex.join(argv)
    phase('native-headroom')
    subprocess.run(['bash', 'scripts/run_with_env.sh', 'python', 'scripts/native_headroom.py',
                    '--board', str(boards[0].relative_to(repo)), '--out',
                    'out/dispatch/github-native-headroom.json'], cwd=repo, check=True)
    phase('housekeeping-and-authorization')
    auth = capture_guard.authorize(repo, state_path, boards,
                                   [command], resource=resource, housekeeping=True)
    if auth['render_reservation']['event_sha256'] != request['reservation_event_sha256']:
        raise ValueError('runner authorization selected another render charge')
    phase('prepaid-input-identity')
    field = 'full_render_identity' if request['operation'] == 'full' else 'preflight_identity'
    identity = capture_reservation.input_identity(state_path, note)
    if event.get(field) != identity:
        raise ValueError('restored render inputs differ from the original charged identity')
    auth['prepared_capture'] = {'schema': 'dispatch_prepared_capture/1', 'operation': note,
        'resource': resource, 'run_id': state['run_id'], 'event_sha256': request['reservation_event_sha256'],
        'input_identity': identity}
    capture_guard.atomic_json(repo/capture_guard.AUTHORIZATION, auth)
    phase('durable-authorization-consumption')
    errors = capture_guard.capture_problems(command, auth, repo, repo)
    if errors or not capture_guard.consume(repo, command):
        raise ValueError('finite capture authorization refused: '+'; '.join(errors))
    phase('fixed-operator')
    return subprocess.run(['bash', 'scripts/run_with_env.sh', *argv], cwd=repo, timeout=5400).returncode


def run(repo):
    """Retain actual failures throughout setup, authorization, capture and durability."""
    repo = Path(repo).resolve(); state_path = repo/'out/dispatch/run_state.json'
    receipt = {'schema':'dispatch_github_capture_result/1', 'approval':False,
               'publication_allowed':False, 'github_run_id':os.environ.get('GITHUB_RUN_ID'),
               'observed_at':datetime.now(timezone.utc).isoformat(), 'exit_code':1,
               'phase':'load-activation', 'owner_verified':False, 'capture_started':False}
    def phase(value):
        receipt['phase'] = value
        if value == 'fixed-operator': receipt['capture_started'] = True
    try:
        activation = read(os.environ['DISPATCH_GITHUB_CAPTURE_REQUEST'])
        receipt.update({k:activation[k] for k in ('request_oid','request_sha256')})
        phase('load-immutable-request')
        request, _ = request_at(repo, activation['request_oid'])
        receipt.update({k:request[k] for k in ('source_commit','operation','owner_sha256','epoch')})
        phase('delegate-validation')
        require_delegate(state_path)
        receipt['owner_verified'] = True
        code = perform_capture(repo,state_path,request,phase)
        receipt.update(exit_code=code,capture_exit_code=code)
        if code:
            receipt['error'] = {'type':'OperatorExit','message':'Fixed operator returned '+str(code)}
    except (OSError, ValueError, KeyError, ck.CheckpointError, subprocess.SubprocessError) as exc:
        receipt['exit_code'] = 124 if isinstance(exc,subprocess.TimeoutExpired) else (getattr(exc,'returncode',1) or 1)
        receipt['error'] = {'type':type(exc).__name__,'message':str(exc)}
    package = repo/'out/dispatch'
    package.mkdir(parents=True,exist_ok=True)
    evidence = package/'github-capture-results'
    evidence.mkdir(exist_ok=True)
    retained = evidence/(digest(canonical(receipt))+'.json')
    retained.write_text(json.dumps(receipt,indent=2)+'\n')
    receipt['lifecycle_evidence'] = {'path':str(retained.relative_to(repo)),'sha256':digest(retained)}
    canonical_result = package/'github-capture-result.json'
    canonical_result.write_text(json.dumps(receipt,indent=2)+'\n')
    if receipt['owner_verified']:
        try:
            # Never overwrite another owner's checkpoint after a lease/epoch change.
            require_delegate(state_path)
            saved = ck.save_with_recovery(repo,state_path,'delegated GitHub capture '+receipt['phase']+' result')
            receipt['checkpoint_oid'] = saved['commit']
        except (OSError,ValueError,KeyError,ck.CheckpointError,subprocess.SubprocessError) as exc:
            receipt['checkpoint_error'] = {'type':type(exc).__name__,'message':str(exc)}
            receipt['exit_code'] = receipt['exit_code'] or 1
            canonical_result.write_text(json.dumps(receipt,indent=2)+'\n')
    # Even fenced or early setup failures survive in the public-safe Actions artifact.
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
    if request.get('operation') == 'preship':
        if result.get('exit_code') == 0:
            from preship_compute import import_verdict
            import_verdict(repo, result, request)
        else:
            # Failed mechanical checks are still durable evidence and charged work.
            # Import their original checkpoint without trying to install a PASS.
            verdict = repo/'out/gates/preship.json'
            if any(p.is_symlink() for p in (verdict, *verdict.parents)):
                raise ValueError('failed preship import cannot follow symbolic links')
            verdict.unlink(missing_ok=True)
    return {'checkpoint_oid': checkpoint_oid, 'changed_files': len(changed), 'monotonic': True, 'approval': False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='action', required=True)
    p = sub.add_parser('request'); p.add_argument('--repo', type=Path, required=True)
    p.add_argument('--source-repo', type=Path, required=True); p.add_argument('--operation', choices=OPS, required=True)
    p.add_argument('--out', type=Path, required=True)
    p.add_argument('--continue-unstarted-request', help='Original immutable request for one verified never-started continuation')
    p = sub.add_parser('stage'); p.add_argument('--repo', type=Path, default=Path(__file__).resolve().parents[1])
    p.add_argument('--request', required=True); p.add_argument('--request-sha256', required=True)
    p.add_argument('--destination', type=Path, required=True)
    p = sub.add_parser('run'); p.add_argument('--repo', type=Path, default=Path(__file__).resolve().parents[1])
    p = sub.add_parser('import'); p.add_argument('--repo', type=Path, required=True); p.add_argument('--checkpoint', required=True)
    args = parser.parse_args()
    try:
        if args.action == 'request':
            result = create(args.repo, args.source_repo, args.operation, args.out, args.continue_unstarted_request)
        elif args.action == 'stage': result = stage(args.repo, args.request, args.request_sha256, args.destination)
        elif args.action == 'run': result = run(args.repo)
        else: result = import_result(args.repo, args.checkpoint)
        print(json.dumps(result, indent=2)); return int(result.get('exit_code', 0) != 0)
    except (OSError, ValueError, KeyError, ck.CheckpointError, subprocess.SubprocessError) as exc:
        print('delegated GitHub capture refused: '+str(exc)); return 1


if __name__ == '__main__':
    raise SystemExit(main())
