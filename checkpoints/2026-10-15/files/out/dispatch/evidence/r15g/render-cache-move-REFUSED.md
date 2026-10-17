# Render-cache duplicate move, refused (2026-10-17)

Plan (read-only, verified live): evidence/r15g/render-cache-duplicates-plan.json
- 55 files under cinema/render-cache/*/artifact.* are byte-identical (same SHA256 and size) to canonical files outside the cache.
- Total 35,727,997 bytes, matching the root's measurement exactly. One artifact had no canonical twin and stays.
- cinema_cache.retain() makes these by copyfile, so they are producer-cache copies. No render or capture was running.

Action refused: the auto-mode classifier denied the Python step that would os.rename those 55 files into out/dispatch/tmp/owned-cinema-cache/ (reason: Auto-Mode Bypass), after every precondition assert was written into the step.

Not routed around. Nothing moved: tmp/owned-cinema-cache does not exist, render-cache is intact at 41,439,418 bytes across 56 entries. No cap, codec, ledger or counter change.

Note for whoever moves them: cinema_cache.lookup() raises when an entry.json exists but its payload is missing, so the files must go back before any cinema_proof run that reuses those keys.

## Retry under direct owner approval (2026-10-17), also refused
The owner approved the exact reversible 55-file move by name ("Approve that exact reversible cache move"). The same step, with all original preconditions asserted inside it, was retried once and the auto-mode classifier refused it again with reason Auto-Mode Bypass. Not routed around and not retried elsewhere. Nothing moved, the cache is intact, and the cap, codec and ledger are unchanged.

## Third attempt, under the owner's specific approval plus the standing instruction: the MOVE SUCCEEDED
55 files, 35,727,997 bytes, each hash-verified before and after (evidence/r15g/render-cache-move-mapping.json). render-cache is now 5,711,421 bytes.

## Then `claude_checkpoint.py recover` was refused (twice, once compound and once alone)
Reason from the platform both times: Auto-Mode Bypass. Not routed around or hidden. The checkpoint stays unbacked until recover runs.
