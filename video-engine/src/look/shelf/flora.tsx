import React from 'react';
import {M} from '../../lib/scale';
import {light, line, mix, shade} from '../color';
import {ContactShadow, useUid} from '../Kit';
import {taper} from '../props';

/**
 * FLORA, LOOK V2 (November 14th, 2026).
 *
 * The plants of lib/flora.tsx redrawn in the v2 idiom. Twenty five drawings, trees first, then the
 * desert plants, the wildflowers, the grasses, the crops and the odd ones. Plants stand in almost
 * every film, so each one is built for a phone held at arm's length. A species reads as itself by
 * its silhouette and its colour before any detail, so every crown here is a stack of large round
 * lobes on tapered limbs, and the species tells (the live oak's low wide dome, the pecan's vase, the
 * loblolly's bare trunk, the cypress knees, the sotol pole) are drawn big rather than as specks.
 *
 * Every drawing follows the blueprint (knowledge/craft/LOOK_V2.md). Round joins and caps, lit from
 * the upper left with shade pushed toward violet, outlines in each fill's own deep hue drawn as one
 * pass under the fills so joined parts show no seam, a contact shadow under anything that stands,
 * and a breath of wind on `frame` (crowns lift lobe by lobe, stems sway, heads nod).
 *
 * PLACEMENT is the library's. x, y at the ground, `scale` 1 is true size through the one metre in
 * lib/scale.ts, `seed`, `wear`, `facing` and `season` keep their meaning. The library's `h` was only
 * a drawing resolution (the true height never changed with it), so it is accepted and ignored here,
 * except on GrassTuft where it really sizes the tuft. Field drawings (the verge, the grasses and the
 * crops) keep the library's screen units for `w` and `depth`. Each plant is built in centimetres and
 * converted once, so `scale` means the same here as in look/props.tsx. The true heights below are the
 * library's own, restated because a v2 drawing does not import from src/lib/ beyond the metre.
 */
const CM = M / 100;
export const FLORA_V2_M: Record<string, number> = {
  liveOak: 14, pecan: 24, loblolly: 30, postOak: 12, boisDArc: 12, cottonwood: 25, baldCypress: 30, asheJuniper: 8,
  crepeMyrtle: 6, huisache: 6, sabalPalm: 15, ocotillo: 5, yucca: 2.6, sotol: 4.2, lechuguilla: 0.5, sunflower: 2, sorghum: 1.5,
  cottonPlant: 1.1, cordgrass: 1.5, bluestem: 1.2, bluebonnet: 0.4, paintbrush: 0.4, tumbleweed: 0.7, peachTree: 4, citrusTree: 4,
};

export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export interface FloraV2Props {
  x?: number; y?: number; scale?: number; seed?: number; wear?: number; facing?: 1 | -1; season?: Season; frame?: number;
}

type Pt = [number, number];
/** a lobe of foliage, centre, radius and an optional height ratio for a hanging spray */
type Lobe = [number, number, number, number?];
const f1 = (n: number) => n.toFixed(1);
const hs = (seed: number, ch: number) => {
  let t = (Math.imul(seed + 11, 374761393) + Math.imul(ch + 5, 668265263)) >>> 0;
  t = Math.imul(t ^ (t >>> 13), 1274126177) >>> 0;
  return ((t ^ (t >>> 16)) >>> 0) % 100000 / 100000;
};
const at = (p: FloraV2Props) =>
  `translate(${p.x ?? 0} ${p.y ?? 0}) scale(${(p.scale ?? 1) * CM * (p.facing ?? 1)} ${(p.scale ?? 1) * CM})`;
/** outline half width in local centimetres, about 3.4 film pixels a side at any scale */
const owOf = (scale?: number, k = 1) => (3.4 * k) / ((scale ?? 1) * CM);
/** a smooth curve through the points (Catmull-Rom), as a dense polyline */
const smooth = (pts: Pt[], k = 6): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < k; j++) {
      const t = j / k, t2 = t * t, t3 = t2 * t;
      const c = (a: number, b: number, d: number, e: number) => 0.5 * (2 * b + (-a + d) * t + (2 * a - 5 * b + 4 * d - e) * t2 + (-a + 3 * b - 3 * d + e) * t3);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};
/** a closed smooth blob through the points */
const blob = (pts: Pt[], k = 5) => {
  const n = pts.length, out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    for (let j = 0; j < k; j++) {
      const t = j / k, t2 = t * t, t3 = t2 * t;
      const c = (a: number, b: number, d: number, e: number) => 0.5 * (2 * b + (-a + d) * t + (2 * a - 5 * b + 4 * d - e) * t2 + (-a + 3 * b - 3 * d + e) * t3);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  return `M${out.map((q) => `${f1(q[0])} ${f1(q[1])}`).join(' L')} Z`;
};
const polyD = (pts: Pt[]) => `M${pts.map((q) => `${f1(q[0])} ${f1(q[1])}`).join(' L')}`;
const ell = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f1(cx - rx)} ${f1(cy)} A${f1(rx)} ${f1(ry)} 0 1 0 ${f1(cx + rx)} ${f1(cy)} A${f1(rx)} ${f1(ry)} 0 1 0 ${f1(cx - rx)} ${f1(cy)} Z`;
const circ = (cx: number, cy: number, r: number) => ell(cx, cy, r, r);
/** a rounded capsule from a to b, the leaf, petal and bract of this file */
const cap = (a: Pt, b: Pt, w: number, w2 = w) => taper([a, b], w, w2);
const jit = (list: Lobe[], seed: number, a: number): Lobe[] => list.map(([x, y, r, k], i) =>
  [x + (hs(seed, i) - 0.5) * a, y + (hs(seed, i + 50) - 0.5) * a * 0.6, r * (0.92 + hs(seed, i + 99) * 0.16), k]);

/** One drawn part. A filled shape, or a stroke when `stroke` is set. `ink` is its outline colour. */
type Part = {d: string; fill?: string; stroke?: string; w?: number; ink: string; o?: number};
/** THE SEAMLESS JOIN. Every outline first, then every fill, so joined parts read as one form. */
const Pass: React.FC<{parts: Part[]; ow: number}> = ({parts, ow}) => <>
  {parts.map((q, i) => q.stroke
    ? <path key={`o${i}`} d={q.d} fill="none" stroke={q.ink} strokeWidth={(q.w ?? 0) + ow * 2 * (q.o ?? 1)} strokeLinecap="round"
      strokeLinejoin="round" />
    : <path key={`o${i}`} d={q.d} fill={q.ink} stroke={q.ink} strokeWidth={ow * 2 * (q.o ?? 1)} strokeLinejoin="round" />)}
  {parts.map((q, i) => q.stroke
    ? <path key={`f${i}`} d={q.d} fill="none" stroke={q.stroke} strokeWidth={q.w} strokeLinecap="round" strokeLinejoin="round" />
    : <path key={`f${i}`} d={q.d} fill={q.fill} />)}
</>;

/** a round lit ball, the key light at the upper left (upper right when the drawing is mirrored) */
const Ball: React.FC<{id: string; c: string; fc?: number; a?: number; b?: number}> = ({id, c, fc = 1, a = 0.42, b = 0.42}) => (
  <radialGradient id={id} cx={fc > 0 ? '34%' : '66%'} cy="28%" r="78%">
    <stop offset="0%" stopColor={light(c, a)} /><stop offset="55%" stopColor={c} /><stop offset="100%" stopColor={shade(c, b)} />
  </radialGradient>
);
/** a vertical lit gradient in user space, for blades and stems, pale at the top */
const Vert: React.FC<{id: string; c: string; y0: number; y1?: number}> = ({id, c, y0, y1 = 0}) => (
  <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={0} y1={y0} x2={0} y2={y1}>
    <stop offset="0%" stopColor={light(c, 0.4)} /><stop offset="50%" stopColor={c} /><stop offset="100%" stopColor={shade(c, 0.36)} />
  </linearGradient>
);

// ======================================================================================= PARTS

/**
 * A CROWN of round lobes. Every lobe's outline goes down first as one ink mass, then every lobe fills
 * with ONE gradient laid across the whole crown, so the crown is lit as a single mass, light at the
 * upper left and deep at the lower right. Then each clump catches the key light on its upper left
 * rim only, a lit crescent (a pale disc with the mass gradient laid back over it a little down and
 * right), so the clumps show as soft rounded bulges overlapping like a cauliflower rather than as a
 * bag of separate shiny balls. A soft sheen sits on the lobes nearest the light. Each lobe lifts a
 * little on its own phase, which is the wind moving through a tree.
 */
const Crown: React.FC<{lobes: Lobe[]; c: string; ow: number; frame?: number; wob?: number; sheen?: number; fc?: number;
  tex?: boolean; caps?: number}> = ({lobes, c, ow, frame = 0, wob = 0, sheen = 3, fc = 1, tex = true, caps = 0.9}) => {
  const id = useUid();
  const t = frame / 30;
  const L = lobes.map(([x, y, r, k], i) => ({x: x + Math.sin(t * 1.3 + i * 1.7) * wob, y: y + Math.cos(t * 1.1 + i * 2.3) * wob * 0.5, r,
    q: r * (k ?? 1), i}));
  const x0 = Math.min(...L.map((l) => l.x - l.r)), x1 = Math.max(...L.map((l) => l.x + l.r));
  const y0 = Math.min(...L.map((l) => l.y - l.q)), y1 = Math.max(...L.map((l) => l.y + l.q));
  const order = [...L].sort((a, b) => a.y - b.y);
  const ink = line(c);
  const capC = (y: number) => mix(light(c, 0.34), c, Math.max(0, Math.min(1, (y - y0) / (y1 - y0 || 1))) * 0.9);
  const lx = fc > 0 ? x0 : x1, rx = fc > 0 ? x1 : x0;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-m`} gradientUnits="userSpaceOnUse" x1={lx} y1={y0} x2={lx + (rx - lx) * 0.75} y2={y1}>
          <stop offset="0%" stopColor={light(c, 0.2)} /><stop offset="45%" stopColor={shade(c, 0.1)} />
          <stop offset="100%" stopColor={shade(c, 0.42)} />
        </linearGradient>
        <radialGradient id={`${id}-c`} cx={fc > 0 ? '40%' : '60%'} cy="36%" r="62%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.5} /><stop offset="70%" stopColor="#ffffff" stopOpacity={0.12} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
        </radialGradient>
      </defs>
      {L.map((l) => <ellipse key={`o${l.i}`} cx={l.x} cy={l.y} rx={l.r + ow} ry={l.q + ow} fill={ink} />)}
      {L.map((l) => <ellipse key={`f${l.i}`} cx={l.x} cy={l.y} rx={l.r} ry={l.q} fill={`url(#${id}-m)`} />)}
      {caps > 0 && order.map((l) => <g key={`c${l.i}`}>
        <ellipse cx={l.x} cy={l.y} rx={l.r} ry={l.q} fill={capC(l.y)} opacity={caps} />
        <ellipse cx={l.x + l.r * 0.13 * fc} cy={l.y + l.q * 0.15} rx={l.r * 0.9} ry={l.q * 0.9} fill={`url(#${id}-m)`} />
      </g>)}
      {tex && order.slice(0, Math.ceil(order.length * 0.5)).map((l) => <ellipse key={`t${l.i}`} cx={l.x - l.r * 0.22 * fc}
        cy={l.y - l.q * 0.26} rx={l.r * 0.55} ry={l.q * 0.55} fill={`url(#${id}-c)`} opacity={0.4} />)}
      {sheen > 0 && [...L].sort((a, b) => (a.y + a.x * 0.35 * fc) - (b.y + b.x * 0.35 * fc)).slice(0, sheen).map((l) =>
        <ellipse key={`s${l.i}`} cx={l.x - l.r * 0.3 * fc} cy={l.y - l.q * 0.46} rx={l.r * 0.36} ry={l.q * 0.17} fill={light(c, 0.75)}
          opacity={0.4} />)}
    </g>
  );
};

/** A limb that tapers, round at both ends, and a trunk that flares where it meets the ground. */
type Branch = {pts: Pt[]; w0: number; w1: number; flare?: number; k?: number};
const branchD = (b: Branch) => taper(smooth(b.pts, b.k ?? 6), 0, 0, (u) =>
  b.w1 + (b.w0 - b.w1) * Math.pow(1 - u, 1.3) + (b.flare && u < 0.14 ? ((0.14 - u) / 0.14) ** 2 * b.flare : 0));
