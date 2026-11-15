import React from 'react';
import {light, line, mix, shade} from '../../../look/color';
import {ContactShadow, Glow, clamp01, useUid} from '../../../look/Kit';
import {Visor, type MachineMood} from '../../../look/machines';
import {FONT} from '../../../lib/type';

/**
 * The drawings this film needs that the shelf lacks, in the look v2 idiom: round, lit from the upper
 * left, hue-tinted line, a contact shadow under everything that stands, a face on the hero machine.
 *
 *  Box        one shipping container, end-on or side-on, with an optional glow
 *  Stack      a block of container rows seen end-on, the yard the crane straddles
 *  RTG        the hero: a rubber-tired gantry crane with a face on its girder, a trolley, a cab with
 *             the operator in it, and a spreader that lowers on its cables
 *  Truck      a day cab on a chassis, a driver in the window, an optional box on the back
 *  Ship       a container ship in the channel, stacked high, for the wide views
 *  MoveCard   one job on the dispatch list, a rounded card with its number
 *  YardMap    the dispatcher's top-down view of the yard: blocks, cranes as dots, paths that draw on
 *
 * Every state is a prop driven from the shot clock. Disclosed illustration, no brand marks.
 */

export const BOX_COLORS = ['#e8573c', '#2f7fd8', '#2fae7a', '#f2b33d', '#8a5bd6', '#e2e6f0', '#d9467a', '#4fb8c9'];
export const HERO_BOX = '#ff7a1a';

const Lit: React.FC<{id: string; c: string; v?: boolean}> = ({id, c, v}) => (
  <linearGradient id={id} x1="0" y1="0" x2={v ? '0' : '0.4'} y2="1">
    <stop offset="0%" stopColor={light(c, 0.45)} /><stop offset="45%" stopColor={c} /><stop offset="100%" stopColor={shade(c, 0.38)} />
  </linearGradient>
);

/** ONE CONTAINER. End-on (w about 120) or side-on (w about 280). `glow` lights it in the accent. */
export const Box: React.FC<{x: number; y: number; w?: number; h?: number; c: string; glow?: number; side?: boolean;
  dim?: number; ghost?: boolean}> = ({x, y, w = 120, h = 112, c, glow = 0, side = false, dim = 0, ghost = false}) => {
  const id = useUid();
  const col = dim > 0 ? mix(c, '#7c86a8', dim * 0.6) : c;
  if (ghost) {
    return <rect x={x - w / 2} y={y - h} width={w} height={h} rx={14} fill="none" stroke="#ffffff" strokeWidth={6}
      strokeDasharray="18 14" opacity={0.75} />;
  }
  const ribs = side ? 9 : 3;
  return (
    <g>
      <defs><Lit id={`${id}-b`} c={col} /></defs>
      {glow > 0 && <Glow x={x} y={y - h / 2} r={w * 1.1} color="#fff1a8" opacity={0.55 * glow} />}
      <rect x={x - w / 2} y={y - h} width={w} height={h} rx={14} fill={`url(#${id}-b)`} stroke={line(col)} strokeWidth={6} />
      {Array.from({length: ribs}).map((_, i) => {
        const rx = x - w / 2 + ((i + 1) * w) / (ribs + 1);
        return <path key={i} d={`M${rx} ${y - h + 14} L${rx} ${y - 14}`} stroke={shade(col, 0.22)} strokeWidth={side ? 6 : 8}
          strokeLinecap="round" opacity={0.7} />;
      })}
      {!side && <path d={`M${x - 6} ${y - h + 18} L${x - 6} ${y - 18} M${x + 6} ${y - h + 18} L${x + 6} ${y - 18}`}
        stroke={line(col)} strokeWidth={5} strokeLinecap="round" opacity={0.6} />}
      <path d={`M${x - w / 2 + 14} ${y - h + 10} L${x + w / 2 - 18} ${y - h + 10}`} stroke="#ffffff" strokeWidth={7}
        strokeLinecap="round" opacity={0.45} />
      {glow > 0 && <rect x={x - w / 2 - 6} y={y - h - 6} width={w + 12} height={h + 12} rx={18} fill="none" stroke="#ffe066"
        strokeWidth={9} opacity={glow} />}
    </g>
  );
};

