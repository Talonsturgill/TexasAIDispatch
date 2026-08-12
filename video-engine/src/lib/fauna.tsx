import React from 'react';
import {tones, FormGradient, ContactShadow, useLight, INK} from './lighting';

// =============================================================================
// FAUNA — the animals, drawn so a Texan nods.
//
// knowledge/texas/FAUNA_AND_FLORA.md leads every entry with THE MISTAKE, because
// the mistake is what an outsider draws and the correction is the entry's whole
// value. The same order holds here: each component's comment says what is usually
// wrong before it says what this one does.
//
// -----------------------------------------------------------------------------
// EVERY ANIMAL IS DRAWN AT TRUE SIZE. This is the load-bearing decision.
//
// The first version of this file drew each species in whatever local frame was
// convenient, so `scale={1}` meant nothing across species and an armadillo beside
// a longhorn came out the same size. That is the doctrine's own headline mistake
// ("drawn dog-sized") reintroduced by the API, one layer below where anybody would
// look for it. A comment saying "housecat-sized" cannot stop it. Arithmetic can.
//
// The Character rig spans 610 draw units from sole to crown for a 1.70 m person,
// so 610 / 1.70 is the conversion that makes ONE scale mean one thing everywhere.
// Every species below declares its real dimension in SIZE_M, draws in a local
// frame chosen for readable path data, and multiplies by `fit()`. Put a person at
// scale 1 and a longhorn at scale 1 in the same scene and the relationship is
// right without anyone thinking about it.
// -----------------------------------------------------------------------------
//
// EVERY ANIMAL BELONGS TO REGIONS. A pronghorn in the Piney Woods is the same
// class of error as a Hill Country palette on a Panhandle story, so each species
// carries a HABITAT list and the staging gate can refuse a mis-placed animal.
// =============================================================================

/** Draw units per metre, from the Character rig: 610 units sole to crown at 1.70 m. */
const M = 610 / 1.7;

/**
 * Real-world size of every animal here, and which dimension the drawing is fitted
 * to. These are the numbers that make `scale={1}` correct beside a person, so they
 * are measurements rather than art direction and they belong in the source where
 * the drawing can be checked against them.
 */
export const SIZE_M: Record<string, {ref: number; dim: 'height' | 'length' | 'wingspan'}> = {
  grackle: {ref: 0.22, dim: 'height'},          // perched, male
  armadillo: {ref: 0.22, dim: 'height'},        // at the shell, housecat-sized
  pronghorn: {ref: 0.87, dim: 'height'},        // at the shoulder
  turkeyVulture: {ref: 1.7, dim: 'wingspan'},
  longhorn: {ref: 1.45, dim: 'height'},         // at the shoulder
  roadrunner: {ref: 0.3, dim: 'height'},
  cattleEgret: {ref: 0.5, dim: 'height'},
  mockingbird: {ref: 0.16, dim: 'height'},      // perched
  jackrabbit: {ref: 0.55, dim: 'height'},       // ears up
  whitetail: {ref: 0.95, dim: 'height'},        // at the shoulder
  hornedLizard: {ref: 0.11, dim: 'length'},
  feralHog: {ref: 0.85, dim: 'height'},         // at the shoulder
  javelina: {ref: 0.55, dim: 'height'},
  coyote: {ref: 0.6, dim: 'height'},
};

/** Local-frame reference dimension to true scale. `local` is measured off the paths. */
const fit = (species: keyof typeof SIZE_M, local: number) => (SIZE_M[species].ref * M) / local;

interface Beast {
  x?: number; y?: number; scale?: number; frame: number; facing?: 1 | -1; seed?: number;
}

const rnd = (seed: number, ch: number) => {
  const k = ((seed * 2654435761) ^ (ch * 40503)) >>> 0;
  return ((k >>> 8) % 10000) / 10000;
};

/** Which regions an animal actually occurs in. Checked by the staging gate. */
export const HABITAT: Record<string, string[]> = {
  grackle: ['blackland', 'gulf', 'post_oak', 'cross_timbers', 'south_texas', 'rolling_plains',
            'hill_country', 'high_plains'],
  // Nine-banded armadillos have kept expanding and now reach well into the Rolling
  // Plains. Aridity, not cold, is what still holds them out of the far Trans-Pecos
  // and the driest High Plains.
  armadillo: ['post_oak', 'blackland', 'piney_woods', 'cross_timbers', 'south_texas', 'gulf',
              'hill_country', 'rolling_plains'],
  pronghorn: ['high_plains', 'trans_pecos', 'rolling_plains'],
  turkeyVulture: ['high_plains', 'rolling_plains', 'cross_timbers', 'blackland', 'post_oak',
                  'piney_woods', 'gulf', 'south_texas', 'hill_country', 'trans_pecos'],
  longhorn: ['hill_country', 'cross_timbers', 'south_texas', 'rolling_plains', 'post_oak'],
  roadrunner: ['trans_pecos', 'south_texas', 'high_plains', 'rolling_plains', 'hill_country'],
  cattleEgret: ['gulf', 'blackland', 'post_oak', 'south_texas'],
  mockingbird: ['blackland', 'post_oak', 'cross_timbers', 'gulf', 'south_texas', 'hill_country',
                'piney_woods', 'rolling_plains', 'high_plains', 'trans_pecos'],
  jackrabbit: ['high_plains', 'rolling_plains', 'trans_pecos', 'south_texas', 'cross_timbers'],
  whitetail: ['hill_country', 'post_oak', 'piney_woods', 'cross_timbers', 'south_texas',
              'blackland', 'rolling_plains'],
  hornedLizard: ['trans_pecos', 'high_plains', 'rolling_plains', 'south_texas', 'cross_timbers'],
  // Feral hogs are in nearly every county in the state. A narrow list here would be
  // wrong about the one animal whose whole story is that it is everywhere.
  feralHog: ['post_oak', 'piney_woods', 'gulf', 'south_texas', 'blackland', 'cross_timbers',
             'hill_country', 'rolling_plains', 'high_plains', 'trans_pecos'],
  javelina: ['south_texas', 'trans_pecos', 'hill_country'],
  coyote: ['high_plains', 'rolling_plains', 'cross_timbers', 'blackland', 'post_oak',
           'piney_woods', 'gulf', 'south_texas', 'hill_country', 'trans_pecos'],
  // The free-tailed emergences that are worth drawing are Balcones-country caves and
  // bridges: Bracken outside San Antonio, Congress Avenue in Austin. The species
  // ranges wider, but a COLUMN belongs where the roosts are.
  batColumn: ['hill_country', 'blackland', 'south_texas', 'trans_pecos', 'rolling_plains'],
};

