import React from 'react';
import {FONT} from '../../lib/type';
import {light, line, mix, shade} from '../color';
import {ContactShadow, Glow, clamp01, ease, easeOutBack, useUid} from '../Kit';

/**
 * MAGNETS, LOOK V2 (November 14th, 2026).
 *
 * The materials hunt from lib/magnets.tsx, redrawn in the v2 idiom. A permanent magnet motor, the AI
 * candidate lattice, the synthesis bench, the measuring chamber, the grant, the path to market, the
 * lab window and bench, the supply chain, the compound to synthesis recipe and the candidate specimen.
 *
 * The library's rule holds. These are editorial close-ups, not dimensioned replicas, and no drawing
 * shows a measured value. The measuring chart still holds a question mark and nothing else. Where a
 * glow is added it says something true. The motor's field arcs run from each north pole through the
 * rotor to the neighbouring south pole, the furnace window glows because it heats, and the crystal
 * glows only when it is the thing being found.
 *
 * Two fixes on the way. The library rotor reached over its own magnets, so here it turns inside them
 * with an air gap. The library furnace and beaker hovered above the bench, so here they stand on it.
 *
 * PLACEMENT is the library's. These close-ups never used lib/scale.ts, they draw in screen units under
 * `translate(x y) scale(scale)`, so the V2 keeps exactly those units and every coordinate.
 *
 * This file also holds the small science kit the spectral and coadaptation files share. Its names
 * start with Sc so they never clash with another set.
 */
type Pt = [number, number];
type P = {x?: number; y?: number; scale?: number; frame?: number; label?: string; status?: string; detail?: string; mode?: string};

// ============================================================================ the shared science kit

