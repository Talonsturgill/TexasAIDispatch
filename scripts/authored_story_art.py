"""Fresh source-art receipts for the explicitly selected Claude production lane."""
from __future__ import annotations
import argparse
from datetime import datetime, timedelta, timezone
import hashlib
import json
from pathlib import Path
import re
import uuid
from zoneinfo import ZoneInfo

REPO = Path(__file__).resolve().parents[1]
VERSION = 'authored-story-art-v1'


def read(path):
    return json.loads(Path(path).read_text())


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def fingerprint(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def selected(board):
    return (board.get('story_art') or {}).get('version') == VERSION


def policy(repo=REPO):
    return read(Path(repo) / 'config/authored_story_art.json')


def request_problems(board, repo=REPO):
    plan = board.get('story_art') or {}
    cfg = policy(repo)
    edition = str(plan.get('edition_id', ''))
    if plan.get('runtime') != cfg['runtime'] or str(board.get('date', '')) < cfg['effective_date']:
        return ['authored art requires the explicit current Claude runtime; history is unchanged']
    if (not re.fullmatch(r'\d{4}-\d{2}-\d{2}(?:-[a-z0-9]+(?:-[a-z0-9]+)*)?', edition)
            or edition[:10] != board.get('date')):
        return ['authored art needs its exact current edition identity']
    rows = plan.get('requests')
    if not isinstance(rows, list) or len(rows) != 2:
        return ['authored story art requires exactly two fresh source asset groups']
    try:
        datetime.fromisoformat(board['date'])
    except (ValueError, TypeError):
        return ['authored art calendar date is invalid']
    errors, ids = [], set()
    scenes = {s['id']: s for s in board.get('scenes', [])}
    if {row.get('role') for row in rows} != set(cfg['roles']):
        errors.append('authored art requires a hero and purposeful support')
    for row in rows:
        key = row.get('id'); ids.add(key)
        if not isinstance(key, str) or not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', key):
            errors.append('authored request identities must be stable')
        file = str(row.get('file', ''))
        if (not file.startswith(cfg['namespace'] + edition + '/')
                or '..' in Path(file).parts or Path(file).suffix not in ('.ts', '.tsx')):
            errors.append('fresh authored modules need their own edition namespace')
        if not re.fullmatch(r'[A-Za-z_$][\w$]*', str(row.get('export', ''))):
            errors.append('authored art needs a named executable export')
        if (len(str(row.get('prompt', '')).split()) < 30
                or len(str(row.get('purpose', '')).strip()) < 30
                or len(str(row.get('source_limit', '')).strip()) < 30):
            errors.append('authored art must direct finished forms, purpose and source limits')
        if not row.get('scene_ids') or not set(row['scene_ids']) <= set(scenes):
            errors.append('authored art must name its actual current scenes')
        uses = row.get('action_uses')
        if not isinstance(uses, list) or not uses:
            errors.append('authored art must perform a current on-screen action'); continue
        for use in uses:
            scene = scenes.get(use.get('scene_id'), {})
            events = {event['id']: event for event in scene.get('visual_events', [])}
            if use.get('event_id') not in events or use.get('scene_id') not in row.get('scene_ids', []):
                errors.append('authored art action is absent from its declared scene')
            shots = (board.get('film_direction') or {}).get('shots', [])
            if not any(shot.get('scene_id') == use.get('scene_id')
                       and shot.get('view') == use.get('view') for shot in shots):
                errors.append('authored art action has no actual directed shot')
            if not use.get('action_id') or not use.get('subject_ids'):
                errors.append('authored use needs concrete subjects and an action identity')
    if len(ids) != 2:
        errors.append('two distinct authored request identities are required')
    return errors


def paths(board, repo=REPO):
    return [Path(repo) / row['file'] for row in (board.get('story_art') or {}).get('entries', [])]


def problems(board, repo=REPO):
    errors = request_problems(board, repo)
    if errors:
        return errors
    repo = Path(repo).resolve(); plan = board['story_art']; cfg = policy(repo)
    requests = {row['id']: row for row in plan['requests']}
    entries = plan.get('entries') or []
    if len(entries) != 2 or {row.get('request_id') for row in entries} != set(requests):
        return ['both fresh authored source groups must be recorded before animation']
    hashes, identities = set(), set()
    try:
        registry = read(repo / 'config/modern_episode_registry.json')['episodes']
        episode = registry[board['film_direction']['episode']]
        declarations = episode.get('authored_art') or []
        implementation = (repo / episode['module']).read_text()
        from modern_film import relative_source_closure
        closure = relative_source_closure([episode['module']], repo)
        for row in entries:
            req = requests[row['request_id']]; path = (repo / req['file']).resolve()
            if not path.is_relative_to(repo) or row.get('file') != req['file'] or digest(path) != row.get('sha256'):
                raise ValueError('authored source bytes are absent or changed')
            if row.get('request_sha256') != fingerprint(req):
                raise ValueError('authored source belongs to a different request')
            if row.get('tool') != cfg['tool'] or len(str(row.get('creation_id', ''))) < 20:
                raise ValueError('actual authored creation identity is absent')
            created = datetime.fromisoformat(row['created_at'].replace('Z', '+00:00'))
            if (created.tzinfo is None or created.astimezone(ZoneInfo('America/New_York')).date().isoformat() < board['date']
                    or created > datetime.now(timezone.utc).replace(microsecond=0) + timedelta(minutes=5)):
                raise ValueError('authored source predates this edition')
            if row['sha256'] in hashes or row['creation_id'] in identities:
                raise ValueError('the two source asset groups must be distinct')
            hashes.add(row['sha256']); identities.add(row['creation_id'])
            source = path.read_text()
            if not re.search(r'export\s+(?:const|function|class)\s+' + re.escape(req['export']) + r'\b', source):
                raise ValueError('authored export is not implemented')
            declaration = next((d for d in declarations if d.get('role') == req['role']), None)
            if not declaration or (declaration.get('module'), declaration.get('export')) != (req['file'], req['export']):
                raise ValueError('episode does not bind the current authored source group')
            export = re.escape(req['export'])
            used = re.search(r'(?:<' + export + r'(?=[\s/>])|\b' + export + r'\s*\()', implementation)
            if req['file'] not in episode.get('assets', []) or req['file'] not in closure or not used:
                raise ValueError('authored group is unused by the registered episode')
            for use in req['action_uses']:
                view = (episode.get('narration_views') or {}).get(use['view'], {})
                if (use['view'] not in declaration.get('views', [])
                        or use['action_id'] not in view.get('action_ids', [])
                        or not set(use['subject_ids']) <= set(view.get('subject_ids', []))):
                    raise ValueError('authored art lacks its actual source-bound performed use')
            charge = row['charge']; event = charge['event']
            if (charge.get('kind') != 'production' or fingerprint(event) != charge.get('event_sha256')
                    or event.get('kind') != 'reserved' or event.get('resources', {}).get('reboards', 0) < 1):
                raise ValueError('authored source lacks the actual prior builder reservation')
            if datetime.fromisoformat(event['at'].replace('Z', '+00:00')) >= created:
                raise ValueError('builder must be charged before source creation')
            if not re.fullmatch(r'[a-f0-9]{64}', str(row.get('source_claims_sha256', ''))):
                raise ValueError('authored source lacks current source-claim bindings')
            if row.get('original_source'):
                original = Path(row['original_source'])
                if original.is_absolute() or '..' in original.parts or original.parts[0] != 'artwork-originals':
                    raise ValueError('original authored source reference leaves its private receipt directory')
            for old in (repo / 'runs').glob('*/storyboard.json'):
                if old.parent.name == plan['edition_id']:
                    continue
                for prior in read(old).get('story_art', {}).get('entries', []):
                    if row['sha256'] == prior.get('sha256') or row['creation_id'] == prior.get('creation_id'):
                        raise ValueError('prior-edition source artwork is not fresh')
    except (OSError, ValueError, KeyError, TypeError, StopIteration) as exc:
        errors.append('fresh authored story art invalid: ' + str(exc))
    return errors


def charge_problems(board, root):
    try:
        state = read(Path(root) / 'run_state.json')
        if state.get('run_id') != board['story_art']['edition_id']:
            raise ValueError('authored art ledger belongs to a different edition')
        claims = digest(Path(root) / 'claims.json')
        for row in board['story_art']['entries']:
            charge = row['charge']
            if (fingerprint(state['events'][charge['index']]) != charge['event_sha256']
                    or row['source_claims_sha256'] != claims):
                raise ValueError('authored art charge or current source claims changed')
            original = Path(root) / row['original_source']
            if digest(original) != row['sha256']:
                raise ValueError('retained original authored source bytes changed or disappeared')
        return []
    except (OSError, ValueError, KeyError, TypeError, IndexError) as exc:
        return ['authored-art production accounting failed: ' + str(exc)]


def record(board_path, state_path, repo=REPO):
    board_path = Path(board_path); board = read(board_path); state = read(state_path)
    errors = request_problems(board, repo)
    if errors:
        raise ValueError('; '.join(errors))
    indices = [i for i, event in enumerate(state['events'])
               if event.get('kind') == 'reserved' and event.get('resources', {}).get('reboards', 0) >= 1]
    if not indices:
        raise ValueError('reserve the existing builder before authoring source art')
    index = indices[-1]; event = state['events'][index]
    charge = {'kind': 'production', 'index': index, 'event': event, 'event_sha256': fingerprint(event)}
    prior = {row['request_id']: row for row in board['story_art'].get('entries', [])}
    claims_hash = digest(board_path.parent / 'claims.json')
    unchanged = all(req['id'] in prior and prior[req['id']].get('sha256') == digest(Path(repo) / req['file'])
                    and prior[req['id']].get('request_sha256') == fingerprint(req)
                    and prior[req['id']].get('source_claims_sha256') == claims_hash
                    for req in board['story_art']['requests'])
    if unchanged:
        errors = problems(board, repo) + charge_problems(board, board_path.parent)
        if errors:
            raise ValueError('; '.join(errors))
        return list(prior.values())
    if prior and index <= max(row['charge']['index'] for row in prior.values()):
        raise ValueError('changed source art needs a newly charged builder attempt; retain the previous receipt')
    entries = []
    originals = board_path.parent / 'artwork-originals'; originals.mkdir(exist_ok=True)
    for req in board['story_art']['requests']:
        old = prior.get(req['id'])
        if (old and old.get('sha256') == digest(Path(repo) / req['file'])
                and old.get('request_sha256') == fingerprint(req)
                and old.get('source_claims_sha256') == claims_hash):
            entries.append(old); continue
        path = Path(repo) / req['file']; creation = 'authored-' + str(uuid.uuid4())
        created = datetime.fromtimestamp(path.stat().st_mtime, timezone.utc).isoformat()
        row = {'request_id': req['id'], 'file': req['file'], 'sha256': digest(path),
               'request_sha256': fingerprint(req), 'creation_id': creation,
               'created_at': created, 'tool': policy(repo)['tool'], 'charge': charge,
               'source_claims_sha256': claims_hash}
        original = originals / (creation + path.suffix)
        original.write_bytes(path.read_bytes())
        row['original_source'] = 'artwork-originals/' + original.name; entries.append(row)
    candidate = dict(board); candidate['story_art'] = dict(board['story_art'], entries=entries)
    errors = problems(candidate, repo) + charge_problems(candidate, board_path.parent)
    receipt = originals / ('receipt-' + str(uuid.uuid4()) + '.json')
    receipt.write_text(json.dumps({'entries': entries, 'validation_errors': errors}, indent=2) + '\n')
    if errors:
        raise ValueError('; '.join(errors))
    board_path.write_text(json.dumps(candidate, indent=2) + '\n')
    return entries


def package(board_path, destination, repo=REPO):
    """Retain the small exact source originals when delivery moves the ledger to runs/."""
    import shutil
    board = read(board_path)
    if not selected(board):
        return
    source = Path(board_path).parent
    errors = problems(board, repo) + charge_problems(board, source)
    if errors:
        raise ValueError('; '.join(errors))
    target = Path(destination) / 'artwork-originals'; target.mkdir(parents=True, exist_ok=True)
    for file in (source / 'artwork-originals').iterdir():
        if file.is_symlink() or not file.is_file() or file.suffix not in ('.ts', '.tsx', '.json'):
            raise ValueError('Authored source receipt package contains an unexpected file')
        shutil.copy2(file, target / file.name)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--board', type=Path, required=True)
    sub = parser.add_subparsers(dest='action', required=True)
    rec = sub.add_parser('record'); rec.add_argument('--state', type=Path, required=True)
    sub.add_parser('verify')
    args = parser.parse_args()
    if args.action == 'record':
        print(json.dumps(record(args.board, args.state), indent=2))
    else:
        board = read(args.board)
        errors = problems(board) + charge_problems(board, args.board.parent)
        print('\n'.join(errors) if errors else 'Fresh source groups, prior builder charge and current actions verified.')
        raise SystemExit(bool(errors))
