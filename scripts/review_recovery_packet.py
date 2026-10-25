"""Request a conditional independent pivot within the already paid third code review."""
import copy
import hashlib
import json
from pathlib import Path
import tempfile

SCHEMA = 'dispatch_conditional_code_recovery/1'


def read(path):
    return json.loads(Path(path).read_text())


def bound(path):
    path = Path(path).resolve()
    return {'path': str(path), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}


def previous_repairs(state):
    rows = [row for row in state.get('events', []) if row.get('kind') == 'repair_started'
            and row.get('repair_scope') not in {'technical-integrity', 'review-context', 'narration-performance'}]
    if len(rows) < 2:
        return []
    last = rows[-1]
    return [row for row in rows if row.get('mechanism_id') == last.get('mechanism_id')
            or row.get('failure_family') == last.get('failure_family')]


def recovery_requirements(state_path, packet, *, charged=False):
    """Supply facts and a response contract, never the independent replacement decision."""
    import review_limit
    import completion_progress
    state_path = Path(state_path).resolve(); state = read(state_path); repo = state_path.parents[2]
    if (not review_limit.path_budget_enabled(state) or review_limit.used(state) != (3 if charged else 2)
            or packet.get('role') != 'storyboard-critic'
            or packet.get('review_scope') == 'exact-muted-phone-preflight'):
        return None
    previous = previous_repairs(state)
    if len(previous) < 2:
        return None
    failures = []
    for row in previous:
        plans = [event['repair_plan'] for event in state['events'] if event.get('kind') == 'repair_authorized'
                 and event.get('repair_plan', {}).get('failure_evidence_sha256') == row['failure_sha256']]
        if not plans:
            raise ValueError('conditional recovery requires each original completed repair and failure')
        path = Path(str(plans[-1]['failure_evidence']).replace('{REPO}', str(repo)))
        ref = bound(path)
        if not path.resolve().is_relative_to(state_path.parent) or ref['sha256'] != row['failure_sha256']:
            raise ValueError('conditional recovery original failure changed')
        failures.append(ref)
    board_path = Path(packet['board']['path']).resolve()
    if board_path.parent != state_path.parent or bound(board_path) != packet['board']:
        raise ValueError('conditional recovery needs this edition current provisional board')
    board = read(board_path)
    claims = bound(state_path.parent / 'claims.json')
    if packet.get('claims') != claims:
        raise ValueError('conditional recovery source claims changed')
    from critic_gate import renderer_files
    sources = {}
    for ref in packet.get('treatments') or [packet['board']]:
        path = Path(ref['path'])
        if bound(path) != ref:
            raise ValueError('conditional recovery treatment changed')
        for source in renderer_files(read(path)):
            source = source.resolve()
            if source.is_relative_to(repo / 'video-engine/src'):
                sources[str(source)] = bound(source)
    if not sources:
        raise ValueError('conditional recovery needs the current callable source closure')
    director = (board.get('story_contract') or {}).get('director_identity')
    if not director:
        raise ValueError('conditional recovery requires the actual story director')
    return {'schema': SCHEMA, 'run_id': state['run_id'], 'critic_attempt': 3,
            'director_identity': director, 'failure_family': previous[-1].get('failure_family', 'unclassified'),
            'prior_failures': failures, 'retired_mechanism_ids': sorted({row['mechanism_id'] for row in previous}),
            'source_evidence': claims, 'current_inputs': [sources[key] for key in sorted(sources)],
            'whole_scene_required': completion_progress.replacement_required(state),
            'response_contract': 'Return ordinary original A/B code reports. If REVISE still requires another '
                'correction, independently assess a source-backed replacement in recovery_review within this same '
                'handback. Include verdict, reviewer_identity, reviewed_failure_sha256 covering every prior failure, '
                'retired_mechanism_id, a different replacement_mechanism_id, source_basis and visible_difference. '
                'When whole_scene_required, include retained_replacement with the existing '
                'dispatch_retained_scene_replacement/1 schema, kind whole-scene-replacement, source_evidence, '
                'complete retired_inputs (path, before_path, before_sha256) and new replacement_paths under '
                'video-engine/src. Existing unchanged source paths may be their own pinned before_path; retain '
                'those files and bytes. Propose a credible different implementation, not numeric edits or renamed '
                'staging. Return REVISE if no credible replacement is supported; no approval is prescribed. '
                'This decision approves only the named correction plan. Current code and both actual silent '
                'films still need the combined fourth review; measured timed phone remains the fifth.'}


