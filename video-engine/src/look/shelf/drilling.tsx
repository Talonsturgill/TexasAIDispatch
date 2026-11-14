import React from 'react';
import {FONT} from '../../lib/type';
import {light, line, shade} from '../color';
import {ContactShadow, Glow, clamp01, useUid} from '../Kit';
import {Visor, type MachineMood} from '../machines';
import {Figure, castV2} from '../Figure';
import {Ball, Cyl, type FieldPlace, Lit, type Part, Pass, Sheen, atF, circ, f1, hash, owOf, rr} from './agriculture';

/**
 * DRILLING, LOOK V2 (November 14th, 2026).
 *
 * The rig floor of lib/drilling.tsx redrawn in the v2 idiom. Six drawings. The derrick, the drill
 * floor seen from outside the gate, the red zone placard on the gate, the iron roughneck that took
 * the job, the doghouse where the person went, and the pipe rack on the ground.
 *
 * The library's rules are kept. The mast is a tapered lattice and never a tower, the floor stands in
 * the air on its substructure with a stair up one side only, nothing is symmetric, and the placard's
 * figure stays a hooded shape with a scythe in flat silhouette on an industrial hazard sign (the
 * library's own shapes, unchanged, because the distinction from retired imagery is load bearing).
 * What changes is the hand. Every member is a rounded lit tube with a deep line of its own hue, the
 * steel is lit from the upper left, safety yellow and the livery are saturated, and each drawing has
 * something alive on `frame` (a beacon, a running block, a turning table, a breathing driller).
 *
 * The iron roughneck is the hero machine of an automation story, so it takes the machines' Visor
 * face when a board gives it a `mood`, and none by default, which keeps the library's industrial
 * reading. The driller in the doghouse is a v2 Figure from the cast. The derrick's own face, when a
 * film wants one, is `DrillRigV2` in look/machines.tsx.
 *
 * PLACEMENT is the library's (x, y at the ground, `scale` 1 true size through lib/scale.ts, `facing`,
 * `seed`, `wear`). Each drawing is built in centimetres. True sizes are the library's.
 */
export const DRILL_V2_M: Record<string, {h: number; note: string}> = {
  derrick: {h: 44, note: 'a modern land rig, ground to the top of the crown block'},
  rigFloor: {h: 1.12, note: 'the handrail and gate around the drill floor, above the deck'},
  redZoneSign: {h: 0.62, note: 'the placard wired to the gate, panel only'},
  ironRoughneck: {h: 3.2, note: 'the pipe handling machine, deck to the top of its column'},
  doghouse: {h: 3.0, note: 'the driller cabin, a skidded box, deck to its roof'},
  pipeRack: {h: 1.5, note: 'tubulars stacked on the ground rack, to the top of the stack'},
};

const YELLOW = '#f5c02c';
const MAST = '#e8a33a';

// ========================================================================================= DERRICK

/**
 * THE DERRICK. A tapered lattice mast on a substructure that holds the drill floor nine metres up,
 * reached by a stair up one side only. Rounded lit legs (light on the left, shade on the right),
 * bracing that zigzags and tightens with the taper, the crown block with its sheaves, the drilling
 * line down to a yellow travelling block that hangs at `block` or runs when `hoisting` (seconds per
 * round trip), racked stands leaning in the fingerboard when `racked`, the drawworks shed on the
 * floor, and a crown beacon that always blinks. `lit` adds the night lamps. True size 44 m.
 */
