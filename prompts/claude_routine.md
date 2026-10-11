# Texas AI Dispatch on Claude

Owner directive, October 9th, 2026. This is the Claude host entry point. Read the current
`prompts/dispatch_routine.md` and execute its five phases in full, loading each phase and its
required contracts when entering it. This entry point replaces only the host routing, unavailable
ImageGen service and local workspace bootstrap. Every source, rights, action, modern film, audio,
caption, independent scoring, native rendering and shipment requirement remains in force.

## One outcome

Create a great fresh Texas film and ship it. Continue through the controller's mandatory recovery
until `finish --result shipped` accepts current release evidence, canonical phone playback and a
correctly addressed, read-back unsent Gmail draft. Verify its durable public-safe archive too.
Never send email or post socially. A cloud session marked successful is not shipment evidence.
Never fabricate a review, replace a rejected verdict, discard charges, or loosen an integrity gate.

The owner explicitly requested Sonnet as director and original authored graphics instead of the
built-in image service that Claude does not provide. Apply `config/claude_runtime.json` to newly
planned Claude editions. Do not retrofit this policy into historical or unfinished frozen runs.
Historical October 8th and October 9th films keep their original exact bytes and evidence.

## Wake and safe edition selection

Use a clean current `origin/main` checkout of `Talonsturgill/TexasAIDispatch`, alongside
`Talonsturgill/TexasAIDocket`. Preserve any unrelated work. Read `CLAUDE.md` and the existing
worklog. Cloud worklogs belong in `out/dispatch/WORKLOG.md`; protected settings are edited through
the repository's bootstrap tooling, never by requesting a daily approval.

Run every Dispatch shell command through `bash scripts/run_with_env.sh`. In a worktree explicitly
`cd` into that worktree inside the wrapped shell. Configure the owner's Git identity from
`CLAUDE.md`; never append assistant attribution. Required bindings come from the routine's
existing environment, never source files or printed secrets. Validate voice, full FFmpeg/FFprobe,
fonts, locked dependencies, managed browser, audiovisual provider and the connected Gmail profile
before any paid production work. Install only missing or changed pinned dependencies. Local
workspace housekeeping is used when available. Cloud uses scripts/dispatch_housekeeping.py with
the same protection rules and its actual two checkout paths; never delete active or unrelated work.

In a fresh Linux cloud checkout run the idempotent setup, then re-enter the wrapper so its
external cache is active. The first command installs only absent or changed pinned tools;
the second actually proves voice/alignment and render access before reservations:

```sh
bash scripts/run_with_env.sh python3 scripts/cloud_bootstrap.py --install
bash scripts/run_with_env.sh python scripts/cloud_bootstrap.py
bash scripts/run_with_env.sh python scripts/claude_contract_check.py
```

Resolve the actual sibling checkout paths and their shared workspace parent. Run the versioned
housekeeping helper at startup and after the verified shipped archive:

```sh
bash scripts/run_with_env.sh python scripts/dispatch_housekeeping.py --workspace <shared-parent> --dispatch-repo <actual-dispatch-checkout> --docket-repo <actual-docket-checkout> --apply --fetch --summary
```

Before every native render, calculate scripts/native_headroom.py on the current board, then repeat
that housekeeping command with --require-headroom --min-free-gib set to its required_free_gib.
Retain at least two completed packages. Missing process inspection or unverifiable archives never
authorize cleanup; recover the actual capacity condition through the controller.

Read knowledge/craft/AUTHORED_STORY_ART.md and config/authored_story_art.json during the
picture phase. Use its actual record, verify and stage commands. There is no ImageGen call
in this lane and no fabricated image-generation charge.

Run `run_controller.py pending` and resume the oldest unfinished production before making a new
edition. A cloud container is reclaimed, so `pending` alone sees only worktrees that still exist.
Also run `python scripts/claude_checkpoint.py discover`. Select the OLDEST unfinished edition by its run identity and creation time
(`claude_checkpoint.py discover --oldest-unfinished`, never the first row of the newest-save-first list)
and resume its existing ledger. It is restored
with `python scripts/claude_checkpoint.py restore --run-id <id> --dest <new empty directory>`. That
creates an isolated checkout of the recorded source commit (the complete committed renderer, art and
public closure), overlays the verified scratch outputs and uncommitted source, and rebuilds the same
ledger, frozen envelope, charges, failed reviews and paid outputs with its paths moved. It never
touches another checkout or an existing ledger, has no force option, and refuses a finished edition.
Run `cloud_bootstrap.py --install` there for node_modules, then resume. Never initialise a second
ledger for an edition that has a checkpoint.

