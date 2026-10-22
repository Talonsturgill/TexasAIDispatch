import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {FONT, wrapBreakableToWidth, wrapToWidth} from './lib/type';
import {SAFE_BOTTOM, SAFE_RIGHT} from './lib/safearea';

const W = 1080;
const H = 1920;
const FPS = 30;
const INK = '#102739';
const DEEP = '#123f5a';
const BAYOU = '#23758a';
const SKY = '#9fd9df';
const WHITE = '#f6f1e5';
const CONCRETE = '#d7d2c5';
const SUN = '#f4bd4a';
const HUMAN = '#ee7a3f';
const AI = '#367ca8';
const GREEN = '#64865a';
const RED = '#c64c3c';

type Cue = {id: string; start: number; end: number; text: string};
type TimedScene = {id: string; start_s: number; duration_s: number};
export type HospitalExitProps = {
  runtime_s: number;
  scenes: TimedScene[];
  captions?: Cue[];
  credits?: string;
  credits_s?: number;
};

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => 1 - Math.pow(1 - clamp(v), 3);
const prog = (f: number, a: number, b: number) => clamp((f - a) / Math.max(1, b - a));

const HospitalWorld: React.FC<{frame: number; darkTurn?: boolean}> = ({frame, darkTurn = false}) => {
  const drift = (frame * 0.18) % 120;
  return <>
    <defs>
      <linearGradient id="daySky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={darkTurn ? '#537b86' : '#bce5e7'} />
        <stop offset="0.55" stopColor={darkTurn ? '#8fa3a0' : '#e9ddba'} />
        <stop offset="1" stopColor="#d6be83" />
      </linearGradient>
      <linearGradient id="towerFace" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#ebe7dc" />
        <stop offset="0.66" stopColor="#c8c6be" />
        <stop offset="1" stopColor="#aeb8b9" />
      </linearGradient>
      <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#718087" />
        <stop offset="1" stopColor="#3b4e59" />
      </linearGradient>
      <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="18" stdDeviation="20" floodColor="#102739" floodOpacity="0.28" />
      </filter>
    </defs>
    <rect width={W} height={H} fill="url(#daySky)" />
    <circle cx={860} cy={240} r={92} fill={SUN} opacity={darkTurn ? 0.48 : 0.82} />
    {[0, 1, 2, 3].map((i) => <g key={i} opacity={0.14 + i * 0.03}
      transform={`translate(${((i * 310 + drift * (i % 2 ? 1 : -1)) % 1380) - 160} ${205 + i * 86})`}>
      <ellipse rx={118 + i * 18} ry={26 + i * 4} fill={WHITE} />
      <ellipse cx={70} cy={-10} rx={72} ry={30} fill={WHITE} />
    </g>)}
    {/* Houston's medical skyline: broad floor plates and mechanical bands, not a generic office stack. */}
    {[
      {x: -20, y: 450, w: 310, h: 850, shift: 0},
      {x: 250, y: 330, w: 350, h: 970, shift: 1},
      {x: 565, y: 520, w: 260, h: 780, shift: 2},
      {x: 790, y: 410, w: 310, h: 890, shift: 3},
    ].map((t) => <g key={t.x} opacity={0.9 - t.shift * 0.05}>
      <rect x={t.x} y={t.y} width={t.w} height={t.h} fill="url(#towerFace)"
        stroke={INK} strokeWidth={5} />
      {Array.from({length: Math.floor(t.h / 44)}, (_, j) => <g key={j}>
        <rect x={t.x + 14} y={t.y + 16 + j * 44} width={t.w - 28} height={18}
          fill={j % 5 === 3 ? '#73858a' : '#8eb0ba'} opacity={j % 5 === 3 ? 0.72 : 0.56} />
        {j % 5 === 3 && <path d={`M${t.x + 14},${t.y + 38 + j * 44} H${t.x + t.w - 14}`}
          stroke={INK} strokeWidth={3} opacity={0.36} />}
      </g>)}
    </g>)}
    <path d="M0,1300 C180,1245 330,1330 500,1280 S830,1245 1080,1320 V1500 H0 Z"
      fill={GREEN} opacity={0.82} />
    {/* Coastal-prairie grass and live-oak-like edge silhouettes put the exterior on the Gulf plain. */}
    {Array.from({length: 54}, (_, i) => {
      const x = (i * 83) % 1110 - 15;
      const y = 1360 + (i % 7) * 11;
      const bend = Math.sin(frame / 18 + i) * 5;
      return <path key={i} d={`M${x},${y + 88} Q${x + bend},${y + 35} ${x + 7 + bend},${y}`}
        stroke={i % 4 ? '#526f4f' : '#9b9d59'} strokeWidth={5} opacity={0.72} />;
    })}
    <path d="M0,1490 H1080 V1920 H0 Z" fill="url(#road)" />
    <path d="M0,1538 H1080" stroke={WHITE} strokeWidth={8} opacity={0.55} />
    <path d="M0,1715 H1080" stroke={SUN} strokeWidth={7} strokeDasharray="42 30" opacity={0.58} />
  </>;
};

