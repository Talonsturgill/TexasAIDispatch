import React from 'react';
import {FONT} from './type';
import {INK} from './lighting';

// =============================================================================
// EVIDENCE — visual nouns for records, joins, limits and field handoffs.
//
// The engine could draw Texas beautifully and could draw a generic machine overlay.
// It could not draw the four actions the Docket reports most often: a document becoming
// structured data, two public records joining, an association being kept separate from
// causation, and a flagged place being handed to a human. Authors compensated with pickups,
// people and readout boxes. The words changed; the picture did not.
//
// These are not per-story scenes. They are reusable editorial instruments with visible props.
// `shot_coherence.py` knows exactly which props each one paints, so a number or label in a
// proof is the same number or label a viewer can see.
// =============================================================================

const PAPER = '#eee4cf';
const PAPER_DARK = '#c9b999';
const TEAL = '#45d1c1';
const AMBER = '#e1a94a';
const RED = '#d9664a';
const PANEL = '#101a24';
const MUTED = '#91a1ad';

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => {
  const t = clamp01(n);
  return t * t * (3 - 2 * t);
};

const Label: React.FC<{x: number; y: number; text: string; size?: number; color?: string;
  anchor?: 'start' | 'middle' | 'end'}> = ({x, y, text, size = 20, color = '#e9edf0',
    anchor = 'start'}) => (
  <text x={x} y={y} fontFamily={FONT.mono} fontWeight={700} fontSize={size}
    textAnchor={anchor} fill={color} letterSpacing={0.7}>{text}</text>
);

