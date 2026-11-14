import React from 'react';
import {M} from '../../lib/scale';
import {light, line, mix, shade} from '../color';
import {ContactShadow, Glow, useUid} from '../Kit';
import type {Place} from '../machines';

/**
 * CIVICS, LOOK V2 (November 14th, 2026).
 *
 * The places where a rule on this beat is made, from lib/civics.tsx, redrawn in the v2 idiom. The
 * Capitol with its pink granite dome, the Great Walk's diamond pavement, the county courthouse on its
 * square, the hearing dais, the witness table and the podium. Each one is round, lit from the upper
 * left, outlined in its own deep hue, grounded with a contact shadow and alive on `frame` (a flag in
 * the wind, a clock that keeps time, a microphone light that comes on). These are buildings and
 * furniture, so none of them has a face.
 *
 * The library's two refusals hold here word for word. No six flags composite (only the current state
 * flag flies, on its own pole), and no contested monument on the courthouse square. The dais seal and
 * the podium seal carry a lone star and nothing else, and no plate or card carries a name.
 *
 * PLACEMENT is the library's. x and y sit at the ground, `scale` 1 is true size through the one metre
 * in lib/scale.ts. The Capitol and the courthouse keep the library's own plan in its own units (200
 * units to the star, 170 to the finial) inside a centimetre frame fitted to CIVIC_M (92.2 m and
 * 34 m), so a scale means the same here as there. The dais, the table and the podium are drawn
 * straight in centimetres (bench top 1.55 m, table 0.75 m, reading surface 1.22 m). The dais `width`
 * is in centimetres here, defaulting to the library's true 4.65 m. `GreatWalkV2` is a ground treatment
 * in screen units, as the library's is.
 */
const CM = M / 100;
type Pt = [number, number];
const at = (p: Place) =>
  `translate(${p.x ?? 0} ${p.y ?? 0}) scale(${(p.scale ?? 1) * CM * (p.facing ?? 1)} ${(p.scale ?? 1) * CM})`;
/** half the film line width in a drawing's centimetres, so the outline reads about 6.8 film pixels */
const owOf = (p: Place) => 3.4 / ((p.scale ?? 1) * CM);
const f1 = (p: Pt) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
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
/** an arched opening, round headed, standing on its sill at y */
const arch = (x: number, y: number, w: number, h: number) =>
  `M${x} ${y} V${y - h + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y - h + w / 2} V${y} Z`;
/** a five point star path centred at (0, 0) */
const star = (r: number, r2 = r * 0.42) => {
  const pts: Pt[] = Array.from({length: 10}, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, q = i % 2 ? r2 : r;
    return [Math.cos(a) * q, Math.sin(a) * q];
  });
  return roundPoly(pts, r * 0.08);
};

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

/**
 * A LIVE OAK in the drawing's own units. A short dark trunk and a broad low crown of round lobes,
 * outlined as one shape and lit from the upper left, swaying a little on `frame`. `r` is the crown's
 * half width.
 */
const LiveOak: React.FC<{x: number; r: number; ow: number; frame: number; seed: number; c?: string}> = ({x, r, ow, frame, seed, c = '#4c8a3e'}) => {
  const id = useUid();
  const bark = '#5a3e2c';
  const sway = Math.sin(frame / 30 * 1.1 + seed) * r * 0.012;
  const lobes: [number, number, number][] = [[-0.62, -0.78, 0.4], [-0.3, -1.02, 0.46], [0.08, -1.1, 0.5], [0.44, -0.98, 0.44],
    [0.7, -0.74, 0.36], [-0.18, -0.72, 0.42], [0.3, -0.7, 0.42]];
  return (
    <g transform={`translate(${x} 0)`}>
      <defs><radialGradient id={`${id}-l`} cx="34%" cy="22%" r="85%"><stop offset="0%" stopColor={light(c, 0.42)} />
        <stop offset="55%" stopColor={c} /><stop offset="100%" stopColor={shade(c, 0.42)} /></radialGradient></defs>
      <ContactShadow x={0} y={0} w={r * 2.2} opacity={0.3} />
      <Pass ow={ow} list={[
        tb(`M${-r * 0.04} 0 Q${-r * 0.06} ${-r * 0.3} ${-r * 0.36} ${-r * 0.62}`, bark, r * 0.1),
        tb(`M${r * 0.04} 0 Q${r * 0.1} ${-r * 0.32} ${r * 0.4} ${-r * 0.6}`, bark, r * 0.1),
        tb(`M0 0 L0 ${-r * 0.7}`, bark, r * 0.14),
      ]} />
      <g transform={`translate(${sway} 0)`}>
        {lobes.map(([lx, ly, lr], i) => <circle key={`o${i}`} cx={lx * r} cy={ly * r + (seed % 3) * r * 0.01} r={lr * r + ow} fill={line(c)} />)}
        {lobes.map(([lx, ly, lr], i) => <circle key={i} cx={lx * r} cy={ly * r + (seed % 3) * r * 0.01} r={lr * r} fill={`url(#${id}-l)`} />)}
        {lobes.slice(1, 4).map(([lx, ly, lr], i) => <ellipse key={`h${i}`} cx={(lx - lr * 0.3) * r} cy={(ly - lr * 0.45) * r} rx={lr * r * 0.42}
          ry={lr * r * 0.2} fill={light(c, 0.65)} opacity={0.4} />)}
      </g>
    </g>
  );
};

