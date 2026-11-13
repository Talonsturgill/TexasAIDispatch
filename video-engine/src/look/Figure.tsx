import React, {useId} from 'react';
import {line, light, mix, shade} from './color';

/**
 * FIGURE, the look v2 person (November 13th, 2026).
 *
 * The owner on the old cast: "sometimes I'll see a floating arm ... it's so 2D. You could tell it's
 * code as art." The old rig draws thin tube limbs with black ink, so the arm reads as a stick laid
 * over a coat. This rig is built the other way round.
 *
 *  ATTACHED LIMBS. An arm is one continuous rounded stroke that STARTS INSIDE the torso at a
 *    shoulder socket. Its outline is drawn first, a shoulder cap in the shirt colour covers the
 *    outline where arm meets body, then the sleeve. There is no seam to float. Elbow and wrist come
 *    from a two-bone solve, so the hand is always at the end of the forearm.
 *  VOLUME. Head and body take a gradient from a lit side to a shade side, a rim of light on the far
 *    edge, an occlusion shadow under the head and a soft contact shadow at the feet. The shade is
 *    the fill's own hue pushed toward violet (look/color.ts), so it never goes muddy.
 *  APPEAL. Big head, short soft body, round hands, eyes with a catchlight, brows that act. Every
 *    corner is round. Line work is the fill's own deep hue at 7 units, never black.
 *  LIFE. Breath, a head bob, a blink every few seconds and an arm sway, all from `frame`, so a held
 *    figure is never frozen. Pose and emotion are props: change them ON the beat.
 *
 * Draw space: feet at (0, 0), about 560 units tall at scale 1. One skin fill never changes line
 * work, and every face uses the same shapes, per the two laws of drawing Texas in CLAUDE.md.
 */
export type FigurePose = 'stand' | 'wave' | 'point' | 'cheer' | 'think' | 'hold' | 'shrug' | 'reach' | 'hips';
export type FigureEmotion = 'neutral' | 'happy' | 'excited' | 'worried' | 'surprised' | 'thinking' | 'proud' |
  'determined';
export type FigureHat = 'none' | 'cap' | 'hardhat' | 'straw' | 'beanie';
export type FigureHair = 'short' | 'curly' | 'bun' | 'long' | 'bald' | 'afro' | 'buzz';
export type FigureTop = 'tee' | 'vest' | 'labcoat' | 'snap' | 'scrubs' | 'jacket';

export interface FigureProps {
  frame: number;
  x: number;
  y: number;
  scale?: number;
  pose?: FigurePose;
  emotion?: FigureEmotion;
  skin?: string;
  hair?: FigureHair;
  hairColor?: string;
  hat?: FigureHat;
  hatColor?: string;
  top?: FigureTop;
  shirt?: string;
  pants?: string;
  /** -1 to 1, turns the face toward screen left or right */
  turn?: number;
  /** 0 to 1, blends from the previous pose's arms, for a beat change that moves rather than pops */
  poseBlend?: number;
  fromPose?: FigurePose;
  /** walk cycle phase in seconds; leave undefined to stand */
  walk?: number;
  seed?: number;
  /** a drawing held in the hands, placed at the hands' midpoint (pose 'hold' or 'reach') */
  holding?: React.ReactNode;
}

export const SKIN_TONES = ['#f6d3b3', '#e8b48a', '#c98a5a', '#9a6440', '#6e4428', '#4a2d1c'];

/** arm angles per pose: [upper, fore] in degrees, 0 is straight down, positive swings OUTWARD */
const ARMS: Record<FigurePose, {l: [number, number]; r: [number, number]}> = {
  stand: {l: [10, 8], r: [10, 8]},
  wave: {l: [10, 8], r: [140, 35]},
  point: {l: [12, 10], r: [92, 2]},
  cheer: {l: [158, 12], r: [158, 12]},
  think: {l: [14, 10], r: [30, 168]},
  hold: {l: [16, -86], r: [16, -86]},
  shrug: {l: [48, -112], r: [48, -112]},
  reach: {l: [52, -40], r: [52, -40]},
  hips: {l: [44, -118], r: [44, -118]},
};

