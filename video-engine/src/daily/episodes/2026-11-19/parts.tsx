import React from 'react';
import {ContactShadow, Glow, clamp01, ease, easeOutBack, lerp} from '../../../look/Kit';
import {line, light, shade} from '../../../look/color';
import {FONT} from '../../../lib/type';

/**
 * transfer-call-1119 parts. Every drawing here is original and follows LOOK_V2: round corners, a key from the
 * upper left, shade toward violet, hue-tinted line, a contact shadow under anything that stands. The hospital,
 * the clock and every machine are illustrative, never a real site.
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
    <rect x={x + sw * 0.6} y={y + sw * 0.6} width={w * 0.92 - sw} height={h * 0.88 - sw} rx={Math.max(4, r - sw)} fill={c} />
    <rect x={x + w * 0.08} y={y + h * 0.08} width={w * 0.5} height={Math.max(4, h * 0.06)} rx={Math.max(2, h * 0.03)} fill={light(c, 0.55)} opacity={0.7} />
  </g>
);

// ------------------------------------------------------------------------------------------- THE ROOM

/**
 * THE ER WALL. A tiled night-shift wall with a window cut clean through it, so the county's own region stands
 * behind the room (the stage draws it). `win` is the window rect. The floor is a lit linoleum plane.
 */
export const ERRoom: React.FC<{frame: number; win?: {x: number; y: number; w: number; h: number}; floorY?: number; wall?: string;
  floor?: string; red?: number}> = ({frame, win = {x: 640, y: 380, w: 340, h: 420}, floorY = 1380, wall = '#3f8f8c', floor = '#cfd6e6', red = 0}) => {
  const r = 46;
  const hole = `M${win.x + r} ${win.y} H${win.x + win.w - r} Q${win.x + win.w} ${win.y} ${win.x + win.w} ${win.y + r} V${win.y + win.h - r} Q${win.x + win.w} ${win.y + win.h} ${win.x + win.w - r} ${win.y + win.h} H${win.x + r} Q${win.x} ${win.y + win.h} ${win.x} ${win.y + win.h - r} V${win.y + r} Q${win.x} ${win.y} ${win.x + r} ${win.y} Z`;
  const sweep = 0.5 + 0.5 * Math.sin(frame / 7);
  return (
    <g>
      <defs>
        <linearGradient id="er-wall" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={light(wall, 0.18)} />
          <stop offset="1" stopColor={shade(wall, 0.35)} />
        </linearGradient>
        <linearGradient id="er-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(floor, 0.2)} />
          <stop offset="1" stopColor={light(floor, 0.1)} />
        </linearGradient>
      </defs>
      <path d={`M-60 -60 H1140 V${floorY} H-60 Z ${hole}`} fill="url(#er-wall)" fillRule="evenodd" />
      {/* tile courses, worn and slightly uneven */}
      {Array.from({length: 9}, (_, i) => <path key={i} d={`M-60 ${floorY - 120 - i * 130} H1140`} stroke={shade(wall, 0.2)} strokeWidth={3}
        opacity={0.35} />)}
      <rect x={-60} y={floorY - 140} width={1200} height={22} fill={shade(wall, 0.3)} />
      <path d={hole} fill="none" stroke="#e9edf5" strokeWidth={22} />
      <path d={hole} fill="none" stroke={line('#e9edf5')} strokeWidth={6} />
      <path d={`M${win.x + win.w / 2} ${win.y} V${win.y + win.h}`} stroke="#e9edf5" strokeWidth={14} />
      <path d={`M${win.x + 20} ${win.y + 30} l70 -18`} stroke="#ffffff" strokeWidth={8} strokeLinecap="round" opacity={0.4} />
      <rect x={-60} y={floorY} width={1200} height={700} fill="url(#er-floor)" />
      <path d={`M-60 ${floorY} H1140`} stroke={line(floor)} strokeWidth={6} />
      {[0, 1, 2, 3].map((k) => <path key={k} d={`M${120 + k * 280} ${floorY} L${-200 + k * 460} 1980`} stroke={shade(floor, 0.15)} strokeWidth={3} opacity={0.4} />)}
      {red > 0 && <rect x={-60} y={-60} width={1200} height={2100} fill="#ff3b3b" opacity={red * (0.1 + 0.12 * sweep)} />}
    </g>
  );
};

// ------------------------------------------------------------------------------------------- THE HERO

export type ClockMood = 'asleep' | 'calm' | 'alarmed' | 'sweat' | 'grin' | 'hope' | 'stern';
export type Wedge = {from: number; to: number; color: string; dashed?: boolean; op?: number};

