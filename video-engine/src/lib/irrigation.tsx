import React, {useId} from 'react';
import {FONT} from './type';
import {M} from './scale';

// Working steel, dry High Plains soil and a restrained blue for observations.
// The machine is illustrative, not a reconstruction of a named producer's installation.
const C = {ink: '#1b2830', steel: '#a5b6b1', light: '#e1e4cb', rust: '#b77b46',
  earth: '#ba854a', soil: '#775738', leaf: '#566b43', blue: '#79c8cd', paper: '#f3ebcf'};
const cap = (v: number) => Math.max(0, Math.min(1, v));
type At = {x?: number; y?: number; scale?: number; frame?: number; progress?: number};

export const IRRIGATION_M: Record<string, {h: number}> = {
  pivotRig: {h: 4.5},
};
const fit = (key: keyof typeof IRRIGATION_M, local: number) => IRRIGATION_M[key].h * M / local;

const Wheel: React.FC<{x: number; y: number; r: number; frame: number}> = ({x, y, r, frame}) => (
  <g transform={`translate(${x} ${y})`}>
    <ellipse cy={r * 0.9} rx={r * 1.3} ry={r * 0.18} fill={C.ink} opacity={0.25}/>
    <g transform={`rotate(${frame * 0.45})`}>
      <circle r={r} fill={C.ink}/>
      <circle r={r * 0.72} fill="#47504a" stroke={C.soil} strokeWidth={r * 0.12}/>
      {Array.from({length: 16}, (_, i) => <path key={i}
        transform={`rotate(${i * 22.5})`} d={`M${-r * 0.23},${-r * 0.94} l${r * 0.4},${r * 0.16}`}
        fill="none" stroke="#707063" strokeWidth={r * 0.1}/>)}
      <circle r={r * 0.43} fill={C.steel} stroke={C.ink} strokeWidth={r * 0.06}/>
      <circle r={r * 0.13} fill={C.rust}/>
      {[0, 72, 144, 216, 288].map(a => <circle key={a} transform={`rotate(${a})`}
        cx={r * 0.26} r={r * 0.05} fill={C.ink}/>)}
    </g>
  </g>
);

