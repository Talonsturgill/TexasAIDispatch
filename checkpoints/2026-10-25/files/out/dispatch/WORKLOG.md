# 2026-10-25 Aggie AI Foundry, "Only the melt can answer"  (state at the review-3 REVISE)

Edition branch claude/dispatch-2026-10-25 (source pushed). Validated story, claims c1 to c11, script and bindings are locked
(validation PASS round 4). Two treatments (A bench line, B plan-view and ledger) built by scene-builder a687f12bd2fb490f6.

## Reviews spent (hard five, config/review_limit.json): 3 used, all code-plan scope, all REVISE
1. code-review-1.json: six defects (rig geometry, sample identity, s2 gesture, PLANNED marker, ending hold, B = A re-photographed). Fixed in repair 1.
2. code-review-2.json: one blocking s9 rig fault. Fixed in repair 2.
3. critic-packet-3 / second re-review: REVISE on two shared hero defects with exact fixes:
   C1 rear feed drop in FoundryArmHero feedTransform (about 80 units, needs 130 or an opacity fade) so the bent bar and mold do not swap in view at 45.954 s;
   C2 clamp rod rect starts at crossY+40 but crosshead underside is crossY+26, so the screws hang 14 units detached.
   Optional N1 (ram height >= 0), N2 (6 to 8 unit crucible margin), N5, N6, N7. Everything else passes at code scope.
Original responses: out/dispatch/retained-failures/code-review-1.json, code-review-2.json, and the review-3 response in the critic transcript (re-extract the same way if needed).

## Why production is stopped here
Remaining paid editorial reviews: 2. The mandatory sequence still needs three: (a) a code PASS for BOTH treatments (opening_compare refuses without
opening-a/b critic reports that pass; only a surface_finish defect can be retained at the finishing boundary, and D1 is category motion),
(b) the independent silent phone comparison that writes openings/selection.json (vo_synth and opening_problems require it before any narration),
(c) the final timed phone review, which review_limit.final_reservation_binding / worker_plan_problems reserve as review five and accept only for a current timed-phone packet.
No ordering fits in two reviews, and the controller refuses a comparison review as number five. failed_editions.retain also needs the count to reach five (reached(state)),
so this ledger can neither finish nor be retained as an exhausted failure without a maintainer decision. DO NOT spend another critic, validator or provider review on it
without that decision. Nothing was rendered, voiced or approved. Charges so far: research 3, validator 4, reboards 3 (of 4), critics 3.

## If a maintainer clears the path
Apply C1 and C2 (and N1, N2, N5 to N7) in video-engine/src/modern/episodes/2026-10-25, re-record art with authored_story_art.py, then one code re-review,
then opening_compare and the comparison review. That needs reviews 4, 5 and a sixth for the timed phone, which the owner's rule forbids.
