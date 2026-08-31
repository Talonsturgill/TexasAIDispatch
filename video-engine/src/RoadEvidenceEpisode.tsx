import React from 'react';
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {FONT, wrapToWidth} from './lib/type';
import {SAFE_BOTTOM, SAFE_RIGHT} from './lib/safearea';

// A BESPOKE EPISODE, NOT ANOTHER CARD TEMPLATE.
//
// The first road-safety cut proved that accurate nouns plus a moving camera can still read as a
// slideshow. Each scene contained one large interface panel, so the picture illustrated a topic
// while the narration described an action. The Alaska reference succeeds for the opposite reason:
// a recurring subject performs the argument, and every sentence visibly changes the state of that
// subject. This episode ports that grammar without porting Alaska's visual identity.
//
// The throughline is one cream crash-report strip. It skids into the road, joins a stream, breaks
// into mechanism labels, crosses into the pavement record, survives the association/causation
// test, reaches a field queue, and finally becomes a painted road mark. A viewer who never hears
// the VO can still follow what happened to the evidence.

const W = 1080;
const H = 1920;
const FPS = 30;
const INK = '#07131c';
const NIGHT = '#0b1722';
const BLUE = '#17384a';
const PAPER = '#f0e5cf';
const PAPER_DARK = '#bfae8d';
const AMBER = '#f2a640';
const TEAL = '#42d3c4';
const RED = '#f06a55';
const SKY = '#8ea7ac';

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => {
  const x = clamp(v);
  return 1 - Math.pow(1 - x, 3);
};
const pop = (v: number) => {
  const x = clamp(v);
  return 1 + Math.sin(x * Math.PI) * 0.11 * (1 - x);
};
const prog = (f: number, a: number, b: number) => clamp((f - a) / Math.max(1, b - a));

type Cue = {id: string; start: number; end: number; text: string};
type TimedScene = {id: string; start_s: number; duration_s: number};

export type RoadEvidenceProps = {
  scenes: TimedScene[];
  captions?: Cue[];
  credits?: string;
  credits_s?: number;
};

const Texture: React.FC<{frame: number; warm?: boolean}> = ({frame, warm = false}) => (
  <>
    <rect width={W} height={H} fill={warm ? '#4b2e1d' : NIGHT} />
    <defs>
      <radialGradient id="roadGlow" cx="50%" cy="28%" r="72%">
        <stop offset="0" stopColor={warm ? '#d27b38' : '#34697b'} stopOpacity="0.52" />
        <stop offset="0.55" stopColor={warm ? '#5c3826' : '#172e3d'} stopOpacity="0.26" />
        <stop offset="1" stopColor={INK} stopOpacity="0" />
      </radialGradient>
      <linearGradient id="wetRoad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#28343b" />
        <stop offset="0.5" stopColor="#10191e" />
        <stop offset="1" stopColor="#3d4b50" />
      </linearGradient>
      <linearGradient id="paperWarm" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff7e7" />
        <stop offset="1" stopColor="#d9c8a7" />
      </linearGradient>
    </defs>
    <rect width={W} height={H} fill="url(#roadGlow)" />
    {Array.from({length: 26}, (_, i) => (
      <circle key={i} cx={(i * 173 + frame * (i % 3 === 0 ? 0.22 : -0.11)) % 1240 - 80}
        cy={90 + (i * 241) % 1540} r={1 + (i % 3)} fill="#e6f1ef"
        opacity={0.05 + (i % 5) * 0.012} />
    ))}
  </>
);

const Rain: React.FC<{frame: number; opacity?: number}> = ({frame, opacity = 0.42}) => (
  <g opacity={opacity}>
    {Array.from({length: 34}, (_, i) => {
      const x = (i * 97 + frame * (4 + (i % 4))) % 1260 - 90;
      const y = (i * 181 + frame * (14 + (i % 5))) % 1740 - 100;
      return <line key={i} x1={x} y1={y} x2={x - 15} y2={y + 56 + (i % 3) * 13}
        stroke="#d5eced" strokeWidth={2 + (i % 2)} strokeLinecap="round" />;
    })}
  </g>
);