// =============================================================================
// GREAT-TAILED GRACKLE — the one to draw. Every Texan knows it, nobody draws it.
//
// THE TELL: the tail is folded to a BLADE and it is LONG, nearly the length of the
// body, held straight back or cocked. Not a fan, not a stub. Iridescent black
// reading purple in the shoulder, a pale yellow eye, a stout bill about as long as
// the head, and long legs. The male is much larger than the female, the female is
// BROWN not black, and her tail is proportionally shorter as well as smaller.
//
// Perched on a shopping-cart corral, a light pole, a wire. It is our raven, and it
// is the ambient bird in any metro or parking-lot frame.
// =============================================================================
export const Grackle: React.FC<Beast & {female?: boolean; calling?: boolean; tailUp?: boolean}> = ({
  x = 0, y = 0, scale = 1, frame, facing = 1, seed = 1,
  female = false, calling = false, tailUp = false,
}) => {
  const K = fit('grackle', 60) * (female ? 0.78 : 1);   // local frame: 60 units perched
  const bob = Math.sin(frame / 7 + rnd(seed, 1) * 6) * 1.2;
  const gape = calling ? 5 + Math.sin(frame / 5) * 3 : 0;
  const body = female ? '#7a6650' : '#181924';
  const sheen = female ? '#96806a' : '#3d3057';
  const belly = female ? '#a8927a' : '#20212e';
  // The female's tail is shorter in proportion, not only in size.
  const tail = female ? 30 : 40;
  const rise = tailUp ? 20 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * K * facing} ${scale * K})`}>
      <ContactShadow cx={-4} cy={1} rx={13} opacity={0.2} blur={4} />
      <g transform={`translate(0 ${bob})`}>
        {/* long legs, which a perched grackle actually stands on */}
        <path d="M-2,0 L-3,-17 M5,0 L5,-17" stroke="#2a2a30" strokeWidth={2.4} strokeLinecap="round" />
        <path d="M-6,0 h8 M1,0 h8" stroke="#2a2a30" strokeWidth={2} strokeLinecap="round" />

        {/* THE BLADE TAIL: long, narrow, folded to a keel. Never fanned.
            Held CLEAR of the ground. A grackle standing on asphalt carries the tail
            up behind it; the first version ran the tip into the ground line, which
            reads as a broken bird. */}
        <path
          d={`M-9,${-31 - rise * 0.3} L${-9 - tail},${-18 - rise} L${-7 - tail},${-11 - rise}
              L-6,${-23 - rise * 0.3} Z`}
          fill={body} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
        {/* the keel fold, which is why it reads as a blade and not a paddle */}
        <path d={`M-8,${-27 - rise * 0.3} L${-8 - tail * 0.92},${-15 - rise * 0.95}`}
          stroke={sheen} strokeWidth={1.4} opacity={0.7} />

        {/* body, tilted so it is not a horizontal egg */}
        <g transform="rotate(-9)">
          <ellipse cx={0} cy={-29} rx={15} ry={10.5} fill={body} stroke={INK} strokeWidth={2.6} />
          <ellipse cx={-2} cy={-25} rx={11} ry={6} fill={belly} opacity={0.9} />
          {/* the shoulder sheen, the whole reason to draw a grackle in colour */}
          <ellipse cx={2} cy={-33} rx={9} ry={4.6} fill={sheen} opacity={0.85} />
        </g>

        {/* neck and head */}
        <path d="M7,-34 q4,-4 6,-6" stroke={body} strokeWidth={9} fill="none" strokeLinecap="round" />
        <circle cx={13} cy={-43} r={7} fill={body} stroke={INK} strokeWidth={2.6} />
        <path d="M9,-48 q5,-4 9,-2" stroke={sheen} strokeWidth={2.6} fill="none" opacity={0.8} />
        {/* stout bill, about head length, faintly decurved. Not a kingfisher spike. */}
        <path d={`M18,-46 q8,1.5 11,4.5 q-4,${2.5 + gape * 0.25} -11,${2 + gape * 0.2} Z`}
          fill="#22222a" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
        {gape > 0 && (
          <path d={`M18,-43 q7,${1 + gape * 0.5} 10,${2 + gape * 0.7} q-5,0 -10,-1 Z`}
            fill="#5c2b2b" stroke={INK} strokeWidth={1.6} />
        )}
        <circle cx={15} cy={-45} r={2.1} fill="#e8cf62" stroke={INK} strokeWidth={1.2} />
        <circle cx={15.4} cy={-45} r={0.9} fill={INK} />
      </g>
    </g>
  );
};

// =============================================================================
// NORTHERN MOCKINGBIRD — the state bird, by statute, and therefore never a wrong
// choice in a Texas frame.
//
// THE TELL: grey above, pale below, a LONG tail usually cocked, and WHITE WING
// FLASHES. The white is two patches at the base of the primaries. At rest it is a
// white slash on the folded wing; in flight and in display it is a bold flash, and
// leaving it out is the difference between a mockingbird and a grey bird.
//
// It sings from the highest point available, which is exactly what makes it useful
// on a fence post, a light standard or the top of a transformer.
// =============================================================================
export const Mockingbird: React.FC<Beast & {singing?: boolean; flashing?: boolean}> = ({
  x = 0, y = 0, scale = 1, frame, facing = 1, seed = 8, singing = false, flashing = false,
}) => {
  const K = fit('mockingbird', 46);                     // local frame: 46 units perched
  const bob = Math.sin(frame / 9 + rnd(seed, 1) * 6) * 0.9;
  // Singing lifts the head and works the bill; the wing flash is a separate display.
  const gape = singing ? 2.4 + Math.sin(frame / 4) * 2 : 0;
  const lift = singing ? 4 : 0;
  const flash = flashing ? 0.5 + Math.sin(frame / 6) * 0.5 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * K * facing} ${scale * K})`}>
      <ContactShadow cx={-3} cy={1} rx={9} opacity={0.18} blur={3} />
      <g transform={`translate(0 ${bob})`}>
        <path d="M-1,0 L-2,-12 M4,0 L4,-12" stroke="#3a3a40" strokeWidth={1.8} strokeLinecap="round" />
        {/* long tail, cocked, with white outer feathers */}
        <path d="M-7,-22 L-30,-6 L-28,-1 L-5,-15 Z" fill="#5e6068" stroke={INK}
          strokeWidth={1.8} strokeLinejoin="round" />
        <path d="M-8,-20 L-29,-4" stroke="#e8e6e0" strokeWidth={1.6} opacity={0.9} />
        {/* body: grey back, pale breast */}
        <ellipse cx={0} cy={-22} rx={11} ry={8} fill="#7d8087" stroke={INK} strokeWidth={2.2} />
        <path d="M-6,-16 q7,4 15,-2 q-3,6 -11,6 q-5,-1 -4,-4 Z" fill="#ddd8cd" />
        {/* THE WING FLASH. Folded it is a white slash; in display the wing lifts and opens. */}
        <g transform={`rotate(${-flash * 42} -2 -26)`}>
          <path d="M-9,-26 q9,-3 15,3 q-7,5 -15,3 Z" fill="#6b6e76" stroke={INK} strokeWidth={1.8} />
          <path d={`M-6,-24 q${6 + flash * 5},-1 ${9 + flash * 7},2`} stroke="#f2efe8"
            strokeWidth={2.8} fill="none" strokeLinecap="round" />
        </g>
        {/* head, lifted when singing because that is what they do */}
        <g transform={`translate(0 ${-lift})`}>
          <circle cx={10} cy={-31} r={5.6} fill="#7d8087" stroke={INK} strokeWidth={2.2} />
          {/* the dark eye line, a real field mark */}
          <path d="M7,-33 q4,-1 7,0" stroke="#3d4046" strokeWidth={1.6} />
          <path d={`M14,-33 q6,0.8 8,3 q-3,${1.8 + gape * 0.5} -8,${1.4 + gape * 0.4} Z`}
            fill="#2e2e34" stroke={INK} strokeWidth={1.6} />
          {gape > 0 && <path d={`M14,-31 q6,${gape} 8,${gape * 1.3} q-4,0 -8,-0.8 Z`} fill="#4f2a2a" />}
          <circle cx={11.5} cy={-33} r={1.5} fill="#d8cf9a" stroke={INK} strokeWidth={0.9} />
        </g>
      </g>
    </g>
  );
};

// =============================================================================
// ARMADILLO — THE MISTAKE: drawn dog-sized and trundling.
//
// It is HOUSECAT-SIZED, and it JUMPS STRAIGHT UP when startled, which is why they
// die on highways: they leap into the bumper. That vertical leap is the most
// characterful pose in the whole bestiary and it is genuinely funny.
//
// Two things the first version got wrong and a render caught. The shell is not a
// smooth dome with lines on it, which reads as a tortoise: it is a FRONT SHIELD, a
// BANDED MIDSECTION and a REAR SHIELD, and the nine bands only cross the middle.
// And the ears are tall, upright and nearly rabbit-like, which is most of what
// makes the head read at all.
//
// The tail is a STIFF TAPERED CONE, held out. Never a noodle.
// =============================================================================
export const Armadillo: React.FC<Beast & {leap?: number; rooting?: boolean}> = ({
  x = 0, y = 0, scale = 1, frame, facing = 1, seed = 2, leap = 0, rooting = false,
}) => {
  const L = useLight();
  const t = tones('#a89478', L);
  const K = fit('armadillo', 26);                       // local frame: 26 units at the shell
  // Fast up, slower down, legs splayed at the top.
  const hop = leap > 0 ? Math.sin(Math.min(1, leap) * Math.PI) : 0;
  const lift = hop * 40;
  const splay = hop * 15;
  const snuffle = rooting ? Math.sin(frame / 6) * 2 : 0;
  const uid = `ar${seed}`;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * K * facing} ${scale * K})`}>
      <defs><FormGradient id={`${uid}_s`} t={t} softness={0.55} /></defs>
      {/* THE SHADOW STAYS ON THE GROUND. It sits OUTSIDE the lifted group, which is
          the structural fix: the first version put it inside and corrected with a
          fraction of the lift, so it floated along under the leaping animal. */}
      <ContactShadow cx={-2} cy={1} rx={20 - hop * 7} opacity={0.24 - hop * 0.11} blur={5 + hop * 4} />
      <g transform={`translate(0 ${-lift}) rotate(${rooting ? 6 : 0})`}>
        {/* short stout legs with claws, splayed at the top of a leap */}
        {[[-15, -1], [-7, -1], [9, 1], [16, 1]].map(([lx, dir], i) => (
          <g key={i}>
            <path d={`M${lx},-10 l${dir * (2 + splay * 0.35)},9`} stroke="#7a6a52"
              strokeWidth={4.2} strokeLinecap="round" />
            <path d={`M${lx + dir * (2 + splay * 0.35)},-1.5 l${dir * 3},1.5`} stroke="#5f5340"
              strokeWidth={2} strokeLinecap="round" />
          </g>
        ))}

        {/* the carapace, in its three real parts */}
        <path d="M-25,-10 q0,-9 5,-12 l7,-2 l0,17 Z" fill={`url(#${uid}_s)`}
          stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        <path d="M12,-11 q10,-1 13,4 q1,4 -1,7 l-12,1 Z" fill={`url(#${uid}_s)`}
          stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        <path d="M-14,-9 q2,-16 14,-17 q10,0 12,15 q-13,5 -26,2 Z" fill={`url(#${uid}_s)`}
          stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        {/* THE NINE BANDS, across the middle only, with real gaps between them */}
        {[-12, -9, -6, -3, 0, 3, 6, 9, 11].map((bx, i) => (
          <path key={bx} d={`M${bx},${-24 + Math.abs(i - 4) * 0.9} q1.4,8 ${0.4},14`}
            stroke={INK} strokeWidth={1.9} fill="none" opacity={0.75} />
        ))}

        {/* small pointed head on a short neck, with the long snout */}
        <g transform={`translate(0 ${snuffle})`}>
          <path d="M23,-15 q10,0 15,4 q-2,4 -6,4 q-6,0 -9,-2 Z" fill="#b5a184"
            stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
          <path d="M34,-11 q5,0 6,2 q-3,2 -6,1 Z" fill="#9a8a72" stroke={INK} strokeWidth={2} />
          {/* THE EARS: tall, upright, nearly rabbit-like. Most of what makes the head read. */}
          <path d="M24,-17 q-1,-9 3,-10 q3,2 2,10 Z" fill="#9c8b70" stroke={INK} strokeWidth={2.2} />
          <path d="M29,-17 q0,-8 4,-8 q2,2 1,8 Z" fill="#9c8b70" stroke={INK} strokeWidth={2.2} />
          <circle cx={28} cy={-12} r={1.4} fill={INK} />
        </g>

        {/* THE TAIL: a stiff tapered cone with ring segments, held out. Not a noodle. */}
        <path d="M-24,-13 L-52,-3 L-51,0 L-24,-8 Z" fill="#9a8a6e" stroke={INK}
          strokeWidth={2.4} strokeLinejoin="round" />
        {[0.25, 0.5, 0.75].map((p) => (
          <path key={p} d={`M${-24 - 28 * p},${-13 + 10 * p} l0,${4.5 - 2.5 * p}`}
            stroke={INK} strokeWidth={1.5} opacity={0.6} />
        ))}
      </g>
    </g>
  );
};

