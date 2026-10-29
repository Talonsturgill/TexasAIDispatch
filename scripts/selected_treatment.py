"""Freeze an original independent A/B choice; grant no code, film or shipment approval."""
from pathlib import Path
import argparse
import json

from combined_review import bound, contains_bindings, read, require, same_observer

KIND = 'selected_treatment_completion_adopted'
RETIRED = 'selected_treatment_completion_retired'
SCHEMA = 'dispatch_selected_treatment_completion/1'
POLICY = Path(__file__).resolve().parents[1] / 'config/selected_treatment_completion_v1.json'
PACKAGE = 'selected-treatment-evidence'


class EvidencePaths:
    """Map reads into one retained logical tree; never alter original packet or observation bytes."""
    def __init__(self, root, origin):
        self.root, self.origin = Path(root).resolve(), Path(origin)
        require(self.origin.is_absolute() and self.origin != Path('/') and '..' not in self.origin.parts,
                'selection proof needs one canonical original repository')

    def path(self, value):
        value = Path(str(value).replace('{REPO}', str(self.origin)))
        require(value.is_absolute() and '..' not in value.parts, 'selection evidence path is not canonical')
        if value.is_relative_to(self.root):
            relative = value.relative_to(self.root)
        else:
            require(value.is_relative_to(self.origin), 'selection evidence escapes its original repository')
            relative = value.relative_to(self.origin)
        result = self.root / relative
        require(not any(p.is_symlink() for p in (result, *result.parents)),
                'selection evidence cannot follow symbolic links')
        return result

    def logical(self, value):
        return self.origin / self.path(value).relative_to(self.root)

    def reference(self, ref):
        return {**ref, 'path': str(self.logical(ref['path']))}


def evidence_graph(state_path, original, code_original, comparison_path, coverage_path, *, paths=None):
    """Finite public review graph, including every Read event for this exact visual actor."""
    from creative_production import fingerprint
    state_path = Path(state_path).resolve(); repo = state_path.parents[2]
    locate = paths.path if paths is not None else Path
    files = set()
    def add(path):
        path = locate(path).resolve()
        require(path.is_file() and path.is_relative_to(repo)
                and not any(p.is_symlink() for p in (path, *path.parents)),
                'retain real owned files for the selection evidence graph')
        files.add(path)
        return path
    for item in (original, code_original):
        for key in ('receipt', 'packet', 'claim'):
            add(item[key]['path'])
    add(state_path.parent / 'claims.json')
    comparison = read(add(comparison_path))
    for option in comparison['options']:
        for key in ('board', 'film'):
            add(Path(comparison_path).parent / option[key]['file'])
    coverage = read(add(coverage_path)); packet = read(locate(original['packet']['path']))
    for option in packet['phone_options']:
        index = add(option['motion_sequence']['path'])
        for page in read(index)['pages']:
            add(index.parent / page['file'])
    for sequence in coverage['sequences']:
        for page in sequence['pages']:
            for key in ('observation', 'writer_receipt'):
                add(page[key]['path'])
    for event_path in sorted((state_path.parent / 'image-tool-delivery').glob('*.json')):
        if read(event_path).get('actor_sha256') == original['actor_sha256']:
            add(event_path)
    rows = [{'path': path.relative_to(repo).as_posix(), 'sha256': bound(path)['sha256']}
            for path in sorted(files)]
    return rows, fingerprint(rows)


def narration_identity(board):
    """Visual repairs and measured timing may change; the chosen story and spoken words may not."""
    from creative_production import fingerprint
    return fingerprint({
        'date': board.get('date'), 'title': board.get('title'), 'beat': board.get('beat'),
        'viewer_question': (board.get('creative_direction') or {}).get('viewer_question'),
        'scenes': [{key: scene.get(key) for key in ('id', 'vo', 'vo_claims')}
                   for scene in board['scenes']],
    })


