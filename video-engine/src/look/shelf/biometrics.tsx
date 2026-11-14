import React from 'react';
import {Easing, interpolate} from 'remotion';
import {light, line, mix, shade} from '../color';
import {Figure, figureHands} from '../Figure';
import {ContactShadow, Glow, useUid} from '../Kit';
import {CL, ClBlur, ClFace, ClGlass, ClLit, ClPill, ClTxt, clOw, clRR} from './clinic';

/**
 * BIOMETRICS, LOOK V2 (November 14th, 2026).
 *
 * The Progreso border test from lib/biometrics.tsx, redrawn in the v2 idiom. The timber pergola walkway
 * with its strip lights, the freestanding camera columns, the traveler walking through, the capture
 * frame and its tile, the source document, the three human factors, the capture zone, the suitability
 * step, the metrics the article leaves open, the capture and opt-out lanes and the decision track.
 *
 * The library's geometry came from the agency photographs, so every position, path and timing is kept
 * (the same `phase` easing, the same walker equation the capture lock follows). What changes is the
 * look. Rounded and lit forms with hue-tinted outlines, glass panels that glow where the story points,
 * a walkway that goes from afternoon to a warm strip lit night, and camera columns that now reach the
 * ground they cast a shadow on (the library's stood half a metre above theirs).
 *
 * The traveler is a v2 Figure on the attached rig, holding an amber folder, so no limb floats. The
 * capture tile shows a friendly nobody (`ClFace`), never a person.
 *
 * Screen units, the library's own 1080 by 1920 frame. Line work is computed from `scale` so it reads
 * about 6.8 film pixels at any size.
 */
const B = {
  night: '#121a44', deep: '#1d2a5e', glass: '#1f2f66', teal: '#3ee0d0', amber: CL.amber, coral: CL.coral, violet: CL.violet,
  blue: CL.blue, paper: '#fff6e6', wood: '#c98a4e', woodLight: '#e8b77c', rail: '#34397a', leaf: '#4fae6a', skin: '#c98a5a',
  shirt: '#2f8fa8', pants: '#2c3e66', folder: '#ffa94d',
};
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const phase = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {
  extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.2, 0.8, 0.2, 1),
});
type P = {
  x?: number; y?: number; scale?: number; frame?: number; progress?: number; mode?: string; label?: string; night?: boolean;
  active?: boolean; carry?: string; items?: string[]; rows?: string[]; date?: string; status?: string; place?: string; next?: string;
  capture?: string; optout?: string; stage?: string; selected?: boolean; actor?: string;
};
/** a polygon with every corner rounded by a quadratic */
const roundPoly = (pts: [number, number][], r: number) => {
  const n = pts.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
    const l0 = Math.hypot(p0[0] - p1[0], p0[1] - p1[1]) || 1, l2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) || 1;
    const k0 = Math.min(r / l0, 0.5), k2 = Math.min(r / l2, 0.5);
    const a = [p1[0] + (p0[0] - p1[0]) * k0, p1[1] + (p0[1] - p1[1]) * k0], b = [p1[0] + (p2[0] - p1[0]) * k2, p1[1] + (p2[1] - p1[1]) * k2];
    d += `${i === 0 ? 'M' : 'L'}${a[0].toFixed(1)} ${a[1].toFixed(1)} Q${p1[0]} ${p1[1]} ${b[0].toFixed(1)} ${b[1].toFixed(1)} `;
  }
  return d + 'Z';
};

/** the folder a traveler carries, drawn in figure space */
const Folder: React.FC = () => (
  <g transform="rotate(-8)">
    <rect x={-46} y={-62} width={92} height={118} rx={16} fill={line(B.folder)} />
    <rect x={-40} y={-56} width={80} height={106} rx={12} fill={B.folder} />
    <rect x={-40} y={-56} width={80} height={30} rx={12} fill={light(B.folder, 0.35)} />
    <rect x={-26} y={-6} width={52} height={8} rx={4} fill="#ffffff" opacity={0.7} />
  </g>
);

/**
 * THE TRAVELER, a v2 Figure in the library walker's colours, walking on `frame`. Library walker space
 * (feet at x, y and about 300 units tall at s 1), so it stands where the glyph stood.
 */
const Traveler: React.FC<{x: number; y: number; s?: number; frame: number; umbrella?: number; glasses?: boolean; hat?: boolean;
  opacity?: number}> = ({x, y, s = 1, frame, umbrella = 0, glasses = false, hat = false, opacity = 1}) => {
  const fs = s * 0.52;
  const up = umbrella > 0;
  const hand = figureHands('raise').r;
  const sway = Math.sin(frame / 12) * 3;
  return (
    <g opacity={opacity}>
      <Figure frame={frame} x={x} y={y} scale={fs} walk={frame / 50} pose={up ? 'raise' : 'hold'} fromPose="hold" poseBlend={up ? umbrella : 1}
        holding={<Folder />} emotion="neutral" skin={B.skin} hair="short" hairColor="#20140e" hat={hat ? 'straw' : 'none'} hatColor="#ecc66e"
        top="jacket" shirt={B.shirt} pants={B.pants} glasses={glasses} seed={3} />
      {up && <g transform={`translate(${x + hand.x * fs} ${y + hand.y * fs}) scale(${fs}) rotate(${sway})`} opacity={clamp(umbrella * 1.5)}>
        <path d="M0 0 V-150" stroke={line('#5a5f8a')} strokeWidth={14} strokeLinecap="round" />
        <path d="M0 0 V-150" stroke="#8a90b0" strokeWidth={8} strokeLinecap="round" />
        <path d="M-210 -140 Q0 -330 210 -140 Q160 -172 105 -140 Q52 -172 0 -140 Q-52 -172 -105 -140 Q-160 -172 -210 -140 Z" fill={B.blue}
          stroke={line(B.blue)} strokeWidth={12} strokeLinejoin="round" />
        <path d="M-150 -190 Q-60 -280 40 -268" stroke="#ffffff" strokeWidth={16} strokeLinecap="round" fill="none" opacity={0.4} />
        <path d="M0 -150 Q0 -250 0 -262" stroke={line(B.blue)} strokeWidth={6} />
        <circle cx={0} cy={-268} r={10} fill={line(B.blue)} />
      </g>}
    </g>
  );
};

// ============================================================================ the walkway

/** THE PERGOLA WALKWAY. A weathered timber pergola over a concrete walk between planted beds, strip lights
 * under each beam, the black rail on the left. `night` and the `dim` and `exit` modes are after dark,
 * `wireframe` crosses from the afternoon into the night test as it plays and traces the walk in cyan. */
