import React from 'react';
import {Visor, type MachineMood} from '../../../look/machines';
import {ContactShadow, Glow, clamp01, ease, easeOutBack, lerp} from '../../../look/Kit';
import {line, light, shade} from '../../../look/color';
import {FONT} from '../../../lib/type';

/**
 * fetch-bag-1118 parts. Every drawing here is original and follows LOOK_V2: round corners, a key from the
 * upper left, shade toward violet, hue-tinted line, a contact shadow under anything that stands.
 */

const D2R = Math.PI / 180;

/** a lit tube between two points, the way every link and rail in this film is drawn */
export const Tube: React.FC<{x1: number; y1: number; x2: number; y2: number; w: number; c: string; op?: number}> = ({x1, y1, x2, y2, w, c, op = 1}) => (
  <g opacity={op}>
    <path d={`M${x1} ${y1} L${x2} ${y2}`} stroke={line(c)} strokeWidth={w + 10} strokeLinecap="round" />
    <path d={`M${x1} ${y1} L${x2} ${y2}`} stroke={c} strokeWidth={w} strokeLinecap="round" />
    <path d={`M${x1} ${y1} L${x2} ${y2}`} stroke={light(c, 0.6)} strokeWidth={Math.max(2, w * 0.22)} strokeLinecap="round" opacity={0.7}
      transform={`translate(${-w * 0.16} ${-w * 0.16})`} />
  </g>
);

/** bold text with a deep rim of its own hue, readable on bright and dark */
export const Word: React.FC<{x: number; y: number; t: string; size?: number; c?: string; anchor?: 'start' | 'middle' | 'end'; op?: number}> = ({
  x, y, t, size = 48, c = '#fff6e6', anchor = 'middle', op = 1}) => (
  <g opacity={op}>
    <text x={x} y={y} textAnchor={anchor} fontFamily={FONT.body} fontWeight={900} fontSize={size} fill={line(c)} stroke={line(c)}
      strokeWidth={size * 0.22} strokeLinejoin="round">{t}</text>
    <text x={x} y={y} textAnchor={anchor} fontFamily={FONT.body} fontWeight={900} fontSize={size} fill={c}>{t}</text>
  </g>
);

// ------------------------------------------------------------------------------------------- THE HERO

const ARM_L1 = 300, ARM_L2 = 270, SHOULDER = {x: 96, y: -400};

/** where the fetch arm's gripper is, in frame space, for its pose. `sh` and `el` are degrees: 0 hangs
 * straight down, 90 points forward (to the right when facing 1), 180 straight up. */
export const armHand = (x: number, y: number, s: number, sh: number, el: number, facing = 1) => {
  const ex = SHOULDER.x + Math.sin(sh * D2R) * ARM_L1, ey = SHOULDER.y + Math.cos(sh * D2R) * ARM_L1;
  const a = sh + el;
  const hx = ex + Math.sin(a * D2R) * ARM_L2, hy = ey + Math.cos(a * D2R) * ARM_L2;
  return {x: x + facing * hx * s, y: y + hy * s, ex: x + facing * ex * s, ey: y + ey * s, a};
};

/**
 * THE FETCH ARM. A white one-armed lab robot on a wheeled base, a rounded column, a head with the curious
 * visor face, and one arm off the shoulder ending in a two-finger gripper. Illustrative, not the real rig.
 * `wake` 0 to 1 unfolds it from a crouch, `grip` 0 open to 1 closed, `droop` slumps the head after a miss.
 */
