# Texas AI Dispatch: daily master routine

From October 3rd, 2026, read knowledge/craft/AUTONOMOUS_COMPLETION.md and config/autonomous_completion.json before budgeting. Internal resource ceilings and host capacity errors require autonomous recovery through the controller and configured independent provider. Keep working until accepted shipment; preserve original envelope, cumulative charges, actual failures and every retained quality and delivery gate.

This is the operational authority behind prompts/ROUTINE_PROMPT.txt. Ship one current,
source-grounded miniature documentary. A production run completes only as shipped.
A render, checkpoint, passing panel or PR alone does not complete the run.

## Read once, then load the current phase

At wake read CLAUDE.md, the current worklog and controller checkpoint, plus:
- knowledge/craft/DAILY_PRODUCTION.md and config/daily_production.json
- knowledge/craft/QUALITY_CONTRACT.md and config/quality_contract.json
- knowledge/craft/DOCUMENTARY_ATTENTION.md and config/documentary.json
- knowledge/craft/CINEMATIC_PRODUCTION.md and config/cinematic_production.json
- knowledge/craft/CREATIVE_DIRECTION.md and config/creative_production.json (apply its effective date)
- knowledge/craft/ART_DIRECTION.md and config/art_direction.json for newly planned editions from October 7th or an explicit profile opt-in

Read each phase file in full when entering that phase. These files are part of this routine:
1. prompts/phases/01-research.md
2. prompts/phases/02-picture.md
3. prompts/phases/03-audio-render.md
4. prompts/phases/04-review.md
5. prompts/phases/05-release.md

For newly planned editions from October 3rd, 2026, phases 1 to 4 apply
knowledge/craft/visual-storytelling/viewer-plan.md. Read that method and the selector in full
when choosing the story, then the selected approach dossier when boarding. For a news report
also read knowledge/craft/visual-storytelling/news-reporting.md. Choose the format and evidence
order from the inspected source and assets. Record the focus, likely false inference and each
picture-to-word connection in the existing fields. Current role packets bind the relevant
guides; independent-provider recovery includes their actual text. These guides teach decisions
under the existing rubric and add no role, paid attempt, approval field or resource grant.

For a repair, also read prompts/phases/repair.md. Load prompts/phases/tooling.md only for
a relevant implementation defect. Load the specific Texas region, application, culture or
craft reference needed for the current decision. Search GATE_LESSONS.md for the affected gate
and read those entries when diagnosing or changing it. Historical explanations live in
knowledge/history/dispatch_routine_before_runtime_efficiency.md; they are evidence, not
another active routine. Do not load the full historical archive into every daily task or worker.

## Nonnegotiable production contract

- Execute the current art profile in the actual scene. Director chooses the look and two
  treatments; the existing builder reads prompts/roles/scene-builder.md and implements them;
  the existing independent critic watches before reading the rationale. Keep three final
  scorers and the saved primary model. Calibrate with cinematic_reference_bank.json without
  reusing its footage. Phase 5 records five-edition outcomes and the next bounded weekly fix.

- Follow the story-specific visual policy in DAILY_PRODUCTION.md and config/story_visuals.json. Never reuse the previous shipped edition's b-roll. Search once within its limits for the actual site, people, equipment, workflow or documents; use relevant stills or omit an unhelpful insert when footage is unavailable.

- The current source must support a visible action, affected people, an observable consequence,
  three memorable pictures and an honest limit. The ending answers the opening question.
  The starter action catalog is not exhaustive. Use the bounded source-backed admission in
  DAILY_PRODUCTION.md when a fresh mechanism is needed, then obtain current rendered proof.
- Use the fixed quality contract and the rubric read directly from config/dispatch_rubric.yaml.
  Never restate its threshold. A passing film moves to release; do not add optional polish.
- Apply the dated medium policy. From September 29 choose footage, stills, source excerpts,
  diagrams or 3D for their actual story value, compare exactly two cheap openings, and direct
  performance, sound and cuts together under CREATIVE_DIRECTION.md. Preserve documentary
  pacing and every current proof gate. Decorative movement does not earn an action beat.