// =============================================================================
// PRONGHORN — THE MISTAKE: drawn jumping a fence.
//
// PRONGHORN GO UNDER FENCES, NOT OVER, and that single fact is why fencing
// devastated them. Drawing one going under a bottom wire is correct AND is quietly
// a whole story about land, which is why `underFence` is a real crouch here and not
// a nudge: the chest drops nearly to the ground, the front legs fold at the knee,
// the neck goes forward and LOW, and the rump stays high.
//
// Not an antelope. The horns are BLACK, taller than the head is long, back-curving
// at the tip with a forward PRONG partway up, and they are substantial rather than
// a wire. Strongly two-toned: tan back, white belly and flanks, two white throat
// bands. Enormous eye set high and far back on the skull. The white rump patch is
// on the REAR, wrapping the back end, and the hairs ERECT when it is alarmed, which
// is what makes it flash. It is not a disc on the ribs.
// =============================================================================
export const Pronghorn: React.FC<Beast & {underFence?: number; alarmed?: boolean; doe?: boolean}> = ({
  x = 0, y = 0, scale = 1, frame, facing = 1, seed = 3,
  underFence = 0, alarmed = false, doe = false,
}) => {
  const L = useLight();
  const t = tones('#c9a978', L);
  const K = fit('pronghorn', 90);                       // local frame: 90 units at the shoulder
  const uid = `ph${seed}`;
  const duck = Math.max(0, Math.min(1, underFence));
  // The chest really does go almost to the ground. 90 local units is 0.87 m at the
  // shoulder, so a body centre that starts at 0.76 m has to come down to about
  // 0.30 m to clear a bottom wire hung at 0.16 m. That is 48 local units, and the
  // first version used 34, which left the animal standing THROUGH the fence rather
  // than going under it. The number is derived from the wire height, not chosen.
  const drop = duck * 48;
  const breathe = Math.sin(frame / 21 + rnd(seed, 1) * 6) * 1.1;
  const WHITE = '#f4efe4';
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * K * facing} ${scale * K})`}>
      <defs><FormGradient id={`${uid}_b`} t={t} softness={0.6} /></defs>
      <ContactShadow cx={0} cy={1} rx={40} opacity={0.26} blur={7} />

      {/* hind legs stay long; the front pair FOLDS at the knee to get under */}
      {[-30, -24].map((lx, i) => (
        <g key={`h${i}`}>
          <path d={`M${lx},${-62 + drop * 0.35} L${lx - 3},${-30}`} stroke="#a08a63" strokeWidth={5}
            strokeLinecap="round" />
          <path d={`M${lx - 3},-30 L${lx + 1},0`} stroke="#8a7350" strokeWidth={3.6}
            strokeLinecap="round" />
        </g>
      ))}
      {[20, 27].map((lx, i) => (
        <g key={`f${i}`}>
          <path d={`M${lx},${-64 + drop} L${lx + duck * 9},${-32 + drop * 0.5}`} stroke="#a08a63"
            strokeWidth={5} strokeLinecap="round" />
          <path d={`M${lx + duck * 9},${-32 + drop * 0.5} L${lx + 2 + duck * 22},${-duck * 2}`}
            stroke="#8a7350" strokeWidth={3.6} strokeLinecap="round" />
        </g>
      ))}

      {/* body: a deep chest and a narrower rump, not an ellipse */}
      <path
        d={`M-32,${-78 + drop + breathe}
            C-24,${-92 + drop} 4,${-95 + drop} 22,${-90 + drop}
            C32,${-86 + drop} 34,${-72 + drop} 29,${-64 + drop}
            C18,${-56 + drop} -12,${-55 + drop} -26,${-60 + drop}
            C-32,${-66 + drop} -34,${-72 + drop} -32,${-78 + drop} Z`}
        fill={`url(#${uid}_b)`} stroke={INK} strokeWidth={3.4} strokeLinejoin="round" />
      {/* WHITE BELLY AND FLANK. Pronghorn are strongly two-toned and a flat tan body
          is the tell, but the first version ran the white up over the ribs and the
          animal came out cream all over, which loses the tan just as completely.
          The white is the BELLY and a bite out of the lower flank. Nothing above it. */}
      <path
        d={`M-24,${-59 + drop} C-8,${-53 + drop} 14,${-55 + drop} 27,${-63 + drop}
            C26,${-57 + drop} 12,${-52 + drop} -12,${-53 + drop}
            C-18,${-54 + drop} -22,${-56 + drop} -24,${-59 + drop} Z`}
        fill={WHITE} opacity={0.95} />

      {/* THE RUMP PATCH: on the REAR, wrapping the back end. Alarmed, the hairs erect. */}
      <path
        d={`M-32,${-80 + drop} C-40,${-74 + drop} -40,${-64 + drop} -30,${-59 + drop}
            C-26,${-62 + drop} -25,${-74 + drop} -29,${-81 + drop} Z`}
        fill={WHITE} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
      {alarmed && (
        <g>
          {[-78, -73, -68, -63].map((ry, i) => (
            <path key={ry} d={`M-36,${ry + drop} l${-7 - i % 2 * 2},${-2 + i}`} stroke={WHITE}
              strokeWidth={3.2} strokeLinecap="round" />
          ))}
          <path d={`M-33,${-82 + drop} C-46,${-75 + drop} -46,${-62 + drop} -31,${-57 + drop}`}
            stroke={WHITE} strokeWidth={5} fill="none" opacity={0.7} />
        </g>
      )}
      {/* short black-tipped tail over the patch */}
      <path d={`M-31,${-76 + drop} l-5,6`} stroke="#4a3a28" strokeWidth={3} strokeLinecap="round" />

      {/* neck: forward and LOW as it ducks under, up and back when it is standing */}
      <path
        d={`M22,${-86 + drop} Q${34 + duck * 14},${-100 + drop + duck * 40} ${42 + duck * 26},${-104 + drop + duck * 52}`}
        stroke={`url(#${uid}_b)`} strokeWidth={15} fill="none" strokeLinecap="round" />
      {/* THE TWO WHITE THROAT BANDS, a field mark nobody draws */}
      <path d={`M${30 + duck * 8},${-96 + drop + duck * 22} q7,3 9,-2`} stroke={WHITE}
        strokeWidth={3.4} fill="none" />
      <path d={`M${34 + duck * 12},${-88 + drop + duck * 30} q7,3 9,-2`} stroke={WHITE}
        strokeWidth={3} fill="none" />

      <g transform={`translate(${44 + duck * 28} ${-112 + drop + duck * 58}) rotate(${duck * 26})`}>
        {/* long head, dark muzzle, white cheek */}
        <path d="M-14,-8 q8,-8 19,-5 q13,3 18,9 q-4,7 -17,8 q-14,1 -20,-4 Z"
          fill="#c9a978" stroke={INK} strokeWidth={2.8} strokeLinejoin="round" />
        <path d="M-11,1 q11,5 24,2 q-5,4 -15,4 q-8,0 -9,-6 Z" fill={WHITE} />
        <path d="M18,-3 q8,1 6,6 q-5,2 -8,-1 Z" fill="#4a3a2c" stroke={INK} strokeWidth={2} />
        {/* the ENORMOUS eye, set high and well back */}
        <circle cx={-3} cy={-5} r={4.2} fill={INK} />
        <circle cx={-4.4} cy={-6.4} r={1.4} fill="#e8e2d4" opacity={0.8} />
        <path d="M-15,-9 q-5,-4 -9,-3 q4,4 8,5 Z" fill="#b09472" stroke={INK} strokeWidth={1.8} />
        {/* THE HORNS: black, TALLER THAN THE HEAD IS LONG, back-curving at the tip
            with a forward PRONG partway up. Substantial at the base. The first
            version drew a bent paperclip and it vanished at any size a scene uses.
            A doe carries short spikes, which is the honest sexual dimorphism. */}
        {!doe ? (
          <g>
            {/* The far horn is a HINT and nothing more. In near-profile it sits almost
                exactly behind the near one, so drawing it as a full third shape gave
                the buck a black mohawk of three fanned spikes. One horn, one prong,
                and a sliver behind them is what the eye is actually shown. */}
            <path d="M-12,-11 C-11,-23 -9,-33 -3,-40 C-4,-32 -6,-22 -6,-11 Z"
              fill="#4a4a54" strokeLinejoin="round" opacity={0.75} />
            {/* THE MAIN SPIKE, back-curving at the tip */}
            <path d="M-8,-11 C-7,-25 -5,-37 3,-47 C6,-44 6,-41 4,-38
                     C-1,-31 -2,-21 -2,-11 Z"
              fill="#26262c" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
            {/* THE PRONG, forward off the front edge with a CLEAR NOTCH above it. The
                first version buried it against the spike and the three shapes fused
                into one black blob, which is a shape with no pronghorn in it. */}
            <path d="M-2,-24 C4,-28 11,-33 17,-33 C13,-28 5,-23 -1,-19 Z"
              fill="#26262c" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
          </g>
        ) : (
          <path d="M-8,-11 C-7,-18 -6,-24 -2,-28 C-4,-22 -4,-16 -3,-11 Z" fill="#26262c"
            stroke={INK} strokeWidth={2} />
        )}
      </g>
    </g>
  );
};

