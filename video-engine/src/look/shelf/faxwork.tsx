import React from 'react';
import {FONT, wrapToWidth} from '../../lib/type';
import {light, line, mix, shade} from '../color';
import {Figure} from '../Figure';
import {Glow, useUid} from '../Kit';
import {taper} from '../props';
import {CL, ClBlur, ClLit, ClTxt, clOw, clRR} from './clinic';

/**
 * FAXWORK, LOOK V2 (November 14th, 2026).
 *
 * The electronic document workflow cutaways from lib/faxwork.tsx, redrawn in the v2 idiom. A referral
 * page whose identity lifts into structured fields, the patient chart it docks into, the intake desk
 * and the hand that works it, the workflow report and the clinic room where somebody waits. Every page
 * is warm paper with rounded corners and a soft drop shadow, every folder is lit mint, outlines are each
 * fill's own deep hue and every moving value still arrives from the same board actions.
 *
 * The library's rule holds. These are editorial cutaways, never patient data and never a clinical
 * interface. The identity mark is a pictogram, and the person in the clinic room is a v2 Figure with
 * no name on anything.
 *
 * Units are the library's diagram frame, not the true size world. The hand at the desk now runs out of
 * the drawing as a long sleeve, so wherever the desk is placed the arm comes from the frame edge and
 * never floats.
 */
const FX = {
  ink: '#21405e', mint: '#4fd1b0', mist: '#e2f4ee', paper: '#fffaf0', shade: '#cfe0d8', amber: CL.amber, muted: '#5f8f86',
  white: '#f8fffb', folder: '#5fae9c', skin: '#c98a5a',
};
const bound = (p: number) => Math.max(0, Math.min(1, p));
interface FaxPropsV2 {
  x?: number; y?: number; scale?: number; frame?: number; label?: string; mode?: string; date?: string;
  progress?: number; extract?: number; split?: number; dock?: number; focus?: number;
  fan?: number; copy?: number; cleared?: number; patient?: number; question?: number;
  enter?: number; reading?: number; sort?: number; unfold?: number; handoff?: number; close?: number;
  targetX?: number; targetY?: number; targetScale?: number;
  patientX?: number; patientY?: number; patientScale?: number;
}

const Caption: React.FC<{label: string; x?: number; y: number; width: number; size?: number; fill?: string}> = ({label, x = 0, y, width,
  size = 25, fill = FX.ink}) => <g>
  {wrapToWidth(label, width, size, true).map((ln, i) => <text key={i} x={x} y={y + i * size * 1.24} fontFamily={FONT.body} fontWeight={800}
    fontSize={size} fill={fill}>{ln}</text>)}
</g>;

/** the identity mark, a lit mint tile with a person pictogram, never a person */
const Identity: React.FC<{x?: number; y?: number; scale?: number; ow: number; glow?: number}> = ({x = 0, y = 0, scale = 1, ow, glow = 0}) => {
  const id = useUid();
  const o = ow / scale;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs><ClLit id={`${id}-m`} c={FX.mint} /><ClBlur id={`${id}-g`} sd={8} /></defs>
      {glow > 0 && <rect x={-36} y={-36} width={72} height={72} rx={22} fill={FX.mint} opacity={0.7 * glow} filter={`url(#${id}-g)`} />}
      <rect x={-31} y={-31} width={62} height={62} rx={19} fill={`url(#${id}-m)`} stroke={line(FX.mint)} strokeWidth={o * 2} />
      <circle cx={0} cy={-8} r={10.5} fill={FX.white} />
      <path d="M-18 22 C-19 2 19 2 18 22 Z" fill={FX.white} />
      <ellipse cx={-14} cy={-22} rx={9} ry={4} fill="#ffffff" opacity={0.4} />
    </g>
  );
};

/** the sheet's outline, every corner rounded, the folded corner included */
const SHEET = 'M18 0 H254 Q262 0 268 6 L314 52 Q320 58 320 66 V407 Q320 425 302 425 H18 Q0 425 0 407 V18 Q0 0 18 0 Z';
const FOLD = 'M262 2 V44 Q262 58 276 58 H318 Z';
/** A PAGE. Warm lit paper, a drop shadow, the folded corner (amber when it is the marked page), the identity
 * mark and rows of text that slide into mint field boxes as `structured` runs. */
