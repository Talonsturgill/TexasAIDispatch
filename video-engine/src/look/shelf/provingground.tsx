import React from 'react';
import {FONT, wrapToWidth} from '../../lib/type';
import {light, line, shade} from '../color';
import {Glow, useUid} from '../Kit';
import {Figure, castV2} from '../Figure';
import {Oak} from '../regions';
import {Cyl, Lit, Pass, Sheen, f1, pt, rp, rr, st} from './compute';
import type {Pt} from './compute';

/**
 * PROVING GROUND, LOOK V2 (November 14th, 2026).
 *
 * The engineered rock test cutaways from lib/provingground.tsx, redrawn on the v2 rules. These are
 * editorial cutaways with no physical dimension claims (every field test is a proposal illustration,
 * not footage and not a measured trace), so like the library they place in screen units with `x`, `y`,
 * `scale`, and the library's modes and its `a`, `b`, `c` beat controls are kept exactly. The core is
 * never healed.
 *
 * What changes is the drawing. The rock core is a faceted, lit block with copper inclusions that catch
 * the light, the drill bit is a lit steel shaft with cutters that turn, the mast is a rounded lattice with
 * a blinking crown light, the walls of the well are layered strata with pebbles, and every part carries
 * its own deep outline. The engineer in 'training' is a v2 Figure. The palette moves from the library's
 * teal night to the v2 indigo night with warmer sand and copper.
 */
const C = {night: '#1f2454', deep: '#161a44', paper: '#fff4e0', sand: '#f2c88a', clay: '#c27a52', copper: '#ff9a5a', sage: '#7fc49a',
  steel: '#c3cbe2', muted: '#5a62a8'};
export const PROVING_V2_PALETTE = C;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const OW = 3.4;

/** THE CORE, a faceted rock block lit from the upper left, copper inclusions, strata, and the cut */
const CoreV2: React.FC<{x: number; y: number; size?: number; cut?: number; variant?: boolean; wire?: boolean; ow: number; frame?: number}> = ({
  x, y, size = 1, cut = 0, variant = false, wire = false, ow, frame = 0,
}) => {
  const id = useUid();
  const o = ow / size;
  const shell: Pt[] = [[-95, -95], [62, -113], [112, -56], [102, 100], [-65, 121], [-111, 64]];
  const d = rp(shell, 12);
  if (wire) return <g transform={`translate(${f1(x)} ${f1(y)}) scale(${size})`}>
    <path d={d} fill={C.sage} opacity={0.12} />
    <path d={d} fill="none" stroke={C.sage} strokeWidth={5} strokeDasharray="14 10" strokeLinecap="round" strokeDashoffset={-frame * 0.6} />
  </g>;
  const gems: Pt[] = [[0, -73], [57, -62], [-22, -14], [60, 17], [-26, 73], [49, 85], [-67, 30]];
  return <g transform={`translate(${f1(x)} ${f1(y)}) scale(${size})`}>
    <defs><Lit id={`${id}-r`} c={C.clay} x2={0.7} /><Lit id={`${id}-cu`} c={C.copper} /></defs>
    <Pass ow={o} parts={[pt(d, `url(#${id}-r)`, C.clay)]} />
    <path d={rp([[-95, -95], [-62, -48], [-65, 121], [-111, 64]], 8)} fill={shade(C.clay, 0.35)} opacity={0.75} />
    <path d={rp([[-95, -95], [62, -113], [112, -56], [-62, -48]], 10)} fill={C.sand} />
    <path d="M-80 -92 L50 -106" stroke="#ffffff" strokeWidth={5} strokeLinecap="round" opacity={0.5} />
    <path d="M-59 -31 Q-20 -14 18 -8 Q46 -24 70 -48 M-66 36 Q-34 52 -4 58 Q40 48 83 27 M-34 100 Q2 92 41 88" fill="none" stroke={shade(C.clay, 0.45)}
      strokeWidth={4} strokeLinecap="round" />
    {gems.map(([a, b], i) => {
      const gx = a + (variant ? 12 : 0), s = 14 + (i % 3) * 4;
      const glint = Math.max(0, Math.sin(frame / 9 + i * 1.7));
      return <g key={i}>
        <path d={rp([[gx, b], [gx + s, b - 8], [gx + s + 9, b + 7], [gx + s - 7, b + 19]], 3)} fill={`url(#${id}-cu)`} stroke={line(C.copper)}
          strokeWidth={o * 1.2} strokeLinejoin="round" />
        <circle cx={gx + s * 0.6} cy={b - 1} r={2.4 + glint * 2} fill="#ffffff" opacity={0.5 + glint * 0.5} />
      </g>;
    })}
    {cut > 0 && <g>
      <path d={rr(-10, -104, 36, cut * 187 + 2, 10)} fill={line(C.deep)} />
      <path d={rr(-6, -102, 28, cut * 187, 8)} fill={C.deep} />
      <path d={`M-2 -96 L-2 ${f1(-104 + cut * 187)}`} stroke={C.steel} strokeWidth={3} strokeLinecap="round" opacity={0.6} />
    </g>}
  </g>;
};

