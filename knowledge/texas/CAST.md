# The cast — built demographically first, on purpose

**This file exists because of one failure mode, and it is structural rather than accidental.**

> Vector libraries get built in the order they are needed, and the first character authored
> becomes the default reach forever. Left alone, that default is a white man in a hat.

So the cast is authored in ONE pass, before any episode needs a character. Nobody is added later
because a scene called for them, because "later" is how a library acquires a default.

## Cowboys, honestly

The owner asked for cowboys and cowboys are correct. A rancher in a straw hat and pearl snaps
opens the base set below. The Texas that a stranger stops scrolling for has hats in it.

**The trap is a cast that is only cowboys**, which is a costume drama about a state where most
people work in a metro. Both things are true at once and the library holds both.

**When a hat is real:**

- A rancher, a stock contractor, a sale-barn buyer, a feedyard hand. Every day, working.
- A Texas Ranger, a county sheriff, a constable. Uniform. **[V]**
- A rodeo competitor and rodeo staff.
- A norteño or conjunto musician, and a South Texas ranch hand, in a straw palm hat with a
  different crown and brim shape than an Anglo working hat.
- A politician at a rural event, which reads as *deliberate* and is drawn slightly too clean.

**When a hat is a costume**, and drawing it is the tell that an outsider made this:

- A Houston or Austin software executive in an office. They wear what executives wear anywhere.
- A data centre technician. Hard hat or bare, never a Stetson near a hot aisle.
- An oilfield worker on site. **Hard hat over a fire-resistant hood, always.** A cowboy hat on a
  rig floor is a safety violation and a Texan will spot it instantly.
- A city commuter, a nurse, a teacher, a state agency lawyer.

**The seasonal rule, which is drawable.** Straw from Easter to Labor Day, felt from Labor Day to
Easter **[V]**. Texans bend it because the heat runs past September, and *Texas Monthly*'s
Texanist has answered that question in print **[V]**. So a September frame may show either, and
**a January frame showing a straw working hat is wrong.** The Dispatch date decides.

**Shape.** A working hat's crease is hand-shaped and lopsided, the brim is rolled unevenly, and
the felt is sweat-marked at the band. A costume hat is symmetric and clean. Draw the difference.

**Etiquette, if a scene has an interior.** Hats come off indoors in a home or a formal setting.
Handling another person's hat is a serious breach **[V]**. If a character keeps a hat on inside a
diner, that is a characterisation choice and it reads as one.

---

## The base set

Authored together, in this order, so no single one becomes the default. Each is a full rig with
poses, emotions and the outfit system, not a variant.

| # | who | wearing | where they show up |
|---|---|---|---|
| 1 | **Hispanic woman engineer** | flame-resistant coveralls, hard hat, safety glasses, tablet | Permian, petrochemical, substation |
| 2 | **white rancher, older** | pearl-snap shirt, straw or felt working hat, jeans, boots | Panhandle, Rolling Plains, Hill Country |
| 3 | **Black woman executive** | business dress, no hat | Houston, Dallas, a committee room |
| 4 | **South Asian data centre technician** | polo, badge lanyard, hard hat in the yard | Abilene, DFW, San Antonio |
| 5 | **Vietnamese-American small business owner** | apron or work shirt | Gulf Coast, Houston |
| 6 | **Black petrochemical operator** | FR coveralls, hard hat, gas monitor clipped at the collar | Ship channel, Beaumont |
| 7 | **Hispanic man, norteño straw hat** | palm-straw hat, work shirt | South Texas, ranch, colonia, music |
| 8 | **white woman in scrubs** | scrubs, medical centre badge | Houston medical centre, a hospital AI story |
| 9 | **Black woman lineworker** | FR shirt, climbing harness, hard hat | transmission, grid restoration |
| 10 | **older Hispanic woman, civic** | ordinary clothes, reading glasses | a hearing, a public comment desk |

**Nobody in this set is a mascot for their beat.** The executive can be at a substation. The
rancher can be at a hearing. Casting against the obvious is how a cast stops being a lookup table.

---

## Drawing rules that are not negotiable

**Facial variation lives in shape language applied evenly across every character.** Skin tone is a
FILL VALUE that never changes the line work. In a thick-outline idiom, exaggerating lips, noses or
brow on some characters and not others slides into racial caricature without anyone intending it.
The engine enforces this by construction: one head geometry system, per-character parameters drawn
from the same ranges, and colour applied as fill only.

**Body variation is real and even.** Texas is not uniformly thin. Height, weight and posture vary
across the whole cast, not just on the characters where it reads as a joke.

**Age shows in posture and hands**, not in a caricature of a face.

**No accents in the drawing.** A character does not get "ethnic" clothing markers unless the scene
is genuinely about that context, and then it is specific rather than generic.

---

## Clothing by job, drawn correctly

| job | what they actually wear |
|---|---|
| oilfield, on site | FR coveralls or FR shirt and jeans, hard hat, safety glasses, steel toes, gloves in a back pocket, H2S monitor at the collar in sour service |
| data centre | polo or button-down, badge on a retractable reel, hard hat and hi-vis only in the yard and during construction |
| lineworker | FR shirt, climbing harness or bucket, hard hat with a face shield, rubber gloves with leather protectors |
| rancher, working | pearl snaps, jeans with a worn wallet ring, working hat, boots with real wear, a cap in summer as often as a hat |
| feedyard | gimme cap far more often than a cowboy hat, muck boots |
| refinery operator | FR coveralls, hard hat, gas monitor, radio |
| state agency staff | ordinary office wear, lanyard badge |
| legislator at the Capitol | suit, and in a rural district a hat carried rather than worn indoors |
| construction | hi-vis, hard hat, and in summer a wet neck rag |
| nurse or tech | scrubs, badge, stethoscope only if clinical |

**The gimme cap is the most-worn hat in working Texas** and the least-drawn. A seed-company or
oilfield-services logo, sweat-stained at the band, worn indoors **[U]**. Draw it more often than
a Stetson and the cast reads instantly more true.

---

## What the engine needs from this file

`Character.tsx` exposes:

- `outfit`: `fr-coveralls` | `pearl-snaps` | `business` | `scrubs` | `polo-badge` | `hi-vis` |
  `work-shirt` | `apron` | `suit` | `line-fr`
- `headgear`: `bare` | `felt-hat` | `straw-hat` | `palm-straw` | `gimme-cap` | `hard-hat` |
  `hard-hat-hood` | `ball-cap` | `scrub-cap`
- `skin`, as a fill token from an evenly-spaced ramp, never tied to feature geometry
- `build`, `age`, `hair`, all sampled from ranges shared by every character

**The hat and the outfit are validated against each other.** `hard-hat` with `pearl-snaps` is
fine, a rancher at a construction site. `felt-hat` with `fr-coveralls` on a rig floor is refused
by the gate, because it is a safety violation a Texan reads as a mistake.

## Sources

- [Texas Monthly, The Texanist on straw versus felt after Labor Day](https://www.texasmonthly.com/being-texan/texas-hats-labor-day-heat/)
- [Resistol, switching from felt to straw](https://resistol.com/pages/switching-from-felt-to-straw)
- Cowboy hat etiquette, multiple concurring trade sources on removal indoors and handling another
  person's hat.
