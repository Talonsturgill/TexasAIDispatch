"""Retain an actual failed native decoder entry and fund its bounded remaining path."""
import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
POLICY = REPO / 'config/capture_retry_capacity_v2.json'
POLICY_SHA256 = '5bab6047ee16ec314dcad10705bd5973ac1fdbcc73651e1ade8d0a867384db89'
SCHEMA = 'dispatch_capture_retry_evidence/2'
KEY = 'capture_retry_evidence'
OPERATION = 'exact-film motion-image review extraction'
CURRENT_FILES = ('storyboard.json','claims.json','mix.wav','mix.json','captions.json','words.json',
                 'vo_script.txt','film.mp4','render-manifest.json','preflight.mp4','preflight.json',
                 'storyboard_critic.json','credits.txt','cinema/proof.json','cinema/hero-review.json')


def admission_deliverable(state, plan):
    """Project an old admission from its prior registration, never from a later cut."""
    proof = plan[KEY]
    registered = [row for row in state['events'] if row.get('kind') == 'deliverable_registered']
    if not registered:
        raise ValueError('motion retry admission has no preceding native registration')
    row = registered[-1]
    bindings = {item['path']: item['sha256'] for item in proof['input_bindings']}
    if (row.get('review_only') is not False or row.get('film_sha256') != proof['film_sha256']
            or row.get('manifest_sha256') != bindings.get('out/dispatch/render-manifest.json')):
        raise ValueError('motion retry admission differs from its preceding native registration')
    return {'review_only': False, 'film_sha256': row['film_sha256'],
            'manifest_sha256': row['manifest_sha256'], 'board_sha256': proof['board_sha256']}


def eligible(state, plan, report):
    from autonomous_completion import EVENT, canonical, sha
    from capture_guard import SCHEMA as AUTH_SCHEMA, event_digest, normalize
    try:
        proof = plan[KEY]; auth = json.loads(proof['authorization_json'])
        source, reserved, claimed, retried = [state['events'][proof[key + '_index']]
            for key in ('source_grant', 'reservation', 'claim', 'retry')]
        indices = [proof[key + '_index'] for key in ('source_grant', 'reservation', 'claim', 'retry')]
        command = auth['commands'][0]
        board = json.loads(proof['board_json'])
        return (proof['schema'] == SCHEMA
            and sha(proof['policy_json']) == proof['policy_sha256'] == POLICY_SHA256
            and sha(proof['authorization_json']) == proof['authorization_sha256']
            and sha(proof['failure_log']) == proof['failure_log_sha256']
            and sha(proof['board_json']) == proof['board_sha256']
            and all(type(i) is int and i >= 0 for i in indices) and indices == sorted(set(indices))
            and state.get('mode') == 'production' and state.get('terminal_state') is None
            and str(state['run_id'])[:10] >= '2026-10-15' and proof['run_id'] == state['run_id']
            and plan.get('completion_reason') == 'finish-current' and not plan.get('changed_inputs')
            and not plan.get('resources') and 'capture_completion_budget' not in plan
            and source['kind'] == EVENT and source['reason'] == 'finish-current'
            and sha(canonical(source)) == proof['source_grant_sha256']
            and source['failure_evidence_sha256'] == plan['failure_evidence_sha256']
            and json.loads(source['failure_evidence_json']) == report and report.get('verdict') == 'pass'
            and reserved['kind'] == 'reserved' and reserved['resources'] == {'preflight_renders': 1}
            and reserved['note'] == OPERATION and event_digest(reserved) == proof['reservation_sha256']
            and sha(canonical(claimed)) == proof['claim_sha256']
            and claimed['kind'] == 'prepared_capture_claimed' and claimed['operation'] == OPERATION
            and claimed['event_sha256'] == proof['reservation_sha256']
            and claimed['input_identity'] == reserved['preflight_identity']
            and sha(canonical(retried)) == proof['retry_sha256']
            and retried['kind'] == 'preflight_retry_authorized'
            and retried['evidence_sha256'] == proof['failure_log_sha256']
            and retried['input_identity'] == reserved['preflight_identity']
            and not any(e.get('kind') == 'reserved' and e.get('resources', {}).get('preflight_renders')
                        for e in state['events'][proof['reservation_index'] + 1:])
            and auth['schema'] == AUTH_SCHEMA and auth.get('allowed') is True
            and auth['headroom']['passed'] is True and auth['art_receipts_recorded'] is True
            and auth['headroom']['free_gib'] >= auth['headroom']['required_free_gib']
            and auth['housekeeping']['exit_code'] == 0 and len(auth['housekeeping']['receipt_sha256']) == 64
            and len(auth['commands']) == 1 and command.get('consumed')
            and command['id'] == sha(normalize(command['text']))
            and 'scripts/claude_motion_review.py' in command['text'] and '--phone-option' not in command['text']
            and auth['render_reservation']['event_sha256'] == proof['reservation_sha256']
            and auth['render_reservation']['resource'] == 'preflight_renders'
            and auth['prepared_capture']['operation'] == OPERATION
            and auth['prepared_capture']['event_sha256'] == proof['reservation_sha256']
            and auth['prepared_capture']['input_identity'] == reserved['preflight_identity']
            and any(b['path'] == 'out/dispatch/storyboard.json' and b['sha256'] == proof['board_sha256']
                    for b in auth['boards'])
            and 'claude motion review: [Errno 17] File exists:' in proof['failure_log']
            and 'out/dispatch/motion-review' in proof['failure_log']
            and board['date'] == str(state['run_id'])[:10] and board['cinematic_template'] == 'directed-film-v2'
            and state['deliverable']['review_only'] is False
            and state['deliverable']['film_sha256'] == proof['film_sha256']
            and state['deliverable']['board_sha256'] == proof['board_sha256']
            and json.loads(proof['retained_index_json'])['schema'] == 'dispatch_claude_motion_review/1'
            and json.loads(proof['retained_index_json'])['film_sha256'] != proof['film_sha256'])
    except (KeyError, IndexError, TypeError, ValueError, AttributeError):
        return False


