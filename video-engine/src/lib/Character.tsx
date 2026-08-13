import React from 'react';
import {useUid} from './uid';
import {tones, FormGradient, RimLight, ContactShadow, useLight, INK as LINK} from './lighting';
import {ambientMouth} from './voice';
import {humanIdle} from './motion';

// =============================================================================
// CHARACTER — the Texas cast rig.
// Draw space: local 300x520, feet at (150,500). Scenes place, scale and flip it.
//
// The ARMATURE is ported: a forward two-bone arm solver, an articulated walk
// cycle, built-in breath and blink, poses and emotions as props. That machinery
// is correct and was paid for over many shipped films.
//
// THREE THINGS ARE DELIBERATELY NOT PORTED.
//
// 1. THE SKIN SHADOW WAS A CONSTANT. The source rig hardcodes
//    `const skinShade = '#c99268'` and uses it for every character's shadow side,
//    ear crease, neck AO and nose line. That is a value tuned for ONE skin tone.
//    Give that rig a dark-skinned character and the "shadow" is LIGHTER than the
//    base, so the shading inverts and the face reads as lit from inside. A rig
//    whose shadow constant only works for one part of the ramp cannot draw a cast,
//    and knowledge/texas/CULTURE.md requires that it can. Here `skinShade` is
//    DERIVED from `skin` through the same tones() ramp everything else uses.
//
// 2. THE OUTFITS AND HEADGEAR ARE TEXAS'S. Parkas, trappers and beanies out;
//    FR coveralls, pearl snaps, hard hats, gimme caps and working hats in.
//
// 3. THE CAST IS AUTHORED AS A CAST. knowledge/texas/CAST.md names ten people and
//    they all land in one commit, before any episode needs one, because a vector
//    library gets built in the order it is needed and the first character authored
//    becomes the default reach forever. Left alone that default is a white man in
//    a hat.
//
// The corollary, also from CULTURE.md and enforced here by construction: ONE head
// geometry system. Every face is the same shapes with the same parameter ranges,
// and skin is a FILL that never changes the line work. Feature exaggeration that
// varies by character is how a thick-outline idiom slides into caricature without
// anyone intending it.
// =============================================================================

export const INK = LINK;

/** Overshooting arrival: leaves the old value fast, passes the target once, and lands
 *  EXACTLY on 1 at u=1. */
function settle01(u: number): number {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  const e = Math.exp(-4.2 * u) * Math.cos(5.6 * u);
  const e1 = Math.exp(-4.2) * Math.cos(5.6);
  return (1 - e) / (1 - e1);
}

/** period in seconds -> angular rate, so every channel states the period it actually
 *  runs at. Writing `sin(f / 13)` instead is how a rig ships three channels at 2.7s,
 *  18s and 45s without anyone noticing which was which. */
const RATE = (periodS: number) => (2 * Math.PI) / periodS;

export interface ArmChain {
  sx: number; sy: number; ex: number; ey: number; wx: number; wy: number;
  wristDeg: number;
}

/** Solve a two-bone arm FORWARD from the shoulder. `upDeg` is the upper arm's angle
 *  away from straight-down, `foreDeg` the forearm's angle RELATIVE to the upper arm, so
 *  the elbow is a real joint rather than the middle of one drawn curve. Everything
 *  downstream (sleeve, cuff, hand) is placed FROM the returned points.
 *
 *  Derive geometry, never hand-tune it. A hand positioned by its own tuned constant is
 *  a hand that drifts off the end of the sleeve the moment the arm angle changes, and
 *  that is exactly what shipped in the source: a judge read an arm as "a detached
 *  unarticulated sleeve whose hand floats over the coat". */
export function armChain(sx: number, sy: number, upDeg: number, foreDeg: number,
                         upLen: number, foreLen: number): ArmChain {
  const a1 = (upDeg * Math.PI) / 180;
  const ex = sx + Math.sin(a1) * upLen;
  const ey = sy + Math.cos(a1) * upLen;
  const a2 = ((upDeg + foreDeg) * Math.PI) / 180;
  return {
    sx, sy, ex, ey,
    wx: ex + Math.sin(a2) * foreLen,
    wy: ey + Math.cos(a2) * foreLen,
    wristDeg: upDeg + foreDeg,
  };
}

/** Head geometry, stated once. Everything on the face is positioned RELATIVE to the
 *  head centre, and the hair and headgear are authored around the origin and translated
 *  onto it, so no coordinate has to carry the offset by hand. */
export const HEAD_R = 52;
/** local y of the ground under the feet, so `y` can be a ground line */
export const FEET_Y = 500;
export const HEAD_CY = -58;

export type Pose = 'stand' | 'arms-crossed' | 'point' | 'panic' | 'raise' | 'carry' | 'hands-hips';
export type Emotion = 'neutral' | 'angry' | 'worried' | 'shock' | 'smug' | 'wry';

// ---------------------------------------------------------------- Texas outfits
export type Outfit =
  | 'fr-coveralls'    // oilfield, petrochemical. FR = flame resistant
  | 'line-fr'         // lineworker FR shirt, harness
  | 'pearl-snaps'     // rancher, working
  | 'work-shirt'      // general trades, ranch hand
  | 'polo-badge'      // data centre, corporate technical
  | 'business'        // executive, professional
  | 'suit'            // legislator, lawyer, formal
  | 'scrubs'          // clinical
  | 'hi-vis'          // construction, roadway
  | 'apron';          // food, small business

