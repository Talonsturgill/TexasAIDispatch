import React from 'react';
import {ContactShadow, Glow, clamp01, ease, easeOutBack, lerp} from '../../../look/Kit';
import {line, light, shade} from '../../../look/color';
import {FONT} from '../../../lib/type';

/**
 * blank-boxes-1120 parts. Every drawing here is original and follows LOOK_V2: round corners, a key from the upper
 * left, shade toward violet, hue-tinted line, a contact shadow under anything that stands. The school, the
 * classroom, the laptop and the folder are illustrative, never a real site, and no product's mark is drawn.
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

export type Win = {x: number; y: number; w: number; h: number};
/** the stage's window rect per framing (modern/PlaceStage WINDOW), so Dallas County shows exactly where the stage puts it */
export const WIN: Record<'wide' | 'medium', Win> = {wide: {x: 96, y: 440, w: 888, h: 540}, medium: {x: 40, y: 410, w: 1000, h: 640}};

/**
 * THE CLASSROOM WALL. A warm painted cinder-block wall with a window cut clean through it (the stage draws the
 * county behind), a cork strip with kids' drawings, and a lit floor. `dusk` 0 to 1 tints the room toward evening
 * lamp light, which is how the long hours read without a clock.
 */
export const ClassRoom: React.FC<{frame: number; win?: Win | null; floorY?: number; wall?: string; floor?: string; dusk?: number;
  cork?: boolean}> = ({frame, win = WIN.wide, floorY = 1400, wall = '#f0b56a', floor = '#d9b98e', dusk = 0, cork = true}) => {
  const r = 46;
  const hole = win ? `M${win.x + r} ${win.y} H${win.x + win.w - r} Q${win.x + win.w} ${win.y} ${win.x + win.w} ${win.y + r} V${win.y + win.h - r} Q${win.x + win.w} ${win.y + win.h} ${win.x + win.w - r} ${win.y + win.h} H${win.x + r} Q${win.x} ${win.y + win.h} ${win.x} ${win.y + win.h - r} V${win.y + r} Q${win.x} ${win.y} ${win.x + r} ${win.y} Z` : '';
  const flick = 0.5 + 0.5 * Math.sin(frame / 9);
  return (
    <g>
      <defs>
        <linearGradient id="cr-wall" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={light(wall, 0.2)} />
          <stop offset="1" stopColor={shade(wall, 0.3)} />
        </linearGradient>
        <linearGradient id="cr-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(floor, 0.22)} />
          <stop offset="1" stopColor={light(floor, 0.12)} />
        </linearGradient>
      </defs>
      <path d={`M-60 -60 H1140 V${floorY} H-60 Z ${hole}`} fill="url(#cr-wall)" fillRule="evenodd" />
      {/* block courses, a little uneven, maintained but worn */}
      {Array.from({length: 11}, (_, i) => <path key={i} d={`M-60 ${floorY - 100 - i * 112 + (i % 3) * 2} H1140`} stroke={shade(wall, 0.18)}
        strokeWidth={3} opacity={0.32} />)}
      <rect x={-60} y={floorY - 120} width={1200} height={24} rx={8} fill={shade(wall, 0.35)} />
      {win && <g>
        <path d={hole} fill="none" stroke="#f6efe2" strokeWidth={22} />
        <path d={hole} fill="none" stroke={line('#f6efe2')} strokeWidth={6} />
        <path d={`M${win.x + win.w / 2} ${win.y} V${win.y + win.h}`} stroke="#f6efe2" strokeWidth={14} />
        <path d={`M${win.x + 24} ${win.y + 34} l70 -18`} stroke="#ffffff" strokeWidth={8} strokeLinecap="round" opacity={0.4} />
      </g>}
      {cork && !win && <g>
        <rect x={80} y={430} width={920} height={300} rx={30} fill="#c9935a" stroke={line('#c9935a')} strokeWidth={7} />
        {[[140, 470, '#7fc8ff', -4], [380, 480, '#ffd36b', 3], [620, 466, '#9be38a', -2], [830, 484, '#ff9db0', 5]].map(([x, y, c, rot], i) => (
          <g key={i} transform={`rotate(${rot as number} ${(x as number) + 80} ${(y as number) + 100})`}>
            <rect x={x as number} y={y as number} width={160} height={200} rx={14} fill="#fffaf0" stroke={line('#fffaf0')} strokeWidth={4} />
            <circle cx={(x as number) + 80} cy={(y as number) + 80} r={40} fill={c as string} opacity={0.85} />
            <path d={`M${(x as number) + 30} ${(y as number) + 160} q50 -30 100 0`} stroke={c as string} strokeWidth={10} fill="none" strokeLinecap="round" />
            <circle cx={(x as number) + 80} cy={(y as number) + 12} r={10} fill="#e23b3b" />
          </g>
        ))}
      </g>}
      <rect x={-60} y={floorY} width={1200} height={700} fill="url(#cr-floor)" />
      <path d={`M-60 ${floorY} H1140`} stroke={line(floor)} strokeWidth={6} />
      {[0, 1, 2, 3].map((k) => <path key={k} d={`M${120 + k * 280} ${floorY} L${-200 + k * 460} 1980`} stroke={shade(floor, 0.15)} strokeWidth={3} opacity={0.4} />)}
      {dusk > 0 && <rect x={-60} y={-60} width={1200} height={2100} fill="#2b1f6b" opacity={dusk * 0.42} />}
      {dusk > 0 && <Glow x={860} y={1180} r={520} color="#ffc46b" opacity={dusk * (0.45 + 0.05 * flick)} />}
    </g>
  );
};