def inventory(directory):
    from capture_retry_capacity import digest
    directory = Path(directory)
    if directory.is_symlink() or not directory.is_dir():
        raise ValueError('retained motion output must be the actual directory')
    rows = []
    for path in sorted(directory.rglob('*')):
        if path.is_symlink():
            raise ValueError('retained motion output contains a symbolic link')
        if path.is_file():
            rows.append({'path': str(path.relative_to(directory)), 'bytes': path.stat().st_size,
                         'sha256': digest(path)})
    if not rows:
        raise ValueError('retained motion evidence is empty')
    return rows


def file_problems(plan):
    from capture_retry_capacity import digest
    from capture_guard import analyze, resolve, simple_commands
    errors = []
    try:
        proof = plan[KEY]; root = REPO.resolve()
        if digest(POLICY) != POLICY_SHA256 or POLICY.read_text() != proof['policy_json']:
            errors.append('motion retry policy differs from pinned bytes')
        for field in ('authorization', 'failure_log', 'board'):
            path = (root / proof[field + '_path']).resolve()
            value = proof['failure_log'] if field == 'failure_log' else proof[field + '_json']
            if not path.is_relative_to(root) or path.read_text() != value:
                errors.append('motion retry retained bytes changed: ' + field)
        bindings = {r['path']: r['sha256'] for r in proof['input_bindings']}
        mandatory = {'out/dispatch/' + name for name in CURRENT_FILES}
        mandatory.update(str(p.relative_to(root)) for p in (root/'out/dispatch/sources').rglob('*') if p.is_file())
        auth = json.loads(proof['authorization_json'])
        mandatory.update(p for files in auth['bound'].values() for p in files)
        if len(bindings) != len(proof['input_bindings']) or not mandatory <= set(bindings):
            errors.append('motion retry lacks complete production bindings')
        for path, expected in bindings.items():
            target = (root/path).resolve()
            if not target.is_relative_to(root) or digest(target) != expected:
                errors.append('motion retry current production input changed: ' + path)
        if any(bindings.get(p) != h for files in auth['bound'].values() for p, h in files.items()):
            errors.append('motion retry renderer or artwork differs from its failed authorization')
        if (digest(root/'out/dispatch/film.mp4') != proof['film_sha256']
                or json.loads((root/'out/dispatch/render-manifest.json').read_text())['film_sha256'] != proof['film_sha256']):
            errors.append('motion retry requires the unchanged registered native film')
        report = json.loads(Path(plan['failure_evidence']).read_text())
        if digest(root/'out/dispatch/preflight.mp4') != report.get('reviewed_preflight_sha256', report.get('film_sha256')):
            errors.append('motion retry requires the original independently passed phone film')
        retained = (root/proof['retained_output']).resolve()
        if (not retained.is_relative_to(root/'out/dispatch')
                or inventory(retained) != proof['retained_files']
                or (retained/'index.json').read_text() != proof['retained_index_json']):
            errors.append('motion retry previous output evidence changed')
        command = auth['commands'][0]['text']; segments = analyze(command, str(root))
        if len(segments or []) != 1:
            errors.append('motion retry needs exactly one native decoder command')
        operators = [(tokens, here) for tokens, here in simple_commands(command, str(root))
                     if len(tokens) > 1 and Path(tokens[1]).name == 'claude_motion_review.py']
        if len(operators) != 1:
            errors.append('motion retry lacks its actual checkout decoder')
        else:
            tokens, here = operators[0]
            if resolve(tokens[1], here).resolve() != root/'scripts/claude_motion_review.py':
                errors.append('motion retry decoder is outside the checkout')
            for flag, name in {'board':'storyboard.json', 'film':'film.mp4', 'state':'run_state.json', 'out':'motion-review'}.items():
                indices = [i for i,t in enumerate(tokens) if t == '--'+flag or t.startswith('--'+flag+'=')]
                if len(indices) != 1:
                    errors.append('motion retry lacks one exact --'+flag); continue
                i = indices[0]; value = tokens[i].partition('=')[2] if '=' in tokens[i] else tokens[i+1]
                if resolve(value, here).resolve() != root/'out/dispatch'/name:
                    errors.append('motion retry changed its exact --'+flag)
        destination = root/'out/dispatch/motion-review'
        if destination.exists() or destination.is_symlink():
            errors.append('motion retry destination is still occupied; preserve old evidence first')
    except (OSError, ValueError, KeyError, TypeError, IndexError) as exc:
        errors.append('motion retry evidence cannot be verified: '+str(exc))
    return errors