/** THE BIT, a lit steel shaft and head, collars, and copper cutters that turn with `spin` */
const BitV2: React.FC<{x: number; y: number; spin?: number; wire?: boolean; shaft?: number; ow: number}> = ({x, y, spin = 0, wire = false, shaft = 270, ow}) => {
  const id = useUid();
  const head = rp([[-18, -40], [18, -40], [40, -20], [29, 25], [0, 43], [-29, 25], [-40, -20]], [6, 6, 10, 10, 10, 10, 10]);
  if (wire) return <g transform={`translate(${f1(x)} ${f1(y)})`}>
    <path d={`M-18 ${-shaft} L-18 -40 M18 ${-shaft} L18 -40`} stroke={C.sage} strokeWidth={5} strokeDasharray="8 7" strokeLinecap="round" />
    <path d={head} fill="none" stroke={C.sage} strokeWidth={5} strokeDasharray="8 7" />
  </g>;
  return <g transform={`translate(${f1(x)} ${f1(y)})`}>
    <defs><Cyl id={`${id}-s`} c={C.steel} /><Lit id={`${id}-h`} c={C.steel} x2={0.8} /></defs>
    <Pass ow={ow} parts={[
      pt(rr(-18, -shaft, 36, shaft - 30, 8), `url(#${id}-s)`, C.steel),
      pt(head, `url(#${id}-h)`, C.steel),
      ...[-100, -118, -136].map((cy) => pt(rr(-26, cy - 6, 52, 12, 6), C.muted, C.muted)),
    ]} />
    {[-21, 0, 21].map((n, i) => <path key={n} d={`M${n} -27 L${f1(n + Math.sin(spin + i) * 8)} 23`} stroke={C.copper} strokeWidth={7} strokeLinecap="round" />)}
    <path d={`M-10 ${-shaft + 8} L-10 -46`} stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.45} />
  </g>;
};