export const PivotRig: React.FC<At & {sensor?: boolean; spray?: boolean; label?: string; opacity?: number}> = ({
  x = 540, y = 1450, scale = 1, frame = 0, progress = 0, sensor = false, spray = true, label = '', opacity = 1,
}) => {
  const k = fit('pivotRig', 600);
  const drift = Math.sin(progress * Math.PI * 0.6) * 35;
  return <g opacity={opacity} transform={`translate(${x + drift} ${y}) scale(${k * scale})`}>
    <g stroke={C.ink} strokeWidth={7} strokeLinejoin="round">
      <path d="M-700,-552 Q-140,-685 470,-544 L920,-430" fill="none" strokeWidth={19}/>
      <path d="M-700,-558 Q-140,-691 470,-550 L920,-436" fill="none" stroke={C.light} strokeWidth={8}/>
      <path d="M-690,-530 L-525,-440 L-370,-593 L-225,-430 L-60,-610 L110,-414 L290,-584 L470,-399 L670,-492 L900,-359" fill="none" stroke={C.steel} strokeWidth={9}/>
      <path d="M-690,-530 L470,-399 L900,-359" fill="none" stroke={C.steel}/>
      <path d="M-230,-602 L-345,-108 M-212,-601 L-105,-108" stroke={C.steel} strokeWidth={15}/>
      <path d="M-350,-130 L-97,-130" stroke={C.steel} strokeWidth={22}/>
      <path d="M-338,-255 L-151,-255" stroke={C.rust} strokeWidth={8}/>
      <path d="M-264,-508 l45,15 M-254,-466 l45,15" stroke={C.rust} strokeWidth={16}/>
    </g>
    <Wheel x={-344} y={-90} r={90} frame={frame}/>
    <Wheel x={-98} y={-90} r={90} frame={frame}/>
    {[-560, 24, 470, 840].map((px, i) => <g key={px}>
      <path d={`M${px},${-569 + i * 37} v${200 - i * 14}`} fill="none" stroke={C.ink} strokeWidth={5}/>
      <path d={`M${px - 14},${-368 + i * 23} h28 l-14,12 z`} fill={C.rust}/>
      {spray && Array.from({length: 11}, (_, j) => {
        const t = ((frame * 0.027 + j / 11 + i * 0.17) % 1);
        return <path key={j} d={`M${px + (j - 5) * 7 * t},${-356 + i * 23 + t * 330} l${(j - 5) * 0.5},9`}
          stroke={C.paper} strokeWidth={2.2} opacity={(1 - t) * 0.7}/>;
      })}
    </g>)}
    {sensor && <g transform="translate(128 -480)">
      <path d="M0,-95 v97 h80" fill="none" stroke={C.ink} strokeWidth={5}/>
      <path d="M-4,-25 l79,8 l-3,53 l-78,-7 z" fill={C.paper} stroke={C.ink} strokeWidth={5}/>
      <path d="M6,17 h53" stroke={C.blue} strokeWidth={7}/>
      <circle cx={51} cy={0} r={8} fill={C.ink}/>
      {[0, 1, 2].map(i => <path key={i} d={`M${-25 - i * 26},${65 + i * 40} q61,37 ${122 + i * 52},0`}
        fill="none" stroke={C.blue} strokeWidth={3} opacity={0.2 + 0.65 * ((frame / 38 + i / 3) % 1)}/>)}
    </g>}
    {label && <text x={-120} y={-700} fill={C.paper} fontFamily={FONT.body} fontSize={39}
      fontWeight={700}>{label}</text>}
  </g>;
};

// Editorial cutaway. Its dimensions are screen-space, not an assertion of measurement depth.
export const RadarEstimate: React.FC<At & {label: string; sublabel: string}> = ({
  x = 540, y = 920, scale = 1, frame = 0, progress = 0, label, sublabel,
}) => {
  const id = useId().replace(/:/g, '');
  const sweep = cap((progress - 0.12) / 0.72);
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <defs><clipPath id={`${id}-soil`}><path d="M-450,25 L450,25 L450,310 L-450,265 Z"/></clipPath></defs>
    <path d="M-450,25 L450,25 L450,310 L-450,265 Z" fill={C.soil} stroke={C.ink} strokeWidth={5}/>
    <g clipPath={`url(#${id}-soil)`}>
      {Array.from({length: 44}, (_, i) => <path key={i}
        d={`M${-460 + (i * 139) % 920},${48 + (i * 43) % 260} l${22 + i % 7},9`}
        stroke={i % 3 ? C.rust : C.paper} strokeWidth={3} opacity={0.45}/>)}
      <path d={`M-450,40 Q-160,${145 + sweep * 25} 100,90 T450,170 L450,310 L-450,280 Z`}
        fill={C.blue} opacity={sweep * 0.3}/>
      <rect x={-450 + sweep * 900} y={24} width={4} height={300} fill={C.blue} opacity={0.7}/>
    </g>
    <path d="M-450,21 H450" stroke={C.leaf} strokeWidth={12}/>
    {Array.from({length: 12}, (_, i) => <g key={i} transform={`translate(${-420 + i * 77} 20)`}>
      <path d="M0,0 v-75 M0,-42 q-37,-32 -46,-19 q23,29 46,25 M0,-57 q34,-35 39,-18 q-20,23 -39,23"
        fill={C.leaf} stroke={C.ink} strokeWidth={3}/>
    </g>)}
    <g transform={`translate(${-295 + progress * 535} -360)`}>
      <path d="M-85,-20 h150 l22,75 h-163 z" fill={C.paper} stroke={C.ink} strokeWidth={7}/>
      <circle cx={44} cy={13} r={15} fill={C.ink}/><path d="M-62,32 h75" stroke={C.blue} strokeWidth={8}/>
      {[0, 1, 2].map(i => {
        const t = (frame / 58 + i / 3) % 1;
        return <path key={i} d={`M${-25 - t * 100},${80 + t * 205} Q0,${110 + t * 205} ${25 + t * 100},${80 + t * 205}`}
          fill="none" stroke={C.blue} strokeWidth={5} opacity={1 - t}/>;
      })}
      <path d="M85,310 Q220,190 94,102" fill="none" stroke={C.paper} strokeWidth={3}
        strokeDasharray="10 9" strokeDashoffset={-frame * 1.2}/>
    </g>
    <text x={-450} y={-505} fill={C.paper} fontFamily={FONT.display} fontWeight={700} fontSize={56}>{label}</text>
    <text x={-445} y={405} fill={C.paper} fontFamily={FONT.body} fontSize={35}>{sublabel}</text>
  </g>;
};