Before authorizing capture in a restored or nested worktree, establish a real clean Docket
checkout at `<dispatch-checkout-parent>/TexasAIDocket`, starting at current origin/main. An owned
isolated clone or a suitable registered worktree satisfies this requirement.
The capture helper runs housekeeping against that sibling and their shared parent. A symlink to
the primary Docket checkout fails the bounded-workspace check. Preserve the primary checkout and
all unrelated or dirty work; use this owned sibling for the narrow Dispatch feed release. Retain
any failed path inspection and its charged reservation, then verify the normal housekeeping gate.

Derive today's calendar date in the schedule timezone from config/claude_runtime.json;
the cloud host's UTC date does not select an Eastern edition. A terminal shipped run is immutable.
The first owner-authorized migration test uses a
fresh current story and an intentional distinct run identity `<today>-claude-pilot`, including its
own branch, scratch, permanent media, feed identity, draft and archive. The board's calendar date
is still today. Run this migration pilot only if no prior Claude pilot has accepted `shipped`
status and a verified durable archive in `runs/`. Resume an unfinished pilot instead of creating
another. After that one pilot is archived, every scheduled invocation uses normal daily production.
Normal scheduled production uses today's date. If today's scheduled film is
already shipped, verify that shipment and do not manufacture another ordinary edition.

## Durable checkpoints and effective effort

`out/` is gitignored and dies with the container. For an edition marked by
`out/dispatch/claude-host.json`, every controller ledger write is mirrored to
`claude/checkpoint/<run-id>` before the writer returns, so each reservation is durable before its
paid call is dispatched. After each paid call returns and its output is on disk, the same mirror
runs again through the next ledger write, and `python scripts/claude_checkpoint.py save --note <what>`
covers outputs written without one. Prefer `claude_checkpoint.py guard --note <what> -- <paid command>`,
which makes state durable, runs the command and makes its outputs durable, and exits 75 when it can't.
A checkpoint that cannot be made after storage and transport recovery writes
`out/dispatch/checkpoint-unbacked.json`, raises, and blocks every new reservation until
`claude_checkpoint.py recover` succeeds. Never continue paid work on an unbacked ledger.

The checkpoint keeps the sanitized ledger, authored source, claims, board, voice takes, alignment,
review responses, failed images and every receipt. It skips only known rebuildable directories
(frames, tmp, cache). It leaves out Gmail, routing and credential material by any path component or
data structure, redacts shipped Gmail identifiers and local paths from the ledger, refuses to save when
a credential value appears, and refuses any save that would lower usage, limits or increments, change the
frozen envelope or alter the earlier event history. A file too large to retain fails the save visibly.
After `finish --result shipped` and the metadata archive, save once more so the checkpoint reads finished.

At wake also record `python scripts/claude_contract_check.py --effective out/dispatch/effective-effort.json`.
It reads the root session's host effort, any `CLAUDE_CODE_EFFORT_LEVEL` override, and each leaf's
frontmatter. Fail on a mismatch; never set a global effort override.

## Claude-native worker routing

The director is `claude-sonnet-5-5` at medium effort. Read the exact role map from
`config/claude_runtime.json`; do not use Codex `spawn_args` in Claude's Agent tool. Use the existing
role roster, adding only the named `scene-builder` leaf definition for the existing builder task.
Pin exact model ids and supported effort in versioned agent frontmatter and project settings.
The owner refined the route on October 9th: scene-builder, storyboard-critic and validator use
Opus 5.5 at high effort. These calls own the authored picture, its independent critique and source
truth. Research and voice direction remain Haiku high; three separate final scorers remain
Sonnet medium. The director stays Sonnet medium. Measure rework and quality before claiming that
the stronger creative workers reduced total run cost.
Spawn `scene-builder` for the existing reserved two-treatment builder assignment, using
`.claude/agents/scene-builder.md` and `prompts/roles/scene-builder.md`. Reuse it for corrections.
Do not globally force `CLAUDE_CODE_EFFORT_LEVEL` to medium, because that overrides the leaf's high
effort. Detect and report any inherited override and resolve it before worker execution.

