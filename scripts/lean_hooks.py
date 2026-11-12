"""lean_hooks.py: what the workspace hooks do while a daily-lane run is armed.

`scripts/lean.py init` writes out/dispatch/lean_run.json in the Dispatch checkout. While that marker
exists the workspace capture hook stands down: it consults no publication lease and demands no
authorization. (The repository's own capture_guard.py is left byte for byte as it was, because the
retired lane's capture proof is bound to its hash. Renders go through scripts/lean.py, which that
guard does not gate.) One hook gets a job instead. The Stop hook refuses
to let the session end while today's film is undelivered, a bounded number of times, because the
failure this lane was built against is a run that stops on its own.

Every function here fails open. A hook that crashes must never be the reason a film did not ship.
"""
from __future__ import annotations

import json
import time
from pathlib import Path

MARKER = Path('out/dispatch/lean_run.json')
DELIVERED = Path('out/dispatch/delivered.json')
BLOCKS = Path('out/dispatch/lean_stop_blocks.json')
BLOCKER = Path('out/dispatch/hard_blocker.json')
MAX_BLOCKS = 6
FRESH_SECONDS = 20 * 3600


def checkouts(root) -> list[Path]:
    """The checkout itself, or the armed checkouts directly under a workspace."""
    try:
        root = Path(root).resolve()
        found = [root] if (root / MARKER).is_file() else []
        if not found and root.is_dir():
            found = [child for child in sorted(root.iterdir()) if (child / MARKER).is_file()]
        if not found:
            for parent in root.parents:      # a command run from inside the checkout
                if (parent / MARKER).is_file():
                    return [parent]
        return found
    except OSError:
        return []


def active(root) -> bool:
    return bool(checkouts(root))


def stop_decision(payload: dict, workspace):
    """A Stop hook response while a daily run owes a film, else None."""
    try:
        for repo in checkouts(workspace):
            marker = json.loads((repo / MARKER).read_text())
            if (repo / DELIVERED).is_file() or (repo / BLOCKER).is_file():
                continue
            if time.time() - (repo / MARKER).stat().st_mtime > FRESH_SECONDS:
                continue                      # yesterday's marker never traps today's session
            count = 0
            if (repo / BLOCKS).is_file():
                count = int(json.loads((repo / BLOCKS).read_text()).get('count', 0))
            if count >= MAX_BLOCKS:
                continue
            (repo / BLOCKS).write_text(json.dumps({'count': count + 1}))
            return {'decision': 'block', 'reason': (
                'The %s Dispatch is not delivered, so this run is not over. Run '
                '`bash scripts/run_with_env.sh python3 scripts/lean.py no-exit` in the Dispatch '
                'checkout, do the next thing it names, and keep going until the draft is read back '
                'and `lean.py receipt` is recorded. Out of time or context means a simpler film, '
                'never no film. Only a tool or API that is truly down ends the run early, and then '
                'write out/dispatch/hard_blocker.json naming the tool, the error and what you tried.'
                % marker.get('date', 'daily'))}
    except Exception:                          # noqa: BLE001  fail open, always
        return None
    return None
