"""Retire a failed implementation at the creative boundary instead of renaming it."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import re

EFFECTIVE_DATE = '2026-10-20'
ROLLOUT_FIELD = 'completion_progress_policy'
FIELD = 'retained_replacement'
SCHEMA = 'dispatch_retained_scene_replacement/1'
REPO = Path(__file__).resolve().parents[1]


def enabled(state):
    return (state.get('mode') == 'production' and not state.get('terminal_state')
            and (str(state.get('run_id', ''))[:10] >= EFFECTIVE_DATE
                 or any(row.get('kind') == 'reserved'
                        and row.get(ROLLOUT_FIELD) == EFFECTIVE_DATE
                        and row.get('publication_owner_sha256') and row.get('publication_epoch')
                        for row in state.get('events', []))))


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def structural_digest(path):
    """A rename, comment, coordinate, colour or easing adjustment is not a replacement."""
    pattern = (r'"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'|`(?:\\.|[^`\\])*`'
               r'|/\*.*?\*/|//[^\n]*|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*\b|\s+|.')
    tokens = []
    for token in re.findall(pattern, Path(path).read_text(), flags=re.S):
        if token.isspace() or token.startswith(('//', '/*')):
            continue
        tokens.append('LITERAL' if token[0] in '\'"`' or token[0].isdigit() else
                      'IDENTIFIER' if re.fullmatch(r'[A-Za-z_$][\w$]*', token) else token)
    return hashlib.sha256(''.join(tokens).encode()).hexdigest()


def replacement_required(state):
    if not enabled(state):
        return False
    from creative_release import cap_reached
    return cap_reached(state)


def source_epoch(state):
    """Only a genuinely validated source/script pivot renews the structural route."""
    from validation_completion import FIELD as SOURCE_FIELD, READY, source_validation_problems
    epoch = 0
    for index, row in enumerate(state.get('events', [])):
        if row.get('kind') not in {'mandatory_completion_grant', READY}:
            continue
        try:
            if SOURCE_FIELD in json.loads(row.get('plan_json', '{}')):
                epoch = index + 1
        except (TypeError, ValueError):
            continue
    return epoch if epoch and not source_validation_problems(state, REPO / 'out/dispatch') else 0


def source_pivot_plan(state, plan):
    """Keep the existing charged independent source-pivot and validation path reachable."""
    from validation_completion import FIELD as SOURCE_FIELD, eligible
    if SOURCE_FIELD not in plan:
        return False
    try:
        evidence = Path(plan['failure_evidence'])
        return (digest(evidence) == plan['failure_evidence_sha256']
                and eligible(state, plan, json.loads(evidence.read_text())))
    except (KeyError, TypeError, ValueError, OSError):
        return False


def admission_problems(state, plan):
    """This changes repair admission, never a review verdict or release eligibility."""
    if not replacement_required(state) or not plan.get('changed_inputs'):
        return []
    if plan.get('repair_scope') in {'technical-integrity', 'review-context', 'narration-performance'}:
        return []  # Their existing independent classifications and frozen dependencies still apply.
    if source_pivot_plan(state, plan):
        return []  # Existing capacity/file checks and fresh source validation still apply.
    if any(row.get('kind') == 'repair_started' and FIELD in row
           and row.get('failure_sha256') != plan.get('failure_evidence_sha256')
           for row in state.get('events', [])[source_epoch(state):]):
        return ['the whole-scene replacement route is exhausted for this validated script; '
                'use the existing precharged independent source-pivot and fresh validation path '
                'to choose a different filmable angle before another structural correction; '
                'a new module, mechanism name or capacity increment cannot renew this route']
    message = ('creative boundary reached: replace the whole failed scene implementation using '
               'retained source evidence; another renamed or cosmetic repair is not admitted')
    try:
        proof = plan[FIELD]
        pivot_ref = plan['pivot_review']
        if digest(pivot_ref['path']) != pivot_ref['sha256']:
            return [message + '; original pivot changed']
        pivot = json.loads(Path(pivot_ref['path']).read_text())
        if (proof.get('schema') != SCHEMA or proof.get('kind') != 'whole-scene-replacement'
                or pivot.get(FIELD) != proof or pivot.get('verdict') != 'pass'
                or not pivot.get('reviewer_identity')
                or pivot['reviewer_identity'] == plan.get('director_identity')):
            return [message + '; original independent replacement decision is required']
        source = proof['source_evidence']
        if digest(source['path']) != source['sha256']:
            return [message + '; retained source changed']
        retired, replacements = proof['retired_inputs'], proof['replacement_paths']
        if not retired or not replacements or len(set(replacements)) != len(replacements):
            return [message + '; name the complete retired implementation and its replacement']
        old_paths = set()
        for row in retired:
            path = str(Path(row['path']).resolve())
            old_paths.add(path)
            if (digest(row['before_path']) != row['before_sha256']
                    or digest(path) != row['before_sha256']):
                return [message + '; retired input must match its original registered baseline']
        new_paths = {str(Path(path).resolve()) for path in replacements}
        if new_paths & old_paths:
            return [message + '; an edited old file is not a replacement implementation']
        # Keep the actual source and all failed code. Retirement means no longer rendering it.
        # This never authorizes deletion or old-art reuse.
        repo = REPO.resolve()
        if (not Path(source['path']).resolve().is_relative_to(repo / 'out/dispatch')
                or Path(source['path']).name != 'claims.json'
                or any(not Path(path).is_relative_to(repo / 'video-engine/src') for path in old_paths | new_paths)):
            return [message + '; replacement must use this edition claims and owned authored source']
        if any(e.get('kind') == 'repair_started' and e.get(FIELD)
               and e.get('failure_sha256') != plan.get('failure_evidence_sha256')
               and set(e[FIELD]['replacement_paths']) & new_paths for e in state.get('events', [])):
            return [message + '; a previously failed replacement cannot be recycled']
        return []
    except (KeyError, TypeError, ValueError, OSError):
        return [message + '; retain the original independent whole-scene replacement packet']


def authorization_problems(state, plan, board):
    if enabled(state) and state.get('active_repair'):
        events = state.get('events', [])
        started = [e for e in events if e.get('kind') == 'repair_started']
        if str(state.get('run_id', ''))[:10] < EFFECTIVE_DATE and started:
            adoption = next((index for index, row in enumerate(events)
                             if row.get('kind') == 'reserved'
                             and row.get(ROLLOUT_FIELD) == EFFECTIVE_DATE
                             and row.get('publication_owner_sha256') and row.get('publication_epoch')), None)
            if adoption is not None and events.index(started[-1]) < adoption:
                return []  # Finish an already admitted batch; the next repair uses the new boundary.
        recorded = started[-1].get('progress_replacement_required') if started else None
        if recorded != state['active_repair'].get('progress_replacement_required'):
            return ['the original repair progress admission changed after opening']
        if recorded is False and FIELD not in plan:
            return []  # The third ordinary batch does not become a fourth while being authorized.
    errors = admission_problems(state, plan)
    if errors or not enabled(state) or FIELD not in plan:
        return errors
    try:
        from critic_gate import renderer_files
        actual = {str(path.resolve()) for path in renderer_files(board)}
        proof = plan[FIELD]
        retired = {str(Path(row['path']).resolve()) for row in proof['retired_inputs']}
        replacements = {str(Path(path).resolve()) for path in proof['replacement_paths']}
        if retired & actual or not replacements <= actual:
            return ['whole-scene replacement must remove every retired implementation from the actual renderer closure']
        old_shapes = {structural_digest(row['before_path']) for row in proof['retired_inputs']}
        if any(structural_digest(path) in old_shapes for path in replacements):
            return ['renamed code or numeric/style adjustments do not replace the failed scene implementation']
        return []
    except (KeyError, TypeError, ValueError, OSError):
        return ['whole-scene replacement must retain its original baselines and actual current renderer closure']
