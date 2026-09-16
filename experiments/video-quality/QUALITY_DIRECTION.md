# From illustrated bulletins to reported miniature documentaries

September 15, 2026 · Proposal and local motion study · Not a production policy change

## Decision

The biggest improvement will come from directing an unfolding event, not adding more motion to diagrams. Build a recognizable documentary-led format: tangible places and mechanisms, precise animated explanations, restrained typography, and sound that helps the viewer feel and understand the action.

Keep Remotion as the compositor. Replace the sentence-by-sentence visual assembly method. Invest first in story, assets and an animatic; renderer changes follow those decisions. “10x” is an ambition, not a measured result or a promise.

## What the audit found

- The September 13–15 boards use 8–9 scenes per film. FreshwaterTwinEpisode creates separate sequences for scenes, restarting their local motion. That encourages a new composition for each thought rather than continuity across thoughts.
- The current film relies heavily on symbolic networks, moving strokes and camera transforms. These can pass a pixel-motion check without depicting a meaningful event.
- Repeated headers and explanatory labels make the viewer read while narration is already explaining. The subject often occupies less attention than the surrounding information.
- The current rubric already prohibits held slides. A passing creative score therefore does not prove that viewers perceive a film rather than a presentation. The earlier 7.224 panel score established acceptance under that rubric; it did not establish world-class quality.

This is principally a story, directing and asset problem. Higher resolution, more transitions and a higher numerical threshold alone will not solve it.

## Research that informs the direction

These are lessons from studios' published process descriptions; this exploration does not claim a shot-by-shot viewing analysis of their films or reuse their assets.

