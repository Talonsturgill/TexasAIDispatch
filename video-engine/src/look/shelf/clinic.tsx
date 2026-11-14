import React from 'react';
import {M} from '../../lib/scale';
import {FONT, widthOf} from '../../lib/type';
import {light, line, mix, shade} from '../color';
import {ContactShadow, Glow, useUid} from '../Kit';
import {Visor, type MachineMood, type Place} from '../machines';

/**
 * CLINIC, LOOK V2 (November 14th, 2026).
 *
 * The hospital set from lib/clinic.tsx, redrawn in the v2 idiom. A CT or linac gantry, the contour plan
 * the model lays down, the radiologist's reading station and the hospital towers of a medical centre.
 * Each one is round, lit from the upper left, outlined in its own deep hue, grounded with a contact
 * shadow and alive on `frame`. The colours match ClinicScreenV2 in look/machines.tsx (a cool white
 * shell, a deep navy screen, a mint trace and a green lamp), so the screen on its arm and these
 * machines sit in one room.
 *
 * The library's two rules hold. No patient is ever identifiable, and no screen shows a real anatomy.
 * The contour field is abstract by construction, a soft glow with nothing in it.
 *
 * PLACEMENT is the library's. x and y at the ground, `scale` 1 true size through lib/scale.ts, every
 * drawing in centimetres. The gantry, the station and the towers keep the library's researched
 * geometry, so each multiplies the library's own local unit into centimetres once (`U`) and draws its
 * numbers through that, which keeps the true size identical (a CT 1.98 m to the top, a 0.70 m bore a
 * metre up, the couch at 0.75 m, a linac 2.4 m, the desk at 0.73 m, a twelve floor tower 46 m).
 *
 * This file also holds the small screen kit the other three clinic set files share (`ClGlass`,
 * `ClPill`, `ClFace` and friends). Their names start with Cl so they never clash with another set.
 */
const CM = M / 100;
type Pt = [number, number];
const at = (p: Place) =>
  `translate(${p.x ?? 0} ${p.y ?? 0}) scale(${(p.scale ?? 1) * CM * (p.facing ?? 1)} ${(p.scale ?? 1) * CM})`;
/** half the film line width in a true size drawing's centimetres, about 6.8 film pixels of stroke */
const owOf = (p: Place) => 3.4 / ((p.scale ?? 1) * CM);
const rnd = (seed: number, ch: number) => {
  const k = ((seed * 2654435761) ^ (ch * 40503)) >>> 0;
  return ((k >>> 8) % 10000) / 10000;
};

// ============================================================================ the shared screen kit

/** half the film line width for a screen space drawing at `scale` */
export const clOw = (scale = 1) => 3.4 / Math.max(0.05, scale);
/** a rounded rectangle as a path, so it can join an outline pass */
export const clRR = (x: number, y: number, w: number, h: number, r: number) => {
  const q = Math.max(0, Math.min(r, w / 2, h / 2));
  return `M${x + q} ${y} H${x + w - q} A${q} ${q} 0 0 1 ${x + w} ${y + q} V${y + h - q} A${q} ${q} 0 0 1 ${x + w - q} ${y + h}`
    + ` H${x + q} A${q} ${q} 0 0 1 ${x} ${y + h - q} V${y + q} A${q} ${q} 0 0 1 ${x + q} ${y} Z`;
};
/** a closed smooth curve through points (Catmull-Rom as cubic Beziers), for blobs with no corner */
export const clSmooth = (pts: Pt[]) => {
  const n = pts.length;
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + ' Z';
};
/** a lit material, light at the upper left through the colour to violet shade at the lower right */
export const ClLit: React.FC<{id: string; c: string; v?: boolean; k?: number}> = ({id, c, v, k = 1}) => (
  <linearGradient id={id} x1="0" y1="0" x2={v ? '0' : '0.4'} y2="1">
    <stop offset="0%" stopColor={light(c, 0.42 * k)} /><stop offset="48%" stopColor={c} />
    <stop offset="100%" stopColor={shade(c, 0.34 * k)} />
  </linearGradient>
);
/** a soft blur, for glows and drop shadows. `user` measures the region in user space, which a straight
 * horizontal or vertical line needs, because its own bounding box has no height or no width to blur into. */
export const ClBlur: React.FC<{id: string; sd: number; user?: boolean}> = ({id, sd, user}) => user
  ? <filter id={id} filterUnits="userSpaceOnUse" x={-4000} y={-4000} width={12000} height={12000}><feGaussianBlur stdDeviation={sd} /></filter>
  : <filter id={id} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={sd} /></filter>;
/** bold body text, the one face for words drawn inside the world */
export const ClTxt: React.FC<{x: number; y: number; t: string; size?: number; fill?: string; anchor?: 'start' | 'middle' | 'end';
  weight?: number; spacing?: number; opacity?: number}> = ({x, y, t, size = 24, fill = '#f4f1ff', anchor = 'start', weight = 800,
  spacing = 0.6, opacity}) => (
  <text x={x} y={y} fontFamily={FONT.body} fontWeight={weight} fontSize={size} fill={fill} textAnchor={anchor}
    letterSpacing={spacing} opacity={opacity}>{t}</text>
);

