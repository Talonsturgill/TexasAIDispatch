import React from 'react';
import {light, line, mix, shade} from '../color';
import {ContactShadow, Glow, useUid} from '../Kit';
import {Visor, type MachineMood} from '../machines';
import {SC, ScBall, ScCard, ScDrop, ScLit, ScSolid, ScTxt, scOw, scRR, scRound} from './magnets';

/**
 * COADAPTATION, LOOK V2 (November 14th, 2026).
 *
 * The reach study from lib/coadaptation.tsx, redrawn in the v2 idiom. A mobile robot that hands over a
 * cup, the cup, the simulated apartment room, the evidence card, the consent door and the floor and
 * shelf furnishings.
 *
 * The library's rule holds. These are original illustrative props, with no likeness, no product UI and
 * no care outcome. The evidence card still says care results are not established. The robot is the
 * hero machine of the story, so it gets the v2 visor face that blinks and acts (`mood`, happy by
 * default), and its arm keeps the library's exact reach geometry, shoulder to elbow to wrist, so a
 * board that aims the wrist at a cup still meets the cup.
 *
 * One fix on the way. The library's side table stood on legs that stopped short of the floor, here its
 * legs reach the baseboard and it casts a shadow.
 *
 * PLACEMENT is the library's, screen units. The robot, cup, card and door take x, y and scale, the room
 * and the furnishings are full frame backdrops with no place props.
 */
type Props = {x?: number; y?: number; scale?: number; frame?: number; label?: string; mode?: string; progress?: number; wristX?: number;
  wristY?: number; release?: number; open?: number};
const K = {shell: '#f3f0fb', teal: SC.teal, coral: '#ff6b4a', cream: '#fff4df', wall: '#f6e9d0', floor: '#9cc79a', sage: '#5fb08a',
  ink: SC.ink, navy: '#1d2758', wood: '#e2a565'};

/**
 * THE CO-ADAPTATION ROBOT. A teal base on two wheels, a white mast, a head with a visor face, and an
 * arm that runs shoulder to elbow to wrist exactly where the library put it, with lit joints and a two
 * finger gripper that opens on `release`. Its head tilts a little as it works and its base lamp breathes.
 */