| Reference | Useful principle | Application here |
|---|---|---|
| [Ordinary Folk: process](https://www.ordinaryfolk.co/process) | Message, visual development and nuanced animation are connected; audio enters the process early. | Approve a visual idea and scratch sound before finishing shots. |
| [Kurzgesagt: video process](https://kurzgesagt.org/what-we-do?visit=videos) | Research, script revision, visual metaphors, voice timing and a film-specific soundtrack form a deliberate production chain. | Preserve reporting discipline, but make visualization and audio authored parts of the story. |
| [BUCK: Illumina](https://buck.co/work/illumina) | Mixed techniques, tactile visual treatment and logically connected transitions support complex science. | Follow a physical object into its explanatory model; avoid unrelated panel changes. |
| [BUCK: Airbnb](https://buck.co/work/airbnb-story) | Previsualization establishes staging before final artistic treatment. | Test framing and action with inexpensive rough geometry before polishing. |
| [YouTube: audience retention](https://support.google.com/youtube/answer/9314415?hl=en) | Retention curves identify exits and revisited moments. | Test the actual released format and investigate drops; do not infer effectiveness from render success. |

## The format

Use three complementary visual modes, only when the story needs them:

1. **Witness:** a real place, person or physical action, with source and usage rights established. Reporting footage is strongest when it shows the subject doing something specific.
2. **Explain:** a precise native animation that reveals what footage cannot show—flow, causality, scale, alternatives or uncertainty.
3. **Prove:** a source document, map or attributable quotation at the moment the viewer needs evidence. Important text and numbers remain native and legible.

An illustrative or generated image must never impersonate evidence of a real deployment. Generic city footage and decorative AI clips are not substitutes for relevant reporting.

The story spine is: **someone or something attempts a task → resistance appears → the mechanism becomes visible → consequences follow → the reporting establishes the limit.** Not every story contains a person; a physical process can carry the action. A research announcement should remain visibly a proposal.

### Shot and edit rules

- Carry a recognizable object, location or action through the cut. Change framing because the viewer needs new information.
- Mix establishing views, close details and explanation deliberately. Do not assign one fresh board to every sentence.
- Animate state changes: a rotor loses momentum, flow declines, a signal arrives, a decision changes an outcome. Moving a camera over an unchanged drawing does not supply that action.
- Leave quiet holds where comprehension needs them. Continuous motion is not the goal.
- Reduce simultaneous reading. Captions support narration; headlines earn their presence rather than repeating it.
- Compose for a phone first. Overlapping captions, labels and UI are defects to fix before delivery.

## Build assets that can act

Create a small library of art-directed mechanisms and performances rather than a larger icon catalog. Initial candidates include valves, pumps, meters, document handling and sensor readouts. Each rig needs a meaningful range of states, believable timing, useful close-ups and lighting that communicates form.

Use existing React/SVG for precise typography, diagrams and data. Curated footage or offline-rendered plates can add physical richness within the existing manifested asset lane. If that lane proves insufficient, propose a specific contract change with provenance and reproducibility requirements. Do not silently expand it or replace the stack with a new subscription.

## Voice and sound

Design a scratch sound track with the animatic: mechanism sound, a change in room tone, a restrained accent, purposeful silence, and music with space for the voice. Final sound should follow events rather than play as an interchangeable bed.

Direct narration as a connected passage with intention and varied emphasis. Audition complete reads; do not repair every sentence into a uniformly paced delivery. A human listening pass on speakers and headphones is required for a flagship claim. Captions and waveform checks cannot establish performance quality.

## Production sequence

1. **Choose a filmable angle.** Identify the visible action, viewer payoff, verified claim and reporting limit. If all we can show is an announcement card, choose another angle or use a brief format.
2. **Develop three keyframes.** Opening, mechanism reveal and consequence. Agree on visual treatment before building every shot.
3. **Make a rough animatic with sound.** Test timing, continuity and explanation at low cost. Rewrite here.
4. **Finish one 8–12 second hero passage.** It must establish the actual achievable asset, motion and audio standard.
5. **Complete the film to that standard.** Build remaining assets and perform the final voice/sound edit.
6. **Review the actual film.** Creative acceptance and factual/technical release checks are separate decisions. Then use existing delivery gates.

A weak animatic should be revised, not sent through a more expensive render loop.

## A useful quality test

The existing release gates remain necessary. Add a creative review grounded in viewer experience rather than more cosmetic counters:

- With narration muted, can a viewer identify the main action and its change? This tests visual storytelling, not complete factual comprehension.
- If camera drift and labels are removed, does a meaningful action remain?
- After one normal viewing, can a viewer state the central verified claim and distinguish the proposal from an achieved result?
- Does every cut reveal something, change emphasis or advance an action?
- Can an independent reviewer reject the film for weak directing even when its factual and technical checks pass?

For the pilot, show the baseline and new treatment in randomized order to a small group of 6–10 viewers. Record preference, comprehension and the moments they found confusing or slow. This is a proposed qualitative test, not a statistical claim. If platform analytics are available, compare completion, average percentage viewed and exit points under comparable distribution. No analytics were accessed in this exploration, and no retention improvement is claimed.

## Pilot and rollout

| Priority | Deliverable | Acceptance evidence |
|---|---|---|
| First | One complete pilot with three approved keyframes and rough sound animatic | Clear causal story; relevant assets; reporting limits visible |
| Next | Finished hero passage with real asset treatment and authored sound | Actual phone playback and human listening review |
| Then | Full film and paired baseline review | Viewer comprehension/preference notes; creative and release decisions separately recorded |
| After validation | Reusable action rigs, brief contract and production integration | Repeat the treatment on a second subject without visual sameness |

Separate a dependable daily brief from an occasional flagship if original reporting and asset work cannot fit the daily production budget. Measure the pilot's labor, revisions and cost before setting a cadence. No schedule or spending changes are made by this proposal.

Likely later code changes include action-driven scene contracts, continuity across sequences in the episode renderer, asset manifests for new rigs/plates, and creative review criteria that cannot be satisfied solely by pixel movement. These are proposed work, not implemented pipeline changes.

## What the local study demonstrates

The separate MotionStudy composition is a 25-second, 1080×1920, 30 fps experiment using the first 20.33 seconds of the September 15 narration/mix, followed by credits. It carries one pump from a close view through a failure into a proposed twin and its input streams. It keeps the physical warning visible rather than implying an unreported repair.

The study tests continuous staging, material treatment, framing and causal motion. It is still an illustrative vector mechanism. It does not yet supply documentary footage, human performance, a custom score or a human listening verdict, and should not be called world-class finished work.

The original narration and music were reused without voice resynthesis. Music: Kevin MacLeod, “Immersed,” CC BY 4.0; credit appears in the film. No third-party studio visuals were copied. No production composition, rubric, scheduler or published film was changed.

### Local artifacts and reproduction

- Source: video-engine/src/quality-lab/index.tsx and cues.ts.
- Preview: out/quality-lab/motion-study.mp4.
- Contact sheet: out/quality-lab/contact.png.
- Separate development budget state: out/quality-lab/run_state.json; two renders used for this study.
- TypeScript passed; rendered frames were inspected and label spacing corrected; final metadata confirms H.264/AAC, 1080×1920, 30 fps, 25 seconds. These checks do not establish audience effectiveness or auditory quality.

Run from the workspace wrapper, with the established Dispatch environment:

```sh
bash repositories/TexasAIDispatch/scripts/run_with_env.sh bash -c 'export DYLD_LIBRARY_PATH="$PWD/video-engine/node_modules/@remotion/compositor-darwin-arm64"; cd video-engine && npx remotion render src/quality-lab/index.tsx MotionStudy ../out/quality-lab/silent.mp4 --concurrency=2'
bash repositories/TexasAIDispatch/scripts/run_with_env.sh ffmpeg -v error -y -i out/quality-lab/silent.mp4 -i out/dispatch/mix.wav -map 0:v -map 1:a -c:v copy -af 'atrim=0:20.33,afade=t=out:st=20.1:d=0.23,apad=whole_dur=25' -c:a aac -b:a 256k -t 25 -movflags +faststart out/quality-lab/motion-study.mp4
```

The audio command depends on the preserved September 15 local mix. Future rerenders must meter the separate development state and preserve the completed daily-run evidence.
