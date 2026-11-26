import React from 'react';
import {ContactShadow, Glow, clamp01, ease, easeOutBack, lerp} from '../../../look/Kit';
import {line, light, shade} from '../../../look/color';
import {FONT} from '../../../lib/type';

/**
 * smoke-watch-1125 parts. Every drawing here is original and follows LOOK_V2: round corners, a key from the upper
 * left, shade toward violet, hue-tinted line, a contact shadow under anything that stands. The camera station, the
 * screens, the brush truck and the map are illustrative. No company's mark is drawn, and no real person's likeness.
 */

export const after = (since: number, dur: number) => (since < 0 ? 0 : ease(since / dur));
export const pop = (since: number, dur = 0.5, k = 1.7) => (since < 0 ? 0 : easeOutBack(clamp01(since / dur), k));

/** bold text with a deep rim of its own hue, readable on bright and dark */
export const Word: React.FC<{x: number; y: number; t: string; size?: number; c?: string; anchor?: 'start' | 'middle' | 'end'; op?: number;
  rot?: number}> = ({x, y, t, size = 48, c = '#fff6e6', anchor = 'middle', op = 1, rot = 0}) => (
  <g opacity={op} transform={`rotate(${rot} ${x} ${y})`}>
    <text x={x} y={y} textAnchor={anchor} fontFamily={FONT.body} fontWeight={900} fontSize={size} fill={line(c)} stroke={line(c)}
      strokeWidth={size * 0.2} strokeLinejoin="round">{t}</text>
    <text x={x} y={y} textAnchor={anchor} fontFamily={FONT.body} fontWeight={900} fontSize={size} fill={c}>{t}</text>
  </g>
);

/** a lit rounded box, the way every cabinet, sign and panel here is built */
export const LitBox: React.FC<{x: number; y: number; w: number; h: number; r?: number; c: string; sw?: number; op?: number}> = ({
  x, y, w, h, r = 24, c, sw = 7, op = 1}) => (
  <g opacity={op}>
    <rect x={x} y={y} width={w} height={h} rx={r} fill={shade(c, 0.25)} stroke={line(c)} strokeWidth={sw} />
    <rect x={x + sw * 0.6} y={y + sw * 0.6} width={w * 0.94 - sw} height={h * 0.9 - sw} rx={Math.max(4, r - sw)} fill={c} />
    <rect x={x + w * 0.08} y={y + h * 0.08} width={w * 0.5} height={Math.max(4, h * 0.05)} rx={Math.max(2, h * 0.025)} fill={light(c, 0.55)} opacity={0.7} />
  </g>
);

export type EyeMood = 'calm' | 'scan' | 'alert' | 'squint' | 'proud' | 'sleepy';
const STEEL = '#c9d2e4';
const CAM = '#f3f5fb';
const ACCENT = '#ff7a2f';

/**
 * THE HERO. A camera station on a lattice tower: two round white camera heads side by side on a little platform, and
 * the two cameras ARE its two eyes. Each lens has an iris that pans with `look` and a catchlight; a brow bar over each
 * head acts. A solar panel and a small box hang lower on the tower. `sweep` 0 to 1 draws the 360 degree sweep ring
 * round the top. Base at (x, y), about 1500 units tall at s 1.
 */
