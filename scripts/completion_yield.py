"""Close proven exhausted expenditure without completing production.

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
EXHAUSTED_REQUIRED_REVIEW = 'exhausted-required-review-before-film'
ROLES = ('picture', 'story', 'sound')
RECEIPTS = 'native-scorer-completions'
JUDGMENTS = ('score', 'weighted_score', 'ship', 'verdict', 'axes', 'hard_fails', 'defects',
             'attention_review', 'modern_observations', 'narration_picture_observations', 'bounded_release')


def read(path):
    return json.loads(Path(path).read_text())


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def require(condition, reason):
    if not condition:
        raise ValueError(reason)


def retains(original, current):
    if isinstance(original, dict):
        return isinstance(current, dict) and all(k in current and retains(v, current[k]) for k, v in original.items())
    return type(original) is type(current) and original == current


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
    try:
        report = json.loads(message)
    except (TypeError, ValueError):
        handbacks = list(folder.glob('handback-' + key + '-*.json'))
        if not handbacks:
            return  # Missing final content is not completed review evidence.
        handback = max(handbacks, key=lambda path: path.stat().st_mtime_ns)
        message = read(local(state_path.parents[2], handback))['message']
        report = json.loads(message)
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
        for previous in (state_path.parent / RECEIPTS).glob(file_sha(packet_path) + '-*.json'):
            original = read(bind(previous))
            require(original.get('agent_id') == receipt.get('agent_id')
                    and original.get('claim_sha256') == receipt.get('claim_sha256')
                    and all(k not in original['report'] or retains(original['report'][k], judge.get(k)) for k in JUDGMENTS),
                    'metadata completion cannot replace its original scorer or change an original judgment')
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
    if evidence.get('plan', {}).get('reason') == EXHAUSTED_REQUIRED_REVIEW:
        claims = lambda rows: {p: h for p, h in rows.items() if p.startswith('out/dispatch/worker-dispatch-claims/')}
        require(claims(files) == claims(evidence['files']),
                'retain every original checkpoint worker claim before closing expenditure')
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


def validate_exhausted_review(state_path, plan):
    """Retain an impossible pre-film path without authorizing another attempt or shipment."""
    from run_controller import digest as file_sha
    from review_limit import reached, used, FINAL_PACKET_FROM
    from manual_codex_repair import EVENT as manual_event
    root = state_path.parents[2]; state = read(state_path); events = state['events']
    require(set(plan) == {'reason', 'failure_evidence'} and plan['reason'] == EXHAUSTED_REQUIRED_REVIEW,
            'exhausted-review closure needs its original failure evidence')
    require(str(state.get('run_id', ''))[:10] >= FINAL_PACKET_FROM and reached(state)
            and not state.get('terminal_state') and not state.get('shipment')
            and not any(e.get('kind') == manual_event for e in events),
            'only an exhausted ordinary daily production can close this path')
    require(not state.get('deliverable') and not (state_path.parent / 'film.mp4').exists()
            and all(state.get('usage', {}).get(k, 0) == 0 for k in
                    ('full_renders', 'cleanup_renders', 'rescue_renders', 'panel_rounds', 'scorer_calls')),
            'this closure cannot discard an existing native film or final panel')
    frozen = [e for e in events if e.get('kind') == 'resource_envelope_frozen']
    require(len(frozen) == 1 and frozen[0].get('envelope') == state.get('resource_envelope'),
            'preserve the original frozen resource envelope')
    reservations = [e for e in events if e.get('kind') == 'reserved'
                    and e.get('resources', {}).get('storyboard_critics')]
    require(all(type(e['resources']['storyboard_critics']) is int
                and e['resources']['storyboard_critics'] > 0 for e in reservations)
            and sum(e['resources']['storyboard_critics'] for e in reservations) == used(state),
            'cumulative review usage must equal the original reservations')
    # Conservatively retain any final reservation, including an unclaimed or ambiguous one.
    # A failed final phone has a different completion path; this reason cannot retire it.
    require(not any('final_timed_phone' in e for e in reservations),
            'an existing reserved final timed-phone attempt must be resolved first')
    bindings = {}
    def bind(value):
        path = local(root, str(value).replace('{REPO}', str(root)))
        bindings[str(path.relative_to(root))] = file_sha(path)
        return path
    failure = bind(plan['failure_evidence']); failure_sha = file_sha(failure)
    originals = [(i, e) for i, e in enumerate(events) if e.get('kind') == 'repair_authorized'
                 and e.get('repair_plan', {}).get('failure_evidence_sha256') == failure_sha
                 and local(root, str(e['repair_plan']['failure_evidence']).replace('{REPO}', str(root))) == failure]
    require(bool(originals) and failure.stat().st_size > 0,
            'closure requires an actual failure already bound by the original repair ledger')
    # Keep every original worker claim. Never infer completion from a missing task or reuse it.
    folder = state_path.parent / 'worker-dispatch-claims'
    require(not folder.is_symlink() and any(folder.glob('*.json')), 'retain the original worker claims')
    for path in sorted(folder.glob('*.json')):
        claim = read(bind(path)); index = claim.get('reservation_event_index')
        require(type(index) is int and 0 <= index < len(events), 'worker claim reservation is missing')
        event = events[index]
        require(claim.get('schema') == 'dispatch_worker_dispatch_claim/1'
                and claim.get('run_id') == state['run_id'] and event.get('kind') == 'reserved'
                and claim.get('reservation_sha256') == digest(event)
                and claim.get('owner_sha256') == event.get('publication_owner_sha256')
                and claim.get('epoch') == event.get('publication_epoch'), 'original worker claim changed')
    # Any exact-phone verdict is conservatively retained for its existing completion path.
    # This route only handles the observed pre-final-phone failure, not rejected finished work.
    report = state_path.parent / 'storyboard_critic.json'
    require(report.is_file(), 'retain the actual last critic report before closing expenditure')
    require(read(bind(report)).get('review_scope') == 'code-plan',
            'retain the last code-plan report; an existing exact-phone or unknown review cannot use this closure')
    closure_indexes = [i for i, e in enumerate(events) if e.get('kind') == KIND]
    require(len(closure_indexes) <= 1, 'preserve the single expenditure closure')
    prefix = events[:closure_indexes[0]] if closure_indexes else events
    index, original = originals[-1]
    return {'plan': plan, 'files': bindings, 'failure_event_index': index,
            'failure_event_sha256': digest(original), 'ledger_prefix_sha256': digest(prefix),
            'paid_usage_sha256': digest({k: v for k, v in state['usage'].items() if k != 'reported_tokens'}),
            'envelope_sha256': digest(state['resource_envelope']),
            'production_finished': False, 'shipment_authorized': False}


def validate_plan(state_path, plan):
    if plan.get('reason') == EXHAUSTED_REQUIRED_REVIEW:
        return validate_exhausted_review(state_path, plan)
    return validate(state_path, plan)


def close(state_path, plan):
    from run_controller import event, save
    from publication_owner import require_owner
    import claude_checkpoint as cp
    require_owner(state_path); evidence = validate_plan(state_path, plan); state = read(state_path)
    if plan.get('reason') == EXHAUSTED_REQUIRED_REVIEW:
        checkpoint_proof(state_path, evidence)  # Original failure and ledger must already be durable.
    old = [r for r in state['events'] if r.get('kind') == KIND]
    if old:
        require(len(old) == 1 and old[0].get('evidence') == evidence, 'preserve the original expenditure closure')
    else:
        event(state, KIND, evidence=evidence); save(state_path, state)
    cp.save_with_recovery(state_path.parents[2], state_path, 'retain original failure and closed expenditure')
    return checkpoint_proof(state_path, evidence)


def permits(payload, state_path, state):
    # Stop registries are in-flight only. Missing registries never prove absence.
    if (payload.get('background_tasks') != [] or payload.get('session_crons') != [] or not closed(state)):
        return False
    events = [r for r in state['events'] if r.get('kind') == KIND]
    require(len(events) == 1 and not state.get('terminal_state'), 'nonterminal closure identity changed')
    evidence = validate_plan(state_path, events[0]['evidence']['plan'])
    require(evidence == events[0]['evidence'], 'closed final evidence changed')
    checkpoint_proof(state_path, evidence)
    return True


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--workspace', type=Path); parser.add_argument('--state', type=Path)
    parser.add_argument('--plan', type=Path)
    parser.add_argument('--exhausted-required-review', type=Path, metavar='ORIGINAL_FAILURE')
    args = parser.parse_args()
    if args.workspace:
        payload = json.loads(sys.stdin.read(2 * 1024 * 1024 + 1))
        try:
            record(payload, args.workspace)
        except FileNotFoundError:
            pass  # Ordinary sessions have no armed production.
    else:
        require(args.state and bool(args.plan) != bool(args.exhausted_required_review),
                'close expenditure with --state and exactly one --plan or --exhausted-required-review')
        plan = (read(args.plan) if args.plan else {'reason': EXHAUSTED_REQUIRED_REVIEW,
                'failure_evidence': str(args.exhausted_required_review.resolve())})
        print(json.dumps({'checkpoint': close(args.state.resolve(), plan), 'shipped': False}))


if __name__ == '__main__':
    main()