export const FetchArm: React.FC<{x: number; y: number; s?: number; frame: number; sh?: number; el?: number; grip?: number; mood?: MachineMood;
  look?: number; facing?: number; wake?: number; droop?: number; glow?: number; chip?: number; note?: number; nod?: number; children?: React.ReactNode}> = ({
  x, y, s = 1, frame, sh = 30, el = 20, grip = 0.2, mood = 'happy', look = 0.4, facing = 1, wake = 1, droop = 0, glow = 0, chip = 0, note = 0,
  nod = 0, children}) => {
  const body = '#eef2f8', accent = '#2fb5c9', dark = '#3a4166';
  const crouch = 1 - wake;
  const breathe = Math.sin(frame / 22) * 4;
  const headY = -520 + crouch * 160 + breathe + droop * 26 + nod * 18;
  const shY = SHOULDER.y + crouch * 160 + breathe;
  const h = armHand(0, 0, 1, lerp(8, sh, wake), lerp(150, el, wake), 1);
  const ex = SHOULDER.x + Math.sin(lerp(8, sh, wake) * D2R) * ARM_L1, ey = shY + Math.cos(lerp(8, sh, wake) * D2R) * ARM_L1;
  const hx = h.x, hy = h.y + crouch * 160 + breathe;
  const g = 18 + (1 - grip) * 30;
  return (
    <g transform={`translate(${x} ${y}) scale(${facing * s} ${s})`}>
      <ContactShadow x={0} y={8} w={360} opacity={0.38} />
      {/* the wheeled base */}
      <rect x={-150} y={-90} width={300} height={80} rx={36} fill={dark} stroke={line(dark)} strokeWidth={7} />
      <rect x={-136} y={-84} width={272} height={20} rx={10} fill={light(dark, 0.4)} opacity={0.5} />
      {[-100, 100].map((wx) => <g key={wx}><circle cx={wx} cy={-10} r={30} fill="#262a44" stroke={line('#262a44')} strokeWidth={6} />
        <circle cx={wx} cy={-10} r={11} fill="#8a93b8" /></g>)}
      {/* the column, white and lit, with a teal band */}
      <path d={`M-70 -90 L-62 ${headY + 90} Q-60 ${headY + 60} 0 ${headY + 58} Q60 ${headY + 60} 62 ${headY + 90} L70 -90 Z`} fill={body}
        stroke={line(body)} strokeWidth={8} strokeLinejoin="round" />
      <path d={`M30 -90 L34 ${headY + 90}`} stroke={shade(body, 0.25)} strokeWidth={34} opacity={0.5} />
      <path d={`M-40 -96 L-36 ${headY + 96}`} stroke="#ffffff" strokeWidth={10} strokeLinecap="round" opacity={0.8} />
      <rect x={-68} y={-200} width={136} height={34} rx={14} fill={accent} stroke={line(accent)} strokeWidth={5} />
      
      {/* the head with its visor face */}
      <g transform={`rotate(${droop * 12 - nod * 6} 0 ${headY + 60})`}>
        <rect x={-120} y={headY - 80} width={240} height={150} rx={64} fill={body} stroke={line(body)} strokeWidth={8} />
        <rect x={-104} y={headY - 70} width={110} height={24} rx={12} fill="#ffffff" opacity={0.7} />
        <Visor x={0} y={headY} w={190} h={92} mood={mood} frame={frame} look={look} />
        <path d={`M60 ${headY - 80} L84 ${headY - 132}`} stroke={line(body)} strokeWidth={10} strokeLinecap="round" />
        <circle cx={86} cy={headY - 138} r={14} fill={glow > 0.3 ? '#7dffb0' : '#ff7a6a'} stroke={line('#ff7a6a')} strokeWidth={4} />
        {note > 0 && <g transform={`translate(-30 ${headY - 112}) rotate(-8) scale(${facing * easeOutBack(clamp01(note), 2)} ${easeOutBack(clamp01(note), 2)})`}>
          <rect x={-90} y={-46} width={180} height={92} rx={14} fill="#ffe36a" stroke={line('#ffe36a')} strokeWidth={5} />
          <text x={0} y={-6} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={24} fill="#5a4a10">PROOF OF</text>
          <text x={0} y={24} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={24} fill="#5a4a10">CONCEPT</text>
        </g>}
      </g>
      {/* the arm: upper link, elbow, forearm, wrist and gripper. Joined at every joint, never laid over */}
      <Tube x1={SHOULDER.x} y1={shY} x2={ex} y2={ey} w={62} c={body} />
      <Tube x1={ex} y1={ey} x2={hx} y2={hy} w={48} c={body} />
      <circle cx={SHOULDER.x} cy={shY} r={48} fill={body} stroke={line(body)} strokeWidth={7} />
      <circle cx={SHOULDER.x} cy={shY} r={22} fill={accent} />
      {chip > 0 && <g>
        <Glow x={SHOULDER.x} y={shY} r={140} color="#7dd8ff" opacity={0.55 * clamp01(chip)} />
        <rect x={SHOULDER.x - 26} y={shY - 26 - (1 - clamp01(chip)) * 160} width={52} height={52} rx={12} fill="#5b4bd6"
          stroke="#c8beff" strokeWidth={5} />
      </g>}
      <circle cx={ex} cy={ey} r={38} fill={body} stroke={line(body)} strokeWidth={7} />
      <circle cx={ex} cy={ey} r={16} fill={accent} />
      <g transform={`translate(${hx} ${hy}) rotate(${-h.a + 180})`}>
        <rect x={-42} y={-30} width={84} height={56} rx={22} fill={dark} stroke={line(dark)} strokeWidth={6} />
        {[-1, 1].map((sd) => <path key={sd} d={`M${sd * g} 20 L${sd * g} 74 Q${sd * g} 90 ${sd * (g - 14)} 92`} stroke={line('#b9c2da')}
          strokeWidth={22} strokeLinecap="round" fill="none" />)}
        {[-1, 1].map((sd) => <path key={`f${sd}`} d={`M${sd * g} 20 L${sd * g} 74 Q${sd * g} 90 ${sd * (g - 14)} 92`} stroke="#dfe5f2"
          strokeWidth={13} strokeLinecap="round" fill="none" />)}
      </g>
      {children && <g transform={`translate(${hx} ${hy + 96})`}>{children}</g>}
    </g>
  );
};

/** the gripper's frame position, for a bag drawn by the film rather than inside the arm */
export const fetchHand = (x: number, y: number, s: number, sh: number, el: number, facing = 1, wake = 1) => {
  const h = armHand(0, 0, 1, lerp(8, sh, wake), lerp(150, el, wake), 1);
  return {x: x + facing * h.x * s, y: y + (h.y + (1 - wake) * 160) * s};
};

