import React from 'react';
import {M} from '../lib/scale';
import {light, line, shade} from './color';
import {ContactShadow, useUid} from './Kit';
import type {Place} from './machines';

/**
 * COMMON ANIMALS AND PROPS, LOOK V2 (November 13th, 2026).
 *
 * The things a Texas film puts beside its people again and again: cattle, a feral hog, a white-tailed
 * deer, a ranch dog, a pickup, a windmill, a barn, a map pin and a document. Animals share one
 * four-legged rig (`Quad`), so a cow and a hog are drawn with the same shapes and the same face, at
 * their own real sizes. Every animal is gentle by default (a hog is a problem in the story, never a
 * monster on screen), breathes, blinks, flicks its tail and walks when `walk` is set.
 *
 * Placement is the library's (x, y at the ground, scale 1 true size, facing), through lib/scale.ts.
 */
const CM = M / 100;
const at = (p: Place) => `translate(${p.x ?? 0} ${p.y ?? 0}) scale(${(p.scale ?? 1) * CM * (p.facing ?? 1)} ${(p.scale ?? 1) * CM})`;
export type AnimalMood = 'calm' | 'happy' | 'alert' | 'worried';

type Pt = [number, number];
const f1 = (p: Pt) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
const lerpPt = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const densify = (pts: Pt[], k = 6): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) for (let j = 0; j < k; j++) out.push(lerpPt(pts[i], pts[i + 1], j / k));
  out.push(pts[pts.length - 1]);
  return out;
};
const quadPts = (a: Pt, c: Pt, b: Pt, n = 10): Pt[] => Array.from({length: n + 1}, (_, i) => {
  const t = i / n, u = 1 - t;
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]] as Pt;
});
/** A tapered limb along a polyline, round at both ends: legs, tails, horns and antler tines. */
export const taper = (pts: Pt[], w0: number, w1: number, wf?: (u: number) => number): string => {
  const n = pts.length, L: Pt[] = [], R: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const w = (wf ? wf(i / (n - 1)) : w0 + (w1 - w0) * i / (n - 1)) / 2;
    L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]); R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
  }
  return `M${f1(L[0])} ${L.slice(1).map((q) => 'L' + f1(q)).join(' ')} A${(w1 / 2).toFixed(1)} ${(w1 / 2).toFixed(1)} 0 0 0 ${f1(R[n - 1])} `
    + `${R.slice(0, -1).reverse().map((q) => 'L' + f1(q)).join(' ')} A${(w0 / 2).toFixed(1)} ${(w0 / 2).toFixed(1)} 0 0 0 ${f1(L[0])} Z`;
};
const ell = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
const rot = (p: Pt, deg: number): Pt => {
  const a = deg * Math.PI / 180;
  return [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
};

type Species = {
  B: number; H: number; D: number; hump: number; sag: number; legW: number; legW2: number;
  Lh: number; Hh: number; angle: number; poll: Pt; body: string; belly?: string; ears: 'flop' | 'up' | 'tall' | 'prick';
  tail: 'switch' | 'curl' | 'flag' | 'wag'; spots?: boolean; horns?: boolean; antlers?: boolean; nose: string; hoof: boolean;
};
// Centimetres, from the side: body length B, shoulder height H, body depth D, head length Lh and depth Hh,
// the poll (top of the head) relative to the withers, head angle in degrees nose down.
const SPECIES: Record<'cow' | 'longhorn' | 'hog' | 'deer' | 'dog', Species> = {
  cow: {B: 160, H: 136, D: 70, hump: 6, sag: 8, legW: 20, legW2: 12, Lh: 50, Hh: 30, angle: 42, poll: [22, 6],
    body: '#3b2a24', belly: '#4e3a32', ears: 'flop', tail: 'switch', nose: '#c99a98', hoof: true},
  longhorn: {B: 160, H: 136, D: 66, hump: 8, sag: 6, legW: 18, legW2: 11, Lh: 50, Hh: 28, angle: 42, poll: [22, 6],
    body: '#c4683a', belly: '#f3e6d4', ears: 'flop', tail: 'switch', spots: true, horns: true, nose: '#d9a39a', hoof: true},
  hog: {B: 118, H: 74, D: 48, hump: 12, sag: 4, legW: 16, legW2: 9, Lh: 44, Hh: 28, angle: 22, poll: [10, 12],
    body: '#4a3a3a', belly: '#5e4a48', ears: 'up', tail: 'curl', nose: '#c98a8a', hoof: true},
  deer: {B: 100, H: 98, D: 42, hump: 3, sag: 4, legW: 12, legW2: 5.5, Lh: 33, Hh: 18, angle: 50, poll: [24, -48],
    body: '#b47a4a', belly: '#f4e8d8', ears: 'tall', tail: 'flag', antlers: true, nose: '#2b2028', hoof: true},
  dog: {B: 60, H: 52, D: 25, hump: 0, sag: 2, legW: 9, legW2: 6, Lh: 26, Hh: 17, angle: 12, poll: [8, -14],
    body: '#c98a3a', belly: '#f6ead4', ears: 'prick', tail: 'wag', nose: '#2b2028', hoof: false},
};

type Shape = {d: string; fill: string; t?: string};
const Quad: React.FC<Place & {kind: keyof typeof SPECIES; mood?: AnimalMood; walk?: number; graze?: number; color?: string}> = (p) => {
  const {kind, mood = 'calm', walk, graze = 0, frame = 0, seed = 1} = p;
  const sp = SPECIES[kind];
  const id = useUid();
  const c = p.color ?? sp.body, cs = shade(c, 0.32), cd = shade(c, 0.5), cl = light(c, 0.32), ink = line(c);
  const ow = 3.4 / ((p.scale ?? 1) * CM);                      // about 6.8 film pixels of line at any scale
  const t = frame / 30;
  const {B, H, D, hump, Lh, Hh} = sp;
  const breath = Math.sin(t * 2 * Math.PI / 3.4 + seed) * D * 0.012;
  const top = -H + breath, x0 = -B / 2, x1 = B / 2, legLen = H - D;
  const blink = (frame + seed * 13) % 110 < 4;
  const ph = walk !== undefined ? walk * 2 * Math.PI * 1.3 : 0;
  const sw = (o: number) => walk !== undefined ? Math.sin(ph + o) * legLen * 0.28 : 0;
  // head carriage, lowered toward the grass by `graze`
  const g = Math.max(0, Math.min(1, graze));
  const px = x1 - D * 0.3 + sp.poll[0] + g * Lh * 0.3, py = top + sp.poll[1] + g * (H - Hh * 0.6 + sp.poll[1] * -1 - 6);
  const ang = sp.angle + g * (78 - sp.angle);
  const headT = `translate(${px} ${py}) rotate(${ang})`;
  const throat = rot([Lh * 0.3, Hh * 0.98], ang);
  // the main mass, outlined first and filled after, so no seam shows where parts join
  const body = `M${x0 + D * 0.3} ${top + 2} C${x0 + B * 0.3} ${top - 2} ${x1 - B * 0.35} ${top - hump} ${x1 - D * 0.35} ${top - hump}`
    + ` C${x1 + D * 0.12} ${top - hump} ${x1 + D * 0.22} ${top + D * 0.45} ${x1 - D * 0.08} ${top + D}`
    + ` Q0 ${top + D + sp.sag} ${x0 + D * 0.2} ${top + D * 0.92}`
    + ` C${x0 - D * 0.22} ${top + D * 0.8} ${x0 - D * 0.25} ${top + D * 0.15} ${x0 + D * 0.3} ${top + 2} Z`;
  const fx = x1 - D * 0.42, hx = x0 + D * 0.42;
  const limb = (top0: number, k: number) => (u: number) => u < 0.5 ? sp.legW * k + (sp.legW2 * 1.05 - sp.legW * k) * (u / 0.5) ** 0.8
    : sp.legW2 * (1.05 + 0.12 * Math.max(0, 1 - Math.abs(u - 0.53) / 0.06)) - (u - 0.5) * sp.legW2 * 0.2 + 0 * top0;
  const frontLeg = (x: number, s: number, gy = 0) => taper(densify([[x, top + D * 0.42], [x + 2 + s * 0.4, -legLen * 0.44 - gy],
    [x + s, -sp.legW2 * 0.6 - gy]], 8), 0, 0, limb(top, 1.25));
  const hindLeg = (x: number, s: number, gy = 0) => taper(densify([[x, top + D * 0.3], [x + legLen * 0.12 + s * 0.3, -legLen * 0.64 - gy],
    [x - legLen * 0.14 + s * 0.6, -legLen * 0.4 - gy], [x + 1 + s, -sp.legW2 * 0.6 - gy]], 6), 0, 0,
    (u) => u < 0.42 ? sp.legW * 1.6 + (sp.legW2 * 1.1 - sp.legW * 1.6) * (u / 0.42) : sp.legW2 * (1.1 - (u - 0.42) * 0.25));
  // the neck: a full curve over the crest and a concave throat, wide where it meets the shoulder
  const W: Pt = [x1 - D * 0.75, top - hump * 0.4], P: Pt = [px, py], T: Pt = [px + throat[0], py + throat[1]], C: Pt = [x1 - D * 0.02, top + D * 0.66];
  const nl = Math.hypot(P[0] - W[0], P[1] - W[1]) || 1, nx = (P[1] - W[1]) / nl, ny = -(P[0] - W[0]) / nl;
  const cTop: Pt = [(W[0] + P[0]) / 2 + nx * nl * 0.12, (W[1] + P[1]) / 2 + ny * nl * 0.12];
  const cBot: Pt = [(T[0] + C[0]) / 2 + nx * nl * 0.1, (T[1] + C[1]) / 2 + ny * nl * 0.1];
  const neck = `M${f1(W)} Q${f1(cTop)} ${f1(P)} L${f1(T)} Q${f1(cBot)} ${f1(C)} Z`;
  const cran = ell(Lh * 0.3, Hh * 0.46, Lh * 0.32, Hh * 0.56);
  const muz = kind === 'hog' ? taper([[Lh * 0.4, Hh * 0.5], [Lh * 1.0, Hh * 0.62]], Hh * 0.92, Hh * 0.66)
    : ell(Lh * 0.76, Hh * 0.56, Lh * 0.26, Hh * 0.4);
  const bridge = `M${Lh * 0.28} ${-Hh * 0.04} L${Lh * 0.78} ${Hh * 0.2} L${Lh * 0.78} ${Hh * 0.92} L${Lh * 0.28} ${Hh * 0.98} Z`;
  const mass: Shape[] = [
    {d: neck, fill: `url(#${id}-g)`},
    {d: body, fill: `url(#${id}-g)`},
    {d: ell(hx, top + D * 0.4, D * 0.36, D * 0.46), fill: `url(#${id}-g)`},
    {d: hindLeg(hx, sw(0)), fill: `url(#${id}-g)`},
    {d: frontLeg(fx, sw(Math.PI)), fill: `url(#${id}-g)`},
    {d: bridge, fill: c, t: headT}, {d: cran, fill: `url(#${id}-h)`, t: headT}, {d: muz, fill: kind === 'hog' ? sp.nose : light(c, 0.12), t: headT},
  ];
  const far: Shape[] = [{d: hindLeg(hx - B * 0.09, sw(Math.PI), 3), fill: cs}, {d: frontLeg(fx + B * 0.07, sw(0), 3), fill: cs}];
  const pass = (list: Shape[]) => <>
    {list.map((s, i) => <path key={`o${i}`} d={s.d} transform={s.t} fill={ink} stroke={ink} strokeWidth={ow * 2} strokeLinejoin="round" />)}
    {list.map((s, i) => <path key={`f${i}`} d={s.d} transform={s.t} fill={s.fill} />)}
  </>;
  const hooves = (list: [number, number, string][], gy = 0) => list.map(([x, s, col], i) => sp.hoof
    ? <rect key={i} x={x + s - sp.legW2 * 0.62} y={-sp.legW2 * 0.95 - gy} width={sp.legW2 * 1.24} height={sp.legW2 * 0.95} rx={sp.legW2 * 0.28} fill={col} />
    : <ellipse key={i} cx={x + s + 2} cy={-sp.legW2 * 0.35 - gy} rx={sp.legW2 * 0.75} ry={sp.legW2 * 0.42} fill={light(c, 0.45)} stroke={ink}
      strokeWidth={ow} />);
  const swing = Math.sin(t * 2 * Math.PI * (sp.tail === 'wag' ? 2.4 : 0.55) + seed);
  const brow = mood === 'worried' ? Hh * 0.08 : 0, browUp = mood === 'alert' ? Hh * 0.08 : 0;
  // eye and face, in head space
  const ex = Lh * 0.34, ey = Hh * 0.34, er = Math.max(Hh * 0.17, 3.2);
  return (
    <g transform={at(p)}>
      <defs>
        <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1={x0} y1={top - D * 0.4} x2={x1 * 0.4} y2={-legLen * 0.2}>
          <stop offset="0%" stopColor={cl} /><stop offset="45%" stopColor={c} /><stop offset="100%" stopColor={cs} /></linearGradient>
        <radialGradient id={`${id}-h`} cx="35%" cy="25%" r="85%"><stop offset="0%" stopColor={cl} /><stop offset="70%" stopColor={c} />
          <stop offset="100%" stopColor={cs} /></radialGradient>
        <clipPath id={`${id}-c`}><path d={body} /></clipPath>
      </defs>
      <ContactShadow x={0} y={2} w={B * 1.35} opacity={0.3} />
      {pass(far)}
      {hooves([[hx - B * 0.09, sw(Math.PI), cd], [fx + B * 0.07, sw(0), cd]], 3)}
      {/* the tail, behind the body */}
      {sp.tail === 'curl' && <path d={`M${x0 + 4} ${top + 8} q-14 -2 -14 -14 q0 -10 10 -7 q6 3 0 8`} stroke={ink} strokeWidth={ow * 2 + 3}
        fill="none" strokeLinecap="round" />}
      {sp.tail === 'curl' && <path d={`M${x0 + 4} ${top + 8} q-14 -2 -14 -14 q0 -10 10 -7 q6 3 0 8`} stroke={c} strokeWidth={3} fill="none"
        strokeLinecap="round" />}
      {sp.tail === 'switch' && <>
        <path d={taper(quadPts([x0 + 6, top + 6], [x0 - 10, top + H * 0.2], [x0 - 4 + swing * 8, top + H * 0.62], 8), 8, 4)} fill={c}
          stroke={ink} strokeWidth={ow * 2} strokeLinejoin="round" paintOrder="stroke" />
        <path d={taper([[x0 - 4 + swing * 8, top + H * 0.6], [x0 - 2 + swing * 10, top + H * 0.74]], 9, 6)} fill={cd} stroke={ink}
          strokeWidth={ow * 2} paintOrder="stroke" />
      </>}
      {sp.tail === 'flag' && <path d={taper(quadPts([x0 + 4, top + 6], [x0 - 10, top], [x0 - 12 + swing * 2, top - 12], 6), 12, 10)}
        fill="#ffffff" stroke={ink} strokeWidth={ow * 2} strokeLinejoin="round" paintOrder="stroke" />}
      {sp.tail === 'wag' && <path d={taper(quadPts([x0 + 4, top + 6], [x0 - 14, top + 2], [x0 - 18 + swing * 6, top - 16 + Math.abs(swing) * 3], 8), 8, 5)}
        fill={c} stroke={ink} strokeWidth={ow * 2} strokeLinejoin="round" paintOrder="stroke" />}
      {pass(mass)}
      {hooves([[hx, sw(0), '#2b2028'], [fx, sw(Math.PI), '#2b2028']])}
      {/* coat details inside the body line */}
      <g clipPath={`url(#${id}-c)`}>
        {sp.belly && <ellipse cx={x1 * 0.1} cy={top + D * 1.02} rx={B * 0.36} ry={D * 0.3} fill={sp.belly} opacity={0.9} />}
        {sp.spots && [[-0.28, 0.3, 0.26], [0.04, 0.12, 0.2], [0.28, 0.5, 0.17], [-0.05, 0.62, 0.14]].map(([sx, sy, r], i) =>
          <ellipse key={i} cx={sx * B} cy={top + sy * D} rx={r * D} ry={r * D * 0.78} fill={sp.belly} opacity={0.92} />)}
        <ellipse cx={-B * 0.08} cy={top + D * 0.12} rx={B * 0.3} ry={D * 0.1} fill="#ffffff" opacity={0.2} />
      </g>
      {kind === 'hog' && Array.from({length: 9}).map((_, i) => {
        const x = x0 + B * (0.2 + i * 0.08), y = top - hump * Math.sin((i / 8) * Math.PI * 0.9) + 2;
        return <path key={i} d={`M${x} ${y} l${-2} ${-7 - (i % 2) * 3}`} stroke={cd} strokeWidth={2.6} strokeLinecap="round" />;
      })}
      {/* ears, horns and antlers, world-aligned at the poll */}
      <g transform={`translate(${px} ${py})`}>
        {sp.horns && [[-1, '#e9dcc4'], [1, '#f6eedd']].map(([sd, col]) =>
          <path key={String(sd)} d={taper(quadPts([4, -2], [(sd as number) * 46, -4], [(sd as number) * 74, -34], 10), 11, 3)}
            fill={col as string} stroke={line('#e9dcc4')} strokeWidth={ow * 2} strokeLinejoin="round" paintOrder="stroke" />)}
        {sp.antlers && <g fill="#efe2c8" stroke={line('#e8d6b4')} strokeWidth={ow * 1.6} strokeLinejoin="round" paintOrder="stroke">
          <path d={taper(quadPts([0, -4], [-16, -30], [12, -46], 10), 6, 3.5)} />
          {[[0.35, -14], [0.6, -16], [0.85, -12]].map(([u, h], i) => {
            const q = quadPts([0, -4], [-16, -30], [12, -46], 10)[Math.round(u * 10)];
            return <path key={i} d={taper([q, [q[0] + 2, q[1] + h]], 4, 2.2)} />;
          })}
        </g>}
        {sp.ears === 'flop' && <path d={taper([[0, 4], [-15, 12]], 9, 7)} fill={cs} stroke={ink} strokeWidth={ow * 2} paintOrder="stroke" />}
        {sp.ears === 'tall' && <ellipse cx={-6} cy={-10} rx={5.5} ry={13} transform="rotate(-32 -6 -10)" fill={c} stroke={ink}
          strokeWidth={ow * 2} paintOrder="stroke" />}
        {sp.ears === 'tall' && <ellipse cx={-6} cy={-10} rx={2.6} ry={9} transform="rotate(-32 -6 -10)" fill="#f6dccb" />}
        {sp.ears === 'up' && <path d="M-4 4 L4 -16 L12 2 Z" fill={c} stroke={ink} strokeWidth={ow * 2} strokeLinejoin="round" paintOrder="stroke" />}
        {sp.ears === 'prick' && <path d="M-3 3 L0.5 -9 L6.5 1.5 Z" fill={c} stroke={ink} strokeWidth={ow * 2} strokeLinejoin="round" paintOrder="stroke" />}
        {sp.ears === 'prick' && <path d="M-0.6 0.8 L1 -5.4 L3.8 0.8 Z" fill="#f2b8a8" />}
      </g>
      {/* the face */}
      <g transform={headT}>
        {kind === 'cow' || kind === 'longhorn' ? <ellipse cx={Lh * 0.95} cy={Hh * 0.62} rx={Lh * 0.1} ry={Hh * 0.3} fill={sp.nose} /> : null}
        {kind === 'hog' && <><ellipse cx={Lh * 1.02} cy={Hh * 0.62} rx={Hh * 0.13} ry={Hh * 0.32} fill={light(sp.nose, 0.15)} stroke={ink}
          strokeWidth={ow * 0.9} />
          <circle cx={Lh * 1.03} cy={Hh * 0.52} r={1.6} fill="#5a2a2a" /><circle cx={Lh * 1.03} cy={Hh * 0.72} r={1.6} fill="#5a2a2a" />
          <path d={`M${Lh * 0.78} ${Hh * 0.88} q4 -2 4 -9`} stroke="#fff4dc" strokeWidth={2.6} strokeLinecap="round" fill="none" /></>}
        {(kind === 'deer' || kind === 'dog') && <ellipse cx={Lh * 0.99} cy={Hh * 0.5} rx={Lh * 0.09} ry={Hh * 0.17} fill={sp.nose} />}
        {kind === 'deer' && <ellipse cx={Lh * 0.82} cy={Hh * 0.82} rx={Lh * 0.12} ry={Hh * 0.12} fill="#f4e8d8" />}
        {kind === 'dog' && <ellipse cx={Lh * 0.62} cy={Hh * 0.7} rx={Lh * 0.22} ry={Hh * 0.22} fill="#f6ead4" />}
        {mood === 'happy' && <path d={`M${Lh * 0.7} ${Hh * 0.86} q${Lh * 0.12} ${Hh * 0.12} ${Lh * 0.24} -${Hh * 0.02}`} stroke={ink}
          strokeWidth={ow * 0.9} fill="none" strokeLinecap="round" />}
        {kind === 'dog' && mood === 'happy' && <ellipse cx={Lh * 0.8} cy={Hh * 1.02} rx={2.4} ry={4} fill="#ff7a9a" />}
        {/* counter-rotate so the eye reads level */}
        <g transform={`translate(${ex} ${ey}) rotate(${-ang})`}>
          {kind === 'deer' && <ellipse cx={0} cy={0} rx={er * 1.45} ry={er * 1.3} fill="#f4e8d8" />}
          {blink ? <path d={`M${-er} 0 q${er} ${er * 0.6} ${er * 2} 0`} stroke={ink} strokeWidth={ow * 0.9} fill="none" strokeLinecap="round" />
            : <><ellipse cx={0} cy={0} rx={er} ry={er * 1.08} fill="#ffffff" stroke={ink} strokeWidth={ow * 0.7} />
              <circle cx={er * 0.22} cy={er * 0.1} r={er * 0.66} fill="#1f1736" />
              <circle cx={-er * 0.06} cy={-er * 0.24} r={er * 0.24} fill="#ffffff" /></>}
          <path d={`M${-er * 1.1} ${-er * 1.45 + brow - browUp} L${er * 1.1} ${-er * 1.45 - brow - browUp}`} stroke={cd} strokeWidth={ow * 0.8} strokeLinecap="round" />
          <circle cx={-er * 0.6} cy={er * 1.7} r={er * 0.6} fill="#ff6b8a" opacity={0.22} />
        </g>
      </g>
    </g>
  );
};

export const CowV2: React.FC<Place & {mood?: AnimalMood; walk?: number; graze?: number; longhorn?: boolean; color?: string}> = ({longhorn, ...p}) =>
  <Quad {...p} kind={longhorn ? 'longhorn' : 'cow'} />;
export const HogV2: React.FC<Place & {mood?: AnimalMood; walk?: number; graze?: number}> = (p) => <Quad {...p} kind="hog" />;
export const DeerV2: React.FC<Place & {mood?: AnimalMood; walk?: number; graze?: number}> = (p) => <Quad {...p} kind="deer" />;
export const DogV2: React.FC<Place & {mood?: AnimalMood; walk?: number; color?: string}> = (p) => <Quad {...p} kind="dog" />;

// ---------------------------------------------------------------------------------- props

/** THE PICKUP: the default vehicle in almost any Texas shot, round and lit, a toolbox across the bed */
export const PickupV2: React.FC<Place & {paint?: string; speed?: number; dog?: boolean}> = (p) => {
  const {frame = 0, paint = '#d64545', speed = 0, dog = false} = p;
  const id = useUid();
  const spin = frame * speed * 16;
  const wheel = (cx: number) => <g transform={`translate(${cx} -40)`}>
    <circle r={42} fill="#24213a" /><circle r={25} fill="#d9dde8" />
    <g transform={`rotate(${spin})`}>{[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={Math.cos(a * Math.PI / 180) * 14}
      cy={Math.sin(a * Math.PI / 180) * 14} r={3.5} fill="#7a7f99" />)}</g></g>;
  return (
    <g transform={at(p)}>
      <defs><linearGradient id={`${id}-p`} x1="0" y1="0" x2="0.3" y2="1"><stop offset="0%" stopColor={light(paint, 0.45)} />
        <stop offset="50%" stopColor={paint} /><stop offset="100%" stopColor={shade(paint, 0.38)} /></linearGradient></defs>
      <ContactShadow x={0} y={4} w={640} opacity={0.32} />
      <path d="M-290 -60 L-290 -110 Q-290 -124 -276 -124 L-30 -124 L-20 -186 Q-14 -200 4 -200 L130 -200 Q160 -200 176 -176 L214 -124
        L270 -118 Q296 -114 296 -86 L296 -60 Q296 -44 280 -44 L-276 -44 Q-290 -44 -290 -60 Z" fill={`url(#${id}-p)`} stroke={line(paint)}
        strokeWidth={7} strokeLinejoin="round" />
      {/* wheel arches, door seams, a crew cab's two windows, mirror, chrome bumpers and lamps */}
      {[-180, 190].map((cx) => <path key={cx} d={`M${cx - 62} -44 A62 62 0 0 1 ${cx + 62} -44 Z`} fill={shade(paint, 0.55)} />)}
      <path d="M-6 -188 L58 -188 L58 -132 L-6 -132 Z" fill="#1d2150" />
      <path d="M68 -188 L124 -188 Q146 -188 158 -170 L184 -132 L68 -132 Z" fill="#1d2150" />
      <path d="M-14 -126 L-14 -56 M62 -126 L62 -56 M190 -122 L190 -60" stroke={shade(paint, 0.4)} strokeWidth={4} strokeLinecap="round" />
      <rect x={16} y={-112} width={26} height={8} rx={4} fill={shade(paint, 0.45)} /><rect x={92} y={-112} width={26} height={8} rx={4}
        fill={shade(paint, 0.45)} />
      <path d="M176 -150 q16 -4 18 10 l-14 6 Z" fill={shade(paint, 0.25)} stroke={line(paint)} strokeWidth={4} strokeLinejoin="round" />
      <rect x={262} y={-70} width={44} height={22} rx={10} fill="#d9dde8" stroke={line('#d9dde8')} strokeWidth={4} />
      <rect x={-306} y={-70} width={40} height={22} rx={10} fill="#d9dde8" stroke={line('#d9dde8')} strokeWidth={4} />
      <rect x={-296} y={-112} width={12} height={26} rx={6} fill="#ff5a5a" />
      <path d="M12 -180 L60 -180" stroke="#ffffff" strokeWidth={8} strokeLinecap="round" opacity={0.4} />
      <rect x={-250} y={-150} width={200} height={30} rx={10} fill="#c9cfdf" stroke={line('#c9cfdf')} strokeWidth={5} />
      <path d="M-270 -114 Q-100 -122 260 -110" stroke="#ffffff" strokeWidth={8} strokeLinecap="round" opacity={0.45} fill="none" />
      <ellipse cx={288} cy={-96} rx={8} ry={12} fill="#fff6c8" />
      {dog && <g transform="translate(-170 -150) scale(0.55)">
        <ellipse cx={0} cy={-30} rx={40} ry={34} fill="#c98a3a" stroke={line('#c98a3a')} strokeWidth={6} />
        <ellipse cx={30} cy={-24} rx={18} ry={14} fill="#e0b070" /><circle cx={10} cy={-42} r={7} fill="#1f1736" />
        <ellipse cx={-22} cy={-52} rx={18} ry={9} fill="#8a5a24" transform="rotate(-30 -22 -52)" /></g>}
      {wheel(-180)}{wheel(190)}
    </g>
  );
};

/** THE WINDMILL: an Aermotor-style water pumper on a lattice tower, the wheel turning into the wind */
export const WindmillV2: React.FC<Place & {wind?: number}> = (p) => {
  const {frame = 0, wind = 0.6} = p;
  const steel = '#cfd6e6', a = frame * wind * 4;
  return (
    <g transform={at(p)}>
      <ContactShadow x={0} y={4} w={420} opacity={0.3} />
      {[-1, 1].map((sd) => <path key={sd} d={`M${sd * 150} 0 L${sd * 24} -900`} stroke={line(steel)} strokeWidth={22} strokeLinecap="round" />)}
      {[-1, 1].map((sd) => <path key={`i${sd}`} d={`M${sd * 150} 0 L${sd * 24} -900`} stroke={sd < 0 ? light(steel, 0.2) : shade(steel, 0.15)}
        strokeWidth={14} strokeLinecap="round" />)}
      {[0.2, 0.45, 0.7].map((t) => <path key={t} d={`M${-150 + 126 * t} ${-900 * t} L${150 - 126 * t} ${-900 * t}`} stroke={steel}
        strokeWidth={9} strokeLinecap="round" />)}
      <rect x={-60} y={-940} width={120} height={50} rx={20} fill="#9aa3bd" />
      <path d="M40 -916 L300 -916 L320 -880 L300 -950 Z" fill="#d64545" stroke={line('#d64545')} strokeWidth={5} strokeLinejoin="round" />
      <g transform={`translate(-40 -916) rotate(${a})`}>
        {Array.from({length: 18}).map((_, i) => <path key={i} transform={`rotate(${i * 20})`} d="M0 -40 L-14 -200 L14 -200 Z" fill={i % 2 ? '#eef1f8' : '#d9dde8'}
          stroke="#9aa3bd" strokeWidth={3} strokeLinejoin="round" />)}
        <circle r={210} fill="none" stroke="#9aa3bd" strokeWidth={6} />
        <circle r={42} fill="#7a7f99" />
      </g>
    </g>
  );
};

/** A BARN: a gambrel red barn with white trim and a hay door, the classic farm silhouette */
export const BarnV2: React.FC<Place & {paint?: string}> = (p) => {
  const {paint = '#c2453a'} = p;
  const id = useUid();
  return (
    <g transform={at(p)}>
      <defs><linearGradient id={`${id}-w`} x1="0" y1="0" x2="1" y2="0.3"><stop offset="0%" stopColor={light(paint, 0.3)} />
        <stop offset="55%" stopColor={paint} /><stop offset="100%" stopColor={shade(paint, 0.35)} /></linearGradient></defs>
      <ContactShadow x={0} y={4} w={1500} opacity={0.3} />
      <path d="M-560 0 L-560 -380 L-420 -620 L0 -760 L420 -620 L560 -380 L560 0 Z" fill={`url(#${id}-w)`} stroke={line(paint)} strokeWidth={10}
        strokeLinejoin="round" />
      <path d="M-600 -370 L-430 -650 L0 -800 L430 -650 L600 -370" stroke="#5a4a4a" strokeWidth={46} strokeLinejoin="round" strokeLinecap="round" fill="none" />
      <path d="M-560 -370 L560 -370" stroke="#fff4e6" strokeWidth={16} />
      <rect x={-200} y={-320} width={400} height={320} rx={18} fill={shade(paint, 0.2)} stroke="#fff4e6" strokeWidth={14} />
      <path d="M-200 -320 L200 0 M200 -320 L-200 0" stroke="#fff4e6" strokeWidth={12} />
      <rect x={-90} y={-600} width={180} height={150} rx={14} fill="#3a2a2a" stroke="#fff4e6" strokeWidth={12} />
      <path d="M-520 -400 L-400 -610" stroke={light(paint, 0.5)} strokeWidth={14} strokeLinecap="round" opacity={0.5} />
    </g>
  );
};

/** A MAP PIN that drops in and bounces: `p` 0 to 1 is its arrival. Screen units, not to scale. */
export const MapPinV2: React.FC<{x: number; y: number; s?: number; p?: number; color?: string; label?: string}> = ({
  x, y, s = 1, p = 1, color = '#ff4d6d', label,
}) => {
  const id = useUid();
  const q = Math.max(0, Math.min(1, p));
  const drop = (1 - q) * -300, squash = q > 0.85 ? 1 + Math.sin((q - 0.85) / 0.15 * Math.PI) * 0.12 : 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs><radialGradient id={`${id}-g`} cx="35%" cy="30%" r="80%"><stop offset="0%" stopColor={light(color, 0.5)} />
        <stop offset="60%" stopColor={color} /><stop offset="100%" stopColor={shade(color, 0.4)} /></radialGradient></defs>
      <ellipse cx={0} cy={4} rx={34 * q} ry={10 * q} fill="#1a1236" opacity={0.3} />
      <g transform={`translate(0 ${drop}) scale(${1 / squash} ${squash})`}>
        <path d="M0 0 C-14 -30 -52 -60 -52 -100 A52 52 0 1 1 52 -100 C52 -60 14 -30 0 0 Z" fill={`url(#${id}-g)`} stroke={line(color)}
          strokeWidth={6} strokeLinejoin="round" />
        <circle cx={0} cy={-100} r={20} fill="#ffffff" />
        <ellipse cx={-22} cy={-126} rx={12} ry={7} fill="#ffffff" opacity={0.5} />
      </g>
      {label && q > 0.9 && <g transform="translate(0 -190)">
        <rect x={-label.length * 9 - 20} y={-30} width={label.length * 18 + 40} height={52} rx={26} fill="#ffffff" stroke={line('#ffffff')}
          strokeWidth={4} />
        <text x={0} y={6} textAnchor="middle" fontFamily="Inter, Helvetica, Arial, sans-serif" fontWeight={800} fontSize={26}
          fill="#2b2440">{label}</text>
      </g>}
    </g>
  );
};