/**
 * THE STATE FLAG on its own pole, in the drawing's units, waving on `frame`. A blue bar at the hoist
 * with one white star, white over red in the fly. `h` is the pole and `fw` the flag's length.
 */
const StateFlag: React.FC<{x: number; h: number; fw: number; ow: number; frame: number}> = ({x, h, fw, ow, frame}) => {
  const t = frame / 30, fh = fw * 2 / 3, top = -h + fw * 0.06;
  const N = 12;
  const pt = (u: number, v: number): Pt => {
    const amp = fw * 0.07 * u;
    const ph = u * Math.PI * 2.2 - t * 5.2;
    return [x + u * fw, top + v * fh + Math.sin(ph) * amp + u * fw * 0.04];
  };
  const region = (u0: number, u1: number, v0: number, v1: number) => {
    const topE = Array.from({length: N + 1}, (_, i) => pt(u0 + (u1 - u0) * i / N, v0));
    const botE = Array.from({length: N + 1}, (_, i) => pt(u1 - (u1 - u0) * i / N, v1));
    return `M${topE.map(f1).join(' L')} L${botE.map(f1).join(' L')} Z`;
  };
  const whole = region(0, 1, 0, 1);
  const sc = pt(1 / 6, 0.5);
  const shadeBand = Array.from({length: 3}, (_, k) => {
    const u = ((t * 0.83 + k / 3) % 1);
    return u;
  });
  return (
    <g>
      <Pass ow={ow} list={[tb(`M${x} 0 L${x} ${-h}`, '#c9cfdc', fw * 0.05), pc(whole, '#ffffff', '#c9cfdc')]} />
      <path d={region(1 / 3, 1, 0, 0.5)} fill="#f6f2ea" />
      <path d={region(1 / 3, 1, 0.5, 1)} fill="#d22a3a" />
      <path d={region(0, 1 / 3, 0, 1)} fill="#22408f" />
      <path d={star(fh * 0.17)} transform={`translate(${sc[0].toFixed(1)} ${sc[1].toFixed(1)})`} fill="#ffffff" />
      {shadeBand.map((u, i) => <path key={i} d={region(Math.max(0, u - 0.06), Math.min(1, u + 0.06), 0, 1)} fill="#2b1d5e" opacity={0.14} />)}
      <circle cx={x} cy={-h - fw * 0.05} r={fw * 0.06} fill="#f2c14a" stroke={line('#f2c14a')} strokeWidth={ow} />
    </g>
  );
};

// ============================================================================ the capitol

/**
 * THE CAPITOL, with its dome PINK, because it is sunset-red granite from Marble Falls and drawing it
 * white is the most common Texas mistake there is. Long low wings, a centre block with a portico,
 * the drum with its columns, the ribbed dome, the lantern, and the Goddess of Liberty holding the gold
 * star up at arm's length, the star catching the light on `frame`. The state flag flies on its own pole
 * on the south lawn, and live oaks stand on the grounds. `lit` floods the dome and lights the windows.
 */
