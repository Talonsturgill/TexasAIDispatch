import React, {useId} from 'react';
import {light, line, mix, shade} from './color';

/**
 * THE V2 KIT. Soft, lit, rounded parts an episode can build a world from.
 *
 * Every part follows the same five rules, which are the blueprint's (knowledge/craft/LOOK_V2.md):
 *  1. Round. No sharp corner anywhere: rounded joins, round caps, blobs built from circles.
 *  2. Lit. A key from the upper left: a light side, a shade side pushed toward violet, and a thin rim
 *     of light on the far edge that separates the part from what is behind it.
 *  3. Grounded. Anything that stands gets a soft contact shadow; anything that flies gets a shadow on
 *     the ground under it, so the eye always knows where a thing is in depth.
 *  4. Deep. Far things are paler, bluer and lower in contrast (atmospheric perspective), so a frame
 *     has a front, a middle and a back.
 *  5. Alive. Every hero object has a face, and every part moves a little from `frame`.
 *
 * Line work is each fill's own deep hue (look/color.ts). Nothing is outlined in black.
 * Every state is a prop or a function of `frame`. No random input, no wall clock.
 */
export const useUid = () => useId().replace(/[^a-zA-Z0-9]/g, '');
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const ease = (p: number) => { const q = clamp01(p); return q * q * (3 - 2 * q); };
export const easeOutBack = (p: number, k = 1.6) => { const q = clamp01(p) - 1; return 1 + (k + 1) * q * q * q + k * q * q; };
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const hash = (seed: number, ch: number) => {
  const k = ((seed * 2654435761) ^ (ch * 40503)) >>> 0;
  return ((k >>> 8) % 10000) / 10000;
};

/** A soft blurred shadow on the ground. The single thing that stops a drawing from floating. */
export const ContactShadow: React.FC<{x: number; y: number; w: number; opacity?: number}> = ({x, y, w, opacity = 0.32}) => {
  const id = useUid();
  return (
    <g>
      <defs><radialGradient id={`${id}-cs`}><stop offset="0%" stopColor="#1a1236" stopOpacity={opacity} />
        <stop offset="100%" stopColor="#1a1236" stopOpacity={0} /></radialGradient></defs>
      <ellipse cx={x} cy={y} rx={w / 2} ry={w / 9} fill={`url(#${id}-cs)`} />
    </g>
  );
};

/** A radial glow, for a sun, a lens, a lit screen, a moment of focus. */
export const Glow: React.FC<{x: number; y: number; r: number; color: string; opacity?: number}> = ({x, y, r, color, opacity = 0.6}) => {
  const id = useUid();
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs><radialGradient id={`${id}-g`}><stop offset="0%" stopColor={color} stopOpacity={opacity} />
        <stop offset="45%" stopColor={color} stopOpacity={opacity * 0.35} /><stop offset="100%" stopColor={color} stopOpacity={0} />
      </radialGradient></defs>
      <circle cx={x} cy={y} r={r} fill={`url(#${id}-g)`} />
    </g>
  );
};

export type Land = {skyTop: string; skyLow: string; sun: string; far: string; mid: string; near: string; haze: string};
export const SOUTH_TEXAS: Land = {skyTop: '#5aa2ff', skyLow: '#ffe6b8', sun: '#fff3c4', far: '#b9a7e8', mid: '#e8b25e',
  near: '#e09238', haze: '#ffd9a8'};

const ridge = (y: number, amp: number, seed: number, phase = 0) => {
  const pts: string[] = [];
  for (let x = -60; x <= 1140; x += 30) {
    const v = Math.sin((x + phase) / 210 + seed) * amp + Math.sin((x + phase * 1.6) / 97 + seed * 2.1) * amp * 0.35;
    pts.push(`${x} ${(y + v).toFixed(1)}`);
  }
  return `M-60 2000 L${pts.join(' L')} L1140 2000 Z`;
};

/**
 * A whole outdoor backdrop: lit sky, sun, soft clouds and three ridges of land that get paler with
 * distance. `horizon` is where the far ridge sits; `pan` slides the ridges at three speeds, so a
 * camera move has parallax.
 */
