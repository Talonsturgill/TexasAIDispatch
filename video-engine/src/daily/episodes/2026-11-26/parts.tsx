import React from 'react';
import {ContactShadow, Glow, clamp01, ease, easeOutBack, lerp} from '../../../look/Kit';
import {line, light, shade} from '../../../look/color';
import {FONT} from '../../../lib/type';

/**
 * steam-ahead-1126 parts. Every drawing here is original and follows LOOK_V2: round corners, a key from the upper left,
 * shade toward violet, hue-tinted line, a contact shadow under anything that stands. The coker, the boiler, the
 * compressor, the flare and the console screens are illustrative. No company's mark is drawn, and no real person's
 * likeness.
 */

export const after = (since: number, dur: number) => (since < 0 ? 0 : ease(since / dur));
export const pop = (since: number, dur = 0.5, k = 1.7) => (since < 0 ? 0 : easeOutBack(clamp01(since / dur), k));

export const ACCENT = '#ff7a2f';
export const CYAN = '#38e8f2';
export const STEEL = '#c3cbe0';

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

/** a lit vertical cylinder from (x, y) top-left, w wide, h tall */
export const Drum: React.FC<{x: number; y: number; w: number; h: number; c: string; heat?: number}> = ({x, y, w, h, c, heat = 0}) => (
  <g>
    <defs>
      <linearGradient id={`drum-${Math.round(x)}-${Math.round(w)}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={shade(c, 0.05)} /><stop offset="28%" stopColor={light(c, 0.35)} /><stop offset="70%" stopColor={c} />
        <stop offset="100%" stopColor={shade(c, 0.42)} />
      </linearGradient>
    </defs>
    <rect x={x} y={y} width={w} height={h} rx={w * 0.3} fill={`url(#drum-${Math.round(x)}-${Math.round(w)})`} stroke={line(c)} strokeWidth={8} />
    {[0.25, 0.5, 0.75].map((k) => <path key={k} d={`M${x + 6} ${y + h * k} Q${x + w / 2} ${y + h * k + 16} ${x + w - 6} ${y + h * k}`} stroke={shade(c, 0.3)}
      strokeWidth={5} fill="none" opacity={0.6} />)}
    {heat > 0 && <rect x={x + 8} y={y + h * 0.35} width={w - 16} height={h * 0.6} rx={w * 0.25} fill="#ff6a2a" opacity={heat * 0.35} />}
    <path d={`M${x + w * 0.24} ${y + 30} L${x + w * 0.24} ${y + h - 30}`} stroke="#ffffff" strokeWidth={10} strokeLinecap="round" opacity={0.35} />
  </g>
);

/** a lattice derrick, a tapered A of rounded steel, base centre (x, y), h tall */
export const Derrick: React.FC<{x: number; y: number; h: number; w?: number; c?: string}> = ({x, y, h, w = 150, c = '#e9b949'}) => {
  const n = 6;
  const at = (k: number) => lerp(w / 2, w * 0.12, k);
  return (
    <g>
      {[-1, 1].map((s) => <path key={s} d={`M${x + s * at(0)} ${y} L${x + s * at(1)} ${y - h}`} stroke={shade(c, s > 0 ? 0.25 : 0)} strokeWidth={12}
        strokeLinecap="round" />)}
      {Array.from({length: n}, (_, i) => {
        const k0 = i / n, k1 = (i + 1) / n, y0 = y - h * k0, y1 = y - h * k1;
        return (
          <g key={i}>
            <path d={`M${x - at(k0)} ${y0} L${x + at(k1)} ${y1}`} stroke={shade(c, 0.15)} strokeWidth={6} strokeLinecap="round" />
            <path d={`M${x - at(k1)} ${y1} L${x + at(k1)} ${y1}`} stroke={c} strokeWidth={7} strokeLinecap="round" />
          </g>
        );
      })}
      <rect x={x - w * 0.18} y={y - h - 22} width={w * 0.36} height={30} rx={12} fill={c} stroke={line(c)} strokeWidth={5} />
    </g>
  );
};

/** soft steam puffs rising from (x, y); p grows them, `wind` leans them */
export const Steam: React.FC<{x: number; y: number; s?: number; p?: number; frame: number; wind?: number; c?: string}> = ({x, y, s = 1, p = 1, frame,
  wind = 0.4, c = '#f4f2fa'}) => {
  if (p <= 0) return null;
  const n = 9;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={clamp01(p * 1.4)}>
      {Array.from({length: n}, (_, i) => {
        const k = ((frame / 70 + i / n) % 1);
        const r = 22 + k * 80 * p;
        return (
          <g key={i} opacity={(1 - k) * 0.85}>
            <circle cx={k * 180 * wind + Math.sin(i * 2.1 + frame / 30) * 14} cy={-k * 320 * p} r={r} fill={shade(c, 0.12)} />
            <circle cx={k * 180 * wind - r * 0.2 + Math.sin(i * 2.1 + frame / 30) * 14} cy={-k * 320 * p - r * 0.15} r={r * 0.8} fill={c} />
          </g>
        );
      })}
    </g>
  );
};

export type UnitMood = 'calm' | 'busy' | 'worried' | 'relieved' | 'proud';

/**
 * THE HERO. The delayed coker: two tall coke drums side by side in a steel structure, a derrick on top of each drum
 * (the drill that cuts the coke out), a deck between them with a small control shack whose window is its face. Base
 * centre at (x, y), about 1500 units tall at s 1. `heat` warms the drums, `steam` puffs from the top, `mood` drives
 * the face, `look` -1 to 1 turns the eyes.
 */
export const CokerUnit: React.FC<{x: number; y: number; s?: number; frame: number; heat?: number; steam?: number; mood?: UnitMood; look?: number;
  drill?: number}> = ({x, y, s = 1, frame, heat = 0.5, steam = 0.6, mood = 'calm', look = 0, drill = 0}) => {
  const blink = (frame % 101) < 4 ? [1, 0.3, 0.1, 0.6][frame % 101] : 1;
  const eyeH = mood === 'worried' ? 0.8 : mood === 'relieved' ? 0.55 : mood === 'proud' ? 0.6 : 1;
  const brow = mood === 'worried' ? 12 : mood === 'proud' ? -8 : 0;
  const mouth = mood === 'worried' ? 'M-40 52 Q0 30 40 52' : mood === 'busy' ? 'M-30 46 L30 46' : 'M-44 36 Q0 74 44 36';
  const DRUM = '#d9dde8';
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ContactShadow x={0} y={10} w={900} opacity={0.4} />
      {/* the concrete table the drums stand on */}
      <rect x={-420} y={-240} width={840} height={240} rx={30} fill="#b7aea4" stroke={line('#b7aea4')} strokeWidth={8} />
      {[-300, -100, 100, 300].map((cx) => <rect key={cx} x={cx - 40} y={-200} width={80} height={200} rx={18} fill={shade('#b7aea4', 0.25)} />)}
      <rect x={-400} y={-232} width={560} height={14} rx={7} fill="#e3dcd2" opacity={0.7} />
      {/* steel structure behind the drums */}
      {[-400, 400].map((cx) => <rect key={cx} x={cx - 16} y={-1180} width={32} height={940} rx={12} fill={shade(STEEL, 0.2)} stroke={line(STEEL)} strokeWidth={5} />)}
      {[-560, -880].map((cy) => <rect key={cy} x={-420} y={cy} width={840} height={26} rx={12} fill={STEEL} stroke={line(STEEL)} strokeWidth={5} />)}
      {/* the two drums */}
      <Drum x={-360} y={-1080} w={260} h={840} c={DRUM} heat={heat} />
      <Drum x={100} y={-1080} w={260} h={840} c={DRUM} heat={heat * 0.7} />
      {/* the top deck and the derricks */}
      <rect x={-440} y={-1200} width={880} height={50} rx={22} fill={shade('#e9b949', 0.1)} stroke={line('#e9b949')} strokeWidth={7} />
      <rect x={-430} y={-1196} width={600} height={12} rx={6} fill="#fff1c0" opacity={0.6} />
      <Derrick x={-230} y={-1200} h={300 + drill * 20} />
      <Derrick x={230} y={-1200} h={300} />
      {/* the shack and its face */}
      <g transform="translate(0 -1300)">
        <rect x={-120} y={-80} width={240} height={180} rx={34} fill="#5a74b8" stroke={line('#5a74b8')} strokeWidth={7} />
        <rect x={-100} y={-62} width={200} height={110} rx={26} fill="#16204a" />
        {[-1, 1].map((sd) => (
          <g key={sd} transform={`translate(${sd * 44} -12)`}>
            <ellipse cx={look * 8} cy={0} rx={20} ry={26 * eyeH * blink} fill={mood === 'worried' ? '#ffb15a' : CYAN} />
            <circle cx={look * 8 - 6} cy={-8 * eyeH * blink} r={6 * blink} fill="#ffffff" />
            <path d={`M-22 ${-36 - (sd * brow) / 3} L22 ${-36 + (sd * brow) / 3}`} stroke="#c7d4ff" strokeWidth={8} strokeLinecap="round" />
          </g>
        ))}
        <path d={mouth} transform="translate(0 -14) scale(0.6)" stroke={CYAN} strokeWidth={10} fill="none" strokeLinecap="round" />
        <rect x={-110} y={-74} width={120} height={10} rx={5} fill="#ffffff" opacity={0.35} />
      </g>
      {/* a rust drip and one patched plate: maintained but worn */}
      <path d="M330 -700 q6 40 -2 80" stroke="#b9653a" strokeWidth={7} strokeLinecap="round" opacity={0.7} />
      <rect x={-300} y={-420} width={70} height={50} rx={12} fill={shade(DRUM, 0.18)} opacity={0.8} />
      <Steam x={-230} y={-1500} s={1.1} p={steam} frame={frame} />
      <Steam x={230} y={-1500} s={0.9} p={steam * 0.8} frame={frame + 40} />
      {heat > 0.6 && <Glow x={0} y={-500} r={520} color="#ff8a3d" opacity={(heat - 0.6) * 0.6} />}
    </g>
  );
};

