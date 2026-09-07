import React from 'react';
import {Easing, interpolate} from 'remotion';
import {FONT} from './type';

// A scene-specific visual vocabulary for the Progreso film. These are not generic
// surveillance icons: the geometry comes from the agency photographs of the test —
// weathered timber pergola, strip lights, black rail, freestanding camera columns,
// and the ordinary pedestrian route splitting around a planted bed.

type P = {
  x?: number;
  y?: number;
  scale?: number;
  frame?: number;
  progress?: number;
  mode?: string;
  label?: string;
  night?: boolean;
  active?: boolean;
  carry?: string;
  items?: string[];
  rows?: string[];
  date?: string;
  status?: string;
  place?: string;
  next?: string;
  capture?: string;
  optout?: string;
  stage?: string;
  selected?: boolean;
  actor?: string;
};

const C = {
  ink: '#07141d', deep: '#0a2130', night: '#06111c', paper: '#f4eddf',
  concrete: '#c8c0b2', wood: '#88755d', woodLight: '#c4b398', rail: '#18242a',
  amber: '#f1a33a', copper: '#c86f3d', cyan: '#52ced0', teal: '#1a7f88',
  blue: '#2d79ba', violet: '#7b5aa6', muted: '#9ba8a7', red: '#dd6658',
};

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const phase = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {
  extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.2, 0.8, 0.2, 1),
});

const Label: React.FC<{x: number; y: number; text: string; fill?: string; size?: number;
  anchor?: 'start' | 'middle' | 'end'}> = ({x, y, text, fill = C.paper, size = 28,
  anchor = 'start'}) => (
    <text x={x} y={y} fill={fill} fontFamily={FONT.body} fontSize={size}
      fontWeight={700} letterSpacing={size > 24 ? 2.2 : 1} textAnchor={anchor}>{text}</text>
  );

const WalkerGlyph: React.FC<{x: number; y: number; s?: number; step?: number; umbrella?: boolean;
  glasses?: boolean; hat?: boolean; opacity?: number}> = ({x, y, s = 1, step = 0,
  umbrella = false, glasses = false, hat = false, opacity = 1}) => {
  const swing = Math.sin(step) * 16;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
      <ellipse cx={0} cy={8} rx={72} ry={19} fill="#061019" opacity={0.28} />
      <path d="M-34,-190 Q0,-220 34,-190 L29,-72 Q8,-48 -27,-68 Z" fill="#405a62" />
      <circle cx={0} cy={-244} r={39} fill="#a87554" />
      <path d="M-32,-263 Q-2,-305 34,-264 L30,-246 Q-4,-264 -34,-245 Z" fill="#17262d" />
      {hat && <><path d="M-62,-278 Q0,-309 62,-278 Q0,-260 -62,-278Z" fill="#d8c394" />
        <rect x={-25} y={-310} width={50} height={37} rx={12} fill="#d8c394" /></>}
      {glasses && <><rect x={-34} y={-254} width={28} height={16} rx={6} fill="#101b22" />
        <rect x={6} y={-254} width={28} height={16} rx={6} fill="#101b22" />
        <line x1={-6} y1={-247} x2={6} y2={-247} stroke="#101b22" strokeWidth={5} /></>}
      <line x1={-19} y1={-70} x2={-30 + swing} y2={0} stroke="#273d46" strokeWidth={22}
        strokeLinecap="round" />
      <line x1={19} y1={-70} x2={30 - swing} y2={0} stroke="#273d46" strokeWidth={22}
        strokeLinecap="round" />
      <line x1={-30} y1={-175} x2={-61 - swing * 0.45} y2={-91} stroke="#a87554"
        strokeWidth={18} strokeLinecap="round" />
      <line x1={30} y1={-175} x2={58 + swing * 0.45} y2={-90} stroke="#a87554"
        strokeWidth={18} strokeLinecap="round" />
      <path d="M35,-174 L92,-156 L82,-60 L34,-77 Z" fill="#df9a35" />
      {umbrella && <g transform="translate(-8 -304)">
        <path d="M-126,0 Q0,-104 126,0 Q84,-24 43,0 Q0,-25 -43,0 Q-84,-24 -126,0Z"
          fill="#347eb2" />
        <line x1={0} y1={-10} x2={0} y2={126} stroke="#283c46" strokeWidth={8} />
        <path d="M0,126 q0,30 25,30" fill="none" stroke="#283c46" strokeWidth={8} />
      </g>}
    </g>
  );
};

