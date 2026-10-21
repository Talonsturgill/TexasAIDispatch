# Merge, publish, verify and close

Read knowledge/craft/SHIPMENT_CONTRACT.md and the current cross-repository ownership contract.
Only publishable production enters delivery. On a restored publishing edition, first inspect
the existing exact film, controller, published Dispatch package, Docket branch/PR and remote
verification executions. Resume the first incomplete delivery step. Reuse unchanged reviewed
media and completed checks; do not repeat production, regenerate a candidate already under
verification, or start another suite because the original host stopped. For the retained
October 19th edition, also read prompts/recovery/2026-10-19-release.md from current main.
For an edition not yet packaged, run the program rather than reproducing its ledger,
freshness, copy and commit steps manually:

```sh
python scripts/validation_check.py --validation out/dispatch/validation.json --claims out/dispatch/claims.json --board out/dispatch/storyboard.json
bash scripts/deliver_run.sh --date <date> --topic "<topic>" --slug <slug> --beat <beat> --entities "<a,b,c>"
```

The delivery helper prepares the existing phone rendition and thumbnail before its first commit
and push. Keep them in the reviewed Dispatch package; do not open a PR with predictable media
still missing and then cancel its CI to add them. Open a ready PR, attach it
to the task, add codex and codex-automation labels when available, wait for all required checks on
its exact head, then merge. Inspect a failing job, reproduce and repair the cause before retrying.
Never merge red CI or overwrite newer published artifacts.

## Observed agent efficiency

For the Claude host, use only the actual root and direct-leaf transcript files for this run:

```sh
python scripts/claude_runtime.py audit --session <actual-root-transcript> --session <actual-leaf-transcript> --since <actual-run-start-UTC> --phases out/dispatch/claude-phases.jsonl --out out/dispatch/claude-usage.private.json
python scripts/claude_runtime.py measure --out out/dispatch/claude-efficiency-measurements.json
```

Keep this private. Deduplicate API identities, separate cache creation/read from uncached input,
and retain unknown role/effort/billing where the host omits them. External provider telemetry and
controller charges remain separate. Use the existing next-five-edition measurement command.
The Codex transcript reader below applies only to the Codex host.

For current agent-runtime editions, at recovery and accepted shipment collect the available
local root and direct-child token counters privately. Use the exact session path and UTC
checkpoint time. If a local session is unavailable, record unknown accounting rather than
zero spend. This diagnostic never changes paid charges, scores or shipment eligibility.

```sh
python scripts/agent_runtime.py --audit-session <exact-local-root-session> --through <UTC-checkpoint-time> --out out/dispatch/agent-runtime-usage.private.json
python scripts/agent_runtime.py --measure --out out/dispatch/agent-efficiency-measurements.json
```

Refresh the separate next-five-edition cost/quality observations after shipment. Preserve the
existing modern-film measurement window and recurring-defect packet. Claim savings only from
actual comparable evidence; keep subscription billing unknown without an account receipt.

## Docket feed lane

Use a clean Docket checkout at current origin/main on claude/dispatch-<date>, or resume that exact
owned branch. Pass its explicit path to the publisher when working from a Dispatch worktree.
Read Docket instructions, ownership.yaml and its actor contract before writes. Never write .git/ACTOR.

```sh
python scripts/publish_feed.py --date <date> --county <County> --caption "<approved caption>" --docket <owned-docket-checkout>
```

In that Docket checkout, with its pinned environment:

```sh
. .venv/bin/activate
python scripts/site/site_build.py
python scripts/site/site_fresh_check.py
python scripts/shared/ownership_check.py --actor dispatch --diff HEAD
```

Keep each producer's real exit status and retain the complete logs. The current atomic guard
verdict establishes completion; a successful tail or partial log does not. Wait on the exact
background task ID with bounded native task tools, never a process pattern matching its own shell.

Dispatch authors only the contracted videos.json input. Other permitted changes are generated
pages rebuilt by the site program. Commit the exact candidate with TXDOCKET_ACTOR=dispatch,
then keep that candidate unchanged. On Claude cloud push the exact committed candidate and
open its ready PR first, so GitHub can check out those bytes. Obtain the full-runner verdict
before merging. Use the durable Docket executor from current approved main against that same
unchanged feed candidate:

```sh
python <approved-docket-tools-checkout>/scripts/shared/guards_remote.py --repo <owned-docket-checkout>
```