export type GaugeMood = 'calm' | 'worried' | 'panic' | 'relieved';

/**
 * THE THROUGHLINE. The steam header pressure gauge: a round brass dial with a face (two eyes above the needle hub, a
 * mouth below). `v` 0 to 1 sets the needle, `ghost` draws a dashed forecast needle at `ghostV`. Centre (x, y), radius r.
 */
export const Gauge: React.FC<{x: number; y: number; r?: number; v: number; frame: number; ghost?: number; ghostV?: number; mood?: GaugeMood;
  low?: number}> = ({x, y, r = 200, v, frame, ghost = 0, ghostV = 0.2, mood = 'calm', low = 0.3}) => {
  const ang = (k: number) => lerp(-130, 130, clamp01(k));
  const pt = (k: number, rr: number) => {
    const a = ((ang(k) - 90) * Math.PI) / 180;
    return [Math.cos(a) * rr, Math.sin(a) * rr] as const;
  };
  const arc = (k0: number, k1: number, rr: number) => {
    const [x0, y0] = pt(k0, rr), [x1, y1] = pt(k1, rr);
    return `M${x0} ${y0} A${rr} ${rr} 0 ${ang(k1) - ang(k0) > 180 ? 1 : 0} 1 ${x1} ${y1}`;
  };
  const blink = (frame % 89) < 4 ? [1, 0.3, 0.1, 0.6][frame % 89] : 1;
  const eyeH = mood === 'panic' ? 1.3 : mood === 'relieved' ? 0.5 : 1;
  const BRASS = '#e2b04a';
  const jitter = mood === 'panic' ? Math.sin(frame * 1.7) * 2.5 : 0;
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r * 1.08} fill={shade(BRASS, 0.2)} stroke={line(BRASS)} strokeWidth={r * 0.04} />
      <circle r={r * 1.0} fill={BRASS} />
      <circle cx={-r * 0.3} cy={-r * 0.45} r={r * 0.25} fill="#fff1c4" opacity={0.45} />
      <circle r={r * 0.88} fill="#fbf6ea" stroke={shade('#fbf6ea', 0.3)} strokeWidth={4} />
      <path d={arc(0, low, r * 0.74)} stroke="#ff5d5d" strokeWidth={r * 0.1} fill="none" strokeLinecap="round" />
      <path d={arc(low + 0.03, 1, r * 0.74)} stroke="#4fcf8a" strokeWidth={r * 0.1} fill="none" strokeLinecap="round" opacity={0.85} />
      {Array.from({length: 11}, (_, i) => {
        const [a0, b0] = pt(i / 10, r * 0.6), [a1, b1] = pt(i / 10, r * 0.66);
        return <path key={i} d={`M${a0} ${b0} L${a1} ${b1}`} stroke="#4a3f5e" strokeWidth={r * 0.025} strokeLinecap="round" />;
      })}
      {/* the face */}
      {[-1, 1].map((sd) => (
        <g key={sd} transform={`translate(${sd * r * 0.28} ${-r * 0.3})`}>
          <ellipse rx={r * 0.09} ry={r * 0.12 * eyeH * blink} fill="#2a2140" />
          <circle cx={-r * 0.03} cy={-r * 0.04 * eyeH} r={r * 0.03 * blink} fill="#ffffff" />
          <path d={`M${-r * 0.1} ${-r * (mood === 'worried' || mood === 'panic' ? 0.2 : 0.18) - sd * (mood === 'worried' || mood === 'panic' ? r * 0.04 : 0)} L${r * 0.1} ${-r * 0.18 + sd * (mood === 'worried' || mood === 'panic' ? r * 0.04 : 0)}`}
            stroke="#4a3f5e" strokeWidth={r * 0.035} strokeLinecap="round" />
        </g>
      ))}
      <path d={mood === 'calm' || mood === 'relieved' ? `M${-r * 0.16} ${r * 0.34} Q0 ${r * 0.48} ${r * 0.16} ${r * 0.34}` : `M${-r * 0.14} ${r * 0.44} Q0 ${r * 0.3} ${r * 0.14} ${r * 0.44}`}
        stroke="#4a3f5e" strokeWidth={r * 0.04} fill="none" strokeLinecap="round" />
      {ghost > 0 && (
        <g opacity={ghost} transform={`rotate(${ang(ghostV)})`}>
          <path d={`M0 0 L0 ${-r * 0.7}`} stroke={ACCENT} strokeWidth={r * 0.05} strokeDasharray={`${r * 0.08} ${r * 0.06}`} strokeLinecap="round" />
        </g>
      )}
      <g transform={`rotate(${ang(v) + jitter})`}>
        <path d={`M${-r * 0.045} 0 L0 ${-r * 0.74} L${r * 0.045} 0 Z`} fill="#d23a3a" stroke={line('#d23a3a')} strokeWidth={3} strokeLinejoin="round" />
      </g>
      <circle r={r * 0.08} fill="#4a3f5e" />
      <circle cx={-r * 0.02} cy={-r * 0.02} r={r * 0.03} fill="#a99cc4" />
    </g>
  );
};

