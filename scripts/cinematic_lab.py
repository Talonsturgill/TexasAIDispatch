"""Separate, append-only accounting for an explicitly requested engineering spike.

Lab footage is never a production approval, shipment or reusable daily b-roll.
Charge every actual render/provider attempt before execution, including failures.
Production continues to use run_controller and its original cumulative envelope.
"""
import argparse
import fcntl
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

LIMITS = {'native_renders': 4, 'native_stills': 12, 'phone_renders': 8, 'av_reviews': 6, 'art_assets': 2}


def now():
    return datetime.now(timezone.utc).isoformat()


def change(path, kind, resource=None, count=1, note='', inputs=None, telemetry=None):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.with_suffix('.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        state = json.loads(path.read_text()) if path.exists() else {
            'schema': 'dispatch-cinematic-lab/1', 'created_at': now(),
            'scope': 'Owner-requested engineering; no production verdict or shipment authority',
            'original_limits': dict(LIMITS), 'limits': dict(LIMITS),
            'usage': {key: 0 for key in LIMITS}, 'events': []}
        if kind in ('charged', 'capacity_increment'):
            if resource not in LIMITS or not isinstance(count, int) or count <= 0 or not note.strip():
                raise ValueError('lab charge/increment needs a known resource, positive count and actual reason')
            if kind == 'charged':
                if state['usage'][resource] + count > state['limits'][resource]:
                    raise ValueError('lab envelope exhausted; preserve evidence and record an owner-authorized increment separately')
                state['usage'][resource] += count
            else:
                state['limits'][resource] += count
        refs = [{ 'path': str(Path(p).resolve()),
                  'sha256': hashlib.sha256(Path(p).read_bytes()).hexdigest()} for p in inputs or []]
        event = {'index': len(state['events']), 'at': now(), 'kind': kind, 'resource': resource,
                 'count': count, 'note': note, 'inputs': refs, 'telemetry': telemetry or {}}
        state['events'].append(event)
        state['updated_at'] = now()
        temp = path.with_suffix('.tmp')
        temp.write_text(json.dumps(state, indent=2) + '\n')
        temp.replace(path)
        return event


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--ledger', type=Path, required=True)
    p.add_argument('action', choices=['charged', 'capacity_increment', 'observed'])
    p.add_argument('--resource', choices=LIMITS)
    p.add_argument('--count', type=int, default=1)
    p.add_argument('--note', required=True)
    p.add_argument('--input', action='append', default=[])
    a = p.parse_args()
    print(json.dumps(change(a.ledger, a.action, a.resource, a.count, a.note, a.input)))
