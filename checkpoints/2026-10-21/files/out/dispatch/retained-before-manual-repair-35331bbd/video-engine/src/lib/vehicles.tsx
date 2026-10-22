import React from 'react';
import {useUid} from './uid';
import {tones, FormGradient, ContactShadow, useLight, INK} from './lighting';
import {M} from './scale';
import {FONT} from './type';

// =============================================================================
// VEHICLES — what is actually parked in a Texas frame.
//
// knowledge/texas/KIT.md carries the notes each of these is built from, and the
// one it leads with is the one nobody draws: A WORKING TRUCK IS CLEAN ABOVE THE
// DOOR HANDLES AND CAKED BELOW THEM. That single horizontal tonal split is the
// difference between a truck that has been somewhere and a truck out of a
// brochure, and it costs one path.
//
// TRUE SCALE, the same rule as fauna.tsx and for the same reason. 610 draw units
// is 1.70 m because that is the Character rig, so a person standing at a pickup's
// door comes up to the mirror without anybody arranging it. A vehicle library
// where scale={1} means something different per vehicle is a library that draws a
// stock trailer the size of a sedan the first time somebody is in a hurry.
//
// EVERYTHING HERE IS MAINTAINED BUT WORN. Not new, not ruined. New reads as a
// rendering; ruined reads as a statement about decline that this show does not
// get to make in the background of a frame about something else.
// =============================================================================


/**
 * Real height of every vehicle, and the local-frame height each is drawn at. The
 * numbers are measurements, so they belong in the source where the drawing can be
 * checked against them rather than in a comment somewhere else.
 */
export const VEHICLE_M: Record<string, {h: number; note: string}> = {
  pickup: {h: 2.0, note: 'full-size crew cab, three-quarter ton'},
  stockTrailer: {h: 2.6, note: 'gooseneck, to the top of the slats'},
  tanker: {h: 3.9, note: 'tractor and tank, to the top of the barrel'},
  transformerHaul: {h: 4.6, note: 'lowboy with a distribution transformer on it'},
  bucketTruck: {h: 3.4, note: 'boom stowed'},
  slab: {h: 1.45, note: 'a full-size sedan on swangas'},
};

const fit = (v: keyof typeof VEHICLE_M, local: number) => (VEHICLE_M[v].h * M) / local;

interface Rig {
  x?: number; y?: number; scale?: number; frame?: number; facing?: 1 | -1; seed?: number;
}

const rnd = (seed: number, ch: number) => {
  const k = ((seed * 2654435761) ^ (ch * 40503)) >>> 0;
  return ((k >>> 8) % 10000) / 10000;
};

// A working truck's paint. Deliberately unremarkable: white and the two whites
// pretending to be colours are what a fleet actually buys.
export const TRUCK_PAINT = ['#c9cdd2', '#8c1f22', '#25457a', '#1f2328', '#d8d3c6',
                            '#3f5f4a', '#8a7a5c'] as const;

// THE DIRT LINE, which is the whole vehicles entry in KIT.md, is drawn inline in
// each vehicle rather than shared. It has to be clipped to that vehicle's own body
// silhouette, and a shared helper would need the silhouette passed to it, which is
// the caller doing the work anyway with one more place for the two to disagree.
//
// The height is DERIVED, not chosen: door handles sit about 1.15 m up on a 2.0 m
// truck, so the line is at that fraction of the local frame.

