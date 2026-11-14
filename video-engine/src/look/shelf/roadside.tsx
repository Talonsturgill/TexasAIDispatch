import React from 'react';
import {M} from '../../lib/scale';
import {FONT, widthOf} from '../../lib/type';
import {light, line, mix, shade} from '../color';
import {ContactShadow, Glow, useUid} from '../Kit';
import {taper} from '../props';

/**
 * THE TEXAS ROADSIDE, LOOK V2 (November 13th, 2026).
 *
 * The drive-by inventory from lib/roadside.tsx redrawn on the v2 rules. Signs, stores, a gin, a dance
 * hall, a church, the road itself. Every form is rounded, lit from the upper left, outlined in its own
 * deep hue and grounded by a contact shadow, and something on each one moves (a glint across glass, a
 * swinging bell, a chasing bulb, a swaying wreath).
 *
 * The library's trademark rule holds here unchanged. These draw the FORM of the famous roadside
 * buildings and never a mark. Any lettering is generic (CITY LIMIT, FEED, ICE) or passed in by the
 * scene, and is set in the house faces.
 *
 * Placement is the library's. Drawings that the library sized through `fit` take x and y at the ground
 * and `scale` 1 as true size, drawn here in centimetres through lib/scale.ts. The few the library laid
 * out in screen units (the module yard, the boot fence, the ghost sign and the two-lane) keep theirs.
 * A `closed` business is still a choice and never a default, except where the library chose otherwise.
 */
const CM = M / 100;
type Pt = [number, number];

export interface RoadV2 {
  x?: number; y?: number; scale?: number; seed?: number; wear?: number; facing?: 1 | -1;
  closed?: boolean; night?: boolean; frame?: number;
}

const at = (p: RoadV2) =>
  `translate(${p.x ?? 0} ${p.y ?? 0}) scale(${(p.scale ?? 1) * CM * (p.facing ?? 1)} ${(p.scale ?? 1) * CM})`;
/** half the outline stroke, in local centimetres, so the line is the same on film at any scale */
const owOf = (p: RoadV2) => 3.4 / ((p.scale ?? 1) * CM);
const f1 = (n: number) => n.toFixed(1);
const fp = (q: Pt) => `${f1(q[0])} ${f1(q[1])}`;
const rnd = (seed: number, ch: number) => {
  const k = ((seed * 2654435761) ^ (ch * 40503)) >>> 0;
  return ((k >>> 8) % 10000) / 10000;
};
const TAU = Math.PI * 2;

/** a polygon with every corner rounded, by radius or a radius per corner */
const rp = (pts: Pt[], r: number | number[]): string => {
  const n = pts.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = pts[(i - 1 + n) % n], b = pts[i], c = pts[(i + 1) % n];
    const rr0 = Array.isArray(r) ? r[i] : r;
    const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, l2 = Math.hypot(c[0] - b[0], c[1] - b[1]) || 1;
    const k1 = Math.min(rr0, l1 / 2) / l1, k2 = Math.min(rr0, l2 / 2) / l2;
    const p0: Pt = [b[0] + (a[0] - b[0]) * k1, b[1] + (a[1] - b[1]) * k1];
    const p1: Pt = [b[0] + (c[0] - b[0]) * k2, b[1] + (c[1] - b[1]) * k2];
    d += `${i ? 'L' : 'M'}${fp(p0)} Q${fp(b)} ${fp(p1)} `;
  }
  return d + 'Z';
};
const rr = (x: number, y: number, w: number, h: number, r: number) => rp([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], r);
const ell = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f1(cx - rx)} ${f1(cy)} A${f1(rx)} ${f1(ry)} 0 1 0 ${f1(cx + rx)} ${f1(cy)} A${f1(rx)} ${f1(ry)} 0 1 0 ${f1(cx - rx)} ${f1(cy)} Z`;

/** a lit material, light upper left, the colour, shade toward violet lower right */
const grad = (id: string, c: string, dir: 'd' | 'v' | 'h' = 'd', k = 0.45) => (
  <linearGradient id={id} x1="0" y1="0" x2={dir === 'v' ? 0 : dir === 'h' ? 1 : 0.4} y2={dir === 'h' ? 0 : 1}>
    <stop offset="0%" stopColor={light(c, k)} /><stop offset="48%" stopColor={c} /><stop offset="100%" stopColor={shade(c, 0.36)} />
  </linearGradient>
);
/** a lit cylinder seen side on, shade, highlight a quarter in, the colour, shade */
const cyl = (id: string, c: string) => (
  <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stopColor={shade(c, 0.12)} /><stop offset="25%" stopColor={light(c, 0.5)} />
    <stop offset="62%" stopColor={c} /><stop offset="100%" stopColor={shade(c, 0.4)} />
  </linearGradient>
);
/** light and shade laid over a many-coloured form (stripes, checks, brick) so it reads as one lit volume */
const overlay = (id: string) => (
  <linearGradient id={id} x1="0" y1="0" x2="0.5" y2="1">
    <stop offset="0%" stopColor="#fff4dc" stopOpacity={0.42} /><stop offset="42%" stopColor="#fff4dc" stopOpacity={0} />
    <stop offset="62%" stopColor="#2b1d5e" stopOpacity={0} /><stop offset="100%" stopColor="#2b1d5e" stopOpacity={0.3} />
  </linearGradient>
);

/** The seamless join, every part's outline first, then every fill, so parts that touch show no seam. */
type Part = {d: string; c: string; fill?: string; t?: string};
const Pass: React.FC<{parts: Part[]; ow: number}> = ({parts, ow}) => <>
  {parts.map((q, i) => <path key={`o${i}`} d={q.d} transform={q.t} fill={line(q.c)} stroke={line(q.c)} strokeWidth={ow * 2}
    strokeLinejoin="round" />)}
  {parts.map((q, i) => <path key={`f${i}`} d={q.d} transform={q.t} fill={q.fill ?? q.c} />)}
</>;
/** a rounded bar drawn as a stroke with its own outline (pipes, posts, wires, rails) */
const Tube: React.FC<{d: string; c: string; w: number; ow: number; cap?: 'round' | 'butt'}> = ({d, c, w, ow, cap = 'round'}) => <>
  <path d={d} fill="none" stroke={line(c)} strokeWidth={w + ow * 2} strokeLinecap={cap} strokeLinejoin="round" />
  <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap={cap} strokeLinejoin="round" />
  <path d={d} fill="none" stroke={light(c, 0.55)} strokeWidth={w * 0.28} strokeLinecap={cap} strokeLinejoin="round" opacity={0.55}
    transform={`translate(${-w * 0.18} ${-w * 0.18})`} />
</>;
/** a soft white highlight along a lit edge */
const Sheen: React.FC<{d: string; w: number; op?: number}> = ({d, w, op = 0.38}) =>
  <path d={d} fill="none" stroke="#ffffff" strokeWidth={w} strokeLinecap="round" opacity={op} />;
/** a thin detail line in a colour's own deep hue (seams, ribs, siding) */
const det = (c: string, k = 0.32) => shade(c, k);

type GlassMode = 'day' | 'night' | 'dark';
/** Glass that reflects sky by day and glows warm by night, with a glint that sweeps across now and then. */
const Glass: React.FC<{b: [number, number, number, number]; d?: string; r?: number; frame: number; seed?: number;
  mode?: GlassMode; ow: number; edge?: string}> = ({b, d, r = 10, frame, seed = 1, mode = 'day', ow, edge = '#e6ebf5'}) => {
  const id = useUid();
  const [x, y, w, h] = b;
  const path = d ?? rr(x, y, w, h, r);
  const cols = mode === 'night' ? ['#fff4c8', '#ffc85a', '#ee8338'] : mode === 'dark' ? ['#5a5f86', '#363a5e', '#22243f']
    : ['#d4f0ff', '#62a0ea', '#2c3c8c'];
  const per = 5.2, t = ((frame / 30 + seed * 1.37) % per) / 1.3;
  const gx = (x - w * 0.22 - h * 0.5) + t * (w * 1.3 + h * 0.5);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0.3" y2="1"><stop offset="0%" stopColor={cols[0]} />
          <stop offset="55%" stopColor={cols[1]} /><stop offset="100%" stopColor={cols[2]} /></linearGradient>
        <clipPath id={`${id}c`}><path d={path} /></clipPath>
      </defs>
      <path d={path} fill={line(edge)} stroke={line(edge)} strokeWidth={ow * 1.5} strokeLinejoin="round" />
      <path d={path} fill={`url(#${id}g)`} />
      {mode !== 'dark' && <g clipPath={`url(#${id}c)`}>
        <path d={`M${x + w * 0.1} ${y + h} L${x + w * 0.24} ${y + h} L${x + w * 0.24 + h * 0.6} ${y} L${x + w * 0.1 + h * 0.6} ${y} Z`}
          fill="#ffffff" opacity={mode === 'day' ? 0.2 : 0.12} />
        {mode === 'day' && t < 1 && <path d={`M${gx} ${y + h} L${gx + w * 0.16} ${y + h} L${gx + w * 0.16 + h * 0.5} ${y} L${gx + h * 0.5} ${y} Z`}
          fill="#ffffff" opacity={0.42} />}
      </g>}
    </g>
  );
};

/** a glint that sweeps across any lit face now and then (a sign's reflective sheeting, a plate, a board) */
const Glint: React.FC<{b: [number, number, number, number]; d?: string; r?: number; frame: number; seed?: number; op?: number}> = ({b, d, r = 10, frame, seed = 1, op = 0.4}) => {
  const id = useUid();
  const [x, y, w, h] = b;
  const per = 5.2, t = ((frame / 30 + seed * 1.37) % per) / 1.3;
  if (t >= 1) return null;
  const gx = (x - w * 0.22 - h * 0.5) + t * (w * 1.3 + h * 0.5);
  return <g><defs><clipPath id={`${id}c`}><path d={d ?? rr(x, y, w, h, r)} /></clipPath></defs>
    <path clipPath={`url(#${id}c)`} d={`M${gx} ${y + h} L${gx + w * 0.16} ${y + h} L${gx + w * 0.16 + h * 0.5} ${y} L${gx + h * 0.5} ${y} Z`} fill="#ffffff" opacity={op} /></g>;
};

/** lettering that fits its box and never mirrors with `facing` */
const Words: React.FC<{x: number; y: number; s: string; size: number; avail: number; fill: string; facing?: number;
  font?: string; weight?: number; stroke?: string; sw?: number; op?: number; italic?: boolean}> = ({
  x, y, s, size, avail, fill, facing = 1, font = FONT.body, weight = 800, stroke, sw = 0, op = 1, italic = false,
}) => {
  const fs = Math.min(size, avail / widthOf(s, 1, true));
  return (
    <g transform={`translate(${x} ${y}) scale(${facing} 1)`} opacity={op}>
      <text x={0} y={fs * 0.36} textAnchor="middle" fontFamily={font} fontWeight={weight} fontSize={fs} fill={fill}
        fontStyle={italic ? 'italic' : undefined} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" paintOrder="stroke">{s}</text>
    </g>
  );
};

/** a tuft of grass at a base, swaying */
const Tuft: React.FC<{x: number; s: number; frame: number; seed: number; ow: number; c?: string}> = ({x, s, frame, seed, ow, c = '#5fae46'}) => {
  const sway = Math.sin(frame / 30 * TAU * 0.4 + seed) * 0.12;
  return <g transform={`translate(${x} 0)`}>
    {[-1, 0, 1].map((k, i) => {
      const lean = k * 0.5 + sway;
      const pts: Pt[] = [[k * s * 0.12, 2], [k * s * 0.2 + lean * s * 0.3, -s * 0.5], [k * s * 0.32 + lean * s * 0.8, -s * (0.9 + 0.15 * (1 - Math.abs(k)))]];
      return <path key={i} d={taper(pts, s * 0.22, s * 0.04)} fill={i === 1 ? light(c, 0.15) : c} stroke={line(c)} strokeWidth={ow * 1.2}
        strokeLinejoin="round" paintOrder="stroke" />;
    })}
  </g>;
};

/** a rust run from a seam, faint, only where `wear` asks for it */
const Rust: React.FC<{x: number; y: number; w: number; h: number; op: number}> = ({x, y, w, h, op}) =>
  op > 0.02 ? <path d={taper([[x, y], [x + w * 0.08, y + h * 0.6], [x + w * 0.02, y + h]], w, w * 0.25)} fill="#b85a2c" opacity={op} /> : null;

// ================================================================================== the striped A-frame

/** THE STRIPED A-FRAME, a nine metre triangle that is all roof, seen three-quarter so the orange and cream bands run down the slope */
export const StripedAFrameV2: React.FC<RoadV2 & {h?: number; bands?: number; low?: boolean}> = (p) => {
  const {frame = 0, seed = 31, wear = 0.3, closed = false, night = false, bands = 7, low = false} = p;
  const id = useUid(), ow = owOf(p);
  const H = 900, hw = H * (low ? 0.92 : 0.62);
  const OR = '#ff5a1f', CR = '#fffaf2';
  const dx = hw * 1.15, dy = -H * 0.1, ox = -dx / 2;
  const n = Math.max(6, bands * 2);
  const A: Pt = [ox, -H], E: Pt = [ox + hw, 0];
  const plane = rp([A, [A[0] + dx, A[1] + dy], [E[0] + dx, E[1] + dy], E], [60, 60, 30, 20]);
  const front = rp([A, E, [ox - hw, 0]], [70, 30, 30]);
  const mode: GlassMode = night ? (closed ? 'dark' : 'night') : 'day';
  const gh = H * 0.6, gw = hw * 0.56, gb = -H * 0.04;
  const inner = rp([[ox, -H + 90], [ox + hw - 64, -10], [ox - hw + 64, -10]], [40, 20, 20]);
  const topAt = (x: number) => -gh + (gh + gb) * Math.abs(x) / gw;
  return (
    <g transform={at(p)}>
      <defs>{overlay(`${id}o`)}{grad(`${id}w`, '#f7e8d0')}{grad(`${id}c`, '#d8d0c6', 'v')}{grad(`${id}f`, CR, 'd', 0.2)}
        <clipPath id={`${id}t`}><path d={plane} /></clipPath></defs>
      <ContactShadow x={ox + dx * 0.45} y={6} w={(low ? hw * 3.7 : hw * 2 + dx) * 1.15} opacity={0.32} />
      {low && <>
        <Pass ow={ow} parts={[{d: rr(ox - hw * 1.6, -H * 0.42, hw * 3.2 + dx, H * 0.42, 40), c: '#f7e8d0', fill: `url(#${id}w)`},
          {d: rr(ox - hw * 1.66, -H * 0.48, hw * 3.32 + dx, H * 0.08, 34), c: OR}]} />
        <Glass b={[ox - hw * 1.5, -H * 0.33, hw * 3 + dx, H * 0.2]} frame={frame} seed={seed + 3} mode={mode} ow={ow} />
      </>}
      {/* the long roof plane, banded ridge to eave */}
      <Pass ow={ow} parts={[{d: plane, c: OR, fill: CR}]} />
      <g clipPath={`url(#${id}t)`}>
        {Array.from({length: n}, (_, k) => {
          if (k % 2) return null;
          const t0 = k / n, t1 = (k + 1) / n;
          return <path key={k} fill={OR} d={`M${A[0] + dx * t0 - 40} ${A[1] + dy * t0 - 40} L${A[0] + dx * t1 - 40} ${A[1] + dy * t1 - 40}
            L${E[0] + dx * t1 + 40} ${E[1] + dy * t1 + 40} L${E[0] + dx * t0 + 40} ${E[1] + dy * t0 + 40} Z`} />;
        })}
        <path d={plane} fill={`url(#${id}o)`} />
        <path d={`M${A[0]} ${A[1]} L${E[0]} ${E[1]}`} stroke="#2b1d5e" strokeWidth={60} opacity={0.12} />
      </g>
      <Sheen d={`M${A[0] + dx * 0.15} ${A[1] + dy * 0.15 + 30} L${A[0] + dx * 0.85} ${A[1] + dy * 0.85 + 30}`} w={ow * 2} op={0.45} />
      {/* the gable end, an orange roof edge round a cream frame round the glass */}
      <Pass ow={ow} parts={[{d: front, c: OR}]} />
      <path d={inner} fill={`url(#${id}f)`} stroke={line(CR)} strokeWidth={ow * 1.2} strokeLinejoin="round" />
      <g transform={`translate(${ox} 0)`}>
        <Glass d={rp([[0, -gh], [gw, gb], [-gw, gb]], 24)} b={[-gw, -gh, gw * 2, gh + gb]} frame={frame} seed={seed} mode={mode} ow={ow} />
        {[-0.62, 0.62].map((u) => <path key={u} d={`M${u * gw} ${gb} L${u * gw} ${topAt(u * gw) + 14}`} stroke={CR} strokeWidth={ow * 1.6} strokeLinecap="round" />)}
        <path d={`M${-gw} ${-H * 0.26} L${gw} ${-H * 0.26}`} stroke={CR} strokeWidth={ow * 1.4} />
        <Pass ow={ow * 0.8} parts={[{d: rr(-58, -H * 0.25, 116, H * 0.25 + gb, 8), c: '#e9eef7'}]} />
        <Glass b={[-46, -H * 0.235, 92, H * 0.235 + gb - 6]} r={6} frame={frame} seed={seed + 1} mode={mode} ow={ow * 0.5} />
        <rect x={20} y={-H * 0.13} width={8} height={40} rx={4} fill="#b8c0d4" />
        {closed && [[-0.36, -0.26, -3], [0.06, -0.18, 4]].map(([u, v, r0], i) =>
          <Pass key={i} ow={ow} parts={[{d: rr(u * gw * 1.6, v * H - 60, gw * 0.9, 150, 14), c: '#d8ae6c', t: `rotate(${r0} 0 ${v * H})`}]} />)}
        <Sheen d={`M${-hw * 0.82} ${-H * 0.12} L${-hw * 0.2} ${-H * 0.8}`} w={ow * 2} op={0.4} />
      </g>
      <Pass ow={ow} parts={[{d: rr(ox - hw - 40, -40, hw * 2 + dx + 70, 46, 22), c: '#d8d0c6', fill: `url(#${id}c)`}]} />
      {wear > 0.4 && <Rust x={ox + hw + dx * 0.5} y={-H * 0.3} w={44} h={H * 0.22} op={wear * 0.35} />}
      {night && !closed && <Glow x={ox} y={-H * 0.24} r={hw * 0.9} color="#ffc76a" opacity={0.45 + Math.sin(frame / 9) * 0.04} />}
    </g>
  );
};

