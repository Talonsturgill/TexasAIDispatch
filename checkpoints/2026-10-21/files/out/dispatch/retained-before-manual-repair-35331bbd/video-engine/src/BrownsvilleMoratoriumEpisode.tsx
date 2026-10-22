import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {FONT, wrapToWidth} from './lib/type';
import {SAFE_BOTTOM, SAFE_RIGHT} from './lib/safearea';

const W = 1080;
const H = 1920;
const FPS = 30;
const INK = '#08141b';
const GULF = '#183e46';
const GULF_LIGHT = '#6ca6a5';
const PAPER = '#efe2c5';
const PAPER_DARK = '#b9a982';
const BRASS = '#d39a42';
const RED = '#b84237';
const GREEN = '#365f50';

type Cue = {id: string; start: number; end: number; text: string};
type TimedScene = {id: string; start_s: number; duration_s: number};
export type BrownsvilleMoratoriumProps = {
  runtime_s: number;
  scenes: TimedScene[];
  captions?: Cue[];
  credits?: string;
  credits_s?: number;
};

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => 1 - Math.pow(1 - clamp(v), 3);
const prog = (f: number, a: number, b: number) => clamp((f - a) / Math.max(1, b - a));

const Backdrop: React.FC<{frame: number; warm?: boolean}> = ({frame, warm = false}) => (
  <>
    <defs>
      <linearGradient id="gulfDesk" x1="0" y1="0" x2="0.9" y2="1">
        <stop offset="0" stopColor={warm ? '#62462d' : '#234f56'} />
        <stop offset="0.55" stopColor={warm ? '#30271f' : '#112b32'} />
        <stop offset="1" stopColor={INK} />
      </linearGradient>
      <filter id="paperShadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#000" floodOpacity="0.35" />
      </filter>
    </defs>
    <rect width={W} height={H} fill="url(#gulfDesk)" />
    {Array.from({length: 24}, (_, i) => (
      <circle key={i} cx={(i * 179 + frame * (i % 2 ? 0.11 : -0.08)) % 1220 - 70}
        cy={100 + (i * 227) % 1560} r={2 + (i % 4)} fill={PAPER}
        opacity={0.025 + (i % 3) * 0.012} />
    ))}
    {/* A resaca curve and sabal-palm silhouettes keep the recurring set in the
        Lower Rio Grande Valley instead of a generic dark studio. */}
    <path d="M-40,1380 C170,1290 300,1430 505,1350 S860,1240 1120,1385"
      fill="none" stroke={GULF_LIGHT} strokeWidth={20} opacity={0.08} />
    <g fill={INK} opacity={0.45}>
      <path d="M120,1410 V1210 H138 V1410 Z M129,1228 C55,1208 50,1150 52,1120 C105,1144 128,1178 129,1228 Z
        M129,1228 C205,1208 214,1152 214,1120 C160,1143 132,1178 129,1228 Z
        M129,1225 C80,1170 98,1122 114,1096 C145,1140 149,1177 129,1225 Z
        M129,1225 C174,1170 158,1122 144,1096 C112,1140 108,1177 129,1225 Z" />
      <path d="M948,1410 V1245 H964 V1410 Z M956,1260 C892,1244 886,1196 888,1170 C934,1190 954,1218 956,1260 Z
        M956,1260 C1020,1244 1028,1197 1028,1170 C982,1190 959,1218 956,1260 Z" />
    </g>
    <path d="M0,1500 C210,1410 380,1530 560,1460 S880,1370 1080,1490 V1920 H0 Z"
      fill="#09161b" opacity={0.7} />
  </>
);

const Eyebrow: React.FC<{frame: number; text: string; n: string}> = ({frame, text, n}) => {
  const p = ease(prog(frame, 3, 18));
  return <g opacity={p} transform={`translate(${40 * (1 - p)} 0)`}>
    <rect x={66} y={88} width={8} height={42} rx={4} fill={BRASS} />
    <text x={94} y={118} fontFamily={FONT.mono} fontSize={22} fontWeight={700}
      fill={PAPER} letterSpacing={1.8}>{text}</text>
  </g>;
};