// =============================================================================
// PICKUP — the default vehicle in almost any Texas frame.
//
// Full-size crew cab. A tall square grille is what makes it read as American and
// full-size rather than as a generic car with a bed; a compact silhouette here is
// the same class of error as drawing an armadillo dog-sized.
//
// The options are the ones that say WHOSE truck it is, which is more useful than
// any amount of body detail:
//   toolbox    a crossbed box behind the cab. A working truck, anybody's.
//   headache   a rack over the back window. Ranch and oilfield.
//   flagWhip   a tall fibreglass whip with an orange flag. REQUIRED on lease
//              roads, so it says oilfield and nothing else does it as cheaply.
//   dog        in the bed. Ranch, and only where that is plausible.
//   decal      a door decal. A company truck, a county truck, a utility truck.
// =============================================================================
export const Pickup: React.FC<Rig & {
  paint?: string; dirt?: number; toolbox?: boolean; headache?: boolean;
  flagWhip?: boolean; dog?: boolean; decal?: string; hauling?: boolean;
}> = ({
  x = 0, y = 0, scale = 1, frame = 0, facing = 1, seed = 1,
  paint, dirt = 0.55, toolbox = true, headache = false, flagWhip = false,
  dog = false, decal, hauling = false,
}) => {
  const L = useLight();
  const body = paint ?? TRUCK_PAINT[Math.floor(rnd(seed, 3) * TRUCK_PAINT.length)];
  const t = tones(body, L);
  const K = fit('pickup', 100);                         // local frame: 100 units to the roof
  const uid = useUid('pk');
  // Door handles sit about 1.15 m up on a 2.0 m truck, so the dirt line is derived.
  const DIRT_Y = -(1.15 / 2.0) * 100;
  const whip = Math.sin(frame / 13 + rnd(seed, 5) * 6) * 3;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * K * facing} ${scale * K})`}>
      <defs>
        <FormGradient id={`${uid}_b`} t={t} softness={0.7} />
        <clipPath id={`${uid}_clip`}>
          <path d="M-168,-30 L-168,-68 L-65,-68 L-65,-93 Q-63,-100 -53,-100 L38,-100
                   Q50,-100 55,-91 L60,-73 L142,-73 Q147,-73 148,-67 L169,-67
                   L169,-30 Z" />
        </clipPath>
      </defs>
      <ContactShadow cx={-6} cy={1} rx={162} opacity={0.3} blur={9} />

      {/* Wheels first, so the body sits over them.
          PROPORTIONS FROM MEASUREMENTS. 6.75 m long, 3.99 m wheelbase, 1.02 m of
          front overhang and 1.74 m of rear. The first version had those two the
          wrong way round and gave the truck a 1.9 m nose, which read as a 1960s
          land yacht: ON A PICKUP THE LONG OVERHANG IS AT THE BACK, because the bed
          hangs past the rear axle, and the front wheel sits almost at the bumper. */}
      {[-81, 118].map((wx) => (
        <g key={wx}>
          <circle cx={wx} cy={-22} r={22} fill="#1c1c20" stroke={INK} strokeWidth={3} />
          <circle cx={wx} cy={-22} r={11} fill="#8e9298" stroke={INK} strokeWidth={2.4} />
          <circle cx={wx} cy={-22} r={3.4} fill="#5f6368" />
        </g>
      ))}

      {/* the body, one silhouette: bed, cab, hood, and a TALL square front */}
      <path
        d="M-168,-30 L-168,-68 L-65,-68 L-65,-93 Q-63,-100 -53,-100 L38,-100
           Q50,-100 55,-91 L60,-73 L142,-73 Q147,-73 148,-67 L169,-67 L169,-30 Z"
        fill={`url(#${uid}_b)`} stroke={INK} strokeWidth={3.6} strokeLinejoin="round" />

      {/* the greenhouse: four door windows on a crew cab, split by real pillars */}
      <g>
        <path d="M-59,-72 L-59,-92 Q-57,-96 -49,-96 L36,-96 Q44,-96 48,-89 L52,-72 Z"
          fill="#5d7180" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" opacity={0.92} />
        <path d="M-57,-90 L46,-93" stroke="#8fa4ae" strokeWidth={2} opacity={0.5} />
        {[-32, -4, 22].map((px) => (
          <path key={px} d={`M${px},-72 L${px + 1},-94`} stroke={t.core} strokeWidth={5} />
        ))}
      </g>

      {/* bed floor line, so the bed reads as open rather than as a solid block */}
      <path d="M-164,-64 L-70,-64" stroke={t.shade} strokeWidth={3} opacity={0.8} />
      <path d="M-65,-68 L-65,-30" stroke={INK} strokeWidth={2.6} opacity={0.6} />

      {/* THE WHEEL ARCHES. Without them the bed side is one flat colour field the
          length of the truck, and a long flat field is most of why the first
          version read as a land yacht however correct the measurements were. An
          arch is what tells the eye where the axle is. */}
      {[-81, 118].map((wx) => (
        <g key={wx}>
          <path d={`M${wx - 26},-30 A26,26 0 0 1 ${wx + 26},-30`} fill={t.shade}
            opacity={0.5} />
          <path d={`M${wx - 26},-30 A26,26 0 0 1 ${wx + 26},-30`} fill="none" stroke={INK}
            strokeWidth={3} strokeLinecap="round" />
        </g>
      ))}

      {/* THE DIRT LINE. Clean above the door handles, caked below. */}
      <g clipPath={`url(#${uid}_clip)`}>
        <rect x={-170} y={DIRT_Y} width={342} height={80} fill="#a08a68" opacity={dirt * 0.55} />
        <rect x={-170} y={DIRT_Y + 14} width={342} height={66} fill="#8a7350"
          opacity={dirt * 0.4} />
        {/* thrown from the wheels, so it is heaviest right behind them */}
        {[-81, 118].map((wx) => (
          <ellipse key={wx} cx={wx - 26} cy={-34} rx={30} ry={12} fill="#7a6547"
            opacity={dirt * 0.35} />
        ))}
      </g>

      {/* door cuts, handles, and the mirror a person's head comes up to */}
      <path d="M-32,-68 L-32,-36 M-4,-68 L-4,-36 M22,-68 L22,-36" stroke={INK}
        strokeWidth={2} opacity={0.4} />
      <path d="M-24,-58 l9,0 M4,-58 l9,0" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <path d="M50,-88 l14,-3 l1,10 l-14,2 Z" fill={t.shade} stroke={INK} strokeWidth={2.4} />

      {/* THE GRILLE, running from the hood line down to the bumper. A tall square
          front is what says full-size and modern; a small opening in a long flat
          nose is a different truck from a different decade. */}
      <rect x={148} y={-67} width={21} height={31} fill="#2f3338" stroke={INK} strokeWidth={2.6} />
      {[-62, -56, -50, -44].map((gy) => (
        <path key={gy} d={`M150,${gy} l17,0`} stroke="#9aa0a6" strokeWidth={1.8} opacity={0.7} />
      ))}
      <rect x={150} y={-34} width={18} height={7} rx={2} fill="#e8e2cc" stroke={INK}
        strokeWidth={2} />
      {/* rear lamps and the bumper */}
      <rect x={-170} y={-60} width={7} height={17} rx={2} fill="#8a2a24" stroke={INK}
        strokeWidth={2} />
      <rect x={-174} y={-34} width={16} height={8} rx={2} fill="#9aa0a6" stroke={INK}
        strokeWidth={2.2} />
      {/* mud flaps, which every working truck has and no drawing of one ever does */}
      {[-119, 84].map((fx) => (
        <rect key={fx} x={fx} y={-24} width={12} height={20} rx={2} fill="#2a2a2e"
          stroke={INK} strokeWidth={2} />
      ))}
      <path d="M62,-73 q3,-16 5,-24" stroke="#2a2a2e" strokeWidth={2} fill="none" />

      {toolbox && (
        <g>
          <path d="M-70,-68 L-70,-82 Q-70,-86 -65,-86 L-38,-86 Q-33,-86 -33,-82 L-33,-68 Z"
            fill="#b6bcc2" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <path d="M-68,-82 L-35,-82" stroke="#8e9298" strokeWidth={2} />
          <circle cx={-51} cy={-75} r={2.2} fill={INK} />
        </g>
      )}
      {headache && (
        <g>
          <path d="M-63,-68 L-63,-110 L-28,-110 L-28,-68" fill="none" stroke="#5a6066"
            strokeWidth={4} strokeLinejoin="round" />
          {[-54, -45, -36].map((bx) => (
            <path key={bx} d={`M${bx},-110 L${bx},-68`} stroke="#5a6066" strokeWidth={2.4} />
          ))}
        </g>
      )}
      {flagWhip && (
        <g>
          {/* Required on lease roads so a truck is visible over a caliche rise. It is
              the single cheapest mark that says oilfield rather than ranch. */}
          <path d={`M-158,-68 q${whip * 0.4},-62 ${whip},-120`} stroke="#e8e4d8"
            strokeWidth={3} fill="none" strokeLinecap="round" />
          <path d={`M${whip},-188 l18,7 l-17,7 Z`} fill="#e0631f" stroke={INK} strokeWidth={2.2} />
        </g>
      )}
      {dog && (
        <g transform="translate(-118 -68)">
          <ellipse cx={0} cy={-9} rx={15} ry={8} fill="#6b5540" stroke={INK} strokeWidth={2.6} />
          <path d="M-14,-12 q-8,-2 -12,4" stroke="#6b5540" strokeWidth={5} fill="none"
            strokeLinecap="round" />
          <circle cx={14} cy={-17} r={7} fill="#7a6248" stroke={INK} strokeWidth={2.6} />
          <path d="M20,-16 q7,1 8,3 q-4,2 -8,1 Z" fill="#4a3c2c" stroke={INK} strokeWidth={2} />
          <path d="M9,-22 q-2,-8 4,-8 q3,4 2,8 Z" fill="#5f4c38" stroke={INK} strokeWidth={2.2} />
          <circle cx={16} cy={-19} r={1.6} fill={INK} />
        </g>
      )}
      {decal && (
        <g>
          {/* A door decal is SMALL. The first version set it at eleven percent of the
              truck's height and it spanned the whole door like a bus livery. */}
          <rect x={-26} y={-54} width={40} height={11} rx={1.5} fill="#f2ede2" opacity={0.14} />
          <text x={-6} y={-46} fontSize={7} textAnchor="middle" fill="#f2ede2"
            fontFamily={FONT.body} opacity={0.92} letterSpacing={0.5}
            transform={facing < 0 ? 'scale(-1 1) translate(12 0)' : undefined}>{decal}</text>
        </g>
      )}
      {hauling && <path d="M-168,-40 l-16,0" stroke="#4a4a50" strokeWidth={5}
        strokeLinecap="round" />}
    </g>
  );
};

