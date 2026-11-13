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
export type FigurePose = 'stand' | 'wave' | 'point' | 'cheer' | 'think' | 'hold' | 'shrug' | 'reach' | 'hips' |
  'crossed' | 'panic' | 'raise';
export type FigureEmotion = 'neutral' | 'happy' | 'excited' | 'worried' | 'surprised' | 'thinking' | 'proud' |
  'determined' | 'angry' | 'smug';
/** felt and straw are the working cowboy hats (felt Labor Day to Easter), palm is the norteno palm straw with
 * its taller narrower crown and flatter brim, mesh is the gimme cap, hood is a hard hat over an FR balaclava */
export type FigureHat = 'none' | 'cap' | 'hardhat' | 'straw' | 'beanie' | 'felt' | 'palm' | 'mesh' | 'hood' | 'scrubcap';
export type FigureHair = 'short' | 'curly' | 'bun' | 'long' | 'bald' | 'afro' | 'buzz';
export type FigureTop = 'tee' | 'vest' | 'labcoat' | 'snap' | 'scrubs' | 'jacket' | 'coveralls' | 'linefr' | 'polo' |
  'blazer' | 'suit' | 'hivis' | 'apron';

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
  glasses?: boolean;
  /** 0 slight to 1 heavy: widens the torso and moves the shoulders with it */
  build?: number;
  /** the outfit's second colour: reflective tape, harness, apron, lapel shirt, badge lanyard */
  trim?: string;
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
  hips: {l: [50, -74], r: [50, -74]},
  crossed: {l: [6, -112], r: [10, -104]},
  panic: {l: [128, 52], r: [128, 52]},
  raise: {l: [10, 8], r: [172, 6]},
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
  pants = '#334155', turn = 0, poseBlend = 1, fromPose, walk, seed = 1, holding, glasses = false, build = 0.5,
  trim = '#e8ecf2',
}) => {
  const bw = 0.88 + Math.max(0, Math.min(1, build)) * 0.28, SX = SHOULDER_X * bw;
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
  const L = solve(-1, lu, lf, -SX, SHOULDER_Y + bob * 0.6);
  const R = solve(1, ru, rf, SX, SHOULDER_Y + bob * 0.6);

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
    thinking: [-4, 6, 2], proud: [-2, 2, 2], determined: [-10, 4, -2], angry: [-16, 8, -4], smug: [-4, 4, 0],
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
      case 'angry':
        return <path d={`M${mx - 22} ${my + 10} Q${mx} ${my - 6} ${mx + 22} ${my + 10}`} stroke={ink(skin)}
          strokeWidth={7} fill="none" strokeLinecap="round" />;
      case 'smug':
        return <path d={`M${mx - 18} ${my + 4} Q${mx + 4} ${my + 8} ${mx + 24} ${my - 6}`} stroke={ink(skin)}
          strokeWidth={7} fill="none" strokeLinecap="round" />;
      case 'determined':
        return <path d={`M${mx - 20} ${my + 2} Q${mx} ${my + 8} ${mx + 20} ${my + 2}`} stroke={ink(skin)}
          strokeWidth={7} fill="none" strokeLinecap="round" />;
      default:
        return <path d={`M${mx - 16} ${my + 2} Q${mx} ${my + 10} ${mx + 16} ${my + 2}`} stroke={ink(skin)}
          strokeWidth={7} fill="none" strokeLinecap="round" />;
    }
  })();
  const eyeOpen = emotion === 'surprised' ? 1.18 : emotion === 'happy' || emotion === 'proud' ? 0.82 :
    emotion === 'smug' ? 0.62 : emotion === 'angry' ? 0.85 : 1;
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
      case 'felt': case 'palm': {
        // a working cowboy hat: the brim curls up at both sides, the crown is pinched at the front
        const palm = hat === 'palm', bw2 = palm ? headR + 52 : headR + 74, ch = palm ? 92 : 74, cw = palm ? headR - 22 : headR - 10;
        const by = headY - 32;
        return <g>
          <path d={`M${-bw2 + turn * 6} ${by - (palm ? 4 : 18)} Q${-bw2 * 0.55} ${by + 22} ${turn * 6} ${by + 20} Q${bw2 * 0.55}
            ${by + 22} ${bw2 + turn * 6} ${by - (palm ? 4 : 18)} Q${bw2 * 0.6} ${by + 2} ${turn * 6} ${by + 2} Q${-bw2 * 0.6} ${by + 2}
            ${-bw2 + turn * 6} ${by - (palm ? 4 : 18)} Z`} fill={hs} stroke={ink(hatColor)} strokeWidth={7} strokeLinejoin="round" />
          <path d={`M${-cw} ${by + 2} Q${-cw - 4} ${by - ch} ${-14} ${by - ch - 4} Q0 ${by - ch + 14} ${14} ${by - ch - 4}
            Q${cw + 4} ${by - ch} ${cw} ${by + 2} Q0 ${by + 10} ${-cw} ${by + 2} Z`} fill={hatColor} stroke={ink(hatColor)}
            strokeWidth={7} strokeLinejoin="round" />
          <path d={`M${-cw + 2} ${by - 12} Q0 ${by - 4} ${cw - 2} ${by - 12}`} stroke={palm ? shade(hatColor, 0.45) : '#2a1d16'}
            strokeWidth={palm ? 8 : 12} fill="none" />
          <path d={`M${-cw + 14} ${by - ch * 0.55} Q${-cw + 10} ${by - ch + 6} ${-18} ${by - ch + 2}`} stroke={hl} strokeWidth={8}
            fill="none" strokeLinecap="round" opacity={0.55} />
          {palm && [0.25, 0.5, 0.75].map((f) => <path key={f} d={`M${-cw + 6} ${by - ch * f} Q0 ${by - ch * f + 8} ${cw - 6} ${by - ch * f}`}
            stroke={hs} strokeWidth={3} fill="none" opacity={0.6} />)}
        </g>;
      }
      case 'mesh':
        return <g>
          <path d={`M${-headR + 2} ${headY - 16} A${headR - 2} ${headR - 2} 0 0 1 ${headR - 2} ${headY - 16} Z`} fill={light(hatColor, 0.75)}
            stroke={ink(hatColor)} strokeWidth={7} />
          {[0, 1, 2, 3, 4, 5].map((i) => <circle key={i} cx={30 + (i % 3) * 16} cy={headY - 36 - Math.floor(i / 3) * 16} r={3}
            fill={shade(hatColor, 0.2)} opacity={0.5} />)}
          <path d={`M${-headR + 6} ${headY - 18} Q${-headR + 4} ${top - 2} ${-6} ${top - 4} Q${24} ${top} ${30} ${headY - 18} Z`}
            fill={hatColor} stroke={ink(hatColor)} strokeWidth={7} strokeLinejoin="round" />
          <rect x={-46} y={headY - 52} width={50} height={22} rx={8} fill={light(hatColor, 0.8)} opacity={0.9} />
          <path d={`M${-headR - 4 + fx} ${headY - 16} Q${-30 + fx} ${headY - 6} ${30 + fx} ${headY - 14} L${30 + fx} ${headY - 6}
            Q${-30 + fx} ${headY + 8} ${-headR - 34 + fx} ${headY - 2} Z`} fill={hs} stroke={ink(hatColor)} strokeWidth={7}
            strokeLinejoin="round" />
        </g>;
      case 'scrubcap':
        return <g>
          <path d={`M${-headR - 2} ${headY - 8} Q${-headR - 4} ${top - 18} 0 ${top - 16} Q${headR + 4} ${top - 18} ${headR + 2}
            ${headY - 8} Q0 ${headY - 26} ${-headR - 2} ${headY - 8} Z`} fill={hatColor} stroke={ink(hatColor)} strokeWidth={7} />
          {[[-40, -44], [-6, -60], [30, -48], [-24, -24], [14, -30], [48, -24]].map(([dx, dy], i) =>
            <circle key={i} cx={dx} cy={headY + dy} r={6} fill={light(hatColor, 0.55)} opacity={0.8} />)}
          <path d={`M${headR - 6} ${headY - 18} q22 4 30 22 M${headR - 6} ${headY - 18} q26 -6 36 6`} stroke={hatColor}
            strokeWidth={9} strokeLinecap="round" fill="none" />
        </g>;
      case 'hood':
        return <g>
          <path d={`M${-headR - 24} ${headY - 18} Q0 ${headY - 34} ${headR + 24} ${headY - 18} L${headR + 24} ${headY - 6}
            Q0 ${headY - 20} ${-headR - 24} ${headY - 6} Z`} fill={hs} stroke={ink(hatColor)} strokeWidth={7} strokeLinejoin="round" />
          <path d={`M${-headR + 4} ${headY - 22} Q${-headR + 6} ${top - 24} 0 ${top - 24} Q${headR - 6} ${top - 24}
            ${headR - 4} ${headY - 22} Z`} fill={hatColor} stroke={ink(hatColor)} strokeWidth={7} />
          <path d={`M${-50} ${top + 2} Q${-30} ${top - 18} ${-6} ${top - 20}`} stroke={hl} strokeWidth={9} fill="none"
            strokeLinecap="round" opacity={0.8} />
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
      <g transform={`scale(${bw} 1)`}>
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
        {(top === 'coveralls' || top === 'hivis') && <>
          <rect x={-90} y={torsoTop + 96} width={180} height={16} fill={trim} opacity={0.95} />
          <rect x={-90} y={torsoBot - 6} width={180} height={16} fill={trim} opacity={0.95} />
        </>}
        {top === 'coveralls' && <path d={`M0 ${torsoTop + 10} L0 ${torsoBot + 20}`} stroke={shirtS} strokeWidth={6} />}
        {top === 'hivis' && <path d={`M-86 ${torsoTop} L-34 ${torsoTop} L-20 ${torsoBot + 20} L-86 ${torsoBot + 20} Z
            M86 ${torsoTop} L34 ${torsoTop} L20 ${torsoBot + 20} L86 ${torsoBot + 20} Z`} fill="#c6f53a" opacity={0.9} />}
        {top === 'linefr' && <>
          <path d={`M-58 ${torsoTop} L44 ${torsoBot} M58 ${torsoTop} L-44 ${torsoBot}`} stroke={trim} strokeWidth={16} strokeLinecap="round" />
          <rect x={-92} y={torsoBot - 16} width={184} height={26} rx={8} fill={trim} />
          <circle cx={0} cy={torsoBot - 3} r={12} fill="none" stroke="#cfd6e4" strokeWidth={6} />
        </>}
        {top === 'polo' && <>
          <path d={`M-4 ${torsoTop} L-4 ${torsoTop + 60}`} stroke={shirtS} strokeWidth={6} />
          <path d={`M-22 ${torsoTop} L-30 ${torsoTop + 120} M22 ${torsoTop} L-10 ${torsoTop + 120}`} stroke={trim} strokeWidth={5} />
          <rect x={-56} y={torsoTop + 112} width={50} height={64} rx={9} fill="#ffffff" stroke={line('#ffffff')} strokeWidth={4} />
          <rect x={-48} y={torsoTop + 124} width={34} height={16} rx={4} fill={trim} />
        </>}
        {(top === 'blazer' || top === 'suit') && <>
          <path d={`M-40 ${torsoTop - 2} L0 ${torsoTop + 110} L40 ${torsoTop - 2} Z`} fill={trim} />
          <path d={`M-40 ${torsoTop - 2} L-4 ${torsoTop + 120} L-30 ${torsoTop + 60} L-52 ${torsoTop + 40} Z
            M40 ${torsoTop - 2} L4 ${torsoTop + 120} L30 ${torsoTop + 60} L52 ${torsoTop + 40} Z`} fill={shirtS} />
          {top === 'suit' && <path d={`M0 ${torsoTop + 8} L-12 ${torsoTop + 30} L0 ${torsoTop + 104} L12 ${torsoTop + 30} Z`} fill="#c0392b" />}
          {[0, 1].map((i) => <circle key={i} cx={8} cy={torsoTop + 140 + i * 40} r={6} fill={shirtS} />)}
        </>}
        {top === 'apron' && <>
          <rect x={-58} y={torsoTop + 40} width={116} height={260} rx={22} fill={trim} stroke={line(trim)} strokeWidth={5} />
          <path d={`M-50 ${torsoTop + 44} L-40 ${torsoTop - 4} M50 ${torsoTop + 44} L40 ${torsoTop - 4}`} stroke={trim} strokeWidth={9} />
          <rect x={-34} y={torsoTop + 120} width={68} height={40} rx={10} fill={shade(trim, 0.12)} />
        </>}
        {/* occlusion under the head */}
        <ellipse cx={0} cy={torsoTop + 6} rx={70} ry={26} fill={shirtS} opacity={0.55} filter={`url(#${uid}-soft)`} />
      </g>
      </g>
      {/* collar and neck */}
      <path d={`M-30 ${torsoTop - 2} Q0 ${torsoTop + 30} 30 ${torsoTop - 2}`} fill={skinS} stroke={ink(skin)} strokeWidth={6} />
      {(top === 'polo' || top === 'snap' || top === 'linefr') && <path d={`M-34 ${torsoTop - 8} L-4 ${torsoTop + 26} L-22 ${torsoTop + 34} Z
        M34 ${torsoTop - 8} L4 ${torsoTop + 26} L22 ${torsoTop + 34} Z`} fill={shirtL} stroke={ink(shirtTone)} strokeWidth={5}
        strokeLinejoin="round" />}
      {/* head (an FR hood, when worn, wraps it and covers hair and ears) */}
      {hat === 'hood' && <circle cx={0} cy={headY + 4} r={headR + 20} fill={shade(shirt, 0.18)} stroke={ink(shirt)} strokeWidth={7} />}
      <circle cx={0} cy={headY} r={hat === 'hood' ? headR - 8 : headR} fill={`url(#${uid}-skin)`} stroke={ink(skin)} strokeWidth={7} />
      <g clipPath={`url(#${uid}-head)`}>
        <circle cx={14} cy={headY + 8} r={headR} fill="none" stroke={skinS} strokeWidth={18} opacity={0.35} />
        <circle cx={-12} cy={headY - 4} r={headR} fill="none" stroke={light(skin, 0.7)} strokeWidth={10} opacity={0.4} />
      </g>
      {hat !== 'hood' && <>
        <ellipse cx={-headR + 4} cy={headY + 8} rx={14} ry={20} fill={skin} stroke={ink(skin)} strokeWidth={6} />
        <ellipse cx={headR - 4} cy={headY + 8} rx={14} ry={20} fill={skinS} stroke={ink(skin)} strokeWidth={6} />
        {hairShape()}
      </>}
      {eye(-1)}{eye(1)}
      {glasses && <g>
        {[-1, 1].map((sd) => <rect key={sd} x={fx + sd * 30 - 26} y={headY - 20} width={52} height={42} rx={16}
          fill="#dff3ff" fillOpacity={0.18} stroke="#2b2440" strokeWidth={6} />)}
        <path d={`M${fx - 4} ${headY - 4} Q${fx} ${headY - 10} ${fx + 4} ${headY - 4}`} stroke="#2b2440" strokeWidth={5} fill="none" />
        <path d={`M${fx - 46} ${headY - 12} l12 -4`} stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.7} />
      </g>}
      <ellipse cx={fx + 2} cy={headY + 22} rx={9} ry={7} fill={skinS} opacity={0.8} />
      <circle cx={fx - 46} cy={headY + 30} r={13} fill="#ff6b8a" opacity={0.28} />
      <circle cx={fx + 46} cy={headY + 30} r={13} fill="#ff6b8a" opacity={0.28} />
      {mouth}
      {hatShape()}
      {holding && (pose === 'hold' || pose === 'reach') && <g transform={`translate(${holdAt.x} ${holdAt.y})`}>{holding}</g>}
      {arm(R, true)}
      {(pose === 'hold' || pose === 'reach' || pose === 'hips' || pose === 'shrug' || pose === 'crossed' || pose === 'panic') &&
        arm(L, true)}
    </g>
  );
};