// ================================================================================== the mansard box

/** THE MANSARD BOX, the highway dairy bar, a cream box under a steep red mansard band, the town's living room */
export const MansardBoxV2: React.FC<RoadV2 & {h?: number; w?: number; roof?: string}> = (p) => {
  const {frame = 0, seed = 32, wear = 0.35, closed = false, night = false, h = 110, w = 300, roof = '#dc4330'} = p;
  const id = useUid(), ow = owOf(p);
  const H = 520, W = (w / h) * H;
  const wallC = '#fcefd8';
  const mans = rp([[-W / 2 - W * 0.04, -H * 0.66], [-W / 2 + W * 0.025, -H], [W / 2 - W * 0.025, -H], [W / 2 + W * 0.04, -H * 0.66]], [34, 44, 44, 34]);
  const mode: GlassMode = night ? (closed ? 'dark' : 'night') : 'day';
  const gx = -W * 0.4, gy = -H * 0.58, gw = W * 0.8, gh = H * 0.42;
  return (
    <g transform={at(p)}>
      <defs>{grad(`${id}w`, wallC)}{grad(`${id}r`, roof, 'v', 0.4)}</defs>
      <ContactShadow x={0} y={6} w={W * 1.3} opacity={0.32} />
      {night && !closed && <ellipse cx={0} cy={10} rx={W * 0.55} ry={60} fill="#ffcf7a" opacity={0.22} />}
      <Pass ow={ow} parts={[{d: rr(-W / 2, -H * 0.7, W, H * 0.7, 28), c: wallC, fill: `url(#${id}w)`},
        {d: mans, c: roof, fill: `url(#${id}r)`}]} />
      {Array.from({length: 13}, (_, i) => {
        const u = (i + 1) / 14;
        const xt = -W / 2 + W * 0.025 + (W * 0.95) * u, xb = -W / 2 - W * 0.04 + W * 1.08 * u;
        return <path key={i} d={`M${xt} ${-H + 20} L${xb} ${-H * 0.66 - 14}`} stroke={det(roof, 0.3)} strokeWidth={ow * 0.8} strokeLinecap="round" />;
      })}
      <Sheen d={`M${-W / 2 + W * 0.06} ${-H + 26} L${W * 0.3} ${-H + 26}`} w={ow * 2} />
      <Glass b={[gx, gy, gw, gh]} frame={frame} seed={seed} mode={mode} ow={ow} />
      {Array.from({length: 5}, (_, i) => <rect key={i} x={gx + (i + 1) * gw / 6 - 8} y={gy} width={16} height={gh} rx={8} fill="#eef2f9" />)}
      <rect x={-34} y={gy + gh * 0.45} width={10} height={70} rx={5} fill="#b8c0d4" />
      <Pass ow={ow} parts={[{d: rr(-W * 0.43, -H * 0.15, W * 0.86, H * 0.1, 14), c: '#e9d3ad'}]} />
      {closed && Array.from({length: 4}, (_, i) =>
        <Pass key={i} ow={ow} parts={[{d: rr(gx + i * gw / 4 + 10, gy + 6, gw / 4 - 20, gh - 12, 12), c: '#d4aa6a'}]} />)}
      {wear > 0.3 && <path d={rr(-W / 2 + 10, -H * 0.2, W - 20, H * 0.18, 20)} fill="#d6b07c" opacity={wear * 0.28} />}
      {night && !closed && <Glow x={0} y={gy + gh * 0.5} r={W * 0.45} color="#ffd27a" opacity={0.35} />}
    </g>
  );
};

// ================================================================================== the drive-in stalls

