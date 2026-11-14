import React from 'react';
import {M} from '../../lib/scale';
import {FONT} from '../../lib/type';
import {light, line, mix, shade} from '../color';
import {ContactShadow, useUid} from '../Kit';
import {taper} from '../props';

/**
 * THE KIT, LOOK V2 (November 13th, 2026).
 *
 * The drawable Texas inventory from lib/kit.tsx redrawn in the v2 idiom. Thirteen drawings, and the
 * three the films lean on hardest come first in care as well as in order. The mesquite stands in
 * most of the films, then the pumpjack and the windmill.
 *
 * Every drawing follows the blueprint (knowledge/craft/LOOK_V2.md). Round joins and caps, lit from
 * the upper left with shade pushed toward violet, outlines in each fill's own deep hue drawn as one
 * pass under the fills so joined parts show no seam, a contact shadow under anything that stands,
 * and something that moves on `frame` (a sway, a turning wheel, a blink, a ripple).
 *
 * PLACEMENT is the library's. x, y at the ground, `scale` 1 is true size through the one metre in
 * lib/scale.ts, `seed` for the lopsidedness, `wear` for rust and dust. Each drawing is built in
 * centimetres and converted once, so `scale` means the same here as in look/props.tsx. The true
 * heights below are the library's own measurements, restated because a v2 drawing does not import
 * from src/lib/ beyond the metre and the type.
 */
const CM = M / 100;
export const KIT_V2_M: Record<string, {h: number; note: string}> = {
  pumpjack: {h: 6.5, note: 'to the top of the samson post, a common pumping unit'},
  dataCentre: {h: 12, note: 'single storey hall, ground to the roof line'},
  transformer: {h: 4.5, note: 'a substation power transformer, the library measure'},
  latticeTower: {h: 45, note: 'a 345 kV lattice suspension tower'},
  windTurbine: {h: 100, note: 'hub height, the blades reach above it'},
  windmill: {h: 10, note: 'a farm windmill on a 33 foot tower, to the hub'},
  stockTank: {h: 1.2, note: 'the bank of an earthen tank, at the near rim'},
  cattleGuard: {h: 0.3, note: 'the pipe deck, which sits nearly flush in the road'},
  waterTower: {h: 40, note: 'a municipal tower, the library measure'},
  mesquite: {h: 6, note: 'a mature honey mesquite at the crown'},
  pricklyPear: {h: 1.2, note: 'a clump at the top pad'},
};

export interface KitV2Props {x?: number; y?: number; scale?: number; seed?: number; wear?: number; facing?: 1 | -1; frame?: number}

type Pt = [number, number];
const at = (p: KitV2Props, flip = true) =>
  `translate(${p.x ?? 0} ${p.y ?? 0}) scale(${(p.scale ?? 1) * CM * (flip ? (p.facing ?? 1) : 1)} ${(p.scale ?? 1) * CM})`;
