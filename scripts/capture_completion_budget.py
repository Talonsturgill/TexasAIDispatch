"""Fund the actual hook and entry charges without rewriting earlier capacity grants."""
import argparse
import copy
import hashlib
import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
POLICY = REPO / 'config/capture_completion_budget_v1.json'
POLICY_SHA256 = 'c09e8d773255c0cc827a7cbb37f5f330a10792f9b278fd961a2b09591e7d0b80'
FIELD = 'capture_completion_budget'
SCHEMA = 'dispatch_capture_completion_budget_evidence/1'
COMPARISON_POLICY = POLICY.with_name('capture_completion_budget_v2.json')
COMPARISON_POLICY_SHA256 = 'd70e4e199c3acf49a4635087412cb9090e758810776c320ffb9ef290991f9d21'
COMPARISON_SCHEMA = 'dispatch_capture_completion_budget_evidence/2'
PHONE_COMPARISON_POLICY = POLICY.with_name('capture_completion_budget_v3.json')
PHONE_COMPARISON_POLICY_SHA256 = 'a24e8f717afde205194f77dcc47756285e7e257fe2f8e2dea0b957c1ce61d0e8'
PHONE_COMPARISON_SCHEMA = 'dispatch_capture_completion_budget_evidence/3'
CURRENT_COMPARISON_SCHEMA = PHONE_COMPARISON_SCHEMA
COMPARISON_POLICIES = {
    COMPARISON_SCHEMA: (COMPARISON_POLICY, COMPARISON_POLICY_SHA256),
    PHONE_COMPARISON_SCHEMA: (PHONE_COMPARISON_POLICY, PHONE_COMPARISON_POLICY_SHA256),
}


def sha(text):
    return hashlib.sha256(text.encode()).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False)


def comparison_eligible(state, plan):
    """A retained paid comparison funds a fresh complete path, never reuses its verdict."""
    try:
        proof = plan[FIELD]
        policy = COMPARISON_POLICIES.get(proof.get('schema'))
        if policy is None:
            return False
        _, policy_sha256 = policy
        receipt = json.loads(proof['comparison_json'])
        reservation = receipt['reservation']
        entry_index, hook_index = proof['entry_event_index'], proof['hook_event_index']
        if (proof['run_id'] != state['run_id']
                or str(state['run_id'])[:10] < '2026-10-09'
                or state.get('mode') != 'production' or state.get('terminal_state') is not None
                or proof['policy_sha256'] != policy_sha256
                or sha(proof['policy_json']) != policy_sha256
                or sha(proof['comparison_json']) != proof['comparison_sha256']
                or receipt['schema'] != 'dispatch-opening-comparison/1'
                or receipt['inspection_pass'] is not True or receipt['inspection_problems']
                or reservation['run_id'] != state['run_id']
                or reservation['event_index'] != entry_index
                or any(type(i) is not int for i in (hook_index, entry_index))
                or not 0 <= hook_index < entry_index < len(state['events'])
                or 'capture_retry_evidence' in plan):
            return False
        options = receipt['options']
        if len(options) != 2 or {o['id'] for o in options} != {'a', 'b'}:
            return False
        expected = {(o['id'], k): o[k]['sha256'] for o in options for k in ('board', 'film')}
        files = proof['retained_files']
        if (len(files) != 4 or {(f['option'], f['kind']): f['sha256'] for f in files} != expected
                or any(len(h) != 64 for h in expected.values())
                or any(len({o[k]['sha256'] for o in options}) != 2 for k in ('board', 'film'))):
            return False
        hook, entry = (state['events'][i] for i in (hook_index, entry_index))
        for name, row in (('hook', hook), ('entry', entry)):
            if (row.get('kind') != 'reserved' or row.get('resources') != {'preflight_renders': 1}
                    or sha(canonical(row)) != proof[name + '_event_sha256']):
                return False
        if (hook['note'] != 'capture authorization reservation for opening comparison'
                or entry['note'] != 'two opening comparison batch'
                or entry['preflight_identity'] != reservation['identity']
                or hook['at'] > entry['at']
                or any(e.get('kind') == 'reserved' and e.get('resources', {}).get('preflight_renders')
                       for e in state['events'][hook_index + 1:entry_index])):
            return False
        return True
    except (KeyError, ValueError, TypeError, IndexError, AttributeError):
        return False


