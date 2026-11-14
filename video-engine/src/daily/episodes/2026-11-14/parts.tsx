import React from 'react';
import {light, line, mix, shade} from '../../../look/color';
import {ContactShadow, Glow, clamp01, useUid} from '../../../look/Kit';
import {Visor, type MachineMood} from '../../../look/machines';
import {FONT} from '../../../lib/type';

/**
 * The drawings this film needs that the shelf lacks, in the look v2 idiom: round, lit from the upper
 * left, hue-tinted line, a contact shadow under everything that stands, a face on the hero machine.
 *
 *  SolarTable   the throughline object: one torque tube that gains its panels, gets checked, rides
 *               out and is set on its posts
 *  PanelBot     the hero: a gantry robot with a face that lowers a panel onto the tube
 *  Rover        the driverless carrier that hauls a finished table to the field
 *  Posts        a row of steel piles waiting for a table
 *  Conveyor     the line the tables ride along
 *
 * Every state is a prop driven from the shot clock. Disclosed illustration, no brand marks.
 */

const STEEL = '#9aa6c4';
const PANEL = '#24306b';

/** one solar module seen in an oblique view: a dark glass face with a sky sheen and a lit frame */
const Module: React.FC<{x: number; y: number; w: number; d: number; glow?: number; id: string}> = ({x, y, w, d, glow = 0, id}) => (
  <g transform={`translate(${x} ${y})`}>
    <path d={`M${-w / 2} 0 L${w / 2} 0 L${w / 2 + d * 0.6} ${-d} L${-w / 2 + d * 0.6} ${-d} Z`} fill={line(PANEL)}
      stroke={line(PANEL)} strokeWidth={10} strokeLinejoin="round" />
    <path d={`M${-w / 2} 0 L${w / 2} 0 L${w / 2 + d * 0.6} ${-d} L${-w / 2 + d * 0.6} ${-d} Z`} fill={`url(#${id}-pn)`}
      stroke={light(STEEL, 0.3)} strokeWidth={4} strokeLinejoin="round" />
    <path d={`M${-w / 2 + d * 0.35} ${-d * 0.6} L${-w / 2 + d * 0.5} ${-d * 0.85}`} stroke="#ffffff" strokeWidth={8}
      strokeLinecap="round" opacity={0.35} />
    <path d={`M${-w * 0.1} ${-d * 0.1} L${w * 0.05} ${-d * 0.9}`} stroke="#bcd3ff" strokeWidth={14} strokeLinecap="round" opacity={0.18} />
    {glow > 0 && <path d={`M${-w / 2} 0 L${w / 2} 0 L${w / 2 + d * 0.6} ${-d} L${-w / 2 + d * 0.6} ${-d} Z`} fill="#3ef0a0"
      opacity={0.35 * glow} />}
  </g>
);

/**
 * THE TABLE. A steel torque tube with `slots` module positions. `modules` counts the panels on it; the
 * fractional part is the next panel still coming down. `checked` 0..1 sweeps a green pass light along
 * it, `flag` 0..1 marks one panel for a second look. Drawn about 1000 units long at s = 1.
 */
