import React from 'react';
import {light, line, mix, shade} from '../color';
import {useUid} from '../Kit';

/**
 * THE SKIES, LOOK V2 (November 14th, 2026).
 *
 * The fourteen Texas sky states from lib/skies.tsx redrawn in the v2 idiom. A sky fills most of a
 * vertical frame, so it has to be soft, deep and luminous before it is anything else. Every state is
 * a many-stop gradient with a glow where the light comes from, and every cloud is a rounded mass of
 * lobes lit from the upper left, each lobe its own light side and shade side, the whole mass outlined
 * once in its own deep hue so the joins between lobes show as bulges and never as seams. Rain falls,
 * lightning strikes, cloud boils and drifts, stars twinkle, all from `frame` and nothing random.
 *
 * UNITS are the library's. These are full frame backdrops in screen units (1080 by 1920), with the
 * same `seed`, `frame`, `horizonY` and `intensity` props and each state's own props, so a board can
 * swap a library sky for its V2 one without touching a number. Below `horizonY` the sky keeps going,
 * because the land in front of it is somebody else's drawing.
 *
 * The physics notes that decide each drawing live with the library drawings and still hold here. The
 * anvil is what makes a thunderhead, a supercell base looks machined, a shelf cloud's leading face is
 * pale over a black underside, a norther is darkest at the horizon, a Texas sunset is bands, dust
 * takes the blue out of the low sky, Gulf overcast has no shapes in it, sea fog subtracts, green hail
 * light is strongest in the mid tones, smoke loses the pink, a dark sky is deep blue and never black,
 * and virga stops before the ground.
 */
export const W = 1080, H = 1920;
export type SkyNameV2 =
  | 'clearSummer' | 'winterClear' | 'thunderhead' | 'supercell' | 'shelfCloud'
  | 'blueNorther' | 'sunsetBands' | 'dustHaze' | 'gulfOvercast' | 'seaFog'
  | 'greenHail' | 'smoke' | 'starfield' | 'monsoonCells';

export interface SkyV2Props {
  seed?: number;
  frame?: number;
  /** where the land starts */
  horizonY?: number;
  /** 0 to 1, how much of the state's character to spend */
  intensity?: number;
}

export const hash = (seed: number, ch: number) => {
  let t = (Math.imul(seed + 7, 374761393) + Math.imul(ch + 3, 668265263)) >>> 0;
  t = Math.imul(t ^ (t >>> 13), 1274126177) >>> 0;
  return ((t ^ (t >>> 16)) >>> 0) % 100000 / 100000;
};
const f1 = (n: number) => n.toFixed(1);
/** a rounded rectangle as a path */
export const rr = (x: number, y: number, w: number, h: number, r: number) => {
  const q = Math.max(0, Math.min(r, w / 2, h / 2));
  return `M${f1(x + q)} ${f1(y)} H${f1(x + w - q)} A${f1(q)} ${f1(q)} 0 0 1 ${f1(x + w)} ${f1(y + q)} V${f1(y + h - q)} `
    + `A${f1(q)} ${f1(q)} 0 0 1 ${f1(x + w - q)} ${f1(y + h)} H${f1(x + q)} A${f1(q)} ${f1(q)} 0 0 1 ${f1(x)} ${f1(y + h - q)} `
    + `V${f1(y + q)} A${f1(q)} ${f1(q)} 0 0 1 ${f1(x + q)} ${f1(y)} Z`;
};
/** the outline half width in screen units, about 6.8 film pixels of stroke */
const OW = 3.4;

// =========================================================================================== parts

/** A many-stop vertical sky. Stops are [offset 0..1, colour]. */
export const SkyFill: React.FC<{stops: [number, string][]; x?: number; y?: number; w?: number; h?: number}> = ({
  stops, x = 0, y = 0, w = W, h = H,
}) => {
  const id = useUid();
  return <>
    <defs><linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
      {stops.map(([o, c], i) => <stop key={i} offset={o} stopColor={c} />)}</linearGradient></defs>
    <rect x={x} y={y} width={w} height={h} fill={`url(#${id}s)`} />
  </>;
};

/** A soft radial light, for a sun, a moon, a bright patch of sky or a lamp in fog */
export const Bloom: React.FC<{x: number; y: number; r: number; color: string; opacity?: number; ry?: number}> = ({
  x, y, r, color, opacity = 0.7, ry,
}) => {
  const id = useUid();
  return <>
    <defs><radialGradient id={`${id}b`}><stop offset="0%" stopColor={color} stopOpacity={opacity} />
      <stop offset="40%" stopColor={color} stopOpacity={opacity * 0.4} /><stop offset="100%" stopColor={color} stopOpacity={0} />
    </radialGradient></defs>
    <ellipse cx={x} cy={y} rx={r} ry={ry ?? r} fill={`url(#${id}b)`} />
  </>;
};

/** A horizontal band of haze that is clear at both edges, so it never prints its own outline */
export const Haze: React.FC<{y: number; h: number; color: string; opacity?: number; x?: number; w?: number}> = ({
  y, h, color, opacity = 0.6, x = -40, w = W + 80,
}) => {
  const id = useUid();
  return <>
    <defs><linearGradient id={`${id}h`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={color} stopOpacity={0} /><stop offset="55%" stopColor={color} stopOpacity={opacity} />
      <stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
    <rect x={x} y={y} width={w} height={h} fill={`url(#${id}h)`} />
  </>;
};

/** A soft blurred shape, for veils of dust, fog banks and the glow of a galaxy */
export const Soft: React.FC<{blur: number; opacity?: number; children: React.ReactNode}> = ({blur, opacity = 1, children}) => {
  const id = useUid();
  return <>
    <defs><filter id={`${id}f`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={blur} /></filter></defs>
    <g filter={`url(#${id}f)`} opacity={opacity}>{children}</g>
  </>;
};

export type Blob = {cx: number; cy: number; rx: number; ry: number};
export type CloudTone = {lit: string; mid: string; shade: string; base: string};
export const FAIR: CloudTone = {lit: '#ffffff', mid: '#eef2ff', shade: '#b4bfe6', base: '#8d94c8'};

/**
 * A CLOUD MASS. One outline pass under the whole group, then a soft body gradient, then every lobe
 * lit from the upper left on its own radial gradient, drawn from the top down so each lower lobe's
 * lit rim sits against the shade of the lobe above it. That edge is what reads as a cauliflower
 * bulge. A blurred shade band inside the mass darkens the base, and a sheen picks out the top lobes.
 * `base` adds a flat rounded foot, the flat base every cumulus has at one level.
 */
export const Cloud: React.FC<{blobs: Blob[]; tone?: CloudTone; base?: {x0: number; x1: number; y: number; h: number};
  ow?: number; sheen?: number; ink?: string; under?: string; underOpacity?: number; outline?: boolean; core?: Blob[]; side?: number}> = ({
  blobs, tone = FAIR, base, ow = OW, sheen = 0.55, ink, under, underOpacity = 0.5, outline = true, core = [], side = 0.5,
}) => {
  const id = useUid();
  if (!blobs.length) return null;
  const top = Math.min(...blobs.map((b) => b.cy - b.ry));
  const bot = Math.max(...blobs.map((b) => b.cy + b.ry), base ? base.y : -1e9);
  const left = Math.min(...blobs.map((b) => b.cx - b.rx)), right = Math.max(...blobs.map((b) => b.cx + b.rx));
  const L = ink ?? line(tone.shade);
  const sorted = [...blobs].sort((a, b) => a.cy - b.cy);
  const band = (b: Blob) => Math.min(2, Math.max(0, Math.floor(((b.cy - top) / Math.max(1, bot - top)) * 3)));
  const grads = [0, 1, 2].map((k) => ({lit: mix(tone.lit, tone.mid, k * 0.3), mid: mix(tone.mid, tone.shade, k * 0.28),
    sh: mix(tone.shade, tone.base, k * 0.35)}));
  const cap = base ? rr(base.x0, base.y - base.h, base.x1 - base.x0, base.h, base.h / 2) : undefined;
  const shapes = (props: React.SVGProps<SVGEllipseElement>) => <>
    {core.map((b, i) => <ellipse key={`k${i}`} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} {...props} />)}
    {blobs.map((b, i) => <ellipse key={i} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} {...props} />)}
    {cap && <path d={cap} {...(props as React.SVGProps<SVGPathElement>)} />}
  </>;
  const h = bot - top;
  return <g>
    <defs>
      {grads.map((g, k) => <linearGradient key={k} id={`${id}r${k}`} x1="0.2" y1="0" x2="0.45" y2="1">
        <stop offset="0%" stopColor={g.lit} /><stop offset="48%" stopColor={g.lit} /><stop offset="84%" stopColor={g.mid} />
        <stop offset="100%" stopColor={mix(g.mid, g.sh, 0.6)} /></linearGradient>)}
      <linearGradient id={`${id}m`} gradientUnits="userSpaceOnUse" x1={left} y1={top} x2={left + (right - left) * 0.3} y2={bot}>
        <stop offset="0%" stopColor={tone.lit} /><stop offset="50%" stopColor={tone.mid} /><stop offset="88%" stopColor={tone.shade} />
        <stop offset="100%" stopColor={tone.base} /></linearGradient>
      <linearGradient id={`${id}d`} gradientUnits="userSpaceOnUse" x1={left} y1={top} x2={right} y2={bot}>
        <stop offset="0%" stopColor={tone.shade} stopOpacity={0} /><stop offset="45%" stopColor={tone.shade} stopOpacity={0} />
        <stop offset="100%" stopColor={tone.base} stopOpacity={side} /></linearGradient>
      <clipPath id={`${id}c`}>{shapes({})}</clipPath>
      <filter id={`${id}f`} x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation={Math.max(4, h * 0.05)} /></filter>
    </defs>
    {outline && <g fill={L} stroke={L} strokeWidth={ow * 2} strokeLinejoin="round">{shapes({})}</g>}
    <g fill={`url(#${id}m)`}>{shapes({})}</g>
    {sorted.map((b, i) => <ellipse key={i} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} fill={`url(#${id}r${band(b)})`} />)}
    <g clipPath={`url(#${id}c)`}>
      {side > 0 && <rect x={left} y={top} width={right - left} height={bot - top} fill={`url(#${id}d)`} />}
      <g filter={`url(#${id}f)`}>
        <rect x={left - 40} y={bot - h * 0.2} width={right - left + 80} height={h * 0.4} fill={tone.base} opacity={0.62} />
        {under && <rect x={left - 40} y={bot - h * 0.08} width={right - left + 80} height={h * 0.16} fill={under} opacity={underOpacity} />}
      </g>
    </g>
    {sheen > 0 && sorted.slice(0, 3).map((b, i) => <ellipse key={`s${i}`} cx={b.cx - b.rx * 0.32} cy={b.cy - b.ry * 0.5}
      rx={b.rx * 0.28} ry={b.ry * 0.13} fill="#ffffff" opacity={sheen * (1 - i * 0.25)} transform={`rotate(-18 ${b.cx - b.rx * 0.32} ${b.cy - b.ry * 0.5})`} />)}
  </g>;
};