Give each worker a compact current packet with actual input paths and SHA256 bindings, the
relevant phase, full current guide text and hashes, role brief and exact rubric. Isolate its
conversation. Every assignment says to do the work itself and launch no additional agents.
Reserve its actual controller resource before starting. Reuse the builder and critic for bounded
follow-ups, consolidate linked defects and keep one render owner. Three final scorer responses
remain distinct identities and an atomic charged panel on the same finished film. The director
cannot count self-review as independence. Provider recovery is used only after actual observed
host unavailability, under the existing recovery policy.

## Fresh authored picture lane

Follow Alaska's strongest production methods in `Talonsturgill/alaska-ai-weekly`: recognizable
story-specific cast and equipment, motivated depth, physical actions and consequences, sound
connected to the picture, varied useful framing, early earned changes and a performed ending.
Inspect the current source and shipped film; never copy Alaska's history, dedupe ledger, footage,
place or character defaults. Texas place, source-bound actions and house voice remain Texas.

Create exactly two fresh relevant authored asset groups, hero and support, shared by exactly two
complete visual treatments. Build finished recognizable forms with coherent perspective, regional
palette, motivated lighting, surface detail and believable contact. Original SVG, React/CSS-depth
and Three.js through the current Remotion engine are allowed. Do not imitate ImageGen metadata or
claim an external generation happened. Record actual creation time, exact source module bytes,
edition identity, source claim hashes, declared exports and each performed on-screen use. Bind the
complete renderer dependency closure. Changed shared parts do not become fresh artwork by renaming
them. A reused prior-edition hero, unused decorative asset, generic boxes, slideshow or legacy
whole-episode rescue fails the new lane.

Implement the authored lane as a dated, explicit Claude opt-in, retaining the original raster
ImageGen policy and all historical tests. Its mechanical gate must reject missing/stale modules,
unrelated sources, absent current action use, repeated old asset identities and unresolved imports.
The existing independent phone, native hero and exact-film reviews judge the actual pixels under
all seven modern observations. Mechanically correct bindings do not establish visual quality.
Retain the active `directed-film-v2` route and complete source/event/clause-bound shot timeline.

Prove both complete silent phone treatments before voice, then measured timed phone, native hero
with sound, final cut, all audiovisual lenses, panel and delivery. Before native renders calculate
the complete uncompressed PNG frame set plus retained-output reserve with `native_headroom.py`.
Recover only eligible storage if the actual plan lacks room. Never lower native 1080x1920 capture,
PNG, CRF16 or mandatory reviews. Reserve every actual attempt before execution. Fund the complete
remaining review and delivery path before correcting a failed cut. Keep the frozen envelope,
cumulative usage, individual authorized increments and exact failure evidence.

For an independently rejected mandatory code defect before a film exists, use the merged
code-evidence amendment in knowledge/craft/AUTONOMOUS_COMPLETION.md. Keep the original failed
report and before-files. Bind a new plan with scripts/autonomous_completion.py
--prepare-code-plan <original-plan> --claims <claims> --output <new-plan>, then run the controller's
production-budget and completion-capacity on that new plan before beginning its correction.
This preserves the original frozen adoption and adds only exact conservative deficits.
Code evidence cannot approve pixels or replace either complete phone treatment or final reviews.
Do not request a daily decision at the internal critic ceiling.

After an independent passing code review, stop optional editing. If contract failures consumed
the funded reviews, use the actual new independent passing report in a finish-current plan with
no changed_inputs. The adopted code route protects two pending phone critics. Run production-budget
and completion-capacity on that new finish plan, retaining every prior failure, grant and charge.
Do not retry the original failure's grant or replace a film verdict with code approval.

## Efficiency and actual usage

Final Read-only scorers use the complete exact-film motion-image sequence documented in
prompts/phases/04-review.md. Build and verify it before creating their three compact packets.
These film-decoded images provide chronological visual access; retain separate actual
audiovisual receipts for movement and sound. Never pretend that Read plays an MP4 or hears it.
Preserve prior unknown access findings, fund the complete path and reserve the new atomic panel
before a content resume. Do not repeatedly purchase schema-only replies for missing media access.