/**
 * A LIT GLASS PANEL. A soft drop shadow, a hue-tinted outline, a body lit from the upper left, an inner
 * rim of light, a top sheen and, when `glow` is set, a soft halo of that colour. Children draw in panel
 * space (0, 0 at the top left), clipped to the inner face.
 */
export const ClGlass: React.FC<{x: number; y: number; w: number; h: number; r?: number; tint?: string; ow: number; glow?: string;
  glowK?: number; shadow?: boolean; children?: React.ReactNode; rot?: number}> = ({x, y, w, h, r = 34, tint = '#1d2758', ow, glow,
  glowK = 1, shadow = true, children, rot = 0}) => {
  const id = useUid();
  const d = clRR(0, 0, w, h, r);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <defs>
        <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0.45" y2="1">
          <stop offset="0%" stopColor={light(tint, 0.2)} /><stop offset="55%" stopColor={tint} /><stop offset="100%" stopColor={shade(tint, 0.3)} />
        </linearGradient>
        <linearGradient id={`${id}-s`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.26} /><stop offset="38%" stopColor="#ffffff" stopOpacity={0.04} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
        </linearGradient>
        <ClBlur id={`${id}-b`} sd={Math.max(w, h) * 0.035} />
        <ClBlur id={`${id}-g`} sd={ow * 3.2} />
        <clipPath id={`${id}-c`}><path d={d} /></clipPath>
      </defs>
      {shadow && <path d={d} transform={`translate(${w * 0.02} ${h * 0.05})`} fill="#160f38" opacity={0.36} filter={`url(#${id}-b)`} />}
      {glow && <path d={d} fill="none" stroke={glow} strokeWidth={ow * 3} opacity={0.55 * glowK} filter={`url(#${id}-g)`} />}
      <path d={d} fill={line(tint)} stroke={glow ?? line(tint)} strokeWidth={ow * 2} strokeLinejoin="round" />
      <path d={d} fill={`url(#${id}-f)`} />
      <g clipPath={`url(#${id}-c)`}>{children}</g>
      <path d={clRR(ow * 1.2, ow * 1.2, w - ow * 2.4, h - ow * 2.4, Math.max(2, r - ow))} fill="none" stroke={light(tint, 0.5)}
        strokeWidth={ow * 0.55} opacity={0.5} />
      <path d={d} fill={`url(#${id}-s)`} pointerEvents="none" />
    </g>
  );
};

/** A ROUNDED PILL with a word in it, centred on (x, y), sized from the text. */
export const ClPill: React.FC<{x: number; y: number; t: string; size?: number; fill?: string; ink?: string; ow: number; glow?: boolean;
  rot?: number; padX?: number}> = ({x, y, t, size = 22, fill = '#1d2758', ink = '#ffffff', ow, glow, rot = 0, padX}) => {
  const id = useUid();
  const w = widthOf(t, size, true) * 0.86 + (padX ?? size * 1.4), h = size * 2;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <defs><ClLit id={`${id}-l`} c={fill} v k={0.8} /><ClBlur id={`${id}-g`} sd={size * 0.5} /></defs>
      {glow && <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={fill} opacity={0.6} filter={`url(#${id}-g)`} />}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={`url(#${id}-l)`} stroke={line(fill)} strokeWidth={ow * 2} />
      <rect x={-w / 2 + h * 0.3} y={-h / 2 + h * 0.14} width={w - h * 0.6} height={h * 0.2} rx={h * 0.1} fill="#ffffff" opacity={0.22} />
      <ClTxt x={0} y={size * 0.36} t={t} size={size} fill={ink} anchor="middle" />
    </g>
  );
};

/**
 * A FRIENDLY PORTRAIT for a photo tile. Head and shoulders, centred on (0, 0), about `r` to the chin.
 * Deliberately nobody, a calm round face with the v2 eyes (white, dark pupil, catchlight) and a small
 * smile, the same shapes for everyone, so a capture tile reads as a face and never as a person.
 */