def matching_json(root, sha, pattern):
    """Find retained original bytes, including immutable failure archives, not mutable slot names."""
    matches = [path for path in sorted(Path(root).rglob(pattern))
               if path.is_file() and not path.is_symlink() and path.stat().st_size <= 8 * 1024 * 1024
               and bound(path)['sha256'] == sha]
    require(bool(matches), 'retain the exact original comparison evidence: ' + pattern)
    return matches[0]


def latest_selection(state_path):
    from completion_yield import CRITIC_RECEIPTS, critic_completion
    state_path = Path(state_path).resolve()
    candidates = []
    for path in sorted((state_path.parent / CRITIC_RECEIPTS).glob('*.json')):
        if path.name.startswith('handback-'):
            continue
        receipt, claim, _ = critic_completion(state_path.parents[2], path, state_path=state_path)
        if isinstance(receipt['report'].get('selection'), dict):
            candidates.append(claim['reservation_event_index'])
    require(bool(candidates), 'complete a genuine independent two-treatment comparison before selection adoption')
    return max(candidates)


def original_selection(state_path, event_index, *, paths=None):
    """Verify original public native judgments and both observed films without changing any grade."""
    import claude_runtime
    import creative_production as creative
    from completion_yield import original_critic_review
    from opening_compare import body, evidence_path
    state_path = Path(state_path).resolve(); root = state_path.parent
    locate = paths.path if paths is not None else Path
    canonical = paths.reference if paths is not None else lambda ref: ref
    state = read(state_path)
    original = original_critic_review(state_path, event_index)
    packet = read(original['packet']['path']); report = original['report']
    selection = report.get('selection') or {}; selected = selection.get('selected')
    options = packet.get('phone_options') or []
    require(packet.get('phone_mode') == 'comparison' and selected in ('a', 'b')
            and [row.get('id') for row in options] == ['a', 'b']
            and selection.get('reviewer_identity') and selection.get('director_identity')
            and selection['reviewer_identity'] != selection['director_identity']
            and creative.concrete(selection.get('reason')) and creative.concrete(selection.get('rejected_reason')),
            'selection needs the original independent choice and concrete reasons for both complete treatments')
    comparison_sha = selection.get('comparison_sha256')
    require(all(row.get('comparison', {}).get('comparison_sha256') == comparison_sha for row in options),
            'original choice must bind both exact diagnostic films')
    comparison_path = matching_json(root, comparison_sha, '*comparison*.json')
    comparison = read(comparison_path); output = comparison_path.parent
    retained = comparison.get('options') or []
    require(not comparison.get('builder_proof') and [row.get('id') for row in retained] == ['a', 'b']
            and len({row['concept_sha256'] for row in retained}) == 2
            and len({row['film']['sha256'] for row in retained}) == 2,
            'retain two distinct complete diagnostic treatments, never an unreviewed builder proof')
    reservation = comparison.get('reservation') or {}; index = reservation.get('event_index')
    require(type(index) is int and 0 <= index < event_index < len(state['events']),
            'retain the original paid comparison reservation')
    event = state['events'][index]
    require(reservation.get('run_id') == state['run_id'] and event.get('kind') == 'reserved'
            and event.get('resources') == {'preflight_renders': 1}
            and event.get('note') == 'two opening comparison batch'
            and event.get('preflight_identity') == reservation.get('identity'),
            'original complete comparison has no matching cumulative capture charge')
    boards = []
    for option, old in zip(options, retained, strict=True):
        require(option['id'] == old['id'], 'original comparison treatment order changed')
        for key in ('board', 'film'):
            path = evidence_path(output, old[key])
            require(bound(path)['sha256'] == option[key]['sha256'],
                    'retain the exact original reviewed treatment ' + key)
        boards.append(read(evidence_path(output, old['board'])))
        import claude_motion_review
        motion_errors = claude_motion_review.problems(
            locate(option['motion_sequence']['path']), evidence_path(output, old['board']),
            evidence_path(output, old['film']), phone=True, comparison=option['comparison'])
        require(not motion_errors, '; '.join(motion_errors))
    require(all(creative.treatment_required(board) for board in boards)
            and body(boards[0]) == body(boards[1]),
            'selection adoption requires two complete treatments of the same source story and narration')
    phone_pair = report.get('phone_reports')
    # Choice is weaker than film acceptance: exact top-level film/source identities and
    # guarded complete viewing prove which treatment was chosen. Missing nested grading
    # metadata still fails the unchanged film gate; never manufacture it in an old report.
    def choice_bindings(option):
        return {key: value for key, value in option['report_bindings'].items()
                if key not in ('modern_observations', 'narration_picture_observations')}
    if isinstance(phone_pair, dict):
        require(set(phone_pair) == {'a', 'b'} and all(
            contains_bindings(phone_pair[row['id']], choice_bindings(row)) for row in options),
            'retain both original bound phone reports')
    else:
        require(report.get('schema') == 'dispatch_combined_code_phone_handback/1'
                and contains_bindings(report.get('phone_review'),
                                      choice_bindings(next(row for row in options if row['id'] == selected))),
                'retain the original bound selected-film report from the complete combined comparison')
    # The comparison must have genuine code provenance. Current code still needs its own
    # exact approval after a correction; these old passes approve no changed source.
    code_original = original
    codes = report.get('code_reports', report.get('reports'))
    if not isinstance(codes, dict):
        prior = [i for i, e in enumerate(state['events'][:event_index])
                 if e.get('kind') == 'reserved' and e.get('resources', {}).get('storyboard_critics') == 1]
        require(bool(prior), 'retain the original code review before the diagnostic comparison')
        code_original = original_critic_review(state_path, prior[-1])
        codes = code_original['report'].get('code_reports', code_original['report'].get('reports'))
    code_packet = read(code_original['packet']['path'])
    code_bindings = (code_packet.get('code_report_bindings') or {}).get('treatments') or []
    require(isinstance(codes, dict) and set(codes) == {'a', 'b'}
            and [row.get('id') for row in code_bindings] == ['a', 'b'],
            'retain the original paired code judgments and exact input bindings')
    for option, binding in zip(options, code_bindings, strict=True):
        code = codes[option['id']]
        require(code.get('verdict') in ('pass', 'revise') and code.get('review_scope') == 'code-plan'
                and isinstance(code.get('blocking_defects'), list)
                and (code.get('verdict') != 'pass' or code['blocking_defects'] == [])
                and contains_bindings(code, binding['report_bindings'])
                and all(code.get(field) == option['report_bindings'].get(field)
                        for field in ('concept_sha256', 'renderer_sha256', 'quality_contract_sha256')),
                'original diagnostic film must retain its genuine current-at-capture code judgments')
    claims_sha = packet.get('claims', {}).get('sha256')
    require(claims_sha == code_packet.get('claims', {}).get('sha256')
            == bound(root / 'claims.json')['sha256'], 'chosen comparison source claims changed')
    coverages = [path for path in sorted(root.rglob('*coverage*.json'))
                 if path.is_file() and read(path).get('schema') == 'dispatch_claude_image_coverage/1'
                 and read(path).get('packet_sha256') == original['packet']['sha256']]
    require(bool(coverages), 'retain the complete guarded original A/B image coverage')
    coverage = coverages[0]
    errors = claude_runtime.image_coverage_problems(original['packet']['path'], coverage, paths=paths)
    require(not errors, '; '.join(errors))
    same_observer(paths.logical(root) if paths is not None else root, original, report, read(coverage))
    chosen = boards[('a', 'b').index(selected)]
    graph, graph_sha = evidence_graph(state_path, original, code_original, comparison_path, coverage, paths=paths)
    from creative_production import fingerprint
    code_index = read(code_original['claim']['path'])['reservation_event_index']
    event_rows = [{'event_index': i, 'event': state['events'][i]} for i in sorted({index, event_index, code_index})]
    return {'schema': SCHEMA, 'run_id': state['run_id'], 'selected': selected,
            'policy_sha256': bound(POLICY)['sha256'], 'original_review_event_index': event_index,
            'original_review': canonical(original['receipt']), 'original_packet': canonical(original['packet']),
            'original_claim': canonical(original['claim']), 'comparison': canonical(bound(comparison_path)),
            'image_coverage': canonical(bound(coverage)), 'original_code_review': canonical(code_original['receipt']),
            'original_code_packet': canonical(code_original['packet']), 'original_code_claim': canonical(code_original['claim']),
            'evidence_graph_sha256': graph_sha, 'reservation_events_sha256': fingerprint(event_rows),
            'claims_sha256': claims_sha, 'narration_sha256': narration_identity(chosen),
            'approval': False}


