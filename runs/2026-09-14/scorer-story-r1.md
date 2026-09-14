# Story lens, round one

Reviewed 2026-09-14T11:30:11.143471+00:00.
Exact film SHA256 e15c9075f8315b4bd5f427e678409754015c402cdcaf32a07619cfe0e676a604. This matches render-manifest.json. The score uses the current rubric read directly. No threshold copied into this report.

Score 6.938. Weighted arithmetic is 7.1*0.18 + 8.0*0.20 + 7.0*0.20 + 6.3*0.14 + 6.0*0.14 + 6.7*0.14. No rounding upward. Ship false because the weighted score does not clear the current rubric. No absolute rubric hard fail found in the inspected evidence.

## What was inspected

All eight film-derived scene images, feed-composite.png, credits_frame.png, and an independently extracted twelve-frame film motion sheet at 0, 0.6, 1.2, 1.8, 15.1, 16, 17, 18.4, 29.5, 32, 35 and 37.5 seconds. Further samples at 18.5, 18.6, 18.68 and 37.9 isolated the turn and cut. Review-only derived images are in scorer-story-motion/. The preflight report was read but its film hash belongs to preflight.mp4, so it was not treated as finished-film motion proof. Full final film blackdetect confirmed one black frame from 18.700 to 18.733333. Final film is 43 seconds, 1080 by 1920, 30 fps with an AAC audio stream.

Read storyboard, script, claims, independent validation, voice-review, mix, captions, words, acoustic ASR and provenance. Read Dispatch.tsx's registered cinematic routing and the shipping code's explicitly accepted waveform alignment methods. Ran music.py --verify-package with the exact credits and mix; it passed.

## Axis evidence

Hook 7.1. A paper road and case are already pictured at zero, and the unfinished hole appears by 1.2 seconds, so this is more than a title card. The picture is legible without sound. The case title is abstract and Kodiak is not identified visually until scene two, which limits the stop-scroll pull.

Story 8.0. The September eighth actor and measured-through-August milestone lead to a concrete metric correction. The June filing is clearly dated, Texas-wide initial market is separated from the existing Dallas-to-Houston service, and the close gives a target while withholding launch. That is an earned explanatory take. Scene seven repeats incompleteness after the metric limit, but its verification-and-validation paper adds useful specificity.

Picture 7.0. The road hole, binder progress, paired claim/evidence leaves, cab, Texas silhouette, freight crossing and closing case supply actual visual changes. The same pointing engineer and workshop window recur excessively, with little human action. The turn's percentage visibly descends but still floats over the steering wheel above the binder at the last nonblack samples rather than landing on the page. The title and page label keep the metric distinction understandable, so this is degraded execution rather than total absence of the narrated idea.

Place 6.3. Dallas-to-Houston freight, Texas geography and bare-headed workshop kit are suitable. No incompatible vegetation, terrain or costume appears. The workshop itself has very little recognizable regional detail, and its generic window/floor offer a weak sense of a lived-in Texas place. This is a specificity deficit, not a county mismatch.

Craft 6.0. Large headline/caption contrast works at feed size, paper layering has depth, and camera-relative framing changes are visible. The one-frame black gap at the cab-to-Texas cut is a real render defect. Scene five's internal INITIAL LAUNCH MARKET text partly falls outside the pale Texas silhouette onto dark background, losing contrast; the header repeats its meaning and prevents a factual omission. Several secondary labels and the recurring person compete with the paper, while the board's most important animated docking gesture never fully completes visually. The closing title also approaches the right edge too closely.

Voice 6.7. Direct auditory perception was unavailable, so this is an evidence-limited assessment, not a claim to have heard performance. The exact acoustic reconciliation passes with no aliases, soundcheck accuracy is recorded as 1.0, measured pitch variance is 6.32 semitones, and caption cue boundaries are measured on the final mix. Captions contain the approved script. The mix is 2.37 dB below its own loudness target; it reports no limiter, a 20 dB music gap and no time stretch. These data support intelligibility and timing but do not prove natural delivery or pleasing musical balance.

## Absolute hard-fail audit

- Numerals. On-screen 93% and September 8th trace to fetched verified c1/c2 quotes. The script's date and percentage trace likewise. Year-end has direct c1/c3 support. The music licence numeral appears only in the generated credit whose package check passed. No unsupported numeral observed.
- Caption timing. Caption cues use measured silence boundaries linked to the actual ASR and final mix hash; all cue starts and ends declare measured_boundary. words.json openly distinguishes modelled interior word positions from measured caption edges. The repository explicitly permits silence_anchored as waveform alignment; no shifted or scaled displayed cue found.
- Audio stretching. Voice and mix reports explicitly record factors of 1.0 for voice, music and effects; no contrary evidence found.
- County/region. Dallas workshop context and Texas-wide planned market do not create a county mismatch. The map does not pin Dallas as the launch point.
- Retired imagery and inappropriate headwear. None observed in any scene or credits.
- Held slide. Opening and closing have independent motion samples showing changed paper/cover geometry. The middle scenes have actual moving objects or reveals and durations around or below five seconds. Credits last five seconds. No held slide longer than five seconds without motion, emotion or revelation identified.
- Narrated idea binding. Every VO concept has an actual rendered binder, claim/evidence pair, cab, Texas outline, truck or pending-case change. s4's incomplete visual landing reduces craft/picture scores but does not erase its performed transfer and explicit distinction.
- Generic fallback. Dispatch.tsx directly routes highway-safety-case-v1 to HighwaySafetyCaseEpisode. The recurring paper road/case is physical throughline; opening gap, cab transfer, closing cover and sourced year-end sign-off are visible.

## Executable corrections

Make scene sequence boundaries share one integer-frame boundary to remove the observed black frame. Compute the scene-four percentage destination in the same transformed coordinate space as the binder, finish the move before the final half-second, and hold it visibly inside the binder. Move the Texas status text fully inside the silhouette or omit that duplicate in favor of the already legible header. These are concrete craft repairs to the existing story, not a request for a different film. Rerender and rebind after changes.
