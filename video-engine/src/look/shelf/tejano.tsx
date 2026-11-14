import React from 'react';
import {M} from '../../lib/scale';
import {FONT} from '../../lib/type';
import {light, line, mix, shade} from '../color';
import {ContactShadow, Glow, useUid} from '../Kit';
import {Figure, SKIN_TONES} from '../Figure';
import type {Place} from '../machines';
import {taper} from '../props';

/**
 * TEJANO, LOOK V2 (November 14th, 2026).
 *
 * The Mexican-American and border Texas set from lib/tejano.tsx, redrawn in the v2 idiom. The paletero's
 * cart, the panaderia rack, the raspa stand and the raspa in its cup, the conjunto accordion and bajo
 * sexto, the lowrider, the yard shrine, the tiendita and its painted rotulo, the colonia block, the
 * pedestrian bridge, the escaramuza rider, the seven point star pinata, the comal and the photograph
 * wall. Each one is round, lit from the upper left, outlined in its own deep hue, grounded and alive
 * on `frame`.
 *
 * Every rule written in the library header still holds here. This community is drawn as it lives,
 * with no sombrero, no serape, no sleeping figure, no restaurant chile lights and no Santa Fe
 * turquoise. The colour is loud where the real thing is loud (the syrups, the conchas, the candy
 * paint, the tissue) and the heat comes from light, never from draining the saturation. The shrine
 * figure stays a silhouette in its niche. The people come only from the cast rig in look/Figure.tsx,
 * and no drawing carries a brand, a logo or a named person. The horse is the only animal and the only
 * face beyond the cast, because the cart, the car and the instruments are objects and stay objects.
 *
 * PLACEMENT is the library's. x and y sit at the ground (the accordion and the comal at their centre,
 * the pinata at its core, as the library places them), `scale` 1 is true size through the one metre
 * in lib/scale.ts, and every drawing is built in centimetres. Where the library took a width in its
 * own local units (`w` on the rack, the stand, the tiendita, the colonia block, the bridge and the
 * photograph wall) the v2 drawing takes `w` in centimetres, with a default that matches the library's
 * true width.
 *
 * Measurements follow TEJANO_M (cart box 1.0 m, rack 1.9 m, raspa stand 3.0 m, cup 0.2 m, accordion
 * 0.42 m, bajo sexto 1.05 m, lowrider 1.32 m, shrine 1.6 m, rotulo 4.0 m, colonia 3.4 m, bridge mesh
 * 3.4 m, pinata 0.9 m across, comal 0.3 m across, photograph wall 2.2 m). The escaramuza is drawn to
 * a real horse, 1.5 m at the withers, so the rider sits higher than the library's smaller horse.
 */
const CM = M / 100;
type Pt = [number, number];
const at = (p: Place) =>
  `translate(${p.x ?? 0} ${p.y ?? 0}) scale(${(p.scale ?? 1) * CM * (p.facing ?? 1)} ${(p.scale ?? 1) * CM})`;
/** half the film line width in a drawing's centimetres, so the outline reads about 6.8 film pixels */
const owOf = (p: Place) => 3.4 / ((p.scale ?? 1) * CM);
const rnd = (s: number, i: number) => {
  const v = Math.sin(s * 127.1 + i * 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const f1 = (p: Pt) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
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
const ell = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;

/** a lit material, light at the upper left through the colour to violet shade at the lower right */
const Lit: React.FC<{id: string; c: string; x2?: number; y2?: number; k?: number}> = ({id, c, x2 = 0.4, y2 = 1, k = 1}) => (
  <linearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
    <stop offset="0%" stopColor={light(c, 0.42 * k)} /><stop offset="48%" stopColor={c} />
    <stop offset="100%" stopColor={shade(c, 0.34 * k)} />
  </linearGradient>
);
/** a round body lit from the upper left */
const Rad: React.FC<{id: string; c: string; k?: number}> = ({id, c, k = 1}) => (
  <radialGradient id={id} cx="34%" cy="28%" r="80%">
    <stop offset="0%" stopColor={light(c, 0.5 * k)} /><stop offset="55%" stopColor={c} />
    <stop offset="100%" stopColor={shade(c, 0.36 * k)} />
  </radialGradient>
);

/**
 * One piece of a joined drawing, a filled shape (f) or a stroked tube (s, w). Every piece of a joined
 * group is outlined first in its own deep hue and filled after, so no seam shows where parts meet.
 */
type Pc = {d: string; f?: string; s?: string; w?: number; k: string; t?: string};
const Pass: React.FC<{list: Pc[]; ow: number}> = ({list, ow}) => <>
  {list.map((q, i) => q.s
    ? <path key={`o${i}`} d={q.d} transform={q.t} fill="none" stroke={q.k} strokeWidth={(q.w ?? 1) + ow * 2} strokeLinecap="round"
      strokeLinejoin="round" />
    : <path key={`o${i}`} d={q.d} transform={q.t} fill={q.k} stroke={q.k} strokeWidth={ow * 2} strokeLinejoin="round" />)}
  {list.map((q, i) => q.s
    ? <path key={`f${i}`} d={q.d} transform={q.t} fill="none" stroke={q.s} strokeWidth={q.w} strokeLinecap="round" strokeLinejoin="round" />
    : <path key={`f${i}`} d={q.d} transform={q.t} fill={q.f} />)}
</>;
const pc = (d: string, f: string, base: string, t?: string): Pc => ({d, f, k: line(base), t});
const tb = (d: string, c: string, w: number): Pc => ({d, s: c, w, k: line(c)});
/** a soft cream sheen on the lit side of a form */
const Sheen: React.FC<{d: string; w: number; o?: number}> = ({d, w, o = 0.5}) =>
  <path d={d} stroke="#fffbef" strokeWidth={w} strokeLinecap="round" fill="none" opacity={o} />;

/** the small two-stroke flame of a candle or a votive, flickering on frame */
const Flame: React.FC<{x: number; y: number; s: number; frame: number; seed: number}> = ({x, y, s, frame, seed}) => {
  const fl = 1 + Math.sin(frame * 0.9 + seed * 2.1) * 0.12 + Math.sin(frame * 2.3 + seed) * 0.06;
  const lean = Math.sin(frame * 0.5 + seed) * 0.12 * s;
  return <g transform={`translate(${x} ${y})`}>
    <path d={`M0 0 C${-s * 0.55} ${-s * 0.4} ${-s * 0.2 + lean} ${-s * 1.2 * fl} ${lean * 1.5} ${-s * 1.6 * fl} C${s * 0.3 + lean} ${-s * 1.1 * fl}
      ${s * 0.55} ${-s * 0.4} 0 0 Z`} fill="#ffb53d" />
    <path d={`M0 ${-s * 0.1} C${-s * 0.25} ${-s * 0.35} ${-s * 0.1} ${-s * 0.8 * fl} ${lean} ${-s * 1.0 * fl} C${s * 0.15} ${-s * 0.7 * fl}
      ${s * 0.25} ${-s * 0.35} 0 ${-s * 0.1} Z`} fill="#fff4c4" />
  </g>;
};

export interface TejanoPropsV2 extends Place {
  wear?: number;
  night?: boolean;
}

// ============================================================================ the paletero's cart

const FLAVOURS: {c: string; dot?: string; rind?: string}[] = [
  {c: '#d8323f', dot: '#ffd6d2'},              // fresa, seeds showing
  {c: '#f39a2b'},                              // mango
  {c: '#f2647e', dot: '#2a1d24', rind: '#4fa65a'},   // sandia, rind stripe and black seeds
  {c: '#f6efe2', dot: '#9a7a58'},              // coco, flecks
  {c: '#c6e35e'},                              // limon
  {c: '#a9d483', dot: '#c2452d'},              // pepino con chile, brick red dust
  {c: '#9a5a34', dot: '#d9a066'},              // tamarindo
  {c: '#ead2a2', dot: '#8a5a34'},              // nuez
];

/**
 * THE PALETERO'S CART. Two big spoked wheels at the back and one small swivel caster under the front,
 * so the cart sits nose down. A cream freezer box with the stainless rim, a picture panel of the
 * flavours (fresa with its seeds, mango, sandia with the green rind and black seeds, coco, limon,
 * pepino con chile dusted brick red, tamarindo, nuez), the push bar at stroller height with four copper
 * bells on the grip that swing, and a striped canopy that sways. A plain object, so no face.
 * `flavours` is how many paletas the panel shows, up to eight.
 */
export const PaleteroCartV2: React.FC<TejanoPropsV2 & {umbrella?: boolean; flavours?: number}> = (p) => {
  const {frame = 0, seed = 121, wear = 0.4, umbrella = true, flavours = 16} = p;
  const id = useUid(), ow = owOf(p), t = frame / 30;
  const box = '#f7f1e3', band = '#e03a3e', chrome = '#cdd5e6', tire = '#2c2838', cream = '#fff6e4';
  const n = Math.max(1, Math.min(8, flavours));
  const sway = Math.sin(t * 2 * Math.PI / 3.4 + seed) * 1.4;
  const cx = 40;
  const canopyD = (() => {
    let d = `M${cx - 97} -186 C${cx - 84} -226 ${cx + 84} -226 ${cx + 97} -186 `;
    for (let i = 6; i > 0; i--) {
      const x0 = cx - 97 + i * (194 / 6), x1 = cx - 97 + (i - 1) * (194 / 6);
      d += `Q${(x0 + x1) / 2} -170 ${x1} -186 `;
    }
    return d + 'Z';
  })();
  return (
    <g transform={at(p)}>
      <defs>
        <Lit id={`${id}-b`} c={box} /><Lit id={`${id}-r`} c={band} /><Rad id={`${id}-cu`} c="#e0883a" k={1.1} />
        <clipPath id={`${id}-cn`}><path d={canopyD} /></clipPath>
      </defs>
      <ContactShadow x={-4} y={2} w={250} opacity={0.32} />
      {/* the canopy and its pole, swaying a touch about the box */}
      {umbrella && <g transform={`rotate(${sway} ${cx} -100)`}>
        <Pass ow={ow} list={[tb(`M${cx} -100 L${cx} -214`, '#8d8aa6', 4)]} />
        <path d={canopyD} fill={line(band)} stroke={line(band)} strokeWidth={ow * 2} strokeLinejoin="round" />
        <g clipPath={`url(#${id}-cn)`}>
          {Array.from({length: 6}, (_, i) => {
            const x0 = cx - 97 + i * (194 / 6), x1 = x0 + 194 / 6;
            return <path key={i} d={`M${cx} -224 L${x0 - 4} -160 L${x1 + 4} -160 Z`} fill={i % 2 ? cream : band} />;
          })}
          <path d={`M${cx - 110} -170 C${cx - 70} -205 ${cx - 10} -230 ${cx + 40} -230 L${cx + 120} -230 L${cx + 120} -150 Z`}
            fill={shade(band, 0.4)} opacity={0.22} transform={`translate(30 30)`} />
          <path d={`M${cx - 70} -200 Q${cx - 30} -218 ${cx + 10} -220`} stroke="#ffffff" strokeWidth={5} strokeLinecap="round" fill="none"
            opacity={0.45} />
        </g>
        <circle cx={cx} cy={-217} r={4} fill={chrome} stroke={line(chrome)} strokeWidth={ow} />
      </g>}
      {/* the front caster on its swivel fork, small, so the nose sits low */}
      <Pass ow={ow} list={[tb('M-60 -26 L-60 -14', '#8d8aa6', 3.5)]} />
      <circle cx={-60} cy={-9} r={9} fill={tire} stroke={line(tire)} strokeWidth={ow * 2} />
      <circle cx={-60} cy={-9} r={3.5} fill={chrome} />
      <g transform="rotate(-3 48 -24)">
        {/* the push bar at stroller height, then the box, outlines first so the joins are seamless */}
        <Pass ow={ow} list={[
          tb('M70 -74 L104 -112 L86 -116', chrome, 3.6),
          pc(rr(-76, -96, 152, 66, 11), `url(#${id}-b)`, box),
          pc(rr(-79, -103, 158, 11, 5.5), chrome, chrome),
        ]} />
        <path d="M100 -110 L88 -113" stroke="#2d2838" strokeWidth={4.4} strokeLinecap="round" />
        <rect x={-74} y={-92} width={148} height={10} rx={5} fill={`url(#${id}-r)`} />
        <text x={-4} y={-84} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={8.4} fill={cream}
          letterSpacing={1.6}>PALETAS</text>
        {/* the picture panel of the flavours */}
        <rect x={-66} y={-78} width={124} height={42} rx={7} fill={cream} stroke={line(box)} strokeWidth={ow * 0.6} />
        {Array.from({length: n}, (_, i) => {
          const col = i % 4, row = Math.floor(i / 4), fl = FLAVOURS[(i + seed) % FLAVOURS.length];
          const px = -50 + col * 30 + (n <= 4 ? 0 : 0), py = n <= 4 ? -57 : -67 + row * 21;
          return <g key={i} transform={`translate(${px} ${py}) scale(${n <= 4 ? 1.2 : 0.9})`}>
            <rect x={-1.6} y={4} width={3.2} height={7} rx={1.6} fill="#e6c48e" />
            <path d={rr(-7, -10, 14, 16, 6)} fill={fl.c} stroke={line(fl.c)} strokeWidth={ow * 0.45} />
            {fl.rind && <path d="M-7 3 H7 V3.5 Q7 6 4.6 6 H-4.6 Q-7 6 -7 3.5 Z" fill={fl.rind} />}
            {fl.dot && [[-3, -5], [2.5, -3], [-1, 1], [3, 2.5], [-3.5, -0.5]].map(([dx, dy], k) =>
              <circle key={k} cx={dx} cy={dy} r={0.8} fill={fl.dot} />)}
            <path d="M-4.4 -7 L-4.4 -1" stroke="#ffffff" strokeWidth={1.6} strokeLinecap="round" opacity={0.55} />
          </g>;
        })}
        {/* the lid seam and its handle, and a sheen along the lit top */}
        <path d="M-70 -34 H70" stroke={shade(box, 0.2)} strokeWidth={1.6} strokeLinecap="round" />
        <Sheen d="M-66 -100 L40 -100" w={2.4} o={0.7} />
        {wear > 0.3 && <rect x={-76} y={-44} width={152} height={14} rx={7} fill="#cdb98e" opacity={wear * 0.35} />}
        {/* the big spoked wheel at the back corner */}
        <g transform="translate(48 -24)">
          <circle r={24} fill={tire} stroke={line(tire)} strokeWidth={ow * 2} />
          <circle r={19} fill={mix(chrome, '#ffffff', 0.25)} />
          <circle r={16.5} fill={shade(chrome, 0.12)} />
          {Array.from({length: 12}, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <path key={i} d={`M0 0 L${(Math.cos(a) * 16.5).toFixed(1)} ${(Math.sin(a) * 16.5).toFixed(1)}`} stroke="#f2f5fb"
              strokeWidth={Math.max(0.8, ow * 0.3)} />;
          })}
          <circle r={4} fill={chrome} stroke={line(chrome)} strokeWidth={ow * 0.6} />
          <path d="M-14 -14 A20 20 0 0 1 4 -20" stroke="#ffffff" strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.6} />
        </g>
        {/* the copper bells on the grip, each swinging on its own beat */}
        {[0, 1, 2, 3].map((i) => {
          const bx = 101 - i * 4.6, by = -112 - i * 0.6 + 1.5;
          const a = Math.sin(t * 2 * Math.PI * 1.1 + i * 1.3 + seed) * 16;
          return <g key={i} transform={`translate(${bx} ${by}) rotate(${a})`}>
            <path d="M-3.4 6.4 Q-3.4 0.6 0 0.6 Q3.4 0.6 3.4 6.4 L4 7.4 H-4 Z" fill={`url(#${id}-cu)`} stroke={line('#e0883a')}
              strokeWidth={ow * 0.5} strokeLinejoin="round" />
            <circle cx={0} cy={8.4} r={1.2} fill="#7a3d18" />
          </g>;
        })}
      </g>
    </g>
  );
};

// ============================================================================ the panaderia rack

const CRUST = ['#f0a9b8', '#f5e09a', '#8a5636'];   // chalky rose, butter, cocoa
const BREAD = '#e0a865';

