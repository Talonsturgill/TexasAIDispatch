# Conditional implementation and recovery reference

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
