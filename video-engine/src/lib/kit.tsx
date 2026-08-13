import React from 'react';
import {useUid} from './uid';
import {tones, FormGradient, RimLight, ContactShadow, useLight, Galvanized, RustStreak,
        CalicheDust, BrushedMetal, INK} from './lighting';

// =============================================================================
// KIT — the drawable Texas inventory. knowledge/texas/KIT.md is the source.
//
// TWO HOUSE RULES, BOTH ENFORCED BY CONSTRUCTION RATHER THAN BY REMEMBERING.
//
// MAINTAINED BUT WORN. Every object takes a `wear` prop, 0 to 1, and spends it on
// rust streaks, a dent, a lean, dust up the lower half. New reads as a render.
// Ruined reads as apocalypse. Texas is neither, and the default is 0.35.
//
// NOTHING IS SYMMETRIC. Vector tooling pulls toward symmetry and real objects
// resist it, so every component takes a `seed` and derives its own lopsidedness
// from it: which way a post leans, where the dent is, how the tail vane sits.
// Deterministic, because a re-render that draws something different cannot be
// reviewed.
// =============================================================================

/** deterministic 0..1 from a seed and a channel name */
function rnd(seed: number, ch: number): number {
  const k = ((seed * 2654435761) ^ (ch * 40503)) >>> 0;
  return ((k >>> 8) % 10000) / 10000;
}

/** Draw units per metre, from the Character rig: 610 units sole to crown at 1.70 m. */
const M = 610 / 1.7;

/**
 * THE MODULE THAT SKIPPED TRUE SCALE, and the one that then broke a board.
 *
 * `fauna`, `vehicles` and `civics` all declare a real dimension and fit their local
 * frame to it, so `scale={1}` means one thing everywhere and a longhorn beside a
 * person is right without anyone thinking about it. This file did not: every object
 * was drawn at whatever size read well in a review sheet, so `scale` here was a
 * private convention per component and a board author had to discover each one by
 * rendering it.
 *
 * `local` is the reference height in the drawing's own frame -- the number the
 * paths were built around -- and `h` is what that height IS in metres. A component
 * that takes an `h` prop keeps taking it: passing a different local height is how
 * you draw a shorter tower, and it scales proportionally because it goes through
 * the same fit.
 *
 * The heights are measurements of ordinary Texas examples, not of record holders.
 */
export const KIT_M: Record<string, {h: number; local: number; note: string}> = {
  pumpjack: {h: 6.5, local: 150, note: 'to the top of the samson post, a common pumping unit'},
  dataCentre: {h: 12, local: 120, note: 'single-storey hall, ground to the roof line'},
  transformer: {h: 4.5, local: 104, note: 'a substation power transformer, tank and bushings'},
  latticeTower: {h: 45, local: 300, note: 'a 345 kV lattice suspension tower'},
  windTurbine: {h: 100, local: 340, note: 'hub height. The blades reach above it.'},
  windmill: {h: 10, local: 210, note: 'an Aermotor farm windmill on a 33 foot tower'},
  stockTank: {h: 1.2, local: 30, note: 'the bank of an earthen tank, at the near rim'},
  cattleGuard: {h: 0.3, local: 32, note: 'the pipe deck, which sits nearly flush in the road'},
  waterTower: {h: 40, local: 260, note: 'a municipal tower, ground to the top of the bowl'},
  mesquite: {h: 6, local: 96, note: 'a mature mesquite at the crown'},
  pricklyPear: {h: 1.2, local: 70, note: 'a clump at the top pad'},
};

/** Local reference height to true scale. Pass a component's own `h` to keep it
 *  proportional when a board asks for a shorter one. */
const fit = (k: keyof typeof KIT_M, local = KIT_M[k].local) => (KIT_M[k].h * M) / local;

export interface KitProps {
  x?: number; y?: number; scale?: number; seed?: number; wear?: number;
  facing?: 1 | -1;
}

