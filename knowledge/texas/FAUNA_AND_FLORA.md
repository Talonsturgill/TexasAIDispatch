# Fauna and flora — drawn so a Texan nods

Every entry carries **the mistake** first, because the mistake is what an outsider draws and the
correction is the whole value of the entry.

Marks: **[V]** verified, **[U]** unverified, verify before it ships.

---

## The eight that carry the most recognition

Ranked by how many Texans know it on sight against how few illustrators draw it right.

### Great-tailed grackle

**The one to draw.** Every Texan knows it, nobody draws it. The parking-lot bird.

Bill open in display, tail folded to a **blade** held vertically rather than fanned. Iridescent
black that reads purple in the shoulder. Yellow eye. The male is much larger than the female, and
the female is brown, not black. Perched on a shopping-cart corral, a light pole, a wire **[V]**.

**Use it as the ambient bird in any metro or parking-lot frame.** It is our raven.

### Armadillo

**The mistake:** drawn dog-sized and trundling.

Actually **housecat-sized**, and **they jump straight up** when startled, which is why they die on
highways: they leap into the bumper **[V]**. That vertical leap is the single most characterful
pose available and it is genuinely funny.

Nine-banded. The bands are the drawable feature; the head is small and pointed.

### Javelina

**The mistake:** drawn as a pig. **It is not a pig** — a collared peccary, a different family
**[V]**.

Straighter back than a hog, longer legs proportionally, a pale collar across the shoulders, a mane
that raises when alarmed, and a blunt snout. Travels in a squadron.

### Pronghorn

**The mistake:** drawn jumping a fence.

**Pronghorn go UNDER fences, not over**, and this single fact is why fencing devastated them
**[V]**. Drawing one going under a bottom wire is both correct and quietly a whole story about
land.

Not an antelope. Horns are pronged and shed annually. Enormous eyes set high. Tan and white with a
white rump patch that flares when alarmed.

### Longhorn

**Horn shape differs by age and by sex** — check the breed association guidance before drawing a
specific animal **[V]**. A young cow's horns are not a mature steer's, and the postcard sweep is a
mature steer.

Colour is wildly variable and that variability is the point: brindle, roan, speckled, red, black.
A herd of identical longhorns is the tell.

### Roadrunner

**The mistake:** the cartoon. **Nothing like it** **[V]**.

Actually a large ground cuckoo: streaked brown, shaggy crest, long tail held level or cocked, blue
and orange bare skin behind the eye, and it runs with its head low and level. It is a predator and
it looks like one.

### Turkey vulture

Teetering in a shallow **V** (dihedral) over a two-lane road, rocking, rarely flapping **[U]**.
Two-tone underwing: dark forewing, pale flight feathers. The most honest way to put motion in an
empty rural sky.

### Cattle egret

**Standing on a cow's back** **[U]**. White, compact, short yellow bill. In a pasture frame it is
the detail that says this is a working landscape rather than scenery.

---

## The rest of the drawable bestiary

| animal | the note that matters |
|---|---|
| white-tailed deer | small-bodied in south Texas, larger in the north. Tail up and flared when fleeing |
| coyote | narrow, light, carries its tail DOWN when trotting, unlike a dog |
| jackrabbit | black-tailed. Enormous ears with visible vessels backlit. Lopes, does not hop |
| horned lizard | flat, spiny, round. Texas state reptile. Declining, so its presence is a statement |
| rattlesnake | western diamondback. Draw coiled or moving, never anthropomorphised |
| Mexican free-tailed bat | the Congress Avenue and Bracken emergences. A COLUMN, drawn as a ribbon of density, not individuals |
| mockingbird | state bird, grey with white wing flashes that show in flight, sings from the highest point available |
| red drum, largemouth bass, catfish, blue crab | coastal and freshwater. The blue crab's claw tips are the colour tell |
| feral hog | genuinely destructive, drawn rooting and tearing ground. Not cute |
| quarter horse | the working horse. Heavier muscled and shorter coupled than a thoroughbred |
| cattle egret, killdeer, scissor-tailed flycatcher | the scissor-tail's tail streamers open like shears in flight and it perches on wire |

---

## Flora, and the four that do the most work

### Mesquite

**Low, crooked, wide and lacy** **[V]**. Never a generic round tree. The canopy is wider than it
is tall, the trunk usually divides near the ground, and the leaflets are fine enough that light
comes through the whole crown. Thorns.

**It is the default tree for most of west and south Texas** and getting it wrong makes every frame
in those regions wrong at once.

### Live oak

Broad, low, spreading wider than tall, evergreen, with limbs that dip toward the ground and
sometimes rest on it. On the coast, **permanently leaned by the prevailing wind** **[V]**. Under
freezing rain the limbs bend and this is a real and drawable Texas event **[U]**.

### Prickly pear

Pads in a sprawling cluster. **Magenta tunas standing upright on the pad rims** **[U]**, yellow
flowers earlier. The pad is not a circle; it is an irregular paddle and the spine clusters follow a
spiral.

### Bluebonnet

The spike carries **white banner spots that turn magenta after pollination**, so a real spike shows
BOTH on the same stalk **[V]**. Drawing them all white is the tell. Leaves are palmate. They grow
in sheets on roadside right-of-way, which is a mowing policy, not an accident.

### The rest

Ashe juniper (called cedar, and the source of "cedar fever"), post oak, blackjack oak, loblolly
pine tall and straight, pecan in the bottoms, huisache with its orange puffball bloom, ocotillo as
bare whips that leaf out days after rain, lechuguilla as a low spined rosette, sotol, yucca with a
tall bloom stalk, cordgrass in the marsh.

---

## How the engine uses this

`fauna.tsx` exposes each animal as a component with `x`, `y`, `scale`, `f` (frame), `facing`, and
a per-species behaviour prop. The behaviours are the characterful ones from above, not a generic
idle: the armadillo's vertical leap, the pronghorn going under a wire, the grackle's blade tail,
the vulture's teeter, the bat column's density ribbon.

**Every animal is placed in a region that actually has it.** A pronghorn in the Piney Woods is the
same class of error as a Hill Country palette on a Panhandle story, and `staging_check.py` refuses
it.