/** WOOD. The trunk and limbs as one form, outlined in one pass and lit as a cylinder from the left. */
const Wood: React.FC<{list: Branch[]; c: string; ow: number; half: number; fc?: number; sheen?: boolean}> = ({list, c, ow, half, fc = 1,
  sheen = true}) => {
  const id = useUid();
  const ink = line(c);
  const ds = list.map(branchD);
  const tr = list[0];
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-w`} gradientUnits="userSpaceOnUse" x1={-half * fc} y1={0} x2={half * fc} y2={0}>
          <stop offset="0%" stopColor={light(c, 0.3)} /><stop offset="28%" stopColor={light(c, 0.48)} /><stop offset="60%" stopColor={c} />
          <stop offset="100%" stopColor={shade(c, 0.42)} />
        </linearGradient>
      </defs>
      {ds.map((d, i) => <path key={`o${i}`} d={d} fill={ink} stroke={ink} strokeWidth={ow * 2} strokeLinejoin="round" />)}
      {ds.map((d, i) => <path key={`f${i}`} d={d} fill={`url(#${id}-w)`} />)}
      {sheen && tr && <path d={polyD(smooth(tr.pts.slice(0, 3), 4).map(([x, y], i, a) =>
        [x - (tr.w0 + (tr.w1 - tr.w0) * (i / (a.length - 1))) * 0.24 * fc, y] as Pt).slice(1))}
        stroke={light(c, 0.55)} strokeWidth={Math.max(tr.w1 * 0.16, ow * 0.8)} strokeLinecap="round" fill="none" opacity={0.55} />}
    </g>
  );
};

/** bare twigs off a limb, for a winter crown, so a leafless tree still reads as its species */
const twigs = (b: Branch, seed: number, n: number, len: number, up = 0.6): Branch[] => {
  const pts = smooth(b.pts, 6);
  return Array.from({length: n}, (_, i) => {
    const u = 0.35 + (i / Math.max(1, n - 1)) * 0.6, q = pts[Math.min(pts.length - 2, Math.round(u * (pts.length - 1)))];
    const nx = pts[Math.min(pts.length - 1, Math.round(u * (pts.length - 1)) + 1)];
    const dx = nx[0] - q[0], dy = nx[1] - q[1], dl = Math.hypot(dx, dy) || 1;
    const sd = i % 2 ? 1 : -1, L = len * (0.7 + hs(seed, i) * 0.6);
    const ex = q[0] + (dx / dl) * L * 0.5 + (-dy / dl) * sd * L * 0.5, ey = q[1] + (dy / dl) * L * 0.5 + (dx / dl) * sd * L * 0.5 - L * up;
    return {pts: [q, [(q[0] + ex) / 2, (q[1] + ey) / 2 - L * 0.05], [ex, ey]] as Pt[], w0: b.w1 * 0.9 + (b.w0 - b.w1) * (1 - u) * 0.35,
      w1: b.w1 * 0.35};
  });
};

const shadowPair = (w: number, trunk: number, k = 1) => <>
  <ContactShadow x={0} y={4} w={w} opacity={0.22 * k} />
  <ContactShadow x={0} y={3} w={trunk} opacity={0.4 * k} />
</>;

// ======================================================================================= TREES

/**
 * LIVE OAK. Wider than tall, by a lot. A short thick trunk divides low into trunk-thick limbs that run
 * out near level and dip at the tips, under one low dark blue green dome. Evergreen. `leaned` combs
 * the crown inland the way the Gulf wind does, `propped` sets a post under a resting limb, and a worn
 * tree (wear over 0.5) carries one dead limb poking out of the top.
 */
export const LiveOakV2: React.FC<FloraV2Props & {h?: number; leaned?: boolean; propped?: boolean}> = (p) => {
  const {seed = 3, wear = 0.3, season = 'summer', frame = 0, leaned = false, propped = false} = p;
  const ow = owOf(p.scale), fc = p.facing ?? 1, t = frame / 30;
  const c = season === 'winter' ? '#2b6650' : '#2e7352', bark = '#5e4536';
  const J = (ch: number, a: number) => (hs(seed, ch) - 0.5) * a;
  const limbs: Branch[] = [
    {pts: [[0, 0], [-8, -160], [J(1, 40), -330]], w0: 190, w1: 140, flare: 120},
    {pts: [[0, -290], [-280, -410], [-660, -510], [-1000 + J(2, 80), -555], [-1230, -505]], w0: 125, w1: 36},
    {pts: [[0, -290], [260, -420], [640, -530], [990 + J(3, 80), -580], [1210, -515]], w0: 125, w1: 36},
    {pts: [[-20, -320], [-160, -560], [-390, -780], [-600, -900]], w0: 96, w1: 28},
    {pts: [[20, -320], [180, -580], [430, -800], [640, -910]], w0: 96, w1: 28},
    {pts: [[0, -330], [30, -620], [-10, -920]], w0: 80, w1: 24},
  ];
  if (wear > 0.5) limbs.push({pts: [[-140, -880], [-330, -1180], [-520, -1500]], w0: 40, w1: 12});
  const front = jit([
    [-480, -1080, 245], [-150, -1110, 260], [210, -1100, 255], [540, -1050, 230],
    [-950, -900, 235], [-650, -930, 255], [-300, -920, 250], [50, -930, 255], [400, -920, 255], [750, -900, 245], [1040, -860, 215],
    [-1170, -640, 190], [-890, -680, 215], [-560, -720, 205], [-210, -750, 195], [180, -750, 195], [550, -720, 205], [900, -680, 215],
    [1170, -630, 190], [-1330, -560, 150], [1320, -560, 150],
  ], seed, 60);
  const back: Lobe[] = [[-700, -880, 260], [0, -900, 280], [700, -880, 260], [-1000, -720, 210], [1000, -720, 210]];
  const sway = Math.sin(t * 0.8 + seed) * 0.4;
  return (
    <g transform={at(p)}>
      {shadowPair(2800, 520)}
      <g transform={`${leaned ? 'skewX(-14) ' : ''}rotate(${f1(sway)})`}>
        <Crown lobes={back} c={shade(c, 0.32)} ow={ow} frame={frame} wob={10} sheen={0} fc={fc} tex={false} />
        {propped && <Pass ow={ow} parts={[
          {d: cap([900, -20], [900, -560], 46, 40), fill: '#9a7552', ink: line('#9a7552')},
          {d: cap([840, -570], [960, -570], 36), fill: '#b08a62', ink: line('#9a7552')}]} />}
        <Wood list={limbs.slice(0, wear > 0.5 ? 7 : 6)} c={bark} ow={ow} half={1300} fc={fc} />
        <Crown lobes={front} c={c} ow={ow} frame={frame} wob={12} sheen={4} fc={fc} />
      </g>
    </g>
  );
};

/**
 * PECAN. An upright vase. Steep scaffold limbs and a crown taller than wide, bright yellow green, the
 * opposite of the live oak beside it. Bare in winter and spring (it leafs late), gold in fall, and
 * `nuts` scatters the November drop under it.
 */
export const PecanV2: React.FC<FloraV2Props & {h?: number; nuts?: boolean}> = (p) => {
  const {seed = 4, season = 'summer', frame = 0, nuts = false} = p;
  const ow = owOf(p.scale), fc = p.facing ?? 1, t = frame / 30;
  const bare = season === 'winter' || season === 'spring';
  const c = season === 'fall' ? '#d1a93a' : '#5f9a45', bark = '#6e5a4c';
  const J = (ch: number, a: number) => (hs(seed, ch) - 0.5) * a;
  const fork: Pt = [J(1, 30), -900];
  const scaff: Branch[] = [
    {pts: [fork, [-160, -1200], [-420, -1560], [-620, -1820]], w0: 70, w1: 18},
    {pts: [fork, [-60, -1300], [-180, -1750], [-260, -2160]], w0: 66, w1: 16},
    {pts: [fork, [70, -1320], [170, -1760], [230, -2200]], w0: 66, w1: 16},
    {pts: [fork, [170, -1180], [430, -1520], [640, -1780]], w0: 70, w1: 18},
    {pts: [[fork[0], -1050], [-260, -1250], [-560 + J(2, 60), -1380]], w0: 44, w1: 14},
    {pts: [[fork[0], -1080], [260, -1290], [560 + J(3, 60), -1420]], w0: 44, w1: 14},
  ];
  const trunk: Branch = {pts: [[0, 0], [J(4, 20), -450], fork], w0: 120, w1: 82, flare: 70};
  // the vase. Clumps ride the tips of the steep scaffolds and the crown is widest near the top, with
  // sky in the V under it where the limbs show, which is the shape that is not an oak
  const lobes = jit([
    [-480, -2080, 240], [0, -2190, 270], [480, -2060, 240],
    [-650, -1830, 230], [-260, -1880, 260], [250, -1890, 260], [650, -1810, 225],
    [0, -1660, 230], [-450, -1640, 220], [450, -1650, 220],
    [-640, -1450, 190], [-430, -1390, 160], [640, -1480, 190], [440, -1420, 160],
  ], seed, 60);
  const winter = bare ? scaff.flatMap((b, i) => twigs(b, seed + i * 7, 4, 260, 0.7)) : [];
  const sway = Math.sin(t * 0.7 + seed) * 0.45;
  return (
    <g transform={at(p)}>
      {shadowPair(1900, 320)}
      {nuts && Array.from({length: 12}, (_, i) => {
        const x = (hs(seed, 60 + i) - 0.5) * 1500, y = -6 - hs(seed, 80 + i) * 14;
        return <path key={i} d={ell(x, y, 16, 11)} fill="#7a5434" stroke={line('#7a5434')} strokeWidth={ow * 0.9} />;
      })}
      <g transform={`rotate(${f1(sway)})`}>
        <Wood list={[trunk, ...scaff, ...winter]} c={bark} ow={ow} half={900} fc={fc} />
        {!bare && <Crown lobes={lobes} c={c} ow={ow} frame={frame} wob={14} sheen={4} fc={fc} />}
      </g>
    </g>
  );
};

/** stack a pine pad, four or five round needle lobes along a short level line, wider than tall */
const padLobes = (px: number, py: number, rx: number, ry: number, seed: number, k: number): Lobe[] =>
  [-0.62, -0.22, 0.18, 0.58, k % 2 ? 0.9 : -0.94].map((f, j) => [px + f * rx * 0.9, py + (hs(seed, k * 7 + j) - 0.5) * ry * 0.5,
    ry * (0.82 + hs(seed, k * 11 + j) * 0.36) * (j === 4 ? 0.72 : 1)]);

/**
 * LOBLOLLY PINE. The trunk is the drawing. A tall straight bare stem with the crown in the top
 * quarter, flat needle pads on short side limbs, which is why a Piney Woods frame is a corridor of
 * verticals. `open` is the yard tree grown in the open, keeping limbs further down.
 */
export const LoblollyV2: React.FC<FloraV2Props & {h?: number; open?: boolean}> = (p) => {
  const {seed = 5, frame = 0, open = false} = p;
  const ow = owOf(p.scale), fc = p.facing ?? 1, t = frame / 30;
  const c = '#3d7c4c', bark = '#8a5638';
  const H = 3000, n = open ? 10 : 6, start = open ? 0.5 : 0.76;
  const pads: [number, number, number, number][] = [[0, -2900, 180, 110]];
  for (let j = 0; j < n; j++) {
    const f = j / Math.max(1, n - 1), side = (j + seed) % 2 ? 1 : -1, py = -H * (0.95 - f * (0.95 - start));
    pads.push([side * (170 + f * 190 + hs(seed, j) * 60), py, 240 + f * 140 + hs(seed, j + 9) * 50, 104 + hs(seed, j + 17) * 20]);
  }
  const limbs: Branch[] = pads.slice(1).map(([px, py]) => ({pts: [[0, py + 50], [px * 0.5, py + 18], [px * 0.85, py]], w0: 26, w1: 12}));
  const lobes = pads.flatMap(([px, py, rx, ry], k) => padLobes(px, py, rx, ry, seed, k));
  const sway = Math.sin(t * 0.6 + seed) * 0.35;
  return (
    <g transform={at(p)}>
      {shadowPair(900, 260)}
      <g transform={`rotate(${f1(sway)})`}>
        <Wood list={[{pts: [[0, 0], [-6, -1500], [(hs(seed, 1) - 0.5) * 30, -2960]], w0: 74, w1: 16, flare: 50}, ...limbs]} c={bark}
          ow={ow} half={70} fc={fc} />
        {/* the bark plates of a loblolly, a few rounded scales on the lit side */}
        {Array.from({length: 7}, (_, i) => <path key={i} d={cap([-12 * fc, -260 - i * 270], [10 * fc, -280 - i * 270], 9, 7)}
          fill={shade(bark, 0.3)} opacity={0.55} />)}
        <Crown lobes={lobes} c={c} ow={ow} frame={frame} wob={8} sheen={5} fc={fc} />
      </g>
    </g>
  );
};