const Eyebrow: React.FC<{frame: number; text: string}> = ({frame, text}) => {
  const p = ease(prog(frame, 2, 18));
  return <g opacity={p} transform={`translate(${42 * (1 - p)} 0)`}>
    <rect x={58} y={78} width={9} height={46} rx={4} fill={HUMAN} />
    <text x={88} y={112} fontFamily={FONT.mono} fontSize={22} fontWeight={800}
      letterSpacing={1.8} fill={INK}>{text}</text>
  </g>;
};

const DateMarker: React.FC<{x: number; y: number; label: string; color: string; pulse?: number;
  small?: string}> = ({x, y, label, color, pulse = 0, small}) => <g transform={`translate(${x} ${y})`}>
  <circle r={58 + pulse * 5} fill={WHITE} stroke={color} strokeWidth={12} filter="url(#softShadow)" />
  <path d="M0,-27 V5 L28,20" fill="none" stroke={color} strokeWidth={8}
    strokeLinecap="round" strokeLinejoin="round" />
  <text x={0} y={97} textAnchor="middle" fontFamily={FONT.mono} fontSize={20}
    fontWeight={900} fill={color}>{label}</text>
  {small && <text x={0} y={128} textAnchor="middle" fontFamily={FONT.body} fontSize={18}
    fontWeight={700} fill={INK}>{small}</text>}
</g>;

const ExitGate: React.FC<{x?: number; y?: number; open?: number; label?: string}> = ({x = 865,
  y = 1165, open = 0, label = 'DISCHARGE'}) => <g transform={`translate(${x} ${y})`}>
  <path d="M-160,220 V-170 Q0,-270 160,-170 V220" fill="none" stroke={WHITE}
    strokeWidth={26} filter="url(#softShadow)" />
  <path d="M-122,-130 H122" stroke={SUN} strokeWidth={9} />
  <text x={0} y={-154} textAnchor="middle" fontFamily={FONT.mono} fontSize={22}
    fontWeight={900} fill={INK}>{label}</text>
  <g transform={`rotate(${-78 * ease(open)} -136 25)`}>
    <rect x={-136} y={12} width={272} height={30} rx={8} fill={HUMAN} stroke={INK}
      strokeWidth={5} />
    {Array.from({length: 6}, (_, i) => <rect key={i} x={-120 + i * 45} y={18}
      width={24} height={18} fill={WHITE} opacity={0.72} />)}
  </g>
  <rect x={-153} y={5} width={38} height={230} rx={8} fill={CONCRETE} stroke={INK}
    strokeWidth={5} />
</g>;

const Car: React.FC<{x: number; y: number; color?: string}> = ({x, y, color = HUMAN}) =>
  <g transform={`translate(${x} ${y})`} filter="url(#softShadow)">
    <path d="M-120,30 L-84,-28 H55 L105,30 Z" fill={color} stroke={INK} strokeWidth={6} />
    <rect x={-138} y={25} width={276} height={70} rx={22} fill={color} stroke={INK}
      strokeWidth={6} />
    <path d="M-69,-17 H38 L72,28 H-96 Z" fill={SKY} stroke={INK} strokeWidth={4} />
    <circle cx={-82} cy={94} r={25} fill={INK} /><circle cx={83} cy={94} r={25} fill={INK} />
    <circle cx={-82} cy={94} r={10} fill={CONCRETE} /><circle cx={83} cy={94} r={10} fill={CONCRETE} />
  </g>;

const StudyCard: React.FC<{frame: number; reveal: number}> = ({frame, reveal}) => <g
  opacity={reveal} transform={`translate(540 ${730 + 38 * (1 - reveal)}) rotate(${(1 - reveal) * -4})`}>
  <rect x={-410} y={-360} width={820} height={720} rx={26} fill={WHITE} stroke={INK}
    strokeWidth={8} filter="url(#softShadow)" />
  <rect x={-410} y={-360} width={820} height={76} rx={26} fill={DEEP} />
  <rect x={-410} y={-310} width={820} height={26} fill={DEEP} />
  <text x={-350} y={-313} fontFamily={FONT.mono} fontSize={21} fontWeight={900}
    letterSpacing={1.5} fill={SUN}>JAMA NETWORK OPEN · PUBLISHED STUDY</text>
  <text x={-350} y={-210} fontFamily={FONT.display} fontSize={56} fontWeight={850}
    fill={INK}>WHEN DOES THE</text>
  <text x={-350} y={-145} fontFamily={FONT.display} fontSize={56} fontWeight={850}
    fill={INK}>PATIENT GO HOME?</text>
  {['ADMISSION', 'LATER CHECKPOINT', 'LAST CHECKPOINT'].map((t, i) => <g key={t}
    transform={`translate(${-300 + i * 300} 70)`}>
    <circle r={57 + Math.sin(frame / 12 + i) * 3} fill={i === 0 ? BAYOU : WHITE}
      stroke={i === 0 ? AI : HUMAN} strokeWidth={9} />
    <text x={0} y={102} textAnchor="middle" fontFamily={FONT.mono} fontSize={16}
      fontWeight={900} fill={INK}>{t}</text>
  </g>)}
  <path d="M-300,70 H300" stroke={INK} strokeWidth={6} opacity={0.32} />
  <text x={0} y={270} textAnchor="middle" fontFamily={FONT.body} fontSize={27}
    fontWeight={700} fill={DEEP}>CASE MANAGERS · COMMERCIAL EHR TOOL · ACTUAL DATE</text>