// =============================================================================
// STOCK TRAILER — slatted aluminium, gooseneck. Behind a pickup, or dropped in a
// pen on its jack with nothing pulling it, which is what they mostly are.
// =============================================================================
export const StockTrailer: React.FC<Rig & {loaded?: boolean; dirt?: number}> = ({
  x = 0, y = 0, scale = 1, facing = 1, seed = 2, loaded = false, dirt = 0.5,
}) => {
  const K = fit('stockTrailer', 100);                   // local frame: 100 units to the roof
  const uid = useUid('st');
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * K * facing} ${scale * K})`}>
      <defs>
        <clipPath id={`${uid}_clip`}>
          <rect x={-160} y={-100} width={320} height={100} />
        </clipPath>
      </defs>
      <ContactShadow cx={-20} cy={1} rx={150} opacity={0.26} blur={8} />
      {[-96, -58].map((wx) => (
        <g key={wx}>
          <circle cx={wx} cy={-19} r={19} fill="#1c1c20" stroke={INK} strokeWidth={3} />
          <circle cx={wx} cy={-19} r={9} fill="#8e9298" stroke={INK} strokeWidth={2.2} />
        </g>
      ))}
      {/* the box, and the GOOSENECK, which is the shape that says stock trailer */}
      <path d="M-150,-30 L-150,-88 L60,-88 L60,-56 L120,-56 L120,-88 L152,-88 L152,-30 Z"
        fill="#c2c6ca" stroke={INK} strokeWidth={3.4} strokeLinejoin="round" />
      <path d="M120,-88 L146,-100 L152,-88 Z" fill="#b0b5ba" stroke={INK} strokeWidth={3}
        strokeLinejoin="round" />
      {/* THE SLATS. Horizontal, evenly spaced, and you can see through them. */}
      {[-80, -70, -60, -50, -40].map((sy) => (
        <path key={sy} d={`M-146,${sy} L56,${sy}`} stroke="#8d9297" strokeWidth={3.4}
          opacity={0.9} />
      ))}
      {loaded && [-130, -108, -86, -64, -42, -20, 2, 24].map((cx2, i) => (
        <ellipse key={cx2} cx={cx2} cy={-46 + (i % 2) * 4} rx={9} ry={12}
          fill={i % 3 === 0 ? '#7d4a2e' : i % 3 === 1 ? '#3a3128' : '#b8763f'} opacity={0.9} />
      ))}
      <path d="M-150,-30 L152,-30" stroke={INK} strokeWidth={3} />
      {/* the jack, because a dropped trailer stands on one */}
      <path d="M132,-30 L132,-4 M124,-4 l16,0" stroke="#5a6066" strokeWidth={4}
        strokeLinecap="round" />
      <g clipPath={`url(#${uid}_clip)`}>
        <rect x={-160} y={-42} width={320} height={42} fill="#a08a68" opacity={dirt * 0.45} />
      </g>
    </g>
  );
};