/**
 * A HEAP of lobes for a cumulus, a tower or a billow, rows from a flat base upward, each row
 * narrower by `taper` (negative widens it, a tower that spreads as it climbs), leaning by `lean`, and
 * every lobe breathing a little on `frame` so the cloud boils.
 */
export const heap = (cx: number, baseY: number, w: number, h: number, seed: number, frame: number,
  o: {rows?: number; taper?: number; lean?: number; dome?: boolean; boil?: number; squash?: number} = {}) => {
  const rows = o.rows ?? 3, taper = o.taper ?? 0.5, lean = o.lean ?? 0, boil = o.boil ?? 0.025, sq = o.squash ?? 0.92;
  const blobs: Blob[] = [];
  const r0 = h / (rows + 0.8);
  for (let i = 0; i < rows; i++) {
    const u = rows === 1 ? 0 : i / (rows - 1);
    const rowW = Math.max(r0, w * (1 - taper * u));
    const r = r0 * (1.05 - u * 0.12);
    const y = baseY - r * 0.95 - u * (h - r * 2.1);
    const n = Math.max(1, Math.round(rowW / (r * 1.75)));
    const topRow = i === rows - 1;
    for (let k = 0; k < n; k++) {
      // the silhouette is the edge lobes and the top row, the middle is the smooth core, so the mass reads as one form
      if (!topRow && n > 2 && k > 0 && k < n - 1 && hash(seed, 200 + i * 17 + k) > 0.55) continue;
      const j = hash(seed, i * 17 + k);
      const x = cx + lean * u * w + (n === 1 ? 0 : (k / (n - 1) - 0.5) * (rowW - r * 1.3)) + (j - 0.5) * r * 0.5;
      const rad = r * (0.8 + hash(seed, 50 + i * 17 + k) * 0.5) * (1 + boil * Math.sin(frame / 38 + seed + k * 1.7 + i * 2.3));
      const ry = rad * sq;
      blobs.push({cx: x, cy: Math.min(y + (j - 0.5) * r * 0.3, baseY - ry * 0.98), rx: rad, ry});
    }
  }
  if (o.dome !== false) {
    const rt = r0 * 0.95 * (1 + boil * Math.sin(frame / 31 + seed));
    blobs.push({cx: cx + lean * w + (hash(seed, 99) - 0.5) * r0 * 0.6, cy: baseY - h + rt * 0.92, rx: rt * 1.05, ry: rt * sq});
  }
  const wTop = Math.max(r0, w * (1 - taper)), wMid = (w + wTop) / 2;
  return {blobs, base: {x0: cx - w / 2 + r0 * 0.25, x1: cx + w / 2 - r0 * 0.25, y: baseY, h: r0 * 0.8},
    core: [{cx: cx + lean * w * 0.5, cy: baseY - h * 0.46, rx: wMid * 0.46, ry: h * 0.42}]};
};

/** A fair weather cumulus, flat based, `w` wide, drifting with the frame */
export const Cumulus: React.FC<{cx: number; baseY: number; w: number; h?: number; seed?: number; frame?: number; tone?: CloudTone;
  rows?: number; under?: string}> = ({cx, baseY, w, h, seed = 1, frame = 0, tone = FAIR, rows = 2, under}) => {
  const c = heap(cx, baseY, w, h ?? w * 0.52, seed, frame, {rows, taper: 0.4});
  return <Cloud blobs={c.blobs} base={c.base} core={c.core} tone={tone} under={under} />;
};

/**
 * RAIN. A curtain that fades as it falls, with streaks that fall through it. `fade` below 1 stops
 * the streaks part way down, which is virga. The curtain is a soft trapezoid from (a, b) at the top
 * to (c, d) at the bottom.
 */
export const Rain: React.FC<{a: number; b: number; c: number; d: number; y0: number; y1: number; frame: number; color?: string;
  streak?: string; n?: number; speed?: number; seed?: number; fade?: number; opacity?: number}> = ({
  a, b, c, d, y0, y1, frame, color = '#6e7cae', streak = '#dde6ff', n = 40, speed = 26, seed = 1, fade = 1, opacity = 0.7,
}) => {
  const id = useUid();
  const hgt = y1 - y0, stop = y0 + hgt * fade;
  const curtain = `M${a} ${y0} L${b} ${y0} Q${b + (d - b) * 0.5 + 10} ${y0 + hgt * 0.5} ${d} ${y1} L${c} ${y1} Q${a + (c - a) * 0.5 - 10} ${y0 + hgt * 0.5} ${a} ${y0} Z`;
  return <g>
    <defs>
      <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity={opacity} />
        <stop offset={`${Math.round(fade * 70)}%`} stopColor={color} stopOpacity={opacity * 0.55} />
        <stop offset={`${Math.round(fade * 100)}%`} stopColor={color} stopOpacity={0} />
      </linearGradient>
      <filter id={`${id}f`} x="-20%" y="-10%" width="140%" height="120%"><feGaussianBlur stdDeviation={9} /></filter>
      <clipPath id={`${id}c`}><path d={curtain} /></clipPath>
    </defs>
    <path d={curtain} fill={`url(#${id}g)`} filter={`url(#${id}f)`} />
    <g clipPath={`url(#${id}c)`}>
      {Array.from({length: n}, (_, i) => {
        const u = hash(seed, i), len = 50 + hash(seed, 100 + i) * 70;
        const y = y0 - len + ((frame * speed * (0.8 + hash(seed, 200 + i) * 0.5) + hash(seed, 300 + i) * hgt * 3) % (hgt + len));
        const t = Math.min(1, Math.max(0, (y - y0) / hgt));
        const x = a + (c - a) * t + ((b + (d - b) * t) - (a + (c - a) * t)) * u;
        const life = y > stop ? 0 : 1 - Math.max(0, (y - (stop - hgt * 0.25)) / (hgt * 0.25));
        return <path key={i} d={`M${f1(x)} ${f1(y)} l${f1((d - b) * len / hgt * 0.6 + (c - a) * len / hgt * 0.4)} ${f1(len)}`}
          stroke={streak} strokeWidth={2.6 + hash(seed, 400 + i) * 2} strokeLinecap="round" opacity={0.55 * life} />;
      })}
    </g>
  </g>;
};