/** a boiler: a squat rounded box with a burner window; `flame` 0 to 1, `falter` flickers it */
export const Boiler: React.FC<{x: number; y: number; s?: number; frame: number; flame?: number; falter?: number}> = ({x, y, s = 1, frame, flame = 1,
  falter = 0}) => {
  const C = '#7c8fc4';
  const f = flame * (1 - falter * (0.5 + 0.5 * Math.sin(frame * 1.3)));
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ContactShadow x={0} y={6} w={560} opacity={0.38} />
      <rect x={-260} y={-380} width={520} height={380} rx={60} fill={shade(C, 0.2)} stroke={line(C)} strokeWidth={8} />
      <rect x={-250} y={-372} width={470} height={330} rx={52} fill={C} />
      <rect x={-210} y={-350} width={260} height={16} rx={8} fill={light(C, 0.5)} opacity={0.6} />
      <rect x={60} y={-560} width={70} height={200} rx={24} fill={STEEL} stroke={line(STEEL)} strokeWidth={6} />
      <circle cx={-60} cy={-180} r={86} fill="#20183a" stroke={line(C)} strokeWidth={8} />
      <g opacity={clamp01(f)}>
        <Glow x={-60} y={-180} r={150} color="#ff8a3d" opacity={0.5 * f} />
        <path d={`M-110 -130 Q-96 ${-190 - 40 * f} -70 -150 Q-56 ${-230 - 50 * f} -30 -140 Q-14 ${-180 - 30 * f} -10 -130 Z`} fill="#ff8a3d" />
        <path d="M-90 -130 Q-76 -180 -60 -146 Q-46 -190 -30 -130 Z" fill="#ffd34d" />
      </g>
      <circle cx={150} cy={-200} r={40} fill="#fbf6ea" stroke={line('#fbf6ea')} strokeWidth={5} />
      <path d={`M150 -200 L${150 + 28 * Math.cos(-2.2 + f * 1.6)} ${-200 + 28 * Math.sin(-2.2 + f * 1.6)}`} stroke="#d23a3a" strokeWidth={6} strokeLinecap="round" />
    </g>
  );
};