</g>;

type SceneProps = {dur: number};

const S1: React.FC<SceneProps> = ({dur}) => {
  const f = useCurrentFrame();
  const run = ease(prog(f, 4, Math.min(48, dur - 30)));
  const cam = ease(prog(f, 0, dur - 1));
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <g transform={`translate(${-42 * cam} ${-35 * cam}) scale(${1 + 0.045 * cam})`}>
    <HospitalWorld frame={f} /><Eyebrow frame={f} text="PUBLISHED SEPTEMBER 3, 2026 · HOUSTON" />
    <path d="M110,740 H850" stroke={HUMAN} strokeWidth={16} strokeLinecap="round" />
    <path d="M110,1010 H850" stroke={AI} strokeWidth={16} strokeLinecap="round" />
    <path d="M900,610 V1160" stroke={SUN} strokeWidth={13} strokeDasharray="24 18" />
    <text x={905} y={570} textAnchor="middle" fontFamily={FONT.mono} fontSize={19}
      fontWeight={900} fill={INK}>ACTUAL DATE</text>
    <DateMarker x={150 + run * 610} y={740} label="CASE MANAGER" color={HUMAN}
      pulse={Math.abs(Math.sin(f / 7))} small="79.5% WITHIN ONE DAY" />
    <DateMarker x={150 + run * 290} y={1010} label="AI" color={AI}
      pulse={Math.abs(Math.sin(f / 8))} small="37.9% WITHIN ONE DAY" />
    <g opacity={ease(prog(f, 22, Math.min(70, dur - 8)))}>
      <rect x={72} y={1115} width={936} height={150} rx={28} fill={WHITE} stroke={INK}
        strokeWidth={7} filter="url(#softShadow)" />
      <text x={110} y={1170} fontFamily={FONT.mono} fontSize={21} fontWeight={900}
        fill={BAYOU}>THE SAME QUESTION</text>
      <text x={110} y={1230} fontFamily={FONT.display} fontSize={48} fontWeight={850}
        fill={INK}>THE PATIENT'S DISCHARGE DATE</text>
    </g>
    </g>
  </svg></AbsoluteFill>;
};

const S2: React.FC<SceneProps> = ({dur}) => {
  const f = useCurrentFrame();
  const settle = ease(prog(f, 5, Math.min(48, dur - 34)));
  const flag = ease(prog(f, 42, Math.min(80, dur - 10)));
  const cam = ease(prog(f, 0, dur - 1));
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <g transform={`translate(${-32 * cam} ${-115 + 115 * cam}) scale(1.055)`}>
    <HospitalWorld frame={f} /><Eyebrow frame={f} text="ADMISSION · CLOSE ON ERROR" />
    <g transform="translate(540 760)">
      <path d="M-370,0 H370" stroke={INK} strokeWidth={7} opacity={0.3} />
      <g transform={`translate(${-170 - 55 * (1 - settle)} 0)`}>
        <DateMarker x={0} y={0} label="CASE MANAGER" color={HUMAN} small="ERROR · 4.27 DAYS" />
      </g>
      <g transform={`translate(${170 + 55 * (1 - settle)} 0)`}>
        <DateMarker x={0} y={0} label="AI" color={AI} small="ERROR · 4.20 DAYS" />
      </g>
    </g>
    <g opacity={flag} transform={`translate(0 ${30 * (1 - flag)})`}>
      <rect x={150} y={1030} width={780} height={210} rx={30} fill={WHITE} stroke={HUMAN}
        strokeWidth={9} filter="url(#softShadow)" />
      <text x={540} y={1097} textAnchor="middle" fontFamily={FONT.mono} fontSize={22}
        fontWeight={900} fill={HUMAN}>EXACT DATE</text>
      <text x={540} y={1163} textAnchor="middle" fontFamily={FONT.display} fontSize={58}
        fontWeight={850} fill={INK}>23.6% · 15.3%</text>
      <text x={540} y={1210} textAnchor="middle" fontFamily={FONT.mono} fontSize={18}
        fontWeight={900} fill={INK}>CASE MANAGERS · AI</text>
    </g>
    </g>
  </svg></AbsoluteFill>;
};