def current_story(proof, state_path):
    root = Path(state_path).resolve().parent
    require(bound(root / 'claims.json')['sha256'] == proof['claims_sha256'],
            'selected-treatment source claims changed; obtain a new complete independent comparison')
    board = read(root / ('opening-' + proof['selected'] + '.json'))
    require(narration_identity(board) == proof['narration_sha256'],
            'selected story or narration changed; obtain a new complete independent comparison')


def active_adoption(state):
    """Replay explicit scope changes; retirement restores the full paired obligations."""
    active = None
    for index, event in enumerate(state.get('events', [])):
        if not isinstance(event, dict):
            continue
        if event.get('kind') == KIND:
            active = (index, event)
        elif event.get('kind') == RETIRED:
            require(active is not None and event.get('adoption_event_index') == active[0]
                    and event.get('proof') == active[1].get('proof')
                    and event.get('approval') is False and event.get('grants_resources') is False,
                    'selection retirement changed its original adoption or authority')
            start = event.get('repair_started_event_index')
            require(type(start) is int and active[0] < start < index,
                    'selection retirement needs its admitted repair before source edits')
            repair = state['events'][start]
            require(repair.get('kind') == 'repair_started'
                    and repair.get('plan_sha256') == event.get('plan_sha256')
                    and repair.get('failure_sha256') == event.get('failure_sha256')
                    and repair.get('baselines') == event.get('baselines')
                    and event.get('archive') == 'retired-selections/adoption-' + str(active[0]),
                    'selection retirement lost its exact admitted repair')
            active = None
    return active[1] if active is not None else None