/** a compressor with a face: a rounded casing, a spinning fan disc, a status light; `tripped` stops it with X eyes */
export const Compressor: React.FC<{x: number; y: number; s?: number; frame: number; tripped?: number; worried?: boolean}> = ({x, y, s = 1, frame,
  tripped = 0, worried = false}) => {
  const C = '#4fb3a0';
  const spin = tripped > 0.5 ? 0 : frame * 14;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ContactShadow x={0} y={6} w={620} opacity={0.38} />
      <rect x={-300} y={-60} width={600} height={60} rx={24} fill="#6b6f86" />
      <rect x={-280} y={-400} width={420} height={340} rx={150} fill={shade(C, 0.22)} stroke={line(C)} strokeWidth={8} />
      <rect x={-270} y={-392} width={380} height={300} rx={140} fill={C} />
      <ellipse cx={-160} cy={-330} rx={80} ry={22} fill={light(C, 0.55)} opacity={0.6} />
      <g transform="translate(200 -230)">
        <circle r={110} fill="#2d3550" stroke={line('#2d3550')} strokeWidth={7} />
        <g transform={`rotate(${spin})`}>
          {[0, 1, 2, 3, 4].map((i) => <ellipse key={i} cx={0} cy={-52} rx={22} ry={50} fill="#9fb4d8" transform={`rotate(${i * 72})`} />)}
        </g>
        <circle r={22} fill="#d9e2f2" />
      </g>
      {/* face */}
      {[-1, 1].map((sd) => (
        <g key={sd} transform={`translate(${-80 + sd * 60} -250)`}>
          {tripped > 0.5 ? (
            <path d="M-18 -18 L18 18 M18 -18 L-18 18" stroke="#1d2340" strokeWidth={10} strokeLinecap="round" />
          ) : (
            <>
              <ellipse rx={20} ry={worried ? 22 : 26} fill="#1d2340" />
              <circle cx={-6} cy={-8} r={6} fill="#ffffff" />
            </>
          )}
          {worried && tripped < 0.5 && <path d={`M-22 ${-40 - sd * 6} L22 ${-40 + sd * 6}`} stroke="#1d2340" strokeWidth={8} strokeLinecap="round" />}
        </g>
      ))}
      <path d={tripped > 0.5 || worried ? 'M-120 -170 Q-80 -195 -40 -170' : 'M-125 -185 Q-80 -150 -35 -185'} stroke="#1d2340" strokeWidth={9}
        fill="none" strokeLinecap="round" />
      <circle cx={60} cy={-120} r={18} fill={tripped > 0.5 ? (Math.floor(frame / 6) % 2 ? '#ff3b3b' : '#7a2020') : '#3ddc84'} />
      {tripped > 0.5 && <Glow x={60} y={-120} r={90} color="#ff3b3b" opacity={0.5} />}
    </g>
  );
};

