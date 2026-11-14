import React from 'react';
import {widthOf, wrapToWidth} from '../../lib/type';
import {line, mix, shade} from '../color';
import {ContactShadow, Glow, useUid} from '../Kit';
import {SC, ScBall, ScBlur, ScCard, ScDuo, ScLit, ScSolid, ScTxt, scBend, scOw, scRR, scRound} from './magnets';

/**
 * SPECTRAL, LOOK V2 (November 14th, 2026).
 *
 * The material sensing set from lib/spectral.tsx, redrawn in the v2 idiom. Powder and liquid samples
 * in glass dishes, the handheld contact sensor, light bands striking a sample, two conceptual
 * signatures side by side, the test bench, the Austin lab, the backdrop surfaces, the teaching step and
 * the application record.
 *
 * The library's rule holds. Spectral curves and light colours are conceptual, not measured data, and
 * the curves keep the library's exact shapes. One change makes the idea clearer. The five light bands
 * now run in spectral order, violet, blue, green, gold and red, so a viewer reads them as parts of one
 * spectrum. Each band keeps the library's own absorbed and reflected share, and the light that goes
 * into the sample and the light that comes back always add up to the light that arrived.
 *
 * Words were cream in the library, written for the dark wall behind them. Here every word carries a
 * deep rim, so it reads on the dark wall and on a light plate alike.
 *
 * PLACEMENT is the library's, screen units under `translate(x y) scale(scale)` with every coordinate
 * kept, and the same story props (`progress`, `secondary`, `tertiary`, `entry_dx`, `travel_x`).
 */
type P = {date?: string; x?: number; y?: number; scale?: number; label?: string; mode?: string; progress?: number; secondary?: number;
  tertiary?: number; frame?: number; entry_dx?: number; travel_x?: number};
const S = {plum: SC.plum, mint: SC.mint, gold: '#f5aa1c', rust: '#ff7048', lilac: SC.lilac, paper: SC.paper, deep: '#26184a',
  glass: '#e6e0ff'};
/** the five bands in spectral order, violet to red */
const BANDS = ['#8f6bff', '#3d8bff', '#22c995', '#f5aa1c', '#ff5e44'];

/** a label in the library's wrap, white words on a deep rim, so it reads on any plate */
const Label: React.FC<{text: string; y?: number; size?: number; fill?: string}> = ({text, y = 0, size = 32, fill = '#ffffff'}) => (
  <g>{wrapToWidth(text, 700, size).map((t, i) => <ScTxt key={i} x={0} y={y + i * (size + 9)} t={t} size={size} fill={fill}
    halo={S.deep} />)}</g>
);

/**
 * A GLASS SAMPLE DISH. A lilac glass wall and a bright rim, a bed of powder grains lit from the upper
 * left, or a liquid with a slow moving sheen, and the coloured tag on its front that names the sample.
 */