export const DocumentStream: React.FC<{
  x?: number; y?: number; scale?: number; frame?: number; title: string; count: string;
  sample: string; status: string;
}> = ({x = 0, y = 0, scale = 1, frame = 0, title, count, sample, status}) => {
  const p = ease((frame - 4) / 48);
  const stripY = 360 - p * 190;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x={0} y={0} width={820} height={600} rx={26} fill={PANEL} stroke={INK}
        strokeWidth={6} />
      <rect x={28} y={28} width={764} height={72} rx={12} fill="#172735" />
      <Label x={54} y={73} text={title.toUpperCase()} size={24} color={PAPER} />
      <Label x={766} y={76} text={count} size={38} color={AMBER} anchor="end" />

      {/* A stack of real-looking narrative strips, each moving at its own phase. */}
      {Array.from({length: 7}, (_, i) => {
        const yy = 132 + ((i * 57 + frame * (0.7 + (i % 3) * 0.12)) % 390);
        const w = 510 + ((i * 43) % 180);
        return (
          <g key={i} transform={`translate(${50 + (i % 2) * 20} ${yy})`} opacity={0.22 + i * 0.08}>
            <rect x={0} y={0} width={w} height={34} rx={5} fill={PAPER} />
            <rect x={18} y={10} width={w * 0.72} height={5} rx={2.5} fill={PAPER_DARK} />
            <rect x={18} y={20} width={w * 0.48} height={4} rx={2} fill={PAPER_DARK} />
          </g>
        );
      })}

      {/* The one sentence held long enough to read: source language becoming evidence. */}
      <g transform={`translate(62 ${stripY})`}>
        <rect x={0} y={0} width={696} height={116} rx={9} fill={PAPER} stroke={AMBER}
          strokeWidth={5} />
        <Label x={24} y={35} text="NARRATIVE" size={15} color="#5b4a34" />
        <text x={24} y={76} fontFamily={FONT.body} fontWeight={700} fontSize={26}
          fill="#24201a">{sample}</text>
        <path d="M24,90 H640" stroke={PAPER_DARK} strokeWidth={4} strokeLinecap="round" />
      </g>

      <g transform="translate(52 528)">
        <rect x={0} y={0} width={716} height={46} rx={8} fill="#19362f" />
        <circle cx={22} cy={23} r={7} fill={TEAL} opacity={0.55 + 0.45 * Math.sin(frame / 5)} />
        <Label x={44} y={31} text={status.toUpperCase()} size={18} color={TEAL} />
      </g>
    </g>
  );
};
export const DataJoin: React.FC<{
  x?: number; y?: number; scale?: number; frame?: number;
  leftTitle: string; leftCount: string; rightTitle: string; rightCount: string; result: string;
}> = ({x = 0, y = 0, scale = 1, frame = 0, leftTitle, leftCount, rightTitle, rightCount,
  result}) => {
  const p = ease((frame - 8) / 52);
  const leftX = 44 + p * 98;
  const rightX = 556 - p * 98;
  const pulse = 0.5 + 0.5 * Math.sin(frame / 6);
  const card = (cx: number, title: string, count: string, color: string) => (
    <g transform={`translate(${cx} 118)`}>
      <rect x={0} y={0} width={280} height={250} rx={20} fill="#13212d" stroke={color}
        strokeWidth={5} />
      <Label x={24} y={45} text={title.toUpperCase()} size={18} color={color} />
      <Label x={140} y={116} text={count} size={42} color="#f0eadf" anchor="middle" />
      {Array.from({length: 5}, (_, i) => (
        <rect key={i} x={28} y={148 + i * 16} width={150 + ((i * 31) % 72)} height={6}
          rx={3} fill={MUTED} opacity={0.35 + i * 0.08} />
      ))}
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x={0} y={0} width={840} height={590} rx={28} fill={PANEL} stroke={INK}
        strokeWidth={6} />
      <Label x={420} y={70} text="ONE DECISION · TWO PUBLIC RECORDS" size={21}
        color={PAPER} anchor="middle" />
      {card(leftX, leftTitle, leftCount, TEAL)}
      {card(rightX, rightTitle, rightCount, AMBER)}
      <path d={`M${leftX + 280},243 C390,243 385,430 420,430
                M${rightX},243 C450,243 455,430 420,430`}
        fill="none" stroke="#d7e1e5" strokeWidth={5} strokeDasharray="14 10"
        strokeDashoffset={-frame * 1.8} opacity={0.72} />
      <g transform="translate(190 410)">
        <rect x={0} y={0} width={460} height={126} rx={18} fill="#183b35" stroke={TEAL}
          strokeWidth={6} opacity={0.92 + pulse * 0.08} />
        <Label x={230} y={52} text="JOINED RECORD" size={18} color={TEAL} anchor="middle" />
        <text x={230} y={96} fontFamily={FONT.body} fontWeight={750} fontSize={30}
          textAnchor="middle" fill="#f3eee5">{result}</text>
      </g>
    </g>
  );
};

export const AssociationDiagram: React.FC<{
  x?: number; y?: number; scale?: number; frame?: number;
  leftLabel: string; rightLabel: string; relation: string; limit: string;
}> = ({x = 0, y = 0, scale = 1, frame = 0, leftLabel, rightLabel, relation, limit}) => {
  const p = ease((frame - 5) / 42);
  const dash = 620 * p;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x={0} y={0} width={840} height={600} rx={28} fill={PANEL} stroke={INK}
        strokeWidth={6} />
      <Label x={420} y={72} text="WHAT THE RECORD SUPPORTS" size={23} color={PAPER}
        anchor="middle" />
      {[{xx: 70, label: leftLabel, color: AMBER}, {xx: 490, label: rightLabel, color: TEAL}]
        .map((node, i) => (
          <g key={i} transform={`translate(${node.xx} 160)`}>
            <rect x={0} y={0} width={280} height={150} rx={20} fill="#172734"
              stroke={node.color} strokeWidth={6} />
            <text x={140} y={68} fontFamily={FONT.body} fontWeight={760} fontSize={28}
              textAnchor="middle" fill="#f0ece4">{node.label}</text>
            <circle cx={140} cy={112} r={13} fill={node.color} />
          </g>
        ))}
      <path d="M210,272 C300,380 540,380 630,272" fill="none" stroke={TEAL}
        strokeWidth={7} strokeDasharray={`${dash} 620`} strokeLinecap="round" />
      <g transform="translate(240 330)">
        <rect x={0} y={0} width={360} height={64} rx={32} fill="#173c36" stroke={TEAL}
          strokeWidth={4} />
        <Label x={180} y={42} text={relation.toUpperCase()} size={21} color={TEAL}
          anchor="middle" />
      </g>

      {/* The broken causal arrow is deliberately large. The limit is part of the claim. */}
      <g transform="translate(110 455)">
        <path d="M0,30 H220 M300,30 H520" stroke={RED} strokeWidth={9}
          strokeLinecap="round" opacity={0.9} />
        <path d="M510,8 L548,30 L510,52" fill="none" stroke={RED} strokeWidth={9}
          strokeLinejoin="round" />
        <path d="M245,2 L278,58 M278,2 L245,58" stroke={PAPER} strokeWidth={8}
          strokeLinecap="round" />
        <Label x={275} y={98} text={limit.toUpperCase()} size={24} color={RED}
          anchor="middle" />
      </g>
    </g>
  );
};