const CommissionDais: React.FC<{frame: number}> = ({frame}) => {
  const arrive = ease(prog(frame, 4, 34));
  return <g opacity={arrive} transform={`translate(540 ${1060 + 35 * (1 - arrive)})`}>
    <path d="M-410,80 Q0,-155 410,80 V235 H-410 Z" fill="#17252a" stroke={PAPER_DARK}
      strokeWidth={8} />
    <path d="M-365,75 Q0,-105 365,75" fill="none" stroke={BRASS} strokeWidth={7} />
    {[-255, -85, 85, 255].map((x, i) => <g key={x} transform={`translate(${x} ${60 + Math.sin(frame / 14 + i) * 2})`}>
      <path d="M0,0 V-65" stroke={PAPER} strokeWidth={7} />
      <circle cy={-76} r={14} fill={i % 2 ? BRASS : GULF_LIGHT} />
    </g>)}
    <text x={0} y={155} textAnchor="middle" fontFamily={FONT.mono} fontSize={22}
      fontWeight={800} fill={PAPER}>BROWNSVILLE CITY COMMISSION</text>
  </g>;
};

const Paper: React.FC<{frame: number; x?: number; y?: number; rotate?: number; title: string;
  lines?: string[]; progress?: number}> = ({frame, x = 540, y = 860, rotate = 0, title,
    lines = [], progress = 1}) => {
  const p = ease(progress);
  return <g opacity={p} filter="url(#paperShadow)"
    transform={`translate(${x} ${y + Math.sin(frame / 13) * 3}) rotate(${rotate}) scale(${0.9 + p * 0.1})`}>
    <rect x={-350} y={-410} width={700} height={820} rx={16} fill={PAPER}
      stroke="#75684e" strokeWidth={7} />
    <path d="M-350,-285 H350" stroke={BRASS} strokeWidth={10} />
    <text x={-300} y={-322} fontFamily={FONT.mono} fontSize={19} fontWeight={700}
      fill={GREEN}>CITY OF BROWNSVILLE · PUBLIC RECORD</text>
    <text x={-300} y={-210} fontFamily={FONT.display} fontSize={54} fontWeight={700}
      fill={INK}>{title}</text>
    {lines.map((line, i) => <text key={line} x={-300} y={-105 + i * 72}
      fontFamily={FONT.body} fontSize={31} fontWeight={650} fill={i === 0 ? GREEN : '#3e443d'}>{line}</text>)}
    <circle cx={270} cy={320} r={54 + Math.sin(frame / 8) * 3} fill="none"
      stroke={BRASS} strokeWidth={7} opacity={0.7} />
    <path d="M235,320 H305 M270,285 V355" stroke={BRASS} strokeWidth={6} opacity={0.7} />
  </g>;
};

const MoratoriumBar: React.FC<{frame: number; y: number; lockProgress?: number}> = ({frame, y,
  lockProgress = 0}) => {
  const pulse = 0.75 + 0.18 * Math.sin(frame / 6);
  const locked = ease(lockProgress);
  return <g transform={`translate(0 ${y})`}>
    <rect x={90} y={-44} width={900} height={88} rx={18} fill={RED} stroke={INK} strokeWidth={9}
      opacity={0.42 + (1 - locked) * pulse * 0.18} />
    <text x={335} y={11} textAnchor="middle" fontFamily={FONT.display} fontSize={36}
      fontWeight={800} fill={PAPER}>MORATORIUM</text>
    <text x={660} y={11} textAnchor="middle" fontFamily={FONT.display} fontSize={36}
      fontWeight={800} fill={PAPER}>NOT IN EFFECT</text>
    {locked > 0 && <g opacity={locked} transform={`translate(360 ${-28 * (1 - locked)})`}>
      <rect x={472} y={-91} width={136} height={182} rx={28} fill={INK} stroke={PAPER_DARK}
        strokeWidth={7} />
      <path d="M500,-84 V-126 Q500,-184 540,-184 Q580,-184 580,-126 V-84" fill="none"
        stroke={PAPER} strokeWidth={18} strokeLinecap="round" />
      <text x={540} y={16} textAnchor="middle" fontFamily={FONT.mono} fontSize={27}
        fontWeight={800} fill={BRASS}>LOCKED</text>
    </g>}
  </g>;
};