If the already charged exact-phone Opus worker exceeds one hour and two supported host
observations at least five minutes apart show unchanged tool/token totals and no error, load
config/autonomous_completion_handback_v1.json. Preserve the original native status evidence,
task ID and reservation. Use scripts/review_handback.py to bind that receipt, the unchanged
approved board, claims, both exact films, original packet and output contract to the retained
finish-current plan. Normal completion-capacity may grant exactly one separately recorded
critic increment once per run, only when every other remaining resource is funded. This is
same-worker handback capacity, never host unavailability or approval. Reserve the resumed
critic call before director TaskStop, wait for its stopped run to exit, then SendMessage to
that exact ID for the complete bounded report using its original context and prompt cache.
Keep Opus High, every required guide and observation, the final timed critic and all release
gates. Do not use manual UI cancellation, a new Agent, another provider or a new correction.

Keep phase loading, compact assignments, exact-byte audiovisual caching including failures, and
the current provider media deduplication. Run cheap mechanical checks before paid review. Group
dependent production commands into one exit-code-checked job with retained logs and a compact
summary, stopping at the first mandatory failure. Use exact job handles and completion markers;
avoid repeated full-context polling. Use supported nonblocking worker status or waits of at most
60 seconds; do not block steering or completed handbacks with long Bash sleep loops. Reuse the
same worker for output-format corrections with exact gate errors. Give it the current report
contract and computed bindings before execution; use bounded gate-function excerpts for missing
format details instead of rereading entire controller modules. Every required guide, source,
exact film and independent observation stays in scope. Continue independent work while a render
runs. Never end the turn with a promise to perform the next phase.

If the critic's own handback admits unread mandatory guides or incomplete boards, retain it and
hold capture. Use the review-coverage amendment in AUTONOMOUS_COMPLETION.md on the unchanged
production inputs. Fund the complete path, charge the resumed review and SendMessage to the same
Opus High worker for full coverage. This is content review, not a free formatting correction or
host unavailability. Never request a policy decision at that internal ceiling.
Prepare its evidence-bound plan with `python scripts/review_coverage.py --state out/dispatch/run_state.json --receipt <actual-receipt> --report <original-handback> --original-packet <original-packet> --current-packet <current-packet> --output <new-plan>`
through scripts/run_with_env.sh, then use the documented production-budget and completion-capacity
commands before reserving the resumed review.

A complete code critic can also prove a nondeferrable modern motion, surface finish, pacing or
ending-artistry failure before any film exists. For an actual renderer-only rejection, retain
the report and baseline and run `python scripts/modern_code_recovery.py --state out/dispatch/run_state.json --plan <original-proposal> --packet <current-complete-code-packet> --output <new-bound-plan>`
through scripts/run_with_env.sh. Follow AUTONOMOUS_COMPLETION.md for the separate pinned modern
code adoption, complete-path funding, recurrence pivot when required, precharged Opus correction,
strict derived board rebinds and both fresh phone reviews. Do not invent a board story edit,
relabel the reviewer or request an owner decision at this internal admission boundary.

If an actual charged same-worker recurrence pivot returns REVISE before that funded correction,
retain its exact handback and rejected proposal. Use `python scripts/pivot_recovery.py --state out/dispatch/run_state.json --receipt <actual-receipt> --report <retained-pivot-rejection> --rejected-proposal <reviewed-proposal> --revised-plan <bound-modern-plan> --output <new-recovery-plan>`
through scripts/run_with_env.sh and follow the receipt and funding procedure in
AUTONOMOUS_COMPLETION.md. Charge the next same Opus High pivot review before SendMessage.
Its independent source-backed PASS remains required before begin-repair or any production edit.

Use compact frame strips for director decisions and native crops when detail decides the result.
Independent reviewers still receive the exact current film and every required unique media byte.
Stop optional polish at the configured creative boundary; mandatory failures recover through the
existing source-backed pivot. Stop engineering unrelated to this film after the reserved boundary.
Measure actual Claude input, cache creation/read and output tokens by phase and worker, external
provider usage separately, retries, scores, first-panel result, runtime and accepted shipment.
Deduplicate transcript content blocks by API message identity. Never equate list prices or account
usage percentages with the actual bill, and never claim a tenfold saving or quality improvement
without measured comparable evidence. Refresh the separate next-five-edition observations.
At entry to each phase run `python scripts/claude_runtime.py phase <phase-name>`. These private
UTC markers establish observed phase timing; missing transcript fields stay unknown.

## Initial migration implementation and end-to-end test