// =============================================================================
// TURKEY VULTURE — teetering in a shallow V (dihedral) over a two-lane road,
// rocking, rarely flapping. The most honest way to put motion in an empty rural sky.
//
// THE MISTAKE the first version made: wings and nothing else, which reads as a
// boomerang. A vulture needs the TINY HEAD projecting forward (they look almost
// headless, and that is itself the identification), a LONG TAIL, and FINGERED
// primaries at the tips.
//
// The underwing is two-tone: dark forewing, PALE flight feathers along the whole
// trailing half. That has to be a filled region. As a stroke it reads as a wire.
// =============================================================================
export const TurkeyVulture: React.FC<Beast & {span?: number}> = ({
  x = 0, y = 0, scale = 1, frame, seed = 4, span,
}) => {
  const K = fit('turkeyVulture', 200);                  // local frame: 200 units of wingspan
  const s = (span ?? 200) / 200;                        // an author may still oversize for effect
  // THE TEETER is the whole identification. It rocks side to side and almost never flaps.
  const rock = Math.sin(frame / 23 + rnd(seed, 1) * 6) * 8;
  const driftX = Math.sin(frame / 61 + rnd(seed, 2) * 6) * 9;
  const driftY = Math.sin(frame / 47 + rnd(seed, 3) * 6) * 4;
  const DARK = '#2a2a31';
  const PALE = '#9a9aa2';
  // One wing, built once and mirrored, so the two halves cannot drift apart.
  const wing = (dir: 1 | -1) => (
    <g transform={`scale(${dir} 1)`}>
      {/* ONE wing, one outline. The two-tone is a fill inside it and carries NO ink
          line of its own: the first version outlined both halves and the wing read
          as two stacked wings with a gap, which is a bird nobody has ever seen. */}
      <path d="M6,-3 L58,-14 L88,-17 L96,-8 L62,0 L12,7 Z" fill={DARK}
        stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
      {/* PALE trailing half, filled, no stroke */}
      <path d="M9,2 L60,-7 L93,-12 L96,-8 L62,0 L12,7 Z" fill={PALE} opacity={0.95} />
      {/* fingered primaries */}
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M${88 + i * 1.6},${-15 + i * 3} l${10 - i * 1.2},${1 + i * 1.4}`}
          stroke={i > 1 ? PALE : DARK} strokeWidth={3 - i * 0.25} strokeLinecap="round" />
      ))}
    </g>
  );
  return (
    <g transform={`translate(${x + driftX} ${y + driftY}) scale(${scale * K * s}) rotate(${rock})`}>
      {/* the dihedral: wings held ABOVE the horizontal in a shallow V. Shallow, not
          absent. At 7 degrees it rendered as a flat bar and the whole identification
          went with it, so this is the angle at which the V is actually legible from
          the distance a scene puts a vulture at. */}
      <g transform="rotate(-11)">{wing(1)}</g>
      <g transform="rotate(11)">{wing(-1)}</g>
      {/* LONG tail, squared off */}
      <path d="M-6,-4 L-30,-6 L-32,3 L-6,4 Z" fill={DARK} stroke={INK} strokeWidth={1.6}
        strokeLinejoin="round" />
      <ellipse cx={2} cy={0} rx={11} ry={5} fill="#23232a" stroke={INK} strokeWidth={1.8} />
      {/* the TINY head, projecting just far enough to read. It looks almost headless. */}
      <ellipse cx={15} cy={-1} rx={5} ry={3.4} fill="#7a3a34" stroke={INK} strokeWidth={1.6} />
      <path d="M19,-1 l5,1 l-5,1 Z" fill="#d8cdb8" stroke={INK} strokeWidth={1.2} />
    </g>
  );
};

// =============================================================================
// LONGHORN — the horns are the animal, and the first version lost them entirely.
//
// TWO THINGS. First, SPREAD. A mature steer measures 1.5 to 2.1 m tip to tip on a
// body 1.45 m at the shoulder, so THE HORNS ARE WIDER THAN THE ANIMAL IS TALL. The
// first version drew a 60-unit spread on a 130-unit body and it read as an antenna.
//
// Second, and this is the real craft note: A LONGHORN IN STRICT PROFILE HAS NO
// HORNS. They project toward and away from the viewer and foreshorten to nothing.
// Every postcard in Texas turns the head to three-quarter or head-on for exactly
// this reason, so the head here is TURNED while the body stays in profile.
//
// Horn shape differs by AGE and by SEX, so `horn` is a parameter and not a fixed
// silhouette. Colour is wildly variable and THAT VARIABILITY IS THE POINT: brindle,
// roan, speckled, red, black. A herd of identical longhorns is the tell — which is
// a statement about a SET, so see `herdHides` below.
//
// They are criollo cattle: lean, rangy, long-legged, narrow through the barrel,
// with a dewlap. Not a blocky beef animal.
// =============================================================================
// Six hides that are actually distinguishable at the size a scene uses them. The
// first version had four of six in the same tan family, so a random draw returned
// tan almost every time and the "variability is the point" comment was decorative.
export const HIDE = ['#8a4a2c', '#2b2724', '#cfc4ad', '#6a4530', '#b8763f', '#7d2f22'] as const;

/**
 * Hides for a GROUP, drawn without replacement.
 *
 * The doctrine's rule is "a herd of identical longhorns is the tell", which is a
 * property of the herd and not of any one animal, so a per-animal random draw
 * cannot enforce it. A render proved it: four independent draws returned three
 * shades of tan. This shuffles deterministically and takes without replacement, so
 * a herd is varied by construction rather than by luck.
 */
/**
 * One tapered horn, as a closed outline.
 *
 * Hand-offsetting a curve is exactly where a horn drawing goes wrong: the first
 * version drew two thin slivers and they read as a bird's wings either side of the
 * head. So the centreline is a cubic, the outline is sampled off its normal with a
 * half-width that shrinks toward the tip, and BOTH horns come out of this one
 * function so they cannot drift apart.
 *
 * The sweep is out, faintly down through the middle, then UP at the tip. That lift
 * is what the eye reads as a longhorn, and a horn that only goes sideways does not.
 */
function hornPath(S: number, baseW: number): string {
  const P: [number, number][] = [[15, -14], [S * 0.42, -4], [S * 0.82, -6], [S, -30]];
  const at = (t: number): [number, number] => {
    const u = 1 - t;
    return [
      u * u * u * P[0][0] + 3 * u * u * t * P[1][0] + 3 * u * t * t * P[2][0] + t * t * t * P[3][0],
      u * u * u * P[0][1] + 3 * u * u * t * P[1][1] + 3 * u * t * t * P[2][1] + t * t * t * P[3][1],
    ];
  };
  const N = 16;
  const top: string[] = [];
  const bot: string[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const [x, y] = at(t);
    const [xa, ya] = at(Math.min(1, t + 0.02));
    const [xb, yb] = at(Math.max(0, t - 0.02));
    const dx = xa - xb;
    const dy = ya - yb;
    const len = Math.hypot(dx, dy) || 1;
    const w = (baseW / 2) * Math.pow(1 - t, 0.7);
    const nx = (-dy / len) * w;
    const ny = (dx / len) * w;
    top.push(`${(x + nx).toFixed(1)},${(y + ny).toFixed(1)}`);
    bot.push(`${(x - nx).toFixed(1)},${(y - ny).toFixed(1)}`);
  }
  return `M${top.join(' L')} L${bot.reverse().join(' L')} Z`;
}

export function herdHides(count: number, seed = 1): string[] {
  const pool = [...HIDE];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd(seed, 100 + i) * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return Array.from({length: count}, (_, i) => pool[i % pool.length]);
}

export const Longhorn: React.FC<Beast & {hide?: string; horn?: number; grazing?: boolean}> = ({
  x = 0, y = 0, scale = 1, frame, facing = 1, seed = 5, hide, horn = 1, grazing = false,
}) => {
  const L = useLight();
  const coat = hide ?? herdHides(1, seed)[0];
  const t = tones(coat, L);
  const K = fit('longhorn', 130);                       // local frame: 130 units at the shoulder
  const uid = `lh${seed}`;
  const breathe = Math.sin(frame / 26 + rnd(seed, 1) * 6) * 1.2;
  const tail = Math.sin(frame / 17 + rnd(seed, 2) * 6) * 5;
  // Tip to tip, in local units against a 118-unit shoulder. horn=1 is a mature
  // steer at about 1.8 m across on a 1.45 m animal, so the horns really are wider
  // than it is tall, which is the proportion the whole silhouette rests on.
  const spread = 146 * horn;
  const graze = grazing ? 1 : 0;
  const horns = (dir: 1 | -1, S: number, fill: string, op: number) => (
    <g transform={`scale(${dir} 1) translate(${dir > 0 ? 0 : -12} 0)`} opacity={op}>
      <defs>
        <linearGradient id={`${uid}h${dir > 0 ? 'n' : 'f'}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={fill} />
          <stop offset="0.72" stopColor={fill} />
          <stop offset="1" stopColor="#4a4030" />
        </linearGradient>
      </defs>
      <path d={hornPath(S, 16)} fill={`url(#${uid}h${dir > 0 ? 'n' : 'f'})`} stroke={INK}
        strokeWidth={2.6} strokeLinejoin="round" />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * K * facing} ${scale * K})`}>
      <defs><FormGradient id={`${uid}_c`} t={t} softness={0.6} /></defs>
      <ContactShadow cx={0} cy={1} rx={62} opacity={0.28} blur={9} />

      {/* long legs with hocks and hooves. Criollo cattle stand tall and narrow. */}
      {[[-40, -1], [-31, -1], [30, 1], [39, 1]].map(([lx, dir], i) => (
        <g key={i}>
          <path d={`M${lx},-86 L${lx + dir * 2},-46`} stroke="#6b5540" strokeWidth={8}
            strokeLinecap="round" />
          <path d={`M${lx + dir * 2},-46 L${lx + dir * 4},-5`} stroke="#5a4632" strokeWidth={5.5}
            strokeLinecap="round" />
          <path d={`M${lx + dir * 4},-5 l${dir * 4},5 l${-dir * 8},0 Z`} fill="#3a3128"
            stroke={INK} strokeWidth={2} />
        </g>
      ))}

      {/* body: straight back, deep narrow chest, prominent hips */}
      <path
        d={`M-46,${-96 + breathe} C-42,${-114} -14,${-120} 16,${-118}
            C36,${-116} 46,${-108} 47,${-96}
            C48,${-84} 40,${-74} 24,${-72}
            C-2,${-69} -34,${-72} -44,${-82} Z`}
        fill={`url(#${uid}_c)`} stroke={INK} strokeWidth={3.6} strokeLinejoin="round" />
      {/* hip and shoulder points, because a lean animal shows its skeleton */}
      <path d="M-40,-112 q6,4 8,10" stroke={INK} strokeWidth={2} fill="none" opacity={0.35} />
      <path d="M22,-114 q5,5 6,11" stroke={INK} strokeWidth={2} fill="none" opacity={0.3} />
      {/* speckling: fine and scattered, not blobs */}
      {Array.from({length: 22}, (_, i) => (
        <ellipse key={i} cx={-42 + rnd(seed, 20 + i) * 86} cy={-114 + rnd(seed, 40 + i) * 40}
          rx={1.6 + rnd(seed, 60 + i) * 2.6} ry={1.2 + rnd(seed, 80 + i) * 1.8}
          fill="#efe6d4" opacity={0.16 + rnd(seed, 90 + i) * 0.2} />
      ))}
      {/* tail with a switch */}
      <path d={`M-46,-108 q${-9 + tail},22 ${-5 + tail * 1.4},40`} stroke="#5a4632"
        strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d={`M${-51 + tail * 1.4},-68 q${tail * 0.4},10 -2,15`} stroke="#3a3128"
        strokeWidth={7} fill="none" strokeLinecap="round" />

      {/* neck and dewlap */}
      <path d={`M40,${-112 + graze * 8} Q56,${-110 + graze * 22} 62,${-104 + graze * 40}`}
        stroke={`url(#${uid}_c)`} strokeWidth={30} fill="none" strokeLinecap="round" />
      <path d={`M46,${-88 + graze * 14} q10,${6 + graze * 8} 14,${2 + graze * 20}`}
        stroke={coat} strokeWidth={11} fill="none" strokeLinecap="round" opacity={0.95} />

      {/* THE HEAD, TURNED THREE-QUARTER so the horns actually spread. A profile head
          would foreshorten them to nothing, which is the whole reason no postcard
          uses one. Drawn in its own frame with the facing flip cancelled, so the
          face reads the same whichever way the body points.
          Carried at back height. A standing longhorn does not hold its head above
          its withers, and the first version put it 40 cm over. */}
      <g transform={`translate(${62} ${-108 + graze * 50}) rotate(${graze * 32}) scale(${facing} 1)`}>
        {/* far horn, drawn first and darker so the near one reads in front of it.
            That overlap is the only depth cue a flat drawing gets here. */}
        {horns(-1, spread / 2, '#b8ab8e', 0.92)}
        {/* Face, ears and muzzle, scaled down together. A longhorn's head is NARROW
            and long: the first version drew it near full body-depth and the animal
            came out as a cow emoji on legs. The horns stay full size, which is the
            whole reason this is its own group. */}
        <g transform="translate(2 2) scale(0.8)">
          <path d="M-16,-12 C-12,-22 -2,-27 8,-26 C20,-25 27,-19 28,-9
                   C29,4 24,18 14,24 C6,29 -2,28 -8,22 C-16,14 -19,0 -16,-12 Z"
            fill={coat} stroke={INK} strokeWidth={3.6} strokeLinejoin="round" />
          <path d="M-13,-10 C-8,-19 2,-22 10,-21 C18,-20 23,-15 24,-8 C14,-14 -2,-15 -13,-10 Z"
            fill="#ffffff" opacity={0.13} />
          {/* Muzzle: paler than the coat but NOT outlined, and the nostrils barely
              there. Outlined and dotted, it read as a second pair of eyes and the
              face came out with four of them. */}
          <path d="M2,21 C10,19 18,21 19,25 C17,30 7,32 0,29 C-3,27 -3,22 2,21 Z"
            fill="#d9c9ae" opacity={0.9} />
          <ellipse cx={5} cy={25} rx={1.4} ry={0.9} fill={INK} opacity={0.35} />
          <ellipse cx={13} cy={26} rx={1.4} ry={0.9} fill={INK} opacity={0.35} />
          <ellipse cx={-3} cy={-7} rx={2.8} ry={2.3} fill={INK} />
          <ellipse cx={17} cy={-5} rx={2.8} ry={2.3} fill={INK} />
          {/* ears, out sideways BELOW the horns, which is where they sit */}
          <path d="M-17,-2 q-13,-3 -18,5 q8,6 18,2 Z" fill={coat} stroke={INK} strokeWidth={3} />
          <path d="M28,0 q13,-3 18,5 q-8,6 -18,2 Z" fill={coat} stroke={INK} strokeWidth={3} />
        </g>
        {/* NEAR HORN, in front */}
        {horns(1, spread / 2, '#e2d8c4', 1)}
      </g>
    </g>
  );
};

