import React from 'react';
import {M} from '../../lib/scale';
import {light, line, mix, shade} from '../color';
import {ContactShadow, Glow, useUid} from '../Kit';
import {Visor} from '../machines';
import type {MachineMood} from '../machines';

/**
 * COMPUTE, LOOK V2 (November 14th, 2026).
 *
 * The inside of the building the whole docket is about, from lib/compute.tsx, redrawn on the v2 rules.
 * One cabinet close up, the cold aisle, the cooling tower, the generator bank, the switchgear line-up,
 * the coolant distribution unit and the hall backdrop. Round at every corner, lit from the upper left
 * with shade pushed toward violet, outlined in each fill's own deep hue as one pass under the fills so
 * joined parts show no seam, a contact shadow under anything that stands, and alive on `frame` (LEDs
 * that hold steady with a narrow flicker, fans that turn, coolant that marches down the hose).
 *
 * THE AISLE IS DRAWN IN TRUE PERSPECTIVE now. The library stood flat cabinet fronts beside a floor. Here
 * the doors face the aisle and recede to one vanishing point at eye height, so the corridor is the
 * picture, the containment roof is seen from below the way a person standing in it sees it, and the
 * rank lit by the key reads brighter than the rank in shade.
 *
 * THE UNCOUNTED RACK keeps the library's argument. It is a filled silhouette with a dashed rim, the same
 * object in the same room as its counted neighbour, never a wireframe and never an X.
 *
 * The cabinet carries an optional face (`mood`, the Visor from look/machines.tsx) for the shot where the
 * rack is the character. Plain hardware (the tower, the gensets, the switchgear, the CDU) has none.
 *
 * PLACEMENT is the library's. x, y at the ground, `scale` 1 is true size through lib/scale.ts, each
 * drawing built in centimetres and converted once. The hall backdrop keeps the library's board units.
 *
 * The small drawing kit at the top (Pass, Lit, rounded paths, the wheel) is shared by the other shelf
 * files of this set (vehicles, plantfloor, freightinvitation, provingground).
 */
export const CM = M / 100;
export interface RigV2 {x?: number; y?: number; scale?: number; frame?: number; facing?: 1 | -1; seed?: number; wear?: number}
export type Pt = [number, number];

/** true heights, the library's measurements restated so a v2 drawing needs nothing from src/lib */
export const COMPUTE_V2_M: Record<string, {h: number; note: string}> = {
  cabinet: {h: 2.0, note: 'a 42U rack, floor to the top of the frame'},
  rackRow: {h: 2.6, note: 'to the top of the containment roof over the aisle'},
  coolingTower: {h: 9.0, note: 'one cell, ground to the top of the fan stack'},
  generatorSet: {h: 3.2, note: 'a containerised genset, to the top of the stack'},
  switchgear: {h: 2.3, note: 'a medium-voltage line-up'},
  coolingDistributionUnit: {h: 1.9, note: 'a CDU cabinet on the room floor'},
};

// ===================================================================================== the drawing kit

export const at = (p: RigV2, flip = true) =>
  `translate(${p.x ?? 0} ${p.y ?? 0}) scale(${(p.scale ?? 1) * CM * (flip ? (p.facing ?? 1) : 1)} ${(p.scale ?? 1) * CM})`;