The tools path is a verified clean Docket checkout of the approved main source, which may
be the primary sibling checkout. It is separate from an older frozen feed candidate that
predates this helper. Never copy tools into that candidate or commit another version just to
invoke the helper. Preserve an already admitted workflow definition while its execution is
pending; recover the exact candidate's existing execution before considering a new dispatch.

Exit 3 is pending, never a pass. Reuse the actual returned GitHub run ID; wait on that execution
and call the helper again after it completes. The helper admits one dispatch, verifies the
approved workflow and candidate, preserves its exact full-run artifacts and asks the original
local verdict reader. Keep its actual execution.json, verdict.json, full-run.log and local
readback with the edition's release evidence. Name GitHub Actions as the execution host.
The four-hour finite job executes the full original suite; ordinary hosted CI alone does not
supply this verdict. A Claude worker restart or native wait timeout never authorizes a duplicate
job or a replay of the expensive full suite. Preserve both interrupted native logs.

On a host that can complete the full native invocation, run it before pushing:

```sh
python scripts/shared/guards_local.py
python scripts/shared/guards_local.py --verdict
```

Keep that candidate HEAD and working tree unchanged until the verdict completes. Its stamp
must describe the committed candidate; committing after the run would invalidate that verdict.
Push a ready PR, wait for exact-head green guards, merge, then verify matching main CI and Pages
deployment. CI permits the merge; the full local verdict remains required for completed delivery.
The observed Claude suite exceeds one hour and can exceed its native 7,200,000 ms ceiling;
its foreground limit is 600,000 ms. Use the durable executor on that host from the first
attempt. A partial list of passing steps never proves completion. Do not restart a running suite.

Stale Docket records are repair work in the daily actor lane. First inspect same-day verified
daily work; reuse only sound source-supported updates. Otherwise re-fetch cited sources.
Put record edits on a separate claude/daily- branch with Actor: daily, regenerate, pass exact-head
CI and merge. Then update the feed branch from main and rerun its checks. Never import a held
carousel, unrelated records or unsupported source-verification claims into the feed release.

## Live film and unsent draft

```sh
python scripts/live_check.py --date <date> --wait 600
```

Use a nonblocking process handle for deployment waits and remain responsive. Verify permanent
master, phone and poster URLs serve the reviewed hashes, not merely HTTP success.
Use Computer Use to open https://texasaidocket.com/videos/#<edition-id>, inspect at phone size,
play the current film and confirm real playback. Build success does not prove deployment.
On the Claude cloud host, where Computer Use does not exist, run `scripts/phone_playback.py`
instead (prompts/claude_routine.md names its command and what it proves). Name the tool honestly.

Write runs/<date>/email.md before creating/updating Gmail. Put the usable post first:
1. Canonical film link, master, phone rendition, poster, encoded runtime including credits,
   dimensions and both media file sizes.
2. Approved social caption between -----BEGIN CAPTION----- and -----END CAPTION-----.
3. Copy-ready music attribution directly after the caption, between -----BEGIN MUSIC CREDITS-----
   and -----END MUSIC CREDITS-----. Generate it from the actual delivered mix and registry with
   the command below. Keep title, musician, source URL, license and modification notice intact.
4. Sources ready for the first comment.
5. Honest scores, gate results, limitations, soundcheck and any bounded machine upgrades.

Write the social caption for the viewer. Lead with the specific person, tool or consequence,
explain the source-backed mechanism, retain its strongest limitation, and end with a useful
takeaway or a verified next step. Prefer two short paragraphs. Avoid vague AI excitement,
repeating the title, keyword piles, invented urgency and unsupported promises. Read it once
without the film and once beside the film. It should add context while matching the actual cut.

```sh
python scripts/music_credit_payload.py --mix runs/<date>/mix.json --email runs/<date>/email.md
python scripts/email_check.py --email runs/<date>/email.md --date <date>
```

Run the prose scan again. Resolve the recipient from the verified delivery routing contract.
Create or update the matching unsent Gmail draft; do not duplicate it. Read it back and verify
recipient, subject, body, media links, DRAFT present and SENT absent. Never send or post.
The read-back body must also contain the exact copy-ready music credit block. Preserve existing
attachments when updating a draft. A correct local email payload does not prove the Gmail body.

## Shipment and durable closure

Build out/dispatch/shipment.json with the exact CI, merges, deployment, public media,
Computer Use and private draft-readback evidence required by SHIPMENT_CONTRACT.md.