/** one pan dulce, drawn by its scoring, about 14 cm across, standing on y 0 */
const Pan: React.FC<{kind: number; crust: string; ow: number}> = ({kind, crust, ow}) => {
  const lw = ow * 0.45;
  switch (kind) {
    case 0:   // concha, a dome with the sugar paste scored in arcs from an off-centre point
      return <g>
        <path d={ell(0, -4.2, 7.4, 4.6)} fill={BREAD} stroke={line(BREAD)} strokeWidth={lw} />
        <path d="M-6.8 -5.4 Q-6.6 -10.4 0 -10.6 Q6.6 -10.4 6.8 -5.4 Q0 -3.8 -6.8 -5.4 Z" fill={crust} stroke={line(crust)}
          strokeWidth={lw * 0.8} />
        {[-0.9, -0.3, 0.3, 0.9].map((a, k) => <path key={k} d={`M-2.6 -4.6 Q${(Math.sin(a) * 5 - 1.5).toFixed(1)} ${(-9 - Math.cos(a) * 1.4).toFixed(1)}
          ${(Math.sin(a) * 7.4).toFixed(1)} ${(-4.6 - Math.cos(a) * 5.2).toFixed(1)}`} stroke={mix(BREAD, crust, 0.35)} strokeWidth={0.9}
          fill="none" strokeLinecap="round" />)}
        <ellipse cx={-3} cy={-9} rx={2} ry={0.9} fill="#ffffff" opacity={0.6} />
      </g>;
    case 1:   // cuernito, a rolled crescent with its turns showing
      return <g>
        <path d="M-7.6 -1 Q-6 -9 0 -9.4 Q6 -9 7.6 -1 Q5.4 -4 0 -4.4 Q-5.4 -4 -7.6 -1 Z" fill="#d9944a" stroke={line('#d9944a')}
          strokeWidth={lw} strokeLinejoin="round" />
        {[-3.4, 0, 3.4].map((x, k) => <path key={k} d={`M${x - 1} -4.6 Q${x} -7 ${x + 1} -9`} stroke="#a8682e" strokeWidth={0.9} fill="none"
          strokeLinecap="round" />)}
        <path d="M-3.6 -8 Q0 -9 3 -8.4" stroke="#ffe6b8" strokeWidth={1} fill="none" opacity={0.7} strokeLinecap="round" />
      </g>;
    case 2:   // oreja, a flat heart of two spirals with caramelised edges
      return <g>
        <path d="M0 -0.6 C-4 -1 -7.6 -4 -6.6 -7.4 C-5.6 -10.2 -1.6 -10 0 -7.2 C1.6 -10 5.6 -10.2 6.6 -7.4 C7.6 -4 4 -1 0 -0.6 Z"
          fill="#c98440" stroke={line('#c98440')} strokeWidth={lw} strokeLinejoin="round" />
        <path d="M-0.6 -3 C-4 -3.6 -5.4 -6 -4 -7.6 C-3 -8.4 -1.6 -7.6 -2.2 -6.4" stroke="#8a4f22" strokeWidth={0.9} fill="none" />
        <path d="M0.6 -3 C4 -3.6 5.4 -6 4 -7.6 C3 -8.4 1.6 -7.6 2.2 -6.4" stroke="#8a4f22" strokeWidth={0.9} fill="none" />
      </g>;
    case 3:   // empanada, a half moon with a crimped edge and two fork vents
      return <g>
        <path d="M-7.4 -0.6 A7.4 7.4 0 0 1 7.4 -0.6 Z" fill={BREAD} stroke={line(BREAD)} strokeWidth={lw} strokeLinejoin="round" />
        {Array.from({length: 7}, (_, k) => <circle key={k} cx={-6.4 + k * 2.13} cy={-1.4} r={0.9} fill="#c48a4a" />)}
        <path d="M-1.6 -6 V-3.6 M1.6 -6 V-3.6" stroke="#a8682e" strokeWidth={0.9} strokeLinecap="round" />
        <ellipse cx={-3} cy={-5.2} rx={1.6} ry={0.8} fill="#ffffff" opacity={0.5} />
      </g>;
    default:  // marranito, a dense gingerbread pig with one dot for an eye
      return <g>
        <path d="M-7.6 -0.6 Q-8.4 -6 -4 -7.4 Q0 -8.6 3.6 -7.6 L5 -9.4 L5.6 -7 Q8.2 -5.6 7.6 -2.6 L8.2 -1.4 Q8 -0.6 6.6 -0.6 Z" fill="#7d4a26"
          stroke={line('#7d4a26')} strokeWidth={lw} strokeLinejoin="round" />
        <circle cx={4.6} cy={-4.8} r={0.8} fill="#2a1710" />
        <path d="M-5 -6.4 Q-1 -7.6 2 -7" stroke="#b07a4a" strokeWidth={0.9} fill="none" strokeLinecap="round" />
      </g>;
  }
};

/**
 * THE PANADERIA RACK. Open steel shelving on casters with full sheet pans, never a sealed glass case.
 * Each pan carries the pan dulce drawn by its scoring, conchas in the three canonical crusts (a chalky
 * rose, a pale butter, a cocoa), cuernitos, orejas, empanadas with their crimped edge, and marranitos.
 * A handwritten price card hangs on each shelf and swings a little. `w` is the rack's width in
 * centimetres, and `charola` adds the tray and tongs you are handed at the door.
 */
export const PanaderiaRackV2: React.FC<TejanoPropsV2 & {w?: number; shelves?: number; charola?: boolean}> = (p) => {
  const {frame = 0, seed = 122, w = 285, shelves = 6, charola = false} = p;
  const id = useUid(), ow = owOf(p), t = frame / 30;
  const steel = '#b9c0d4', pan = '#8f95ab';
  const H = 190, hw = w / 2;
  const per = Math.max(3, Math.floor((w - 24) / 19));
  return (
    <g transform={at(p)}>
      <defs><Lit id={`${id}-s`} c={steel} x2={1} y2={0.2} /><Lit id={`${id}-t`} c="#c3c9d8" /></defs>
      <ContactShadow x={0} y={2} w={w * 1.12} opacity={0.3} />
      {/* the uprights, the shelves and the pans, outlines first */}
      <Pass ow={ow} list={[
        ...[-hw, 0, hw].map((x) => tb(`M${x} -8 L${x} ${-H}`, steel, 4)),
        ...Array.from({length: shelves}, (_, r) => {
          const sy = -14 - r * ((H - 22) / Math.max(1, shelves - 1));
          return pc(rr(-hw - 3, sy - 2, w + 6, 4, 2), `url(#${id}-s)`, steel);
        }),
      ]} />
      {[-hw, 0, hw].map((x) => <g key={x}>
        <circle cx={x} cy={-4} r={4} fill="#2c2838" stroke={line('#2c2838')} strokeWidth={ow} />
        <path d={`M${x - 1} ${-H + 4} L${x - 1} -12`} stroke="#ffffff" strokeWidth={1.2} opacity={0.6} />
      </g>)}
      {Array.from({length: shelves}, (_, r) => {
        const sy = -14 - r * ((H - 22) / Math.max(1, shelves - 1));
        const card = Math.sin(t * 2 * Math.PI / 2.6 + r * 1.7 + seed) * 5;
        return <g key={r}>
          <path d={rr(-hw + 4, sy - 4.6, w - 8, 2.6, 1.3)} fill={pan} stroke={line(pan)} strokeWidth={ow * 0.4} />
          {Array.from({length: per}, (_, i) => {
            const px = -hw + 14 + i * ((w - 28) / Math.max(1, per - 1));
            const kind = (r * 2 + Math.floor(i / 2)) % 5;
            return <g key={i} transform={`translate(${px.toFixed(1)} ${sy - 4.6})`}>
              <Pan kind={kind} crust={CRUST[(r + i) % 3]} ow={ow} />
            </g>;
          })}
          {/* the handwritten price card, swinging on its clip */}
          <g transform={`translate(${-hw + 18 + (r % 3) * (w * 0.3)} ${sy + 2}) rotate(${card})`}>
            <path d={rr(-8, 0, 16, 9, 2.4)} fill="#fffaf0" stroke={line('#fffaf0')} strokeWidth={ow * 0.45} />
            <path d="M-5 3.4 q2 -2 3 0 t3 0 t3 0" stroke="#d23a46" strokeWidth={1.1} fill="none" strokeLinecap="round" />
            <path d="M-5 6.4 h7" stroke="#2c2a52" strokeWidth={1} strokeLinecap="round" />
          </g>
        </g>;
      })}
      {charola && <g transform="translate(0 -26) rotate(-4)">
        {/* the tray, 46 cm across and scratched all over, and the tongs across it */}
        <path d={rr(-23, -3, 46, 5, 2.5)} fill={`url(#${id}-t)`} stroke={line('#c3c9d8')} strokeWidth={ow} />
        {Array.from({length: 7}, (_, i) => <path key={i} d={`M${-18 + rnd(seed, i) * 32} -1.6 l3 1.4`} stroke="#ffffff" strokeWidth={0.5}
          opacity={0.7} />)}
        <path d="M-16 -6 L12 -9 M-16 -6 L12 -4" stroke="#e8edf6" strokeWidth={1.8} strokeLinecap="round" />
      </g>}
    </g>
  );
};

// ============================================================================ the raspa stand

const SYRUP = ['#e0323c', '#2f7fe0', '#38a84f', '#f2c935', '#9a4fc4', '#a5603a', '#f6a6bf', '#f08a2c', '#25b5a8', '#ff6f91'];

/**
 * THE RASPA STAND. A painted plywood shack under a tin roof whose front wall is almost all menu, a
 * hand-lettered board of flavour names in stacked columns under the word RASPAS. The service window has
 * a sliding screen and a striped awning whose scallops lift in the breeze, and the syrup rack inside is
 * the loud picture, a row of bottles with pour spouts. A raspa with its chamoy sits on the counter.
 * `menuRows` sets the rows per column and `syrups` the bottles. `w` is the width in centimetres.
 */
export const RaspaStandV2: React.FC<TejanoPropsV2 & {w?: number; syrups?: number; menuRows?: number}> = (p) => {
  const {frame = 0, seed = 123, wear = 0.4, night = false, w = 400, syrups = 12, menuRows = 12} = p;
  const id = useUid(), ow = owOf(p), t = frame / 30;
  const wall = '#f7c64a', board = '#fffaf0', red = '#e0323c', roof = '#c3cde0', glass = night ? '#ffd98a' : '#3b3a66';
  const hw = w / 2, H = 300, eave = 264;
  const rows = Math.max(3, Math.min(14, menuRows));
  const flap = (i: number) => Math.sin(t * 2 * Math.PI * 0.9 + i * 0.8 + seed) * 2.2;
  const awn = (() => {
    let d = `M-104 -168 L104 -168 L112 -140 `;
    for (let i = 8; i > 0; i--) {
      const x0 = -112 + i * 28, x1 = -112 + (i - 1) * 28;
      d += `Q${(x0 + x1) / 2} ${-128 + flap(i)} ${x1} -140 `;
    }
    return d + 'Z';
  })();
  return (
    <g transform={at(p)}>
      <defs>
        <Lit id={`${id}-w`} c={wall} /><Lit id={`${id}-r`} c={roof} x2={0.2} />
        <clipPath id={`${id}-a`}><path d={awn} /></clipPath>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={shade(glass, 0.2)} />
          <stop offset="100%" stopColor={night ? '#ffeec0' : shade(glass, 0.45)} /></linearGradient>
      </defs>
      <ContactShadow x={0} y={2} w={w * 1.2} opacity={0.32} />
      {night && <Glow x={0} y={-110} r={180} color="#ffd98a" opacity={0.45} />}
      <Pass ow={ow} list={[
        pc(roundPoly([[-hw, 0], [-hw, -eave], [0, -H + 10], [hw, -eave], [hw, 0]], [4, 6, 6, 6, 4]), `url(#${id}-w)`, wall),
        pc(roundPoly([[-hw - 26, -eave + 20], [-hw - 26, -eave + 4], [0, -H - 8], [hw + 26, -eave + 4], [hw + 26, -eave + 20], [0, -H + 10]],
          [6, 6, 10, 6, 6, 8]), `url(#${id}-r)`, roof),
      ]} />
      {/* the tin roof's ridge glint and the gable vent */}
      <path d={`M${-hw - 20} ${-eave + 6} L0 ${-H - 2} L${hw + 20} ${-eave + 6}`} stroke="#ffffff" strokeWidth={3} fill="none" opacity={0.5}
        strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={0} cy={-H + 30} r={10} fill={shade(wall, 0.25)} />
      {/* the concrete block skirt */}
      <path d={rr(-hw + 6, -22, w - 12, 18, 6)} fill={shade(wall, 0.18)} opacity={0.6} />
      {/* THE MENU BOARD, the front wall's whole job */}
      <path d={rr(-hw + 14, -eave + 22, w - 28, 92, 12)} fill={board} stroke={line(board)} strokeWidth={ow} />
      <path d={rr(-hw + 20, -eave + 28, w - 40, 80, 9)} fill="none" stroke={red} strokeWidth={2.4} />
      <text x={0} y={-eave + 52} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={24} fill={red}
        transform={`rotate(-1.5 0 ${-eave + 36})`} letterSpacing={3}>RASPAS</text>
      {Array.from({length: 4}, (_, c) => Array.from({length: Math.min(rows, 6)}, (_, r) => {
        const x = -hw + 32 + c * ((w - 64) / 4), y = -eave + 64 + r * 7.6;
        const len = 30 + rnd(seed, c * 20 + r) * 34;
        const col = SYRUP[(c * 3 + r) % SYRUP.length];
        return <path key={`${c}-${r}`} d={`M${x} ${y} q${len * 0.25} ${-1.4 + rnd(seed, 90 + r) * 2} ${len * 0.5} 0 t${len * 0.5} 0`}
          stroke={shade(col, 0.15)} strokeWidth={3.2} strokeLinecap="round" fill="none" />;
      }))}
      {/* the service window, its sliding screen and the counter */}
      <path d={rr(-84, -150, 168, 78, 10)} fill={`url(#${id}-g)`} stroke={line('#7a6a4a')} strokeWidth={ow} />
      {Array.from({length: Math.min(14, syrups)}, (_, i) => {
        const n = Math.min(14, syrups), bx = -72 + i * (144 / Math.max(1, n - 1)), c = SYRUP[i % SYRUP.length];
        return <g key={i} transform={`translate(${bx.toFixed(1)} -78)`}>
          <path d={rr(-4.4, -22, 8.8, 22, 3.2)} fill={c} stroke={line(c)} strokeWidth={ow * 0.5} />
          <path d="M-1.2 -22 L-1.2 -27 L2.6 -29" stroke="#e8edf6" strokeWidth={1.6} fill="none" strokeLinecap="round" />
          <path d="M-2.2 -19 V-6" stroke="#ffffff" strokeWidth={1.3} strokeLinecap="round" opacity={0.55} />
        </g>;
      })}
      <path d={rr(4, -150, 80, 78, 10)} fill="#d6dcea" opacity={0.42} />
      {Array.from({length: 9}, (_, i) => <path key={i} d={`M${8 + i * 9} -146 V-76`} stroke="#ffffff" strokeWidth={0.6} opacity={0.35} />)}
      <path d={rr(-96, -76, 192, 8, 4)} fill="#f2f4fa" stroke={line('#f2f4fa')} strokeWidth={ow} />
      {/* a raspa waiting on the counter, dome and chamoy and all */}
      <g transform="translate(-58 -76)">
        <path d="M-4 0 L-5.6 -14 H5.6 L4 0 Z" fill="#fbf8f0" stroke={line('#fbf8f0')} strokeWidth={ow * 0.5} strokeLinejoin="round" />
        <path d="M-6.4 -14 Q0 -25 6.4 -14 Z" fill="#ff6f91" stroke={line('#ff6f91')} strokeWidth={ow * 0.5} />
        <path d="M-4 -17 q3 -4 6 -1" stroke="#8a2f1c" strokeWidth={2} fill="none" strokeLinecap="round" />
      </g>
      {/* the striped awning, its scallops lifting */}
      <path d={awn} fill={line(red)} stroke={line(red)} strokeWidth={ow * 2} strokeLinejoin="round" />
      <g clipPath={`url(#${id}-a)`}>
        {Array.from({length: 9}, (_, i) => <path key={i} d={`M${-112 + i * 28} -170 L${-84 + i * 28} -170 L${-84 + i * 28 + 6} -120 L${-112 + i * 28 + 6} -120 Z`}
          fill={i % 2 ? '#fff6e4' : red} />)}
        <rect x={-120} y={-170} width={240} height={10} fill="#ffffff" opacity={0.25} />
      </g>
      {wear > 0.3 && <path d={rr(-hw + 2, -30, w - 4, 26, 10)} fill="#d9c79a" opacity={wear * 0.4} />}
      <Sheen d={`M${-hw + 10} ${-eave + 14} L${-hw + 10} -40`} w={3} o={0.4} />
    </g>
  );
};

