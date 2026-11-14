import React from 'react';
import {M} from '../../lib/scale';
import {FONT} from '../../lib/type';
import {light, line, mix, shade} from '../color';
import {Figure, SKIN_TONES, figureHands} from '../Figure';
import type {FigureEmotion, FigureHair, FigurePose} from '../Figure';
import {ContactShadow, Glow, useUid} from '../Kit';
import type {Place} from '../machines';
import {PickupV2, taper} from '../props';

/**
 * BLACK TEXAS, LOOK V2 (November 14th, 2026).
 *
 * The Black Texas set from lib/blacktexas.tsx, redrawn in the v2 idiom. The pit, the church fan and a
 * congregation of them, the sanctuary with its band, the trail ride column, the bucking chute, the
 * frottoir, the shotgun house on its brick street, the HBCU band, the Emancipation Park plan and the
 * red drink. Each one is round, lit from the upper left, outlined in its own deep hue, grounded and
 * alive on `frame`.
 *
 * Every correction in the library header holds here. Black Texas is coastal and rural and old before
 * it is urban, so the pit is a cut tank on a trailer and a trench in a churchyard, never a kettle grill,
 * and its smoke is thin and blue and lies low at dawn. The trail ride is current, a club claiming the
 * public road with its flatbed wagons and its speakers, and its riders are grandmothers and children as
 * well as young men. The fan carries a picture of a family on one side and the funeral home's notice on
 * the other, and the notice is the meaning. The band's strut, the choir's robes and the drum kit in the
 * sanctuary are drawn as the tradition is, with respect and specificity and never as caricature.
 *
 * People come only from the cast rig in look/Figure.tsx, and no drawing carries a brand, a logo or a
 * named person. The horses are the only animals and the only faces beyond the cast, because the pit,
 * the chute, the house and the instruments are objects and stay objects. Two things the rig cannot do
 * are dressed rather than redrawn. A choir stole, a band shako and an usher's white gloves are drawn
 * over a Figure at the rig's own head, chest and hand positions, and the band's high knee is a march
 * with a strut bounce, because the rig has no bent leg.
 *
 * PLACEMENT is the library's. x and y sit at the ground (the church fan at the hand that holds it, as
 * the library places it), `scale` 1 is true size through the one metre in lib/scale.ts, and every
 * drawing is built in centimetres. Measurements follow BLACKTX_M (pit 1.5 m at the lid, stack 2.6 m,
 * fan 0.36 m, chute 1.9 m, frottoir 0.55 m, shotgun house 5.2 m at the ridge, band member 1.7 m, red
 * drink 0.22 m, trail rider 2.4 m to the hat, trail wagon 2.8 m to the roof). Three of the library's
 * drawings mix a screen-unit spread with true-size bodies, so at scale 1 their people overlap into a
 * clump. Here `span` on the trail ride and `spread` on the band are in centimetres, and the shotgun
 * house is a real 12 feet wide. `FanFieldV2`, `SanctuaryV2` and `EmancipationParkV2` keep the
 * library's screen frame (`w`, `h` and `depth` in screen units times `scale`). The park draws its
 * pavilion at the plan's own scale, where the library fitted it to true size inside a screen-unit
 * plan and it covered the ring.
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
const arch = (x: number, y: number, w: number, h: number) =>
  `M${x} ${y} V${y - h + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y - h + w / 2} V${y} Z`;

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
/** a horizontal cylinder lit from above, a bright band high and the shade underneath */
const Cyl: React.FC<{id: string; c: string}> = ({id, c}) => (
  <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor={light(c, 0.2)} /><stop offset="22%" stopColor={light(c, 0.5)} /><stop offset="50%" stopColor={c} />
    <stop offset="100%" stopColor={shade(c, 0.4)} />
  </linearGradient>
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

/** the cast rig's height to the crown, in its own units */
const FIG = 504;
/** the rig's head bob, so a hat or a stole drawn over a Figure moves with it */
const figBob = (frame: number, seed: number) => Math.sin((frame / 30) * 2 * Math.PI / 3.6 + seed) * 3;
const SKINS = [SKIN_TONES[3], SKIN_TONES[4], SKIN_TONES[5], SKIN_TONES[2], SKIN_TONES[4], SKIN_TONES[3]];
const HAIRS: FigureHair[] = ['short', 'curly', 'bun', 'afro', 'buzz', 'long'];

export interface BlackTxPropsV2 extends Place {
  wear?: number;
  night?: boolean;
}

// ============================================================================ the pit

/**
 * THE PIT, a real one. `form` picks a cut steel tank on a trailer (the offset firebox LOW at one end, the
 * stack at the other, diagonal across the pit), a trench in the ground with a grate over it, or a cinder
 * block pit under a tin lid. The firebox door glows and flickers when `lit`, a gauge needle wobbles on
 * the lid, and the smoke is thin and blue, lying low across the grass at dawn (`hour` under 0.3) and
 * rising later. `lidOpen` swings the lid up on its hinges to show the grate and what is on it.
 */
export const BarbecuePitV2: React.FC<BlackTxPropsV2 & {h?: number; form?: 'tank' | 'trench' | 'block'; lit?: boolean; hour?: number;
  lidOpen?: boolean}> = (p) => {
  const {frame = 0, seed = 141, wear = 0.55, form = 'tank', lit = true, hour = 0.15, lidOpen = false} = p;
  const id = useUid(), ow = owOf(p), t = frame / 30;
  const steel = '#3d4560', frameC = '#2f2c46', tire = '#24213a', rim = '#c9cfdc', meat = '#6a2e20', fire = '#ff8a2a';
  const fl = 0.75 + Math.sin(frame * 0.7) * 0.15 + Math.sin(frame * 1.9 + 1) * 0.1;
  const low = hour < 0.3;
  const sx0 = form === 'tank' ? 119 : 0, sy0 = form === 'tank' ? (lidOpen ? -170 : -224) : form === 'block' ? -112 : -18;
  const smoke = lit ? Array.from({length: 13}, (_, i) => {
    const q = (t * 0.2 + rnd(seed, i)) % 1;
    const x = sx0 + q * (low ? 300 : 60) + (rnd(seed, 30 + i) - 0.5) * 24 + Math.sin(t * 1.3 + i) * 8;
    const y = sy0 - q * (low ? 46 : 240);
    return <circle key={i} cx={x} cy={y} r={12 + q * (low ? 50 : 40)} fill={`url(#${id}-sm)`} opacity={(1 - q) * Math.min(1, q * 6) * 0.9} />;
  }) : null;
  const rust = wear > 0.4 ? Array.from({length: 4}, (_, i) => <path key={i} d={taper([[-130 + i * 62 + rnd(seed, i) * 30, -100], [-131 + i * 62 + rnd(seed, i) * 30, -82 - rnd(seed, 9 + i) * 10]], 6, 1.6)}
    fill="#c26a3a" opacity={wear * 0.35} />) : null;
  const meatPieces = (y: number, x0: number, x1: number, n: number) => Array.from({length: n}, (_, i) => {
    const mx = x0 + (i + 0.5) * ((x1 - x0) / n);
    return <g key={i}>
      <path d={ell(mx, y, (x1 - x0) / n * 0.38, 9)} fill={`url(#${id}-m)`} stroke={line(meat)} strokeWidth={ow * 0.7} />
      <path d={`M${mx - (x1 - x0) / n * 0.24} ${y - 4} Q${mx} ${y - 8} ${mx + (x1 - x0) / n * 0.2} ${y - 4}`} stroke="#c2643e" strokeWidth={2}
        fill="none" strokeLinecap="round" opacity={0.7} />
    </g>;
  });
  return (
    <g transform={at(p)}>
      <defs>
        <Cyl id={`${id}-c`} c={steel} /><Lit id={`${id}-s`} c={steel} /><Lit id={`${id}-f`} c={frameC} />
        <Rad id={`${id}-m`} c={meat} k={0.8} />
        <radialGradient id={`${id}-fi`} cx="50%" cy="70%" r="70%"><stop offset="0%" stopColor="#fff2a8" /><stop offset="45%" stopColor={fire} />
          <stop offset="100%" stopColor="#a32a1e" /></radialGradient>
        <radialGradient id={`${id}-sm`}><stop offset="0%" stopColor="#a9b8e0" stopOpacity={0.8} /><stop offset="55%" stopColor="#b9c6e8" stopOpacity={0.45} />
          <stop offset="100%" stopColor="#c6d0ee" stopOpacity={0} /></radialGradient>
        <clipPath id={`${id}-b`}><path d={rr(-160, -152, 296, 112, 30)} /></clipPath>
      </defs>
      {form === 'tank' && <>
        <ContactShadow x={-20} y={2} w={460} opacity={0.32} />
        {lidOpen && <Pass ow={ow} list={[pc(rr(-158, -246, 290, 100, 32), `url(#${id}-c)`, steel)]} />}
        {lidOpen && <path d={rr(-146, -236, 266, 80, 26)} fill={shade(steel, 0.45)} />}
        <Pass ow={ow} list={[
          tb('M130 -40 L232 -32', frameC, 9), tb('M222 -32 L222 -6', frameC, 6),
          pc(rr(-178, -46, 316, 14, 7), `url(#${id}-f)`, frameC),
          pc(rr(-228, -114, 76, 76, 16), `url(#${id}-s)`, steel),
          pc(rr(110, -224, 18, 100, 8), `url(#${id}-s)`, steel),
          pc(rr(104, -232, 30, 12, 6), `url(#${id}-s)`, steel),
          pc(rr(-160, -152, 296, 112, 30), `url(#${id}-c)`, steel),
          pc(ell(132, -96, 18, 54), shade(steel, 0.12), steel),
        ]} />
        <g clipPath={`url(#${id}-b)`}>{rust}</g>
        {lidOpen ? <g>
          {/* the opened chamber, the grate and what is on it */}
          <path d={rr(-150, -154, 276, 18, 9)} fill="#211a2a" />
          {Array.from({length: 14}, (_, i) => <path key={i} d={`M${-144 + i * 20} -154 V-138`} stroke="#9aa3bd" strokeWidth={2} />)}
          {meatPieces(-156, -140, 120, 4)}
        </g> : <g>
          <path d="M-156 -102 H130" stroke={line(steel)} strokeWidth={ow * 0.8} strokeLinecap="round" />
          {/* the lid handle on its standoffs, and a coil of spring round the bar */}
          <Pass ow={ow * 0.7} list={[tb('M-46 -120 L46 -120', '#c9cfdc', 5), tb('M-40 -120 L-40 -106 M40 -120 L40 -106', '#c9cfdc', 3)]} />
          {Array.from({length: 7}, (_, i) => <path key={i} d={`M${-24 + i * 8} -124 V-116`} stroke="#8a90aa" strokeWidth={2} strokeLinecap="round" />)}
          <g transform="translate(-112 -124)">
            <circle r={10 + ow * 0.6} fill={line('#e9edf6')} /><circle r={10} fill="#f4f6fb" />
            <path d={`M0 0 L${Math.cos(-2.4 + Math.sin(t * 2) * 0.12) * 7.5} ${Math.sin(-2.4 + Math.sin(t * 2) * 0.12) * 7.5}`} stroke="#d23a3a"
              strokeWidth={2} strokeLinecap="round" />
          </g>
        </g>}
        <Sheen d="M-140 -138 H90" w={6} o={0.4} />
        {/* the firebox door, glowing through its vent */}
        <path d={rr(-216, -100, 46, 48, 10)} fill={lit ? `url(#${id}-fi)` : '#1e1a2a'} stroke={line(steel)} strokeWidth={ow * 0.7}
          opacity={lit ? fl : 1} />
        {[0, 1, 2].map((i) => <path key={i} d={`M-208 ${-90 + i * 12} H-178`} stroke={shade(steel, 0.3)} strokeWidth={3} strokeLinecap="round" />)}
        {lit && <Glow x={-193} y={-76} r={60} color="#ff9a3a" opacity={0.35 * fl} />}
        <Pass ow={ow * 0.8} list={[tb('M-232 -70 L-246 -70', '#c9cfdc', 4)]} />
        {[-100, 96].map((cx) => <g key={cx}>
          <circle cx={cx} cy={-28} r={28 + ow} fill={line(tire)} /><circle cx={cx} cy={-28} r={28} fill={tire} />
          <circle cx={cx} cy={-28} r={14} fill={rim} /><circle cx={cx - 4} cy={-32} r={4} fill="#ffffff" opacity={0.7} />
        </g>)}
      </>}
      {form === 'trench' && <>
        <ContactShadow x={0} y={4} w={420} opacity={0.25} />
        <Pass ow={ow} list={[pc(rr(-190, -18, 380, 22, 11), `url(#${id}-dirt)`, '#a8744a')]} />
        <defs><Lit id={`${id}-dirt`} c="#b0784a" x2={0.2} /></defs>
        <path d={rr(-168, -12, 336, 14, 7)} fill="#2a1a24" />
        {Array.from({length: 9}, (_, i) => {
          const g = 0.6 + 0.4 * Math.sin(frame / 7 + i * 1.7);
          return <circle key={i} cx={-150 + i * 37} cy={-5} r={9} fill={fire} opacity={g * (lit ? 0.9 : 0.15)} />;
        })}
        {lit && <Glow x={0} y={-6} r={150} color="#ff8a3a" opacity={0.25 * fl} />}
        {Array.from({length: 16}, (_, i) => <path key={i} d={`M${-160 + i * 21.3} -14 V0`} stroke="#9aa3bd" strokeWidth={2.2} strokeLinecap="round" />)}
        <path d="M-166 -14 H166" stroke="#c9cfdc" strokeWidth={3} strokeLinecap="round" />
        {meatPieces(-22, -150, 150, 4)}
      </>}
      {form === 'block' && <>
        <ContactShadow x={0} y={2} w={400} opacity={0.3} />
        <Pass ow={ow} list={[pc(rr(-160, -104, 320, 104, 10), '#b9b4c8', '#b9b4c8'), pc(rr(-170, -116, 340, 16, 7), `url(#${id}-tin)`, '#a9b0c8')]} />
        <defs><Lit id={`${id}-tin`} c="#b6bdd4" x2={0.1} /><Lit id={`${id}-blk`} c="#c4bfd2" k={0.6} /></defs>
        {Array.from({length: 5}, (_, r) => Array.from({length: 9}, (_, c) => {
          const bx = -158 + c * 40 - (r % 2 ? 20 : 0);
          if (bx < -170 || bx + 38 > 168) return null;
          return <path key={`${r}-${c}`} d={rr(Math.max(-158, bx), -102 + r * 20.4, Math.min(38, 158 - bx), 18.4, 4)} fill={`url(#${id}-blk)`} />;
        }))}
        <path d={rr(-40, -40, 80, 40, 10)} fill="#2a1a24" stroke={line('#b9b4c8')} strokeWidth={ow * 0.6} />
        {lit && <path d={rr(-34, -28, 68, 28, 8)} fill={`url(#${id}-fi)`} opacity={fl} />}
        {lit && <Glow x={0} y={-14} r={70} color="#ff9a3a" opacity={0.3 * fl} />}
        {Array.from({length: 10}, (_, i) => <path key={i} d={`M${-160 + i * 34} -114 V-102`} stroke={shade('#b6bdd4', 0.2)} strokeWidth={2}
          opacity={0.7} />)}
      </>}
      {smoke}
    </g>
  );
};

// ============================================================================ the church fan

/** the illustration side, a family on a hill below a white church, in warm lithograph colour */
const FanPicture: React.FC<{frame: number; seed: number}> = ({frame, seed}) => (
  <g>
    <rect x={-10} y={-35} width={20} height={26} fill="#8cc0f0" />
    <rect x={-10} y={-24} width={20} height={14} fill="#ffd9a8" opacity={0.75} />
    <circle cx={5} cy={-28} r={2.6} fill="#fff1b8" />
    <path d="M-12 -14 Q-2 -20 12 -16 V-8 H-12 Z" fill="#6aa84f" />
    <path d="M-12 -12 Q2 -16 12 -12 V-8 H-12 Z" fill="#4f8f3c" />
    <path d="M4 -19 H9 V-15.6 H4 Z M4 -19 L6.5 -21.5 L9 -19 Z" fill="#fbf6ea" />
    <path d="M6.5 -21.5 V-24.5 M5.6 -23.4 H7.4" stroke="#fbf6ea" strokeWidth={0.6} strokeLinecap="round" />
    {[[-5.6, 0.0158, SKIN_TONES[4], '#d23a3a', 'curly'], [-1.4, 0.0176, SKIN_TONES[3], '#2f6fd1', 'short'],
      [2.4, 0.0118, SKIN_TONES[4], '#f2c14a', 'bun']].map(([fx, k, skin, shirt, hair], i) =>
      <Figure key={i} frame={frame} x={fx as number} y={-11.6} scale={k as number} pose={i === 2 ? 'wave' : 'stand'} emotion="happy"
        skin={skin as string} shirt={shirt as string} pants="#3a3a5a" hair={hair as FigureHair} hairColor="#1c1512" top="tee" seed={seed + i * 5}
        turn={0.2} />)}
  </g>
);

/**
 * THE CHURCH FAN, a card blade stapled to a flat wooden paddle. It swings on `frame` and TURNS, and as it
 * turns the two sides show in turn, the warm full-colour picture of a family on one side and the
 * funeral home's notice in two inks on the other. The notice is the meaning, because those funeral
 * homes gave the fans to the churches and put a picture of Black families in front of a congregation
 * when almost no other printed thing did. The notice here has no name on it.
 */
export const ChurchFanV2: React.FC<BlackTxPropsV2 & {h?: number; phase?: number; amp?: number; showAd?: boolean}> = (p) => {
  const {x = 0, y = 0, scale = 1, frame = 0, seed = 142, phase = 0, amp = 1, showAd = false} = p;
  const id = useUid(), ow = owOf(p);
  const swing = Math.sin(frame / 6.5 + phase) * 22 * amp;
  const turn = Math.cos(frame / 6.5 + phase);
  const ad = showAd || turn < 0;
  const sx = showAd ? 1 : Math.max(0.2, Math.abs(turn));
  const card = '#f6eedb', wood = '#c99a62', ink = '#26304e', red = '#b8323a';
  const blade = roundPoly([[-6.6, -10], [-9.6, -27], [-7, -33.6], [0, -35], [7, -33.6], [9.6, -27], [6.6, -10]], [2.6, 3.6, 3, 4, 3, 3.6, 2.6]);
  const inner = roundPoly([[-5.4, -11.4], [-8.2, -27], [-6, -32.2], [0, -33.4], [6, -32.2], [8.2, -27], [5.4, -11.4]], [1.8, 3, 2.4, 3, 2.4, 3, 1.8]);
  return (
    <g transform={`translate(${x} ${y}) rotate(${swing.toFixed(2)}) scale(${scale * CM * sx} ${scale * CM})`}>
      <defs><Lit id={`${id}-w`} c={wood} /><Lit id={`${id}-c`} c={card} k={0.5} />
        <clipPath id={`${id}-i`}><path d={inner} /></clipPath></defs>
      <Pass ow={ow} list={[pc(rr(-1.6, -14, 3.2, 19.4, 1.6), `url(#${id}-w)`, wood), pc(blade, `url(#${id}-c)`, card)]} />
      <g clipPath={`url(#${id}-i)`}>
        {ad ? <g>
          <rect x={-10} y={-35} width={20} height={26} fill={card} />
          <path d={rr(-6, -31, 12, 3.2, 1.6)} fill={ink} />
          <path d="M-3.6 -25.6 L0 -27.8 L3.6 -25.6 Z" fill={ink} />
          {[-2.4, -0.8, 0.8, 2.4].map((cx) => <path key={cx} d={rr(cx - 0.4, -25.6, 0.8, 3.4, 0.4)} fill={ink} />)}
          <path d={rr(-4.2, -22.4, 8.4, 0.9, 0.45)} fill={ink} />
          {[0, 1, 2, 3].map((i) => <path key={i} d={rr(-5.6 + i * 0.4, -20 + i * 2.1, 11.2 - i * 0.8, 1.1, 0.55)} fill={i === 1 ? red : ink}
            opacity={0.88} />)}
          <path d={rr(-4, -11.8, 8, 1.4, 0.7)} fill={red} />
        </g> : <FanPicture frame={frame} seed={seed} />}
      </g>
      <path d={inner} fill="none" stroke={ad ? red : '#d9b552'} strokeWidth={0.6} />
      <path d="M-7.6 -28 Q-6.6 -32 -2 -33.6" stroke="#ffffff" strokeWidth={1} fill="none" strokeLinecap="round" opacity={0.6} />
      {[-1, 1].map((s) => <path key={s} d={rr(s * 0.7 - 0.5, -12.6, 1, 2.2, 0.4)} fill="#d9dde8" />)}
    </g>
  );
};

/**
 * A WHOLE CONGREGATION of church fans, which is what the shot actually is. Rows of pew backs recede up
 * the frame, and above each row the fans swing and turn out of phase with each other, which reads as
 * heat, time and a full room at once. Screen units, as the library's, with `w` across and `depth` from the
 * back row forward, the front row at y plus `depth` as the library lays them.
 */
export const FanFieldV2: React.FC<BlackTxPropsV2 & {w?: number; depth?: number; count?: number}> = (p) => {
  const {x = 0, y = 0, scale = 1, frame = 0, seed = 143, w = 900, depth = 260, count = 34} = p;
  const id = useUid(), ow = 3.4 / scale;
  const wood = '#94603a', R = 5;
  const fans = Array.from({length: count}, (_, i) => {
    const row = Math.min(R - 1, Math.floor(rnd(seed, 500 + i) * R));
    const v = row / (R - 1), fs = 0.8 + v * 0.8;
    return {i, row, fs, fx: (rnd(seed, i) - 0.5) * w * (0.82 + v * 0.16)};
  });
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs><Lit id={`${id}-w`} c={wood} x2={0.1} /></defs>
      {Array.from({length: R}, (_, r) => {
        const v = r / (R - 1), py = v * depth, hw = w * (0.5 + v * 0.05), ph = 16 + v * 12;
        return <g key={r}>
          {fans.filter((f) => f.row === r).map((f) => <ChurchFanV2 key={f.i} frame={frame} x={f.fx} y={py - ph * 0.4} scale={f.fs}
            seed={seed + f.i * 13} phase={rnd(seed, 900 + f.i) * Math.PI * 2} amp={0.6 + rnd(seed, 700 + f.i) * 0.8} />)}
          <Pass ow={ow * (0.6 + v * 0.4)} list={[pc(rr(-hw, py - ph, hw * 2, ph, ph * 0.45), `url(#${id}-w)`, wood)]} />
          <path d={`M${-hw + 10} ${py - ph + 5} H${hw - 10}`} stroke={light(wood, 0.55)} strokeWidth={3} strokeLinecap="round" opacity={0.6} />
          {Array.from({length: 7}, (_, k) => <path key={k} d={rr(-hw * 0.8 + k * hw * 0.27, py - ph * 0.42, hw * 0.08, ph * 0.3, 3)}
            fill={['#b8323a', '#2f4f9a', '#b8323a'][k % 3]} opacity={0.85} />)}
        </g>;
      })}
    </g>
  );
};