export const PergolaWalkwayV2: React.FC<P> = ({x = 0, y = 0, scale = 1, frame = 0, night = false, mode = 'approach'}) => {
  const id = useUid();
  const ow = clOw(scale);
  const dayNight = mode === 'wireframe';
  const dark = !dayNight && (night || mode === 'dim' || mode === 'exit');
  const nightMix = dayNight ? phase(frame, 54, 104) : dark ? 1 : 0;
  const glow = 0.7 + 0.25 * Math.sin(frame / 9);
  const wire = mode === 'wireframe';
  const sk = (d: string, n: string) => mix(d, n, nightMix);
  const shrubs: [number, number, number][] = [[1030, 760, 96], [1160, 800, 128], [940, 700, 70], [115, 730, 92], [230, 690, 64], [-20, 780, 110]];
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={sk('#7cc4ff', '#0d1440')} />
          <stop offset="100%" stopColor={sk('#ffe2b8', '#3a2c78')} /></linearGradient>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={sk('#8cc070', '#1f3d4c')} />
          <stop offset="100%" stopColor={sk('#4f8f58', '#10283a')} /></linearGradient>
        <linearGradient id={`${id}-p`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={sk('#f3e6cc', '#6a7aa8')} />
          <stop offset="100%" stopColor={sk('#d6bf98', '#3f4c78')} /></linearGradient>
        <linearGradient id={`${id}-m`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={sk('#c47a4a', '#3a3456')} />
          <stop offset="100%" stopColor={sk('#8a4f30', '#221e3c')} /></linearGradient>
        <radialGradient id={`${id}-leaf`} cx="35%" cy="28%" r="80%"><stop offset="0%" stopColor={sk(light(B.leaf, 0.4), '#3f8a7a')} />
          <stop offset="60%" stopColor={sk(B.leaf, '#25564e')} /><stop offset="100%" stopColor={sk(shade(B.leaf, 0.4), '#142c34')} /></radialGradient>
        <ClBlur id={`${id}-b`} sd={10} user /><ClBlur id={`${id}-bb`} sd={30} />
      </defs>
      <rect x={-260} y={-220} width={1600} height={2380} fill={`url(#${id}-sky)`} />
      {nightMix > 0 && Array.from({length: 26}, (_, i) => <circle key={i} cx={(i * 197) % 1500 - 200} cy={-180 + ((i * 131) % 720)} r={3 + (i % 3)}
        fill="#fff6d8" opacity={nightMix * (0.5 + 0.5 * Math.sin(frame / 10 + i))} />)}
      {nightMix < 1 && <Glow x={860} y={300} r={420} color="#fff3c4" opacity={0.7 * (1 - nightMix)} />}
      <rect x={-260} y={565} width={1600} height={1595} fill={`url(#${id}-g)`} />
      <path d="M760 1920 L575 570 L820 620 L1340 1920 Z" fill={`url(#${id}-m)`} />
      <path d="M-260 1920 L390 1920 L505 570 L300 620 Z" fill={sk('#5aa070', '#183d40')} />
      <path d="M390 1920 L505 570 L575 570 L760 1920 Z" fill={`url(#${id}-p)`} stroke={line(sk('#d6bf98', '#3f4c78'))} strokeWidth={ow * 1.4}
        strokeLinejoin="round" />
      {Array.from({length: 7}, (_, i) => {
        const t = (i + 0.5) / 7, yy = 620 + t * t * 1210, l = 506 - t * 120, r = 572 + t * 190;
        return <path key={i} d={`M${l} ${yy} L${r} ${yy}`} stroke={sk('#c9ae82', '#34406a')} strokeWidth={2 + t * 4} strokeLinecap="round" opacity={0.6} />;
      })}
      {/* shrubs in the planted beds, swaying */}
      {shrubs.map(([cx, cy, r], i) => {
        const sw = Math.sin(frame / 30 * 1.2 + i) * 3;
        const blobs = [[-0.5, 0.1, 0.62], [0, -0.25, 0.8], [0.5, 0.05, 0.66], [0.05, 0.2, 0.7]];
        return <g key={i} transform={`translate(${cx + sw} ${cy})`}>
          <ellipse cx={0} cy={r * 0.62} rx={r * 1.2} ry={r * 0.22} fill="#1a1236" opacity={0.25} />
          {blobs.map(([a, b, k], j) => <circle key={`o${j}`} cx={a * r} cy={b * r} r={k * r + ow} fill={line(B.leaf)} />)}
          {blobs.map(([a, b, k], j) => <circle key={j} cx={a * r} cy={b * r} r={k * r} fill={`url(#${id}-leaf)`} />)}
          <ellipse cx={-r * 0.2} cy={-r * 0.55} rx={r * 0.3} ry={r * 0.14} fill="#ffffff" opacity={0.18 * (1 - nightMix * 0.6)} />
        </g>;
      })}
      {/* warm pools of light on the walk under each strip */}
      {nightMix > 0 && Array.from({length: 8}, (_, i) => {
        const t = i / 7, yy = 620 + t * t * 1210, l = 502 - t * 160, r = 576 + t * 242;
        return <ellipse key={i} cx={(l + r) / 2} cy={yy + 120 * (0.3 + t)} rx={(r - l) * 0.5} ry={30 + t * 60} fill="#ffd98a"
          opacity={0.55 * nightMix * glow} filter={`url(#${id}-bb)`} />;
      })}
      {/* the rail and its balusters */}
      {Array.from({length: 9}, (_, i) => {
        const yy = 790 + i * 132, lx = 462 - i * 17;
        return <path key={i} d={`M${lx} ${yy} L${lx - 82} ${yy + 15}`} stroke={B.rail} strokeWidth={9 + i * 0.6} strokeLinecap="round" />;
      })}
      <path d="M410 1880 L522 590" stroke={line(B.rail)} strokeWidth={20 + ow * 2} strokeLinecap="round" />
      <path d="M410 1880 L522 590" stroke={B.rail} strokeWidth={20} strokeLinecap="round" />
      <path d="M404 1860 L516 600" stroke={light(B.rail, 0.5)} strokeWidth={5} strokeLinecap="round" opacity={0.7} />
      {/* posts and beams, far to near, each a rounded lit timber */}
      {Array.from({length: 8}, (_, i) => {
        const t = i / 7, yy = 620 + t * t * 1210, left = 502 - t * 160, right = 576 + t * 242, sw = 10 + t * 14;
        const wood = sk(B.wood, '#7a5a5a'), hi = sk(B.woodLight, '#a88080');
        const posts = `M${left} ${yy} L${left - 8} ${yy + 260 * (0.3 + t)} M${right} ${yy} L${right + 10} ${yy + 260 * (0.3 + t)}`;
        const beam = `M${left - 8} ${yy} L${right + 8} ${yy}`;
        return <g key={i}>
          <path d={posts} stroke={line(wood)} strokeWidth={sw + ow * 1.6} strokeLinecap="round" />
          <path d={posts} stroke={wood} strokeWidth={sw} strokeLinecap="round" />
          <path d={posts} transform={`translate(${-sw * 0.2} 0)`} stroke={hi} strokeWidth={sw * 0.3} strokeLinecap="round" opacity={0.8} />
          <path d={beam} stroke={line(wood)} strokeWidth={sw * 0.8 + ow * 1.6} strokeLinecap="round" />
          <path d={beam} stroke={wire ? B.teal : hi} strokeWidth={sw * 0.8} strokeLinecap="round" />
          <path d={beam} transform={`translate(0 ${-sw * 0.18})`} stroke="#ffffff" strokeWidth={sw * 0.18} strokeLinecap="round" opacity={0.35} />
          {nightMix > 0 && <g opacity={nightMix}>
            <path d={`M${left + 6} ${yy + sw * 0.75} L${right - 6} ${yy + sw * 0.75}`} stroke="#ffe9a8" strokeWidth={sw * 2.2} strokeLinecap="round"
              opacity={0.9 * glow} filter={`url(#${id}-b)`} />
            <path d={`M${left + 6} ${yy + sw * 0.75} L${right - 6} ${yy + sw * 0.75}`} stroke="#fffbe8" strokeWidth={Math.max(3, sw * 0.24)}
              strokeLinecap="round" />
          </g>}
        </g>;
      })}
      {wire && <g fill="none" stroke={B.teal} strokeLinecap="round" strokeLinejoin="round">
        <path d="M340 1880 L500 570 L580 570 L820 1880 Z" strokeWidth={10} opacity={0.35} filter={`url(#${id}-b)`} />
        <path d="M340 1880 L500 570 L580 570 L820 1880 Z" strokeWidth={3.4} opacity={0.85} />
        {Array.from({length: 10}, (_, i) => <path key={i} d={`M${350 + i * 46} 1880 L${508 + i * 8} 570`} strokeWidth={2.6} opacity={0.6} />)}
      </g>}
    </g>
  );
};

// ============================================================================ the cameras

/** THE CAMERA COLUMNS. Freestanding cool white columns that stand on the ground they shadow, each with
 * rounded camera housings whose lenses wake in teal, look along the walk and pulse an amber ring.
 * `heights` sets three columns at different heights with the arc that says so. */
export const CameraArrayV2: React.FC<P> = ({x = 0, y = 0, scale = 1, frame = 0, mode = 'kiosk', active = true}) => {
  const id = useUid();
  const ow = clOw(scale);
  const wake = phase(frame, 5, 28);
  const xs = mode === 'heights' ? [205, 490, 805] : [220, 825];
  const heads = mode === 'heights' ? [955, 800, 640] : [750, 690];
  const body = '#eef1f8';
  const look = Math.sin(frame / 40) * 4;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={mode === 'rest' ? 0.55 : 1}>
      <defs><ClLit id={`${id}-b`} c={body} /><ClLit id={`${id}-h`} c="#ffffff" />
        <radialGradient id={`${id}-l`} cx="40%" cy="35%" r="70%"><stop offset="0%" stopColor="#3a4890" /><stop offset="100%" stopColor="#0a0e28" />
        </radialGradient><ClBlur id={`${id}-g`} sd={7} /></defs>
      {xs.map((cx, i) => <g key={i} transform={`translate(${cx} 0)`}>
        <ContactShadow x={0} y={1462} w={240} opacity={0.34} />
        <path d={clRR(-58, heads[i], 116, 1460 - heads[i], 44)} fill={`url(#${id}-b)`} stroke={line(body)} strokeWidth={ow * 2} />
        <path d={`M-38 ${heads[i] + 40} V${1430}`} stroke="#ffffff" strokeWidth={10} strokeLinecap="round" opacity={0.7} />
        <path d={`M40 ${heads[i] + 50} V${1440}`} stroke={shade(body, 0.2)} strokeWidth={12} strokeLinecap="round" opacity={0.5} />
        {[0, 1].map((j) => {
          const cy = heads[i] + 92 + j * (mode === 'heights' ? 146 : 184);
          const pr = 28 + 18 * Math.sin((frame + i * 8) / 7);
          return <g key={j}>
            <path d={clRR(-84, cy - 46, 188, 76, 36)} fill={`url(#${id}-h)`} stroke={line(body)} strokeWidth={ow * 2} />
            <path d={`M-62 ${cy - 34} H50`} stroke="#ffffff" strokeWidth={7} strokeLinecap="round" opacity={0.9} />
            <path d={`M-70 ${cy + 18} H90`} stroke={shade(body, 0.2)} strokeWidth={6} strokeLinecap="round" opacity={0.6} />
            <circle cx={50} cy={cy - 8} r={31} fill={`url(#${id}-l)`} stroke={line('#3a4890')} strokeWidth={ow * 1.4} />
            {active && <circle cx={50 + look} cy={cy - 8} r={17} fill={B.teal} opacity={0.5 * wake} filter={`url(#${id}-g)`} />}
            <circle cx={50 + look} cy={cy - 8} r={13} fill={active ? B.teal : '#59607e'} opacity={active ? 0.45 + wake * 0.55 : 0.5} />
            <circle cx={50 + look} cy={cy - 8} r={6} fill="#0a0e28" />
            <circle cx={42} cy={cy - 18} r={6} fill="#ffffff" opacity={0.85} />
            <circle cx={-52} cy={cy - 8} r={5} fill={active ? CL.coral : '#59607e'} opacity={active ? 0.6 + 0.4 * Math.sin(frame / 5 + i) : 1} />
            {active && <circle cx={50} cy={cy - 8} r={pr + 6} fill="none" stroke={B.amber} strokeWidth={5} opacity={0.5 * wake} />}
          </g>;
        })}
        <rect x={-16} y={heads[i] + 390 - i * 34} width={32} height={12} rx={6} fill={active ? B.teal : '#59607e'} />
        {active && <rect x={-16} y={heads[i] + 390 - i * 34} width={32} height={12} rx={6} fill={B.teal} opacity={0.6} filter={`url(#${id}-g)`} />}
      </g>)}
      {mode === 'heights' && <g opacity={wake}>
        <path d="M205 930 C370 850 640 760 805 630" fill="none" stroke={B.amber} strokeWidth={14} opacity={0.35} filter={`url(#${id}-g)`} />
        <path d="M205 930 C370 850 640 760 805 630" fill="none" stroke={B.amber} strokeWidth={8} strokeDasharray="2 20" strokeLinecap="round"
          strokeDashoffset={-frame * 2} />
        <ClPill x={540} y={527} t="DIFFERENT HEIGHTS" size={24} fill="#3a2a10" ink={B.amber} ow={ow} />
      </g>}
    </g>
  );
};