/** outline half width in local centimetres, about 3.4 film pixels a side at any scale */
const owOf = (scale?: number, unit = 1) => 3.4 / ((scale ?? 1) * CM * unit);
const hash = (seed: number, ch: number) => {
  let t = (Math.imul(seed + 7, 374761393) + Math.imul(ch + 3, 668265263)) >>> 0;
  t = Math.imul(t ^ (t >>> 13), 1274126177) >>> 0;
  return ((t ^ (t >>> 16)) >>> 0) % 100000 / 100000;
};
const f1 = (n: number) => n.toFixed(1);
/** a rounded rectangle as a path */
const rr = (x: number, y: number, w: number, h: number, r: number) => {
  const q = Math.min(r, w / 2, h / 2);
  return `M${f1(x + q)} ${f1(y)} H${f1(x + w - q)} A${f1(q)} ${f1(q)} 0 0 1 ${f1(x + w)} ${f1(y + q)} V${f1(y + h - q)} `
    + `A${f1(q)} ${f1(q)} 0 0 1 ${f1(x + w - q)} ${f1(y + h)} H${f1(x + q)} A${f1(q)} ${f1(q)} 0 0 1 ${f1(x)} ${f1(y + h - q)} `
    + `V${f1(y + q)} A${f1(q)} ${f1(q)} 0 0 1 ${f1(x + q)} ${f1(y)} Z`;
};
const ell = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f1(cx - rx)} ${f1(cy)} A${f1(rx)} ${f1(ry)} 0 1 0 ${f1(cx + rx)} ${f1(cy)} A${f1(rx)} ${f1(ry)} 0 1 0 ${f1(cx - rx)} ${f1(cy)} Z`;
const circ = (cx: number, cy: number, r: number) => ell(cx, cy, r, r);
/** a smooth curve through the given points (Catmull-Rom), as a dense polyline for `taper` */
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
const polyD = (pts: Pt[]) => `M${pts.map((q) => `${f1(q[0])} ${f1(q[1])}`).join(' L')}`;
const rotPt = (q: Pt, deg: number, o: Pt = [0, 0]): Pt => {
  const a = deg * Math.PI / 180, dx = q[0] - o[0], dy = q[1] - o[1];
  return [o[0] + dx * Math.cos(a) - dy * Math.sin(a), o[1] + dx * Math.sin(a) + dy * Math.cos(a)];
};

/** One drawn part. A filled shape, or a stroke when `stroke` is set. `ink` is its outline colour and
 * `o` scales the outline (thin members take a thinner line). */
type Part = {d: string; fill?: string; stroke?: string; w?: number; t?: string; ink: string; o?: number; op?: number};
/** THE SEAMLESS JOIN. Every part's outline first, then every fill, so where two parts meet the fill of
 * one covers the outline of the other and the pair reads as one form. */
const Pass: React.FC<{parts: Part[]; ow: number}> = ({parts, ow}) => <>
  {parts.map((q, i) => q.stroke
    ? <path key={`o${i}`} d={q.d} transform={q.t} fill="none" stroke={q.ink} strokeWidth={(q.w ?? 0) + ow * 2 * (q.o ?? 1)}
      strokeLinecap="round" strokeLinejoin="round" opacity={q.op} />
    : <path key={`o${i}`} d={q.d} transform={q.t} fill={q.ink} stroke={q.ink} strokeWidth={ow * 2 * (q.o ?? 1)} strokeLinejoin="round"
      opacity={q.op} />)}
  {parts.map((q, i) => q.stroke
    ? <path key={`f${i}`} d={q.d} transform={q.t} fill="none" stroke={q.stroke} strokeWidth={q.w} strokeLinecap="round"
      strokeLinejoin="round" />
    : <path key={`f${i}`} d={q.d} transform={q.t} fill={q.fill} />)}
</>;

/** a lit material, light at the upper left, the colour, shade toward violet at the lower right */
const Lit: React.FC<{id: string; c: string; x2?: number; y2?: number; a?: number; b?: number}> = ({id, c, x2 = 0.4, y2 = 1, a = 0.5, b = 0.36}) => (
  <linearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
    <stop offset="0%" stopColor={light(c, a)} /><stop offset="46%" stopColor={c} /><stop offset="100%" stopColor={shade(c, b)} />
  </linearGradient>
);
/** a lit cylinder seen side on, lit on the left, a sheen a quarter of the way across */
const Cyl: React.FC<{id: string; c: string; vertical?: boolean}> = ({id, c, vertical}) => (
  <linearGradient id={id} x1="0" y1="0" x2={vertical ? '0' : '1'} y2={vertical ? '1' : '0'}>
    <stop offset="0%" stopColor={light(c, 0.3)} /><stop offset="24%" stopColor={light(c, 0.55)} /><stop offset="55%" stopColor={c} />
    <stop offset="100%" stopColor={shade(c, 0.4)} />
  </linearGradient>
);

// ===================================================================================== MESQUITE

type Spray = {cx: number; cy: number; rx: number; ry: number; k: number};
/** one spray of mesquite leaves, a fountain of feathery bipinnate fronds fanned from a limb tip, arching
 * over and drooping, each frond a rib with fine leaflets either side and sky between the fronds */
const sprayFronds = (s: Spray, seed: number) => {
  const {cx, cy, rx, ry, k} = s;
  const out: {rib: string; leaves: string; up: number}[] = [];
  const add = (n: number, by: number, lift: number, len: number, droop: number, ch: number) => {
    for (let j = 0; j < n; j++) {
      const u = n === 1 ? 0.5 : j / (n - 1), sg = 2 * u - 1;
      const jit = (c: number) => hash(seed, k * 97 + ch * 31 + j * 5 + c) - 0.5;
      const b: Pt = [cx + sg * rx * 0.3 + jit(0) * 12, cy + by + Math.abs(sg) * ry * 0.1];
      let dx = sg * 1.0 + jit(1) * 0.3 + (Math.abs(sg) < 0.15 ? (j % 2 ? 0.35 : -0.35) : 0), dy = -(lift - Math.abs(sg) * lift * 0.8) + jit(2) * 0.15;
      const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
      const L = len * (0.85 + Math.abs(sg) * 0.4 + jit(3) * 0.25);
      const p1: Pt = [b[0] + dx * L * 0.5, b[1] + dy * L * 0.5];
      const p2: Pt = [p1[0] + dx * L * 0.42, p1[1] + dy * L * 0.12 + L * droop];
      const rib = smooth([b, [b[0] + dx * L * 0.2, b[1] + dy * L * 0.24], p1, p2], 4);
      // leaflets in pairs along the rib, angled toward the tip, longest at the middle of the frond
      let leaves = '';
      const NL = rib.length;
      for (let i = 2; i < NL - 1; i++) {
        const q = rib[i], r = rib[Math.min(NL - 1, i + 1)], v = i / (NL - 1);
        let tx = r[0] - q[0], ty = r[1] - q[1];
        const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
        const ll = 13 * Math.sin(Math.PI * (0.12 + v * 0.8));
        for (const sd of [-1, 1]) {
          const nx = -ty * sd, ny = tx * sd;
          leaves += `M${f1(q[0])} ${f1(q[1])} l${f1((nx * 0.75 + tx * 0.62) * ll)} ${f1((ny * 0.75 + ty * 0.62) * ll + 1.5)} `;
        }
      }
      out.push({rib: polyD(rib), leaves, up: -dy});
    }
  };
  add(Math.max(8, Math.round(rx / 11)), -ry * 0.1, 1.0, ry * 1.25, 0.5, 1);   // the crown, fronds rising and arching over
  add(Math.max(5, Math.round(rx / 18)), ry * 0.15, 0.2, ry * 1.1, 0.75, 2);    // the skirt, fronds reaching out and hanging
  return out;
};

/**
 * HONEY MESQUITE. Low, crooked, wide and lacy, the default tree of west and south Texas.
 *
 * What makes it a mesquite and not a generic tree, in the order the eye reads it.
 *  1. Several dark crooked stems that part near the ground and lean out, visible through the crown.
 *  2. A crown much wider than tall, built of separate sprays at the tips of long arching limbs, with
 *     sky between the sprays and between the leaves of each spray.
 *  3. Every spray a fountain of long feathery leaves that arch over and droop, bright yellow green.
 *  4. Long straw coloured bean pods hanging in bunches under the sprays.
 * `w` and `h` keep the library's meaning (the crown's proportions, true height stays 6 m). `pods`
 * hangs the beans. The sprays breathe in the wind and the pods swing.
 */
export const MesquiteV2: React.FC<KitV2Props & {w?: number; h?: number; pods?: boolean; leaf?: string}> = (p) => {
  const {seed = 9, frame = 0, w = 160, h = 96, pods = true, leaf = '#93bf3c'} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const t = frame / 30;
  const sx = (w / h) / (160 / 96);
  const mir = (p.facing ?? 1) * (seed % 2 ? 1 : -1);
  const X = (x: number) => x * sx * mir;
  const J = (ch: number, a: number) => (hash(seed, ch) - 0.5) * a;
  const bark = '#5d3a34', barkInk = line(bark);
  const back = mix(shade(leaf, 0.34), '#6f8fd0', 0.14);
  const lean = J(1, 5);
  const sway = Math.sin(t * 0.9 + seed) * 0.6;

  // the stems, from the ground up and out to the spray each one carries
  const stems: {pts: Pt[]; w0: number; w1: number}[] = [
    {pts: [[-10, 0], [-24, -70], [-20, -140], [-80, -212], [-180, -262], [-290, -296], [-385, -312]], w0: 34, w1: 8},
    {pts: [[-2, 0], [-8, -90], [-34, -180], [-70, -280], [-130, -372], [-215, -428]], w0: 30, w1: 7},
    {pts: [[6, 0], [14, -100], [44, -190], [34, -290], [58, -400], [26, -508]], w0: 30, w1: 7},
    {pts: [[12, 0], [30, -80], [88, -150], [180, -214], [290, -258], [400, -296]], w0: 32, w1: 8},
    // limbs off the stems
    {pts: [[38, -270], [100, -350], [170, -418], [226, -446]], w0: 15, w1: 5},
    {pts: [[-104, -330], [-90, -420], [-56, -488], [-24, -520]], w0: 13, w1: 5},
    {pts: [[-210, -276], [-300, -266], [-385, -248], [-450, -246]], w0: 12, w1: 4},
    {pts: [[230, -236], [320, -238], [400, -230], [460, -250]], w0: 12, w1: 4},
    {pts: [[160, -205], [210, -290], [270, -346], [330, -372]], w0: 11, w1: 4},
  ].map((s, i) => ({...s, pts: s.pts.map(([x, y], j) => [X(x + (j > 1 ? J(70 + i * 9 + j, 40) : 0)), y + (j > 1 ? J(90 + i * 9 + j, 30) : 0)] as Pt)}));
  const limbD = stems.map((s) => taper(smooth(s.pts, 6), 0, 0, (u) => s.w1 + (s.w0 - s.w1) * Math.pow(1 - u, 1.4) + (u < 0.06 ? (0.06 - u) * 110 : 0)));

  const sp = (k: number, cx: number, cy: number, rx: number, ry: number): Spray =>
    ({k, cx: X(cx + J(200 + k, 30)), cy: cy + J(220 + k, 20), rx: rx * sx * (0.9 + hash(seed, 240 + k) * 0.2), ry});
  const backSprays = [sp(20, -110, -470, 130, 66), sp(21, 140, -486, 130, 66), sp(22, -300, -360, 100, 56), sp(23, 300, -366, 110, 58),
    sp(24, 10, -410, 120, 62)];
  const front = [sp(1, -385, -318, 110, 60), sp(2, -212, -434, 120, 64), sp(3, 22, -526, 140, 68), sp(4, 228, -452, 126, 64),
    sp(5, 400, -304, 112, 60), sp(7, -462, -244, 66, 42), sp(8, -128, -338, 78, 48), sp(9, 120, -372, 80, 50), sp(10, 270, -262, 80, 46),
    sp(11, -270, -272, 80, 46)].filter((q) => q.k < 8 || hash(seed, 500 + q.k) > 0.3);
  const lift = (s: Spray) => ({dx: Math.sin(t * 1.3 + s.k * 1.7) * 5, dy: Math.cos(t * 1.1 + s.k) * 2.5});

  const grads = (list: Spray[], c: string, pre: string) => list.map((s) => (
    <linearGradient key={`${pre}${s.k}`} id={`${id}-${pre}${s.k}`} gradientUnits="userSpaceOnUse" x1={s.cx - s.rx * 0.5} y1={s.cy - s.ry * 1.1}
      x2={s.cx + s.rx * 0.3} y2={s.cy + s.ry * 1.1}>
      <stop offset="0%" stopColor={light(c, 0.55)} /><stop offset="40%" stopColor={c} /><stop offset="100%" stopColor={shade(c, 0.42)} />
    </linearGradient>
  ));
  // leaflet and rib widths in centimetres, and outlines that never swamp them on a far tree
  const lw = 5.5, rw = 4, lo = Math.min(ow * 0.55, lw * 0.26), ro = Math.min(ow * 0.6, rw * 0.4);
  const sprayGroup = (list: Spray[], c: string, pre: string, front: boolean) => {
    const all = list.map((s) => ({s, m: lift(s), fronds: sprayFronds(s, seed)}));
    const tr = (m: {dx: number; dy: number}) => `translate(${f1(m.dx)} ${f1(m.dy)})`;
    return <>
      {/* one outline under every frond of every spray, then the leaves, so a spray reads as one airy form */}
      {all.map(({s, m, fronds}) => <g key={`o${s.k}`} transform={tr(m)} stroke={line(c)} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx={s.cx} cy={s.cy + s.ry * 0.05} rx={s.rx * 0.38} ry={s.ry * 0.3} fill={line(c)} strokeWidth={ro * 2} />
        {fronds.map((q, i) => <g key={i}><path d={q.leaves} strokeWidth={lw + lo * 2} /><path d={q.rib} strokeWidth={rw + ro * 2} /></g>)}
      </g>)}
      {all.map(({s, m, fronds}) => <g key={`f${s.k}`} transform={tr(m)} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx={s.cx} cy={s.cy + s.ry * 0.05} rx={s.rx * 0.38} ry={s.ry * 0.3} fill={shade(c, 0.3)} />
        {fronds.map((q, i) => <g key={i}>
          <path d={q.leaves} stroke={`url(#${id}-${pre}${s.k})`} strokeWidth={lw} />
          <path d={q.rib} stroke={front ? light(c, 0.12 + q.up * 0.18) : c} strokeWidth={rw} />
        </g>)}
      </g>)}
    </>;
  };
  const pod = '#e3bb55';
  const podBunches = [front[0], front[2], front[4], front[1]].slice(0, pods ? 4 : 0).map((s, i) => {
    const m = lift(s);
    return {x: s.cx + s.rx * (i % 2 ? 0.28 : -0.2) + m.dx, y: s.cy + s.ry * 0.36 + m.dy, swing: Math.sin(t * 1.7 + i * 2.1) * 5, i};
  });

  return (
    <g transform={`translate(${p.x ?? 0} ${p.y ?? 0}) scale(${(p.scale ?? 1) * CM} ${(p.scale ?? 1) * CM}) rotate(${f1(lean)})`}>
      <defs>
        {grads(backSprays, back, 'k')}
        {grads(front, leaf, 's')}
        <linearGradient id={`${id}-b`} gradientUnits="userSpaceOnUse" x1={-300} y1={-400} x2={300} y2={0}>
          <stop offset="0%" stopColor={light(bark, 0.25)} /><stop offset="50%" stopColor={bark} /><stop offset="100%" stopColor={shade(bark, 0.35)} />
        </linearGradient>
      </defs>
      {/* the dappled shade a mesquite throws, then the tight shadow at the stems */}
      <ContactShadow x={0} y={6} w={1000 * sx} opacity={0.2} />
      <ContactShadow x={0} y={4} w={200} opacity={0.4} />
      <g transform={`rotate(${f1(sway)} 0 0)`}>
        {sprayGroup(backSprays, back, 'k', false)}
        {limbD.map((d, i) => <path key={`o${i}`} d={d} fill={barkInk} stroke={barkInk} strokeWidth={ow * 2} strokeLinejoin="round" />)}
        {limbD.map((d, i) => <path key={i} d={d} fill={`url(#${id}-b)`} />)}
        {stems.slice(0, 4).map((s, i) => <path key={`h${i}`} d={polyD(smooth(s.pts.slice(0, 4), 4).map(([x, y]) => [x - 7 * mir, y] as Pt))}
          stroke={light(bark, 0.45)} strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.55} />)}
        {sprayGroup(front, leaf, 's', true)}
        {podBunches.map((b) => <g key={b.i} transform={`translate(${f1(b.x)} ${f1(b.y)}) rotate(${f1(b.swing)})`}>
          {[-9, 7].map((dx, j) => {
            const len = 70 + hash(seed, 400 + b.i * 5 + j) * 24, cu = (j ? 1 : -1) * 6;
            const d = taper(smooth([[dx, -6], [dx + cu * 0.3, len * 0.5], [dx + cu, len * 0.85], [dx + cu * 0.4, len]], 5), 5, 4);
            return <g key={j}><path d={d} fill={line(pod)} stroke={line(pod)} strokeWidth={Math.min(ow * 0.9, 3)} strokeLinejoin="round" />
              <path d={d} fill={j ? light(pod, 0.25) : pod} /></g>;
          })}
        </g>)}
      </g>
    </g>
  );
};

// ================================================================================== PRICKLY PEAR

/** a pad, an obovate paddle, narrow where it joins and broad and round at the top */
const padD = (L: number, W: number) => `M0 2 C${f1(W * 0.3)} 2 ${f1(W * 0.56)} ${f1(-L * 0.34)} ${f1(W * 0.5)} ${f1(-L * 0.62)} `
  + `C${f1(W * 0.44)} ${f1(-L * 0.93)} ${f1(W * 0.18)} ${f1(-L)} 0 ${f1(-L)} C${f1(-W * 0.18)} ${f1(-L)} ${f1(-W * 0.44)} ${f1(-L * 0.93)} `
  + `${f1(-W * 0.5)} ${f1(-L * 0.62)} C${f1(-W * 0.56)} ${f1(-L * 0.34)} ${f1(-W * 0.3)} 2 0 2 Z`;

/**
 * PRICKLY PEAR. Paddles growing out of paddles, every new pad joined at the rim of the one below
 * (never floating), areoles with straw spines, and magenta tunas standing upright on the top rims.
 * `pads` keeps the library's count (6 by default, up to 9), `bloom` opens a yellow flower. True size
 * 1.2 m to the top pad. The upper pads rock a little in the wind and the flower nods.
 */
