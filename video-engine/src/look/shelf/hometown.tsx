import React from 'react';
import {M} from '../../lib/scale';
import {light, line, mix, shade} from '../color';
import {ContactShadow, Glow, useUid} from '../Kit';
import {Visor, type MachineMood, type Place} from '../machines';
import {taper} from '../props';

/**
 * HOMETOWN, LOOK V2 (November 13th, 2026).
 *
 * The school and Friday night set from lib/hometown.tsx, redrawn in the v2 idiom. The light mast, the
 * bleachers and the field, the band and its drum major, the mum, the portable, the marquee, the
 * run-through, the show barn and its steer, the bus and the goal post. Each one is round, lit from the
 * upper left, outlined in its own deep hue, grounded with a contact shadow and alive on `frame`. The
 * people and the steer get faces that act. The rest are plain objects and do not.
 *
 * PLACEMENT is the library's. x and y sit at the ground, `scale` 1 is true size through the one metre
 * in lib/scale.ts, and every drawing is built in centimetres so a scale means the same here as there.
 * Two drawings keep the library's own screen frame because the library drew them that way. `FieldV2`
 * is in screen units times `scale`, and `MarchingBlockV2` places its files in centimetres (`spread` is
 * the front rank's width) with every bandsman at true height.
 *
 * Measurements follow TOWN_M in the library (light mast 24 m to the head, bleacher 7 m, press box
 * 3.2 m, marquee 2.6 m, portable 3.4 m to the eave, bus 3.1 m, mum 0.95 m, show barn 7.5 m, steer
 * 1.35 m at the shoulder, run-through 3.4 m, goal post 9 m, drum major podium 1.6 m). Two are drawn
 * to the real thing where the library's own geometry was off. The goal post crossbar sits at ten
 * feet and the uprights are a high school's 23 feet 4 inches apart, and the steer stands its full
 * 1.35 m at the withers.
 */
const CM = M / 100;
type Pt = [number, number];
const at = (p: Place) =>
  `translate(${p.x ?? 0} ${p.y ?? 0}) scale(${(p.scale ?? 1) * CM * (p.facing ?? 1)} ${(p.scale ?? 1) * CM})`;
/** half the film line width, in a drawing's centimetres, so the outline reads about 6.8 film pixels */
const owOf = (p: Place) => 3.4 / ((p.scale ?? 1) * CM);
const rnd = (s: number, i: number) => {
  const v = Math.sin(s * 127.1 + i * 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const f1 = (p: Pt) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;

/** a rounded rectangle as a path, so it can join an outline pass */
const rr = (x: number, y: number, w: number, h: number, r: number) => {
  const q = Math.max(0, Math.min(r, w / 2, h / 2));
  return `M${x + q} ${y} H${x + w - q} A${q} ${q} 0 0 1 ${x + w} ${y + q} V${y + h - q} A${q} ${q} 0 0 1 ${x + w - q} ${y + h}`
    + ` H${x + q} A${q} ${q} 0 0 1 ${x} ${y + h - q} V${y + q} A${q} ${q} 0 0 1 ${x + q} ${y} Z`;
};
/** a polygon with every corner rounded by a quadratic, radius r (or one radius per corner) */
const roundPoly = (pts: Pt[], r: number | number[]) => {
  const n = pts.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
    const ri = Array.isArray(r) ? r[i] : r;
    const l0 = Math.hypot(p0[0] - p1[0], p0[1] - p1[1]) || 1, l2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) || 1;
    const k0 = Math.min(ri / l0, 0.5), k2 = Math.min(ri / l2, 0.5);
    const a: Pt = [p1[0] + (p0[0] - p1[0]) * k0, p1[1] + (p0[1] - p1[1]) * k0];
    const b: Pt = [p1[0] + (p2[0] - p1[0]) * k2, p1[1] + (p2[1] - p1[1]) * k2];
    d += `${i === 0 ? 'M' : 'L'}${f1(a)} Q${f1(p1)} ${f1(b)} `;
  }
  return d + 'Z';
};
const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
/** two-bone reach, where the elbow goes for a hand at t, bending to one side */
const ik = (s: Pt, t: Pt, a: number, b: number, bend: 1 | -1): {e: Pt; h: Pt} => {
  const dx = t[0] - s[0], dy = t[1] - s[1], d = Math.hypot(dx, dy) || 1;
  const dd = Math.min(d, a + b - 0.01);
  const ang = Math.atan2(dy, dx);
  const A = Math.acos(Math.max(-1, Math.min(1, (a * a + dd * dd - b * b) / (2 * a * dd))));
  const e: Pt = [s[0] + Math.cos(ang + bend * A) * a, s[1] + Math.sin(ang + bend * A) * a];
  return {e, h: [s[0] + dx / d * dd, s[1] + dy / d * dd]};
};

/** a lit material, light at the upper left through the colour to violet shade at the lower right */
const Lit: React.FC<{id: string; c: string; v?: boolean; k?: number}> = ({id, c, v, k = 1}) => (
  <linearGradient id={id} x1="0" y1="0" x2={v ? '0' : '0.4'} y2="1">
    <stop offset="0%" stopColor={light(c, 0.42 * k)} /><stop offset="48%" stopColor={c} />
    <stop offset="100%" stopColor={shade(c, 0.34 * k)} />
  </linearGradient>
);

/**
 * One piece of a joined drawing. A filled shape (f) or a stroked tube (s, w). Every piece of a joined
 * group is outlined first in its own deep hue and filled after, so no seam shows where parts meet.
 */
type Pc = {d: string; f?: string; s?: string; w?: number; k: string; t?: string};
const Pass: React.FC<{list: Pc[]; ow: number}> = ({list, ow}) => <>
  {list.map((p, i) => p.s
    ? <path key={`o${i}`} d={p.d} transform={p.t} fill="none" stroke={p.k} strokeWidth={(p.w ?? 1) + ow * 2} strokeLinecap="round"
      strokeLinejoin="round" />
    : <path key={`o${i}`} d={p.d} transform={p.t} fill={p.k} stroke={p.k} strokeWidth={ow * 2} strokeLinejoin="round" />)}
  {list.map((p, i) => p.s
    ? <path key={`f${i}`} d={p.d} transform={p.t} fill="none" stroke={p.s} strokeWidth={p.w} strokeLinecap="round" strokeLinejoin="round" />
    : <path key={`f${i}`} d={p.d} transform={p.t} fill={p.f} />)}
</>;
const pc = (d: string, f: string, base: string, t?: string): Pc => ({d, f, k: line(base), t});
const tb = (d: string, c: string, w: number): Pc => ({d, s: c, w, k: line(c)});

/** tubes lit from the left. A base, a violet shade line down the far side, a cream highlight on the near */
type Tb = {d: string; c: string; w: number; h?: boolean};
const Tubes: React.FC<{list: Tb[]; ow: number; outline?: boolean}> = ({list, ow, outline = true}) => <>
  {outline && list.map((t, i) => <path key={`o${i}`} d={t.d} fill="none" stroke={line(t.c)} strokeWidth={t.w + ow * 2} strokeLinecap="round"
    strokeLinejoin="round" />)}
  {list.map((t, i) => <path key={`f${i}`} d={t.d} fill="none" stroke={t.c} strokeWidth={t.w} strokeLinecap="round" strokeLinejoin="round" />)}
  {list.map((t, i) => <path key={`s${i}`} d={t.d} transform={t.h ? `translate(0 ${t.w * 0.24})` : `translate(${t.w * 0.24} 0)`}
    fill="none" stroke={shade(t.c, 0.32)} strokeWidth={t.w * 0.26} strokeLinecap="round" strokeLinejoin="round" />)}
  {list.map((t, i) => <path key={`h${i}`} d={t.d} transform={t.h ? `translate(0 ${-t.w * 0.2})` : `translate(${-t.w * 0.2} 0)`}
    fill="none" stroke={light(t.c, 0.6)} strokeWidth={t.w * 0.26} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />)}
</>;

const SKINS = ['#f3cfae', '#e3ac82', '#c68657', '#9a6440', '#6e4428'];
const SCHOOL: [string, string] = ['#9b1f48', '#f6ecd6'];
const BAND: [string, string] = ['#2c4aa6', '#f4b73a'];
const BRASS = '#f6c044';
const INKY = '#2a2142';
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export interface TownPropsV2 extends Place {
  wear?: number;
  /** Friday night lights the lamps, the windows and the marquee. Daylight leaves them off. */
  night?: boolean;
  /** the LED era runs cooler and bluer than metal halide */
  led?: boolean;
  /** the two colours a school has, and it never has three */
  school?: [string, string];
}

// ============================================================================ the light mast

/**
 * THE LIGHT MAST. A tapered steel pole 24 m to a canted head bank of round fixtures. At night the bank
 * glows as one bright cluster and throws a soft cone, stronger in humid air (`humidity`). The lamps
 * shimmer on `frame`, and a halide bank is warm where an LED bank is cool.
 */
export const LightMastV2: React.FC<TownPropsV2 & {fixtures?: number; rows?: number; humidity?: number; on?: boolean}> = (p) => {
  const {frame = 0, fixtures = 18, rows = 3, humidity = 0.5, on = true, night = true, led = false, seed = 81} = p;
  const id = useUid(), ow = owOf(p);
  const steel = '#8e9cc2', H = 2400, bankW = 900;
  const per = Math.ceil(fixtures / rows);
  const lamp = led ? '#e4f1ff' : '#fff0c2', glow = led ? '#b9dcff' : '#ffd27a';
  const lit = on && night;
  const shimmer = 0.88 + 0.12 * Math.sin(frame * 0.23 + seed);
  const pitch = bankW / per;
  const head: Pc[] = [];
  for (let r = 0; r < rows; r++) {
    head.push(pc(rr(-bankW / 2 - 40, -r * 150 - 22, bankW + 80, 44, 22), `url(#${id}-st)`, steel));
  }
  for (let r = 0; r < rows; r++) for (let i = 0; i < per; i++) {
    const fx = -bankW / 2 + (i + 0.5) * pitch;
    head.push(pc(rr(fx - 62, -r * 150 - 120, 124, 104, 40), `url(#${id}-hs)`, '#5a6488'));
  }
  return (
    <g transform={at(p)}>
      <defs>
        <linearGradient id={`${id}-pole`} gradientUnits="userSpaceOnUse" x1={-40} y1={0} x2={40} y2={0}>
          <stop offset="0%" stopColor={light(steel, 0.5)} /><stop offset="45%" stopColor={steel} />
          <stop offset="100%" stopColor={shade(steel, 0.38)} /></linearGradient>
        <Lit id={`${id}-st`} c={steel} v /><Lit id={`${id}-hs`} c="#5a6488" />
        <Lit id={`${id}-ft`} c="#c9c2b4" />
        <linearGradient id={`${id}-cone`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lamp} stopOpacity={0.55 * humidity * shimmer} /><stop offset="100%" stopColor={lamp} stopOpacity={0} />
        </linearGradient>
        <filter id={`${id}-b`} x="-30%" y="-10%" width="160%" height="120%"><feGaussianBlur stdDeviation={90} /></filter>
      </defs>
      {lit && <path d={`M${-bankW * 0.42} ${-H + 40} L${bankW * 0.42} ${-H + 40} L${bankW * 2.4} 0 L${-bankW * 1.3} 0 Z`}
        fill={`url(#${id}-cone)`} filter={`url(#${id}-b)`} />}
      <ContactShadow x={0} y={4} w={420} opacity={0.32} />
      <Pass ow={ow} list={[
        pc(taper([[0, -60], [0, -H + 30]], 78, 40), `url(#${id}-pole)`, steel),
        pc(rr(-90, -70, 180, 74, 30), `url(#${id}-ft)`, '#c9c2b4'),
        pc(rr(-34, -560, 92, 120, 22), `url(#${id}-st)`, steel),
      ]} />
      <path d={`M-14 -120 L-10 ${-H + 60}`} stroke={light(steel, 0.65)} strokeWidth={10} strokeLinecap="round" opacity={0.7} />
      <g transform={`translate(0 ${-H}) rotate(-7)`}>
        <Pass ow={ow} list={head} />
        {Array.from({length: rows}).map((_, r) => Array.from({length: per}).map((__, i) => {
          const fx = -bankW / 2 + (i + 0.5) * pitch;
          const tw = lit ? 0.8 + 0.2 * Math.sin(frame * 0.4 + i * 1.7 + r * 2.3 + seed) : 1;
          return <g key={`${r}-${i}`}>
            <ellipse cx={fx} cy={-r * 150 - 40} rx={46} ry={22} fill={lit ? lamp : '#dfe4f0'} opacity={lit ? tw : 1} />
            <ellipse cx={fx - 14} cy={-r * 150 - 92} rx={30} ry={9} fill="#ffffff" opacity={0.28} />
          </g>;
        }))}
      </g>
      {lit && <Glow x={0} y={-H - 120} r={bankW * 0.95} color={glow} opacity={0.65 * shimmer} />}
    </g>
  );
};

