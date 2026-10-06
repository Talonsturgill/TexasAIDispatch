# Conditional implementation and recovery reference

An explicitly owner-requested cinematic engineering spike uses a separate cumulative lab
ledger. It is not a production edition, approval, host recovery or reusable daily b-roll.
Charge each actual attempt first; preserve failure films, responses and original limits.
An extra lab allowance needs an explicit owner instruction recorded as a separate increment.
The paired native master still requires the headroom planner, guarded workspace housekeeping,
native PNG/CRF16 and honest picture/sound observations. Normal production uses its controller.

```sh
python scripts/cinematic_lab.py --ledger <lab>/ledger.json charged --resource native_renders --count 2 --note "reserved engineering pair" --input <lab>/a.json --input <lab>/b.json
python scripts/cinematic_lab_review.py --root <lab>/comparison --ledger <lab>/ledger.json --a <lab>/a-native.mp4 --b <lab>/b-native.mp4 --sources <lab>/source-excerpts.json
```

Read this only for a relevant implementation question. Search the corresponding GATE_LESSONS.md
entries. A checker repair needs an adversarial regression proving the original defect is caught
and valid input still works. Fix the owner, not a generated output or a downstream symptom.

## Generated media exception

Prefer native story actions. Generation can supply a necessary texture/location plate, never
exact factual wording, decisions or visual-proof subjects. Declare the prompt, required content
and replaces_item_ids. Respect config limits; verify the manifest before rendering.

```sh
python scripts/generated_media.py --board out/dispatch/storyboard.json --plan
python scripts/generated_media.py --board out/dispatch/storyboard.json --generate
python scripts/generated_media.py --board out/dispatch/storyboard.json --verify
```

## Voice and renderer failures

Only measured silence may be removed from an accurate continuous take. Preserve source/output
hashes, removal intervals and unchanged speech rate; then rerun the soundcheck.

```sh
python scripts/compact_take.py --source out/dispatch/takes/<take-id>.wav --out out/dispatch/takes/<take-id>_compact.wav --report out/dispatch/takes/<take-id>_compact.json --takes-json out/dispatch/takes/takes.json --take-id <take-id>
```

When no real take is accessible, a review-only fallback can preserve a playable diagnostic
checkpoint. It deliberately cannot pass alignment or publication. A rescue is never the target
quality. The render wrapper invokes rescue/manifest code; do not manually certify an old film.

```sh
python scripts/fallback_audio.py --board out/dispatch/storyboard.json --wav out/dispatch/mix.wav --report out/dispatch/mix.json --captions out/dispatch/captions.json
python scripts/rescue_video.py --board out/dispatch/storyboard.json --mix out/dispatch/mix.wav --preflight out/dispatch/preflight.mp4 --preflight-report out/dispatch/preflight.json --out out/dispatch/film.mp4 --report out/dispatch/rescue.json --reason "<retained renderer failure>"
python scripts/render_manifest.py --film out/dispatch/film.mp4 --board out/dispatch/storyboard.json --out out/dispatch/render-manifest.json
```

## Rendering and cache changes

Production entrypoints use scripts/render_dispatch.sh, preflight_animatic.py and cinema_proof.py.
Their batch runner selects the registered Dispatch composition via installed Remotion APIs.
Daily actions use src/daily.tsx; legacy boards use src/index.ts. One batch bundles once and
reuses one browser. Frames remain deterministic; wall-clock timing is only diagnostic.

config/render_reuse.json pins the exact isolated runtime dependency closure. A runtime edit
falls back to conservative whole-board inputs until the projection is revalidated. A profile
update requires native parity and mutation tests, including captions, credits, stage removal,
outside-passage edits and actual source PCM. Never merely refresh hashes to accept a new
dependency assumption. Libraries, fonts, assets, frame range, browser and capture settings
remain bound. Full proof and final AV gates still cover the entire current film.

Reserve each development render batch in a separate dry-run ledger before the native suite.
Use the existing pinned browser; run from video-engine. The --legacy-only option in the native
suite resumes a completed isolated suite after a reference-path failure and does not approve
production media.

```sh
python scripts/cinema_cache_test.py
node video-engine/tests/render_batch.mjs
node video-engine/scripts/verify-render-reuse.mjs <reserved-development-output>
python scripts/production_quality_test.py
(cd video-engine && node tests/cinema-proof.mjs)
```

For a precise rendering diagnostic, reserve first and render only the required frame:

```sh
(cd video-engine && npx remotion still Dispatch <diagnostic.png> --props=<board.json>)
```

Do not use a diagnostic still instead of final-film extraction or exact audiovisual review.

## Explicit owner review allocation

A producer cannot renew the frozen envelope. If the owner explicitly approves one or two
additional storyboard-critic calls for a named active edition, the controller can record a
separate owner grant. This is never an automatic repair step and never follows from silence,
a broad request to continue, or an older approval. The operator must retain the actual owner
instruction and its message reference, the exact edition/resource/count and the rejected
independent review evidence. Preparing the tooling or an unsigned request grants nothing.

Keep the original frozen allocation and every charged attempt. The additive grant is limited
to storyboard critics, allows at most two separately authorized grants per edition and is
revalidated when reserving work. Each grant permits at most two calls. The second requires a
different retained owner instruction, approval id and message reference, plus
previous_grant_sha256 from repair_guard.envelope_digest of the exact preceding grant event.
A third grant is refused. These are explicit owner exceptions, never an automatic repair path.
Repeated approval identifiers, changed evidence, another resource and an oversized count fail.
No film verdict, render allowance, source gate, score threshold or shipment condition changes.
The ordinary routine does not repeatedly ask for budget extensions. It retains an unfinished
edition with exact evidence and a next step when the remaining shipment path is infeasible.

The retained authorization JSON contains approval_id, run_id, resource set to
storyboard_critics, additional_calls, the exact owner_text and source_message_reference,
resource_envelope_sha256, failure_evidence and failure_evidence_sha256. Its confirmation
must match the explicit CLI confirmation. Compute the envelope hash with
repair_guard.envelope_digest on the existing original envelope; never edit that envelope.
Only after the named approval arrives, invoke grant-owner-review with --authorization,
--failure-evidence, --additional-calls and --confirm. The required confirmation is
"OWNER AUTHORIZED EXTRA STORYBOARD CRITIC CALLS". Re-read the ledger after success and
reserve each actual review normally. The command records allowance, not spent work or approval.

For a rejected native hero, the failure evidence may be its original audiovisual receipt.
Also retain failure_film and its failure_film_sha256, and failure_response_json containing the
exact raw provider response text referenced by the receipt. The command verifies the actual
film and response bytes and requires the provider's explicit rejection with observed defects.
A parsing error, inaccessible audio or an edited verdict is not qualifying rejection evidence.

Before spending on a structural repair, run python scripts/run_controller.py production-budget.
This checks one reboard, code/phone review, phone/native proof, final render, all four provider
lenses and the atomic panel against remaining resources. It changes no state or allowance and
is feasibility evidence only, not a reservation or quality verdict. Extra narration or source
work must also fit before use.