const Clock: React.FC<{frame: number; x: number; y: number; running?: boolean; label: string;
  value: string; color?: string}> = ({frame, x, y, running = false, label, value,
    color = BRASS}) => {
  const angle = running ? frame * 5 : 0;
  return <g transform={`translate(${x} ${y})`}>
    <circle r={150} fill="#0b1a20" stroke={color} strokeWidth={10} />
    <circle r={126} fill="none" stroke={PAPER_DARK} strokeWidth={3} strokeDasharray="5 14" />
    <path d={`M0,0 L${Math.sin(angle * Math.PI / 180) * 84},${-Math.cos(angle * Math.PI / 180) * 84}`}
      stroke={color} strokeWidth={10} strokeLinecap="round" />
    <circle r={14} fill={color} />
    <text x={0} y={230} textAnchor="middle" fontFamily={FONT.mono} fontSize={22}
      fontWeight={800} fill={color}>{label}</text>
    <text x={0} y={280} textAnchor="middle" fontFamily={FONT.display} fontSize={48}
      fontWeight={800} fill={PAPER}>{value}</text>
  </g>;
};

const DataHall: React.FC<{frame: number; x: number; y: number; scale?: number}> = ({frame, x, y,
  scale = 1}) => <g transform={`translate(${x} ${y}) scale(${scale})`}>
  <rect x={-300} y={-120} width={600} height={250} rx={12} fill="#24343a" stroke={PAPER_DARK}
    strokeWidth={8} />
  <path d="M-320,-120 L-245,-220 H265 L320,-120 Z" fill="#17252a" stroke={PAPER_DARK}
    strokeWidth={8} />
  {Array.from({length: 7}, (_, i) => <rect key={i} x={-255 + i * 78} y={-54}
    width={46} height={100} rx={5} fill="#0a181d" stroke={GULF_LIGHT} strokeWidth={4} />)}
  {Array.from({length: 7}, (_, i) => <circle key={i} cx={-232 + i * 78} cy={-20}
    r={5 + 2 * Math.sin(frame / 7 + i)} fill={i % 2 ? BRASS : GULF_LIGHT} />)}
  <path d="M-260,88 H260" stroke={RED} strokeWidth={8} strokeDasharray="20 14" />
</g>;

const Mic: React.FC<{frame: number; x: number; y: number}> = ({frame, x, y}) => (
  <g transform={`translate(${x} ${y}) rotate(${Math.sin(frame / 12) * 1.5})`}>
    <rect x={-35} y={-220} width={70} height={160} rx={34} fill={INK} stroke={BRASS}
      strokeWidth={8} />
    {[-170, -135, -100].map((yy) => <path key={yy} d={`M-18,${yy} H18`} stroke={PAPER_DARK}
      strokeWidth={6} />)}
    <path d="M0,-60 V90 M-95,90 H95" stroke={PAPER} strokeWidth={16} strokeLinecap="round" />
    <circle cx={0} cy={-140} r={76 + 8 * Math.sin(frame / 6)} fill={GULF_LIGHT}
      opacity={0.08} />
  </g>
);

type SceneProps = {dur: number};

const S1: React.FC<SceneProps> = ({dur}) => {
  const f = useCurrentFrame();
  const stamp = ease(prog(f, 3, 22));
  const fall = ease(prog(f, 22, Math.min(dur - 34, 55)));
  const lock = ease(prog(f, 51, Math.min(dur - 12, 72)));
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <Backdrop frame={f} /><Eyebrow frame={f} text="BROWNSVILLE · COMMISSION VOTE" n="01" />
    <CommissionDais frame={f} />
    <DataHall frame={f} x={540} y={1215} scale={0.72} />
    <g transform={`translate(540 ${470 - 90 * stamp}) rotate(${-8 + 8 * stamp})`} opacity={stamp}>
      <rect x={-355} y={-130} width={710} height={260} rx={25} fill={PAPER} stroke={BRASS}
        strokeWidth={10} />
      <text x={0} y={-20} textAnchor="middle" fontFamily={FONT.display} fontSize={66}
        fontWeight={800} fill={INK}>START THE PROCESS</text>
      <text x={0} y={65} textAnchor="middle" fontFamily={FONT.mono} fontSize={26}
        fontWeight={800} fill={GREEN}>CITY COMMISSION ACTION</text>
    </g>
    <MoratoriumBar frame={f} y={250 + fall * 555} lockProgress={lock} />
    <g opacity={lock} transform={`translate(0 ${20 * (1 - lock)})`}>
      <text x={540} y={1040} textAnchor="middle" fontFamily={FONT.display} fontSize={64}
        fontWeight={800} fill={PAPER}>PROCESS STARTED.</text>
      <text x={540} y={1120} textAnchor="middle" fontFamily={FONT.display} fontSize={64}
        fontWeight={800} fill={BRASS}>PAUSE DID NOT.</text>
    </g>
  </svg></AbsoluteFill>;
};