export const FieldObservations: React.FC<At & {label: string; result: string; cropLabel: string; weatherLabel: string}> = ({
  x = 540, y = 800, scale = 1, frame = 0, progress = 0, label, result, cropLabel, weatherLabel,
}) => <g transform={`translate(${x} ${y}) scale(${scale})`}>
  <text x={-400} y={-325} fill={C.paper} fontFamily={FONT.display} fontSize={52} fontWeight={700}>{label}</text>
  <g transform={`translate(${-200 + 45 * progress} -90) rotate(${-5 + progress * 4})`}>
    <rect x={-160} y={-135} width={285} height={225} rx={12} fill="#9ca769" stroke={C.ink} strokeWidth={8}/>
    {[-100, -10, 80].map((cx, i) => <path key={cx} d={`M${cx},60 v-140 m0,70 q-55,-48 -55,-20 q12,33 55,29 m0,-45 q48,-40 48,-17 q-17,30 -48,28`}
      fill={C.leaf} stroke={C.ink} strokeWidth={5}/>)}
    <path d="M-145,-112 h46 m-46,0 v38 M105,60 h-46 m46,0 v-38" stroke={C.paper} strokeWidth={6}/>
    <rect x={-145 + progress * 231} y={-124} width={3} height={198} fill={C.blue}/>
    <text x={-140} y={140} fontSize={33} fill={C.paper} fontFamily={FONT.body}>{cropLabel}</text>
  </g>
  <g transform={`translate(${260 - progress * 35} -85)`}>
    <circle cy={-60} r={67} fill="#e4bd61"/>
    <path d="M-99,10 Q-149,-50 -65,-72 Q-34,-132 24,-71 Q82,-88 111,-20 Q150,27 89,49 H-65 Q-125,52 -99,10" fill={C.paper} stroke={C.ink} strokeWidth={7}/>
    {[0, 1, 2].map(i => <path key={i} d={`M${-48 + i * 58},80 l-11,24`} stroke={C.blue} strokeWidth={7}
      transform={`translate(0 ${(frame + i * 5) % 32})`}/>)}
    <text x={-108} y={175} fontSize={33} fill={C.paper} fontFamily={FONT.body}>{weatherLabel}</text>
  </g>
  <path d="M-130,135 C-130,320 30,200 30,350 M245,163 Q245,280 30,350" stroke={C.blue}
    strokeWidth={6} fill="none" strokeDasharray="15 10" strokeDashoffset={-frame * 2}/>
  <g transform="translate(15 250)" opacity={cap((progress - 0.18) * 4)}>
    <path d="M-197,-32 h394 v94 l-394,-22 z" fill={C.soil} stroke={C.ink} strokeWidth={5}/>
    <path d="M-197,-16 q107,47 210,17 t184,18 v43 l-394,-22 z" fill={C.blue} opacity={0.38}/>
    <text x={-132} y={22} fill={C.paper} fontFamily={FONT.body} fontSize={28}>SOIL ESTIMATE</text>
  </g>
  <g opacity={cap((progress - 0.28) * 5)} transform={`translate(0 ${30 * (1 - progress)})`}>
    <IrrigationAdvice x={25} y={530} scale={0.6} frame={frame} progress={progress}
      label={result} status="" mode="advice"/>
  </g>
