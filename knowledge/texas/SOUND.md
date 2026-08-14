# Sound — the Texas foley, hand-synthesized and motivated

`scripts/foley.py` is the engine. This is the doctrine: why the sound side is built the way the
picture side is, what each sound is, and the mistake each one corrects. A sound nobody has HEARD is
not finished, so `foley.py --audition out.wav` writes the whole library end to end for a listen,
the ear's version of the visual review sheets.

## The three laws

1. **HAND-SYNTHESIZED, never sourced.** The drawings are hand-built SVG because a downloaded image
   carries a licence and a look that is not ours. A downloaded sound carries the same two problems,
   so every sound is built from oscillators and filtered noise in `foley.py`. There is no clip in
   this repo that belongs to anyone else, and there is nothing to clear.

2. **MOTIVATED, tied to a thing on screen.** `flow_check` bans a beat marked only by a generic
   library cue and demands a sound that belongs to something in the frame. So the catalog is keyed
   by the Texas thing each sound IS, and every entry carries its on-screen motivation. A pumpjack
   sound goes on a shot with a pumpjack in it. There is no "tension riser", no "whoosh", no
   "ambience_generic" here, because a sound that belongs to nothing marks nothing.

3. **GENERATED, never committed.** A wav is a deterministic function of `foley.py`, so the wavs are
   built on demand into `assets/sfx/` (gitignored) and only the small `catalog.json` is tracked.
   Committing ten megabytes of derivable audio is the same mistake as committing a built site.

## The contract

48000 Hz, mono, float. `vo_synth_gemini` resamples the voice to 48k and `mix.py` refuses any sfx at
a different rate, deliberately, because it has no resampler in it. Everything `foley.py` emits is
48k mono or it is useless. Each sound is normalized to about 0.9 peak; `mix.py` sets the working
level per event through its `gain`, and ducks everything under the voice from an envelope measured
off the voice track itself.

## The mistake each sound corrects

The reason this is a Texas library and not a generic one is that the default version of each of
these is wrong in a way a Texan hears immediately.

**Ambience beds** (loopable, tied to a place):
- **cicada_wall** — Texas summer is not birdsong. It is a WALL of cicadas at a specific pulse near
  40 Hz, many of them a hair out of phase so the wall breathes. Nine layers, each detuned.
- **cricket_night** — the night version is SPARSE, a single cricket in rhythmic bursts over still
  air, not the dense daytime wall.
- **blue_norther** — a norther is not a steady howl. It is a GUST whose pitch DROPS as the cold
  front hits, so the resonant band glides down through each swell.
- **dust_wall** — the High Plains haboob is a low rumble that SWELLS in, grit on top, a hard wall
  because there is no terrain to break it up. The rumble dominates, the grit is a topping.
- **gulf_surf** — the coast is BROWN-GREEN not blue, shallow sediment-heavy sets over the Laguna
  Madre, a gull now and then far from any shore.
- **friday_night_crowd** — the glow you hear before you see: a murmur that SWELLS to a roar with a
  distant drumline under it, a living crowd and not a single loop.
- **rain_on_tin** — drops on a RESONANT metal roof, each ringing the panel, not landing dead.
- **highway_pass** — a single vehicle approaching and receding on a two-lane, brighter as it nears,
  then the crickets again. Distance, drawn in sound.
- **cattle_auction** — the sale barn chant, a rhythmic ratatat over a low room, an institution you
  hear from the lot.

**One-shots** (tied to a thing):
- **pumpjack** — the Permian metronome, a slow GROAN as the beam rises and a metal CLANK at the top
  of each stroke, one stroke every two seconds.
- **windmill_creak** — the Aermotor over a stock tank, a periodic metal creak and a faint rod knock,
  unhurried.
- **screen_door** — a spring TWANG that slides in pitch, then the wood SLAP, then a small bounce.
- **diesel_idle** — a one-ton lopes, firing pulses near 22 Hz over a rumble, felt not heard bright.
- **longhorn_low** — a formant call that glides down and cracks, the single most placing farm sound.
- **grackle** — the parking-lot bird, our raven: a rising mechanical whistle, a volley of clicks, a
  squeaky-hinge readle-eak. Ugly and unmistakable.
- **mockingbird** — the state bird, and the tell is REPETITION, each phrase run two or three times
  before it switches.
- **rattlesnake** — a dry dense high buzz that starts fast and holds.
- **bobwhite_quail** — the brush-country whistle that says its own name, a clear two-note rise.
- **coyote_yip** — a rising yip breaking into a wavering howl, one animal that sounds like several.
- **train_horn** — the grade crossing, long-long-short-long, a minor chord of detuned air horns.
- **courthouse_bell** — the square's hour bell, a bronze strike with inharmonic partials and a long
  hum, the one vertical sound in a flat town.
- **spurs_jingle** — bright rowel jingles at a gait, boots without a boot.
- **dominoes_click** — hard bakelite clicks on a wooden table, the ice house and the washateria.
- **paletero_bells** — the paletero's brass bells, the colonia's clock at dusk.
- **conjunto_accordion** — a stab of the border's reed, a bright chord with the bellows swell and the
  beating of un-tempered reeds. A STAB for a transition, never a whole song, because a song is a
  live work.
- **drumline_cadence** — the band that outnumbers the team, a rudimental snare pattern with a bass
  on the beat.
- **ref_whistle** — a pea whistle, two close tones beating with the pea's warble.
- **pads_pop** — the hit, a low body thud and a hard plastic crack together, then nothing.
- **thunder_far** — a long low roll with no crack, a storm an hour away that a Panhandle audience
  reads as weather arriving.
- **thunder_near** — a sharp CRACK first, then the rumble collapses behind it. The order matters, or
  it reads as far.
- **gas_pump** — the old mechanical pump, the handle clunk then the dial-wheel tick as it fills.

## How the routine uses it

Phase order: build the library once (`foley.py --build assets/sfx`), then when the board places a
motivated sound, look up the thing on screen in `assets/sfx/catalog.json`, and write the event into
`sfx_events.json` with the catalog's `wav` path, an `at_s`, a `dur_s`, a `gain`, and a `what` that
names the on-screen thing (so `flow_check` sees the motivation). `mix.py` loads the wav, places it,
ducks it under the voice and normalizes the master. Never time-stretch a sound to fit, the same rule
the voice follows.

## What is deliberately NOT here

Music. A bed of licensed or generated music is a different problem with a different law (a song is a
live work, a composition question, and a rights question), and it is not solved by dropping a track
under the picture. The `conjunto_accordion` STAB is the one musical gesture, and it is a one-shot
transition sound, not a score. Scoring is a separate decision, tracked apart from this library.
