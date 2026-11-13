# LOOK V2. The blueprint for a Texas film a stranger stops for

Written November 13th, 2026. Code in `video-engine/src/look/`. Board checks in `scripts/lean.py`
(`tone_problems`). Numbers in `config/lean_routine.json` under `look`.

## Why this exists

The owner, November 13th, 2026, on the daily films:

> "it's very 2D. every corner is very sharp. Everything is faded colors. I want more pungent. I want
> you to think about how Apple MacBook they do it ... Sometimes I'll see a floating arm ... You could
> tell it's code as art ... I don't want them all to be negative. I want them to be educational."

The same day the TikTok retention curves were pulled read-only from Upload-Post.

| Film | Views | Still watching at 1s / 2s / 3s | At 20s | Average watch |
| --- | --- | --- | --- | --- |
| Texas, Nov 12, "The brush hides it" (119s) | 99 | 81% / 57% / 48% | 13% | 13.8s, 11.5% of runtime |
| Texas, Nov 11, "The empty seat" (54s) | 460 | 69% / 38% / 26% | n/a | 4.7s, 8.8% |
| Alaska, Nov 13 (136s) | 177 | 92% / 82% / 74% | n/a | 22.8s, 16.8% |

Half the Texas audience is gone by second three. The Alaska film keeps three in four. Viewers watch
about 21% of the average branded TikTok (Dash Social, 917 accounts, via eMarketer). The first three
seconds are the largest single gap, so they get the most rules below.

Followers at the same pull. Texas has 5 TikTok followers, 9 on Instagram and 5
YouTube subscribers. Alaska has 20, 402 and 172.

## What Alaska does that Texas did not

Read from the Alaska AI Weekly routine and its renders.

1. **A hero object with a face.** A personified machine carries the film. Faces hold eyes.
2. **A new saturated palette every day**, checked for divergence from recent films.
3. **Rim light and per-shot lighting arcs.** Things are lit, so they have volume.
4. **Parallax planes.** A front, a middle and a back that move at different speeds.
5. **A hook in the first frame** that states the stakes in words and pictures.

The Texas lane drew thin tube limbs in black ink over flat fills, under a hazy region plate, with
captions as a small transcript in the lower left and no hook text. Nothing in it was wrong by its
own rules. The rules were the problem.

## The ten rules of the look

Each rule names the evidence behind it. Where the evidence is craft practice rather than a study,
it says so.

1. **Round.** No sharp corner anywhere. Rounded joins and caps, blobs built from circles, panels
   with a 28px or larger radius. In Bar and Neta (Neuropsychologia, 2007) curved objects were liked
   62.9% of the time against 47.2% for sharp-angled versions, and sharp contours were rated more
   threatening. Small sample (about 16 people), but it backs the owner's complaint directly.
2. **Lit.** One key light from the upper left. Every form gets a light side, a shade side and a
   thin rim of light on the far edge that separates it from what is behind it. Shade is the fill's
   own hue pushed toward violet (`look/color.ts` `shade`), never toward black, so shadows keep
   their colour. Craft practice. Apple publishes no spec for its gradients.
3. **Grounded.** Anything that stands gets a soft contact shadow. Anything that flies drops a
   shadow on the ground beneath it. Kersten's ball-in-a-box demo shows the shadow alone decides
   whether an object sits or floats. This is the cure for the floating look.
4. **Attached.** A limb is one continuous rounded stroke that starts inside the body. Its outline
   is drawn first, a shoulder cap in the shirt colour covers the seam, then the sleeve, then the
   hand at the exact end of the forearm. `look/Figure.tsx` builds every person this way. This is
   the cure for the floating arm.
5. **Deep.** Far things are paler, bluer and lower in contrast (atmospheric perspective). A frame
   has a front, a middle and a back, and a camera move slides them at different speeds.
   `look/Kit.tsx` `Landscape` and `Bush depth` do it for you.
6. **Saturated, with harmony.** The grade lifts chroma by about half and splits highlights and
   shadows apart in hue. Saturation alone is not a proven lever (a 2024 Public Relations Review
   study found colourful climate stills drew slightly fewer likes), so every palette pairs a warm
   ground with a cool sky and spends one accent on the word or object that matters.
