import React from 'react';
import {FONT} from '../../../lib/type';

/**
 * brush-hides-1112 parts: the hero drone, the AI detection box (the throughline object), a tablet,
 * and the small animals the library does not carry (a calf, a goat, a cattle dog, the screwworm fly,
 * a pickup). Thick ink outline, a shade and a highlight on every part, like the shelf drawings.
 * Every state is a prop. No random input, no wall clock.
 */
export const INK = '#1d1a17';
export const RED = '#e0563f';
export const AMBER = '#e3a22f';
export const TEAL = '#3fd6c8';
export const clamp = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const smooth = (p: number) => { const q = clamp(p); return q * q * (3 - 2 * q); };
export const rnd = (seed: number, ch: number) => {
  const k = ((seed * 2654435761) ^ (ch * 40503)) >>> 0;
  return ((k >>> 8) % 10000) / 10000;
};

/** THE HERO. A quadcopter with a gimbal camera under the nose. `tilt` leans it, `lens` colours its eye. */
export const Drone: React.FC<{x: number; y: number; scale?: number; frame: number; tilt?: number;
  lens?: string; landed?: boolean}> = ({x, y, scale = 1, frame, tilt = 0, lens = TEAL, landed = false}) => {
  const spin = landed ? 0 : 1;
  const blade = (cx: number, cy: number, k: number) => (
    <g transform={`translate(${cx} ${cy})`}>
      <rect x={-5} y={-2} width={10} height={26} fill="#59606a" stroke={INK} strokeWidth={4} />
      <ellipse cx={0} cy={-6} rx={spin ? 92 : 70} ry={spin ? 9 : 6} fill="#f1efe6" opacity={spin ? 0.5 : 0.95}
        stroke={INK} strokeWidth={spin ? 2 : 5} transform={spin ? `scale(${0.85 + 0.15 * Math.sin(frame * 1.7 + k)} 1)` : ''} />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt}) scale(${scale})`}>
      <ellipse cx={0} cy={landed ? 62 : 240} rx={landed ? 120 : 90} ry={landed ? 14 : 12} fill="rgba(20,16,12,.28)" />
      {/* arms */}
      <path d="M-40 -6 L-150 -34 M40 -6 L150 -34" stroke={INK} strokeWidth={22} strokeLinecap="round" />
      <path d="M-40 -6 L-150 -34 M40 -6 L150 -34" stroke="#8b929c" strokeWidth={11} strokeLinecap="round" />
      {blade(-150, -52, 0)}{blade(150, -52, 2)}
      {/* legs */}
      <path d="M-62 34 L-80 60 M62 34 L80 60" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      {/* body */}
      <rect x={-84} y={-34} width={168} height={74} rx={26} fill="#e9e3d6" stroke={INK} strokeWidth={7} />
      <rect x={-84} y={8} width={168} height={32} rx={16} fill="#c9c0ae" />
      <rect x={-62} y={-24} width={90} height={9} rx={4} fill="#fbf8f0" opacity={0.9} />
      <circle cx={52} cy={-8} r={7} fill={frame % 40 < 20 ? RED : '#7a2d22'} stroke={INK} strokeWidth={3} />
      {/* gimbal and eye */}
      <rect x={-12} y={36} width={24} height={16} fill="#3d4650" stroke={INK} strokeWidth={4} />
      <circle cx={0} cy={68} r={32} fill="#27323d" stroke={INK} strokeWidth={7} />
      <circle cx={0} cy={68} r={17} fill={lens} stroke={INK} strokeWidth={4} />
      <circle cx={-8} cy={60} r={6} fill="#fff" opacity={0.85} />
    </g>
  );
};

/** THE THROUGHLINE OBJECT: the AI detection box. `mode` is its state. Corner ticks, never a closed frame. */
export const DBox: React.FC<{x: number; y: number; w: number; h: number; label?: string; mode?: 'scan' | 'lock' | 'wound' | 'empty' | 'amber';
  frame: number; q?: boolean; size?: number}> = ({x, y, w, h, label, mode = 'lock', frame, q = false, size = 30}) => {
  const c = mode === 'wound' ? RED : mode === 'amber' ? AMBER : mode === 'empty' ? '#9aa2a8' : TEAL;
  const j = mode === 'scan' || mode === 'empty' ? Math.sin(frame / 2.3) * 5 : Math.sin(frame / 4) * 1.2;
  const cl = Math.min(34, w * 0.26);
  const dash = mode === 'empty' ? '14 12' : undefined;
  return (
    <g transform={`translate(${x + j} ${y})`}>
      <rect width={w} height={h} fill={c} opacity={0.12} />
      <path d={`M0,${cl} L0,0 L${cl},0 M${w - cl},0 L${w},0 L${w},${cl} M${w},${h - cl} L${w},${h} L${w - cl},${h} M${cl},${h} L0,${h} L0,${h - cl}`}
        fill="none" stroke={c} strokeWidth={8} strokeLinecap="square" strokeDasharray={dash} />
      {mode === 'empty' && <path d={`M0,0 L${w},${h} M${w},0 L0,${h}`} stroke={c} strokeWidth={3} opacity={0.5} />}
      {label && (
        <g transform={`translate(0 ${-14})`}>
          <rect x={-2} y={-size - 6} width={label.length * size * 0.66 + 22} height={size + 12} fill={c} />
          <text x={9} y={-8} fontSize={size} fontWeight={800} fontFamily={FONT.mono} fill="#0d1220">{label}</text>
        </g>
      )}
      {q && <text x={w / 2} y={h / 2 + 40} fontSize={120} fontWeight={900} textAnchor="middle" fontFamily={FONT.body}
        fill={c} stroke={INK} strokeWidth={5} paintOrder="stroke" opacity={0.6 + 0.4 * Math.abs(Math.sin(frame / 9))}>?</text>}
    </g>
  );
};

/** The tablet the hand holds. Its screen is a clipped window, so the picture inside never leaks. */
export const Tablet: React.FC<{x: number; y: number; w: number; h: number; id: string; rot?: number;
  screen: React.ReactNode; bg?: string}> = ({x, y, w, h, id, rot = 0, screen, bg = '#7a8a54'}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot} ${w / 2} ${h / 2})`}>
    <rect x={8} y={14} width={w} height={h} rx={34} fill="rgba(20,16,12,.35)" />
    <rect width={w} height={h} rx={34} fill="#2a2f36" stroke={INK} strokeWidth={9} />
    <rect x={7} y={7} width={w - 14} height={26} rx={12} fill="#444b55" opacity={0.65} />
    <clipPath id={`scr-${id}`}><rect x={26} y={26} width={w - 52} height={h - 52} rx={14} /></clipPath>
    <g clipPath={`url(#scr-${id})`}>
      <rect x={26} y={26} width={w - 52} height={h - 52} fill={bg} />
      {screen}
      {Array.from({length: Math.floor((h - 52) / 14)}, (_, i) => (
        <rect key={i} x={26} y={26 + i * 14} width={w - 52} height={3} fill="#000" opacity={0.07} />
      ))}
      <rect x={26} y={26} width={w - 52} height={h - 52} fill="url(#glare)" opacity={0.0} />
    </g>
    <rect x={26} y={26} width={w - 52} height={h - 52} rx={14} fill="none" stroke={INK} strokeWidth={4} />
    <path d={`M${w * 0.15} 30 L${w * 0.42} 30 L${w * 0.28} ${h - 30} L${w * 0.04} ${h - 30}Z`} fill="#fff" opacity={0.06} />
  </g>
);