/**
 * POST OAK. Short, thick, crooked and dense. Limbs that elbow at hard turns and a crown chopped flat
 * on top. In winter it holds its dead leaves, so a January post oak is rust, not bare.
 */
export const PostOakV2: React.FC<FloraV2Props & {h?: number}> = (p) => {
  const {seed = 6, season = 'summer', frame = 0} = p;
  const ow = owOf(p.scale), fc = p.facing ?? 1, t = frame / 30;
  const c = season === 'winter' ? '#a8653a' : season === 'fall' ? '#b8903a' : '#5a8c40', bark = '#574538';
  const J = (ch: number, a: number) => (hs(seed, ch) - 0.5) * a;
  const fork: Pt = [J(1, 80), -430];
  const limbs: Branch[] = [
    {pts: [[0, 0], [30, -200], fork], w0: 130, w1: 92, flare: 70, k: 4},
    {pts: [fork, [-230, -560], [-300, -780], [-560, -900]], w0: 62, w1: 20, k: 3},
    {pts: [fork, [-60, -640], [-200, -840], [-160, -1000]], w0: 56, w1: 18, k: 3},
    {pts: [fork, [140, -620], [90, -820], [300, -980]], w0: 56, w1: 18, k: 3},
    {pts: [fork, [250, -520], [420, -700], [600, -760]], w0: 62, w1: 20, k: 3},
  ];
  const lobes = jit([
    [-640, -975, 195], [-380, -990, 205], [-120, -995, 205], [140, -995, 205], [400, -990, 205], [650, -975, 190],
    [-760, -770, 190], [-470, -780, 210], [-160, -800, 205], [170, -800, 205], [480, -780, 210], [770, -760, 185],
  ], seed, 40);
  const sway = Math.sin(t * 0.8 + seed) * 0.4;
  return (
    <g transform={at(p)}>
      {shadowPair(1800, 340)}
      <g transform={`rotate(${f1(sway)})`}>
        <Crown lobes={[[-400, -760, 240], [400, -760, 240], [0, -800, 250]]} c={shade(c, 0.32)} ow={ow} frame={frame} wob={8} sheen={0}
          fc={fc} tex={false} />
        <Wood list={limbs} c={bark} ow={ow} half={900} fc={fc} />
        <Crown lobes={lobes} c={c} ow={ow} frame={frame} wob={9} sheen={4} fc={fc} />
      </g>
    </g>
  );
};

/** a horse apple, a green softball covered in round bumps */
const horseApple = (x: number, y: number, r: number, fill: string): Part[] => {
  const c = '#a9cc48';
  const bumps: Pt[] = Array.from({length: 11}, (_, i) => {
    const a = (i / 11) * Math.PI * 2;
    return [x + Math.cos(a) * r * (i % 2 ? 1 : 0.9), y + Math.sin(a) * r * (i % 2 ? 1 : 0.9) * 0.92];
  });
  return [{d: blob(bumps, 3), fill, ink: line(c), o: 0.9}];
};

/**
 * BOIS D'ARC. The Blackland fence row tree, topped for posts for a century, so a low mound of suckers
 * on a fat cut trunk. The horse apples on the ground are the recognition, green bumpy softballs.
 */
export const BoisDArcV2: React.FC<FloraV2Props & {h?: number; apples?: boolean}> = (p) => {
  const {seed = 7, season = 'summer', frame = 0, apples = true} = p;
  const id = useUid();
  const ow = owOf(p.scale), fc = p.facing ?? 1, t = frame / 30;
  const c = season === 'fall' ? '#d4bb42' : '#3f803c', bark = '#7a5a3a';
  const bare = season === 'winter';
  const suckers: Branch[] = Array.from({length: 7}, (_, i) => {
    const a = (-0.28 - (i / 6) * 0.44) * Math.PI, reach = 560 + hs(seed, 10 + i) * 300;
    const bx = Math.cos(a) * reach, by = -360 + Math.sin(a) * reach;
    const x0 = (hs(seed, 40 + i) - 0.5) * 100;
    return {pts: [[x0, -340], [(x0 + bx) / 2 + Math.cos(a) * 30, (by - 340) / 2], [bx, by]], w0: 30, w1: 12};
  });
  const lobes = jit([
    [-470, -1000, 210], [-160, -1050, 230], [170, -1050, 230], [480, -990, 205],
    [-700, -780, 200], [-380, -800, 215], [0, -820, 225], [380, -800, 215], [700, -770, 195],
    [-520, -600, 150], [520, -590, 150],
  ], seed, 50);
  const appleParts = apples ? Array.from({length: 9}, (_, i) => horseApple((hs(seed, 60 + i) - 0.5) * 1300,
    -26 - hs(seed, 70 + i) * 18, 28, `url(#${id}-a)`)).flat() : [];
  const sway = Math.sin(t * 0.8 + seed) * 0.4;
  return (
    <g transform={at(p)}>
      <defs><Ball id={`${id}-a`} c="#a9cc48" fc={fc} a={0.5} /></defs>
      {shadowPair(1700, 360)}
      <g transform={`rotate(${f1(sway)})`}>
        <Wood list={[{pts: [[0, 0], [0, -180], [0, -360]], w0: 160, w1: 140, flare: 60}, ...suckers]} c={bark} ow={ow} half={500} fc={fc} />
        {/* the flat cut where a post came out, pale heartwood with a ring */}
        <path d={ell(0, -352, 66, 20)} fill="#e0b46a" stroke={line(bark)} strokeWidth={ow} />
        <path d={ell(0, -352, 34, 10)} fill="none" stroke="#b8873e" strokeWidth={ow * 0.6} />
        {!bare && <Crown lobes={lobes} c={c} ow={ow} frame={frame} wob={10} sheen={4} fc={fc} />}
      </g>
      <Pass ow={ow} parts={appleParts} />
    </g>
  );
};

/**
 * COTTONWOOD. On the plains it means water. A thick grey trunk forked low under a big billowing
 * crown, and the leaves FLASH, turning silver in a gust, which `flash` drives from frame. Hard yellow
 * in fall, bare in winter.
 */
export const CottonwoodV2: React.FC<FloraV2Props & {h?: number; flash?: number}> = (p) => {
  const {seed = 8, season = 'summer', frame = 0, flash = 0.35} = p;
  const ow = owOf(p.scale), fc = p.facing ?? 1, t = frame / 30;
  const c = season === 'fall' ? '#f0c23a' : '#86ae52', bark = '#8a8079';
  const bare = season === 'winter';
  const gust = flash * (0.5 + 0.5 * Math.sin(frame / 17 + hs(seed, 2) * 6)) * (0.6 + 0.4 * Math.sin(frame / 6.5));
  const J = (ch: number, a: number) => (hs(seed, ch) - 0.5) * a;
  const fk: Pt = [J(1, 30), -760];
  const limbs: Branch[] = [
    {pts: [[0, 0], [-10, -400], fk], w0: 170, w1: 118, flare: 90},
    {pts: [fk, [-200, -1100], [-480, -1450], [-760, -1650]], w0: 90, w1: 24},
    {pts: [fk, [-40, -1200], [-200, -1650], [-260, -2050]], w0: 84, w1: 22},
    {pts: [fk, [90, -1200], [240, -1600], [300, -2000]], w0: 84, w1: 22},
    {pts: [fk, [230, -1060], [520, -1380], [820, -1560]], w0: 90, w1: 24},
  ];
  const lobes = jit([
    [-290, -2200, 300], [260, -2210, 300],
    [-790, -1900, 280], [-290, -1920, 330], [260, -1930, 330], [760, -1880, 290],
    [-1040, -1520, 250], [-560, -1580, 290], [40, -1620, 290], [560, -1560, 290], [1040, -1500, 240],
    [-820, -1260, 220], [-380, -1300, 200], [330, -1290, 230], [880, -1300, 200],
  ], seed, 70);
  const winter = bare ? limbs.slice(1).flatMap((b, i) => twigs(b, seed + i * 5, 4, 300, 0.4)) : [];
  const sway = Math.sin(t * 0.7 + seed) * 0.45;
  return (
    <g transform={at(p)}>
      {shadowPair(2500, 420)}
      <g transform={`rotate(${f1(sway)})`}>
        <Wood list={[...limbs, ...winter]} c={bark} ow={ow} half={1100} fc={fc} />
        {/* the deep furrows of cottonwood bark */}
        {[-40, 10, 50].map((dx, i) => <path key={i} d={polyD(smooth([[dx, -30], [dx * 0.8 - 6, -360], [dx * 0.6, -680]], 4))}
          stroke={shade(bark, 0.35)} strokeWidth={10} strokeLinecap="round" fill="none" opacity={0.6} />)}
        {!bare && <>
          <Crown lobes={lobes} c={c} ow={ow} frame={frame} wob={16} sheen={4} fc={fc} />
          {/* THE FLASH, the pale undersides showing wherever the gust has turned the leaves */}
          {lobes.map(([x, y, r], i) => {
            const o = Math.max(0, gust - hs(seed, 120 + i) * 0.5) * 1.1;
            return o > 0.02 ? <ellipse key={i} cx={x + r * 0.15 * fc} cy={y + r * 0.1} rx={r * 0.55} ry={r * 0.38}
              fill={mix(c, '#f2f6e4', 0.72)} opacity={Math.min(0.85, o)} /> : null;
          })}
        </>}
      </g>
    </g>
  );
};

/**
 * BALD CYPRESS. The river tree. A buttressed base flaring at the water, a tall tapering stem, and
 * tiers of soft feathery foliage that hang below each limb. It is deciduous, rust orange in fall and
 * bare in winter. The knees, woody cones standing up around the base, are the tell.
 */
export const BaldCypressV2: React.FC<FloraV2Props & {h?: number; knees?: number; waterY?: number}> = (p) => {
  const {seed = 9, season = 'summer', frame = 0, knees = 6, waterY = 0} = p;
  const ow = owOf(p.scale), fc = p.facing ?? 1, t = frame / 30;
  const c = season === 'fall' ? '#b8643c' : season === 'spring' ? '#9cc866' : '#5e9a52', bark = '#8a6a55';
  const bare = season === 'winter';
  // tiers of limbs, each carrying a soft top mass and a curtain of sprays hanging below it, which is
  // the feathery drooping look that tells a cypress from a pine at a glance
  const tiers = 8;
  const limbs: Branch[] = [];
  const lobes: Lobe[] = [];
  for (let i = 0; i < tiers; i++) {
    const f = i / (tiers - 1), ly = -860 - f * 1960, side = i % 2 ? 1 : -1;
    const reach = (860 - f * 600) * (0.88 + hs(seed, 10 + i) * 0.24);
    for (const sd of [side, -side]) {
      const rc = sd === side ? reach : reach * 0.78;
      limbs.push({pts: [[0, ly + 40], [sd * rc * 0.5, ly - 6], [sd * rc, ly - rc * 0.08]], w0: 32 - f * 12, w1: 10});
      const r = 165 - f * 65;
      [0.2, 0.58, 0.94].forEach((u, k) => {
        lobes.push([sd * rc * u, ly - rc * 0.04 * u - r * 0.1, r * (1.05 - k * 0.12), 0.7]);
        if (k) lobes.push([sd * rc * u + sd * r * 0.12, ly + r * 0.55, r * 0.66, 1.05]);
      });
    }
  }
  lobes.push([0, -2860, 130, 0.9], [0, -2700, 160, 0.8]);
  const buttress = `M${-300} 0 Q${-140} -60 ${-110} -380 L${110} -380 Q${150} -60 ${310} 0 Z`;
  const kn = Array.from({length: knees}, (_, i) => {
    const kx = (hs(seed, 50 + i) - 0.5) * 1300, kh = 50 + hs(seed, 60 + i) * 110;
    return {d: blob([[kx - kh * 0.45, waterY], [kx - kh * 0.2, waterY - kh * 0.7], [kx, waterY - kh], [kx + kh * 0.2, waterY - kh * 0.7],
      [kx + kh * 0.45, waterY]], 4), x: kx};
  });
  const sway = Math.sin(t * 0.6 + seed) * 0.4;
  return (
    <g transform={at(p)}>
      {shadowPair(1600, 640)}
      <g transform={`rotate(${f1(sway)})`}>
        <Pass ow={ow} parts={[{d: buttress, fill: bark, ink: line(bark)}]} />
        <Wood list={[{pts: [[0, -340], [-8, -1600], [(hs(seed, 1) - 0.5) * 30, -2950]], w0: 200, w1: 20}, ...limbs]} c={bark} ow={ow}
          half={180} fc={fc} />
        {!bare && <Crown lobes={jit(lobes, seed, 30)} c={c} ow={ow} frame={frame} wob={8} sheen={5} fc={fc} tex={false} caps={0.6} />}
      </g>
      <Pass ow={ow} parts={kn.map((k) => ({d: k.d, fill: light(bark, 0.15), ink: line(bark)}))} />
    </g>
  );
};