export const Lookout: React.FC<{x: number; y: number; s?: number; frame: number; look?: number; mood?: EyeMood; sweep?: number;
  beam?: number; beamDir?: number; h?: number}> = ({x, y, s = 1, frame, look = 0, mood = 'scan', sweep = 0, beam = 0, beamDir = 1, h = 1500}) => {
  const blink = (frame % 113) < 4 ? [1, 0.3, 0.1, 0.6][frame % 113] : 1;
  const sway = Math.sin(frame / 41) * 1.2;
  const eyeR = mood === 'squint' ? 0.45 : mood === 'alert' ? 1.15 : mood === 'sleepy' ? 0.35 : 1;
  const browY = mood === 'alert' ? -118 : mood === 'squint' ? -86 : -100;
  const browTilt = mood === 'squint' ? 10 : mood === 'alert' ? -6 : mood === 'proud' ? -10 : 0;
  const top = -h;
  const legs = (k: number) => lerp(150, 46, k);
  const rungs = 9;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ContactShadow x={0} y={8} w={420} opacity={0.36} />
      <g transform={`rotate(${sway} 0 0)`}>
        {/* the lattice: two tapering legs, cross braces, a ladder line, all rounded */}
        {[-1, 1].map((side) => (
          <path key={side} d={`M${side * legs(0)} 0 L${side * legs(1)} ${top + 60}`} stroke={shade(STEEL, side > 0 ? 0.28 : 0.02)} strokeWidth={22}
            strokeLinecap="round" />
        ))}
        {Array.from({length: rungs}, (_, i) => {
          const k0 = i / rungs, k1 = (i + 1) / rungs;
          const y0 = lerp(0, top + 60, k0), y1 = lerp(0, top + 60, k1);
          return (
            <g key={i}>
              <path d={`M${-legs(k0)} ${y0} L${legs(k1)} ${y1}`} stroke={shade(STEEL, 0.18)} strokeWidth={9} strokeLinecap="round" />
              <path d={`M${legs(k0)} ${y0} L${-legs(k1)} ${y1}`} stroke={shade(STEEL, 0.1)} strokeWidth={9} strokeLinecap="round" />
              <path d={`M${-legs(k1)} ${y1} L${legs(k1)} ${y1}`} stroke={STEEL} strokeWidth={11} strokeLinecap="round" />
            </g>
          );
        })}
        {[-1, 1].map((side) => (
          <path key={`l${side}`} d={`M${side * legs(0) - side * 6} 0 L${side * legs(1) - side * 6} ${top + 60}`} stroke={line(STEEL)} strokeWidth={4}
            opacity={0.5} />
        ))}
        {/* a rust drip and one bent brace: maintained but worn */}
        <path d={`M${legs(0.32) - 4} ${lerp(0, top, 0.32)} q4 40 -2 70`} stroke="#b9653a" strokeWidth={6} strokeLinecap="round" opacity={0.7} />
        {/* the solar panel and the box */}
        <g transform={`translate(${legs(0.45) + 6} ${lerp(0, top, 0.45)})`}>
          <rect x={0} y={-60} width={90} height={120} rx={20} fill="#9aa6c0" stroke={line('#9aa6c0')} strokeWidth={6} />
          <circle cx={45} cy={-30} r={9} fill={mood === 'alert' ? ACCENT : '#3ddc84'} />
        </g>
        {/* the platform */}
        <rect x={-210} y={top + 30} width={420} height={44} rx={22} fill={shade(STEEL, 0.15)} stroke={line(STEEL)} strokeWidth={7} />
        <rect x={-200} y={top + 34} width={300} height={10} rx={5} fill="#ffffff" opacity={0.5} />
        {/* the sweep ring, drawn round the head */}
        {sweep > 0 && (
          <g opacity={0.9}>
            <ellipse cx={0} cy={top - 70} rx={360} ry={70} fill="none" stroke="#38f2e0" strokeWidth={8} strokeDasharray={`${2260 * sweep} 3000`}
              transform={`rotate(0)`} />
            <circle cx={360 * Math.cos(sweep * Math.PI * 2)} cy={top - 70 + 70 * Math.sin(sweep * Math.PI * 2)} r={16} fill="#38f2e0" />
          </g>
        )}
        {/* a view beam out to one side */}
        {beam > 0 && (
          <path d={`M${beamDir * 140} ${top - 80} L${beamDir * 1100} ${top - 380 * beam} L${beamDir * 1100} ${top + 260 * beam} Z`} fill="#38f2e0"
            opacity={0.14} />
        )}
        {/* the two camera heads, the eyes */}
        {[-1, 1].map((side) => {
          const cx = side * 105;
          return (
            <g key={side} transform={`translate(${cx} ${top - 70})`}>
              <rect x={-14} y={30} width={28} height={70} rx={14} fill={STEEL} stroke={line(STEEL)} strokeWidth={5} />
              <ellipse cx={0} cy={0} rx={96} ry={84} fill={shade(CAM, 0.2)} stroke={line(CAM)} strokeWidth={8} />
              <ellipse cx={-10} cy={-8} rx={82} ry={70} fill={CAM} />
              <ellipse cx={-36} cy={-44} rx={30} ry={12} fill="#ffffff" />
              <ellipse cx={look * 26} cy={8} rx={50} ry={50 * eyeR * blink} fill="#14183a" />
              <ellipse cx={look * 30} cy={8} rx={26} ry={26 * eyeR * blink} fill={mood === 'alert' ? '#ff9d4d' : '#38f2e0'} />
              <circle cx={look * 30 - 12} cy={8 - 14 * eyeR * blink} r={9 * blink} fill="#ffffff" />
              <path d={`M-60 ${browY} L60 ${browY}`} stroke={shade('#5a6480', 0.1)} strokeWidth={16} strokeLinecap="round"
                transform={`rotate(${browTilt * side} 0 ${browY})`} />
            </g>
          );
        })}
      </g>
    </g>
  );
};

