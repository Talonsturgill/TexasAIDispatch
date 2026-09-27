# Daily production with a stable quality bar

Effective for editions dated September 28, 2026 onward; config/daily_production.json owns
the date and measurement window. This changes preparation and reuse. The rubric, independent
reviews, source evidence, cinematic coverage, native output, audio and shipment gates still apply.
September 26's shipped film is retained unchanged.

## Select a story that the available pictures can tell

Before writing narration, select one current, verified action with a specific affected person
or group, an observable change and an honest source limit. Inspect the actual source assets.
Keep one director responsible for the whole causal sequence. A local improvement must also
improve that sequence; do not assemble independent scene rewrites into a fragmented film.

config/production_actions.json contains a small starter library with exact shipped-film,
source-board and three audiovisual receipt hashes. Its callable implementation is
video-engine/src/lib/production/ProvenActions.tsx. The daily-actions-v1 route executes it.
The supported actions are residential camera capture, curbside capture/selection, and document
accumulation. Read each action's limits before using it. They are not generic substitutes for
unrelated workflows, real software, named people, literal counts or observed deliveries.

Reuse demonstrated geometry, timing mechanics, lighting and contact. Author the current story,
staging, source bindings and ending. Never recycle a film or inherit its approval. Natural human
performance uses appropriately sourced footage when the available synthetic action cannot
perform it. Label illustrative footage and separate source examples honestly. If the story
needs an unsupported central action, select another sourced angle before voice or rendering.
Develop and review new library mechanisms separately; novelty alone does not justify daily R&D.

## Lock the causal story in the existing board

Add story_contract to storyboard.json, with director_identity and these compact sentences:
opening_question, actor, action, change, affected_people, consequence, source_limit,
closing_answer. The answer must resolve the question using the current evidence.

Its scenes array follows the actual board order exactly. Each row has scene_id, role
(action, mechanism, consequence, evidence, limit or answer), claim_ids and advances.
Explain what the picture adds. Include a human consequence and finish with an answer.
The transitions array covers every adjacent pair with from, to, kind, because and visible_bridge.
Allowed kinds are same-subject, causal-consequence and source-example. A different source
example also needs disclosure, copied exactly into the destination scene's production_disclosure.
The daily renderer displays it. A custom renderer must display that field too.

Every dimensional scene declares production_action from the catalog. The standard route executes
those ids; a custom route must call the actual exported components. Source footage keeps its
existing native-media hash, permission, trimming and evidence contracts. Keep quality_plan and
the source-backed three-image plan; this compact story contract supplies the missing causal links.

The existing independent storyboard critic also returns story_review:
story_sha256, policy_sha256, claims_sha256, verdict, blocking_defects, one_viewing_summary,
opening_to_ending and weakest_transition. It uses its own reviewer_identity, distinct from the
director. Run the digest command below for machine bindings. The critic must describe the
story after one viewing without leaning on the director's explanation. These fields document a
real editorial review; filling the schema is not approval.

Changing narration, order, picture, source evidence or the causal contract invalidates approval
of the whole sequence before another voice call or preview. Derived captions and measured timing
reuse the story review; the exact phone and final film gates still inspect their current bytes.
The voice entry point also compares the actual spoken script with the approved board.

## One normal production cycle

Read numeric targets from config/run_limits.json. The current normal cycle uses an initial
phone animatic, a final timed phone pass and the shortest coherent native hero; one full render;
one three-lens final panel; and one narration take plus its audible soundcheck. A rejected take
is repaired and charged normally. Do not synthesize an unused second option by default.

The silent phone check must prove the contact, action, consequence and framing before narration.
The timed phone check proves measured captions and continuity. The native hero proves surface
finish and sound before the full render. Reuse valid evidence for unchanged inputs. These scopes
cannot be collapsed into one fictional approval or an upscale.

A target overrun triggers diagnosis and a single consolidated correction under the existing
controller. It never lowers quality or ends production. Retain all charges and the frozen
cumulative envelope. After two rejections of one mechanism, use the required independent pivot.
A weakest interval is always reported; only an actual failed criterion requires repair.
Do not spend another verdict on identical bytes for the same lens.

## Compact role handoffs

Use a fresh isolated role task with the generated packet, current brief and referenced files.
Do not copy the director's conversation or old failed boards into every worker. Research still
uses the three required independent assignments; send each only its angle, source scope and
output contract. Validation, the two critic scopes and final judges retain their independence.
The packet carries paths and hashes, the short story, current usage and defect-ledger reference.
Each final lens gets the same current film and its own actual provider receipt.
No transcript, packet or historical receipt substitutes for viewing and listening.

Commands below run through the pinned wrapper:

```sh
bash scripts/run_with_env.sh python scripts/daily_production.py --catalog-check
bash scripts/run_with_env.sh python scripts/daily_production.py --board out/dispatch/storyboard.json --digest
bash scripts/run_with_env.sh python scripts/daily_production.py --board out/dispatch/storyboard.json --claims out/dispatch/claims.json --state out/dispatch/run_state.json --packet storyboard-critic --out out/dispatch/critic-packet.json
bash scripts/run_with_env.sh python scripts/daily_production.py --board out/dispatch/storyboard.json --claims out/dispatch/claims.json
bash scripts/run_with_env.sh python scripts/daily_production.py --board out/dispatch/storyboard.json --claims out/dispatch/claims.json --state out/dispatch/run_state.json --packet picture --out out/dispatch/picture-packet.json
bash scripts/run_with_env.sh python scripts/daily_production.py --scoreboard --state out/dispatch/run_state.json --out out/dispatch/daily-production-scoreboard.json
```

Use packet roles validator, storyboard-critic, vo-director, picture, story and sound.
Missing current film, attention player, feed composite or role receipt blocks a final packet.
No work is reserved by packet generation; reserve each actual role or render through the controller.

## Measure the next five shipped editions

Generate the scoreboard at wake, after each panel, and at closure. It reports score, first-panel
pass, renders, previews, narration calls, audiovisual reviews, provider token telemetry, elapsed
time and target overruns. Unfinished editions remain visible; duplicate archive/current states
resolve to the latest state. The window ends after five shipments, not five attempts.

Provider tokens exclude Codex conversation and worker usage. Account tokens remain explicitly
unknown in this report; do not label them total spend. Use the host usage snapshot separately
when available. Five films must retain the quality bar, show understandable one-viewing stories,
ship on their scheduled days and use fewer production iterations before claiming daily
reliability. Tooling tests and the September 26 release alone cannot establish that result.