const Sheet: React.FC<{extract?: number; structured?: number; opacity?: number; marked?: boolean; ow: number; frame?: number;
  shadow?: boolean}> = ({extract = 0, structured = 0, opacity = 1, marked = true, ow, shadow = true}) => {
  const id = useUid();
  return (
    <g opacity={opacity}>
      <defs><ClLit id={`${id}-p`} c={FX.paper} k={0.55} /><ClLit id={`${id}-f`} c={marked ? FX.amber : FX.shade} />
        <ClBlur id={`${id}-b`} sd={12} /></defs>
      {shadow && <path d={SHEET} transform="translate(10 16)" fill="#1a1236" opacity={0.22} filter={`url(#${id}-b)`} />}
      <path d={SHEET} fill={`url(#${id}-p)`} stroke={line('#e8d6b4')} strokeWidth={ow * 2} strokeLinejoin="round" />
      <path d={FOLD} fill={`url(#${id}-f)`} stroke={line(marked ? FX.amber : FX.shade)} strokeWidth={ow * 1.6} strokeLinejoin="round" />
      <path d="M22 16 H200" stroke="#ffffff" strokeWidth={6} strokeLinecap="round" opacity={0.8} />
      <Identity x={57 + extract * 327} y={91 - extract * 74} scale={0.9 + extract * 0.18} ow={ow} glow={extract} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const w = (i % 3 === 0 ? 221 : i % 3 === 1 ? 180 : 238) * (1 - structured * 0.18);
        return <g key={i} transform={`translate(${31 + structured * 310} ${158 + i * 31 - structured * 28})`}>
          {structured > 0 && <rect x={-12} y={-7} width={240} height={22} rx={8} fill={FX.mint} opacity={0.18 * structured}
            stroke={FX.mint} strokeWidth={ow * 0.9} strokeOpacity={structured} />}
          <rect width={w} height={i === 0 ? 10 : 7} rx={i === 0 ? 5 : 3.5} fill={structured > 0.7 ? FX.muted : FX.ink} opacity={0.82 - i * 0.05} />
        </g>;
      })}
      <path d="M30 388 h84 m20 0 h103" stroke={FX.ink} strokeWidth={3} strokeLinecap="round" opacity={0.25} />
    </g>
  );
};

/** THE REFERRAL PAGE. Enters from the left, splits from its bundle, lifts its identity out into a glass
 * field panel when structured, and docks into the chart at the target. Same actions as the library. */
export const FaxDocumentV2: React.FC<FaxPropsV2> = ({x = 0, y = 0, scale = 1, frame = 0, label = '', mode = 'page', progress = 0,
  extract = 0, split = 0, dock = 0, enter = 1, sort = 0, close = 0, targetX = 0, targetY = 0, targetScale = 1}) => {
  const id = useUid();
  const ow = clOw(scale);
  const p = bound(progress), e = bound(extract), splitP = bound(split), sortP = bound(sort);
  const seated = mode === 'seated' || mode === 'bundle';
  const d = seated ? 1 : bound(dock);
  const pageScale = 1 + (targetScale - 1) * d;
  const bob = Math.sin(frame / 22) * 3 * (1 - d);
  return (
    <g transform={`translate(${x - (1 - bound(enter)) * 620} ${y}) scale(${scale})`}>
      <defs><clipPath id={`${id}-c`}><rect x={-30} y={-80} width={760} height={605 - d * (325 + bound(close) * 96)} /></clipPath>
        <ClBlur id={`${id}-g`} sd={8} /></defs>
      {mode === 'bundle' && [0, 1].map((i) => <g key={i}
        transform={`translate(${12 - i * 18 + splitP * (i ? 112 : -62) + sortP * (i ? 48 : 13)} ${12 + i * 15 + splitP * (i ? 24 : -28) + sortP * 205}) rotate(${splitP * (i ? 8 : -7) * (1 - sortP)}) scale(${0.72 - sortP * 0.22})`}>
        <Sheet marked={false} ow={ow} />
      </g>)}
      <g transform={`translate(${targetX * d} ${targetY * d + bob}) scale(${pageScale})`}>
        <g clipPath={`url(#${id}-c)`}><Sheet extract={e * (1 - d)} structured={mode === 'structured' ? p * (1 - d) : 0} ow={ow / pageScale} /></g>
        <Caption label={label} y={d > 0.5 ? -20 : 466} width={345} />
      </g>
      {mode === 'structured' && <g opacity={e * (1 - d)}>
        <rect x={326} y={107} width={266} height={257} rx={30} fill={FX.mint} opacity={0.35} filter={`url(#${id}-g)`} />
        <rect x={326} y={107} width={266} height={257} rx={30} fill="#effbf7" fillOpacity={0.55} stroke={FX.mint} strokeWidth={ow * 1.6} />
        <rect x={340} y={118} width={200} height={14} rx={7} fill="#ffffff" opacity={0.7} />
        <path d="M306 230 H334" stroke={line(FX.amber)} strokeWidth={10 + ow} strokeLinecap="round" />
        <path d="M306 230 H334" stroke={FX.amber} strokeWidth={10} strokeLinecap="round" />
      </g>}
    </g>
  );
};