/** the science palette, the library's sage, copper and paper pushed to full chroma */
export const SC = {
  ink: '#2a2150', paper: '#fff4df', cream: '#fff9ee', copper: '#f2873a', red: '#ef4a4f', north: '#ff5a5f', south: '#3d8bff',
  teal: '#22b394', sage: '#5fc4a0', mint: '#2fe0b0', field: '#7fe8ff', navy: '#1d2758', lilac: '#b8a8f0', gold: '#ffbf3c',
  plum: '#8a55d6', glass: '#cfe9ff', wood: '#e2a565', slate: '#5465b8',
};
/** half the film line width for a screen space drawing at `scale` */
export const scOw = (scale = 1) => 3.4 / Math.max(0.05, scale);
const f1 = (p: Pt) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
/** a rounded rectangle as a path, so it can join an outline pass */
export const scRR = (x: number, y: number, w: number, h: number, r: number) => {
  const q = Math.max(0, Math.min(r, w / 2, h / 2));
  return `M${x + q} ${y} H${x + w - q} A${q} ${q} 0 0 1 ${x + w} ${y + q} V${y + h - q} A${q} ${q} 0 0 1 ${x + w - q} ${y + h}`
    + ` H${x + q} A${q} ${q} 0 0 1 ${x} ${y + h - q} V${y + q} A${q} ${q} 0 0 1 ${x + q} ${y} Z`;
};
/** a polygon with every corner rounded by `r`, for crystals, documents and roofs with no sharp point */
export const scRound = (pts: Pt[], r: number) => {
  const n = pts.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
    const d1 = Math.hypot(p0[0] - p1[0], p0[1] - p1[1]) || 1, d2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) || 1;
    const q = Math.min(r, d1 / 2, d2 / 2);
    const a: Pt = [p1[0] + (p0[0] - p1[0]) / d1 * q, p1[1] + (p0[1] - p1[1]) / d1 * q];
    const b: Pt = [p1[0] + (p2[0] - p1[0]) / d2 * q, p1[1] + (p2[1] - p1[1]) / d2 * q];
    d += `${i === 0 ? 'M' : 'L'}${f1(a)} Q${f1(p1)} ${f1(b)} `;
  }
  return d + 'Z';
};
/** an open polyline with its bends rounded by `r`, for arrows and brackets */
export const scBend = (pts: Pt[], r: number) => {
  let d = `M${f1(pts[0])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const p0 = pts[i - 1], p1 = pts[i], p2 = pts[i + 1];
    const d1 = Math.hypot(p0[0] - p1[0], p0[1] - p1[1]) || 1, d2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) || 1;
    const q = Math.min(r, d1 / 2, d2 / 2);
    d += ` L${f1([p1[0] + (p0[0] - p1[0]) / d1 * q, p1[1] + (p0[1] - p1[1]) / d1 * q])} Q${f1(p1)}`
      + ` ${f1([p1[0] + (p2[0] - p1[0]) / d2 * q, p1[1] + (p2[1] - p1[1]) / d2 * q])}`;
  }
  return d + ` L${f1(pts[pts.length - 1])}`;
};
/** a lit material, light at the upper left through the colour to violet shade at the lower right */
export const ScLit: React.FC<{id: string; c: string; v?: boolean; h?: boolean; k?: number}> = ({id, c, v, h, k = 1}) => (
  <linearGradient id={id} x1="0" y1="0" x2={v ? '0' : h ? '1' : '0.45'} y2={h ? '0' : '1'}>
    <stop offset="0%" stopColor={light(c, 0.45 * k)} /><stop offset="50%" stopColor={c} />
    <stop offset="100%" stopColor={shade(c, 0.34 * k)} />
  </linearGradient>
);
/** a lit ball, its hot spot high on the left */
export const ScBall: React.FC<{id: string; c: string}> = ({id, c}) => (
  <radialGradient id={id} cx="36%" cy="30%" r="78%">
    <stop offset="0%" stopColor={light(c, 0.6)} /><stop offset="55%" stopColor={c} /><stop offset="100%" stopColor={shade(c, 0.38)} />
  </radialGradient>
);
/** a soft blur, for glows and drop shadows */
export const ScBlur: React.FC<{id: string; sd: number}> = ({id, sd}) => (
  <filter id={id} x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation={sd} /></filter>
);
/** bold body text. `halo` puts a deep rim behind the letters so a word reads on a bright or a dark plate */
export const ScTxt: React.FC<{x: number; y: number; t: string; size?: number; fill?: string; anchor?: 'start' | 'middle' | 'end';
  weight?: number; halo?: string; opacity?: number}> = ({x, y, t, size = 30, fill = SC.ink, anchor = 'start', weight = 800, halo, opacity}) => (
  <text x={x} y={y} fontFamily={FONT.body} fontWeight={weight} fontSize={size} fill={fill} textAnchor={anchor} opacity={opacity}
    letterSpacing={halo ? size * 0.03 : 0.4} wordSpacing={halo ? size * 0.12 : undefined} stroke={halo}
    strokeWidth={halo ? size * 0.17 : undefined} strokeLinejoin="round" paintOrder="stroke">{t}</text>
);
/** a stroke with its own deep line under it, for arrows, rules and traces */
export const ScDuo: React.FC<{d: string; c: string; w: number; ow: number; dash?: string; opacity?: number; off?: number; pl?: number}> = ({
  d, c, w, ow, dash, opacity = 1, off, pl}) => (
  <g opacity={opacity}>
    <path d={d} fill="none" stroke={line(c)} strokeWidth={w + ow * 2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash}
      strokeDashoffset={off} pathLength={pl} />
    <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} strokeDashoffset={off}
      pathLength={pl} />
  </g>
);
/** one closed shape, outline first and then the fill */
export const ScSolid: React.FC<{d: string; c: string; ow: number; fill?: string; opacity?: number}> = ({d, c, ow, fill, opacity}) => (
  <g opacity={opacity}>
    <path d={d} fill={line(c)} stroke={line(c)} strokeWidth={ow * 2} strokeLinejoin="round" />
    <path d={d} fill={fill ?? c} />
  </g>
);
/** a soft drop shadow of any shape, offset down and right, under a panel or a card */
export const ScDrop: React.FC<{d: string; dx?: number; dy?: number; sd?: number; opacity?: number}> = ({d, dx = 10, dy = 18, sd = 14, opacity = 0.3}) => {
  const id = useUid();
  return <g><defs><ScBlur id={`${id}-b`} sd={sd} /></defs>
    <path d={d} transform={`translate(${dx} ${dy})`} fill="#1a1236" opacity={opacity} filter={`url(#${id}-b)`} /></g>;
};

/**
 * THE CANDIDATE CRYSTAL. The library's five sided crystal with its three facet seams, now a cut gem.
 * Each facet takes light by which way it faces (upper left is bright, lower right goes violet), the
 * corners are rounded, a sheen sits on the brightest facet and a small sparkle comes and goes.
 * `glow` lays a warm halo behind it for the moment it is the thing being found.
 */
export const ScCrystal: React.FC<{x: number; y: number; r?: number; frame?: number; ow: number; c?: string; glow?: number;
  opacity?: number; tilt?: number}> = ({x, y, r = 85, frame = 0, ow, c = SC.copper, glow = 0, opacity = 1, tilt = 0}) => {
  const id = useUid();
  const V: Pt[] = [[0, -r], [r * 0.88, -r * 0.4], [r * 0.7, r * 0.7], [-r * 0.22, r], [-r, 0]];
  const C: Pt = [r * 0.08, r * 0.08];
  const outer = scRound(V, r * 0.14);
  const facets = V.map((v, i) => {
    const w = V[(i + 1) % 5];
    const mx = (v[0] + w[0]) / 2 - C[0], my = (v[1] + w[1]) / 2 - C[1];
    const k = (-mx * 0.7 - my * 0.72) / (Math.hypot(mx, my) || 1);
    const fill = k > 0 ? mix(c, light(c, 0.7), k) : mix(c, shade(c, 0.5), -k);
    return {d: `M${f1(C)} L${f1(v)} L${f1(w)} Z`, fill};
  });
  const tw = 0.5 + 0.5 * Math.sin(frame / 11);
  const sp = r * 0.16 * (0.5 + tw * 0.6);
  const sx = -r * 0.5, sy = -r * 0.62;
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt})`} opacity={opacity}>
      <defs><clipPath id={`${id}-c`}><path d={outer} /></clipPath></defs>
      {glow > 0 && <Glow x={0} y={0} r={r * 2.3} color={light(c, 0.3)} opacity={0.75 * glow} />}
      <path d={outer} fill={line(c)} stroke={line(c)} strokeWidth={ow * 2} strokeLinejoin="round" />
      <g clipPath={`url(#${id}-c)`}>
        {facets.map((q, i) => <path key={i} d={q.d} fill={q.fill} stroke={q.fill} strokeWidth={0.6} />)}
        <path d={`M${f1(C)} L${f1(V[0])} M${f1(C)} L${f1(V[2])} M${f1(C)} L${f1(V[4])} M${f1(C)} L${f1(V[1])}`} stroke={light(c, 0.75)}
          strokeWidth={ow * 0.7} strokeLinecap="round" opacity={0.8} />
        <ellipse cx={-r * 0.38} cy={-r * 0.4} rx={r * 0.26} ry={r * 0.11} transform={`rotate(-35 ${-r * 0.38} ${-r * 0.4})`} fill="#ffffff"
          opacity={0.55} />
      </g>
      <path d={`M${sx} ${sy - sp} Q${sx} ${sy} ${sx + sp} ${sy} Q${sx} ${sy} ${sx} ${sy + sp} Q${sx} ${sy} ${sx - sp} ${sy}`
        + ` Q${sx} ${sy} ${sx} ${sy - sp} Z`} fill="#ffffff" opacity={0.5 + tw * 0.5} />
    </g>
  );
};

/** a lit sphere with an outline and a sheen, for lattice and network nodes */
export const ScNode: React.FC<{x: number; y: number; r: number; c: string; ow: number}> = ({x, y, r, c, ow}) => {
  const id = useUid();
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs><ScBall id={`${id}-b`} c={c} /></defs>
      <circle r={r} fill={`url(#${id}-b)`} stroke={line(c)} strokeWidth={ow * 2} />
      <ellipse cx={-r * 0.32} cy={-r * 0.38} rx={r * 0.34} ry={r * 0.2} fill="#ffffff" opacity={0.55} />
    </g>
  );
};

/** a lit card or panel with a soft drop shadow, a hue-tinted outline and a top sheen. Children draw clipped to it */
export const ScCard: React.FC<{d: string; c: string; ow: number; shadow?: boolean; children?: React.ReactNode; opacity?: number}> = ({
  d, c, ow, shadow = true, children, opacity}) => {
  const id = useUid();
  return (
    <g opacity={opacity}>
      <defs><ScLit id={`${id}-l`} c={c} k={0.5} />
        <linearGradient id={`${id}-s`} x1="0" y1="0" x2="0.5" y2="1"><stop offset="0%" stopColor="#ffffff" stopOpacity={0.4} />
          <stop offset="40%" stopColor="#ffffff" stopOpacity={0} /></linearGradient>
        <clipPath id={`${id}-c`}><path d={d} /></clipPath></defs>
      {shadow && <ScDrop d={d} />}
      <path d={d} fill={line(c)} stroke={line(c)} strokeWidth={ow * 2} strokeLinejoin="round" />
      <path d={d} fill={`url(#${id}-l)`} />
      <g clipPath={`url(#${id}-c)`}>{children}</g>
      <path d={d} fill={`url(#${id}-s)`} />
    </g>
  );
};