// ============================================================================ the bleachers

/**
 * THE BLEACHER STACK, from the field. A wide aluminium stack 7 m to the top row with aisle breaks and
 * a painted front wall in the school colour, a crowd of heads and shoulders in two colours, and the
 * press box on top at its own 3.2 m. The crowd rolls a slow wave on `frame` and the press box flag
 * flies. `concrete` is the older poured stand.
 */
export const BleachersV2: React.FC<TownPropsV2 & {rows?: number; pressBox?: boolean; concrete?: boolean; crowd?: number}> = (p) => {
  const {frame = 0, seed = 82, night = true, school = SCHOOL, rows = 14, pressBox = true, concrete = false, crowd = 0.8} = p;
  const id = useUid(), ow = owOf(p);
  const [c1, c2] = school;
  const W = 3000, H = 700, base = 110, alu = concrete ? '#d3cbbd' : '#c4cde0';
  const top = -H, pitch = (H - base) / rows;
  const aisles = [-0.3, 0, 0.3].map((u) => u * W);
  const stack = roundPoly([[-W / 2, 0], [-W / 2 + 60, top], [W / 2 - 60, top], [W / 2, 0]], [12, 60, 60, 12]);
  const bw = 1040, bh = 320;
  const flag = Math.sin(frame * 0.3 + seed) * 18;
  const crowdCols = [c1, c2, c1, '#8f9ab8', c2, '#5ab0e8'];
  const people: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    const y = -base - (r + 0.62) * pitch;
    for (let i = 0; i < 44; i++) {
      const x = -W / 2 + 90 + (i + 0.5 + (r % 2) * 0.4) * ((W - 180) / 44);
      if (aisles.some((a) => Math.abs(x - a) < 70)) continue;
      if (rnd(seed, r * 61 + i) > crowd) continue;
      if (pressBox && r > rows - 3 && Math.abs(x) < bw / 2 + 20) continue;
      const wave = Math.max(0, Math.sin(frame * 0.18 - x * 0.004)) ** 6;
      const up = wave * 26;
      const col = crowdCols[Math.floor(rnd(seed, 900 + r * 61 + i) * crowdCols.length)];
      const sk = SKINS[Math.floor(rnd(seed, 400 + r * 61 + i) * SKINS.length)];
      people.push(<g key={`${r}-${i}`} transform={`translate(${x.toFixed(1)} ${(y - up).toFixed(1)})`}>
        <path d={rr(-23, -14, 46, 30, 13)} fill={col} />
        <circle cx={0} cy={-26} r={13} fill={sk} />
        {wave > 0.4 && <path d="M-20 -10 L-30 -48 M20 -10 L30 -48" stroke={col} strokeWidth={10} strokeLinecap="round" />}
      </g>);
    }
  }
  return (
    <g transform={at(p)}>
      <defs>
        <Lit id={`${id}-a`} c={alu} v /><Lit id={`${id}-w`} c={c1} /><Lit id={`${id}-pb`} c="#f2ede2" v />
        <Lit id={`${id}-rf`} c={c1} v />
        <linearGradient id={`${id}-gl`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={night ? '#ffe9a8' : '#3d5aa8'} /><stop offset="100%" stopColor={night ? '#f6b85a' : '#1d2a66'} />
        </linearGradient>
        <clipPath id={`${id}-c`}><path d={stack} /></clipPath>
      </defs>
      <ContactShadow x={0} y={6} w={W * 1.1} opacity={0.3} />
      <Pass ow={ow} list={[
        pc(stack, `url(#${id}-a)`, alu),
        pc(rr(-W / 2 - 10, -base, W + 20, base, 26), `url(#${id}-w)`, c1),
        ...(pressBox ? [
          pc(rr(-bw / 2, top - bh, bw, bh + 30, 34), `url(#${id}-pb)`, '#f2ede2'),
          pc(rr(-bw / 2 - 50, top - bh - 60, bw + 100, 80, 36), `url(#${id}-rf)`, c1),
          pc(rr(-12, top - bh - 300, 24, 260, 12), '#d8dceb', '#d8dceb'),
        ] : []),
      ]} />
      <g clipPath={`url(#${id}-c)`}>
        {Array.from({length: rows}).map((_, r) => {
          const y = -base - (r + 1) * pitch;
          return <g key={r}>
            <rect x={-W / 2} y={y} width={W} height={pitch * 0.34} fill={light(alu, 0.5)} opacity={0.9} />
            <rect x={-W / 2} y={y + pitch * 0.34} width={W} height={pitch * 0.12} fill={shade(alu, 0.22)} opacity={0.6} />
          </g>;
        })}
        {aisles.map((a) => <g key={a}>
          <rect x={a - 60} y={top} width={120} height={H - base} fill={shade(alu, 0.12)} />
          <path d={`M${a} ${-base - 20} L${a} ${top + 40}`} stroke={line('#f2c84b')} strokeWidth={22} strokeLinecap="round" />
          <path d={`M${a} ${-base - 20} L${a} ${top + 40}`} stroke="#f2c84b" strokeWidth={12} strokeLinecap="round" />
        </g>)}
        {people}
        <rect x={-W / 2} y={top} width={W} height={60} fill="#ffffff" opacity={0.18} />
      </g>
      <path d={`M${-W / 2 + 40} ${-base * 0.55} L${W / 2 - 40} ${-base * 0.55}`} stroke={c2} strokeWidth={22} strokeLinecap="round" />
      <path d={`M${-W / 2 + 60} ${-base + 18} L${-W * 0.2} ${-base + 18}`} stroke="#ffffff" strokeWidth={12} strokeLinecap="round" opacity={0.35} />
      {pressBox && <g>
        <path d={rr(-bw / 2 + 50, top - bh + 70, bw - 100, bh * 0.42, 22)} fill={`url(#${id}-gl)`} />
        {[-0.25, 0, 0.25].map((u) => <path key={u} d={`M${u * bw} ${top - bh + 70} L${u * bw} ${top - bh + 70 + bh * 0.42}`}
          stroke="#f2ede2" strokeWidth={14} />)}
        <path d={`M${-bw / 2 + 80} ${top - bh + 92} L${-bw * 0.1} ${top - bh + 92}`} stroke="#ffffff" strokeWidth={14} strokeLinecap="round"
          opacity={0.45} />
        <path d={`M${-bw / 2} ${top - bh - 48} L${bw * 0.1} ${top - bh - 48}`} stroke={light(c1, 0.6)} strokeWidth={14} strokeLinecap="round"
          opacity={0.5} />
        <path d={`M12 ${top - bh - 290} Q90 ${top - bh - 280 + flag} 170 ${top - bh - 260 + flag * 1.4} L160 ${top - bh - 190 + flag}`
          + ` Q90 ${top - bh - 205 + flag * 0.6} 12 ${top - bh - 200} Z`} fill={c2} stroke={line(c2)} strokeWidth={ow * 1.6}
          strokeLinejoin="round" />
        <circle cx={0} cy={top - bh - 304} r={18} fill={BRASS} stroke={line(BRASS)} strokeWidth={ow * 1.4} />
      </g>}
    </g>
  );
};

// ============================================================================ the field

/**
 * THE FIELD from the press box side, in the library's screen frame (`w` by `depth` at `scale`). A
 * rounded track with lanes and a lip, mown stripes between the yard lines, end zones in the school
 * colour and the goal posts standing at both ends. Under the lights the green goes acid. A kickoff
 * ball arcs across on `frame` with its shadow under it.
 */
export const FieldV2: React.FC<TownPropsV2 & {w?: number; depth?: number; track?: boolean; turf?: boolean}> = (p) => {
  const {frame = 0, night = true, led = false, school = SCHOOL, w = 1000, depth = 300, track = true, turf = false} = p;
  const id = useUid();
  const s = p.scale ?? 1, ow = 3.4 / s;
  const green = night ? (led ? '#7fcf4a' : '#9ad13a') : (turf ? '#3fae55' : '#56b848');
  const red = '#d0583e', D = depth;
  const fieldPts: Pt[] = [[-w / 2, 0], [w / 2, 0], [w * 0.38, -D * 0.86], [-w * 0.38, -D * 0.86]];
  const field = roundPoly(fieldPts, 14);
  const trackPts: Pt[] = [[-w * 0.6, D * 0.06], [w * 0.6, D * 0.06], [w * 0.45, -D * 0.98], [-w * 0.45, -D * 0.98]];
  const trackD = roundPoly(trackPts, [D * 0.3, D * 0.3, D * 0.22, D * 0.22]);
  const lane = (k: number) => roundPoly(trackPts.map(([x, y]) => [x * k, (y + D * 0.46) * k - D * 0.46] as Pt),
    [D * 0.3 * k, D * 0.3 * k, D * 0.22 * k, D * 0.22 * k]);
  // a point on the field at u (0 left end to 1 right end) and v (0 near sideline to 1 far)
  const fp = (u: number, v: number): Pt => [lerp(-w / 2 + u * w, -w * 0.38 + u * w * 0.76, v), -D * 0.86 * v];
  const ez = 0.08;
  const t = (frame % 75) / 75;
  const ball = fp(0.2 + t * 0.55, 0.45 + t * 0.1);
  const hgt = Math.sin(t * Math.PI) * D * 0.7;
  const post = (u: number) => {
    const b = fp(u, 0.5), dir = u < 0.5 ? 1 : -1;
    const a = fp(u, 0.36), c = fp(u, 0.64);
    const lift = D * 0.16;
    return <g key={u}>
      <Tubes ow={ow * 0.8} list={[
        {d: `M${f1(b)} L${b[0]} ${b[1] - lift}`, c: '#ffd23f', w: 5},
        {d: `M${a[0]} ${a[1] - lift} L${c[0]} ${c[1] - lift}`, c: '#ffd23f', w: 5, h: true},
        {d: `M${a[0]} ${a[1] - lift} L${a[0]} ${a[1] - lift - D * 0.2}`, c: '#ffd23f', w: 4},
        {d: `M${c[0]} ${c[1] - lift} L${c[0]} ${c[1] - lift - D * 0.2}`, c: '#ffd23f', w: 4},
      ]} />
      <ellipse cx={b[0] + dir * 6} cy={b[1] + 2} rx={14} ry={4} fill="#1a1236" opacity={0.25} />
    </g>;
  };
  return (
    <g transform={`translate(${p.x ?? 0} ${p.y ?? 0}) scale(${s})`}>
      <defs>
        <linearGradient id={`${id}-t`} x1="0" y1="0" x2="0.3" y2="1"><stop offset="0%" stopColor={light(red, 0.25)} />
          <stop offset="100%" stopColor={shade(red, 0.2)} /></linearGradient>
        <linearGradient id={`${id}-l`} x1="0" y1="0" x2="1" y2="0.6"><stop offset="0%" stopColor="#ffffff" stopOpacity={0.22} />
          <stop offset="55%" stopColor="#ffffff" stopOpacity={0} /><stop offset="100%" stopColor={shade(green, 0.6)} stopOpacity={0.25} />
        </linearGradient>
        <Lit id={`${id}-ez`} c={school[0]} />
        <clipPath id={`${id}-c`}><path d={field} /></clipPath>
      </defs>
      {track && <>
        <path d={trackD} transform={`translate(0 ${D * 0.035})`} fill={shade(red, 0.45)} stroke={line(red)} strokeWidth={ow * 2}
          strokeLinejoin="round" />
        <path d={trackD} fill={`url(#${id}-t)`} stroke={line(red)} strokeWidth={ow * 2} strokeLinejoin="round" />
        {[0.95, 0.9].map((k) => <path key={k} d={lane(k)} fill="none" stroke="#ffffff" strokeWidth={1.6} opacity={0.55} />)}
      </>}
      <path d={field} fill={green} stroke={line(green)} strokeWidth={ow * 2} strokeLinejoin="round" />
      <g clipPath={`url(#${id}-c)`}>
        {Array.from({length: 10}).map((_, i) => {
          const u0 = ez + i * (1 - ez * 2) / 10, u1 = u0 + (1 - ez * 2) / 10;
          return i % 2 ? <path key={i} d={`M${f1(fp(u0, 0))} L${f1(fp(u1, 0))} L${f1(fp(u1, 1))} L${f1(fp(u0, 1))} Z`}
            fill={light(green, 0.18)} /> : null;
        })}
        {[0, 1 - ez].map((u0) => <path key={u0} d={`M${f1(fp(u0, 0))} L${f1(fp(u0 + ez, 0))} L${f1(fp(u0 + ez, 1))} L${f1(fp(u0, 1))} Z`}
          fill={`url(#${id}-ez)`} />)}
        {[0.03, 0.97].map((u) => <path key={u} d={`M${f1(fp(u - 0.012, 0.3))} L${f1(fp(u + 0.012, 0.3))} L${f1(fp(u + 0.012, 0.7))}`
          + ` L${f1(fp(u - 0.012, 0.7))} Z`} fill={school[1]} opacity={0.8} />)}
        {Array.from({length: 21}).map((_, i) => {
          const u = ez + i * (1 - ez * 2) / 20;
          return <path key={i} d={`M${f1(fp(u, 0))} L${f1(fp(u, 1))}`} stroke="#ffffff" strokeWidth={i === 10 ? 4.5 : i % 2 ? 1.6 : 3}
            opacity={i % 2 ? 0.6 : 0.95} strokeLinecap="round" />;
        })}
        {[0.36, 0.64].map((v) => Array.from({length: 21}).map((_, i) => {
          const u = ez + i * (1 - ez * 2) / 20 + (1 - ez * 2) / 40;
          const a = fp(u, v), b = fp(u, v + 0.03);
          return <path key={`${v}-${i}`} d={`M${f1(a)} L${f1(b)}`} stroke="#ffffff" strokeWidth={2} opacity={0.7} strokeLinecap="round" />;
        }))}
        <circle cx={fp(0.5, 0.5)[0]} cy={fp(0.5, 0.5)[1]} r={D * 0.07} fill={school[0]} stroke="#ffffff" strokeWidth={2.5} />
        <path d={field} fill={`url(#${id}-l)`} />
        <path d={`M${f1(fp(0.08 + ((frame * 0.004) % 1), 0))} l${w * 0.05} 0 l${-w * 0.02} ${-D}`} stroke="#ffffff" strokeWidth={w * 0.03}
          opacity={0.08} />
      </g>
      {post(0.005)}{post(0.995)}
      <ellipse cx={ball[0]} cy={ball[1] + 3} rx={7} ry={2.5} fill="#1a1236" opacity={0.3 * (1 - hgt / D)} />
      <g transform={`translate(${ball[0]} ${ball[1] - hgt}) rotate(${frame * 22})`}>
        <ellipse rx={9} ry={5.5} fill="#a8552e" stroke={line('#a8552e')} strokeWidth={ow} />
        <path d="M-3 0 L3 0" stroke="#ffffff" strokeWidth={1.4} strokeLinecap="round" />
      </g>
    </g>
  );
};

