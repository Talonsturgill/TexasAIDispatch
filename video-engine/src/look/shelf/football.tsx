import React from 'react';
import {M} from '../../lib/scale';
import {FONT} from '../../lib/type';
import {light, line, mix, shade} from '../color';
import {ContactShadow, Glow, useUid} from '../Kit';
import {taper} from '../props';
import type {Place} from '../machines';
import {Figure, SKIN_TONES} from '../Figure';
import type {FigureEmotion, FigurePose} from '../Figure';

/**
 * FOOTBALL, LOOK V2 (November 13th, 2026).
 *
 * The fourteen drawings of lib/football.tsx redrawn in the v2 idiom. Texas Friday night as equipment
 * and the people around it. Every shape is round and lit from the upper left, every line is the fill's
 * own deep hue, anything that stands has a contact shadow and every drawing moves a little on `frame`.
 *
 * The library's law still holds and is kept here word for word in spirit. Draw the form, never the
 * mark. No maker's wordmark on a helmet clip, no bolt on the cooler, no title on the annual, no school
 * monogram on the letter. The blank is deliberate.
 *
 * The people (the drill team, the official, the coach on the sled, the player on the annual cover) are
 * the cast rig in look/Figure.tsx, so they match every other v2 person. The drill team's kicking leg
 * and the official's stripes are layered onto that rig, never a second body.
 *
 * PLACEMENT is the library's own. x and y at the ground, `scale` 1 is true size through the one metre
 * in lib/scale.ts, `facing` mirrors. Each drawing is built in centimetres and converted once. One
 * change from the library is that the helmet and the ball now rest ON the ground point rather than
 * being centred on it, so a ContactShadow sits under them.
 */

const CM = M / 100;
const at = (p: Place) => `translate(${p.x ?? 0} ${p.y ?? 0}) scale(${(p.scale ?? 1) * CM * (p.facing ?? 1)} ${(p.scale ?? 1) * CM})`;
/** half the outline width in local centimetres, so a line reads about 6.8 film pixels at any scale */
const owOf = (scale?: number) => 3.4 / ((scale ?? 1) * CM);
/** the Figure rig is about 504 units sole to crown */
const FIG = 504;

type Pt = [number, number];
const rr = (x: number, y: number, w: number, h: number, r: number) => {
  const q = Math.min(r, w / 2, h / 2);
  return `M${x + q} ${y} L${x + w - q} ${y} Q${x + w} ${y} ${x + w} ${y + q} L${x + w} ${y + h - q} Q${x + w} ${y + h} ${x + w - q} ${y + h}`
    + ` L${x + q} ${y + h} Q${x} ${y + h} ${x} ${y + h - q} L${x} ${y + q} Q${x} ${y} ${x + q} ${y} Z`;
};
const ell = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;

/** a lit material, light at the top left, the fill, shade toward violet at the bottom right */
const Lit: React.FC<{id: string; c: string; x2?: number; y2?: number; k?: number}> = ({id, c, x2 = 0.35, y2 = 1, k = 1}) => (
  <linearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
    <stop offset="0%" stopColor={light(c, 0.45 * k)} /><stop offset="46%" stopColor={c} /><stop offset="100%" stopColor={shade(c, 0.36 * k)} />
  </linearGradient>
);
/** a round tube or cylinder standing upright, lit on its left */
const Tube: React.FC<{id: string; c: string}> = ({id, c}) => (
  <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stopColor={shade(c, 0.12)} /><stop offset="22%" stopColor={light(c, 0.5)} /><stop offset="55%" stopColor={c} />
    <stop offset="100%" stopColor={shade(c, 0.42)} />
  </linearGradient>
);
/** a round body, lit from the upper left */
const Ball: React.FC<{id: string; c: string}> = ({id, c}) => (
  <radialGradient id={id} cx="34%" cy="28%" r="78%">
    <stop offset="0%" stopColor={light(c, 0.5)} /><stop offset="55%" stopColor={c} /><stop offset="100%" stopColor={shade(c, 0.4)} />
  </radialGradient>
);

/** Two passes for parts that join. Every outline first, then every fill, so no seam shows inside the silhouette. */
type Part = {d: string; fill: string; ink: string; t?: string};
const Pass: React.FC<{parts: Part[]; ow: number}> = ({parts, ow}) => <>
  {parts.map((s, i) => <path key={`o${i}`} d={s.d} transform={s.t} fill={s.ink} stroke={s.ink} strokeWidth={ow * 2} strokeLinejoin="round" />)}
  {parts.map((s, i) => <path key={`f${i}`} d={s.d} transform={s.t} fill={s.fill} />)}
</>;
/** a stroked bar with its own deep line, for tubes, bars and straps */
const Bar: React.FC<{d: string; c: string; w: number; ow: number; cap?: 'round' | 'butt'; hi?: boolean}> = ({d, c, w, ow, cap = 'round', hi = true}) => <>
  <path d={d} stroke={line(c)} strokeWidth={w + ow * 2} strokeLinecap={cap} strokeLinejoin="round" fill="none" />
  <path d={d} stroke={c} strokeWidth={w} strokeLinecap={cap} strokeLinejoin="round" fill="none" />
  {hi && <path d={d} stroke={light(c, 0.6)} strokeWidth={w * 0.28} strokeLinecap={cap} strokeLinejoin="round" fill="none" opacity={0.55}
    transform={`translate(${-w * 0.18} ${-w * 0.18})`} />}
</>;
/** a soft band of light that sweeps across a clipped shape every few seconds, so a still object is never frozen */
const Glint: React.FC<{clip: string; frame: number; x0: number; x1: number; y0: number; y1: number; w: number; period?: number;
  phase?: number; opacity?: number}> = ({clip, frame, x0, x1, y0, y1, w, period = 96, phase = 0, opacity = 0.4}) => {
  const u = (((frame + phase) % period) + period) % period / period;
  if (u > 0.42) return null;
  const k = u / 0.42, cx = x0 + (x1 - x0) * k, sl = (y1 - y0) * 0.3;
  return <g clipPath={`url(#${clip})`}>
    <path d={`M${cx - w / 2 + sl} ${y0} L${cx + w / 2 + sl} ${y0} L${cx + w / 2 - sl} ${y1} L${cx - w / 2 - sl} ${y1} Z`} fill="#ffffff"
      opacity={opacity * Math.sin(k * Math.PI)} />
  </g>;
};
const wave = (frame: number, period: number, phase = 0) => Math.sin((frame / period) * 2 * Math.PI + phase);

export type FootballV2Props = Place & {
  /** the two colours a program owns, and it never owns three */
  colours?: [string, string];
  night?: boolean;
  led?: boolean;
};

// ------------------------------------------------------------------------------------------ HELMET

/**
 * THE HELMET. A big round shell with a rolled earhole, a crown stripe in the second colour and a
 * facemask standing proud of the face on two clips. Side view facing right, resting on its rim. A
 * glint slides over the shell. No logo, no wordmark.
 */
export const HelmetV2: React.FC<FootballV2Props & {mask?: 'twobar' | 'cage' | 'skill'; stripe?: boolean; bars?: string}> = (p) => {
  const {frame = 0, mask = 'cage', stripe = true, colours = ['#c0182f', '#f6ecd8'], bars = '#eeeae2'} = p;
  const id = useUid(), ow = owOf(p.scale);
  const c = colours[0], ink = line(c);
  const shellD = 'M-13 -2 C-17.2 -8 -18.6 -18.4 -12.6 -25.2 C-6.6 -31.6 6.2 -32.2 13.2 -27.6 C18.2 -24 20.2 -18 19.4 -12.6 '
    + 'C19 -10.6 16.6 -10.1 14.4 -10.7 C11.8 -10 10.4 -7 11.8 -3.4 C12.2 -1.2 9.8 0 6.6 0 L-9.6 0 C-11.4 0 -12.4 -0.8 -13 -2 Z';
  const front = 'M15.4 -12.4 C20 -13 23.6 -11.8 23.9 -8.2 C24.1 -4.6 22.2 -1.2 18.6 -0.8 C16 -0.5 13.6 -1.4 12 -3';
  const rows = mask === 'twobar' ? [-9.4, -5.8] : mask === 'skill' ? [-9.4, -6.6, -3.9] : [-9.6, -6.6, -3.8];
  const stays = mask === 'cage' ? [18.6, 21.6] : mask === 'skill' ? [20.4] : [];
  const bw = 1.25;
  const maskD = [front, ...rows.map((y) => `M12.6 ${y} L${23.9 - Math.abs(y + 7) * 0.25} ${y}`),
    ...stays.map((x) => `M${x} ${-12.6 + (x - 15) * 0.05} Q${x + 0.8} -6 ${x - 0.6} ${-0.8 - (x - 18) * 0.1}`)].join(' ');
  return (
    <g transform={at(p)}>
      <defs>
        <Ball id={`${id}-s`} c={c} />
        <clipPath id={`${id}-c`}><path d={shellD} /></clipPath>
      </defs>
      <ContactShadow x={3} y={0.6} w={44} opacity={0.34} />
      {/* the dark padding seen through the face opening, behind everything */}
      <path d={ell(14.6, -6.8, 3.6, 4.8)} fill="#2a2140" stroke={line('#2a2140')} strokeWidth={ow} />
      <Pass ow={ow} parts={[{d: shellD, fill: `url(#${id}-s)`, ink}]} />
      <g clipPath={`url(#${id}-c)`}>
        {/* the rolled rim along the bottom edge, a shade band */}
        <path d="M-14 -1.6 C-11 1 2 1 12 -2.6" stroke={shade(c, 0.35)} strokeWidth={3.4} fill="none" />
        {stripe && <>
          <path d="M17.2 -15.6 C16.6 -24.4 7 -28.6 -1.2 -28 C-8.8 -27.4 -13.6 -21.6 -14.8 -12" stroke={line(colours[1])} strokeWidth={4.8} fill="none" />
          <path d="M17.2 -15.6 C16.6 -24.4 7 -28.6 -1.2 -28 C-8.8 -27.4 -13.6 -21.6 -14.8 -12" stroke={colours[1]} strokeWidth={3.2} fill="none" />
        </>}
        {/* the rim light on the far edge */}
        <path d={shellD} fill="none" stroke={light(c, 0.55)} strokeWidth={1.6} opacity={0.5} transform="translate(0.9 0.7)" />
        <ellipse cx={-5} cy={-24.5} rx={7.4} ry={3} transform="rotate(-24 -5 -24.5)" fill="#ffffff" opacity={0.42} />
      </g>
      <Glint clip={`${id}-c`} frame={frame} x0={-24} x1={26} y0={-34} y1={2} w={5} period={100} />
      {/* the earhole on its rolled pad */}
      <circle cx={-1.2} cy={-11.4} r={3.8} fill={shade(c, 0.12)} stroke={ink} strokeWidth={ow * 0.8} />
      <circle cx={-1.2} cy={-11.4} r={1.7} fill="#2a2140" />
      {/* the clips the mask stands off from */}
      <rect x={13.4} y={-14.2} width={3.4} height={3} rx={1.2} fill={shade(c, 0.3)} stroke={ink} strokeWidth={ow * 0.7} />
      <rect x={10.6} y={-5.4} width={3.2} height={3} rx={1.2} fill={shade(c, 0.3)} stroke={ink} strokeWidth={ow * 0.7} />
      {/* chin strap and cup */}
      <path d="M3.6 -3.8 Q10 -1 15.4 -1.6" stroke={line('#e8e3d8')} strokeWidth={1.2 + ow * 1.4} fill="none" strokeLinecap="round" />
      <path d="M3.6 -3.8 Q10 -1 15.4 -1.6" stroke="#e8e3d8" strokeWidth={1.2} fill="none" strokeLinecap="round" />
      <ellipse cx={16.4} cy={-1.8} rx={2.8} ry={1.7} fill="#f6f3ec" stroke={line('#f6f3ec')} strokeWidth={ow * 0.8} />
      {/* the facemask, proud of the face */}
      <Bar d={maskD} c={bars} w={bw} ow={ow} />
    </g>
  );
};