export const ClFace: React.FC<{r: number; skin?: string; hair?: string; shirt?: string; frame?: number; ow: number; seed?: number}> = ({
  r, skin = '#c98a5a', hair = '#2b1a12', shirt = '#3d7bd9', frame = 0, ow, seed = 1}) => {
  const id = useUid();
  const blink = (frame + seed * 23) % 96 < 4;
  const er = r * 0.17;
  return (
    <g>
      <defs><radialGradient id={`${id}-k`} cx="36%" cy="30%" r="80%"><stop offset="0%" stopColor={light(skin, 0.35)} />
        <stop offset="62%" stopColor={skin} /><stop offset="100%" stopColor={shade(skin, 0.3)} /></radialGradient>
        <ClLit id={`${id}-s`} c={shirt} /></defs>
      <path d={`M${-r * 1.55} ${r * 2.5} Q${-r * 1.5} ${r * 1.1} 0 ${r * 1.05} Q${r * 1.5} ${r * 1.1} ${r * 1.55} ${r * 2.5} Z`}
        fill={`url(#${id}-s)`} stroke={line(shirt)} strokeWidth={ow * 2} strokeLinejoin="round" />
      <rect x={-r * 0.3} y={r * 0.7} width={r * 0.6} height={r * 0.5} rx={r * 0.2} fill={shade(skin, 0.15)} />
      <circle r={r} fill={`url(#${id}-k)`} stroke={line(skin)} strokeWidth={ow * 2} />
      <path d={`M${-r * 0.98} ${-r * 0.1} Q${-r * 1.02} ${-r * 1.05} 0 ${-r * 1.04} Q${r * 1.02} ${-r * 1.05} ${r * 0.98} ${-r * 0.1}`
        + ` Q${r * 0.6} ${-r * 0.62} 0 ${-r * 0.6} Q${-r * 0.6} ${-r * 0.62} ${-r * 0.98} ${-r * 0.1} Z`} fill={hair} stroke={line(hair)}
        strokeWidth={ow * 1.4} strokeLinejoin="round" />
      {[-1, 1].map((k) => <g key={k} transform={`translate(${k * r * 0.36} ${r * 0.02})`}>
        {blink ? <path d={`M${-er} 0 Q0 ${er * 0.7} ${er} 0`} stroke={line(skin)} strokeWidth={ow} fill="none" strokeLinecap="round" />
          : <><ellipse rx={er} ry={er * 1.15} fill="#ffffff" stroke={line(skin)} strokeWidth={ow * 0.6} />
            <circle cx={er * 0.15} cy={er * 0.1} r={er * 0.64} fill="#1f1736" />
            <circle cx={-er * 0.12} cy={-er * 0.3} r={er * 0.25} fill="#ffffff" /></>}
        <path d={`M${-er * 1.1} ${-er * 1.7} Q0 ${-er * 2.1} ${er * 1.1} ${-er * 1.7}`} stroke={line(hair)} strokeWidth={ow * 0.9} fill="none"
          strokeLinecap="round" />
      </g>)}
      <path d={`M${-r * 0.2} ${r * 0.46} Q0 ${r * 0.6} ${r * 0.2} ${r * 0.46}`} stroke={line(skin)} strokeWidth={ow * 0.9} fill="none" strokeLinecap="round" />
      <circle cx={-r * 0.58} cy={r * 0.34} r={r * 0.14} fill="#ff6b8a" opacity={0.25} />
      <circle cx={r * 0.58} cy={r * 0.34} r={r * 0.14} fill="#ff6b8a" opacity={0.25} />
      <ellipse cx={-r * 0.34} cy={-r * 0.62} rx={r * 0.26} ry={r * 0.12} fill="#ffffff" opacity={0.22} />
    </g>
  );
};

/** the clinic colours, shared with ClinicScreenV2 so a room reads as one place */
export const CL = {
  shell: '#e9edf7', screen: '#0f1433', trace: '#38f2a0', lamp: '#7dff8a', teal: '#2fb8c4', mint: '#4fe0b8', amber: '#ffb547',
  coral: '#ff6b5a', violet: '#8e6cf0', blue: '#3d8bff', cream: '#fff6e6', navy: '#1d2758', ink: '#241c4a',
};

// ============================================================================ the gantry

/**
 * A CT OR LINAC GANTRY. A rounded cool white shell with the bore ringed in scrub teal, a deep navy bore
 * whose inner ring turns while `scanning`, a soft teal glow round the aperture, and the couch whose
 * cradle slides in on `couch` while its column stays put. The CT is one rounded monolith that meets the
 * floor, the linac stands on its stand with its treatment head above the drum. `mood` puts a visor face
 * on the status strip, as on ClinicScreenV2, and leaves it off when undefined.
 */