const S2: React.FC<SceneProps> = ({dur}) => {
  const f = useCurrentFrame();
  const open = ease(prog(f, 5, Math.min(58, dur - 28)));
  const blank = ease(prog(f, 50, Math.min(92, dur - 8)));
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <Backdrop frame={f} warm /><Eyebrow frame={f} text="THE CODE · THE EMPTY SLOT" n="02" />
    <g transform={`translate(${540 - 170 * (1 - open)} 930) rotate(${-10 + 10 * open})`}>
      <rect x={-390} y={-570} width={780} height={1140} rx={22} fill={PAPER} stroke={INK}
        strokeWidth={10} />
      <text x={-320} y={-475} fontFamily={FONT.display} fontSize={58} fontWeight={800}
        fill={INK}>UNIFIED</text>
      <text x={-320} y={-405} fontFamily={FONT.display} fontSize={58} fontWeight={800}
        fill={INK}>DEVELOPMENT CODE</text>
      {['INDUSTRIAL USES', 'SPECIAL PERMITS', 'UTILITY CAPACITY', 'DATA CENTERS'].map((t, i) =>
        <g key={t} transform={`translate(0 ${-300 + i * 180})`}>
          <rect x={-320} y={-58} width={640} height={116} rx={12}
            fill={i === 3 ? '#d8cdb5' : '#ded2b7'} stroke={i === 3 ? RED : PAPER_DARK}
            strokeWidth={i === 3 ? 8 : 3} opacity={i === 3 ? blank : 1} />
          {i === 3 ? <>
            <text x={-280} y={-5} fontFamily={FONT.mono} fontSize={25} fontWeight={800}
              fill={GREEN}>DATA CENTERS</text>
            <text x={-280} y={32} fontFamily={FONT.mono} fontSize={27} fontWeight={800}
              fill={RED} opacity={blank}>NO SPECIFIC RULE</text>
          </> : <text x={-280} y={15} fontFamily={FONT.mono} fontSize={30} fontWeight={800}
            fill={GREEN}>{t}</text>}
        </g>)}
    </g>
  </svg></AbsoluteFill>;
};

const S3: React.FC<SceneProps> = ({dur}) => {
  const f = useCurrentFrame();
  const spread = ease(prog(f, 8, Math.min(62, dur - 24)));
  const labels = [['ELECTRICITY', -285, -80], ['WATER', 285, -80], ['NOISE', -310, 190],
    ['LAND USE', 310, 190], ['INFRASTRUCTURE', -245, 250], ['FISCAL EFFECT', 245, 250]] as const;
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <Backdrop frame={f} /><Eyebrow frame={f} text="THE STUDY · SIX QUESTIONS" n="03" />
    <g transform="translate(540 740)"><DataHall frame={f} x={0} y={0} scale={0.78} /></g>
    {labels.map(([t, x, y], i) => <g key={t}
      transform={`translate(${540 + x * spread} ${930 + y * spread})`} opacity={spread}>
      <circle r={i >= 4 ? 58 : 72} fill={i % 2 ? GULF : GREEN} stroke={i % 2 ? GULF_LIGHT : BRASS}
        strokeWidth={7} />
      <text x={0} y={8} textAnchor="middle" fontFamily={FONT.mono} fontSize={t.length > 10 ? 15 : 18}
        fontWeight={800} fill={PAPER}>{t}</text>
      <path d={`M${x > 0 ? -72 : 72},0 L${-x * 0.52},${-y * 0.52 - 190}`}
        stroke={PAPER_DARK} strokeWidth={4} strokeDasharray="9 9" />
    </g>)}
    <text x={540} y={1040} textAnchor="middle" fontFamily={FONT.display} fontSize={58}
      fontWeight={800} fill={PAPER}>TIME TO STUDY THE</text>
    <text x={540} y={1110} textAnchor="middle" fontFamily={FONT.display} fontSize={58}
      fontWeight={800} fill={BRASS}>IMPACTS.</text>
  </svg></AbsoluteFill>;
};

