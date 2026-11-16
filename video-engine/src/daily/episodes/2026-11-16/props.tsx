import React from 'react';
import {line, light, shade} from '../../../look/color';
import {ContactShadow, Glow, clamp01, useUid} from '../../../look/Kit';
import {FONT} from '../../../lib/type';

/**
 * Small props for creek-watch-1116, drawn in the v2 idiom: the resident's lawn chair (the throughline),
 * a coffee mug, a phone, a set of keys, a glass "thinking" box and a soil sponge.
 */

/** THE LAWN CHAIR, an aluminium folding chair with green and white webbing. x, y at the feet. */
export const LawnChair: React.FC<{x: number; y: number; s?: number; folded?: number; mug?: boolean; phone?: 'green' | 'yellow' | null;
  wet?: boolean; frame?: number; facing?: 1 | -1}> = ({x, y, s = 1, folded = 0, mug = false, phone = null, wet = false, frame = 0, facing = 1}) => {
  const id = useUid();
  const al = '#d6dcea', web = '#3fae6a', web2 = '#f4f6fb';
  const f = clamp01(folded);
  const seatY = -150 + f * 20, backTop = -340 + f * 40;
  const legSpread = 120 * (1 - f) + 14 * f;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * facing} ${s})`}>
      <defs><linearGradient id={`${id}a`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={light(al, 0.5)} />
        <stop offset="100%" stopColor={shade(al, 0.35)} /></linearGradient></defs>
      <ContactShadow x={0} y={4} w={260 * (1 - f * 0.6)} opacity={0.3} />
      {/* legs */}
      <path d={`M${-legSpread} 0 L${legSpread * 0.6} ${seatY}`} stroke={line(al)} strokeWidth={20} strokeLinecap="round" />
      <path d={`M${legSpread} 0 L${-legSpread * 0.6} ${seatY}`} stroke={line(al)} strokeWidth={20} strokeLinecap="round" />
      <path d={`M${-legSpread} 0 L${legSpread * 0.6} ${seatY}`} stroke={`url(#${id}a)`} strokeWidth={12} strokeLinecap="round" />
      <path d={`M${legSpread} 0 L${-legSpread * 0.6} ${seatY}`} stroke={`url(#${id}a)`} strokeWidth={12} strokeLinecap="round" />
      {/* seat webbing */}
      {f < 0.7 && <g opacity={1 - f}>
        <rect x={-120} y={seatY - 18} width={240} height={36} rx={16} fill={web} stroke={line(web)} strokeWidth={5} />
        {[-80, -20, 40].map((wx) => <rect key={wx} x={wx} y={seatY - 18} width={34} height={36} rx={8} fill={web2} opacity={0.9} />)}
      </g>}
      {/* back */}
      <rect x={-110 + f * 60} y={backTop} width={220 - f * 120} height={seatY - backTop - 10} rx={26} fill="none" stroke={line(al)} strokeWidth={20} />
      <rect x={-110 + f * 60} y={backTop} width={220 - f * 120} height={seatY - backTop - 10} rx={26} fill="none" stroke={`url(#${id}a)`} strokeWidth={12} />
      {Array.from({length: 4}, (_, i) => <rect key={i} x={-100 + f * 60} y={backTop + 18 + i * 40} width={200 - f * 120} height={26} rx={10}
        fill={i % 2 ? web2 : web} stroke={line(web)} strokeWidth={4} />)}
      {/* armrests */}
      {f < 0.5 && [-1, 1].map((sd) => <rect key={sd} x={sd > 0 ? 90 : -150} y={seatY - 70} width={60} height={20} rx={10} fill={al}
        stroke={line(al)} strokeWidth={5} />)}
      {mug && f < 0.5 && <Mug x={-120} y={seatY - 72} s={0.8} steam frame={frame} />}
      {phone && f < 0.5 && <g transform={`translate(120 ${seatY - 74}) rotate(-8)`}>
        <rect x={-30} y={-14} width={60} height={14} rx={6} fill="#2b2d4a" />
        <rect x={-24} y={-12} width={48} height={8} rx={4} fill={phone === 'green' ? '#3ee08a' : '#ffcc33'} />
        <Glow x={0} y={-10} r={40} color={phone === 'green' ? '#3ee08a' : '#ffcc33'} opacity={0.5} />
      </g>}
      {wet && [[-60, seatY - 4], [30, seatY - 2], [80, backTop + 60]].map(([dx, dy], i) => (
        <ellipse key={i} cx={dx} cy={dy} rx={10} ry={6} fill="#bfe6ff" opacity={0.8} />))}
    </g>
  );
};

