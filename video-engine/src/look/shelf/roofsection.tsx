import React from 'react';
import {light, line, shade} from '../color';
import {ContactShadow, Glow, useUid} from '../Kit';

/**
 * THE ROOF SECTION, LOOK V2 (November 14th, 2026).
 *
 * The roof edge attachment drawings from lib/roofsection.tsx redrawn on the v2 rules. These are section
 * diagrams first. Every part keeps the library's position and proportion so the drawing still explains
 * how a drip edge flashing is fastened at the eave, and only the light and the line change. Each part is
 * lit from the upper left with shade pushed toward violet, outlined in its own deep hue as one pass under
 * the fills, rounded at every corner, and something moves (the screw threads turn, a glint crosses the
 * metal, a finger flexes).
 *
 * PLACEMENT. The library drew these in screen units with no placement props, positioned by the plane
 * that holds them. The v2 drawings keep those units and add `x`, `y` and `scale` (defaults 0, 0 and 1,
 * which is the library's own placement) and `frame`.
 */
export interface RoofV2 {x?: number; y?: number; scale?: number; frame?: number; seed?: number}
type Pt = [number, number];

const at = (p: RoofV2) => `translate(${p.x ?? 0} ${p.y ?? 0}) scale(${p.scale ?? 1})`;
/** half the outline stroke in local units, so the line is about 6.8 film pixels at any scale */
const owOf = (p: RoofV2) => 3.4 / (p.scale ?? 1);
const TAU = Math.PI * 2;
const f1 = (n: number) => n.toFixed(1);
const fp = (q: Pt) => `${f1(q[0])} ${f1(q[1])}`;

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

const grad = (id: string, c: string, dir: 'd' | 'v' | 'h' = 'd', k = 0.45, s = 0.36) => (
  <linearGradient id={id} x1="0" y1="0" x2={dir === 'v' ? 0 : dir === 'h' ? 1 : 0.4} y2={dir === 'h' ? 0 : 1}>
    <stop offset="0%" stopColor={light(c, k)} /><stop offset="48%" stopColor={c} /><stop offset="100%" stopColor={shade(c, s)} />
  </linearGradient>
);
const cyl = (id: string, c: string) => (
  <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stopColor={shade(c, 0.1)} /><stop offset="26%" stopColor={light(c, 0.55)} />
    <stop offset="60%" stopColor={c} /><stop offset="100%" stopColor={shade(c, 0.42)} />
  </linearGradient>
);
type Part = {d: string; c: string; fill?: string; t?: string; o?: number};
/** THE SEAMLESS JOIN. Every outline first, then every fill. */
const Pass: React.FC<{parts: Part[]; ow: number}> = ({parts, ow}) => <>
  {parts.map((q, i) => <path key={`o${i}`} d={q.d} transform={q.t} fill={line(q.c)} stroke={line(q.c)} strokeWidth={ow * 2 * (q.o ?? 1)}
    strokeLinejoin="round" />)}
  {parts.map((q, i) => <path key={`f${i}`} d={q.d} transform={q.t} fill={q.fill ?? q.c} />)}
</>;
const Sheen: React.FC<{d: string; w: number; op?: number}> = ({d, w, op = 0.45}) =>
  <path d={d} fill="none" stroke="#fffaf0" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={op} />;
/** a glint that sweeps across a lit face every few seconds */
const Glint: React.FC<{d: string; b: [number, number, number, number]; frame: number; seed?: number; op?: number}> = ({d, b, frame, seed = 1, op = 0.5}) => {
  const id = useUid();
  const [x, y, w, h] = b;
  const k = ((frame / 30 + seed * 1.3) % 5) / 1.3;
  if (k >= 1) return null;
  const gx = x - h - w * 0.2 + k * (w * 1.4 + h);
  return <g><defs><clipPath id={id}><path d={d} /></clipPath></defs>
    <path clipPath={`url(#${id})`} d={`M${gx} ${y + h} L${gx + w * 0.14} ${y + h} L${gx + w * 0.14 + h} ${y} L${gx + h} ${y} Z`} fill="#ffffff" opacity={op} /></g>;
};

