# Read-only cache inventory for no-spend reprojection (2026-10-16)
Cache independent-review-cache/6bc4cc3933c87172d3d8c0dd70cd6119ef63861ab97505c6680ab879b91b5ec6 (filename, size only):
- attempt.json 14125 bytes (original HTTP 402 attempt)
- transport.lock 0 bytes
- availability-recovery/attempt.json 14229 bytes
- availability-recovery/response.json 492483 bytes
Not present: report.json, any saved request context, prompt or input packet, selection.json.
Ledger, original recovery transport: event index 63 independent_review_transport at 2026-10-16T12:05:03.964233Z. Preceding reservation index 62 "independent transport phone" {audiovisual_reviews 1} at 2026-10-16T12:04:59.346342Z. Then telemetry reservation index 64 at 12:07:05.658443Z and telemetry index 65 at 12:07:09.565434Z (request 06e8b667-b06d-4804-9a82-1199cf60fd40, 200,299 tokens).
reviewed_at: absent. The string "reviewed_at" does not occur in availability-recovery/attempt.json, in the original attempt.json or in response.json. The recovery attempt.json holds only request_id, role, bindings, host_failure, failure_sha256 and review_context_sha256 (055b7b1a...). So the original reviewed_at, the full request context and the prompt were not persisted. Nothing was reconstructed, stamped or guessed. All files untouched.