/**
 * THE EYE. A camera on a tall tripod that stands across the room and watches the hand: the eye-to-hand
 * arrangement. Its lens is an eye with a lid that opens and blinks. `open` 0 to 1, `aim` degrees of tilt.
 */
export const EyeCam: React.FC<{x: number; y: number; s?: number; frame: number; open?: number; aim?: number; facing?: number}> = ({
  x, y, s = 1, frame, open = 1, aim = 0, facing = 1}) => {
  const body = '#33395e';
  const blink = (frame % 110) < 5 ? [0.2, 0.05, 0.05, 0.3, 0.7][frame % 110] : 1;
  const lid = clamp01(open) * blink;
  return (
    <g transform={`translate(${x} ${y}) scale(${facing * s} ${s})`}>
      <ContactShadow x={0} y={6} w={300} opacity={0.34} />
      {[-120, 0, 120].map((lx) => <Tube key={lx} x1={0} y1={-520} x2={lx} y2={0} w={14} c="#7d86a8" />)}
      <Tube x1={0} y1={-520} x2={0} y2={-640} w={26} c="#9aa3c4" />
      <g transform={`translate(0 -700) rotate(${aim})`}>
        <rect x={-110} y={-70} width={200} height={140} rx={46} fill={body} stroke={line(body)} strokeWidth={7} />
        <rect x={-96} y={-60} width={90} height={18} rx={9} fill={light(body, 0.5)} opacity={0.6} />
        <rect x={80} y={-56} width={70} height={112} rx={30} fill={shade(body, 0.2)} stroke={line(body)} strokeWidth={6} />
        <circle cx={150} cy={0} r={52} fill="#0f1230" stroke={line(body)} strokeWidth={7} />
        <g>
          <clipPath id="eyecam-lid"><ellipse cx={150} cy={0} rx={44} ry={44 * Math.max(0.06, lid)} /></clipPath>
          <g clipPath="url(#eyecam-lid)">
            <circle cx={150} cy={0} r={44} fill="#e9f8ff" />
            <circle cx={156} cy={0} r={24} fill="#2fb5c9" />
            <circle cx={158} cy={0} r={11} fill="#0c0e29" />
            <circle cx={148} cy={-10} r={7} fill="#ffffff" />
          </g>
        </g>
        <path d={`M110 ${-44 * lid - 6} Q150 ${-60 * lid - 10} 190 ${-44 * lid - 6}`} stroke={line(body)} strokeWidth={8} fill="none" strokeLinecap="round" />
        <circle cx={-80} cy={40} r={9} fill={(frame % 40) < 20 ? '#ff5d5d' : '#7a2b3a'} />
      </g>
    </g>
  );
};
export const eyeLens = (x: number, y: number, s: number, aim = 0, facing = 1) => ({
  x: x + facing * s * (Math.cos(aim * D2R) * 150), y: y + s * (-700 + Math.sin(aim * D2R) * 150)});

// -------------------------------------------------------------------------------------- THE THROUGHLINE

/**
 * THE RED MEDICAL BAG. A soft duffel with a white cross, a carry handle, a dent and a frayed strap end.
 * `open` 0 to 1 unzips it and a scanner rises out. `ghost` draws it as a blinking wireframe.
 */