/** THE DRIVE-IN STALLS, a long canopy over a row of glowing menu posts, each with its red button */
export const DriveInStallsV2: React.FC<RoadV2 & {stalls?: number; span?: number; h?: number}> = (p) => {
  const {frame = 0, seed = 33, night = true, stalls = 5, span = 340, h = 90} = p;
  const id = useUid(), ow = owOf(p);
  const H = 310, S = (span / h) * H, pitch = S / stalls, t = frame / 30;
  const deck = '#22a99f', steel = '#cfd7e6';
  return (
    <g transform={at(p)}>
      <defs>{grad(`${id}d`, deck, 'v', 0.4)}{cyl(`${id}s`, steel)}
        <linearGradient id={`${id}l`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fff0c0" stopOpacity={0.42} />
          <stop offset="100%" stopColor="#fff0c0" stopOpacity={0} /></linearGradient></defs>
      <ContactShadow x={0} y={6} w={S * 1.15} opacity={0.3} />
      {night && <path d={`M${-S / 2} ${-H * 0.84} L${S / 2} ${-H * 0.84} L${S / 2 + 60} 10 L${-S / 2 - 60} 10 Z`} fill={`url(#${id}l)`} />}
      <Pass ow={ow} parts={Array.from({length: stalls + 1}, (_, i) => ({d: rr(-S / 2 + i * pitch - 12, -H * 0.9, 24, H * 0.9 + 4, 10),
        c: steel, fill: `url(#${id}s)`}))} />
      <Pass ow={ow} parts={[{d: rr(-S / 2 - 30, -H, S + 60, H * 0.16, H * 0.06), c: deck, fill: `url(#${id}d)`}]} />
      <rect x={-S / 2 - 14} y={-H + H * 0.05} width={S + 28} height={H * 0.035} rx={H * 0.017} fill="#fff6e4" />
      <Sheen d={`M${-S / 2} ${-H + 8} L${S * 0.2} ${-H + 8}`} w={ow * 1.6} />
      <rect x={-S / 2} y={-H * 0.85} width={S} height={14} rx={7} fill={night ? '#fff4cc' : shade(steel, 0.25)} />
      {Array.from({length: stalls}, (_, i) => {
        const px = -S / 2 + (i + 0.5) * pitch, top = -H * 0.6;
        const on = Math.sin(t * TAU * 0.7 + i * 1.9 + seed) > 0.35;
        const flick = night ? 0.92 + 0.08 * Math.sin(t * 9 + i * 3) : 1;
        const panel = night ? '#fff3c4' : '#f6eedc';
        return <g key={i}>
          <Pass ow={ow} parts={[{d: rr(px - 5, top, 10, -top, 5), c: '#9aa3b8'},
            {d: rr(px - 36, top - 80, 72, 82, 12), c: '#6a7390'},
            {d: rr(px - 30, top + 12, 60, 36, 10), c: '#c3cbdc'}]} />
          <rect x={px - 29} y={top - 74} width={58} height={70} rx={8} fill={panel} opacity={flick} />
          {Array.from({length: 5}, (_, k) => <rect key={k} x={px - 22} y={top - 64 + k * 12} width={20 + rnd(seed, i * 5 + k) * 22}
            height={5} rx={2.5} fill="#b0583c" opacity={0.75} />)}
          {Array.from({length: 3}, (_, k) => <rect key={`g${k}`} x={px - 24} y={top + 19 + k * 8} width={30} height={3.4} rx={1.7} fill="#5a6280" />)}
          <circle cx={px + 17} cy={top + 30} r={8} fill={on ? '#ff4a3d' : '#b8322c'} stroke={line('#d23a30')} strokeWidth={ow * 0.8} />
          {on && <Glow x={px + 17} y={top + 30} r={34} color="#ff6a50" opacity={0.6} />}
          {night && <Glow x={px} y={top - 40} r={110} color="#ffe6a0" opacity={0.42 * flick} />}
        </g>;
      })}
    </g>
  );
};

// ================================================================================== the dance hall

/** THE DANCE HALL, a long silver board hall whose shutters prop open, amber light and dancers inside at night */
export const DanceHallV2: React.FC<RoadV2 & {h?: number; w?: number; shutters?: number; open?: boolean}> = (p) => {
  const {frame = 0, seed = 34, wear = 0.45, closed = false, night = true, h = 160, w = 420, shutters = 7, open = true} = p;
  const id = useUid(), ow = owOf(p);
  const H = 850, W = (w / h) * H, t = frame / 30;
  const wood = '#d4bf9a', tin = '#a7b3cc', shut = '#bb8a55';
  const isOpen = open && !closed;
  const bandY = -H * 0.6, bandH = H * 0.32;
  const sw = (W * 0.92) / shutters;
  const roofD = rp([[-W / 2 - W * 0.03, -H * 0.64], [-W / 2 + W * 0.1, -H], [W / 2 - W * 0.1, -H], [W / 2 + W * 0.03, -H * 0.64]], [30, 50, 50, 30]);
  return (
    <g transform={at(p)}>
      <defs>{grad(`${id}w`, wood)}{grad(`${id}t`, tin, 'v', 0.5)}{grad(`${id}s`, shut, 'v')}
        <linearGradient id={`${id}a`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffe08a" /><stop offset="100%" stopColor="#ff9a3a" /></linearGradient>
        <clipPath id={`${id}b`}><path d={rr(-W / 2 + 20, bandY, W - 40, bandH, 16)} /></clipPath></defs>
      <ContactShadow x={0} y={6} w={W * 1.15} opacity={0.32} />
      {night && isOpen && Array.from({length: shutters}, (_, i) => {
        const sx = -W * 0.46 + i * sw;
        return <path key={`sp${i}`} fill="#ffc768" opacity={0.18} d={`M${sx + sw * 0.08} 0 L${sx + sw * 0.92} 0 L${sx + sw * 1.2} 90 L${sx - sw * 0.2} 90 Z`} />;
      })}
      <Pass ow={ow} parts={[{d: rr(-W / 2, -H * 0.68, W, H * 0.68, 30), c: wood, fill: `url(#${id}w)`},
        {d: roofD, c: tin, fill: `url(#${id}t)`}]} />
      {Array.from({length: 26}, (_, i) => <path key={i} d={`M${-W / 2 + (i + 1) * W / 27} ${-H * 0.62} L${-W / 2 + (i + 1) * W / 27} -16`}
        stroke={det(wood, 0.22)} strokeWidth={ow * 0.7} strokeLinecap="round" />)}
      {Array.from({length: 30}, (_, i) => {
        const u = (i + 1) / 31;
        return <path key={`r${i}`} d={`M${-W / 2 + W * 0.1 + W * 0.8 * u} ${-H + 16} L${-W / 2 - W * 0.03 + W * 1.06 * u} ${-H * 0.64 - 12}`}
          stroke={det(tin, 0.2)} strokeWidth={ow * 0.7} strokeLinecap="round" />;
      })}
      {wear > 0.3 && [0.22, 0.55, 0.8].map((u, i) => <Rust key={i} x={-W / 2 + W * u} y={-H * 0.96} w={W * 0.025} h={H * 0.28} op={wear * 0.4} />)}
      <Sheen d={`M${-W / 2 + W * 0.12} ${-H + 20} L${W * 0.2} ${-H + 20}`} w={ow * 2} />
      {/* the room inside, glowing, with couples circling the floor */}
      <path d={rr(-W / 2 + 20, bandY, W - 40, bandH, 16)} fill={night && isOpen ? `url(#${id}a)` : '#4a3c52'} stroke={line(wood)} strokeWidth={ow * 1.4} />
      {night && isOpen && <g clipPath={`url(#${id}b)`}>
        {Array.from({length: 9}, (_, i) => {
          const base = -W / 2 + (i + 0.5) * W / 9 + Math.sin(t * 0.9 + i * 2.1) * W * 0.035;
          const bob = Math.abs(Math.sin(t * TAU * 0.9 + i)) * 8, lean = Math.sin(t * TAU * 0.45 + i) * 6;
          return <g key={i} transform={`translate(${base} ${bandY + bandH + 8 - bob}) rotate(${lean}) scale(0.85)`} fill="#5a2350" opacity={0.86}>
            <path d={rr(-40, -150, 44, 160, 22)} /><circle cx={-18} cy={-176} r={22} />
            <path d={rr(2, -140, 40, 150, 20)} /><circle cx={22} cy={-164} r={20} />
          </g>;
        })}
      </g>}
      {Array.from({length: shutters}, (_, i) => {
        const sx = -W * 0.46 + i * sw;
        const droop = rnd(seed, i) * 10, swing = Math.sin(t * TAU * 0.3 + i * 1.3) * 4;
        const yb = -H * 0.5 + droop + swing;
        return isOpen ? <g key={i}>
          <Tube d={`M${sx + sw * 0.1} ${yb - 4} L${sx + sw * 0.2} ${bandY + bandH}`} c="#8a6a48" w={9} ow={ow * 0.7} />
          <Tube d={`M${sx + sw * 0.9} ${yb - 4} L${sx + sw * 0.8} ${bandY + bandH}`} c="#8a6a48" w={9} ow={ow * 0.7} />
          <Pass ow={ow} parts={[{d: rp([[sx + sw * 0.05, bandY], [sx + sw * 0.95, bandY], [sx + sw * 1.0, yb], [sx, yb]], 12), c: shut, fill: `url(#${id}s)`}]} />
          {[0.25, 0.5, 0.75].map((u) => <path key={u} d={`M${sx + sw * (0.05 + u * 0.9)} ${bandY + 10} L${sx + sw * u} ${yb - 10}`}
            stroke={det(shut, 0.3)} strokeWidth={ow * 0.6} strokeLinecap="round" />)}
          <Sheen d={`M${sx + sw * 0.1} ${bandY + 8} L${sx + sw * 0.6} ${bandY + 8}`} w={ow * 1.1} op={0.35} />
        </g> : <Pass key={i} ow={ow} parts={[{d: rr(sx + sw * 0.05, bandY, sw * 0.9, bandH, 12), c: shut, fill: `url(#${id}s)`}]} />;
      })}
      {night && isOpen && Array.from({length: 16}, (_, i) => {
        const bx = -W / 2 + (i + 0.5) * W / 16, on = Math.sin(t * 3 + i * 1.7) > -0.7;
        return <g key={`b${i}`}><circle cx={bx} cy={-H * 0.66 + 26} r={12} fill={on ? '#fff1b0' : '#d9b46a'} />
          {on && <Glow x={bx} y={-H * 0.66 + 26} r={50} color="#ffd27a" opacity={0.5} />}</g>;
      })}
      <Pass ow={ow} parts={[{d: rr(-W * 0.06, -H * 0.25, W * 0.12, H * 0.25 + 2, 14), c: '#7c4f36'}]} />
      <path d={`M0 ${-H * 0.24} L0 -4`} stroke={line('#7c4f36')} strokeWidth={ow * 0.8} />
      <circle cx={0} cy={-H * 0.27} r={12} fill={night ? '#fff0b0' : '#f4e2b0'} stroke={line('#f4d88a')} strokeWidth={ow * 0.6} />
      {night && <Glow x={0} y={-H * 0.27} r={90} color="#ffd27a" opacity={0.6} />}
    </g>
  );
};

// ================================================================================== the icehouse

/** THE ICEHOUSE, whitewashed block with its roll-up doors rolled all the way up, a rust awning, picnic tables, a tub of ice */
export const IcehouseV2: React.FC<RoadV2 & {h?: number; w?: number; doors?: number; tables?: number}> = (p) => {
  const {frame = 0, seed = 35, wear = 0.5, closed = false, night = false, h = 100, w = 300, doors = 3, tables = 3} = p;
  const id = useUid(), ow = owOf(p);
  const H = 440, W = (w / h) * H, t = frame / 30;
  const block = '#f4ead2', aqua = '#25b5a5', awn = '#d6643a', wood = '#c9894a', pipe = '#98a2b8';
  const dw = (W * 0.8) / doors;
  const posts = [-0.58, -0.2, 0.2, 0.58].map((u) => u * W);
  return (
    <g transform={at(p)}>
      <defs>{grad(`${id}b`, block)}{grad(`${id}a`, awn, 'v', 0.4)}{grad(`${id}q`, aqua, 'v')}{cyl(`${id}p`, pipe)}{grad(`${id}g`, '#c9ccd8', 'd')}</defs>
      <Pass ow={ow} parts={[{d: rr(-W * 0.66, -12, W * 1.32, 34, 16), c: '#c9c2b4'}]} />
      <ContactShadow x={0} y={4} w={W * 1.3} opacity={0.3} />
      <Pass ow={ow} parts={[{d: rr(-W / 2, -H * 0.64, W, H * 0.64, 24), c: block, fill: `url(#${id}b)`}]} />
      {Array.from({length: 6}, (_, i) => <path key={i} d={`M${-W / 2 + 14} ${-H * 0.1 * (i + 1)} L${W / 2 - 14} ${-H * 0.1 * (i + 1)}`}
        stroke={det(block, 0.12)} strokeWidth={ow * 0.6} />)}
      {Array.from({length: doors}, (_, i) => {
        const dx = -W * 0.4 + i * dw;
        return closed ? <g key={i}>
          <Pass ow={ow} parts={[{d: rr(dx + dw * 0.06, -H * 0.56, dw * 0.88, H * 0.56, 10), c: aqua, fill: `url(#${id}q)`}]} />
          {Array.from({length: 7}, (_, k) => <path key={k} d={`M${dx + dw * 0.1} ${-H * 0.5 + k * H * 0.072} L${dx + dw * 0.9} ${-H * 0.5 + k * H * 0.072}`}
            stroke={det(aqua, 0.3)} strokeWidth={ow * 0.7} strokeLinecap="round" />)}
          <rect x={dx + dw * 0.46} y={-H * 0.08} width={dw * 0.08} height={22} rx={6} fill="#5a5f74" />
        </g> : <g key={i}>
          <Pass ow={ow} parts={[{d: rr(dx + dw * 0.06, -H * 0.56, dw * 0.88, H * 0.56, 10), c: night ? '#ffc85a' : '#463a5a'}]} />
          {!night && <rect x={dx + dw * 0.14} y={-H * 0.4} width={dw * 0.72} height={H * 0.24} rx={10} fill="#5e4f75" />}
          {!night && Array.from({length: 4}, (_, k) => <rect key={k} x={dx + dw * (0.18 + k * 0.17)} y={-H * 0.37} width={dw * 0.1}
            height={H * 0.18} rx={6} fill={['#ff7a5a', '#ffd04a', '#5ad1c2', '#ff9ad0'][(k + i) % 4]} opacity={0.75} />)}
          <Pass ow={ow} parts={[{d: rr(dx + dw * 0.02, -H * 0.62, dw * 0.96, H * 0.08, H * 0.04), c: aqua, fill: `url(#${id}q)`}]} />
        </g>;
      })}
      {night && !closed && <Glow x={0} y={-H * 0.3} r={W * 0.5} color="#ffc76a" opacity={0.35} />}
      {posts.map((x, i) => <Tube key={i} d={`M${x} ${-H * 0.66} L${x} 0`} c={pipe} w={16} ow={ow} />)}
      <Pass ow={ow} parts={[{d: rr(-W * 0.64, -H * 0.72, W * 1.28, H * 0.075, H * 0.035), c: awn, fill: `url(#${id}a)`}]} />
      {Array.from({length: 40}, (_, i) => <path key={i} d={`M${-W * 0.62 + (i + 0.5) * W * 1.24 / 40} ${-H * 0.71} L${-W * 0.62 + (i + 0.5) * W * 1.24 / 40} ${-H * 0.655}`}
        stroke={det(awn, 0.25)} strokeWidth={ow * 0.6} strokeLinecap="round" />)}
      <Sheen d={`M${-W * 0.6} ${-H * 0.715} L${W * 0.1} ${-H * 0.715}`} w={ow * 1.4} />
      {/* the ICE sign stands on the awning */}
      <Tube d={`M${-W * 0.12} ${-H * 0.72} L${-W * 0.12} ${-H * 0.82} M${W * 0.12} ${-H * 0.72} L${W * 0.12} ${-H * 0.82}`} c={pipe} w={10} ow={ow * 0.8} />
      <Pass ow={ow} parts={[{d: rr(-W * 0.17, -H * 1.06, W * 0.34, H * 0.27, 26), c: '#1f7fb8'}]} />
      <rect x={-W * 0.17 + 16} y={-H * 1.06 + 16} width={W * 0.34 - 32} height={H * 0.27 - 32} rx={16} fill="none" stroke="#e8f6ff" strokeWidth={ow * 0.9} />
      <Words x={0} y={-H * 0.925} s="ICE" size={H * 0.19} avail={W * 0.28} fill="#ffffff" font={FONT.display} weight={900} facing={p.facing ?? 1} />
      {/* string lights under the awning, swaying */}
      {[0, 1, 2].map((k) => {
        const x0 = posts[k], x1 = posts[k + 1], sag = 34 + Math.sin(t * TAU * 0.35 + k) * 8;
        const yy = -H * 0.64;
        return <g key={k}><path d={`M${x0} ${yy} Q${(x0 + x1) / 2} ${yy + sag * 2} ${x1} ${yy}`} fill="none" stroke="#4a4560" strokeWidth={ow * 0.6} />
          {[0.2, 0.4, 0.6, 0.8].map((u) => {
            const bx = x0 + (x1 - x0) * u, by = yy + sag * 2 * 2 * u * (1 - u) + 10;
            return <g key={u}><circle cx={bx} cy={by} r={9} fill={night ? '#fff0b0' : '#ffe9c4'} stroke={line('#ffd88a')} strokeWidth={ow * 0.5} />
              {night && <Glow x={bx} y={by} r={40} color="#ffd27a" opacity={0.55} />}</g>;
          })}</g>;
      })}
      {!closed && Array.from({length: tables}, (_, i) => {
        const tx = -W * 0.4 + i * W * 0.4;
        return <g key={i} transform={`translate(${tx} 0)`}>
          <ContactShadow x={0} y={4} w={200} opacity={0.25} />
          <Tube d="M-58 -2 L-36 -74 M58 -2 L36 -74 M-40 -2 L-58 -74 M40 -2 L58 -74" c={shade(wood, 0.15)} w={9} ow={ow * 0.7} />
          <Pass ow={ow} parts={[{d: rr(-92, -84, 184, 16, 8), c: wood}, {d: rr(-104, -42, 208, 12, 6), c: shade(wood, 0.08)}]} />
        </g>;
      })}
      {!closed && <g transform={`translate(${W * 0.5} 0)`}>
        <ContactShadow x={0} y={4} w={180} opacity={0.28} />
        {[-36, -14, 10, 32].map((x, k) => <Pass key={k} ow={ow * 0.7} parts={[{d: rp([[x - 7, -60], [x - 7, -96 - (k % 2) * 10], [x - 3, -110 - (k % 2) * 10],
          [x + 3, -110 - (k % 2) * 10], [x + 7, -96 - (k % 2) * 10], [x + 7, -60]], 4), c: '#9a5226'}]} />)}
        <path d={ell(0, -64, 66, 14)} fill="#f2fbff" stroke={line('#dfe8f2')} strokeWidth={ow * 0.6} />
        <Pass ow={ow} parts={[{d: rp([[-70, -64], [70, -64], [60, 2], [-60, 2]], [16, 16, 12, 12]), c: '#c4cad8', fill: `url(#${id}g)`}]} />
        {[-40, -14, 12, 38].map((x) => <path key={x} d={`M${x} -54 L${x * 0.9} -8`} stroke={det('#c4cad8', 0.25)} strokeWidth={ow * 0.6} strokeLinecap="round" />)}
      </g>}
      {wear > 0.3 && <Rust x={W * 0.3} y={-H * 0.66} w={34} h={H * 0.18} op={wear * 0.35} />}
    </g>
  );
};

// ================================================================================== the cotton gin

/** THE COTTON GIN, a stepped metal shed with a row of cyclones on top and the suction boom out over the yard */
export const CottonGinV2: React.FC<RoadV2 & {h?: number; w?: number; cyclones?: number; running?: boolean}> = (p) => {
  const {frame = 0, seed = 36, wear = 0.45, night = false, h = 150, w = 380, cyclones = 6, running = false} = p;
  const id = useUid(), ow = owOf(p);
  const H = 1200, W = (w / h) * H, t = frame / 30;
  const steel = '#b6c3d8', cyc = '#dfe6f0', pipe = '#9aa7bf';
  const sheds: [number, number, number, string][] = [[-0.5, 0.34, 0.62, steel], [-0.16, 0.42, 1.0, light(steel, 0.12)], [0.26, 0.24, 0.78, steel]];
  const cx = (i: number) => -W * 0.3 + i * W * 0.115;
  const chh = (i: number) => H * (0.24 + rnd(seed, i) * 0.1);
  return (
    <g transform={at(p)}>
      <defs>{sheds.map((s, i) => <React.Fragment key={i}>{grad(`${id}s${i}`, s[3], 'd', 0.4)}</React.Fragment>)}{cyl(`${id}c`, cyc)}</defs>
      <ContactShadow x={-W * 0.06} y={8} w={W * 1.3} opacity={0.3} />
      {/* the boom and the pipes behind the cyclones */}
      <Tube d={`M${-W * 0.4} ${-H * 0.52} Q${-W * 0.56} ${-H * 0.55} ${-W * 0.6} ${-H * 0.18}`} c={pipe} w={H * 0.035} ow={ow} />
      {Array.from({length: cyclones - 1}, (_, i) => <Tube key={i} d={`M${cx(i)} ${-H - chh(i) * 0.7} Q${(cx(i) + cx(i + 1)) / 2} ${-H - chh(i) * 0.7 - H * 0.09} ${cx(i + 1)} ${-H - chh(i + 1) * 0.7}`}
        c={pipe} w={H * 0.026} ow={ow} />)}
      {Array.from({length: cyclones}, (_, i) => {
        const x = cx(i), roofY = x < -W * 0.16 ? -H * 0.62 : x > W * 0.26 ? -H * 0.78 : -H;
        return roofY > -H ? <Tube key={`l${i}`} d={`M${x - 30} ${-H - 20} L${x - 30} ${roofY} M${x + 30} ${-H - 20} L${x + 30} ${roofY}`} c={pipe} w={14} ow={ow * 0.8} /> : null;
      })}
      <Pass ow={ow} parts={[{d: rr(cx(0) - H * 0.07, -H - 36, cx(cyclones - 1) - cx(0) + H * 0.14, 30, 15), c: shade(pipe, 0.1)}]} />
      {Array.from({length: cyclones}, (_, i) => {
        const r = H * 0.052, top = -H - 30 - chh(i), x = cx(i);
        return <g key={i}>
          <Pass ow={ow} parts={[{d: rp([[x - r, top + 10], [x + r, top + 10], [x + r, -H - 70], [x + 12, -H - 26], [x - 12, -H - 26], [x - r, -H - 70]], [14, 14, 18, 8, 8, 18]),
            c: cyc, fill: `url(#${id}c)`}, {d: ell(x, top + 10, r, r * 0.32), c: cyc}]} />
          <path d={`M${x - r + 8} ${-H - 72} L${x + r - 8} ${-H - 72}`} stroke={det(cyc, 0.25)} strokeWidth={ow * 0.7} strokeLinecap="round" />
          {wear > 0.3 && <Rust x={x + r * 0.4} y={top + 30} w={r * 0.4} h={chh(i) * 0.5} op={wear * 0.3} />}
        </g>;
      })}
      <Pass ow={ow} parts={sheds.map(([fx, ww, hh, c], i) => ({d: rr(W * fx, -H * hh, W * ww, H * hh, 28), c, fill: `url(#${id}s${i})`}))} />
      {sheds.map(([fx, ww, hh, c], i) => <g key={i}>
        {Array.from({length: Math.round(ww * 40)}, (_, k) => <path key={k} d={`M${W * fx + (k + 0.5) * W * ww / Math.round(ww * 40)} ${-H * hh + 26} L${W * fx + (k + 0.5) * W * ww / Math.round(ww * 40)} -18`}
          stroke={det(c, 0.16)} strokeWidth={ow * 0.6} strokeLinecap="round" />)}
        <path d={rr(W * fx + 10, -H * hh + 10, W * ww - 20, H * 0.05, 16)} fill={shade(c, 0.18)} opacity={0.7} />
        <Sheen d={`M${W * fx + 40} ${-H * hh + 40} L${W * fx + 40} ${-H * hh * 0.4}`} w={ow * 1.6} op={0.3} />
      </g>)}
      <Pass ow={ow} parts={[{d: rr(-W * 0.12, -H * 0.5, W * 0.18, H * 0.5 + 2, 24), c: '#46405e'}]} />
      <Pass ow={ow} parts={[{d: rr(W * 0.3, -H * 0.42, W * 0.14, H * 0.42 + 2, 18), c: '#d3dae8'}]} />
      {Array.from({length: 6}, (_, k) => <path key={k} d={`M${W * 0.3 + 12} ${-H * 0.36 + k * H * 0.06} L${W * 0.44 - 12} ${-H * 0.36 + k * H * 0.06}`}
        stroke={det('#d3dae8', 0.3)} strokeWidth={ow * 0.6} strokeLinecap="round" />)}
      {wear > 0.3 && [-0.4, -0.05, 0.3].map((u, i) => <Rust key={i} x={W * u} y={-H * 0.55} w={50} h={H * 0.36} op={wear * 0.3} />)}
      {running && night && [-0.3, 0, 0.3].map((u, i) => <g key={i}>
        <path d={`M${W * u} ${-H * 0.86} l${-W * 0.14} ${H * 0.86} l${W * 0.28} 0 Z`} fill="#fff2cc" opacity={0.12} />
        <circle cx={W * u} cy={-H * 0.86} r={22} fill="#fff6dc" /><Glow x={W * u} y={-H * 0.86} r={140} color="#fff0c0" opacity={0.6} />
      </g>)}
      {/* lint in the air, a few wisps always, puffs off every cyclone while it runs */}
      {Array.from({length: running ? 26 : 8}, (_, i) => {
        const k = i % cyclones, life = ((t * (running ? 0.35 : 0.12) + rnd(seed, 200 + i)) % 1);
        const x0 = running ? cx(k) : (rnd(seed, 300 + i) - 0.5) * W * 1.1, y0 = running ? -H - 40 - chh(k) : -H * (0.2 + rnd(seed, 400 + i) * 0.6);
        const x = x0 + life * W * 0.12 + Math.sin(life * 6 + i) * 30, y = y0 - life * H * (running ? 0.35 : 0.1);
        const r = (running ? 26 : 14) * (0.6 + life);
        return <circle key={i} cx={x} cy={y} r={r} fill="#fffaf0" opacity={(1 - life) * (running ? 0.75 : 0.6)} stroke={line('#fffaf0')}
          strokeWidth={ow * 0.4} strokeOpacity={0.3} />;
      })}
    </g>
  );
};

// ================================================================================== the module yard

/** THE MODULE YARD, rows of tarped cotton modules in saturated yellow, lint caught in the fence wire in front */
export const ModuleYardV2: React.FC<RoadV2 & {w?: number; depth?: number; rows?: number; lint?: boolean; tarp?: string}> = (p) => {
  const {x = 0, y = 0, scale = 1, frame = 0, seed = 37, wear = 0.3, w = 900, depth = 220, rows = 4, lint = true, tarp = '#ffc21f'} = p;
  const id = useUid(), t = frame / 30;
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>{Array.from({length: rows}, (_, r) => {
        const v = r / Math.max(1, rows - 1), c = mix(tarp, '#cfdcff', (1 - v) * 0.32);
        return <React.Fragment key={r}>{grad(`${id}t${r}`, c, 'v', 0.42)}</React.Fragment>;
      })}</defs>
      {Array.from({length: rows}, (_, r) => {
        const v = r / Math.max(1, rows - 1);
        const ry = Math.pow(v, 1.4) * depth;
        const s = scale * CM * (0.45 + v * 0.85), ow = 3.4 / s;
        const per = Math.round(3 + v * 3);
        const c = mix(tarp, '#cfdcff', (1 - v) * 0.32);
        return <g key={r} transform={`translate(0 ${ry}) scale(${s})`}>
          {Array.from({length: per}, (_, i) => {
            const px = ((i / Math.max(1, per - 1)) - 0.5) * (w / s);
            const sd = seed + r * 41 + i;
            const body = `M-480 0 L-480 -170 Q-480 -240 -380 -244 L380 -244 Q480 -240 480 -170 L480 0 Z`;
            const hem = Array.from({length: 11}, (_, k) => {
              const hx = 492 - k * 98.4, hy = -92 + (k % 2 ? 12 : 0) + Math.sin(t * TAU * 0.9 + sd + k * 0.8) * 7;
              return k ? `Q${hx + 49} ${hy + (k % 2 ? 10 : -10)} ${hx} ${hy}` : `L${hx} ${hy}`;
            }).join(' ');
            const tarpD = `M-492 -92 L-492 -172 Q-492 -254 -382 -258 L382 -258 Q492 -254 492 -172 ${hem} Z`;
            return <g key={i} transform={`translate(${px} 0)`}>
              <ContactShadow x={0} y={6} w={1080} opacity={0.3} />
              <Pass ow={ow} parts={[{d: body, c: '#fbf3e2'}]} />
              {[-300, -60, 200, 380].map((bx, k) => <path key={k} d={`M${bx} -30 q40 -24 80 0`} fill="none" stroke="#d9cfbf" strokeWidth={ow * 0.8} strokeLinecap="round" />)}
              <path d={tarpD} fill={`url(#${id}t${r})`} stroke={line(c)} strokeWidth={ow * 1.6} strokeLinejoin="round" />
              <path d="M300 -96 L300 -250 Q440 -248 484 -172 L484 -96 Z" fill={shade(c, 0.22)} opacity={0.5} />
              {[-340, -170, 0, 170, 340].map((sx) => <path key={sx} d={`M${sx} -96 L${sx} -252`} stroke={shade(c, 0.35)} strokeWidth={ow * 1.1} strokeLinecap="round" />)}
              <Sheen d="M-420 -236 L240 -236" w={ow * 1.8} />
              {wear > 0.3 && <path d={ell((rnd(sd, 1) - 0.5) * 500, -238, 70, 22)} fill="#fffaf0" opacity={0.85} stroke={line('#fffaf0')} strokeWidth={ow * 0.6} />}
            </g>;
          })}
        </g>;
      })}
      {lint && <g>
        <path d={`M${-w / 2 - 20} ${depth + 14} L${w / 2 + 20} ${depth + 14}`} stroke="#8c8698" strokeWidth={2.4} />
        {[-0.5, -0.17, 0.17, 0.5].map((u) => <Tube key={u} d={`M${u * w} ${depth + 30} L${u * w} ${depth - 2}`} c="#a07850" w={6} ow={1.6} />)}
        {Array.from({length: 46}, (_, i) => {
          const jig = Math.sin(t * TAU * 0.6 + i) * 1.5;
          return <ellipse key={i} cx={(rnd(seed, 700 + i) - 0.5) * w + jig} cy={depth * (0.98 + rnd(seed, 800 + i) * 0.14)}
            rx={4 + rnd(seed, 900 + i) * 7} ry={3 + rnd(seed, 950 + i) * 4} fill="#fbf6ea" stroke="#c9bfae" strokeWidth={1}
            opacity={0.7 + rnd(seed, 990 + i) * 0.3} />;
        })}
      </g>}
    </g>
  );
};

// ================================================================================== the feed store

/** THE FEED STORE, a metal gable shed on a truck-height dock, a red checkerboard, stacked sacks, FEED on the gable */
export const FeedStoreV2: React.FC<RoadV2 & {h?: number; w?: number; checker?: boolean; chicks?: boolean}> = (p) => {
  const {frame = 0, seed = 38, wear = 0.4, closed = false, h = 130, w = 300, checker = true, chicks = false} = p;
  const id = useUid(), ow = owOf(p), fc = p.facing ?? 1;
  const H = 650, W = (w / h) * H, dockH = H * 0.16, t = frame / 30;
  const metal = '#f2e2bf', red = '#e03a2e', roof = '#8fa3c4';
  const gable = rp([[-W / 2 - W * 0.02, -H * 0.7], [0, -H], [W / 2 + W * 0.02, -H * 0.7]], [20, 50, 20]);
  const vane = Math.sin(t * TAU * 0.18 + seed) * 35;
  return (
    <g transform={at(p)}>
      <defs>{grad(`${id}m`, metal)}{grad(`${id}d`, '#cbc4b6', 'v')}{grad(`${id}r`, red, 'v', 0.4)}{overlay(`${id}o`)}</defs>
      <ContactShadow x={0} y={6} w={W * 1.3} opacity={0.32} />
      {/* the weathervane on the ridge */}
      <g transform={`translate(0 ${-H - 10})`}>
        <Tube d="M0 0 L0 -110" c="#5a5470" w={10} ow={ow * 0.7} />
        <g transform={`translate(0 -96) scale(${Math.cos(vane * Math.PI / 180)} 1)`}>
          <Pass ow={ow * 0.8} parts={[{d: rp([[-70, -6], [44, -6], [44, -22], [80, 0], [44, 22], [44, 6], [-70, 6]], 6), c: '#5a5470'},
            {d: rp([[-86, -24], [-56, -6], [-56, 6], [-86, 24], [-70, 0]], 6), c: '#5a5470'}]} />
        </g>
      </g>
      <Pass ow={ow} parts={[{d: rr(-W / 2, -H * 0.72, W, H * 0.72 - dockH + 4, 24), c: metal, fill: `url(#${id}m)`}, {d: gable, c: metal, fill: `url(#${id}m)`}]} />
      <path d={`M${-W / 2 - W * 0.04} ${-H * 0.69} L0 ${-H - 18} L${W / 2 + W * 0.04} ${-H * 0.69}`} fill="none" stroke={line(red)} strokeWidth={46 + ow * 2}
        strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${-W / 2 - W * 0.04} ${-H * 0.69} L0 ${-H - 18} L${W / 2 + W * 0.04} ${-H * 0.69}`} fill="none" stroke={red} strokeWidth={46}
        strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${-W / 2 - W * 0.02} ${-H * 0.7} L${-W * 0.1} ${-H * 0.97}`} stroke="#ffffff" strokeWidth={10} strokeLinecap="round" opacity={0.45} />
      {Array.from({length: 34}, (_, i) => {
        const xx = -W / 2 + (i + 0.5) * W / 34, top = Math.max(-H * 0.68, -H + 50 + Math.abs(xx) * (H * 0.3) / (W * 0.52));
        return <path key={i} d={`M${xx} ${top} L${xx} ${-dockH - 10}`} stroke={det(metal, 0.12)} strokeWidth={ow * 0.6} strokeLinecap="round" />;
      })}
      <Words x={0} y={-H * 0.845} s="FEED" size={H * 0.165} avail={W * 0.34} fill={shade(red, 0.15)} font={FONT.display} weight={900} facing={fc} />
      {/* the awning over the dock and its posts */}
      {[-0.54, -0.18, 0.18, 0.54].map((u) => <Tube key={u} d={`M${u * W} ${-H * 0.72} L${u * W} ${-dockH}`} c="#8f98b0" w={12} ow={ow * 0.8} />)}
      <Pass ow={ow} parts={[{d: rr(-W * 0.59, -H * 0.765, W * 1.18, H * 0.045, H * 0.022), c: roof}]} />
      {/* roll-up door */}
      <Pass ow={ow} parts={[{d: rr(-W * 0.1, -H * 0.64, W * 0.3, H * 0.48, 16), c: closed ? '#b8bfd2' : '#4a3f5e'}]} />
      {closed ? Array.from({length: 7}, (_, k) => <path key={k} d={`M${-W * 0.08} ${-H * 0.6 + k * H * 0.062} L${W * 0.18} ${-H * 0.6 + k * H * 0.062}`}
        stroke={det('#b8bfd2', 0.3)} strokeWidth={ow * 0.7} strokeLinecap="round" />)
        : [[-0.06, '#e8c66a'], [0.04, '#d9b25a'], [-0.01, '#f0d27c']].map(([u, c], k) =>
          <Pass key={k} ow={ow * 0.8} parts={[{d: rr(W * (u as number), -dockH - 60 - Math.floor(k / 2) * 56, W * 0.1, 56, 14), c: c as string}]} />)}
      {/* the dock */}
      <Pass ow={ow} parts={[{d: rr(-W * 0.57, -dockH, W * 1.14, dockH + 4, 18), c: '#cbc4b6', fill: `url(#${id}d)`}]} />
      <Sheen d={`M${-W * 0.54} ${-dockH + 10} L${W * 0.3} ${-dockH + 10}`} w={ow * 1.2} />
      {checker && <g>
        <Pass ow={ow} parts={[{d: rr(-W * 0.47, -H * 0.665, W * 0.31, H * 0.215, 18), c: '#fff8ee'}]} />
        {Array.from({length: 24}, (_, i) => {
          const cx2 = i % 6, cy2 = Math.floor(i / 6), sq = W * 0.046;
          return (cx2 + cy2) % 2 ? null : <rect key={i} x={-W * 0.455 + cx2 * sq} y={-H * 0.652 + cy2 * sq} width={sq} height={sq} rx={sq * 0.18} fill={red} />;
        })}
        <path d={rr(-W * 0.47, -H * 0.665, W * 0.31, H * 0.215, 18)} fill={`url(#${id}o)`} />
      </g>}
      {!closed && Array.from({length: 7}, (_, i) => {
        const row = i < 4 ? 0 : 1, col = row ? i - 4 + 0.5 : i;
        const sx = W * 0.24 + col * W * 0.062, sy = -dockH - row * 52;
        const c = i % 3 ? '#e2c38a' : '#f6f0e2';
        return <g key={i}>
          <Pass ow={ow * 0.8} parts={[{d: rp([[sx - W * 0.03, sy], [sx - W * 0.032, sy - 54], [sx + W * 0.032, sy - 56], [sx + W * 0.03, sy]], 18), c}]} />
          <rect x={sx - W * 0.022} y={sy - 36} width={W * 0.044} height={12} rx={6} fill={i % 2 ? '#3f8a4a' : red} />
        </g>;
      })}
      {chicks && <g transform={`translate(${-W * 0.38} ${-dockH})`}>
        <Tube d="M0 -180 L0 -96" c="#4a4058" w={5} ow={ow * 0.5} />
        <Pass ow={ow * 0.8} parts={[{d: rp([[-26, -96], [26, -96], [16, -70], [-16, -70]], 8), c: '#e0402e'}]} />
        <Glow x={0} y={-60} r={110} color="#ff9a5a" opacity={0.4 + Math.sin(t * 2.2) * 0.08} />
        <Pass ow={ow} parts={[{d: rr(-70, -40, 140, 40, 20), c: '#b9c0d0'}]} />
        {Array.from({length: 6}, (_, i) => {
          const bob = Math.abs(Math.sin(t * TAU * 1.4 + i * 1.1)) * 6;
          return <g key={i} transform={`translate(${-50 + i * 20} ${-40 - bob})`}>
            <circle r={10} fill="#ffd84a" stroke={line('#ffd84a')} strokeWidth={ow * 0.5} /><circle cx={3} cy={-3} r={1.8} fill="#2b2040" />
            <path d="M8 -1 l5 2 l-5 2 Z" fill="#ff8a3a" /></g>;
        })}
      </g>}
      {wear > 0.3 && <path d={rr(-W / 2 + 10, -H * 0.36, W - 20, H * 0.18, 20)} fill="#d8b884" opacity={wear * 0.22} />}
    </g>
  );
};