// =============================================================================
// TRANSFORMER HAUL — a lowboy with a distribution transformer strapped to it, and
// it is the best picture this show has of its own subject.
//
// Every story here ends at the same physical fact: a data centre needs a
// connection, a connection needs a transformer, and a transformer is a
// slow-moving oversize load on a two-lane road with a pilot car. The queue that
// everybody writes about in the abstract is THIS, on a trailer, going forty.
//
// Nobody draws it. That is the argument for drawing it.
// =============================================================================
export const TransformerHaul: React.FC<Rig & {dirt?: number; oversize?: boolean}> = ({
  x = 0, y = 0, scale = 1, facing = 1, seed = 3, dirt = 0.45, oversize = true,
}) => {
  const L = useLight();
  const t = tones('#6f7681', L);
  const K = fit('transformerHaul', 100);                // local frame: 100 units, loaded
  const uid = useUid('th');
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * K * facing} ${scale * K})`}>
      <defs><FormGradient id={`${uid}_t`} t={t} softness={0.6} /></defs>
      <ContactShadow cx={0} cy={1} rx={190} opacity={0.3} blur={10} />
      {/* tractor wheels, then the lowboy's many small ones: the axle count IS the
          load rating, and a heavy haul on four wheels reads wrong to anyone who
          has been passed by one */}
      {[112, 84].map((wx) => (
        <circle key={wx} cx={wx} cy={-15} r={15} fill="#1c1c20" stroke={INK} strokeWidth={2.6} />
      ))}
      {[-140, -122, -104, -86].map((wx) => (
        <circle key={wx} cx={wx} cy={-12} r={12} fill="#1c1c20" stroke={INK} strokeWidth={2.4} />
      ))}
      {/* the tractor */}
      <path d="M62,-24 L62,-62 Q62,-70 72,-70 L112,-70 Q124,-70 128,-58 L132,-30 L132,-24 Z"
        fill="#8c1f22" stroke={INK} strokeWidth={3.2} strokeLinejoin="round" />
      <path d="M78,-46 L78,-64 L108,-64 L114,-46 Z" fill="#5d7180" stroke={INK}
        strokeWidth={2.4} />
      {/* the stack, which is what makes a tractor a tractor from the side */}
      <path d="M66,-70 L66,-104 l7,0 l0,34 Z" fill="#9aa0a6" stroke={INK} strokeWidth={2.4} />
      {/* the deck: DROPPED between the axles, which is the whole point of a lowboy */}
      <path d="M-152,-24 L-152,-34 L-60,-34 L-52,-46 L58,-46 L58,-24 Z"
        fill="#4a4f56" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      {/* THE TRANSFORMER. A tank, radiator fins down each side, bushings on top. */}
      <g>
        <rect x={-136} y={-88} width={78} height={54} rx={3} fill={`url(#${uid}_t)`}
          stroke={INK} strokeWidth={3.4} />
        {[-134, -128, -122].map((rx2) => (
          <path key={rx2} d={`M${rx2},-84 L${rx2},-40`} stroke="#565c66" strokeWidth={3.4} />
        ))}
        {[-70, -64].map((rx2) => (
          <path key={rx2} d={`M${rx2},-84 L${rx2},-40`} stroke="#565c66" strokeWidth={3.4} />
        ))}
        {[-118, -100, -82].map((bx) => (
          <g key={bx}>
            <path d={`M${bx},-88 L${bx - 3},-108 l9,0 Z`} fill="#c9c2b0" stroke={INK}
              strokeWidth={2.4} strokeLinejoin="round" />
            {[-92, -98, -104].map((sy) => (
              <path key={sy} d={`M${bx - 5},${sy} l10,0`} stroke="#a9a294" strokeWidth={1.8} />
            ))}
          </g>
        ))}
        {/* the straps, because an unsecured load is the one thing a hauler notices */}
        {[-120, -84].map((sx) => (
          <path key={sx} d={`M${sx},-90 L${sx},-32`} stroke="#e0a13f" strokeWidth={3}
            opacity={0.9} />
        ))}
      </g>
      {oversize && (
        <g>
          <rect x={-104} y={-124} width={92} height={16} rx={2} fill="#e8c53f" stroke={INK}
            strokeWidth={2.4} />
          <text x={-58} y={-112} fontSize={11} textAnchor="middle" fill={INK}
            fontFamily={FONT.body} fontWeight={700}
            transform={facing < 0 ? 'scale(-1 1) translate(116 0)' : undefined}>OVERSIZE LOAD</text>
          {[-148, -8].map((fx) => (
            <path key={fx} d={`M${fx},-108 l0,-16 l14,5 l-14,5`} fill="#e0631f" stroke={INK}
              strokeWidth={2} />
          ))}
        </g>
      )}
      <rect x={-155} y={-30} width={310} height={6} fill="#a08a68" opacity={dirt * 0.4} />
    </g>
  );
};