export const SolarTable: React.FC<{x: number; y: number; s?: number; modules?: number; slots?: number; checked?: number;
  flag?: number; tilt?: number; shadow?: boolean}> = ({x, y, s = 1, modules = 0, slots = 6, checked = 0, flag = 0, tilt = 0,
  shadow = true}) => {
  const id = useUid();
  const w = 150, d = 120, span = slots * (w + 8);
  const full = Math.floor(modules), frac = modules - full;
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${tilt})`}>
      <defs>
        <linearGradient id={`${id}-pn`} x1="0" y1="1" x2="0.3" y2="0">
          <stop offset="0%" stopColor={shade(PANEL, 0.25)} /><stop offset="55%" stopColor={PANEL} />
          <stop offset="100%" stopColor={light('#3c63c9', 0.2)} />
        </linearGradient>
        <linearGradient id={`${id}-tb`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={light(STEEL, 0.55)} /><stop offset="50%" stopColor={STEEL} />
          <stop offset="100%" stopColor={shade(STEEL, 0.4)} />
        </linearGradient>
      </defs>
      {shadow && <ContactShadow x={0} y={40} w={span * 1.15} opacity={0.28} />}
      <rect x={-span / 2 - 30} y={-16} width={span + 60} height={32} rx={16} fill={`url(#${id}-tb)`} stroke={line(STEEL)} strokeWidth={6} />
      {Array.from({length: slots}).map((_, i) => {
        const cx = -span / 2 + w / 2 + i * (w + 8);
        if (i < full) {
          const pass = clamp01(checked * (slots + 1) - i);
          const flagged = flag > 0 && i === slots - 2;
          return <g key={i}>
            <Module x={cx} y={-8} w={w} d={d} glow={flagged ? 0 : pass} id={id} />
            {flagged && <path d={`M${cx - w / 2} -8 L${cx + w / 2} -8 L${cx + w / 2 + d * 0.6} ${-8 - d} L${cx - w / 2 + d * 0.6} ${-8 - d} Z`}
              fill="none" stroke="#ffb020" strokeWidth={10 * flag} strokeLinejoin="round" />}
          </g>;
        }
        if (i === full && frac > 0) {
          return <g key={i} opacity={clamp01(frac * 3)}><Module x={cx} y={-8 - (1 - frac) * 260} w={w} d={d} id={id} /></g>;
        }
        return <rect key={i} x={cx - 12} y={-30} width={24} height={20} rx={6} fill={shade(STEEL, 0.2)} />;
      })}
    </g>
  );
};

/**
 * THE HERO. A gantry robot over the line: two rounded legs, a beam, a carriage with a visor face and a
 * telescoping arm that ends in suction cups. `cx` slides the carriage (-1..1), `drop` 0..1 lowers the
 * arm, `holding` draws a panel on the cups. Ground at y.
 */
export const PanelBot: React.FC<{x: number; y: number; s?: number; frame: number; cx?: number; drop?: number; holding?: boolean;
  mood?: MachineMood; paint?: string}> = ({x, y, s = 1, frame, cx = 0, drop = 0, holding = false, mood = 'focused',
  paint = '#ffb21f'}) => {
  const id = useUid();
  const H = 900, W = 820;
  const carX = cx * (W / 2 - 120);
  const arm = 160 + drop * 360;
  const bob = Math.sin(frame / 30 * 2.4) * 4;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <linearGradient id={`${id}-p`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor={light(paint, 0.5)} /><stop offset="45%" stopColor={paint} /><stop offset="100%" stopColor={shade(paint, 0.38)} />
        </linearGradient>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={light('#5a628c', 0.4)} /><stop offset="60%" stopColor="#5a628c" /><stop offset="100%" stopColor={shade('#5a628c', 0.4)} />
        </linearGradient>
      </defs>
      {[-1, 1].map((sd) => <g key={sd}>
        <ContactShadow x={sd * W / 2} y={6} w={240} opacity={0.34} />
        <rect x={sd * W / 2 - 34} y={-H} width={68} height={H} rx={34} fill={`url(#${id}-p)`} stroke={line(paint)} strokeWidth={8} />
        <rect x={sd * W / 2 - 80} y={-40} width={160} height={46} rx={23} fill={`url(#${id}-g)`} stroke={line('#5a628c')} strokeWidth={6} />
      </g>)}
      <rect x={-W / 2 - 60} y={-H - 70} width={W + 120} height={90} rx={45} fill={`url(#${id}-p)`} stroke={line(paint)} strokeWidth={9} />
      <path d={`M${-W / 2 - 20} ${-H - 50} L${W / 2 + 20} ${-H - 50}`} stroke={light(paint, 0.7)} strokeWidth={10} strokeLinecap="round" opacity={0.6} />
      <g transform={`translate(${carX} ${-H - 30 + bob * 0.3})`}>
        <rect x={-34} y={0} width={68} height={arm} rx={30} fill={`url(#${id}-g)`} stroke={line('#5a628c')} strokeWidth={7} />
        <rect x={-22} y={arm * 0.45} width={44} height={10} rx={5} fill={light('#5a628c', 0.5)} opacity={0.6} />
        <g transform={`translate(0 ${arm})`}>
          <rect x={-170} y={-10} width={340} height={44} rx={22} fill={`url(#${id}-g)`} stroke={line('#5a628c')} strokeWidth={6} />
          {[-120, -40, 40, 120].map((k) => <rect key={k} x={k - 18} y={30} width={36} height={22} rx={10} fill="#2a2f52" />)}
          {holding && <g transform="translate(-75 132)">
            <path d="M-80 0 L240 0 L300 -100 L-20 -100 Z" fill={line(PANEL)} stroke={line(PANEL)} strokeWidth={10} strokeLinejoin="round" />
            <path d="M-80 0 L240 0 L300 -100 L-20 -100 Z" fill={PANEL} stroke={light(STEEL, 0.3)} strokeWidth={4} strokeLinejoin="round" />
            <path d="M30 -20 L80 -84" stroke="#bcd3ff" strokeWidth={16} strokeLinecap="round" opacity={0.25} />
          </g>}
        </g>
        <rect x={-170} y={-110} width={340} height={200} rx={70} fill={`url(#${id}-p)`} stroke={line(paint)} strokeWidth={9} />
        <Visor x={0} y={-10} w={250} h={110} mood={mood} frame={frame} />
        <circle cx={130} cy={-80} r={14} fill={Math.floor(frame / 15) % 2 ? '#7dff8a' : '#2fbf5a'} />
      </g>
    </g>
  );
};