/** the folder outline, a tab on the left, every corner rounded */
const FOLDER = 'M0 490 V18 Q0 0 18 0 H156 Q166 0 172 8 L188 30 H442 Q460 30 460 48 V490 Q460 508 442 508 H18 Q0 508 0 490 Z';
/** THE PATIENT CHART. A lit mint folder with an inner page, the identity on its header, the docked sheet
 * standing in it and the front pocket that closes over it. `fan` spreads two older charts behind. */
export const FaxChartV2: React.FC<FaxPropsV2> = ({x = 0, y = 0, scale = 1, frame = 0, label = '', mode = 'open', progress = 0, dock = 0,
  focus = 0, fan = 0, handoff = 0, close = 0}) => {
  const id = useUid();
  const ow = clOw(scale);
  const p = bound(progress), d = bound(dock), f = bound(focus), n = bound(fan), h = bound(handoff), c = bound(close);
  const flapY = 210 - p * 26 - c * 132;
  return (
    <g transform={`translate(${x + h * 155} ${y - h * 45}) scale(${scale})`}>
      <defs><ClLit id={`${id}-f`} c={FX.folder} /><ClLit id={`${id}-k`} c={FX.mint} v />
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="0.4" y2="1"><stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor={FX.mist} /></linearGradient>
        <ClBlur id={`${id}-s`} sd={14} /></defs>
      {[0, 1].map((i) => <g key={i} transform={`translate(${-(i + 1) * n * 46} ${(i + 1) * n * 12}) rotate(${-(i + 1) * n * 7} 230 460)`}
        opacity={n * (1 - f * 0.62)}>
        <path d={FOLDER} fill={i ? mix(FX.folder, '#c9d9ff', 0.5) : shade(FX.folder, 0.12)} stroke={line(FX.folder)} strokeWidth={ow * 2} />
        {i ? <path d="M22 108 L32 88 Q34 84 36 88 L46 108 Z" fill={FX.paper} stroke={FX.paper} strokeWidth={4} strokeLinejoin="round" />
          : <rect x={9} y={84} width={30} height={30} rx={8} fill={FX.paper} />}
      </g>)}
      <path d={FOLDER} transform="translate(12 20)" fill="#1a1236" opacity={0.22} filter={`url(#${id}-s)`} />
      <path d={FOLDER} fill={`url(#${id}-f)`} stroke={line(FX.folder)} strokeWidth={ow * 2} strokeLinejoin="round" />
      <path d="M20 14 H150" stroke="#ffffff" strokeWidth={6} strokeLinecap="round" opacity={0.5} />
      <rect x={18} y={64} width={424} height={424} rx={22} fill={`url(#${id}-b)`} stroke={line(FX.mist)} strokeWidth={ow * 1.2} />
      <Identity x={66} y={121} ow={ow} />
      {[[99, 165], [123, 268], [147, 219]].map(([yy, w]) => <rect key={yy} x={120} y={yy - 5} width={w} height={10} rx={5} fill={FX.muted} opacity={0.8} />)}
      {mode === 'fields' ? [0, 1, 2, 3].map((i) => <g key={i} transform={`translate(41 ${192 + i * 63})`}>
        <rect width={370} height={46} rx={16} fill={FX.mist} stroke={FX.mint} strokeWidth={ow * 1.1} />
        <rect width={Math.max(46, 370 * p)} height={46} rx={16} fill={FX.mint} opacity={0.5} />
        <rect x={16} y={18} width={(i % 2 ? 272 : 212) * p} height={10} rx={5} fill={FX.ink} />
      </g>) : <>
        <g transform={`translate(80 ${52 + Math.sin(frame / 20) * 2}) scale(0.78)`} opacity={d}><Sheet structured={1} ow={ow / 0.78} shadow={false} /></g>
        <path d={`M0 ${flapY + 18} Q0 ${flapY} 18 ${flapY} H442 Q460 ${flapY} 460 ${flapY + 18} V490 Q460 508 442 508 H18 Q0 508 0 490 Z`}
          fill={`url(#${id}-k)`} stroke={line(FX.mint)} strokeWidth={ow * 2} strokeLinejoin="round" />
        <path d={`M22 ${flapY + 20} H438`} stroke="#ffffff" strokeWidth={5} strokeLinecap="round" opacity={0.7} />
        <Identity x={64} y={291 - p * 26} scale={1 + f * 0.12} ow={ow} glow={f} />
      </>}
      <Caption label={label} y={556} width={460} size={27} />
    </g>
  );
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

/** THE INTAKE DESK. A cream desk in perspective on round legs, a glass keyboard, and a hand in a mint sleeve
 * that reaches, reads, sorts into lit trays and copies the identity across. The sleeve runs on out of the
 * drawing, so the arm always comes from the frame edge. */
export const FaxDeskV2: React.FC<FaxPropsV2> = ({x = 0, y = 0, scale = 1, frame = 0, label = '', mode = 'work', progress = 0, copy = 0,
  cleared = 0, reading = 0, handoff = 0}) => {
  const id = useUid();
  const ow = clOw(scale);
  const p = bound(progress), h = bound(handoff), read = bound(reading), copied = bound(copy);
  const reach = mode === 'rest' ? 1 - p : mode === 'read' ? read * 0.7 + copied * 0.3 : p;
  const tap = Math.max(0, Math.sin(frame / 4)) * 4 * (mode === 'work' ? 1 : 0);
  const top = '#f6ead2', steel = '#7fa9a0';
  // the hand in its own frame, the wrist at the origin and the fingers pointing along +x to the keys
  const fingers = [0, 1, 2, 3].map((i) => taper([[56, -22 + i * 13], [88, -26 + i * 14.5 + (i === 1 ? tap * 0.4 : 0)],
    [110 + (i === 1 || i === 2 ? 6 : 0), -16 + i * 14.5 + (i === 1 ? tap : 0)]], 19 - i * 0.8, 15 - i * 0.6));
  const thumb = taper([[22, -20], [44, -38], [62, -44]], 21, 17);
  const palm = 'M-4 -24 C26 -38 66 -34 74 -8 C80 18 56 34 24 32 C2 30 -10 14 -4 -24 Z';
  const handT = 'translate(206 196) rotate(-32) scale(1.5)';
  const sleeve = taper([[-300, 560], [-80, 400], [100, 270], [210, 196]], 104, 66);
  const clock = (frame / 30) * 36;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs><linearGradient id={`${id}-t`} x1="0" y1="0" x2="0.5" y2="1"><stop offset="0%" stopColor="#ffffff" />
        <stop offset="55%" stopColor={top} /><stop offset="100%" stopColor={shade(top, 0.18)} /></linearGradient>
        <radialGradient id={`${id}-k`} cx="35%" cy="30%" r="85%"><stop offset="0%" stopColor={light(FX.skin, 0.35)} />
          <stop offset="65%" stopColor={FX.skin} /><stop offset="100%" stopColor={shade(FX.skin, 0.3)} /></radialGradient>
        <ClLit id={`${id}-s`} c={FX.mint} /><ClBlur id={`${id}-g`} sd={8} />
        <linearGradient id={`${id}-kb`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor={FX.mist} />
        </linearGradient></defs>
      {/* legs, the front edge and the top */}
      {[[154, 196, 372], [838, 118, 330]].map(([lx, y0, y1]) => <g key={lx}>
        <path d={`M${lx} ${y0} V${y1}`} stroke={line(steel)} strokeWidth={24 + ow * 2} strokeLinecap="round" />
        <path d={`M${lx} ${y0} V${y1}`} stroke={steel} strokeWidth={24} strokeLinecap="round" />
        <path d={`M${lx + 6} ${y0 + 4} V${y1}`} stroke={shade(steel, 0.3)} strokeWidth={8} strokeLinecap="round" />
        <path d={`M${lx - 5} ${y0 + 6} V${y1 - 6}`} stroke="#ffffff" strokeWidth={5} strokeLinecap="round" opacity={0.45} />
      </g>)}
      <path d={roundPoly([[126, 169], [900, 90], [900, 114], [127, 198], [0, 91], [0, 63]], 14)} fill={shade(top, 0.22)} stroke={line(top)}
        strokeWidth={ow * 2} strokeLinejoin="round" />
      <path d={roundPoly([[0, 63], [734, 0], [900, 90], [126, 169]], 18)} fill={`url(#${id}-t)`} stroke={line(top)} strokeWidth={ow * 2}
        strokeLinejoin="round" />
      <path d="M40 66 L700 10" stroke="#ffffff" strokeWidth={6} strokeLinecap="round" opacity={0.7} />
      {/* the keyboard */}
      <g transform="translate(367 56) skewX(-16)">
        <rect width={278} height={64} rx={16} fill={`url(#${id}-kb)`} stroke={line(FX.mist)} strokeWidth={ow * 1.6} />
        {[0, 1, 2].map((row) => [0, 1, 2, 3, 4, 5, 6, 7, 8].map((col) => {
          const hit = mode === 'work' && (row * 9 + col) === Math.floor(frame / 4) % 27;
          return <rect key={`${row}-${col}`} x={12 + col * 29} y={9 + row * 16} width={23} height={11} rx={4} fill={hit ? FX.mint : '#ffffff'}
            stroke={shade(FX.mist, 0.25)} strokeWidth={1.4} />;
        }))}
      </g>
      {mode === 'sorting' && [0, 1].map((i) => <g key={i} transform={`translate(${155 + i * 279} ${155 - p * 298})`}>
        <path d={roundPoly([[0, 0], [220, 0], [242, 42], [242, 105], [18, 105], [0, 62]], 14)} fill={i ? FX.shade : FX.mint} stroke={line(i ? FX.shade : FX.mint)}
          strokeWidth={ow * 2} strokeLinejoin="round" />
        <path d="M14 62 H226" stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.7} />
        {i ? <path d="M178 76 L188 94 L168 94 Z" fill={FX.ink} stroke={FX.ink} strokeWidth={5} strokeLinejoin="round" />
          : <circle cx={184} cy={86} r={10} fill={FX.ink} />}
      </g>)}
      {/* the arm, a long sleeve from out of frame into a round hand */}
      <g transform={`translate(${reach * 68 + h * 155} ${-reach * 24 - h * 45}) rotate(${-reach * 4} 170 155)`}>
        <path d={sleeve} fill={line(FX.mint)} stroke={line(FX.mint)} strokeWidth={ow * 2} strokeLinejoin="round" />
        <g transform={handT}>
          {[...fingers, thumb, palm].map((dd, i) => <path key={i} d={dd} fill={line(FX.skin)} stroke={line(FX.skin)} strokeWidth={ow * 2 / 1.5}
            strokeLinejoin="round" />)}
          {[...fingers, thumb, palm].map((dd, i) => <path key={`f${i}`} d={dd} fill={`url(#${id}-k)`} />)}
          <path d="M8 -16 C30 -26 52 -24 62 -12" stroke="#ffffff" strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.35} />
        </g>
        <path d={sleeve} fill={`url(#${id}-s)`} />
        <path d="M184 180 Q202 208 230 216" stroke={FX.white} strokeWidth={10} strokeLinecap="round" fill="none" />
        <path d="M-40 360 Q60 280 150 218" stroke="#ffffff" strokeWidth={8} strokeLinecap="round" fill="none" opacity={0.35} />
      </g>
      {mode === 'read' && <g opacity={1 - copied}>
        <path d={`M${284 + read * 36} ${99 - read * 24} L${130 + read * 90} ${-140 + read * 62}`} stroke={FX.ink} strokeWidth={10} strokeLinecap="round" />
        <circle cx={130 + read * 90} cy={-140 + read * 62} r={14} fill={FX.amber} opacity={0.5} filter={`url(#${id}-g)`} />
        <circle cx={130 + read * 90} cy={-140 + read * 62} r={8} fill={FX.amber} />
      </g>}
      {copy > 0 && <g transform={`translate(${170 + copied * 450} ${-80 - copied * 160})`} opacity={Math.sin(copied * Math.PI)}>
        <Identity scale={1.5 + copied * 0.3} ow={ow} glow={1} />
      </g>}
      {mode === 'workload' && <g transform="translate(613 -25)">
        <circle r={86} fill={FX.amber} opacity={0.25} filter={`url(#${id}-g)`} />
        <path d="M0 -87 V-100 M-22 -100 H22" stroke={line(FX.paper)} strokeWidth={10} strokeLinecap="round" />
        <circle r={77} fill={FX.paper} stroke={line(FX.paper)} strokeWidth={ow * 2} />
        <circle r={62} fill="none" stroke={FX.shade} strokeWidth={4} />
        <g transform={`rotate(${clock})`}><path d="M0 0 V-52" stroke={FX.amber} strokeWidth={7} strokeLinecap="round" /></g>
        <g transform={`rotate(${clock / 12 + 110})`}><path d="M0 0 V-34" stroke={FX.ink} strokeWidth={8} strokeLinecap="round" /></g>
        <circle r={8} fill={FX.ink} />
        {[0, 1, 2].map((i) => <g key={i} transform={`translate(${-201 + bound(cleared) * i * 91} ${-70 - i * 14 - bound(cleared) * 180}) scale(0.23)`}
          opacity={1 - bound(cleared)}><Sheet ow={ow / 0.23} shadow={false} /></g>)}
      </g>}
      <Caption label={label} x={mode === 'workload' ? 510 : 174} y={mode === 'workload' ? -125 : 400} width={mode === 'workload' ? 285 : 680} size={27} />
    </g>
  );
};