export const PergolaWalkway: React.FC<P> = ({x = 0, y = 0, scale = 1, frame = 0,
  night = false, mode = 'approach'}) => {
  // The wireframe shot begins in the same bleached afternoon as the prior scene and
  // visibly crosses into the after-dark test. Treating `night: true` as a static fill
  // made the board promise a lighting change the pixels never performed.
  const dayNight = mode === 'wireframe';
  const dark = !dayNight && (night || mode === 'dim' || mode === 'exit');
  const nightMix = dayNight ? phase(frame, 54, 104) : dark ? 1 : 0;
  const glow = 0.45 + 0.2 * Math.sin(frame / 9);
  const wire = mode === 'wireframe';
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x={-260} y={-220} width={1600} height={2380} fill={dark ? C.night : '#a9c6c4'} />
      <rect x={-260} y={565} width={1600} height={1595} fill={dark ? '#17282b' : '#7c8e73'} />
      <path d="M390,1920 L505,570 L575,570 L760,1920 Z" fill={dark ? '#56636a' : C.concrete} />
      <path d="M760,1920 L575,570 L820,620 L1340,1920 Z" fill={dark ? '#1b312b' : '#7e5b42'} />
      <path d="M-260,1920 L390,1920 L505,570 L300,620 Z" fill={dark ? '#10252a' : '#3d6b61'} />
      {dayNight && <>
        <rect x={-260} y={-220} width={1600} height={2380} fill={C.night}
          opacity={nightMix * 0.78} />
        <path d="M390,1920 L505,570 L575,570 L760,1920 Z" fill="#56636a"
          opacity={nightMix * 0.78} />
      </>}
      <path d="M410,1880 L522,590" stroke={C.rail} strokeWidth={18} />
      {Array.from({length: 8}, (_, i) => {
        const t = i / 7;
        const yy = 620 + t * t * 1210;
        const left = 502 - t * 160;
        const right = 576 + t * 242;
        const sw = 10 + t * 14;
        return <g key={i}>
          <line x1={left} y1={yy} x2={left - 8} y2={yy + 260 * (0.3 + t)}
            stroke={C.wood} strokeWidth={sw} />
          <line x1={right} y1={yy} x2={right + 10} y2={yy + 260 * (0.3 + t)}
            stroke={C.wood} strokeWidth={sw} />
          <line x1={left - 5} y1={yy} x2={right + 5} y2={yy}
            stroke={wire ? C.cyan : C.woodLight} strokeWidth={sw * 0.74} />
          {(dark || dayNight) && <line x1={left + 5} y1={yy + sw} x2={right - 5} y2={yy + sw}
            stroke="#e8f3df" strokeWidth={Math.max(3, sw * 0.18)}
            opacity={glow * (dark ? 1 : nightMix)} />}
        </g>;
      })}
      {Array.from({length: 9}, (_, i) => {
        const yy = 790 + i * 132;
        const lx = 462 - i * 17;
        return <line key={i} x1={lx} y1={yy} x2={lx - 82} y2={yy + 15}
          stroke={C.rail} strokeWidth={7} opacity={0.75} />;
      })}
      {wire && <g fill="none" stroke={C.cyan} strokeWidth={3} opacity={0.72}>
        <path d="M340,1880 L500,570 L580,570 L820,1880 Z" />
        {Array.from({length: 10}, (_, i) => <line key={i} x1={350 + i * 46} y1={1880}
          x2={508 + i * 8} y2={570} />)}
      </g>}
      <g opacity={dark ? 0.7 : 0.9}>
        <circle cx={1030} cy={760} r={96} fill="#315f49" />
        <circle cx={1160} cy={800} r={128} fill="#254c3c" />
        <circle cx={115} cy={730} r={92} fill="#3a7764" />
      </g>
    </g>
  );
};

