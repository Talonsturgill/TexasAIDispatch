import React from 'react';
import {M} from '../../lib/scale';
import {FONT} from '../../lib/type';
import {light, line, mix, shade} from '../color';
import {ContactShadow, Glow, clamp01, useUid} from '../Kit';
import {Visor, type MachineMood, type Place} from '../machines';

/**
 * AGRICULTURE, LOOK V2 (November 14th, 2026).
 *
 * The farm beat of lib/agriculture.tsx redrawn in the v2 idiom. Seven drawings. The receding centre
 * pivot is the subject of the beat and the only hero here, so it alone carries a face, and only when a
 * board asks for one with `mood`. The rest is the ground it stands on (crop rows, a cut through the
 * aquifer), the town landmark (the elevator), the feedyard, and the two small sensors the AI is built
 * out of (a soil probe and an ear tag).
 *
 * The library's three honest choices are kept on purpose. Drop hoses hang to just above the crop and
 * never throw an arc off the top, the pivot recedes span by span toward the horizon, and the
 * prescription drives how hard each span waters, so variable rate is drawn and not asserted. The
 * ground section still prints no number it was not handed.
 *
 * Every drawing follows the blueprint (knowledge/craft/LOOK_V2.md). Round joins and caps, lit from
 * the upper left with shade pushed toward violet, outlines in each fill's own deep hue drawn as one
 * pass under the fills so joined parts show no seam, a contact shadow under anything that stands, far
 * things paled toward a violet haze by colour rather than by fading, and something alive on `frame`.
 *
 * PLACEMENT is the library's. x, y at the ground, `scale` 1 is true size through the one metre in
 * lib/scale.ts, and `seed`, `wear` and `facing` keep their meaning. Each drawing is built in
 * centimetres and converted once, so `scale` means the same here as in look/props.tsx. Crop rows and
 * the ground section are sized to the frame like the library's and keep its screen units.
 *
 * The small helpers below are shared with the drilling and irrigation shelves of the same set.
 */
export const CM = M / 100;
/** the library's true heights, restated because a v2 drawing does not import from src/lib/ beyond the metre */
export const AG_V2_M: Record<string, {h: number; note: string}> = {
  centrePivot: {h: 4.3, note: 'high clearance tower, ground to the top of the pipe'},
  grainElevator: {h: 38, note: 'concrete silo bank to the top of the headhouse'},
  feedlotPen: {h: 1.6, note: 'to the top rail of the pen fence'},
  soilProbe: {h: 1.4, note: 'stake, solar panel and antenna above the row'},
  herdSensor: {h: 0.075, note: 'a cattle ear tag, across the face of the panel'},
};

export interface FieldPlace extends Place {wear?: number}
export type Pt = [number, number];
export const HAZE = '#c5c8ea';
export const atF = (p: Place, flip = true) =>
  `translate(${p.x ?? 0} ${p.y ?? 0}) scale(${(p.scale ?? 1) * CM * (flip ? (p.facing ?? 1) : 1)} ${(p.scale ?? 1) * CM})`;