/** THE WORKFLOW REPORT. A warm page that unfolds from its spine with an amber header, the title and date,
 * an amber highlight sweeping the finding, and the page to identity hand off at the foot. `limit` mode is
 * the honest caveat, a page beside a dashed card with a clock the record does not fill. */
export const FaxReportV2: React.FC<FaxPropsV2> = ({x = 0, y = 0, scale = 1, frame = 0, label = '', mode = 'report', date = '', progress = 0,
  unfold = 1}) => {
  const id = useUid();
  const ow = clOw(scale);
  const p = bound(progress), u = bound(unfold);
  const tick = (frame / 30) * 30;
  if (mode === 'limit') return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <Caption label={label} x={0} y={35} width={630} size={39} />
      <path d="M0 74 H620" stroke={FX.amber} strokeWidth={7} strokeLinecap="round" />
      <g transform="translate(38 146)">
        <g transform="translate(0 10) scale(0.49)"><Sheet ow={ow / 0.49} /></g>
        <path d="M230 0 V260" stroke={FX.amber} strokeWidth={7} strokeLinecap="round" />
        <rect x={278} y={0} width={242} height={238} rx={30} fill={FX.white} stroke={FX.muted} strokeWidth={ow * 1.2} strokeDasharray="12 10" />
        <circle cx={399} cy={112} r={61} fill="#ffffff" stroke={FX.muted} strokeWidth={ow * 1.4} />
        <g transform={`translate(399 112) rotate(${tick})`}><path d="M0 0 V-42" stroke={FX.muted} strokeWidth={6} strokeLinecap="round" /></g>
        <circle cx={399} cy={112} r={6} fill={FX.muted} />
        <path d="M399 51 V37 M383 35 H415" stroke={FX.muted} strokeWidth={6} strokeLinecap="round" />
        <rect x={277 - p * 244} y={-2} width={245 * (1 - p)} height={242} rx={30} fill={FX.mist} />
      </g>
    </g>
  );
  return (
    <g transform={`translate(${x} ${y + 70 * (1 - u)}) scale(${scale})`} opacity={u}>
      <defs><ClLit id={`${id}-p`} c={FX.paper} k={0.5} /><ClLit id={`${id}-a`} c={FX.amber} v />
        <ClBlur id={`${id}-b`} sd={14} /><clipPath id={`${id}-c`}><rect width={650} height={535} rx={26} /></clipPath></defs>
      <g transform={`translate(325 0) scale(${0.15 + 0.85 * u} 1) translate(-325 0)`}>
        <rect x={14} y={24} width={650} height={535} rx={26} fill="#1a1236" opacity={0.24} filter={`url(#${id}-b)`} />
        <rect width={650} height={535} rx={26} fill={`url(#${id}-p)`} stroke={line('#e8d6b4')} strokeWidth={ow * 2} />
        <g clipPath={`url(#${id}-c)`}><rect width={650} height={24} fill={`url(#${id}-a)`} /></g>
        <Caption label={label} x={35} y={78} width={580} size={31} />
        <text x={35} y={146} fontFamily={FONT.body} fontWeight={700} fontSize={27} fill={FX.muted}>{date}</text>
        <g transform="translate(43 193)">
          <rect x={-10} y={-17} width={u * 568} height={33} rx={12} fill={FX.amber} opacity={0.32} />
          {[0, 1, 2, 3].map((i) => <rect key={i} x={0} y={i * 29 - 4} width={[485, 544, 417, 505][i]} height={8} rx={4} fill={FX.muted} />)}
        </g>
        <g transform="translate(70 337)">
          <g transform="scale(0.31)"><Sheet ow={ow / 0.31} shadow={false} /></g>
          <path d={`M132 73 H${132 + u * 185}`} stroke={line(FX.mint)} strokeWidth={14 + ow} strokeLinecap="round" />
          <path d={`M132 73 H${132 + u * 185}`} stroke={FX.mint} strokeWidth={14} strokeLinecap="round" />
          <path d={`M${120 + u * 185} 58 L${142 + u * 185} 73 L${120 + u * 185} 88`} fill="none" stroke={FX.mint} strokeWidth={10} strokeLinecap="round"
            strokeLinejoin="round" />
          <Identity x={428} y={74} scale={1.45} ow={ow} glow={0.4 + 0.3 * Math.sin(frame / 10)} />
        </g>
      </g>
    </g>
  );
};

