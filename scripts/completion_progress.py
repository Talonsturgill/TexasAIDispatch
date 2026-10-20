"""Retire a failed implementation at the creative boundary instead of renaming it."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import re

EFFECTIVE_DATE = '2026-10-20'
FIELD = 'retained_replacement'
SCHEMA = 'dispatch_retained_scene_replacement/1'
REPO = Path(__file__).resolve().parents[1]


def enabled(state):
    return (state.get('mode') == 'production'
            and str(state.get('run_id', ''))[:10] >= EFFECTIVE_DATE)


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


def admission_problems(state, plan):
    """This changes repair admission, never a review verdict or release eligibility."""
    if not replacement_required(state) or not plan.get('changed_inputs'):
        return []
    if plan.get('repair_scope') in {'technical-integrity', 'review-context', 'narration-performance'}:
        return []  # Their existing independent classifications and frozen dependencies still apply.
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
        started = [e for e in state.get('events', []) if e.get('kind') == 'repair_started']
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