// ============================================================================ the band

type BandKind = 'horn' | 'sousa' | 'major';
/**
 * One bandsman at true size, feet at (0, 0), facing the press box. Attached arms by two-bone reach, a
 * shako wider at the top with its visor down and chin strap on the chin, a plume as tall as the hat
 * again, and the horn up. `face` full gives the hero face (whites, pupils, catchlight, brows, mouth).
 */
const Bandsman: React.FC<{frame: number; ow: number; uniform: string; braid: string; skin: string; seed: number; kind: BandKind;
  corps?: boolean; face?: 'dots' | 'full'; fade?: number; phase: number}> = ({
  frame, ow, uniform, braid, skin, seed, kind, corps = false, face = 'dots', fade = 0, phase,
}) => {
  const id = useUid();
  const haze = '#cfd2ee';
  const u = mix(uniform, haze, fade), g = mix(braid, haze, fade), sk = mix(skin, haze, fade * 0.8), br = mix(BRASS, haze, fade * 0.5);
  const major = kind === 'major';
  const jacket = major ? mix('#f7f4ee', haze, fade) : u;
  const pants = shade(u, 0.12);
  const liftL = Math.max(0, Math.sin(phase)) * 14, liftR = Math.max(0, -Math.sin(phase)) * 14;
  const bob = Math.abs(Math.cos(phase)) * 2.4;
  const blink = (frame + seed * 17) % 97 < 4;
  const sway = Math.sin(phase + 0.6) * 5;
  const shL: Pt = [-19, -140 + bob], shR: Pt = [19, -140 + bob];
  // the hands, with the horn up at the mouth, the sousaphone at the valves, the drum major conducting with the mace
  const beat = Math.sin(frame * 2 * Math.PI / 20);
  const tR: Pt = kind === 'horn' ? [17, -150 + bob] : kind === 'sousa' ? [12, -126 + bob] : [36 + beat * 4, -182 + beat * 10 + bob];
  const tL: Pt = kind === 'horn' ? [8, -146 + bob] : kind === 'sousa' ? [-12, -114 + bob] : [-34, -104 + bob];
  const armR = ik(shR, tR, 28, 27, kind === 'major' ? -1 : 1), armL = ik(shL, tL, 28, 27, kind === 'major' ? 1 : -1);
  const limb = (s: Pt, e: Pt, h: Pt) => taper([s, [(s[0] + e[0]) / 2, (s[1] + e[1]) / 2], e, [(e[0] + h[0]) / 2, (e[1] + h[1]) / 2], h], 14, 10);
  const torso = roundPoly([[-23, -148 + bob], [23, -148 + bob], [19, -84], [-19, -84]], 11);
  const legs: Pc[] = [
    pc(taper([[-9, -90], [-10, -40 - liftL * 0.5], [-10, -10 - liftL]], 18, 14), pants, pants),
    pc(taper([[9, -90], [10, -40 - liftR * 0.5], [10, -10 - liftR]], 18, 14), pants, pants),
    pc(ellipse(-11, -7 - liftL, 11, 7), INKY, INKY), pc(ellipse(11, -7 - liftR, 11, 7), INKY, INKY),
  ];
  const hy = -160 + bob;
  const shako = roundPoly([[-12.5, hy - 8], [12.5, hy - 8], [14.5, hy - 34], [-14.5, hy - 34]], 4);
  const plumeT = `rotate(${sway} 0 ${hy - 34})`;
  const plume = `M0 ${hy - 33} C-8 ${hy - 42} -7 ${hy - 62} 0 ${hy - 74} C7 ${hy - 62} 8 ${hy - 42} 0 ${hy - 33} Z`;
  const body: Pc[] = [
    ...(major ? [pc(`M-24 ${-146 + bob} L24 ${-146 + bob} Q${30 + sway} -110 ${32 + sway * 1.4} -80 L${-32 + sway * 1.4} -80 Q${-30 + sway} -110 -24 ${-146 + bob} Z`,
      g, braid)] : []),
    ...(kind === 'sousa' ? [tb(ellipse(0, -114 + bob, 32, 30), br, 8)] : []),
    ...legs,
    pc(torso, `url(#${id}-u)`, jacket),
    pc(limb(shL, armL.e, armL.h), jacket, jacket), pc(limb(shR, armR.e, armR.h), jacket, jacket),
    pc(rr(-5.5, hy + 4, 11, 12, 4), sk, skin),
  ];
  const headList: Pc[] = [
    pc(ellipse(0, hy, 13, 13.5), `url(#${id}-s)`, skin),
    ...(corps ? [] : [pc(shako, `url(#${id}-k)`, major ? '#f7f4ee' : u), pc(plume, major ? braid : '#ffffff', major ? braid : '#ffffff', plumeT)]),
  ];
  const hs = major ? 1.3 : 1.12;
  const headT = `translate(0 ${hy + 12}) scale(${hs}) translate(0 ${-(hy + 12)})`;
  const mace = major ? (() => {
    const a = (18 + beat * 10) * Math.PI / 180, h = armR.h;
    const top: Pt = [h[0] + Math.sin(a) * 78, h[1] - Math.cos(a) * 78], bot: Pt = [h[0] - Math.sin(a) * 22, h[1] + Math.cos(a) * 22];
    return {top, bot};
  })() : null;
  return (
    <g>
      <defs><Lit id={`${id}-u`} c={jacket} /><Lit id={`${id}-k`} c={major ? '#f7f4ee' : u} v /><radialGradient id={`${id}-s`} cx="38%" cy="32%" r="75%">
        <stop offset="0%" stopColor={light(sk, 0.35)} /><stop offset="100%" stopColor={shade(sk, 0.18)} /></radialGradient></defs>
      <ellipse cx={0} cy={1} rx={28} ry={6} fill="#1a1236" opacity={0.22 * (1 - fade)} />
      {mace && <Pass ow={ow} list={[tb(`M${f1(mace.bot)} L${f1(mace.top)}`, '#dfe3ee', 4.5)]} />}
      <Pass ow={ow} list={body} />
      {/* jacket trim, a braid sash, epaulettes and buttons */}
      <path d={`M-16 ${-143 + bob} L15 -90`} stroke={major ? u : g} strokeWidth={6} strokeLinecap="round" />
      {[shL, shR].map((s, i) => <ellipse key={i} cx={s[0]} cy={s[1] - 2} rx={8} ry={4.5} fill={g} stroke={line(g)} strokeWidth={ow * 0.7} />)}
      <path d={`M-10 ${-145 + bob} Q0 ${-138 + bob} 10 ${-145 + bob}`} stroke={g} strokeWidth={4} fill="none" strokeLinecap="round" />
      {[0, 1, 2].map((i) => <circle key={i} cx={-9} cy={-128 + i * 13 + bob} r={2.2} fill={g} />)}
      {[[-10, liftL], [10, liftR]].map(([x, l], i) => <path key={i} d={rr(x - 8, -24 - l, 16, 10, 4)} fill="#ffffff" />)}
      <g transform={headT}>
      <Pass ow={ow / hs} list={headList} />
      {/* the face */}
      {face === 'full' ? <g>
        {blink ? <><path d={`M-8.5 ${hy + 1.5} q3.5 2.5 7 0`} stroke={INKY} strokeWidth={1.6} fill="none" strokeLinecap="round" />
          <path d={`M1.5 ${hy + 1.5} q3.5 2.5 7 0`} stroke={INKY} strokeWidth={1.6} fill="none" strokeLinecap="round" /></>
          : [-5, 5].map((x) => <g key={x}><ellipse cx={x} cy={hy + 1.5} rx={3.4} ry={4} fill="#ffffff" stroke={line(skin)} strokeWidth={0.7} />
            <circle cx={x + 0.5} cy={hy + 2} r={2.3} fill="#1f1736" /><circle cx={x - 0.4} cy={hy + 0.7} r={0.9} fill="#ffffff" /></g>)}
        <path d={`M-8.5 ${hy - 3.6} L-2.5 ${hy - 4.2} M2.5 ${hy - 4.2} L8.5 ${hy - 3.6}`} stroke={shade(skin, 0.55)} strokeWidth={1.3} strokeLinecap="round" />
        <path d={`M-3.6 ${hy + 7.4} Q0 ${hy + 10.5 + Math.max(0, beat) * 1.5} 3.6 ${hy + 7.4}`} stroke={line(skin)} strokeWidth={1.2} fill="#7a2a3a"
          strokeLinecap="round" />
        {[-8.4, 8.4].map((x) => <circle key={x} cx={x} cy={hy + 6} r={2.4} fill="#ff6b8a" opacity={0.3} />)}
      </g> : (blink ? <path d={`M-7 ${hy + 1} l4 0 M3 ${hy + 1} l4 0`} stroke={INKY} strokeWidth={1.6} strokeLinecap="round" />
        : <>{[-4.8, 4.8].map((x) => <ellipse key={x} cx={x} cy={hy + 1} rx={2} ry={2.6} fill="#1f1736" />)}</>)}
      {corps && <path d={`M-13 ${hy - 2} Q-12 ${hy - 16} 0 ${hy - 15} Q12 ${hy - 16} 13 ${hy - 2} Q8 ${hy - 10} 0 ${hy - 10} Q-8 ${hy - 10} -13 ${hy - 2} Z`}
        fill="#2b1a12" />}
      {!corps && <g>
        <path d={rr(-12.5, hy - 14, 25, 5, 2.5)} fill={g} />
        <circle cx={0} cy={hy - 22} r={4.6} fill={g} stroke={line(g)} strokeWidth={0.8} />
        <path d={`M-14 ${hy - 8.5} Q0 ${hy - 4} 14 ${hy - 8.5} L13 ${hy - 6} Q0 ${hy - 1} -13 ${hy - 6} Z`} fill="#1d1a33" />
        <path d={`M-12 ${hy - 6} Q0 ${hy + 32} 12 ${hy - 6}`} stroke={g} strokeWidth={1.4} fill="none" />
        <ellipse cx={0} cy={hy - 34} rx={14.5} ry={3.4} fill={light(major ? '#f7f4ee' : u, 0.35)} />
        <path d={`M-9 ${hy - 30} L-10 ${hy - 14}`} stroke="#ffffff" strokeWidth={2.4} strokeLinecap="round" opacity={0.35} />
      </g>}
      {/* the horn, brass hot under the lights */}
      {kind === 'horn' && <g>
        <Pass ow={ow / hs} list={[
          tb(`M4 ${hy + 9} L28 ${hy + 9}`, br, 4.6),
          pc(roundPoly([[25, hy + 6], [40, hy - 2], [40, hy + 20], [25, hy + 12]], 2.5), br, BRASS),
          pc(rr(12, hy + 2, 9, 7, 2.5), shade(br, 0.15), BRASS),
        ]} />
        <ellipse cx={40} cy={hy + 9} rx={3.4} ry={9.4} fill={shade(br, 0.42)} />
        <path d={`M8 ${hy + 7.4} L34 ${hy + 4}`} stroke="#fff6cf" strokeWidth={1.6} strokeLinecap="round" />
      </g>}
      </g>
      {kind === 'sousa' && <g>
        <defs><radialGradient id={`${id}-b`} cx="40%" cy="38%" r="70%"><stop offset="0%" stopColor={shade(br, 0.45)} />
          <stop offset="62%" stopColor={shade(br, 0.25)} /><stop offset="64%" stopColor={light(br, 0.4)} /><stop offset="100%" stopColor={br} />
        </radialGradient></defs>
        <Pass ow={ow} list={[tb(`M22 ${-128 + bob} Q30 ${-170 + bob} 20 ${hy - 26}`, br, 6), pc(ellipse(20, hy - 42, 27, 25), `url(#${id}-b)`, BRASS)]} />
        <path d={`M-22 ${-124 + bob} Q-30 ${-104 + bob} -16 ${-86 + bob}`} stroke="#fff6cf" strokeWidth={2.4} fill="none" strokeLinecap="round" />
      </g>}
      {[armL.h, armR.h].map((h, i) => <circle key={i} cx={h[0]} cy={h[1]} r={5.4} fill="#ffffff" stroke={line('#e8ecf6')} strokeWidth={ow} />)}
      {mace && <circle cx={mace.top[0]} cy={mace.top[1]} r={8} fill={g} stroke={line(g)} strokeWidth={ow} />}
    </g>
  );
};