// ============================================================================ the drawings

const Body: React.FC<P & {children: React.ReactNode}> = ({x = 0, y = 0, scale = 1, children}) =>
  <g transform={`translate(${x} ${y}) scale(${scale})`}>{children}</g>;

/**
 * A PERMANENT MAGNET MOTOR, face on. Twelve stator magnets alternate north (red) and south (blue), the
 * usual colours for poles, and a cyan field arc runs from every north pole through the rotor to the
 * south pole beside it, the flux path that makes the rotor turn. The cream three lobe rotor spins
 * inside the magnets with a clear air gap. `mode` future adds the testing caveat line.
 */
export const PermanentMotorV2: React.FC<P> = ({frame = 0, label = '', status = '', mode = '', ...p}) => {
  const id = useUid();
  const ow = scOw(p.scale);
  const reveal = ease((frame - 14) / 28), angle = frame * 3.4;
  const pol = (r: number, deg: number): Pt => [Math.cos((deg - 90) * Math.PI / 180) * r, Math.sin((deg - 90) * Math.PI / 180) * r];
  const magnet = (i: number) => {
    const a = i * 30, w = 22 / 198 * 180 / Math.PI;
    return scRound([pol(232, a - w * 0.85), pol(232, a + w * 0.85), pol(166, a + w * 1.1), pol(166, a - w * 1.1)], 13);
  };
  const lobe = 'M0,-30 C-20,-95 48,-206 112,-161 C178,-111 126,-33 25,10 Z';
  return (
    <Body {...p}>
      <defs>
        <ScBall id={`${id}-h`} c="#3b4c99" /><ScLit id={`${id}-st`} c={SC.teal} />
        <radialGradient id={`${id}-gap`} cx="40%" cy="35%" r="70%"><stop offset="0%" stopColor="#2c3a7a" />
          <stop offset="100%" stopColor="#141a44" /></radialGradient>
        <ScLit id={`${id}-n`} c={SC.north} /><ScLit id={`${id}-s`} c={SC.south} />
        <ScBall id={`${id}-r`} c="#dcd8f5" /><ScBall id={`${id}-hub`} c={SC.copper} />
        <ScBlur id={`${id}-fg`} sd={5} />
      </defs>
      <g transform="translate(380 360)">
        <ScDrop d="M-275 0 A275 275 0 1 0 275 0 A275 275 0 1 0 -275 0 Z" dx={12} dy={20} sd={18} opacity={0.32} />
        <circle r={275} fill={`url(#${id}-h)`} stroke={line('#3b4c99')} strokeWidth={ow * 2} />
        <circle r={240} fill={`url(#${id}-st)`} stroke={line(SC.teal)} strokeWidth={ow * 2} />
        <circle r={160} fill={`url(#${id}-gap)`} stroke={line(SC.teal)} strokeWidth={ow * 1.4} />
        {Array.from({length: 12}, (_, i) => <path key={`o${i}`} d={magnet(i)} fill={line(i % 2 ? SC.south : SC.north)}
          stroke={line(i % 2 ? SC.south : SC.north)} strokeWidth={ow * 2} strokeLinejoin="round" />)}
        {Array.from({length: 12}, (_, i) => <path key={`m${i}`} d={magnet(i)} fill={`url(#${id}-${i % 2 ? 's' : 'n'})`} />)}
        {Array.from({length: 12}, (_, i) => {
          const [tx, ty] = pol(199, i * 30);
          return <text key={`t${i}`} x={tx} y={ty + 9} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={25}
            fill="#ffffff" opacity={0.92}>{i % 2 ? 'S' : 'N'}</text>;
        })}
        {/* the rotor, inside the air gap */}
        <g transform={`rotate(${angle}) scale(0.78)`}>
          {[0, 120, 240].map((a) => <path key={`o${a}`} transform={`rotate(${a})`} d={lobe} fill={line('#b9b2e0')} stroke={line('#b9b2e0')}
            strokeWidth={ow * 2 / 0.78} strokeLinejoin="round" />)}
          {[0, 120, 240].map((a) => <path key={a} transform={`rotate(${a})`} d={lobe} fill={`url(#${id}-r)`} />)}
        </g>
        {/* flux, north to the neighbouring south, through the rotor */}
        {Array.from({length: 12}, (_, i) => {
          const a0 = i * 30, a1 = a0 + 30;
          const d = `M${f1(pol(160, a0))} Q${f1(pol(86, a0 + 15))} ${f1(pol(160, a1))}`;
          const dir = i % 2 ? 1 : -1;
          return <g key={`f${i}`}>
            <path d={d} fill="none" stroke={SC.field} strokeWidth={ow * 2.4} opacity={0.45} filter={`url(#${id}-fg)`} />
            <path d={d} fill="none" stroke={SC.field} strokeWidth={ow * 0.8} strokeLinecap="round" opacity={0.85} />
            <path d={d} fill="none" stroke="#ffffff" strokeWidth={ow * 1.2} strokeLinecap="round" pathLength={1} strokeDasharray="0.16 0.84"
              strokeDashoffset={dir * ((frame / 40) % 1)} opacity={0.9} />
          </g>;
        })}
        <circle r={42} fill={`url(#${id}-hub)`} stroke={line(SC.copper)} strokeWidth={ow * 2} />
        <circle r={14} fill={shade(SC.copper, 0.45)} />
        <ellipse cx={-13} cy={-16} rx={13} ry={7} fill="#ffffff" opacity={0.55} />
        <path d="M-245 -128 A275 275 0 0 1 -120 -238" fill="none" stroke="#ffffff" strokeWidth={ow * 1.6} strokeLinecap="round" opacity={0.35} />
        <g opacity={reveal}>
          <ScDuo d={scBend([[-90, -225], [-170, -305], [-295, -305]], 30)} c={SC.copper} w={ow * 1.6} ow={ow} />
          <circle cx={-90} cy={-225} r={ow * 2.6} fill={SC.copper} stroke={line(SC.copper)} strokeWidth={ow} />
        </g>
      </g>
      <ScTxt x={10} y={32} t={label} size={34} /><ScTxt x={8} y={735} t={status} size={28} />
      {mode === 'future' && <g opacity={ease((frame - 80) / 35)}>
        <ScDuo d="M75,640 H625" c={SC.red} w={ow * 1.4} ow={ow * 0.5} dash={`${ow * 1.2} ${ow * 4.4}`} />
        <ScTxt x={90} y={680} t="MATERIALS MUST BE TESTED" size={28} fill={SC.red} />
      </g>}
    </Body>
  );
};