export const CameraArray: React.FC<P> = ({x = 0, y = 0, scale = 1, frame = 0,
  mode = 'kiosk', active = true}) => {
  const wake = phase(frame, 5, 28);
  const xs = mode === 'heights' ? [205, 490, 805] : [220, 825];
  const heads = mode === 'heights' ? [955, 800, 640] : [750, 690];
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={mode === 'rest' ? 0.55 : 1}>
      {xs.map((cx, i) => <g key={i} transform={`translate(${cx} 0)`}>
        <ellipse cx={0} cy={1460} rx={94} ry={22} fill="#050b10" opacity={0.28} />
        <rect x={-58} y={heads[i]} width={116} height={500 - i * 45} rx={16}
          fill="#dddcd6" stroke="#26343a" strokeWidth={8} />
        {[0, 1].map((j) => {
          const cy = heads[i] + 92 + j * (mode === 'heights' ? 146 : 184);
          return <g key={j}>
            <path d={`M-70,${cy - 40} h104 q38,0 38,36 v24 h-142Z`} fill="#f4f2eb"
              stroke="#26343a" strokeWidth={7} />
            <circle cx={18} cy={cy} r={20} fill="#06131c" />
            <circle cx={12} cy={cy - 6} r={6} fill={active ? C.cyan : '#506169'}
              opacity={active ? 0.45 + wake * 0.55 : 0.4} />
            {active && <circle cx={18} cy={cy} r={28 + 18 * Math.sin((frame + i * 8) / 7)}
              fill="none" stroke={C.amber} strokeWidth={4} opacity={0.35 * wake} />}
          </g>;
        })}
        <rect x={-12} y={heads[i] + 390 - i * 34} width={24} height={9} rx={4}
          fill={active ? C.cyan : '#58656b'} />
      </g>)}
      {mode === 'heights' && <g>
        <path d="M205,930 C370,850 640,760 805,630" fill="none" stroke={C.amber}
          strokeWidth={7} strokeDasharray="15 14" opacity={wake} />
        <Label x={540} y={535} text="DIFFERENT HEIGHTS" fill={C.amber} size={24} anchor="middle" />
      </g>}
    </g>
  );
};

export const TravelerFlow: React.FC<P> = ({x = 0, y = 0, scale = 1, frame = 0,
  progress, mode = 'walk', label}) => {
  const p = progress === undefined ? phase(frame, 0, 130) : clamp(progress);
  const branch = mode === 'branch';
  const exit = mode === 'exit';
  // The official photograph's opt-out path peels right. The original branch moved
  // left while the aperture moved right, reversing the choice in the silent cut.
  const px = branch ? 520 + 300 * p : exit ? 550 + 65 * p : 560 + Math.sin(frame / 17) * 14;
  const py = exit ? 1320 - 610 * p : 1490 - 390 * p;
  const s = exit ? 0.95 - 0.48 * p : 0.92 - 0.18 * p;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {mode === 'trail' && <path d="M540,1580 C515,1320 605,1110 548,730" fill="none"
        stroke={C.cyan} strokeWidth={28} opacity={0.28} strokeLinecap="round"
        strokeDasharray="12 22" strokeDashoffset={-frame * 4} />}
      <WalkerGlyph x={px} y={py} s={s} step={frame / 5} opacity={mode === 'behind' ? 0.55 : 1} />
      {label && <g opacity={phase(frame, 8, 26)}>
        <rect x={390} y={1510} width={300} height={62} rx={31} fill={C.ink} opacity={0.84} />
        <Label x={540} y={1551} text={label} fill={C.amber} size={20} anchor="middle" />
      </g>}
    </g>
  );
};

