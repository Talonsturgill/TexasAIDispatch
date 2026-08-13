import React from 'react';
import {useUid} from './uid';
import {tones, FormGradient, ContactShadow, useLight, BrushedMetal, RustStreak, INK} from './lighting';

// =============================================================================
// PLANT FLOOR — what Texas now makes, and the beat where the AI is inspection.
//
// Samsung in Taylor, TI in Sherman, the tool and packaging plants that came with
// them. The application in this beat is almost always the same shape: a camera
// looks at a part, a model says pass or fail, and the interesting frame is the one
// where it says FAIL and a person walks over.
//
// THE MISTAKE TO AVOID IS THE FRIENDLY ROBOT. A six-axis arm drawn with a face, or
// waving, or picking something up in a smooth arc, is a stock illustration and
// Texans who work in these buildings will read it as one instantly. A real arm
// moves in FAST STRAIGHT SEGMENTS with hard stops between them, it is fenced, and
// there is a light curtain across the opening. So `RobotArm` moves in segments with
// dwell at each end, and the guarding is drawn rather than omitted.
//
// The second thing that sells it is that a plant floor is CLEAN AND WORN AT ONCE:
// epoxy floor with the traffic lanes painted on and scuffed off again, and every
// machine grey-green with one bright safety colour on the moving parts.
// =============================================================================

/** Draw units per metre, from the Character rig: 610 units sole to crown at 1.70 m. */
const M = 610 / 1.7;

export const PLANT_M: Record<string, {h: number; note: string}> = {
  robotArm: {h: 1.7, note: 'a mid-payload six-axis arm at rest, base to wrist'},
  conveyor: {h: 0.9, note: 'the belt surface, working height'},
  inspectionHead: {h: 0.55, note: 'the camera and its ring light on the gantry'},
  toolBay: {h: 3.4, note: 'a process tool with its enclosure'},
  palletStack: {h: 1.5, note: 'a loaded pallet, stacked'},
};

const fit = (k: keyof typeof PLANT_M, local: number) => (PLANT_M[k].h * M) / local;

const rnd = (seed: number, ch: number) => {
  const k = ((seed * 2654435761) ^ (ch * 40503)) >>> 0;
  return ((k >>> 8) % 10000) / 10000;
};

interface Rig {
  x?: number; y?: number; scale?: number; frame?: number; facing?: 1 | -1;
  seed?: number; wear?: number;
}

/**
 * A segmented move: hold, snap, hold. This is the motion primitive the whole file
 * is about, and it is why the arm does not look like a stock illustration.
 *
 * `cycle` frames per full out-and-back, `dwell` the fraction of it spent stopped at
 * each end. Between the stops the move is FAST and close to linear.
 */
function segmented(frame: number, cycle: number, dwell = 0.34, phase = 0): number {
  const u = (((frame + phase) % cycle) + cycle) % cycle / cycle;
  const move = (1 - dwell * 2) / 2;
  if (u < dwell) return 0;
  if (u < dwell + move) {
    const t = (u - dwell) / move;
    return t * t * (3 - 2 * t);              // ease, but a tight one
  }
  if (u < dwell * 2 + move) return 1;
  const t = (u - dwell * 2 - move) / move;
  return 1 - t * t * (3 - 2 * t);
}

