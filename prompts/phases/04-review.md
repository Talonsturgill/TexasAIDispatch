# Current-film review and release authorization

Current art-profile packets bind ART_DIRECTION.md, its policy and the frozen reference bank.
Each existing reviewer first reconstructs the film, then checks the executed silhouette,
hierarchy, contact, finish, rhythm and signature shot against those references. Judge the
actual current bytes under the unchanged rubric; preserve failures and stop optional polish
at the existing boundary. Keep the three separate scorers and actual audiovisual responses.

Run the cheap mechanical checks before buying a panel. The full render creates the exact-film
attention player, contact sheet and bindings. Labels must match the current board and film.
Inspect the actual MP4 at phone size, every action and transition, the contact sheet and feed
composites. Listen when access permits and record any limitation honestly. Provider audiovisual
evidence is still mandatory; visual inspection alone never proves audible quality.

If an independently evidenced positive whole-film finished-art observation required the existing
scope continuation, verify its retained receipt against the current production renderer before
release. Historical archived receipts use their exact release source only in the separate archive
audit; that historical route cannot admit active production.

```sh
if [ -f out/dispatch/finished-art-scope.json ]; then
  python scripts/review_scope.py --out out/dispatch --verify
fi
```

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
python scripts/metadata_continuation.py --board out/dispatch/storyboard.json
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

Generate corresponding story and sound packets. For current agent-runtime editions, prepare
all three explicit isolated assignments, then execute them under the existing atomic panel:

```sh
python scripts/agent_runtime.py --plan --role picture --packet out/dispatch/picture-packet.json --task-name picture_score --scope "Independently watch the exact finished film through the picture lens and all required timed observations" --out out/dispatch/picture-assignment.json
python scripts/agent_runtime.py --plan --role story --packet out/dispatch/story-packet.json --task-name story_score --scope "Independently watch the exact finished film through the source, narrative and comprehension lens" --out out/dispatch/story-assignment.json
python scripts/agent_runtime.py --plan --role sound --packet out/dispatch/sound-packet.json --task-name sound_score --scope "Independently assess the exact finished film through the sound lens using actual audiovisual evidence" --out out/dispatch/sound-assignment.json
```

Keep all three identities separate and do not brief them with another scorer's judgment.
Pre-effective ledgers keep their original compact assignment path. Spawn three `scorer` agents in one parallel batch,
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

## Review picture-to-word alignment

For a Claude edition, build the existing current role packets with daily_production.py and
use claude_runtime.py plan to obtain the named scorer agent_args. Spawn `scorer` separately for
picture, story and sound, with their actual role-specific packet. Reserve one atomic panel and
all three scorer_calls before execution. Preserve each original response and independent identity.
No root self-review or initial planned-art packet can supply a scorer verdict.

Include the selected visual-storytelling dossier and sentence-to-shot notes in the existing
compact review packet. Scorers use knowledge/craft/visual-storytelling/README.md to compare the
actual pictured subjects, relationships and consequences with the spoken clauses at exact times.
For newly planned editions from October 3rd, the packet binds the viewer method, reporting dossier
and named approach guides; the independent-provider transport supplies their actual text.
Each scorer first reconstructs the account from the film, then compares the source-backed
explanation and rationale. Inspect the information added at each cut and the same-subject
handoff between physical images and coded explanation. Use the current observation fields;
the reasoning method never establishes a score or replaces an independent verdict.
Retain the current three lenses, separate scorers, fixed rubric and exact-film evidence.
A technically moving but unrecognizable explanation does not pass comprehension because its
captions repeat the claim. Preserve source/comprehension failures as blocking under the current
contract and artistic findings under their actual categories. No new panel is introduced.


## Narration and picture use one clock

For new production from October 8th, every spoken clause has a narration-picture-v1 binding in board.narration_picture. Write exact clause text, concrete subject_ids, executable action_id, source claim_ids, scene_id, cue_ids and event_ids before voice production. Cover all words and qualifiers once in their original order. The registered episode declares which views actually implement those subjects and actions. A topic match, caption or label cannot replace a pictured causal step.

Before voice exists, use timing_mode authored with an explicit provisional cue plan for the silent two-treatment comparison. These estimated windows approve only planning. After alignment, board_retime.py replaces them with measured_caption_boundaries from the actual captions and acoustic word stream. Timed capture, preship and delivery require those measured inputs and reject an authored clock.

After acoustic alignment, compile every clause window from complete measured caption boundaries and the matched positional word stream. Use modern_film.compile_narration with the actual captions and words. Derive cut handoffs from silence between clauses. Only framing subdivisions inside the same subject/action may use fractions. Renderer performances consume requireNarration on the film-global clock, and retain completed consequences across cuts. Never stretch speech, scale cue times, or proportionally place a different narrated action inside a scene.

Run scripts/modern_film.py with --board, --captions, --words, --script and --claims before timed capture and preship. The gate rejects missing or duplicated clauses, omitted qualifiers, stale timing, wrong condition identity, incompatible renderer views and gaps in matching picture coverage. These checks establish bindings, not audience understanding. Code, phone and final reviewers inspect the actual subject and performed action for every clause. Return narration_picture_observations bound to the exact film, with ordered clauses containing id, pass, exact start_s/end_s and observed. Preserve a wrong or absent picture as a source/comprehension blocker even if provider metadata says pass.

A current clause must remain understandable with its captions covered. Introduce the spoken subject before its clause begins, perform the narrated change while it is heard, and retain the relevant result through the clause end. Distinguish selection, analysis, test condition, observed result and clinical limit. Generic clinical forms, a repeated test picture under an AI-selection line, or the normal condition under a patient-variant line fail this contract.