/** A calf, side on, drawn from the ground up at `s` of a 300 unit body. Nothing symmetric. */
export const Calf: React.FC<{x: number; y: number; s?: number; facing?: 1 | -1; frame?: number; coat?: string;
  wound?: boolean; tag?: boolean; head?: number}> = ({x, y, s = 1, facing = 1, frame = 0, coat = '#9b6a3f', wound = false, tag = false, head = 0}) => {
  const b = Math.sin(frame / 24) * 2;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * facing} ${s})`}>
      <ellipse cx={0} cy={4} rx={150} ry={14} fill="rgba(20,16,12,.3)" />
      {[[-96, 0.9], [-62, 1.05], [64, 1], [98, 0.88]].map(([lx, k], i) => (
        <g key={i}>
          <path d={`M${lx} -90 L${lx - 4} -${12 * (k as number)} L${(lx as number) + 18} -${12 * (k as number)} L${(lx as number) + 16} -90Z`} fill={i % 2 ? '#7d522d' : coat} stroke={INK} strokeWidth={6} />
          <rect x={(lx as number) - 8} y={-14} width={30} height={14} rx={4} fill="#2b2420" stroke={INK} strokeWidth={4} />
        </g>
      ))}
      <path d={`M-136 -130 Q-150 -190 -96 -206 Q0 ${-224 + b} 94 -204 Q146 -192 146 -140 Q148 -92 98 -88 Q0 -76 -92 -86 Q-132 -92 -136 -130Z`}
        fill={coat} stroke={INK} strokeWidth={8} />
      <path d="M-120 -120 Q-70 -80 20 -92 Q90 -96 138 -132 Q120 -86 60 -78 Q-40 -70 -112 -92Z" fill="#7d522d" opacity={0.55} />
      <path d="M-80 -200 Q0 -218 90 -198" stroke="#c99560" strokeWidth={9} fill="none" strokeLinecap="round" opacity={0.7} />
      {wound && <g><ellipse cx={30} cy={-150} rx={32} ry={22} fill="#b3352c" stroke={INK} strokeWidth={5} />
        <ellipse cx={26} cy={-152} rx={16} ry={10} fill="#7d1f1a" /></g>}
      {/* tail */}
      <path d={`M-136 -150 Q-168 -120 ${-160 + Math.sin(frame / 15) * 8} -64`} stroke={INK} strokeWidth={8} fill="none" strokeLinecap="round" />
      {/* neck and head */}
      <g transform={`translate(${130} ${-150 + head * 40}) rotate(${head * 28})`}>
        <path d="M-26 -52 Q42 -62 62 -10 Q70 44 34 66 Q-20 64 -34 -4Z" fill={coat} stroke={INK} strokeWidth={8} />
        <path d="M6 -56 L-6 -88 L26 -64Z" fill="#7d522d" stroke={INK} strokeWidth={5} />
        <circle cx={34} cy={2} r={8} fill={INK} /><circle cx={31} cy={-1} r={3} fill="#fff" />
        <ellipse cx={46} cy={50} rx={18} ry={13} fill="#e7c9a8" stroke={INK} strokeWidth={5} />
        {tag && <rect x={-10} y={-30} width={22} height={28} rx={5} fill={RED} stroke={INK} strokeWidth={4} />}
      </g>
    </g>
  );
};

/** A goat: small, horned, with a beard. */
export const Goat: React.FC<{x: number; y: number; s?: number; facing?: 1 | -1; tag?: boolean}> = ({x, y, s = 1, facing = 1, tag = false}) => (
  <g transform={`translate(${x} ${y}) scale(${s * facing} ${s})`}>
    <ellipse cx={0} cy={4} rx={96} ry={10} fill="rgba(20,16,12,.3)" />
    {[-52, -30, 30, 54].map((lx, i) => <rect key={i} x={lx} y={-70} width={13} height={68} rx={4} fill={i % 2 ? '#d6cfc0' : '#eee8da'} stroke={INK} strokeWidth={5} />)}
    <path d="M-80 -92 Q-86 -140 -30 -142 Q50 -150 78 -126 Q90 -92 56 -70 Q-10 -56 -70 -66Z" fill="#eee8da" stroke={INK} strokeWidth={7} />
    <path d="M-70 -94 Q-20 -64 60 -80" stroke="#cfc7b4" strokeWidth={9} fill="none" />
    <path d="M74 -132 Q100 -170 104 -200 L84 -134Z" fill="#eee8da" stroke={INK} strokeWidth={6} />
    <path d="M70 -124 Q104 -128 112 -96 Q108 -70 82 -68 Q64 -90 70 -124Z" fill="#eee8da" stroke={INK} strokeWidth={7} />
    <path d="M62 -150 L52 -190 L78 -154Z" fill="#c4b9a4" stroke={INK} strokeWidth={5} />
    <path d="M100 -76 Q104 -50 94 -34" stroke={INK} strokeWidth={6} fill="none" />
    <circle cx={92} cy={-112} r={6} fill={INK} />
    {tag && <rect x={50} y={-118} width={14} height={20} rx={4} fill={RED} stroke={INK} strokeWidth={4} />}
  </g>
);

/** A cattle dog: lean, mottled, alert. */
export const Dog: React.FC<{x: number; y: number; s?: number; facing?: 1 | -1; frame?: number; tag?: boolean; jump?: number}> = ({x, y, s = 1, facing = 1, frame = 0, tag = false, jump = 0}) => (
  <g transform={`translate(${x} ${y - Math.sin(jump * Math.PI) * 120}) scale(${s * facing} ${s})`}>
    <ellipse cx={0} cy={4 + Math.sin(jump * Math.PI) * 120} rx={84} ry={9} fill="rgba(20,16,12,.3)" />
    {[-52, -34, 36, 54].map((lx, i) => <rect key={i} x={lx} y={-56} width={12} height={54} rx={4} fill={i % 2 ? '#5f6a73' : '#7b8791'} stroke={INK} strokeWidth={5} />)}
    <path d={`M-78 -80 Q-84 -108 -40 -108 Q30 -112 62 -98 Q70 -70 40 -58 Q-30 -48 -74 -60Z`} fill="#7b8791" stroke={INK} strokeWidth={7} />
    <circle cx={-14} cy={-86} r={8} fill="#c7c0b1" /><circle cx={24} cy={-80} r={6} fill="#4d565e" />
    <path d={`M-78 -88 Q-110 ${-110 + Math.sin(frame / 5) * 6} -108 -138`} stroke={INK} strokeWidth={8} fill="none" strokeLinecap="round" />
    <path d="M56 -108 Q96 -118 104 -88 Q106 -64 80 -62 Q58 -66 52 -86Z" fill="#7b8791" stroke={INK} strokeWidth={7} />
    <path d="M58 -112 L50 -146 L78 -116Z" fill="#59636b" stroke={INK} strokeWidth={5} />
    <circle cx={88} cy={-92} r={5} fill={INK} /><ellipse cx={104} cy={-84} rx={7} ry={6} fill={INK} />
    {tag && <rect x={48} y={-102} width={12} height={16} rx={3} fill={RED} stroke={INK} strokeWidth={4} />}
  </g>
);

/** The screwworm fly, drawn large enough to read. Metallic blue-green, orange eyes, striped back. */
export const Fly: React.FC<{x: number; y: number; s?: number; frame: number; rot?: number}> = ({x, y, s = 1, frame, rot = 0}) => {
  const w = Math.sin(frame * 0.9) * 0.5 + 0.5;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <ellipse cx={-30} cy={-34 - w * 12} rx={54} ry={16 + w * 6} fill="#e6eef0" opacity={0.7} stroke={INK} strokeWidth={4} transform="rotate(-24 -30 -34)" />
      <ellipse cx={14} cy={-36 - w * 12} rx={50} ry={15 + w * 6} fill="#e6eef0" opacity={0.7} stroke={INK} strokeWidth={4} transform="rotate(-12 14 -36)" />
      <ellipse cx={0} cy={0} rx={52} ry={26} fill="#2e7a78" stroke={INK} strokeWidth={6} />
      <path d="M-20 -22 L-14 22 M2 -24 L8 24 M24 -20 L28 18" stroke="#13302f" strokeWidth={5} />
      <circle cx={56} cy={-4} r={22} fill="#2a6b6a" stroke={INK} strokeWidth={6} />
      <circle cx={62} cy={-12} r={13} fill="#e8812b" stroke={INK} strokeWidth={4} />
      <circle cx={58} cy={-16} r={4} fill="#fff" opacity={0.8} />
      <path d="M-10 22 L-22 48 M10 24 L8 52 M30 20 L40 46" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <ellipse cx={-26} cy={-6} rx={22} ry={8} fill="#7bd0cc" opacity={0.5} />
    </g>
  );
};

/** A pickup, side on, from the ground at `y`. The tailgate is on the left and drops open. */
export const Pickup: React.FC<{x: number; y: number; s?: number; gate?: number}> = ({x, y, s = 1, gate = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={20} cy={6} rx={290} ry={20} fill="rgba(20,16,12,.32)" />
    <path d="M-250 -120 L-250 -214 L-60 -214 L-60 -300 L130 -300 L206 -214 L256 -214 L270 -150 L270 -60 L-250 -60Z" fill="#c8c1ad" stroke={INK} strokeWidth={8} />
    <path d="M-250 -214 L-250 -120 L-60 -120 L-60 -214Z" fill="#a39b86" stroke={INK} strokeWidth={6} />
    <path d="M-40 -286 L120 -286 L180 -218 L-40 -218Z" fill="#9fc6cf" stroke={INK} strokeWidth={6} />
    <path d="M-250 -120 L-250 -60 L270 -60 L270 -120Z" fill="#b5ad98" opacity={0.7} />
    <path d="M-250 -214 L-250 -120" stroke={INK} strokeWidth={8} />
    {/* tailgate */}
    <g transform={`translate(-250 -120) rotate(${(1 - gate) * 0 + gate * 82})`}>
      <rect x={-8} y={0} width={14} height={86} fill="#a39b86" stroke={INK} strokeWidth={6} />
    </g>
    {[-150, 170].map((wx) => (
      <g key={wx}><circle cx={wx} cy={-46} r={62} fill="#26231f" stroke={INK} strokeWidth={8} />
        <circle cx={wx} cy={-46} r={30} fill="#9aa2a8" stroke={INK} strokeWidth={6} /></g>
    ))}
    <rect x={-262} y={-76} width={26} height={16} fill="#d9892b" stroke={INK} strokeWidth={4} />
    <path d="M-250 -60 Q-100 -70 270 -60" stroke="#8a7a58" strokeWidth={7} fill="none" opacity={0.35} />
  </g>
);

/** The calm of a drone's-eye pasture inside a screen: scrub, a worn track, a few mesquite blobs. */
export const Pasture: React.FC<{x: number; y: number; w: number; h: number; seed?: number; ir?: boolean; pan?: number}> = ({x, y, w, h, seed = 3, ir = false, pan = 0}) => (
  <g>
    <rect x={x} y={y} width={w} height={h} fill={ir ? '#2a1346' : '#b09a62'} />
    <rect x={x} y={y + h * 0.5} width={w} height={h * 0.5} fill={ir ? '#3d1a5e' : '#9c8a52'} opacity={0.7} />
    {Array.from({length: 11}, (_, i) => {
      const cx = x + ((rnd(seed, i) * 1.4 - 0.2 + pan * 0.1) % 1.2) * w, cy = y + h * (0.12 + rnd(seed, 30 + i) * 0.82);
      const r = 40 + rnd(seed, 60 + i) * 70;
      return <g key={i}><ellipse cx={cx + 8} cy={cy + 10} rx={r} ry={r * 0.62} fill="rgba(20,30,10,.25)" />
        <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.62} fill={ir ? '#5d2a86' : '#46602f'} stroke={ir ? '#2b0f48' : '#2c3d1d'} strokeWidth={4} />
        <ellipse cx={cx - r * 0.25} cy={cy - r * 0.2} rx={r * 0.5} ry={r * 0.3} fill={ir ? '#7a3da6' : '#648545'} opacity={0.8} /></g>;
    })}
  </g>
);

export const Chip: React.FC<{x: number; y: number; text: string; fill?: string; ink?: string; size?: number; anchor?: 'start' | 'middle'}> = ({x, y, text, fill = '#f4ecd8', ink = INK, size = 40, anchor = 'middle'}) => {
  const w = text.length * size * 0.66 + 40;
  const x0 = anchor === 'middle' ? x - w / 2 : x;
  return (
    <g>
      <rect x={x0 + 6} y={y - size - 4 + 8} width={w} height={size + 28} rx={8} fill="rgba(20,16,12,.5)" />
      <rect x={x0} y={y - size - 4} width={w} height={size + 28} rx={8} fill={fill} stroke={INK} strokeWidth={5} />
      <text x={x0 + w / 2} y={y + 10} fontSize={size} fontWeight={800} textAnchor="middle" fontFamily={FONT.mono} fill={ink}>{text}</text>
    </g>
  );
};

/** A feral hog, side on: barrel body, short legs, snout disc, tusks, bristle ridge, curled tail. Not an armadillo. */
export const Hog: React.FC<{x: number; y: number; s?: number; facing?: 1 | -1; frame?: number; rooting?: boolean}> = ({x, y, s = 1, facing = 1, frame = 0, rooting = false}) => {
  const dip = rooting ? 16 + Math.sin(frame / 6) * 8 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * facing} ${s})`}>
      <ellipse cx={0} cy={4} rx={150} ry={13} fill="rgba(20,16,12,.3)" />
      {[-84, -52, 52, 84].map((lx, i) => <path key={i} d={`M${lx} -66 L${lx - 2} -4 L${lx + 20} -4 L${lx + 18} -66Z`} fill={i % 2 ? '#3b3128' : '#4b3f33'} stroke={INK} strokeWidth={6} />)}
      <path d="M-128 -104 Q-132 -168 -60 -180 Q30 -198 100 -168 Q140 -140 134 -96 Q120 -56 40 -56 Q-60 -46 -112 -64 Q-132 -76 -128 -104Z" fill="#4b3f33" stroke={INK} strokeWidth={8} />
      <path d="M-100 -168 Q-30 -204 60 -184" stroke="#2a221b" strokeWidth={12} fill="none" strokeLinecap="round" strokeDasharray="6 7" />
      <path d="M-110 -80 Q-30 -62 60 -76" stroke="#6a5a48" strokeWidth={9} fill="none" opacity={0.6} />
      <path d={`M-128 -130 q-30 -12 -26 -42 q8 18 22 14`} stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" />
      <g transform={`translate(112 ${-112 + dip}) rotate(${rooting ? 14 : 0})`}>
        <path d="M-30 -46 Q40 -62 62 -20 Q66 32 24 46 Q-24 40 -34 -6Z" fill="#4b3f33" stroke={INK} strokeWidth={8} />
        <path d="M-6 -50 L-10 -86 L22 -56Z" fill="#3b3128" stroke={INK} strokeWidth={5} />
        <ellipse cx={58} cy={14} rx={20} ry={24} fill="#c9a28f" stroke={INK} strokeWidth={6} />
        <circle cx={52} cy={8} r={4} fill={INK} /><circle cx={66} cy={22} r={4} fill={INK} />
        <path d="M40 34 Q34 18 52 12" stroke="#f3ead2" strokeWidth={7} fill="none" strokeLinecap="round" />
        <circle cx={22} cy={-8} r={6} fill={INK} /><circle cx={20} cy={-10} r={2} fill="#fff" />
      </g>
    </g>
  );
};
