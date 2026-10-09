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

| plate | region | counties | reassembly | cards (things) | limits push / truck / rise (m) | worst slide (px) | KB |
|---|---|---|---|---|---|---|---|
| blackland-wide | blackland | the region | 0.191 / 4.00 | 2 (16) | 4 / 0.1 / 0.75 | 1.09 | 309 |
| blackland-austin | blackland | Travis | 0.070 / 4.00 | 2 (49) | 4 / 0.75 / 0.75 | 1.21 | 389 |
| blackland-dallas | blackland | Dallas | 0.073 / 3.04 | 8 (7) | 4 / 0.3 / 0.75 | 1.03 | 328 |
| blackland-san-antonio | blackland | Bexar | 0.058 / 3.00 | 6 (13) | 4 / 0.3 / 0.75 | 1.00 | 276 |
| cross-timbers-wide | cross_timbers | the region | 0.053 / 8.17 | 8 (263) | 4 / 0.2 / 0.75 | 1.09 | 386 |
| gulf-wide | gulf | the region | 0.951 / 9.50 | 2 (49) | 6 / 0.5 / 1 | 0.99 | 208 |
| gulf-houston | gulf | Harris | 0.285 / 8.00 | 9 (14) | 6 / 0.5 / 1.5 | 1.11 | 219 |
| gulf-shipchannel | gulf | by place_plate: Harris, Galveston, Jefferson, Brazoria, Chambers, Nueces | 0.748 / 8.00 | 2 (25) | 6 / 0.5 / 1.5 | 0.87 | 214 |
| high-plains-wide | high_plains | the region | 0.118 / 4.00 | 1 (22) | 4 / 0.1 / 0.75 | 1.08 | 270 |
| hill-country-wide | hill_country | the region | 0.026 / 6.56 | 7 (10) | 0.5 / 0.1 / 0.2 | 1.11 | 478 |
| piney-woods-wide | piney_woods | the region | 0.045 / 4.80 | 25 (361) | 3 / 0.1 / 0.75 | 0.96 | 546 |
| post-oak-wide | post_oak | the region | 0.086 / 4.00 | 9 (18) | 3 / 0.2 / 0.5 | 1.04 | 321 |
| rolling-plains-wide | rolling_plains | the region | 0.012 / 1.19 | 7 (18) | 1.5 / 0.2 / 0.3 | 0.91 | 267 |
| south-texas-wide | south_texas | the region | 0.056 / 3.00 | 18 (135) | 0.25 / 0.1 / 0.1 | 1.29 | 252 |
| trans-pecos-wide | trans_pecos | the region | 0.011 / 1.16 | 15 (52) | 1 / 0.2 / 0.2 | 1.34 | 215 |

Reassembly is the difference, in 8-bit levels over the film frame, between the layers laid over one
another at rest and the picture the engine rendered whole (mean / 99.9th percentile; the limits are
1.5 and 48). Limits are the largest push, truck and rise in metres that kept the ground covering the
frame, slid no base on its ground by more than 2 pixels and magnified no card past 1.25. Slide is the
worst slide at the ends of every camera profile the stage uses, which move at 0.6 of the limits: of a
base on its ground, or of a pixel of a skyline or ridge from where its own distance puts it.

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
- **October 8th, the fly gene test (Harris County).** Its one wide shot of a fly and a vial has the
  window. Its close shots and its five labelled comparisons, listed as `wash_views`, stand in the soft
  wash, because a window's rails and skyline crossed their labels and ground lines in the first grade.
  Its three diagram views (candidate-clue, gene-detail, diagnostic-clue) are listed as `wall_views`
  and keep plain paper.

`scripts/place_check.py --render` drew every shot with the region as solid magenta and counted what
the episode left showing. The October 7th film showed the region on 0.128 to 0.411 of every frame
and the October 8th film on 0.154 to 0.889, with its overhead shot set aside and its five wall views
a third of the fifteen shots held, under the cap of 0.4. With the October 7th episode's old
full-frame wall put back, every shot showed 0.000 and the gate failed each one by name.

`locator.webp`: the county card at 2.2, 3.0, 4.6, 5.3, 6.0 and 7.6 seconds. A faint outline of the state is there from
the first frame, the border draws for 2.5 s from the Panhandle's northwest corner, Harris fills in
1.0 s and a ring lands in 0.7 s, the vetted map-explainer timing. It carries no words, since no claim
stands behind a board's county.

## Blind grades, three rounds

Each round put the shipped frame and the stage frame of the same moment side by side as A and B, in
an order a seeded coin set and no grader saw, one pair per framing per film. Every grader was a fresh
agent given the same prompt, which asked for the show's own place question verbatim and for
legibility at phone size, and which named the refineries as part of Harris County in every round.
Scores are 1 to 10, means over the ten pairs.

| round | what was graded | graders | place, shipped to stage | legibility, shipped to stage | preferred stage / shipped / neither |
|---|---|---|---|---|---|
| 1 | the first stage: one Gulf plate with the ship channel, a window in every interior | 1 | 2.0 to 3.6 | 7.6 to 6.0 | 5 / 3 / 2 |
| 2 | county plates, mirror water, the wash for close shots and for `wash_views` | 2 | 2.0 to 3.5, and 2.0 to 3.3 | 7.6 to 6.7, and 7.7 to 6.3 | 8 / 1 / 1, and 5 / 4 / 1 |
| 3 | what ships: a lighter wash, the wide window lowered | 2 | 2.0 to 3.3, and 1.8 to 3.5 | 7.8 to 6.8, and 7.8 to 6.7 | 6 / 1 / 3, and 6 / 3 / 1 |

What each round changed came from the round before it. Round one found the refinery view wrong for a
Medical Center lab, a fly as tall as a window pane, mullions through a vial and labels, and the
locator half drawn. Before round two was graded, its own stills showed the fly film's labelled
comparisons crossed by the window's rails, so they became `wash_views`. Round two then found the
full-frame blur reading as any city while it cost the thinnest marks their contrast, and, as round
one had, the wide window's top rail running through the cooling film's lower title box, which
measured as an overlap of rows 414 to 419.

**What the graders still say, in round three, and it stands.** Only the sharp window view reads as
Houston, and even it is a generic skyline over still water in flat light, with nothing of the Gulf
Prairies a Texan would name. The wash adds a city nobody can place. Thin marks outside the caption
boxes (heat squiggles, ground lines, glass vials, a coral label) lose contrast over any backdrop, and
the fly film's coral "Patient variants" comparison was shipped plain by both graders in rounds two
and three. Stills catch the locator mid-draw in two of ten pairs. And the cooling film's outdoor
condensers stand in a room, which no backdrop fixes. The stage lifts place by about one and a half
points at a cost of about one point of legibility, and the rest of the axis is in the episodes: their
props, their rooms and whether a story is filmed outdoors at all.

## Real photographs

`scripts/place_photos.py --place "Houston Ship Channel"` returned four photographs from the Library
of Congress's Lyda Hill Texas Collection, 2014 aerials of the ship channel and its energy facilities
by Carol M. Highsmith, each catalogued with the advisory "No known restrictions on publication" and
its credit line. `--fetch` downloaded one at 1840 by 1228 and wrote its source, creator, date, rights
basis, credit line and sha256 beside it. A run still decides whether a photograph shows the story's
actual site, by the rules in DAILY_PRODUCTION.md.