/**
 * A BLOCK OF THE YARD, end-on. `cols` lists each row's boxes bottom first as colours ('' for an empty
 * slot). Box `hero` (col, tier) is drawn in the hero orange. `blockers` dims nothing but rings the boxes
 * that sit on top of the hero in red when `warn` is above 0. Ground at y.
 */
export const Stack: React.FC<{x: number; y: number; s?: number; cols: string[][]; hero?: [number, number] | null;
  warn?: number; heroGlow?: number; gap?: number}> = ({x, y, s = 1, cols, hero = null, warn = 0, heroGlow = 0, gap = 10}) => {
  const W = 120, H = 112;
  const span = cols.length * (W + gap) - gap;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ContactShadow x={0} y={8} w={span * 1.1} opacity={0.3} />
      {cols.map((col, ci) => col.map((c, ti) => {
        if (!c) return null;
        const bx = -span / 2 + W / 2 + ci * (W + gap);
        const by = -ti * (H + 4);
        const isHero = hero && hero[0] === ci && hero[1] === ti;
        const blocking = hero && hero[0] === ci && ti > hero[1];
        return <g key={`${ci}-${ti}`}>
          <Box x={bx} y={by} w={W} h={H} c={isHero ? HERO_BOX : c} glow={isHero ? heroGlow : 0} />
          {blocking && warn > 0 && <rect x={bx - W / 2 - 5} y={by - H - 5} width={W + 10} height={H + 10} rx={18} fill="none"
            stroke="#ff4d5e" strokeWidth={9} opacity={warn} />}
        </g>;
      }))}
    </g>
  );
};

/** a rubber tyre that turns */
const Tyre: React.FC<{cx: number; cy: number; r: number; spin: number}> = ({cx, cy, r, spin}) => (
  <g transform={`translate(${cx} ${cy})`}>
    <circle r={r} fill="#24213a" stroke={line('#24213a')} strokeWidth={r * 0.1} />
    <circle r={r * 0.55} fill="#d9dde8" stroke={shade('#d9dde8', 0.4)} strokeWidth={r * 0.07} />
    <g transform={`rotate(${spin})`}>{[0, 90, 180, 270].map((a) => <circle key={a} cx={Math.cos(a * Math.PI / 180) * r * 0.32}
      cy={Math.sin(a * Math.PI / 180) * r * 0.32} r={r * 0.09} fill="#8a90a8" />)}</g>
    <path d={`M${-r * 0.5} ${-r * 0.4} A${r * 0.65} ${r * 0.65} 0 0 1 ${r * 0.1} ${-r * 0.62}`} stroke="#ffffff"
      strokeWidth={r * 0.09} fill="none" strokeLinecap="round" opacity={0.6} />
  </g>
);

/**
 * THE HERO. A rubber-tired gantry crane seen end-on: two legs on tyres, a girder across the top with
 * the crane's face on it, a trolley that runs along the girder, the operator's cab hung under the
 * trolley with a person in its window, and a spreader on four cables. Ground at y, `span` between the
 * legs, `tall` from ground to girder. `trolley` -1..1 runs the trolley along, `hoist` 0..1 lowers the
 * spreader from the girder toward the ground, `carry` hangs a box from it. `roll` turns the tyres.
 */