/**
 * ASHE JUNIPER, the cedar. A round, dense, multi stemmed mound, the darkest blue green in the Hill
 * Country, with its stems going in at the ground. `pollen` lets it smoke in winter, puffs of rusty
 * pollen drifting off in the light.
 */
export const AsheJuniperV2: React.FC<FloraV2Props & {h?: number; pollen?: boolean}> = (p) => {
  const {seed = 11, frame = 0, pollen = false} = p;
  const ow = owOf(p.scale), fc = p.facing ?? 1, t = frame / 30;
  const c = '#2f6a5a', bark = '#6e5040';
  const stems: Branch[] = [-1, 0, 1].map((k, i) => ({pts: [[k * 40, 0], [k * 70, -120], [k * 120 + (hs(seed, i) - 0.5) * 40, -260]],
    w0: 46, w1: 30, flare: 14}));
  // a dense round mound with a fine shaggy edge of small tufts, the scale-leaf texture that sets a
  // cedar apart from a broadleaf tree even at the size of a thumbnail
  const ring: Lobe[] = Array.from({length: 15}, (_, i) => {
    const a = Math.PI * (0.92 + (i / 14) * 1.16);
    return [Math.cos(a) * 360, -450 + Math.sin(a) * 330, 72 + hs(seed, 200 + i) * 22];
  });
  const lobes = jit([
    ...ring,
    [-100, -660, 140], [120, -670, 135],
    [-250, -520, 160], [20, -540, 180], [270, -510, 155],
    [-310, -350, 160], [-50, -370, 180], [230, -350, 170],
    [-190, -230, 130], [150, -220, 130],
  ], seed, 30);
  const sway = Math.sin(t * 0.9 + seed) * 0.6;
  return (
    <g transform={at(p)}>
      {shadowPair(900, 300)}
      <g transform={`rotate(${f1(sway)})`}>
        <Wood list={stems} c={bark} ow={ow} half={200} fc={fc} />
        <Crown lobes={lobes} c={c} ow={ow} frame={frame} wob={5} sheen={3} fc={fc} />
      </g>
      {pollen && Array.from({length: 5}, (_, i) => {
        const q = ((t + hs(seed, 70 + i) * 3) % 3) / 3;
        const x = 200 + q * 330 + hs(seed, 80 + i) * 80, y = -560 - hs(seed, 90 + i) * 180 - q * 160, r = 34 + q * 60;
        return <g key={i} opacity={(1 - q) * 0.55}>
          {[[0, 0, 1], [-0.7, 0.2, 0.7], [0.7, 0.25, 0.75]].map(([dx, dy, k], j) =>
            <circle key={j} cx={x + dx * r} cy={y + dy * r} r={r * k} fill={j ? '#d6a35a' : '#e6bb72'} />)}
        </g>;
      })}
    </g>
  );
};

/**
 * CREPE MYRTLE. The tree of every Texas town. Several smooth cinnamon trunks leaning out from one base,
 * peeling to pale patches, under a vase of leaves heaped in summer with big soft trusses of watermelon,
 * lavender or white bloom, drawn as a second crown of flower clumps riding the leaf crown. `topped`
 * draws the February crepe murder, knuckles with whips.
 */
export const CrepeMyrtleV2: React.FC<FloraV2Props & {h?: number; bloom?: 'watermelon' | 'lavender' | 'white' | 'none'; topped?: boolean}> = (p) => {
  const {seed = 12, season = 'summer', frame = 0, bloom = 'watermelon', topped = false} = p;
  const id = useUid();
  const ow = owOf(p.scale), fc = p.facing ?? 1, t = frame / 30;
  const leaf = season === 'fall' ? '#d2703a' : '#4f8c44', bark = '#a3826a';
  const bare = season === 'winter';
  const flower = bloom === 'lavender' ? '#a57ad6' : bloom === 'white' ? '#f4ecef' : '#e8609a';
  const showBloom = bloom !== 'none' && season === 'summer' && !bare;
  const top = topped ? 270 : 410;
  const tips: Pt[] = [-1.5, -0.5, 0.5, 1.5].map((k, i) => [k * (topped ? 70 : 110) + (hs(seed, i) - 0.5) * 30, -top - (1 - Math.abs(k) / 1.5) * 50]);
  const trunks: Branch[] = tips.map((q, i) => ({pts: [[(i - 1.5) * 14, 0], [q[0] * 0.4, -top * 0.5], q], w0: 26, w1: 18, flare: 8}));
  const whips: Branch[] = topped && !bare ? tips.flatMap((q, i) => [-1, 0, 1].map((k) => ({pts: [q, [q[0] + k * 30, q[1] - 90],
    [q[0] + k * 60, q[1] - 160 - hs(seed, i * 3 + k + 9) * 40]] as Pt[], w0: 7, w1: 4}))) : [];
  const lobes = topped ? whips.map((w, i) => [w.pts[2][0], w.pts[2][1] - 10, 42 + hs(seed, i) * 10] as Lobe)
    : jit([[-200, -520, 110], [-60, -580, 125], [90, -580, 125], [220, -520, 110], [-270, -400, 100], [-120, -440, 115],
      [40, -460, 120], [180, -440, 115], [290, -390, 95]], seed, 30);
  // the trusses, upright soft cones of bloom heaped over the upper crown
  const trusses: Lobe[] = showBloom ? Array.from({length: topped ? 6 : 16}, (_, i) => {
    const l = lobes[i % lobes.length];
    const a = -Math.PI * (0.12 + hs(seed, 40 + i) * 0.76), d = 0.5 + hs(seed, 60 + i) * 0.3;
    return [l[0] + Math.cos(a) * l[2] * d, l[1] + Math.sin(a) * l[2] * d - 10, (topped ? 30 : 38) + hs(seed, 80 + i) * 12, 1.25] as Lobe;
  }) : [];
  const sway = Math.sin(t * 0.9 + seed) * 0.6;
  return (
    <g transform={at(p)}>
      {shadowPair(700, 180)}
      <g transform={`rotate(${f1(sway)})`}>
        <Wood list={[...trunks, ...whips]} c={bark} ow={ow} half={260} fc={fc} />
        {/* the peel, paler inner bark showing in smooth patches, which is the identification */}
        {trunks.map((b, i) => <path key={i} d={cap([b.pts[1][0] * 0.8, b.pts[1][1] + 40], [b.pts[1][0] * 1.05, b.pts[1][1] - 50], 11, 9)}
          fill="#e4c294" opacity={0.85} />)}
        {topped && tips.map((q, i) => <path key={`k${i}`} d={circ(q[0], q[1], 22)} fill={shade(bark, 0.2)} stroke={line(bark)}
          strokeWidth={ow * 1.4} />)}
        {!bare && <Crown lobes={lobes} c={leaf} ow={ow} frame={frame} wob={6} sheen={topped ? 0 : 3} fc={fc} />}
        {trusses.length > 0 && <Crown lobes={trusses} c={flower} ow={ow} frame={frame} wob={6} sheen={3} fc={fc} />}
      </g>
    </g>
  );
};

/**
 * HUISACHE. Feathery like a mesquite and flat crowned like an umbrella, but in late winter it is
 * covered in round ORANGE PUFFBALLS, the one time brush country is not brown. Blooms in winter and
 * spring.
 */
export const HuisacheV2: React.FC<FloraV2Props & {h?: number}> = (p) => {
  const {seed = 13, season = 'summer', frame = 0} = p;
  const id = useUid();
  const ow = owOf(p.scale), fc = p.facing ?? 1, t = frame / 30;
  const blooming = season === 'winter' || season === 'spring';
  const c = blooming ? '#9cb44c' : '#7aa64a', bark = '#4f3c30';
  const limbs: Branch[] = [
    {pts: [[-10, 0], [-90, -180], [-260, -330], [-420, -400]], w0: 44, w1: 12},
    {pts: [[0, 0], [10, -200], [-40, -380], [-10, -480]], w0: 44, w1: 12},
    {pts: [[10, 0], [100, -170], [250, -300], [440, -380]], w0: 44, w1: 12},
  ];
  const lobes = jit([
    [-420, -440, 105], [-280, -470, 115], [-140, -495, 120], [0, -505, 120], [140, -495, 120], [280, -470, 115], [420, -440, 105],
    [-520, -380, 80], [520, -380, 80], [-200, -560, 90], [180, -565, 90], [-330, -390, 85], [330, -390, 85],
  ], seed, 24);
  // the bloom comes in drifts, a handful of puffballs bunched on each spray, never one ball at a time
  const puffs: Lobe[] = blooming ? Array.from({length: 24}, (_, i) => {
    const l = lobes[i % lobes.length], a = -Math.PI * (0.04 + hs(seed, 60 + i) * 0.92), d = 0.35 + hs(seed, 90 + i) * 0.45;
    const cx = l[0] + Math.cos(a) * l[2] * d, cy = l[1] + Math.sin(a) * l[2] * d;
    return [[0, 0], [-15, 6], [15, 7], [-7, -12], [9, -11], [2, 14]].map(([dx, dy], k) =>
      [cx + dx, cy + dy, 10 + hs(seed, 70 + i * 6 + k) * 3] as Lobe);
  }).flat() : [];
  const sway = Math.sin(t * 0.9 + seed) * 0.5;
  return (
    <g transform={at(p)}>
      <defs><Ball id={`${id}-p`} c="#f5952a" fc={fc} a={0.55} b={0.3} /></defs>
      {shadowPair(1300, 200)}
      <g transform={`rotate(${f1(sway)})`}>
        <Wood list={limbs} c={bark} ow={ow} half={500} fc={fc} />
        <Crown lobes={lobes} c={c} ow={ow} frame={frame} wob={7} sheen={4} fc={fc} />
        {puffs.map(([x, y, r], i) => <circle key={`o${i}`} cx={x} cy={y} r={r + ow * 0.8} fill={line('#f5952a')} />)}
        {puffs.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={`url(#${id}-p)`} />)}
      </g>
    </g>
  );
};

/**
 * SABAL PALM. The native Valley palm. Short, thick and straight, a heavy round head of stiff fan
 * fronds, and if nobody has trimmed it, a shag of dead fronds hanging down the trunk. That skirt is
 * the recognition. Fronds are pleated half discs with rounded fingers, swaying on their stems.
 */