export const CoadaptRobotV2: React.FC<Props & {mood?: MachineMood}> = ({x = 230, y = 1350, scale = 1, wristX = 425, wristY = 1020, release = 0,
  frame = 0, mood = 'happy'}) => {
  const id = useUid();
  const ow = scOw(scale);
  const wx = (wristX - x) / scale - 30, wy = (wristY - y) / scale + 35;
  const ex = 60 + (wx - 60) * 0.35, ey = -460 - Math.max(0, wx - 180) * 0.12;
  const base = scRound([[-104, -85], [95, -85], [126, -21], [112, 15], [-110, 15], [-125, -21]], 24);
  const mast = scRound([[-39, -83], [-34, -436], [31, -446], [44, -82]], 14);
  const head = scRR(-66, -499, 144, 87, 28);
  const arm = `M23,-366 L${ex},${ey} L${wx},${wy}`;
  const fingers = `M${wx},${wy} l28,${-17 - release * 23} l24,${6 - release * 8} M${wx},${wy} l28,${17 + release * 23} l24,${-6 + release * 8}`;
  const tilt = Math.sin(frame / 30) * 2;
  const lamp = 0.55 + 0.45 * Math.sin(frame / 12);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <ScLit id={`${id}-b`} c={K.teal} /><ScLit id={`${id}-m`} c={K.shell} h /><ScLit id={`${id}-h`} c={K.shell} />
        <ScBall id={`${id}-j`} c={K.teal} /><ScBall id={`${id}-w`} c="#34305a" />
      </defs>
      <ContactShadow x={0} y={30} w={330} opacity={0.4} />
      {/* outline pass of the body, then its fills */}
      <path d={base} fill={line(K.teal)} stroke={line(K.teal)} strokeWidth={ow * 2} strokeLinejoin="round" />
      <path d={mast} fill={line(K.shell)} stroke={line('#c9c2e6')} strokeWidth={ow * 2} strokeLinejoin="round" />
      <g transform={`rotate(${tilt} 6 -440)`}><path d={head} fill={line('#c9c2e6')} stroke={line('#c9c2e6')} strokeWidth={ow * 2} /></g>
      {[-63, 83].map((cx) => <circle key={cx} cx={cx} cy={10} r={21} fill={`url(#${id}-w)`} stroke={line('#34305a')} strokeWidth={ow * 2} />)}
      {[-63, 83].map((cx) => <circle key={`h${cx}`} cx={cx} cy={10} r={7} fill="#b9b4d8" />)}
      <path d={mast} fill={`url(#${id}-m)`} />
      <path d={base} fill={`url(#${id}-b)`} />
      <path d="M-92 -70 H84" stroke="#ffffff" strokeWidth={ow * 1.8} strokeLinecap="round" opacity={0.45} />
      <circle cx={-80} cy={-40} r={8} fill="#7dffb0" opacity={lamp} /><Glow x={-80} y={-40} r={26} color="#7dffb0" opacity={0.5 * lamp} />
      <rect x={-24} y={-420} width={12} height={320} rx={6} fill="#ffffff" opacity={0.5} />
      <g transform={`rotate(${tilt} 6 -440)`}>
        <path d={head} fill={`url(#${id}-h)`} />
        <Visor x={6} y={-457} w={112} h={52} mood={mood} frame={frame} />
        <rect x={-50} y={-492} width={70} height={9} rx={4.5} fill="#ffffff" opacity={0.7} />
      </g>
      {/* the arm, shoulder to elbow to wrist, outline first */}
      <path d={arm} fill="none" stroke={line('#c9c2e6')} strokeWidth={34 + ow * 2} strokeLinecap="round" strokeLinejoin="round" />
      <path d={fingers} fill="none" stroke={line(K.teal)} strokeWidth={12 + ow * 2} strokeLinecap="round" strokeLinejoin="round" />
      <path d={arm} fill="none" stroke={K.shell} strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" />
      <path d={arm} fill="none" stroke={shade(K.shell, 0.18)} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round"
        transform="translate(4 6)" opacity={0.5} />
      <path d={arm} fill="none" stroke="#ffffff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" transform="translate(-5 -6)" opacity={0.8} />
      <path d={fingers} fill="none" stroke={mix(K.teal, '#ffffff', 0.15)} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
      {[[23, -366, 22], [ex, ey, 29], [wx, wy, 19]].map(([cx, cy, r], k) => <g key={k}>
        <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-j)`} stroke={line(K.teal)} strokeWidth={ow * 2} />
        <circle cx={cx} cy={cy} r={r * 0.32} fill={shade(K.teal, 0.45)} />
        <ellipse cx={cx - r * 0.35} cy={cy - r * 0.4} rx={r * 0.32} ry={r * 0.18} fill="#ffffff" opacity={0.55} />
      </g>)}
      {[-1, 1].map((k) => <circle key={k} cx={wx + 52} cy={wy + k * (11 + release * 15)} r={6.5} fill="#7dffb0" stroke={line(K.teal)}
        strokeWidth={ow} />)}
    </g>
  );
};

/** THE HANDOFF CUP. A lit coral mug with a round handle and a pale inside, and a glint that sweeps across it now and then. */
export const HandoffCupV2: React.FC<Props> = ({x = 425, y = 1020, scale = 1, frame = 0}) => {
  const id = useUid();
  const ow = scOw(scale);
  const body = 'M-43,0 L-37,76 Q-1,94 39,73 L45,0 Z';
  const handle = 'M34,9 C101,-8 96,80 39,72';
  const sweep = ((frame % 110) / 110) * 220 - 110;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs><ScLit id={`${id}-c`} c={K.coral} h /><clipPath id={`${id}-k`}><path d={body} /></clipPath>
        <radialGradient id={`${id}-in`} cx="50%" cy="70%" r="70%"><stop offset="0%" stopColor="#fff2d4" /><stop offset="100%" stopColor="#e6c48e" />
        </radialGradient></defs>
      <path d={handle} fill="none" stroke={line(K.coral)} strokeWidth={14 + ow * 2} strokeLinecap="round" />
      <path d={body} fill={line(K.coral)} stroke={line(K.coral)} strokeWidth={ow * 2} strokeLinejoin="round" />
      <path d={handle} fill="none" stroke={K.coral} strokeWidth={14} strokeLinecap="round" />
      <path d={body} fill={`url(#${id}-c)`} />
      <g clipPath={`url(#${id}-k)`}>
        <path d={`M${sweep - 12} 100 L${sweep + 18} -10 L${sweep + 34} -10 L${sweep + 4} 100 Z`} fill="#ffffff" opacity={0.35} />
      </g>
      <ellipse cx={1} cy={0} rx={44} ry={12} fill={line(K.coral)} stroke={line(K.coral)} strokeWidth={ow * 2} />
      <ellipse cx={1} cy={0} rx={44} ry={12} fill={mix(K.coral, '#ffffff', 0.55)} />
      <ellipse cx={1} cy={1.5} rx={36} ry={8} fill={`url(#${id}-in)`} />
      <path d="M-28 16 L-25 58" stroke="#ffffff" strokeWidth={7} strokeLinecap="round" opacity={0.55} />
    </g>
  );
};

/**
 * THE SIMULATED APARTMENT. A warm lit wall, a sage floor with soft seams, a window onto green hills and
 * a tree, a tall cabinet whose door swings on `open`, and a pedestal with a trailing plant. `mode`
 * shared-building adds the dividing wall and a side table. Full frame.
 */
export const CoadaptRoomV2: React.FC<Props> = ({mode = 'laboratory-room', open = 0, label = '', frame = 0}) => {
  const id = useUid();
  const ow = 3.4;
  const sway = Math.sin(frame / 40) * 2.5;
  const win = scRR(65, 345, 343, 466, 26);
  const leaf = (lx: number, ly: number, rot: number, s = 1) => <path key={`${lx}-${ly}`} d="M0 0 Q20 -28 52 -8 Q24 12 0 0 Z" fill={K.sage}
    stroke={line(K.sage)} strokeWidth={ow * 1.6} strokeLinejoin="round" transform={`translate(${lx} ${ly}) rotate(${rot}) scale(${s})`} />;
  const door = `M672,406 L${672 + open * 163},${406 + open * 37} V${764 - open * 34} L672,764Z`;
  const shared = mode === 'shared-building';
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fbf3e2" /><stop offset="100%" stopColor="#ecd9b6" />
        </linearGradient>
        <radialGradient id={`${id}-key`} cx="20%" cy="15%" r="75%"><stop offset="0%" stopColor="#ffffff" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0} /></radialGradient>
        <linearGradient id={`${id}-floor`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={mix(K.floor, '#ffffff', 0.15)} />
          <stop offset="100%" stopColor={shade(K.floor, 0.22)} /></linearGradient>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6fb8ff" /><stop offset="100%" stopColor="#fff0d4" />
        </linearGradient>
        <ScLit id={`${id}-hill`} c="#6fbf62" v /><ScBall id={`${id}-tree`} c="#4c9e4e" /><ScLit id={`${id}-cab`} c="#cfe3d6" />
        <ScLit id={`${id}-door`} c="#8fd1b4" h /><ScLit id={`${id}-ped`} c="#e9b98a" h /><ScLit id={`${id}-tab`} c="#f3efe6" />
        <ScLit id={`${id}-base`} c="#d9c9a6" v /><ScLit id={`${id}-wood`} c={K.wood} h />
        <linearGradient id={`${id}-in`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#1b2350" /><stop offset="100%" stopColor="#2d3a74" />
        </linearGradient>
        <clipPath id={`${id}-wc`}><path d={win} /></clipPath>
      </defs>
      <rect width={1080} height={1920} fill={`url(#${id}-wall)`} />
      <rect width={1080} height={1300} fill={`url(#${id}-key)`} />
      <path d="M0,1300 L1080,1300 L1080,1920 L0,1920Z" fill={`url(#${id}-floor)`} />
      <path d="M90,1540 L970,1540 M215,1760 L1060,1760" stroke={shade(K.floor, 0.2)} strokeWidth={5} strokeLinecap="round" opacity={0.55} />
      <path d="M120,1420 L700,1420 M300,1650 L1000,1650" stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.18} />
      {/* the window */}
      <ScDrop d={win} dx={8} dy={14} sd={12} opacity={0.22} />
      <g clipPath={`url(#${id}-wc)`}>
        <rect x={65} y={345} width={343} height={466} fill={`url(#${id}-sky)`} />
        <path d="M78,772 Q148,700 213,743 Q300,663 395,726 V811 H65Z" fill={line('#6fbf62')} />
        <path d="M70,780 Q148,708 213,751 Q300,671 400,734 V811 H65Z" fill={`url(#${id}-hill)`} />
        <path d="M218,790 Q216,730 222,690" stroke="#7a4e30" strokeWidth={12} strokeLinecap="round" fill="none" />
        <g transform={`translate(${sway} 0)`}>
          {[[196, 678, 34], [232, 660, 40], [262, 690, 30], [214, 700, 28]].map(([cx, cy, r], k) =>
            <circle key={`o${k}`} cx={cx} cy={cy} r={r + ow * 2} fill={line('#4c9e4e')} />)}
          {[[196, 678, 34], [232, 660, 40], [262, 690, 30], [214, 700, 28]].map(([cx, cy, r], k) =>
            <circle key={k} cx={cx} cy={cy} r={r} fill={`url(#${id}-tree)`} />)}
        </g>
        <path d="M80 520 L230 360 L270 360 L120 520 Z" fill="#ffffff" opacity={0.18} />
      </g>
      <path d={win} fill="none" stroke={line('#f3ead7')} strokeWidth={22 + ow * 2} />
      <path d={win} fill="none" stroke="#fbf5ea" strokeWidth={22} />
      <path d="M232,352 V804 M74,564 H400" stroke={line('#f3ead7')} strokeWidth={14 + ow * 2} strokeLinecap="round" />
      <path d="M232,352 V804 M74,564 H400" stroke="#fbf5ea" strokeWidth={14} strokeLinecap="round" />
      <ScSolid d={scRR(44, 815, 388, 22, 11)} c="#e8dcc4" ow={ow} />
      {/* the tall cabinet, its door swings */}
      <ContactShadow x={778} y={796} w={300} opacity={0.3} />
      <ScSolid d={scRR(649, 380, 259, 412, 18)} c="#cfe3d6" ow={ow} fill={`url(#${id}-cab)`} />
      <ScSolid d={scRR(640, 368, 280, 26, 13)} c={K.cream} ow={ow} />
      <path d={scRR(672, 406, 205, 358, 10)} fill={`url(#${id}-in)`} />
      <path d={door} fill={`url(#${id}-door)`} stroke={line('#8fd1b4')} strokeWidth={ow * 2} strokeLinejoin="round" />
      <circle cx={672 + open * 163 - 22} cy={590} r={8} fill={K.coral} stroke={line(K.coral)} strokeWidth={ow}
        opacity={open > 0.05 ? 1 : 0} />
      <path d="M660 392 H900" stroke="#ffffff" strokeWidth={ow * 1.4} strokeLinecap="round" opacity={0.5} />
      {/* the pedestal and its plant */}
      <ContactShadow x={518} y={1272} w={150} opacity={0.4} />
      <ScSolid d={scRR(474, 950, 87, 320, 18)} c="#e9b98a" ow={ow} fill={`url(#${id}-ped)`} />
      <g transform={`rotate(${sway} 518 950)`}>
        {leaf(508, 950, -150, 1.7)}{leaf(512, 946, -95, 1.9)}{leaf(526, 946, -40, 1.8)}{leaf(534, 952, 20, 1.5)}{leaf(500, 962, 165, 1.5)}
      </g>
      {shared && <g>
        <rect x={552} y={300} width={20} height={985} rx={10} fill="#fbf6ea" stroke={line('#f5efde')} strokeWidth={ow * 2} />
        <ContactShadow x={742} y={1288} w={300} opacity={0.35} />
        {[636, 850].map((lx) => <rect key={lx} x={lx - 11} y={1020} width={22} height={268} rx={11} fill={`url(#${id}-wood)`}
          stroke={line(K.wood)} strokeWidth={ow * 2} />)}
        <ScSolid d={scRR(615, 877, 255, 153, 20)} c="#f3efe6" ow={ow} fill={`url(#${id}-tab)`} />
        <path d="M632 892 H850" stroke="#ffffff" strokeWidth={ow * 1.4} strokeLinecap="round" opacity={0.6} />
      </g>}
      <ScSolid d={scRR(28, 1270, 1026, 20, 10)} c="#d9c9a6" ow={ow} fill={`url(#${id}-base)`} />
      {label && <ScTxt x={580} y={342} t={label} size={40} />}
    </g>
  );
};

