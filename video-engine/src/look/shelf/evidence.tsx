import React from 'react';
import {line, light} from '../color';
import {useUid} from '../Kit';
import {CL, ClBlur, ClGlass, ClLit, ClPill, ClTxt, clOw, clRR} from './clinic';

/**
 * EVIDENCE, LOOK V2 (November 14th, 2026).
 *
 * The four editorial instruments from lib/evidence.tsx, redrawn as lit glass. A pile of narrative
 * records becoming fields, two public records joining, an association kept apart from causation, and
 * flagged places handed to a field crew. Same props, same words and numbers on screen as the library
 * (shot_coherence.py reads them), so a proof still matches the pixels. What changes is the look. Each
 * panel is a rounded glass slab with a soft drop shadow, a hue-tinted rim, a top sheen and a glow on
 * the one thing that matters, and every piece moves a little on `frame`.
 *
 * Screen units, the library's own frame (about 840 by 600 at `scale` 1). Line work is computed from
 * `scale` so it reads about 6.8 film pixels at any size.
 */
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => { const t = clamp01(n); return t * t * (3 - 2 * t); };
const PAPER = '#fff3dc', TEAL = '#3ee0cc', AMBER = CL.amber, RED = CL.coral, PANEL = '#1d2758', CARD = '#273372', MUTED = '#8fa0d8';

/** a paper strip, lit, with two lines of text drawn as rounded bars */
const Strip: React.FC<{w: number; h?: number; ow: number; tone?: string}> = ({w, h = 34, ow, tone = '#9fb0e8'}) => {
  const id = useUid();
  return (
    <g>
      <defs><ClLit id={`${id}-p`} c={PAPER} v k={0.7} /></defs>
      <rect width={w} height={h} rx={h * 0.35} fill={`url(#${id}-p)`} stroke={line(PAPER)} strokeWidth={ow * 1.4} />
      <rect x={18} y={h * 0.28} width={w * 0.7} height={h * 0.16} rx={h * 0.08} fill={tone} />
      <rect x={18} y={h * 0.58} width={w * 0.46} height={h * 0.14} rx={h * 0.07} fill={tone} opacity={0.7} />
    </g>
  );
};

/** NARRATIVES BECOMING DATA. Drifting paper records, one sentence held long enough to read under an amber
 * highlighter, the count in amber and a pulsing status line underneath. */