const minPt = (cx: number, cy: number, r: number, m: number) => {
  const a = (m / 60) * Math.PI * 2 - Math.PI / 2;
  return {x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r};
};
const wedgePath = (cx: number, cy: number, r: number, from: number, to: number) => {
  if (to - from >= 59.9) return `M${cx - r} ${cy} A${r} ${r} 0 1 1 ${cx + r} ${cy} A${r} ${r} 0 1 1 ${cx - r} ${cy} Z`;
  const a = minPt(cx, cy, r, from), b = minPt(cx, cy, r, to);
  return `M${cx} ${cy} L${a.x} ${a.y} A${r} ${r} 0 ${to - from > 30 ? 1 : 0} 1 ${b.x} ${b.y} Z`;
};

/**
 * THE ER WALL CLOCK, the hero. A round hospital clock, cream face and a red rim, with eyes and brows that act.
 * Each wedge paints minutes onto its face (in clock minutes, 0 at twelve). `laps` draws finished red rings around
 * the rim, one per hour. `hand` is the minute hand's position in minutes. Illustrative.
 */
export const WallClock: React.FC<{x: number; y: number; r: number; frame: number; mood?: ClockMood; wedges?: Wedge[]; hand?: number;
  laps?: number; look?: number; tag?: string; tagP?: number; shake?: number}> = ({x, y, r, frame, mood = 'calm', wedges = [], hand = 0,
  laps = 0, look = 0, tag, tagP = 0, shake = 0}) => {
  const rim = '#d8463a', face = '#fff4de';
  const blinkK = (frame % 84) < 4 ? [1, 0.3, 0.1, 0.6][frame % 84] : 1;
  const eyeOpen = mood === 'asleep' ? 0.08 : mood === 'alarmed' ? 1.25 : blinkK;
  const ex = r * 0.27, ey = -r * 0.1, er = r * 0.12;
  const brow = {asleep: 0, calm: 0, alarmed: -14, sweat: 14, grin: -6, hope: -10, stern: 18}[mood];
  const breathe = Math.sin(frame / 18) * r * 0.012;
  const jitter = shake * Math.sin(frame * 2.1) * 6;
  const h = minPt(0, 0, r * 0.72, hand);
  const hh = minPt(0, 0, r * 0.45, 4 * 5 + hand / 12);
  return (
    <g transform={`translate(${x + jitter} ${y + breathe}) rotate(${shake * Math.sin(frame * 1.7) * 3})`}>
      <ellipse cx={r * 0.08} cy={r * 1.08} rx={r * 0.8} ry={r * 0.08} fill="#1b1430" opacity={0.18} />
      <circle cx={r * 0.04} cy={r * 0.06} r={r * 1.08} fill="#1b1430" opacity={0.22} />
      <circle r={r * 1.06} fill={shade(rim, 0.25)} stroke={line(rim)} strokeWidth={r * 0.05} />
      <circle r={r * 0.98} fill={rim} />
      <path d={`M${-r * 0.8} ${-r * 0.5} A${r} ${r} 0 0 1 ${r * 0.3} ${-r * 0.92}`} stroke={light(rim, 0.6)} strokeWidth={r * 0.06} strokeLinecap="round" fill="none" opacity={0.7} />
      <circle r={r * 0.88} fill={face} stroke={line(face)} strokeWidth={r * 0.02} />
      {wedges.map((w, i) => (
        <path key={i} d={wedgePath(0, 0, r * 0.84, w.from, Math.max(w.from + 0.01, w.to))} fill={w.dashed ? 'none' : w.color}
          fillOpacity={w.op ?? 0.85} stroke={w.dashed ? w.color : line(w.color)} strokeWidth={w.dashed ? r * 0.035 : r * 0.012}
          strokeDasharray={w.dashed ? `${r * 0.07} ${r * 0.05}` : undefined} strokeLinejoin="round" />
      ))}
      {Array.from({length: 60}, (_, i) => {
        const a = minPt(0, 0, r * 0.84, i), b = minPt(0, 0, r * (i % 5 === 0 ? 0.74 : 0.8), i);
        return <path key={i} d={`M${a.x} ${a.y} L${b.x} ${b.y}`} stroke="#3a3350" strokeWidth={i % 5 === 0 ? r * 0.03 : r * 0.012} strokeLinecap="round" opacity={0.7} />;
      })}
      {Array.from({length: Math.floor(laps)}, (_, i) => (
        <circle key={i} r={r * (1.14 + i * 0.1)} fill="none" stroke="#ff4a3d" strokeWidth={r * 0.06} opacity={0.85} />
      ))}
      {laps % 1 > 0 && <path d={(() => { const rr = r * (1.14 + Math.floor(laps) * 0.1); const m = (laps % 1) * 60;
        const a = minPt(0, 0, rr, 0), b = minPt(0, 0, rr, m);
        return `M${a.x} ${a.y} A${rr} ${rr} 0 ${m > 30 ? 1 : 0} 1 ${b.x} ${b.y}`; })()} stroke="#ff4a3d" strokeWidth={r * 0.06} fill="none" strokeLinecap="round" />}
      {/* the face */}
      {[-1, 1].map((sd) => (
        <g key={sd} transform={`translate(${sd * ex} ${ey})`}>
          <ellipse rx={er} ry={er * 1.15 * eyeOpen} fill="#2a2140" />
          {eyeOpen > 0.3 && <circle cx={look * er * 0.4 - er * 0.3} cy={-er * 0.35} r={er * 0.32} fill="#ffffff" />}
          <path d={`M${-er * 1.1} ${-er * 1.6 + sd * brow * r * 0.002} L${er * 1.1} ${-er * 1.6 - sd * brow * r * 0.002}`} stroke="#2a2140"
            strokeWidth={r * 0.035} strokeLinecap="round" />
        </g>
      ))}
      {mood === 'grin' || mood === 'hope'
        ? <path d={`M${-r * 0.2} ${r * 0.2} Q0 ${r * (mood === 'grin' ? 0.42 : 0.32)} ${r * 0.2} ${r * 0.2}`} stroke="#2a2140" strokeWidth={r * 0.035} fill="none" strokeLinecap="round" />
        : mood === 'alarmed' ? <ellipse cx={0} cy={r * 0.27} rx={r * 0.08} ry={r * 0.1} fill="#2a2140" />
        : mood === 'asleep' ? <path d={`M${-r * 0.1} ${r * 0.25} H${r * 0.1}`} stroke="#2a2140" strokeWidth={r * 0.03} strokeLinecap="round" />
        : <path d={`M${-r * 0.16} ${r * 0.28} Q0 ${r * (mood === 'sweat' || mood === 'stern' ? 0.2 : 0.32)} ${r * 0.16} ${r * 0.28}`} stroke="#2a2140" strokeWidth={r * 0.035} fill="none" strokeLinecap="round" />}
      {mood === 'sweat' && [0, 1].map((k) => { const ph = ((frame / 30) + k * 0.5) % 1;
        return <path key={k} d={`M${r * (0.62 + k * 0.1)} ${-r * 0.3 + ph * r * 0.5} q${r * 0.05} ${r * 0.1} 0 ${r * 0.14} q${-r * 0.05} ${-r * 0.04} 0 ${-r * 0.14}`} fill="#8fd8ff" opacity={1 - ph} />; })}
      {/* the hands, on top of the face */}
      <path d={`M0 0 L${hh.x} ${hh.y}`} stroke="#2a2140" strokeWidth={r * 0.05} strokeLinecap="round" opacity={0.85} />
      <path d={`M0 0 L${h.x} ${h.y}`} stroke="#2a2140" strokeWidth={r * 0.035} strokeLinecap="round" />
      <circle r={r * 0.05} fill={rim} stroke="#2a2140" strokeWidth={r * 0.015} />
      {tag && tagP > 0 && (
        <g transform={`translate(${r * 0.75} ${r * 0.85}) rotate(${8 + Math.sin(frame / 10) * 4 * (1 - tagP * 0.5)}) scale(${tagP})`}>
          <path d={`M0 ${-r * 0.3} L0 ${-r * 0.05}`} stroke="#8a7656" strokeWidth={r * 0.012} />
          <rect x={-r * 0.42} y={-r * 0.05} width={r * 0.84} height={r * 0.3} rx={r * 0.06} fill="#f6e7c4" stroke="#8a7656" strokeWidth={r * 0.015} />
          <text x={0} y={r * 0.15} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={r * 0.1} fill="#5a5e70">{tag}</text>
        </g>
      )}
    </g>
  );
};

