import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type {Cue, Scene} from './Dispatch';
import {CreditsCard, SubtitleTrack} from './Dispatch';
import {FONT} from './lib/type';

const NIGHT = '#071017';
const RICE = '#003b5c';
const BLUE = '#31c4e6';
const PAPER = '#f5f0e6';
const GRAPHITE = '#26343d';
const BAYOU = '#5fc49a';
const AMBER = '#f5ad48';
const MAGENTA = '#f05c86';
const MUTED = '#92a2aa';

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (f: number, a: number, b: number) => interpolate(
  f,
  [a, b],
  [0, 1],
  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)},
);

const cameraMove = (name: Scene['camera_strategy'], p: number) => {
  if (name === 'truckAcross') return `translateX(${-36 + p * 72}px) scale(1.035)`;
  if (name === 'craneDown') return `translateY(${-46 + p * 62}px) scale(${1.045 - p * 0.018})`;
  if (name === 'riseWith') return `translateY(${30 - p * 62}px) scale(${1 + p * 0.038})`;
  if (name === 'orbitReveal') return `translateX(${-22 + p * 44}px) rotate(${-0.8 + p * 1.6}deg) scale(1.03)`;
  return `translateY(${18 - p * 34}px) scale(${1 + p * 0.05})`;
};

const LabWorld: React.FC<{frame: number; accent?: string; horizon?: boolean}> = ({
  frame, accent = BLUE, horizon = true,
}) => {
  const drift = (frame * 1.3) % 90;
  return (
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <defs>
        <radialGradient id="pg-glow" cx="78%" cy="22%" r="82%">
          <stop stopColor={accent} stopOpacity="0.17" />
          <stop offset="0.52" stopColor={RICE} stopOpacity="0.12" />
          <stop offset="1" stopColor={NIGHT} />
        </radialGradient>
        <linearGradient id="pg-horizon" x2="0" y2="1">
          <stop stopColor={MAGENTA} stopOpacity="0.2" />
          <stop offset="1" stopColor={AMBER} stopOpacity="0.02" />
        </linearGradient>
        <pattern id="pg-grid" width="90" height="90" patternUnits="userSpaceOnUse" patternTransform={`translate(${drift} 0)`}>
          <path d="M90 0H0V90" fill="none" stroke={accent} strokeWidth="2" opacity="0.09" />
          <circle r="3.5" fill={accent} opacity="0.15" />
        </pattern>
      </defs>
      <rect width="1080" height="1920" fill="url(#pg-glow)" />
      <rect width="1080" height="1920" fill="url(#pg-grid)" />
      {horizon && <>
        <rect y="1280" width="1080" height="640" fill="url(#pg-horizon)" />
        <path d="M0 1450 H105 V1300 H220 V1400 H325 V1260 H460 V1390 H590 V1210 H730 V1390 H865 V1275 H985 V1415 H1080 V1920 H0Z"
          fill="#08131a" opacity="0.9" />
        <path d="M0 1450 H105 V1300 H220 V1400 H325 V1260 H460 V1390 H590 V1210 H730 V1390 H865 V1275 H985 V1415 H1080"
          fill="none" stroke={accent} strokeWidth="3" opacity="0.2" />
      </>}
      <path d="M-60 1515 C270 1370 630 1540 1140 1320" fill="none" stroke={BAYOU} strokeWidth="5" strokeDasharray="18 20" opacity="0.18" />
    </svg>
  );
};

const Dot: React.FC<{x: number; y: number; p?: number; colour?: string}> = ({x, y, p = 1, colour = BLUE}) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={6 + 18 * p} fill={colour} opacity={0.08 + p * 0.12} />
    <circle r="7" fill={colour} />
  </g>
);

const Candidate: React.FC<{
  x: number; y: number; scale?: number; colour?: string; opacity?: number;
  label?: string; certified?: boolean; rotate?: number;
}> = ({x, y, scale = 1, colour = BLUE, opacity = 1, label = 'CANDIDATE', certified = false, rotate = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${scale}) rotate(${rotate})`} opacity={opacity}>
    <rect x="-142" y="-122" width="284" height="244" rx="22" fill={certified ? PAPER : NIGHT} stroke={colour} strokeWidth="8" />
    <path d="M-98-55 H-34 L4-82 L44-30 L102-70 M-98 10 H-52 L-18-18 L22 34 L58 0 H102"
      fill="none" stroke={certified ? RICE : PAPER} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    <text y="84" textAnchor="middle" fill={certified ? RICE : colour} fontFamily={FONT.body} fontSize="22" fontWeight="950" letterSpacing="2">{label}</text>
    {certified && <circle cx="110" cy="-91" r="26" fill={BAYOU} stroke={RICE} strokeWidth="5" />}
  </g>
);

const AmberGlyph: React.FC<{x: number; y: number; p?: number; label?: string; rotate?: number}> = ({
  x, y, p = 1, label = 'A*', rotate = 0,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate})`} opacity={p}>
    <path d="M0-48 L44 0 L0 48 L-44 0Z" fill={AMBER} stroke={PAPER} strokeWidth="6" />
    <circle r={56 + p * 9} fill="none" stroke={AMBER} strokeWidth="4" opacity="0.24" />
    <text y="8" textAnchor="middle" fill={NIGHT} fontFamily={FONT.body} fontSize="20" fontWeight="950">{label}</text>
  </g>
);