const WOOD = '#c08a5e', DECK = '#3f7268', METAL = '#d9e3df', STEEL = '#9ab0aa', ORANGE = '#e88a3a', SKIN = '#c98a5a', SLEEVE = '#3f7aa2';

/** the drip edge profile, the library's outline with its corners rounded */
const FLASH: Pt[] = [[-180, -143], [185, -143], [185, -116], [194, -109], [190, -101], [175, -108], [175, -131], [-180, -131]];

/** the screw, its threads turning, from a head at `top` down to a point at `tip` */
const Screw: React.FC<{top: number; tip: number; r: number; frame: number; ow: number; spin?: number}> = ({top, tip, r, frame, ow, spin = 1}) => {
  const id = useUid();
  const shaft = rp([[-r, top], [r, top], [r, tip - r * 2], [0, tip], [-r, tip - r * 2]], [2, 2, r * 0.6, 1, r * 0.6]);
  const off = (frame * 2.4 * spin) % 12;
  return <g>
    <defs>{cyl(`${id}s`, STEEL)}<clipPath id={`${id}c`}><path d={shaft} /></clipPath></defs>
    <Pass ow={ow * 0.8} parts={[{d: shaft, c: STEEL, fill: `url(#${id}s)`}]} />
    <g clipPath={`url(#${id}c)`}>{Array.from({length: Math.ceil((tip - top) / 12) + 2}, (_, i) => {
      const yy = top + i * 12 - off;
      return <path key={i} d={`M${-r - 2} ${yy + 4} L${r + 2} ${yy - 4}`} stroke={shade(STEEL, 0.4)} strokeWidth={2.4} strokeLinecap="round" />;
    })}</g>
  </g>;
};

/** THE ROOF EDGE, in section. The fascia, the roof deck over it, the drip edge flashing lapped over the
 *  deck and kicked out at the drip, and a screw going through the flashing on a cordless driver. */
export const RoofEdgeIllustrationV2: React.FC<RoofV2> = (p) => {
  const {frame = 0, seed = 1} = p;
  const id = useUid(), ow = owOf(p), t = frame / 30;
  const flash = rp(FLASH, [4, 6, 3, 3, 3, 3, 3, 4]);
  const deck = rp([[-180, -200], [150, -200], [180, -135], [-180, -135]], [10, 10, 8, 4]);
  const push = Math.sin(t * TAU * 0.8) * 2;
  return (
    <g transform={at(p)}>
      <defs>{grad(`${id}w`, WOOD, 'd', 0.35, 0.3)}{grad(`${id}d`, DECK, 'd', 0.4, 0.35)}{grad(`${id}m`, METAL, 'v', 0.6, 0.22)}
        {grad(`${id}o`, ORANGE, 'h', 0.45, 0.3)}{cyl(`${id}b`, STEEL)}</defs>
      <ContactShadow x={0} y={4} w={420} opacity={0.26} />
      <Pass ow={ow} parts={[{d: rr(-180, -124, 360, 124, 12), c: WOOD, fill: `url(#${id}w)`}, {d: deck, c: DECK, fill: `url(#${id}d)`}]} />
      {Array.from({length: 4}, (_, r) => <path key={r} d={`M-170 ${-98 + r * 24} H170`} stroke={light(WOOD, 0.35)} strokeWidth={3} strokeLinecap="round" opacity={0.7} />)}
      {[[-120, -60], [40, -84], [110, -38]].map(([x, y], i) => <path key={i} d={`M${x - 26} ${y} q26 -8 52 0`} fill="none" stroke={shade(WOOD, 0.25)} strokeWidth={2}
        strokeLinecap="round" opacity={0.6} />)}
      <Sheen d="M-165 -188 L110 -188" w={4} op={0.25} />
      {/* the flashing, lit like the thin bright metal it is */}
      <Pass ow={ow * 0.8} parts={[{d: flash, c: METAL, fill: `url(#${id}m)`}]} />
      <Sheen d="M-172 -139 L178 -139" w={2.4} op={0.7} />
      <Glint d={flash} b={[-180, -143, 375, 42]} frame={frame} seed={seed} />
      {/* the screw through the flashing, its washer seated, and the driver on it */}
      <Screw top={-250} tip={-112} r={8} frame={frame} ow={ow} />
      <g transform={`translate(0 ${push})`}>
        <Pass ow={ow * 0.8} parts={[{d: rr(-28, -252, 56, 14, 7), c: '#dfe6dc'}, {d: rr(-6, -304, 12, 56, 4), c: STEEL, fill: `url(#${id}b)`}]} />
        {[0, 1, 2].map((i) => <path key={i} d={`M-6 ${-296 + i * 16 + ((frame * 3) % 16)} L6 ${-300 + i * 16 + ((frame * 3) % 16)}`} stroke={shade(STEEL, 0.35)}
          strokeWidth={2} strokeLinecap="round" />)}
        <Pass ow={ow} parts={[{d: rr(-23, -392, 46, 92, 14), c: ORANGE, fill: `url(#${id}o)`}, {d: rr(-16, -310, 32, 14, 6), c: '#4a4560'}]} />
        {[0, 1, 2, 3].map((i) => <path key={i} d={`M-14 ${-376 + i * 14} L14 ${-376 + i * 14}`} stroke={shade(ORANGE, 0.3)} strokeWidth={3} strokeLinecap="round" />)}
        <Sheen d="M-14 -384 L-14 -318" w={4} op={0.45} />
      </g>
      {/* the bit's turn, drawn as two arcs */}
      {[0, 1].map((i) => {
        const a = t * TAU * 1.2 + i * Math.PI;
        return <path key={i} d={`M${Math.cos(a) * 22} ${-268 + Math.sin(a) * 6} A22 6 0 0 1 ${Math.cos(a + 1.2) * 22} ${-268 + Math.sin(a + 1.2) * 6}`} fill="none"
          stroke="#ffd25a" strokeWidth={3} strokeLinecap="round" opacity={0.8} />;
      })}
    </g>
  );
};

