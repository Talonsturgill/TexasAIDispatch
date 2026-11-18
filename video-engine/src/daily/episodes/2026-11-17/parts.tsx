import React from 'react';
import {ContactShadow, Glow, clamp01, lerp, useUid} from '../../../look/Kit';
import {Visor, type MachineMood} from '../../../look/machines';
import {line, light, shade} from '../../../look/color';
import {FONT} from '../../../lib/type';

/**
 * pipe-arm-1117 parts (November 17th, 2026). Drawn in screen pixels, lit from the upper left, every
 * corner round, outlines in each fill's own deep hue. Disclosed illustration.
 */

const PIPE = '#c98a52';
const STEEL = '#9aa6c4';
const ORANGE = '#f07a2a';

/** a lit tube between two points, the drawing everything here is made of */
export const Tube: React.FC<{x1: number; y1: number; x2: number; y2: number; w: number; c: string; op?: number}> = ({
  x1, y1, x2, y2, w, c, op = 1}) => {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const ox = Math.sin(ang) * w * 0.2, oy = -Math.cos(ang) * w * 0.2;
  return <g opacity={op}>
    <path d={`M${x1} ${y1} L${x2} ${y2}`} stroke={line(c)} strokeWidth={w + 8} strokeLinecap="round" />
    <path d={`M${x1} ${y1} L${x2} ${y2}`} stroke={shade(c, 0.22)} strokeWidth={w} strokeLinecap="round" />
    <path d={`M${x1 - ox * 0.4} ${y1 - oy * 0.4} L${x2 - ox * 0.4} ${y2 - oy * 0.4}`} stroke={c} strokeWidth={w * 0.62} strokeLinecap="round" />
    <path d={`M${x1 + ox} ${y1 + oy} L${x2 + ox} ${y2 + oy}`} stroke={light(c, 0.55)} strokeWidth={Math.max(2, w * 0.14)}
      strokeLinecap="round" opacity={0.75} />
  </g>;
};