/** A LIGHTNING STROKE that strikes now and then from (x, y0) toward y1, with a sky flash on the hit */
export const Bolt: React.FC<{x: number; y0: number; y1: number; frame: number; period?: number; seed?: number; spread?: number;
  flash?: boolean; color?: string}> = ({x, y0, y1, frame, period = 84, seed = 1, spread = 120, flash = true, color = '#e8eeff'}) => {
  const id = useUid();
  const k = Math.floor((frame + seed * 13) / period), ph = (frame + seed * 13) % period;
  if (ph > 6) return null;
  const on = ph < 2 || ph === 4 || ph === 5 ? 1 : 0.35;
  const n = 9, pts: [number, number][] = [];
  let px = x + (hash(seed + k, 1) - 0.5) * spread;
  for (let i = 0; i <= n; i++) {
    pts.push([px, y0 + (y1 - y0) * (i / n)]);
    px += (hash(seed + k, 10 + i) - 0.5) * spread * 0.55;
  }
  const d = `M${pts.map((p) => `${f1(p[0])} ${f1(p[1])}`).join(' L')}`;
  const bi = 3 + Math.floor(hash(seed + k, 40) * 3), bp = pts[bi];
  const branch = `M${f1(bp[0])} ${f1(bp[1])} l${f1((hash(seed + k, 41) - 0.5) * spread)} ${f1((y1 - y0) * 0.14)} l${f1((hash(seed + k, 42) - 0.5) * spread * 0.6)} ${f1((y1 - y0) * 0.12)}`;
  return <g opacity={on}>
    <defs><filter id={`${id}g`} x="-100%" y="-20%" width="300%" height="140%"><feGaussianBlur stdDeviation={10} /></filter></defs>
    {flash && <rect x={-40} y={-40} width={W + 80} height={H + 80} fill="#eef2ff" opacity={0.16} />}
    <g filter={`url(#${id}g)`}><path d={d} stroke="#9fb4ff" strokeWidth={24} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <path d={branch} stroke="#9fb4ff" strokeWidth={16} fill="none" strokeLinejoin="round" strokeLinecap="round" /></g>
    <path d={d} stroke={color} strokeWidth={7} fill="none" strokeLinejoin="round" strokeLinecap="round" />
    <path d={branch} stroke={color} strokeWidth={4} fill="none" strokeLinejoin="round" strokeLinecap="round" />
  </g>;
};

/** A sun disc, a soft bloom, a lit disc and, when `glare` is off, no rays at all */
const SunDisc: React.FC<{x: number; y: number; r: number; color: string; glow?: string; bloom?: number; edge?: number}> = ({
  x, y, r, color, glow, bloom = 0.7, edge = 0,
}) => {
  const id = useUid();
  return <>
    <Bloom x={x} y={y} r={r * 7} color={glow ?? color} opacity={bloom} />
    <defs><radialGradient id={`${id}d`} cx="0.42" cy="0.38" r="0.62"><stop offset="0%" stopColor={light(color, 0.6)} />
      <stop offset={`${80 - edge * 30}%`} stopColor={color} /><stop offset="100%" stopColor={color} stopOpacity={1 - edge * 0.8} /></radialGradient></defs>
    <circle cx={x} cy={y} r={r} fill={`url(#${id}d)`} />
  </>;
};

// ====================================================================================== the states

/** THE TOWERING THUNDERHEAD. A flat dark base, a tower that spreads as it climbs, the anvil spread
 *  downwind with mammatus under it, an overshooting top, a rain shaft and the odd stroke of lightning */
export const ThunderheadV2: React.FC<SkyV2Props & {cx?: number; anvil?: boolean; mammatus?: boolean; rainShaft?: boolean;
  lightning?: boolean}> = ({seed = 61, frame = 0, horizonY = 1290, intensity = 1, cx = 620, anvil = true, mammatus = true,
  rainShaft = true, lightning = true}) => {
  const id = useUid();
  const I = intensity, top = horizonY - 1090 * I, baseY = horizonY - 300;
  const drift = Math.sin(frame / 260) * 14;
  const tone: CloudTone = {lit: '#fffaf0', mid: '#e8ecf6', shade: '#a8b4dc', base: '#5a6498'};
  const tower = heap(cx, baseY, 560 * I, baseY - top - 60 * I, seed, frame, {rows: 5, taper: -0.35, boil: 0.03});
  const anvilY = top + 70 * I, ax0 = cx - 520 * I, ax1 = cx + 760 * I;
  const anvilD = `M${ax0} ${anvilY + 30} C${ax0 - 40} ${anvilY - 30} ${ax0 + 60} ${anvilY - 66 * I} ${cx - 120} ${anvilY - 70 * I}`
    + ` C${cx + 200} ${anvilY - 80 * I} ${ax1 - 120} ${anvilY - 50 * I} ${ax1} ${anvilY - 20}`
    + ` C${ax1 + 60} ${anvilY} ${ax1 + 30} ${anvilY + 50 * I} ${ax1 - 80} ${anvilY + 50 * I}`
    + ` C${cx + 200} ${anvilY + 66 * I} ${ax0 + 120} ${anvilY + 70 * I} ${ax0 + 30} ${anvilY + 62 * I} C${ax0 - 10} ${anvilY + 56 * I} ${ax0 - 6} ${anvilY + 44} ${ax0} ${anvilY + 30} Z`;
  const mam: Blob[] = mammatus ? Array.from({length: 11}, (_, i) => {
    const x = ax0 + 140 + i * ((ax1 - ax0 - 280) / 10) + (hash(seed, 90 + i) - 0.5) * 30;
    if (Math.abs(x - cx) < 280 * I) return null;
    const r = 30 + hash(seed, 110 + i) * 14;
    return {cx: x, cy: anvilY + 58 * I + r * 0.55 + Math.sin(frame / 50 + i) * 2, rx: r * 1.1, ry: r};
  }).filter((b): b is Blob => b !== null) : [];
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <SkyFill stops={[[0, '#1f56c4'], [0.28, '#3f7fe0'], [0.5, '#7fb0f0'], [0.66, '#c3dcf6'], [0.75, '#f6e2c4'], [1, '#f8d8b0']]} />
      <Bloom x={120} y={260} r={760} color="#fff3d6" opacity={0.45} />
      <g transform={`translate(${drift} 0)`}>
        {anvil && <g>
          <path d={anvilD} fill={line(tone.shade)} stroke={line(tone.shade)} strokeWidth={OW * 2} strokeLinejoin="round" />
          {mam.length > 0 && <Cloud blobs={mam} tone={{...tone, lit: tone.mid}} sheen={0} />}
          <defs><linearGradient id={`${id}a`} x1="0" y1="0" x2="0.15" y2="1">
            <stop offset="0%" stopColor={tone.lit} /><stop offset="55%" stopColor={tone.mid} /><stop offset="100%" stopColor={tone.shade} />
          </linearGradient></defs>
          <path d={anvilD} fill={`url(#${id}a)`} />
          {Array.from({length: 7}, (_, i) => {
            const y = anvilY - 40 * I + i * 12 * I, x = ax0 + 200 + hash(seed, i) * 300 + Math.sin(frame / 90 + i) * 10;
            return <path key={i} d={`M${x} ${y} Q${(x + ax1) / 2} ${y - 6} ${ax1 - 60 - hash(seed, 20 + i) * 200} ${y + 4}`}
              stroke={i < 3 ? '#ffffff' : tone.shade} strokeWidth={5} strokeLinecap="round" fill="none" opacity={i < 3 ? 0.6 : 0.35} />;
          })}
          <path d={`M${ax0 + 30} ${anvilY - 20 * I} Q${cx - 160} ${anvilY - 60 * I} ${cx + 100} ${anvilY - 62 * I}`} stroke="#ffffff"
            strokeWidth={10} strokeLinecap="round" fill="none" opacity={0.7} />
        </g>}
        {rainShaft && <Rain a={cx - 240 * I} b={cx + 220 * I} c={cx - 300 * I} d={cx + 200 * I} y0={baseY - 30} y1={horizonY + 40}
          frame={frame} seed={seed} color="#5a62a0" opacity={0.75} />}
        {lightning && rainShaft && <Bolt x={cx - 40} y0={baseY} y1={horizonY} frame={frame} seed={seed} period={96} />}
        <Cloud blobs={tower.blobs} base={tower.base} core={tower.core} tone={tone} under="#e8b8c0" underOpacity={0.3} />
        {anvil && <Cloud blobs={[{cx: cx + 30, cy: top + 26, rx: 120 * I, ry: 74 * I}, {cx: cx - 60, cy: top + 70, rx: 110 * I, ry: 60 * I}]}
          tone={tone} />}
      </g>
      <Haze y={horizonY - 220} h={300} color="#ffe8c8" opacity={0.55} />
    </svg>
  );
};