// ================================================================================== the historical marker

/** THE HISTORICAL MARKER, the dark plate with the raised border and the star, on its post */
export const HistoricalMarkerV2: React.FC<RoadV2 & {h?: number; lines?: number; raked?: number}> = (p) => {
  const {frame = 0, seed = 39, wear = 0.4, lines = 11, raked = 0.5} = p;
  const id = useUid(), ow = owOf(p);
  const H = 115, plateH = H * 0.62, plateW = plateH * 0.66, py = -H * 0.4 - plateH;
  const alu = '#d2d8e4', plate = '#2c3550';
  const star = Array.from({length: 10}, (_, i) => {
    const a = (i / 10) * TAU - Math.PI / 2, r = i % 2 ? plateW * 0.04 : plateW * 0.095;
    return [Math.cos(a) * r, py + plateH * 0.14 + Math.sin(a) * r] as Pt;
  });
  return (
    <g transform={at(p)}>
      <defs>{cyl(`${id}a`, alu)}<linearGradient id={`${id}p`} x1="0" y1="0" x2="0.4" y2="1"><stop offset="0%" stopColor={light(plate, 0.18)} />
        <stop offset="100%" stopColor={shade(plate, 0.3)} /></linearGradient></defs>
      <ContactShadow x={0} y={2} w={plateW * 1.6} opacity={0.32} />
      <Pass ow={ow} parts={[{d: rr(-2.2, -H * 0.42, 4.4, H * 0.42 + 1, 2), c: alu, fill: `url(#${id}a)`}]} />
      <Pass ow={ow} parts={[{d: rr(-plateW / 2, py, plateW, plateH, 4), c: plate, fill: `url(#${id}p)`}]} />
      {wear > 0.2 && <path d={rr(-plateW / 2 + 1, py + 1, plateW - 2, plateH * 0.5, 4)} fill="#8a92a8" opacity={wear * 0.18} />}
      <path d={rr(-plateW / 2 + 2.2, py + 2.2, plateW - 4.4, plateH - 4.4, 2.6)} fill="none" stroke={alu} strokeWidth={1.4} />
      <path d={rp(star, 0.6)} fill={alu} stroke={light(alu, 0.3)} strokeWidth={0.4} />
      <rect x={-plateW * 0.32} y={py + plateH * 0.26} width={plateW * 0.64} height={plateH * 0.04} rx={plateH * 0.02} fill={light(alu, 0.3)} />
      {Array.from({length: lines}, (_, i) => <rect key={i} x={-plateW * 0.38} y={py + plateH * 0.36 + i * plateH * 0.052}
        width={plateW * (0.6 + rnd(seed, i) * 0.16)} height={plateH * 0.02} rx={plateH * 0.01} fill={alu} opacity={0.68 + raked * 0.25} />)}
      <Glint b={[-plateW / 2, py, plateW, plateH]} r={4} frame={frame} seed={seed} op={0.3} />
      <Sheen d={`M${-plateW / 2 + 3} ${py + 4} L${-plateW / 2 + 3} ${py + plateH * 0.5}`} w={ow * 0.8} op={0.3} />
      <Tuft x={-6} s={12} frame={frame} seed={seed} ow={ow * 0.6} /><Tuft x={7} s={9} frame={frame} seed={seed + 2} ow={ow * 0.6} />
    </g>
  );
};

// ================================================================================== the ranch gate

/** THE RANCH GATE, two cedar king posts and a beam at trailer height, the brand cut from plate against the sky */
export const RanchGateV2: React.FC<RoadV2 & {h?: number; span?: number; grand?: boolean; brandPath?: string; name?: string}> = (p) => {
  const {frame = 0, seed = 40, night = false, h = 120, span = 260, grand = false, brandPath, name} = p;
  const id = useUid(), ow = owOf(p), fc = p.facing ?? 1;
  const H = 360, S = (span / h) * H, postW = grand ? H * 0.2 : H * 0.11, t = frame / 30;
  const cedar = '#ad7a4c', stone = '#e6d2a8', steel = '#3c3752';
  const swing = Math.sin(t * TAU * 0.4 + seed) * 5;
  const beamY = grand ? -H * 0.86 : -H * 0.92;
  return (
    <g transform={at(p)}>
      <defs>{cyl(`${id}c`, cedar)}{grad(`${id}s`, stone)}{grad(`${id}b`, cedar, 'v')}</defs>
      <ContactShadow x={0} y={6} w={S * 1.3} opacity={0.3} />
      {/* the cattle guard */}
      <Pass ow={ow} parts={[{d: rr(-S * 0.42, 6, S * 0.84, 40, 14), c: '#3a3550'}]} />
      {Array.from({length: 4}, (_, i) => <rect key={i} x={-S * 0.41} y={10 + i * 9} width={S * 0.82} height={5} rx={2.5} fill="#d8dce8" />)}
      {[-1, 1].map((sd) => grand
        ? <g key={sd}>
          <Pass ow={ow} parts={[{d: rr(sd * S / 2 - postW / 2, -H * 0.92, postW, H * 0.92 + 4, 14), c: stone, fill: `url(#${id}s)`},
            {d: rr(sd * S / 2 - postW * 0.64, -H * 0.99, postW * 1.28, H * 0.08, 14), c: light(stone, 0.2)}]} />
          {Array.from({length: 6}, (_, k) => <path key={k} d={`M${sd * S / 2 - postW / 2 + 8} ${-H * 0.15 * (k + 1)} L${sd * S / 2 + postW / 2 - 8} ${-H * 0.15 * (k + 1)}`}
            stroke={det(stone, 0.2)} strokeWidth={ow * 0.7} strokeLinecap="round" />)}
          {night && <><circle cx={sd * S / 2} cy={-H * 1.04} r={10} fill="#fff0b8" /><Glow x={sd * S / 2} y={-H * 1.04} r={70} color="#ffd88a" opacity={0.6} /></>}
        </g>
        : <g key={sd} transform={`rotate(${(rnd(seed, sd + 2) - 0.5) * 3} ${sd * S / 2} 0)`}>
          <Pass ow={ow} parts={[{d: rp([[sd * S / 2 - postW / 2, 2], [sd * S / 2 - postW * 0.42, -H * 0.98], [sd * S / 2 + postW * 0.42, -H * 0.98],
            [sd * S / 2 + postW / 2, 2]], [6, 14, 14, 6]), c: cedar, fill: `url(#${id}c)`}]} />
          {[-0.2, 0.15].map((u) => <path key={u} d={`M${sd * S / 2 + u * postW} ${-H * 0.9} L${sd * S / 2 + u * postW * 1.1} -20`} stroke={det(cedar, 0.3)}
            strokeWidth={ow * 0.7} strokeLinecap="round" />)}
        </g>)}
      {grand
        ? <Tube d={`M${-S / 2} ${beamY} Q0 ${beamY - H * 0.2} ${S / 2} ${beamY}`} c={steel} w={H * 0.06} ow={ow} />
        : <Pass ow={ow} parts={[{d: rr(-S / 2 - postW * 0.4, beamY, S + postW * 0.8, H * 0.1, 14), c: cedar, fill: `url(#${id}b)`}]} />}
      {!grand && <Sheen d={`M${-S / 2} ${beamY + 8} L${S * 0.2} ${beamY + 8}`} w={ow * 1.4} op={0.3} />}
      {/* the brand, cut from plate, standing against the sky */}
      <g transform={`translate(0 ${grand ? beamY - H * 0.1 : beamY}) scale(${fc} 1) scale(1.5)`}>
        <path d={brandPath ?? 'M-46,0 L-46,-46 L-16,-46 M-46,-24 L-22,-24 M6,0 L6,-46 L36,-46 L36,-24 L6,-24 M20,-24 L40,0'} fill="none"
          stroke={line(steel)} strokeWidth={10 + ow * 1.3} strokeLinecap="round" strokeLinejoin="round" />
        <path d={brandPath ?? 'M-46,0 L-46,-46 L-16,-46 M-46,-24 L-22,-24 M6,0 L6,-46 L36,-46 L36,-24 L6,-24 M20,-24 L40,0'} fill="none"
          stroke={steel} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M-48,-44 L-18,-44 M8,-44 L34,-44" stroke="#8a84a8" strokeWidth={3} strokeLinecap="round" opacity={0.7} />
      </g>
      {/* the plank on two chains, swinging a little in the wind */}
      <g transform={`translate(0 ${grand ? beamY - H * 0.08 : beamY + H * 0.1}) rotate(${swing})`}>
        <path d="M-60 0 L-60 34 M60 0 L60 34" stroke="#6a6480" strokeWidth={4} strokeDasharray="6 4" strokeLinecap="round" />
        <Pass ow={ow} parts={[{d: rr(-96, 34, 192, 52, 14), c: light(cedar, 0.15)}]} />
        {name ? <Words x={0} y={60} s={name} size={36} avail={170} fill={shade(cedar, 0.55)} font={FONT.display} weight={900} facing={fc} />
          : <path d="M-20 70 L-20 48 L0 62 L20 48 L20 70" fill="none" stroke={shade(cedar, 0.5)} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />}
      </g>
    </g>
  );
};