def retirement_problems(state_path, state):
    """Recheck the original independent graph and admitted plan after source changes."""
    active_adoption(state)
    for event in state.get('events', []):
        if not isinstance(event, dict) or event.get('kind') != RETIRED:
            continue
        archive = Path(state_path).parent / event['archive']
        require(bound(archive / 'repair-plan.json')['sha256'] == event['plan_sha256'],
                'retired selection lost its original admitted plan')
        expected = packaged_selection(archive / 'run_state.json', event['proof'])
        from claude_checkpoint import portable
        packet_relative = Path(read(archive / PACKAGE / 'index.json')['original_packet'])
        packet = read(archive / PACKAGE / packet_relative)
        origin = str(Path(packet['board']['path']).parents[2])
        require(portable(expected, origin) == portable(event['proof'], origin),
                'retired selection lost its original independent proof')


def retire(state_path, plan_path):
    """Retain a choice before an admitted source/story pivot; confer no approval or spend."""
    from datetime import datetime, timezone
    from completion_yield import immutable
    from run_controller import save
    import shutil
    state_path = Path(state_path).resolve(); plan_path = Path(plan_path).resolve()
    state = read(state_path)
    require(state.get('mode') == 'production' and not state.get('terminal_state')
            and not state.get('shipment'), 'retire selection only in an unfinished production')
    adoption = active_adoption(state)
    if adoption is None:
        previous = [e for e in state.get('events', []) if isinstance(e, dict) and e.get('kind') == RETIRED]
        require(previous and previous[-1]['plan_sha256'] == bound(plan_path)['sha256'],
                'there is no active independently selected treatment to retire')
        retirement_problems(state_path, state)
        return previous[-1]
    proof = selection_proof(state_path)
    current = state.get('active_repair') or {}; plan = read(plan_path)
    require(plan.get('retire_selection') is True
            and current.get('plan') == str(plan_path) and current.get('plan_sha256') == bound(plan_path)['sha256']
            and current.get('failure_sha256') == plan.get('failure_evidence_sha256'),
            'selection retirement requires the exact admitted active repair plan')
    require(any(Path(row['path']).name in {'claims.json', 'opening-a.json', 'opening-b.json',
                                         'storyboard.json', 'vo_script.txt'}
                for row in current.get('baselines', [])),
            'selection retirement requires an admitted source or story input correction')
    for row in current['baselines']:
        require(bound(row['path'])['sha256'] == row['before_sha256']
                == bound(row['before_path'])['sha256'],
                'retire selection before editing the admitted baseline inputs')
    adoption_index = max(i for i, e in enumerate(state['events']) if e is adoption)
    start = max((i for i, e in enumerate(state['events'])
                 if isinstance(e, dict) and e.get('kind') == 'repair_started'
                 and e.get('plan_sha256') == current['plan_sha256']), default=-1)
    archive_name = 'retired-selections/adoption-' + str(adoption_index)
    event = {'kind': RETIRED, 'at': datetime.now(timezone.utc).isoformat(),
             'adoption_event_index': adoption_index, 'proof': proof,
             'repair_started_event_index': start, 'plan_sha256': current['plan_sha256'],
             'failure_sha256': current['failure_sha256'],
             'baselines': current['baselines'], 'archive': archive_name,
             'approval': False, 'grants_resources': False}
    active_adoption({**state, 'events': [*state['events'], event]})
    archive = state_path.parent / archive_name
    immutable(archive / 'run_state.json', {'run_id': state['run_id']})
    package(state_path.parent, archive, include_retired=False)
    target = archive / 'repair-plan.json'
    require(not target.exists() or target.read_bytes() == plan_path.read_bytes(),
            'retirement archive already holds a different repair plan')
    shutil.copy2(plan_path, target)
    state['events'].append(event)
    retirement_problems(state_path, state)
    save(state_path, state)
    return event


