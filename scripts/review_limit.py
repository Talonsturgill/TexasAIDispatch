"""The owner's five-round limit cannot be expanded by recovery capacity."""
import json
import hashlib
from pathlib import Path

POLICY = Path(__file__).resolve().parents[1] / 'config/review_limit.json'
MAX_ROUNDS = 5
FINAL_PACKET_FROM = '2026-10-24'
PATH_BUDGET_FROM = '2026-10-25'
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


def path_budget_enabled(state):
    return enabled(state) and str(state.get('run_id', ''))[:10] >= PATH_BUDGET_FROM


OPENING_EVIDENCE = ('openings/selection.json', 'opening-a-critic.json', 'opening-b-critic.json')


def unfundable(state, root):
    """Retain recorded closure semantics; price a live edition's actual available path."""
    original = any(event.get('kind') == 'hard_limit_expenditure_closed'
                   and (event.get('evidence', {}).get('plan') or {}).get('reason')
                   == 'unfundable-required-review-before-film'
                   for event in state.get('events', []))
    if original or not path_budget_enabled(state):
        return (enabled(state) and finishing(state) and not reached(state)
                and not any((Path(root) / name).exists() for name in OPENING_EVIDENCE))
    path = remaining_review_path(state, Path(root) / 'run_state.json')
    return (enabled(state) and finishing(state) and not reached(state)
            and not path['errors'] and not path['feasible'])


def review_evidence(state, state_path=None):
    """Count only current accepted gates; absent evidence leaves the gate pending."""
    complete = dict(code=False, comparison=False, timed_phone=False)
    errors = []
    if state_path is None:
        return complete, errors
    root = Path(state_path).resolve().parent
    read = lambda path: json.loads(path.read_text())
    sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
    try:
        actual = read(Path(state_path))
        if actual.get('run_id') != state.get('run_id'):
            return complete, ['review path belongs to another edition']
        claims = root / 'claims.json'
        boards = [root / ('opening-' + option + '.json') for option in ('a', 'b')]
        reports = [root / ('opening-' + option + '-critic.json') for option in ('a', 'b')]
        if claims.is_file() and all(p.is_file() for p in boards + reports):
            import critic_gate
            valid = []
            for board_path, report_path in zip(boards, reports):
                board, report = read(board_path), read(report_path)
                owned = (board.get('run_id', board.get('date')) == state['run_id']
                         and board.get('date') == str(state['run_id'])[:10])
                # A retained rejection is pending, not an invitation to reinterpret it.
                valid.append(owned and report.get('review_scope') == 'code-plan'
                    and (report.get('story_review') or {}).get('claims_sha256') == sha(claims)
                    and not critic_gate.problems(board, report))
            complete['code'] = all(valid)
        board_path = root / 'storyboard.json'
        if board_path.is_file() and claims.is_file():
            board = read(board_path)
            if (board.get('run_id', board.get('date')) != state['run_id']
                    or board.get('date') != str(state['run_id'])[:10]):
                return complete, ['current review board belongs to another edition']
            if all((root / 'openings' / name).is_file() for name in ('comparison.json', 'selection.json')):
                from creative_production import opening_problems
                complete['comparison'] = not opening_problems(board_path)
            timed = ['storyboard_critic.json', 'preflight.json', 'preflight.mp4',
                     'captions.json', 'words.json', 'vo_script.txt']
            if (board.get('narration_picture', {}).get('timing_mode') == 'measured_caption_boundaries'
                    and all((root / name).is_file() for name in timed)):
                import modern_film
                from review_context import phone_problems
                report = read(root / 'storyboard_critic.json')
                complete['timed_phone'] = (
                    (report.get('story_review') or {}).get('claims_sha256') == sha(claims)
                    and not modern_film.narration_problems(board, read(root / 'captions.json'),
                            read(root / 'words.json'), (root / 'vo_script.txt').read_text())
                    and not phone_problems(board_path))
    except (OSError, ValueError, KeyError, TypeError, IndexError, AttributeError) as exc:
        errors.append('current review path evidence is invalid: ' + str(exc))
    return complete, errors