/** THE SUPERCELL BASE. Stacked smooth plates turning about one axis, striations that slide round,
 *  a gold rim on the low sun side, a wall cloud, a hard edged rain curtain, a bright strip beneath */
export const SupercellV2: React.FC<SkyV2Props & {cx?: number; plates?: number; wallCloud?: boolean}> = ({
  seed = 62, frame = 0, horizonY = 1290, intensity = 1, cx = 560, plates = 7, wallCloud = true,
}) => {
  const id = useUid();
  const spin = frame / 30;
  const slate = '#3f4a78', ink = line(slate);
  const P = Array.from({length: plates}, (_, i) => {
    const f = plates === 1 ? 0 : i / (plates - 1);
    return {f, rx: (620 - f * 300) * intensity, ry: 96 - f * 40, x: Math.sin(spin * 0.35 + i * 0.7) * 24, y: f * 250};
  });
  const oy = horizonY - 520;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        {P.map((p, i) => <linearGradient key={i} id={`${id}p${i}`} x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stopColor={mix('#6e78a8', '#9a8cb8', p.f)} /><stop offset="60%" stopColor={mix('#3c467a', '#4e5288', p.f)} />
          <stop offset="100%" stopColor={mix('#262c58', '#323866', p.f)} /></linearGradient>)}
        <clipPath id={`${id}cur`}><path d={`M${cx + 300} -50 L${W + 60} -50 L${W + 60} ${horizonY + 40} L${cx + 330} ${horizonY + 40} Q${cx + 270} ${horizonY * 0.5} ${cx + 300} -50 Z`} /></clipPath>
      </defs>
      <SkyFill stops={[[0, '#16243f'], [0.3, '#2c3e5e'], [0.52, '#5a5f7e'], [0.62, '#b58a72'], [0.68, '#f2b56e'], [0.75, '#ffd896'], [1, '#ffe2aa']]} />
      {/* the precipitation curtain behind, with a hard vertical edge */}
      <g>
        <path d={`M${cx + 300} -50 L${W + 60} -50 L${W + 60} ${horizonY + 40} L${cx + 330} ${horizonY + 40} Q${cx + 270} ${horizonY * 0.5} ${cx + 300} -50 Z`}
          fill="#2a3358" opacity={0.85} />
        <g clipPath={`url(#${id}cur)`}><Rain a={cx + 260} b={W + 60} c={cx + 290} d={W + 60} y0={oy - 100} y1={horizonY + 40} frame={frame}
          seed={seed} color="#232a4e" streak="#a8b4e0" n={34} opacity={0.6} /></g>
        <Bolt x={cx + 470} y0={oy + 40} y1={horizonY} frame={frame} seed={seed + 3} period={110} spread={90} />
      </g>
      <g transform={`translate(${cx} ${oy})`}>
        {/* outline pass of every plate first, then fills from the top plate down */}
        {P.map((p, i) => <ellipse key={`o${i}`} cx={p.x} cy={p.y} rx={p.rx} ry={p.ry} fill={ink} stroke={ink} strokeWidth={OW * 2} />)}
        {wallCloud && <rect x={-190 * intensity + Math.sin(spin * 0.5) * 18} y={240} width={380 * intensity} height={110} rx={50}
          fill={ink} stroke={ink} strokeWidth={OW * 2} />}
        {P.map((p, i) => <g key={i}>
          {/* the gold rim on the low sun side, under the plate, so the plate leaves a crescent of it */}
          <ellipse cx={p.x + p.rx * 0.02} cy={p.y + p.ry * 0.16} rx={p.rx * 0.995} ry={p.ry * 0.96} fill={p.f > 0.3 ? '#f2b56e' : '#8a7a9a'}
            opacity={0.5 + p.f * 0.5} />
          <ellipse cx={p.x} cy={p.y - p.ry * 0.04} rx={p.rx * 0.985} ry={p.ry * 0.92} fill={`url(#${id}p${i})`} />
          {/* striations sliding round the axis, which is how the eye sees it turn */}
          <ellipse cx={p.x} cy={p.y - p.ry * 0.3} rx={p.rx * 0.8} ry={p.ry * 0.42} fill="none" stroke="#c4bce0" strokeWidth={4}
            strokeLinecap="round" strokeDasharray={`${p.rx * 0.5} ${p.rx * 0.9}`} strokeDashoffset={-frame * (3 + i)} opacity={0.32} />
          <ellipse cx={p.x - p.rx * 0.3} cy={p.y - p.ry * 0.52} rx={p.rx * 0.22} ry={p.ry * 0.12} fill="#ffffff" opacity={0.18} />
        </g>)}
        {wallCloud && <g>
          <defs><linearGradient id={`${id}w`} x1="0" y1="0" x2="0.3" y2="1"><stop offset="0%" stopColor="#4a5284" />
            <stop offset="100%" stopColor="#1e2448" /></linearGradient></defs>
          <rect x={-190 * intensity + Math.sin(spin * 0.5) * 18} y={240} width={380 * intensity} height={110} rx={50} fill={`url(#${id}w)`} />
          <path d={`M${-150 * intensity} 300 Q0 ${320 + Math.sin(spin) * 6} ${150 * intensity} 300`} stroke="#8a86b4" strokeWidth={4}
            fill="none" strokeLinecap="round" opacity={0.4} />
        </g>}
      </g>
      {/* the bright sunlit strip under the storm, which is the whole composition */}
      <Haze y={horizonY - 170} h={260} color="#fff0c8" opacity={0.75} />
    </svg>
  );
};

/** THE SHELF CLOUD. Smooth stacked lips on the leading face catching the light, a turbulent near
 *  black underside, scud racing up into it, and clear sunlit air still ahead of it */