export const CapitolV2: React.FC<Place & {lit?: boolean}> = (p) => {
  const {frame = 0, lit = false} = p;
  const id = useUid();
  const U = (92.2 * 100) / 200;                  // centimetres per library unit, 200 units to the star
  const ow = owOf(p) / U;
  const pink = '#d98a76', trim = '#efc7b4', glass = lit ? '#ffd88a' : '#4e5f86';
  const tw = 0.6 + Math.sin(frame / 9) * 0.4;
  const win = (x0: number, x1: number, y: number, h: number, n: number) => Array.from({length: n}, (_, i) => {
    const wx = x0 + (i + 0.5) * ((x1 - x0) / n);
    return <path key={`${y}-${i}`} d={arch(wx - 2.6, y, 5.2, h)} fill={glass} opacity={0.92} />;
  });
  return (
    <g transform={at(p)}>
      <g transform={`scale(${U})`}>
        <defs>
          <Lit id={`${id}-w`} c={pink} /><Lit id={`${id}-t`} c={trim} x2={0.2} />
          <radialGradient id={`${id}-d`} cx="32%" cy="30%" r="80%"><stop offset="0%" stopColor={light(pink, 0.55)} />
            <stop offset="50%" stopColor={pink} /><stop offset="100%" stopColor={shade(pink, 0.42)} /></radialGradient>
        </defs>
        <ContactShadow x={0} y={0} w={300} opacity={0.3} />
        {/* live oaks on the grounds, behind the wings at each end */}
        <LiveOak x={-128} r={18} ow={ow} frame={frame} seed={3} />
        <LiveOak x={134} r={15} ow={ow} frame={frame} seed={5} />
        {/* the wings and the centre block, one joined silhouette */}
        <Pass ow={ow} list={[
          pc(roundPoly([[-118, 0], [-118, -38], [-112, -42], [-40, -42], [-40, -54], [40, -54], [40, -42], [112, -42], [118, -38], [118, 0]],
            [2, 2, 2, 2, 2, 2, 2, 2, 2, 2]), `url(#${id}-w)`, pink),
          pc(rr(-40, -86, 80, 40, 3), `url(#${id}-w)`, pink),
          pc(rr(-31, -126, 62, 30, 3), `url(#${id}-w)`, pink),
        ]} />
        {/* the cornice lines, which read the building as stone rather than as a box */}
        {[-42, -54].map((y) => <path key={y} d={`M${y === -42 ? -116 : -40} ${y + 1.4} H${y === -42 ? 116 : 40}`} stroke={trim} strokeWidth={1.6}
          strokeLinecap="round" opacity={0.9} />)}
        <path d="M-116 -20 H116" stroke={shade(pink, 0.2)} strokeWidth={0.8} opacity={0.5} />
        {win(-114, -42, -24, 12, 7)}{win(42, 114, -24, 12, 7)}
        {win(-114, -42, -4, 11, 7)}{win(42, 114, -4, 11, 7)}
        {win(-38, 38, -62, 10, 6)}
        {/* the portico, a pediment on columns */}
        <Pass ow={ow} list={[
          pc(roundPoly([[-28, -84], [0, -101], [28, -84]], [2, 3, 2]), `url(#${id}-t)`, trim),
          ...[-21, -10.5, 0, 10.5, 21].map((cx) => pc(rr(cx - 2.6, -84, 5.2, 38, 2), `url(#${id}-t)`, trim)),
        ]} />
        <path d="M-12 -88 L0 -95 L12 -88" stroke={shade(trim, 0.25)} strokeWidth={0.9} fill="none" strokeLinecap="round" />
        {/* the drum and its columns */}
        {[-24, -12, 0, 12, 24].map((cx) => <path key={cx} d={rr(cx - 2.2, -123, 4.4, 24, 2)} fill={light(trim, 0.2)}
          stroke={line(trim)} strokeWidth={ow * 0.6} />)}
        {[-18, -6, 6, 18].map((cx) => <path key={cx} d={arch(cx - 2, -102, 4, 14)} fill={glass} opacity={0.9} />)}
        {/* THE DOME. Pink. Not white. */}
        <Pass ow={ow} list={[
          pc('M-34 -125 C-34 -163 34 -163 34 -125 Q0 -121 -34 -125 Z', `url(#${id}-d)`, pink),
          pc(rr(-8, -170, 16, 15, 3), `url(#${id}-w)`, pink),
          pc('M-10 -169 C-10 -181 10 -181 10 -169 Z', `url(#${id}-d)`, pink),
        ]} />
        {[-24, -12, 0, 12, 24].map((rx) => <path key={rx} d={`M${rx * 1.08} -125 C${rx} -144 ${rx * 0.5} -154 0 -157`} stroke={shade(pink, 0.3)}
          strokeWidth={0.9} fill="none" opacity={0.6} />)}
        <Sheen d="M-27 -134 C-25 -148 -14 -155 -4 -156" w={3.4} o={0.55} />
        {[-6, 0, 6].map((cx) => <path key={cx} d={arch(cx - 1.4, -158, 2.8, 8)} fill={glass} opacity={0.9} />)}
        <path d="M-35 -125 H35" stroke={trim} strokeWidth={2.2} strokeLinecap="round" />
        {/* THE GODDESS OF LIBERTY, a statue in a silhouette at this distance, the gold star held up */}
        <g transform="translate(0 -180)">
          <Pass ow={ow * 0.6} list={[
            pc('M-2.6 0 Q-3 -9 -1.4 -12 L1.4 -12 Q3 -9 2.6 0 Z', '#e9e0cc', '#c9bfa8'),
            pc(ell(0, -14.4, 2.4, 2.6), '#e9e0cc', '#c9bfa8'),
            tb('M1.4 -12 L7 -20', '#e9e0cc', 1.8),
          ]} />
          <Glow x={8} y={-24} r={9 + tw * 3} color="#ffe28a" opacity={0.5 + tw * 0.2} />
          <path d={star(5)} transform="translate(8 -24)" fill="#f2c14a" stroke={line('#f2c14a')} strokeWidth={ow * 0.6} />
        </g>
        {lit && <Glow x={0} y={-140} r={70} color="#ffd8a8" opacity={0.35 + Math.sin(frame / 40) * 0.05} />}
        {/* the steps up the south front */}
        <path d={rr(-22, -4, 44, 4, 1.5)} fill={light(trim, 0.1)} stroke={line(trim)} strokeWidth={ow * 0.6} />
        <StateFlag x={-66} h={34} fw={13} ow={ow} frame={frame} />
      </g>
    </g>
  );
};