def selection_proof(state_path):
    """Return only a verified adopted choice. Invalid adoption never silently widens approval."""
    state_path = Path(state_path).resolve(); state = read(state_path)
    adoption = active_adoption(state)
    retirement_problems(state_path, state)
    if adoption is None:
        return None
    proof = adoption.get('proof') or {}
    capsule = state_path.parent / PACKAGE
    if capsule.exists():
        expected = packaged_selection(state_path, proof)
        from claude_checkpoint import portable
        origin = Path(read(capsule / 'index.json')['original_packet'])
        packet = read(capsule / origin)
        original_root = str(Path(packet['board']['path']).parents[2])
        require(portable(proof, original_root) == portable(expected, original_root),
                'packaged selected-treatment adoption or original evidence changed')
    else:
        expected = original_selection(state_path, proof.get('original_review_event_index'))
        require(proof == expected, 'selected-treatment adoption or its original evidence changed')
    current_story(proof, state_path)
    return proof


def packaged_selection(state_path, proof):
    """Recheck copied originals after the scratch checkout is unavailable."""
    from creative_production import fingerprint
    capsule = Path(state_path).parent / PACKAGE
    index = read(capsule / 'index.json')
    require(index.get('schema') == 'dispatch_selected_treatment_package/1'
            and fingerprint(index['files']) == proof.get('evidence_graph_sha256'),
            'packaged selection evidence inventory changed')
    packet_relative = Path(index['original_packet'])
    require(not packet_relative.is_absolute() and '..' not in packet_relative.parts,
            'packaged original packet escaped its retained tree')
    packet = read(capsule / packet_relative)
    paths = EvidencePaths(capsule, Path(packet['board']['path']).parents[2])
    for row in index['files']:
        relative = Path(row['path'])
        require(not relative.is_absolute() and '..' not in relative.parts
                and bound(paths.path(capsule / relative))['sha256'] == row['sha256'],
                'packaged original selection evidence bytes changed')
    ledger = capsule / 'out/dispatch/run_state.json'
    require(read(ledger).get('run_id') == read(state_path).get('run_id'),
            'packaged original review belongs to another edition')
    return original_selection(ledger, proof['original_review_event_index'], paths=paths)