// =============================================================================
// ROBOT ARM — six axes, fenced, moving in segments.
// =============================================================================
export const RobotArm: React.FC<Rig & {
  /** frames per out-and-back. A real cell cycles in a second or two. */
  cycle?: number;
  /** stopped. A halted cell is the frame a fault story wants. */
  halted?: boolean;
  /** the guarding. On by default, because it is on in reality. */
  fenced?: boolean;
  livery?: string;
}> = ({
  x = 0, y = 0, scale = 1, frame = 0, facing = 1, seed = 1, wear = 0.25,
  cycle = 74, halted = false, fenced = true, livery = '#c8703a',
}) => {
  const L = useLight();
  const uid = useUid('ra');
  const K = fit('robotArm', 100);
  const t = tones(livery, L);
  const grey = tones('#6f7a72', L);

  const u = halted ? 0.5 : segmented(frame, cycle, 0.34, rnd(seed, 1) * cycle);
  const shoulder = -62 + u * 44;
  const elbow = 84 - u * 62;
  const wristA = -22 + u * 40;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      <defs>
        <FormGradient id={`${uid}_a`} t={t} softness={0.5} />
        <FormGradient id={`${uid}_g`} t={grey} softness={0.45} />
      </defs>
      <ContactShadow cx={0} cy={2} rx={34} opacity={0.3} blur={8} />

      {/* the base and the waist casting, which is the heaviest thing in the cell */}
      <path d="M-30,0 L-24,-16 L24,-16 L30,0 Z" fill={`url(#${uid}_g)`} stroke={INK}
        strokeWidth={3.4} strokeLinejoin="round" />
      <rect x={-19} y={-34} width={38} height={19} rx={4} fill={`url(#${uid}_a)`}
        stroke={INK} strokeWidth={3.4} />

      <g transform={`translate(0 -34) rotate(${shoulder})`}>
        {/* upper arm */}
        <rect x={-11} y={-56} width={22} height={60} rx={7} fill={`url(#${uid}_a)`}
          stroke={INK} strokeWidth={3.4} />
        <circle cx={0} cy={0} r={11} fill={grey.core} stroke={INK} strokeWidth={3} />
        <g transform={`translate(0 -56) rotate(${elbow})`}>
          {/* forearm */}
          <rect x={-9} y={-48} width={18} height={52} rx={6} fill={`url(#${uid}_a)`}
            stroke={INK} strokeWidth={3.2} />
          <circle cx={0} cy={0} r={9.4} fill={grey.core} stroke={INK} strokeWidth={2.8} />
          <g transform={`translate(0 -48) rotate(${wristA})`}>
            {/* wrist and the tool: a two-finger gripper, open at one end of the move */}
            <rect x={-7} y={-15} width={14} height={17} rx={4} fill={grey.base}
              stroke={INK} strokeWidth={2.8} />
            <path d={`M${-5 - u * 4},-15 L${-5 - u * 4},-27`} stroke={grey.shade}
              strokeWidth={4} strokeLinecap="round" />
            <path d={`M${5 + u * 4},-15 L${5 + u * 4},-27`} stroke={grey.shade}
              strokeWidth={4} strokeLinecap="round" />
            {/* the dress pack: the cable loom strapped down the outside, which every
                real arm has and no drawing of one does */}
            <path d="M7,-2 q10,10 6,22" fill="none" stroke="#3b4249" strokeWidth={3.4} />
          </g>
        </g>
        <path d="M9,-50 q12,20 4,44" fill="none" stroke="#3b4249" strokeWidth={3.4}
          opacity={0.85} />
      </g>

      {fenced && (
        <g opacity={0.9}>
          {/* wire mesh guarding, and the light curtain posts at the opening */}
          {[-1, 1].map((s) => (
            <g key={s} transform={`translate(${s * 74} 0)`}>
              <rect x={-3} y={-96} width={6} height={96} fill="#8d9298" stroke={INK}
                strokeWidth={2.4} />
            </g>
          ))}
          <g opacity={0.4}>
            {Array.from({length: 15}, (_, i) => (
              <path key={i} d={`M${-71 + i * 10},-92 L${-71 + i * 10},-4`}
                stroke="#8d9298" strokeWidth={1.2} />
            ))}
            {Array.from({length: 9}, (_, i) => (
              <path key={i} d={`M-71,${-92 + i * 11} L71,${-92 + i * 11}`}
                stroke="#8d9298" strokeWidth={1.2} />
            ))}
          </g>
          <rect x={-77} y={-96} width={6} height={96} fill="#d8a13c" opacity={0.75} />
          <circle cx={-74} cy={-100} r={3.4} fill={halted ? '#c8543a' : '#6fd8b0'} />
        </g>
      )}
      {wear > 0.2 && <RustStreak x={-30} y={-16} w={60} h={16} seed={seed}
        opacity={wear * 0.4} />}
    </g>
  );
};