/** THE DESK, a school teacher's desk in three quarter view, top at `y`. Things sit on it at y. */
export const Desk: React.FC<{x: number; y: number; w?: number; s?: number; c?: string}> = ({x, y, w = 760, s = 1, c = '#b9814f'}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ContactShadow x={0} y={330} w={w * 1.05} opacity={0.35} />
    <rect x={-w / 2 + 30} y={40} width={44} height={290} rx={14} fill={shade(c, 0.35)} stroke={line(c)} strokeWidth={6} />
    <rect x={w / 2 - 74} y={40} width={44} height={290} rx={14} fill={shade(c, 0.35)} stroke={line(c)} strokeWidth={6} />
    <rect x={w / 2 - 300} y={40} width={250} height={230} rx={20} fill={shade(c, 0.15)} stroke={line(c)} strokeWidth={6} />
    {[0, 1].map((k) => <rect key={k} x={w / 2 - 270} y={70 + k * 100} width={190} height={70} rx={14} fill={c} stroke={line(c)} strokeWidth={4} />)}
    {[0, 1].map((k) => <rect key={k} x={w / 2 - 200} y={98 + k * 100} width={50} height={14} rx={7} fill={light(c, 0.5)} />)}
    <path d={`M${-w / 2} 0 Q${-w / 2} -26 ${-w / 2 + 26} -26 H${w / 2 - 26} Q${w / 2} -26 ${w / 2} 0 V30 Q${w / 2} 50 ${w / 2 - 20} 50 H${-w / 2 + 20} Q${-w / 2} 50 ${-w / 2} 30 Z`}
      fill={c} stroke={line(c)} strokeWidth={7} strokeLinejoin="round" />
    <rect x={-w / 2 + 30} y={-20} width={w * 0.55} height={8} rx={4} fill={light(c, 0.55)} opacity={0.7} />
  </g>
);

export type LaptopMood = 'sleep' | 'calm' | 'busy' | 'proud' | 'shy' | 'point';

/**
 * THE LAPTOP, the hero. A rounded silver laptop whose screen carries a small face in its top bar (two eyes and
 * brows that act), and whose screen shows `children` in screen space (0..sw, 0..sh). `beam` 0 to 1 raises a
 * yellow highlighter beam from its face toward `beamTo` (in the same space as x,y). No product mark is drawn.
 */