/** A JOINT OF DRILL PIPE, standing or lying, with its fat tool-joint ends. (x, y) is the centre. */
export const PipeJoint: React.FC<{x: number; y: number; len: number; w?: number; rot?: number; c?: string; glint?: number}> = ({
  x, y, len, w = 30, rot = 0, c = PIPE, glint = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <Tube x1={0} y1={-len / 2 + w * 0.6} x2={0} y2={len / 2 - w * 0.6} w={w} c={c} />
    <Tube x1={0} y1={-len / 2} x2={0} y2={-len / 2 + w * 1.2} w={w * 1.45} c={shade(c, 0.05)} />
    <Tube x1={0} y1={len / 2 - w * 1.2} x2={0} y2={len / 2} w={w * 1.45} c={shade(c, 0.05)} />
    {glint > 0 && <ellipse cx={-w * 0.15} cy={lerp(-len / 2, len / 2, glint % 1)} rx={w * 0.22} ry={w * 1.4} fill="#fff6dc" opacity={0.7} />}
  </g>
);

/**
 * THE PIPE ARM, the hero. A pipe-handling robot on the drill floor: a heavy orange column on a track,
 * a boom that swings from the rack (swing 0) to well centre (swing 1), and two padded jaws that close on
 * a joint of pipe. Its head carries the machine face. (x, y) is its foot on the deck, s its size.
 */
export const PipeArm: React.FC<{x: number; y: number; s?: number; frame: number; swing?: number; lift?: number; grip?: number;
  mood?: MachineMood; pipe?: boolean; pipeLen?: number; facing?: 1 | -1; look?: number; thumb?: number; glove?: number}> = ({
  x, y, s = 1, frame, swing = 0, lift = 0, grip = 1, mood = 'focused', pipe = true, pipeLen = 620, facing = 1, look = 0, thumb = 0,
  glove = 0}) => {
  const id = useUid();
  const breathe = Math.sin(frame / 30 * 2.2) * 3;
  // the shoulder, the boom angle swings from up-left (rack) to out-right (well centre)
  const sx = 0, sy = -420 + breathe;
  const ang = lerp(-125, -18, swing) * Math.PI / 180;
  const L = 330;
  const ex = sx + Math.cos(ang) * L, ey = sy + Math.sin(ang) * L - lift * 80;
  const jaw = lerp(46, 18, clamp01(grip));
  return (
    <g transform={`translate(${x} ${y}) scale(${s * facing} ${s})`}>
      <defs>
        <linearGradient id={`${id}-o`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={light(ORANGE, 0.3)} />
          <stop offset="55%" stopColor={ORANGE} /><stop offset="100%" stopColor={shade(ORANGE, 0.35)} /></linearGradient>
        <linearGradient id={`${id}-s`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={light(STEEL, 0.3)} />
          <stop offset="100%" stopColor={shade(STEEL, 0.35)} /></linearGradient>
      </defs>
      <ContactShadow x={0} y={6} w={360} opacity={0.38} />
      {/* track and base */}
      <rect x={-170} y={-34} width={340} height={34} rx={17} fill={`url(#${id}-s)`} stroke={line(STEEL)} strokeWidth={6} />
      {[-120, -60, 0, 60, 120].map((bx) => <circle key={bx} cx={bx} cy={-17} r={6} fill={shade(STEEL, 0.4)} />)}
      <path d="M-110 -34 L-80 -330 Q-70 -380 0 -386 Q70 -380 80 -330 L110 -34 Z" fill={`url(#${id}-o)`} stroke={line(ORANGE)}
        strokeWidth={7} strokeLinejoin="round" />
      <path d="M-66 -320 L-88 -60" stroke={light(ORANGE, 0.6)} strokeWidth={9} strokeLinecap="round" opacity={0.6} />
      {/* hoses */}
      {[0, 1].map((k) => <path key={k} d={`M${40 + k * 16} -360 Q${110 + k * 10 + breathe * 2} -260 ${70 + k * 10} -120`} stroke={line('#3a3550')}
        strokeWidth={14 - k * 3} fill="none" strokeLinecap="round" />)}
      {[0, 1].map((k) => <path key={`h${k}`} d={`M${40 + k * 16} -360 Q${110 + k * 10 + breathe * 2} -260 ${70 + k * 10} -120`} stroke={light('#3a3550', 0.2)}
        strokeWidth={8 - k * 2} fill="none" strokeLinecap="round" />)}
      {/* the boom, one continuous tube from inside the shoulder to the jaw head */}
      <Tube x1={sx} y1={sy} x2={ex} y2={ey} w={70} c={ORANGE} />
      <circle cx={sx} cy={sy} r={66} fill={`url(#${id}-o)`} stroke={line(ORANGE)} strokeWidth={7} />
      {/* the face lives on the shoulder housing */}
      <Visor x={sx} y={sy} w={96} h={50} mood={mood} frame={frame} look={look} />
      {/* the jaw head */}
      <g transform={`translate(${ex} ${ey})`}>
        <circle r={44} fill={`url(#${id}-s)`} stroke={line(STEEL)} strokeWidth={6} />
        {pipe && <g transform={`translate(0 ${pipeLen * 0.18})`}><PipeJoint x={0} y={0} len={pipeLen} w={34} /></g>}
        {[-1, 1].map((sd) => <path key={sd} d={`M${sd * 20} 20 Q${sd * (jaw + 30)} 40 ${sd * jaw} 92`} stroke={line(STEEL)} strokeWidth={30}
          strokeLinecap="round" fill="none" />)}
        {[-1, 1].map((sd) => <path key={`j${sd}`} d={`M${sd * 20} 20 Q${sd * (jaw + 30)} 40 ${sd * jaw} 92`} stroke={light(STEEL, 0.25)}
          strokeWidth={18} strokeLinecap="round" fill="none" />)}
        {[-1, 1].map((sd) => <rect key={`p${sd}`} x={sd * jaw - 13} y={74} width={26} height={30} rx={12} fill="#2b2a44" />)}
        {thumb > 0 && <g transform={`translate(52 -20) rotate(${-30 + thumb * 30})`} opacity={clamp01(thumb * 2)}>
          <Tube x1={0} y1={0} x2={0} y2={-70 * thumb} w={24} c={STEEL} />
        </g>}
        {glove > 0 && <g transform={`translate(0 ${90 + glove * 260}) rotate(${glove * 70})`} opacity={clamp01(1.4 - glove)}>
          <Glove x={0} y={0} s={0.9} />
        </g>}
      </g>
    </g>
  );
};

/** ONE LEATHER WORK GLOVE, palm out, cuff down; (x, y) is the palm centre. `grease` darkens the palm. */
export const Glove: React.FC<{x: number; y: number; s?: number; rot?: number; grease?: number; c?: string}> = ({
  x, y, s = 1, rot = 0, grease = 0, c = '#e2b25c'}) => {
  const id = useUid();
  const fingers = [[-34, -58, -44, -128], [-12, -66, -14, -150], [12, -66, 14, -146], [34, -58, 40, -120]];
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <defs><radialGradient id={`${id}-l`} cx="35%" cy="30%" r="80%"><stop offset="0%" stopColor={light(c, 0.35)} />
        <stop offset="60%" stopColor={c} /><stop offset="100%" stopColor={shade(c, 0.35)} /></radialGradient></defs>
      {fingers.map(([x1, y1, x2, y2], i) => <g key={i}>
        <path d={`M${x1} ${y1} L${x2} ${y2}`} stroke={line(c)} strokeWidth={34} strokeLinecap="round" />
        <path d={`M${x1} ${y1} L${x2} ${y2}`} stroke={`url(#${id}-l)`} strokeWidth={26} strokeLinecap="round" />
      </g>)}
      <path d="M-50 -20 L-92 -70" stroke={line(c)} strokeWidth={34} strokeLinecap="round" />
      <path d="M-50 -20 L-92 -70" stroke={`url(#${id}-l)`} strokeWidth={26} strokeLinecap="round" />
      <rect x={-56} y={-80} width={112} height={110} rx={40} fill={`url(#${id}-l)`} stroke={line(c)} strokeWidth={6} />
      {grease > 0 && <ellipse cx={4} cy={-30} rx={38} ry={30} fill="#3a2c26" opacity={grease * 0.6} />}
      <rect x={-52} y={22} width={104} height={56} rx={20} fill="#3f78c9" stroke={line('#3f78c9')} strokeWidth={6} />
      <path d="M-44 40 L44 40" stroke={light('#3f78c9', 0.5)} strokeWidth={6} strokeLinecap="round" opacity={0.7} />
    </g>
  );
};

/** A PEG on a wall with the pair of gloves hanging from it, swaying on `sway` */
export const GlovePeg: React.FC<{x: number; y: number; s?: number; sway?: number; grease?: number}> = ({x, y, s = 1, sway = 0, grease = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-16} y={-16} width={32} height={32} rx={10} fill="#8a93b8" stroke={line('#8a93b8')} strokeWidth={5} />
    <Tube x1={0} y1={0} x2={0} y2={28} w={12} c="#c8cfe0" />
    <g transform={`rotate(${sway * 9} 0 20)`}>
      <path d="M0 24 L-34 104 M0 24 L36 120" stroke="#3a3550" strokeWidth={7} strokeLinecap="round" fill="none" />
      <Glove x={-34} y={180} s={0.85} rot={180 - 6} grease={grease} />
      <Glove x={36} y={196} s={0.85} rot={180 + 8} grease={grease} />
    </g>
  </g>
);

/** A HAZARD TAG on a wire, red, or dashed and pale once it is the third that could go (`ghost` 0 to 1) */
export const HazardTag: React.FC<{x: number; y: number; s?: number; ghost?: number; fall?: number; swing?: number}> = ({
  x, y, s = 1, ghost = 0, fall = 0, swing = 0}) => {
  const c = '#ef4b4b';
  return (
    <g transform={`translate(${x} ${y + fall * 300}) rotate(${swing * 8 + fall * 40}) scale(${s})`} opacity={1 - fall * 0.8}>
      <path d="M0 -40 L0 0" stroke="#5a5f80" strokeWidth={5} strokeLinecap="round" />
      <rect x={-46} y={0} width={92} height={120} rx={22} fill={ghost > 0.5 ? 'none' : c} stroke={ghost > 0.5 ? '#ffd7d7' : line(c)}
        strokeWidth={ghost > 0.5 ? 6 : 6} strokeDasharray={ghost > 0.5 ? '14 10' : undefined} opacity={1 - ghost * 0.3} />
      {ghost <= 0.5 && <rect x={-36} y={8} width={30} height={60} rx={12} fill={light(c, 0.5)} opacity={0.45} />}
      <circle cx={0} cy={26} r={11} fill={ghost > 0.5 ? 'none' : '#fff4dc'} stroke={ghost > 0.5 ? '#ffd7d7' : 'none'} strokeWidth={4} />
      <path d="M0 52 L0 92" stroke={ghost > 0.5 ? '#ffd7d7' : '#fff4dc'} strokeWidth={12} strokeLinecap="round"
        strokeDasharray={ghost > 0.5 ? '8 8' : undefined} />
    </g>
  );
};

/** A sun (or day disc) that has crossed the sky `n` times, the day counter for six days of drilling */
export const SunTick: React.FC<{x: number; y: number; r?: number; on: number}> = ({x, y, r = 30, on}) => (
  <g transform={`translate(${x} ${y}) scale(${0.3 + 0.7 * clamp01(on)})`} opacity={clamp01(on * 1.5)}>
    <circle r={r} fill={on > 0.5 ? '#ffd45c' : '#6b6a9a'} stroke={line('#ffd45c')} strokeWidth={4} />
    <circle cx={-r * 0.3} cy={-r * 0.3} r={r * 0.35} fill="#fff6d0" opacity={on > 0.5 ? 0.7 : 0.15} />
  </g>
);

/**
 * THE UNDERGROUND CUTAWAY: the rig small on the surface, the earth in lit strata, the hole going down
 * and then turning sideways for two miles. `p` is how far the bit has gone along the lateral (0 to 1).
 */
export const Cutaway: React.FC<{frame: number; p: number; surfaceY?: number; rigX?: number; children?: React.ReactNode}> = ({
  frame, p, surfaceY = 760, rigX = 170, children}) => {
  const id = useUid();
  const strata = ['#c9925a', '#b4794a', '#9c6a52', '#83607a', '#6b5a8c', '#5a5596'];
  const bendY = 1180, latY = 1290, latX0 = rigX + 120, latX1 = 1010;
  const bx = lerp(latX0, latX1, clamp01(p));
  return (
    <g>
      <defs><linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5f8ff0" />
        <stop offset="100%" stopColor="#ffd9a8" /></linearGradient></defs>
      <rect x={-40} y={-40} width={1160} height={surfaceY + 40} fill={`url(#${id}-sky)`} />
      {strata.map((c, i) => {
        const y0 = surfaceY + i * 210;
        return <path key={i} d={`M-40 ${y0 + Math.sin(i * 1.7) * 18} C300 ${y0 + 30} 700 ${y0 - 26} 1120 ${y0 + Math.cos(i) * 20} L1120 2000 L-40 2000 Z`}
          fill={c} stroke={shade(c, 0.25)} strokeWidth={4} />;
      })}
      {/* the hole: down, a smooth bend, then the lateral as far as the bit */}
      <path d={`M${rigX} ${surfaceY} L${rigX} ${bendY - 60} Q${rigX} ${latY} ${latX0} ${latY} L${bx} ${latY}`} stroke="#2a1d3e" strokeWidth={26}
        fill="none" strokeLinecap="round" />
      <path d={`M${rigX} ${surfaceY} L${rigX} ${bendY - 60} Q${rigX} ${latY} ${latX0} ${latY} L${bx} ${latY}`} stroke="#ffd45c" strokeWidth={8}
        fill="none" strokeLinecap="round" strokeDasharray="2 18" strokeDashoffset={-frame * 2} />
      {/* cuttings streaming back along the hole behind the bit */}
      {Array.from({length: 14}, (_, i) => {
        const u = ((frame * 0.035 + i / 14) % 1);
        const x = bx - u * Math.max(60, bx - latX0);
        return <circle key={i} cx={x} cy={latY + Math.sin(i * 2.1 + frame / 6) * 9} r={7 - u * 4} fill="#ffe0a0" opacity={0.9 - u * 0.7} />;
      })}
      {[0, 1, 2].map((k) => <ellipse key={`r${k}`} cx={bx + 20} cy={latY} rx={40 + ((frame * 3 + k * 20) % 60)} ry={30 + ((frame * 3 + k * 20) % 60) * 0.6}
        fill="none" stroke="#ffcf6a" strokeWidth={4} opacity={0.5 - ((frame * 3 + k * 20) % 60) / 120} />)}
      {/* the bit, turning */}
      <g transform={`translate(${bx} ${latY})`}>
        <Glow x={0} y={0} r={90} color="#ffb84a" opacity={0.6} />
        <g transform={`rotate(${frame * 18})`}>
          {[0, 120, 240].map((a) => <circle key={a} cx={Math.cos(a * Math.PI / 180) * 16} cy={Math.sin(a * Math.PI / 180) * 16} r={16}
            fill="#e7ecf8" stroke={line('#9aa6c4')} strokeWidth={4} />)}
        </g>
        <circle r={10} fill="#4a4f6e" />
      </g>
      {children}
    </g>
  );
};

/** a small far derrick on the horizon, lit or dark, for the fleet shot */
export const FarDerrick: React.FC<{x: number; y: number; s?: number; lit?: number; frame: number; seed?: number}> = ({
  x, y, s = 1, lit = 0, frame, seed = 0}) => {
  const c = lit > 0.5 ? '#ffb84a' : '#c39a6c';
  const blink = (Math.floor(frame / 12) + seed) % 4 === 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ContactShadow x={0} y={4} w={160} opacity={0.3} />
      <path d="M-50 0 L-12 -300 L12 -300 L50 0" stroke={line(c)} strokeWidth={16} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M-50 0 L-12 -300 L12 -300 L50 0" stroke={c} strokeWidth={9} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {[0.25, 0.5, 0.75].map((k) => <path key={k} d={`M${-50 + 38 * k} ${-300 * k} L${50 - 38 * k} ${-300 * k}`} stroke={c} strokeWidth={6}
        strokeLinecap="round" />)}
      <rect x={-70} y={-60} width={140} height={60} rx={14} fill={shade(c, 0.2)} stroke={line(c)} strokeWidth={5} />
      {lit > 0 && <Glow x={0} y={-150} r={140} color="#ffcf6a" opacity={0.5 * lit} />}
      <circle cx={0} cy={-312} r={9} fill={blink ? '#ff5d5d' : '#7a2a3a'} />
      {lit > 0.5 && <g transform="translate(36 -40)"><circle r={18} fill={ORANGE} stroke={line(ORANGE)} strokeWidth={4} />
        <path d="M-6 -2 L-1 5 L8 -7" stroke="#fff" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>}
    </g>
  );
};