/** half the outline in local centimetres, so the line is about 6.8 film pixels at any staging scale */
export const owOf = (scale?: number) => 3.4 / ((scale ?? 1) * CM);
export const rnd = (seed: number, ch: number) => {
  let t = (Math.imul(seed + 7, 374761393) + Math.imul(ch + 3, 668265263)) >>> 0;
  t = Math.imul(t ^ (t >>> 13), 1274126177) >>> 0;
  return ((t ^ (t >>> 16)) >>> 0) % 100000 / 100000;
};
export const f1 = (n: number) => n.toFixed(1);
export const fp = (q: Pt) => `${f1(q[0])} ${f1(q[1])}`;
/** a polygon with every corner rounded, by one radius or a radius per corner */
export const rp = (pts: Pt[], r: number | number[]): string => {
  const n = pts.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = pts[(i - 1 + n) % n], b = pts[i], c = pts[(i + 1) % n];
    const r0 = Array.isArray(r) ? r[i] : r;
    const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, l2 = Math.hypot(c[0] - b[0], c[1] - b[1]) || 1;
    const k1 = Math.min(r0, l1 / 2) / l1, k2 = Math.min(r0, l2 / 2) / l2;
    const p0: Pt = [b[0] + (a[0] - b[0]) * k1, b[1] + (a[1] - b[1]) * k1];
    const p1: Pt = [b[0] + (c[0] - b[0]) * k2, b[1] + (c[1] - b[1]) * k2];
    d += `${i ? 'L' : 'M'}${fp(p0)} Q${fp(b)} ${fp(p1)} `;
  }
  return d + 'Z';
};
export const rr = (x: number, y: number, w: number, h: number, r: number) => rp([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], r);
export const ell = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f1(cx - rx)} ${f1(cy)} A${f1(rx)} ${f1(ry)} 0 1 0 ${f1(cx + rx)} ${f1(cy)} A${f1(rx)} ${f1(ry)} 0 1 0 ${f1(cx - rx)} ${f1(cy)} Z`;
export const circ = (cx: number, cy: number, r: number) => ell(cx, cy, r, r);
export const lerp2 = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** One drawn part, a filled shape or (with `stroke`) a stroked line. `ink` is its outline colour and `o`
 * scales the outline, so a thin member takes a thinner line. */
export type Part = {d: string; fill?: string; stroke?: string; w?: number; t?: string; ink: string; o?: number; op?: number};
/** THE SEAMLESS JOIN. Every part's outline first, then every fill, so where two parts meet the fill of one
 * covers the outline of the other and the pair reads as one form. */
export const Pass: React.FC<{parts: Part[]; ow: number}> = ({parts, ow}) => <>
  {parts.map((q, i) => q.stroke
    ? <path key={`o${i}`} d={q.d} transform={q.t} fill="none" stroke={q.ink} strokeWidth={(q.w ?? 0) + ow * 2 * (q.o ?? 1)}
      strokeLinecap="round" strokeLinejoin="round" opacity={q.op} />
    : <path key={`o${i}`} d={q.d} transform={q.t} fill={q.ink} stroke={q.ink} strokeWidth={ow * 2 * (q.o ?? 1)} strokeLinejoin="round"
      opacity={q.op} />)}
  {parts.map((q, i) => q.stroke
    ? <path key={`f${i}`} d={q.d} transform={q.t} fill="none" stroke={q.stroke} strokeWidth={q.w} strokeLinecap="round"
      strokeLinejoin="round" opacity={q.op} />
    : <path key={`f${i}`} d={q.d} transform={q.t} fill={q.fill} opacity={q.op} />)}
</>;
/** a part list helper, shape `d` filled with `fill`, its outline the deep hue of `base` */
export const pt = (d: string, fill: string, base: string, o?: number): Part => ({d, fill, ink: line(base), o});
export const st = (d: string, stroke: string, w: number, base: string, o?: number): Part => ({d, stroke, w, ink: line(base), o});

/** a lit material, light at the upper left, the colour, shade toward violet at the lower right */
export const Lit: React.FC<{id: string; c: string; x2?: number; y2?: number; a?: number; b?: number}> = ({id, c, x2 = 0.4, y2 = 1, a = 0.5, b = 0.36}) => (
  <linearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
    <stop offset="0%" stopColor={light(c, a)} /><stop offset="46%" stopColor={c} /><stop offset="100%" stopColor={shade(c, b)} />
  </linearGradient>
);
/** a lit cylinder seen side on, lit on the left (or top), a sheen a quarter of the way across */
export const Cyl: React.FC<{id: string; c: string; vertical?: boolean}> = ({id, c, vertical}) => (
  <linearGradient id={id} x1="0" y1="0" x2={vertical ? '0' : '1'} y2={vertical ? '1' : '0'}>
    <stop offset="0%" stopColor={shade(c, 0.08)} /><stop offset="24%" stopColor={light(c, 0.55)} /><stop offset="55%" stopColor={c} />
    <stop offset="100%" stopColor={shade(c, 0.42)} />
  </linearGradient>
);
/** a white sheen stroke, the soft highlight a lit form carries along its top edge */
export const Sheen: React.FC<{d: string; w: number; op?: number}> = ({d, w, op = 0.45}) =>
  <path d={d} stroke="#ffffff" strokeWidth={w} strokeLinecap="round" fill="none" opacity={op} />;

/** a road wheel that turns. Tyre, a lit rim, five lugs on a turning hub and a catchlight on the tyre. */
export const WheelV: React.FC<{cx: number; cy: number; r: number; spin?: number; ow: number; rim?: string; tyre?: string;
  lugs?: number}> = ({cx, cy, r, spin = 0, ow, rim = '#d9dde8', tyre = '#2a2740', lugs = 5}) => (
  <g transform={`translate(${cx} ${cy})`}>
    <circle r={r + ow} fill={line(tyre)} />
    <circle r={r} fill={tyre} />
    <circle r={r * 0.6 + ow * 0.6} fill={line(rim)} />
    <circle r={r * 0.6} fill={rim} />
    <circle r={r * 0.6} fill={light(rim, 0.4)} opacity={0.5} transform={`translate(${-r * 0.1} ${-r * 0.1}) scale(0.7)`} />
    <g transform={`rotate(${spin})`}>{Array.from({length: lugs}).map((_, i) => {
      const a = (i / lugs) * Math.PI * 2;
      return <circle key={i} cx={Math.cos(a) * r * 0.34} cy={Math.sin(a) * r * 0.34} r={r * 0.075} fill={shade(rim, 0.45)} />;
    })}</g>
    <circle r={r * 0.15} fill={shade(rim, 0.3)} />
    <path d={`M${f1(-r * 0.78)} ${f1(-r * 0.32)} A${f1(r * 0.84)} ${f1(r * 0.84)} 0 0 1 ${f1(-r * 0.2)} ${f1(-r * 0.82)}`} stroke="#ffffff"
      strokeWidth={r * 0.07} fill="none" strokeLinecap="round" opacity={0.35} />
  </g>
);

const LED = {on: '#38f2a0', act: '#5ad8ff', amber: '#ffb13b', off: '#2c3256'};

// ===================================================================================== CABINET

type CabProps = {load?: number; open?: boolean; fault?: number; unknown?: boolean; mood?: MachineMood};

/** the cabinet itself in local centimetres, 64 wide and 200 to the frame top, with the outline it is given */
const CabinetBody: React.FC<CabProps & {ow: number; frame: number; seed: number; haze?: number; id: string}> = ({
  ow, frame, seed, load = 0.7, open = false, fault = -1, unknown = false, mood, haze = 0, id,
}) => {
  const body = mix('#3d4670', '#a7b2e0', haze * 0.6), door = mix('#1b1f3c', '#7c86b8', haze * 0.6);
  const slots = 21;
  if (unknown) {
    const dash = (frame * 0.6) % 26;
    return <g>
      <path d={rr(-32, -210, 64, 210, 10)} fill={mix('#1c2042', '#7c86b8', haze * 0.5)} />
      <path d={rr(-29, -207, 58, 204, 8)} fill="none" stroke="#b9c3f2" strokeWidth={ow * 0.9} strokeDasharray="12 9"
        strokeDashoffset={-dash} strokeLinecap="round" opacity={0.9} />
    </g>;
  }
  const parts: Part[] = [
    pt(rr(-26, -8, 14, 10, 4), '#2a2744', '#2a2744'), pt(rr(12, -8, 14, 10, 4), '#2a2744', '#2a2744'),
    pt(rr(-32, -200, 64, 194, 9), `url(#${id}-b)`, body),
    pt(rr(-34, -210, 68, 14, 7), `url(#${id}-c)`, body),
    pt(rr(-11, -218, 22, 10, 4), '#2c3050', '#2c3050', 0.7),
  ];
  return <g>
    <defs><Lit id={`${id}-b`} c={body} /><Lit id={`${id}-c`} c={light(body, 0.15)} x2={0} y2={1} />
      <linearGradient id={`${id}-d`} x1="0" y1="0" x2="0.3" y2="1"><stop offset="0%" stopColor={light(door, 0.12)} />
        <stop offset="100%" stopColor={shade(door, 0.3)} /></linearGradient>
      <linearGradient id={`${id}-s`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#ffffff" stopOpacity={0.26} />
        <stop offset="38%" stopColor="#ffffff" stopOpacity={0.03} /><stop offset="100%" stopColor="#ffffff" stopOpacity={0} /></linearGradient></defs>
    <Pass parts={parts} ow={ow} />
    <path d={rr(-26, -193, 52, 182, 6)} fill={`url(#${id}-d)`} />
    {open ? Array.from({length: slots}, (_, i) => {
      const y = -190 + i * 8.4, lit = rnd(seed, i) < load;
      return <g key={i}>
        <path d={rr(-23, y, 46, 7, 2.4)} fill={mix('#4a5480', '#9aa6d6', haze * 0.5)} />
        {Array.from({length: 6}, (_, j) => <rect key={j} x={-20 + j * 5.6} y={y + 1.6} width={3.6} height={3.8} rx={1.2} fill="#262b4d" />)}
        <circle cx={17} cy={y + 3.5} r={1.9} fill={i === fault ? LED.amber : lit ? LED.on : LED.off}
          opacity={lit ? 0.6 + 0.4 * Math.abs(Math.sin(frame / 6 + i * 1.3)) * load : 1} />
      </g>;
    }) : <g>
      {Array.from({length: 30}, (_, r) => <path key={r} d={`M-21 ${-188 + r * 5.9} L13 ${-188 + r * 5.9}`} stroke="#2a2f55"
        strokeWidth={2.4} strokeDasharray="0.1 4.2" strokeLinecap="round" />)}
      {Array.from({length: slots}, (_, i) => {
        const lit = rnd(seed, i) < load, y = -186 + i * 8.3;
        const a = (0.55 + Math.abs(Math.sin(frame / 7 + i * 1.7)) * 0.45 * load);
        if (i === fault) return <g key={i}><circle cx={19} cy={y} r={5} fill={LED.amber} opacity={0.25} />
          <circle cx={19} cy={y} r={2.2} fill={LED.amber} /></g>;
        return lit ? <g key={i}><circle cx={19} cy={y} r={4.4} fill={i % 4 === 1 ? LED.act : LED.on} opacity={0.18 * a} />
          <circle cx={19} cy={y} r={1.9} fill={i % 4 === 1 ? LED.act : LED.on} opacity={a} /></g> : null;
      })}
      <path d={rr(-24, -120, 4, 30, 2)} fill="#c9cfe6" opacity={0.85} />
    </g>}
    <path d={rr(-26, -193, 52, 182, 6)} fill={`url(#${id}-s)`} />
    <path d={rr(-20, -201, 40, 4, 2)} fill="#5ad8ff" opacity={0.75 + 0.25 * Math.sin(frame / 20)} />
    <Sheen d="M-28 -207 L24 -207" w={2.2} op={0.5} />
    <Sheen d="M-28 -190 L-28 -40" w={2.2} op={0.22} />
    {mood && <Visor x={0} y={-165} w={44} h={22} mood={mood} frame={frame} />}
  </g>;
};