// =============================================================================
// WHITE-TAILED DEER — THE TELL is the tail. Up and FLARED when fleeing, which is
// the "flag" the animal is named for and the only pose most people have seen.
//
// Antlers grow from a MAIN BEAM that sweeps forward with unbranched tines rising
// off it. A mule deer's fork evenly; a whitetail's do not, and drawing the fork is
// the commonest error. Small-bodied in south Texas, larger in the north.
// =============================================================================
export const Whitetail: React.FC<Beast & {
  flagging?: boolean; points?: number; southTexas?: boolean;
}> = ({
  x = 0, y = 0, scale = 1, frame, facing = 1, seed = 9,
  flagging = false, points = 0, southTexas = false,
}) => {
  const L = useLight();
  const t = tones('#a5764a', L);
  // South Texas deer are genuinely smaller, and that is a fact worth carrying.
  const K = fit('whitetail', 100) * (southTexas ? 0.88 : 1);
  const uid = `wt${seed}`;
  const breathe = Math.sin(frame / 23 + rnd(seed, 1) * 6) * 1.2;
  const flick = Math.sin(frame / 11 + rnd(seed, 2) * 6) * 4;
  const WHITE = '#f4efe4';
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * K * facing} ${scale * K})`}>
      <defs><FormGradient id={`${uid}_b`} t={t} softness={0.62} /></defs>
      <ContactShadow cx={0} cy={1} rx={44} opacity={0.26} blur={8} />
      {[[-32, -1], [-25, -1], [22, 1], [30, 1]].map(([lx, dir], i) => (
        <g key={i}>
          <path d={`M${lx},-66 L${lx + dir * 3},-34`} stroke="#8a6642" strokeWidth={5.6}
            strokeLinecap="round" />
          <path d={`M${lx + dir * 3},-34 L${lx + dir * 5},-2`} stroke="#6e5236" strokeWidth={3.6}
            strokeLinecap="round" />
        </g>
      ))}
      <path
        d={`M-34,${-76 + breathe} C-28,${-92} -4,${-96} 20,${-93}
            C32,${-91} 36,${-82} 34,${-72}
            C30,${-62} 4,${-58} -18,${-61} C-30,${-63} -36,${-68} -34,${-76} Z`}
        fill={`url(#${uid}_b)`} stroke={INK} strokeWidth={3.2} strokeLinejoin="round" />
      <path d="M-26,-62 C-6,-56 18,-58 32,-68 C28,-58 4,-53 -16,-56 Z" fill={WHITE} opacity={0.9} />

      {/* THE FLAG. Down it is a brown flick; up it is a broad white fan, and that is
          the entire animal in one gesture. */}
      {flagging ? (
        <g>
          <path d="M-34,-84 q-4,-16 4,-24 q8,8 8,24 q-6,4 -12,0 Z" fill={WHITE}
            stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
          <path d="M-31,-88 q-2,-12 2,-18" stroke="#c9b89a" strokeWidth={1.8} fill="none" />
        </g>
      ) : (
        <path d={`M-34,-80 q${-4 + flick},12 ${-1 + flick},20`} stroke="#8a6642" strokeWidth={6}
          fill="none" strokeLinecap="round" />
      )}

      <path d="M28,-88 Q42,-100 46,-112" stroke={`url(#${uid}_b)`} strokeWidth={16}
        fill="none" strokeLinecap="round" />
      <g transform="translate(48 -118)">
        <path d="M-10,-4 q7,-6 15,-4 q11,3 14,9 q-4,6 -15,7 q-11,0 -15,-4 Z" fill="#a5764a"
          stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
        <path d="M-8,2 q10,4 18,2 q-4,3 -11,3 q-6,0 -7,-5 Z" fill={WHITE} />
        <path d="M15,0 q6,1 5,4 q-4,2 -6,0 Z" fill="#3a2f24" stroke={INK} strokeWidth={1.8} />
        <circle cx={-2} cy={-3} r={2.8} fill={INK} />
        {/* big mobile ears, held wide */}
        <path d="M-9,-8 q-9,-8 -16,-6 q3,8 13,9 Z" fill="#9a6f45" stroke={INK} strokeWidth={2.2} />
        <path d="M-4,-11 q-3,-11 3,-14 q4,7 2,15 Z" fill="#9a6f45" stroke={INK} strokeWidth={2.2} />
        {/* ANTLERS: one main beam sweeping FORWARD, tines rising off it. Never a fork. */}
        {points > 0 && (
          <g>
            {[1, -1].map((d) => (
              <g key={d} transform={`translate(${d > 0 ? 2 : -4} 0) scale(${d} 1)`}>
                <path d="M0,-10 C6,-22 16,-30 26,-33" stroke="#c9b89a" strokeWidth={3.4}
                  fill="none" strokeLinecap="round" />
                {Array.from({length: Math.max(1, Math.round(points / 2))}, (_, i) => {
                  const p = 0.28 + i * 0.22;
                  return (
                    <path key={i}
                      d={`M${4 + p * 22},${-16 - p * 17} l${1 + p * 3},${-9 - p * 5}`}
                      stroke="#c9b89a" strokeWidth={2.8} fill="none" strokeLinecap="round" />
                  );
                })}
              </g>
            ))}
          </g>
        )}
      </g>
    </g>
  );
};