const Eyebrow: React.FC<{text: string; frame: number; number?: string}> = ({text, frame, number}) => {
  const p = ease(prog(frame, 4, 18));
  return <g transform={`translate(${68 - 34 * (1 - p)} 0)`} opacity={p}>
    <rect x={68} y={88} width={8} height={42} rx={4} fill={AMBER} />
    <text x={96} y={118} fontFamily={FONT.mono} fontSize={23} fontWeight={700}
      fill="#e9f0ec" letterSpacing={2.2}>{text}</text>
    {number && <text x={SAFE_RIGHT} y={118} textAnchor="end" fontFamily={FONT.mono}
      fontSize={22} fill={AMBER} letterSpacing={1.5}>{number}</text>}
  </g>;
};

const Headline: React.FC<{lines: string[]; frame: number; y?: number; size?: number;
  accent?: string; align?: 'start' | 'middle'}> = ({lines, frame, y = 220, size = 76,
    accent = PAPER, align = 'start'}) => {
  const p = ease(prog(frame, 8, 26));
  const x = align === 'middle' ? W / 2 : 68;
  return <g opacity={p} transform={`translate(0 ${26 * (1 - p)})`}>
    {lines.map((line, i) => <text key={line} x={x} y={y + i * size * 0.92}
      textAnchor={align} fontFamily={FONT.display} fontSize={size} fontWeight={700}
      fill={i === lines.length - 1 ? accent : PAPER} letterSpacing={-1.2}>{line}</text>)}
  </g>;
};

const ReportRibbon: React.FC<{frame: number; x: number; y: number; scale?: number;
  rotate?: number; progress?: number; label?: string; active?: boolean}> = ({frame, x, y,
    scale = 1, rotate = 0, progress = 1, label = 'WET CURVE DETAIL', active = true}) => {
  const p = ease(progress);
  const wave = Math.sin(frame / 7) * (active ? 3 : 0);
  return <g transform={`translate(${x} ${y + wave}) rotate(${rotate}) scale(${scale * pop(p)})`}
    opacity={p}>
    <rect x={-310} y={-72} width={620} height={144} rx={14} fill="url(#paperWarm)"
      stroke={INK} strokeWidth={7} />
    <rect x={-278} y={-43} width={66} height={15} rx={7} fill={AMBER} />
    <text x={-194} y={-27} fontFamily={FONT.mono} fontSize={18} fontWeight={700}
      fill="#634a26">CRASH NARRATIVE</text>
    <text x={-278} y={28} fontFamily={FONT.body}
      fontSize={Math.max(18, 31 - Math.max(0, label.length - 22) * 0.58)} fontWeight={800}
      fill="#17232b">{label}</text>
    <path d="M-278,48 H226" stroke={PAPER_DARK} strokeWidth={7} strokeLinecap="round" />
    <circle cx={268} cy={0} r={15 + 3 * Math.sin(frame / 5)} fill={active ? TEAL : AMBER} />
  </g>;
};

const RoadPerspective: React.FC<{frame: number; split?: number; mark?: number}> = ({frame,
  split = 0, mark = 0}) => {
  const travel = (frame * 12) % 210;
  return <g>
    <path d="M110,1920 L390,770 L690,770 L1040,1920 Z" fill="url(#wetRoad)" stroke={INK}
      strokeWidth={10} />
    {Array.from({length: 8}, (_, i) => {
      const yy = 810 + ((i * 190 + travel) % 1160);
      const k = (yy - 770) / 1150;
      return <rect key={i} x={534 - 13 - k * 16} y={yy} width={26 + k * 32}
        height={70 + k * 62} rx={7} fill="#d6c675" opacity={0.74} />;
    })}
    <path d={`M390,770 L${390 - 100 * split},1500 L${330 - 155 * split},1920`}
      stroke={AMBER} strokeWidth={12} strokeDasharray="22 18" fill="none"
      strokeDashoffset={-frame * 2} opacity={0.74 * split} />
    <path d="M535,810 C510,1040 570,1320 530,1770" fill="none" stroke={PAPER}
      strokeWidth={20 * mark} strokeLinecap="round" opacity={0.9 * mark} />
  </g>;
};