const Human: React.FC<{x: number; y: number; colour?: string; gesture?: boolean}> = ({x, y, colour = BLUE, gesture = false}) => (
  <g transform={`translate(${x} ${y})`}>
    <circle cy="-170" r="36" fill="#c6a480" />
    <path d="M-58-110 Q0-152 58-110 L78 105 H-78Z" fill={GRAPHITE} stroke={colour} strokeWidth="6" />
    <path d={gesture ? 'M42-66 L144-142' : 'M-44-60 L-116 12 M44-60 L116 12'} stroke="#c6a480" strokeWidth="23" strokeLinecap="round" />
  </g>
);

const Seal: React.FC<{x: number; y: number; p: number; label?: string; checked?: boolean}> = ({x, y, p, label = 'CERTIFIED', checked = true}) => (
  <g transform={`translate(${x} ${y}) scale(${0.75 + p * 0.25})`} opacity={p}>
    <circle r="114" fill={NIGHT} stroke={PAPER} strokeWidth="10" />
    <circle r="86" fill="none" stroke={BAYOU} strokeWidth="5" strokeDasharray="13 10" />
    {checked ? <path d="M-34 2 L-6 30 L48-34" fill="none" stroke={BAYOU} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
      : <circle r="31" fill="none" stroke={AMBER} strokeWidth="10" strokeDasharray="12 9" />}
    <text y="74" textAnchor="middle" fill={PAPER} fontFamily={FONT.body} fontSize="18" fontWeight="950" letterSpacing="3">{label}</text>
  </g>
);

const Chrome: React.FC<{scene: Scene; local: number}> = ({scene, local}) => {
  const p = ease(local, 4, 18);
  return (
    <div style={{position: 'absolute', left: 58, right: 58, top: 50, opacity: p}}>
      <div style={{display: 'flex', justifyContent: 'space-between', color: BLUE,
        fontFamily: FONT.body, fontSize: 18, fontWeight: 950, letterSpacing: 4}}>
        <span>TEXAS AI DOCKET</span><span style={{color: BAYOU}}>HARRIS COUNTY</span>
      </div>
      <div style={{height: 3, marginTop: 17, background: `linear-gradient(90deg, ${BLUE}, ${BAYOU}, ${MAGENTA}, transparent)`}} />
      <div style={{marginTop: 28, maxWidth: 930, color: PAPER, fontFamily: FONT.body,
        fontSize: 33, lineHeight: 1.06, fontWeight: 950, letterSpacing: 2.6,
        textShadow: '0 3px 16px #000'}}>{scene.super}</div>
      {scene.caption && <div style={{marginTop: 12, maxWidth: 900, color: AMBER,
        fontFamily: FONT.display, fontSize: 24, lineHeight: 1.12, fontStyle: 'italic'}}>{scene.caption}</div>}
    </div>
  );
};

const Tree: React.FC<{local: number; growth: number; x?: number; y?: number; noisy?: boolean}> = ({
  local, growth, x = 280, y = 1050, noisy = false,
}) => {
  const branches = [
    [-240, -210], [-160, -340], [-58, -410], [74, -390], [185, -306], [270, -168],
  ];
  return (
    <g transform={`translate(${x} ${y})`}>
      {branches.map(([bx, by], i) => {
        const g = clamp(growth * 1.45 - i * 0.08);
        const endX = bx * g;
        const endY = by * g;
        const colour = noisy && i % 3 === 1 ? MAGENTA : (i === 4 ? PAPER : BLUE);
        return <g key={i}>
          <path d={`M0 0 Q${bx * 0.32} ${by * 0.42} ${endX} ${endY}`} fill="none" stroke={colour}
            strokeWidth={i === 4 ? 12 : 7} strokeLinecap="round" opacity={0.35 + g * 0.65} />
          <Dot x={endX} y={endY} p={0.35 + 0.25 * Math.sin((local + i * 8) / 5)} colour={colour} />
          <text x={endX + (bx < 0 ? -12 : 12)} y={endY - 20} textAnchor={bx < 0 ? 'end' : 'start'}
            fill={colour} fontFamily={FONT.body} fontSize="18" fontWeight="900" opacity={g}>{['A', 'B', 'C', 'D', 'E', 'F'][i]}</text>
        </g>;
      })}
      <circle r="42" fill={RICE} stroke={PAPER} strokeWidth="7" />
      <text y="7" textAnchor="middle" fill={PAPER} fontFamily={FONT.body} fontSize="18" fontWeight="950">AI</text>
    </g>
  );
};