export const ShelfCloudV2: React.FC<SkyV2Props & {approach?: number; scud?: boolean}> = ({
  seed = 63, frame = 0, horizonY = 1290, intensity = 1, approach = 0.5, scud = true,
}) => {
  const id = useUid();
  const wy = horizonY - 300 - approach * 620;
  const face = '#d6d4e8', deep = '#262a52';
  const edge = (i: number, x: number, dy = 0) => {
    const t = x / W;
    const y0 = wy + 220 - i * 46, y1 = wy + 30 - i * 40;
    return y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * (40 - i * 4) + dy;
  };
  const lip = (i: number, th: number) => {
    const xs = Array.from({length: 13}, (_, k) => -60 + k * ((W + 120) / 12));
    const bot = xs.map((x) => `${f1(x)} ${f1(edge(i, x))}`), topE = [...xs].reverse().map((x) => `${f1(x)} ${f1(edge(i, x, -th))}`);
    return `M${bot.join(' L')} L${topE.join(' L')} Z`;
  };
  const under: Blob[] = Array.from({length: 13}, (_, i) => {
    const x = -50 + i * 96 + (hash(seed, i) - 0.5) * 40, r = 48 + hash(seed, 20 + i) * 44;
    return {cx: x, cy: edge(0, x) + r * 0.3 + hash(seed, 30 + i) * 24 + Math.sin(frame / 22 + i * 1.3) * 6, rx: r * 1.35, ry: r * 0.85};
  });
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <SkyFill stops={[[0, '#141836'], [0.25, '#262a52'], [0.45, '#3c4470'], [0.55, '#8ab0d8'], [0.64, '#bcd8f0'], [0.7, '#fbe6c0'], [1, '#ffe0b0']]} />
      {/* the clear sunlit air ahead, its own soft gradient from the shelf down */}
      <defs><linearGradient id={`${id}air`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7fa8d8" />
        <stop offset="70%" stopColor="#c6e0f4" /><stop offset="100%" stopColor="#ffe4b8" /></linearGradient>
        <linearGradient id={`${id}st`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10142e" />
          <stop offset="100%" stopColor="#30366a" /></linearGradient></defs>
      <rect x={0} y={wy} width={W} height={horizonY - wy + 200} fill={`url(#${id}air)`} />
      <Bloom x={160} y={horizonY - 120} r={700} ry={260} color="#fff2cc" opacity={0.7} />
      {/* the storm body behind, top of frame down to the shelf */}
      <path d={`M-40 -40 L${W + 40} -40 L${W + 40} ${edge(4, W + 40, -40)} ${Array.from({length: 13}, (_, k) => {
        const x = W + 40 - k * ((W + 80) / 12);
        return `L${f1(x)} ${f1(edge(4, x, -40))}`;
      }).join(' ')} Z`} fill={`url(#${id}st)`} />
      <Rain a={-40} b={W + 40} c={-40} d={W + 40} y0={-40} y1={edge(4, W / 2, -60)} frame={frame} seed={seed} color="#0e1230"
        streak="#6a74a8" n={30} opacity={0.4} />
      {/* outline pass of the underside lobes and every lip, then the fills from the back lip forward */}
      <g fill={line(deep)} stroke={line(deep)} strokeWidth={OW * 2} strokeLinejoin="round">
        {under.map((b, i) => <ellipse key={i} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} />)}
      </g>
      <Cloud blobs={under} tone={{lit: '#5a5e8c', mid: '#3a3e6a', shade: '#242850', base: '#141832'}} sheen={0} outline={false} />
      {[4, 3, 2, 1, 0].map((i) => {
        const c = mix(face, '#7a80b0', i * 0.18);
        return <g key={i}>
          <defs><linearGradient id={`${id}l${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={light(c, 0.35)} />
            <stop offset="45%" stopColor={c} /><stop offset="100%" stopColor={shade(c, 0.45)} /></linearGradient></defs>
          <path d={lip(i, 72 - i * 5)} fill={`url(#${id}l${i})`} stroke={line(c)} strokeWidth={OW * 2} strokeLinejoin="round" paintOrder="stroke" />
          <path d={`M-60 ${f1(edge(i, -60, -62 + i * 4))} ${Array.from({length: 13}, (_, k) => {
            const x = -60 + k * ((W + 120) / 12);
            return `L${f1(x)} ${f1(edge(i, x, -62 + i * 4))}`;
          }).join(' ')}`} stroke="#ffffff" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.45 - i * 0.06} />
        </g>;
      })}
      {scud && Array.from({length: 14}, (_, i) => {
        const p = ((frame / 30) * 0.4 + hash(seed, 40 + i)) % 1;
        const x = hash(seed, 60 + i) * W, y = edge(0, x) + 120 - p * 100, r = 26 + hash(seed, 80 + i) * 30;
        return <g key={i} opacity={Math.min(1, (1 - p) * 1.6) * 0.9}>
          <Cloud blobs={[{cx: x, cy: y, rx: r * 1.4, ry: r * 0.5}, {cx: x + r * 0.6, cy: y - r * 0.3, rx: r * 0.7, ry: r * 0.45}]}
            tone={{lit: '#6c7098', mid: '#4a4e78', shade: '#30345c', base: '#20244a'}} sheen={0} ow={2.4} />
        </g>;
      })}
      <Haze y={horizonY - 160} h={240} color="#fff0d0" opacity={0.6} />
    </svg>
  );
};

/** THE BLUE NORTHER EDGE. Darkest at the horizon. A long roll cloud lit along its top, a ragged
 *  underside, the flat deck behind it and scud racing ahead. `passed` draws the scrubbed blue after it */
export const BlueNortherV2: React.FC<SkyV2Props & {passed?: boolean; lineY?: number; roll?: boolean}> = ({
  seed = 64, frame = 0, horizonY = 1290, intensity = 1, passed = false, lineY, roll = true,
}) => {
  const id = useUid();
  const ly = lineY ?? horizonY - 240 - intensity * 120;
  const tilt = (x: number) => ly - (x / W) * 18;
  const rollC = '#5a6aa0';
  if (passed) {
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <SkyFill stops={[[0, '#0f3e9a'], [0.35, '#1f5cc4'], [0.6, '#4f8ae0'], [0.7, '#9cc4f2'], [1, '#c8defa']]} />
        <Bloom x={140} y={240} r={700} color="#f0f6ff" opacity={0.4} />
        {Array.from({length: 5}, (_, i) => {
          const x = ((140 + i * 220 + frame * 0.6) % (W + 240)) - 120;
          return <Cumulus key={i} cx={x} baseY={horizonY - 640 - hash(seed, i) * 280} w={150 + hash(seed, 10 + i) * 70} seed={seed + i * 23}
            frame={frame} />;
        })}
        <Haze y={horizonY - 200} h={260} color="#e8f2ff" opacity={0.5} />
      </svg>
    );
  }
  const rag = Array.from({length: 15}, (_, i) => {
    const x = -40 + i * 80 + (hash(seed, i) - 0.5) * 24, r = 32 + hash(seed, 20 + i) * 30;
    return {cx: x, cy: tilt(x) + 70 + r * 0.35 + Math.sin(frame / 26 + i) * 4, rx: r * 1.5, ry: r * 0.8};
  });
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <SkyFill stops={[[0, '#2c64c0'], [0.3, '#5a8ad4'], [0.48, '#8eb0e0'], [0.56, '#b4c8e8'], [1, '#c4d2ea']]} />
      <Bloom x={180} y={300} r={760} color="#fff6e0" opacity={0.45} />
      {/* the deck behind the line, low, flat, darkening all the way to the horizon */}
      <defs><linearGradient id={`${id}d`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3a4878" />
        <stop offset="100%" stopColor="#141a36" /></linearGradient>
        <linearGradient id={`${id}r`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={light(rollC, 0.5)} />
          <stop offset="40%" stopColor={rollC} /><stop offset="100%" stopColor={shade(rollC, 0.55)} /></linearGradient></defs>
      <path d={`M-40 ${tilt(-40) + 20} L${W + 40} ${tilt(W + 40) + 20} L${W + 40} ${horizonY + 200} L-40 ${horizonY + 200} Z`} fill={`url(#${id}d)`} />
      <g fill={line('#2a3460')} stroke={line('#2a3460')} strokeWidth={OW * 2}>{rag.map((b, i) => <ellipse key={i} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} />)}</g>
      <Cloud blobs={rag} tone={{lit: '#4a5888', mid: '#323e6e', shade: '#222a54', base: '#161c3c'}} sheen={0} outline={false} />
      {roll && <g>
        <path d={`M-60 ${tilt(-60) - 60} Q${W / 2} ${tilt(W / 2) - 84} ${W + 60} ${tilt(W + 60) - 60} L${W + 60} ${tilt(W + 60) + 56} Q${W / 2} ${tilt(W / 2) + 76} -60 ${tilt(-60) + 56} Z`}
          fill={`url(#${id}r)`} stroke={line(rollC)} strokeWidth={OW * 2} strokeLinejoin="round" paintOrder="stroke" />
        {/* the roll turns, soft bands slide along its length */}
        {Array.from({length: 6}, (_, i) => {
          const x = ((i * 220 + frame * 1.4) % (W + 300)) - 150;
          return <ellipse key={i} cx={x} cy={tilt(x) + 10} rx={90} ry={34} fill={shade(rollC, 0.3)} opacity={0.3} />;
        })}
        <path d={`M-60 ${tilt(-60) - 44} Q${W / 2} ${tilt(W / 2) - 68} ${W + 60} ${tilt(W + 60) - 44}`} stroke="#e6ecff" strokeWidth={9}
          fill="none" strokeLinecap="round" opacity={0.55} />
      </g>}
      {Array.from({length: 9}, (_, i) => {
        const p = ((frame / 30) * 0.55 + hash(seed, 30 + i)) % 1;
        const x = ((hash(seed, 50 + i) * W + p * 260) % (W + 100)) - 50, y = tilt(x) + 130 + p * 90, r = 22 + hash(seed, 70 + i) * 24;
        return <g key={i} opacity={(1 - p) * 0.9}><Cloud blobs={[{cx: x, cy: y, rx: r * 1.6, ry: r * 0.5}, {cx: x - r * 0.5, cy: y - r * 0.25, rx: r * 0.8, ry: r * 0.45}]}
          tone={{lit: '#5a6694', mid: '#3e4a78', shade: '#2a3460', base: '#1c2448'}} sheen={0} ow={2.4} /></g>;
      })}
    </svg>
  );
};

/** THE TEXAS SUNSET. Bands of vermilion, coral, hot pink, lavender and blue, a low sun, and long
 *  cirrus lit from below that run gold to magenta to violet the higher they sit */