// ---------------------------------------------------------------- Texas headgear
export type Headgear =
  | 'bare'
  | 'felt-hat'        // working hat, Labor Day to Easter
  | 'straw-hat'       // working hat, Easter to Labor Day
  | 'palm-straw'      // norteño / South Texas, different crown and brim
  | 'gimme-cap'       // THE most-worn hat in working Texas, and the least drawn
  | 'ball-cap'
  | 'hard-hat'
  | 'hard-hat-hood'   // hard hat over an FR balaclava: the rig-floor requirement
  | 'scrub-cap';

/** THE SKIN RAMP. Evenly spaced on purpose. knowledge/texas/CULTURE.md: a library
 *  where nine characters cluster at one end and one sits at the other has a default,
 *  whatever the roster says. These are FILL VALUES only. They never touch line work,
 *  and the shadow for every one of them is derived, not looked up. */
export const SKIN = [
  '#f6d9c0', '#eec39f', '#e0a97e', '#c98c5e', '#a96f45',
  '#8c5733', '#6f4326', '#54321c',
] as const;

export const HAIR = [
  '#1c1512', '#2b1f18', '#3d2c1e', '#5a4028', '#7c5a34', '#9a7a4a', '#b9b2a6',
] as const;

const OUTFITS: Record<Outfit, {main: string; shade: string; trim: string; pants: string}> = {
  // FR fabric is genuinely this colour range: royal, navy, tan and a hi-vis orange
  // variant. It is not a generic coverall blue.
  'fr-coveralls': {main: '#2f5d8c', shade: '#234769', trim: '#d9dde2', pants: '#2f5d8c'},
  'line-fr':      {main: '#2a4f74', shade: '#1e3a56', trim: '#e2c15a', pants: '#3a4250'},
  // Pearl snaps: the shirt is the character. Plaid or solid, tucked, with a worn belt.
  'pearl-snaps':  {main: '#b8563f', shade: '#8f3f2d', trim: '#e8dcc8', pants: '#3f4a5c'},
  'work-shirt':   {main: '#6f7a5e', shade: '#545e46', trim: '#d8d2c2', pants: '#4a4438'},
  'polo-badge':   {main: '#31504f', shade: '#243c3b', trim: '#e6e2d8', pants: '#3a3f48'},
  'business':     {main: '#3b3550', shade: '#2b263c', trim: '#d9c9a8', pants: '#2b263c'},
  'suit':         {main: '#2e3f57', shade: '#22303f', trim: '#b9a06a', pants: '#22303f'},
  'scrubs':       {main: '#3f7f86', shade: '#2f6167', trim: '#e8f0ef', pants: '#3f7f86'},
  'hi-vis':       {main: '#e3a11f', shade: '#b87f14', trim: '#f2efe6', pants: '#41474f'},
  'apron':        {main: '#e6e0d2', shade: '#c6bfae', trim: '#8a4a24', pants: '#3a4250'},
};

/** THE SAFETY RULE, from knowledge/texas/CAST.md, enforced rather than documented.
 *
 *  A cowboy hat on a rig floor or in a petrochemical unit is a safety violation, and a
 *  Texan reads it instantly as a drawing made by somebody who has never been on a site.
 *  A hard hat with pearl snaps is fine, that is a rancher at a construction site. The
 *  reverse is not.
 *
 *  Returns null when the pairing is fine, or a reason when it is not, so a scene gate
 *  can refuse it with something a human can act on. */
export function headgearConflict(outfit: Outfit, headgear: Headgear): string | null {
  const brimmed: Headgear[] = ['felt-hat', 'straw-hat', 'palm-straw'];
  const siteWork: Outfit[] = ['fr-coveralls', 'line-fr'];
  if (siteWork.includes(outfit) && brimmed.includes(headgear)) {
    return `${headgear} with ${outfit} is a site-safety violation. On a rig floor or in a `
      + `unit it is a hard hat, and over an FR hood in sour service. A Texan reads a `
      + `brimmed hat there as a drawing by somebody who has never been on a site.`;
  }
  if (outfit === 'scrubs' && brimmed.includes(headgear)) {
    return `${headgear} with scrubs is a costume. Clinical staff wear a scrub cap or nothing.`;
  }
  return null;
}

/** The seasonal rule, and it is drawable. Straw from Easter to Labor Day, felt from
 *  Labor Day to Easter. Texans bend it because the heat runs past September, so a
 *  September frame may show either, and a JANUARY frame showing a straw working hat is
 *  simply wrong. Pass the Dispatch date; the scene does not get to guess.
 *
 *  Easter moves, so this uses the practical boundary the trade actually quotes rather
 *  than computing the paschal full moon: straw season opens in spring and closes on
 *  Labor Day. */
export function seasonalHat(isoDate: string): 'felt-hat' | 'straw-hat' {
  const m = Number(isoDate.slice(5, 7));
  return m >= 4 && m <= 9 ? 'straw-hat' : 'felt-hat';
}