export const RTG: React.FC<{x: number; y: number; s?: number; span?: number; tall?: number; frame: number; trolley?: number;
  hoist?: number; carry?: string | null; carryGlow?: number; mood?: MachineMood; roll?: number; paint?: string;
  operator?: {skin: string; hat: string}; latch?: number; hookY?: number; carryW?: number}> = ({x, y, s = 1, span = 760, tall = 760, frame, trolley = 0,
  hoist = 0.3, carry = null, carryGlow = 0, mood = 'happy', roll = 0, paint = '#ffc23d',
  operator = {skin: '#8c5733', hat: '#ffffff'}, latch = 0, hookY, carryW = 170}) => {
  const id = useUid();
  const half = span / 2;
  const tx = trolley * (half - 120);
  const top = -tall;
  const cableLen = 90 + hoist * (tall - 260);
  const spY = hookY ?? top + 70 + cableLen;
  const sway = Math.sin(frame * 0.08) * 4 * (0.3 + hoist);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs><Lit id={`${id}-p`} c={paint} /><Lit id={`${id}-pv`} c={paint} v /><Lit id={`${id}-cab`} c="#eef2fb" /></defs>
      <ContactShadow x={-half} y={6} w={200} opacity={0.35} />
      <ContactShadow x={half} y={6} w={200} opacity={0.35} />
      {/* the legs, each a rounded A-frame on a bogie */}
      {[-1, 1].map((k) => (
        <g key={k} transform={`translate(${k * half} 0)`}>
          <path d={`M-70 -60 L-34 ${top + 40} L34 ${top + 40} L70 -60 Z`} fill="none" stroke={line(paint)} strokeWidth={66}
            strokeLinejoin="round" />
          <path d={`M-70 -60 L-34 ${top + 40} L34 ${top + 40} L70 -60 Z`} fill="none" stroke={`url(#${id}-pv)`} strokeWidth={50}
            strokeLinejoin="round" />
          <path d={`M-48 ${(top + 40) * 0.45} L48 ${(top + 40) * 0.45}`} stroke={`url(#${id}-p)`} strokeWidth={30} strokeLinecap="round" />
          <path d={`M-58 -80 L-30 ${top + 60}`} stroke="#ffffff" strokeWidth={9} strokeLinecap="round" opacity={0.45} />
          <rect x={-110} y={-96} width={220} height={52} rx={24} fill="#3a3550" stroke={line('#3a3550')} strokeWidth={6} />
          <Tyre cx={-62} cy={-36} r={40} spin={roll} />
          <Tyre cx={62} cy={-36} r={40} spin={roll} />
        </g>
      ))}
      {/* the girder, with the crane's face on its front */}
      <rect x={-half - 70} y={top - 40} width={span + 140} height={96} rx={40} fill={`url(#${id}-p)`} stroke={line(paint)}
        strokeWidth={9} />
      <path d={`M${-half - 40} ${top - 22} L${half + 30} ${top - 22}`} stroke="#ffffff" strokeWidth={12} strokeLinecap="round"
        opacity={0.5} />
      <Visor x={-half + 70} y={top + 8} w={150} h={66} mood={mood} frame={frame} />
      {/* the trolley, the cables, the spreader */}
      <g transform={`translate(${tx} 0)`}>
        <rect x={-120} y={top + 40} width={240} height={50} rx={22} fill="#3a3550" stroke={line('#3a3550')} strokeWidth={6} />
        {[-80, -30, 30, 80].map((cx) => <path key={cx} d={`M${cx} ${top + 88} L${cx * 0.9 + sway} ${spY}`} stroke="#2a2740"
          strokeWidth={6} />)}
        <g transform={`translate(${sway} ${spY})`}>
          <rect x={-104} y={-10} width={208} height={30} rx={14} fill="#4b4766" stroke={line('#4b4766')} strokeWidth={6} />
          {latch > 0 && [-96, 96].map((cx) => <circle key={cx} cx={cx} cy={24} r={9 + latch * 4} fill="#3ef0a0" opacity={latch} />)}
          {carry && <Box x={0} y={136} w={carryW} h={112} c={carry} glow={carryGlow} />}
        </g>
        {/* the operator's cab, hung on the trolley's side, a person at the window */}
        <g transform={`translate(${-150} ${top + 110})`}>
          <rect x={-70} y={-10} width={130} height={150} rx={30} fill={`url(#${id}-cab)`} stroke={line('#eef2fb')} strokeWidth={7} />
          <rect x={-54} y={10} width={98} height={84} rx={20} fill="#9fd6ff" stroke={line('#9fd6ff')} strokeWidth={5} />
          <circle cx={-6} cy={66} r={22} fill={operator.skin} />
          <path d="M-30 58 Q-6 26 18 58 Z" fill={operator.hat} stroke={line(operator.hat)} strokeWidth={3} />
          <rect x={-30} y={84} width={50} height={14} rx={7} fill="#ff8a1f" />
          <path d="M-46 18 L-20 18" stroke="#ffffff" strokeWidth={8} strokeLinecap="round" opacity={0.7} />
        </g>
      </g>
    </g>
  );
};

/**
 * A TRUCK. A day cab on a container chassis, side-on, facing right, ground at y. The driver is in the
 * window. `box` hangs a container on the chassis. `speed` spins the wheels and adds a shimmer.
 */