// ------------------------------------------------------------------------------------------- THE THROUGHLINE

/**
 * THE WALL PHONE, a beige corded handset on a wall base. `off` 0 to 1 lifts the receiver to `hand`; the coiled
 * cord runs between them, coiled tight when short and pulled straight when long. `ring` rattles it.
 */
export const WallPhone: React.FC<{x: number; y: number; s?: number; frame: number; off?: number; hand?: {x: number; y: number};
  ring?: number; stretch?: number}> = ({x, y, s = 1, frame, off = 0, hand, ring = 0, stretch = 0}) => {
  const body = '#efe2c4';
  const rr = ring * Math.sin(frame * 2.4) * 5;
  const base = {x: x, y: y + 130 * s};
  const rest = {x: x, y: y};
  const tip = hand && off > 0 ? {x: lerp(rest.x, hand.x, off), y: lerp(rest.y, hand.y, off)} : rest;
  const dx = tip.x - base.x, dy = tip.y - base.y;
  const len = Math.hypot(dx, dy) || 1;
  const coils = Math.max(6, Math.round(lerp(26, 8, clamp01(stretch))));
  const amp = lerp(16, 3, clamp01(stretch)) * s;
  const nx = -dy / len, ny = dx / len;
  let d = `M${base.x} ${base.y + 40 * s}`;
  const n = coils * 6;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const sag = Math.sin(t * Math.PI) * (1 - clamp01(stretch)) * 120 * s * (off > 0 ? 1 : 0.4);
    const px = base.x + dx * t + nx * Math.sin(t * coils * Math.PI * 2) * amp;
    const py = base.y + 40 * s + (tip.y - base.y - 40 * s) * t + ny * Math.sin(t * coils * Math.PI * 2) * amp + sag;
    d += ` L${px} ${py}`;
  }
  return (
    <g transform={`rotate(${rr * 0.3} ${x} ${y})`}>
      <LitBox x={x - 70 * s} y={y - 40 * s} w={140 * s} h={240 * s} r={34 * s} c={body} sw={6 * s} />
      {[0, 1, 2].map((r2) => [0, 1, 2].map((c2) => <circle key={`${r2}-${c2}`} cx={x - 34 * s + c2 * 34 * s} cy={y + 110 * s + r2 * 26 * s} r={8 * s}
        fill={shade(body, 0.3)} />))}
      <path d={d} stroke="#c9b48a" strokeWidth={7 * s} fill="none" strokeLinejoin="round" />
      <path d={d} stroke={line('#c9b48a')} strokeWidth={2 * s} fill="none" opacity={0.5} />
      <g transform={`translate(${tip.x + rr} ${tip.y}) rotate(${off > 0 ? -30 * off : 0})`}>
        <path d={`M${-10 * s} ${-120 * s} Q${30 * s} ${-120 * s} ${30 * s} ${-80 * s} L${30 * s} ${80 * s} Q${30 * s} ${120 * s} ${-10 * s} ${120 * s}`}
          stroke={line(body)} strokeWidth={50 * s} fill="none" strokeLinecap="round" />
        <path d={`M${-10 * s} ${-120 * s} Q${30 * s} ${-120 * s} ${30 * s} ${-80 * s} L${30 * s} ${80 * s} Q${30 * s} ${120 * s} ${-10 * s} ${120 * s}`}
          stroke={body} strokeWidth={38 * s} fill="none" strokeLinecap="round" />
        <rect x={-62 * s} y={-150 * s} width={70 * s} height={74 * s} rx={30 * s} fill={body} stroke={line(body)} strokeWidth={6 * s} />
        <rect x={-62 * s} y={76 * s} width={70 * s} height={74 * s} rx={30 * s} fill={body} stroke={line(body)} strokeWidth={6 * s} />
        {[-113, 113].map((yy) => <ellipse key={yy} cx={-50 * s} cy={yy * s} rx={10 * s} ry={22 * s} fill={shade(body, 0.35)} />)}
        <path d={`M${24 * s} ${-70 * s} V${60 * s}`} stroke="#ffffff" strokeWidth={8 * s} strokeLinecap="round" opacity={0.5} />
      </g>
      {ring > 0 && [0, 1, 2].map((k) => { const ph = ((frame / 12) + k / 3) % 1;
        return <path key={k} d={`M${x + 90 * s + ph * 60 * s} ${y - 70 * s} q${30 * s} ${60 * s} 0 ${120 * s}`} stroke="#ffd24a" strokeWidth={9 * s}
          fill="none" strokeLinecap="round" opacity={(1 - ph) * ring} />; })}
    </g>
  );
};

