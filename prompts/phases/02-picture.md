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
Keep quality_plan, three source-backed images, attention_beats, the cinema plan and required
dimensional coverage. The hero is the hardest current action, not a comfortable old opening.

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
python scripts/script_evidence_check.py --board out/dispatch/storyboard.json --claims out/dispatch/claims.json
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
python scripts/daily_production.py --board out/dispatch/storyboard.json --claims out/dispatch/claims.json
python scripts/preflight_animatic.py --board out/dispatch/storyboard.json
```

The preview command reserves before rendering and runs cheap board/source/caption checks first.
Inspect actual motion at phone size, plus the contact sheet with explanatory text hidden.
Require recognizable contact, action, consequence, dominant-subject movement and readable framing.
A pixel-motion score or contact sheet alone cannot prove continuity.

Reserve the exact-phone critic separately and obtain its actual current-film verdict.
Record review_scope exact-muted-phone-preflight, reviewed_preflight_sha256 and current bindings
in storyboard_critic.json. A code-plan pass does not approve the phone film or native hero.
Before voice, resolve every structural or source defect through prompts/phases/repair.md.