/** a flare stack: a tall thin stack with a flame tip; `flame` 0 to 1 sizes it */
export const Flare: React.FC<{x: number; y: number; s?: number; frame: number; flame?: number}> = ({x, y, s = 1, frame, flame = 0.2}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ContactShadow x={0} y={4} w={160} opacity={0.3} />
    <rect x={-18} y={-1100} width={36} height={1100} rx={16} fill={shade(STEEL, 0.15)} stroke={line(STEEL)} strokeWidth={5} />
    {[-300, -600, -900].map((cy) => <rect key={cy} x={-40} y={cy} width={80} height={16} rx={8} fill={STEEL} />)}
    <rect x={-10} y={-1090} width={8} height={1060} rx={4} fill="#ffffff" opacity={0.3} />
    {flame > 0 && (
      <g transform={`translate(0 -1110) scale(${0.3 + flame * 1.6})`}>
        <Glow x={0} y={-60} r={200} color="#ff8a3d" opacity={0.6} />
        <path d={`M-50 0 Q-60 ${-80 - 14 * Math.sin(frame / 3)} -10 -170 Q0 ${-120 - 10 * Math.sin(frame / 2)} 20 -200 Q56 -90 50 0 Z`} fill="#ff8a3d"
          stroke={line('#ff8a3d')} strokeWidth={4} />
        <path d="M-24 0 Q-20 -60 0 -110 Q24 -50 24 0 Z" fill="#ffd34d" />
      </g>
    )}
  </g>
);