def packaged_paths(root):
    capsule = Path(root) / PACKAGE
    if not capsule.exists():
        return None
    index = read(capsule / 'index.json')
    relative = Path(index['original_packet'])
    require(not relative.is_absolute() and '..' not in relative.parts, 'packaged packet escaped its tree')
    packet = read(capsule / relative)
    return EvidencePaths(capsule, Path(packet['board']['path']).parents[2])


def package(source, destination, *, include_retired=True):
    """Copy the exact finite public graph; do not export the private production ledger."""
    import shutil
    from completion_yield import original_critic_review
    from creative_production import fingerprint
    source, destination = Path(source).resolve(), Path(destination).resolve()
    def copy_file(path, target):
        require(not target.exists() or target.read_bytes() == path.read_bytes(),
                'refusing to overwrite different retained selection evidence')
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, target)
        require(bound(target)['sha256'] == bound(path)['sha256'], 'selection evidence changed during packaging')
    state_path = source / 'run_state.json'; proof = selection_proof(state_path)
    for event in read(state_path).get('events', []):
        if include_retired and isinstance(event, dict) and event.get('kind') == RETIRED:
            old, new = source / event['archive'], destination / event['archive']
            index = read(old / PACKAGE / 'index.json')
            paths = [Path('run_state.json'), Path('repair-plan.json'), Path(PACKAGE) / 'index.json',
                     Path(PACKAGE) / 'out/dispatch/run_state.json']
            paths.extend(Path(PACKAGE) / row['path'] for row in index['files'])
            for relative in paths:
                copy_file(old / relative, new / relative)
    if proof is None:
        return []
    state = read(state_path); original = original_critic_review(state_path, proof['original_review_event_index'])
    code_index = read(proof['original_code_claim']['path'])['reservation_event_index']
    code_original = original_critic_review(state_path, code_index)
    rows, sha = evidence_graph(state_path, original, code_original,
                              Path(proof['comparison']['path']), Path(proof['image_coverage']['path']))
    require(sha == proof['evidence_graph_sha256'], 'selection graph changed before packaging')
    capsule = destination / PACKAGE; repo = state_path.parents[2]
    for row in rows:
        copy_file(repo / row['path'], capsule / row['path'])
    comparison = read(proof['comparison']['path'])
    relevant = {proof['original_review_event_index'], code_index, comparison['reservation']['event_index']}
    retained_events = [{'event_index': i, 'event': state['events'][i]} for i in sorted(relevant)]
    require(fingerprint(retained_events) == proof['reservation_events_sha256'],
            'original paid selection events changed')
    ledger = {'schema': 'dispatch_selected_treatment_review_state/1', 'mode': 'production', 'run_id': state['run_id'],
              'events': [state['events'][i] if i in relevant else {'kind': 'outside-selected-review-proof'}
                         for i in range(max(relevant) + 1)]}
    from completion_yield import immutable
    immutable(capsule / 'out/dispatch/run_state.json', ledger)
    immutable(capsule / 'index.json', {'schema': 'dispatch_selected_treatment_package/1', 'files': rows,
              'original_packet': Path(original['packet']['path']).relative_to(repo).as_posix()})
    # The current selected board establishes unchanged source narration after visual repairs.
    selected_board = 'opening-' + proof['selected'] + '.json'
    copy_file(source / selected_board, destination / selected_board)
    current_combined = source / 'openings/combined-review.json'
    if read(source / 'openings/comparison.json').get('combined_code_review'):
        value = read(current_combined)
        for ref in [value[key] for key in ('packet', 'handback', 'claim', 'coverage')] + list(value['reports'].values()):
            path = Path(ref['path']).resolve()
            require(path.is_relative_to(repo) and bound(path) == ref, 'current combined original bytes changed')
            copy_file(path, capsule / path.relative_to(repo))
        for name in ('opening-a-critic.json', 'opening-b-critic.json',
                     'openings/combined-phone-review.json', 'openings/combined-review.json'):
            copy_file(source / name, destination / name)
    require(packaged_selection(destination / 'run_state.json', proof) == proof,
            'packaged original selection proof differs')
    return [row['path'] for row in rows]