// =============================================================================
// PUMPJACK — the single most recognisable Texas industrial silhouette.
//
// THE DETAIL THAT SELLS A FIELD: every unit is at a DIFFERENT POINT IN ITS STROKE.
// A row of synchronised pumpjacks is the tell that nobody looked. `phase` is
// derived from the seed by default so a field of them is automatically out of step,
// and a caller has to work to make them match rather than the reverse.
// =============================================================================
export const Pumpjack: React.FC<KitProps & {
  frame: number; rpm?: number; phase?: number; abandoned?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 1, wear = 0.35, facing = 1, frame,
       rpm = 8, phase, abandoned = false}) => {
  const L = useLight();
  const ph = phase ?? rnd(seed, 1) * Math.PI * 2;
  // An abandoned unit is FROZEN mid-stroke and rusted. One next to a working one is a
  // whole story with no words in it.
  const t = abandoned ? ph : ph + (frame / 30) * (rpm / 60) * Math.PI * 2;
  const beamDeg = Math.sin(t) * 13;

  const body = abandoned ? '#7a6a5a' : '#4d6b86';
  const tb = tones(body, L);
  const uid = useUid('pj');

  const K = fit('pumpjack');
  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      <defs><FormGradient id={`${uid}_b`} t={tb} softness={0.6} /></defs>
      <ContactShadow cx={0} cy={2} rx={128} opacity={0.3} blur={12} />

      {/* concrete pad */}
      <rect x={-140} y={-8} width={280} height={12} fill="#b9b0a2" stroke={INK} strokeWidth={4} />

      {/* samson post — a braced A-frame, and the brace is what makes it read */}
      <path d="M-6,-8 L-4,-150 L4,-150 L6,-8 Z" fill={`url(#${uid}_b)`} stroke={INK} strokeWidth={5} />
      <path d="M-52,-8 L-4,-140 M52,-8 L4,-140" stroke={`url(#${uid}_b)`} strokeWidth={9}
        fill="none" />
      <path d="M-52,-8 L-4,-140 M52,-8 L4,-140" stroke={INK} strokeWidth={12} fill="none"
        opacity={0.001} />

      {/* the walking beam, pivoting on the post */}
      <g transform={`rotate(${beamDeg} 0 -150)`}>
        <rect x={-118} y={-160} width={236} height={20} rx={4} fill={`url(#${uid}_b)`}
          stroke={INK} strokeWidth={5} />
        {/* horsehead — the shape everybody knows */}
        <path d="M118,-160 q34,2 40,26 q4,26 -22,42 q-16,8 -22,-6 l-8,-42 Z"
          fill={`url(#${uid}_b)`} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        {/* bridle cables down to the polished rod */}
        <path d="M150,-96 L150,-8 M162,-100 L162,-8" stroke={INK} strokeWidth={3.4} opacity={0.85} />
        {/* counterweight on the tail */}
        <circle cx={-118} cy={-150} r={30} fill="#3f4a58" stroke={INK} strokeWidth={5} />
        <circle cx={-118} cy={-150} r={11} fill="#2a323d" stroke={INK} strokeWidth={3.4} />
      </g>

      {/* pitman arms + crank, tied to the same phase so the linkage is honest */}
      <g transform={`translate(-118 -78)`}>
        <circle cx={0} cy={0} r={26} fill="#3f4a58" stroke={INK} strokeWidth={5} />
        <path d={`M0,0 L${Math.cos(t) * 26},${Math.sin(t) * 26}`} stroke="#2a323d" strokeWidth={7} />
      </g>

      {/* prime mover shed */}
      <rect x={-104} y={-64} width={62} height={56} rx={3} fill="#6f7a5e" stroke={INK} strokeWidth={5} />
      {wear > 0.2 && <RustStreak x={-104} y={-64} w={62} h={56} seed={seed} opacity={wear} />}
      {wear > 0.2 && <RustStreak x={-6} y={-150} w={12} h={142} seed={seed + 7} opacity={wear * 0.8} />}
      {abandoned && <CalicheDust x={-140} y={-70} w={280} h={70} opacity={0.5} />}
    </g>
  );
};