// =============================================================================
// CONVEYOR — the belt, the rollers under it and the parts on it.
//
// The parts move and the belt surface moves with them, which sounds obvious and is
// the thing most drawings get wrong: a belt whose texture is static under sliding
// parts reads as parts skidding.
// =============================================================================
export const Conveyor: React.FC<Rig & {
  w?: number; speed?: number; parts?: number;
  /** indices of the parts the inspector flagged. They are drawn differently and
   *  they keep moving, because a flag is not a stop. */
  flagged?: number[];
}> = ({
  x = 0, y = 0, scale = 1, frame = 0, seed = 2, wear = 0.35,
  w = 420, speed = 1, parts = 6, flagged = [],
}) => {
  const L = useLight();
  const uid = useUid('cv');
  const K = fit('conveyor', 100);
  const t = tones('#7c847d', L);
  const march = (frame * speed * 2.4) % 34;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <defs><FormGradient id={`${uid}_f`} t={t} softness={0.4} /></defs>
      <ContactShadow cx={w / 2} cy={2} rx={w * 0.55} opacity={0.24} blur={7} />

      {/* legs */}
      {[0.06, 0.5, 0.94].map((u, i) => (
        <rect key={i} x={w * u - 5} y={-88} width={10} height={88} fill={t.shade}
          stroke={INK} strokeWidth={2.6} />
      ))}
      {/* the frame and the belt */}
      <rect x={0} y={-100} width={w} height={16} fill={`url(#${uid}_f)`} stroke={INK}
        strokeWidth={3} />
      <rect x={0} y={-102} width={w} height={5} fill="#2f353b" />
      {/* the belt texture, MOVING */}
      {Array.from({length: Math.ceil(w / 34) + 1}, (_, i) => (
        <path key={i} d={`M${(i * 34 + march) % (w + 34) - 34},-102
                          l0,5`} stroke="#4a5057" strokeWidth={2} />
      ))}
      {/* rollers, visible under the return side */}
      {Array.from({length: Math.floor(w / 46)}, (_, i) => (
        <circle key={i} cx={22 + i * 46} cy={-88} r={5.4} fill={t.core} stroke={INK}
          strokeWidth={2} />
      ))}

      {/* the parts */}
      {Array.from({length: parts}, (_, i) => {
        const step = w / parts;
        const px = ((i * step + march * 2.2) % (w + step)) - step * 0.5;
        const bad = flagged.includes(i);
        const k = rnd(seed, i);
        return (
          <g key={i} transform={`translate(${px} -102)`}>
            <rect x={-15} y={-22} width={30} height={22} rx={3}
              fill={bad ? '#a8623f' : '#b9bfc4'} stroke={INK} strokeWidth={2.6} />
            <rect x={-10} y={-17} width={20} height={5} rx={2}
              fill={bad ? '#7d452b' : '#8f979d'} opacity={0.8} />
            {/* every part is slightly different, which is what an inspector is for */}
            <circle cx={-6 + k * 12} cy={-8} r={2} fill="#71797f" opacity={0.7} />
            {bad && (
              <path d="M-19,-26 L19,-26" stroke="#d8a13c" strokeWidth={3}
                strokeLinecap="round" />
            )}
          </g>
        );
      })}
      {wear > 0.25 && <RustStreak x={0} y={-100} w={w} h={16} seed={seed}
        opacity={wear * 0.45} />}
    </g>
  );
};

// =============================================================================
// INSPECTION HEAD — the camera on the gantry over the line, and its ring light.
//
// The ring light is the detail that makes it read as machine vision rather than as
// a security camera: a bright even annulus so the part has no shadows in it, which
// is exactly why these installations look the way they do.
//
// The `verdict` prop draws pass, fail or nothing. NOTHING is the default, because a
// verdict on every part is a claim about a model's output, and the frame that
// matters is the one where it says fail.
// =============================================================================
export const InspectionHead: React.FC<Rig & {
  verdict?: 'pass' | 'fail' | null;
  /** frames per inspection. The strobe fires once per cycle. */
  cycle?: number;
}> = ({x = 0, y = 0, scale = 1, frame = 0, seed = 3, verdict = null, cycle = 48}) => {
  const L = useLight();
  const uid = useUid('ih');
  const K = fit('inspectionHead', 100);
  const t = tones('#4d5559', L);
  const phase = ((frame + rnd(seed, 1) * cycle) % cycle) / cycle;
  const strobe = phase < 0.1;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <defs>
        <FormGradient id={`${uid}_b`} t={t} softness={0.45} />
        <radialGradient id={`${uid}_ring`} cx="50%" cy="50%" r="50%">
          <stop offset="55%" stopColor="#eaf6ff" stopOpacity="0" />
          <stop offset="76%" stopColor="#eaf6ff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#eaf6ff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* the gantry rail it hangs from */}
      <rect x={-96} y={-100} width={192} height={11} fill="#8d9298" stroke={INK}
        strokeWidth={2.6} />
      <BrushedMetal x={-96} y={-100} w={192} h={11} opacity={0.5} />
      <rect x={-9} y={-89} width={18} height={26} fill={t.core} stroke={INK}
        strokeWidth={2.6} />

      {/* the camera body and its lens */}
      <rect x={-22} y={-63} width={44} height={38} rx={4} fill={`url(#${uid}_b)`}
        stroke={INK} strokeWidth={3.2} />
      <rect x={-11} y={-27} width={22} height={14} rx={2} fill="#2b3138" stroke={INK}
        strokeWidth={2.6} />
      {/* the ring light */}
      <circle cx={0} cy={-11} r={26} fill="none" stroke="#c9d3d9" strokeWidth={7} />
      <circle cx={0} cy={-11} r={26} fill={`url(#${uid}_ring)`}
        opacity={strobe ? 1 : 0.24} />
      {strobe && (
        <ellipse cx={0} cy={26} rx={40} ry={13} fill="#eaf6ff" opacity={0.2} />
      )}
      {/* the data cable up to the rail */}
      <path d="M20,-58 q22,-6 20,-30" fill="none" stroke="#3b4249" strokeWidth={3.4} />

      {verdict && (
        <g transform="translate(52 -50)">
          <rect x={-16} y={-14} width={32} height={28} rx={4}
            fill={verdict === 'pass' ? '#33564a' : '#5e3128'} stroke={INK}
            strokeWidth={2.6} />
          {verdict === 'pass' ? (
            <path d="M-7,0 l5,6 l9,-12" fill="none" stroke="#6fd8b0" strokeWidth={3.4}
              strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <path d="M-6,-6 l12,12 M6,-6 l-12,12" stroke="#e6a08a" strokeWidth={3.4}
              strokeLinecap="round" />
          )}
        </g>
      )}
    </g>
  );
};