/** THE ROOF BACKDROP, the deep teal plane the section sits on, lit from the upper left, with a faint
 *  drafting grid drifting slowly behind. */
export const RoofBackdropV2: React.FC<RoofV2> = (p) => {
  const {frame = 0} = p;
  const id = useUid();
  const off = (frame * 0.4) % 80;
  return (
    <g transform={at(p)}>
      <defs><linearGradient id={`${id}g`} x1="0" y1="0" x2="0.4" y2="1"><stop offset="0%" stopColor="#2a5e6e" /><stop offset="55%" stopColor="#1a3a4a" />
        <stop offset="100%" stopColor="#1a2246" /></linearGradient><clipPath id={`${id}c`}><path d={rr(-500, -500, 1000, 1000, 28)} /></clipPath></defs>
      <path d={rr(-500, -500, 1000, 1000, 28)} fill={`url(#${id}g)`} />
      <g clipPath={`url(#${id}c)`} opacity={0.16}>
        {Array.from({length: 14}, (_, i) => <path key={`v${i}`} d={`M${-520 + i * 80 + off} -500 V500`} stroke="#bfe6ee" strokeWidth={2} />)}
        {Array.from({length: 14}, (_, i) => <path key={`h${i}`} d={`M-500 ${-520 + i * 80 + off} H500`} stroke="#bfe6ee" strokeWidth={2} />)}
      </g>
      <Glow x={-240} y={-260} r={520} color="#7ad6e6" opacity={0.28} />
    </g>
  );
};

/** THE ROOF SUBSTRATE in section. The deck boards with their joints, and the roof underlayment over
 *  the top as one dark band. */