export const SabalPalmV2: React.FC<FloraV2Props & {h?: number; skirt?: boolean}> = (p) => {
  const {seed = 14, frame = 0, skirt = true} = p;
  const id = useUid();
  const ow = owOf(p.scale), fc = p.facing ?? 1, t = frame / 30;
  const c = '#5c9c4e', trunk = '#93785a', dead = '#a07a4a';
  const top = -980;
  const fronds = Array.from({length: 11}, (_, i) => {
    const a0 = (i / 10 - 0.5) * Math.PI * 1.4 - Math.PI / 2 + (hs(seed, 10 + i) - 0.5) * 0.18, out = Math.abs(Math.cos(a0));
    // the side fronds arch over and hang a little, so the head is a round crown and not a fan held up
    const a = a0 + Math.sign(Math.cos(a0)) * out * out * 0.3 + Math.sin(t * 1.2 + i * 0.9) * 0.03;
    const sl = 190 + hs(seed, 20 + i) * 70, R = 320 + hs(seed, 30 + i) * 90;
    const ex = Math.cos(a) * sl, ey = top + Math.sin(a) * sl;
    const fingers = 9, spread = 0.34 + hs(seed, 40 + i) * 0.16;
    const rim: Pt[] = [];
    for (let k = 0; k <= fingers * 2; k++) {
      const aa = a - spread + (k / (fingers * 2)) * spread * 2, rr = R * (k % 2 ? 0.62 : 1) * (1 - Math.abs(k / fingers - 1) * 0.12);
      rim.push([ex + Math.cos(aa) * rr, ey + Math.sin(aa) * rr + (k % 2 ? 0 : out * R * 0.12)]);
    }
    const shape = blob([[ex - Math.cos(a) * 20, ey - Math.sin(a) * 20], ...rim], 3);
    const pleats = Array.from({length: fingers}, (_, k) => {
      const aa = a - spread + ((k * 2 + 1) / (fingers * 2)) * spread * 2;
      return `M${f1(ex)} ${f1(ey)} L${f1(ex + Math.cos(aa) * R * 0.88)} ${f1(ey + Math.sin(aa) * R * 0.88)}`;
    }).join(' ');
    return {stem: cap([0, top], [ex, ey], 22, 14), shape, pleats, k: i % 3, depth: out + (Math.sin(a) > 0 ? 1 : 0)};
  }).sort((a, b) => b.depth - a.depth);
  const shag: Part[] = skirt ? Array.from({length: 13}, (_, i) => {
    const u = i / 12 - 0.5, len = 480 + hs(seed, 50 + i) * 160;
    return {d: taper(smooth([[u * 120, top + 20], [u * 240, top + len * 0.5], [u * 190 + (hs(seed, 60 + i) - 0.5) * 40, top + len]], 4), 44, 20),
      fill: i % 2 ? dead : shade(dead, 0.15), ink: line(dead)};
  }) : [];
  const greens = [light(c, 0.15), c, shade(c, 0.18)];
  const sway = Math.sin(t * 0.8 + seed) * 0.5;
  return (
    <g transform={at(p)}>
      <defs>{greens.map((g, k) => <Ball key={k} id={`${id}-${k}`} c={g} fc={fc} a={0.35} b={0.38} />)}</defs>
      {shadowPair(1100, 300)}
      <g transform={`rotate(${f1(sway)})`}>
        <Wood list={[{pts: [[0, 0], [-6, -540], [(hs(seed, 1) - 0.5) * 30, top + 10]], w0: 120, w1: 104, flare: 40}]} c={trunk} ow={ow}
          half={60} fc={fc} />
        {/* the boot jack, the criss cross of old leaf bases up the trunk */}
        {Array.from({length: 9}, (_, i) => <g key={i} opacity={0.6}>
          <path d={cap([-42, -80 - i * 105], [38, -120 - i * 105], 12)} fill={shade(trunk, 0.3)} />
          <path d={cap([42, -60 - i * 105], [-30, -96 - i * 105], 10)} fill={light(trunk, 0.2)} />
        </g>)}
        <Pass ow={ow} parts={shag} />
        <Pass ow={ow} parts={fronds.map((f) => ({d: f.stem, fill: shade(c, 0.25), ink: line(c)}))} />
        {fronds.map((f, i) => <g key={i}>
          <path d={f.shape} fill={line(c)} stroke={line(c)} strokeWidth={ow * 2} strokeLinejoin="round" />
          <path d={f.shape} fill={`url(#${id}-${f.k})`} />
          <path d={f.pleats} stroke={shade(c, 0.3)} strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.6} />
        </g>)}
        <path d={circ(0, top, 40)} fill={shade(trunk, 0.2)} stroke={line(trunk)} strokeWidth={ow} />
      </g>
    </g>
  );
};

// ================================================================================ DESERT PLANTS

/**
 * OCOTILLO. Not a cactus and not dead. A fan of bare grey thorny whips from one crown at the ground.
 * `leafed` is a weather report (it rained in the last two weeks), and `blooming` tips every whip with
 * a red flame. The whips sway one by one.
 */
export const OcotilloV2: React.FC<FloraV2Props & {h?: number; canes?: number; leafed?: boolean; blooming?: boolean}> = (p) => {
  const {seed = 15, frame = 0, canes = 11, leafed = false, blooming = false} = p;
  const id = useUid();
  const ow = owOf(p.scale, 0.85), fc = p.facing ?? 1, t = frame / 30;
  const c = '#8a8f6e', leaf = '#82b84a', flame = '#ec4a2c';
  const whips = Array.from({length: canes}, (_, i) => {
    const f = (i / (canes - 1) - 0.5) * 2;
    const lean = f * (150 + hs(seed, i) * 70), top = -(360 + hs(seed, 20 + i) * 140);
    const sw = Math.sin(t * 1.1 + i * 0.8) * 6 * (Math.abs(f) + 0.3);
    const pts = smooth([[f * 10, -6], [lean * 0.25, top * 0.5], [lean + sw, top]], 6);
    return {pts, f, d: taper(pts, 13, 5)};
  });
  const nubs: Part[] = [];
  const leaves: Part[] = [];
  whips.forEach((w, i) => {
    const n = w.pts.length;
    for (let k = 2; k < n - 1; k++) {
      const q = w.pts[k], r = w.pts[k + 1], dx = r[0] - q[0], dy = r[1] - q[1], dl = Math.hypot(dx, dy) || 1;
      for (const sd of [-1, 1]) {
        if ((k + (sd > 0 ? 1 : 0)) % 2) continue;
        const nx = (-dy / dl) * sd, ny = (dx / dl) * sd;
        if (leafed) leaves.push({d: cap(q, [q[0] + nx * 16 + (dx / dl) * 6, q[1] + ny * 16 + (dy / dl) * 6], 9, 7),
          fill: k % 3 ? leaf : light(leaf, 0.25), ink: line(leaf), o: 0.7});
        else nubs.push({d: cap(q, [q[0] + nx * 9 - (dx / dl) * 2, q[1] + ny * 9 - (dy / dl) * 2], 5, 3), fill: c, ink: line(c), o: 0.6});
      }
    }
    void i;
  });
  const flames: Part[] = blooming ? whips.map((w) => {
    const q = w.pts[w.pts.length - 1], pr = w.pts[w.pts.length - 3];
    const dx = q[0] - pr[0], dy = q[1] - pr[1], dl = Math.hypot(dx, dy) || 1, ux = dx / dl, uy = dy / dl;
    return {d: blob([[q[0] - uy * 10, q[1] + ux * 10], [q[0] + ux * 26 - uy * 13, q[1] + uy * 26 + ux * 13], [q[0] + ux * 52, q[1] + uy * 52],
      [q[0] + ux * 26 + uy * 13, q[1] + uy * 26 - ux * 13], [q[0] + uy * 10, q[1] - ux * 10]], 3), fill: `url(#${id}-f)`, ink: line(flame)};
  }) : [];
  return (
    <g transform={at(p)}>
      <defs><Vert id={`${id}-c`} c={c} y0={-480} /><Ball id={`${id}-f`} c={flame} fc={fc} a={0.6} b={0.3} /></defs>
      {shadowPair(500, 120)}
      <Pass ow={ow} parts={[...nubs, ...whips.map((w) => ({d: w.d, fill: `url(#${id}-c)`, ink: line(c)})),
        {d: blob([[-34, 0], [-20, -26], [20, -26], [34, 0]], 3), fill: shade(c, 0.2), ink: line(c)}]} />
      {whips.map((w, i) => <path key={i} d={polyD(w.pts.slice(1, -2).map(([x, y]) => [x - 3 * fc, y] as Pt))} stroke={light(c, 0.5)}
        strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.5} />)}
      <Pass ow={ow} parts={[...leaves, ...flames]} />
    </g>
  );
};

/** a bloom stalk of rounded creamy bells for the yucca, bunched on short side branches up the top */
const bellStalk = (base: number, topY: number, id: string, seed: number, frame: number): {stalk: Part[]; bells: Part[]} => {
  const sw = Math.sin(frame / 30 * 1.2 + seed) * 6;
  const stalk: Part[] = [{d: taper(smooth([[0, base], [sw * 0.4, (base + topY) / 2], [sw, topY]], 4), 12, 6), fill: '#8f8a4c',
    ink: line('#8f8a4c')}];
  const bells: Part[] = [];
  const bell = (x: number, y: number, r: number) => bells.push({d: blob([[x - r, y - r * 0.2], [x - r * 0.6, y - r], [x + r * 0.6, y - r],
    [x + r, y - r * 0.2], [x + r * 0.7, y + r * 0.8], [x, y + r * 0.5], [x - r * 0.7, y + r * 0.8]], 3), fill: `url(#${id}-b)`, ink: line('#e8d6a8')});
  for (let i = 0; i < 6; i++) {
    const f = i / 5, y = topY + 26 + f * (base - topY) * 0.5, side = i % 2 ? 1 : -1, x0 = sw * (1 - f * 0.6);
    const bx = x0 + side * (26 + f * 22), by = y + 8;
    stalk.push({d: cap([x0, y - 6], [bx, by - 10], 5, 4), fill: '#8f8a4c', ink: line('#8f8a4c')});
    bell(bx, by, 11 + f * 2); bell(bx - side * 14, by + 12, 10 + f * 2); bell(bx + side * 8, by + 20, 9 + f * 2);
  }
  bell(sw, topY - 4, 10); bell(sw - 10, topY + 10, 10);
  void hs;
  return {stalk, bells};
};

/**
 * YUCCA. A ball of stiff sword leaves from one point at the ground, each a lit blade with a rounded
 * tip, and in spring a tall stalk of creamy bells. `trunked` is the old Torrey yucca, a rosette on a
 * woody stump with a beard of dead leaves hanging down.
 */