export const DerrickV2: React.FC<FieldPlace & {block?: number; hoisting?: number; racked?: number; lit?: boolean}> = (p) => {
  const {frame = 0, seed = 3, wear = 0.3, block = 0.22, hoisting, racked = 0, lit = false} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const t = frame / 30;
  const sub = '#3d7bd9', deck = '#a3adc8', shed = '#5f9a52', pad = '#e3cfa6', pipeC = '#c08a5a';
  const FLOOR = -910, CROWN = -4400, LB = 600, LT = 110;
  const bx = (u: number) => LB + (LT - LB) * u, by = (u: number) => FLOOR + (CROWN - FLOOR) * u;
  const bt = hoisting ? (Math.sin(t * 2 * Math.PI / hoisting) * 0.5 + 0.5) * 0.86 + 0.07 : Math.min(0.97, Math.max(0.03, block));
  const blockY = by(bt) + 120;
  const sheave = hoisting ? t * 2 * Math.PI / hoisting * 90 : 0;
  const bays = 9;
  const brace: Part[] = [];
  for (let i = 0; i < bays; i++) {
    const u0 = i / bays, u1 = (i + 1) / bays;
    brace.push({d: i % 2 ? `M${f1(bx(u0))} ${f1(by(u0))} L${f1(-bx(u1))} ${f1(by(u1))}` : `M${f1(-bx(u0))} ${f1(by(u0))} L${f1(bx(u1))} ${f1(by(u1))}`,
      stroke: shade(MAST, 0.1), w: 30, ink: line(MAST), o: 0.42});
    brace.push({d: `M${f1(-bx(u1))} ${f1(by(u1))} L${f1(bx(u1))} ${f1(by(u1))}`, stroke: MAST, w: 38, ink: line(MAST), o: 0.45});
  }
  const mbU = 0.6, mbY = by(mbU), mbX = -bx(mbU);
  const stands = racked > 0 ? Array.from({length: Math.min(14, racked)}, (_, i) => {
    const x0 = -480 + i * 34 + hash(seed, i) * 10;
    return {d: `M${f1(x0)} ${FLOOR - 40} L${f1(mbX + 60 + i * 22)} ${f1(mbY + 10)}`, stroke: i % 2 ? pipeC : light(pipeC, 0.12), w: 22, ink: line(pipeC), o: 0.5};
  }) : [];
  const stair: Part[] = [
    {d: `M1250 -10 L720 ${FLOOR + 30}`, stroke: YELLOW, w: 30, ink: line(YELLOW), o: 0.6},
    {d: `M1250 -130 L720 ${FLOOR - 90} M1250 -130 L1250 -10 M985 ${f1((-130 + FLOOR - 90) / 2)} L985 ${f1((-10 + FLOOR + 30) / 2)}`,
      stroke: YELLOW, w: 16, ink: line(YELLOW), o: 0.5},
    ...Array.from({length: 9}, (_, i) => {
      const u = (i + 0.5) / 9, sx = 1250 + (720 - 1250) * u, sy = -10 + (FLOOR + 30 + 10) * u;
      return {d: `M${f1(sx - 50)} ${f1(sy)} L${f1(sx + 30)} ${f1(sy)}`, stroke: shade(YELLOW, 0.2), w: 12, ink: line(YELLOW), o: 0.4};
    }),
  ];
  return (
    <g transform={atF(p)}>
      <defs>
        <Lit id={`${id}-sub`} c={sub} /><Lit id={`${id}-deck`} c={deck} x2={0} /><Lit id={`${id}-shed`} c={shed} />
        <Lit id={`${id}-pad`} c={pad} x2={0} /><Lit id={`${id}-crown`} c={MAST} /><Ball id={`${id}-blk`} c="#ffd166" a={0.55} />
      </defs>
      <ContactShadow x={150} y={30} w={3200} opacity={0.34} />
      <Pass ow={ow} parts={[
        {d: rr(-1320, -50, 2700, 90, 45), fill: `url(#${id}-pad)`, ink: line(pad)},
        {d: `M-700 -30 L-620 ${FLOOR + 40} L620 ${FLOOR + 40} L700 -30 Z`, fill: `url(#${id}-sub)`, ink: line(sub)},
      ]} />
      <path d={`M-640 -60 L540 ${FLOOR + 80} M640 -60 L-540 ${FLOOR + 80} M-660 ${f1(FLOOR * 0.5)} L660 ${f1(FLOOR * 0.5)}`} stroke={light(sub, 0.25)}
        strokeWidth={40} strokeLinecap="round" opacity={0.55} />
      {wear > 0.2 && [0, 1, 2, 3].map((k) => <ellipse key={k} cx={-500 + hash(seed, 40 + k) * 1000} cy={-200 - hash(seed, 50 + k) * 500} rx={30}
        ry={120 + hash(seed, 60 + k) * 120} fill="#c06a32" opacity={0.15 + wear * 0.3} />)}
      <Pass ow={ow} parts={stair} />
      {/* the mast, legs drawn last so they cover the brace ends */}
      <Pass ow={ow} parts={[...brace,
        {d: `M${-LB} ${FLOOR} L${-LT} ${CROWN}`, stroke: light(MAST, 0.22), w: 84, ink: line(MAST), o: 0.8},
        {d: `M${LB} ${FLOOR} L${LT} ${CROWN}`, stroke: shade(MAST, 0.16), w: 84, ink: line(MAST), o: 0.8},
        {d: rr(mbX - 260, mbY - 20, 330, 44, 22), fill: YELLOW, ink: line(YELLOW), o: 0.7},
      ]} />
      <Sheen d={`M${-LB + 14} ${FLOOR - 40} L${-LT + 8} ${CROWN + 60}`} w={18} op={0.4} />
      {stands.length > 0 && <Pass ow={ow} parts={stands} />}
      {/* the crown, its sheaves, the drilling line and the travelling block */}
      <Pass ow={ow} parts={[{d: rr(-LT - 110, CROWN - 170, (LT + 110) * 2, 170, 60), fill: `url(#${id}-crown)`, ink: line(MAST)}]} />
      {[-70, 0, 70].map((sx) => <g key={sx} transform={`translate(${sx} ${CROWN - 80})`}>
        <circle r={44} fill="#3a3550" stroke={line('#3a3550')} strokeWidth={ow * 0.8} />
        <path d="M-30 0 L30 0 M0 -30 L0 30" transform={`rotate(${f1(sheave)})`} stroke={light('#3a3550', 0.4)} strokeWidth={10} strokeLinecap="round" />
      </g>)}
      {[-50, -10, 30, 70].map((lx, k) => <path key={lx} d={`M${lx} ${CROWN - 60} L${lx * 0.4} ${f1(blockY + 30)}`} stroke={line('#5a5f80')}
        strokeWidth={9 + ow * 0.6} transform={`translate(${f1(Math.sin(t * 1.3 + k) * 4)} 0)`} />)}
      <g transform={`translate(${f1(Math.sin(t * 1.1) * 6)} ${f1(blockY)})`}>
        <Pass ow={ow} parts={[
          {d: rr(-95, 0, 190, 250, 70), fill: `url(#${id}-blk)`, ink: line('#ffd166')},
          {d: 'M0 250 L0 300 Q0 360 -40 360 Q-80 360 -80 320', stroke: '#4a4f6e', w: 26, ink: line('#4a4f6e'), o: 0.6},
        ]} />
        <circle cx={0} cy={80} r={42} fill={shade('#ffd166', 0.25)} />
        <circle cx={0} cy={80} r={14} fill={shade('#ffd166', 0.5)} />
        <Sheen d="M-60 30 Q-62 120 -58 200" w={16} op={0.5} />
      </g>
      {/* the floor deck and the drawworks shed */}
      <Pass ow={ow} parts={[
        {d: rr(-720, FLOOR - 50, 1440, 100, 46), fill: `url(#${id}-deck)`, ink: line(deck)},
        {d: rr(-660, FLOOR - 330, 400, 290, 70), fill: `url(#${id}-shed)`, ink: line(shed)},
        {d: `M720 ${FLOOR - 50} L720 ${FLOOR - 180} L560 ${FLOOR - 180}`, stroke: YELLOW, w: 18, ink: line(YELLOW), o: 0.5},
      ]} />
      <rect x={-600} y={FLOOR - 280} width={150} height={90} rx={36} fill="#1d2150" />
      <rect x={-590} y={FLOOR - 272} width={60} height={20} rx={10} fill="#ffffff" opacity={0.3} />
      <Sheen d={`M-690 ${FLOOR - 26} L680 ${FLOOR - 26}`} w={16} op={0.5} />
      <Sheen d={`M-620 ${FLOOR - 300} Q-460 ${FLOOR - 316} -300 ${FLOOR - 304}`} w={16} op={0.45} />
      {/* the beacon, and the night lamps */}
      <circle cx={0} cy={CROWN - 210} r={42} fill={(frame % 50) < 22 ? '#ff4d4d' : '#7a2a3a'} stroke={line('#ff4d4d')} strokeWidth={ow} />
      {(frame % 50) < 22 && <Glow x={0} y={CROWN - 210} r={300} color="#ff6a5a" opacity={0.55} />}
      {lit && [0.18, 0.46, 0.74].map((u, i) => <g key={u}>
        <circle cx={i % 2 ? bx(u) - 40 : -bx(u) + 40} cy={by(u)} r={34} fill="#fff3c4" stroke={line('#ffd89a')} strokeWidth={ow * 0.8} />
        <Glow x={i % 2 ? bx(u) - 40 : -bx(u) + 40} y={by(u)} r={420} color="#fff1b8" opacity={0.4} />
      </g>)}
    </g>
  );
};