/** outline half width in local centimetres, about 3.4 film pixels a side at any scale */
export const owOf = (scale?: number, k = 1) => (3.4 * k) / ((scale ?? 1) * CM);
export const hash = (seed: number, ch: number) => {
  let t = (Math.imul(seed + 13, 374761393) + Math.imul(ch + 7, 668265263)) >>> 0;
  t = Math.imul(t ^ (t >>> 13), 1274126177) >>> 0;
  return ((t ^ (t >>> 16)) >>> 0) % 100000 / 100000;
};
export const f1 = (n: number) => n.toFixed(1);
/** a rounded rectangle as a path */
export const rr = (x: number, y: number, w: number, h: number, r: number) => {
  const q = Math.max(0, Math.min(r, w / 2, h / 2));
  return `M${f1(x + q)} ${f1(y)} H${f1(x + w - q)} A${f1(q)} ${f1(q)} 0 0 1 ${f1(x + w)} ${f1(y + q)} V${f1(y + h - q)} `
    + `A${f1(q)} ${f1(q)} 0 0 1 ${f1(x + w - q)} ${f1(y + h)} H${f1(x + q)} A${f1(q)} ${f1(q)} 0 0 1 ${f1(x)} ${f1(y + h - q)} `
    + `V${f1(y + q)} A${f1(q)} ${f1(q)} 0 0 1 ${f1(x + q)} ${f1(y)} Z`;
};
export const ell = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f1(cx - rx)} ${f1(cy)} A${f1(rx)} ${f1(ry)} 0 1 0 ${f1(cx + rx)} ${f1(cy)} A${f1(rx)} ${f1(ry)} 0 1 0 ${f1(cx - rx)} ${f1(cy)} Z`;
export const circ = (cx: number, cy: number, r: number) => ell(cx, cy, r, r);

/** One drawn part. A filled shape, or a stroke when `stroke` is set. `ink` is its outline colour and
 * `o` scales the outline (thin members take a thinner line). */
export type Part = {d: string; fill?: string; stroke?: string; w?: number; t?: string; ink: string; o?: number};
/** THE SEAMLESS JOIN. Every part's outline first, then every fill, so where two parts meet the fill of
 * one covers the outline of the other and the pair reads as one form. */
export const Pass: React.FC<{parts: Part[]; ow: number}> = ({parts, ow}) => <>
  {parts.map((q, i) => q.stroke
    ? <path key={`o${i}`} d={q.d} transform={q.t} fill="none" stroke={q.ink} strokeWidth={(q.w ?? 0) + ow * 2 * (q.o ?? 1)}
      strokeLinecap="round" strokeLinejoin="round" />
    : <path key={`o${i}`} d={q.d} transform={q.t} fill={q.ink} stroke={q.ink} strokeWidth={ow * 2 * (q.o ?? 1)} strokeLinejoin="round" />)}
  {parts.map((q, i) => q.stroke
    ? <path key={`f${i}`} d={q.d} transform={q.t} fill="none" stroke={q.stroke} strokeWidth={q.w} strokeLinecap="round"
      strokeLinejoin="round" />
    : <path key={`f${i}`} d={q.d} transform={q.t} fill={q.fill} />)}
</>;
/** a lit material, light at the upper left, the colour, shade toward violet at the lower right */
export const Lit: React.FC<{id: string; c: string; x2?: number; y2?: number; a?: number; b?: number}> = ({id, c, x2 = 0.4, y2 = 1, a = 0.5,
  b = 0.36}) => (
  <linearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
    <stop offset="0%" stopColor={light(c, a)} /><stop offset="46%" stopColor={c} /><stop offset="100%" stopColor={shade(c, b)} />
  </linearGradient>
);
/** a lit cylinder seen side on, lit on the left, a sheen a quarter of the way across */
export const Cyl: React.FC<{id: string; c: string; vertical?: boolean}> = ({id, c, vertical}) => (
  <linearGradient id={id} x1="0" y1="0" x2={vertical ? '0' : '1'} y2={vertical ? '1' : '0'}>
    <stop offset="0%" stopColor={light(c, 0.3)} /><stop offset="24%" stopColor={light(c, 0.55)} /><stop offset="55%" stopColor={c} />
    <stop offset="100%" stopColor={shade(c, 0.4)} />
  </linearGradient>
);
/** a lit ball, the light off centre toward the upper left */
export const Ball: React.FC<{id: string; c: string; a?: number; b?: number}> = ({id, c, a = 0.5, b = 0.38}) => (
  <radialGradient id={id} cx="34%" cy="30%" r="80%"><stop offset="0%" stopColor={light(c, a)} /><stop offset="58%" stopColor={c} />
    <stop offset="100%" stopColor={shade(c, b)} /></radialGradient>
);
/** a soft white highlight stroke along a lit edge */
export const Sheen: React.FC<{d: string; w: number; op?: number; t?: string}> = ({d, w, op = 0.45, t}) =>
  <path d={d} transform={t} stroke="#ffffff" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={op} />;
/** a pivot or rig tyre that turns, chevron lugs round a dark carcass and a lit rim */
export const Tyre: React.FC<{cx: number; cy: number; r: number; spin: number; ow: number; c?: string; rim?: string}> = ({cx, cy, r, spin, ow,
  c = '#2e2a46', rim = '#cfd6e6'}) => (
  <g transform={`translate(${f1(cx)} ${f1(cy)})`}>
    <circle r={r + ow} fill={line(c)} />
    <circle r={r} fill={c} />
    <g transform={`rotate(${f1(spin)})`}>
      {Array.from({length: 12}, (_, i) => <path key={i} transform={`rotate(${i * 30})`}
        d={`M${f1(-r * 0.18)} ${f1(-r * 0.97)} L${f1(r * 0.02)} ${f1(-r * 0.8)} L${f1(r * 0.22)} ${f1(-r * 0.97)}`} stroke={light(c, 0.28)}
        strokeWidth={r * 0.1} strokeLinecap="round" strokeLinejoin="round" fill="none" />)}
      <circle r={r * 0.58} fill={rim} stroke={shade(rim, 0.4)} strokeWidth={r * 0.06} />
      {[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={f1(Math.cos(a * Math.PI / 180) * r * 0.34)} cy={f1(Math.sin(a * Math.PI / 180) * r * 0.34)}
        r={r * 0.07} fill={shade(rim, 0.45)} />)}
    </g>
    <circle r={r * 0.17} fill={shade(rim, 0.3)} />
    <path d={`M${f1(-r * 0.46)} ${f1(-r * 0.24)} A${f1(r * 0.52)} ${f1(r * 0.52)} 0 0 1 ${f1(r * 0.06)} ${f1(-r * 0.52)}`} stroke="#ffffff"
      strokeWidth={r * 0.08} fill="none" strokeLinecap="round" opacity={0.65} />
  </g>
);
/** text that reads on a bright plate and a dark one, light letters on a deep rim of their own hue */
export const Label: React.FC<{x: number; y: number; text: string; fs: number; c?: string; anchor?: 'start' | 'middle' | 'end'; weight?: number;
  op?: number}> = ({x, y, text, fs, c = '#fff6e2', anchor = 'start', weight = 800, op = 1}) => (
  <text x={x} y={y} textAnchor={anchor} fontFamily={FONT.body} fontWeight={weight} fontSize={fs} fill={c} stroke={line(c === '#fff6e2' ? '#7a5a3a' : c)}
    strokeWidth={fs * 0.22} strokeLinejoin="round" paintOrder="stroke" opacity={op}>{text}</text>
);

// =================================================================================== CENTRE PIVOT

/**
 * THE CENTRE PIVOT, RECEDING. The library's quarter mile machine walking away from the camera to the
 * right, each span a step smaller, higher and paler. The name differs from the library's because
 * look/machines.tsx already owns `CentrePivotV2` (the side view hero with arched spans), so this one is
 * the depth view. An arched pipe on a truss, drop hoses swaying to just above the crop with the
 * water's reach set span by span by the `prescription`, A frame towers on turning tyres (the tyres
 * turn and the towers do not slide, the honest way to draw a machine that moves a metre a minute),
 * and the pivot point with its control panel, where the face sits when `mood` is given. `endGun`
 * throws the one honest arc for the field corner. True size 4.3 m to the pipe.
 */
export const CentrePivotDepthV2: React.FC<FieldPlace & {spans?: number; prescription?: number[]; running?: boolean; endGun?: boolean;
  mood?: MachineMood}> = (p) => {
  const {frame = 0, seed = 1, wear = 0.4, spans = 6, prescription, running = true, endGun = false, mood} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const U = 4.3;
  const steel = '#d6deee', blue = '#3d7bd9', water = '#2aa6e8', pad = '#dccfb9', hose = '#46507a';
  const rx = prescription && prescription.length ? prescription : Array.from({length: spans}, (_, i) => 0.25 + hash(seed, 30 + i) * 0.75);
  const rate = (i: number) => clamp01(rx[i % rx.length]);
  const t = frame / 30;
  const creep = running ? t * 0.9 : 0;
  const T = Array.from({length: spans + 1}, (_, i) => {
    const d = 1 - (i / spans) * 0.62;
    const lift = (1 - d) * 46 * U;
    return {d, x: (28 + (i / spans) * 470) * U, g: -lift, top: -100 * U * d - lift};
  });
  const hz = (c: string, d: number) => mix(c, HAZE, (1 - d) * 0.9);
  const q = (a: Pt, c: Pt, b: Pt, u: number): Pt => [(1 - u) ** 2 * a[0] + 2 * u * (1 - u) * c[0] + u * u * b[0],
    (1 - u) ** 2 * a[1] + 2 * u * (1 - u) * c[1] + u * u * b[1]];
  const spanEls: React.ReactNode[] = [];
  for (let i = spans - 1; i >= 0; i--) {
    const a = T[i], b = T[i + 1], d = a.d, db = b.d, r = rate(i);
    const o = ow * (0.55 + 0.45 * d);
    const st = hz(steel, d), ink = line(hz(steel, d));
    const A: Pt = [a.x, a.top], B: Pt = [b.x, b.top], C: Pt = [(a.x + b.x) / 2, (a.top + b.top) / 2 - 34 * d];
    const pipe = `M${f1(A[0])} ${f1(A[1])} Q${f1(C[0])} ${f1(C[1])} ${f1(B[0])} ${f1(B[1])}`;
    const mid = q(A, C, B, 0.5), chord = mid[1] + 120 * d;
    const truss: Part[] = [
      {d: `M${f1(A[0])} ${f1(A[1] + 14 * d)} L${f1(mid[0])} ${f1(chord)} L${f1(B[0])} ${f1(B[1] + 14 * d)}`, stroke: hz(shade(steel, 0.22), d),
        w: 10 * d, ink, o: 0.45},
      ...[0.2, 0.35, 0.65, 0.8].map((u) => {
        const P = q(A, C, B, u), cy = u < 0.5 ? A[1] + 14 * d + (chord - A[1] - 14 * d) * (u / 0.5) : B[1] + 14 * d + (chord - B[1] - 14 * d) * ((1 - u) / 0.5);
        return {d: `M${f1(P[0])} ${f1(P[1])} L${f1(P[0])} ${f1(cy)}`, stroke: hz(shade(steel, 0.15), d), w: 7 * d, ink, o: 0.4};
      }),
    ];
    const tw = 70 * db, tr = 40 * db, hubY = b.g - tr;
    const tower: Part[] = [
      {d: `M${f1(b.x - tw)} ${f1(hubY)} L${f1(b.x - 10 * db)} ${f1(b.top + 16 * db)} L${f1(b.x + 10 * db)} ${f1(b.top + 16 * db)} L${f1(b.x + tw)} ${f1(hubY)}`,
        stroke: hz(steel, db), w: 16 * db, ink: line(hz(steel, db)), o: 0.6},
      {d: `M${f1(b.x - tw * 0.6)} ${f1(hubY - (hubY - b.top) * 0.36)} L${f1(b.x + tw * 0.6)} ${f1(hubY - (hubY - b.top) * 0.36)}`,
        stroke: hz(shade(steel, 0.12), db), w: 10 * db, ink: line(hz(steel, db)), o: 0.45},
      {d: rr(b.x - tw, hubY - 9 * db, tw * 2, 18 * db, 9 * db), fill: hz(shade(steel, 0.2), db), ink: line(hz(steel, db)), o: 0.6},
      {d: rr(b.x - 26 * db, hubY - 30 * db, 52 * db, 40 * db, 14 * db), fill: hz(blue, db), ink: line(hz(blue, db)), o: 0.6},
    ];
    const drops = Array.from({length: 5}, (_, j) => {
      const u = (j + 0.5) / 5, P = q(A, C, B, u);
      const gy = a.g + (b.g - a.g) * u, room = gy - P[1];
      const L = room * (0.5 + r * 0.1);
      const sw = Math.sin(t * 2 * Math.PI / 2.8 + i * 1.7 + j * 0.9 + hash(seed, 90 + j) * 6) * 7 * d;
      const nx = P[0] + sw, ny = P[1] + L;
      const sh = room * 0.34 * (0.5 + r * 0.6), sw2 = 26 * d * (0.45 + r);
      return <g key={j}>
        <path d={`M${f1(P[0])} ${f1(P[1])} Q${f1(P[0] + sw * 0.4)} ${f1(P[1] + L * 0.55)} ${f1(nx)} ${f1(ny)}`} stroke={line(hz(hose, d))}
          strokeWidth={5 * d + o * 1.2} strokeLinecap="round" fill="none" />
        <path d={`M${f1(P[0])} ${f1(P[1])} Q${f1(P[0] + sw * 0.4)} ${f1(P[1] + L * 0.55)} ${f1(nx)} ${f1(ny)}`} stroke={hz(hose, d)}
          strokeWidth={5 * d} strokeLinecap="round" fill="none" />
        {running && r > 0.06 && <g opacity={0.55 + r * 0.45}>
          <path d={`M${f1(nx - 3 * d)} ${f1(ny + 6 * d)} Q${f1(nx - sw2 * 0.5)} ${f1(ny + sh * 0.55)} ${f1(nx - sw2)} ${f1(ny + sh)} `
            + `A${f1(sw2)} ${f1(sw2 * 0.32)} 0 0 0 ${f1(nx + sw2)} ${f1(ny + sh)} Q${f1(nx + sw2 * 0.5)} ${f1(ny + sh * 0.55)} ${f1(nx + 3 * d)} ${f1(ny + 6 * d)} Z`}
            fill={`url(#${id}-w)`} />
          {[0, 1, 2].map((k) => {
            const ph = (t * 1.5 + j * 0.37 + i * 0.21 + k / 3) % 1;
            return <circle key={k} cx={f1(nx + (k - 1) * sw2 * 0.7 * ph)} cy={f1(ny + 8 * d + ph * sh)} r={f1(4.5 * d)} fill={light(hz(water, d), 0.35)}
              opacity={f1(1 - ph)} />;
          })}
        </g>}
        <path d={rr(nx - 6 * d, ny - 4 * d, 12 * d, 16 * d, 6 * d)} fill={hz('#e8b23a', d)} stroke={line(hz('#e8b23a', d))} strokeWidth={o * 1.2} />
      </g>;
    });
    spanEls.push(<g key={i}>
      <ContactShadow x={b.x} y={b.g + 4} w={300 * db} opacity={0.3 * (0.5 + db * 0.5)} />
      <ellipse cx={b.x} cy={b.g + 2} rx={150 * db} ry={14 * db} fill={hz('#8a5a3a', db)} opacity={0.35} />
      <Pass ow={o} parts={truss} />
      {drops}
      <Pass ow={ow * (0.55 + 0.45 * db)} parts={tower} />
      {[-1, 1].map((sd) => <Tyre key={sd} cx={b.x + sd * tw} cy={hubY} r={tr} spin={creep * 40 + hash(seed, 60 + i) * 90 + sd * 20}
        ow={ow * (0.55 + 0.45 * db)} c={hz('#2e2a46', db)} rim={hz('#e8b23a', db)} />)}
      <path d={pipe} stroke={ink} strokeWidth={30 * d + o * 2} strokeLinecap="round" fill="none" />
      <path d={pipe} stroke={st} strokeWidth={30 * d} strokeLinecap="round" fill="none" />
      <path d={pipe} stroke={hz(shade(steel, 0.25), d)} strokeWidth={10 * d} strokeLinecap="round" fill="none" transform={`translate(0 ${f1(8 * d)})`} />
      <path d={pipe} stroke={light(st, 0.7)} strokeWidth={8 * d} strokeLinecap="round" fill="none" transform={`translate(0 ${f1(-8 * d)})`} opacity={0.85} />
    </g>);
  }
  const E = T[spans];
  const gunPh = (t * 0.8) % 1;
  return (
    <g transform={atF(p)}>
      <defs>
        <linearGradient id={`${id}-w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={light(water, 0.4)} stopOpacity={0.95} />
          <stop offset="100%" stopColor={water} stopOpacity={0.12} /></linearGradient>
        <Cyl id={`${id}-r`} c={steel} /><Lit id={`${id}-b`} c={blue} /><Lit id={`${id}-pad`} c={pad} x2={0} />
      </defs>
      {spanEls}
      {endGun && <g>
        <path d={`M${f1(E.x)} ${f1(E.top)} l40 -18`} stroke={line('#e8b23a')} strokeWidth={22 + ow * 2} strokeLinecap="round" />
        <path d={`M${f1(E.x)} ${f1(E.top)} l40 -18`} stroke="#e8b23a" strokeWidth={22} strokeLinecap="round" />
        {running && <g>
          <path d={`M${f1(E.x + 40)} ${f1(E.top - 18)} Q${f1(E.x + 180)} ${f1(E.top - 200)} ${f1(E.x + 340)} ${f1(E.g - 10)}`} stroke={water}
            strokeWidth={34} strokeLinecap="round" fill="none" opacity={0.28} />
          <path d={`M${f1(E.x + 40)} ${f1(E.top - 18)} Q${f1(E.x + 170)} ${f1(E.top - 170)} ${f1(E.x + 310)} ${f1(E.g - 30)}`} stroke={light(water, 0.5)}
            strokeWidth={12} strokeLinecap="round" fill="none" opacity={0.6} />
          {[0, 1, 2, 3, 4].map((k) => {
            const u = (gunPh + k / 5) % 1, P = q([E.x + 40, E.top - 18], [E.x + 180, E.top - 200], [E.x + 330, E.g - 20], u);
            return <circle key={k} cx={f1(P[0])} cy={f1(P[1])} r={9} fill={light(water, 0.45)} opacity={f1(0.9 - u * 0.5)} />;
          })}
        </g>}
      </g>}
      {/* the pivot point, a pad, a braced pyramid, the riser and its gooseneck into the first span */}
      <ContactShadow x={-60} y={6} w={620} opacity={0.34} />
      <path d={ell(0, 0, 170, 30)} fill={line(pad)} stroke={line(pad)} strokeWidth={ow * 2} />
      <path d={ell(0, 0, 170, 30)} fill={`url(#${id}-pad)`} />
      <Pass ow={ow} parts={[
        {d: 'M-70 0 L-12 -400 M70 0 L12 -400', stroke: shade(steel, 0.25), w: 14, ink: line(steel), o: 0.6},
        {d: 'M-140 0 L-16 -410 M140 0 L16 -410', stroke: steel, w: 18, ink: line(steel), o: 0.7},
        {d: 'M-106 -120 L106 -120 M-66 -260 L66 -260', stroke: shade(steel, 0.12), w: 11, ink: line(steel), o: 0.5},
        {d: 'M0 -446 L0 -468 Q0 -510 48 -508 Q96 -506 120 -430', stroke: steel, w: 30, ink: line(steel)},
        {d: rr(-17, -462, 34, 462, 17), fill: `url(#${id}-r)`, ink: line(steel)},
        {d: rr(-44, -486, 88, 58, 24), fill: `url(#${id}-b)`, ink: line(blue)},
      ]} />
      <Sheen d="M-8 -440 L-8 -40" w={6} op={0.5} />
      {wear > 0.25 && [0, 1, 2].map((k) => <ellipse key={k} cx={-6 + hash(seed, 80 + k) * 12} cy={-380 + k * 120 + hash(seed, 84 + k) * 40} rx={7}
        ry={22} fill="#c06a32" opacity={0.2 + wear * 0.35} />)}
      {/* the control panel on its post, the pivot's face */}
      <ContactShadow x={-250} y={4} w={150} opacity={0.3} />
      <Pass ow={ow} parts={[
        {d: rr(-262, -170, 24, 170, 12), fill: shade(steel, 0.2), ink: line(steel)},
        {d: 'M-180 -230 Q-90 -230 -20 -300', stroke: '#3a3550', w: 9, ink: line('#3a3550'), o: 0.5},
        {d: rr(-340, -340, 180, 190, 44), fill: `url(#${id}-b)`, ink: line(blue)},
      ]} />
      <Sheen d="M-314 -322 Q-260 -332 -200 -324" w={9} op={0.5} />
      {mood ? <Visor x={-250} y={-250} w={140} h={74} mood={mood} frame={frame} />
        : <g><rect x={-312} y={-292} width={124} height={76} rx={22} fill="#1d2150" />
          {[0, 1, 2].map((k) => <rect key={k} x={-298} y={-280 + k * 20} width={50 + ((frame / 8 + k * 3) % 4) * 14} height={9} rx={4.5} fill="#38f2a0"
            opacity={0.75} />)}</g>}
      <circle cx={-186} cy={-318} r={11} fill={running ? '#7dff8a' : '#ff5d5d'} stroke={line(blue)} strokeWidth={ow * 0.8} />
      {running && <Glow x={-186} y={-318} r={40} color="#7dff8a" opacity={0.25 + 0.15 * Math.sin(t * 4)} />}
      {wear > 0.5 && <ellipse cx={1000 + Math.sin(t * 0.5) * 60} cy={-30} rx={900} ry={50} fill="#e8d6b0" opacity={wear * 0.18} />}
    </g>
  );
};

// ====================================================================================== CROP ROWS

/**
 * CROP ROWS in perspective, the ground the pivot stands on. Rows fan from past the frame edges at the
 * near end to a vanishing point off centre, with the soil showing between them until the canopy
 * closes. Near the camera the rows break into lit round plants with outlines that breathe in the
 * wind, and the crop tells itself there by its fruit (open cotton bolls, rust red sorghum heads,
 * gold corn tassels, wheat ears). Far rows pale into a violet haze. Sized to the frame like the
 * library's (`w`, `h` in screen units), clipped to its box.
 */
export const CropRowsV2: React.FC<{x?: number; y?: number; w?: number; h?: number; frame?: number; seed?: number;
  crop?: 'cotton' | 'sorghum' | 'corn' | 'wheat' | 'fallow'; growth?: number; vanish?: number}> = ({
  x = 0, y = 0, w = 1080, h = 420, frame = 0, seed = 4, crop = 'cotton', growth = 0.7, vanish = 0.42,
}) => {
  const id = useUid();
  const PAL = {
    cotton: {leaf: '#5f9e3a', soil: '#c98a52', fruit: '#fbf6ea'},
    sorghum: {leaf: '#6a9c3a', soil: '#c4834c', fruit: '#b8452a'},
    corn: {leaf: '#4c9a40', soil: '#bd8350', fruit: '#f2c94c'},
    wheat: {leaf: '#d9b445', soil: '#c58c55', fruit: '#f3d77a'},
    fallow: {leaf: '#b78a58', soil: '#c98a52', fruit: '#b78a58'},
  }[crop];
  const leaf = PAL.leaf, soil = PAL.soil;
  const g = clamp01(growth);
  const vx = x + w * vanish, rows = 34, spread = w * 2.6;
  const t = frame / 30;
  const rowEls: React.ReactNode[] = [];
  const plantEls: {tt: number; el: React.ReactNode}[] = [];
  for (let i = 0; i < rows; i++) {
    const u = i / (rows - 1), nearX = x + (u - 0.5) * spread + w * 0.5;
    const k = hash(seed, i), green = g * (0.8 + k * 0.2);
    const gap = spread / (rows - 1), hw = gap * (crop === 'fallow' ? 0.16 : 0.12 + 0.3 * green);
    if (nearX + hw < x - w * 0.6 || nearX - hw > x + w * 1.6) continue;
    rowEls.push(<path key={i} d={`M${f1(nearX - hw)} ${f1(y + h + 2)} L${f1(vx - 0.4)} ${f1(y)} L${f1(vx + 0.4)} ${f1(y)} L${f1(nearX + hw)} ${f1(y + h + 2)} Z`}
      fill={`url(#${id}-row)`} stroke={line(leaf)} strokeWidth={1.6} strokeLinejoin="round" />);
    if (crop === 'fallow' || g < 0.3) continue;
    for (let s = 0; s < 12; s++) {
      const tt = 1 / (1 + (s + hash(seed, 900 + i * 13 + s) * 0.6 + (i % 2) * 0.5) * 0.42);
      const px = vx + (nearX - vx) * tt, py = y + h * tt;
      const r = gap * tt * 0.4 * (0.55 + green * 0.6) * (0.85 + hash(seed, 1300 + i * 17 + s) * 0.3);
      if (r < 2.2 || px < x - r * 2 || px > x + w + r * 2) continue;
      const puff = Math.sin(t * 1.3 + i * 0.4 + s * 0.9) * r * 0.08;
      const c = mix(leaf, HAZE, (1 - tt) * 0.55), ink = line(c), lw = Math.max(1.2, Math.min(3.4, r * 0.16));
      const lobes: [number, number, number][] = [[-0.55, 0.05, 0.62], [0.55, 0.0, 0.6], [0, -0.42, 0.72]];
      const fruit: [number, number][] = crop === 'cotton' && g > 0.75 ? [[-0.45, -0.35], [0.4, -0.55], [0.05, -0.85]]
        : crop === 'sorghum' && g > 0.6 ? [[0, -1.25]] : crop === 'corn' && g > 0.7 ? [[0, -1.45]] : crop === 'wheat' ? [[-0.3, -0.9], [0.3, -1.0]] : [];
      plantEls.push({tt, el: <g key={`${i}-${s}`} transform={`translate(${f1(px + puff)} ${f1(py)})`}>
        {crop === 'corn' && <path d={`M0 0 L0 ${f1(-r * 1.45)}`} stroke={ink} strokeWidth={r * 0.18 + lw * 2} strokeLinecap="round" />}
        {lobes.map(([lx, ly, lr], j) => <circle key={`o${j}`} cx={f1(lx * r)} cy={f1(ly * r)} r={f1(lr * r + lw)} fill={ink} />)}
        {crop === 'corn' && <path d={`M0 0 L0 ${f1(-r * 1.45)}`} stroke={c} strokeWidth={r * 0.18} strokeLinecap="round" />}
        {lobes.map(([lx, ly, lr], j) => <circle key={j} cx={f1(lx * r)} cy={f1(ly * r)} r={f1(lr * r)} fill={`url(#${id}-leaf)`} />)}
        <ellipse cx={f1(-r * 0.2)} cy={f1(-r * 0.7)} rx={f1(r * 0.32)} ry={f1(r * 0.14)} fill="#ffffff" opacity={0.3} />
        {fruit.map(([fx, fy], j) => {
          const fc = mix(PAL.fruit, HAZE, (1 - tt) * 0.4);
          const fr = crop === 'sorghum' ? r * 0.36 : crop === 'corn' ? r * 0.26 : crop === 'wheat' ? r * 0.24 : r * 0.3;
          return crop === 'sorghum' || crop === 'wheat'
            ? <g key={j}><path d={ell(fx * r, fy * r, fr * 0.8, fr * 1.4)} fill={line(fc)} stroke={line(fc)} strokeWidth={lw * 2} />
              <path d={ell(fx * r, fy * r, fr * 0.8, fr * 1.4)} fill={fc} />
              <ellipse cx={f1(fx * r - fr * 0.25)} cy={f1(fy * r - fr * 0.5)} rx={f1(fr * 0.25)} ry={f1(fr * 0.5)} fill="#ffffff" opacity={0.35} /></g>
            : <g key={j}><circle cx={f1(fx * r)} cy={f1(fy * r)} r={f1(fr + lw)} fill={line(crop === 'cotton' ? '#d8d0e4' : fc)} />
              <circle cx={f1(fx * r)} cy={f1(fy * r)} r={f1(fr)} fill={fc} />
              <circle cx={f1(fx * r - fr * 0.3)} cy={f1(fy * r - fr * 0.3)} r={f1(fr * 0.35)} fill="#ffffff" opacity={0.7} /></g>;
        })}
      </g>});
    }
  }
  plantEls.sort((a, b) => a.tt - b.tt);
  const clods = crop === 'fallow' ? Array.from({length: 60}, (_, i) => {
    const tt = 0.2 + hash(seed, 300 + i) * 0.8, u = hash(seed, 400 + i);
    const px = vx + ((x + (u - 0.5) * spread + w * 0.5) - vx) * tt, py = y + h * tt, r = 3 + tt * 9;
    return <ellipse key={i} cx={f1(px)} cy={f1(py)} rx={f1(r * 1.4)} ry={f1(r * 0.6)} fill={shade(soil, 0.18)} opacity={0.55} />;
  }) : null;
  return (
    <g clipPath={`url(#${id}-box)`}>
      <defs>
        <clipPath id={`${id}-box`}><rect x={x} y={y} width={w} height={h} /></clipPath>
        <linearGradient id={`${id}-soil`} gradientUnits="userSpaceOnUse" x1={0} y1={y} x2={0} y2={y + h}>
          <stop offset="0%" stopColor={mix(light(soil, 0.25), HAZE, 0.5)} /><stop offset="45%" stopColor={soil} />
          <stop offset="100%" stopColor={shade(soil, 0.22)} /></linearGradient>
        <linearGradient id={`${id}-row`} gradientUnits="userSpaceOnUse" x1={0} y1={y} x2={0} y2={y + h}>
          <stop offset="0%" stopColor={mix(leaf, HAZE, 0.6)} /><stop offset="40%" stopColor={light(leaf, 0.12)} />
          <stop offset="100%" stopColor={shade(leaf, 0.12)} /></linearGradient>
        <Ball id={`${id}-leaf`} c={leaf} a={0.45} b={0.34} />
        <linearGradient id={`${id}-haze`} gradientUnits="userSpaceOnUse" x1={0} y1={y} x2={0} y2={y + h * 0.4}>
          <stop offset="0%" stopColor={HAZE} stopOpacity={0.75} /><stop offset="100%" stopColor={HAZE} stopOpacity={0} /></linearGradient>
      </defs>
      <rect x={x} y={y} width={w} height={h} fill={`url(#${id}-soil)`} />
      {clods}
      {rowEls}
      {plantEls.map((q) => q.el)}
      <rect x={x} y={y} width={w} height={h * 0.4} fill={`url(#${id}-haze)`} />
    </g>
  );
};

// ================================================================================= GRAIN ELEVATOR

/**
 * THE GRAIN ELEVATOR, the vertical landmark of every town out here. A bank of poured concrete silos
 * lit as cylinders and joined with no gap, a conveyor gallery along the top, the headhouse standing
 * off centre with its window band, spouts slanting down to the bins, the truck bay at the foot (the
 * one part at human scale, so it gives the stack its size), and the co-op's name painted down the
 * side when `label` is given. A beacon blinks on the headhouse and grain dust drifts out of the bay.
 * True size 38 m to the headhouse top.
 */
export const GrainElevatorV2: React.FC<FieldPlace & {silos?: number; label?: string}> = (p) => {
  const {frame = 0, seed = 5, wear = 0.45, silos = 6, label} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const t = frame / 30;
  const conc = '#ecdcc0', roof = '#c7d0e2', dark = '#3e3a5e';
  const sw = 570, W = silos * sw, H = 2850, hx = W * 0.28, hw = 860;
  const silosD = Array.from({length: silos}, (_, i) => rr(i * sw, -H, sw, H, 40)).join(' ');
  const parts: Part[] = [
    {d: rr(-60, -90, W + 120, 90, 40), fill: `url(#${id}-apron)`, ink: line('#cdbfa8')},
    {d: rr(0, -H, W, H, 60), fill: conc, ink: line(conc)},
    {d: rr(-40, -H - 190, W + 80, 200, 80), fill: `url(#${id}-roof)`, ink: line(roof)},
    {d: rr(hx, -3800, hw, 1000, 90), fill: `url(#${id}-head)`, ink: line(conc)},
    {d: rr(hx - 50, -3880, hw + 100, 120, 60), fill: `url(#${id}-roof)`, ink: line(roof)},
    {d: `M${hx + hw} -3300 L${hx + hw + 900} -${H + 200}`, stroke: roof, w: 70, ink: line(roof), o: 0.7},
    {d: `M${hx} -3200 L${hx - 700} -${H + 200}`, stroke: roof, w: 60, ink: line(roof), o: 0.7},
  ];
  return (
    <g transform={atF(p)}>
      <defs>
        <Cyl id={`${id}-c`} c={conc} />
        <Lit id={`${id}-head`} c={conc} x2={1} y2={0.3} />
        <Lit id={`${id}-roof`} c={roof} x2={0} />
        <Lit id={`${id}-apron`} c="#d6c7ae" x2={0} />
        <clipPath id={`${id}-clip`}><path d={silosD} /></clipPath>
      </defs>
      <ContactShadow x={W / 2} y={30} w={W * 1.35} opacity={0.34} />
      <Pass ow={ow} parts={parts} />
      {/* the cylinders, each lit from the left, the seam between two a deep valley */}
      <g clipPath={`url(#${id}-clip)`}>
        {Array.from({length: silos}, (_, i) => <rect key={i} x={i * sw} y={-H} width={sw} height={H} fill={`url(#${id}-c)`} />)}
        {Array.from({length: silos - 1}, (_, i) => <path key={`s${i}`} d={`M${(i + 1) * sw} ${-H} L${(i + 1) * sw} 0`} stroke={shade(conc, 0.45)}
          strokeWidth={34} opacity={0.5} />)}
        {[0.33, 0.66].map((u) => <path key={u} d={`M0 ${-H * u} L${W} ${-H * u}`} stroke={shade(conc, 0.25)} strokeWidth={10} opacity={0.35} />)}
        {wear > 0.3 && Array.from({length: 5}, (_, k) => {
          const rx = hash(seed, 10 + k) * W;
          return <ellipse key={`r${k}`} cx={rx} cy={-H + 500 + hash(seed, 20 + k) * 400} rx={40} ry={420 + hash(seed, 30 + k) * 300} fill="#b8743e"
            opacity={0.12 + wear * 0.18} />;
        })}
      </g>
      {/* the gallery's windows and sheen, the headhouse window band */}
      <Sheen d={`M40 ${-H - 150} L${W - 40} ${-H - 150}`} w={26} op={0.5} />
      {Array.from({length: Math.floor(W / 300)}, (_, i) => <rect key={i} x={80 + i * 300} y={-H - 110} width={120} height={60} rx={28} fill={dark}
        opacity={0.75} />)}
      <rect x={hx + 90} y={-3640} width={hw - 180} height={150} rx={70} fill={dark} />
      <rect x={hx + 120} y={-3620} width={(hw - 240) * 0.4} height={36} rx={18} fill="#ffffff" opacity={0.25} />
      <Sheen d={`M${hx + 60} -3740 L${hx + 60} -2900`} w={30} op={0.4} />
      {/* the leg down the face, and the truck bay arch at the foot */}
      <path d={`M${hx + hw * 0.62} -2800 L${hx + hw * 0.62} -300`} stroke={line(roof)} strokeWidth={90 + ow * 2} strokeLinecap="round" />
      <path d={`M${hx + hw * 0.62} -2800 L${hx + hw * 0.62} -300`} stroke={roof} strokeWidth={90} strokeLinecap="round" />
      <path d={`M${hx + hw * 0.62 - 20} -2780 L${hx + hw * 0.62 - 20} -320`} stroke="#ffffff" strokeWidth={22} strokeLinecap="round" opacity={0.45} />
      <path d={`M${W * 0.6} 0 L${W * 0.6} -420 Q${W * 0.6} -560 ${W * 0.6 + 220} -560 Q${W * 0.6 + 440} -560 ${W * 0.6 + 440} -420 L${W * 0.6 + 440} 0 Z`}
        fill={dark} stroke={line(conc)} strokeWidth={ow * 2} strokeLinejoin="round" />
      <path d={`M${W * 0.6 + 60} -40 L${W * 0.6 + 380} -40`} stroke="#e8c36a" strokeWidth={30} strokeLinecap="round" opacity={0.5} />
      {[0, 1, 2].map((k) => {
        const ph = (t * 0.25 + k / 3) % 1;
        return <circle key={k} cx={W * 0.6 + 220 + ph * 520 + k * 40} cy={-160 - ph * 380} r={90 + ph * 220} fill="#f2e2bd" opacity={0.4 * (1 - ph)} />;
      })}
      {label && <text x={0} y={0} transform={`translate(${W * 0.82} ${-H * 0.5}) rotate(-90)`} textAnchor="middle" fontFamily={FONT.body} fontWeight={800}
        fontSize={300} fill={shade(conc, 0.5)} opacity={0.7} letterSpacing={20}>{label}</text>}
      {/* the beacon on the headhouse */}
      <circle cx={hx + hw / 2} cy={-3910} r={44} fill={(frame % 60) < 30 ? '#ff4d4d' : '#8a2a3a'} stroke={line('#ff4d4d')} strokeWidth={ow * 1.2} />
      {(frame % 60) < 30 && <Glow x={hx + hw / 2} y={-3910} r={260} color="#ff6a5a" opacity={0.5} />}
    </g>
  );
};

// ==================================================================================== FEEDLOT PEN

/**
 * A FEEDYARD, the Panhandle's other landscape, drawn as a receding rank of pens because one pen is a
 * corral and a rank of them is a feedyard. Seen from the feed alley, a concrete bunk with a ridge of
 * feed in it, the pipe fence and its neck rail behind, and cattle at the bunk heads down and eating,
 * seen face on (the four legged rig only draws a side view, and side on they would not fit at the
 * bunk at true size). Every head bobs to its own rhythm and blinks. Coats are Angus, red, Hereford
 * and Charolais. Far pens pale into the haze. True size 1.6 m to the top rail.
 */
export const FeedlotPenV2: React.FC<FieldPlace & {pens?: number; head?: number}> = (p) => {
  const {frame = 0, seed = 6, wear = 0.5, pens = 4, head = 7} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const t = frame / 30;
  const rail = '#cfd6e6', bunk = '#c9c4cf', feed = '#e0a640';
  const coats: [string, string | null][] = [['#33262a', null], ['#a8502e', null], ['#a8502e', '#f6efe4'], ['#efe2c6', null], ['#5a3a2c', null]];
  const pen = (pi: number) => {
    const d = 1 - (pi / pens) * 0.55, hz = (c: string) => mix(c, HAZE, (1 - d) * 0.9);
    const pw = head * 66, gap = pw / head;
    const o = ow / d;
    const cows = Array.from({length: head}, (_, i) => {
      const k = hash(seed, pi * 20 + i), [coat, face] = coats[Math.floor(k * coats.length)];
      const cx = gap * (i + 0.5) + (k - 0.5) * 12;
      const bob = Math.sin(t * 2 * Math.PI / (1.6 + k * 0.9) + k * 6) * 4;
      const c = hz(coat), fc = face ? hz(face) : light(c, 0.08), ink = line(c);
      const blink = (frame + Math.floor(k * 300)) % 120 < 4;
      return {i, cx, bob, c, fc, ink, blink, k, white: !!face};
    });
    return <g key={pi} transform={`translate(${f1(pi * pw * 0.36)} ${-pi * 100}) scale(${d})`}>
      <defs><Lit id={`${id}-b${pi}`} c={hz(bunk)} x2={0} /><Cyl id={`${id}-r${pi}`} c={hz(rail)} vertical /></defs>
      {/* the bodies, shoulders and back behind the fence */}
      {cows.map((cw) => <g key={`b${cw.i}`}>
        <path d={`M${f1(cw.cx - 34)} -70 Q${f1(cw.cx - 38)} -138 ${f1(cw.cx)} -142 Q${f1(cw.cx + 38)} -138 ${f1(cw.cx + 34)} -70 Z`} fill={cw.ink}
          stroke={cw.ink} strokeWidth={o * 2} strokeLinejoin="round" />
        <path d={`M${f1(cw.cx - 34)} -70 Q${f1(cw.cx - 38)} -138 ${f1(cw.cx)} -142 Q${f1(cw.cx + 38)} -138 ${f1(cw.cx + 34)} -70 Z`}
          fill={shade(cw.c, 0.12)} />
        <ellipse cx={f1(cw.cx - 10)} cy={-128} rx={14} ry={6} fill="#ffffff" opacity={0.25} />
      </g>)}
      <Pass ow={o} parts={[
        ...[0, 1, 2, 3].map((k) => ({d: `M${k * 160} -168 L${k * 160} -40`, stroke: `url(#${id}-r${pi})`, w: 10, ink: line(hz(rail)), o: 0.7})),
        {d: `M-10 -160 L${pw + 10} -160`, stroke: hz(rail), w: 9, ink: line(hz(rail)), o: 0.7},
      ]} />
      {/* the heads, lowered under the neck rail into the bunk */}
      {cows.map((cw) => {
        const hy = -96 + cw.bob, hx = cw.cx;
        const headD = `M${f1(hx - 17)} ${f1(hy - 6)} Q${f1(hx - 19)} ${f1(hy + 34)} ${f1(hx - 11)} ${f1(hy + 52)} Q${f1(hx)} ${f1(hy + 60)} ${f1(hx + 11)} ${f1(hy + 52)} `
          + `Q${f1(hx + 19)} ${f1(hy + 34)} ${f1(hx + 17)} ${f1(hy - 6)} Q${f1(hx)} ${f1(hy - 16)} ${f1(hx - 17)} ${f1(hy - 6)} Z`;
        const neck = `M${f1(hx - 22)} -78 Q${f1(hx)} -92 ${f1(hx + 22)} -78 L${f1(hx + 15)} ${f1(hy)} L${f1(hx - 15)} ${f1(hy)} Z`;
        return <g key={`h${cw.i}`}>
          <path d={neck} fill={cw.ink} stroke={cw.ink} strokeWidth={o * 2} strokeLinejoin="round" />
          {[-1, 1].map((sd) => <path key={sd} d={ell(hx + sd * 25, hy - 2, 12, 6)} transform={`rotate(${sd * 18} ${f1(hx + sd * 25)} ${f1(hy - 2)})`}
            fill={cw.ink} stroke={cw.ink} strokeWidth={o * 2} />)}
          <path d={headD} fill={cw.ink} stroke={cw.ink} strokeWidth={o * 2} strokeLinejoin="round" />
          <path d={neck} fill={shade(cw.c, 0.06)} />
          {[-1, 1].map((sd) => <path key={sd} d={ell(hx + sd * 25, hy - 2, 12, 6)} transform={`rotate(${sd * 18} ${f1(hx + sd * 25)} ${f1(hy - 2)})`}
            fill={cw.c} />)}
          <path d={headD} fill={`url(#${id}-h${cw.white ? 'w' : ''}${pi}-${cw.i})`} />
          <defs><Ball id={`${id}-h${cw.white ? 'w' : ''}${pi}-${cw.i}`} c={cw.white ? cw.fc : cw.c} a={0.4} b={0.3} /></defs>
          {[-1, 1].map((sd) => <g key={`e${sd}`} transform={`translate(${f1(hx + sd * 9)} ${f1(hy + 12)})`}>
            {cw.blink ? <path d="M-4 0 q4 3 8 0" stroke={cw.ink} strokeWidth={o * 0.8} fill="none" strokeLinecap="round" />
              : <><ellipse rx={4.4} ry={5} fill="#ffffff" stroke={cw.ink} strokeWidth={o * 0.6} />
                <circle cx={sd * -0.6} cy={1} r={3} fill="#1f1736" /><circle cx={-1} cy={-1} r={1.1} fill="#ffffff" /></>}
          </g>)}
          <path d={`M${f1(hx - 14)} ${f1(hy + 2)} L${f1(hx - 4)} ${f1(hy + 4)} M${f1(hx + 14)} ${f1(hy + 2)} L${f1(hx + 4)} ${f1(hy + 4)}`}
            stroke={shade(cw.white ? cw.c : cw.c, 0.4)} strokeWidth={o * 0.7} strokeLinecap="round" />
        </g>;
      })}
      <Pass ow={o} parts={[
        {d: `M-10 -112 L${pw + 10} -112`, stroke: hz(rail), w: 9, ink: line(hz(rail)), o: 0.7},
        {d: `M-6 -44 Q${pw * 0.25} -56 ${pw * 0.5} -46 Q${pw * 0.75} -38 ${pw + 6} -48`, stroke: hz(feed), w: 14, ink: line(hz(feed)), o: 0.6},
        {d: rr(-20, -42, pw + 40, 42, 16), fill: `url(#${id}-b${pi})`, ink: line(hz(bunk))},
      ]} />
      <Sheen d={`M0 -34 L${pw} -34`} w={5} op={0.45} />
      <path d={`M-8 -12 L${pw + 8} -12`} stroke={shade(hz(bunk), 0.2)} strokeWidth={6} strokeLinecap="round" opacity={0.5} />
      <Sheen d={`M-6 -162 L${pw} -162`} w={3} op={0.5} />
      {wear > 0.35 && <ellipse cx={pw * 0.5 + Math.sin(t * 0.6 + pi) * 40} cy={-8} rx={pw * 0.55} ry={16} fill="#ead8b2" opacity={wear * 0.4} />}
    </g>;
  };
  return (
    <g transform={atF(p)}>
      <ContactShadow x={head * 66 * 1.1} y={6} w={head * 66 * 2.8} opacity={0.28} />
      {Array.from({length: pens}, (_, i) => pens - 1 - i).map(pen)}
    </g>
  );
};

// ===================================================================================== SOIL PROBE

/**
 * A SOIL PROBE, the sensor the prescription is built out of. A round stake between two crop rows, a
 * tilted solar panel lit with a glass sheen, a logger box with a status light and a whip antenna that
 * sways. When `reporting`, the light blinks and radio rings leave the antenna, and in the faint
 * cutaway under the soil the moisture rings on the buried half pulse one after another down the
 * probe, which is the part that does the measuring and the part nobody can see. Plain hardware, no
 * face. True size 1.4 m.
 */
export const SoilProbeV2: React.FC<FieldPlace & {reporting?: boolean}> = (p) => {
  const {frame = 0, seed = 7, wear = 0.3, reporting = true} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const t = frame / 30;
  const post = '#9aa6c4', pv = '#2f56c8', box = '#f2f4f8', leaf = '#5f9e3a', soil = '#b97a46';
  const blink = reporting && (frame % 45) < 8;
  const sway = Math.sin(t * 2.1 + seed) * 2.2;
  /** a young crop plant either side of the stake, a low fan of lit leaves from one crown, nodding */
  const plant = (cx: number, s: number, k: number): Part[] => {
    const nod = Math.sin(t * 1.4 + k) * 3;
    const leafP = (ang: number, len: number, wid: number): Part => {
      const a = (ang + nod) * Math.PI / 180, ux = Math.sin(a), uy = -Math.cos(a);
      const tx = cx + ux * len * s, ty = uy * len * s, mx = cx + ux * len * s * 0.5, my = uy * len * s * 0.5;
      const px = -uy * wid * s, py = ux * wid * s;
      return {d: `M${f1(cx)} 0 Q${f1(mx + px)} ${f1(my + py)} ${f1(tx)} ${f1(ty)} Q${f1(mx - px)} ${f1(my - py)} ${f1(cx)} 0 Z`, fill: `url(#${id}-lf)`, ink: line(leaf)};
    };
    return [leafP(-72, 30, 8), leafP(72, 28, 8), leafP(-38, 34, 9), leafP(40, 33, 9), leafP(-4, 30, 8)];
  };
  return (
    <g transform={atF(p)}>
      <defs><Cyl id={`${id}-p`} c={post} /><linearGradient id={`${id}-pv`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={light(pv, 0.35)} />
        <stop offset="100%" stopColor={shade(pv, 0.4)} /></linearGradient><Lit id={`${id}-bx`} c={box} /><Ball id={`${id}-lf`} c={leaf} a={0.45} b={0.34} />
        <radialGradient id={`${id}-cut`} cx="50%" cy="20%" r="80%"><stop offset="0%" stopColor={shade(soil, 0.25)} stopOpacity={0.55} />
          <stop offset="100%" stopColor={shade(soil, 0.25)} stopOpacity={0} /></radialGradient></defs>
      {/* the cutaway under the row, the buried half and its moisture rings */}
      <ellipse cx={0} cy={12} rx={24} ry={14} fill={`url(#${id}-cut)`} />
      <path d="M0 3 L0 22" stroke={line(post)} strokeWidth={6.4} strokeLinecap="round" opacity={0.55} />
      <path d="M0 3 L0 22" stroke={post} strokeWidth={4} strokeLinecap="round" opacity={0.6} />
      {[8, 14, 20].map((yy, k) => {
        const on = reporting ? Math.max(0, Math.sin(t * 3 - k * 1.2)) : 0;
        return <g key={k}><ellipse cx={0} cy={yy} rx={6} ry={2.4} fill="#38c2f2" opacity={0.35 + on * 0.6} />
          {on > 0.4 && <ellipse cx={0} cy={yy} rx={6 + on * 9} ry={2.4 + on * 2} fill="none" stroke="#7fe0ff" strokeWidth={1.2} opacity={on * 0.7} />}</g>;
      })}
      <ContactShadow x={0} y={2} w={60} opacity={0.32} />
      <Pass ow={ow} parts={[...plant(-36, 1, 0), ...plant(38, 0.85, 2)]} />
      <path d={ell(0, 0, 12, 3.5)} fill={shade(soil, 0.1)} />
      <Pass ow={ow} parts={[
        {d: rr(-3.4, -112, 6.8, 112, 3.4), fill: `url(#${id}-p)`, ink: line(post)},
        {d: `M2 -108 Q${3 + sway * 0.4} -128 ${6 + sway} -146`, stroke: '#4a4f6e', w: 1.6, ink: line('#4a4f6e'), o: 0.4},
        {d: rr(-11, -88, 22, 26, 7), fill: `url(#${id}-bx)`, ink: line('#c9cfdf')},
        {d: rr(-22, -126, 44, 22, 5), fill: `url(#${id}-pv)`, ink: line(pv), t: 'rotate(-16 0 -115)'},
      ]} />
      <g transform="rotate(-16 0 -115)">
        {[1, 2, 3].map((k) => <path key={k} d={`M${-22 + k * 11} -124 L${-22 + k * 11} -106`} stroke="#8fb0ff" strokeWidth={0.8} opacity={0.6} />)}
        <path d="M-19 -121 L-4 -121" stroke="#ffffff" strokeWidth={2.4} strokeLinecap="round" opacity={0.6} />
      </g>
      <circle cx={6 + sway} cy={-147} r={2.2} fill="#e9edf7" stroke={line('#e9edf7')} strokeWidth={ow * 0.6} />
      <circle cx={0} cy={-76} r={3.2} fill={blink ? '#7dff8a' : '#2f7a4a'} stroke={line('#c9cfdf')} strokeWidth={ow * 0.5} />
      {blink && <Glow x={0} y={-76} r={14} color="#7dff8a" opacity={0.6} />}
      <Sheen d="M-1.6 -108 L-1.6 -6" w={1.4} op={0.5} />
      {reporting && [0, 1, 2].map((k) => {
        const ph = (t * 0.7 + k / 3) % 1;
        return <path key={k} d={`M${f1(6 + sway - 8 - ph * 22)} ${f1(-150 - ph * 10)} A${f1(10 + ph * 24)} ${f1(10 + ph * 24)} 0 0 1 ${f1(6 + sway + 8 + ph * 22)} ${f1(-150 - ph * 10)}`}
          stroke="#38f2e0" strokeWidth={1.8} fill="none" strokeLinecap="round" opacity={f1((1 - ph) * 0.8)} />;
      })}
      {wear > 0.25 && <ellipse cx={1.2} cy={-50} rx={1.6} ry={12} fill="#c06a32" opacity={wear * 0.6} />}
    </g>
  );
};

// ==================================================================================== HERD SENSOR

/**
 * A CATTLE EAR TAG, 75 mm across, at true scale. A lit plastic panel on a neck up to the round button
 * that pins it through the ear, the electronic chip as a raised disc, the printed bars, and a gentle
 * swing on the button as the animal moves its head. `alert` rings it with a pulsing amber halo. At
 * `scale` 1 beside an animal it is almost too small to see, which is the honest picture. No face.
 */
export const HerdSensorV2: React.FC<FieldPlace & {tint?: string; alert?: boolean}> = (p) => {
  const {frame = 0, tint = '#f2c73a', alert = false, seed = 1} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const t = frame / 30;
  const swing = Math.sin(t * 2 * Math.PI / 2.4 + seed) * 5;
  const pulse = alert ? 0.5 + 0.5 * Math.abs(Math.sin(t * 2.6)) : 0;
  const body = 'M-3.3 -1.6 Q-3.4 -3.3 -1.4 -3.5 L-0.8 -4.6 L0.8 -4.6 L1.4 -3.5 Q3.4 -3.3 3.3 -1.6 L3.1 3.0 Q3.0 4.4 1.6 4.5 L-1.6 4.5 Q-3.0 4.4 -3.1 3.0 Z';
  return (
    <g transform={atF(p, false)}>
      <defs><Lit id={`${id}-t`} c={tint} x2={0.6} /><Ball id={`${id}-b`} c={shade(tint, 0.15)} a={0.6} /></defs>
      {alert && <><Glow x={0} y={0} r={11} color="#ff9a3a" opacity={0.55 * pulse} />
        <circle cx={0} cy={0} r={5.6 + pulse * 1.4} fill="none" stroke="#ff8a2a" strokeWidth={ow * 1.4} opacity={0.4 + pulse * 0.5} /></>}
      <g transform={`rotate(${f1(swing)} 0 -4.6)`}>
        <Pass ow={ow} parts={[{d: body, fill: `url(#${id}-t)`, ink: line(tint)}, {d: circ(0, -4.6, 1.15), fill: `url(#${id}-b)`, ink: line(tint)}]} />
        <path d={circ(0, -4.6, 0.45)} fill={shade(tint, 0.45)} />
        <path d={circ(0, -1.4, 1.05)} fill={light(tint, 0.25)} stroke={shade(tint, 0.25)} strokeWidth={ow * 0.6} />
        <path d={circ(-0.3, -1.7, 0.35)} fill="#ffffff" opacity={0.6} />
        <path d={rr(-2.0, 1.0, 4.0, 0.62, 0.31)} fill={shade(tint, 0.55)} opacity={0.8} />
        <path d={rr(-2.0, 2.2, 2.8, 0.62, 0.31)} fill={shade(tint, 0.55)} opacity={0.8} />
        <Sheen d="M-2.6 -2.2 Q-2.8 0.6 -2.5 3.2" w={0.5} op={0.55} />
      </g>
    </g>
  );
};

// ================================================================================= GROUND SECTION

/**
 * A CUT THROUGH THE GROUND, for the aquifer the beat is about. Visibly a diagram, as the library
 * meant, a rounded block of earth with the crop standing on its top edge, banded unsaturated soil, a
 * water table that breathes, saturated sand and gravel lit blue with grains in it (water in sand, not
 * a lake), bedrock at the foot, and the historic level as a dashed ghost line only when it is given.
 * Every word on it comes from `labels` and it prints no number of its own. Screen units, like the
 * library's.
 */
export const GroundSectionV2: React.FC<{x?: number; y?: number; w?: number; h?: number; frame?: number; seed?: number; waterTable?: number;
  historicTable?: number; labels?: {top?: string; table?: string; historic?: string; base?: string}}> = ({
  x = 0, y = 0, w = 620, h = 300, frame = 0, seed = 8, waterTable = 0.45, historicTable, labels = {},
}) => {
  const id = useUid();
  const t = frame / 30;
  const soil = '#d39a5e', wet = '#3f9fd6', rock = '#7d6c96', leaf = '#5f9e3a';
  const wt = y + h * Math.max(0.05, Math.min(0.95, waterTable));
  const ht = historicTable === undefined ? undefined : y + h * Math.max(0.05, Math.min(0.95, historicTable));
  const R = Math.min(28, h * 0.12), base = y + h - Math.max(18, h * 0.08);
  const wave = (yy: number, amp: number, ph: number) => {
    const pts = Array.from({length: 13}, (_, i) => `${f1(x + (i / 12) * w)} ${f1(yy + Math.sin(i * 0.9 + ph) * amp)}`);
    return `M${pts.join(' L')}`;
  };
  const table = wave(wt, 2.2, t * 1.6);
  const shimmer = ((t * 0.25) % 1) * w;
  return (
    <g>
      <defs>
        <clipPath id={`${id}-c`}><rect x={x} y={y} width={w} height={h} rx={R} /></clipPath>
        <linearGradient id={`${id}-s`} gradientUnits="userSpaceOnUse" x1={0} y1={y} x2={0} y2={wt}>
          <stop offset="0%" stopColor={light(soil, 0.2)} /><stop offset="100%" stopColor={shade(soil, 0.14)} /></linearGradient>
        <linearGradient id={`${id}-w`} gradientUnits="userSpaceOnUse" x1={0} y1={wt} x2={0} y2={base}>
          <stop offset="0%" stopColor={light(wet, 0.15)} /><stop offset="100%" stopColor={shade(wet, 0.35)} /></linearGradient>
        <linearGradient id={`${id}-r`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={light(rock, 0.2)} /><stop offset="100%" stopColor={shade(rock, 0.3)} />
        </linearGradient>
      </defs>
      <rect x={x + 6} y={y + 10} width={w} height={h} rx={R} fill="#1a1236" opacity={0.18} />
      {/* the crop standing on the top edge, outside the cut */}
      {Array.from({length: Math.max(6, Math.floor(w / 46))}, (_, i) => {
        const n = Math.max(6, Math.floor(w / 46)), cx = x + R + (i + 0.5) * ((w - R * 2) / n), s = Math.min(1.4, h / 300) * (0.85 + hash(seed, i) * 0.3);
        const bend = Math.sin(t * 1.3 + i * 0.7) * 2.5;
        return <g key={i} transform={`translate(${f1(cx)} ${y}) scale(${f1(s)})`}>
          {[[-1, 18], [1, 22], [-1, 28], [1, 14]].map(([sd, l], j) => {
            const d = `M0 2 Q${sd * l * 0.2} ${-l * 0.9} ${sd * l * 0.75 + bend} ${-l * 0.95} Q${sd * l * 0.35} ${-l * 0.45} 0 2 Z`;
            return <g key={j}><path d={d} fill={line(leaf)} stroke={line(leaf)} strokeWidth={3} strokeLinejoin="round" />
              <path d={d} fill={j % 2 ? leaf : light(leaf, 0.15)} /></g>;
          })}
        </g>;
      })}
      <g clipPath={`url(#${id}-c)`}>
        <rect x={x} y={y} width={w} height={wt - y} fill={`url(#${id}-s)`} />
        <rect x={x} y={y} width={w} height={Math.min(h * 0.07, wt - y)} fill={shade(soil, 0.4)} />
        {[0.32, 0.62].map((u, k) => wt - y > h * 0.15 && <path key={k} d={`${wave(y + (wt - y) * u, 4, k * 2)} L${x + w} ${f1(y + (wt - y) * u + 10)} `
          + `L${x} ${f1(y + (wt - y) * u + 10)} Z`} fill={k ? shade(soil, 0.08) : light(soil, 0.1)} opacity={0.55} />)}
        {Array.from({length: 26}, (_, i) => <ellipse key={i} cx={f1(x + hash(seed, i) * w)} cy={f1(y + h * 0.1 + hash(seed, 50 + i) * Math.max(4, wt - y - h * 0.14))}
          rx={f1(2 + hash(seed, 99 + i) * 4)} ry={f1(1.4 + hash(seed, 140 + i) * 2.4)} fill={shade(soil, 0.3)} opacity={0.5} />)}
        <rect x={x} y={wt} width={w} height={base - wt} fill={`url(#${id}-w)`} />
        {Array.from({length: 80}, (_, i) => {
          const gy = wt + 6 + hash(seed, 200 + i) * Math.max(2, base - wt - 10), gr = 1.6 + hash(seed, 300 + i) * 3;
          return <circle key={i} cx={f1(x + hash(seed, 400 + i) * w)} cy={f1(gy)} r={f1(gr)} fill="#f1d9a8" opacity={0.35 + hash(seed, 500 + i) * 0.3} />;
        })}
        {Array.from({length: 7}, (_, i) => {
          const tw = Math.max(0, Math.sin(t * 2.2 + i * 1.9));
          return <circle key={`s${i}`} cx={f1(x + hash(seed, 600 + i) * w)} cy={f1(wt + 10 + hash(seed, 700 + i) * Math.max(4, base - wt - 20))} r={f1(1 + tw * 2.6)}
            fill="#ffffff" opacity={f1(tw * 0.8)} />;
        })}
        <path d={`${wave(base, 3, 1.3)} L${x + w} ${y + h} L${x} ${y + h} Z`} fill={`url(#${id}-r)`} />
        {[0.2, 0.55, 0.8].map((u, k) => <path key={k} d={`M${f1(x + w * u)} ${f1(base + 4)} l6 8 l-4 6`} stroke={shade(rock, 0.4)} strokeWidth={2} fill="none"
          strokeLinecap="round" strokeLinejoin="round" />)}
        <path d={table} stroke={line(wet)} strokeWidth={7} fill="none" strokeLinecap="round" />
        <path d={table} stroke="#d8f6ff" strokeWidth={3.6} fill="none" strokeLinecap="round" />
        <ellipse cx={x + shimmer} cy={wt} rx={30} ry={3} fill="#ffffff" opacity={0.7} />
        {ht !== undefined && <g>
          <path d={`M${x} ${ht} L${x + w} ${ht}`} stroke={line('#f4ead2')} strokeWidth={5} strokeDasharray="12 10" strokeLinecap="round" />
          <path d={`M${x} ${ht} L${x + w} ${ht}`} stroke="#f4ead2" strokeWidth={2.4} strokeDasharray="12 10" strokeLinecap="round" />
        </g>}
      </g>
      <rect x={x} y={y} width={w} height={h} rx={R} fill="none" stroke={line(soil)} strokeWidth={6} />
      <path d={`M${x + R} ${y + 3} L${x + w - R} ${y + 3}`} stroke="#ffffff" strokeWidth={3} strokeLinecap="round" opacity={0.3} />
      {labels.top && <Label x={x + 16} y={y + 30} text={labels.top} fs={19} />}
      {labels.table && <Label x={x + w - 16} y={wt - 12} text={labels.table} fs={19} anchor="end" />}
      {labels.historic && ht !== undefined && <Label x={x + w - 16} y={ht - 10} text={labels.historic} fs={17} anchor="end" op={0.9} />}
      {labels.base && <Label x={x + 16} y={base - 10} text={labels.base} fs={17} />}
    </g>
  );
};

export const AGRICULTURE_V2 = ['CentrePivotDepthV2', 'CropRowsV2', 'GrainElevatorV2', 'FeedlotPenV2', 'SoilProbeV2', 'HerdSensorV2',
  'GroundSectionV2'] as const;