const S1: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const enter = ease(prog(f, 0, 24));
  const scan = ease(prog(f, 28, Math.min(dur - 8, 72)));
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <Texture frame={f} /><Rain frame={f} />
    <g transform={`translate(0 ${55 * (1 - enter)}) scale(${0.94 + 0.06 * enter})`}>
      <RoadPerspective frame={f} split={scan} />
    </g>
    <g transform={`translate(${interpolate(f, [0, dur], [-260, 1220])} 1040)`}>
      <rect x={-140} y={-54} width={280} height={104} rx={24} fill="#b9c2be" stroke={INK}
        strokeWidth={8} />
      <rect x={-94} y={24} width={48} height={32} rx={16} fill={INK} />
      <rect x={54} y={24} width={48} height={32} rx={16} fill={INK} />
      <rect x={18} y={-34} width={84} height={35} rx={7} fill="#294a55" />
      <path d="M-140,36 H140" stroke="#cde4e6" strokeWidth={5} opacity={0.54} />
    </g>
    <ReportRibbon frame={f} x={540} y={735 - 170 * enter} rotate={-5 + 5 * scan}
      scale={0.92 + scan * 0.08} progress={enter} />
    <g opacity={scan}>
      <line x1={135 + scan * 760} y1={485} x2={80 + scan * 760} y2={1245}
        stroke={TEAL} strokeWidth={10} opacity={0.64} />
      <text x={72} y={390} fontFamily={FONT.display} fontSize={82} fontWeight={700}
        fill={PAPER}>A ROAD CLUE</text>
      <text x={72} y={468} fontFamily={FONT.display} fontSize={82} fontWeight={700}
        fill={AMBER}>HID IN A SENTENCE.</text>
    </g>
    <Eyebrow text="TEXAS AI DOCKET · FIELD NOTE" frame={f} number="01" />
  </svg></AbsoluteFill>;
};

const S2: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const build = ease(prog(f, 6, 38));
  const countP = ease(prog(f, 22, Math.min(dur - 20, 130)));
  const count = Math.round(countP * 24000).toLocaleString('en-US');
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <Texture frame={f} />
    <Eyebrow text="UNIVERSITY OF HOUSTON · TXDOT-FUNDED RESEARCH" frame={f} number="02" />
    <Headline lines={[`${count}+`, 'POLICE NARRATIVES']} frame={f} y={270} size={92}
      accent={AMBER} />
    <g transform={`translate(540 ${900 + 22 * Math.sin(f / 18)})`}>
      <rect x={-310} y={-190} width={620} height={410} rx={42} fill="#112431" stroke="#456579"
        strokeWidth={8} />
      <rect x={-254} y={-128} width={508} height={120} rx={16} fill="#07131c" />
      {Array.from({length: 6}, (_, i) => <rect key={i} x={-224 + i * 78} y={-98}
        width={50} height={60} rx={6} fill={i / 6 < countP ? TEAL : '#1d4651'}
        opacity={0.48 + 0.35 * Math.sin(f / 8 + i)} />)}
      <text x={0} y={75} textAnchor="middle" fontFamily={FONT.mono} fontSize={24}
        fill={PAPER}>REPORTS ENTER MODEL</text>
      <rect x={-210} y={116} width={420} height={18} rx={9} fill="#1f3b46" />
      <rect x={-210} y={116} width={420 * countP} height={18} rx={9} fill={AMBER} />
    </g>
    {Array.from({length: 5}, (_, i) => {
      const phase = clamp(prog(f, i * 9, i * 9 + 34));
      const y = 1500 - phase * 650;
      const x = 200 + (i % 3) * 330 + Math.sin(f / 8 + i) * 14;
      return <ReportRibbon key={i} frame={f + i * 13} x={x} y={y} scale={0.36}
        rotate={i % 2 ? 7 : -8} progress={phase * build} label={i === 2 ? 'CURVE LOSS' : 'WET ROAD DETAIL'} />;
    })}
    <g opacity={ease(prog(f, dur - 68, dur - 24))}>
      <path d="M540,1210 C540,1330 775,1350 800,1510" fill="none" stroke={TEAL}
        strokeWidth={8} strokeDasharray="18 14" strokeDashoffset={-f * 2} />
      <circle cx={800} cy={1510} r={42} fill={AMBER} stroke={INK} strokeWidth={8} />
      <path d="M800,1550 V1680 M730,1632 Q800,1588 870,1632" fill="none" stroke={PAPER}
        strokeWidth={22} strokeLinecap="round" />
      <text x={800} y={1748} textAnchor="middle" fontFamily={FONT.mono} fontSize={20}
        fill={PAPER}>ENGINEER IN THE LOOP</text>
    </g>
  </svg></AbsoluteFill>;
};