/**
 * CABINET, one rack close enough to see what is in it. `load` lights a steady fraction of the panel with a
 * narrow flicker (a busy accelerator rack is mostly steady), `fault` puts the one amber where it is asked
 * for, `open` shows the blades, `unknown` draws the uncounted silhouette, `mood` gives the rack a face.
 */
export const CabinetV2: React.FC<RigV2 & CabProps> = (p) => {
  const {frame = 0, seed = 1} = p;
  const id = useUid();
  return (
    <g transform={at(p)}>
      <ContactShadow x={0} y={2} w={96} opacity={p.unknown ? 0.22 : 0.32} />
      <CabinetBody {...p} ow={owOf(p.scale)} frame={frame} seed={seed} id={id} />
    </g>
  );
};

// ===================================================================================== RACK ROW

/**
 * RACK ROW, the cold aisle. Two ranks of doors face each other down a corridor that recedes to one
 * vanishing point at eye height (1.6 m). The containment roof spans the aisle at 2.6 m with a glass
 * transom over each rank, the floor carries its 600 mm tiles in perspective and the cold glow pools on
 * it, and the ladder trays run overhead with a bundle dropping into each cabinet top. `unknown` marks
 * cabinets in the left rank as uncounted silhouettes, `openDoor` opens one, the right rank keeps the
 * one amber.
 */
