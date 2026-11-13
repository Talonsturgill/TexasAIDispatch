import React from 'react';
import {M} from '../lib/scale';
import {light, line, mix, shade} from './color';
import {ContactShadow, Glow, clamp01, useUid} from './Kit';

/**
 * THE HERO MACHINES, LOOK V2 (November 13th, 2026).
 *
 * One hero for every beat the Docket rotates through, redrawn in the v2 idiom: round, lit from the
 * upper left, hue-tinted line, a contact shadow, alive on `frame`, and a face where the machine is the
 * character (a visor with two eyes, the HeroDrone's language). Faces are optional (`mood` undefined
 * draws none), because a machine in the background should not stare at the camera.
 *
 *  the road         AutoTruckV2 (driverless semi), RobotaxiV2
 *  oilfield         DrillRigV2
 *  farm and ranch   CentrePivotV2
 *  what Texas makes RobotArmV2
 *  record and rule  ServerRackV2 (a data hall row)
 *  weather          SensorMastV2 (wildfire camera or flood station)
 *  clinic           TabletV2 (any screen a person holds), ClinicScreenV2
 *
 * PLACEMENT is the library's own (lib/drilling.tsx `Rig`): x, y at the ground, scale, frame, facing,
 * and `scale={1}` is true size beside a person, through the one metre in lib/scale.ts. Each drawing is
 * built in centimetres and converted once, so its proportions are real.
 */
export interface Place {x?: number; y?: number; scale?: number; frame?: number; facing?: 1 | -1; seed?: number}
export type MachineMood = 'happy' | 'focused' | 'worried' | 'surprised' | 'sleepy';
const CM = M / 100;

const at = (p: Place, extra = '') => `translate(${p.x ?? 0} ${p.y ?? 0}) scale(${(p.scale ?? 1) * CM * (p.facing ?? 1)} ${(p.scale ?? 1) * CM})${extra}`;

/** a lit material: light at the top left, the fill, shade toward violet at the bottom right */
const Lit: React.FC<{id: string; c: string; dir?: 'v' | 'd'}> = ({id, c, dir = 'd'}) => (
  <linearGradient id={id} x1="0" y1="0" x2={dir === 'v' ? '0' : '0.35'} y2="1">
    <stop offset="0%" stopColor={light(c, 0.5)} /><stop offset="45%" stopColor={c} /><stop offset="100%" stopColor={shade(c, 0.36)} />
  </linearGradient>
);

/** the machine face: a dark rounded visor with two glowing eyes that act */
export const Visor: React.FC<{x: number; y: number; w: number; h: number; mood: MachineMood; frame: number; eye?: string;
  look?: number}> = ({x, y, w, h, mood, frame, eye = '#38f2e0', look = 0}) => {
  const id = useUid();
  const blink = (frame % 90) < 4 ? [1, 0.3, 0.1, 0.6][frame % 90] : 1;
  const r = Math.min(w, h) / 2, ex = w * 0.22, er = h * 0.2;
  const eyeH = (mood === 'surprised' ? er * 2.6 : mood === 'focused' ? er * 1.1 : mood === 'sleepy' ? er * 0.5 : er * 2) * blink;
  const one = (cx: number) => mood === 'happy'
    ? <path d={`M${cx - er} ${er * 0.3} Q${cx} ${-er * 1.3} ${cx + er} ${er * 0.3}`} stroke={eye} strokeWidth={er * 0.55}
      fill="none" strokeLinecap="round" />
    : <rect x={cx - er * 0.75 + look * er * 0.4} y={-eyeH / 2} width={er * 1.5} height={Math.max(er * 0.3, eyeH)} rx={er * 0.75} fill={eye} />;
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs><linearGradient id={`${id}-v`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2c2f63" />
        <stop offset="100%" stopColor="#0c0e29" /></linearGradient>
        <filter id={`${id}-g`} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation={er * 0.3} /></filter></defs>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={r} fill={`url(#${id}-v)`} />
      <g filter={`url(#${id}-g)`} opacity={0.9}>{one(-ex)}{one(ex)}</g>
      {one(-ex)}{one(ex)}
      {mood === 'worried' && <path d={`M${-ex - er * 1.2} ${-er * 1.6} L${-ex + er * 0.6} ${-er * 1.1} M${ex + er * 1.2} ${-er * 1.6}
        L${ex - er * 0.6} ${-er * 1.1}`} stroke={eye} strokeWidth={er * 0.3} strokeLinecap="round" />}
      {mood === 'focused' && <path d={`M${-ex - er * 1.2} ${-er * 1.1} L${-ex + er * 0.8} ${-er * 1.4} M${ex + er * 1.2} ${-er * 1.1}
        L${ex - er * 0.8} ${-er * 1.4}`} stroke={eye} strokeWidth={er * 0.3} strokeLinecap="round" />}
      <ellipse cx={-w * 0.28} cy={-h * 0.3} rx={w * 0.12} ry={h * 0.08} fill="#ffffff" opacity={0.35} />
    </g>
  );
};

