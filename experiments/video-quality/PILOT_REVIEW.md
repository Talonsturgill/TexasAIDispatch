# Before trouble travels. Documentary pilot

September 15th, 2026 story. Complete local pilot, 42 seconds, 1080 by 1920, 30 fps.

This records the originally approved pilot. The faster production integration is documented in
`PRODUCTION_REVIEW.md` and is now the comparison player's default.

## Watch

Open `deliverables/review.html` locally, or start the comparison server from the workspace wrapper:

```sh
bash repositories/TexasAIDispatch/scripts/run_with_env.sh python experiments/video-quality/serve_review.py
```

The player is at http://127.0.0.1:8779/review.html. It switches between the original and the pilot
at the same time position. The complete pilot is `deliverables/documentary-pilot.mp4`.

## What changed

- The pump's close-up leads into the connected failure sooner. The camera follows the consequence.
- The same pump becomes a proposed digital twin. Its inputs arrive separately, with visible icons
  and converging paths, rather than a simultaneous panel of labels.
- A bright source extract at 20.33 seconds changes the viewer's task from imagining the proposal
  to examining the evidence. The document is explicitly an editorial layout of sourced text.
- The empty result field means unreported improvement, not a measured result of zero.
- Planned operator tools appear as a laptop, manual and illustrative hand. No workshop or deployed
  product is presented as having been filmed.
- The ending returns to the stopped pump. It does not invent a successful repair or deployment.
- Eleven synthesized sound cues are placed against the new actions. The whole-passage narration
  and its speed are preserved; the final mix has new alignment and provenance evidence.

## Attention research and its use

[Google's ABCD guidance](https://support.google.com/google-ads/answer/14783551?hl=en) supports
getting into the story quickly, tight framing and audio/text that reinforce rather than compete.
It concerns ads, so its application to our reported films is an editorial inference.

[Magliano and Zacks](https://pubmed.ncbi.nlm.nih.gov/21972849/) found action discontinuities had
the strongest effect on perceived event boundaries in their film study. That supports our decision
to preserve the causal action across changes in framing. It does not prove a short-feed retention
effect or a universal five-second attention span.

Our five-second rule is an editorial review interval. The imported pilot plan has 17 entries
including the opening and credit entrance; its longest interval before the credit tail is 4.25
seconds. That checks the authored schedule, not viewer engagement. The final five seconds hold
readable credits. Some rewards are reveals or changes of interpretation rather than cuts.

Use [YouTube's retention reports](https://support.google.com/youtube/answer/9314415?hl=en) after
publication to examine exits and revisits. A revisit can indicate confusion as well as interest.
No channel analytics, viewer preference study or retention uplift is claimed here.

## What is wired into the local production instructions

The versioned routine now reads `knowledge/craft/DOCUMENTARY_ATTENTION.md` before selecting and
boarding stories. It asks for timed attention beats tied to actual rendered objects, review of
long intervals, purposeful camera behavior, and timestamped creative review in addition to
technical release checks. It no longer describes every camera hold as a waste of the engine.

The pilot is a separate composition. The daily renderer still chooses its normal story-specific
template. This is a craft reference and local routine upgrade, not a generic pump template for
all subjects. At the original pilot review, changes were local. The subsequent production release promotes
this direction into the daily routine; see `PRODUCTION_REVIEW.md` for its implementation and
verification. Historical daily films are preserved.

## Verification and limits

- TypeScript, composition self-test/real check, wiring self-test/real check, engine lint, font check
  and single-source rubric check passed.
- A quarter-size full animatic and full-resolution frames were inspected. The final correction
  separates physical/model branches and moves input labels above the physical pump.
- The new mix measures -16.41 LUFS. No time stretch is applied. Alignment was rerun on the final
  mix with its exact voice stem, then independently recomputed by the existing verification mode.
  All ten cue boundaries and words match the original published caption timings and text.
- The media decodes as H.264/AAC at 1080 by 1920 and 30 fps, with a 42-second duration.
- Actual browser playback progressed with readyState 4 and no media error. The phone viewport
  was 390 by 844, without horizontal overflow. Seeking and same-time comparison were verified.
- No human listening verdict or independent creative panel is claimed. No source footage was
  filmed or newly obtained. This remains an illustrated documentary pilot, not proof of a
  completed world-class production system.

## Sources and rights

Facts and quotation come from the preserved September 15th claim file and NSF award 2640086.
The opening pump failure is hypothetical. The dated voice line saying today refers to the
September 15th story; the pilot visibly carries that date.

Original vector art and synthesized foley use the existing native production stack. Music is
Kevin MacLeod's Immersed, CC BY 4.0, with full attribution in the film. No studio reference assets,
third-party footage or new generated-media service was used.

## Reproduction

Use the separate existing quality-lab controller state. Do not reset it or reuse the completed
daily controller. Reserve a render before spending it.

```sh
bash repositories/TexasAIDispatch/scripts/run_with_env.sh python scripts/run_controller.py --state out/quality-lab/run_state.json consume --resource full_renders --note 'Documentary pilot rerender'
bash repositories/TexasAIDispatch/scripts/run_with_env.sh bash -c 'export DYLD_LIBRARY_PATH="$PWD/video-engine/node_modules/@remotion/compositor-darwin-arm64"; cd video-engine && npx remotion render src/quality-lab/pilot.tsx DocumentaryPilot ../out/quality-lab/pilot-silent.mp4 --concurrency=2'
bash repositories/TexasAIDispatch/scripts/run_with_env.sh python scripts/mix.py --vo out/dispatch/mix_vo.wav --vo-at 0 --sfx experiments/video-quality/pilot-sfx.json --bed out/dispatch/music_bed.wav --bed-track immersed --bed-manifest out/dispatch/music_bed.json --bed-gap-db 19 --out out/quality-lab/pilot-mix.wav --cut 42
bash repositories/TexasAIDispatch/scripts/run_with_env.sh python scripts/vo_align.py --wav out/quality-lab/pilot-mix.wav --voice out/quality-lab/pilot-mix_vo.wav --script out/dispatch/vo_script.txt --out out/quality-lab/pilot-alignment
bash repositories/TexasAIDispatch/scripts/run_with_env.sh ffmpeg -v error -y -i out/quality-lab/pilot-silent.mp4 -i out/quality-lab/pilot-mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 256k -t 42 -movflags +faststart out/quality-lab/documentary-pilot.mp4
```

The rendering imports `pilot-plan.ts` and `full-cues.ts`. If alignment changes, update the cue input
from the measured alignment and rerender. Do not shift cues by hand. Source audio dependencies
remain in the preserved local September 15th scratch package. The deliverable movie and review
evidence are also copied outside scratch, under this experiment's `deliverables` directory.