- Prove contact, action, consequence and framing in the actual phone animatic. Then approve the
  shortest coherent native hero with sound before rendering the full film. Use native
  1080x1920 PNG capture and H.264 CRF 16 for the hero and final film.
- Obtain actual audiovisual provider evidence for the hero and all three final lenses.
  Independent identities review the same finished bytes. A transcript or code plan cannot
  substitute for watching or listening. Never invent or edit provider verdicts.
- Burn full spoken wording into the shared compact, wide, at-most-two-line caption band.
  Use measured alignment. Inspect the actual phone film and feed overlays; protect the action.
- Scan new audience-facing prose case-insensitively with the workspace's whole-word ban before
  synthesis and delivery. Preserve source evidence, URLs, identifiers and historical artifacts.
- Only verified shipment completes production: green exact-head CI and merges in both lanes,
  matching deployment, permanent reviewed media, canonical phone playback through Computer Use,
  and the correctly addressed, read-back Gmail DRAFT with no SENT label. Never send email or
  post to social accounts. Never use an override or weaken a gate to close a run.

## Explicit worker routing

For newly planned editions from October 10th, 2026 read AGENTS.md,
knowledge/craft/AGENT_RUNTIME.md and config/agent_runtime.json at wake. Generate the current
role packet and scripts/agent_runtime.py --plan before its existing reservation. Use the
returned explicit model, reasoning_effort and fork_turns none. Full-history forks inherit the
director model and cannot execute this role map. This changes no number of roles or calls.
Reuse the existing builder/critic for compact follow-ups, retain all actual failures, and
collect linked defects in one correction. The saved director model and schedule stay intact.
Phase 5 measures actual next-five-edition outcomes; cost and quality targets remain unproven.

## Environment and ownership

Run every Dispatch command through bash scripts/run_with_env.sh. Each shell needs the wrapper.
For an isolated worktree, explicitly change into that worktree inside the wrapped shell.
Never open, print, copy, log or commit the private credential. Use env_check to establish access.
Commands in phase files use repository-relative paths and inherit this wrapper requirement.

The normal invocation is production. Dry-run is only an explicitly requested rehearsal.
Preserve unrelated changes. Fetch safely before choosing a clean checkout containing the
current cinematic production and controller code. Never reset another branch or its work.

The agent briefs in .claude/agents are role contracts. Read the relevant brief before each
isolated assignment. Use compact role packets, not the director's full conversation. Keep one
director, one render owner and one consolidated defect list. A host model's capacity error is
a transport failure, not a creative verdict or a terminal shipment blocker. On actual worker
unavailability read prompts/phases/review-availability.md and complete the same independent
role through its charged recovery route. Never represent director self-review as independent.

## Wake and resume

Inspect workspace status and the owning branch, then run:

```sh
bash scripts/run_with_env.sh git status --short --branch
bash scripts/run_with_env.sh git fetch origin main
bash scripts/run_with_env.sh python scripts/run_controller.py pending
```

Resume the returned active edition and its ledger before starting a new date. Confirm its
writer is not already active in another task. Merge fetched main into the clean owned edition
branch, preserving its assets and charges. If no edition is active, create or resume the
dated claude/dispatch-<date> branch from current main. Never substitute a new budget.

Install pinned dependencies only when absent or the lockfile changed. Read retained Remotion
guidance; consult official documentation only for a version change or unresolved API question.
Run environment validation before research or any paid reservation:

```sh
bash scripts/run_with_env.sh python scripts/env_check.py --require-voice
bash scripts/run_with_env.sh python scripts/engine_lint.py
bash scripts/run_with_env.sh python scripts/staging_check.py
bash scripts/run_with_env.sh python scripts/composition_check.py
bash scripts/run_with_env.sh python scripts/wiring_check.py
bash scripts/run_with_env.sh bash -c 'cd video-engine && npx tsc --noEmit'
```

Initialize once, only when no state exists, then adopt the nonrenewable cumulative envelope:

