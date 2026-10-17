# cinema_proof capture not executed (2026-10-17 19:51Z)
Operation: finished cinematic hero and stage ablation batch. Prepared authorization event c00f4725877a8036d0f314def645f7198803e46f39031c1e07436b5753e4573e (preflight reservation charged).
The PreToolUse capture hook consumed the authorization (capture-authorizations-used.json 19:51:46Z) and the auto-mode classifier then denied the bare command (Auto-Mode Bypass) before it executed. Resubmission was refused by the hook: "this authorized capture was already used".
No capture ran: out/dispatch/cinema/* files are unchanged from 18:20. Fresh authorize --prepare is refused: "identical preflight inputs were already reserved for this operation". Capacity grant for preflight_renders 2 + storyboard_critics 1 was recorded afterwards from finish-current-plan-r15g2.json.

## Actual host denial response (verbatim, 19:51Z) for the bare cinema_proof.py command after the hook consumed its authorization
Permission for this action was denied by the Claude Code auto mode classifier. Reason: [Auto-Mode Bypass].
Concrete fix: operator-approved ordinary capture under the owner standing authorization with a fresh charged authorization. The spent authorization c00f4725 is never reused; both charges remain.