// ============================================================================ the great walk

/**
 * THE GREAT WALK's pavement, black and white diamonds in rows that recede, each diamond rounded and
 * lit, the grout in each stone's own deep hue and a granite curb at the front. Late sun slides across
 * it on `frame`. A ground treatment in screen units, so it takes a width and a row count.
 */
export const GreatWalkV2: React.FC<{x?: number; y?: number; w?: number; rows?: number; frame?: number}> = ({
  x = 0, y = 0, w = 600, rows = 6, frame = 0,
}) => {
  const id = useUid();
  const dark = '#2f2c4a', pale = '#f4ede0', curb = '#c9b9a8';
  // a flat plan of square diamonds set on the point, seen in perspective, so the rows interlock and recede
  const across = 14, a = w / across / 2, lat = rows * 2, D = lat * a, dist = D * 1.6, Hs = rows * 15;
  const P = (X: number, Z: number): Pt => [X * dist / (dist + Z), -Hs * (Z / (Z + dist)) * ((D + dist) / D)];
  const tiles: React.ReactNode[] = [];
  for (let r = lat; r >= 0; r--) {
    const fade = (r / lat) * 0.45;
    const dk = r % 2 === 1;
    const col = mix(dk ? dark : pale, '#cfc8e6', fade);
    for (let c = -across; c <= across; c++) {
      const X = (c + (r % 2) / 2) * a * 2, Z = r * a;
      if (Math.abs(X) > w / 2 + a * 2) continue;
      const q = [P(X, Z - a), P(X + a, Z), P(X, Z + a), P(X - a, Z)];
      tiles.push(<path key={`${r}-${c}`} d={roundPoly(q, a * 0.22)} fill={col} stroke={line(col)} strokeWidth={1.3} />);
      if (!dk) tiles.push(<path key={`h${r}-${c}`} d={`M${f1(P(X - a * 0.55, Z + a * 0.1))} L${f1(P(X, Z + a * 0.6))}`} stroke="#ffffff"
        strokeWidth={1.6} strokeLinecap="round" opacity={0.55 * (1 - fade)} />);
    }
  }
  const nl = P(-w / 2, 0), nr = P(w / 2, 0), fl = P(-w / 2, D), fr = P(w / 2, D);
  const glintX = ((frame * 5) % (w * 1.8)) - w * 0.9;
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <Lit id={`${id}-p`} c={pale} x2={0.6} />
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#fff4d0" stopOpacity={0} />
          <stop offset="50%" stopColor="#fff4d0" stopOpacity={0.45} /><stop offset="100%" stopColor="#fff4d0" stopOpacity={0} /></linearGradient>
        <clipPath id={`${id}-c`}><path d={`M${f1(nl)} L${f1(nr)} L${f1(fr)} L${f1(fl)} Z`} /></clipPath>
      </defs>
      <g clipPath={`url(#${id}-c)`}>
        {tiles}
        <path d={`M${glintX - 70} 0 L${glintX} ${-Hs - 10} L${glintX + 70} ${-Hs - 10} L${glintX} 0 Z`} fill={`url(#${id}-g)`} />
      </g>
      <path d={`M${f1(nl)} L${f1(fl)} M${f1(nr)} L${f1(fr)}`} stroke={line(curb)} strokeWidth={3} strokeLinecap="round" />
      <path d={rr(-w / 2 - 8, -2, w + 16, 14, 7)} fill={`url(#${id}-p)`} stroke={line(curb)} strokeWidth={3} />
      <path d={`M${-w / 2 + 6} 1 H${w / 2 - 6}`} stroke="#fffbef" strokeWidth={3} opacity={0.5} strokeLinecap="round" />
    </g>
  );
};

// ============================================================================ the courthouse

/**
 * THE COUNTY COURTHOUSE on its square. A heavy Romanesque block in warm sandstone with limestone bands,
 * arched windows and the deep entrance arch, and the tower CENTRED over it with a clock that keeps time
 * on `frame` (`clockHour` sets the hour it starts at), a slate mansard cap and a finial. The live oaks
 * are DELIBERATELY ASYMMETRIC, as a real square grew them, the state flag flies on the lawn, and the
 * contested monument some squares carry is not drawn, as the library decided.
 */