// ============================================================================ the traveler

/** THE TRAVELER FLOW. The traveler walks up the walk, peels right into the opt-out path on `branch`, or
 * shrinks away on `exit`. `trail` lays a glowing dotted route, `behind` fades the walker. */
export const TravelerFlowV2: React.FC<P> = ({x = 0, y = 0, scale = 1, frame = 0, progress, mode = 'walk', label}) => {
  const id = useUid();
  const ow = clOw(scale);
  const p = progress === undefined ? phase(frame, 0, 130) : clamp(progress);
  const branch = mode === 'branch', exit = mode === 'exit';
  const px = branch ? 520 + 300 * p : exit ? 550 + 65 * p : 560 + Math.sin(frame / 17) * 14;
  const py = exit ? 1320 - 610 * p : 1490 - 390 * p;
  const s = exit ? 0.95 - 0.48 * p : 0.92 - 0.18 * p;
  const trail = 'M540 1580 C515 1320 605 1110 548 730';
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs><ClBlur id={`${id}-g`} sd={12} /></defs>
      {mode === 'trail' && <g>
        <path d={trail} fill="none" stroke={B.teal} strokeWidth={46} opacity={0.22} strokeLinecap="round" filter={`url(#${id}-g)`} />
        <path d={trail} fill="none" stroke={B.teal} strokeWidth={16} strokeLinecap="round" strokeDasharray="2 30" strokeDashoffset={-frame * 4} />
      </g>}
      <Traveler x={px} y={py} s={s} frame={frame} opacity={mode === 'behind' ? 0.55 : 1} />
      {label && <g opacity={phase(frame, 8, 26)}><ClPill x={540} y={1541} t={label} size={22} fill="#2a1f4e" ink={B.amber} ow={ow} padX={110} /></g>}
    </g>
  );
};