/** a wheel that turns: tyre, lit rim, hub, five lugs */
const Wheel: React.FC<{cx: number; cy: number; r: number; spin: number; rim?: string}> = ({cx, cy, r, spin, rim = '#d9dde8'}) => (
  <g transform={`translate(${cx} ${cy})`}>
    <circle r={r} fill="#24213a" stroke={line('#24213a')} strokeWidth={r * 0.08} />
    <circle r={r * 0.62} fill={rim} stroke={shade(rim, 0.4)} strokeWidth={r * 0.06} />
    <g transform={`rotate(${spin})`}>{[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={Math.cos(a * Math.PI / 180) * r * 0.36}
      cy={Math.sin(a * Math.PI / 180) * r * 0.36} r={r * 0.08} fill={shade(rim, 0.45)} />)}</g>
    <circle r={r * 0.18} fill={shade(rim, 0.3)} />
    <path d={`M${-r * 0.5} ${-r * 0.32} A${r * 0.6} ${r * 0.6} 0 0 1 ${r * 0.1} ${-r * 0.58}`} stroke="#ffffff" strokeWidth={r * 0.08}
      fill="none" strokeLinecap="round" opacity={0.7} />
  </g>
);

// ---------------------------------------------------------------------------------- the road

/**
 * A DRIVERLESS SEMI: a day cab with the sensor pod on the roof and lidar on the mirrors, pulling a
 * box trailer. `speed` 0 to 1 spins the wheels and adds a road shimmer. The face sits in the cab
 * window, where the driver would be, which is the story of every one of these films.
 */
export const AutoTruckV2: React.FC<Place & {speed?: number; mood?: MachineMood; paint?: string; trailer?: boolean;
  livery?: string}> = (p) => {
  const {frame = 0, speed = 0.6, mood, paint = '#f05a3c', trailer = true, livery = '#2a6fdb'} = p;
  const id = useUid();
  const spin = frame * speed * 14;
  const bounce = Math.sin(frame * 0.7) * 2 * speed;
  const pod = (frame * 9) % 360;
  return (
    <g transform={at(p)}>
      <defs><Lit id={`${id}-cab`} c={paint} /><Lit id={`${id}-box`} c="#f4f6fb" dir="v" /><Lit id={`${id}-steel`} c="#9aa3bd" /></defs>
      <ContactShadow x={trailer ? -600 : 0} y={6} w={trailer ? 2300 : 900} opacity={0.32} />
      <g transform={`translate(0 ${bounce})`}>
        {trailer && <g>
          <rect x={-1820} y={-410} width={1360} height={300} rx={46} fill={`url(#${id}-box)`} stroke={line('#f4f6fb')} strokeWidth={8} />
          <rect x={-1790} y={-300} width={1300} height={56} rx={28} fill={livery} />
          <path d={`M-1760 -386 Q-1200 -404 -520 -390`} stroke="#ffffff" strokeWidth={16} strokeLinecap="round" opacity={0.8} fill="none" />
          <rect x={-1700} y={-110} width={1100} height={34} rx={14} fill="#3a3550" />
        </g>}
        {/* chassis and fifth wheel */}
        <rect x={-470} y={-120} width={900} height={50} rx={22} fill="#3a3550" />
        {/* the cab: a long rounded hood and a tall sleeper-less day cab */}
        <path d="M-420 -110 L-420 -400 Q-420 -440 -380 -440 L-60 -440 Q-20 -440 -10 -400 L20 -300 Q30 -270 70 -268 L340 -250
          Q400 -246 410 -200 L420 -130 Q420 -110 396 -110 Z" fill={`url(#${id}-cab)`} stroke={line(paint)} strokeWidth={9} strokeLinejoin="round" />
        <path d="M-400 -420 Q-260 -436 -80 -424" stroke="#ffffff" strokeWidth={14} strokeLinecap="round" opacity={0.6} fill="none" />
        <path d="M60 -262 Q220 -252 380 -236" stroke="#ffffff" strokeWidth={10} strokeLinecap="round" opacity={0.5} fill="none" />
        {/* grille and headlight */}
        <rect x={380} y={-236} width={40} height={110} rx={16} fill={`url(#${id}-steel)`} stroke={line('#9aa3bd')} strokeWidth={6} />
        <ellipse cx={404} cy={-206} rx={14} ry={20} fill="#fff6c8" />
        <Glow x={430} y={-206} r={80} color="#fff3b0" opacity={0.35} />
        {/* the window, and in it the face where a driver would sit */}
        <path d="M-330 -410 L-90 -410 Q-62 -410 -54 -384 L-22 -286 L-330 -286 Z" fill="#1d2150" stroke={line(paint)} strokeWidth={7}
          strokeLinejoin="round" />
        {mood ? <Visor x={-190} y={-348} w={210} h={96} mood={mood} frame={frame} />
          : <path d="M-300 -396 L-150 -396" stroke="#ffffff" strokeWidth={12} strokeLinecap="round" opacity={0.3} />}
        {/* exhaust stack and mirror lidar */}
        <rect x={-450} y={-560} width={30} height={330} rx={15} fill={`url(#${id}-steel)`} stroke={line('#9aa3bd')} strokeWidth={5} />
        <g transform="translate(-30 -330)"><rect x={-8} y={-10} width={16} height={60} rx={8} fill="#3a3550" />
          <circle cx={0} cy={-26} r={30} fill="#2b2d4a" stroke={line('#2b2d4a')} strokeWidth={5} />
          <circle cx={0} cy={-26} r={12} fill="#38f2e0" opacity={0.6 + 0.4 * Math.sin(frame * 0.4)} /></g>
        {/* the roof pod, its drum turning */}
        <g transform="translate(-240 -440)">
          <rect x={-150} y={-60} width={300} height={60} rx={30} fill="#2b2d4a" stroke={line('#2b2d4a')} strokeWidth={6} />
          <rect x={-46} y={-118} width={92} height={62} rx={26} fill="#f4f6fb" stroke={line('#f4f6fb')} strokeWidth={6} />
          <rect x={-46 + ((pod / 360) * 70)} y={-104} width={18} height={34} rx={9} fill="#38f2e0" opacity={0.85} />
          {[-110, 110].map((cx) => <circle key={cx} cx={cx} cy={-30} r={14} fill="#38f2e0" opacity={0.7} />)}
        </g>
      </g>
      <Wheel cx={300} cy={-70} r={70} spin={spin} />
      <Wheel cx={-300} cy={-70} r={70} spin={spin} />
      <Wheel cx={-140} cy={-70} r={70} spin={spin} />
      {trailer && <><Wheel cx={-1600} cy={-70} r={70} spin={spin} /><Wheel cx={-1440} cy={-70} r={70} spin={spin} /></>}
      {speed > 0.3 && [0, 1, 2].map((i) => <path key={i} d={`M${trailer ? -1900 : -560} ${-180 - i * 90} l${-160 - i * 40} 0`}
        stroke="#ffffff" strokeWidth={14} strokeLinecap="round" opacity={0.35 * speed} />)}
    </g>
  );
};