/** THE DOGHOUSE CONSOLE from inside: a desk, two big screens, a joystick, the window onto the floor behind */
export const Console: React.FC<{frame: number; y?: number; dial?: number; children?: React.ReactNode; screenA?: React.ReactNode;
  screenB?: React.ReactNode}> = ({frame, y = 1180, dial = 0, children, screenA, screenB}) => {
  const id = useUid();
  const flick = 0.9 + Math.sin(frame / 5) * 0.05;
  return (
    <g>
      <defs><linearGradient id={`${id}-d`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4f5a86" />
        <stop offset="100%" stopColor="#2c2f58" /></linearGradient></defs>
      {children}
      {[[90, y - 330, 400, 230, '#2a6f8f', screenA], [590, y - 330, 400, 230, '#2f7a5a', screenB]].map(([sx, sy, w, h, c, kids], i) => (
        <g key={i} transform={`translate(${sx} ${sy})`}>
          <rect x={-10} y={-10} width={(w as number) + 20} height={(h as number) + 20} rx={30} fill="#1b1d3a" stroke="#5b628f" strokeWidth={4} />
          <rect x={0} y={0} width={w as number} height={h as number} rx={22} fill={c as string} opacity={flick} />
          <g>{kids as React.ReactNode}</g>
          <rect x={0} y={0} width={w as number} height={(h as number) * 0.4} rx={22} fill="#ffffff" opacity={0.07} />
          <rect x={(w as number) / 2 - 20} y={(h as number) + 10} width={40} height={90} rx={14} fill="#3a3f66" />
        </g>
      ))}
      <rect x={-40} y={y - 40} width={1160} height={400} rx={40} fill={`url(#${id}-d)`} stroke={line('#4f5a86')} strokeWidth={6} />
      <path d={`M0 ${y - 22} L1080 ${y - 22}`} stroke={light('#4f5a86', 0.5)} strokeWidth={8} opacity={0.5} />
      {/* the dial */}
      <g transform={`translate(790 ${y + 40})`}>
        <circle r={56} fill="#2b2a44" stroke={line('#8a93b8')} strokeWidth={6} />
        <circle r={44} fill="#8a93b8" />
        <path d={`M0 0 L${Math.cos((-130 + dial * 260) * Math.PI / 180) * 38} ${Math.sin((-130 + dial * 260) * Math.PI / 180) * 38}`} stroke={ORANGE}
          strokeWidth={10} strokeLinecap="round" />
      </g>
      {/* the joystick */}
      <g transform={`translate(330 ${y + 30})`}>
        <ellipse cx={0} cy={10} rx={70} ry={22} fill="#2b2a44" />
        <Tube x1={0} y1={0} x2={Math.sin(frame / 25) * 10} y2={-90} w={20} c="#8a93b8" />
        <circle cx={Math.sin(frame / 25) * 10} cy={-96} r={26} fill="#ef4b4b" stroke={line('#ef4b4b')} strokeWidth={5} />
      </g>
    </g>
  );
};

/** a big counted number set in the house face, landed with a squash; `p` 0 to 1 is how far it has counted */
export const Big: React.FC<{x: number; y: number; text: string; size?: number; color?: string; p?: number; sub?: string}> = ({
  x, y, text, size = 200, color = '#fff4dc', p = 1, sub}) => {
  const k = clamp01(p);
  const sq = k < 1 ? 1 : 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${(0.6 + 0.4 * k) * sq})`} opacity={clamp01(k * 2)}>
      <text x={0} y={0} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={size} fill={line(color)} stroke={line(color)}
        strokeWidth={18} strokeLinejoin="round">{text}</text>
      <text x={0} y={0} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={size} fill={color}>{text}</text>
      {sub && <text x={0} y={size * 0.42} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={size * 0.24} fill={color}
        opacity={0.92}>{sub}</text>}
    </g>
  );
};
