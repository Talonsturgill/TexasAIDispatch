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
SHARED_SCHEMA = 'dispatch_lossless_shared_packet/1'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False)


def current_paths(board, *paths):
    """Equivalent current-package arguments must build identical provider evidence."""
    if str(board.get('date', '')) < json.loads(POLICY.read_text())['effective_edition']:
        return paths
    return tuple(Path(path).resolve() if path is not None else None for path in paths)


def decode_shared(value):
    if not isinstance(value, dict) or value.get('schema') != SHARED_SCHEMA:
        return value
    values = value['values']; active = set(); memo = {}
    def decode(item):
        if isinstance(item, dict):
            if set(item) == {'$v'}:
                key = item['$v']
                if key in active or key not in values:
                    raise ValueError('shared packet has a cyclic or absent value')
                if key not in memo:
                    active.add(key); memo[key] = decode(values[key]); active.remove(key)
                return copy.deepcopy(memo[key])
            if set(item) == {'$literal'}:
                return {key: decode(child) for key, child in item['$literal'].items()}
            if set(item) == {'$text'}:
                return ''.join(decode(child) for child in item['$text'])
            return {key: decode(child) for key, child in item.items()}
        if isinstance(item, list):
            return [decode(child) for child in item]
        return item
    result = decode(value['packet'])
    if hashlib.sha256(canonical(result).encode()).hexdigest() != value['original_sha256']:
        raise ValueError('shared packet does not reconstruct the complete original input')
    return result


def encode_shared(value):
    """Factor exact repeated values on the wire; retain every original field and text."""
    raw = canonical(value)
    if len(raw) < 100000:
        return value
    counts = {}; originals = {}; lengths = {}; paragraphs = {}; texts = []
    def count(item):
        if isinstance(item, (str, dict, list)):
            encoded = canonical(item)
            # Repeated hashes and short source clauses also save real wire space.
            # The savings check below still rejects unprofitable references.
            if len(encoded) >= 32:
                key = hashlib.sha256(encoded.encode()).hexdigest()
                counts[key] = counts.get(key, 0)+1
                originals.setdefault(key, item); lengths[key] = len(encoded)
        if isinstance(item, dict):
            for child in item.values(): count(child)
        elif isinstance(item, list):
            for child in item: count(child)
        elif isinstance(item, str) and len(item) >= 2048 and '\n\n' in item:
            texts.append(item)
            for part in re.split(r'(\n\n+)', item):
                if len(part) >= 128 and part.strip(): paragraphs[part] = paragraphs.get(part, 0)+1
    count(value)
    shared_paragraphs = {part for part, n in paragraphs.items() if n > 1}
    for text in texts:
        for part in re.split(r'(\n\n+)', text):
            if part in shared_paragraphs: count(part)
    selected = {key for key, n in counts.items() if n > 1 and (n-1)*lengths[key] > 16*n+24}
    keys = {key: str(i) for i, key in enumerate(sorted(selected))}
    def encode(item, own=None):
        if isinstance(item, (str, dict, list)):
            key = hashlib.sha256(canonical(item).encode()).hexdigest()
            if key in keys and key != own:
                return {'$v': keys[key]}
        if isinstance(item, dict):
            result = {name: encode(child) for name, child in item.items()}
            return {'$literal': result} if set(result) in ({'$v'}, {'$literal'}, {'$text'}) else result
        if isinstance(item, list):
            return [encode(child) for child in item]
        if isinstance(item, str) and len(item) >= 2048 and '\n\n' in item:
            pieces = []; pending = ''
            for part in re.split(r'(\n\n+)', item):
                if part in shared_paragraphs:
                    if pending: pieces.append(pending); pending = ''
                    pieces.append(part)
                else: pending += part
            if pending: pieces.append(pending)
            if len(pieces) > 1:
                encoded = {'$text': [encode(part) for part in pieces]}
                if len(canonical(encoded)) < len(canonical(item)): return encoded
        return item
    result = {'schema': SHARED_SCHEMA, 'original_sha256': hashlib.sha256(raw.encode()).hexdigest(),
              'values': {keys[key]: encode(originals[key], key) for key in sorted(keys)}, 'packet': encode(value)}
    # Parent sharing can leave a child with one actual reference. Inline those
    # values instead of paying for a dictionary entry that no longer saves bytes.
    while result['values']:
        references = {}
        def walk(item, remove=None):
            if isinstance(item, dict):
                if set(item) == {'$v'}:
                    key = item['$v']; references[key] = references.get(key, 0)+1
                    return walk(result['values'][key], remove) if remove and key in remove else item
                if set(item) == {'$literal'}:
                    return {'$literal': {key: walk(child, remove) for key, child in item['$literal'].items()}}
                return {key: walk(child, remove) for key, child in item.items()}
            if isinstance(item, list): return [walk(child, remove) for child in item]
            return item
        walk(result['packet'])
        for item in result['values'].values(): walk(item)
        remove = {key for key in result['values'] if references.get(key, 0) < 2}
        if not remove: break
        packet = walk(result['packet'], remove)
        values = {key: walk(item, remove) for key, item in result['values'].items() if key not in remove}
        result.update(packet=packet, values=values)
    if len(canonical(result)) >= len(raw):
        return value
    if canonical(decode_shared(result)) != raw:
        raise ValueError('shared packet encoding changed an original value')
    return result


def prior_review_context(value, original_sha256):
    """Keep complete original findings after verifying the retained prior-scope artifact."""
    from independent_review import evidence_problems, response_object, review_context, fingerprint
    errors = evidence_problems(value)
    proof = value.get('provider_evidence')
    if not proof or errors:
        raise ValueError('prior independent review is unverified: '+'; '.join(errors))
    return {'schema': 'dispatch_verified_prior_review/1', 'original_sha256': original_sha256,
            'scope': 'Prior completed scope only. No observation or verdict approves the new current film.',
            'review': {key: copy.deepcopy(item) for key, item in value.items() if key != 'provider_evidence'},
            'provider_result': response_object(proof['response']),
            'provenance': {**{key: proof[key] for key in ('role', 'model', 'request_id', 'reviewed_at',
                'bindings', 'input_sha256', 'prompt_sha256', 'response_sha256')},
                'response_id': proof['response']['responseId'], 'context_sha256': fingerprint(review_context(proof)),
                'host_failure_sha256': fingerprint(proof['host_failure']),
                'availability_receipt_sha256': (proof.get('availability_recovery') or {}).get('receipt_sha256')}}


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
        if isinstance(parsed, dict) and parsed.get('schema') == 'dispatch_verified_prior_review/1':
            expected = prior_review_context(json.loads(path.read_text()), sha(path))
            if parsed != expected:
                raise ValueError('retained prior-review context changed')
        elif isinstance(parsed, dict) and parsed.get('provider_evidence'):
            files[key] = prior_review_context(parsed, sha(path))
        elif isinstance(parsed, dict) and isinstance(parsed.get('scenes'), list) and parsed.get('date') == board.get('date'):
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
