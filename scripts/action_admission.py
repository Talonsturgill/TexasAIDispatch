"""Bound one explanatory action to sources, code and independent review.

Static inspection never substitutes for the existing phone and native film gates.
"""
import hashlib
import json
import re
from pathlib import Path


def source_claims_digest(proposal):
    data = {k: proposal.get(k) for k in ('source_urls', 'claim_ids', 'source_basis', 'limits')}
    return hashlib.sha256(json.dumps(data, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def proposals(owner):
    value = owner.get('action_proposals', [])
    if not isinstance(value, list) or len(value) > 1 or any(not isinstance(p, dict) for p in value):
        raise ValueError('action_proposals must contain at most one new mechanism')
    return value


def strings(value):
    return isinstance(value, list) and bool(value) and all(isinstance(v, str) and v.strip() for v in value) and len(set(value)) == len(value)


def module_path(proposal):
    import daily_production as d
    item = proposal.get('module')
    if not isinstance(item, dict) or not isinstance(item.get('path'), str):
        raise ValueError('action proposal needs a bound module')
    path = Path(item['path'])
    if path.is_absolute() or '..' in path.parts or path.suffix != '.tsx':
        raise ValueError('action module must be a relative TSX source path')
    if not (d.REPO / path).resolve().is_relative_to((d.REPO / 'video-engine/src').resolve()):
        raise ValueError('action module leaves video-engine/src')
    return d.bound(item, d.REPO)


def proposal_problems(owner, selected=None, claims=None):
    import daily_production as d
    errors = []
    try:
        catalog = {a['id'] for a in d.read(d.CATALOG)['actions']}
        for p in proposals(owner):
            if not isinstance(p.get('id'), str) or not re.fullmatch(r'[a-z][a-z0-9-]{3,79}', p['id']) or p['id'] in catalog:
                errors.append('action proposal needs a unique id outside the demonstrated catalog')
            module = module_path(p)
            if not strings(p.get('exports')) or any(not re.fullmatch(r'[A-Z][A-Za-z0-9_]*', x) for x in p.get('exports', [])):
                errors.append('action proposal needs named JSX exports')
            else:
                code = clean_source(module)
                for name in p['exports']:
                    if not re.search(r'export\s+(?:(?:const|function|class)\s+' + re.escape(name) + r'\b|\{[^}]*\b' + re.escape(name) + r'\b[^}]*\})', code):
                        errors.append('action module does not export ' + name)
            for key in ('visible_action', 'consequence', 'limits', 'source_basis'):
                if not isinstance(p.get(key), str) or not 30 <= len(p[key].strip()) <= 1200:
                    errors.append('action proposal needs a concrete ' + key)
            label = p.get('disclosure')
            if not isinstance(label, str) or not 20 <= len(label) <= 72 or not label.startswith('Illustration'):
                errors.append('action proposal needs an explicit Illustration disclosure')
            from story_selection_check import http_url
            if not strings(p.get('source_urls')) or not all(http_url(u) for u in p.get('source_urls', [])):
                errors.append('action proposal needs source_urls')
            if not strings(p.get('claim_ids')):
                errors.append('action proposal needs claim_ids')
            if selected is not None:
                fetched = {s.get('url') for s in selected.get('sources', []) if isinstance(s, dict) and s.get('retrieved')}
                if not set(p.get('source_urls') or []) <= fetched:
                    errors.append('action proposal sources must be fetched selected sources')
            if claims is not None:
                ids = p.get('claim_ids') or []
                bound = [c for c in claims.get('claims', []) if c.get('id') in ids]
                if (len(bound) != len(ids) or any(c.get('verdict') != 'VERIFIED' or not str(c.get('quote', '')).strip()
                    or c.get('url') not in p.get('source_urls', []) for c in bound)
                    or {c.get('url') for c in bound} != set(p.get('source_urls') or [])):
                    errors.append('action proposal needs current VERIFIED claims for every bound source')
    except (ValueError, TypeError, KeyError, OSError) as exc:
        errors.append('action proposal refused: ' + str(exc))
    return errors


def clean_source(path):
    return re.sub(r'/\*.*?\*/|(?m:^[ \t]*//[^\n]*)', '', path.read_text(), flags=re.S)


def imports_call(source, owner, target, exports):
    for names, relative in re.findall(r"import\s*\{([^}]+)\}\s*from\s*['\"](\.[^'\"]+)['\"]", source):
        base = owner.parent / relative
        if not any(p.resolve() == target for p in (base, base.with_suffix('.tsx'), base.with_suffix('.ts'), base / 'index.tsx')):
            continue
        for name in exports:
            if name in [n.strip() for n in names.split(',')] and re.search(r'<' + re.escape(name) + r'\b', source):
                return True
    return False


def board_problems(board):
    errors = proposal_problems(board)
    try:
        items = proposals(board)
        if not items:
            return errors
        if not board.get('cinematic_template') or board.get('cinematic_template') == 'daily-actions-v1':
            return errors + ['proposed action requires a registered custom renderer']
        from critic_gate import renderer_files
        files = renderer_files(board)
        sources = {f: clean_source(f) for f in files if f.name != 'Dispatch.tsx'}
        import daily_production as d
        stage = (d.REPO / 'video-engine/src/lib/cinema/CinematicStage.tsx').resolve()
        if not any(imports_call(s, f, stage, ['CinematicStage']) for f, s in sources.items()):
            errors.append('proposed action renderer must call the shared CinematicStage')
        for p in items:
            target = module_path(p)
            if target not in files or not any(imports_call(s, f, target, p['exports']) for f, s in sources.items() if f != target):
                errors.append('proposed action has no imported renderer call')
            scenes = [s for s in board.get('scenes', []) if s.get('production_action') == p['id']]
            cinema = board.get('cinema') or {}
            if not scenes or cinema.get('hero_scene_id') not in [s.get('id') for s in scenes]:
                errors.append('the proposed action must be used by the native hero scene')
            for s in scenes:
                if s.get('id') not in cinema.get('dimensional_scene_ids', []) or len(s.get('visual_events') or []) < 3:
                    errors.append('proposed action needs a dimensional scene with three visible events')
                if s.get('production_disclosure') != p['disclosure']:
                    errors.append('proposed action scene lacks its Illustration disclosure')
                rows = (board.get('story_contract') or {}).get('scenes', [])
                row = next((r for r in rows if r.get('scene_id') == s.get('id')), {})
                if not set(p['claim_ids']) <= set(row.get('claim_ids') or []):
                    errors.append('proposed action scene omits its source claim bindings')
            if not any(re.search(r'>\s*\{\s*(?:scene|s)\.production_disclosure\s*\}\s*<', src) for src in sources.values()):
                errors.append('custom renderer must display production_disclosure as a JSX child')
    except (ValueError, TypeError, KeyError, OSError) as exc:
        errors.append('action renderer refused: ' + str(exc))
    return errors


def review_problems(board, report):
    errors = []
    try:
        items = proposals(board)
        if not items:
            return []
        reviews = report.get('action_reviews')
        if not isinstance(reviews, list) or len(reviews) != len(items) or any(not isinstance(r, dict) for r in reviews):
            return ['independent critic must review each proposed action exactly once']
        for p in items:
            matches = [r for r in reviews if r.get('action_id') == p['id']]
            if len(matches) != 1:
                errors.append('independent critic omitted the proposed action')
                continue
            r = matches[0]
            if r.get('module_sha256') != p['module']['sha256'] or r.get('source_claims_sha256') != source_claims_digest(p):
                errors.append('independent action review has stale module or source bindings')
            if r.get('verdict') != 'pass' or r.get('blocking_defects') != []:
                errors.append('independent action review has unresolved defects')
            observations = r.get('code_observations') or {}
            for key in ('source_fidelity', 'visible_action', 'consequence', 'disclosure', 'limits'):
                if not isinstance(observations, dict) or not isinstance(observations.get(key), str) or len(observations[key].strip()) < 30:
                    errors.append('independent action review needs concrete code observation for ' + key)
    except (ValueError, KeyError, TypeError) as exc:
        errors.append('action review refused: ' + str(exc))
    return errors