/**
 * THE CANDIDATE LATTICE. Fifteen predicted sites fly into a grid, each a lit sphere on soft rounded
 * bonds, and one candidate crystal rises out of it with a warm glow, traced by a dashed copper route.
 * `mode` recipe slides a recipe card in under it.
 */
export const CandidateLatticeV2: React.FC<P> = ({frame = 0, label = '', status = '', mode = '', ...p}) => {
  const ow = scOw(p.scale);
  const a = ease((frame - 8) / 42), b = ease((frame - 82) / 45);
  const site = (i: number): Pt => [(i % 5) * 124 + (1 - a) * (i % 2 ? 160 : -180), Math.floor(i / 5) * 134 + (1 - a) * 100];
  return (
    <Body {...p}>
      <ScTxt x={0} y={24} t={label} size={34} />
      <g transform="translate(55 120)">
        {Array.from({length: 15}, (_, i) => {
          const [x, y] = site(i);
          return <g key={`b${i}`} transform={`translate(${x} ${y})`} opacity={0.4 + a * 0.6}>
            <path d={scBend([[0, 0], [110, 0], [110, 116]], 22)} fill="none" stroke={SC.lilac} strokeWidth={ow * 1.6} strokeLinecap="round" />
          </g>;
        })}
        {Array.from({length: 15}, (_, i) => {
          const [x, y] = site(i);
          const bob = Math.sin(frame / 14 + i * 0.9) * 2.5;
          return <g key={i} opacity={0.4 + a * 0.6}><ScNode x={x} y={y + bob} r={19 + (i % 3) * 3} c={i % 3 === 0 ? SC.copper : SC.teal} ow={ow} /></g>;
        })}
      </g>
      <ScDuo d={scBend([[680, 150], [680, 200 + b * 355], [530, 200 + b * 355]], 26)} c={SC.copper} w={ow * 1.5} ow={ow * 0.5} dash={`${ow * 1.2} ${ow * 4.4}`}
        off={-frame * 0.8} />
      <ScCrystal x={250 + b * 130} y={580 - b * 40} r={90} frame={frame} ow={ow} glow={b} tilt={Math.sin(frame / 40) * 3} />
      <ScTxt x={0} y={765} t={status} size={28} />
      {mode === 'recipe' && <g transform={`translate(${590 - b * 290} 630)`} opacity={b}>
        <ScCard d={scRR(0, 0, 190, 90, 22)} c={SC.paper} ow={ow}>
          {[[25, 150], [25, 120], [25, 140]].map(([x0, x1], k) => <path key={k} d={`M${x0} ${25 + k * 20} H${x1}`} stroke={SC.copper}
            strokeWidth={ow * 1.5} strokeLinecap="round" />)}
        </ScCard>
      </g>}
    </Body>
  );
};

/**
 * THE SYNTHESIS BENCH. A beaker of molten copper coloured melt is lowered to the bench, a teal furnace
 * stands on the bench with its window glowing as it heats, and the made crystal sits beside them. In
 * the library the furnace and the beaker hovered, here everything stands on the bench top.
 */
export const SynthesisBenchV2: React.FC<P> = ({frame = 0, label = '', status = '', ...p}) => {
  const id = useUid();
  const ow = scOw(p.scale);
  const a = ease((frame - 18) / 36), b = ease((frame - 88) / 36);
  const heat = 0.25 + 0.35 * a + 0.08 * Math.sin(frame / 9);
  const beaker = 'M-70,-90 H70 L55,75 Q0,115 -55,75 Z';
  return (
    <Body {...p}>
      <defs>
        <ScLit id={`${id}-top`} c={SC.slate} v /><ScLit id={`${id}-leg`} c={SC.teal} h /><ScLit id={`${id}-f`} c={SC.teal} />
        <ScLit id={`${id}-melt`} c={SC.copper} v />
        <radialGradient id={`${id}-win`} cx="50%" cy="60%" r="70%"><stop offset="0%" stopColor="#ffe08a" />
          <stop offset="55%" stopColor="#ff8a3c" /><stop offset="100%" stopColor="#c2402e" /></radialGradient>
        <clipPath id={`${id}-bk`}><path d={beaker} /></clipPath>
      </defs>
      <ScTxt x={0} y={24} t={label} size={34} />
      <ContactShadow x={-10} y={822} w={110} /><ContactShadow x={730} y={822} w={110} />
      {[-10, 730].map((lx) => <rect key={lx} x={lx - 13} y={640} width={26} height={182} rx={13} fill={`url(#${id}-leg)`}
        stroke={line(SC.teal)} strokeWidth={ow * 2} />)}
      <ScSolid d={scRR(-45, 610, 855, 40, 18)} c={SC.slate} ow={ow} fill={`url(#${id}-top)`} />
      <path d="M-20 618 H780" stroke="#ffffff" strokeWidth={ow * 1.2} strokeLinecap="round" opacity={0.3} />
      {/* the furnace stands on the bench */}
      <g transform="translate(490 210)">
        <ContactShadow x={108} y={400} w={260} opacity={0.4} />
        <ScSolid d={scRR(0, 0, 215, 400, 34)} c={SC.teal} ow={ow} fill={`url(#${id}-f)`} />
        <ScSolid d={scRR(26, 74, 163, 225, 24)} c={SC.navy} ow={ow * 0.8} />
        <rect x={40} y={91} width={133} height={193} rx={18} fill={`url(#${id}-win)`} opacity={heat} />
        <Glow x={107} y={190} r={150} color="#ffb05a" opacity={0.55 * a} />
        <rect x={46} y={98} width={30} height={150} rx={15} fill="#ffffff" opacity={0.18} />
        <rect x={26} y={322} width={163} height={26} rx={13} fill={shade(SC.teal, 0.3)} />
        <circle cx={60} cy={335} r={8} fill={a > 0.5 ? '#ffd23c' : '#7a86c9'} opacity={0.6 + 0.4 * Math.sin(frame / 6) ** 2} />
        <circle cx={150} cy={335} r={9} fill={light(SC.teal, 0.5)} stroke={line(SC.teal)} strokeWidth={ow} />
        <rect x={20} y={14} width={120} height={14} rx={7} fill="#ffffff" opacity={0.3} />
      </g>
      {/* the beaker comes down to the bench */}
      <ContactShadow x={250} y={612} w={150 * a} opacity={0.3 * a} />
      <g transform={`translate(${190 + a * 60} ${195 + a * 310}) rotate(${-25 + a * 25})`}>
        <path d={beaker} fill={line('#8cc4f0')} stroke={line('#8cc4f0')} strokeWidth={ow * 2} strokeLinejoin="round" />
        <path d={beaker} fill={SC.glass} opacity={0.85} />
        <g clipPath={`url(#${id}-bk)`}>
          <path d="M-90 30 Q0 48 90 30 V140 H-90 Z" fill={`url(#${id}-melt)`} />
          <path d="M-60 32 Q0 46 60 32" stroke={light(SC.copper, 0.6)} strokeWidth={ow * 1.4} fill="none" strokeLinecap="round" />
        </g>
        <Glow x={0} y={60} r={70} color={SC.gold} opacity={0.4} />
        <rect x={-52} y={-78} width={14} height={120} rx={7} fill="#ffffff" opacity={0.55} />
        <path d="M-78 -90 H78" stroke={line('#8cc4f0')} strokeWidth={ow * 2.4} strokeLinecap="round" />
      </g>
      <ContactShadow x={395} y={606} w={120 * b} opacity={0.35 * b} />
      <ScCrystal x={325 + b * 70} y={560 - b * 10} r={52} frame={frame} ow={ow} opacity={b} glow={b * 0.5} />
      <ScTxt x={0} y={735} t={status} size={28} />
    </Body>
  );
};