export const ScDish: React.FC<{x?: number; y?: number; mark?: string; liquid?: boolean; frame?: number; ow: number}> = ({
  x = 0, y = 0, mark = S.gold, liquid = false, frame = 0, ow}) => {
  const id = useUid();
  const wall = 'M-166 0 Q-166 110 0 118 Q166 110 166 0 Z';
  const rim = 'M-166 0 A166 81 0 1 0 166 0 A166 81 0 1 0 -166 0 Z';
  const w = Math.sin(frame / 20) * 10;
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <ScLit id={`${id}-w`} c="#b9a4f2" h /><ScLit id={`${id}-m`} c={mark} v />
        <radialGradient id={`${id}-bed`} cx="40%" cy="35%" r="75%"><stop offset="0%" stopColor="#fffaf0" />
          <stop offset="70%" stopColor={liquid ? '#d9ccff' : '#f4e6c8'} /><stop offset="100%" stopColor={liquid ? '#a993ef' : '#d8c29a'} /></radialGradient>
        <clipPath id={`${id}-c`}><ellipse cy={-3} rx={144} ry={64} /></clipPath>
      </defs>
      <ContactShadow x={0} y={118} w={400} opacity={0.36} />
      <path d={wall} fill={line('#b9a4f2')} stroke={line('#b9a4f2')} strokeWidth={ow * 2} strokeLinejoin="round" />
      <path d={rim} fill={line('#b9a4f2')} stroke={line('#b9a4f2')} strokeWidth={ow * 2} />
      <path d={wall} fill={`url(#${id}-w)`} />
      <path d={rim} fill={S.glass} />
      <ellipse cy={-3} rx={144} ry={64} fill={`url(#${id}-bed)`} />
      <g clipPath={`url(#${id}-c)`}>
        {liquid
          ? <g><path d={`M-150 ${-14 + w * 0.3} Q-70 ${-40 + w} 0 -16 T150 ${-10 - w * 0.4}`} fill="none" stroke="#ffffff" strokeWidth={ow * 2.4}
            strokeLinecap="round" opacity={0.75} />
            <path d={`M-100 ${24 - w * 0.4} Q-10 ${4 + w * 0.5} 100 ${28}`} fill="none" stroke="#ffffff" strokeWidth={ow * 1.6} strokeLinecap="round"
              opacity={0.5} /></g>
          : Array.from({length: 52}, (_, i) => {
            const gx = Math.cos(i * 2.399) * Math.sqrt(i / 52) * 129, gy = Math.sin(i * 2.399) * Math.sqrt(i / 52) * 54 - 5;
            return <ellipse key={i} cx={gx} cy={gy} rx={5 + (i % 4)} ry={3 + (i % 2)} fill={i % 4 === 0 ? '#ffffff' : '#c9ad7e'}
              opacity={i % 4 === 0 ? 0.95 : 0.55} />;
          })}
      </g>
      <path d="M-53 84 Q0 100 54 83 L50 112 Q0 129 -50 112Z" fill={line(mark)} stroke={line(mark)} strokeWidth={ow * 1.4} strokeLinejoin="round" />
      <path d="M-53 84 Q0 100 54 83 L50 112 Q0 129 -50 112Z" fill={`url(#${id}-m)`} />
      <path d="M-150 -34 A150 70 0 0 1 -40 -76" fill="none" stroke="#ffffff" strokeWidth={ow * 1.6} strokeLinecap="round" opacity={0.8} />
      <path d="M-150 30 Q-140 78 -90 96" fill="none" stroke="#ffffff" strokeWidth={ow * 1.4} strokeLinecap="round" opacity={0.5} />
    </g>
  );
};

/**
 * THE CONTACT PROBE HEAD. A rounded plum handset with a lilac face, a dark read window with a mint
 * indicator, and a mint sensing tip at the bottom (0, 0), where it touches the sample.
 */