// ------------------------------------------------------------------------------------------ BALL

/**
 * THE BALL. A slender pointed spheroid in saturated leather, the white end stripes of the high school
 * ball, panel seams tip to tip and the laces on a raised seam. It rests on the ground and rocks a
 * little, as a ball does after it is set down.
 */
export const FootballV2: React.FC<FootballV2Props & {stripes?: boolean}> = (p) => {
  const {frame = 0, stripes = true} = p;
  const id = useUid(), ow = owOf(p.scale);
  const c = '#a4501f', ink = line(c);
  const rock = wave(frame, 80) * 3.2;
  const body = 'M-14 0 C-9.2 -11.4 9.2 -11.4 14 0 C9.2 11.4 -9.2 11.4 -14 0 Z';
  const yLace = (x: number) => -4.2 + (x / 6) ** 2 * 0.9;
  return (
    <g transform={at(p)}>
      <defs>
        <Ball id={`${id}-b`} c={c} />
        <clipPath id={`${id}-c`}><path d={body} /></clipPath>
      </defs>
      <ContactShadow x={0} y={0.4} w={30} opacity={0.36} />
      <g transform={`rotate(${rock} 0 0) translate(0 -8.4)`}>
        <Pass ow={ow} parts={[{d: body, fill: `url(#${id}-b)`, ink}]} />
        <g clipPath={`url(#${id}-c)`}>
          <path d="M-14 0 C-6 -5.4 6 -5.4 14 0 M-14 0 C-6 6.2 6 6.2 14 0" stroke={shade(c, 0.4)} strokeWidth={0.7} fill="none" opacity={0.7} />
          {stripes && [-1, 1].map((s) => <path key={s} d={`M${s * 8.4} -9 C${s * 9.8} -3 ${s * 9.8} 3 ${s * 8.4} 9 L${s * 10.6} 8.2 C${s * 12} 2.8 ${s * 12} -2.8
            ${s * 10.6} -8.2 Z`} fill="#fbf3e2" />)}
          <ellipse cx={-4.4} cy={-6.4} rx={6} ry={1.8} transform="rotate(-8 -4.4 -6.4)" fill="#ffffff" opacity={0.38} />
          <path d={body} fill="none" stroke={light(c, 0.5)} strokeWidth={1.2} opacity={0.4} transform="translate(0.6 0.7)" />
        </g>
        <Glint clip={`${id}-c`} frame={frame} x0={-18} x1={18} y0={-10} y1={10} w={3.4} period={110} phase={30} />
        {/* the raised seam and the laces */}
        <path d={`M-6.2 ${yLace(-6.2)} Q0 -5.4 6.2 ${yLace(6.2)}`} stroke={shade(c, 0.45)} strokeWidth={1.4} fill="none" strokeLinecap="round" />
        {Array.from({length: 7}).map((_, i) => {
          const x = -4.5 + i * 1.5, y = yLace(x) - 0.3;
          return <g key={i}>
            <path d={`M${x} ${y - 1.3} L${x} ${y + 1.3}`} stroke={line('#fbf3e2')} strokeWidth={0.8 + ow * 0.9} strokeLinecap="round" />
            <path d={`M${x} ${y - 1.3} L${x} ${y + 1.3}`} stroke="#fbf3e2" strokeWidth={0.8} strokeLinecap="round" />
          </g>;
        })}
      </g>
    </g>
  );
};

// ------------------------------------------------------------------------------------------ PADS

/**
 * SHOULDER PADS on a stand. The arch over the collarbones, two cantilevered caps standing off the
 * shoulders with their flaps under them, and the sternum gap laced shut. The lace ends sway.
 */
export const ShoulderPadsV2: React.FC<FootballV2Props & {stand?: boolean}> = (p) => {
  const {frame = 0, stand = true, colours = ['#2c5bc4', '#f3eee2']} = p;
  const id = useUid(), ow = owOf(p.scale);
  const c = colours[0], ink = line(c), strap = colours[1];
  const half = (s: number) => `M${s * 3.2} -42 C${s * 9} -46.6 ${s * 18} -46.8 ${s * 23.4} -42.6 L${s * 24.6} -22.4 `
    + `C${s * 24.8} -16.4 ${s * 19} -14.2 ${s * 12.6} -14.6 L${s * 5.4} -15.8 C${s * 3.4} -16.2 ${s * 2.6} -17.8 ${s * 2.6} -20 Z`;
  const cap = (s: number) => `M${s * 15} -44.6 C${s * 20} -51.4 ${s * 34} -50 ${s * 36.4} -41.4 C${s * 37.6} -36.6 ${s * 33} -34.4 ${s * 27} -35.6 `
    + `C${s * 21} -36.6 ${s * 15.4} -38.6 ${s * 15} -44.6 Z`;
  const flap = rr(-6, 0, 12, 13, 5);
  const sway = wave(frame, 70) * 2.4;
  return (
    <g transform={at(p)}>
      <defs><Lit id={`${id}-p`} c={c} /><Ball id={`${id}-cap`} c={c} /><Tube id={`${id}-st`} c="#9aa1b4" />
        <clipPath id={`${id}-cc`}><path d={cap(-1) + cap(1)} /></clipPath></defs>
      <ContactShadow x={0} y={0.4} w={stand ? 34 : 60} opacity={0.32} />
      {stand && <>
        <path d={rr(-1.8, -30, 3.6, 29, 1.8)} fill={`url(#${id}-st)`} stroke={line('#9aa1b4')} strokeWidth={ow} />
        <path d={ell(0, -1.6, 12, 2.6)} fill="#5b6075" stroke={line('#5b6075')} strokeWidth={ow} />
      </>}
      {/* the back arch seen through the neck opening */}
      <path d="M-11 -43 C-9 -50.4 9 -50.4 11 -43 C6 -45.4 -6 -45.4 -11 -43 Z" fill={shade(c, 0.5)} stroke={ink} strokeWidth={ow} strokeLinejoin="round" />
      {/* the deltoid flaps hanging under each cap */}
      {[-1, 1].map((s) => <path key={s} d={flap} transform={`translate(${s * 29} -38) rotate(${-s * 14})`} fill={shade(c, 0.22)}
        stroke={ink} strokeWidth={ow * 2} paintOrder="stroke" strokeLinejoin="round" />)}
      <Pass ow={ow} parts={[{d: half(-1), fill: `url(#${id}-p)`, ink}, {d: half(1), fill: `url(#${id}-p)`, ink}]} />
      {/* the laces across the sternum gap, and their swinging ends */}
      <path d={[0, 1, 2, 3, 4].map((i) => `M-3 ${-39 + i * 4.6} L3 ${-36.7 + i * 4.6} M3 ${-39 + i * 4.6} L-3 ${-36.7 + i * 4.6}`).join(' ')}
        stroke={line(strap)} strokeWidth={0.9 + ow * 1.2} strokeLinecap="round" />
      <path d={[0, 1, 2, 3, 4].map((i) => `M-3 ${-39 + i * 4.6} L3 ${-36.7 + i * 4.6} M3 ${-39 + i * 4.6} L-3 ${-36.7 + i * 4.6}`).join(' ')}
        stroke={strap} strokeWidth={0.9} strokeLinecap="round" />
      {[-1, 1].map((s) => <path key={s} d={`M${s * 1.2} -17 Q${s * 2 + sway * 0.4} -12 ${s * 1.6 + sway} -8.4`} stroke={strap} strokeWidth={0.9}
        fill="none" strokeLinecap="round" />)}
      <Pass ow={ow} parts={[{d: cap(-1), fill: `url(#${id}-cap)`, ink}, {d: cap(1), fill: `url(#${id}-cap)`, ink}]} />
      {[-1, 1].map((s) => <path key={s} d={`M${s * 18.4} -44.4 C${s * 22} -48.6 ${s * 29} -48.4 ${s * 32} -45.6`} stroke="#ffffff" strokeWidth={1.4}
        fill="none" strokeLinecap="round" opacity={0.5} />)}
      <Glint clip={`${id}-cc`} frame={frame} x0={-44} x1={44} y0={-52} y1={-33} w={4} period={100} phase={10} />
    </g>
  );
};