/** a monitor on a stand, children drawn in its 900x520 screen space */
export const Monitor: React.FC<{x: number; y: number; s?: number; children?: React.ReactNode; glow?: number; alert?: boolean}> = ({x, y, s = 1, children,
  glow = 0.3, alert = false}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ContactShadow x={0} y={340} w={360} opacity={0.3} />
    <rect x={-40} y={270} width={80} height={70} rx={14} fill="#5b6378" />
    <rect x={-150} y={330} width={300} height={24} rx={12} fill="#6b7390" />
    <rect x={-470} y={-290} width={940} height={580} rx={42} fill={alert ? '#5a2a36' : '#232842'} stroke={line('#232842')} strokeWidth={8} />
    <rect x={-450} y={-270} width={900} height={520} rx={28} fill="#0f1430" />
    <g transform="translate(-450 -270)">
      <svg x={0} y={0} width={900} height={520} viewBox="0 0 900 520" overflow="hidden">{children}</svg>
    </g>
    <Glow x={0} y={0} r={520} color={alert ? ACCENT : '#38c8f2'} opacity={glow} />
    <path d="M-430 -250 L-200 -250" stroke="#ffffff" strokeWidth={8} strokeLinecap="round" opacity={0.18} />
  </g>
);

/**
 * The trend on the console, in 900x520 screen space: the steam pressure line drawn on to `p`, then a forecast ghost
 * line (dashed orange) dipping below the red floor, an alert card, and, with `shed`, the real line holding level.
 */
export const Trend: React.FC<{p: number; forecast?: number; alert?: number; shed?: number; dip?: number; frame: number; minutes?: string}> = ({p, forecast = 0,
  alert = 0, shed = 0, dip = 0, frame, minutes}) => {
  const base = 210;
  const xNow = 520;
  const pts = Array.from({length: 41}, (_, i) => {
    const xx = 40 + (i / 40) * (xNow - 40);
    return [xx, base + Math.sin(i * 0.7) * 10 + Math.sin(i * 1.9) * 5] as const;
  });
  const shown = pts.slice(0, Math.max(2, Math.round(pts.length * clamp01(p))));
  const fut = Array.from({length: 21}, (_, i) => {
    const k = i / 20;
    const drop = Math.sin(Math.min(1, k * 1.4) * Math.PI) * 190;
    return [xNow + k * 340, base + drop * (1 - shed) + Math.sin(i) * 4 * shed + dip * drop * 0] as const;
  });
  const futShown = fut.slice(0, Math.max(2, Math.round(fut.length * clamp01(forecast))));
  const actual = fut.slice(0, Math.max(2, Math.round(fut.length * clamp01(dip))));
  return (
    <g>
      <rect x={0} y={0} width={900} height={520} fill="#101634" />
      {[100, 200, 300, 400].map((yy) => <path key={yy} d={`M30 ${yy} L880 ${yy}`} stroke="#26305a" strokeWidth={2} />)}
      <rect x={30} y={350} width={850} height={150} fill="#ff5d5d" opacity={0.12} />
      <path d="M30 350 L880 350" stroke="#ff5d5d" strokeWidth={4} strokeDasharray="16 12" />
      <path d={`M${xNow} 40 L${xNow} 500`} stroke="#8fa0d8" strokeWidth={3} opacity={0.6} />
      <text x={xNow + 10} y={64} fontFamily={FONT.body} fontWeight={800} fontSize={26} fill="#8fa0d8">NOW</text>
      <path d={`M${shown.map(([a, b]) => `${a} ${b}`).join(' L')}`} stroke={CYAN} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {forecast > 0 && (
        <path d={`M${futShown.map(([a, b]) => `${a} ${b}`).join(' L')}`} stroke={ACCENT} strokeWidth={8} fill="none" strokeDasharray="20 14"
          strokeLinecap="round" opacity={0.95} />
      )}
      {dip > 0 && (
        <path d={`M${actual.map(([a]) => `${a} ${base + Math.sin(a) * 4}`).join(' L')}`} stroke={CYAN} strokeWidth={9} fill="none" strokeLinecap="round" />
      )}
      {alert > 0 && (
        <g transform={`translate(560 ${100 - (1 - alert) * 40}) scale(${0.8 + 0.2 * alert})`} opacity={alert}>
          <rect x={0} y={0} width={320} height={110} rx={26} fill={ACCENT} stroke={line(ACCENT)} strokeWidth={5} />
          <circle cx={46} cy={55} r={24} fill="#fff6e6" opacity={0.5 + 0.5 * Math.abs(Math.sin(frame / 6))} />
          <text x={46} y={66} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={34} fill={ACCENT}>!</text>
          <text x={86} y={50} fontFamily={FONT.body} fontWeight={900} fontSize={30} fill="#fff6e6">DIP AHEAD</text>
          <text x={86} y={88} fontFamily={FONT.body} fontWeight={800} fontSize={26} fill="#fff6e6">{minutes ?? 'shed steam?'}</text>
        </g>
      )}
    </g>
  );
};