/** a soft smoke plume rising from the grass in an S-curve that widens and drifts downwind; `p` 0 to 1 grows it, `heat` adds an
 * ember glow and a flame tongue at the base */
export const SmokeWisp: React.FC<{x: number; y: number; s?: number; p: number; frame: number; heat?: number; c?: string}> = ({x, y, s = 1, p, frame,
  heat = 0, c = '#cfc8d6'}) => {
  if (p <= 0) return null;
  const n = 22;
  const drift = (frame / 30) * 0.12;
  const at = (k: number) => [Math.sin(k * 4.2 + frame / 40) * 46 * k + k * k * 300, -k * 640] as const;
  const puffs = Array.from({length: n}, (_, i) => {
    const k = ((drift + i / n) % 1) * p;
    const [px, py] = at(k);
    const r = 18 + k * 120;
    return {k, px: px + Math.sin(i * 2.7) * r * 0.25, py, r, i};
  }).sort((u, v) => v.k - u.k);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {heat > 0 && <Glow x={0} y={-10} r={130} color="#ff8a3d" opacity={0.55 * heat} />}
      {puffs.map(({k, px, py, r, i}) => (
        <g key={i} opacity={(1 - k * 0.75) * 0.9}>
          <circle cx={px} cy={py + r * 0.12} r={r} fill={shade(c, 0.22)} />
          <circle cx={px - r * 0.2} cy={py - r * 0.1} r={r * 0.82} fill={c} />
          <circle cx={px - r * 0.38} cy={py - r * 0.32} r={r * 0.32} fill={light(c, 0.35)} opacity={0.7} />
        </g>
      ))}
      {heat > 0 && <path d={`M-40 0 Q-26 ${-50 - 10 * Math.sin(frame / 3)} -6 -24 Q10 ${-78 - 12 * Math.sin(frame / 4)} 30 -18 Q44 -40 40 0 Z`} fill="#ff8a3d"
        opacity={heat} stroke={line('#ff8a3d')} strokeWidth={4} />}
      {heat > 0 && <path d="M-16 0 Q-6 -34 4 -12 Q14 -40 22 0 Z" fill="#ffd34d" opacity={heat} />}
    </g>
  );
};

/**
 * THE BRUSH TRUCK: a red crew-cab pickup with a white water tank and a hose reel on the flatbed, a light bar on the cab.
 * Faces right. Base centre at (x, y), about 900 wide at s 1. `lights` flashes the bar, `roll` turns the wheels.
 */