```sh
python scripts/run_controller.py finish --result shipped --shipment out/dispatch/shipment.json
python scripts/daily_production.py --scoreboard --state out/dispatch/run_state.json --out out/dispatch/daily-production-scoreboard.json
```

The controller re-fetches release evidence and refuses missing or changed proof. Preserve its
full usage, limits, events and terminal state. Delivery's initial archive predates shipment:
on a clean branch from main, update runs/<date>/run_state.json with the accepted final state
and a truthy sanitized public shipment summary. Keep public PR/merge/deployment/time/media
evidence; exclude private Gmail identifiers, routing and local receipt paths. Merge this
metadata-only archive on exact-head green CI. Do not rerun media production or delivery.

Export the private ledger as an explicitly derived public account before archiving. Keep the
original ledger unchanged. Preserve every charge, increment and verdict; publish private owner
message digests and a neutral operator attestation instead of message bytes or chat references.

```sh
python scripts/public_state.py --state out/dispatch/run_state.json --out runs/<date>/run_state.json
```

The command writes the derived account through the same sanitizer a checkpoint uses. Local paths become a
checkout token, and shipped Gmail identifiers, bound routing and readback files and every address become
digests, so the exported ledger needs no further redaction. Usage, the frozen envelope, limits, increments and every
verdict are unchanged. It only reads the private state and refuses to overwrite it, including through a hard link.
It also fails closed and writes nothing when the ledger carries credential-shaped text, a value that sat under a
private key and survives under a neutral one, an absolute local path, or a charge key the sanitizer would have
replaced with a digest. A refusal names the cause. Preserve that exact failure and the private ledger.
The derived exporter can label verified historical checkout origins, structural references bound to the
registered storyboard, and exact owned workspace arguments. Each label has an exact inverse check.
Typed opaque provider signatures remain unchanged; they are distinguished from filesystem paths only
in the scan view. Unknown paths, leaked private values, credentials and altered charges still refuse.
Repair an unsupported export case in the owning source repository with the actual failed input and
negative controls, then use the ordinary exact-head CI and merge path. Keep the checkpoint codec,
private state, frozen hashes and reviewer evidence intact. An automatic approval rejection is retained
evidence for a safer implementation; never disguise the denied edit or weaken approval settings.

If packaging stops, retain the exact gate results, dependency hashes, partial-package manifest and
existing variety entry. After the actual failure is repaired through versioned source, retry the
ordinary complete deliver_run command with the original edition arguments. Its publishing-controller
check binds the registered board, movie and final report; every mandatory gate runs again. Only that
edition's one exact current entry is excluded from comparison with other films. The variety writer
retains an identical entry once and refuses conflicting or duplicate identities. Public export is
verified before variety or package writes, and shipped or different movies remain refused. A newer
identical unshipped copy can be retained. Do not extract script tails, invent skip flags or split a
denied action into equivalent commands. Preserve unrelated staged or dirty files. This retry grants
no review, source, artifact or shipment exception.

Report the video, canonical link, scores, actual usage, CI/deployment results and verified
unsent draft. Provider token telemetry excludes Codex account use; never label it total spend.
Update automation memory with closure and UTC time. Keep next-five-edition measurement honest:
unfinished editions count, and actual savings and reliability require production evidence.

After accepted shipment and its durable archive, refresh the cinematic measurements and
recurring-defect packet. This reads the actual retained failures and unfinished costs:

```sh
python scripts/cinematic_learning.py --state out/dispatch/run_state.json --out out/dispatch/cinematic-learning.json --defects-out out/dispatch/recurring-defects.json
```

Retain these reports as runs/<date>/cinematic-learning.json and runs/<date>/recurring-defects.json
in the same metadata-only durable closure. The helper emits logical archive references and
hashes; never add private Gmail ids or local receipt paths. The next picture phase inherits
the newest durable engineering decision even in a clean checkout.
The existing builder considers at most one shared advance per seven days, bounded by
config/cinematic_learning.json and ART_DIRECTION.md, inside the existing comparison. Record
`--decision advance|skip --decision-note <actual reason> --proof <retained evidence>` when
that decision occurs. No new daily reviewer, paid attempt or grant is introduced. Report
observed results; five future editions cannot be inferred from an engineering rehearsal.

Record retrospective findings for later maintenance. Daily production does not implement
optional engineering upgrades, run paid benchmarks, train itself, or reopen a shipped film.
Repair only an observed mandatory delivery failure in its owning source with focused evidence.
