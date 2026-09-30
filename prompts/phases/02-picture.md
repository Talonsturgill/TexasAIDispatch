# Board and prove the picture

Read the daily, documentary, quality and cinematic contracts before boarding. Use the current
county to select the Texas region. Read relevant REGIONS.md and CULTURE.md; represent people,
plants, animals, workwear and safety equipment accurately. Do not use generic Plains imagery,
Confederate motifs or borrowed cultural icons as Texas decoration.

One director locks the source-bound story_contract and transitions described in DAILY_PRODUCTION.md.
One physical throughline changes state across the film. Each scene performs a concrete action;
the opening pays off early and the final image answers it. Stage anticipation, contact,
accumulation, consequence and a short comprehension hold on deterministic event windows.
Do not substitute a panel, camera drift or idle prop motion for the central mechanism.

Use daily-actions-v1 and supported production_action ids when they fit the evidence. A custom route may call demonstrated components or the one current source-backed proposal under DAILY_PRODUCTION.md. Keep exact code/source bindings, independent action review and its proposed action in the native hero. No proposal substitutes for current rendered proof. Human
performance needs actual supported footage or a separately demonstrated mechanism.
Keep quality_plan, three source-backed images, attention_beats and the dated cinema plan.
Read CREATIVE_DIRECTION.md: current editions choose media by source fit and prove every scene. The hero is the hardest current action, not a comfortable old opening.

## Board fields and local checks

out/dispatch/storyboard.json is the actual props file. Scenes tile the story runtime without
gaps or overlap. Each scene has id/start_s/duration_s, county/region, camera_strategy, cast,
beat, story_role, on_screen, what_moves, visual_sentence, visual_family and payload_mode.
For the plane renderer, provide four to six ordered far-to-near planes with real items and
stable item ids. Depth sets distance; scale must preserve physical dimensions.

Every narrated scene declares visual_proof: a mute_takeaway, must_show concepts bound to
rendered item_ids, and a visible change. Each visual_event has the actual subject ids and a
stable event id. Declare hook_strategy/hook_payoff_s, fauna_scope, cinematic_template and
cinematic_contract (throughline, turn_scene, button). Use the composition axes fingerprint,
derived_from scratch and a concrete divergence_note; a new subject alone is not a new composition.

Shared SubtitleTrack and CreditsCard live in lib/DispatchOverlays.tsx and are re-exported by
Dispatch.tsx. Keep the measured full-word caption band, branding and complete attribution.
Do not add custom paragraph captions or a guessed word clock. Plan a readable short credit
tail within the held-frame policy; music continues through it.

```sh
python scripts/registry_check.py
python scripts/storyboard_check.py --board out/dispatch/storyboard.json
python scripts/watchability_check.py --board out/dispatch/storyboard.json
python scripts/documentary_check.py --board out/dispatch/storyboard.json
python scripts/shot_coherence.py --board out/dispatch/storyboard.json
python scripts/staging_check.py --board out/dispatch/storyboard.json
python scripts/board_scale_check.py --board out/dispatch/storyboard.json
python scripts/floor_check.py --board out/dispatch/storyboard.json
python scripts/script_evidence_check.py --board out/dispatch/storyboard.json --claims out/dispatch/claims.json --planning-only
python scripts/super_evidence_check.py --board out/dispatch/storyboard.json --claims out/dispatch/claims.json
node video-engine/tests/caption_board_fit.mjs --board out/dispatch/storyboard.json
python scripts/daily_production.py --board out/dispatch/storyboard.json --digest
python scripts/daily_production.py --board out/dispatch/storyboard.json --claims out/dispatch/claims.json --state out/dispatch/run_state.json --packet storyboard-critic --out out/dispatch/critic-packet.json
python scripts/run_controller.py consume --resource storyboard_critics --note "current board and causal sequence"
```

Spawn `storyboard-critic` with its brief, compact packet and the actual source-backed board.
It reviews composition, silent comprehension, continuity, source limits and retention.
Save its real verdict, reviewer identity, current concept and renderer digests, story_review
and weakest frame to storyboard_critic.json. Get digests from critic_gate, not a guessed file.
The critic must be independent of the director. A revise verdict is active repair.

```sh
python scripts/critic_gate.py --board out/dispatch/storyboard.json --report out/dispatch/storyboard_critic.json
```

For editions under config/creative_production.json, prepare opening-a.json and opening-b.json
with the same narrative and assets under CREATIVE_DIRECTION.md. From September 30 their
complete visual treatments may differ; do not freeze a weak body before comparison. The one existing code assignment
returns opening-a-critic.json and opening-b-critic.json. Keep storyboard.json as the current
provisional board for the same controller, then run the bounded first preview batch:

```sh
python scripts/opening_compare.py --root out/dispatch --state out/dispatch/run_state.json
```

Read both structural inspection reports linked from openings/comparison.json before reserving
the phone critic. The normal route requires both to pass. The comparison command inspects cached
outputs too, without another render, and retains both failures before returning nonzero. Use
--retain-failed-inspection only to collect diagnostics for policy-authorized finishing; that flag
does not approve either film or clear the normal review gate.
After the inspection tooling upgrade, use --inspect-retained for the explicitly supported old
capture version. It preserves the original producer, comparison and independent selection
bindings and inspects the unchanged films without a new render. Any capture or source drift
remains a refusal; never rewrite the reviewer selection to pretend a new capture occurred.

The existing phone critic compares both openings and reviews the chosen whole cut in one
reserved assignment. Save its openings/selection.json. Copy the chosen openings/a.json or b.json
to storyboard.json and its matching MP4 to preflight.mp4; copy its code critique to
storyboard_critic.json, then inspect the already rendered bytes:

```sh
python scripts/preflight_animatic.py --board out/dispatch/storyboard.json --inspect-only
```

Record the ordinary exact-phone review on that film. Run daily_production.py with --board and
--claims after selection; it requires the bound comparison before narration. Subsequent timed
previews use the normal preflight command. Earlier editions use the ordinary initial preview.
The preview command reserves before rendering and runs cheap board/source/caption checks first.
Inspect actual motion at phone size, plus the contact sheet with explanatory text hidden.
Require recognizable contact, action, consequence, dominant-subject movement and readable framing.
A pixel-motion score or contact sheet alone cannot prove continuity.

Reserve the exact-phone critic separately and obtain its actual current-film verdict.
Record review_scope exact-muted-phone-preflight, reviewed_preflight_sha256 and current bindings
in storyboard_critic.json. A code-plan pass does not approve the phone film or native hero.
Before voice, resolve every structural or source defect through prompts/phases/repair.md.

Before voice or preview, include visual_research and complete native_media provenance under DAILY_PRODUCTION.md. Run the existing daily-production check and have the existing independent critic compare inserted media with the previous shipped edition. Use actual sites and source documents when they improve the shot. Preserve a tangible action
and consequence through the film; choose source-grounded original illustration when it tells
the story better. Relevant imagery alone never approves a treatment.