// =============================================================================
// PUMPJACK FIELD — the composition this show is built on, and the one that has to
// be right. Each unit gets its own phase, scale and wear from its index, so the
// field is never in step.
// =============================================================================
export const PumpjackField: React.FC<{
  frame: number; n?: number; y?: number; spread?: number; seed?: number;
}> = ({frame, n = 5, y = 0, spread = 1080, seed = 3}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const k = rnd(seed, i);
      const depth = 0.42 + (i / n) * 0.5;      // further units smaller and paler
      return (
        <g key={i} opacity={0.55 + depth * 0.45}>
          <Pumpjack frame={frame} seed={seed * 13 + i * 7}
            x={40 + (i / Math.max(1, n - 1)) * spread + (k - 0.5) * 90}
            y={y - (1 - depth) * 120}
            scale={depth * 0.7}
            rpm={7 + k * 4}
            abandoned={i === Math.floor(n * 0.6)}
            wear={0.25 + k * 0.4} />
        </g>
      );
    })}
  </g>
);

// =============================================================================
// DATA CENTRE — a LOW WINDOWLESS SLAB ON CALICHE. Not a glass tech campus. That
// single correction is most of what makes our beat look honest.
// =============================================================================
export const DataCentre: React.FC<KitProps & {w?: number; h?: number; units?: number}> = ({
  x = 0, y = 0, scale = 1, seed = 2, wear = 0.2, w = 620, h = 120, units = 7,
}) => {
  const L = useLight();
  const tw = tones('#c9c4bb', L);
  const uid = useUid('dc');
  const K = fit('dataCentre', h);
  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <defs><FormGradient id={`${uid}_w`} t={tw} softness={0.5} /></defs>
      <ContactShadow cx={w / 2} cy={4} rx={w * 0.56} opacity={0.28} blur={14} />
      {/* the slab */}
      <rect x={0} y={-h} width={w} height={h} fill={`url(#${uid}_w)`} stroke={INK} strokeWidth={5} />
      {/* tilt-wall panel joints, which is what says CONCRETE rather than metal box */}
      {Array.from({length: Math.floor(w / 74)}, (_, i) => (
        <line key={i} x1={(i + 1) * 74} y1={-h} x2={(i + 1) * 74} y2={0} stroke={INK}
          strokeWidth={2.4} opacity={0.45} />
      ))}
      {/* roof units in rows */}
      {Array.from({length: units}, (_, i) => (
        <g key={i}>
          <rect x={26 + i * ((w - 60) / units)} y={-h - 26} width={(w - 60) / units - 14}
            height={26} fill="#9aa3ad" stroke={INK} strokeWidth={4} />
          <BrushedMetal x={26 + i * ((w - 60) / units)} y={-h - 26}
            w={(w - 60) / units - 14} h={26} opacity={0.2} />
        </g>
      ))}
      {/* louvre bank: a data centre is mostly air handling and it should look it */}
      <rect x={w * 0.62} y={-h + 22} width={w * 0.3} height={h - 44} fill="#8d949c"
        stroke={INK} strokeWidth={4} />
      {Array.from({length: 7}, (_, i) => (
        <line key={i} x1={w * 0.62} y1={-h + 30 + i * ((h - 58) / 6)} x2={w * 0.92}
          y2={-h + 30 + i * ((h - 58) / 6)} stroke={INK} strokeWidth={2.6} opacity={0.6} />
      ))}
      {/* one door, human-scaled, so the slab reads as enormous */}
      <rect x={w * 0.10} y={-46} width={20} height={46} fill="#4a5158" stroke={INK} strokeWidth={4} />
      {wear > 0.1 && <CalicheDust x={0} y={-h * 0.5} w={w} h={h * 0.5} opacity={0.5} />}
    </g>
  );
};