```sh
bash scripts/run_with_env.sh python scripts/run_controller.py init --run-id <date> --mode production
bash scripts/run_with_env.sh python scripts/repair_guard.py --state out/dispatch/run_state.json --adopt
bash scripts/run_with_env.sh python scripts/run_controller.py checkpoint
bash scripts/run_with_env.sh python scripts/daily_production.py --catalog-check
bash scripts/run_with_env.sh python scripts/daily_production.py --scoreboard --state out/dispatch/run_state.json --out out/dispatch/daily-production-scoreboard.json
```

Use run_controller.py phase --name <phase> at each transition. Read numeric targets and limits
from config/run_limits.json and the live ledger. Reserve every agent, paid call and render
before it starts. Targets diagnose extra work; they are neither approval nor a closure rule.
Cumulative allowances cannot be repeatedly renewed. Keep all failed attempts charged.
Follow DAILY_PRODUCTION.md's reserved path to shipment. Before structural repair run the
production-budget precheck. From September 29th, config/creative_release.json governs finite
creative editing. After its round cap or protected-completion boundary, finish the best reviewed
cut through the evidence-bound creative release route, without an approval request. Preserve
actual artistic scores/rejections and every source, rights, technical and shipment check.
A budget boundary leaves an unfinished edition, never a substitute completion state.

## Timing and evidence reuse

The board is the actual renderer props. Author event timing in at_s_authored; at_s is derived
and board_retime overwrites it. Captions derive from the final mixed audio and its measured
voice stem. Never hand-shift timing, stretch speech or privately duplicate the board in code.

Reuse unchanged research, claims, narration and alignment. Hero reuse is dependency-bound:
cinema_proof validates the current phone approval and all proof gates, then reuses only
unchanged passage pictures, audible PCM and stage samples. The complete proof is rebound to
the current board, engine and mix. Unknown or edited renderers use conservative full bindings.
Never manually copy an old approval onto changed media. Exact-byte audiovisual caching retains
both approvals and rejections; another request for the same bytes and lens is not a repair.

Use synchronous command handles or exact job identifiers. Never leave duplicate gates running,
poll a command-line pattern that matches its own waiter, or hide commit output. Diagnose a
specific failure before repeating a render. After all gates pass, stop editing and ship.

For editions from September 30, use the treatment recovery in CREATIVE_DIRECTION.md.
Establish a credible action-led treatment before narration, compare two genuinely different
visual approaches in the existing batch, and distinguish independently classified technical
repairs from creative rounds. Keep current budgets and all shipment proof. Do not use the
finite release rule to defer a held-slide structural failure or failed dominant action.

## Mandatory modern film and fresh storyboard art

Owner instructions from October 7th, effective for newly planned editions from October 8th,
or explicit film_direction opt-in. In Phase 2 read knowledge/craft/MODERN_FILM.md,
knowledge/craft/STORY_ART.md, config/modern_film.json, config/story_art.json and the active
completion policy. Generate two new relevant ImageGen images during storyboarding: a
finished hero plus matching supporting props or purposeful environment. Reserve each actual
attempt with story_art.py before the built-in tool call, inspect and record original output,
then use the new assets in the edition's two complete treatments. Preserve actual failed
artwork and charges. Native overlays own exact wording and facts; generated art is disclosed.

The existing builder authors a registered directed-film-v2 episode and executed shot timeline.
Strong opening image, new visual information, useful framing variety, performed source-backed
turn and answered closing picture are required. No legacy template, generic box stage,
prior-edition generated hero or slideshow rescue can satisfy current production. Before voice,
prove both complete phone treatments using the actual fresh assets. Review the actual pixels,
not palette declarations or a polished director explanation.

The existing critic and three separate scorers receive actual guide text and hashes and return
exact-film timed modern_observations. These are mandatory observations under the unchanged
rubric and original independent review path, not an extra panel. Current pacing, motion,
surface finish and ending failures cannot use bounded artistic deferral. At a capacity boundary,
fund the complete remaining path including necessary fresh art through autonomous completion_v2,
preserving the original frozen envelope and every actual failed attempt. Optional engineering
and extra polish stop; mandatory failures continue through the retained source-backed pivot.
Preserve the saved primary model, schedule and all shipment gates.