/** A ROBOTAXI: a small rounded car with a lidar dome turning on the roof and the face in the windshield */
export const RobotaxiV2: React.FC<Place & {speed?: number; mood?: MachineMood; paint?: string}> = (p) => {
  const {frame = 0, speed = 0.4, mood, paint = '#f4f6fb'} = p;
  const id = useUid();
  const spin = frame * speed * 18;
  const bounce = Math.sin(frame * 0.8) * 1.5 * speed;
  return (
    <g transform={at(p)}>
      <defs><Lit id={`${id}-b`} c={paint} /></defs>
      <ContactShadow x={0} y={4} w={520} opacity={0.32} />
      <g transform={`translate(0 ${bounce})`}>
        <path d="M-230 -50 Q-240 -110 -200 -126 L-120 -140 Q-80 -210 0 -214 Q90 -216 140 -150 L210 -132 Q246 -122 240 -70 L236 -50
          Q232 -36 214 -36 L-210 -36 Q-228 -36 -230 -50 Z" fill={`url(#${id}-b)`} stroke={line(paint)} strokeWidth={7} strokeLinejoin="round" />
        <path d="M-100 -142 Q-66 -196 0 -198 Q70 -198 116 -146 Z" fill="#1d2150" />
        {mood && <Visor x={14} y={-166} w={150} h={52} mood={mood} frame={frame} />}
        <path d="M-200 -110 Q-40 -132 200 -112" stroke="#38c2f2" strokeWidth={14} strokeLinecap="round" fill="none" />
        <path d="M-190 -122 Q-120 -134 -100 -136" stroke="#ffffff" strokeWidth={10} strokeLinecap="round" opacity={0.7} fill="none" />
        <ellipse cx={226} cy={-92} rx={10} ry={16} fill="#fff6c8" />
        <g transform="translate(0 -214)">
          <rect x={-40} y={-14} width={80} height={18} rx={9} fill="#2b2d4a" />
          <rect x={-26} y={-52} width={52} height={40} rx={18} fill="#2b2d4a" stroke={line('#2b2d4a')} strokeWidth={5} />
          <rect x={-22 + ((frame * 3) % 30)} y={-42} width={12} height={20} rx={6} fill="#38f2e0" />
        </g>
      </g>
      <Wheel cx={-140} cy={-38} r={40} spin={spin} rim="#c8cddd" />
      <Wheel cx={150} cy={-38} r={40} spin={spin} rim="#c8cddd" />
    </g>
  );
};

// ---------------------------------------------------------------------------------- oilfield

/** A DRILLING RIG: a tapered mast with rounded lattice, the drill floor, the doghouse (the face lives in
 * its window when there is one) and a travelling block that rides on `block` 0 floor to 1 crown */
