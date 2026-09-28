# Quality that can be seen and heard

The authoritative shared definitions are in config/quality_contract.json. The storyboard
critic, director and final scorer read them. The audiovisual tool inserts the same definitions
into each independent lens. The rubric remains the sole score threshold; cinematic, pacing,
source, caption and audio requirements remain unchanged.

## Picture-first treatment

Before narration or a preview, record quality_plan.contract_sha256 and one scenes entry for
every board scene: scene_id, medium, subject, action, consequence, source_basis and medium_evidence.
Use medium dimensional, source-footage, source-excerpt or diagram; source-still is also available
from the effective date in config/creative_production.json. Name the actual available
footage or demonstrated action. A proposed rig is not demonstrated capability. Choose another
supported action or explicitly prove the difficult passage before extending it.

Use licensed or appropriately sourced actual footage for natural human performance when a
synthetic rig cannot perform it. Apply the dated medium policy in CREATIVE_DIRECTION.md.
A source-backed image and its observed consequence receive the same finish and comprehension review.
Research, source assets, narration and alignment are reused when unchanged.

## Exact-picture approval

A phone reviewer binds quality_contract_sha256 and records timed phone_observations for each
visual criterion in the JSON contract. Sound is excluded from muted review; its independent
audible evidence remains required later. blocking_defects must be empty for approval.

Inspect the principal subject at setup, contact, transformation and result with the actual
caption and feed controls. Native finish inspection remains a distinct hero requirement.
Do not infer finished surfaces from a tiny preview or infer action from the board's prose.

## Calibration from retained September26 evidence

| Retained example | Observed result | Required judgment |
| --- | --- | --- |
| quality-cases/b72-phone.png, native hero e64ece7305eeda5c1681febed9a3f4b096d3ab0c971c17d08aff8c4c4ba25414 | The large inset conceals the truck, smooth props look unfinished, and the focal composition remains inert. | Peripheral movement and a result label do not repair the dominant image. |
| quality-cases/b73-phone.png, phone47b33251614eb55b649c912a0a711d66c4b76bc18ddbca9710e4f166ce2dd9f4 | Removing the border leaves a roughly90-pixel-tall pile in a270-pixel-wide phone frame. | A safe bounding box does not establish sufficient subject occupancy or deliberate composition. |
| Earlier approved capture hero0e8a8bbcbaa14983925c3295d3fbf3bcc067c6dba6501458897daf19c8d1ce57 | The provider approved the capture while naming the5.0–6.8second held-photo interval as weakest. | A weakest interval is required even on approval. Evaluate whether the hold earns comprehension; do not turn every preference into a mandatory defect. This historical approval does not approve another film. |

These are evidence references for calibration, not a request to reuse an old film or solicit
a different verdict on identical bytes. The offline tests verify rejection plumbing and known
false-approval fields. They do not simulate an audience or certify artistic quality.

## Corrections and recurrence

A repair plan includes stable mechanism_id, failure_family and director_identity in addition to
its existing failure evidence and changed input hashes. Use failure_family human-performance,
capture-and-analysis, document-handling, source-framing, continuity or unclassified.

After two failed repairs in the same mechanism or family, provide pivot_review.path/sha256.
The independent report records verdict, reviewer_identity, retired_mechanism_id,
replacement_mechanism_id, every reviewed_failure_sha256, visible_difference and source_basis.
The replacement must describe a different visible action or medium, not a renamed batch.
An independent critic checks this classification against the retained films.

New production runs freeze the configured cumulative resource envelope. Resumed legacy runs
adopt it with scripts/repair_guard.py --state out/dispatch/run_state.json --adopt. Adoption
preserves usage and existing allowance; it grants nothing. Repair cannot renew that envelope.
Provider token totals exclude Codex conversation and agents. Read the host's actual usage at
wake and before extended work; disclose unavailable accounting instead of claiming full coverage.
An exhausted allowance never creates a successful or shipped state.

Keep experiment development outside daily releases. Restore the daily schedule only after
a current film has passed its complete independent review and verified shipment.
