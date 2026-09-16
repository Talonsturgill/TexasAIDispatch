# Documentary production upgrade

The daily routine now requires a miniature documentary with an early visible payoff, coherent
action, source evidence and a clear ending. Read `knowledge/craft/DOCUMENTARY_ATTENTION.md`.
This reference demonstrates the approved direction with a faster edit through the normal
`Dispatch` composition. It reuses the September 15th story to isolate picture and pacing changes;
the next daily run must select new reporting and build a story-specific film.

## Watch and inspect

Run `python experiments/video-quality/serve_review.py` through the workspace's Dispatch wrapper,
then open `http://127.0.0.1:8779/review.html`. It compares the original, approved pilot and faster
production cut at the same position. `deliverables/attention-review.html` adds seek controls for
each of the twenty visual events, with an exact-film before/after contact sheet. The original
comparison falls back to the already committed September 15th film if its local copy is absent.

The committed reference video is `deliverables/documentary-production.mp4`. The actual production
board is `examples/board.json`; its independently refreshed source evidence is in
`examples/documentary-claims.json`. All action windows derive from the scene events. Source
headlines are rendered from the bound item labels, and evidence copy is rendered from the board.
There is no second timing plan in the production episode.

## What the automation now does

- Reads the attention policy before reporting and boarding. Research briefs include a filmable
  action, human consequence, three key images, primary-source limits and usable asset leads.
- Requires the first payoff, meaningful event spacing, action durations and real item bindings.
  Camera drift and text replacement alone do not count. The credit tail stays readable.
- Carries action timing through measured narration retiming without compounding either the onset
  or action duration. The narrator is never sped up to satisfy a visual edit.
- Creates an attention player and contact sheet from the exact final film. Review artifacts bind
  the board, film, contact sheet and player by hash; media URLs include the film version.
- Requires all three final judges to describe the hook, continuity, remembered image, weakest
  interval and actual audio evidence. One rejection blocks delivery despite a high average score.
  The ship gate independently rechecks these against the current film.
- Preserves a portable attention review with each delivered daily episode. Keeps existing claim,
  alignment, music, safe-area, budget, independent-panel and public-playback checks.

The reference's 20 visual events have a longest start-to-start or final-tail gap of 2.6 seconds;
the first physical payoff completes at 1.0 second. These are measured editorial properties, not
claims about attention spans or a proven retention increase. New films read policy values from
`config/documentary.json` rather than copying numbers from this report.

## Validation

- All 28 locally executable CI workflow groups passed, plus TypeScript and the action-clock tests.
- The production-composition animatic passed with the original motion floor. Its sampling now
  spans actual actions: tests replay an early action that the old 20/80 percent pair missed and
  prove that an invented event cannot rescue a completely still film.
- Full production render: 1080 by 1920, 30 fps, 42 seconds; complete H.264/AAC decoding passed.
  Render manifest and freshness checks bind the final file to the current engine and board.
- The final mix measures -16.41 LUFS, with 13 motivated synthesized cues and unaltered voice speed.
  Alignment verification recomputed the audio/script/ASR bindings and all ten caption boundaries.
- Actual browser playback at 390 by 844 reached the end with readyState 4, no media error and no
  horizontal page overflow. Seeking and comparison controls worked. Phone and desktop feed
  composites were inspected; the shared credit wrapper now respects the button-rail safe area.
- Negative tests reject missing or duplicate events, dead tails, fake item references, a second
  attention clock, invalid times, changed video/contact-sheet bytes, stale judge hashes and a
  creative rejection hidden behind a high numeric score.

Two existing release-check issues surfaced and were repaired: the freshness self-test borrowed a
previous day's output manifest, and a disabled music row pointed to a deleted Archive item. The
self-test now creates its own digest fixture. The catalogue link now resolves to UCSB; the track
remains disabled and has not been cleared for use.

## Evidence and limits

`deliverables/production-verification.json` records the exact final media and engine hashes.
The content remains an illustrative reconstruction and proposed research, not filmed deployment.
The Texas locator uses simplified U.S. Census data; its source and projection are recorded in
`video-engine/src/documentary/GEOGRAPHY.md`. Music retains the full required attribution.

This engineering rehearsal has no independent creative-panel verdict and no direct human
listening verdict. No viewer study or channel retention uplift has been measured. Those limits
are explicit in the verification artifact. The morning production episode must complete the
normal independent review and delivery process for its own new film.

## Reproduce without a voice-service call

The existing CI workflow renders `examples/board.json` through `preflight_animatic.py` and builds/verifies its
review pack. For a full rehearsal, use the preserved local `out/quality-lab/production` audio,
captions and board through `scripts/render_dispatch.sh`, reserving against the existing
quality-lab controller. Never reset that ledger or reuse a completed daily controller. A fresh
machine can inspect the committed final MP4 and reproduce the silent CI reference without the
local audio scratch files.

The earlier generic board is retained as `examples/legacy-board.json`. The workflow definition
is unchanged. Its preflight entry point now exercises the documentary negative cases and builds
the real review pack; the existing identity suite also checks action-clock identity and retiming.