export const BrushTruck: React.FC<{x: number; y: number; s?: number; frame: number; lights?: boolean; roll?: number; dust?: number}> = ({x, y, s = 1,
  frame, lights = false, roll = 0, dust = 0}) => {
  const red = '#d9362b';
  const on = lights && Math.floor(frame / 5) % 2 === 0;
  const wheel = (wx: number) => (
    <g transform={`translate(${wx} -70)`}>
      <circle r={78} fill="#2a2a3a" stroke={line('#2a2a3a')} strokeWidth={6} />
      <circle r={40} fill="#b9c1d4" />
      <g transform={`rotate(${roll * 360})`}>{[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={24 * Math.cos(i * 1.256)} cy={24 * Math.sin(i * 1.256)} r={6}
        fill="#6a7088" />)}</g>
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ContactShadow x={0} y={6} w={900} opacity={0.4} />
      {dust > 0 && Array.from({length: 6}, (_, i) => <circle key={i} cx={-470 - i * 70} cy={-50 - i * 16} r={40 + i * 18} fill="#d9b58a" opacity={dust * (0.5 - i * 0.07)} />)}
      {/* the flatbed with the tank and the reel */}
      <rect x={-440} y={-230} width={470} height={70} rx={20} fill={shade(red, 0.25)} stroke={line(red)} strokeWidth={7} />
      <rect x={-420} y={-420} width={300} height={190} rx={48} fill="#f1f1ec" stroke={line('#f1f1ec')} strokeWidth={7} />
      <rect x={-400} y={-404} width={180} height={18} rx={9} fill="#ffffff" />
      <circle cx={-30} cy={-320} r={78} fill="#e3c03c" stroke={line('#e3c03c')} strokeWidth={7} />
      <circle cx={-30} cy={-320} r={52} fill="none" stroke="#c0392b" strokeWidth={18} />
      <circle cx={-30} cy={-320} r={18} fill="#6a5a2a" />
      {/* the cab */}
      <path d="M40 -160 L40 -390 Q40 -420 70 -420 L260 -420 Q300 -420 320 -380 L380 -250 L440 -240 Q470 -236 470 -200 L470 -160 Z" fill={red}
        stroke={line(red)} strokeWidth={8} strokeLinejoin="round" />
      <path d="M80 -390 L250 -390 Q280 -390 296 -360 L330 -280 L80 -280 Z" fill="#9fd4ff" stroke={line('#9fd4ff')} strokeWidth={6} strokeLinejoin="round" />
      <path d="M96 -376 L190 -376" stroke="#ffffff" strokeWidth={10} strokeLinecap="round" opacity={0.7} />
      <rect x={-440} y={-170} width={910} height={30} rx={14} fill={shade(red, 0.35)} />
      <rect x={60} y={-250} width={150} height={16} rx={8} fill="#ffffff" opacity={0.8} />
      {/* light bar */}
      <rect x={90} y={-452} width={200} height={34} rx={17} fill="#3a3a4a" />
      <rect x={98} y={-448} width={90} height={26} rx={13} fill={on ? '#ff3b3b' : '#7a2a2a'} />
      <rect x={192} y={-448} width={90} height={26} rx={13} fill={!on && lights ? '#ffd23a' : '#7a6a2a'} />
      {on && <Glow x={140} y={-436} r={160} color="#ff3b3b" opacity={0.5} />}
      <rect x={440} y={-226} width={30} height={30} rx={10} fill="#fff4b0" />
      {wheel(-300)}{wheel(330)}
    </g>
  );
};

/** a verifier's monitor: a rounded screen on a stand, children drawn in its 900x520 screen space */
export const Monitor: React.FC<{x: number; y: number; s?: number; children?: React.ReactNode; glow?: number}> = ({x, y, s = 1, children, glow = 0.3}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ContactShadow x={0} y={340} w={360} opacity={0.3} />
    <rect x={-40} y={270} width={80} height={70} rx={14} fill="#5b6378" />
    <rect x={-150} y={330} width={300} height={24} rx={12} fill="#6b7390" />
    <rect x={-470} y={-290} width={940} height={580} rx={42} fill="#232842" stroke={line('#232842')} strokeWidth={8} />
    <rect x={-450} y={-270} width={900} height={520} rx={28} fill="#0f1430" />
    <g transform="translate(-450 -270)">
      <svg x={0} y={0} width={900} height={520} viewBox="0 0 900 520" overflow="hidden">{children}</svg>
    </g>
    <Glow x={0} y={0} r={520} color="#38c8f2" opacity={glow} />
    <path d="M-430 -250 L-200 -250" stroke="#ffffff" strokeWidth={8} strokeLinecap="round" opacity={0.18} />
  </g>
);

