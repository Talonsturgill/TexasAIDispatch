# Independent review availability recovery

## Restored generation service after HTTP 402

Keep a failed provider request, original charge and actual failure evidence. Metadata GET success
proves authentication only. HTTP 402 requires external credit restoration; do not change billing
or purchase credits as a production recovery. After the owner restores service, run the charged
bounded generation probe against the same configured provider and model:

```sh
python scripts/provider_availability.py --state out/dispatch/run_state.json --after-attempt <original-cache/attempt.json> --failure-evidence <retained-HTTP402-evidence>
```

The probe protects the complete remaining route, reserves one audiovisual request before calling,
keeps its response and telemetry, and supplies no film verdict. For new failures the original
cache has a bound failure.json; the evidence argument is needed only for earlier attempts whose
exact retained log names both HTTP 402 and that cache. No completed response or verdict qualifies.
The probe prints its canonical receipt path. Run the original independent_review command with
`--availability <that-successful-receipt.json>` added. That permits one charged child recovery
for the same scope, preserving the original failed cache. Another failure stays charged and cannot
be repurchased by changing the receipt. The response embeds the actual probe and original failure
identity for portable verification. A cached approval or rejection stays unchanged.

If the startup probe itself failed with HTTP 402, use its retained startup/attempt.json as the
after-attempt target only after external service restoration. Its one linked recovery receipt
can unlock the normal early source packet. Never describe a service probe as video approval.

The retired eight-token probe used the audiovisual STOP parser and could reject a working
HTTP 200 service. For that exact retained legacy failed probe only, rerun the same command
with `--after-probe <its-original-receipt.json>`. This precharges one fixed child attempt,
retains both originals and validates actual generated-token evidence, including a bounded
MAX_TOKENS response. It never accepts HTTP 200 or metadata alone. The new JSON probe keeps
the original response body and error. Review streams still require their complete response.
Fix internal probe defects autonomously in an isolated tested tooling PR, merge it and resume
the same ledger. Do not ask the owner to approve that repair or the ordinary funded next step.

## Assigned independent role transport

This is a transport route for an assigned role that returned no verdict. It never turns a
creative or integrity rejection into approval. The director remains the director. The existing
critic and three scorer roles keep their briefs, fixed rubric, source requirements and current
media scope. No extra creative judge, option or research pass is introduced.

First retain the actual host error, assigned actor, role and observed time in a JSON file with
schema dispatch_review_transport_failure/1. Use role code, phone, picture, story or sound,
actor, observed_at and error. The supported exact capacity message is "Selected model is at
capacity. Please try a different model." Supported machine error codes are server_overloaded,
rate_limit_exceeded, usage_limit_exceeded, context_length_exceeded and session_budget_exceeded.
The exact host results `collab tool failed: agent thread limit reached` and `collab spawn failed: agent thread limit reached` also qualify. Record that full result in `raw_error` and use `agent thread limit reached` for `error`; never substitute an overload code. The file records an observed tool result, never a guessed outage. No verdict means no verdict.
Include reservation_event_index, the exact reserved event as reservation, its canonical JSON
reservation_sha256 from independent_review.fingerprint, and assignment with role, actor,
board_sha256 and film_sha256 (null at code scope). Copy the actual allocation and compact
assignment, not a different role's reservation. A completed current host pass or rejection
refuses fallback. The provider echoes a digest of its complete request context; downstream
gates reject rebinding an unchanged response to other media, sources, code or actors.

If the owner has changed the model or availability has otherwise changed, resume the already
reserved uncompleted worker once with its compact packet. Do not create a second critic or
refund the failed reservation. Never change the saved automation model or schedule implicitly.
If that transport remains unavailable, immediately use the existing configured independent
audiovisual provider. Do not keep polling the unavailable model or end production at capacity.

Before structural creative work the ordinary production-budget precheck protects both the
host path and provider recovery. For actual host unavailability, check the provider path.
It needs no fresh critic reservation, retains every earlier critic charge and protects a
separate phone call, native hero review, three final audiovisual lenses and three separate
scorer calls. It never raises or replaces the frozen envelope. The CLI reuses a completed
current phone verdict only after the exact-film gate and claim bindings verify it.

```sh
python scripts/run_controller.py production-budget --review-route provider
python scripts/independent_review.py --role phone --board out/dispatch/storyboard.json --claims out/dispatch/claims.json --film out/dispatch/preflight.mp4 --failure out/dispatch/phone-transport-failure.json --state out/dispatch/run_state.json --out out/dispatch/phone-critic-current.json
```

The script charges one audiovisual request before contacting the provider, including a failed
request. It binds the board, callable renderer, current claims, policy, actual MP4 and role.
Its report embeds the original provider response and distinct response identity. Only byte
identities are stamped locally. No finding, pass flag, score or classification is rewritten.
Run the ordinary critic_gate exact-phone and opening selection checks on that actual report;
a transport receipt alone is never a pass. Preserve the original code-plan review separately.
For unavailable code-plan review use role code and omit --film. This examines the actual
callable source and authorizes only the ordinary phone test when the existing gate accepts.

The two-treatment assignment still compares both complete current films. If that assigned
host critic is unavailable, review each current treatment through the same isolated provider
role, retain both complete verdicts and choose only from those observed findings. Plan both
calls in the precheck before spending; do not introduce a third treatment or judge.

For final scorers retain all completed independent judges. Reserve the atomic panel once
through the ordinary panel command, obtain all three separate final audiovisual lenses, and
use the corresponding current receipt for each uncompleted scorer. These are separate
provider requests with fresh contexts and response identities, distinct from the audiovisual
lens calls and director. Generate the ordinary role packets first.

```sh
python scripts/independent_review.py --role picture --board out/dispatch/storyboard.json --claims out/dispatch/claims.json --film out/dispatch/film.mp4 --failure out/dispatch/picture-transport-failure.json --state out/dispatch/run_state.json --out out/dispatch/scorer-picture.json
```

Use corresponding story and sound roles only for their actual unavailable workers. Retain the
three original scorer objects, then run ordinary panel_triage and every release gate. All
three final audiovisual lenses and all three scorers remain mandatory. Director Computer Use
inspection, feed overlays and canonical permanent phone playback also remain mandatory.

Completed provider rejections are cached and reused unchanged. A failed provider attempt is
charged and retained; unchanged inputs authorize no repeat paid work or polling. If both
transports lack external access, retain the precise failure without claiming completion.
Capacity is never permission to self-certify, skip native proof, lower the rubric, alter source
evidence or finish anything except an accepted shipped edition.