/**
 * THE MEASURING CHAMBER. A teal glass chamber with the candidate crystal lowered into it on a copper
 * rod, visible through the glass, and beside it a chart that holds only a question mark, because no
 * value is measured yet. The chart sits on a lit card. "MEASURE THEN JUDGE".
 */
export const MagnetMeasureV2: React.FC<P> = ({frame = 0, label = '', status = '', ...p}) => {
  const id = useUid();
  const ow = scOw(p.scale);
  const lower = ease((frame - 12) / 38), trace = ease((frame - 85) / 45);
  const body = 'M-165,0 V225 A165 57 0 0 0 165 225 V0 Z';
  return (
    <Body {...p}>
      <defs>
        <ScLit id={`${id}-v`} c={SC.teal} h /><ScLit id={`${id}-rod`} c={SC.copper} h />
        <linearGradient id={`${id}-gl`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#ffffff" stopOpacity={0.5} />
          <stop offset="30%" stopColor="#ffffff" stopOpacity={0.08} /><stop offset="80%" stopColor="#ffffff" stopOpacity={0} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0.18} /></linearGradient>
        <radialGradient id={`${id}-in`} cx="45%" cy="40%" r="70%"><stop offset="0%" stopColor="#25407e" />
          <stop offset="100%" stopColor="#0f1636" /></radialGradient>
      </defs>
      <ScTxt x={0} y={24} t={label} size={34} />
      <g transform="translate(245 395)">
        <ContactShadow x={0} y={282} w={420} opacity={0.38} />
        <path d={body} fill={line(SC.teal)} stroke={line(SC.teal)} strokeWidth={ow * 2} strokeLinejoin="round" />
        <path d={body} fill={`url(#${id}-v)`} opacity={0.62} />
        <path d="M-105 0 V215 A105 30 0 0 0 105 215 V0 Z" fill="#0f1a3c" opacity={0.35} />
        <Glow x={0} y={120} r={150} color={SC.mint} opacity={0.35 + 0.15 * Math.sin(frame / 12)} />
        {/* the rod and the sample, seen through the glass */}
        <rect x={-7} y={-290 + lower * 185} width={14} height={210} rx={7} fill={`url(#${id}-rod)`} stroke={line(SC.copper)} strokeWidth={ow * 1.4} />
        <ScCrystal x={0} y={-58 + lower * 185} r={32} frame={frame} ow={ow * 0.7} />
        <path d={body} fill={`url(#${id}-gl)`} />
        <ellipse rx={165} ry={57} fill={light(SC.teal, 0.35)} stroke={line(SC.teal)} strokeWidth={ow * 2} />
        <ellipse rx={105} ry={29} fill={`url(#${id}-in)`} stroke={line(SC.teal)} strokeWidth={ow * 1.2} />
        <ellipse rx={43} ry={15} fill={SC.mint} opacity={0.35} />
        <rect x={-7} y={-290 + lower * 185} width={14} height={Math.max(0, 290 - lower * 185)} rx={7} fill={`url(#${id}-rod)`}
          stroke={line(SC.copper)} strokeWidth={ow * 1.4} />
        <path d="M-140 30 V200" stroke="#ffffff" strokeWidth={ow * 2.4} strokeLinecap="round" opacity={0.4} />
      </g>
      <g transform="translate(475 295)">
        <ScCard d={scRR(-22, -20, 270, 400, 30)} c={SC.paper} ow={ow} />
        <ScDuo d={scBend([[0, 0], [0, 260], [240, 260]], 14)} c={SC.ink} w={ow * 1.2} ow={ow * 0.4} />
        <rect x={22} y={25} width={200} height={185} rx={26} fill={SC.copper} opacity={0.08 * trace} />
        <rect x={22} y={25} width={200} height={185} rx={26} fill="none" stroke={SC.copper} strokeWidth={ow * 1.5} strokeDasharray={`${ow * 1.6} ${ow * 3.4}`}
          strokeLinecap="round" opacity={0.4 + trace * 0.6} strokeDashoffset={-frame * 0.6} />
        <ScTxt x={122} y={152} t="?" size={95} fill={SC.copper} anchor="middle" halo={line(SC.copper)} />
        <ScTxt x={12} y={320} t="MEASURE" size={26} /><ScTxt x={12} y={357} t="THEN JUDGE" size={26} />
      </g>
      <ScTxt x={0} y={795} t={status} size={28} />
    </Body>
  );
};

