"""Continue an independently selected story through an admitted source correction.

The original comparison proves a choice, never approval of changed pictures. This
route requires a charged, retained source chain and a later original native code
pass. Current phone, cinema, native, audiovisual and shipment gates are unchanged.
"""
from pathlib import Path
import hashlib
import json
import shutil

from combined_review import bound, contains_bindings, read, require
import selected_treatment as selected

PACKAGE = 'selected-repair-evidence'
REPO = Path(__file__).resolve().parents[1]


def normalized(value, origin, repo):
    from claude_checkpoint import portable
    return portable(portable(value, origin), repo)


def context(root, proof):
    """Resolve immutable original paths without changing their bytes."""
    held = selected.packaged_paths(root)
    original = held.path(proof['original_packet']['path']) if held else Path(proof['original_packet']['path'])
    origin = Path(read(original)['board']['path']).parents[2]
    capsule = root / PACKAGE
    if capsule.exists():
        index = read(capsule / 'index.json')
        require(index.get('schema') == 'dispatch_selected_repair_package/1', 'unknown selected repair package')
        paths = selected.EvidencePaths(capsule, origin)
        for row in index['files']:
            path = Path(row['path'])
            require(not path.is_absolute() and '..' not in path.parts
                    and bound(paths.path(capsule / path))['sha256'] == row['sha256'],
                    'selected repair retained bytes changed')
        return origin, paths, capsule / 'out/dispatch/run_state.json'
    return origin, selected.EvidencePaths(root.parents[1], origin), root / 'run_state.json'


def closure(board):
    rows = board['film_direction']['renderer_inputs']
    result = {row['path']: row['sha256'] for row in rows}
    require(rows and len(result) == len(rows) and all(
        not Path(path).is_absolute() and '..' not in Path(path).parts and len(sha) == 64
        for path, sha in result.items()), 'selected repair needs a complete unique renderer closure')
    return result