</g>;

export const FarmlandLayer: React.FC<At & {layer: 'sky'|'soil'|'edge'; technical?: boolean}> = ({
  layer, frame = 0, technical = false,
}) => {
  const id = useId().replace(/:/g, '');
  if (layer === 'sky') return <g>
    <defs><linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor={technical ? '#172c32' : '#527682'}/><stop offset="1" stopColor={technical ? '#284348' : '#e7c588'}/></linearGradient></defs>
    <rect x={-1200} y={-1400} width={3500} height={4200} fill={`url(#${id}-sky)`}/>
    {!technical && <circle cx={160} cy={540} r={91} fill="#f7d998" opacity={0.6}/>}
  </g>;
  if (layer === 'edge') return <g opacity={technical ? 0.25 : 0.65}>
    {[-80, 50, 990, 1110].map((x, i) => <path key={x} transform={`translate(${x} 1660) rotate(${Math.sin(frame / 52 + i) * 2})`}
      d="M0,340 V-80 M0,115 q-110,-112 -138,-60 q22,92 138,101 M0,30 q96,-116 116,-53 q-28,57 -116,90"
      fill={C.leaf} stroke={C.ink} strokeWidth={6}/>)}
  </g>;
  return <g opacity={technical ? 0.18 : 1}>
    <defs><linearGradient id={`${id}-earth`} x2="0" y2="1"><stop stopColor="#baa161"/><stop offset="1" stopColor="#82573c"/></linearGradient></defs>
    <path d="M-1200,960 L2400,960 L2500,3500 H-1300 Z" fill={`url(#${id}-earth)`}/>
    {Array.from({length: 26}, (_, i) => <path key={i} d={`M${500 + (i - 13) * 19},965 L${(i - 13) * 150},2800`}
      stroke={i % 3 ? C.leaf : '#dcc58a'} strokeWidth={8 + i % 4} opacity={0.48}/>)}
    {Array.from({length: 58}, (_, i) => <path key={i} d={`M${-180 + (i * 113) % 1450},${1010 + (i * 83) % 1500} l${9 + i % 11},${2 + i % 8}`}
      stroke="#ded299" opacity={0.5} strokeWidth={2}/>)}
  </g>;
};