/**
 * THE CAST, look v2. The Texas roster (lib/Character.tsx CAST, knowledge/texas/CAST.md) on the v2 rig: the
 * same people with the same ids, skin and hair values, headgear and work clothes, with the clothes
 * pushed to v2 chroma. The rules stand: a cowboy hat never goes on a rig floor, a farmer wears a gimme
 * cap, the straw hat is seasonal. Five extra generic people follow the roster.
 */
const S8 = ['#f6d9c0', '#eec39f', '#e0a97e', '#c98c5e', '#a96f45', '#8c5733', '#6f4326', '#54321c'];
const H7 = ['#1c1512', '#2b1f18', '#3d2c1e', '#5a4028', '#7c5a34', '#9a7a4a', '#b9b2a6'];
export const CAST_V2: Record<string, Partial<FigureProps>> = {
  engineer: {skin: S8[3], hair: 'bun', hairColor: H7[0], hat: 'hardhat', hatColor: '#ffc93c', top: 'coveralls',
    shirt: '#2f6fb8', pants: '#2f6fb8', trim: '#eef3fa', build: 0.45},
  rancher: {skin: S8[1], hair: 'short', hairColor: H7[6], hat: 'straw', hatColor: '#ecc66e', top: 'snap', shirt: '#cf5a3e',
    pants: '#33476b', build: 0.62},
  executive: {skin: S8[6], hair: 'curly', hairColor: H7[0], top: 'blazer', shirt: '#4b3f86', trim: '#f4e8d0',
    pants: '#2e2754', build: 0.48},
  dctech: {skin: S8[4], hair: 'short', hairColor: H7[0], top: 'polo', shirt: '#198077', trim: '#2350c8', pants: '#3a3f52',
    glasses: true, build: 0.5},
  owner: {skin: S8[2], hair: 'short', hairColor: H7[0], top: 'apron', shirt: '#3b6fd1', trim: '#f5efe2', pants: '#38425a',
    build: 0.55},
  operator: {skin: S8[7], hair: 'short', hairColor: H7[0], hat: 'hood', hatColor: '#f4f4ef', top: 'coveralls',
    shirt: '#2c64a8', pants: '#2c64a8', trim: '#e9eef6', glasses: true, build: 0.68},
  hand: {skin: S8[4], hair: 'short', hairColor: H7[0], hat: 'palm', hatColor: '#f0dba0', top: 'snap', shirt: '#6f9a46',
    pants: '#5a4632', build: 0.5},
  clinician: {skin: S8[0], hair: 'long', hairColor: H7[4], hat: 'scrubcap', hatColor: '#2fa3ad', top: 'scrubs',
    shirt: '#2b9aa3', pants: '#2b9aa3', build: 0.44},
  lineworker: {skin: S8[5], hair: 'bun', hairColor: H7[0], hat: 'hardhat', hatColor: '#f7f7f2', top: 'linefr',
    shirt: '#2d5f93', trim: '#f0b429', pants: '#3a4250', build: 0.58},
  resident: {skin: S8[3], hair: 'bun', hairColor: H7[6], top: 'jacket', shirt: '#8b5fbf', pants: '#3f3f52', glasses: true,
    build: 0.6},
  farmer: {skin: S8[2], hair: 'short', hairColor: H7[2], hat: 'mesh', hatColor: '#2e8b3a', top: 'snap', shirt: '#3f84c4',
    pants: '#3b4a6b', build: 0.56},
  technician: {skin: S8[5], hair: 'curly', hairColor: H7[4], top: 'polo', shirt: '#3d5a8a', trim: '#e11d48', pants: '#3a3f48',
    build: 0.47},
  hydrologist: {skin: S8[1], hair: 'short', hairColor: H7[0], hat: 'cap', hatColor: '#1d4ed8', top: 'hivis', shirt: '#22406b',
    trim: '#eef3fa', pants: '#41474f', build: 0.5},
  // generic people, for films that need someone who is not on the roster
  nurse: {skin: SKIN_TONES[4], hair: 'curly', hairColor: '#1a0f0a', top: 'scrubs', shirt: '#14b8a6', pants: '#0f766e'},
  coder: {skin: SKIN_TONES[0], hair: 'long', hairColor: '#c2662d', top: 'tee', shirt: '#8b5cf6', pants: '#334155'},
  teacher: {skin: SKIN_TONES[2], hair: 'afro', hairColor: '#20140e', top: 'jacket', shirt: '#ef4444', pants: '#3f3f46'},
  scientist: {skin: SKIN_TONES[5], hair: 'buzz', hairColor: '#0f0a08', top: 'labcoat', shirt: '#f4f6fb', pants: '#475569'},
  trucker: {skin: SKIN_TONES[1], hair: 'short', hairColor: '#7a7a7a', hat: 'cap', hatColor: '#dc2626', top: 'tee',
    shirt: '#0ea5e9', pants: '#1e3a8a'},
};
/** a cast member by roster id; an unknown id throws, because a silent default is a casting decision nobody made */
export const castV2 = (id: string): Partial<FigureProps> => {
  const m = CAST_V2[id];
  if (!m) throw new Error(`castV2: nobody in the v2 cast is called "${id}". Cast: ${Object.keys(CAST_V2).join(', ')}.`);
  return m;
};
export {mix};