const HookScene: React.FC<{local: number; frames: number}> = ({local, frames}) => {
  const grow = ease(local, 0, 30);
  const slam = spring({frame: local - 24, fps: 30, config: {damping: 9, mass: 0.7}});
  const retreat = ease(local, frames * 0.67, frames * 0.88);
  return <>
    <LabWorld frame={local} accent={MAGENTA} />
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <g data-item-id="hook-tree"><Tree local={local} growth={grow} x={365} y={1120} noisy /></g>
      <g data-item-id="hook-gate" transform={`translate(${820 - clamp(slam) * 130} 1030)`}>
        <rect x="-56" y="-420" width="112" height="840" rx="26" fill={PAPER} stroke={BAYOU} strokeWidth="11" />
        <rect x="-165" y="-88" width="330" height="176" rx="22" fill={NIGHT} stroke={PAPER} strokeWidth="8" />
        <text y="-20" textAnchor="middle" fill={PAPER} fontFamily={FONT.body} fontSize="25" fontWeight="950" letterSpacing="4">PROOF</text>
        <text y="34" textAnchor="middle" fill={BAYOU} fontFamily={FONT.body} fontSize="23" fontWeight="950" letterSpacing="4">REQUIRED</text>
      </g>
      <g opacity={ease(local, 28, 48) * (1 - retreat * 0.4)}>
        <path d="M612 804 L742 760" stroke={MAGENTA} strokeWidth="18" strokeLinecap="round" />
        <circle cx="730" cy="764" r="42" fill="none" stroke={MAGENTA} strokeWidth="8" opacity={0.75 + Math.sin(local / 3) * 0.2} />
      </g>
      <AmberGlyph x={612} y={804} p={grow} />
      <g opacity={ease(local, 8, 25)} transform="translate(100 560)">
        <rect width="520" height="100" rx="18" fill={NIGHT} stroke={MAGENTA} strokeWidth="5" />
        <text x="260" y="62" textAnchor="middle" fill={MAGENTA} fontFamily={FONT.body} fontSize="25" fontWeight="950" letterSpacing="4">PROPOSAL ≠ PROOF</text>
      </g>
      <Human x={865} y={1530} colour={MAGENTA} gesture />
    </svg>
  </>;
};

const AwardScene: React.FC<{local: number; frames: number}> = ({local, frames}) => {
  const drop = spring({frame: local - 5, fps: 30, config: {damping: 12, mass: 0.8}});
  const turn = ease(local, 40, frames - 28);
  return <>
    <LabWorld frame={local} accent={BLUE} />
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <g data-item-id="award-card" transform={`translate(540 ${610 - (1 - clamp(drop)) * 420})`} opacity={clamp(drop)}>
        <rect x="-405" y="-172" width="810" height="344" rx="28" fill={PAPER} stroke={BLUE} strokeWidth="9" />
        <text y="-92" textAnchor="middle" fill={RICE} fontFamily={FONT.body} fontSize="24" fontWeight="950" letterSpacing="4">U.S. NATIONAL SCIENCE FOUNDATION</text>
        <text y="-20" textAnchor="middle" fill={NIGHT} fontFamily={FONT.body} fontSize="39" fontWeight="950">AWARD 2616828</text>
        <text y="42" textAnchor="middle" fill={RICE} fontFamily={FONT.body} fontSize="27" fontWeight="900">WILLIAM MARSH RICE UNIVERSITY</text>
        <text y="106" textAnchor="middle" fill={MAGENTA} fontFamily={FONT.body} fontSize="21" fontWeight="950" letterSpacing="3">STANDARD GRANT</text>
      </g>
      <g data-item-id="award-clock" transform="translate(540 1110)">
        <circle r="332" fill={NIGHT} stroke={GRAPHITE} strokeWidth="34" />
        <circle r="275" fill="none" stroke={BLUE} strokeWidth="8" strokeDasharray="28 18" strokeDashoffset={-local * 3} />
        {['AWARD', 'FUNDED', 'READY', '15'].map((d, i) => {
          const a = (-145 + i * 96 + turn * 92) * Math.PI / 180;
          const x = Math.cos(a) * 220;
          const y = Math.sin(a) * 220;
          const active = d === '15';
          return <g key={d} transform={`translate(${x} ${y})`}>
            <circle r={active ? 70 : 49} fill={active ? BAYOU : GRAPHITE} stroke={active ? PAPER : MUTED} strokeWidth="6" />
            <text y="15" textAnchor="middle" fill={active ? NIGHT : PAPER} fontFamily={FONT.body} fontSize={active ? 46 : 17} fontWeight="950">{d}</text>
          </g>;
        })}
        <text y="-34" textAnchor="middle" fill={AMBER} fontFamily={FONT.body} fontSize="25" fontWeight="950" letterSpacing="5">SEPTEMBER</text>
        <text y="20" textAnchor="middle" fill={PAPER} fontFamily={FONT.body} fontSize="31" fontWeight="950">FUNDED TERM</text>
        <text y="65" textAnchor="middle" fill={BAYOU} fontFamily={FONT.body} fontSize="21" fontWeight="950" letterSpacing="3">SCHEDULED START</text>
      </g>
      <path d="M125 1520 Q540 1390 955 1520" fill="none" stroke={BAYOU} strokeWidth="6" />
      <text x="540" y="1582" textAnchor="middle" fill={PAPER} fontFamily={FONT.body} fontSize="24" fontWeight="950" letterSpacing="4">RICE UNIVERSITY · HOUSTON</text>
      <AmberGlyph x={180 + turn * 250} y={1480 - turn * 54} p={clamp(drop)} label="A*" rotate={turn * 90} />
    </svg>
  </>;
};