export const RoofSubstrateV2: React.FC<RoofV2> = (p) => {
  const {frame = 0} = p;
  const id = useUid(), ow = owOf(p);
  const board = rr(-220, -50, 440, 110, 14);
  return (
    <g transform={at(p)}>
      <defs>{grad(`${id}w`, '#b8895e', 'd', 0.38, 0.3)}{grad(`${id}m`, '#4f7e72', 'v', 0.4, 0.3)}</defs>
      <ContactShadow x={0} y={64} w={480} opacity={0.24} />
      <Pass ow={ow} parts={[{d: board, c: '#b8895e', fill: `url(#${id}w)`}, {d: rr(-224, -58, 448, 16, 8), c: '#4f7e72', fill: `url(#${id}m)`}]} />
      {[-130, -45, 45, 130].map((x) => <path key={x} d={`M${x} -36 V50`} stroke={shade('#b8895e', 0.32)} strokeWidth={4} strokeLinecap="round" />)}
      {[-175, -88, 0, 88, 175].map((x, i) => <path key={x} d={`M${x - 26} ${-10 + (i % 2) * 24} q26 -10 52 0 M${x - 18} ${16 + (i % 2) * 12} q18 -6 36 0`} fill="none"
        stroke={light('#b8895e', 0.3)} strokeWidth={2.4} strokeLinecap="round" opacity={0.7} />)}
      <Sheen d="M-214 -54 L120 -54" w={3} op={0.4} />
      <Glint d={board} b={[-220, -50, 440, 110]} frame={frame} op={0.22} />
    </g>
  );
};

/** THE HAND ON THE DRIVER, from the right. The sleeve and cuff, a palm, four fingers wrapped round the
 *  orange grip and a thumb over the top, the driver's bit on the screw below. The grip squeezes a little
 *  as it drives. */
export const RoofDriverV2: React.FC<RoofV2> = (p) => {
  const {frame = 0} = p;
  const id = useUid(), ow = owOf(p), t = frame / 30;
  const sq = Math.sin(t * TAU * 0.8) * 1.5;
  const fingers = [0, 1, 2, 3].map((i) => {
    const y = -206 + i * 15;
    return `M${70} ${y} Q${-4} ${y - 6 + sq} ${-30} ${y + 8} Q${-34} ${y + 18} ${-20} ${y + 20} Q${6} ${y + 10} ${70} ${y + 14} Z`;
  });
  return (
    <g transform={at(p)}>
      <defs>{grad(`${id}o`, ORANGE, 'h', 0.45, 0.3)}{grad(`${id}s`, SKIN, 'd', 0.35, 0.28)}{grad(`${id}c`, SLEEVE, 'v', 0.4, 0.3)}{cyl(`${id}b`, STEEL)}</defs>
      <Screw top={-112} tip={22} r={5} frame={frame} ow={ow} />
      <Pass ow={ow} parts={[{d: rr(-24, -240, 48, 132, 16), c: ORANGE, fill: `url(#${id}o)`}, {d: rr(-16, -118, 32, 14, 6), c: '#4a4560'}]} />
      <Sheen d="M-14 -230 L-14 -124" w={4} op={0.4} />
      {/* sleeve and palm first, outlined together, then the fingers over the grip */}
      <Pass ow={ow} parts={[
        {d: rr(94, -214, 134, 62, 26), c: SLEEVE, fill: `url(#${id}c)`},
        {d: rp([[30, -212], [118, -214], [124, -150], [30, -150]], [24, 20, 20, 26]), c: SKIN, fill: `url(#${id}s)`},
      ]} />
      <path d={rr(94, -214, 22, 62, 10)} fill={shade(SLEEVE, 0.2)} />
      <Sheen d="M120 -206 L210 -206" w={4} op={0.35} />
      <Pass ow={ow} parts={fingers.map((d) => ({d, c: SKIN, fill: `url(#${id}s)`}))} />
      {fingers.map((_, i) => <path key={i} d={`M${-20} ${-188 + i * 15} q6 -3 10 -6`} stroke={light(SKIN, 0.45)} strokeWidth={2.4} strokeLinecap="round" opacity={0.7} />)}
      {/* the thumb along the top of the grip */}
      <Pass ow={ow} parts={[{d: `M64 -214 Q20 -232 -14 -228 Q-26 -226 -22 -216 Q-6 -210 60 -200 Z`, c: SKIN, fill: `url(#${id}s)`}]} />
      <path d="M-14 -224 q-6 3 -4 8" stroke="#f4dcc8" strokeWidth={3} strokeLinecap="round" fill="none" />
    </g>
  );
};

/** THE EVIDENCE LOUPE. A magnifier held over the drip edge, the profile large in the lens so the kick
 *  at the drip reads, the rim lit, the handle wrapped, and a glint crossing the glass. */