// ------------------------------------------------------------------------------------------ SCOREBOARD

const SEG: Record<string, string> = {'0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc', '5': 'afgcd', '6': 'afgedc', '7': 'abc',
  '8': 'abcdefg', '9': 'abcfgd'};
/** one segment digit, every segment a rounded capsule, the unlit ones a faint ghost the way a real board shows them */
const Digit: React.FC<{ch: string; cx: number; cy: number; w: number; h: number; th: number; color: string}> = ({ch, cx, cy, w, h, th, color}) => {
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2, g = th * 0.9;
  const seg: Record<string, string> = {
    a: `M${x0 + g} ${y0} L${x1 - g} ${y0}`, g: `M${x0 + g} ${cy} L${x1 - g} ${cy}`, d: `M${x0 + g} ${y1} L${x1 - g} ${y1}`,
    f: `M${x0} ${y0 + g} L${x0} ${cy - g}`, b: `M${x1} ${y0 + g} L${x1} ${cy - g}`,
    e: `M${x0} ${cy + g} L${x0} ${y1 - g}`, c: `M${x1} ${cy + g} L${x1} ${y1 - g}`,
  };
  const on = SEG[ch] ?? '';
  return <g strokeLinecap="round">
    {'abcdefg'.split('').map((k) => <path key={k} d={seg[k]} stroke={color} strokeWidth={th} opacity={on.includes(k) ? 1 : 0.06} />)}
  </g>;
};

/**
 * THE SCOREBOARD. A steel cabinet on two round poles, HOME and GUEST, blank school panels, segment
 * digits in dark windows, QTR and a game clock that runs. Amber lamps that bloom before about 2012
 * (`led` false), crisp white LED after. The sign band on top is blank on purpose.
 */
export const ScoreboardV2: React.FC<FootballV2Props & {home?: number; guest?: number; qtr?: number; clock?: number}> = (p) => {
  const {frame = 0, night = true, led = false, home = 21, guest = 14, qtr = 3, clock = 462, colours = ['#1f3a8a', '#ffc83a']} = p;
  const id = useUid(), ow = owOf(p.scale);
  const cab = colours[0], acc = colours[1], steel = '#9aa1b4';
  const digit = led ? '#eef8ff' : '#ffae2b';
  const left = Math.max(0, clock - Math.floor(frame / 30));
  const mm = String(Math.floor(left / 60)).padStart(2, '0'), ss = String(left % 60).padStart(2, '0');
  const colon = frame % 30 < 18;
  const win = (x: number, y: number, w: number, h: number) => <path d={rr(x, y, w, h, Math.min(w, h) * 0.18)} fill="#0b0d22"
    stroke={line(cab)} strokeWidth={ow * 1.4} />;
  const two = (v: number, cx: number) => String(Math.max(0, Math.min(99, v))).padStart(2, '0').split('').map((ch, i) =>
    <Digit key={i} ch={ch} cx={cx + (i ? 58 : -58)} cy={-376} w={74} h={142} th={17} color={digit} />);
  const digits = <>
    {two(home, -270)}{two(guest, 270)}
    {[mm[0], mm[1], ss[0], ss[1]].map((ch, i) => <Digit key={i} ch={ch} cx={-78 + i * 44 + (i > 1 ? 18 : 0)} cy={-513} w={28} h={54} th={8} color={digit} />)}
    {colon && <><circle cx={0} cy={-526} r={4.6} fill={digit} /><circle cx={0} cy={-500} r={4.6} fill={digit} /></>}
    <Digit ch={String(qtr)} cx={0} cy={-346} w={50} h={96} th={13} color={digit} />
  </>;
  return (
    <g transform={at(p)}>
      <defs>
        <Lit id={`${id}-c`} c={cab} x2={0.2} /><Lit id={`${id}-a`} c={acc} x2={0.1} /><Tube id={`${id}-p`} c={steel} />
        <filter id={`${id}-bl`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={led ? 4 : 9} /></filter>
        <clipPath id={`${id}-cl`}><path d={rr(-450, -604, 900, 364, 36)} /></clipPath>
      </defs>
      <ContactShadow x={0} y={4} w={860} opacity={0.3} />
      {/* poles, brace and footings */}
      {[-300, 300].map((x) => <g key={x}>
        <path d={rr(x - 13, -250, 26, 246, 13)} fill={`url(#${id}-p)`} stroke={line(steel)} strokeWidth={ow * 2} paintOrder="stroke" />
        <path d={rr(x - 30, -16, 60, 18, 8)} fill="#c9c6cf" stroke={line('#c9c6cf')} strokeWidth={ow * 1.4} />
      </g>)}
      <Bar d="M-300 -150 L300 -150" c={steel} w={10} ow={ow} />
      {/* the blank sign band riding on top */}
      <path d={rr(-380, -660, 760, 66, 33)} fill={`url(#${id}-a)`} stroke={line(acc)} strokeWidth={ow * 2} paintOrder="stroke" />
      <path d="M-344 -646 L330 -646" stroke="#ffffff" strokeWidth={8} strokeLinecap="round" opacity={0.5} />
      {/* the cabinet */}
      <path d={rr(-450, -604, 900, 364, 36)} fill={`url(#${id}-c)`} stroke={line(cab)} strokeWidth={ow * 2} paintOrder="stroke" />
      <g clipPath={`url(#${id}-cl)`}>
        <path d="M-420 -590 Q0 -600 420 -590" stroke="#ffffff" strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.3} />
        <path d={rr(-450, -604, 900, 364, 36)} fill="none" stroke={shade(cab, 0.4)} strokeWidth={22} opacity={0.5} transform="translate(8 8)" />
      </g>
      {(['HOME', 'GUEST'] as const).map((lab, i) => {
        const cx = i === 0 ? -270 : 270;
        return <g key={lab}>
          <text x={cx} y={-544} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={44} fill={acc}>{lab}</text>
          {/* the removable panel the school name clips into, BLANK */}
          <path d={rr(cx - 150, -530, 300, 40, 20)} fill={light(cab, 0.18)} stroke={line(cab)} strokeWidth={ow} />
          {win(cx - 132, -472, 264, 192)}
        </g>;
      })}
      {win(-120, -560, 240, 94)}
      <text x={0} y={-418} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={32} fill={acc}>QTR</text>
      {win(-48, -404, 96, 116)}
      {night && <g filter={`url(#${id}-bl)`} opacity={led ? 0.6 : 0.95}>{digits}</g>}
      <g opacity={night ? 1 : 0.75}>{digits}</g>
      {night && !led && <>
        <Glow x={-270} y={-376} r={190} color="#ffae2b" opacity={0.25} />
        <Glow x={270} y={-376} r={190} color="#ffae2b" opacity={0.25} />
      </>}
    </g>
  );
};

// ------------------------------------------------------------------------------------------ CHAIN GANG

/**
 * THE CHAIN CREW'S POLES. The down box on its own pole with a flip number, and the ten-yard chain
 * strung between two sticks. Hand-held, so each pole wobbles a touch and the chain sags and swings.
 */