const S3: React.FC<SceneProps> = ({dur}) => {
  const f = useCurrentFrame();
  const run = ease(prog(f, 5, Math.min(76, dur - 24)));
  const cam = ease(prog(f, 0, dur - 1));
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <g transform={`translate(${65 - 80 * cam} ${35 - 55 * cam}) scale(${1.02 + 0.045 * cam})`}>
    <HospitalWorld frame={f} /><Eyebrow frame={f} text="LATER CHECKPOINTS · ERROR SEPARATES" />
    <path d="M120,1030 C310,930 475,930 860,650" fill="none" stroke={HUMAN}
      strokeWidth={18} strokeDasharray={`${900 * run} 900`} strokeLinecap="round" />
    <path d="M120,1110 C330,1075 560,1040 860,920" fill="none" stroke={AI}
      strokeWidth={18} strokeDasharray={`${820 * run} 820`} strokeLinecap="round" />
    {[0.18, 0.42, 0.66].map((p, i) => <g key={p} opacity={ease(prog(f, 12 + i * 13, 32 + i * 13))}>
      <circle cx={180 + p * 650} cy={980 - p * 280} r={25} fill={WHITE} stroke={HUMAN}
        strokeWidth={8} />
      <text x={180 + p * 650} y={1040 - p * 280} textAnchor="middle" fontFamily={FONT.mono}
        fontSize={16} fontWeight={900} fill={INK}>{i === 2 ? '24H LABEL' : i === 1 ? '48H' : 'ADMISSION'}</text>
    </g>)}
    <DateMarker x={120 + run * 720} y={1000 - run * 350} label="CASE MANAGER" color={HUMAN} />
    <DateMarker x={120 + run * 580} y={1110 - run * 190} label="AI" color={AI} />
    <g opacity={ease(prog(f, 56, Math.min(92, dur - 5)))}>
      <text x={70} y={1190} fontFamily={FONT.display} fontSize={68} fontWeight={850}
        fill={INK}>THE ERROR GAP OPENS.</text>
      <text x={74} y={1245} fontFamily={FONT.mono} fontSize={19} fontWeight={900}
        fill={HUMAN}>LATER CHECKPOINTS · CASE MANAGERS LOWER ERROR</text>
    </g>
    </g>
  </svg></AbsoluteFill>;
};

const S4: React.FC<SceneProps> = ({dur}) => {
  const f = useCurrentFrame();
  const fill = ease(prog(f, 5, Math.min(68, dur - 32)));
  const hold = ease(prog(f, 62, Math.min(94, dur - 8)));
  const cam = ease(prog(f, 0, dur - 1));
  const bar = (x: number, value: number, color: string, label: string) => {
    const h = 650 * value * fill;
    return <g>
      <rect x={x} y={530} width={290} height={650} rx={28} fill={WHITE} opacity={0.46}
        stroke={INK} strokeWidth={6} />
      <rect x={x} y={1180 - h} width={290} height={h} rx={28} fill={color} opacity={0.9} />
      <text x={x + 145} y={1190 - h - 38} textAnchor="middle" fontFamily={FONT.display}
        fontSize={72} fontWeight={900} fill={INK}>{(value * 100).toFixed(1)}%</text>
      <text x={x + 145} y={1255} textAnchor="middle" fontFamily={FONT.mono} fontSize={22}
        fontWeight={900} fill={color}>{label}</text>
    </g>;
  };
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <g transform={`translate(${-18 * cam} ${70 - 125 * cam}) scale(${1.015 + 0.035 * cam})`}>
    <HospitalWorld frame={f} /><Eyebrow frame={f} text="ANALYSIS LABELED 24 HOURS · WITHIN ONE DAY" />
    {bar(150, 0.795, HUMAN, 'CASE MANAGERS')}
    {bar(640, 0.379, AI, 'AI')}
    <g opacity={hold}>
      <path d="M150,1295 H930" stroke={SUN} strokeWidth={11} />
    </g>
    </g>
  </svg></AbsoluteFill>;
};

