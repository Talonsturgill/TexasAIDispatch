# Texas AI Dispatch: social delivery

Read by `prompts/daily_routine.md`, Phase 7. It is the owner's November 10th, 2026 authorization,
carried over word for word from the retired runbook with two changes made on November 12th: the
film counts as released once `scripts/lean.py deliver` has run and its pull request is merged, and
LinkedIn receives the vertical master because this show has never produced a square cut.

Social delivery NEVER blocks the film. Every problem here is reported per destination in the email
and the run carries on. "The existing release gates" below means the daily lane's own:
`lean.py check` clean, the panel's SHIP, `lean.py deliver`, and the merged pull request.

## DAILY SOCIAL DELIVERY — OWNER UPDATE, NOVEMBER 10TH, 2026

This section replaces older human-posting/review requirements for this daily routine only.
Keep the existing research, production, fact, rights, quality, release, archive and merge gates.
Keep the existing Gmail draft delivery, its recipient resolution and read-back checks unchanged.
Never send the email. The draft is now a delivery copy and incident report, not a social approval
gate. After the normal release and email steps, publish this edition directly through the
official Upload-Post REST API using `scripts/upload_post_rest.py`. No review link, extra editorial panel or human posting step.
Do not add a GitHub Actions publisher or change the routine's schedule.

### Route and startup preflight

- Repository: `Talonsturgill/TexasAIDispatch`; edition identity: the existing run date/ID.
- Upload-Post profile `user`: `default`.
- Facebook Page: `113073681274871`.
- LinkedIn organization: `78748279`; Instagram handle: `texasaidocket`.
- Brand website CTA: https://texasaidocket.com/
- Authorized brand destinations: Facebook, LinkedIn, YouTube, Instagram and TikTok, limited
  to the accounts already connected to this profile. Do not connect new accounts during a run.

At wake, before production, run the offline transport and durable-state regression suites:
`bash scripts/run_with_env.sh python scripts/upload_post_rest_test.py` and
`bash scripts/run_with_env.sh python scripts/upload_post_state_test.py`. A failure blocks social
writes without blocking original production/email delivery. Then run
`bash scripts/run_with_env.sh python scripts/upload_post_rest.py read users` in the actual
routine runtime. Use `read facebook-pages --query profile=<bound-user>` and
`read linkedin-pages --query profile=<bound-user>` to verify the exact connected accounts.
The IDs above are bindings, not hints. Never use the first profile/page returned, the personal
LinkedIn profile, or the other state's accounts. Send `target_linkedin_page_id` for every
LinkedIn upload and the verified brand `facebook_page_id` for every Facebook upload. The helper
normalizes the exact bound LinkedIn numeric ID or full URN to `urn:li:organization:<bound-id>`,
matching the Pages API returned `id`. It rejects any other organization. Verify both current pins
with `read facebook-pin --query profile_username=<bound-user>` and
`read linkedin-pin --query profile_username=<bound-user>`. A non-null `selected_page_id` must
match the bound brand Page: either provider's pinned Page overrides its supplied upload selector.
A null pin is allowed because the helper supplies the explicit bound Page. Never change a pin. A missing or mismatched account blocks that destination, not normal production and email
delivery. Report the exact mismatch.

The publisher is the official REST API at https://api.upload-post.com/api, documented at
https://docs.upload-post.com/api/upload-video and https://docs.upload-post.com/api/upload-photo.
Use the owner's already configured Claude Network secrets proxy for THIS cloud environment.
It injects `Authorization: Apikey` securely for api.upload-post.com. The helper never reads or
accepts an API key, and sends no Authorization header, including no dummy header that could
replace the proxy's injected credential. Do not put a key in an environment variable or argument.
Call the read-only preflight successfully from the actual routine runtime before declaring
access ready; a browser login or a desktop-only connection does not prove routine access.
Before production, also run `bash scripts/run_with_env.sh python scripts/upload_post_rest.py state --repository Talonsturgill/TexasAIDispatch --initialize`.
This validates or creates the empty, separate `refs/heads/claude/social-delivery-state-v1` branch
through verified exact-origin Git access and verifies its readback. It stores only the helper's
minimal `state.json` delivery map, not production artifacts. Use the existing authorized Git
access; do not install credentials or work around a denied Git operation. A failed initialization
blocks social writes, not the original production/email path. This social state branch never
writes to main, the production branch, or shipped artifacts, and adds no GitHub Actions publisher.