export const Truck: React.FC<{x: number; y: number; s?: number; frame: number; paint?: string; box?: string | null;
  boxGlow?: number; speed?: number; driver?: string; facing?: 1 | -1}> = ({x, y, s = 1, frame, paint = '#3a7be0', box = null,
  boxGlow = 0, speed = 0, driver = '#c98c5e', facing = 1}) => {
  const id = useUid();
  const spin = frame * speed * 16;
  const bob = Math.sin(frame * 0.6) * 2 * speed;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * facing} ${s})`}>
      <defs><Lit id={`${id}-c`} c={paint} /></defs>
      <ContactShadow x={-120} y={6} w={760} opacity={0.32} />
      <g transform={`translate(0 ${bob})`}>
        <rect x={-500} y={-110} width={560} height={30} rx={14} fill="#3a3550" />
        {box && <Box x={-230} y={-112} w={480} h={150} c={box} side glow={boxGlow} />}
        <path d="M60 -80 L60 -300 Q60 -330 92 -330 L200 -330 Q236 -330 246 -296 L270 -210 Q300 -200 300 -170 L300 -96
          Q300 -80 284 -80 Z" fill={`url(#${id}-c)`} stroke={line(paint)} strokeWidth={8} strokeLinejoin="round" />
        <path d="M100 -310 L196 -310 Q216 -310 222 -292 L240 -226 L100 -226 Z" fill="#a8dcff" stroke={line(paint)} strokeWidth={5}
          strokeLinejoin="round" />
        <circle cx={168} cy={-262} r={22} fill={driver} />
        <path d="M144 -270 Q168 -300 192 -270 Z" fill="#2c2b3c" />
        <rect x={146} y={-240} width={50} height={14} rx={7} fill="#ff8a1f" />
        <path d="M84 -316 L150 -316" stroke="#ffffff" strokeWidth={9} strokeLinecap="round" opacity={0.5} />
        <rect x={40} y={-380} width={22} height={200} rx={11} fill="#a7afc6" stroke={line('#a7afc6')} strokeWidth={4} />
        <ellipse cx={294} cy={-150} rx={9} ry={14} fill="#fff6c8" />
      </g>
      {[220, -10, -380, -450].map((cx) => <Tyre key={cx} cx={cx} cy={-50} r={48} spin={spin} />)}
      {speed > 0.3 && [0, 1].map((i) => <path key={i} d={`M-560 ${-150 - i * 70} l-120 0`} stroke="#ffffff" strokeWidth={12}
        strokeLinecap="round" opacity={0.35 * speed} />)}
    </g>
  );
};

/** A CONTAINER SHIP, side-on, stacked high, waterline at y. Bow to the right. */
export const Ship: React.FC<{x: number; y: number; s?: number; frame: number; rows?: number}> = ({x, y, s = 1, frame, rows = 4}) => {
  const id = useUid();
  const bob = Math.sin(frame * 0.05) * 4;
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${s})`}>
      <defs><Lit id={`${id}-h`} c="#2b4a8a" v /></defs>
      <path d="M-900 -40 L-860 -200 L760 -200 Q860 -200 900 -120 L840 0 L-860 0 Z" fill={`url(#${id}-h)`} stroke={line('#2b4a8a')}
        strokeWidth={10} strokeLinejoin="round" />
      <path d="M-860 -60 L840 -60" stroke="#e8573c" strokeWidth={26} />
      {Array.from({length: 13}).map((_, i) => Array.from({length: rows}).map((__, r) => (
        <rect key={`${i}-${r}`} x={-780 + i * 112} y={-200 - (r + 1) * 64} width={104} height={60} rx={10}
          fill={BOX_COLORS[(i * 3 + r * 5) % BOX_COLORS.length]} stroke="#1a1236" strokeOpacity={0.35} strokeWidth={4} />
      )))}
      <rect x={-890} y={-200 - rows * 64 - 160} width={110} height={rows * 64 + 160} rx={18} fill="#eef2fb" stroke={line('#eef2fb')}
        strokeWidth={6} />
      {[0, 1, 2].map((r) => <rect key={r} x={-874} y={-200 - rows * 64 - 140 + r * 48} width={78} height={22} rx={8} fill="#9fd6ff" />)}
    </g>
  );
};