export const ChainGangV2: React.FC<FootballV2Props & {down?: number}> = (p) => {
  const {frame = 0, down = 2} = p;
  const id = useUid(), ow = owOf(p.scale);
  const o = '#ff6a1f', steel = '#a7adbf';
  const chainLen = 332;
  const tilt = (i: number) => wave(frame, 84, i * 1.9) * 1.4;
  const top = (x: number, h: number, i: number): Pt => {
    const a = tilt(i) * Math.PI / 180;
    return [x + Math.sin(a) * h, -Math.cos(a) * h];
  };
  const stick = (x: number, h: number, i: number, head: React.ReactNode) => (
    <g key={i} transform={`rotate(${tilt(i)} ${x} 0)`}>
      <path d={rr(x - 4.2, -h, 8.4, h - 4, 4.2)} fill={`url(#${id}-t)`} stroke={line(o)} strokeWidth={ow * 2} paintOrder="stroke" />
      <path d={rr(x - 5.6, -13, 11.2, 13, 5)} fill="#2b2440" stroke={line('#2b2440')} strokeWidth={ow} />
      {head}
    </g>
  );
  const a = top(0, 160, 1), b = top(chainLen, 160, 2);
  const sag = 7 + wave(frame, 64) * 2.4;
  const links = 26;
  return (
    <g transform={at(p)}>
      <defs><Tube id={`${id}-t`} c={o} /><Lit id={`${id}-b`} c="#fbf3e2" x2={0.6} /></defs>
      {[-chainLen * 0.5, 0, chainLen].map((x) => <ContactShadow key={x} x={x} y={1} w={34} opacity={0.34} />)}
      {/* the down box: its own pole and a flip box with the down in it */}
      {stick(-chainLen * 0.5, 182, 0, <g>
        <path d={`M${-chainLen * 0.5 + 21} -224 L${-chainLen * 0.5 + 31} -231 L${-chainLen * 0.5 + 31} -189 L${-chainLen * 0.5 + 21} -182 Z`}
          fill={shade('#fbf3e2', 0.3)} stroke={line('#fbf3e2')} strokeWidth={ow * 2} strokeLinejoin="round" paintOrder="stroke" />
        <path d={rr(-chainLen * 0.5 - 22, -224, 44, 42, 8)} fill={`url(#${id}-b)`} stroke={line('#fbf3e2')} strokeWidth={ow * 2} paintOrder="stroke" />
        <path d={rr(-chainLen * 0.5 - 22, -227, 44, 8, 4)} fill={o} stroke={line(o)} strokeWidth={ow} />
        <text x={-chainLen * 0.5} y={-190} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={36} fill="#22203a">{down}</text>
      </g>)}
      {/* the two chain sticks with their paddle tops */}
      {[0, chainLen].map((x, i) => stick(x, 176, i + 1, <path d={rr(x - 12, -198, 24, 34, 10)} fill={`url(#${id}-t)`} stroke={line(o)}
        strokeWidth={ow * 2} paintOrder="stroke" />))}
      {/* the ten-yard chain, link by link, hanging in a shallow curve */}
      {Array.from({length: links}).map((_, i) => {
        const u = (i + 0.5) / links;
        const x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u + sag * 4 * u * (1 - u);
        const ang = Math.atan2((b[1] - a[1]) + sag * 4 * (1 - 2 * u), b[0] - a[0]) * 180 / Math.PI;
        const flat = i % 2 === 0;
        return <ellipse key={i} cx={x} cy={y} rx={7.4} ry={flat ? 3.8 : 1.8} transform={`rotate(${ang} ${x} ${y})`} fill={flat ? 'none' : steel}
          stroke={flat ? line(steel) : line(steel)} strokeWidth={flat ? 2.6 : ow * 0.8} />;
      })}
      {Array.from({length: links}).map((_, i) => {
        if (i % 2) return null;
        const u = (i + 0.5) / links;
        const x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u + sag * 4 * u * (1 - u);
        const ang = Math.atan2((b[1] - a[1]) + sag * 4 * (1 - 2 * u), b[0] - a[0]) * 180 / Math.PI;
        return <ellipse key={i} cx={x} cy={y} rx={7.4} ry={3.8} transform={`rotate(${ang} ${x} ${y})`} fill="none" stroke={light(steel, 0.3)} strokeWidth={1.3} />;
      })}
      {[a, b].map((q, i) => <circle key={i} cx={q[0]} cy={q[1]} r={4} fill={steel} stroke={line(steel)} strokeWidth={ow} />)}
    </g>
  );
};

// ------------------------------------------------------------------------------------------ SLED

/**
 * THE TWO-MAN SLED. Steel runners with curled noses, a back frame, a coach's deck at the rear and
 * two fat vinyl pads on spring arms. Every couple of seconds the pads take a hit, rock back and spring
 * home. `coach` stands a coach on the deck, the way every two-a-days memory has one.
 */
export const BlockingSledV2: React.FC<FootballV2Props & {pads?: number; coach?: boolean}> = (p) => {
  const {frame = 0, pads = 2, coach = false, colours = ['#ffc21f', '#36405a']} = p;
  const id = useUid(), ow = owOf(p.scale);
  const pad = colours[0], steel = colours[1];
  const ph = (frame % 72) / 30;
  const hit = ph < 0.12 ? -9 * (ph / 0.12) : -9 * Math.exp(-4 * (ph - 0.12)) * Math.cos(11 * (ph - 0.12));
  const n = Math.max(1, Math.min(4, pads));
  return (
    <g transform={at(p)}>
      <defs><Lit id={`${id}-p`} c={pad} x2={0.4} /><Lit id={`${id}-s`} c={steel} /></defs>
      <ContactShadow x={-12} y={2} w={310} opacity={0.34} />
      {/* the far runner, then the near one with the curled nose */}
      <Bar d="M-128 -10 L96 -10 Q116 -10 118 -26" c={shade(steel, 0.25)} w={7} ow={ow} hi={false} />
      {/* the back frame and the top beam the arms hang from */}
      <Bar d="M-88 -8 L-74 -128 L92 -128 L106 -10" c={steel} w={8} ow={ow} />
      <Bar d="M-74 -128 L-60 -10 M92 -128 L80 -10" c={shade(steel, 0.15)} w={6} ow={ow} />
      {/* the coach's deck at the rear */}
      <path d={rr(-150, -22, 86, 10, 4)} fill={`url(#${id}-s)`} stroke={line(steel)} strokeWidth={ow * 2} paintOrder="stroke" />
      <Bar d="M-146 -2 L94 -2 Q120 -2 122 -22" c={steel} w={8} ow={ow} />
      {coach && <g transform={`translate(-114 -22) scale(${180 / FIG})`}>
        <Figure frame={frame} x={0} y={0} pose="hips" emotion="determined" skin={SKIN_TONES[3]} hair="short" hairColor="#2b1d14"
          hat="cap" hatColor={steel} top="polo" shirt={mix(steel, '#3c5fa8', 0.4)} trim={pad} pants="#c8b07e" turn={0.6} seed={7} build={0.66} />
      </g>}
      {/* the pads on their spring arms */}
      {Array.from({length: n}).map((_, i) => {
        const cx = n === 1 ? 20 : -26 + i * (124 / (n - 1));
        return <g key={i} transform={`rotate(${hit * (1 - i * 0.12)} ${cx} -60)`}>
          <path d={[0, 1, 2, 3].map((k) => `M${cx - 6} ${-104 + k * 5} q-7 -3 -14 0`).join(' ')} stroke={line(steel)} strokeWidth={3.6}
            fill="none" strokeLinecap="round" />
          <path d={rr(cx - 34 + 8, -150 + 4, 66, 96, 20)} fill={shade(pad, 0.42)} stroke={line(pad)} strokeWidth={ow * 2} paintOrder="stroke" />
          <path d={rr(cx - 34, -150, 66, 96, 20)} fill={`url(#${id}-p)`} stroke={line(pad)} strokeWidth={ow * 2} paintOrder="stroke" />
          <path d={rr(cx - 27, -143, 52, 82, 15)} fill="none" stroke={shade(pad, 0.22)} strokeWidth={1.6} strokeDasharray="4 3.4" />
          <path d={`M${cx - 26} -128 Q${cx - 26} -142 ${cx - 12} -143`} stroke="#ffffff" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.6} />
        </g>;
      })}
    </g>
  );
};

// ------------------------------------------------------------------------------------------ COOLER

/**
 * THE SIDELINE COOLER. An insulated cylinder with a domed lid, carry handles and a push spigot, on a
 * wheeled cart with a stack of cone cups. Never the orange with the bolt, which is trade dress. A drop
 * forms at the spigot and falls.
 */
export const WaterCoolerV2: React.FC<FootballV2Props & {cart?: boolean; cups?: boolean}> = (p) => {
  const {frame = 0, cart = true, cups = true, colours = ['#13a37f', '#f5f0e4']} = p;
  const id = useUid(), ow = owOf(p.scale);
  const c = colours[0], lid = colours[1], steel = '#a7adbf';
  const base = cart ? -40 : 0;
  const body = rr(-21, base - 48, 42, 48, 9);
  const lidD = `M-22.4 ${base - 46} C-22.4 ${base - 58} 22.4 ${base - 58} 22.4 ${base - 46} Q22.4 ${base - 43} 19 ${base - 43} L-19 ${base - 43} Q-22.4 ${base - 43} -22.4 ${base - 46} Z`;
  const dq = (frame % 54) / 54;
  const drop = dq < 0.55 ? {y: base - 10 + 1, r: 0.6 + dq * 2} : {y: base - 9 + (dq - 0.55) / 0.45 * (cart ? 30 : 8), r: 1.6};
  return (
    <g transform={at(p)}>
      <defs><Tube id={`${id}-b`} c={c} /><Lit id={`${id}-l`} c={lid} x2={0.3} /><Tube id={`${id}-s`} c={steel} />
        <clipPath id={`${id}-c`}><path d={body} /></clipPath></defs>
      <ContactShadow x={cart ? 4 : 0} y={1} w={cart ? 84 : 52} opacity={0.34} />
      {cart && <g>
        {[-1, 1].map((s) => <Bar key={s} d={`M${s * 26} ${base + 2} L${s * 23} -8`} c={steel} w={2.6} ow={ow} />)}
        <Bar d={`M-23 -18 L30 -18`} c={steel} w={2} ow={ow} />
        <path d={rr(-32, base - 2, 74, 6, 3)} fill={`url(#${id}-s)`} stroke={line(steel)} strokeWidth={ow * 2} paintOrder="stroke" />
        {[-23, 23].map((x) => <g key={x}>
          <circle cx={x} cy={-5} r={5} fill="#2b2440" stroke={line('#2b2440')} strokeWidth={ow} />
          <circle cx={x} cy={-5} r={2} fill="#c9cfdf" />
        </g>)}
        {cups && <g>
          {Array.from({length: 6}).map((_, i) => <path key={i} d={`M28 ${base - 3 - i * 2.2} L40 ${base - 3 - i * 2.2} L34 ${base - 13 - i * 2.2} Z`}
            fill={i === 5 ? '#ffffff' : '#f3efe6'} stroke={line('#f3efe6')} strokeWidth={ow * 0.9} strokeLinejoin="round" />)}
        </g>}
      </g>}
      {/* the insulated cylinder */}
      <path d={body} fill={`url(#${id}-b)`} stroke={line(c)} strokeWidth={ow * 2} paintOrder="stroke" />
      <g clipPath={`url(#${id}-c)`}>
        <path d={`M-22 ${base - 30} L22 ${base - 30} M-22 ${base - 12} L22 ${base - 12}`} stroke={shade(c, 0.3)} strokeWidth={1.4} />
        <path d={`M-22 ${base - 2} L22 ${base - 2}`} stroke={lid} strokeWidth={5} />
      </g>
      <Glint clip={`${id}-c`} frame={frame} x0={-30} x1={30} y0={base - 50} y1={base} w={6} period={100} phase={20} />
      {/* handles, lid and spigot */}
      {[-1, 1].map((s) => <path key={s} d={`M${s * 20} ${base - 40} q${s * 7} 0 ${s * 7} 6 q0 6 ${-s * 7} 6`} stroke={line(lid)} strokeWidth={3.4 + ow * 2}
        fill="none" strokeLinecap="round" />)}
      {[-1, 1].map((s) => <path key={`h${s}`} d={`M${s * 20} ${base - 40} q${s * 7} 0 ${s * 7} 6 q0 6 ${-s * 7} 6`} stroke={lid} strokeWidth={3.4}
        fill="none" strokeLinecap="round" />)}
      <path d={lidD} fill={`url(#${id}-l)`} stroke={line(lid)} strokeWidth={ow * 2} paintOrder="stroke" strokeLinejoin="round" />
      <path d={rr(-4, base - 58.6, 8, 4, 2)} fill={shade(lid, 0.2)} stroke={line(lid)} strokeWidth={ow} />
      <path d={`M-14 ${base - 52} Q-4 ${base - 55.4} 8 ${base - 54}`} stroke="#ffffff" strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.7} />
      <path d={rr(-5, base - 16, 10, 7, 3)} fill={`url(#${id}-s)`} stroke={line(steel)} strokeWidth={ow * 2} paintOrder="stroke" />
      <path d={rr(-1.6, base - 10, 3.2, 3, 1.2)} fill={shade(steel, 0.3)} />
      <circle cx={0} cy={drop.y} r={drop.r} fill="#bfe8ff" stroke={line('#bfe8ff')} strokeWidth={ow * 0.5} />
    </g>
  );
};