// =============================================================================
// BLACK-TAILED JACKRABBIT — a hare, not a rabbit, and the EARS are the animal.
// Enormous, black-tipped, and when the sun is behind them the vessels light up,
// which is a real and drawable West Texas image.
//
// It LOPES. It does not hop. The gait is long and low and the ears lay back.
// =============================================================================
export const Jackrabbit: React.FC<Beast & {loping?: boolean; backlit?: boolean}> = ({
  x = 0, y = 0, scale = 1, frame, facing = 1, seed = 10, loping = false, backlit = false,
}) => {
  const L = useLight();
  const t = tones('#9c8a70', L);
  const K = fit('jackrabbit', 100);                     // local frame: 100 units, ears up
  const uid = `jr${seed}`;
  const swivel = Math.sin(frame / 29 + rnd(seed, 1) * 6) * 5;
  // Loping: the body stretches long and low and the ears go BACK.
  const lope = loping ? 1 : 0;
  const stride = loping ? Math.sin(frame / 4) : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * K * facing} ${scale * K})`}>
      <defs><FormGradient id={`${uid}_b`} t={t} softness={0.55} /></defs>
      <ContactShadow cx={-2} cy={1} rx={24} opacity={0.22} blur={5} />
      {/* front leg, behind the body */}
      <path d={`M10,-34 l${2 + stride * 9},${34 - lope * 4}`} stroke="#7a6a52" strokeWidth={4.4}
        strokeLinecap="round" />
      <ellipse cx={-2} cy={-44 + lope * 6} rx={22} ry={15 - lope * 3} fill={`url(#${uid}_b)`}
        stroke={INK} strokeWidth={3} />
      {/* THE HIND LEG, drawn IN FRONT of the body as a filled haunch. A hare's back
          leg is the second most characteristic thing about it after the ears, and the
          first version drew it as a stroke behind the body where it was invisible.
          The second version drew it as a thin CRESCENT with a 3-unit ink stroke, and
          at the size a scene actually uses the two sides of that stroke met in the
          middle and filled the whole shape solid ink: the animal grew a black hole in
          its side. A shape has to be thicker than twice its own outline. */}
      <path
        d={`M-2,-56 C-18,-55 -29,-44 -28,${-27 - stride * 5}
            C-27,${-20 - stride * 4} -20,-18 -14,-21
            C-9,-24 -6,-33 -5,-42 Z`}
        /* A SHARED FORM GRADIENT IS POSITIONED FOR THE SHAPE IT WAS DESIGNED AROUND.
           This haunch sits at the far end of the body's ramp, so filling it with the
           body's gradient painted it entirely in the shade colour and the animal came
           out with a dark patch stuck on its rear. A satellite shape takes a FLAT
           tone from the ramp instead, which is also what a haunch actually looks
           like: a form turning away, not a second lit volume. */
        fill={t.core} stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
      <path d={`M-25,${-24 - stride * 5} L${-19 + stride * 8},-1`} stroke="#7a6a52"
        strokeWidth={5} strokeLinecap="round" />
      <path d={`M${-25 + stride * 8},-1 h13`} stroke="#7a6a52" strokeWidth={4}
        strokeLinecap="round" />
      <path d="M-14,-36 q14,7 28,-3 q-5,8 -16,8 q-11,0 -12,-5 Z" fill="#d8cdb6" opacity={0.85} />
      {/* black-topped tail, the field mark the name comes from */}
      <path d="M-22,-46 q-8,3 -10,9 q7,0 11,-5 Z" fill="#2f2a24" stroke={INK} strokeWidth={2} />
      <path d={`M14,${-52 + lope * 5} q6,-6 8,-10`} stroke={`url(#${uid}_b)`} strokeWidth={11}
        fill="none" strokeLinecap="round" />
      <g transform={`translate(${20 + lope * 5} ${-66 + lope * 7}) rotate(${swivel + lope * 10})`}>
        {/* THE EARS, drawn BEHIND the head so the face is never buried in them. Laid
            back when loping rather than folded flat, which is what a hare actually
            does. Backlit, the vessels light up: a real West Texas image. */}
        {[0, 1].map((i) => (
          <g key={i} transform={`rotate(${(i ? -8 : 6) + lope * 58}) translate(${i ? -4 : 0} -4)`}>
            <path d="M-3,-6 C-7,-24 -5,-38 2,-42 C8,-38 8,-22 3,-5 Z"
              fill={backlit ? '#e6b98c' : '#a89078'} stroke={INK} strokeWidth={2.4}
              strokeLinejoin="round" />
            {backlit && (
              <path d="M-1,-12 C-2,-24 -1,-33 2,-37 M2,-11 C2,-22 3,-30 4,-35"
                stroke="#a8543a" strokeWidth={1.4} fill="none" opacity={0.75} />
            )}
            <path d="M-2,-34 C-4,-40 0,-43 2,-42 C5,-40 4,-37 3,-33 Z" fill="#2f2a24"
              stroke={INK} strokeWidth={2} />
          </g>
        ))}
        {/* head in front of the ears: a hare's face is long, with the eye set far back
            and high, which is what gives it that near-360-degree look */}
        <path d="M-10,-6 C-6,-13 4,-15 12,-12 C18,-10 21,-5 20,0
                 C19,5 10,8 1,7 C-7,6 -12,1 -10,-6 Z"
          fill="#9c8a70" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
        <circle cx={1} cy={-5} r={3.2} fill={INK} />
        <circle cx={0} cy={-6} r={1.1} fill="#efe8d8" opacity={0.85} />
        <path d="M18,-1 q5,1 5,3 q-4,2 -7,0 Z" fill="#7f6f58" stroke={INK} strokeWidth={1.8} />
        <path d="M13,4 q4,3 1,4" stroke={INK} strokeWidth={1.4} fill="none" opacity={0.6} />
      </g>
    </g>
  );
};

// =============================================================================
// ROADRUNNER — THE MISTAKE: the cartoon. Nothing like it.
//
// A large ground CUCKOO and a predator, and it looks like one. Streaked brown, a
// shaggy raised crest, a heavy slightly hooked bill, LONG STRONG LEGS, and a tail
// LONGER THAN THE BODY held level or cocked. It runs with its head low and level.
//
// The bare skin behind the eye is blue in front and orange behind, and it is a
// PATCH rather than a hairline. The first version drew it as two thin strokes and
// it vanished at any size a scene would actually use.
// =============================================================================
export const Roadrunner: React.FC<Beast & {running?: boolean}> = ({
  x = 0, y = 0, scale = 1, frame, facing = 1, seed = 6, running = false,
}) => {
  const K = fit('roadrunner', 80);                      // local frame: 80 units to the crest
  const stride = running ? Math.sin(frame / 3.2) * 11 : 0;
  const bob = running ? Math.abs(Math.cos(frame / 3.2)) * 2.6 : Math.sin(frame / 19) * 0.9;
  // Running, the head drops to body level and the tail streams out behind.
  const run = running ? 1 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * K * facing} ${scale * K})`}>
      <ContactShadow cx={-4} cy={1} rx={20} opacity={0.2} blur={5} />
      <g transform={`translate(0 ${-bob})`}>
        {/* LONG strong legs with the zygodactyl foot: two toes forward, two back. */}
        {[[-3, 1], [5, -1]].map(([lx, d], i) => (
          <g key={i}>
            <path d={`M${lx},-34 L${lx + d * stride * 0.5},-16`} stroke="#6b7a80" strokeWidth={4}
              strokeLinecap="round" />
            <path d={`M${lx + d * stride * 0.5},-16 L${lx + d * stride},0`} stroke="#5c6a70"
              strokeWidth={3.2} strokeLinecap="round" />
            <path d={`M${lx + d * stride - 5},0 h11 M${lx + d * stride - 3},0 l-2,2`}
              stroke="#5c6a70" strokeWidth={2.2} strokeLinecap="round" />
          </g>
        ))}
        {/* body, held low and horizontal */}
        <ellipse cx={0} cy={-46} rx={19} ry={10.5} fill="#8a7a5c" stroke={INK} strokeWidth={2.8} />
        <path d="M-12,-40 q12,6 24,-3 q-4,8 -14,8 q-9,0 -10,-5 Z" fill="#d9cdb0" opacity={0.8} />
        {/* the streaking, the field mark */}
        {[-11, -6, -1, 4, 9].map((sx) => (
          <path key={sx} d={`M${sx},-55 q1.4,7 0.4,12`} stroke="#3f3626" strokeWidth={1.9}
            opacity={0.75} fill="none" />
        ))}
        {/* THE TAIL: longer than the body, cocked. White outer tips. */}
        <path d={`M-15,-50 L${-64},${-58 + run * 14} L${-63},${-50 + run * 14} L-13,-40 Z`}
          fill="#5f5238" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
        <path d={`M-58,${-57 + run * 14} l-6,1 M-52,${-54 + run * 13} l-6,1`}
          stroke="#e4dcc6" strokeWidth={2.4} strokeLinecap="round" />
        {/* neck forward and LOW, lower still at a run */}
        <path d={`M15,-50 q10,${-4 + run * 5} 15,${-9 + run * 8}`} stroke="#8a7a5c"
          strokeWidth={9} fill="none" strokeLinecap="round" />
        <g transform={`translate(33 ${-62 + run * 9})`}>
          <ellipse rx={9} ry={6.4} fill="#8a7a5c" stroke={INK} strokeWidth={2.6} />
          {/* THE SHAGGY CREST, raised and spiky */}
          <path d="M-6,-5 q1,-9 5,-11 q0,4 1,6 q2,-5 5,-6 q-1,5 -1,8 q3,-3 5,-3 q-2,4 -3,7 Z"
            fill="#403626" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
          {/* the bare skin PATCH behind the eye: blue in front, orange behind */}
          <path d="M-2,-1 q-7,0 -9,3 q5,3 9,1 Z" fill="#4a7fa0" stroke={INK} strokeWidth={1.6} />
          <path d="M-8,1 q-5,0 -6,3 q4,2 7,0 Z" fill="#c8703a" stroke={INK} strokeWidth={1.6} />
          <circle cx={2} cy={-2} r={2.2} fill="#c9b06a" stroke={INK} strokeWidth={1.2} />
          <circle cx={2.3} cy={-2} r={1.1} fill={INK} />
          {/* heavy, faintly hooked bill. A predator's bill. */}
          <path d="M8,-2 q10,1 13,4 q-4,3 -13,2 Z" fill="#3f3a30" stroke={INK} strokeWidth={2} />
          <path d="M19,1 q3,1 2,3" stroke={INK} strokeWidth={1.8} fill="none" />
        </g>
      </g>
    </g>
  );
};

// =============================================================================
// CATTLE EGRET — standing ON A COW'S BACK. In a pasture frame it is the detail that
// says this is a WORKING landscape rather than scenery. White, compact, short
// yellow bill, dark legs, and buff plumes on the crown and back in breeding season.
// =============================================================================
export const CattleEgret: React.FC<Beast & {breeding?: boolean}> = ({
  x = 0, y = 0, scale = 1, frame, facing = 1, seed = 7, breeding = false,
}) => {
  const K = fit('cattleEgret', 50);                     // local frame: 50 units standing
  const shift = Math.sin(frame / 33 + rnd(seed, 1) * 6) * 1.3;
  const buff = breeding ? '#d8a866' : '#f2ede2';
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * K * facing} ${scale * K})`}>
      <g transform={`rotate(${shift})`}>
        <path d="M-2,0 L-3,-13 M4,0 L4,-13" stroke="#3a3a40" strokeWidth={2.2} strokeLinecap="round" />
        <ellipse cx={0} cy={-21} rx={11} ry={8.4} fill="#f2ede2" stroke={INK} strokeWidth={2.4} />
        {breeding && <path d="M-9,-24 q10,-4 17,1 q-9,3 -17,2 Z" fill={buff} opacity={0.85} />}
        <path d="M7,-27 q6,-5 8,-10" stroke="#f2ede2" strokeWidth={7} fill="none" strokeLinecap="round" />
        <ellipse cx={17} cy={-39} rx={5.6} ry={4.6} fill="#f2ede2" stroke={INK} strokeWidth={2.2} />
        {breeding && <path d="M13,-42 q4,-4 8,-2 q-4,2 -8,3 Z" fill={buff} />}
        <path d="M21,-39 q9,1 10,3 q-5,2 -10,1 Z" fill="#e3bd47" stroke={INK} strokeWidth={1.6} />
        <circle cx={18} cy={-40} r={1.4} fill={INK} />
      </g>
    </g>
  );
};