The first Claude invocation is authorized to finish this migration before production. If the
Claude host adapter is not implemented yet, inspect the current Alaska pipeline and implement the
smallest complete adapter in this repository: supported leaf model/effort binding, idempotent cloud
environment setup, controller-compatible compact packets, fresh authored art receipts and gates,
renderer support, usage accounting, and a contract check. Wire the adapter into the master, phase
files, builder/reviewer briefs and required CI. Do not remove old policies or tests to make it pass.
Required historical isolation must be tested with the already-shipped October 8th/9th evidence.
Test negative authored inputs and a valid actual render through the existing narrow gates.

Keep engineering telemetry separate from the new production ledger. Commit only intended public
source and instructions; push, open a ready PR, obtain exact-head required CI and merge, then verify
matching-main CI. The daily saved prompt remains a thin current-main pointer. Once implementation
is merged, perform the still-unfinished pilot in this same actual Sonnet cloud run; if its accepted
shipment and durable archive already exist, proceed with normal daily production instead.
Do not stop after the engineering
PR, a preview, a passing panel or an uploaded file. Complete the original five-phase master through
verified accepted shipment, the unsent draft and durable archive. Report the film, scores, actual
usage, delivery state and any retained failed attempts concisely.

## Canonical phone playback on the cloud host

A cloud session has no desktop for Computer Use. Use `scripts/phone_playback.py`, real Chromium UI
automation at 390x844 with touch input, against the published canonical URL:

```sh
python scripts/phone_playback.py --edition-id <id> --film-sha256 <reviewed master sha256> --out-dir out/dispatch/phone
```

It taps the page's own Play control (pause, then play again), taps "tap for sound", samples
currentSrc, currentTime, readyState, paused, muted and error while the clock runs, records whether
the page received trusted input events, hashes the published master and phone bytes, and saves
hashed screenshots. Its `tool` field says browser automation, not Computer Use. Put its
`phone_playback.json` in the shipment manifest unchanged. `shipment_check.py` applies every
historical assertion plus `claude_playback_problems`. The Codex Computer Use route and its evidence
format stay valid. Never fabricate observations. If the page, media or browser fails, production
stays active and the real failure is recorded.

## Capture authorization

For a multi-repository cloud session, register the capture hook at its actual primary workspace
before capture. After restoring an unfinished production checkout, run
`python scripts/bootstrap_claude_hooks.py --workspace /home/user` through the wrapper from that
checkout (use the observed primary workspace if it differs). The helper preserves model, effort,
environment, permissions and unrelated hooks. It replaces only its own earlier registration and
points the handler at the active checkout, whose ledger and assets the handler verifies. This is
registration, never proof that the host loaded it and never capture authorization. Keep the actual
native denial of the harmless capture-form probe before a real capture. If the host has not loaded
the registration, retain that observation and restart from the durable checkpoint using the supported
routine launch; do not replay synthetic PreToolUse events as a substitute or weaken auto mode.
If the host denies registration, preserve the denial and apply the same versioned registration in
the authorized environment setup before the next supported launch rather than retrying a denied edit.

Every native capture or render command (Remotion stills and renders, preflight, opening compare, cinema proof,
render_dispatch) is denied by the PreToolUse hook `scripts/capture_guard.py hook` unless the director has
issued a current authorization for that exact command. Reserve a fresh render with the controller first
(a late-accounting charge never counts), then name the exact boards and the exact wrapped commands:

```sh
python scripts/capture_guard.py authorize --state out/dispatch/run_state.json --board out/dispatch/opening-a.json --command "bash scripts/run_with_env.sh python scripts/opening_compare.py --root out/dispatch --state out/dispatch/run_state.json"
```

It writes `out/dispatch/capture-authorization.json` only from facts: an unused fresh charged render reservation,
passed native headroom, portable housekeeping run with `--apply --fetch --summary --require-headroom` and the
computed minimum (its receipt is kept), and genuine recorded authored receipts. The authorization is bound to the
exact board, renderer and art hashes and to the listed commands. The hook rechecks them and current headroom,
denies unreadable, unresolved or unrelated --props and --board inputs and placeholder art, and consumes each
authorized command once, so the next capture needs a new reservation. Builders never capture. Before the first
real capture of a run, prove the hook is active with a harmless capture-form command that must be denied,
and keep that denial as evidence.
