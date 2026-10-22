"""Close expenditure after a complete rejected final panel, without completing production.

Only native hook-delivered final responses establish worker completion. Neither a missing
task nor a director-authored report does. This creates no release authority or terminal state.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import sys

KIND = 'hard_limit_expenditure_closed'
ROLES = ('picture', 'story', 'sound')
RECEIPTS = 'native-scorer-completions'


def read(path):
    return json.loads(Path(path).read_text())


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def require(condition, reason):
    if not condition:
        raise ValueError(reason)


def closed(state):
    return any(row.get('kind') == KIND for row in state.get('events', []))


def admission_problems(state, amounts=None):
    # Reported tokens are retrospective accounting, never permission to execute work.
    return (['final expenditure is closed; production is incomplete and no new paid work is admitted']
            if closed(state) and (amounts is None or set(amounts) - {'reported_tokens'}) else [])


def local(root, value):
    path = Path(value)
    path = path if path.is_absolute() else Path(root) / path
    require(path.is_file() and not any(p.is_symlink() for p in (path, *path.parents))
            and path.resolve().is_relative_to(Path(root).resolve()), 'evidence must be a real owned file')
    return path.resolve()


def immutable(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    require(not any(p.is_symlink() for p in (path, *path.parents)), 'completion receipts cannot be aliases')
    text = json.dumps(value, indent=2, sort_keys=True) + '\n'
    if path.exists():
        require(path.read_text() == text, 'preserve the original native completion receipt')
    else:
        with path.open('x') as stream:
            stream.write(text)


def record(payload, workspace):
    """Observe public handback/stop payloads; never open agent transcripts or private reasoning."""
    from routine_continuation import MARKER, SCHEMA, location
    from publication_owner import identity
    armed = read(Path(workspace) / MARKER)
    require(armed.get('schema') == SCHEMA, 'completion observer needs the selected production')
    state_path = location(workspace, armed['state']); state = read(state_path)
    require(state.get('run_id') == armed['run_id'] and state.get('mode') == 'production', 'completion observer run changed')
    if payload.get('agent_type') not in ('scorer', 'dispatch-visual-scorer'):
        return
    agent = payload.get('agent_id'); session = payload.get('session_id')
    if not isinstance(agent, str) or not agent or not isinstance(session, str) or not session:
        return
    folder = state_path.parent / RECEIPTS
    key = digest([session, agent])
    if payload.get('hook_event_name') == 'PostToolUse' and payload.get('tool_name') == 'SubagentHandback':
        message = (payload.get('tool_input') or {}).get('message')
        if isinstance(message, str):
            immutable(folder / ('handback-' + key + '-' + digest(message) + '.json'), {'message': message})
        return
    if payload.get('hook_event_name') != 'SubagentStop':
        return
    message = payload.get('last_assistant_message')
    handbacks = list(folder.glob('handback-' + key + '-*.json'))
    if handbacks:
        handback = max(handbacks, key=lambda path: path.stat().st_mtime_ns)
        message = read(local(state_path.parents[2], handback))['message']
    try:
        report = json.loads(message)
    except (TypeError, ValueError):
        return  # Missing or malformed final content is not completed review evidence.
    if not isinstance(report, dict):
        return
    for path in (state_path.parent / 'worker-dispatch-claims').glob('*.json'):
        claim = read(local(state_path.parents[2], path))
        if (claim.get('role') not in ROLES or claim.get('packet_sha256') != report.get('packet_sha256')
                or claim.get('run_id') != state['run_id'] or claim.get('owner_sha256') != identity(session)):
            continue
        event = state['events'][claim['reservation_event_index']]
        require(claim['reservation_sha256'] == digest(event), 'completion reservation changed')
        value = {'schema': 'dispatch_native_scorer_completion/1', 'agent_id': agent,
                 'session_sha256': identity(session), 'claim_sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                 'reservation_sha256': digest(event), 'packet_sha256': claim['packet_sha256'],
                 'role': claim['role'], 'run_id': state['run_id'], 'report': report,
                 'original_final_response': message, 'production_finished': False}
        immutable(folder / (claim['packet_sha256'] + '-' + digest(report) + '.json'), value)


def complete_judge(judge, board, film_sha, film_runtime=None):
    """Validate complete observations, including honest false values; do not grant a pass."""
    import modern_film
    from creative_release import findings
    from panel_triage import read_rubric
    runtime = board['runtime_s']; fields = modern_film.policy()['review_criteria']
    finite = lambda v: type(v) in (int, float) and math.isfinite(v)
    observed = lambda row: isinstance(row, dict) and type(row.get('pass')) is bool and modern_film.prose(row.get('observed'))
    require(isinstance(judge.get('reviewer_identity'), str) and judge['reviewer_identity'].strip(), 'missing independent identity')
    require(type(judge.get('ship')) is bool and isinstance(judge.get('hard_fails'), list), 'incomplete scorer verdict')
    require(finite(judge.get('score')) and all(finite(judge.get('axes', {}).get(k)) for k in read_rubric()[1]), 'incomplete finite scores')
    modern = judge['modern_observations']
    require(modern.get('film_sha256') == film_sha, 'modern observations bind another film')
    for key in fields:
        row = modern.get(key)
        require(observed(row) and finite(row.get('start_s')) and finite(row.get('end_s'))
                and 0 <= row['start_s'] < row['end_s'] <= runtime + .1, 'missing timed modern observation: ' + key)
    clauses = board['narration_picture']['clauses']; actual = judge['narration_picture_observations']
    require(actual.get('film_sha256') == film_sha and isinstance(actual.get('clauses'), list)
            and [r.get('id') for r in actual['clauses']] == [r['id'] for r in clauses], 'incomplete narration coverage')
    for row, clause in zip(actual['clauses'], clauses):
        require(observed(row) and all(row.get(k) == clause[k] for k in ('start_s', 'end_s')), 'incomplete timed clause observation')
    attention = judge['attention_review']
    require(attention.get('film_sha256') == film_sha and type(attention.get('pass')) is bool, 'unbound attention review')
    for key in ('hook_observed', 'continuity_observed', 'remembered_image', 'weakest_interval', 'audio_basis', 'pacing_observed', 'comprehension_observed'):
        require(isinstance(attention.get(key), str) and len(attention[key].strip()) >= 12, 'missing attention evidence: ' + key)
    require(finite(attention.get('weakest_at_s')) and finite(attention.get('weakest_end_s'))
            and 0 <= attention['weakest_at_s'] < attention['weakest_end_s'] <= (film_runtime or runtime), 'invalid weakest interval')
    assessment = judge['bounded_release']; defects = assessment.get('defects')
    require(assessment.get('schema') == 'dispatch_creative_assessment/1' and assessment.get('scope') == 'panel'
            and isinstance(defects, list), 'missing original independent classification')
    original = {digest(v) for v in findings(judge)}
    require({digest(r['finding']) for r in defects} == original, 'classifications omit or invent original findings')
    checks = assessment.get('retained_checks', {})
    require(all(observed(checks.get(k)) for k in ('source', 'rights', 'legibility', 'comprehension', 'technical_audio', 'captions')), 'incomplete retained checks')
    mandatory = {'source', 'rights', 'legibility', 'comprehension', 'technical_audio', 'captions', 'motion', 'pacing', 'ending_artistry'}
    return (judge['ship'] is False and any(r.get('category') in mandatory
            and digest(r['finding']) in {digest(v) for v in judge['hard_fails']} for r in defects))


def validate(state_path, plan):
    from run_controller import deliverable_problems, digest as file_sha
    from independent_review import panel_transport_problems, evidence_problems
    from claude_runtime import image_coverage_problems, motion_inputs
    from agent_runtime import validate_references, references
    from production_quality import av_problems, asset, probe
    from creative_release import panel_allows
    from review_limit import reached
    from preship_check import current_for
    root = state_path.parents[2]; state = read(state_path); saved = state['deliverable']
    require(reached(state) and not state.get('terminal_state'), 'only the exhausted unfinished production can close expenditure')
    require(not deliverable_problems(state, publication=True, repo=root), 'registered native deliverable is incomplete or changed')
    board_path = local(root, saved['board']); board = read(board_path); film = local(root, saved['film'])
    require(current_for(board_path)[0] and not panel_transport_problems(state), 'current preship and final atomic panel are required')
    panels = [e for e in state['events'] if e.get('kind') == 'reserved' and e.get('resources', {}).get('panel_rounds')]
    require(len(panels) == 1 and panels[0]['resources'].get('scorer_calls') == 3, 'only one complete final panel can close expenditure')
    panel = read(local(root, plan['panel'])); judges = panel['judges']
    require(panel.get('ship') is False and len(judges) == 3 and {j.get('audiovisual_role') for j in judges} == set(ROLES), 'need three original distinct final roles')
    require(not panel_allows(board_path, plan['panel']), 'eligible bounded release must continue delivery')
    film_runtime = probe(film)[2]
    bindings = {}; agents = set(); identities = set(); mandatory = False
    def bind(value):
        path = local(root, value); bindings[str(path.relative_to(root))] = file_sha(path); return path
    for name in ('film', 'board', 'manifest'):
        bind(saved[name])
    bind(plan['panel'])
    for judge in judges:
        role = judge['audiovisual_role']; packet_path = bind(plan['packets'][role]); packet = read(packet_path)
        coverage = bind(plan['coverage'][role]); validate_references(packet); motion_inputs(packet)
        coverage_data = read(coverage)
        for ref in references([packet, coverage_data]):
            require(file_sha(bind(ref['path'])) == ref['sha256'], 'current evidence reference changed')
        sequence = Path(packet['motion_sequence']['path'])
        for page in read(sequence)['pages']:
            require(file_sha(bind(sequence.parent / page['file'])) == page['sha256'], 'original sequence page changed')
        for row in coverage_data.get('sequences', []):
            for note in row.get('pages', []):
                if 'observation' in note:
                    bind(state_path.parent / 'image-tool-delivery' / Path(note['observation']['path']).name)
        require(packet.get('role') == role and str(packet.get('date')) == state['run_id'][:10]
                and packet['film']['sha256'] == saved['film_sha256'] and packet['board']['sha256'] == saved['board_sha256'], 'stale final packet')
        require(not image_coverage_problems(packet_path, coverage) and not evidence_problems(judge), 'independent access or original evidence incomplete')
        completed = [p for p in (state_path.parent / RECEIPTS).glob(file_sha(packet_path) + '-*.json')
                     if read(local(root, p)).get('report') == judge]
        require(len(completed) == 1, 'original completed scorer response is missing or changed')
        receipt = read(bind(completed[0]))
        require(receipt.get('schema') == 'dispatch_native_scorer_completion/1' and receipt.get('run_id') == state['run_id']
                and receipt.get('reservation_sha256') == digest(panels[0]) and receipt.get('role') == role
                and receipt.get('packet_sha256') == file_sha(packet_path) and receipt.get('report') == judge
                and json.loads(receipt['original_final_response']) == judge, 'original completed scorer response is missing or changed')
        claims = [bind(p) for p in (state_path.parent / 'worker-dispatch-claims').glob('*.json') if file_sha(p) == receipt.get('claim_sha256')]
        require(len(claims) == 1, 'completion needs its immutable dispatch claim')
        claim = read(claims[0])
        require(claim.get('schema') == 'dispatch_worker_dispatch_claim/1' and claim.get('run_id') == state['run_id']
                and claim.get('reservation_sha256') == digest(panels[0]) and claim.get('packet_sha256') == file_sha(packet_path)
                and claim.get('role') == role and claim.get('owner_sha256') == panels[0].get('publication_owner_sha256')
                and claim.get('epoch') == panels[0].get('publication_epoch') and receipt.get('session_sha256') == claim['owner_sha256'], 'completion claim changed owner or reservation')
        agents.add(receipt['agent_id']); identities.add(judge['reviewer_identity'])
        require(judge.get('packet_sha256') == file_sha(packet_path) and judge.get('film_sha256') == saved['film_sha256']
                and judge.get('board_sha256', judge.get('storyboard_sha256')) == saved['board_sha256'], 'unbound original final response')
        av = bind(packet['av_receipt']['path'])
        require(judge.get('audiovisual_receipt_sha256') == file_sha(av) and not av_problems(av, film, role), 'remaining audiovisual work is incomplete')
        bind(asset(av.parent, read(av)['response']))
        mandatory = complete_judge(judge, board, saved['film_sha256'], film_runtime) or mandatory
    require(len(agents) == 3 and len(identities) == 3 and mandatory, 'need independent completed scorers and an original mandatory failure')
    return {'plan': plan, 'files': bindings, 'panel_reservation_sha256': digest(panels[0]),
            'envelope_sha256': digest(state['resource_envelope']), 'production_finished': False, 'shipment_authorized': False}


def checkpoint_proof(state_path, evidence):
    import claude_checkpoint as cp
    root = state_path.parents[2]; state = read(state_path)
    tip = cp.remote_tip(root, state['run_id'], 'origin')
    require(bool(tip), 'final evidence has no remote checkpoint')
    manifest, ledger = cp.verify_checkpoint(root, tip, state['run_id'])
    require(ledger == cp.ledger_text(state, root).encode(), 'remote checkpoint does not contain the exact current ledger')
    files = {r['path']: r['sha256'] for r in manifest['files']}
    for path, sha in evidence['files'].items():
        if files.get(path) == sha:
            continue
        # Unchanged guides are Git source, not scratch: the saved source commit is a
        # parent of the remote checkpoint, so its verified blobs are durable as well.
        pin = manifest.get('source_pin', '')
        require(not path.startswith('out/') and len(pin) == 40 and all(c in '0123456789abcdef' for c in pin)
                and cp.git(root, 'merge-base', '--is-ancestor', pin, tip, check=False).returncode == 0
                and hashlib.sha256(cp.show(root, pin, path)).hexdigest() == sha,
                'remote checkpoint omits original final evidence: ' + path)
    return tip


def close(state_path, plan):
    from run_controller import event, save
    from publication_owner import require_owner
    import claude_checkpoint as cp
    require_owner(state_path); evidence = validate(state_path, plan); state = read(state_path)
    old = [r for r in state['events'] if r.get('kind') == KIND]
    if old:
        require(len(old) == 1 and old[0].get('evidence') == evidence, 'preserve the original expenditure closure')
    else:
        event(state, KIND, evidence=evidence); save(state_path, state)
    cp.save_with_recovery(state_path.parents[2], state_path, 'retain complete rejected final panel and closed expenditure')
    return checkpoint_proof(state_path, evidence)


def permits(payload, state_path, state):
    # Stop registries are in-flight only. Missing registries never prove absence.
    if (payload.get('background_tasks') != [] or payload.get('session_crons') != [] or not closed(state)):
        return False
    events = [r for r in state['events'] if r.get('kind') == KIND]
    require(len(events) == 1 and not state.get('terminal_state'), 'nonterminal closure identity changed')
    evidence = validate(state_path, events[0]['evidence']['plan'])
    require(evidence == events[0]['evidence'], 'closed final evidence changed')
    checkpoint_proof(state_path, evidence)
    return True


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--workspace', type=Path); parser.add_argument('--state', type=Path)
    parser.add_argument('--plan', type=Path)
    args = parser.parse_args()
    if args.workspace:
        payload = json.loads(sys.stdin.read(2 * 1024 * 1024 + 1))
        try:
            record(payload, args.workspace)
        except FileNotFoundError:
            pass  # Ordinary sessions have no armed production.
    else:
        require(args.state and args.plan, 'close expenditure with --state and --plan')
        print(json.dumps({'checkpoint': close(args.state.resolve(), read(args.plan)), 'shipped': False}))


if __name__ == '__main__':
    main()