const S3: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const lock1 = ease(prog(f, 12, 38));
  const lock2 = ease(prog(f, 34, Math.min(68, dur - 5)));
  const payoff = ease(prog(f, Math.round(dur * 0.56), Math.round(dur * 0.78)));
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <Texture frame={f} /><Rain frame={f} opacity={0.18} />
    <Eyebrow text="THE PARSE · WORDS BECOME MECHANISMS" frame={f} number="03" />
    <ReportRibbon frame={f} x={540} y={520} scale={1.28} progress={ease(prog(f, 0, 16))}
      label="VEHICLE LOST CONTROL ON WET CURVE" />
    <g opacity={lock1 * (1 - 0.88 * payoff)} transform={`translate(0 ${26 * (1 - lock1)})`}>
      <rect x={90} y={815} width={900} height={170} rx={28} fill="#102936" stroke={TEAL}
        strokeWidth={7} />
      <text x={540} y={895} textAnchor="middle" fontFamily={FONT.display} fontSize={66}
        fontWeight={700} fill={PAPER}>HYDROPLANING</text>
      <text x={540} y={950} textAnchor="middle" fontFamily={FONT.mono} fontSize={22}
        fill={TEAL}>MECHANISM LABEL 01 · LOCKED</text>
    </g>
    <g opacity={lock2 * (1 - 0.88 * payoff)} transform={`translate(0 ${26 * (1 - lock2)})`}>
      <rect x={90} y={1025} width={900} height={170} rx={28} fill="#2c2318" stroke={AMBER}
        strokeWidth={7} />
      <text x={540} y={1105} textAnchor="middle" fontFamily={FONT.display} fontSize={62}
        fontWeight={700} fill={PAPER}>CURVE-RELATED LOSS</text>
      <text x={540} y={1160} textAnchor="middle" fontFamily={FONT.mono} fontSize={22}
        fill={AMBER}>MECHANISM LABEL 02 · LOCKED</text>
    </g>
    <g opacity={lock2 * (1 - payoff)}>
      <path d="M540,665 V795 M540,985 V1015" stroke={PAPER} strokeWidth={8}
        strokeDasharray="16 12" strokeDashoffset={-f * 2} />
      <circle cx={540} cy={790} r={13 + 4 * Math.sin(f / 4)} fill={TEAL} />
    </g>
    <g opacity={payoff} transform={`translate(0 ${28 * (1 - payoff)})`}>
      <rect x={76} y={790} width={928} height={300} rx={34} fill="#07131c" opacity={0.94}
        stroke={AMBER} strokeWidth={6} />
      <text x={540} y={910} textAnchor="middle" fontFamily={FONT.display} fontSize={76}
        fontWeight={700} fill={PAPER}>THE TABLE NEVER</text>
      <text x={540} y={1000} textAnchor="middle" fontFamily={FONT.display} fontSize={76}
        fontWeight={700} fill={AMBER}>HAD THESE FIELDS.</text>
    </g>
  </svg></AbsoluteFill>;
};

const S4: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const join = ease(prog(f, 18, Math.min(84, dur * 0.72)));
  const cells = Math.floor(join * 180000).toLocaleString('en-US');
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <Texture frame={f} />
    <Eyebrow text="THE JOIN · NARRATIVE MEETS PAVEMENT" frame={f} number="04" />
    <g transform={`translate(${120 + join * 300} 565) scale(${0.82 - join * 0.2})`}>
      <ReportRibbon frame={f} x={0} y={0} scale={1} progress={1} label="HYDROPLANING · CURVE LOSS" />
    </g>
    <g transform={`translate(${900 - join * 300} 565)`}>
      <rect x={-240} y={-112} width={480} height={224} rx={24} fill="#122c38" stroke={TEAL}
        strokeWidth={7} />
      <text x={0} y={-38} textAnchor="middle" fontFamily={FONT.mono} fontSize={22}
        fill={TEAL}>PAVEMENT RECORDS</text>
      <text x={0} y={50} textAnchor="middle" fontFamily={FONT.display} fontSize={66}
        fontWeight={700} fill={PAPER}>{cells}</text>
    </g>
    <g opacity={join}>
      <circle cx={540} cy={565} r={34 + 12 * Math.sin(f / 5)} fill={AMBER} stroke={INK}
        strokeWidth={8} />
      <path d="M540,615 V785" stroke={AMBER} strokeWidth={10} />
    </g>
    <g transform="translate(90 810)">
      {Array.from({length: 48}, (_, i) => {
        const on = i / 48 < join;
        const row = Math.floor(i / 8), col = i % 8;
        return <g key={i} transform={`translate(${col * 114} ${row * 90})`}>
          <rect width={94} height={68} rx={12} fill={on ? '#214f51' : '#142832'}
            stroke={on ? TEAL : '#30505e'} strokeWidth={3} />
          <path d="M12,50 L36,20 L54,45 L82,15" fill="none" stroke={on ? AMBER : '#50636b'}
            strokeWidth={5} />
        </g>;
      })}
    </g>
    <g opacity={ease(prog(f, dur - 58, dur - 18))}>
      <rect x={130} y={1240} width={820} height={122} rx={61} fill="#163c38" stroke={TEAL}
        strokeWidth={7} />
      <text x={540} y={1317} textAnchor="middle" fontFamily={FONT.display} fontSize={48}
        fontWeight={700} fill={PAPER}>ONE LINKED ROAD RECORD</text>
    </g>
  </svg></AbsoluteFill>;
};