const FoundationScene: React.FC<{local: number; frames: number}> = ({local, frames}) => {
  const rise = ease(local, 6, frames - 24);
  const pulse = (local * 7) % 520;
  return <>
    <LabWorld frame={local} accent={BAYOU} horizon={false} />
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <g data-item-id="foundation-stack">
        <g opacity={clamp(rise * 1.55)} transform={`translate(${(1 - clamp(rise * 1.55)) * -460} 0)`}>
          <rect x="140" y="700" width="800" height="188" rx="28" fill={NIGHT} stroke={MAGENTA} strokeWidth="7" />
          <path d={`M170 830 C260 ${760 + Math.sin(local / 7) * 24} 360 860 450 790 S650 ${735 + Math.cos(local / 8) * 25} 760 810 S860 845 912 770`}
            fill="none" stroke={MAGENTA} strokeWidth="10" />
          <circle cx={190 + pulse} cy={808 + Math.sin(local / 7) * 35} r="14" fill={PAPER} />
          <text x="540" y="752" textAnchor="middle" fill={MAGENTA} fontFamily={FONT.body} fontSize="23" fontWeight="950" letterSpacing="4">SCIENTIFIC SIMULATION</text>
        </g>
        <g opacity={clamp(rise * 1.5 - 0.18)} transform={`translate(${(1 - clamp(rise * 1.5 - 0.18)) * 460} 0)`}>
          <rect x="140" y="935" width="800" height="205" rx="28" fill={NIGHT} stroke={BAYOU} strokeWidth="7" />
          {Array.from({length: 28}).map((_, i) => <rect key={i} x={190 + (i % 7) * 99} y={1000 + Math.floor(i / 7) * 26}
            width="72" height="14" rx="5" fill={i < Math.floor(rise * 28) ? BAYOU : GRAPHITE} opacity={0.45 + (i % 4) * 0.12} />)}
          <text x="540" y="985" textAnchor="middle" fill={BAYOU} fontFamily={FONT.body} fontSize="23" fontWeight="950" letterSpacing="4">DATA ANALYSIS</text>
        </g>
        <g opacity={clamp(rise * 1.5 - 0.36)} transform={`translate(${(1 - clamp(rise * 1.5 - 0.36)) * -460} 0)`}>
          <rect x="140" y="1188" width="800" height="205" rx="28" fill={NIGHT} stroke={BLUE} strokeWidth="7" />
          {[230, 395, 560, 725, 880].map((x, i) => <g key={x}>
            {i < 4 && <path d={`M${x} 1300 L${x + 165} ${1250 + (i % 2) * 92} M${x} 1300 L${x + 165} ${1336 - (i % 2) * 74}`} stroke={BLUE} strokeWidth="4" opacity="0.38" />}
            <Dot x={x} y={i % 2 ? 1250 : 1336} p={0.3 + Math.sin((local + i * 8) / 5) * 0.14} colour={BLUE} />
          </g>)}
          <text x="540" y="1238" textAnchor="middle" fill={BLUE} fontFamily={FONT.body} fontSize="23" fontWeight="950" letterSpacing="4">ARTIFICIAL INTELLIGENCE</text>
        </g>
      </g>
      <g data-item-id="foundation-matrix" transform={`translate(540 ${1570 - rise * 105})`}>
        <rect x="-360" y="-105" width="720" height="210" rx="30" fill={RICE} stroke={PAPER} strokeWidth="9" />
        {Array.from({length: 11}).map((_, i) => <circle key={i} cx={-300 + i * 60} cy={i % 2 ? -34 : 34} r="13" fill={i % 3 ? BLUE : AMBER} />)}
        <text y="12" textAnchor="middle" fill={PAPER} fontFamily={FONT.body} fontSize="29" fontWeight="950" letterSpacing="4">NUMERICAL LINEAR ALGEBRA</text>
      </g>
      <path d="M540 1460 V800" stroke={PAPER} strokeWidth="10" strokeDasharray="18 14" opacity={rise * 0.55} />
      {[810, 1040, 1290].map((y, i) => <Dot key={y} x={540} y={y} p={0.25 + Math.sin((local + i * 9) / 5) * 0.12} colour={[MAGENTA, BAYOU, BLUE][i]} />)}
      <AmberGlyph x={540} y={1435 - rise * 60} p={rise} />
    </svg>
  </>;
};

const SearchScene: React.FC<{local: number; frames: number}> = ({local, frames}) => {
  const growth = ease(local, 8, frames - 42);
  const lens = ease(local, frames * 0.57, frames * 0.82);
  return <>
    <LabWorld frame={local} accent={BLUE} horizon={false} />
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <g data-item-id="search-seed" transform="translate(180 1235)">
        <Candidate x={0} y={0} scale={0.62} colour={AMBER} label="SEED" />
        <AmberGlyph x={0} y={0} p={1} />
      </g>
      <g data-item-id="search-tree"><Tree local={local} growth={growth} x={470} y={1240} /></g>
      <g opacity={growth}>
        <path d="M165 1235 C260 1170 330 1160 458 1235" fill="none" stroke={AMBER} strokeWidth="10" strokeDasharray="18 14" />
        {['LLM', 'RL', 'BAYESIAN SEARCH'].map((label, i) => <g key={label} transform={`translate(${235 + i * 285} ${600 + i * 72})`}>
          <rect x="-105" y="-42" width="210" height="84" rx="17" fill={NIGHT} stroke={i === 2 ? BAYOU : BLUE} strokeWidth="5" />
          <text y="8" textAnchor="middle" fill={i === 2 ? BAYOU : BLUE} fontFamily={FONT.body} fontSize="20" fontWeight="950" letterSpacing="3">{label}</text>
        </g>)}
      </g>
      <g data-item-id="search-lens" transform={`translate(${655 + lens * 110} ${860 - lens * 80})`} opacity={lens}>
        <circle r="170" fill="none" stroke={BAYOU} strokeWidth="11" />
        <circle r="128" fill={BAYOU} opacity="0.08" />
        <path d="M120 120 L240 240" stroke={BAYOU} strokeWidth="26" strokeLinecap="round" />
        <text y="10" textAnchor="middle" fill={PAPER} fontFamily={FONT.body} fontSize="22" fontWeight="950" letterSpacing="3">DISTINCT</text>
      </g>
      <g data-item-id="search-tree" opacity={ease(local, frames * 0.7, frames * 0.9)}>
        <text x="540" y="1600" textAnchor="middle" fill={MUTED} fontFamily={FONT.body} fontSize="20" fontWeight="950" letterSpacing="3">SEARCH FAST · SPEND PROOF CALLS CAREFULLY</text>
      </g>
    </svg>
  </>;
};