def eligible(state, plan):
    """Admission and replay use the retained original paired capture, never a new verdict."""
    try:
        proof = plan[FIELD]
        if proof.get('schema') in COMPARISON_POLICIES:
            return comparison_eligible(state, plan)
        if (proof['schema'] != SCHEMA or proof['run_id'] != state['run_id']
                or str(state['run_id'])[:10] < '2026-10-09'
                or state.get('mode') != 'production' or state.get('terminal_state') is not None
                or proof['policy_sha256'] != POLICY_SHA256
                or sha(proof['policy_json']) != POLICY_SHA256
                or sha(proof['authorization_json']) != proof['authorization_sha256']
                or 'capture_retry_evidence' in plan):
            return False
        auth = json.loads(proof['authorization_json'])
        if (auth['schema'] != 'dispatch_capture_authorization/2' or auth['allowed'] is not True
                or auth['render_reservation']['resource'] != 'full_renders'
                or len(auth['commands']) != 1 or not auth['commands'][0]['consumed']
                or 'scripts/run_with_env.sh' not in auth['commands'][0]['text']
                or 'scripts/render_dispatch.sh' not in auth['commands'][0]['text']
                or sha(auth['commands'][0]['text']) != auth['commands'][0]['id']
                or auth['headroom']['passed'] is not True
                or auth['headroom']['free_gib'] < auth['headroom']['required_free_gib']
                or auth['housekeeping']['exit_code'] != 0
                or auth['art_receipts_recorded'] is not True):
            return False
        indexes = [proof[k + '_event_index'] for k in ('hook', 'entry', 'deliverable')]
        if (any(type(i) is not int or i < 0 or i >= len(state['events']) for i in indexes)
                or indexes != sorted(set(indexes))):
            return False
        rows = [state['events'][i] for i in indexes]
        if any(sha(canonical(row)) != proof[k + '_event_sha256']
               for k, row in zip(('hook', 'entry', 'deliverable'), rows)):
            return False
        hook, entry, delivered = rows
        if (hook['kind'] != 'reserved' or hook['resources'] != {'full_renders': 1}
                or entry['kind'] != 'reserved' or entry['resources'] != {'full_renders': 1}
                or entry['note'] != 'full-resolution Dispatch render'
                or sha(canonical(hook)) != auth['render_reservation']['event_sha256']
                or hook['at'] != auth['render_reservation']['at']
                or not (hook['at'] <= auth['commands'][0]['consumed'] <= entry['at'] < delivered['at'])
                or delivered['kind'] != 'deliverable_registered' or delivered['review_only'] is not False
                or delivered['film_sha256'] != plan['failed_film_sha256']
                or len(delivered['film_sha256']) != 64
                or len(delivered['manifest_sha256']) != 64):
            return False
        # A second native attempt cannot be paired with the first attempt's authorization.
        between = state['events'][indexes[0] + 1:indexes[2]]
        if sum(e.get('resources', {}).get('full_renders', 0)
               for e in between if e.get('kind') == 'reserved') != 1:
            return False
        return True
    except (KeyError, ValueError, TypeError, IndexError, AttributeError):
        return False


def file_problems(plan):
    try:
        proof = plan[FIELD]
        if proof.get('schema') in COMPARISON_POLICIES:
            policy, _ = COMPARISON_POLICIES[proof['schema']]
            if (policy.read_text() != proof['policy_json']
                    or Path(proof['comparison_path']).read_text() != proof['comparison_json']
                    or any(hashlib.sha256(Path(f['path']).read_bytes()).hexdigest() != f['sha256']
                           for f in proof['retained_files'])):
                return ['retained comparison policy, boards or film bytes changed']
            return []
        if (POLICY.read_text() != proof['policy_json']
                or Path(proof['authorization_path']).read_text() != proof['authorization_json']):
            return ['capture completion policy or retained authorization changed']
    except (OSError, KeyError, TypeError):
        return ['capture completion policy or retained authorization is unavailable']
    return []


def required_counts(state, plan, required):
    result = dict(required)
    if FIELD not in plan:
        return result
    if not eligible(state, plan):
        raise ValueError('capture completion budget requires the actual consumed paired native capture')
    if plan[FIELD].get('schema') in COMPARISON_POLICIES:
        for name, count in json.loads(plan[FIELD]['policy_json'])['minimum_remaining'].items():
            result[name] = max(result[name], count)
        return result
    units = json.loads(plan[FIELD]['policy_json'])['charged_units_per_capture']
    for name, count in units.items():
        result[name] *= count
    return result


def apply_budget(state, plan, budget):
    """Only the two capture resource requirements change; usage and remaining values do not."""
    result = copy.deepcopy(budget)
    if FIELD not in plan or not result.get('resources'):
        return result
    required = required_counts(state, plan, {k: v['required'] for k, v in result['resources'].items()})
    for name, count in required.items():
        result['resources'][name]['required'] = count
    result['deficits'] = {k: row['required'] - row['remaining']
                         for k, row in result['resources'].items() if row['required'] > row['remaining']}
    result['feasible'] = not result['deficits'] and not result['errors']
    result['capture_charging'] = ('renewed-two-treatment-complete-path'
        if plan[FIELD].get('schema') in COMPARISON_POLICIES else 'hook-and-entry')
    return result