export const MedBag: React.FC<{x: number; y: number; s?: number; rot?: number; open?: number; ghost?: boolean; op?: number; squash?: number}> = ({
  x, y, s = 1, rot = 0, open = 0, ghost = false, op = 1, squash = 0}) => {
  const red = '#e5383b';
  if (ghost) {
    return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={op}>
      <rect x={-130} y={-90} width={260} height={150} rx={50} fill="#7de3ff" fillOpacity={0.12} stroke="#9ff0ff" strokeWidth={6} strokeDasharray="16 10" />
      <path d="M-60 -90 Q0 -170 60 -90" stroke="#9ff0ff" strokeWidth={6} fill="none" strokeDasharray="12 8" />
      <path d="M-20 -30 h40 M0 -50 v40" stroke="#9ff0ff" strokeWidth={8} strokeLinecap="round" />
    </g>;
  }
  const o = clamp01(open);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * (1 + squash * 0.12)} ${s * (1 - squash * 0.16)})`} opacity={op}>
      <ContactShadow x={0} y={66} w={260} opacity={0.3} />
      {o > 0 && <g transform={`translate(0 ${-60 - o * 170}) scale(${1 + o * 0.25})`}>
        <rect x={-60} y={-60} width={120} height={90} rx={22} fill="#dfe7f5" stroke={line('#dfe7f5')} strokeWidth={6} />
        <rect x={-46} y={-48} width={92} height={50} rx={12} fill="#2b3a6b" />
        <path d="M-36 -24 q12 -16 24 0 t24 0 t24 0" stroke="#7dffb0" strokeWidth={5} fill="none" />
        <circle cx={0} cy={50} r={16} fill="#b9c2da" />
        <path d="M0 30 L0 80" stroke="#b9c2da" strokeWidth={10} strokeLinecap="round" />
      </g>}
      <path d="M-60 -82 Q0 -168 60 -82" stroke={line('#3a2a30')} strokeWidth={26} fill="none" strokeLinecap="round" />
      <path d="M-60 -82 Q0 -168 60 -82" stroke="#4a3a44" strokeWidth={14} fill="none" strokeLinecap="round" />
      <rect x={-140} y={-92} width={280} height={160} rx={58} fill={red} stroke={line(red)} strokeWidth={8} />
      <path d="M-126 -40 Q-130 40 -100 58" stroke={shade(red, 0.3)} strokeWidth={0} fill="none" />
      <rect x={-140} y={-10} width={280} height={78} rx={40} fill={shade(red, 0.22)} opacity={0.55} />
      <rect x={-120} y={-84} width={150} height={22} rx={11} fill={light(red, 0.5)} opacity={0.75} />
      {/* the zip, gaping when open */}
      <path d={`M-118 -70 Q0 ${-92 - o * 26} 118 -70`} stroke={o > 0 ? '#2a1418' : shade(red, 0.4)} strokeWidth={o > 0 ? 14 + o * 20 : 6} fill="none"
        strokeLinecap="round" />
      {o > 0 && <path d={`M-120 -76 Q0 ${-120 - o * 50} 120 -76 Q0 ${-50 + o * 10} -120 -76 Z`} fill="#2a1418" opacity={0.9} />}
      {o > 0 && [-1, 1].map((sd) => <path key={sd} d={`M${sd * 120} -76 Q${sd * 150} ${-130 - o * 30} ${sd * 60} ${-150 - o * 40}`} stroke={shade(red, 0.2)}
        strokeWidth={22} fill="none" strokeLinecap="round" />)}
      <rect x={-34} y={-30} width={68} height={68} rx={16} fill="#ffffff" />
      <path d="M-22 4 h44 M0 -18 v44" stroke={red} strokeWidth={14} strokeLinecap="round" />
      {/* a dent and the frayed strap end: maintained but worn */}
      <path d="M90 -20 q14 18 0 40" stroke={shade(red, 0.35)} strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d="M128 30 l26 18 m-20 -4 l10 14 m-2 -18 l16 8" stroke="#4a3a44" strokeWidth={6} strokeLinecap="round" />
    </g>
  );
};

// ------------------------------------------------------------------------------------------- THE PLACE

/** the lab's back wall at Johnson, Clear Lake: a high bay with a long window onto flat bayside ground,
 * water and low oaks (the gulf region, drawn here because the stage's plate shows a downtown skyline).
 * `v` picks what stands against the wall so no two setups look alike. */
export const LabWall: React.FC<{y: number; v: string; frame: number}> = ({y, v, frame}) => {
  if (v === 'none') return null;
  if (v === 'bay') {
    // the high bay with no window: deep blue walls, a gantry crane rail and hanging lights that glow
    return <g>
      <rect x={-60} y={-60} width={1200} height={y + 70} fill="#3a4a8a" />
      <rect x={-60} y={-60} width={1200} height={y + 70} fill="url(#bay-g)" />
      <defs><linearGradient id="bay-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#24306a" /><stop offset="1" stopColor="#5a6aa8" /></linearGradient></defs>
      {[0, 1, 2, 3, 4, 5].map((k) => <rect key={k} x={-40 + k * 210} y={-60} width={22} height={y + 70} fill="#2a3670" />)}
      <rect x={-60} y={240} width={1200} height={40} fill="#f5c02c" opacity={0.85} />
      {[180, 540, 900].map((lx) => <g key={lx}><path d={`M${lx} -60 L${lx} 420`} stroke="#1a2350" strokeWidth={6} />
        <path d={`M${lx - 70} 470 Q${lx} 400 ${lx + 70} 470 Z`} fill="#c9d0e0" />
        <ellipse cx={lx} cy={480} rx={60} ry={14} fill="#fff6d0" />
        <path d={`M${lx - 60} 480 L${lx - 220} ${y} L${lx + 220} ${y} L${lx + 60} 480 Z`} fill="#fff6d0" opacity={0.08 + 0.02 * Math.sin(frame / 20 + lx)} /></g>)}
      <rect x={-60} y={y - 60} width={1200} height={60} fill="#2a3670" />
    </g>;
  }
  const wall = v === 'door' ? '#d9dcef' : v === 'bench' ? '#e6e1f2' : v === 'banner' ? '#dfe8f2' : '#e4e8f4';
  const wy = Math.min(y - 360, 560), wh = 230;
  return (
    <g>
      <rect x={-60} y={-60} width={1200} height={y + 70} fill={wall} />
      {[0, 1, 2, 3, 4].map((k) => <rect key={k} x={-40 + k * 250} y={-60} width={16} height={y + 70} fill={shade(wall, 0.12)} />)}
      <rect x={-60} y={y - 60} width={1200} height={60} fill={shade(wall, 0.18)} />
      {/* the long window: big Gulf sky, flat green ground, a strip of bay water, low oaks and a low campus building */}
      <g>
        <clipPath id={`labwin-${v}`}><rect x={40} y={wy} width={1000} height={wh} rx={30} /></clipPath>
        <g clipPath={`url(#labwin-${v})`}>
          <rect x={40} y={wy} width={1000} height={wh} fill="#cfe4ee" />
          <rect x={40} y={wy} width={1000} height={wh * 0.45} fill="#b4d6ea" />
          <ellipse cx={240 + ((frame * 0.3) % 300)} cy={wy + 40} rx={120} ry={20} fill="#ffffff" opacity={0.6} />
          {/* flat coastal prairie, a bayou edge with marsh grass, live oaks spreading low, a big arched hangar in the haze */}
          <rect x={40} y={wy + wh * 0.6} width={1000} height={wh} fill="#9fb86a" />
          <path d={`M640 ${wy + wh * 0.62} L640 ${wy + wh * 0.3} Q760 ${wy + wh * 0.12} 880 ${wy + wh * 0.3} L880 ${wy + wh * 0.62} Z`} fill="#d8dce6" opacity={0.85} />
          <rect x={700} y={wy + wh * 0.44} width={120} height={wh * 0.18} fill="#b9bfd0" />
          <path d={`M40 ${wy + wh * 0.76} Q300 ${wy + wh * 0.72} 560 ${wy + wh * 0.78} T1040 ${wy + wh * 0.74} L1040 ${wy + wh * 0.84} L40 ${wy + wh * 0.84} Z`} fill="#6f9bb0" />
          {Array.from({length: 26}, (_, k) => <path key={k} d={`M${50 + k * 38} ${wy + wh * 0.86} l${(k % 3) - 1} -18`} stroke="#7d9a4a" strokeWidth={4} />)}
          {[150, 400, 980].map((tx, k) => <g key={tx}><path d={`M${tx} ${wy + wh * 0.62} Q${tx - 6} ${wy + wh * 0.5} ${tx - 30} ${wy + wh * 0.44}`} stroke="#5a4636" strokeWidth={9} fill="none" />
            <ellipse cx={tx - 20} cy={wy + wh * 0.42} rx={110 + k * 10} ry={30} fill="#5d7d44" />
            <ellipse cx={tx + 30} cy={wy + wh * 0.46} rx={70} ry={20} fill="#6b8c4e" /></g>)}
          <rect x={40} y={wy} width={1000} height={wh} fill="#e8eef2" opacity={0.25} />
        </g>
        <rect x={40} y={wy} width={1000} height={wh} rx={30} fill="none" stroke="#9aa3bd" strokeWidth={14} />
        {[373, 706].map((mx) => <rect key={mx} x={mx} y={wy} width={10} height={wh} fill="#9aa3bd" />)}
      </g>
      {v === 'hull' && <g>
        <path d={`M600 ${y} L600 ${wy + 120} Q820 ${wy + 20} 1140 ${wy + 110} L1140 ${y} Z`} fill="#f1f4fa" stroke={line('#f1f4fa')} strokeWidth={8} />
        <circle cx={880} cy={wy + 260} r={70} fill="#c9d0e0" /><circle cx={880} cy={wy + 260} r={54} fill="#2b2f4a" />
      </g>}
      {v === 'door' && <g>
        <rect x={560} y={wy - 40} width={480} height={y - wy + 40} rx={20} fill="#b9bfd6" stroke={line('#b9bfd6')} strokeWidth={8} />
        <rect x={580} y={wy + 120} width={440} height={y - wy - 120} fill="#d8b98a" />
        {[0, 1, 2, 3].map((k) => <ellipse key={k} cx={640 + k * 110} cy={y - 40 - (k % 2) * 30} rx={50} ry={30} fill="#a8875e" />)}
        {Array.from({length: 6}, (_, k) => <rect key={k} x={560} y={wy - 40 + k * 24} width={480} height={10} fill={shade('#b9bfd6', 0.15)} />)}
        <text x={800} y={wy + 170} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={28} fill="#6b5040">ROCK YARD</text>
      </g>}
      {v === 'bench' && <g>
        <rect x={60} y={y - 330} width={520} height={250} rx={24} fill="#c8b48a" stroke={line('#c8b48a')} strokeWidth={6} />
        {Array.from({length: 24}, (_, k) => <circle key={k} cx={100 + (k % 8) * 60} cy={y - 290 + Math.floor(k / 8) * 60} r={6} fill="#8a7450" />)}
        <path d={`M140 ${y - 300} l0 90 M260 ${y - 300} q30 40 0 90 M380 ${y - 300} l40 90`} stroke="#4a5180" strokeWidth={14} strokeLinecap="round" fill="none" />
        <rect x={40} y={y - 80} width={600} height={30} rx={12} fill="#8a6644" />
      </g>}
      {v === 'banner' && <g>
        <rect x={180} y={wy + wh + 40} width={720} height={120} rx={46} fill="#1d3b8a" stroke={line('#1d3b8a')} strokeWidth={8} />
        <text x={540} y={wy + wh + 118} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={60} fill="#ffffff">iMETRO</text>
      </g>}
    </g>
  );
};

