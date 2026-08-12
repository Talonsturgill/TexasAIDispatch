# Cultural handling — the provisions that are not style choices

The sibling engine carries an in-source note that its fur-ruff parka reads as Inupiat and
Inuit-coded, so the crowd uses everyday gear instead. That note exists because somebody thought
about it before a frame shipped, not after. This file is the Texas equivalent, written before the
cast is drawn.

**These are hard rules. A frame that breaks one does not ship, whatever else is good about it.**

---

## Retired motifs

**Six Flags Over Texas is retired.** One of the six is the Confederate flag, and the theme park of
that name removed them in 2017 **[V]**. Use the Republic-era Lone Star and the current state flag
only.

**Confederate monument imagery is a live fight, not decoration.** Texas has removed 31 Confederate
monuments, more than any state **[V]**. A courthouse square is a core Texas image and many squares
carry a contested monument. Draw the square without making the monument the subject, unless the
story is genuinely about it, in which case it is reported rather than staged.

**Lotería imagery and Day of the Dead iconography are appropriation, not shared culture.** Do not
use them as decoration or as shorthand for "Mexican-American Texas." Talavera tile GEOMETRY as a
pattern system is fine, because a geometric pattern is not a sacred or commercial image.

**The Alamo is not a free background.** It is a real site with contested history and an active
public argument about how it is presented. If a story is not about it, it is not in the frame.

---

## Communities, drawn as people rather than as texture

**Tejano and Mexican-American Texas is not a regional flavour of Texas, it is older than Anglo
Texas.** South Texas families whose land predates the state are not immigrants in the frame, and
drawing them as recent arrivals is a factual error, not a sensitivity one.

**Colonias are homes.** Unincorporated border-region settlements, often without full water or
wastewater service. If a story is about infrastructure, they are drawn with the dignity of a
place where people live: real houses, maintained, with the specific missing utility as the subject
rather than the people. **Never as a slum backdrop.**

**Border communities are ordinary.** El Paso and the Valley are large, established metros. A
border frame that reads as a checkpoint and nothing else is a national-media cliché and a Texan
from there sees it immediately.

**Black Texas is urban, rural, and coastal, not one thing.** Houston's Third Ward, the Blackland
Prairie freedom colonies, and the petrochemical corridor communities are distinct places with
distinct stories. Juneteenth originates in Galveston **[V]**, which is a Texas fact worth knowing
and not a decoration.

**Indigenous Texas is present tense.** Three federally recognised tribes: the Alabama-Coushatta,
the Kickapoo, and the Ysleta del Sur Pueblo **[V]**. They are contemporary governments, not
history. If a story touches tribal land or water rights, the tribe is a party with a position, and
we cite it. No generic feathers, no headdresses, no Plains iconography borrowed for a Texas frame.

**Vietnamese-American Gulf Coast communities** are a defining part of the coastal fishing economy
and of Houston. The base cast includes one for that reason.

---

## The engine-level rules that make this checkable

Prose provisions decay. These are enforced:

- **One head geometry system.** Every character's face is generated from the same shape parameters
  drawn from the same ranges. Skin is a fill token applied to that geometry and never changes the
  line work. This makes the caricature failure mode structurally hard rather than merely
  discouraged.
- **The skin ramp is evenly spaced** and the cast is distributed across it. A library where nine
  characters cluster at one end and one sits at the other has a default, whatever the roster says.
- **`staging_check.py` refuses a retired motif** by name: six-flags composites, Confederate
  imagery, lotería card layouts, calavera skulls, headdresses.
- **The cast is authored in one commit**, so the file's history cannot show a single character
  arriving first and becoming the default.

---

## The standard to hold

The test is not "would this offend someone." The test is **"would a Texan from that community
recognise themselves, and would they think the person who drew this had been there."**

That standard is the same one the whole show is held to. It is the vernacular law applied to
people instead of to landscape: **a Texan forgives a stylized drawing and does not forgive being
told they live somewhere they don't**, or that they are someone they aren't.
