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


def sha(text):
    return hashlib.sha256(text.encode()).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False)


def eligible(state, plan):
    """Admission and replay use the retained original paired capture, never a new verdict."""
    try:
        proof = plan[FIELD]
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
    result['capture_charging'] = 'hook-and-entry'
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


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--state', required=True)
    p.add_argument('--plan', required=True)
    p.add_argument('--authorization', required=True)
    p.add_argument('--output', required=True)
    a = p.parse_args(argv)
    try:
        prepare(a.state, a.plan, a.authorization, a.output)
    except (OSError, ValueError, KeyError, TypeError, StopIteration) as exc:
        print('capture completion budget: ' + str(exc)); return 1
    print('capture completion budget: exact paired footprint bound; no charge or approval granted')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