/** THE ROVER. A low driverless carrier with a face in its nose and a lidar puck, hauling `load` (a node). */
export const Rover: React.FC<{x: number; y: number; s?: number; frame: number; speed?: number; mood?: MachineMood;
  load?: React.ReactNode; facing?: 1 | -1}> = ({x, y, s = 1, frame, speed = 0.6, mood = 'happy', load, facing = 1}) => {
  const id = useUid();
  const body = '#3cc6b0';
  const spin = frame * speed * 14;
  const bump = Math.abs(Math.sin(frame / 30 * 8 * speed)) * 4 * speed;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * facing} ${s})`}>
      <defs>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor={light(body, 0.5)} /><stop offset="45%" stopColor={body} /><stop offset="100%" stopColor={shade(body, 0.4)} />
        </linearGradient>
      </defs>
      <ContactShadow x={0} y={8} w={860} opacity={0.36} />
      {[-300, -100, 100, 300].map((wx) => <g key={wx} transform={`translate(${wx} -62)`}>
        <circle r={62} fill="#24213a" stroke={line('#24213a')} strokeWidth={6} />
        <circle r={34} fill="#d9dde8" />
        <g transform={`rotate(${spin})`}><rect x={-6} y={-30} width={12} height={60} rx={6} fill="#8a90a8" /></g>
      </g>)}
      <g transform={`translate(0 ${-bump})`}>
        <rect x={-400} y={-200} width={800} height={110} rx={50} fill={`url(#${id}-b)`} stroke={line(body)} strokeWidth={9} />
        <path d="M-370 -186 L330 -186" stroke={light(body, 0.7)} strokeWidth={10} strokeLinecap="round" opacity={0.55} />
        <rect x={300} y={-290} width={150} height={190} rx={56} fill={`url(#${id}-b)`} stroke={line(body)} strokeWidth={9} />
        <Visor x={378} y={-205} w={120} h={70} mood={mood} frame={frame} />
        <rect x={350} y={-336} width={70} height={46} rx={20} fill="#2a2f52" />
        <circle cx={385} cy={-313} r={12} fill={Math.floor(frame / 8) % 2 ? '#38f2e0' : '#1aa7a0'} />
        {load && <g transform="translate(-60 -206)">{load}</g>}
      </g>
    </g>
  );
};

/** A row of steel piles, each with a bearing cap, receding left to right. `n` posts. */
export const Posts: React.FC<{x: number; y: number; s?: number; n?: number; gap?: number}> = ({x, y, s = 1, n = 5, gap = 200}) => {
  const id = useUid();
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs><linearGradient id={`${id}-p`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={light(STEEL, 0.5)} /><stop offset="55%" stopColor={STEEL} /><stop offset="100%" stopColor={shade(STEEL, 0.45)} />
      </linearGradient></defs>
      {Array.from({length: n}).map((_, i) => <g key={i} transform={`translate(${i * gap} 0)`}>
        <ContactShadow x={0} y={4} w={110} opacity={0.3} />
        <rect x={-18} y={-210} width={36} height={214} rx={14} fill={`url(#${id}-p)`} stroke={line(STEEL)} strokeWidth={6} />
        <rect x={-34} y={-236} width={68} height={40} rx={18} fill={shade(STEEL, 0.15)} stroke={line(STEEL)} strokeWidth={6} />
      </g>)}
    </g>
  );
};