// ------------------------------------------------------------------------------------------ DRILL TEAM

/**
 * THE KICK LINE. A row of drill team dancers on the cast rig, white hats, white boots, hands on hips,
 * a kick rippling down the line. The kicking leg is layered on the rig (its own leg is masked out), the
 * skirt covers the hip. A generic uniform, never a named troupe's.
 *
 * `spread` is the width of the line in centimetres, wide enough by default that each kick shows in the gap.
 */
export const DrillTeamV2: React.FC<FootballV2Props & {count?: number; spread?: number; kick?: number}> = (p) => {
  const {frame = 0, count = 6, spread = 690, kick = 1, colours = ['#d7263d', '#fbf6ea'], seed = 48} = p;
  const id = useUid();
  const k = 170 / FIG;
  const top = colours[0], hat = colours[1];
  const skirt = shade(top, 0.18);
  const t = frame / 30;
  return (
    <g transform={at(p)}>
      <defs>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={-500} y={-800} width={1000} height={1000}>
          <rect x={-500} y={-800} width={1000} height={1000} fill="#ffffff" />
          <rect x={4} y={-110} width={160} height={150} fill="#000000" />
        </mask>
        <Lit id={`${id}-sk`} c={skirt} x2={0.3} />
      </defs>
      {Array.from({length: count}, (_, j) => count - 1 - j).map((i) => {
        const x = (i - (count - 1) / 2) * (spread / Math.max(1, count));
        const skin = SKIN_TONES[[1, 3, 0, 4, 2, 5][(i + seed) % 6]];
        const tights = mix(skin, '#e2a77c', 0.35);
        const ph = t * 2 * Math.PI / 1.4 + Math.PI - i * 0.28;
        const up = Math.pow((1 - Math.cos(ph)) / 2, 0.7);
        const a = (14 + kick * 104 * up) * Math.PI / 180;
        const hip: Pt = [32, -132], foot: Pt = [hip[0] + Math.sin(a) * 176, hip[1] + Math.cos(a) * 176];
        const knee: Pt = [hip[0] + (foot[0] - hip[0]) * 0.74, hip[1] + (foot[1] - hip[1]) * 0.74];
        const toe: Pt = [foot[0] + Math.sin(a) * 14, foot[1] + Math.cos(a) * 14];
        const legD = `M${hip[0]} ${hip[1]} L${foot[0]} ${foot[1]}`, bootD = `M${knee[0]} ${knee[1]} L${toe[0]} ${toe[1]}`;
        const standBoot = 'M-34 -74 L-34 -22';
        return <g key={i} transform={`translate(${x} 0)`}>
          <ContactShadow x={10} y={2} w={92} opacity={0.3} />
          <g transform={`scale(${k})`}>
            <g mask={`url(#${id}-m)`}>
              <Figure frame={frame} x={0} y={0} pose="hips" emotion={up > 0.6 ? 'excited' : 'happy'} skin={skin} hair="long"
                hairColor={['#2b1a12', '#5a3a1e', '#1c1512', '#7c5a34'][(i + seed) % 4]} hat="felt" hatColor={hat} top="tee" shirt={top}
                pants={tights} seed={seed + i * 5} build={0.3} />
            </g>
            {/* the white boot over the standing leg, then the kicking leg and its boot, outlines first */}
            <path d={standBoot} stroke={line('#ffffff')} strokeWidth={58} strokeLinecap="round" />
            <ellipse cx={-42} cy={-10} rx={42} ry={24} fill={line('#ffffff')} />
            <path d={legD} stroke={line(tights)} strokeWidth={56} strokeLinecap="round" />
            <path d={bootD} stroke={line('#ffffff')} strokeWidth={60} strokeLinecap="round" />
            <path d={standBoot} stroke="#fbfaf6" strokeWidth={46} strokeLinecap="round" />
            <ellipse cx={-42} cy={-10} rx={36} ry={18} fill="#fbfaf6" />
            <path d={legD} stroke={tights} strokeWidth={42} strokeLinecap="round" />
            <path d={bootD} stroke="#fbfaf6" strokeWidth={48} strokeLinecap="round" />
            <path d={bootD} stroke="#d9dbe6" strokeWidth={12} strokeLinecap="round" transform="translate(6 6)" opacity={0.6} />
            {/* the skirt over the hip */}
            <path d="M-84 -152 L84 -152 Q98 -118 108 -92 Q0 -78 -108 -92 Q-98 -118 -84 -152 Z" fill={`url(#${id}-sk)`} stroke={line(skirt)}
              strokeWidth={7} strokeLinejoin="round" />
            <path d="M-102 -98 Q0 -86 102 -98" stroke={hat} strokeWidth={10} fill="none" strokeLinecap="round" />
            <path d="M-40 -146 L-50 -96 M0 -148 L0 -92 M40 -146 L50 -96" stroke={shade(skirt, 0.3)} strokeWidth={4} strokeLinecap="round" opacity={0.6} />
          </g>
        </g>;
      })}
    </g>
  );
};

// ------------------------------------------------------------------------------------------ JACKET

/**
 * THE LETTER JACKET on its hanger. A wool body in the school colour, cream leather sleeves, striped
 * knit collar, cuffs and waistband in the second colour, snaps down the front and a chenille letter on
 * the left chest with a pin and a bar on it. The letter is blank or a plain block initial, never a
 * school's monogram. It sways a little on the hook.
 */