const S5: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const converge = ease(prog(f, 10, Math.min(70, dur - 18)));
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <Texture frame={f} /><Rain frame={f} opacity={0.55} />
    <Eyebrow text="THE PATTERN · WET CRASHES MEET ROAD TEXTURE" frame={f} number="05" />
    <Headline lines={['FRICTION.', 'TEXTURE.', 'WET CRASHES.']} frame={f} y={300} size={78}
      accent={AMBER} />
    <g transform="translate(0 860)">
      <path d="M0,0 H1080 V670 H0 Z" fill="#29353a" />
      <path d="M0,130 C180,70 330,200 540,120 S880,55 1080,150 V340 H0 Z"
        fill="#1c292d" stroke="#66757a" strokeWidth={6} />
      <path d="M0,350 C220,270 360,460 560,350 S900,260 1080,410 V670 H0 Z"
        fill="#765f49" stroke="#9b8265" strokeWidth={6} />
      {Array.from({length: 36}, (_, i) => <circle key={i} cx={(i * 83) % 1080}
        cy={92 + ((i * 131) % 460)} r={5 + (i % 4)} fill={i % 2 ? '#9ca6a3' : '#6f5d4c'}
        opacity={0.48} />)}
    </g>
    <path d={`M140,725 C260,780 ${390 + converge * 80},915 540,1020`}
      fill="none" stroke={AMBER} strokeWidth={15} strokeDasharray="22 15"
      strokeDashoffset={-f * 3} />
    <path d={`M940,725 C810,780 ${700 - converge * 80},915 540,1020`}
      fill="none" stroke={TEAL} strokeWidth={15} strokeDasharray="22 15"
      strokeDashoffset={f * 3} />
    <circle cx={540} cy={1020} r={38 + 18 * Math.sin(f / 6)} fill={PAPER} stroke={INK}
      strokeWidth={9} opacity={converge} />
    <g opacity={ease(prog(f, 50, Math.min(92, dur - 4)))}>
      <rect x={145} y={1080} width={790} height={150} rx={28} fill="#123936" stroke={TEAL}
        strokeWidth={8} />
      <text x={540} y={1152} textAnchor="middle" fontFamily={FONT.display} fontSize={56}
        fontWeight={700} fill={PAPER}>STRONG ASSOCIATION</text>
      <text x={540} y={1200} textAnchor="middle" fontFamily={FONT.mono} fontSize={20}
        fill={TEAL}>THE TWO RECORDS MOVE TOGETHER</text>
    </g>
  </svg></AbsoluteFill>;
};