// ============================================================================ the capture frame

/** THE CAPTURE FRAME. A rounded amber lock with cream corner brackets that breathes, following the walker's
 * face on `lock`, sliding a glass tile with a friendly face on `tile`. `iris` is a lit aperture closing to
 * a glowing ring. */
export const CaptureFrameV2: React.FC<P> = ({x = 0, y = 0, scale = 1, frame = 0, progress, mode = 'lock', label = 'IMAGE CAPTURE'}) => {
  const id = useUid();
  const ow = clOw(scale);
  const p = progress === undefined ? phase(frame, 8, 48) : clamp((progress - 0.06) / 0.36);
  const pulse = 0.72 + 0.28 * Math.sin(frame / 7);
  if (mode === 'iris') {
    const r = 330 + 85 * p;
    return <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs><ClBlur id={`${id}-g`} sd={14} /></defs>
      <g opacity={0.85 * (1 - p * 0.45)}>
        {Array.from({length: 12}, (_, i) => {
          const a0 = i * Math.PI / 6, a1 = (i + 1) * Math.PI / 6;
          return <path key={i} d={`M540 1000 L${540 + Math.cos(a0) * r} ${1000 + Math.sin(a0) * r} A${r} ${r} 0 0 1 ${540 + Math.cos(a1) * r} ${1000 + Math.sin(a1) * r} Z`}
            fill={i % 2 ? '#1d3a6e' : '#25508a'} stroke={line('#1d3a6e')} strokeWidth={ow * 1.2} strokeLinejoin="round" />;
        })}
      </g>
      <circle cx={540} cy={1000} r={r * 0.64} fill="none" stroke={B.amber} strokeWidth={26} opacity={0.4 * pulse} filter={`url(#${id}-g)`} />
      <circle cx={540} cy={1000} r={r * 0.64} fill="none" stroke={B.amber} strokeWidth={10} opacity={pulse} />
      <ClPill x={540} y={502} t={label} size={24} fill="#2a1f4e" ink={B.amber} ow={ow} />
    </g>;
  }
  const tile = mode === 'tile', source = mode === 'source';
  const travel = progress === undefined ? phase(frame, 0, 130) : clamp(progress);
  const cx = tile ? 255 + 385 * p : mode === 'overshoot' ? 500 - 60 * p : source ? 210 : 550;
  const walkerFaceY = 1266 - 346 * travel;
  const cy = tile ? 930 : source ? 1018 : mode === 'lock' ? walkerFaceY : mode === 'reacquire' ? 1190 - 32 * p : 890 - 90 * p;
  const w = tile ? 260 : source ? 164 : 265 - 55 * p;
  const h = tile ? 320 : source ? 216 : 330 - 70 * p;
  const k = 46;
  const x0 = cx - w / 2, y0 = cy - h / 2;
  return <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={mode === 'trace' ? 0.42 : source ? 1 - phase(frame, 10, 60) : 1}>
    <defs><ClBlur id={`${id}-g`} sd={10} /></defs>
    {tile && <ClGlass x={x0} y={y0} w={w} h={h} r={30} tint="#1f3a6e" ow={ow}>
      <g transform={`translate(${w / 2} ${h / 2 - 50})`}><ClFace r={58} frame={frame} ow={ow} skin={B.skin} shirt={B.shirt} /></g>
    </ClGlass>}
    <rect x={x0} y={y0} width={w} height={h} rx={30} fill="none" stroke={B.amber} strokeWidth={16} opacity={0.35 * pulse} filter={`url(#${id}-g)`} />
    <rect x={x0} y={y0} width={w} height={h} rx={30} fill="none" stroke={B.amber} strokeWidth={6}
      strokeDasharray={mode === 'reacquire' ? '26 18' : undefined} strokeLinecap="round" opacity={pulse} />
    {[[x0, y0, 1, 1], [x0 + w, y0, -1, 1], [x0, y0 + h, 1, -1], [x0 + w, y0 + h, -1, -1]].map((a, i) => {
      const d = `M${a[0]} ${a[1] + a[3] * k} L${a[0]} ${a[1] + a[3] * 18} Q${a[0]} ${a[1]} ${a[0] + a[2] * 18} ${a[1]} L${a[0] + a[2] * k} ${a[1]}`;
      return <g key={i}>
        <path d={d} fill="none" stroke={line(B.paper)} strokeWidth={14 + ow * 2} strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} fill="none" stroke={B.paper} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
      </g>;
    })}
    {label && <ClPill x={cx} y={cy + h / 2 + 46} t={label} size={18} fill="#2a1f4e" ink={B.amber} ow={ow} padX={60} />}
  </g>;
};