const S4B: React.FC<SceneProps> = ({dur}) => {
  const f = useCurrentFrame();
  const rise = ease(prog(f, 2, Math.min(38, dur - 18)));
  const compare = ease(prog(f, 20, Math.min(54, dur - 4)));
  const cam = ease(prog(f, 0, dur - 1));
  const aiH = 650 * 0.379 * rise;
  const humanY = 1180 - 650 * 0.795;
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <g transform={`translate(${-105 + 115 * cam} ${115 - 88 * cam}) scale(${1.08 + 0.05 * cam})`}>
      <HospitalWorld frame={f} />
      <Eyebrow frame={f} text="THE OTHER LANE · WITHIN ONE DAY" />
      <path d={`M115,${humanY} H965`} stroke={HUMAN} strokeWidth={9}
        strokeDasharray="18 16" opacity={0.25 + compare * 0.7} />
      <text x={950} y={humanY - 24} textAnchor="end" fontFamily={FONT.mono}
        fontSize={18} fontWeight={900} fill={HUMAN} opacity={compare}>
        CASE MANAGERS · 79.5%
      </text>
      <rect x={380} y={530} width={320} height={650} rx={30} fill={WHITE} opacity={0.5}
        stroke={INK} strokeWidth={7} />
      <rect x={380} y={1180 - aiH} width={320} height={aiH} rx={30} fill={AI}
        opacity={0.92} />
      <text x={540} y={1180 - aiH - 42} textAnchor="middle" fontFamily={FONT.display}
        fontSize={88} fontWeight={900} fill={INK}>37.9%</text>
      <text x={540} y={1260} textAnchor="middle" fontFamily={FONT.mono} fontSize={24}
        fontWeight={900} fill={AI}>ARTIFICIAL INTELLIGENCE</text>
      <g opacity={compare}>
        <path d={`M720,${humanY} C840,${humanY} 820,${1180 - aiH} 730,${1180 - aiH}`}
          fill="none" stroke={SUN} strokeWidth={10} strokeLinecap="round" />
        <circle cx={730} cy={1180 - aiH} r={12} fill={SUN} />
      </g>
    </g>
  </svg></AbsoluteFill>;
};

const S5: React.FC<SceneProps> = ({dur}) => {
  const f = useCurrentFrame();
  const move = ease(prog(f, 5, Math.min(78, dur - 26)));
  const cam = ease(prog(f, 0, dur - 1));
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <g transform={`translate(0 ${-90 + 90 * cam}) scale(1.02)`}>
    <HospitalWorld frame={f} /><Eyebrow frame={f} text="WHY THE TIMING MATTERS · BED PLANNING" />
    <path d="M120,770 H900" stroke={WHITE} strokeWidth={78} strokeLinecap="round"
      filter="url(#softShadow)" />
    <path d="M120,770 H850" stroke={HUMAN} strokeWidth={16}
      strokeDasharray={`22 18 ${730 * move} 730`}
      strokeLinecap="round" />
    <g transform={`translate(${120 + move * 620} 770)`}>
      <rect x={-82} y={-50} width={164} height={100} rx={18} fill={SUN} stroke={INK}
        strokeWidth={6} />
      <text x={0} y={8} textAnchor="middle" fontFamily={FONT.mono} fontSize={21}
        fontWeight={900} fill={INK}>DATE</text>
    </g>
    <text x={900} y={786} textAnchor="middle" fontFamily={FONT.display} fontSize={66}
      fontWeight={900} fill={INK}>?</text>
    {[210, 460, 710].map((x, i) => {
      const branch = ease(prog(f, 36 + i * 9, Math.min(66 + i * 9, dur - 12)));
      return <path key={`branch-${x}`} d={`M850,820 Q${730 - i * 80},980 ${x},1115`}
        fill="none" stroke={BAYOU} strokeWidth={10} strokeDasharray={`${520 * branch} 520`}
        strokeLinecap="round" opacity={0.8} />;
    })}
    {[210, 460, 710].map((x, i) => {
      const p = ease(prog(f, 40 + i * 12, Math.min(68 + i * 12, dur - 6)));
      return <g key={x} opacity={0.35 + p * 0.65} transform={`translate(${x} 1060)`}>
        <rect x={-90} y={-45} width={180} height={90} rx={16} fill={WHITE}
          stroke={i === 2 ? HUMAN : DEEP} strokeWidth={7} />
        <path d="M-90,40 V95 M90,40 V95" stroke={INK} strokeWidth={8} />
        <text x={0} y={15} textAnchor="middle" fontFamily={FONT.mono} fontSize={18}
          fontWeight={900} fill={INK}>BED PLAN</text>
      </g>;
    })}
    <text x={540} y={1190} textAnchor="middle" fontFamily={FONT.display} fontSize={42}
      fontWeight={850} fill={INK}>MOST ACTIONABLE</text>
    <text x={540} y={1238} textAnchor="middle" fontFamily={FONT.display} fontSize={42}
      fontWeight={850} fill={INK}>FOR BED MANAGEMENT</text>
    <text x={540} y={1278} textAnchor="middle" fontFamily={FONT.mono} fontSize={16}
      fontWeight={900} fill={BAYOU}>THE STUDY DID NOT MEASURE A DOWNSTREAM OUTCOME</text>
    </g>
  </svg></AbsoluteFill>;
};

