"""Export actual Codex image delivery and immediate public facts, never thinking or Claude hooks."""
from __future__ import annotations
import argparse
import base64
import hashlib
import json
from pathlib import Path
import re

SCHEMA = 'dispatch_codex_image_coverage/1'
NOTE_SCHEMA = 'dispatch_codex_public_visual_observation/1'
PREFIX = 'CODEX_VISUAL_OBSERVATION '
CONTRACT = {'schema': 'dispatch_codex_public_visual_evidence/1',
            'image_tool': 'view_image', 'detail': 'original',
            'annotation_channel': 'commentary', 'one_image_per_step': True,
            'annotation_before_next_image': True, 'coverage_schema': SCHEMA}
INSTRUCTION = ('For each assigned chronological PNG, use one functions.exec call containing only '
    'const delivered = await tools.view_image({"path":"<absolute PNG>","detail":"original"}); '
    'image(delivered.image_url,"original"); Then immediately publish commentary beginning '
    'CODEX_VISUAL_OBSERVATION followed by one JSON object with schema '
    'dispatch_codex_public_visual_observation/1, packet_sha256, page (absolute PNG path), '
    'image_sha256, received, objects, actions, literal_text, observed. Facts are public, '
    'brief visible objects/actions/literal text; use null for unknowns and at least30 characters '
    'of concrete observed description. Never claim audio from an image. Before another image '
    'call, save this public annotation. If unseen, received:false and observed must be the literal '
    'tool error; stop with partial evidence. Retain actual public rollout records through '
    'codex_visual_observations.py export; never fabricate Claude Read/Write events.')


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def image_parts(payload):
    output = payload.get('output')
    return [p for p in output if isinstance(p, dict) and p.get('type') == 'input_image'] if isinstance(output, list) else []


def view_path(payload):
    """A deliberately narrow, auditable native invocation, not executable code parsing."""
    if payload.get('type') == 'function_call' and payload.get('name') == 'view_image':
        args = json.loads(payload['arguments'])
    elif payload.get('type') == 'custom_tool_call' and payload.get('name') == 'exec':
        match = re.fullmatch(r'\s*const delivered = await tools\.view_image\((\{[^\n]+\})\);\s*'
                             r'image\(delivered\.image_url,"original"\);\s*', payload.get('input', ''))
        if not match:
            return None
        args = json.loads(match[1])
    else:
        return None
    if set(args) != {'path', 'detail'} or args['detail'] != 'original' or not Path(args['path']).is_absolute():
        raise ValueError('Codex image review requires one explicit original absolute PNG')
    return Path(args['path']).resolve()


def annotation(payload):
    if payload.get('type') != 'message' or payload.get('role') != 'assistant' or payload.get('channel') != 'commentary':
        return None
    content = payload.get('content') or []
    text = ''.join(x.get('text', '') for x in content if x.get('type') in ('output_text', 'text'))
    return json.loads(text[len(PREFIX):]) if text.startswith(PREFIX) else None


def public_records(rollout):
    """Do not retain or inspect reasoning payloads, prompts, credentials or user messages."""
    session, records = None, []
    with Path(rollout).open() as stream:
        for number, raw in enumerate(stream, 1):
            row = json.loads(raw)
            if row.get('type') == 'session_meta':
                if session is not None and session != row['payload']['id']:
                    raise ValueError('one actual reviewer session must supply all image observations')
                session = row['payload']['id']
                continue
            if row.get('type') != 'response_item':
                continue
            p = row.get('payload', {})
            if p.get('type') in ('function_call', 'custom_tool_call'):
                # Keep only a native image call, not arbitrary tool source.
                if view_path(p) is None:
                    continue
            elif p.get('type') in ('function_call_output', 'custom_tool_call_output'):
                if not image_parts(p):
                    continue
            elif annotation(p) is None:
                continue
            records.append({'line': number, 'event': row, 'public_source_line': raw,
                            'source_line_sha256': hashlib.sha256(raw.encode()).hexdigest()})
    if not session:
        raise ValueError('actual Codex rollout lacks its session identity')
    return session, records