// =============================================================================
// SUBSTATION — switchgear, gantry, bus work, and a transformer with RADIATOR FINS
// AND BUSHINGS, which are the two details that stop it reading as a shipping
// container.
// =============================================================================
export const Transformer: React.FC<KitProps> = ({
  x = 0, y = 0, scale = 1, seed = 4, wear = 0.4,
}) => {
  const L = useLight();
  const tb = tones('#8a9199', L);
  const uid = useUid('tf');
  const K = fit('transformer');
  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <defs><FormGradient id={`${uid}_t`} t={tb} softness={0.58} /></defs>
      <ContactShadow cx={0} cy={2} rx={78} opacity={0.3} blur={10} />
      {/* tank */}
      <rect x={-58} y={-104} width={116} height={104} rx={4} fill={`url(#${uid}_t)`}
        stroke={INK} strokeWidth={5} />
      {/* RADIATOR FINS — draw them, they are the tell */}
      {[-1, 1].map((s) => (
        <g key={s}>
          {Array.from({length: 6}, (_, i) => (
            <rect key={i} x={s === -1 ? -78 : 58} y={-96 + i * 15} width={20} height={10}
              fill="#79818a" stroke={INK} strokeWidth={2.6} />
          ))}
        </g>
      ))}
      {/* BUSHINGS on top — the porcelain stacks */}
      {[-30, 0, 30].map((bx) => (
        <g key={bx}>
          <path d={`M${bx - 9},-104 l3,-30 h12 l3,30 Z`} fill="#d9d2c4" stroke={INK} strokeWidth={4} />
          {[0, 1, 2].map((i) => (
            <ellipse key={i} cx={bx} cy={-112 - i * 9} rx={12 - i} ry={3.4} fill="#e6e0d2"
              stroke={INK} strokeWidth={2.4} />
          ))}
        </g>
      ))}
      <Galvanized x={-58} y={-104} w={116} h={104} seed={seed} opacity={0.12} />
      {wear > 0.25 && <RustStreak x={-58} y={-104} w={116} h={104} seed={seed} opacity={wear * 0.7} />}
    </g>
  );
};

// =============================================================================
// TRANSMISSION — lattice towers marching to the horizon, and the conductor SAGS in
// a catenary. A straight line between tower tops is the tell.
// =============================================================================
export const LatticeTower: React.FC<KitProps & {h?: number}> = ({
  x = 0, y = 0, scale = 1, h = 300,
}) => {
  const w = h * 0.34;
  const K = fit('latticeTower', h);
  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      {/* legs */}
      <path d={`M${-w / 2},0 L${-w * 0.14},${-h} M${w / 2},0 L${w * 0.14},${-h}`}
        stroke={INK} strokeWidth={5} fill="none" />
      {/* lattice X bracing, tightening toward the top */}
      {Array.from({length: 9}, (_, i) => {
        const t0 = i / 9, t1 = (i + 1) / 9;
        const y0 = -h * t0, y1 = -h * t1;
        const w0 = (w / 2) * (1 - t0 * 0.72), w1 = (w / 2) * (1 - t1 * 0.72);
        return (
          <g key={i} stroke={INK} strokeWidth={2.6} fill="none">
            <path d={`M${-w0},${y0} L${w1},${y1} M${w0},${y0} L${-w1},${y1}`} />
            <path d={`M${-w1},${y1} L${w1},${y1}`} />
          </g>
        );
      })}
      {/* cross arms + insulator strings hanging VERTICALLY at a tangent structure */}
      {[0.80, 0.92].map((t, i) => (
        <g key={i}>
          <path d={`M${-w * 0.72},${-h * t} L${w * 0.72},${-h * t}`} stroke={INK} strokeWidth={4.6} />
          {[-1, 1].map((s) => (
            <g key={s}>
              <path d={`M${s * w * 0.66},${-h * t} v20`} stroke={INK} strokeWidth={2.6} />
              {[0, 1, 2, 3].map((k) => (
                <ellipse key={k} cx={s * w * 0.66} cy={-h * t + 5 + k * 4.6} rx={4.4} ry={2}
                  fill="#d9d2c4" stroke={INK} strokeWidth={1.4} />
              ))}
            </g>
          ))}
        </g>
      ))}
    </g>
  );
};

/** A catenary between two towers. `sag` is the drop at midspan as a fraction of the
 *  span, and it is REQUIRED to be non-zero: a straight conductor is the tell. */
export const Conductor: React.FC<{
  x1: number; y1: number; x2: number; y2: number; sag?: number; w?: number;
}> = ({x1, y1, x2, y2, sag = 0.09, w = 2.6}) => {
  const mx = (x1 + x2) / 2;
  const drop = Math.abs(x2 - x1) * sag;
  return (
    <path d={`M${x1},${y1} Q${mx},${(y1 + y2) / 2 + drop * 2} ${x2},${y2}`}
      stroke={INK} strokeWidth={w} fill="none" opacity={0.85} />
  );
};

