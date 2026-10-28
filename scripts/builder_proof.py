"""Free pixel proof for the scene builder, before a paid review spends a slot on a visible defect.

THE FAILURE IT EXISTS FOR. The hard five-review cap is for judgement and the paid critics were
being used to debug pictures. The 2026-10-25 edition spent its three code reviews on rig geometry
the builder had never seen drawn. The 2026-10-26 edition's first code review found a wok full of
noodles before the ticket printed, served plates under a hook asking who takes the order and a
sliding cutout, and its silent comparison then found a guest whose hands changed skin tone across
cuts, a phone that teleported between samples and a grey placeholder box. Every one of those shows
in a rendered frame. The builder is forbidden to capture, and the opening capture refused to run
until both code reviews had passed, so the first time anyone saw a pixel was a paid review.
Worse, a source fix after a paid review invalidates its approvals, so each late defect cost a
re-review of code, a renewed comparison and the timed phone check against a cap of five.

WHAT IT DOES. `opening_compare.py --builder-proof` renders the two phone previews through the
ordinary guarded, charged, headroom-checked capture, with no critic report required, and decodes
the same films into chronological phone pages in the same operation. The director hands those
pages to the builder, who can read images, so defects are fixed before any review is bought.
It is diagnostic only: the receipt is marked, the real comparison refuses it, and no selection,
narration, native film or shipment can rest on it. It is a charged preflight render, so the run
controller's path funding still applies. It never buys, replaces or counts as a review.
"""
from __future__ import annotations

import json
from pathlib import Path

EFFECTIVE = '2026-10-26'
SCHEMA = 'dispatch_builder_proof/1'
MAX_BATCHES = 2
LOG = 'builder-proof-log.json'
NOTE = ('diagnostic only; the paid code review, the comparison and the measured phone check '
        'remain required and this receipt approves no treatment')


def read(path):
    return json.loads(Path(path).read_text())


def batches(root):
    """Completed proof batches recorded beside the ledger."""
    path = Path(root) / LOG
    if not path.is_file():
        return []
    rows = read(path)
    if not isinstance(rows, list):
        raise ValueError('builder proof log is malformed; preserve it')
    return rows


def eligibility(state_path):
    """Admit a bounded proof for an active, unfinished production edition."""
    state_path = Path(state_path).resolve()
    state = read(state_path)
    run_id = str(state.get('run_id', ''))
    if state.get('mode') != 'production' or state.get('terminal_state'):
        raise ValueError('builder proof needs an active production edition')
    if run_id[:10] < EFFECTIVE:
        raise ValueError('builder proof applies from the edition dated ' + EFFECTIVE)
    if state.get('deliverable') or state.get('shipment'):
        raise ValueError('builder proof is for pictures before a native film exists')
    done = batches(state_path.parent)
    if len(done) >= MAX_BATCHES:
        raise ValueError('builder proof is limited to %d batches per edition' % MAX_BATCHES)
    return {'schema': SCHEMA, 'run_id': run_id, 'batch': len(done) + 1,
            'max_batches': MAX_BATCHES, 'approval': False, 'note': NOTE}


def record(root, receipt_sha256, proof):
    """Append one finished batch so the cap counts real captures, not attempts."""
    root = Path(root)
    rows = batches(root)
    rows.append({'batch': proof['batch'], 'comparison_sha256': receipt_sha256})
    (root / LOG).write_text(json.dumps(rows, indent=2) + '\n')
    return rows


def main(argv=None):
    import argparse
    parser = argparse.ArgumentParser(description='Say whether a builder proof batch is still available; never charges.')
    parser.add_argument('--state', type=Path, default=Path('out/dispatch/run_state.json'))
    args = parser.parse_args(argv)
    try:
        print(json.dumps(eligibility(args.state), indent=2))
        return 0
    except (OSError, ValueError) as exc:
        print('builder proof unavailable: ' + str(exc))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
