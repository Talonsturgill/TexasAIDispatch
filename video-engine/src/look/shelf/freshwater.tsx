import React from 'react';
import {FONT, wrapToWidth} from '../../lib/type';
import {light, line, mix, shade} from '../color';
import {Figure, castV2} from '../Figure';
import {Glow, useUid} from '../Kit';
import {Bloom, Cloud, SkyFill, heap, rr} from './skies';

/**
 * FRESHWATER, LOOK V2 (November 14th, 2026).
 *
 * The freshwater digital twin set from lib/freshwater.tsx redrawn in the v2 idiom. A backdrop (a
 * window on the country, a faint grid, or a floor) and the system diagram in all nine of its modes
 * (a pump that stops, a test, the award, the twin, its inputs, a forecast, the research, the evidence
 * and the workshop). The pump is a lit casing with the impeller turning behind a round window, the
 * network is lit pipe with water flowing through it, the cards are rounded paper with soft shadows,
 * and the proposed twin is drawn as a glowing cyan ghost of the real thing, which says "a model of
 * it" without a word. The workshop's operator is a v2 Figure.
 *
 * UNITS are the library's screen units. The backdrop fills the 1080 by 1920 frame and the system is
 * drawn from (x, y) at `scale`, about 860 wide, the label above it. Every word on it is the library's
 * own or the caller's `label`, and no number is drawn.
 */
const C = {ink: '#1d4a52', water: '#18a2b8', deep: '#0e6a84', paper: '#fbf4e2', line: '#b8c8c0', rust: '#ee6440', sage: '#6caa58',
  white: '#fffcf4', ghost: '#5ff0ff'};
const clip = (x: number) => Math.max(0, Math.min(1, x));
const OW = 3.4;