const S4: React.FC<SceneProps> = ({dur}) => {
  const f = useCurrentFrame();
  const wake = ease(prog(f, 5, Math.min(60, dur - 22)));
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <Backdrop frame={f} warm /><Eyebrow frame={f} text="TASK FORCE · PROPOSED TO RETURN" n="04" />
    <g transform={`translate(540 ${700 + 50 * (1 - wake)}) rotate(${(1 - wake) * -5})`}>
      <ellipse rx={420} ry={285} fill="#2b241e" stroke={BRASS} strokeWidth={9} />
      <ellipse rx={470} ry={335} fill="none" stroke={PAPER_DARK} strokeWidth={4}
        strokeDasharray="12 18" opacity={0.75} />
      {[-300, -150, 0, 150, 300].map((x, i) => <g key={x}
        transform={`translate(${x} ${i % 2 ? -245 : 245})`} opacity={0.35 + 0.65 * wake}>
        <rect x={-42} y={-28} width={84} height={56} rx={14} fill="none"
          stroke={GULF_LIGHT} strokeWidth={6} />
        <path d="M-30,34 V64 M30,34 V64" stroke={GULF_LIGHT} strokeWidth={6} />
      </g>)}
      <rect x={-220} y={-155} width={440} height={310} rx={14} fill={PAPER}
        stroke={PAPER_DARK} strokeWidth={6} opacity={wake} />
      <path d="M-220,-85 H220" stroke={BRASS} strokeWidth={7} opacity={wake} />
      <text x={0} y={-108} textAnchor="middle" fontFamily={FONT.mono} fontSize={18}
        fontWeight={800} fill={GREEN} opacity={wake}>PROPOSED</text>
      <text x={0} y={-35} textAnchor="middle" fontFamily={FONT.display} fontSize={40}
        fontWeight={800} fill={INK} opacity={wake}>RECOMMENDATIONS</text>
      <text x={0} y={28} textAnchor="middle" fontFamily={FONT.body} fontSize={23}
        fontWeight={700} fill={GREEN} opacity={wake}>STUDY DATA CENTERS</text>
      <text x={0} y={72} textAnchor="middle" fontFamily={FONT.body} fontSize={22}
        fontWeight={650} fill="#3e443d" opacity={wake}>REPORT TO THE COMMISSION</text>
      <text x={0} y={225} textAnchor="middle" fontFamily={FONT.mono} fontSize={20}
        fontWeight={800} fill={PAPER_DARK}>EMPTY TASK-FORCE TABLE</text>
      <text x={0} y={268} textAnchor="middle" fontFamily={FONT.mono} fontSize={16}
        fontWeight={800} fill={BRASS}>BROWNSVILLE CITY COMMISSION</text>
    </g>
    <text x={540} y={1080} textAnchor="middle" fontFamily={FONT.mono} fontSize={24}
      fontWeight={800} fill={BRASS} opacity={wake}>PROPOSED · TABLE NOT YET FILLED</text>
    <text x={540} y={1140} textAnchor="middle" fontFamily={FONT.display} fontSize={49}
      fontWeight={800} fill={PAPER} opacity={wake}>RECOMMENDATIONS</text>
    <text x={540} y={1200} textAnchor="middle" fontFamily={FONT.display} fontSize={49}
      fontWeight={800} fill={PAPER} opacity={wake}>TO THE COMMISSION</text>
  </svg></AbsoluteFill>;
};