export const CaptureFrame: React.FC<P> = ({x = 0, y = 0, scale = 1, frame = 0,
  progress, mode = 'lock', label = 'IMAGE CAPTURE'}) => {
  const p = progress === undefined ? phase(frame, 8, 48) : clamp((progress - 0.06) / 0.36);
  const pulse = 0.72 + 0.28 * Math.sin(frame / 7);
  if (mode === 'iris') {
    const r = 330 + 85 * p;
    return <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {Array.from({length: 12}, (_, i) => <path key={i}
        d={`M540,1000 L${540 + Math.cos(i * Math.PI / 6) * r},${1000 + Math.sin(i * Math.PI / 6) * r}
          A${r},${r} 0 0 1 ${540 + Math.cos((i + 1) * Math.PI / 6) * r},${1000 + Math.sin((i + 1) * Math.PI / 6) * r} Z`}
        fill={i % 2 ? '#0f2e3b' : '#163d49'} opacity={0.62 * (1 - p * 0.45)} />)}
      <circle cx={540} cy={1000} r={r * 0.64} fill="none" stroke={C.amber} strokeWidth={9}
        opacity={pulse} />
      <Label x={540} y={510} text={label} fill={C.amber} size={24} anchor="middle" />
    </g>;
  }
  const tile = mode === 'tile';
  const source = mode === 'source';
  const travel = progress === undefined ? phase(frame, 0, 130) : clamp(progress);
  const cx = tile ? 255 + 385 * p : mode === 'overshoot' ? 500 - 60 * p :
    source ? 210 : 550;
  // The lock follows the same walker equation as TravelerFlow, so the hook's
  // authored 1.6-second payoff is a face lock rather than a rectangle in the rafters.
  const walkerFaceY = 1266 - 346 * travel;
  const cy = tile ? 930 : source ? 1018 : mode === 'lock' ? walkerFaceY :
    mode === 'reacquire' ? 1190 - 32 * p : 890 - 90 * p;
  const w = tile ? 260 : source ? 164 : 265 - 55 * p;
  const h = tile ? 320 : source ? 216 : 330 - 70 * p;
  const k = 46;
  return <g transform={`translate(${x} ${y}) scale(${scale})`}
    opacity={mode === 'trace' ? 0.42 : source ? 1 - phase(frame, 10, 60) : 1}>
    <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={22}
      fill={tile ? '#102f3b' : 'none'} stroke={C.amber} strokeWidth={6}
      strokeDasharray={mode === 'reacquire' ? '26 18' : undefined} opacity={pulse} />
    {[[cx - w / 2, cy - h / 2, 1, 1], [cx + w / 2, cy - h / 2, -1, 1],
      [cx - w / 2, cy + h / 2, 1, -1], [cx + w / 2, cy + h / 2, -1, -1]].map((a, i) =>
      <path key={i} d={`M${a[0]},${a[1] + Number(a[3]) * k} L${a[0]},${a[1]} L${a[0] + Number(a[2]) * k},${a[1]}`}
        fill="none" stroke={C.paper} strokeWidth={12} strokeLinecap="square" />)}
    {tile && <><circle cx={cx} cy={cy - 42} r={62} fill="#a87554" />
      <path d={`M${cx - 92},${cy + 118} Q${cx},${cy + 18} ${cx + 92},${cy + 118}Z`} fill="#536c73" /></>}
    {label && <><rect x={cx - 132} y={cy + h / 2 + 22} width={264} height={40} rx={20}
      fill={C.ink} opacity={0.86} />
      <Label x={cx} y={cy + h / 2 + 50} text={label} fill={C.amber} size={18}
        anchor="middle" /></>}
  </g>;
};

export const SourceReveal: React.FC<P> = ({x = 0, y = 0, scale = 1, frame = 0,
  date = 'SEPTEMBER 1 · 2026', status = 'OPERATIONAL ASSESSMENT', place = 'PROGRESO'}) => {
  const p = phase(frame, 4, 34);
  const underline = phase(frame, 58, 100);
  return <g transform={`translate(${x + 540} ${y + 960 - 440 * (1 - p)}) scale(${scale * (0.88 + p * 0.12)}) rotate(${(1 - p) * -5})`}>
    <rect x={-405} y={-425} width={810} height={850} rx={24} fill="#06131b" opacity={0.22} transform="translate(26 30)" />
    <rect x={-405} y={-425} width={810} height={850} rx={24} fill={C.paper} stroke={C.ink} strokeWidth={10} />
    <rect x={-405} y={-425} width={810} height={78} rx={24} fill="#123e5a" />
    <circle cx={-338} cy={-386} r={21} fill={C.amber} />
    <Label x={-300} y={-375} text="SOURCE / DHS S&T" fill={C.paper} size={22} />
    <Label x={-330} y={-275} text="BIOMETRICS AT THE BORDER" fill={C.ink} size={34} />
    <Label x={-330} y={-214} text={place} fill={C.copper} size={24} />
    <Label x={-330} y={-120} text={date} fill={C.ink} size={26} />
    <line x1={-330} y1={-84} x2={-330 + 660 * underline} y2={-84} stroke={C.copper} strokeWidth={9} />
    <rect x={-330} y={2} width={660} height={176} rx={18} fill="#d9e4df" />
    <Label x={0} y={78} text={status} fill="#123e5a" size={25} anchor="middle" />
    <Label x={0} y={126} text="TO SUPPORT CBP PLANNING" fill="#4f6164" size={20} anchor="middle" />
    {[0, 1, 2].map((i) => <rect key={i} x={-330} y={235 + i * 54} width={570 - i * 74}
      height={13} rx={6} fill="#768486" opacity={0.55} />)}
  </g>;
};