/**
 * A RASPA IN THE CUP. A tall styrofoam cup filled past the rim into a dome of fine snow, the syrup
 * travelling down so the cup is banded, a dark rust swirl of chamoy on top with a drip that slowly
 * runs, a dusting of brick orange chile powder, a few gummies and a spoon-straw stuck in the side of
 * the mound. A plain object.
 */
export const RaspaCupV2: React.FC<Place & {syrup?: string; chamoy?: boolean; gummies?: number}> = (p) => {
  const {frame = 0, seed = 124, syrup = '#ff5f8a', chamoy = true, gummies = 4} = p;
  const id = useUid(), ow = owOf(p), t = frame / 30;
  const cup = '#fbf8f0', snow = '#f4f8fc', chm = '#8a2f1c';
  const drip = 3 + (Math.sin(t * 2 * Math.PI / 4 + seed) * 0.5 + 0.5) * 4;
  const cupD = 'M-4.6 -0.2 Q-4.8 0.4 -3.6 0.4 H3.6 Q4.8 0.4 4.6 -0.2 L6.6 -19.4 H-6.6 Z';
  const domeD = 'M-7.4 -19.6 C-7.6 -28 -3 -31.4 0 -31.4 C3 -31.4 7.6 -28 7.4 -19.6 Z';
  return (
    <g transform={at(p)}>
      <defs>
        <Lit id={`${id}-c`} c={cup} x2={1} y2={0.1} k={1.2} /><Rad id={`${id}-d`} c={syrup} /><Rad id={`${id}-s`} c={snow} />
        <clipPath id={`${id}-k`}><path d={cupD} /></clipPath><clipPath id={`${id}-m`}><path d={domeD} /></clipPath>
      </defs>
      <ContactShadow x={0} y={0.6} w={17} opacity={0.34} />
      {/* the spoon-straw goes in behind the front of the mound */}
      <Pass ow={ow} list={[tb('M2 -25 L6.4 -34', '#ff4f8f', 1.3), pc(ell(6.9, -35, 1.5, 1), '#ff4f8f', '#ff4f8f')]} />
      <Pass ow={ow} list={[pc(cupD, `url(#${id}-c)`, cup), pc(domeD, `url(#${id}-s)`, snow)]} />
      <g clipPath={`url(#${id}-k)`}>
        {/* the syrup seeping down, so the cup is banded */}
        <path d="M-8 -20 H8 V-11 Q4 -8.6 0 -10.4 Q-4 -12 -8 -9.6 Z" fill={syrup} opacity={0.45} />
        <path d="M-8 -9 Q-4 -11 0 -9.6 Q4 -8 8 -10 V-6 Q4 -4.6 0 -5.6 Q-4 -6.6 -8 -5 Z" fill={syrup} opacity={0.2} />
        <path d="M-4.6 -18 L-3.4 -2" stroke="#ffffff" strokeWidth={1.1} strokeLinecap="round" opacity={0.7} />
      </g>
      <path d="M-6.9 -19.6 H6.9" stroke={shade(cup, 0.2)} strokeWidth={1.1} strokeLinecap="round" />
      <g clipPath={`url(#${id}-m)`}>
        <path d="M-9 -22 C-6 -32 6 -33 9 -24 V-19 H-9 Z" fill={`url(#${id}-d)`} opacity={0.92} />
        <path d="M-9 -20.4 C-4 -23 4 -22.6 9 -21 V-19 H-9 Z" fill="#ffffff" opacity={0.55} />
        <ellipse cx={-2.6} cy={-28.4} rx={2.4} ry={1.1} fill="#ffffff" opacity={0.55} />
      </g>
      {chamoy && <g>
        <path d="M-5.6 -24.4 q2.6 -3.8 5.6 -1.4 q2.6 -3.4 5.2 0.2" stroke={line(chm)} strokeWidth={1.8 + ow * 0.6} fill="none" strokeLinecap="round" />
        <path d="M-5.6 -24.4 q2.6 -3.8 5.6 -1.4 q2.6 -3.4 5.2 0.2" stroke={chm} strokeWidth={1.8} fill="none" strokeLinecap="round" />
        <path d={`M5.4 -21.4 Q6.4 -19.6 6.2 ${-19.6 + drip}`} stroke={chm} strokeWidth={1.3} fill="none" strokeLinecap="round" />
        <circle cx={6.2} cy={-19.4 + drip} r={0.9} fill={chm} />
        {Array.from({length: 18}, (_, i) => <circle key={i} cx={(rnd(seed, i) - 0.5) * 11} cy={-21.5 - rnd(seed, 20 + i) * 8.6} r={0.32}
          fill="#d0482a" opacity={0.9} />)}
      </g>}
      {Array.from({length: Math.min(6, gummies)}, (_, i) => {
        const gx = (rnd(seed, 40 + i) - 0.5) * 9, gy = -22 - rnd(seed, 60 + i) * 6, c = ['#e0382c', '#38a84f', '#f2c935', '#2f7fe0'][i % 4];
        return <path key={i} d={rr(gx - 0.9, gy - 0.9, 1.8, 1.8, 0.6)} fill={c} stroke={line(c)} strokeWidth={0.3} />;
      })}
      {[0, 1, 2].map((i) => {
        const tw = Math.max(0, Math.sin(t * 2 * Math.PI * 0.7 + i * 2.1));
        return <circle key={i} cx={-4 + i * 3.6} cy={-27 + (i % 2) * 2.6} r={0.5 * tw} fill="#ffffff" />;
      })}
    </g>
  );
};

// ============================================================================ the conjunto pair

/**
 * THE ACCORDION AND THE BAJO SEXTO, the two-instrument core of conjunto. A three row diatonic button
 * accordion, never a piano key, with three arcs of pearl buttons on the treble block (thirty one of
 * them) under a stamped chrome grille, the bass buttons on the far block and a bellows of dark folds
 * capped in cream leather that breathes in and out on `frame`. Beside it the bajo sexto, visibly bigger
 * and deeper than a guitar, with twelve strings in six doubled courses and a wide headstock carrying
 * six tuners a side. The strings shimmer as the bellows moves. Placed at the accordion's centre, as the
 * library places it. `bellows` 0 to 1 sets how far open it rests.
 */
export const ConjuntoPairV2: React.FC<Place & {bellows?: number; bodyColour?: string; bajo?: boolean}> = (p) => {
  const {frame = 0, bellows = 0.5, bodyColour = '#c8202e', bajo = true} = p;
  const id = useUid(), ow = owOf(p), t = frame / 30;
  const pull = bellows + Math.sin(t * 2 * Math.PI / 1.6) * 0.18;
  const bw = 42 * (0.34 + pull * 0.7);
  const wood = '#e8b468', side = '#8a4e28', neck = '#5a3420', chrome = '#d6dcea', pearl = '#fbf4e6';
  const BX = -80;
  const shimmer = 0.55 + Math.sin(t * 2 * Math.PI * 1.6) * 0.25;
  const bodyD = (dx: number) => `M${BX + dx} -10 C${BX + 14 + dx} -12 ${BX + 15 + dx} -4 ${BX + 12 + dx} 2 C${BX + 22 + dx} 8 ${BX + 22 + dx} 30
    ${BX + dx} 33 C${BX - 22 + dx} 30 ${BX - 22 + dx} 8 ${BX - 12 + dx} 2 C${BX - 15 + dx} -4 ${BX - 14 + dx} -12 ${BX + dx} -10 Z`;
  const L = -bw / 2, R = bw / 2;
  return (
    <g transform={at(p)}>
      <defs>
        <Lit id={`${id}-b`} c={bodyColour} /><Rad id={`${id}-w`} c={wood} /><Lit id={`${id}-c`} c={chrome} />
        <linearGradient id={`${id}-f`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#3c3654" /><stop offset="100%" stopColor="#1e1a2e" />
        </linearGradient>
      </defs>
      {bajo && <g>
        {/* the bajo sexto, the deep sides first, then the top, the neck and the wide head */}
        <Pass ow={ow} list={[
          pc(bodyD(3.6), side, side, `translate(${BX} 8) scale(1.2) translate(${-BX} -8)`),
          pc(bodyD(0), `url(#${id}-w)`, wood, `translate(${BX} 8) scale(1.2) translate(${-BX} -8)`),
          pc(rr(BX - 3, -62, 6, 52, 3), neck, neck),
          pc(roundPoly([[BX - 6, -60], [BX - 7.4, -80], [BX + 7.4, -80], [BX + 6, -60]], 2.4), '#3a2416', '#3a2416'),
        ]} />
        <circle cx={BX} cy={7} r={6.6} fill="none" stroke="#8a5a2c" strokeWidth={1.8} />
        <circle cx={BX} cy={7} r={5.2} fill="#2a1a14" />
        <path d={rr(BX - 9, 26, 18, 3.6, 1.8)} fill="#4a2c1a" />
        {Array.from({length: 6}, (_, i) => [-1, 1].map((s) => <g key={`${i}${s}`}>
          <path d={`M${BX + s * 7} ${-77 + i * 3} h${s * 3}`} stroke={chrome} strokeWidth={1} strokeLinecap="round" />
          <circle cx={BX + s * 10.6} cy={-77 + i * 3} r={1.2} fill={chrome} stroke={line(chrome)} strokeWidth={0.4} />
        </g>))}
        <path d={`M${BX - 2.4} -60.4 H${BX + 2.4}`} stroke="#f4ead6" strokeWidth={1} />
        {Array.from({length: 6}, (_, c) => [0, 0.7].map((o) => {
          const x0 = BX - 2.2 + c * 0.8 + o * 0.35, x1 = BX - 6.4 + c * 2.4 + o * 0.6;
          return <path key={`${c}${o}`} d={`M${x0.toFixed(2)} -60 L${x1.toFixed(2)} 27.6`} stroke="#f4ead6" strokeWidth={0.32} opacity={shimmer} />;
        }))}
        <Sheen d={`M${BX - 18} 14 Q${BX - 19} 2 ${BX - 11} -6`} w={1.8} o={0.6} />
      </g>}
      {/* the bellows, dark folds capped in cream leather, then the two blocks */}
      <Pass ow={ow} list={[
        pc(rr(L - 2, -19.6, bw + 4, 39.2, 3), `url(#${id}-f)`, '#2a2440'),
        pc(rr(L - 12, -21, 12, 42, 3.6), `url(#${id}-b)`, bodyColour),
        pc(rr(R, -21, 13, 42, 3.6), `url(#${id}-b)`, bodyColour),
      ]} />
      {Array.from({length: 9}, (_, i) => {
        const x = L + (i + 0.5) * (bw / 9);
        return <g key={i}>
          <path d={`M${x} -18 V18`} stroke={i % 2 ? '#14111e' : '#4a4466'} strokeWidth={0.8} />
          <path d={rr(x - 1.2, -19.8, 2.4, 3, 0.8)} fill="#efe0bc" />
          <path d={rr(x - 1.2, 16.8, 2.4, 3, 0.8)} fill="#efe0bc" />
        </g>;
      })}
      <path d={`M${L} -17.6 H${R} M${L} 17.6 H${R}`} stroke="#c9a86a" strokeWidth={0.9} />
      {/* the treble block, the stamped chrome grille and three arcs of buttons */}
      <path d={rr(R + 2, -19, 9, 14, 2.4)} fill={`url(#${id}-c)`} stroke={line(chrome)} strokeWidth={ow * 0.5} />
      {[0, 1, 2, 3].map((i) => <path key={i} d={`M${R + 3.6} ${-16.4 + i * 3} q2.8 -1.2 5.6 0`} stroke={shade(chrome, 0.35)} strokeWidth={0.8}
        fill="none" strokeLinecap="round" />)}
      {[10, 11, 10].map((n, r) => Array.from({length: n}, (_, i) => {
        const yy = -3 + i * (21 / 10) + (r === 1 ? -1 : 0);
        const xx = R + 3.6 + r * 2.9 + Math.sin((i / (n - 1)) * Math.PI) * 1.1;
        return <g key={`${r}${i}`}>
          <circle cx={xx} cy={yy} r={0.95} fill={pearl} stroke={line(pearl)} strokeWidth={0.32} />
          <circle cx={xx - 0.3} cy={yy - 0.3} r={0.3} fill="#ffffff" />
        </g>;
      }))}
      {/* the bass block's buttons and its air valve */}
      {Array.from({length: 12}, (_, i) => <circle key={i} cx={L - 8.4 + (i % 2) * 3.4} cy={-12 + Math.floor(i / 2) * 3.1} r={1.05} fill={pearl}
        stroke={line(pearl)} strokeWidth={0.32} />)}
      <path d={rr(L - 9.6, 9, 6, 3, 1.5)} fill={chrome} />
      {/* the bellows strap across the top that keeps it shut, and a sheen along the lit edges */}
      <path d={rr(L - 4, -22.4, bw + 8, 3, 1.5)} fill="#7a4a2a" stroke={line('#7a4a2a')} strokeWidth={ow * 0.5} />
      <circle cx={R + 3} cy={-21} r={1.2} fill={chrome} />
      <Sheen d={`M${L - 10} -18 V14`} w={1.4} o={0.6} />
      <Sheen d={`M${R + 2} 0 V17`} w={1} o={0.35} />
    </g>
  );
};

// ============================================================================ the lowrider

/**
 * THE LOWRIDER, a big body hardtop on small wire wheels. The stance is the drawing, rocker panels a
 * few centimetres off the pavement, the roofline low and long, a skirt over the rear wheel and the
 * wheels small, so the body reads huge. Candy paint is drawn as a deep wet gradient inside the panel,
 * a dark saturated core under a blown highlight, with flake that glints as the light moves. Gold
 * pinstripes, chrome bumpers and grille, a blank club plaque on two chains in the rear window and two
 * eared knock-off spinners. `lift` 0 is laid down for cruising and 1 is raised to legal ride height,
 * and a raised car bobs on its hydraulics. A plain object, never a threat cue, and never given a face.
 */
export const LowriderV2: React.FC<TejanoPropsV2 & {candy?: string; lift?: number; sparks?: boolean; plaque?: boolean;
  hoodUp?: boolean}> = (p) => {
  const {frame = 0, seed = 126, night = false, candy = '#8a2fb0', lift = 0, sparks = false, plaque = true, hoodUp = false} = p;
  const id = useUid(), ow = owOf(p), t = frame / 30;
  const ride = 6 + lift * 22 + (lift > 0.05 ? Math.sin(t * 2 * Math.PI * 0.8) * 2 * lift : 0);
  const chrome = '#dfe5f0', gold = '#f2cf6a', glass = night ? '#141830' : '#2b3566';
  const by = -ride;
  const P = (pts: Pt[]) => pts.map(([x, y]) => [x, y + by] as Pt);
  const body = roundPoly(P([[-300, -14], [-304, -40], [-296, -60], [-118, -66], [-84, -120], [44, -122], [92, -70], [292, -62],
    [304, -42], [300, -14], [270, 0], [-270, 0]]), [8, 10, 14, 18, 22, 22, 18, 14, 10, 8, 10, 10]);
  const hood = roundPoly(P([[92, -70], [292, -62], [296, -54], [96, -60]]), 4);
  const wheel = (x: number, _skirt: boolean) => {
    const spin = frame * 0.6;
    return <g transform={`translate(${x} -29)`}>
      <circle r={29} fill="#22202e" stroke={line('#22202e')} strokeWidth={ow * 2} />
      <circle r={24} fill="none" stroke="#f6f1e4" strokeWidth={3.4} />
      <circle r={19} fill={chrome} stroke={shade(chrome, 0.3)} strokeWidth={1} />
      {Array.from({length: 36}, (_, k) => {
        const a = (k / 36) * Math.PI * 2, b = a + (k % 2 ? 0.5 : -0.5);
        return <path key={k} d={`M${(Math.cos(a) * 5).toFixed(1)} ${(Math.sin(a) * 5).toFixed(1)} L${(Math.cos(b) * 18).toFixed(1)} ${(Math.sin(b) * 18).toFixed(1)}`}
          stroke="#8e96ad" strokeWidth={Math.max(0.5, ow * 0.18)} />;
      })}
      <g transform={`rotate(${spin + seed})`}>
        <circle r={5.4} fill={chrome} stroke={line(chrome)} strokeWidth={ow * 0.5} />
        <path d="M-12 -1.6 Q-6 -3 0 -1.6 Q6 -3 12 -1.6 L12 1.6 Q6 3 0 1.6 Q-6 3 -12 1.6 Z" fill={gold} stroke={line(gold)} strokeWidth={ow * 0.4} />
      </g>
      <path d="M-15 -11 A19 19 0 0 1 -2 -18.6" stroke="#ffffff" strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.7} />
    </g>;
  };
  const flakes = Array.from({length: 22}, (_, i) => {
    const fx = -280 + rnd(seed, i) * 560, fy = by - 20 - rnd(seed, 30 + i) * 40;
    const tw = Math.max(0, Math.sin(t * 2 * Math.PI * 0.5 + i * 1.9 - fx * 0.01));
    return <circle key={i} cx={fx} cy={fy} r={1.6 * tw} fill="#ffffff" opacity={0.9} />;
  });
  return (
    <g transform={at(p)}>
      <defs>
        <linearGradient id={`${id}-c`} gradientUnits="userSpaceOnUse" x1={0} y1={by - 126} x2={10} y2={by}>
          <stop offset="0%" stopColor={light(candy, 0.6)} /><stop offset="16%" stopColor={light(candy, 0.18)} />
          <stop offset="42%" stopColor={shade(candy, 0.5)} /><stop offset="58%" stopColor={light(candy, 0.3)} />
          <stop offset="74%" stopColor={candy} /><stop offset="100%" stopColor={shade(candy, 0.55)} />
        </linearGradient>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0.6" y2="1"><stop offset="0%" stopColor={light(glass, 0.35)} />
          <stop offset="100%" stopColor={glass} /></linearGradient>
        <clipPath id={`${id}-k`}><path d={body} /></clipPath>
      </defs>
      {night && <ellipse cx={0} cy={-2} rx={300} ry={18} fill="#8a5aff" opacity={0.35} />}
      <ContactShadow x={0} y={2} w={640} opacity={0.36} />
      <path d={body} fill={line(candy)} stroke={line(candy)} strokeWidth={ow * 2} strokeLinejoin="round" />
      <path d={body} fill={`url(#${id}-c)`} />
      <g clipPath={`url(#${id}-k)`}>
        {/* the front wheel well, the rear skirt line and the side glass */}
        <path d={`M${170 - 36} ${by + 4} L${170 - 36} -29 A36 36 0 0 1 ${170 + 36} -29 L${170 + 36} ${by + 4} Z`} fill="#1a1626" />
        <path d={roundPoly(P([[-80, -114], [36, -116], [76, -72], [-106, -70]]), 8)} fill={`url(#${id}-g)`} stroke={chrome} strokeWidth={2.4} />
        <path d={roundPoly(P([[-30, -112], [-24, -112], [-20, -72], [-28, -72]]), 2)} fill={chrome} opacity={0.6} />
        <path d={`M-70 ${by - 108} L-50 ${by - 80}`} stroke="#ffffff" strokeWidth={5} strokeLinecap="round" opacity={0.25} />
        {flakes}
        {/* the gold pinstripes along the crease and the chrome side spear */}
        <path d={`M-292 ${by - 44} C-150 ${by - 50} 60 ${by - 50} 290 ${by - 44}`} stroke={gold} strokeWidth={1.6} fill="none" opacity={0.95} />
        <path d={`M-240 ${by - 38} C-160 ${by - 30} -120 ${by - 44} -60 ${by - 40}`} stroke={gold} strokeWidth={1.2} fill="none" opacity={0.85} />
        <path d={`M-280 ${by - 30} L280 ${by - 32}`} stroke={chrome} strokeWidth={2.8} strokeLinecap="round" />
        <path d={`M-296 ${by - 12} L296 ${by - 12}`} stroke={shade(candy, 0.6)} strokeWidth={10} opacity={0.5} />
      </g>
      {/* the front wheel in its well, and the rear wheel under its fender skirt, the skirt flush with the body */}
      {wheel(170, false)}
      <g>
        <path d={`M-212 ${by + 4} L-212 -29 L-128 -29 L-128 ${by + 4} Z`} fill="#1a1626" />
        {wheel(-170, true)}
        <path d={roundPoly([[-214, -27], [-212, by - 40], [-128, by - 40], [-126, -27]], [6, 10, 10, 6])} fill={`url(#${id}-c)`} />
        <path d="M-214 -27 Q-170 -25 -126 -27" stroke={line(candy)} strokeWidth={ow} fill="none" strokeLinecap="round" />
        <path d={`M-208 -31 H-132`} stroke={chrome} strokeWidth={2.4} strokeLinecap="round" />
      </g>
      {/* the bumpers, the grille, the lamps */}
      <Pass ow={ow} list={[
        pc(rr(276, by - 26, 36, 14, 7), chrome, chrome), pc(rr(-314, by - 28, 36, 14, 7), chrome, chrome),
      ]} />
      <path d={rr(288, by - 52, 16, 22, 5)} fill={shade(chrome, 0.25)} stroke={line(chrome)} strokeWidth={ow * 0.6} />
      {[0, 1, 2, 3].map((i) => <path key={i} d={`M290 ${by - 48 + i * 5} H302`} stroke={chrome} strokeWidth={1.4} strokeLinecap="round" />)}
      <circle cx={298} cy={by - 56} r={4.4} fill={night ? '#fff6c8' : '#f6f2dc'} stroke={line(chrome)} strokeWidth={ow * 0.5} />
      {[0, 1].map((i) => <circle key={i} cx={-298} cy={by - 50 + i * 10} r={3.6} fill="#ff4a4a" stroke={line('#ff4a4a')} strokeWidth={ow * 0.4} />)}
      {hoodUp && <path d={hood} transform={`rotate(-24 ${92} ${by - 70})`} fill={`url(#${id}-c)`} stroke={line(candy)} strokeWidth={ow} />}
      {plaque && <g transform={`translate(-72 ${by - 92})`}>
        <path d="M-12 -12 L-10 -4 M12 -12 L10 -4" stroke={chrome} strokeWidth={0.9} strokeDasharray="1.4 1" />
        <path d={rr(-16, -4, 32, 14, 6)} fill={chrome} stroke={line(chrome)} strokeWidth={ow * 0.5} />
        <path d="M-10 3 Q0 -2 10 3" stroke={gold} strokeWidth={1.4} fill="none" strokeLinecap="round" />
      </g>}
      <path d={`M-260 ${by - 62} C-150 ${by - 68} 120 ${by - 68} 280 ${by - 62}`} stroke="#ffffff" strokeWidth={4} fill="none" strokeLinecap="round"
        opacity={0.5} />
      {sparks && lift > 0.4 && Array.from({length: 12}, (_, i) => {
        const a = 0.2 + rnd(seed, i) * 0.9, len = 20 + rnd(seed, 20 + i) * 30, ph = (frame * 0.5 + i) % 3 < 1.5 ? 1 : 0.4;
        return <path key={i} d={`M-300 -2 l${-Math.cos(a) * len} ${-Math.sin(a) * len * 0.6}`} stroke="#ffd060" strokeWidth={1.8}
          strokeLinecap="round" opacity={ph} />;
      })}
    </g>
  );
};