export const PricklyPearV2: React.FC<KitV2Props & {pads?: number; bloom?: boolean; fruit?: boolean}> = (p) => {
  const {seed = 10, frame = 0, pads = 6, bloom = false, fruit = true} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const t = frame / 30;
  const c = '#5fa64c';
  // [parent, where on the parent's rim (-1 left shoulder, 0 top, 1 right shoulder), angle off the parent, length]
  const plan: [number, number, number, number][] = [[-1, -8, -12, 40], [-1, 20, 26, 34], [0, -0.55, -20, 36], [0, 0.5, 16, 34],
    [2, 0.12, -4, 32], [3, 0.3, 24, 30], [1, 0.75, 36, 28], [4, 0.5, 18, 27], [2, -0.85, -46, 26]];
  const n = Math.max(3, Math.min(9, pads));
  type Pad = {x: number; y: number; a: number; L: number; W: number; depth: number; kids: number; i: number};
  const list: Pad[] = [];
  plan.slice(0, n).forEach(([par, u, da, L0], i) => {
    const L = L0 * (0.92 + hash(seed, i) * 0.16), W = L * 0.74;
    const rock = Math.sin(t * 1.2 + i) * 0.6;
    if (par < 0) { list.push({x: u, y: 0, a: da + (hash(seed, 20 + i) - 0.5) * 8, L, W, depth: 0, kids: 0, i}); return; }
    const q = list[par];
    // a point on the parent's upper rim, in the parent's frame, then into the world
    const lx = u * q.W * 0.42, ly = -q.L * (0.9 - Math.abs(u) * 0.22);
    const [wx, wy] = rotPt([lx, ly], q.a);
    q.kids++;
    list.push({x: q.x + wx, y: q.y + wy, a: q.a + da + rock * (q.depth + 1) + (hash(seed, 30 + i) - 0.5) * 8, L, W, depth: q.depth + 1, kids: 0, i});
  });
  const pt = (q: Pad, lx: number, ly: number): Pt => { const r = rotPt([lx, ly], q.a); return [q.x + r[0], q.y + r[1]]; };
  const order = [...list].sort((a, b) => a.depth - b.depth);
  const tunas = fruit ? list.filter((q) => q.kids === 0).flatMap((q) => [-0.42, 0.05, 0.4].slice(0, 2 + (q.i % 2)).map((u, k) => {
    const [bx, by] = pt(q, u * q.W * 0.4, -q.L * (0.94 - Math.abs(u) * 0.24));
    return {x: bx, y: by, a: q.a + u * 40, k: q.i * 3 + k};
  })) : [];
  const flower = bloom ? (() => { const q = list[list.length - 1]; const [bx, by] = pt(q, -q.W * 0.15, -q.L * 0.98); return {x: bx, y: by, a: q.a}; })() : null;
  const tuna = '#c2185b';
  return (
    <g transform={at(p)}>
      <defs>
        {order.map((q) => <radialGradient key={q.i} id={`${id}-p${q.i}`} cx="32%" cy="22%" r="90%">
          <stop offset="0%" stopColor={light(q.depth ? c : shade(c, 0.08), 0.42)} /><stop offset="55%" stopColor={q.depth ? c : shade(c, 0.08)} />
          <stop offset="100%" stopColor={shade(c, 0.4)} /></radialGradient>)}
        <radialGradient id={`${id}-t`} cx="35%" cy="30%" r="80%"><stop offset="0%" stopColor={light(tuna, 0.45)} />
          <stop offset="60%" stopColor={tuna} /><stop offset="100%" stopColor={shade(tuna, 0.35)} /></radialGradient>
      </defs>
      <ContactShadow x={8} y={3} w={150} opacity={0.36} />
      {/* outlines of every pad and tuna first, then the fills, so each join is seamless */}
      {order.map((q) => <path key={`o${q.i}`} d={padD(q.L, q.W)} transform={`translate(${f1(q.x)} ${f1(q.y)}) rotate(${f1(q.a)})`}
        fill={line(c)} stroke={line(c)} strokeWidth={ow * 2} strokeLinejoin="round" />)}
      {tunas.map((q) => <ellipse key={`to${q.k}`} cx={0} cy={-5} rx={5.4} ry={7.4} transform={`translate(${f1(q.x)} ${f1(q.y)}) rotate(${f1(q.a)})`}
        fill={line(tuna)} stroke={line(tuna)} strokeWidth={ow * 1.6} />)}
      {order.map((q) => <g key={q.i} transform={`translate(${f1(q.x)} ${f1(q.y)}) rotate(${f1(q.a)})`}>
        <path d={padD(q.L, q.W)} fill={`url(#${id}-p${q.i})`} />
        {/* the rim catches light on the upper left */}
        <path d={`M${f1(-q.W * 0.46)} ${f1(-q.L * 0.5)} C${f1(-q.W * 0.44)} ${f1(-q.L * 0.88)} ${f1(-q.W * 0.2)} ${f1(-q.L * 0.98)} 0 ${f1(-q.L * 0.98)}`}
          stroke={light(c, 0.6)} strokeWidth={ow * 0.9} fill="none" strokeLinecap="round" opacity={0.7} />
        {/* areoles on a diamond lattice, each with a tuft of straw spines */}
        {[[-0.22, 0.3], [0.2, 0.3], [0, 0.48], [-0.28, 0.62], [0.26, 0.62], [0, 0.78], [-0.14, 0.9], [0.16, 0.9]].map(([u, v], j) => {
          const ax = u * q.W, ay = -q.L * v * 0.95;
          return <g key={j}>
            <circle cx={ax} cy={ay} r={1.5} fill="#f4e7b0" />
            <path d={`M${f1(ax)} ${f1(ay)} l-2.6 -3.4 M${f1(ax)} ${f1(ay)} l3 -2.6`} stroke="#fff6cf" strokeWidth={0.9} strokeLinecap="round" />
          </g>;
        })}
      </g>)}
      {tunas.map((q) => <g key={`t${q.k}`} transform={`translate(${f1(q.x)} ${f1(q.y)}) rotate(${f1(q.a)})`}>
        <ellipse cx={0} cy={-5} rx={5.4} ry={7.4} fill={`url(#${id}-t)`} />
        <ellipse cx={-1.6} cy={-8} rx={1.6} ry={2.2} fill="#ffffff" opacity={0.5} />
        <path d="M-2.4 -11.6 h4.8" stroke={shade(tuna, 0.4)} strokeWidth={1.2} strokeLinecap="round" />
      </g>)}
      {flower && <g transform={`translate(${f1(flower.x)} ${f1(flower.y)}) rotate(${f1(flower.a + Math.sin(t * 1.6) * 6)})`}>
        {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx={0} cy={-9} rx={4.6} ry={7} transform={`rotate(${a} 0 -9) translate(0 -4)`}
          fill="#ffd23f" stroke={line('#ffd23f')} strokeWidth={ow * 0.8} />)}
        <circle cx={0} cy={-9} r={3.2} fill="#e9a21a" />
      </g>}
    </g>
  );
};

// ===================================================================================== PUMPJACK

type Mood = 'happy' | 'sleepy' | 'worried';
/**
 * PUMPJACK. The single most recognisable Texas industrial silhouette, now with an honest linkage.
 * The crank turns, the pitman arm keeps its length, and the walking beam takes its angle from it, so
 * the horsehead nods exactly as the crank drives it and the bridle and polished rod rise and fall
 * off the horsehead's arc. Every unit is at its own point in the stroke (from `seed` unless `phase`
 * is given). `abandoned` freezes it mid stroke, rusted, with sleepy eyes if it has a face. `depth`
 * pales it toward the horizon for a field. `mood` puts an eye on the horsehead for the rare film
 * where the pumpjack is the character (none by default). True size 6.5 m to the samson post's top.
 */
