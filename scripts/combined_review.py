"""One original fourth code/phone handback; diagnostic capture never approves a film."""
from pathlib import Path
import argparse
import hashlib
import json

SCHEMA = 'dispatch_combined_code_phone_review/1'
HANDBACK = 'dispatch_combined_code_phone_handback/1'


def read(path):
    return json.loads(Path(path).read_text())


def bound(path):
    path = Path(path).resolve()
    return {'path': str(path), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def code_reports(report):
    pair = report.get('code_reports', report.get('reports'))
    if pair is None:
        return [report]
    require(isinstance(pair, dict) and set(pair) == {'a', 'b'},
            'retain both original A/B code reports')
    return list(pair.values())


def policy_available(state, *, charged=False):
    import review_limit
    from manual_codex_repair import record
    return (review_limit.enabled(state) and str(state['run_id'])[:10] >= '2026-10-25'
            and review_limit.used(state) == (4 if charged else 3)
            and record(state) is None and not state.get('terminal_state'))


def contains_bindings(report, bindings):
    """An original report may add judgments, but cannot omit or change supplied identities."""
    if isinstance(bindings, dict):
        return isinstance(report, dict) and all(key in report and contains_bindings(report[key], value)
                                                for key, value in bindings.items())
    if isinstance(bindings, list):
        return (isinstance(report, list) and len(report) == len(bindings)
                and all(contains_bindings(a, b) for a, b in zip(report, bindings, strict=True)))
    return report == bindings


def phone_rejection_proof(state_path, original, reservations):
    """Retain the real code PASS and complete original silent comparison before pricing its fix."""
    from completion_yield import original_critic_review
    import claude_runtime
    root = Path(state_path).resolve().parent
    packet = read(original['packet']['path']); report = original['report']
    reports, selection = report.get('phone_reports'), report.get('selection')
    require(packet.get('role') == 'storyboard-critic' and packet.get('phone_mode') == 'comparison'
            and packet.get('review_scope') == report.get('review_scope') == 'exact-muted-phone-preflight'
            and not packet.get('combined_code_review')
            and isinstance(reports, dict) and set(reports) == {'a', 'b'}
            and all(isinstance(row, dict) for row in reports.values())
            and isinstance(selection, dict) and selection.get('selected') in ('a', 'b'),
            'combined correction needs the original complete third silent comparison')
    label = selection.get('reviewer_identity')
    require(isinstance(label, str) and label.strip()
            and all(row.get('reviewer_identity') == label for row in reports.values()),
            'retain one original independent phone reviewer and both original reports')
    selected = reports[selection['selected']]
    mandatory = {'source', 'rights', 'legibility', 'comprehension', 'continuity',
                 'contact_and_consequence', 'subject_recognition', 'motion', 'pacing',
                 'ending_artistry', 'technical_audio', 'captions'}
    require(selected.get('verdict') == 'revise' and isinstance(selected.get('blocking_defects'), list)
            and any(isinstance(row, dict) and row.get('category') in mandatory
                    and isinstance(row.get('defect'), str) and row['defect'].strip()
                    for row in selected['blocking_defects']),
            'combined correction requires an original selected-film mandatory rejection')
    options = packet.get('phone_options')
    require(isinstance(options, list) and all(isinstance(row, dict) for row in options)
            and [row.get('id') for row in options] == ['a', 'b']
            and packet.get('claims') == bound(root / 'claims.json'),
            'original comparison must retain both films and the unchanged source claims')
    previous = original_critic_review(state_path, reservations[1][0])
    code_packet = read(previous['packet']['path'])
    codes = previous['report'].get('code_reports', previous['report'].get('reports'))
    bindings = (code_packet.get('code_report_bindings') or {}).get('treatments')
    require(isinstance(codes, dict) and set(codes) == {'a', 'b'}
            and all(isinstance(row, dict) for row in codes.values())
            and code_packet.get('claims') == packet['claims']
            and isinstance(bindings, list) and all(isinstance(row, dict) for row in bindings)
            and [row.get('id') for row in bindings] == ['a', 'b'],
            'retain the genuine preceding paired code approval and its paid packet')
    for option, code_binding in zip(options, bindings, strict=True):
        key = option['id']; code = codes[key]; phone = reports[key]
        require(code.get('verdict') == 'pass' and code.get('review_scope') == 'code-plan'
                and not code.get('blocking_defects')
                and contains_bindings(code, code_binding['report_bindings'])
                and contains_bindings(phone, option['report_bindings'])
                and all(code.get(field) == phone.get(field) for field in
                        ('concept_sha256', 'renderer_sha256', 'quality_contract_sha256'))
                and contains_bindings(code.get('story_review'), option['report_bindings']['story_review']),
                'original silent films must be the exact code-approved treatments, never transplanted grades')
    require(selection.get('comparison_sha256') == options[0]['comparison']['comparison_sha256']
            == options[1]['comparison']['comparison_sha256'],
            'original selection must bind that exact two-film comparison')
    coverages = []
    for path in sorted(root.glob('*coverage*.json')):
        value = read(path)
        if (isinstance(value, dict) and value.get('schema') == 'dispatch_claude_image_coverage/1'
                and value.get('packet_sha256') == original['packet']['sha256']):
            coverages.append(path)
    require(len(coverages) == 1, 'retain one exact original third-review image coverage file')
    coverage = coverages[0]
    errors = claude_runtime.image_coverage_problems(original['packet']['path'], coverage)
    require(not errors, '; '.join(errors))
    same_observer(root, original, report, read(coverage))
    return {'code_approval': previous['receipt'], 'code_packet': previous['packet'],
            'code_claim': previous['claim'], 'image_coverage': bound(coverage)}


def budget_eligibility(state_path, state=None, *, charged=False, retained_selection=None):
    """Price an original third code or silent-film rejection; approve no correction."""
    from completion_yield import original_critic_review
    state_path = Path(state_path).resolve(); state = state or read(state_path)
    require(policy_available(state, charged=charged),
            'combined review is only the fourth attempt of an ordinary hard-five edition')
    require(not any(state.get('usage', {}).get(key, 0) for key in
                    ('tts_calls', 'full_renders', 'panel_rounds', 'scorer_calls')),
            'combined review cannot replace an existing narrated or native finishing path')
    reservations = [(i, event) for i, event in enumerate(state['events'])
                    if event.get('kind') == 'reserved' and event.get('resources', {}).get('storyboard_critics')]
    require(len(reservations) == (4 if charged else 3)
            and all(e['resources']['storyboard_critics'] == 1 for _, e in reservations),
            'combined review retains three separate original attempts and one fourth reservation')
    third, _ = reservations[2]
    original = original_critic_review(state_path, third)
    from review_recovery_packet import recovery_problems
    errors = recovery_problems(state_path, original)
    require(not errors, '; '.join(errors))
    report = original['report']
    phone_proof = None
    if report.get('review_scope') == 'exact-muted-phone-preflight':
        phone_proof = phone_rejection_proof(state_path, original, reservations)
    else:
        reports = code_reports(report)
        require(bool(reports) and all(r.get('review_scope') == 'code-plan' for r in reports)
                and any(r.get('verdict') == 'revise' and r.get('blocking_defects') for r in reports),
                'combined review needs the original third independent code-plan rejection')
    selection = state_path.parent / 'openings/selection.json'
    require(not selection.exists() or (retained_selection is not None and read(selection) == retained_selection)
            or (phone_proof is not None and read(selection) == report['selection']),
            'preserve an existing comparison selection and its ordinary completion path')
    return {'schema': SCHEMA, 'run_id': state['run_id'], 'critic_attempt': 4,
            'policy_sha256': bound(__file__)['sha256'],
            'third_reservation_event_index': third,
            'original_review': original['receipt'], 'original_packet': original['packet'],
            'original_claim': original['claim'], 'reviewer_identity': original['reviewer_identity'],
            **({'prior_phone_review': phone_proof} if phone_proof is not None else {})}


def eligibility(state_path, *, charged=False, retained_selection=None):
    """Require the original failure and its actual later authorized correction before capture."""
    state_path = Path(state_path).resolve(); state = read(state_path)
    proof = budget_eligibility(state_path, state, charged=charged, retained_selection=retained_selection)
    from completion_yield import original_critic_review
    original = original_critic_review(state_path, proof['third_reservation_event_index'])
    original_report = original['report']
    rows = code_reports(original_report)
    repairs = [(i, event) for i, event in enumerate(state['events'])
               if i > proof['third_reservation_event_index'] and event.get('kind') == 'repair_authorized']
    require(bool(repairs), 'retain and authorize the original third-review correction before diagnostic capture')
    index, event = repairs[-1]; plan = event.get('repair_plan') or {}
    raw = Path(str(plan.get('failure_evidence', '')).replace('{REPO}', str(state_path.parents[2]))).resolve()
    require(raw.is_relative_to(state_path.parents[2]) and raw.is_file()
            and bound(raw)['sha256'] == plan.get('failure_evidence_sha256')
            and read(raw) in [original_report, *rows],
            'diagnostic correction must bind the unchanged original third review, never a rewritten verdict')
    require(bool(plan.get('changed_inputs')), 'diagnostic capture requires the actual corrected inputs')
    changed = False
    for row in plan['changed_inputs']:
        source, baseline = [Path(str(row[key]).replace('{REPO}', str(state_path.parents[2]))).resolve()
                            for key in ('path', 'before_path')]
        require(all(path.is_relative_to(state_path.parents[2]) for path in (source, baseline))
                and bound(source)['sha256'] == row.get('after_sha256')
                and bound(baseline)['sha256'] == row.get('before_sha256'),
                'diagnostic correction inputs or their original baselines changed')
        changed |= row['before_sha256'] != row['after_sha256']
    require(changed, 'diagnostic capture needs an actual corrected input, not a renamed repair')
    if original_report.get('recovery_review'):
        ref = plan.get('pivot_review') or {}
        pivot = Path(str(ref.get('path', '')).replace('{REPO}', str(state_path.parents[2]))).resolve()
        require(pivot.is_relative_to(state_path.parents[2]) and pivot.is_file()
                and bound(pivot)['sha256'] == ref.get('sha256')
                and read(pivot) == original_report['recovery_review'],
                'combined correction must use the unchanged original independent replacement review')
    return {**proof, 'repair_event_index': index,
            'repair_plan_sha256': event.get('repair_plan_sha256'), 'failure': bound(raw)}


def packet_problems(data, *, original=None):
    try:
        import claude_runtime
        state = read(data['phone_state'])
        proof = eligibility(data['phone_state'], charged=state['usage']['storyboard_critics'] == 4,
                            retained_selection=original.get('selection') if original else None)
        require(data.get('phone_mode') == 'comparison' and data.get('review_scope') == 'exact-muted-phone-preflight'
                and data.get('combined_code_review') == proof, 'combined packet route or original failure changed')
        require(data.get('code_report_bindings') == claude_runtime.code_report_bindings(data),
                'combined packet needs both current original code bindings')
        root = Path(data['phone_state']).resolve().parent
        receipt = read(root / 'openings/comparison.json')
        require(receipt.get('combined_code_review') == proof, 'combined packet needs its actual diagnostic capture')
        for code, film in zip(data['code_report_bindings']['treatments'], data['phone_options'], strict=True):
            # The capture rewrites each board with its own indentation, so identical content can
            # carry different bytes. Compare what the board says, never how it was formatted.
            require(code['id'] == film['id'] and (
                        code['board']['sha256'] == film['board']['sha256']
                        or read(code['board']['path']) == read(film['board']['path'])),
                    'combined code and film must cover the same two complete treatment boards')
        return []
    except (OSError, ValueError, KeyError, TypeError) as exc:
        return ['combined review unavailable: ' + str(exc)]


def same_observer(root, original, report, coverage):
    actor = original.get('actor_sha256')
    require(isinstance(actor, str) and len(actor) == 64,
            'combined review requires the actual guarded visual worker identity')
    expected = Path(root).resolve() / 'visual-observations' / actor
    require(Path(report.get('observation_directory', '')).resolve() == expected,
            'combined handback must retain its actual visual worker annotation directory')
    directories = {Path(page['observation']['path']).resolve().parent
                   for row in coverage.get('sequences', []) for page in row.get('pages', [])}
    require(directories == {expected}, 'combined code and image judgments must belong to the same actual worker')


def extract_recovery(state_path, destination):
    """Retain only a hook-proven original conditional replacement, without another review."""
    from completion_yield import original_critic_review, immutable
    state_path = Path(state_path).resolve(); destination = Path(destination).resolve()
    proof = budget_eligibility(state_path)
    original = original_critic_review(state_path, proof['third_reservation_event_index'])
    value = original['report'].get('recovery_review')
    require(isinstance(value, dict) and destination.is_relative_to(state_path.parent),
            'retain the original conditional replacement inside this edition package')
    immutable(destination, value)
    return bound(destination)


def import_handback(packet_path, handback_path, claim_path, coverage_path):
    """Mechanically split the original hook-proven JSON; never synthesize a judgment."""
    from completion_yield import verify_original_handback, immutable
    import claude_runtime
    packet_path, handback_path, claim_path, coverage_path = map(Path,
        (packet_path, handback_path, claim_path, coverage_path))
    data = read(packet_path); root = Path(data['phone_state']).resolve().parent
    report = verify_original_handback(root.parents[1], packet_path, handback_path, claim_path)
    errors = packet_problems(data, original=report) + claude_runtime.image_coverage_problems(packet_path, coverage_path)
    require(not errors, '; '.join(errors))
    require(report.get('schema') == HANDBACK and report.get('packet_sha256') == bound(packet_path)['sha256']
            and isinstance(report.get('reviewer_identity'), str) and bool(report['reviewer_identity'].strip()),
            'combined handback must be one original critic on this exact packet')
    from completion_yield import original_critic_review
    original = original_critic_review(Path(data['phone_state']), read(claim_path)['reservation_event_index'])
    require(original['report'] == report and original['claim'] == bound(claim_path),
            'combined judgments must come from the same actual fourth native worker')
    same_observer(root, original, report, read(coverage_path))
    require(set(report.get('code_reports', {})) == {'a', 'b'}, 'retain both original code verdicts')
    reports = {'opening-a-critic.json': report['code_reports']['a'],
               'opening-b-critic.json': report['code_reports']['b'],
               'openings/selection.json': report['selection'],
               'openings/combined-phone-review.json': report['phone_review']}
    for value in reports.values():
        require(value.get('reviewer_identity') == report['reviewer_identity'],
                'all combined verdicts must retain the same original reviewer')
    require(report['selection'].get('selected') in ('a', 'b'), 'retain an actual A/B comparison selection')
    # Preserve every original return, including REVISE. Later gates decide whether it passes.
    for relative, value in reports.items():
        immutable(root / relative, value)
    receipt = {'schema': SCHEMA, 'packet': bound(packet_path), 'handback': bound(handback_path),
               'claim': bound(claim_path), 'coverage': bound(coverage_path),
               'native_reviewer_identity': original['reviewer_identity'],
               'reports': {relative: bound(root / relative) for relative in reports},
               'shipment_authorized': False}
    immutable(root / 'openings/combined-review.json', receipt)
    return receipt


def completed_problems(root):
    """Ordinary independent code and phone gates still decide whether diagnostic film can advance."""
    try:
        import critic_gate
        import claude_runtime
        from completion_yield import verify_original_handback
        root = Path(root).resolve(); receipt = read(root / 'openings/combined-review.json')
        require(receipt.get('schema') == SCHEMA, 'combined original handback receipt is missing')
        for ref in [receipt[k] for k in ('packet', 'handback', 'claim', 'coverage')] + list(receipt['reports'].values()):
            require(bound(ref['path']) == ref, 'retain exact combined original evidence bytes')
        packet = read(receipt['packet']['path'])
        original = verify_original_handback(root.parents[1], receipt['packet']['path'],
                                           receipt['handback']['path'], receipt['claim']['path'])
        require(original.get('schema') == HANDBACK, 'retain the original combined reviewer response')
        from completion_yield import original_critic_review
        native = original_critic_review(Path(packet['phone_state']),
                                        read(receipt['claim']['path'])['reservation_event_index'])
        require(native['reviewer_identity'] == receipt['native_reviewer_identity'],
                'combined native reviewer identity changed')
        same_observer(root, native, original, read(receipt['coverage']['path']))
        errors = claude_runtime.image_coverage_problems(receipt['packet']['path'], receipt['coverage']['path'])
        for key in ('a', 'b'):
            board = read(root / ('opening-' + key + '.json'))
            report = read(root / ('opening-' + key + '-critic.json'))
            require(report == original['code_reports'][key], 'code verdict differs from original combined handback')
            require(report.get('verdict') == 'pass' and report.get('review_scope') == 'code-plan',
                    'both original combined code reports must independently PASS')
            errors += critic_gate.problems(board, report)
            require(report.get('story_review', {}).get('claims_sha256') == bound(root / 'claims.json')['sha256'],
                    'combined code review used different source claims')
        selection = read(root / 'openings/selection.json')
        require(selection == original['selection'], 'selection differs from original combined handback')
        option = next(row for row in packet['phone_options'] if row['id'] == selection['selected'])
        phone = read(root / 'openings/combined-phone-review.json')
        require(phone == original['phone_review'], 'phone verdict differs from original combined handback')
        inspection = read(root / 'openings' / (selection['selected'] + '-inspection.json'))
        errors += critic_gate.film_review_problems(read(option['board']['path']), phone, inspection,
                                                   option['board']['sha256'], option['film']['sha256'])
        return errors
    except (OSError, ValueError, KeyError, TypeError, StopIteration) as exc:
        return ['combined diagnostic capture is not approved: ' + str(exc)]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--packet', type=Path)
    parser.add_argument('--handback', type=Path)
    parser.add_argument('--claim', type=Path)
    parser.add_argument('--coverage', type=Path)
    parser.add_argument('--state', type=Path)
    parser.add_argument('--extract-recovery', type=Path, metavar='ORIGINAL_PIVOT_OUTPUT')
    args = parser.parse_args()
    if args.extract_recovery:
        require(args.state and not any((args.packet, args.handback, args.claim, args.coverage)),
                'extract the original conditional replacement with --state and --extract-recovery only')
        print(json.dumps({'original_recovery': extract_recovery(args.state, args.extract_recovery),
                          'shipment_authorized': False}))
        return
    require(all((args.packet, args.handback, args.claim, args.coverage)) and not args.state,
            'import the original combined return with --packet, --handback, --claim and --coverage')
    result = import_handback(args.packet, args.handback, args.claim, args.coverage)
    print(json.dumps({'schema': result['schema'], 'retained_reports': len(result['reports']),
                      'shipment_authorized': False}))


if __name__ == '__main__':
    main()