export const Laptop: React.FC<{x: number; y: number; s?: number; frame: number; mood?: LaptopMood; open?: number; look?: number;
  children?: React.ReactNode; screen?: string; beam?: number; beamTo?: {x: number; y: number}}> = ({
  x, y, s = 1, frame, mood = 'calm', open = 1, look = 0, children, screen = '#f8f6ff', beam = 0, beamTo}) => {
  const sw = 520, sh = 330;
  const body = '#c9cfe0';
  const blink = (frame % 96) < 4 ? [1, 0.3, 0.1, 0.6][frame % 96] : 1;
  const eyeOpen = mood === 'sleep' ? 0.1 : mood === 'busy' ? 0.8 * blink : blink;
  const brow = {sleep: 0, calm: 0, busy: 12, proud: -10, shy: -16, point: -8}[mood];
  const bob = Math.sin(frame / 16) * 3;
  const tilt = (1 - clamp01(open)) * 80;
  return (
    <g transform={`translate(${x} ${y + bob * s}) scale(${s})`}>
      <ContactShadow x={0} y={16} w={sw * 1.15} opacity={0.36} />
      {/* the base, in perspective */}
      <path d={`M${-sw / 2 - 40} 0 L${sw / 2 + 40} 0 Q${sw / 2 + 52} 0 ${sw / 2 + 46} 12 L${sw / 2 + 30} 22 H${-sw / 2 - 30} L${-sw / 2 - 46} 12 Q${-sw / 2 - 52} 0 ${-sw / 2 - 40} 0 Z`}
        fill={shade(body, 0.2)} stroke={line(body)} strokeWidth={6} strokeLinejoin="round" />
      <path d={`M${-sw / 2 - 20} -50 L${sw / 2 + 20} -50 L${sw / 2 + 40} 0 H${-sw / 2 - 40} Z`} fill={body} stroke={line(body)} strokeWidth={6} strokeLinejoin="round" />
      {Array.from({length: 3}, (_, r) => <path key={r} d={`M${-sw / 2 + 10 - r * 6} ${-40 + r * 12} H${sw / 2 - 10 + r * 6}`} stroke={shade(body, 0.25)}
        strokeWidth={6} strokeDasharray="22 8" opacity={0.7} />)}
      {/* the lid */}
      <g transform={`translate(0 -50) skewX(0) scale(1 ${Math.cos((tilt * Math.PI) / 180)})`}>
        <rect x={-sw / 2 - 26} y={-sh - 70} width={sw + 52} height={sh + 70} rx={30} fill={shade(body, 0.1)} stroke={line(body)} strokeWidth={7} />
        <rect x={-sw / 2} y={-sh - 20} width={sw} height={sh} rx={16} fill={screen} />
        <g transform={`translate(${-sw / 2} ${-sh - 20})`}>
          <clipPath id="lap-clip"><rect x={0} y={0} width={sw} height={sh} rx={16} /></clipPath>
          <g clipPath="url(#lap-clip)">{children}</g>
        </g>
        <path d={`M${-sw / 2 + 20} ${-sh} l120 -2`} stroke="#ffffff" strokeWidth={8} strokeLinecap="round" opacity={0.5} />
        {/* the face lives in the top bezel */}
        {[-1, 1].map((sd) => (
          <g key={sd} transform={`translate(${sd * 46} ${-sh - 44})`}>
            <ellipse rx={13} ry={15 * eyeOpen} fill="#2a2140" />
            {eyeOpen > 0.3 && <circle cx={look * 5 - 4} cy={-5} r={4.5} fill="#ffffff" />}
            <path d={`M-16 ${-24 + sd * brow * 0.3} L16 ${-24 - sd * brow * 0.3}`} stroke="#2a2140" strokeWidth={5} strokeLinecap="round" />
          </g>
        ))}
        {mood === 'proud' || mood === 'point'
          ? <path d={`M-18 ${-sh - 30} Q0 ${-sh - 18} 18 ${-sh - 30}`} stroke="#2a2140" strokeWidth={5} fill="none" strokeLinecap="round" />
          : mood === 'shy' ? <path d={`M-10 ${-sh - 26} H10`} stroke="#2a2140" strokeWidth={5} strokeLinecap="round" />
          : null}
        {mood === 'shy' && [-1, 1].map((sd) => <ellipse key={sd} cx={sd * 78} cy={-sh - 36} rx={14} ry={7} fill="#ff8fa3" opacity={0.7} />)}
      </g>
      {beam > 0 && beamTo && (() => {
        const ox = 0, oy = -50 - sh - 44;
        const tx = (beamTo.x - x) / s, ty = (beamTo.y - y) / s;
        const ex = lerp(ox, tx, beam), ey = lerp(oy, ty, beam);
        return <g>
          <path d={`M${ox - 30} ${oy} L${ex - 60} ${ey} L${ex + 60} ${ey} L${ox + 30} ${oy} Z`} fill="#fff27a" opacity={0.35} />
          <circle cx={ex} cy={ey} r={30 + 6 * Math.sin(frame / 4)} fill="#fff27a" opacity={0.6} />
        </g>;
      })()}
    </g>
  );
};

/** a screen line of text, for the laptop screen and the IEP pages */
export const Lines: React.FC<{x: number; y: number; w: number; n: number; gap?: number; c?: string; p?: number; thick?: number}> = ({
  x, y, w, n, gap = 34, c = '#9aa3c4', p = 1, thick = 12}) => (
  <g>{Array.from({length: n}, (_, i) => {
    const q = clamp01(p * n - i);
    const ww = w * (i % 3 === 2 ? 0.62 : i % 2 ? 0.86 : 1) * q;
    return ww > 2 ? <rect key={i} x={x} y={y + i * gap} width={ww} height={thick} rx={thick / 2} fill={c} /> : null;
  })}</g>
);

export type BoxState = 'empty' | 'flag' | 'filled' | 'pen';

