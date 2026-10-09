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

Ten scene pages under `assets/place/scenes/`, one per Gould region, built in the Docket's carousel
engine (TexasAIDocket `6326b02db`), baked by `scripts/place_bake.py` into a sky, one ground and depth
cards. Every row below was measured on the bake and is in `video-engine/src/modern/placePlates.json`.

PLATES_TABLE

Reassembly is the difference, in 8-bit levels over the film frame, between the layers laid over one
another at rest and the picture the engine rendered whole (mean / 99.9th percentile; the limits are
1.5 and 48). Limits are the largest push, truck and rise in metres that kept the ground covering the
frame, slid no base on its ground by more than 2 pixels and magnified no card past 1.25. Slide is the
worst base slide at the ends of every camera profile the stage uses, which move at 0.6 of the limits.

**The first design was wrong and the bake's own check could not see it.** It cut each world into
three bands by distance. The Blackland plate's near band moved as if 7 m away and the next as if
213 m away, so a sideways move of centimetres sheared the crop rows along the seam, and the seam
check, which searched for sky showing through, passed. The ground is now one layer moved by the
exact homography a camera move gives a flat ground. GATE_LESSONS.md has the account.

## The two films on the stage

`compare.webp`: the shipped frame above, the same frame on the stage below, four shots from each.

- **October 7th, the cooling inspection (Harris County).** The room now has a window onto the ship
  channel's refineries and the marsh. Titles, labels and captions are where they were.
- **October 8th, the fly gene test (Harris County).** The fly shots stand in front of the same
  window. Its three diagram views (candidate-clue, gene-detail, diagnostic-clue) are listed as
  `wall_views` and keep plain paper, because the first render put the skyline behind thin helix
  lines and small labels and they were harder to read.

`scripts/place_check.py --render` drew every shot with the region as solid magenta and counted what
the episode left showing. The October 7th film showed the region on 0.135 to 0.219 of every frame
and the October 8th film on 0.156 to 0.318, with its overhead shot and five wall views set aside (a
third of its fifteen shots, under the cap of 0.4). With the October 7th episode's old full-frame wall
put back, every shot showed 0.000 and the gate failed each one by name.

`locator.webp`: the county card at 3.0, 4.6, 5.3, 6.0 and 7.6 seconds. The border draws for 2.5 s
from the Panhandle's northwest corner, Harris fills in 1.0 s and a ring lands in 0.7 s, the vetted
map-explainer timing. It carries no words, since no claim stands behind a board's county.

BLIND_SECTION

## Real photographs

`scripts/place_photos.py --place "Houston Ship Channel"` returned four photographs from the Library
of Congress's Lyda Hill Texas Collection, 2014 aerials of the ship channel and its energy facilities
by Carol M. Highsmith, each catalogued with the advisory "No known restrictions on publication" and
its credit line. `--fetch` downloaded one at 1840 by 1228 and wrote its source, creator, date, rights
basis, credit line and sha256 beside it. A run still decides whether a photograph shows the story's
actual site, by the rules in DAILY_PRODUCTION.md.