export const ScProbe: React.FC<{x?: number; y?: number; frame?: number; ow: number}> = ({x = 0, y = 0, frame = 0, ow}) => {
  const id = useUid();
  const body = scRound([[-72, -230], [72, -230], [82, -61], [70, -20], [44, 0], [-44, 0], [-70, -20], [-82, -61]], 24);
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs><ScLit id={`${id}-b`} c={S.plum} /><ScLit id={`${id}-f`} c={S.lilac} />
        <linearGradient id={`${id}-w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2c2f63" /><stop offset="100%" stopColor="#0c0e29" />
        </linearGradient><ScBall id={`${id}-t`} c={S.mint} /></defs>
      <path d={scRR(-110, -242, 220, 36, 18)} fill={line(S.plum)} stroke={line(S.plum)} strokeWidth={ow * 2} />
      <path d={body} fill={line(S.plum)} stroke={line(S.plum)} strokeWidth={ow * 2} strokeLinejoin="round" />
      <ellipse cy={2} rx={34} ry={13} fill={line(S.mint)} stroke={line(S.mint)} strokeWidth={ow * 2} />
      <path d={body} fill={`url(#${id}-b)`} />
      <path d={scRR(-110, -242, 220, 36, 18)} fill={shade(S.plum, 0.25)} />
      <path d={scRound([[-52, -205], [50, -205], [50, -78], [32, -40], [-32, -40], [-52, -78]], 18)} fill={`url(#${id}-f)`} />
      <rect x={-42} y={-90} width={84} height={58} rx={20} fill={`url(#${id}-w)`} />
      <rect x={-28} y={-70} width={14 + 40 * (0.5 + 0.5 * Math.sin(frame / 7))} height={10} rx={5} fill={S.mint} opacity={0.9} />
      <ellipse cy={2} rx={34} ry={13} fill={`url(#${id}-t)`} />
      <path d="M-40 -170 H-4 M30 -186 L26 -172" stroke="#ffffff" strokeWidth={ow * 1.3} strokeLinecap="round" opacity={0.6} />
      <rect x={-64} y={-200} width={14} height={110} rx={7} fill="#ffffff" opacity={0.25} />
    </g>
  );
};

/** POWDER SAMPLE. One dish, or a pair, or an unknown liquid with a plum question mark over it. */
export const PowderSampleV2: React.FC<P> = ({x = 0, y = 0, scale = 1, label = 'Sample', mode = 'powder', progress = 0, secondary = 0,
  entry_dx = 0, frame = 0}) => {
  const ow = scOw(scale);
  const bob = Math.sin(frame / 14) * 4;
  return (
    <g transform={`translate(${x + entry_dx * (1 - progress)} ${y}) scale(${scale})`}>
      <ScDish liquid={mode === 'unknown'} mark={mode === 'unknown' || mode === 'sort' ? S.plum : S.gold} frame={frame} ow={ow} />
      {mode === 'pair' && <ScDish x={370} mark={S.mint} frame={frame} ow={ow} />}
      {label && <g transform="translate(-165 180)"><Label text={label} size={31} /></g>}
      {mode === 'unknown' && <g opacity={secondary} transform={`translate(0 ${bob - 30})`}>
        <ScDuo d="M-60 -8 Q-37 -58 12 -50 Q65 -45 49 -4 Q44 13 11 26 V42" c={S.plum} w={14} ow={ow} />
        <circle cx={11} cy={68} r={10} fill={S.plum} stroke={line(S.plum)} strokeWidth={ow * 2} />
      </g>}
    </g>
  );
};

/**
 * THE CONTACT SENSOR. The probe on its cable comes down to touch, a mint glow spreads where it meets
 * the sample, and its signal bars flicker as it reads. `tertiary` and `travel_x` hop it along.
 */
export const ContactSensorV2: React.FC<P> = ({x = 0, y = 0, scale = 1, label = 'Contact sensor', progress = 0, secondary = 0, tertiary = 0,
  travel_x = 0, frame = 0}) => {
  const ow = scOw(scale);
  const cable = 'M0 -220 C-210 -390 240 -350 300 -470';
  return (
    <g transform={`translate(${x + travel_x * tertiary} ${y - 90 * Math.sin(Math.PI * tertiary)}) scale(${scale})`}>
      <path d={cable} fill="none" stroke={line(S.lilac)} strokeWidth={22 + ow * 2} strokeLinecap="round" />
      <path d={cable} fill="none" stroke={S.lilac} strokeWidth={22} strokeLinecap="round" />
      <path d={cable} fill="none" stroke="#ffffff" strokeWidth={5} strokeLinecap="round" opacity={0.4} transform="translate(-3 -5)" />
      <g transform={`translate(0 ${-125 * (1 - progress)})`}>
        {secondary > 0 && <Glow x={0} y={8} r={110 * secondary} color={S.mint} opacity={0.7 * secondary} />}
        <ellipse cy={10} rx={78 * secondary} ry={22 * secondary} fill={S.mint} opacity={0.3} />
        <ScProbe frame={frame} ow={ow} />
      </g>
      <g opacity={secondary} transform="translate(105 -164)">{[0.85, 0.38, 0.65, 0.24, 0.76].map((h0, i) => {
        const h = h0 * (0.85 + 0.15 * Math.sin(frame / 5 + i * 1.7));
        return <rect key={i} x={i * 24} y={-70 * h} width={15} height={70 * h} rx={7.5} fill={S.mint} stroke={line(S.mint)} strokeWidth={ow * 1.2} />;
      })}</g>
      {label && <g transform="translate(-155 -385)"><Label text={label} size={29} /></g>}
    </g>
  );
};

/**
 * LIGHT BANDS ON A SAMPLE. Five beams in spectral order strike a lit sample block. Part of each band
 * goes into the sample (the downward beam) and the rest comes back off it (the upward beam), each in
 * the library's own share for that band, so the two always add up to the light that arrived.
 */
export const AbsorptionBandsV2: React.FC<P> = ({x = 0, y = 0, scale = 1, label = 'Light response illustrated', progress = 0, secondary = 0,
  tertiary = 0, frame = 0}) => {
  const id = useUid();
  const ow = scOw(scale);
  const levels = [0.9, 0.28, 0.66, 0.15, 0.78];
  const slab = 'M-325 -95 Q-90 -170 330 -80 L330 185 Q60 258 -325 170Z';
  const beam = (d: string, c: string, w: number, op: number, k: string, dash?: string) => op > 0.001 && <g key={k} opacity={op}>
    <path d={d} fill="none" stroke={c} strokeWidth={w * 2.4} strokeLinecap="round" opacity={0.45} filter={`url(#${id}-g)`} strokeDasharray={dash} />
    <path d={d} fill="none" stroke={line(c)} strokeWidth={w + ow * 2} strokeLinecap="round" strokeDasharray={dash} />
    <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash} />
    <path d={d} fill="none" stroke="#ffffff" strokeWidth={w * 0.28} strokeLinecap="round" opacity={0.7} strokeDasharray={dash} />
  </g>;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs><ScLit id={`${id}-s`} c="#fff0d6" k={0.8} /><ScBlur id={`${id}-g`} sd={9} />
        <clipPath id={`${id}-c`}><path d={slab} /></clipPath><ScLit id={`${id}-t`} c={S.gold} v /></defs>
      <ContactShadow x={0} y={252} w={720} opacity={0.34} />
      <path d={slab} fill={line('#d9b98a')} stroke={line('#d9b98a')} strokeWidth={ow * 2} strokeLinejoin="round" />
      <path d={slab} fill={`url(#${id}-s)`} />
      <path d="M-325 170 Q60 258 330 185 V220 Q0 290 -325 205Z" fill={line('#7a5ad0')} stroke={line('#7a5ad0')} strokeWidth={ow * 2}
        strokeLinejoin="round" />
      <path d="M-325 170 Q60 258 330 185 V220 Q0 290 -325 205Z" fill="#7a5ad0" />
      <path d="M-300 -86 Q-90 -150 300 -70" fill="none" stroke="#ffffff" strokeWidth={ow * 1.6} strokeLinecap="round" opacity={0.7} />
      <ScSolid d="M-72 224 Q0 244 73 226 V260 Q0 279 -72 260Z" c={S.gold} ow={ow} fill={`url(#${id}-t)`} />
      {/* the absorbed share, inside the sample */}
      <g clipPath={`url(#${id}-c)`}>{BANDS.map((c, i) => {
        const xx = -245 + i * 120;
        return beam(`M${xx} -70 V${-70 + 170 * secondary}`, c, 18, (1 - levels[i]) * secondary, `a${i}`);
      })}</g>
      {BANDS.map((c, i) => {
        const xx = -245 + i * 120;
        const pulse = 1 + 0.12 * Math.sin(frame / 6 + i);
        return <g key={i}>
          {beam(`M${xx - 80} -375 L${xx} -110`, c, 18, progress > 0 ? 1 : 0, `i${i}`, `${progress * 300} 500`)}
          {beam(`M${xx} -107 L${xx + 60} ${-107 - 260 * tertiary}`, c, 14, levels[i] * tertiary, `r${i}`)}
          <circle cx={xx} cy={-92} r={(10 + secondary * 15) * pulse} fill={c} opacity={progress * 0.5} />
          <circle cx={xx} cy={-92} r={(6 + secondary * 8)} fill="#ffffff" stroke={c} strokeWidth={ow * 1.6} opacity={progress} />
        </g>;
      })}
      <g transform="translate(-330 350)"><Label text={label} /></g>
    </g>
  );
};