Read-only Upload-Post MCP tools may supplement account/history inspection. Do not call MCP
upload tools: their host requires per-post confirmation. Do not bypass an MCP confirmation.

Never create, print, copy into git, or scrape API keys, OAuth tokens or session cookies.
Do not weaken permissions, self-authorize OAuth, or install credentials to fix a blocked run.
If the secure proxy is absent, expired or needs approval, continue the original production/email
path and mark social delivery BLOCKED with the required setup action. The owner must authorize
persistent access through the supported secure configuration flow. No secret belongs in prompts,
commits, command arguments, receipts, screenshots or email.

### Shipping media and copy

Publish only this routine's final released edition, after all existing release gates and merge
requirements pass. A failed or cancelled edition is never made publishable by this section.
Do not revive older backlog editions as part of a daily run. Re-firing an already-produced
edition means reconcile its social status, not render or publish another copy.

Use REST `POST /api/upload`. This show releases ONE cut, the vertical master
`runs/<date>/dispatch.mp4`, and every destination receives it: LinkedIn, Instagram Reels, TikTok
and YouTube. Facebook receives the complete released video
with `facebook_media_type=VIDEO` and `video_state=PUBLISHED`, never the truncating REELS placement.
Keep YouTube title and description separate and respect current platform limits. No square cut
exists for this show and none is required. Never crop or re-encode the released film for a feed.

Use a concise final caption, without duplicating source links or music credits already present
in the released video. Do not copy the production source/credit block into the caption or first
comment by default. Verify the actual license: include an external credit/link only when its
terms require that placement or the released media lacks required attribution. Keep source and
license records in the existing production/archive evidence. For carousels, preserve attribution
required by their media and licenses. This owner update controls over older caption templates. Add a short factual CTA to https://texasaidocket.com/ in the
platform caption/description or supported first comment, respecting that platform's length
limit and the existing prose checks. Do not add claims, promises or endorsements. A bare URL in
an Instagram/TikTok caption is not a clickable link: do not claim a link sticker, link-in-bio
destination or clickable CTA unless it actually exists. Do not change profile bios in this run.

Inspect the live upload schema for `first_comment` and placement options. Use supported fields
only; unknown platform options can be silently ignored. For TikTok, verify the account's publishing
settings with `read tiktok-settings --query profile=<bound-user>`, then use
`post_mode=DIRECT_POST` and `privacy_level=PUBLIC_TO_EVERYONE`, never an inbox draft. Do not alter
account privacy or connection permissions. Set LinkedIn `visibility=PUBLIC` and YouTube
`privacyStatus=public`; use public visibility on the other authorized channels.
The owner's standing approval covers publishing the finished daily edition to these bound brand
accounts without another editorial review. It does not override a host/tool requirement for
action-time confirmation; if one is enforced, report that unattended delivery is blocked.

Upload the exact local released bytes directly as multipart data. The helper accepts local
files only and checks their SHA-256 before sending. If only a permanent verified HTTPS artifact
URL is available, download that released artifact into existing run scratch first, verify it
against the released SHA-256, and pass the local path. Never substitute a website player page.
Verify MIME type, dimensions, duration/page count and SHA-256 of the actual shipping bytes.

Prepare one JSON manifest per logical destination in the existing ignored run scratch directory:
`repository` (the full owner/repo above), `edition_id`, `user`, `platform`, `placement` (`feed` or
`story`), `segment_index` (zero-based; 0 for feed), `media_type` (`video`, `photos` or `document`),
`media` (ordered objects with local `path` and released `sha256`), `title`, and `options`
containing the official REST fields. Keep YouTube title/description separate. Never include keys,
headers, signed upload URLs or credentials in a manifest. Only use documented REST field names
(such as `target_linkedin_page_id` and YouTube `privacyStatus`), not MCP aliases such as platformOptions.