/** THE MAST, a rounded steel lattice on a clay pad, the copper line down its middle, a blinking crown light */
const MastV2: React.FC<{x: number; y: number; size?: number; ow: number; frame?: number}> = ({x, y, size = 1, ow, frame = 0}) => {
  const o = ow / size;
  const lattice = 'M-90 0 L-30 -420 H30 L90 0 M-69 -100 H69 M-58 -200 H58 M-43 -300 H43 M-69 -100 L58 -200 L-43 -300 L30 -420 M69 -100 L-58 -200 L43 -300 L-30 -420';
  const blink = Math.floor(frame / 15) % 2 === 0;
  return <g transform={`translate(${f1(x)} ${f1(y)}) scale(${size})`}>
    <path d={lattice} fill="none" stroke={line(C.steel)} strokeWidth={12 + o * 2} strokeLinecap="round" strokeLinejoin="round" />
    <path d={lattice} fill="none" stroke={C.steel} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M-86 -10 L-28 -414" stroke="#ffffff" strokeWidth={3} strokeLinecap="round" opacity={0.5} />
    <Pass ow={o} parts={[pt(rr(-125, 0, 250, 50, 16), C.clay, C.clay), pt(rr(-40, -440, 80, 26, 10), C.muted, C.muted)]} />
    <path d="M-110 8 L100 8" stroke="#ffffff" strokeWidth={5} strokeLinecap="round" opacity={0.35} />
    <path d="M0 -414 V60" stroke={C.copper} strokeWidth={5} strokeLinecap="round" />
    <circle cx={0} cy={-452} r={10} fill={blink ? '#ff4d5e' : shade('#ff4d5e', 0.5)} />
    {blink && <Glow x={0} y={-452} r={36} color="#ff4d5e" opacity={0.6} />}
  </g>;
};

const Mark: React.FC<{text: string; x: number; y: number; size?: number; color?: string}> = ({text, x, y, size = 29, color = C.paper}) =>
  <text x={x} y={y} fontSize={size} fontFamily={FONT.body} fontWeight={700} fill={color} letterSpacing={size > 40 ? 0 : 1}>{text}</text>;

/** a rounded copper arrow along a path, for the beat's direction marks */
const Arrow: React.FC<{d: string; head: string; w?: number; c?: string}> = ({d, head, w = 8, c = C.copper}) => <g>
  <path d={d} fill="none" stroke={line(c)} strokeWidth={w + OW * 2} strokeLinecap="round" strokeLinejoin="round" />
  <path d={head} fill="none" stroke={line(c)} strokeWidth={w + OW * 2} strokeLinecap="round" strokeLinejoin="round" />
  <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  <path d={head} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
</g>;

// ===================================================================================== BACKDROP

/**
 * THE TESTBENCH BACKDROP, the library's four layers. 'haze' is the indigo night with a soft lit band,
 * 'oak' the low sage rise with three v2 live oaks swaying, 'bench' the deep bench with its copper edge,
 * anything else the far deep ground.
 */