// ============================================================================ the yard shrine

/**
 * THE YARD SHRINE, drawn as a niche from the street. A grotto of stacked rounded stones (or a bathtub
 * set on end, or a wooden box under a little roof) around an arched niche painted a deep blue, the
 * figure inside kept as a soft mantled silhouette against a warm almond of light, never detailed.
 * Tall glass veladoras flicker at its foot, a low fence of shells runs in front, plastic flowers in
 * pink and yellow stand in cans and a string of Christmas lights left up all year twinkles round the
 * arch, brighter at night.
 */
export const YardShrineV2: React.FC<TejanoPropsV2 & {form?: 'grotto' | 'tub' | 'box'; candles?: number; lights?: boolean}> = (p) => {
  const {frame = 0, seed = 127, night = false, form = 'grotto', candles = 3, lights = true} = p;
  const id = useUid(), ow = owOf(p);
  const stone = '#d9cdb4', mortar = '#b7a98c', niche = '#2f5fb0', mantle = '#3fa38f';
  const outer = form === 'grotto'
    ? 'M-62 0 C-64 -40 -60 -80 -54 -100 C-46 -138 -22 -158 0 -158 C22 -158 46 -138 54 -100 C60 -80 64 -40 62 0 Z'
    : form === 'tub' ? 'M-36 0 L-36 -118 A36 36 0 0 1 36 -118 L36 0 Z'
      : roundPoly([[-40, 0], [-40, -128], [-50, -128], [0, -158], [50, -128], [40, -128], [40, 0]], 4);
  const arch = 'M-23 -6 L-23 -78 A23 23 0 0 1 23 -78 L23 -6 Z';
  const stones: [number, number, number, number][] = [];
  if (form === 'grotto') {
    for (let r = 0; r < 9; r++) {
      const y = -8 - r * 17.6;
      const half = r < 5 ? 60 - r * 1.4 : 56 - (r - 4) * (r - 4) * 3.2;
      const n = Math.max(2, Math.round(half / 13));
      for (let i = 0; i < n * 2; i++) {
        const x = -half + (i + 0.5 + (r % 2) * 0.5) * (half * 2 / (n * 2)) - (r % 2) * (half / (n * 2)) * 0.5;
        if (Math.abs(x) < 28 && y > -104) continue;
        stones.push([x, y + (rnd(seed, r * 20 + i) - 0.5) * 3, 6.5 + rnd(seed, 50 + r * 9 + i) * 3, 7 + rnd(seed, 90 + i + r) * 2]);
      }
    }
  }
  return (
    <g transform={at(p)}>
      <defs>
        <Rad id={`${id}-s`} c={stone} /><Lit id={`${id}-o`} c={form === 'tub' ? '#f2efe6' : form === 'box' ? '#c49a6a' : mortar} />
        <radialGradient id={`${id}-n`} cx="50%" cy="40%" r="70%"><stop offset="0%" stopColor={light(niche, 0.25)} />
          <stop offset="100%" stopColor={shade(niche, 0.45)} /></radialGradient>
        <radialGradient id={`${id}-m`} cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#fff2c0" stopOpacity={night ? 0.95 : 0.8} />
          <stop offset="100%" stopColor="#ffd36a" stopOpacity={0} /></radialGradient>
        <Lit id={`${id}-f`} c={mantle} />
        <clipPath id={`${id}-k`}><path d={outer} /></clipPath>
      </defs>
      <ContactShadow x={0} y={2} w={150} opacity={0.32} />
      <path d={outer} fill={line(form === 'box' ? '#c49a6a' : stone)} stroke={line(form === 'box' ? '#c49a6a' : stone)} strokeWidth={ow * 2}
        strokeLinejoin="round" />
      <path d={outer} fill={`url(#${id}-o)`} />
      {form === 'grotto' && <g clipPath={`url(#${id}-k)`}>
        {stones.map(([x, y, rx, ry], i) => <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill={`url(#${id}-s)`}
          stroke={shade(mortar, 0.25)} strokeWidth={Math.max(0.8, ow * 0.35)} />)}
      </g>}
      {form === 'tub' && <path d="M-30 -2 L-30 -118 A30 30 0 0 1 30 -118 L30 -2" fill="none" stroke="#ffffff" strokeWidth={3} opacity={0.5} />}
      {form === 'box' && <path d="M-36 -126 H36" stroke={shade('#c49a6a', 0.3)} strokeWidth={2} />}
      {/* the niche, and the figure in it as a silhouette against a warm almond of light */}
      <path d={arch} fill={`url(#${id}-n)`} stroke={line(niche)} strokeWidth={ow} />
      {[[-14, -88], [12, -94], [-6, -70], [16, -60], [-17, -40]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={0.9} fill="#ffe08a" />)}
      <ellipse cx={0} cy={-52} rx={17} ry={40} fill={`url(#${id}-m)`} />
      <path d="M0 -84 C-6 -84 -8.6 -78 -8.4 -73 C-12 -66 -12.6 -40 -14 -12 Q0 -8 14 -12 C12.6 -40 12 -66 8.4 -73 C8.6 -78 6 -84 0 -84 Z"
        fill={`url(#${id}-f)`} stroke={line(mantle)} strokeWidth={ow * 0.6} />
      <path d="M-4 -72 C-6 -56 -5 -34 -4 -14 M4 -72 C6 -56 5 -34 4 -14" stroke={shade(mantle, 0.3)} strokeWidth={0.9} fill="none" opacity={0.5} />
      <path d="M-6 -76 Q-7 -60 -9 -40" stroke="#ffffff" strokeWidth={1.3} fill="none" opacity={0.5} strokeLinecap="round" />
      {/* the christmas lights round the arch, left up all year */}
      {lights && Array.from({length: 11}, (_, i) => {
        const a = Math.PI + (i / 10) * Math.PI, x = Math.cos(a) * 34, y = -84 + Math.sin(a) * 36 * (form === 'grotto' ? 1.4 : 1);
        const c = ['#ff4a4a', '#3ccf6a', '#ffcc33', '#4a8aff'][i % 4];
        const on = (Math.floor(frame / 12) + i) % 3 !== 0;
        return <g key={i}>
          {i > 0 && <path d={`M${Math.cos(a - Math.PI / 10) * 34} ${-84 + Math.sin(a - Math.PI / 10) * 36 * (form === 'grotto' ? 1.4 : 1)} L${x} ${y}`}
            stroke="#2c3a2c" strokeWidth={0.8} />}
          {(night && on) && <circle cx={x} cy={y + 2} r={5} fill={c} opacity={0.35} />}
          <ellipse cx={x} cy={y + 2} rx={1.5} ry={2.2} fill={on ? c : shade(c, 0.4)} stroke={line(c)} strokeWidth={0.4} />
        </g>;
      })}
      {/* the plastic flowers in their cans */}
      {[-40, 40].map((x, j) => <g key={x} transform={`translate(${x} 0)`}>
        {[-6, 0, 6].map((dx, k) => <path key={k} d={`M0 -10 Q${dx * 0.6} -20 ${dx} -27`} stroke="#3c8a3c" strokeWidth={1.2} fill="none" />)}
        {[-6, 0, 6].map((dx, k) => <g key={`f${k}`} transform={`translate(${dx} -28)`}>
          {Array.from({length: 5}, (_, q) => {
            const a = (q / 5) * Math.PI * 2, c = (k + j) % 2 ? '#ff4f9a' : '#ffcc2e';
            return <circle key={q} cx={Math.cos(a) * 2.2} cy={Math.sin(a) * 2.2} r={2} fill={c} stroke={line(c)} strokeWidth={0.4} />;
          })}
          <circle r={1.2} fill="#fff4c4" />
        </g>)}
        <path d={rr(-5, -12, 10, 12, 2)} fill="#c9d0e0" stroke={line('#c9d0e0')} strokeWidth={ow * 0.5} />
      </g>)}
      {/* the veladoras, tall glass jars, flickering */}
      {Array.from({length: Math.min(5, candles)}, (_, i) => {
        const n = Math.min(5, candles), x = (i - (n - 1) / 2) * 9, c = ['#e0323c', '#f6f0e0', '#38a84f', '#f2c935', '#2f7fe0'][(i + seed) % 5];
        return <g key={i} transform={`translate(${x} 0)`}>
          {night && <circle cx={0} cy={-20} r={10} fill="#ffcc66" opacity={0.25} />}
          <path d={rr(-3.4, -18, 6.8, 18, 1.6)} fill={c} stroke={line(c)} strokeWidth={ow * 0.5} opacity={0.95} />
          <path d="M-1.8 -16 V-3" stroke="#ffffff" strokeWidth={0.9} opacity={0.6} strokeLinecap="round" />
          <Flame x={0} y={-17} s={2.6} frame={frame} seed={seed + i} />
        </g>;
      })}
      {/* the low fence of shells across the front */}
      {Array.from({length: 11}, (_, i) => {
        const x = -55 + i * 11;
        return <g key={i} transform={`translate(${x} 2)`}>
          <path d="M-5 0 Q-5.4 -6 0 -7 Q5.4 -6 5 0 Q0 1.6 -5 0 Z" fill="#fbf2e2" stroke={line('#fbf2e2')} strokeWidth={ow * 0.5} />
          {[-2.4, 0, 2.4].map((dx) => <path key={dx} d={`M0 -0.4 L${dx} -6`} stroke="#e2c9a8" strokeWidth={0.6} />)}
        </g>;
      })}
    </g>
  );
};