// ====================================================================================== RED ZONE

/** the placard in its own centimetres, centred, shared by the sign and the gate it hangs on */
const RedZonePanel: React.FC<{ow: number; label: string; sub: string; wear: number; seed: number}> = ({ow, label, sub, wear, seed}) => {
  const id = useUid();
  const enamel = '#f7f2e6', red = '#d8352a', ink = '#2a1f3a';
  const words = sub.split(' ');
  return <g>
    <defs><Lit id={`${id}-e`} c={enamel} a={0.4} b={0.2} /><Lit id={`${id}-r`} c={red} x2={0.2} /><clipPath id={`${id}-c`}><path d={rr(-42, -31, 84, 62, 8)} />
    </clipPath></defs>
    {/* the wire loops through the two holes, one slacker than the other */}
    <path d="M-36.4 -25.6 Q-38 -36 -33 -38 Q-29 -38 -30 -30" stroke={line('#9aa6c4')} strokeWidth={1.6 + ow} fill="none" strokeLinecap="round" />
    <path d="M36.4 -25.6 Q37 -33 33 -34 Q30 -34 30.5 -29" stroke={line('#9aa6c4')} strokeWidth={1.6 + ow} fill="none" strokeLinecap="round" />
    <Pass ow={ow} parts={[{d: rr(-42, -31, 84, 62, 8), fill: `url(#${id}-e)`, ink: line('#d9cdb4')}]} />
    <g clipPath={`url(#${id}-c)`}>
      <path d="M-42 -13 L42 -13 L42 -31 L-42 -31 Z" fill={`url(#${id}-r)`} />
      <path d="M-42 -13 L42 -13" stroke={shade(red, 0.35)} strokeWidth={1.2} />
      <path d="M-46 -40 L-12 -40 L-40 40 L-74 40 Z" fill="#ffffff" opacity={0.18} />
      {wear > 0.2 && [-36.4, 36.4].map((hx, k) => <ellipse key={hx} cx={hx + (k ? -0.6 : 0.8)} cy={-19} rx={1.4} ry={6 + hash(seed, k) * 4} fill="#b8642e"
        opacity={wear * 0.55} />)}
    </g>
    <text x={0} y={-18.2} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={11.4} fill="#fff8ec" letterSpacing={0.4}>{label}</text>
    {/* THE REAPER, the library's own silhouette, unchanged, in the sign's deep violet ink */}
    <g transform="translate(-21.6 20.2) scale(0.58)" fill={ink}>
      <path d="M-6,2 q-3,-20 -1,-30 q1,-6 7,-6 q6,0 7,6 q2,10 -1,30 Z" />
      <path d="M-6,2 l2,5 l3,-4 l3,6 l3,-5 l2,4 l1,-6 Z" />
      <path d="M-7,-32 q7,4 14,0" stroke={enamel} strokeWidth={1.6} fill="none" />
      <path d="M-10,-33 q-2,-16 10,-16 q12,0 10,16 q-10,5 -20,0 Z" />
      <path d="M-4,-38 q0,-7 4,-7 q4,0 4,7 q-4,3 -8,0 Z" fill={enamel} opacity={0.9} />
      <path d="M-3,-24 q9,3 14,-4" stroke={ink} strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d="M15,12 L8,-54" stroke={ink} strokeWidth={2.6} strokeLinecap="round" />
      <path d="M8,-54 q-15,0 -22,11 q10,-6 21,-5 Z" />
    </g>
    <text x={14.8} y={4} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={6.9} fill={ink}>{words[0] ?? ''}</text>
    <text x={14.8} y={13.6} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={6.9} fill={ink}>{words.slice(1).join(' ')}</text>
    {[-36.4, 36.4].map((hx) => <g key={hx}><circle cx={hx} cy={-25.6} r={2.2} fill={shade('#9aa6c4', 0.3)} /><circle cx={hx - 0.5} cy={-26.1} r={0.8}
      fill="#ffffff" opacity={0.7} /></g>)}
  </g>;
};