export const IrrigationAdvice: React.FC<At & {label: string; status: string; mode?: 'advice'|'limit'}> = ({
  x = 510, y = 760, scale = 1, frame = 0, progress = 0, label, status, mode = 'advice',
}) => <g transform={`translate(${x} ${y + 85 * (1 - cap(progress * 2))}) scale(${scale}) rotate(${-6 + progress * 7})`}>
  <path d="M-290,-280 H290 L318,-250 V380 H-260 L-290,350 Z" fill={C.ink}/>
  <rect x={-282} y={-288} width={572} height={656} rx={29} fill={C.steel} stroke={C.ink} strokeWidth={8}/>
  <rect x={-244} y={-235} width={494} height={535} rx={6} fill={C.paper}/>
  <path d="M-214,-103 H218 M-213,116 H215" stroke={C.steel} strokeWidth={3}/>
  <text x={-210} y={-155} fontFamily={FONT.body} fontSize={34} fontWeight={700} fill={C.ink}>{label}</text>
  <path d="M-195,-32 h320 m-320,45 h370 m-370,45 h240" stroke={C.leaf}
    strokeWidth={8} strokeDasharray="1000" strokeDashoffset={1000 * (1 - cap(progress * 2))}/>
  {mode === 'limit' ? <g>
    <text x={-204} y={177} fill={C.soil} fontSize={29} fontFamily={FONT.body}>WATER SAVINGS</text>
    <text x={-204} y={226} fill={C.rust} fontSize={26} fontFamily={FONT.body}>NOT REPORTED</text>
    <text x={-204} y={265} fill={C.soil} fontSize={20} fontFamily={FONT.body}>IN THIS ANNOUNCEMENT</text>
    <path d="M133,175 c0,-43 73,-47 80,-5 c10,30 -32,35 -35,59 M176,251 v2" fill="none" stroke={C.rust} strokeWidth={8}
      strokeDasharray="220" strokeDashoffset={220 * (1 - cap((progress - 0.48) * 3))}/>
    <g transform={`translate(${133 + 44 * cap((progress - 0.48) * 3)} ${175 + 76 * cap((progress - 0.48) * 3)})`}
      opacity={progress > 0.48 && progress < 0.84 ? 1 : 0}>
      <path d="M4,0 l38,-72 l12,7 l-41,70 z" fill={C.ink}/>
      <path d="M24,-46 q21,-29 41,-9 l64,80 l-51,31 l-29,-54 q-31,7 -25,-48" fill="#ac764e" stroke={C.ink} strokeWidth={5}/>
    </g>
  </g> : <path d="M-195,187 h260 m-260,38 h370 m-370,38 h170" stroke={C.steel} strokeWidth={9}/>}
  <circle cy={334} r={10} fill={C.ink}/>
  <g transform={`translate(${-15 * progress} ${170 * (1 - cap(progress * 2.3))})`}>
    <path d="M-377,454 l9,-163 q-12,-102 17,-126 q26,-24 52,34 l38,83 q37,14 60,67 l22,112 z" fill="#ac764e" stroke={C.ink} strokeWidth={8}/>
    <path d="M-386,438 l190,4 l19,181 l-236,-1 z" fill={C.leaf} stroke={C.ink} strokeWidth={8}/>
    <path d="M-343,454 l120,5" stroke={C.light} strokeWidth={4}/>
  </g>
  <text x={-298} y={-370} fill={C.paper} fontFamily={FONT.display} fontWeight={700} fontSize={53}>{status}</text>
</g>;

export const FieldDayNotice: React.FC<At & {title: string; date: string; place: string; detail: string}> = ({
  x = 520, y = 550, scale = 1, frame = 0, progress = 0, title, date, place, detail,
}) => <g transform={`translate(${x} ${y}) scale(${scale}) rotate(${-3 + cap(progress * 2) * 3})`}>
  <path d="M-354,-209 H361 L380,-189 V252 H-338 L-354,235 Z" fill={C.ink} opacity={0.2}/>
  <path d="M-360,-220 H360 V238 H-360 Z" fill={C.paper} stroke={C.ink} strokeWidth={6}/>
  <path d="M-360,-220 H360 V-160 H-360 Z" fill={C.leaf}/>
  <text x={-327} y={-180} fill={C.paper} fontFamily={FONT.body} fontSize={27} letterSpacing={2}>{title}</text>
  <text x={-330} y={-60} fill={C.ink} fontFamily={FONT.display} fontSize={75} fontWeight={700}>{date}</text>
  <path d="M-326,-20 h652" stroke={C.rust} strokeWidth={5}/>
  <text x={-330} y={49} fill={C.ink} fontFamily={FONT.body} fontSize={39} fontWeight={700}>{place}</text>
  <text x={-330} y={105} fill={C.soil} fontFamily={FONT.body} fontSize={31}>{detail}</text>
  <path d="M-331,166 h461" stroke={C.steel} strokeWidth={2}/>
  <path d={`M${-333 + cap((progress - 0.48) * 3) * 190},178 h145 l-15,-13 m15,13 l-15,13`}
    stroke={C.leaf} strokeWidth={5} fill="none"/>
</g>;