// ============================================================================ the tiendita

/**
 * THE TIENDITA AND ITS ROTULO. A stucco corner store whose name is painted on the wall by hand, so the
 * baseline drifts, each letter leans its own way and a hard navy drop shadow sits down and right. Under
 * it the list of what is sold, the window behind scrolled security bars, a shallow metal awning, an
 * ice chest by the door and an open sign that swings on its cord. `name` is the painted word (a plain
 * word for the kind of store, never a business name), `banner` zip-ties a printed vinyl banner over
 * the paint and `ghost` shows the old rotulo through the repaint. `w` is the width in centimetres.
 */
export const TienditaV2: React.FC<TejanoPropsV2 & {w?: number; name?: string; banner?: boolean; bars?: boolean; ghost?: boolean}> = (p) => {
  const {frame = 0, seed = 128, wear = 0.45, night = false, w = 900, name = 'ABARROTES', banner = false, bars = true, ghost = false} = p;
  const id = useUid(), ow = owOf(p), t = frame / 30;
  const stucco = '#f4e2c2', red = '#e0322e', navy = '#1f2f6e', trim = '#3f9a8a', glass = night ? '#ffe2a0' : '#3d4a7a';
  const hw = w / 2, H = 400;
  const letters = name.split('');
  const lw = Math.min(86, (w * 0.8) / Math.max(1, letters.length));
  const swing = Math.sin(t * 2 * Math.PI / 2.4 + seed) * 6;
  return (
    <g transform={at(p)}>
      <defs>
        <Lit id={`${id}-s`} c={stucco} x2={1} y2={0.4} /><Lit id={`${id}-a`} c="#b86a3c" x2={0.1} />
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0.4" y2="1"><stop offset="0%" stopColor={light(glass, 0.3)} />
          <stop offset="100%" stopColor={shade(glass, 0.3)} /></linearGradient>
      </defs>
      <ContactShadow x={0} y={2} w={w * 1.08} opacity={0.3} />
      {night && <Glow x={-160} y={-120} r={220} color="#ffd98a" opacity={0.35} />}
      <Pass ow={ow} list={[
        pc(roundPoly([[-hw, 0], [-hw, -H + 14], [hw, -H + 14], [hw, 0]], [4, 12, 12, 4]), `url(#${id}-s)`, stucco),
        pc(rr(-hw - 10, -H, w + 20, 24, 12), shade(stucco, 0.12), stucco),
      ]} />
      {/* the stucco's trowel texture, faint */}
      {Array.from({length: 18}, (_, i) => <path key={i} d={`M${-hw + 20 + rnd(seed, i) * (w - 60)} ${-30 - rnd(seed, 30 + i) * 330} q14 -4 28 0`}
        stroke={shade(stucco, 0.12)} strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.5} />)}
      {ghost && letters.map((_, i) => <path key={i} d={rr(-hw * 0.7 + i * lw * 0.9, -290, lw * 0.6, 60, 12)} fill="#b9a68a" opacity={0.25} />)}
      {/* THE PAINTED NAME, drawn by eye */}
      {letters.map((ch, i) => {
        const x = -((letters.length - 1) / 2) * lw + i * lw;
        const drift = (rnd(seed, 20 + i) - 0.5) * 14, rot = (rnd(seed, 40 + i) - 0.5) * 6, sz = 92 + rnd(seed, 60 + i) * 14;
        return <g key={i} transform={`translate(${x.toFixed(1)} ${(-268 + drift).toFixed(1)}) rotate(${rot.toFixed(1)})`}>
          <text x={6} y={6} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={sz} fill={navy}>{ch}</text>
          <text x={0} y={0} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={sz} fill={red} stroke="#fff6e4"
            strokeWidth={3} paintOrder="stroke">{ch}</text>
        </g>;
      })}
      <text x={0} y={-226} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={30} fill={navy} letterSpacing={4}
        transform="rotate(-0.8 0 -230)">FRUTAS  CARNES  HIELO</text>
      {banner && <g>
        <path d={rr(-hw * 0.78, -352, hw * 1.56, 126, 8)} fill="#fbfbf6" stroke={line('#fbfbf6')} strokeWidth={ow} />
        <path d={rr(-hw * 0.78 + 8, -344, hw * 1.56 - 16, 110, 6)} fill="none" stroke="#2f7fe0" strokeWidth={5} />
        <path d={rr(-hw * 0.6, -322, hw * 1.2, 26, 13)} fill="#2f7fe0" />
        <path d={rr(-hw * 0.45, -284, hw * 0.9, 18, 9)} fill="#e0322e" />
        {[-1, 1].map((s) => <circle key={s} cx={s * hw * 0.74} cy={-346} r={3} fill="#2c2838" />)}
      </g>}
      {/* the shallow metal awning */}
      <path d={roundPoly([[-hw + 8, -206], [hw - 8, -206], [hw - 20, -182], [-hw + 20, -182]], 6)} fill={`url(#${id}-a)`} stroke={line('#b86a3c')}
        strokeWidth={ow} />
      {Array.from({length: 16}, (_, i) => <path key={i} d={`M${-hw + 30 + i * ((w - 60) / 15)} -204 V-184`} stroke={shade('#b86a3c', 0.25)}
        strokeWidth={2} />)}
      {/* the window behind its scrolled bars, and the door */}
      <path d={rr(-hw + 60, -166, 300, 116, 10)} fill={`url(#${id}-g)`} stroke={line(trim)} strokeWidth={ow} />
      {!night && [0, 1, 2].map((i) => <path key={i} d={rr(-hw + 80 + i * 92, -146, 70, 18, 6)} fill={['#ffcc2e', '#ff6a3c', '#38a84f'][i]}
        opacity={0.85} />)}
      <path d={`M${-hw + 70 + ((t * 40) % 300)} -160 l-30 104`} stroke="#ffffff" strokeWidth={10} opacity={0.18} strokeLinecap="round" />
      {bars && <g>
        {Array.from({length: 9}, (_, i) => <path key={i} d={`M${-hw + 78 + i * 33} -162 V-54`} stroke="#fff6e4" strokeWidth={3.4} />)}
        {Array.from({length: 4}, (_, i) => <path key={`s${i}`} d={`M${-hw + 78 + i * 66} -108 q16 -16 33 0 q16 16 33 0`} stroke="#fff6e4"
          strokeWidth={3.2} fill="none" strokeLinecap="round" />)}
      </g>}
      <path d={rr(60, -178, 104, 178, 8)} fill={trim} stroke={line(trim)} strokeWidth={ow} />
      <path d={rr(72, -166, 80, 92, 6)} fill={`url(#${id}-g)`} />
      <circle cx={148} cy={-86} r={3.4} fill="#e8d07a" />
      <g transform={`translate(112 -150) rotate(${swing})`}>
        <path d="M-14 -6 L0 -16 L14 -6" stroke="#2c2838" strokeWidth={0.9} fill="none" />
        <path d={rr(-20, -6, 40, 16, 4)} fill="#fff6e4" stroke={line('#fff6e4')} strokeWidth={ow * 0.5} />
        <text x={0} y={5.6} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={9.6} fill={red}>ABIERTO</text>
      </g>
      {/* the ice chest out front */}
      <g transform={`translate(${Math.min(hw - 80, 280)} 0)`}>
        <path d={rr(-50, -96, 100, 92, 10)} fill="#f6f8fc" stroke={line('#f6f8fc')} strokeWidth={ow} />
        <path d={rr(-44, -84, 88, 30, 8)} fill="#2f7fe0" />
        <text x={0} y={-62} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={20} fill="#ffffff" letterSpacing={3}>HIELO</text>
        <path d="M-40 -40 H40" stroke="#c9d3e8" strokeWidth={3} strokeLinecap="round" />
        <path d="M-42 -92 L-42 -14" stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.6} />
      </g>
      {wear > 0.3 && <path d={rr(-hw + 2, -40, w - 4, 38, 14)} fill="#d8c49a" opacity={wear * 0.45} />}
      <Sheen d={`M${-hw + 12} ${-H + 36} L${-hw + 12} -20`} w={5} o={0.45} />
    </g>
  );
};

// ============================================================================ the colonia block

/** a round citrus tree with its fruit, swaying a little */
const Citrus: React.FC<{x: number; ow: number; frame: number; seed: number}> = ({x, ow, frame, seed}) => {
  const s = Math.sin(frame / 30 * 2 * Math.PI / 3.8 + seed) * 2;
  return <g transform={`translate(${x} 0)`}>
    <Pass ow={ow} list={[tb('M0 0 Q4 -60 0 -110', '#6e4a30', 14)]} />
    <g transform={`rotate(${s} 0 -110)`}>
      <Pass ow={ow} list={[pc(ell(0, -170, 96, 82), '#3f8a3a', '#3f8a3a'), pc(ell(-50, -130, 56, 48), '#4a9a42', '#3f8a3a'),
        pc(ell(54, -134, 52, 46), '#357a34', '#3f8a3a')]} />
      <ellipse cx={-30} cy={-208} rx={40} ry={20} fill="#7ac35c" opacity={0.5} />
      {Array.from({length: 9}, (_, k) => <circle key={k} cx={(rnd(seed, k) - 0.5) * 160} cy={-150 + (rnd(seed, 40 + k) - 0.5) * 110} r={10}
        fill="#ffcc2e" stroke={line('#ffcc2e')} strokeWidth={Math.max(2, ow * 0.5)} />)}
    </g>
  </g>;
};

/**
 * THE COLONIA BLOCK, a housing strategy and never a slum. One block shows every stage of a house at
 * once, a finished stucco house on its slab with a carport and a swept yard, a mobile home with a
 * stick-framed room added and one new roof thrown over both, and a poured slab with a fresh frame going
 * up and the family living in the travel trailer beside it, lumber stacked and a wheelbarrow waiting,
 * visibly under construction and never abandoned. A citrus tree on every lot, a water tank on a timber
 * stand, the poles with their heavy droop, and the bone white caliche road in front that throws light
 * back up under everything. `w` is the block's width in centimetres and `lots` how many stand on it.
 */