/**
 * THE MARCHING BLOCK. The drill form is the drawing. Ranks of bandsmen in an arc, a block or a scatter,
 * front rank biggest, back ranks smaller, higher and paler. Everyone steps on the same beat, the
 * plumes sway, and the first few are sousaphones, the biggest brass circle in the frame.
 */
export const MarchingBlockV2: React.FC<TownPropsV2 & {ranks?: number; files?: number; form?: 'block' | 'arc' | 'scatter';
  spread?: number; corps?: boolean; sousaphones?: number}> = (p) => {
  const {frame = 0, seed = 84, school = BAND, ranks = 6, files = 14, form = 'arc', spread = 1300, corps = false, sousaphones = 4} = p;
  const ow = owOf(p);
  const phase = frame * 2 * Math.PI / 30;
  const out: React.ReactNode[] = [];
  for (let r = ranks - 1; r >= 0; r--) {
    const k = 1 - r * 0.05;
    for (let f = 0; f < files; f++) {
      const i = r * files + f, uu = files > 1 ? f / (files - 1) - 0.5 : 0;
      const bow = form === 'arc' ? (Math.abs(uu) * 2) ** 2 * spread * 0.07 : 0;
      const jx = form === 'scatter' ? (rnd(seed, i) - 0.5) * 70 : 0, jy = form === 'scatter' ? (rnd(seed, 500 + i) - 0.5) * 50 : 0;
      const x = uu * spread * (1 - r * 0.04) + jx, y = -r * 66 - bow + jy;
      out.push(<g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${k})`}>
        <Bandsman frame={frame} ow={ow * 0.6 / k} uniform={school[0]} braid={school[1]} skin={SKINS[Math.floor(rnd(seed, 70 + i) * SKINS.length)]}
          seed={seed + i} kind={r === 0 && f >= files - sousaphones ? 'sousa' : 'horn'} corps={corps} fade={r * 0.09} phase={phase} />
      </g>);
    }
  }
  return (
    <g transform={at(p)}>
      <ContactShadow x={0} y={4} w={spread * 1.15} opacity={0.24} />
      {out}
    </g>
  );
};

/**
 * THE DRUM MAJOR PODIUM. A round-tubed A-frame 1.6 m up with a platform in the school colour, and the
 * drum major on it in a white jacket and a gold cape, conducting with the mace on the beat. The hero
 * of the band gets the full face.
 */
export const DrumMajorStandV2: React.FC<TownPropsV2 & {occupied?: boolean}> = (p) => {
  const {frame = 0, school = BAND, occupied = true, seed = 85} = p;
  const id = useUid(), ow = owOf(p);
  const steel = '#9fabcc', P = 160;
  return (
    <g transform={at(p)}>
      <defs><Lit id={`${id}-p`} c={school[0]} v /></defs>
      <ContactShadow x={0} y={4} w={200} opacity={0.32} />
      <Tubes ow={ow} list={[
        {d: `M-58 -6 L-22 ${-P}`, c: steel, w: 9}, {d: `M58 -6 L22 ${-P}`, c: steel, w: 9},
        ...[0.2, 0.42, 0.64, 0.86].map((t) => ({d: `M${-58 + 36 * t} ${-6 - (P - 6) * t} L${58 - 36 * t} ${-6 - (P - 6) * t}`, c: steel, w: 6, h: true})),
      ]} />
      {[-58, 58].map((x) => <path key={x} d={rr(x - 10, -10, 20, 10, 5)} fill={INKY} />)}
      <Pass ow={ow} list={[pc(rr(-44, -P - 14, 88, 18, 8), `url(#${id}-p)`, school[0])]} />
      <path d={`M-36 ${-P - 10} L20 ${-P - 10}`} stroke="#ffffff" strokeWidth={3} strokeLinecap="round" opacity={0.45} />
      {occupied && <g transform={`translate(0 ${-P - 14})`}>
        <Bandsman frame={frame} ow={ow} uniform={school[0]} braid={school[1]} skin={SKINS[2]} seed={seed} kind="major" face="full"
          phase={0} />
      </g>}
    </g>
  );
};

// ============================================================================ the mum

/**
 * THE HOMECOMING MUM. A halo of ribbon loops around a cream pom of narrow petals, one to three of them
 * (`tier`), and the curtain of satin streamers hanging most of its 95 cm with trinkets on them and the
 * cowbells at the bottom. A triple hangs from a wide neck ribbon. The whole thing sways and the bells
 * swing on `frame`.
 */
export const HomecomingMumV2: React.FC<TownPropsV2 & {tier?: 1 | 2 | 3; streamers?: number; bells?: number; boa?: boolean;
  trinkets?: number}> = (p) => {
  const {frame = 0, seed = 86, school = SCHOOL, tier = 2, streamers = 12, bells = 3, boa = false, trinkets = 8} = p;
  const id = useUid(), ow = owOf(p);
  const [c1, c2] = school;
  const R = 15, pitch = R * 2.7, cy = -73;
  const sway = Math.sin(frame / 21) * 2.2;
  const xs = Array.from({length: tier}, (_, t) => (t - (tier - 1) / 2) * pitch);
  const half = (tier - 1) / 2 * pitch + R * 1.3;
  const n = Math.min(30, streamers * tier);
  const gold = '#f2c14e';
  const ribbons = Array.from({length: n}, (_, i) => {
    const x0 = n > 1 ? -half * 0.85 + (i / (n - 1)) * half * 1.7 : 0;
    const len = 46 + rnd(seed, 40 + i) * 22;
    const sw = Math.sin(frame / 17 + i * 0.7) * (2 + len * 0.05);
    const col = i % 3 === 0 ? c2 : i % 3 === 1 ? c1 : gold;
    const end: Pt = [x0 + sw, cy + 8 + len];
    return {x0, len, sw, col, end, d: `M${x0} ${cy + 8} Q${x0 + sw * 0.4} ${cy + 8 + len * 0.55} ${f1(end)}`};
  });
  const onRibbon = (i: number, t: number): Pt => {
    const r = ribbons[i % ribbons.length], u = 1 - t;
    const c: Pt = [r.x0 + r.sw * 0.4, cy + 8 + r.len * 0.55];
    return [u * u * r.x0 + 2 * u * t * c[0] + t * t * r.end[0], u * u * (cy + 8) + 2 * u * t * c[1] + t * t * r.end[1]];
  };
  const loops = (ox: number, rr0: number, count: number, col: string) => Array.from({length: count}, (_, i) => {
    const a = (i / count) * 360;
    const rad = a * Math.PI / 180;
    return pc(ellipse(0, 0, R * 0.36, R * 0.22), `url(#${id}-${col === c1 ? 'a' : 'b'})`, col,
      `translate(${(ox + Math.cos(rad) * R * rr0).toFixed(2)} ${(cy + Math.sin(rad) * R * rr0).toFixed(2)}) rotate(${a})`);
  });
  return (
    <g transform={at(p)}>
      <defs>
        <Lit id={`${id}-a`} c={c1} /><Lit id={`${id}-b`} c={c2} />
        <radialGradient id={`${id}-pom`} cx="36%" cy="32%" r="80%"><stop offset="0%" stopColor="#fffdf6" /><stop offset="60%" stopColor="#f6eedb" />
          <stop offset="100%" stopColor={shade('#f6eedb', 0.22)} /></radialGradient>
        <Lit id={`${id}-g`} c={gold} />
      </defs>
      <ContactShadow x={0} y={4} w={half * 2.2} opacity={0.18} />
      <g transform={`rotate(${sway} 0 -95)`}>
        {tier >= 3 && <Pass ow={ow} list={[pc(`M${-R * 2.2} ${cy - 4} L${-R * 1.1} -99 Q0 -104 ${R * 1.1} -99 L${R * 2.2} ${cy - 4} Z`, c1, c1)]} />}
        {/* the curtain, behind the flowers */}
        {ribbons.map((r, i) => <g key={i}>
          <path d={r.d} stroke={line(r.col)} strokeWidth={4 + ow * 2} fill="none" strokeLinecap="round" />
          <path d={r.d} stroke={r.col} strokeWidth={4} fill="none" strokeLinecap="round" />
          <path d={r.d} transform="translate(-0.9 0)" stroke="#ffffff" strokeWidth={1} fill="none" strokeLinecap="round" opacity={0.5} />
        </g>)}
        {Array.from({length: trinkets}, (_, i) => {
          const q = onRibbon(i * 3 + 1, 0.3 + rnd(seed, 110 + i) * 0.5), kind = i % 3;
          return <g key={i} transform={`translate(${f1(q)})`}>
            {kind === 0 && <><ellipse rx={4.4} ry={2.8} fill="#a8552e" stroke={line('#a8552e')} strokeWidth={ow} />
              <path d="M-1.6 0 L1.6 0" stroke="#ffffff" strokeWidth={0.7} /></>}
            {kind === 1 && <path d={roundPoly(Array.from({length: 10}, (_, k) => {
              const a = -Math.PI / 2 + k * Math.PI / 5, rad = k % 2 ? 2 : 4.6;
              return [Math.cos(a) * rad, Math.sin(a) * rad] as Pt;
            }), 0.8)} fill={gold} stroke={line(gold)} strokeWidth={ow} />}
            {kind === 2 && <circle r={3.2} fill={c2} stroke={line(c2)} strokeWidth={ow} />}
          </g>;
        })}
        {Array.from({length: bells}, (_, i) => {
          const q = onRibbon(Math.round(((i + 0.5) / bells) * (ribbons.length - 1)), 1);
          const sw = Math.sin(frame / 9 + i * 1.9) * 14;
          return <g key={i} transform={`translate(${f1(q)}) rotate(${sw})`}>
            <Pass ow={ow} list={[pc(roundPoly([[-2.6, 0], [2.6, 0], [4.4, 7.4], [-4.4, 7.4]], 1.4), `url(#${id}-g)`, gold)]} />
            <circle cx={0} cy={8.4} r={1.4} fill={shade(gold, 0.5)} />
            <path d="M-2 1.6 L-2.8 6" stroke="#ffffff" strokeWidth={0.8} strokeLinecap="round" opacity={0.6} />
          </g>;
        })}
        {xs.map((ox, t) => <g key={t}>
          {boa && <circle cx={ox} cy={cy} r={R * 1.75} fill={light(c2, 0.2)} opacity={0.7} />}
          <Pass ow={ow} list={[...loops(ox, 1.3, 16, c2), ...loops(ox, 1.06, 14, c1), pc(ellipse(ox, cy, R * 0.98, R * 0.98), `url(#${id}-pom)`, '#e8dcc0')]} />
          {[[0.78, 20, 0], [0.55, 15, 8], [0.32, 10, 4]].map(([rad, cnt, off], ri) => Array.from({length: cnt}, (_, k) => {
            const a = (k / cnt) * 360 + off * 3;
            return <ellipse key={`${ri}-${k}`} cx={0} cy={0} rx={R * 0.17} ry={R * 0.07}
              transform={`translate(${(ox + Math.cos(a * Math.PI / 180) * R * rad).toFixed(2)} ${(cy + Math.sin(a * Math.PI / 180) * R * rad).toFixed(2)}) rotate(${a})`}
              fill={(k + ri) % 3 ? '#fffaf0' : '#efe4cc'} stroke="#dccfb2" strokeWidth={0.25} />;
          }))}
          <circle cx={ox} cy={cy} r={R * 0.16} fill={c1} />
          <ellipse cx={ox - R * 0.38} cy={cy - R * 0.45} rx={R * 0.3} ry={R * 0.16} fill="#ffffff" opacity={0.55} />
        </g>)}
      </g>
    </g>
  );
};

// ============================================================================ the portable

/**
 * THE PORTABLE CLASSROOM. A long low box 3.4 m to the eave, up on blocks with a skirt, small windows
 * high on the wall, a steel door at one end with a ramp and a pipe rail, and the wall unit with its
 * fan turning. `rain` sends a steady drizzle down the front.
 */
export const PortableClassroomV2: React.FC<TownPropsV2 & {ramp?: boolean; windows?: number; rain?: boolean}> = (p) => {
  const {frame = 0, seed = 87, night = false, ramp = true, windows = 3, rain = false, school = SCHOOL} = p;
  const id = useUid(), ow = owOf(p);
  const L = 1284, E = 340, lift = 36, tan = '#e9cf98', roof = '#eef0f6', steel = '#b6bfd4';
  const glass = night ? '#ffe7a3' : '#3d5aa8';
  const doorX = -L * 0.47;
  const fan = frame * 18;
  return (
    <g transform={at(p)}>
      <defs><Lit id={`${id}-w`} c={tan} /><Lit id={`${id}-r`} c={roof} v /><Lit id={`${id}-d`} c={school[0]} />
        <Lit id={`${id}-h`} c="#c4cad8" />
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0.3" y2="1"><stop offset="0%" stopColor={light(glass, 0.35)} />
          <stop offset="100%" stopColor={shade(glass, 0.3)} /></linearGradient>
      </defs>
      <ContactShadow x={ramp ? -L * 0.12 : 0} y={6} w={L * (ramp ? 1.6 : 1.25)} opacity={0.3} />
      {Array.from({length: 6}).map((_, i) => <path key={i} d={rr(-L * 0.45 + i * L * 0.18 - 22, -lift - 4, 44, lift + 4, 6)} fill="#8d8aa0"
        stroke={line('#8d8aa0')} strokeWidth={ow * 2} />)}
      <path d={rr(-L / 2 + 30, -lift, L - 60, lift - 4, 6)} fill={shade(tan, 0.45)} opacity={0.75} />
      <Pass ow={ow} list={[
        pc(rr(-L / 2, -E, L, E - lift, 18), `url(#${id}-w)`, tan),
        pc(rr(-L / 2 - 30, -E - 34, L + 60, 46, 22), `url(#${id}-r)`, roof),
        pc(rr(L * 0.4, -230, 106, 128, 18), `url(#${id}-h)`, '#c4cad8'),
        pc(rr(doorX, -300, 124, 300 - lift, 14), `url(#${id}-d)`, school[0]),
      ]} />
      {Array.from({length: 8}).map((_, i) => <path key={i} d={`M${-L / 2 + 20} ${-E + 40 + i * 34} L${L / 2 - 20} ${-E + 40 + i * 34}`}
        stroke={shade(tan, 0.2)} strokeWidth={3} opacity={0.5} />)}
      <path d={`M${-L / 2 + 40} ${-E + 26} L${L * 0.1} ${-E + 26}`} stroke="#ffffff" strokeWidth={10} strokeLinecap="round" opacity={0.35} />
      <path d={`M${-L / 2 + 20} ${-E - 22} L${L * 0.2} ${-E - 22}`} stroke="#ffffff" strokeWidth={10} strokeLinecap="round" opacity={0.6} />
      {Array.from({length: windows}).map((_, i) => {
        const wx = -L * 0.3 + i * L * 0.22;
        return <g key={i}>
          <path d={rr(wx - 6, -E + 44, 196, 92, 16)} fill="#fbf7ee" stroke={line('#fbf7ee')} strokeWidth={ow * 2} />
          <path d={rr(wx + 6, -E + 56, 172, 68, 10)} fill={`url(#${id}-g)`} />
          <path d={`M${wx + 92} ${-E + 56} L${wx + 92} ${-E + 124}`} stroke="#fbf7ee" strokeWidth={8} />
          <path d={`M${wx + 22} ${-E + 72} L${wx + 60} ${-E + 72}`} stroke="#ffffff" strokeWidth={8} strokeLinecap="round" opacity={0.5} />
        </g>;
      })}
      <path d={rr(doorX + 34, -270, 56, 66, 10)} fill={`url(#${id}-g)`} stroke={line(school[0])} strokeWidth={ow} />
      <path d={rr(doorX + 92, -170, 22, 10, 5)} fill="#e8ecf6" />
      <g transform={`translate(${L * 0.4 + 53} -166)`}>
        <circle r={42} fill={shade('#c4cad8', 0.35)} />
        <g transform={`rotate(${fan})`}>{[0, 120, 240].map((a) => <path key={a} transform={`rotate(${a})`} d="M0 -4 C14 -10 26 -26 10 -36 C2 -30 -2 -16 0 -4 Z"
          fill="#e8ecf6" />)}</g>
        <circle r={8} fill="#7c84a0" />
        {[-28, -14, 0, 14, 28].map((y) => <path key={y} d={`M-40 ${y} L40 ${y}`} stroke={shade('#c4cad8', 0.1)} strokeWidth={3} opacity={0.7} />)}
      </g>
      {ramp && <g>
        <Pass ow={ow} list={[pc(roundPoly([[doorX + 130, -lift - 6], [doorX + 130, -lift + 22], [-L * 0.86, 4], [-L * 0.86, -18], [doorX - 60, -lift - 6]],
          8), '#b1aaa0', '#b1aaa0')]} />
        <Tubes ow={ow} list={[
          {d: `M${doorX - 40} ${-lift - 110} L${-L * 0.84} ${-110}`, c: steel, w: 12, h: true},
          ...[0, 0.33, 0.66, 1].map((t) => {
            const x = lerp(doorX - 40, -L * 0.84, t), y = lerp(-lift - 6, -14, t);
            return {d: `M${x} ${y} L${x} ${y - 104}`, c: steel, w: 9};
          }),
        ]} />
      </g>}
      {rain && Array.from({length: 46}).map((_, i) => {
        const x = -L * 0.7 + rnd(seed, i) * L * 1.4, span = E + 300;
        const y = ((rnd(seed, 50 + i) * span + frame * 34) % span) - E - 260;
        return <path key={i} d={`M${x} ${y} l-10 46`} stroke="#9fc2ff" strokeWidth={7} strokeLinecap="round" opacity={0.55} />;
      })}
    </g>
  );
};

// ============================================================================ the marquee

/**
 * THE SCHOOL MARQUEE. A rounded backlit cabinet on a brick base with a stone cap, a header band in the
 * school colour with a star, and rows of changeable letters drawn as tiles, never words. One letter
 * hangs crooked and swings, and at night the panel glows.
 */
export const SchoolMarqueeV2: React.FC<TownPropsV2 & {lines?: number; brick?: boolean}> = (p) => {
  const {frame = 0, seed = 88, night = false, school = SCHOOL, lines = 3, brick = true} = p;
  const id = useUid(), ow = owOf(p);
  const [c1] = school;
  const bricks = '#cc5f3f', stone = '#efe2c6', panel = night ? '#fff3c9' : '#fbf8f0';
  const cw = 390, top = -260, cb = -128;
  const tiles: React.ReactNode[] = [];
  for (let l = 0; l < lines; l++) {
    const words = 2 + Math.floor(rnd(seed, l) * 3);
    const lens = Array.from({length: words}, (_, k) => 3 + Math.floor(rnd(seed, 10 + l * 7 + k) * 5));
    const total = lens.reduce((a, b) => a + b, 0) * 15 + (words - 1) * 14;
    let x = -Math.min(total, 330) / 2;
    const y = top + 52 + l * 25;
    lens.forEach((n, k) => {
      for (let j = 0; j < n && x < 168; j++) {
        const loose = l === 1 && k === 0 && j === 1;
        const jy = (rnd(seed, 200 + l * 40 + k * 9 + j) - 0.5) * 3;
        tiles.push(<path key={`${l}-${k}-${j}`} d={rr(-5.5, 0, 11, 17, 3)} fill="#2a2142"
          transform={`translate(${(x + 5.5).toFixed(1)} ${(y + jy).toFixed(1)}) rotate(${loose ? 14 + Math.sin(frame / 11) * 9 : 0} -5 0)`} />);
        x += 15;
      }
      x += 14;
    });
  }
  const star = roundPoly(Array.from({length: 10}, (_, k) => {
    const a = -Math.PI / 2 + k * Math.PI / 5, rad = k % 2 ? 6.5 : 15;
    return [Math.cos(a) * rad, top + 19 + Math.sin(a) * rad] as Pt;
  }), 1.6);
  const shrub = (x: number, k: number) => [[-26, 0, 26], [0, -14, 32], [26, 0, 24]].map(([dx, dy, r]) =>
    pc(ellipse(x + dx * k, -r * k * 0.8 + dy * k, r * k, r * k * 0.85), `url(#${id}-sh)`, '#4caf5a'));
  return (
    <g transform={at(p)}>
      <defs><Lit id={`${id}-br`} c={bricks} /><Lit id={`${id}-st`} c={stone} v /><Lit id={`${id}-f`} c={c1} />
        <Lit id={`${id}-sh`} c="#4caf5a" />
        <linearGradient id={`${id}-p`} x1="0" y1="0" x2="0.2" y2="1"><stop offset="0%" stopColor={light(panel, 0.6)} />
          <stop offset="100%" stopColor={shade(panel, 0.1)} /></linearGradient>
        <clipPath id={`${id}-bc`}><path d={rr(-164, -112, 328, 112, 14)} /></clipPath>
      </defs>
      <ContactShadow x={0} y={4} w={520} opacity={0.3} />
      {night && <Glow x={0} y={(top + cb) / 2} r={300} color="#fff0b8" opacity={0.4} />}
      <Pass ow={ow} list={[
        ...(brick ? [pc(rr(-164, -112, 328, 112, 14), `url(#${id}-br)`, bricks)]
          : [-1, 1].map((sd) => pc(rr(sd * 110 - 9, -128, 18, 128, 9), '#9aa3bd', '#9aa3bd'))),
        ...(brick ? [pc(rr(-180, -132, 360, 24, 12), `url(#${id}-st)`, stone)] : []),
        pc(rr(-cw / 2, top, cw, cb - top - 2, 26), `url(#${id}-f)`, c1),
      ]} />
      {brick && <g clipPath={`url(#${id}-bc)`}>
        {Array.from({length: 7}).map((_, r) => <g key={r}>
          <path d={`M-170 ${-112 + r * 16} L170 ${-112 + r * 16}`} stroke={light(bricks, 0.5)} strokeWidth={2.2} opacity={0.7} />
          {Array.from({length: 9}).map((__, c) => <path key={c} d={`M${-164 + c * 40 + (r % 2) * 20} ${-112 + r * 16} l0 16`}
            stroke={light(bricks, 0.5)} strokeWidth={2} opacity={0.6} />)}
        </g>)}
      </g>}
      <path d={rr(-cw / 2 + 12, top + 40, cw - 24, cb - top - 54, 14)} fill={`url(#${id}-p)`} stroke={line(c1)} strokeWidth={ow} />
      {tiles}
      <path d={`M${-cw / 2 + 24} ${top + 48} L${-40} ${top + 48}`} stroke="#ffffff" strokeWidth={5} strokeLinecap="round" opacity={0.7} />
      <path d={star} fill="#f6c044" stroke={line('#f6c044')} strokeWidth={ow} />
      <path d={rr(-150, top + 13, 120, 12, 6)} fill={light(c1, 0.55)} opacity={0.9} />
      <path d={rr(30, top + 13, 120, 12, 6)} fill={light(c1, 0.55)} opacity={0.9} />
      <path d={`M${-cw / 2 + 20} ${top + 7} L${-20} ${top + 7}`} stroke="#ffffff" strokeWidth={5} strokeLinecap="round" opacity={0.4} />
      <Pass ow={ow} list={[...shrub(-196, 0.8), ...shrub(200, 0.68)]} />
    </g>
  );
};

// ============================================================================ the run-through

/**
 * THE RUN-THROUGH BANNER. Butcher paper taped to a pipe frame, painted by hand in the school colour
 * with a big paw, brush stripes and paint that ran. The paper billows on `frame`. Past `torn` 0.5 it
 * hangs in two ragged halves.
 */
export const RunThroughV2: React.FC<TownPropsV2 & {torn?: number}> = (p) => {
  const {frame = 0, seed = 89, school = SCHOOL, torn = 0} = p;
  const id = useUid(), ow = owOf(p);
  const [c1] = school;
  const steel = '#a9b3cc', paper = '#fbf3df', gold = '#f2b632';
  const W = 850, H = 340, x0 = -410, x1 = 410, yT = -318, yB = -44;
  const wav = (x: number) => Math.sin(x * 0.011 + frame * 0.14) * 9 + Math.sin(x * 0.023 - frame * 0.09) * 4;
  const N = 16;
  const bottom = Array.from({length: N + 1}, (_, i) => {
    const x = x1 - (i / N) * (x1 - x0);
    return `L${x.toFixed(1)} ${(yB + wav(x)).toFixed(1)}`;
  }).join(' ');
  const bulge = Math.sin(frame * 0.12) * 6;
  const sheet = `M${x0} ${yT} L${x1} ${yT} Q${x1 + 8 + bulge} ${(yT + yB) / 2} ${x1} ${yB + wav(x1)} ${bottom} Q${x0 - 8 + bulge} ${(yT + yB) / 2} ${x0} ${yT} Z`;
  const halves = [-1, 1].map((sd) => {
    const out = sd * 410, inner = sd * 60;
    const rag = Array.from({length: 7}, (_, i) => {
      const y = yT + 20 + i * 34;
      return `L${(inner + sd * (rnd(seed, 3 + i + (sd > 0 ? 9 : 0)) * 90 + i * 22)).toFixed(1)} ${y}`;
    }).join(' ');
    return `M${out} ${yT} L${inner} ${yT} ${rag} Q${sd * 300} ${yT + 300} ${out} ${yT + 270 + wav(out) * 0.5} Z`;
  });
  const shapes = torn < 0.5 ? [sheet] : halves;
  const toe = (dx: number, dy: number, r: number) => ellipse(dx, dy, r, r * 1.2);
  return (
    <g transform={at(p)}>
      <defs>
        <linearGradient id={`${id}-pp`} x1="0" y1="0" x2="1" y2="0.2"><stop offset="0%" stopColor={light(paper, 0.6)} />
          <stop offset="60%" stopColor={paper} /><stop offset="100%" stopColor={shade(paper, 0.16)} /></linearGradient>
        <clipPath id={`${id}-c`}>{shapes.map((d, i) => <path key={i} d={d} />)}</clipPath>
      </defs>
      <ContactShadow x={0} y={6} w={W * 1.15} opacity={0.3} />
      {[-1, 1].map((sd) => <path key={sd} d={rr(sd * 425 - 30, -14, 60, 16, 8)} fill={INKY} />)}
      <Tubes ow={ow} list={[
        {d: `M-425 -8 L-425 ${-H + 8}`, c: steel, w: 14}, {d: `M425 -8 L425 ${-H + 8}`, c: steel, w: 14},
        {d: `M-425 ${-H + 10} L425 ${-H + 10}`, c: steel, w: 12, h: true},
      ]} />
      <Pass ow={ow} list={shapes.map((d) => pc(d, `url(#${id}-pp)`, paper))} />
      <g clipPath={`url(#${id}-c)`}>
        <path d={`M${x0 + 30} ${yT + 46} Q0 ${yT + 34} ${x1 - 30} ${yT + 48}`} stroke={c1} strokeWidth={46} fill="none" strokeLinecap="round" />
        <path d={`M${x0 + 50} ${yB - 40} Q0 ${yB - 52} ${x1 - 50} ${yB - 38}`} stroke={c1} strokeWidth={34} fill="none" strokeLinecap="round" />
        <path d={`M${x0 + 70} ${yT + 86} Q0 ${yT + 80} ${x1 - 70} ${yT + 88}`} stroke={gold} strokeWidth={12} fill="none" strokeLinecap="round" />
        {[[-240, 22], [-90, 34], [120, 18], [260, 28]].map(([x, len], i) => <path key={i} d={`M${x} ${yT + 60} l0 ${len}`} stroke={c1}
          strokeWidth={9} strokeLinecap="round" />)}
        <g transform={`translate(0 ${(yT + yB) / 2 + 22})`}>
          <path d={roundPoly([[-52, 22], [0, -28], [52, 22], [26, 46], [-26, 46]], 24)} fill={c1} />
          {[[-62, -26, 17], [-24, -66, 18], [24, -66, 18], [62, -26, 17]].map(([dx, dy, r], i) => <path key={i} d={toe(dx, dy, r)} fill={c1} />)}
          <path d="M-14 46 l0 22" stroke={c1} strokeWidth={8} strokeLinecap="round" />
        </g>
        {[-300, 300].map((x) => <path key={x} d={roundPoly(Array.from({length: 10}, (_, k) => {
          const a = -Math.PI / 2 + k * Math.PI / 5, rad = k % 2 ? 14 : 32;
          return [x + Math.cos(a) * rad, (yT + yB) / 2 + 10 + Math.sin(a) * rad] as Pt;
        }), 4)} fill={gold} />)}
        <path d={`M${x0} ${yT} L${x0 + 260} ${yT} L${x0 + 180} ${yB} L${x0} ${yB} Z`} fill="#ffffff" opacity={0.16} />
        <path d={`M${x1 - 120} ${yT} L${x1} ${yT} L${x1} ${yB + 20} L${x1 - 200} ${yB + 20} Z`} fill={shade(paper, 0.5)} opacity={0.1} />
      </g>
      {[-330, -110, 110, 330].map((x) => <path key={x} d={rr(x - 16, yT - 12, 32, 20, 6)} fill="#e8dfc4" stroke={line('#e8dfc4')} strokeWidth={ow} />)}
    </g>
  );
};

// ============================================================================ the steer

const STEER_COATS = ['#2e2838', '#2e2838', '#4a2f28', '#a8452e', '#efe6d6', '#a7a3b2'];
const COAT_V2: Record<string, string> = {'#1c1c1e': '#2e2838', '#2a1c18': '#4a2f28', '#7a2a1e': '#a8452e', '#e2ded2': '#efe6d6', '#9a9a96': '#a7a3b2'};
const v2Coat = (c: string) => COAT_V2[c.toLowerCase()] ?? c;

/**
 * The market steer in centimetres, head toward negative x, hooves on y 0. A deep body on short fitted
 * legs with the hair combed up, a level topline, a balled tail, a show halter and a gentle face.
 */
const SteerArt: React.FC<{frame: number; ow: number; coat: string; whiteFace?: boolean; halter?: boolean; seed: number;
  mood?: 'calm' | 'happy' | 'worried'; face?: boolean}> = ({frame, ow, coat, whiteFace = false, halter = true, seed, mood = 'calm', face = true}) => {
  const id = useUid();
  const c = coat, cs = shade(c, 0.3), ink = line(c);
  const pale = light(c, 0.5);
  const t = frame / 30;
  const breath = Math.sin(t * 2 * Math.PI / 3.6 + seed) * 1.2;
  const T = -136 + breath;
  const blink = (frame + seed * 13) % 104 < 4;
  const ear = Math.max(0, Math.sin(frame * 0.5 + seed) - 0.9) * 140;
  const swing = Math.sin(t * 2 * Math.PI * 0.5 + seed) * 6;
  const nod = Math.sin(t * 2 * Math.PI / 4.2 + seed) * 1.5;
  const faceC = whiteFace ? '#f4ecdc' : c;
  const muzC = whiteFace ? '#f3d6cf' : light(c, 0.22);
  // the deep level body, a heavy round hindquarter and a full shoulder, all one outline
  const body = roundPoly([[-54, T - 1], [36, T], [72, T + 1], [88, T + 14], [92, T + 46], [79, -60], [18, -54], [-45, -56], [-74, -64],
    [-86, -92], [-81, T + 18]], [24, 30, 20, 18, 24, 26, 30, 26, 20, 18, 18]);
  const neck = roundPoly([[-40, T - 1], [-92, -154 + nod], [-110, -110 + nod], [-80, -70]], [18, 12, 12, 16]);
  // the head in its own frame, nose toward negative x, held up and a little nose down as a steer stands to show
  const HS = 1.3;
  const head = `translate(-100 ${-140 + nod}) rotate(-24) scale(${HS})`;
  const fl = (u: number) => u < 0.55 ? 30 - u * 24 : u < 0.84 ? 17 : 17 + (u - 0.84) * 26;
  const front = (x: number) => taper([[x, -92], [x - 1, -64], [x - 2, -40], [x - 2, -24], [x - 2, -10]], 0, 0, fl);
  const hind = (x: number) => taper([[x, -100], [x + 9, -68], [x + 6, -44], [x, -28], [x + 1, -10]], 0, 0,
    (u) => u < 0.45 ? 38 - u * 42 : u < 0.84 ? 18 : 18 + (u - 0.84) * 26);
  const far: Pc[] = [pc(front(-46), cs, c), pc(hind(80), cs, c)];
  const near: Pc[] = [
    pc(taper([[86, T + 10], [92, T + 50], [92 + swing * 0.5, -44]], 8, 5), c, c),
    pc(neck, `url(#${id}-g)`, c),
    pc(front(-64), `url(#${id}-l)`, c), pc(hind(64), `url(#${id}-l)`, c),
    pc(body, `url(#${id}-g)`, c),
    pc(ellipse(66, -104, 30, 34), `url(#${id}-g)`, c),
    pc(ellipse(-58, -104, 24, 32), `url(#${id}-g)`, c),
  ];
  const hs: Pc[] = [
    pc(ellipse(-14, 2, 18, 17), `url(#${id}-h)`, c),
    pc(roundPoly([[-8, -13], [-42, -11], [-54, 4], [-48, 17], [-10, 17]], 10), whiteFace ? `url(#${id}-w)` : `url(#${id}-h)`, faceC),
    pc(ellipse(-46, 5, 12.5, 12), muzC, muzC),
  ];
  const hoofs = (xs: number[], col: string) => xs.map((x) => <path key={x} d={rr(x - 11, -11, 22, 11, 4)} fill={col} />);
  const tufts = (x: number) => [-6, 0, 6].map((dx, i) => <path key={i} d={`M${x + dx} -16 q${dx * 0.3} -8 ${dx * 0.5 + 1.5} -18`} stroke={pale}
    strokeWidth={2.4} strokeLinecap="round" fill="none" opacity={0.4} />);
  const leather = '#b0602c', how = ow / HS;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1={-120} y1={-150} x2={40} y2={-40}>
          <stop offset="0%" stopColor={light(c, 0.36)} /><stop offset="50%" stopColor={c} /><stop offset="100%" stopColor={shade(c, 0.34)} />
        </linearGradient>
        <linearGradient id={`${id}-l`} x1="0" y1="0" x2="0.5" y2="1"><stop offset="0%" stopColor={shade(c, 0.1)} />
          <stop offset="100%" stopColor={light(c, 0.14)} /></linearGradient>
        <radialGradient id={`${id}-h`} cx="40%" cy="25%" r="85%"><stop offset="0%" stopColor={light(c, 0.34)} />
          <stop offset="70%" stopColor={c} /><stop offset="100%" stopColor={shade(c, 0.3)} /></radialGradient>
        <Lit id={`${id}-w`} c="#f4ecdc" />
      </defs>
      <ContactShadow x={0} y={2} w={280} opacity={0.32} />
      <Pass ow={ow} list={far} />
      {hoofs([-48, 81], shade('#2a2142', 0.1))}
      <Pass ow={ow} list={near} />
      <ellipse cx={92 + swing * 0.7} cy={-36} rx={9} ry={12} fill={cs} stroke={ink} strokeWidth={ow * 2} paintOrder="stroke" />
      <ellipse cx={90 + swing * 0.7} cy={-40} rx={4} ry={6} fill={pale} opacity={0.3} />
      {hoofs([-66, 65], '#2a2142')}
      {tufts(-66)}{tufts(65)}
      <path d={`M-50 ${T + 9} Q10 ${T + 2} 72 ${T + 8}`} stroke={pale} strokeWidth={8} strokeLinecap="round" fill="none" opacity={0.35} />
      <ellipse cx={60} cy={-120} rx={14} ry={9} fill={pale} opacity={0.22} />
      <ellipse cx={-62} cy={-116} rx={10} ry={7} fill={pale} opacity={0.18} />
      <g transform={head}>
        {/* the ear, out to the side behind the poll, flicking now and then */}
        <g transform={`translate(0 2) rotate(${22 - ear})`}>
          <path d={ellipse(12, 0, 14, 6)} fill={c} stroke={ink} strokeWidth={how * 2} paintOrder="stroke" />
          <ellipse cx={13} cy={0} rx={8.5} ry={2.8} fill="#d99a9a" opacity={0.6} />
        </g>
        <Pass ow={how} list={hs} />
        <ellipse cx={-56} cy={2} rx={3.4} ry={6.2} fill={whiteFace ? '#c98a8a' : shade(c, 0.45)} />
        <path d={mood === 'happy' ? 'M-54 12 Q-48 17 -42 12' : 'M-54 13 Q-48 15 -43 13'} stroke={whiteFace ? '#a86a6a' : shade(c, 0.4)}
          strokeWidth={1.8} fill="none" strokeLinecap="round" />
        <ellipse cx={-20} cy={-9} rx={9} ry={4} fill="#ffffff" opacity={0.18} />
        {halter && <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {['M-37 -12 Q-41 3 -37 18', 'M-37 5 Q-22 7 -9 4', 'M-9 4 Q-5 -6 -2 -16'].map((d, i) => <g key={i}>
            <path d={d} stroke={line(leather)} strokeWidth={3.6 + how * 2} />
            <path d={d} stroke={leather} strokeWidth={3.6} />
          </g>)}
          <circle cx={-37} cy={19} r={3.2} stroke="#dfe3ee" strokeWidth={2.2} />
          <path d={`M-37 22 Q${-37 + swing * 0.3} 30 ${-33 + swing * 0.5} 38`} stroke={line(leather)} strokeWidth={3.4 + how * 2} />
          <path d={`M-37 22 Q${-37 + swing * 0.3} 30 ${-33 + swing * 0.5} 38`} stroke={leather} strokeWidth={3.4} />
        </g>}
        {face && <g transform="translate(-22 -3) rotate(24)">
          {blink ? <path d="M-6 0 q6 4 12 0" stroke={whiteFace ? INKY : '#f4ecdc'} strokeWidth={2} fill="none" strokeLinecap="round" />
            : <><ellipse cx={0} cy={0} rx={5.6} ry={6.2} fill="#ffffff" stroke={ink} strokeWidth={how * 0.6} />
              <circle cx={-1.3} cy={0.6} r={3.8} fill="#1f1736" />
              <circle cx={-2.4} cy={-1.5} r={1.4} fill="#ffffff" /></>}
          <path d={mood === 'worried' ? 'M-8 -9 L6 -11' : 'M-8 -10 Q-1 -13 6 -10'} stroke={whiteFace ? '#b8a890' : pale} strokeWidth={2}
            strokeLinecap="round" fill="none" opacity={0.9} />
          <circle cx={-5} cy={11} r={4.5} fill="#ff6b8a" opacity={0.2} />
        </g>}
      </g>
    </g>
  );
};

/**
 * THE MARKET STEER, fitted for show. Solid black by default (the most common market colour), deep and
 * level on short legs combed up and out, in a show halter. It breathes, blinks, flicks an ear and
 * swings its balled tail. `whiteFace` is the baldy cross. Never a longhorn.
 */
export const ShowSteerV2: React.FC<TownPropsV2 & {coat?: string; whiteFace?: boolean; halter?: boolean;
  mood?: 'calm' | 'happy' | 'worried'}> = (p) => {
  const {frame = 0, seed = 91, coat = '#1c1c1e', whiteFace = false, halter = true, mood = 'calm'} = p;
  return (
    <g transform={at(p)}>
      <SteerArt frame={frame} ow={owOf(p)} coat={v2Coat(coat)} whiteFace={whiteFace} halter={halter} seed={seed} mood={mood} />
    </g>
  );
};

// ============================================================================ the show barn

/**
 * THE SHOW BARN from its open gable end. A clear-span steel truss under a galvanized roof, no posts in
 * the middle, the concrete alley running back between two shavings beds, and steers tied along both
 * sides facing out with their tails to the alley. Box fans hang from the truss and turn.
 */
export const ShowBarnV2: React.FC<TownPropsV2 & {stalls?: number; fans?: boolean}> = (p) => {
  const {frame = 0, seed = 90, night = false, stalls = 6, fans = true} = p;
  const id = useUid(), ow = owOf(p);
  const W = 2300, E = 540, R = 750, O = 90;
  const frameC = '#5d7fd0', roof = '#cdd6ea', shav = '#ecd08e', conc = '#c4c6d6';
  const vp: Pt = [0, -170], kb = 0.42;
  const back = (q: Pt): Pt => [vp[0] + (q[0] - vp[0]) * kb, vp[1] + (q[1] - vp[1]) * kb];
  const at3 = (q: Pt, k: number): Pt => [vp[0] + (q[0] - vp[0]) * k, vp[1] + (q[1] - vp[1]) * k];
  const FLE: Pt = [-W / 2 - O, -E + 30], FR: Pt = [0, -R], FRE: Pt = [W / 2 + O, -E + 30];
  const BLE = back(FLE), BR = back(FR), BRE = back(FRE);
  const FLG: Pt = [-W / 2, 0], FRG: Pt = [W / 2, 0], BLG = back(FLG), BRG = back(FRG);
  const P = (pts: Pt[]) => 'M' + pts.map(f1).join(' L') + ' Z';
  const alleyW = 360;
  const steers: React.ReactNode[] = [];
  const perSide = Math.max(1, Math.ceil(stalls / 2));
  for (let s = 0; s < perSide; s++) {
    const k = lerp(0.58, 1, perSide > 1 ? s / (perSide - 1) : 1);
    [-1, 1].forEach((side, j) => {
      const i = s * 2 + j;
      if (i >= stalls) return;
      const g = at3([side * (W / 2 - 360), 0], k);
      steers.push(<g key={`${s}-${side}`} transform={`translate(${f1(g)}) scale(${k * side * -1} ${k})`}>
        <SteerArt frame={frame} ow={ow / k} coat={STEER_COATS[(i * 5 + 1) % STEER_COATS.length]} whiteFace={i % 4 === 1}
          seed={seed + i * 13} face={k > 0.85} />
      </g>);
    });
  }
  const rail = (side: number): Tb => {
    const a = at3([side * (W / 2 - 150), -120], 1), b = at3([side * (W / 2 - 150), -120], 0.55);
    return {d: `M${f1(a)} L${f1(b)}`, c: '#b9c2d8', w: 9};
  };
  const truss = (k: number, col: string, w: number): Tb[] => {
    const q = (pt: Pt) => at3(pt, k);
    const ex = W / 2, list: Tb[] = [
      {d: `M${f1(q([-ex, -E]))} L${f1(q([ex, -E]))}`, c: col, w, h: true},
      {d: `M${f1(q([-ex, -E + 10]))} L${f1(q([0, -R + 20]))} L${f1(q([ex, -E + 10]))}`, c: col, w},
    ];
    for (let i = 1; i < 8; i++) {
      const u = i / 8, x = -ex + u * W, uu = u + (u < 0.5 ? 1 / 16 : -1 / 16);
      const yTop = -E + 10 - (1 - Math.abs(uu - 0.5) * 2) * (R - 20 - E + 10);
      list.push({d: `M${f1(q([x, -E]))} L${f1(q([-ex + uu * W, yTop]))}`, c: col, w: w * 0.6});
    }
    return list;
  };
  return (
    <g transform={at(p)}>
      <defs>
        <linearGradient id={`${id}-u`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={shade(roof, 0.55)} />
          <stop offset="100%" stopColor={shade(roof, 0.3)} /></linearGradient>
        <linearGradient id={`${id}-o`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={night ? '#2b2f6a' : '#bfe0ff'} />
          <stop offset="100%" stopColor={night ? '#3b3a78' : '#fff1cf'} /></linearGradient>
        <Lit id={`${id}-sh`} c={shav} v /><Lit id={`${id}-r`} c={roof} v />
      </defs>
      <ContactShadow x={0} y={8} w={W * 1.15} opacity={0.3} />
      {/* the far end, open to the day, and the roof underside receding toward it */}
      <path d={P([BLG, BLE, BR, BRE, BRG])} fill={`url(#${id}-o)`} />
      <path d={P([FLE, FR, BR, BLE])} fill={`url(#${id}-u)`} />
      <path d={P([FR, FRE, BRE, BR])} fill={`url(#${id}-u)`} opacity={0.85} />
      {[0.82, 0.66, 0.54].map((k) => [-1, 1].map((sd) => {
        const b = at3([sd * W / 2, 0], k), tp = at3([sd * W / 2, -E], k);
        return <path key={`${k}-${sd}`} d={`M${f1(b)} L${f1(tp)}`} stroke={mix(frameC, '#d7dcf0', 0.5)} strokeWidth={26 * k} strokeLinecap="round" />;
      }))}
      {truss(0.62, mix(frameC, '#d7dcf0', 0.45), 14).map((t, i) => <path key={i} d={t.d} stroke={t.c} strokeWidth={t.w} strokeLinecap="round" fill="none" />)}
      {/* the floor, shavings either side of the concrete alley */}
      <path d={P([FLG, BLG, back([-alleyW, 0]), [-alleyW, 0]])} fill={`url(#${id}-sh)`} />
      <path d={P([FRG, BRG, back([alleyW, 0]), [alleyW, 0]])} fill={`url(#${id}-sh)`} />
      <path d={P([[-alleyW, 0], back([-alleyW, 0]), back([alleyW, 0]), [alleyW, 0]])} fill={conc} />
      <path d={`M0 0 L${f1(back([0, 0]))}`} stroke={shade(conc, 0.15)} strokeWidth={8} strokeDasharray="60 40" />
      <Tubes ow={ow} list={[rail(-1), rail(1)]} />
      {steers}
      {/* the front frame with its corner posts, the clear-span truss and the roof edge */}
      <Tubes ow={ow} list={[
        {d: `M${-W / 2} -6 L${-W / 2} ${-E}`, c: frameC, w: 46}, {d: `M${W / 2} -6 L${W / 2} ${-E}`, c: frameC, w: 46},
        ...truss(1, frameC, 22),
      ]} />
      <Pass ow={ow} list={[pc(`M${f1(FLE)} L${f1(FR)} L${f1(FRE)} L${FRE[0]} ${FRE[1] + 46} L0 ${-R + 46} L${FLE[0]} ${FLE[1] + 46} Z`,
        `url(#${id}-r)`, roof)]} />
      <path d={`M${FLE[0] + 30} ${FLE[1] + 8} L-40 ${-R + 14}`} stroke="#ffffff" strokeWidth={12} strokeLinecap="round" opacity={0.55} />
      {fans && [-0.3, 0.3].map((u) => {
        const fx = u * W, fy = -E + 150, spin = frame * 24 + u * 100;
        return <g key={u}>
          <path d={`M${fx - 40} ${-E + 6} L${fx - 50} ${fy - 60} M${fx + 40} ${-E + 6} L${fx + 50} ${fy - 60}`} stroke="#7c84a0" strokeWidth={6} />
          <Pass ow={ow} list={[pc(rr(fx - 78, fy - 78, 156, 156, 40), '#8e97b8', '#8e97b8')]} />
          <circle cx={fx} cy={fy} r={62} fill={shade('#8e97b8', 0.4)} />
          <g transform={`translate(${fx} ${fy}) rotate(${spin})`}>{[0, 90, 180, 270].map((a) => <path key={a} transform={`rotate(${a})`}
            d="M0 -6 C18 -14 34 -36 12 -52 C2 -44 -2 -24 0 -6 Z" fill="#e8ecf6" />)}</g>
          <circle cx={fx} cy={fy} r={10} fill="#5a6488" />
          {[-30, 0, 30].map((dy) => <path key={dy} d={`M${fx - 60} ${fy + dy} L${fx + 60} ${fy + dy}`} stroke="#c4cad8" strokeWidth={4} opacity={0.6} />)}
        </g>;
      })}
    </g>
  );
};

// ============================================================================ the bus

/**
 * THE SCHOOL BUS, a conventional with the hood everybody rode. Rounded yellow body, the three black rub
 * rails, seven windows with their sash line, the crossview mirror on the fender, and roof lights that
 * blink. `stopArm` swings the red octagon out with its lamps flashing and the crossing gate open.
 * `mood` puts a face in the driver's window, for a film where the bus is the character.
 */
export const SchoolBusV2: React.FC<TownPropsV2 & {conventional?: boolean; stopArm?: boolean; speed?: number; mood?: MachineMood}> = (p) => {
  const {frame = 0, night = false, conventional = true, stopArm = false, speed = 0, mood} = p;
  const id = useUid(), ow = owOf(p);
  const yel = '#f8b81e', blk = '#2a2440';
  const front = conventional ? -372 : -520;
  const bodyPts: Pt[] = conventional
    ? [[-354, -312], [500, -312], [510, -60], [-536, -66], [-540, -196], [-512, -222], [-374, -234]]
    : [[-500, -312], [500, -312], [510, -60], [-524, -60]];
  const body = roundPoly(bodyPts, conventional ? [44, 40, 18, 18, 30, 26, 16] : [44, 40, 18, 18]);
  const wheels = conventional ? [-420, 330] : [-300, 330];
  const spin = frame * speed * 14;
  const blinkOn = Math.floor(frame / 9) % 2 === 0;
  const glass = night ? '#ffe7a3' : '#2f4aa0';
  const wx0 = conventional ? -300 : -440;
  const lamps: [number, string][] = [[front + 26, '#ffb020'], [front + 60, '#ff3b30'], [450, '#ff3b30'], [416, '#ffb020']];
  const oct = (r: number) => roundPoly(Array.from({length: 8}, (_, k) => {
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
    return [-70 + Math.cos(a) * r, Math.sin(a) * r] as Pt;
  }), r * 0.15);
  return (
    <g transform={at(p)}>
      <defs><Lit id={`${id}-y`} c={yel} /><linearGradient id={`${id}-g`} x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0%" stopColor={light(glass, 0.4)} /><stop offset="100%" stopColor={shade(glass, 0.3)} /></linearGradient>
        <Lit id={`${id}-r`} c="#e33a2f" /></defs>
      <ContactShadow x={0} y={6} w={1220} opacity={0.32} />
      <Pass ow={ow} list={[
        pc(body, `url(#${id}-y)`, yel),
        pc(rr(front - (conventional ? 182 : 22), -104, conventional ? 74 : 40, 40, 16), blk, blk),
        pc(rr(486, -96, 40, 38, 14), blk, blk),
      ]} />
      {wheels.map((x) => <path key={x} d={`M${x - 74} -60 A74 74 0 0 1 ${x + 74} -60 Z`} fill={shade(yel, 0.55)} />)}
      {[-108, -150, -192].map((y) => <path key={y} d={`M${front + 8} ${y} L${500} ${y}`} stroke={blk} strokeWidth={10} strokeLinecap="round" />)}
      {Array.from({length: 7}).map((_, i) => {
        const x = wx0 + i * 110;
        return <g key={i}>
          <path d={rr(x, -292, 86, 84, 14)} fill={`url(#${id}-g)`} stroke={line(yel)} strokeWidth={ow} />
          <path d={`M${x} -262 L${x + 86} -262`} stroke={light(yel, 0.2)} strokeWidth={6} />
          <path d={`M${x + 12} -282 L${x + 40} -282`} stroke="#ffffff" strokeWidth={6} strokeLinecap="round" opacity={0.5} />
        </g>;
      })}
      {mood && <Visor x={wx0 + 43} y={-238} w={78} h={40} mood={mood} frame={frame} />}
      {conventional && <g>
        <path d="M-356 -300 L-376 -240 L-360 -240 L-338 -300 Z" fill={`url(#${id}-g)`} />
        <path d="M-536 -150 L-520 -150" stroke={blk} strokeWidth={30} strokeLinecap="round" />
        <circle cx={-530} cy={-178} r={14} fill="#fff6c8" stroke={line('#fff6c8')} strokeWidth={ow} />
        {night && <Glow x={-548} y={-178} r={90} color="#fff3b0" opacity={0.4} />}
        <path d="M-470 -222 L-498 -300" stroke={blk} strokeWidth={6} strokeLinecap="round" />
        <ellipse cx={-500} cy={-310} rx={16} ry={22} fill="#3a3f6a" stroke={blk} strokeWidth={ow * 1.5} />
        <path d="M-420 -224 Q-460 -218 -500 -206" stroke="#ffffff" strokeWidth={10} strokeLinecap="round" opacity={0.45} fill="none" />
      </g>}
      <path d="M-330 -298 Q80 -306 480 -298" stroke="#ffffff" strokeWidth={12} strokeLinecap="round" opacity={0.4} fill="none" />
      {lamps.map(([x, col], i) => {
        const on = stopArm ? (col === '#ff3b30' && (i % 2 === 0) === blinkOn) : (col === '#ffb020' && blinkOn);
        return <g key={i}>
          <path d={rr(x - 13, -330, 26, 20, 8)} fill={on ? col : shade(col, 0.35)} stroke={line(col)} strokeWidth={ow} />
          {on && <Glow x={x} y={-322} r={50} color={col} opacity={0.5} />}
        </g>;
      })}
      {stopArm && <g transform="translate(-170 -172)">
        <path d={rr(-8, -12, 24, 24, 6)} fill={blk} />
        <Pass ow={ow} list={[pc(oct(52), `url(#${id}-r)`, '#e33a2f')]} />
        <path d={oct(42)} fill="none" stroke="#ffffff" strokeWidth={5} />
        {[-38, 38].map((y, i) => <circle key={y} cx={-70} cy={y} r={7} fill={(i === 0) === blinkOn ? '#ff3b30' : '#8a1f1f'} stroke="#ffffff" strokeWidth={2} />)}
      </g>}
      {stopArm && conventional && <Tubes ow={ow} list={[{d: 'M-560 -84 L-630 -84', c: yel, w: 10, h: true}]} />}
      {wheels.map((x) => <g key={x} transform={`translate(${x} -56)`}>
        <circle r={58} fill={blk} stroke={line(blk)} strokeWidth={ow * 2} />
        <circle r={30} fill="#d9dde8" />
        <g transform={`rotate(${spin})`}>{[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={Math.cos(a * Math.PI / 180) * 17}
          cy={Math.sin(a * Math.PI / 180) * 17} r={4} fill="#7a7f99" />)}</g>
        <circle cx={-10} cy={-12} r={8} fill="#ffffff" opacity={0.5} />
      </g>)}
    </g>
  );
};

// ============================================================================ the goal post

/**
 * THE GOAL POST. A gooseneck in goal-post yellow, the crossbar at ten feet and the uprights a high
 * school's 23 feet 4 inches apart and 9 m tall, a padded base in the school colour and a ribbon on
 * each upright that reads the wind on `frame`. `gooseneck` false draws the older H.
 */
export const GoalPostV2: React.FC<TownPropsV2 & {gooseneck?: boolean}> = (p) => {
  const {frame = 0, school = SCHOOL, gooseneck = true} = p;
  const id = useUid(), ow = owOf(p);
  const yel = '#ffd23f', X = 355, C = 305, H = 900;
  const ribbon = (x: number, ph: number) => {
    const pts = Array.from({length: 7}, (_, i) => {
      const u = i / 6;
      return [x + u * 110, -H + 14 + u * 20 + Math.sin(frame * 0.3 + ph - u * 3) * 14 * u] as Pt;
    });
    return 'M' + pts.map(f1).join(' L');
  };
  return (
    <g transform={at(p)}>
      <defs><Lit id={`${id}-pd`} c={school[0]} /></defs>
      <ContactShadow x={gooseneck ? 70 : 0} y={4} w={gooseneck ? 260 : X * 2.6} opacity={0.32} />
      <Tubes ow={ow} list={[
        ...(gooseneck ? [{d: `M70 0 L70 ${-C + 90} Q70 ${-C} 0 ${-C}`, c: yel, w: 30}]
          : [{d: `M${-X} 0 L${-X} ${-C}`, c: yel, w: 22}, {d: `M${X} 0 L${X} ${-C}`, c: yel, w: 22}]),
        {d: `M${-X} ${-C} L${X} ${-C}`, c: yel, w: 22, h: true},
        {d: `M${-X} ${-C} L${-X} ${-H}`, c: yel, w: 18}, {d: `M${X} ${-C} L${X} ${-H}`, c: yel, w: 18},
      ]} />
      {(gooseneck ? [70] : [-X, X]).map((x) => <g key={x}>
        <Pass ow={ow} list={[pc(rr(x - 34, -190, 68, 190, 26), `url(#${id}-pd)`, school[0])]} />
        <path d={rr(x - 34, -132, 68, 22, 6)} fill={school[1]} />
        <path d={`M${x - 18} -176 L${x - 18} -20`} stroke="#ffffff" strokeWidth={8} strokeLinecap="round" opacity={0.3} />
      </g>)}
      {[-X, X].map((x, i) => <g key={x}>
        <path d={ribbon(x, i * 1.3)} stroke={line('#ff5a3c')} strokeWidth={12 + ow * 2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={ribbon(x, i * 1.3)} stroke="#ff5a3c" strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>)}
    </g>
  );
};

export const HOMETOWN_V2 = ['LightMastV2', 'BleachersV2', 'FieldV2', 'MarchingBlockV2', 'DrumMajorStandV2', 'HomecomingMumV2',
  'PortableClassroomV2', 'SchoolMarqueeV2', 'RunThroughV2', 'ShowBarnV2', 'ShowSteerV2', 'SchoolBusV2', 'GoalPostV2'] as const;
