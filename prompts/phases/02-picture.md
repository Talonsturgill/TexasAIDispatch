# Board and prove the picture

Owner instruction from October 3rd, 2026. Read knowledge/craft/AUTONOMOUS_COMPLETION.md before applying older resource-boundary language below. Internal review ceilings and host capacity errors trigger autonomous mandatory completion recovery, never an approval stop or an unfinished-capacity final response. Preserve exact failures, the original frozen envelope and cumulative charges. Only accepted finish --result shipped completes production.

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

## Match pictures to the spoken story

For newly planned editions from October 7th, or an explicit art-profile opt-in, read
knowledge/craft/ART_DIRECTION.md, config/art_direction.json and the frozen
knowledge/craft/cinematic_reference_bank.json. The director specifies the profile before
coding. Apply its four lenses inside the existing two-treatment limit. Have the existing
builder read prompts/roles/scene-builder.md and execute the palette, finished hero, light,
framing and event timing. The daily-production check validates these inputs before spend.
Refresh cinematic-learning.json and recurring-defects.json with scripts/cinematic_learning.py;
the helper inherits the newest durable engineering decision from runs. If the
weekly packet is due, consider one reusable correction in this same assignment and prove it
within the already reserved comparison. Fund the entire remaining shipment path first; skip
optional engineering when it would delay an accepted cut. Record the decision and exact proof.

Read knowledge/craft/visual-storytelling/README.md and the selected approach dossier in full.
Use its sentence-to-shot worksheet in existing creative-direction notes and the compact packet.
Select the primary approach by the sourced action and usable assets; daily rotation is optional
only among equally suitable approaches. Preserve the existing two-treatment comparison.

For newly planned editions from October 3rd, read knowledge/craft/visual-storytelling/viewer-plan.md
and, for a news report, knowledge/craft/visual-storytelling/news-reporting.md. Choose a format
and sequence before writing the shot list. In medium_choice
name the approach and explain its asset fit and plausible alternative. Use the existing focus,
emotional-turn and edit fields to state the expected takeaway, likely false inference, new
information at each beat and the carried subject across footage/code handoffs. A cinematic
scene follows a task and turn; an explainer reveals successive states; a report chooses the
ordering its evidence supports. Do not force all three through a studio-intro template.

The current packet binds the method and relevant guides. Have each assigned worker read those
guides in full and make its own scope-appropriate judgment. Budget the complete host/provider
review path before selecting the treatment or spending on a structural repair. Preserve the
approved words and alignment during repair; a new rationale alone can't justify replacing or
rebuying a retained same-byte verdict.

Before narration, have the existing critic identify the principal subjects, action and result
from the rendered phone sequence before reading the board's explanation. Then compare each
spoken clause with its actual pictured subject and relationship. Do not approve abstract slabs
as a photo/depth comparison or flying blank sheets as a readable repair decision simply because
their item ids are bound and their pixels move.

Record missing recognition, absent principal action and misleading picture-to-word relationships
as concrete comprehension/source defects under the fixed contract. Consolidate them with all
current defects in the existing correction. This adds no reviewer, budget or render call.

## Existing builder assignment

For current agent-runtime editions, prepare the director's existing reserved builder task
with the actual two treatments and current art assets. Use its explicit spawn_args after the
existing reboard reservation; reuse that builder for later bounded corrections.

```sh
python scripts/daily_production.py --board out/dispatch/storyboard.json --claims out/dispatch/claims.json --state out/dispatch/run_state.json --packet scene-builder --out out/dispatch/builder-packet.json
python scripts/agent_runtime.py --plan --role scene-builder --packet out/dispatch/builder-packet.json --task-name builder --scope "Implement both complete current treatments; verify every narrated subject, action, result and limit, event joins, regional stage and caption clearance" --out out/dispatch/builder-assignment.json
```