/** A COFFEE MUG, with steam when hot. Drawn about 60 px tall at s 1. */
export const Mug: React.FC<{x: number; y: number; s?: number; c?: string; steam?: boolean; frame?: number}> = ({x, y, s = 1, c = '#e8573c',
  steam = false, frame = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M22 -40 Q48 -38 46 -22 Q44 -8 22 -10" stroke={line(c)} strokeWidth={9} fill="none" strokeLinecap="round" />
    <rect x={-26} y={-58} width={52} height={60} rx={14} fill={c} stroke={line(c)} strokeWidth={5} />
    <rect x={-18} y={-50} width={10} height={40} rx={5} fill="#ffffff" opacity={0.35} />
    {steam && [0, 1].map((k) => {
      const ph = (frame / 30 * 0.8 + k * 0.5) % 1;
      return <path key={k} d={`M${-8 + k * 14} ${-64 - ph * 40} q-10 -14 0 -28 q10 -14 0 -28`} stroke="#ffffff" strokeWidth={5} fill="none"
        strokeLinecap="round" opacity={0.6 * (1 - ph)} />;
    })}
  </g>
);

/** A PHONE, upright, screen 0..w by 0..h with children drawn in screen space. x, y is its centre. */
export const Phone: React.FC<{x: number; y: number; w?: number; h?: number; tilt?: number; buzz?: number; children?: React.ReactNode;
  screen?: string}> = ({x, y, w = 420, h = 820, tilt = 0, buzz = 0, children, screen = '#16204a'}) => {
  const id = useUid();
  return (
    <g transform={`translate(${x + buzz} ${y}) rotate(${tilt})`}>
      <defs><clipPath id={`${id}c`}><rect x={-w / 2 + 22} y={-h / 2 + 22} width={w - 44} height={h - 44} rx={44} /></clipPath>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#ffffff" stopOpacity={0.25} />
          <stop offset="40%" stopColor="#ffffff" stopOpacity={0} /></linearGradient></defs>
      <rect x={-w / 2 + 16} y={-h / 2 + 30} width={w} height={h} rx={70} fill="#0b0a24" opacity={0.3} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={66} fill="#2b2d4a" stroke={line('#2b2d4a')} strokeWidth={8} />
      <rect x={-w / 2 + 22} y={-h / 2 + 22} width={w - 44} height={h - 44} rx={44} fill={screen} />
      <g clipPath={`url(#${id}c)`}><g transform={`translate(${-w / 2 + 22} ${-h / 2 + 22})`}>{children}</g></g>
      <rect x={-w / 2 + 22} y={-h / 2 + 22} width={w - 44} height={h - 44} rx={44} fill={`url(#${id}s)`} />
      <rect x={-50} y={-h / 2 + 34} width={100} height={22} rx={11} fill="#0b0a24" />
      {buzz !== 0 && [-1, 1].map((sd) => <path key={sd} d={`M${sd * (w / 2 + 24)} -60 l${sd * 24} -20 M${sd * (w / 2 + 24)} 0 l${sd * 30} 0
        M${sd * (w / 2 + 24)} 60 l${sd * 24} 20`} stroke="#ffe066" strokeWidth={10} strokeLinecap="round" />)}
    </g>
  );
};

/** A KEY RING with two keys, swinging. */
export const Keys: React.FC<{x: number; y: number; s?: number; frame: number}> = ({x, y, s = 1, frame}) => {
  const sw = Math.sin(frame / 30 * 4) * 12;
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${sw})`}>
      <circle r={22} fill="none" stroke="#c9cfe0" strokeWidth={7} />
      {[-18, 22].map((a, i) => <g key={i} transform={`rotate(${a}) translate(0 20)`}>
        <rect x={-9} y={0} width={18} height={66} rx={6} fill={i ? '#f2c94c' : '#d6dcea'} stroke={line('#d6dcea')} strokeWidth={4} />
        <circle cx={0} cy={-2} r={18} fill={i ? '#f2c94c' : '#d6dcea'} stroke={line('#d6dcea')} strokeWidth={4} />
        <circle cx={0} cy={-2} r={6} fill="#1a1236" />
      </g>)}
    </g>
  );
};

/** A plain-text tag on a rounded glass pill, for a name the narration says. */
export const Tag: React.FC<{x: number; y: number; text: string; p?: number; size?: number; c?: string}> = ({x, y, text, p = 1, size = 44,
  c = '#ffffff'}) => {
  const q = clamp01(p);
  if (q <= 0) return null;
  const w = text.length * size * 0.62 + 60;
  return (
    <g transform={`translate(${x} ${y}) scale(${0.7 + 0.3 * Math.min(1, q * 1.4)})`} opacity={clamp01(q * 3)}>
      <rect x={-w / 2} y={-size * 0.95} width={w} height={size * 1.6} rx={size * 0.8} fill="#1a1d3a" opacity={0.86} />
      <rect x={-w / 2 + 3} y={-size * 0.95 + 3} width={w - 6} height={size * 1.6 - 6} rx={size * 0.8 - 3} fill="none" stroke="#5b628f" strokeWidth={3} />
      <text x={0} y={size * 0.12} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={size} fill={c}>{text}</text>
    </g>
  );
};

/** THE SOIL SPONGE: a block of soaked earth, darker when wetter, dripping. */
export const SoilSponge: React.FC<{x: number; y: number; s?: number; wet?: number; frame: number}> = ({x, y, s = 1, wet = 1, frame}) => {
  const c = shade('#a8744a', 0.1 + wet * 0.35);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ContactShadow x={0} y={70} w={220} opacity={0.3} />
      <rect x={-110} y={-70} width={220} height={140} rx={40} fill={c} stroke={line(c)} strokeWidth={6} />
      <path d="M-110 -30 Q0 -60 110 -30 L110 -40 Q110 -70 70 -70 L-70 -70 Q-110 -70 -110 -40 Z" fill="#6aa84a" />
      {[[-60, 0], [10, 20], [60, -10], [-20, 40]].map(([dx, dy], i) => <circle key={i} cx={dx} cy={dy} r={9} fill={shade(c, 0.3)} />)}
      {wet > 0.5 && [0, 1, 2].map((k) => {
        const ph = (frame / 30 * 1.2 + k * 0.33) % 1;
        return <ellipse key={k} cx={-50 + k * 50} cy={70 + ph * 60} rx={8} ry={12} fill="#7fd0ff" opacity={1 - ph} />;
      })}
    </g>
  );
};
