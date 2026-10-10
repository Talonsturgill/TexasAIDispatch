"""Bind mandatory modern code defects without requiring an invented board edit."""
import argparse
import hashlib
import json
from pathlib import Path
import re

REASON = 'mandatory-modern-code'
ADOPTION = 'autonomous_completion_modern_code_adopted'
POLICY = Path(__file__).resolve().parents[1] / 'config/autonomous_completion_modern_code_v1.json'
POLICY_SHA256 = '840a288689959204f9277a17005b5cee27d2fe8b6b98088ab89ab62c577f0ea3'
MODERN_SHA256 = '9cbc00a5b23b4200ef183a18dede6f9381a98322cc755fbf5e55460dfbf7698e'
GUIDE_SHA256 = '58d96117cc3d3e6254d7547a8878a21f31bdbdb804e649f78b54a8f59fb368bb'


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def eligible(state, plan, report):
    from autonomous_completion import CODE_ADOPTION, sha
    from critic_gate import concept_digest
    try:
        proof = plan['modern_code_evidence']
        packet = json.loads(proof['packet_json'])
        modern = json.loads(proof['modern_json'])
        rows = proof['inputs']
        inputs = {row['path']: row for row in rows}
        board_rows = {row['path']: row for row in rows if row['kind'] == 'board'}
        if (state.get('mode') != 'production' or state.get('terminal_state') is not None
                or str(state.get('run_id', ''))[:10] < '2026-10-09'
                or not any(e.get('kind') == CODE_ADOPTION for e in state['events'])
                or proof.get('schema') != 'dispatch_modern_code_evidence/1'
                or sha(proof['policy_json']) != POLICY_SHA256
                or proof['policy_sha256'] != POLICY_SHA256
                or sha(proof['modern_json']) != MODERN_SHA256
                or sha(proof['guide_text']) != GUIDE_SHA256
                or sha(proof['packet_json']) != proof['packet_sha256']
                or report.get('verdict') != 'revise' or report.get('film_sha256')
                or report.get('reviewed_preflight_sha256')
                or not report.get('reviewer_identity')
                or report['reviewer_identity'] == plan.get('director_identity')
                or 'code' not in ' '.join(str(report.get(k, '')) for k in
                                         ('review_scope', 'scope', 'limits', 'reviewer_identity')).lower()
                or packet.get('role') != 'storyboard-critic'
                or packet.get('date') != str(state['run_id'])[:10]
                or packet['agent_assignment']['model'] != 'claude-opus-5-5'
                or packet['agent_assignment']['effort'] != 'high'
                or len(packet['treatments']) != 2 or len(board_rows) != 3
                or len(inputs) != len(rows)):
            return False
        for ref in [packet['board'], *packet['treatments']]:
            row = board_rows[ref['path']]
            board = json.loads(row['board_json'])
            if (sha(row['board_json']) != ref['sha256'] or row['sha256'] != ref['sha256']
                    or board.get('date') != packet['date']
                    or board.get('cinematic_template') != 'directed-film-v2'
                    or board['film_direction']['version'] != 'directed-film-v2'):
                return False
        index = {'a': 0, 'b': 1}[report['treatment']]
        ref = packet['treatments'][index]
        board = json.loads(board_rows[ref['path']]['board_json'])
        if (proof['reviewed_board_path'] != ref['path']
                or report.get('concept_sha256') != concept_digest(board)
                or report.get('renderer_sha256') != proof['renderer_sha256']
                or not re.fullmatch(r'[a-f0-9]{64}', proof['renderer_sha256'])
                or packet['claims']['sha256'] != inputs[packet['claims']['path']]['sha256']
                or report.get('story_review', {}).get('claims_sha256') != packet['claims']['sha256']):
            return False
        defects = report.get('blocking_defects')
        allowed = set(modern['nondeferrable_categories'])
        scenes = {s['id'] for s in board['scenes']}
        if (allowed != {'motion', 'surface_finish', 'pacing', 'ending_artistry'}
                or not isinstance(defects, list) or not defects
                or any(not isinstance(d, dict) or d.get('category') not in allowed
                       or not str(d.get('defect', '')).strip() or d.get('scene_id') not in scenes
                       or type(d.get('time_s')) not in (int, float)
                       or not 0 <= d['time_s'] <= board['runtime_s'] for d in defects)):
            return False
        changes = plan['changed_inputs']
        assets = {x['path'] for x in packet['asset_inputs']}
        return (bool(changes) and len({x['path'] for x in changes}) == len(changes)
                and all(x['path'] not in assets and inputs[x['path']]['kind'] == 'renderer'
                        and x['before_sha256'] == inputs[x['path']]['sha256'] and x['before_path']
                        for x in changes)
                and all(re.fullmatch(r'[a-f0-9]{64}', x['sha256']) for x in rows))
    except (KeyError, TypeError, ValueError, AttributeError):
        return False