const S6: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const attempt = ease(prog(f, 6, 46));
  const snap = ease(prog(f, 46, Math.min(76, dur - 4)));
  const shake = snap < 1 ? Math.sin(f * 2.4) * 12 * snap : 0;
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <Texture frame={f} />
    <Eyebrow text="THE LIMIT · THE HONEST TURN" frame={f} number="06" />
    <g transform={`translate(${shake} 0)`}>
      <rect x={100} y={440} width={340} height={220} rx={34} fill="#322718" stroke={AMBER}
        strokeWidth={8} />
      <text x={270} y={540} textAnchor="middle" fontFamily={FONT.display} fontSize={48}
        fontWeight={700} fill={PAPER}>CONDITIONS</text>
      <circle cx={270} cy={600} r={18} fill={AMBER} />
      <rect x={640} y={440} width={340} height={220} rx={34} fill="#123734" stroke={TEAL}
        strokeWidth={8} />
      <text x={810} y={540} textAnchor="middle" fontFamily={FONT.display} fontSize={48}
        fontWeight={700} fill={PAPER}>HIGHER RISK</text>
      <circle cx={810} cy={600} r={18} fill={TEAL} />
    </g>
    <path d="M270,620 C350,850 730,850 810,620" fill="none" stroke={TEAL}
      strokeWidth={12} strokeDasharray={`${680 * attempt} 680`} strokeLinecap="round" />
    <g opacity={attempt}>
      <rect x={320} y={795} width={440} height={88} rx={44} fill="#164a43" />
      <text x={540} y={850} textAnchor="middle" fontFamily={FONT.mono} fontSize={24}
        fontWeight={700} fill={TEAL}>LINKED IN THE RECORD</text>
    </g>
    <g opacity={snap} transform={`translate(0 ${32 * (1 - snap)})`}>
      <path d="M160,930 H465 M615,930 H900" stroke={RED} strokeWidth={18}
        strokeLinecap="round" />
      <path d="M875,893 L930,930 L875,967" fill="none" stroke={RED} strokeWidth={18}
        strokeLinejoin="round" />
      <path d="M490,875 L590,985 M590,875 L490,985" stroke={PAPER} strokeWidth={18}
        strokeLinecap="round" />
      <text x={540} y={1110} textAnchor="middle" fontFamily={FONT.display} fontSize={100}
        fontWeight={700} fill={PAPER}>LINKED ≠ CAUSED</text>
      <text x={540} y={1190} textAnchor="middle" fontFamily={FONT.mono} fontSize={24}
        fill={AMBER}>THE MODEL FLAGS A PATTERN. IT DOES NOT PROVE THE REASON.</text>
    </g>
  </svg></AbsoluteFill>;
};

const S7: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const active = Math.min(3, Math.floor(Math.max(0, f - 8) / 20) + 1);
  const handoff = ease(prog(f, 42, Math.min(84, dur - 3)));
  const roads = [
    'M110,630 C270,500 390,690 520,560 S780,430 940,600',
    'M120,930 C300,760 480,970 650,820 S850,760 960,890',
    'M290,410 C340,680 240,900 390,1210',
    'M760,400 C650,650 820,900 690,1210',
  ];
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <Texture frame={f} warm />
    <Eyebrow text="THE HANDOFF · FROM MODEL TO FIELD CREW" frame={f} number="07" />
    <Headline lines={['CANDIDATE', 'ROAD SEGMENTS']} frame={f} y={280} size={86} accent={AMBER} />
    <g opacity={1 - 0.78 * handoff}>
      {roads.map((d, i) => <path key={i} d={d} fill="none" stroke="#b5aaa0"
        strokeWidth={i < 2 ? 24 : 14} strokeLinecap="round" opacity={0.42} />)}
      {[[245, 590], [600, 825], [770, 535]].map(([x, y], i) => <g key={i}
        opacity={i < active ? 1 : 0.16}>
        <circle cx={x} cy={y} r={46 + 8 * Math.sin(f / 5 + i)} fill={AMBER} opacity={0.22} />
        <circle cx={x} cy={y} r={15} fill={AMBER} />
        <text x={x + 28} y={y - 20} fontFamily={FONT.mono} fontSize={18} fill={PAPER}
          fontWeight={700}>SEGMENT {String.fromCharCode(65 + i)}</text>
      </g>)}
    </g>
    <g transform={`translate(${700 - 250 * handoff} ${1120 - 180 * handoff}) scale(${0.7 + 0.36 * handoff})`}>
      <circle cx={0} cy={0} r={88} fill="#bd7b45" stroke={INK} strokeWidth={10} />
      <path d="M-98,10 Q0,-120 98,10" fill="#e4b149" stroke={INK} strokeWidth={10} />
      <path d="M-70,90 Q0,140 70,90 V270 H-70 Z" fill="#2d6b79" stroke={INK}
        strokeWidth={10} />
      <path d="M-38,25 H38" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
      <circle cx={-30} cy={-5} r={8} fill={INK} /><circle cx={30} cy={-5} r={8} fill={INK} />
      <g transform={`translate(${75 + 70 * handoff} 120) rotate(${-12 + 25 * handoff})`}>
        <rect x={0} y={0} width={270} height={180} rx={16} fill={PAPER} stroke={INK}
          strokeWidth={9} />
        <text x={28} y={46} fontFamily={FONT.mono} fontSize={17} fontWeight={700}
          fill="#4e3a22">FIELD QUEUE</text>
        {[0, 1, 2].map((i) => <g key={i} transform={`translate(28 ${72 + i * 33})`}>
          <circle r={7} fill={i < active ? TEAL : PAPER_DARK} />
          <rect x={18} y={-5} width={160 - i * 20} height={10} rx={5}
            fill={i < active ? '#336d68' : PAPER_DARK} />
        </g>)}
      </g>
    </g>
    <g opacity={handoff} transform={`translate(0 ${24 * (1 - handoff)})`}>
      <rect x={84} y={430} width={912} height={184} rx={28} fill="#07131c" opacity={0.93}
        stroke={TEAL} strokeWidth={6} />
      <text x={540} y={505} textAnchor="middle" fontFamily={FONT.display} fontSize={47}
        fontWeight={700} fill={PAPER}>THE MODEL MAKES A SHORTLIST.</text>
      <text x={540} y={572} textAnchor="middle" fontFamily={FONT.display} fontSize={47}
        fontWeight={700} fill={AMBER}>PEOPLE DECIDE WHAT TO CHECK.</text>
    </g>
  </svg></AbsoluteFill>;
};