export const DocumentStreamV2: React.FC<{x?: number; y?: number; scale?: number; frame?: number; title: string; count: string;
  sample: string; status: string}> = ({x = 0, y = 0, scale = 1, frame = 0, title, count, sample, status}) => {
  const id = useUid();
  const ow = clOw(scale);
  const p = ease((frame - 4) / 48);
  const stripY = 360 - p * 190;
  const pulse = 0.5 + 0.5 * Math.sin(frame / 5);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs><ClBlur id={`${id}-g`} sd={6} /></defs>
      <ClGlass x={0} y={0} w={820} h={600} r={44} tint={PANEL} ow={ow}>
        {Array.from({length: 7}, (_, i) => {
          const yy = 132 + ((i * 57 + frame * (0.7 + (i % 3) * 0.12)) % 390);
          const w = 510 + ((i * 43) % 180);
          return <g key={i} transform={`translate(${50 + (i % 2) * 20} ${yy}) rotate(${(i % 3 - 1) * 0.8})`} opacity={0.32 + i * 0.07}>
            <Strip w={w} ow={ow} /></g>;
        })}
      </ClGlass>
      <ClGlass x={28} y={26} w={764} h={76} r={26} tint="#2c3a80" ow={ow} shadow={false}>
        <ClTxt x={28} y={48} t={title.toUpperCase()} size={24} fill={PAPER} spacing={1.4} />
      </ClGlass>
      <g filter={`url(#${id}-g)`} opacity={0.7}><ClTxt x={766} y={78} t={count} size={40} fill={AMBER} anchor="end" weight={900} /></g>
      <ClTxt x={766} y={78} t={count} size={40} fill="#ffd27a" anchor="end" weight={900} />
      {/* the one sentence held long enough to read, source language becoming evidence */}
      <g transform={`translate(62 ${stripY})`}>
        <rect x={-4} y={-4} width={704} height={124} rx={26} fill={AMBER} opacity={0.5} filter={`url(#${id}-g)`} />
        <ClGlass x={0} y={0} w={696} h={116} r={24} tint={PAPER} ow={ow} glow={AMBER} glowK={0.8}>
          <rect x={18} y={50} width={Math.min(600, 40 + sample.length * 14.5) * p} height={36} rx={12} fill={AMBER} opacity={0.38} />
          <ClTxt x={24} y={36} t="NARRATIVE" size={15} fill="#8a5a24" spacing={2} />
          <ClTxt x={24} y={78} t={sample} size={26} fill="#2b2440" spacing={0} />
          <rect x={24} y={94} width={616} height={5} rx={2.5} fill="#e6d3b0" />
        </ClGlass>
      </g>
      <g transform="translate(52 524)">
        <rect width={716} height={50} rx={25} fill="#174a52" stroke={line('#174a52')} strokeWidth={ow * 2} />
        <circle cx={26} cy={25} r={12} fill={TEAL} opacity={0.35 * pulse} filter={`url(#${id}-g)`} />
        <circle cx={26} cy={25} r={7.5} fill={TEAL} />
        <circle cx={24} cy={23} r={2.4} fill="#ffffff" opacity={0.8} />
        <ClTxt x={48} y={33} t={status.toUpperCase()} size={18} fill={TEAL} spacing={1.4} />
      </g>
    </g>
  );
};

/** a record card, a glass tile with a coloured glow, a title, a big count, a few rows and a little stack */
const RecordCard: React.FC<{x: number; title: string; count: string; color: string; ow: number; frame: number; seed: number}> = ({
  x, title, count, color, ow, frame, seed}) => (
  <g transform={`translate(${x} ${118 + Math.sin(frame / 18 + seed) * 3})`}>
    <ClGlass x={0} y={0} w={280} h={250} r={32} tint={CARD} ow={ow} glow={color} glowK={0.7}>
      <ClTxt x={24} y={46} t={title.toUpperCase()} size={18} fill={color} spacing={1.4} />
      <ClTxt x={140} y={120} t={count} size={46} fill="#ffffff" anchor="middle" weight={900} spacing={0} />
      {Array.from({length: 4}, (_, i) => <g key={i}>
        <circle cx={34} cy={154 + i * 20} r={4.5} fill={color} opacity={0.8} />
        <rect x={46} y={150 + i * 20} width={130 + ((i * 31) % 72)} height={8} rx={4} fill={MUTED} opacity={0.5 + i * 0.08} />
      </g>)}
      {[0, 1, 2].map((k) => <rect key={k} x={222 - k * 5} y={22 + k * 7} width={34} height={22} rx={6} fill={k === 2 ? color : light(CARD, 0.3)}
        stroke={line(CARD)} strokeWidth={ow * 0.8} opacity={0.95} />)}
    </ClGlass>
  </g>
);

/** TWO PUBLIC RECORDS JOINING. The two record cards slide in, glowing threads run from each to the joined
 * record below, and the joined record breathes in teal. */
