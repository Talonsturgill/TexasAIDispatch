"""Lossless current-data encoding and explicit inactive-source inventories for provider input."""
from __future__ import annotations
import copy
import difflib
import hashlib
import json
from pathlib import Path
import re

POLICY = Path(__file__).resolve().parents[1] / 'config/independent_packet_compaction.json'
FANOUT = {'video-engine/src/Dispatch.tsx', 'video-engine/src/modern/registry.tsx'}
CODE = {'.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False)


def current_paths(board, *paths):
    """Equivalent current-package arguments must build identical provider evidence."""
    if str(board.get('date', '')) < json.loads(POLICY.read_text())['effective_edition']:
        return paths
    return tuple(Path(path).resolve() if path is not None else None for path in paths)


def delta(base, target, path=''):
    if base == target:
        return []
    escape = lambda value: str(value).replace('~', '~0').replace('/', '~1')
    if isinstance(base, dict) and isinstance(target, dict):
        rows = [{'op': 'remove', 'path': path+'/'+escape(k)} for k in sorted(base.keys()-target.keys())]
        rows += [{'op': 'add', 'path': path+'/'+escape(k), 'value': copy.deepcopy(target[k])}
                 for k in sorted(target.keys()-base.keys())]
        for key in sorted(base.keys() & target.keys()):
            rows += delta(base[key], target[key], path+'/'+escape(key))
        return rows
    if isinstance(base, list) and isinstance(target, list):
        # Stable shot ids retain unchanged shots when one treatment inserts a shot.
        identity = next((fields for fields in (('id',), ('scene_id',), ('shot_id', 'event_id'))
                         if all(isinstance(row, dict) and all(isinstance(row.get(k), str) for k in fields)
                                for row in base + target)
                         and all(len({tuple(row[k] for k in fields) for row in values}) == len(values)
                                 for values in (base, target))), None)
        key = (lambda row: tuple(row[k] for k in identity)) if identity else canonical
        rows = []
        for op, i1, i2, j1, j2 in reversed(difflib.SequenceMatcher(
                a=[key(row) for row in base], b=[key(row) for row in target], autojunk=False).get_opcodes()):
            if op == 'equal':
                for i, j in zip(range(i1, i2), range(j1, j2)):
                    rows += delta(base[i], target[j], path+'/'+str(i))
            else:
                rows += [{'op': 'remove', 'path': path+'/'+str(i)} for i in reversed(range(i1, i2))]
                rows += [{'op': 'add', 'path': path+'/'+str(i1), 'value': copy.deepcopy(target[j])}
                         for j in reversed(range(j1, j2))]
        candidates = [rows, [{'op': 'replace', 'path': path, 'value': copy.deepcopy(target)}]]
        if len(base) == len(target):
            candidates.append([row for i, (a, b) in enumerate(zip(base, target))
                               for row in delta(a, b, path+'/'+str(i))])
        return min(candidates, key=lambda value: len(canonical(value)))
    return [{'op': 'replace', 'path': path, 'value': copy.deepcopy(target)}]


def apply_delta(base, rows):
    result = copy.deepcopy(base)
    for row in rows:
        if row['path'] == '':
            if row['op'] != 'replace':
                raise ValueError('root delta must replace its complete value')
            result = copy.deepcopy(row['value']); continue
        parts = [part.replace('~1', '/').replace('~0', '~') for part in row['path'].split('/')[1:]]
        owner = result
        for part in parts[:-1]:
            owner = owner[int(part)] if isinstance(owner, list) else owner[part]
        key = int(parts[-1]) if isinstance(owner, list) else parts[-1]
        if row['op'] == 'remove':
            del owner[key]
        elif row['op'] in ('add', 'replace'):
            if row['op'] == 'add' and isinstance(owner, list):
                owner.insert(key, copy.deepcopy(row['value']))
            else:
                owner[key] = copy.deepcopy(row['value'])
        else:
            raise ValueError('unsupported lossless delta operation')
    return result


def document(value, base):
    if isinstance(value, str):
        return json.loads(value)
    if not isinstance(value, dict):
        return value
    if value.get('schema') == 'dispatch_lossless_board_delta/1':
        result = apply_delta(base, value['operations'])
        if hashlib.sha256(canonical(result).encode()).hexdigest() != value['canonical_sha256']:
            raise ValueError('lossless board delta changed its complete source data')
        return result
    if value.get('schema') == 'dispatch_lossless_json_file/1':
        return value['value']
    return value


def closure(seeds, repo):
    """Follow selected code imports; the two explicit dispatch tables do not activate all episodes."""
    repo = Path(repo).resolve(); pending = list(seeds); seen = set()
    while pending:
        path = (repo / pending.pop()).resolve()
        if not path.is_relative_to(repo) or not path.is_file():
            raise ValueError('current packet source dependency is absent or outside the repository')
        key = path.relative_to(repo).as_posix()
        if key in seen:
            continue
        seen.add(key)
        if key in FANOUT or path.suffix not in CODE:
            continue
        for relative in re.findall(r"(?:\bfrom\s*|\bimport\s*(?:\(\s*)?|\brequire\s*\(\s*)['\"](\.[^'\"]+)['\"]", path.read_text()):
            base = path.parent / relative
            choices = [base] + [Path(str(base) + suffix) for suffix in ('.ts', '.tsx', '.js', '.jsx', '.json')]
            choices += [base / ('index' + suffix) for suffix in ('.ts', '.tsx', '.js', '.jsx')]
            found = next((p for p in choices if p.is_file()), None)
            if found is None:
                raise ValueError('current packet source import cannot be resolved: '+relative)
            pending.append(found.relative_to(repo))
    return seen


def phone_code_context(text, board_path, bindings):
    """Reuse actual code approval for pixel scope; never reuse its visual verdict."""
    policy = json.loads(POLICY.read_text())
    if (str(text.get('board', {}).get('date', '')) < policy['effective_edition']
            or not policy.get('phone_verified_code_inventory')):
        return text, bindings
    from critic_gate import problems, concept_digest, renderer_digest, renderer_files
    board_path = Path(board_path).resolve()
    package = board_path.parent
    candidates = [package/name for name in ('opening-a-critic.json', 'opening-b-critic.json',
                                            'storyboard_code_critic.json', 'storyboard_critic.json')]
    reports = {path: json.loads(path.read_text()) for path in candidates if path.is_file()}
    if not reports:
        return text, bindings
    boards = [Path(board_path)] + [package/'openings'/f'{name}.json' for name in ('a', 'b')
                                 if (package/'openings'/f'{name}.json').is_file()]
    rows, used, source_paths = [], {}, set()
    for path in boards:
        board = json.loads(path.read_text())
        found = next(((report_path, report) for report_path, report in reports.items()
                      if report.get('verdict') == 'pass' and not report.get('reviewed_preflight_sha256')
                      and report.get('review_scope') != 'exact-muted-phone-preflight'
                      and (report.get('story_review') or {}).get('claims_sha256') == bindings['claims_sha256']
                      and not problems(board, report)), None)
        if found is None:
            # Keep complete callable source if no exact current code approval exists.
            return text, bindings
        report_path, report = found
        key = report_path.name
        used[key] = {'path': str(report_path), 'sha256': sha(report_path), 'report': report}
        rows.append({'board': str(path), 'board_sha256': sha(path), 'concept_sha256': concept_digest(board),
                     'renderer_sha256': renderer_digest(board), 'code_report': key})
        source_paths.update(p.resolve() for p in renderer_files(board) if p.suffix in CODE)
    context = {'schema': 'dispatch_verified_code_plan_context/1', 'boards': rows, 'reports': used,
               'scope': 'Current code-plan passes only. They provide no phone observation, selection or film approval.'}
    text = copy.deepcopy(text); text['verified_code_plan_context'] = context
    text['_verified_code_source_paths'] = sorted(str(p) for p in source_paths)
    return text, {**bindings, 'verified_code_plan_context_sha256': hashlib.sha256(canonical(context).encode()).hexdigest()}


def compact(text, package, role, repo):
    policy = json.loads(POLICY.read_text()); board = text.get('board')
    if not isinstance(board, dict) or str(board.get('date', '')) < policy['effective_edition'] or role not in policy['roles']:
        return text, None
    text = copy.deepcopy(text); board = text['board']; repo = Path(repo).resolve(); package = Path(package).resolve()
    files = text['files']; episodes = {(board.get('film_direction') or {}).get('episode')}
    for key, value in list(files.items()):
        path = (repo / key).resolve()
        if (path.suffix != '.json' or not path.is_file()
                or not (path.is_relative_to(package) or key in policy.get('structured_data_files', []))):
            continue
        parsed = document(value, board)
        if isinstance(parsed, dict) and isinstance(parsed.get('scenes'), list) and parsed.get('date') == board.get('date'):
            episodes.add((parsed.get('film_direction') or {}).get('episode'))
            operations = delta(board, parsed)
            if apply_delta(board, operations) != parsed:
                raise ValueError('current treatment could not be represented losslessly')
            files[key] = {'schema': 'dispatch_lossless_board_delta/1', 'base': 'board',
                'original_sha256': sha(path), 'canonical_sha256': hashlib.sha256(canonical(parsed).encode()).hexdigest(),
                'operations': operations}
        elif isinstance(value, str):
            files[key] = {'schema': 'dispatch_lossless_json_file/1', 'original_sha256': sha(path), 'value': parsed}
    inventory = {row['path']: row for row in text.get('inactive_renderer_source_inventory', [])}
    episodes.discard(None)
    if role != 'code' and episodes:
        from modern_film import renderer_seed_paths
        registry = json.loads((repo/'config/modern_episode_registry.json').read_text())['episodes']
        if not episodes <= registry.keys():
            raise ValueError('current packet names an unregistered active episode')
        active = closure([path for episode in sorted(episodes) for path in renderer_seed_paths(episode, repo)], repo)
        inactive = closure([path for name, entry in registry.items() if name not in episodes
                            for path in (entry['module'], *entry['assets'])], repo)
        for key in list(files):
            path = (repo/key).resolve()
            if path.is_relative_to(repo) and path.suffix in CODE:
                rel = path.relative_to(repo).as_posix()
                if rel in inactive and rel not in active:
                    inventory[rel] = {'path': rel, 'sha256': sha(path), 'bytes': path.stat().st_size,
                                      'basis': 'Inactive registered episode outside all selected executable closures'}
                    del files[key]
    if inventory:
        text['inactive_renderer_source_inventory'] = [inventory[key] for key in sorted(inventory)]
    verified_paths = {Path(p) for p in text.pop('_verified_code_source_paths', [])}
    if role == 'phone' and verified_paths and text.get('verified_code_plan_context'):
        reviewed = {row['path']: row for row in text.get('verified_code_source_inventory', [])}
        for key in list(files):
            path = (repo/key).resolve()
            if path in verified_paths:
                if files[key] != path.read_text():
                    raise ValueError('code-approved source body differs from its current inventory bytes')
                reviewed[key] = {'path': key, 'sha256': sha(path), 'bytes': path.stat().st_size}
                del files[key]
        text['verified_code_source_inventory'] = [reviewed[key] for key in sorted(reviewed)]
    text['packet_compaction'] = {'version': policy['version'], 'policy_sha256': sha(POLICY),
                                 'active_episodes': sorted(episodes)}
    files['config/independent_packet_compaction.json'] = POLICY.read_text()
    return text, sha(POLICY)