/** a big counter on a lit plate */
export const Counter: React.FC<{x: number; y: number; value: string; c?: string; size?: number; w?: number; op?: number; sub?: string}> = ({x, y, value,
  c = ACCENT, size = 150, w = 480, op = 1, sub}) => (
  <g opacity={op}>
    <LitBox x={x - w / 2} y={y - size * 0.95} w={w} h={size * 1.35 + (sub ? 60 : 0)} r={size * 0.45} c="#2a2558" />
    <Word x={x} y={y + size * 0.15} t={value} size={size} c={c} />
    {sub && <Word x={x} y={y + size * 0.15 + 70} t={sub} size={46} c="#fff6e6" />}
  </g>
);

/** a horizontal steam line with a valve wheel; `flow` moves dashes along it, `turn` spins the wheel, `branch` shuts a side line */
export const SteamLine: React.FC<{x0: number; x1: number; y: number; frame: number; flow?: number; turn?: number; valveX?: number; r?: number;
  shut?: number}> = ({x0, x1, y, frame, flow = 1, turn = 0, valveX, r = 38, shut = 0}) => {
  const vx = valveX ?? (x0 + x1) / 2;
  return (
    <g>
      <rect x={x0} y={y - r} width={x1 - x0} height={r * 2} rx={r} fill={shade(STEEL, 0.15)} stroke={line(STEEL)} strokeWidth={6} />
      <rect x={x0 + 10} y={y - r * 0.7} width={x1 - x0 - 20} height={r * 0.35} rx={r * 0.17} fill="#ffffff" opacity={0.35} />
      {flow > 0 && (
        <path d={`M${x0 + 20} ${y} L${shut > 0.5 ? vx - 40 : x1 - 20} ${y}`} stroke={CYAN} strokeWidth={r * 0.35} strokeDasharray="30 40"
          strokeDashoffset={-frame * 6 * flow} strokeLinecap="round" opacity={0.7} />
      )}
      <g transform={`translate(${vx} ${y - r - 70})`}>
        <rect x={-14} y={0} width={28} height={70} rx={10} fill="#8a90a8" />
        <g transform={`rotate(${turn * 540})`}>
          <circle r={64} fill="none" stroke={shut > 0.5 ? '#ff5d5d' : '#e2b04a'} strokeWidth={16} />
          {[0, 60, 120].map((a) => <path key={a} d="M-60 0 L60 0" stroke={shut > 0.5 ? '#ff5d5d' : '#e2b04a'} strokeWidth={12} transform={`rotate(${a})`}
            strokeLinecap="round" />)}
          <circle r={16} fill="#6b6f86" />
        </g>
      </g>
      <rect x={vx - r * 1.2} y={y - r * 1.2} width={r * 2.4} height={r * 2.4} rx={r * 0.6} fill="#8a90a8" stroke={line('#8a90a8')} strokeWidth={6} />
    </g>
  );
};