export const LettermanJacketV2: React.FC<FootballV2Props & {initial?: string}> = (p) => {
  const {frame = 0, initial = '', colours = ['#25357a', '#f2b51e']} = p;
  const id = useUid(), ow = owOf(p.scale);
  const wool = colours[0], knit = colours[1], leather = '#f4ead6', wood = '#b77a45';
  const sway = wave(frame, 120) * 2.2;
  const sleeve = (s: number) => taper([[s * 17, -58], [s * 25, -46], [s * 28.6, -30], [s * 29.6, -18]], 14, 11);
  const bodyD = 'M-19 -62 C-9 -65 9 -65 19 -62 L22.4 -12 Q22.6 -7 18 -7 L-18 -7 Q-22.6 -7 -22.4 -12 Z';
  return (
    <g transform={at(p)}>
      <defs><Lit id={`${id}-w`} c={wool} x2={0.5} /><Lit id={`${id}-l`} c={leather} x2={0.5} />
        <clipPath id={`${id}-c`}><path d={bodyD} /></clipPath></defs>
      <ContactShadow x={0} y={1} w={46} opacity={0.18} />
      <g transform={`rotate(${sway} 0 -72)`}>
        {/* the hook and the wooden hanger */}
        <path d="M0 -64 L0 -70 Q0 -74 3.4 -74 Q6.4 -74 6.4 -71" stroke={line('#b9bfd0')} strokeWidth={1 + ow * 1.6} fill="none" strokeLinecap="round" />
        <path d="M0 -64 L0 -70 Q0 -74 3.4 -74 Q6.4 -74 6.4 -71" stroke="#c9cfdf" strokeWidth={1} fill="none" strokeLinecap="round" />
        <Bar d="M-23 -59.6 Q0 -66.4 23 -59.6" c={wood} w={3.4} ow={ow} />
        <Pass ow={ow} parts={[
          {d: sleeve(-1), fill: `url(#${id}-l)`, ink: line(leather)}, {d: sleeve(1), fill: `url(#${id}-l)`, ink: line(leather)},
          {d: bodyD, fill: `url(#${id}-w)`, ink: line(wool)},
        ]} />
        {/* knit cuffs with their stripes */}
        {[-1, 1].map((s) => <g key={s} transform={`translate(${s * 29.8} -18.6) rotate(${-s * 6})`}>
          <path d={rr(-6.2, -1, 12.4, 6.6, 2.6)} fill={wool} stroke={line(wool)} strokeWidth={ow * 1.6} paintOrder="stroke" />
          <path d="M-6 1.4 L6 1.4 M-6 3.4 L6 3.4" stroke={knit} strokeWidth={1} />
        </g>)}
        <g clipPath={`url(#${id}-c)`}>
          {/* the knit waistband */}
          <rect x={-24} y={-13} width={48} height={7} fill={wool} />
          <path d="M-24 -11 L24 -11 M-24 -8.6 L24 -8.6" stroke={knit} strokeWidth={1.1} />
          <path d={bodyD} fill="none" stroke={light(wool, 0.5)} strokeWidth={2} opacity={0.35} transform="translate(-1 0)" />
        </g>
        {/* the striped knit collar */}
        <path d="M-12 -63 Q0 -55 12 -63" stroke={line(wool)} strokeWidth={5.4 + ow * 2} fill="none" strokeLinecap="round" />
        <path d="M-12 -63 Q0 -55 12 -63" stroke={wool} strokeWidth={5.4} fill="none" strokeLinecap="round" />
        <path d="M-11.4 -62 Q0 -54.6 11.4 -62" stroke={knit} strokeWidth={1.1} fill="none" />
        {/* the snap placket */}
        <path d="M0 -58 L0 -13" stroke={shade(wool, 0.4)} strokeWidth={0.9} />
        {[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={0} cy={-54 + i * 9.6} r={1.2} fill={light(knit, 0.2)} stroke={line(knit)} strokeWidth={0.4} />)}
        {/* welt pockets trimmed in leather */}
        {[-1, 1].map((s) => <path key={s} d={`M${s * 8.6} -30 L${s * 15.4} -23.6`} stroke={line(leather)} strokeWidth={2.2 + ow} strokeLinecap="round" />)}
        {[-1, 1].map((s) => <path key={`p${s}`} d={`M${s * 8.6} -30 L${s * 15.4} -23.6`} stroke={leather} strokeWidth={2.2} strokeLinecap="round" />)}
        {/* the chenille letter, on the wearer's left chest */}
        <g transform="translate(10.6 -45)">
          <path d={rr(-6, -7.6, 12, 15.2, 2.6)} fill={wool} stroke={knit} strokeWidth={1.2} />
          <path d={rr(-4.8, -6.4, 9.6, 12.8, 1.8)} fill={knit} stroke={line(knit)} strokeWidth={ow * 0.7} />
          {initial && <text x={0} y={4} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={11} fill={wool}>{initial.slice(0, 1)}</text>}
          <circle cx={-2.6} cy={-4.4} r={0.9} fill="#e6e9f2" stroke={line('#e6e9f2')} strokeWidth={0.3} />
          <path d={rr(-0.4, 3.4, 4.6, 1.4, 0.7)} fill="#d8b04a" stroke={line('#d8b04a')} strokeWidth={0.3} />
        </g>
        <path d="M-17 -58 Q-18.6 -40 -18.4 -24" stroke="#ffffff" strokeWidth={1.4} fill="none" strokeLinecap="round" opacity={0.3} />
      </g>
    </g>
  );
};

// ------------------------------------------------------------------------------------------ ANNUAL

/**
 * THE PRESEASON ANNUAL. A thick newsprint magazine standing on its foot, the page block showing on
 * the side, a photographic cover of a player cheering under the lights, the year in the corner and a
 * price dot. The masthead band is BLANK because the title is a live mark. The player is on the cast rig.
 */
export const FootballAnnualV2: React.FC<FootballV2Props & {year?: string}> = (p) => {
  const {frame = 0, year = "'26", colours = ['#b3122f', '#f6ecd6']} = p;
  const id = useUid(), ow = owOf(p.scale);
  const band = colours[0], paper = '#f7f1e2';
  const cover = rr(-10, -28, 20, 28, 1.4);
  const photo = rr(-8.4, -22.4, 16.8, 13.2, 1.2);
  return (
    <g transform={at(p)}>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1b1f5e" /><stop offset="100%" stopColor="#6a3fa3" />
        </linearGradient>
        <Lit id={`${id}-cv`} c={paper} x2={0.6} k={0.6} />
        <clipPath id={`${id}-ph`}><path d={photo} /></clipPath>
        <clipPath id={`${id}-c`}><path d={cover} /></clipPath>
      </defs>
      <ContactShadow x={1.6} y={0.3} w={30} opacity={0.34} />
      {/* the page block, seen on the side */}
      <path d="M9.4 -27.6 L12.6 -26.2 Q13 -26 13 -25.6 L13 0.6 L9.8 0 Z" fill="#e4dcc6" stroke={line('#e4dcc6')} strokeWidth={ow * 2}
        strokeLinejoin="round" paintOrder="stroke" />
      <path d="M10.6 -25 L10.6 -1 M11.6 -24.6 L11.6 -0.6" stroke="#cbbf9f" strokeWidth={0.3} />
      <path d={cover} fill={`url(#${id}-cv)`} stroke={line(paper)} strokeWidth={ow * 2} paintOrder="stroke" />
      <g clipPath={`url(#${id}-c)`}>
        <rect x={-10} y={-28} width={20} height={4.6} fill={band} />
        <path d="M-10 -23.4 L10 -23.4" stroke={shade(band, 0.3)} strokeWidth={0.4} />
      </g>
      {/* the year and the price dot */}
      <text x={7.4} y={-24.8} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={2.4} fill={colours[1]}>{year}</text>
      {/* the cover photo: a player cheering under the lights */}
      <path d={photo} fill={`url(#${id}-sky)`} />
      <g clipPath={`url(#${id}-ph)`}>
        <Glow x={-6} y={-21} r={5} color="#fff3c4" opacity={0.9} />
        <Glow x={6.4} y={-21.4} r={4} color="#fff3c4" opacity={0.7} />
        <rect x={-9} y={-12.4} width={18} height={4} fill="#2f8f4a" />
        <g transform={`translate(0.4 -3.2) scale(${15 / FIG})`}>
          <Figure frame={frame} x={0} y={0} pose="cheer" emotion="excited" skin={SKIN_TONES[4]} hair="buzz" hairColor="#1c1512" top="tee"
            shirt={band} pants="#f2efe6" seed={11} build={0.7} />
        </g>
      </g>
      <path d={photo} fill="none" stroke={line(paper)} strokeWidth={ow * 0.8} />
      {/* the district previews, small type as bars */}
      {[0, 1, 2, 3].map((i) => <rect key={i} x={-8.4} y={-7.6 + i * 1.6} width={i === 0 ? 11 : i === 3 ? 9 : 16.8} height={0.8} rx={0.4}
        fill={i === 0 ? band : '#b9b1a0'} />)}
      <circle cx={6.6} cy={-6.4} r={1.9} fill="#ffd23c" stroke={line('#ffd23c')} strokeWidth={ow * 0.6} />
      <Glint clip={`${id}-c`} frame={frame} x0={-16} x1={16} y0={-30} y1={1} w={3} period={110} phase={50} opacity={0.5} />
    </g>
  );
};

// ------------------------------------------------------------------------------------------ TROPHY

/**
 * THE TROPHY. The metal ten-gallon hat on a wooden plinth (`kind` 'hat'), or a figure on a column
 * (`kind` 'cup'). The engraving plate is blank. Gold catches a sweeping glint and a sparkle.
 */
export const TrophyV2: React.FC<FootballV2Props & {kind?: 'hat' | 'cup'}> = (p) => {
  const {frame = 0, kind = 'hat'} = p;
  const id = useUid(), ow = owOf(p.scale);
  const gold = '#f0b72c', wood = '#8a4f2c', ig = line(gold);
  const brim = 'M-20.2 -23.2 Q-22 -22.6 -21.2 -20.8 Q-19.4 -15.6 0 -15.2 Q19.4 -15.6 21.2 -20.8 Q22 -22.6 20.2 -23.2 Q14 -18.8 0 -19 Q-14 -18.8 -20.2 -23.2 Z';
  const crown = 'M-10.6 -18.6 C-11.6 -32 -10.8 -44 -4.6 -46.2 C-2 -47 -1 -44.6 0 -43.4 C1 -44.6 2 -47 4.6 -46.2 C10.8 -44 11.6 -32 10.6 -18.6 Q0 -16.6 -10.6 -18.6 Z';
  const fig = 'M-2.6 -40 C-3 -44 3 -44 2.6 -40 C2.4 -38.6 1.4 -38 1.4 -37.4 L4.4 -35.4 L7.6 -40.4 L9 -39.4 L5.6 -32.6 L3.6 -32.6 L3.4 -27 '
    + 'L4.8 -18 L1.6 -18 L0 -25 L-1.6 -18 L-4.8 -18 L-3.4 -27 L-4 -33.4 L-6 -28 L-7.6 -28.8 L-5.4 -35.6 L-1.4 -37.4 C-1.4 -38 -2.4 -38.6 -2.6 -40 Z';
  const shape = kind === 'hat' ? brim + crown : fig + rr(-2.4, -18.6, 4.8, 4, 1.6);
  const tw = (frame + 20) % 80;
  const twinkle = tw < 16 ? Math.sin(tw / 16 * Math.PI) : 0;
  return (
    <g transform={at(p)}>
      <defs><Lit id={`${id}-g`} c={gold} x2={0.5} /><Lit id={`${id}-w`} c={wood} /><Tube id={`${id}-col`} c={gold} />
        <clipPath id={`${id}-c`}><path d={shape} /></clipPath></defs>
      <ContactShadow x={0} y={0.6} w={36} opacity={0.36} />
      <Pass ow={ow} parts={[{d: rr(-15, -12, 30, 12, 3), fill: `url(#${id}-w)`, ink: line(wood)},
        {d: rr(-12.4, -15.4, 24.8, 4.6, 2), fill: `url(#${id}-w)`, ink: line(wood)}]} />
      <path d={rr(-8.2, -9.2, 16.4, 5.4, 1.6)} fill={`url(#${id}-g)`} stroke={ig} strokeWidth={ow * 0.9} />
      <path d="M-13.6 -11 L13.6 -11" stroke={light(wood, 0.5)} strokeWidth={0.8} opacity={0.6} />
      {kind === 'hat' ? <>
        <Pass ow={ow} parts={[{d: brim, fill: `url(#${id}-g)`, ink: ig}, {d: crown, fill: `url(#${id}-g)`, ink: ig}]} />
        <path d="M-10.8 -22.4 Q0 -20 10.8 -22.4 L10.6 -19 Q0 -17 -10.6 -19 Z" fill={shade(gold, 0.35)} />
        <path d="M0 -43 L0 -24" stroke={shade(gold, 0.3)} strokeWidth={0.9} strokeLinecap="round" />
        <path d="M-8.4 -26 C-9 -34 -8 -41 -5 -43.4" stroke="#fffbe8" strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.8} />
        <path d="M-17 -18.6 Q-9 -16.6 -3 -16.6" stroke="#fffbe8" strokeWidth={1} fill="none" strokeLinecap="round" opacity={0.7} />
      </> : <>
        <Pass ow={ow} parts={[{d: fig, fill: `url(#${id}-g)`, ink: ig}, {d: rr(-2.4, -18.6, 4.8, 4, 1.6), fill: `url(#${id}-col)`, ink: ig}]} />
        <ellipse cx={8.6} cy={-41.4} rx={2.4} ry={1.5} transform="rotate(-30 8.6 -41.4)" fill={`url(#${id}-g)`} stroke={ig} strokeWidth={ow * 0.8} />
      </>}
      <Glint clip={`${id}-c`} frame={frame} x0={-26} x1={26} y0={-48} y1={-14} w={4} period={84} />
      {twinkle > 0 && <g transform={`translate(${kind === 'hat' ? -6 : -2} ${kind === 'hat' ? -40 : -41}) scale(${twinkle})`}>
        <path d="M0 -4.4 Q0.6 -0.6 4.4 0 Q0.6 0.6 0 4.4 Q-0.6 0.6 -4.4 0 Q-0.6 -0.6 0 -4.4 Z" fill="#ffffff" />
      </g>}
    </g>
  );
};