7. **Hue-tinted line.** Line work is each fill's own deep hue at 6 to 7 units (`look/color.ts`
   `line`). Black ink is what made the old films read as printed clip art.
8. **Faces on heroes.** The hero machine, the animal and the threat each get eyes with a
   catchlight, brows that act and a mouth that changes on the beat. Aggarwal and McGill (Journal of
   Consumer Research, 2007) found a smiling car grille liked more, but only when framed as a
   character whose features fit its role. So a drone is curious, a fly is menacing by its brows
   and never gory, and a calf is gentle.
9. **Alive.** Every hero breathes, bobs, blinks or sways from `frame`. A held frame is never frozen.
   Entrances use springs with about 15 to 30 percent overshoot (Apple, WWDC23 session 10158) and
   anticipate before big moves (Disney's principles, Johnston and Thomas, 1981).
10. **Type that a muted thumb reads.** About 69% of US adults watch with the sound off in public
    (Verizon Media and Publicis, 2019, 5,616 adults), and captions raised average view time 12% in
    Facebook's tests. Captions are big, centred, one phrase at a time, white with a deep outline,
    and the word being said sits on an accent pill. No credible study shows that the lit word beats
    a plain caption, so treat that part as craft, not proof.

## The first three seconds

TikTok's own guidance says to state the proposition in the first 3 seconds and land the hook in the
first 6. The measured gap says Texas loses it there.

- **The first frame shows somebody or something doing something**, already in motion, at a size a
  thumb can read. Never a title card, never a map, never a person standing still.
- **The hook line is on screen from frame one**, at most 8 words, in the board as `hook`. It is the
  film's question or stakes, never the title. It lands word by word in half a second, holds, and
  lifts away by 3.2 seconds (`look/Hook.tsx`).
- **The first sentence of narration pays the hook off within 6 seconds.**
- **Something changes before second three.** A snag pops free, a box locks, a number lands.

## The tone rotation

The owner does not want every film to be negative. Berger and Milkman (Wharton, 2012) found
high-arousal content is shared most, with awe raising sharing about 30% per standard deviation and
sadness lowering it 16%. Robertson and colleagues (Nature Human Behaviour, 2023, 105,000 Upworthy
tests) found each negative headline word raised clicks about 2.3%. So the rule is a stakes hook
followed by an awe or useful payoff, and the tone of the whole film rotates day to day.

Every v2 board declares one `tone`. It picks the grade (`look/tokens.ts` `GRADES`).

| Tone | How it should leave a viewer | Texas application example |
| --- | --- | --- |
| `wonder` | "I didn't know machines could do that" | a robot picking a cotton boll, a drone mapping a canyon |
| `explainer` | "Now I understand how that works" | how a model spots a leak on a pipeline camera |
| `win` | "That actually worked" | a clinic cutting a wait, a crew finishing a job sooner |
| `watch` | "That's worth keeping an eye on" | a pest, a failure, a risk the tool is aimed at |
| `people` | "I'd like to meet them" | the lineworker, the rancher, the teacher behind the tool |

`lean.py check --board` enforces three things on a v2 board. A tone must be declared. It must not
repeat the last edition's tone. At most two `watch` films may run in any seven days. A worrying story can
almost always be told as an explainer or a win. Find the angle where something is being built,
solved or learned.

## Motion and the camera

- **Every cut punches in.** The v2 camera adds a 6% scale punch with a short flash and a touch of
  motion blur on each cut after the first, then a slow push and drift (`DailyFilm.tsx`
  `v2Camera`). It reads as edited, not slideshowed.
- **Pose changes travel.** A Figure's arms move from the old pose to the new over 0.35 seconds
  (`fromPose`, `poseBlend`). Nothing pops.
- **A beat that lands gets a burst** (`Kit.tsx` `Burst`), so the eye knows where to look.

## The kit

| File | What it gives a film |
| --- | --- |
| `look/tokens.ts` | the v2 switch (`lookActive`, on only when the timed board says `look: "v2"`), the five tones and their grades |
| `look/Grade.tsx` | saturation and contrast lift, sky and ground colour, split tone, key light, vignette, film grain |
| `look/Captions.tsx` | big centred phrase captions with the spoken word lit, from the forced alignment |
| `look/Hook.tsx` | the first-frame hook line |
| `look/Chip.tsx` | the rounded glass label chip with an accent tab |
| `look/Figure.tsx` | the v2 person. Attached limbs, lit volume, acting face, nine poses, eight emotions, hats, hair, outfits, a ready cast (`castV2`) |
| `look/Kit.tsx` | `Landscape`, `Bush`, `HeroDrone`, `FlyV2`, `CalfV2`, `GlassPanel`, `ScanBox`, `Glow`, `Burst`, `ContactShadow`, easing helpers |
| `look/color.ts` | `shade`, `light`, `line`, `mix` |

`daily/episodes/sample-v2/BrushHidesV2.tsx` (registry id `look-v2-sample-1112`) is the worked
example. It redraws the first 24 seconds of the November 12th film shot for shot.

Old editions never change. Look v2 is a layer outside `src/lib/` and `src/modern/`. `lean.py time`
stamps `look: "v2"` on a board dated on or after `look.v2_from`, and the renderer turns v2 on only
from that stamp, so every storyboard shipped before it still renders from its exact bytes.

## What we chose not to do

The owner asked whether this means switching to JavaScript or Rust. It does not. The engine is
already React and TypeScript on Remotion, rendering in a headless browser, so CSS filters, SVG
gradients, blur and springs are all there. The ceiling was the drawing idiom, not the language. A
Rust renderer would add a build step and buy no visible quality.

3D (three.js) was considered and left for later. It would fix volume at the cost of every shelf
drawing, and the rules above get most of the way in 2D.

## How to tell if it worked

Pull the same Upload-Post post analytics after seven v2 editions and compare against the table
above. The targets, in order of importance.

1. Still watching at 3 seconds of 65% or more (from 48%).
2. Average watch of 21% of runtime or more (from 11.5%).
3. Still watching at 20 seconds of 30% or more (from 13%).

Views follow retention. If retention moves and views do not, the problem is distribution, not the film.

## Sources

- TikTok creative best practices. https://ads.tiktok.com/help/article/creative-best-practices?lang=en
- TikTok Creator Rewards. https://newsroom.tiktok.com/introducing-the-new-creator-rewards-program?lang=en
- TikTok tips for long-form creators. https://newsletter.tubefilter.com/p/tiktok-has-tips-for-long-form-creators
- Dash Social watch benchmark via eMarketer. https://www.emarketer.com/content/viewers-move-on-before-tiktok-videos-end
- Facebook caption tests. https://www.businessinsider.in/facebook-wants-advertisers-to-get-a-lot-better-at-silent-video/articleshow/50936233.cms
- Verizon Media and Publicis sound-off survey. https://www.streamingmedia.com/Articles/News/Online-Video-News/80-of-Video-Caption-Users-Arent-Hearing-Impaired-Finds-Verizon-131860.aspx
- Bar and Neta 2007. https://canlab.unl.edu/sites/unl.edu.cas.psychology.cognitive-and-affective-neuroscience/files/media/file/BarNetaNeuropsych2007.pdf
- Kersten shadow demo. https://kerstenlab.psych.umn.edu/demos/shadows
- Aerial perspective. https://psychlab1.hanover.edu/KRANTZ/art/aerial.html
- Apple, Animate with springs, WWDC23. https://developer.apple.com/wwdc23/10158
- Colourfulness and engagement, 2024. https://par.nsf.gov/servlets/purl/10500619
- Aggarwal and McGill 2007, summarized. https://www.chicagobooth.edu/review/car-smiling-at-me
- Berger and Milkman, What makes online content viral. https://faculty.wharton.upenn.edu/wp-content/uploads/2011/11/Virality.pdf
- Robertson et al. 2023, summarized. https://www.niemanlab.org/2023/03/negative-words-in-news-headlines-generate-more-clicks-but-sad-words-are-more-effective-than-angry-or-scary-ones/
- Kurzgesagt on its own style. https://kurzgesagt.org/youtube/