// ============================================================================ the sanctuary

/** a robed singer on the cast rig, with a stole drawn at the rig's own chest */
const Singer: React.FC<{frame: number; x: number; y: number; k: number; robe: string; stole: string; seed: number; emotion: FigureEmotion;
  pose: FigurePose}> = ({frame, x, y, k, robe, stole, seed, emotion, pose}) => {
  const tt = -350 + figBob(frame, seed) * 0.6;
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${k})`}>
      <Figure frame={frame} x={0} y={0} pose={pose} emotion={emotion} skin={SKINS[seed % SKINS.length]} hair={HAIRS[seed % HAIRS.length]}
        hairColor={seed % 4 === 0 ? '#b9b2a6' : '#1c1512'} top="tee" shirt={robe} pants={robe} seed={seed} build={0.4 + (seed % 3) * 0.15} />
      {[-1, 1].map((s) => <path key={s} d={`M${s * 16} ${tt + 4} L${s * 26} ${tt + 200} L${s * 46} ${tt + 196} L${s * 38} ${tt}`} fill={stole}
        stroke={line(stole)} strokeWidth={6} strokeLinejoin="round" />)}
    </g>
  );
};

/**
 * THE SANCTUARY, with the band that outsiders leave out. The raised choir loft behind and above the
 * pulpit, the choir robed in `robe` with gold stoles, swaying and singing. The organ with its ROTATING
 * SPEAKER CABINET, whose rotor turns on `frame`, and the drum kit with its cymbals shivering. Pews with
 * hymnals in their racks, warm light through stained glass falling across the room in shafts, and the
 * ushers at the aisle ends in WHITE GLOVES. `country` adds a window unit high in the back wall and a
 * ceiling fan turning too slowly to help. Screen units, as the library's.
 */
export const SanctuaryV2: React.FC<BlackTxPropsV2 & {h?: number; w?: number; pews?: number; robe?: string; country?: boolean;
  choir?: number; band?: boolean}> = (p) => {
  const {x = 0, y = 0, scale = 1, frame = 0, seed = 144, night = false, h = 300, w = 900, pews = 5, robe = '#2c4a9c', country = false,
    choir = 9, band = true} = p;
  const id = useUid(), ow = 3.4 / scale, t = frame / 30;
  const wall = '#f3e2c0', wood = '#9a623a', dark = '#6a3e26', gold = '#f2c14a';
  const pk = h * 0.24 / FIG;
  const GLASS = ['#f2b33d', '#d9453a', '#2f6fd1', '#3fa36b', '#f6dd7a', '#9b4fc4'];
  const front = Math.ceil(choir / 2), back = choir - front;
  const choirFig = (row: 0 | 1) => Array.from({length: row ? back : front}, (_, k) => {
    const per = row ? back : front;
    const cx = (per > 1 ? k / (per - 1) - 0.5 : 0) * w * 0.42 + (row ? w * 0.025 : 0);
    const sd = seed + row * 20 + k * 3;
    return <Singer key={`${row}-${k}`} frame={frame} x={cx} y={-h * (row ? 0.585 : 0.5)} k={pk * (row ? 0.94 : 1)} robe={row ? shade(robe, 0.08) : robe}
      stole={gold} seed={sd} emotion={k % 3 === 1 ? 'excited' : 'happy'} pose={row === 0 && k === Math.floor(per / 2) ? 'raise' : 'stand'} />;
  });
  const hands = figureHands('hold');
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <Lit id={`${id}-wall`} c={wall} k={0.6} /><Lit id={`${id}-w`} c={wood} /><Lit id={`${id}-d`} c={dark} />
        <Lit id={`${id}-wd`} c={wood} x2={0.05} />
        <linearGradient id={`${id}-sh`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fff0b8" stopOpacity={0.75} />
          <stop offset="100%" stopColor="#ffe6a8" stopOpacity={0} /></linearGradient>
        {[-1, 1].map((s) => <clipPath key={s} id={`${id}-g${s}`}><path d={arch(s * w * 0.38 - w * 0.05, -h * 0.46, w * 0.1, h * 0.42)} /></clipPath>)}
      </defs>
      <ContactShadow x={0} y={2} w={w * 1.05} opacity={0.28} />
      <Pass ow={ow} list={[pc(rr(-w / 2, -h, w, h, 28), `url(#${id}-wall)`, wall)]} />
      <path d={rr(-w / 2 + 4, -h * 0.3, w - 8, h * 0.3 - 4, 20)} fill={`url(#${id}-d)`} opacity={0.9} />
      {/* the stained glass and the shafts of light it throws */}
      {[-1, 1].map((s) => {
        const wx = s * w * 0.38 - w * 0.05, ww = w * 0.1;
        return <g key={s}>
          {!night && <path d={`M${wx} ${-h * 0.8} L${wx + ww} ${-h * 0.8} L${s * w * 0.1 + ww * 1.6 * -s} 0 L${s * w * 0.2 - ww * 1.6 * s} 0 Z`}
            fill={`url(#${id}-sh)`} opacity={0.95 + Math.sin(t * 0.8 + s) * 0.05} />}
          <Pass ow={ow} list={[pc(arch(wx, -h * 0.46, ww, h * 0.42), '#3a2a40', '#3a2a40')]} />
          <g clipPath={`url(#${id}-g${s})`}>
            {Array.from({length: 7}, (_, r) => Array.from({length: 3}, (_, c) => <rect key={`${r}-${c}`} x={wx + c * ww / 3 + 1.2} y={-h * 0.88 + r * h * 0.06 + 1.2}
              width={ww / 3 - 2.4} height={h * 0.06 - 2.4} rx={3}
              fill={night ? mix(GLASS[(r * 3 + c + (s > 0 ? 2 : 0)) % 6], '#1f1d44', 0.7) : GLASS[(r * 3 + c + (s > 0 ? 2 : 0)) % 6]} />))}
            <circle cx={wx + ww / 2} cy={-h * 0.8} r={ww * 0.26} fill={night ? '#3a3266' : '#fff1b8'} opacity={0.9} />
          </g>
        </g>;
      })}
      {/* the wooden cross on the back wall above the loft */}
      <Pass ow={ow} list={[pc(rr(-7, -h * 0.94, 14, h * 0.26, 5), `url(#${id}-w)`, wood), pc(rr(-26, -h * 0.88, 52, 13, 5), `url(#${id}-w)`, wood)]} />
      {country && <g>
        {/* the window unit, dripping, and the ceiling fan turning too slowly to help */}
        <Pass ow={ow} list={[pc(rr(w * 0.18, -h * 0.95, w * 0.1, h * 0.08, 8), '#c8ccdc', '#c8ccdc')]} />
        {Array.from({length: 5}, (_, i) => <path key={i} d={`M${w * 0.19} ${-h * 0.94 + i * 4.4} H${w * 0.27}`} stroke="#8a90aa" strokeWidth={1.6} />)}
        <circle cx={w * 0.25} cy={-h * 0.86 + ((frame % 40) / 40) * h * 0.1} r={2.4} fill="#7ab8ec" opacity={1 - (frame % 40) / 40} />
        <g transform={`translate(${-w * 0.3} ${-h * 0.96})`}>
          {Array.from({length: 5}, (_, i) => {
            const a = (i / 5) * Math.PI * 2 + frame * 0.03, c = Math.cos(a);
            return <path key={i} d={ell(c * w * 0.035, Math.sin(a) * 3, Math.abs(c) * w * 0.032 + 2, 3)} fill="#8a5a36" stroke={line('#8a5a36')} strokeWidth={1.4} />;
          })}
          <circle r={5} fill="#c9a050" />
        </g>
      </g>}
      {/* THE CHOIR LOFT and the choir, behind and above the pulpit */}
      {choirFig(1)}{choirFig(0)}
      <Pass ow={ow} list={[pc(rr(-w * 0.27, -h * 0.56, w * 0.54, h * 0.13, 12), `url(#${id}-w)`, wood)]} />
      <path d={`M${-w * 0.26} ${-h * 0.545} H${w * 0.26}`} stroke={light(wood, 0.5)} strokeWidth={3} strokeLinecap="round" opacity={0.6} />
      {band && <g>
        {/* THE ORGAN and its ROTATING SPEAKER CABINET, the rotor turning behind its louvers */}
        <g transform={`translate(${-w * 0.34} ${-h * 0.2})`}>
          <Pass ow={ow} list={[pc(rr(-w * 0.06, -h * 0.17, w * 0.12, h * 0.17, 8), `url(#${id}-d)`, dark),
            pc(rr(w * 0.075, -h * 0.25, w * 0.065, h * 0.25, 8), `url(#${id}-w)`, wood)]} />
          <path d={rr(-w * 0.054, -h * 0.18, w * 0.108, h * 0.03, 3)} fill="#fbf6ea" stroke={line('#fbf6ea')} strokeWidth={1.4} />
          {Array.from({length: 9}, (_, i) => <path key={i} d={`M${-w * 0.048 + i * w * 0.0115} ${-h * 0.18} V${-h * 0.163}`} stroke="#2a2440" strokeWidth={1.2} />)}
          <defs><clipPath id={`${id}-les`}><path d={rr(w * 0.083, -h * 0.215, w * 0.049, h * 0.11, 4)} /></clipPath></defs>
          <path d={rr(w * 0.083, -h * 0.215, w * 0.049, h * 0.11, 4)} fill="#2a2032" />
          <g clipPath={`url(#${id}-les)`}>
            {Array.from({length: 4}, (_, i) => {
              const xx = w * 0.083 + (((frame * 2.2 + i * w * 0.0125) % (w * 0.05)));
              return <rect key={i} x={xx} y={-h * 0.215} width={w * 0.006} height={h * 0.11} fill="#c9a060" opacity={0.75} />;
            })}
          </g>
          {Array.from({length: 5}, (_, i) => <path key={i} d={`M${w * 0.085} ${-h * 0.205 + i * h * 0.022} H${w * 0.13}`} stroke={dark} strokeWidth={2.2} />)}
        </g>
        {/* the kit, which is always there */}
        <g transform={`translate(${w * 0.33} ${-h * 0.2})`}>
          <Pass ow={ow * 0.8} list={[
            tb(`M${w * 0.055} ${-h * 0.15} V0`, '#c9cfdc', 2.4), tb(`M${-w * 0.06} ${-h * 0.13} V0`, '#c9cfdc', 2.4),
            pc(ell(0, -h * 0.055, w * 0.04, h * 0.055), '#d23a3a', '#d23a3a'),
            pc(ell(-w * 0.032, -h * 0.125, w * 0.02, h * 0.02), '#d23a3a', '#d23a3a'),
            pc(ell(w * 0.026, -h * 0.125, w * 0.02, h * 0.02), '#d23a3a', '#d23a3a'),
          ]} />
          <path d={ell(0, -h * 0.055, w * 0.028, h * 0.04)} fill="#fbf6ea" opacity={0.9} />
          {[[-w * 0.06, -h * 0.13, 1], [w * 0.055, -h * 0.155, 2]].map(([cx, cy, k]) => <ellipse key={k} cx={cx} cy={cy} rx={w * 0.032} ry={h * 0.01}
            fill={gold} stroke={line(gold)} strokeWidth={1.6} transform={`rotate(${Math.sin(frame / 2.6 + k * 2) * 6} ${cx} ${cy})`} />)}
        </g>
      </g>}
      {/* the pulpit with its parament, and the open book */}
      <Pass ow={ow} list={[pc(roundPoly([[-w * 0.075, -h * 0.43], [-w * 0.09, -h * 0.19], [w * 0.09, -h * 0.19], [w * 0.075, -h * 0.43]], 10),
        `url(#${id}-w)`, wood)]} />
      <path d={rr(-w * 0.04, -h * 0.42, w * 0.08, h * 0.17, 6)} fill="#6a3fa0" stroke={line('#6a3fa0')} strokeWidth={2} />
      <path d={`M0 ${-h * 0.39} V${-h * 0.29} M${-w * 0.016} ${-h * 0.36} H${w * 0.016}`} stroke={gold} strokeWidth={4} strokeLinecap="round" />
      <path d={`M${-w * 0.035} ${-h * 0.43} Q${-w * 0.017} ${-h * 0.45} 0 ${-h * 0.435} Q${w * 0.017} ${-h * 0.45} ${w * 0.035} ${-h * 0.43} Z`} fill="#fbf6ea"
        stroke={line('#fbf6ea')} strokeWidth={1.4} />
      {/* the pews, backs to us, each with its rack of hymnals, and the centre aisle */}
      {Array.from({length: pews}, (_, i) => {
        const v = i / Math.max(1, pews - 1), py = -h * 0.17 + v * h * 0.17, gap = w * (0.035 + v * 0.02), hw = w * (0.36 + v * 0.09), ph = h * (0.065 + v * 0.03);
        return <g key={i}>
          {[-1, 1].map((s) => <g key={s}>
            <Pass ow={ow} list={[pc(rr(s < 0 ? -hw : gap, py - ph, hw - gap, ph, ph * 0.4), `url(#${id}-wd)`, wood)]} />
            <path d={`M${s < 0 ? -hw + 8 : gap + 8} ${py - ph + 4} H${s < 0 ? -gap - 8 : hw - 8}`} stroke={light(wood, 0.5)} strokeWidth={2.4}
              strokeLinecap="round" opacity={0.6} />
            {Array.from({length: 5}, (_, k) => <path key={k} d={rr((s < 0 ? -hw : gap) + 16 + k * (hw - gap - 32) / 5, py - ph * 0.5, (hw - gap) * 0.07, ph * 0.38, 2)}
              fill="#b8323a" opacity={0.9} />)}
          </g>)}
        </g>;
      })}
      {/* the ushers at the aisle ends, in WHITE GLOVES */}
      {[-1, 1].map((s) => {
        const uk = h * 0.27 / FIG;
        return <g key={s} transform={`translate(${s * w * 0.44} ${-h * 0.01}) scale(${uk})`}>
          <Figure frame={frame} x={0} y={0} pose="hold" emotion="proud" skin={SKINS[s < 0 ? 1 : 2]} hair={s < 0 ? 'bun' : 'short'} hairColor="#1c1512"
            top="suit" shirt="#2b2a44" trim="#fbf6ea" pants="#2b2a44" seed={seed + (s < 0 ? 3 : 8)} build={0.43} turn={-s * 0.3} />
          {[hands.l, hands.r].map((hp, k) => <circle key={k} cx={hp.x} cy={hp.y} r={27} fill="#ffffff" stroke={line('#e9edf6')} strokeWidth={6} />)}
        </g>;
      })}
    </g>
  );
};