def provenance(board_path):
    """Return verified evidence or None for the unchanged ordinary comparison route."""
    import critic_gate
    import modern_film
    from completion_yield import original_critic_review
    from production_lifecycle import opening_reboard_reference
    from creative_production import fingerprint
    board_path = Path(board_path).resolve(); root = board_path.parent
    import creative_production
    if not creative_production.required(read(board_path)):
        return None
    state_path = root / 'run_state.json'; state = read(state_path)
    if selected.active_adoption(state) is None:
        return None
    proof = selected.selection_proof(state_path)
    origin, paths, evidence_state = context(root, proof)
    repo = root.parents[1]
    locate = paths.path
    def logical(value):
        path = Path(str(value).replace('{REPO}', str(origin)))
        if not path.is_absolute():
            path = origin / path
        return paths.logical(path)
    def owned(value):
        return locate(logical(value))
    retained = selected.packaged_paths(root)
    comparison_path = retained.path(proof['comparison']['path']) if retained else Path(proof['comparison']['path'])
    comparison = read(comparison_path)
    require(bound(root / 'openings/comparison.json')['sha256'] == proof['comparison']['sha256'],
            'selected source continuation requires the exact retained original comparison')
    from opening_compare import evidence_path
    for option in comparison['options']:
        for key in ('board', 'film', 'inspection'):
            if key in option:
                evidence_path(root / 'openings', option[key])
    require(read(root / 'openings/selection.json').get('selected') == proof['selected'],
            'retained opening choice differs from the original independent selection')
    original_board = read(comparison_path.parent / next(
        option for option in comparison['options'] if option['id'] == proof['selected'])['board']['file'])
    board = read(board_path); chosen = read(root / ('opening-' + proof['selected'] + '.json'))
    before, current = closure(original_board), closure(chosen)
    events = state['events']; adopted = max(i for i, event in enumerate(events) if event is selected.active_adoption(state))
    corrected = any(event.get('kind') == 'repair_authorized' and any(
        logical(row['path']).relative_to(origin).as_posix() in before
        for row in (event.get('repair_plan') or {}).get('changed_inputs', []))
        for event in events[adopted + 1:])
    if before == current and not corrected:
        return None
    require(set(before) == set(current), 'selected repair cannot add or remove renderer dependencies')
    require(all(selected.narration_identity(item) == proof['narration_sha256'] for item in (board, chosen)),
            'selected repair changed the chosen story or narration')
    require(closure(board) == current, 'selected storyboard and treatment renderer closures differ')
    require(current == {r['path']: r['sha256'] for r in modern_film.renderer_inputs(
        chosen['film_direction']['episode'], REPO)}, 'selected repair renderer inputs are stale')
    inventory = set(); relevant = set(); chain = dict(before); last_authorized = adopted
    # Compare retained original paid events with the live/public ledger, not only a capsule index.
    original_events = {proof['original_review_event_index'], comparison['reservation']['event_index']}
    code_claim = retained.path(proof['original_code_claim']['path']) if retained else Path(proof['original_code_claim']['path'])
    original_events.add(read(code_claim)['reservation_event_index'])
    require(fingerprint([{'event_index': i, 'event': events[i]} for i in sorted(original_events)])
            == proof['reservation_events_sha256'], 'original selected comparison reservation events changed')
    for index, event in enumerate(events[adopted + 1:], adopted + 1):
        if event.get('kind') != 'repair_authorized':
            continue
        plan = event.get('repair_plan') or {}
        inputs = plan.get('changed_inputs') or []
        relative = lambda value: logical(value).relative_to(origin).as_posix()
        if not any(relative(row['path']) in chain for row in inputs):
            continue
        require(event.get('repair_scope', 'standard') == 'standard'
                and all(relative(row['path']) in chain for row in inputs),
                'selected source continuation supports only an admitted renderer correction')
        starts = [i for i in range(last_authorized + 1, index)
                  if events[i].get('kind') == 'repair_started']
        require(bool(starts), 'selected source correction has no preceding admitted repair')
        start = starts[-1]; started = events[start]
        require(len(started.get('plan_sha256', '')) == 64
                and started.get('repair_scope', 'standard') == event.get('repair_scope', 'standard')
                and all(started.get(key) == plan.get(key) and bool(plan.get(key))
                        for key in ('director_identity', 'mechanism_id')),
                'selected repair changed its admitted scope, director or mechanism')
        require(started.get('failure_sha256') == plan.get('failure_evidence_sha256'),
                'selected repair changed its original failure')
        baselines = normalized(started.get('baselines'), origin, repo)
        expected = normalized([{k: row[k] for k in ('path', 'before_path', 'before_sha256')}
                               for row in inputs], origin, repo)
        require(baselines == expected, 'selected repair changed the inputs admitted before editing')
        charge = opening_reboard_reference(events, start, index)
        relevant.update((start, charge['reservation_event_index'], index))
        plan_path = selected.matching_json(paths.root / 'out/dispatch', event['repair_plan_sha256'], '*plan*.json')
        require(normalized(read(plan_path), origin, repo) == normalized(plan, origin, repo),
                'selected repair plan differs from its authorized bytes')
        inventory.add(plan_path)
        failure = owned(plan['failure_evidence'])
        require(bound(failure)['sha256'] == plan['failure_evidence_sha256'], 'selected repair failure evidence changed')
        inventory.add(failure)
        original_receipt = retained.path(proof['original_review']['path']) if retained else Path(proof['original_review']['path'])
        diagnosis = read(original_receipt)['report'] == read(failure)
        for attempt in range(adopted + 1, start):
            if events[attempt].get('kind') != 'reserved' or events[attempt].get('resources', {}).get('storyboard_critics') != 1:
                continue
            prior = original_critic_review(evidence_state, attempt)
            if prior['report'] == read(failure):
                diagnosis = True; relevant.add(attempt)
                inventory.update(Path(prior[key]['path']) for key in ('receipt', 'packet', 'claim'))
        require(diagnosis, 'selected repair diagnosis lacks its original independent native findings')
        changed = []
        for row in inputs:
            key = relative(row['path']); baseline = owned(row['before_path'])
            require(bound(baseline)['sha256'] == row['before_sha256'] == chain[key],
                    'selected repair baseline does not continue the original renderer source')
            require(len(row['after_sha256']) == 64, 'selected repair has no completed source hash')
            inventory.add(baseline)
            if row['before_sha256'] != row['after_sha256']:
                changed.append((str(logical(row['path'])), row['after_sha256']))
            chain[key] = row['after_sha256']
        require(changed, 'selected repair authorizes no source change')
        revision = hashlib.sha256(json.dumps(sorted(changed), sort_keys=True).encode()).hexdigest()
        require(event.get('repair_revision') == revision, 'selected repair revision identity changed')
        last_authorized = index
    require(last_authorized > adopted and chain == current,
            'current selected source has no complete charged authorized repair chain')
    candidates = []
    for i, event in enumerate(events):
        if i <= last_authorized or event.get('kind') != 'reserved' or event.get('resources', {}).get('storyboard_critics') != 1:
            continue
        original = original_critic_review(evidence_state, i)
        packet = read(original['packet']['path'])
        for key in ('receipt', 'packet', 'claim'):
            inventory.add(Path(original[key]['path']))
        relevant.add(i)
        if packet.get('phone_mode') or packet.get('phone_options'):
            continue
        candidates.append((i, original, packet))
    require(candidates, 'selected source repair needs a later genuine native code review')
    review_index, original, packet = candidates[-1]
    report = original['report']
    if isinstance(report.get('reports'), dict):
        report = report['reports'][proof['selected']]
    if isinstance(report.get('code_reports'), dict):
        report = report['code_reports'][proof['selected']]
    require(report.get('review_scope') == 'code-plan' and report.get('verdict') == 'pass'
            and report.get('blocking_defects') == [], 'latest selected native code review has not passed')
    binding = next(row for row in packet['code_report_bindings']['treatments'] if row['id'] == proof['selected'])
    require(contains_bindings(report, binding['report_bindings'])
            and packet['claims']['sha256'] == proof['claims_sha256'], 'native selected code bindings changed')
    # Existing verified context/metadata continuations retain their frozen code plan.
    # They still validate the actual current board and exact phone evidence independently.
    from review_context import required_baseline
    baseline = required_baseline(board_path)
    reviewed = read(baseline) if baseline is not None else board
    for item in (reviewed, chosen):
        errors = critic_gate.problems(item, report)
        require(not errors, '; '.join(errors))
    for key in ('receipt', 'packet', 'claim'):
        inventory.add(Path(original[key]['path']))
    relevant.add(review_index)
    if evidence_state != state_path:
        held_events = read(evidence_state)['events']
        require(all(normalized(held_events[i], origin, repo) == normalized(events[i], origin, repo)
                    for i in relevant), 'selected repair packaged reservation or authorization changed')
    return {'proof': proof, 'paths': paths, 'origin': origin, 'files': inventory,
            'events': relevant, 'review_event_index': review_index, 'approval': False}


