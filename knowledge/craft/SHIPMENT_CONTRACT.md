# Shipment is production completion

`publishable` authorizes release while the controller stays open. Only
`finish --result shipped --shipment out/dispatch/shipment.json` closes production.
This command rechecks the current exact-film quality binding and fetches GitHub,
the public feed, and the permanent master and phone assets itself.

## Retain actual evidence

Keep private account evidence under gitignored `out/dispatch/`. Never put Gmail
API output, recipient routing, or credentials in a public commit. Evidence files
must come from actual tool observations. A typed success claim is not evidence.

The shipment manifest contains:

- `run_id` and `film_sha256` from the current controller.
- `dispatch_pr` and `feed_pr`: the merged release PR URLs in their owning repositories.
- `deployment_run_id`: the successful GitHub Pages workflow run for the feed merge commit.
- `live_url`: the canonical `https://texasaidocket.com/videos/#<entry-id>` URL.
- `expected_recipient`: the established delivery recipient from the routine's account routing.
- `delivery_routing`: a bound JSON file containing that `recipient` and this `run_id`.
  Establish this input before draft creation; never derive the expected recipient from
  the draft being tested. Reuse confirmed account routing from the preceding delivery.
- `mobile`, `email`, `gmail_readback`, and `phone_playback`: bound evidence files.

A bound file is an object with `path` and its actual `sha256`. The phone file is
the published rendition; the email file is the committed media-first email body.

## Gmail readback

Retrieve the draft after creation or update, with full message data. Retain the
Gmail API draft object, or an envelope with `draft_id` from creation/listing and
`message` containing the unchanged Gmail read tool's `structuredContent` object.
The checker supports native `labelIds`/`mimeType`/base64 data and the installed
connector's `label_ids`/`mime_type`/decoded `content` representation.
The checker requires DRAFT, rejects any SENT label, compares the exact recipient,
decodes plain or HTML MIME bodies, and compares all visible words to the email
file. HTML may wrap paragraphs, but preserve the visible source URLs and wording
from email.md. Retain the raw tool response; never invent omitted labels or body data.
Never send the message.

## Canonical phone playback

Use Computer Use on the canonical URL at a phone viewport. Observe the current
video source, readiness, errors, paused state, and playback clock twice while the
film plays. Retain a screenshot of the actual phone page. Record the observations
as `phone_playback` JSON with:

- `url`, `master_sha256`, `tool`, and `observed_at`.
- `viewport.width` and `viewport.height`.
- `samples`: at least two observations, each containing `currentSrc`, `currentTime`,
  `readyState`, `paused`, and `error`.
- `screenshots`: bound screenshot files from that Computer Use session.

The clock must advance, the source must equal the published phone rendition,
and the URL must select this edition. A contact sheet, HTTP response, or page
title alone cannot establish playback. Missing access keeps production active;
it never permits fabricated observations or a completion claim.

## Preserve completion and continue after interruptions

After successful closure, retain the controller state and a public-safe summary
of its shipment receipt with the edition. Keep private raw readbacks locally.
The controller's `pending` command searches actual Git worktrees for unfinished
production. A checkpoint, resource boundary, or failed review never closes an
edition. Resume it before creating another date.

## September 26 regression

The previous routine spent ten reboards on weak primitive geometry, floating
image transfers, an ambiguous roof strip, and rigid cleanup. Picture and story
reviews rejected the native film. A sound-provider connection failed twice.
The director treated the exhausted reboard counter as an approval boundary,
saved a rejected film, and stopped without publication or a Gmail draft.

The code permitted that failure: a budget refusal disabled later panels,
checkpoint packaging called terminal completion, and `publishable` closed before
deployment. The saved automation explicitly endorsed these exits. The repair
removes production review closure, keeps panels available after unrelated budget
refusals, reserves finite evidence-bound repair batches, and checks shipment
before completion. Phone critique now requires timed observations of recognizable
subjects, contact and consequence, surface finish, and the closing payoff.

These checks require evidence; they cannot guarantee artistic quality or prevent
a model from ending a response prematurely. The autonomous routine must continue
the open edition, and the next invocation must resume it if execution is interrupted.