const VarianceScene: React.FC<{local: number; frames: number}> = ({local, frames}) => {
  const progress = ease(local, 10, frames - 30);
  const paths = [
    {colour: BLUE, points: 'M175 815 C360 735 430 860 610 775 S840 650 965 730'},
    {colour: BAYOU, points: 'M175 1030 C330 1010 435 885 590 1038 S820 1165 965 1020'},
    {colour: MAGENTA, points: 'M175 1245 C335 1340 430 1160 610 1245 S820 1370 965 1280'},
  ];
  return <>
    <LabWorld frame={local} accent={MAGENTA} horizon={false} />
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <g data-item-id="variance-prompts">
        {paths.map((p, i) => <g key={i} transform={`translate(0 ${i * 215})`}>
          <rect x="70" y="680" width="180" height="104" rx="18" fill={NIGHT} stroke={PAPER} strokeWidth="5" />
          <text x="160" y="722" textAnchor="middle" fill={MUTED} fontFamily={FONT.body} fontSize="17" fontWeight="950">SAME PROMPT</text>
          <text x="160" y="760" textAnchor="middle" fill={PAPER} fontFamily={FONT.body} fontSize="24" fontWeight="950">{String.fromCharCode(65 + i)}</text>
        </g>)}
      </g>
      <g data-item-id="variance-paths">
        {paths.map((p, i) => <g key={i}>
          <path d={p.points} fill="none" stroke={p.colour} strokeWidth="12" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - progress} />
          <circle cx="955" cy={730 + i * 270} r="31" fill={NIGHT} stroke={p.colour} strokeWidth="8" opacity={progress} />
        </g>)}
      </g>
      <AmberGlyph x={175 + progress * 780} y={815 + Math.sin(progress * Math.PI * 2) * 60} p={progress} />
      <g opacity={ease(local, frames * 0.62, frames * 0.83)} transform="translate(540 1530)">
        <rect x="-410" y="-80" width="820" height="160" rx="26" fill={NIGHT} stroke={MAGENTA} strokeWidth="7" />
        <text y="-12" textAnchor="middle" fill={MAGENTA} fontFamily={FONT.body} fontSize="27" fontWeight="950" letterSpacing="4">MODEL-INDUCED RANDOMNESS</text>
        <text y="38" textAnchor="middle" fill={PAPER} fontFamily={FONT.body} fontSize="21" fontWeight="900">OPAQUE · INCONSISTENT · PROMPT-VARIABLE</text>
      </g>
      <path d="M708 620 L936 1435" stroke={MAGENTA} strokeWidth="5" opacity={0.2 + Math.sin(local / 4) * 0.08} />
    </svg>
  </>;
};

const DerivationScene: React.FC<{local: number; frames: number}> = ({local, frames}) => {
  const open = spring({frame: local - 20, fps: 30, config: {damping: 12, mass: 0.75}});
  const rows = ['ALGEBRAIC TRANSFORMS', 'NESTED LOOPS', 'COMPOSITIONAL PRIMITIVES', 'ADMISSIBLE PARAMETERS', 'SYMBOLIC COSTS'];
  return <>
    <LabWorld frame={local} accent={BAYOU} horizon={false} />
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <g data-item-id="derive-code" transform={`translate(${245 - clamp(open) * 90} 1060)`}>
        <rect x="-185" y="-360" width="370" height="720" rx="28" fill={NIGHT} stroke={MAGENTA} strokeWidth="9" />
        {Array.from({length: 10}).map((_, i) => <path key={i} d={`M-130 ${-270 + i * 54} H${i % 3 === 0 ? 80 : 130}`} stroke={i % 4 === 0 ? MAGENTA : MUTED} strokeWidth="9" strokeLinecap="round" />)}
        <text y="310" textAnchor="middle" fill={MAGENTA} fontFamily={FONT.body} fontSize="21" fontWeight="950" letterSpacing="3">OPAQUE BLOCK</text>
        <AmberGlyph x={0} y={0} p={1} label="A*" />
      </g>
      <g data-item-id="derive-layers">
        {rows.map((row, i) => {
          const p = clamp(open * 1.55 - i * 0.11);
          return <g key={row} transform={`translate(${470 + p * 70} ${700 + i * 165})`} opacity={p}>
            <rect width={450 + i * 18} height="118" rx="20" fill={RICE} stroke={i === 4 ? AMBER : BAYOU} strokeWidth="6" />
            <text x="28" y="49" fill={MUTED} fontFamily={FONT.body} fontSize="16" fontWeight="950" letterSpacing="2">DERIVATION LAYER</text>
            <text x="28" y="88" fill={PAPER} fontFamily={FONT.body} fontSize="21" fontWeight="950">{row}</text>
            <Dot x={420 + i * 18} y={59} p={0.3 + Math.sin((local + i * 8) / 5) * 0.16} colour={i === 4 ? AMBER : BAYOU} />
          </g>;
        })}
      </g>
      <path d={`M420 1060 H${430 + clamp(open) * 490}`} stroke={PAPER} strokeWidth="9" strokeDasharray="16 14" opacity={clamp(open)} />
      <text x="540" y="1585" textAnchor="middle" fill={BAYOU} fontFamily={FONT.body} fontSize="22" fontWeight="950" letterSpacing="4">STRUCTURE BEFORE PROOF</text>
    </svg>
  </>;
};