// =============================================================================
// TANKER — the Permian traffic that makes those two-lane roads dangerous, and now
// also the water truck, which is the same vehicle doing the newer story. A barrel
// on a frame, with the walkway and the valve gear that says it carries liquid
// rather than grain.
// =============================================================================
export const Tanker: React.FC<Rig & {water?: boolean; dirt?: number}> = ({
  x = 0, y = 0, scale = 1, facing = 1, seed = 4, water = false, dirt = 0.6,
}) => {
  const L = useLight();
  const t = tones(water ? '#8d9aa4' : '#2f3338', L);
  const K = fit('tanker', 100);                         // local frame: 100 units to the barrel
  const uid = useUid('tk');
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * K * facing} ${scale * K})`}>
      <defs><FormGradient id={`${uid}_t`} t={t} softness={0.75} /></defs>
      <ContactShadow cx={0} cy={1} rx={165} opacity={0.28} blur={9} />
      {[96, 68, -60, -84].map((wx) => (
        <circle key={wx} cx={wx} cy={-16} r={16} fill="#1c1c20" stroke={INK} strokeWidth={2.6} />
      ))}
      <path d="M48,-26 L48,-64 Q48,-72 58,-72 L96,-72 Q108,-72 112,-60 L116,-32 L116,-26 Z"
        fill="#25457a" stroke={INK} strokeWidth={3.2} strokeLinejoin="round" />
      <path d="M62,-48 L62,-66 L92,-66 L98,-48 Z" fill="#5d7180" stroke={INK} strokeWidth={2.4} />
      <path d="M52,-72 L52,-102 l6,0 l0,30 Z" fill="#9aa0a6" stroke={INK} strokeWidth={2.4} />
      {/* THE BARREL, with real end caps: a flat-ended cylinder reads as a box */}
      <rect x={-134} y={-84} width={176} height={54} rx={26} fill={`url(#${uid}_t)`}
        stroke={INK} strokeWidth={3.4} />
      <path d="M-108,-84 q-6,27 0,54 M14,-84 q6,27 0,54" stroke={INK} strokeWidth={2.2}
        fill="none" opacity={0.45} />
      {/* walkway and hatches along the top */}
      <path d="M-120,-86 L28,-86" stroke="#8e9298" strokeWidth={3} />
      {[-92, -50, -8].map((hx) => (
        <rect key={hx} x={hx} y={-92} width={16} height={7} rx={2} fill="#9aa0a6"
          stroke={INK} strokeWidth={2} />
      ))}
      {/* the valve gear underneath, which is what says liquid rather than grain */}
      <path d="M-60,-30 l0,10 l24,0" stroke="#5a6066" strokeWidth={4} fill="none"
        strokeLinecap="round" />
      <circle cx={-36} cy={-20} r={5} fill="none" stroke="#5a6066" strokeWidth={3} />
      {water && (
        <text x={-46} y={-52} fontSize={16} textAnchor="middle" fill="#233" opacity={0.55}
          fontFamily={FONT.body}
          transform={facing < 0 ? 'scale(-1 1) translate(92 0)' : undefined}>NON-POTABLE</text>
      )}
      <rect x={-140} y={-30} width={280} height={6} fill="#a08a68" opacity={dirt * 0.5} />
    </g>
  );
};