export const DataJoinV2: React.FC<{x?: number; y?: number; scale?: number; frame?: number; leftTitle: string; leftCount: string;
  rightTitle: string; rightCount: string; result: string}> = ({x = 0, y = 0, scale = 1, frame = 0, leftTitle, leftCount, rightTitle,
  rightCount, result}) => {
  const id = useUid();
  const ow = clOw(scale);
  const p = ease((frame - 8) / 52);
  const leftX = 44 + p * 98, rightX = 556 - p * 98;
  const pulse = 0.5 + 0.5 * Math.sin(frame / 6);
  const threads = `M${leftX + 280} 243 C390 243 385 430 420 430 M${rightX} 243 C450 243 455 430 420 430`;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs><ClBlur id={`${id}-g`} sd={7} /></defs>
      <ClGlass x={0} y={0} w={840} h={590} r={44} tint={PANEL} ow={ow} />
      <ClTxt x={420} y={70} t="ONE DECISION · TWO PUBLIC RECORDS" size={21} fill={PAPER} anchor="middle" spacing={1.4} />
      <path d={threads} fill="none" stroke={TEAL} strokeWidth={14} opacity={0.35} filter={`url(#${id}-g)`} />
      <path d={threads} fill="none" stroke="#2c3a80" strokeWidth={10} strokeLinecap="round" />
      <path d={threads} fill="none" stroke="#c9fff4" strokeWidth={5} strokeDasharray="2 16" strokeDashoffset={-frame * 1.8} strokeLinecap="round" />
      <RecordCard x={leftX} title={leftTitle} count={leftCount} color={TEAL} ow={ow} frame={frame} seed={0} />
      <RecordCard x={rightX} title={rightTitle} count={rightCount} color={AMBER} ow={ow} frame={frame} seed={2} />
      <ClGlass x={190} y={410} w={460} h={128} r={32} tint="#17504a" ow={ow} glow={TEAL} glowK={0.6 + pulse * 0.4}>
        <ClTxt x={230} y={50} t="JOINED RECORD" size={18} fill={TEAL} anchor="middle" spacing={1.6} />
        <ClTxt x={230} y={96} t={result} size={32} fill="#ffffff" anchor="middle" weight={900} spacing={0} />
      </ClGlass>
      <circle cx={420} cy={410} r={12} fill={TEAL} stroke={line(TEAL)} strokeWidth={ow * 1.4} />
      <circle cx={417} cy={407} r={3.5} fill="#ffffff" opacity={0.8} />
    </g>
  );
};

/** WHAT THE RECORD SUPPORTS. Two lit nodes joined by a teal arc and its relation, and below them the causal
 * arrow broken in coral with a crossed badge in the gap. The limit is part of the claim, so it is big. */
export const AssociationDiagramV2: React.FC<{x?: number; y?: number; scale?: number; frame?: number; leftLabel: string; rightLabel: string;
  relation: string; limit: string}> = ({x = 0, y = 0, scale = 1, frame = 0, leftLabel, rightLabel, relation, limit}) => {
  const id = useUid();
  const ow = clOw(scale);
  const p = ease((frame - 5) / 42);
  const arc = 'M210 300 C300 400 540 400 630 300';
  const breathe = 0.5 + 0.5 * Math.sin(frame / 9);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs><ClBlur id={`${id}-g`} sd={7} /></defs>
      <ClGlass x={0} y={0} w={840} h={600} r={44} tint={PANEL} ow={ow} />
      <ClTxt x={420} y={72} t="WHAT THE RECORD SUPPORTS" size={23} fill={PAPER} anchor="middle" spacing={1.6} />
      <path d={arc} fill="none" stroke={TEAL} strokeWidth={16} pathLength={1} strokeDasharray={`${p} 1`} opacity={0.4} filter={`url(#${id}-g)`} />
      <path d={arc} fill="none" stroke={TEAL} strokeWidth={8} pathLength={1} strokeDasharray={`${p} 1`} strokeLinecap="round" />
      {[{xx: 70, label: leftLabel, color: AMBER}, {xx: 490, label: rightLabel, color: TEAL}].map((n, i) => (
        <g key={i} transform={`translate(${n.xx} ${150 + Math.sin(frame / 20 + i * 2) * 3})`}>
          <ClGlass x={0} y={0} w={280} h={150} r={34} tint={CARD} ow={ow} glow={n.color} glowK={0.75}>
            <ClTxt x={140} y={70} t={n.label} size={28} fill="#ffffff" anchor="middle" spacing={0} />
          </ClGlass>
          <circle cx={140} cy={150} r={16} fill={n.color} stroke={line(n.color)} strokeWidth={ow * 1.6} />
          <circle cx={135} cy={145} r={5} fill="#ffffff" opacity={0.75} />
        </g>
      ))}
      <ClPill x={420} y={372} t={relation.toUpperCase()} size={21} fill="#145e58" ink="#b6fff2" ow={ow} glow padX={70} />
      {/* the broken causal arrow, deliberately large */}
      <g transform="translate(110 455)">
        <path d="M0 30 H210 M310 30 H520 M506 10 L540 30 L506 50" fill="none" stroke={RED} strokeWidth={20} opacity={0.35}
          filter={`url(#${id}-g)`} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M0 30 H210 M310 30 H520 M506 10 L540 30 L506 50" fill="none" stroke={line(RED)} strokeWidth={10 + ow * 2} strokeLinecap="round"
          strokeLinejoin="round" />
        <path d="M0 30 H210 M310 30 H520 M506 10 L540 30 L506 50" fill="none" stroke={RED} strokeWidth={10} strokeLinecap="round"
          strokeLinejoin="round" />
        <path d="M6 27 H200 M316 27 H510" stroke="#ffd0c8" strokeWidth={3} strokeLinecap="round" opacity={0.6} />
        <g transform={`translate(260 30) scale(${1 + breathe * 0.05})`}>
          <circle r={34} fill="#2a1f4e" stroke={RED} strokeWidth={ow * 2} />
          <path d="M-13 -13 L13 13 M13 -13 L-13 13" stroke={PAPER} strokeWidth={9} strokeLinecap="round" />
        </g>
        <ClTxt x={270} y={104} t={limit.toUpperCase()} size={24} fill="#ff8f7f" anchor="middle" spacing={1.4} weight={900} />
      </g>
    </g>
  );
};