// ================================================================================== the boot fence

/** THE BOOT FENCE, cedar posts each wearing an old boot upside down, sole to the sky, the wires sagging between */
export const BootFenceV2: React.FC<RoadV2 & {posts?: number; span?: number; h?: number; boots?: number; wires?: number}> = (p) => {
  const {x = 0, y = 0, scale = 1, frame = 0, seed = 41, wear = 0.6, posts = 9, span = 900, boots = 7, wires = 4} = p;
  const id = useUid(), t = frame / 30;
  const s = scale * CM, ow = 3.4 / s;
  const pitch = span / Math.max(1, posts - 1), cedar = '#a8764a';
  const HIDE = ['#9a3f2a', '#c46a32', '#7a4630', '#d49254', '#b0503e', '#6a3a2c'];
  const pxs = Array.from({length: posts}, (_, i) => -span / 2 + i * pitch + (rnd(seed, 200 + i) - 0.5) * pitch * 0.24);
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>{cyl(`${id}c`, cedar)}</defs>
      {pxs.map((px, i) => <ContactShadow key={i} x={px} y={3} w={40 * s * 3} opacity={0.3} />)}
      {Array.from({length: wires}, (_, k) => {
        const bob = Math.sin(t * TAU * 0.5 + k) * 1.4;
        const d = pxs.map((px, i) => {
          const py = -135 * s * (0.84 - k * 0.17);
          return i ? `Q${(px + pxs[i - 1]) / 2} ${py + 7 + bob} ${px} ${py}` : `M${px} ${py}`;
        }).join(' ');
        return <g key={k}><path d={d} fill="none" stroke="#4a4258" strokeWidth={3.4} /><path d={d} fill="none" stroke="#a8a2bc" strokeWidth={1.6} /></g>;
      })}
      {pxs.map((px, i) => {
        const lean = (rnd(seed, i) - 0.5) * 13, hide = HIDE[i % HIDE.length];
        const strap = Math.sin(t * TAU * 0.6 + i * 1.3) * 8;
        return <g key={i} transform={`translate(${px} 0) scale(${s}) rotate(${lean})`}>
          <Pass ow={ow} parts={[{d: rp([[-8, 2], [-6.5, -127], [6.5, -127], [8, 2]], [3, 5, 5, 3]), c: cedar, fill: `url(#${id}c)`}]} />
          <path d="M-1 -120 L-2 -10" stroke={det(cedar, 0.3)} strokeWidth={ow * 0.6} strokeLinecap="round" />
          {i < boots && <g transform="translate(0 -127)">
            {/* the shaft hangs down over the post, the foot lies across the top, the sole faces the sky */}
            {[-1, 1].map((sd) => <path key={sd} d={`M${sd * 7} 30 q${sd * 6 + strap * 0.3} 8 ${sd * 2} 15`} fill="none" stroke={line(hide)}
              strokeWidth={3.6 + ow * 1.2} strokeLinecap="round" />)}
            {[-1, 1].map((sd) => <path key={`s${sd}`} d={`M${sd * 7} 30 q${sd * 6 + strap * 0.3} 8 ${sd * 2} 15`} fill="none" stroke={shade(hide, 0.15)}
              strokeWidth={3.6} strokeLinecap="round" />)}
            <Pass ow={ow} parts={[
              {d: rp([[-8.5, 32], [-7.5, -8], [8, -8], [9, 32]], [4, 3, 3, 4]), c: hide},
              {d: 'M-8 -2 Q-9 -16 0 -17 L19 -17 Q30 -16 28 -9 Q25 -5 10 -4 L8 -2 Z', c: hide},
              {d: rr(-9.5, -24, 9, 8, 2.5), c: '#4a3438'},
              {d: 'M-1 -21.5 L20 -21.5 Q31 -21 29 -14 L28 -12 Q24 -16 19 -16.5 L-1 -16.5 Z', c: '#e2cca4'},
            ]} />
            <path d="M-5 24 Q0 16 5 24 M-5 13 Q0 5 5 13 M-4 3 Q0 -3 4 3" fill="none" stroke={light(hide, 0.5)} strokeWidth={ow * 0.55} strokeLinecap="round" />
            <path d="M-6 -4 L-6 28" stroke="#ffffff" strokeWidth={ow * 0.9} strokeLinecap="round" opacity={0.3} />
            {wear > 0.4 && <path d={ell(14, -12, 5, 2.4)} fill={light(hide, 0.35)} opacity={wear * 0.5} />}
          </g>}
        </g>;
      })}
    </g>
  );
};

// ================================================================================== the ghost sign

/** THE GHOST SIGN, old painted lettering surviving on a brick wall, two jobs overlapping, faded but still readable */
export const GhostSignV2: React.FC<RoadV2 & {w?: number; h?: number; layers?: number; fade?: number; words?: string[][]}> = (p) => {
  const {x = 0, y = 0, scale = 1, frame = 0, seed = 42, wear = 0.5, w = 320, h = 260, layers = 2, fade = 0.72,
    words = [['DRY GOODS', 'HARDWARE & FEED'], ['COLD DRINKS']]} = p;
  const id = useUid(), ow = 3.4 / scale, t = frame / 30;
  const brick = '#c4704c', panel = '#2f5c4c';
  const PAINT = ['#fff2da', '#ffd4bc', '#dcecff'];
  const cloud = ((t * 0.035 + rnd(seed, 1)) % 1.6 - 0.3) * w;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>{grad(`${id}b`, brick, 'd', 0.3)}{overlay(`${id}o`)}<clipPath id={`${id}w`}><path d={rr(0, -h, w, h, 14)} /></clipPath></defs>
      <ContactShadow x={w / 2} y={3} w={w * 1.15} opacity={0.3} />
      <Pass ow={ow} parts={[{d: rr(0, -h, w, h, 14), c: brick, fill: `url(#${id}b)`}]} />
      <g clipPath={`url(#${id}w)`}>
        {Array.from({length: 26}, (_, i) => <path key={i} d={`M0 ${-h + (i + 1) * h / 27} L${w} ${-h + (i + 1) * h / 27}`} stroke="#f0d2bc"
          strokeWidth={1.1} opacity={0.4} />)}
        {Array.from({length: 26 * 4}, (_, i) => {
          const row = Math.floor(i / 4), xx = ((i % 4) + (row % 2) * 0.5 + 0.25) * w / 4;
          return <path key={`v${i}`} d={`M${xx} ${-h + row * h / 27} l0 ${h / 27}`} stroke="#f0d2bc" strokeWidth={1.1} opacity={0.3} />;
        })}
        {Array.from({length: Math.min(layers, words.length)}, (_, l) => {
          const col = PAINT[l % PAINT.length], op = fade * (l === 0 ? 1.12 : 0.66);
          const oy = -h * (0.84 - l * 0.4), lines2 = words[l];
          return <g key={l} opacity={Math.min(1, op)}>
            {l === 0 && <path d={rr(w * 0.06, oy - h * 0.1, w * 0.88, h * (0.13 + lines2.length * 0.11), 10)} fill={panel} opacity={0.55} />}
            {lines2.map((s, k) => <Words key={k} x={w / 2} y={oy + k * h * 0.14} s={s} size={k ? h * 0.075 : h * 0.13} avail={w * 0.78} fill={col}
              font={FONT.display} weight={900} />)}
          </g>;
        })}
        {Array.from({length: 22}, (_, i) => <ellipse key={i} cx={rnd(seed, 300 + i) * w} cy={-rnd(seed, 400 + i) * h} rx={5 + rnd(seed, 500 + i) * 14}
          ry={4 + rnd(seed, 600 + i) * 9} fill={brick} opacity={0.2 + wear * 0.3} />)}
        <path d={rr(0, -h, w, h, 14)} fill={`url(#${id}o)`} />
        <ellipse cx={cloud} cy={-h * 0.5} rx={w * 0.45} ry={h * 0.7} fill="#2b1d5e" opacity={0.1} />
      </g>
      <Tube d={`M${w - 14} ${-h - 4} L${w - 14} -8 Q${w - 14} 2 ${w - 2} 2`} c="#b8c2d6" w={8} ow={ow} />
      {[0.2, 0.55, 0.85].map((u) => <rect key={u} x={w - 22} y={-h * u - 3} width={16} height={6} rx={3} fill="#7f8aa6" />)}
      <Tuft x={w * 0.12} s={22} frame={frame} seed={seed} ow={ow * 0.7} /><Tuft x={w * 0.7} s={16} frame={frame} seed={seed + 4} ow={ow * 0.7} />
    </g>
  );
};

// ================================================================================== the roadside memorial

/** THE ROADSIDE MEMORIAL, a small white cross with a wreath of flowers, a blank plate, kept by somebody */
export const RoadsideMemorialV2: React.FC<RoadV2 & {h?: number; tended?: number; crosses?: number}> = (p) => {
  const {frame = 0, seed = 43, wear = 0.6, tended = 0.4, crosses = 1} = p;
  const id = useUid(), ow = owOf(p), t = frame / 30;
  const H = 80, paint = '#fbf6ec';
  const BLOOM = ['#ff4f8b', '#ffc83c', '#ff5a4a', '#b46cff', '#ff8ad0'];
  return (
    <g transform={at(p)}>
      <defs>{grad(`${id}p`, paint, 'd', 0.3)}</defs>
      <ContactShadow x={0} y={2} w={H * 0.7 * crosses} opacity={0.32} />
      {Array.from({length: crosses}, (_, j) => {
        const ox = (j - (crosses - 1) / 2) * H * 0.48, lean = (rnd(seed, j) - 0.5) * 7;
        const sway = Math.sin(t * TAU * 0.5 + j) * 2.2;
        return <g key={j} transform={`translate(${ox} 0) rotate(${lean})`}>
          <Pass ow={ow} parts={[{d: rr(-3.8, -H, 7.6, H + 1, 2.4), c: paint, fill: `url(#${id}p)`},
            {d: rr(-H * 0.27, -H * 0.77, H * 0.54, 7.6, 2.4), c: paint, fill: `url(#${id}p)`}]} />
          {Array.from({length: 4}, (_, i) => <path key={i} d={ell(-1 + (rnd(seed, 20 + j * 5 + i) - 0.5) * 4, -H * (0.15 + rnd(seed, 30 + j * 5 + i) * 0.6), 1.4, 2.4)}
            fill="#b8b0c4" opacity={wear * 0.7} />)}
          <rect x={-2.6} y={-H * 0.56} width={5.2} height={9} rx={1.4} fill="#cfd4e2" stroke={line('#cfd4e2')} strokeWidth={ow * 0.4} />
          {/* the wreath where the arms cross, swaying a touch */}
          <g transform={`translate(0 ${-H * 0.72}) rotate(${sway})`}>
            <path d={taper([[0, 4], [3, 14], [6 + sway, 24]], 3.2, 2)} fill="#4a7bd9" stroke={line('#4a7bd9')} strokeWidth={ow * 0.5} paintOrder="stroke" />
            <path d={taper([[0, 4], [-3, 14], [-5 + sway, 23]], 3.2, 2)} fill="#4a7bd9" stroke={line('#4a7bd9')} strokeWidth={ow * 0.5} paintOrder="stroke" />
            <circle r={10} fill="none" stroke={line('#4f9a48')} strokeWidth={5 + ow} /><circle r={10} fill="none" stroke="#5fae46" strokeWidth={5} />
            {Array.from({length: 7}, (_, i) => {
              const fresh = rnd(seed, 60 + j * 7 + i) < tended + 0.3, a = (i / 7) * TAU + 0.3;
              const c = fresh ? BLOOM[i % BLOOM.length] : '#e6dfd8';
              return <g key={i} transform={`translate(${Math.cos(a) * 10} ${Math.sin(a) * 10})`}>
                {Array.from({length: 5}, (_, k) => <circle key={k} cx={Math.cos(k / 5 * TAU) * 2.2} cy={Math.sin(k / 5 * TAU) * 2.2} r={2.1} fill={c}
                  stroke={line(c)} strokeWidth={ow * 0.25} />)}
                <circle r={1.4} fill={fresh ? '#ffe45a' : '#d8d2c8'} />
              </g>;
            })}
          </g>
        </g>;
      })}
      {[-9, -3, 4, 9].map((sx, i) => <path key={i} d={ell(sx, -2, 4.2, 2.8)} fill={['#d9d2c8', '#c8c0d4', '#e6ddd0', '#bfb8cc'][i]} stroke={line('#c8c0d4')}
        strokeWidth={ow * 0.5} />)}
      <Tuft x={-13} s={10} frame={frame} seed={seed} ow={ow * 0.5} /><Tuft x={13} s={8} frame={frame} seed={seed + 3} ow={ow * 0.5} />
    </g>
  );
};

// ================================================================================== the motor court

/** THE MOTOR COURT, a long low row of rooms under a deep porch roof on thin posts, turquoise doors, a window unit under every window */
export const MotorCourtV2: React.FC<RoadV2 & {rooms?: number; w?: number; h?: number; vacancy?: boolean}> = (p) => {
  const {frame = 0, seed = 44, wear = 0.55, closed = true, night = false, rooms = 8, w = 420, h = 90} = p;
  const id = useUid(), ow = owOf(p);
  const H = 340, W = (w / h) * H, pitch = (W * 0.94) / rooms;
  const body = '#fbe3c2', door = '#1fb0a0', eave = '#ee6f4c', post = '#fbf6ea';
  return (
    <g transform={at(p)}>
      <defs>{grad(`${id}b`, body, 'd', 0.3)}{grad(`${id}d`, door, 'v')}{grad(`${id}e`, eave, 'v', 0.4)}{cyl(`${id}p`, post)}</defs>
      <Pass ow={ow} parts={[{d: rr(-W / 2 - 30, -12, W + 60, 34, 16), c: '#d9d2c6'}]} />
      <ContactShadow x={0} y={4} w={W * 1.2} opacity={0.3} />
      <Pass ow={ow} parts={[{d: rr(-W / 2, -H * 0.84, W, H * 0.84, 20), c: body, fill: `url(#${id}b)`}]} />
      {Array.from({length: rooms}, (_, i) => {
        const rx = -W * 0.47 + i * pitch;
        const lit = night && !closed && rnd(seed, i) < 0.4;
        const flick = lit && i % 3 === 1 ? ((frame + i * 17) % 80 < 3 ? 0.4 : 1) : 1;
        const mode: GlassMode = lit ? 'night' : night || closed ? 'dark' : 'day';
        const wx = rx + pitch * 0.42, ww = pitch * 0.48, wy = -H * 0.64, wh = H * 0.3;
        return <g key={i}>
          <Pass ow={ow} parts={[{d: rr(rx + pitch * 0.08, -H * 0.62, pitch * 0.26, H * 0.62, 10), c: door, fill: `url(#${id}d)`}]} />
          <path d={rp([[rx + pitch * 0.21, -H * 0.56], [rx + pitch * 0.25, -H * 0.5], [rx + pitch * 0.21, -H * 0.44], [rx + pitch * 0.17, -H * 0.5]], 3)} fill="#fff4dc" opacity={0.85} />
          <circle cx={rx + pitch * 0.29} cy={-H * 0.3} r={4.5} fill="#ffd56a" />
          <g opacity={flick}><Glass b={[wx, wy, ww, wh]} frame={frame} seed={seed + i * 0.7} mode={mode} ow={ow} /></g>
          {[-1, 1].map((sd) => <path key={sd} d={rr(sd < 0 ? wx + 3 : wx + ww - 3 - ww * (closed ? 0.36 : 0.16), wy + 3, ww * (closed ? 0.36 : 0.16), wh - 6, 6)}
            fill="#e8a3bc" opacity={0.8} />)}
          <Pass ow={ow} parts={[{d: rr(wx + ww * 0.22, -H * 0.31, ww * 0.56, H * 0.13, 8), c: '#c4cad8'}]} />
          {Array.from({length: 3}, (_, k) => <path key={k} d={`M${wx + ww * 0.28} ${-H * 0.28 + k * H * 0.032} L${wx + ww * 0.72} ${-H * 0.28 + k * H * 0.032}`}
            stroke={det('#c4cad8', 0.35)} strokeWidth={ow * 0.55} strokeLinecap="round" />)}
          <circle cx={rx + pitch * 0.38} cy={-H * 0.68} r={8} fill={night && !closed ? '#fff0b0' : '#f2e2c0'} stroke={line('#f2d8a0')} strokeWidth={ow * 0.5} />
          {night && !closed && <Glow x={rx + pitch * 0.38} y={-H * 0.68} r={60} color="#ffd27a" opacity={0.6} />}
          {lit && <Glow x={wx + ww / 2} y={wy + wh / 2} r={pitch * 0.5} color="#ffd27a" opacity={0.4} />}
        </g>;
      })}
      {/* the porch shadow on the wall, the porch posts, and the deep porch roof */}
      <path d={rr(-W / 2 + 6, -H * 0.84, W - 12, H * 0.07, 10)} fill="#2b1d5e" opacity={0.14} />
      {Array.from({length: Math.floor(rooms / 2) + 1}, (_, k) => {
        const px2 = -W / 2 + 30 + k * (W - 60) / Math.floor(rooms / 2);
        return <Pass key={k} ow={ow * 0.8} parts={[{d: rr(px2 - 6, -H * 0.86, 12, H * 0.86 + 14, 6), c: post, fill: `url(#${id}p)`}]} />;
      })}
      <Pass ow={ow} parts={[{d: rr(-W / 2 - W * 0.03, -H * 0.98, W * 1.06, H * 0.14, H * 0.07), c: eave, fill: `url(#${id}e)`}]} />
      <rect x={-W / 2 - W * 0.02} y={-H * 0.875} width={W * 1.04} height={H * 0.022} rx={H * 0.011} fill="#fff4e4" />
      <Sheen d={`M${-W / 2} ${-H * 0.955} L${W * 0.2} ${-H * 0.955}`} w={ow * 1.4} />
      {wear > 0.4 && <path d={rr(-W / 2 + 10, -H * 0.2, W - 20, H * 0.18, 16)} fill="#d8b480" opacity={wear * 0.24} />}
    </g>
  );
};