/** the camera's view of the plains in screen space 900x520: sky, a far mesa line, grass, a fence and a smoke curl at sx */
export const PanoView: React.FC<{frame: number; smoke: number; sx?: number; pan?: number; town?: number; pixel?: number}> = ({frame, smoke, sx = 620,
  pan = 0, town = 0, pixel = 0}) => (
  <g>
    <rect x={0} y={0} width={900} height={520} fill="#7fb6f0" />
    <rect x={0} y={250} width={900} height={60} fill="#cfe0f4" opacity={0.6} />
    <path d={`M${-pan} 300 Q${150 - pan} 250 ${300 - pan} 285 L${420 - pan} 262 L${560 - pan} 262 L${640 - pan} 290 Q${800 - pan} 255 ${1000 - pan} 300 L900 520 L0 520 Z`}
      fill="#c99a7a" />
    <path d="M0 330 Q450 300 900 335 L900 520 L0 520 Z" fill="#c8a864" />
    <path d="M0 400 Q450 380 900 410 L900 520 L0 520 Z" fill="#b28a4c" />
    {Array.from({length: 10}, (_, i) => <rect key={i} x={i * 95 - (pan % 95)} y={392} width={8} height={40} rx={4} fill="#7a5a3a" />)}
    {town > 0 && (
      <g transform="translate(140 300)">
        {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={i * 40} y={-30 - (i % 3) * 14} width={34} height={40 + (i % 3) * 14} rx={6}
          fill={['#e6d3b0', '#d7a07a', '#f0e6d0', '#c98a6a', '#e0c49a'][i]} />)}
        <rect x={60} y={-90} width={16} height={60} rx={6} fill="#bfc6d4" />
        <ellipse cx={68} cy={-96} rx={30} ry={18} fill="#d0d6e2" />
        {pixel > 0 && Array.from({length: 24}, (_, i) => (
          <rect key={`p${i}`} x={-10 + (i % 6) * 38} y={-110 + Math.floor(i / 6) * 38} width={38} height={38}
            fill={['#b8a690', '#cdb9a0', '#a8987e', '#d8c8ae'][(i * 7) % 4]} opacity={pixel} />
        ))}
      </g>
    )}
    {smoke > 0 && <SmokeWisp x={sx} y={340} s={0.35} p={smoke} frame={frame} />}
  </g>
);

/** an overhead map in screen space: tan pasture, a road, two tower marks, bearing lines that meet in a pin */
export const TriMap: React.FC<{x: number; y: number; w: number; h: number; frame: number; a: number; b: number; pin: number;
  towers?: [number, number][]; target?: [number, number]}> = ({x, y, w, h, frame, a, b, pin, towers = [[0.18, 0.78], [0.84, 0.72]],
  target = [0.56, 0.3]}) => {
  const P = (u: [number, number]) => [x + u[0] * w, y + u[1] * h] as const;
  const [tx, ty] = P(target);
  const ray = (k: number, p: number) => {
    const [ax, ay] = P(towers[k]);
    const ex = ax + (tx - ax) * 1.25 * p, ey = ay + (ty - ay) * 1.25 * p;
    return <path d={`M${ax} ${ay} L${ex} ${ey}`} stroke="#38f2e0" strokeWidth={10} strokeLinecap="round" strokeDasharray="26 16" />;
  };
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={44} fill="#d9c08a" stroke={line('#d9c08a')} strokeWidth={8} />
      <path d={`M${x} ${y + h * 0.55} Q${x + w * 0.5} ${y + h * 0.45} ${x + w} ${y + h * 0.6}`} stroke="#f2e6c8" strokeWidth={18} fill="none" />
      {Array.from({length: 7}, (_, i) => (
        <circle key={i} cx={x + w * (0.1 + (i * 0.37) % 0.8)} cy={y + h * (0.12 + (i * 0.23) % 0.8)} r={22} fill="#9aa65a" opacity={0.6} />
      ))}
      <path d={`M${x + w * 0.05} ${y + h * 0.2} Q${x + w * 0.3} ${y + h * 0.3} ${x + w * 0.42} ${y + h * 0.08}`} stroke="#6fa4d8" strokeWidth={12}
        fill="none" strokeLinecap="round" />
      {ray(0, a)}{ray(1, b)}
      {towers.map((u, i) => {
        const [cx, cy] = P(u);
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={40} fill="#2a3160" stroke="#ffffff" strokeWidth={6} />
            <circle cx={cx - 12} cy={cy} r={9} fill="#38f2e0" /><circle cx={cx + 12} cy={cy} r={9} fill="#38f2e0" />
          </g>
        );
      })}
      {pin > 0 && (
        <g transform={`translate(${tx} ${ty - 70 * (1 - easeOutBack(clamp01(pin), 2))})`}>
          <circle r={70 + 30 * Math.sin(frame / 6)} fill={ACCENT} opacity={0.18} />
          <path d="M0 0 C-40 -50 -46 -80 -46 -100 A46 46 0 1 1 46 -100 C46 -80 40 -50 0 0 Z" fill={ACCENT} stroke={line(ACCENT)} strokeWidth={6} />
          <circle cx={0} cy={-100} r={18} fill="#ffffff" />
        </g>
      )}
    </g>
  );
};