/** the long cord as a free path, for the shot where it leaves the building: a coiled line along points */
export const CordPath: React.FC<{pts: {x: number; y: number}[]; p: number; frame: number; w?: number}> = ({pts, p, frame, w = 10}) => {
  if (pts.length < 2) return null;
  const segs: {x: number; y: number}[] = [];
  const N = 220;
  const total = pts.length - 1;
  for (let i = 0; i <= N * clamp01(p); i++) {
    const t = (i / N) * total;
    const k = Math.min(total - 1, Math.floor(t)), f = t - k;
    const a = pts[k], b = pts[k + 1];
    const x = lerp(a.x, b.x, f), y = lerp(a.y, b.y, f);
    const wig = Math.sin(i * 1.3 + frame / 6) * w * 0.6;
    segs.push({x: x + wig * 0.3, y: y + wig});
  }
  if (segs.length < 2) return null;
  const d = segs.map((q, i) => `${i ? 'L' : 'M'}${q.x} ${q.y}`).join(' ');
  return <g><path d={d} stroke="#c9b48a" strokeWidth={w} fill="none" strokeLinejoin="round" /><path d={d} stroke={line('#c9b48a')} strokeWidth={w * 0.3} fill="none" opacity={0.5} /></g>;
};

// ------------------------------------------------------------------------------------------- PROPS