def recovery_problems(state_path, original):
    """Run unchanged recurrence gates on the original third critic's conditional decision."""
    try:
        state_path = Path(state_path).resolve(); state = read(state_path)
        packet = read(original['packet']['path']); report = original['report']
        request, pivot = packet.get('conditional_recovery'), report.get('recovery_review')
        from combined_review import code_reports
        reports = code_reports(report)
        reviewer_labels = {row.get('reviewer_identity') for row in [report, *reports]
                           if isinstance(row, dict) and row.get('reviewer_identity')}
        claim = read(original['claim']['path']); index = claim['reservation_event_index']
        prefix = copy.deepcopy(state); prefix['events'] = state['events'][:index + 1]
        prefix.pop('active_repair', None)
        prefix['usage'] = {name: sum(e.get('resources', {}).get(name, 0) for e in prefix['events']
                                    if e.get('kind') == 'reserved') for name in state['usage']}
        previous = previous_repairs(prefix)
        if len(previous) < 2:
            return []
        if (not isinstance(request, dict) or request.get('schema') != SCHEMA
                or request.get('run_id') != state['run_id'] or request.get('critic_attempt') != 3
                or {ref['sha256'] for ref in request['prior_failures']} != {r['failure_sha256'] for r in previous}
                or request['retired_mechanism_ids'] != sorted({r['mechanism_id'] for r in previous})
                or not all(row.get('review_scope') == 'code-plan' for row in reports)
                or not any(row.get('verdict') == 'revise' and row.get('blocking_defects') for row in reports)
                or not isinstance(pivot, dict) or pivot.get('reviewer_identity') not in reviewer_labels):
            return ['third code review lacks its original independently assessed conditional recovery']
        for ref in request['prior_failures'] + [request['source_evidence']]:
            if bound(ref['path']) != ref:
                return ['conditional recovery retained source or original failure changed']
        plan = {'repair_scope': 'standard', 'director_identity': request['director_identity'],
                'mechanism_id': pivot.get('replacement_mechanism_id'), 'failure_family': request['failure_family'],
                'failure_evidence_sha256': hashlib.sha256(json.dumps(report, sort_keys=True).encode()).hexdigest(),
                'changed_inputs': [{'path': packet['board']['path']}], 'resources': {'reboards': 1}}
        import completion_progress
        if request.get('whole_scene_required') != completion_progress.replacement_required(prefix):
            return ['conditional recovery omits the actual whole-scene replacement requirement']
        if request.get('whole_scene_required'):
            proof = pivot.get(completion_progress.FIELD) or {}
            current = {ref['path']: ref['sha256'] for ref in request['current_inputs']}
            if proof.get('source_evidence') != request['source_evidence'] or any(
                    current.get(row.get('path')) != row.get('before_sha256') for row in proof.get('retired_inputs', [])):
                return ['conditional recovery must retire its original inspected source and retain the same claims']
            plan[completion_progress.FIELD] = proof
        # This temporary extraction is the original nested JSON, not a new assessment.
        # The production plan later references its durable unchanged extraction.
        with tempfile.TemporaryDirectory(prefix='dispatch-pivot-proof-') as temporary:
            path = Path(temporary) / 'original-pivot.json'; path.write_text(json.dumps(pivot, sort_keys=True) + '\n')
            plan['pivot_review'] = bound(path)
            from repair_guard import plan_problems
            return plan_problems(prefix, plan)
    except (OSError, ValueError, KeyError, TypeError, IndexError) as exc:
        return ['original conditional recovery is unavailable: ' + str(exc)]