The handoff names all linked defects in one list. Run picture_precheck.py before consuming
code or phone review/preview reservations; it invokes the existing cheap gates, retains each
actual output and returns failure if any gate fails. No render, model call or approval occurs.

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
python scripts/picture_precheck.py --board out/dispatch/storyboard.json --claims out/dispatch/claims.json --out out/dispatch/picture-precheck
python scripts/agent_runtime.py --plan --role storyboard-critic --packet out/dispatch/critic-packet.json --task-name critic --scope "Independently identify every source, recognition, action, motion, framing, finish and ending defect in both complete treatments; return one consolidated verdict" --out out/dispatch/critic-assignment.json
python scripts/run_controller.py consume --resource storyboard_critics --note "current board and causal sequence"
```

For current agent-runtime editions, use critic-assignment.json spawn_args. Pre-effective ledgers keep their prior assignment path.

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

## Current modern route

The following ImageGen instructions apply to fresh-story-art-v1 raster boards. For the explicit
Claude authored-story-art-v1 route, read AUTHORED_STORY_ART.md in full and use its two fresh
source groups instead. Before source art exists, bind the actual two complete planned treatment
boards and claims for the initial builder, then reserve reboards before executing its agent_args:

```sh
python scripts/claude_runtime.py authoring-packet --board out/dispatch/storyboard.json --claims out/dispatch/claims.json --out out/dispatch/builder-packet.json
python scripts/claude_runtime.py plan --role scene-builder --packet out/dispatch/builder-packet.json --task-name scene_builder --scope "Author the fresh hero and support and implement both complete treatments on the current sources" --out out/dispatch/builder-assignment.json
python scripts/authored_story_art.py --board out/dispatch/storyboard.json record --state out/dispatch/run_state.json
python scripts/authored_story_art.py --board out/dispatch/storyboard.json verify
```

The initial packet cannot approve a film. Once both groups are recorded, use ordinary
daily_production.py packets, including both treatment files, executed assets, current renderer
closure and guide hashes, followed by claude_runtime.py plan for builder corrections and critic
reviews. Stage the selected source modules through story_art.py stage into the clean release
checkout. Every phone/native/three-scorer gate still judges the actual performed film.

For editions covered by config/modern_film.json, load MODERN_FILM.md and STORY_ART.md in full.
Generate the hero and supporting artwork with built-in ImageGen during this storyboard phase,
before animation and voice. Use story_art.py to charge and record each actual call. Give each
principal generated prop a relevant on-screen job and a finished silhouette, sculpted volume,
coherent light and surface detail. Exactly two complete treatments share this edition's new
assets; they differ in staging, shot ordering and emphasis. Implement the registered modern
route and actual shot/reward timeline. Old templates, fixed old image paths and library boxes
are unavailable as fallback. Validate with modern_film.problems and story_art.py verify, then
inspect the actual full-speed phone sequence. Required engagement or artwork failures use
mandatory completion recovery rather than artistic deferral.

```sh
python scripts/story_art.py --board out/dispatch/storyboard.json verify
python scripts/modern_film.py --board out/dispatch/storyboard.json
```

From the place stage's effective date, the scene's region stands behind the episode (MODERN_FILM.md,
"The region stands behind every current film"). Author the episode with its background open. Draw
the floor, the props and the room's own things, never a full-frame rect. List diagram and document
views as `wall_views` in the episode's registry entry, and labelled comparisons as `wash_views`. Outdoors, wrap a subject standing on the
ground in PlaceSubject with its base row. A story at a plant on the upper coast sets
`place_plate: "gulf-shipchannel"` on its scenes; every other story takes its county's plate. Then
measure that the region shows.

```sh
python scripts/place_check.py --board out/dispatch/storyboard.json --render
```

These gates require actual generated pixels and their prior production charges; a plan-only
record does not pass. Use the reserve and record commands in STORY_ART.md for the two tool calls.


## Narration and picture use one clock

For new production from October 8th, every spoken clause has a narration-picture-v1 binding in board.narration_picture. Write exact clause text, concrete subject_ids, executable action_id, source claim_ids, scene_id, cue_ids and event_ids before voice production. Cover all words and qualifiers once in their original order. The registered episode declares which views actually implement those subjects and actions. A topic match, caption or label cannot replace a pictured causal step.

Before voice exists, use timing_mode authored with an explicit provisional cue plan for the silent two-treatment comparison. These estimated windows approve only planning. After alignment, board_retime.py replaces them with measured_caption_boundaries from the actual captions and acoustic word stream. Timed capture, preship and delivery require those measured inputs and reject an authored clock.

After acoustic alignment, compile every clause window from complete measured caption boundaries and the matched positional word stream. Use modern_film.compile_narration with the actual captions and words. Derive cut handoffs from silence between clauses. Only framing subdivisions inside the same subject/action may use fractions. Renderer performances consume requireNarration on the film-global clock, and retain completed consequences across cuts. Never stretch speech, scale cue times, or proportionally place a different narrated action inside a scene.

Run scripts/modern_film.py with --board, --captions, --words, --script and --claims before timed capture and preship. The gate rejects missing or duplicated clauses, omitted qualifiers, stale timing, wrong condition identity, incompatible renderer views and gaps in matching picture coverage. These checks establish bindings, not audience understanding. Code, phone and final reviewers inspect the actual subject and performed action for every clause. Return narration_picture_observations bound to the exact film, with ordered clauses containing id, pass, exact start_s/end_s and observed. Preserve a wrong or absent picture as a source/comprehension blocker even if provider metadata says pass.

A current clause must remain understandable with its captions covered. Introduce the spoken subject before its clause begins, perform the narrated change while it is heard, and retain the relevant result through the clause end. Distinguish selection, analysis, test condition, observed result and clinical limit. Generic clinical forms, a repeated test picture under an AI-selection line, or the normal condition under a patient-variant line fail this contract.
