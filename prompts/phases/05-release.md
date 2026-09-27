# Merge, publish, verify and close

Read knowledge/craft/SHIPMENT_CONTRACT.md and the current cross-repository ownership contract.
Only publishable production enters delivery. Run the program rather than reproducing its
ledger, freshness, copy and commit steps manually:

```sh
python scripts/validation_check.py --validation out/dispatch/validation.json --claims out/dispatch/claims.json --board out/dispatch/storyboard.json
bash scripts/deliver_run.sh --date <date> --topic "<topic>" --slug <slug> --beat <beat> --entities "<a,b,c>"
```

Keep generated phone media and poster in the reviewed Dispatch package. Open a ready PR, attach it
to the task, add codex and codex-automation labels when available, wait for all required checks on
its exact head, then merge. Inspect a failing job, reproduce and repair the cause before retrying.
Never merge red CI or overwrite newer published artifacts.

## Docket feed lane

Use a clean Docket checkout at current origin/main on claude/dispatch-<date>, or resume that exact
owned branch. Pass its explicit path to the publisher when working from a Dispatch worktree.
Read Docket instructions, ownership.yaml and its actor contract before writes. Never write .git/ACTOR.

```sh
python scripts/publish_feed.py --date <date> --county <County> --caption "<approved caption>" --docket <owned-docket-checkout>
```

In that Docket checkout, with its pinned environment:

```sh
.venv/bin/python scripts/site/site_build.py
.venv/bin/python scripts/site/site_fresh_check.py
.venv/bin/python scripts/shared/ownership_check.py --actor dispatch --diff HEAD
```

Dispatch authors only the contracted videos.json input. Other permitted changes are generated
pages rebuilt by the site program. Commit with TXDOCKET_ACTOR=dispatch, push a ready PR, wait
for exact-head green guards, merge, then verify matching main CI and Pages deployment.

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

Write runs/<date>/email.md before creating/updating Gmail. Put the usable post first:
1. Canonical film link, master, phone rendition, poster, encoded runtime including credits,
   dimensions and both media file sizes.
2. Approved social caption between -----BEGIN CAPTION----- and -----END CAPTION-----.
3. Sources ready for the first comment.
4. Honest scores, gate results, limitations, soundcheck and any bounded machine upgrades.

```sh
python scripts/email_check.py --email runs/<date>/email.md --date <date>
```

Run the prose scan again. Resolve the recipient from the verified delivery routing contract.
Create or update the matching unsent Gmail draft; do not duplicate it. Read it back and verify
recipient, subject, body, media links, DRAFT present and SENT absent. Never send or post.

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

Report the video, canonical link, scores, actual usage, CI/deployment results and verified
unsent draft. Provider token telemetry excludes Codex account use; never label it total spend.
Update automation memory with closure and UTC time. Keep next-five-edition measurement honest:
unfinished editions count, and actual savings and reliability require production evidence.

A retrospective may produce up to three bounded verified upgrades. Cross-lane changes need the
owning workflow. Do not extend the shipped film with optional polish or defer required repairs.