/** the lab floor: grey epoxy with yellow tape, a cable run, the line where the wall meets it, and the wall */
export const LabFloor: React.FC<{y?: number; tint?: string; v?: string; frame?: number}> = ({y = 1180, tint = '#8d93b0', v = 'plain', frame = 0}) => (
  <g>
    <LabWall y={y} v={v} frame={frame} />
    <path d={`M-60 ${y} L1140 ${y} L1140 1980 L-60 1980 Z`} fill={tint} />
    <path d={`M-60 ${y} L1140 ${y} L1140 ${y + 220} L-60 ${y + 220} Z`} fill={light(tint, 0.18)} opacity={0.6} />
    <path d={`M-60 ${y} L1140 ${y}`} stroke={shade(tint, 0.35)} strokeWidth={12} />
    <path d={`M80 1980 L300 ${y}`} stroke="#f5c02c" strokeWidth={22} opacity={0.85} />
    <path d={`M1000 1980 L780 ${y}`} stroke="#f5c02c" strokeWidth={22} opacity={0.85} />
    <path d={`M-60 ${y + 300} Q300 ${y + 270} 520 ${y + 340} T1140 ${y + 310}`} stroke="#2b2f4a" strokeWidth={12} fill="none" opacity={0.6} />
  </g>
);

/** the habitat mockup's inner wall: curved white ribs, a teal handrail and a porthole that shows Mars.
 * In the mockup the porthole is a painted panel, which `painted` reveals with a seam and a peeling corner. */