/**
 * THE RED ZONE SIGN. A white enamel hazard placard with a red header, lit with a glass sheen, wired
 * on through two corner holes and hung slightly crooked because a person hung it. It swings a touch
 * on its wires. The figure is the library's hooded shape with a scythe in flat silhouette, unchanged.
 * Rust runs only from the wire holes, never across the printed words. True size 0.62 m panel.
 */
export const RedZoneSignV2: React.FC<FieldPlace & {tilt?: number; label?: string; sub?: string}> = (p) => {
  const {frame = 0, seed = 2, wear = 0.3, tilt = -2.6, label = 'RED ZONE', sub = 'RESTRICTED AREA'} = p;
  const ow = owOf(p.scale);
  const swing = Math.sin(frame / 30 * 1.3 + seed) * 0.9;
  return (
    <g transform={`${atF(p, false)} rotate(${f1(tilt + swing)} 0 -38)`}>
      <RedZonePanel ow={ow} label={label} sub={sub} wear={wear} seed={seed} />
    </g>
  );
};

// ===================================================================================== RIG FLOOR

/**
 * THE RIG FLOOR, the red zone seen from outside the gate. A foreshortened steel deck with tread lines
 * converging on it, a far rail so the plane reads as a floor and not a ramp, the rotary table set in
 * it with its bushing turning (`turning`, seconds per turn) around a stub of pipe in the slips, and
 * the near handrail in lit safety yellow with a striped kick plate. The gate swings toward the camera
 * on `open` (foreshortening as it comes round) with the placard wired to it. Nobody stands on it.
 * `w` is the deck width in the library's units. True size 1.12 m to the rail.
 */