export const CourthouseV2: React.FC<Place & {clockHour?: number}> = (p) => {
  const {frame = 0, clockHour = 10.6} = p;
  const id = useUid();
  const U = (34 * 100) / 170;                     // centimetres per library unit, 170 units to the finial
  const ow = owOf(p) / U;
  const stone = '#c47a52', band = '#f0dcbc', slate = '#5c5a86', glass = '#4c5c88';
  const hr = clockHour + frame / 30 / 60;         // the hour hand creeps, the minute hand visibly moves
  const ha = (hr / 12) * Math.PI * 2 - Math.PI / 2, ma = ((hr % 1) * Math.PI * 2) - Math.PI / 2;
  return (
    <g transform={at(p)}>
      <g transform={`scale(${U})`}>
        <defs>
          <Lit id={`${id}-s`} c={stone} /><Lit id={`${id}-b`} c={band} x2={0.2} /><Lit id={`${id}-r`} c={slate} x2={0.5} />
          <Rad id={`${id}-c`} c="#fbf4e4" k={0.6} />
        </defs>
        <ContactShadow x={0} y={0} w={240} opacity={0.3} />
        {/* the oaks behind the far corners, uneven on purpose */}
        <LiveOak x={-120} r={26} ow={ow} frame={frame} seed={2} />
        <LiveOak x={-150} r={18} ow={ow} frame={frame} seed={7} c="#5a9440" />
        {/* the block and the tower, one joined silhouette */}
        <Pass ow={ow} list={[
          pc(roundPoly([[-92, 0], [-92, -56], [-58, -56], [-58, -72], [58, -72], [58, -56], [92, -56], [92, 0]], 3), `url(#${id}-s)`, stone),
          pc(rr(-24, -126, 48, 58, 3), `url(#${id}-s)`, stone),
          pc(roundPoly([[-27, -126], [27, -126], [22, -150], [0, -168], [-22, -150]], [3, 3, 4, 3, 4]), `url(#${id}-r)`, slate),
        ]} />
        {/* the limestone bands */}
        {[[-92, 92, -38], [-92, 92, -54], [-58, 58, -70], [-24, 24, -108], [-24, 24, -124]].map(([a, b, yy], i) =>
          <path key={i} d={rr(a + 1, yy - 1.6, b - a - 2, 3.2, 1.6)} fill={`url(#${id}-b)`} />)}
        {/* arched windows, two storeys, with a glint of sky in the glass */}
        {Array.from({length: 12}, (_, i) => -86 + i * 15).filter((wx) => Math.abs(wx + 5) > 18).map((wx) => <g key={wx}>
          <path d={arch(wx, -8, 9, 22)} fill={glass} stroke={line(stone)} strokeWidth={ow * 0.5} />
          <path d={arch(wx, -42, 9, 10)} fill={glass} stroke={line(stone)} strokeWidth={ow * 0.5} />
          <path d={`M${wx + 2.4} -12 V${-22}`} stroke="#9fb4e6" strokeWidth={1.4} strokeLinecap="round" opacity={0.7} />
        </g>)}
        {[-46, -32, -18, 18, 32, 46].map((wx) => <path key={wx} d={arch(wx - 4, -58, 8, 12)} fill={glass} />)}
        {/* the entrance arch, deep, with its steps */}
        <path d={arch(-14, 0, 28, 34)} fill="#3a3658" stroke={line(stone)} strokeWidth={ow * 0.7} />
        <path d="M-19 -20 A19 19 0 0 1 19 -20" fill="none" stroke={band} strokeWidth={4} strokeLinecap="round" />
        <path d={arch(-6, 0, 12, 22)} fill="#f6c766" opacity={0.25} />
        <path d={rr(-22, -3, 44, 3, 1.4)} fill={band} stroke={line(band)} strokeWidth={ow * 0.5} />
        {/* the tower's own arched openings */}
        {[-14, 0, 14].map((wx) => <path key={wx} d={arch(wx - 4, -82, 8, 20)} fill={glass} />)}
        {/* THE CLOCK, keeping time */}
        <g transform="translate(0 -138)">
          <circle r={13 + ow} fill={line('#fbf4e4')} />
          <circle r={13} fill={`url(#${id}-c)`} />
          {Array.from({length: 12}, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <circle key={i} cx={Math.cos(a) * 10.2} cy={Math.sin(a) * 10.2} r={0.9} fill="#3a3658" />;
          })}
          <path d={`M0 0 L${Math.cos(ha) * 6.4} ${Math.sin(ha) * 6.4}`} stroke="#2e2a4a" strokeWidth={2} strokeLinecap="round" />
          <path d={`M0 0 L${Math.cos(ma) * 9.6} ${Math.sin(ma) * 9.6}`} stroke="#2e2a4a" strokeWidth={1.3} strokeLinecap="round" />
          <circle r={1.4} fill="#2e2a4a" />
        </g>
        <Sheen d="M-20 -146 Q-12 -158 -2 -164" w={2.2} o={0.4} />
        <Pass ow={ow * 0.7} list={[tb('M0 -168 L0 -176', '#d9b552', 1.8)]} />
        <circle cx={0} cy={-177} r={2} fill="#f2c14a" stroke={line('#f2c14a')} strokeWidth={ow * 0.5} />
        {/* the near oak in front of the east corner, the asymmetry that makes it a real square */}
        <LiveOak x={128} r={30} ow={ow} frame={frame} seed={4} c="#468236" />
        <StateFlag x={68} h={46} fw={16} ow={ow} frame={frame} />
      </g>
    </g>
  );
};