/** THE RESEARCH GRANT. A cream document slides in with a teal folded corner, and its status stamp lands. */
export const ResearchGrantV2: React.FC<P> = ({frame = 0, label = '', status = '', detail = '', ...p}) => {
  const ow = scOw(p.scale);
  const a = ease((frame - 9) / 35), b = clamp01((frame - 90) / 35);
  const doc = scRound([[0, 0], [550, 0], [650, 100], [650, 650], [0, 650]], 26);
  const st = easeOutBack(b, 1.4);
  return (
    <Body {...p}>
      <g transform={`translate(${40 + (1 - a) * 350} 60) rotate(${-7 + a * 4})`}>
        <ScCard d={doc} c={SC.paper} ow={ow} />
        <ScSolid d={scRound([[550, 0], [650, 100], [550, 100]], 16)} c={SC.teal} ow={ow} />
        <ScTxt x={50} y={105} t="UNIVERSITY" size={37} /><ScTxt x={50} y={155} t="OF HOUSTON" size={37} />
        <rect x={50} y={190} width={525} height={12} rx={6} fill={SC.copper} />
        <ScTxt x={50} y={270} t={label} size={32} /><ScTxt x={50} y={328} t={detail} size={30} fill={shade(SC.teal, 0.3)} />
        {[[560, 380], [480, 410], [540, 440]].map(([x1, yy]) => <rect key={yy} x={50} y={yy - 6} width={x1 - 50} height={12} rx={6}
          fill={SC.lilac} opacity={0.7} />)}
        <g opacity={b} transform={`translate(315 555) rotate(-5) scale(${0.6 + 0.4 * st}) translate(-280 -47)`}>
          <rect width={560} height={95} rx={26} fill={SC.copper} opacity={0.12} />
          <rect width={560} height={95} rx={26} fill="none" stroke={line(SC.copper)} strokeWidth={ow * 3.4} opacity={0.5} />
          <rect width={560} height={95} rx={26} fill="none" stroke={SC.copper} strokeWidth={ow * 1.8} />
          <ScTxt x={35} y={61} t={status} size={31} fill={shade(SC.copper, 0.15)} />
        </g>
      </g>
    </Body>
  );
};

/**
 * THE PATH TO MARKET. The candidate crystal on the line, a red gate it has to pass (synthesis and
 * testing), and the possible market beyond it, a teal storefront panel that firms up as it comes near.
 */
export const CommercialPathV2: React.FC<P> = ({frame = 0, label = '', status = '', ...p}) => {
  const id = useUid();
  const ow = scOw(p.scale);
  const a = ease((frame - 12) / 35), b = ease((frame - 90) / 40);
  const bob = Math.sin(frame / 16) * 4;
  return (
    <Body {...p}>
      <defs><ScLit id={`${id}-m`} c={SC.teal} /><ScLit id={`${id}-g`} c={SC.red} h /></defs>
      <ScTxt x={0} y={20} t={label} size={33} />
      <ContactShadow x={125 + a * 150} y={402} w={170} opacity={0.35} />
      <ScCrystal x={125 + a * 150} y={300 + bob} r={83} frame={frame} ow={ow} />
      <ScSolid d={scRR(-4, 399, 668, 14, 7)} c={SC.slate} ow={ow} />
      <Glow x={410} y={340} r={110} color={SC.red} opacity={0.35 + 0.15 * Math.sin(frame / 8)} />
      <ScSolid d={scRR(402, 185, 16, 310, 8)} c={SC.red} ow={ow} fill={`url(#${id}-g)`} />
      <g opacity={0.45 + b * 0.55}>
        <ContactShadow x={625} y={410} w={260} opacity={0.3} />
        <ScSolid d={scRound([[510, 235], [740, 175], [740, 410], [510, 410]], 24)} c={SC.teal} ow={ow} fill={`url(#${id}-m)`} />
        {[280, 320, 360].map((yy) => <rect key={yy} x={545} y={yy - 5} width={145} height={10} rx={5} fill={SC.paper} opacity={0.9} />)}
      </g>
      <ScTxt x={8} y={555} t="CANDIDATE" size={25} /><ScTxt x={440} y={555} t="POSSIBLE MARKET" size={25} />
      <ScTxt x={0} y={700} t={status} size={28} fill={SC.red} />
    </Body>
  );
};