// ================================================================================== the pole sign

/** THE POLE SIGN, a tall steel pole carrying a lit cabinet, a neon starburst and a reader board. `dead` is the blank cabinet */
export const PoleSignV2: React.FC<RoadV2 & {h?: number; dead?: boolean; neon?: number; starburst?: boolean; panel?: string;
  word?: string; reader?: string}> = (p) => {
  const {frame = 0, seed = 45, wear = 0.5, night = false, dead = false, neon = 0.55, starburst = true, panel = '#fff1c8', word, reader} = p;
  const id = useUid(), ow = owOf(p), fc = p.facing ?? 1, t = frame / 30;
  const H = 1100, poleTop = H * 0.84, pw = H * 0.48, ph = H * 0.3, rh = H * 0.11, cy0 = -poleTop - ph;
  const steel = '#8e9ab6', cab = dead ? '#a2a8b8' : '#e8473a';
  const lit = night && neon > 0.5 && !dead && !((frame % 97) < 3 || (frame % 151 > 40 && frame % 151 < 43));
  const neonC = '#ff3f7a';
  const chase = Math.floor(t * 8);
  const squig = `M${-pw * 0.32} ${ph * 0.56} q${pw * 0.12} ${-ph * 0.34} ${pw * 0.22} 0 q${pw * 0.1} ${ph * 0.3} ${pw * 0.2} 0 q${pw * 0.11} ${-ph * 0.32} ${pw * 0.24} ${ph * 0.06}`;
  return (
    <g transform={at(p)}>
      <defs>{cyl(`${id}s`, steel)}{grad(`${id}c`, cab, 'v', 0.35)}{grad(`${id}p`, dead ? '#b8bdca' : panel, 'v', 0.5)}{grad(`${id}r`, '#fffaf0', 'v', 0.2)}</defs>
      <ContactShadow x={0} y={6} w={260} opacity={0.32} />
      <Pass ow={ow} parts={[{d: rp([[-30, 4], [-22, -poleTop], [22, -poleTop], [30, 4]], [8, 10, 10, 8]), c: steel, fill: `url(#${id}s)`}]} />
      {wear > 0.3 && <Rust x={-10} y={-H * 0.3} w={24} h={H * 0.28} op={wear * 0.4} />}
      {/* the starburst on the top corner, behind the cabinet */}
      {starburst && !dead && <g transform={`translate(${pw * 0.3} ${cy0 - 100})`}>
        {Array.from({length: 12}, (_, i) => {
          const a = (i / 12) * TAU - Math.PI / 2, r = i % 2 ? 120 : 210;
          const on = (i + chase) % 3 === 0;
          const tip: Pt = [Math.cos(a) * r, Math.sin(a) * r];
          return <g key={i}>
            <path d={taper([[0, 0], tip], 36, 12)} fill={lit ? '#ffb0c8' : '#ff8a3a'} stroke={lit ? neonC : line('#ff8a3a')} strokeWidth={ow * 1.4}
              strokeLinejoin="round" paintOrder="stroke" />
            <circle cx={tip[0]} cy={tip[1]} r={22} fill={on ? '#fff6c0' : '#ffcf6a'} stroke={line('#ffcf6a')} strokeWidth={ow} />
            {on && <Glow x={tip[0]} y={tip[1]} r={60} color="#ffe68a" opacity={0.7} />}
          </g>;
        })}
        <circle r={34} fill="#ffcf3a" stroke={line('#ffcf3a')} strokeWidth={ow * 1.4} />
        {lit && <Glow x={0} y={0} r={260} color={neonC} opacity={0.35} />}
      </g>}
      {/* the cabinet and its panel */}
      <Pass ow={ow} parts={[{d: rr(-pw / 2, cy0, pw, ph, 46), c: cab, fill: `url(#${id}c)`},
        {d: rr(-pw / 2 + 4, -poleTop, pw - 8, rh, 22), c: '#f4efe4', fill: `url(#${id}r)`},
        {d: rr(-60, -poleTop + rh - 6, 120, 40, 12), c: steel}]} />
      <path d={rr(-pw / 2 + 34, cy0 + 34, pw - 68, ph - 68, 26)} fill={`url(#${id}p)`} stroke={line(dead ? '#b8bdca' : panel)} strokeWidth={ow} />
      {dead ? <>
        {Array.from({length: 5}, (_, i) => <circle key={i} cx={-pw * 0.36 + i * pw * 0.18} cy={cy0 + ph * 0.86} r={7} fill="#6a6880" />)}
        <Rust x={-pw * 0.1} y={cy0 + ph * 0.5} w={40} h={ph * 0.45} op={wear * 0.5} />
      </> : <>
        {Array.from({length: 14}, (_, i) => {
          const u = i / 14, per = 2 * (pw + ph) - 100;
          let d = u * per, bx = 0, by = 0;
          const L = pw - 100, Hh = ph - 40;
          if (d < L) { bx = -pw / 2 + 50 + d; by = cy0 + 18; } else if ((d -= L) < Hh) { bx = pw / 2 - 18; by = cy0 + 20 + d; }
          else if ((d -= Hh) < L) { bx = pw / 2 - 50 - d; by = cy0 + ph - 18; } else { d -= L; bx = -pw / 2 + 18; by = cy0 + ph - 20 - d; }
          const on = (i + chase) % 2 === 0;
          return <g key={i}><circle cx={bx} cy={by} r={9} fill={on ? '#fff8d0' : '#d9a24a'} />{on && (night || i % 4 === 0) &&
            <Glow x={bx} y={by} r={30} color="#ffe68a" opacity={0.6} />}</g>;
        })}
        {word
          ? <><Words x={0} y={cy0 + ph * 0.5} s={word} size={ph * 0.42} avail={pw * 0.72} fill={lit ? '#ffe0ea' : '#d6305e'} font={FONT.display}
            weight={900} italic stroke={lit ? neonC : '#fff6ea'} sw={lit ? 14 : 8} facing={fc} />
            {lit && <Glow x={0} y={cy0 + ph * 0.5} r={pw * 0.5} color={neonC} opacity={0.4} />}</>
          : <><path d={squig} transform={`translate(0 ${cy0})`} fill="none" stroke={lit ? neonC : neon > 0.5 ? '#e0627e' : '#aaa6b4'} strokeWidth={lit ? 30 : 18}
            strokeLinecap="round" opacity={lit ? 0.35 : 1} />
            {lit && <path d={squig} transform={`translate(0 ${cy0})`} fill="none" stroke="#ffe0ea" strokeWidth={12} strokeLinecap="round" />}
            {neon <= 0.5 && Array.from({length: 5}, (_, i) => <circle key={i} cx={-pw * 0.3 + i * pw * 0.15} cy={cy0 + ph * (0.35 + rnd(seed, i) * 0.3)}
              r={6} fill="#6a6880" />)}</>}
      </>}
      {/* the reader board, changeable copy on tracks */}
      {[0.36, 0.7].map((u) => <path key={u} d={`M${-pw * 0.44} ${-poleTop + rh * u} L${pw * 0.44} ${-poleTop + rh * u}`} stroke="#c8c0d8" strokeWidth={3} />)}
      {!dead && (reader
        ? <Words x={0} y={-poleTop + rh * 0.5} s={reader} size={rh * 0.62} avail={pw * 0.84} fill="#2b2440" weight={900} facing={fc} />
        : Array.from({length: 7}, (_, i) => rnd(seed, 50 + i) > 0.25 ? <rect key={i} x={-pw * 0.38 + i * pw * 0.11} y={-poleTop + rh * 0.24} width={pw * 0.08}
          height={rh * 0.52} rx={6} fill="#3a3456" /> : null))}
      <Sheen d={`M${-pw / 2 + 30} ${cy0 + 18} L${pw * 0.1} ${cy0 + 18}`} w={ow * 1.6} op={0.35} />
    </g>
  );
};

// ================================================================================== the billboard

/** THE RURAL BILLBOARD, a monopole, one bright face and one line of copy, a catwalk with its lamps */
export const BillboardV2: React.FC<RoadV2 & {h?: number; face?: string; lines?: number; catwalk?: boolean; copy?: string}> = (p) => {
  const {frame = 0, seed = 46, wear = 0.35, night = false, face = '#ffc72e', lines = 1, catwalk = true, copy} = p;
  const id = useUid(), ow = owOf(p), fc = p.facing ?? 1;
  const H = 900, bw = H * 1.15, bh = H * 0.44, top = -H * 0.58 - bh;
  const steel = '#7f8ba6';
  return (
    <g transform={at(p)}>
      <defs>{cyl(`${id}s`, steel)}{grad(`${id}f`, face, 'd', 0.4)}</defs>
      <ContactShadow x={0} y={6} w={300} opacity={0.32} />
      <Pass ow={ow} parts={[{d: rp([[-34, 4], [-26, -H * 0.6], [26, -H * 0.6], [34, 4]], [8, 10, 10, 8]), c: steel, fill: `url(#${id}s)`},
        {d: rr(-bw * 0.36, top + bh * 0.2, bw * 0.72, 30, 15), c: shade(steel, 0.2)}]} />
      {wear > 0.3 && <Rust x={-12} y={-H * 0.34} w={26} h={H * 0.3} op={wear * 0.45} />}
      <Pass ow={ow} parts={[{d: rr(-bw / 2, top, bw, bh, 30), c: '#e9edf6'}]} />
      <path d={rr(-bw / 2 + 16, top + 16, bw - 32, bh - 32, 20)} fill={`url(#${id}f)`} />
      {copy
        ? <Words x={0} y={top + bh / 2} s={copy} size={bh * 0.42} avail={bw * 0.84} fill="#2b2440" font={FONT.display} weight={900} facing={fc} />
        : Array.from({length: lines}, (_, i) => <rect key={i} x={-bw * 0.36} y={top + bh * (0.36 + i * 0.2)} width={bw * (0.58 + rnd(seed, i) * 0.14)}
          height={bh * 0.14} rx={bh * 0.07} fill="#2b2440" opacity={0.88} />)}
      <Glint b={[-bw / 2 + 16, top + 16, bw - 32, bh - 32]} r={20} frame={frame} seed={seed} op={0.32} />
      <Sheen d={`M${-bw / 2 + 40} ${top + 30} L${bw * 0.1} ${top + 30}`} w={ow * 1.8} op={0.4} />
      {catwalk && <>
        <Pass ow={ow} parts={[{d: rr(-bw / 2, top + bh + 6, bw, 22, 11), c: steel}]} />
        <path d={`M${-bw / 2 + 10} ${top + bh + 62} L${bw / 2 - 10} ${top + bh + 62}`} stroke={line(steel)} strokeWidth={6} strokeLinecap="round" />
        {Array.from({length: 9}, (_, i) => <path key={i} d={`M${-bw / 2 + 10 + i * (bw - 20) / 8} ${top + bh + 28} L${-bw / 2 + 10 + i * (bw - 20) / 8} ${top + bh + 62}`}
          stroke={line(steel)} strokeWidth={5} strokeLinecap="round" />)}
        {[-1, 0, 1].map((k) => {
          const lx = k * bw * 0.3, ly = top + bh + 6, on = night && !((frame + k * 23) % 113 < 3);
          return <g key={k}>
            {night && on && <path d={`M${lx} ${ly - 30} L${lx - bw * 0.18} ${top} L${lx + bw * 0.18} ${top} Z`} fill="#fff2c8" opacity={0.18} />}
            <Tube d={`M${lx} ${ly + 10} Q${lx} ${ly - 40} ${lx - 4} ${ly - 60}`} c={steel} w={8} ow={ow * 0.7} />
            <Pass ow={ow * 0.8} parts={[{d: rr(lx - 22, ly - 78, 44, 24, 10), c: '#5c6684'}]} />
            {on && <Glow x={lx} y={ly - 70} r={70} color="#fff2c8" opacity={0.7} />}
          </g>;
        })}
      </>}
    </g>
  );
};

// ================================================================================== the storefront block

/** THE DOWNTOWN BLOCK, two-storey brick fronts of different heights under one canopy line, arched upper windows */
export const StorefrontBlockV2: React.FC<RoadV2 & {bays?: number; w?: number; h?: number; slipcovered?: boolean; canopy?: boolean; vacant?: number}> = (p) => {
  const {frame = 0, seed = 47, wear = 0.4, night = false, bays = 5, w = 640, h = 190, slipcovered = false, canopy = true, vacant = 0} = p;
  const id = useUid(), ow = owOf(p), t = frame / 30;
  const H = 900, W = (w / h) * H, pitch = W / bays;
  const BRICK = ['#cc6340', '#b9563e', '#d4784a', '#a94f3c', '#c96c4c'];
  const can = '#2f7262', trim = '#f3e0c2';
  const barberBay = bays > 1 ? 1 : -1;
  return (
    <g transform={`translate(${p.x ?? 0} ${p.y ?? 0}) scale(${(p.scale ?? 1) * CM})`}>
      <defs>{BRICK.map((c, i) => <React.Fragment key={i}>{grad(`${id}b${i}`, c, 'd', 0.3)}</React.Fragment>)}{grad(`${id}c`, can, 'v', 0.4)}
        <clipPath id={`${id}bp`}><path d={rr(-18, -120, 36, 116, 16)} /></clipPath></defs>
      <ContactShadow x={0} y={6} w={W * 1.12} opacity={0.3} />
      {(() => {
        const parts: Part[] = Array.from({length: bays}, (_, i) => {
          const bh = rnd(seed, i) > 0.62 ? H : H * 0.78;
          return {d: rr(-W / 2 + i * pitch, -bh, pitch + (i < bays - 1 ? 2 : 0), bh, i === 0 || i === bays - 1 ? 20 : 4), c: BRICK[i % BRICK.length],
            fill: `url(#${id}b${i % BRICK.length})`};
        });
        return <Pass ow={ow} parts={parts} />;
      })()}
      {Array.from({length: bays}, (_, i) => {
        const bx = -W / 2 + i * pitch, bh = rnd(seed, i) > 0.62 ? H : H * 0.78, brick = BRICK[i % BRICK.length];
        const isVacant = i < vacant;
        const mode: GlassMode = isVacant ? 'dark' : night ? 'night' : 'day';
        return <g key={i}>
          <Pass ow={ow} parts={[{d: rr(bx - pitch * 0.03, -bh - H * 0.06, pitch * 1.06, H * 0.07, H * 0.035), c: trim}]} />
          {rnd(seed, 40 + i) > 0.6 && <Pass ow={ow * 0.8} parts={[{d: rr(bx + pitch * 0.38, -bh - H * 0.1, pitch * 0.24, H * 0.06, 20), c: trim}]} />}
          {Array.from({length: 3}, (_, k) => {
            const wx = bx + pitch * (0.16 + k * 0.26), ww = pitch * 0.16, bricked = rnd(seed, 60 + i * 3 + k) > 0.78;
            const d = `M${wx} ${-bh * 0.42} L${wx} ${-bh * 0.74} Q${wx} ${-bh * 0.84} ${wx + ww / 2} ${-bh * 0.84} Q${wx + ww} ${-bh * 0.84} ${wx + ww} ${-bh * 0.74} L${wx + ww} ${-bh * 0.42} Z`;
            return bricked ? <path key={k} d={d} fill={shade(brick, 0.2)} stroke={line(brick)} strokeWidth={ow} />
              : <g key={k}><Pass ow={ow} parts={[{d: `M${wx - 12} ${-bh * 0.42 + 14} L${wx - 12} ${-bh * 0.74} Q${wx - 12} ${-bh * 0.86 - 10} ${wx + ww / 2} ${-bh * 0.86 - 10} Q${wx + ww + 12} ${-bh * 0.86 - 10} ${wx + ww + 12} ${-bh * 0.74} L${wx + ww + 12} ${-bh * 0.42 + 14} Z`, c: trim}]} />
                <Glass d={d} b={[wx, -bh * 0.84, ww, bh * 0.42]} frame={frame} seed={seed + i + k * 0.3} mode={night ? 'dark' : 'day'} ow={ow * 0.6} />
                <path d={`M${wx} ${-bh * 0.6} L${wx + ww} ${-bh * 0.6}`} stroke={trim} strokeWidth={ow * 1.2} /></g>;
          })}
          {slipcovered ? <Pass ow={ow} parts={[{d: rr(bx + 10, -bh * 0.4, pitch - 20, bh * 0.15, 14), c: '#c8cdd6'}]} />
            : Array.from({length: 4}, (_, k) => <Glass key={k} b={[bx + pitch * (0.08 + k * 0.215), -bh * 0.37, pitch * 0.17, bh * 0.08]} r={8} frame={frame}
              seed={seed + i * 2 + k} mode={night ? 'dark' : 'day'} ow={ow * 0.6} />)}
          <Glass b={[bx + pitch * 0.06, -bh * 0.27, pitch * 0.62, bh * 0.27]} r={12} frame={frame} seed={seed + i * 1.3} mode={mode} ow={ow} />
          <Pass ow={ow} parts={[{d: rr(bx + pitch * 0.72, -bh * 0.28, pitch * 0.22, bh * 0.28, 12), c: isVacant ? '#8a7f8c' : '#3f7fb8'}]} />
          <circle cx={bx + pitch * 0.76} cy={-bh * 0.13} r={6} fill="#ffd56a" />
          {isVacant && [0.3, 0.55].map((u, k) => <Pass key={k} ow={ow} parts={[{d: rr(bx + pitch * 0.08, -bh * 0.27 * (1 - u) - 30, pitch * 0.58, 60, 14), c: '#d8ae6c',
            t: `rotate(${k ? 4 : -3} ${bx + pitch * 0.37} ${-bh * 0.15})`}]} />)}
          {wear > 0.3 && <Rust x={bx + pitch * 0.9} y={-bh + 20} w={30} h={bh * 0.2} op={wear * 0.25} />}
          {i === barberBay && !isVacant && <g transform={`translate(${bx + pitch * 0.97} ${-bh * 0.18})`}>
            <Pass ow={ow} parts={[{d: rr(-18, -120, 36, 116, 16), c: '#ffffff'}]} />
            <g clipPath={`url(#${id}bp)`}>{Array.from({length: 8}, (_, k) => {
              const yy = -140 + k * 40 + ((t * 60) % 40);
              return <path key={k} d={`M-24 ${yy} L24 ${yy - 30} L24 ${yy - 16} L-24 ${yy + 14} Z`} fill={k % 2 ? '#e63946' : '#3d6fd9'} />;
            })}</g>
            <circle cx={0} cy={-126} r={14} fill="#d9dde8" stroke={line('#d9dde8')} strokeWidth={ow * 0.8} />
          </g>}
        </g>;
      })}
      {canopy && <>
        {Array.from({length: bays + 1}, (_, i) => <path key={i} d={`M${-W / 2 + i * pitch} ${-H * 0.3} L${-W / 2 + i * pitch + (i === bays ? -30 : 30)} ${-H * 0.44}`}
          stroke={line('#4a4560')} strokeWidth={ow * 0.9} strokeLinecap="round" />)}
        <Pass ow={ow} parts={[{d: rr(-W / 2 - W * 0.012, -H * 0.31, W * 1.024, H * 0.035, H * 0.017), c: can, fill: `url(#${id}c)`}]} />
        <Sheen d={`M${-W / 2} ${-H * 0.305} L${W * 0.1} ${-H * 0.305}`} w={ow * 1.2} op={0.35} />
      </>}
    </g>
  );
};