def remaining_review_path(state, state_path=None, packet=None, charged=False):
    """Price the actual remaining gates, optionally including one proposed/charged call.

    This does not approve a report or change the frozen envelope. A charged replan pays
    for its call only once; its still-unreturned result cannot complete any other gate.
    """
    complete, errors = review_evidence(state, state_path)
    pending = [name for name, passed in complete.items() if not passed]
    spent = used(state)
    remaining = max(0, MAX_ROUNDS - spent)
    ordinary = len(pending)
    combined = False
    if state_path is not None and not complete['code'] and not complete['comparison']:
        try:
            from combined_review import budget_eligibility
            budget_eligibility(state_path, state=state)
            combined = True
        except (ImportError, OSError, ValueError, KeyError, TypeError, IndexError):
            pass  # An unavailable or unproved combined route cannot reduce its price.
    route = 'combined-code-comparison' if combined else 'ordinary'
    required = ordinary - int(combined)
    if packet is not None:
        covers = {'code'}
        route = 'code'
        if packet.get('role') != 'storyboard-critic':
            errors.append('remaining review path requires the independent critic packet')
        elif packet.get('review_scope') == 'exact-muted-phone-preflight':
            mode = packet.get('phone_mode')
            if mode not in ('comparison', 'current'):
                errors.append('review path needs an exact comparison or timed phone packet')
            else:
                try:
                    import agent_runtime
                    import claude_runtime
                    agent_runtime.validate_references(packet)
                    claude_runtime.phone_review_inputs(packet)
                    if mode == 'current':
                        covers, route = {'timed_phone'}, 'timed-phone'
                        if not complete['code'] or not complete['comparison']:
                            errors.append('final timed phone still owes accepted code and silent comparison')
                    elif packet.get('combined_code_review'):
                        from combined_review import eligibility
                        proof = eligibility(state_path, charged=charged)
                        if packet['combined_code_review'] != proof:
                            raise ValueError('combined review eligibility changed')
                        covers, route = {'code', 'comparison'}, 'combined-code-comparison'
                    else:
                        covers, route = {'comparison'}, 'comparison'
                        if not complete['code']:
                            errors.append('ordinary silent comparison still owes current code approval')
                except (ImportError, OSError, ValueError, KeyError, TypeError, IndexError) as exc:
                    errors.append('proposed review path is invalid: ' + str(exc))
        required = (0 if charged else 1) + len(set(pending) - covers)
    return {'used': spent, 'ceiling': MAX_ROUNDS, 'remaining': remaining,
            'completed': complete, 'pending': pending, 'ordinary_required': ordinary,
            'required': required, 'route': route, 'combined_eligible': combined,
            'feasible': required <= remaining and not errors, 'errors': errors}


def path_problems(path):
    if path['feasible']:
        return []
    return path['errors'] or [
        'hard five-review path needs ' + str(path['required']) + ' remaining critic attempts but only '
        + str(path['remaining']) + ' remain; use the evidence-bound combined route if eligible, '
        'otherwise retain the original infeasible failure without buying another review']


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


def worker_plan_problems(state, packet, *, charged=False, state_path=None):
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
    if path_budget_enabled(state):
        return path_problems(remaining_review_path(state, state_path, packet, charged))
    return []


def reservation_problems(state, amounts, *, state_path=None, packet_path=None):
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
    # Historical replay and state-only repair classification cannot inspect live files.
    # The actual controller reservation always supplies its owned state path.
    if path_budget_enabled(state) and state_path is not None and (requested or amounts.get('reboards')):
        packet = None
        if requested:
            if requested != 1:
                return ['current review path reserves one actual critic assignment at a time']
            try:
                if packet_path is not None:
                    from claude_runtime import read
                    packet = read(packet_path)
                else:
                    packet = {'role': 'storyboard-critic', 'review_scope': 'code-plan'}
            except (OSError, ValueError, TypeError) as exc:
                return ['review packet is unavailable before reservation: ' + str(exc)]
        return path_problems(remaining_review_path(state, state_path, packet))
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
