"""Reconcile a demonstrated capture forecast omission without replaying a film failure."""
import argparse
import copy
import hashlib
import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
POLICY = REPO / 'config/completion_forecast_v1.json'
POLICY_SHA256 = '6cde3d870132309506cd8b44b35aabd754936de93f866ae597a88cdc94acc4d1'
POST_PIVOT_POLICY = POLICY.with_name('completion_forecast_v2.json')
POST_PIVOT_POLICY_SHA256 = 'da01ca352c06c979e322e152cd8d9650c7c0bba05b09f42e9846d91e1a1ff8d0'
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
    """A source correction renews its complete comparison, including exact-phone failures."""
    from capture_completion_budget import FIELD as CAPTURE, PHONE_COMPARISON_SCHEMA
    registered = any(e.get('kind') == 'deliverable_registered' and e.get('review_only') is False
                     and e.get('film_sha256') == plan.get('failed_film_sha256')
                     for e in state.get('events', []))
    phone = any(e.get('kind') == 'mandatory_completion_grant'
                and e.get('reason') == 'modern-film-floor'
                and json.loads(e.get('plan_json', '{}')).get('failed_film_sha256') == plan.get('failed_film_sha256')
                for e in state.get('events', []))
    future = str(state.get('run_id', ''))[:10] >= '2026-10-20'
    if future:
        try:
            report = json.loads(Path(plan['failure_evidence']).read_text())
            phone = phone or (report.get('review_scope') == 'exact-muted-phone-preflight'
                and report.get('verdict') == 'revise'
                and report.get('reviewed_preflight_sha256') == plan.get('failed_film_sha256'))
        except (OSError, KeyError, ValueError, TypeError):
            pass  # Existing independent-evidence admission still refuses unreadable reports.
    visual = source_changes(plan) or (future and phone and plan.get('resources', {}).get('reboards'))
    if (str(state.get('run_id', ''))[:10] >= '2026-10-09' and (registered or phone) and visual
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
    if (plan.get(FIELD) or {}).get('schema') == 'dispatch_completion_forecast_evidence/2':
        return post_pivot_eligible(state, plan, report)
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
    post_pivot = plan[FIELD].get('schema') == 'dispatch_completion_forecast_evidence/2'
    policy = POST_PIVOT_POLICY if post_pivot else POLICY
    if policy.read_text() != plan[FIELD]['policy_json']:
        return ['completion forecast policy changed']
    if post_pivot:
        proof = plan[FIELD]
        try:
            root = Path(proof['checkout_root']).resolve()
            if root != REPO.resolve():
                return ['post-pivot reconciliation checkout changed']
            for name in ('repair_plan', 'pivot_review'):
                path = Path(proof[name + '_path']).resolve()
                if not path.is_relative_to(root) or path.read_text() != proof[name + '_json']:
                    return ['post-pivot retained evidence changed: ' + name]
            repair = json.loads(proof['repair_plan_json'])
            for row in repair['changed_inputs']:
                for key in ('path', 'before_path'):
                    path = Path(row[key]).resolve()
                    if (not path.is_relative_to(root)
                            or hashlib.sha256(path.read_bytes()).hexdigest() != row['before_sha256']):
                        return ['post-pivot source baseline changed before capacity']
        except (OSError, KeyError, ValueError, TypeError):
            return ['post-pivot reconciliation evidence is unavailable']
    return capture_problems(plan)


def required_counts(plan, required):
    result = dict(required)
    post_pivot = plan[FIELD].get('schema') == 'dispatch_completion_forecast_evidence/2'
    result.update(reboards=int(post_pivot), tts_calls=0, voice_directors=0)
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


def post_pivot_eligible(state, plan, report):
    """A paid planning continuation can expose a missing path, without recycling its debit."""
    from autonomous_completion import EVENT, mandatory_reason
    from capture_completion_budget import FIELD as CAPTURE, PHONE_COMPARISON_SCHEMA, comparison_eligible
    try:
        proof = plan[FIELD]
        index = proof['parent_grant_index']
        repair = json.loads(proof['repair_plan_json'])
        pivot = json.loads(proof['pivot_review_json'])
        if (plan.get('completion_reason') != REASON or plan.get('changed_inputs') or plan.get('resources')
                or state.get('mode') != 'production' or state.get('terminal_state') is not None
                or proof['run_id'] != state['run_id'] or str(state['run_id'])[:10] < '2026-10-09'
                or proof['policy_sha256'] != POST_PIVOT_POLICY_SHA256
                or sha(proof['policy_json']) != POST_PIVOT_POLICY_SHA256
                or type(index) is not int or not 0 <= index < len(state['events'])
                or any(sha(proof[key + '_json']) != proof[key + '_sha256'] for key in ('repair_plan', 'pivot_review'))
                or (plan.get(CAPTURE) or {}).get('schema') != PHONE_COMPARISON_SCHEMA
                or not comparison_eligible(state, plan) or repair.get(CAPTURE) != plan[CAPTURE]
                or not source_changes(repair) or repair.get('resources') != {'reboards': 1}
                or repair.get('repair_scope', 'standard') != 'standard'
                or report.get('review_scope') != 'exact-muted-phone-preflight' or report.get('verdict') != 'revise'
                or not report.get('reviewed_preflight_sha256')
                or repair.get('failure_evidence_sha256') != plan['failure_evidence_sha256']
                or repair.get('failed_film_sha256') != plan.get('failed_film_sha256')
                or repair.get('director_identity') != plan.get('director_identity')
                or repair.get('pivot_review', {}).get('sha256') != proof['pivot_review_sha256']
                or repair.get('pivot_review', {}).get('path') != proof['pivot_review_path']):
            return False
        parent = state['events'][index]
        original = json.loads(parent['plan_json'])
        if (parent.get('kind') != EVENT or parent.get('reason') != 'modern-film-floor'
                or sha(canonical(parent)) != proof['parent_grant_sha256']
                or sha(parent['plan_json']) != parent['plan_sha256'] or original.get(CAPTURE)
                or json.loads(parent['failure_evidence_json']) != report
                or parent['failure_evidence_sha256'] != plan['failure_evidence_sha256']
                or original.get('failed_film_sha256') != plan.get('failed_film_sha256')
                or original.get('director_identity') != plan.get('director_identity')):
            return False
        prefix = copy.deepcopy(state)
        prefix.update(events=state['events'][:index], usage=parent['usage_unchanged'],
                      escalation_ceiling=parent['previous_ceiling'])
        if mandatory_reason(prefix, original, parent['failure_evidence_json']) != 'modern-film-floor':
            return False
        later = state['events'][index + 1:]
        charges = [e for e in later if e.get('kind') == 'reserved']
        if (not charges or not any(e.get('resources') == {'storyboard_critics': 1} for e in charges)
                or any(set(e.get('resources', {})) - {'storyboard_critics', 'reported_tokens'} for e in charges)
                or any(e.get('kind') in ('repair_started', EVENT) for e in later)
                or proof['planning_charges_sha256'] != sha(canonical(charges))):
            return False
        previous = [e for e in state['events'][:index] if e.get('kind') == 'repair_started'
                    and e.get('repair_scope') != 'technical-integrity'
                    and (e.get('mechanism_id') == repair.get('mechanism_id')
                         or e.get('failure_family', 'unclassified') == repair.get('failure_family', 'unclassified'))]
        if (len(previous) < 2 or pivot.get('verdict') != 'pass'
                or not pivot.get('reviewer_identity') or pivot['reviewer_identity'] == repair['director_identity']
                or pivot.get('retired_mechanism_id') not in {e.get('mechanism_id') for e in previous}
                or pivot.get('retired_mechanism_id') == repair.get('mechanism_id')
                or pivot.get('replacement_mechanism_id') != repair.get('mechanism_id')
                or not {e['failure_sha256'] for e in previous} <= set(pivot.get('reviewed_failure_sha256', []))
                or len(pivot.get('visible_difference', '').strip()) < 40
                or len(pivot.get('source_basis', '').strip()) < 30):
            return False
        root = Path(proof['checkout_root']).resolve()
        for row in repair['changed_inputs']:
            relative = Path(row['path']).resolve().relative_to(root).as_posix()
            if not (relative.startswith('video-engine/src/modern/episodes/')
                    or relative == 'config/modern_episode_registry.json'
                    or relative in ('out/dispatch/storyboard.json', 'out/dispatch/opening-a.json', 'out/dispatch/opening-b.json')):
                return False
            if row.get('after_sha256') not in (None, row['before_sha256']):
                return False
        return True
    except (KeyError, ValueError, TypeError, AttributeError, IndexError):
        return False


def prepare(state_path, parent_index, comparison_path, output_path, repair_plan=None):
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
    paired = prepare_comparison(state_path, repair_plan or original_path, comparison_path, paired_path)
    plan = copy.deepcopy(paired)
    plan.update(completion_reason=REASON, changed_inputs=[], resources={})
    plan[FIELD] = {'schema': 'dispatch_completion_forecast_evidence/1', 'run_id': state['run_id'],
                   'policy_json': POLICY.read_text(), 'policy_sha256': POLICY_SHA256,
                   'parent_grant_index': parent_index, 'parent_grant_sha256': sha(canonical(parent))}
    if repair_plan:
        pivot_path = Path(paired['pivot_review']['path'])
        charges = [e for e in state['events'][parent_index + 1:] if e.get('kind') == 'reserved']
        plan[FIELD].update(schema='dispatch_completion_forecast_evidence/2',
            policy_json=POST_PIVOT_POLICY.read_text(), policy_sha256=POST_PIVOT_POLICY_SHA256,
            checkout_root=str(REPO.resolve()), planning_charges_sha256=sha(canonical(charges)),
            repair_plan_path=str(paired_path.resolve()), repair_plan_json=paired_path.read_text(),
            repair_plan_sha256=sha(paired_path.read_text()), pivot_review_path=str(pivot_path),
            pivot_review_json=pivot_path.read_text(), pivot_review_sha256=sha(pivot_path.read_text()))
    if (not eligible(state, plan, json.loads(parent['failure_evidence_json'])) or file_problems(plan)):
        raise ValueError('forecast reconciliation needs the retained underfunded grant and comparison, with the matching approved pivot before correction for post-pivot recovery')
    with output.open('x') as stream:
        json.dump(plan, stream, indent=2); stream.write('\n')
    return plan


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state', required=True)
    parser.add_argument('--parent-grant', type=int, required=True)
    parser.add_argument('--comparison', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--repair-plan', help='current independently approved pivot plan, before any correction')
    args = parser.parse_args()
    prepare(args.state, args.parent_grant, args.comparison, args.output, args.repair_plan)
    print('Bound the original underfunded grant and retained two-treatment comparison; no resources or review approval added.')
    if args.repair_plan:
        output = Path(args.output)
        print('After capacity admission, begin repair with ' + str(output.with_name(output.stem + '-comparison-plan.json')))


if __name__ == '__main__':
    main()