// ------------------------------------------------------------------------------------------ PYLON

/**
 * THE END-ZONE PYLON. Eighteen inches of weighted orange foam, seen a quarter turned so it reads as a
 * box, with the reflective band near the top. This one IS orange, because the colour is a rule and not
 * a mark. A glint slides down it.
 */
export const EndZonePylonV2: React.FC<FootballV2Props> = (p) => {
  const {frame = 0} = p;
  const id = useUid(), ow = owOf(p.scale);
  const o = '#ff6a1f';
  const front = rr(-5.4, -46, 10.8, 46, 1.6);
  const side = 'M5.4 -45 L9.4 -47.4 L9.4 -2 L5.4 0 Z';
  const topD = 'M-5.4 -46 L-1.4 -48.6 L9.4 -47.4 L5.4 -45.2 Z';
  return (
    <g transform={at(p)}>
      <defs><Lit id={`${id}-f`} c={o} x2={0.6} /><clipPath id={`${id}-c`}><path d={front} /></clipPath></defs>
      <ContactShadow x={2} y={0.4} w={24} opacity={0.36} />
      <Pass ow={ow} parts={[{d: side, fill: shade(o, 0.3), ink: line(o)}, {d: topD, fill: light(o, 0.35), ink: line(o)},
        {d: front, fill: `url(#${id}-f)`, ink: line(o)}]} />
      <g clipPath={`url(#${id}-c)`}>
        <rect x={-6} y={-40} width={12} height={4} fill="#fff6ea" opacity={0.92} />
        <rect x={-6} y={-6} width={12} height={6} fill={shade(o, 0.18)} />
        <path d="M-3.6 -43 L-3.6 -9" stroke="#ffffff" strokeWidth={1.4} strokeLinecap="round" opacity={0.4} />
      </g>
      <path d="M5.4 -39.6 L9.4 -41.8 L9.4 -38 L5.4 -35.8 Z" fill={shade('#fff6ea', 0.2)} />
      <Glint clip={`${id}-c`} frame={frame} x0={-14} x1={14} y0={-48} y1={0} w={3} period={90} phase={40} />
    </g>
  );
};

// ------------------------------------------------------------------------------------------ GRANDSTAND

/**
 * THE HOME GRANDSTAND from the field corner. A raked bank of seats behind a wall in the school colour,
 * a press box riding the top with lit windows, light masts standing behind with their lamp banks and
 * cones, and the crowd as rows of round heads in the two colours, with a wave travelling through them.
 * `w` is the width in centimetres.
 */