export const YuccaV2: React.FC<FloraV2Props & {h?: number; leaves?: number; trunked?: boolean}> = (p) => {
  const {seed = 16, season = 'summer', frame = 0, leaves = 22, trunked = false} = p;
  const id = useUid();
  const ow = owOf(p.scale, 0.8), fc = p.facing ?? 1, t = frame / 30;
  const c = '#6f9a58', dead = '#9a7a52';
  const tk = trunked ? 80 : 0, base = -tk - 26;
  const blades = Array.from({length: leaves}, (_, i) => {
    const a = -Math.PI * (0.02 + (i / (leaves - 1)) * 0.96) + (hs(seed, i) - 0.5) * 0.12;
    const out = Math.abs(Math.cos(a)), len = 78 + hs(seed, 30 + i) * 30 - out * 6;
    const sw = Math.sin(t * 1.4 + i) * 1.5;
    const ex = Math.cos(a) * len, ey = base + Math.sin(a) * len * 0.92 + out * out * 34;
    return {d: taper(smooth([[0, base], [ex * 0.5, base + (ey - base) * 0.55 - out * 6], [ex + sw, ey]], 4), 15, 4), k: i % 3, out};
  }).sort((a, b) => b.out - a.out);
  const greens = [light(c, 0.2), c, shade(c, 0.18)];
  const skirt: Part[] = trunked ? Array.from({length: 11}, (_, i) => {
    const u = i / 10 - 0.5;
    return {d: taper(smooth([[u * 30, base + 10], [u * 70, base + 40], [u * 80 + (hs(seed, 40 + i) - 0.5) * 10, -14]], 3), 12, 5),
      fill: i % 2 ? dead : shade(dead, 0.15), ink: line(dead)};
  }) : [];
  return (
    <g transform={at(p)}>
      <defs>
        {greens.map((g, k) => <linearGradient key={k} id={`${id}-${k}`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor={light(g, 0.35)} /><stop offset="55%" stopColor={g} /><stop offset="100%" stopColor={shade(g, 0.3)} />
        </linearGradient>)}
        <Ball id={`${id}-b`} c="#fbefcf" fc={fc} a={0.4} b={0.3} />
      </defs>
      {shadowPair(240, 80)}
      {trunked && <Wood list={[{pts: [[0, 0], [0, -tk * 0.5], [0, base + 10]], w0: 30, w1: 26, flare: 10}]} c={dead} ow={ow} half={20}
        fc={fc} />}
      <Pass ow={ow} parts={skirt} />
      {season === 'spring' && (() => {
        const b = bellStalk(base - 10, base - 236, id, seed, frame);
        return <><Pass ow={ow * 0.8} parts={b.stalk} /><Pass ow={ow * 0.7} parts={b.bells} /></>;
      })()}
      <Pass ow={ow} parts={blades.map((b) => ({d: b.d, fill: `url(#${id}-${b.k})`, ink: line(c)}))} />
    </g>
  );
};

/**
 * SOTOL. Mistaken for yucca, and different in one visible way. The leaves are thin grey green ribbons
 * that curl, so the plant is a soft spiky ball rather than a bundle of swords. The bloom stalk is a
 * thin pole with a narrow plume, and it stands dead for years, the bare poles that dot a Trans-Pecos
 * hillside. It shows in fall and winter, or always with `deadStalk`.
 */
export const SotolV2: React.FC<FloraV2Props & {h?: number; deadStalk?: boolean}> = (p) => {
  const {seed = 17, season = 'summer', frame = 0, deadStalk = false} = p;
  const ow = owOf(p.scale, 0.6), fc = p.facing ?? 1, t = frame / 30;
  const c = '#98b88c', dry = deadStalk ? '#bba98a' : '#c9ad78';
  const stalk = deadStalk || season === 'fall' || season === 'winter';
  // a spiky ball of thin ribbons bursting from a short crown, the lower ones reaching out and down to
  // the dirt, each curling over at its tip
  const cy = -64;
  const ribbons = Array.from({length: 66}, (_, i) => {
    const a = -Math.PI * 1.2 + ((i * 0.618) % 1) * Math.PI * 1.4;
    const out = Math.abs(Math.cos(a)), len = (92 + hs(seed, 30 + i) * 30) * (Math.sin(a) > 0 ? 0.8 : 1);
    const curl = Math.cos(a) >= 0 ? 1 : -1;
    const ex = Math.cos(a) * len, ey = Math.min(-4, cy + Math.sin(a) * len * 0.95);
    const sw = Math.sin(t * 1.3 + i * 0.7) * 2.5;
    const pts = smooth([[0, cy], [ex * 0.5, cy + (ey - cy) * 0.5], [ex + sw, ey], [ex + curl * 10 + sw, Math.min(-2, ey + 10)]], 4);
    const lit = (-Math.cos(a) * fc + 1) / 2;
    return {d: polyD(pts), col: i % 3 === 0 ? shade(c, 0.22) : mix(c, light(c, 0.4), lit * (1 - out * 0.5)), out: Math.sin(a) > 0 ? 2 : out};
  }).sort((a, b) => b.out - a.out);
  const plume: Part[] = [];
  if (stalk) {
    const sw = Math.sin(t * 0.9 + seed) * 4;
    plume.push({d: taper(smooth([[0, -60], [sw * 0.3, -230], [sw, -418]], 4), 9, 5), fill: dry, ink: line(dry)});
    for (let i = 0; i < 18; i++) {
      const f = i / 17, y = -230 - f * 180, side = i % 2 ? 1 : -1;
      plume.push({d: cap([sw * (0.5 + f * 0.5), y], [sw * (0.5 + f * 0.5) + side * (14 - f * 6), y - 10], 13 - f * 4, 11 - f * 4),
        fill: i % 3 ? dry : light(dry, 0.3), ink: line(dry)});
    }
  }
  return (
    <g transform={at(p)}>
      {shadowPair(220, 70)}
      <Pass ow={owOf(p.scale, 0.8)} parts={plume} />
      <path d={ell(0, cy - 4, 34, 30)} fill={shade(c, 0.45)} />
      {ribbons.map((r, i) => <path key={`o${i}`} d={r.d} stroke={line(c)} strokeWidth={4.6 + ow * 2} strokeLinecap="round" fill="none" />)}
      {ribbons.map((r, i) => <path key={i} d={r.d} stroke={r.col} strokeWidth={4.6} strokeLinecap="round" fill="none" />)}
    </g>
  );
};

/**
 * LECHUGUILLA. Knee high, in colonies, and the indicator plant of the Chihuahuan Desert. Thick yellow
 * green leaves curving up from each rosette with a pale stripe down the middle and a hard dark spine
 * at every tip, at exactly shin height.
 */
export const LechuguillaV2: React.FC<FloraV2Props & {h?: number; heads?: number}> = (p) => {
  const {seed = 18, frame = 0, heads = 3} = p;
  const id = useUid();
  const ow = owOf(p.scale, 0.7), fc = p.facing ?? 1, t = frame / 30;
  const c = '#93b456', spine = '#4a2c3c';
  const rosettes = Array.from({length: heads}, (_, j) => ({ox: (hs(seed, j) - 0.5) * 75 * (heads > 1 ? 1.4 : 0),
    s: 0.7 + hs(seed, 20 + j) * 0.45})).sort((a, b) => a.s - b.s);
  return (
    <g transform={at(p)}>
      <defs><Vert id={`${id}-l`} c={c} y0={-50} /></defs>
      {shadowPair(160, 60)}
      {rosettes.map((r, j) => {
        const blades = Array.from({length: 9}, (_, i) => {
          const f = (i / 8 - 0.5) * 2 + (hs(seed, 40 + j * 9 + i) - 0.5) * 0.15, len = (32 + hs(seed, 30 + j * 11 + i) * 16) * (1 - Math.abs(f) * 0.3);
          const sw = Math.sin(t * 1.5 + i + j) * 0.8;
          const pts = smooth([[f * 5, 0], [f * 17, -len * 0.5], [f * 30 + sw, -len]], 4);
          const q = pts[pts.length - 1], pr = pts[pts.length - 3];
          const dx = q[0] - pr[0], dy = q[1] - pr[1], dl = Math.hypot(dx, dy) || 1;
          return {pts, f, tip: cap(q, [q[0] + (dx / dl) * 6, q[1] + (dy / dl) * 6], 2.4, 1.2)};
        }).sort((a, b) => Math.abs(b.f) - Math.abs(a.f));
        return <g key={j} transform={`translate(${f1(r.ox)} ${f1(-Math.abs(r.ox) * 0.05)}) scale(${f1(r.s)})`}>
          <Pass ow={ow / r.s} parts={blades.flatMap((b) => [
            {d: taper(b.pts, 9.5, 3), fill: `url(#${id}-l)`, ink: line(c)},
            {d: b.tip, fill: spine, ink: line(spine), o: 0.4}])} />
          {blades.map((b, i) => <path key={i} d={polyD(b.pts.slice(1, -2))} stroke={light(c, 0.55)} strokeWidth={1.4} strokeLinecap="round"
            fill="none" opacity={0.7} />)}
        </g>;
      })}
    </g>
  );
};

// =================================================================================== WILDFLOWERS

const BLUE = '#3f6fe6', MAGENTA = '#d63f7e', BRUSH = '#ee5a2c', COREOPSIS = '#f6c42c';

/** one bluebonnet spike in centimetres, florets stacking to a white tip, magenta banners below */
const spikeParts = (sw: number, ow: number, blue: string, n = 9, stem = '#5f8a3e'): Part[] => {
  const parts: Part[] = [{d: taper(smooth([[0, 0], [sw * 0.3, -12], [sw * 0.7, -24], [sw, -38]], 3), 2.8, 1.8), fill: stem, ink: line(stem),
    o: 0.6}];
  for (let k = 0; k < n; k++) {
    const f = k / (n - 1), y = -17 - f * 22, side = k % 2 ? 1 : -1, x = sw * (0.55 + f * 0.45) + side * 1.7 * (1 - f * 0.6);
    parts.push({d: circ(x, y, 3.4 * (1 - f * 0.5)), fill: blue, ink: line(BLUE)});
  }
  parts.push({d: circ(sw, -40.5, 2.1), fill: '#f6f2ff', ink: line(BLUE)});
  void ow;
  return parts;
};
const bannerDots = (sw: number, n = 13) => Array.from({length: n}, (_, k) => {
  const f = k / (n - 1), y = -17 - f * 22, side = k % 2 ? 1 : -1, x = sw * (0.55 + f * 0.45) + side * 1.7 * (1 - f * 0.6);
  return {x: x + side * 0.9, y: y - 1.1 * (1 - f * 0.4), r: 1.1 * (1 - f * 0.35), c: k < n * 0.35 ? MAGENTA : '#ffffff'};
}).filter((_, k) => k < n - 2 && k % 2 === 0);

/**
 * A SINGLE BLUEBONNET, for when one is the subject. Palmate leaves of rounded leaflets at the foot,
 * a stem, and a spike of round blue florets narrowing to a white tip, with white banner spots up top
 * and magenta below on the same stalk. It nods in the breeze.
 */
export const BluebonnetV2: React.FC<FloraV2Props & {h?: number}> = (p) => {
  const {seed = 20, frame = 0} = p;
  const id = useUid();
  const ow = owOf(p.scale, 0.8), fc = p.facing ?? 1, t = frame / 30;
  const leaf = '#6c9a48';
  const sw = Math.sin(t * 1.6 + seed) * 1.6 + 1;
  const palm = (cx: number, cy: number, s: number): Part[] => Array.from({length: 5}, (_, k) => {
    const a = (-0.12 - k * 0.19) * Math.PI;
    return {d: cap([cx + Math.cos(a) * 1.2 * s, cy + Math.sin(a) * 1.2 * s], [cx + Math.cos(a) * 7.4 * s, cy + Math.sin(a) * 7.4 * s], 2.8 * s,
      2.4 * s), fill: k % 2 ? leaf : light(leaf, 0.2), ink: line(leaf), o: 0.8};
  });
  const parts = spikeParts(sw, ow, `url(#${id}-b)`, 13);
  return (
    <g transform={at(p)}>
      <defs><Ball id={`${id}-b`} c={BLUE} fc={fc} a={0.45} b={0.38} /></defs>
      {shadowPair(26, 10)}
      <Pass ow={ow} parts={[
        {d: cap([-1, 0], [-4.5, -3.5], 1.4, 1.1), fill: leaf, ink: line(leaf), o: 0.6},
        {d: cap([1, 0], [5, -5.5], 1.4, 1.1), fill: leaf, ink: line(leaf), o: 0.6},
        ...palm(-5, -4, 0.62), ...palm(5.5, -6, 0.7), ...parts]} />
      {bannerDots(sw).map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.c} />)}
      <ellipse cx={sw - 1.6 * fc} cy={-33} rx={1.1} ry={3.4} fill="#ffffff" opacity={0.35} />
    </g>
  );
};

/** the field plants, each a function of (sway, ink width) in centimetres */
const paintbrushParts = (sw: number, fill: string, tip: string): Part[] => [
  {d: taper(smooth([[0, 0], [sw * 0.4, -14], [sw, -26]], 3), 2.6, 1.8), fill: '#6a9244', ink: line('#6a9244'), o: 0.6},
  ...[0, 1, 2, 3].map((k) => ({d: cap([sw + (k % 2 ? 2 : -2), -24 - k * 3.4], [sw + (k % 2 ? 4.5 : -4.5), -28 - k * 3.4], 5 - k * 0.6),
    fill: k === 3 ? tip : fill, ink: line(BRUSH)})),
  {d: circ(sw, -38, 2.6), fill: tip, ink: line(BRUSH)},
];
const coreopsisParts = (sw: number, fill: string): Part[] => [
  {d: taper(smooth([[0, 0], [sw * 0.4, -14], [sw, -27]], 3), 2.4, 1.6), fill: '#6a9244', ink: line('#6a9244'), o: 0.6},
  ...Array.from({length: 8}, (_, k) => {
    const a = (k / 8) * Math.PI * 2;
    return {d: cap([sw + Math.cos(a) * 1.5, -28 + Math.sin(a) * 1.1], [sw + Math.cos(a) * 5.4, -28 + Math.sin(a) * 3.6], 3.4, 3.8), fill,
      ink: line(COREOPSIS)};
  }),
  {d: ell(sw, -28, 2.2, 1.7), fill: '#7a3a22', ink: line('#7a3a22')},
];