// ============================================================================ the hearing dais

/**
 * THE HEARING DAIS, where a rule on this beat is made or refused. A raised platform, a panelled bench
 * front in warm walnut, an overhanging writing surface at 1.55 m, and the seal with a lone star on the
 * front. One name plate and one gooseneck microphone per seat (`seats`), each microphone with a light
 * on its tip, and the light moves from seat to seat on `frame` as the members take turns speaking.
 * The plates are blank because a name is a claim about the room.
 */
export const HearingDaisV2: React.FC<Place & {seats?: number; seal?: boolean; width?: number}> = (p) => {
  const {frame = 0, seats = 3, seal = true, width = 465} = p;
  const id = useUid(), ow = owOf(p);
  const wood = '#8f5a34', dark = '#5e3a26', w = width, hw = w / 2;
  const speaking = Math.floor(frame / 45) % Math.max(1, seats);
  const panels = Math.max(2, Math.round(w / 80));
  return (
    <g transform={at(p)}>
      <defs><Lit id={`${id}-w`} c={wood} /><Lit id={`${id}-k`} c={dark} /><Lit id={`${id}-t`} c={light(wood, 0.25)} x2={0.1} />
        <Rad id={`${id}-s`} c="#efe2c4" k={0.6} /></defs>
      <ContactShadow x={0} y={0} w={w * 1.2} opacity={0.32} />
      <Pass ow={ow} list={[
        pc(rr(-hw - 22, -40, w + 44, 40, 8), `url(#${id}-k)`, dark),
        pc(rr(-hw, -146, w, 110, 10), `url(#${id}-w)`, wood),
        pc(rr(-hw - 12, -156, w + 24, 14, 7), `url(#${id}-t)`, wood),
      ]} />
      {/* the panels, inset and rounded, each catching light on its upper left edge */}
      {Array.from({length: panels}, (_, i) => {
        const pw = (w - 40) / panels, px = -hw + 20 + i * pw;
        return <g key={i}>
          <path d={rr(px + 6, -132, pw - 12, 80, 10)} fill={shade(wood, 0.12)} stroke={line(wood)} strokeWidth={ow * 0.5} />
          <path d={`M${px + 14} -60 V-122 Q${px + 14} -126 ${px + 20} -126 H${px + pw - 22}`} stroke={light(wood, 0.45)} strokeWidth={3}
            fill="none" strokeLinecap="round" opacity={0.7} />
        </g>;
      })}
      <path d={`M${-hw - 18} -36 H${hw + 18}`} stroke={light(dark, 0.4)} strokeWidth={3} strokeLinecap="round" opacity={0.6} />
      <Sheen d={`M${-hw} -151 H${hw * 0.4}`} w={4} o={0.5} />
      {seal && <g transform="translate(0 -92)">
        <circle r={31 + ow} fill={line('#d9b552')} />
        <circle r={31} fill="#d9b552" />
        <circle r={25} fill={`url(#${id}-s)`} />
        <path d={star(17)} fill="#22408f" stroke={line('#22408f')} strokeWidth={ow * 0.5} />
        <path d="M-18 -10 A21 21 0 0 1 4 -21" stroke="#ffffff" strokeWidth={3} fill="none" opacity={0.6} strokeLinecap="round" />
      </g>}
      {/* name plates and microphones, one per seat */}
      {Array.from({length: seats}, (_, i) => {
        const sx = -hw + (w / (seats + 1)) * (i + 1);
        const on = i === speaking;
        const bend = Math.sin(i * 1.7) * 6;
        return <g key={i} transform={`translate(${sx.toFixed(1)} -156)`}>
          <Pass ow={ow * 0.8} list={[
            pc(roundPoly([[-30, 0], [30, 0], [24, -16], [-24, -16]], 4), `url(#${id}-k)`, dark),
            tb(`M${14} -2 Q${18 + bend} -30 ${4 + bend} -48`, '#3b3a52', 3),
          ]} />
          <path d={rr(-19, -12, 38, 8, 3)} fill="#f2e6cc" />
          <path d={rr(-6 + bend, -56, 18, 11, 5.5)} transform={`rotate(-24 ${3 + bend} -50)`} fill="#3b3a52" stroke={line('#3b3a52')}
            strokeWidth={ow * 0.7} />
          <circle cx={11 + bend} cy={-56} r={3.4} fill={on ? '#ff4b5c' : '#6a5a6e'} />
          {on && <Glow x={11 + bend} y={-56} r={14} color="#ff6b6b" opacity={0.6} />}
        </g>;
      })}
      {/* a water carafe and a glass at the end of the bench */}
      <g transform={`translate(${hw - 26} -156)`}>
        <path d="M-8 0 Q-11 -14 -5 -22 L-5 -30 L5 -30 L5 -22 Q11 -14 8 0 Z" fill="#cfe6f6" fillOpacity={0.6} stroke={line('#cfe6f6')} strokeWidth={ow * 0.6} />
        <path d="M-7 -2 Q-9 -10 -6 -14 L6 -14 Q9 -10 7 -2 Z" fill="#9fd0ee" opacity={0.6} />
        <path d="M-4 -24 V-6" stroke="#ffffff" strokeWidth={2} opacity={0.7} strokeLinecap="round" />
      </g>
    </g>
  );
};