const ProofPressScene: React.FC<{local: number; frames: number}> = ({local, frames}) => {
  const fall = ease(local, 8, frames * 0.48);
  const press = spring({frame: local - frames * 0.46, fps: 30, config: {damping: 10, mass: 0.7}});
  const planned = ease(local, frames * 0.68, frames * 0.86);
  return <>
    <LabWorld frame={local} accent={PAPER} horizon={false} />
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <g data-item-id="lean-candidate"><Candidate x={540} y={550 + fall * 510} scale={0.68} colour={AMBER} label="DERIVATION" /></g>
      <g data-item-id="lean-press">
        <g transform={`translate(${-250 + clamp(press) * 305} 1060)`}>
          <path d="M0-270 H300 L370 0 L300 270 H0Z" fill={RICE} stroke={PAPER} strokeWidth="11" />
          <text x="175" y="-24" textAnchor="middle" fill={PAPER} fontFamily={FONT.body} fontSize="25" fontWeight="950" letterSpacing="3">CORRECTNESS</text>
          <text x="175" y="28" textAnchor="middle" fill={BAYOU} fontFamily={FONT.body} fontSize="20" fontWeight="950">DETERMINISTIC</text>
        </g>
        <g transform={`translate(${1030 - clamp(press) * 305} 1060)`}>
          <path d="M0-270 H-300 L-370 0 L-300 270 H0Z" fill={RICE} stroke={PAPER} strokeWidth="11" />
          <text x="-175" y="-24" textAnchor="middle" fill={PAPER} fontFamily={FONT.body} fontSize="25" fontWeight="950" letterSpacing="3">COST</text>
          <text x="-175" y="28" textAnchor="middle" fill={AMBER} fontFamily={FONT.body} fontSize="20" fontWeight="950">COMPUTE + COMMS</text>
        </g>
        <path d="M540 630 V1460" stroke={PAPER} strokeWidth="8" strokeDasharray="20 17" opacity="0.35" />
      </g>
      <g opacity={planned}>
        <circle cx="540" cy="1060" r={94 + Math.sin(local / 4) * 8} fill={PAPER} opacity="0.1" />
        <circle cx="540" cy="1060" r="108" fill="none" stroke={PAPER} strokeWidth="8" strokeDasharray="18 15" />
        <AmberGlyph x={540} y={1060} p={planned} />
        <path d="M540 1180 V1425" stroke={BAYOU} strokeWidth="8" strokeDasharray="18 14" />
        <rect x="155" y="1420" width="770" height="122" rx="23" fill={NIGHT} stroke={MAGENTA} strokeWidth="7" />
        <text x="540" y="1470" textAnchor="middle" fill={PAPER} fontFamily={FONT.body} fontSize="22" fontWeight="950" letterSpacing="3">IF BOTH CLAIMS PASS</text>
        <text x="540" y="1511" textAnchor="middle" fill={MAGENTA} fontFamily={FONT.body} fontSize="20" fontWeight="950" letterSpacing="4">PLANNED CHECK · NO RESULTS YET</text>
      </g>
    </svg>
  </>;
};