/** a small chart card, axes and a conceptual trace drawn on to `p` */
const Trace: React.FC<{d: string; c: string; p: number; ow: number}> = ({d, c, p, ow}) => (
  <g>
    <ScCard d={scRR(-30, -52, 352, 206, 28)} c="#fffaf0" ow={ow} />
    <ScDuo d={scBend([[0, 0], [0, 120], [292, 120]], 10)} c={S.lilac} w={ow * 0.8} ow={ow * 0.4} />
    <path d={d} fill="none" stroke={c} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" opacity={0.2 * p} pathLength={1}
      strokeDasharray={`${p} 1`} />
    <ScDuo d={d} c={c} w={ow * 1.6} ow={ow * 0.6} pl={1} dash={`${p} 1`} />
  </g>
);

/**
 * TWO CONCEPTUAL SIGNATURES. Two dishes, each with its own trace card underneath, the library's two
 * curve shapes drawn on in turn, then named. `mode` unknown names one Unknown and slides a labelled
 * example in beside it.
 */
export const SpectralComparisonV2: React.FC<P> = ({x = 0, y = 0, scale = 1, label = 'Conceptual signatures', mode = 'compare', progress = 0,
  secondary = 0, tertiary = 0, frame = 0}) => {
  const ow = scOw(scale);
  const curves = ['M0 93 Q25 105 40 55 T88 75 T142 35 T206 83 T292 23', 'M0 61 Q22 38 44 76 T100 21 T157 81 T222 42 T292 66'];
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g transform={`translate(-195 ${-22 * tertiary}) scale(.69)`}><ScDish frame={frame} ow={ow / 0.69} /></g>
      <g transform={`translate(195 ${22 * tertiary}) scale(.69)`}><ScDish mark={mode === 'unknown' ? S.plum : S.mint} liquid={mode === 'unknown'}
        frame={frame} ow={ow / 0.69} /></g>
      {[-1, 1].map((side, i) => <g key={side} transform={`translate(${side * 195 - 148} 170)`}>
        <Trace d={curves[i]} c={i === 0 ? S.gold : '#1fbf8f'} p={i === 0 ? progress : secondary} ow={ow} />
      </g>)}
      {mode === 'unknown'
        ? <g opacity={tertiary}>
          <rect x={85} y={360} width={205} height={85} rx={24} fill="#ffffff" opacity={0.12} />
          <rect x={85} y={360} width={205} height={85} rx={24} fill="none" stroke={S.lilac} strokeWidth={ow * 1.4} strokeDasharray={`${ow * 1.4} ${ow * 3.2}`}
            strokeLinecap="round" />
          <ScTxt x={187} y={414} t="Unknown" size={32} fill="#ffffff" anchor="middle" halo={S.deep} />
          <g transform={`translate(${(1 - tertiary) * 250} 0)`}>
            <ScCard d={scRR(-342, 346, 300, 111, 24)} c="#ffffff" ow={ow} />
            <ScTxt x={-320} y={389} t="Labeled example" size={27} fill={S.plum} />
            <ScTxt x={-320} y={430} t="Whipping cream" size={31} />
          </g>
        </g>
        : <g opacity={tertiary}>
          <ScTxt x={-195} y={391} t="Sugar" size={35} fill={S.gold} anchor="middle" halo={S.deep} />
          <ScTxt x={195} y={391} t="Flour" size={35} fill={S.mint} anchor="middle" halo={S.deep} />
        </g>}
      <g transform="translate(-340 -150)"><Label text={label} /></g>
    </g>
  );
};

