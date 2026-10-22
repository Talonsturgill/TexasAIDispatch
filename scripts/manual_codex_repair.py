"""One explicit Codex-only repair of the retained October21 rejection; never daily capacity."""
from __future__ import annotations
import hashlib
import json
from pathlib import Path

EVENT = 'owner_codex_repair_granted'
CONFIRMATION = 'OWNER APPROVED ONE CODEX REPAIR'
RUN_ID = '2026-10-21'
FILM = '35331bbd2cce687d279878d41a2399fa79b2643e4206adbd7cfa84d0c3e10f59'
OWNER_INSTRUCTION_SHA256 = 'f0bde6c46bb0e50618f14218e6267558569c1917ca397f9a681b56368718613b'
ORIGINAL_AUTHORIZATION_SHA256 = '9cdf52e75f34f9825c5698fcf5f93078aea44794b4fc65809874b9bab188f023'
RESOURCES = {'reboards': 1, 'storyboard_critics': 3, 'preflight_renders': 8,
             'full_renders': 1, 'audiovisual_reviews': 4, 'panel_rounds': 1, 'scorer_calls': 3}
PREFLIGHTS = ('two opening comparison batch', 'exact-phone-a motion-image review extraction',
             'exact-phone-b motion-image review extraction', 'quarter-scale animatic',
             'exact-phone-current motion-image review extraction',
             'finished cinematic hero and stage ablation batch',
             'exact-film motion-image review extraction', 'exact-film mechanical preship probes')
# Exactly one real operator-admission failure inside the original authorized repair.
RETRY_EVENT = 'owner_codex_opening_retry_granted'
FAILED_CHECKPOINT = '488d18ec0ccc485ca29b2e0976708e3eac98ec64'
FAILED_MANIFEST = 'b32ed1ed9cc4eb8f980216085b9cc37d3d7dc7ff5ec8ab5c2ae83881754b9792'
FAILED_RUN = '39814130847'
FAILED_REQUEST = '7d1a20ae1c6164d2bc43623de126ab82d9b017ec'
FAILED_RESERVATION = 'a4ad3aedac95792e0a1859657219fc8ab0a68f7e06410a18558d172baaf626a8'
FAILED_INPUT = 'cb256b6cce4fee52f5357f140794fdbb49b5a427fe04d93b28b0d2b7536f3e38'
FAILED_PREFIX = '7af91835e49908d810772dab6386de7d41507ec9723e489c1267975109b6d3ba'
FAILED_LIFECYCLE = 'out/dispatch/github-capture-results/4e53b06d20945167a4475d47b154c64222b0aa06a9b21fb66dca51e39d563dce.json'
FAILED_LIFECYCLE_SHA = 'add32733934d577067017e3524d8132688260f1a9f24e238f851a0014c6eac7e'
FAILED_LOG = '55ab0d14785ed00ad1b57c3f33e8d29b1d0d0bf69d89201a26476f8aa6f318f7'
FAILED_RESULT = '51e204733e6b4c1b4c755bce26ca9bf593f09fad0cf6fc8ccc6281f10b0db299'
OLD_HELPER = 'e4c4e802627e0a5b52c47c9fbdcb7f27d77e8453946c6fe82fbf3fc5dda2e712'
RETRY_PROTECTED = 'a69a409a5d1e3af2fc0c1720edd4e53d5e1be316e356405e71c7eac582975aac'
REFUSAL = 'opening comparison refused: two alternatives must share dated facts, narration, timing and assets; legacy editions also share the visual body'
FROZEN = ('claims.json', 'vo_script.txt', 'mix_vo.wav')
ALIGNMENT = ('words.json', 'captions.json')
EDITABLE = {'out/dispatch/' + name for name in
            ('storyboard.json', 'opening-a.json', 'opening-b.json', 'credits.txt', 'sfx_events.json',
             'words.json', 'captions.json', 'acoustic-asr.json', 'acoustic-asr-meta.json', 'alignment-16k.wav')}
EDITABLE |= {'config/modern_episode_registry.json',
             'video-engine/src/modern/episodes/2026-10-21/LeakReviewFilm.tsx',
             'video-engine/src/modern/episodes/2026-10-21/LeakReviewSupport.tsx'}


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False)