export const ColoniaBlockV2: React.FC<TejanoPropsV2 & {w?: number; lots?: number; tank?: boolean}> = (p) => {
  const {frame = 0, seed = 129, wear = 0.4, night = false, w = 2780, lots = 3, tank = true} = p;
  const id = useUid(), ow = owOf(p), t = frame / 30;
  const STUCCO = ['#f2c49b', '#bfe0c4', '#f4d0d8'], win = night ? '#ffe2a0' : '#3d4a7a', wood = '#e8c27a';
  const lotW = w / Math.max(1, lots);
  return (
    <g transform={at(p)}>
      <defs>
        {STUCCO.map((c, i) => <Lit key={i} id={`${id}-s${i}`} c={c} x2={1} y2={0.4} />)}
        <Lit id={`${id}-t`} c="#f6f2ea" /><Lit id={`${id}-r`} c="#8a5a44" x2={0.2} /><Lit id={`${id}-g`} c="#5aa86a" x2={0.2} />
        <Lit id={`${id}-tk`} c="#3b5ea8" x2={1} y2={0} /><Lit id={`${id}-tt`} c="#f4f0e4" />
        <linearGradient id={`${id}-c`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fff8e8" /><stop offset="100%" stopColor="#e6dcc2" />
        </linearGradient>
      </defs>
      {/* the poles and their wires, behind the houses */}
      {Array.from({length: 5}, (_, i) => {
        const px = -w * 0.48 + i * w * 0.24;
        const sag = 60 + Math.sin(t * 2 * Math.PI / 5 + i) * 6;
        return <g key={i}>
          <Pass ow={ow} list={[tb(`M${px} 0 L${px} -520`, '#8a6a4a', 18), tb(`M${px - 70} -496 L${px + 70} -496`, '#8a6a4a', 10)]} />
          {i > 0 && [-50, 50].map((dx) => <path key={dx} d={`M${px - w * 0.24 + dx} -494 Q${px - w * 0.12 + dx} ${-494 + sag * 2} ${px + dx} -494`}
            stroke="#3a3450" strokeWidth={Math.max(3, ow * 0.6)} fill="none" />)}
        </g>;
      })}
      {tank && <g transform={`translate(${w * 0.36} 0)`}>
        <Pass ow={ow} list={[tb('M-70 0 L-60 -220', '#a8845a', 14), tb('M70 0 L60 -220', '#a8845a', 14), tb('M-62 -110 L62 -110', '#a8845a', 10),
          pc(rr(-90, -236, 180, 18, 8), '#a8845a', '#a8845a'), pc(rr(-80, -400, 160, 166, 40), `url(#${id}-tk)`, '#3b5ea8')]} />
        <path d="M-60 -380 V-260" stroke="#ffffff" strokeWidth={8} strokeLinecap="round" opacity={0.35} />
      </g>}
      {Array.from({length: lots}, (_, i) => {
        const lx = -w / 2 + lotW * (i + 0.5), stage = i % 3, c = STUCCO[i % 3];
        return <g key={i} transform={`translate(${lx} 0)`}>
          <ContactShadow x={0} y={4} w={lotW * 0.9} opacity={0.26} />
          {stage === 0 && <g>
            {/* finished, stucco on a slab, gable roof, carport, swept yard */}
            <ellipse cx={20} cy={8} rx={380} ry={22} fill="#e2d2a8" />
            {[-200, -80, 60, 180].map((x) => <path key={x} d={`M${x} 12 q40 -10 80 0`} stroke="#cdb98a" strokeWidth={3} fill="none" strokeLinecap="round" />)}
            <Pass ow={ow} list={[
              pc(rr(160, -236, 220, 16, 6), '#9aa6c0', '#9aa6c0'), tb('M364 -224 L364 0', '#9aa6c0', 10),
              pc(roundPoly([[-300, 0], [-300, -250], [180, -250], [180, 0]], [4, 8, 8, 4]), `url(#${id}-s${i % 3})`, c),
              pc(roundPoly([[-330, -240], [-60, -360], [210, -240]], 14), `url(#${id}-r)`, '#8a5a44'),
            ]} />
            {[-240, -110].map((x) => <g key={x}><path d={rr(x, -200, 80, 80, 8)} fill={win} stroke={line(c)} strokeWidth={ow} />
              <path d={`M${x + 40} -200 V-120 M${x} -160 H${x + 80}`} stroke={light(c, 0.4)} strokeWidth={4} /></g>)}
            <path d={rr(40, -190, 70, 190, 8)} fill="#c0503c" stroke={line('#c0503c')} strokeWidth={ow} />
            <circle cx={98} cy={-96} r={4} fill="#f2d27a" />
            {[-280, -200].map((x, k) => <g key={k} transform={`translate(${x + 300} 0)`}>
              <path d={rr(-14, -30, 28, 30, 6)} fill="#d4683c" stroke={line('#d4683c')} strokeWidth={ow * 0.6} />
              <circle cx={0} cy={-44} r={16} fill={k ? '#ff4f9a' : '#4a9a42'} stroke={line(k ? '#ff4f9a' : '#4a9a42')} strokeWidth={ow * 0.6} />
            </g>)}
          </g>}
          {stage === 1 && <g>
            {/* the hybrid, a trailer, a framed room added, one new roof over both */}
            <Pass ow={ow} list={[
              pc(rr(-330, -190, 380, 176, 22), `url(#${id}-t)`, '#f6f2ea'),
              pc(roundPoly([[50, 0], [50, -220], [280, -220], [280, 0]], [4, 6, 6, 4]), `url(#${id}-s${i % 3})`, c),
              pc(roundPoly([[-356, -196], [-30, -300], [306, -214], [296, -200], [-30, -282], [-350, -182]], 8), `url(#${id}-g)`, '#5aa86a'),
            ]} />
            <path d="M-330 -120 H50" stroke="#4a7ad0" strokeWidth={8} />
            {[-290, -190, -90].map((x) => <path key={x} d={rr(x, -164, 60, 36, 6)} fill={win} />)}
            <path d={rr(110, -170, 70, 70, 8)} fill={win} stroke={line(c)} strokeWidth={ow} />
            <path d={rr(-330, -20, 380, 20, 4)} fill="#a8a0b4" />
            {wear > 0.3 && <path d="M-300 -60 q4 30 0 40 M-240 -60 q4 24 0 34" stroke="#b86a3c" strokeWidth={5} opacity={wear * 0.7} strokeLinecap="round" />}
            {[0, 1, 2, 3].map((k) => <path key={k} d={`M${-30 - 280 + k * 180} -290 L${-30 - 280 + k * 180 + 20} -200`} stroke={shade('#5aa86a', 0.25)}
              strokeWidth={3} opacity={0.6} />)}
          </g>}
          {stage === 2 && <g>
            {/* building, a poured slab and a fresh frame, the travel trailer beside it */}
            <path d={rr(-340, -16, 440, 20, 6)} fill="#c7c4d2" stroke={line('#c7c4d2')} strokeWidth={ow} />
            <Pass ow={ow} list={[
              ...Array.from({length: 9}, (_, k) => tb(`M${-320 + k * 50} -16 L${-320 + k * 50} -250`, wood, 9)),
              tb('M-326 -252 L86 -252', wood, 11), tb('M-326 -130 L86 -130', wood, 7),
              tb('M-326 -252 L-120 -340 L86 -252', wood, 9),
            ]} />
            <path d="M120 0 L180 -150" stroke={line('#b0b8cc')} strokeWidth={10} strokeLinecap="round" />
            <path d="M120 0 L180 -150 M150 0 L210 -150" stroke="#b0b8cc" strokeWidth={6} strokeLinecap="round" />
            <path d={rr(-120, -36, 140, 20, 4)} fill={wood} stroke={line(wood)} strokeWidth={ow * 0.6} />
            <g transform="translate(300 0)">
              <Pass ow={ow} list={[pc(rr(-110, -150, 230, 130, 40), `url(#${id}-tt)`, '#f4f0e4')]} />
              <path d="M-108 -96 H118" stroke="#e0503c" strokeWidth={10} />
              <path d={rr(-80, -128, 50, 30, 8)} fill={win} />
              <path d={rr(10, -130, 40, 104, 6)} fill={shade('#f4f0e4', 0.15)} stroke={line('#f4f0e4')} strokeWidth={ow * 0.6} />
              {[-60, 70].map((x) => <circle key={x} cx={x} cy={-20} r={22} fill="#2c2838" stroke={line('#2c2838')} strokeWidth={ow} />)}
              <path d="M-108 -150 L-150 -120 L-30 -120 Z" fill="#e0a83c" opacity={0} />
            </g>
          </g>}
          <Citrus x={-lotW * 0.42} ow={ow} frame={frame} seed={seed + i * 7} />
        </g>;
      })}
      {/* THE CALICHE ROAD, bone white, and the soft ditch beyond it, no curb anywhere */}
      <path d={rr(-w * 0.54, 20, w * 1.08, 90, 40)} fill={`url(#${id}-c)`} />
      <path d={`M${-w * 0.5} 50 Q0 40 ${w * 0.5} 54`} stroke="#ffffff" strokeWidth={10} fill="none" opacity={0.6} strokeLinecap="round" />
      <path d={rr(-w * 0.54, 112, w * 1.08, 22, 11)} fill="#b6ac80" opacity={0.6} />
    </g>
  );
};

// ============================================================================ the pedestrian bridge

const CARRY = ['#e0323c', '#2f7fe0', '#38a84f', '#f2c935', '#9a4fc4', '#f08a2c', '#ff5f8a', '#25b5a8'];

/**
 * THE PEDESTRIAN BRIDGE, a commute and never an event. A narrow walkway behind a pipe rail and a low
 * curb, caged by galvanised mesh that curves inward at the top, so the crossing reads as a corridor
 * with a strip of sky. The mesh pushes everything toward grey, so the only colour is the people and
 * what they carry, and everyone carries something, a shopping bag, a box, a school backpack, a rolling
 * cart, a child's hand. The people are the cast rig, breathing and blinking in line. `queue` is how
 * many wait and `w` is the span in centimetres.
 */
export const PedestrianBridgeV2: React.FC<TejanoPropsV2 & {w?: number; queue?: number; canopy?: boolean}> = (p) => {
  const {frame = 0, seed = 130, w = 1836, queue = 12, canopy = true} = p;
  const id = useUid(), ow = owOf(p);
  const mesh = '#a9b2c6', conc = '#c8c6d4', hw = w / 2;
  const k = 165 / 504;
  const cage = `M${-hw} -24 L${-hw} -340 Q${-hw} -372 ${-hw + 40} -374 L${hw - 40} -374 Q${hw} -372 ${hw} -340 L${hw} -24 Z`;
  const SH = ['#3b5ea8', '#6a4a8a', '#3f8a7a', '#8a4a5a', '#5a6a8a', '#7a5a3a'];
  const PANTS = ['#2c3450', '#3a3446', '#4a4060', '#2a3a4a'];
  return (
    <g transform={at(p)}>
      <defs>
        <Lit id={`${id}-d`} c={conc} x2={0} />
        <clipPath id={`${id}-m`}><path d={cage} /></clipPath>
      </defs>
      <ContactShadow x={0} y={4} w={w * 1.04} opacity={0.24} />
      {/* the curb and the pipe rail on the roadway side, behind the queue */}
      <path d={rr(-hw, -24, w, 24, 6)} fill={shade(conc, 0.1)} />
      <Pass ow={ow} list={[tb(`M${-hw} -104 L${hw} -104`, mesh, 6), ...Array.from({length: 13}, (_, i) =>
        tb(`M${-hw + i * (w / 12)} -24 L${-hw + i * (w / 12)} -104`, mesh, 5))]} />
      {/* THE QUEUE. Every person carries something, and the colour lives there */}
      {Array.from({length: queue}, (_, i) => {
        const f = i / Math.max(1, queue - 1), px = -hw * 0.86 + f * hw * 1.72;
        const kind = Math.floor(rnd(seed, i) * 4), carry = CARRY[(i * 3 + seed) % CARRY.length];
        const skin = SKIN_TONES[[1, 3, 2, 4, 0, 5][(i + seed) % 6]], hgt = 0.94 + rnd(seed, 30 + i) * 0.1;
        const hold = kind === 0 || kind === 1;
        const prop = kind === 0
          ? <g><path d={rr(-34, -10, 68, 70, 10)} fill={carry} stroke={line(carry)} strokeWidth={6} />
            <path d="M-18 -10 Q-18 -36 0 -36 Q18 -36 18 -10" stroke={line(carry)} strokeWidth={6} fill="none" /></g>
          : kind === 1 ? <g><path d={rr(-44, -20, 88, 64, 6)} fill="#e0b070" stroke={line('#e0b070')} strokeWidth={6} />
            <path d="M-44 0 H44" stroke={carry} strokeWidth={10} /></g> : null;
        return <g key={i} transform={`translate(${px.toFixed(1)} 0)`}>
          {kind === 2 && <g>
            {/* a rolling cart at the hand, the most common thing on that walkway */}
            <Pass ow={ow} list={[tb('M30 -62 L40 -6', '#8e96ad', 2.4), pc(rr(28, -50, 26, 40, 5), carry, carry)]} />
            <circle cx={42} cy={-5} r={5} fill="#2c2838" stroke={line('#2c2838')} strokeWidth={ow * 0.6} />
          </g>}
          <g transform={`scale(${k * hgt})`}>
            <Figure frame={frame} x={0} y={0} pose={hold ? 'hold' : 'stand'} emotion={i % 4 === 1 ? 'happy' : 'neutral'} skin={skin}
              hair={(['short', 'long', 'bun', 'curly', 'buzz'] as const)[(i + seed) % 5]} hairColor={['#2b1a12', '#1c1512', '#5a3a1e'][i % 3]}
              hat={i % 5 === 3 ? 'cap' : 'none'} hatColor={carry} top={kind === 3 ? 'jacket' : 'tee'} shirt={SH[i % SH.length]}
              pants={PANTS[i % PANTS.length]} turn={0.55} seed={seed + i * 7} build={0.3 + rnd(seed, 60 + i) * 0.5} holding={prop} />
          </g>
          {kind === 3 && <g>
            {/* a child's hand held by a smaller hand */}
            <g transform={`translate(-46 0) scale(${k * 0.6})`}>
              <Figure frame={frame} x={0} y={0} pose="stand" emotion="happy" skin={skin} hair="short" hairColor="#2b1a12" top="tee"
                shirt={carry} pants="#3a3446" turn={0.4} seed={seed + i * 11} build={0.3} />
            </g>
            <path d={rr(12, -128, 30, 40, 10)} fill={carry} stroke={line(carry)} strokeWidth={ow * 0.6} />
          </g>}
        </g>;
      })}
      {/* THE CAGE, the mesh in front, curving inward at the top, with its posts */}
      <g clipPath={`url(#${id}-m)`} opacity={0.55}>
        {Array.from({length: Math.ceil((w + 400) / 60)}, (_, i) => {
          const x = -hw - 360 + i * 60;
          return <path key={i} d={`M${x} -20 l360 -360 M${x + 360} -20 l-360 -360`} stroke="#f4f6fc" strokeWidth={Math.max(4, ow * 0.6)} />;
        })}
      </g>
      <Pass ow={ow} list={[
        ...Array.from({length: 7}, (_, i) => {
          const x = -hw + i * (w / 6);
          return tb(`M${x} -20 L${x} -330 Q${x} -370 ${x + (x < 0 ? 36 : -36)} -374`, mesh, 8);
        }),
        tb(`M${-hw} -374 L${hw} -374`, mesh, 7), tb(`M${-hw} -200 L${hw} -200`, mesh, 4),
      ]} />
      {canopy && <path d={rr(-hw * 0.6, -398, w * 0.6, 16, 8)} fill="#9aa3bd" stroke={line('#9aa3bd')} strokeWidth={ow} />}
      {/* the deck and its fascia */}
      <Pass ow={ow} list={[pc(rr(-hw - 20, -4, w + 40, 34, 10), `url(#${id}-d)`, conc)]} />
      <path d={`M${-hw} 2 H${hw}`} stroke="#ffffff" strokeWidth={4} opacity={0.5} strokeLinecap="round" />
    </g>
  );
};

// ============================================================================ the escaramuza rider

/**
 * THE ESCARAMUZA RIDER at a run, inside the arena's dust. She rides sidesaddle on the albarda with
 * both legs on the near side, her spine vertical and her shoulders square, which is the sport, and
 * her dress opens into a bell over ruffled petticoats long enough to cover the horse's haunches. A
 * wide ribbon bow at the throat and a felt charro hat with a moderate brim and a low crown. She is the
 * cast rig. The horse gallops on four tapered legs with a streaming mane and tail and a face that
 * watches the line ahead, and the pale ochre dust rises behind it lit from the back.
 */
export const EscaramuzaRiderV2: React.FC<Place & {colour?: string; horse?: string; dust?: boolean}> = (p) => {
  const {frame = 0, seed = 131, colour = '#d4213d', horse = '#9a5530', dust = true} = p;
  const id = useUid(), ow = owOf(p), t = frame / 30;
  const dark = '#2e2232', cs = shade(horse, 0.32), hat = '#3a2c26', skin = SKIN_TONES[2], blaze = '#fbf3e6';
  const ph = t * 2 * Math.PI * 1.5;
  const bob = Math.sin(ph * 2) * 2.4;
  const deg = Math.PI / 180;
  const B = (y: number) => y + bob;
  // a leg in three bones from its top joint, phase off in turns, swinging forward and folding as it lifts
  const leg = (sx: number, sy: number, off: number, front: boolean) => {
    const q = ph + off * 2 * Math.PI, s = Math.sin(q), lift = Math.max(0, Math.cos(q));
    const a1 = front ? s * 26 : s * 22 - 14;
    const a2 = front ? a1 - lift * 92 : a1 + 20 + lift * 46;
    const a3 = front ? a2 - lift * 24 + 12 : a2 + lift * 18 + 10;
    const L = front ? [42, 36, 14] : [46, 38, 14];
    const j0: Pt = [sx, B(sy)];
    const j1: Pt = [j0[0] + Math.sin(a1 * deg) * L[0], j0[1] + Math.cos(a1 * deg) * L[0]];
    const j2: Pt = [j1[0] + Math.sin(a2 * deg) * L[1], j1[1] + Math.cos(a2 * deg) * L[1]];
    const j3: Pt = [j2[0] + Math.sin(a3 * deg) * L[2], j2[1] + Math.cos(a3 * deg) * L[2]];
    const top = front ? 30 : 38;
    const d = taper([j0, j1, j2, j3], top, 9, (u) => u < 0.36 ? top - (top - 13) * (u / 0.36) : u < 0.72 ? 13 - (u - 0.36) * 4 : 12.4 - (u - 0.72) * 9);
    return {d, h: j3, a3};
  };
  const legs = [
    {...leg(-80, -112, 0.12, false), far: true}, {...leg(60, -108, 0.58, true), far: true},
    {...leg(-74, -112, 0.0, false), far: false}, {...leg(64, -108, 0.45, true), far: false},
  ];
  const hoof = (l: {h: Pt; a3: number}, c: string) => <path d={rr(-6.4, -3, 12.8, 9, 3.4)}
    transform={`translate(${l.h[0].toFixed(1)} ${l.h[1].toFixed(1)}) rotate(${(-l.a3).toFixed(1)})`} fill={c} stroke={line(c)} strokeWidth={ow * 0.8} />;
  const wave = Math.sin(t * 2 * Math.PI * 1.5) * 6;
  const body = `M-110 ${B(-122)} C-114 ${B(-152)} -90 ${B(-154)} -70 ${B(-149)} C-30 ${B(-140)} 10 ${B(-142)} 40 ${B(-153)} C64 ${B(-158)} 90 ${B(-142)} 92 ${B(-118)}
    C94 ${B(-96)} 74 ${B(-84)} 52 ${B(-84)} C20 ${B(-80)} -30 ${B(-82)} -62 ${B(-90)} C-92 ${B(-94)} -108 ${B(-104)} -110 ${B(-122)} Z`;
  const neck = roundPoly([[26, B(-146)], [100, B(-204)], [130, B(-184)], [90, B(-110)]], [20, 14, 14, 24]);
  const head = taper([[112, B(-198)], [132, B(-174)], [152, B(-150)]], 36, 23);
  const tail = taper([[-104, B(-140)], [-130, B(-142) + wave * 0.3], [-150, B(-122) + wave * 0.6], [-164, B(-90) + wave]], 22, 14,
    (u) => 22 + Math.sin(u * Math.PI) * 14 - u * 8);
  // the rider, on the cast rig, seated sidesaddle with her hips on the albarda
  const k = 160 / 504, seatX = 4, seatY = B(-152);
  const figY = seatY + 150 * k;
  const fBob = Math.sin(t * 2 * Math.PI / 3.6 + seed) * 3;
  const headY = figY + (-420 + fBob) * k;
  const hand: Pt = [seatX + 6 * k, figY - 200 * k];
  const flut = Math.sin(t * 2 * Math.PI * 1.5 + 1) * 3;
  const dustPuffs = Array.from({length: 9}, (_, i) => {
    const age = ((frame + i * 13.3) % 40) / 40;
    const x = -110 - age * 150 - rnd(seed, i) * 30, y = -16 - age * 46 - rnd(seed, 10 + i) * 24;
    return <circle key={i} cx={x} cy={y} r={20 + age * 34} fill={`url(#${id}-u)`} opacity={Math.sin(age * Math.PI) * 0.6} />;
  });
  return (
    <g transform={at(p)}>
      <defs>
        <Lit id={`${id}-h`} c={horse} x2={0.3} /><Lit id={`${id}-d`} c={colour} x2={0.6} />
        <radialGradient id={`${id}-u`} cx="65%" cy="35%" r="60%"><stop offset="0%" stopColor="#fff0c8" /><stop offset="55%" stopColor="#e8c88a" stopOpacity={0.7} />
          <stop offset="100%" stopColor="#d8b27a" stopOpacity={0} /></radialGradient>
      </defs>
      {dust && dustPuffs}
      <ContactShadow x={-6} y={2} w={270} opacity={0.32} />
      {/* the far legs, darker, behind the body, and the tail streaming */}
      <Pass ow={ow} list={legs.filter((l) => l.far).map((l) => pc(l.d, cs, horse))} />
      {legs.filter((l) => l.far).map((l, i) => <g key={i}>{hoof(l, dark)}</g>)}
      <Pass ow={ow} list={[pc(tail, dark, dark)]} />
      <path d={`M-112 ${B(-136)} Q-140 ${B(-132) + wave * 0.4} -156 ${B(-96) + wave}`} stroke={light(dark, 0.3)} strokeWidth={2} fill="none" strokeLinecap="round" />
      {/* the near side, joined, the neck, barrel, shoulder and quarters, near legs and head */}
      <Pass ow={ow} list={[
        pc(neck, `url(#${id}-h)`, horse), pc(body, `url(#${id}-h)`, horse),
        ...legs.filter((l) => !l.far).map((l) => pc(l.d, `url(#${id}-h)`, horse)),
        pc(ell(-74, B(-118), 36, 32), `url(#${id}-h)`, horse), pc(ell(62, B(-112), 28, 28), `url(#${id}-h)`, horse),
        pc(head, `url(#${id}-h)`, horse),
      ]} />
      {legs.filter((l) => !l.far).map((l, i) => <g key={i}>{hoof(l, dark)}</g>)}
      <path d={`M-96 ${B(-140)} Q-60 ${B(-150)} -20 ${B(-140)}`} stroke="#ffffff" strokeWidth={6} fill="none" opacity={0.28} strokeLinecap="round" />
      <path d={`M-100 ${B(-118)} A30 28 0 0 1 -60 ${B(-144)}`} stroke={cs} strokeWidth={2.4} fill="none" opacity={0.6} />
      {/* the mane along the crest, the ears, the blaze, the bridle and the face */}
      <path d={`M34 ${B(-152)} Q72 ${B(-180)} 104 ${B(-206)}`} stroke={line(dark)} strokeWidth={13 + ow * 2} fill="none" strokeLinecap="round" />
      <path d={`M34 ${B(-152)} Q72 ${B(-180)} 104 ${B(-206)}`} stroke={dark} strokeWidth={13} fill="none" strokeLinecap="round" />
      {[0, 1, 2, 3].map((i) => <path key={i} d={`M${46 + i * 14} ${B(-162 - i * 10)} q-14 ${-3 + Math.sin(t * 9 + i) * 3} -24 ${5}`} stroke={dark}
        strokeWidth={6} fill="none" strokeLinecap="round" />)}
      <path d={`M104 ${B(-202)} L106 ${B(-224)} L117 ${B(-202)} Z`} fill={horse} stroke={line(horse)} strokeWidth={ow * 1.4} strokeLinejoin="round" />
      <path d={`M122 ${B(-190)} Q138 ${B(-170)} 148 ${B(-154)}`} stroke={blaze} strokeWidth={5} strokeLinecap="round" fill="none" />
      <ellipse cx={150} cy={B(-152)} rx={3.6} ry={2.4} fill={dark} transform={`rotate(40 150 ${B(-152)})`} />
      <path d={`M150 ${B(-142)} Q144 ${B(-140)} 140 ${B(-144)}`} stroke={line(horse)} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <path d={`M114 ${B(-186)} L144 ${B(-152)} M124 ${B(-200)} L120 ${B(-166)} L144 ${B(-152)}`} stroke="#7a2a1e" strokeWidth={3.2} strokeLinecap="round"
        strokeLinejoin="round" fill="none" />
      <circle cx={120} cy={B(-166)} r={2.6} fill="#e8edf6" />
      <g transform={`translate(124 ${B(-186)})`}>
        <ellipse rx={5.4} ry={5.8} fill="#ffffff" stroke={line(horse)} strokeWidth={ow * 0.7} />
        <circle cx={1.8} cy={0.6} r={3.7} fill="#1f1736" /><circle cx={0.5} cy={-1.4} r={1.3} fill="#ffffff" />
        <path d="M-6 -8.4 Q0 -10.6 6.4 -7.6" stroke={shade(horse, 0.5)} strokeWidth={2} fill="none" strokeLinecap="round" />
      </g>
      {/* the albarda, and the reins from her hands to the bit */}
      <path d={rr(-22, seatY - 4, 50, 12, 6)} fill="#6a3a22" stroke={line('#6a3a22')} strokeWidth={ow} />
      <path d={`M${hand[0]} ${hand[1]} Q70 ${B(-150)} 144 ${B(-152)}`} stroke="#5a2a1a" strokeWidth={1.8} fill="none" />
      {/* the back of the bell over the haunches */}
      <path d={`M-12 ${seatY - 6} C-50 ${seatY + 2} -76 ${seatY + 26} -86 ${seatY + 58 + flut} Q-30 ${seatY + 70} 18 ${seatY + 62} Z`}
        fill={shade(colour, 0.3)} stroke={line(colour)} strokeWidth={ow * 2} strokeLinejoin="round" paintOrder="stroke" />
      <g transform={`translate(${seatX} ${figY}) scale(${k})`}>
        <Figure frame={frame} x={0} y={0} pose="hold" emotion="proud" skin={skin} hair="bun" hairColor="#1c1512" top="tee" shirt={colour}
          pants={colour} turn={0.45} seed={seed} build={0.2} />
      </g>
      {/* the dress, a bell over ruffled petticoats, both legs hidden on the near side, the spine upright */}
      <g transform={`translate(${seatX} 0)`}>
        {[2, 1, 0].map((r) => <path key={r} d={`M-92 ${seatY + 64 - r * 5 + flut} Q-34 ${seatY + 82 - r * 5} 26 ${seatY + 68 - r * 5} L24 ${seatY + 56 - r * 5}
          Q-34 ${seatY + 70 - r * 5} -88 ${seatY + 52 - r * 5 + flut} Z`} fill={r % 2 ? '#fff6ec' : light(colour, 0.5)} stroke={line(colour)} strokeWidth={ow}
          strokeLinejoin="round" />)}
        <path d={`M-16 ${seatY - 18} L16 ${seatY - 18} C26 ${seatY + 4} 32 ${seatY + 30} 26 ${seatY + 62} Q-32 ${seatY + 76} -90 ${seatY + 56 + flut}
          C-74 ${seatY + 30} -40 ${seatY + 6} -16 ${seatY - 18} Z`} fill={`url(#${id}-d)`} stroke={line(colour)} strokeWidth={ow * 2}
          strokeLinejoin="round" paintOrder="stroke" />
        {[-50, -24, 2].map((x, i) => <path key={i} d={`M${x * 0.25} ${seatY - 8} Q${x * 0.7} ${seatY + 26} ${x * 1.25 - 4} ${seatY + 68}`}
          stroke={shade(colour, 0.3)} strokeWidth={2.2} fill="none" opacity={0.55} />)}
        <path d={`M-10 ${seatY - 10} Q-26 ${seatY + 18} -52 ${seatY + 52}`} stroke="#ffffff" strokeWidth={4} fill="none" opacity={0.35} strokeLinecap="round" />
        <path d={`M-14 ${seatY - 16} Q0 ${seatY - 12} 14 ${seatY - 16}`} stroke="#fff6ec" strokeWidth={3} fill="none" strokeLinecap="round" />
        {/* the wide ribbon bow at the throat */}
        <g transform={`translate(${0.45 * 16 * k} ${figY - 338 * k})`}>
          <path d="M0 0 C-10 -8 -16 -2 -14 4 C-12 9 -4 6 0 0 C4 6 12 9 14 4 C16 -2 10 -8 0 0 Z" fill="#fff6ec" stroke={line('#e8dcc8')}
            strokeWidth={ow * 0.6} />
          <path d="M-2 1 L-6 12 M2 1 L6 12" stroke="#fff6ec" strokeWidth={3} strokeLinecap="round" />
        </g>
        {/* the felt charro hat, a moderate brim and a low crown */}
        <g transform={`translate(${0.45 * 16 * k} ${headY - 70 * k})`}>
          <path d={`M${-128 * k} 0 Q${-120 * k} ${-14 * k} 0 ${-16 * k} Q${120 * k} ${-14 * k} ${128 * k} 0 Q${110 * k} ${22 * k} 0 ${22 * k}
            Q${-110 * k} ${22 * k} ${-128 * k} 0 Z`} fill={hat} stroke={line(hat)} strokeWidth={ow * 1.4} strokeLinejoin="round" />
          <path d={`M${-50 * k} ${-4 * k} Q${-52 * k} ${-58 * k} 0 ${-60 * k} Q${52 * k} ${-58 * k} ${50 * k} ${-4 * k} Z`} fill={hat}
            stroke={line(hat)} strokeWidth={ow * 1.4} strokeLinejoin="round" />
          <path d={`M${-50 * k} ${-12 * k} Q0 ${-4 * k} ${50 * k} ${-12 * k}`} stroke="#d8b25a" strokeWidth={10 * k} fill="none" />
          <path d={`M${-36 * k} ${-30 * k} Q${-30 * k} ${-50 * k} ${-8 * k} ${-52 * k}`} stroke="#ffffff" strokeWidth={6 * k} fill="none" opacity={0.3}
            strokeLinecap="round" />
        </g>
      </g>
    </g>
  );
};

// ============================================================================ the star pinata

const TISSUE = ['#ff4a3c', '#ffcc2e', '#38b85a', '#2f7fe0', '#ff4fae', '#ff8a2c', '#9a5ad8'];

/**
 * THE SEVEN POINTED STAR PINATA, the older object. Seven cones spaced so no two read as a simple axis,
 * each a different colour, the core and every cone covered in rows of fringed tissue with each row's
 * fringe hanging over the next, so the whole thing reads shaggy rather than smooth, and a foil tassel
 * streaming from every tip. It hangs from a rope and turns a little on it, and `swing` sets how hard
 * it has been hit. Placed at its core. `rope` is the length of rope drawn above it in centimetres.
 */
export const StarPinataV2: React.FC<Place & {cones?: number; swing?: number; rows?: number; rope?: number}> = (p) => {
  const {frame = 0, seed = 132, cones = 7, swing = 0, rows = 4, rope = 120} = p;
  const id = useUid(), ow = owOf(p), t = frame / 30;
  const core = 17;
  const sway = Math.sin(t * 2 * Math.PI / 2.6 + seed) * (2 + 8 * swing);
  const fringe = (x0: number, x1: number, sc: number) => {
    let d = `M${x0} -60 L${x1} -60 `;
    const n = 12;
    for (let j = 0; j <= n; j++) {
      const y = -60 + (j / n) * 120;
      d += `Q${x1 + sc} ${y - 5} ${x1} ${y} `;
    }
    return d + `L${x0} 60 Z`;
  };
  const conesList = Array.from({length: cones}, (_, i) => {
    const a = -Math.PI / 2 + 0.22 + (i / cones) * Math.PI * 2 + (rnd(seed, i) - 0.5) * 0.3;
    const len = 40 + rnd(seed, 20 + i) * 7;
    return {a, len, col: TISSUE[i % TISSUE.length], d: roundPoly([[core * 0.55, -core * 0.66], [len, 0], [core * 0.55, core * 0.66]], [4, 3, 4])};
  });
  return (
    <g transform={at(p)}>
      <g transform={`rotate(${sway} 0 ${-core - rope})`}>
        <path d={`M0 ${-core - rope} L0 ${-core + 2}`} stroke={line('#d8c9a0')} strokeWidth={2 + ow * 2} strokeLinecap="round" />
        <path d={`M0 ${-core - rope} L0 ${-core + 2}`} stroke="#e8dbb4" strokeWidth={2} strokeLinecap="round" />
        {/* outlines of every cone and the core first, so they join without a seam */}
        {conesList.map((c, i) => <path key={i} d={c.d} transform={`rotate(${c.a * 180 / Math.PI})`} fill={line(c.col)} stroke={line(c.col)}
          strokeWidth={ow * 2} strokeLinejoin="round" />)}
        <circle r={core} fill={line(TISSUE[0])} stroke={line(TISSUE[0])} strokeWidth={ow * 2} />
        {conesList.map((c, i) => <g key={i} transform={`rotate(${c.a * 180 / Math.PI})`}>
          <clipPath id={`${id}-c${i}`}><path d={c.d} /></clipPath>
          <path d={c.d} fill={c.col} />
          <g clipPath={`url(#${id}-c${i})`}>
            {Array.from({length: rows}, (_, r) => rows - 1 - r).map((r) => {
              const x0 = core * 0.5 + (r / rows) * (c.len - core * 0.5), x1 = x0 + (c.len - core * 0.5) / rows;
              const col = r % 2 ? light(c.col, 0.28) : c.col;
              return <path key={r} d={fringe(x0, x1, 4.4)} fill={col} stroke={shade(c.col, 0.3)} strokeWidth={0.5} />;
            })}
            <path d={`M${core * 0.6} -4 L${c.len - 4} -1`} stroke="#ffffff" strokeWidth={2} opacity={0.35} strokeLinecap="round" />
          </g>
          {/* the foil tassel at the tip */}
          {Array.from({length: 7}, (_, q) => {
            const fl = Math.sin(t * 2 * Math.PI * 1.4 + q + i) * 2.4;
            return <path key={q} d={`M${c.len - 2} 0 q4 ${(q - 3) * 1 + fl * 0.4} 9 ${(q - 3) * 1.8 + fl}`} stroke={q % 2 ? '#f6d860' : '#dfe6f4'}
              strokeWidth={0.9} fill="none" strokeLinecap="round" />;
          })}
        </g>)}
        {/* the core, fringed in horizontal rows, each row hanging over the one below */}
        <clipPath id={`${id}-k`}><circle r={core} /></clipPath>
        <circle r={core} fill={TISSUE[0]} />
        <g clipPath={`url(#${id}-k)`}>
          {Array.from({length: 6}, (_, r) => {
            const y0 = -core + r * (core * 2 / 6), col = TISSUE[(r + 2) % TISSUE.length];
            let d = `M${-core - 2} ${y0 - 2} H${core + 2} V${y0 + 6} `;
            for (let j = 8; j >= 0; j--) d += `Q${-core + (j + 0.5) * (core * 2 / 8)} ${y0 + 10} ${-core + j * (core * 2 / 8)} ${y0 + 6} `;
            return <path key={r} d={d + 'Z'} fill={col} stroke={shade(col, 0.3)} strokeWidth={0.5} />;
          })}
          <ellipse cx={-6} cy={-8} rx={7} ry={4} fill="#ffffff" opacity={0.3} />
        </g>
      </g>
    </g>
  );
};

// ============================================================================ the comal

/**
 * THE COMAL on its burner. A seasoned near-black disc with lighter rings where the flame hits, a ring
 * of blue flame flickering under it, and a rolled flour tortilla that is an imperfect circle, puffing
 * into a dome and relaxing on `frame`, with brown blisters scattered and never an even toast. Steam
 * lifts off it. Beside it the finished stack in a folded cloth with a stitched border. `corn` makes it
 * a smaller corn tortilla. Placed at the comal's centre, as the library places it.
 */
export const ComalV2: React.FC<Place & {puff?: number; stack?: number; corn?: boolean}> = (p) => {
  const {frame = 0, seed = 133, puff = 0.5, stack = 4, corn = false} = p;
  const id = useUid(), ow = owOf(p), t = frame / 30;
  const iron = '#2c2836', torti = corn ? '#f2d58a' : '#f6e8c8', cloth = '#f7efe0';
  const r = corn ? 7.6 : 10.4;
  const rise = puff * (0.5 + 0.5 * Math.sin(t * 2 * Math.PI / 2.4));
  const edge = Array.from({length: 20}, (_, i) => {
    const a = (i / 20) * Math.PI * 2, q = r * (0.93 + rnd(seed, i) * 0.13);
    return [Math.cos(a) * q, Math.sin(a) * q * 0.34 - 1.2] as Pt;
  });
  const mid = (i: number): Pt => {
    const a = edge[i % edge.length], b = edge[(i + 1) % edge.length];
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  };
  const tortD = `M${f1(mid(0))} ` + edge.map((_, i) => `Q${f1(edge[(i + 1) % edge.length])} ${f1(mid(i + 1))}`).join(' ') + ' Z';
  return (
    <g transform={at(p)}>
      <defs>
        <radialGradient id={`${id}-i`} cx="36%" cy="30%" r="80%"><stop offset="0%" stopColor="#5a5468" /><stop offset="60%" stopColor={iron} />
          <stop offset="100%" stopColor="#15121e" /></radialGradient>
        <Rad id={`${id}-t`} c={torti} /><Lit id={`${id}-c`} c={cloth} />
      </defs>
      <ContactShadow x={0} y={6} w={38} opacity={0.3} />
      {/* the ring of blue flame under the rim */}
      {Array.from({length: 11}, (_, i) => {
        const x = -12 + i * 2.4, fl = 1 + Math.sin(frame * 0.8 + i * 1.7) * 0.25;
        return <path key={i} d={`M${x - 1.2} 3.6 Q${x} ${3.6 - 3.4 * fl} ${x + 1.2} 3.6 Z`} fill="#4a8aff" opacity={0.85} />;
      })}
      <Pass ow={ow} list={[pc(ell(0, 1.2, 15.4, 5.6), '#1c1826', iron), pc(ell(0, 0, 15, 5.4), `url(#${id}-i)`, iron)]} />
      {[0.74, 0.5, 0.28].map((f, i) => <ellipse key={i} cx={0} cy={0} rx={15 * f} ry={5.4 * f} fill="none" stroke="#5a5266" strokeWidth={0.35}
        opacity={0.8} />)}
      <path d="M-11 -2.6 Q-4 -5 4 -4.8" stroke="#8a84a0" strokeWidth={0.7} fill="none" strokeLinecap="round" opacity={0.7} />
      {/* THE TORTILLA, an imperfect circle, puffing */}
      <path d={tortD} fill={`url(#${id}-t)`} stroke={line(torti)} strokeWidth={ow * 0.7} strokeLinejoin="round" />
      {rise > 0.15 && <path d={`M${-r * 0.6} -1.4 Q0 ${-1.4 - rise * 7} ${r * 0.6} -1.4 Q0 ${-0.4} ${-r * 0.6} -1.4 Z`} fill={light(torti, 0.3)}
        stroke={line(torti)} strokeWidth={ow * 0.4} />}
      {Array.from({length: 10}, (_, i) => {
        const bx = (rnd(seed, 40 + i) - 0.5) * r * 1.5, byy = (rnd(seed, 60 + i) - 0.5) * r * 0.42 - 1.2 - (Math.abs(bx) < r * 0.5 ? rise * 3 : 0);
        return <ellipse key={i} cx={bx} cy={byy} rx={0.5 + rnd(seed, 80 + i) * 0.7} ry={0.3 + rnd(seed, 100 + i) * 0.25}
          fill={i < 3 ? '#4a2e18' : '#b0743a'} opacity={0.85} />;
      })}
      {/* the steam lifting off */}
      {[0, 1, 2].map((i) => {
        const age = ((t * 0.5 + i / 3) % 1);
        return <path key={i} d={`M${-4 + i * 4} ${-4 - age * 14} q-2 -3 0 -6 q2 -3 0 -6`} stroke="#ffffff" strokeWidth={0.9} fill="none"
          strokeLinecap="round" opacity={Math.sin(age * Math.PI) * 0.7} />;
      })}
      {stack > 0 && <g transform="translate(28 2)">
        {/* the finished stack in its folded cloth with a stitched border */}
        <Pass ow={ow} list={[pc(ell(0, 0, 11, 4.2), `url(#${id}-c)`, cloth)]} />
        {Array.from({length: Math.min(8, stack)}, (_, i) => <path key={i} d={ell((rnd(seed, 120 + i) - 0.5) * 0.8, -1 - i * 0.9, 8.2, 2.8)} fill={torti}
          stroke={line(torti)} strokeWidth={ow * 0.35} />)}
        <path d={`M-11 0 Q-6 ${-6 - stack * 0.9} 2 ${-3 - stack * 0.9} L5 ${-1 - stack * 0.6} Q-3 ${-2 - stack * 0.5} -7 1.6 Z`} fill={`url(#${id}-c)`}
          stroke={line(cloth)} strokeWidth={ow * 0.6} strokeLinejoin="round" />
        <path d={`M-9.4 -0.4 Q-5 ${-5 - stack * 0.8} 1.6 ${-2.6 - stack * 0.9}`} stroke="#e0323c" strokeWidth={0.6} strokeDasharray="1 0.8" fill="none" />
        <path d="M-8 2.4 Q0 5 9 1.6" stroke="#2f7fe0" strokeWidth={0.6} strokeDasharray="1 0.8" fill="none" />
        <circle cx={-3} cy={-2 - stack * 0.6} r={0.9} fill="#ff4fae" /><circle cx={-1.6} cy={-1.4 - stack * 0.6} r={0.6} fill="#38a84f" />
      </g>}
    </g>
  );
};

// ============================================================================ the photograph wall

type Fr = {x: number; y: number; w: number; h: number; kind: 'oval' | 'old' | 'school' | 'color' | 'diploma' | 'wedding'; frame: string};
const WALL: Fr[] = [
  {x: 0, y: -150, w: 44, h: 56, kind: 'wedding', frame: '#c9a24a'},
  {x: -52, y: -150, w: 34, h: 44, kind: 'oval', frame: '#7a4a2a'},
  {x: 52, y: -150, w: 34, h: 44, kind: 'oval', frame: '#c9a24a'},
  {x: -22, y: -102, w: 26, h: 32, kind: 'old', frame: '#3a2e40'},
  {x: 22, y: -102, w: 30, h: 24, kind: 'color', frame: '#c9ced9'},
  {x: -24, y: -196, w: 30, h: 24, kind: 'diploma', frame: '#3a2e40'},
  {x: 22, y: -196, w: 24, h: 30, kind: 'old', frame: '#7a4a2a'},
  {x: -96, y: -176, w: 22, h: 28, kind: 'school', frame: '#c9a24a'},
  {x: -96, y: -138, w: 22, h: 28, kind: 'school', frame: '#3a2e40'},
  {x: -96, y: -100, w: 22, h: 28, kind: 'school', frame: '#c9ced9'},
  {x: 96, y: -176, w: 22, h: 28, kind: 'school', frame: '#7a4a2a'},
  {x: 96, y: -138, w: 22, h: 28, kind: 'school', frame: '#c9a24a'},
  {x: 96, y: -100, w: 22, h: 28, kind: 'school', frame: '#3a2e40'},
  {x: -64, y: -104, w: 24, h: 20, kind: 'color', frame: '#c9a24a'},
  {x: 62, y: -104, w: 24, h: 30, kind: 'school', frame: '#c9ced9'},
  {x: -62, y: -198, w: 26, h: 20, kind: 'color', frame: '#7a4a2a'},
  {x: 62, y: -200, w: 22, h: 22, kind: 'old', frame: '#c9ced9'},
  {x: -130, y: -158, w: 20, h: 26, kind: 'school', frame: '#7a4a2a'},
  {x: -130, y: -122, w: 20, h: 26, kind: 'school', frame: '#c9a24a'},
  {x: 130, y: -158, w: 20, h: 26, kind: 'school', frame: '#3a2e40'},
  {x: 130, y: -122, w: 20, h: 26, kind: 'school', frame: '#c9a24a'},
  {x: -130, y: -192, w: 22, h: 18, kind: 'color', frame: '#3a2e40'},
  {x: 130, y: -192, w: 20, h: 20, kind: 'old', frame: '#7a4a2a'},
  {x: 0, y: -206, w: 22, h: 16, kind: 'color', frame: '#c9a24a'},
  {x: -160, y: -140, w: 18, h: 24, kind: 'school', frame: '#c9ced9'},
  {x: 160, y: -140, w: 18, h: 24, kind: 'school', frame: '#7a4a2a'},
];

/**
 * THE PHOTOGRAPH WALL in a grandmother's front room. Frames in mismatched sizes and finishes hung
 * tight across the wall, the oldest and most formal portraits (a wedding, two ovals) largest at the
 * centre, sepia studio pictures and a diploma around them, and school photographs on their blue
 * backdrops ringing outward. The people inside are plain lit busts, never faces at this scale. Beside
 * it the home altar on a doily, a framed image, veladoras that flicker, and the wall crucifix with a
 * palm frond tucked behind it from last Palm Sunday. A cold white spill comes through the kitchen door
 * against the warm room. `frames` is how many hang, `w` the wall's width in centimetres.
 */
export const PhotoWallV2: React.FC<Place & {w?: number; frames?: number; altar?: boolean; kitchenSpill?: boolean}> = (p) => {
  const {frame = 0, seed = 134, w = 355, frames = 26, altar = true, kitchenSpill = true} = p;
  const id = useUid(), ow = owOf(p);
  const wall = '#f6dcc0', hw = w / 2, H = 220;
  const list = WALL.slice(0, Math.max(1, Math.min(WALL.length, frames)));
  const bust = (x: number, y: number, s: number, i: number, bw = false) => {
    const sk = bw ? '#e0cdb0' : SKIN_TONES[[1, 2, 3, 4, 2][(i + seed) % 5]];
    const sh = bw ? '#6a5a50' : CARRY[(i * 3) % CARRY.length];
    return <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-9 8 Q-9 0 0 0 Q9 0 9 8 Z" fill={sh} />
      <circle cx={0} cy={-4} r={4.6} fill={sk} />
      <path d="M-4.6 -5 Q-4 -10 0 -10 Q4.6 -10 4.6 -5 Q2 -8 -4.6 -5 Z" fill={bw ? '#4a3a30' : '#2b1a12'} />
    </g>;
  };
  const spill = 0.22 + Math.sin(frame * 1.7) * 0.015 + (frame % 97 < 2 ? -0.06 : 0);
  return (
    <g transform={at(p)}>
      <defs>
        <Lit id={`${id}-w`} c={wall} x2={1} y2={0.5} k={0.6} />
        <linearGradient id={`${id}-k`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#b8e8f0" stopOpacity={spill * 3} />
          <stop offset="100%" stopColor="#b8e8f0" stopOpacity={0} /></linearGradient>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7ab0ec" /><stop offset="100%" stopColor="#3a6ac0" />
        </linearGradient>
        <linearGradient id={`${id}-o`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ead8b4" /><stop offset="100%" stopColor="#b89870" />
        </linearGradient>
      </defs>
      <ContactShadow x={0} y={2} w={w * 1.04} opacity={0.24} />
      <Pass ow={ow} list={[pc(rr(-hw, -H, w, H, 10), `url(#${id}-w)`, wall), pc(rr(-hw, -14, w, 14, 5), '#9a6a48', '#9a6a48')]} />
      {list.map((f, i) => {
        const x = (f.x * 0.8 - 26) * (w / 355), rot = (rnd(seed, i) - 0.5) * 3, fw = f.w, fh = f.h, inset = Math.max(2.2, fw * 0.11);
        const bg = f.kind === 'school' ? `url(#${id}-b)` : f.kind === 'old' || f.kind === 'oval' || f.kind === 'wedding' ? `url(#${id}-o)`
          : f.kind === 'diploma' ? '#fffaf0' : '#c8e0a8';
        const oval = f.kind === 'oval' || f.kind === 'wedding';
        const shape = oval ? ell(0, 0, fw / 2, fh / 2) : rr(-fw / 2, -fh / 2, fw, fh, 2.4);
        const inner = oval ? ell(0, 0, fw / 2 - inset, fh / 2 - inset) : rr(-fw / 2 + inset, -fh / 2 + inset, fw - inset * 2, fh - inset * 2, 1.4);
        const bw = f.kind === 'old' || f.kind === 'oval' || f.kind === 'wedding';
        return <g key={i} transform={`translate(${x.toFixed(1)} ${f.y}) rotate(${rot.toFixed(2)})`}>
          <path d={shape} transform="translate(1.6 2.2)" fill="#5a3a40" opacity={0.18} />
          <path d={shape} fill={f.frame} stroke={line(f.frame)} strokeWidth={ow * 0.55} />
          <path d={shape} fill="none" stroke={light(f.frame, 0.5)} strokeWidth={1} opacity={0.6} transform="translate(-0.5 -0.5)" />
          <path d={inner} fill={bg} />
          {f.kind === 'diploma' ? <g><path d={`M${-fw * 0.3} -4 H${fw * 0.3} M${-fw * 0.24} 1 H${fw * 0.24}`} stroke="#3a3466" strokeWidth={1}
            strokeLinecap="round" /><circle cx={fw * 0.22} cy={fh * 0.22} r={2.4} fill="#e0323c" /></g>
            : f.kind === 'wedding' ? <g>{bust(-6, fh * 0.16, fw / 26, i, true)}{bust(7, fh * 0.14, fw / 24, i + 1, true)}
              <path d={`M7 ${fh * 0.14 - 14} Q14 ${fh * 0.14 - 4} 12 ${fh * 0.3}`} stroke="#fffaf0" strokeWidth={3} fill="none" opacity={0.85} /></g>
              : f.kind === 'color' ? <g>{bust(-fw * 0.2, fh * 0.2, fw / 40, i)}{bust(fw * 0.18, fh * 0.22, fw / 46, i + 2)}</g>
                : bust(0, fh * 0.2, (fw - inset * 2) / 22, i, bw)}
          {f.kind === 'school' && i % 3 === 0 && <path d={`M${-fw * 0.2} ${-fh * 0.06} L0 ${-fh * 0.16} L${fw * 0.2} ${-fh * 0.06} L0 ${0} Z`} fill="#2c2838" />}
        </g>;
      })}
      {altar && <g transform={`translate(${hw - 40} -60) scale(1.3)`}>
        {/* the crucifix with the palm frond behind it, then the shelf, the doily, the image and the veladoras */}
        <g transform="translate(0 -84)">
          <path d="M-2 4 C-12 -6 -14 -20 -6 -34" stroke={line('#6ab04a')} strokeWidth={3.4 + ow} fill="none" strokeLinecap="round" />
          <path d="M-2 4 C-12 -6 -14 -20 -6 -34" stroke="#6ab04a" strokeWidth={3.4} fill="none" strokeLinecap="round" />
          <Pass ow={ow * 0.6} list={[pc(rr(-1.6, -18, 3.2, 24, 1.2), '#7a4a2a', '#7a4a2a'), pc(rr(-7, -12, 14, 3, 1.2), '#7a4a2a', '#7a4a2a')]} />
        </g>
        <Pass ow={ow} list={[pc(rr(-34, 0, 68, 5, 2.5), '#8a5a3a', '#8a5a3a')]} />
        <path d="M-30 0 Q-26 4 -22 0 Q-18 4 -14 0 Q-10 4 -6 0 Q-2 4 2 0 Q6 4 10 0 Q14 4 18 0 Q22 4 26 0 Q30 4 30 0 Z" fill="#fffaf0" />
        <path d={rr(-9, -30, 18, 30, 2)} fill="#c9a24a" stroke={line('#c9a24a')} strokeWidth={ow * 0.5} />
        <path d={rr(-6.4, -27, 12.8, 25, 1.6)} fill="#2f5fb0" />
        <path d="M0 -22 C-2.6 -22 -3 -19 -3 -17 C-4.6 -14 -5 -8 -5.4 -4 Q0 -3 5.4 -4 C5 -8 4.6 -14 3 -17 C3 -19 2.6 -22 0 -22 Z" fill="#3fa38f" />
        {[-22, -15, 15, 22].map((x, i) => {
          const c = ['#e0323c', '#f6f0e0', '#38a84f', '#f2c935'][i];
          return <g key={x} transform={`translate(${x} 0)`}>
            <circle cx={0} cy={-14} r={7} fill="#ffcc66" opacity={0.2} />
            <path d={rr(-2.6, -13, 5.2, 13, 1.2)} fill={c} stroke={line(c)} strokeWidth={ow * 0.4} />
            <Flame x={0} y={-12.4} s={2} frame={frame} seed={seed + i} />
          </g>;
        })}
      </g>}
      {kitchenSpill && <g>
        {/* the cold white spill from the fluorescent kitchen, against the warm room */}
        <path d={`M${-hw} ${-H} L${-hw + 34} ${-H} L${-hw + 120} 0 L${-hw} 0 Z`} fill={`url(#${id}-k)`} />
        <path d={rr(-hw, -H, 10, H, 3)} fill="#8a5a3a" />
      </g>}
      <Sheen d={`M${-hw + 16} ${-H + 8} H${hw - 16}`} w={2.4} o={0.4} />
    </g>
  );
};

export const TEJANO_V2 = ['PaleteroCartV2', 'PanaderiaRackV2', 'RaspaStandV2', 'RaspaCupV2', 'ConjuntoPairV2', 'LowriderV2', 'YardShrineV2',
  'TienditaV2', 'ColoniaBlockV2', 'PedestrianBridgeV2', 'EscaramuzaRiderV2', 'StarPinataV2', 'ComalV2', 'PhotoWallV2'] as const;