/** ONE JOB on the dispatch list. `n` is the job number, `state` 0 waiting, 1 next, 2 done. */
export const MoveCard: React.FC<{x: number; y: number; s?: number; n: number; state?: number; text?: string;
  c?: string}> = ({x, y, s = 1, n, state = 0, text = '', c = HERO_BOX}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-6} y={8} width={392} height={104} rx={30} fill="#1a1236" opacity={0.25} />
    <rect x={-10} y={0} width={392} height={104} rx={30} fill={state === 1 ? '#fff4dc' : '#f4f6fb'}
      stroke={state === 1 ? '#ffb020' : '#c9cfe3'} strokeWidth={state === 1 ? 9 : 5} />
    <circle cx={50} cy={52} r={32} fill={state === 2 ? '#2fae7a' : c} />
    {state === 2 ? <path d="M34 52 L46 64 L68 38" stroke="#ffffff" strokeWidth={9} fill="none" strokeLinecap="round"
      strokeLinejoin="round" />
      : <g><rect x={32} y={38} width={36} height={28} rx={6} fill="#ffffff" opacity={0.9} />
        <path d="M44 42 L44 62 M56 42 L56 62" stroke={c} strokeWidth={4} strokeLinecap="round" /></g>}
    <text x={104} y={66} fontFamily={FONT.mono} fontWeight={700} fontSize={34} fill="#2b2d4a">{text}</text>
  </g>
);

/**
 * THE DISPATCHER'S SCREEN, top-down: rows of yard blocks, crane markers as rounded bars across them,
 * and a planned route that draws on with `route` 0..1 from the crane to the hero box. `jam` 0..1 shows
 * the old way: cranes bunched in one block with a red halo.
 */
export const YardMap: React.FC<{x: number; y: number; w: number; h: number; frame: number; route?: number; jam?: number;
  spread?: number; pick?: number}> = ({x, y, w, h, frame, route = 0, jam = 0, spread = 1, pick = 0}) => {
  const blocksX = 4, blocksY = 5;
  const bw = (w - 80) / blocksX, bh = (h - 80) / blocksY;
  const pulse = 0.6 + 0.4 * Math.sin(frame * 0.25);
  const cranes = [[0, 0], [1, 2], [2, 4], [3, 1], [0, 3], [2, 1]];
  const bunched = [[1, 1], [1, 1.3], [1, 1.6], [1.2, 1.15], [1.2, 1.45], [0.8, 1.3]];
  const hero = {bx: 3, by: 3};
  const cx = (bx: number) => x + 40 + bx * bw + bw / 2;
  const cy = (by: number) => y + 40 + by * bh + bh / 2;
  const start = {x: cx(2), y: cy(4)};
  const end = {x: cx(hero.bx), y: cy(hero.by)};
  const d = `M${start.x} ${start.y} C${start.x} ${start.y - bh} ${end.x - bw * 0.6} ${end.y + bh * 0.4} ${end.x} ${end.y}`;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={40} fill="#13163a" stroke="#3b4280" strokeWidth={8} />
      {Array.from({length: blocksX}).map((_, i) => Array.from({length: blocksY}).map((__, j) => (
        <g key={`${i}-${j}`}>
          <rect x={x + 40 + i * bw + 10} y={y + 40 + j * bh + 10} width={bw - 20} height={bh - 20} rx={16} fill="#232a62" />
          {[0, 1, 2].map((r) => <rect key={r} x={x + 40 + i * bw + 22} y={y + 40 + j * bh + 22 + r * ((bh - 44) / 3)} width={bw - 44}
            height={(bh - 44) / 3 - 8} rx={6} fill={BOX_COLORS[(i * 7 + j * 3 + r) % BOX_COLORS.length]} opacity={0.55} />)}
        </g>
      )))}
      {jam > 0 && <Glow x={cx(1)} y={cy(1.3)} r={bw * 1.1} color="#ff4d5e" opacity={0.6 * jam} />}
      {cranes.map(([bx, by], i) => {
        const [jx, jy] = bunched[i];
        const k = clamp01(spread) * (1 - jam);
        const px = cx(jx + (bx - jx) * k), py = cy(jy + (by - jy) * k);
        return <g key={i} transform={`translate(${px} ${py})`}>
          <rect x={-bw / 2 + 8} y={-16} width={bw - 16} height={20} rx={10} fill="#ffc23d" stroke="#5a3a00" strokeWidth={4} />
          <rect x={-bw / 2 + 8} y={-16} width={18} height={44} rx={8} fill="#ffc23d" stroke="#5a3a00" strokeWidth={4} />
          <rect x={bw / 2 - 26} y={-16} width={18} height={44} rx={8} fill="#ffc23d" stroke="#5a3a00" strokeWidth={4} />
          <rect x={-bw / 2 + 30} y={-12} width={22} height={12} rx={6} fill="#13163a" />
          <circle cx={-bw / 2 + 37} cy={-6} r={3} fill="#38f2e0" /><circle cx={-bw / 2 + 45} cy={-6} r={3} fill="#38f2e0" />
        </g>;
      })}
      {route > 0 && <path d={d} stroke="#3ef0a0" strokeWidth={12} fill="none" strokeLinecap="round" strokeDasharray={1400}
        strokeDashoffset={1400 * (1 - route)} />}
      <rect x={end.x - 30} y={end.y - 30} width={60} height={60} rx={14} fill={HERO_BOX} stroke="#ffffff"
        strokeWidth={pick > 0 ? 8 : 4} opacity={0.6 + 0.4 * pulse} />
      {pick > 0 && <circle cx={end.x} cy={end.y} r={40 + pick * 50} fill="none" stroke="#3ef0a0" strokeWidth={8} opacity={1 - pick} />}
    </g>
  );
};