const ObjectScene: React.FC<{local: number; frames: number}> = ({local, frames}) => {
  const harden = ease(local, 5, frames * 0.48);
  const reuse = ease(local, frames * 0.48, frames * 0.8);
  return <>
    <LabWorld frame={local} accent={BAYOU} horizon={false} />
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <g data-item-id="object-certified">
        <g transform={`translate(${250 + reuse * 470} ${1120 - reuse * 170}) rotate(${reuse * 90})`}>
          <rect x="-105" y="-105" width="210" height="210" rx={22 - harden * 12} fill={harden > 0.7 ? PAPER : NIGHT}
            stroke={AMBER} strokeWidth="9" strokeDasharray={harden < 0.72 ? '18 14' : undefined} />
          <AmberGlyph x={0} y={0} p={1} />
        </g>
      </g>
      <g data-item-id="object-chain" opacity={ease(local, 36, 70)}>
        <path d="M280 1260 C430 1390 565 1360 720 1200" fill="none" stroke={BAYOU} strokeWidth="8" strokeDasharray="16 13" />
        {['CORRECTNESS', 'COST', 'PROVENANCE'].map((label, i) => <g key={label} transform={`translate(${250 + i * 250} ${1370 - i * 35})`}>
          <circle r="48" fill={NIGHT} stroke={[BAYOU, AMBER, BLUE][i]} strokeWidth="6" strokeDasharray="11 9" />
          <text y="7" textAnchor="middle" fill={[BAYOU, AMBER, BLUE][i]} fontFamily={FONT.body} fontSize="13" fontWeight="950">{label}</text>
        </g>)}
      </g>
      <g opacity={reuse} transform="translate(650 840)">
        <rect x="-250" y="-250" width="500" height="500" rx="30" fill={NIGHT} stroke={BAYOU} strokeWidth="8" strokeDasharray="20 14" />
        {[-1, 0, 1].map((row) => [-1, 0, 1].map((col) => {
          const missing = row === 1 && col === 0;
          return <rect key={`${row}-${col}`} x={col * 138 - 55} y={row * 138 - 55} width="110" height="110" rx="12"
            fill={missing ? NIGHT : RICE} stroke={missing ? AMBER : BLUE} strokeWidth="6" strokeDasharray={missing ? '12 9' : undefined} />;
        }))}
        <text y="318" textAnchor="middle" fill={BAYOU} fontFamily={FONT.body} fontSize="21" fontWeight="950" letterSpacing="4">PLANNED REUSE ASSEMBLY</text>
      </g>
      <rect x="118" y="1515" width="844" height="108" rx="23" fill={NIGHT} stroke={MAGENTA} strokeWidth="6" />
      <text x="540" y="1582" textAnchor="middle" fill={PAPER} fontFamily={FONT.body} fontSize="22" fontWeight="950" letterSpacing="3">IF PROVED · THEN REUSABLE · NO RESULT YET</text>
    </svg>
  </>;
};

const BenchScene: React.FC<{local: number; frames: number}> = ({local, frames}) => {
  const travel = ease(local, 8, frames - 28);
  const apps = ['LEAST SQUARES', 'REGRESSION', 'LOW-RANK', 'MATRIX COMPLETION'];
  return <>
    <LabWorld frame={local} accent={AMBER} />
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <path d="M90 1120 H930" stroke={GRAPHITE} strokeWidth="58" />
      <path d="M90 1120 H930" stroke={AMBER} strokeWidth="9" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - travel} />
      <AmberGlyph x={90 + travel * 840} y={1120} p={travel} />
      <g data-item-id="bench-applications">
        {apps.map((app, i) => {
          const p = clamp(travel * 1.5 - i * 0.18);
          return <g key={app} transform={`translate(${135 + i * 225} 970)`} opacity={p}>
            <rect x="-92" y="-130" width="184" height="260" rx="22" fill={NIGHT} stroke={i % 2 ? BLUE : BAYOU} strokeWidth="6" />
            <circle cy="-58" r="24" fill={GRAPHITE} stroke={PAPER} strokeWidth="5" />
            <path d="M-53 4 H53 M-53 42 H33" stroke={MUTED} strokeWidth="8" strokeLinecap="round" />
            <text y="100" textAnchor="middle" fill={i % 2 ? BLUE : BAYOU} fontFamily={FONT.body} fontSize="16" fontWeight="950">{app}</text>
          </g>;
        })}
      </g>
      <g data-item-id="bench-empty" transform="translate(540 1440)" opacity={ease(local, frames * 0.63, frames * 0.84)}>
        <rect x="-405" y="-112" width="810" height="224" rx="27" fill={NIGHT} stroke={MAGENTA} strokeWidth="8" />
        <text y="-30" textAnchor="middle" fill={MAGENTA} fontFamily={FONT.body} fontSize="30" fontWeight="950" letterSpacing="5">RESULTS SHELF / EMPTY</text>
        <text y="29" textAnchor="middle" fill={PAPER} fontFamily={FONT.body} fontSize="23" fontWeight="900">FUNDED PLAN ≠ PUBLISHED OUTCOME</text>
        <path d="M-270 72 H270" stroke={GRAPHITE} strokeWidth="12" strokeLinecap="round" />
      </g>
      <text x="540" y="715" textAnchor="middle" fill={AMBER} fontFamily={FONT.body} fontSize="23" fontWeight="950" letterSpacing="4">PLANNED APPLICATIONS</text>
    </svg>
  </>;
};