// ============================================================================ the trail ride

const COATS = ['#8a4a2a', '#4a2e22', '#c79a62', '#a8643a', '#9c9aaa', '#5e3e2c'];
const CLUB = ['#d23a3a', '#2f5fc4', '#f2b33d', '#3f9a52', '#8a4ab0'];

/** a horse at the walk on four three-bone tapered legs, with a face that looks down the road */
const WalkHorse: React.FC<{frame: number; ow: number; coat: string; seed: number; blanket: string; children?: React.ReactNode}> = ({
  frame, ow, coat, seed, blanket, children,
}) => {
  const id = useUid(), t = frame / 30;
  const dark = '#2e2232', cs = shade(coat, 0.32), deg = Math.PI / 180;
  const ph = t * 2 * Math.PI * 0.85 + seed;
  const bob = Math.sin(ph * 2) * 1.4;
  const B = (v: number) => v + bob;
  const leg = (sx: number, sy: number, off: number, front: boolean) => {
    const q = ph + off * 2 * Math.PI, s = Math.sin(q), lift = Math.max(0, Math.cos(q));
    const a1 = front ? s * 16 : s * 14 - 8;
    const a2 = front ? a1 - lift * 55 : a1 + 14 + lift * 28;
    const a3 = front ? a2 - lift * 14 + 6 : a2 + lift * 10 + 4;
    const L = front ? [48, 42, 14] : [50, 44, 14];
    const j0: Pt = [sx, B(sy)];
    const j1: Pt = [j0[0] + Math.sin(a1 * deg) * L[0], j0[1] + Math.cos(a1 * deg) * L[0]];
    const j2: Pt = [j1[0] + Math.sin(a2 * deg) * L[1], j1[1] + Math.cos(a2 * deg) * L[1]];
    const j3: Pt = [j2[0] + Math.sin(a3 * deg) * L[2], j2[1] + Math.cos(a3 * deg) * L[2]];
    const top = front ? 30 : 38;
    const d = taper([j0, j1, j2, j3], top, 9, (u) => u < 0.36 ? top - (top - 13) * (u / 0.36) : u < 0.72 ? 13 - (u - 0.36) * 4 : 12.4 - (u - 0.72) * 9);
    return {d, h: j3, a3};
  };
  const legs = [
    {...leg(-80, -112, 0.5, false), far: true}, {...leg(60, -108, 0.75, true), far: true},
    {...leg(-74, -112, 0.0, false), far: false}, {...leg(64, -108, 0.25, true), far: false},
  ];
  const hoof = (l: {h: Pt; a3: number}) => <path d={rr(-6.6, -3, 13.2, 9, 3.4)}
    transform={`translate(${l.h[0].toFixed(1)} ${l.h[1].toFixed(1)}) rotate(${(-l.a3).toFixed(1)})`} fill={dark} stroke={line(dark)} strokeWidth={ow * 0.8} />;
  const swish = Math.sin(t * 2 * Math.PI * 0.6 + seed) * 8;
  const body = `M-110 ${B(-122)} C-114 ${B(-152)} -90 ${B(-156)} -70 ${B(-151)} C-30 ${B(-142)} 10 ${B(-144)} 40 ${B(-155)} C64 ${B(-160)} 90 ${B(-144)} 92 ${B(-118)}
    C94 ${B(-96)} 74 ${B(-84)} 52 ${B(-84)} C20 ${B(-80)} -30 ${B(-82)} -62 ${B(-90)} C-92 ${B(-94)} -108 ${B(-104)} -110 ${B(-122)} Z`;
  const nod = Math.sin(ph * 2 + 0.6) * 2;
  const neck = roundPoly([[26, B(-148)], [96, B(-214 + nod)], [126, B(-198 + nod)], [90, B(-110)]], [20, 14, 14, 24]);
  const head = taper([[110, B(-208 + nod)], [128, B(-186 + nod)], [148, B(-160 + nod)]], 36, 23);
  const tail = taper([[-104, B(-142)], [-128, B(-128) + swish * 0.3], [-136, B(-100) + swish * 0.6], [-134, B(-70) + swish]], 20, 13,
    (u) => 20 + Math.sin(u * Math.PI) * 12 - u * 7);
  const blink = (frame + seed * 17) % 100 < 4;
  return (
    <g>
      <defs><Lit id={`${id}-h`} c={coat} x2={0.3} /><Lit id={`${id}-b`} c={blanket} x2={0.2} /></defs>
      <ContactShadow x={-6} y={2} w={280} opacity={0.32} />
      <Pass ow={ow} list={legs.filter((l) => l.far).map((l) => pc(l.d, cs, coat))} />
      {legs.filter((l) => l.far).map((l, i) => <g key={i}>{hoof(l)}</g>)}
      <Pass ow={ow} list={[pc(tail, dark, dark)]} />
      <Pass ow={ow} list={[
        pc(neck, `url(#${id}-h)`, coat), pc(body, `url(#${id}-h)`, coat),
        ...legs.filter((l) => !l.far).map((l) => pc(l.d, `url(#${id}-h)`, coat)),
        pc(ell(-74, B(-120), 36, 32), `url(#${id}-h)`, coat), pc(ell(62, B(-114), 28, 28), `url(#${id}-h)`, coat),
        pc(head, `url(#${id}-h)`, coat),
      ]} />
      {legs.filter((l) => !l.far).map((l, i) => <g key={i}>{hoof(l)}</g>)}
      <path d={`M-96 ${B(-142)} Q-60 ${B(-152)} -20 ${B(-142)}`} stroke="#ffffff" strokeWidth={6} fill="none" opacity={0.28} strokeLinecap="round" />
      {/* the mane, the ears, the bridle and the face */}
      <path d={`M34 ${B(-154)} Q70 ${B(-182)} ${100} ${B(-212 + nod)}`} stroke={line(dark)} strokeWidth={13 + ow * 2} fill="none" strokeLinecap="round" />
      <path d={`M34 ${B(-154)} Q70 ${B(-182)} ${100} ${B(-212 + nod)}`} stroke={dark} strokeWidth={13} fill="none" strokeLinecap="round" />
      <path d={`M102 ${B(-208 + nod)} L104 ${B(-230 + nod)} L115 ${B(-208 + nod)} Z`} fill={coat} stroke={line(coat)} strokeWidth={ow * 1.4} strokeLinejoin="round" />
      <ellipse cx={146} cy={B(-162 + nod)} rx={3.6} ry={2.4} fill={dark} transform={`rotate(40 146 ${B(-162 + nod)})`} />
      <path d={`M112 ${B(-196 + nod)} L142 ${B(-164 + nod)} M122 ${B(-208 + nod)} L118 ${B(-176 + nod)} L142 ${B(-164 + nod)}`} stroke="#7a2a1e" strokeWidth={3.2}
        strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <g transform={`translate(122 ${B(-194 + nod)})`}>
        {blink ? <path d="M-5 0 Q0 3 5 0" stroke={line(coat)} strokeWidth={ow * 0.8} fill="none" strokeLinecap="round" />
          : <><ellipse rx={5.4} ry={5.8} fill="#ffffff" stroke={line(coat)} strokeWidth={ow * 0.7} />
            <circle cx={1.8} cy={0.6} r={3.7} fill="#1f1736" /><circle cx={0.5} cy={-1.4} r={1.3} fill="#ffffff" /></>}
        <path d="M-6 -8.4 Q0 -10.6 6.4 -7.6" stroke={shade(coat, 0.5)} strokeWidth={2} fill="none" strokeLinecap="round" />
      </g>
      {/* the saddle blanket in the club's colour, and the western saddle with its horn */}
      <path d={rr(-36, B(-158), 70, 40, 10)} fill={`url(#${id}-b)`} stroke={line(blanket)} strokeWidth={ow} />
      <path d={`M-30 ${B(-128)} H28`} stroke="#ffffff" strokeWidth={3} opacity={0.6} strokeLinecap="round" />
      <Pass ow={ow} list={[pc(`M-30 ${B(-160)} Q-28 ${B(-148)} 0 ${B(-150)} Q24 ${B(-150)} 28 ${B(-166)} L32 ${B(-178)} L38 ${B(-176)} L34 ${B(-154)}
        Q30 ${B(-138)} 0 ${B(-138)} Q-30 ${B(-138)} -34 ${B(-156)} Z`, '#8a4a26', '#8a4a26')]} />
      {children}
    </g>
  );
};