def file_problems(plan):
    try:
        root = POLICY.parent.parent.resolve()
        proof = plan['modern_code_evidence']
        if (digest(POLICY) != POLICY_SHA256
                or digest(root / 'config/modern_film.json') != MODERN_SHA256
                or digest(root / 'knowledge/craft/MODERN_FILM.md') != GUIDE_SHA256):
            return ['current modern code policy or mandatory guide differs from its pinned evidence']
        for row in proof['inputs']:
            path = Path(row['path']).resolve()
            if not path.is_relative_to(root) or digest(path) != row['sha256']:
                return ['modern code input is stale or outside this checkout']
        for item in plan['changed_inputs']:
            path, baseline = Path(item['path']).resolve(), Path(item['before_path']).resolve()
            if (not path.is_relative_to(root / 'video-engine/src') or path.suffix not in {'.ts', '.tsx'}
                    or not baseline.is_relative_to(root) or digest(baseline) != item['before_sha256']):
                return ['modern code correction requires retained current renderer baselines']
        packet_path = Path(proof['packet_path']).resolve()
        if not packet_path.is_relative_to(root) or packet_path.read_text() != proof['packet_json']:
            return ['modern code packet differs from retained bytes']
        from agent_runtime import validate_references, required_inputs
        from claude_runtime import contracts
        packet = json.loads(proof['packet_json'])
        validate_references(packet)
        required_inputs(packet, 'storyboard-critic', contracts('storyboard-critic'))
        from critic_gate import renderer_digest
        board = json.loads(Path(proof['reviewed_board_path']).read_text())
        if renderer_digest(board) != proof['renderer_sha256']:
            return ['modern code renderer closure differs from the independent review']
    except (OSError, ValueError, KeyError, TypeError) as exc:
        return ['modern code evidence could not be verified: ' + str(exc)]
    return []


def rebound_board(plan, row):
    """Only current renderer digests may change in the otherwise frozen board."""
    root = POLICY.parent.parent.resolve()
    board = json.loads(row['board_json'])
    changed = {str(Path(x['path']).resolve().relative_to(root)) for x in plan['changed_inputs']}
    for ref in board['film_direction']['renderer_inputs']:
        if ref['path'] in changed:
            ref['sha256'] = digest(root / ref['path'])
    return board


def rebound_problems(plan):
    try:
        changed = {x['path'] for x in plan['changed_inputs']}
        for row in plan['modern_code_evidence']['inputs']:
            if row['kind'] == 'board' and json.loads(Path(row['path']).read_text()) != rebound_board(plan, row):
                return ['modern code repair changed story, timing, art or other frozen board fields']
            if row['kind'] != 'board' and row['path'] not in changed and digest(row['path']) != row['sha256']:
                return ['modern code repair changed an undeclared source, claim, artwork or guide input']
    except (OSError, ValueError, KeyError, TypeError) as exc:
        return ['modern code board rebind could not be verified: ' + str(exc)]
    return []


def prepare(state_path, plan_path, packet_path, output):
    from autonomous_completion import sha
    from run_controller import read_state
    from review_coverage import references
    from critic_gate import renderer_digest, renderer_files
    from render_manifest import native_media_paths
    state = read_state(Path(state_path)); plan = json.loads(Path(plan_path).read_text())
    text = Path(packet_path).read_text(); packet = json.loads(text)
    root = POLICY.parent.parent.resolve()
    for item in plan.get('changed_inputs', []):
        for key in ('path', 'before_path'):
            item[key] = str((root / item[key]).resolve())
    report_text = Path(plan['failure_evidence']).read_text(); report = json.loads(report_text)
    if sha(report_text) != plan['failure_evidence_sha256']:
        raise ValueError('original independent code rejection differs from retained evidence')
    rows = {x['path']: {**x, 'kind': 'reference'} for x in references(packet)}
    rows[packet['claims']['path']]['kind'] = 'claims'
    for ref in [packet['board'], *packet['treatments']]:
        raw = Path(ref['path']).read_text(); board = json.loads(raw)
        rows[ref['path']].update(kind='board', board_json=raw)
        for renderer in board['film_direction']['renderer_inputs']:
            path = str((root / renderer['path']).resolve())
            rows[path] = {'path': path, 'sha256': renderer['sha256'], 'kind': 'renderer'}
    reviewed = packet['treatments'][{'a': 0, 'b': 1}[report['treatment']]]['path']
    board = json.loads(rows[reviewed]['board_json'])
    for path in [*renderer_files(board), *native_media_paths(board)]:
        rows[str(path.resolve())] = {'path': str(path.resolve()), 'sha256': digest(path), 'kind': 'renderer'}
    plan['completion_reason'] = REASON
    plan['modern_code_evidence'] = {'schema': 'dispatch_modern_code_evidence/1',
        'policy_json': POLICY.read_text(), 'policy_sha256': POLICY_SHA256,
        'modern_json': (root / 'config/modern_film.json').read_text(),
        'guide_text': (root / 'knowledge/craft/MODERN_FILM.md').read_text(),
        'packet_path': str(Path(packet_path).resolve()), 'packet_json': text, 'packet_sha256': sha(text),
        'reviewed_board_path': reviewed, 'renderer_sha256': renderer_digest(board), 'inputs': list(rows.values())}
    if not eligible(state, plan, report):
        raise ValueError('independent current code rejection does not prove a mandatory modern floor')
    errors = file_problems(plan)
    if errors:
        raise ValueError('; '.join(errors))
    with Path(output).open('x') as stream:
        json.dump(plan, stream, indent=2); stream.write('\n')
    return plan


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    for name in ('state', 'plan', 'packet', 'output'):
        p.add_argument('--' + name, type=Path, required=True)
    a = p.parse_args()
    prepare(a.state, a.plan, a.packet, a.output)
    print('Bound mandatory modern code plan; no capacity, charge or film approval granted.')
