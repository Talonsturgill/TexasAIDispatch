# Pending owner decision: one extra validator call (edition 2026-11-10)

Status: NOT executed. No authorization file has been written. No tooling was changed.

Why: the validated 210-word script (sha256 776ebba27d578f433c619316c97e93da26e26254fc0f11b1a4a143c5c7bcfc8c,
round-2 PASS in validation-round2-pass-oldscript.json) fails free planning gates on its own board
(evidence/structural-revalidation: storyboard_check exit 1 with runtime 75.0 s over 35 to 62 s and eight 64-character
clause violations; modern_film exit 1). The script was shortened to 152 words
(sha256 ea37871b7fa22f11a23fa046e063d2d7b4257ed0b304a19b8a659461ae1024ba); boards regenerate and every
non-builder gate passes. A fresh validator pass is required; validator_agents is 2 of 2 used.

Existing route: run_controller.py grant-validator-review requires an owner authorization JSON with fields
approval_id, run_id, resource, additional_calls, confirmation ("OWNER AUTHORIZED EXTRA VALIDATOR CALL"), owner_text,
source_message_reference, resource_envelope_sha256, failure_evidence, failure_evidence_sha256.
Caveat: it requires failure evidence that is this edition's validator REVISE report whose "rejected" list holds
plain strings. The only REVISE (validation-round1-revise.json) holds objects, and the cause of this revalidation
is the structural gate failure, not that REVISE. The owner should decide whether that route fits or whether a
separate supported route is wanted.

Prepared, free: out/dispatch/validator-packet-3.json (sha256 4fe0ee31d7cddce0e1764c8306f803d785c8653903aca11c7110974163dff9f3)
binding the 152-word script and bindings. Same validator worker can be resumed after a reservation exists.