const S6: React.FC<SceneProps> = ({dur}) => {
  const f = useCurrentFrame();
  const wire = ease(prog(f, 5, Math.min(70, dur - 30)));
  const dark = ease(prog(f, 52, Math.min(88, dur - 10)));
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <g transform={`translate(${Math.sin(f / 28) * 26} ${-30 * wire}) scale(${1.01 + 0.025 * wire})`}>
    <HospitalWorld frame={f} darkTurn={dark > 0.2} /><Eyebrow frame={f} text="THE PAPER'S CAVEAT · A POSSIBLE CONFOUND" />
    <DateMarker x={230} y={790} label="CASE MANAGER" color={HUMAN} small="VISIBLE TO CARE TEAMS" />
    <path d="M300,790 C500,790 550,680 790,680 M300,790 C500,790 550,900 790,900"
      fill="none" stroke={HUMAN} strokeWidth={14} strokeDasharray="18 18"
      strokeDashoffset={-wire * 90} opacity={0.9} />
    {[0, 1, 2].map((i) => <g key={i} opacity={ease(prog(f, 24 + i * 12, 44 + i * 12))}
      transform={`translate(${760 + i * 90} ${680 + (i % 2) * 220})`}>
      <circle r={42} fill={WHITE} stroke={HUMAN} strokeWidth={7} />
      <path d="M-13,8 Q0,-16 13,8 M0,11 V28" fill="none" stroke={INK} strokeWidth={7}
        strokeLinecap="round" />
      <text x={0} y={-65} textAnchor="middle" fontFamily={FONT.display} fontSize={58}
        fontWeight={900} fill={INK}>?</text>
    </g>)}
    <g opacity={dark}>
      <rect x={90} y={1050} width={900} height={205} rx={28} fill={INK} opacity={0.9} />
      <text x={540} y={1115} textAnchor="middle" fontFamily={FONT.mono} fontSize={20}
        fontWeight={900} fill={SUN}>VISIBLE IN USUAL CARE</text>
      <text x={540} y={1175} textAnchor="middle" fontFamily={FONT.display} fontSize={43}
        fontWeight={850} fill={WHITE}>MAY BE PARTLY SELF-FULFILLING</text>
      <text x={540} y={1220} textAnchor="middle" fontFamily={FONT.mono} fontSize={17}
        fontWeight={900} fill={SKY}>POSSIBLE · NOT A MEASURED RESPONSE</text>
    </g>
    </g>
  </svg></AbsoluteFill>;
};

const S7: React.FC<SceneProps> = ({dur}) => {
  const f = useCurrentFrame();
  const reveal = ease(prog(f, 8, Math.min(62, dur - 24)));
  const cam = ease(prog(f, 0, dur - 1));
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <rect width={W} height={H} fill="#dbe5e2" />
    <path d="M0,280 H1080 M0,1510 H1080" stroke={DEEP} strokeWidth={9} opacity={0.18} />
    <circle cx={920} cy={245} r={150} fill={SKY} opacity={0.42} />
    <g transform={`translate(${-48 + 48 * cam} ${25 - 55 * cam}) scale(${1.075 - 0.025 * cam})`}>
    <Eyebrow frame={f} text="THE AI ESTIMATE · INSIDE THE RECORD" />
    <g opacity={reveal} transform={`translate(0 ${35 * (1 - reveal)})`}>
      <rect x={110} y={430} width={860} height={850} rx={36} fill={WHITE} stroke={AI}
        strokeWidth={10} filter="url(#softShadow)" />
      <rect x={110} y={430} width={860} height={100} rx={36} fill={DEEP} />
      <rect x={110} y={495} width={860} height={35} fill={DEEP} />
      <text x={160} y={495} fontFamily={FONT.mono} fontSize={22} fontWeight={900}
        fill={SUN}>ELECTRONIC HEALTH RECORD</text>
      <DateMarker x={310} y={750} label="AI ESTIMATE" color={AI} small="ACCESSIBLE" />
      <path d="M390,750 H760" stroke={AI} strokeWidth={14} strokeDasharray="20 16"
        strokeDashoffset={-f * 2} />
      <rect x={700} y={675} width={170} height={150} rx={28} fill={CONCRETE} stroke={INK}
        strokeWidth={7} />
      <circle cx={760} cy={750} r={35} fill={WHITE} stroke={AI} strokeWidth={7} />
      <circle cx={810} cy={750} r={35} fill={INK} opacity={0.25} />
      <text x={785} y={880} textAnchor="middle" fontFamily={FONT.mono} fontSize={20}
        fontWeight={900} fill={RED}>AUTOMATIC ENABLEMENT · OFF</text>
      <text x={540} y={1070} textAnchor="middle" fontFamily={FONT.display} fontSize={52}
        fontWeight={850} fill={INK}>ACCESSIBLE IN THE RECORD</text>
      <text x={540} y={1140} textAnchor="middle" fontFamily={FONT.display} fontSize={44}
        fontWeight={850} fill={AI}>NOT ENABLED AUTOMATICALLY</text>
    </g>
    </g>
  </svg></AbsoluteFill>;
};

