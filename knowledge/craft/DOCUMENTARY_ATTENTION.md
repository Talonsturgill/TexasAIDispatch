# Miniature documentaries and attention

Owner-directed format, September 15th, 2026. Read before selecting and boarding a story.

## The viewer's bargain

Start with a specific action or consequence worth seeing. Establish the question quickly, pay off
part of it, then make the next development worth following. At each beat ask what would surprise,
clarify or move a viewer who has no obligation to keep watching. An unsupported dramatic claim is
never an acceptable way to create surprise.

Make a miniature documentary. A real place or action establishes relevance, an authored mechanism
explains causality, and source evidence establishes what is known. Use only the modes the story
earns. Illustrative reconstructions, models and generated plates must not imply filmed evidence.
Research announcements remain proposals even when the visualization looks convincing.

## Attention is a sequence of rewards

Use the pacing policy in `config/documentary.json`: aim for a meaningful development every
two to three seconds, with no unearned gap beyond its maximum. Finish the first visible payoff
within the policy hook window. These are owner-directed editorial targets, not a universal
scientific attention span or an instruction to cut on a timer. A development can happen inside the same shot. The readable credit tail has its existing
timing requirement.

Useful developments include a physical action changing state, a hidden mechanism opening, a
relevant location becoming visible, a comparison becoming clear, a person's reaction, or source
evidence changing the interpretation. Camera drift, animated dashes and replacement headlines
alone do not earn the interval.

Use a rhythm of anticipation, action, consequence and a short comprehension hold. Avoid continuous
visual noise. One dominant action at a time gives the eye a place to go. A close view can cut wide
while the same action continues. Maintain direction, color meaning and the identity of the
throughline. The ending should resolve or deliberately reopen the first question.

## Practical production

1. Select a filmable angle with visible action, viewer payoff and a sourced limit.
2. Make three keyframes for the opening, central reveal and consequence before finishing assets.
3. Build the rough animatic with scratch sound. Prefer cutting dead setup and repetition to
   speeding a voice recording. Voice is never time-stretched.
4. Finish one hero passage to establish actual attainable picture and sound quality.
5. Complete the film. Use action rigs and relevant plates, not a reusable sequence of label cards.
6. Watch the actual file at phone size, with sound and muted, before the existing release checks.

## One storyboard clock

For current films, `documentary` declares schema `dispatch_documentary/1`, `viewer_question`,
`payoff`, `source_limit`, `hero_image`, `closing_answer`, and `hook_payoff_event`. Write concrete
answers before rendering. New daily topics need original reporting and art; the water reference
is not a reusable script or a request to repeat its subject.

Every scene `visual_events` entry has a globally unique `id`, scene-local `at_s`, `duration_s`,
actual `item_ids`, and `what`. `attention_beats` references that `event_id` and supplies `item_ids`,
`change_type`, `visible_change`, `viewer_reward`, `continuity_from`, and `sound_action`.
Allowed changes: mechanism, consequence, evidence, human_action, location_reveal, comparison,
reveal, resolution. Do not put a second time value on attention beats. `board_retime.py` moves
the source event; `lib/direction.ts` resolves its film-global window for the renderer. Edit
`at_s_authored` and `duration_s_authored` when adjusting a retimed event.

`documentary_check.py` checks the hook, real gaps including the final story tail, action lengths,
and item bindings. It runs in preflight, watchability, the full renderer, panel triage and delivery.
Dates before the policy's effective date remain reproducible. New dates cannot opt out.

After rendering, `documentary_review.py` creates an attention player with per-event seek controls,
a before/after contact sheet and a JSON index hash-bound to the board and final MP4. The normal
render wrapper builds it. Preship and delivery reject stale or missing artifacts. All three judges
must return the exact-film `attention_review` described in their scorer brief. A judge's creative
rejection blocks publication even if the weighted mean passes. This is evidence for human-style
review, not an automated declaration that the pictures are good.

The camera may hold while a subject acts or the viewer reads evidence. A stationary camera is
not the same thing as a held slide. Do not introduce an unrelated move merely to satisfy a camera
field. Keep the existing camera_strategy field for renderer compatibility and stage its movement
only where it helps the shot.

## Sound and typography

Motivate sound with the visible action. Use the existing foley library when suitable; shape entry,
duration and level to the picture. Use silence as contrast. A graphic model cue is sonification,
not a recording of a real machine. Music supports the narration and does not replace sound design.
Listen to a full-passage voice performance and the final mix. Waveforms cannot judge acting.

Retain accessible captions. Remove redundant title furniture before shrinking the main subject.
Keep annotation separate from captions and platform controls. Let the viewer see an action before
asking them to read its label. Use the existing safe-area overlays on the final file.

## Creative review

The release rubric remains authoritative. A technical pass does not establish creative success.
The critic and final panel should explicitly answer these questions with timestamps:

- What makes the first moment worth watching, and when does its promise pay off?
- What physically changes in each directed interval?
- What stays recognizable across each cut?
- With labels hidden, is there still a meaningful action?
- Which picture would a viewer remember, and why?
- Does the viewer understand both the central claim and its limit after one viewing?
- Where does the film become repetitive, confusing or sound like a uniformly paced read?

Do not certify a scene's action by counting changed pixels. Inspect the rendered subject. Compare
the film with the previous baseline in randomized order with viewers when available. Record
comprehension, preference and specific confusing moments. Platform retention is additional
evidence, not a substitute for understanding. No retention gain is assumed before measurement.

## Research and limits of inference

- [Google's ABCD guidance](https://support.google.com/google-ads/answer/14783551?hl=en) recommends
  entering the story quickly, tight framing, engaging pacing and supportive audio/text that do
  not compete. It concerns advertising. Applying those principles to reported films is an
  editorial inference, not evidence of a particular retention increase for this channel.
- [Magliano and Zacks, 2011](https://pubmed.ncbi.nlm.nih.gov/21972849/) studied film continuity and
  event segmentation. Action discontinuities strongly affected perceived event boundaries;
  continuity can maintain an unfolding event across cuts. This is not a study of short-feed
  retention and does not establish a five-second rule.
- [YouTube retention documentation](https://support.google.com/youtube/answer/9314415?hl=en)
  explains how exits, skips and revisits appear in audience-retention reports. A spike may reflect
  rewatching or confusion. Review its context. Compare films with similar format and distribution.

## Reference implementation

`examples/board.json` and `FreshwaterDocumentaryEpisode.tsx` are the faster production
reference, rendered through the normal `Dispatch` composition. They use the same 37-second
narration plus readable source/music credits as the approved pilot. Twenty board-driven actions
replace the pilot's slower progression. Source quotations and dates come from `documentary_copy`
on the board and are included in the printed-figure evidence gate. The reusable timing helpers
are in `video-engine/src/lib/direction.ts`.

The earlier quality-lab pilot remains a comparison artifact under `experiments/video-quality`.
It is not the production entry point. A next-day episode must author its own subject, staging,
performances and evidence, then clear the same gates. Do not copy the pump story into tomorrow.