export const PumpjackV2: React.FC<KitV2Props & {rpm?: number; phase?: number; abandoned?: boolean; depth?: number; mood?: Mood}> = (p) => {
  const {seed = 1, frame = 0, rpm = 8, abandoned = false, depth = 0, wear = 0.35} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const haze = '#b9b4dc';
  const hz = (c: string) => mix(c, haze, depth * 0.75);
  const ph = p.phase ?? hash(seed, 1) * Math.PI * 2;
  const tc = abandoned ? ph : ph + (frame / 30) * (rpm / 60) * Math.PI * 2;
  const blue = hz(abandoned ? '#9a6a4c' : '#3d72a6'), head = hz(abandoned ? '#b98a5c' : '#f2a33a');
  const red = hz(abandoned ? '#8a5040' : '#d9483a'), gear = hz('#4c5878'), base = hz('#5f6886'), motor = hz('#5f9a52');
  const pad = hz('#cfc4b2');
  const P: Pt = [0, -650], G: Pt = [-470, -262], cr = 112, R = 610;
  const pin: Pt = [G[0] + Math.cos(tc) * cr, G[1] + Math.sin(tc) * cr];
  const th = Math.asin(Math.max(-0.5, Math.min(0.5, -(pin[1] - G[1]) / 470)));   // the beam angle the pitman demands
  const deg = th * 180 / Math.PI;
  const tail = rotPt([-460, 38], deg, [0, 0]);
  const tailW: Pt = [P[0] + tail[0], P[1] + tail[1]];
  const rodY = P[1] + R * th;                            // the bridle unwinds off the arc
  const beamT = `translate(${P[0]} ${P[1]}) rotate(${f1(deg)})`;
  const horse = `M470 -40 C492 -104 552 -122 ${f1(R * Math.cos(-0.17))} ${f1(R * Math.sin(-0.17))} A${R} ${R} 0 0 1 ${f1(R * Math.cos(0.38))} ${f1(R * Math.sin(0.38))} C528 236 486 200 470 70 Z`;
  const armAng = tc * 180 / Math.PI;
  const parts: Part[] = [
    {d: rr(-820, -36, 1260, 40, 20), fill: `url(#${id}-pad)`, ink: line(pad)},
    {d: rr(-780, -74, 1170, 44, 22), fill: `url(#${id}-base)`, ink: line(base)},
    // the samson post, a braced A frame
    {d: `M-170 -60 L-10 -640 M150 -60 L10 -640`, stroke: `url(#${id}-postS)`, w: 46, ink: line(blue)},
    {d: `M-120 -260 L110 -260`, stroke: blue, w: 22, ink: line(blue), o: 0.7},
    {d: rr(-560, -330, 180, 270, 40), fill: `url(#${id}-gear)`, ink: line(gear)},
    {d: rr(-760, -190, 150, 120, 30), fill: `url(#${id}-motor)`, ink: line(motor)},
    {d: `M-685 -130 L-470 -262`, stroke: shade(gear, 0.2), w: 18, ink: line(gear), o: 0.6},
  ];
  const beam: Part[] = [
    {d: rr(-500, -36, 1000, 72, 36), fill: `url(#${id}-beam)`, t: beamT, ink: line(blue)},
    {d: horse, fill: `url(#${id}-head)`, t: beamT, ink: line(head)},
    {d: circ(0, 0, 44), fill: light(blue, 0.3), t: beamT, ink: line(blue)},
  ];
  const pitman: Part[] = [{d: `M${f1(pin[0])} ${f1(pin[1])} L${f1(tailW[0])} ${f1(tailW[1])}`, stroke: `url(#${id}-pit)`, w: 36, ink: line(blue)}];
  const crankArm = taper([[G[0], G[1]], [pin[0], pin[1]]], 58, 34);
  // the counterweight, a fat rounded D riding the crank arm
  const cw = `M-10 -112 C80 -122 150 -70 150 0 C150 70 80 122 -10 112 C-40 86 -40 -86 -10 -112 Z`;
  const mood = p.mood ?? undefined;
  const t = frame / 30;
  const blink = (frame + seed * 17) % 100 < 4;
  const rusts = wear > 0.2 || abandoned ? [0, 1, 2, 3].map((i) => ({x: -700 + hash(seed, 50 + i) * 1100, y: -70 + hash(seed, 60 + i) * 30,
    r: 18 + hash(seed, 70 + i) * 26})) : [];
  return (
    <g transform={at(p)}>
      <defs>
        <Lit id={`${id}-pad`} c={pad} /><Lit id={`${id}-base`} c={base} /><Lit id={`${id}-gear`} c={gear} />
        <Lit id={`${id}-motor`} c={motor} /><Lit id={`${id}-beam`} c={blue} x2={0} /><Lit id={`${id}-head`} c={head} x2={0.6} />
        <radialGradient id={`${id}-cw`} cx="35%" cy="30%" r="80%"><stop offset="0%" stopColor={light(red, 0.45)} />
          <stop offset="60%" stopColor={red} /><stop offset="100%" stopColor={shade(red, 0.38)} /></radialGradient>
        <linearGradient id={`${id}-postS`} gradientUnits="userSpaceOnUse" x1={-170} y1={0} x2={150} y2={0}>
          <stop offset="0%" stopColor={light(blue, 0.35)} /><stop offset="100%" stopColor={shade(blue, 0.2)} /></linearGradient>
        <linearGradient id={`${id}-pit`} gradientUnits="userSpaceOnUse" x1={-600} y1={0} x2={-300} y2={0}>
          <stop offset="0%" stopColor={light(blue, 0.3)} /><stop offset="100%" stopColor={shade(blue, 0.15)} /></linearGradient>
      </defs>
      <ContactShadow x={-170} y={4} w={1500} opacity={0.34 * (1 - depth * 0.6)} />
      {/* the wellhead and the flow line off it */}
      <Pass ow={ow} parts={[
        {d: rr(R - 30, -150, 60, 150, 20), fill: hz('#9aa6bf'), ink: line(hz('#9aa6bf'))},
        {d: rr(R - 56, -110, 112, 30, 15), fill: hz('#c3cbdc'), ink: line(hz('#c3cbdc'))},
        {d: `M${R + 30} -50 L${R + 170} -50`, stroke: hz('#8d98b3'), w: 22, ink: line(hz('#8d98b3'))},
      ]} />
      <Pass ow={ow} parts={parts} />
      {/* the belt from the motor to the gearbox */}
      <path d={`M-690 -150 L-470 -300`} stroke={shade(gear, 0.4)} strokeWidth={8} strokeLinecap="round" />
      {rusts.map((r, i) => <ellipse key={i} cx={r.x} cy={r.y} rx={r.r} ry={r.r * 0.55} fill="#c06a32" opacity={0.25 + wear * 0.35} />)}
      <Pass ow={ow} parts={beam} />
      {/* the counterweights ride the crank, then the pitman arm up to the beam's tail */}
      <g transform={`translate(${f1(G[0])} ${f1(G[1])}) rotate(${f1(armAng)})`}>
        <path d={cw} fill={line(red)} stroke={line(red)} strokeWidth={ow * 2} strokeLinejoin="round" />
        <path d={cw} fill={`url(#${id}-cw)`} />
        <path d="M10 -86 C70 -92 120 -56 128 -10" stroke={light(red, 0.6)} strokeWidth={10} strokeLinecap="round" fill="none" opacity={0.55} />
      </g>
      <path d={crankArm} fill={line(red)} stroke={line(red)} strokeWidth={ow * 2} strokeLinejoin="round" />
      <path d={crankArm} fill={shade(red, 0.3)} />
      <Pass ow={ow} parts={pitman} />
      <circle cx={G[0]} cy={G[1]} r={30} fill={light(gear, 0.4)} stroke={line(gear)} strokeWidth={ow * 1.4} />
      <circle cx={pin[0]} cy={pin[1]} r={20} fill={light(blue, 0.5)} stroke={line(blue)} strokeWidth={ow * 1.2} />
      <circle cx={tailW[0]} cy={tailW[1]} r={22} fill={light(blue, 0.5)} stroke={line(blue)} strokeWidth={ow * 1.2} />
      {/* bridle off the arc, the carrier bar and the polished rod into the stuffing box */}
      <path d={`M${R - 8} ${f1(rodY - 40)} L${R - 8} ${f1(rodY + 250)} M${R + 14} ${f1(rodY - 40)} L${R + 14} ${f1(rodY + 250)}`}
        stroke={line(hz('#8d98b3'))} strokeWidth={7} strokeLinecap="round" />
      <path d={rr(R - 44, rodY + 244, 88, 26, 13)} fill={hz('#c3cbdc')} stroke={line(hz('#c3cbdc'))} strokeWidth={ow * 1.2} />
      <path d={`M${R + 3} ${f1(rodY + 270)} L${R + 3} -150`} stroke={light(hz('#c3cbdc'), 0.5)} strokeWidth={14} strokeLinecap="round" />
      <path d={`M${R + 3} ${f1(rodY + 270)} L${R + 3} -150`} stroke={line(hz('#c3cbdc'))} strokeWidth={3} strokeLinecap="round" opacity={0.5}
        transform="translate(5 0)" />
      {/* the sheen along the beam */}
      <path d="M-440 -18 L420 -18" transform={beamT} stroke={light(blue, 0.7)} strokeWidth={10} strokeLinecap="round" opacity={0.45} />
      <path d="M494 -70 C540 -100 580 -100 596 -96" transform={beamT} stroke={light(head, 0.7)} strokeWidth={12} strokeLinecap="round"
        fill="none" opacity={0.6} />
      {mood && <g transform={`${beamT} translate(540 30) rotate(${f1(-deg)})`}>
        {blink || abandoned || mood === 'sleepy'
          ? <path d="M-26 0 q26 16 52 0" stroke={line(head)} strokeWidth={ow * 1.4} fill="none" strokeLinecap="round" />
          : <><ellipse rx={26} ry={30} fill="#ffffff" stroke={line(head)} strokeWidth={ow * 1.1} />
            <circle cx={6 + Math.sin(t) * 3} cy={4} r={16} fill="#1f1736" /><circle cx={0} cy={-4} r={6} fill="#ffffff" /></>}
        <path d={mood === 'worried' ? 'M-30 -50 L26 -40' : 'M-30 -42 Q0 -56 30 -44'} stroke={shade(head, 0.5)} strokeWidth={ow * 1.2}
          strokeLinecap="round" fill="none" />
      </g>}
      {abandoned && <ellipse cx={-170} cy={-30} rx={700} ry={60} fill="#e8d6b0" opacity={0.25} />}
    </g>
  );
};

/**
 * A PUMPJACK FIELD, the composition the show is built on. The library's layout unit for unit (index
 * gives each its place, size, speed and wear, and one stands abandoned), with the far units paled
 * toward the horizon by colour rather than by fading, so they stay solid and read as distance.
 */
export const PumpjackFieldV2: React.FC<{frame: number; n?: number; y?: number; spread?: number; seed?: number}> = ({
  frame, n = 5, y = 0, spread = 1080, seed = 3,
}) => {
  const units = Array.from({length: n}, (_, i) => {
    const k = hash(seed, i);
    const depth = 0.42 + (i / n) * 0.5;
    return {i, k, depth, x: 40 + (i / Math.max(1, n - 1)) * spread + (k - 0.5) * 90, y: y - (1 - depth) * 120};
  }).sort((a, b) => a.depth - b.depth);
  return <g>{units.map((u) => <PumpjackV2 key={u.i} frame={frame} seed={seed * 13 + u.i * 7} x={u.x} y={u.y} scale={u.depth * 0.7}
    rpm={7 + u.k * 4} abandoned={u.i === Math.floor(n * 0.6)} wear={0.25 + u.k * 0.4} depth={(1 - u.depth) * 1.1} />)}</g>;
};

// ===================================================================================== WINDMILL

/**
 * THE FARM WINDMILL. A many bladed wheel facing the wind on a four legged lattice tower, a red tail
 * vane that swings, and the pump rod working up and down the middle of the tower to a spout that
 * drips into the trough. That rod is what tells a viewer it pumps water and is not a toy turbine.
 * `h` keeps the library's meaning (the true hub height stays 10 m), `wind` sets how fast it turns.
 */