export const HabWall: React.FC<{frame: number; port?: {x: number; y: number; r: number}; painted?: number; dim?: number}> = ({
  frame, port = {x: 760, y: 640, r: 210}, painted = 0, dim = 0}) => {
  const wall = '#e8edf5';
  return (
    <g>
      <rect x={-60} y={-60} width={1200} height={2040} fill={wall} />
      <rect x={-60} y={-60} width={1200} height={2040} fill="#3a3a8a" opacity={0.12 + dim * 0.3} />
      {[0, 1, 2, 3].map((k) => <path key={k} d={`M${-40 + k * 330} -60 Q${60 + k * 330} 900 ${-40 + k * 330} 1980`} stroke={shade(wall, 0.18)}
        strokeWidth={26} fill="none" opacity={0.7} />)}
      {[0, 1, 2, 3].map((k) => <path key={`h${k}`} d={`M${-28 + k * 330} -60 Q${72 + k * 330} 900 ${-28 + k * 330} 1980`} stroke="#ffffff"
        strokeWidth={6} fill="none" opacity={0.8} />)}
      <Tube x1={-60} y1={1060} x2={1140} y2={1040} w={22} c="#2fb5c9" />
      {/* the porthole */}
      <circle cx={port.x} cy={port.y} r={port.r + 34} fill="#c9d0e0" stroke={line('#c9d0e0')} strokeWidth={8} />
      <clipPath id="hab-port"><circle cx={port.x} cy={port.y} r={port.r} /></clipPath>
      <g clipPath="url(#hab-port)">
        <rect x={port.x - port.r} y={port.y - port.r} width={port.r * 2} height={port.r * 2} fill="#f2a46a" />
        <rect x={port.x - port.r} y={port.y - port.r} width={port.r * 2} height={port.r * 1.1} fill="#e98a5a" />
        <path d={`M${port.x - port.r} ${port.y + 40} Q${port.x - 60} ${port.y - 30} ${port.x + 40} ${port.y + 20} T${port.x + port.r} ${port.y}
          L${port.x + port.r} ${port.y + port.r} L${port.x - port.r} ${port.y + port.r} Z`} fill="#c2552f" />
        <path d={`M${port.x - port.r} ${port.y + 110} Q${port.x} ${port.y + 70} ${port.x + port.r} ${port.y + 120} L${port.x + port.r} ${port.y + port.r}
          L${port.x - port.r} ${port.y + port.r} Z`} fill="#9e3f25" />
        <circle cx={port.x + 90} cy={port.y - 100} r={22} fill="#fff1d6" opacity={0.9} />
        {painted > 0 && <g opacity={clamp01(painted)}>
          <path d={`M${port.x - port.r} ${port.y - 10} L${port.x + port.r} ${port.y + 6}`} stroke="#8a5a40" strokeWidth={4} strokeDasharray="10 8" />
          <path d={`M${port.x + port.r - 90} ${port.y - port.r + 10} l80 0 l0 80 Z`} fill="#f4ead2" stroke="#b89a70" strokeWidth={4} />
        </g>}
      </g>
      <circle cx={port.x} cy={port.y} r={port.r} fill="none" stroke="#ffffff" strokeWidth={8} opacity={0.5} />
      <path d={`M${port.x - port.r * 0.6} ${port.y - port.r * 0.6} Q${port.x - port.r * 0.2} ${port.y - port.r * 0.9} ${port.x + port.r * 0.2} ${port.y - port.r * 0.8}`}
        stroke="#ffffff" strokeWidth={14} strokeLinecap="round" fill="none" opacity={0.35} />
      <circle cx={140} cy={180} r={10} fill={(frame % 60) < 30 ? '#7dffb0' : '#2f6a52'} />
    </g>
  );
};