/** a trail rider on the cast rig, astride, reins in hand */
const Rider: React.FC<{frame: number; seed: number; i: number}> = ({frame, seed, i}) => {
  const k = 0.31, seatY = -150, figY = seatY + 150 * k;
  const old = i % 4 === 1, child = i % 5 === 3;
  const kk = child ? 0.24 : k;
  return (
    <g transform={`translate(4 ${child ? seatY + 150 * kk : figY}) scale(${kk})`}>
      <Figure frame={frame} x={0} y={0} pose="hold" emotion={i % 3 === 0 ? 'happy' : 'proud'} skin={SKINS[(i + seed) % SKINS.length]}
        hair={old ? 'bun' : HAIRS[(i + 2) % HAIRS.length]} hairColor={old ? '#c9c2b6' : '#1c1512'} hat={i % 3 === 2 ? 'felt' : 'straw'}
        hatColor={i % 3 === 2 ? '#2e2232' : '#ecc66e'} top="snap" shirt={CLUB[(i + 2) % CLUB.length]} pants="#33476b" turn={0.55}
        seed={seed + i * 7} build={old ? 0.62 : child ? 0.3 : 0.48} />
    </g>
  );
};

/** a club wagon, a flatbed trailer with a built body, a canopy, lettering and big box speakers, towed by a pickup */
const ClubWagon: React.FC<{frame: number; ow: number; club: string; seed: number; speakers: boolean}> = ({frame, ow, club, seed, speakers}) => {
  const id = useUid();
  const frameC = '#2f2c46', post = '#f4efe2', club2 = shade(club, 0.25);
  const beat = Math.max(0, Math.sin(frame * 0.42)) ** 4;
  return (
    <g>
      <defs><Lit id={`${id}-c`} c={club} x2={0.15} /><Lit id={`${id}-d`} c={club2} x2={0.1} /><Lit id={`${id}-k`} c="#2c2838" /></defs>
      <ContactShadow x={0} y={2} w={640} opacity={0.3} />
      <Pass ow={ow} list={[tb('M296 -58 L362 -50', frameC, 10), pc(rr(-300, -82, 600, 16, 8), frameC, frameC)]} />
      {[-1, 1].map((s) => <g key={s} transform={`translate(${s * 150} 0)`}>
        {[-1, 1].map((d) => <PlainWheel key={d} cx={d * 36} r={30} ow={ow} />)}
      </g>)}
      {/* the people on the flatbed, because that is where the party is */}
      {[-150, -30, 90].map((px, k) => <g key={k} transform={`translate(${px} -80) scale(${170 / FIG})`}>
        <Figure frame={frame} x={0} y={0} pose={k === 1 ? 'cheer' : k === 0 ? 'wave' : 'stand'} emotion={k === 1 ? 'excited' : 'happy'}
          skin={SKINS[(k + seed) % SKINS.length]} hair={HAIRS[(k + seed) % HAIRS.length]} hairColor="#1c1512" top="tee"
          shirt={[club, '#fbf6ea', CLUB[(seed + 1) % CLUB.length]][k]} pants="#33476b" seed={seed + k * 9} />
      </g>)}
      <Pass ow={ow} list={[
        pc(rr(-298, -136, 596, 56, 12), `url(#${id}-c)`, club),
        ...[-286, -100, 100, 286].map((x) => tb(`M${x} -136 L${x} -262`, post, 9)),
        pc(rr(-312, -292, 624, 34, 16), `url(#${id}-d)`, club2),
      ]} />
      {/* the club lettering, as blocks, and no club name */}
      {Array.from({length: 7}, (_, k) => <path key={k} d={rr(-252 + k * 76, -120, 52, 24, 12)} fill="#fbf6ea" opacity={0.92} />)}
      {Array.from({length: 9}, (_, k) => <path key={k} d={rr(-270 + k * 62, -282, 40, 14, 7)} fill={light(club, 0.6)} opacity={0.9} />)}
      <Sheen d="M-290 -130 H200" w={5} o={0.4} />
      {speakers && [-1, 1].map((s) => <g key={s} transform={`translate(${s < 0 ? -262 : -200} 0)`}>
        <Pass ow={ow} list={[pc(rr(-30, -254, 60, 118, 12), `url(#${id}-k)`, '#2c2838')]} />
        {[-222, -168].map((cy, j) => <g key={j}>
          <circle cx={0} cy={cy} r={(j ? 13 : 20) + beat * 3} fill="#4a4660" stroke={line('#4a4660')} strokeWidth={ow * 0.6} />
          <circle cx={0} cy={cy} r={(j ? 5 : 8)} fill="#1e1a2a" />
        </g>)}
      </g>)}
      <PickupV2 frame={frame} x={362 + 306} y={0} scale={1 / CM} paint={shade(club, 0.05)} speed={0.25} />
    </g>
  );
};
const PlainWheel: React.FC<{cx: number; r: number; ow: number}> = ({cx, r, ow}) => (
  <g>
    <circle cx={cx} cy={-r} r={r + ow} fill={line('#24213a')} /><circle cx={cx} cy={-r} r={r} fill="#24213a" />
    <circle cx={cx} cy={-r} r={r * 0.5} fill="#c9cfdc" /><circle cx={cx - r * 0.16} cy={-r * 1.16} r={r * 0.14} fill="#ffffff" opacity={0.7} />
  </g>
);

