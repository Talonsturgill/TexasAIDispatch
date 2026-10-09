# County-true place for the directed film: the proof (October 9th, 2026)

The owner's step five: "Place, the weakest score ... Render the 3D scenes once as layered
backgrounds and move them in Remotion. Add county map moments using Remotion's map-timing rules.
Use real local photos with their sources recorded." This folder is the evidence that it does what
it says, measured on the two films the current route has made. Nothing here ships. Neither film is
re-released, and both still render exactly as they shipped, since the stage is dated from
October 10th and these renders opted in.

## What was measured before any of it was built

- Place averaged 6.36 over the last ten report cards and was the weakest axis in eight of ten panels.
- 72 of the last 105 scenes (14 films) were interiors, and all six of October 8th's were. A plate
  that only works outdoors would have reached under a third of the show.
- 4 of the last 14 films carried any outside imagery and none carried a photograph of the actual
  site. The bounded visual searches rejected nearly every candidate for having no reuse licence.

## The plates

Fifteen scene pages under `assets/place/scenes/`, built in the Docket's carousel engine (TexasAIDocket
`6326b02db`) and baked by `scripts/place_bake.py` into a sky, one ground and depth cards. Each of the ten
Gould regions has a plate of its own that carries nothing belonging to one place. Harris, Dallas,
Travis and Bexar counties have their own, with their cities, and the Houston Ship Channel's refineries
are a plate a board may name for a story at a plant on the upper coast. Every row below was measured on
the bake and is in `video-engine/src/modern/placePlates.json`.

PLATES_TABLE

Reassembly is the difference, in 8-bit levels over the film frame, between the layers laid over one
another at rest and the picture the engine rendered whole (mean / 99.9th percentile; the limits are
1.5 and 48). Limits are the largest push, truck and rise in metres that kept the ground covering the
frame, slid no base on its ground by more than 2 pixels and magnified no card past 1.25. Slide is the
worst base slide at the ends of every camera profile the stage uses, which move at 0.6 of the limits.

`plates.webp` is every plate's full picture, as the bake rendered it whole.

## Three faults every number passed

**The first design cut each world into bands and tore the ground.** It cut each world into three
bands by distance. The Blackland plate's near band moved as if 7 m away and the next as if 213 m away,
so a sideways move of centimetres sheared the crop rows along the seam, and the seam check, which
searched for sky showing through, passed. The ground is now one layer moved by the exact homography a
camera move gives a flat ground.

**The lake was a slab of concrete and the river grew grass.** The Austin plate passed every check with
Lady Bird Lake drawn as a flat pale grey band, because still water seen from eye height under a hazy
sky mirrors that sky almost whole and the kit's water drew exactly that. The San Antonio plate passed
with bunchgrass growing down the middle of its river. `assets/place/water.js` now draws still water as a
mirror of the world in its own plane, so the far bank and the towers stand in it, and takes every tuft
standing on water out of a scatter.

**The ground layer carried the skylines, and a rise stretched them.** The kit marks its far skylines
as ground, so the city plates drew them into the ground layer, up to 513 pixels above the horizon, and
the transform that is exact on the ground moved them as if they lay on it. A rise at the share the
stage uses moved them 38 to 64 pixels. The ground is now drawn only up to the eye's height, and what
of a surface rises above it is a card at its own distance, every pixel of which the bake measures
against the depth pass. GATE_LESSONS.md has all three accounts.

## The two films on the stage

`compare.webp`: the shipped frame above, the same frame on the stage below, four shots from each.

- **October 7th, the cooling inspection (Harris County).** The room's wide and medium shots have a
  window onto Houston across Buffalo Bayou. Its close and detail shots, the thermal camera and the
  inspection lens, stand in the region's soft light instead.
- **October 8th, the fly gene test (Harris County).** The fly shots stand in the same light. Its three
  diagram views (candidate-clue, gene-detail, diagnostic-clue) are listed as `wall_views` and keep
  plain paper, because a skyline behind thin helix lines and small labels made them harder to read.

PLACE_SHARES

`locator.webp`: the county card at LOCATOR_TIMES seconds. A faint outline of the state is there from
the first frame, the border draws for 2.5 s from the Panhandle's northwest corner, Harris fills in
1.0 s and a ring lands in 0.7 s, the vetted map-explainer timing. It carries no words, since no claim
stands behind a board's county.

BLIND_SECTION

## Real photographs

`scripts/place_photos.py --place "Houston Ship Channel"` returned four photographs from the Library
of Congress's Lyda Hill Texas Collection, 2014 aerials of the ship channel and its energy facilities
by Carol M. Highsmith, each catalogued with the advisory "No known restrictions on publication" and
its credit line. `--fetch` downloaded one at 1840 by 1228 and wrote its source, creator, date, rights
basis, credit line and sha256 beside it. A run still decides whether a photograph shows the story's
actual site, by the rules in DAILY_PRODUCTION.md.