def opening_problems(board_path):
    import creative_production
    try:
        if provenance(board_path) is not None:
            return []
        return creative_production.opening_problems(board_path)
    except (OSError, ValueError, KeyError, TypeError, IndexError, StopIteration) as exc:
        return ['selected repair comparison provenance invalid: ' + str(exc)]


def package_openings(source, destination):
    """Retain both original films plus the exact repair/native-code chain, never new grades."""
    from completion_yield import immutable
    from opening_compare import package_openings as ordinary
    source, destination = Path(source).resolve(), Path(destination).resolve()
    evidence = provenance(source / 'storyboard.json')
    if evidence is None:
        return ordinary(source, destination)
    def copy(path, target):
        require(not path.is_symlink() and (not target.exists() or target.read_bytes() == path.read_bytes()),
                'refusing to replace retained selected repair evidence')
        target.parent.mkdir(parents=True, exist_ok=True); shutil.copy2(path, target)
        require(bound(path)['sha256'] == bound(target)['sha256'], 'selected repair evidence changed during packaging')
    if (source / selected.PACKAGE).exists():
        for path in (source / selected.PACKAGE).rglob('*'):
            if path.is_file():
                copy(path, destination / path.relative_to(source))
        copy(source / ('opening-' + evidence['proof']['selected'] + '.json'),
             destination / ('opening-' + evidence['proof']['selected'] + '.json'))
    else:
        selected.package(source, destination)
    # The ordinary retained receipt/selection and original inspection reports remain byte-identical.
    from opening_compare import evidence_path
    names = {'comparison.json', 'selection.json'}
    def collect(receipt):
        for option in receipt['options']:
            for key in ('board', 'film', 'inspection'):
                if key in option:
                    ref = option[key]; evidence_path(source / 'openings', ref); names.add(ref['file'])
        if receipt.get('inspection_adoption'):
            ref = receipt['inspection_adoption']['original_comparison']
            if ref['file'] not in names:
                names.add(ref['file']); collect(read(evidence_path(source / 'openings', ref)))
    collect(read(source / 'openings/comparison.json'))
    for name in names:
        require(Path(name).name == name, 'opening evidence must name local files')
        copy(source / 'openings' / name, destination / 'openings' / name)
    capsule = destination / PACKAGE; paths = evidence['paths']
    rows = []
    for path in sorted(evidence['files']):
        relative = path.relative_to(paths.root)
        copy(path, capsule / relative)
        rows.append({'path': relative.as_posix(), 'sha256': bound(path)['sha256']})
    state = read(source / 'run_state.json'); relevant = evidence['events']
    ledger = {'run_id': state['run_id'], 'events': [event if i in relevant else {'kind': 'outside-selected-repair-proof'}
                                                 for i, event in enumerate(state['events'])]}
    immutable(capsule / 'out/dispatch/run_state.json', ledger)
    immutable(capsule / 'index.json', {'schema': 'dispatch_selected_repair_package/1', 'files': rows})
    require(not opening_problems(destination / 'storyboard.json'), 'packaged selected repair proof failed validation')
    return sorted(names)
