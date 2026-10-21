"""Retain public image annotations through real tools, without reading model thinking."""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import shlex
import sys
import tempfile

REPO = Path(__file__).resolve().parents[1]
SCHEMA = 'dispatch_public_visual_observation/1'
ROLE_NAMES = ('dispatch-visual-critic', 'dispatch-visual-scorer')
MAX_HOOK_INPUT_BYTES = 1024 * 1024
MAX_VISUAL_INPUT_BYTES = 32768
CONTRACT = {'schema': SCHEMA, 'channel': 'Write', 'retention': 'one immutable file per image Read',
            'production_inputs': 'read only', 'evaluation': 'final report only'}
INSTRUCTION = ('Use the installed visual leaf and its guarded Write tool for public image annotations. '
    'After each image Read, the hook supplies an exact annotation filename and JSON bindings. '
    'Write brief visible objects, actions and literal text to that file before another image Read. '
    'These are public evidence files, never private thinking or inter-tool narration. '
    'Use null for unknowns. If an image is unseen now, write its literal error and return partial; '
    'a later history placeholder is not an initial transport failure. Keep quality conclusions '
    'and concise public explanations for the final review. Read your own saved facts when earlier '
    'images leave context. Return the observation directory with the complete final review; the '
    'caller mechanically builds coverage from the original annotations and actual Write receipts. '
    'After the first Write, require the actual hook acknowledgment Public image annotation retained '
    'with actual Write evidence. If it is missing, stop with the original tool result and a partial '
    'handoff before another image Read; do not reconstruct a receipt. ')


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def actor(payload):
    if payload.get('agent_type') not in ROLE_NAMES:
        return None
    values = [payload.get('session_id'), payload.get('agent_id')]
    if any(not isinstance(v, str) or not v or len(v) > 160 for v in values):
        raise ValueError('the visual leaf requires the actual host session and agent identity')
    return hashlib.sha256(json.dumps(values, separators=(',', ':')).encode()).hexdigest()


def root_for(path, workspace):
    from image_read_receipt import PRIVATE, REMOTE
    path, workspace = Path(path).absolute(), Path(workspace).resolve()
    if ('..' in path.parts or not path.is_relative_to(workspace)
            or any(p.is_symlink() for p in (path, *path.parents))):
        raise ValueError('visual evidence must stay in the owned real workspace')
    import subprocess
    for root in path.parents:
        if root == workspace:
            break
        if not (root / '.git').exists():
            continue
        relative = path.relative_to(root)
        if (relative.parts[:2] not in (('out', 'dispatch'), ('out', 'environment-test'))
                or any(PRIVATE.search(p) for p in relative.parts)):
            break
        remote = subprocess.check_output(['git', '-C', str(root), 'remote', 'get-url', 'origin'],
                                        text=True, timeout=5).strip().removesuffix('.git')
        if remote not in (REMOTE, 'git@github.com:Talonsturgill/TexasAIDispatch'):
            break
        return root, relative
    raise ValueError('visual annotations belong only to this selected Dispatch artifact package')


def load(path):
    return json.loads(Path(path).read_text())


def exclusive(path, data):
    path = Path(path)
    if any(p.is_symlink() for p in (path, *path.parents)):
        raise ValueError('visual evidence cannot follow symbolic links')
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('x') as stream:
        json.dump(data, stream, indent=2); stream.write('\n')


def delivery_bindings(payload, repo, relative, data):
    identity = actor(payload)
    if identity is None:
        return None
    folder = Path(*relative.parts[:2]) / 'visual-observations' / identity
    data.update(actor_sha256=identity, observation_path=str(folder / (data['event_key'] + '.json')))
    target = repo / data['observation_path']
    template = {'schema': SCHEMA, 'image_event_key': data['event_key'],
                'page': str(relative), 'image_sha256': data['source_sha256'],
                'received': True, 'objects': None, 'actions': None, 'text': None,
                'observed': '', 'literal_error': None}
    return ('Use Write now to save only public visible-frame facts at ' + str(target) + '. '
            'Keep these exact bindings: ' + json.dumps(template, separators=(',', ':')) + '. '
            'Supply a concrete observed description of at least thirty characters and brief '
            'objects/actions/text lists. If unseen now set received:false, observed to the literal '
            'error, and literal_error to that same error; do not infer pixels. No quality grades '
            'or private thinking. This file must be written before another image Read. '
            'Annotation directory for the final handback: ' + str(target.parent) + '.')