// ============================================================================ the witness table

/**
 * THE WITNESS TABLE, the other side of the room. A table at 0.75 m with its modesty panel, the
 * witness's chair back behind it, a microphone with its light, a blank name card, a glass of water,
 * and THE STACK, whose height (`pages`) is the whole argument in a story about a comment period. The
 * top sheet lifts a little in the room's air on `frame`.
 */
export const WitnessTableV2: React.FC<Place & {pages?: number; card?: boolean}> = (p) => {
  const {frame = 0, pages = 40, card = true} = p;
  const id = useUid(), ow = owOf(p);
  const wood = '#8a6440', chair = '#6a3a2a', paper = '#fbf6ea';
  const stack = Math.min(34, Math.sqrt(Math.max(0, pages)) * 2.55);
  const lift = Math.max(0, Math.sin(frame / 20)) * 4;
  const micOn = Math.floor(frame / 40) % 2 === 0;
  return (
    <g transform={at(p)}>
      <defs><Lit id={`${id}-w`} c={wood} /><Lit id={`${id}-t`} c={light(wood, 0.2)} x2={0.1} /><Lit id={`${id}-c`} c={chair} />
        <Lit id={`${id}-p`} c={paper} x2={0.2} k={0.6} /></defs>
      <ContactShadow x={0} y={0} w={170} opacity={0.32} />
      {/* the chair back, behind, padded and round, which says somebody sits here to answer */}
      <Pass ow={ow} list={[pc(rr(-20, -98, 40, 40, 14), `url(#${id}-c)`, chair)]} />
      <path d="M-12 -91 Q-4 -94 6 -92" stroke={light(chair, 0.5)} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.6} />
      <Pass ow={ow} list={[
        pc(rr(-63, -72, 8, 70, 4), `url(#${id}-w)`, wood), pc(rr(55, -72, 8, 70, 4), `url(#${id}-w)`, wood),
        pc(rr(-60, -70, 120, 30, 5), `url(#${id}-w)`, wood),
        pc(rr(-68, -78, 136, 8, 4), `url(#${id}-t)`, wood),
      ]} />
      <path d="M-48 -64 H48" stroke={light(wood, 0.4)} strokeWidth={1.6} opacity={0.6} strokeLinecap="round" />
      <Sheen d="M-62 -75 H20" w={2.4} o={0.55} />
      {/* THE STACK. Its height is the argument. */}
      {stack > 1.5 && <g transform="translate(-30 -78)">
        <Pass ow={ow * 0.8} list={[pc(rr(-17, -stack, 34, stack, 2), `url(#${id}-p)`, '#d8cfb8')]} />
        {Array.from({length: Math.min(12, Math.round(stack / 2.6))}, (_, i) => <path key={i} d={`M-15 ${-2 - i * 2.6} H${15 - (i % 3)}`} stroke="#d8cfb8"
          strokeWidth={0.8} />)}
        <path d={`M-17 ${-stack} L17 ${-stack} L17 ${-stack - 0.5} Q4 ${-stack - lift * 1.2} -15 ${-stack - lift} Z`} fill={paper}
          stroke={line('#d8cfb8')} strokeWidth={ow * 0.5} />
      </g>}
      {/* the microphone on its gooseneck */}
      <Pass ow={ow * 0.8} list={[pc(ell(22, -79, 8, 2.4), '#3b3a52', '#3b3a52'), tb('M22 -80 Q26 -96 16 -106', '#3b3a52', 1.8)]} />
      <path d={rr(9, -112, 12, 7, 3.5)} transform="rotate(-30 15 -108)" fill="#3b3a52" stroke={line('#3b3a52')} strokeWidth={ow * 0.6} />
      <circle cx={21} cy={-111} r={1.8} fill={micOn ? '#ff4b5c' : '#6a5a6e'} />
      {micOn && <Glow x={21} y={-111} r={7} color="#ff6b6b" opacity={0.55} />}
      {/* the glass of water and the blank name card */}
      <path d="M36 -78 L35 -92 L45 -92 L44 -78 Z" fill="#cfe6f6" fillOpacity={0.55} stroke={line('#cfe6f6')} strokeWidth={ow * 0.5} />
      <path d={`M35.4 -87 Q40 ${-88 + Math.sin(frame / 8)} 44.6 -87 L44 -78 L36 -78 Z`} fill="#9fd0ee" opacity={0.6} />
      {card && <Pass ow={ow * 0.7} list={[pc(roundPoly([[48, -78], [64, -78], [60, -90], [52, -90]], 1.5), paper, '#d8cfb8')]} />}
    </g>
  );
};