/** A GURNEY with a patient under a blanket, on four castor wheels. `dim` greys it and throws a long shadow. */
export const Gurney: React.FC<{x: number; y: number; s?: number; frame: number; dim?: number; roll?: number; blanket?: string}> = ({
  x, y, s = 1, frame, dim = 0, roll = 0, blanket = '#5b8fe0'}) => {
  const steel = '#c7cede';
  const bl = dim > 0 ? lerp(0, 1, dim) : 0;
  const bk = bl > 0 ? shade(blanket, 0.25 + bl * 0.35) : blanket;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {dim > 0 && <ellipse cx={260 * dim} cy={8} rx={170 + 260 * dim} ry={22} fill="#1b1430" opacity={0.28 * dim} />}
      <ContactShadow x={0} y={6} w={300} opacity={0.35} />
      {[-120, 120].map((wx) => <g key={wx}>
        <path d={`M${wx} -20 L${wx * 0.6} -150`} stroke={steel} strokeWidth={12} strokeLinecap="round" />
        <circle cx={wx} cy={-14} r={16} fill="#3a3f55" />
        <circle cx={wx + Math.cos(roll) * 6} cy={-14 + Math.sin(roll) * 6} r={4} fill="#9aa3bb" />
      </g>)}
      <rect x={-170} y={-170} width={340} height={30} rx={15} fill={steel} stroke={line(steel)} strokeWidth={6} />
      <path d="M-160 -170 Q-150 -240 -60 -236 Q60 -250 150 -206 L160 -170 Z" fill={bk} stroke={line(blanket)} strokeWidth={6} />
      <path d="M-120 -224 Q-20 -240 80 -226" stroke={light(blanket, 0.5)} strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.6 * (1 - bl)} />
      <ellipse cx={-150} cy={-212} rx={44} ry={30} fill="#f4f6fb" stroke={line('#f4f6fb')} strokeWidth={5} />
      <circle cx={-140} cy={-238} r={30} fill={dim > 0.5 ? '#9a8a80' : '#c98a5a'} stroke={line('#c98a5a')} strokeWidth={5} />
      <path d="M-160 -250 Q-140 -272 -116 -254" stroke="#2b1f18" strokeWidth={14} strokeLinecap="round" fill="none" />
      <path d="M150 -170 L190 -310" stroke={steel} strokeWidth={8} strokeLinecap="round" />
      <rect x={172} y={-350} width={46} height={60} rx={18} fill="#d8f0ff" stroke="#7aa6c8" strokeWidth={4} opacity={0.9} />
      {dim > 0 && <rect x={-200} y={-300} width={440} height={320} fill="#2a2a48" opacity={0.25 * dim} />}
      <circle cx={-150} cy={-180} r={0} fill="none" opacity={frame * 0} />
    </g>
  );
};

/**
 * THE AMBULANCE, a Type I box on a cab chassis, white with a red stripe, the light bar flashing. `doors` 0 to 1
 * swings the back doors open; `facing` -1 drives left. Illustrative, no agency mark.
 */