/** a storage locker with a high shelf, where the bag starts out of reach */
export const Locker: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => {
  const c = '#cfd6e6';
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ContactShadow x={0} y={6} w={360} opacity={0.3} />
    <rect x={-170} y={-900} width={340} height={900} rx={34} fill={c} stroke={line(c)} strokeWidth={8} />
    <rect x={-152} y={-884} width={60} height={860} rx={20} fill="#ffffff" opacity={0.5} />
    {[-640, -380].map((sy) => <rect key={sy} x={-160} y={sy} width={320} height={22} rx={10} fill={shade(c, 0.25)} />)}
    <rect x={-130} y={-340} width={260} height={300} rx={24} fill={shade(c, 0.1)} stroke={line(c)} strokeWidth={5} />
    <circle cx={100} cy={-190} r={14} fill="#7d86a8" />
  </g>;
};

// ---------------------------------------------------------------------------------------------- SPACE

/** deep space with stars that twinkle from the frame clock, never at random */
export const Space: React.FC<{frame: number}> = ({frame}) => (
  <g>
    <defs><linearGradient id="space-g" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stopColor="#1a1452" /><stop offset="0.6" stopColor="#2b1d6b" />
      <stop offset="1" stopColor="#4a2a6e" /></linearGradient></defs>
    <rect x={-60} y={-60} width={1200} height={2040} fill="url(#space-g)" />
    {Array.from({length: 70}, (_, i) => {
      const sx = (i * 397) % 1080, sy = (i * 761) % 1920, r = 2 + (i % 4);
      return <circle key={i} cx={sx} cy={sy} r={r} fill="#fff6e6" opacity={0.35 + 0.4 * (0.5 + 0.5 * Math.sin(frame / 14 + i))} />;
    })}
  </g>
);

export const Planet: React.FC<{x: number; y: number; r: number; kind: 'earth' | 'mars'; frame: number}> = ({x, y, r, kind, frame}) => {
  const base = kind === 'earth' ? '#3b82f6' : '#e4733f';
  const id = `planet-${kind}-${Math.round(x)}`;
  return <g>
    <Glow x={x} y={y} r={r * 1.8} color={kind === 'earth' ? '#7dd8ff' : '#ffb07a'} opacity={0.45} />
    <defs><radialGradient id={id} cx="0.32" cy="0.3" r="0.8"><stop offset="0" stopColor={light(base, 0.45)} /><stop offset="0.6" stopColor={base} />
      <stop offset="1" stopColor={shade(base, 0.45)} /></radialGradient>
      <clipPath id={`${id}-c`}><circle cx={x} cy={y} r={r} /></clipPath></defs>
    <circle cx={x} cy={y} r={r} fill={`url(#${id})`} stroke={line(base)} strokeWidth={6} />
    <g clipPath={`url(#${id}-c)`}>
      {kind === 'earth'
        ? [0, 1, 2].map((k) => <ellipse key={k} cx={x - r * 0.3 + k * r * 0.45 + ((frame * 0.4) % (r * 0.5))} cy={y - r * 0.2 + k * r * 0.3} rx={r * 0.32} ry={r * 0.18}
          fill="#4caf6a" opacity={0.9} />)
        : [0, 1].map((k) => <ellipse key={k} cx={x - r * 0.2 + k * r * 0.5} cy={y + r * 0.1 - k * r * 0.35} rx={r * 0.26} ry={r * 0.12} fill="#b5502c" opacity={0.7} />)}
      {kind === 'earth' && <ellipse cx={x + r * 0.1} cy={y - r * 0.55} rx={r * 0.5} ry={r * 0.12} fill="#ffffff" opacity={0.6} />}
    </g>
  </g>;
};

/** the call for help as a speech bubble with a face of radio waves */
export const Bubble: React.FC<{x: number; y: number; s?: number; t: string; frame: number; c?: string}> = ({x, y, s = 1, t, frame, c = '#fff6e6'}) => (
  <g transform={`translate(${x} ${y + Math.sin(frame / 9) * 6}) scale(${s})`}>
    <path d="M-120 -60 Q-120 -110 -70 -110 L70 -110 Q120 -110 120 -60 L120 10 Q120 60 70 60 L-20 60 L-60 100 L-56 60 L-70 60 Q-120 60 -120 10 Z"
      fill={c} stroke={line(c)} strokeWidth={7} strokeLinejoin="round" />
    <text x={0} y={-12} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={46} fill="#3a2a6e">{t}</text>
    {[0, 1, 2].map((k) => <path key={k} d={`M${136 + k * 22} -70 q16 30 0 60`} stroke="#9ff0ff" strokeWidth={6} fill="none" strokeLinecap="round"
      opacity={0.3 + 0.7 * ((Math.sin(frame / 6 - k) + 1) / 2)} />)}
  </g>
);