// =============================================================================
// WIND TURBINE — three blades, and they turn SLOWLY. A fast-spinning turbine is a
// cartoon. The night version gets the synchronised red aviation light that every
// Panhandle farm shows after dark.
// =============================================================================
export const WindTurbine: React.FC<KitProps & {
  frame: number; h?: number; rpm?: number; night?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 5, frame, h = 340, rpm = 13, night = false}) => {
  const spin = (frame / 30) * (rpm / 60) * 360 + rnd(seed, 2) * 120;
  const bladeL = h * 0.46;
  const K = fit('windTurbine', h);
  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <path d={`M-9,0 L-5,${-h} L5,${-h} L9,0 Z`} fill="#e8e6e0" stroke={INK} strokeWidth={4.4} />
      <g transform={`translate(0 ${-h})`}>
        <rect x={-8} y={-11} width={34} height={22} rx={6} fill="#e8e6e0" stroke={INK} strokeWidth={4} />
        <g transform={`rotate(${spin})`}>
          {[0, 120, 240].map((a) => (
            <path key={a} transform={`rotate(${a})`}
              d={`M0,0 q7,${-bladeL * 0.5} 2,${-bladeL} q-5,4 -8,2 Z`}
              fill="#f2f0ea" stroke={INK} strokeWidth={3.6} strokeLinejoin="round" />
          ))}
          <circle r={7} fill="#cfcabd" stroke={INK} strokeWidth={3.4} />
        </g>
        {night && (
          // synchronised across a farm: every unit blinks together, which is the eerie
          // and specific thing about a Panhandle wind farm at night.
          <circle cx={9} cy={-14} r={6}
            fill={Math.floor(frame / 15) % 2 === 0 ? '#e8402a' : '#5a1a12'} />
        )}
      </g>
    </g>
  );
};

// =============================================================================
// THE RURAL KIT
// =============================================================================

/** Windmill — the multi-blade fan on a lattice tower, with a TAIL VANE THAT SWINGS.
 *  The fan is a full disc of many blades, not three, and getting that wrong turns it
 *  into a wind turbine from the wrong century. */
export const Windmill: React.FC<KitProps & {frame: number; h?: number}> = ({
  x = 0, y = 0, scale = 1, seed = 6, frame, h = 210,
}) => {
  const spin = (frame / 30) * 44 + rnd(seed, 3) * 360;
  const vane = Math.sin(frame / 41 + rnd(seed, 4) * 6) * 9;   // the vane swings, it never sits still
  const K = fit('windmill', h);
  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      {/* four-leg lattice */}
      {[[-1, -1], [1, 1]].map(([a, b], i) => (
        <path key={i} d={`M${a * 26},0 L${b * 5},${-h}`} stroke={INK} strokeWidth={4} fill="none" />
      ))}
      <path d={`M-26,0 L-5,${-h} M26,0 L5,${-h}`} stroke={INK} strokeWidth={4} fill="none" />
      {Array.from({length: 6}, (_, i) => {
        const t = (i + 1) / 7;
        const ww = 26 * (1 - t * 0.8);
        return <line key={i} x1={-ww} y1={-h * t} x2={ww} y2={-h * t} stroke={INK} strokeWidth={2.4} />;
      })}
      <g transform={`translate(0 ${-h})`}>
        {/* the tail vane, swinging */}
        <g transform={`rotate(${vane})`}>
          <path d="M4,0 L54,-6 L54,20 L4,8 Z" fill="#b9b0a2" stroke={INK} strokeWidth={3.6} />
        </g>
        {/* the fan: a full disc of many blades */}
        <g transform={`rotate(${spin})`}>
          {Array.from({length: 16}, (_, i) => (
            <path key={i} transform={`rotate(${i * 22.5})`}
              d="M0,-6 L0,-34 L9,-30 L7,-4 Z" fill="#cfc7b6" stroke={INK} strokeWidth={2.2} />
          ))}
          <circle r={6} fill="#8a8272" stroke={INK} strokeWidth={3} />
        </g>
      </g>
    </g>
  );
};

/** Stock tank — and in drought it shows a BATHTUB RING and a cracked bed, which is
 *  the drawable image of a Texas water story. */