def packet_records(packet_path, records):
    """An existing reviewer may have earlier packets in the same real rollout."""
    target = digest(packet_path)
    positions = [i for i, r in enumerate(records)
                 if (annotation(r['event']['payload']) or {}).get('packet_sha256') == target]
    if not positions:
        raise ValueError('no actual public annotation for this exact packet')
    first = positions[0]
    outputs = [i for i in range(first) if image_parts(records[i]['event']['payload'])]
    if not outputs:
        raise ValueError('first public annotation lacks actual preceding delivered image')
    output = outputs[-1]
    cid = records[output]['event']['payload'].get('call_id')
    calls = [i for i in range(output) if records[i]['event']['payload'].get('call_id') == cid
             and records[i]['event']['payload'].get('type') in ('function_call', 'custom_tool_call')]
    if len(calls) != 1:
        raise ValueError('first delivered image lacks its actual native call')
    return records[calls[0]:positions[-1]+1]


def packet_pages(packet):
    if packet.get('codex_visual_evidence') != CONTRACT or (packet.get('local_recovery') or {}).get('runtime') != 'codex':
        raise ValueError('Codex image evidence requires the explicit owned local recovery packet')
    refs = ([r['motion_sequence'] for r in packet['phone_options']]
            if packet.get('role') == 'storyboard-critic' else [packet['motion_sequence']])
    result = []
    for ref in refs:
        if digest(ref['path']) != ref['sha256']:
            raise ValueError('assigned sequence index changed')
        pages = read(ref['path'])['pages']
        if not pages:
            raise ValueError('assigned chronological sequence has no pages')
        result.append((ref, pages))
    # Keep all original guides bound; a new runtime is not a new craft contract.
    for row in packet.get('craft_readings', []) + packet.get('completion_readings', []):
        if digest(row['path']) != row['sha256']:
            raise ValueError('bound current guide changed')
    return result


def analyze(packet_path, session, records):
    if not isinstance(session, str) or not session:
        raise ValueError('one actual reviewer session identity is required')
    numbers = [r['line'] for r in records]
    if any(type(n) is not int for n in numbers) or numbers != sorted(set(numbers)):
        raise ValueError('public tool records must retain their actual strict line order')
    packet = read(packet_path)
    expected = [(ref, page) for ref, pages in packet_pages(packet) for page in pages]
    calls, pending, pairs = {}, None, []
    for record in records:
        p = record['event']['payload']
        kind = p.get('type')
        if kind in ('function_call', 'custom_tool_call'):
            path = view_path(p)
            if path is not None:
                if pending is not None:
                    raise ValueError('public annotation must precede the next native image call')
                if calls:
                    raise ValueError('parallel native image calls are forbidden')
                calls[p['call_id']] = record
        elif image_parts(p):
            if pending is not None or p.get('call_id') not in calls:
                raise ValueError('image delivery lacks one exact native call or prior annotation')
            images = image_parts(p)
            if len(images) != 1:
                raise ValueError('one actual delivered image per model step is required')
            pending = (calls.pop(p['call_id']), record)
        else:
            note = annotation(p)
            if note is not None:
                if pending is None:
                    raise ValueError('public image annotation lacks preceding actual image delivery')
                pairs.append((*pending, record, note))
                pending = None
    if calls or pending is not None or len(pairs) != len(expected):
        raise ValueError('complete chronological image delivery and public annotation coverage required')
    rows = []
    for (ref, page), (call, output, observed, note) in zip(expected, pairs, strict=True):
        raw_image = Path(ref['path']).parent / page['file']
        image = raw_image.resolve()
        if (Path(page['file']).name != page['file']
                or any(q.is_symlink() for q in (raw_image, *raw_image.parents))
                or digest(image) != page['sha256']):
            raise ValueError('assigned PNG page missing or changed')
        if view_path(call['event']['payload']) != image:
            raise ValueError('actual image call differs from assigned chronological page')
        uri = image_parts(output['event']['payload'])[0].get('image_url', '')
        if not uri.startswith('data:image/png;base64,'):
            raise ValueError('actual tool result does not contain delivered PNG bytes')
        returned = base64.b64decode(uri.split(',', 1)[1], validate=True)
        if not returned.startswith(b'\x89PNG\r\n\x1a\n') or returned != image.read_bytes():
            raise ValueError('actual delivered PNG bytes differ from assigned original page')
        fields = {'schema', 'packet_sha256', 'page', 'image_sha256', 'received',
                  'objects', 'actions', 'literal_text', 'observed'}
        if (set(note) != fields or note['schema'] != NOTE_SCHEMA or note['packet_sha256'] != digest(packet_path)
                or Path(note['page']).resolve() != image or note['image_sha256'] != page['sha256']
                or note['received'] is not True or not isinstance(note['observed'], str)
                or len(note['observed'].strip()) < 30):
            raise ValueError('public observation lacks exact packet, delivered image or concrete visible facts')
        for key in ('objects', 'actions', 'literal_text'):
            if note[key] is not None and (not isinstance(note[key], list)
                    or not all(isinstance(x, str) and 0 < len(x) <= 1000 for x in note[key])):
                raise ValueError('public facts must be brief string lists or null')
        if not call['line'] < output['line'] < observed['line']:
            raise ValueError('actual public annotation chronology is invalid')
        rows.append({'index_sha256': ref['sha256'], 'file': page['file'],
                     'first_frame': page['samples'][0]['frame'], 'last_frame': page['samples'][-1]['frame'],
                     'image_sha256': page['sha256'], 'returned_sha256': hashlib.sha256(returned).hexdigest(),
                     'received': True, 'observed': note['observed'],
                     'call_id': call['event']['payload']['call_id'],
                     'call_line': call['line'], 'output_line': output['line'], 'annotation_line': observed['line']})
    return {'schema': SCHEMA, 'packet_sha256': digest(packet_path), 'reviewer_session_id': session,
            'planning_or_creative_approval': False, 'audio_access': 'not_established', 'pages': rows}