/** THE LAB WINDOW. A rounded teal frame, a lit sky with clouds drifting past, a hedge outside and a plant on the sill. */
export const LabWindowV2: React.FC<P> = ({frame = 0, ...p}) => {
  const id = useUid();
  const ow = scOw(p.scale);
  const sway = Math.sin(frame / 45) * 3;
  const cloud = (cx: number, cy: number, s: number) => {
    const dx = ((frame * 0.35 + cx) % 1000) - 120;
    return <g transform={`translate(${dx} ${cy}) scale(${s})`} opacity={0.95}>
      {[[-50, 8, 34], [-10, -12, 46], [40, 0, 38]].map(([x, y, r], k) => <circle key={k} cx={x} cy={y} r={r} fill="#ffffff" />)}
      <rect x={-84} y={8} width={170} height={34} rx={17} fill="#ffffff" /></g>;
  };
  const frameD = scRR(-50, 0, 820, 710, 30);
  const hedge = [[-40, 640, 80], [50, 610, 72], [140, 630, 78], [230, 605, 70], [320, 632, 80], [410, 608, 72], [500, 634, 78],
    [590, 606, 70], [680, 630, 78], [770, 612, 74]];
  const leaf = (lx: number, ly: number, rot: number, s = 1) => <path d="M0 0 Q18 -26 46 -8 Q22 10 0 0 Z" fill={SC.sage}
    stroke={line(SC.sage)} strokeWidth={ow * 1.4} strokeLinejoin="round" transform={`translate(${lx} ${ly}) rotate(${rot}) scale(${s})`} />;
  return (
    <Body {...p}>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6fb8ff" />
          <stop offset="70%" stopColor="#cfe6ff" /><stop offset="100%" stopColor="#fff1d6" /></linearGradient>
        <ScLit id={`${id}-fr`} c={SC.teal} /><ScBall id={`${id}-hd`} c="#57b56a" /><ScLit id={`${id}-pot`} c={SC.copper} />
        <clipPath id={`${id}-c`}><path d={frameD} /></clipPath>
      </defs>
      <g clipPath={`url(#${id}-c)`}>
        <rect x={-50} y={0} width={820} height={710} fill={`url(#${id}-sky)`} />
        {cloud(120, 130, 1.1)}{cloud(620, 260, 0.8)}
        {hedge.map(([x, y, r], k) => <circle key={k} cx={x} cy={y} r={r + ow * 2} fill={line('#57b56a')} />)}
        {hedge.map(([x, y, r], k) => <circle key={`h${k}`} cx={x} cy={y} r={r} fill={`url(#${id}-hd)`} />)}
        <path d="M-50 260 L230 -20 L330 -20 L50 260 Z M60 420 L400 80 L440 80 L100 420 Z" fill="#ffffff" opacity={0.16} />
      </g>
      <path d={frameD} fill="none" stroke={line(SC.teal)} strokeWidth={28 + ow * 2} strokeLinejoin="round" />
      <path d={frameD} fill="none" stroke={`url(#${id}-fr)`} strokeWidth={28} strokeLinejoin="round" />
      <path d="M-40 470 H760" stroke={line(SC.teal)} strokeWidth={24 + ow * 2} strokeLinecap="round" />
      <path d="M345 10 V700" stroke={line(SC.teal)} strokeWidth={24 + ow * 2} strokeLinecap="round" />
      <path d="M-40 470 H760" stroke={SC.teal} strokeWidth={24} strokeLinecap="round" />
      <path d="M345 10 V700" stroke={light(SC.teal, 0.15)} strokeWidth={24} strokeLinecap="round" />
      <path d="M-30 464 H750 M339 20 V460" stroke="#ffffff" strokeWidth={ow * 1.2} strokeLinecap="round" opacity={0.35} />
      {/* the plant on the sill */}
      <ContactShadow x={705} y={700} w={150} opacity={0.4} />
      <g transform={`rotate(${sway} 705 640)`}>
        <path d={`M700 640 Q${668 + sway} 560 ${712 + sway * 2} 480`} stroke={line(SC.sage)} strokeWidth={10 + ow * 2} fill="none" strokeLinecap="round" />
        <path d={`M700 640 Q${668 + sway} 560 ${712 + sway * 2} 480`} stroke={SC.sage} strokeWidth={10} fill="none" strokeLinecap="round" />
        {leaf(688, 590, -160)}{leaf(690, 560, -20)}{leaf(696, 520, -150, 0.9)}{leaf(704, 500, -40, 0.9)}{leaf(712 + sway * 2, 482, -80, 0.8)}
      </g>
      <ScSolid d={scRound([[660, 630], [750, 630], [738, 700], [672, 700]], 12)} c={SC.copper} ow={ow} fill={`url(#${id}-pot)`} />
      <rect x={-60} y={698} width={840} height={24} rx={12} fill={shade(SC.teal, 0.2)} stroke={line(SC.teal)} strokeWidth={ow * 2} />
      <rect x={-40} y={701} width={800} height={6} rx={3} fill="#ffffff" opacity={0.3} />
    </Body>
  );
};

/** THE LAB BENCH. A warm wood top in perspective with a lit front edge, an indigo apron and two grounded legs. */
export const LabBenchV2: React.FC<P> = ({...p}) => {
  const id = useUid();
  const ow = scOw(p.scale);
  return (
    <Body {...p}>
      <defs><ScLit id={`${id}-t`} c={SC.wood} v /><ScLit id={`${id}-a`} c={SC.slate} v /><ScLit id={`${id}-l`} c={SC.teal} h /></defs>
      <ContactShadow x={70} y={452} w={120} opacity={0.4} /><ContactShadow x={850} y={452} w={120} opacity={0.4} />
      {[70, 850].map((lx) => <rect key={lx} x={lx - 14} y={90} width={28} height={362} rx={14} fill={`url(#${id}-l)`}
        stroke={line(SC.teal)} strokeWidth={ow * 2} />)}
      <path d={scRound([[-140, 0], [1000, 0], [1120, 70], [1110, 100], [-230, 100], [-240, 70]], 14)} fill={line(SC.wood)}
        stroke={line(SC.wood)} strokeWidth={ow * 2} strokeLinejoin="round" />
      <path d={scRound([[-140, 0], [1000, 0], [1120, 70], [-240, 70]], 12)} fill={`url(#${id}-t)`} />
      <path d={scRR(-232, 70, 1342, 30, 12)} fill={`url(#${id}-a)`} />
      <path d="M-100 14 H960" stroke="#ffffff" strokeWidth={ow * 1.4} strokeLinecap="round" opacity={0.4} />
      <path d="M200 30 H310 M325 30 H375 M520 48 H640" stroke={shade(SC.wood, 0.2)} strokeWidth={ow} strokeLinecap="round" opacity={0.5} />
    </Body>
  );
};

/**
 * THE DOMESTIC SUPPLY. A lit house shaped panel labelled DOMESTIC, the candidate inside it, a copper
 * arrow that draws on toward a teal rack whose bars light up in turn, made here and stored here.
 */
export const MaterialSupplyV2: React.FC<P> = ({frame = 0, label = '', status = '', ...p}) => {
  const id = useUid();
  const ow = scOw(p.scale);
  const a = ease((frame - 12) / 40), b = ease((frame - 85) / 42);
  const house = scRound([[0, 100], [310, 0], [620, 100], [620, 470], [0, 470]], 30);
  return (
    <Body {...p}>
      <defs><ScLit id={`${id}-h`} c="#d4f2e3" /><ScLit id={`${id}-r`} c={SC.teal} /></defs>
      <ScTxt x={0} y={30} t={label} size={32} />
      <g transform="translate(15 170)">
        <ContactShadow x={310} y={472} w={680} opacity={0.3} />
        <ScDrop d={house} />
        <ScSolid d={house} c="#bfe8d4" ow={ow} fill={`url(#${id}-h)`} />
        <path d="M40 104 L310 18 L580 104" stroke="#ffffff" strokeWidth={ow * 1.6} strokeLinecap="round" fill="none" opacity={0.6} />
        <ScTxt x={310} y={120} t="DOMESTIC" size={34} anchor="middle" />
        <rect x={35} y={156} width={550} height={8} rx={4} fill={SC.sage} />
        <ContactShadow x={100 + a * 65} y={392} w={120} opacity={0.3} />
        <ScCrystal x={100 + a * 65} y={310} r={67} frame={frame} ow={ow} />
        <ScDuo d="M260,310 H452" c={SC.copper} w={ow * 1.8} ow={ow * 0.7} dash={`${b * 200} 400`} />
        <ScDuo d="M476,288 L504,310 L476,332" c={SC.copper} w={ow * 1.8} ow={ow * 0.7} opacity={b} />
        <g transform="translate(485 190)" opacity={0.35 + b * 0.65}>
          <ScSolid d={scRR(0, 0, 88, 220, 18)} c={SC.teal} ow={ow} fill={`url(#${id}-r)`} />
          {[26, 58, 90, 122, 154].map((yy, k) => {
            const on = b * clamp01(Math.sin(frame / 10 - k * 0.8) * 0.5 + 0.7);
            return <rect key={yy} x={16} y={yy - 5} width={56} height={10} rx={5} fill={mix(SC.paper, '#fff6a8', on)} opacity={0.6 + 0.4 * on} />;
          })}
        </g>
      </g>
      <ScTxt x={0} y={740} t={status} size={28} />
    </Body>
  );
};