// ================================================================================== the deer blind

/** THE DEER BLIND, a plywood box on stilts with its slot window and too-steep ladder, a spin feeder forty yards out */
export const DeerBlindV2: React.FC<RoadV2 & {h?: number; feeder?: boolean; camo?: boolean}> = (p) => {
  const {frame = 0, seed = 48, feeder = true, camo = false} = p;
  const id = useUid(), ow = owOf(p), t = frame / 30;
  const H = 420, bw = H * 0.52, bh = H * 0.4, deck = -H * 0.6;
  const ply = camo ? '#6f8c4a' : '#d4a56a', leg = '#7c869c', roof = '#8a5236';
  const cycle = (frame + seed * 7) % 120, toss = cycle < 36;
  return (
    <g transform={at(p)}>
      <defs>{grad(`${id}p`, ply)}{grad(`${id}r`, roof, 'v')}{cyl(`${id}f`, '#a9b1c2')}</defs>
      <ContactShadow x={0} y={6} w={bw * 1.6} opacity={0.32} />
      {feeder && <g transform={`translate(${-bw * 1.45} 0) scale(0.75)`}>
        <ContactShadow x={0} y={6} w={160} opacity={0.3} />
        {[-1, 0, 1].map((sd) => <Tube key={sd} d={`M${sd * 50} 2 L${sd * 10} ${-H * 0.4}`} c={shade(leg, 0.1)} w={9} ow={ow * 0.8} />)}
        <Pass ow={ow} parts={[{d: rp([[-48, -H * 0.62], [48, -H * 0.62], [48, -H * 0.44], [18, -H * 0.38], [-18, -H * 0.38], [-48, -H * 0.44]], 14),
          c: '#a9b1c2', fill: `url(#${id}f)`}, {d: ell(0, -H * 0.62, 48, 14), c: '#c3cad8'}]} />
        <g transform={`translate(0 ${-H * 0.36})`}>
          <path d={`M${Math.cos(t * 9) * 26} ${Math.sin(t * 9) * 4} L${-Math.cos(t * 9) * 26} ${-Math.sin(t * 9) * 4}`} stroke="#4a4560" strokeWidth={6} strokeLinecap="round" />
          {toss && Array.from({length: 14}, (_, i) => {
            const a = (i / 14) * TAU, tau = cycle / 30, sp = 120 + rnd(seed, i) * 80;
            return <circle key={i} cx={Math.cos(a) * sp * tau} cy={-40 * tau + 220 * tau * tau} r={4} fill="#ffcf3a" stroke={line('#ffcf3a')} strokeWidth={1.5} />;
          })}
        </g>
      </g>}
      {/* legs, the far pair first, then the near pair and the bracing */}
      {[-1, 1].map((sd) => <Tube key={`f${sd}`} d={`M${sd * bw * 0.3} 2 L${sd * bw * 0.4} ${deck}`} c={shade(leg, 0.2)} w={12} ow={ow} />)}
      {[-1, 1].map((sd) => <Tube key={`x${sd}`} d={`M${sd * bw * 0.4} -30 L${-sd * bw * 0.42} ${deck * 0.55}`} c={shade(leg, 0.1)} w={7} ow={ow * 0.8} />)}
      {[-1, 1].map((sd) => <Tube key={`n${sd}`} d={`M${sd * bw * 0.48} 2 L${sd * bw * 0.44} ${deck}`} c={leg} w={14} ow={ow} />)}
      <Pass ow={ow} parts={[{d: rr(-bw * 0.56, deck - 10, bw * 1.12, 20, 10), c: shade(ply, 0.15)},
        {d: rr(-bw / 2, deck - bh, bw, bh, 18), c: ply, fill: `url(#${id}p)`},
        {d: rp([[-bw * 0.62, deck - bh + 8], [0, deck - bh - H * 0.08], [bw * 0.62, deck - bh + 8]], [12, 30, 12]), c: roof, fill: `url(#${id}r)`}]} />
      {camo && [[-0.25, 0.3, 30], [0.2, 0.7, 26], [0.3, 0.25, 22], [-0.3, 0.8, 24]].map(([u, v, r], i) =>
        <path key={i} d={ell(u * bw, deck - bh * v, r * 1.5, r)} fill={i % 2 ? '#4a5f34' : '#9aa65e'} opacity={0.8} />)}
      {Array.from({length: 4}, (_, k) => <path key={k} d={`M${-bw / 2 + 10} ${deck - bh * 0.2 * (k + 1)} L${bw / 2 - 10} ${deck - bh * 0.2 * (k + 1)}`}
        stroke={det(ply, 0.18)} strokeWidth={ow * 0.6} strokeLinecap="round" />)}
      <Pass ow={ow} parts={[{d: rr(-bw * 0.43, deck - bh * 0.66, bw * 0.86, bh * 0.2, 10), c: '#2c2840'}]} />
      {[-0.36, 0.36].map((u) => <Tube key={u} d={`M${u * bw} ${deck - bh * 0.66} L${u * bw * 1.08} ${deck - bh * 0.82}`} c={shade(ply, 0.3)} w={5} ow={ow * 0.6} />)}
      <Pass ow={ow} parts={[{d: rp([[-bw * 0.45, deck - bh * 0.68], [bw * 0.45, deck - bh * 0.68], [bw * 0.5, deck - bh * 0.84], [-bw * 0.5, deck - bh * 0.84]], 8),
        c: shade(ply, 0.08), fill: `url(#${id}p)`}]} />
      <Sheen d={`M${-bw / 2 + 14} ${deck - bh + 14} L${-bw / 2 + 14} ${deck - bh * 0.3}`} w={ow * 1.4} op={0.3} />
      {/* the ladder, a bit too steep and missing a rung */}
      {[0.46, 0.68].map((u) => <Tube key={u} d={`M${bw * u} 2 L${bw * (u + 0.02)} ${deck}`} c="#9aa3b8" w={8} ow={ow * 0.8} />)}
      {Array.from({length: 7}, (_, i) => rnd(seed, i) > 0.12 ? <path key={i} d={`M${bw * 0.47} ${-30 - i * H * 0.078} L${bw * 0.69} ${-30 - i * H * 0.078}`}
        stroke={line('#9aa3b8')} strokeWidth={6} strokeLinecap="round" /> : null)}
    </g>
  );
};

// ================================================================================== the two-lane

/** THE TWO-LANE, asphalt running to the horizon between tan shoulders, fog lines, a yellow centre dash, heat shimmer far off */
export const TwoLaneV2: React.FC<RoadV2 & {w?: number; horizonY?: number; caliche?: boolean; dashes?: number; shoulder?: number; speed?: number}> = (p) => {
  const {x = 0, y = 0, scale = 1, frame = 0, seed = 49, w = 1400, horizonY = -260, caliche = false, dashes = 9, shoulder = 0.16, speed = 0} = p;
  const id = useUid(), t = frame / 30, ow = 3.4 / scale;
  const top = caliche ? '#e8d4a6' : '#4c5272', sh = '#ecc98e', ditch = '#7fb44c';
  const v = w * 0.02;
  const road = `M${-w / 2} 0 L${-v} ${horizonY} L${v} ${horizonY} L${w / 2} 0 Z`;
  const phase = (t * speed * 0.8) % 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <linearGradient id={`${id}r`} x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor={shade(top, 0.1)} /><stop offset="70%" stopColor={top} />
          <stop offset="100%" stopColor={mix(top, '#c8d4ff', 0.55)} /></linearGradient>
        <linearGradient id={`${id}s`} x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor={sh} /><stop offset="100%" stopColor={mix(sh, '#e8e0ff', 0.5)} /></linearGradient>
        <clipPath id={`${id}c`}><path d={road} /></clipPath>
        <linearGradient id={`${id}d`} x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor={ditch} /><stop offset="100%" stopColor={mix(ditch, '#d8e4ff', 0.5)} /></linearGradient>
      </defs>
      {[-1, 1].map((sd) => <path key={sd} fill={`url(#${id}d)`} stroke={line(ditch)} strokeWidth={ow * 1.2} strokeLinejoin="round" d={`M${sd * (w / 2 + w * shoulder)} 0 L${sd * v * (1 + shoulder * 2)} ${horizonY}
        L${sd * v * (1 + shoulder * 3.4)} ${horizonY} L${sd * (w / 2 + w * shoulder * 2.4)} 0 Z`} />)}
      <path d={`M${-w / 2 - w * shoulder} 0 L${-v * (1 + shoulder * 2)} ${horizonY} L${v * (1 + shoulder * 2)} ${horizonY} L${w / 2 + w * shoulder} 0 Z`}
        fill={`url(#${id}s)`} stroke={line(sh)} strokeWidth={ow * 1.2} strokeLinejoin="round" />
      <path d={road} fill={`url(#${id}r)`} stroke={line(top)} strokeWidth={ow * 1.4} strokeLinejoin="round" />
      <g clipPath={`url(#${id}c)`}>
        {!caliche && <>
          {[-1, 1].map((sd) => <path key={sd} fill="#fff6e6" d={`M${sd * w * 0.47} 2 L${sd * v * 0.94} ${horizonY} L${sd * v * 0.86} ${horizonY} L${sd * w * 0.435} 2 Z`} />)}
          {Array.from({length: dashes + 1}, (_, i) => {
            const a = (i - phase) / dashes, b = (i - phase + 0.45) / dashes;
            if (b <= 0) return null;
            const f0 = Math.pow(Math.max(0, a), 1.9), fb = Math.pow(b, 1.9);
            const y0 = horizonY * f0, yb = horizonY * fb, hw0 = w * 0.011 * (1 - f0), hwb = w * 0.011 * (1 - fb);
            return <path key={i} fill="#ffcc33" stroke={line('#ffcc33')} strokeWidth={ow * 0.5 * (1 - f0)} strokeLinejoin="round"
              d={`M${-hw0} ${y0} L${-hwb} ${yb} L${hwb} ${yb} L${hw0} ${y0} Z`} />;
          })}
          <path d={`M${-w * 0.3} -6 L${-v * 0.5} ${horizonY}`} stroke="#ffffff" strokeWidth={w * 0.03} opacity={0.06} />
        </>}
        {caliche && <>
          {[-1, 1].map((sd) => <path key={sd} fill={shade(top, 0.12)} opacity={0.6} d={`M${sd * w * 0.3} 2 L${sd * v * 0.6} ${horizonY} L${sd * v * 0.3} ${horizonY} L${sd * w * 0.14} 2 Z`} />)}
          {Array.from({length: 40}, (_, i) => {
            const f = Math.pow(rnd(seed, i), 1.6);
            return <ellipse key={i} cx={(rnd(seed, 100 + i) - 0.5) * w * (1 - f * 0.96)} cy={horizonY * f} rx={(3 + rnd(seed, 200 + i) * 6) * (1 - f * 0.9)}
              ry={(1.6 + rnd(seed, 300 + i) * 2) * (1 - f * 0.9)} fill="#8a6a48" opacity={0.25} />;
          })}
        </>}
        {/* heat shimmer near the horizon */}
        {Array.from({length: 3}, (_, i) => <ellipse key={`h${i}`} cx={Math.sin(t * 1.3 + i * 2) * v * 0.6} cy={horizonY * (0.9 - i * 0.03)} rx={v * (1.6 + i * 0.4)} ry={1.4}
          fill="#e6eeff" opacity={0.18 + 0.14 * Math.sin(t * 4 + i * 1.7)} />)}
      </g>
      {!caliche && [-1, 1].map((sd) => Array.from({length: 6}, (_, i) => {
        const f = Math.pow(Math.max(0, (i + 1 - phase) / 6.5), 1.7), k = 1 - f;
        const px = sd * ((w / 2 + w * shoulder * 0.5) * k + v * (1 + shoulder) * f), py = horizonY * f, ph = 26 * k + 2;
        return <g key={`${sd}${i}`}><path d={rr(px - 2.4 * k - 0.6, py - ph, 4.8 * k + 1.2, ph, 2 * k + 0.6)} fill="#fffaf0" stroke={line('#fffaf0')} strokeWidth={ow * 0.5 * k} />
          <rect x={px - 1.8 * k - 0.4} y={py - ph + 3 * k} width={3.6 * k + 0.8} height={5 * k + 0.6} rx={1} fill="#ff9a2a" /></g>;
      }))}
    </g>
  );
};

// ================================================================================== the city limit sign

/** THE CITY LIMIT SIGN, the green plate on two posts. The town and its population are passed in, never made up */
export const CityLimitSignV2: React.FC<RoadV2 & {h?: number; lines?: number; name?: string; pop?: string}> = (p) => {
  const {frame = 0, seed = 50, wear = 0.45, name, pop} = p;
  const id = useUid(), ow = owOf(p), fc = p.facing ?? 1;
  const H = 240, sw = H * 0.92, sh = H * 0.46, py = -H * 0.6 - sh;
  const green = '#1d8d58', post = '#b8c0d2';
  const words = [name, 'CITY LIMIT', pop !== undefined ? `POP ${pop}` : undefined].filter((s): s is string => !!s);
  return (
    <g transform={at(p)}>
      <defs>{cyl(`${id}p`, post)}{grad(`${id}g`, green, 'd', 0.35)}</defs>
      <ContactShadow x={0} y={3} w={sw * 1.2} opacity={0.32} />
      <Pass ow={ow} parts={[-1, 1].map((sd) => ({d: rr(sd * sw * 0.3 - 4, -H * 0.62, 8, H * 0.62 + 2, 3), c: post, fill: `url(#${id}p)`}))} />
      <Pass ow={ow} parts={[{d: rr(-sw / 2, py, sw, sh, 14), c: green, fill: `url(#${id}g)`}]} />
      <path d={rr(-sw / 2 + 6, py + 6, sw - 12, sh - 12, 9)} fill="none" stroke="#fffaf0" strokeWidth={3.2} />
      {words.map((s, i) => {
        const n = words.length, lineH = (sh - 24) / n;
        const big = s === name || n === 1;
        return <Words key={i} x={0} y={py + 12 + lineH * (i + 0.5)} s={s} size={Math.min(lineH * (big ? 0.78 : 0.62), big ? 44 : 30)} avail={sw - 36}
          fill="#fffaf0" weight={800} facing={fc} />;
      })}
      <Glint b={[-sw / 2, py, sw, sh]} r={14} frame={frame} seed={seed} op={0.35} />
      {wear > 0.4 && Array.from({length: 3}, (_, i) => {
        const bx = [-0.43, 0.42, 0.45][i] * sw + (rnd(seed, 20 + i) - 0.5) * 6, by = py + sh * [0.84, 0.14, 0.8][i];
        return <g key={i}><circle cx={bx} cy={by} r={3.6} fill="#e6ecf6" /><circle cx={bx} cy={by} r={2} fill="#2b2440" /></g>;
      })}
      <Sheen d={`M${-sw / 2 + 12} ${py + 10} L${sw * 0.1} ${py + 10}`} w={ow * 0.9} op={0.3} />
      <Tuft x={-sw * 0.3 - 10} s={22} frame={frame} seed={seed} ow={ow * 0.6} /><Tuft x={sw * 0.3 + 12} s={18} frame={frame} seed={seed + 2} ow={ow * 0.6} />
    </g>
  );
};

