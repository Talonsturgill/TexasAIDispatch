# Repair an active edition

Owner instruction from October 3rd, 2026. Read knowledge/craft/AUTONOMOUS_COMPLETION.md before applying older resource-boundary language below. Internal review ceilings and host capacity errors trigger autonomous mandatory completion recovery, never an approval stop or an unfinished-capacity final response. Preserve exact failures, the original frozen envelope and cumulative charges. Only accepted finish --result shipped completes production.

For a current modern-film edition, read knowledge/craft/MODERN_FILM.md,
knowledge/craft/STORY_ART.md and config/modern_film.json before applying generic artistic
deferral. The current nondeferrable_categories override that older route. Motion, pacing,
surface finish and ending artistry remain mandatory at a creative ceiling. Consolidate every
actual current failure, including pictured-clause comprehension and legibility, into the
existing independently reviewed and fully funded correction. Continue that route without
asking the owner to approve an internal creative or application-budget decision.

Inspect each handback's actual coverage before calling it a completed review. Preserve a
disclosed unread guide, board section, source or required crop and all observed findings.
Complete missing content with the same workers through the existing paid review and atomic
panel path when required. JSON-only correction can preserve the original scores for free;
substantive guide/source completion is paid content review. Never invent coverage, replace
a real rejection or call missing coverage an artistic deferral.

Read the current checkpoint and compact defect ledger first. Preserve the last playable film,
exact hashes and all reviews. Read knowledge/craft/BOUNDED_CREATIVE_RELEASE.md first: a rejection
starts another creative repair only before its finite boundary and with complete review
headroom. At the boundary finish the retained best complete cut and ship without an approval
question; preserve every rejection and require all integrity/delivery checks. A checkpoint or needs_review
package is never successful completion. Missing external access remains honestly incomplete.

For an actual charged Opus High narration pivot REVISE at an internal critic ceiling, use the
charged narration section of AUTONOMOUS_COMPLETION.md and its pinned narration amendment.
Preserve the full original response, exact reservation, review packet, failed takes and ASR.
Every changed-proposal content review is precharged, including a same-worker continuation.
An actual unreserved continuation stays invalid for authorization and is accounted visibly
as late; it is never renamed a format correction. Prepare a fresh per-attempt evidence folder
and its actual receipt, then execute the existing controller recovery without an owner question:

```sh
python scripts/narration_recovery.py --state out/dispatch/run_state.json --receipt out/dispatch/evidence/narration-recovery/receipt.json --report out/dispatch/evidence/narration-recovery/original-rejection.json --output out/dispatch/evidence/narration-recovery/capacity.json
python scripts/run_controller.py production-budget --review-route host --repair-plan out/dispatch/evidence/narration-recovery/capacity.json
python scripts/run_controller.py completion-capacity --repair-plan out/dispatch/evidence/narration-recovery/capacity.json
python scripts/narration_recovery.py --state out/dispatch/run_state.json --settle-unreserved out/dispatch/evidence/narration-recovery/capacity.json
```

Use the runtime wrapper and explicit internal cd. Reserve the actual replacement critic before
dispatching it with the full current guides, actual evidence and unchanged current direction.
After its independent PASS, retain its full handback and actual call receipt, then run:

```sh
python scripts/narration_recovery.py --state out/dispatch/run_state.json --verify-review out/dispatch/evidence/narration-recovery/capacity.json --receipt out/dispatch/evidence/narration-recovery/new-call.json --report out/dispatch/evidence/narration-recovery/new-pass.json
```

This clears only the recovery review dependency. Actual speech, measured captions and all
native, independent scoring and delivery checks remain mandatory. Retain a good existing take
once; do not synthesize again just because the review accounting needed repair.

## A paid take fails strict alignment

A take can pass soundcheck and still fail the locked-script alignment. Preserve the exact
take, provider transcript, acoustic alignment output, direction, script and paid reservations.
Do not alias a misread word or treat soundcheck selection as alignment approval. A director's
finding is diagnostic evidence; it does not qualify as an independent capacity rejection.