const S8: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const land = ease(prog(f, 0, Math.min(72, dur * 0.35)));
  const button = ease(prog(f, Math.max(80, dur * 0.45), Math.max(115, dur - 32)));
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <Texture frame={f} warm /><Rain frame={f} opacity={0.16} />
    <g transform={`translate(0 ${45 * (1 - land)}) scale(${0.95 + 0.05 * land})`}>
      <RoadPerspective frame={f} mark={button} />
    </g>
    <g opacity={1 - 0.75 * button} transform={`translate(${770 - 120 * land} ${970 + 70 * land})`}>
      <circle cx={0} cy={0} r={66} fill="#bd7b45" stroke={INK} strokeWidth={9} />
      <path d="M-76,4 Q0,-88 76,4" fill="#e4b149" stroke={INK} strokeWidth={9} />
      <path d="M-54,65 Q0,105 54,65 V248 H-54 Z" fill="#2d6b79" stroke={INK}
        strokeWidth={9} />
      <path d="M-34,22 H34" fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
      <path d="M-45,220 Q-125,265 -170,350" fill="none" stroke="#2d6b79"
        strokeWidth={28} strokeLinecap="round" />
      <circle cx={-176} cy={356} r={28} fill="#bd7b45" stroke={INK} strokeWidth={8} />
    </g>
    <ReportRibbon frame={f} x={340} y={1190 + 290 * land} scale={0.55 - 0.15 * button}
      rotate={-12 + 12 * button} progress={1 - 0.7 * button} label="WET CURVE DETAIL" />
    <Eyebrow text="THE DECISION · MACHINE FINDS, ENGINEER CHOOSES" frame={f} number="08" />
    <g opacity={button} transform={`translate(0 ${32 * (1 - button)})`}>
      <rect x={64} y={260} width={952} height={425} rx={38} fill="#09151e" opacity={0.9}
        stroke={AMBER} strokeWidth={6} />
      <text x={100} y={370} fontFamily={FONT.display} fontSize={76} fontWeight={700}
        fill={PAPER}>THE MODEL FOUND</text>
      <text x={100} y={454} fontFamily={FONT.display} fontSize={76} fontWeight={700}
        fill={AMBER}>THE ROAD CLUE.</text>
      <text x={100} y={565} fontFamily={FONT.display} fontSize={62} fontWeight={700}
        fill={PAPER}>ENGINEERS STILL</text>
      <text x={100} y={638} fontFamily={FONT.display} fontSize={62} fontWeight={700}
        fill={TEAL}>CHOOSE THE FIX.</text>
    </g>
    <g opacity={ease(prog(f, dur - 58, dur - 20))}>
      <text x={68} y={1330} fontFamily={FONT.mono} fontSize={22} fill={PAPER}
        letterSpacing={2}>THE SENTENCE THE TABLE DROPPED</text>
      <path d="M68,1365 H470" stroke={AMBER} strokeWidth={7} />
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
        fill="#050b10" opacity={0.89} />
      <rect x={42} y={SAFE_BOTTOM - h} width={7} height={h} rx={3.5} fill={AMBER} />
      {lines.map((line, i) => <text key={i} x={74} y={SAFE_BOTTOM - h + 42 + i * lead}
        fontFamily={FONT.body} fontSize={size} fontWeight={700} fill="#f2ede2">{line}</text>)}
    </g>
  </svg></AbsoluteFill>;
};