// =============================================================================
// SLAB — Houston, and it is in KIT.md as specific, verified and joyful.
//
// THE TELL, and it is the whole car: SWANGAS. Chrome elbow wheels that protrude a
// foot past the wheel face, so the wire spokes stand out from the body like a
// cone. Candy paint over a full-size American sedan, and the trunk open on the
// drive so the wheels and the boot are both on show.
//
// Draw it wrong and it is a purple car. Draw the wheels standing out and it is
// unmistakable to anybody from Houston and to nobody else, which is exactly the
// kind of detail this show should be spending its attention on.
// =============================================================================
export const Slab: React.FC<Rig & {candy?: string; trunkOpen?: boolean}> = ({
  x = 0, y = 0, scale = 1, facing = 1, seed = 5, candy = '#5b2a86', trunkOpen = true,
}) => {
  const L = useLight();
  const t = tones(candy, L);
  const K = fit('slab', 100);                           // local frame: 100 units to the roof
  const uid = useUid('sl');
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * K * facing} ${scale * K})`}>
      <defs><FormGradient id={`${uid}_b`} t={t} softness={0.35} /></defs>
      <ContactShadow cx={0} cy={1} rx={168} opacity={0.3} blur={8} />
      {/* long, low, flat: a full-size American sedan and never a hatchback */}
      <path
        d="M-168,-30 L-168,-52 Q-160,-58 -132,-60 L-96,-62 L-56,-88 Q-50,-93 -34,-93
           L48,-93 Q64,-93 70,-86 L100,-62 L142,-58 Q166,-54 168,-46 L168,-30 Z"
        fill={`url(#${uid}_b)`} stroke={INK} strokeWidth={3.4} strokeLinejoin="round" />
      {/* candy paint is a FLAKE finish: it flips light rather than shading smoothly */}
      <path d="M-160,-48 L160,-44" stroke="#ffffff" strokeWidth={3} opacity={0.28} />
      <path d="M-92,-62 L96,-62" stroke="#ffffff" strokeWidth={2} opacity={0.18} />
      <path d="M-52,-86 L-24,-64 L44,-64 L62,-84 Z" fill="#4a5a66" stroke={INK}
        strokeWidth={2.6} opacity={0.9} />
      {trunkOpen && (
        <path d="M-168,-52 L-176,-96 L-136,-86 L-132,-60 Z" fill={candy} stroke={INK}
          strokeWidth={3} strokeLinejoin="round" />
      )}
      {/* THE SWANGAS, and the drawing problem they pose is the longhorn's problem
          again: a cone pointing at the viewer FORESHORTENS TO NOTHING in strict
          profile, so a careful side view of the most distinctive wheel in Texas
          renders as a plain wire wheel and the car becomes a purple sedan.
          What reads in profile is the one thing the elbow actually does to the
          silhouette: THE CHROME IS WIDER THAN THE TYRE AND IT OVERHANGS THE BODY.
          So the disc is drawn LARGER than the tyre and on top of the fender, which
          is the same fact stated in the one dimension a side view still has. */}
      {[-108, 106].map((wx) => (
        <g key={wx}>
          <circle cx={wx} cy={-26} r={26} fill="#15151a" stroke={INK} strokeWidth={3} />
          <circle cx={wx} cy={-26} r={31} fill="#cfd4d9" stroke={INK} strokeWidth={2.6} />
          <circle cx={wx} cy={-26} r={31} fill="none" stroke="#f4f7fa" strokeWidth={2}
            opacity={0.9} />
          {Array.from({length: 16}, (_, i) => {
            const a = (i / 16) * Math.PI * 2;
            return (
              <path key={i}
                d={`M${wx + Math.cos(a) * 6},${-26 + Math.sin(a) * 6}
                    L${wx + Math.cos(a) * 29},${-26 + Math.sin(a) * 29}`}
                stroke="#f2f4f6" strokeWidth={2} />
            );
          })}
          {/* the elbow standing proud, as a stack of rings stepping toward the viewer */}
          {[0.78, 0.56, 0.36, 0.2].map((r, i) => (
            <circle key={r} cx={wx} cy={-26} r={31 * r} fill="none" stroke="#eef1f4"
              strokeWidth={3 - i * 0.5} opacity={0.95 - i * 0.1} />
          ))}
          <circle cx={wx} cy={-26} r={6} fill="#f8fafc" stroke={INK} strokeWidth={2} />
        </g>
      ))}
      <rect x={158} y={-46} width={12} height={8} rx={2} fill="#e8e2cc" stroke={INK}
        strokeWidth={2} />
      <rect x={-172} y={-46} width={10} height={8} rx={2} fill="#8a2a24" stroke={INK}
        strokeWidth={2} />
    </g>
  );
};