/** a robot gripper drawn as one rounded U with mint pads, open by `open` */
const Gripper: React.FC<{ow: number}> = ({ow}) => (
  <g>
    <ScDuo d={scBend([[-60, -38], [-60, -110], [65, -110], [65, -38]], 22)} c="#9b8ae0" w={21} ow={ow} />
    <ScDuo d="M-62 -40 L-34 -22 M65 -40 L37 -22" c={S.mint} w={15} ow={ow} />
    <path d="M-56 -100 H40" stroke="#ffffff" strokeWidth={5} strokeLinecap="round" opacity={0.4} />
  </g>
);

/**
 * THE TEST BENCH. The dish and the probe on a lit bench. `mode` sort raises a rust test barrier and a
 * gripper comes in and stops against it, because handling waits on the test. Any other mode slides in
 * a test card.
 */
export const FeasibilityBenchV2: React.FC<P> = ({x = 0, y = 0, scale = 1, label = 'Application testing', mode = 'test', progress = 0, secondary = 0,
  tertiary = 0, frame = 0}) => {
  const id = useUid();
  const ow = scOw(scale);
  const rise = Math.min(1, tertiary * 2);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs><ScLit id={`${id}-t`} c={SC.wood} v /><ScLit id={`${id}-l`} c="#6b5ab8" h /><ScLit id={`${id}-b`} c={S.rust} h /></defs>
      <ContactShadow x={-315} y={462} w={110} opacity={0.4} /><ContactShadow x={324} y={462} w={110} opacity={0.4} />
      {[-315, 324].map((lx) => <rect key={lx} x={lx - 13} y={150} width={26} height={312} rx={13} fill={`url(#${id}-l)`}
        stroke={line('#6b5ab8')} strokeWidth={ow * 2} />)}
      <ScSolid d={scRR(-360, 125, 730, 41, 18)} c={SC.wood} ow={ow} fill={`url(#${id}-t)`} />
      <path d="M-335 133 H345" stroke="#ffffff" strokeWidth={ow * 1.2} strokeLinecap="round" opacity={0.45} />
      <g transform={`translate(${-120 + 65 * progress} 68) scale(.64)`}>
        <ScDish mark={mode === 'unknown' || mode === 'sort' ? S.plum : S.gold} liquid={mode === 'unknown' || mode === 'sort'} frame={frame}
          ow={ow / 0.64} />
      </g>
      <g transform={`translate(${-120 + 65 * progress} ${70 - 130 * (1 - secondary)}) scale(.63)`}><ScProbe frame={frame} ow={ow / 0.63} /></g>
      {mode === 'sort' && <g>
        {/* the testing barrier rises into the proposed reach, and the gripper comes in and halts against it */}
        {rise > 0 && <ScSolid d={scRR(55, 125 - 270 * rise, 24, 270 * rise, 12)} c={S.rust} ow={ow} fill={`url(#${id}-b)`} />}
        <g transform={`translate(${250 - 101 * Math.max(0, (tertiary - 0.5) * 2)} ${100 - 55 * progress})`}><Gripper ow={ow} /></g>
        <rect x={85} y={200} width={201} height={102} rx={26} fill="#ffffff" opacity={0.1} />
        <rect x={85} y={200} width={201} height={102} rx={26} fill="none" stroke={S.lilac} strokeWidth={ow * 1.3} strokeDasharray={`${ow * 1.4} ${ow * 3.2}`}
          strokeLinecap="round" />
        <ScTxt x={186} y={262} t="Test first" size={27} fill="#ffffff" anchor="middle" halo={S.deep} />
      </g>}
      {mode !== 'sort' && <g transform={`translate(${180 + (1 - tertiary) * 160} -95)`} opacity={tertiary}>
        <ScCard d={scRound([[-70, -90], [75, -90], [110, -55], [110, 160], [-70, 160]], 18)} c="#ffffff" ow={ow} />
        <rect x={-36} y={-48} width={97} height={10} rx={5} fill={S.lilac} /><rect x={-36} y={-21} width={110} height={10} rx={5} fill={S.lilac} />
        <rect x={-38} y={32} width={43} height={43} rx={12} fill="none" stroke={S.plum} strokeWidth={ow * 1.5} />
        <ScTxt x={-43} y={120} t="Test" size={25} fill={S.plum} />
      </g>}
      <g transform="translate(-350 -340)"><Label text={label} /></g>
    </g>
  );
};