export const RackRowV2: React.FC<RigV2 & {depth?: number; load?: number; unknown?: number[]; contained?: boolean; openDoor?: number}> = (p) => {
  const {frame = 0, seed = 2, depth = 7, load = 0.72, unknown = [], contained = true, openDoor = -1} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const VY = -160, R0 = 320, H = 200, TOP = 260, DEEP = 110;
  // equal real depth per cabinet, so the doors bunch toward the vanishing point
  const sc = (j: number) => 1 / (1 + j * (1.6 / depth));
  // a point on the rank at scale a, x outward, h height above the floor
  const Q = (s: number, out: number, h: number, a: number): Pt => [s * (R0 + out) * a, VY + (-VY - h) * a];
  const far = sc(depth);
  const floor = [Q(-1, DEEP + 40, 0, 1), Q(1, DEEP + 40, 0, 1), Q(1, DEEP + 40, 0, far), Q(-1, DEEP + 40, 0, far)];
  const cold = '#7fe6ff';
  const faces: React.ReactNode[] = [];
  for (let k = depth - 1; k >= 0; k--) {
    const a = sc(k), b = sc(k + 1), hz = 1 - a;
    for (const s of [-1, 1]) {
      const unk = s < 0 && unknown.includes(k), open = s < 0 && k === openDoor;
      const fault = s > 0 && k === Math.floor(depth * 0.4);
      // the door face toward the aisle, lit on the right rank (it faces the key), shaded on the left
      const lit = s > 0;
      const base = mix(lit ? '#4a5590' : '#2f3766', '#a5b0e0', hz * 0.55);
      const nb = Q(s, 0, 0, a), nt = Q(s, 0, H, a), ft = Q(s, 0, H, b), fb = Q(s, 0, 0, b);
      const inset = (u: number, v: number): Pt => {
        const top = lerp2(nt, ft, u), bot = lerp2(nb, fb, u);
        return lerp2(top, bot, v);
      };
      const rad = 6 * a;
      const doorD = rp([inset(0.08, 0.04), inset(0.92, 0.04), inset(0.92, 0.95), inset(0.08, 0.95)], rad);
      faces.push(<g key={`${k}${s}`}>
        <path d={rp([nt, ft, fb, nb], rad * 1.4)} fill={unk ? mix('#1c2042', '#8890c0', hz * 0.5) : base} stroke={line(base)}
          strokeWidth={ow * 2 * (0.45 + 0.55 * a)} strokeLinejoin="round" />
        {unk ? <path d={doorD} fill="none" stroke="#b9c3f2" strokeWidth={ow * 0.8 * (0.5 + 0.5 * a)} strokeDasharray={`${10 * a} ${8 * a}`}
          strokeDashoffset={-(frame * 0.5) % 18} strokeLinecap="round" />
          : <path d={doorD} fill={mix(lit ? '#2a3163' : '#1c2148', '#7c86b8', hz * 0.5)} />}
        {!unk && open && Array.from({length: 12}, (_, i) => {
          const v = 0.08 + i * 0.072;
          return <path key={i} d={`M${fp(inset(0.12, v))} L${fp(inset(0.88, v))}`} stroke={mix('#5a6596', '#a5b0e0', hz * 0.5)}
            strokeWidth={ow * 1.6 * a} strokeLinecap="round" />;
        })}
        {!unk && Array.from({length: 9}, (_, i) => {
          const v = 0.1 + i * 0.095, on = rnd(seed * 7 + k * 13 + (s > 0 ? 101 : 0), i) < load;
          const amber = fault && i === 4;
          if (!on && !amber) return null;
          const q = inset(s > 0 ? 0.2 : 0.8, v);
          const c = amber ? LED.amber : i % 3 === 1 ? LED.act : LED.on;
          const fl = 0.6 + 0.4 * Math.abs(Math.sin(frame / 7 + i * 1.7 + k));
          return <g key={i}><circle cx={q[0]} cy={q[1]} r={5 * a} fill={c} opacity={0.22 * fl} />
            <circle cx={q[0]} cy={q[1]} r={2.2 * a} fill={c} opacity={amber ? 1 : fl} /></g>;
        })}
        <path d={`M${fp(inset(0.06, 0.02))} L${fp(inset(0.94, 0.02))}`} stroke="#ffffff" strokeWidth={ow * 0.9 * a} opacity={lit ? 0.4 : 0.18}
          strokeLinecap="round" />
      </g>);
    }
  }
  // the near end panels of the two ranks, which face the viewer and take the key
  const endPanel = (s: number) => {
    const c = '#525d98';
    const pts: Pt[] = [Q(s, 0, H, 1), Q(s, DEEP, H, 1), Q(s, DEEP, 0, 1), Q(s, 0, 0, 1)];
    return <g key={`e${s}`}>
      <path d={rp(pts, 10)} fill={`url(#${id}-end)`} stroke={line(c)} strokeWidth={ow * 2} strokeLinejoin="round" />
      <path d={rp([Q(s, 14, H - 16, 1), Q(s, DEEP - 14, H - 16, 1), Q(s, DEEP - 14, H - 46, 1), Q(s, 14, H - 46, 1)], 6)} fill={shade(c, 0.25)} />
      <path d={`M${fp(Q(s, 10, H - 6, 1))} L${fp(Q(s, DEEP - 10, H - 6, 1))}`} stroke="#ffffff" strokeWidth={ow} opacity={0.4} strokeLinecap="round" />
      <circle cx={s * (R0 + DEEP / 2)} cy={-H + 31} r={11} fill={s < 0 ? '#f2b340' : '#4a8fe8'} />
    </g>;
  };
  const rungs = Array.from({length: 12}, (_, i) => 1 / (1 + i * (1.6 / depth) * (depth / 11)));
  return (
    <g transform={at(p)}>
      <defs>
        <linearGradient id={`${id}-fl`} x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#4a5384" />
          <stop offset="100%" stopColor="#7f8ac0" /></linearGradient>
        <radialGradient id={`${id}-pool`} cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={cold} stopOpacity={0.5} />
          <stop offset="100%" stopColor={cold} stopOpacity={0} /></radialGradient>
        <linearGradient id={`${id}-roof`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d9f6ff" stopOpacity={0.55} />
          <stop offset="100%" stopColor={cold} stopOpacity={0.18} /></linearGradient>
        <Lit id={`${id}-end`} c="#525d98" />
      </defs>
      <ContactShadow x={0} y={4} w={(R0 + DEEP) * 2.3} opacity={0.3} />
      {/* the floor and its tiles, converging */}
      <path d={rp(floor, 8)} fill={`url(#${id}-fl)`} />
      {Array.from({length: 9}, (_, i) => {
        const a = sc(i * depth / 8);
        return <path key={i} d={`M${fp(Q(-1, DEEP + 40, 0, a))} L${fp(Q(1, DEEP + 40, 0, a))}`} stroke="#9aa5d8" strokeWidth={ow * 0.7 * (0.4 + 0.6 * a)}
          opacity={0.45} strokeLinecap="round" />;
      })}
      {[-1, -0.5, 0, 0.5, 1].map((u) => <path key={u} d={`M${fp(Q(u < 0 ? -1 : 1, -R0 + Math.abs(u) * R0, 0, 1))} L${fp(Q(u < 0 ? -1 : 1,
        -R0 + Math.abs(u) * R0, 0, far))}`} stroke="#9aa5d8" strokeWidth={ow * 0.7} opacity={0.4} strokeLinecap="round" />)}
      {contained && <ellipse cx={0} cy={VY * (1 - 0.62)} rx={R0 * 0.9} ry={42} fill={`url(#${id}-pool)`}
        opacity={0.8 + 0.2 * Math.sin(frame / 40)} />}
      {/* the far end of the aisle, its containment door lit from inside */}
      <path d={rp([Q(-1, DEEP, TOP, far), Q(1, DEEP, TOP, far), Q(1, DEEP, 0, far), Q(-1, DEEP, 0, far)], 4)} fill="#262d63" />
      <path d={rp([Q(-0.62, -R0 * 0.62, H * 0.95, far), Q(0.62, -R0 * 0.62, H * 0.95, far), Q(0.62, -R0 * 0.62, 0, far),
        Q(-0.62, -R0 * 0.62, 0, far)], 6)} fill={cold} opacity={0.55 + 0.1 * Math.sin(frame / 25)} />
      <path d={`M${fp(Q(1, -R0, H * 0.95, far))} L${fp(Q(1, -R0, 0, far))}`} stroke="#262d63" strokeWidth={ow * 1.2} />
      {faces}
      {/* the glass transom over each rank, and the containment roof seen from below */}
      {contained && <g>
        {[-1, 1].map((s) => <path key={s} d={rp([Q(s, 0, TOP, 1), Q(s, 0, TOP, far), Q(s, 0, H, far), Q(s, 0, H, 1)], 6)}
          fill={`url(#${id}-roof)`} stroke={line('#7fb9d6')} strokeWidth={ow * 1.4} strokeLinejoin="round" />)}
        <path d={rp([Q(-1, 0, TOP, 1), Q(1, 0, TOP, 1), Q(1, 0, TOP, far), Q(-1, 0, TOP, far)], 8)} fill={`url(#${id}-roof)`} opacity={0.9}
          stroke={line('#7fb9d6')} strokeWidth={ow * 1.6} strokeLinejoin="round" />
        {Array.from({length: depth}, (_, j) => <path key={j} d={`M${fp(Q(-1, 0, TOP, sc(j)))} L${fp(Q(1, 0, TOP, sc(j)))}`}
          stroke="#e8fbff" strokeWidth={ow * (0.4 + 0.8 * sc(j))} opacity={0.7} strokeLinecap="round" />)}
        <Glow x={0} y={VY + (-VY - TOP) * 0.7} r={R0 * 0.9} color={cold} opacity={0.35} />
      </g>}
      {/* ladder tray over each rank, and the bundle dropping into every cabinet */}
      {[-1, 1].map((s) => <g key={`t${s}`}>
        {[DEEP * 0.2, DEEP * 0.8].map((o) => <path key={o} d={`M${fp(Q(s, o, 300, 1))} L${fp(Q(s, o, 300, far))}`} stroke="#8a93bf"
          strokeWidth={ow * 1.8} strokeLinecap="round" />)}
        {rungs.map((a, i) => <path key={i} d={`M${fp(Q(s, DEEP * 0.2, 300, a))} L${fp(Q(s, DEEP * 0.8, 300, a))}`} stroke="#6f78a6"
          strokeWidth={ow * 1.2 * a} strokeLinecap="round" />)}
        {Array.from({length: depth}, (_, j) => {
          const a = sc(j + 0.5), q0 = Q(s, DEEP * 0.5, 300, a), q1 = Q(s, DEEP * 0.45, H, a);
          const sw = Math.sin(frame / 50 + j) * 3 * a;
          return <g key={j}>
            <path d={`M${fp(q0)} Q${f1(q0[0] + s * 10 * a + sw)} ${f1((q0[1] + q1[1]) / 2)} ${fp(q1)}`} stroke={line('#3c3f6a')}
              strokeWidth={(5 + ow * 1.4) * a} fill="none" strokeLinecap="round" />
            <path d={`M${fp(q0)} Q${f1(q0[0] + s * 10 * a + sw)} ${f1((q0[1] + q1[1]) / 2)} ${fp(q1)}`} stroke={j % 3 ? '#4a8fe8' : '#f2b340'}
              strokeWidth={5 * a} fill="none" strokeLinecap="round" />
          </g>;
        })}
      </g>)}
      {endPanel(-1)}{endPanel(1)}
    </g>
  );
};

// ===================================================================================== COOLING TOWER

/**
 * COOLING TOWER, evaporative cells in a row on their concrete basin, louvred sides where the air goes in,
 * a fan stack on each with the fan turning under its rim, and the header pipe along the front. The drift
 * is WHITE, THIN AND SHORT, water vapour and never smoke, and `humidity` decides how much of it shows.
 * Origin at the left end of the basin, as the library's.
 */
export const CoolingTowerV2: React.FC<RigV2 & {cells?: number; running?: boolean; humidity?: number}> = (p) => {
  const {frame = 0, seed = 3, wear = 0.4, cells = 3, running = true, humidity = 0.35} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const CW = 594, panel = '#8fc0d8', basin = '#d8c6a4', stack = '#6f8fc0', pipe = '#3f7fe0';
  const W = cells * CW;
  const t = frame / 30;
  return (
    <g transform={at(p, false)}>
      <defs><Lit id={`${id}-p`} c={panel} /><Lit id={`${id}-b`} c={basin} x2={0} /><Cyl id={`${id}-s`} c={stack} />
        <Cyl id={`${id}-h`} c={pipe} vertical />
        <radialGradient id={`${id}-v`} cx="42%" cy="38%" r="60%"><stop offset="0%" stopColor="#ffffff" stopOpacity={0.95} />
          <stop offset="70%" stopColor="#e4eefc" stopOpacity={0.8} /><stop offset="100%" stopColor="#c9d8f0" stopOpacity={0.5} /></radialGradient></defs>
      <ContactShadow x={W / 2} y={6} w={W * 1.12} opacity={0.3} />
      <Pass ow={ow} parts={[
        pt(rr(-60, -150, W + 120, 150, 26), `url(#${id}-b)`, basin),
        ...Array.from({length: cells}, (_, i) => pt(rr(i * CW + 10, -780, CW - 40, 640, 34), `url(#${id}-p)`, panel)),
        ...Array.from({length: cells}, (_, i) => pt(rp([[i * CW + 60, -770], [i * CW + CW - 90, -770], [i * CW + CW - 140, -900],
          [i * CW + 110, -900]], 22), `url(#${id}-s)`, stack)),
      ]} />
      {Array.from({length: cells}, (_, i) => {
        const x0 = i * CW + 10, cx = i * CW + (CW - 30) / 2, k = rnd(seed, i);
        const spin = running ? t * (240 + k * 60) : 0;
        return <g key={i}>
          {/* louvres, rounded slats catching the key along their top edges */}
          {Array.from({length: 8}, (_, j) => <g key={j}>
            <path d={rr(x0 + 34, -730 + j * 66, CW - 108, 40, 18)} fill={shade(panel, 0.32)} />
            <path d={`M${x0 + 52} ${-728 + j * 66} L${x0 + CW - 92} ${-728 + j * 66}`} stroke={light(panel, 0.5)} strokeWidth={8}
              strokeLinecap="round" opacity={0.8} />
          </g>)}
          {wear > 0.3 && <path d={`M${x0 + 120 + k * 200} -770 q8 160 -4 300`} stroke="#b0703c" strokeWidth={14} opacity={wear * 0.35}
            strokeLinecap="round" fill="none" />}
          <Sheen d={`M${x0 + 30} -760 L${x0 + 30} -200`} w={10} op={0.3} />
          {/* the fan under the stack rim, turning */}
          <ellipse cx={cx} cy={-900} rx={(CW - 250) / 2} ry={34} fill="#262a4a" stroke={line(stack)} strokeWidth={ow * 1.6} />
          <g transform={`translate(${cx} -900)`}>
            {[0, 1, 2, 3, 4].map((b) => {
              const a = (spin + b * 72) * Math.PI / 180, R = (CW - 290) / 2;
              return <path key={b} d={`M0 0 L${f1(Math.cos(a) * R)} ${f1(Math.sin(a) * R * 0.2)}`} stroke="#a3acd6" strokeWidth={22}
                strokeLinecap="round" opacity={running ? 0.8 : 1} />;
            })}
            <circle r={16} fill="#5a628f" />
          </g>
          <path d={`M${i * CW + 120} -892 L${i * CW + CW - 150} -892`} stroke="#ffffff" strokeWidth={8} opacity={0.45} strokeLinecap="round" />
          {/* the drift, white puffs that rise, swell and thin out */}
          {running && humidity > 0.08 && [0, 1, 2, 3].map((n) => {
            const ph = ((t * 0.22 + n / 4 + k) % 1);
            const r = 90 + ph * 160 * (0.6 + humidity);
            return <circle key={n} cx={cx + Math.sin(t * 0.7 + n + i) * 40 + ph * 60} cy={-960 - ph * (260 + humidity * 360)} r={r}
              fill={`url(#${id}-v)`} stroke="#c9d8f0" strokeWidth={6} strokeOpacity={0.5}
              opacity={Math.min(1, ph * 6) * (1 - ph) * Math.min(1, humidity * 1.8)} />;
          })}
        </g>;
      })}
      {/* the header pipe along the front, the thing that says plumbing and not a building */}
      <path d={rr(-40, -236, W + 80, 76, 38)} fill={line(pipe)} stroke={line(pipe)} strokeWidth={ow * 2} />
      <path d={rr(-40, -236, W + 80, 76, 38)} fill={`url(#${id}-h)`} />
      {Array.from({length: cells + 1}, (_, i) => <path key={i} d={rr(i * CW - 26, -248, 32, 100, 12)} fill={shade(pipe, 0.2)}
        stroke={line(pipe)} strokeWidth={ow * 1.4} />)}
      <Sheen d={`M-10 -222 L${W + 10} -222`} w={10} op={0.5} />
      <path d={`M-40 -110 L${W + 40} -110`} stroke={shade(basin, 0.3)} strokeWidth={10} strokeLinecap="round" opacity={0.6} />
    </g>
  );
};

// ===================================================================================== GENERATOR BANK

/**
 * GENERATOR BANK, the row of containerised diesels outside every one of these buildings. Almost always
 * OFF, which is the honest default, since a running bank is the newsworthy event, so `running` must be asked
 * for, and only then does the rain cap lift, the enclosure hum and the exhaust shimmer. Origin at the
 * left end, as the library's.
 */
export const GeneratorBankV2: React.FC<RigV2 & {units?: number; running?: boolean}> = (p) => {
  const {frame = 0, seed = 4, wear = 0.3, units = 5, running = false} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const UW = 538, H = 230, paint = '#e9b13f', skid = '#4a4f72', steel = '#aab3d4';
  const t = frame / 30;
  return (
    <g transform={at(p, false)}>
      <defs><Lit id={`${id}-e`} c={paint} /><Cyl id={`${id}-s`} c={steel} /></defs>
      <ContactShadow x={units * UW / 2} y={6} w={units * UW * 1.05} opacity={0.3} />
      {Array.from({length: units}, (_, i) => {
        const k = rnd(seed, i), hum = running ? Math.sin(frame * 2.1 + i) * 1.2 : 0;
        const x0 = i * UW, sx = x0 + UW * 0.46;
        const cap = running ? -30 - Math.abs(Math.sin(frame * 0.9 + i)) * 14 : 0;
        return <g key={i} transform={`translate(0 ${hum})`}>
          <Pass ow={ow} parts={[
            pt(rr(x0 + 18, -26, UW - 70, 26, 10), skid, skid),
            pt(rr(sx, -330, 44, 120, 14), `url(#${id}-s)`, steel),
            pt(rr(x0, -H - 10, UW - 34, H - 12, 30), `url(#${id}-e)`, paint),
          ]} />
          {/* the rain cap, hinged at the stack lip, which lifts on the exhaust when the set runs */}
          <path d={rr(sx - 6, -340, 56, 14, 7)} fill={shade(steel, 0.3)} stroke={line(steel)} strokeWidth={ow * 1.2}
            transform={`rotate(${cap} ${sx - 2} ${-334})`} />
          {/* intake louvres at one end, the radiator grille at the other */}
          {Array.from({length: 6}, (_, j) => <path key={j} d={rr(x0 + 30, -H + 20 + j * 30, 120, 16, 8)} fill={shade(paint, 0.34)} />)}
          <path d={rr(x0 + UW - 200, -H + 14, 140, 176, 18)} fill={shade(paint, 0.5)} />
          {Array.from({length: 7}, (_, j) => <path key={j} d={`M${x0 + UW - 186} ${-H + 34 + j * 22} L${x0 + UW - 74} ${-H + 34 + j * 22}`}
            stroke={shade(paint, 0.2)} strokeWidth={8} strokeLinecap="round" />)}
          {/* the control door and the fuel fill, where a person actually touches it */}
          <path d={rr(x0 + 186, -178, 84, 136, 12)} fill={light(paint, 0.12)} stroke={shade(paint, 0.3)} strokeWidth={4} />
          <circle cx={x0 + 254} cy={-110} r={6} fill={shade(paint, 0.55)} />
          <path d={rr(x0 + 200, -164, 56, 28, 6)} fill="#1c2142" />
          <circle cx={x0 + 214} cy={-150} r={6} fill={running ? '#38f2a0' : (frame + i * 17) % 60 < 6 ? '#38f2a0' : '#2c6a50'} />
          <path d={`M${x0 + 226} -150 L${x0 + 246} -150`} stroke="#5ad8ff" strokeWidth={5} strokeLinecap="round" opacity={0.8} />
          {[0.36, 0.66].map((u) => <path key={u} d={`M${x0 + (UW - 34) * u + (u > 0.5 ? 40 : -10)} ${-H + 4} L${x0 + (UW - 34) * u + (u > 0.5 ? 40 : -10)} -30`}
            stroke={shade(paint, 0.22)} strokeWidth={4} opacity={0.6} />)}
          <Sheen d={`M${x0 + 26} ${-H + 6} L${x0 + UW - 70} ${-H + 6}`} w={10} op={0.5} />
          {wear > 0.25 && <path d={`M${x0 + 180 + k * 120} ${-H} q6 60 -2 120`} stroke="#9a5a2c" strokeWidth={10} opacity={wear * 0.4}
            strokeLinecap="round" fill="none" />}
          {running && [0, 1, 2].map((n) => {
            const ph = (t * 0.6 + n / 3 + k) % 1;
            return <circle key={n} cx={sx + 22 + Math.sin(t * 2 + n) * 14 + ph * 30} cy={-360 - ph * 200} r={26 + ph * 50}
              fill="#8d92bd" opacity={(1 - ph) * 0.4} />;
          })}
        </g>;
      })}
    </g>
  );
};

// ===================================================================================== SWITCHGEAR

/**
 * SWITCHGEAR, the medium-voltage line-up in the electrical room, cubicle after cubicle of the same door.
 * Each carries the three things a person who has stood in front of one looks for, the instrument window
 * at eye height with its breaker lamps, the racking handle and the cubicle number plate. `energised`
 * lights the red lamps (closed and live) with a slow breath, and the bus duct runs over the top.
 */
export const SwitchgearV2: React.FC<RigV2 & {bays?: number; energised?: boolean}> = (p) => {
  const {frame = 0, seed = 5, wear = 0.1, bays = 6, energised = true} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const BW = 120, H = 230, paint = '#b8c6e2', duct = '#7f89b8';
  return (
    <g transform={at(p, false)}>
      <defs><Lit id={`${id}-p`} c={paint} /><Cyl id={`${id}-d`} c={duct} vertical /></defs>
      <ContactShadow x={bays * BW / 2} y={4} w={bays * BW * 1.08} opacity={0.28} />
      <Pass ow={ow} parts={[
        pt(rr(-16, -268, bays * BW + 32, 36, 16), `url(#${id}-d)`, duct),
        ...Array.from({length: bays}, (_, i) => pt(rr(i * BW, -H, BW - 6, H, 14), `url(#${id}-p)`, paint)),
        pt(rr(-6, -14, bays * BW + 6, 14, 6), '#3a3f66', '#3a3f66'),
      ]} />
      {Array.from({length: bays}, (_, i) => {
        const k = rnd(seed, i), x0 = i * BW;
        const breath = energised ? 0.65 + 0.35 * Math.abs(Math.sin(frame / 31 + k * 6)) : 1;
        return <g key={i}>
          <path d={rr(x0 + 14, -204, BW - 34, 54, 10)} fill="#1c2142" />
          <circle cx={x0 + 38} cy={-177} r={11} fill={energised ? '#ff5d5d' : '#3c4166'} opacity={breath} />
          {energised && <circle cx={x0 + 38} cy={-177} r={20} fill="#ff5d5d" opacity={0.22 * breath} />}
          <circle cx={x0 + 72} cy={-177} r={11} fill={energised ? '#3c4166' : '#38f2a0'} />
          <path d={rr(x0 + 26, -132, BW - 58, 16, 8)} fill={shade(paint, 0.28)} />
          <path d={`M${x0 + BW / 2 - 22} -92 L${x0 + BW / 2 + 16} -92`} stroke={shade(paint, 0.5)} strokeWidth={13} strokeLinecap="round" />
          <path d={rr(x0 + BW / 2 - 26, -62, 46, 22, 6)} fill="#fff6e6" stroke={shade(paint, 0.35)} strokeWidth={3} />
          <path d={rr(x0 + 10, -36, BW - 26, 16, 6)} fill="#ff8a3d" opacity={0.85} />
          <path d={`M${x0 + 10} -216 L${x0 + 10} -40`} stroke="#ffffff" strokeWidth={5} opacity={0.35} strokeLinecap="round" />
          {wear > 0.15 && <path d={`M${x0 + 30 + k * 50} -150 q4 40 -2 80`} stroke="#9a6a3c" strokeWidth={6} opacity={wear * 0.5} fill="none" />}
        </g>;
      })}
      <Sheen d={`M0 -258 L${bays * BW} -258`} w={7} op={0.5} />
    </g>
  );
};

// ===================================================================================== CDU

/**
 * COOLING DISTRIBUTION UNIT, direct-to-chip liquid. A cabinet with a pump behind a grille, the sight glass
 * where the coolant is the one thing actually visible (it sloshes gently), and two fat hoses out to the
 * row, supply cool and return warm, with the flow drawn as beads marching along each hose.
 */
export const CoolingDistributionUnitV2: React.FC<RigV2 & {flowing?: boolean}> = (p) => {
  const {frame = 0, wear = 0.1, flowing = true} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const body = '#3e5f8a', H = 190, W = 100;
  const t = frame / 30;
  const hoses: [string, number][] = [['#3fb5ff', -8], ['#ff7a45', 10]];
  const hoseD = (dy: number) => `M44 ${-126 + dy} C110 ${-126 + dy} 150 ${-110 + dy} 158 ${-30 + dy * 0.4}`;
  return (
    <g transform={at(p)}>
      <defs><Lit id={`${id}-b`} c={body} /><clipPath id={`${id}-g`}><path d={rr(-30, -170, 60, 46, 10)} /></clipPath>
        {hoses.map(([c], i) => <linearGradient key={i} id={`${id}-h${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={light(c, 0.5)} />
          <stop offset="100%" stopColor={shade(c, 0.3)} /></linearGradient>)}</defs>
      <ContactShadow x={20} y={3} w={W * 2} opacity={0.3} />
      {/* the hoses, behind the cabinet face, with their floor fittings */}
      {hoses.map(([c, dy], i) => <g key={i}>
        <path d={hoseD(dy)} stroke={line(c)} strokeWidth={16 + ow * 2} fill="none" strokeLinecap="round" />
        <path d={hoseD(dy)} stroke={c} strokeWidth={16} fill="none" strokeLinecap="round" />
        <path d={hoseD(dy)} stroke={light(c, 0.6)} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.6} transform="translate(-2 -4)" />
        {flowing && <path d={hoseD(dy)} stroke="#ffffff" strokeWidth={6} fill="none" strokeLinecap="round" strokeDasharray="2 26"
          strokeDashoffset={-(frame * 1.6 * (i ? -1 : 1)) % 28} opacity={0.75} />}
        <path d={rr(146, -34 + dy * 0.4, 26, 34, 8)} fill={shade(c, 0.2)} stroke={line(c)} strokeWidth={ow * 1.4} />
      </g>)}
      <Pass ow={ow} parts={[
        pt(rr(-W / 2, -H, W, H - 6, 12), `url(#${id}-b)`, body),
        pt(rr(-W / 2 + 6, -8, 22, 10, 4), '#2a2744', '#2a2744'), pt(rr(W / 2 - 28, -8, 22, 10, 4), '#2a2744', '#2a2744'),
        pt(rr(40, -140, 16, 34, 6), shade(body, 0.2), body, 0.7),
      ]} />
      {/* the sight glass, coolant sloshing behind it */}
      <path d={rr(-30, -170, 60, 46, 10)} fill="#151a3a" />
      <g clipPath={`url(#${id}-g)`}>
        <path d={`M-32 ${-148 + Math.sin(t * 1.4) * 2} Q-16 ${-154 + Math.sin(t * 2) * 3} 0 ${-148} T32 ${-148 + Math.cos(t * 1.4) * 2} L32 -120 L-32 -120 Z`}
          fill="#38c8f2" opacity={0.9} />
        <path d={`M-28 ${-149 + Math.sin(t * 1.4) * 2} Q-14 ${-154 + Math.sin(t * 2) * 3} 0 -149`} stroke="#c8f4ff" strokeWidth={3} fill="none"
          strokeLinecap="round" />
        {flowing && [0, 1, 2].map((n) => <circle key={n} cx={-18 + n * 16} cy={-128 - ((frame * 0.8 + n * 9) % 22)} r={2.4} fill="#e6fbff" opacity={0.8} />)}
      </g>
      <path d={rr(-30, -170, 60, 46, 10)} fill="none" stroke={line(body)} strokeWidth={ow * 1.2} />
      <path d="M-24 -164 L-6 -164" stroke="#ffffff" strokeWidth={4} opacity={0.5} strokeLinecap="round" />
      {/* the pump grille, and the small status display */}
      {Array.from({length: 8}, (_, i) => <path key={i} d={rr(-36, -104 + i * 11, 72, 6, 3)} fill={shade(body, 0.38)} />)}
      <path d={rr(-36, -22, 40, 12, 5)} fill="#151a3a" />
      <path d={`M-32 -16 L${-32 + 12 + 14 * (0.5 + 0.5 * Math.sin(t * 0.8))} -16`} stroke="#38f2a0" strokeWidth={5} strokeLinecap="round" />
      <circle cx={20} cy={-16} r={4} fill={flowing ? '#38f2a0' : '#ff5d5d'} />
      <Sheen d={`M${-W / 2 + 8} -182 L${W / 2 - 10} -182`} w={4} op={0.5} />
      <Sheen d={`M${-W / 2 + 6} -176 L${-W / 2 + 6} -30`} w={3} op={0.22} />
      {wear > 0.12 && <path d="M-40 -60 L-30 -40" stroke="#ffffff" strokeWidth={2} opacity={wear} />}
    </g>
  );
};

// ===================================================================================== THE HALL

/**
 * THE HALL BACKDROP, a cold aisle seen down its length, in the library's board units (1080 by 1920, drawn
 * far past the frame on every side so a deep plane never shows prairie at its margins). A deep indigo
 * ceiling with the ladder trays converging, the luminaire run down the middle (one of them dead, because
 * a hall with every fixture working is a render of a hall), the lit containment slot, and a floor that
 * falls off toward the camera with the luminaires reflected in it. `floorOnly` draws the floor alone,
 * for the second instance that covers a biome's grass.
 */
export const HallShellV2: React.FC<{frame?: number; seed?: number; horizonY?: number; lit?: number; floorOnly?: boolean}> = ({
  frame = 0, seed = 1, horizonY = 1180, lit = 0.55, floorOnly = false,
}) => {
  const id = useUid();
  const X0 = -1600, X1 = 2680, Y0 = -1400, Y1 = 3320, cx = 540;
  const floor = Math.max(400, Math.min(1700, horizonY));
  const cold = '#86e8ff';
  const yNear = Y0 + 320, yFar = floor - 236;
  const halfAt = (u: number) => 700 - 568 * u;
  const yAt = (u: number) => yNear + (yFar - yNear) * u;
  const lums = Array.from({length: 9}, (_, k) => 1 - Math.pow(1 - (k + 0.6) / 9, 1.7));
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-c`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0f1233" /><stop offset="1" stopColor="#2b336e" /></linearGradient>
        <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7480b8" /><stop offset="0.4" stopColor="#535d96" />
          <stop offset="1" stopColor="#2f3566" /></linearGradient>
        <linearGradient id={`${id}-s`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#dff8ff" stopOpacity={0.9 * lit} />
          <stop offset="1" stopColor={cold} stopOpacity={0} /></linearGradient>
        <radialGradient id={`${id}-p`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor={cold} stopOpacity={0.45 * lit} />
          <stop offset="1" stopColor={cold} stopOpacity={0} /></radialGradient>
      </defs>
      {!floorOnly && <rect x={X0} y={Y0} width={X1 - X0} height={floor - Y0} fill={`url(#${id}-c)`} />}
      <rect x={X0} y={floor} width={X1 - X0} height={Y1 - floor} fill={`url(#${id}-f)`} />
      {/* the light pool on the floor under the slot */}
      <ellipse cx={cx} cy={floor + 260} rx={760} ry={260} fill={`url(#${id}-p)`} />
      {!floorOnly && <path d={`M${cx - 90} ${floor - 210} L${cx + 90} ${floor - 210} L${cx + 620} ${Y0} L${cx - 620} ${Y0} Z`} fill={`url(#${id}-s)`} />}
      {!floorOnly && [-1, 1].map((s) => <g key={s}>
        <path d={`M${cx + s * 700} ${yNear} L${cx + s * 132} ${yFar}`} stroke="#5f6aa6" strokeWidth={16} strokeLinecap="round" fill="none" />
        <path d={`M${cx + s * 700} ${yNear} L${cx + s * 132} ${yFar}`} stroke="#8d97cf" strokeWidth={6} strokeLinecap="round" fill="none"
          transform="translate(-3 -4)" opacity={0.7} />
        {Array.from({length: 14}, (_, k) => {
          const u = 1 - Math.pow(1 - (k + 0.5) / 14, 1.9);
          const h = halfAt(u), y = yAt(u);
          return <path key={k} d={`M${cx + s * h} ${y} L${cx + s * (h - 118 * (1 - u * 0.82))} ${y}`} stroke="#6f7ab6"
            strokeWidth={12 - 9 * u} strokeLinecap="round" opacity={0.5 + 0.4 * (1 - u)} />;
        })}
      </g>)}
      {!floorOnly && lums.map((u, k) => {
        const h = halfAt(u) * 0.3, y = yAt(u), hh = Math.max(4, 32 * (1 - u * 0.86));
        const dead = k === 5;
        const fl = dead ? 0 : (0.75 + 0.25 * Math.sin(frame / 23 + k * 1.9 + seed)) * (0.35 + 0.65 * lit);
        return <g key={k}>
          {!dead && <ellipse cx={cx} cy={y + hh / 2} rx={h * 2.2} ry={hh * 2.4} fill={cold} opacity={0.12 * fl} />}
          <rect x={cx - h} y={y} width={h * 2} height={hh} rx={hh / 2} fill={dead ? '#2a2f58' : '#f2fbff'} opacity={dead ? 0.8 : 0.4 + 0.6 * fl}
            stroke={dead ? '#1a1e44' : '#bfefff'} strokeWidth={Math.max(1, hh * 0.18)} />
        </g>;
      })}
      {/* the luminaires again, as soft streaks reflected in the sealed floor */}
      {lums.map((u, k) => k === 5 ? null : <ellipse key={`r${k}`} cx={cx} cy={floor + (floor - yAt(u)) * 0.5} rx={halfAt(u) * 0.22}
        ry={Math.max(3, 14 * (1 - u))} fill="#dff8ff" opacity={0.1 * lit} />)}
      {Array.from({length: 9}, (_, i) => {
        const k = (i + 1) / 10, y = floor + (Y1 - floor) * k * k;
        return <path key={i} d={`M${X0} ${y} L${X1} ${y}`} stroke="#8a95cc" strokeWidth={2 + k * 3} opacity={0.35} strokeLinecap="round" />;
      })}
      {Array.from({length: 7}, (_, i) => {
        const off = (i - 3) * 190 + ((seed * 37) % 40) - 20;
        return <path key={i} d={`M${cx + off * 0.22} ${floor} L${cx + off * 6.2} ${Y1}`} stroke="#8a95cc" strokeWidth={3} opacity={0.3}
          strokeLinecap="round" />;
      })}
      <path d={`M${X0} ${floor} L${X1} ${floor}`} stroke="#141842" strokeWidth={8} opacity={0.6} />
    </g>
  );
};