export const WindmillV2: React.FC<KitV2Props & {h?: number; wind?: number; vane?: string}> = (p) => {
  const {seed = 6, frame = 0, wind = 1, vane = '#d8463c'} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const t = frame / 30;
  const spin = t * 44 * wind + hash(seed, 3) * 360;
  const swing = Math.sin(t * 0.73 + hash(seed, 4) * 6) * 7;
  const stroke = Math.sin(spin * Math.PI / 180) * 18;
  const steel = '#b7c4dc', steelD = shade(steel, 0.24), wood = '#a8754a';
  const H = 960, hub: Pt = [-40, -1010];
  const legs = (sd: number, k: number) => `M${sd * 150 * k} 0 L${sd * 26 * k} ${-H}`;
  const girts = [0.16, 0.36, 0.56, 0.76];
  const wAt = (u: number) => 150 - 124 * u;
  const tower: Part[] = [
    ...[-1, 1].map((sd) => ({d: legs(sd, 0.62), stroke: steelD, w: 11, ink: line(steel), o: 0.5} as Part)),
    ...girts.slice(0, -1).flatMap((u, i) => [-1, 1].map((sd) => ({d: `M${f1(sd * wAt(u))} ${f1(-H * u)} L${f1(-sd * wAt(girts[i + 1]))} ${f1(-H * girts[i + 1])}`,
      stroke: steel, w: 6, ink: line(steel), o: 0.45} as Part))),
    ...girts.map((u) => ({d: `M${f1(-wAt(u))} ${f1(-H * u)} L${f1(wAt(u))} ${f1(-H * u)}`, stroke: steel, w: 9, ink: line(steel), o: 0.55} as Part)),
    ...[-1, 1].map((sd) => ({d: legs(sd, 1), stroke: sd < 0 ? light(steel, 0.35) : steelD, w: 16, ink: line(steel), o: 0.8} as Part)),
    {d: rr(-110, -H - 26, 220, 30, 15), fill: `url(#${id}-wood)`, ink: line(wood)},
  ];
  const VANE = 'M200 -36 Q200 -46 212 -47 L398 -112 Q430 -120 432 -90 L432 86 Q430 112 400 102 L212 40 Q200 38 200 28 Z';
  const vaneT = `translate(30 -1010) rotate(${f1(swing * 0.4)}) scale(${f1(0.92 + Math.cos(t * 0.73) * 0.06)} 1)`;
  return (
    <g transform={at(p)}>
      <defs>
        <Lit id={`${id}-wood`} c={wood} x2={0} /><Lit id={`${id}-vane`} c={vane} x2={0.8} />
        <radialGradient id={`${id}-hub`} cx="35%" cy="30%" r="80%"><stop offset="0%" stopColor={light('#8d97b8', 0.5)} />
          <stop offset="100%" stopColor={shade('#8d97b8', 0.3)} /></radialGradient>
        <Lit id={`${id}-trough`} c="#9db0d0" x2={0} /><Cyl id={`${id}-pipe`} c="#a9b4d0" />
      </defs>
      <ContactShadow x={0} y={4} w={420} opacity={0.34} />
      {/* the pump rod, working with the wheel, down to the pump stand and its spout */}
      <path d={`M0 ${f1(-1000 + stroke)} L0 ${f1(-150 + stroke)}`} stroke={line(steel)} strokeWidth={10 + ow * 1.2} strokeLinecap="round" />
      <path d={`M0 ${f1(-1000 + stroke)} L0 ${f1(-150 + stroke)}`} stroke={light(steel, 0.4)} strokeWidth={10} strokeLinecap="round" />
      <Pass ow={ow} parts={tower} />
      <Pass ow={ow} parts={[
        {d: rr(-16, -190, 32, 190, 14), fill: `url(#${id}-pipe)`, ink: line('#9aa6c4')},
        {d: rr(-30, -206, 60, 30, 14), fill: '#b9c3db', ink: line('#9aa6c4')},
        {d: 'M10 -160 Q70 -168 86 -132', stroke: '#9aa6c4', w: 16, ink: line('#9aa6c4')},
        {d: rr(40, -96, 300, 96, 26), fill: `url(#${id}-trough)`, ink: line('#7d8fb3')},
      ]} />
      <ellipse cx={190} cy={-90} rx={140} ry={9} fill="#5fb3e0" />
      {[0.2, 0.4, 0.6, 0.8].map((q) => <path key={q} d={`M${40 + q * 300} -80 L${40 + q * 300} -10`} stroke={shade('#7d8fb3', 0.25)} strokeWidth={5} strokeLinecap="round" opacity={0.5} />)}
      {(() => { const q = (t * 1.2 + seed) % 1; return <ellipse cx={86} cy={-122 + q * 30} rx={6} ry={8} fill="#7fd0f5" opacity={1 - q * 0.6} />; })()}
      {/* the tail vane, swinging round into the wind */}
      <g transform={vaneT}>
        <path d="M0 0 L330 -10" stroke={line(steel)} strokeWidth={14 + ow * 1.6} strokeLinecap="round" />
        <path d="M0 0 L330 -10" stroke={steel} strokeWidth={14} strokeLinecap="round" />
        <path d={VANE} fill={line(vane)} stroke={line(vane)} strokeWidth={ow * 2} strokeLinejoin="round" />
        <path d={VANE} fill={`url(#${id}-vane)`} />
        <path d="M240 -40 L300 -38 L400 -76" stroke="#fff4e6" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.8} />
      </g>
      {/* the gear head */}
      <Pass ow={ow} parts={[{d: rr(-70, -1050, 150, 84, 36), fill: `url(#${id}-hub)`, ink: line('#8d97b8')}]} />
      {/* the wheel, eighteen sails between two rims, the shape that says windmill at any size */}
      <g transform={`translate(${hub[0]} ${hub[1]}) rotate(${f1(spin)})`}>
        {(() => {
          const sails = Array.from({length: 18}, () => `M-8 -50 L-25 -186 Q0 -196 25 -186 L8 -50 Q0 -46 -8 -50 Z`);
          return <>
            {sails.map((d, i) => <path key={`o${i}`} d={d} transform={`rotate(${i * 20})`} fill={line(steel)} stroke={line(steel)}
              strokeWidth={ow * 1.1} strokeLinejoin="round" />)}
            <circle r={126} fill="none" stroke={line(steel)} strokeWidth={8 + ow * 1.4} />
            <circle r={184} fill="none" stroke={line(steel)} strokeWidth={9 + ow * 1.4} />
            {sails.map((d, i) => <path key={i} d={d} transform={`rotate(${i * 20})`} fill={i % 2 ? '#f3f6fc' : '#d3dcec'} />)}
            {Array.from({length: 18}, (_, i) => <path key={`s${i}`} d="M-4 -60 L-11 -180" transform={`rotate(${i * 20})`}
              stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.55} />)}
            <circle r={126} fill="none" stroke={steel} strokeWidth={8} />
            <circle r={184} fill="none" stroke={steel} strokeWidth={9} />
            {[0, 60, 120, 180, 240, 300].map((a) => <path key={a} d="M0 -40 L0 -180" transform={`rotate(${a})`} stroke={steelD} strokeWidth={6}
              strokeLinecap="round" />)}
          </>;
        })()}
        <circle r={46} fill={line('#8d97b8')} /><circle r={46 - ow} fill={`url(#${id}-hub)`} />
      </g>
      <circle cx={hub[0] - 12} cy={hub[1] - 14} r={12} fill="#ffffff" opacity={0.6} />
    </g>
  );
};

// ================================================================================== WIND TURBINE

/**
 * A WIND TURBINE. A tall white tapering tower lit on its left, a rounded nacelle, a spinner and
 * three long airfoil blades that turn slowly (a fast turbine is a cartoon). `night` lights the red
 * aviation lamp that every unit on a Panhandle farm blinks in step. True hub height 100 m, blades
 * 46 m, `h` keeps the library's meaning (proportions only).
 */
export const WindTurbineV2: React.FC<KitV2Props & {h?: number; rpm?: number; night?: boolean}> = (p) => {
  const {seed = 5, frame = 0, rpm = 13, night = false} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const spin = (frame / 30) * (rpm / 60) * 360 + hash(seed, 2) * 120;
  const H = 10000, L = 4600, white = '#eef1f8';
  const chord = (u: number) => u < 0.12 ? 190 + (u / 0.12) * 230 : 420 * Math.pow(1 - (u - 0.12) / 0.88, 0.9) + 60 * ((u - 0.12) / 0.88);
  const blade = taper(Array.from({length: 24}, (_, i) => { const u = i / 23; return [chord(u) * 0.22, -260 - u * (L - 260)] as Pt; }),
    0, 0, (u) => chord(u));
  const on = Math.floor(frame / 15) % 2 === 0;
  return (
    <g transform={at(p)}>
      <defs>
        <Cyl id={`${id}-t`} c={white} />
        <Lit id={`${id}-n`} c={white} x2={0} />
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#ffffff" /><stop offset="55%" stopColor={white} />
          <stop offset="100%" stopColor={shade(white, 0.22)} /></linearGradient>
        <radialGradient id={`${id}-s`} cx="35%" cy="30%" r="80%"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor={shade(white, 0.26)} /></radialGradient>
      </defs>
      <ContactShadow x={0} y={20} w={1800} opacity={0.32} />
      <Pass ow={ow} parts={[
        {d: rr(-520, -90, 1040, 110, 50), fill: '#cfc8bb', ink: line('#cfc8bb')},
        {d: `M-250 -40 L-140 ${-H + 60} Q0 ${-H - 40} 140 ${-H + 60} L250 -40 Q0 -10 -250 -40 Z`, fill: `url(#${id}-t)`, ink: line(white)},
        {d: rr(-200, -H - 290, 1500, 520, 240), fill: `url(#${id}-n)`, ink: line(white)},
      ]} />
      <path d={`M1180 ${-H - 220} Q1250 ${-H - 30} 1180 ${-H + 170}`} stroke={shade(white, 0.15)} strokeWidth={30} fill="none" strokeLinecap="round" />
      <path d={`M-40 ${-H - 210} L1080 ${-H - 210}`} stroke="#ffffff" strokeWidth={60} strokeLinecap="round" opacity={0.8} />
      {night && <g>
        <circle cx={900} cy={-H - 340} r={on ? 420 : 0} fill="#ff4a32" opacity={0.25} />
        <circle cx={900} cy={-H - 340} r={80} fill={on ? '#ff4a32' : '#6a2418'} stroke={line('#ff4a32')} strokeWidth={ow * 1.2} />
      </g>}
      <g transform={`translate(0 ${-H}) rotate(${f1(spin)})`}>
        {[0, 120, 240].map((a) => <path key={`o${a}`} d={blade} transform={`rotate(${a})`} fill={line(white)} stroke={line(white)} strokeWidth={ow * 2}
          strokeLinejoin="round" />)}
        {[0, 120, 240].map((a) => <path key={a} d={blade} transform={`rotate(${a})`} fill={`url(#${id}-b)`} />)}
        {[0, 120, 240].map((a) => <path key={`h${a}`} d={`M-40 -500 L-10 ${-L * 0.7}`} transform={`rotate(${a})`} stroke="#ffffff"
          strokeWidth={60} strokeLinecap="round" opacity={0.7} />)}
      </g>
      <Pass ow={ow} parts={[{d: `M-160 ${-H - 230} Q-470 ${-H} -160 ${-H + 230} Z`, fill: `url(#${id}-s)`, ink: line(white)},
        {d: circ(-170, -H, 200), fill: `url(#${id}-s)`, ink: line(white)}]} />
    </g>
  );
};

// ================================================================================ LATTICE TOWER

/**
 * A LATTICE TRANSMISSION TOWER. Galvanised steel lit from the left, X bracing that tightens toward
 * the waist, two cross arms, and glass insulator strings hanging plumb that swing a touch in the
 * wind. The arm tips sit where the library's did (0.66 of the base width out, at 0.80 and 0.92 of
 * the height), so a `ConductorV2` strung between them lands on the insulators. True height 45 m.
 */