const UP = 92, FORE = 86, SHOULDER_X = 64, SHOULDER_Y = -318;

const solve = (side: 1 | -1, up: number, fore: number, sx: number, sy: number) => {
  const a1 = (side * up * Math.PI) / 180;
  const ex = sx + Math.sin(a1) * UP, ey = sy + Math.cos(a1) * UP;
  const a2 = (side * (up + fore) * Math.PI) / 180;
  return {sx, sy, ex, ey, wx: ex + Math.sin(a2) * FORE, wy: ey + Math.cos(a2) * FORE};
};

/** where the hands are, in figure space, so an episode can put a prop in them */
export const figureHands = (pose: FigurePose) => {
  const a = ARMS[pose];
  const l = solve(-1, a.l[0], a.l[1], -SHOULDER_X, SHOULDER_Y);
  const r = solve(1, a.r[0], a.r[1], SHOULDER_X, SHOULDER_Y);
  return {l: {x: l.wx, y: l.wy}, r: {x: r.wx, y: r.wy}};
};

const blinkAt = (frame: number, seed: number) => {
  const period = 96 + (seed % 5) * 11;
  const k = (frame + seed * 17) % period;
  return k < 4 ? [1, 0.25, 0.1, 0.5][k] : 1;
};

export const Figure: React.FC<FigureProps> = ({
  frame, x, y, scale = 1, pose = 'stand', emotion = 'neutral', skin = SKIN_TONES[2], hair = 'short',
  hairColor = '#2b1a12', hat = 'none', hatColor = '#e8c36a', top = 'tee', shirt = '#3b82f6',
  pants = '#334155', turn = 0, poseBlend = 1, fromPose, walk, seed = 1, holding,
}) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const t = frame / 30;
  const breath = Math.sin(t * 2 * Math.PI / 3.6 + seed) * 0.012;
  const bob = Math.sin(t * 2 * Math.PI / 3.6 + seed) * 3;
  const sway = Math.sin(t * 2 * Math.PI / 4.4 + seed * 1.3) * 4;
  const blink = blinkAt(frame, seed);
  const walking = walk !== undefined;
  const step = walking ? Math.sin((walk as number) * 2 * Math.PI * 1.6) : 0;

  const lerpArm = (side: 'l' | 'r') => {
    const to = ARMS[pose][side];
    const from = ARMS[fromPose ?? pose][side];
    const b = Math.max(0, Math.min(1, poseBlend));
    const e = b < 1 ? 1 - Math.pow(1 - b, 3) : 1;
    let up = from[0] + (to[0] - from[0]) * e;
    let fore = from[1] + (to[1] - from[1]) * e;
    if (pose === 'wave' && side === 'r') fore += Math.sin(t * 2 * Math.PI * 1.8) * 22;
    if (pose === 'cheer') up += Math.sin(t * 2 * Math.PI * 1.4 + (side === 'l' ? 0 : 1)) * 6;
    if (pose === 'stand' || pose === 'point') up += (side === 'l' ? 1 : -1) * sway * 0.4;
    if (walking && (pose === 'stand')) up += (side === 'l' ? step : -step) * 16;
    return [up, fore] as const;
  };
  const [lu, lf] = lerpArm('l');
  const [ru, rf] = lerpArm('r');
  const L = solve(-1, lu, lf, -SHOULDER_X, SHOULDER_Y + bob * 0.6);
  const R = solve(1, ru, rf, SHOULDER_X, SHOULDER_Y + bob * 0.6);

  const shirtTone = top === 'labcoat' ? '#f4f6fb' : top === 'vest' ? shirt : shirt;
  const skinS = shade(skin, 0.3), skinL = light(skin, 0.22);
  const shirtS = shade(shirtTone, 0.34), shirtL = light(shirtTone, 0.25);
  const pantsS = shade(pants, 0.3);
  const ink = (c: string) => line(c);
  const headY = -420 + bob, headR = 84;
  const fx = turn * 16;

  const arm = (A: ReturnType<typeof solve>, front: boolean) => {
    const d = `M${A.sx} ${A.sy} L${A.ex} ${A.ey} L${A.wx} ${A.wy}`;
    return (
      <g>
        <path d={d} stroke={ink(shirtTone)} strokeWidth={50} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {front && <circle cx={A.sx} cy={A.sy} r={30} fill={`url(#${uid}-shirt)`} />}
        <path d={d} stroke={front ? shirtTone : shirtS} strokeWidth={36} strokeLinecap="round"
          strokeLinejoin="round" fill="none" />
        <path d={`M${A.sx} ${A.sy} L${A.ex} ${A.ey}`} stroke={shirtL} strokeWidth={9} strokeLinecap="round"
          opacity={front ? 0.5 : 0.2} transform="translate(-7 -5)" />
        <circle cx={A.wx} cy={A.wy} r={25} fill={front ? skin : skinS} stroke={ink(skin)} strokeWidth={6} />
        <circle cx={A.wx - 7} cy={A.wy - 8} r={8} fill={skinL} opacity={front ? 0.7 : 0.3} />
      </g>
    );
  };

  const legX = 34;
  const leg = (side: 1 | -1) => {
    const swing = walking ? side * step * 22 : 0;
    const top = -150, foot = -16;
    return (
      <g>
        <path d={`M${side * legX} ${top} L${side * legX + swing} ${foot}`} stroke={ink(pants)} strokeWidth={56}
          strokeLinecap="round" />
        <path d={`M${side * legX} ${top} L${side * legX + swing} ${foot}`} stroke={side < 0 ? pants : pantsS}
          strokeWidth={42} strokeLinecap="round" />
        <ellipse cx={side * legX + swing + side * 10} cy={-8} rx={40} ry={22} fill="#2b2440"
          stroke={ink('#2b2440')} strokeWidth={6} />
        <ellipse cx={side * legX + swing + side * 2} cy={-16} rx={18} ry={7} fill="#6b6390" opacity={0.6} />
      </g>
    );
  };

  const brows: Record<FigureEmotion, [number, number, number]> = {
    // [inner lift, outer lift, height]
    neutral: [0, 0, 0], happy: [2, 4, 4], excited: [6, 6, 10], worried: [10, -6, 4], surprised: [10, 10, 14],
    thinking: [-4, 6, 2], proud: [-2, 2, 2], determined: [-10, 4, -2],
  };
  const [bi, bo, bh] = brows[emotion];
  const mouth = (() => {
    const mx = fx, my = headY + 40;
    switch (emotion) {
      case 'happy': case 'proud':
        return <path d={`M${mx - 26} ${my - 4} Q${mx} ${my + 22} ${mx + 26} ${my - 4}`} stroke={ink(skin)}
          strokeWidth={7} fill="none" strokeLinecap="round" />;
      case 'excited':
        return <path d={`M${mx - 30} ${my - 8} Q${mx} ${my + 36} ${mx + 30} ${my - 8} Z`} fill="#6b1d3a"
          stroke={ink(skin)} strokeWidth={6} strokeLinejoin="round" />;
      case 'surprised':
        return <ellipse cx={mx} cy={my + 4} rx={13} ry={17} fill="#6b1d3a" stroke={ink(skin)} strokeWidth={6} />;
      case 'worried':
        return <path d={`M${mx - 22} ${my + 8} Q${mx - 6} ${my - 4} ${mx + 4} ${my + 4} T${mx + 24} ${my + 2}`}
          stroke={ink(skin)} strokeWidth={7} fill="none" strokeLinecap="round" />;
      case 'thinking':
        return <path d={`M${mx - 18} ${my + 4} L${mx + 18} ${my - 2}`} stroke={ink(skin)} strokeWidth={7}
          strokeLinecap="round" />;
      case 'determined':
        return <path d={`M${mx - 20} ${my + 2} Q${mx} ${my + 8} ${mx + 20} ${my + 2}`} stroke={ink(skin)}
          strokeWidth={7} fill="none" strokeLinecap="round" />;
      default:
        return <path d={`M${mx - 16} ${my + 2} Q${mx} ${my + 10} ${mx + 16} ${my + 2}`} stroke={ink(skin)}
          strokeWidth={7} fill="none" strokeLinecap="round" />;
    }
  })();
  const eyeOpen = emotion === 'surprised' ? 1.18 : emotion === 'happy' || emotion === 'proud' ? 0.82 : 1;
  const eye = (side: 1 | -1) => {
    const ex = fx + side * 30, ey = headY + 2;
    return (
      <g>
        <ellipse cx={ex} cy={ey} rx={17} ry={21 * eyeOpen * blink} fill="#ffffff" stroke={ink(skin)} strokeWidth={5} />
        {blink > 0.4 && <>
          <circle cx={ex + turn * 5} cy={ey + 2} r={11 * Math.min(1, blink + 0.2)} fill="#1f1736" />
          <circle cx={ex + turn * 5 - 4} cy={ey - 3} r={4} fill="#ffffff" />
        </>}
        <path d={`M${ex - side * 16} ${ey - 34 - bh - bi} Q${ex} ${ey - 40 - bh} ${ex + side * 16} ${ey - 34 - bh - bo}`}
          stroke={hairColor} strokeWidth={8} fill="none" strokeLinecap="round" />
      </g>
    );
  };

  const hairShape = () => {
    const hc = hairColor, hs = shade(hairColor, 0.3), hl = light(hairColor, 0.35);
    const top = headY - headR;
    switch (hair) {
      case 'bald': return null;
      case 'buzz':
        return <path d={`M${-headR + 4} ${headY - 10} A${headR - 4} ${headR - 4} 0 0 1 ${headR - 4} ${headY - 10}
          Q${headR - 30} ${headY - 52} 0 ${headY - 58} Q${-headR + 30} ${headY - 52} ${-headR + 4} ${headY - 10} Z`}
          fill={hc} opacity={0.9} />;
      case 'curly': case 'afro': {
        const r = hair === 'afro' ? 34 : 24, n = hair === 'afro' ? 9 : 8, spread = hair === 'afro' ? 1.25 : 1.05;
        return <g>{Array.from({length: n}).map((_, i) => {
          const a = Math.PI * (1.05 + (i / (n - 1)) * 0.9);
          return <circle key={i} cx={Math.cos(a) * headR * spread} cy={headY - 6 + Math.sin(a) * headR * spread}
            r={r} fill={i % 2 ? hc : hs} stroke={ink(hc)} strokeWidth={5} />;
        })}</g>;
      }
      case 'bun':
        return <g>
          <circle cx={0} cy={top - 18} r={30} fill={hc} stroke={ink(hc)} strokeWidth={6} />
          <path d={`M${-headR - 2} ${headY + 6} A${headR + 2} ${headR + 2} 0 0 1 ${headR + 2} ${headY + 6}
            Q${headR - 20} ${headY - 34} ${fx + 10} ${headY - 44} Q${-headR + 18} ${headY - 30} ${-headR - 2} ${headY + 6} Z`}
            fill={hc} stroke={ink(hc)} strokeWidth={6} />
        </g>;
      case 'long':
        return <path d={`M${-headR - 8} ${headY + 70} Q${-headR - 18} ${headY - 40} 0 ${top - 6}
          Q${headR + 18} ${headY - 40} ${headR + 8} ${headY + 70} L${headR - 14} ${headY + 70}
          Q${headR - 10} ${headY - 30} ${fx + 6} ${headY - 46} Q${-headR + 10} ${headY - 30} ${-headR + 14} ${headY + 70} Z`}
          fill={hc} stroke={ink(hc)} strokeWidth={6} strokeLinejoin="round" />;
      default:
        return <g>
          <path d={`M${-headR - 2} ${headY - 4} A${headR + 2} ${headR + 2} 0 0 1 ${headR + 2} ${headY - 4}
            Q${headR - 16} ${headY - 44} ${fx + 24} ${headY - 50} Q${-10} ${headY - 30} ${-headR - 2} ${headY - 4} Z`}
            fill={hc} stroke={ink(hc)} strokeWidth={6} strokeLinejoin="round" />
          <path d={`M${-30} ${top + 14} Q${0} ${top + 4} ${30} ${top + 16}`} stroke={hl} strokeWidth={7}
            fill="none" strokeLinecap="round" opacity={0.6} />
        </g>;
    }
  };

  const hatShape = () => {
    const hs = shade(hatColor, 0.3), hl = light(hatColor, 0.35), top = headY - headR;
    switch (hat) {
      case 'cap':
        return <g>
          <path d={`M${-headR + 2} ${headY - 16} A${headR - 2} ${headR - 6} 0 0 1 ${headR - 2} ${headY - 16} Z`}
            fill={hatColor} stroke={ink(hatColor)} strokeWidth={7} />
          <path d={`M${fx + 10} ${headY - 18} Q${fx + 70 + turn * 20} ${headY - 22} ${fx + 104 + turn * 20} ${headY - 8}
            L${fx + 10} ${headY - 6} Z`} fill={hs} stroke={ink(hatColor)} strokeWidth={7} strokeLinejoin="round" />
          <circle cx={0} cy={top + 4} r={8} fill={hs} />
          <path d={`M${-44} ${top + 30} Q0 ${top + 14} ${40} ${top + 30}`} stroke={hl} strokeWidth={8} fill="none"
            strokeLinecap="round" opacity={0.6} />
        </g>;
      case 'hardhat':
        return <g>
          <path d={`M${-headR - 24} ${headY - 18} Q0 ${headY - 34} ${headR + 24} ${headY - 18} L${headR + 24} ${headY - 6}
            Q0 ${headY - 20} ${-headR - 24} ${headY - 6} Z`} fill={hs} stroke={ink(hatColor)} strokeWidth={7}
            strokeLinejoin="round" />
          <path d={`M${-headR + 4} ${headY - 22} Q${-headR + 6} ${top - 24} 0 ${top - 24} Q${headR - 6} ${top - 24}
            ${headR - 4} ${headY - 22} Z`} fill={hatColor} stroke={ink(hatColor)} strokeWidth={7} />
          <path d={`M-12 ${top - 22} L-12 ${headY - 26} M12 ${top - 22} L12 ${headY - 26}`} stroke={hs} strokeWidth={9}
            strokeLinecap="round" />
          <path d={`M${-50} ${top + 2} Q${-30} ${top - 18} ${-6} ${top - 20}`} stroke={hl} strokeWidth={9} fill="none"
            strokeLinecap="round" opacity={0.8} />
        </g>;
      case 'straw':
        return <g>
          <ellipse cx={turn * 6} cy={headY - 30} rx={headR + 70} ry={26} fill={hatColor} stroke={ink(hatColor)}
            strokeWidth={7} />
          <path d={`M${-headR + 12} ${headY - 34} Q${-headR + 8} ${top - 30} ${-10} ${top - 26} Q0 ${top - 14} ${10}
            ${top - 26} Q${headR - 8} ${top - 30} ${headR - 12} ${headY - 34} Z`} fill={hatColor}
            stroke={ink(hatColor)} strokeWidth={7} strokeLinejoin="round" />
          <path d={`M${-headR + 10} ${headY - 42} Q0 ${headY - 52} ${headR - 10} ${headY - 42}`} stroke="#8a3b2e"
            strokeWidth={12} fill="none" />
          <ellipse cx={turn * 6 - 30} cy={headY - 36} rx={60} ry={8} fill={hl} opacity={0.5} />
        </g>;
      case 'beanie':
        return <g>
          <path d={`M${-headR + 2} ${headY - 14} Q${-headR} ${top - 20} 0 ${top - 22} Q${headR} ${top - 20} ${headR - 2}
            ${headY - 14} Z`} fill={hatColor} stroke={ink(hatColor)} strokeWidth={7} />
          <rect x={-headR - 2} y={headY - 30} width={headR * 2 + 4} height={28} rx={14} fill={hs}
            stroke={ink(hatColor)} strokeWidth={7} />
        </g>;
      default: return null;
    }
  };

  const torsoTop = -350 + bob * 0.6, torsoBot = -128;
  const torso = `M${-78} ${torsoTop + 30} Q${-82} ${torsoTop} ${-40} ${torsoTop - 4} L${40} ${torsoTop - 4}
    Q${82} ${torsoTop} ${78} ${torsoTop + 30} L${86} ${torsoBot - 10} Q${86} ${torsoBot + 14} ${60} ${torsoBot + 14}
    L${-60} ${torsoBot + 14} Q${-86} ${torsoBot + 14} ${-86} ${torsoBot - 10} Z`;

  const holdAt = {x: (L.wx + R.wx) / 2, y: Math.min(L.wy, R.wy) - 10};

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <radialGradient id={`${uid}-skin`} cx="38%" cy="32%" r="78%">
          <stop offset="0%" stopColor={skinL} /><stop offset="58%" stopColor={skin} /><stop offset="100%" stopColor={skinS} />
        </radialGradient>
        <linearGradient id={`${uid}-shirt`} x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0%" stopColor={shirtL} /><stop offset="45%" stopColor={shirtTone} /><stop offset="100%" stopColor={shirtS} />
        </linearGradient>
        <filter id={`${uid}-soft`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10" /></filter>
        <clipPath id={`${uid}-torso`}><path d={torso} /></clipPath>
        <clipPath id={`${uid}-head`}><circle cx={0} cy={headY} r={headR} /></clipPath>
      </defs>
      {/* contact shadow */}
      <ellipse cx={0} cy={4} rx={118} ry={22} fill="#1a1236" opacity={0.32} filter={`url(#${uid}-soft)`} />
      {leg(-1)}{leg(1)}
      {arm(L, false)}
      {/* torso with volume, rim and outfit */}
      <path d={torso} fill={`url(#${uid}-shirt)`} stroke={ink(shirtTone)} strokeWidth={7} strokeLinejoin="round"
        transform={`scale(1 ${1 + breath})`} />
      <g clipPath={`url(#${uid}-torso)`}>
        <path d={torso} fill="none" stroke={light(shirtTone, 0.6)} strokeWidth={14} opacity={0.45}
          transform="translate(-10 0)" />
        {top === 'vest' && <>
          <path d={`M-86 ${torsoTop} L-34 ${torsoTop} L-20 ${torsoBot + 20} L-86 ${torsoBot + 20} Z
            M86 ${torsoTop} L34 ${torsoTop} L20 ${torsoBot + 20} L86 ${torsoBot + 20} Z`} fill="#ff8a1f" opacity={0.95} />
          <rect x={-86} y={-232} width={66} height={14} fill="#f4f4f0" /><rect x={20} y={-232} width={66} height={14} fill="#f4f4f0" />
        </>}
        {top === 'labcoat' && <path d={`M0 ${torsoTop + 10} L0 ${torsoBot + 20}`} stroke={shade('#f4f6fb', 0.25)} strokeWidth={6} />}
        {top === 'snap' && [0, 1, 2, 3].map((i) => <circle key={i} cx={0} cy={torsoTop + 40 + i * 44} r={6}
          fill={light(shirtTone, 0.7)} stroke={ink(shirtTone)} strokeWidth={3} />)}
        {top === 'jacket' && <path d={`M0 ${torsoTop + 8} L0 ${torsoBot + 20}`} stroke={shirtS} strokeWidth={10} />}
        {/* occlusion under the head */}
        <ellipse cx={0} cy={torsoTop + 6} rx={70} ry={26} fill={shirtS} opacity={0.55} filter={`url(#${uid}-soft)`} />
      </g>
      {/* collar and neck */}
      <path d={`M-30 ${torsoTop - 2} Q0 ${torsoTop + 30} 30 ${torsoTop - 2}`} fill={skinS} stroke={ink(skin)} strokeWidth={6} />
      {/* head */}
      <circle cx={0} cy={headY} r={headR} fill={`url(#${uid}-skin)`} stroke={ink(skin)} strokeWidth={7} />
      <g clipPath={`url(#${uid}-head)`}>
        <circle cx={14} cy={headY + 8} r={headR} fill="none" stroke={skinS} strokeWidth={18} opacity={0.35} />
        <circle cx={-12} cy={headY - 4} r={headR} fill="none" stroke={light(skin, 0.7)} strokeWidth={10} opacity={0.4} />
      </g>
      <ellipse cx={-headR + 4} cy={headY + 8} rx={14} ry={20} fill={skin} stroke={ink(skin)} strokeWidth={6} />
      <ellipse cx={headR - 4} cy={headY + 8} rx={14} ry={20} fill={skinS} stroke={ink(skin)} strokeWidth={6} />
      {hairShape()}
      {eye(-1)}{eye(1)}
      <ellipse cx={fx + 2} cy={headY + 22} rx={9} ry={7} fill={skinS} opacity={0.8} />
      <circle cx={fx - 46} cy={headY + 30} r={13} fill="#ff6b8a" opacity={0.28} />
      <circle cx={fx + 46} cy={headY + 30} r={13} fill="#ff6b8a" opacity={0.28} />
      {mouth}
      {hatShape()}
      {holding && (pose === 'hold' || pose === 'reach') && <g transform={`translate(${holdAt.x} ${holdAt.y})`}>{holding}</g>}
      {arm(R, true)}
      {(pose === 'hold' || pose === 'reach' || pose === 'hips' || pose === 'shrug') && arm(L, true)}
    </g>
  );
};

