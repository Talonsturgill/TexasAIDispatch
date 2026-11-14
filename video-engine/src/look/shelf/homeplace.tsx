import React from 'react';
import {M} from '../../lib/scale';
import {FONT, widthOf} from '../../lib/type';
import {light, line, shade} from '../color';
import {ContactShadow, Glow, useUid} from '../Kit';
import {Figure, castV2} from '../Figure';

/**
 * THE HOMEPLACE, LOOK V2 (November 14th, 2026).
 *
 * The house, the yard and the things kept in full view of the street, from lib/homeplace.tsx, redrawn
 * on the v2 rules. The brick ranch with the arch, the carport and its freezer, the pier and beam house,
 * the trailer house with the deck somebody built, the yard and everything in it, the washateria.
 *
 * The library's one rule holds here unchanged and is the reason for the warmth. Every house in this
 * file is lit the same way, with the same warm window glow and the same porch lamp, so no drawing has a
 * dial that makes one home shabby. The trailer house gets the brick ranch's light, its lamp and its
 * flowers. Wear adds a little dust at the foot of a wall and a rust run, never a sad palette.
 *
 * Every form is rounded, lit from the upper left with shade pushed toward violet, outlined in its own
 * deep hue as one pass under the fills so joined parts show no seam, grounded by a contact shadow, and
 * something on each one moves (a lantern swaying in the arch, a canna in the wind, a dryer tumbling, a
 * drip under the window unit, a glint crossing the glass).
 *
 * PLACEMENT is the library's. x, y at the ground, `scale` 1 is true size through the one metre in
 * lib/scale.ts, drawn in centimetres so `scale` means the same as in look/props.tsx. The yard is the
 * one the library laid out in screen units (a lawn plane), and it keeps them, with true size things
 * standing on it. `h` and `w` keep the library's meaning, so only their ratio changes a shape.
 */
const CM = M / 100;
type Pt = [number, number];

/** true heights in centimetres, the library's measurements restated (a v2 drawing imports nothing else from src/lib) */
export const HOME_V2_CM = {
  brickRanch: 460, carport: 270, chestFreezer: 88, windowUnit: 38, pierBeam: 620, trailerHouse: 360, chainLink: 120,
  propaneTank: 115, clothesline: 190, agPool: 125, porchGlider: 86, satelliteDish: 240, burnBarrel: 88, washateria: 420,
} as const;

export interface HomeV2 {
  x?: number; y?: number; scale?: number; seed?: number; wear?: number; facing?: 1 | -1; night?: boolean;
  /** the ground under the house, which is not one brown in Texas */
  soil?: 'east' | 'blackland' | 'caliche' | 'panhandle';
  frame?: number;
}
const SOIL = {east: '#c46a42', blackland: '#9c9384', caliche: '#e2d2ae', panhandle: '#c9a87e'};

const at = (p: HomeV2) =>
  `translate(${p.x ?? 0} ${p.y ?? 0}) scale(${(p.scale ?? 1) * CM * (p.facing ?? 1)} ${(p.scale ?? 1) * CM})`;
/** half the outline stroke in local centimetres, so the line is about 6.8 film pixels at any scale */
const owOf = (p: HomeV2) => 3.4 / ((p.scale ?? 1) * CM);
const f1 = (n: number) => n.toFixed(1);
const fp = (q: Pt) => `${f1(q[0])} ${f1(q[1])}`;
const rnd = (seed: number, ch: number) => {
  const k = ((seed * 2654435761) ^ (ch * 40503)) >>> 0;
  return ((k >>> 8) % 10000) / 10000;
};
const TAU = Math.PI * 2;

/** a polygon with every corner rounded, by one radius or a radius per corner */
const rp = (pts: Pt[], r: number | number[]): string => {
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
const rr = (x: number, y: number, w: number, h: number, r: number) => rp([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], r);
const ell = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f1(cx - rx)} ${f1(cy)} A${f1(rx)} ${f1(ry)} 0 1 0 ${f1(cx + rx)} ${f1(cy)} A${f1(rx)} ${f1(ry)} 0 1 0 ${f1(cx - rx)} ${f1(cy)} Z`;

/** a lit material, light at the upper left, the colour, shade toward violet at the lower right */
const grad = (id: string, c: string, dir: 'd' | 'v' | 'h' = 'd', k = 0.45, s = 0.36) => (
  <linearGradient id={id} x1="0" y1="0" x2={dir === 'v' ? 0 : dir === 'h' ? 1 : 0.4} y2={dir === 'h' ? 0 : 1}>
    <stop offset="0%" stopColor={light(c, k)} /><stop offset="48%" stopColor={c} /><stop offset="100%" stopColor={shade(c, s)} />
  </linearGradient>
);
/** a lit cylinder seen side on, highlight a quarter in from the lit edge */
const cyl = (id: string, c: string, vertical = false) => (
  <linearGradient id={id} x1="0" y1="0" x2={vertical ? 0 : 1} y2={vertical ? 1 : 0}>
    <stop offset="0%" stopColor={shade(c, 0.1)} /><stop offset="24%" stopColor={light(c, 0.55)} />
    <stop offset="60%" stopColor={c} /><stop offset="100%" stopColor={shade(c, 0.42)} />
  </linearGradient>
);
const orb = (id: string, c: string) => (
  <radialGradient id={id} cx="34%" cy="28%" r="80%"><stop offset="0%" stopColor={light(c, 0.45)} /><stop offset="55%" stopColor={c} />
    <stop offset="100%" stopColor={shade(c, 0.4)} /></radialGradient>
);

/** THE SEAMLESS JOIN. Every part's outline first, then every fill, so parts that touch read as one form. */
type Part = {d: string; c: string; fill?: string; t?: string; o?: number};
const Pass: React.FC<{parts: Part[]; ow: number}> = ({parts, ow}) => <>
  {parts.map((q, i) => <path key={`o${i}`} d={q.d} transform={q.t} fill={line(q.c)} stroke={line(q.c)} strokeWidth={ow * 2 * (q.o ?? 1)}
    strokeLinejoin="round" />)}
  {parts.map((q, i) => <path key={`f${i}`} d={q.d} transform={q.t} fill={q.fill ?? q.c} />)}
</>;
/** a rounded bar drawn as a stroke with its own outline and a highlight (posts, pipes, wires, rails) */
const Tube: React.FC<{d: string; c: string; w: number; ow: number; sheen?: boolean}> = ({d, c, w, ow, sheen = true}) => <>
  <path d={d} fill="none" stroke={line(c)} strokeWidth={w + ow * 2} strokeLinecap="round" strokeLinejoin="round" />
  <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  {sheen && <path d={d} fill="none" stroke={light(c, 0.6)} strokeWidth={w * 0.3} strokeLinecap="round" strokeLinejoin="round" opacity={0.6}
    transform={`translate(${-w * 0.18} ${-w * 0.18})`} />}
</>;
/** a soft highlight along a lit edge */
const Sheen: React.FC<{d: string; w: number; op?: number}> = ({d, w, op = 0.4}) =>
  <path d={d} fill="none" stroke="#fffaf0" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={op} />;
/** a thin detail line in a colour's own deep hue (seams, laps, siding) */
const det = (c: string, k = 0.3) => shade(c, k);
/** a rust run down from a seam, faint, only where `wear` asks for it */
const Rust: React.FC<{x: number; y: number; w: number; h: number; op: number}> = ({x, y, w, h, op}) =>
  op > 0.02 ? <path d={`M${x - w / 2} ${y} Q${x - w * 0.4} ${y + h * 0.6} ${x} ${y + h} Q${x + w * 0.4} ${y + h * 0.6} ${x + w / 2} ${y} Z`}
    fill="#b65a2e" opacity={op} /> : null;
/** dust kicked up the foot of a wall, a soft band in the soil's colour */
const Dust: React.FC<{x: number; w: number; h: number; c: string; op: number}> = ({x, w, h, c, op}) => {
  const id = useUid();
  return op > 0.02 ? <g><defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c} stopOpacity={0} />
    <stop offset="100%" stopColor={c} stopOpacity={op} /></linearGradient></defs>
    <path d={rr(x, -h, w, h, h * 0.3)} fill={`url(#${id})`} /></g> : null;
};

/** lettering that fits its box and never mirrors with `facing` */
const Words: React.FC<{x: number; y: number; s: string; size: number; avail: number; fill: string; facing?: number; weight?: number}> = ({
  x, y, s, size, avail, fill, facing = 1, weight = 800,
}) => {
  const fs = Math.min(size, avail / widthOf(s, 1, true));
  return <g transform={`translate(${x} ${y}) scale(${facing} 1)`}>
    <text x={0} y={fs * 0.36} textAnchor="middle" fontFamily={FONT.body} fontWeight={weight} fontSize={fs} fill={fill}>{s}</text>
  </g>;
};

/**
 * A HOUSE WINDOW, and the warmth of the whole set. By day the glass reflects sky across its upper half
 * while a lamp inside shows warm between the curtains, so the house reads lived in at noon. By night
 * the whole pane glows and spills light. A glint crosses the glass every few seconds.
 */
const Win: React.FC<{x: number; y: number; w: number; h: number; ow: number; frame: number; seed?: number; night?: boolean;
  trim?: string; cols?: number; rows?: number; curtain?: string; sill?: boolean; r?: number}> = ({
  x, y, w, h, ow, frame, seed = 1, night = false, trim = '#f6eedc', cols = 2, rows = 1, curtain = '#f3d9b0', sill = true, r,
}) => {
  const id = useUid();
  const t = Math.min(w, h) * 0.1, rad = r ?? Math.min(w, h) * 0.12;
  const gx = x + t, gy = y + t, gw = w - 2 * t, gh = h - 2 * t;
  const glass = rr(gx, gy, gw, gh, rad * 0.6);
  const per = 5.4, k = ((frame / 30 + seed * 1.37) % per) / 1.2;
  const sx = gx - gw * 0.3 + k * gw * 1.6;
  const flick = 0.92 + Math.sin(frame / 30 * TAU * 0.7 + seed) * 0.04;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0.25" y2="1">
          {night ? <><stop offset="0%" stopColor="#fff2c2" /><stop offset="60%" stopColor="#ffc865" /><stop offset="100%" stopColor="#f08a3c" /></>
            : <><stop offset="0%" stopColor="#d8f1ff" /><stop offset="42%" stopColor="#8fc2ee" /><stop offset="43%" stopColor="#ffd890" />
              <stop offset="100%" stopColor="#f2a25a" /></>}
        </linearGradient>
        <clipPath id={`${id}c`}><path d={glass} /></clipPath>
      </defs>
      {night && <Glow x={x + w / 2} y={y + h * 0.6} r={Math.max(w, h) * 0.9} color="#ffcf7a" opacity={0.42 * flick} />}
      <Pass ow={ow} parts={[{d: rr(x, y, w, h, rad), c: trim}]} />
      <path d={glass} fill={`url(#${id}g)`} />
      <g clipPath={`url(#${id}c)`}>
        {/* the curtains, drawn back to either side, and the lamp between them */}
        {!night && <ellipse cx={gx + gw / 2} cy={gy + gh * 0.78} rx={gw * 0.28} ry={gh * 0.3} fill="#fff3c8" opacity={0.55 * flick} />}
        <path d={`M${gx} ${gy} L${gx + gw * 0.2} ${gy} Q${gx + gw * 0.13} ${gy + gh * 0.55} ${gx + gw * 0.2} ${gy + gh} L${gx} ${gy + gh} Z`}
          fill={curtain} opacity={night ? 0.65 : 0.92} />
        <path d={`M${gx + gw} ${gy} L${gx + gw * 0.8} ${gy} Q${gx + gw * 0.87} ${gy + gh * 0.55} ${gx + gw * 0.8} ${gy + gh} L${gx + gw} ${gy + gh} Z`}
          fill={curtain} opacity={night ? 0.65 : 0.92} />
        {!night && <path d={`M${gx + gw * 0.08} ${gy + gh} L${gx + gw * 0.3} ${gy + gh} L${gx + gw * 0.62} ${gy} L${gx + gw * 0.4} ${gy} Z`}
          fill="#ffffff" opacity={0.22} />}
        {k < 1 && <path d={`M${sx} ${gy + gh} L${sx + gw * 0.12} ${gy + gh} L${sx + gw * 0.12 + gh * 0.5} ${gy} L${sx + gh * 0.5} ${gy} Z`}
          fill="#ffffff" opacity={0.45} />}
      </g>
      {/* muntins in the trim colour */}
      {Array.from({length: cols - 1}, (_, i) => <path key={`c${i}`} d={`M${gx + gw * (i + 1) / cols} ${gy} L${gx + gw * (i + 1) / cols} ${gy + gh}`}
        stroke={trim} strokeWidth={t * 0.55} strokeLinecap="round" />)}
      {Array.from({length: rows - 1}, (_, i) => <path key={`r${i}`} d={`M${gx} ${gy + gh * (i + 1) / rows} L${gx + gw} ${gy + gh * (i + 1) / rows}`}
        stroke={trim} strokeWidth={t * 0.55} strokeLinecap="round" />)}
      <path d={glass} fill="none" stroke={line(trim)} strokeWidth={ow * 0.7} strokeLinejoin="round" opacity={0.7} />
      {sill && <Pass ow={ow} parts={[{d: rr(x - t * 0.6, y + h - t * 0.3, w + t * 1.2, t * 1.1, t * 0.5), c: trim}]} />}
    </g>
  );
};