export const SunsetBandsV2: React.FC<SkyV2Props & {cirrus?: number; beltOfVenus?: boolean; phase?: number}> = ({
  seed = 65, frame = 0, horizonY = 1290, intensity = 1, cirrus = 9, beltOfVenus = false, phase = 0.5,
}) => {
  const id = useUid();
  const hy = horizonY / H;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <SkyFill stops={[[0, '#16285e'], [hy * 0.3, '#34408a'], [hy * 0.5, '#6a54a4'], [hy * 0.66, '#b45aa6'], [hy * 0.8, '#f2668a'],
        [hy * 0.9, '#ff7a4a'], [hy * 0.97, '#ffa040'], [hy, '#ffc860'], [1, '#ffb050']]} />
      <SunDisc x={W * 0.62} y={horizonY - 30 + phase * 40} r={70} color="#fff0b0" glow="#ffb860" bloom={0.85} />
      <Haze y={horizonY - 260} h={320} color="#ffd890" opacity={0.5} />
      {Array.from({length: cirrus}, (_, i) => {
        const f = cirrus === 1 ? 0 : i / (cirrus - 1);
        const cy = horizonY - 150 - f * 940 * intensity;
        const heat = Math.max(0, 1 - f * 1.2) * (0.5 + phase);
        const col = heat > 0.85 ? '#ffc070' : heat > 0.6 ? '#ff9a5a' : heat > 0.35 ? '#f2609a' : heat > 0.15 ? '#b05cb0' : '#6a58a8';
        const x0 = W * (hash(seed, i) * 0.5 - 0.25) + Math.sin(frame / 120 + i) * 14 + frame * 0.25 * (1 - f * 0.5);
        const len = W * (0.45 + hash(seed, 20 + i) * 0.55), th = 16 + hash(seed, 40 + i) * 14, n = 7;
        const blobs: Blob[] = Array.from({length: n}, (_, k) => {
          const u = k / (n - 1), bump = Math.sin(u * Math.PI);
          return {cx: x0 + u * len, cy: cy - Math.sin(u * 2.4 + i) * th * 0.6, rx: len / n * (0.75 + hash(seed, 60 + i * 9 + k) * 0.4),
            ry: th * (0.45 + bump * 0.75)};
        });
        return <g key={i} transform={`translate(0 ${2 * cy}) scale(1 -1)`} opacity={0.94}>
          <Cloud blobs={blobs} tone={{lit: light(col, 0.7), mid: col, shade: shade(col, 0.3), base: shade(col, 0.45)}} ow={2.6} sheen={0.35} />
        </g>;
      })}
      {beltOfVenus && <>
        <Haze y={horizonY - 330} h={200} color="#ff9ec0" opacity={0.6} />
        <Haze y={horizonY - 170} h={220} color="#4a5a9c" opacity={0.6} />
      </>}
    </svg>
  );
};

/** DUST HAZE. Blue gone from the low sky, a flat disc of a sun with no rays, veils of suspended soil
 *  drifting across. `wall` brings in a haboob, a rolling cliff of dust with daylight still ahead */
export const DustHazeV2: React.FC<SkyV2Props & {wall?: number; sunX?: number}> = ({
  seed = 66, frame = 0, horizonY = 1290, intensity = 1, wall = 0, sunX = 780,
}) => {
  const wx = W * (1 - wall) - 260;
  const topY = horizonY - 1000 * intensity;
  // the wall is one heap leaning forward, its lobed leading edge rolling on `frame`, lighter at the top and dark at the base
  const roll = Math.sin(frame / 60) * 12;
  const wallHeap = heap(wx + 560 + roll, horizonY + 60, 1000, horizonY + 60 - topY, seed, frame, {rows: 10, taper: 0.12, lean: -0.12, boil: 0.04});
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <SkyFill stops={[[0, '#5a7fb0'], [0.25, '#8aa0b8'], [0.45, '#c2b494'], [0.6, '#dcb47a'], [0.67, '#e8b066'], [1, '#e4aa64']]} />
      <SunDisc x={sunX} y={horizonY - 620} r={50} color="#ffe2a0" glow="#ffd090" bloom={0.4} edge={0.6} />
      <Soft blur={30} opacity={0.6}>
        {Array.from({length: 7}, (_, i) => {
          const x = ((hash(seed, i) * W + frame * (0.6 + i * 0.15)) % (W + 600)) - 300;
          return <ellipse key={i} cx={x} cy={horizonY - 120 - hash(seed, 10 + i) * 700} rx={360 + hash(seed, 20 + i) * 200} ry={50 + hash(seed, 30 + i) * 40}
            fill={i % 2 ? '#f0c888' : '#c8986a'} />;
        })}
      </Soft>
      {wall > 0 && <g>
        <Cloud blobs={wallHeap.blobs} core={[...wallHeap.core, {cx: wx + 700, cy: horizonY - 300, rx: 600, ry: 380}]} tone={{lit: '#fbe0b0',
          mid: '#e0ae74', shade: '#ac7a4c', base: '#5a3a26'}} sheen={0.3} side={0.4} under="#4a2e1e" underOpacity={0.5} />
        <Soft blur={18} opacity={0.55}>{Array.from({length: 6}, (_, i) => <ellipse key={i} cx={wx + 120 + i * 160 + Math.sin(frame / 20 + i) * 20}
          cy={horizonY - 50 - (i % 2) * 60} rx={150} ry={56} fill="#4a2e1e" />)}</Soft>
        {Array.from({length: 16}, (_, i) => {
          const p = ((frame / 30) * 0.25 + hash(seed, i)) % 1;
          return <circle key={i} cx={wx - 20 - hash(seed, 30 + i) * 160 + p * 60} cy={horizonY - 20 - p * 380} r={3 + hash(seed, 50 + i) * 4}
            fill="#8a6440" opacity={(1 - p) * 0.7} />;
        })}
      </g>}
      <Haze y={horizonY - 260} h={360} color="#f2c27c" opacity={0.7} />
    </svg>
  );
};

/** GULF OVERCAST. A smooth continuous deck in a narrow range of soft violet greys, thicker rolls
 *  barely darker, a lift toward the horizon, and slow scud. No cast shadows, so nothing hard in it */
export const GulfOvercastV2: React.FC<SkyV2Props & {scud?: number}> = ({seed = 67, frame = 0, horizonY = 1290, scud = 3}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <SkyFill stops={[[0, '#9a9cb8'], [0.35, '#b2b4c8'], [0.6, '#c6c6d2'], [0.68, '#dcd8d8'], [1, '#e2dcd4']]} />
    <Soft blur={26} opacity={0.5}>
      {Array.from({length: 8}, (_, i) => {
        const y = 120 + i * ((horizonY - 300) / 7), x = ((hash(seed, i) * W + frame * 0.25) % (W + 800)) - 400;
        return <g key={i}>
          <ellipse cx={x} cy={y + 30} rx={W * 0.55} ry={70 - i * 4} fill="#8e90ac" />
          <ellipse cx={x - 40} cy={y} rx={W * 0.5} ry={52 - i * 3} fill="#d4d4e2" />
        </g>;
      })}
    </Soft>
    <Haze y={horizonY - 300} h={360} color="#f0eae2" opacity={0.6} />
    {Array.from({length: scud}, (_, i) => {
      const p = ((frame / 30) * 0.06 + hash(seed, 40 + i)) % 1.2;
      const x = p * (W + 400) - 200, y = horizonY - 200 - hash(seed, 60 + i) * 160;
      return <Soft key={i} blur={14} opacity={0.55}>
        {Array.from({length: 5}, (_, k) => <ellipse key={k} cx={x + (k - 2) * 70 + hash(seed, 80 + i * 5 + k) * 30} cy={y + Math.sin(k * 1.7) * 10}
          rx={60 + hash(seed, 90 + i * 5 + k) * 40} ry={18 + hash(seed, 95 + i * 5 + k) * 10} fill={k % 2 ? '#8e90ac' : '#a2a4bc'} />)}
      </Soft>;
    })}
  </svg>
);

/** COASTAL SEA FOG. Banks that fade by distance in steps and drift at their own speeds, lamps that
 *  bloom. `ceiling` gives it a defined top with clear blue air above, the stronger coast frame */