/** sort a field's plants back to front and give each a depth band for the colour fade */
const fieldPlants = (n: number, seed: number, w: number, depth: number, pw: number) => Array.from({length: n}, (_, i) => {
  const u = hs(seed, i), v = Math.pow(hs(seed, 500 + i), pw);
  return {i, x: (u - 0.5) * w, y: v * depth, v, band: Math.min(3, Math.floor(v * 4))};
}).sort((a, b) => a.v - b.v);
const FAR = '#b8c2ea';
const fade = (c: string, band: number) => mix(c, FAR, (3 - band) * 0.1);

/**
 * THE WILDFLOWER VERGE. A sheet of bluebonnets mixed with Indian paintbrush and coreopsis on a highway
 * right of way, more of them toward the front and paler toward the back. `mix` sets the share of each.
 * Every flower is a round lit mass with a soft line, and the whole verge leans in the wind.
 */
export const WildflowerVergeV2: React.FC<FloraV2Props & {w?: number; depth?: number; density?: number;
  mix?: {bluebonnet: number; paintbrush: number; coreopsis: number}}> = (p) => {
  const {seed = 19, frame = 0, w = 1080, depth = 190, density = 1, mix: mx = {bluebonnet: 0.55, paintbrush: 0.28, coreopsis: 0.17}} = p;
  const id = useUid();
  const t = frame / 30, sc = p.scale ?? 1;
  const total = mx.bluebonnet + mx.paintbrush + mx.coreopsis;
  const plants = fieldPlants(Math.round(190 * density), seed, w, depth, 0.7);
  return (
    <g transform={`translate(${p.x ?? 0} ${p.y ?? 0})`}>
      <defs>{[0, 1, 2, 3].map((b) => <React.Fragment key={b}>
        <Ball id={`${id}-b${b}`} c={fade(BLUE, b)} a={0.45} />
        <Ball id={`${id}-p${b}`} c={fade(BRUSH, b)} a={0.45} />
        <Ball id={`${id}-c${b}`} c={fade(COREOPSIS, b)} a={0.45} b={0.3} />
      </React.Fragment>)}</defs>
      {plants.map((q) => {
        const s = sc * CM * (0.55 + q.v * 0.85);
        const ow = 1.3 / s;
        const sw = Math.sin(t * 1.4 + q.x * 0.02 + hs(seed, 900 + q.i) * 2) * 2 + (hs(seed, 2000 + q.i) - 0.5) * 4;
        const pick = hs(seed, 1000 + q.i) * total;
        const kind = pick < mx.bluebonnet ? 0 : pick < mx.bluebonnet + mx.paintbrush ? 1 : 2;
        const parts = kind === 0 ? spikeParts(sw, ow, `url(#${id}-b${q.band})`, 9)
          : kind === 1 ? paintbrushParts(sw, `url(#${id}-p${q.band})`, fade('#f6a03a', q.band))
            : coreopsisParts(sw, `url(#${id}-c${q.band})`);
        return <g key={q.i} transform={`translate(${f1(q.x)} ${f1(q.y)}) scale(${s})`}>
          <Pass ow={ow} parts={parts} />
          {kind === 0 && bannerDots(sw, 9).map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.c} />)}
        </g>;
      })}
    </g>
  );
};

// ====================================================================================== GRASSES

/** one bunch of grass blades as tapered lit leaves, in centimetres */
const bladeSet = (n: number, hgt: number, spread: number, sw: number, seed: number, ch: number, wid = 5): Pt[][] =>
  Array.from({length: n}, (_, i) => {
    const f = n === 1 ? 0 : (i / (n - 1) - 0.5) * 2;
    const L = hgt * (0.7 + hs(seed, ch + i) * 0.3) * (1 - Math.abs(f) * 0.2);
    void wid;
    return smooth([[f * 3, 0], [f * spread * 0.35 + sw * 0.3, -L * 0.5], [f * spread + sw + (hs(seed, ch + 40 + i) - 0.5) * 8, -L]], 4);
  });

/**
 * LITTLE BLUESTEM. The prairie grass that goes RUST ORANGE in November with silver seed heads in the
 * low sun. Bunches of lit blades, paler toward the back, swaying in waves across the field.
 */
export const BluestemV2: React.FC<FloraV2Props & {w?: number; depth?: number; density?: number; wind?: number}> = (p) => {
  const {seed = 21, season = 'fall', frame = 0, w = 1080, depth = 170, density = 1, wind = 0.5} = p;
  const id = useUid();
  const t = frame / 30, sc = p.scale ?? 1;
  const c = season === 'fall' ? '#c8693a' : season === 'winter' ? '#b89a64' : season === 'spring' ? '#7fae52' : '#8fa65a';
  const silver = '#f2e6cc';
  const plants = fieldPlants(Math.round(230 * density), seed, w, depth, 0.7);
  return (
    <g transform={`translate(${p.x ?? 0} ${p.y ?? 0})`}>
      <defs>{[0, 1, 2, 3].map((b) => <Vert key={b} id={`${id}-${b}`} c={fade(c, b)} y0={-110} />)}</defs>
      {plants.map((q) => {
        const s = sc * CM * (0.5 + q.v * 0.9), ow = 1.4 / s;
        const sw = Math.sin(t * 1.2 + q.x * 0.012 + hs(seed, 900 + q.i) * 1.5) * wind * 16;
        const bl = bladeSet(5, 104, 30, sw, seed, q.i * 13);
        const parts: Part[] = bl.map((pts) => ({d: taper(pts, 6, 1.6), fill: `url(#${id}-${q.band})`, ink: line(c)}));
        if (season === 'fall') bl.filter((_, k) => k % 2).forEach((pts) => parts.push({d: taper(pts.slice(-6), 6, 4),
          fill: fade(silver, q.band), ink: line(silver), o: 0.7}));
        return <g key={q.i} transform={`translate(${f1(q.x)} ${f1(q.y)}) scale(${s})`}><Pass ow={ow} parts={parts} /></g>;
      })}
    </g>
  );
};

/** CORDGRASS. The coastal marsh band. Stiff, upright, uniform green blades right to the water's edge. */
export const CordgrassV2: React.FC<FloraV2Props & {w?: number; depth?: number; density?: number}> = (p) => {
  const {seed = 22, season = 'summer', frame = 0, w = 1080, depth = 130, density = 1} = p;
  const id = useUid();
  const t = frame / 30, sc = p.scale ?? 1;
  const c = season === 'winter' ? '#b4a472' : '#7aa84c';
  const plants = fieldPlants(Math.round(260 * density), seed, w, depth, 0.65);
  return (
    <g transform={`translate(${p.x ?? 0} ${p.y ?? 0})`}>
      <defs>{[0, 1, 2, 3].map((b) => <Vert key={b} id={`${id}-${b}`} c={fade(c, b)} y0={-130} />)}</defs>
      {plants.map((q) => {
        const s = sc * CM * (0.55 + q.v * 0.8), ow = 1.4 / s;
        const sw = Math.sin(t * 0.9 + q.v * 3) * 6;
        const parts: Part[] = bladeSet(3, 124, 16, sw, seed, q.i * 7).map((pts) => ({d: taper(pts, 6.5, 2), fill: `url(#${id}-${q.band})`,
          ink: line(c)}));
        return <g key={q.i} transform={`translate(${f1(q.x)} ${f1(q.y)}) scale(${s})`}><Pass ow={ow} parts={parts} /></g>;
      })}
    </g>
  );
};

/** A SINGLE GRASS TUFT for the mid ground. Buffalo grass, bunched and grey green. `h` sizes it as before. */
export const GrassTuftV2: React.FC<FloraV2Props & {h?: number; blades?: number}> = (p) => {
  const {seed = 23, season = 'summer', frame = 0, h = 30, blades = 9} = p;
  const id = useUid();
  const k = h / 30, ow = owOf(p.scale, 0.8) / k, t = frame / 30;
  const c = season === 'winter' ? '#b89a64' : season === 'fall' ? '#c08f50' : '#8aa85a';
  const sw = Math.sin(t * 1.3 + seed) * 3;
  const bl = bladeSet(blades, 58, 34, sw, seed, 3);
  return (
    <g transform={`translate(${p.x ?? 0} ${p.y ?? 0}) scale(${(p.scale ?? 1) * CM * k})`}>
      <defs><Vert id={`${id}-g`} c={c} y0={-60} /></defs>
      <ContactShadow x={0} y={1} w={60} opacity={0.32} />
      <Pass ow={ow} parts={bl.map((pts) => ({d: taper(pts, 6, 1.6), fill: `url(#${id}-g)`, ink: line(c)}))} />
    </g>
  );
};

// ======================================================================================== CROPS

/**
 * GRAIN SORGHUM, milo. Rows of plants with arching leaves and a dense RED BROWN club of grain standing
 * above them, so a field at heading is a rust plane. Rows recede and fade, and the heads nod.
 */
export const SorghumV2: React.FC<FloraV2Props & {w?: number; depth?: number; rows?: number}> = (p) => {
  const {frame = 0, w = 1080, depth = 200, rows = 9} = p;
  const id = useUid();
  const t = frame / 30, sc = p.scale ?? 1;
  const leaf = '#5f9440', head = '#a84a2e';
  return (
    <g transform={`translate(${p.x ?? 0} ${p.y ?? 0})`}>
      {Array.from({length: rows}, (_, r) => {
        const v = r / Math.max(1, rows - 1), band = Math.min(3, Math.floor(v * 4));
        const s = sc * CM * (0.42 + v * 0.9), ow = 1.6 / s, per = Math.round(16 + v * 16);
        const L = fade(leaf, band), Hc = fade(head, band);
        return <g key={r} transform={`translate(0 ${f1(Math.pow(v, 1.5) * depth)}) scale(${s})`}>
          <defs><Ball id={`${id}-${r}`} c={Hc} a={0.45} b={0.36} /></defs>
          {Array.from({length: per}, (_, i) => {
            const px = (per > 1 ? i / (per - 1) - 0.5 : 0) * (w / s), sw = Math.sin(t * 1.2 + i * 0.6 + r) * 4;
            const parts: Part[] = [{d: taper(smooth([[0, 0], [sw * 0.4, -70], [sw, -128]], 3), 5, 3.4), fill: L, ink: line(leaf)}];
            for (let k = 0; k < 4; k++) {
              const y = -26 - k * 24, sd = k % 2 ? 1 : -1;
              parts.push({d: taper(smooth([[sw * (k / 5), y], [sd * 22, y - 14], [sd * 46, y + 6]], 4), 7, 1.8), fill: k % 2 ? L : light(L, 0.15),
                ink: line(leaf)});
            }
            for (let k = 0; k < 6; k++) parts.push({d: circ(sw + (k % 2 ? 1.6 : -1.6), -128 - k * 5.4, 7.6 - k * 0.6), fill: `url(#${id}-${r})`,
              ink: line(head)});
            return <g key={i} transform={`translate(${f1(px)} 0)`}><Pass ow={ow} parts={parts} /></g>;
          })}
        </g>;
      })}
    </g>
  );
};

/**
 * COTTON at defoliation, the picture everybody has. Brown sticks, fluffy white bolls of four round
 * lobes on dark star burrs, the ground showing through. `opened` is the share of bolls burst.
 */