Use the existing independently classified technical-integrity route in
AUTONOMOUS_COMPLETION.md. Precharge the critic's substantive classification and recurrence
review. It must assess every actual current finding and the consolidated correction under
the full current guides. Retain its complete response unchanged. Only an independently
supported technical classification can use this route; unknown or artistic findings cannot
be relabelled. The controller's retained-integrity admission does not require a finished film.
Bind the report and retained baselines in the technical-integrity plan, fund the complete
remaining path and any required renewal of the same two treatments, then open the repair.
Every replacement take, soundcheck, board edit and review is separately reserved before use.
Keep the original envelope, failed evidence, all charges and all final gates. Follow the next
executable recovery step without asking the owner to choose an internal funding route.

## Source-backed sentence correction

When a real waveform measurement and the independent critic require shorter source-backed
sentences, preserve the failed takes and original classifications. Prepare the complete script,
source map and same-treatment boards as immutable proposals; run the free source, caption and
event checks before a charged review. Ask for an honest production-blocker assessment and a
separate recurrence decision. A process observation is not automatically a release blocker,
but only the independent reviewer can establish that scope in a fresh report. Never edit the
old report or move a finding merely to obtain admission.

For an actual charged independent source-pivot rejection that requires fresh script validation,
read config/source_validation_completion_v1.json. The source-pivot report supplies
source_pivot.requires_validation, script_before_sha256, proposed_script_sha256, source_basis
and the verified claim_ids. Retain its full report and the actual dispatch receipt. The receipt
uses schema dispatch_source_pivot_review/1, run_id, role source-pivot, status completed,
provider_unavailable false, model claude-opus-5-5, effort high, actual agent_id and
reviewer_identity, reservation_event_index, reservation_sha256, started_at, completed_at and
report_sha256. Hash reserved events with Python json.dumps(event, sort_keys=True).

```sh
python scripts/validation_completion.py --state out/dispatch/run_state.json --plan <source-plan-with-current-baselines> --receipt <actual-pivot-review-call.json> --proposed-script <exact-reviewed-proposal.txt> --output <new-source-capacity-plan.json>
python scripts/capture_completion_budget.py --state out/dispatch/run_state.json --plan <new-source-capacity-plan.json> --comparison <retained-two-treatment-comparison.json> --output <complete-source-capacity-plan.json>
python scripts/run_controller.py production-budget --review-route host --repair-plan <complete-source-capacity-plan.json>
python scripts/run_controller.py completion-capacity --repair-plan <complete-source-capacity-plan.json>
```

Use the wrapper and explicit internal cd. This separately pinned amendment preserves the
original policy and envelope and funds only actual deficits, including one fresh source
validation. Keep validator_agents: 1 in the source plan. Mixed artistic and source blockers
retain standard repair accounting under mandatory-source-pivot; they are never relabelled
technical or deferred by this grant. A fully classified technical plan keeps its existing
retained-integrity route. The admission proposal stays immutable; corrected candidate bytes
still require their own independent approval and a registered repair revision. Capacity
approves no source, pivot or film. Obtain the required recurrence approval before production edits,
then begin the repair, reserve its reboard, apply only declared bytes and authorize it.

Precharge the fresh Opus High validator before dispatch. Supply actual script and claims hashes
in its complete packet; retain the raw handoff and save its validation object unchanged.
Preserve the inspected input bytes. Save the actual call receipt as
out/dispatch/source-validation-call.json, schema dispatch_precharged_source_validation/1,
with run_id, role validator, status completed, provider_unavailable false, model, effort,
agent_id, reviewer_identity, reservation_event_index, reservation_sha256, started_at,
completed_at, report_sha256, script_sha256 and claims_sha256. Never invent a receipt or hash.

```sh
python scripts/validation_completion.py --state out/dispatch/run_state.json --verify-validation
python scripts/validation_check.py --validation out/dispatch/validation.json --claims out/dispatch/claims.json --board out/dispatch/storyboard.json
```

Dependent paid production stays blocked until this current validation passes. A real new
validator REVISE remains a mandatory source failure: retain it, consolidate the next correction
and obtain the required newly charged independent source-pivot diagnosis before its own
evidence-bound capacity event. Never reuse a prior report or grant to hide another attempt.
Complete the same two-treatment renewal, timed phone, native, audiovisual, three scorers,
publication, unsent draft and durable archive through accepted shipment.