export const RigFloorV2: React.FC<FieldPlace & {open?: number; turning?: number; sign?: boolean; w?: number}> = (p) => {
  const {frame = 0, seed = 5, wear = 0.35, open = 0, turning, sign = true, w = 760} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const t = frame / 30;
  const W = w * 0.933, half = W / 2, fh = half * 0.52;
  const steel = '#9fabc8', dark = '#3a3f5c', ink = '#2a2440';
  const spin = turning ? (t * 360 / turning) % 360 : 0;
  const op = clamp01(open);
  const nFar = Math.max(2, Math.floor(w / 190)), nNear = Math.floor(W / 112) + 1, nTread = Math.floor(w / 34);
  return (
    <g transform={atF(p)}>
      <defs>
        <linearGradient id={`${id}-d`} gradientUnits="userSpaceOnUse" x1={-half} y1={-112} x2={half * 0.3} y2={24}>
          <stop offset="0%" stopColor={light(steel, 0.4)} /><stop offset="55%" stopColor={steel} /><stop offset="100%" stopColor={shade(steel, 0.3)} />
        </linearGradient>
        <Cyl id={`${id}-y`} c={YELLOW} vertical /><Cyl id={`${id}-p`} c="#9aa6c4" />
        <clipPath id={`${id}-k`}><path d={rr(-half + 12, -18, W - 24, 18, 8)} /></clipPath>
      </defs>
      <ContactShadow x={0} y={30} w={W * 1.1} opacity={0.3} />
      <Pass ow={ow} parts={[{d: `M${-half} 24 L${half} 24 L${fh} -112 L${-fh} -112 Z`, fill: `url(#${id}-d)`, ink: line(steel)}]} />
      {Array.from({length: nTread}, (_, i) => {
        const u = (i + 0.5) / nTread;
        return <path key={i} d={`M${f1(-half + u * W)} 20 L${f1(-fh + u * fh * 2)} -108`} stroke={shade(steel, 0.25)} strokeWidth={1.8} opacity={0.5} />;
      })}
      {[0.3, 0.62].map((u) => <path key={u} d={`M${f1(-half + (half - fh) * u)} ${f1(24 - 136 * u)} L${f1(half - (half - fh) * u)} ${f1(24 - 136 * u)}`}
        stroke={shade(steel, 0.2)} strokeWidth={1.4} opacity={0.4} />)}
      {/* the far rail, the proof that this is a floor */}
      <Pass ow={ow * 0.8} parts={[
        ...Array.from({length: nFar}, (_, i) => ({d: `M${f1(-fh + (i / (nFar - 1)) * fh * 2)} -112 L${f1(-fh + (i / (nFar - 1)) * fh * 2)} -166`,
          stroke: shade(YELLOW, 0.1), w: 6, ink: line(YELLOW), o: 0.6})),
        {d: `M${f1(-fh)} -166 L${f1(fh)} -164 M${f1(-fh)} -140 L${f1(fh)} -139`, stroke: shade(YELLOW, 0.06), w: 6, ink: line(YELLOW), o: 0.6},
      ]} />
      {/* the rotary table, its bushing turning, a stub of pipe standing in the slips */}
      <path d={`M-90 -62 A62 19 0 1 0 34 -62 A62 19 0 1 0 -90 -62 Z`} fill={dark} stroke={line(dark)} strokeWidth={ow * 1.6} />
      <ellipse cx={-28} cy={-62} rx={42} ry={12.5} fill={light(dark, 0.18)} />
      {[0, 90, 180, 270].map((a) => {
        const r = ((a + spin) * Math.PI) / 180;
        return <circle key={a} cx={f1(-28 + Math.cos(r) * 31)} cy={f1(-62 + Math.sin(r) * 9.4)} r={3.4} fill={light(dark, 0.55)} />;
      })}
      <Pass ow={ow} parts={[
        {d: rr(-36, -114, 16, 54, 8), fill: `url(#${id}-p)`, ink: line('#9aa6c4')},
        {d: rr(-41, -122, 26, 18, 8), fill: `url(#${id}-p)`, ink: line('#9aa6c4')},
      ]} />
      {/* the near handrail and the striped kick plate */}
      <Pass ow={ow} parts={[
        ...Array.from({length: nNear}, (_, i) => {
          const px = -half + 19 + i * 112, lean = i === 2 ? 3.2 : 0;
          return {d: `M${f1(px)} 0 L${f1(px + lean)} -105`, stroke: `url(#${id}-y)`, w: 9, ink: line(YELLOW), o: 0.8};
        }),
        {d: `M${f1(-half + 17)} -105 L${f1(half - 17)} -103`, stroke: YELLOW, w: 9.5, ink: line(YELLOW), o: 0.8},
        {d: `M${f1(-half + 17)} -56 L${f1(half - 17)} -55`, stroke: shade(YELLOW, 0.06), w: 7, ink: line(YELLOW), o: 0.7},
        {d: rr(-half + 12, -18, W - 24, 18, 8), fill: YELLOW, ink: line(YELLOW)},
      ]} />
      <g clipPath={`url(#${id}-k)`}>{Array.from({length: Math.ceil(W / 22)}, (_, i) => <path key={i} d={`M${f1(-half + i * 22)} 2 l12 -24 l9 0 l-12 24 Z`}
        fill={ink} opacity={0.85} />)}</g>
      <Sheen d={`M${f1(-half + 24)} -107 L${f1(half - 24)} -105`} w={2.6} op={0.55} />
      {/* THE GATE, hinged at its right post, swinging toward the camera */}
      <g transform={`translate(140 0) scale(${f1(1 - op * 0.55)} 1) skewY(${f1(op * 9)}) translate(-140 0)`}>
        <Pass ow={ow} parts={[
          {d: 'M37 -2 L37 -105', stroke: `url(#${id}-y)`, w: 9, ink: line(YELLOW), o: 0.8},
          {d: 'M37 -105 L140 -105 M37 -56 L140 -56', stroke: YELLOW, w: 8, ink: line(YELLOW), o: 0.8},
          {d: 'M43 -101 L136 -60', stroke: shade(YELLOW, 0.1), w: 5, ink: line(YELLOW), o: 0.6},
        ]} />
        {sign && <g transform={`translate(88 -80) scale(0.62) rotate(${f1(-3.2 + Math.sin(t * 1.3) * 0.8)} 0 -30)`}>
          <RedZonePanel ow={ow / 0.62} label="RED ZONE" sub="RESTRICTED AREA" wear={wear} seed={seed} /></g>}
      </g>
      {wear > 0.25 && [0, 1, 2].map((k) => <ellipse key={k} cx={-half + hash(seed, 70 + k) * W} cy={8} rx={18} ry={5} fill="#c06a32" opacity={wear * 0.5} />)}
    </g>
  );
};

// ================================================================================ IRON ROUGHNECK

