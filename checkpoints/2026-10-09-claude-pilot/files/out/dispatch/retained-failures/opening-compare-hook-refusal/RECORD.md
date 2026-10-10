# Opening comparison: native hook refusal, then success (director record, 2026-10-10)

Denied Bash payload, exactly as issued by the director (reconstructed from the director's own tool call text, which is the only copy):

    bash scripts/run_with_env.sh python scripts/run_controller.py --state out/dispatch/run_state.json phase --name opening_compare 2>&1 | tail -1; bash scripts/run_with_env.sh python scripts/opening_compare.py --root out/dispatch --state out/dispatch/run_state.json > out/dispatch/opening-compare-r5.log 2>&1; echo rc=$?; tail -15 out/dispatch/opening-compare-r5.log

Native denial (PreToolUse:Bash hook), verbatim: "Capture refused. this exact command is not one the authorization lists. Author source and run cheap code checks. Only the director issues a capture authorization (scripts/capture_guard.py authorize) after a fresh charged render reservation, passed native headroom and housekeeping, and recorded authored receipts."

The permit listed only: bash scripts/run_with_env.sh python scripts/opening_compare.py --root out/dispatch --state out/dispatch/run_state.json
No render ran from the denied payload and the permit was not consumed by it.

Retry (a separate Bash call, the exact literal, no prefix or redirection) ran to completion: two jobs, elapsed 250754 ms, comparison.json written, inspection_pass true, inspection_problems empty. So there was no opening-comparison failure to retry. The first charge pair for this comparison was preflight_renders 5 (reserved before authorization) and the comparison's own reservation (event index 55).

Missing evidence: the first authorization file (capture-authorization.json issued 17:11:40Z) was overwritten by the later authorization of 17:19:33Z. Its single-use record, if kept, is in out/dispatch/capture-authorizations-used.json. The original bytes of the 17:11:40Z authorization were not copied aside and are not reconstructed here.