/** a soft drop shadow under a card, so it lifts off the page */
const Lift: React.FC<{x: number; y: number; w: number; h: number; r?: number}> = ({x, y, w, h, r = 22}) => {
  const id = useUid();
  return <>
    <defs><filter id={`${id}f`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={12} /></filter></defs>
    <path d={rr(x + 8, y + 16, w, h, r)} fill="#1a1236" opacity={0.18} filter={`url(#${id}f)`} />
  </>;
};

/** a rounded paper card with a lit face and a deep tinted edge */
const Card: React.FC<{x: number; y: number; w: number; h: number; r?: number; fill?: string; children?: React.ReactNode}> = ({
  x, y, w, h, r = 22, fill = C.white, children,
}) => {
  const id = useUid();
  return <g>
    <Lift x={x} y={y} w={w} h={h} r={r} />
    <defs><linearGradient id={`${id}g`} x1="0" y1="0" x2="0.3" y2="1"><stop offset="0%" stopColor={light(fill, 0.4)} />
      <stop offset="100%" stopColor={shade(fill, 0.08)} /></linearGradient></defs>
    <path d={rr(x, y, w, h, r)} fill={`url(#${id}g)`} stroke={line(fill)} strokeWidth={OW * 1.4} />
    <path d={`M${x + r} ${y + 9} L${x + w - r} ${y + 9}`} stroke="#ffffff" strokeWidth={5} strokeLinecap="round" opacity={0.8} />
    {children}
  </g>;
};

/** a lit pipe, a deep tinted outline, the pipe colour, and a highlight along its top */
const Pipe: React.FC<{d: string; w: number; c?: string; ghost?: boolean}> = ({d, w, c = '#9fb4c8', ghost}) => ghost
  ? <g><path d={d} fill="none" stroke={C.ghost} strokeWidth={w + 8} strokeLinecap="round" strokeLinejoin="round" opacity={0.22} />
    <path d={d} fill="none" stroke="#1a8aa8" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" opacity={0.5} />
    <path d={d} fill="none" stroke={C.ghost} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="12 8" /></g>
  : <g>
    <path d={d} fill="none" stroke={line(c)} strokeWidth={w + OW * 2} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke={light(c, 0.7)} strokeWidth={w * 0.22} strokeLinecap="round" strokeLinejoin="round" transform={`translate(0 ${-w * 0.22})`} />
  </g>;

/** THE PUMP. A lit casing on a plinth, the impeller turning behind a round window, the pipes in and
 *  out. `stopped` holds the impeller and raises a warning badge. `wire` draws the glowing model of it. */
const PumpV2: React.FC<{x: number; y: number; frame: number; stopped?: boolean; wire?: boolean}> = ({x, y, frame, stopped = false, wire = false}) => {
  const id = useUid();
  const steel = '#7f93b8', casing = '#2f6f94';
  const g = wire;
  const spin = stopped ? 35 : frame * 7;
  const blade = 'M0 -12 Q60 -78 62 -14 Q46 14 8 12 Z';
  return <g transform={`translate(${x} ${y})`}>
    <defs>
      <linearGradient id={`${id}c`} x1="0" y1="0" x2="0.5" y2="1"><stop offset="0%" stopColor={light(casing, 0.5)} />
        <stop offset="45%" stopColor={casing} /><stop offset="100%" stopColor={shade(casing, 0.45)} /></linearGradient>
      <radialGradient id={`${id}w`} cx="0.4" cy="0.35" r="0.7"><stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#d4ecf2" /></radialGradient>
      <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={light(C.water, 0.4)} />
        <stop offset="100%" stopColor={shade(C.water, 0.3)} /></linearGradient>
      <linearGradient id={`${id}p`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={light(C.sage, 0.4)} />
        <stop offset="100%" stopColor={shade(C.sage, 0.35)} /></linearGradient>
    </defs>
    {g && <Bloom x={0} y={0} r={190} color={C.ghost} opacity={0.22} />}
    <Pipe d="M-180 10 L-93 10" w={30} c={steel} ghost={g} />
    <Pipe d="M91 10 L160 10 Q170 10 170 0 L170 -70" w={30} c={steel} ghost={g} />
    {!g && <>
      <Pipe d="M-180 10 L-93 10" w={12} c={C.water} />
      <path d="M-176 10 L-97 10 M95 10 L160 10 Q170 10 170 0 L170 -66" stroke="#ffffff" strokeWidth={4} strokeDasharray="10 18"
        strokeDashoffset={stopped ? 0 : -frame * 3} fill="none" strokeLinecap="round" opacity={0.7} />
    </>}
    <path d="M-70 78 L-92 112 Q-94 118 -86 118 L86 118 Q94 118 92 112 L70 78 Z" fill={g ? C.ghost : `url(#${id}p)`} fillOpacity={g ? 0.12 : 1}
      stroke={g ? C.ghost : line(C.sage)} strokeWidth={g ? 5 : OW * 2} strokeLinejoin="round" strokeDasharray={g ? '12 8' : undefined} />
    <circle r={96} fill={g ? C.ghost : `url(#${id}c)`} fillOpacity={g ? 0.16 : 1} stroke={g ? C.ghost : line(casing)} strokeWidth={g ? 5 : OW * 2}
      strokeDasharray={g ? '12 8' : undefined} />
    {!g && <path d="M-70 -52 A88 88 0 0 1 30 -86" stroke="#ffffff" strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.5} />}
    <circle r={76} fill={g ? 'none' : `url(#${id}w)`} stroke={g ? C.ghost : line('#d4ecf2')} strokeWidth={g ? 4 : OW * 1.4} />
    <g transform={`rotate(${spin})`}>{[0, 72, 144, 216, 288].map((a) => <path key={a} transform={`rotate(${a})`} d={blade}
      fill={g ? C.ghost : `url(#${id}b)`} fillOpacity={g ? 0.18 : 1} stroke={g ? C.ghost : line(C.water)} strokeWidth={g ? 4 : OW * 1.2} strokeLinejoin="round" />)}</g>
    <circle r={17} fill={g ? 'none' : '#2b2a52'} stroke={g ? C.ghost : line('#2b2a52')} strokeWidth={2.4} />
    {!g && <circle cx={-5} cy={-6} r={5} fill="#ffffff" opacity={0.6} />}
    {!g && [-1, 1].map((a) => <circle key={a} cx={a * 70} cy={a * 64} r={6} fill={light(steel, 0.3)} stroke={line(steel)} strokeWidth={2} />)}
    {!g && <path d="M-70 -30 A76 76 0 0 1 -30 -70" stroke="#ffffff" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.7} />}
    {stopped && !g && <g transform="translate(108 62)">
      <Glow x={0} y={0} r={70} color={C.rust} opacity={0.5 + 0.2 * Math.sin(frame / 5)} />
      <path d="M0 -32 L34 26 L-34 26 Z" fill={C.rust} stroke={line(C.rust)} strokeWidth={OW * 2} strokeLinejoin="round" paintOrder="stroke" />
      <path d="M0 -32 L34 26 L-34 26 Z" fill="none" stroke={C.rust} strokeWidth={10} strokeLinejoin="round" />
      <path d="M0 -12 L0 6" stroke={C.white} strokeWidth={6} strokeLinecap="round" /><circle cx={0} cy={16} r={3.6} fill={C.white} />
    </g>}
  </g>;
};