/**
 * THE IRON ROUGHNECK, the machine that took the job. A heavy hydraulic column on a bolted track, its
 * hoses swinging, a telescoping sleeve that grows with the reach so the arm is never two objects, and
 * the wrench head driving in fast, biting the joint of pipe at well centre with its rollers spinning,
 * and withdrawing (a hydraulic machine does not ease). `cycle` seconds per round, `halted` stops it
 * mid shift. With `mood` its head housing carries the Visor face. True size 3.2 m.
 */
export const IronRoughneckV2: React.FC<FieldPlace & {cycle?: number; halted?: boolean; livery?: string; mood?: MachineMood}> = (p) => {
  const {frame = 0, seed = 4, wear = 0.3, cycle = 5.5, halted = false, livery = '#f07a2a', mood} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const t = frame / 30;
  const steel = '#9aa6c4', pipeC = '#b98455', hose = '#3a3550';
  const WX = 197;
  const u = halted ? 0.34 : (t / cycle) % 1;
  const reach = u < 0.16 ? 0 : u < 0.3 ? (u - 0.16) / 0.14 : u < 0.66 ? 1 : u < 0.8 ? 1 - (u - 0.66) / 0.14 : 0;
  const biting = u >= 0.3 && u < 0.66 && !halted;
  const spin = biting ? frame * 22 : 0;
  const ext = reach * 74;
  const hs = Math.sin(t * 2.4 + seed) * 4;
  return (
    <g transform={atF(p)}>
      <defs><Lit id={`${id}-b`} c={livery} /><Lit id={`${id}-s`} c={steel} x2={0} /><Cyl id={`${id}-p`} c={pipeC} /><Cyl id={`${id}-c`} c={livery} /></defs>
      <ContactShadow x={40} y={8} w={330} opacity={0.34} />
      {/* the joint of pipe at well centre, where the jaws actually reach */}
      <Pass ow={ow} parts={[
        {d: rr(WX - 14, -350, 28, 342, 14), fill: `url(#${id}-p)`, ink: line(pipeC)},
        {d: rr(WX - 21, -226, 42, 50, 14), fill: `url(#${id}-p)`, ink: line(pipeC)},
      ]} />
      <Sheen d={`M${WX - 7} -340 L${WX - 7} -20`} w={4} op={0.4} />
      <Pass ow={ow} parts={[
        {d: rr(-100, -20, 200, 20, 10), fill: `url(#${id}-s)`, ink: line(steel)},
        {d: rr(-44, -282, 88, 266, 26), fill: `url(#${id}-c)`, ink: line(livery)},
        {d: rr(-56, -318, 112, 64, 28), fill: `url(#${id}-b)`, ink: line(livery)},
        {d: rr(26, -231, 52 + ext, 30, 13), fill: `url(#${id}-s)`, ink: line(steel)},
      ]} />
      {[-80, -40, 0, 40, 80].map((bx) => <circle key={bx} cx={bx} cy={-10} r={3.4} fill={shade(steel, 0.4)} />)}
      <path d="M-44 -180 L44 -180 M-44 -96 L44 -96" stroke={shade(livery, 0.3)} strokeWidth={3} strokeLinecap="round" opacity={0.6} />
      {/* hydraulic hoses, which is most of what one of these looks like up close */}
      {[0, 1].map((k) => {
        const d = `M${-30 + k * 12} -262 Q${-70 + k * 10 + hs} -200 ${-54 + k * 10} -140 Q${-40 + k * 8 - hs * 0.5} -90 ${-50 + k * 10} -40`;
        return <g key={k}><path d={d} stroke={line(hose)} strokeWidth={8 - k * 1.5 + ow * 1.2} fill="none" strokeLinecap="round" />
          <path d={d} stroke={k ? light(hose, 0.2) : hose} strokeWidth={8 - k * 1.5} fill="none" strokeLinecap="round" /></g>;
      })}
      <Sheen d="M-30 -270 L-30 -30" w={6} op={0.4} />
      {mood ? <Visor x={0} y={-286} w={86} h={42} mood={mood} frame={frame} look={reach} />
        : <rect x={-34} y={-300} width={68} height={28} rx={14} fill="#1d2150" opacity={0.85} />}
      {/* the boom and the wrench head, running out on the reach */}
      <g transform={`translate(${f1(ext)} 0)`}>
        <Pass ow={ow} parts={[
          {d: rr(16, -246, 100, 56, 22), fill: `url(#${id}-b)`, ink: line(livery)},
          {d: `M92 -258 L140 -258 Q156 -258 156 -242 L156 -164 Q156 -148 140 -148 L92 -148 Q80 -148 80 -164 L80 -242 Q80 -258 92 -258 Z`,
            fill: `url(#${id}-s)`, ink: line(steel)},
        ]} />
        <Sheen d="M28 -236 L100 -236" w={6} op={0.5} />
        <circle cx={123} cy={-203} r={30} fill={shade(steel, 0.5)} stroke={line(steel)} strokeWidth={ow} />
        <g transform={`rotate(${f1(spin)} 123 -203)`}>
          {[0, 120, 240].map((a) => <circle key={a} cx={f1(123 + Math.cos(a * Math.PI / 180) * 19)} cy={f1(-203 + Math.sin(a * Math.PI / 180) * 19)} r={8}
            fill={light(steel, 0.35)} stroke={line(steel)} strokeWidth={ow * 0.6} />)}
        </g>
        <circle cx={123} cy={-203} r={8} fill={light(steel, 0.5)} />
      </g>
      {biting && <g opacity={0.7}>
        {[0, 1].map((k) => <path key={k} d={`M${WX + 32} ${-226 + k * 46} q16 ${k ? 8 : -8} 28 ${k ? 2 : -2}`} stroke="#ffffff" strokeWidth={4} fill="none"
          strokeLinecap="round" transform={`rotate(${f1((frame * 12) % 30 - 15)} ${WX} -203)`} />)}
      </g>}
      {wear > 0.2 && [0, 1].map((k) => <ellipse key={k} cx={-20 + hash(seed, k) * 40} cy={-200 + k * 90} rx={4} ry={22} fill="#b8642e" opacity={wear * 0.5} />)}
    </g>
  );
};