const Credits: React.FC<{text: string; dur: number}> = ({text, dur}) => {
  const f = useCurrentFrame();
  const p = ease(prog(f, 0, 16));
  const out = 1 - ease(prog(f, dur - 24, dur));
  const all = text.split('\n').map((s) => s.trim()).filter(Boolean);
  const site = all.find((s) => s.toUpperCase().includes('TEXASAIDOCKET.COM'))
    ?? 'TEXASAIDOCKET.COM';
  const body = all.filter((s) => s !== site && s.toUpperCase() !== 'SITE').flatMap((s) => {
    if (!s.startsWith('"Texas Signal Bed"')) return [s];
    return [
      '"TEXAS SIGNAL BED" BY TEXAS AI DOCKET',
      'PROJECT ORIGINAL · SYNTHESISED IN THIS REPOSITORY',
      'SOURCE · GITHUB.COM/TALONSTURGILL/TEXASAIDISPATCH',
    ];
  });
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <rect width={W} height={H} fill="#07131c" />
    <circle cx={220 + f * 1.2} cy={570} r={440} fill="#22475a" opacity={0.22} />
    <circle cx={950 - f * 0.8} cy={1260} r={390} fill="#855026" opacity={0.18} />
    <g opacity={p * out} transform={`translate(0 ${22 * (1 - p)})`}>
      <rect x={70} y={315} width={940} height={9} rx={4} fill={AMBER} />
      <text x={70} y={440} fontFamily={FONT.display} fontSize={92} fontWeight={700}
        fill={PAPER}>TEXAS AI DOCKET</text>
      <text x={72} y={500} fontFamily={FONT.mono} fontSize={28} fill={TEAL}
        letterSpacing={2}>{site}</text>
      {body.map((line, i) => {
        const head = line === line.toUpperCase() && line.length < 28;
        return <text key={i} x={72} y={720 + i * 64} fontFamily={head ? FONT.mono : FONT.body}
          fontSize={head ? 24 : 29} fontWeight={head ? 700 : 500}
          fill={head ? AMBER : PAPER} letterSpacing={head ? 2 : 0}>{line}</text>;
      })}
      <text x={72} y={1550} fontFamily={FONT.mono} fontSize={21} fill="#8fa4aa"
        letterSpacing={1.5}>RESEARCH · VERIFY · EXPLAIN WHAT MOVED</text>
    </g>
  </svg></AbsoluteFill>;
};

const SCENES = [S1, S2, S3, S4, S5, S6, S7, S8];

export const RoadEvidenceEpisode: React.FC<RoadEvidenceProps> = ({scenes, captions = [],
  credits = '', credits_s = 5.5}) => {
  const storyEnd = scenes.reduce((m, s) => Math.max(m, s.start_s + s.duration_s), 0);
  const globalF = useCurrentFrame();
  return <AbsoluteFill style={{backgroundColor: NIGHT}}>
    {scenes.slice(0, SCENES.length).map((scene, i) => {
      const Comp = SCENES[i];
      const dur = Math.max(1, Math.round(scene.duration_s * FPS));
      return <Sequence key={scene.id} from={Math.round(scene.start_s * FPS)} durationInFrames={dur}
        name={`${scene.id.toUpperCase()} · ${i + 1}`}>
        <Comp dur={dur} />
      </Sequence>;
    })}
    {captions.length > 0 && <Sequence from={0} durationInFrames={Math.round(storyEnd * FPS)}>
      <CaptionTrack cues={captions} />
    </Sequence>}
    {/* A fast exposure sweep makes the hard cuts feel intentional without hiding the carried
        ribbon. It is global, so it cannot become eight unrelated transition presets. */}
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0,
      pointerEvents: 'none'}}>
      {scenes.slice(1).map((s) => {
        const cut = Math.round(s.start_s * FPS);
        const d = Math.abs(globalF - cut);
        const op = d < 5 ? (1 - d / 5) * 0.16 : 0;
        return <rect key={s.id} width={W} height={H} fill={PAPER} opacity={op} />;
      })}
    </svg>
    {credits.trim() && <Sequence from={Math.round(storyEnd * FPS)}
      durationInFrames={Math.max(1, Math.round(credits_s * FPS))} name="SOURCES + SIGN-OFF">
      <Credits text={credits} dur={Math.round(credits_s * FPS)} />
    </Sequence>}
  </AbsoluteFill>;
};
