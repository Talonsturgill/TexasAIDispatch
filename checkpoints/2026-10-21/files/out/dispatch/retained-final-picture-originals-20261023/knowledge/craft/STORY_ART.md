# Fresh relevant artwork during every storyboard

Direct owner instruction from October 7th, 2026. From the effective date in
`config/story_art.json`, generate two fresh images before animation and voice. This is a
required production step: a finished hero plus supporting props or a purposeful environment.
Use the built-in ImageGen tool and its skill. Do not silently substitute the old exceptional
Gemini background-plate lane, library boxes or a prior edition's generated artwork.

## Design a useful asset set

After selecting the earned angle, write `story_art` in the actual board, with version
`fresh-story-art-v1` and two `requests`. Each has `id`, `role` (`hero` or `support`), the edition's
`generated/story-art/<date>/<request-id>.png` filename, relevant `scene_ids`, a concrete `purpose`,
the complete generation `prompt`, and an immediate `source_limit`. Plan these images once for
both complete treatments. A supporting atlas can hold several separated relevant props in one
image; its independently movable slices must be measured against the actual output.

Specify recognizable silhouettes, rounded sculpted forms, coherent perspective, layered
materials, motivated key/fill/rim light, readable surface detail and grounded contact. Match the
story's palette and shape language. A film about field work, policy or clinical decisions needs
different objects and a different world. Neither decorative scenery nor a familiar stock
server qualifies. Give every principal on-screen prop a clear story job.

Generate cutouts with genuine transparent alpha when they need to move independently. Preserve
the original alpha and bytes. Use an environment image only when its setting is useful and
clearly generic. Generated art must not impersonate documentary footage, source evidence, a
named real operator, an actual unobserved installation, or measured data. Render exact facts,
labels and captions with native verified text. Show the illustration disclosure.

## Charge, generate, inspect, record

Read the ImageGen skill and announce its first use. Reserve before each actual tool attempt:

```sh
python scripts/story_art.py --board out/dispatch/storyboard.json reserve \
  --state out/dispatch/run_state.json --request <id> --out out/dispatch/art-<id>-charge.json
```

Then invoke built-in ImageGen using that exact request, inspect the returned image at native
size and phone size, and save its original output into the workspace. Record the actual
generation identity from the tool's output filename and its actual creation time, never an
invented provider receipt, token usage or cost:

```sh
python scripts/story_art.py --board out/dispatch/storyboard.json record \
  --source <original-output.png> --request <id> --generation-id <actual-tool-output-id> \
  --generated-at <actual-output-creation-time> --charge out/dispatch/art-<id>-charge.json
python scripts/story_art.py --board out/dispatch/storyboard.json verify
```

All commands use the Dispatch environment wrapper. Add measured image `width` and `height`
and, for an atlas, each named `slices` rectangle `[x,y,width,height]` to the recorded entry.
The record binds exact request, original bytes, edition date and prior charge. A rejected
generation remains charged and retained; archive its board and image before replacing the
current request with a separately named request and asset. Keep exactly two selected assets
in the active plan. Reuse unchanged
assets within this edition's two treatments and mandatory repairs. Resume recorded assets
without buying them again. An unfinished edition can generate its missing or corrected assets
on a later day; its reservation still belongs to that edition's original cumulative ledger.
No image from an earlier edition counts as fresh.

The new normal budget reserves two ImageGen calls, with a cumulative ceiling in run_limits.
Every failed attempt counts. Mandatory art failures use the versioned autonomous completion
policy and exact independent failure evidence to fund the complete remaining path. Optional
asset polish stops at its boundary. The saved primary model, schedule and existing review
count remain unchanged.

`deliver_run.sh` verifies and explicitly stages these exact images, even though the general
generated-asset directory is ignored by Git. The clean release checkout and future review
packets must contain the selected raster bytes. Do not commit unrelated generated files.

## Make the images perform

The active episode consumes `board.story_art` through `StoryArtProvider` and `ArtSprite`, or an
equally explicit reviewed consumer for its story. No hard-coded old image path or vector-box
fallback is allowed. Crop an atlas in the renderer without changing original pixels. Render
these cutouts through Remotion's load-aware `Img` inside the crop viewport. Unmanaged SVG
`image` tags produced missing props at the first frame of a newly mounted shot in the actual
engineering film. The retained cold-shot regression must reject that capture and accept the
loaded picture. Asset download or a good later still does not prove every captured frame.
Animate
actual tasks with setup, contact, reaction and consequence on the global event clock. Change
shot size and viewpoint when the new information earns it. A generated still slowly zoomed
for the whole narration is still a weak film.

The existing builder reports actual image consumers and known limitations. The existing phone
critic and three final scorers inspect visible finish, subject recognition, contact and source
truth on the exact film. Generate attractive art, then prove that it helps this specific story.