/** the quay's ship-to-shore crane, a tall silhouette for the waterside views. Ground at y. */
export const QuayCrane: React.FC<{x: number; y: number; s?: number; frame: number; boom?: number}> = ({x, y, s = 1, frame, boom = 1}) => {
  const id = useUid();
  const c = '#e8573c';
  const tx = Math.sin(frame * 0.03) * 120;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs><Lit id={`${id}-q`} c={c} v /></defs>
      <ContactShadow x={0} y={6} w={420} opacity={0.3} />
      {[-160, 160].map((k) => <path key={k} d={`M${k} 0 L${k * 0.7} -720`} stroke={`url(#${id}-q)`} strokeWidth={46}
        strokeLinecap="round" />)}
      <path d="M-200 -420 L200 -420" stroke={`url(#${id}-q)`} strokeWidth={34} strokeLinecap="round" />
      <path d={`M-260 -720 L${380 + 520 * boom} -720`} stroke={line(c)} strokeWidth={60} strokeLinecap="round" />
      <path d={`M-260 -720 L${380 + 520 * boom} -720`} stroke={`url(#${id}-q)`} strokeWidth={46} strokeLinecap="round" />
      <path d="M0 -720 L-40 -940 L40 -940 Z" fill={c} stroke={line(c)} strokeWidth={8} strokeLinejoin="round" />
      <rect x={260 + tx} y={-700} width={90} height={60} rx={18} fill="#3a3550" />
      <path d={`M${305 + tx} -640 L${305 + tx} -420`} stroke="#2a2740" strokeWidth={6} />
      <rect x={250 + tx} y={-420} width={110} height={70} rx={12} fill={BOX_COLORS[1]} />
    </g>
  );
};

/** a ground plane of yard concrete with painted lane lines, for interior-free yard shots. Top at y. */
export const YardGround: React.FC<{y: number; pan?: number}> = ({y, pan = 0}) => (
  <g>
    <rect x={-200} y={y} width={1480} height={1920 - y + 200} fill="#c9c3cf" />
    <rect x={-200} y={y} width={1480} height={60} fill="#dcd6e0" opacity={0.7} />
    {Array.from({length: 9}).map((_, i) => <path key={i} d={`M${-120 + ((i * 180 - pan) % 1440 + 1440) % 1440} ${y + 220} l90 0`}
      stroke="#fff4dc" strokeWidth={14} strokeLinecap="round" opacity={0.8} />)}
  </g>
);

/**
 * THE TERMINAL YARD, laid over the region's ground for every yard shot: a far skyline of quay cranes,
 * tank farm and stacked boxes along the channel (paler and bluer with distance), and a worn concrete
 * apron with lane stripes running to the vanishing point. The sky stays the region's. `h` is the
 * horizon row for the shot's framing.
 */