export const GrandstandBowlV2: React.FC<FootballV2Props & {w?: number; rows?: number; crowd?: number; masts?: number}> = (p) => {
  const {frame = 0, w = 5000, rows = 9, crowd = 0.92, masts = 2, night = true, led = false, colours = ['#b3122f', '#f6ecd6'], seed = 53} = p;
  const id = useUid(), ow = owOf(p.scale);
  const steel = '#8d93a8', conc = '#c6c0cc';
  const lamp = led ? '#eef6ff' : '#fff0c2';
  const H = 1400, topY = -1180;
  const bank = `M${-w / 2 + 40} 0 L${w / 2 - 40} 0 Q${w / 2} 0 ${w / 2 - 12} -60 L${w * 0.42 + 20} ${topY + 40} Q${w * 0.42} ${topY} ${w * 0.42 - 60} ${topY} `
    + `L${-w * 0.42 + 60} ${topY} Q${-w * 0.42} ${topY} ${-w * 0.42 - 20} ${topY + 40} L${-w / 2 + 12} -60 Q${-w / 2} 0 ${-w / 2 + 40} 0 Z`;
  const gap = (-topY - 200) / rows;
  const rHead = Math.min(64, gap * 0.38);
  const waveX = ((frame * 60) % (w * 1.6)) - w * 0.8;
  const skins = SKIN_TONES;
  return (
    <g transform={at(p)}>
      <defs>
        <Lit id={`${id}-b`} c={conc} x2={0.2} /><Lit id={`${id}-wall`} c={colours[0]} x2={0.1} /><Tube id={`${id}-m`} c={steel} />
        <Lit id={`${id}-pb`} c="#e9e6f0" x2={0.3} />
        <linearGradient id={`${id}-cone`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={lamp} stopOpacity={0.5} />
          <stop offset="100%" stopColor={lamp} stopOpacity={0} /></linearGradient>
        <clipPath id={`${id}-c`}><path d={bank} /></clipPath>
      </defs>
      <ContactShadow x={0} y={20} w={w * 1.05} opacity={0.3} />
      {/* the light masts behind, lamp banks and cones */}
      {Array.from({length: masts}, (_, i) => {
        const mx = masts === 1 ? 0 : (i - (masts - 1) / 2) * (w * 0.62 / Math.max(1, (masts - 1) / 1)) * (masts > 2 ? 1 : 1);
        return <g key={i}>
          {night && <path d={`M${mx - 160} ${-H * 1.5 + 60} L${mx + 160} ${-H * 1.5 + 60} L${mx + w * 0.34} ${-120} L${mx - w * 0.34} ${-120} Z`}
            fill={`url(#${id}-cone)`} opacity={0.55} />}
          <path d={rr(mx - 26, -H * 1.5, 52, H * 1.5 - 300, 26)} fill={`url(#${id}-m)`} stroke={line(steel)} strokeWidth={ow * 2} paintOrder="stroke" />
          <path d={rr(mx - 230, -H * 1.5 - 170, 460, 210, 50)} fill={shade(steel, 0.2)} stroke={line(steel)} strokeWidth={ow * 2} paintOrder="stroke" />
          {Array.from({length: 8}).map((_, j) => {
            const lx = mx - 165 + (j % 4) * 110, ly = -H * 1.5 - 115 + Math.floor(j / 4) * 100;
            return <g key={j}><circle cx={lx} cy={ly} r={40} fill={night ? lamp : '#d9dde8'} stroke={line(steel)} strokeWidth={ow} />
              {night && <circle cx={lx - 10} cy={ly - 10} r={14} fill="#ffffff" />}</g>;
          })}
          {night && <Glow x={mx} y={-H * 1.5 - 65} r={520} color={lamp} opacity={0.6} />}
        </g>;
      })}
      {/* the raked bank */}
      <path d={bank} fill={`url(#${id}-b)`} stroke={line(conc)} strokeWidth={ow * 2} paintOrder="stroke" />
      <g clipPath={`url(#${id}-c)`}>
        {Array.from({length: rows}).map((_, i) => {
          const yy = -210 - i * gap;
          const rowW = w / 2 - (w * 0.08) * (i / rows) - 20;
          const n = Math.floor((rowW * 2) / (rHead * 2.5));
          const ribbon = i % 2 ? colours[0] : shade(colours[0], 0.12);
          return <g key={i}>
            <rect x={-rowW} y={yy} width={rowW * 2} height={gap * 0.2} fill={shade(conc, 0.28)} />
            {crowd > 0 && <path d={rr(-rowW, yy - rHead * 1.25, rowW * 2, rHead * 1.3, rHead * 0.6)} fill={ribbon} />}
            {crowd > 0 && Array.from({length: n}, (_, j) => {
              const r1 = ((seed * 2654435761) ^ ((i * 97 + j) * 40503)) >>> 0;
              const on = ((r1 >>> 8) % 1000) / 1000 < crowd;
              if (!on) return null;
              const cx = -rowW + (j + 0.5) * (rowW * 2 / n);
              const lift = Math.exp(-(((cx - waveX) / 280) ** 2)) * gap * 0.6;
              const shirt = lift > gap * 0.3 ? colours[1] : ribbon, skin = skins[1 + ((r1 >>> 5) % 4)];
              const by = yy - lift;
              return <g key={j}>
                {lift > 2 && <path d={rr(cx - rHead * 0.95, by - rHead * 1.25, rHead * 1.9, rHead * 1.3 + lift, rHead * 0.6)} fill={shirt} />}
                {lift > gap * 0.3 && <path d={`M${cx - rHead * 0.7} ${by - rHead} L${cx - rHead * 1.1} ${by - rHead * 2.9} M${cx + rHead * 0.7} ${by - rHead}
                  L${cx + rHead * 1.1} ${by - rHead * 2.9}`} stroke={shirt} strokeWidth={rHead * 0.55} strokeLinecap="round" />}
                <circle cx={cx} cy={by - rHead * 1.7} r={rHead * 0.8} fill={skin} />
              </g>;
            })}
          </g>;
        })}
        <path d={bank} fill="none" stroke="#ffffff" strokeWidth={60} opacity={0.18} transform="translate(-30 0)" />
      </g>
      {/* the wall in the school colour */}
      <path d={rr(-w / 2, -170, w, 170, 60)} fill={`url(#${id}-wall)`} stroke={line(colours[0])} strokeWidth={ow * 2} paintOrder="stroke" />
      <path d={`M${-w / 2 + 80} -140 L${w / 2 - 80} -140`} stroke={colours[1]} strokeWidth={24} strokeLinecap="round" />
      {/* the press box riding the top */}
      <path d={rr(-w * 0.2, topY - 330, w * 0.4, 330, 70)} fill={`url(#${id}-pb)`} stroke={line('#e9e6f0')} strokeWidth={ow * 2} paintOrder="stroke" />
      <path d={rr(-w * 0.21, topY - 370, w * 0.42, 70, 35)} fill={colours[0]} stroke={line(colours[0])} strokeWidth={ow * 2} paintOrder="stroke" />
      {Array.from({length: 7}).map((_, i) => <path key={i} d={rr(-w * 0.18 + i * (w * 0.36 / 7) + 20, topY - 260, w * 0.36 / 7 - 40, 170, 30)}
        fill={night ? lamp : '#2c3256'} stroke={line('#e9e6f0')} strokeWidth={ow} opacity={night ? (i === 3 && frame % 60 < 30 ? 0.75 : 0.95) : 0.9} />)}
    </g>
  );
};

// ------------------------------------------------------------------------------------------ OFFICIAL

/** the rig's arm table, mirrored from look/Figure.tsx so the official's stripes follow the sleeves exactly */
const ARMS: Record<FigurePose, {l: [number, number]; r: [number, number]}> = {
  stand: {l: [10, 8], r: [10, 8]}, wave: {l: [10, 8], r: [140, 35]}, point: {l: [12, 10], r: [92, 2]},
  cheer: {l: [158, 12], r: [158, 12]}, think: {l: [14, 10], r: [30, 168]}, hold: {l: [16, -86], r: [16, -86]},
  shrug: {l: [48, -112], r: [48, -112]}, reach: {l: [52, -40], r: [52, -40]}, hips: {l: [50, -74], r: [50, -74]},
  crossed: {l: [6, -112], r: [10, -104]}, panic: {l: [128, 52], r: [128, 52]}, raise: {l: [10, 8], r: [172, 6]},
};
const rigArms = (pose: FigurePose, frame: number, seed: number, build: number) => {
  const bw = 0.88 + Math.max(0, Math.min(1, build)) * 0.28, SX = 64 * bw;
  const t = frame / 30;
  const bob = Math.sin(t * 2 * Math.PI / 3.6 + seed) * 3, breath = Math.sin(t * 2 * Math.PI / 3.6 + seed) * 0.012;
  const sway = Math.sin(t * 2 * Math.PI / 4.4 + seed * 1.3) * 4;
  const one = (side: 1 | -1) => {
    const key = side < 0 ? 'l' : 'r';
    let [up, fore] = ARMS[pose][key];
    if (pose === 'wave' && key === 'r') fore += Math.sin(t * 2 * Math.PI * 1.8) * 22;
    if (pose === 'cheer') up += Math.sin(t * 2 * Math.PI * 1.4 + (key === 'l' ? 0 : 1)) * 6;
    if (pose === 'stand' || pose === 'point') up += (key === 'l' ? 1 : -1) * sway * 0.4;
    const sx = side * SX, sy = -318 + bob * 0.6;
    const a1 = side * up * Math.PI / 180, ex = sx + Math.sin(a1) * 92, ey = sy + Math.cos(a1) * 92;
    const a2 = side * (up + fore) * Math.PI / 180;
    return {sx, sy, ex, ey, wx: ex + Math.sin(a2) * 86, wy: ey + Math.cos(a2) * 86};
  };
  return {L: one(-1), R: one(1), bob, breath, bw};
};

/**
 * THE OFFICIAL on the cast rig. Vertical black and white stripes on the shirt and sleeves, white
 * knickers, black socks and belt, a black cap, a whistle on its lanyard and the gold flag tucked at the
 * hip. The default pose is the touchdown signal, both arms straight up. The stripes are the whole read
 * at any distance.
 */
export const OfficialV2: React.FC<Place & {pose?: FigurePose; emotion?: FigureEmotion; skin?: string}> = (p) => {
  const {frame = 0, pose = 'cheer', emotion = 'excited', skin = SKIN_TONES[2], seed = 54} = p;
  const id = useUid();
  const k = 180 / FIG, build = 0.55;
  const {L, R, bob, breath, bw} = rigArms(pose, frame, seed, build);
  const torsoTop = -350 + bob * 0.6, torsoBot = -128, headY = -420 + bob;
  const torso = `M${-78} ${torsoTop + 30} Q${-82} ${torsoTop} ${-40} ${torsoTop - 4} L${40} ${torsoTop - 4}
    Q${82} ${torsoTop} ${78} ${torsoTop + 30} L${86} ${torsoBot - 10} Q${86} ${torsoBot + 14} ${60} ${torsoBot + 14}
    L${-60} ${torsoBot + 14} Q${-86} ${torsoBot + 14} ${-86} ${torsoBot - 10} Z`;
  const armD = (A: typeof L) => `M${A.sx} ${A.sy} L${A.ex} ${A.ey} L${A.wx} ${A.wy}`;
  const black = '#24212f', white = '#f6f4ee', flag = '#ffd21f';
  return (
    <g transform={at(p)}>
      <g transform={`scale(${k})`}>
        <defs>
          <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={-400} y={-700} width={800} height={800}>
            <g transform={`scale(${bw} 1)`}><path d={torso} fill="#ffffff" transform={`scale(1 ${1 + breath})`} />
              <path d={torso} fill="none" stroke="#000000" strokeWidth={10} transform={`scale(1 ${1 + breath})`} /></g>
            <path d={armD(L)} stroke="#ffffff" strokeWidth={33} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d={armD(R)} stroke="#ffffff" strokeWidth={33} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx={0} cy={headY} r={92} fill="#000000" />
            <path d={`M-34 ${torsoTop - 6} Q0 ${torsoTop + 36} 34 ${torsoTop - 6} Z`} fill="#000000" />
            {[L, R].map((A, i) => <circle key={i} cx={A.wx} cy={A.wy} r={29} fill="#000000" />)}
          </mask>
        </defs>
        <Figure frame={frame} x={0} y={0} pose={pose} emotion={emotion} skin={skin} hair="short" hairColor="#2b1d14" hat="cap" hatColor={black}
          top="tee" shirt={white} pants={white} seed={seed} build={build} />
        {/* the stripes, on the shirt and the sleeves only */}
        <g mask={`url(#${id}-m)`}>
          {Array.from({length: 11}).map((_, i) => <rect key={i} x={-198 + i * 36} y={-640} width={17} height={560} fill={black} />)}
          <rect x={-120} y={torsoBot - 12} width={240} height={30} fill={black} />
        </g>
        {/* black collar, lanyard and whistle */}
        <path d={`M-32 ${torsoTop - 4} Q0 ${torsoTop + 30} 32 ${torsoTop - 4}`} stroke={black} strokeWidth={12} fill="none" strokeLinecap="round" />
        <path d={`M-22 ${torsoTop + 6} Q-6 ${torsoTop + 70} 6 ${torsoTop + 78}`} stroke={black} strokeWidth={4} fill="none" />
        <path d={rr(-6, torsoTop + 72, 30, 16, 8)} fill="#d9dde8" stroke={line('#d9dde8')} strokeWidth={4} />
        {/* black socks over the knicker legs */}
        {[-1, 1].map((s) => <path key={s} d={`M${s * 34} -72 L${s * 34} -30`} stroke={black} strokeWidth={42} />)}
        {/* the gold flag tucked at the hip */}
        <path d={`M62 ${torsoBot + 2} Q84 ${torsoBot + 6} 80 ${torsoBot + 40} Q72 ${torsoBot + 62} 58 ${torsoBot + 52} Q62 ${torsoBot + 24} 62 ${torsoBot + 2} Z`}
          fill={flag} stroke={line(flag)} strokeWidth={6} strokeLinejoin="round" />
      </g>
    </g>
  );
};

export const FOOTBALL_V2 = ['HelmetV2', 'FootballV2', 'ShoulderPadsV2', 'ScoreboardV2', 'ChainGangV2', 'BlockingSledV2', 'WaterCoolerV2',
  'DrillTeamV2', 'LettermanJacketV2', 'FootballAnnualV2', 'TrophyV2', 'EndZonePylonV2', 'GrandstandBowlV2', 'OfficialV2'] as const;
