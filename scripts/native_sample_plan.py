"""Check the existing native sampler before paid work; never render or approve pixels."""
import argparse
import json
from pathlib import Path
import sys

import cinema_cache


def plan(board):
    samples = cinema_cache.sample_frames(board)
    return {'schema': 'dispatch_native_sample_plan/1', 'samples': samples,
            'capture': False, 'approval': False,
            'note': 'Existing source/event admission only; native PNG samples, motion and independent review remain required.'}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--board', type=Path, required=True)
    args = parser.parse_args(argv)
    try:
        print(json.dumps(plan(json.loads(args.board.read_text())), sort_keys=True))
        return 0
    except (OSError, ValueError, KeyError, TypeError) as exc:
        print('native sample plan refused: ' + str(exc), file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