def note_input(payload, workspace, *, existing=False):
    identity = actor(payload)
    if identity is None:
        raise ValueError('only the assigned visual leaf can write an annotation')
    target = Path(payload.get('tool_input', {}).get('file_path', ''))
    if not target.is_absolute():
        target = Path(payload.get('cwd') or workspace) / target
    repo, relative = root_for(target, workspace)
    prefix = (*relative.parts[:2], 'visual-observations', identity)
    if (relative.parts[:-1] != prefix or not re.fullmatch(r'[0-9a-f]{64}\.json', target.name)
            or (target.exists() and not existing)):
        raise ValueError('Write is restricted to one new annotation owned by this actual visual leaf')
    raw = payload.get('tool_input', {}).get('content')
    if not isinstance(raw, str) or len(raw.encode()) > 8192:
        raise ValueError('an annotation must be a bounded public JSON object')
    note = json.loads(raw)
    fields = {'schema', 'image_event_key', 'page', 'image_sha256', 'received',
              'objects', 'actions', 'text', 'observed', 'literal_error'}
    if not isinstance(note, dict) or set(note) != fields or note.get('schema') != SCHEMA:
        raise ValueError('use the exact public annotation schema')
    receipt_path = repo.joinpath(*relative.parts[:2], 'image-tool-delivery', target.name)
    if receipt_path.is_symlink():
        raise ValueError('image event evidence cannot be a symbolic link')
    receipt = load(receipt_path)
    if (receipt.get('actor_sha256') != identity or receipt.get('observation_path') != str(relative)
            or note['image_event_key'] != receipt['event_key']
            or note['image_sha256'] != receipt['source_sha256'] or note['page'] != receipt['source_file']
            or digest(repo / note['page']) != note['image_sha256']):
        raise ValueError('annotation does not bind this leaf and its actual unchanged image Read')
    for key in ('objects', 'actions', 'text'):
        value = note[key]
        if value is not None and (not isinstance(value, list) or len(value) > 20
                or any(not isinstance(v, str) or not v.strip() or len(v) > 500 for v in value)):
            raise ValueError('public facts must be brief string lists or null')
    if type(note['received']) is not bool or not isinstance(note['observed'], str):
        raise ValueError('state actual visibility and a public observation')
    if note['received']:
        if (len(note['observed'].strip()) < 30 or note['literal_error'] is not None
                or not receipt['returned_image']):
            raise ValueError('visible facts need an actual returned image and a concrete observation')
    elif (not isinstance(note['literal_error'], str) or not note['literal_error'].strip()
          or len(note['literal_error']) > 1000 or note['observed'] != note['literal_error']):
        raise ValueError('an unseen image requires its exact immediate literal error')
    return repo, relative, note, receipt


def guard(payload, workspace):
    """Deny invalid writes or an image advance without durable facts; never grant permission."""
    if actor(payload) is None:
        raise ValueError('the visual-leaf guard requires its actual host agent type and identity')
    if payload.get('tool_name') == 'Write':
        note_input(payload, workspace)
    elif payload.get('tool_name') == 'Read':
        from image_read_receipt import project
        path = Path(payload.get('tool_input', {}).get('file_path', ''))
        if not path.is_absolute():
            path = Path(payload.get('cwd') or workspace) / path
        owned = project(path, workspace)
        if owned is None:
            return
        repo, relative = owned
        directory = repo.joinpath(*relative.parts[:2], 'image-tool-delivery')
        for source in directory.glob('*.json'):
            if source.is_symlink():
                raise ValueError('image events cannot follow symbolic links')
            row = load(source)
            if row.get('actor_sha256') != actor(payload):
                continue
            annotation = repo / row['observation_path']
            witness = repo.joinpath(*relative.parts[:2], 'visual-observation-receipts',
                                   actor(payload), source.name)
            if not annotation.is_file() or not witness.is_file():
                raise ValueError('Save the previous actual image observation with Write before another image Read: '
                                 + str(annotation))
            if load(annotation).get('received') is False:
                raise ValueError('An image was unseen: return the retained partial handback before further image Reads')
    else:
        raise ValueError('the visual leaf only reads inputs and writes its own new public annotations')


def pre_tool(payload, workspace):
    """Route primary-scope events without restricting unrelated agents or the director."""
    if payload.get('agent_type') in ROLE_NAMES:
        guard(payload, workspace)