/**
 * THE TRAIL RIDE, a column on the public road, and IT IS NOT A REENACTMENT. Riders on horses at the walk,
 * in straw and felt, with club shirts and club saddle blankets, grandmothers and children among them,
 * and the club wagons, flatbeds with a built body, a canopy, lettering blocks down the side and big box
 * speakers at the back, towed by pickups, with people dancing on the deck. The column recedes, so the
 * far end rides smaller and higher, and the dust rises behind it. `span` is the column's length in
 * centimetres (left out, the column takes its natural length).
 */
export const TrailRideColumnV2: React.FC<BlackTxPropsV2 & {h?: number; span?: number; riders?: number; wagons?: number; dust?: boolean;
  speakers?: boolean}> = (p) => {
  const {frame = 0, seed = 145, riders = 9, wagons = 2, dust = true, speakers = true, span} = p;
  const ow = owOf(p), n = riders + wagons;
  const every = Math.ceil(n / Math.max(1, wagons));
  const items = Array.from({length: n}, (_, i) => {
    const f = n > 1 ? i / (n - 1) : 1;
    const isWagon = wagons > 0 && i % every === Math.min(3, every - 1);
    const k = 0.74 + f * 0.26;
    return {i, f, k, isWagon, len: (isWagon ? 1320 : 290) * k};
  });
  const natural = items.reduce((s, it) => s + it.len, 0);
  const fit = span ? span / natural : 1;
  let cur = -natural / 2;
  const placed = items.map((it) => {
    const cx = (cur + it.len * (it.isWagon ? 0.26 : 0.5)) * fit;
    cur += it.len;
    return {...it, cx};
  });
  return (
    <g transform={at(p)}>
      {dust && Array.from({length: 18}, (_, i) => {
        const age = ((frame + i * 11.7) % 60) / 60;
        const px = (rnd(seed, i) - 0.5) * natural * fit - age * 120;
        return <circle key={i} cx={px} cy={-14 - age * 70 - rnd(seed, 30 + i) * 30} r={24 + age * 50} fill="#e8c88a"
          opacity={Math.sin(age * Math.PI) * 0.32} />;
      })}
      {placed.map((it) => <g key={it.i} transform={`translate(${it.cx.toFixed(1)} ${(-(1 - it.f) * 60).toFixed(1)}) scale(${it.k.toFixed(3)})`}>
        {it.isWagon
          ? <ClubWagon frame={frame} ow={ow / it.k} club={CLUB[it.i % CLUB.length]} seed={seed + it.i} speakers={speakers} />
          : <WalkHorse frame={frame} ow={ow / it.k} coat={COATS[(it.i + seed) % COATS.length]} seed={seed + it.i * 3}
            blanket={CLUB[(it.i + 1) % CLUB.length]}>
            <Rider frame={frame} seed={seed} i={it.i} />
          </WalkHorse>}
      </g>)}
    </g>
  );
};

// ============================================================================ the bucking chute

/**
 * THE BUCKING CHUTES, steel pipe panels in red and silver with the horizontal sliding gates, a number
 * plate over each one, and the announcer's stand raised above them with the announcer at the mic in the
 * lit window. At night (`night`, the default) the overhead lights make hard pools with the arena dust
 * drifting through them on `frame`, which is the signature look. The arena dirt runs along the base.
 */