Run the controller's production-budget precheck before a structural repair. Reserve a credible
path through the remaining phone, hero, final audiovisual and scoring gates before spending on
a correction. Follow DAILY_PRODUCTION.md for autonomous work and unchanged-blocker wakes.
Do not make repeated owner-extension questions part of the routine. A failed budget precheck
leaves the edition unfinished; it never changes the definition of done.

Consolidate all current faults into one cause-and-correction plan before another attempt.
Record root_cause, repair, mechanism_change, expected_visible_result, failure_evidence and
failure_evidence_sha256. Retain baseline files; changed_inputs names path, before_path,
before_sha256 and later after_sha256. Include only the resources needed for that correction.

```sh
python scripts/run_controller.py checkpoint
python scripts/run_controller.py begin-repair --plan out/dispatch/repair-plan.json --reserve-reboard
python scripts/board_diff.py --before <retained-before-board> --after out/dispatch/storyboard.json
python scripts/run_controller.py authorize-repair --plan out/dispatch/repair-plan.json
```

The structural opening requires one precharged reboard. A plan may explicitly declare
`reboards: 1`; authorization binds that existing reservation and grants no second reboard.
Other requested resources fund future attempts. The controller validates the request before
opening the repair, so an unsupported resource cannot leave an edited board mid-repair.
Never substitute a different resource name after a refusal. Preserve the rejected request and
fix a demonstrated contract defect through normal source review and CI before continuing.

Begin before editing; authorize after the declared bytes changed. Keep stable mechanism_id,
failure_family and director_identity. The frozen cumulative envelope takes precedence over
old instructions about renewable extensions. An existing bounded authorization is not endless
permission. Never reset usage, purchase a reset, falsify a verdict or relabel a batch to hide spend.

Completion capacity validates the shared failure-family taxonomy before granting anything.
Use `rights` with technical-integrity scope for an independently classified rights failure;
every exact finding still needs independent classification and at least one must be rights.
Keep that genuine category when correcting a missing end-card licence credit. The combined
begin command charges a reboard only after the opening check succeeds. Never chain a paid
consume after a failed check with a semicolon.

For the retained unsupported-rights-family incident only, an already charged unused reboard
may be bound with `begin-repair --plan <original-rights-plan> --prepaid-reboard <event-sha256>`.
Verify its exact charge and unchanged live baselines first with the read-only proposal:

```sh
python scripts/rights_repair_precharge.py --state out/dispatch/run_state.json --plan out/dispatch/repair-plan.json --receipt <actual-reservation-event-sha256>
```

The controller requires the exact latest paid reservation, the original mandatory rights
grant, unchanged original data-only board baselines, and no intervening paid work or opened
repair. It binds that charge once, adds no capacity, preserves usage and all failed evidence,
and grants no review or release approval. Never use `--reserve-reboard` with this recovery.
After this verified opening and before editing, run production-budget on the same plan.
Its reboard row retains the real usage and zero unspent remaining count, shows one bound
prepaid unit, and includes the exact receipt. Every other remaining requirement must still
be funded; the capture-budget amendment preserves that distinction. No extra grant is needed
for the same already charged reboard.
New rights-correction budgets record the separate timed preview, current-phone image sequence,
native hero and final-film image sequence: four preflight operators. This profile is recorded
in each new capacity grant; earlier grants keep their exact original requirements. A renewed
two-treatment comparison retains its separate complete-path budget. Never count a phone
movie and its image sequence as one operator or assume either final extraction is free.

When measured narration exceeds the authored runtime or crowds the scene/caption limits,
use failure_family measured-runtime-crowding with technical-integrity scope. Retain the exact
independent runtime/caption classification and at least one runtime finding. This category
does not authorize an artistic correction, extra capacity or a recurrence reset. If a category
is unsupported, retain the schema refusal and repair the contract through reviewed source and
CI; do not substitute another label or ask the owner to select an internal enum value.