export interface CharacterProps {
  frame: number;
  pose?: Pose;
  emotion?: Emotion;
  outfit?: Outfit;
  headgear?: Headgear;
  /** a value from SKIN. A fill only: it never changes the line work. */
  skin?: string;
  hair?: string;
  eyes?: string;
  facing?: 1 | -1;
  scale?: number;
  x?: number;
  y?: number;
  /** Mark this figure as speaking. The rig does NOT lip-sync it: the value routes
   *  through ambientMouth() for a slow word-independent chat cycle, because a mouth
   *  flapping in sync with a narrator reads as a failed narration attempt rather than
   *  as a person talking. */
  talking?: number;
  walking?: boolean;
  walkPhase?: number;
  glasses?: boolean;
  /** 0..1 drive for a gesture pose, so a scene can PLAY a point rather than hold one.
   *  A gesture already extended in the first frame of its shot and unchanged for six
   *  seconds is a pose wearing a gesture's clothes. */
  gesture?: number;
  idleGain?: number;
  trim?: string;
  /** body build, 0 = slight, 1 = heavy. Varied across the whole cast, not only where
   *  it reads as a joke. */
  build?: number;
  /** 0 = young adult, 1 = old. Shows in posture and hands, never in a caricatured face. */
  age?: number;
  /** deterministic per-figure desync seed */
  seed?: number;
  /** Extra desync for two figures of the SAME cast member in one shot.
   *
   *  `seed` is cast IDENTITY: `castProps` derives it from the roster index, and it
   *  drives the hat's weave as well as the breath phase, so the same rancher must
   *  carry the same one in every shot or their straw hat changes texture between
   *  cuts. That makes it the wrong knob for desync, because two engineers placed in
   *  one frame share a cast id and would breathe and blink in perfect lockstep,
   *  which reads as a copy-paste rather than as two people. This is the knob for
   *  that: `registry.tsx` fills it from the element's address on the board, so it is
   *  distinct per instance and identical on every frame. */
  phase?: number;
}