// ============================================================================ the source

/** THE SOURCE. The agency document swings in and settles, a warm lit card with a navy header, the title,
 * the place in copper, the date with an amber underline that draws, and the status in a mint panel. */
export const SourceRevealV2: React.FC<P> = ({x = 0, y = 0, scale = 1, frame = 0, date = 'SEPTEMBER 1 · 2026', status = 'OPERATIONAL ASSESSMENT',
  place = 'PROGRESO'}) => {
  const id = useUid();
  const p = phase(frame, 4, 34);
  const underline = phase(frame, 58, 100);
  const s = scale * (0.88 + p * 0.12);
  const ow = clOw(s);
  const card = clRR(-405, -425, 810, 850, 44);
  return <g transform={`translate(${x + 540} ${y + 960 - 440 * (1 - p)}) scale(${s}) rotate(${(1 - p) * -5 + Math.sin(frame / 50) * 0.4})`}>
    <defs><ClLit id={`${id}-p`} c={B.paper} k={0.5} /><ClLit id={`${id}-h`} c="#1f4d7a" v /><ClLit id={`${id}-m`} c="#d9f2ea" v k={0.6} />
      <ClBlur id={`${id}-b`} sd={26} /><ClBlur id={`${id}-g`} sd={8} /><clipPath id={`${id}-c`}><path d={card} /></clipPath></defs>
    <path d={card} transform="translate(30 40)" fill="#160f38" opacity={0.32} filter={`url(#${id}-b)`} />
    <path d={card} fill={`url(#${id}-p)`} stroke={line('#e8d6b4')} strokeWidth={ow * 2} />
    <g clipPath={`url(#${id}-c)`}><rect x={-405} y={-425} width={810} height={84} fill={`url(#${id}-h)`} /></g>
    <circle cx={-338} cy={-383} r={26} fill={B.amber} opacity={0.6} filter={`url(#${id}-g)`} />
    <circle cx={-338} cy={-383} r={20} fill={B.amber} stroke={line(B.amber)} strokeWidth={ow * 1.2} />
    <ClTxt x={-300} y={-374} t="SOURCE / DHS S&T" size={22} fill={B.paper} spacing={2} />
    <ClTxt x={-330} y={-270} t="BIOMETRICS AT THE BORDER" size={36} fill="#241c4a" weight={900} spacing={0.4} />
    <ClTxt x={-330} y={-210} t={place} size={26} fill="#d0663a" spacing={2} />
    <ClTxt x={-330} y={-118} t={date} size={28} fill="#241c4a" spacing={1} />
    <rect x={-330} y={-92} width={660} height={10} rx={5} fill="#efe2c8" />
    <rect x={-330} y={-92} width={Math.max(10, 660 * underline)} height={10} rx={5} fill="#e07a3f" />
    <rect x={-330} y={0} width={660} height={180} rx={30} fill={`url(#${id}-m)`} stroke={line('#d9f2ea')} strokeWidth={ow * 1.2} />
    <rect x={-300} y={14} width={420} height={12} rx={6} fill="#ffffff" opacity={0.6} />
    <ClTxt x={0} y={80} t={status} size={26} fill="#1f4d7a" anchor="middle" spacing={1} weight={900} />
    <ClTxt x={0} y={128} t="TO SUPPORT CBP PLANNING" size={20} fill="#4f6a78" anchor="middle" spacing={1.2} />
    {[0, 1, 2].map((i) => <rect key={i} x={-330} y={236 + i * 54} width={570 - i * 74} height={14} rx={7} fill="#b9b0d0" opacity={0.6} />)}
    <path d="M-370 -320 Q-370 -332 -358 -332 L-150 -332" stroke="#ffffff" strokeWidth={8} strokeLinecap="round" fill="none" opacity={0.6} />
  </g>;
};

// ============================================================================ the human factors

/** THE HUMAN FACTORS. The traveler picks up a straw hat, then sunglasses, then an umbrella, while three
 * glass badges light up with the same three things, lit and rounded. */
export const HumanFactorsV2: React.FC<P> = ({x = 0, y = 0, scale = 1, frame = 0}) => {
  const id = useUid();
  const ow = clOw(scale);
  const p = phase(frame, 6, 32);
  const reveal = (i: number) => clamp((p * 3) - i * 0.65);
  const hatC = '#ecc66e';
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <defs><ClLit id={`${id}-hat`} c={hatC} /><ClLit id={`${id}-um`} c={B.blue} /><ClBlur id={`${id}-g`} sd={10} />
      <linearGradient id={`${id}-lens`} x1="0" y1="0" x2="0.4" y2="1"><stop offset="0%" stopColor="#4a5aa8" /><stop offset="100%" stopColor="#0d1238" />
      </linearGradient></defs>
    <Traveler x={540} y={1410} s={0.88} frame={frame} umbrella={clamp((frame - 58) / 10)} glasses={frame > 36} hat={frame > 16} />
    {[{x: 205, label: 'HAT'}, {x: 540, label: 'SUNGLASSES'}, {x: 875, label: 'UMBRELLA'}].map((v, i) => {
      const q = reveal(i), ring = i === 2 ? B.blue : B.amber;
      return <g key={v.label} opacity={q} transform={`translate(${v.x} 555) scale(${0.85 + 0.15 * q})`}>
        <circle r={124} fill={ring} opacity={0.35} filter={`url(#${id}-g)`} />
        <circle r={112} fill={B.deep} stroke={ring} strokeWidth={ow * 2} />
        <circle r={100} fill="none" stroke={light(B.deep, 0.4)} strokeWidth={ow * 0.6} opacity={0.6} />
        <ellipse cx={-40} cy={-62} rx={44} ry={18} fill="#ffffff" opacity={0.12} />
        {i === 0 && <g transform="translate(0 12)">
          <ellipse cx={0} cy={14} rx={84} ry={22} fill={`url(#${id}-hat)`} stroke={line(hatC)} strokeWidth={ow * 1.6} />
          <path d="M-40 14 Q-44 -46 0 -48 Q44 -46 40 14 Q0 26 -40 14 Z" fill={`url(#${id}-hat)`} stroke={line(hatC)} strokeWidth={ow * 1.6}
            strokeLinejoin="round" />
          <path d="M-40 0 Q0 12 40 0" stroke="#c0503a" strokeWidth={9} fill="none" strokeLinecap="round" />
          <path d="M-26 -30 Q-20 -42 -4 -42" stroke="#ffffff" strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.6} />
        </g>}
        {i === 1 && <g>
          <path d="M-12 -4 Q0 -14 12 -4" stroke="#e9ecf8" strokeWidth={8} fill="none" strokeLinecap="round" />
          {[-1, 1].map((k) => <g key={k}>
            <rect x={k > 0 ? 12 : -78} y={-24} width={66} height={46} rx={20} fill={`url(#${id}-lens)`} stroke="#e9ecf8" strokeWidth={ow * 1.4} />
            <path d={`M${k > 0 ? 24 : -66} -10 L${k > 0 ? 40 : -50} -16`} stroke="#ffffff" strokeWidth={6} strokeLinecap="round" opacity={0.6} />
          </g>)}
        </g>}
        {i === 2 && <g transform="translate(0 6)">
          <path d="M0 -12 V58 Q0 74 16 74 Q28 74 28 62" stroke="#e9ecf8" strokeWidth={9} fill="none" strokeLinecap="round" />
          <path d="M-86 -6 Q0 -96 86 -6 Q64 -22 43 -6 Q22 -22 0 -6 Q-22 -22 -43 -6 Q-64 -22 -86 -6 Z" fill={`url(#${id}-um)`} stroke={line(B.blue)}
            strokeWidth={ow * 1.6} strokeLinejoin="round" />
          <path d="M-56 -36 Q-20 -66 18 -64" stroke="#ffffff" strokeWidth={7} strokeLinecap="round" fill="none" opacity={0.45} />
        </g>}
        <ClPill x={0} y={180} t={v.label} size={20} fill={B.deep} ink={B.paper} ow={ow} />
      </g>;
    })}
  </g>;
};