// =============================================================================
// TEXAS HORNED LIZARD — the state reptile, the "horny toad", and DECLINING, so
// putting one in a frame is a statement rather than decoration.
//
// Flat, round and spiny, with a crown of horns at the back of the skull whose two
// central spikes are the longest, and a fringe of pointed scales down each flank.
// It is drawn from a low three-quarter above, because that is how anybody has ever
// actually seen one: on the ground, looking down.
// =============================================================================
export const HornedLizard: React.FC<Beast> = ({
  x = 0, y = 0, scale = 1, frame, facing = 1, seed = 11,
}) => {
  const L = useLight();
  const t = tones('#b09468', L);
  const K = fit('hornedLizard', 40);                    // local frame: 40 units long
  const uid = `hl${seed}`;
  const breathe = Math.sin(frame / 15 + rnd(seed, 1) * 6) * 0.4;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * K * facing} ${scale * K})`}>
      <defs><FormGradient id={`${uid}_b`} t={t} softness={0.5} /></defs>
      <ContactShadow cx={0} cy={0.5} rx={13} opacity={0.2} blur={3} />
      {/* splayed legs, held out to the side the way a lizard actually sits */}
      {[[-6, -1, -1], [-5, 1, 1], [7, -1, -1], [6, 1, 1]].map(([lx, dy, d], i) => (
        <path key={i} d={`M${lx},${-4 + dy} l${d * 2},${dy * 2.5} l${d * 4},${dy * 0.5}`}
          stroke="#8a7350" strokeWidth={2} fill="none" strokeLinecap="round" />
      ))}
      {/* flat round body */}
      <ellipse cx={0} cy={-5 + breathe} rx={13} ry={7.5} fill={`url(#${uid}_b)`}
        stroke={INK} strokeWidth={2.2} />
      {/* the fringe scales down each flank */}
      {[-9, -5, -1, 3, 7].map((fx) => (
        <path key={fx} d={`M${fx},1.5 l-1,2.5`} stroke="#8a7350" strokeWidth={1.6}
          strokeLinecap="round" />
      ))}
      {/* the dorsal blotches, in their two rows */}
      {[-7, -2, 3].map((bx) => (
        <g key={bx}>
          <ellipse cx={bx} cy={-8} rx={2.4} ry={1.5} fill="#6f5a3c" opacity={0.55} />
          <ellipse cx={bx + 1} cy={-3} rx={2} ry={1.2} fill="#6f5a3c" opacity={0.4} />
        </g>
      ))}
      <path d="M-13,-6 q-8,1 -10,4 q6,2 10,-1 Z" fill="#a08a62" stroke={INK} strokeWidth={1.8} />
      {/* head, and THE CROWN OF HORNS with the two long central spikes */}
      <ellipse cx={14} cy={-6} rx={6.5} ry={4.6} fill="#b09468" stroke={INK} strokeWidth={2} />
      <circle cx={15} cy={-7.5} r={1.4} fill={INK} />
      {[[-3, -7], [0, -8.5], [3, -8.5], [6, -7]].map(([hx, hy], i) => (
        <path key={i} d={`M${14 + hx},${hy} l${hx * 0.3},${i === 1 || i === 2 ? -5.5 : -3}`}
          stroke="#8a7350" strokeWidth={i === 1 || i === 2 ? 2.4 : 1.8} strokeLinecap="round" />
      ))}
    </g>
  );
};

// =============================================================================
// FERAL HOG — genuinely destructive, and drawn rooting and tearing ground. NOT cute.
//
// Heavy forequarters and a light back end, a long straight snout carried LOW, a
// bristled ridge along the spine that stands up, small eyes set high, and tusks on
// a boar. The damage is part of the drawing: a rooting hog leaves torn ground, and
// leaving that out makes it a pig in a field.
// =============================================================================
export const FeralHog: React.FC<Beast & {rooting?: boolean; boar?: boolean}> = ({
  x = 0, y = 0, scale = 1, frame, facing = 1, seed = 12, rooting = false, boar = false,
}) => {
  const L = useLight();
  const t = tones('#4a4038', L);
  const K = fit('feralHog', 100);                       // local frame: 100 units at the shoulder
  const uid = `fh${seed}`;
  const shove = rooting ? Math.sin(frame / 7) * 4 : 0;
  const root = rooting ? 1 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * K * facing} ${scale * K})`}>
      <defs><FormGradient id={`${uid}_b`} t={t} softness={0.5} /></defs>
      <ContactShadow cx={-2} cy={1} rx={46} opacity={0.3} blur={8} />
      {/* the torn ground, which is the point of the animal */}
      {rooting && (
        <g>
          <path d="M30,0 q14,-5 30,-2 q16,3 26,-1 l2,5 q-24,4 -34,0 q-12,-3 -24,3 Z"
            fill="#5a4a36" stroke={INK} strokeWidth={2} strokeLinejoin="round" opacity={0.9} />
          {[38, 52, 66, 78].map((cx, i) => (
            <path key={cx} d={`M${cx},-1 q${2 + i},-6 ${6 + i * 1.5},-3`} stroke="#6b5940"
              strokeWidth={2.6} fill="none" strokeLinecap="round" opacity={0.8} />
          ))}
        </g>
      )}
      {[[-30, -1], [-22, -1], [20, 1], [28, 1]].map(([lx, dir], i) => (
        <path key={i} d={`M${lx},-42 L${lx + dir * 3},-2`} stroke="#3a332c" strokeWidth={7}
          strokeLinecap="round" />
      ))}
      {/* heavy front, light rear: the classic wedge */}
      <path
        d={`M-34,-56 C-30,-70 -8,-78 16,-80 C34,-81 44,-72 45,-58
            C46,-46 34,-38 16,-37 C-8,-36 -30,-42 -34,-56 Z`}
        fill={`url(#${uid}_b)`} stroke={INK} strokeWidth={3.4} strokeLinejoin="round" />
      {/* THE BRISTLED RIDGE, standing up along the spine */}
      {[-24, -16, -8, 0, 8, 16, 26].map((bx, i) => (
        <path key={bx} d={`M${bx},${-74 - Math.sin(i) * 2} l${1 + i * 0.3},${-9 - (i % 3) * 3}`}
          stroke="#2c2620" strokeWidth={2.4} strokeLinecap="round" />
      ))}
      <path d="M-34,-62 q-8,6 -10,14 q7,-1 10,-6" fill="#3a332c" stroke={INK} strokeWidth={2.4} />
      {/* head carried LOW, snout to the ground when rooting */}
      <g transform={`translate(${44 + shove * 0.4} ${-58 + root * 20}) rotate(${root * 24})`}>
        <path d="M-8,-14 q10,-8 22,-4 q14,5 20,14 q-6,7 -20,8 q-16,1 -22,-6 Z"
          fill="#4a4038" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        {/* the long straight snout with its disc */}
        <path d="M32,-2 q9,1 10,5 q-4,4 -11,3 Z" fill="#6b5a4c" stroke={INK} strokeWidth={2.4} />
        <circle cx={39} cy={0} r={1.3} fill={INK} />
        <circle cx={5} cy={-9} r={2} fill={INK} />
        {/* small ears */}
        <path d="M-4,-16 q-2,-11 5,-12 q5,5 3,13 Z" fill="#3f3830" stroke={INK} strokeWidth={2.2} />
        {boar && (
          <g>
            <path d="M27,3 C31,6 33,2 31,-3" stroke="#e0d8c4" strokeWidth={3}
              fill="none" strokeLinecap="round" />
            <path d="M22,4 C26,8 29,5 28,0" stroke="#cfc6b0" strokeWidth={2.4}
              fill="none" strokeLinecap="round" opacity={0.8} />
          </g>
        )}
      </g>
    </g>
  );
};