After two rejections of the same mechanism or defect family, obtain the required independent,
hash-bound pivot review. Replace the mechanism, staging or source-backed angle before another
native attempt. Labels, sleeve adjustments, camera offsets and easing changes are not a pivot.
For an actual charged same-worker pivot REVISE following a funded modern-film-floor repair,
use scripts/film_pivot_capacity.py and config/film_pivot_capacity_v1.json. Bind the original
grant, pivot receipt/report, rejected proposal, revised proposal and the public-safe original
SendMessage assignment binding via --assignment. That receipt retains the actual message,
tool identity, time and rejected proposal digest; private raw arguments stay private. Its capacity-only plan
can add exactly one critic while protecting the complete remaining path; it permits no
production edit or review approval. Charge the continuation before messaging the same Opus
High critic. After its genuine pivot PASS, bind that review to the original production repair
plan and run begin-repair normally. Preserve the original rejection and all earlier grants.
For human action, inspect scale, ground, anatomy, reach, contact and weight over the complete
interval. Carry findings across every scene using the same failed rig. Do not move it outside
the hero and declare it fixed. Use supported real footage or another demonstrated action when
that produces an honest causal story. Prove the hardest repaired action in the next hero.

Reuse unchanged valid evidence. Structural edits invalidate whole-sequence story approval.
An authored-source edit can also invalidate the earlier two-treatment comparison. Preserve that
complete package byte-identically, renew the same two treatments on current source and receipts,
and obtain fresh comparison and selection verdicts. Do not add a continuation exemption or
relabel old films as current. Fund the complete remaining path before additional attempts:

Source-changing repair of a registered native film requires the current complete comparison
profile. Initial code review before the first comparison keeps its existing admission path;
never require a nonexistent retained film. The current profile protects eight preflight
reservations, including both silent phone sequences,
four critic calls and conservative native capacity. Attach it before the first grant for a
failure. Historical grants keep their recorded counts. If a real older modern-floor grant
omitted this path and the already charged builder is the only later paid operation, retain that
grant and use `completion_forecast.py --state <ledger> --parent-grant <actual-event-index>
--comparison <retained-package>/comparison.json --output <new-forecast-plan.json>`, then the
ordinary production-budget and completion-capacity commands on the new evidence plan. This
records the exact missing capacity once, separately; it approves no film, pivot or correction.
Do not refund the builder, edit old policy bytes or reuse the film failure as another ordinary
grant. All later review and capture attempts remain reserved before execution.

The comparison profile and forecast reconciliation are admission checks for the whole path,
not a progress counter. After a grant, do not replay its initial minimums as a demand for new
unspent calls after every attempt, or request that grant again. For the same open repair, save
a remaining-path table bound to the actual ledger. Name each pending operation, its required
resource, any exact unused prepaid reservation and the unreserved calls still needed. Run the
ordinary current-phase production-budget and verify every remaining comparison, phone, native,
audiovisual and panel operation against that table. A failed review stays charged and does not
complete its required scope. A changed-candidate content continuation needs its own precharge.
If that exact unused reservation already exists, bind it once instead of reserving it again.
Keep the existing opening reboard and all original grant counts. If a real new failure exhausts
the remaining path, use its fresh independent admission.
A funding table never supplies a passing review or waives a quality or shipment gate.

If admission refuses a combined code handoff or string-only finding, preserve the exact error
and the original response. Use the unchanged individual treatment report. If its category,
scene and time are already explicit, resume the same critic only to encode those existing facts
in the required object fields, keeping the full defect text and verdict unchanged. Retain that
native format-only response and its actual API usage. A new classification or changed-candidate
assessment is substantive and needs a fresh reservation. Never write an independent grade or
category for the critic, relabel the failure, or ask the owner to choose an internal schema or
admission path. Repair a remaining contract defect through normal source review and CI.

```sh
python scripts/capture_completion_budget.py --state out/dispatch/run_state.json --plan <new-independent-mandatory-or-finish-plan> --comparison <retained-package>/comparison.json --output out/dispatch/comparison-completion-plan.json
python scripts/run_controller.py --state out/dispatch/run_state.json completion-capacity --repair-plan out/dispatch/comparison-completion-plan.json
```