// ============================================================================ the podium

/**
 * THE PODIUM, for a press conference, an announcement or a bill signing. A tapered lectern in warm
 * wood with a slanted reading top at 1.22 m, a seal panel whose star takes `sealColor` so the same
 * object serves an agency, a county or a company without pretending to be one, and a cluster of
 * microphones (`mics`) in plain coloured windscreens with no station marks. The cluster settles a
 * little on `frame` and one light blinks.
 */
export const PodiumV2: React.FC<Place & {sealColor?: string; mics?: number}> = (p) => {
  const {frame = 0, sealColor = '#1d2a4a', mics = 3} = p;
  const id = useUid(), ow = owOf(p);
  const wood = '#8a5a36', FOAM = ['#3b3a52', '#d23a4a', '#2f6fd1', '#3b3a52', '#e8a13a'];
  const sealC = mix(sealColor, '#3b5bd0', 0.25);
  return (
    <g transform={at(p)}>
      <defs><Lit id={`${id}-w`} c={wood} /><Lit id={`${id}-t`} c={light(wood, 0.2)} x2={0.1} /><Rad id={`${id}-s`} c="#efe2c4" k={0.6} /></defs>
      <ContactShadow x={0} y={0} w={110} opacity={0.32} />
      <Pass ow={ow} list={[
        pc(rr(-34, -8, 68, 8, 4), `url(#${id}-w)`, wood),
        pc(roundPoly([[-29, -6], [-21, -104], [21, -104], [29, -6]], 6), `url(#${id}-w)`, wood),
        pc(roundPoly([[-38, -102], [38, -102], [42, -120], [-42, -124]], 5), `url(#${id}-t)`, wood),
      ]} />
      <path d="M-22 -14 L-16 -96" stroke={light(wood, 0.5)} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
      <path d="M15 -96 L22 -14" stroke={shade(wood, 0.3)} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
      <Sheen d="M-36 -117 L18 -120" w={3} o={0.5} />
      <g transform="translate(0 -62)">
        <circle r={17 + ow} fill={line('#d9b552')} />
        <circle r={17} fill="#d9b552" />
        <circle r={13.5} fill={`url(#${id}-s)`} />
        <path d={star(9.5)} fill={sealC} stroke={line(sealC)} strokeWidth={ow * 0.4} />
      </g>
      {Array.from({length: mics}, (_, i) => {
        const a = -16 + i * (32 / Math.max(1, mics - 1)), wob = Math.sin(frame / 14 + i * 2) * 1.2;
        const c = FOAM[i % FOAM.length];
        const tip: Pt = [a * 0.9 + wob, -150 - (i % 2) * 4];
        return <g key={i}>
          <Pass ow={ow * 0.7} list={[tb(`M${a * 0.5} -122 Q${a * 0.7} -138 ${f1(tip)}`, '#3b3a52', 1.6)]} />
          <path d={rr(tip[0] - 4.5, tip[1] - 10, 9, 13, 4.5)} fill={c} stroke={line(c)} strokeWidth={ow * 0.6} />
          <ellipse cx={tip[0] - 1.4} cy={tip[1] - 6} rx={1.4} ry={2.6} fill="#ffffff" opacity={0.4} />
        </g>;
      })}
      {Math.floor(frame / 24) % 2 === 0 && <circle cx={-1} cy={-139} r={1.4} fill="#ff4b5c" />}
    </g>
  );
};

export const CIVICS_V2 = ['CapitolV2', 'GreatWalkV2', 'CourthouseV2', 'HearingDaisV2', 'WitnessTableV2', 'PodiumV2'] as const;
