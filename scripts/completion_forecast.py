"""Reconcile a demonstrated capture forecast omission without replaying a film failure."""
import argparse
import copy
import hashlib
import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
POLICY = REPO / 'config/completion_forecast_v1.json'
POLICY_SHA256 = '6cde3d870132309506cd8b44b35aabd754936de93f866ae597a88cdc94acc4d1'
FIELD = 'completion_forecast_evidence'
REASON = 'mandatory-capture-forecast-reconciliation'


def sha(text):
    return hashlib.sha256(text.encode()).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'))


def source_changes(plan):
    return any('/video-engine/src/modern/episodes/' in '/' + str(row.get('path', ''))
               for row in plan.get('changed_inputs', []) if isinstance(row, dict))


def admission_problems(state, plan):
    """New source-changing grants must include the existing complete comparison proof."""
    from capture_completion_budget import FIELD as CAPTURE, PHONE_COMPARISON_SCHEMA
    if (str(state.get('run_id', ''))[:10] >= '2026-10-09' and source_changes(plan)
            and (plan.get(CAPTURE) or {}).get('schema') != PHONE_COMPARISON_SCHEMA):
        return ['authored source correction requires the complete two-treatment capture budget before capacity: '
                'run capture_completion_budget.py --comparison <retained-comparison.json> on a new plan; '
                'preserve earlier plans and grants']
    return []


def identity(plan):
    proof = plan[FIELD]
    return sha(canonical({'scope': REASON, 'run_id': proof['run_id'],
                          'parent_grant_sha256': proof['parent_grant_sha256']}))


def eligible(state, plan, report):
    from autonomous_completion import EVENT, mandatory_reason
    from capture_completion_budget import (FIELD as CAPTURE, PHONE_COMPARISON_SCHEMA,
                                           comparison_eligible)
    try:
        proof = plan[FIELD]
        index = proof['parent_grant_index']
        if (plan.get('completion_reason') != REASON or plan.get('changed_inputs') or plan.get('resources')
                or state.get('mode') != 'production' or state.get('terminal_state') is not None
                or str(state.get('run_id', ''))[:10] < '2026-10-09'
                or proof['schema'] != 'dispatch_completion_forecast_evidence/1'
                or proof['run_id'] != state['run_id']
                or sha(proof['policy_json']) != proof['policy_sha256'] or proof['policy_sha256'] != POLICY_SHA256
                or type(index) is not int or not 0 <= index < len(state['events'])
                or (plan.get(CAPTURE) or {}).get('schema') != PHONE_COMPARISON_SCHEMA
                or not comparison_eligible(state, plan)):
            return False
        parent = state['events'][index]
        original = json.loads(parent['plan_json'])
        budget = json.loads(parent['precheck_json'])
        if (parent.get('kind') != EVENT or parent.get('reason') != 'modern-film-floor'
                or sha(canonical(parent)) != proof['parent_grant_sha256']
                or sha(parent['plan_json']) != parent['plan_sha256']
                or original.get(CAPTURE) or not source_changes(original)
                or parent['failure_evidence_sha256'] != plan['failure_evidence_sha256']
                or json.loads(parent['failure_evidence_json']) != report
                or plan.get('director_identity') != original.get('director_identity')
                or plan.get('failed_film_sha256') != original.get('failed_film_sha256')
                or budget['resources']['preflight_renders']['required'] != 3
                or budget['resources']['storyboard_critics']['required'] != 3):
            return False
        prefix = copy.deepcopy(state)
        prefix['events'] = state['events'][:index]
        prefix['usage'] = parent['usage_unchanged']
        prefix['escalation_ceiling'] = parent['previous_ceiling']
        if mandatory_reason(prefix, original, parent['failure_evidence_json']) != 'modern-film-floor':
            return False
        later = state['events'][index + 1:]
        starts = [e for e in later if e.get('kind') == 'repair_started']
        charges = [e for e in later if e.get('kind') == 'reserved']
        if (len(starts) > 1 or any(e.get('plan_sha256') != parent['plan_sha256'] for e in starts)
                or len(charges) > 1 or any(e.get('resources') != {'reboards': 1} for e in charges)
                or any(e.get('kind') == EVENT for e in later)):
            return False
        return True
    except (KeyError, ValueError, TypeError, AttributeError, IndexError):
        return False


def file_problems(plan):
    from capture_completion_budget import file_problems as capture_problems
    if POLICY.read_text() != plan[FIELD]['policy_json']:
        return ['completion forecast policy changed']
    return capture_problems(plan)


def required_counts(plan, required):
    result = dict(required)
    result.update(reboards=0, tts_calls=0, voice_directors=0)
    if 'image_generations' in result:
        result['image_generations'] = 0
    for key, count in json.loads(plan[FIELD]['policy_json'])['minimum_remaining'].items():
        result[key] = max(result[key], count)
    return result


def apply_budget(plan, budget):
    from repair_guard import budget_deficits
    result = copy.deepcopy(budget)
    required = required_counts(plan, {k: v['required'] for k, v in result['resources'].items()})
    for key, count in required.items():
        result['resources'][key]['required'] = count
    result['deficits'] = budget_deficits(result['resources'])
    result['feasible'] = not result['deficits'] and not result['errors']
    result['path'] = REASON
    return result


def valid_increment(plan, increments):
    policy = json.loads(plan[FIELD]['policy_json'])
    return (bool(increments) and set(increments) <= set(policy['increment_resources'])
            and all(type(n) is int and 0 < n <= policy['minimum_remaining'][k]
                    for k, n in increments.items()))


def prepare(state_path, parent_index, comparison_path, output_path):
    from run_controller import read_state
    from capture_completion_budget import prepare_comparison
    state = read_state(Path(state_path))
    parent = state['events'][parent_index]
    output = Path(output_path)
    if output.exists():
        raise ValueError('retain existing forecast evidence; select a new output path')
    # This immutable intermediate keeps the original admission text and proof intact.
    original_path = output.with_name(output.stem + '-original-plan.json')
    with original_path.open('x') as stream:
        stream.write(parent['plan_json'])
    paired_path = output.with_name(output.stem + '-comparison-plan.json')
    paired = prepare_comparison(state_path, original_path, comparison_path, paired_path)
    plan = copy.deepcopy(paired)
    plan.update(completion_reason=REASON, changed_inputs=[], resources={})
    plan[FIELD] = {'schema': 'dispatch_completion_forecast_evidence/1', 'run_id': state['run_id'],
                   'policy_json': POLICY.read_text(), 'policy_sha256': POLICY_SHA256,
                   'parent_grant_index': parent_index, 'parent_grant_sha256': sha(canonical(parent))}
    if (not eligible(state, plan, json.loads(parent['failure_evidence_json'])) or file_problems(plan)):
        raise ValueError('forecast reconciliation requires an actual underfunded source repair and retained comparison before later paid review or capture')
    with output.open('x') as stream:
        json.dump(plan, stream, indent=2); stream.write('\n')
    return plan


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state', required=True)
    parser.add_argument('--parent-grant', type=int, required=True)
    parser.add_argument('--comparison', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    prepare(args.state, args.parent_grant, args.comparison, args.output)
    print('Bound the original underfunded grant and retained two-treatment comparison; no resources or review approval added.')


if __name__ == '__main__':
    main()