/**
 * THE EVIDENCE CARD. A lit cream card with a deep header band naming the source. `mode` award draws a
 * record with a coral progress bar, `mode` source shows the demonstration tile beside a dashed card
 * that says care results are not established.
 */
export const CoadaptEvidenceV2: React.FC<Props> = ({x = 110, y = 475, scale = 1, label = 'Research', mode = 'award', progress = 1, frame = 0}) => {
  const id = useUid();
  const ow = scOw(scale);
  const card = scRound([[0, 0], [695, 0], [713, 252], [-7, 252]], 22);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs><ScLit id={`${id}-hd`} c="#2e2a66" v /><ScLit id={`${id}-pb`} c={K.coral} v /></defs>
      <ScCard d={card} c={K.cream} ow={ow}>
        <rect x={-10} y={-5} width={740} height={56} fill={`url(#${id}-hd)`} />
        <rect x={10} y={6} width={300} height={8} rx={4} fill="#ffffff" opacity={0.18} />
      </ScCard>
      <ScTxt x={24} y={36} t={mode === 'award' ? 'NSF AWARD RECORD' : 'UT AUSTIN ANNOUNCEMENT'} size={28} fill={K.cream} />
      <ScTxt x={25} y={112} t={label} size={40} />
      {mode === 'source'
        ? <g>
          <ScCard d={scRR(22, 136, 298, 114, 22)} c="#cfe8d9" ow={ow} shadow={false} />
          <HandoffCupV2 x={85} y={183} frame={frame} scale={0.55} />
          <ScTxt x={132} y={198} t="Demonstration" size={23} weight={700} />
          <g transform={`translate(${progress * 35} ${progress * 75})`}>
            <ScDrop d={scRR(342, 136, 303, 114, 22)} />
            <path d={scRR(342, 136, 303, 114, 22)} fill={K.cream} />
            <path d={scRR(342, 136, 303, 114, 22)} fill="none" stroke={line(K.cream)} strokeWidth={ow * 1.2} strokeDasharray={`${ow * 1.4} ${ow * 3.2}`}
              strokeLinecap="round" />
            <ScTxt x={363} y={182} t="Care results" size={26} />
            <ScTxt x={363} y={226} t="Not established" size={25} weight={700} fill={shade(K.coral, 0.2)} />
          </g>
        </g>
        : <g>{[[26, 648, 145], [26, 608, 170], [26, 628, 195]].map(([x0, x1, yy]) => <rect key={yy} x={x0} y={yy - 4} width={x1 - x0} height={8}
          rx={4} fill={SC.lilac} opacity={0.75} />)}</g>}
      {mode !== 'source' && <g>
        <rect x={22} y={216} width={630} height={14} rx={7} fill={shade(K.cream, 0.12)} />
        <rect x={22} y={216} width={Math.max(14, progress * 630)} height={14} rx={7} fill={`url(#${id}-pb)`} stroke={line(K.coral)} strokeWidth={ow} />
        <Glow x={22 + progress * 630} y={223} r={30} color={K.coral} opacity={0.6} />
      </g>}
    </g>
  );
};