def adopt(state_path):
    """Append a no-cost scope decision. Keep all prior findings, usage, envelope and grades."""
    from datetime import datetime, timezone
    from run_controller import save
    state_path = Path(state_path).resolve(); state = read(state_path)
    require(state.get('mode') == 'production' and not state.get('terminal_state')
            and not state.get('shipment'), 'adopt selection only for an unfinished production edition')
    proof = original_selection(state_path, latest_selection(state_path))
    current_story(proof, state_path)
    events = [event for event in state.get('events', []) if isinstance(event, dict) and event.get('kind') == KIND]
    if events and events[-1].get('proof') == proof and active_adoption(state) is not None:
        return selection_proof(state_path)
    require(not events or proof['original_review_event_index'] >
            events[-1]['proof']['original_review_event_index'],
            'a changed selection requires a later genuine independent complete comparison')
    state['events'].append({'kind': KIND, 'at': datetime.now(timezone.utc).isoformat(), 'proof': proof})
    save(state_path, state)
    return proof


def inspection_problems(receipt, output, state_path):
    """Selected film keeps every check; retain only known alternate motion failures as history."""
    from opening_compare import inspection_problems as ordinary, evidence_path
    from creative_release import MOTION_ERRORS
    errors = ordinary(receipt, output)
    proof = selection_proof(state_path)
    initial = (receipt.get('combined_code_review') or {}).get('route') == 'initial-selection'
    if proof is None and not initial:
        return errors
    if proof is None:
        from combined_review import eligibility
        import review_limit
        require(receipt['combined_code_review'] == eligibility(
            state_path, charged=review_limit.used(read(state_path)) == 1),
            'initial diagnostic capture authority changed')
    retained = set()
    for rejected in receipt['options']:
        if proof is not None and rejected['id'] == proof['selected']:
            continue
        report = read(evidence_path(output, rejected['inspection']))
        if report.get('inspection_error'):
            continue
        retained.update('opening ' + rejected['id'] + ': ' + failure for failure in report.get('problems', [])
                        if isinstance(failure, str) and any(pattern.fullmatch(failure) for pattern in MOTION_ERRORS))
    return [error for error in errors if error not in retained]


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=('adopt', 'verify', 'retire'))
    parser.add_argument('--state', type=Path, default=Path('out/dispatch/run_state.json'))
    parser.add_argument('--plan', type=Path)
    args = parser.parse_args(argv)
    try:
        if args.command == 'retire':
            require(args.plan is not None, 'selection retirement requires --plan for the admitted repair')
            result = retire(args.state, args.plan)
        else:
            result = adopt(args.state) if args.command == 'adopt' else selection_proof(args.state)
        print(json.dumps({'selection': result, 'shipment_authorized': False}, indent=2))
        return 0
    except (OSError, ValueError, KeyError, TypeError, IndexError) as exc:
        print('selected-treatment completion refused: ' + str(exc))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