/**
 * COMPOUND TO SYNTHESIS. Two AI steps side by side. The compound panel finds the crystal from its
 * neighbours, a copper arrow hands over, and the synthesis card proposes a route, a flask of melt with
 * bubbles rising. Both panels are predictions, as the status says.
 */
export const CompoundRecipeV2: React.FC<P> = ({frame = 0, label = '', status = '', ...p}) => {
  const id = useUid();
  const ow = scOw(p.scale);
  const a = ease((frame - 12) / 40), b = ease((frame - 85) / 40);
  const flaskBody = scRound([[100, 160], [175, 160], [175, 270], [200, 332], [74, 332], [100, 270]], 14);
  const nodes = [[70, 140], [230, 150], [130, 290], [270, 335]];
  return (
    <Body {...p}>
      <defs><ScLit id={`${id}-m`} c={SC.copper} v /><clipPath id={`${id}-fl`}><path d={flaskBody} /></clipPath></defs>
      <ScTxt x={0} y={28} t={label} size={31} />
      <g transform="translate(15 120)">
        <ScCard d={scRR(0, 0, 330, 470, 30)} c="#cdeedd" ow={ow}>
          <rect x={0} y={0} width={330} height={78} fill={SC.teal} opacity={0.18} />
        </ScCard>
        <ScTxt x={24} y={55} t="COMPOUND AI" size={27} />
        {nodes.map(([x, y], i) => <g key={i} opacity={0.2 + a * 0.8}><ScDuo d={`M160,230 L${x},${y}`} c={SC.lilac} w={ow * 1.4} ow={ow * 0.5} /></g>)}
        {nodes.map(([x, y], i) => <g key={`n${i}`} opacity={0.2 + a * 0.8}>
          <ScNode x={x} y={y + Math.sin(frame / 15 + i) * 2} r={25} c={i % 2 ? SC.copper : SC.paper} ow={ow} />
        </g>)}
        <ScCrystal x={165} y={236} r={67} frame={frame} ow={ow} glow={a * 0.6} />
      </g>
      <ScDuo d={`M360,375 H${360 + a * 62}`} c={SC.copper} w={ow * 1.8} ow={ow * 0.7} />
      <ScDuo d="M412,358 L430,375 L412,392" c={SC.copper} w={ow * 1.8} ow={ow * 0.7} opacity={a} />
      <g transform={`translate(${415 + (1 - a) * 140} 225)`} opacity={a}>
        <ScCard d={scRR(0, 0, 310, 490, 30)} c={SC.paper} ow={ow} />
        <ScTxt x={22} y={60} t="SYNTHESIS AI" size={25} />
        <rect x={25} y={91} width={251} height={10} rx={5} fill={SC.copper} />
        <g opacity={b}>
          <path d={flaskBody} fill={line('#8cc4f0')} stroke={line('#8cc4f0')} strokeWidth={ow * 2} strokeLinejoin="round" />
          <path d={flaskBody} fill={SC.glass} />
          <g clipPath={`url(#${id}-fl)`}>
            <path d="M60 286 Q137 296 214 286 V360 H60 Z" fill={`url(#${id}-m)`} />
            {[0, 1, 2].map((k) => {
              const t = ((frame + k * 17) % 50) / 50;
              return <circle key={k} cx={118 + k * 20} cy={326 - t * 60} r={4 + k} fill="#ffffff" opacity={0.7 * (1 - t)} />;
            })}
          </g>
          <rect x={86} y={150} width={104} height={14} rx={7} fill={light('#8cc4f0', 0.3)} stroke={line('#8cc4f0')} strokeWidth={ow * 1.4} />
          <rect x={108} y={176} width={10} height={86} rx={5} fill="#ffffff" opacity={0.6} />
          {[[40, 265, 395], [40, 210, 430]].map(([x0, x1, yy]) => <rect key={yy} x={x0} y={yy - 5} width={x1 - x0} height={10} rx={5}
            fill={SC.copper} opacity={0.85} />)}
        </g>
        <ScTxt x={24} y={370} t="POSSIBLE ROUTE" size={22} />
      </g>
      <ScTxt x={0} y={790} t={status} size={26} />
    </Body>
  );
};

/** THE CANDIDATE SPECIMEN. The crystal large, hovering gently over its shadow, behind a red testing line. */
export const CandidateSpecimenV2: React.FC<P> = ({frame = 0, label = '', status = '', ...p}) => {
  const ow = scOw(p.scale);
  const a = ease((frame - 14) / 34), b = ease((frame - 85) / 40);
  const bob = Math.sin(frame / 18) * 6;
  return (
    <Body {...p}>
      <ScTxt x={0} y={30} t={label} size={33} />
      <ContactShadow x={165 + a * 30} y={392} w={230 - bob * 3} opacity={0.34} />
      <ScCrystal x={165 + a * 30} y={245 + bob} r={122} frame={frame} ow={ow} glow={0.5} tilt={Math.sin(frame / 40) * 3} />
      <ScDuo d="M400,60 V480" c={SC.red} w={ow * 1.5} ow={ow * 0.5} dash={`${ow * 1.2} ${ow * 4.4}`} />
      <ScDuo d={`M40,420 H${40 + b * 295}`} c={SC.copper} w={ow * 1.5} ow={ow * 0.6} opacity={b > 0.01 ? 1 : 0} />
      <ScTxt x={0} y={515} t={status} size={28} />
    </Body>
  );
};
