"""The owner's five-round limit cannot be expanded by recovery capacity."""
import json
import hashlib
from pathlib import Path

POLICY = Path(__file__).resolve().parents[1] / 'config/review_limit.json'
MAX_ROUNDS = 5
FINAL_PACKET_FROM = '2026-10-24'
POLICY_FIELDS = {'schema', 'effective_date', 'max_review_rounds', 'counted_resource',
                 'counting_rule', 'completion_rule', 'extensions_allowed', 'authorization'}


def policy():
    data = json.loads(POLICY.read_text())
    if (set(data) != POLICY_FIELDS or data.get('max_review_rounds') != MAX_ROUNDS
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


OPENING_EVIDENCE = ('openings/selection.json', 'opening-a-critic.json', 'opening-b-critic.json')


def unfundable(state, root):
    """The remaining reviews can no longer buy the mandatory code gate, selection and final phone.

    Finishing begins at the third review. A film still needs a passing code gate for both
    treatments, the independent silent comparison and the protected exact timed phone, which
    is three reviews. When none of that opening evidence exists, two remaining reviews cannot
    complete the path, and the fifth review accepts only the timed phone packet. This adds no
    review and approves nothing; it only lets the existing failure closure see the dead end.
    """
    return (enabled(state) and finishing(state) and not reached(state)
            and not any((Path(root) / name).exists() for name in OPENING_EVIDENCE))


def packet_identity(packet):
    return hashlib.sha256(json.dumps(packet, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def final_packet_required(state):
    return enabled(state) and str(state.get('run_id', ''))[:10] >= FINAL_PACKET_FROM


def final_reservation_binding(state, amounts, state_path, packet_path=None):
    """Protect the last attempt before spending it; labels alone cannot authorize it."""
    from manual_codex_repair import record
    if record(state) is not None or not final_packet_required(state):
        return {}
    requested = amounts.get('storyboard_critics', 0)
    if not requested or used(state) + requested != MAX_ROUNDS:
        return {}
    if requested != 1 or packet_path is None:
        raise ValueError('the fifth review requires one exact current timed-phone packet; '
                         'use consume --review-packet after planning that final phone check')
    import agent_runtime
    import claude_runtime
    packet_path = Path(packet_path).resolve()
    data = claude_runtime.read(packet_path)
    if (data.get('role') != 'storyboard-critic' or data.get('phone_mode') != 'current'
            or data.get('review_scope') != 'exact-muted-phone-preflight'
            or Path(data.get('phone_state', '')).resolve() != Path(state_path).resolve()
            or data.get('date') != str(state['run_id'])[:10]):
        raise ValueError('the fifth review packet must bind this edition and its exact current timed phone')
    if data.get('agent_assignment') not in (
            claude_runtime.assignment('storyboard-critic', data['date']),
            agent_runtime.assignment('storyboard-critic', data['date'])):
        raise ValueError('the fifth review packet must retain the current independent critic assignment')
    agent_runtime.validate_references(data)
    claude_runtime.phone_review_inputs(data)
    row = data['phone_options'][0]
    import modern_film
    board = claude_runtime.read(row['board']['path'])
    clock = {}
    if modern_film.narration_required(board):
        root = Path(state_path).resolve().parent
        captions, words, script = root / 'captions.json', root / 'words.json', root / 'vo_script.txt'
        errors = modern_film.narration_problems(board, claude_runtime.read(captions),
                    claude_runtime.read(words), script.read_text())
        if errors:
            raise ValueError('the final phone needs the current measured narration clock: ' + '; '.join(errors))
        clock = {name: claude_runtime.bound(path) for name, path in
                 [('captions', captions), ('words', words), ('script', script)]}
    return {'final_timed_phone': {'packet': claude_runtime.bound(packet_path),
            'packet_identity': packet_identity(data), 'board': row['board'],
            'film': row['film'], 'motion_sequence': row['motion_sequence'], 'narration_clock': clock}}


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
    if ordinal == MAX_ROUNDS and charged and final_packet_required(state):
        reservation = next((e for e in reversed(state.get('events', []))
                            if e.get('kind') == 'reserved'
                            and e.get('resources', {}).get('storyboard_critics')), {})
        binding = reservation.get('final_timed_phone') or {}
        if binding.get('packet_identity') != packet_identity(packet):
            return ['the fifth review dispatch must use its exact reserved timed-phone packet']
        from agent_runtime import validate_references
        try:
            validate_references(binding)
        except (OSError, ValueError, KeyError, TypeError) as exc:
            return ['the reserved final timed-phone evidence changed: ' + str(exc)]
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