const S5: React.FC<SceneProps> = ({dur}) => {
  const f = useCurrentFrame();
  const draw = ease(prog(f, 5, Math.min(70, dur - 22)));
  const nodes = [
    {x: 170, date: 'OCT 6', label: 'HEARING'},
    {x: 540, date: 'OCT 13', label: 'FIRST READING'},
    {x: 910, date: 'NOV 17', label: 'FINAL VOTE'},
  ];
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <Backdrop frame={f} /><Eyebrow frame={f} text="SELECT PROPOSED DATES · NOT THE FULL SEQUENCE" n="05" />
    <path d="M170,880 H910" stroke={PAPER_DARK} strokeWidth={18} strokeLinecap="round" />
    <path d="M170,880 H910" stroke={BRASS} strokeWidth={18} strokeLinecap="round"
      strokeDasharray={`${740 * draw} 740`} />
    {nodes.map((node, i) => {
      const p = ease(prog(f, 12 + i * 20, 34 + i * 20));
      return <g key={node.date} opacity={p} transform={`translate(${node.x} 880)`}>
        <circle r={56 + 5 * Math.sin(f / 7 + i)} fill={i === 2 ? "none" : INK} stroke={i === 2 ? RED : BRASS}
          strokeWidth={10} />
        <text x={0} y={-118} textAnchor="middle" fontFamily={FONT.display} fontSize={48}
          fontWeight={800} fill={PAPER}>{node.date}</text>
        <text x={0} y={124} textAnchor="middle" fontFamily={FONT.mono} fontSize={20}
          fontWeight={800} fill={i === 2 ? RED : GULF_LIGHT}>{node.label}</text>
        {i === 2 && <text x={0} y={168} textAnchor="middle" fontFamily={FONT.mono} fontSize={17}
          fontWeight={800} fill={RED}>PENDING</text>}
      </g>;
    })}
    <g opacity={ease(prog(f, 70, Math.min(105, dur - 4)))}>
      <text x={540} y={1125} textAnchor="middle" fontFamily={FONT.display} fontSize={62}
        fontWeight={800} fill={PAPER}>THE CLOCK RUNS TO A VOTE.</text>
      <text x={540} y={1195} textAnchor="middle" fontFamily={FONT.mono} fontSize={21}
        fontWeight={800} fill={BRASS}>SELECT DATES · NOT THE COMPLETE SEQUENCE</text>
    </g>
  </svg></AbsoluteFill>;
};

const S6: React.FC<SceneProps> = ({dur}) => {
  const f = useCurrentFrame();
  // Hold the two-clock comparison long enough to read, then land the
  // conditional date with the matching narrated clause instead of revealing
  // the whole answer in the opening beat.
  const turn = ease(prog(f, 55, Math.min(128, dur - 18)));
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <Backdrop frame={f} warm /><Eyebrow frame={f} text="THE TURN · TWO DIFFERENT CLOCKS" n="06" />
    <Clock frame={f} x={285} y={690} running label="HEARING CLOCK" value="MOVING" color={BRASS} />
    <Clock frame={f} x={795} y={690} label="MORATORIUM CLOCK" value="NOT IN EFFECT" color={RED} />
    <g opacity={turn} transform={`translate(0 ${35 * (1 - turn)})`}>
      <MoratoriumBar frame={f} y={1080} lockProgress={0} />
      <g transform="translate(540 1010)">
        <rect x={-130} y={-27} width={260} height={54} rx={15} fill={INK}
          stroke={PAPER_DARK} strokeWidth={5} />
        <text x={0} y={7} textAnchor="middle" fontFamily={FONT.mono} fontSize={18}
          fontWeight={800} fill={BRASS}>CLOCK LOCKED</text>
      </g>
      <text x={540} y={1215} textAnchor="middle" fontFamily={FONT.mono} fontSize={22}
        fontWeight={800} fill={GULF_LIGHT}>NOV 18 · ONLY IF THE ORDINANCE PASSES</text>
    </g>
  </svg></AbsoluteFill>;
};