def sha(text):
    return hashlib.sha256(text.encode()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def file_sha(path):
    from run_controller import digest
    return digest(Path(path))


def plan_key(plan):
    from production_lifecycle import plan_identity
    return plan_identity(plan)


def authorization_problems(auth, state, failure_text):
    owner = auth.get('publication_owner') or {}
    if (auth.get('schema') != 'dispatch_owner_manual_repair_attestation/1'
            or auth.get('instruction_sha256') != OWNER_INSTRUCTION_SHA256
            or auth.get('original_authorization_sha256') != ORIGINAL_AUTHORIZATION_SHA256
            or auth.get('authority') != 'direct human message in current Codex thread'
            or auth.get('run_id') != RUN_ID or state.get('run_id') != RUN_ID
            or auth.get('runtime') != 'codex' or auth.get('daily_review_cap') != 5
            or auth.get('claude_tokens_allowed') != 0 or auth.get('one_time_consolidated_repairs') != 1
            or auth.get('failed_film_sha256') != FILM
            or auth.get('failed_report_sha256') != sha(failure_text)
            or owner.get('runtime') != 'codex' or owner.get('status') != 'held'
            or owner.get('run_id') != RUN_ID or not owner.get('epoch')
            or len(owner.get('owner_sha256', '')) != 64):
        return ['one-time repair requires the exact retained human authorization and Codex owner']
    try:
        report = json.loads(failure_text)
        judges = report['judges']
        if (report.get('ship') is not False or not report.get('hard_fails') or len(judges) != 3
                or {j.get('role') or j.get('audiovisual_role') for j in judges} != {'picture', 'story', 'sound'}
                or len({j['reviewer_identity'] for j in judges}) != 3
                or any(j.get('film_sha256') != FILM for j in judges)):
            raise ValueError('original panel identity')
        from creative_release import findings
        mandatory = {'source', 'rights', 'legibility', 'comprehension', 'technical_audio',
                     'captions', 'motion', 'pacing', 'ending_artistry'}
        if not any(j.get('ship') is False and row.get('category') in mandatory
                   and row.get('finding') in findings(j)
                   for j in judges for row in (j.get('bounded_release') or {}).get('defects', [])):
            raise ValueError('original independently classified mandatory rejection')
    except (ValueError, TypeError, KeyError):
        return ['one-time repair requires the original complete rejected film panel']
    return []


def accounting_prefix(events):
    # Private text/path projection does not change the original dated charge history.
    keys = ('at', 'kind', 'resources')
    return sha(canonical([{k: e[k] for k in keys if k in e} for e in events]))


def telemetry_forecast(events):
    samples = [{'event_index': i, 'reported_tokens': e['resources']['reported_tokens']}
               for i, e in enumerate(events) if e.get('kind') == 'reserved'
               and type(e.get('resources', {}).get('reported_tokens')) is int
               and e['resources']['reported_tokens'] > 0]
    if not samples:
        raise ValueError('complete-path token forecast needs retained actual token charges')
    peak = max(row['reported_tokens'] for row in samples)
    return {'observed_charges': samples, 'observed_max_tokens': peak, 'remaining_av_calls': 4,
            'reserve_percent': 25, 'reported_tokens_allowance': peak * 5,
            'basis': 'four remaining AV calls at observed maximum plus 25 percent reserve; allowance is not actual usage'}


def validate_event(state, row, index, effective=None):
    """Replay retained bytes and real cumulative charges, without reading mutable current outputs."""
    try:
        from review_limit import policy
        policy()  # The one manual grant cannot rewrite the daily five-attempt contract.
        auth = json.loads(row['authorization_json']); plan = json.loads(row['plan_json'])
        errors = authorization_problems(auth, state, row['failure_evidence_json'])
        if errors:
            raise ValueError('; '.join(errors))
        if (sha(row['authorization_json']) != row['authorization_sha256']
                or sha(row['failure_evidence_json']) != row['failure_evidence_sha256']
                or sha(row['plan_json']) != row['plan_sha256']
                or plan_key(plan) != row['plan_identity']
                or plan['failure_evidence_sha256'] != row['failure_evidence_sha256']
                or row['run_id'] != RUN_ID or row['resources'] != RESOURCES
                or row['preflight_operations'] != list(PREFLIGHTS)
                or row['original_envelope_sha256'] != sha(canonical(state['resource_envelope']))
                or row['accounting_prefix_sha256'] != accounting_prefix(state['events'][:index])
                or row['usage_before']['storyboard_critics'] != 5
                or row['grants_no_review_approval'] is not True
                or row['daily_review_limit_unchanged'] is not True):
            raise ValueError('immutable admission bindings')
        if len([e for e in state['events'] if e.get('kind') == EVENT]) != 1:
            raise ValueError('one grant only')
        forecast = telemetry_forecast(state['events'][:index])
        if row['token_forecast'] != forecast:
            raise ValueError('observed complete-path token forecast')
        funded = {**RESOURCES, 'reported_tokens': forecast['reported_tokens_allowance']}
        before = row['previous_envelope']
        increments = {k: max(0, row['usage_before'][k] + n - before[k]) for k, n in funded.items()}
        increments = {k: n for k, n in increments.items() if n}
        if (effective is not None and before != effective
                or row['resource_increments'] != increments
                or row['new_envelope'] != {k: n + increments.get(k, 0) for k, n in before.items()}
                or row['new_ceiling'] != {k: max(n, row['new_envelope'][k])
                                         for k, n in row['previous_ceiling'].items()}):
            raise ValueError('finite complete-path allowance chain')
        later = state['events'][index + 1:]
        if any(e.get('kind') in {EVENT, 'mandatory_completion_grant', 'owner_review_grant',
                                'owner_validator_grant'} for e in later):
            raise ValueError('the manual path cannot renew capacity')
        retries = [(i, e) for i, e in enumerate(state['events']) if e.get('kind') == RETRY_EVENT]
        if len(retries) > 1 or any(validate_retry_event(state, e, i) for i, e in retries):
            raise ValueError('invalid single opening compute retry')
        if retries:
            funded['preflight_renders'] += 1
        for key, old in row['usage_before'].items():
            charged = sum(e.get('resources', {}).get(key, 0) for e in later if e.get('kind') == 'reserved')
            if state['usage'][key] != old + charged or charged > funded.get(key, 0):
                raise ValueError('manual work changed or exceeded cumulative charged ' + key)
        starts = [e for e in later if e.get('kind') == 'repair_started']
        if len(starts) > 1 or any(e.get('failure_sha256') != row['failure_evidence_sha256'] for e in starts):
            raise ValueError('one consolidated repair only')
        notes = [e.get('note') for e in later if e.get('kind') == 'reserved'
                 and e.get('resources', {}).get('preflight_renders')]
        if any(note not in PREFLIGHTS for note in notes) or any(
                notes.count(note) > (2 if retries and note == PREFLIGHTS[0] else 1) for note in notes):
            raise ValueError('one capture per declared operation')
    except (KeyError, ValueError, TypeError) as exc:
        return ['invalid one-time Codex repair: ' + str(exc)]
    return []


def record(state):
    rows = [(i, e) for i, e in enumerate(state.get('events', [])) if e.get('kind') == EVENT]
    if not rows:
        return None
    index, row = rows[0]
    errors = validate_event(state, row, index)
    if errors:
        raise ValueError('; '.join(errors))
    return row



def alignment_content(name, data):
    data = dict(data)
    data.pop('provenance' if name == 'words.json' else 'words_file', None)
    if name == 'captions.json':
        data['cues'] = [{k: v for k, v in cue.items() if k != 'max_lines'} for cue in data['cues']]
    return sha(canonical(data))


def alignment_problems(root, row):
    changed = False
    for proof in row['alignment_inputs']:
        path = root / proof['path']
        if file_sha(path) == proof['sha256']:
            continue
        changed = True
        if alignment_content(path.name, read(path)) != proof['content_sha256']:
            return ['manual realignment must preserve every original spoken word, measured boundary and caption cue']
    if changed:
        out = root / 'out/dispatch'; words = read(out / 'words.json')
        meta = read(out / 'acoustic-asr-meta.json'); provenance = words['provenance']
        config = read(root / 'config/alignment.json')
        if (any(provenance.get(k) != v for k, v in meta.items())
                or meta.get('asr_sha256') != file_sha(out / 'acoustic-asr.json')
                or meta.get('voice_sha256') != file_sha(out / 'mix_vo.wav')
                or meta.get('model_sha256') != config['sha256']
                or meta.get('version') != config['version'] or meta.get('flash_attention') is not False
                or provenance.get('mix_sha256') != file_sha(out / 'mix.wav')
                or provenance.get('script_sha256') != file_sha(out / 'vo_script.txt')):
            return ['manual realignment requires genuine current audio/ASR/model provenance; vo_align verification remains required']
    return []


def runtime_problems(row, state_path=None, packet=None):
    owner = json.loads(row['authorization_json'])['publication_owner']
    if packet is not None:
        local = packet.get('local_recovery') or {}
        if any(local.get(k) != v for k, v in {
                'runtime': 'codex', 'run_id': RUN_ID, 'owner_sha256': owner['owner_sha256'],
                'epoch': owner['epoch']}.items()):
            return ['the manual repair admits only its original Codex owner workers']
    if state_path is not None:
        import publication_owner
        actual = publication_owner.require_owner(state_path)
        if not actual or actual.get('runtime') != 'codex' or any(
                actual.get(k) != owner[k] for k in ('run_id', 'owner_sha256', 'epoch')):
            return ['the manual repair publication owner or epoch changed']
        root = Path(state_path).resolve().parents[2]
        if any(file_sha(root / f['path']) != f['sha256'] for f in row['frozen_inputs']):
            return ['the manual repair cannot change retained claims, narration, voice']
        return alignment_problems(root, row)
    return []


def reservation_problems(state, amounts, *, note=None, state_path=None):
    row = record(state)
    if row is None:
        return []
    errors = runtime_problems(row, state_path)
    for key, count in amounts.items():
        allowed = row['token_forecast']['reported_tokens_allowance'] if key == 'reported_tokens' else RESOURCES.get(key, 0)
        if key == 'preflight_renders' and any(e.get('kind') == RETRY_EVENT for e in state['events']):
            allowed += 1
        spent = state['usage'][key] - row['usage_before'][key]
        if type(count) is not int or count < 1 or spent + count > allowed:
            errors.append('one-time Codex repair has no remaining ' + key + ' allowance')
    if note is not None and amounts.get('preflight_renders'):
        if note not in PREFLIGHTS or amounts != {'preflight_renders': 1}:
            errors.append('manual capture requires one exact declared preflight operation')
        else:
            count = sum(e.get('kind') == 'reserved' and e.get('note') == note
                        for e in state['events'][next(i for i, e in enumerate(state['events']) if e is row) + 1:])
            retry = next((e for e in state['events'] if e.get('kind') == RETRY_EVENT), None)
            if count and not (note == PREFLIGHTS[0] and count == 1 and retry):
                errors.append('this manual capture operation was already charged')
            elif count and state_path is not None:
                errors += retry_input_problems(Path(state_path).resolve().parents[2], retry)
    if note is not None and amounts.get('full_renders') and (amounts != {'full_renders': 1} or note != 'full-resolution Dispatch render'):
        errors.append('manual native capture requires its exact full-render operation')
    return errors


def worker_problems(state, packet, *, charged=False):
    row = record(state)
    if row is None:
        return None
    errors = runtime_problems(row, packet=packet)
    from publication_owner import RESOURCES as worker_resources
    if RESOURCES.get(worker_resources.get(packet.get('role')), 0) == 0:
        errors.append('this role is outside the single manual repair path')
    if packet.get('role') == 'storyboard-critic':
        ordinal = state['usage']['storyboard_critics'] - row['usage_before']['storyboard_critics'] + (0 if charged else 1)
        scope = packet.get('review_scope', 'code-plan')
        expected = {1: ('code-plan', None), 2: ('exact-muted-phone-preflight', 'comparison'),
                    3: ('exact-muted-phone-preflight', 'current')}.get(ordinal)
        if expected is None or (scope, packet.get('phone_mode')) != expected:
            errors.append('manual critics are exactly code, silent comparison, then final timed phone')
    return errors


def budget(state, review_route):
    row = record(state)
    if row is None:
        return None
    from autonomous_completion import effective_envelope
    from production_lifecycle import allowance_problems
    effective = effective_envelope(state)
    funded = {**RESOURCES, 'reported_tokens': row['token_forecast']['reported_tokens_allowance']}
    if any(e.get('kind') == RETRY_EVENT for e in state['events']):
        funded['preflight_renders'] += 1
    resources = {}
    for key, total in funded.items():
        remaining = total - (state['usage'][key] - row['usage_before'][key])
        resources[key] = {'required': remaining, 'used': state['usage'][key],
                          'ceiling': effective[key], 'remaining': min(remaining, effective[key]-state['usage'][key])}
    from repair_guard import budget_deficits
    errors = allowance_problems(state)
    if review_route != 'host':
        errors.append('the one manual repair retains Codex independent workers')
    deficits = budget_deficits(resources)
    return {'feasible': not errors and not deficits, 'errors': errors, 'deficits': deficits,
            'resources': resources, 'review_route': review_route, 'path':'one-time-owner-codex-repair',
            'scope':'Only the unspent approved repair and, if separately recorded, its exact single opening compute retry; no new creative or review cycle.'}


def plan_problems(state, plan):
    row = record(state)
    if row is None:
        return None
    if plan_key(plan) != row['plan_identity']:
        return ['the manual repair plan differs from its single owner-authorized batch']
    return []


def grant(state_path, authorization_path, plan_path, confirmation):
    from run_controller import read_state, save, event
    from repair_guard import envelope_problems
    from production_lifecycle import allowance_problems, resource_request_problems
    from autonomous_completion import effective_envelope
    import publication_owner
    state_path = Path(state_path).resolve(); root = state_path.parents[2]
    state = read_state(state_path)
    if (confirmation != CONFIRMATION or state.get('run_id') != RUN_ID
            or state.get('mode') != 'production' or state.get('terminal_state') is not None
            or state.get('active_repair') or any(e.get('kind') == EVENT for e in state['events'])):
        return False, 'one explicit grant requires the unchanged unfinished October21 run with no active repair'
    errors = envelope_problems(state, {}) + allowance_problems(state)
    if errors:
        return False, '; '.join(errors)
    try:
        private_text = Path(authorization_path).read_text(); private = json.loads(private_text)
        if (sha(private_text) != ORIGINAL_AUTHORIZATION_SHA256
                or private.get('schema') != 'dispatch_owner_manual_repair_authorization/1'
                or sha(private.get('authorization', '')) != OWNER_INSTRUCTION_SHA256
                or private['publication_owner']['owner_sha256'] != sha('codex:' + private.get('thread_id', ''))):
            raise ValueError('original private human authorization bytes or identity changed')
        auth = {k: private[k] for k in ('run_id', 'authority', 'runtime', 'daily_review_cap',
                'claude_tokens_allowed', 'one_time_consolidated_repairs', 'failed_film_sha256', 'failed_report_sha256')}
        auth.update(schema='dispatch_owner_manual_repair_attestation/1',
                    instruction_sha256=OWNER_INSTRUCTION_SHA256,
                    original_authorization_sha256=sha(private_text),
                    publication_owner={k: private['publication_owner'][k]
                        for k in ('runtime', 'run_id', 'status', 'owner_sha256', 'epoch')})
        auth_text = canonical(auth)
        plan_text = Path(plan_path).read_text(); plan = json.loads(plan_text)
        failure_text = Path(plan['failure_evidence']).read_text()
        errors = authorization_problems(auth, state, failure_text)
        owner = publication_owner.require_owner(state_path)
        original_owner = auth['publication_owner']
        if (not owner or owner.get('runtime') != 'codex'
                or any(owner.get(k) != original_owner.get(k) for k in ('run_id', 'owner_sha256', 'epoch'))
                or state['usage']['storyboard_critics'] != 5
                or file_sha(state['deliverable']['film']) != FILM
                or state['deliverable']['film_sha256'] != FILM
                or plan['failure_evidence_sha256'] != sha(failure_text)
                or plan.get('failed_film_sha256', FILM) != FILM or plan.get('repair_scope', 'standard') != 'standard'):
            errors.append('manual repair must retain the exact original film, five calls and current Codex owner')
        errors += resource_request_problems(state, 'standard', plan.get('resources'))
        changed = set()
        for item in plan['changed_inputs']:
            path = Path(item['path']).resolve(); relative = path.relative_to(root).as_posix()
            if relative not in EDITABLE or file_sha(path) != item['before_sha256'] or file_sha(item['before_path']) != item['before_sha256']:
                errors.append('manual repair changed-input scope or retained baseline is invalid')
            changed.add(relative)
        if len(changed) != len(plan['changed_inputs']) or not changed:
            errors.append('manual repair needs distinct exact baseline inputs')
        frozen = [root / 'out/dispatch' / name for name in FROZEN]
        frozen += sorted(p for p in (root / 'out/dispatch/sources').rglob('*') if p.is_file())
        frozen_rows = [{'path': p.relative_to(root).as_posix(), 'sha256': file_sha(p)} for p in frozen]
        alignment = [{'path': 'out/dispatch/' + name, 'sha256': file_sha(root / 'out/dispatch' / name),
                      'content_sha256': alignment_content(name, read(root / 'out/dispatch' / name))}
                     for name in ALIGNMENT]
        if errors:
            return False, '; '.join(errors)
        before = effective_envelope(state)
        forecast = telemetry_forecast(state['events'])
        funded = {**RESOURCES, 'reported_tokens': forecast['reported_tokens_allowance']}
        increments = {k: max(0, state['usage'][k] + n - before[k]) for k, n in funded.items()}
        increments = {k: n for k, n in increments.items() if n}
        after = {k: n + increments.get(k, 0) for k, n in before.items()}
        old_caps = dict(state['escalation_ceiling'])
        new_caps = {k: max(n, after[k]) for k, n in old_caps.items()}
        prefix = accounting_prefix(state['events'])
        ledger_sha = file_sha(state_path)
        state['escalation_ceiling'] = new_caps
        event(state, EVENT, run_id=RUN_ID, authorization_json=auth_text, authorization_sha256=sha(auth_text),
              failure_evidence_json=failure_text, failure_evidence_sha256=sha(failure_text),
              plan_json=plan_text, plan_sha256=sha(plan_text), plan_identity=plan_key(plan), usage_before=dict(state['usage']),
              original_envelope_sha256=sha(canonical(state['resource_envelope'])),
              accounting_prefix_sha256=prefix, original_ledger_sha256=ledger_sha, token_forecast=forecast, resources=dict(RESOURCES), preflight_operations=list(PREFLIGHTS),
              frozen_inputs=frozen_rows, alignment_inputs=alignment, previous_envelope=before, new_envelope=after,
              previous_ceiling=old_caps, new_ceiling=new_caps, resource_increments=increments,
              grants_no_review_approval=True, daily_review_limit_unchanged=True)
        errors = envelope_problems(state, {}) + allowance_problems(state)
        if errors:
            return False, '; '.join(errors)
        save(state_path, state)
        return True, 'one Codex-only repair path funded; reserve each operation before execution; no review or shipment approved'
    except (OSError, KeyError, ValueError, TypeError) as exc:
        return False, 'manual Codex repair refused: ' + str(exc)



def opening_retry_identity(root, helper_sha):
    """Reconstruct the original operator identity with only its helper byte digest substituted."""
    root = Path(root)
    paths = [root/'out/dispatch'/name for name in ('opening-a.json', 'opening-b.json')]
    paths += [root/name for name in ('scripts/opening_compare.py', 'video-engine/scripts/render-batch.mjs',
                                    'video-engine/package-lock.json')]
    for name in ('video-engine/src', 'video-engine/public'):
        paths += [p for p in (root/name).rglob('*') if p.is_file()]
    content = sorted((p.relative_to(root).as_posix(),
                      helper_sha if p == root/'scripts/opening_compare.py' else file_sha(p)) for p in set(paths))
    return sha(json.dumps(['opening-comparison', content]))


def retry_input_problems(root, row):
    try:
        if (opening_retry_identity(root, OLD_HELPER) != FAILED_INPUT
                or file_sha(root/'scripts/opening_compare.py') != row['corrected_helper_sha256']
                or opening_retry_identity(root, row['corrected_helper_sha256']) != row['retry_input_sha256']
                or any(file_sha(root/f['path']) != f['sha256'] for f in row['protected_inputs'])):
            return ['opening retry requires unchanged failed production inputs and the admitted corrected helper']
    except (OSError, ValueError, KeyError, TypeError):
        return ['opening retry production inputs are missing or invalid']
    return []


def validate_retry_event(state, row, index, effective=None):
    """Replay one fixed compute increment; the original repair grant is never rewritten."""
    try:
        from capture_guard import event_digest
        original = next(e for e in state['events'][:index] if e.get('kind') == EVENT)
        owner = json.loads(original['authorization_json'])['publication_owner']
        expected = {'failure_checkpoint': FAILED_CHECKPOINT, 'failure_manifest_sha256': FAILED_MANIFEST,
                    'failure_lifecycle_sha256': FAILED_LIFECYCLE_SHA, 'failure_log_sha256': FAILED_LOG,
                    'failure_result_sha256': FAILED_RESULT, 'failed_reservation_sha256': FAILED_RESERVATION,
                    'failed_input_sha256': FAILED_INPUT, 'run_id': RUN_ID,
                    'original_authorization_sha256': original['authorization_sha256'],
                    'plan_identity': original['plan_identity'], 'owner_sha256': owner['owner_sha256'],
                    'epoch': owner['epoch'], 'resources': {'preflight_renders': 1},
                    'grants_no_review_approval': True, 'daily_review_limit_unchanged': True}
        prefix = state['events'][:index]
        spent = [e for e in prefix if event_digest(e) == FAILED_RESERVATION]
        if (any(row.get(k) != v for k, v in expected.items())
                or len([e for e in state['events'] if e.get('kind') == RETRY_EVENT]) != 1
                or accounting_prefix(prefix) != FAILED_PREFIX
                or row['accounting_prefix_sha256'] != FAILED_PREFIX
                or len(spent) != 1 or spent[0].get('preflight_identity') != FAILED_INPUT
                or spent[0].get('note') != PREFLIGHTS[0] or spent[0].get('resources') != {'preflight_renders': 1}
                or sha(canonical(row['protected_inputs'])) != RETRY_PROTECTED
                or row['corrected_helper_sha256'] == OLD_HELPER
                or len(row['corrected_helper_sha256']) != 64 or len(row['retry_input_sha256']) != 64
                or row['retry_input_sha256'] == FAILED_INPUT):
            raise ValueError('exact original failure, owner, repair, unchanged content or one-use binding')
        before = row['previous_envelope']
        if (effective is not None and effective != before
                or row['new_envelope'] != {k: n + (k == 'preflight_renders') for k, n in before.items()}
                or row['new_ceiling'] != {k: n + (k == 'preflight_renders')
                                          for k, n in row['previous_ceiling'].items()}):
            raise ValueError('exactly one additional preflight; no other resource increment')
        funded = {**RESOURCES, 'preflight_renders': RESOURCES['preflight_renders'] + 1,
                  'reported_tokens': original['token_forecast']['reported_tokens_allowance']}
        required = {k: total - (row['usage_before'][k] - original['usage_before'][k])
                    for k, total in funded.items()}
        if (row['remaining_path'] != required or any(n < 0 or row['new_envelope'][k] - row['usage_before'][k] < n
                                                    for k, n in required.items())
                or any(state['usage'][k] != old + sum(e.get('resources', {}).get(k, 0)
                       for e in state['events'][index+1:] if e.get('kind') == 'reserved')
                       for k, old in row['usage_before'].items())):
            raise ValueError('complete remaining path or cumulative usage changed')
        captures = [e for e in state['events'][index+1:] if e.get('kind') == 'reserved'
                    and e.get('note') == PREFLIGHTS[0]]
        if len(captures) > 1 or any(e.get('preflight_identity') != row['retry_input_sha256']
                                    or e.get('resources') != {'preflight_renders': 1} for e in captures):
            raise ValueError('one newly charged opening retry only')
    except (KeyError, TypeError, ValueError, StopIteration) as exc:
        return ['invalid manual opening retry: ' + str(exc)]
    return []


def grant_opening_retry(state_path, result_path, log_path):
    """Fund the one observed operator refusal; never execute or refund an operation."""
    from run_controller import read_state, save, event
    from autonomous_completion import effective_envelope
    from production_lifecycle import allowance_problems
    import claude_checkpoint as ck
    state_path = Path(state_path).resolve(); root = state_path.parents[2]
    try:
        state = read_state(state_path); original = record(state)
        if (original is None or state.get('terminal_state') is not None
                or state.get('phase') != 'active_repair'
                or any(e.get('kind') == RETRY_EVENT for e in state['events'])):
            raise ValueError('only the original unfinished authorized repair can receive this single increment')
        errors = runtime_problems(original, state_path) + allowance_problems(state)
        if errors:
            raise ValueError('; '.join(errors))
        if (file_sha(result_path) != FAILED_RESULT or file_sha(log_path) != FAILED_LOG
                or REFUSAL not in Path(log_path).read_text()
                or file_sha(state['deliverable']['film']) != FILM
                or state['deliverable']['film_sha256'] != FILM):
            raise ValueError('original public result, operator refusal log or failed film changed')
        result = read(result_path)
        manifest, raw_ledger = ck.verify_checkpoint(root, FAILED_CHECKPOINT, RUN_ID)
        base = f'{ck.ROOT}/{RUN_ID}'
        raw_manifest = ck.show(root, FAILED_CHECKPOINT, base+'/manifest.json')
        raw_lifecycle = ck.show(root, FAILED_CHECKPOINT, base+'/files/'+FAILED_LIFECYCLE)
        lifecycle = json.loads(raw_lifecycle); failed = json.loads(raw_ledger)
        if (hashlib.sha256(raw_manifest).hexdigest() != FAILED_MANIFEST
                or hashlib.sha256(raw_lifecycle).hexdigest() != FAILED_LIFECYCLE_SHA
                or result != {**lifecycle, 'checkpoint_oid': FAILED_CHECKPOINT,
                              'lifecycle_evidence': {'path': FAILED_LIFECYCLE, 'sha256': FAILED_LIFECYCLE_SHA}}
                or lifecycle.get('github_run_id') != FAILED_RUN or lifecycle.get('request_oid') != FAILED_REQUEST
                or lifecycle.get('capture_started') is not True or lifecycle.get('capture_exit_code') != 1
                or lifecycle.get('phase') != 'fixed-operator' or lifecycle.get('operation') != 'openings'
                or lifecycle.get('approval') is not False or lifecycle.get('publication_allowed') is not False
                or failed['usage'] != state['usage']
                or accounting_prefix(failed['events']) != accounting_prefix(state['events'])
                or any(f['path'].startswith('out/dispatch/openings/') for f in manifest['files'])):
            raise ValueError('verified remote failure does not prove this exact spent operator admission with no output')
        protected = sorted([{'path': f['path'], 'sha256': f['sha256']} for f in manifest['files']
                           if f['path'] in EDITABLE], key=lambda f: f['path'])
        helper = file_sha(root/'scripts/opening_compare.py')
        owner = json.loads(original['authorization_json'])['publication_owner']
        if any(lifecycle.get(k) != owner[k] for k in ('owner_sha256', 'epoch')):
            raise ValueError('failed operator belongs to another owner or epoch')
        before = effective_envelope(state); caps = dict(state['escalation_ceiling'])
        row = dict(run_id=RUN_ID, failure_checkpoint=FAILED_CHECKPOINT, failure_manifest_sha256=FAILED_MANIFEST,
                   failure_lifecycle_sha256=FAILED_LIFECYCLE_SHA, failure_log_sha256=FAILED_LOG,
                   failure_result_sha256=FAILED_RESULT, failed_reservation_sha256=FAILED_RESERVATION,
                   failed_input_sha256=FAILED_INPUT, original_authorization_sha256=original['authorization_sha256'],
                   plan_identity=original['plan_identity'], owner_sha256=owner['owner_sha256'], epoch=owner['epoch'],
                   resources={'preflight_renders': 1}, accounting_prefix_sha256=accounting_prefix(state['events']),
                   usage_before=dict(state['usage']), protected_inputs=protected, corrected_helper_sha256=helper,
                   retry_input_sha256=opening_retry_identity(root, helper), previous_envelope=before,
                   new_envelope={k: n + (k == 'preflight_renders') for k, n in before.items()},
                   previous_ceiling=caps, new_ceiling={k: n + (k == 'preflight_renders') for k, n in caps.items()},
                   grants_no_review_approval=True, daily_review_limit_unchanged=True,
                   failure_result_path=Path(result_path).resolve().relative_to(root).as_posix(),
                   failure_log_path=Path(log_path).resolve().relative_to(root).as_posix())
        errors = retry_input_problems(root, row)
        if errors:
            raise ValueError('; '.join(errors))
        funded = {**RESOURCES, 'preflight_renders': RESOURCES['preflight_renders'] + 1,
                  'reported_tokens': original['token_forecast']['reported_tokens_allowance']}
        row['remaining_path'] = {k: n - (state['usage'][k] - original['usage_before'][k]) for k, n in funded.items()}
        state['escalation_ceiling'] = row['new_ceiling']; event(state, RETRY_EVENT, **row)
        errors = allowance_problems(state)
        if errors:
            raise ValueError('; '.join(errors))
        save(state_path, state)
        return True, 'one separate opening compute increment recorded; old attempt remains spent; reserve the corrected opening once'
    except (OSError, ValueError, KeyError, TypeError, ck.CheckpointError) as exc:
        return False, 'manual opening retry refused: ' + str(exc)