export const SeaFogV2: React.FC<SkyV2Props & {ceiling?: number; lamps?: {x: number; y: number}[]}> = ({
  seed = 68, frame = 0, horizonY = 1290, intensity = 1, ceiling = 0, lamps = [],
}) => {
  const top = ceiling > 0 ? horizonY - ceiling : 0;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {ceiling > 0
        ? <SkyFill stops={[[0, '#3a74c8'], [Math.max(0.05, top / H - 0.05), '#8ab4e4'], [top / H, '#d8e6f4'], [1, '#e8eef2']]} />
        : <SkyFill stops={[[0, '#c4ccd8'], [0.4, '#d6dce2'], [0.7, '#e4e6e6'], [1, '#ecebe6']]} />}
      {ceiling > 0 && <g>
        <Cloud blobs={Array.from({length: 12}, (_, i) => {
          const x = -40 + i * 100 + Math.sin(frame / 60 + i) * 8, r = 50 + hash(seed, i) * 30;
          return {cx: x, cy: top + 20 - r * 0.3, rx: r * 1.3, ry: r * 0.7};
        })} base={{x0: -80, x1: W + 80, y: horizonY + 60, h: horizonY - top + 40}}
        tone={{lit: '#ffffff', mid: '#eef0f4', shade: '#ccd2de', base: '#dfe2e6'}} ink={line('#c4ccda')} sheen={0.6} />
      </g>}
      {/* banks at four depths, each paler and slower than the one in front of it */}
      {[0, 1, 2, 3].map((d) => <Soft key={d} blur={16 + d * 6} opacity={0.55 - d * 0.08}>
        {Array.from({length: 5}, (_, i) => {
          const sp = 0.3 + (3 - d) * 0.25, x = ((hash(seed, d * 10 + i) * (W + 700) + frame * sp) % (W + 700)) - 350;
          const y = horizonY - 60 - d * 140 - hash(seed, 50 + d * 10 + i) * 80;
          return <ellipse key={i} cx={x} cy={y} rx={300 + hash(seed, 80 + i) * 120} ry={60 + d * 10} fill={d < 2 ? '#f6f6f2' : '#e6e8ea'} />;
        })}
      </Soft>)}
      {lamps.map((l, i) => <g key={i}>
        <Bloom x={l.x} y={l.y} r={150 * intensity} color="#ffe8b8" opacity={0.55 + Math.sin(frame / 20 + i) * 0.05} />
        <Bloom x={l.x} y={l.y} r={50 * intensity} color="#fff4d8" opacity={0.85} />
        <circle cx={l.x} cy={l.y} r={12} fill="#fffaf0" />
      </g>)}
    </svg>
  );
};

/** THE GREEN HAIL SKY. A heavy low base whose mid tones go green, a whiter hail shaft with stones
 *  falling through it, and a gold band at the horizon where the sun gets under the storm */
export const GreenHailSkyV2: React.FC<SkyV2Props & {hailShaft?: boolean}> = ({
  seed = 69, frame = 0, horizonY = 1290, intensity = 1, hailShaft = true,
}) => {
  const id = useUid();
  const tone: CloudTone = {lit: '#a8c49a', mid: '#6e9070', shade: '#3e5c58', base: '#22383e'};
  const base: Blob[] = Array.from({length: 16}, (_, i) => {
    const row = Math.floor(i / 8), k = i % 8;
    const x = -40 + k * 160 + row * 80 + (hash(seed, i) - 0.5) * 40, r = 90 + hash(seed, 20 + i) * 50;
    return {cx: x, cy: horizonY - 420 - row * 170 + Math.sin(frame / 34 + i) * 5, rx: r * 1.15, ry: r * 0.8};
  });
  const sx = W * 0.44;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <SkyFill stops={[[0, '#1a2a2e'], [0.3, '#2e4840'], [0.5, '#4e6e58'], [0.6, '#7a9468'], [0.64, '#d0a840'], [0.68, '#f6c050'], [1, '#f0b84a']]} />
      <rect x={-40} y={-40} width={W + 80} height={horizonY - 520} fill="#22383e" />
      <Soft blur={30} opacity={0.5}>{Array.from({length: 6}, (_, i) => <ellipse key={i} cx={hash(seed, 60 + i) * W} cy={200 + i * 120}
        rx={360} ry={70} fill={i % 2 ? '#6e9070' : '#3e5c58'} />)}</Soft>
      {hailShaft && <g>
        <Rain a={sx - 40} b={sx + 230} c={sx - 70} d={sx + 220} y0={horizonY - 480} y1={horizonY + 30} frame={frame} seed={seed}
          color="#d8e4d0" streak="#ffffff" n={20} opacity={0.55 * intensity} />
        <defs><radialGradient id={`${id}h`} cx="0.35" cy="0.3" r="0.7"><stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#b8c8c0" /></radialGradient></defs>
        {Array.from({length: 26}, (_, i) => {
          const hgt = 500, y = horizonY - 470 + ((frame * (14 + hash(seed, 300 + i) * 8) + hash(seed, 320 + i) * hgt) % hgt);
          const x = sx - 40 + hash(seed, 340 + i) * 260 - (y - horizonY + 470) * 0.06, r = 5 + hash(seed, 360 + i) * 5;
          return <circle key={i} cx={x} cy={y} r={r} fill={`url(#${id}h)`} stroke={line('#b8c8c0')} strokeWidth={2} />;
        })}
      </g>}
      <Cloud blobs={base} tone={tone} sheen={0.2} under="#e0c060" underOpacity={0.3} />
      <Bolt x={W * 0.78} y0={horizonY - 380} y1={horizonY} frame={frame} seed={seed} period={120} spread={80} color="#f4fff0" />
      <Haze y={horizonY - 150} h={220} color="#ffd860" opacity={0.6} />
    </svg>
  );
};

/** WILDFIRE SMOKE. Everything sepia and orange, a plume that billows up from a line source and
 *  shears off downwind, and the sun a small flat red disc you can look at */
export const SmokeSkyV2: React.FC<SkyV2Props & {plume?: number; distance?: number}> = ({
  seed = 70, frame = 0, horizonY = 1290, intensity = 1, plume = 0.4, distance = 0.3,
}) => {
  const px = W * plume;
  // billows ride up the plume on `frame` and spread as they climb, sheared downwind
  const at = (p: number) => [px + p * p * W * 0.75, horizonY - 40 - p * horizonY * 0.95] as const;
  const lobes: Blob[] = Array.from({length: 36}, (_, i) => {
    const p = ((frame / 30) * 0.04 + i / 36) % 1, [x, y] = at(p);
    const r = 50 + p * 170, side = (hash(seed, i) - 0.5) * (60 + p * 520);
    return {cx: x + side, cy: y + (hash(seed, 30 + i) - 0.5) * r * 0.6, rx: r * 1.1, ry: r * 0.85};
  });
  const coreD = `M${px - 70} ${horizonY + 20} ${Array.from({length: 9}, (_, k) => {
    const [x, y] = at(k / 8);
    return `L${f1(x - 40 - (k / 8) * 200)} ${f1(y)}`;
  }).join(' ')} L${W + 100} -60 L${W + 100} ${horizonY * 0.2} ${Array.from({length: 9}, (_, k) => {
    const [x, y] = at(1 - k / 8);
    return `L${f1(x + 40 + (1 - k / 8) * 160)} ${f1(y + 40)}`;
  }).join(' ')} Z`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <SkyFill stops={[[0, '#5a3a3a'], [0.25, '#8e4a30'], [0.45, '#c2602a'], [0.6, '#e2742a'], [0.67, '#f08a34'], [1, '#e8823a']]} />
      <SunDisc x={W * 0.24} y={horizonY - 700} r={40} color="#ff5a2a" glow="#ff7a3a" bloom={0.5 + distance * 0.2} edge={0.3} />
      <g opacity={0.9 * intensity}>
        <Soft blur={30} opacity={0.85}><path d={coreD} fill="#6a4448" /></Soft>
        <Cloud blobs={lobes} tone={{lit: '#e0a070', mid: '#a06850', shade: '#704848', base: '#4a2e38'}} sheen={0.15} under="#ff8a3a"
          underOpacity={0.35} side={0.45} />
      </g>
      <Soft blur={40} opacity={0.45}><rect x={-40} y={horizonY - 300} width={W + 80} height={300} fill="#ff9a50" /></Soft>
      <Haze y={horizonY - 200} h={260} color="#ffb070" opacity={0.6} />
    </svg>
  );
};

/** BIG BEND NIGHT. Deep blue and never black, a structured Milky Way with dark rifts, stars in real
 *  colours that twinkle, the brightest with a soft cross, a meteor now and then, a band of airglow */