/**
 * THE CONSENT DOOR. A rounded cream frame on the floor, a deep doorway and a sage door that swings open
 * on `open`, its coral knob travelling with it. The word over it names what the door stands for.
 */
export const ConsentDoorV2: React.FC<Props> = ({x = 610, y = 550, scale = 1, open = 0, label = 'Participation', frame = 0}) => {
  const id = useUid();
  const ow = scOw(scale);
  const leaf = SC.sage, fr = '#ffdcae';
  const A: [number, number] = [-9, 31], B: [number, number] = [210 - open * 160, 31 + open * 38];
  const C: [number, number] = [B[0], 536 - open * 42], D: [number, number] = [-9, 536];
  /** a point on the swinging leaf, u across from the hinge, v down */
  const on = (u: number, v: number): [number, number] => {
    const top = [A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u], bot = [D[0] + (C[0] - D[0]) * u, D[1] + (C[1] - D[1]) * u];
    return [top[0] + (bot[0] - top[0]) * v, top[1] + (bot[1] - top[1]) * v];
  };
  const door = scRound([A, B, C, D], 6);
  const panel = (v0: number, v1: number) => scRound([on(0.2, v0), on(0.8, v0), on(0.8, v1), on(0.2, v1)], 8);
  const spill = 0.35 + 0.1 * Math.sin(frame / 20);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs><ScLit id={`${id}-f`} c={fr} k={0.7} /><ScLit id={`${id}-d`} c={leaf} h /><ScBall id={`${id}-k`} c={K.coral} />
        <linearGradient id={`${id}-in`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#141a44" /><stop offset="100%" stopColor="#2d3a74" />
        </linearGradient>
        <radialGradient id={`${id}-sp`} cx="85%" cy="60%" r="80%"><stop offset="0%" stopColor="#ffe6a8" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#ffe6a8" stopOpacity={0} /></radialGradient></defs>
      <ContactShadow x={102} y={566} w={360} opacity={0.4} />
      <ScSolid d={scRR(-34, 0, 273, 562, 22)} c={fr} ow={ow} fill={`url(#${id}-f)`} />
      <path d={scRR(-9, 31, 220, 505, 12)} fill={`url(#${id}-in)`} stroke={line(fr)} strokeWidth={ow * 1.2} />
      <path d={scRR(-9, 31, 220, 505, 12)} fill={`url(#${id}-sp)`} opacity={spill * open} />
      <path d={door} fill={line(leaf)} stroke={line(leaf)} strokeWidth={ow * 2} strokeLinejoin="round" />
      <path d={door} fill={`url(#${id}-d)`} />
      {[[0.07, 0.44], [0.54, 0.93]].map(([v0, v1]) => <path key={v0} d={panel(v0, v1)} fill={shade(leaf, 0.12)} stroke={light(leaf, 0.35)}
        strokeWidth={ow * 0.9} strokeLinejoin="round" opacity={0.85} />)}
      <path d={`M${on(0.08, 0.03)[0]} ${on(0.08, 0.03)[1]} L${on(0.9, 0.03)[0]} ${on(0.9, 0.03)[1]}`} stroke="#ffffff" strokeWidth={ow * 1.4}
        strokeLinecap="round" opacity={0.45} />
      <circle cx={174 - open * 131} cy={306} r={11} fill={`url(#${id}-k)`} stroke={line(K.coral)} strokeWidth={ow * 1.4} />
      <path d="M-20 14 H220" stroke="#ffffff" strokeWidth={ow * 1.4} strokeLinecap="round" opacity={0.6} />
      <ScTxt x={-27} y={-28} t={label} size={29} />
    </g>
  );
};

