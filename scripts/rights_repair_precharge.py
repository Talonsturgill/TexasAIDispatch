"""Recover one unused rights reboard after the unsupported family refused begin-repair.

The real charge stays in place. Only the latest paid reservation from the same retained
mandatory grant can be bound, while every original data-only baseline is still unchanged.
This grants no capacity, edits, reviews or release approval.
"""
from pathlib import Path
import hashlib
import json

SCHEMA = 'dispatch_unused_rights_reboard/1'
DATA_INPUTS = {'out/dispatch/storyboard.json', 'out/dispatch/opening-a.json', 'out/dispatch/opening-b.json'}


def event_sha(row):
    return hashlib.sha256(json.dumps(row, sort_keys=True).encode()).hexdigest()


def baselines(plan):
    result = {}
    for row in plan.get('changed_inputs', []):
        parts = Path(row['path']).parts
        positions = [i for i in range(len(parts)-1) if parts[i:i+2] == ('out', 'dispatch')]
        relative = '/'.join(parts[positions[-1]:]) if positions else ''
        if relative not in DATA_INPUTS or relative in result:
            raise ValueError('unused rights reboard recovery requires distinct current credit-board inputs')
        result[relative] = row['before_sha256']
    if 'out/dispatch/storyboard.json' not in result:
        raise ValueError('unused rights reboard recovery requires the current board baseline')
    return result


def reference(events, receipt, plan):
    if plan.get('repair_scope') != 'technical-integrity' or plan.get('failure_family') != 'rights':
        raise ValueError('unused reboard recovery is limited to independently classified rights repair')
    paid = [i for i, row in enumerate(events) if row.get('kind') == 'reserved' and row.get('resources')]
    if not paid:
        raise ValueError('no unused charged reboard exists')
    index = paid[-1]; reservation = events[index]
    if reservation.get('resources') != {'reboards': 1} or event_sha(reservation) != receipt:
        raise ValueError('unused rights reboard must be the exact latest paid reservation')
    grants = [i for i, row in enumerate(events[:index]) if row.get('kind') == 'mandatory_completion_grant'
              and row.get('failure_evidence_sha256') == plan.get('failure_evidence_sha256')]
    if not grants:
        raise ValueError('unused rights reboard needs its original retained mandatory completion grant')
    grant_index = grants[-1]; grant = events[grant_index]
    original = json.loads(grant['plan_json'])
    if (original.get('repair_scope') != 'technical-integrity' or original.get('failure_family') != 'rights'
            or grant.get('reason') != 'retained-integrity'
            or grant.get('resource_increments', {}).get('reboards') != 1
            or baselines(original) != baselines(plan)
            or any(i > grant_index for i in paid[:-1])
            or any(row.get('kind') in {'repair_started', 'repair_authorized'}
                   for row in events[grant_index+1:])):
        raise ValueError('unused rights reboard was used, followed other paid work or lost its original baselines')
    return {'schema': SCHEMA, 'reservation_event_index': index, 'reservation_sha256': receipt,
            'grant_event_index': grant_index, 'failure_evidence_sha256': plan['failure_evidence_sha256'],
            'baselines': baselines(plan)}


def from_started(events, start):
    row = events[start]; receipt = row['prepaid_reboard']
    plan = {'repair_scope': row.get('repair_scope'), 'failure_family': row.get('failure_family'),
            'failure_evidence_sha256': row.get('failure_sha256'), 'changed_inputs': row.get('baselines', [])}
    expected = reference(events[:start], receipt['reservation_sha256'], plan)
    if receipt != expected or 'reboards' in row.get('grants', {}):
        raise ValueError('prepaid rights repair lost its exact unused charge or granted another reboard')
    return expected


def active_reference(state):
    current = state.get('active_repair') or {}
    if current.get('prepaid_reboard') is None:
        return None
    start = max(i for i, row in enumerate(state['events']) if row.get('kind') == 'repair_started')
    expected = from_started(state['events'], start)
    if (current['prepaid_reboard'] != expected or current.get('repair_scope') != 'technical-integrity'
            or state['usage']['reboards'] != current['reboards_before'] + 1):
        raise ValueError('active rights repair lost its one exact prepaid reboard')
    return expected


if __name__ == '__main__':
    import argparse
    from creative_release import technical_repair_problems
    from production_lifecycle import active, allowance_problems
    from run_controller import digest, load_json, read_state
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state', type=Path, required=True)
    parser.add_argument('--plan', type=Path, required=True)
    parser.add_argument('--receipt', required=True)
    args = parser.parse_args()
    try:
        state, plan = read_state(args.state), load_json(args.plan)
        errors = allowance_problems(state) + technical_repair_problems(state, plan)
        if not active(state) or state.get('active_repair'):
            errors.append('unused rights reboard requires active production without an open repair')
        for row in plan.get('changed_inputs', []):
            if any(digest(Path(row[field])) != row['before_sha256'] for field in ('path', 'before_path')):
                errors.append('unused rights reboard baseline changed before begin-repair')
        if errors:
            raise ValueError('; '.join(errors))
        print(json.dumps(reference(state['events'], args.receipt, plan), indent=2))
    except (OSError, ValueError, KeyError, TypeError) as exc:
        parser.exit(1, 'unused rights reboard refused: ' + str(exc) + '\n')