/**
 * THE AUSTIN LAB. A window onto a bright Austin day, a live oak and green hills under a blue sky,
 * framed in rounded mullions, and the company card slides in with its place and date.
 */
export const AustinLabEvidenceV2: React.FC<P> = ({x = 0, y = 0, scale = 1, label = 'Austin', date = 'September 17th', progress = 0, secondary = 0,
  frame = 0}) => {
  const id = useUid();
  const ow = scOw(scale);
  const sway = Math.sin(frame / 40) * 2.5;
  const win = scRR(-360, -220, 720, 410, 34);
  const crown = [[-300, -14, 44], [-262, -52, 50], [-210, -50, 48], [-166, -22, 42], [-240, -10, 46], [-196, 6, 34]];
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5aa8ff" /><stop offset="100%" stopColor="#ffe8c2" />
        </linearGradient>
        <ScLit id={`${id}-hill`} c="#7cc46a" v /><ScBall id={`${id}-oak`} c="#4c9e4e" /><ScLit id={`${id}-fr`} c="#4b3f8f" />
        <clipPath id={`${id}-c`}><path d={win} /></clipPath>
      </defs>
      <ContactShadow x={0} y={200} w={760} opacity={0.3} />
      <g clipPath={`url(#${id}-c)`}>
        <rect x={-360} y={-220} width={720} height={410} fill={`url(#${id}-sky)`} />
        <circle cx={230} cy={-120} r={40} fill="#fff3c4" /><Glow x={230} y={-120} r={140} color="#fff3c4" opacity={0.7} />
        <path d="M-360 120 Q-220 52 -120 121 T80 120 T360 105 V190 H-360Z" fill={line('#7cc46a')} />
        <path d="M-360 126 Q-220 58 -120 127 T80 126 T360 111 V190 H-360Z" fill={`url(#${id}-hill)`} />
        <path d="M-250 160 Q-246 70 -236 -10" stroke={line('#7a4e30')} strokeWidth={22} strokeLinecap="round" fill="none" />
        <path d="M-250 160 Q-246 70 -236 -10" stroke="#8a5a36" strokeWidth={14} strokeLinecap="round" fill="none" />
        <g transform={`translate(${sway} 0)`}>
          {crown.map(([cx, cy, r], k) => <circle key={`o${k}`} cx={cx} cy={cy} r={r + ow * 2} fill={line('#4c9e4e')} />)}
          {crown.map(([cx, cy, r], k) => <circle key={k} cx={cx} cy={cy} r={r} fill={`url(#${id}-oak)`} />)}
        </g>
        <path d="M-330 40 L-200 -220 L-150 -220 L-280 40 Z" fill="#ffffff" opacity={0.14} />
      </g>
      <path d={win} fill="none" stroke={line('#4b3f8f')} strokeWidth={24 + ow * 2} />
      <path d={win} fill="none" stroke={`url(#${id}-fr)`} strokeWidth={24} />
      <path d="M-14 -210 V180" stroke={line('#4b3f8f')} strokeWidth={22 + ow * 2} strokeLinecap="round" />
      <path d="M-14 -210 V180" stroke="#5a4ea6" strokeWidth={22} strokeLinecap="round" />
      <g transform={`translate(${45 + (1 - progress) * 400} 70)`}>
        <ScCard d={scRR(-15, 0, 313, 233, 28)} c="#ffffff" ow={ow} />
        <ScTxt x={14} y={55} t="Si-Ware" size={38} weight={800} />
        <ScTxt x={14} y={101} t="Austin office" size={31} fill={S.plum} />
        <rect x={14} y={124} width={252} height={9} rx={4.5} fill={S.rust} />
        <ScTxt x={14} y={177} t={date} size={28} weight={700} />
      </g>
      <g opacity={secondary} transform="translate(-318 355)"><Label text={label} size={36} /></g>
    </g>
  );
};