/** a clock ring: a full circle whose sweep fills from 0 to `p` */
export const ClockRing: React.FC<{x: number; y: number; r: number; p: number; c?: string}> = ({x, y, r, p, c = '#ffd24a'}) => {
  const a = clamp01(p) * 359.9 * D2R;
  const ex = x + Math.sin(a) * r, ey = y - Math.cos(a) * r;
  return <g>
    <circle cx={x} cy={y} r={r} stroke="#ffffff" strokeOpacity={0.22} strokeWidth={18} fill="none" />
    {p > 0 && <path d={`M${x} ${y - r} A${r} ${r} 0 ${a > Math.PI ? 1 : 0} 1 ${ex} ${ey}`} stroke={c} strokeWidth={18} fill="none" strokeLinecap="round" />}
    <path d={`M${x} ${y} L${x + Math.sin(a) * r * 0.7} ${y - Math.cos(a) * r * 0.7}`} stroke={c} strokeWidth={10} strokeLinecap="round" />
    <circle cx={x} cy={y} r={12} fill={c} />
  </g>;
};

/** a small rounded computer box with a power gauge */
export const EdgeBox: React.FC<{x: number; y: number; w: number; on?: number; gauge?: number; frame: number}> = ({x, y, w, on = 0, gauge = 1, frame}) => {
  const c = '#4a5180', h = w * 0.62;
  return <g transform={`translate(${x} ${y})`}>
    <ContactShadow x={0} y={4} w={w * 1.1} opacity={0.3} />
    {on > 0 && <Glow x={0} y={-h / 2} r={w * 1.2} color="#7dffb0" opacity={0.5 * on} />}
    <rect x={-w / 2} y={-h} width={w} height={h} rx={w * 0.16} fill={c} stroke={line(c)} strokeWidth={5} />
    <rect x={-w / 2 + 8} y={-h + 8} width={w * 0.5} height={h * 0.16} rx={6} fill={light(c, 0.5)} opacity={0.6} />
    <circle cx={w * 0.3} cy={-h * 0.3} r={Math.max(5, w * 0.06)} fill={on > 0.5 ? '#7dffb0' : (frame % 50 < 25 ? '#ff8a6a' : '#7a3b3a')} />
    <rect x={-w * 0.36} y={-h * 0.38} width={w * 0.44} height={h * 0.14} rx={4} fill="#262a44" />
    <rect x={-w * 0.36} y={-h * 0.38} width={w * 0.44 * clamp01(gauge)} height={h * 0.14} rx={4} fill="#7dffb0" />
  </g>;
};

/** an hourglass that flips and drains */
export const Hourglass: React.FC<{x: number; y: number; s?: number; p: number; flip: number}> = ({x, y, s = 1, p, flip}) => {
  const sand = '#ffcf6a', glass = '#cfeaff';
  const top = 1 - clamp01(p);
  return <g transform={`translate(${x} ${y}) rotate(${(1 - easeOutBack(clamp01(flip), 1.4)) * 180}) scale(${s})`}>
    <rect x={-120} y={-200} width={240} height={30} rx={14} fill="#8a5a3a" stroke={line('#8a5a3a')} strokeWidth={6} />
    <rect x={-120} y={170} width={240} height={30} rx={14} fill="#8a5a3a" stroke={line('#8a5a3a')} strokeWidth={6} />
    <path d="M-90 -170 Q-90 -40 -14 0 Q-90 40 -90 170 L90 170 Q90 40 14 0 Q90 -40 90 -170 Z" fill={glass} fillOpacity={0.35} stroke="#ffffff" strokeWidth={6} />
    <path d={`M${-70 * top - 10} ${-30 - 110 * top} L${70 * top + 10} ${-30 - 110 * top} L14 -10 L-14 -10 Z`} fill={sand} opacity={top > 0.02 ? 1 : 0} />
    <path d={`M-80 168 Q0 ${168 - 130 * clamp01(p)} 80 168 Z`} fill={sand} />
    {p > 0 && p < 1 && <path d="M0 -4 L0 160" stroke={sand} strokeWidth={6} />}
  </g>;
};

/** a mission board badge with a big initial, slammed on with a wobble */
export const Badge: React.FC<{x: number; y: number; t: string; sub: string; c: string; p: number}> = ({x, y, t, sub, c, p}) => {
  if (p <= 0) return null;
  const k = easeOutBack(clamp01(p * 1.6), 2.2);
  const wob = Math.sin(p * 18) * 6 * Math.exp(-p * 5);
  return <g transform={`translate(${x} ${y}) rotate(${wob}) scale(${k})`}>
    <rect x={-170} y={-120} width={340} height={240} rx={48} fill={c} stroke={line(c)} strokeWidth={8} />
    <rect x={-150} y={-104} width={200} height={26} rx={13} fill="#ffffff" opacity={0.35} />
    <text x={0} y={18} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={84} fill="#ffffff">{t}</text>
    <text x={0} y={78} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={28} fill="#ffffff" opacity={0.92}>{sub}</text>
  </g>;
};

/** the eased progress of a window that has opened `since` seconds ago over `dur` */
export const after = (since: number, dur: number) => (since < 0 ? 0 : ease(since / dur));
