"""The owner's five-round limit cannot be expanded by recovery capacity."""
import json
from pathlib import Path

POLICY = Path(__file__).resolve().parents[1] / 'config/review_limit.json'
MAX_ROUNDS = 5


def policy():
    data = json.loads(POLICY.read_text())
    if (data.get('max_review_rounds') != MAX_ROUNDS
            or data.get('extensions_allowed') is not False):
        raise ValueError('preserve the owner-directed hard five-review limit')
    return data


def enabled(state):
    if state.get('mode') != 'production' or state.get('terminal_state'):
        return False
    from completion_progress import enabled as adopted
    from publication_owner import enabled as current_cloud
    return (str(state.get('run_id', ''))[:10] >= policy()['effective_date']
            or adopted(state) or current_cloud())


def used(state):
    value = (state.get('usage') or {}).get('storyboard_critics', 0)
    if type(value) is not int or value < 0:
        raise ValueError('review usage must retain its genuine cumulative count')
    return value


def reached(state):
    return enabled(state) and used(state) >= MAX_ROUNDS


def finishing(state):
    return enabled(state) and MAX_ROUNDS - used(state) < 3


def worker_plan_problems(state, packet, *, charged=False):
    from completion_yield import admission_problems
    if admission_problems(state):
        return admission_problems(state)
    from manual_codex_repair import worker_problems
    manual = worker_problems(state, packet, charged=charged)
    if manual is not None:
        return manual
    if not enabled(state) or packet.get('role') != 'storyboard-critic':
        return []
    ordinal = used(state) + (0 if charged else 1)
    if ordinal > MAX_ROUNDS:
        return ['hard five-review limit reached; no further editorial worker dispatch']
    if ordinal == MAX_ROUNDS and not (
            packet.get('phone_mode') == 'current'
            and packet.get('review_scope') == 'exact-muted-phone-preflight'):
        return ['the fifth review is protected for the exact current timed phone film; '
                'finish the strongest existing cut instead of another code, pivot or comparison review']
    return []


def reservation_problems(state, amounts):
    from completion_yield import admission_problems
    if admission_problems(state, amounts):
        return admission_problems(state, amounts)
    from manual_codex_repair import record, reservation_problems as manual_problems
    if record(state) is not None:
        return manual_problems(state, amounts)
    if not enabled(state):
        return []
    requested = amounts.get('storyboard_critics', 0)
    if type(requested) is not int or requested < 0:
        return ['review reservation must retain its positive actual attempt count']
    if used(state) + requested > MAX_ROUNDS and requested:
        return ['hard five-review limit reached; no sixth code, phone, pivot or retry reviewer; '
                'freeze the strongest current cut and finish delivery without another creative loop']
    if reached(state) and amounts.get('reboards'):
        return ['hard five-review limit reached; no further paid creative rebuild']
    return []


def repair_problems(state, plan):
    from manual_codex_repair import plan_problems
    manual = plan_problems(state, plan)
    if manual is not None:
        return manual
    errors = reservation_problems(state, plan.get('resources') or {})
    if reached(state) and plan.get('changed_inputs') and plan.get('repair_scope') not in {
            'technical-integrity', 'review-context'}:
        errors.append('hard five-review limit closes creative edits and source/mechanism pivots; '
                      'finish the strongest existing cut, preserving original scores and evidence')
    return errors