/**
 * THE IEP DRAFT PAGE. A tall page with a title band and six section boxes. Each box is `empty` (bare outline),
 * `flag` (glowing yellow highlight with a dashed edge and a "?" tab, the tool pointing at what is missing),
 * `filled` (typed lines) or `pen` (handwritten blue lines, a person's own words). `p` 0..1 grows the page in.
 */
export const IEPPage: React.FC<{x: number; y: number; s?: number; frame: number; boxes: BoxState[]; p?: number; title?: string; rot?: number;
  sign?: number; labels?: string[]}> = ({x, y, s = 1, frame, boxes, p = 1, title = 'IEP DRAFT', rot = 0, sign = 0, labels}) => {
  const W = 520, H = 700;
  const paper = '#fffaf0';
  const g = easeOutBack(clamp01(p), 1.3);
  const pulse = 0.5 + 0.5 * Math.sin(frame / 5);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * g})`}>
      <ContactShadow x={0} y={H / 2 + 20} w={W * 0.9} opacity={0.3} />
      <rect x={-W / 2 + 10} y={-H / 2 + 14} width={W} height={H} rx={26} fill="#1b1430" opacity={0.16} />
      <rect x={-W / 2} y={-H / 2} width={W} height={H} rx={26} fill={paper} stroke={line(paper)} strokeWidth={6} />
      <rect x={-W / 2} y={-H / 2} width={W} height={90} rx={26} fill="#3b6fd1" />
      <rect x={-W / 2} y={-H / 2 + 60} width={W} height={30} fill="#3b6fd1" />
      <text x={0} y={-H / 2 + 60} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={42} fill="#ffffff">{title}</text>
      {boxes.map((b, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const bx = -W / 2 + 26 + col * 244, by = -H / 2 + 116 + row * 182, bw = 226, bh = 160;
        return (
          <g key={i}>
            {b === 'flag' && <rect x={bx - 8} y={by - 8} width={bw + 16} height={bh + 16} rx={24} fill="#fff27a" opacity={0.45 + 0.25 * pulse} />}
            <rect x={bx} y={by} width={bw} height={bh} rx={18} fill={b === 'flag' ? '#fff7b0' : '#f3f0ff'}
              stroke={b === 'flag' ? '#d8a400' : '#c9c3e6'} strokeWidth={b === 'flag' ? 6 : 4} strokeDasharray={b === 'flag' ? '16 10' : undefined} />
            {labels && labels[i] && <text x={bx + 16} y={by + 34} fontFamily={FONT.body} fontWeight={800} fontSize={24} fill="#5a5e86">{labels[i]}</text>}
            {b === 'filled' && <Lines x={bx + 16} y={by + (labels ? 56 : 24)} w={bw - 40} n={labels ? 3 : 4} gap={28} thick={11} c="#8d95bf" />}
            {b === 'pen' && [0, 1, 2].map((k) => (
              <path key={k} d={`M${bx + 16} ${by + (labels ? 66 : 36) + k * 30} q20 -10 40 0 t40 0 t40 0 t40 0 ${k === 2 ? '' : 't30 0'}`}
                stroke="#1d4ed8" strokeWidth={6} fill="none" strokeLinecap="round" />
            ))}
            {b === 'flag' && <g transform={`translate(${bx + bw - 10} ${by + 6})`}>
              <circle r={26} fill="#ffcf2e" stroke={line('#ffcf2e')} strokeWidth={4} />
              <text x={0} y={11} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={32} fill="#5a3b00">?</text>
            </g>}
          </g>
        );
      })}
      {sign > 0 && <path d={`M${-W / 2 + 60} ${H / 2 - 50} q30 -40 60 0 t60 -10 t50 10 t60 -20`} stroke="#1d4ed8" strokeWidth={7} fill="none"
        strokeLinecap="round" strokeDasharray={420} strokeDashoffset={420 * (1 - clamp01(sign))} />}
    </g>
  );
};

/** A LOOSE PAPER, tumbling, for the paper storm of the old way */
export const Sheet: React.FC<{x: number; y: number; s?: number; rot?: number; c?: string; tab?: string}> = ({x, y, s = 1, rot = 0, c = '#fffaf0', tab}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-80} y={-100} width={160} height={200} rx={16} fill={c} stroke={line(c)} strokeWidth={4} />
    <Lines x={-58} y={-70} w={116} n={5} gap={28} thick={9} c="#b9b4d6" />
    {tab && <rect x={-80} y={-100} width={160} height={30} rx={14} fill={tab} />}
  </g>
);

/**
 * THE STUDENT FOLDER, the throughline. A manila folder with a tab. `stack` 0..1 is how many loose papers bulge
 * out of it (the old way), `sticky` shows a yellow note, `ribbon` closes it with a done band. `open` swings it.
 */
export const Folder: React.FC<{x: number; y: number; s?: number; frame: number; stack?: number; sticky?: number; ribbon?: number;
  label?: string; open?: number}> = ({x, y, s = 1, frame, stack = 0, sticky = 0, ribbon = 0, label = 'STUDENT A', open = 0}) => {
  const c = '#f2c46d';
  const n = Math.round(stack * 9);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ContactShadow x={0} y={150} w={460} opacity={0.32} />
      <path d="M-220 -150 H-60 Q-40 -150 -30 -130 L-20 -110 H200 Q220 -110 220 -90 V140 Q220 160 200 160 H-200 Q-220 160 -220 140 Z"
        fill={shade(c, 0.2)} stroke={line(c)} strokeWidth={7} strokeLinejoin="round" />
      {Array.from({length: n}, (_, i) => (
        <g key={i} transform={`translate(${-150 + (i * 37) % 300} ${-150 - (i % 4) * 22 + Math.sin(frame / 10 + i) * 3}) rotate(${((i * 53) % 30) - 15})`}>
          <rect x={-60} y={-70} width={120} height={150} rx={10} fill={['#fffaf0', '#eaf4ff', '#fff0f4', '#f0fff0'][i % 4]}
            stroke={line('#fffaf0')} strokeWidth={3} />
          <Lines x={-44} y={-50} w={88} n={4} gap={24} thick={8} c="#c2bedc" />
        </g>
      ))}
      <g transform={`rotate(${-open * 14} -220 160)`}>
        <path d="M-220 -100 H200 Q220 -100 220 -80 V140 Q220 160 200 160 H-200 Q-220 160 -220 140 Z" fill={c} stroke={line(c)} strokeWidth={7}
          strokeLinejoin="round" />
        <path d="M-200 -80 H60" stroke={light(c, 0.5)} strokeWidth={8} strokeLinecap="round" opacity={0.7} />
        <rect x={-150} y={-30} width={300} height={70} rx={16} fill="#fffaf0" stroke={line('#fffaf0')} strokeWidth={4} />
        <text x={0} y={18} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={38} fill="#3a3350">{label}</text>
        {sticky > 0 && <g transform={`translate(130 80) rotate(${8 - 4 * (1 - sticky)}) scale(${easeOutBack(sticky)})`}>
          <rect x={-60} y={-55} width={120} height={110} rx={10} fill="#ffe14d" stroke={line('#ffe14d')} strokeWidth={4} />
          <path d="M-36 -18 q14 -8 28 0 t28 0 M-36 12 q14 -8 28 0" stroke="#1d4ed8" strokeWidth={5} fill="none" strokeLinecap="round" />
        </g>}
        {ribbon > 0 && <g>
          <rect x={-30} y={-100} width={60} height={260 * clamp01(ribbon)} fill="#2bb673" stroke={line('#2bb673')} strokeWidth={4} />
          {ribbon >= 1 && <g transform="translate(0 40)"><circle r={46} fill="#2bb673" stroke={line('#2bb673')} strokeWidth={5} />
            <path d="M-20 0 L-5 16 L22 -16" stroke="#ffffff" strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>}
        </g>}
      </g>
    </g>
  );
};

/** AN APP TILE, one of the district platforms the tool pulls from: a rounded lit tile with a simple glyph */
export const AppTile: React.FC<{x: number; y: number; s?: number; c: string; glyph: 'cal' | 'chart' | 'star' | 'book' | 'heart' | 'note';
  label?: string; p?: number}> = ({x, y, s = 1, c, glyph, label, p = 1}) => {
  const g = easeOutBack(clamp01(p), 1.6);
  if (g <= 0) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * g})`}>
      <ContactShadow x={0} y={92} w={150} opacity={0.3} />
      <LitBox x={-80} y={-80} w={160} h={160} r={40} c={c} sw={6} />
      <g stroke="#ffffff" strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round">
        {glyph === 'cal' && <><rect x={-36} y={-30} width={72} height={64} rx={10} /><path d="M-36 -10 H36 M-18 -42 V-22 M18 -42 V-22" /></>}
        {glyph === 'chart' && <path d="M-36 30 V-30 M-36 30 H40 M-20 14 L0 -6 L14 6 L36 -20" />}
        {glyph === 'star' && <path d="M0 -36 L11 -10 L38 -8 L17 10 L24 36 L0 22 L-24 36 L-17 10 L-38 -8 L-11 -10 Z" />}
        {glyph === 'book' && <path d="M0 -26 Q-20 -36 -40 -30 V30 Q-20 24 0 34 Q20 24 40 30 V-30 Q20 -36 0 -26 V34" />}
        {glyph === 'heart' && <path d="M0 30 C-50 -6 -30 -44 0 -18 C30 -44 50 -6 0 30 Z" />}
        {glyph === 'note' && <path d="M-30 -36 H20 L34 -22 V36 H-30 Z M-16 -10 H18 M-16 8 H18 M-16 24 H6" />}
      </g>
      {label && <text x={0} y={128} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={30} fill="#fff6e6" stroke={line('#3a3350')}
        strokeWidth={6} paintOrder="stroke">{label}</text>}
    </g>
  );
};