def record_write(payload, workspace):
    if payload.get('tool_name') != 'Write' or actor(payload) is None:
        return None
    repo, relative, note, receipt = note_input(payload, workspace, existing=True)
    target = repo / relative
    if not target.is_file() or load(target) != note:
        raise ValueError('the actual Write did not save its exact public annotation')
    identity = actor(payload)
    key = hashlib.sha256(json.dumps([payload.get('session_id'), payload.get('tool_use_id')],
                                   separators=(',', ':')).encode()).hexdigest()
    if not payload.get('tool_use_id'):
        raise ValueError('a real Write tool event is required')
    result = {'schema': 'dispatch_visual_observation_write/1', 'actor_sha256': identity,
              'image_event_key': receipt['event_key'], 'write_event_key': key,
              'observation_path': str(relative), 'observation_sha256': digest(target),
              'written_at': datetime.now(timezone.utc).isoformat(), 'creative_approval': False}
    witness = repo.joinpath(*relative.parts[:2], 'visual-observation-receipts', identity, target.name)
    if witness.exists():
        old = load(witness)
        if {k:v for k,v in old.items() if k != 'written_at'} != {k:v for k,v in result.items() if k != 'written_at'}:
            raise ValueError('an actual observation Write cannot be rewritten')
    else:
        exclusive(witness, result)
    return {'hookSpecificOutput': {'hookEventName': 'PostToolUse', 'additionalContext':
            'Public image annotation retained with actual Write evidence. Continue the complete ordered review.'}}


def note_problems(repo, note, expected_page, expected_sha, *, require_visible=True):
    try:
        fact, witness = note['observation'], note['writer_receipt']
        paths = [Path(ref['path']) for ref in (fact, witness)]
        if any(any(q.is_symlink() for q in (p, *p.parents))
               or not p.resolve().is_relative_to(repo.resolve()) for p in paths):
            return ['visual coverage evidence must stay in its owned package']
        if any(digest(p) != ref['sha256'] for p, ref in zip(paths, (fact, witness))):
            return ['visual coverage annotation or actual Write evidence changed']
        data, write = map(load, paths)
        event = load(repo.joinpath(*expected_page.parts[:2], 'image-tool-delivery', paths[0].name))
        if (data['schema'] != SCHEMA or data['page'] != str(expected_page)
                or data['image_sha256'] != expected_sha or data['received'] != note['received']
                or (require_visible and data['received'] is not True)
                or data['observed'] != note['observed']
                or write['schema'] != 'dispatch_visual_observation_write/1'
                or write['observation_sha256'] != fact['sha256']
                or write['image_event_key'] != data['image_event_key']
                or write['actor_sha256'] != event['actor_sha256']
                or event['source_sha256'] != expected_sha
                or event['observation_path'] != str(paths[0].relative_to(repo))
                or paths[0].parent.name != write['actor_sha256']):
            return ['visual coverage lacks the unchanged independent annotation and its actual Write']
        written = datetime.fromisoformat(write['written_at'].replace('Z', '+00:00'))
        read_at = datetime.fromisoformat(event['observed_at'].replace('Z', '+00:00'))
        if written.tzinfo is None or read_at.tzinfo is None or written < read_at:
            return ['visual annotation timing must follow its actual image Read']
        for p in (repo.joinpath(*expected_page.parts[:2], 'image-tool-delivery')).glob('*.json'):
            later = load(p)
            if later.get('actor_sha256') != write['actor_sha256'] or later['event_key'] == event['event_key']:
                continue
            next_read = datetime.fromisoformat(later['observed_at'].replace('Z', '+00:00'))
            if read_at < next_read < written:
                return ['visual annotation was not saved before the next actual image Read']
        if not data['received'] and (not data.get('literal_error') or data['observed'] != data['literal_error']):
            return ['unseen visual evidence requires its immediate literal error']
        return []
    except (OSError, ValueError, KeyError, TypeError) as exc:
        return ['durable visual coverage unavailable: ' + str(exc)]