// =============================================================================
// JAVELINA — THE MISTAKE: drawn as a pig. IT IS NOT A PIG. A collared peccary, a
// different family entirely.
//
// Straighter back than a hog, longer legs in proportion, a PALE COLLAR across the
// shoulders, a blunt snout rather than a long one, and a mane along the spine that
// RAISES when it is alarmed. Travels in a squadron, so one alone is usually wrong.
// =============================================================================
export const Javelina: React.FC<Beast & {alarmed?: boolean}> = ({
  x = 0, y = 0, scale = 1, frame, facing = 1, seed = 13, alarmed = false,
}) => {
  const L = useLight();
  const t = tones('#59544c', L);
  const K = fit('javelina', 65);                        // local frame: 65 units at the shoulder
  const uid = `jv${seed}`;
  const breathe = Math.sin(frame / 19 + rnd(seed, 1) * 6) * 0.8;
  const mane = alarmed ? 1 : 0.25;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * K * facing} ${scale * K})`}>
      <defs><FormGradient id={`${uid}_b`} t={t} softness={0.5} /></defs>
      <ContactShadow cx={-1} cy={1} rx={30} opacity={0.26} blur={6} />
      {/* longer legs in proportion than a hog's, which is a real difference */}
      {[[-19, -1], [-13, -1], [13, 1], [19, 1]].map(([lx, dir], i) => (
        <path key={i} d={`M${lx},-32 L${lx + dir * 2},-1`} stroke="#3f3a34" strokeWidth={4.6}
          strokeLinecap="round" />
      ))}
      {/* STRAIGHT back, not a hog's arch */}
      <path
        d={`M-24,${-40 + breathe} L20,${-44} C30,${-44} 34,${-38} 33,${-30}
            C32,${-24} 20,${-21} 4,${-21} C-12,${-21} -24,${-25} -24,${-32} Z`}
        fill={`url(#${uid}_b)`} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      {/* THE PALE COLLAR across the shoulders. The name of the animal. */}
      <path d="M14,-45 C20,-34 20,-27 15,-21 L23,-21 C27,-28 27,-36 22,-45 Z"
        fill="#cdc4ad" stroke={INK} strokeWidth={2} strokeLinejoin="round" opacity={0.95} />
      {/* the mane, raised when alarmed. Uneven lengths, because a rank of identical
          spikes reads as a picket fence rather than as hair. */}
      {[-20, -16, -12, -8, -4, 0, 4, 8].map((bx, i) => (
        <path key={bx} d={`M${bx},${-42 + Math.abs(i - 4) * 0.5}
                           l${0.6 + i * 0.2},${-3 - mane * (8 + rnd(seed, 70 + i) * 9)}`}
          stroke="#2e2a24" strokeWidth={1.8 + rnd(seed, 80 + i) * 1.2} strokeLinecap="round" />
      ))}
      <g transform="translate(33 -37)">
        {/* BLUNT snout, not a long one */}
        <path d="M-6,-8 q9,-5 17,-1 q7,4 8,9 q-5,5 -14,5 q-11,0 -13,-5 Z" fill="#59544c"
          stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
        <path d="M17,1 q6,1 6,4 q-4,3 -8,1 Z" fill="#6f6459" stroke={INK} strokeWidth={2.2} />
        <circle cx={20} cy={4} r={1} fill={INK} />
        <circle cx={2} cy={-4} r={1.9} fill={INK} />
        <path d="M-3,-10 q-1,-8 4,-9 q4,4 2,10 Z" fill="#4a453e" stroke={INK} strokeWidth={2} />
      </g>
    </g>
  );
};

// =============================================================================
// COYOTE — THE TELL: it carries its TAIL DOWN when trotting. A dog carries it up
// or level, and that one line is the whole difference at a distance.
//
// Narrow and light, far lighter than people draw it: a big coyote is 16 kg. Long
// legs, a narrow muzzle, tall pointed ears, and a lean chest.
// =============================================================================
export const Coyote: React.FC<Beast & {trotting?: boolean; howling?: boolean}> = ({
  x = 0, y = 0, scale = 1, frame, facing = 1, seed = 14, trotting = false, howling = false,
}) => {
  const L = useLight();
  const t = tones('#9a8264', L);
  const K = fit('coyote', 70);                          // local frame: 70 units at the shoulder
  const uid = `cy${seed}`;
  const gait = trotting ? Math.sin(frame / 5) : 0;
  const howl = howling ? 1 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * K * facing} ${scale * K})`}>
      <defs><FormGradient id={`${uid}_b`} t={t} softness={0.55} /></defs>
      <ContactShadow cx={0} cy={1} rx={32} opacity={0.24} blur={6} />
      {[[-19, -1, 1], [-14, -1, -1], [14, 1, -1], [20, 1, 1]].map(([lx, dir, ph], i) => (
        <g key={i}>
          <path d={`M${lx},-44 L${lx + dir * 2 + ph * gait * 4},-24`} stroke="#8a7458"
            strokeWidth={4.4} strokeLinecap="round" />
          <path d={`M${lx + dir * 2 + ph * gait * 4},-24 L${lx + dir * 3 + ph * gait * 7},-1`}
            stroke="#7a6650" strokeWidth={3.4} strokeLinecap="round" />
        </g>
      ))}
      {/* lean, narrow chest, tucked belly */}
      <path
        d={`M-22,-50 C-18,-60 0,-64 18,-62 C27,-61 31,-55 30,-48
            C29,-40 20,-35 6,-34 C-8,-33 -20,-38 -22,-44 Z`}
        fill={`url(#${uid}_b)`} stroke={INK} strokeWidth={2.8} strokeLinejoin="round" />
      <path d="M-16,-38 C-2,-32 16,-34 28,-44 C26,-35 12,-30 -4,-31 Z" fill="#d4c6ab" opacity={0.7} />
      {/* THE TAIL, CARRIED DOWN. This is the identification and it is one path. */}
      <path d={`M-22,-52 C-32,-44 -36,-28 -34,-12`} stroke="#8a7458" strokeWidth={9}
        fill="none" strokeLinecap="round" />
      <path d="M-34,-18 C-34,-14 -33,-11 -33,-9" stroke="#2f2a24" strokeWidth={8}
        fill="none" strokeLinecap="round" />
      <path d={`M26,-58 Q${34 + howl * 4},${-70 - howl * 8} ${38 + howl * 2},${-78 - howl * 12}`}
        stroke={`url(#${uid}_b)`} strokeWidth={13} fill="none" strokeLinecap="round" />
      <g transform={`translate(${40 + howl * 2} ${-86 - howl * 14}) rotate(${-howl * 34})`}>
        {/* narrow muzzle, which is what keeps it from reading as a dog */}
        <path d="M-9,-4 q8,-6 16,-3 q11,3 15,8 q-4,5 -15,6 q-13,1 -16,-4 Z" fill="#9a8264"
          stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
        <path d="M20,1 q5,1 4,3 q-4,2 -6,0 Z" fill="#2f2a24" stroke={INK} strokeWidth={1.8} />
        <circle cx={0} cy={-3} r={2.2} fill={INK} />
        {/* tall pointed ears */}
        <path d="M-6,-8 q-3,-13 3,-15 q6,4 4,15 Z" fill="#8a7458" stroke={INK} strokeWidth={2.2} />
        <path d="M2,-9 q-1,-13 6,-14 q5,5 2,15 Z" fill="#8a7458" stroke={INK} strokeWidth={2.2} />
        {howl > 0 && <ellipse cx={17} cy={2} rx={3} ry={2.4} fill="#40342c" stroke={INK} strokeWidth={1.6} />}
      </g>
    </g>
  );
};

// =============================================================================
// MEXICAN FREE-TAILED BAT COLUMN — the Congress Avenue and Bracken emergences.
//
// THE RULE, and it is explicit in the doctrine: A COLUMN, DRAWN AS A RIBBON OF
// DENSITY, NOT INDIVIDUALS. Drawing a sky of little bat shapes is the failure. The
// emergence reads as smoke with structure, and only at the NEAR end, where a few
// animals resolve, does a single silhouette belong.
//
// This is not garnish. Bracken Cave holds the largest bat colony in the world and
// the Congress Avenue bridge is the largest urban one, both in Texas, and the
// emergence is the most spectacular thing in this whole bestiary.
// =============================================================================
export const BatColumn: React.FC<{
  x?: number; y?: number; scale?: number; frame: number; seed?: number;
  height?: number; density?: number; resolved?: number;
}> = ({x = 0, y = 0, scale = 1, frame, seed = 15, height = 700, density = 1, resolved = 7}) => {
  const H = height;
  // The ribbon streams: each strand is the same curve, phase-shifted, so the column
  // reads as one moving body rather than as separate lines.
  //
  // The first version drew eleven thin low-opacity strands and it rendered as a
  // strand of hair. An emergence is a RIVER. So the strands are many, wide, and
  // overlapping, and the width grows with height because the column disperses as it
  // climbs, which is the shape that reads from a mile off.
  const strand = (i: number) => {
    const p = rnd(seed, 200 + i);
    const q = rnd(seed, 260 + i);
    const amp = 40 + p * 90;
    const ph = frame / (34 + p * 26) + p * 9;
    const w = 34 + p * 62;
    const lean = -70 + q * 250;                        // the column fans out as it rises
    const d = `M${(q - 0.5) * 90},0
               C${Math.sin(ph + 0.6) * amp - 40 + lean * 0.15},${-H * 0.3}
                ${Math.sin(ph + 1.4) * amp + 50 + lean * 0.55},${-H * 0.66}
                ${Math.sin(ph + 2.2) * amp * 1.2 + lean},${-H}`;
    return (
      <path key={i} d={d} stroke="#2b2733" strokeWidth={w} fill="none" strokeLinecap="round"
        opacity={(0.07 + p * 0.12) * density} />
    );
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g style={{mixBlendMode: 'multiply'}}>
        {Array.from({length: 26}, (_, i) => strand(i))}
      </g>
      {/* Only at the NEAR end do individuals resolve, and only a few. */}
      {Array.from({length: resolved}, (_, i) => {
        const p = rnd(seed, 300 + i);
        const bx = -60 + p * 150;
        const by = -40 - p * H * 0.34;
        const flap = Math.sin(frame / 3.1 + p * 12) * 0.55 + 0.45;
        const s = 0.55 + p * 0.7;
        return (
          <g key={i} transform={`translate(${bx} ${by}) scale(${s}) rotate(${-18 + p * 40})`}
            opacity={0.55 + p * 0.35}>
            <path d={`M0,0 C-7,${-4 - flap * 7} -17,${-3 - flap * 6} -22,${2 - flap * 3}
                      C-15,${1 + flap} -6,${3 + flap * 2} 0,3 Z`} fill="#241f2b" />
            <path d={`M0,0 C7,${-4 - flap * 7} 17,${-3 - flap * 6} 22,${2 - flap * 3}
                      C15,${1 + flap} 6,${3 + flap * 2} 0,3 Z`} fill="#241f2b" />
            <ellipse cx={0} cy={0} rx={3} ry={4.4} fill="#1c1822" />
          </g>
        );
      })}
    </g>
  );
};
