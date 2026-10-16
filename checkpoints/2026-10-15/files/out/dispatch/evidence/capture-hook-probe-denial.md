# Capture hook probe (2026-10-16, before any real capture)
Harmless capture-form command: `bash scripts/run_with_env.sh bash -c 'cd video-engine && npx remotion still --help 2>&1 | head -3'`
Native result, verbatim: PreToolUse:Bash hook error: Capture refused. the packet does not authorize a capture; no current capture authorization exists. Author source and run cheap code checks. Only the director issues a capture authorization (scripts/capture_guard.py authorize) after a fresh charged render reservation, passed native headroom and housekeeping, and recorded authored receipts.
The hook is loaded and denies without an authorization. An earlier `echo ... remotion still` probe was not a capture form (is_capture false) and proves nothing.