export const Ambulance: React.FC<{x: number; y: number; s?: number; frame: number; doors?: number; facing?: 1 | -1; lights?: boolean;
  roll?: number}> = ({x, y, s = 1, frame, doors = 0, facing = 1, lights = true, roll = 0}) => {
  const white = '#f3f4f8', red = '#e23b3b';
  const flash = lights ? (Math.floor(frame / 5) % 2 === 0) : false;
  const bounce = Math.sin(roll * 8) * 2;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * facing} ${s})`}>
      <ContactShadow x={0} y={8} w={620} opacity={0.4} />
      <g transform={`translate(0 ${bounce})`}>
        {/* box */}
        <rect x={-300} y={-330} width={400} height={270} rx={34} fill={shade(white, 0.18)} stroke={line(white)} strokeWidth={8} />
        <rect x={-292} y={-322} width={370} height={240} rx={28} fill={white} />
        <rect x={-300} y={-190} width={400} height={34} fill={red} />
        <rect x={-292} y={-150} width={384} height={10} fill={shade(red, 0.3)} opacity={0.5} />
        <g transform="translate(-120 -260)"><rect x={-14} y={-42} width={28} height={84} rx={6} fill={red} /><rect x={-42} y={-14} width={84} height={28} rx={6} fill={red} /></g>
        <path d="M-270 -300 H40" stroke="#ffffff" strokeWidth={10} strokeLinecap="round" opacity={0.6} />
        {/* cab */}
        <path d="M100 -250 H190 Q232 -250 250 -200 L282 -120 Q290 -96 290 -80 L290 -60 H100 Z" fill={white} stroke={line(white)} strokeWidth={8} strokeLinejoin="round" />
        <path d="M120 -232 H186 Q214 -232 228 -196 L248 -150 H120 Z" fill="#7fb4e8" stroke={line('#7fb4e8')} strokeWidth={5} />
        <path d="M134 -222 L170 -222" stroke="#ffffff" strokeWidth={8} strokeLinecap="round" opacity={0.6} />
        <rect x={100} y={-150} width={190} height={30} fill={red} />
        <circle cx={272} cy={-92} r={14} fill="#fff1b8" />
        {/* light bar */}
        <rect x={-300} y={-352} width={130} height={26} rx={12} fill={flash ? '#ff3b3b' : '#7a2a2a'} />
        <rect x={-30} y={-352} width={130} height={26} rx={12} fill={!flash ? '#ff3b3b' : '#7a2a2a'} />
        {lights && <Glow x={flash ? -235 : 35} y={-340} r={120} color="#ff4a4a" opacity={0.6} />}
        {/* back doors */}
        {[0, 1].map((k) => {
          const sw = doors * (k ? -70 : 70);
          return <g key={k} transform={`translate(-300 ${-200}) skewY(${k ? sw * 0.15 : -sw * 0.15})`}>
            <rect x={k ? -doors * 120 : -6} y={-120} width={Math.max(10, 12 + (1 - doors) * 0)} height={250} rx={6} fill={white} stroke={line(white)} strokeWidth={6} opacity={doors > 0.05 ? 1 : 0} />
          </g>;
        })}
        {doors > 0.05 && <rect x={-298} y={-318} width={18} height={250} fill="#2a2a48" opacity={0.6 * doors} />}
        {/* wheels */}
        {[-200, 200].map((wx) => <g key={wx} transform={`translate(${wx} -40)`}>
          <circle r={50} fill="#2a2d3d" stroke={line('#2a2d3d')} strokeWidth={6} />
          <circle r={22} fill="#b9bfd0" />
          <path d={`M0 0 L${Math.cos(roll * 10) * 18} ${Math.sin(roll * 10) * 18}`} stroke="#6c7287" strokeWidth={6} strokeLinecap="round" />
        </g>)}
      </g>
    </g>
  );
};

/** a small hospital tower with a face, for the shopping. `nod` and `shake` move it; `yes` lights a green roof light */
export const MiniTower: React.FC<{x: number; y: number; s?: number; frame: number; shake?: number; nod?: number; yes?: number;
  c?: string; dim?: number}> = ({x, y, s = 1, frame, shake = 0, nod = 0, yes = 0, c = '#e9e1d2', dim = 0}) => {
  const sh = shake > 0 ? Math.sin(shake * Math.PI * 4) * 10 * (1 - shake) : 0;
  const nd = nod > 0 ? Math.sin(nod * Math.PI * 3) * 8 * (1 - nod) : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${sh})`} opacity={1 - dim * 0.5}>
      <ContactShadow x={0} y={4} w={150} opacity={0.3} />
      <g transform={`translate(0 ${nd})`}>
        <rect x={-100} y={-150} width={200} height={150} rx={18} fill={shade(c, 0.28)} stroke={line(c)} strokeWidth={6} />
        {[0, 1, 2, 3].map((k) => <rect key={k} x={-88 + k * 46} y={-120} width={30} height={26} rx={7} fill="#8cc4f0" opacity={0.85} />)}
        <rect x={-60} y={-260} width={120} height={260} rx={22} fill={shade(c, 0.2)} stroke={line(c)} strokeWidth={6} />
        <rect x={-54} y={-254} width={100} height={240} rx={18} fill={c} />
        <path d="M-70 -262 H70" stroke={shade(c, 0.4)} strokeWidth={10} strokeLinecap="round" />
        {[0, 1, 2].map((r2) => [0, 1].map((c2) => <rect key={`${r2}${c2}`} x={-38 + c2 * 44} y={-150 + r2 * 44} width={30} height={28} rx={8}
          fill="#8cc4f0" opacity={0.9} />))}
        <g transform="translate(0 -205)">
          <rect x={-22} y={-22} width={44} height={44} rx={10} fill="#e23b3b" />
          <rect x={-6} y={-16} width={12} height={32} rx={3} fill="#ffffff" /><rect x={-16} y={-6} width={32} height={12} rx={3} fill="#ffffff" />
        </g>
        {/* face on the top band */}
        {[-1, 1].map((sd) => <circle key={sd} cx={sd * 24} cy={-236} r={6} fill="#2a2140" />)}
        <path d={yes > 0 ? 'M-14 -224 Q0 -214 14 -224' : 'M-12 -220 Q0 -226 12 -220'} stroke="#2a2140" strokeWidth={4} fill="none" strokeLinecap="round" />
        {yes > 0 && <g><Glow x={0} y={-282} r={60} color="#5dff8a" opacity={0.7 * yes} /><circle cx={0} cy={-276} r={14 * yes} fill="#5dff8a" stroke="#1d7a3a" strokeWidth={3} /></g>}
        {shake > 0 && shake < 1 && <g opacity={1 - shake}><path d="M70 -240 l26 26 M96 -240 l-26 26" stroke="#ff4a3d" strokeWidth={8} strokeLinecap="round" /></g>}
      </g>
    </g>
  );
};