const S8: React.FC<SceneProps> = ({dur}) => {
  const f = useCurrentFrame();
  const reveal = ease(prog(f, 6, Math.min(58, dur - 28)));
  const bound = ease(prog(f, 46, Math.min(88, dur - 8)));
  const cam = ease(prog(f, 0, dur - 1));
  const panel = (x: number, color: string, title: string, lines: string[]) => <g
    transform={`translate(${x} 0)`}>
    <rect x={0} y={500} width={420} height={620} rx={32} fill={WHITE} stroke={color}
      strokeWidth={9} filter="url(#softShadow)" />
    <text x={210} y={590} textAnchor="middle" fontFamily={FONT.display} fontSize={44}
      fontWeight={850} fill={INK}>{title}</text>
    {lines.map((line, i) => <text key={line} x={210} y={725 + i * 86} textAnchor="middle"
      fontFamily={FONT.mono} fontSize={18} fontWeight={900} fill={i === 0 ? color : INK}>{line}</text>)}
  </g>;
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <g transform={`translate(540 960) scale(${1.08 - 0.08 * cam}) translate(-540 -960)`}>
    <HospitalWorld frame={f} darkTurn /><Eyebrow frame={f} text="THE LIMIT · NOT THE SAME WORKFLOW" />
    <g opacity={reveal}>
      {panel(80, HUMAN, 'CASE MANAGER', ['VISIBLE TO TEAMS', 'USUAL CARE', 'MAY SHAPE DATE?'])}
      {panel(580, AI, 'AI ESTIMATE', ['ACCESSIBLE IN EHR', 'NOT AUTO-ENABLED', 'DIFFERENT CONDITION'])}
    </g>
    <g opacity={bound}>
      <rect x={50} y={445} width={980} height={735} rx={44} fill="none" stroke={SUN}
        strokeWidth={12} strokeDasharray="28 18" />
      <text x={540} y={1120} textAnchor="middle" fontFamily={FONT.mono} fontSize={22}
        fontWeight={900} fill={SUN}>ACCURACY MEASURED</text>
      <rect x={90} y={1140} width={900} height={135} rx={28} fill={INK} opacity={0.92} />
      <text x={540} y={1192} textAnchor="middle" fontFamily={FONT.display} fontSize={42}
        fontWeight={850} fill={WHITE}>DECISIONS · PATIENT OUTCOMES</text>
      <text x={540} y={1240} textAnchor="middle" fontFamily={FONT.mono} fontSize={20}
        fontWeight={900} fill={RED}>NOT MEASURED</text>
    </g>
    </g>
  </svg></AbsoluteFill>;
};

const S9: React.FC<SceneProps> = ({dur}) => {
  const f = useCurrentFrame();
  const loop = ease(prog(f, 5, Math.min(72, dur - 28)));
  const button = ease(prog(f, Math.max(72, dur - 70), dur - 12));
  const cam = ease(prog(f, 0, dur - 1));
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <g transform={`translate(540 930) scale(${1.045 - 0.045 * cam}) translate(-540 -930)`}>
    <HospitalWorld frame={f} /><Eyebrow frame={f} text="WHAT HAPPENS NEXT · TEST THE OUTCOME" />
    <path d="M155,1020 C155,470 900,470 900,1020 C900,1390 235,1390 155,1020 Z"
      fill="none" stroke={INK} strokeWidth={72} opacity={0.2} />
    <path d="M145,1010 C145,470 890,470 890,1010 C890,1370 245,1370 145,1010 Z"
      fill="none" stroke={HUMAN} strokeWidth={16} strokeDasharray={`${2350 * loop} 2350`}
      strokeLinecap="round" />
    <path d="M205,1050 C205,535 835,535 835,1050 C835,1315 300,1315 205,1050 Z"
      fill="none" stroke={AI} strokeWidth={16} strokeDasharray={`${2050 * loop} 2050`}
      strokeLinecap="round" />
    <DateMarker x={150} y={1040} label="CASE MANAGER" color={HUMAN} />
    <DateMarker x={230} y={1190} label="AI" color={AI} />
    <g opacity={loop} transform={`translate(540 ${825 + 35 * (1 - loop)})`}>
      <rect x={-320} y={-130} width={640} height={260} rx={34} fill={WHITE} stroke={DEEP}
        strokeWidth={10} filter="url(#softShadow)" />
      <text x={0} y={-42} textAnchor="middle" fontFamily={FONT.mono} fontSize={22}
        fontWeight={900} fill={BAYOU}>PROSPECTIVE</text>
      <text x={0} y={35} textAnchor="middle" fontFamily={FONT.display} fontSize={62}
        fontWeight={850} fill={INK}>OUTCOME TEST</text>
      <text x={0} y={88} textAnchor="middle" fontFamily={FONT.mono} fontSize={18}
        fontWeight={900} fill={HUMAN}>BEFORE JUDGING VALUE</text>
    </g>
    <g opacity={button} transform={`translate(0 ${24 * (1 - button)})`}>
      <rect x={72} y={1030} width={936} height={205} rx={32} fill={INK} opacity={0.94} />
      <text x={540} y={1098} textAnchor="middle" fontFamily={FONT.mono} fontSize={20}
        fontWeight={900} fill={SUN}>THE OPEN QUESTION</text>
      <text x={540} y={1160} textAnchor="middle" fontFamily={FONT.display} fontSize={43}
        fontWeight={850} fill={WHITE}>IS THE ADDED COMPLEXITY WORTH IT?</text>
      <text x={540} y={1207} textAnchor="middle" fontFamily={FONT.mono} fontSize={18}
        fontWeight={900} fill={SKY}>THAT IS THE NEXT CLOCK TO START</text>
    </g>
    </g>
  </svg></AbsoluteFill>;
};

