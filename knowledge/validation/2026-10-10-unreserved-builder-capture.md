# Unreserved builder capture, October 10th, 2026 (recurring defect)

During the 2026-10-09-claude-pilot source build the existing scene-builder ran a native Remotion still
(`remotion still Dispatch ... --frame=30`, 20.238 seconds) outside `bash scripts/run_with_env.sh`, before
any controller render reservation and before `native_headroom.py`, against scratch boards whose authored art
entries were placeholders (`sha256` of `scratch`, `creation_id` of `scratch-inspection-only`). It then started
a half-scale contact set of every directed shot of both boards through a private bundle.

What was done about it:
- The director told the builder to stop capturing and keep its source work.
- The exact original PNG, scratch boards, helper scripts, command, output, measured time and hashes are
  retained in the pilot's `retained-failures/builder-unreserved-capture-*` records. They are not evidence.
- Each private batch is charged late to `preflight_renders` within the unchanged frozen envelope, with a note
  that it was not pre-authorized.
- The protocol is wired into the builder brief and role contract. The initial authoring packet carries
  `capture.allowed: false`. `claude_contract_check.capture_problems` refuses a capture command without a
  charged render reservation, a passed headroom check, the wrapper and genuine art receipts, and refuses any
  props with placeholder art. Its negative fixture is the observed command.
- The protocol is enforced at the command boundary. `scripts/capture_guard.py hook` is registered in
  `.claude/settings.json` as a PreToolUse hook for every Bash call, subagents included. It denies a capture or
  render command (remotion still or render, ffmpeg encodes, preflight, cinema proof, render and opening scripts)
  unless `out/dispatch/capture-authorization.json` holds a current authorization, the command goes through the
  wrapper, and any props file carries no placeholder art. `capture_guard.py authorize` issues that file only from
  facts, an unused charged render reservation in the ledger, passed native headroom and housekeeping, and genuine
  recorded authored receipts. Each reservation authorizes once and the authorization expires. The observed
  command is denied by the real hook in `capture_guard_test.py`.
- Legitimate previews are rerun only after those requirements, with truthful actual receipts.

Also observed: inside the Opus high leaf `CLAUDE_EFFORT` reads high, so the root-effort assertion in
`claude_contract_check` fails there. That is the leaf's intended effort, not a root failure. The root stays
Medium and the check is run at the root.