/** FLAGGED PLACES HANDED TO A CREW. A rounded map of soft land and lit roads, amber pins dropping on the
 * flagged segments with rings pulsing round them, and the field queue ticking each one off. */
export const InspectionMapV2: React.FC<{x?: number; y?: number; scale?: number; frame?: number; title: string; county: string;
  segments: string[]; status: string}> = ({x = 0, y = 0, scale = 1, frame = 0, title, county, segments, status}) => {
  const id = useUid();
  const ow = clOw(scale);
  const active = Math.min(segments.length, Math.floor(frame / 16) + 1);
  const roads = [
    'M40 120 C190 90 250 180 390 150 S620 70 720 130',
    'M90 420 C220 330 360 390 470 310 S650 270 730 350',
    'M170 70 C210 220 140 300 260 490',
    'M610 60 C540 180 650 270 590 500',
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <radialGradient id={`${id}-l`} cx="35%" cy="30%" r="85%"><stop offset="0%" stopColor="#4f9a78" />
          <stop offset="65%" stopColor="#2f6b5e" /><stop offset="100%" stopColor="#24465a" /></radialGradient>
        <ClBlur id={`${id}-g`} sd={6} />
        <clipPath id={`${id}-m`}><rect x={0} y={0} width={536} height={492} rx={28} /></clipPath>
      </defs>
      <ClGlass x={0} y={0} w={840} h={620} r={44} tint={PANEL} ow={ow} />
      <ClTxt x={44} y={58} t={title.toUpperCase()} size={23} fill={PAPER} spacing={1.4} />
      <ClPill x={796 - (county.length * 11 + 30) / 2} y={50} t={county.toUpperCase()} size={16} fill="#5a3f14" ink="#ffd27a" ow={ow} />
      <g transform="translate(32 82)">
        <rect width={536} height={492} rx={28} fill={line('#2f6b5e')} stroke={line('#2f6b5e')} strokeWidth={ow * 2} />
        <g clipPath={`url(#${id}-m)`}>
          <rect width={536} height={492} fill={`url(#${id}-l)`} />
          <ellipse cx={420} cy={420} rx={120} ry={70} fill="#5aa0c8" opacity={0.5} />
          <ellipse cx={90} cy={260} rx={70} ry={50} fill="#6fb07a" opacity={0.45} />
          <ellipse cx={330} cy={210} rx={90} ry={44} fill="#3f8a6a" opacity={0.5} />
          {roads.map((d, i) => <path key={`o${i}`} d={d} fill="none" stroke={line('#e9e2d0')} strokeWidth={(i < 2 ? 22 : 13) + ow} strokeLinecap="round" />)}
          {roads.map((d, i) => <path key={`f${i}`} d={d} fill="none" stroke="#e9e2d0" strokeWidth={i < 2 ? 22 : 13} strokeLinecap="round" />)}
          {roads.slice(0, 2).map((d, i) => <path key={`c${i}`} d={d} fill="none" stroke={AMBER} strokeWidth={3} strokeDasharray="14 14"
            strokeLinecap="round" opacity={0.8} />)}
          <rect width={536} height={160} fill="#ffffff" opacity={0.06} />
        </g>
        {segments.slice(0, 3).map((segment, i) => {
          const c = [[128, 158], [342, 334], [452, 122]][i];
          const on = i < active;
          const ring = ((frame + i * 10) % 40) / 40;
          return <g key={segment} transform={`translate(${c[0]} ${c[1]})`}>
            {on ? <g>
              <ellipse cx={0} cy={0} rx={10 + ring * 34} ry={(10 + ring * 34) * 0.5} fill="none" stroke={AMBER} strokeWidth={4} opacity={1 - ring} />
              <ellipse cx={0} cy={2} rx={14} ry={6} fill="#1a1236" opacity={0.3} />
              <path d="M0 0 C-5 -12 -20 -22 -20 -38 A20 20 0 1 1 20 -38 C20 -22 5 -12 0 0 Z" fill={AMBER} stroke={line(AMBER)} strokeWidth={ow * 1.6}
                strokeLinejoin="round" />
              <circle cx={0} cy={-38} r={7.5} fill="#ffffff" />
              <ellipse cx={-8} cy={-48} rx={5} ry={3} fill="#ffffff" opacity={0.5} />
              <ClPill x={20 + segment.length * 5.6} y={-70} t={segment.toUpperCase()} size={13} fill="#2a1f4e" ink="#ffd27a" ow={ow * 0.6} />
            </g> : <circle r={8} fill={MUTED} stroke={line(MUTED)} strokeWidth={ow} />}
          </g>;
        })}
      </g>
      <g transform="translate(594 92)">
        <ClTxt x={4} y={14} t="FIELD QUEUE" size={18} fill={TEAL} spacing={1.6} />
        {segments.map((segment, i) => {
          const on = i < active;
          return <g key={segment} transform={`translate(0 ${34 + i * 66})`}>
            <rect width={210} height={52} rx={18} fill={on ? '#1b5a50' : '#26306a'} stroke={line(on ? '#1b5a50' : '#26306a')} strokeWidth={ow * 1.6} />
            <rect x={10} y={5} width={150} height={8} rx={4} fill="#ffffff" opacity={0.1} />
            <circle cx={26} cy={26} r={12} fill={on ? TEAL : 'none'} stroke={on ? line(TEAL) : MUTED} strokeWidth={ow} />
            {on && <path d="M20 26 L25 31 L33 21" fill="none" stroke="#ffffff" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" />}
            <ClTxt x={48} y={33} t={segment.toUpperCase()} size={15} fill={on ? '#eafff9' : MUTED} spacing={1} />
          </g>;
        })}
      </g>
      <ClGlass x={594} y={484} w={210} h={80} r={26} tint="#5a3f14" ow={ow} glow={AMBER} glowK={0.4 + 0.3 * Math.sin(frame / 8)}>
        <ClTxt x={105} y={48} t={status.toUpperCase()} size={17} fill="#ffd27a" anchor="middle" spacing={1} />
      </ClGlass>
    </g>
  );
};

export const EVIDENCE_V2 = ['DocumentStreamV2', 'DataJoinV2', 'AssociationDiagramV2', 'InspectionMapV2'] as const;