/**
 * THE BACKDROP SURFACES. `wall` is a deep plum wall with a soft key light from the upper left and a
 * faint lit rail, `worktop` is a lit bench top in perspective with a bright front edge, and any other
 * mode is a floor rail. Full frame, no place props, as in the library.
 */
export const SpectralSurfaceV2: React.FC<P> = ({x = 0, y = 0, mode = 'wall'}) => {
  const id = useUid();
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <linearGradient id={`${id}-w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2c2152" /><stop offset="100%" stopColor="#170f30" />
        </linearGradient>
        <radialGradient id={`${id}-k`} cx="30%" cy="22%" r="70%"><stop offset="0%" stopColor="#8a6bd6" stopOpacity={0.45} />
          <stop offset="100%" stopColor="#8a6bd6" stopOpacity={0} /></radialGradient>
        <linearGradient id={`${id}-t`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7a66c4" /><stop offset="100%" stopColor="#4a3a8c" />
        </linearGradient>
        <ScLit id={`${id}-r`} c="#7a5ad0" v />
      </defs>
      {mode === 'wall'
        ? <g><rect x={-100} y={-100} width={1280} height={2150} fill={`url(#${id}-w)`} />
          <rect x={-100} y={-100} width={1280} height={2150} fill={`url(#${id}-k)`} />
          <path d="M95 395 H990" stroke="#b49cff" strokeWidth={5} strokeLinecap="round" opacity={0.5} />
          <path d="M95 401 H990" stroke="#0c0820" strokeWidth={4} strokeLinecap="round" opacity={0.4} /></g>
        : mode === 'worktop'
          ? <g><path d="M-140 1500 L80 1280 H1080 L1240 1500Z" fill={`url(#${id}-t)`} />
            <path d="M-140 1500 L80 1280 H1080 L1240 1500Z" fill="#ffffff" opacity={0.06} />
            <path d="M80 1280 H1080" stroke="#c9b8ff" strokeWidth={10} strokeLinecap="round" />
            <path d="M120 1300 H560" stroke="#ffffff" strokeWidth={6} strokeLinecap="round" opacity={0.25} />
            <path d="M-140 1500 H1240" stroke="#2a1d5c" strokeWidth={10} strokeLinecap="round" opacity={0.6} /></g>
          : <g><path d={scRR(-140, 1500, 1400, 32, 16)} fill={`url(#${id}-r)`} />
            <path d="M-120 1506 H1240" stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.35} />
            <path d="M120 1516 l90 -3 M590 1519 l150 5 M1025 1514 l43 6" stroke="#d6c8ff" strokeWidth={3} strokeLinecap="round" opacity={0.6} /></g>}
    </g>
  );
};

/**
 * THE TEACHING STEP. The unknown liquid dish, a bracket that lights mint from it to a dark Unknown
 * panel, and a labelled example card that flies into the panel's slot. Teaching the reference.
 */