// ================================================================================== the country church

/** THE COUNTRY CHURCH, white clapboard, a red door, stained glass, a steeple with its bell swinging. `metal` is the post-1970 building */
export const CountryChurchV2: React.FC<RoadV2 & {h?: number; w?: number; metal?: boolean; graves?: number}> = (p) => {
  const {frame = 0, seed = 51, night = false, h = 150, w = 190, metal = false, graves = 0} = p;
  const id = useUid(), ow = owOf(p), t = frame / 30;
  const H = 800, W = (w / h) * H, bodyH = H * (metal ? 0.44 : 0.5);
  const body = metal ? '#e6d8b6' : '#fdf8ec', roof = metal ? '#b04a3c' : '#5b6c9e', door = '#c8322c';
  const apex = -bodyH - H * 0.22;
  const bell = Math.sin(t * TAU * 0.5) * 22;
  const stained = (wx: number, top: number, bot: number, ww: number) =>
    metal ? rr(wx - ww / 2, top, ww, bot - top, 10)
      : `M${wx - ww / 2} ${bot} L${wx - ww / 2} ${top + ww * 0.7} Q${wx - ww / 2} ${top + ww * 0.1} ${wx} ${top} Q${wx + ww / 2} ${top + ww * 0.1} ${wx + ww / 2} ${top + ww * 0.7} L${wx + ww / 2} ${bot} Z`;
  return (
    <g transform={at(p)}>
      <defs>{grad(`${id}b`, body, 'd', 0.3)}{grad(`${id}r`, roof, 'v', 0.4)}{grad(`${id}d`, door, 'v')}
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0.2" y2="1">{(night ? ['#fff3c0', '#ffc860', '#f08a3a'] : ['#7ac8ff', '#9a6cff', '#e8436a', '#ffb84a'])
          .map((c, i, a) => <stop key={i} offset={`${(i / (a.length - 1)) * 100}%`} stopColor={c} />)}</linearGradient></defs>
      <ContactShadow x={graves ? W * 0.2 : 0} y={6} w={W * (graves ? 1.9 : 1.3)} opacity={0.32} />
      {!metal && <g>
        {/* the steeple, tower, belfry with its bell, spire and cross */}
        <Tube d={`M0 ${-H - 8} L0 ${-H - H * 0.075} M${-H * 0.026} ${-H - H * 0.052} L${H * 0.026} ${-H - H * 0.052}`} c="#e8c25a" w={10} ow={ow * 0.8} />
        <Pass ow={ow} parts={[{d: rr(-W * 0.085, -bodyH - H * 0.35, W * 0.17, H * 0.2, 12), c: body, fill: `url(#${id}b)`},
          {d: rp([[-W * 0.105, -bodyH - H * 0.33], [0, -H], [W * 0.105, -bodyH - H * 0.33]], [10, 14, 10]), c: roof, fill: `url(#${id}r)`}]} />
        <Pass ow={ow * 0.8} parts={[{d: `M${-W * 0.045} ${-bodyH - H * 0.18} L${-W * 0.045} ${-bodyH - H * 0.27} Q${-W * 0.045} ${-bodyH - H * 0.305} 0 ${-bodyH - H * 0.305}
          Q${W * 0.045} ${-bodyH - H * 0.305} ${W * 0.045} ${-bodyH - H * 0.27} L${W * 0.045} ${-bodyH - H * 0.18} Z`, c: '#3a3456'}]} />
        <g transform={`translate(0 ${-bodyH - H * 0.29}) rotate(${bell})`}>
          <Pass ow={ow * 0.8} parts={[{d: `M-4 0 L4 0 L5 6 Q${W * 0.032} 10 ${W * 0.034} ${H * 0.07} L${-W * 0.034} ${H * 0.07} Q${-W * 0.032} 10 -5 6 Z`, c: '#f2c040'}]} />
          <circle cx={0} cy={H * 0.075} r={6} fill="#b8862a" />
        </g>
      </g>}
      <Pass ow={ow} parts={[{d: rr(-W / 2, -bodyH, W, bodyH + 2, 22), c: body, fill: `url(#${id}b)`},
        {d: rp([[-W / 2 - W * 0.06, -bodyH + 6], [0, apex], [W / 2 + W * 0.06, -bodyH + 6]], [16, 30, 16]), c: roof, fill: `url(#${id}r)`}]} />
      <Sheen d={`M${-W / 2 - W * 0.02} ${-bodyH - 4} L${-W * 0.08} ${apex + 30}`} w={ow * 1.6} op={0.35} />
      {Array.from({length: metal ? 18 : 12}, (_, i) => metal
        ? <path key={i} d={`M${-W / 2 + (i + 1) * W / 19} ${-bodyH + 12} L${-W / 2 + (i + 1) * W / 19} -12`} stroke={det(body, 0.14)} strokeWidth={ow * 0.6} strokeLinecap="round" />
        : <path key={i} d={`M${-W / 2 + 10} ${-bodyH + (i + 1) * bodyH / 13} L${W / 2 - 10} ${-bodyH + (i + 1) * bodyH / 13}`} stroke={det(body, 0.1)} strokeWidth={ow * 0.6} />)}
      {metal && <Tube d={`M0 ${apex + 60} L0 ${apex + 170} M-34 ${apex + 96} L34 ${apex + 96}`} c="#fdf8ec" w={14} ow={ow * 0.8} />}
      {[-0.3, 0.3].map((u) => {
        const ww = W * 0.12, top = -bodyH * 0.82, bot = -bodyH * 0.3;
        return <g key={u}>
          <Pass ow={ow} parts={[{d: stained(u * W, top - 12, bot + 12, ww + 24), c: '#fdf8ec'}]} />
          <path d={stained(u * W, top, bot, ww)} fill={`url(#${id}s)`} stroke={line('#7a6cc8')} strokeWidth={ow * 0.6} />
          <path d={`M${u * W} ${top + 10} L${u * W} ${bot} M${u * W - ww / 2} ${(top + bot) / 2 + 20} L${u * W + ww / 2} ${(top + bot) / 2 + 20}`}
            stroke="#fdf8ec" strokeWidth={ow * 0.9} />
          {night && <Glow x={u * W} y={(top + bot) / 2} r={W * 0.16} color="#ffd27a" opacity={0.5} />}
        </g>;
      })}
      {/* the red door under its arch, and the steps */}
      <Pass ow={ow} parts={[{d: stained(0, -bodyH * (metal ? 0.68 : 0.72), 0, W * 0.2), c: door, fill: `url(#${id}d)`}]} />
      <path d={`M0 ${-bodyH * 0.5} L0 -4`} stroke={line(door)} strokeWidth={ow * 0.8} />
      <circle cx={-12} cy={-bodyH * 0.26} r={6} fill="#ffd56a" /><circle cx={12} cy={-bodyH * 0.26} r={6} fill="#ffd56a" />
      <Pass ow={ow} parts={[{d: rr(-W * 0.18, -16, W * 0.36, 22, 10), c: '#cfc8d6'}, {d: rr(-W * 0.14, -34, W * 0.28, 22, 10), c: '#ddd6e2'}]} />
      {!metal && <><circle cx={0} cy={apex + 70} r={34} fill="#fdf8ec" stroke={line('#fdf8ec')} strokeWidth={ow} />
        <circle cx={0} cy={apex + 70} r={22} fill={`url(#${id}s)`} /></>}
      {graves > 0 && Array.from({length: graves}, (_, i) => {
        const gx = W * 0.68 + (i % 4) * W * 0.14, gy = -Math.floor(i / 4) * H * 0.06, lean = (rnd(seed, 70 + i) - 0.5) * 8;
        return <g key={i} transform={`translate(${gx} ${gy}) rotate(${lean})`}>
          <ContactShadow x={0} y={2} w={70} opacity={0.28} />
          {i % 3 === 2 ? <Tube d="M0 0 L0 -96 M-26 -68 L26 -68" c="#c9c4dc" w={14} ow={ow * 0.9} />
            : <Pass ow={ow * 0.9} parts={[{d: `M-32 0 L-32 -56 Q-32 -88 0 -88 Q32 -88 32 -56 L32 0 Z`, c: '#bdb8d2'}]} />}
        </g>;
      })}
    </g>
  );
};

// ================================================================================== the bandstand

/** THE BANDSTAND, an octagon on a lattice deck, white posts and rail, a bell roof with a finial and a pennant */
export const BandstandV2: React.FC<RoadV2 & {h?: number; sides?: number}> = (p) => {
  const {frame = 0, seed = 52, night = false, sides = 8} = p;
  const id = useUid(), ow = owOf(p), t = frame / 30, fc = p.facing ?? 1;
  const H = 500, r = H * 0.46, ry = r * 0.26, deckY = -H * 0.08, eaveY = -H * 0.6;
  const paint = '#fbf6ea', roof = '#2f9e8a', deck = '#e3d6bc';
  const roofD = `M${-r * 1.22} ${eaveY} C${-r * 0.92} ${eaveY - H * 0.06} ${-r * 0.42} ${eaveY - H * 0.14} ${-r * 0.1} ${-H * 0.9}
    Q0 ${-H * 0.95} ${r * 0.1} ${-H * 0.9} C${r * 0.42} ${eaveY - H * 0.14} ${r * 0.92} ${eaveY - H * 0.06} ${r * 1.22} ${eaveY}
    Q${r * 0.6} ${eaveY + H * 0.1} 0 ${eaveY + H * 0.1} Q${-r * 0.6} ${eaveY + H * 0.1} ${-r * 1.22} ${eaveY} Z`;
  const skirt = `M${-r * 1.12} ${deckY} L${-r * 1.12} 0 A${r * 1.12} ${ry * 1.1} 0 0 0 ${r * 1.12} 0 L${r * 1.12} ${deckY} A${r * 1.12} ${ry * 1.1} 0 0 1 ${-r * 1.12} ${deckY} Z`;
  const post = (a: number) => [Math.cos(a) * r, Math.sin(a) * ry] as Pt;
  const angs = Array.from({length: sides}, (_, i) => (i / sides) * TAU + Math.PI / sides);
  const flag = Math.sin(t * TAU * 1.1 + seed);
  return (
    <g transform={at(p)}>
      <defs>{grad(`${id}r`, roof, 'v', 0.45)}{cyl(`${id}p`, paint)}{grad(`${id}d`, deck, 'v')}
        <clipPath id={`${id}k`}><path d={skirt} /></clipPath><clipPath id={`${id}rc`}><path d={roofD} /></clipPath></defs>
      <ContactShadow x={0} y={10} w={r * 2.8} opacity={0.32} />
      <Pass ow={ow} parts={[{d: skirt, c: deck, fill: `url(#${id}d)`}, {d: ell(0, deckY, r * 1.12, ry * 1.1), c: light(deck, 0.25)}]} />
      <g clipPath={`url(#${id}k)`}>{Array.from({length: 22}, (_, i) => <path key={i} d={`M${-r * 1.2 + i * r * 0.12} 10 l40 -60 M${-r * 1.2 + i * r * 0.12} -50 l40 60`}
        stroke={det(deck, 0.25)} strokeWidth={ow * 0.6} />)}</g>
      {/* back posts and rail first, in shade */}
      {angs.filter((a) => Math.sin(a) < 0).map((a, i) => {
        const [px, py] = post(a);
        return <Pass key={`b${i}`} ow={ow * 0.8} parts={[{d: rr(px - 7, eaveY + py, 14, deckY - eaveY, 6), c: shade(paint, 0.18)}]} />;
      })}
      <path d={`M${-r} ${-H * 0.3} A${r} ${ry} 0 0 1 ${r} ${-H * 0.3}`} fill="none" stroke={shade(paint, 0.2)} strokeWidth={10} />
      {/* bunting swags between the front posts */}
      {angs.filter((a) => Math.sin(a) >= 0).sort((a, b) => Math.cos(b) - Math.cos(a)).map((a, i, arr) => {
        if (i === arr.length - 1) return null;
        const [x0, y0] = post(a), [x1, y1] = post(arr[i + 1]), sag = 40 + Math.sin(t * TAU * 0.4 + i) * 8;
        const yy0 = eaveY + y0 + 30, yy1 = eaveY + y1 + 30, col = ['#e63946', '#3d6fd9', '#e63946', '#3d6fd9'][i % 4];
        return <g key={`s${i}`}>
          <path d={`M${x0} ${yy0} Q${(x0 + x1) / 2} ${(yy0 + yy1) / 2 + sag * 2} ${x1} ${yy1} Q${(x0 + x1) / 2} ${(yy0 + yy1) / 2 + sag} ${x0} ${yy0} Z`}
            fill={col} stroke={line(col)} strokeWidth={ow * 0.8} strokeLinejoin="round" />
          <path d={`M${x0} ${yy0} Q${(x0 + x1) / 2} ${(yy0 + yy1) / 2 + sag * 1.45} ${x1} ${yy1}`} fill="none" stroke="#ffffff" strokeWidth={6} />
        </g>;
      })}
      {angs.filter((a) => Math.sin(a) >= 0).map((a, i) => {
        const [px, py] = post(a);
        return <Pass key={`p${i}`} ow={ow} parts={[{d: rr(px - 9, eaveY + py, 18, deckY - eaveY + 4, 8), c: paint, fill: `url(#${id}p)`}]} />;
      })}
      <path d={`M${-r} ${-H * 0.3} A${r} ${ry} 0 0 0 ${r} ${-H * 0.3}`} fill="none" stroke={line(paint)} strokeWidth={12 + ow * 2} />
      <path d={`M${-r} ${-H * 0.3} A${r} ${ry} 0 0 0 ${r} ${-H * 0.3}`} fill="none" stroke={paint} strokeWidth={12} />
      {Array.from({length: 17}, (_, i) => {
        const a = Math.PI * (i + 0.5) / 17, bx = -Math.cos(a) * r, by = Math.sin(a) * ry;
        return <path key={i} d={`M${bx} ${-H * 0.3 + by} L${bx} ${deckY + by}`} stroke={paint} strokeWidth={5} opacity={0.9} />;
      })}
      {/* the roof, its shingle rows, the gingerbread eave, the finial and its pennant */}
      <Pass ow={ow} parts={[{d: roofD, c: roof, fill: `url(#${id}r)`}]} />
      <g clipPath={`url(#${id}rc)`}>{Array.from({length: 6}, (_, k) => {
        const yy = eaveY - k * H * 0.05;
        return <path key={k} d={Array.from({length: 18}, (_, i) => `${i ? 'Q' : 'M'}${i ? `${-r * 1.3 + (i - 0.5) * r * 0.15} ${yy + 14} ` : ''}${-r * 1.3 + i * r * 0.15} ${yy}`).join(' ')}
          fill="none" stroke={det(roof, 0.28)} strokeWidth={ow * 0.6} />;
      })}</g>
      <path d={`M${-r * 1.2} ${eaveY + 2} Q0 ${eaveY + H * 0.1 + 6} ${r * 1.2} ${eaveY + 2}`} fill="none" stroke={line(paint)} strokeWidth={18 + ow * 2} strokeLinecap="round" />
      <path d={`M${-r * 1.2} ${eaveY + 2} Q0 ${eaveY + H * 0.1 + 6} ${r * 1.2} ${eaveY + 2}`} fill="none" stroke={paint} strokeWidth={18} strokeLinecap="round" />
      {Array.from({length: 13}, (_, i) => {
        const u = (i + 0.5) / 13, xx = -r * 1.2 + u * r * 2.4, yy = eaveY + 2 + 2 * u * (1 - u) * (H * 0.1 + 4) * 2 + 10;
        const on = night && (i + Math.floor(t * 6)) % 3 !== 0;
        return <g key={i}><circle cx={xx} cy={yy} r={night ? 9 : 10} fill={night ? (on ? '#fff0b0' : '#d9b46a') : paint} stroke={line(paint)} strokeWidth={ow * 0.6} />
          {on && <Glow x={xx} y={yy} r={40} color="#ffd27a" opacity={0.55} />}</g>;
      })}
      <Sheen d={`M${-r * 0.9} ${eaveY - H * 0.04} Q${-r * 0.4} ${eaveY - H * 0.12} ${-r * 0.15} ${-H * 0.86}`} w={ow * 1.8} op={0.35} />
      <Tube d={`M0 ${-H * 0.93} L0 ${-H * 1.14}`} c="#8a8aa6" w={7} ow={ow * 0.7} />
      <circle cx={0} cy={-H * 0.95} r={16} fill="#f2c040" stroke={line('#f2c040')} strokeWidth={ow} />
      <g transform={`translate(0 ${-H * 1.13}) scale(${fc} 1)`}>
        <path d={`M2 0 Q30 ${-6 + flag * 6} 62 ${4 + flag * 4} Q34 ${12 + flag * 3} 2 26 Z`} fill="#e63946" stroke={line('#e63946')} strokeWidth={ow * 0.8} strokeLinejoin="round" />
      </g>
    </g>
  );
};

export const ROADSIDE_V2 = ['StripedAFrameV2', 'MansardBoxV2', 'DriveInStallsV2', 'DanceHallV2', 'IcehouseV2', 'CottonGinV2', 'ModuleYardV2',
  'FeedStoreV2', 'HistoricalMarkerV2', 'RanchGateV2', 'BootFenceV2', 'GhostSignV2', 'RoadsideMemorialV2', 'MotorCourtV2', 'PoleSignV2',
  'BillboardV2', 'StorefrontBlockV2', 'DeerBlindV2', 'TwoLaneV2', 'CityLimitSignV2', 'CountryChurchV2', 'BandstandV2'] as const;