def coverage(packet_path, directory, *, partial=False):
    packet_path, directory = Path(packet_path).resolve(), Path(directory).resolve()
    data = load(packet_path)
    repo = Path(data['board']['path']).resolve().parents[2]
    expected = Path(data['board']['path']).resolve().parent / 'visual-observations'
    if (directory.parent != expected or not re.fullmatch(r'[0-9a-f]{64}', directory.name)
            or directory.is_symlink() or data.get('public_visual_evidence') != CONTRACT):
        raise ValueError('use this packet and the original visual leaf annotation directory')
    notes = [p for p in directory.glob('*.json') if not p.is_symlink()]
    refs = ([row['motion_sequence'] for row in data['phone_options']]
            if data.get('role') == 'storyboard-critic' else [data['motion_sequence']])
    rows = []
    stopped = False
    for ref in refs:
        index_path = Path(ref['path'])
        if digest(index_path) != ref['sha256']:
            raise ValueError('the assigned sequence index changed')
        pages = []
        for page in load(index_path)['pages']:
            if stopped:
                break
            relative = (index_path.parent / page['file']).resolve().relative_to(repo)
            found = [p for p in notes if load(p).get('page') == str(relative)
                     and load(p).get('image_sha256') == page['sha256']]
            if len(found) != 1:
                if partial and not found:
                    stopped = True
                    break
                raise ValueError('one original independent annotation is required for ' + str(relative))
            p = found[0]; fact = load(p)
            witness = repo.joinpath(*relative.parts[:2], 'visual-observation-receipts', directory.name, p.name)
            note = {'file': page['file'], 'first_frame': page['samples'][0]['frame'],
                    'last_frame': page['samples'][-1]['frame'], 'received': fact['received'],
                    'observed': fact['observed'], 'observation': {'path': str(p), 'sha256': digest(p)},
                    'writer_receipt': {'path': str(witness), 'sha256': digest(witness)}}
            errors = note_problems(repo, note, relative, page['sha256'], require_visible=not partial)
            if errors:
                raise ValueError('; '.join(errors))
            pages.append(note)
            if not fact['received']:
                note.update(observation_timing='immediate_after_read', observation_channel='write_tool_artifact')
                stopped = True
        rows.append({'index_sha256': ref['sha256'], 'pages': pages})
    return {'schema': 'dispatch_claude_image_coverage/1', 'packet_sha256': digest(packet_path), 'sequences': rows}


def installed_files(source, workspace, guard_source=None):
    source, workspace = Path(source).resolve(), Path(workspace).resolve()
    command = ('python3 ' + shlex.quote(str(Path(guard_source or source).resolve() / 'scripts/visual_observations.py'))
               + ' guard --workspace ' + shlex.quote(str(workspace)))
    return {name + '.md': (source / 'config/claude_agents' / (name + '.md')).read_text().replace(
        '@GUARD_COMMAND@', json.dumps(command)).replace('@RECORD_COMMAND@',
        json.dumps(command.replace(' guard --workspace ', ' record --workspace '))) for name in ROLE_NAMES}


def install(source, workspace):
    """Cache only two owned leaf definitions; leave permission settings and foreign agents intact."""
    source, workspace = Path(source).resolve(), Path(workspace).resolve()
    files = installed_files(source, workspace)
    folder = workspace / '.claude/agents'; marker = workspace / '.claude/dispatch-visual-reviewers.json'
    if any(p.is_symlink() for p in (folder, marker, *folder.parents)):
        raise ValueError('reviewer installation cannot follow symbolic links')
    old = load(marker) if marker.exists() else {}
    for filename, text in files.items():
        target = folder / filename
        if target.is_symlink() or (target.exists() and target.read_text() != text
                and digest(target) != old.get('files', {}).get(filename)):
            raise ValueError('preserve the foreign or edited visual leaf: ' + filename)
    folder.mkdir(parents=True, exist_ok=True)
    def replace_text(target, text):
        with tempfile.NamedTemporaryFile('w', dir=target.parent, delete=False) as stream:
            temporary = Path(stream.name)
            try:
                stream.write(text); stream.flush(); os.fsync(stream.fileno())
                os.replace(temporary, target)
            finally:
                temporary.unlink(missing_ok=True)
    for filename, text in files.items():
        replace_text(folder / filename, text)
    result = {'schema': 'dispatch_visual_leaf_installation/1',
              'files': {name: digest(folder / name) for name in files},
              'guard_root': str(source),
              'guard_sha256': digest(source / 'scripts/visual_observations.py'),
              'permission_settings_changed': False}
    replace_text(marker, json.dumps(result, indent=2) + '\n')
    return result