// ============================================================================ the capture zone

/** THE 3D CAPTURE ZONE. Nested rounded frames of cyan light receding into a soft glass volume, the corner
 * rays, and the traveler's dotted route glowing through it, drifting gently. */
export const CaptureZoneV2: React.FC<P> = ({x = 0, y = 0, scale = 1, frame = 0, label = '3D CAPTURE ZONE'}) => {
  const id = useUid();
  const ow = clOw(scale);
  const p = phase(frame, 4, 45);
  const dx = 20 * Math.sin(frame / 13);
  const route = 'M540 1300 C480 1140 620 970 540 760';
  return <g transform={`translate(${x + dx} ${y}) scale(${scale})`} opacity={0.35 + p * 0.65}>
    <defs><linearGradient id={`${id}-v`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={B.teal} stopOpacity={0.04} />
      <stop offset="100%" stopColor={B.teal} stopOpacity={0.2} /></linearGradient><ClBlur id={`${id}-g`} sd={9} /></defs>
    <rect x={210} y={500} width={660} height={840} rx={48} fill={`url(#${id}-v)`} />
    {[[210, 500, 402, 728], [870, 500, 678, 728], [210, 1340, 402, 1190], [870, 1340, 678, 1190]].map((v, i) =>
      <path key={i} d={`M${v[0]} ${v[1]} L${v[2]} ${v[3]}`} stroke={B.teal} strokeWidth={5} strokeLinecap="round" opacity={0.6} />)}
    {[0, 1, 2, 3].map((i) => {
      const r = clRR(210 + i * 64, 500 + i * 76, 660 - i * 128, 840 - i * 150, 48 - i * 8);
      return <g key={i}>
        <path d={r} fill="none" stroke={B.teal} strokeWidth={16 - i * 2} opacity={0.3} filter={`url(#${id}-g)`} />
        <path d={r} fill="none" stroke={i === 0 ? '#b6fff6' : B.teal} strokeWidth={7 - i * 1.2} opacity={1 - i * 0.15} />
      </g>;
    })}
    <path d={route} fill="none" stroke={B.amber} strokeWidth={34} opacity={0.25} strokeLinecap="round" filter={`url(#${id}-g)`} />
    <path d={route} fill="none" stroke={B.amber} strokeWidth={18} strokeDasharray="2 28" strokeDashoffset={-frame * 5} strokeLinecap="round" />
    <ClPill x={540} y={444} t={label} size={24} fill="#123a4e" ink="#b6fff6" ow={ow} />
  </g>;
};

// ============================================================================ the suitability step

/** IMAGE SUITABILITY. Three glass chambers on a lit conveyor. One photo tile rides to the middle chamber
 * and stops there, amber gate bars drop to say it was analysed, and the matching chamber stays dim,
 * because the source describes suitability before that separate step. */
export const SuitabilityPipelineV2: React.FC<P> = ({x = 0, y = 0, scale = 1, frame = 0, label = 'IMAGE SUITABILITY', next = 'BIOMETRIC MATCHING'}) => {
  const id = useUid();
  const ow = clOw(scale);
  const p = phase(frame, 4, 116);
  const cx = 210 + 330 * clamp(p / 0.62);
  const gate = phase(frame, 62, 92);
  const belt = 'M170 1040 H910';
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <defs><ClBlur id={`${id}-g`} sd={8} user /><ClLit id={`${id}-p`} c={B.paper} k={0.5} /></defs>
    {[{x: 170, t: 'FACIAL IMAGE'}, {x: 540, t: label}, {x: 910, t: next}].map((v, i) => <g key={v.t} opacity={i < 2 ? 1 : 0.4 + gate * 0.1}>
      <ClGlass x={v.x - 145} y={820} w={290} h={430} r={40} tint={i === 1 ? '#3a2f6e' : B.glass} ow={ow} glow={i === 1 ? B.amber : B.teal}
        glowK={i === 1 ? 0.6 + gate * 0.4 : 0.4} />
      <ClPill x={v.x} y={1306} t={v.t} size={17} fill={B.deep} ink={i === 1 ? B.amber : B.paper} ow={ow} padX={28} />
    </g>)}
    <path d={belt} stroke={line('#3a4170')} strokeWidth={22 + ow * 2} strokeLinecap="round" />
    <path d={belt} stroke="#4a5288" strokeWidth={22} strokeLinecap="round" />
    <path d={belt} stroke={B.amber} strokeWidth={14} opacity={0.35} filter={`url(#${id}-g)`} />
    <path d={belt} stroke={B.amber} strokeWidth={8} strokeDasharray="2 28" strokeDashoffset={-frame * 5} strokeLinecap="round" />
    <g transform={`translate(${cx} ${1018 + Math.sin(frame / 8) * 3}) rotate(${p * 10})`}>
      <rect x={-86} y={-112} width={172} height={224} rx={26} fill="#160f38" opacity={0.3} filter={`url(#${id}-g)`} transform="translate(8 12)" />
      <rect x={-82} y={-108} width={164} height={216} rx={24} fill={`url(#${id}-p)`} stroke={line('#e8d6b4')} strokeWidth={ow * 2} />
      <g transform="translate(0 -36)"><ClFace r={38} frame={frame} ow={ow} skin={B.skin} shirt={B.shirt} /></g>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy], i) => <path key={i}
        d={`M${sx * 66} ${sy * 62} L${sx * 66} ${sy * 82} Q${sx * 66} ${sy * 92} ${sx * 56} ${sy * 92} L${sx * 38} ${sy * 92}`} fill="none"
        stroke={B.amber} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />)}
    </g>
    {[500, 580].map((gx) => <g key={gx}>
      <path d={`M${gx} 790 v${Math.max(1, 240 * gate)}`} stroke={B.amber} strokeWidth={24} opacity={0.4} filter={`url(#${id}-g)`} strokeLinecap="round" />
      <path d={`M${gx} 790 v${Math.max(1, 240 * gate)}`} stroke={line(B.amber)} strokeWidth={14 + ow * 2} strokeLinecap="round" />
      <path d={`M${gx} 790 v${Math.max(1, 240 * gate)}`} stroke={B.amber} strokeWidth={14} strokeLinecap="round" />
    </g>)}
    <ClPill x={540} y={720} t={gate > 0.6 ? 'ANALYZED' : 'SUITABILITY CHECK'} size={26} fill={gate > 0.6 ? B.amber : '#3a2a10'}
      ink={gate > 0.6 ? '#2a1f4e' : B.amber} ow={ow} glow={gate > 0.6} />
  </g>;
};