export const LatticeTowerV2: React.FC<KitV2Props & {h?: number}> = (p) => {
  const {frame = 0, seed = 1} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const H = 4500, W = H * 0.34, steel = '#bfcadb', glass = '#7fd0c4';
  const lx = (u: number) => (W / 2) * (1 - u * 0.72);
  const bands = 9;
  const parts: Part[] = [];
  for (let i = 0; i < bands; i++) {
    const t0 = i / bands, t1 = (i + 1) / bands;
    parts.push({d: `M${f1(-lx(t0))} ${f1(-H * t0)} L${f1(lx(t1))} ${f1(-H * t1)} M${f1(lx(t0))} ${f1(-H * t0)} L${f1(-lx(t1))} ${f1(-H * t1)}`,
      stroke: steel, w: 34, ink: line(steel), o: 0.45});
    parts.push({d: `M${f1(-lx(t1))} ${f1(-H * t1)} L${f1(lx(t1))} ${f1(-H * t1)}`, stroke: shade(steel, 0.08), w: 40, ink: line(steel), o: 0.5});
  }
  [0.8, 0.92].forEach((u) => parts.push({d: `M${f1(-W * 0.72)} ${f1(-H * u)} L${f1(W * 0.72)} ${f1(-H * u)} M${f1(-W * 0.72)} ${f1(-H * u)} `
    + `L${f1(-lx(u - 0.05))} ${f1(-H * (u - 0.05))} M${f1(W * 0.72)} ${f1(-H * u)} L${f1(lx(u - 0.05))} ${f1(-H * (u - 0.05))}`,
  stroke: steel, w: 70, ink: line(steel), o: 0.7}));
  parts.push({d: `M${f1(-W / 2)} 0 L${f1(-lx(1))} ${-H} L${f1(lx(1))} ${-H}`, stroke: `url(#${id}-l)`, w: 90, ink: line(steel), o: 0.8});
  parts.push({d: `M${f1(W / 2)} 0 L${f1(lx(1))} ${-H}`, stroke: shade(steel, 0.18), w: 90, ink: line(steel), o: 0.8});
  parts.push({d: `M${f1(-lx(1))} ${-H} L0 ${-H - 260} L${f1(lx(1))} ${-H}`, stroke: steel, w: 60, ink: line(steel), o: 0.7});
  return (
    <g transform={at(p)}>
      <defs>
        <linearGradient id={`${id}-l`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={0} y2={-H}>
          <stop offset="0%" stopColor={light(steel, 0.25)} /><stop offset="100%" stopColor={light(steel, 0.55)} /></linearGradient>
        <radialGradient id={`${id}-g`} cx="35%" cy="30%" r="80%"><stop offset="0%" stopColor={light(glass, 0.55)} />
          <stop offset="100%" stopColor={shade(glass, 0.3)} /></radialGradient>
      </defs>
      <ContactShadow x={0} y={20} w={W * 1.5} opacity={0.32} />
      <Pass ow={ow} parts={[-1, 1].map((sd) => ({d: rr(sd * W / 2 - 110, -60, 220, 90, 40), fill: '#cfc8bb', ink: line('#cfc8bb')}))} />
      <Pass ow={ow} parts={parts} />
      {[0.8, 0.92].flatMap((u) => [-1, 1].map((sd) => {
        const sw = Math.sin(frame / 30 * 0.9 + sd + u * 7 + seed) * 1.6;
        return <g key={`${u}${sd}`} transform={`translate(${f1(sd * W * 0.66)} ${f1(-H * u)}) rotate(${f1(sw)})`}>
          <path d="M0 0 L0 300" stroke={line(steel)} strokeWidth={18} strokeLinecap="round" />
          {[0, 1, 2, 3, 4].map((k) => <g key={k}>
            <ellipse cx={0} cy={70 + k * 48} rx={66 + ow} ry={20 + ow} fill={line(glass)} />
            <ellipse cx={0} cy={70 + k * 48} rx={66} ry={20} fill={`url(#${id}-g)`} />
            <ellipse cx={-22} cy={64 + k * 48} rx={20} ry={6} fill="#ffffff" opacity={0.6} />
          </g>)}
        </g>;
      }))}
    </g>
  );
};

/**
 * A CONDUCTOR between two towers, in screen units like the library's. It hangs in a curve (`sag` is
 * the drop at mid span as a fraction of the span, and never zero) and is drawn as a lit cable, a
 * deep line, the cable colour and a thin sheen on top. With `frame` it breathes a little in the wind.
 */
export const ConductorV2: React.FC<{x1: number; y1: number; x2: number; y2: number; sag?: number; w?: number; frame?: number;
  color?: string}> = ({x1, y1, x2, y2, sag = 0.09, w = 3.2, frame = 0, color = '#7d89a8'}) => {
  const mx = (x1 + x2) / 2;
  const drop = Math.abs(x2 - x1) * sag * (1 + Math.sin(frame / 30 * 0.8 + x1 * 0.01) * 0.04);
  const d = `M${f1(x1)} ${f1(y1)} Q${f1(mx)} ${f1((y1 + y2) / 2 + drop * 2)} ${f1(x2)} ${f1(y2)}`;
  return <g fill="none" strokeLinecap="round">
    <path d={d} stroke={line(color)} strokeWidth={w + 3} />
    <path d={d} stroke={color} strokeWidth={w} />
    <path d={d} stroke={light(color, 0.7)} strokeWidth={Math.max(0.8, w * 0.32)} transform={`translate(0 ${f1(-w * 0.25)})`} opacity={0.8} />
  </g>;
};

// =================================================================================== DATA CENTRE

/**
 * A DATA CENTRE. A low windowless slab on caliche, the one correction that makes the beat honest. Warm
 * tilt wall concrete with rounded panel joints, a parapet cap, a louvre bank (it is mostly air
 * handling and should look it), one human sized door, and rooftop chillers breathing heat shimmer.
 * Anchored at its left end like the library's. `w`, `h` and `units` keep their meanings and the true
 * height stays 12 m.
 */
export const DataCentreV2: React.FC<KitV2Props & {w?: number; h?: number; units?: number}> = (p) => {
  const {frame = 0, wear = 0.2, w = 620, h = 120, units = 7} = p;
  const id = useUid();
  const u = 1200 / h, ow = owOf(p.scale, u);
  const t = frame / 30;
  const wall = '#e6d6bd', unit = '#56688c', louvre = '#7f97c2', accent = '#22c3b0';
  const pitch = (w - 60) / units;
  return (
    <g transform={`${at(p, false)} scale(${u})`}>
      <defs>
        <Lit id={`${id}-w`} c={wall} x2={0.12} a={0.6} b={0.4} />
        <linearGradient id={`${id}-x`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#fff4dc" stopOpacity={0.35} />
          <stop offset="45%" stopColor="#fff4dc" stopOpacity={0} /><stop offset="100%" stopColor="#2b1d5e" stopOpacity={0.22} /></linearGradient><Lit id={`${id}-u`} c={unit} x2={0} /><Lit id={`${id}-l`} c={louvre} x2={0} />
        <linearGradient id={`${id}-d`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d9b98a" stopOpacity={0} />
          <stop offset="100%" stopColor="#c9a26e" stopOpacity={0.7} /></linearGradient>
      </defs>
      <ContactShadow x={w / 2} y={3} w={w * 1.12} opacity={0.32} />
      {/* rooftop chillers stand behind the parapet */}
      <Pass ow={ow} parts={Array.from({length: units}, (_, i) => ({d: rr(26 + i * pitch + pitch * 0.18, -h - 30, pitch * 0.64, 38, 9),
        fill: `url(#${id}-u)`, ink: line(unit)} as Part)).concat(Array.from({length: units * 2}, (_, j) => ({d: rr(26 + Math.floor(j / 2) * pitch
        + pitch * (0.26 + (j % 2) * 0.28), -h - 37, pitch * 0.2, 12, 6), fill: light(unit, 0.25), ink: line(unit)} as Part)))} />
      {Array.from({length: units}, (_, i) => <g key={i}>
        <path d={`M${f1(26 + i * pitch + pitch * 0.28)} ${-h - 24} h${f1(pitch * 0.44)}`} stroke={light(unit, 0.5)} strokeWidth={2.4} strokeLinecap="round" />
        {[0, 1].map((k) => {
          const q = (t * 0.6 + i * 0.37 + k * 0.5) % 1, x = 26 + i * pitch + pitch * (0.36 + k * 0.28);
          return <path key={k} d={`M${f1(x)} ${f1(-h - 42 - q * 30)} q5 -6 0 -12 q-5 -6 0 -12`} stroke={light(louvre, 0.4)} strokeWidth={3}
            fill="none" strokeLinecap="round" opacity={(1 - q) * 0.7} />;
        })}
      </g>)}
      <Pass ow={ow} parts={[
        {d: rr(0, -h, w, h + 2, 8), fill: `url(#${id}-w)`, ink: line(wall)},
        {d: rr(-4, -h - 7, w + 8, 12, 6), fill: light(wall, 0.4), ink: line(wall)},
        {d: rr(w * 0.6, -h + 22, w * 0.32, h - 44, 8), fill: `url(#${id}-l)`, ink: line(louvre)},
        {d: rr(w * 0.1, -50, 22, 50, 6), fill: '#4d5c7c', ink: line('#4d5c7c')},
      ]} />
      {Array.from({length: Math.floor(w / 74)}, (_, i) => (i + 1) * 74).filter((x) => x < w - 10 && (x < w * 0.6 - 4 || x > w * 0.92 + 4))
        .map((x) => <path key={x} d={`M${x} ${-h + 8} L${x} -4`} stroke={shade(wall, 0.22)} strokeWidth={2} strokeLinecap="round" />)}
      {Array.from({length: 7}, (_, i) => <path key={i} d={`M${f1(w * 0.6 + 8)} ${f1(-h + 32 + i * ((h - 64) / 6))} L${f1(w * 0.92 - 8)} ${f1(-h + 32 + i * ((h - 64) / 6))}`}
        stroke={shade(louvre, 0.4)} strokeWidth={3.6} strokeLinecap="round" />)}
      <rect x={1} y={-h + 1} width={w - 2} height={h} rx={8} fill={`url(#${id}-x)`} />
      <path d={`M10 ${-h + 16} L${f1(w - 10)} ${-h + 16}`} stroke={line(accent)} strokeWidth={7} strokeLinecap="round" />
      <path d={`M10 ${-h + 16} L${f1(w - 10)} ${-h + 16}`} stroke={accent} strokeWidth={4.4} strokeLinecap="round" />
      <path d={`M10 ${-h + 15} L${f1(w * 0.5)} ${-h + 15}`} stroke={light(accent, 0.7)} strokeWidth={1.4} strokeLinecap="round" />
      <path d={`M8 ${-h + 5} L${f1(w * 0.55)} ${-h + 5}`} stroke="#ffffff" strokeWidth={3} strokeLinecap="round" opacity={0.6} />
      {wear > 0.05 && <rect x={1} y={-h * 0.34} width={w - 2} height={h * 0.34} rx={6} fill={`url(#${id}-d)`} opacity={Math.min(1, wear * 2)} />}
      <path d={rr(w * 0.1 - 6, -58, 34, 7, 3.5)} fill={light(wall, 0.3)} stroke={line(wall)} strokeWidth={ow} />
      <circle cx={w * 0.1 + 11} cy={-48} r={3} fill="#fff1b8" />
      <circle cx={w * 0.1 + 11} cy={-44} r={14} fill="#fff1b8" opacity={0.35} />
      <circle cx={w * 0.1 + 28} cy={-30} r={2.4} fill={Math.floor(frame / 20) % 3 ? '#4cff9a' : '#1d6a44'} />
    </g>
  );
};

// =================================================================================== TRANSFORMER

/**
 * A SUBSTATION TRANSFORMER. A tank taller than it is wide (never a microchip), banks of tall vertical
 * radiator fins with a cooling fan turning on each, brown porcelain bushings on top, a small
 * conservator tank, a gauge whose needle trembles, and a yellow high voltage sign on the cabinet.
 * Sits on its chamfered concrete pad. The library's measure (4.5 m) and proportions.
 */
export const TransformerV2: React.FC<KitV2Props> = (p) => {
  const {frame = 0, wear = 0.4, seed = 4} = p;
  const id = useUid();
  const u = 450 / 104, ow = owOf(p.scale, u);
  const t = frame / 30;
  const paint = '#8ea6c2', porc = '#a8603e', pad = '#cdc4b2', sign = '#ffcf3a';
  const fan = (cx: number) => <g transform={`translate(${cx} -46)`}>
    <circle r={12.5} fill={line(paint)} /><circle r={11} fill={shade(paint, 0.45)} />
    <g transform={`rotate(${f1(t * 400 + cx * 3)})`}>{[0, 120, 240].map((a) => <ellipse key={a} cx={0} cy={-5.5} rx={3.4} ry={5.6}
      transform={`rotate(${a})`} fill={light(paint, 0.35)} />)}</g>
    <circle r={2.4} fill={light(paint, 0.6)} />
  </g>;
  const fins = (x0: number) => Array.from({length: 6}, (_, i) => ({d: rr(x0 + i * 4.2, -108, 3.4, 78, 1.7),
    fill: i < 3 ? light(paint, 0.15) : shade(paint, 0.08), ink: line(paint), o: 0.4} as Part));
  return (
    <g transform={`${at(p)} scale(${u})`}>
      <defs>
        <Lit id={`${id}-t`} c={paint} x2={0.5} /><Lit id={`${id}-pd`} c={pad} x2={0} /><Cyl id={`${id}-b`} c={porc} />
        <Cyl id={`${id}-c`} c={paint} vertical />
      </defs>
      <ContactShadow x={0} y={3} w={170} opacity={0.34} />
      <Pass ow={ow} parts={[{d: 'M-66 3 L66 3 Q70 3 67 -1 L60 -11 Q58 -13 54 -13 L-54 -13 Q-58 -13 -60 -11 L-67 -1 Q-70 3 -66 3 Z',
        fill: `url(#${id}-pd)`, ink: line(pad)}]} />
      {/* the conservator, behind the bushings on short legs */}
      <Pass ow={ow} parts={[{d: 'M-34 -124 L-34 -138 M-8 -124 L-8 -138', stroke: paint, w: 4, ink: line(paint), o: 0.6},
        {d: rr(-44, -152, 46, 18, 9), fill: `url(#${id}-c)`, ink: line(paint)}]} />
      <Pass ow={ow} parts={[
        {d: rr(-74, -114, 30, 8, 4), fill: paint, ink: line(paint)}, {d: rr(-74, -34, 30, 8, 4), fill: paint, ink: line(paint)},
        {d: rr(44, -114, 30, 8, 4), fill: paint, ink: line(paint)}, {d: rr(44, -34, 30, 8, 4), fill: paint, ink: line(paint)},
        ...fins(-72), ...fins(46),
        {d: rr(-46, -124, 92, 112, 10), fill: `url(#${id}-t)`, ink: line(paint)},
        {d: rr(-50, -130, 100, 10, 5), fill: light(paint, 0.3), ink: line(paint)},
      ]} />
      {fan(-58)}{fan(60)}
      {/* bushings, a porcelain stack of rounded sheds each, a silver cap on top */}
      {[-22, 2, 26].map((bx, i) => {
        const sheds = [0, 1, 2, 3].map((k) => ({d: ell(bx, -134 - k * 7, 8 - k * 0.6, 3.2), fill: `url(#${id}-b)`, ink: line(porc), o: 0.6} as Part));
        return <g key={bx}>
          <Pass ow={ow} parts={[{d: rr(bx - 4.5, -160, 9, 34, 4.5), fill: `url(#${id}-b)`, ink: line(porc), o: 0.6}, ...sheds,
            {d: rr(bx - 4, -166, 8, 8, 3), fill: '#dfe5f0', ink: line('#dfe5f0'), o: 0.6}]} />
          <path d={`M${bx - 2.5} -156 L${bx - 2.5} -130`} stroke={light(porc, 0.6)} strokeWidth={1.4} strokeLinecap="round" opacity={0.7} />
          {i === 1 && null}
        </g>;
      })}
      {/* cabinet door, handle, sign and gauge */}
      <Pass ow={ow} parts={[{d: rr(-28, -66, 56, 52, 6), fill: shade(paint, 0.06), ink: line(paint), o: 0.7}]} />
      <path d="M18 -44 L18 -34" stroke={light(paint, 0.6)} strokeWidth={2.6} strokeLinecap="round" />
      <Pass ow={ow} parts={[{d: rr(-14, -60, 22, 16, 4), fill: sign, ink: line(sign), o: 0.6}]} />
      <path d="M-2 -58 L-6 -52 L-2 -52 L-5 -46" stroke="#2b2440" strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Pass ow={ow} parts={[{d: circ(-30, -98, 7), fill: '#f6f2e8', ink: line(paint), o: 0.6}]} />
      <path d={`M-30 -98 L${f1(-30 + Math.cos(-2.2 + Math.sin(t * 9) * 0.06) * 5)} ${f1(-98 + Math.sin(-2.2 + Math.sin(t * 9) * 0.06) * 5)}`}
        stroke="#d9483a" strokeWidth={1.2} strokeLinecap="round" />
      <path d="M-38 -118 L-36 -30" stroke="#ffffff" strokeWidth={3} strokeLinecap="round" opacity={0.35} />
      {wear > 0.25 && [0, 1, 2].map((i) => <path key={i} d={`M${f1(-36 + hash(seed, i) * 70)} -112 q2 ${f1(14 + hash(seed, i + 9) * 18)} 0 ${f1(30 + hash(seed, i + 5) * 20)}`}
        stroke="#b8642e" strokeWidth={2.2} strokeLinecap="round" fill="none" opacity={wear * 0.6} />)}
    </g>
  );
};

// ==================================================================================== STOCK TANK

/**
 * AN EARTHEN STOCK TANK. A dug pond with a raised dirt bank, lit water that ripples and glints, grass
 * tufts on the rim. `drought` 0 to 1 drops the water, leaves the pale bathtub ring where it used to
 * reach and, past half, cracks the bed into rounded plates. The drawable image of a Texas water story.
 */
export const StockTankV2: React.FC<KitV2Props & {drought?: number}> = (p) => {
  const {seed = 7, frame = 0, drought = 0} = p;
  const id = useUid();
  const u = 120 / 30, ow = owOf(p.scale, u);
  const t = frame / 30;
  const dirt = '#c08a58', water = '#3f9ccc', mud = '#a98a62', grass = '#8fae48';
  const level = 1 - Math.max(0, Math.min(1, drought));
  const wrx = 102 * level + 6, wry = 24 * level + 2.5, wy = 2 + (1 - level) * 10;
  return (
    <g transform={`${at(p, false)} scale(${u})`}>
      <defs>
        <linearGradient id={`${id}-bank`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={light(dirt, 0.4)} />
          <stop offset="55%" stopColor={dirt} /><stop offset="100%" stopColor={shade(dirt, 0.3)} /></linearGradient>
        <linearGradient id={`${id}-in`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={light(dirt, 0.15)} />
          <stop offset="100%" stopColor={shade(dirt, 0.42)} /></linearGradient>
        <linearGradient id={`${id}-w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={light(water, 0.55)} />
          <stop offset="45%" stopColor={water} /><stop offset="100%" stopColor={shade(water, 0.3)} /></linearGradient>
        <clipPath id={`${id}-c`}><ellipse cx={0} cy={wy} rx={wrx} ry={wry} /></clipPath>
      </defs>
      <Pass ow={ow} parts={[{d: ell(0, 0, 122, 33), fill: `url(#${id}-bank)`, ink: line(dirt)}]} />
      <ellipse cx={0} cy={2} rx={110} ry={26} fill={`url(#${id}-in)`} />
      {drought > 0.15 && <ellipse cx={0} cy={3} rx={104} ry={24} fill="none" stroke="#efe2c2" strokeWidth={4} opacity={0.95} />}
      {drought > 0.15 && <ellipse cx={0} cy={6 + (1 - level) * 4} rx={98} ry={20} fill={mud} />}
      {drought > 0.5 && Array.from({length: 11}, (_, i) => {
        const a = hash(seed, 10 + i) * Math.PI * 2, r = 30 + hash(seed, 20 + i) * 58;
        const x = Math.cos(a) * r, y = 8 + Math.sin(a) * r * 0.18;
        return <path key={i} d={`M${f1(x)} ${f1(y)} q${f1((hash(seed, 30 + i) - 0.5) * 20)} ${f1(3)} ${f1((hash(seed, 40 + i) - 0.5) * 34)} ${f1((hash(seed, 50 + i) - 0.5) * 8)}`}
          stroke={shade(mud, 0.4)} strokeWidth={1.8} strokeLinecap="round" fill="none" />;
      })}
      {level > 0.05 && <>
        <ellipse cx={0} cy={wy} rx={wrx + ow * 0.8} ry={wry + ow * 0.8} fill={line(water)} />
        <ellipse cx={0} cy={wy} rx={wrx} ry={wry} fill={`url(#${id}-w)`} />
        <g clipPath={`url(#${id}-c)`}>
          {[0, 1, 2].map((k) => {
            const q = (t / 3 + k / 3) % 1;
            return <ellipse key={k} cx={-wrx * 0.2} cy={wy + 2} rx={8 + q * wrx * 0.7} ry={2 + q * wry * 0.6} fill="none" stroke="#ffffff"
              strokeWidth={1.4} opacity={(1 - q) * 0.6} />;
          })}
          <ellipse cx={-wrx * 0.35} cy={wy - wry * 0.5} rx={wrx * 0.4} ry={wry * 0.18} fill="#ffffff" opacity={0.3} />
          {[0, 1, 2].map((k) => {
            const tw = Math.max(0, Math.sin(t * 2.4 + k * 2.1));
            return <ellipse key={`g${k}`} cx={wrx * (0.1 + k * 0.22) - 10} cy={wy - wry * 0.2 + k * 3} rx={3 * tw} ry={1 * tw} fill="#ffffff" />;
          })}
        </g>
      </>}
      {/* the near bank lip, drawn over the water's edge so the pond sits inside its bank */}
      <path d="M-120 4 Q0 46 120 4 Q0 38 -120 4 Z" fill={light(dirt, 0.2)} />
      {[-96, -60, 52, 90, 20].map((x, i) => {
        const y = Math.sqrt(Math.max(0, 1 - (x / 122) ** 2)) * 33 * (i < 4 ? 1 : -1) - 2;
        const s = Math.sin(t * 1.4 + i) * 1.5;
        return <g key={i} transform={`translate(${x} ${f1(y)})`}>
          {[-5, 0, 5].map((dx, j) => <path key={j} d={taper([[dx * 0.4, 0], [dx + s, -10 - j * 2]], 3.4, 1.2)} fill={j === 1 ? light(grass, 0.2) : grass}
            stroke={line(grass)} strokeWidth={ow} paintOrder="stroke" />)}
        </g>;
      })}
    </g>
  );
};

// ================================================================================== CATTLE GUARD

/**
 * A CATTLE GUARD. Round steel pipes across the road over a dark pit, with daylight (pit dark) between
 * every pipe, because what stops a cow is seeing down between them. A concrete curb frames it in
 * perspective (the far edge narrower) and pipe rail wings angle up either side. A glint runs across
 * the pipes. `w` keeps the library's meaning, the deck at its true size.
 */
export const CattleGuardV2: React.FC<KitV2Props & {w?: number; paint?: string}> = (p) => {
  const {frame = 0, w = 220, paint = '#c9d2e2'} = p;
  const id = useUid();
  const u = 30 / 32, ow = owOf(p.scale, u);
  const conc = '#d6cbb6', pit = '#2f2547';
  const nf = 0.84;
  const pipes = 6;
  const road = '#dcc394';
  const glint = ((frame / 30) * 0.35) % 1.4 - 0.2;
  const rail = '#d9a43a';
  return (
    <g transform={`${at(p, false)} scale(${u})`}>
      <defs>
        <linearGradient id={`${id}-p`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={light(paint, 0.6)} />
          <stop offset="45%" stopColor={paint} /><stop offset="100%" stopColor={shade(paint, 0.4)} /></linearGradient>
        <Lit id={`${id}-c`} c={conc} x2={0} />
        <linearGradient id={`${id}-road`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={shade(road, 0.12)} />
          <stop offset="100%" stopColor={light(road, 0.2)} /></linearGradient>
        <linearGradient id={`${id}-pit`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={shade(pit, 0.3)} />
          <stop offset="100%" stopColor={pit} /></linearGradient>
      </defs>
      {/* the caliche road the guard sits flush in, receding to a narrower far edge */}
      <path d={`M${f1(-w / 2 - 70)} -26 L${f1(w / 2 + 70)} -26 Q${f1(w / 2 + 92)} -26 ${f1(w / 2 + 98)} 4 Q${f1(w / 2 + 102)} 24 ${f1(w / 2 + 84)} 24 `
        + `L${f1(-w / 2 - 84)} 24 Q${f1(-w / 2 - 102)} 24 ${f1(-w / 2 - 98)} 4 Q${f1(-w / 2 - 92)} -26 ${f1(-w / 2 - 70)} -26 Z`} fill={`url(#${id}-road)`} />
      <path d={`M${f1(-w / 2 - 70)} -18 L${f1(-w / 2 - 20)} -18 M${f1(w / 2 + 20)} 10 L${f1(w / 2 + 80)} 10`} stroke={light(road, 0.4)} strokeWidth={3}
        strokeLinecap="round" opacity={0.6} />
      {/* wing fences, pipe rails on rounded posts, angled out and up */}
      {[-1, 1].map((sd) => {
        const x0 = sd * (w / 2 + 10), x1 = sd * (w / 2 + 70);
        return <Pass key={sd} ow={ow * 0.7} parts={[
          {d: `M${x0} -2 L${x0} -70 M${x1} -22 L${x1} -82`, stroke: shade(rail, 0.12), w: 8, ink: line(rail)},
          {d: `M${x0} -64 L${x1} -78 M${x0} -38 L${x1} -54`, stroke: rail, w: 6, ink: line(rail)},
        ]} />;
      })}
      <Pass ow={ow * 0.8} parts={[{d: `M${f1(-w / 2 * nf - 9)} -23 L${f1(w / 2 * nf + 9)} -23 Q${f1(w / 2 * nf + 14)} -23 ${f1(w / 2 * nf + 15)} -19 `
        + `L${f1(w / 2 + 10)} 14 Q${f1(w / 2 + 11)} 19 ${f1(w / 2 + 5)} 19 L${f1(-w / 2 - 5)} 19 Q${f1(-w / 2 - 11)} 19 ${f1(-w / 2 - 10)} 14 `
        + `L${f1(-w / 2 * nf - 15)} -19 Q${f1(-w / 2 * nf - 14)} -23 ${f1(-w / 2 * nf - 9)} -23 Z`, fill: `url(#${id}-c)`, ink: line(conc)}]} />
      <path d={`M${f1(-w / 2 * nf)} -18 L${f1(w / 2 * nf)} -18 L${f1(w / 2)} 14 L${f1(-w / 2)} 14 Z`} fill={`url(#${id}-pit)`}
        stroke={shade(pit, 0.3)} strokeWidth={2} strokeLinejoin="round" />
      {Array.from({length: pipes}, (_, i) => {
        const q = i / (pipes - 1), y = -14.5 + q * 25, half = (w / 2) * (nf + (1 - nf) * q) - 4, r = 1.5 + q * 1.1;
        const gx = (glint * 2 - 1) * half;
        return <g key={i}>
          <rect x={-half - 2} y={y - r - 0.9} width={half * 2 + 4} height={r * 2 + 1.8} rx={r + 0.9} fill={line(paint)} />
          <rect x={-half} y={y - r} width={half * 2} height={r * 2} rx={r} fill={`url(#${id}-p)`} />
          <ellipse cx={gx} cy={y - r * 0.4} rx={10} ry={r * 0.45} fill="#ffffff" opacity={0.8} />
        </g>;
      })}
    </g>
  );
};

// =================================================================================== WATER TOWER

/**
 * A TOWN WATER TOWER. Four splayed legs with tie rods and struts, a central riser pipe, a round tank
 * with a bowl under the catwalk and a rounded cone roof, the town painted big across the tank and a
 * championship year under it. A red lamp blinks on the finial. `town`, `year`, `wear` and `h` keep
 * their meanings, `paint` sets the tank colour.
 */
export const WaterTowerV2: React.FC<KitV2Props & {town?: string; year?: string; h?: number; paint?: string; ink?: string}> = (p) => {
  const {frame = 0, wear = 0.3, seed = 8, town = '', year = '', paint = '#e4ecf7', ink = '#23407c'} = p;
  const id = useUid();
  const u = 4000 / 260, ow = owOf(p.scale, u);
  const legC = '#bcc8dc';
  const yb = -161, R = 54;                                   // the catwalk ring, the tank radius
  const leg = (x0: number, x1: number) => `M${x0} 0 L${x1} ${yb + 4}`;
  const levels = [-40, -80, -120];
  const xAt = (x0: number, x1: number, y: number) => x0 + (x1 - x0) * (y / (yb + 4));
  const on = Math.floor(frame / 24) % 2 === 0;
  const fs = town ? Math.min(19, 92 / Math.max(3, town.length * 0.62)) : 0;
  const parts: Part[] = [
    {d: leg(-14, -10), stroke: shade(legC, 0.2), w: 4.5, ink: line(legC), o: 0.6},
    {d: leg(16, 12), stroke: shade(legC, 0.2), w: 4.5, ink: line(legC), o: 0.6},
    ...levels.flatMap((y, i) => [
      {d: `M${f1(xAt(-36, -30, y))} ${y} L${f1(xAt(36, 30, y))} ${y}`, stroke: legC, w: 2.6, ink: line(legC), o: 0.4} as Part,
      {d: `M${f1(xAt(-36, -30, y))} ${y} L${f1(xAt(36, 30, levels[i + 1] ?? yb + 4))} ${levels[i + 1] ?? yb + 4} M${f1(xAt(36, 30, y))} ${y} `
        + `L${f1(xAt(-36, -30, levels[i + 1] ?? yb + 4))} ${levels[i + 1] ?? yb + 4}`, stroke: legC, w: 1.4, ink: line(legC), o: 0.3} as Part,
    ]),
    {d: `M0 0 L0 ${yb + 10}`, stroke: `url(#${id}-r)`, w: 9, ink: line(legC), o: 0.7},
    {d: leg(-36, -30), stroke: light(legC, 0.3), w: 6, ink: line(legC), o: 0.7},
    {d: leg(36, 30), stroke: shade(legC, 0.1), w: 6, ink: line(legC), o: 0.7},
  ];
  return (
    <g transform={`${at(p, false)} scale(${u})`}>
      <defs>
        <Cyl id={`${id}-t`} c={paint} />
        <linearGradient id={`${id}-r`} gradientUnits="userSpaceOnUse" x1={-5} y1={0} x2={5} y2={0}><stop offset="0%" stopColor={light(legC, 0.4)} />
          <stop offset="100%" stopColor={shade(legC, 0.25)} /></linearGradient>
        <linearGradient id={`${id}-roof`} x1="0" y1="0" x2="1" y2="0.6"><stop offset="0%" stopColor={light(paint, 0.6)} />
          <stop offset="55%" stopColor={paint} /><stop offset="100%" stopColor={shade(paint, 0.3)} /></linearGradient>
      </defs>
      <ContactShadow x={0} y={2} w={110} opacity={0.32} />
      <Pass ow={ow} parts={[-36, 36, -14, 16].map((x) => ({d: rr(x - 4, -3, 8, 5, 2.5), fill: '#cfc8bb', ink: line('#cfc8bb'), o: 0.5}))} />
      <Pass ow={ow} parts={parts} />
      {/* the tank, the bowl, the barrel, the roof and the finial, one outline under all of them */}
      <Pass ow={ow} parts={[
        {d: `M${-R} ${yb} Q${-R} ${yb + 22} 0 ${yb + 24} Q${R} ${yb + 22} ${R} ${yb} Z`, fill: `url(#${id}-t)`, ink: line(paint)},
        {d: rr(-R, yb - 34, R * 2, 36, 4), fill: `url(#${id}-t)`, ink: line(paint)},
        {d: `M${-R - 2} ${yb - 32} Q-30 ${yb - 52} -6 ${yb - 60} Q0 ${yb - 62} 6 ${yb - 60} Q30 ${yb - 52} ${R + 2} ${yb - 32} Z`,
          fill: `url(#${id}-roof)`, ink: line(paint)},
        {d: rr(-2.5, yb - 70, 5, 12, 2.5), fill: light(legC, 0.2), ink: line(legC), o: 0.6},
      ]} />
      {/* the catwalk ring and its rail */}
      <path d={`M${-R - 5} ${yb} Q0 ${yb + 9} ${R + 5} ${yb}`} stroke={line(legC)} strokeWidth={3.6 + ow * 1.2} fill="none" strokeLinecap="round" />
      <path d={`M${-R - 5} ${yb} Q0 ${yb + 9} ${R + 5} ${yb}`} stroke={legC} strokeWidth={3.6} fill="none" strokeLinecap="round" />
      <path d={`M${-R - 5} ${yb - 7} Q0 ${yb + 2} ${R + 5} ${yb - 7}`} stroke={line(legC)} strokeWidth={1.4} fill="none" strokeLinecap="round" />
      {[-0.9, -0.55, -0.18, 0.18, 0.55, 0.9].map((f) => <path key={f} d={`M${f1(f * (R + 5))} ${f1(yb - 7 + (1 - f * f) * 4.5)} l0 7`}
        stroke={line(legC)} strokeWidth={1.2} strokeLinecap="round" />)}
      <path d={`M${-R + 12} ${yb - 30} L${-R + 12} ${yb - 4}`} stroke="#ffffff" strokeWidth={5} strokeLinecap="round" opacity={0.55} />
      <path d={`M-34 ${yb - 40} Q-18 ${yb - 52} -4 ${yb - 56}`} stroke="#ffffff" strokeWidth={3.4} strokeLinecap="round" fill="none" opacity={0.6} />
      {town && <text x={0} y={yb - 16 + fs * 0.36} fontSize={fs} textAnchor="middle" fill={ink} fontFamily={FONT.body} fontWeight={800}
        letterSpacing={0.5}>{town}</text>}
      {year && <text x={0} y={yb + 13} fontSize={8.5} textAnchor="middle" fill="#c4562a" fontFamily={FONT.body} fontWeight={800}>{year}</text>}
      {wear > 0.2 && [0, 1, 2].map((i) => <path key={i} d={`M${f1(-36 + hash(seed, i) * 72)} ${yb + 4} q1 ${f1(6 + hash(seed, i + 4) * 6)} 0 ${f1(10 + hash(seed, i + 8) * 8)}`}
        stroke="#b8642e" strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={wear * 0.7} />)}
      <circle cx={0} cy={yb - 72} r={on ? 9 : 0} fill="#ff4a32" opacity={0.3} />
      <circle cx={0} cy={yb - 72} r={2.6} fill={on ? '#ff4a32' : '#6a2418'} />
    </g>
  );
};