def check_installation(source, workspace):
    marker = Path(workspace) / '.claude/dispatch-visual-reviewers.json'
    if any(p.is_symlink() for p in (marker, *marker.parents)):
        raise ValueError('visual leaf registration cannot follow symbolic links')
    receipt = load(marker)
    guard_source = Path(receipt['guard_root'])
    if digest(guard_source / 'scripts/visual_observations.py') != digest(Path(source) / 'scripts/visual_observations.py'):
        raise ValueError('the installed visual guard source differs from the current production source')
    expected = installed_files(source, workspace, guard_source)
    if any((Path(workspace) / '.claude/agents' / name).is_symlink()
           or not (Path(workspace) / '.claude/agents' / name).is_file()
           or (Path(workspace) / '.claude/agents' / name).read_text() != text
           for name, text in expected.items()):
        raise ValueError('install the current guarded visual leaves before reserving a visual task')
    settings_path = Path(workspace) / '.claude/settings.json'
    registration_path = Path(workspace) / '.claude/dispatch-capture-registration.json'
    if any(p.is_symlink() for p in (settings_path, registration_path)):
        raise ValueError('visual hook registration cannot follow symbolic links')
    if not settings_path.is_file() or not registration_path.is_file():
        raise ValueError('register the primary-scope visual hooks in prelaunch setup before a paid review')
    settings, registration = load(settings_path), load(registration_path)
    for event, key, command in (
        ('PreToolUse', 'visual_guard_registration', 'pre-tool'),
        ('PostToolUse', 'visual_write_registration', 'record'),
    ):
        expected = {'matcher': 'Read|Write' if event == 'PreToolUse' else 'Write',
                    'hooks': [{'type': 'command', 'command': 'python3 %s %s --workspace %s' %
                        (shlex.quote(str(guard_source / 'scripts/visual_observations.py')),
                         command, shlex.quote(str(Path(workspace).resolve())))}]}
        if (registration.get(key) != expected
                or expected not in settings.get('hooks', {}).get(event, [])):
            raise ValueError('the primary-scope visual hooks are missing or changed; use prelaunch setup')
    image_expected = {'matcher': 'Read', 'hooks': [{'type': 'command', 'command':
        'python3 %s --workspace %s' % (shlex.quote(str(guard_source / 'scripts/image_read_receipt.py')),
                                     shlex.quote(str(Path(workspace).resolve())))}]}
    if (registration.get('image_registration') != image_expected
            or image_expected not in settings.get('hooks', {}).get('PostToolUse', [])):
        raise ValueError('the primary image Read observer is missing or changed; use prelaunch setup')


def main():
    parser = argparse.ArgumentParser(description=__doc__); sub = parser.add_subparsers(dest='command', required=True)
    p = sub.add_parser('guard'); p.add_argument('--workspace', type=Path, required=True)
    p = sub.add_parser('pre-tool'); p.add_argument('--workspace', type=Path, required=True)
    p = sub.add_parser('record'); p.add_argument('--workspace', type=Path, required=True)
    p = sub.add_parser('install'); p.add_argument('--workspace', type=Path, required=True)
    p = sub.add_parser('coverage'); p.add_argument('--packet', type=Path, required=True)
    p.add_argument('--directory', type=Path, required=True); p.add_argument('--output', type=Path, required=True)
    p.add_argument('--partial', action='store_true')
    args = parser.parse_args()
    try:
        if args.command in ('guard', 'pre-tool', 'record'):
            raw = sys.stdin.buffer.read(MAX_HOOK_INPUT_BYTES + 1)
            if len(raw) > MAX_HOOK_INPUT_BYTES:
                raise ValueError('bounded hook transport input exceeded')
            payload = json.loads(raw)
            if not isinstance(payload, dict):
                raise ValueError('hook input must be a complete JSON object')
            # Primary hooks also receive ordinary source writes. Route their full,
            # bounded event before applying the stricter visual evidence limit.
            if (args.command == 'guard' or payload.get('agent_type') in ROLE_NAMES):
                if len(raw) > MAX_VISUAL_INPUT_BYTES:
                    raise ValueError('bounded visual hook input exceeded')
            if args.command == 'guard':
                guard(payload, args.workspace)
            elif args.command == 'pre-tool':
                pre_tool(payload, args.workspace)
            else:
                result = record_write(payload, args.workspace)
                if result:
                    print(json.dumps(result))
        elif args.command == 'install':
            print(json.dumps(install(REPO, args.workspace)))
        else:
            result = coverage(args.packet, args.directory, partial=args.partial); exclusive(args.output, result)
            print(json.dumps({'complete': not args.partial, 'coverage': str(args.output), 'creative_approval': False}))
    except (OSError, ValueError, KeyError, TypeError) as exc:
        print(str(exc), file=sys.stderr)
        return 2 if args.command in ('guard', 'pre-tool') else 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
