"""Future review inputs expose current boards and hash-only archival retime proof."""
from __future__ import annotations

import copy
import hashlib
import json
from pathlib import Path
import re

EFFECTIVE = '2026-10-22'
SCHEMA = 'dispatch_archival_retime_hashes/1'
NATIVE_ROLES = {'storyboard-critic', 'picture', 'story', 'sound'}
FIELD = 'review_board_views'
TRANSPORT_NOTE = ('The dispatch_archival_retime_hashes/1 value replaces only verified archival '
    'retime history with hashes. Current clauses, timing, source evidence and guides are unchanged. '
    'Original board bytes remain bound by source_board_sha256. Lossless encoding describes the '
    'current reading view, not reconstruction of omitted archival history. These hashes supply no verdict. ')
NATIVE_NOTE = (' For entries in review_board_views, read those bound files for board content; '
    'their matching original board SHA256 references are machine identities only. Read other boards '
    'normally. Views keep current content with hash-only archival retime proof; never render from '
    'them. Copy original report bindings unchanged.')


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False)


def sha(value):
    return hashlib.sha256(value).hexdigest()


def enabled(board):
    date = str(board.get('date', ''))
    return bool(re.fullmatch(r'\d{4}-\d{2}-\d{2}', date) and date >= EFFECTIVE)


def archive(board):
    return ((board.get('narration_picture') or {}).get('timing_provenance') or {}).get('approved_retime')


def project(board, source_sha256):
    """Project one original board; never erase unknown fields or alter source bytes."""
    proof = archive(board)
    if not enabled(board) or proof is None:
        return board
    if not re.fullmatch(r'[a-f0-9]{64}', str(source_sha256)):
        raise ValueError('review view requires the exact original board byte hash')
    import measured_retime
    # Verify the genuine retained report and original board before hiding their bodies.
    # This is the existing portable evidence check, never another model assessment.
    measured_retime.originals(proof)
    result = copy.deepcopy(board)
    result['narration_picture']['timing_provenance']['approved_retime'] = {
        'schema': SCHEMA, 'source_board_sha256': source_sha256,
        'canonical_archive_sha256': sha(canonical(proof).encode()),
        'archived_board_sha256': proof['board_sha256'],
        'archived_critique_sha256': proof['critique_sha256'],
        'archived_concept_sha256': proof['concept_sha256']}
    return result


def projected(board):
    return isinstance(archive(board), dict) and archive(board).get('schema') == SCHEMA


def from_file(path, supplied):
    """Accept original or exact derived content; reject a forged reading view."""
    path = Path(path); raw = path.read_bytes(); original = json.loads(raw)
    view = project(original, sha(raw))
    if supplied != original and supplied != view:
        raise ValueError('review board view changed current content or archival provenance')
    return view


def provider_board(text, path):
    board = text.get('board', {})
    if not enabled(board) or archive(board) is None:
        return text
    result = copy.deepcopy(text)
    result['board'] = from_file(path, board)
    return result


def board_references(data):
    rows = [data.get('board')]
    rows += data.get('treatments', [])
    rows += [row.get('board') for row in data.get('phone_options', [])]
    rows += [row.get('board') for row in (data.get('code_report_bindings') or {}).get('treatments', [])]
    return {row['path']: row for row in rows
            if isinstance(row, dict) and {'path', 'sha256'} <= row.keys()}


def native_views(data, write=False):
    if data.get('role') not in NATIVE_ROLES or not enabled(data):
        return {}
    result = {}
    for name, ref in sorted(board_references(data).items()):
        path = Path(name).resolve(); raw = path.read_bytes()
        if sha(raw) != ref['sha256']:
            raise ValueError('original review board bytes changed')
        original = json.loads(raw)
        view = project(original, ref['sha256'])
        if view == original:
            continue
        if original.get('date') != data['date']:
            raise ValueError('review board view belongs to another edition')
        if ref['sha256'] in result:
            continue
        encoded = (canonical(view) + '\n').encode()
        target = path.with_name('review-board-' + ref['sha256'] + '.json')
        if write:
            try:
                with target.open('xb') as stream:
                    stream.write(encoded)
            except FileExistsError:
                pass
        if not target.is_file() or target.is_symlink() or target.read_bytes() != encoded:
            raise ValueError('bound review board view is missing or changed')
        result[ref['sha256']] = {'path': str(target), 'sha256': sha(encoded)}
    return result


def bind_native(data):
    views = native_views(data, write=True)
    if views:
        data[FIELD] = views
    elif FIELD in data:
        raise ValueError('unexpected review board view bindings')
    return data


def validate_native(data):
    expected = native_views(data)
    if data.get(FIELD, {}) != expected:
        raise ValueError('review board view bindings are missing or changed')
    return NATIVE_NOTE if expected else ''
