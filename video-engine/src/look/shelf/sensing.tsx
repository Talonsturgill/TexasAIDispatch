import React from 'react';
import {FONT} from '../../lib/type';
import {light, line, mix, shade} from '../color';
import {clamp01, useUid} from '../Kit';

/**
 * SENSING, LOOK V2 (November 13th, 2026). The machine's output laid over the world.
 *
 * The library's three rules still hold here and are kept on purpose. The overlay jitters because
 * trackers jitter, confidence is a spread and never all 0.99, and a false positive is drawn as a miss
 * so a scene can neither show one by accident nor hide one. What changes is the hand. Corner brackets
 * are rounded and round capped, every stroke sits on a deep line of its own hue so it reads on a bright
 * day plate and a dark night plate alike, labels are rounded pills in the body face, and panels are
 * soft lit glass. The overlay is still not an object in the world, so it casts no shadow on the ground.
 *
 * Everything here is SCREEN SPACE, the library's own units, so a scene that swaps a library overlay
 * for its V2 keeps every coordinate.
 */
export const SEE = '#38f2e0';     // a detection the model is confident about
export const SOFT = '#ffc93c';    // one it is not sure about
export const MISS = '#ff5a36';    // one that is wrong, and we say so
const TEXT = '#14112e';

const rnd = (seed: number, ch: number) => {
  const k = ((seed * 2654435761) ^ (ch * 40503)) >>> 0;
  return ((k >>> 8) % 10000) / 10000;
};
/** a generous width estimate for the body face, so a pill is never shorter than its words */
const textW = (s: string, fs: number) => [...s].reduce((w, ch) => w + (ch === ' ' ? 0.3 : /[A-Z0-9]/.test(ch) ? 0.7 : 0.6), 0) * fs;

export interface Detection {
  x: number; y: number; w: number; h: number; label: string; conf: number; wrong?: boolean; track?: number;
}
const hue = (d: Detection) => (d.wrong ? MISS : d.conf >= 0.8 ? SEE : SOFT);

/** A stroke that reads on any plate, the deep line of its own hue under it, then the bright stroke. */
const Duo: React.FC<{d: string; c: string; w: number; opacity?: number; dash?: string}> = ({d, c, w, opacity = 1, dash}) => (
  <g opacity={opacity}>
    <path d={d} fill="none" stroke={line(c)} strokeWidth={w * 2.1} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} />
    <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} />
  </g>
);