// ======================================================================================= DOGHOUSE

/**
 * THE DOGHOUSE, the driller's cabin and where the person went. A skidded steel box with rounded
 * corners, a roof lip and an air unit on top, one long window with the console screens glowing and
 * flickering when `lit`, and when `occupied` the driller at the console, a v2 Figure from the cast in
 * a hard hat, breathing and blinking behind the glass. The door at the other end has a grab rail and
 * a step. `live` 0 holds the screens still. Rust runs on steel, never across the glass. True size 3 m.
 */
export const DoghouseV2: React.FC<FieldPlace & {lit?: boolean; occupied?: boolean; live?: number}> = (p) => {
  const {frame = 0, seed = 6, wear = 0.3, lit = true, occupied = true, live = 1} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const body = '#5f9a7e', roof = '#4f7f6c';
  const flick = live ? 0.86 + Math.sin(frame / 5.5) * 0.06 + Math.sin(frame / 2.3) * 0.03 : 0.9;
  return (
    <g transform={atF(p)}>
      <defs><Lit id={`${id}-b`} c={body} /><Lit id={`${id}-r`} c={roof} x2={0} /><Lit id={`${id}-ac`} c="#d9dde8" />
        <clipPath id={`${id}-w`}><path d={rr(-135, -254, 238, 104, 22)} /></clipPath>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#ffffff" stopOpacity={0.28} />
          <stop offset="40%" stopColor="#ffffff" stopOpacity={0} /><stop offset="62%" stopColor="#ffffff" stopOpacity={0.1} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0} /></linearGradient></defs>
      <ContactShadow x={0} y={6} w={440} opacity={0.34} />
      <Pass ow={ow} parts={[
        {d: rr(-188, -28, 376, 28, 12), fill: shade('#5c5f78', 0.1), ink: line('#5c5f78')},
        {d: rr(-174, -296, 348, 270, 30), fill: `url(#${id}-b)`, ink: line(body)},
        {d: rr(-120, -360, 120, 70, 24), fill: `url(#${id}-ac)`, ink: line('#d9dde8')},
        {d: rr(-192, -318, 376, 34, 17), fill: `url(#${id}-r)`, ink: line(roof)},
        {d: rr(118, -232, 52, 204, 18), fill: shade(body, 0.12), ink: line(body)},
        {d: rr(150, -28, 60, 20, 8), fill: '#9aa6c4', ink: line('#9aa6c4')},
      ]} />
      {[0, 1, 2].map((k) => <path key={k} d={`M${-104 + k * 30} -340 L${-104 + k * 30} -310`} stroke={shade('#d9dde8', 0.3)} strokeWidth={5} strokeLinecap="round" />)}
      <path d="M126 -140 L126 -112" stroke={line(body)} strokeWidth={7} strokeLinecap="round" />
      <path d="M126 -140 L126 -112" stroke={light(body, 0.5)} strokeWidth={4} strokeLinecap="round" />
      <Sheen d="M-180 -302 L170 -302" w={6} op={0.45} />
      <Sheen d="M-158 -270 L-158 -60" w={7} op={0.35} />
      {/* the window, the screens and the driller */}
      <path d={rr(-135, -254, 238, 104, 22)} fill={line(body)} stroke={line(body)} strokeWidth={ow * 2} />
      <g clipPath={`url(#${id}-w)`}>
        <rect x={-135} y={-254} width={238} height={104} fill={lit ? '#1d2a4a' : '#2b3048'} />
        {lit && <>
          <rect x={-126} y={-244} width={98} height={66} rx={10} fill="#7fd8f0" opacity={flick} />
          <rect x={-18} y={-244} width={108} height={66} rx={10} fill="#9af0b8" opacity={flick * 0.92} />
          {Array.from({length: 6}, (_, i) => <rect key={i} x={-118} y={-236 + i * 9} width={30 + ((i * 7 + Math.floor(frame / 9)) % 5) * 10} height={4} rx={2}
            fill="#1d4a6a" opacity={0.55} />)}
          <path d={`M-10 -196 ${Array.from({length: 10}, (_, i) => `L${-10 + i * 10} ${f1(-206 - Math.sin(i * 1.3 + frame / 8) * 10)}`).join(' ')}`} stroke="#1d6a4a"
            strokeWidth={3} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        </>}
        {occupied && <Figure {...castV2('engineer')} frame={frame} x={14} y={-70} scale={0.3} emotion="determined" turn={-0.5} seed={seed} />}
        <rect x={-135} y={-254} width={238} height={104} fill={`url(#${id}-g)`} />
      </g>
      {wear > 0.2 && [0, 1, 2].map((k) => <ellipse key={k} cx={-150 + hash(seed, k) * 260} cy={-110 + hash(seed, 10 + k) * 40} rx={4} ry={26} fill="#b8642e"
        opacity={wear * 0.5} />)}
      {wear > 0.3 && <ellipse cx={0} cy={-14} rx={200} ry={18} fill="#ead8b2" opacity={0.35} />}
    </g>
  );
};

