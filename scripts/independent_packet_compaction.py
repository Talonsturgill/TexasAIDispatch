"""Lossless current-data encoding and explicit inactive-source inventories for provider input."""
from __future__ import annotations
import copy
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
    if isinstance(base, list) and isinstance(target, list) and len(base) == len(target):
        return [row for i, (a, b) in enumerate(zip(base, target)) for row in delta(a, b, path+'/'+str(i))]
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


def compact(text, package, role, repo):
    policy = json.loads(POLICY.read_text()); board = text.get('board')
    if not isinstance(board, dict) or str(board.get('date', '')) < policy['effective_edition'] or role not in policy['roles']:
        return text, None
    text = copy.deepcopy(text); board = text['board']; repo = Path(repo).resolve(); package = Path(package).resolve()
    files = text['files']; episodes = {(board.get('film_direction') or {}).get('episode')}
    for key, value in list(files.items()):
        path = (repo / key).resolve()
        if path.suffix != '.json' or not path.is_file() or not path.is_relative_to(package):
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
    text['packet_compaction'] = {'version': policy['version'], 'policy_sha256': sha(POLICY),
                                 'active_episodes': sorted(episodes)}
    files['config/independent_packet_compaction.json'] = POLICY.read_text()
    return text, sha(POLICY)