export const HumanFactors: React.FC<P> = ({x = 0, y = 0, scale = 1, frame = 0}) => {
  const p = phase(frame, 6, 32);
  const reveal = (i: number) => clamp((p * 3) - i * 0.65);
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <WalkerGlyph x={540} y={1410} s={0.88} step={frame / 5} umbrella={frame > 58}
      glasses={frame > 36} hat={frame > 16} />
    {[
      {x: 205, label: 'HAT'}, {x: 540, label: 'SUNGLASSES'}, {x: 875, label: 'UMBRELLA'},
    ].map((v, i) => <g key={v.label} opacity={reveal(i)}>
      <circle cx={v.x} cy={555} r={112} fill="#102b37" stroke={i === 2 ? C.blue : C.amber}
        strokeWidth={8} />
      {i === 0 && <><path d={`M${v.x - 72},570 Q${v.x},515 ${v.x + 72},570 Q${v.x},590 ${v.x - 72},570Z`}
        fill="#d7bf8d" /><rect x={v.x - 32} y={510} width={64} height={62} rx={16} fill="#d7bf8d" /></>}
      {i === 1 && <><rect x={v.x - 78} y={535} width={65} height={44} rx={14} fill="#08141b" />
        <rect x={v.x + 13} y={535} width={65} height={44} rx={14} fill="#08141b" />
        <line x1={v.x - 13} y1={552} x2={v.x + 13} y2={552} stroke={C.paper} strokeWidth={8} /></>}
      {i === 2 && <><path d={`M${v.x - 82},565 Q${v.x},485 ${v.x + 82},565 Q${v.x + 40},545 ${v.x},565 Q${v.x - 40},545 ${v.x - 82},565Z`}
        fill={C.blue} /><line x1={v.x} y1={560} x2={v.x} y2={635} stroke={C.paper} strokeWidth={8} /></>}
      <Label x={v.x} y={735} text={v.label} fill={C.paper} size={20} anchor="middle" />
    </g>)}
  </g>;
};

export const CaptureZone: React.FC<P> = ({x = 0, y = 0, scale = 1, frame = 0,
  label = '3D CAPTURE ZONE'}) => {
  const p = phase(frame, 4, 45);
  const dx = 20 * Math.sin(frame / 13);
  return <g transform={`translate(${x + dx} ${y}) scale(${scale})`} fill="none" stroke={C.cyan}
    opacity={0.25 + p * 0.62}>
    {[0, 1, 2, 3].map((i) => <rect key={i} x={210 + i * 64} y={500 + i * 76}
      width={660 - i * 128} height={840 - i * 150} strokeWidth={6 - i * 0.6} />)}
    {[[210, 500, 402, 728], [870, 500, 678, 728], [210, 1340, 402, 1190], [870, 1340, 678, 1190]].map((v, i) =>
      <line key={i} x1={v[0]} y1={v[1]} x2={v[2]} y2={v[3]} strokeWidth={5} />)}
    <path d="M540,1300 C480,1140 620,970 540,760" strokeWidth={18} strokeDasharray="12 20"
      strokeDashoffset={-frame * 5} />
    <Label x={540} y={455} text={label} fill={C.cyan} size={24} anchor="middle" />
  </g>;
};