def prepare(state_path, authorization, failure_log, retained_output, output):
    from autonomous_completion import EVENT, canonical, sha
    from capture_guard import event_digest
    from capture_retry_capacity import digest
    from run_controller import read_state
    root = REPO.resolve()
    if Path(state_path).resolve() != root/'out/dispatch/run_state.json':
        raise ValueError('motion recovery needs this checkout edition ledger')
    if any(not Path(p).resolve().is_relative_to(root/'out/dispatch')
           for p in (authorization, failure_log, retained_output, output)):
        raise ValueError('motion recovery evidence must stay inside this edition package')
    state = read_state(Path(state_path))
    auth_text = Path(authorization).read_text(); auth = json.loads(auth_text)
    source_index = max(i for i,e in enumerate(state['events']) if e.get('kind') == EVENT and e.get('reason') == 'finish-current')
    source = state['events'][source_index]; plan = json.loads(source['plan_json'])
    plan['resources'] = {}; plan['changed_inputs'] = []
    reservation_index = next(i for i,e in enumerate(state['events']) if e.get('kind') == 'reserved'
        and event_digest(e) == auth['render_reservation']['event_sha256'])
    reservation = state['events'][reservation_index]
    claim_index = next(i for i,e in enumerate(state['events']) if e.get('kind') == 'prepared_capture_claimed'
        and e.get('event_sha256') == auth['render_reservation']['event_sha256'])
    log = Path(failure_log).read_text()
    retry_index = next(i for i,e in enumerate(state['events']) if e.get('kind') == 'preflight_retry_authorized'
        and e.get('evidence_sha256') == sha(log) and e.get('input_identity') == reservation['preflight_identity'])
    output = Path(output).resolve()
    if not output.is_relative_to(root/'out/dispatch') or output.exists():
        raise ValueError('use a new owned recovery-plan path')
    # Preserve the consumed authorization independently of the next authorization file.
    snapshot = output.with_name('consumed-motion-'+auth['render_reservation']['event_sha256']+'.json')
    if snapshot.exists():
        if snapshot.read_text() != auth_text:
            raise ValueError('retained consumed authorization differs')
    else:
        with snapshot.open('x') as stream: stream.write(auth_text)
    retained = Path(retained_output).resolve(); board = root/'out/dispatch/storyboard.json'
    paths = {root/p for files in auth['bound'].values() for p in files}
    paths.update(root/'out/dispatch'/name for name in CURRENT_FILES)
    paths.update(p for p in (root/'out/dispatch/sources').rglob('*') if p.is_file())
    proof = {'schema':SCHEMA, 'run_id':state['run_id'], 'policy_json':POLICY.read_text(), 'policy_sha256':POLICY_SHA256,
        'authorization_path':str(snapshot.relative_to(root)), 'authorization_json':auth_text, 'authorization_sha256':sha(auth_text),
        'failure_log_path':str(Path(failure_log).resolve().relative_to(root)), 'failure_log':log, 'failure_log_sha256':sha(log),
        'board_path':'out/dispatch/storyboard.json', 'board_json':board.read_text(), 'board_sha256':digest(board),
        'film_sha256':digest(root/'out/dispatch/film.mp4'), 'retained_output':str(retained.relative_to(root)),
        'retained_index_json':(retained/'index.json').read_text(), 'retained_files':inventory(retained),
        'input_bindings':[{'path':str(p.resolve().relative_to(root)), 'sha256':digest(p)} for p in sorted(paths)]}
    for key,index in [('source_grant',source_index),('reservation',reservation_index),('claim',claim_index),('retry',retry_index)]:
        proof[key+'_index'] = index; proof[key+'_sha256'] = sha(canonical(state['events'][index]))
    plan[KEY] = proof
    if not eligible(state, plan, json.loads(source['failure_evidence_json'])):
        raise ValueError('actual charged native output failure does not bind the unchanged passed cut')
    errors = file_problems(plan)
    if errors: raise ValueError('; '.join(errors))
    with output.open('x') as stream: json.dump(plan,stream,indent=2); stream.write('\n')
    return plan