export const BuckingChuteV2: React.FC<BlackTxPropsV2 & {h?: number; gates?: number; announcer?: boolean; dust?: number}> = (p) => {
  const {frame = 0, seed = 146, night = true, gates = 4, announcer = true, dust = 0.5} = p;
  const id = useUid(), ow = owOf(p), t = frame / 30;
  const red = '#cf3b3c', steel = '#a6b0cc', dirt = '#c99a62', cw = 171, W = gates * cw;
  const slide = Math.max(0, Math.sin(t * 0.7)) * 0.3;
  return (
    <g transform={at(p)}>
      <defs><Lit id={`${id}-b`} c="#6a5e7e" /><Lit id={`${id}-d`} c={dirt} x2={0.1} />
        <linearGradient id={`${id}-l`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fff6dc" stopOpacity={0.34} />
          <stop offset="100%" stopColor="#fff6dc" stopOpacity={0} /></linearGradient></defs>
      {night && Array.from({length: 3}, (_, i) => <path key={i} d={`M${(i - 1) * W * 0.42 - 40} -470 L${(i - 1) * W * 0.42 + 40} -470
        L${(i - 1) * W * 0.42 + 260} 0 L${(i - 1) * W * 0.42 - 260} 0 Z`} fill={`url(#${id}-l)`} opacity={0.8 + Math.sin(t * 3 + i) * 0.1} />)}
      <ContactShadow x={0} y={2} w={W * 1.15} opacity={0.32} />
      {announcer && <g>
        <Pass ow={ow} list={[
          tb(`M${-W * 0.22} -196 L${-W * 0.22} -226 M${W * 0.22} -196 L${W * 0.22} -226`, steel, 10),
          pc(rr(-W * 0.32, -236, W * 0.64, 18, 9), shade(steel, 0.25), steel),
          pc(rr(-W * 0.2, -440, W * 0.4, 206, 18), `url(#${id}-b)`, '#6a5e7e'),
          pc(rr(-W * 0.24, -462, W * 0.48, 26, 13), red, red),
        ]} />
        <path d={rr(-W * 0.16, -400, W * 0.32, 100, 12)} fill={night ? '#ffe3a0' : '#4c5c88'} />
        <g transform={`translate(${-W * 0.04} -238) scale(${0.3})`}>
          <Figure frame={frame} x={0} y={0} pose="stand" emotion="excited" skin={SKINS[2]} hair="short" hairColor="#1c1512" hat="felt"
            hatColor="#f0e6d0" top="snap" shirt="#2f5fc4" pants="#33476b" seed={seed} turn={0.3} />
        </g>
        <path d={rr(-W * 0.2 + ow, -302, W * 0.4 - ow * 2, 64, 10)} fill={`url(#${id}-b)`} />
        <path d={rr(-W * 0.16, -308, W * 0.32, 12, 4)} fill={shade('#6a5e7e', 0.1)} />
        <Pass ow={ow * 0.7} list={[tb(`M${W * 0.02} -306 Q${W * 0.03} -330 ${W * 0.005} -344`, '#3b3a52', 3)]} />
        <path d={rr(W * 0.005 - 6, -352, 12, 14, 6)} fill="#3b3a52" />
      </g>}
      {Array.from({length: gates}, (_, i) => {
        const gx = (i - (gates - 1) / 2) * cw, c = i % 2 ? steel : red;
        const g = i === 1 ? slide * cw : 0;
        return <g key={i}>
          <Pass ow={ow} list={[
            tb(`M${gx - cw * 0.47} 0 L${gx - cw * 0.47} -190`, c, 9), tb(`M${gx + cw * 0.47} 0 L${gx + cw * 0.47} -190`, c, 9),
            ...[30, 68, 106, 144, 182].map((yy) => tb(`M${gx - cw * 0.47 + g} ${-yy} L${gx + cw * 0.47} ${-yy}`, c, 6)),
            tb(`M${gx - cw * 0.4 + g} -36 L${gx + cw * 0.4} -176`, c, 5),
          ]} />
          {[30, 106, 182].map((yy) => <path key={yy} d={`M${gx - cw * 0.44 + g} ${-yy - 1.6} H${gx + cw * 0.3}`} stroke={light(c, 0.6)} strokeWidth={2}
            strokeLinecap="round" opacity={0.7} />)}
          <Pass ow={ow * 0.8} list={[pc(rr(gx - 22, -224, 44, 30, 8), '#fbf6ea', '#d8cfb8')]} />
          <text x={gx} y={-201} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={24} fill="#2a2440">{i + 1}</text>
        </g>;
      })}
      <Pass ow={ow} list={[pc(rr(-W / 2 - 50, -8, W + 100, 16, 8), `url(#${id}-d)`, dirt)]} />
      {night && Array.from({length: Math.round(40 * dust)}, (_, i) => {
        const q = (t * 0.12 + rnd(seed, i)) % 1;
        return <circle key={i} cx={(rnd(seed, 100 + i) - 0.5) * W * 1.3 + Math.sin(t + i) * 10} cy={-q * 400} r={2.6} fill="#fff1cc"
          opacity={Math.sin(q * Math.PI) * 0.7} />;
      })}
    </g>
  );
};

// ============================================================================ the frottoir

/**
 * THE FROTTOIR, the washboard vest Texas invented, worn flat against the chest on its shoulder hooks.
 * The corrugation runs HORIZONTAL at about a half inch, each rib lit on its upper edge, and a hard
 * specular streak travels across the ribs on `frame`, the cold accent on a warm stage, with the stage's
 * warm light along one edge. When `played`, the two bottle openers scrub down and up across the ribs,
 * throwing a spark of light where they bite. Not a laundry board in a wood frame.
 */
export const FrottoirV2: React.FC<BlackTxPropsV2 & {h?: number; played?: boolean; worn?: boolean}> = (p) => {
  const {frame = 0, seed = 147, wear = 0.4, played = true, worn = true} = p;
  const id = useUid(), ow = owOf(p);
  const zinc = '#b4bfd6';
  const panel = roundPoly([[-18, 0], [-18.8, -33], [-12.8, -44], [-12.4, -56], [-6.6, -56], [-5.4, -47], [0, -42.6], [5.4, -47], [6.6, -56],
    [12.4, -56], [12.8, -44], [18.8, -33], [18, 0]], [4, 6, 9, 2.4, 2.4, 4, 6, 4, 2.4, 2.4, 9, 6, 4]);
  const glint = ((frame / 14) % 1.6) * 52 - 32;
  const scrub = Math.sin(frame / 2.2) * 8;
  return (
    <g transform={at(p)}>
      <defs><Lit id={`${id}-z`} c={zinc} k={0.8} /><Cyl id={`${id}-r`} c={zinc} />
        <clipPath id={`${id}-p`}><path d={panel} /></clipPath>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#ffffff" stopOpacity={0} />
          <stop offset="50%" stopColor="#ffffff" stopOpacity={0.85} /><stop offset="100%" stopColor="#ffffff" stopOpacity={0} /></linearGradient>
        <linearGradient id={`${id}-s`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#ffffff" stopOpacity={0.3} />
          <stop offset="35%" stopColor="#ffffff" stopOpacity={0} /><stop offset="70%" stopColor="#2a2f4a" stopOpacity={0.08} />
          <stop offset="92%" stopColor="#2a2f4a" stopOpacity={0.34} /><stop offset="100%" stopColor="#ff9a4a" stopOpacity={0.3} /></linearGradient></defs>
      <ContactShadow x={0} y={1} w={44} opacity={0.28} />
      <Pass ow={ow} list={[
        pc(panel, `url(#${id}-z)`, zinc),
      ]} />
      <g clipPath={`url(#${id}-p)`}>
        {Array.from({length: 30}, (_, i) => {
          const yy = -56.6 + i * 1.84;
          return <g key={i}>
            <rect x={-20} y={yy} width={40} height={1.3} fill={`url(#${id}-r)`} />
            <rect x={-20} y={yy + 1.25} width={40} height={0.6} fill={shade(zinc, 0.5)} opacity={0.95} />
            <rect x={-20} y={yy + 0.15} width={40} height={0.3} fill="#ffffff" opacity={0.55} />
          </g>;
        })}
        <path d={`M${glint - 6} 0 L${glint + 8} -58 L${glint + 15} -58 L${glint + 1} 0 Z`} fill={`url(#${id}-g)`} />
        <rect x={-20} y={-58} width={40} height={58} fill={`url(#${id}-s)`} />
        {worn && wear > 0.3 && Array.from({length: 5}, (_, i) => <path key={i} d={`M${(rnd(seed, i) - 0.5) * 26} ${-10 - rnd(seed, 20 + i) * 34} l${4 + rnd(seed, 40 + i) * 5} ${-1}`}
          stroke={shade(zinc, 0.3)} strokeWidth={0.6} strokeLinecap="round" opacity={wear} />)}
      </g>
      <path d={rr(-19.4, -4.4, 38.8, 4.4, 2.2)} fill={shade(zinc, 0.2)} stroke={line(zinc)} strokeWidth={ow * 0.5} />
      <path d="M-17.4 -30 Q-16 -38 -12.6 -42" stroke="#ffffff" strokeWidth={1} fill="none" opacity={0.8} strokeLinecap="round" />
      {played && [-1, 1].map((s) => {
        const yy = -25 + s * scrub, fast = Math.abs(Math.cos(frame / 2.2)) > 0.75;
        return <g key={s} transform={`translate(${s * 8} ${yy.toFixed(2)}) rotate(${s * 16})`}>
          <Pass ow={ow * 0.6} list={[pc(`${rr(-1.7, -2, 3.4, 13, 1.7)} ${ell(0, -3.4, 3, 3)}`, '#8e99b6', '#8e99b6')]} />
          <circle cx={0} cy={-3.4} r={1.5} fill={shade(zinc, 0.4)} />
          <path d="M-0.8 0 V9" stroke="#ffffff" strokeWidth={0.7} strokeLinecap="round" opacity={0.8} />
          {fast && <path d="M0 -8.6 l0.7 1.8 1.8 0.7 -1.8 0.7 -0.7 1.8 -0.7 -1.8 -1.8 -0.7 1.8 -0.7 Z" fill="#fff6c8" transform="translate(0 0) scale(1.4)" />}
        </g>;
      })}
    </g>
  );
};

// ============================================================================ the shotgun house

const PAINTS = ['#f4e3b8', '#a9dcc6', '#b4cdf0', '#f4c0b0', '#f6d77e'];
const ACCENT = ['#2f5f8a', '#c2453a', '#3f7a52', '#6a3fa0', '#2f6fa8'];

/** one shotgun house, gable to the street, 12 feet wide, raised on piers, in its own centimetres */
const OneShotgun: React.FC<{frame: number; ow: number; paint: string; accent: string; night: boolean; camelback: boolean; seed: number}> = ({
  frame, ow, paint, accent, night, camelback, seed,
}) => {
  const id = useUid(), t = frame / 30;
  const W = 370, hw = W / 2, lift = 60, eave = -340, ridge = -520;
  const roof = '#8a5a52', trim = '#fbf6ea', glass = night ? '#ffd88a' : '#4c5f8e';
  const rock = Math.sin(t * 2 * Math.PI / 2.8 + seed) * 5;
  const sway = Math.sin(t * 2 * Math.PI / 3.4 + seed) * 4;
  return (
    <g>
      <defs><Lit id={`${id}-p`} c={paint} k={0.7} /><Lit id={`${id}-r`} c={roof} /><Lit id={`${id}-a`} c={accent} />
        <clipPath id={`${id}-c`}><path d={rr(-hw, eave, W, -eave - lift, 8)} /></clipPath></defs>
      {camelback && <Pass ow={ow} list={[
        pc(rr(hw * 0.05, -640, W * 0.46, 320, 8), shade(paint, 0.12), paint),
        pc(roundPoly([[hw * 0.0, -630], [hw * 0.51, -720], [hw * 1.02, -630]], [8, 12, 8]), shade(roof, 0.1), roof),
      ]} />}
      {/* the piers and the dark crawlspace under the raised floor */}
      <path d={rr(-hw + 10, -lift, W - 20, lift, 6)} fill="#2e2a44" opacity={0.75} />
      <Pass ow={ow} list={[-0.4, 0, 0.4].map((f) => pc(rr(f * W - 14, -lift, 28, lift, 5), '#b8603e', '#b8603e'))} />
      {/* the body and the gable face, one shape */}
      <Pass ow={ow} list={[pc(`${rr(-hw, eave, W, -eave - lift, 8)}`, `url(#${id}-p)`, paint),
        pc(roundPoly([[-hw, eave + 6], [0, ridge + 24], [hw, eave + 6]], [4, 10, 4]), `url(#${id}-p)`, paint)]} />
      <g clipPath={`url(#${id}-c)`}>
        {Array.from({length: 16}, (_, i) => <path key={i} d={`M${-hw} ${eave + 14 + i * 18} H${hw}`} stroke={shade(paint, 0.18)} strokeWidth={2}
          opacity={0.6} />)}
      </g>
      {/* THE GABLE FACES THE STREET, the rake trim over the roof's edge, and the sawn bracket in the peak */}
      <Pass ow={ow} list={[tb(`M${-hw * 1.16} ${eave + 14} L0 ${ridge} L${hw * 1.16} ${eave + 14}`, roof, 30)]} />
      <path d={`M${-hw * 1.1} ${eave + 10} L0 ${ridge + 6} L${hw * 1.1} ${eave + 10}`} stroke={trim} strokeWidth={10} fill="none" strokeLinecap="round"
        strokeLinejoin="round" />
      <path d={`M${-hw * 0.9} ${eave + 2} L${-hw * 0.2} ${ridge + 70}`} stroke="#ffffff" strokeWidth={6} opacity={0.35} strokeLinecap="round" />
      <path d={roundPoly([[0, -462], [22, -432], [0, -402], [-22, -432]], 6)} fill={`url(#${id}-a)`} stroke={line(accent)} strokeWidth={ow * 0.7} />
      {[-1, 1].map((s) => <path key={s} d={`M${s * 6} -432 H${s * 18}`} stroke={trim} strokeWidth={3} strokeLinecap="round" />)}
      {/* the door and its transom, and the tall two-over-two window with shutters */}
      <Pass ow={ow} list={[pc(rr(-hw * 0.62, -256, 74, 196, 8), `url(#${id}-a)`, accent)]} />
      <path d={rr(-hw * 0.62 + 10, -244, 54, 24, 6)} fill={glass} />
      {[0, 1].map((r) => <path key={r} d={rr(-hw * 0.62 + 12, -212 + r * 72, 50, 58, 6)} fill={shade(accent, 0.15)} />)}
      <circle cx={-hw * 0.62 + 62} cy={-150} r={4} fill="#f2c14a" />
      <Pass ow={ow} list={[pc(rr(hw * 0.1, -270, 82, 168, 8), glass, '#4c5f8e'),
        pc(rr(hw * 0.1 - 34, -270, 28, 168, 6), `url(#${id}-a)`, accent), pc(rr(hw * 0.1 + 88, -270, 28, 168, 6), `url(#${id}-a)`, accent)]} />
      <path d={`M${hw * 0.1 + 41} -270 V-102 M${hw * 0.1} -186 H${hw * 0.1 + 82}`} stroke={trim} strokeWidth={6} />
      {!night && <path d={`M${hw * 0.1 + 6} -264 Q${hw * 0.1 + 20 + sway} -200 ${hw * 0.1 + 10} -108 L${hw * 0.1 + 4} -108 L${hw * 0.1 + 4} -264 Z`}
        fill="#fbf6ea" opacity={0.85} />}
      <path d={`M${hw * 0.1 + 8} -262 L${hw * 0.1 + 30} -200`} stroke="#ffffff" strokeWidth={5} opacity={night ? 0.2 : 0.45} strokeLinecap="round" />
      {/* the shallow porch on its two slender posts, the steps, a rocking chair and a hanging fern */}
      <Pass ow={ow} list={[
        pc(rr(-hw - 8, -66, W + 16, 14, 6), '#b08a62', '#b08a62'),
        ...[-1, 1].map((s) => tb(`M${s * hw * 0.86} -64 L${s * hw * 0.86} -268`, trim, 9)),
        pc(rr(-hw * 1.08, -290, W * 1.08, 22, 10), `url(#${id}-r)`, roof),
      ]} />
      <path d={rr(-hw * 1.08, -272, W * 1.08, 8, 4)} fill={trim} />
      {Array.from({length: 3}, (_, k) => <path key={k} d={rr(-hw * 0.66 - k * 8, -60 + k * 20, 90 + k * 16, 20, 5)} fill={light('#b08a62', 0.1 + k * 0.05)}
        stroke={line('#b08a62')} strokeWidth={ow * 0.7} />)}
      <g transform={`translate(${hw * 0.62} -66) rotate(${rock.toFixed(2)} 0 0)`}>
        <Pass ow={ow * 0.7} list={[tb('M-26 0 Q0 8 26 0', '#7a4a2a', 5), tb('M-14 -2 L-18 -88 M14 -2 L16 -40 M-18 -40 L18 -40 M-18 -64 L-12 -64', '#7a4a2a', 5)]} />
      </g>
      <g transform={`translate(${-hw * 0.94} -268) rotate(${sway})`}>
        <path d="M0 0 V24 M-12 24 L0 4 L12 24" stroke="#5a5a72" strokeWidth={2} fill="none" />
        <path d={rr(-14, 22, 28, 18, 8)} fill="#b8603e" stroke={line('#b8603e')} strokeWidth={ow * 0.6} />
        {Array.from({length: 9}, (_, k) => <path key={k} d={taper([[0, 26], [(k - 4) * 6, 30 + Math.abs(k - 4) * 2], [(k - 4) * 10, 44 + Math.abs(k - 4) * 4]], 9, 3)}
          fill={k % 2 ? '#3f9a52' : '#5ab866'} stroke={line('#3f9a52')} strokeWidth={ow * 0.5} />)}
      </g>
      {night && <Glow x={-hw * 0.7} y={-262} r={90} color="#ffd88a" opacity={0.55 + Math.sin(frame * 0.9) * 0.05} />}
      {night && <circle cx={-hw * 0.7} cy={-262} r={7} fill="#fff4c8" />}
    </g>
  );
};

/**
 * THE SHOTGUN HOUSE, gable to the street, front and rear doors aligned, raised on piers, a shallow porch
 * on two slender posts with three steps down, and THE BRICK STREET in front of it, which is not paving
 * but a receipt, laid by the residents of Freedmen's Town themselves. The bricks are worn convex, in the
 * oranges and red-browns of several makers. `row` steps identical gables down a block in a run of
 * colours. A rocking chair rocks on the porch and a fern sways, and `night` lights the windows and the
 * porch lamp. `camelback` raises a second storey at the rear only.
 */
export const ShotgunHouseV2: React.FC<BlackTxPropsV2 & {h?: number; row?: number; camelback?: boolean; bricks?: boolean; colour?: string}> = (p) => {
  const {frame = 0, seed = 148, night = false, row = 1, camelback = false, bricks = true, colour = '#f4e3b8'} = p;
  const id = useUid(), ow = owOf(p);
  const pitch = 430, total = row * pitch + 120;
  const BRICK = ['#c2643e', '#a8523a', '#d07a4a', '#9a4a34', '#b8603e', '#c97048'];
  return (
    <g transform={at(p)}>
      <defs><linearGradient id={`${id}-b`} x1="0" y1="0" x2="0.3" y2="1"><stop offset="0%" stopColor="#ffffff" stopOpacity={0.35} />
        <stop offset="60%" stopColor="#ffffff" stopOpacity={0} /></linearGradient>
        <clipPath id={`${id}-s`}><path d={rr(-total / 2, 6, total, 74, 10)} /></clipPath></defs>
      <ContactShadow x={0} y={4} w={total * 1.05} opacity={0.3} />
      {Array.from({length: row}, (_, i) => {
        const ox = (i - (row - 1) / 2) * pitch;
        return <g key={i} transform={`translate(${ox} ${i * 10})`}>
          <OneShotgun frame={frame} ow={ow} paint={row > 1 ? PAINTS[(i + seed) % PAINTS.length] : colour} accent={ACCENT[(i + seed) % ACCENT.length]}
            night={night} camelback={camelback && i === 0} seed={seed + i} />
        </g>;
      })}
      {bricks && <g>
        <Pass ow={ow} list={[pc(rr(-total / 2, 6, total, 74, 10), '#8a4434', '#8a4434')]} />
        <g clipPath={`url(#${id}-s)`}>
          {Array.from({length: 7}, (_, r) => Array.from({length: Math.ceil(total / 24) + 2}, (_, c) => {
            const bx = -total / 2 + c * 24 - (r % 2 ? 12 : 0), by = 8 + r * 10.4;
            const col = BRICK[Math.floor(rnd(seed, r * 97 + c) * BRICK.length)];
            return <g key={`${r}-${c}`}>
              <path d={rr(bx + 1, by + 0.8, 22, 9, 3.4)} fill={col} />
              <path d={rr(bx + 1, by + 0.8, 22, 9, 3.4)} fill={`url(#${id}-b)`} />
            </g>;
          }))}
        </g>
      </g>}
    </g>
  );
};

// ============================================================================ the band

/** the shako, braid and plume over a Figure's head and chest, in the rig's own units */
const Uniform: React.FC<{frame: number; seed: number; uni: string; braid: string; plume: number; tall?: number}> = ({frame, seed, uni, braid, plume, tall = 1}) => {
  const b = figBob(frame, seed), hy = -420 + b, tt = -350 + b * 0.6;
  const sw = Math.sin(frame / 5 + seed) * 6;
  return (
    <g>
      {[0, 1, 2].map((k) => <path key={k} d={`M-52 ${tt + 44 + k * 24} Q0 ${tt + 60 + k * 24} 52 ${tt + 44 + k * 24}`} stroke={braid} strokeWidth={9}
        fill="none" strokeLinecap="round" />)}
      <path d={rr(-58, hy - 70 - 110 * tall, 116, 120 * tall, 26)} fill={uni} stroke={line(uni)} strokeWidth={7} />
      <path d={rr(-60, hy - 82, 120, 24, 12)} fill={braid} stroke={line(braid)} strokeWidth={6} />
      <path d={`M-62 ${hy - 62} Q0 ${hy - 40} 62 ${hy - 62}`} stroke="#2a2440" strokeWidth={14} fill="none" strokeLinecap="round" />
      <circle cx={0} cy={hy - 120 * tall} r={14} fill={braid} stroke={line(braid)} strokeWidth={5} />
      <path d={`M0 ${hy - 70 - 110 * tall} C${sw - 26} ${hy - 150 - 130 * tall} ${sw + 30} ${hy - 170 - plume} ${sw * 1.6} ${hy - 190 - plume * 1.4}
        C${sw + 40} ${hy - 150 - plume} ${24} ${hy - 110 - 120 * tall} 0 ${hy - 70 - 110 * tall} Z`} fill="#fbf6ea" stroke={line('#e9e0cc')} strokeWidth={6} />
      <path d={`M-30 ${hy - 70 - 104 * tall} L-30 ${hy - 90}`} stroke="#ffffff" strokeWidth={8} opacity={0.35} strokeLinecap="round" />
    </g>
  );
};

/** a horn held at the hands, raised to the band's one shared angle */
const Horn: React.FC<{up: number}> = ({up}) => (
  <g transform={`rotate(${-20 - up * 22})`}>
    <path d={rr(-30, -10, 150, 20, 10)} fill="#f2c14a" stroke={line('#f2c14a')} strokeWidth={6} />
    <path d="M110 -12 Q150 -40 170 -46 L170 46 Q150 40 110 12 Z" fill="#f6cf5a" stroke={line('#f2c14a')} strokeWidth={6} strokeLinejoin="round" />
    <ellipse cx={170} cy={0} rx={10} ry={46} fill="#d99a2a" stroke={line('#f2c14a')} strokeWidth={5} />
    <path d="M-20 -4 H100" stroke="#fff4c8" strokeWidth={5} strokeLinecap="round" opacity={0.8} />
  </g>
);

/**
 * THE MARCHING BAND, HBCU style, a distinct discipline. Ranks of bandsmen in military-cut jackets with
 * heavy braid and tall shakos with plumes, horns all snapping to one hard angle on the same beat, the
 * sousaphones in the back rank with their bells the biggest circles in the frame, the drum major out
 * front with a high strut, leaning back with the mace up, and the dance line in front in the costume
 * colour, the saturation spike, sequins catching the light. `colours` is [uniform, braid] and names no
 * school. `spread` is the front rank's width in centimetres.
 */
export const HBCUBandV2: React.FC<BlackTxPropsV2 & {h?: number; ranks?: number; files?: number; spread?: number; colours?: [string, string];
  drumMajor?: boolean; danceLine?: number}> = (p) => {
  const {frame = 0, seed = 149, ranks = 4, files = 10, spread = 760, colours = ['#5a2f9a', '#f2c14a'], drumMajor = true, danceLine = 5} = p;
  const [uni, braid] = colours;
  const k0 = 170 / FIG, t = frame / 30;
  const beat = Math.floor(frame / 15) % 2;
  const up = beat ? 1 : 0;
  const people: React.ReactNode[] = [];
  for (let r = ranks - 1; r >= 0; r--) {
    const rk = 1 - r * 0.06;
    for (let f = 0; f < files; f++) {
      const i = r * files + f, uu = files > 1 ? f / (files - 1) - 0.5 : 0;
      const bx = uu * spread * (1 - r * 0.05), by = -r * 52;
      const lift = Math.max(0, Math.sin(t * 2 * Math.PI * 1.1 + f * 0.5 + r)) * 10;
      const sousa = r === ranks - 1 && f % 3 === 0;
      const sd = seed + i;
      people.push(<g key={i} transform={`translate(${bx.toFixed(1)} ${(by - lift).toFixed(1)}) scale(${(k0 * rk).toFixed(4)})`}>
        {sousa && <circle cx={0} cy={-260} r={150} fill="none" stroke={line('#f2c14a')} strokeWidth={60} />}
        {sousa && <circle cx={0} cy={-260} r={150} fill="none" stroke="#f2c14a" strokeWidth={46} />}
        <Figure frame={frame} x={0} y={0} pose={sousa ? 'stand' : 'hold'} emotion={f % 4 === 1 ? 'determined' : 'proud'} skin={SKINS[(i + seed) % SKINS.length]}
          hair="short" hairColor="#1c1512" top="tee" shirt={uni} pants={uni} seed={sd} walk={t + f * 0.04} build={0.45 + (i % 3) * 0.1}
          holding={sousa ? undefined : <Horn up={up} />} />
        <Uniform frame={frame} seed={sd} uni={uni} braid={braid} plume={20} />
        {sousa && <g transform="translate(-150 -560)">
          <path d="M120 230 Q60 140 40 60" stroke={line('#f2c14a')} strokeWidth={66} fill="none" strokeLinecap="round" />
          <path d="M120 230 Q60 140 40 60" stroke="#f2c14a" strokeWidth={52} fill="none" strokeLinecap="round" />
          <circle cx={40} cy={10} r={140} fill={line('#f2c14a')} />
          <circle cx={40} cy={10} r={133} fill="#f6cf5a" />
          <circle cx={40} cy={10} r={100} fill="#d99a2a" />
          <circle cx={40} cy={10} r={60} fill="#a86a1a" />
          <path d="M-60 -50 A120 120 0 0 1 20 -112" stroke="#fff4c8" strokeWidth={18} fill="none" strokeLinecap="round" opacity={0.8} />
        </g>}
      </g>);
    }
  }
  const dances = Array.from({length: danceLine}, (_, i) => {
    const fx = (danceLine > 1 ? i / (danceLine - 1) - 0.5 : 0) * spread * 0.7;
    const hop = Math.abs(Math.sin(t * 2 * Math.PI * 1.1 + i)) * 14;
    const sd = seed + 300 + i;
    return <g key={i} transform={`translate(${fx.toFixed(1)} ${(70 - hop).toFixed(1)}) scale(${(k0 * 1.02).toFixed(4)})`}>
      <Figure frame={frame} x={0} y={0} pose={(Math.floor(frame / 15) + i) % 2 ? 'cheer' : 'hips'} emotion="excited" skin={SKINS[(i + 2) % SKINS.length]}
        hair={(['long', 'bun', 'curly', 'afro', 'long'] as FigureHair[])[i % 5]} hairColor="#1c1512" top="tee" shirt={braid} pants={braid} seed={sd}
        build={0.3} />
      {Array.from({length: 9}, (_, k) => {
        const tw = Math.sin(frame / 3 + k * 1.9 + i);
        return <circle key={k} cx={(rnd(sd, k) - 0.5) * 140} cy={-330 + rnd(sd, 20 + k) * 190} r={6 + Math.max(0, tw) * 6} fill="#ffffff"
          opacity={0.5 + tw * 0.4} />;
      })}
    </g>;
  });
  const lean = -10 + Math.sin(t * 2 * Math.PI * 0.55) * 6;
  const hr = figureHands('raise').r;
  return (
    <g transform={at(p)}>
      <ContactShadow x={0} y={4} w={spread * 1.15} opacity={0.24} />
      {people}
      {dances}
      {drumMajor && <g transform={`translate(${-spread * 0.04} 140) rotate(${lean.toFixed(2)}) scale(${(k0 * 1.12).toFixed(4)})`}>
        <Figure frame={frame} x={0} y={0} pose="raise" emotion="proud" skin={SKINS[1]} hair="short" hairColor="#1c1512" top="tee" shirt={uni} pants="#fbf6ea"
          seed={seed + 99} walk={t} build={0.5} turn={-0.3} />
        <Uniform frame={frame} seed={seed + 99} uni={uni} braid={braid} plume={110} tall={1.3} />
        <g transform={`translate(${hr.x} ${hr.y}) rotate(${Math.sin(t * 4) * 18})`}>
          <path d="M0 40 L0 -230" stroke={line('#e9e0cc')} strokeWidth={26} strokeLinecap="round" />
          <path d="M0 40 L0 -230" stroke="#fbf6ea" strokeWidth={14} strokeLinecap="round" />
          <circle cx={0} cy={-250} r={36} fill={braid} stroke={line(braid)} strokeWidth={7} />
          <circle cx={-10} cy={-262} r={10} fill="#ffffff" opacity={0.7} />
        </g>
      </g>}
    </g>
  );
};

// ============================================================================ emancipation park

/**
 * THE EMANCIPATION PARK PLAN, ten acres bought in 1872 by formerly enslaved people so there would be a
 * place to hold Juneteenth. The 1870s plan is THE RING AND THE DOT, a race track round the perimeter and
 * an open air pavilion in the centre, hung with bunting that moves on `frame`, with wagons at the edge,
 * live oaks giving the heavy canopy and the crowd gathered on the worn grass. `era` 1940 moves it to the
 * mid-century park, a low brick recreation building and a fenced pool whose water ripples. Screen units,
 * as the library's.
 */
export const EmancipationParkV2: React.FC<BlackTxPropsV2 & {h?: number; w?: number; era?: 1870 | 1940; crowd?: number}> = (p) => {
  const {x = 0, y = 0, scale = 1, frame = 0, seed = 150, h = 120, w = 900, era = 1870, crowd = 0.6} = p;
  const id = useUid(), ow = 3.4 / scale, t = frame / 30;
  const grass = '#7fb04e', track = '#d9a86a', wood = '#b07a4a', roofC = '#c2453a', oak = '#3f7a3a';
  const people = Math.round(46 * crowd);
  const crowdAt = (i: number): Pt => {
    const a = rnd(seed, 200 + i) * Math.PI * 2, rr2 = 0.18 + rnd(seed, 300 + i) * 0.52;
    return [Math.cos(a) * w * 0.4 * rr2, Math.sin(a) * h * 0.85 * rr2 + h * 0.1];
  };
  const crowdList = Array.from({length: people}, (_, i) => ({i, p: crowdAt(i)})).sort((a, b) => a.p[1] - b.p[1]);
  const pavilion = (
    <g transform={`translate(0 ${h * 0.12})`}>
      <ContactShadow x={0} y={4} w={w * 0.22} opacity={0.3} />
      <Pass ow={ow} list={[
        ...[-0.09, -0.03, 0.03, 0.09].map((f) => tb(`M${f * w} 0 L${f * w} ${-h * 0.62}`, wood, 6)),
        pc(roundPoly([[-w * 0.12, -h * 0.6], [0, -h * 1.04], [w * 0.12, -h * 0.6]], [8, 10, 8]), `url(#${id}-r)`, roofC),
        pc(rr(-w * 0.125, -h * 0.66, w * 0.25, h * 0.08, 6), `url(#${id}-w)`, wood),
      ]} />
      <path d={`M${-w * 0.08} ${-h * 0.66} L${-w * 0.02} ${-h * 0.95}`} stroke="#ffffff" strokeWidth={4} opacity={0.4} strokeLinecap="round" />
      {Array.from({length: 9}, (_, k) => {
        const bx = -w * 0.11 + k * w * 0.0275, dip = Math.sin(t * 2 + k) * 1.5;
        return <path key={k} d={`M${bx - w * 0.012} ${-h * 0.58} L${bx + w * 0.012} ${-h * 0.58} L${bx} ${-h * 0.5 + dip} Z`}
          fill={['#d22a3a', '#fbf6ea', '#22408f'][k % 3]} stroke={line(['#d22a3a', '#fbf6ea', '#22408f'][k % 3])} strokeWidth={1.4} />;
      })}
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs><Rad id={`${id}-g`} c={grass} k={0.7} /><Lit id={`${id}-w`} c={wood} /><Lit id={`${id}-r`} c={roofC} />
        <Lit id={`${id}-b`} c="#c47a52" /><Lit id={`${id}-pool`} c="#4fb8e0" x2={0.2} /></defs>
      <ContactShadow x={0} y={h * 1.1} w={w * 1.1} opacity={0.2} />
      <Pass ow={ow} list={[pc(ell(0, 0, w * 0.54, h * 1.06), `url(#${id}-g)`, grass)]} />
      {Array.from({length: 12}, (_, i) => <ellipse key={i} cx={(rnd(seed, i) - 0.5) * w * 0.8} cy={(rnd(seed, 20 + i) - 0.5) * h * 1.4}
        rx={w * (0.03 + rnd(seed, 40 + i) * 0.05)} ry={h * 0.08} fill="#c9b07a" opacity={0.45} />)}
      {era === 1870 ? <g>
        {/* THE RING AND THE DOT. The whole argument in a plan. */}
        <ellipse cx={0} cy={0} rx={w * 0.46} ry={h * 0.9} fill="none" stroke={line(track)} strokeWidth={h * 0.13 + ow * 2} />
        <ellipse cx={0} cy={0} rx={w * 0.46} ry={h * 0.9} fill="none" stroke={track} strokeWidth={h * 0.13} />
        <ellipse cx={-w * 0.01} cy={-h * 0.02} rx={w * 0.455} ry={h * 0.88} fill="none" stroke="#f4d4a0" strokeWidth={3} opacity={0.7} />
        {Array.from({length: 26}, (_, i) => {
          const a = (i / 26) * Math.PI * 2;
          return <path key={i} d={`M${Math.cos(a) * w * 0.405} ${Math.sin(a) * h * 0.79} v${-h * 0.06}`} stroke="#fbf6ea" strokeWidth={2.4}
            strokeLinecap="round" />;
        })}
        {/* wagons at the edge of the ground */}
        {Array.from({length: 4}, (_, i) => <g key={i} transform={`translate(${(i - 1.5) * w * 0.2} ${h * 1.0})`}>
          <Pass ow={ow * 0.7} list={[pc(rr(-h * 0.26, -h * 0.24, h * 0.52, h * 0.14, 5), `url(#${id}-w)`, wood),
            tb(`M${h * 0.26} ${-h * 0.14} L${h * 0.46} ${-h * 0.1}`, wood, 3)]} />
          {[-1, 1].map((s) => <circle key={s} cx={s * h * 0.17} cy={-h * 0.07} r={h * 0.07} fill="#4a3828" stroke={line('#4a3828')} strokeWidth={ow * 0.5} />)}
        </g>)}
      </g> : <g>
        {/* the 1930s layer, the recreation building, the pool and its chain link, the bathhouse */}
        <Pass ow={ow} list={[pc(rr(-w * 0.36, -h * 0.72, w * 0.3, h * 0.66, 8), `url(#${id}-b)`, '#c47a52'),
          pc(rr(-w * 0.38, -h * 0.8, w * 0.34, h * 0.1, 6), '#8a4a3a', '#8a4a3a'),
          pc(rr(w * 0.04, -h * 0.2, w * 0.36, h * 0.48, 10), '#e4ddd0', '#c9c2b6')]} />
        {Array.from({length: 5}, (_, i) => <path key={i} d={rr(-w * 0.34 + i * w * 0.055, -h * 0.5, w * 0.035, h * 0.2, 4)} fill="#4c5f8e" />)}
        <path d={rr(w * 0.065, -h * 0.13, w * 0.31, h * 0.34, 8)} fill={`url(#${id}-pool)`} />
        {Array.from({length: 4}, (_, i) => <path key={i} d={`M${w * 0.08 + i * w * 0.07} ${-h * 0.02 + Math.sin(t * 2 + i) * 3} q${w * 0.02} ${-4} ${w * 0.04} 0`}
          stroke="#ffffff" strokeWidth={2.4} fill="none" opacity={0.7} strokeLinecap="round" />)}
        {Array.from({length: 18}, (_, i) => <path key={i} d={`M${w * (0.03 + i * 0.022)} ${-h * 0.24} V${-h * 0.04}`} stroke="#9aa3bd" strokeWidth={1.8} opacity={0.8} />)}
        <path d={`M${w * 0.03} ${-h * 0.22} H${w * 0.41}`} stroke="#9aa3bd" strokeWidth={2.4} />
      </g>}
      {crowdList.filter((c) => c.p[1] < h * 0.12).map(({i, p: cp}) => <CrowdPerson key={i} frame={frame} i={i} seed={seed} x={cp[0]} y={cp[1]} h={h} />)}
      {era === 1870 && pavilion}
      {crowdList.filter((c) => c.p[1] >= h * 0.12).map(({i, p: cp}) => <CrowdPerson key={i} frame={frame} i={i} seed={seed} x={cp[0]} y={cp[1]} h={h} />)}
      {/* the live oaks along the back of the ground, the heavy dark canopy */}
      {Array.from({length: 5}, (_, i) => {
        const tx = (i - 2) * w * 0.22 + (rnd(seed, 60 + i) - 0.5) * w * 0.06, ty = -h * (0.92 - Math.abs(i - 2) * 0.08), r = h * (0.5 + rnd(seed, 70 + i) * 0.14);
        const sway = Math.sin(t * 1.1 + i) * 2;
        return <g key={i} transform={`translate(${tx.toFixed(1)} ${ty.toFixed(1)})`}>
          <ContactShadow x={0} y={2} w={r * 2} opacity={0.3} />
          <Pass ow={ow} list={[tb(`M0 0 L0 ${-r * 0.5}`, '#5a3e2c', r * 0.16)]} />
          <g transform={`translate(${sway} 0)`}>
            {[[-0.55, -0.62, 0.5], [0, -0.85, 0.6], [0.55, -0.6, 0.5], [0, -0.5, 0.55]].map(([lx, ly, lr], k) =>
              <circle key={`o${k}`} cx={lx * r} cy={ly * r} r={lr * r + ow} fill={line(oak)} />)}
            {[[-0.55, -0.62, 0.5], [0, -0.85, 0.6], [0.55, -0.6, 0.5], [0, -0.5, 0.55]].map(([lx, ly, lr], k) =>
              <circle key={k} cx={lx * r} cy={ly * r} r={lr * r} fill={k === 1 ? light(oak, 0.12) : oak} />)}
            <ellipse cx={-r * 0.2} cy={-r * 1.12} rx={r * 0.28} ry={r * 0.12} fill={light(oak, 0.6)} opacity={0.45} />
          </g>
        </g>;
      })}
    </g>
  );
};
const CrowdPerson: React.FC<{frame: number; i: number; seed: number; x: number; y: number; h: number}> = ({frame, i, seed, x, y, h}) => {
  const k = (h * 0.22 / FIG) * (0.85 + (y + h) / (h * 4));
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${k.toFixed(4)})`}>
      <Figure frame={frame} x={0} y={0} pose={i % 7 === 2 ? 'wave' : i % 9 === 4 ? 'cheer' : 'stand'} emotion="happy" skin={SKINS[(i + seed) % SKINS.length]}
        hair={HAIRS[i % HAIRS.length]} hairColor="#1c1512" hat={i % 5 === 1 ? 'straw' : 'none'} top="tee"
        shirt={['#fbf6ea', '#d22a3a', '#2f5fc4', '#f2b33d', '#3f9a52'][i % 5]} pants="#33476b" seed={seed + i} />
    </g>
  );
};

// ============================================================================ the red drink

/**
 * THE RED DRINK, a meaning rather than a theme colour. `kind` picks the contour bottle with its crown
 * cap and a plain label band (no brand), a cup of it over pellet ice, or a pitcher with ice and the
 * deeper crimson of a hibiscus drink. The red is translucent and GLOWS when backlit, beads of cold run
 * down the glass, and bubbles rise through it on `frame`.
 */
export const RedDrinkV2: React.FC<BlackTxPropsV2 & {h?: number; kind?: 'bottle' | 'cup' | 'pitcher'; ice?: boolean}> = (p) => {
  const {frame = 0, seed = 151, kind = 'bottle', ice = true} = p;
  const id = useUid(), ow = owOf(p);
  const red = kind === 'pitcher' ? '#c0183a' : '#e8204a';
  const bubbles = (x0: number, x1: number, y0: number, y1: number) => Array.from({length: 7}, (_, i) => {
    const q = ((frame / 30) * 0.5 + rnd(seed, i)) % 1;
    return <circle key={i} cx={x0 + rnd(seed, 10 + i) * (x1 - x0) + Math.sin(q * 8 + i) * 0.3} cy={y0 + (y1 - y0) * q} r={0.35 + rnd(seed, 20 + i) * 0.4}
      fill="#ffd0dc" opacity={(1 - q) * 0.8} />;
  });
  const beads = (x0: number, x1: number, y0: number, y1: number) => Array.from({length: 6}, (_, i) =>
    <ellipse key={i} cx={x0 + rnd(seed, 40 + i) * (x1 - x0)} cy={y0 + rnd(seed, 50 + i) * (y1 - y0)} rx={0.45} ry={0.65} fill="#ffffff" opacity={0.7} />);
  return (
    <g transform={at(p)}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={shade(red, 0.35)} /><stop offset="30%" stopColor={red} />
          <stop offset="55%" stopColor={light(red, 0.35)} /><stop offset="100%" stopColor={shade(red, 0.45)} /></linearGradient>
        <Lit id={`${id}-c`} c="#f6f2ea" x2={0.6} k={0.6} />
      </defs>
      <Glow x={0} y={-11} r={16} color="#ff5a7a" opacity={0.35} />
      <ContactShadow x={0} y={0.4} w={kind === 'pitcher' ? 22 : 13} opacity={0.32} />
      {kind === 'bottle' && <g>
        <Pass ow={ow} list={[
          pc(`M-3.7 0 Q-4.1 0 -4.1 -0.6 L-4.1 -11.4 Q-3.4 -13.4 -3.6 -15.2 Q-3.9 -17.6 -1.9 -19.2 L-1.8 -21.4 L1.8 -21.4 L1.9 -19.2
            Q3.9 -17.6 3.6 -15.2 Q3.4 -13.4 4.1 -11.4 L4.1 -0.6 Q4.1 0 3.7 0 Z`, `url(#${id}-g)`, red),
          pc(rr(-2.1, -22.6, 4.2, 1.6, 0.6), '#d9dde8', '#d9dde8'),
        ]} />
        {bubbles(-2.6, 2.6, -1, -17)}
        <path d={rr(-4.1, -10.2, 8.2, 5.4, 0.6)} fill="#f6f2ea" />
        <path d={rr(-3.4, -8.8, 6.8, 2, 1)} fill="#d22a3a" />
        <path d="M-2.4 -2 Q-2.8 -10 -1.4 -18.6" stroke="#ffffff" strokeWidth={0.9} fill="none" opacity={0.6} strokeLinecap="round" />
        {Array.from({length: 6}, (_, i) => <path key={i} d={`M${-2.1 + i * 0.84} -22.6 v-0.5`} stroke="#9aa3bd" strokeWidth={0.4} />)}
        {beads(-3.4, 3.2, -16, -1)}
      </g>}
      {kind === 'cup' && <g>
        <Pass ow={ow} list={[pc('M-3.4 0 L-4.4 -18 L4.4 -18 L3.4 0 Z', `url(#${id}-c)`, '#e9e4d8')]} />
        <path d="M-3.5 -2.2 L-4.25 -16.4 L4.25 -16.4 L3.5 -2.2 Z" fill={`url(#${id}-g)`} opacity={0.92} />
        {ice && Array.from({length: 9}, (_, i) => <circle key={i} cx={-3.4 + (i % 5) * 1.7} cy={-16.6 - Math.floor(i / 5) * 0.9 + rnd(seed, i) * 0.5} r={0.9}
          fill="#ffd6e0" stroke={line('#ffd6e0')} strokeWidth={ow * 0.3} />)}
        {bubbles(-3, 3, -3, -15)}
        <path d="M-3.2 -3 L-3.9 -15.6" stroke="#ffffff" strokeWidth={0.8} opacity={0.55} strokeLinecap="round" />
        {beads(-3.6, 3.4, -15, -2)}
      </g>}
      {kind === 'pitcher' && <g>
        <Pass ow={ow} list={[tb('M6.4 -16 Q11 -14.4 10.4 -9 Q10 -5 6 -4', '#e4eef6', 1.6),
          pc('M-6.4 0 Q-7 0 -7 -0.8 L-7.6 -18.4 L5.8 -18.4 L7.4 -19.6 L6.8 -0.8 Q6.8 0 6.2 0 Z', '#e4eef6', '#cfe0ee')]} />
        <path d="M-6.5 -1 L-7.1 -15.4 L6.5 -15.4 L6.3 -1 Z" fill={`url(#${id}-g)`} opacity={0.9} />
        {ice && Array.from({length: 4}, (_, i) => <path key={i} d={rr(-5.6 + i * 2.8, -15.6 + (i % 2) * 2.2, 2.2, 2.2, 0.5)} fill="#ffe0e8" opacity={0.75}
          transform={`rotate(${(i - 1.5) * 12} ${-4.5 + i * 2.8} ${-14.5 + (i % 2) * 2.2})`} />)}
        {bubbles(-5, 5, -2, -14)}
        <path d="M-5.6 -2 L-6 -16.6" stroke="#ffffff" strokeWidth={1} opacity={0.6} strokeLinecap="round" />
        {beads(-6, 5.6, -14, -2)}
      </g>}
    </g>
  );
};

export const BLACKTEXAS_V2 = ['BarbecuePitV2', 'ChurchFanV2', 'FanFieldV2', 'SanctuaryV2', 'TrailRideColumnV2', 'BuckingChuteV2', 'FrottoirV2',
  'ShotgunHouseV2', 'HBCUBandV2', 'EmancipationParkV2', 'RedDrinkV2'] as const;