/** a round foundation shrub, three lobes lit as one, swaying a little, and `bloom` dots it with flowers */
const Shrub: React.FC<{x: number; r: number; frame: number; seed: number; ow: number; c?: string; bloom?: string}> = ({
  x, r, frame, seed, ow, c = '#4f9a4a', bloom,
}) => {
  const id = useUid();
  const sway = Math.sin(frame / 30 * TAU * 0.35 + seed) * 2.2;
  const lobes: [number, number, number][] = [[-r * 0.55, -r * 0.62, r * 0.66], [r * 0.5, -r * 0.6, r * 0.7], [0, -r * 0.95, r * 0.8]];
  return (
    <g transform={`translate(${x} 0) rotate(${sway} 0 0)`}>
      <defs><radialGradient id={id} gradientUnits="userSpaceOnUse" cx={-r * 0.4} cy={-r * 1.5} r={r * 2.2}>
        <stop offset="0%" stopColor={light(c, 0.45)} /><stop offset="50%" stopColor={c} /><stop offset="100%" stopColor={shade(c, 0.42)} />
      </radialGradient></defs>
      <Pass ow={ow} parts={lobes.map(([cx, cy, rr0]) => ({d: ell(cx, cy, rr0, rr0 * 0.92), c, fill: `url(#${id})`}))} />
      {lobes.map(([cx, cy, rr0], i) => <path key={i} d={`M${cx - rr0 * 0.5} ${cy - rr0 * 0.35} Q${cx - rr0 * 0.1} ${cy - rr0 * 0.7} ${cx + rr0 * 0.3} ${cy - rr0 * 0.55}`}
        stroke={light(c, 0.6)} strokeWidth={ow * 0.9} strokeLinecap="round" fill="none" opacity={0.55} />)}
      {bloom && Array.from({length: 7}, (_, i) => <circle key={i} cx={(rnd(seed, i) - 0.5) * r * 1.8} cy={-r * (0.4 + rnd(seed, 9 + i) * 1.1)}
        r={r * 0.13} fill={bloom} stroke={line(bloom)} strokeWidth={ow * 0.5} />)}
    </g>
  );
};

/** a porch or coach lamp, its glass warm by day and burning by night, with a slow flicker */
const Lamp: React.FC<{x: number; y: number; s: number; ow: number; frame: number; night: boolean; seed?: number; hang?: boolean}> = ({
  x, y, s, ow, frame, night, seed = 1, hang = false,
}) => {
  const fl = 0.85 + Math.sin(frame / 30 * TAU * 1.3 + seed) * 0.08 + Math.sin(frame / 30 * TAU * 3.1 + seed) * 0.05;
  const swing = hang ? Math.sin(frame / 30 * TAU * 0.4 + seed) * 6 : 0;
  const metal = '#3d3550';
  return (
    <g transform={`translate(${x} ${y}) rotate(${swing})`}>
      <Glow x={0} y={s * 0.55} r={s * (night ? 4.4 : 2)} color="#ffcf7a" opacity={(night ? 0.75 : 0.32) * fl} />
      {hang && <path d={`M0 ${-s * 1.6} L0 0`} stroke={line(metal)} strokeWidth={ow * 0.8} strokeLinecap="round" />}
      <Pass ow={ow * 0.8} parts={[
        {d: rp([[-s * 0.42, s * 0.15], [s * 0.42, s * 0.15], [s * 0.34, s * 1.0], [-s * 0.34, s * 1.0]], s * 0.1), c: '#ffe39a',
          fill: night ? '#fff1b8' : '#ffd77c'},
        {d: rp([[-s * 0.55, s * 0.2], [0, -s * 0.25], [s * 0.55, s * 0.2]], s * 0.12), c: metal},
        {d: rr(-s * 0.42, s * 0.95, s * 0.84, s * 0.2, s * 0.1), c: metal},
      ]} />
      <path d={`M0 ${s * 0.25} L0 ${s * 0.95}`} stroke={line('#ffe39a')} strokeWidth={ow * 0.45} opacity={0.6} />
    </g>
  );
};

/** a grass tuft at a base, swaying */
const Tuft: React.FC<{x: number; s: number; frame: number; seed: number; ow: number; c?: string}> = ({x, s, frame, seed, ow, c = '#5fae46'}) => {
  const sw = Math.sin(frame / 30 * TAU * 0.4 + seed) * 0.15;
  return <g transform={`translate(${x} 0)`}>{[-1, 0, 1].map((k, i) => {
    const tip: Pt = [k * s * 0.4 + sw * s * 0.6, -s * (0.9 + 0.2 * (1 - Math.abs(k)))];
    return <path key={i} d={`M${k * s * 0.18 - s * 0.1} 2 Q${k * s * 0.2 + sw * s * 0.2} ${-s * 0.5} ${fp(tip)} Q${k * s * 0.24 + s * 0.04} ${-s * 0.45} ${k * s * 0.18 + s * 0.1} 2 Z`}
      fill={i === 1 ? light(c, 0.15) : c} stroke={line(c)} strokeWidth={ow * 1.1} strokeLinejoin="round" paintOrder="stroke" />;
  })}</g>;
};

// ===================================================================================== the brick ranch

/**
 * THE 1970s BRICK RANCH, with the arch. Long and low on a slab, a shallow hip roof, brick all across the
 * front with a soldier course over the windows, and the entry mass stepping forward so the arch is a deep
 * void with a warm door inside it and a lantern swaying in the crown. The shutters stay too narrow to
 * close, the garage door takes a third of the front, and the foundation shrubs are kept.
 */