export const EvidenceLoupeV2: React.FC<RoofV2> = (p) => {
  const {frame = 0, seed = 1} = p;
  const id = useUid(), ow = owOf(p), t = frame / 30;
  const bob = Math.sin(t * TAU * 0.3) * 3, rim = '#2f5a56';
  const prof = rp([[-90, -80], [70, -80], [70, -10], [85, 8], [67, 24], [45, 0], [45, -58], [-90, -58]], [6, 8, 4, 4, 4, 4, 4, 6]);
  return (
    <g transform={`${at(p)} translate(0 ${bob}) rotate(${Math.sin(t * TAU * 0.2) * 1.5} 0 -100)`}>
      <defs>
        <radialGradient id={`${id}g`} cx="36%" cy="30%" r="80%"><stop offset="0%" stopColor="#ffffff" /><stop offset="60%" stopColor="#e2ecdc" />
          <stop offset="100%" stopColor="#b8cec4" /></radialGradient>
        {grad(`${id}m`, '#c4d2bc', 'v', 0.55, 0.25)}{grad(`${id}r`, rim, 'd', 0.5, 0.3)}{grad(`${id}h`, '#3a3a5a', 'd', 0.4, 0.3)}
      </defs>
      <ContactShadow x={30} y={150} w={300} opacity={0.2} />
      <path d="M83 -17 L200 100" stroke={line('#3a3a5a')} strokeWidth={34 + ow * 2} strokeLinecap="round" />
      <path d="M83 -17 L200 100" stroke="#4a4870" strokeWidth={34} strokeLinecap="round" />
      {[0, 1, 2, 3].map((i) => <path key={i} d={`M${120 + i * 18} ${20 + i * 18} l14 -14`} stroke="#2e2c4a" strokeWidth={4} strokeLinecap="round" />)}
      <path d="M100 -12 L190 78" stroke="#8a88b0" strokeWidth={6} strokeLinecap="round" opacity={0.6} />
      <circle cx={0} cy={-100} r={124 + ow} fill={line(rim)} />
      <circle cx={0} cy={-100} r={124} fill={`url(#${id}r)`} />
      <circle cx={0} cy={-100} r={106} fill={line(rim)} />
      <circle cx={0} cy={-100} r={104} fill={`url(#${id}g)`} />
      <Pass ow={ow} parts={[{d: prof, c: '#c4d2bc', fill: `url(#${id}m)`}]} />
      <Sheen d="M-84 -76 L64 -76" w={3} op={0.7} />
      <path d={`M-80 -150 A90 90 0 0 1 -20 -186`} fill="none" stroke="#ffffff" strokeWidth={10} strokeLinecap="round" opacity={0.7} />
      <Glint d={ell(0, -100, 104, 104)} b={[-104, -204, 208, 208]} frame={frame} seed={seed} op={0.45} />
      <path d="M-104 -150 A124 124 0 0 1 -40 -218" fill="none" stroke={light(rim, 0.6)} strokeWidth={5} strokeLinecap="round" opacity={0.7} />
    </g>
  );
};