Run `bash scripts/run_with_env.sh python scripts/upload_post_rest.py upload --manifest <manifest.json> --receipt-dir <edition-scratch-directory> --dry-run`
to inspect the request, then omit `--dry-run` to publish AFTER the release gates, live account
verification, separate social ownership and history reconciliation below. The helper restricts writes
to the upload endpoints and one platform/placement at a time. It is a transport, not a substitute
for those production and duplicate checks. Use the same receipt directory on every resume.
Exit 0 is a dry-run/read success. Every real upload exits 3, including an accepted request:
this means reconciliation is required, not a failed command or permission to retry. Read its
receipt and poll the original request. Exit 2 is a blocker; preserve any existing receipt.

### Stories

Publish Instagram and Facebook Stories as separate placements when supported for the connected
account. For video, derive ordered contiguous 9:16 segments of at most 60 seconds from the released
master, covering the entire film once, preserving audio and captions with no stretched crop.
Probe each encoded segment's actual duration, keep it below the platform's current limit and
inspect its boundary frames. If the current API limit is lower, use that lower limit. Submit
segments in order and verify each before continuing. Facebook's full-length feed post must use
VIDEO, not REELS, so a long film is not silently truncated. Never put the full long film into a
single Story slot. For carousels, use the released slide sequence adapted into legible 9:16
Story frames without clipping text. Reuse existing visual gates for changed frames, not a new
editorial approval loop. If safe adaptation is unavailable, finish the supported feed posts and
report Stories as blocked rather than inventing a successful placement.

For each Instagram Story set `media_type=STORIES`; for each Facebook Story set
`facebook_media_type=STORIES` and the verified `facebook_page_id`. Each request contains one
segment/frame only. Instagram feed photos use `media_type=IMAGE` (the API forms a carousel from
the ordered photos), and video feed posts use `media_type=REELS`. Do not send a CAROUSEL enum.

Use an actual supported Story link-sticker field only if the current API exposes it. Otherwise
a visible brand website CTA is acceptable, with no claim that it is tappable. Do not substitute
an image upload that would silently land in the feed for a Story.

### Duplicate prevention and interrupted runs

A daily trigger can be re-fired. Treat each (repository, edition ID, profile, platform,
placement, segment index) as one logical delivery; include the ordered media hashes and final
copy hash in its fingerprint. Social delivery uses the separate Git compare-and-swap (CAS)
state branch above, not the production lease. Do not reacquire or reopen a shipped production
edition merely to post. Existing production ownership remains unchanged for production actions.
Before any POST, the helper atomically claims the logical delivery as UNKNOWN on the remote
state branch, then verifies readback of its unique owner. If exclusive social ownership cannot
be established, skip social writes and report the exact blocker. No claim expires or transfers.
Any existing remote claim, including UNKNOWN, permits reconciliation only, never another POST.

Before EVERY upload, run `bash scripts/run_with_env.sh python scripts/upload_post_rest.py state --repository Talonsturgill/TexasAIDispatch --edition-id <edition-id>`
to read the durable entries, even if local scratch is absent. Reconcile that logical delivery
against this remote state, any local receipt and
`read history --query page=<n> --query limit=100` (paginate through the edition's delivery
window), plus `read media --query user=<bound-user> --query platform=<platform>` where needed.
For LinkedIn media also pass `--query page_urn=<bound-organization-id>`; its default can resolve
to the wrong organization. Preserve provider pagination limits and treat incomplete history as
uncertain, never as proof that nothing was published. History identifies profiles with
`profile_username`; filter that exact bound value and inspect `platform`, `media_type`,
`facebook_page_id`/`target_linkedin_page_id`, `post_title`, `post_caption`, `upload_timestamp`
and `request_id`. History may not contain media hashes: do not invent a hash match. Use the
retained receipt or actual platform media evidence; an ambiguous match stays UNKNOWN.
Match the profile, platform, placement, title/copy and media, not just the date.
A receipt marked succeeded is never resubmitted. An accepted request is polled by its original
request ID. Save request IDs immediately in the existing scratch run state and update the
existing Gmail draft with a compact delivery receipt as each destination resolves; preserve its
entire original body and attachment/link content. Do not add a second email or list old mail.