export const GantryV2: React.FC<Place & {kind?: 'ct' | 'linac'; scanning?: number; couch?: number; mood?: MachineMood; wear?: number}> = (p) => {
  const {frame = 0, seed = 1, kind = 'ct', scanning = 0.6, couch = 0.35, mood} = p;
  const id = useUid();
  const U = 240 / 140;                     // the library's local unit, in centimetres
  const ow = owOf(p) / U;
  const ct = kind !== 'linac';
  const top = ct ? 115.5 : 140, halfW = ct ? 62 : 84, eye = ct ? 58 : 91, rBore = ct ? 20.4 : 41;
  const barY = ct ? 94 : 134, barW = ct ? 78 : 112;
  const deck = (ct ? 0.75 : 1.2) * 140 / 2.4;
  const ring = scanning > 0.05 ? (frame / 30) * 260 * scanning : rnd(seed, 1) * 360;
  const glowK = scanning > 0.05 ? (0.55 + 0.45 * Math.abs(Math.sin(frame / 17))) * scanning : 0;
  const body = CL.shell, steel = '#b9c0d8', pad = '#5b8def';
  const shell = ct
    ? `M${-halfW} -3 L${-halfW} ${-top + 30} Q${-halfW} ${-top} ${-halfW + 30} ${-top} L${halfW - 30} ${-top} Q${halfW} ${-top} ${halfW} ${-top + 30}`
      + ` L${halfW} -3 Q${halfW} 0 ${halfW - 3} 0 L${-halfW + 3} 0 Q${-halfW} 0 ${-halfW} -3 Z`
    : clRR(-halfW, -top, halfW * 2, top - 42, 24);
  const slide = -couch * 40;
  return (
    <g transform={at(p)}><g transform={`scale(${U})`}>
      <defs>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="0.5" y2="1"><stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor={body} /><stop offset="100%" stopColor={shade(body, 0.3)} /></linearGradient>
        <radialGradient id={`${id}-r`} cx="40%" cy="35%" r="70%"><stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor={mix(body, '#cfd8ee', 0.6)} /><stop offset="100%" stopColor={shade('#cfd8ee', 0.25)} /></radialGradient>
        <radialGradient id={`${id}-o`} cx="56%" cy="60%" r="62%"><stop offset="0%" stopColor="#0a0e28" />
          <stop offset="62%" stopColor={CL.screen} /><stop offset="100%" stopColor="#34407e" /></radialGradient>
        <ClLit id={`${id}-st`} c={steel} /><ClLit id={`${id}-pd`} c={pad} v />
        <ClBlur id={`${id}-g`} sd={4} />
      </defs>
      <ContactShadow x={18} y={2} w={halfW * 3.6} opacity={0.32} />
      {/* the couch column, outside the moving group because the base never travels */}
      <path d={clRR(halfW + 8, -deck + 4, 48, deck - 4, 8)} fill={`url(#${id}-st)`} stroke={line(steel)} strokeWidth={ow * 2} />
      <rect x={halfW + 2} y={-5} width={60} height={5} rx={2.5} fill={shade(steel, 0.25)} />
      {/* the shell, outlined and filled, then the linac's stand and head */}
      {!ct && <path d={clRR(-halfW + 6, -46, halfW * 2 - 12, 46, 8)} fill={`url(#${id}-st)`} stroke={line(steel)} strokeWidth={ow * 2} />}
      {!ct && <g>
        <path d={clRR(-32, -190, 64, 54, 16)} fill={`url(#${id}-b)`} stroke={line(body)} strokeWidth={ow * 2} />
        <path d="M-18 -138 Q-16 -116 -8 -114 L8 -114 Q16 -116 18 -138 Z" fill="#4c5680" stroke={line('#4c5680')} strokeWidth={ow * 1.6}
          strokeLinejoin="round" />
        <ellipse cx={0} cy={-114} rx={7} ry={2.5} fill={CL.teal} opacity={0.5 + glowK * 0.5} />
      </g>}
      <path d={shell} fill={line(body)} stroke={line(body)} strokeWidth={ow * 2} strokeLinejoin="round" />
      <path d={shell} fill={`url(#${id}-b)`} />
      {/* a soft side panel down the shade side, and the sheen down the lit edge */}
      <path d={`M${halfW * 0.62} ${-top + (ct ? 8 : 6)} Q${halfW * 0.96} ${-top + 8} ${halfW * 0.96} ${-top + 34} L${halfW * 0.96} ${ct ? -10 : -48}`
        + ` L${halfW * 0.62} ${ct ? -10 : -48} Z`} fill={shade(body, 0.12)} opacity={0.55} />
      <path d={`M${-halfW + 9} ${-top + 32} Q${-halfW + 9} ${-top + 9} ${-halfW + 32} ${-top + 9} L${halfW * 0.3} ${-top + 9}`} stroke="#ffffff"
        strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.85} />
      {ct && <path d={`M${-halfW + 6} -10 L${halfW - 6} -10`} stroke={shade(body, 0.22)} strokeWidth={1.6} strokeLinecap="round" />}
      {/* the bore surround, its teal ring, the dark bore and the turning ring inside */}
      <circle cx={0} cy={-eye} r={rBore * 1.62} fill={`url(#${id}-r)`} stroke={line(body)} strokeWidth={ow * 1.4} />
      {glowK > 0 && <circle cx={0} cy={-eye} r={rBore * 1.28} fill="none" stroke={CL.teal} strokeWidth={5} opacity={glowK}
        filter={`url(#${id}-g)`} />}
      <circle cx={0} cy={-eye} r={rBore * 1.28} fill="none" stroke={CL.teal} strokeWidth={3.2} />
      <circle cx={0} cy={-eye} r={rBore} fill={`url(#${id}-o)`} stroke={line('#34407e')} strokeWidth={ow * 1.4} />
      <g transform={`translate(0 ${-eye}) rotate(${ring})`}>
        <path d={`M0 ${-rBore * 0.78} A${rBore * 0.78} ${rBore * 0.78} 0 0 1 ${rBore * 0.62} ${-rBore * 0.47}`} fill="none" stroke={CL.mint}
          strokeWidth={3.4} strokeLinecap="round" opacity={0.85} />
        <circle cx={0} cy={rBore * 0.78} r={2.2} fill={CL.amber} opacity={0.8} />
      </g>
      {glowK > 0 && <Glow x={0} y={-eye} r={rBore * 1.6} color={CL.mint} opacity={0.35 * glowK} />}
      <ellipse cx={-rBore * 0.45} cy={-eye - rBore * 0.5} rx={rBore * 0.3} ry={rBore * 0.12} fill="#ffffff" opacity={0.3} />
      {/* the status strip, a face when the machine is the character */}
      {mood ? <Visor x={-barW * 0.08} y={-barY + 5.5} w={barW * 0.62} h={15} mood={mood} frame={frame} eye={CL.mint} />
        : <rect x={-barW * 0.39} y={-barY} width={barW * 0.62} height={11} rx={5.5} fill={CL.screen} />}
      <circle cx={barW * 0.32} cy={-barY + 5.5} r={3.2} fill={scanning > 0.05 ? CL.coral : '#59607e'} />
      <circle cx={barW * 0.42} cy={-barY + 5.5} r={3.2} fill={CL.lamp} />
      {scanning > 0.05 && <Glow x={barW * 0.32} y={-barY + 5.5} r={9} color={CL.coral} opacity={0.5 + 0.4 * Math.sin(frame / 6)} />}
      {/* the cradle, thin, with its cushion and pillow, sliding into the bore */}
      <g transform={`translate(${slide} 0)`}>
        <path d={clRR(-16, -deck, 150, 5.4, 2.7)} fill={line('#d9dde8')} stroke={line('#d9dde8')} strokeWidth={ow * 2} />
        <path d={clRR(-16, -deck, 150, 5.4, 2.7)} fill="#e3e7f2" />
        <path d={clRR(-8, -deck - 3.4, 132, 4, 2)} fill={`url(#${id}-pd)`} stroke={line(pad)} strokeWidth={ow * 1.2} />
        <path d={clRR(-4, -deck - 6.6, 24, 4.4, 2.2)} fill="#f4f6fb" stroke={line('#d9dde8')} strokeWidth={ow} />
      </g>
    </g></g>
  );
};

