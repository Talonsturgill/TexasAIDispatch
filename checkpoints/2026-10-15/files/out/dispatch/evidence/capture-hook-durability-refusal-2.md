# Capture hook durability refusal, second occurrence (2026-10-16 ~04:00Z)
Exact authorized command (both occurrences): bash scripts/run_with_env.sh python scripts/opening_compare.py --root out/dispatch --state out/dispatch/run_state.json
Hook output verbatim (both): Capture refused. the consumption of this authorization could not be made durable and verified on the remote checkpoint (checkpoint would weaken the durable record: the earlier event history was altered, removed or reordered). The authorization is spent. Reserve and authorize again.

Sequence: reserved preflight_renders 1/3 (03:56Z), authorized, hook refused (auth 1 spent). retry-preflight recorded with evidence/capture-hook-durability-refusal.log (needs ABSOLUTE --state path; a relative path computes another identity and reports "no previous reservation"). Reserved preflight_renders 2/3 (03:59Z), authorized, hook refused again (auth 2 spent). Neither run started a render. Both charges stay.

What I could verify (my shell, same git remote access):
- manual `claude_checkpoint.py save` succeeds repeatedly, ledger prefix identical, now 25 events.
- direct call of capture_guard.mirror_consumption(project, digest) for the exact command succeeds ("mirror ok").
- a direct save_with_recovery under the Claude tool environment succeeds.
- an env -i save fails only on git auth (no username), a different error from the hook's.
Observed difference: the remote checkpoint stores a REDACTED copy of ledger event 10 (owner_validator_grant: approval_id private-approval-sha256:..., redacted authorization_json); the local ledger holds the raw authorization. Normal saves compare sanitized-to-sanitized and pass. The monotonic message in the hook path says the earlier event history differs, which would match a raw-versus-redacted comparison of that one event, but I could not reproduce the hook failure outside the hook and a further read of the remote copies was blocked by automatic review, so this is a hypothesis, not a finding.
No capture, render or paid review has run since the code re-review. Checkpoint saved.