/** THE NETWORK. Lit mains from the plant out to three neighbourhoods, water flowing along them,
 *  round badges for the houses. `alert` runs a warning along each main in turn with a ring at the hub */
const NetworkV2: React.FC<{x: number; y: number; frame: number; p: number; wire?: boolean; alert?: boolean}> = ({x, y, frame, p, wire = false, alert = false}) => {
  const runs = ['M0 0 H210 Q230 0 230 -20 V-95 Q230 -115 250 -115 H365', 'M230 0 H445', 'M230 0 V115 Q230 135 250 135 H380'];
  const all = runs.join(' ');
  return <g transform={`translate(${x} ${y})`}>
    {wire && <Bloom x={220} y={0} r={300} ry={200} color={C.ghost} opacity={0.15} />}
    <Pipe d={all} w={22} c="#a8bccc" ghost={wire} />
    {!wire && <>
      <path d={all} fill="none" stroke={C.water} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
      <path d={all} fill="none" stroke="#ffffff" strokeWidth={4} strokeDasharray="8 26" strokeDashoffset={-frame * 2} strokeLinecap="round"
        strokeLinejoin="round" opacity={0.8} />
    </>}
    {wire && <path d={all} fill="none" stroke={C.ghost} strokeWidth={5} strokeDasharray="4 24" strokeDashoffset={-frame * 2} strokeLinecap="round"
      strokeLinejoin="round" />}
    {alert && runs.map((d, i) => <path key={d} d={d} fill="none" stroke={C.rust} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round"
      pathLength={1} strokeDasharray={`${clip((p - i * 0.22) * 2)} 1`} />)}
    {[[-10, 0], [365, -115], [445, 0], [380, 135]].map(([a, b], i) => {
      const hot = alert && p > i / 5;
      const ring = hot ? C.rust : wire ? C.ghost : C.water;
      return <g key={i} transform={`translate(${a} ${b})`}>
        {hot && <Glow x={0} y={0} r={70} color={C.rust} opacity={0.4} />}
        <circle r={i === 0 ? 36 : 44} fill={wire ? 'none' : C.white} stroke={line(ring)} strokeWidth={wire ? 0 : 10 + OW * 2} />
        <circle r={i === 0 ? 36 : 44} fill={wire ? C.ghost : C.white} fillOpacity={wire ? 0.14 : 1} stroke={ring} strokeWidth={wire ? 5 : 10}
          strokeDasharray={wire ? '9 7' : undefined} />
        {i === 0
          ? <path d="M-18 0 H18 M0 -18 V18" stroke={wire ? C.ghost : C.deep} strokeWidth={8} strokeLinecap="round" />
          : <g><path d="M-20 14 V-4 L0 -22 L20 -4 V14 Z" fill={wire ? 'none' : C.sage} stroke={wire ? C.ghost : line(C.sage)} strokeWidth={wire ? 2.4 : 4}
            strokeLinejoin="round" /><path d={rr(-5, 2, 10, 12, 3)} fill={wire ? 'none' : light(C.sage, 0.6)} /></g>}
      </g>;
    })}
    {alert && <circle cx={230} cy={0} r={35 + clip(p) * 140} fill="none" stroke={C.rust} strokeWidth={6} opacity={0.55 * (1 - clip(p) * 0.5)} />}
  </g>;
};

const T: React.FC<{x: number; y: number; s: number; c?: string; w?: number; a?: 'start' | 'middle'; children: string}> = ({x, y, s, c = C.ink, w = 800, a = 'start', children}) =>
  <text x={x} y={y} fontSize={s} fill={c} fontWeight={w} textAnchor={a} fontFamily={FONT.body}>{children}</text>;