const CaptionTrack: React.FC<{cues: Cue[]}> = ({cues}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const cue = cues.find((c) => t >= c.start && t < c.end);
  if (!cue) return null;
  let size = 34;
  let lines = wrapToWidth(cue.text, SAFE_RIGHT - 124, size, true);
  while (lines.length > 3 && size > 25) {
    size -= 2;
    lines = wrapToWidth(cue.text, SAFE_RIGHT - 124, size, true);
  }
  const lead = size * 1.28;
  const h = 40 + lines.length * lead;
  const edge = Math.min((t - cue.start) * FPS / 5, (cue.end - t) * FPS / 5, 1);
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <g opacity={clamp(edge)}>
      <rect x={42} y={SAFE_BOTTOM - h} width={SAFE_RIGHT - 42} height={h} rx={14}
        fill="#07151f" opacity={0.92} />
      <rect x={42} y={SAFE_BOTTOM - h} width={8} height={h} rx={4} fill={HUMAN} />
      {lines.map((line, i) => <text key={i} x={76} y={SAFE_BOTTOM - h + 43 + i * lead}
        fontFamily={FONT.body} fontSize={size} fontWeight={720} fill={WHITE}>{line}</text>)}
    </g>
  </svg></AbsoluteFill>;
};

const Credits: React.FC<{text: string; dur: number}> = ({text, dur}) => {
  const f = useCurrentFrame();
  const enter = ease(prog(f, 0, 16));
  const leave = 1 - ease(prog(f, dur - 22, dur));
  const lines = text.split('\n').map((s) => s.trim()).filter(Boolean).flatMap((line) => {
    const head = line === line.toUpperCase() && line.length < 24;
    return wrapBreakableToWidth(line, 900, head ? 23 : 25)
      .map((value, i) => ({value, head, continued: i > 0}));
  });
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <HospitalWorld frame={f} />
    <g opacity={enter * leave} transform={`translate(0 ${26 * (1 - enter)})`}>
      <rect x={62} y={290} width={956} height={1060} rx={38} fill={INK} opacity={0.94}
        filter="url(#softShadow)" />
      <rect x={92} y={330} width={896} height={9} rx={4} fill={SUN} />
      <text x={92} y={455} fontFamily={FONT.display} fontSize={88} fontWeight={850}
        fill={WHITE}>TEXAS AI DOCKET</text>
      {lines.map(({value, head, continued}, i) => <text key={`${value}-${i}`}
        x={94 + (continued ? 24 : 0)} y={610 + i * 56} fontFamily={head ? FONT.mono : FONT.body}
        fontSize={head ? 22 : 26} fontWeight={head ? 900 : 570} fill={head ? SUN : WHITE}
        letterSpacing={head ? 1.7 : 0}>{value}</text>)}
      <text x={94} y={1270} fontFamily={FONT.mono} fontSize={20} fill={SKY}
        letterSpacing={1.4}>THE RECORD · THE WORK · THE LIMIT</text>
    </g>
  </svg></AbsoluteFill>;
};

const SCENES = [S1, S2, S3, S4, S4B, S5, S6, S7, S8, S9];

export const HospitalExitEpisode: React.FC<HospitalExitProps> = ({runtime_s, scenes,
  captions = [], credits = '', credits_s = 5}) => {
  return <AbsoluteFill style={{backgroundColor: INK}}>
    {scenes.slice(0, SCENES.length).map((scene, i) => {
      const Comp = SCENES[i];
      const dur = Math.max(1, Math.round(scene.duration_s * FPS));
      return <Sequence key={scene.id} from={Math.round(scene.start_s * FPS)}
        durationInFrames={dur} name={`${scene.id.toUpperCase()} · ${i + 1}`}>
        <Comp dur={dur} />
      </Sequence>;
    })}
    {captions.length > 0 && <Sequence from={0} durationInFrames={Math.round(runtime_s * FPS)}>
      <CaptionTrack cues={captions} />
    </Sequence>}
    {credits.trim() && <Sequence from={Math.round(runtime_s * FPS)}
      durationInFrames={Math.max(1, Math.round(credits_s * FPS))} name="SOURCES + CREDITS">
      <Credits text={credits} dur={Math.round(credits_s * FPS)} />
    </Sequence>}
  </AbsoluteFill>;
};