// ============================================================================ the metrics left open

/** THE THREE OPEN WINDOWS. Glass cards for what the article does not publish (accuracy, retention, final
 * selection), each with an amber tab and an empty slot where a number would sit, on a dotted copper
 * thread, then an amber NOT PUBLISHED stamp. */
export const MetricsBlindV2: React.FC<P> = ({x = 0, y = 0, scale = 1, frame = 0, progress, rows = ['ACCURACY RATE', 'RETENTION PERIOD', 'FINAL SELECTION']}) => {
  const id = useUid();
  const ow = clOw(scale);
  const p = progress === undefined ? phase(frame, 22, 72) : clamp((progress - 0.08) / 0.56);
  const positions = [{x: 112, y: 585, r: -3}, {x: 360, y: 885, r: 3}, {x: 168, y: 1190, r: -2}];
  const stamp = progress === undefined ? phase(frame, 76, 112) : clamp((progress - 0.68) / 0.2);
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <defs><ClBlur id={`${id}-g`} sd={10} /></defs>
    <ClPill x={540} y={497} t="THE ARTICLE LEAVES THREE WINDOWS OPEN" size={23} fill={B.deep} ink={B.paper} ow={ow} />
    <path d="M540 535 C510 760 580 1030 520 1450" fill="none" stroke="#e07a3f" strokeWidth={10} strokeDasharray="2 22" strokeLinecap="round"
      strokeDashoffset={-frame * 1.5} opacity={0.8} />
    {rows.map((r, i) => {
      const q = clamp(p * 3 - i * 0.55);
      const a = positions[i] ?? positions[positions.length - 1];
      const blink = 0.5 + 0.5 * Math.sin(frame / 6 + i);
      return <g key={r} transform={`translate(${a.x} ${a.y + (1 - q) * 30}) rotate(${a.r})`} opacity={q}>
        <ClGlass x={0} y={0} w={610} h={190} r={40} tint={B.glass} ow={ow}>
          <rect x={0} y={0} width={22} height={190} fill={B.amber} />
          <ClTxt x={50} y={68} t={r} size={23} fill="#d9e2ff" spacing={1.6} />
          <path d="M50 126 H440" stroke="#5a6aa8" strokeWidth={8} strokeDasharray="2 18" strokeLinecap="round" />
          <rect x={470} y={100} width={100} height={52} rx={18} fill="none" stroke={B.amber} strokeWidth={ow * 1.4} strokeDasharray="10 9" />
          <rect x={508} y={124} width={24} height={6} rx={3} fill={B.amber} opacity={blink} />
        </ClGlass>
      </g>;
    })}
    <g opacity={stamp} transform={`translate(540 1580) rotate(-2) scale(${0.9 + 0.1 * stamp})`}>
      <rect x={-232} y={-62} width={464} height={124} rx={40} fill={B.amber} opacity={0.5} filter={`url(#${id}-g)`} />
      <ClPill x={0} y={0} t="NOT PUBLISHED" size={31} fill={B.amber} ink="#2a1f4e" ow={ow} padX={110} />
    </g>
  </g>;
};

// ============================================================================ the two lanes

/** THE CAPTURE LANE AND THE OPT-OUT LANE. Two glossy translucent ribbons, violet straight ahead through
 * capture and blue peeling right where the photographs show the opt-out path, chevrons flowing along
 * each and a glass label tilted over it. */
export const OptOutLaneV2: React.FC<P> = ({x = 0, y = 0, scale = 1, frame = 0, capture = 'CAPTURE AREA', optout = 'OPT-OUT LANE'}) => {
  const id = useUid();
  const ow = clOw(scale);
  const p = phase(frame, 8, 48);
  const cap = roundPoly([[470, 1580], [515, 650], [585, 650], [655, 1580]], 26);
  const opt = 'M655 1580 C820 1290 785 890 610 650 L665 650 C920 940 995 1280 970 1580 Z';
  const flow = (frame * 3) % 120;
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <defs><linearGradient id={`${id}-v`} x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor={B.violet} stopOpacity={0.9} />
      <stop offset="100%" stopColor={light(B.violet, 0.4)} stopOpacity={0.55} /></linearGradient>
      <linearGradient id={`${id}-b`} x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor={B.blue} stopOpacity={0.9} />
        <stop offset="100%" stopColor={light(B.blue, 0.4)} stopOpacity={0.55} /></linearGradient>
      <clipPath id={`${id}-c`}><path d={cap} /></clipPath></defs>
    <g opacity={0.5 + p * 0.5}>
      <path d={cap} fill={`url(#${id}-v)`} stroke={line(B.violet)} strokeWidth={ow * 2} strokeLinejoin="round" />
      <path d={opt} fill={`url(#${id}-b)`} stroke={line(B.blue)} strokeWidth={ow * 2} strokeLinejoin="round" />
      <g clipPath={`url(#${id}-c)`}>{Array.from({length: 9}, (_, i) => {
        const yy = 1600 - ((i * 120 + flow) % 1000);
        return <path key={i} d={`M528 ${yy + 22} L560 ${yy} L592 ${yy + 22}`} stroke="#ffffff" strokeWidth={9} fill="none" strokeLinecap="round"
          strokeLinejoin="round" opacity={0.45} />;
      })}</g>
      <path d="M655 1510 C770 1270 805 1010 642 740" fill="none" stroke="#ffffff" strokeWidth={9} strokeDasharray="2 24" strokeLinecap="round"
        strokeDashoffset={-frame * 4} opacity={0.85} />
      <path d="M520 1540 L548 690" stroke="#ffffff" strokeWidth={6} strokeLinecap="round" opacity={0.3} />
    </g>
    <ClGlass x={270} y={1052} w={330} h={116} r={40} tint={B.violet} ow={ow} rot={-7}>
      <ClTxt x={165} y={68} t={capture} size={22} fill="#ffffff" anchor="middle" spacing={1.4} />
    </ClGlass>
    <ClGlass x={672} y={1042} w={330} h={116} r={40} tint={B.blue} ow={ow} rot={8}>
      <ClTxt x={165} y={68} t={optout} size={22} fill="#ffffff" anchor="middle" spacing={1.4} />
    </ClGlass>
  </g>;
};