/** THE REVIEW WALL, the sage plane behind the desk, with window light falling across it. */
export const ReviewWallV2: React.FC<RoofV2> = (p) => {
  const {frame = 0} = p;
  const id = useUid();
  const drift = Math.sin(frame / 30 * TAU / 12) * 12;
  return (
    <g transform={at(p)}>
      <defs><linearGradient id={`${id}g`} x1="0" y1="0" x2="0.4" y2="1"><stop offset="0%" stopColor="#b2d2c6" /><stop offset="55%" stopColor="#8cb2a8" />
        <stop offset="100%" stopColor="#6a8a92" /></linearGradient><clipPath id={`${id}c`}><path d={rr(-500, -500, 1000, 1000, 28)} /></clipPath></defs>
      <path d={rr(-500, -500, 1000, 1000, 28)} fill={`url(#${id}g)`} />
      <defs><linearGradient id={`${id}l`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fff6dc" stopOpacity={0.3} />
        <stop offset="100%" stopColor="#fff6dc" stopOpacity={0} /></linearGradient></defs>
      {/* window light falling across the wall, four panes fading toward the floor */}
      <g clipPath={`url(#${id}c)`}>
        {[0, 1].map((r) => [0, 1].map((c) => <path key={`${r}${c}`} d={rp([[-380 + c * 130 + r * 70 + drift, -440 + r * 230], [-270 + c * 130 + r * 70 + drift, -440 + r * 230],
          [-200 + c * 130 + r * 70 + drift, -230 + r * 230], [-310 + c * 130 + r * 70 + drift, -230 + r * 230]], 24)} fill={`url(#${id}l)`} />))}
      </g>
      <Glow x={-260} y={-280} r={480} color="#fff2cc" opacity={0.25} />
    </g>
  );
};

/** THE REVIEW DESK, its top in perspective, wood grain running back, and the front edge as a lit band. */
export const ReviewDeskV2: React.FC<RoofV2> = (p) => {
  const {frame = 0} = p;
  const id = useUid(), ow = owOf(p), top = '#6a8a80', edge = '#3a5a64';
  const topD = rp([[-450, -160], [450, -160], [520, 220], [-520, 220]], 24);
  return (
    <g transform={at(p)}>
      <defs>{grad(`${id}t`, top, 'v', 0.35, 0.3)}{grad(`${id}e`, edge, 'v', 0.35, 0.3)}<clipPath id={`${id}c`}><path d={topD} /></clipPath></defs>
      <ContactShadow x={0} y={262} w={1100} opacity={0.24} />
      <Pass ow={ow} parts={[{d: topD, c: top, fill: `url(#${id}t)`}, {d: rr(-524, 214, 1048, 44, 20), c: edge, fill: `url(#${id}e)`}]} />
      <g clipPath={`url(#${id}c)`}>
        {Array.from({length: 7}, (_, i) => {
          const u = (i + 0.5) / 7 - 0.5;
          return <path key={i} d={`M${u * 900} -160 Q${u * 960 + 20} 30 ${u * 1040} 220`} fill="none" stroke={shade(top, 0.15)} strokeWidth={3} opacity={0.6} />;
        })}
      </g>
      <Sheen d="M-430 -150 L300 -150" w={6} op={0.35} />
      <Sheen d="M-500 222 L200 222" w={5} op={0.35} />
      <Glint d={topD} b={[-520, -160, 1040, 380]} frame={frame} op={0.14} />
    </g>
  );
};

/** THE REVIEWER'S HAND, open and raised, palm out. Four fingers that join the palm with no seam, a
 *  thumb at the side, the wrist into a cuff, the fingers flexing a little. */
export const ReviewHandV2: React.FC<RoofV2> = (p) => {
  const {frame = 0} = p;
  const id = useUid(), ow = owOf(p), t = frame / 30;
  const fx = [-35, -12, 12, 35], len = [62, 74, 72, 58];
  const fingers = fx.map((x, i) => {
    const bend = Math.sin(t * TAU * 0.5 + i * 0.7) * 3;
    const tip: Pt = [x * 1.12 + bend, -10 - len[i]];
    return `M${x - 9} -6 Q${x - 9} ${-len[i] * 0.6} ${tip[0] - 9} ${tip[1] + 8} A9 9 0 0 1 ${tip[0] + 9} ${tip[1] + 8} Q${x + 9} ${-len[i] * 0.6} ${x + 9} -6 Z`;
  });
  return (
    <g transform={at(p)}>
      <defs>{grad(`${id}s`, SKIN, 'd', 0.38, 0.28)}{grad(`${id}c`, SLEEVE, 'v', 0.4, 0.3)}</defs>
      <Pass ow={ow} parts={[
        {d: rr(-50, 108, 100, 76, 24), c: SLEEVE, fill: `url(#${id}c)`},
        {d: rr(-38, 6, 76, 120, 30), c: SKIN, fill: `url(#${id}s)`},
        {d: ell(0, 2, 56, 44), c: SKIN, fill: `url(#${id}s)`},
        ...fingers.map((d) => ({d, c: SKIN, fill: `url(#${id}s)`})),
        {d: `M-46 10 Q-70 -6 -84 -30 Q-90 -44 -78 -46 Q-64 -44 -50 -22 Q-40 -8 -30 0 Z`, c: SKIN, fill: `url(#${id}s)`},
      ]} />
      <path d="M-50 120 L50 120" stroke={shade(SLEEVE, 0.3)} strokeWidth={4} strokeLinecap="round" />
      <Sheen d="M-40 116 L30 116" w={4} op={0.3} />
      {/* palm creases and the knuckle line */}
      <path d="M-30 14 Q0 30 32 6 M-22 30 Q4 22 20 40" fill="none" stroke={shade(SKIN, 0.28)} strokeWidth={2.6} strokeLinecap="round" opacity={0.6} />
      {fx.map((x, i) => <path key={i} d={`M${x * 1.1 - 4} ${-28 - len[i] * 0.45} q4 -2 8 0`} stroke={shade(SKIN, 0.25)} strokeWidth={2.2} strokeLinecap="round"
        fill="none" opacity={0.55} />)}
      <Sheen d="M-40 -20 Q-38 -60 -42 -64" w={4} op={0.4} />
    </g>
  );
};

/** THE FIXED ROOF FLASHING, the drip edge profile alone. Bright metal, rounded at every bend, a sheen
 *  along the top face and a glint crossing it. */
export const FixedRoofFlashingV2: React.FC<RoofV2> = (p) => {
  const {frame = 0, seed = 2} = p;
  const id = useUid(), ow = owOf(p), metal = '#dbe4d6';
  const d = rp([[-220, -80], [185, -80], [185, 25], [215, 57], [193, 77], [157, 38], [157, -48], [-220, -48]], [8, 12, 6, 8, 8, 6, 8, 8]);
  return (
    <g transform={at(p)}>
      <defs>{grad(`${id}m`, metal, 'v', 0.6, 0.26)}</defs>
      <ContactShadow x={0} y={84} w={460} opacity={0.22} />
      <Pass ow={ow} parts={[{d, c: metal, fill: `url(#${id}m)`}]} />
      <Sheen d="M-210 -72 L176 -72" w={4} op={0.75} />
      <path d="M-212 -54 L150 -54" stroke={shade(metal, 0.2)} strokeWidth={3} strokeLinecap="round" />
      <Glint d={d} b={[-220, -80, 435, 157]} frame={frame} seed={seed} />
    </g>
  );
};

/** THE ROOF FASCIA, the board along the eave in elevation, its seams, a nail head at each, and grain. */
export const RoofFasciaV2: React.FC<RoofV2> = (p) => {
  const {frame = 0} = p;
  const id = useUid(), ow = owOf(p), wood = '#c09a6c';
  const d = rr(-220, -20, 440, 130, 14);
  return (
    <g transform={at(p)}>
      <defs>{grad(`${id}w`, wood, 'd', 0.38, 0.3)}</defs>
      <ContactShadow x={0} y={114} w={480} opacity={0.22} />
      <Pass ow={ow} parts={[{d, c: wood, fill: `url(#${id}w)`}]} />
      {[-140, -70, 0, 70, 140].map((x) => <g key={x}>
        <path d={`M${x} -8 V98`} stroke={shade(wood, 0.32)} strokeWidth={4} strokeLinecap="round" />
        {[0, 70].map((y) => <circle key={y} cx={x + 10} cy={y + 6} r={4} fill="#8a88a6" stroke={line('#8a88a6')} strokeWidth={1.4} />)}
      </g>)}
      {[-176, -105, -35, 35, 105, 176].map((x, i) => <path key={x} d={`M${x - 20} ${30 + (i % 2) * 30} q20 -8 40 0`} fill="none" stroke={light(wood, 0.3)} strokeWidth={2.4}
        strokeLinecap="round" opacity={0.7} />)}
      <Sheen d="M-210 -12 L100 -12" w={4} op={0.4} />
      <Glint d={d} b={[-220, -20, 440, 130]} frame={frame} op={0.2} />
    </g>
  );
};

export const ROOFSECTION_V2 = ['RoofEdgeIllustrationV2', 'RoofBackdropV2', 'RoofSubstrateV2', 'RoofDriverV2', 'EvidenceLoupeV2', 'ReviewWallV2',
  'ReviewDeskV2', 'ReviewHandV2', 'FixedRoofFlashingV2', 'RoofFasciaV2'] as const;