const S7: React.FC<SceneProps> = ({dur}) => {
  const f = useCurrentFrame();
  const first = ease(prog(f, 4, 42));
  const gate = ease(prog(f, 42, Math.min(62, dur - 30)));
  const second = ease(prog(f, 66, Math.min(104, dur - 8)));
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <Backdrop frame={f} /><Eyebrow frame={f} text="THE LIMIT · IF THE ORDINANCE PASSES" n="07" />
    <g transform="translate(540 700)">
      <circle r={310} fill="none" stroke="#35545a" strokeWidth={56} />
      <circle r={310} fill="none" stroke={BRASS} strokeWidth={56} strokeLinecap="round"
        strokeDasharray={`${973 * first} 1946`} transform="rotate(-90)" />
      <circle r={310} fill="none" stroke={RED} strokeWidth={56} strokeLinecap="round"
        strokeDasharray={`${973 * second} 1946`} strokeDashoffset={-973} transform="rotate(-90)"
        opacity={gate} />
      <text x={0} y={-15} textAnchor="middle" fontFamily={FONT.display} fontSize={150}
        fontWeight={800} fill={PAPER}>{second > 0.15 ? '180' : '90'}</text>
      <text x={0} y={70} textAnchor="middle" fontFamily={FONT.mono} fontSize={28}
        fontWeight={800} fill={GULF_LIGHT}>MAXIMUM DAYS</text>
    </g>
    <g opacity={gate} transform={`translate(0 ${18 * (1 - gate)})`}>
      <rect x={255} y={1050} width={570} height={88} rx={18} fill={INK} stroke={BRASS}
        strokeWidth={6} />
      <text x={540} y={1107} textAnchor="middle" fontFamily={FONT.mono} fontSize={22}
        fontWeight={800} fill={PAPER}>GATE · ADDITIONAL REQUIRED PROCEEDINGS</text>
    </g>
    <g opacity={second}>
      <text x={540} y={1200} textAnchor="middle" fontFamily={FONT.display} fontSize={52}
        fontWeight={800} fill={PAPER}>POSSIBLE 90-DAY EXTENSION</text>
    </g>
  </svg></AbsoluteFill>;
};

const S8: React.FC<SceneProps> = ({dur}) => {
  const f = useCurrentFrame();
  const land = ease(prog(f, 4, 42));
  const button = ease(prog(f, 58, Math.min(100, dur - 6)));
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <Backdrop frame={f} warm /><Eyebrow frame={f} text="THE NEXT ROOM · PUBLIC COMMENT" n="08" />
    <g opacity={0.32 + 0.68 * land}>
      <Mic frame={f} x={900} y={700} />
      <g transform={`translate(${220 + land * 320} ${1040 - land * 85}) rotate(${-8 + land * 5})`}>
        <rect x={-245} y={-145} width={490} height={290} rx={18} fill={PAPER}
          stroke={BRASS} strokeWidth={7} filter="url(#paperShadow)" />
        <text x={-205} y={-82} fontFamily={FONT.mono} fontSize={17} fontWeight={800}
          fill={GREEN}>BROWNSVILLE CITY COMMISSION</text>
        <text x={-205} y={-20} fontFamily={FONT.display} fontSize={42} fontWeight={800}
          fill={INK}>NEXT PROCEEDING</text>
        <text x={-205} y={42} fontFamily={FONT.mono} fontSize={19} fontWeight={800}
          fill={GREEN}>COMMENT REGISTRATION ONLINE</text>
        <text x={-205} y={87} fontFamily={FONT.mono} fontSize={18} fontWeight={800}
          fill={RED}>MORATORIUM NOT ACTIVE</text>
      </g>
    </g>
    <g opacity={button} transform={`translate(0 ${32 * (1 - button)})`}>
      <rect x={54} y={260} width={745} height={540} rx={38} fill="#07141a" opacity={0.94}
        stroke={BRASS} strokeWidth={7} />
      <text x={92} y={375} fontFamily={FONT.mono} fontSize={21} fontWeight={800}
        fill={BRASS}>HEARING PROCESS</text>
      <text x={92} y={460} fontFamily={FONT.display} fontSize={72} fontWeight={800}
        fill={GULF_LIGHT}>MOVING</text>
      <path d="M92,520 H755" stroke={PAPER_DARK} strokeWidth={4} />
      <text x={92} y={590} fontFamily={FONT.mono} fontSize={21} fontWeight={800}
        fill={BRASS}>MORATORIUM</text>
      <text x={92} y={685} fontFamily={FONT.display} fontSize={68} fontWeight={800}
        fill={RED}>NOT IN EFFECT</text>
    </g>
  </svg></AbsoluteFill>;
};