export const StockTank: React.FC<KitProps & {drought?: number}> = ({
  x = 0, y = 0, scale = 1, seed = 7, drought = 0,
}) => {
  const L = useLight();
  const water = tones('#4a6f7a', L);
  const uid = useUid('st');
  const level = 1 - Math.max(0, Math.min(1, drought));
  const K = fit('stockTank');
  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <defs><FormGradient id={`${uid}_w`} t={water} softness={0.4} /></defs>
      <ellipse cx={0} cy={0} rx={118} ry={30} fill="#8a7b63" stroke={INK} strokeWidth={5} />
      {/* the ring the water used to reach */}
      {drought > 0.15 && (
        <ellipse cx={0} cy={-2} rx={110} ry={27} fill="none" stroke="#d8cbb0" strokeWidth={7}
          opacity={0.9} />
      )}
      {level > 0.05 && (
        <ellipse cx={0} cy={2 + (1 - level) * 12} rx={104 * level + 6} ry={(24 * level) + 3}
          fill={`url(#${uid}_w)`} stroke={INK} strokeWidth={3.4} />
      )}
      {/* cracked bed */}
      {drought > 0.5 && Array.from({length: 9}, (_, i) => {
        const a = rnd(seed, 10 + i) * Math.PI * 2;
        const r = 20 + rnd(seed, 20 + i) * 70;
        return <path key={i} d={`M${Math.cos(a) * r},${Math.sin(a) * r * 0.26}
          l${(rnd(seed, 30 + i) - 0.5) * 40},${(rnd(seed, 40 + i) - 0.5) * 12}`}
          stroke={INK} strokeWidth={2} opacity={0.5} fill="none" />;
      })}
    </g>
  );
};

/** Cattle guard — PARALLEL PIPES FLUSH IN THE ROAD with wing fences either side.
 *  Drawn right it is instantly legible. Drawn as a grate it is wrong. */
export const CattleGuard: React.FC<KitProps & {w?: number}> = ({
  x = 0, y = 0, scale = 1, w = 220,
}) => {
  const K = fit('cattleGuard');
  return (
  <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
    <rect x={-w / 2} y={-16} width={w} height={32} fill="#6f6558" stroke={INK} strokeWidth={4} />
    {Array.from({length: 9}, (_, i) => (
      <line key={i} x1={-w / 2 + 8} y1={-13 + i * 3.4} x2={w / 2 - 8} y2={-13 + i * 3.4}
        stroke="#b9b0a2" strokeWidth={3.4} strokeLinecap="round" />
    ))}
    {/* wing fences, leaning slightly, because a straight fence line is a tell */}
    {[-1, 1].map((s) => (
      <path key={s} d={`M${s * (w / 2)},-14 l${s * 54},-30`} stroke={INK} strokeWidth={4} />
    ))}
  </g>
  );
};

/** Water tower — town name and, if a town has one, a championship year. */
export const WaterTower: React.FC<KitProps & {town?: string; year?: string; h?: number}> = ({
  x = 0, y = 0, scale = 1, seed = 8, wear = 0.3, town = '', year = '', h = 260,
}) => {
  const L = useLight();
  const tb = tones('#dcd6c8', L);
  const uid = useUid('wt');
  const K = fit('waterTower', h);
  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <defs><FormGradient id={`${uid}_b`} t={tb} softness={0.52} /></defs>
      {[-1, 1].map((s) => (
        <path key={s} d={`M${s * 34},0 L${s * 13},${-h * 0.62}`} stroke={INK} strokeWidth={5} />
      ))}
      <path d={`M-34,0 L13,${-h * 0.62} M34,0 L-13,${-h * 0.62}`} stroke={INK} strokeWidth={2.6} />
      <ellipse cx={0} cy={-h * 0.62} rx={54} ry={16} fill={`url(#${uid}_b)`} stroke={INK} strokeWidth={5} />
      <path d={`M-54,${-h * 0.62} q0,-52 54,-52 q54,0 54,52 Z`} fill={`url(#${uid}_b)`}
        stroke={INK} strokeWidth={5} />
      {town && (
        <text x={0} y={-h * 0.62 - 20} fontSize={20} textAnchor="middle" fill={INK}
          fontFamily="Georgia, serif" fontWeight={700}>{town}</text>
      )}
      {year && (
        <text x={0} y={-h * 0.62 - 2} fontSize={13} textAnchor="middle" fill="#8a4a24"
          fontFamily="Georgia, serif">{year}</text>
      )}
      {wear > 0.2 && <RustStreak x={-50} y={-h * 0.62 - 40} w={100} h={44} seed={seed} opacity={wear * 0.6} />}
    </g>
  );
};