export const SuitabilityPipeline: React.FC<P> = ({x = 0, y = 0, scale = 1, frame = 0,
  label = 'IMAGE SUITABILITY', next = 'BIOMETRIC MATCHING'}) => {
  const p = phase(frame, 4, 116);
  // One tile reaches the analysis chamber and stops. It does not enter matching,
  // because the source describes suitability analysis before that separate step.
  const cx = 210 + 330 * clamp(p / 0.62);
  const gate = phase(frame, 62, 92);
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="M170,1040 H910" stroke="#425e68" strokeWidth={16} strokeLinecap="round" />
    <path d="M170,1040 H910" stroke={C.amber} strokeWidth={8} strokeDasharray="18 28"
      strokeDashoffset={-frame * 5} />
    {[{x: 170, t: 'FACIAL IMAGE'}, {x: 540, t: label}, {x: 910, t: next}].map((v, i) =>
      <g key={v.t} opacity={i < 2 ? 1 : 0.28 + gate * 0.12}>
        <rect x={v.x - 145} y={820} width={290} height={430} rx={28} fill="#0b2734"
          stroke={i === 1 ? C.amber : C.cyan} strokeWidth={8} />
        <Label x={v.x} y={1315} text={v.t} fill={i === 1 ? C.amber : C.paper} size={18} anchor="middle" />
      </g>)}
    <g transform={`translate(${cx} 1018) rotate(${p * 10})`}>
      <rect x={-82} y={-108} width={164} height={216} rx={18} fill={C.paper} stroke={C.ink} strokeWidth={8} />
      <circle cx={0} cy={-34} r={38} fill="#a87554" />
      <path d="M-58,76 Q0,12 58,76Z" fill="#4f6871" />
      <path d="M-65,-83 h28 M65,-83 h-28 M-65,83 h28 M65,83 h-28" stroke={C.amber}
        strokeWidth={9} />
    </g>
    <path d={`M500,780 v${240 * gate}`} stroke={C.amber} strokeWidth={14} />
    <path d={`M580,780 v${240 * gate}`} stroke={C.amber} strokeWidth={14} />
    <Label x={540} y={720} text={gate > 0.6 ? 'ANALYZED' : 'SUITABILITY CHECK'}
      fill={C.amber} size={26} anchor="middle" />
  </g>;
};

export const MetricsBlind: React.FC<P> = ({x = 0, y = 0, scale = 1, frame = 0,
  progress, rows = ['ACCURACY RATE', 'RETENTION PERIOD', 'FINAL SELECTION']}) => {
  const p = progress === undefined ? phase(frame, 22, 72) : clamp((progress - 0.08) / 0.56);
  const positions = [
    {x: 112, y: 585, r: -3},
    {x: 360, y: 885, r: 3},
    {x: 168, y: 1190, r: -2},
  ];
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <Label x={540} y={505} text="THE ARTICLE LEAVES THREE WINDOWS OPEN"
      fill={C.paper} size={23} anchor="middle" />
    <path d="M540,535 C510,760 580,1030 520,1450" fill="none" stroke={C.copper}
      strokeWidth={5} strokeDasharray="14 18" opacity={0.62} />
    {rows.map((r, i) => {
      const q = clamp(p * 3 - i * 0.55);
      const at = positions[i] ?? positions[positions.length - 1];
      return <g key={r} transform={`translate(${at.x} ${at.y}) rotate(${at.r})`} opacity={q}>
        <rect x={0} y={0} width={610} height={190} rx={22} fill="#071923" opacity={0.78}
          stroke="#6b858b" strokeWidth={7} />
        <rect x={0} y={0} width={13} height={190} rx={6} fill={C.amber} />
        <Label x={42} y={66} text={r} fill="#c5d1cf" size={21} />
        <line x1={42} y1={124} x2={470} y2={124} stroke="#63757a" strokeWidth={7}
          strokeDasharray="12 14" />
        <Label x={558} y={139} text="—" fill={C.amber} size={52} anchor="end" />
      </g>;
    })}
    <g opacity={progress === undefined ? phase(frame, 76, 112) : clamp((progress - 0.68) / 0.2)}
      transform="translate(540 1580) rotate(-2)">
      <rect x={-220} y={-55} width={440} height={110} rx={12} fill={C.amber} />
      <Label x={0} y={15} text="NOT PUBLISHED" fill={C.ink} size={29} anchor="middle" />
    </g>
  </g>;
};