export const InspectionMap: React.FC<{
  x?: number; y?: number; scale?: number; frame?: number;
  title: string; county: string; segments: string[]; status: string;
}> = ({x = 0, y = 0, scale = 1, frame = 0, title, county, segments, status}) => {
  const active = Math.min(segments.length, Math.floor(frame / 16) + 1);
  const roads = [
    'M40,120 C190,90 250,180 390,150 S620,70 720,130',
    'M90,420 C220,330 360,390 470,310 S650,270 730,350',
    'M170,70 C210,220 140,300 260,490',
    'M610,60 C540,180 650,270 590,500',
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x={0} y={0} width={840} height={620} rx={28} fill={PANEL} stroke={INK}
        strokeWidth={6} />
      <Label x={44} y={58} text={title.toUpperCase()} size={23} color={PAPER} />
      <Label x={796} y={58} text={county.toUpperCase()} size={18} color={AMBER}
        anchor="end" />
      <g transform="translate(32 82)">
        <rect x={0} y={0} width={536} height={492} rx={16} fill="#182c31" />
        {roads.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#87949b" strokeWidth={i < 2 ? 18 : 10}
            strokeLinecap="round" opacity={0.48} />
        ))}
        {segments.slice(0, 3).map((segment, i) => {
          const coords = [[128, 158], [342, 334], [452, 122]][i];
          const on = i < active;
          return (
            <g key={segment} transform={`translate(${coords[0]} ${coords[1]})`}>
              <circle cx={0} cy={0} r={on ? 24 : 12} fill={on ? AMBER : MUTED}
                opacity={on ? 0.28 + 0.14 * Math.sin(frame / 4 + i) : 0.25} />
              <circle cx={0} cy={0} r={8} fill={on ? AMBER : MUTED} />
              {on && <Label x={16} y={-13} text={segment.toUpperCase()} size={13} color={AMBER} />}
            </g>
          );
        })}
      </g>
      <g transform="translate(594 105)">
        <Label x={0} y={0} text="FIELD QUEUE" size={18} color={TEAL} />
        {segments.map((segment, i) => (
          <g key={segment} transform={`translate(0 ${34 + i * 66})`}>
            <rect x={0} y={0} width={206} height={49} rx={8}
              fill={i < active ? '#1b4038' : '#1a2630'} />
            <circle cx={22} cy={24} r={8} fill={i < active ? TEAL : MUTED} />
            <Label x={42} y={31} text={segment.toUpperCase()} size={14}
              color={i < active ? '#e9f4ef' : MUTED} />
          </g>
        ))}
        <rect x={0} y={382} width={206} height={74} rx={10} fill="#3d2f1a" stroke={AMBER}
          strokeWidth={3} />
        <Label x={103} y={45} text={status.toUpperCase()} size={17} color={AMBER}
          anchor="middle" />
      </g>
    </g>
  );
};