export const TrainingExampleV2: React.FC<P> = ({x = 0, y = 0, scale = 1, label = 'Unknown sample needs teaching', progress = 0, secondary = 0,
  tertiary = 0, frame = 0}) => {
  const id = useUid();
  const ow = scOw(scale);
  const br = scBend([[-127, -56], [-127, -180], [227, -180], [227, -56]], 30);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs><linearGradient id={`${id}-p`} x1="0" y1="0" x2="0.4" y2="1"><stop offset="0%" stopColor="#3a2f78" />
        <stop offset="100%" stopColor="#1a1440" /></linearGradient></defs>
      <g transform={`translate(${-185 + 60 * progress} ${80 - 30 * progress}) scale(.8)`}><ScDish liquid mark={S.plum} frame={frame} ow={ow / 0.8} /></g>
      <ScDuo d={br} c={S.lilac} w={ow * 1.6} ow={ow * 0.5} />
      {secondary > 0 && <ScDuo d={br} c={S.mint} w={ow * 2.6} ow={ow * 0.6} pl={1} dash={`${secondary} 1`} />}
      <ContactShadow x={228} y={236} w={320} opacity={0.3} />
      <path d={scRR(80, -56, 296, 282, 30)} fill={line('#3a2f78')} stroke={line('#3a2f78')} strokeWidth={ow * 2} />
      <path d={scRR(80, -56, 296, 282, 30)} fill={`url(#${id}-p)`} />
      <path d={scRR(92, -44, 272, 60, 22)} fill="#ffffff" opacity={0.07} />
      <ScTxt x={229} y={28} t="Unknown" size={36} fill="#ffffff" anchor="middle" halo={S.deep} />
      <rect x={118} y={78} width={220} height={99} rx={22} fill="none" stroke={S.lilac} strokeWidth={ow * 1.2} strokeDasharray={`${ow * 1.4} ${ow * 3.2}`}
        strokeLinecap="round" opacity={0.8} />
      <g transform={`translate(${(1 - tertiary) * -315} ${(1 - tertiary) * 295})`} opacity={Math.min(1, tertiary * 4)}>
        <ScCard d={scRR(112, 71, 232, 116, 22)} c="#ffffff" ow={ow} />
        <ScTxt x={228} y={112} t="Labeled example" size={24} fill={S.plum} anchor="middle" />
        <ScTxt x={228} y={154} t="Whipping cream" size={28} anchor="middle" />
      </g>
      <rect x={-250} y={257} width={575} height={7} rx={3.5} fill={S.plum} />
      <g transform="translate(-330 -310)"><Label text={label} /></g>
      <ScTxt x={-236} y={322} t="Teaching the reference" size={30} fill={S.lilac} halo={S.deep} />
    </g>
  );
};

/** THE APPLICATION RECORD. A lit record card with a folded corner, an empty check box and a pulsing pending dot. */
export const ApplicationRecordV2: React.FC<P> = ({x = 0, y = 0, scale = 1, label = 'Application test', progress = 0, frame = 0}) => {
  const ow = scOw(scale);
  const pend = 0.5 + 0.5 * Math.sin(frame / 8);
  const tw = widthOf('Result pending', 30) * 0.86;
  return (
    <g transform={`translate(${x + 250 * (1 - progress)} ${y}) scale(${scale})`} opacity={Math.min(1, progress * 4)}>
      <ScCard d={scRound([[-170, -190], [135, -190], [182, -142], [182, 214], [-170, 214]], 24)} c="#ffffff" ow={ow} />
      <ScSolid d={scRound([[135, -190], [182, -142], [135, -142]], 10)} c={S.glass} ow={ow * 0.8} />
      <rect x={-128} y={-83} width={258} height={10} rx={5} fill={S.lilac} /><rect x={-128} y={-45} width={226} height={10} rx={5} fill={S.lilac} />
      <rect x={-126} y={27} width={60} height={60} rx={16} fill={mix('#ffffff', S.plum, 0.06)} stroke={S.plum} strokeWidth={ow * 1.6} />
      <g transform="translate(-130 -115)">{wrapToWidth(label, 300, 29).map((t, i) => <ScTxt key={i} x={0} y={i * 38} t={t} size={29} />)}</g>
      <ScTxt x={-126} y={152} t="Result pending" size={30} fill={S.plum} weight={700} />
      <circle cx={-126 + tw + 18} cy={142} r={8 + pend * 4} fill={S.plum} opacity={0.25 * (1 - pend) + 0.1} />
      <circle cx={-126 + tw + 18} cy={142} r={7} fill={S.plum} opacity={0.6 + 0.4 * pend} />
    </g>
  );
};