def coverage(packet_path, rollout_path, output_directory):
    session, records = public_records(rollout_path)
    records = packet_records(packet_path, records)
    result = analyze(packet_path, session, records)
    out = Path(output_directory)
    if not out.resolve().is_relative_to(Path(packet_path).resolve().parent):
        raise ValueError('public visual excerpts must remain in the owned packet package')
    out.mkdir(parents=True, exist_ok=True)
    # Immutable public excerpts, including returned PNG payload, allow later verification
    # without retaining or publishing the full rollout containing private reasoning.
    events = out / 'codex-public-image-events.json'
    encoded = json.dumps({'session_id': session, 'records': records}, separators=(',', ':')) + '\n'
    if events.exists() and events.read_text() != encoded:
        raise ValueError('original public Codex image evidence cannot be rewritten')
    events.write_text(encoded)
    result['public_events'] = {'path': str(events.resolve()), 'sha256': digest(events)}
    return result


def coverage_problems(packet_path, coverage_path):
    try:
        actual = read(coverage_path)
        ref = actual['public_events']
        if Path(ref['path']).is_symlink() or digest(ref['path']) != ref['sha256']:
            return ['actual public Codex tool records are missing or changed']
        evidence = read(ref['path'])
        for record in evidence['records']:
            raw = record['public_source_line']
            if (hashlib.sha256(raw.encode()).hexdigest() != record['source_line_sha256']
                    or json.loads(raw) != record['event']):
                return ['public Codex event differs from its exact retained source line']
            payload = record['event']['payload']
            if not (view_path(payload) is not None or image_parts(payload) or annotation(payload) is not None):
                return ['public Codex excerpt contains nonvisual or private records']
        expected = analyze(packet_path, evidence['session_id'], evidence['records'])
        expected['public_events'] = ref
        return [] if actual == expected else ['Codex visual coverage differs from actual delivered pixels and public facts']
    except (OSError, ValueError, TypeError, KeyError, IndexError) as exc:
        return ['Codex visual coverage unavailable: ' + str(exc)]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    export = sub.add_parser('export')
    export.add_argument('--packet', type=Path, required=True)
    export.add_argument('--rollout', type=Path, required=True)
    export.add_argument('--out', type=Path, required=True)
    check = sub.add_parser('check')
    check.add_argument('--packet', type=Path, required=True)
    check.add_argument('--coverage', type=Path, required=True)
    args = parser.parse_args()
    try:
        if args.command == 'export':
            result = coverage(args.packet, args.rollout, args.out)
            path = args.out / 'codex-image-coverage.json'
            if path.exists() and read(path) != result:
                raise ValueError('original Codex coverage cannot be rewritten')
            path.write_text(json.dumps(result, indent=2) + '\n')
            print(json.dumps({'coverage': str(path.resolve()), 'sha256': digest(path), 'approval': False}))
            return 0
        errors = coverage_problems(args.packet, args.coverage)
        print(json.dumps({'complete': not errors, 'problems': errors, 'approval': False}))
        return int(bool(errors))
    except (OSError, ValueError, TypeError, KeyError, IndexError) as exc:
        print('Codex public visual evidence refused: ' + str(exc))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
