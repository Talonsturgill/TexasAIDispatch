# Texas AI Dispatch: daily master routine

This is the operational authority behind prompts/ROUTINE_PROMPT.txt. Ship one current,
source-grounded miniature documentary. A production run completes only as shipped.
A render, checkpoint, passing panel or PR alone does not complete the run.

## Read once, then load the current phase

At wake read CLAUDE.md, the current worklog and controller checkpoint, plus:
- knowledge/craft/DAILY_PRODUCTION.md and config/daily_production.json
- knowledge/craft/QUALITY_CONTRACT.md and config/quality_contract.json
- knowledge/craft/DOCUMENTARY_ATTENTION.md and config/documentary.json
- knowledge/craft/CINEMATIC_PRODUCTION.md and config/cinematic_production.json

Read each phase file in full when entering that phase. These files are part of this routine:
1. prompts/phases/01-research.md
2. prompts/phases/02-picture.md
3. prompts/phases/03-audio-render.md
4. prompts/phases/04-review.md
5. prompts/phases/05-release.md

For a repair, also read prompts/phases/repair.md. Load prompts/phases/tooling.md only for
a relevant implementation defect. Load the specific Texas region, application, culture or
craft reference needed for the current decision. Search GATE_LESSONS.md for the affected gate
and read those entries when diagnosing or changing it. Historical explanations live in
knowledge/history/dispatch_routine_before_runtime_efficiency.md; they are evidence, not
another active routine. Do not load the full historical archive into every daily task or worker.

## Nonnegotiable production contract

- Follow the story-specific visual policy in DAILY_PRODUCTION.md and config/story_visuals.json. Never reuse the previous shipped edition's b-roll. Search once within its limits for the actual site, people, equipment, workflow or documents; use relevant stills or omit an unhelpful insert when footage is unavailable.

- The current source must support a visible action, affected people, an observable consequence,
  three memorable pictures and an honest limit. The ending answers the opening question.
  The starter action catalog is not exhaustive. Use the bounded source-backed admission in
  DAILY_PRODUCTION.md when a fresh mechanism is needed, then obtain current rendered proof.
- Use the fixed quality contract and the rubric read directly from config/dispatch_rubric.yaml.
  Never restate its threshold. A passing film moves to release; do not add optional polish.
- Use CinematicStage for the opening and required runtime coverage. Preserve the documentary
  pacing limits. Camera drift, changing text and incidental movement do not earn an action beat.
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
director, one render owner and one consolidated defect list. If isolated workers are genuinely
unavailable, record that access limitation; do not represent a self-review as independent.

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
production-budget precheck. Avoid repeated approval requests and unchanged-blocker spending.
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