The remote claim binds the logical destination, not the caption/media fingerprint: changing
copy cannot make a second attempt safe. The helper persists returned request IDs and minimal
public references with metadata-only CAS updates. Retrying a metadata update never resubmits
the POST. Preserve the full provider response in the local receipt as supplemental evidence.
Any existing receipt blocks another upload too. Do not delete or rename local receipts or remote
claims to retry. Local receipts alone are not durable dedupe. The separate remote state survives
a lost container. Read the original request's status and history instead of creating a new claim.

A cross-container re-fire may publish an unclaimed missing destination only after normal history
reconciliation and all released-edition gates. An already-claimed ambiguous destination stays
blocked, even if its owner disappeared. No expiration, takeover or forced retry is authorized.
Read/init commands exit 0 on success; upload exits 3 after submission because reconciliation is
still required, never because publication was proved. Errors exit 2. Inspect the saved state and
provider result, not the exit code alone, before assigning a final social status.

The REST API does not document a universal idempotency-key parameter. Do not invent
one or claim exactly-once delivery from a local filename. A timeout, dropped response, lost
receipt, incomplete history, ambiguous match or interrupted upload is UNKNOWN, not failed.
Reconcile it with provider history/status before any retry. If it cannot be resolved, stop that
destination and report the uncertainty; never blindly retry the whole platform batch. Prefer
one platform/placement per upload so a partial failure cannot republish successes. A confirmed failure still retains its receipt. After evidence proves no live post was created,
report the exact failed request and use only a separately supported request-bound recovery; this
helper deliberately has no force/retry flag. Do not create a new identity to evade this guard. Do not delete a live post
or rewrite previously shipped artifacts to recover.

### Completion and evidence

Poll `read status --query request_id=<original-id>` for an asynchronous upload; an existing
scheduled job uses `read status --query job_id=<original-id>`. This helper publishes immediately,
not on a new schedule. Distinguish accepted/scheduled from published. Use bounded backoff
and honor rate limits. An HTTP success, accepted upload, queue entry or overall success flag is
not proof that every destination published. Inspect each platform's terminal result and retrieve
the actual platform post ID/permalink or account media entry. Preserve failures and warnings.

In the existing Gmail draft and final report list each platform and placement separately:
PUBLISHED with verified post ID/link, FAILED with the provider error, BLOCKED with the missing
setup/capability, UNKNOWN for an uncertain outcome, or NOT_APPLICABLE for an unsupported format.
Story receipts include every segment and its order. Never mark the whole run's social delivery
complete if any required destination is failed, pending, blocked or unknown. Production can remain
successfully delivered under its original controller while social delivery is separately incomplete.
The completion statements elsewhere in this file are extended by this requirement.

Perform this reconciliation even on an ALREADY_SHIPPED re-fire, after preserving all existing
required maintenance. Resume pending social work with the same edition and request IDs.
Do not use a post-merge social receipt as a reason to reopen production, rerun quality panels,
alter the archive or create another merge. Provider history plus the updated, read-back original
Gmail draft and the separate remote social state are the post-merge delivery record. No social outage may remove or prevent the
original Gmail draft.


Owner directive, October 9th, 2026. This is the Claude host entry point. Read the current
`prompts/dispatch_routine.md` and execute its five phases in full, loading each phase and its
required contracts when entering it. This entry point replaces only the host routing, unavailable
ImageGen service and local workspace bootstrap. Every source, rights, action, modern film, audio,
caption, independent scoring, native rendering and shipment requirement remains in force.