/** THE WHITEBOARD in the trauma bay: words appear as written, `p` 0 to 1 per line */
export const Whiteboard: React.FC<{x: number; y: number; w: number; h: number; lines: {t: string; c: string; size: number; p: number}[]}> = ({
  x, y, w, h, lines}) => (
  <g>
    <rect x={x + 8} y={y + 12} width={w} height={h} rx={26} fill="#1b1430" opacity={0.2} />
    <rect x={x} y={y} width={w} height={h} rx={26} fill="#c9ced8" stroke={line('#c9ced8')} strokeWidth={7} />
    <rect x={x + 16} y={y + 16} width={w - 32} height={h - 32} rx={16} fill="#fbfcff" />
    <path d={`M${x + 40} ${y + 40} l${w * 0.4} 0`} stroke="#ffffff" strokeWidth={10} opacity={0.8} />
    {lines.map((l, i) => {
      const yy = y + 90 + i * (h - 120) / Math.max(1, lines.length);
      return (
        <g key={i}>
          <clipPath id={`wb-${i}`}><rect x={x + 30} y={yy - l.size} width={(w - 60) * clamp01(l.p)} height={l.size * 1.4} /></clipPath>
          <text x={x + 44} y={yy} fontFamily={FONT.body} fontWeight={800} fontSize={l.size} fill={l.c} clipPath={`url(#wb-${i})`}>{l.t}</text>
        </g>
      );
    })}
    <rect x={x + w * 0.6} y={y + h - 18} width={120} height={22} rx={10} fill="#5a6290" />
  </g>
);

/** a box of a hospital, for the shelf: `big` for Level I, small for Level IV. `lit` glows it */
export const HospBox: React.FC<{x: number; y: number; s?: number; big?: boolean; lit?: number}> = ({x, y, s = 1, big = false, lit = 0}) => {
  const c = big ? '#f7c948' : '#9fd3e8';
  const w = big ? 70 : 34, h = big ? 92 : 40;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {lit > 0 && <Glow x={0} y={-h / 2} r={w * 1.3} color="#ffe27a" opacity={0.55 * lit} />}
      <rect x={-w / 2} y={-h} width={w} height={h} rx={big ? 14 : 8} fill={c} stroke={line(c)} strokeWidth={big ? 5 : 3} />
      <rect x={-w * 0.12} y={-h * 0.82} width={w * 0.24} height={h * 0.36} rx={2} fill="#e23b3b" />
      <rect x={-w * 0.3} y={-h * 0.7} width={w * 0.6} height={h * 0.12} rx={2} fill="#e23b3b" />
      <rect x={-w / 2 + 4} y={-h + 4} width={w * 0.4} height={4} rx={2} fill="#ffffff" opacity={0.7} />
    </g>
  );
};