/** a quick cast, so a v2 film is never one person repeated: same shapes, different people */
export const CAST_V2: Record<string, Partial<FigureProps>> = {
  rancher: {skin: SKIN_TONES[3], hair: 'short', hairColor: '#24160f', hat: 'straw', hatColor: '#e9c46a',
    top: 'snap', shirt: '#3d8bd9', pants: '#2c3e66'},
  engineer: {skin: SKIN_TONES[1], hair: 'bun', hairColor: '#5a2e1a', hat: 'hardhat', hatColor: '#ffc93c',
    top: 'vest', shirt: '#2563eb', pants: '#1f2a44'},
  nurse: {skin: SKIN_TONES[4], hair: 'curly', hairColor: '#1a0f0a', top: 'scrubs', shirt: '#14b8a6',
    pants: '#0f766e'},
  coder: {skin: SKIN_TONES[0], hair: 'long', hairColor: '#c2662d', top: 'tee', shirt: '#8b5cf6', pants: '#334155'},
  teacher: {skin: SKIN_TONES[2], hair: 'afro', hairColor: '#20140e', top: 'jacket', shirt: '#ef4444',
    pants: '#3f3f46'},
  scientist: {skin: SKIN_TONES[5], hair: 'buzz', hairColor: '#0f0a08', top: 'labcoat', shirt: '#f4f6fb',
    pants: '#475569'},
  trucker: {skin: SKIN_TONES[1], hair: 'short', hairColor: '#7a7a7a', hat: 'cap', hatColor: '#dc2626',
    top: 'tee', shirt: '#0ea5e9', pants: '#1e3a8a'},
  farmer: {skin: SKIN_TONES[2], hair: 'short', hairColor: '#2b1a12', hat: 'cap', hatColor: '#16a34a',
    top: 'snap', shirt: '#f59e0b', pants: '#3b4a6b'},
};
export const castV2 = (id: string): Partial<FigureProps> => CAST_V2[id] ?? CAST_V2.rancher;
export {mix};