export const YardApron: React.FC<{h: number; frame: number}> = ({h, frame}) => {
  const id = useUid();
  const far = (c: string) => mix(c, '#b9c6ec', 0.55);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-ap`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cfcdc8" /><stop offset="40%" stopColor="#bdb9b2" /><stop offset="100%" stopColor="#a39e96" />
        </linearGradient>
        <linearGradient id={`${id}-hz`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dfe9f6" stopOpacity={0} /><stop offset="45%" stopColor="#e6eef8" stopOpacity={0.92} />
          <stop offset="100%" stopColor="#eef2f8" stopOpacity={1} />
        </linearGradient>
      </defs>
      {/* Gulf haze over the far shore, so nothing of the plate's horizon reads through */}
      <rect x={-60} y={h - 300} width={1200} height={306} fill={`url(#${id}-hz)`} />
      {/* refinery columns and a cracking tower on the far side of the channel */}
      {[[640, 190, 26], [690, 150, 20], [730, 230, 30], [880, 170, 24], [1010, 200, 28], [500, 130, 18]].map(([x, ht, w], i) => (
        <g key={`r${i}`} fill={far('#9aa3bd')}>
          <rect x={x - w / 2} y={h - ht} width={w} height={ht} rx={w / 2} />
          <rect x={x - w / 2 - 6} y={h - ht * 0.6} width={w + 12} height={8} rx={4} />
        </g>))}
      {/* the far side of the channel: tanks, a flare stack, quay cranes, low stacks */}
      {[60, 150, 240].map((x, i) => <g key={`t${i}`}>
        <rect x={x - 38} y={h - 60} width={76} height={62} rx={14} fill={far('#e6e2ea')} />
        <ellipse cx={x} cy={h - 60} rx={38} ry={8} fill={far('#ffffff')} />
      </g>)}
      <rect x={300} y={h - 150} width={14} height={150} rx={7} fill={far('#8e95b0')} />
      <ellipse cx={307} cy={h - 160} rx={8} ry={12 + Math.sin(frame * 0.4) * 3} fill="#ffb347" opacity={0.85} />
      {[420, 600, 780, 960].map((x, i) => <g key={`q${i}`} stroke={far(i % 2 ? '#e8573c' : '#3a7be0')} strokeWidth={10}
        strokeLinecap="round" fill="none">
        <path d={`M${x - 30} ${h} L${x - 22} ${h - 120} M${x + 30} ${h} L${x + 22} ${h - 120} M${x - 70} ${h - 120} L${x + 110} ${h - 120}`} />
      </g>)}
      {Array.from({length: 14}).map((_, i) => (
        <rect key={`s${i}`} x={i * 80 - 10} y={h - 34 - (i % 3) * 12} width={74} height={36 + (i % 3) * 12} rx={6}
          fill={far(BOX_COLORS[(i * 5) % BOX_COLORS.length])} />))}
      {/* the apron */}
      <rect x={-60} y={h} width={1200} height={1980 - h} fill={`url(#${id}-ap)`} />
      <rect x={-60} y={h} width={1200} height={14} fill="#dedbe8" opacity={0.8} />
      {[-1400, -700, -250, 250, 700, 1400].map((dx, i) => (
        <path key={`l${i}`} d={`M${540 + dx * 0.04} ${h + 4} L${540 + dx} 1980`} stroke="#fff4dc" strokeWidth={10} opacity={0.55} />))}
      {Array.from({length: 6}).map((_, k) => {
        const yy = h + (1980 - h) * Math.pow((k + 1) / 7, 1.8);
        return <path key={`d${k}`} d={`M${540 - 30 - k * 20} ${yy} l${60 + k * 40} 0`} stroke="#ffd34d" strokeWidth={6 + k * 3}
          strokeLinecap="round" opacity={0.7} />;
      })}
      {[[180, 0.55], [860, 0.7], [420, 0.85]].map(([x, f], i) => (
        <ellipse key={`o${i}`} cx={x} cy={h + (1980 - h) * f} rx={70 + i * 20} ry={16 + i * 5} fill="#6f6680" opacity={0.18} />))}
    </g>
  );
};