// ============================================================================ the contour plan

/**
 * THE CONTOUR PLAN, drawn without a patient in it. A rounded monitor whose screen is a soft navy field
 * with no structure in it. The clinician's hand outline is a dashed cream curve, the model's outline is
 * laid down in glowing mint as `progress` runs, with a bright caret where it is drawing. Where the two
 * disagree, the gap stays visible. Screen units, the library's box (x, y, w, h).
 */
export const ContourPlanV2: React.FC<{x?: number; y?: number; w?: number; h?: number; frame?: number; seed?: number; progress?: number;
  manual?: boolean; label?: string; scale?: number}> = ({x = 0, y = 0, w = 420, h = 420, frame = 0, seed = 2, progress = 1, manual = true,
  label, scale = 1}) => {
  const id = useUid();
  const ow = clOw(scale);
  const b = Math.min(w, h) * 0.045;
  const sx = x + b, sy = y + b, sw = w - b * 2, sh = h - b * 2;
  const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) * 0.26;
  const q = Math.max(0, Math.min(1, progress));
  const blobPts = (rad: number, wob: number, off: number): Pt[] => Array.from({length: 14}, (_, i) => {
    const a = (i / 14) * Math.PI * 2 - Math.PI / 2;
    const rr = rad * (1 + (rnd(seed, off + i) - 0.5) * wob);
    return [cx + Math.cos(a) * rr * 1.14, cy + Math.sin(a) * rr] as Pt;
  });
  const autoPts = blobPts(r, 0.26, 0);
  const auto = clSmooth(autoPts), hand = clSmooth(blobPts(r * 1.04, 0.3, 60));
  // the caret, between the two outline points either side of the progress angle
  const u = q * 14, i0 = Math.floor(u) % 14, i1 = (i0 + 1) % 14, t = u - Math.floor(u);
  const caret: Pt = [autoPts[i0][0] + (autoPts[i1][0] - autoPts[i0][0]) * t, autoPts[i0][1] + (autoPts[i1][1] - autoPts[i0][1]) * t];
  const drift = Math.sin(frame / 40) * sw * 0.02;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-f`} cx="48%" cy="46%" r="70%"><stop offset="0%" stopColor="#33437e" />
          <stop offset="60%" stopColor="#1a2356" /><stop offset="100%" stopColor="#0b0f2c" /></radialGradient>
        <ClBlur id={`${id}-n`} sd={sw * 0.04} /><ClBlur id={`${id}-g`} sd={ow * 2.4} /><ClBlur id={`${id}-d`} sd={w * 0.03} />
        <clipPath id={`${id}-c`}><rect x={sx} y={sy} width={sw} height={sh} rx={b * 1.6} /></clipPath>
        <linearGradient id={`${id}-s`} x1="0" y1="0" x2="0.7" y2="1"><stop offset="0%" stopColor="#ffffff" stopOpacity={0.22} />
          <stop offset="40%" stopColor="#ffffff" stopOpacity={0} /></linearGradient>
      </defs>
      <rect x={x + w * 0.02} y={y + h * 0.05} width={w} height={h} rx={b * 2.6} fill="#160f38" opacity={0.35} filter={`url(#${id}-d)`} />
      <rect x={x} y={y} width={w} height={h} rx={b * 2.6} fill="#2b2d4a" stroke={line('#2b2d4a')} strokeWidth={ow * 2} />
      <path d={`M${x + b * 2.4} ${y + b * 0.55} L${x + w * 0.6} ${y + b * 0.55}`} stroke="#6b6f9a" strokeWidth={b * 0.4} strokeLinecap="round" opacity={0.7} />
      <rect x={sx} y={sy} width={sw} height={sh} rx={b * 1.6} fill={`url(#${id}-f)`} />
      <g clipPath={`url(#${id}-c)`}>
        {/* a soft field with nothing in it, so a viewer reads an image and never a body */}
        <g filter={`url(#${id}-n)`} transform={`translate(${drift} 0)`}>
          {Array.from({length: 9}, (_, i) => <circle key={i} cx={sx + rnd(seed, 300 + i) * sw} cy={sy + rnd(seed, 500 + i) * sh}
            r={sw * (0.06 + rnd(seed, 700 + i) * 0.1)} fill={i % 3 ? '#5b6fb8' : '#4f8fb0'} opacity={0.35} />)}
        </g>
        <path d={`M${cx} ${sy + 14} L${cx} ${sy + sh - 14} M${sx + 14} ${cy} L${sx + sw - 14} ${cy}`} stroke={CL.teal} strokeWidth={ow * 0.5}
          opacity={0.35} strokeLinecap="round" />
        {manual && <path d={hand} fill="none" stroke="#ffe6b8" strokeWidth={ow * 0.9} opacity={0.75} strokeDasharray={`${ow * 2.4} ${ow * 2.2}`}
          strokeLinecap="round" />}
        <path d={auto} fill={CL.mint} opacity={0.12 * q} />
        <path d={auto} fill="none" stroke={CL.mint} strokeWidth={ow * 2.2} pathLength={1} strokeDasharray={`${q} 1`} opacity={0.8}
          filter={`url(#${id}-g)`} />
        <path d={auto} fill="none" stroke="#c9fff0" strokeWidth={ow * 1.1} pathLength={1} strokeDasharray={`${q} 1`} strokeLinecap="round" />
        {q > 0.02 && q < 0.99 && <g>
          <Glow x={caret[0]} y={caret[1]} r={ow * 7} color={CL.mint} opacity={0.8} />
          <circle cx={caret[0]} cy={caret[1]} r={ow * (1.4 + 0.3 * Math.sin(frame / 4))} fill="#ffffff" />
        </g>}
        <rect x={sx} y={sy} width={sw} height={sh} fill={`url(#${id}-s)`} />
      </g>
      <circle cx={x + w - b * 1.6} cy={y + h - b * 0.5} r={b * 0.22} fill={CL.lamp} />
      {label && <g transform={`translate(${sx + b * 0.6} ${sy + sh - b * 0.8 - 30})`}>
        <rect x={0} y={0} width={widthOf(label, 17, true) * 0.9 + 30} height={34} rx={17} fill="#0b0f2c" opacity={0.7} />
        <circle cx={15} cy={17} r={5} fill={CL.mint} />
        <ClTxt x={27} y={23} t={label} size={17} fill="#dff7f0" />
      </g>}
    </g>
  );
};