export const DrillRigV2: React.FC<Place & {block?: number; mood?: MachineMood; lit?: boolean}> = (p) => {
  const {frame = 0, block, mood, lit = true} = p;
  const id = useUid();
  const steel = '#e8a33a', blk = block ?? (0.5 + 0.4 * Math.sin(frame / 30 * 0.5));
  const mastH = 3400, baseW = 700, topW = 160, floorY = -900;
  const at2 = (t: number) => ({w: baseW + (topW - baseW) * t, y: floorY - mastH * t});
  const rungs = Array.from({length: 14}).map((_, i) => at2(i / 13));
  return (
    <g transform={at(p)}>
      <defs><Lit id={`${id}-s`} c={steel} /><Lit id={`${id}-d`} c="#3d7bd9" /></defs>
      <ContactShadow x={0} y={6} w={2400} opacity={0.32} />
      {/* substructure */}
      <path d={`M-700 0 L-560 ${floorY} L560 ${floorY} L700 0`} stroke={line(steel)} strokeWidth={60} strokeLinejoin="round" fill="none" />
      <path d={`M-700 0 L-560 ${floorY} L560 ${floorY} L700 0`} stroke={`url(#${id}-s)`} strokeWidth={44} strokeLinejoin="round" fill="none" />
      <path d={`M-620 -440 L620 -440 M-640 -300 L0 ${floorY} L640 -300`} stroke={steel} strokeWidth={22} strokeLinecap="round" fill="none" />
      {/* the mast: two legs and rounded rungs and braces */}
      {[-1, 1].map((sd) => <g key={sd}>
        <path d={`M${sd * baseW / 2} ${floorY} L${sd * topW / 2} ${floorY - mastH}`} stroke={line(steel)} strokeWidth={56} strokeLinecap="round" />
        <path d={`M${sd * baseW / 2} ${floorY} L${sd * topW / 2} ${floorY - mastH}`} stroke={sd < 0 ? light(steel, 0.2) : shade(steel, 0.15)}
          strokeWidth={40} strokeLinecap="round" />
      </g>)}
      {rungs.map((r, i) => <g key={i}>
        <path d={`M${-r.w / 2} ${r.y} L${r.w / 2} ${r.y}`} stroke={steel} strokeWidth={18} strokeLinecap="round" />
        {i < rungs.length - 1 && <path d={`M${-r.w / 2} ${r.y} L${rungs[i + 1].w / 2} ${rungs[i + 1].y}`} stroke={shade(steel, 0.1)}
          strokeWidth={12} strokeLinecap="round" />}
      </g>)}
      {/* crown block and the line to the travelling block */}
      <rect x={-150} y={floorY - mastH - 110} width={300} height={120} rx={40} fill={`url(#${id}-s)`} stroke={line(steel)} strokeWidth={8} />
      <path d={`M0 ${floorY - mastH} L0 ${floorY - 120 - (mastH - 400) * blk}`} stroke="#3a3550" strokeWidth={10} />
      <g transform={`translate(0 ${floorY - 120 - (mastH - 400) * blk})`}>
        <rect x={-80} y={-60} width={160} height={180} rx={50} fill="#ffd166" stroke={line('#ffd166')} strokeWidth={8} />
        <path d="M0 120 Q-30 160 0 200 Q30 160 0 120" stroke="#3a3550" strokeWidth={14} fill="none" />
      </g>
      {/* drill floor and the doghouse */}
      <rect x={-760} y={floorY - 40} width={1520} height={80} rx={36} fill={`url(#${id}-d)`} stroke={line('#3d7bd9')} strokeWidth={8} />
      <g transform={`translate(-1040 ${floorY + 40})`}>
        <rect x={-300} y={-360} width={600} height={360} rx={60} fill={`url(#${id}-d)`} stroke={line('#3d7bd9')} strokeWidth={9} />
        <path d="M-270 -330 Q-60 -350 200 -334" stroke="#ffffff" strokeWidth={14} strokeLinecap="round" opacity={0.5} fill="none" />
        {mood ? <Visor x={0} y={-200} w={360} h={150} mood={mood} frame={frame} />
          : <rect x={-170} y={-270} width={340} height={140} rx={44} fill={lit ? '#ffe9a8' : '#1d2150'} />}
        <path d={`M300 -300 L520 -900`} stroke={steel} strokeWidth={20} strokeLinecap="round" />
      </g>
      {lit && [0.25, 0.55, 0.85].map((t) => <Glow key={t} x={0} y={floorY - mastH * t} r={90} color="#fff1b8" opacity={0.25} />)}
    </g>
  );
};

// ---------------------------------------------------------------------------------- farm

/** A CENTRE PIVOT in side view: a pivot point with its control box (the face), arched spans on wheeled
 * A-frame towers, drops spraying. `spans` 2 to 6, `running` animates the water and creeps the wheels */