export const BrickRanchV2: React.FC<HomeV2 & {h?: number; w?: number; brick?: string; arch?: 'round' | 'segmental' | 'none';
  garage?: boolean; coachLamp?: boolean; shutters?: boolean}> = (p) => {
  const {frame = 0, seed = 101, wear = 0.3, night = false, soil = 'blackland', h = 130, w = 520, brick = '#c0603e', arch = 'round',
    garage = true, coachLamp = true, shutters = true} = p;
  const id = useUid(), ow = owOf(p);
  const H = HOME_V2_CM.brickRanch, W = (w / h) * H;
  const trim = '#f7eedb', roof = '#7a6466', shut = '#3f7d5e', door = '#b9633a';
  const wallTop = -H * 0.74;
  const aw = H * 0.52, ah = H * 0.68, ax = -W * 0.06;
  const ex0 = ax - aw * 0.85, ew = aw * 1.7, eTop = -H * 0.8;
  const roofD = rp([[-W / 2 - W * 0.035, -H * 0.7], [-W * 0.2, -H], [W * 0.2, -H], [W / 2 + W * 0.035, -H * 0.7]], [24, 60, 60, 24]);
  const voidD = arch === 'round'
    ? `M${ax - aw / 2} 0 L${ax - aw / 2} ${-ah + aw / 2} A${aw / 2} ${aw / 2} 0 0 1 ${ax + aw / 2} ${-ah + aw / 2} L${ax + aw / 2} 0 Z`
    : rp([[ax - aw / 2, 0], [ax - aw / 2, -ah + aw * 0.2], [ax, -ah], [ax + aw / 2, -ah + aw * 0.2], [ax + aw / 2, 0]], [2, 30, 120, 30, 2]);
  const winX = -W * 0.44, winW = W * 0.24, winY = -H * 0.58, winH = H * 0.3;
  const gX = W * 0.1, gW = W * 0.34, gH = H * 0.62;
  return (
    <g transform={at(p)}>
      <defs>
        {grad(`${id}b`, brick, 'd', 0.3, 0.3)}{grad(`${id}e`, light(brick, 0.08), 'd', 0.35, 0.28)}{grad(`${id}r`, roof, 'v', 0.4, 0.38)}
        {grad(`${id}g`, '#f2e8d4', 'v', 0.5, 0.18)}
        <pattern id={`${id}k`} width={64} height={24} patternUnits="userSpaceOnUse">
          <path d="M0 23 L64 23 M0 11 L64 11 M20 0 L20 11 M52 11 L52 23" stroke={light(brick, 0.42)} strokeWidth={2.6} opacity={0.5} />
        </pattern>
        <linearGradient id={`${id}v`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2c1f3e" />
          <stop offset="100%" stopColor={night ? '#7a4a2e' : '#5a3a34'} /></linearGradient>
        <clipPath id={`${id}rc`}><path d={roofD} /></clipPath>
      </defs>
      <ContactShadow x={0} y={6} w={W * 1.12} opacity={0.32} />
      {/* the driveway in front of the garage, and the walk to the arch */}
      {garage && <path d={rp([[gX - 20, 0], [gX + gW + 20, 0], [gX + gW + 60, 26], [gX - 50, 26]], 10)} fill="#d9d2c6" stroke={line('#d9d2c6')}
        strokeWidth={ow} strokeLinejoin="round" />}
      <path d={roofD} fill={line(roof)} stroke={line(roof)} strokeWidth={ow * 2} strokeLinejoin="round" />
      <Pass ow={ow} parts={[{d: rr(-W / 2, wallTop, W, -wallTop + 2, 16), c: brick, fill: `url(#${id}b)`}]} />
      <path d={rr(-W / 2, wallTop, W, -wallTop, 16)} fill={`url(#${id}k)`} />
      <path d={roofD} fill={`url(#${id}r)`} />
      <g clipPath={`url(#${id}rc)`}>
        {[0.25, 0.5, 0.75].map((u) => <path key={u} d={`M${-W * 0.6} ${-H + H * 0.3 * u} L${W * 0.6} ${-H + H * 0.3 * u}`}
          stroke={det(roof, 0.25)} strokeWidth={ow * 0.6} />)}
      </g>
      <Sheen d={`M${-W * 0.18} ${-H + 14} L${W * 0.12} ${-H + 14}`} w={ow * 2} op={0.32} />
      <Sheen d={`M${-W / 2 - W * 0.01} ${-H * 0.72} L${-W * 0.21} ${-H + 18}`} w={ow * 1.6} op={0.28} />
      {/* the fascia board along the eave */}
      <Pass ow={ow} parts={[{d: rr(-W / 2 - W * 0.04, -H * 0.76, W * 1.08, H * 0.05, H * 0.025), c: trim}]} />
      {/* the wide low window, its soldier course over it, the shutters too narrow to ever close */}
      <path d={rr(winX - 10, winY - H * 0.07, winW + 20, H * 0.055, 8)} fill={shade(brick, 0.12)} stroke={line(brick)} strokeWidth={ow * 0.6} />
      {Array.from({length: 14}, (_, i) => <path key={i} d={`M${winX + (i + 0.5) * (winW / 14)} ${winY - H * 0.065} L${winX + (i + 0.5) * (winW / 14)} ${winY - H * 0.02}`}
        stroke={light(brick, 0.35)} strokeWidth={ow * 0.4} opacity={0.7} />)}
      <Win x={winX} y={winY} w={winW} h={winH} ow={ow} frame={frame} seed={seed} night={night} trim={trim} cols={3} rows={2} />
      {shutters && [-1, 1].map((s) => {
        const sx = winX + winW / 2 + s * (winW / 2 + W * 0.03) - W * 0.024;
        return <g key={s}><Pass ow={ow} parts={[{d: rr(sx, winY, W * 0.048, winH, 10), c: shut}]} />
          {[0.2, 0.4, 0.6, 0.8].map((u) => <path key={u} d={`M${sx + 10} ${winY + winH * u} L${sx + W * 0.048 - 10} ${winY + winH * u}`}
            stroke={det(shut, 0.32)} strokeWidth={ow * 0.5} strokeLinecap="round" />)}</g>;
      })}
      {/* THE ENTRY MASS steps forward and catches more light, and the arch is its void */}
      {arch !== 'none' && <g>
        <Pass ow={ow} parts={[{d: rp([[ex0, 2], [ex0, eTop], [ex0 + ew, eTop], [ex0 + ew, 2]], [4, 18, 18, 4]), c: light(brick, 0.08),
          fill: `url(#${id}e)`}]} />
        <path d={rp([[ex0, 2], [ex0, eTop], [ex0 + ew, eTop], [ex0 + ew, 2]], [4, 18, 18, 4])} fill={`url(#${id}k)`} />
        <Pass ow={ow} parts={[{d: rr(ex0 - 14, eTop - 22, ew + 28, 30, 14), c: trim}]} />
        <path d={voidD} fill={`url(#${id}v)`} stroke={line(brick)} strokeWidth={ow * 1.6} strokeLinejoin="round" />
        {/* the arch's brick ring */}
        {arch === 'round' && <path d={`M${ax - aw / 2 - 12} ${-ah + aw / 2} A${aw / 2 + 12} ${aw / 2 + 12} 0 0 1 ${ax + aw / 2 + 12} ${-ah + aw / 2}`}
          fill="none" stroke={light(brick, 0.25)} strokeWidth={22} strokeDasharray="14 6" />}
        <Pass ow={ow} parts={[{d: rr(ax - aw * 0.22, -ah * 0.76, aw * 0.44, ah * 0.76, 10), c: door}]} />
        {[0.2, 0.55].map((u) => <path key={u} d={rr(ax - aw * 0.15, -ah * 0.76 + ah * 0.76 * u * 0.95, aw * 0.3, ah * 0.25, 6)} fill="none"
          stroke={det(door, 0.3)} strokeWidth={ow * 0.5} />)}
        <circle cx={ax + aw * 0.14} cy={-ah * 0.36} r={5} fill="#ffd77c" stroke={line('#ffd77c')} strokeWidth={ow * 0.4} />
        <Glow x={ax} y={-ah * 0.4} r={aw * 0.7} color="#ffbf6a" opacity={night ? 0.55 : 0.25} />
        <path d={rr(ax - aw * 0.3, -6, aw * 0.6, 10, 5)} fill="#8a6a4e" />
        <Lamp x={ax} y={-ah + aw * 0.42} s={20} ow={ow} frame={frame} night={night} seed={seed} hang />
      </g>}
      {garage && <g>
        <Pass ow={ow} parts={[{d: rr(gX - 14, -gH - 14, gW + 28, gH + 16, 14), c: trim}, {d: rr(gX, -gH, gW, gH + 2, 8), c: '#efe4cf', fill: `url(#${id}g)`}]} />
        {Array.from({length: 4}, (_, r) => Array.from({length: 4}, (_, c) => <path key={`${r}${c}`}
          d={rr(gX + 14 + c * (gW - 28) / 4 + 6, -gH + 14 + r * (gH - 20) / 4 + 6, (gW - 28) / 4 - 12, (gH - 20) / 4 - 14, 8)}
          fill="none" stroke={det('#efe4cf', 0.2)} strokeWidth={ow * 0.55} />))}
        <Sheen d={`M${gX + 20} ${-gH + 18} L${gX + gW * 0.5} ${-gH + 18}`} w={ow * 1.2} op={0.5} />
      </g>}
      {coachLamp && <Lamp x={ex0 + ew + W * 0.022} y={-H * 0.5} s={22} ow={ow} frame={frame} night={night} seed={seed + 3} />}
      {/* the foundation shrubs under the window, kept round */}
      {[-0.42, -0.33, -0.24].map((u, i) => <Shrub key={i} x={W * u} r={46 + rnd(seed, i) * 10} frame={frame} seed={seed + i} ow={ow}
        bloom={i === 1 ? '#ff7aa8' : undefined} />)}
      <Shrub x={ex0 + ew + 60} r={40} frame={frame} seed={seed + 7} ow={ow} />
      <Dust x={-W / 2} w={W} h={H * 0.12} c={SOIL[soil]} op={wear > 0.3 ? wear * 0.4 : 0} />
    </g>
  );
};

// ===================================================================================== the chest freezer

/** the freezer body in centimetres, ground at 0, shared by the freezer and the carport it lives under */
const FreezerBody: React.FC<{ow: number; frame: number; seed: number; wear: number; open: boolean; clutter: number; night: boolean}> = ({
  ow, frame, seed, wear, open, clutter, night,
}) => {
  const id = useUid();
  const h = HOME_V2_CM.chestFreezer, w = h * 1.62, white = '#f8f5ee';
  const t = frame / 30;
  const lamp = Math.sin(t * TAU * 0.5) > -0.2;
  return (
    <g>
      <defs>{grad(`${id}w`, white, 'h', 0.6, 0.2)}{grad(`${id}l`, white, 'v', 0.6, 0.12)}
        <linearGradient id={`${id}i`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e6fbff" /><stop offset="100%" stopColor="#7fc4e6" /></linearGradient>
      </defs>
      <ContactShadow x={0} y={2} w={w * 1.25} opacity={0.34} />
      {open && <g>
        {/* the lid up on its hinge, and the cold light the freezer throws */}
        <Glow x={0} y={-h * 1.05} r={w * 0.9} color="#bfeaff" opacity={night ? 0.7 : 0.4} />
        <Pass ow={ow} parts={[{d: rp([[-w / 2 + 4, -h + 2], [-w / 2 + h * 0.22, -h * 1.7], [w / 2 + h * 0.22, -h * 1.7], [w / 2 - 4, -h + 2]], 10), c: white,
          fill: `url(#${id}l)`}]} />
        <path d={rr(-w / 2 + h * 0.2, -h * 1.62, w - h * 0.1, h * 0.5, 8)} fill="none" stroke={det(white, 0.14)} strokeWidth={ow * 0.6} />
      </g>}
      <Pass ow={ow} parts={[{d: rr(-w / 2, -h, w, h, 10), c: white, fill: `url(#${id}w)`}]} />
      <path d={rr(-w / 2 + 4, -h * 0.1, w - 8, h * 0.08, 4)} fill={shade(white, 0.22)} />
      {open ? <g>
        <path d={rr(-w / 2 + 6, -h - 4, w - 12, h * 0.16, 6)} fill={`url(#${id}i)`} stroke={line('#9fd6ee')} strokeWidth={ow * 0.6} />
        {/* the cold fog rolling over the rim and drifting off */}
        {Array.from({length: 6}, (_, i) => {
          const u = ((t * 0.25 + rnd(seed, i)) % 1);
          return <ellipse key={i} cx={(rnd(seed, 10 + i) - 0.5) * w * 0.9 + u * 14} cy={-h * 0.98 + u * h * 0.4} rx={h * (0.12 + rnd(seed, 20 + i) * 0.1) * (1 + u)}
            ry={h * 0.06 * (1 + u * 0.5)} fill="#f2fbff" opacity={0.7 * (1 - u)} />;
        })}
      </g> : <g>
        <Pass ow={ow} parts={[{d: rr(-w / 2 - 3, -h - 4, w + 6, h * 0.14, 8), c: white, fill: `url(#${id}l)`}]} />
        <Sheen d={`M${-w / 2 + 10} ${-h + 2} L${w * 0.1} ${-h + 2}`} w={ow * 1.2} op={0.6} />
        {/* the chrome latch, and the list taped to the lid in somebody's hand */}
        <Pass ow={ow * 0.7} parts={[{d: rr(-h * 0.09, -h * 0.9, h * 0.18, h * 0.08, h * 0.03), c: '#c8ceda'}]} />
        <g transform={`rotate(${(rnd(seed, 1) - 0.5) * 8} ${w * 0.2} ${-h * 0.8})`}>
          <path d={rr(w * 0.12, -h * 0.84, h * 0.32, h * 0.4, 3)} fill="#fff9e6" stroke={line('#fff9e6')} strokeWidth={ow * 0.5} />
          {[0, 1, 2, 3].map((i) => <path key={i} d={`M${w * 0.12 + 5} ${-h * 0.76 + i * 7} q4 -2 8 0 t8 0 t${6 + (i % 2) * 4} 0`} fill="none"
            stroke="#4a5aa8" strokeWidth={1.4} strokeLinecap="round" />)}
          <path d={rr(w * 0.12 + h * 0.08, -h * 0.87, h * 0.16, 6, 2)} fill="#e6dcae" opacity={0.85} />
        </g>
        {/* whatever lives on the lid, because the lid is never clear */}
        {Array.from({length: clutter}, (_, i) => {
          const cx = -w * 0.36 + i * w * 0.24, bw = w * (0.14 + rnd(seed, 60 + i) * 0.06), col = ['#d98a4a', '#5b8fd0', '#d2574a', '#8bb85a'][i % 4];
          const bh = h * (0.12 + rnd(seed, 70 + i) * 0.1);
          return i % 3 === 1
            ? <Pass key={i} ow={ow * 0.8} parts={[{d: rr(cx - bw * 0.3, -h - 4 - bh * 1.4, bw * 0.6, bh * 1.4, bw * 0.12), c: col},
              {d: rr(cx - bw * 0.34, -h - 4 - bh * 1.5, bw * 0.68, bh * 0.25, bw * 0.08), c: '#c8ceda'}]} />
            : <Pass key={i} ow={ow * 0.8} parts={[{d: rr(cx - bw / 2, -h - 4 - bh, bw, bh, 5), c: col}]} />;
        })}
      </g>}
      <circle cx={-w * 0.38} cy={-h * 0.18} r={h * 0.035} fill={lamp ? '#ff6a4a' : '#a04434'} stroke={line('#ff6a4a')} strokeWidth={ow * 0.4} />
      {lamp && <Glow x={-w * 0.38} y={-h * 0.18} r={h * 0.12} color="#ff7a4a" opacity={0.5} />}
      <Rust x={w * 0.38} y={-h * 0.3} w={h * 0.06} h={h * 0.22} op={wear > 0.2 ? wear * 0.35 : 0} />
    </g>
  );
};

/**
 * THE CHEST DEEP FREEZE. A low white box on a piano hinge, a chrome latch, one indicator lamp, a list
 * taped to the lid and things stacked on top. `open` lifts the lid and the cold fog rolls over the rim.
 */
export const ChestFreezerV2: React.FC<HomeV2 & {h?: number; open?: boolean; clutter?: number}> = (p) => {
  const {frame = 0, seed = 103, wear = 0.25, night = false, open = false, clutter = 3} = p;
  return <g transform={at({...p, facing: 1})}>
    <FreezerBody ow={owOf(p)} frame={frame} seed={seed} wear={wear} open={open} clutter={clutter} night={night} />
  </g>;
};

// ===================================================================================== the carport

/**
 * THE CARPORT, and the freezer under it. A shallow shed lower than any house roof, carried on posts
 * down one edge (wrought iron with the S scroll, or plain painted four by fours), an oil stain on the
 * slab, a heavy cord run to the freezer, and one bulb on the underside of the deck swaying a little.
 */
export const CarportV2: React.FC<HomeV2 & {h?: number; w?: number; iron?: boolean; freezer?: boolean; oilStain?: boolean}> = (p) => {
  const {frame = 0, seed = 102, wear = 0.35, night = false, h = 80, w = 260, iron = true, freezer = true, oilStain = true} = p;
  const id = useUid(), ow = owOf(p);
  const H = HOME_V2_CM.carport, W = (w / h) * H;
  const deck = '#dfe3ec', post = iron ? '#3e3654' : '#f4eee2', slab = '#d8d1c4';
  const sw = Math.sin(frame / 30 * TAU * 0.45 + seed) * 5;
  const roofD = rp([[-W / 2 - W * 0.03, -H * 1.02], [W / 2 + W * 0.03, -H * 0.9], [W / 2 + W * 0.03, -H * 0.8], [-W / 2 - W * 0.03, -H * 0.92]], 14);
  const underD = rp([[-W / 2 - W * 0.02, -H * 0.93], [W / 2 + W * 0.02, -H * 0.81], [W / 2 + W * 0.02, -H * 0.77], [-W / 2 - W * 0.02, -H * 0.89]], 8);
  const posts = [-0.42, 0, 0.42].map((u) => W * u);
  const topAt = (x: number) => -H * 0.92 + (x + W / 2) / W * H * 0.08;
  return (
    <g transform={at(p)}>
      <defs>{grad(`${id}d`, deck, 'v', 0.5, 0.3)}{grad(`${id}s`, slab, 'v', 0.3, 0.2)}</defs>
      <ContactShadow x={0} y={10} w={W * 1.15} opacity={0.3} />
      <Pass ow={ow} parts={[{d: rr(-W / 2 - 20, -6, W + 40, 30, 14), c: slab, fill: `url(#${id}s)`}]} />
      {oilStain && <ellipse cx={-W * 0.1} cy={8} rx={W * 0.1} ry={10} fill="#3a3448" opacity={0.32} />}
      {/* the shade the deck throws on the slab, so the carport reads as covered */}
      <ellipse cx={0} cy={6} rx={W * 0.5} ry={16} fill="#4a3f6a" opacity={0.18} />
      {posts.map((x, i) => <g key={i}>
        <Tube d={`M${x} ${topAt(x) + 8} L${x} -2`} c={post} w={iron ? 9 : 14} ow={ow} />
        {iron && [-1, 1].map((s) => <Tube key={s} c={post} w={5} ow={ow * 0.8} sheen={false}
          d={`M${x} ${topAt(x) + 46} q${s * 26} -4 ${s * 34} -28 q${s * 4} -14 ${s * -8} -12`} />)}
        {iron && <Tube c={post} w={5} ow={ow * 0.8} sheen={false} d={`M${x} ${-H * 0.5} q14 -16 0 -32 q-14 -16 0 -32`} />}
        <Rust x={x} y={-30} w={14} h={28} op={wear > 0.4 ? wear * 0.5 : 0} />
      </g>)}
      <Pass ow={ow} parts={[{d: underD, c: shade(deck, 0.3)}, {d: roofD, c: deck, fill: `url(#${id}d)`}]} />
      {Array.from({length: 16}, (_, i) => {
        const x = -W / 2 + (i + 0.5) * W / 16;
        return <path key={i} d={`M${x} ${topAt(x) - H * 0.085} L${x} ${topAt(x) - H * 0.02}`} stroke={det(deck, 0.2)} strokeWidth={ow * 0.5} strokeLinecap="round" />;
      })}
      <Sheen d={`M${-W / 2 - W * 0.01} ${-H * 1.0} L${W * 0.2} ${-H * 0.94}`} w={ow * 1.4} op={0.6} />
      {/* one bare bulb on the underside of the deck, swaying on its cord */}
      <g transform={`translate(${W * 0.05} ${topAt(W * 0.05) + 6}) rotate(${sw})`}>
        <path d="M0 0 L0 24" stroke="#3a3448" strokeWidth={ow * 0.6} />
        <Glow x={0} y={34} r={night ? 200 : 60} color="#fff2c4" opacity={night ? 0.7 : 0.35} />
        <circle cx={0} cy={32} r={10} fill={night ? '#fffbe2' : '#fff1bc'} stroke={line('#ffe9a0')} strokeWidth={ow * 0.5} />
      </g>
      {freezer && <g transform={`translate(${W * 0.27} 0)`}>
        {/* the heavy extension cord that runs to it */}
        <path d={`M${-W * 0.66} ${-H * 0.4} Q${-W * 0.68} -4 ${-W * 0.5} -2 L${-W * 0.2} -2 Q${-HOME_V2_CM.chestFreezer * 0.9} -2 ${-HOME_V2_CM.chestFreezer * 0.72} -16`}
          fill="none" stroke={line('#e8a03a')} strokeWidth={ow * 1.4 + 4} strokeLinecap="round" />
        <path d={`M${-W * 0.66} ${-H * 0.4} Q${-W * 0.68} -4 ${-W * 0.5} -2 L${-W * 0.2} -2 Q${-HOME_V2_CM.chestFreezer * 0.9} -2 ${-HOME_V2_CM.chestFreezer * 0.72} -16`}
          fill="none" stroke="#f0b04a" strokeWidth={4} strokeLinecap="round" />
        <FreezerBody ow={ow} frame={frame} seed={seed + 7} wear={wear} open={false} clutter={3} night={night} />
      </g>}
    </g>
  );
};

// ===================================================================================== the window unit

/**
 * THE WINDOW UNIT, tipped a few degrees down at the back so it drains, as it should be. A grille, the
 * louvers, two knobs, the accordion panels filling the sash gap, a scrap wood brace under it, and the
 * condensate dripping onto a dark stain below. `ribbon` flutters in the air it blows.
 */
export const WindowUnitV2: React.FC<HomeV2 & {h?: number; running?: boolean; ribbon?: boolean; era?: 'wood' | 'beige' | 'white'}> = (p) => {
  const {frame = 0, seed = 104, wear = 0.35, night = false, running = true, ribbon = false, era = 'beige'} = p;
  const id = useUid(), ow = owOf(p);
  const h = HOME_V2_CM.windowUnit, w = h * 1.6, t = frame / 30;
  const body = era === 'white' ? '#f6f4ee' : '#efdcae', grille = shade(body, 0.2), wood = '#b07a4a';
  const flutter = Math.sin(t * TAU * 1.4) * 5 + Math.sin(t * TAU * 2.7) * 2;
  const drip = (t * 0.9 + seed * 0.1) % 1;
  return (
    <g transform={at(p)}>
      <defs>{grad(`${id}b`, body, 'd', 0.5, 0.3)}{grad(`${id}w`, wood, 'v', 0.4, 0.3)}</defs>
      {/* the stain down the wall below it, and the drip */}
      <path d={rr(-w * 0.05, h * 0.24, w * 0.1, h * 0.9, w * 0.05)} fill="#5f7466" opacity={wear * 0.45} />
      {running && <ellipse cx={0} cy={h * 0.26 + drip * h * 1.0} rx={1.6} ry={2.4} fill="#9fd2ee" opacity={1 - drip * 0.7} />}
      {/* the window sill it sits on, and the stack of scrap wood bracing it from below */}
      <Pass ow={ow} parts={[{d: rr(-w * 0.86, -h * 0.02, w * 1.72, h * 0.1, h * 0.04), c: '#f6efe0'}]} />
      <Pass ow={ow} parts={[{d: rr(-w * 0.26, h * 0.1, w * 0.52, h * 0.08, 2), c: wood, fill: `url(#${id}w)`},
        {d: rr(-w * 0.2, h * 0.18, w * 0.4, h * 0.07, 2), c: shade(wood, 0.08), fill: `url(#${id}w)`}]} />
      <g transform="rotate(3)">
        {/* the accordion side panels filling the sash gap */}
        {[-1, 1].map((s) => <g key={s}>
          <Pass ow={ow * 0.8} parts={[{d: rr(s > 0 ? w / 2 - 2 : -w / 2 - w * 0.24 + 2, -h * 0.92, w * 0.24, h * 0.84, 2), c: '#efe7d6'}]} />
          {Array.from({length: 6}, (_, i) => <path key={i} d={`M${s > 0 ? w / 2 + i * w * 0.04 : -w / 2 - i * w * 0.04} ${-h * 0.9} L${s > 0 ? w / 2 + i * w * 0.04 : -w / 2 - i * w * 0.04} ${-h * 0.1}`}
            stroke={det('#efe7d6', 0.18)} strokeWidth={ow * 0.45} />)}
        </g>)}
        <Pass ow={ow} parts={[{d: rr(-w / 2, -h, w, h, 4), c: body, fill: `url(#${id}b)`}]} />
        {era === 'wood' && <path d={rr(-w / 2 + 1, -h + 1, w - 2, h * 0.16, 3)} fill="#8a5636" />}
        {/* the grille over the lower two thirds, and the louvers that aim the air */}
        <path d={rr(-w * 0.46, -h * 0.76, w * 0.58, h * 0.68, 3)} fill={shade(body, 0.08)} stroke={det(body, 0.25)} strokeWidth={ow * 0.45} />
        {Array.from({length: 7}, (_, i) => <path key={i} d={`M${-w * 0.43} ${-h * 0.7 + i * h * 0.088} L${w * 0.09} ${-h * 0.7 + i * h * 0.088}`}
          stroke={grille} strokeWidth={h * 0.035} strokeLinecap="round" />)}
        <path d={rr(w * 0.16, -h * 0.8, w * 0.29, h * 0.52, 3)} fill={shade(body, 0.08)} stroke={det(body, 0.25)} strokeWidth={ow * 0.45} />
        {Array.from({length: 4}, (_, i) => <path key={i} d={`M${w * 0.21 + i * w * 0.065} ${-h * 0.76} L${w * 0.21 + i * w * 0.065} ${-h * 0.32}`}
          stroke={grille} strokeWidth={h * 0.03} strokeLinecap="round" />)}
        {[0, 1].map((i) => <circle key={i} cx={w * 0.23 + i * w * 0.15} cy={-h * 0.15} r={h * 0.05} fill={era === 'wood' ? '#5a3a2a' : '#5a5470'}
          stroke={line('#5a5470')} strokeWidth={ow * 0.45} />)}
        <Sheen d={`M${-w * 0.46} ${-h * 0.94} L${w * 0.1} ${-h * 0.94}`} w={ow * 0.9} op={0.55} />
        {night && running && <circle cx={w * 0.43} cy={-h * 0.15} r={h * 0.025} fill="#7ae0a0" />}
        {ribbon && running && <path d={`M${w * 0.3} ${-h * 0.5} q${flutter * 0.6} ${h * 0.16} ${flutter} ${h * 0.34}`} fill="none" stroke="#e8507a"
          strokeWidth={h * 0.03} strokeLinecap="round" />}
      </g>
      <Rust x={w * 0.34} y={-h * 0.24} w={h * 0.06} h={h * 0.22} op={wear > 0.3 ? wear * 0.4 : 0} />
    </g>
  );
};

// ===================================================================================== the pier and beam house

/**
 * THE PIER AND BEAM HOUSE. Board and batten painted cream, a galvanised tin roof, a porch under its own
 * shallower slope with a haint blue ceiling, warm windows, steps up to the porch, and the dark gap under
 * the floor broken by piers on their centres and patches of lattice. A fern on the porch sways, and in
 * `rain` the water comes off the tin as a curtain at the eave.
 */
export const PierBeamHouseV2: React.FC<HomeV2 & {h?: number; w?: number; tin?: boolean; hauntBlue?: boolean; skirting?: 'lattice' | 'tin' | 'none';
  rain?: boolean}> = (p) => {
  const {frame = 0, seed = 105, wear = 0.45, night = false, soil = 'east', h = 200, w = 400, tin = true, hauntBlue = true,
    skirting = 'lattice', rain = false} = p;
  const id = useUid(), ow = owOf(p);
  const H = HOME_V2_CM.pierBeam, W = (w / h) * H, t = frame / 30;
  const wall = '#f3e8cf', roof = tin ? '#aab6c8' : '#6a5e6e', trimC = '#fffaf0', porchC = '#9ad0c6';
  const lift = H * 0.11, bodyH = H * 0.52, eave = -lift - bodyH;
  const roofD = rp([[-W / 2 - W * 0.05, eave + 6], [0, -H], [W / 2 + W * 0.05, eave + 6]], [16, 40, 16]);
  const pTop = -lift - bodyH * 1.2, pLow = -lift - bodyH * 0.86;
  const porchD = rp([[-W * 0.56, pLow], [-W * 0.1, pTop], [W * 0.1, pTop], [W * 0.56, pLow], [W * 0.56, pLow + 22], [-W * 0.56, pLow + 22]], 12);
  const fern = Math.sin(t * TAU * 0.4 + seed) * 4;
  return (
    <g transform={at(p)}>
      <defs>{grad(`${id}w`, wall, 'd', 0.45, 0.24)}{grad(`${id}r`, roof, 'd', 0.5, 0.3)}{grad(`${id}p`, roof, 'v', 0.35, 0.3)}
        <clipPath id={`${id}rc`}><path d={roofD} /></clipPath>
        <pattern id={`${id}l`} width={22} height={22} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 0 L0 22 M0 0 L22 0" stroke="#e8d2a8" strokeWidth={5} /></pattern>
      </defs>
      <ContactShadow x={0} y={6} w={W * 1.2} opacity={0.32} />
      <ellipse cx={0} cy={4} rx={W * 0.6} ry={14} fill={SOIL[soil]} opacity={0.45} />
      {/* THE GAP under the floor, deep blue violet, broken by the piers */}
      <path d={rr(-W / 2 + 10, -lift - 6, W - 20, lift + 6, 8)} fill="#20203a" />
      {Array.from({length: 6}, (_, i) => {
        const px = -W * 0.44 + i * W * 0.176;
        return <Pass key={i} ow={ow * 0.8} parts={[{d: rp([[px - lift * 0.34, 2], [px - lift * 0.22, -lift], [px + lift * 0.22, -lift], [px + lift * 0.34, 2]], 6),
          c: '#bdb4a6'}]} />;
      })}
      {skirting !== 'none' && [0, 1, 2].map((i) => {
        const sx = -W * 0.4 + i * W * 0.3;
        return skirting === 'lattice'
          ? <g key={i}><path d={rr(sx, -lift * 0.9, W * 0.2, lift * 0.9, 6)} fill={`url(#${id}l)`} />
            <path d={rr(sx, -lift * 0.9, W * 0.2, lift * 0.9, 6)} fill="none" stroke={line('#e8d2a8')} strokeWidth={ow * 1.2} /></g>
          : <Pass key={i} ow={ow} parts={[{d: rr(sx, -lift * 0.9, W * 0.2, lift * 0.9, 6), c: '#b7bcc8'}]} />;
      })}
      {/* roof first, then the body over its eave, then the porch over both */}
      <Pass ow={ow} parts={[{d: roofD, c: roof, fill: `url(#${id}r)`}, {d: rr(-W / 2, eave, W, bodyH + 4, 10), c: wall, fill: `url(#${id}w)`}]} />
      {tin && <g clipPath={`url(#${id}rc)`}>
        {Array.from({length: 24}, (_, i) => {
          const u = (i + 0.5) / 24;
          return <path key={i} d={`M${(u - 0.5) * W * 0.12} ${-H + 10} L${(u - 0.5) * W * 1.12} ${eave + 6}`} stroke={i % 2 ? det(roof, 0.18) : light(roof, 0.4)}
            strokeWidth={ow * 0.55} />;
        })}
      </g>}
      <Sheen d={`M${-W * 0.42} ${eave - H * 0.04} L${-W * 0.06} ${-H + 30}`} w={ow * 1.8} op={0.45} />
      {Array.from({length: 22}, (_, i) => <path key={i} d={`M${-W / 2 + (i + 0.5) * W / 22} ${eave + 12} L${-W / 2 + (i + 0.5) * W / 22} ${-lift - 8}`}
        stroke={det(wall, 0.14)} strokeWidth={ow * 0.55} strokeLinecap="round" />)}
      {[-0.36, 0.23].map((u, i) => <Win key={i} x={W * u} y={-lift - bodyH * 0.74} w={W * 0.13}
        h={bodyH * 0.5} ow={ow} frame={frame} seed={seed + i} night={night} trim={trimC} cols={2} rows={2} />)}
      {/* the porch, its own shallower slope tying in below the main eave, and its haint blue ceiling */}
      <Pass ow={ow} parts={[{d: porchD, c: roof, fill: `url(#${id}p)`}]} />
      {hauntBlue && <path d={rp([[-W * 0.55, pLow + 22], [W * 0.55, pLow + 22], [W * 0.5, pLow + 50], [-W * 0.5, pLow + 50]], 8)} fill={porchC}
        stroke={line(porchC)} strokeWidth={ow * 0.8} strokeLinejoin="round" />}
      {[-1, -0.33, 0.33, 1].map((s) => <Tube key={s} d={`M${s * W * 0.47} ${pLow + 30} L${s * W * 0.47} ${-lift}`} c={trimC} w={14} ow={ow} />)}
      <Tube d={`M${-W * 0.47} ${-lift - bodyH * 0.28} L${-W * 0.11} ${-lift - bodyH * 0.28} M${W * 0.11} ${-lift - bodyH * 0.28} L${W * 0.47} ${-lift - bodyH * 0.28}`}
        c={trimC} w={7} ow={ow * 0.8} sheen={false} />
      {Array.from({length: 12}, (_, i) => {
        const x = -W * 0.45 + i * W * 0.03 + (i >= 6 ? W * 0.57 : 0);
        return <path key={i} d={`M${x} ${-lift - bodyH * 0.28} L${x} ${-lift - 4}`} stroke={trimC} strokeWidth={4} strokeLinecap="round" />;
      })}
      <Lamp x={W * 0.08} y={pLow + 52} s={18} ow={ow} frame={frame} night={night} seed={seed} hang />
      {/* a fern in a hanging basket */}
      <g transform={`translate(${-W * 0.16} ${pLow + 50}) rotate(${fern})`}>
        <path d="M0 0 L0 40" stroke="#5a4a3a" strokeWidth={ow * 0.5} />
        <Pass ow={ow} parts={[{d: ell(0, 52, 22, 16), c: '#c97a4a'}]} />
        {Array.from({length: 7}, (_, i) => {
          const a = (i / 6 - 0.5) * 2.6;
          return <path key={i} d={`M0 46 Q${Math.sin(a) * 30} ${46 + 10} ${Math.sin(a) * 46} ${46 + 30 + Math.abs(Math.sin(a)) * 10}`} fill="none"
            stroke="#5aa64a" strokeWidth={9} strokeLinecap="round" />;
        })}
      </g>
      {/* the steps up to the porch, and the front door at the top of them */}
      <Pass ow={ow} parts={[{d: rr(-W * 0.05, -lift - bodyH * 0.66, W * 0.1, bodyH * 0.66 + 4, 8), c: '#5a7fb6'}]} />
      <circle cx={W * 0.03} cy={-lift - bodyH * 0.32} r={5} fill="#ffd77c" />
      {Array.from({length: 4}, (_, i) => <Pass key={i} ow={ow * 0.8} parts={[{d: rr(-W * 0.09 - i * 6, -lift + i * lift * 0.25, W * 0.18 + i * 12, lift * 0.27, 6),
        c: '#c8b08a'}]} />)}
      {[-0.38, 0.38].map((u, i) => <Shrub key={i} x={W * u} r={36} frame={frame} seed={seed + i} ow={ow} c="#4a9a52" bloom={i ? '#ff8ab0' : '#ffd25a'} />)}
      {rain && <g>
        {[-1, 1].map((s) => <path key={s} d={`M${s * W * 0.555} ${pLow + 22} L${s * W * 0.555} 0`} stroke="#bfe0f2" strokeWidth={10} opacity={0.6}
          strokeDasharray="30 12" strokeDashoffset={-frame * 6} strokeLinecap="round" />)}
        {Array.from({length: 40}, (_, i) => {
          const x0 = (rnd(seed, i) - 0.5) * W * 1.25, y0 = -H * 1.2 + ((t * 1.6 + rnd(seed, 40 + i)) % 1) * H * 1.2;
          return <path key={i} d={`M${x0} ${y0} l-8 34`} stroke="#c8e2f2" strokeWidth={3} opacity={0.45} strokeLinecap="round" />;
        })}
      </g>}
      <Rust x={W * 0.25} y={-H * 0.86} w={18} h={H * 0.1} op={wear > 0.3 ? wear * 0.35 : 0} />
    </g>
  );
};

// ===================================================================================== the trailer house

/**
 * THE TRAILER HOUSE, drawn with its dignity intact and lit exactly like the brick ranch. The short
 * overhang on a very shallow roof, identical sliders in an even row, the factory stripe at window head
 * height, the skirting dead level on top while its foot follows the ground, and the half that carries
 * the meaning. A deck somebody framed by hand, a porch lamp, a pot of geraniums, and cannas planted along
 * the skirting nodding in the wind.
 */
export const TrailerHouseV2: React.FC<HomeV2 & {h?: number; w?: number; windows?: number; deck?: boolean; slope?: number;
  doubleWide?: boolean; roofKit?: boolean}> = (p) => {
  const {frame = 0, seed = 106, wear = 0.35, night = false, soil = 'east', h = 100, w = 620, windows = 5, deck = true, slope = 0.4,
    doubleWide = false, roofKit = false} = p;
  const id = useUid(), ow = owOf(p);
  const H = HOME_V2_CM.trailerHouse, W = (w / h) * H, t = frame / 30;
  const siding = '#f1ead8', skirtC = '#d6cdb8', roof = roofKit ? '#a85f45' : '#d4d7e0', stripe = '#3f8c8a', wood = '#b59a78';
  const lift = H * 0.14, bodyH = H * 0.6, eave = -lift - bodyH, ridge = doubleWide ? H * 0.22 : H * 0.1;
  const roofD = doubleWide
    ? rp([[-W / 2 - W * 0.008, eave + 4], [0, eave - ridge], [W / 2 + W * 0.008, eave + 4]], [8, 30, 8])
    : rp([[-W / 2 - W * 0.008, eave + 4], [-W * 0.16, eave - ridge], [W * 0.16, eave - ridge], [W / 2 + W * 0.008, eave + 4]], [8, 30, 30, 8]);
  const skirtD = rp([[-W / 2 + 4, -lift], [W / 2 - 4, -lift], [W / 2 - 4, lift * slope * 0.5], [-W / 2 + 4, -lift * slope * 0.5]], 6);
  const dx = W * 0.1, dw = W * 0.26, dh = lift * 0.95;
  return (
    <g transform={at(p)}>
      <defs>{grad(`${id}s`, siding, 'd', 0.45, 0.24)}{grad(`${id}k`, skirtC, 'v', 0.3, 0.28)}{grad(`${id}r`, roof, 'v', 0.5, 0.28)}
        {grad(`${id}d`, wood, 'v', 0.35, 0.3)}<clipPath id={`${id}sc`}><path d={skirtD} /></clipPath></defs>
      <ContactShadow x={0} y={6} w={W * 1.1} opacity={0.3} />
      <ellipse cx={0} cy={4} rx={W * 0.56} ry={12} fill={SOIL[soil]} opacity={0.4} />
      {/* THE SKIRTING WEDGE, dead level on top while its foot follows the ground */}
      <Pass ow={ow} parts={[{d: skirtD, c: skirtC, fill: `url(#${id}k)`}]} />
      <g clipPath={`url(#${id}sc)`}>{Array.from({length: 28}, (_, i) => <path key={i} d={`M${-W / 2 + (i + 0.5) * W / 28} ${-lift} L${-W / 2 + (i + 0.5) * W / 28} ${lift}`}
        stroke={det(skirtC, 0.18)} strokeWidth={ow * 0.5} />)}</g>
      <Pass ow={ow} parts={[{d: roofD, c: roof, fill: `url(#${id}r)`}, {d: rr(-W / 2, eave, W, bodyH + 2, 14), c: siding, fill: `url(#${id}s)`}]} />
      <Sheen d={`M${-W * 0.48} ${eave - 4} L${W * 0.1} ${eave - ridge + 6}`} w={ow * 1.4} op={0.45} />
      {Array.from({length: 7}, (_, i) => <path key={i} d={`M${-W / 2 + 12} ${eave + bodyH * (0.24 + i * 0.11)} L${W / 2 - 12} ${eave + bodyH * (0.24 + i * 0.11)}`}
        stroke={det(siding, 0.1)} strokeWidth={ow * 0.45} />)}
      {/* the factory accent stripe at window head height, which dates the unit */}
      <path d={rr(-W / 2 + 4, eave + bodyH * 0.12, W - 8, H * 0.035, H * 0.017)} fill={stripe} stroke={line(stripe)} strokeWidth={ow * 0.6} />
      {doubleWide && <path d={`M0 ${eave + 10} L0 ${-lift - 6}`} stroke={det(siding, 0.2)} strokeWidth={ow * 0.6} />}
      {/* IDENTICAL sliders, evenly spaced. The rhythm is the tell. */}
      {Array.from({length: windows}, (_, i) => <Win key={i} x={-W * 0.44 + i * (W * 0.84) / windows} y={eave + bodyH * 0.26} w={W * 0.1}
        h={bodyH * 0.4} ow={ow} frame={frame} seed={seed + i * 2} night={night} trim="#fbf6ea" cols={2} rows={1} sill={false} />)}
      {/* ONE door, off centre, and its lamp */}
      <Pass ow={ow} parts={[{d: rr(W * 0.2, eave + bodyH * 0.16, W * 0.055, bodyH * 0.84, 10), c: '#c27a48'}]} />
      <path d={rr(W * 0.21, eave + bodyH * 0.22, W * 0.035, bodyH * 0.2, 6)} fill="#ffd890" />
      <Lamp x={W * 0.268} y={eave + bodyH * 0.2} s={16} ow={ow} frame={frame} night={night} seed={seed} />
      {deck && <g>
        {/* out of square, treated pine gone silver brown, and somebody in the family built it */}
        <g transform={`rotate(${(rnd(seed, 1) - 0.5) * 1.4} ${dx} 0)`}>
          {[0, 1, 2, 3, 4].map((i) => <Tube key={i} d={`M${dx + 10 + i * dw / 4.3} ${-dh} L${dx + 10 + i * dw / 4.3} 0`} c={shade(wood, 0.12)} w={9} ow={ow * 0.8}
            sheen={false} />)}
          <Pass ow={ow} parts={[{d: rr(dx, -dh - 14, dw, 16, 6), c: wood, fill: `url(#${id}d)`}]} />
          {[0, 1].map((i) => <Tube key={i} d={`M${dx + 6 + i * (dw - 12)} ${-dh - 10} L${dx + 6 + i * (dw - 12)} ${-dh - 92}`} c={wood} w={10} ow={ow * 0.9} />)}
          <Tube d={`M${dx + 2} ${-dh - 92} L${dx + dw - 2} ${-dh - 90}`} c={light(wood, 0.1)} w={10} ow={ow * 0.9} />
          {Array.from({length: 9}, (_, i) => <path key={i} d={`M${dx + 18 + i * (dw - 36) / 8} ${-dh - 88} L${dx + 18 + i * (dw - 36) / 8} ${-dh - 14}`}
            stroke={wood} strokeWidth={5} strokeLinecap="round" />)}
          {/* steps down off the deck */}
          {[0, 1].map((i) => <Pass key={i} ow={ow * 0.8} parts={[{d: rr(dx - 40 - i * 28, -dh * (0.66 - i * 0.33), 46 + i * 28, 10, 4), c: wood}]} />)}
          {/* a pot of red geraniums on the rail post */}
          <g transform={`translate(${dx + dw - 6} ${-dh - 96})`}>
            <Pass ow={ow * 0.8} parts={[{d: rp([[-14, -26], [14, -26], [10, 0], [-10, 0]], 4), c: '#d47a4a'}]} />
            {[-10, 0, 10, -5, 6].map((x, i) => <circle key={i} cx={x} cy={-30 - (i > 2 ? 9 : 0) + Math.sin(t * 2 + i) * 1.5} r={7} fill={i > 2 ? '#e2344a' : '#4f9a4a'}
              stroke={line(i > 2 ? '#e2344a' : '#4f9a4a')} strokeWidth={ow * 0.45} />)}
          </g>
        </g>
        {/* the cannas planted along the skirting, nodding */}
        {Array.from({length: 8}, (_, i) => {
          const cx = -W * 0.42 + i * W * 0.062, sw = Math.sin(t * TAU * 0.45 + i * 0.9) * 5, tall = 70 + (i % 3) * 14;
          return <g key={i} transform={`translate(${cx} 6) rotate(${sw})`}>
            {[-1, 1].map((s) => <path key={s} d={`M0 0 Q${s * 18} ${-tall * 0.4} ${s * 12} ${-tall * 0.85} Q${s * 2} ${-tall * 0.45} 0 0 Z`} fill="#4f8f46"
              stroke={line('#4f8f46')} strokeWidth={ow * 0.8} strokeLinejoin="round" paintOrder="stroke" />)}
            <path d={`M0 0 L0 ${-tall}`} stroke="#3f7a3c" strokeWidth={4} strokeLinecap="round" />
            {i % 2 === 0 && <><circle cx={0} cy={-tall - 6} r={10} fill="#ff5a3a" stroke={line('#ff5a3a')} strokeWidth={ow * 0.6} />
              <circle cx={6} cy={-tall + 2} r={7} fill="#ffb02a" stroke={line('#ffb02a')} strokeWidth={ow * 0.5} /></>}
          </g>;
        })}
      </g>}
      <Dust x={-W / 2} w={W} h={lift * 1.4} c={SOIL[soil]} op={wear > 0.3 ? wear * 0.35 : 0} />
    </g>
  );
};

// ===================================================================================== the propane tank

/** the tank in centimetres, ground at 0 */
const TankBody: React.FC<{ow: number; frame: number; seed: number; wear: number; gallons: 250 | 500}> = ({ow, frame, seed, wear, gallons}) => {
  const id = useUid();
  const h = HOME_V2_CM.propaneTank, w = h * (gallons === 500 ? 3.24 : 2.6), r = h * 0.4, cy = -h * 0.58;
  const shell = '#f4f2ee', leg = '#9a93a8';
  const k = ((frame / 30 + seed * 0.7) % 6) / 1.4;
  const needle = -30 + Math.sin(frame / 30 * 0.8 + seed) * 3;
  const body = `M${-w / 2 + r} ${cy - r} L${w / 2 - r} ${cy - r} A${r} ${r} 0 0 1 ${w / 2 - r} ${cy + r} L${-w / 2 + r} ${cy + r} A${r} ${r} 0 0 1 ${-w / 2 + r} ${cy - r} Z`;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0.15" y2="1"><stop offset="0%" stopColor="#ffffff" /><stop offset="30%" stopColor={shell} />
          <stop offset="68%" stopColor={shade(shell, 0.2)} /><stop offset="100%" stopColor={shade(shell, 0.42)} /></linearGradient>
        <clipPath id={`${id}c`}><path d={body} /></clipPath>
      </defs>
      <ContactShadow x={0} y={4} w={w * 1.15} opacity={0.32} />
      <Pass ow={ow} parts={[{d: rr(-w * 0.44, -6, w * 0.88, 16, 8), c: '#cfc8bc'}]} />
      <Pass ow={ow} parts={[
        ...[-1, 1].map((s) => ({d: rp([[s * w * 0.3 - h * 0.13, 0], [s * w * 0.3 - h * 0.07, cy + r * 0.3], [s * w * 0.3 + h * 0.07, cy + r * 0.3],
          [s * w * 0.3 + h * 0.13, 0]], 6), c: leg})),
        {d: body, c: shell, fill: `url(#${id}s)`},
        {d: `M${-h * 0.2} ${cy - r + 4} A${h * 0.2} ${h * 0.17} 0 0 1 ${h * 0.2} ${cy - r + 4} Z`, c: '#7a7690'},
      ]} />
      {/* the left end cap reads as a dome */}
      <path d={`M${-w / 2 + r * 1.05} ${cy - r * 0.92} A${r * 0.45} ${r * 0.95} 0 0 0 ${-w / 2 + r * 1.05} ${cy + r * 0.92}`} fill="none"
        stroke={det(shell, 0.12)} strokeWidth={ow * 0.6} />
      <path d={`M${w / 2 - r * 1.05} ${cy - r * 0.92} A${r * 0.45} ${r * 0.95} 0 0 1 ${w / 2 - r * 1.05} ${cy + r * 0.92}`} fill="none"
        stroke={det(shell, 0.12)} strokeWidth={ow * 0.6} />
      <g clipPath={`url(#${id}c)`}>
        <path d={`M${-w / 2 + r * 0.6} ${cy - r * 0.55} L${w / 2 - r * 0.6} ${cy - r * 0.55}`} stroke="#ffffff" strokeWidth={r * 0.22} strokeLinecap="round" opacity={0.85} />
        {k < 1 && <path d={`M${-w / 2 + k * w * 1.2} ${cy + r} l${r * 0.5} 0 l${r * 0.8} ${-r * 2} l${-r * 0.5} 0 Z`} fill="#ffffff" opacity={0.5} />}
        {wear > 0.2 && <ellipse cx={-w * 0.16} cy={cy + r * 0.2} rx={w * 0.1} ry={r * 0.32} fill="#c8bfae" opacity={wear * 0.3} />}
      </g>
      {/* the dial gauge under the dome */}
      <g transform={`translate(${h * 0.04} ${cy - r - h * 0.06})`}>
        <circle r={h * 0.06} fill="#fdfbf2" stroke={line('#fdfbf2')} strokeWidth={ow * 0.6} />
        <path d={`M0 0 L${Math.cos(needle * Math.PI / 180) * h * 0.045} ${Math.sin(needle * Math.PI / 180) * h * 0.045}`} stroke="#d2443a" strokeWidth={2}
          strokeLinecap="round" />
      </g>
      <Rust x={w * 0.24} y={cy - r * 0.2} w={h * 0.06} h={r * 0.7} op={wear > 0.2 ? wear * 0.28 : 0} />
    </g>
  );
};

/** THE PROPANE TANK. A white capsule on two saddle legs with the hinged dome over the valve and a dial
 *  gauge, on a little concrete pad. White by requirement, so a dark tank is always wrong. */
export const PropaneTankV2: React.FC<HomeV2 & {h?: number; gallons?: 250 | 500}> = (p) => {
  const {frame = 0, seed = 108, wear = 0.35, gallons = 500} = p;
  return <g transform={at(p)}><TankBody ow={owOf(p)} frame={frame} seed={seed} wear={wear} gallons={gallons} /></g>;
};

// ===================================================================================== the clothesline

/** THE CLOTHESLINE. Two galvanised T posts, wires that dip deeper with what is on them, and a load of
 *  washing pinned along it, swaying in the breeze. */
export const ClotheslineV2: React.FC<HomeV2 & {h?: number; span?: number; wires?: number; load?: number}> = (p) => {
  const {frame = 0, seed = 109, h = 70, span = 220, wires = 4, load = 0.5} = p;
  const ow = owOf(p), t = frame / 30;
  const H = HOME_V2_CM.clothesline, S = (span / h) * H, pipe = '#b9c2d2';
  const wy = (i: number) => -H + (i - (wires - 1) / 2) * H * 0.1;
  const dip = H * (0.05 + load * 0.12);
  const yOn = (i: number, x: number) => wy(i) + dip * (1 - (2 * x / S) ** 2);
  const items = Math.round(6 * load);
  const kinds = ['shirt', 'towel', 'pants', 'sheet', 'sock', 'shirt'];
  const cols = ['#5b8fd0', '#ffb84a', '#4a5aa0', '#f6f1e4', '#e8507a', '#58b08a'];
  return (
    <g transform={at(p)}>
      <ContactShadow x={0} y={4} w={S * 1.15} opacity={0.24} />
      {[-1, 1].map((s) => <g key={s}>
        <Tube d={`M${s * S / 2} 0 L${s * S / 2} ${-H}`} c={pipe} w={9} ow={ow} />
        <Tube d={`M${s * S / 2 - H * 0.2} ${-H - 4} L${s * S / 2 + H * 0.2} ${-H - 4}`} c={pipe} w={8} ow={ow} />
      </g>)}
      {Array.from({length: wires}, (_, i) => <path key={i} d={`M${-S / 2} ${wy(i)} Q0 ${wy(i) + dip * 2} ${S / 2} ${wy(i)}`} fill="none" stroke="#8a8aa6"
        strokeWidth={2.4} />)}
      {Array.from({length: items}, (_, i) => {
        const x = -S * 0.4 + (i + 0.5) * (S * 0.8 / items) + (rnd(seed, i) - 0.5) * 16;
        const wi = Math.min(wires - 1, 1 + (i % 2)), y0 = yOn(wi, x);
        const kind = kinds[i % kinds.length], c = cols[(i + seed) % cols.length];
        const sw = Math.sin(t * TAU * 0.5 + i * 1.1) * 6;
        const shape = kind === 'shirt' ? rp([[-30, 0], [30, 0], [44, 18], [32, 26], [26, 18], [24, 70], [-24, 70], [-26, 18], [-32, 26], [-44, 18]], 6)
          : kind === 'pants' ? rp([[-24, 0], [24, 0], [26, 86], [6, 86], [0, 30], [-6, 86], [-26, 86]], 6)
            : kind === 'sheet' ? rp([[-40, 0], [40, 0], [44, 76], [-36, 80]], 8)
              : kind === 'sock' ? rp([[-6, 0], [6, 0], [6, 30], [18, 38], [14, 46], [-6, 40]], 5)
                : rp([[-22, 0], [22, 0], [24, 52], [-24, 54]], 6);
        return <g key={i} transform={`translate(${x} ${y0}) rotate(${sw}) scale(1.5)`}>
          <Pass ow={ow} parts={[{d: shape, c}]} />
          <path d={`M-18 8 L18 8`} stroke={light(c, 0.45)} strokeWidth={ow * 0.9} strokeLinecap="round" opacity={0.6} />
          {[-1, 1].map((s) => <rect key={s} x={s * 14 - 3} y={-6} width={6} height={14} rx={3} fill="#e0b070" stroke={line('#e0b070')} strokeWidth={ow * 0.4} />)}
        </g>;
      })}
    </g>
  );
};

// ===================================================================================== the yard

/**
 * THE YARD, a lawn plane in the library's screen units with the true size things standing on it. St
 * Augustine, bluer and darker than bermuda, with brown patch drawn as the doughnut it is, the chain link
 * fence behind with the dog's worn track along the inside, the white propane tank and the clothesline.
 */
export const YardV2: React.FC<HomeV2 & {w?: number; depth?: number; fenceH?: number; propane?: boolean; clothesline?: boolean;
  brownPatch?: number; grass?: 'stAugustine' | 'bermuda' | 'bare'}> = (p) => {
  const {x = 0, y = 0, scale = 1, frame = 0, seed = 107, wear = 0.4, soil = 'blackland', w = 1080, depth = 260, propane = true,
    clothesline = true, brownPatch = 2, grass = 'stAugustine'} = p;
  const id = useUid();
  const g = grass === 'bermuda' ? '#8fb04e' : '#4f9a62';
  const lawn = grass === 'bare' ? SOIL[soil] : g;
  const ow = 3.4 / scale;
  const fH = HOME_V2_CM.chainLink, fow = 3.4 / (scale * CM), mesh = '#c3cad8';
  return (
    <g>
      <g transform={`translate(${x} ${y}) scale(${scale})`}>
        <defs><linearGradient id={`${id}l`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={shade(lawn, 0.12)} />
          <stop offset="100%" stopColor={light(lawn, 0.2)} /></linearGradient>
          <clipPath id={`${id}c`}><path d={rr(-w / 2, -depth, w, depth, 24)} /></clipPath></defs>
        <path d={rr(-w / 2, -depth, w, depth, 24)} fill={`url(#${id}l)`} stroke={line(lawn)} strokeWidth={ow * 2} />
        <g clipPath={`url(#${id}c)`}>
          {/* the dog's track along the inside of the fence */}
          <path d={rr(-w / 2, -depth, w, 18, 9)} fill={SOIL[soil]} opacity={0.6} />
          {grass !== 'bare' && Array.from({length: brownPatch}, (_, i) => {
            const cx = (rnd(seed, i) - 0.5) * w * 0.7, cy = -depth * (0.3 + rnd(seed, 20 + i) * 0.4), r = 50 + rnd(seed, 40 + i) * 50;
            return <g key={i}><ellipse cx={cx} cy={cy} rx={r} ry={r * 0.32} fill="#b39a5e" stroke="#8a7440" strokeWidth={ow * 1.4} />
              <ellipse cx={cx} cy={cy} rx={r * 0.44} ry={r * 0.14} fill={light(g, 0.06)} /></g>;
          })}
          {grass !== 'bare' && Array.from({length: 26}, (_, i) => <Tuft key={i} x={(rnd(seed, 80 + i) - 0.5) * w} s={20} frame={frame} seed={seed + i}
            ow={ow * 0.35} c={light(g, 0.22)} />).map((el, i) => <g key={i} transform={`translate(0 ${-depth * (0.1 + rnd(seed, 120 + i) * 0.85)})`}>{el}</g>)}
        </g>
        {/* the chain link fence at the back edge, true height */}
        <g transform={`translate(0 ${-depth}) scale(${CM})`}>
          {(() => {
            const half = w / (2 * CM), posts = 9;
            return <>
              <path d={rr(-half, -fH, half * 2, fH, 2)} fill="none" stroke={mesh} strokeWidth={0} />
              <g opacity={0.65}>
                {Array.from({length: Math.ceil(half * 2 / 12) + 1}, (_, i) => {
                  const fx = -half + i * 12;
                  return <path key={i} d={`M${fx} ${-fH * 0.96} L${fx + fH * 0.48} 0 M${fx} ${-fH * 0.96} L${fx - fH * 0.48} 0`} stroke={mesh} strokeWidth={1.6} />;
                })}
              </g>
              <Tube d={`M${-half} ${-fH} L${half} ${-fH}`} c={mesh} w={5} ow={fow} />
              {Array.from({length: posts}, (_, i) => <Tube key={i} d={`M${-half + i * half * 2 / (posts - 1)} 0 L${-half + i * half * 2 / (posts - 1)} ${-fH - 2}`}
                c={mesh} w={7} ow={fow} />)}
            </>;
          })()}
        </g>
      </g>
      {clothesline && <ClotheslineV2 x={x - w * 0.24 * scale} y={y - depth * 0.3 * scale} scale={scale} frame={frame} seed={seed + 5} wear={wear} />}
      {propane && <PropaneTankV2 x={x + w * 0.27 * scale} y={y - depth * 0.24 * scale} scale={scale} frame={frame} seed={seed + 3} wear={wear} />}
    </g>
  );
};

// ===================================================================================== the above ground pool

/**
 * THE ABOVE GROUND POOL, six to one, standing on the grass rather than in it. The printed tile band, the
 * top rail ring in segments with a plate over every upright, an A-frame ladder and a deck on one arc only.
 * `state` runs the season, fresh with a float bobbing, green by late August, tarped in winter, and gone,
 * leaving the yellow ring in the lawn.
 */
export const AboveGroundPoolV2: React.FC<HomeV2 & {h?: number; diameter?: number; state?: 'fresh' | 'green' | 'covered' | 'gone';
  deck?: boolean; segments?: number}> = (p) => {
  const {frame = 0, seed = 110, night = false, h = 60, diameter = 300, state = 'fresh', deck = true, segments = 10} = p;
  const id = useUid(), ow = owOf(p), t = frame / 30;
  const H = HOME_V2_CM.agPool, rx = (diameter / h) * H / 2, ry = rx * 0.3;
  const wall = '#d6e2f0', rail = '#f4efe4', water = state === 'green' ? '#6f9a52' : '#3fb6d6', wood = '#b59a78';
  if (state === 'gone') {
    return <g transform={at(p)}>
      <ellipse cx={0} cy={0} rx={rx} ry={ry} fill="#d8c87e" stroke={line('#d8c87e')} strokeWidth={ow * 1.6} />
      <ellipse cx={0} cy={0} rx={rx * 0.9} ry={ry * 0.88} fill="#ead9a4" />
      <ellipse cx={-rx * 0.2} cy={-ry * 0.2} rx={rx * 0.4} ry={ry * 0.3} fill="#fff4cc" opacity={0.35} />
    </g>;
  }
  const wallD = `M${-rx} 0 L${-rx} ${-H} A${rx} ${ry} 0 0 0 ${rx} ${-H} L${rx} 0 A${rx} ${ry} 0 0 1 ${-rx} 0 Z`;
  const pt = (a: number, yy = -H): Pt => [Math.cos(a) * rx, yy + Math.sin(a) * ry];
  return (
    <g transform={at(p)}>
      <defs>{cyl(`${id}w`, wall)}{grad(`${id}d`, wood, 'v', 0.35, 0.3)}
        <radialGradient id={`${id}q`} cx="40%" cy="40%" r="70%"><stop offset="0%" stopColor={light(water, 0.35)} /><stop offset="70%" stopColor={water} />
          <stop offset="100%" stopColor={shade(water, 0.3)} /></radialGradient>
        <clipPath id={`${id}c`}><path d={ell(0, -H * 0.9, rx * 0.95, ry * 0.92)} /></clipPath></defs>
      <ContactShadow x={0} y={ry * 0.3} w={rx * 2.4} opacity={0.3} />
      <ellipse cx={0} cy={2} rx={rx * 1.04} ry={ry * 1.06} fill="#d8c87e" opacity={0.55} />
      <Pass ow={ow} parts={[{d: wallD, c: wall, fill: `url(#${id}w)`}]} />
      {/* the printed tile band, faded */}
      <path d={`M${-rx} ${-H * 0.8} A${rx} ${ry} 0 0 0 ${rx} ${-H * 0.8} L${rx} ${-H * 0.66} A${rx} ${ry} 0 0 1 ${-rx} ${-H * 0.66} Z`} fill="#4f7fbf" opacity={0.55} />
      {Array.from({length: segments}, (_, i) => {
        const a = (i / segments) * TAU;
        if (Math.sin(a) < 0) return null;
        const [ux] = pt(a);
        return <path key={i} d={`M${ux} ${-H + Math.sin(a) * ry} L${ux} ${Math.sin(a) * ry}`} stroke={det(wall, 0.22)} strokeWidth={ow * 1.4} strokeLinecap="round" />;
      })}
      {state === 'covered'
        ? <><path d={ell(0, -H * 0.94, rx * 0.97, ry * 0.94)} fill="#3e5a78" stroke={line('#3e5a78')} strokeWidth={ow} />
          <ellipse cx={0} cy={-H * 0.86} rx={rx * 0.5} ry={ry * 0.4} fill="#7aa0b8" opacity={0.5} /></>
        : <><path d={ell(0, -H * 0.9, rx * 0.95, ry * 0.92)} fill={`url(#${id}q)`} />
          <g clipPath={`url(#${id}c)`}>
            {Array.from({length: 5}, (_, i) => {
              const u = (t * 0.2 + i / 5) % 1;
              return <ellipse key={i} cx={-rx * 0.1} cy={-H * 0.9} rx={rx * 0.95 * u} ry={ry * 0.92 * u} fill="none" stroke="#ffffff" strokeWidth={ow * 0.7}
                opacity={(1 - u) * 0.35} />;
            })}
            <path d={`M${-rx * 0.6} ${-H * 0.96} Q${-rx * 0.3} ${-H * 0.9 - ry * 0.4} 0 ${-H * 0.96}`} stroke="#ffffff" strokeWidth={ow * 1.2} fill="none" opacity={0.4}
              strokeLinecap="round" />
            {state === 'fresh' && <g transform={`translate(${rx * 0.3 + Math.sin(t * 0.6) * rx * 0.08} ${-H * 0.9 + Math.sin(t * 2) * 3})`}>
              <ellipse cx={0} cy={0} rx={rx * 0.14} ry={ry * 0.22} fill="#ff6a8a" stroke={line('#ff6a8a')} strokeWidth={ow * 0.8} />
              <ellipse cx={0} cy={-2} rx={rx * 0.07} ry={ry * 0.1} fill={water} />
              <path d={`M${-rx * 0.08} ${-ry * 0.12} Q0 ${-ry * 0.2} ${rx * 0.06} ${-ry * 0.14}`} stroke="#ffffff" strokeWidth={ow * 0.7} fill="none" opacity={0.7} />
            </g>}
          </g></>}
      {night && state !== 'covered' && <Glow x={0} y={-H * 0.9} r={rx} color="#7ae0ff" opacity={0.4} />}
      {/* THE TOP RAIL RING in segments, a plate over every upright */}
      <path d={ell(0, -H, rx, ry)} fill="none" stroke={line(rail)} strokeWidth={H * 0.12 + ow * 2} />
      <path d={ell(0, -H, rx, ry)} fill="none" stroke={rail} strokeWidth={H * 0.12} />
      <path d={`M${-rx * 0.9} ${-H - ry * 0.4} A${rx} ${ry} 0 0 1 ${rx * 0.2} ${-H - ry}`} fill="none" stroke="#ffffff" strokeWidth={H * 0.03} opacity={0.6} />
      {Array.from({length: segments}, (_, i) => {
        const [px, py] = pt((i / segments) * TAU);
        return <path key={i} d={rr(px - H * 0.06, py - H * 0.08, H * 0.12, H * 0.16, H * 0.04)} fill={shade(rail, 0.12)} stroke={line(rail)} strokeWidth={ow * 0.6} />;
      })}
      {/* the ladder, an A-frame straddling the wall */}
      <g transform={`translate(${rx * 0.38} ${ry * 0.92 - H})`}>
        {[-1, 1].map((s) => <Tube key={s} d={`M${s * H * 0.16} ${H} L${s * H * 0.08} ${-H * 0.3}`} c="#eef0f6" w={6} ow={ow * 0.8} />)}
        {[0.6, 0.25, -0.1].map((u) => <Tube key={u} d={`M${-H * 0.13} ${H * u + H * 0.1} L${H * 0.13} ${H * u + H * 0.1}`} c="#eef0f6" w={5} ow={ow * 0.7} sheen={false} />)}
      </g>
      {deck && <g>
        {/* the deck on one arc only, treated pine on posts, with two steps down */}
        <Pass ow={ow} parts={[
          {d: rr(-rx * 1.12, -H * 0.86, rx * 0.5, H * 0.86 + ry * 0.55, 10), c: shade(wood, 0.08), fill: `url(#${id}d)`},
          {d: rr(-rx * 1.16, -H * 0.98, rx * 0.58, H * 0.16, 8), c: light(wood, 0.12)},
        ]} />
        {[0.25, 0.5, 0.75].map((u) => <path key={u} d={`M${-rx * 1.12 + rx * 0.5 * u} ${-H * 0.8} L${-rx * 1.12 + rx * 0.5 * u} ${ry * 0.5}`}
          stroke={shade(wood, 0.28)} strokeWidth={ow * 0.5} strokeLinecap="round" />)}
        <Sheen d={`M${-rx * 1.1} ${-H * 0.95} L${-rx * 0.8} ${-H * 0.95}`} w={ow} op={0.5} />
        {[0, 1].map((i) => <Pass key={i} ow={ow * 0.8} parts={[{d: rr(-rx * 1.12 - 44 - i * 40, -H * (0.6 - i * 0.3), 52 + i * 40, 12, 5), c: wood}]} />)}
      </g>}
    </g>
  );
};

// ===================================================================================== the porch glider

/**
 * THE PORCH GLIDER. The seat rides forward and back on pivoting links while staying level, which is the
 * whole difference from a swing and the slowest loop in the set. `shell` is the formed steel motel chair
 * with the scalloped fan back and the springy Z leg in its period turquoise, mint, buttercup or tomato.
 */
export const PorchGliderV2: React.FC<HomeV2 & {h?: number; shell?: boolean; colour?: string; swing?: number}> = (p) => {
  const {frame = 0, seed = 111, wear = 0.4, shell = false, colour = '#2fa59a', swing = 1} = p;
  const id = useUid(), ow = owOf(p);
  const h = HOME_V2_CM.porchGlider, t = frame / 30;
  const travel = Math.sin(t * TAU / 2.6) * h * 0.12 * swing;
  const w = shell ? h * 0.86 : h * 1.5;
  const c = colour, cs = shade(c, 0.28);
  return (
    <g transform={at(p)}>
      <defs>{grad(`${id}c`, c, 'd', 0.45, 0.3)}</defs>
      <ContactShadow x={0} y={3} w={w * 1.3} opacity={0.3} />
      {shell ? <g transform={`translate(${travel * 0.3} 0)`}>
        <Tube d={`M${-w * 0.44} -3 L${-w * 0.08} -3 L${-w * 0.3} ${-h * 0.4} L${w * 0.32} ${-h * 0.4}`} c={cs} w={5} ow={ow} />
        <Pass ow={ow} parts={[{c, fill: `url(#${id}c)`, d: `M${-w * 0.34} ${-h * 0.36} L${-w * 0.42} ${-h * 0.92}`
          + Array.from({length: 6}, (_, i) => ` Q${-w * 0.42 + (i + 0.5) * w * 0.14} ${-h * 1.06} ${-w * 0.42 + (i + 1) * w * 0.14} ${-h * 0.92}`).join('')
          + ` L${w * 0.32} ${-h * 0.42} Q${w * 0.34} ${-h * 0.36} ${w * 0.26} ${-h * 0.34} L${-w * 0.28} ${-h * 0.34} Q${-w * 0.34} ${-h * 0.34} ${-w * 0.34} ${-h * 0.36} Z`}]} />
        {Array.from({length: 6}, (_, i) => <path key={i} d={`M${-w * 0.35 + i * w * 0.14} ${-h * 0.9} L${-w * 0.28 + i * w * 0.115} ${-h * 0.46}`}
          stroke={det(c, 0.25)} strokeWidth={ow * 0.6} strokeLinecap="round" />)}
        <Sheen d={`M${-w * 0.38} ${-h * 0.94} Q${-w * 0.2} ${-h * 1.02} ${-w * 0.02} ${-h * 0.96}`} w={ow * 1.2} op={0.5} />
        <Tube d={`M${w * 0.3} ${-h * 0.4} q${h * 0.1} ${-h * 0.1} ${h * 0.02} ${-h * 0.24}`} c={c} w={4} ow={ow * 0.8} />
      </g> : <g>
        {/* the base frame stays put */}
        <Tube d={`M${-w * 0.42} -2 L${-w * 0.42} ${-h * 0.1} L${w * 0.42} ${-h * 0.1} L${w * 0.42} -2`} c={cs} w={5} ow={ow} />
        {/* the links pivot, and the SEAT STAYS LEVEL */}
        {[-1, 1].map((s) => <Tube key={s} d={`M${s * w * 0.34} ${-h * 0.1} L${s * w * 0.34 + travel} ${-h * 0.36}`} c={cs} w={3.5} ow={ow * 0.8} sheen={false} />)}
        <g transform={`translate(${travel} 0)`}>
          <Pass ow={ow} parts={[
            {d: rr(-w * 0.46, -h * 0.42, w * 0.92, h * 0.08, h * 0.04), c, fill: `url(#${id}c)`},
            {d: rp([[-w * 0.44, -h * 0.4], [-w * 0.46, -h * 0.98], [w * 0.46, -h * 0.98], [w * 0.44, -h * 0.4]], [6, 14, 14, 6]), c, fill: `url(#${id}c)`},
          ]} />
          {Array.from({length: 6}, (_, i) => <path key={i} d={`M${-w * 0.4} ${-h * (0.9 - i * 0.085)} L${w * 0.4} ${-h * (0.9 - i * 0.085)}`}
            stroke={det(c, 0.22)} strokeWidth={ow * 0.55} strokeLinecap="round" />)}
          {/* a cushion somebody sewed for it */}
          <Pass ow={ow} parts={[{d: rr(-w * 0.4, -h * 0.5, w * 0.8, h * 0.1, h * 0.05), c: '#f2c45a'}]} />
          {[-1, 1].map((s) => <Tube key={s} c={c} w={4} ow={ow * 0.8} d={`M${s * w * 0.46} ${-h * 0.4} L${s * w * 0.48} ${-h * 0.6} q${-s * h * 0.04} ${-h * 0.06} ${-s * h * 0.14} ${-h * 0.04}`} />)}
          <Sheen d={`M${-w * 0.4} ${-h * 0.94} L${w * 0.1} ${-h * 0.94}`} w={ow * 1.2} op={0.5} />
        </g>
      </g>}
      <Rust x={-w * 0.36} y={-h * 0.1} w={h * 0.05} h={h * 0.06} op={wear > 0.3 ? wear * 0.5 : 0} />
    </g>
  );
};

// ===================================================================================== the satellite dish

/** THE SATELLITE DISH. The six foot mesh dish on its polar mount, a hard 1980s stamp, turning a hair
 *  as it tracks, or the small grey offset dish of the late nineties on a bracket. */
export const SatelliteDishV2: React.FC<HomeV2 & {h?: number; mesh?: boolean}> = (p) => {
  const {frame = 0, seed = 112, wear = 0.4, mesh = true} = p;
  const id = useUid(), ow = owOf(p);
  const H = HOME_V2_CM.satelliteDish, t = frame / 30;
  const c = mesh ? '#a9b2c4' : '#d6d8e2', r = mesh ? H * 0.42 : H * 0.16;
  const tilt = -26 + Math.sin(t * TAU / 9 + seed) * 3;
  const cy = mesh ? -H * 0.62 : -H * 0.3;
  return (
    <g transform={at(p)}>
      <defs><radialGradient id={`${id}d`} cx="62%" cy="66%" r="78%"><stop offset="0%" stopColor={light(c, 0.55)} /><stop offset="55%" stopColor={c} />
        <stop offset="100%" stopColor={shade(c, 0.38)} /></radialGradient></defs>
      <ContactShadow x={0} y={4} w={mesh ? H * 0.7 : H * 0.3} opacity={0.3} />
      {mesh ? <>
        <Pass ow={ow} parts={[{d: ell(0, -4, H * 0.16, H * 0.05), c: '#bdb4a6'}]} />
        <Tube d={`M0 -6 L0 ${cy + H * 0.06}`} c="#8f8aa6" w={H * 0.06} ow={ow} />
      </> : <Tube d={`M0 0 L0 ${cy} L${-H * 0.08} ${cy}`} c="#8f8aa6" w={H * 0.025} ow={ow} />}
      <g transform={`translate(0 ${cy}) rotate(${tilt})`}>
        <Pass ow={ow} parts={[{d: ell(0, 0, r, r * 0.94), c, fill: `url(#${id}d)`}]} />
        {mesh && <g>
          {Array.from({length: 12}, (_, i) => {
            const a = (i / 12) * Math.PI;
            return <path key={i} d={`M${-Math.cos(a) * r * 0.96} ${-Math.sin(a) * r * 0.9} L${Math.cos(a) * r * 0.96} ${Math.sin(a) * r * 0.9}`}
              stroke={det(c, 0.25)} strokeWidth={ow * 0.5} opacity={0.8} />;
          })}
          {[0.34, 0.66].map((f) => <ellipse key={f} cx={0} cy={0} rx={r * f} ry={r * f * 0.94} fill="none" stroke={det(c, 0.25)} strokeWidth={ow * 0.5} />)}
          <path d={`M${-r * 0.84} ${-r * 0.36} A${r * 0.92} ${r * 0.86} 0 0 1 ${-r * 0.2} ${-r * 0.88}`} fill="none" stroke="#ffffff" strokeWidth={ow * 1.4}
            strokeLinecap="round" opacity={0.6} />
          <path d={`M${r * 0.6} ${r * 0.6} A${r * 0.86} ${r * 0.8} 0 0 0 ${r * 0.86} ${r * 0.1}`} fill="none" stroke={shade(c, 0.35)} strokeWidth={ow * 1.2}
            strokeLinecap="round" opacity={0.6} />
        </g>}
        {/* the feed horn out in front on its arms */}
        {[-1, 1].map((s) => <Tube key={s} d={`M${s * r * 0.62} ${r * 0.1} L0 ${-r * 0.88}`} c="#8f8aa6" w={mesh ? 4 : 3} ow={ow * 0.7} sheen={false} />)}
        <Pass ow={ow * 0.8} parts={[{d: rr(-r * 0.09, -r * 1.08, r * 0.18, r * 0.24, r * 0.06), c: '#6a6488'}]} />
      </g>
      <Rust x={-H * 0.02} y={-H * 0.36} w={H * 0.03} h={H * 0.16} op={wear > 0.3 && mesh ? wear * 0.4 : 0} />
    </g>
  );
};

// ===================================================================================== the washateria

/**
 * THE WASHATERIA, a Fort Worth invention of 1934 and the word Texans use. At night the storefront is one
 * glowing band of green-leaning fluorescent against a warm street, with the grid of dryer doors across it,
 * one of them tumbling, and somebody at the folding table. The sign is backlit and says what it is.
 */
export const WashateriaV2: React.FC<HomeV2 & {h?: number; w?: number; dryers?: number; occupied?: number}> = (p) => {
  const {frame = 0, seed = 113, wear = 0.4, night = true, soil = 'caliche', h = 120, w = 420, dryers = 10, occupied = 1} = p;
  const id = useUid(), ow = owOf(p);
  const H = HOME_V2_CM.washateria, W = (w / h) * H, t = frame / 30;
  const block = '#e8d9bc', inside = night ? '#dff2d6' : '#7aa2c6', trimC = '#5a8a7a';
  const gx = -W * 0.46, gy = -H * 0.76, gw = W * 0.92, gh = H * 0.7;
  const cols = 5, rowsN = Math.ceil(dryers / cols);
  const dw = gw * 0.56 / cols;
  return (
    <g transform={at(p)}>
      <defs>{grad(`${id}b`, block, 'd', 0.4, 0.26)}
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={light(inside, 0.4)} /><stop offset="100%" stopColor={inside} /></linearGradient>
        <clipPath id={`${id}c`}><path d={rr(gx, gy, gw, gh, 16)} /></clipPath></defs>
      {night && <Glow x={0} y={10} r={W * 0.6} color="#ffb85a" opacity={0.3} />}
      <ContactShadow x={0} y={6} w={W * 1.12} opacity={0.32} />
      <Pass ow={ow} parts={[{d: rr(-W / 2 - 30, -6, W + 60, 22, 10), c: '#cfc6b6'}, {d: rp([[-W / 2, 2], [-W / 2, -H], [W / 2, -H], [W / 2, 2]], [4, 22, 22, 4]), c: block,
        fill: `url(#${id}b)`}]} />
      <path d={rr(-W / 2 + 10, -H * 0.86, W - 20, 16, 8)} fill={trimC} stroke={line(trimC)} strokeWidth={ow * 0.6} />
      <Sheen d={`M${-W / 2 + 20} ${-H + 14} L${W * 0.1} ${-H + 14}`} w={ow * 1.4} op={0.45} />
      {/* THE ONE GLOWING RECTANGLE */}
      {night && <Glow x={0} y={gy + gh * 0.5} r={W * 0.55} color="#c8f2c8" opacity={0.35} />}
      <path d={rr(gx, gy, gw, gh, 16)} fill={line('#9ab8a0')} stroke={line('#9ab8a0')} strokeWidth={ow * 2} />
      <path d={rr(gx, gy, gw, gh, 16)} fill={`url(#${id}g)`} />
      <g clipPath={`url(#${id}c)`}>
        {/* the fluorescent tubes on the ceiling */}
        {[0.15, 0.4, 0.65, 0.88].map((u) => <path key={u} d={rr(gx + gw * u - 30, gy + 10, 60, 8, 4)} fill="#ffffff" opacity={night ? 0.95 : 0.5} />)}
        {/* the grid of dryer doors, one of them turning */}
        {Array.from({length: dryers}, (_, i) => {
          const c = i % cols, r = Math.floor(i / cols);
          const bx = gx + 24 + c * dw, by = gy + 34 + r * (gh - 60) / rowsN, bh = (gh - 60) / rowsN - 14;
          const spin = i === 2 ? t * 220 : i === 6 ? t * 160 : 0;
          return <g key={i}>
            <Pass ow={ow * 0.8} parts={[{d: rr(bx, by, dw - 10, bh, 10), c: '#f2f4f2'}]} />
            <circle cx={bx + (dw - 10) / 2} cy={by + bh * 0.52} r={Math.min(dw, bh) * 0.32} fill={line('#9aaab4')} />
            <circle cx={bx + (dw - 10) / 2} cy={by + bh * 0.52} r={Math.min(dw, bh) * 0.27} fill={spin ? '#5a8ad0' : '#c8d6e2'} />
            {spin !== 0 && <g transform={`translate(${bx + (dw - 10) / 2} ${by + bh * 0.52}) rotate(${spin})`}>
              <path d={ell(-6, -8, 12, 7)} fill="#ff8a6a" /><path d={ell(8, 6, 10, 6)} fill="#ffd25a" /><path d={ell(-4, 10, 8, 5)} fill="#f6f1e4" />
            </g>}
            <ellipse cx={bx + (dw - 10) / 2 - 8} cy={by + bh * 0.42} rx={8} ry={5} fill="#ffffff" opacity={0.6} />
          </g>;
        })}
        {/* the folding table and whoever is at it */}
        <Pass ow={ow * 0.8} parts={[{d: rr(gx + gw * 0.62, gy + gh * 0.62, gw * 0.34, 14, 7), c: '#e9e2d0'}]} />
        {[0.66, 0.92].map((u) => <path key={u} d={`M${gx + gw * u} ${gy + gh * 0.62 + 12} L${gx + gw * u} ${gy + gh}`} stroke="#8a8aa6" strokeWidth={6} strokeLinecap="round" />)}
        <path d={ell(gx + gw * 0.72, gy + gh * 0.6, 34, 14)} fill="#ff9ab4" stroke={line('#ff9ab4')} strokeWidth={ow * 0.6} />
        <path d={ell(gx + gw * 0.75, gy + gh * 0.56, 26, 11)} fill="#9ad0ff" stroke={line('#9ad0ff')} strokeWidth={ow * 0.6} />
        {occupied > 0 && <g transform={`translate(${gx + gw * 0.84} ${gy + gh + 4}) scale(${170 / 560})`}>
          <Figure frame={frame} x={0} y={0} {...castV2('teacher')} pose="hold" emotion="neutral" turn={-0.4} seed={seed} />
        </g>}
        <path d={`M${gx + gw * 0.05} ${gy + gh} L${gx + gw * 0.2} ${gy + gh} L${gx + gw * 0.45} ${gy} L${gx + gw * 0.3} ${gy} Z`} fill="#ffffff" opacity={0.12} />
      </g>
      {/* the mullions of the storefront and the door */}
      {[0.6, 0.8].map((u) => <Tube key={u} d={`M${gx + gw * u} ${gy + 6} L${gx + gw * u} ${gy + gh - 6}`} c="#c8ccd8" w={8} ow={ow * 0.7} sheen={false} />)}
      <Tube d={`M${gx + 8} ${gy + 26} L${gx + gw - 8} ${gy + 26}`} c="#c8ccd8" w={6} ow={ow * 0.6} sheen={false} />
      {/* the backlit box sign on the parapet */}
      <Tube d={`M${-W * 0.2} ${-H} L${-W * 0.2} ${-H * 1.04} M${W * 0.2} ${-H} L${W * 0.2} ${-H * 1.04}`} c="#8f8aa6" w={10} ow={ow * 0.8} />
      {night && <Glow x={0} y={-H * 1.12} r={W * 0.36} color="#fff1c4" opacity={0.4} />}
      <Pass ow={ow} parts={[{d: rr(-W * 0.31, -H * 1.24, W * 0.62, H * 0.21, 26), c: '#2f6aa8'}]} />
      <path d={rr(-W * 0.29, -H * 1.22, W * 0.58, H * 0.17, 18)} fill={night ? '#fff8e6' : '#f2ecdc'} />
      <Words x={0} y={-H * 1.135} s="WASHATERIA" size={H * 0.12} avail={W * 0.52} fill="#2f6aa8" facing={p.facing ?? 1} weight={900} />
      <Dust x={-W / 2} w={W} h={H * 0.12} c={SOIL[soil]} op={wear > 0.3 ? wear * 0.35 : 0} />
    </g>
  );
};

// ===================================================================================== the burn barrel

/** THE BURN BARREL. A fifty five gallon drum standing open on its scorched ring of ground, two rolling
 *  hoops, rusted through in places. Ordinary rural infrastructure. `lit` sets it burning with smoke
 *  rising, and even cold it gives off a thin curl. */
export const BurnBarrelV2: React.FC<HomeV2 & {h?: number; lit?: boolean}> = (p) => {
  const {frame = 0, seed = 114, wear = 0.7, lit = false} = p;
  const id = useUid(), ow = owOf(p);
  const h = HOME_V2_CM.burnBarrel, w = h * 0.62, t = frame / 30, drum = '#b8603a';
  return (
    <g transform={at(p)}>
      <defs>{cyl(`${id}d`, drum)}<linearGradient id={`${id}f`} x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#ffe066" />
        <stop offset="55%" stopColor="#ff9a2a" /><stop offset="100%" stopColor="#e2402a" /></linearGradient></defs>
      <ellipse cx={0} cy={3} rx={w * 0.8} ry={h * 0.07} fill="#3a2e3e" opacity={0.3} />
      <ContactShadow x={0} y={3} w={w * 1.5} opacity={0.32} />
      {lit && <Glow x={0} y={-h} r={w * 1.6} color="#ffa040" opacity={0.6} />}
      <Pass ow={ow} parts={[{d: rp([[-w / 2, 0], [-w / 2, -h], [w / 2, -h], [w / 2, 0]], 6), c: drum, fill: `url(#${id}d)`},
        {d: ell(0, -h, w / 2, h * 0.09), c: drum, fill: '#3a2a34'}]} />
      {[0.34, 0.66].map((f) => <path key={f} d={`M${-w / 2} ${-h * f} Q0 ${-h * f + h * 0.05} ${w / 2} ${-h * f}`} fill="none" stroke={line(drum)} strokeWidth={ow * 0.9} />)}
      {[0.34, 0.66].map((f) => <path key={`l${f}`} d={`M${-w / 2 + 3} ${-h * f - 3} Q0 ${-h * f + h * 0.05 - 3} ${w / 2 - 3} ${-h * f - 3}`} fill="none"
        stroke={light(drum, 0.45)} strokeWidth={ow * 0.5} opacity={0.6} />)}
      {Array.from({length: 4}, (_, i) => <ellipse key={i} cx={(rnd(seed, i) - 0.5) * w * 0.6} cy={-h * (0.15 + rnd(seed, 20 + i) * 0.6)} rx={h * 0.04} ry={h * 0.03}
        fill="#4a2a2a" opacity={wear * 0.8} />)}
      {lit && Array.from({length: 4}, (_, i) => {
        const fl = Math.sin(t * TAU * (1.6 + i * 0.3) + i) * 0.18;
        const fx = (i - 1.5) * w * 0.16, fh = h * (0.32 + (i % 2) * 0.12) * (1 + fl);
        return <path key={i} d={`M${fx - w * 0.14} ${-h} Q${fx - w * 0.12} ${-h - fh * 0.5} ${fx + fl * 20} ${-h - fh} Q${fx + w * 0.12} ${-h - fh * 0.5} ${fx + w * 0.14} ${-h} Z`}
          fill={`url(#${id}f)`} opacity={0.92} />;
      })}
      {Array.from({length: lit ? 5 : 3}, (_, i) => {
        const u = (t * (lit ? 0.5 : 0.3) + i / (lit ? 5 : 3)) % 1;
        return <circle key={`s${i}`} cx={Math.sin(u * 5 + i) * w * 0.2 + u * w * 0.3} cy={-h - (lit ? h * 0.3 : h * 0.05) - u * h * (lit ? 0.4 : 0.4)}
          r={h * (lit ? 0.08 : 0.05) * (1 + u * 1.5)} fill="#a89cb4" opacity={(1 - u) * (lit ? 0.5 : 0.28)} />;
      })}
      {/* the wire mesh laid over the top */}
      <path d={ell(0, -h - 2, w * 0.46, h * 0.07)} fill="none" stroke="#8a8aa6" strokeWidth={1.6} strokeDasharray="4 4" />
    </g>
  );
};

export const HOMEPLACE_V2 = ['BrickRanchV2', 'CarportV2', 'ChestFreezerV2', 'WindowUnitV2', 'PierBeamHouseV2', 'TrailerHouseV2', 'YardV2',
  'PropaneTankV2', 'ClotheslineV2', 'AboveGroundPoolV2', 'PorchGliderV2', 'SatelliteDishV2', 'WashateriaV2', 'BurnBarrelV2'] as const;
