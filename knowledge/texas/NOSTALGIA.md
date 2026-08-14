# Nostalgia — the artifacts a Texan recognizes and connects with

The doctrine the nostalgia modules are built on. `flora`, `skies`, `roadside`, `hometown`,
`homeplace`, `tejano`, `blacktexas` and `football` each cite this file. `CULTURE.md` carries the
hard cultural provisions that override anything here, and `FOOTBALL.md` carries the football
detail. Read `CULTURE.md` first — a frame that breaks one of its rules does not ship, whatever
else is good about it.

The job of these modules is not decoration. It is to place a frame in a specific Texas so
precisely that a viewer thinks *I have been there* before reading a single word. That is worth
more than any amount of prettiness, and it is the standard every artifact is held to.

---

## The five rules the whole wave follows

1. **RECOGNITION OVER DECORATION.** An artifact earns its place by being recognized, not by being
   pretty. A Texan looks at a mesquite and thinks *I have been there*; at a generic round tree they
   think nothing, which is worse than a bad drawing because it costs the frame its location. Draw
   the thing that is specific, not the thing that is generically nice.

2. **DRAW THE FORM, NEVER THE MARK.** Half of what carries recognition here is a live trademark,
   and the form under every one of them is free and carries the recognition anyway. The striped
   A-frame reads as Whataburger with no word on it, because it was built to be seen from a plane.
   The checkerboard reads as a feed store with no letters. So every surface a real object stamps is
   left blank on purpose. `FOOTBALL.md` has the fullest mark-by-mark table; the rule is universal.

3. **DRAW IT STRAIGHT.** These subjects are often absurd (a forty-thousand-dollar mum, a
   seventy-million-dollar high school stadium, boots inverted on a fence line) and the absurdity is
   real and is the point. An outsider winking at it reads as contempt and nothing after it lands.
   Draw the mum with the same care as a combine and let the absurdity be visible on its own.

4. **TRUE SCALE, always.** Every artifact is sized in real metres through its module's `*_M` table
   and `lib/scale.ts`, so a light mast is genuinely eight people tall and a raspa cup genuinely
   fits a hand. A drawing that is internally consistent but wrong in scale is wrong only in
   comparison, which is exactly where a viewer catches it. The review sheets put a person beside
   everything for this reason.

5. **MAINTAINED BUT WORN, AND NOTHING SYMMETRIC.** Default `wear` is about a third, and lopsidedness
   is seeded per instance, because a town drawn pristine and square reads as a rendering and a town
   drawn as a ruin reads as a stranger's contempt. The truth is in between and it is seeded so no
   two instances match.

---

## The modules, and the one tell each is built around

- **`flora`** — the plants a Texan places a frame by. The failure mode is the lollipop: every tree
  a green ball on a stick. The cure is silhouette (a live oak goes OUT before up, a pecan is an
  upright vase, a loblolly has no lower limbs) and SEASON as a prop (post oak holds dead brown
  leaves all winter, little bluestem goes copper for three weeks in October, ocotillo leafs out
  only after rain, so a leafed one is a weather report). Field-cover flora (bluestem, cordgrass,
  sorghum, cotton, wildflower verge) are stands, not specimens.

- **`skies`** — in most of the state the sky IS the landscape. On the Llano Estacado the horizon
  sits in the bottom eighth of the frame. The sky is the clock and the calendar: a blue-norther
  edge on the north horizon is November, a towering thunderhead is a summer afternoon, sea fog is
  February on the coast. Value STRUCTURE over prettiness. Refused: the clean purple gradient over
  red rock, which is Arizona; Texas evenings are hazy, layered, and full of piled cumulus.

- **`roadside`** — the drive-by Texas, for the far and mid planes. Two disciplines: form-not-mark
  (the striped A-frame, the checkerboard feed store, the gin's cyclone cluster, all legible with no
  words), and `closed` defaults FALSE on every building, because making every frame a boarded
  window is a stranger telling a town it is dead. The one deliberate exception is the dead pole
  sign with its panel pulled, and it is the heaviest card in the set.

- **`hometown`** — school, Friday night, and the year's rituals, the four years memory keeps in
  higher resolution than the rest of a life. The light is the subject on Friday night (halide vs
  LED is a one-frame era stamp; field green under artificial light goes acid). The band outnumbers
  the team, so the marching block is a first-class artifact. The small-town field and the suburban
  megastadium are both true and look nothing alike.

- **`homeplace`** — the house and the yard. Its whole argument, enforced by construction: the
  trailer house and the brick ranch go through the same light and the same wear default, so if one
  looks shabbier than the other the code is wrong, not the family. Soil color changes the ground
  under the house by region (east red clay, blackland dark, caliche pale, panhandle tan). The pool
  in three states (June blue, late-August green, gone) is a whole summer in one row.

- **`tejano`** — Tejano and border Texas, and the palette test: it should be LOUD. The stock
  border palette is sepia and a bleached wash; the real thing is the syrup rack, the concha crusts,
  the candy paint, the tissue paper. Heat comes from LIGHT, never from draining saturation. Candy
  paint is a gradient inside one panel, and that single decision separates a lowrider from a car.
  Nothing here is a sombrero or a serape, and the standing bans in `CULTURE.md` hold.

- **`blacktexas`** — the correction it exists for: Black Texas is coastal and rural and OLD before
  it is urban. Freedom was announced in a port (Galveston, Juneteenth). Black cowboys concentrated
  on the Coastal Plain between the Sabine and the Guadalupe. Barbecue smoke that is running right
  is thin and BLUE and lies low at dawn. Red is a meaning, not a theme color, and it predates the
  Waco soda by generations. The trail ride is current and loud on purpose, not a sepia memory.

- **`football`** — the game as equipment (the stadium and ritual are in `hometown`). See
  `FOOTBALL.md`. Same law, hardest case: the sport is a thicket of live marks and every one has a
  free form under it.

---

## Era markers — the one-frame date stamps

A single still can say WHEN it is, which is often the whole nostalgia. Reach for these before a
caption does the work:

| Object | Before | After |
|---|---|---|
| Stadium and yard lights | metal halide, warm white, amber edge, blooms in humid air (pre ~2015) | LED, cooler, bluer, hard edge |
| Scoreboard digits | incandescent amber, bloom | LED white, segment-crisp (~2012) |
| A painted shop sign (rótulo) | hand-lettered, baseline drifts, strokes swell | printed vinyl banner zip-tied over it (post ~2005) |
| Satellite | six-foot C-band mesh dish bolted to the yard | small Ku dish on the eave |
| The home A/C | window unit tilted to drain | central, a condenser pad beside the house |
| The preseason annual | thick newsprint on every counter in July | a website |

---

## The discipline that keeps this honest

- Every artifact is registered, so a board can place it, and `registry_check` proves every name
  resolves and every drawing is reachable.
- Every module has a review SHEET, because a drawing nobody has looked at is not finished. The
  sheets have already caught a blank material, a scale that buried the human figure, and a wrong
  cast id that no typecheck could see. `GATE_LESSONS` entry 20: without a sheet, nobody looks at all.
- Materials (`matFill`) resolve only where `MaterialDefs` is rendered. It is emitted once per scene
  plane and once per sheet, and the paint-id gate refuses a `url(#mat-*)` with no defs, because a
  missing pattern paints blank and the film completes with exit code 0 and nobody finds out.