/** A rounded label pill, lit face in the overlay colour, deep rim, dark words in the body face. */
export const Pill: React.FC<{x: number; y: number; text: string; c: string; fs: number; anchor?: 'start' | 'middle'}> = ({
  x, y, text, c, fs, anchor = 'start',
}) => {
  const id = useUid();
  const w = textW(text, fs) + fs * 1.1, h = fs * 1.5;
  const x0 = anchor === 'middle' ? x - w / 2 : x;
  return (
    <g>
      <defs><linearGradient id={`${id}-p`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={light(c, 0.45)} />
        <stop offset="100%" stopColor={c} /></linearGradient></defs>
      <rect x={x0} y={y - h} width={w} height={h} rx={h / 2} fill={`url(#${id}-p)`} stroke={line(c)} strokeWidth={Math.max(2, fs * 0.16)} />
      <rect x={x0 + h * 0.35} y={y - h * 0.86} width={w - h * 0.7} height={h * 0.22} rx={h * 0.11} fill="#ffffff" opacity={0.35} />
      <text x={x0 + w / 2} y={y - h * 0.3} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={fs}
        fill={TEXT}>{text}</text>
    </g>
  );
};

/**
 * DETECTION BOXES. `settle` 0 is still hunting (the brackets jitter and breathe), 1 is locked. A wrong
 * detection is crossed and its pill says so.
 */
export const DetectionsV2: React.FC<{items: Detection[]; frame: number; seed?: number; settle?: number; showConf?: boolean}> = ({
  items, frame, seed = 1, settle = 1, showConf = true,
}) => {
  const s = clamp01(settle);
  return (
    <g>
      {items.map((d, i) => {
        const j = (1 - s) * 6 + 0.7;
        const dx = Math.sin(frame / 3.1 + rnd(seed, i) * 9) * j;
        const dy = Math.cos(frame / 2.7 + rnd(seed, 40 + i) * 9) * j;
        if (!(s > 0.15 || i % 2 === 0)) return null;
        const c = hue(d);
        const b = (1 - s) * Math.sin(frame / 30 * 2 * Math.PI * 1.2 + i) * Math.min(8, d.w * 0.05);
        const x0 = -b, y0 = -b, x1 = d.w + b, y1 = d.h + b;
        const m = Math.min(d.w, d.h);
        const L = Math.max(10, m * 0.3), r = Math.max(4, m * 0.09), sw = Math.max(2.6, Math.min(6, m * 0.035));
        const corner = (cx: number, cy: number, sx: number, sy: number) =>
          `M${cx} ${cy + sy * L} L${cx} ${cy + sy * r} Q${cx} ${cy} ${cx + sx * r} ${cy} L${cx + sx * L} ${cy}`;
        const brackets = corner(x0, y0, 1, 1) + corner(x1, y0, -1, 1) + corner(x0, y1, 1, -1) + corner(x1, y1, -1, -1);
        const fs = Math.max(12, Math.min(24, m * 0.16));
        const label = `${d.label}${showConf ? ` ${d.conf.toFixed(2)}` : ''}${d.wrong ? ' (miss)' : ''}`;
        return (
          <g key={i} transform={`translate(${d.x + dx} ${d.y + dy})`} opacity={0.6 + s * 0.4}>
            <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx={r * 1.4} fill={c} opacity={d.wrong ? 0.14 : 0.1} />
            <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx={r * 1.4} fill="none" stroke={c} strokeWidth={sw * 0.4} opacity={0.35} />
            <Duo d={brackets} c={c} w={sw} />
            {d.wrong && <Duo d={`M${d.w * 0.22} ${d.h * 0.22} L${d.w * 0.78} ${d.h * 0.78} M${d.w * 0.78} ${d.h * 0.22} L${d.w * 0.22} ${d.h * 0.78}`}
              c={MISS} w={sw * 0.8} opacity={0.75} />}
            <Pill x={x0} y={y0 - fs * 0.35} text={label} c={c} fs={fs} />
            {d.track !== undefined && <g transform={`translate(${x1 - fs * 0.9} ${y1 - fs * 0.9})`}>
              <circle r={fs * 0.72} fill={line(c)} opacity={0.85} />
              <text y={fs * 0.32} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={fs * 0.8} fill={c}>{d.track}</text>
            </g>}
          </g>
        );
      })}
    </g>
  );
};

/** a smooth closed curve through points (Catmull-Rom), so a ragged edge keeps its bulges but no corner */
const smooth = (pts: [number, number][]) => {
  const n = pts.length;
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + ' Z';
};

/**
 * A SEGMENTATION MASK. The edge is still ragged (a real mask follows a grid of predictions and is
 * slightly wrong in a characteristic way, and `noise` is how unsure the model is), but it is drawn as a
 * soft curve through those predictions, with a glowing fill and a rim that crawls around it.
 */
export const MaskV2: React.FC<{cx: number; cy: number; rx: number; ry: number; frame: number; seed?: number; noise?: number;
  color?: string; label?: string}> = ({cx, cy, rx, ry, frame, seed = 2, noise = 0.16, color = SEE, label}) => {
  const id = useUid();
  const N = 28;
  const pts = Array.from({length: N}, (_, i) => {
    const a = (i / N) * Math.PI * 2;
    const w = 1 + (rnd(seed, i) - 0.5) * noise * 2 + Math.sin(frame / 9 + i * 0.7) * noise * 0.18;
    return [cx + Math.cos(a) * rx * w, cy + Math.sin(a) * ry * w] as [number, number];
  });
  const d = smooth(pts);
  const sw = Math.max(2.6, Math.min(5, Math.min(rx, ry) * 0.06));
  return (
    <g>
      <defs><radialGradient id={`${id}-m`} cx="40%" cy="35%" r="70%"><stop offset="0%" stopColor={light(color, 0.4)} stopOpacity={0.42} />
        <stop offset="70%" stopColor={color} stopOpacity={0.26} /><stop offset="100%" stopColor={color} stopOpacity={0.38} /></radialGradient></defs>
      <path d={d} fill={`url(#${id}-m)`} />
      <Duo d={d} c={color} w={sw} />
      <path d={d} fill="none" stroke="#ffffff" strokeWidth={sw * 0.5} strokeLinecap="round" strokeDasharray={`${rx * 0.25} ${rx * 1.6}`}
        strokeDashoffset={-frame * 3} opacity={0.75} />
      {label && <Pill x={cx} y={cy - ry * (1 + noise) - 8} text={label} c={color} fs={Math.max(13, Math.min(22, ry * 0.3))} anchor="middle" />}
    </g>
  );
};

/**
 * A SWEEP. Behind the bar the area is classified (a soft lit wash and a field of small tiles that have
 * been read), ahead of it the area waits inside a faint rounded outline. The bar glows.
 */
export const SweepV2: React.FC<{x: number; y: number; w: number; h: number; p: number; color?: string; vertical?: boolean}> = ({
  x, y, w, h, p, color = SEE, vertical = false,
}) => {
  const t = clamp01(p);
  const id = useUid();
  const r = Math.min(28, Math.min(w, h) * 0.12);
  const lx = vertical ? 0 : w * t, ly = vertical ? h * t : 0;
  const cell = Math.max(14, Math.min(w, h) / 7);
  const cols = Math.ceil(w / cell), rows = Math.ceil(h / cell);
  const bw = Math.max(4, Math.min(9, Math.min(w, h) * 0.03));
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2={vertical ? '0' : '1'} y2={vertical ? '1' : '0'}>
          <stop offset="0" stopColor={color} stopOpacity="0.04" /><stop offset="0.8" stopColor={color} stopOpacity="0.2" />
          <stop offset="1" stopColor={color} stopOpacity="0.38" /></linearGradient>
        <clipPath id={`${id}-c`}><rect x={0} y={0} width={vertical ? w : lx} height={vertical ? ly : h} /></clipPath>
        <clipPath id={`${id}-a`}><rect x={0} y={0} width={w} height={h} rx={r} /></clipPath>
        <filter id={`${id}-b`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={bw * 1.6} /></filter>
      </defs>
      <rect x={0} y={0} width={w} height={h} rx={r} fill={color} opacity={0.05} />
      <rect x={0} y={0} width={w} height={h} rx={r} fill="none" stroke={color} strokeWidth={2.4} strokeDasharray="2 10" strokeLinecap="round"
        opacity={0.75} />
      <g clipPath={`url(#${id}-a)`}>
        <g clipPath={`url(#${id}-c)`}>
          <rect x={0} y={0} width={w} height={h} fill={`url(#${id}-g)`} />
          {Array.from({length: cols * rows}, (_, k) => {
            const cx = (k % cols + 0.5) * cell, cy = (Math.floor(k / cols) + 0.5) * cell;
            const q = rnd(7, k);
            return <rect key={k} x={cx - cell * 0.3} y={cy - cell * 0.3} width={cell * 0.6} height={cell * 0.6} rx={cell * 0.18}
              fill={q > 0.9 ? SOFT : color} opacity={q > 0.9 ? 0.55 : 0.1 + q * 0.14} />;
          })}
        </g>
        <path d={vertical ? `M0 ${ly} L${w} ${ly}` : `M${lx} 0 L${lx} ${h}`} stroke={color} strokeWidth={bw * 3} filter={`url(#${id}-b)`} opacity={0.8} />
      </g>
      <Duo d={vertical ? `M${bw} ${ly} L${w - bw} ${ly}` : `M${lx} ${bw} L${lx} ${h - bw}`} c={color} w={bw} />
      <circle cx={vertical ? w - bw : lx} cy={vertical ? ly : bw} r={bw * 1.3} fill="#ffffff" stroke={line(color)} strokeWidth={2.5} />
    </g>
  );
};

/**
 * A PLUME the camera can see and the eye cannot, a stream of soft round puffs that leave the source,
 * rise, drift with the wind and swell as they thin. Hot core, cool edge. `onDark` blends as light.
 */
export const PlumeV2: React.FC<{x: number; y: number; frame: number; seed?: number; strength?: number; rate?: string; onDark?: boolean}> = ({
  x, y, frame, seed = 3, strength = 1, rate, onDark = false,
}) => {
  const s = clamp01(strength);
  const id = useUid();
  const gas = onDark ? '#ffcf4a' : '#f39a3a';
  const N = 22, life = 150;
  const puffs = Array.from({length: N}, (_, i) => {
    const age = ((frame + (i * life) / N + rnd(seed, i) * 5) % life) / life;       // 0 at the source, 1 gone
    const q = rnd(seed, 20 + i);
    const px = Math.sin(age * 4 + q * 6 + frame / 35) * 16 * age + age * age * 120 + (q - 0.5) * 170 * age * age;
    const py = -age * 170 - 4;
    // a puff swells as it rises and thins away at the end of its life
    const r = (5 + age * 34 + q * 14) * (age > 0.72 ? Math.max(0, 1 - (age - 0.72) / 0.28) : 1) * Math.min(1, age * 8);
    return {px, py, r, age};
  }).sort((a, b) => b.age - a.age);
  return (
    <g transform={`translate(${x} ${y})`} style={{mixBlendMode: onDark ? 'screen' : 'normal'}}>
      <defs>
        <radialGradient id={`${id}-p`} gradientUnits="userSpaceOnUse" cx={-20} cy={-150} r={200}>
          <stop offset="0%" stopColor={light(gas, 0.55)} /><stop offset="55%" stopColor={gas} />
          <stop offset="100%" stopColor={shade(gas, 0.3)} /></radialGradient>
      </defs>
      {/* one cloud, every puff's outline first, then every fill, so the puffs merge with one hue-tinted rim */}
      <g opacity={0.6 * s}>
        {puffs.map((p, i) => <circle key={`o${i}`} cx={p.px} cy={p.py} r={p.r + 2.6} fill={line(gas)} />)}
        {puffs.map((p, i) => <circle key={`f${i}`} cx={p.px} cy={p.py} r={p.r} fill={`url(#${id}-p)`} />)}
        {puffs.filter((p) => p.age > 0.15 && p.age < 0.8).map((p, i) => <ellipse key={`h${i}`} cx={p.px - p.r * 0.28} cy={p.py - p.r * 0.36}
          rx={p.r * 0.42} ry={p.r * 0.24} fill="#ffffff" opacity={0.4} />)}
      </g>
      {rate && <g opacity={s > 0.05 ? 1 : 0}>
        <path d="M24 -44 Q70 -46 104 -62" stroke={line(gas)} strokeWidth={6} fill="none" strokeLinecap="round" />
        <path d="M24 -44 Q70 -46 104 -62" stroke={gas} strokeWidth={3} fill="none" strokeLinecap="round" />
        <circle cx={24} cy={-44} r={5} fill="#ffffff" stroke={line(gas)} strokeWidth={2.5} />
        <Pill x={100} y={-56} text={rate} c={mix(gas, '#ffd23c', 0.5)} fs={16} />
      </g>}
    </g>
  );
};

/**
 * A READOUT PANEL, the corner where the machine says what it thinks, as soft lit glass, a deep navy
 * face with a top sheen, an accent tab, rows in the body face and a breathing live dot. Rows are the
 * scene's own computed values. Type scales with the width the caller asks for, as in the library.
 */
export const ReadoutV2: React.FC<{x: number; y: number; rows: [string, string][]; title?: string; w?: number; frame?: number}> = ({
  x, y, rows, title, w = 200, frame = 0,
}) => {
  const id = useUid();
  const ADV = 0.66, PAD = 0.95, GAP = 1.4;
  const widest = rows.reduce((m, [k, v]) => Math.max(m, k.length + v.length), 0);
  const fits = widest > 0 ? w / (widest * ADV + 2 * PAD + GAP) : 38;
  const fs = Math.max(10, Math.min(38, w * 0.075, fits));
  const lead = fs * 1.55, pad = fs * PAD;
  const tfs = title ? Math.max(10, Math.min(fs * 0.78, (w - 2 * pad - fs * 1.4) / Math.max(1, title.length * ADV))) : 0;
  const top = title ? tfs * 1.9 + fs * 0.5 : fs * 0.5;
  const h = top + rows.length * lead + fs * 0.5;
  const r = Math.min(28, fs * 1.1);
  const live = 0.55 + 0.45 * Math.sin(frame / 30 * 2 * Math.PI * 0.8);
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0.35" y2="1"><stop offset="0%" stopColor="#2a3170" />
          <stop offset="100%" stopColor="#11143a" /></linearGradient>
        <linearGradient id={`${id}-s`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffffff" stopOpacity={0.22} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0} /></linearGradient>
        <filter id={`${id}-d`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={fs * 0.5} /></filter>
        <clipPath id={`${id}-c`}><rect x={0} y={0} width={w} height={h} rx={r} /></clipPath>
      </defs>
      <rect x={fs * 0.2} y={fs * 0.5} width={w} height={h} rx={r} fill="#0b0a24" opacity={0.35} filter={`url(#${id}-d)`} />
      <rect x={0} y={0} width={w} height={h} rx={r} fill={`url(#${id}-f)`} stroke={line('#2a3170')} strokeWidth={Math.max(2.5, fs * 0.2)} />
      <g clipPath={`url(#${id}-c)`}>
        <rect x={0} y={0} width={fs * 0.42} height={h} fill={SEE} />
        <rect x={0} y={0} width={w} height={Math.min(h * 0.45, fs * 2.2)} fill={`url(#${id}-s)`} />
      </g>
      <rect x={1.5} y={1.5} width={w - 3} height={h - 3} rx={r - 1.5} fill="none" stroke="#7d86d8" strokeWidth={1.4} opacity={0.5} />
      {title && <text x={pad + fs * 0.2} y={tfs * 1.45} fontSize={tfs} fill={SEE} fontFamily={FONT.body} fontWeight={800}
        letterSpacing={tfs * 0.08}>{title.toUpperCase()}</text>}
      {title && <path d={`M${pad + fs * 0.2} ${tfs * 1.9} L${w - pad} ${tfs * 1.9}`} stroke="#7d86d8" strokeWidth={1.4} opacity={0.4}
        strokeLinecap="round" />}
      <circle cx={w - pad} cy={title ? tfs * 1.05 : fs * 0.9} r={fs * 0.26} fill={SEE} opacity={live} />
      <circle cx={w - pad} cy={title ? tfs * 1.05 : fs * 0.9} r={fs * 0.26 + fs * 0.3 * live} fill="none" stroke={SEE} strokeWidth={1.5}
        opacity={(1 - live) * 0.8} />
      {rows.map(([k, v], i) => (
        <g key={k} transform={`translate(0 ${top + lead * (i + 0.72)})`}>
          {i % 2 === 0 && <rect x={pad * 0.6} y={-fs * 1.02} width={w - pad * 1.2} height={lead * 0.92} rx={lead * 0.3} fill="#ffffff"
            opacity={0.05} />}
          <text x={pad + fs * 0.2} y={0} fontSize={fs} fill="#a9b4e6" fontFamily={FONT.body} fontWeight={600}>{k}</text>
          <text x={w - pad} y={0} fontSize={fs} fill="#ffffff" textAnchor="end" fontFamily={FONT.body} fontWeight={800}>{v}</text>
        </g>
      ))}
    </g>
  );
};

/**
 * A CONFIDENCE SPREAD, rounded lit bars on a soft tray, a tail that shows, a dashed threshold with its
 * number in a pill, and a sheen that travels along the bars so the strip is never frozen.
 */
export const ConfidenceSpreadV2: React.FC<{x: number; y: number; values: number[]; w?: number; h?: number; threshold?: number;
  frame?: number}> = ({x, y, values, w = 160, h = 40, threshold, frame = 0}) => {
  const id = useUid();
  const n = Math.max(1, values.length), bw = w / n, gap = Math.max(1.5, bw * 0.18);
  const sheen = ((frame / 30) * 0.6) % 1.6 - 0.3;
  const colOf = (v: number) => threshold !== undefined && v < threshold ? MISS : v >= 0.8 ? SEE : SOFT;
  const fs = Math.max(11, Math.min(18, h * 0.32));
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        {[SEE, SOFT, MISS].map((c, i) => <linearGradient key={i} id={`${id}-${i}`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor={light(c, 0.4)} /><stop offset="55%" stopColor={c} /><stop offset="100%" stopColor={shade(c, 0.3)} />
        </linearGradient>)}
      </defs>
      {values.map((v, i) => {
        const q = Math.max(0.04, Math.min(1, v)), c = colOf(v);
        const bh = h * q, bx = i * bw, rr = Math.min((bw - gap) / 2, bh / 2);
        const near = Math.max(0, 1 - Math.abs(i / n - sheen) * 6);
        return <g key={i}>
          <rect x={bx} y={h - bh} width={bw - gap} height={bh} rx={rr} fill={`url(#${id}-${[SEE, SOFT, MISS].indexOf(c)})`}
            stroke={line(c)} strokeWidth={Math.max(1.5, bw * 0.08)} />
          <rect x={bx + (bw - gap) * 0.2} y={h - bh + rr * 0.4} width={(bw - gap) * 0.22} height={Math.max(0, bh - rr * 1.4)}
            rx={(bw - gap) * 0.11} fill="#ffffff" opacity={0.25 + near * 0.5} />
        </g>;
      })}
      <path d={`M0 ${h + gap * 0.8} L${w - gap} ${h + gap * 0.8}`} stroke="#5a5f99" strokeWidth={2} strokeLinecap="round" opacity={0.6} />
      {threshold !== undefined && <g>
        <Duo d={`M${-gap} ${h - h * threshold} L${w} ${h - h * threshold}`} c="#ffffff" w={1.8} dash="5 6" opacity={0.95} />
        <Pill x={w + 6} y={h - h * threshold + fs * 0.75} text={threshold.toFixed(2)} c="#ffffff" fs={fs} />
      </g>}
    </g>
  );
};

export const SENSING_V2 = ['DetectionsV2', 'MaskV2', 'SweepV2', 'PlumeV2', 'ReadoutV2', 'ConfidenceSpreadV2'] as const;