export const CentrePivotV2: React.FC<Place & {spans?: number; running?: boolean; mood?: MachineMood; rate?: number[]}> = (p) => {
  const {frame = 0, spans = 4, running = true, mood, rate} = p;
  const id = useUid();
  const steel = '#cfd6e6', SPAN = 1500, H = 420;
  const x0 = 0, towers = Array.from({length: spans + 1}).map((_, i) => x0 + i * SPAN);
  return (
    <g transform={at(p)}>
      <defs><Lit id={`${id}-s`} c={steel} /><Lit id={`${id}-p`} c="#3d7bd9" />
        <linearGradient id={`${id}-w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#bff0ff" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#bff0ff" stopOpacity={0} /></linearGradient></defs>
      {towers.map((tx, i) => <ContactShadow key={`s${i}`} x={tx} y={6} w={i === 0 ? 500 : 420} opacity={0.28} />)}
      {/* spans: an arched pipe with a truss under it */}
      {towers.slice(0, -1).map((tx, i) => {
        const a = tx, b = towers[i + 1], mid = (a + b) / 2, sag = 120;
        const r = rate ? rate[i % rate.length] : 0.5 + 0.4 * Math.sin(i * 1.7 + 1);
        return <g key={i}>
          <path d={`M${a} ${-H} Q${mid} ${-H - sag} ${b} ${-H}`} stroke={line(steel)} strokeWidth={40} fill="none" strokeLinecap="round" />
          <path d={`M${a} ${-H} Q${mid} ${-H - sag} ${b} ${-H}`} stroke={`url(#${id}-s)`} strokeWidth={28} fill="none" strokeLinecap="round" />
          <path d={`M${a} ${-H + 60} L${mid} ${-H - 40} L${b} ${-H + 60}`} stroke={shade(steel, 0.2)} strokeWidth={10} fill="none" />
          {Array.from({length: 6}).map((_, k) => {
            const t = (k + 0.5) / 6, dx = a + (b - a) * t, dy = -H - sag * 4 * t * (1 - t) * 0.5 - 0;
            const puff = running ? 0.6 + 0.4 * Math.sin(frame * 0.5 + k + i) : 0;
            return <g key={k}>
              <path d={`M${dx} ${dy} L${dx} ${-160}`} stroke={shade(steel, 0.3)} strokeWidth={6} />
              {running && <ellipse cx={dx} cy={-90} rx={60 + 40 * r} ry={80} fill={`url(#${id}-w)`} opacity={puff * (0.4 + 0.6 * r)} />}
            </g>;
          })}
        </g>;
      })}
      {/* towers: an A-frame on two wheels */}
      {towers.slice(1).map((tx, i) => <g key={`t${i}`}>
        <path d={`M${tx - 160} -60 L${tx} ${-H} L${tx + 160} -60`} stroke={line(steel)} strokeWidth={34} fill="none" strokeLinejoin="round" />
        <path d={`M${tx - 160} -60 L${tx} ${-H} L${tx + 160} -60`} stroke={steel} strokeWidth={22} fill="none" strokeLinejoin="round" />
        <Wheel cx={tx - 160} cy={-60} r={60} spin={running ? frame * 1.2 : 0} rim="#3a3550" />
        <Wheel cx={tx + 160} cy={-60} r={60} spin={running ? frame * 1.2 : 0} rim="#3a3550" />
        <rect x={tx - 40} y={-H + 40} width={80} height={60} rx={20} fill="#3a3550" />
      </g>)}
      {/* the pivot point, its tower and the control box */}
      <path d={`M${x0 - 120} 0 L${x0} ${-H - 40} L${x0 + 120} 0`} stroke={line(steel)} strokeWidth={40} fill="none" strokeLinejoin="round" />
      <path d={`M${x0 - 120} 0 L${x0} ${-H - 40} L${x0 + 120} 0`} stroke={steel} strokeWidth={26} fill="none" strokeLinejoin="round" />
      <g transform={`translate(${x0 - 260} -260)`}>
        <rect x={-130} y={-120} width={260} height={240} rx={50} fill={`url(#${id}-p)`} stroke={line('#3d7bd9')} strokeWidth={8} />
        {mood ? <Visor x={0} y={-10} w={190} h={96} mood={mood} frame={frame} />
          : <rect x={-80} y={-60} width={160} height={90} rx={24} fill="#1d2150" />}
        <path d="M0 120 L0 260" stroke="#3a3550" strokeWidth={20} />
        <circle cx={90} cy={-90} r={12} fill={running ? '#7dff8a' : '#ff5d5d'} />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------------- what Texas makes

/** AN INDUSTRIAL ROBOT ARM: a turning base, two rounded links and a wrist with a camera eye and a
 * gripper. `reach` 0 to 1 extends it, `grip` closes the fingers. The camera eye is its face. */
export const RobotArmV2: React.FC<Place & {reach?: number; turn?: number; grip?: number; mood?: MachineMood; paint?: string}> = (p) => {
  const {frame = 0, reach = 0.5 + 0.5 * Math.sin((p.frame ?? 0) / 30 * 1.1), turn = 0, grip = 0.5, mood, paint = '#ff8a1f'} = p;
  const id = useUid();
  const a1 = -70 + reach * 50 + turn * 10, a2 = 80 - reach * 70, L1 = 900, L2 = 780;
  const r1 = (a1 * Math.PI) / 180, r2 = ((a1 + a2) * Math.PI) / 180;
  const sx = 0, sy = -520, ex = sx + Math.cos(r1) * L1, ey = sy + Math.sin(r1) * L1;
  const wx = ex + Math.cos(r2) * L2, wy = ey + Math.sin(r2) * L2;
  const link = (x1: number, y1: number, x2: number, y2: number, w: number) => <g>
    <path d={`M${x1} ${y1} L${x2} ${y2}`} stroke={line(paint)} strokeWidth={w + 16} strokeLinecap="round" />
    <path d={`M${x1} ${y1} L${x2} ${y2}`} stroke={paint} strokeWidth={w} strokeLinecap="round" />
    <path d={`M${x1} ${y1} L${x2} ${y2}`} stroke={light(paint, 0.55)} strokeWidth={w * 0.22} strokeLinecap="round" opacity={0.6}
      transform={`translate(${-w * 0.18} ${-w * 0.18})`} />
  </g>;
  const g = 30 + (1 - grip) * 50;
  return (
    <g transform={at(p, ' scale(0.13)')}>{/* drawn at 20 m, shown at 2.6 m, a real cell arm */}
      <defs><Lit id={`${id}-b`} c="#4a4f6e" /><Lit id={`${id}-o`} c={paint} /></defs>
      <ContactShadow x={0} y={6} w={900} opacity={0.32} />
      <rect x={-340} y={-120} width={680} height={120} rx={40} fill={`url(#${id}-b)`} stroke={line('#4a4f6e')} strokeWidth={8} />
      <path d="M-220 -120 L-170 -440 Q-160 -520 0 -540 Q160 -520 170 -440 L220 -120 Z" fill={`url(#${id}-o)`} stroke={line(paint)}
        strokeWidth={9} strokeLinejoin="round" />
      {link(sx, sy, ex, ey, 190)}
      <circle cx={sx} cy={sy} r={130} fill={`url(#${id}-o)`} stroke={line(paint)} strokeWidth={9} />
      <circle cx={sx} cy={sy} r={56} fill="#4a4f6e" />
      {link(ex, ey, wx, wy, 140)}
      <circle cx={ex} cy={ey} r={104} fill={`url(#${id}-o)`} stroke={line(paint)} strokeWidth={9} />
      <circle cx={ex} cy={ey} r={44} fill="#4a4f6e" />
      <g transform={`translate(${wx} ${wy}) rotate(${a1 + a2 + 90})`}>
        <rect x={-110} y={-60} width={220} height={150} rx={50} fill={`url(#${id}-b)`} stroke={line('#4a4f6e')} strokeWidth={8} />
        {mood ? <Visor x={0} y={14} w={170} h={80} mood={mood} frame={frame} />
          : <><circle cx={0} cy={16} r={34} fill="#0c0e29" /><circle cx={0} cy={16} r={18} fill="#38f2e0" /></>}
        {[-1, 1].map((sd) => <path key={sd} d={`M${sd * g} 90 L${sd * g} 210 Q${sd * g} 236 ${sd * (g - 26)} 236`} stroke={line('#9aa3bd')}
          strokeWidth={46} strokeLinecap="round" fill="none" />)}
        {[-1, 1].map((sd) => <path key={`f${sd}`} d={`M${sd * g} 90 L${sd * g} 210 Q${sd * g} 236 ${sd * (g - 26)} 236`} stroke="#c8cfe0"
          strokeWidth={30} strokeLinecap="round" fill="none" />)}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------------- record and rule

/** A DATA HALL ROW: rounded cabinets receding in depth, glass doors, blinking lights, a cold-aisle glow.
 * `count` cabinets, `load` 0 to 1 drives how many lights are on, `fault` marks one cabinet red. */
export const ServerRackV2: React.FC<Place & {count?: number; load?: number; fault?: number; mood?: MachineMood}> = (p) => {
  const {frame = 0, count = 5, load = 0.8, fault, mood} = p;
  const id = useUid();
  const body = '#2f3352', W = 60 * 10, H = 220 * 10;
  return (
    <g transform={at(p, ' scale(0.1)')}>{/* drawn in millimetres: a cabinet is 0.6 m by 2.2 m */}
      <defs><Lit id={`${id}-c`} c={body} /><linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity={0.22} /><stop offset="40%" stopColor="#ffffff" stopOpacity={0} />
        <stop offset="60%" stopColor="#ffffff" stopOpacity={0.08} /><stop offset="100%" stopColor="#ffffff" stopOpacity={0} /></linearGradient></defs>
      <ContactShadow x={(count - 1) * W * 0.42} y={6} w={count * W * 0.9} opacity={0.3} />
      {Array.from({length: count}).map((_, k) => {
        const i = count - 1 - k;            // draw the far ones first
        const s = 1 - i * 0.06, x = i * W * 0.84 * (1 - i * 0.02), dim = i * 0.08;
        const bad = fault === i;
        return (
          <g key={i} transform={`translate(${x} 0) scale(${s})`} opacity={1 - dim * 0.5}>
            <rect x={-W / 2} y={-H} width={W} height={H} rx={60} fill={`url(#${id}-c)`} stroke={line(body)} strokeWidth={10} />
            <rect x={-W / 2 + 40} y={-H + 60} width={W - 80} height={H - 180} rx={36} fill="#151833" />
            {Array.from({length: 18}).map((__, r) => {
              const y = -H + 110 + r * 108;
              const on = ((r * 7 + i * 3 + Math.floor(frame / 6)) % 10) / 10 < load;
              return <g key={r}>
                <rect x={-W / 2 + 70} y={y} width={W - 140} height={70} rx={18} fill="#262a4a" />
                <circle cx={W / 2 - 110} cy={y + 35} r={12} fill={bad && r % 3 === 0 ? '#ff4d6d' : on ? '#38f2a0' : '#33395e'} />
                <circle cx={W / 2 - 150} cy={y + 35} r={12} fill={on && r % 2 ? '#38c2f2' : '#33395e'} />
                <rect x={-W / 2 + 100} y={y + 26} width={180} height={18} rx={9} fill="#3a4170" />
              </g>;
            })}
            <rect x={-W / 2 + 40} y={-H + 60} width={W - 80} height={H - 180} rx={36} fill={`url(#${id}-g)`} />
            {bad && <Glow x={0} y={-H / 2} r={W * 0.8} color="#ff4d6d" opacity={0.35} />}
            {i === 0 && mood && <Visor x={0} y={-H + 220} w={W - 160} h={180} mood={mood} frame={frame} />}
          </g>
        );
      })}
      <Glow x={-W * 0.6} y={-H * 0.4} r={W * 1.1} color="#7cc8ff" opacity={0.25} />
    </g>
  );
};

// ---------------------------------------------------------------------------------- weather

/** A SENSOR MAST: a pole, a solar panel, and either a wildfire camera that pans (`kind` 'camera') or a
 * flood gauge with a level that rises on `level` 0 to 1 (`kind` 'flood'). The box at its foot is the face. */
export const SensorMastV2: React.FC<Place & {kind?: 'camera' | 'flood'; level?: number; mood?: MachineMood; alert?: boolean}> = (p) => {
  const {frame = 0, kind = 'camera', level = 0.4, mood, alert = false} = p;
  const id = useUid();
  const pan = Math.sin(frame / 30 * 0.6) * 30;
  const steel = '#cfd6e6', box = '#3d7bd9', poleH = kind === 'camera' ? 1500 : 900;
  return (
    <g transform={at(p)}>
      <defs><Lit id={`${id}-s`} c={steel} /><Lit id={`${id}-b`} c={box} />
        <linearGradient id={`${id}-pv`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#5b7bff" />
          <stop offset="100%" stopColor="#1d2a8a" /></linearGradient></defs>
      <ContactShadow x={0} y={6} w={500} opacity={0.32} />
      <rect x={-22} y={-poleH} width={44} height={poleH} rx={22} fill={`url(#${id}-s)`} stroke={line(steel)} strokeWidth={6} />
      <path d={`M0 ${-poleH * 0.7 + 60} L-120 ${-poleH * 0.7 + 40}`} stroke={shade(steel, 0.2)} strokeWidth={22} strokeLinecap="round" />
      <g transform={`translate(-30 ${-poleH * 0.7}) rotate(-28)`}>
        <rect x={-260} y={-110} width={260} height={180} rx={24} fill={`url(#${id}-pv)`} stroke={line('#2a3a9a')} strokeWidth={7} />
        {[1, 2].map((i) => <path key={i} d={`M${-260 + i * 87} -110 L${-260 + i * 87} 70`} stroke="#8fa6ff" strokeWidth={4} opacity={0.6} />)}
        <path d="M-240 -96 L-150 -96" stroke="#ffffff" strokeWidth={10} strokeLinecap="round" opacity={0.6} />
      </g>
      {kind === 'camera' ? <g transform={`translate(0 ${-poleH})`}>
        <rect x={-14} y={-60} width={28} height={60} rx={14} fill={steel} />
        <g transform={`rotate(${pan * 0.4}) scale(0.6)`}>
          <rect x={-110} y={-170} width={220} height={130} rx={60} fill="#f4f6fb" stroke={line('#f4f6fb')} strokeWidth={8} />
          <circle cx={70 + pan * 0.3} cy={-105} r={42} fill="#0c0e29" /><circle cx={70 + pan * 0.3} cy={-105} r={22} fill="#38f2e0" />
          <circle cx={58 + pan * 0.3} cy={-116} r={8} fill="#ffffff" />
        </g>
        <path d={`M150 -105 L${700 + pan * 6} ${-300} L${700 + pan * 6} ${100} Z`} fill="#38f2e0" opacity={0.12} />
      </g> : <g>
        <rect x={60} y={-poleH * 0.9} width={60} height={poleH * 0.9} rx={30} fill="#f4f6fb" stroke={line('#f4f6fb')} strokeWidth={6} />
        <rect x={68} y={-poleH * 0.9 * clamp01(level) - 8} width={44} height={poleH * 0.9 * clamp01(level)} rx={22}
          fill={level > 0.7 ? '#ff4d6d' : '#38c2f2'} />
        {[0.25, 0.5, 0.75].map((t) => <path key={t} d={`M120 ${-poleH * 0.9 * t} l30 0`} stroke="#3a3550" strokeWidth={6} />)}
      </g>}
      <g transform="translate(0 -300) scale(0.5)">
        <rect x={-150} y={-120} width={300} height={240} rx={56} fill={`url(#${id}-b)`} stroke={line(box)} strokeWidth={8} />
        {mood ? <Visor x={0} y={-6} w={220} h={100} mood={mood} frame={frame} />
          : <rect x={-90} y={-56} width={180} height={90} rx={26} fill="#1d2150" />}
        <circle cx={110} cy={-90} r={14} fill={alert ? (frame % 20 < 10 ? '#ff4d6d' : '#7a2236') : '#7dff8a'} />
      </g>
      {alert && <Glow x={55} y={-345} r={70} color="#ff4d6d" opacity={frame % 20 < 10 ? 0.45 : 0.15} />}
    </g>
  );
};

// ---------------------------------------------------------------------------------- clinic and desk

/** A TABLET in two hands' reach: a rounded bezel, a lit screen and a glass sheen. Anything passed as
 * children draws on the screen, in a 0..1000 by 0..700 box. Not to scale: size it with `scale`. */
export const TabletV2: React.FC<{x: number; y: number; scale?: number; tilt?: number; children?: React.ReactNode;
  screen?: string}> = ({x, y, scale = 1, tilt = -6, children, screen = '#f4f8ff'}) => {
  const id = useUid();
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt}) scale(${scale})`}>
      <defs><linearGradient id={`${id}-sh`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#ffffff" stopOpacity={0.3} />
        <stop offset="35%" stopColor="#ffffff" stopOpacity={0} /></linearGradient>
        <clipPath id={`${id}-c`}><rect x={-500} y={-350} width={1000} height={700} rx={40} /></clipPath></defs>
      <ContactShadow x={0} y={430} w={900} opacity={0.18} />
      <rect x={-560} y={-410} width={1120} height={820} rx={90} fill="#2b2d4a" stroke={line('#2b2d4a')} strokeWidth={10} />
      <path d="M-520 -360 Q-200 -400 300 -380" stroke="#6b6f9a" strokeWidth={12} strokeLinecap="round" fill="none" opacity={0.6} />
      <rect x={-500} y={-350} width={1000} height={700} rx={40} fill={screen} />
      <g clipPath={`url(#${id}-c)`}><g transform="translate(-500 -350)">{children}</g></g>
      <rect x={-500} y={-350} width={1000} height={700} rx={40} fill={`url(#${id}-sh)`} />
    </g>
  );
};

/** A CLINIC SCREEN on an arm: the monitor at a bedside or a reading desk, with children on its screen */
export const ClinicScreenV2: React.FC<Place & {children?: React.ReactNode; mood?: MachineMood}> = (p) => {
  const {frame = 0, children, mood} = p;
  const id = useUid();
  const body = '#e9edf7';
  return (
    <g transform={at(p, ' scale(0.1)')}>{/* drawn in millimetres: about 1.6 m to the top of the screen */}
      <defs><Lit id={`${id}-b`} c={body} /><clipPath id={`${id}-c`}><rect x={-300} y={-1560} width={600} height={400} rx={30} /></clipPath></defs>
      <ContactShadow x={0} y={6} w={420} opacity={0.3} />
      <rect x={-160} y={-40} width={320} height={40} rx={20} fill={shade(body, 0.2)} />
      <rect x={-24} y={-1100} width={48} height={1060} rx={24} fill={`url(#${id}-b)`} stroke={line(body)} strokeWidth={6} />
      <rect x={-340} y={-1600} width={680} height={480} rx={60} fill={`url(#${id}-b)`} stroke={line(body)} strokeWidth={8} />
      <rect x={-300} y={-1560} width={600} height={400} rx={30} fill="#0f1433" />
      <g clipPath={`url(#${id}-c)`}><g transform="translate(-300 -1560)">{children ??
        <path d={`M0 200 ${Array.from({length: 30}).map((_, i) => `L${i * 20 + 10} ${200 + (i % 6 === 3 ? -120 : i % 6 === 4 ? 60 : 0) * (0.8 + 0.2 *
          Math.sin(frame / 10))}`).join(' ')}`} stroke="#38f2a0" strokeWidth={8} fill="none" strokeLinejoin="round" />}</g></g>
      {mood && <Visor x={0} y={-1360} w={300} h={120} mood={mood} frame={frame} />}
      <circle cx={280} cy={-1150} r={10} fill="#7dff8a" />
    </g>
  );
};

/** every hero machine by name, for the shelf index and the reference sheet */
export const MACHINES_V2 = ['AutoTruckV2', 'RobotaxiV2', 'DrillRigV2', 'CentrePivotV2', 'RobotArmV2', 'ServerRackV2', 'SensorMastV2',
  'TabletV2', 'ClinicScreenV2'] as const;
export {mix};