/**
 * THE FLOOR AND THE SHELF. `mode` shelf is a lit sage shelf board, a bright top face over a deeper front
 * face with round ends and a soft shadow on the wall under it. The floor is lit sage boards that warm
 * toward the key light and deepen toward the camera, with soft seams between them.
 */
export const CoadaptFurnishingV2: React.FC<Props> = ({mode = 'floor'}) => {
  const id = useUid();
  const fl = '#5fbf86';
  return (
    <g>
      <defs><ScLit id={`${id}-s`} c="#6fbf8a" v />
        <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={mix(fl, '#fff4dc', 0.25)} />
          <stop offset="100%" stopColor={shade(fl, 0.3)} /></linearGradient>
        <radialGradient id={`${id}-k`} cx="25%" cy="0%" r="80%"><stop offset="0%" stopColor="#fff4dc" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#fff4dc" stopOpacity={0} /></radialGradient></defs>
      {mode === 'shelf'
        ? <g>
          <ScDrop d={scRR(0, 1490, 1080, 44, 22)} dx={0} dy={22} sd={12} opacity={0.32} />
          <ScSolid d={scRR(0, 1490, 1080, 44, 22)} c="#6fbf8a" ow={3.4} fill={shade('#6fbf8a', 0.2)} />
          <path d={scRR(3, 1491, 1074, 18, 9)} fill={`url(#${id}-s)`} />
          <path d="M24 1496 H1056" stroke="#ffffff" strokeWidth={5} strokeLinecap="round" opacity={0.5} />
        </g>
        : <g>
          <rect x={-250} y={1450} width={1650} height={650} fill={`url(#${id}-f)`} />
          {[1520, 1600, 1690, 1790, 1900, 2020].map((yy, k) => <rect key={yy} x={-250} y={yy} width={1650} height={k % 2 ? 0 : 60 + k * 8}
            fill="#ffffff" opacity={0.05} />)}
          <rect x={-250} y={1450} width={1650} height={650} fill={`url(#${id}-k)`} />
          {[1520, 1600, 1690, 1790, 1900, 2020].map((yy) => <path key={yy} d={`M-200 ${yy} H1350`} stroke={shade(fl, 0.25)}
            strokeWidth={4 + (yy - 1450) / 160} strokeLinecap="round" opacity={0.45} />)}
          <path d="M-200 1452 H1350" stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.35} />
        </g>}
    </g>
  );
};