// =============================================================================
// BUCKET TRUCK — the utility line truck. Boom stowed on the drive, boom up with a
// lineman in it at the pole. In a grid story it is the only vehicle that puts a
// PERSON at the height of the problem.
// =============================================================================
export const BucketTruck: React.FC<Rig & {boom?: number; dirt?: number}> = ({
  x = 0, y = 0, scale = 1, facing = 1, seed = 6, boom = 0, dirt = 0.4,
}) => {
  const K = fit('bucketTruck', 100);                    // local frame: 100 units, stowed
  const b = Math.max(0, Math.min(1, boom));
  const ang = -14 - b * 58;                            // stowed along the bed, up at the pole
  const ext = 60 + b * 110;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * K * facing} ${scale * K})`}>
      <ContactShadow cx={0} cy={1} rx={130} opacity={0.28} blur={8} />
      {[70, -76, -100].map((wx) => (
        <circle key={wx} cx={wx} cy={-17} r={17} fill="#1c1c20" stroke={INK} strokeWidth={2.8} />
      ))}
      {/* cab */}
      <path d="M40,-28 L40,-68 Q40,-76 50,-76 L84,-76 Q94,-76 98,-66 L102,-38 L102,-28 Z"
        fill="#e0e3e6" stroke={INK} strokeWidth={3.2} strokeLinejoin="round" />
      <path d="M52,-52 L52,-70 L80,-70 L86,-52 Z" fill="#5d7180" stroke={INK} strokeWidth={2.4} />
      {/* the utility body: compartment doors down the side, which is what makes it
          a line truck and not a flatbed */}
      <rect x={-120} y={-64} width={156} height={36} fill="#e0e3e6" stroke={INK}
        strokeWidth={3.2} />
      {/* A DOOR IS A PANEL, NOT A HOLE. These were `fill="none"` over a near-white body,
          so four unfilled rectangles on a white slab read as four white boxes and the
          truck read as a flatbed carrying crates. Exactly the fault the pole sign's
          reader-board had, in a second file: an open rectangle drawn on top of something
          takes the colour of what is behind it, and what is behind it is never what the
          shape is supposed to be made of. A door gets its own fill and a handle. */}
      {[-112, -76, -40, -4].map((dx) => (
        <g key={dx}>
          <rect x={dx} y={-60} width={30} height={28} rx={2} fill="#cdd2d6"
            stroke="#8d949a" strokeWidth={2.2} />
          <path d={`M${dx + 22},-50 l0,8`} stroke="#6f767c" strokeWidth={2.4}
            strokeLinecap="round" />
        </g>
      ))}
      {/* outriggers down when the boom is up, because a boom up on its wheels is
          a thing no lineman has ever done */}
      {b > 0.15 && [-126, 30].map((ox) => (
        <path key={ox} d={`M${ox},-40 l${ox < 0 ? -14 : 14},22 l0,6`} stroke="#e8c53f"
          strokeWidth={4} fill="none" strokeLinecap="round" />
      ))}
      {/* THE STOWED BOOM RESTS ON SOMETHING. Without a cradle it hung in the air just
          clear of the body, and since it was painted the same near-white as the body and
          the bucket, the whole assembly read as a loose white slab floating over the bed
          rather than as a boom lying in its rest. The cradle is drawn first so the boom
          lands in it, and the boom and bucket step down in value from the body so the
          three shapes separate instead of merging into one white mass. */}
      <path d="M-74,-58 L-46,-58 L-52,-78 L-68,-78 Z" fill="#b4babf" stroke={INK}
        strokeWidth={3} strokeLinejoin="round" />
      <circle cx={-60} cy={-66} r={7} fill="#8d949a" stroke={INK} strokeWidth={2.6} />
      {/* the boom */}
      <g transform={`translate(-60 -66) rotate(${ang})`}>
        <rect x={0} y={-7} width={ext} height={14} rx={3} fill="#c2c7cc" stroke={INK}
          strokeWidth={3} />
        <rect x={ext * 0.5} y={-5} width={ext * 0.5} height={10} rx={2} fill="#a8aeb4"
          stroke={INK} strokeWidth={2.2} />
        <g transform={`translate(${ext} 0) rotate(${-ang})`}>
          <path d="M-13,-20 L13,-20 L11,4 L-11,4 Z" fill="#e6e9ec" stroke={INK}
            strokeWidth={3} strokeLinejoin="round" />
          <path d="M-13,-10 L13,-10" stroke="#8d949a" strokeWidth={2} />
        </g>
      </g>
      <rect x={-124} y={-30} width={230} height={5} fill="#a08a68" opacity={dirt * 0.45} />
    </g>
  );
};