export const StarfieldV2: React.FC<SkyV2Props & {stars?: number; milkyWay?: boolean; angle?: number; airglow?: boolean}> = ({
  seed = 71, frame = 0, horizonY = 1290, intensity = 1, stars = 460, milkyWay = true, angle = -24, airglow = true,
}) => {
  const STAR = ['#ffffff', '#cfe0ff', '#fff2cc', '#ffd8a8', '#ffb888', '#b8d0ff'];
  const mc = horizonY * 0.5;
  const met = frame % 150, mk = Math.floor(frame / 150);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <SkyFill stops={[[0, '#060c26'], [0.35, '#0c1740'], [0.6, '#16265a'], [0.67, '#24386a'], [1, '#283c6a']]} />
      {milkyWay && <g transform={`rotate(${angle} ${W / 2} ${mc})`} opacity={intensity}>
        <Soft blur={40}><ellipse cx={W / 2} cy={mc} rx={W * 1.3} ry={200} fill="#3a3e78" opacity={0.7} /></Soft>
        <Soft blur={26}><ellipse cx={W / 2} cy={mc} rx={W * 1.1} ry={110} fill="#a49ab4" opacity={0.5} />
          <ellipse cx={W * 0.42} cy={mc} rx={W * 0.42} ry={74} fill="#f2dcb4" opacity={0.55} /></Soft>
        <Soft blur={12}>{Array.from({length: 7}, (_, i) => <ellipse key={i} cx={W * (0.1 + hash(seed, i) * 0.9)} cy={mc + (hash(seed, 20 + i) - 0.5) * 120}
          rx={90 + hash(seed, 40 + i) * 160} ry={16 + hash(seed, 60 + i) * 22} fill="#0a1230" opacity={0.75} />)}</Soft>
        {Array.from({length: 160}, (_, i) => <circle key={i} cx={hash(seed, 1000 + i) * W * 1.4 - W * 0.2}
          cy={mc + (hash(seed, 1200 + i) + hash(seed, 1400 + i) - 1) * 130} r={0.8 + hash(seed, 1600 + i) * 1.4} fill="#fff4e0"
          opacity={0.5 + hash(seed, 1800 + i) * 0.4} />)}
      </g>}
      {Array.from({length: stars}, (_, i) => {
        const b = hash(seed, 500 + i), tw = 0.7 + 0.3 * Math.sin(frame / 9 + hash(seed, 700 + i) * 30);
        const x = hash(seed, 100 + i) * W, y = hash(seed, 300 + i) * horizonY, r = 1 + Math.pow(b, 6) * 4.2;
        const c = STAR[Math.floor(hash(seed, 900 + i) * STAR.length)];
        return <g key={i}>
          <circle cx={x} cy={y} r={r} fill={c} opacity={(0.4 + b * 0.6) * tw} />
          {b > 0.94 && <g opacity={tw}>
            <circle cx={x} cy={y} r={r * 4} fill={c} opacity={0.15} />
            <path d={`M${x - r * 5} ${y} L${x + r * 5} ${y} M${x} ${y - r * 5} L${x} ${y + r * 5}`} stroke={c} strokeWidth={1.8}
              strokeLinecap="round" opacity={0.7} />
          </g>}
        </g>;
      })}
      {met < 14 && (() => {
        const x0 = 200 + hash(seed, mk) * 600, y0 = 120 + hash(seed, mk + 50) * 400, t = met / 14;
        return <path d={`M${x0 + t * 260} ${y0 + t * 130} l-140 -70`} stroke="#ffffff" strokeWidth={4} strokeLinecap="round"
          opacity={Math.sin(t * Math.PI) * 0.9} />;
      })()}
      {airglow && <Haze y={horizonY - 260} h={340} color="#3a8a6a" opacity={0.35} />}
      <Haze y={horizonY - 120} h={200} color="#4a5a8a" opacity={0.5} />
    </svg>
  );
};

/** MONSOON CELLS. Separate storms over the mountains with sunlit desert between, each cell a lit
 *  tower on a flat dark base with virga that stops before it reaches the ground */
export const MonsoonCellsV2: React.FC<SkyV2Props & {cells?: number; virga?: boolean}> = ({
  seed = 72, frame = 0, horizonY = 1290, intensity = 1, cells = 3, virga = true,
}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <SkyFill stops={[[0, '#1650b4'], [0.3, '#3a7ad4'], [0.52, '#7eaee8'], [0.64, '#c4dcf0'], [0.68, '#f8e4c0'], [1, '#f6d8a8']]} />
    <Bloom x={120} y={260} r={700} color="#fff6dc" opacity={0.45} />
    {Array.from({length: cells}, (_, i) => {
      const cx = W * (0.16 + (i / Math.max(1, cells - 1)) * 0.72) + hash(seed, i) * 60 + Math.sin(frame / 200 + i) * 8;
      const s = 0.55 + hash(seed, 20 + i) * 0.7, baseY = horizonY - 440 - hash(seed, 40 + i) * 300;
      const c = heap(cx, baseY, 360 * s * intensity, 300 * s, seed + i * 31, frame, {rows: 3, taper: 0.35});
      return <g key={i}>
        {virga && <Rain a={cx - 150 * s} b={cx + 150 * s} c={cx - 170 * s} d={cx + 130 * s} y0={baseY - 10} y1={baseY + 420 * s}
          frame={frame} seed={seed + i} fade={0.7} color="#7a86b8" opacity={0.55} n={18} speed={14} />}
        <Cloud blobs={c.blobs} base={c.base} core={c.core} tone={{lit: '#fffaf0', mid: '#e8ecf6', shade: '#a8b4dc', base: '#5e6a9e'}} />
      </g>;
    })}
    <Haze y={horizonY - 200} h={280} color="#ffeccc" opacity={0.6} />
  </svg>
);

/** THE CLEAR SKIES. Summer is a mid blue paling almost to white low down, winter a deeper blue that
 *  holds its colour toward the horizon. Fair weather cumulus drift across on their flat bases */
export const ClearSkyV2: React.FC<SkyV2Props & {winter?: boolean; cumulus?: number}> = ({
  seed = 73, frame = 0, horizonY = 1290, winter = false, cumulus = 0,
}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <SkyFill stops={winter
      ? [[0, '#0c3c9c'], [0.3, '#1c58c0'], [0.55, '#3f80dc'], [0.67, '#86b4ee'], [1, '#a8ccf4']]
      : [[0, '#2a6cd0'], [0.3, '#4a8ae0'], [0.52, '#8ab8ee'], [0.64, '#d4e6f8'], [0.68, '#fff4e0'], [1, '#fff0d8']]} />
    <SunDisc x={150} y={220} r={64} color="#fffbe8" glow="#fff4cc" bloom={winter ? 0.55 : 0.75} />
    {Array.from({length: cumulus}, (_, i) => {
      const cx = ((frame / 30) * 6 + hash(seed, i) * W) % (W + 300) - 150;
      const baseY = horizonY - 380 - hash(seed, 20 + i) * 620, r = 70 + hash(seed, 40 + i) * 90;
      return <Cumulus key={i} cx={cx} baseY={baseY} w={r * 2.8} seed={seed + i * 19} frame={frame} />;
    })}
    <Haze y={horizonY - 220} h={300} color={winter ? '#dceaff' : '#fff6e4'} opacity={0.55} />
  </svg>
);

/** Mount a named sky by name, so a storyboard can pick one from data */
export const SkyV2: React.FC<SkyV2Props & {state: SkyNameV2}> = ({state, ...p}) => {
  switch (state) {
    case 'thunderhead': return <ThunderheadV2 {...p} />;
    case 'supercell': return <SupercellV2 {...p} />;
    case 'shelfCloud': return <ShelfCloudV2 {...p} />;
    case 'blueNorther': return <BlueNortherV2 {...p} />;
    case 'sunsetBands': return <SunsetBandsV2 {...p} />;
    case 'dustHaze': return <DustHazeV2 {...p} />;
    case 'gulfOvercast': return <GulfOvercastV2 {...p} />;
    case 'seaFog': return <SeaFogV2 {...p} />;
    case 'greenHail': return <GreenHailSkyV2 {...p} />;
    case 'smoke': return <SmokeSkyV2 {...p} />;
    case 'starfield': return <StarfieldV2 {...p} />;
    case 'monsoonCells': return <MonsoonCellsV2 {...p} />;
    case 'winterClear': return <ClearSkyV2 {...p} winter />;
    default: return <ClearSkyV2 {...p} />;
  }
};

export const SKIES_V2 = ['ThunderheadV2', 'SupercellV2', 'ShelfCloudV2', 'BlueNortherV2', 'SunsetBandsV2', 'DustHazeV2', 'GulfOvercastV2',
  'SeaFogV2', 'GreenHailSkyV2', 'SmokeSkyV2', 'StarfieldV2', 'MonsoonCellsV2', 'ClearSkyV2', 'SkyV2'] as const;