/** The line: a long belt on legs with rollers that turn at `speed`. Ground at y, top at y - 220. */
export const Conveyor: React.FC<{x: number; y: number; w: number; frame: number; speed?: number}> = ({x, y, w, frame, speed = 1}) => {
  const id = useUid();
  const off = (frame * 6 * speed) % 60;
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs><linearGradient id={`${id}-c`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#6c7396" /><stop offset="100%" stopColor={shade('#4a5075', 0.3)} />
      </linearGradient></defs>
      <ContactShadow x={w / 2} y={6} w={w * 1.05} opacity={0.3} />
      {Array.from({length: Math.max(2, Math.round(w / 300)) + 1}).map((_, i, a) => {
        const lx = (i / (a.length - 1)) * (w - 60) + 30;
        return <rect key={i} x={lx - 16} y={-200} width={32} height={202} rx={14} fill="#5a628c" stroke={line('#5a628c')} strokeWidth={5} />;
      })}
      <rect x={0} y={-250} width={w} height={70} rx={35} fill={`url(#${id}-c)`} stroke={line('#4a5075')} strokeWidth={7} />
      {Array.from({length: Math.ceil(w / 60) + 1}).map((_, i) => {
        const rx = i * 60 - off;
        return rx > 20 && rx < w - 20 ? <circle key={i} cx={rx} cy={-215} r={12} fill={light('#6c7396', 0.4)} /> : null;
      })}
    </g>
  );
};

/** A big rounded number card that counts up, with a small caption. Screen units. */
export const BigNumber: React.FC<{x: number; y: number; value: number; p: number; unit: string; caption: string; accent?: string;
  decimals?: number; plus?: boolean}> = ({x, y, value, p, unit, caption, accent = '#ffcc00', decimals = 0, plus = false}) => {
  const v = value * (1 - Math.pow(1 - clamp01(p), 3));
  const pop = clamp01(p) >= 1 ? 1 : 0.92 + 0.08 * clamp01(p);
  return (
    <g transform={`translate(${x} ${y}) scale(${pop})`}>
      <rect x={-300} y={-150} width={600} height={260} rx={60} fill="#151a3d" opacity={0.86} />
      <rect x={-300} y={-150} width={600} height={260} rx={60} fill="none" stroke={mix(accent, '#ffffff', 0.3)} strokeWidth={5} opacity={0.6} />
      <text x={0} y={10} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={150} fill="#ffffff">
        {v.toFixed(decimals)}{plus ? '+' : ''}<tspan fontSize={70} fill={accent}>{` ${unit}`}</tspan></text>
      <text x={0} y={78} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={38} fill="#c9d2ff">{caption}</text>
    </g>
  );
};

/** A sun with a face, for the button: the table turns toward it. */
export const SunFace: React.FC<{x: number; y: number; r?: number; frame: number; smile?: number}> = ({x, y, r = 120, frame, smile = 1}) => (
  <g transform={`translate(${x} ${y})`}>
    <Glow x={0} y={0} r={r * 3.4} color="#fff0a0" opacity={0.8} />
    <g transform={`rotate(${frame * 0.4})`}>{Array.from({length: 12}).map((_, i) => <rect key={i} x={-10} y={-r - 60} width={20} height={44} rx={10}
      fill="#ffd34d" transform={`rotate(${i * 30})`} />)}</g>
    <circle r={r} fill="#ffd34d" stroke={line('#ffd34d')} strokeWidth={8} />
    <circle cx={-r * 0.3} cy={-r * 0.3} r={r * 0.35} fill="#fff6c8" opacity={0.6} />
    <circle cx={-r * 0.32} cy={-r * 0.08} r={r * 0.09} fill="#5a3a00" />
    <circle cx={r * 0.32} cy={-r * 0.08} r={r * 0.09} fill="#5a3a00" />
    <path d={`M${-r * 0.35} ${r * 0.25} Q0 ${r * (0.25 + 0.35 * smile)} ${r * 0.35} ${r * 0.25}`} stroke="#5a3a00" strokeWidth={r * 0.08}
      fill="none" strokeLinecap="round" />
  </g>
);