const CaptionTrack: React.FC<{cues: Cue[]}> = ({cues}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const cue = cues.find((c) => t >= c.start && t < c.end);
  if (!cue) return null;
  let size = 34;
  let lines = wrapToWidth(cue.text, SAFE_RIGHT - 120, size, true);
  while (lines.length > 3 && size > 25) {
    size -= 2;
    lines = wrapToWidth(cue.text, SAFE_RIGHT - 120, size, true);
  }
  const lead = size * 1.28;
  const h = 38 + lines.length * lead;
  const edge = Math.min((t - cue.start) * FPS / 5, (cue.end - t) * FPS / 5, 1);
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <g opacity={clamp(edge)}>
      <rect x={42} y={SAFE_BOTTOM - h} width={SAFE_RIGHT - 42} height={h} rx={12}
        fill="#050b10" opacity={0.9} />
      <rect x={42} y={SAFE_BOTTOM - h} width={7} height={h} rx={3.5} fill={BRASS} />
      {lines.map((line, i) => <text key={i} x={74} y={SAFE_BOTTOM - h + 42 + i * lead}
        fontFamily={FONT.body} fontSize={size} fontWeight={700} fill="#f2ede2">{line}</text>)}
    </g>
  </svg></AbsoluteFill>;
};

const Credits: React.FC<{text: string; dur: number}> = ({text, dur}) => {
  const f = useCurrentFrame();
  const p = ease(prog(f, 0, 16));
  const out = 1 - ease(prog(f, dur - 24, dur));
  const lines = text.split('\n').map((s) => s.trim()).filter(Boolean)
    .flatMap((line) => {
      const head = line === line.toUpperCase() && line.length < 30;
      return wrapToWidth(line, 900, head ? 23 : 25, !head)
        .map((value, wrapIndex) => ({value, head, wrapIndex}));
    });
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <Backdrop frame={f} />
    <g opacity={p * out} transform={`translate(0 ${22 * (1 - p)})`}>
      <rect x={70} y={315} width={940} height={9} rx={4} fill={BRASS} />
      <text x={70} y={440} fontFamily={FONT.display} fontSize={92} fontWeight={800}
        fill={PAPER}>TEXAS AI DOCKET</text>
      {lines.map(({value, head, wrapIndex}, i) => {
        return <text key={`${value}-${i}`} x={72 + (wrapIndex ? 24 : 0)} y={600 + i * 56}
          fontFamily={head ? FONT.mono : FONT.body} fontSize={head ? 23 : 28}
          fontWeight={head ? 800 : 550} fill={head ? BRASS : PAPER}
          letterSpacing={head ? 1.8 : 0}>{value}</text>;
      })}
      <text x={72} y={1550} fontFamily={FONT.mono} fontSize={21} fill={GULF_LIGHT}
        letterSpacing={1.5}>RESEARCH · VERIFY · EXPLAIN WHAT MOVED</text>
    </g>
  </svg></AbsoluteFill>;
};

const SCENES = [S1, S2, S3, S4, S5, S6, S7, S8];

export const BrownsvilleMoratoriumEpisode: React.FC<BrownsvilleMoratoriumProps> = ({runtime_s,
  scenes, captions = [], credits = '', credits_s = 5.5}) => {
  const globalF = useCurrentFrame();
  return <AbsoluteFill style={{backgroundColor: INK}}>
    {scenes.slice(0, SCENES.length).map((scene, i) => {
      const Comp = SCENES[i];
      const dur = Math.max(1, Math.round(scene.duration_s * FPS));
      return <Sequence key={scene.id} from={Math.round(scene.start_s * FPS)} durationInFrames={dur}
        name={`${scene.id.toUpperCase()} · ${i + 1}`}>
        <Comp dur={dur} />
      </Sequence>;
    })}
    {captions.length > 0 && <Sequence from={0} durationInFrames={Math.round(runtime_s * FPS)}>
      <CaptionTrack cues={captions} />
    </Sequence>}
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0,
      pointerEvents: 'none'}}>
      {scenes.slice(1).map((s) => {
        const cut = Math.round(s.start_s * FPS);
        const d = Math.abs(globalF - cut);
        return <rect key={s.id} width={W} height={H} fill={PAPER}
          opacity={d < 5 ? (1 - d / 5) * 0.15 : 0} />;
      })}
    </svg>
    {credits.trim() && <Sequence from={Math.round(runtime_s * FPS)}
      durationInFrames={Math.max(1, Math.round(credits_s * FPS))} name="SOURCES + CREDITS">
      <Credits text={credits} dur={Math.round(credits_s * FPS)} />
    </Sequence>}
  </AbsoluteFill>;
};
