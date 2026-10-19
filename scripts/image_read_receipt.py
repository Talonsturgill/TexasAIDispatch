"""Retain what an actual image Read returned, without claiming model visibility or approval."""
from __future__ import annotations

import argparse
import base64
import binascii
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import struct
import subprocess
import sys

SCHEMA = 'dispatch_image_tool_delivery/1'
REMOTE = 'https://github.com/Talonsturgill/TexasAIDispatch'
MEDIA_LIMIT = '[media removed: request limit]'
MAX_INPUT = 16 * 1024 * 1024
PRIVATE = re.compile(r'(^|[._-])(gmail|readback|routing|private|secret|credentials?)([._-]|$)', re.I)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def project(path, workspace):
    """Resolve only this selected repository's routine or isolated test artifacts."""
    path, workspace = Path(path).absolute(), Path(workspace).resolve()
    if ('..' in path.parts or not path.is_relative_to(workspace)
            or any(p.is_symlink() for p in (path, *path.parents))):
        return None
    if path.suffix.lower() != '.png':
        return None
    for parent in path.parents:
        if parent == workspace:
            break
        if not (parent / '.git').exists():
            continue
        relative = path.relative_to(parent)
        if relative.parts[:2] not in (('out', 'dispatch'), ('out', 'environment-test')):
            return None
        if any(PRIVATE.search(p) for p in relative.parts):
            return None
        remote = subprocess.check_output(['git', '-C', str(parent), 'remote', 'get-url', 'origin'],
                                         text=True, timeout=5).strip().removesuffix('.git')
        if remote not in (REMOTE, 'git@github.com:Talonsturgill/TexasAIDispatch'):
            return None
        return parent, relative
    return None


def record(payload, workspace):
    if payload.get('hook_event_name') != 'PostToolUse' or payload.get('tool_name') != 'Read':
        return None
    value = (payload.get('tool_input') or {}).get('file_path')
    if not isinstance(value, str) or not value:
        return None
    path = Path(value)
    if not path.is_absolute():
        path = Path(payload.get('cwd') or workspace) / path
    owned = project(path, workspace)
    if owned is None:
        return None
    repo, relative = owned
    if path.stat().st_size > 10 * 1024 * 1024:
        return None
    with path.open('rb') as stream:
        source = stream.read(10 * 1024 * 1024 + 1)
    if len(source) > 10 * 1024 * 1024 or source[:8] != b'\x89PNG\r\n\x1a\n' or len(source) < 24:
        return None
    width, height = struct.unpack('>II', source[16:24])
    response = payload.get('tool_response')
    output = response.get('file') if isinstance(response, dict) and response.get('type') == 'image' else None
    returned = None
    if isinstance(output, dict) and isinstance(output.get('base64'), str):
        if output.get('type') not in ('image/png', 'image/jpeg', 'image/webp', 'image/gif'):
            return None
        returned = base64.b64decode(output['base64'], validate=True)
        if not returned:
            return None
        signatures = {'image/png': returned.startswith(b'\x89PNG\r\n\x1a\n'),
                      'image/jpeg': returned.startswith(b'\xff\xd8\xff'),
                      'image/webp': returned.startswith(b'RIFF') and returned[8:12] == b'WEBP',
                      'image/gif': returned.startswith((b'GIF87a', b'GIF89a'))}
        if not signatures[output['type']]:
            raise ValueError('returned image payload has no matching image header')
    elif MEDIA_LIMIT not in (response if isinstance(response, str) else ''):
        return None
    event_id = payload.get('tool_use_id')
    if not isinstance(event_id, str) or not event_id:
        return None
    event_key = sha(json.dumps([payload.get('session_id'), event_id], separators=(',', ':')).encode())
    data = {'schema': SCHEMA, 'event_key': event_key, 'source_file': str(relative),
            'source_sha256': sha(source), 'source_bytes': len(source),
            'source_dimensions': {'width': width, 'height': height},
            'returned_image': returned is not None, 'model_visibility': 'not_established',
            'creative_approval': False, 'reference_only': relative.parts[1] == 'environment-test'}
    if returned is not None:
        data.update(returned_mime=output['type'], returned_bytes=len(returned),
                    returned_sha256=sha(returned), byte_identical_to_file=returned == source)
    else:
        data['literal_tool_error'] = MEDIA_LIMIT
    folder = repo.joinpath(*relative.parts[:2], 'image-tool-delivery')
    if folder.is_symlink() or not folder.resolve().is_relative_to(repo):
        raise ValueError('image delivery evidence must stay in the owned artifact package')
    folder.mkdir(parents=True, exist_ok=True)
    target = folder / (event_key + '.json')
    if target.is_symlink():
        raise ValueError('image delivery evidence cannot follow a symbolic link')
    if target.exists():
        old = json.loads(target.read_text())
        if {k: v for k, v in old.items() if k != 'observed_at'} != data:
            raise ValueError('an actual image tool event cannot be rewritten')
    else:
        data['observed_at'] = datetime.now(timezone.utc).isoformat()
        with target.open('x') as stream:
            stream.write(json.dumps(data, indent=2) + '\n')
    result = ('Read returned an image payload' if returned is not None else 'Read returned the literal media-limit error')
    context = (result + ' for ' + str(relative) + '. Tool-event evidence: ' + str(target.relative_to(repo)) +
               '. This records tool output, not model visibility or creative approval. A later placeholder '
               'for an older image does not establish that its original Read failed. The visibility '
               'observation belongs to the step when that payload was returned.')
    context += (' Before another Read, provide a brief public image description in ordinary '
                'assistant text naming this file, its visibility and visible objects, actions or text. '
                'Keep that description for the coverage report. If unseen now, return partial coverage '
                'with the literal error and stop image traversal; do not invent observations.')
    return {'hookSpecificOutput': {'hookEventName': 'PostToolUse', 'additionalContext': context}}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--workspace', type=Path, required=True)
    args = parser.parse_args()
    try:
        raw = sys.stdin.buffer.read(MAX_INPUT + 1)
        if len(raw) > MAX_INPUT:
            raise ValueError('image hook input exceeds the bounded size')
        result = record(json.loads(raw), args.workspace)
        if result:
            print(json.dumps(result))
    except (OSError, ValueError, TypeError, KeyError, binascii.Error, subprocess.SubprocessError) as exc:
        # This observer grants no permission and does not replace the Read result or its error.
        print('Image tool-delivery evidence unavailable: ' + str(exc)[:180], file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