def prepare(state_path, plan_path, authorization_path, output_path):
    from run_controller import read_state
    state = read_state(Path(state_path))
    plan = json.loads(Path(plan_path).read_text())
    if FIELD in plan:
        raise ValueError('retain the original plan; a capture budget cannot be attached twice')
    raw = Path(authorization_path).read_text()
    auth = json.loads(raw)
    events = state['events']
    hook = next(i for i, row in enumerate(events)
                if sha(canonical(row)) == auth['render_reservation']['event_sha256'])
    entry = next(i for i in range(hook + 1, len(events))
                 if events[i].get('kind') == 'reserved'
                 and events[i].get('resources') == {'full_renders': 1})
    delivered = next(i for i in range(entry + 1, len(events))
                     if events[i].get('kind') == 'deliverable_registered'
                     and events[i].get('film_sha256') == plan['failed_film_sha256'])
    proof = {'schema': SCHEMA, 'run_id': state['run_id'], 'policy_json': POLICY.read_text(),
             'policy_sha256': POLICY_SHA256, 'authorization_path': str(Path(authorization_path).resolve()),
             'authorization_json': raw, 'authorization_sha256': sha(raw)}
    for name, index in zip(('hook', 'entry', 'deliverable'), (hook, entry, delivered)):
        proof[name + '_event_index'] = index
        proof[name + '_event_sha256'] = sha(canonical(events[index]))
    plan[FIELD] = proof
    from autonomous_completion import mandatory_reason
    evidence = Path(plan['failure_evidence']).read_text()
    if (not eligible(state, plan) or file_problems(plan)
            or mandatory_reason(state, plan, evidence) not in {
                'retained-integrity', 'minimum-action', 'modern-film-floor'}):
        raise ValueError('paired capture funding needs existing exact independent mandatory film evidence')
    with Path(output_path).open('x') as stream:
        json.dump(plan, stream, indent=2); stream.write('\n')
    return plan


def prepare_comparison(state_path, plan_path, comparison_path, output_path):
    from run_controller import read_state
    from autonomous_completion import mandatory_reason
    state = read_state(Path(state_path))
    plan = json.loads(Path(plan_path).read_text())
    if FIELD in plan:
        raise ValueError('retain the original plan; a capture budget cannot be attached twice')
    comparison = Path(comparison_path).resolve()
    raw = comparison.read_text()
    receipt = json.loads(raw)
    entry_index = receipt['reservation']['event_index']
    candidates = [i for i in range(entry_index) if state['events'][i].get('kind') == 'reserved'
                  and state['events'][i].get('resources', {}).get('preflight_renders')]
    hook_index = candidates[-1]
    policy, policy_sha256 = COMPARISON_POLICIES[CURRENT_COMPARISON_SCHEMA]
    proof = {'schema': CURRENT_COMPARISON_SCHEMA, 'run_id': state['run_id'],
             'policy_json': policy.read_text(), 'policy_sha256': policy_sha256,
             'comparison_path': str(comparison), 'comparison_json': raw,
             'comparison_sha256': sha(raw), 'retained_files': []}
    for name, index in (('hook', hook_index), ('entry', entry_index)):
        proof[name + '_event_index'] = index
        proof[name + '_event_sha256'] = sha(canonical(state['events'][index]))
    for option in receipt['options']:
        for kind in ('board', 'film'):
            path = (comparison.parent / option[kind]['file']).resolve()
            if not path.is_relative_to(comparison.parent):
                raise ValueError('retained comparison files must stay inside their package')
            proof['retained_files'].append({'option': option['id'], 'kind': kind,
                'path': str(path), 'sha256': option[kind]['sha256']})
    plan[FIELD] = proof
    evidence = Path(plan['failure_evidence']).read_text()
    if (not comparison_eligible(state, plan) or file_problems(plan)
            or mandatory_reason(state, plan, evidence) not in {
                'retained-integrity', 'minimum-action', 'modern-film-floor',
                'mandatory-code-integrity', 'finish-current', 'mandatory-source-pivot'}):
        raise ValueError('comparison funding needs retained paid bytes and independent mandatory admission')
    with Path(output_path).open('x') as stream:
        json.dump(plan, stream, indent=2); stream.write('\n')
    return plan


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--state', required=True)
    p.add_argument('--plan', required=True)
    source = p.add_mutually_exclusive_group(required=True)
    source.add_argument('--authorization')
    source.add_argument('--comparison')
    p.add_argument('--output', required=True)
    a = p.parse_args(argv)
    try:
        if a.comparison:
            prepare_comparison(a.state, a.plan, a.comparison, a.output)
        else:
            prepare(a.state, a.plan, a.authorization, a.output)
    except (OSError, ValueError, KeyError, TypeError, IndexError, AttributeError, StopIteration) as exc:
        print('capture completion budget: ' + str(exc)); return 1
    print('capture completion budget: exact paired footprint bound; no charge or approval granted')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