// =============================================================================
// MESQUITE — LOW, CROOKED, WIDE AND LACY. Never a generic round tree. It is the
// default tree for most of west and south Texas, so getting it wrong makes every
// frame in those regions wrong at once.
// =============================================================================
export const Mesquite: React.FC<KitProps & {w?: number; h?: number}> = ({
  x = 0, y = 0, scale = 1, seed = 9, w = 160, h = 96,
}) => {
  const lean = (rnd(seed, 1) - 0.5) * 16;
  const K = fit('mesquite', h);
  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale}) rotate(${lean * 0.2})`}>
      {/* the trunk DIVIDES NEAR THE GROUND, which is half of what makes it a mesquite */}
      <path d={`M0,0 q${-3 + lean * 0.2},-18 -14,-30 q-9,-10 -26,-16`} stroke="#4a3a2c"
        strokeWidth={9} fill="none" strokeLinecap="round" />
      <path d={`M0,0 q${2 + lean * 0.2},-16 12,-28 q10,-12 30,-14`} stroke="#4a3a2c"
        strokeWidth={8} fill="none" strokeLinecap="round" />
      <path d={`M0,0 q1,-20 3,-34`} stroke="#4a3a2c" strokeWidth={6} fill="none" strokeLinecap="round" />
      {/* the crown: WIDER THAN TALL, and light comes through all of it */}
      {Array.from({length: 3}, (_, i) => {
        const cx = (i - 1) * w * 0.30 + (rnd(seed, 50 + i) - 0.5) * 18;
        const cy = -h * 0.52 - (rnd(seed, 60 + i)) * 12;
        return (
          <g key={i}>
            {Array.from({length: 26}, (_, k) => {
              const kk = (k * 22695477 + seed * 1013904223 + i * 7919) >>> 0;
              const a = ((kk >>> 4) % 1000) / 1000 * Math.PI * 2;
              const rr = Math.sqrt(((kk >>> 14) % 1000) / 1000);
              return (
                <ellipse key={k}
                  cx={cx + Math.cos(a) * w * 0.24 * rr}
                  cy={cy + Math.sin(a) * h * 0.30 * rr}
                  rx={2 + ((kk >>> 24) % 4) * 0.6} ry={1.4 + ((kk >>> 20) % 3) * 0.5}
                  fill={(kk >>> 9) % 3 === 0 ? '#8fa06a' : '#5f7047'}
                  opacity={0.6 + ((kk >>> 6) % 40) / 100} />
              );
            })}
          </g>
        );
      })}
    </g>
  );
};

/** Prickly pear — pads in a sprawling cluster, with MAGENTA TUNAS STANDING UPRIGHT
 *  ON THE PAD RIMS. The pad is an irregular paddle, never a circle. */
export const PricklyPear: React.FC<KitProps & {pads?: number}> = ({
  x = 0, y = 0, scale = 1, seed = 10, pads = 6,
}) => {
  const K = fit('pricklyPear');
  return (
  <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
    {Array.from({length: pads}, (_, i) => {
      const a = (rnd(seed, i) - 0.5) * 70 + (i - pads / 2) * 12;
      const px = (rnd(seed, 20 + i) - 0.5) * 44;
      const py = -14 - i * 9 - rnd(seed, 30 + i) * 14;
      const rx = 15 + rnd(seed, 40 + i) * 6;
      return (
        <g key={i} transform={`translate(${px} ${py}) rotate(${a})`}>
          <ellipse rx={rx} ry={rx * 1.42} fill="#6f8f5a" stroke={INK} strokeWidth={4} />
          {Array.from({length: 5}, (_, k) => (
            <line key={k} x1={0} y1={-rx * 0.9 + k * rx * 0.45} x2={rx * 0.5}
              y2={-rx * 0.9 + k * rx * 0.45} stroke="#3f5233" strokeWidth={1.4} opacity={0.7} />
          ))}
          {/* the tunas: UPRIGHT on the rim */}
          {i % 2 === 0 && (
            <ellipse cx={rx * 0.12} cy={-rx * 1.42} rx={4.4} ry={7} fill="#a6266b"
              stroke={INK} strokeWidth={2.4} />
          )}
        </g>
      );
    })}
  </g>
  );
};