export const Landscape: React.FC<{land?: Land; horizon?: number; pan?: number; frame: number; sunX?: number;
  sunY?: number; relief?: number; clouds?: boolean}> = ({land = SOUTH_TEXAS, horizon = 980, pan = 0, frame, sunX = 780,
  sunY = 560, relief = 1, clouds = true}) => {
  const id = useUid();
  const cloud = (cx: number, cy: number, s: number, k: number) => {
    const dx = ((frame * 0.25 * (0.6 + k * 0.2) + cx) % 1400) - 160;
    return (
      <g key={k} transform={`translate(${dx} ${cy}) scale(${s})`} opacity={0.92}>
        {[[-80, 10, 52], [-20, -18, 70], [55, -4, 58], [110, 14, 42]].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill={`url(#${id}-cloud)`} />))}
        <rect x={-130} y={10} width={280} height={46} rx={23} fill={`url(#${id}-cloud)`} />
      </g>
    );
  };
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={land.skyTop} /><stop offset="62%" stopColor={mix(land.skyTop, land.skyLow, 0.6)} />
          <stop offset="100%" stopColor={land.skyLow} />
        </linearGradient>
        <linearGradient id={`${id}-cloud`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor={mix('#ffffff', land.skyTop, 0.25)} />
        </linearGradient>
        {(['far', 'mid', 'near'] as const).map((k) => (
          <linearGradient key={k} id={`${id}-${k}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={light(land[k], k === 'far' ? 0.25 : 0.12)} />
            <stop offset="100%" stopColor={shade(land[k], k === 'near' ? 0.18 : 0.08)} />
          </linearGradient>
        ))}
        <linearGradient id={`${id}-haze`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={land.haze} stopOpacity={0} /><stop offset="50%" stopColor={land.haze} stopOpacity={0.55} />
          <stop offset="100%" stopColor={land.haze} stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={-200} y={-200} width={1480} height={2400} fill={`url(#${id}-sky)`} />
      <Glow x={sunX} y={sunY} r={520} color={land.sun} opacity={0.85} />
      <circle cx={sunX} cy={sunY} r={74} fill={land.sun} />
      {clouds && <>{cloud(120, 380, 1.1, 0)}{cloud(760, 250, 0.8, 1)}{cloud(1180, 470, 0.65, 2)}</>}
      <path d={ridge(horizon, 34 * relief, 1.2, pan * 0.25)} fill={`url(#${id}-far)`} />
      <rect x={-200} y={horizon - 60} width={1480} height={160} fill={`url(#${id}-haze)`} />
      <path d={ridge(horizon + 130, 46 * relief, 2.7, pan * 0.55)} fill={`url(#${id}-mid)`} />
      <path d={ridge(horizon + 330, 30 * relief, 4.1, pan)} fill={`url(#${id}-near)`} />
    </g>
  );
};

/**
 * A mesquite or brush clump, built from overlapping circles with a lit top and a shaded belly, a
 * curved trunk and a contact shadow. `depth` 0 is near, 1 is far (paler, bluer, smaller contrast).
 */
export const Bush: React.FC<{x: number; y: number; s?: number; seed?: number; color?: string; depth?: number;
  frame?: number; trunk?: boolean}> = ({x, y, s = 1, seed = 1, color = '#6f9e3f', depth = 0, frame = 0, trunk = true}) => {
  const id = useUid();
  const c = mix(color, '#b9b4e8', depth * 0.55);
  const sway = Math.sin(frame / 30 * 1.4 + seed) * 2.5;
  // a mesquite reads as a wide, flat-topped crown of clumps on short forked limbs, not a ball on a stick
  const blobs = [[-150, -150, 60], [-95, -205, 70], [-10, -228, 80], [90, -210, 74], [158, -158, 58], [-55, -150, 66],
    [55, -152, 68], [0, -180, 76]].map(([bx, by, br], i) => ({
    x: bx + (hash(seed, i) - 0.5) * 30, y: by + (hash(seed, i + 9) - 0.5) * 26, r: br * (0.88 + hash(seed, i + 17) * 0.24),
  }));
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <radialGradient id={`${id}-leaf`} cx="35%" cy="25%" r="85%">
          <stop offset="0%" stopColor={light(c, 0.4)} /><stop offset="55%" stopColor={c} /><stop offset="100%" stopColor={shade(c, 0.4)} />
        </radialGradient>
      </defs>
      <ContactShadow x={0} y={4} w={360} opacity={0.3 * (1 - depth * 0.6)} />
      {trunk && <path d={`M-4 0 Q-10 -70 ${-70 + sway} -140 M4 0 Q14 -70 ${80 + sway} -140 M0 -40 Q4 -100 ${8 + sway} -150`} stroke={mix('#6b4a32', '#b9b4e8', depth * 0.5)}
        strokeWidth={22} strokeLinecap="round" fill="none" />}
      <g transform={`translate(${sway} 0)`}>
        {blobs.map((b, i) => <circle key={`o${i}`} cx={b.x} cy={b.y} r={b.r + 6} fill={line(c)} opacity={1 - depth * 0.6} />)}
        {blobs.map((b, i) => <circle key={i} cx={b.x} cy={b.y} r={b.r} fill={`url(#${id}-leaf)`} />)}
        {blobs.slice(0, 4).map((b, i) => <ellipse key={`h${i}`} cx={b.x - b.r * 0.25} cy={b.y - b.r * 0.4} rx={b.r * 0.45}
          ry={b.r * 0.22} fill={light(c, 0.6)} opacity={0.45 * (1 - depth * 0.5)} />)}
      </g>
    </g>
  );
};

export type DroneMood = 'happy' | 'worried' | 'focused' | 'excited' | 'surprised';
/**
 * THE HERO DRONE. A glossy rounded body with a face on its visor: two glowing eyes that blink, squint
 * and widen. The rotors read as spinning discs with motion blur. `shadowY` drops a shadow on the
 * ground below it, so it is always placed in depth.
 */
export const HeroDrone: React.FC<{x: number; y: number; s?: number; frame: number; tilt?: number; mood?: DroneMood;
  body?: string; eye?: string; shadowY?: number; look?: number}> = ({
  x, y, s = 1, frame, tilt = 0, mood = 'happy', body = '#f6f3ee', eye = '#38f2e0', shadowY, look = 0,
}) => {
  const id = useUid();
  const hover = Math.sin(frame / 30 * 2 * Math.PI * 0.9) * 8;
  const blink = (frame % 84) < 4 ? [1, 0.3, 0.1, 0.6][frame % 84] : 1;
  const eyeH = (mood === 'surprised' ? 30 : mood === 'focused' ? 14 : 24) * blink;
  const rotor = (cx: number, k: number) => (
    <g transform={`translate(${cx} -58)`}>
      <rect x={-8} y={0} width={16} height={34} rx={8} fill={shade(body, 0.35)} />
      <ellipse cx={0} cy={-4} rx={108} ry={15} fill={`url(#${id}-blur)`} opacity={0.75 + 0.2 * Math.sin(frame * 1.9 + k)} />
      <ellipse cx={0} cy={-4} rx={16} ry={9} fill={shade(body, 0.45)} />
    </g>
  );
  const eyeShape = (ex: number) => {
    if (mood === 'happy' || mood === 'excited') {
      return <path d={`M${ex - 20} ${6} Q${ex} ${-22} ${ex + 20} ${6}`} stroke={eye} strokeWidth={11} fill="none" strokeLinecap="round" />;
    }
    return <rect x={ex - 15 + look * 6} y={-eyeH / 2} width={30} height={Math.max(4, eyeH)} rx={15} fill={eye} />;
  };
  return (
    <g>
      {shadowY !== undefined && <ContactShadow x={x} y={shadowY} w={260 * s * (1 - clamp01((shadowY - y) / 1600) * 0.5)}
        opacity={0.28 * (1 - clamp01((shadowY - y) / 1400) * 0.7)} />}
      <g transform={`translate(${x} ${y + hover}) rotate(${tilt}) scale(${s})`}>
        <defs>
          <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor={light(body, 0.6)} /><stop offset="55%" stopColor={body} /><stop offset="100%" stopColor={shade(body, 0.32)} />
          </linearGradient>
          <linearGradient id={`${id}-visor`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a2d5e" /><stop offset="100%" stopColor="#0d0f2a" />
          </linearGradient>
          <radialGradient id={`${id}-blur`}><stop offset="0%" stopColor="#ffffff" stopOpacity={0.15} />
            <stop offset="70%" stopColor="#ffffff" stopOpacity={0.55} /><stop offset="100%" stopColor="#ffffff" stopOpacity={0} /></radialGradient>
          <filter id={`${id}-eg`} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="6" /></filter>
        </defs>
        {/* arms into rotors */}
        <path d="M-60 -10 Q-110 -40 -150 -40 M60 -10 Q110 -40 150 -40" stroke={line(body)} strokeWidth={30} strokeLinecap="round" fill="none" />
        <path d="M-60 -10 Q-110 -40 -150 -40 M60 -10 Q110 -40 150 -40" stroke={shade(body, 0.15)} strokeWidth={18} strokeLinecap="round" fill="none" />
        {rotor(-150, 0)}{rotor(150, 2)}
        {/* body */}
        <rect x={-108} y={-62} width={216} height={124} rx={62} fill={`url(#${id}-body)`} stroke={line(body)} strokeWidth={7} />
        <path d="M-80 -44 Q-20 -60 60 -50" stroke="#ffffff" strokeWidth={10} strokeLinecap="round" opacity={0.7} fill="none" />
        {/* visor face */}
        <rect x={-74} y={-36} width={148} height={72} rx={36} fill={`url(#${id}-visor)`} />
        <g filter={`url(#${id}-eg)`} opacity={0.9}>{eyeShape(-30)}{eyeShape(30)}</g>
        {eyeShape(-30)}{eyeShape(30)}
        {mood === 'worried' && <path d="M-50 -24 L-14 -16 M50 -24 L14 -16" stroke={eye} strokeWidth={6} strokeLinecap="round" />}
        {mood === 'focused' && <path d="M-50 -18 L-12 -22 M50 -18 L12 -22" stroke={eye} strokeWidth={6} strokeLinecap="round" />}
        <ellipse cx={-48} cy={-24} rx={14} ry={6} fill="#ffffff" opacity={0.35} />
        {/* gimbal camera */}
        <g transform="translate(0 72)">
          <rect x={-10} y={-14} width={20} height={20} rx={8} fill={shade(body, 0.4)} />
          <circle cx={0} cy={22} r={30} fill={shade(body, 0.25)} stroke={line(body)} strokeWidth={6} />
          <circle cx={0} cy={22} r={17} fill="#0d0f2a" />
          <circle cx={0} cy={22} r={11} fill={eye} opacity={0.9} />
          <circle cx={-6} cy={16} r={5} fill="#ffffff" />
        </g>
        {/* status light */}
        <circle cx={92} cy={-8} r={7} fill={mood === 'worried' ? '#ff5d5d' : '#7dff8a'} />
      </g>
    </g>
  );
};

/**
 * THE SCREWWORM FLY as a character: a metallic blue-green body, big red-orange eyes with
 * catchlights, buzzing wings and a frown. Menacing by its brows, never gory.
 */
export const FlyV2: React.FC<{x: number; y: number; s?: number; frame: number; rot?: number; grin?: boolean}> = ({
  x, y, s = 1, frame, rot = 0, grin = false,
}) => {
  const id = useUid();
  const buzz = Math.sin(frame * 2.4) * 18;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <defs>
        <radialGradient id={`${id}-b`} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#8ff5e4" /><stop offset="45%" stopColor="#15a3a0" /><stop offset="100%" stopColor="#123a6b" />
        </radialGradient>
        <radialGradient id={`${id}-e`} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#ffb36b" /><stop offset="60%" stopColor="#ff4d2e" /><stop offset="100%" stopColor="#8a1430" />
        </radialGradient>
      </defs>
      {[-1, 1].map((k) => (
        <ellipse key={k} cx={k * 46} cy={-58} rx={68} ry={30} fill="#e6fbff" opacity={0.5} stroke="#bfe9ff" strokeWidth={3}
          transform={`rotate(${k * (28 + buzz)} ${k * 10} -30)`} />))}
      {[-1, 0, 1].map((k) => <path key={k} d={`M${k * 26} 30 q${k * 18} 34 ${k * 36} 46`} stroke="#123a6b" strokeWidth={8}
        strokeLinecap="round" fill="none" />)}
      <ellipse cx={0} cy={18} rx={58} ry={50} fill={`url(#${id}-b)`} stroke="#0f2c52" strokeWidth={6} />
      <path d="M-34 0 Q0 -14 34 0 M-40 24 Q0 10 40 24" stroke="#0f2c52" strokeWidth={4} opacity={0.4} fill="none" />
      <circle cx={0} cy={-34} r={44} fill={`url(#${id}-b)`} stroke="#0f2c52" strokeWidth={6} />
      {[-1, 1].map((k) => (
        <g key={k}>
          <circle cx={k * 30} cy={-42} r={28} fill={`url(#${id}-e)`} stroke="#5a0f26" strokeWidth={5} />
          <circle cx={k * 30 - 8} cy={-52} r={9} fill="#ffffff" opacity={0.9} />
          <path d={`M${k * 12} ${-74} L${k * 50} ${-66}`} stroke="#0f2c52" strokeWidth={9} strokeLinecap="round" />
        </g>
      ))}
      <path d={grin ? 'M-16 -10 Q0 4 16 -10' : 'M-14 -6 Q0 -16 14 -6'} stroke="#0f2c52" strokeWidth={6} fill="none" strokeLinecap="round" />
      <ellipse cx={-22} cy={4} rx={16} ry={8} fill="#ffffff" opacity={0.35} />
    </g>
  );
};

export type CalfMood = 'calm' | 'worried' | 'happy' | 'hurt';
/** A calf with a face. Rounded, soft-lit, a white blaze, ears that flick, a tail that swings. */
export const CalfV2: React.FC<{x: number; y: number; s?: number; frame: number; facing?: 1 | -1; mood?: CalfMood;
  coat?: string; wound?: boolean}> = ({x, y, s = 1, frame, facing = 1, mood = 'calm', coat = '#c4692d', wound = false}) => {
  const id = useUid();
  const t = frame / 30;
  const tail = Math.sin(t * 3.1) * 14;
  const ear = Math.max(0, Math.sin(t * 1.3) - 0.85) * 120;
  const blink = (frame % 102) < 4 ? 0.15 : 1;
  const leg = (lx: number, back: boolean) => (
    <g>
      <rect x={lx - 15} y={-110} width={30} height={110} rx={15} fill={back ? shade(coat, 0.3) : coat} stroke={line(coat)} strokeWidth={6} />
      <rect x={lx - 17} y={-24} width={34} height={26} rx={10} fill="#3b2a35" />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${facing * s} ${s})`}>
      <defs>
        <radialGradient id={`${id}-c`} cx="35%" cy="25%" r="85%">
          <stop offset="0%" stopColor={light(coat, 0.35)} /><stop offset="60%" stopColor={coat} /><stop offset="100%" stopColor={shade(coat, 0.35)} />
        </radialGradient>
      </defs>
      <ContactShadow x={0} y={4} w={320} />
      {leg(-80, true)}{leg(60, true)}
      <path d={`M-120 -160 Q-160 ${-120 + tail} -150 ${-70 + tail}`} stroke={line(coat)} strokeWidth={14} strokeLinecap="round" fill="none" />
      <rect x={-140} y={-230} width={250} height={140} rx={70} fill={`url(#${id}-c)`} stroke={line(coat)} strokeWidth={7} />
      <ellipse cx={-40} cy={-170} rx={34} ry={24} fill="#fff4e6" opacity={0.9} />
      {wound && <g><ellipse cx={10} cy={-150} rx={22} ry={16} fill="#ff4d6d" stroke="#8a1430" strokeWidth={5} />
        <ellipse cx={4} cy={-155} rx={7} ry={4} fill="#ffd0d8" /></g>}
      {leg(-50, false)}{leg(80, false)}
      {/* head */}
      <g transform="translate(120 -230)">
        <path d={`M-18 -46 Q${-60 - ear} -70 -64 -40 Q-40 -30 -14 -30 Z`} fill={shade(coat, 0.15)} stroke={line(coat)} strokeWidth={6} />
        <circle cx={0} cy={0} r={62} fill={`url(#${id}-c)`} stroke={line(coat)} strokeWidth={7} />
        <path d="M-6 -60 Q6 -20 0 10 Q12 -20 14 -58 Z" fill="#fff4e6" />
        <ellipse cx={22} cy={30} rx={40} ry={28} fill="#f3b9a8" stroke={line('#f3b9a8')} strokeWidth={6} />
        <circle cx={12} cy={30} r={5} fill="#7a3c48" /><circle cx={34} cy={30} r={5} fill="#7a3c48" />
        <ellipse cx={-6} cy={-8} rx={13} ry={(mood === 'worried' || mood === 'hurt' ? 15 : 13) * blink} fill="#ffffff" stroke={line(coat)} strokeWidth={4} />
        <ellipse cx={30} cy={-8} rx={13} ry={(mood === 'worried' || mood === 'hurt' ? 15 : 13) * blink} fill="#ffffff" stroke={line(coat)} strokeWidth={4} />
        {blink > 0.5 && <><circle cx={-3} cy={-6} r={7} fill="#21152e" /><circle cx={33} cy={-6} r={7} fill="#21152e" />
          <circle cx={-6} cy={-9} r={2.5} fill="#ffffff" /><circle cx={30} cy={-9} r={2.5} fill="#ffffff" /></>}
        {(mood === 'worried' || mood === 'hurt') && <path d="M-18 -30 L0 -26 M42 -30 L24 -26" stroke={line(coat)} strokeWidth={5} strokeLinecap="round" />}
        {mood === 'happy' && <path d="M10 46 Q22 56 34 46" stroke="#7a3c48" strokeWidth={5} fill="none" strokeLinecap="round" />}
        <path d="M56 -40 q30 -10 36 10" stroke={line(coat)} strokeWidth={6} fill={shade(coat, 0.1)} />
      </g>
    </g>
  );
};

/**
 * GLASS PANEL. A rounded, layered screen with a soft drop shadow, a frosted gradient face, an inner
 * top highlight and a hairline rim. Children draw inside a clip, in panel space (0,0 top left).
 */
export const GlassPanel: React.FC<{x: number; y: number; w: number; h: number; r?: number; tint?: string; rot?: number;
  children?: React.ReactNode}> = ({x, y, w, h, r = 44, tint = '#1b2350', rot = 0, children}) => {
  const id = useUid();
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <defs>
        <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor={light(tint, 0.18)} /><stop offset="100%" stopColor={shade(tint, 0.3)} />
        </linearGradient>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.28} /><stop offset="40%" stopColor="#ffffff" stopOpacity={0.04} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
        </linearGradient>
        <filter id={`${id}-sh`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="22" /></filter>
        <clipPath id={`${id}-clip`}><rect x={18} y={18} width={w - 36} height={h - 36} rx={r - 14} /></clipPath>
      </defs>
      <rect x={14} y={34} width={w} height={h} rx={r} fill="#0b0a24" opacity={0.42} filter={`url(#${id}-sh)`} />
      <rect x={0} y={0} width={w} height={h} rx={r} fill="#1a1d3a" />
      <rect x={4} y={4} width={w - 8} height={h - 8} rx={r - 4} fill="none" stroke="#5b628f" strokeWidth={3} />
      <rect x={18} y={18} width={w - 36} height={h - 36} rx={r - 14} fill={`url(#${id}-f)`} />
      <g clipPath={`url(#${id}-clip)`}>{children}</g>
      <rect x={18} y={18} width={w - 36} height={h - 36} rx={r - 14} fill={`url(#${id}-sheen)`} />
    </g>
  );
};

/** A rounded detection box with corner brackets that breathe. `lock` 0 to 1 tightens and recolours it. */
export const ScanBox: React.FC<{x: number; y: number; w: number; h: number; lock?: number; frame: number;
  color?: string; lockColor?: string}> = ({x, y, w, h, lock = 0, frame, color = '#38f2e0', lockColor = '#ffcc00'}) => {
  const c = lock > 0.5 ? lockColor : color;
  const breathe = (1 - lock) * Math.sin(frame / 30 * 2 * Math.PI * 1.2) * 8;
  const L = 46;
  const corner = (cx: number, cy: number, sx: number, sy: number) => (
    <path d={`M${cx} ${cy + sy * L} L${cx} ${cy + sy * 14} Q${cx} ${cy} ${cx + sx * 14} ${cy} L${cx + sx * L} ${cy}`}
      stroke={c} strokeWidth={10} strokeLinecap="round" fill="none" />
  );
  const b = breathe;
  return (
    <g>
      <rect x={x - b} y={y - b} width={w + b * 2} height={h + b * 2} rx={24} fill={c} opacity={0.12 + lock * 0.1} />
      {corner(x - b, y - b, 1, 1)}{corner(x + w + b, y - b, -1, 1)}{corner(x - b, y + h + b, 1, -1)}{corner(x + w + b, y + h + b, -1, -1)}
    </g>
  );
};

/** A burst of soft round sparks, for a beat that lands (a snag freed, a lock found). p runs 0 to 1. */
export const Burst: React.FC<{x: number; y: number; p: number; color?: string; n?: number; r?: number}> = ({
  x, y, p, color = '#ffe066', n = 10, r = 150,
}) => {
  if (p <= 0 || p >= 1) return null;
  const e = 1 - Math.pow(1 - p, 3);
  return (
    <g opacity={1 - p}>
      {Array.from({length: n}).map((_, i) => {
        const a = (i / n) * Math.PI * 2;
        return <circle key={i} cx={x + Math.cos(a) * r * e} cy={y + Math.sin(a) * r * e} r={14 * (1 - p) + 4} fill={color} />;
      })}
      <circle cx={x} cy={y} r={r * 0.7 * e} fill="none" stroke={color} strokeWidth={8 * (1 - p)} />
    </g>
  );
};
