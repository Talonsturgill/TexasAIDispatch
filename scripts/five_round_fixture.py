"""Pin the review-limit logic tests to the historical five-round scenario.

The owner lifted the live cap on October 26th, 2026. These tests exercise the counting,
final-slot and path-budget logic at its original size, so they run against a five-round copy
of the policy. The live policy and its constant are checked separately in review_limit_test.
"""
import json
import tempfile
from pathlib import Path

import review_limit

_live = json.loads(review_limit.POLICY.read_text())
_dir = Path(tempfile.mkdtemp(prefix='five-round-policy-'))
_policy = _dir / 'review_limit.json'
_policy.write_text(json.dumps({**_live, 'max_review_rounds': 5}))
review_limit.MAX_ROUNDS = 5
review_limit.POLICY = _policy