/** a small rounded tag with a word on it, for the labels that sit under a drawing */
const Tag: React.FC<{x: number; y: number; text: string; c: string; s?: number}> = ({x, y, text, c, s = 30}) => {
  const w = text.length * s * 0.66 + 40;
  return <g>
    <path d={rr(x, y - s * 1.05, w, s * 1.5, s * 0.75)} fill={mix(c, '#ffffff', 0.86)} stroke={mix(c, '#ffffff', 0.4)} strokeWidth={3} />
    <circle cx={x + 20} cy={y - s * 0.3} r={6} fill={c} />
    <T x={x + 34} y={y} s={s} c={shade(c, 0.25)}>{text}</T>
  </g>;
};

/** THE BACKDROPS, `window` a warm wall with a window on rolling country and a swaying tree, `grid` a
 *  faint rounded drafting grid, anything else a floor */
export const FreshwaterBackdropV2: React.FC<{x?: number; y?: number; mode?: string; frame?: number}> = ({mode = 'window', frame = 0}) => {
  const id = useUid();
  if (mode === 'grid') {
    return <g opacity={0.3}>
      {Array.from({length: 13}, (_, i) => <path key={i} d={`M40 ${450 + i * 65} H1020 M${40 + i * 80} 420 V1320`} stroke={C.sage} strokeWidth={2}
        strokeLinecap="round" />)}
      {Array.from({length: 13 * 13}, (_, k) => <circle key={`d${k}`} cx={40 + (k % 13) * 80} cy={450 + Math.floor(k / 13) * 65} r={4} fill={C.sage} />)}
    </g>;
  }
  if (mode !== 'window') {
    return <g>
      <defs><linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c8a478" />
        <stop offset="100%" stopColor="#8e6c4e" /></linearGradient></defs>
      <path d={rr(-100, 1370, 1280, 140, 30)} fill={`url(#${id}f)`} />
      <path d="M-100 1372 H1180" stroke={line('#c8a478')} strokeWidth={10} strokeLinecap="round" />
      <path d="M-100 1384 H1180" stroke="#ffe8c8" strokeWidth={5} strokeLinecap="round" opacity={0.6} />
      <path d="M150 1404 l70 4 M715 1416 l97 -4" stroke={shade('#c8a478', 0.3)} strokeWidth={6} strokeLinecap="round" />
    </g>;
  }
  const sway = Math.sin(frame / 40) * 3;
  const tree = heap(915, 640, 190, 170, 7, frame, {rows: 3, taper: 0.4, boil: 0.015});
  return <g>
    <defs>
      <linearGradient id={`${id}wall`} x1="0" y1="0" x2="0.3" y2="1"><stop offset="0%" stopColor="#fff8e8" /><stop offset="100%" stopColor="#efe2c6" /></linearGradient>
      <linearGradient id={`${id}fr`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor="#d8d0c0" /></linearGradient>
      <linearGradient id={`${id}h1`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#b4d488" /><stop offset="100%" stopColor="#7aa85a" /></linearGradient>
      <linearGradient id={`${id}h2`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8cc068" /><stop offset="100%" stopColor="#4e8a46" /></linearGradient>
      <clipPath id={`${id}win`}><path d={rr(620, 360, 380, 650, 30)} /></clipPath>
    </defs>
    <rect width={1080} height={1920} fill={`url(#${id}wall)`} />
    <Bloom x={810} y={700} r={600} color="#fff2c8" opacity={0.5} />
    <g clipPath={`url(#${id}win)`}>
      <SkyFill x={600} y={340} w={420} h={700} stops={[[0, '#4a94ec'], [0.55, '#9cc8f4'], [0.85, '#ffeccc'], [1, '#ffe4b8']]} />
      <Bloom x={690} y={440} r={160} color="#fff6d0" opacity={0.8} />
      <circle cx={690} cy={440} r={30} fill="#fffbe6" />
      <g transform={`translate(${(frame * 0.3) % 80} 0)`}><Cloud blobs={heap(740, 520, 140, 50, 3, frame, {rows: 1, taper: 0}).blobs}
        base={heap(740, 520, 140, 50, 3, frame, {rows: 1, taper: 0}).base} /></g>
      <path d="M600 860 Q700 790 820 830 Q930 790 1020 840 L1020 1040 L600 1040 Z" fill={`url(#${id}h1)`} stroke={line('#7aa85a')} strokeWidth={OW * 2}
        strokeLinejoin="round" />
      <path d="M600 920 Q735 840 1020 905 L1020 1040 L600 1040 Z" fill={`url(#${id}h2)`} stroke={line('#4e8a46')} strokeWidth={OW * 2} strokeLinejoin="round" />
      <path d="M912 912 Q906 760 916 640" stroke={line('#7a5232')} strokeWidth={22 + OW * 2} strokeLinecap="round" fill="none" />
      <path d="M912 912 Q906 760 916 640" stroke="#8a6040" strokeWidth={22} strokeLinecap="round" fill="none" />
      <g transform={`rotate(${sway} 912 900)`}><Cloud blobs={tree.blobs} tone={{lit: '#a8dc6a', mid: '#6aae48', shade: '#3e7a40', base: '#2a5a3a'}}
        sheen={0.3} /></g>
    </g>
    {/* the frame, the mullions and the sill, all one lit piece */}
    <path d={`${rr(606, 346, 408, 678, 38)} ${rr(624, 364, 372, 642, 26)}`} fillRule="evenodd" fill={`url(#${id}fr)`} stroke={line('#e8e0d0')}
      strokeWidth={OW * 2} />
    <path d="M810 364 V1006 M624 676 H996" stroke={line('#e8e0d0')} strokeWidth={18 + OW * 2} strokeLinecap="round" />
    <path d="M810 364 V1006 M624 676 H996" stroke="#fbf8f0" strokeWidth={18} strokeLinecap="round" />
    <path d={rr(590, 1018, 440, 34, 17)} fill="#fbf8f0" stroke={line('#e8e0d0')} strokeWidth={OW * 2} paintOrder="stroke" />
    <path d="M610 1026 L1010 1026" stroke="#ffffff" strokeWidth={5} strokeLinecap="round" />
    <path d={rr(600, 1050, 420, 26, 13)} fill="#1a1236" opacity={0.08} />
  </g>;
};

/** THE FRESHWATER SYSTEM in its nine modes, the label above, the drawing below it */
export const FreshwaterSystemV2: React.FC<{x?: number; y?: number; scale?: number; frame?: number; progress?: number; mode?: string; label?: string}> = ({
  x = 0, y = 0, scale = 1, frame = 0, progress = 0, mode = 'stop', label = 'Freshwater system',
}) => {
  const p = clip(progress), show = clip(p * 3);
  const stopped = (mode === 'stop' && p > 0.12) || mode === 'test';
  const bob = (i: number) => Math.sin(frame / 20 + i) * 9;
  return <g transform={`translate(${x} ${y}) scale(${scale})`} fontFamily={FONT.body}>
    {wrapToWidth(label, 860, 34, true).map((ln, i) => <T key={i} x={10} y={-65 + i * 42} s={34} c={C.ink}>{ln}</T>)}
    {(mode === 'stop' || mode === 'test') && <g>
      <Pipe d="M410 220 V275 Q410 290 425 290 H450" w={24} c="#a8bccc" />
      <path d="M410 220 V275 Q410 290 425 290 H450" stroke={C.water} strokeWidth={10} fill="none" strokeLinecap="round" />
      <PumpV2 x={240} y={290} frame={frame} stopped={stopped} />
      <NetworkV2 x={450} y={290} p={mode === 'test' ? 0 : p} frame={mode === 'test' ? 0 : frame} alert={mode === 'stop' && stopped} />
      <Tag x={60} y={500} text={mode === 'test' ? 'REAL ASSET' : 'LOCAL FAULT'} c={mode === 'test' ? C.deep : C.rust} s={34} />
      {mode === 'test' && <g opacity={show}>
        <Card x={550} y={455} w={290} h={145} fill="#f2fbfc">
          <T x={575} y={512} s={30} c={C.deep}>MODEL</T>
          <T x={575} y={560} s={28} c={C.rust}>PROOF STILL DUE</T>
        </Card>
      </g>}
    </g>}
    {mode === 'award' && <g>
      <g transform={`translate(${35 + (1 - show) * 350} 50) rotate(${-5 + show * 5})`}>
        <Lift x={0} y={0} w={550} h={440} />
        <path d="M22 0 H480 Q490 0 497 7 L543 53 Q550 60 550 70 V418 Q550 440 528 440 H22 Q0 440 0 418 V22 Q0 0 22 0 Z" fill={C.white}
          stroke={line(C.white)} strokeWidth={OW * 1.6} />
        <path d="M488 3 V52 Q488 64 500 64 H548" fill="#efe6d2" stroke={line(C.white)} strokeWidth={3} strokeLinejoin="round" />
        <path d={rr(30, 30, 200, 16, 8)} fill={C.water} />
        <T x={35} y={90} s={30} c={C.deep}>NSF RESEARCH</T>
        <T x={35} y={146} s={39} c={C.ink}>Texas A&amp;M</T>
        <T x={35} y={194} s={26} c={C.ink} w={600}>Engineering Experiment Station</T>
        <T x={35} y={248} s={30} c={C.ink} w={600}>College Station</T>
        <path d="M35 285 H465 M35 315 H400" stroke={C.line} strokeWidth={10} strokeLinecap="round" />
        <Tag x={35} y={392} text="PROJECT START" c={C.water} s={32} />
      </g>
      <g transform="translate(645 420) scale(.65)"><PumpV2 x={0} y={0} frame={frame} /></g>
    </g>}
    {mode === 'twin' && <g>
      <Tag x={25} y={60} text="PHYSICAL ASSETS" c={C.deep} s={30} />
      <g transform="translate(130 210) scale(.65)"><PumpV2 x={0} y={0} frame={frame} /><NetworkV2 x={200} y={0} p={p} frame={frame} /></g>
      <path d="M55 345 H840" stroke={C.line} strokeWidth={5} strokeLinecap="round" strokeDasharray="2 14" />
      <g opacity={show}>
        <Tag x={25} y={410} text="PROPOSED DIGITAL TWIN" c={C.water} s={30} />
        <g transform="translate(130 560) scale(.65)"><PumpV2 x={0} y={0} frame={frame} wire /><NetworkV2 x={200} y={0} p={p} frame={frame} wire /></g>
      </g>
    </g>}
    {mode === 'inputs' && <g>
      {['SENSORS', 'WEATHER', 'MAINTENANCE'].map((t, i) => <g key={t}>
        <path d={`M${145 + i * 290} ${285 + bob(i)} V${360 - i * 12} L${455} 430`} stroke={C.water} strokeWidth={7} fill="none" strokeDasharray="12 10"
          strokeDashoffset={-frame * 2} strokeLinecap="round" strokeLinejoin="round" />
        <g transform={`translate(${20 + i * 290} ${90 + bob(i)})`}>
          <Card x={0} y={0} w={250} h={190}>
            {i === 0 ? <path d="M35 95 H65 L85 50 L115 140 L145 75 H210" fill="none" stroke={C.water} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
              : i === 1 ? <g>
                <Cloud blobs={[{cx: 95, cy: 82, rx: 40, ry: 32}, {cx: 140, cy: 70, rx: 42, ry: 38}, {cx: 175, cy: 88, rx: 32, ry: 26}]}
                  base={{x0: 62, x1: 200, y: 112, h: 30}} tone={{lit: '#ffffff', mid: '#d8e4f0', shade: '#94a8c8', base: '#6a7ea8'}} ow={2.4} />
                {[80, 120, 160].map((xx, k) => { const q = ((frame / 12 + k * 0.33) % 1);
                  return <path key={xx} d={`M${xx - q * 8} ${120 + q * 24} l-6 16`} stroke={C.water} strokeWidth={6} strokeLinecap="round" opacity={1 - q} />; })}
              </g>
              : <g><path d={rr(62, 40, 126, 92, 14)} fill="#eef6ee" stroke={C.sage} strokeWidth={7} />
                <path d="M84 70 H164 M84 98 H146" stroke={C.sage} strokeWidth={8} strokeLinecap="round" /></g>}
            <T x={125} y={170} s={25} c={C.ink} a="middle">{t}</T>
          </Card>
        </g>
      </g>)}
      <g transform="translate(460 560) scale(.75)"><PumpV2 x={0} y={0} frame={frame} wire /></g>
    </g>}
    {mode === 'forecast' && <g>
      <Tag x={20} y={45} text="PHYSICAL NETWORK" c={C.deep} s={30} />
      <g transform="translate(100 200) scale(1.1)"><NetworkV2 x={0} y={0} frame={0} p={0} /></g>
      <Tag x={20} y={420} text="PROPOSED MODEL PREVIEW" c={C.water} s={30} />
      <g transform="translate(100 570) scale(1.1)"><NetworkV2 x={0} y={0} frame={frame} p={p} wire alert /></g>
    </g>}
    {mode === 'research' && <g>
      <g transform={`translate(${210 - show * 45} 230) scale(.8)`}><PumpV2 x={0} y={0} frame={frame} wire /></g>
      <path d="M420 60 V610" stroke={C.rust} strokeWidth={7} strokeDasharray="2 16" strokeLinecap="round" />
      <g opacity={show}>
        <Card x={490} y={145} w={345} h={340}>
          <path d="M545 410 Q585 300 620 230 Q650 300 680 370 Q730 260 780 200" stroke={C.line} strokeWidth={9} fill="none" strokeDasharray="14 12"
            strokeLinecap="round" />
          {[[545, 410], [620, 230], [680, 370], [780, 200]].map(([a, b2]) => <circle key={a} cx={a} cy={b2} r={9} fill={C.white} stroke={C.line} strokeWidth={5} />)}
        </Card>
        <Tag x={500} y={555} text="NO UTILITY ROLLOUT" c={C.rust} s={28} />
      </g>
      <Tag x={30} y={530} text="RESEARCH MODEL" c={C.water} s={30} />
    </g>}
    {mode === 'evidence' && <g>
      <g transform="translate(195 275) scale(.8)"><PumpV2 x={0} y={0} frame={frame} /></g>
      <Card x={420 + (1 - show) * 200} y={90} w={430} h={450}>
        <path d={`M${470 + (1 - show) * 200} 170 H${795 + (1 - show) * 200} M${470 + (1 - show) * 200} 210 H${760 + (1 - show) * 200}`} stroke={C.line}
          strokeWidth={10} strokeLinecap="round" />
        <path d={rr(475 + (1 - show) * 200, 270, 305, 170, 24)} fill={mix(C.rust, '#ffffff', 0.9)} stroke={C.rust} strokeWidth={5} strokeDasharray="14 10" />
        <T x={500 + (1 - show) * 200} y={345} s={28} c={C.rust}>RESULT NOT</T>
        <T x={500 + (1 - show) * 200} y={388} s={28} c={C.rust}>REPORTED</T>
        <T x={475 + (1 - show) * 200} y={495} s={26} c={C.ink}>SERVICE IMPROVEMENT</T>
      </Card>
    </g>}
    {mode === 'workshop' && <g>
      <g transform="translate(185 240) scale(.6)"><PumpV2 x={0} y={0} frame={frame} wire /></g>
      <path d="M320 250 H560" stroke={C.water} strokeWidth={10} strokeDasharray="15 12" strokeDashoffset={-frame * 2} strokeLinecap="round" />
      <g transform={`translate(${320 + clip((p - 0.15) * 1.5) * 170} ${240 - Math.sin(p * Math.PI) * 25})`}>
        <Card x={-36} y={-44} w={72} h={88} r={14}>
          <path d="M-20 -20 H20 M-20 0 H14 M-20 20 H20" stroke={C.water} strokeWidth={6} strokeLinecap="round" />
        </Card>
      </g>
      <Figure {...castV2('operator')} frame={frame} x={650 - (1 - show) * 80} y={405} scale={0.62} pose="point" emotion="worried" />
      <Tag x={40} y={515} text="PLANNED OPERATOR TOOLS" c={C.deep} s={32} />
      <T x={40} y={575} s={30} c={C.water}>WORKSHOPS AND OPEN SOURCE</T>
    </g>}
  </g>;
};

export const FRESHWATER_V2 = ['FreshwaterBackdropV2', 'FreshwaterSystemV2'] as const;