/** A SHIELD with a lock, for the privacy test: cracks appear on `crack` */
export const Vault: React.FC<{x: number; y: number; s?: number; frame: number; copies?: number; crack?: number}> = ({x, y, s = 1, frame, copies = 1,
  crack = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {Array.from({length: copies}, (_, i) => {
      const ox = (i - (copies - 1) / 2) * 190, oy = Math.abs(i - (copies - 1) / 2) * 40;
      const wob = Math.sin(frame / 12 + i) * 4;
      return (
        <g key={i} transform={`translate(${ox} ${oy + wob})`}>
          <ContactShadow x={0} y={150} w={160} opacity={0.3} />
          <path d="M0 -130 L100 -90 V10 Q100 100 0 140 Q-100 100 -100 10 V-90 Z" fill="#6c7bd9" stroke={line('#6c7bd9')} strokeWidth={7} strokeLinejoin="round" />
          <path d="M-70 -70 L0 -100" stroke={light('#6c7bd9', 0.5)} strokeWidth={10} strokeLinecap="round" opacity={0.7} />
          <rect x={-34} y={-10} width={68} height={60} rx={12} fill="#ffd34d" stroke={line('#ffd34d')} strokeWidth={5} />
          <path d="M-20 -10 V-30 Q0 -56 20 -30 V-10" stroke="#ffd34d" strokeWidth={10} fill="none" strokeLinecap="round" />
          {crack > 0 && i === copies - 1 && <path d={`M30 -100 L10 -50 L36 -20 L4 30`} stroke="#ff4a5a" strokeWidth={8} fill="none" strokeLinecap="round"
            strokeDasharray={200} strokeDashoffset={200 * (1 - clamp01(crack))} />}
        </g>
      );
    })}
  </g>
);

/** a sun or moon arc in a window, for the clock of the evening: `t` 0 afternoon to 1 night */
export const SkyArc: React.FC<{x: number; y: number; w: number; t: number}> = ({x, y, w, t}) => {
  const sx = lerp(x + w * 0.15, x + w * 0.9, t), sy = y + 80 + Math.sin(t * Math.PI) * -20 + t * 260;
  return <g>
    <circle cx={sx} cy={sy} r={46} fill={t > 0.7 ? '#ff8a4a' : '#fff1a8'} opacity={1 - clamp01((t - 0.85) * 6)} />
    {t > 0.85 && <circle cx={x + w * 0.2} cy={y + 90} r={34} fill="#f3f0ff" opacity={clamp01((t - 0.85) * 6)} />}
  </g>;
};

export type HiMood = 'sleep' | 'happy' | 'curious' | 'alarm' | 'proud' | 'wary';

/**
 * THE HIGHLIGHTER, the hero. A fat yellow highlighter standing on its end, with a face on its barrel: eyes with
 * catchlights, brows that act, a mouth that changes on the beat. `cap` 0 capped to 1 off (the chisel tip shows).
 * `glow` 0..1 throws a highlighter-yellow beam from the tip toward `to` (in the parent's space). `lean` tilts it,
 * `squash` squashes it on a landing. Illustrative, no product mark.
 */
export const Highlighter: React.FC<{x: number; y: number; s?: number; frame: number; mood?: HiMood; cap?: number; glow?: number;
  to?: {x: number; y: number}; lean?: number; squash?: number; look?: number; shadow?: boolean}> = ({
  x, y, s = 1, frame, mood = 'happy', cap = 0, glow = 0, to, lean = 0, squash = 0, look = 0, shadow = true}) => {
  const body = '#ffe14d', capC = '#f7b500';
  const blink = (frame % 78) < 4 ? [1, 0.3, 0.1, 0.6][frame % 78] : 1;
  const eye = mood === 'sleep' ? 0.1 : mood === 'alarm' ? 1.3 : blink;
  const brow = {sleep: 0, happy: -4, curious: -12, alarm: -18, proud: -8, wary: 14}[mood];
  const breathe = Math.sin(frame / 14) * 0.02;
  const sy = 1 - squash * 0.22 + breathe, sx = 1 + squash * 0.18 - breathe * 0.5;
  const capOff = clamp01(cap);
  const tipY = -330;
  // the beam, from the tip in world space
  const rad = (lean * Math.PI) / 180;
  const tip = {x: x + Math.sin(rad) * -tipY * s * sy, y: y + Math.cos(rad) * tipY * s * sy};
  return (
    <g>
      {glow > 0 && to && <g opacity={clamp01(glow)}>
        <path d={`M${tip.x - 18 * s} ${tip.y} L${lerp(tip.x, to.x, glow) - 90} ${lerp(tip.y, to.y, glow)} L${lerp(tip.x, to.x, glow) + 90} ${lerp(tip.y, to.y, glow)} L${tip.x + 18 * s} ${tip.y} Z`}
          fill="#fff27a" opacity={0.42} />
        <circle cx={lerp(tip.x, to.x, glow)} cy={lerp(tip.y, to.y, glow)} r={70 + 8 * Math.sin(frame / 4)} fill="#fff27a" opacity={0.4} />
      </g>}
      <g transform={`translate(${x} ${y}) rotate(${lean}) scale(${s * sx} ${s * sy})`}>
        {shadow && <ContactShadow x={0} y={6} w={170} opacity={0.38} />}
        {/* the barrel */}
        <rect x={-62} y={-250} width={124} height={250} rx={46} fill={shade(body, 0.12)} stroke={line(body)} strokeWidth={7} />
        <rect x={-54} y={-244} width={84} height={236} rx={40} fill={body} />
        <rect x={-40} y={-226} width={14} height={180} rx={7} fill={light(body, 0.6)} opacity={0.75} />
        <rect x={-62} y={-60} width={124} height={26} rx={10} fill={shade(body, 0.3)} opacity={0.6} />
        {/* the chisel tip */}
        <path d="M-40 -250 L-26 -320 Q0 -334 26 -320 L40 -250 Z" fill="#f1f1ea" stroke={line('#f1f1ea')} strokeWidth={6} strokeLinejoin="round" />
        <path d="M-18 -318 L18 -330 L22 -312 L-14 -304 Z" fill="#ffe600" stroke={line('#ffe600')} strokeWidth={4} strokeLinejoin="round" />
        {/* the cap, lifting off and tilting */}
        <g transform={`translate(${capOff * 70} ${-capOff * 120}) rotate(${capOff * 28} 0 -260)`} opacity={1 - clamp01((capOff - 0.9) * 10) * 0}>
          <rect x={-66} y={-350} width={132} height={120} rx={46} fill={capC} stroke={line(capC)} strokeWidth={7} />
          <rect x={-50} y={-338} width={18} height={92} rx={9} fill={light(capC, 0.55)} opacity={0.7} />
          <rect x={58} y={-330} width={20} height={90} rx={10} fill={shade(capC, 0.2)} stroke={line(capC)} strokeWidth={5} />
        </g>
        {/* the face */}
        {[-1, 1].map((sd) => (
          <g key={sd} transform={`translate(${sd * 26} -168)`}>
            <ellipse rx={14} ry={17 * eye} fill="#2a2140" />
            {eye > 0.3 && <circle cx={look * 5 - 4} cy={-6} r={5} fill="#ffffff" />}
            <path d={`M-15 ${-28 + sd * brow * 0.35} L15 ${-28 - sd * brow * 0.35}`} stroke="#2a2140" strokeWidth={6} strokeLinecap="round" />
          </g>
        ))}
        {mood === 'alarm' ? <ellipse cx={0} cy={-122} rx={11} ry={14} fill="#2a2140" />
          : mood === 'wary' ? <path d="M-14 -120 q7 -6 14 0 t14 0" stroke="#2a2140" strokeWidth={5} fill="none" strokeLinecap="round" />
          : mood === 'sleep' ? <path d="M-10 -122 H10" stroke="#2a2140" strokeWidth={5} strokeLinecap="round" />
          : mood === 'curious' ? <circle cx={4} cy={-122} r={7} fill="#2a2140" />
          : <path d={`M-18 -128 Q0 ${mood === 'proud' ? -108 : -112} 18 -128`} stroke="#2a2140" strokeWidth={6} fill="none" strokeLinecap="round" />}
        {(mood === 'happy' || mood === 'proud') && [-1, 1].map((sd) => <ellipse key={sd} cx={sd * 44} cy={-136} rx={10} ry={6} fill="#ff9a76" opacity={0.6} />)}
      </g>
    </g>
  );
};

/** THE PENCIL CUP, a lit ceramic cup with pencils; the highlighter hides in it */
export const PencilCup: React.FC<{x: number; y: number; s?: number; frame: number; jiggle?: number}> = ({x, y, s = 1, frame, jiggle = 0}) => {
  const c = '#3b6fd1';
  const j = Math.sin(frame * 1.8) * jiggle * 6;
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${j * 0.4})`}>
      <ContactShadow x={0} y={8} w={190} opacity={0.36} />
      {[[-40, -200, '#f6b44a', -10], [-6, -220, '#ff6b6b', 4], [30, -196, '#7bd389', 12]].map(([px, py, pc, r], i) => (
        <g key={i} transform={`rotate(${(r as number) + j} ${px} -60)`}>
          <rect x={(px as number) - 10} y={py as number} width={20} height={160} rx={8} fill={pc as string} stroke={line(pc as string)} strokeWidth={4} />
          <path d={`M${(px as number) - 10} ${py as number} L${px as number} ${(py as number) - 26} L${(px as number) + 10} ${py as number} Z`} fill="#f2d3a0" stroke={line('#f2d3a0')} strokeWidth={3} />
        </g>
      ))}
      <path d="M-80 -130 H80 L70 -10 Q68 6 52 6 H-52 Q-68 6 -70 -10 Z" fill={c} stroke={line(c)} strokeWidth={7} strokeLinejoin="round" />
      <ellipse cx={0} cy={-130} rx={80} ry={16} fill={shade(c, 0.35)} stroke={line(c)} strokeWidth={6} />
      <path d="M-60 -110 L-52 -20" stroke={light(c, 0.6)} strokeWidth={10} strokeLinecap="round" opacity={0.6} />
    </g>
  );
};

/** A BALANCE SCALE, for the study: `tilt` -1..1 tips the beam */
export const Scale: React.FC<{x: number; y: number; s?: number; tilt?: number; left?: React.ReactNode; right?: React.ReactNode}> = ({
  x, y, s = 1, tilt = 0, left, right}) => {
  const a = tilt * 14;
  const r = (a * Math.PI) / 180;
  const lx = -300 * Math.cos(r), ly = -300 * Math.sin(r) * -1;
  const rx = 300 * Math.cos(r), ry = 300 * Math.sin(r) * -1;
  const metal = '#c9a24a';
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ContactShadow x={0} y={420} w={380} opacity={0.35} />
      <path d="M-130 420 Q0 360 130 420 Z" fill={metal} stroke={line(metal)} strokeWidth={7} />
      <rect x={-18} y={-40} width={36} height={440} rx={14} fill={metal} stroke={line(metal)} strokeWidth={6} />
      <g transform={`rotate(${-a})`}><rect x={-320} y={-14} width={640} height={28} rx={14} fill={metal} stroke={line(metal)} strokeWidth={6} /></g>
      <circle r={30} fill={light(metal, 0.3)} stroke={line(metal)} strokeWidth={6} />
      {[[lx, -ly, left], [rx, -ry, right]].map(([px, py, kid], i) => (
        <g key={i} transform={`translate(${px as number} ${py as number})`}>
          <path d="M0 0 L-110 200 M0 0 L110 200" stroke={shade(metal, 0.3)} strokeWidth={6} />
          <path d="M-140 200 H140 Q120 250 0 250 Q-120 250 -140 200 Z" fill={metal} stroke={line(metal)} strokeWidth={7} />
          <g transform="translate(0 200)">{kid as React.ReactNode}</g>
        </g>
      ))}
    </g>
  );
};

/** A STOPWATCH with a hand that sweeps to `p` of a lap */
export const Stopwatch: React.FC<{x: number; y: number; s?: number; p: number; c?: string}> = ({x, y, s = 1, p, c = '#ff6b6b'}) => {
  const a = p * Math.PI * 2 - Math.PI / 2;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-20} y={-130} width={40} height={36} rx={10} fill={shade(c, 0.2)} stroke={line(c)} strokeWidth={5} />
      <circle r={100} fill={c} stroke={line(c)} strokeWidth={8} />
      <circle r={80} fill="#fffaf0" />
      <path d={`M0 0 L0 -80 A80 80 0 ${p > 0.5 ? 1 : 0} 1 ${Math.cos(a) * 80} ${Math.sin(a) * 80} Z`} fill={c} opacity={0.35} />
      <path d={`M0 0 L${Math.cos(a) * 70} ${Math.sin(a) * 70}`} stroke="#2a2140" strokeWidth={8} strokeLinecap="round" />
      <circle r={9} fill="#2a2140" />
    </g>
  );
};