// =============================================================================
// TOOL BAY — a process tool in its enclosure, which is what a fab floor is made of.
//
// From the aisle a fab is a wall of these: a coloured enclosure, a small window
// with something moving behind it, a stack light on top and a load port at waist
// height. The stack light is the one part a viewer can read from across the room,
// so it is the part that carries the state.
// =============================================================================
export const ToolBay: React.FC<Rig & {
  bays?: number;
  /** per-bay stack-light state. 'run' green, 'idle' amber, 'down' red, null unlit. */
  state?: (('run' | 'idle' | 'down') | null)[];
}> = ({x = 0, y = 0, scale = 1, frame = 0, seed = 4, wear = 0.12, bays = 4, state = []}) => {
  const L = useLight();
  const uid = useUid('tby');
  const K = fit('toolBay', 100);
  const t = tones('#d5d2cb', L);
  const bw = 96;
  const COL = {run: '#5d9a63', idle: '#d8a13c', down: '#c8543a'};

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <defs><FormGradient id={`${uid}_e`} t={t} softness={0.35} /></defs>
      <ContactShadow cx={(bays * bw) / 2} cy={1} rx={bays * bw * 0.55} opacity={0.24}
        blur={8} />
      {/* the painted traffic lane on the floor, scuffed */}
      <rect x={-30} y={2} width={bays * bw + 60} height={9} fill="#c8b34e" opacity={0.5} />
      {Array.from({length: 26}, (_, i) => {
        const k = rnd(seed, 200 + i);
        return k > 0.55 ? <rect key={i} x={-28 + i * ((bays * bw + 56) / 26)} y={2}
          width={8 + k * 12} height={9} fill="#9a9288" opacity={0.6} /> : null;
      })}

      {Array.from({length: bays}, (_, i) => {
        const st = state[i] ?? null;
        const k = rnd(seed, i);
        return (
          <g key={i} transform={`translate(${i * bw} 0)`}>
            <rect x={0} y={-100} width={bw - 8} height={100} rx={3} fill={`url(#${uid}_e)`}
              stroke={INK} strokeWidth={3.4} />
            {/* the window, with something moving behind it */}
            <rect x={12} y={-84} width={bw - 32} height={34} rx={2} fill="#28323a"
              stroke={INK} strokeWidth={2.6} />
            <circle cx={12 + (bw - 32) * (0.3 + 0.4 * (0.5 + Math.sin(frame / 37 + k * 6) / 2))}
              cy={-67} r={7} fill="#5f7f92" opacity={0.6} />
            {/* the load port at waist height, which is where a person or an AMHS
                actually touches the tool */}
            <rect x={16} y={-42} width={bw - 40} height={22} rx={2} fill={t.shade}
              stroke={INK} strokeWidth={2.6} />
            <circle cx={bw - 30} cy={-31} r={3.4} fill="#4a5158" />
            {/* the stack light */}
            <rect x={bw / 2 - 12} y={-116} width={9} height={16} rx={3}
              fill={st ? COL[st] : '#4a5158'} stroke={INK} strokeWidth={2.2}
              opacity={st === 'down'
                ? 0.6 + Math.abs(Math.sin(frame / 9)) * 0.4
                : 0.95} />
            <path d={`M${bw / 2 - 7.5},-100 L${bw / 2 - 7.5},-92`} stroke="#6a7178"
              strokeWidth={2.6} />
            {wear > 0.1 && <BrushedMetal x={0} y={-100} w={bw - 8} h={100}
              opacity={wear * 1.6} />}
          </g>
        );
      })}
    </g>
  );
};
