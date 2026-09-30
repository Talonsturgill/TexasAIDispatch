# Current-film review and release authorization

Run the cheap mechanical checks before buying a panel. The full render creates the exact-film
attention player, contact sheet and bindings. Labels must match the current board and film.
Inspect the actual MP4 at phone size, every action and transition, the contact sheet and feed
composites. Listen when access permits and record any limitation honestly. Provider audiovisual
evidence is still mandatory; visual inspection alone never proves audible quality.

```sh
python scripts/engine_lint.py
python scripts/staging_check.py
python scripts/staging_check.py --board out/dispatch/storyboard.json
python scripts/watchability_check.py --board out/dispatch/storyboard.json
python scripts/documentary_check.py --board out/dispatch/storyboard.json
python scripts/documentary_review.py --board out/dispatch/storyboard.json --film out/dispatch/film.mp4 --verify
(cd video-engine && node tests/direction.mjs)
python scripts/flow_check.py --board out/dispatch/storyboard.json --sfx out/dispatch/sfx_events.json
python scripts/ship_gate.py --board out/dispatch/storyboard.json --claims out/dispatch/claims.json --script out/dispatch/vo_script.txt --captions out/dispatch/captions.json --audio out/dispatch/mix.json --pre-panel
python scripts/music.py --verify-package out/dispatch/credits.txt --mix out/dispatch/mix.json --board out/dispatch/storyboard.json --master out/dispatch/mix.wav
python scripts/super_evidence_check.py --board out/dispatch/storyboard.json --claims out/dispatch/claims.json
python scripts/board_scale_check.py --board out/dispatch/storyboard.json
python scripts/floor_check.py --board out/dispatch/storyboard.json
python scripts/safe_area_check.py
python scripts/feed_composite_check.py --film out/dispatch/film.mp4 --board out/dispatch/storyboard.json --manifest out/dispatch/render-manifest.json --out out/dispatch/feed-composite.png --report out/dispatch/feed-composite.json
python scripts/freshness_check.py --film out/dispatch/film.mp4 --started out/dispatch/render_started --inputs out/dispatch/storyboard.json out/dispatch/mix.wav out/dispatch/captions.json
python scripts/run_discipline.py --state out/dispatch/run_state.json
python scripts/preship_check.py --board out/dispatch/storyboard.json
python scripts/run_controller.py panel --judges 3 --note "current finished cut"
```

The controller reserves a whole round and all three scorers atomically, only after current
preship establishes current integrity. Production has no blanket bypass. The finite policy in
knowledge/craft/BOUNDED_CREATIVE_RELEASE.md may separately defer classified artistic failures.
Then obtain all three exact-byte audiovisual lenses
on the same final MP4, even when an earlier lens rejects. Collect defects together.

```sh
python scripts/audiovisual_review.py --role picture --film out/dispatch/film.mp4 --out out/dispatch/cinema/picture-review.json
python scripts/audiovisual_review.py --role story --film out/dispatch/film.mp4 --out out/dispatch/cinema/story-review.json
python scripts/audiovisual_review.py --role sound --film out/dispatch/film.mp4 --out out/dispatch/cinema/sound-review.json
python scripts/daily_production.py --board out/dispatch/storyboard.json --claims out/dispatch/claims.json --state out/dispatch/run_state.json --packet picture --out out/dispatch/picture-packet.json
```

Generate corresponding story and sound packets. Spawn three `scorer` agents in one parallel batch,
with distinct identities and starting lenses picture, story, and sound/credible Texas experience.
Each gets the current film, its own provider receipt/raw response, current attention player,
contact sheet, feed composite, evidence, rubric and scorer brief. It performs an independent
review and records pacing_observed, comprehension_observed, both weakest-interval endpoints
including finite weakest_end_s, and actual audio evidence. Never fabricate listening.
If an assigned worker cannot start, use prompts/phases/review-availability.md for that same
uncompleted role. Keep completed judges and real rejections; do not purchase replacement verdicts.

Save their exact objects as the three-item panel-round-<n>.json. Preserve every hard fail and
rejection. Each scorer includes the `bounded_release` schema from scripts/creative_release.py,
with exact original findings and retained integrity observations. Never change a score or
creative verdict to make the release route pass. A weak interval alone is diagnostic.

```sh
python scripts/panel_triage.py --scores out/dispatch/panel-round-<n>.json --round <n> --record --run-id <date> --history out/dispatch/panel_history.json --out-report out/dispatch/report_card.json
python scripts/daily_production.py --scoreboard --state out/dispatch/run_state.json --out out/dispatch/daily-production-scoreboard.json
```

If rejected before the finite boundary, follow prompts/phases/repair.md. At the boundary,
finish and ship through the separately recorded bounded route without an approval stop.
Use axis deficits to choose a single consolidated
correction; do not spend one render per note or polish an already passing axis. Preserve the
rejected bytes and review identities. Changed film bytes require fresh current-film verdicts.

When the panel clears or the bounded route is evidenced, stop creative editing. Verify the complete package before publication
authorization, in this order:

```sh
bash scripts/deliver_run.sh --verify-only
python scripts/run_controller.py finish --result publishable --report out/dispatch/report_card.json
```

Publishable leaves production active in publishing. It is not terminal shipment.

For editions under config/creative_production.json, include the selected two-opening evidence
and the executed sound direction in the existing review packets. Each lens judges the story's
chosen medium without a 3D quota. Check the complete edit after structural changes; diagnose all
observed defects together. Passing fixed criteria ends creative editing and starts shipment.
