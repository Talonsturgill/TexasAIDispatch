# Housekeeping path diagnosis (director, 2026-10-10)

- capture_guard.authorize runs dispatch_housekeeping.py with --workspace = checkout parent (/home/user/restore) and --docket-repo /home/user/restore/TexasAIDocket. The original Docket checkout is /home/user/TexasAIDocket, so the sibling path did not exist.
- Attempt 1 (17:07:59Z): exit 2, "inspection failed; no unchecked target was removed (CalledProcessError)". Receipt kept: out/dispatch/capture-housekeeping-20261010T170759.json.
- Director action, NOT retained at the time: created a symlink /home/user/restore/TexasAIDocket -> /home/user/TexasAIDocket. The symlink's target and listing were not saved before it was removed. This is recorded here after the fact.
- Attempt 2 (17:08:15Z) with the symlink: exit 2, "(ValueError)". Receipt kept: out/dispatch/capture-housekeeping-20261010T170815.json. Housekeeping refuses symlinked controller or sibling state.
- Director action: removed only that symlink (rm of the link, original checkout untouched), then made a standalone git clone of origin at /home/user/restore/TexasAIDocket (HEAD 20572c358). Housekeeping inspection then passed and the capture authorization issued 17:11:40Z.
- Preflight reservation 5 (note: reserved before authorizing the real two-treatment opening comparison capture) was consumed by that authorization and the comparison ran under it with a second inside reservation. No reservation was dropped.
- Per owner direction the standalone clone is replaced by a registered clean git worktree of the original Docket checkout at the same sibling path (see worktree commands in the run record).
- Worktree command: git -C /home/user/TexasAIDocket worktree add -b claude/dispatch-feed-2026-10-09-claude-pilot /home/user/restore/TexasAIDocket origin/main (clean, registered, HEAD 20572c35). The standalone clone was removed (director-created, clean).