/** THE ULTRASOUND WAND, a probe on its curly cable, with eyes in its face for the drawer gag */
export const Wand: React.FC<{x: number; y: number; s?: number; rot?: number; look?: number; frame: number; face?: boolean}> = ({
  x, y, s = 1, rot = 0, look = 0, frame, face = true}) => {
  const c = '#e9edf5';
  const blink = (frame % 70) < 3;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M0 120 C 40 200, -40 240, 30 320" stroke="#7d86a8" strokeWidth={14} fill="none" strokeLinecap="round" />
      <rect x={-34} y={-30} width={68} height={160} rx={30} fill={c} stroke={line(c)} strokeWidth={6} />
      <path d="M-50 -30 Q0 -80 50 -30 Z" fill="#5b6c9a" stroke={line('#5b6c9a')} strokeWidth={6} strokeLinejoin="round" />
      <path d="M-18 -14 V100" stroke="#ffffff" strokeWidth={8} strokeLinecap="round" opacity={0.5} />
      {face && <g>
        {[-1, 1].map((sd) => <ellipse key={sd} cx={sd * 13 + look * 6} cy={30} rx={7} ry={blink ? 1 : 9} fill="#2a2140" />)}
        <path d={`M-20 12 L-4 ${16 + look * 3} M20 12 L4 ${16 - look * 3}`} stroke="#2a2140" strokeWidth={4} strokeLinecap="round" />
        <path d="M-10 58 Q0 54 10 58" stroke="#2a2140" strokeWidth={4} fill="none" strokeLinecap="round" />
      </g>}
    </g>
  );
};

/** THE BEDSIDE TABLET with its small amber flag. `flag` 0 to 1 springs the flag up. No readout, only the flag */
export const FlagTablet: React.FC<{x: number; y: number; s?: number; frame: number; flag?: number; rot?: number; face?: number}> = ({
  x, y, s = 1, frame, flag = 0, rot = 0, face = 0}) => {
  const pulse = 0.5 + 0.5 * Math.sin(frame / 4);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <rect x={-170} y={-120} width={340} height={240} rx={40} fill="#2c3150" stroke={line('#2c3150')} strokeWidth={8} />
      <rect x={-146} y={-98} width={292} height={196} rx={26} fill="#1e2a4a" />
      {[0, 1, 2].map((k) => <rect key={k} x={-120} y={-66 + k * 42} width={130 - k * 30} height={18} rx={9} fill="#3d5a8a" opacity={0.8} />)}
      <path d="M-120 60 Q-80 30 -40 60 T40 60 T120 50" stroke="#38f2e0" strokeWidth={6} fill="none" opacity={0.6} />
      {face > 0 && [-1, 1].map((sd) => <circle key={sd} cx={sd * 40} cy={-20} r={10 * face} fill="#38f2e0" />)}
      {flag > 0 && (
        <g transform={`translate(90 10) scale(${flag})`}>
          <Glow x={0} y={-60} r={110} color="#ffb020" opacity={0.5 + 0.3 * pulse} />
          <path d="M0 40 V-120" stroke="#e9edf5" strokeWidth={10} strokeLinecap="round" />
          <path d={`M4 -120 Q60 ${-110 + Math.sin(frame / 5) * 8} 90 -96 Q60 ${-80 + Math.sin(frame / 5 + 1) * 8} 4 -72 Z`} fill="#ffb020"
            stroke={line('#ffb020')} strokeWidth={5} strokeLinejoin="round" />
        </g>
      )}
      <path d="M-150 -100 L-60 -100" stroke="#ffffff" strokeWidth={8} strokeLinecap="round" opacity={0.25} />
    </g>
  );
};

/** a map pin dropping onto a window skyline, with a bounce */
export const MapPinPop: React.FC<{x: number; y: number; p: number}> = ({x, y, p}) => (p <= 0 ? null : (
  <g transform={`translate(${x} ${y - (1 - p) * 200}) scale(${p})`}>
    <ellipse cx={0} cy={6} rx={30} ry={8} fill="#1b1430" opacity={0.3} />
    <path d="M0 0 C-50 -70 -50 -130 0 -130 C50 -130 50 -70 0 0 Z" fill="#e8743a" stroke={line('#e8743a')} strokeWidth={6} />
    <circle cx={0} cy={-88} r={18} fill="#fff4de" />
  </g>
));