export const TestbenchBackdropV2: React.FC<{mode?: string; frame?: number}> = ({mode = 'haze', frame = 0}) => {
  const id = useUid();
  if (mode === 'haze') return <g>
    <defs><linearGradient id={`${id}-n`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2a2f6a" /><stop offset="60%" stopColor={C.night} />
      <stop offset="100%" stopColor={C.deep} /></linearGradient></defs>
    <rect x={-900} y={-800} width={2900} height={3400} fill={`url(#${id}-n)`} />
    <path d="M-500 420 Q350 275 1400 430 V720 H-500 Z" fill="#8a7fe0" opacity={0.16} />
    <path d="M-500 470 Q350 340 1400 480" stroke="#ffd2bc" strokeWidth={6} fill="none" opacity={0.12} />
  </g>;
  if (mode === 'oak') return <g>
    <defs><Lit id={`${id}-g`} c={C.sage} x2={0} a={0.3} b={0.4} /></defs>
    <path d="M-500 1170 Q300 1090 1600 1200 V2050 H-500 Z" fill={line(C.sage)} transform="translate(0 -6)" />
    <path d="M-500 1170 Q300 1090 1600 1200 V2050 H-500 Z" fill={`url(#${id}-g)`} />
    <path d="M-500 1178 Q300 1098 1600 1208" stroke="#ffffff" strokeWidth={6} fill="none" opacity={0.25} />
    {[140, 880, 1280].map((x, i) => <Oak key={x} x={x} y={1150 + (i % 2) * 15} s={0.42} depth={0.2} seed={i + 3} frame={frame} />)}
  </g>;
  if (mode === 'bench') return <g>
    <defs><linearGradient id={`${id}-b`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#262b62" /><stop offset="100%" stopColor={C.deep} /></linearGradient></defs>
    <path d="M-700 1220 L1400 1190 V1460 H-700 Z" fill={`url(#${id}-b)`} />
    <path d="M-700 1220 L1400 1190" stroke={C.copper} strokeWidth={6} strokeLinecap="round" />
    <path d="M95 1285 L174 1276 M698 1245 L820 1242" stroke={C.clay} strokeWidth={6} strokeLinecap="round" />
  </g>;
  return <g opacity={0.75}>
    <path d="M-500 1605 L1350 1535 V2100 H-500 Z" fill={C.deep} />
    <path d="M35 1610 L310 1591" stroke={C.sand} strokeWidth={6} strokeLinecap="round" />
  </g>;
};

// ===================================================================================== RIG

/**
 * THE PROVING GROUND RIG, every mode of the library. 'well' lowers a core into the cased hole and names
 * it, 'drill' cuts it with the bit and runs the copper signal up to the schematic, 'close' lifts the cut
 * core out and brings the next one in, 'field' is the Navasota test centre with its mast and trailer,
 * 'mould' the two halves of the conceptual assembly, 'tools' the oilfield bit crossing to mining tests,
 * 'training' the engineer at the twin, 'award' the folder, 'limit' the results card. The label is wrapped
 * at the top and the cutaway is clipped to the library's aperture.
 */
export const ProvingGroundRigV2: React.FC<{x?: number; y?: number; scale?: number; frame?: number; mode?: string; label?: string; a?: number; b?: number;
  c?: number}> = ({x = 0, y = 0, scale = 1, frame = 0, mode = 'well', label = 'Engineered rock test', a: a0 = 0, b: b0 = 0, c: c0 = 0}) => {
  const id = useUid();
  const a = clamp(a0), b = clamp(b0), c = clamp(c0);
  const ow = OW / scale;
  const well = ['well', 'drill', 'close'].includes(mode);
  const strata = [130, 225, 360, 475, 575];
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <defs>
      <clipPath id={`${id}-ap`}><rect x={-30} y={20} width={940} height={710} rx={30} /></clipPath>
      <Lit id={`${id}-rock`} c={C.clay} x2={0.2} a={0.25} b={0.4} /><Cyl id={`${id}-cas`} c={C.steel} />
      <Lit id={`${id}-sand`} c={C.sand} /><Lit id={`${id}-paper`} c={C.paper} a={0.2} b={0.15} />
    </defs>
    {wrapToWidth(label, 800, 32, true).map((ln, i) => <text key={i} x={0} y={-35 + i * 40} fontSize={32} fill={C.paper} fontWeight={800}
      fontFamily={FONT.body}>{ln}</text>)}
    <g clipPath={`url(#${id}-ap)`}>
      {well && <g>
        <Pass ow={ow} parts={[pt(rr(45, 50, 300, 640, 18), `url(#${id}-rock)`, C.clay), pt(rr(525, 50, 275, 640, 18), `url(#${id}-rock)`, C.clay)]} />
        {strata.map((v, i) => <path key={v} d={`M45 ${v} Q180 ${v - 22} 345 ${v + 12} M525 ${v + 12} Q655 ${v - 25} 800 ${v - 10}`} fill="none"
          stroke={i % 2 ? C.sand : shade(C.clay, 0.45)} strokeWidth={10} strokeLinecap="round" opacity={0.7} />)}
        {Array.from({length: 14}, (_, i) => {
          const px = i % 2 ? 560 + ((i * 53) % 220) : 70 + ((i * 47) % 250), py = 100 + ((i * 97) % 500);
          return <ellipse key={i} cx={px} cy={py} rx={9 + (i % 3) * 3} ry={6 + (i % 2) * 2} fill={i % 3 ? light(C.clay, 0.25) : shade(C.clay, 0.3)} />;
        })}
        <Pass ow={ow} parts={[pt(rr(330, 35, 18, 620, 9), `url(#${id}-cas)`, C.steel), pt(rr(522, 35, 18, 620, 9), `url(#${id}-cas)`, C.steel),
          pt(rr(36, 40, 318, 20, 10), C.sage, C.sage), pt(rr(516, 40, 294, 20, 10), C.sage, C.sage)]} />
        <path d={rr(348, 35, 174, 620, 4)} fill={C.deep} opacity={0.55} />
        <path d="M56 46 L330 46 M528 46 L796 46" stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.4} />
        {mode === 'well' && <g>
          <path d={`M435 -20 V${f1(80 + a * 325)}`} stroke={C.copper} strokeWidth={7} strokeLinecap="round" />
          <CoreV2 x={435} y={105 + a * 320} size={0.61} ow={ow} frame={frame} />
          <path d={`M393 ${f1(78 + a * 320)} L435 ${f1(40 + a * 320)} L475 ${f1(78 + a * 320)}`} fill="none" stroke={C.steel} strokeWidth={7}
            strokeLinecap="round" strokeLinejoin="round" />
          <g opacity={b}>
            <CoreV2 x={155} y={345} size={0.56} ow={ow} frame={frame} />
            <path d="M90 205 L292 205 L395 383" fill="none" stroke={C.copper} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
            <path d={rr(56, 118, 240, 84, 16)} fill={C.deep} opacity={0.85} />
            <Mark text="ENGINEERED" x={68} y={153} size={26} /><Mark text="MINERAL ROCK" x={68} y={188} size={26} />
          </g>
        </g>}
        {mode === 'drill' && <g>
          <CoreV2 x={435} y={480} size={0.69} cut={a * 0.7} ow={ow} frame={frame} />
          <BitV2 x={435} y={288 + a * 140 - c * 155} spin={frame * 0.3 * (1 - c)} ow={ow} />
          {c < 0.5 && a > 0.05 && Array.from({length: 5}, (_, i) => {
            const t = ((frame * 0.07 + i / 5) % 1);
            return <circle key={i} cx={f1(435 + (i % 2 ? 1 : -1) * (30 + t * 60))} cy={f1(330 + a * 140 - t * 50)} r={5 - t * 3} fill={C.sand} opacity={1 - t} />;
          })}
          <path d="M565 550 V140 H739" fill="none" stroke={C.muted} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M565 550 V140 H739" pathLength={1} fill="none" stroke={C.copper} strokeWidth={9} strokeDasharray={`${b} 1`} strokeLinecap="round"
            strokeLinejoin="round" />
          <Glow x={565} y={550} r={44} color={C.copper} opacity={0.5} />
          <circle cx={565} cy={550} r={15 + Math.sin(b * Math.PI) * 12} fill={C.copper} stroke={line(C.copper)} strokeWidth={ow * 2} />
          <g opacity={b}>
            <Pass ow={ow} parts={[pt(rr(628, 64, 150, 154, 18), C.deep, C.steel)]} />
            <path d={rr(632, 68, 142, 146, 15)} fill="none" stroke={C.muted} strokeWidth={3} />
            <path d="M645 180 L668 154 L688 166 L709 111 L729 135 L759 105" fill="none" stroke={C.copper} strokeWidth={7} strokeLinecap="round"
              strokeLinejoin="round" />
            <circle cx={759} cy={105} r={7} fill={C.copper} />
            <Mark text="SCHEMATIC" x={640} y={52} size={25} />
          </g>
          <g opacity={c}>
            <Arrow d="M103 514 A93 93 0 1 1 247 424" head="M221 417 L259 420 L247 459" w={9} c={C.paper} />
            <Mark text="REPEAT TEST" x={67} y={590} size={25} />
          </g>
        </g>}
        {mode === 'close' && <g>
          <CoreV2 x={435 - a * 275} y={480 - a * 280} size={0.61} cut={0.75} ow={ow} frame={frame} />
          <path d={`M435 -20 V${f1(150 - a * 30)}`} stroke={C.copper} strokeWidth={6} strokeLinecap="round" />
          <BitV2 x={435} y={270 - a * 390} spin={0} ow={ow} />
          <g transform={`translate(${f1(b * 247)} ${f1(-b * 390 + c * 365)})`}>
            <CoreV2 x={188} y={485} size={0.65} variant ow={ow} frame={frame} />
            <Pass ow={ow} parts={[pt(rr(87, 585, 210, 30, 12), `url(#${id}-cas)`, C.steel)]} />
          </g>
          <g opacity={b}>
            <Mark text="NEXT TEST" x={66} y={395} size={28} />
            <Arrow d="M252 500 Q303 500 323 421" head="M305 435 L329 414 L332 446" />
          </g>
        </g>}
      </g>}
      {mode === 'field' && <g>
        <path d="M0 485 Q290 465 850 480 V700 H0 Z" fill={line(C.clay)} transform="translate(0 -6)" />
        <path d="M0 485 Q290 465 850 480 V700 H0 Z" fill={`url(#${id}-rock)`} />
        <path d="M0 492 Q290 472 850 487" stroke={C.sand} strokeWidth={6} fill="none" opacity={0.6} />
        <g transform={`translate(0 ${f1(90 * (1 - a))})`}>
          <MastV2 x={490} y={500} size={1.04} ow={ow} frame={frame} />
          <Pass ow={ow} parts={[pt(rr(75, 373, 208, 135, 18), `url(#${id}-sand)`, C.sand), pt(rr(289, 462, 83, 16, 8), C.copper, C.copper),
            ...[110, 240].map((wx) => pt(`M${wx - 18} 508 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0 Z`, '#2a2740', '#2a2740'))]} />
          <path d={rr(90, 392, 95, 52, 10)} fill={C.night} />
          <path d={rr(210, 405, 54, 66, 10)} fill={C.night} />
          <path d={rr(96, 398, 40, 14, 7)} fill="#ffe6a0" opacity={0.85} />
          <Glow x={137} y={418} r={50} color="#ffe6a0" opacity={0.35} />
          <path d="M88 386 L270 386" stroke="#ffffff" strokeWidth={5} strokeLinecap="round" opacity={0.45} />
        </g>
        <g opacity={b}>
          <Pass ow={ow} parts={[pt(rr(460, 550, 60, 113, 12), C.deep, C.steel)]} />
          <CoreV2 x={490} y={604} size={0.22} ow={ow} frame={frame} />
          <path d={rr(48, 562, 290, 46, 14)} fill={C.deep} opacity={0.75} />
          <Mark text="EXISTING WELLS" x={60} y={595} size={29} />
        </g>
        <Mark text="Navasota" x={20} y={84} size={65} /><Mark text="NOV test center" x={25} y={131} size={29} />
      </g>}
      {mode === 'mould' && <g>
        <g transform={`translate(${f1((1 - a) * -195 - b * 140)} 0)`}>
          <Pass ow={ow} parts={[pt(rr(210, 170, 188, 370, 18), `url(#${id}-cas)`, C.steel)]} />
          <path d={rr(244, 213, 152, 284, 12)} fill={C.muted} />
        </g>
        <g transform={`translate(${f1((1 - a) * 195 + b * 140)} 0)`}>
          <Pass ow={ow} parts={[pt(rr(416, 170, 189, 370, 18), `url(#${id}-cas)`, C.steel)]} />
          <path d={rr(418, 213, 154, 284, 12)} fill={C.muted} />
        </g>
        <g opacity={c}>
          <Pass ow={ow} parts={[st('M615 110 V620', C.steel, 10, C.steel), st('M794 110 V620', C.steel, 10, C.steel), pt(rr(625, 110, 159, 510, 14), C.deep, C.deep)]} />
        </g>
        <g opacity={a}><CoreV2 x={410 + c * 295} y={355 + c * 105} size={1.35 - c * 0.7} ow={ow} frame={frame} /></g>
        <path d={rr(295, 172, 230, 363, 14)} fill={C.steel} opacity={(1 - b) * a} />
        {[0, 1, 2, 3, 4].map((i) => <path key={i} d={rp([[320 + i * 43, 90 + a * 140], [338 + i * 43, 83 + a * 140], [350 + i * 43, 101 + a * 140],
          [330 + i * 43, 111 + a * 140]], 3)} fill={C.copper} stroke={line(C.copper)} strokeWidth={ow} opacity={1 - b} />)}
        <Mark text="CONCEPTUAL ASSEMBLY" x={155} y={635} size={34} />
      </g>}
      {mode === 'tools' && <g>
        <Mark text="OILFIELD" x={18} y={98} size={38} /><Mark text="MINING TESTS" x={440} y={98} size={38} />
        <Pass ow={ow} parts={[pt(rr(105, 480, 193, 45, 14), C.muted, C.muted)]} />
        <BitV2 x={200 + a * 445} y={455 - a * 130 + b * 65} spin={frame * 0.18} shaft={180} ow={ow} />
        <path d="M310 335 H493" pathLength={1} stroke={C.copper} strokeWidth={12} strokeDasharray={`${a} 1`} strokeLinecap="round" />
        <Arrow d="M476 315 L501 335 L476 355" head="M476 315 L501 335 L476 355" />
        <g transform={`translate(0 ${f1(70 * (1 - b))})`}>
          <CoreV2 x={645} y={465} size={1.04} ow={ow} frame={frame} />
          <path d={`M${f1(517 + c * 48)} 190 V296 H585 M${f1(773 - c * 48)} 190 V296 H705`} fill="none" stroke={line(C.sage)} strokeWidth={14 + ow * 2}
            strokeLinecap="round" strokeLinejoin="round" />
          <path d={`M${f1(517 + c * 48)} 190 V296 H585 M${f1(773 - c * 48)} 190 V296 H705`} fill="none" stroke={C.sage} strokeWidth={14}
            strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <Mark text="AUTOMATION TO TRY" x={184} y={631} size={32} />
      </g>}
      {mode === 'training' && <g>
        <Figure {...castV2('engineer')} frame={frame} x={159} y={643} scale={0.97} pose={a > 0.5 ? 'point' : 'hips'} emotion="neutral" turn={0.4} />
        <Pass ow={ow} parts={[pt(rr(274, 442, 146, 39, 12), C.clay, C.clay), st('M305 481 V628', C.steel, 7, C.steel), st('M390 481 V628', C.steel, 7, C.steel)]} />
        <path d={`M345 432 L${f1(325 + a * 40)} 382`} stroke={C.copper} strokeWidth={12} strokeLinecap="round" />
        <circle cx={325 + a * 40} cy={382} r={13} fill={C.paper} stroke={line(C.paper)} strokeWidth={ow * 2} />
        <Pass ow={ow} parts={[pt(rr(425, 114, 370, 339, 24), C.deep, C.steel)]} />
        <path d={rr(431, 120, 358, 327, 20)} fill="none" stroke={C.muted} strokeWidth={4} />
        <CoreV2 x={612} y={355} size={0.52} wire ow={ow} frame={frame} />
        <BitV2 x={612} y={251 + b * 57} wire ow={ow} />
        <g opacity={c}>
          <Pass ow={ow} parts={[pt(rr(489, 514, 261, 110, 16), C.clay, C.sage)]} />
          <CoreV2 x={544} y={567} size={0.25} ow={ow} frame={frame} />
          <path d="M599 568 H714 M675 542 V596" stroke={C.steel} strokeWidth={10} strokeLinecap="round" />
        </g>
        <Mark text="PLANNED TRAINING" x={405} y={75} size={29} /><Mark text="AI + DIGITAL TWINS" x={432} y={487} size={26} />
        <Mark text="HANDS-ON PRACTICE" x={435} y={669} size={26} />
      </g>}
      {mode === 'award' && <g>
        <g opacity={0.35}><MastV2 x={657} y={590} size={0.75} ow={ow} frame={frame} /><CoreV2 x={655} y={635} size={0.23} wire ow={ow} /></g>
        <g transform={`translate(${f1((1 - a) * -350)} 0) rotate(${f1(-5 + a * 5)} 200 300)`}>
          <Pass ow={ow} parts={[pt(rr(25, 124, 450, 493, 18), `url(#${id}-paper)`, C.paper),
            pt(rp([[25, 124], [155, 124], [189, 170], [475, 170], [475, 617], [25, 617]], 16), `url(#${id}-sand)`, C.sand)]} />
          <g transform={`translate(0 ${f1(-b * 68)})`}>
            <Pass ow={ow} parts={[pt(rr(59, 170, 387, 363, 12), C.paper, C.paper)]} />
            <Mark text="ENERGY DEPARTMENT" x={81} y={225} size={25} color={C.night} />
            <Mark text="Selected for" x={81} y={303} size={40} color={C.night} />
            <Mark text="award negotiations" x={81} y={351} size={34} color={C.night} />
            <path d="M85 385 H410 M85 410 H340" stroke={C.clay} strokeWidth={6} strokeLinecap="round" />
            <path d={rr(70, 255 + b * 280, 363, 180, 10)} fill={C.sand} opacity={1 - b} />
          </g>
          <Pass ow={ow} parts={[pt(rr(25, 451, 450, 166, 18), C.copper, C.copper)]} />
          <path d="M45 466 L300 466" stroke="#ffffff" strokeWidth={6} strokeLinecap="round" opacity={0.4} />
        </g>
        <Mark text="PROPOSED" x={544} y={657} size={27} />
      </g>}
      {mode === 'limit' && <g>
        <g opacity={0.6}><CoreV2 x={176} y={415} size={1.08} wire ow={ow} frame={frame} /><BitV2 x={176} y={206 - a * 65} wire ow={ow} /></g>
        <g transform={`translate(${f1((1 - a) * 200)} 0)`}>
          <Pass ow={ow} parts={[pt(rr(385, 100, 405, 510, 20), `url(#${id}-paper)`, C.steel), st('M517 100 V84 H659 V100', C.steel, 15, C.steel)]} />
          <Mark text="TEST RESULTS" x={425} y={177} size={32} color={C.night} />
          <path d="M429 214 H748" stroke={C.clay} strokeWidth={4} strokeLinecap="round" />
          <path d={rr(429 + b * 315, 250, 320, 260, 12)} fill={C.sand} opacity={1 - b} />
          <g opacity={b}>
            <path d={rr(434, 269, 306, 211, 16)} fill="none" stroke={C.clay} strokeWidth={5} strokeDasharray="10 10" />
            <Mark text="NOT REPORTED" x={444} y={384} size={31} color={C.night} />
          </g>
        </g>
        <g transform={`translate(0 ${f1(-c * 30)})`}>
          <path d={rr(65, 645, 229, 37, 14)} fill={C.muted} />
          <Mark text="PROPOSAL" x={65} y={100} size={29} />
        </g>
      </g>}
    </g>
    <path d={rr(-30, 20, 940, 710, 30)} fill="none" stroke={line(C.night)} strokeWidth={ow * 2} opacity={0.6} />
    <Sheen d="M10 30 L400 30" w={4} op={0.12} />
  </g>;
};

/** every v2 proving ground drawing by name, for the shelf index */
export const PROVINGGROUND_V2 = ['TestbenchBackdropV2', 'ProvingGroundRigV2'] as const;