export const Character: React.FC<CharacterProps> = ({
  frame: f,
  pose = 'stand',
  emotion = 'neutral',
  outfit = 'work-shirt',
  headgear = 'bare',
  skin = SKIN[2],
  hair = HAIR[2],
  eyes = '#41607d',
  facing = 1,
  scale = 1,
  x = 0,
  y = 0,
  talking,
  walking = false,
  walkPhase,
  glasses = false,
  gesture = 1,
  idleGain = 1,
  trim,
  build = 0.5,
  age = 0.4,
  seed = 0,
  phase = 0,
}) => {
  const L = useLight();
  const c = {...OUTFITS[outfit], ...(trim ? {trim} : {})};

  // THE FIX. Every skin-derived value comes from the ramp, so the face shades
  // correctly at every point on SKIN rather than only near the light end.
  const tSkin = tones(skin, L);
  const skinShade = tSkin.shade;
  const skinKey = tSkin.key;

  const tMain = tones(c.main, L);
  const tPants = tones(c.pants, L);

  // Per-figure desync so no two cast members breathe or blink together. Hashed from
  // the seed AND the costume, so two figures in the same outfit still differ.
  const desync = seed * 2.7 + outfit.length * 1.7 + (facing === 1 ? 0 : 2.1) + phase;
  const idle = humanIdle(f, desync, idleGain);

  const uid = useUid('tc');

  // ------------------------------------------------------------------ proportions
  // ONE geometry system. `build` and `age` scale the SAME shapes; they never swap in
  // different ones. That is what keeps feature variation from becoming caricature.
  const shoulderW = 74 + build * 20;
  const waistW = 56 + build * 30;
  const headR = HEAD_R;
  const stoop = age * 6;              // older figures carry a little forward lean

  // ------------------------------------------------------------------ walk / idle
  const wp = walkPhase ?? f / 9;
  const legSwing = walking ? Math.sin(wp) * 24 : 0;
  const bob = walking ? Math.abs(Math.cos(wp)) * 5 : idle.breath * 1.6;
  const sway = walking ? 0 : idle.swayX;

  // ------------------------------------------------------------------ arms by pose
  const g = Math.max(0, Math.min(1, gesture));
  const ge = settle01(g);
  const shoulderY = 150 + stoop;
  const armUp = 78, armFore = 70;

  let nearUp = 8, nearFore = 12, farUp = -8, farFore = 10;
  if (pose === 'point')       { nearUp = 8 + ge * 62; nearFore = 12 - ge * 4; }
  else if (pose === 'raise')  { nearUp = 8 + ge * 150; nearFore = 12 + ge * 18; }
  else if (pose === 'panic')  { nearUp = 8 + ge * 140; farUp = -8 - ge * 130; nearFore = 30; farFore = 30; }
  else if (pose === 'carry')  { nearUp = 46; nearFore = 62; farUp = -40; farFore = 58; }
  else if (pose === 'hands-hips') { nearUp = 40; nearFore = 96; farUp = -40; farFore = 96; }
  else if (pose === 'arms-crossed') { nearUp = 52; nearFore = 84; farUp = -52; farFore = 84; }
  if (walking) { nearUp += Math.sin(wp + Math.PI) * 16; farUp += Math.sin(wp) * 16; }

  const nearArm = armChain(shoulderW * 0.5, shoulderY, nearUp, nearFore, armUp, armFore);
  const farArm  = armChain(-shoulderW * 0.5, shoulderY, farUp, farFore, armUp, armFore);

  // ------------------------------------------------------------------ face
  // humanIdle().blink is a BOOLEAN: true on the frames an eyelid is down. The rig wants
  // an OPENNESS scalar to squash the eye ellipse with, so convert once here rather than
  // at four call sites. A lid that closes to exactly 0 disappears; 0.12 leaves the lash
  // line visible, which is what a real blink looks like at this scale.
  const blink = idle.blink ? 0.12 : 1;
  const mouthOpen = ambientMouth(talking, f, desync) ?? 0;

  const browY   = emotion === 'angry' ? -6 : emotion === 'worried' ? 3 : 0;
  const browTil = emotion === 'angry' ? 14 : emotion === 'worried' ? -12 : emotion === 'smug' ? 6 : 0;
  const eyeR    = emotion === 'shock' ? 13 : 10;
  const mouthCurve = emotion === 'angry' ? -7 : emotion === 'worried' ? -5
                   : emotion === 'smug' ? 5 : emotion === 'wry' ? 4 : 2;

  const sleeve = (a: ArmChain) =>
    `M${a.sx},${a.sy} L${a.ex},${a.ey} L${a.wx},${a.wy}`;

  const hand = (a: ArmChain, key: string) => (
    <g key={key}>
      <circle cx={a.wx} cy={a.wy} r={13} fill={skin} stroke={INK} strokeWidth={5} />
      <path d={`M${a.wx - 5},${a.wy + 2} q5,5 10,0`} stroke={skinShade} strokeWidth={2.6}
        fill="none" opacity={0.6} strokeLinecap="round" />
    </g>
  );

  return (
    // `y` IS THE FEET ANCHOR, as the draw-space contract says. The local origin sits at
    // the shoulders, so without the final translate a caller who places a figure on a
    // ground line gets it floating a third of a body above it. The cast sheet showed
    // this immediately: every label written relative to the feet landed on a face.
    <g transform={`translate(${x} ${y}) scale(${scale * facing} ${scale}) translate(0 ${-FEET_Y - bob})`}>
      <defs>
        <FormGradient id={`${uid}_main`} t={tMain} softness={0.62} />
        <FormGradient id={`${uid}_pants`} t={tPants} softness={0.6} />
        <radialGradient id={`${uid}_skin`} cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor={skinKey} />
          <stop offset="58%" stopColor={skin} />
          <stop offset="100%" stopColor={skinShade} />
        </radialGradient>
      </defs>

      <ContactShadow cx={0} cy={498} rx={64 + build * 12} opacity={0.3} blur={11} />

      {/* ---------------------------------------------------------------- legs */}
      <g transform={`rotate(${sway * 0.25})`}>
        <path d={`M${-waistW * 0.28},330 L${-waistW * 0.30 - legSwing * 0.5},492`}
          stroke={`url(#${uid}_pants)`} strokeWidth={34} strokeLinecap="round" />
        <path d={`M${waistW * 0.28},330 L${waistW * 0.30 + legSwing * 0.5},492`}
          stroke={`url(#${uid}_pants)`} strokeWidth={34} strokeLinecap="round" />
        <path d={`M${-waistW * 0.28},330 L${-waistW * 0.30 - legSwing * 0.5},492`}
          stroke={INK} strokeWidth={40} strokeLinecap="round" opacity={0.001} />
        {/* boots — a real sole line is most of what makes a boot a boot */}
        {[-1, 1].map((s) => (
          <g key={s}>
            <path d={`M${s * waistW * 0.30 + s * legSwing * 0.5 - 16},486 h34 q6,0 6,8 v6 h-46 v-6 q0,-8 6,-8 Z`}
              fill={c.pants} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <path d={`M${s * waistW * 0.30 + s * legSwing * 0.5 - 16},498 h46`}
              stroke={INK} strokeWidth={4} opacity={0.85} />
          </g>
        ))}
      </g>

      {/* ---------------------------------------------------------------- far arm */}
      <g opacity={0.92}>
        <path d={sleeve(farArm)} stroke={c.shade} strokeWidth={26} fill="none"
          strokeLinecap="round" strokeLinejoin="round" />
        <path d={sleeve(farArm)} stroke={INK} strokeWidth={31} fill="none"
          strokeLinecap="round" strokeLinejoin="round" opacity={0.001} />
        {hand(farArm, 'far')}
      </g>

      {/* ---------------------------------------------------------------- torso */}
      <g transform={`rotate(${sway * 0.5}) translate(0 ${stoop * 0.4})`}>
        <path
          d={`M${-shoulderW * 0.5},${shoulderY - 20}
              q${shoulderW * 0.5},-26 ${shoulderW},0
              L${waistW * 0.5},340 q${-waistW * 0.5},18 ${-waistW},0 Z`}
          fill={`url(#${uid}_main)`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />

        <OutfitOverlay outfit={outfit} c={c} shoulderW={shoulderW} waistW={waistW}
          shoulderY={shoulderY} skin={skin} skinShade={skinShade} />

        <RimLight d={`M${-shoulderW * 0.5},${shoulderY - 18} q${shoulderW * 0.5},-24 ${shoulderW * 0.5},-4`}
          w={4} opacity={0.5} />
      </g>

      {/* ---------------------------------------------------------------- head */}
      <g transform={`translate(0 ${86 + stoop * 0.5}) rotate(${sway * 0.8})`}>
        {/* neck + under-chin AO */}
        <rect x={-16} y={HEAD_CY + 40} width={32} height={34} fill={skin} stroke={INK} strokeWidth={5} />
        <ellipse cx={0} cy={HEAD_CY + 42} rx={21} ry={7} fill={skinShade} opacity={0.5} />

        <circle cx={0} cy={HEAD_CY} r={headR} fill={`url(#${uid}_skin)`} stroke={INK} strokeWidth={6} />
        {/* ears — same geometry every character, sized from headR */}
        {[-1, 1].map((s) => (
          <ellipse key={s} cx={s * headR * 0.96} cy={HEAD_CY + 8} rx={headR * 0.17} ry={headR * 0.24}
            fill={skin} stroke={INK} strokeWidth={4.5} />
        ))}

        {/* eyes */}
        {[-1, 1].map((s) => (
          <g key={s}>
            <ellipse cx={s * 22} cy={HEAD_CY - 4} rx={eyeR} ry={eyeR * blink} fill="#ffffff"
              stroke={INK} strokeWidth={3.4} />
            {blink > 0.25 && (
              <>
                <circle cx={s * 22 + 2} cy={HEAD_CY - 4} r={eyeR * 0.52} fill={eyes} />
                <circle cx={s * 22 + 2} cy={HEAD_CY - 4} r={eyeR * 0.26} fill={INK} />
              </>
            )}
          </g>
        ))}
        {/* brows — ONE shape, rotated and offset by emotion. Never a different shape
            per character, which is where caricature enters. */}
        {[-1, 1].map((s) => (
          <path key={s} d={`M${s * 30},${HEAD_CY - 22 + browY} q${-s * 11},-6 ${-s * 22},0`}
            stroke={INK} strokeWidth={5.5} fill="none" strokeLinecap="round"
            transform={`rotate(${s * browTil} ${s * 22} ${HEAD_CY - 22 + browY})`} />
        ))}

        {/* nose — a line, drawn in the derived skin shade so it works on every tone */}
        <path d={`M2,${HEAD_CY + 2} q6,11 1,18`} stroke={skinShade} strokeWidth={4} fill="none"
          opacity={0.75} strokeLinecap="round" />

        {/* mouth */}
        <path
          d={mouthOpen > 0.06
            ? `M-14,${HEAD_CY + 30} q14,${8 + mouthOpen * 16} 28,0 q-14,${4 + mouthOpen * 6} -28,0 Z`
            : `M-14,${HEAD_CY + 30} q14,${mouthCurve} 28,0`}
          fill={mouthOpen > 0.06 ? '#5c2b2b' : 'none'}
          stroke={INK} strokeWidth={5} strokeLinecap="round" />

        {glasses && (
          <g stroke={INK} strokeWidth={4} fill="none" opacity={0.9}>
            <circle cx={-22} cy={HEAD_CY - 4} r={eyeR + 6} />
            <circle cx={22} cy={HEAD_CY - 4} r={eyeR + 6} />
            <path d={`M${-22 + eyeR + 6},${HEAD_CY - 4} h${44 - 2 * (eyeR + 6)}`} />
          </g>
        )}

        {/* Hair and headgear are authored around a head centred at the ORIGIN, so they
            are translated onto the head rather than each carrying the head's offset in
            every coordinate. The first version did not, and every hat rendered as a ring
            around the character's face instead of sitting on the skull. It typechecked
            perfectly and the cast sheet showed it in one look. */}
        <g transform={`translate(0 ${HEAD_CY})`}>
          <Hair hair={hair} headR={headR} headgear={headgear} />
          <HeadgearArt headgear={headgear} headR={headR} c={c} seed={seed} />
        </g>
      </g>

      {/* ---------------------------------------------------------------- near arm */}
      <g>
        <path d={sleeve(nearArm)} stroke={`url(#${uid}_main)`} strokeWidth={28} fill="none"
          strokeLinecap="round" strokeLinejoin="round" />
        <path d={sleeve(nearArm)} stroke={INK} strokeWidth={33} fill="none"
          strokeLinecap="round" strokeLinejoin="round" opacity={0.001} />
        {/* cuff */}
        <circle cx={nearArm.wx} cy={nearArm.wy} r={15} fill="none" stroke={c.trim}
          strokeWidth={4} opacity={0.85} />
        {hand(nearArm, 'near')}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- hair
const Hair: React.FC<{hair: string; headR: number; headgear: Headgear}> = ({hair, headR, headgear}) => {
  // Under a hard hat or a crowned hat only the sides and back show.
  const covered = headgear !== 'bare' && headgear !== 'scrub-cap';
  return (
    <g>
      {!covered && (
        // the crown of hair, sitting on the top half of the skull
        <path d={`M${-headR * 0.99},${-headR * 0.10}
                  a${headR},${headR} 0 0 1 ${headR * 1.98},0
                  q${-headR * 0.42},${-headR * 0.50} ${-headR * 0.99},${-headR * 0.44}
                  q${-headR * 0.56},${-headR * 0.05} ${-headR * 0.99},${headR * 0.44} Z`}
          fill={hair} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      )}
      {covered && (
        // under a hat only the sides show, below the band
        <>
          <path d={`M${-headR * 0.97},${headR * 0.02} q${-headR * 0.10},${headR * 0.44} ${headR * 0.08},${headR * 0.68}
                    q${headR * 0.20},${-headR * 0.22} ${headR * 0.14},${-headR * 0.66} Z`}
            fill={hair} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
          <path d={`M${headR * 0.97},${headR * 0.02} q${headR * 0.10},${headR * 0.44} ${-headR * 0.08},${headR * 0.68}
                    q${-headR * 0.20},${-headR * 0.22} ${-headR * 0.14},${-headR * 0.66} Z`}
            fill={hair} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
        </>
      )}
    </g>
  );
};

// ---------------------------------------------------------------- headgear
// EVERY HAT IS ASYMMETRIC. knowledge/texas/KIT.md: vector tooling pulls toward
// symmetry and real Texas objects resist it. A working hat's crease is hand-shaped
// and lopsided and its brim is rolled unevenly. A costume hat is symmetric and clean,
// and drawing the difference IS the characterisation.
const HeadgearArt: React.FC<{
  headgear: Headgear; headR: number; c: {main: string; shade: string; trim: string};
  seed: number;
}> = ({headgear, headR, c, seed}) => {
  // deterministic lopsidedness, different per figure
  const k = ((seed * 2654435761) >>> 0);
  const lean = (((k >>> 5) % 100) / 100 - 0.5) * 5;     // crown tilt, degrees
  const dip  = (((k >>> 13) % 100) / 100 - 0.5) * 6;    // brim dip, px
  const R = headR;

  if (headgear === 'bare') return null;

  if (headgear === 'felt-hat' || headgear === 'straw-hat' || headgear === 'palm-straw') {
    const felt = headgear === 'felt-hat';
    const palm = headgear === 'palm-straw';
    const body  = felt ? '#4a3a2c' : palm ? '#e2c98f' : '#d9bd84';
    const shade = felt ? '#33281e' : palm ? '#c1a86e' : '#b89a63';
    const band  = felt ? '#2a2119' : '#8a5a32';
    // A palm-straw norteño hat sits with a taller, narrower crown and a flatter brim
    // than an Anglo working hat. Drawing them identically is the flattening this
    // library exists to avoid.
    const crownH = palm ? R * 1.06 : R * 0.88;
    const brimW  = palm ? R * 1.62 : R * 1.78;
    return (
      <g transform={`rotate(${lean} 0 -${R * 0.6})`}>
        {/* brim — the two sides are NOT mirror images */}
        <path d={`M${-brimW},${-R * 0.52 + dip}
                  q${brimW},${-R * 0.30 + dip * 0.4} ${brimW * 2},${-dip * 0.6}
                  q${-brimW},${R * 0.44} ${-brimW * 2},${dip * 0.5} Z`}
          fill={body} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {/* crown */}
        <path d={`M${-R * 0.72},${-R * 0.56}
                  q${R * 0.06},${-crownH} ${R * 0.72},${-crownH * 0.98}
                  q${R * 0.70},${crownH * 0.04} ${R * 0.74},${crownH}
                  Z`}
          fill={body} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {/* the crease, hand-shaped and off-centre */}
        <path d={`M${-R * 0.10 + lean},${-R * 0.60 - crownH * 0.78}
                  q${R * 0.12},${crownH * 0.34} ${R * 0.02},${crownH * 0.52}`}
          stroke={shade} strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.9} />
        {/* band */}
        <path d={`M${-R * 0.74},${-R * 0.60} q${R * 0.74},${R * 0.12} ${R * 1.48},0`}
          stroke={band} strokeWidth={9} fill="none" />
        {/* sweat mark at the band on a working hat */}
        {!palm && (
          <path d={`M${-R * 0.62},${-R * 0.50} q${R * 0.6},${R * 0.10} ${R * 1.2},-0.02`}
            stroke={shade} strokeWidth={5} fill="none" opacity={0.45} />
        )}
      </g>
    );
  }

  if (headgear === 'gimme-cap' || headgear === 'ball-cap') {
    // The gimme cap: THE most-worn hat in working Texas and the least drawn. Curved
    // bill, sweat-marked band, a co-op or oilfield-services logo panel.
    const body = headgear === 'gimme-cap' ? '#3f5a46' : '#37415a';
    return (
      <g transform={`rotate(${lean * 0.6} 0 -${R * 0.6})`}>
        <path d={`M${-R * 0.86},${-R * 0.54} q${R * 0.10},${-R * 0.84} ${R * 0.88},${-R * 0.82}
                  q${R * 0.78},${R * 0.02} ${R * 0.84},${R * 0.82} Z`}
          fill={body} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {/* curved bill, dipped a touch to one side */}
        <path d={`M${R * 0.10},${-R * 0.56 + dip * 0.3}
                  q${R * 0.92},${-R * 0.06} ${R * 1.26},${R * 0.20}
                  q${-R * 0.44},${R * 0.16} ${-R * 1.30},${R * 0.04} Z`}
          fill={body} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {/* front panel, where the logo goes */}
        <rect x={-R * 0.34} y={-R * 1.14} width={R * 0.72} height={R * 0.42} rx={4}
          fill="#e8e2d4" stroke={INK} strokeWidth={4} opacity={0.9} />
        <path d={`M${-R * 0.84},${-R * 0.58} q${R * 0.84},${R * 0.10} ${R * 1.68},-0.02`}
          stroke="#2b2b2b" strokeWidth={5} fill="none" opacity={0.35} />
      </g>
    );
  }

  if (headgear === 'hard-hat' || headgear === 'hard-hat-hood') {
    return (
      <g>
        {headgear === 'hard-hat-hood' && (
          // FR balaclava under the hat: sour service and hot work. This pairing is what
          // a rig floor actually looks like.
          <path d={`M${-R * 0.98},-52 a${R},${R} 0 0 1 ${R * 2},0 q0,${R * 0.72} -${R},${R * 0.80}
                    q-${R},-${R * 0.08} -${R},-${R * 0.80} Z`}
            fill="#2c3440" stroke={INK} strokeWidth={5} />
        )}
        <path d={`M${-R * 0.96},${-R * 0.56} q${R * 0.10},${-R * 0.92} ${R * 0.96},${-R * 0.92}
                  q${R * 0.86},0 ${R * 0.96},${R * 0.92} Z`}
          fill="#e3a11f" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {/* the centre rib and the short brim */}
        <path d={`M0,${-R * 1.46} v${R * 0.86}`} stroke="#b87f14" strokeWidth={7} />
        <path d={`M${-R * 1.10},${-R * 0.54} h${R * 2.20} q0,${R * 0.16} -${R * 0.18},${R * 0.16}
                  h-${R * 1.84} q-${R * 0.18},0 -${R * 0.18},-${R * 0.16} Z`}
          fill="#e3a11f" stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
      </g>
    );
  }

  if (headgear === 'scrub-cap') {
    return (
      <path d={`M${-R * 0.96},${-R * 0.60} q${R * 0.10},${-R * 0.78} ${R * 0.96},${-R * 0.76}
                q${R * 0.86},${R * 0.02} ${R * 0.96},${R * 0.76} Z`}
        fill="#4d8f96" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    );
  }
  return null;
};

// ---------------------------------------------------------------- outfit overlays
// The details that make a costume read as a JOB rather than as a coloured shirt.
const OutfitOverlay: React.FC<{
  outfit: Outfit; c: {main: string; shade: string; trim: string; pants: string};
  shoulderW: number; waistW: number; shoulderY: number; skin: string; skinShade: string;
}> = ({outfit, c, shoulderW, shoulderY, skin, skinShade}) => {
  const S = shoulderW * 0.5;
  switch (outfit) {
    case 'fr-coveralls':
    case 'line-fr':
      return (
        <g>
          {/* the hi-vis stripes that make FR clothing FR */}
          <path d={`M${-S * 0.94},${shoulderY + 74} q${S},14 ${S * 1.88},0`}
            stroke="#d9dde2" strokeWidth={9} fill="none" opacity={0.92} />
          <path d={`M${-S * 0.94},${shoulderY + 92} q${S},14 ${S * 1.88},0`}
            stroke="#8fa0ad" strokeWidth={5} fill="none" opacity={0.7} />
          {/* front zip + chest pocket flaps */}
          <path d={`M0,${shoulderY - 14} v${196}`} stroke={c.shade} strokeWidth={4} opacity={0.9} />
          <rect x={-S * 0.72} y={shoulderY + 16} width={S * 0.5} height={22} rx={3}
            fill={c.shade} stroke={INK} strokeWidth={3.5} opacity={0.95} />
          {/* the gas monitor at the collar, which is what says PETROCHEMICAL */}
          <rect x={S * 0.28} y={shoulderY - 6} width={16} height={22} rx={3}
            fill="#2c3440" stroke={INK} strokeWidth={3.5} />
          <circle cx={S * 0.28 + 8} cy={shoulderY + 2} r={3} fill="#7fe08a" />
        </g>
      );
    case 'pearl-snaps':
      return (
        <g>
          {/* the western yoke: the shoulder seam that says pearl snaps and nothing else does */}
          <path d={`M${-S},${shoulderY + 6} q${S * 0.5},34 ${S},2 q${S * 0.5},32 ${S},-2`}
            stroke={c.shade} strokeWidth={5} fill="none" opacity={0.95} />
          <path d={`M0,${shoulderY - 10} v${190}`} stroke={c.trim} strokeWidth={3.5} opacity={0.75} />
          {/* the snaps themselves */}
          {[0, 1, 2, 3, 4].map((i) => (
            <circle key={i} cx={0} cy={shoulderY + 24 + i * 34} r={4.4} fill={c.trim}
              stroke={INK} strokeWidth={2.4} />
          ))}
          {/* belt with a worn buckle */}
          <rect x={-S * 0.9} y={shoulderY + 176} width={S * 1.8} height={17} fill="#5a3a22"
            stroke={INK} strokeWidth={4} />
          <rect x={-13} y={shoulderY + 172} width={28} height={25} rx={4} fill="#c8a24a"
            stroke={INK} strokeWidth={4} />
        </g>
      );
    case 'polo-badge':
      return (
        <g>
          <path d={`M${-14},${shoulderY - 12} l14,26 l14,-26`} stroke={c.shade} strokeWidth={4}
            fill="none" />
          {/* badge on a retractable reel — the data centre tell */}
          <path d={`M${S * 0.34},${shoulderY + 30} v42`} stroke="#8a8f98" strokeWidth={3} />
          <rect x={S * 0.34 - 13} y={shoulderY + 72} width={26} height={34} rx={3}
            fill="#e8eaee" stroke={INK} strokeWidth={4} />
          <rect x={S * 0.34 - 9} y={shoulderY + 78} width={18} height={6} fill="#9aa3ad" />
        </g>
      );
    case 'business':
    case 'suit':
      return (
        <g>
          <path d={`M${-24},${shoulderY - 14} l24,44 l24,-44`} fill={c.shade} stroke={INK}
            strokeWidth={4.5} strokeLinejoin="round" />
          <path d={`M0,${shoulderY + 30} l10,16 l-10,86 l-10,-86 Z`} fill={c.trim}
            stroke={INK} strokeWidth={3.5} />
        </g>
      );
    case 'scrubs':
      return (
        <g>
          <path d={`M${-20},${shoulderY - 14} l20,30 l20,-30`} stroke={c.trim} strokeWidth={4.5}
            fill="none" />
          <rect x={S * 0.22} y={shoulderY + 84} width={30} height={26} rx={3} fill={c.shade}
            stroke={INK} strokeWidth={3.5} />
        </g>
      );
    case 'hi-vis':
      return (
        <g>
          <path d={`M${-S * 0.5},${shoulderY - 8} v190`} stroke="#f2efe6" strokeWidth={12} opacity={0.95} />
          <path d={`M${S * 0.5},${shoulderY - 8} v190`} stroke="#f2efe6" strokeWidth={12} opacity={0.95} />
          <path d={`M${-S * 0.94},${shoulderY + 96} q${S},14 ${S * 1.88},0`} stroke="#f2efe6"
            strokeWidth={12} fill="none" opacity={0.95} />
        </g>
      );
    case 'apron':
      return (
        <g>
          <path d={`M${-S * 0.62},${shoulderY + 6} h${S * 1.24} v${182} h${-S * 1.24} Z`}
            fill={c.main} stroke={INK} strokeWidth={5} opacity={0.96} />
          <path d={`M${-S * 0.30},${shoulderY - 12} l${S * 0.30},18 l${S * 0.30},-18`}
            stroke={c.trim} strokeWidth={5} fill="none" />
        </g>
      );
    default:
      return (
        <g>
          <path d={`M0,${shoulderY - 10} v${186}`} stroke={c.shade} strokeWidth={4} opacity={0.8} />
          <rect x={-S * 0.70} y={shoulderY + 20} width={S * 0.46} height={24} rx={3}
            fill={c.shade} stroke={INK} strokeWidth={3.5} opacity={0.9} />
        </g>
      );
  }
};

// =============================================================================
// THE CAST — authored together, in one place, before any episode needs one.
// knowledge/texas/CAST.md is the roster and the reasoning. Nobody is added later
// because a scene called for them: "later" is how a library acquires a default.
//
// Each entry is a STARTING POINT, not a lock. Casting against the obvious is how a
// cast stops being a lookup table, so the executive can be at a substation and the
// rancher can be at a hearing.
// =============================================================================
export interface CastMember {
  id: string;
  outfit: Outfit;
  headgear: Headgear;
  skin: string;
  hair: string;
  build: number;
  age: number;
  glasses?: boolean;
  note: string;
}

export const CAST: CastMember[] = [
  {id: 'engineer',    outfit: 'fr-coveralls', headgear: 'hard-hat',      skin: SKIN[3], hair: HAIR[0], build: 0.45, age: 0.35,
   note: 'Hispanic woman engineer. Permian, petrochemical, substation.'},
  {id: 'rancher',     outfit: 'pearl-snaps',  headgear: 'straw-hat',     skin: SKIN[1], hair: HAIR[6], build: 0.62, age: 0.78,
   note: 'White rancher, older. Hat is real and seasonal: straw Easter to Labor Day.'},
  {id: 'executive',   outfit: 'business',     headgear: 'bare',          skin: SKIN[6], hair: HAIR[0], build: 0.48, age: 0.5,
   note: 'Black woman executive. Houston, Dallas, a committee room.'},
  {id: 'dctech',      outfit: 'polo-badge',   headgear: 'bare',          skin: SKIN[4], hair: HAIR[0], build: 0.5, age: 0.32, glasses: true,
   note: 'South Asian data centre technician. Hard hat only in the yard.'},
  {id: 'owner',       outfit: 'apron',        headgear: 'bare',          skin: SKIN[2], hair: HAIR[0], build: 0.55, age: 0.55,
   note: 'Vietnamese-American small business owner. Gulf Coast, Houston.'},
  {id: 'operator',    outfit: 'fr-coveralls', headgear: 'hard-hat-hood', skin: SKIN[7], hair: HAIR[0], build: 0.68, age: 0.48,
   note: 'Black petrochemical operator. Ship channel, Beaumont. Gas monitor at the collar.'},
  {id: 'hand',        outfit: 'work-shirt',   headgear: 'palm-straw',    skin: SKIN[4], hair: HAIR[0], build: 0.5, age: 0.42,
   note: 'Hispanic man, norteño palm straw. Taller narrower crown, flatter brim.'},
  {id: 'clinician',   outfit: 'scrubs',       headgear: 'scrub-cap',     skin: SKIN[0], hair: HAIR[4], build: 0.44, age: 0.38,
   note: 'White woman in scrubs. Houston medical centre.'},
  {id: 'lineworker',  outfit: 'line-fr',      headgear: 'hard-hat',      skin: SKIN[5], hair: HAIR[0], build: 0.58, age: 0.44,
   note: 'Black woman lineworker. Transmission, grid restoration.'},
  {id: 'resident',    outfit: 'work-shirt',   headgear: 'bare',          skin: SKIN[3], hair: HAIR[6], build: 0.6, age: 0.82, glasses: true,
   note: 'Older Hispanic woman at a hearing, a public comment desk.'},
  // A FARMER IS NOT A RANCHER, and the hat is where Texas says so. A High Plains
  // row-crop farmer wears a GIMME CAP, which the headgear notes already call the
  // most-worn hat in working Texas and the least drawn. Putting a straw hat on the
  // aquifer beat would be casting the cattle country next door.
  {id: 'farmer',      outfit: 'work-shirt',   headgear: 'gimme-cap',     skin: SKIN[2], hair: HAIR[2], build: 0.56, age: 0.55,
   note: 'High Plains row-crop farmer. Cotton and grain sorghum over the Ogallala.'},
  {id: 'technician',  outfit: 'polo-badge',   headgear: 'bare',          skin: SKIN[5], hair: HAIR[4], build: 0.47, age: 0.36,
   note: 'Fab technician, Taylor or Sherman. Badge on the collar, no hat on a clean floor.'},
  {id: 'hydrologist', outfit: 'hi-vis',       headgear: 'ball-cap',      skin: SKIN[1], hair: HAIR[0], build: 0.5, age: 0.46,
   note: 'River authority field hydrologist, servicing a gauge on a bank.'},
];

/** Look a cast member up and spread it into a Character. Scenes should still override
 *  freely: the roster is a starting point and casting against the obvious is the point. */
export const castProps = (id: string): Partial<CharacterProps> => {
  const m = CAST.find((x) => x.id === id);
  if (!m) {
    // AN UNKNOWN CAST ID USED TO RETURN {}, which spread nothing into the Character
    // and rendered the DEFAULTS: a work-shirted, bare-headed, mid-tone figure. So a
    // board asking for `farmer` before there was a farmer got a plausible person,
    // no error, and a frame that had quietly cast somebody else. That is the same
    // silence `resolve()` in registry.tsx exists to break, one layer down, and it
    // is worse here because the wrong answer LOOKS like an answer.
    throw new Error(
      `castProps: nobody in the roster is called "${id}". A missing cast member used ` +
      `to render as the default figure, which is a casting decision nobody made. ` +
      `Cast: ${CAST.map((c) => c.id).join(', ')}.`);
  }
  const {id: _id, note: _note, ...rest} = m;
  return {...rest, seed: CAST.findIndex((x) => x.id === id) + 1};
};