/** a phone in a hand-free cradle with rings radiating: the 911 call */
export const PhoneRing: React.FC<{x: number; y: number; s?: number; frame: number; ring: number; text?: string}> = ({x, y, s = 1, frame, ring, text = '911'}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {ring > 0 && [0, 1, 2].map((i) => {
      const k = ((frame / 30) * 1.2 + i / 3) % 1;
      return <circle key={i} r={120 + k * 220} fill="none" stroke={ACCENT} strokeWidth={10 * (1 - k)} opacity={ring * (1 - k)} />;
    })}
    <rect x={-90} y={-160} width={180} height={320} rx={36} fill="#2b2f45" stroke={line('#2b2f45')} strokeWidth={6} />
    <rect x={-74} y={-140} width={148} height={270} rx={24} fill="#1d6b4a" />
    <text x={0} y={10} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={70} fill="#ffffff">{text}</text>
    <circle cx={0} cy={80} r={30} fill="#3ddc84" />
  </g>
);

/** a big counter on a lit pill */
export const Counter: React.FC<{x: number; y: number; value: string; c?: string; size?: number; w?: number; op?: number; sub?: string}> = ({x, y, value,
  c = ACCENT, size = 150, w = 480, op = 1, sub}) => (
  <g opacity={op}>
    <LitBox x={x - w / 2} y={y - size * 0.95} w={w} h={size * 1.35 + (sub ? 60 : 0)} r={size * 0.45} c="#2a2558" />
    <Word x={x} y={y + size * 0.15} t={value} size={size} c={c} />
    {sub && <Word x={x} y={y + size * 0.15 + 70} t={sub} size={46} c="#fff6e6" />}
  </g>
);

/** a burned fence post: a cedar post charred black on top, with the wire sagging; `newPost` draws a fresh one beside it */
export const Post: React.FC<{x: number; y: number; s?: number; burnt?: number}> = ({x, y, s = 1, burnt = 0}) => {
  const wood = '#a7774a';
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ContactShadow x={0} y={4} w={120} opacity={0.35} />
      <path d="M-26 0 L-30 -300 Q-28 -320 -8 -322 L18 -318 Q30 -310 28 -290 L24 0 Z" fill={wood} stroke={line(wood)} strokeWidth={6} strokeLinejoin="round" />
      <path d="M-16 -20 L-18 -290" stroke={light(wood, 0.3)} strokeWidth={6} strokeLinecap="round" opacity={0.7} />
      {burnt > 0 && <path d="M-30 -322 L28 -318 L26 -160 Q0 -130 -28 -170 Z" fill="#2a2228" opacity={burnt} />}
      {burnt > 0 && <path d="M-22 -200 l10 -14 l8 10" stroke="#ff8a3d" strokeWidth={4} fill="none" opacity={0.6 * burnt} />}
    </g>
  );
};