// ===================================================================================== PIPE RACK

/**
 * THE PIPE RACK, tubulars on the ground, which is where most of a rig's steel is. Seen end on and
 * stacked in courses offset half a pipe, with wooden stripping between courses, each end a lit tube
 * with a dark bore, some wearing the bright plastic thread protectors every oilfield rack has, and the
 * top course never full because a rack is always halfway through being used. A glint travels the
 * stack. True size 1.5 m to the top of the stack.
 */
export const PipeRackV2: React.FC<FieldPlace & {courses?: number; perCourse?: number; w?: number}> = (p) => {
  const {frame = 0, seed = 8, wear = 0.35, courses = 4, perCourse = 13} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const r = 17.2, step = r * 1.74;
  const tones = ['#9aa6c4', '#b07a4a', '#8f9cbd'], caps = ['#f5c02c', '#3d7bd9', '#e2483a', '#47a05a'];
  const all: {cx: number; cy: number; k: number}[] = [];
  for (let c = 0; c < courses; c++) {
    const n = c === courses - 1 ? Math.max(3, Math.floor(perCourse * 0.55)) : perCourse - c;
    const cy = -16 - r - c * step, off = (c % 2) * r;
    for (let i = 0; i < n; i++) all.push({cx: -((n - 1) / 2) * (r * 2) + i * (r * 2) + off, cy, k: c * 40 + i});
  }
  const glint = Math.floor(frame / 3) % (all.length + 20);
  return (
    <g transform={atF(p)}>
      <defs>{tones.map((c, i) => <Ball key={i} id={`${id}-p${i}`} c={c} a={0.55} b={0.4} />)}</defs>
      <ContactShadow x={0} y={6} w={perCourse * r * 2.6} opacity={0.34} />
      <Pass ow={ow} parts={[-1, 1].map((sd) => ({d: rr(sd * perCourse * r * 0.55 - 30, -18, 60, 18, 8), fill: shade('#5f5a7a', 0.05), ink: line('#5f5a7a')}))} />
      {Array.from({length: courses}, (_, c) => <path key={c} d={rr(-perCourse * r - 6, -16 - c * step - 3, perCourse * r * 2 + 12, 6, 3)} fill="#c89a5e"
        stroke={line('#c89a5e')} strokeWidth={ow} />)}
      {all.map((q) => {
        const h = hash(seed, q.k), ti = Math.floor(h * tones.length), cap = hash(seed, 300 + q.k) < 0.35 ? caps[Math.floor(hash(seed, 500 + q.k) * 4)] : null;
        return <g key={q.k}>
          <path d={circ(q.cx, q.cy, r)} fill={line(tones[ti])} stroke={line(tones[ti])} strokeWidth={ow * 2} />
          <path d={circ(q.cx, q.cy, r)} fill={`url(#${id}-p${ti})`} />
          {cap ? <><circle cx={q.cx} cy={q.cy} r={r * 0.7} fill={cap} stroke={line(cap)} strokeWidth={ow * 0.8} />
            <circle cx={q.cx} cy={q.cy} r={r * 0.36} fill={shade(cap, 0.3)} /><circle cx={q.cx - r * 0.25} cy={q.cy - r * 0.28} r={r * 0.16} fill="#ffffff"
              opacity={0.6} /></>
            : <><circle cx={q.cx} cy={q.cy} r={r * 0.56} fill="#241d3e" />
              <path d={`M${f1(q.cx - r * 0.4)} ${f1(q.cy + r * 0.1)} A${f1(r * 0.42)} ${f1(r * 0.42)} 0 0 0 ${f1(q.cx + r * 0.2)} ${f1(q.cy + r * 0.38)}`}
                stroke={light(tones[ti], 0.2)} strokeWidth={1.8} fill="none" strokeLinecap="round" opacity={0.6} /></>}
          {wear > 0.25 && h > 0.7 && <ellipse cx={q.cx + r * 0.4} cy={q.cy + r * 0.5} rx={r * 0.28} ry={r * 0.18} fill="#c06a32" opacity={wear * 0.7} />}
          {all.indexOf(q) === glint && <circle cx={q.cx - r * 0.3} cy={q.cy - r * 0.35} r={r * 0.42} fill="#ffffff" opacity={0.75} />}
        </g>;
      })}
    </g>
  );
};

export const DRILLING_V2 = ['DerrickV2', 'RigFloorV2', 'RedZoneSignV2', 'IronRoughneckV2', 'DoghouseV2', 'PipeRackV2'] as const;