/** A DOCUMENT CARD: a page with a folded corner, a few lines, an optional stamp. Screen units. */
export const DocumentV2: React.FC<{x: number; y: number; s?: number; tilt?: number; title?: string; stamp?: string; lines?: number;
  accent?: string}> = ({x, y, s = 1, tilt = -4, title, stamp, lines = 6, accent = '#3d7bd9'}) => (
  <g transform={`translate(${x} ${y}) rotate(${tilt}) scale(${s})`}>
    <ContactShadow x={10} y={250} w={340} opacity={0.2} />
    <path d="M-170 -230 L120 -230 L170 -180 L170 230 Q170 246 154 246 L-154 246 Q-170 246 -170 230 Z" fill="#fffdf8"
      stroke={line('#fffdf8')} strokeWidth={6} strokeLinejoin="round" />
    <path d="M120 -230 L120 -196 Q120 -180 136 -180 L170 -180 Z" fill="#e9e4d8" />
    <rect x={-130} y={-196} width={150} height={26} rx={13} fill={accent} />
    {title && <text x={-130} y={-136} fontFamily="Inter, Helvetica, Arial, sans-serif" fontWeight={800} fontSize={30} fill="#2b2440">{title}</text>}
    {Array.from({length: lines}).map((_, i) => <rect key={i} x={-130} y={-100 + i * 44} width={i % 3 === 2 ? 170 : 260} height={14} rx={7}
      fill="#d9d4e6" />)}
    {stamp && <g transform="translate(70 170) rotate(-14)">
      <rect x={-90} y={-34} width={180} height={68} rx={18} fill="none" stroke="#e5484d" strokeWidth={8} />
      <text x={0} y={12} textAnchor="middle" fontFamily="Inter, Helvetica, Arial, sans-serif" fontWeight={900} fontSize={30}
        fill="#e5484d">{stamp}</text>
    </g>}
  </g>
);

export const PROPS_V2 = ['CowV2', 'HogV2', 'DeerV2', 'DogV2', 'PickupV2', 'WindmillV2', 'BarnV2', 'MapPinV2', 'DocumentV2'] as const;