/** THE CLINIC ROOM. A soft mint wall, a tall window of morning sky with rounded mullions and a warm patch of
 * light on the floor, a potted plant that sways. `reveal` opens shutters across the window. `waiting` stands
 * a patient beside a row of chairs with a glass thought bubble, the question mark fading in on `question`
 * and a mist panel wiping off on `patient`. The person is a v2 Figure, worried, never named. */
export const FaxClinicV2: React.FC<FaxPropsV2> = ({x = 0, y = 0, scale = 1, frame = 0, label = '', mode = 'room', progress = 0, patient = 0,
  question = 0, patientX = 530, patientY = 980, patientScale = 1}) => {
  const id = useUid();
  const ow = clOw(scale);
  const o = ow / 1.8;
  const pr = bound(progress);
  const sway = Math.sin(frame / 30 * 1.3) * 2;
  const chair = CL.teal;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <linearGradient id={`${id}-w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#eaf7f2" /><stop offset="100%" stopColor="#cfe6dd" /></linearGradient>
        <linearGradient id={`${id}-s`} x1="0" y1="0" x2="0.3" y2="1"><stop offset="0%" stopColor="#7cc0ff" /><stop offset="60%" stopColor="#bfe2ff" />
          <stop offset="100%" stopColor="#fff0d2" /></linearGradient>
        <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#b9d6ca" /><stop offset="100%" stopColor="#8fb8a8" /></linearGradient>
        <ClLit id={`${id}-c`} c={chair} /><ClLit id={`${id}-pot`} c="#e07a4f" />
        <radialGradient id={`${id}-leaf`} cx="35%" cy="30%" r="80%"><stop offset="0%" stopColor="#8fdc7a" /><stop offset="60%" stopColor="#4caf6a" />
          <stop offset="100%" stopColor={shade('#4caf6a', 0.35)} /></radialGradient>
        <ClBlur id={`${id}-b`} sd={18} />
      </defs>
      <g transform="translate(540 960) scale(1.8) translate(-540 -960)">
        <rect x={-450} y={-400} width={1980} height={2720} fill={`url(#${id}-w)`} />
        <path d="M0 1360 L1080 1140 V1920 H0 Z" fill={`url(#${id}-f)`} />
        {/* the window, rounded, sky lit, with soft clouds */}
        <rect x={65} y={190} width={871} height={950} rx={30} fill={line('#f4fbf8')} stroke={line('#f4fbf8')} strokeWidth={o * 2} />
        <rect x={65} y={190} width={871} height={950} rx={30} fill="#f4fbf8" />
        <rect x={83} y={204} width={835} height={922} rx={20} fill={`url(#${id}-s)`} />
        {[[260, 360, 1], [700, 300, 0.8]].map(([cx, cy, k], i) => <g key={i} transform={`translate(${cx + Math.sin(frame / 90 + i) * 12} ${cy}) scale(${k})`}
          opacity={0.9}>{[[-60, 10, 44], [-10, -14, 58], [50, 0, 46]].map(([a, b, r], j) => <circle key={j} cx={a} cy={b} r={r} fill="#ffffff" />)}
          <rect x={-100} y={8} width={196} height={40} rx={20} fill="#ffffff" /></g>)}
        <path d="M83 864 L327 829 L327 502 L524 502 L524 733 L697 733 L697 623 L917 623 V1118 H83 Z" fill="#9fd0b8" opacity={0.55} />
        {mode === 'reveal' && <g>
          <rect x={83} y={204} width={Math.max(0, 407 - pr * 425)} height={922} rx={14} fill={FX.shade} stroke={line(FX.shade)} strokeWidth={o * 1.4} />
          <rect x={490 + pr * 446} y={204} width={Math.max(0, 428 - pr * 446)} height={922} rx={14} fill={FX.shade} stroke={line(FX.shade)}
            strokeWidth={o * 1.4} />
        </g>}
        <path d="M490 204 V1127 M77 686 H925" stroke="#f4fbf8" strokeWidth={18} strokeLinecap="round" />
        <path d="M110 230 L300 230" stroke="#ffffff" strokeWidth={10} strokeLinecap="round" opacity={0.6} />
        <path d="M20 1196 H981" stroke={FX.muted} strokeWidth={8} strokeLinecap="round" opacity={0.6} />
        {/* the light on the floor and a plant in the corner */}
        <path d="M200 1250 L760 1170 L980 1300 L330 1420 Z" fill="#fff4d0" opacity={0.45} filter={`url(#${id}-b)`} />
        <g transform="translate(330 1080) scale(0.8)">
          <g transform={`rotate(${sway})`}>
            {[[-34, -150, 46], [20, -190, 54], [44, -120, 40], [-10, -110, 44]].map(([a, b, r], i) => <circle key={`o${i}`} cx={a} cy={b} r={r + o}
              fill={line('#4caf6a')} />)}
            {[[-34, -150, 46], [20, -190, 54], [44, -120, 40], [-10, -110, 44]].map(([a, b, r], i) => <circle key={i} cx={a} cy={b} r={r}
              fill={`url(#${id}-leaf)`} />)}
          </g>
          <path d="M-46 -70 L46 -70 L36 6 Q34 16 24 16 L-24 16 Q-34 16 -36 6 Z" fill={`url(#${id}-pot)`} stroke={line('#e07a4f')} strokeWidth={o * 2}
            strokeLinejoin="round" />
        </g>
      </g>
      {mode === 'waiting' && <g transform={`translate(${patientX} ${patientY}) scale(${patientScale})`}>
        {/* a row of waiting chairs, the patient standing beside them */}
        {[-150, -20].map((cx) => <g key={cx} transform={`translate(${cx} 0)`}>
          <path d={clRR(-10, 90, 12, 72, 6)} fill={shade(chair, 0.35)} />
          <path d={clRR(98, 90, 12, 72, 6)} fill={shade(chair, 0.35)} />
          <path d={clRR(-6, -40, 112, 120, 34)} fill={`url(#${id}-c)`} stroke={line(chair)} strokeWidth={ow * 2} />
          <path d={clRR(-18, 60, 136, 38, 19)} fill={`url(#${id}-c)`} stroke={line(chair)} strokeWidth={ow * 2} />
          <path d="M14 -24 Q50 -34 86 -24" stroke="#ffffff" strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.4} />
        </g>)}
        <Figure frame={frame} x={150} y={150} scale={0.56} pose="think" emotion="worried" skin="#9a6440" hair="curly" hairColor="#1c1512"
          top="jacket" shirt="#3d7bd9" pants="#3f3f52" seed={4} />
        <g transform={`translate(${150} ${-278 + Math.sin(frame / 15) * 4})`}>
          <circle cx={-56} cy={92} r={10} fill="#ffffff" stroke={FX.muted} strokeWidth={ow} />
          <circle cx={-34} cy={70} r={15} fill="#ffffff" stroke={FX.muted} strokeWidth={ow} />
          <circle r={69} fill="#ffffff" stroke={FX.muted} strokeWidth={ow * 1.4} />
          <ellipse cx={-24} cy={-36} rx={24} ry={10} fill={FX.mist} />
          <text x={0} y={28} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={84} fill={FX.ink} opacity={bound(question)}>?</text>
        </g>
        <rect x={-260 + bound(patient) * 560} y={-367} width={Math.max(0, 560 - bound(patient) * 560)} height={561} rx={30} fill={FX.mist}
          opacity={1 - bound(patient)} />
      </g>}
      {mode === 'waiting' && <Glow x={patientX + 150 * patientScale} y={patientY - 278 * patientScale} r={110 * patientScale} color="#ffffff"
        opacity={0.4 * bound(question)} />}
      <Caption label={label} x={89} y={390} width={792} size={44} />
    </g>
  );
};

export const FAXWORK_V2 = ['FaxDocumentV2', 'FaxChartV2', 'FaxDeskV2', 'FaxReportV2', 'FaxClinicV2'] as const;