export const OptOutLane: React.FC<P> = ({x = 0, y = 0, scale = 1, frame = 0,
  capture = 'CAPTURE AREA', optout = 'OPT-OUT LANE'}) => {
  const p = phase(frame, 8, 48);
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="M470,1580 L515,650 L585,650 L655,1580 Z" fill={C.violet} opacity={0.32 + p * 0.35}
      stroke={C.violet} strokeWidth={8} />
    <path d="M655,1580 C820,1290 785,890 610,650 L665,650 C920,940 995,1280 970,1580 Z"
      fill={C.blue} opacity={0.34 + p * 0.42} stroke={C.blue} strokeWidth={8} />
    <path d="M655,1510 C770,1270 805,1010 642,740" fill="none" stroke={C.paper}
      strokeWidth={7} strokeDasharray="22 18" strokeDashoffset={-frame * 4} opacity={0.8} />
    <g transform="translate(435 1110) rotate(-7)">
      <rect x={-165} y={-58} width={330} height={116} rx={15} fill={C.violet} />
      <Label x={0} y={12} text={capture} fill={C.paper} size={22} anchor="middle" />
    </g>
    <g transform="translate(837 1100) rotate(8)">
      <rect x={-165} y={-58} width={330} height={116} rx={15} fill={C.blue} />
      <Label x={0} y={12} text={optout} fill={C.paper} size={22} anchor="middle" />
    </g>
  </g>;
};

export const DeploymentDecision: React.FC<P> = ({x = 0, y = 0, scale = 1, frame = 0,
  stage = 'planning', selected = false, actor = 'CBP', mode = 'track'}) => {
  const p = phase(frame, 8, 108);
  const stop = stage === 'planning' ? Math.min(p, 0.66) : p;
  const pulseX = 210 + stop * 660;
  const nodes = [
    {x: 210, title: 'ASSESSMENT', done: true},
    {x: 540, title: 'PLANNING', done: stage === 'planning' || selected},
    {x: 870, title: 'SELECTION', done: selected},
  ];
  if (mode === 'compact') {
    const reveal = phase(frame, 58, 104);
    return <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={reveal}>
      <path d="M250,1420 H640" stroke={C.amber} strokeWidth={9} />
      <circle cx={250} cy={1420} r={30} fill={C.amber} stroke={C.paper} strokeWidth={6} />
      <rect x={640} y={1350} width={350} height={140} rx={22} fill="#081c28"
        stroke={C.cyan} strokeWidth={7} strokeDasharray="18 14" />
      <Label x={815} y={1408} text="FUTURE SELECTION" fill={C.cyan} size={20}
        anchor="middle" />
      <Label x={815} y={1450} text="OPEN" fill={C.paper} size={25} anchor="middle" />
    </g>;
  }
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <rect x={105} y={710} width={870} height={520} rx={34} fill="#081c28" stroke="#41606b" strokeWidth={8} />
    <Label x={540} y={800} text={`${actor} DECISION TRACK`} fill={C.paper} size={26} anchor="middle" />
    <Label x={540} y={850} text="ARTICLE: NO FINAL SELECTION ANNOUNCED" fill={C.cyan}
      size={18} anchor="middle" />
    <line x1={210} y1={975} x2={870} y2={975} stroke="#38515a" strokeWidth={16} strokeLinecap="round" />
    <line x1={210} y1={975} x2={pulseX} y2={975} stroke={C.amber} strokeWidth={10} strokeLinecap="round" />
    {nodes.map((n, i) => <g key={n.title}>
      <circle cx={n.x} cy={975} r={58} fill={n.done ? C.amber : '#0d2a37'}
        stroke={n.done ? C.paper : C.cyan} strokeWidth={8} strokeDasharray={!n.done ? '16 12' : undefined} />
      {n.done ? <path d={`M${n.x - 24},975 l17,19 l35,-43`} fill="none" stroke={C.ink}
        strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" /> :
        <Label x={n.x} y={993} text="?" fill={C.cyan} size={50} anchor="middle" />}
      <Label x={n.x} y={1105} text={n.title} fill={n.done ? C.paper : C.cyan} size={19} anchor="middle" />
      {i === 2 && !n.done && <rect x={n.x - 116} y={1160} width={232} height={7} fill={C.cyan}
        opacity={0.3 + 0.25 * Math.sin(frame / 8)} />}
    </g>)}
  </g>;
};
