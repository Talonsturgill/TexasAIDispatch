"""In-memory diagnostic only: never writes a board, never renders. Simulates recorded entries
to expose every check that runs after `authored_story_art.py record`, and reports which fail."""
import json, sys, hashlib
from datetime import datetime, timezone
sys.path.insert(0, 'scripts')
import authored_story_art as asa, modern_film, story_art
for v in 'ab':
    board = json.load(open(f'out/dispatch/opening-{v}.json'))
    sim = json.loads(json.dumps(board))
    sim['story_art']['entries'] = [{'request_id': r['id'], 'file': r['file'],
        'sha256': hashlib.sha256(open(r['file'], 'rb').read()).hexdigest(), 'request_sha256': asa.fingerprint(r),
        'creation_id': 'diagnostic-not-a-receipt-' + r['id'], 'created_at': datetime.now(timezone.utc).isoformat(),
        'tool': 'original authored source', 'source_claims_sha256': '0'*64} for r in board['story_art']['requests']]
    print(v, 'authored checks before the charge step:', asa.problems(sim))
    orig = story_art.problems
    story_art.problems = lambda b, repo=None: []
    try:
        print(v, 'modern_film remaining:', modern_film.problems(board))
        import native_sample_plan
        try: print(v, 'native samples:', native_sample_plan.plan(board)['samples'])
        except Exception as e: print(v, 'native refused:', e)
        import documentary_check, watchability_check, storyboard_check
        print(v, 'documentary:', documentary_check.check(board))
        print(v, 'watchability:', watchability_check.check(board, open('video-engine/src/Dispatch.tsx').read()))
    finally:
        story_art.problems = orig