const CloseScene: React.FC<{local: number; frames: number}> = ({local, frames}) => {
  const open = ease(local, 5, 32);
  const insert = ease(local, 22, 64);
  const tick = ease(local, 58, 98);
  const seal = ease(local, frames * 0.64, frames * 0.86);
  return <>
    <LabWorld frame={local} accent={BAYOU} />
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <g data-item-id="close-library" transform="translate(555 1050)">
        <path d={`M-440 360 V-270 H${-20 - open * 360} V360 M440 360 V-270 H${20 + open * 360} V360`} fill={RICE} stroke={BAYOU} strokeWidth="10" />
        {Array.from({length: 4}).map((_, i) => <g key={i} transform={`translate(${-330 + i * 215} 0)`}>
          <rect x="-75" y="-185" width="150" height="310" rx="13" fill={NIGHT} stroke={i % 2 ? BLUE : AMBER} strokeWidth="6" />
          <path d="M-46-115 H46 M-46-65 H30 M-46-15 H46 M-46 35 H22" stroke={MUTED} strokeWidth="7" strokeLinecap="round" />
        </g>)}
        <text y="278" textAnchor="middle" fill={PAPER} fontFamily={FONT.body} fontSize="22" fontWeight="950" letterSpacing="4">OPEN SOFTWARE · MATERIALS · PUBLIC WORKSHOPS</text>
      </g>
      <g transform={`translate(${-40 + insert * 135} 1050)`}><Candidate x={0} y={0} scale={0.56} colour={AMBER} label="PROPOSED" /><AmberGlyph x={0} y={0} p={1} /></g>
      <g data-item-id="close-clock" transform="translate(820 590)">
        <circle r="155" fill={NIGHT} stroke={AMBER} strokeWidth="8" />
        <path d={`M0 0 L${Math.sin(tick * Math.PI * 1.3) * 82} ${-Math.cos(tick * Math.PI * 1.3) * 82}`} stroke={PAPER} strokeWidth="10" strokeLinecap="round" />
        <text y="-47" textAnchor="middle" fill={AMBER} fontFamily={FONT.body} fontSize="19" fontWeight="950" letterSpacing="3">START DATE</text>
        <text y="43" textAnchor="middle" fill={PAPER} fontFamily={FONT.body} fontSize="48" fontWeight="950">SEP 15</text>
        <text y="92" textAnchor="middle" fill={AMBER} fontFamily={FONT.body} fontSize="22" fontWeight="950" letterSpacing="3">2026</text>
      </g>
      <g data-item-id="close-pencil" transform={`translate(${285 + seal * 40} ${590 + seal * 50}) rotate(-24)`}>
        <rect x="-170" y="-18" width="340" height="36" rx="15" fill={AMBER} stroke={PAPER} strokeWidth="5" />
        <path d="M170-18 L225 0 L170 18Z" fill={PAPER} />
        <text x="-15" y="8" textAnchor="middle" fill={NIGHT} fontFamily={FONT.body} fontSize="16" fontWeight="950" letterSpacing="2">AI PROPOSES</text>
      </g>
      <g data-item-id="close-proof"><Seal x={515} y={610} p={seal} label="PLANNED GATE" checked={false} /></g>
      <g opacity={ease(local, frames * 0.74, frames * 0.92)}>
        <text x="540" y="1625" textAnchor="middle" fill={PAPER} fontFamily={FONT.display} fontSize="28" fontStyle="italic">The model gets a pencil. In the plan, proof decides what becomes reusable.</text>
      </g>
    </svg>
  </>;
};

const Art: React.FC<{scene: Scene; local: number; frames: number}> = ({scene, local, frames}) => {
  if (scene.id === 's1') return <HookScene local={local} frames={frames} />;
  if (scene.id === 's2') return <AwardScene local={local} frames={frames} />;
  if (scene.id === 's3') return <FoundationScene local={local} frames={frames} />;
  if (scene.id === 's4') return <SearchScene local={local} frames={frames} />;
  if (scene.id === 's5') return <VarianceScene local={local} frames={frames} />;
  if (scene.id === 's6') return <DerivationScene local={local} frames={frames} />;
  if (scene.id === 's7') return <ProofPressScene local={local} frames={frames} />;
  if (scene.id === 's8') return <ObjectScene local={local} frames={frames} />;
  if (scene.id === 's9') return <BenchScene local={local} frames={frames} />;
  return <CloseScene local={local} frames={frames} />;
};

const ProofScene: React.FC<{scene: Scene; fps: number}> = ({scene, fps}) => {
  const local = useCurrentFrame();
  const frames = Math.max(1, Math.round(scene.duration_s * fps));
  const p = clamp(local / Math.max(1, frames - 1));
  const enter = scene.id === 's1' ? 1 : ease(local, 0, 7);
  const leave = 1 - ease(local, frames - 7, frames - 1);
  return (
    <AbsoluteFill style={{background: NIGHT, opacity: Math.min(enter, leave)}}>
      <div style={{position: 'absolute', inset: -28, transform: cameraMove(scene.camera_strategy, p), transformOrigin: '50% 55%'}}>
        <Art scene={scene} local={local} frames={frames} />
      </div>
      <Chrome scene={scene} local={local} />
      <div style={{position: 'absolute', left: 57, bottom: 238, width: 6, height: 132,
        background: `linear-gradient(${BLUE}, ${BAYOU}, ${MAGENTA})`, opacity: 0.76}} />
    </AbsoluteFill>
  );
};

export const ProofGateEpisode: React.FC<{
  runtime_s: number;
  scenes: Scene[];
  captions?: Cue[];
  credits?: string;
  credits_s?: number;
}> = ({runtime_s, scenes, captions, credits, credits_s = 5}) => {
  const {fps} = useVideoConfig();
  const end = Math.max(runtime_s, ...scenes.map((scene) => scene.start_s + scene.duration_s));
  return (
    <AbsoluteFill style={{background: NIGHT}}>
      {scenes.map((scene) => (
        <Sequence key={scene.id} from={Math.round(scene.start_s * fps)} durationInFrames={Math.max(1, Math.round(scene.duration_s * fps))}>
          <ProofScene scene={scene} fps={fps} />
        </Sequence>
      ))}
      {captions && captions.length > 0 && (
        <Sequence from={0} durationInFrames={Math.max(1, Math.round(end * fps))}>
          <SubtitleTrack cues={captions} fps={fps} />
        </Sequence>
      )}
      {credits && credits.trim() && (
        <Sequence from={Math.round(end * fps)} durationInFrames={Math.max(1, Math.round(credits_s * fps))}>
          <CreditsCard text={credits} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