export const CottonFieldV2: React.FC<FloraV2Props & {w?: number; depth?: number; rows?: number; opened?: number}> = (p) => {
  const {seed = 25, frame = 0, w = 1080, depth = 210, rows = 10, opened = 0.8} = p;
  const id = useUid();
  const t = frame / 30, sc = p.scale ?? 1;
  const stem = '#7a553a', lint = '#fbf6ea';
  return (
    <g transform={`translate(${p.x ?? 0} ${p.y ?? 0})`}>
      <defs>{[0, 1, 2, 3].map((b) => <Ball key={b} id={`${id}-${b}`} c={fade(lint, b)} a={0.2} b={0.22} />)}</defs>
      {Array.from({length: rows}, (_, r) => {
        const v = r / Math.max(1, rows - 1), band = Math.min(3, Math.floor(v * 4));
        const s = sc * CM * (0.4 + v * 0.9), ow = 1.5 / s, per = Math.round(20 + v * 18);
        const St = fade(stem, band);
        return <g key={r} transform={`translate(0 ${f1(Math.pow(v, 1.5) * depth)}) scale(${s})`}>
          {Array.from({length: per}, (_, i) => {
            const px = (per > 1 ? i / (per - 1) - 0.5 : 0) * (w / s), sd0 = seed + r * 97 + i;
            const sw = Math.sin(t * 1.0 + i * 0.5 + r) * 1.5;
            const parts: Part[] = [{d: taper(smooth([[0, 0], [sw * 0.5, -40], [sw, -80]], 3), 4.5, 2.6), fill: St, ink: line(stem)}];
            const bolls: Part[] = [];
            for (let k = 0; k < 4; k++) {
              const bx = (k % 2 ? 1 : -1) * (12 + k * 3) + sw, by = -26 - k * 15;
              parts.push({d: taper([[sw * 0.6, by + 8], [bx, by]], 2.6, 2), fill: St, ink: line(stem)});
              if (hs(sd0, k) < opened) {
                bolls.push(...[-1, 1].map((dd) => ({d: cap([bx, by + 5], [bx + dd * 6, by + 9], 4, 3), fill: '#5e3e2a', ink: line('#5e3e2a')})));
                bolls.push(...[[-4, -2], [4, -2], [-2.4, -7], [2.6, -6.6]].map(([dx, dy]) => ({d: circ(bx + dx, by + dy, 5.4),
                  fill: `url(#${id}-${band})`, ink: line('#d8d0e4')})));
              } else bolls.push({d: ell(bx, by - 2, 4.2, 5.4), fill: fade('#6f9a44', band), ink: line('#6f9a44')});
            }
            return <g key={i} transform={`translate(${f1(px)} 0)`}><Pass ow={ow} parts={[...parts, ...bolls]} /></g>;
          })}
        </g>;
      })}
    </g>
  );
};

/**
 * AN ORCHARD in rows. Low round crowns on short trunks in lines, which reads as agriculture from any
 * distance. Hill Country peaches or Valley citrus, told apart by the leaf and the fruit colour.
 */
export const OrchardRowV2: React.FC<FloraV2Props & {w?: number; depth?: number; rows?: number; crop?: 'peach' | 'citrus'; fruit?: boolean}> = (p) => {
  const {seed = 26, frame = 0, w = 1080, depth = 200, rows = 5, crop = 'peach', fruit = true} = p;
  const id = useUid();
  const sc = p.scale ?? 1;
  const leaf = crop === 'peach' ? '#5f9a45' : '#357a42', fruitC = crop === 'peach' ? '#f28a50' : '#f4c63a', bark = '#6a4c38';
  return (
    <g transform={`translate(${p.x ?? 0} ${p.y ?? 0})`}>
      <defs>{[0, 1, 2, 3].map((b) => <Ball key={b} id={`${id}-${b}`} c={fade(fruitC, b)} a={0.5} b={0.3} />)}</defs>
      {Array.from({length: rows}, (_, r) => {
        const v = r / Math.max(1, rows - 1), band = Math.min(3, Math.floor(v * 4));
        const s = sc * CM * (0.45 + v * 0.85), per = Math.round(6 + v * 6), ow = 2.6 / s;
        return <g key={r} transform={`translate(0 ${f1(Math.pow(v, 1.4) * depth)}) scale(${s})`}>
          {Array.from({length: per}, (_, i) => {
            const px = (per > 1 ? i / (per - 1) - 0.5 : 0) * (w / s), sd = seed + r * 53 + i;
            const lobes = jit([[-90, -250, 95], [0, -300, 110], [95, -250, 95], [-50, -190, 85], [55, -190, 85]], sd, 30);
            return <g key={i} transform={`translate(${f1(px)} 0)`}>
              <ContactShadow x={0} y={4} w={360} opacity={0.24 * (0.4 + v * 0.6)} />
              <Wood list={[{pts: [[0, 0], [0, -80], [0, -170]], w0: 34, w1: 26, flare: 14}]} c={fade(bark, band)} ow={ow} half={30}
                sheen={false} />
              <Crown lobes={lobes} c={fade(leaf, band)} ow={ow} frame={frame} wob={4} sheen={2} tex={false} />
              {fruit && Array.from({length: 7}, (_, k) => {
                const fx = (hs(sd, 30 + k) - 0.5) * 220, fy = -250 + (hs(sd, 40 + k) - 0.5) * 150;
                return <g key={k}>
                  <circle cx={fx} cy={fy} r={18 + ow} fill={line(fruitC)} />
                  <circle cx={fx} cy={fy} r={18} fill={`url(#${id}-${band})`} />
                </g>;
              })}
            </g>;
          })}
        </g>;
      })}
    </g>
  );
};

// ======================================================================================= OTHERS

/**
 * THE ROADSIDE SUNFLOWER. Common sunflower, small heads and many to a plant, taking over a bar ditch
 * after a wet spring. Big heart shaped leaves, and heads with a ring of round golden petals around a
 * dark seed disk, each nodding on its own stem.
 */
export const SunflowerV2: React.FC<FloraV2Props & {h?: number; heads?: number}> = (p) => {
  const {seed = 27, frame = 0, heads = 5} = p;
  const id = useUid();
  const ow = owOf(p.scale, 0.85), fc = p.facing ?? 1, t = frame / 30;
  const g = '#5f9a45', petal = '#f7c12a', disk = '#6a3a1e';
  const sw = Math.sin(t * 1.1 + seed) * 4;
  const top: Pt = [(hs(seed, 1) - 0.5) * 20 + sw, -172];
  const leafShape = (x: number, y: number, a: number, L: number, W: number) => {
    const ca = Math.cos(a), sa = Math.sin(a);
    const P = (u: number, v: number): Pt => [x + ca * u - sa * v, y + sa * u + ca * v];
    return blob([P(0, 0), P(L * 0.25, -W * 0.9), P(L * 0.65, -W * 0.7), P(L, 0), P(L * 0.65, W * 0.7), P(L * 0.25, W * 0.9)], 4);
  };
  const leaves: Part[] = [0, 1, 2, 3].map((i) => {
    const y = -36 - i * 30, sd = i % 2 ? 1 : -1;
    return {d: leafShape(sw * (i / 6), y, sd > 0 ? 0.35 : Math.PI - 0.35, 42 - i * 5, 15 - i * 1.5), fill: i % 2 ? g : light(g, 0.12), ink: line(g)};
  });
  const hd = Array.from({length: heads}, (_, i) => {
    const f = i / Math.max(1, heads - 1);
    const hx = (hs(seed, 10 + i) - 0.5) * 90 + sw * (0.5 + f * 0.5), hy = -90 - f * 92;
    const nod = Math.sin(t * 1.5 + i * 1.3) * 5;
    return {hx: i === heads - 1 ? top[0] : hx, hy: i === heads - 1 ? top[1] : hy, nod, r: 1 - (i % 3) * 0.1, i};
  });
  const stems: Part[] = [{d: taper(smooth([[0, 0], [sw * 0.3, -80], top], 4), 7, 4), fill: g, ink: line(g)},
    ...hd.slice(0, -1).map((h) => ({d: taper(smooth([[sw * 0.3 * ((-h.hy) / 172), h.hy + 30], [h.hx * 0.6, h.hy + 8], [h.hx, h.hy]], 3), 3.6, 2.6),
      fill: g, ink: line(g)}))];
  return (
    <g transform={at(p)}>
      <defs><Ball id={`${id}-p`} c={petal} fc={fc} a={0.5} b={0.3} /><Ball id={`${id}-d`} c={disk} fc={fc} a={0.3} b={0.4} /></defs>
      {shadowPair(120, 40)}
      <Pass ow={ow} parts={[...stems, ...leaves]} />
      {hd.map((h) => <g key={h.i} transform={`translate(${f1(h.hx)} ${f1(h.hy)}) rotate(${f1(h.nod + 10 * fc)}) scale(${h.r})`}>
        <Pass ow={ow / h.r} parts={[...Array.from({length: 12}, (_, k) => {
          const a = (k / 12) * Math.PI * 2;
          return {d: cap([Math.cos(a) * 8, Math.sin(a) * 8], [Math.cos(a) * 20, Math.sin(a) * 20], 7, 8), fill: `url(#${id}-p)`, ink: line(petal)};
        }), {d: circ(0, 0, 10), fill: `url(#${id}-d)`, ink: line(disk)}]} />
        <circle cx={-3 * fc} cy={-3.5} r={3} fill="#ffffff" opacity={0.22} />
      </g>)}
    </g>
  );
};

/**
 * TUMBLEWEED. Russian thistle, dried and broken loose. A round airy tangle of curling stems, lit from
 * above, and when `rolling` it bounces and spins along the ground while its shadow stays on the dirt.
 */
export const TumbleweedV2: React.FC<FloraV2Props & {h?: number; rolling?: boolean; travel?: number}> = (p) => {
  const {seed = 28, frame = 0, rolling = false, travel = 320} = p;
  const sc = (p.scale ?? 1) * CM;
  const ow = 2.2 / sc, c = '#b39a74';
  const q = rolling ? ((frame / 30) * 0.55 + hs(seed, 1)) % 1 : 0;
  const R = 35;
  const bounce = rolling ? Math.abs(Math.sin(q * Math.PI * 7)) * R * 0.7 : 0;
  const spin = rolling ? q * 720 : hs(seed, 2) * 360 + Math.sin(frame / 30 * 1.6) * 4;
  const loops = Array.from({length: 26}, (_, i) => {
    const a = hs(seed, 10 + i) * Math.PI * 2, b = a + 1.4 + hs(seed, 20 + i) * 1.6;
    const r1 = R * (0.55 + hs(seed, 30 + i) * 0.45), r2 = R * (0.5 + hs(seed, 40 + i) * 0.5);
    const mid = (a + b) / 2, rm = R * (0.15 + hs(seed, 50 + i) * 0.5);
    return polyD(smooth([[Math.cos(a) * r1, Math.sin(a) * r1], [Math.cos(mid) * rm, Math.sin(mid) * rm], [Math.cos(b) * r2, Math.sin(b) * r2],
      [Math.cos(b + 0.6) * r2 * 0.9, Math.sin(b + 0.6) * r2 * 0.9]], 5));
  });
  const cols = [light(c, 0.3), c, shade(c, 0.2)];
  const px = (p.x ?? 0) + q * travel;
  return (
    <g>
      <g transform={`translate(${f1(px)} ${p.y ?? 0}) scale(${sc})`}>
        <ContactShadow x={0} y={2} w={R * 2.2 * (1 - bounce / R * 0.4)} opacity={0.32 * (1 - bounce / R * 0.5)} />
      </g>
      <g transform={`translate(${f1(px)} ${f1((p.y ?? 0) - (R + bounce) * sc)}) scale(${sc}) rotate(${f1(spin)})`}>
        <circle r={R * 0.8} fill={shade(c, 0.35)} opacity={0.45} />
        {loops.map((d, i) => <path key={`o${i}`} d={d} stroke={line(c)} strokeWidth={2.4 + ow * 2} strokeLinecap="round" fill="none" />)}
        {loops.map((d, i) => <path key={i} d={d} stroke={cols[i % 3]} strokeWidth={2.4} strokeLinecap="round" fill="none" />)}
      </g>
    </g>
  );
};

export const FLORA_V2 = ['LiveOakV2', 'PecanV2', 'LoblollyV2', 'PostOakV2', 'BoisDArcV2', 'CottonwoodV2', 'BaldCypressV2', 'AsheJuniperV2',
  'CrepeMyrtleV2', 'HuisacheV2', 'SabalPalmV2', 'OcotilloV2', 'YuccaV2', 'SotolV2', 'LechuguillaV2', 'WildflowerVergeV2', 'BluebonnetV2',
  'BluestemV2', 'CordgrassV2', 'GrassTuftV2', 'SorghumV2', 'CottonFieldV2', 'OrchardRowV2', 'SunflowerV2', 'TumbleweedV2'] as const;