// ============================================================================ the decision

/** THE DECISION TRACK. A glass panel with assessment and planning done as lit amber spheres with checks,
 * the amber pulse running along a rounded track and stopping at planning, and selection still a dashed
 * teal ring with a breathing question mark. `compact` is the short form, an amber line to a dashed card. */
export const DeploymentDecisionV2: React.FC<P> = ({x = 0, y = 0, scale = 1, frame = 0, stage = 'planning', selected = false, actor = 'CBP',
  mode = 'track'}) => {
  const id = useUid();
  const ow = clOw(scale);
  const p = phase(frame, 8, 108);
  const stop = stage === 'planning' ? Math.min(p, 0.66) : p;
  const pulseX = 210 + stop * 660;
  const breathe = 0.5 + 0.5 * Math.sin(frame / 8);
  const nodes = [
    {x: 210, title: 'ASSESSMENT', done: true},
    {x: 540, title: 'PLANNING', done: stage === 'planning' || selected},
    {x: 870, title: 'SELECTION', done: selected},
  ];
  const sphere = <defs key="d"><radialGradient id={`${id}-s`} cx="36%" cy="30%" r="75%"><stop offset="0%" stopColor={light(B.amber, 0.5)} />
    <stop offset="65%" stopColor={B.amber} /><stop offset="100%" stopColor={shade(B.amber, 0.35)} /></radialGradient>
    <ClBlur id={`${id}-g`} sd={10} user /></defs>;
  if (mode === 'compact') {
    const reveal = phase(frame, 58, 104);
    return <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={reveal}>
      {sphere}
      <path d="M250 1420 H640" stroke={B.amber} strokeWidth={20} opacity={0.35} filter={`url(#${id}-g)`} />
      <path d="M250 1420 H640" stroke={B.amber} strokeWidth={10} strokeLinecap="round" />
      <circle cx={250} cy={1420} r={32} fill={`url(#${id}-s)`} stroke={line(B.amber)} strokeWidth={ow * 2} />
      <ClGlass x={640} y={1350} w={350} h={140} r={40} tint={B.glass} ow={ow} glow={B.teal} glowK={0.4 + breathe * 0.4}>
        <ClTxt x={175} y={58} t="FUTURE SELECTION" size={20} fill={B.teal} anchor="middle" spacing={1.4} />
        <ClTxt x={175} y={102} t="OPEN" size={26} fill={B.paper} anchor="middle" spacing={2} />
      </ClGlass>
    </g>;
  }
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    {sphere}
    <ClGlass x={105} y={710} w={870} h={520} r={48} tint={B.glass} ow={ow}>
      <ClTxt x={435} y={92} t={`${actor} DECISION TRACK`} size={28} fill={B.paper} anchor="middle" spacing={1.6} />
      <ClTxt x={435} y={140} t="ARTICLE: NO FINAL SELECTION ANNOUNCED" size={18} fill={B.teal} anchor="middle" spacing={1.2} />
    </ClGlass>
    <path d="M210 975 H870" stroke={line('#34407e')} strokeWidth={22 + ow * 2} strokeLinecap="round" />
    <path d="M210 975 H870" stroke="#3a4890" strokeWidth={22} strokeLinecap="round" />
    <path d={`M210 975 H${pulseX}`} stroke={B.amber} strokeWidth={22} opacity={0.4} filter={`url(#${id}-g)`} />
    <path d={`M210 975 H${pulseX}`} stroke={B.amber} strokeWidth={12} strokeLinecap="round" />
    <circle cx={pulseX} cy={975} r={9} fill="#fff4dc" />
    {nodes.map((n, i) => <g key={n.title}>
      {n.done ? <g>
        <circle cx={n.x} cy={975} r={64} fill={B.amber} opacity={0.35} filter={`url(#${id}-g)`} />
        <circle cx={n.x} cy={975} r={58} fill={`url(#${id}-s)`} stroke={line(B.amber)} strokeWidth={ow * 2} />
        <ellipse cx={n.x - 18} cy={951} rx={18} ry={9} fill="#ffffff" opacity={0.45} />
        <path d={`M${n.x - 24} 977 l16 18 l34 -40`} fill="none" stroke="#2a1f4e" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
      </g> : <g>
        <circle cx={n.x} cy={975} r={58 + breathe * 6} fill={B.teal} opacity={0.18 + breathe * 0.12} filter={`url(#${id}-g)`} />
        <circle cx={n.x} cy={975} r={58} fill="#1a2356" stroke={B.teal} strokeWidth={ow * 1.6} strokeDasharray="16 12" strokeLinecap="round" />
        <ClTxt x={n.x} y={994} t="?" size={52} fill={B.teal} anchor="middle" weight={900} spacing={0} />
      </g>}
      <ClTxt x={n.x} y={1105} t={n.title} size={20} fill={n.done ? B.paper : B.teal} anchor="middle" spacing={1.4} />
      {i === 2 && !n.done && <rect x={n.x - 110} y={1158} width={220} height={8} rx={4} fill={B.teal} opacity={0.3 + 0.25 * Math.sin(frame / 8)} />}
    </g>)}
  </g>;
};

export const BIOMETRICS_V2 = ['PergolaWalkwayV2', 'CameraArrayV2', 'TravelerFlowV2', 'CaptureFrameV2', 'SourceRevealV2', 'HumanFactorsV2',
  'CaptureZoneV2', 'SuitabilityPipelineV2', 'MetricsBlindV2', 'OptOutLaneV2', 'DeploymentDecisionV2'] as const;
