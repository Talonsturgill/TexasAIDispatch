"""Yield to a genuine paid native subagent's completion notification, without finishing."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

EFFECTIVE_DATE = '2026-10-20'
ROLES = {'researcher': {'researcher'}, 'validator': {'validator'}, 'scene-builder': {'scene-builder'},
         'storyboard-critic': {'storyboard-critic'}, 'dispatch-visual-critic': {'storyboard-critic'},
         'vo-director': {'vo-director'}, 'scorer': {'picture', 'story', 'sound'},
         'dispatch-visual-scorer': {'picture', 'story', 'sound'}}


def eligible(payload, state_path, state):
    """Only the host task registry plus an exact owned reservation permits this yield."""
    from completion_progress import enabled
    if (state.get('mode') != 'production' or state.get('terminal_state')
            or (str(state.get('run_id', ''))[:10] < EFFECTIVE_DATE and not enabled(state))):
        return []
    folder = Path(state_path).parent / 'worker-dispatch-claims'
    if folder.is_symlink():
        return []
    claims = []
    for path in folder.glob('*.json'):
        if path.is_symlink():
            return []
        try:
            row = json.loads(path.read_text())
            index = row['reservation_event_index']
            if type(index) is not int or not 0 <= index < len(state['events']):
                continue
            event = state['events'][index]
            from publication_owner import RESOURCES
            resource = RESOURCES.get(row.get('role'))
            digest = hashlib.sha256(json.dumps(event, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
            if (row.get('schema') != 'dispatch_worker_dispatch_claim/1'
                    or row.get('run_id') != state.get('run_id')
                    or row.get('reservation_sha256') != digest or event.get('kind') != 'reserved'
                    or not row.get('owner_sha256') or row.get('owner_sha256') != event.get('publication_owner_sha256')
                    or row.get('epoch') != event.get('publication_epoch')):
                continue
            if type((event.get('resources') or {}).get(resource)) is not int or event['resources'][resource] <= 0:
                continue
            row['_host_description'] = (row['task_name'][:41] + '_'
                                        + hashlib.sha256(path.read_bytes()).hexdigest()[:8])
            claims.append(row)
        except (OSError, KeyError, ValueError, TypeError, IndexError):
            continue
    tasks = payload.get('background_tasks')
    if not isinstance(tasks, list):
        return []
    result = []
    for task in tasks:
        if (not isinstance(task, dict) or task.get('type') != 'subagent'
                or task.get('status') != 'running' or not isinstance(task.get('id'), str)
                or not task['id'] or task.get('agent_type') not in ROLES):
            continue
        matches = [row for row in claims if row.get('role') in ROLES[task['agent_type']]
                   and isinstance(row.get('task_name'), str)
                   and row['_host_description'] == task.get('description')]
        if matches:
            row = max(matches, key=lambda item: item['reservation_event_index'])
            result.append({'task_id': task['id'], 'agent_type': task['agent_type'],
                           'reservation_sha256': row['reservation_sha256'],
                           'owner_sha256': row['owner_sha256'], 'epoch': row['epoch']})
    return result


def retain(state_path, tasks):
    """A wait receipt is neither a review nor a terminal controller event."""
    for task in tasks:
        data = {'schema': 'dispatch_native_completion_wait/1', **task,
                'production_finished': False, 'wake': 'native subagent completion notification'}
        encoded = (json.dumps(data, sort_keys=True, indent=2) + '\n').encode()
        directory = Path(state_path).parent / 'native-completion-waits'
        if any(path.is_symlink() for path in (directory, *directory.parents)):
            raise ValueError('native wait receipts must stay in the selected real package')
        directory.mkdir(parents=True, exist_ok=True)
        path = directory / (hashlib.sha256(encoded).hexdigest() + '.json')
        try:
            with path.open('xb') as stream:
                stream.write(encoded)
        except FileExistsError:
            if path.is_symlink() or path.read_bytes() != encoded:
                raise ValueError('preserve the original native completion wait receipt')