This evidence schema binds the original comparison and its actual hook/entry charges.
It protects eight preview charges (comparison two, silent phone sequences two, final phone one,
timed phone sequence one, native hero one, motion one), four conservative critic calls and the
existing full audiovisual/scoring path together.
An independently bound `mandatory-modern-code` rejection uses its current code packet and
renderer evidence, without inventing a reviewed film hash. Attach the current complete
comparison profile; the retained paid pair and all source-binding checks still apply.
Use a fresh actual independent admission that has not already received a grant. It adds only
recorded deficits, retains original plans and grants, and approves no film or shipment.
Run cheap duration, caption-fit, source-binding, routing and review-request-format checks before
another reservation. Compare the replacement against every unresolved defect. Re-render once
for the consolidated change, then obtain the fresh independent verdicts its bytes require.

Keep one active owner for each repair. If a worker completed, explicitly resume/reassign it;
a passive message may not restart work. Wait on its current handle and saved verdict. A timeout
does not justify a duplicate render or ending production.

For an actual infrastructure failure, retain the log and concrete fix:

```sh
python scripts/run_controller.py retry-preflight --operation "<exact failed operation>" --evidence <failure-log> --reason "<verified infrastructure fix>"
bash scripts/package_review_run.sh --date <date> --slug <slug> --reason "<cause and next executable repair>" --blocker-report out/dispatch/blocker-report.json
```

The first command permits a charged retry without erasing spend. The second saves a playable
checkpoint with production still active. Neither grants creative approval or shipment.
A genuine access or remaining-resource blocker must retain exact evidence and the next action;
never invent a verdict or report quality failure as successful delivery.

From September 30, distinguish technical-integrity corrections using the independent
classification in BOUNDED_CREATIVE_RELEASE.md before begin-repair. Keep all charges.
A framing or caption fix is not a new creative treatment. Inspect the entire failed sequence
once, consolidate the correction, and reuse exact unchanged evidence. Prioritize a proven
source-grounded treatment before another speculative repair. The finite release route cannot
waive the new dated minimum picture-action requirements.

## Expand a context-dependent native passage

Choose the hero window with its causal antecedent before the first native render. A closing
caption referring to an earlier target check needs that check inside the reviewed passage.
If the full timed phone film passes but a native excerpt omits this context, preserve the
rejected hero, native proof, receipt, raw response and cache in an immutable repair directory.
The same paid independent phone reviewer must diagnose every exact original finding. Use
schema `dispatch-hero-context-diagnosis/1`, binding board, phone report/film, rejected hero,
receipt and raw response hashes. Include exact old/proposed hero field pairs, source_basis,
context_explanation, original_defect_assessments and the exact-template renderer_audit.
Assessment categories are excerpt-context or retained-artistry; neither approves the film.

Set repair_scope to review-context. changed_inputs names only storyboard.json and its retained
baseline. diagnosis, failed_hero, failure_response and failed_proof are path/sha256 references;
failure_evidence and its SHA bind the rejected receipt. The admitted pod-delivery-v1 source
audit must establish that neither hero field is rendered. The requested window must retain
the rejected passage and strictly expand to at most four contiguous story scenes.

Run production-budget --repair-plan before begin-repair, reserve exactly one reboard, change
only the two hero fields and authorize-repair with the completed after hash. Source, script,
scenes, captions, mix, public assets, renderer and full phone film stay frozen. The original
phone verdict may be reused only while those exact dependencies remain unchanged. Resources
must include charged native rendering and fresh hero audiovisual review; there are no new
critics, allowance resets or score changes. Technical accounting excludes this one charged
reboard from creative rounds. A rejected hero cannot claim a feasible finish-current route.
The expanded native bytes require a fresh independent hero verdict. Same-byte/lens cache
rejections stay binding, and all final audiovisual lenses, scorers and shipment gates remain.

Current directed-film-v2 editions retain the modern engagement and finished-art floor during
mandatory repair. Do not restore legacy renderers, old images or slideshow rescue at a ceiling.
Read autonomous_completion_v2 and include necessary ImageGen attempts in the complete remaining
path. Reuse unchanged freshly generated assets within this edition. Each actual replacement
generation is charged before execution, keeps its rejected predecessor, and records new bytes
and original tool identity. Independent failed modern_observations admit modern-film-floor
capacity; optional polish and a director's self-assessment do not.