// ============================================================================ the reading station

/**
 * THE READING STATION. A warm walnut desk on round legs, two rounded displays angled toward the seat
 * with glowing navy screens (an abstract slice on one, a worklist on the other), the dictation mic and
 * an empty teal task chair that never becomes a person. `alerts` is a coral badge with the caller's
 * number, bobbing so the eye finds it. `lit` false darkens the screens.
 */
export const ReadingStationV2: React.FC<Place & {lit?: boolean; alerts?: number; wear?: number}> = (p) => {
  const {frame = 0, seed = 3, lit = true, alerts = 0} = p;
  const id = useUid();
  const U = 1.3;                           // the library's local unit, in centimetres
  const ow = owOf(p) / U;
  const wood = '#b9825a', bez = '#2b2d4a', chair = CL.teal;
  const bob = Math.sin(frame / 30 * 2 * Math.PI * 0.8) * 2.2;
  const scroll = (frame * 0.4) % 6.6;
  return (
    <g transform={at(p)}><g transform={`scale(${U})`}>
      <defs><ClLit id={`${id}-w`} c={wood} v /><ClLit id={`${id}-c`} c={chair} />
        <linearGradient id={`${id}-sc`} x1="0" y1="0" x2="0.3" y2="1"><stop offset="0%" stopColor={lit ? '#26326e' : '#151a3a'} />
          <stop offset="100%" stopColor={lit ? CL.screen : '#0b0e24'} /></linearGradient>
        <linearGradient id={`${id}-sh`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#ffffff" stopOpacity={0.28} />
          <stop offset="38%" stopColor="#ffffff" stopOpacity={0} /></linearGradient>
        <ClBlur id={`${id}-g`} sd={3} />
      </defs>
      <ContactShadow x={0} y={1} w={230} opacity={0.3} />
      {/* legs, then the top, outlined and filled */}
      {[-90, 82].map((lx) => <path key={lx} d={clRR(lx, -48, 8, 48, 4)} fill={shade(wood, 0.3)} stroke={line(wood)} strokeWidth={ow * 2} />)}
      <path d={clRR(-104, -57, 208, 11, 5.5)} fill={`url(#${id}-w)`} stroke={line(wood)} strokeWidth={ow * 2} />
      <path d="M-98 -54 L60 -54" stroke="#ffffff" strokeWidth={1.6} strokeLinecap="round" opacity={0.4} />
      {/* the displays, angled toward the seat */}
      {[[-52, -8], [52, 8]].map(([dx, skew], i) => (
        <g key={i} transform={`translate(${dx} -57) skewX(${skew})`}>
          <path d={clRR(-8, -10, 16, 10, 3)} fill={shade(bez, 0.1)} />
          <path d={clRR(-18, -2, 36, 4, 2)} fill={bez} />
          <path d={clRR(-47, -66, 94, 60, 8)} fill={bez} stroke={line(bez)} strokeWidth={ow * 2} />
          <path d={clRR(-43, -62, 86, 52, 5)} fill={`url(#${id}-sc)`} />
          {lit && i === 0 && <g>
            <ellipse cx={-6} cy={-36} rx={22} ry={18} fill="#3a4c9a" opacity={0.6} />
            <path d={clSmooth(Array.from({length: 9}, (_, k) => {
              const a = k / 9 * Math.PI * 2;
              const rr = 11 * (1 + (rnd(seed, k) - 0.5) * 0.3);
              return [-6 + Math.cos(a) * rr * 1.2, -36 + Math.sin(a) * rr] as Pt;
            }))} fill={CL.mint} fillOpacity={0.15} stroke={CL.mint} strokeWidth={1.8} />
            <rect x={22} y={-56} width={14} height={3} rx={1.5} fill={CL.mint} opacity={0.8} />
            <rect x={22} y={-50} width={10} height={3} rx={1.5} fill="#8fa6ff" opacity={0.7} />
          </g>}
          {lit && i === 1 && Array.from({length: 6}, (_, j) => {
            const yy = -56 + ((j * 6.6 + scroll) % 42);
            return <g key={j}>
              <circle cx={-36} cy={yy + 1.5} r={1.8} fill={j === 1 ? CL.coral : CL.mint} />
              <rect x={-31} y={yy} width={26 + rnd(seed, 10 + j) * 40} height={3} rx={1.5} fill="#8fa6ff" opacity={0.7} />
            </g>;
          })}
          <path d={clRR(-43, -62, 86, 52, 5)} fill={`url(#${id}-sh)`} />
          {lit && <circle cx={40} cy={-8.5} r={1.4} fill={CL.lamp} />}
        </g>
      ))}
      {/* the dictation mic */}
      <path d={clRR(-9, -65, 18, 9, 4.5)} fill="#3a4170" stroke={line('#3a4170')} strokeWidth={ow * 1.6} />
      <circle cx={6} cy={-60.5} r={1.6} fill={CL.coral} opacity={0.6 + 0.4 * Math.sin(frame / 7)} />
      {/* the chair, empty */}
      <g>
        <path d="M0 -6 L-22 -1 M0 -6 L22 -1 M0 -6 L-12 0 M0 -6 L12 0" stroke="#4a5070" strokeWidth={3} strokeLinecap="round" />
        {[-22, -12, 12, 22].map((wx) => <circle key={wx} cx={wx} cy={-1} r={2} fill="#2b2d4a" />)}
        <rect x={-3.5} y={-30} width={7} height={25} rx={3.5} fill="#5a6084" stroke={line('#5a6084')} strokeWidth={ow * 1.4} />
        <path d={clRR(-26, -40, 52, 10, 5)} fill={`url(#${id}-c)`} stroke={line(chair)} strokeWidth={ow * 2} />
        <path d="M-20 -37 L8 -37" stroke="#ffffff" strokeWidth={1.4} strokeLinecap="round" opacity={0.45} />
      </g>
      {/* the queue badge, a number the caller supplies */}
      {alerts > 0 && <g transform={`translate(86 ${-124 + bob})`}>
        <circle r={17} fill={CL.coral} opacity={0.5} filter={`url(#${id}-g)`} />
        <circle r={13.5} fill={CL.coral} stroke={line(CL.coral)} strokeWidth={ow * 1.6} />
        <ellipse cx={-4} cy={-6} rx={5} ry={2.6} fill="#ffffff" opacity={0.4} />
        <ClTxt x={0} y={5.6} t={String(alerts)} size={16} fill="#ffffff" anchor="middle" spacing={0} weight={900} />
      </g>}
    </g></g>
  );
};

// ============================================================================ the tower block

/**
 * THE HOSPITAL TOWERS. A rank of slabs at three depths, the rear ones paler and bluer. Deep floor plates
 * with bands of sky lit glass, the low louvred mechanical floor that says hospital rather than office,
 * a rounded red cross on the front tower and a helipad with its beacon blinking. `night` lights a share
 * of the windows warm and turns the facades to dusk.
 */
export const TowerBlockV2: React.FC<Place & {towers?: number; night?: boolean; helipad?: boolean; wear?: number}> = (p) => {
  const {frame = 0, seed = 4, towers = 3, night = false, helipad = true} = p;
  const id = useUid();
  const U = 4600 / 300;                    // the library's local unit, in centimetres
  const ow = owOf(p) / U;
  const base = night ? '#4a5590' : '#ece4d4';
  const glass = night ? '#1d2452' : '#7fb4e8';
  const beacon = Math.sin(frame / 8) > 0;
  const list = Array.from({length: towers}, (_, i) => {
    const k = rnd(seed, i), d = 1 - (i / towers) * 0.4;
    return {i, k, d, w: 110 + k * 70, h: (170 + k * 130) * d, bx: i * 128 - (k - 0.5) * 26};
  });
  const span = list.reduce((a, t) => Math.max(a, t.bx + t.w), 0);
  return (
    <g transform={at(p)}><g transform={`scale(${U})`}>
      <ContactShadow x={span / 2} y={1} w={span * 1.25} opacity={0.3} />
      {/* farthest first, so the near tower overlaps */}
      {[...list].reverse().map(({i, d, w, h, bx}) => {
        const far = 1 - d;
        const c = mix(base, '#b9b4e8', far * 1.1), gl = mix(glass, '#c9c4f0', far * 1.2);
        const floors = Math.floor(h / 17);
        const mech = -h * 0.66;
        return <g key={i}>
          <defs><linearGradient id={`${id}-f${i}`} x1="0" y1="0" x2="1" y2="0.2"><stop offset="0%" stopColor={light(c, 0.45)} />
            <stop offset="55%" stopColor={c} /><stop offset="100%" stopColor={shade(c, 0.26)} /></linearGradient>
            <linearGradient id={`${id}-g${i}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={light(gl, 0.4)} />
              <stop offset="100%" stopColor={shade(gl, 0.2)} /></linearGradient>
            <clipPath id={`${id}-c${i}`}><path d={clRR(bx, -h, w, h, 7)} /></clipPath></defs>
          <path d={clRR(bx, -h, w, h + 1, 7)} fill={line(c)} stroke={line(c)} strokeWidth={ow * 2} />
          <path d={clRR(bx, -h, w, h + 1, 7)} fill={`url(#${id}-f${i})`} />
          <g clipPath={`url(#${id}-c${i})`}>
            {Array.from({length: floors}, (_, f) => {
              const yy = -h + f * 17 + 4;
              if (yy > mech - 12 && yy < mech + 15) return null;
              return <g key={f}>
                <rect x={bx + 4} y={yy} width={w - 8} height={8.6} rx={4.3} fill={`url(#${id}-g${i})`} />
                {Array.from({length: Math.floor((w - 8) / 15)}, (_, cc) => {
                  const on = night && rnd(seed, i * 400 + f * 20 + cc) < 0.42;
                  return on ? <rect key={cc} x={bx + 6 + cc * 15} y={yy + 1.2} width={11} height={6.2} rx={2.5} fill="#ffd98a" opacity={0.9} />
                    : <path key={cc} d={`M${bx + 4 + (cc + 1) * 15} ${yy + 1} L${bx + 4 + (cc + 1) * 15} ${yy + 7.6}`} stroke={light(c, 0.3)}
                      strokeWidth={1.2} opacity={0.7} />;
                })}
              </g>;
            })}
            {/* the mechanical floor, a louvred band no office tower has this low */}
            <rect x={bx} y={mech} width={w} height={15} fill={shade(c, 0.18)} />
            {Array.from({length: Math.floor(w / 7)}, (_, cc) => <path key={cc} d={`M${bx + 4 + cc * 7} ${mech + 3} L${bx + 4 + cc * 7} ${mech + 12}`}
              stroke={shade(c, 0.34)} strokeWidth={2.2} strokeLinecap="round" />)}
            <rect x={bx} y={-h} width={w * 0.18} height={h} fill="#ffffff" opacity={0.1} />
          </g>
          <path d={`M${bx + 6} ${-h + 2.5} L${bx + w - 10} ${-h + 2.5}`} stroke="#ffffff" strokeWidth={2} strokeLinecap="round" opacity={0.6} />
          {i === 0 && <g transform={`translate(${bx + w * 0.78} ${-h + 18})`}>
            <rect x={-11} y={-11} width={22} height={22} rx={6} fill="#ffffff" stroke={line('#ffffff')} strokeWidth={ow * 1.4} />
            <path d="M0 -6.5 L0 6.5 M-6.5 0 L6.5 0" stroke="#e5484d" strokeWidth={4.6} strokeLinecap="round" />
            {night && <Glow x={0} y={0} r={22} color="#ff8a8a" opacity={0.5} />}
          </g>}
          {helipad && i === 0 && <g transform={`translate(${bx + w / 2} ${-h - 4})`}>
            <path d={clRR(-w * 0.32, -1, w * 0.64, 5, 2.5)} fill="#7a7f99" stroke={line('#7a7f99')} strokeWidth={ow * 1.4} />
            <ellipse cx={0} cy={-1} rx={w * 0.3} ry={5.4} fill="#8d93b0" stroke={line('#8d93b0')} strokeWidth={ow * 1.2} />
            <ellipse cx={0} cy={-1} rx={w * 0.16} ry={2.8} fill="none" stroke="#fff4dc" strokeWidth={1.6} />
            <path d="M-2.4 -2.6 L-2.4 0.6 M2.4 -2.6 L2.4 0.6 M-2.4 -1 L2.4 -1" stroke="#fff4dc" strokeWidth={1} strokeLinecap="round" />
            <path d="M0 -6 L0 -12" stroke="#7a7f99" strokeWidth={1.6} strokeLinecap="round" />
            <circle cx={0} cy={-13} r={2.2} fill={beacon ? '#ff4d4d' : '#6a2a3a'} />
            {beacon && <Glow x={0} y={-13} r={12} color="#ff4d4d" opacity={0.8} />}
          </g>}
        </g>;
      })}
    </g></g>
  );
};

export const CLINIC_V2 = ['GantryV2', 'ContourPlanV2', 'ReadingStationV2', 'TowerBlockV2'] as const;
