import React from 'react';
import {useUid} from './uid';
import {tones, useLight, INK} from './lighting';
import {matFill} from './materials';
import {fitter, rnd} from './scale';

// =============================================================================
// FOOTBALL — the game a Texan measures the week by, as OBJECTS.
//
// WHY IT IS ITS OWN MODULE AND NOT MORE OF HOMETOWN.
//
// `hometown` draws the STADIUM and the RITUAL: the light mast, the bleachers, the
// mum, the marching block, the run-through. That is Friday as a place. This module
// draws the GAME as equipment: the helmet, the ball, the chain gang, the sled, the
// scoreboard. The split is deliberate, because a scene about a data center in
// Abilene wants a helmet on a shelf and not a whole stadium, and a scene about the
// stadium wants the stands and not a close-up of a facemask. Two modules, so a board
// can ask for either.
//
// THE RULE THIS MODULE LIVES OR DIES BY: DRAW THE FORM, NEVER THE MARK.
//
// Football in Texas is a thicket of live trademarks and the research mapped every
// one. The star at midfield, the swoosh on the sleeve, the bolt on the orange
// cooler, the shield, a school's dragon or panther, the title on the preseason
// annual: all live, none drawable. The thing that carries the recognition is the
// FORM underneath the mark, and the form is free and it is enough. A four bar
// facemask reads as a lineman with no logo on the clip. A striped A-frame reads as
// Whataburger with no word on it. So every surface here that a real object would
// stamp is left BLANK on purpose, and the blank is not laziness, it is the law.
// `knowledge/texas/FOOTBALL.md` carries the full mark-by-mark table and the history
// behind each object.
//
// AND DRAW IT STRAIGHT. Texas football is genuinely absurd in scale and the absurdity
// is the point, but an outsider winking at it reads as contempt and nothing after it
// lands. The forty thousand dollar mum and the seventy million dollar high school
// stadium are drawn with the same care as a combine. Let the size speak.
//
// TRUE SCALE through FOOTBALL_M, like every module in this wave. A regulation pylon
// is eighteen inches and a stadium light mast is eight people tall, and the sheet
// puts a person beside both so the reader feels the range.
// =============================================================================

/** True heights in metres, of ordinary examples. A number restated in a second
 *  place is a number that will be wrong in one of them, so every size here traces
 *  to this table and the drawings ask `fit()` for the conversion. */
export const FOOTBALL_M: Record<string, {h: number; note: string}> = {
  helmet: {h: 0.30, note: 'a modern helmet, crown to the bottom of the earhole'},
  football: {h: 0.28, note: 'a regulation ball on its long axis, about eleven inches'},
  shoulderPads: {h: 0.5, note: 'a set of pads on a stand, arch top to the belt line'},
  scoreboard: {h: 6, note: 'a Friday-night scoreboard on its poles, ground to cabinet top'},
  downMarker: {h: 1.75, note: 'the down box on its pole, held at head height on the sideline'},
  chainPole: {h: 1.75, note: 'a chain-crew pole, the ten-yard chain strung between two'},
  blockingSled: {h: 1.5, note: 'a two-man sled, ground to the top of the pad'},
  waterCooler: {h: 0.92, note: 'an insulated cooler on a wheeled stand, spigot at hand height'},
  lettermanJacket: {h: 0.72, note: 'a wool letter jacket on a hanger, shoulder to hem'},
  annual: {h: 0.28, note: 'the preseason newsprint annual, a tall magazine trim'},
  trophy: {h: 0.5, note: 'a district trophy, base to the top of the figure'},
  pylon: {h: 0.46, note: 'a regulation end-zone pylon, eighteen inches'},
  grandstand: {h: 14, note: 'a mid-size home grandstand at the back row, before the light masts'},
  kicker: {h: 1.7, note: 'a drill-team member at rest, a person'},
  official: {h: 1.8, note: 'an on-field official, a person in a striped shirt'},
};

const fit = fitter(FOOTBALL_M);

export interface FootballProps {
  x?: number; y?: number; scale?: number; seed?: number; wear?: number;
  facing?: 1 | -1;
  /** Night is Friday's default light for the lit objects here. */
  night?: boolean;
  /** The era marker that shows in one frame: incandescent amber before roughly
   *  2012, LED white and segment-crisp after. It reads on the scoreboard digits. */
  led?: boolean;
  /** the two colours a program owns, and it never owns three */
  colours?: [string, string];
}

// ------------------------------------------------------------------ HELMET
/**
 * THE MISTAKE: a smooth egg with a cage stuck on the front. A real helmet is a
 * SHELL with a low crown ridge, a rolled edge over the ear with a round earhole,
 * and the facemask stands well PROUD of the shell on two side clips, not flush.
 *
 * FORM NOT MARK: no maker's wordmark on the clip, no logo on the shell side, no
 * stripe unless a program's plain colour stripe is wanted. The bare shell in a
 * school's two colours is the whole recognition.
 */
export const Helmet: React.FC<FootballProps & {
  h?: number; mask?: 'twobar' | 'cage' | 'skill'; stripe?: boolean;
}> = ({
  x = 0, y = 0, scale = 1, seed = 41, wear = 0.3, facing = 1, h = 150,
  mask = 'cage', stripe = true, colours = ['#8a1a2a', '#e8dfce'],
}) => {
  const L = useLight();
  const K = fit('helmet', h);
  const shell = tones(colours[0], L);
  const bar = tones('#d8d2c4', L);
  const r = h * 0.5;
  const barW = h * 0.028;
  // facemask bar layout, front of the shell, standing proud on clips
  const bars = mask === 'twobar' ? [0.30, 0.52]
    : mask === 'skill' ? [0.30, 0.52, 0.74]
    : [0.24, 0.40, 0.56, 0.72];
  const uid = useUid('hel');
  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {/* the shell: a crown that is flatter than a circle, jaw cut away at the front */}
      <path fill={shell.core} d={
        `M${-r * 0.72},${-r * 0.34} ` +
        `Q${-r * 0.86},${-r * 1.02} ${-r * 0.02},${-r * 1.06} ` +
        `Q${r * 0.9},${-r * 1.02} ${r * 0.86},${-r * 0.2} ` +
        `Q${r * 0.84},${r * 0.16} ${r * 0.5},${r * 0.24} ` +
        `L${-r * 0.3},${r * 0.22} Q${-r * 0.72},${r * 0.12} ${-r * 0.72},${-r * 0.34} Z`} />
      {/* crown highlight ridge */}
      <path fill="none" stroke={shell.key} strokeWidth={h * 0.02} opacity={0.5}
        d={`M${-r * 0.5},${-r * 0.86} Q${r * 0.1},${-r * 1.02} ${r * 0.62},${-r * 0.7}`} />
      {stripe && (
        <path fill={colours[1]} opacity={0.9} d={
          `M${-r * 0.06},${-r * 1.06} q${r * 0.14},0 ${r * 0.16},${r * 0.02} ` +
          `l0,${r * 0.9} q${-r * 0.09},${r * 0.06} ${-r * 0.18},0 Z`} />
      )}
      {/* rolled ear pad and earhole */}
      <ellipse cx={-r * 0.06} cy={-r * 0.2} rx={h * 0.09} ry={h * 0.12} fill={shell.shade} opacity={0.7} />
      <circle cx={-r * 0.06} cy={-r * 0.2} r={h * 0.035} fill={INK} opacity={0.6} />
      {/* the clip the mask stands off from */}
      <rect x={r * 0.6} y={-r * 0.44} width={h * 0.05} height={h * 0.34} rx={h * 0.02}
        fill={shell.shade} />
      {/* facemask: bars proud of the face on the clip, following the jaw curve */}
      <g clipPath={`url(#${uid}m)`}>
        <defs><clipPath id={`${uid}m`}>
          <rect x={r * 0.62} y={-r * 1.1} width={r * 0.7} height={r * 1.4} />
        </clipPath></defs>
      </g>
      {bars.map((t, i) => (
        <path key={i} fill="none" stroke={bar.core} strokeWidth={barW} strokeLinecap="round"
          d={`M${r * 0.64},${-r * (1.0 - t * 0.9)} Q${r * 1.16},${-r * (0.92 - t * 0.86)} ` +
             `${r * 1.02},${-r * (0.62 - t * 0.66)}`} opacity={0.96} />
      ))}
      {/* the two vertical stays that make it a cage and not a smile */}
      {(mask === 'cage') && [0.82, 1.02].map((xx, i) => (
        <line key={i} x1={r * xx} y1={-r * 0.92} x2={r * (xx - 0.06)} y2={-r * 0.08}
          stroke={bar.shade} strokeWidth={barW * 0.8} opacity={0.9} />
      ))}
      {/* chin strap */}
      <path fill="none" stroke={bar.shade} strokeWidth={h * 0.02}
        d={`M${-r * 0.2},${r * 0.14} Q${r * 0.4},${r * 0.5} ${r * 0.86},${r * 0.06}`} opacity={0.8} />
    </g>
  );
};

// ------------------------------------------------------------------ FOOTBALL
/**
 * THE MISTAKE: an American football drawn as a rugby ball, too fat and too round.
 * The regulation ball is a slender prolate spheroid with SHARP points, one white
 * lace stripe near each end on the college and high-school ball, and the laces on a
 * raised seam down the middle. Pebbled leather, not shiny.
 */
export const Football: React.FC<FootballProps & {h?: number; stripes?: boolean}> = ({
  x = 0, y = 0, scale = 1, seed = 42, wear = 0.35, h = 90, stripes = true,
}) => {
  const L = useLight();
  const K = fit('football', h);
  const t = tones('#6a3a22', L);
  const rx = h * 0.5, ry = h * 0.29;
  const uid = useUid('fb');
  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <defs><clipPath id={`${uid}b`}><ellipse cx={0} cy={0} rx={rx} ry={ry} /></clipPath></defs>
      {/* the pointed spheroid: an ellipse pulled to points, not a plain ellipse */}
      <path fill={t.core} d={
        `M${-rx},0 Q${-rx * 0.5},${-ry} 0,${-ry} Q${rx * 0.5},${-ry} ${rx},0 ` +
        `Q${rx * 0.5},${ry} 0,${ry} Q${-rx * 0.5},${ry} ${-rx},0 Z`} />
      <path fill="none" stroke={t.key} strokeWidth={h * 0.012} opacity={0.5}
        d={`M${-rx * 0.7},${-ry * 0.4} Q0,${-ry * 0.7} ${rx * 0.7},${-ry * 0.4}`} />
      <g clipPath={`url(#${uid}b)`}>
        {stripes && [-1, 1].map((s) => (
          <rect key={s} x={s * rx * 0.62 - h * 0.02} y={-ry} width={h * 0.04} height={ry * 2}
            fill="#e9e2d2" opacity={0.9} />
        ))}
        {/* the raised seam and the laces */}
        <line x1={-rx * 0.34} y1={-ry * 0.02} x2={rx * 0.34} y2={-ry * 0.02}
          stroke={t.shade} strokeWidth={h * 0.03} opacity={0.7} />
        {Array.from({length: 6}).map((_, i) => (
          <line key={i} x1={-rx * 0.26 + i * rx * 0.1} y1={-ry * 0.16}
            x2={-rx * 0.26 + i * rx * 0.1} y2={ry * 0.12}
            stroke="#efe8d6" strokeWidth={h * 0.02} opacity={0.92} />
        ))}
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ SHOULDER PADS
/**
 * THE MISTAKE: a vest. Shoulder pads are an ARCH over the collarbones with two
 * cantilevered caps standing off the shoulders and a gap at the sternum where the
 * two halves lace, with the flaps hanging below. On a stand they keep the arch and
 * the caps hold their shape.
 */
export const ShoulderPads: React.FC<FootballProps & {h?: number; stand?: boolean}> = ({
  x = 0, y = 0, scale = 1, seed = 43, wear = 0.3, h = 150, stand = true,
  colours = ['#22344f', '#c9c2b2'],
}) => {
  const L = useLight();
  const K = fit('shoulderPads', h);
  const t = tones(colours[0], L);
  const strap = tones('#d7d0c0', L);
  const w = h * 1.3;
  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      {stand && (
        <>
          <rect x={-h * 0.03} y={-h * 0.5} width={h * 0.06} height={h * 0.5} fill={strap.shade} />
          <ellipse cx={0} cy={0} rx={h * 0.34} ry={h * 0.06} fill={INK} opacity={0.18} />
        </>
      )}
      {/* the arch across the top */}
      <path fill={t.core} d={
        `M${-w * 0.5},${-h * 0.62} Q0,${-h * 0.92} ${w * 0.5},${-h * 0.62} ` +
        `L${w * 0.42},${-h * 0.44} Q0,${-h * 0.66} ${-w * 0.42},${-h * 0.44} Z`} />
      {/* the two cantilever caps standing off each shoulder */}
      {[-1, 1].map((s) => (
        <path key={s} fill={t.shade} d={
          `M${s * w * 0.5},${-h * 0.62} q${s * w * 0.14},${-h * 0.02} ${s * w * 0.16},${h * 0.16} ` +
          `q${-s * w * 0.02},${h * 0.14} ${-s * w * 0.18},${h * 0.12} Z`} />
      ))}
      {/* the two front halves and the sternum gap they lace across */}
      {[-1, 1].map((s) => (
        <path key={s} fill={t.core} d={
          `M${s * w * 0.04},${-h * 0.5} L${s * w * 0.44},${-h * 0.46} ` +
          `L${s * w * 0.4},${-h * 0.02} Q${s * w * 0.2},${h * 0.06} ${s * w * 0.05},${-h * 0.02} Z`} />
      ))}
      <line x1={0} y1={-h * 0.48} x2={0} y2={-h * 0.04} stroke={strap.core}
        strokeWidth={h * 0.02} strokeDasharray={`${h * 0.02} ${h * 0.03}`} opacity={0.8} />
    </g>
  );
};

// ------------------------------------------------------------------ SCOREBOARD
/**
 * THE MISTAKE: a modern video wall. A Friday-night scoreboard for most of Texas is a
 * STEEL CABINET on two poles with fixed labels (HOME and GUEST, never the school
 * names, which are on removable panels) and lamp or segment digits: SCORE, QTR, the
 * play clock, and BALL ON / DOWN / TO GO. Incandescent digits are amber and bloom;
 * LED digits are white and crisp, and that is the era tell.
 */
export const Scoreboard: React.FC<FootballProps & {
  h?: number; home?: number; guest?: number; qtr?: number;
}> = ({
  x = 0, y = 0, scale = 1, seed = 44, wear = 0.35, h = 320, night = true, led = false,
  home = 21, guest = 14, qtr = 3, colours = ['#1d2b45', '#e7c53a'],
}) => {
  const L = useLight();
  const K = fit('scoreboard', h);
  const cab = tones(colours[0], L);
  const digit = led ? '#eaf4ff' : '#ffb43a';
  const w = h * 1.55, cabH = h * 0.62, cabY = -h;
  const lampOn = night ? 1 : 0.4;
  const uid = useUid('sb');
  const seg = (val: number, dx: number, dy: number, s: number) => (
    <text x={dx} y={dy} fontSize={s} fill={digit} opacity={lampOn}
      fontFamily="'JetBrains Mono', monospace" fontWeight={700}
      textAnchor="middle" filter={led ? undefined : `url(#${uid}glow)`}>
      {String(val).padStart(2, '0')}</text>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      {!led && <defs>
        <filter id={`${uid}glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation={h * 0.01} result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>}
      {/* two poles */}
      {[-1, 1].map((s) => (
        <rect key={s} x={s * w * 0.36 - h * 0.02} y={cabY + cabH} width={h * 0.04}
          height={-(cabY + cabH)} fill={tones('#6b7078', L).shade} />
      ))}
      {/* cabinet */}
      <rect x={-w * 0.5} y={cabY} width={w} height={cabH} rx={h * 0.02} fill={cab.core}
        stroke={cab.shade} strokeWidth={h * 0.012} />
      {/* the two fixed labels, blank school panels below them */}
      {(['HOME', 'GUEST'] as const).map((lab, i) => {
        const cx = i === 0 ? -w * 0.26 : w * 0.26;
        return (
          <g key={lab}>
            <text x={cx} y={cabY + cabH * 0.2} fontSize={h * 0.06} fill={colours[1]}
              textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={700}
              opacity={0.9}>{lab}</text>
            {/* the removable panel the school name clips into, drawn BLANK */}
            <rect x={cx - w * 0.16} y={cabY + cabH * 0.26} width={w * 0.32} height={cabH * 0.14}
              fill={cab.shade} opacity={0.6} />
            <rect x={cx - w * 0.13} y={cabY + cabH * 0.5} width={w * 0.26} height={cabH * 0.34}
              rx={h * 0.01} fill="#0a0f18" />
            {seg(i === 0 ? home : guest, cx, cabY + cabH * 0.78, h * 0.22)}
          </g>
        );
      })}
      {/* centre stack: QTR and clock */}
      <rect x={-w * 0.1} y={cabY + cabH * 0.5} width={w * 0.2} height={cabH * 0.34} rx={h * 0.01}
        fill="#0a0f18" />
      <text x={0} y={cabY + cabH * 0.2} fontSize={h * 0.05} fill={colours[1]}
        textAnchor="middle" fontFamily="'JetBrains Mono', monospace" opacity={0.85}>QTR</text>
      {seg(qtr, 0, cabY + cabH * 0.76, h * 0.16)}
    </g>
  );
};

// ------------------------------------------------------------------ CHAIN GANG
/**
 * THE MISTAKE: forgetting it entirely, or drawing one pole. The chain crew is THREE
 * objects that read instantly to anyone who has watched a game: the DOWN BOX, a
 * single pole with a flip number on top, and the TEN-YARD CHAIN, two poles with a
 * literal chain strung taut between them. The down box is what says football and not
 * soccer at a glance on a distant field.
 */
export const ChainGang: React.FC<FootballProps & {h?: number; down?: number}> = ({
  x = 0, y = 0, scale = 1, seed = 45, wear = 0.3, h = 300, down = 2,
}) => {
  const L = useLight();
  const K = fit('downMarker', h);
  const pole = tones('#c9502e', L);
  const chainLen = h * 1.9; // ten yards, foreshortened on the sideline
  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      {/* the ten-yard chain, two poles */}
      {[0, chainLen].map((dx, i) => (
        <rect key={i} x={dx - h * 0.02} y={-h * 0.9} width={h * 0.04} height={h * 0.9}
          fill={pole.core} />
      ))}
      <line x1={h * 0.0} y1={-h * 0.86} x2={chainLen} y2={-h * 0.86}
        stroke={tones('#8a8f96', L).core} strokeWidth={h * 0.02}
        strokeDasharray={`${h * 0.03} ${h * 0.02}`} />
      {/* the down box: its own pole, forward of the chain, with a flip number */}
      <rect x={-chainLen * 0.5 - h * 0.02} y={-h * 1.0} width={h * 0.04} height={h * 1.0}
        fill={pole.shade} />
      <rect x={-chainLen * 0.5 - h * 0.14} y={-h * 1.08} width={h * 0.28} height={h * 0.24}
        rx={h * 0.02} fill="#f2ead6" stroke={pole.shade} strokeWidth={h * 0.012} />
      <text x={-chainLen * 0.5} y={-h * 0.9} fontSize={h * 0.2} fill={INK} textAnchor="middle"
        fontFamily="'JetBrains Mono', monospace" fontWeight={700}>{down}</text>
    </g>
  );
};

// ------------------------------------------------------------------ BLOCKING SLED
/**
 * THE MISTAKE: a tackling dummy. A two-man sled is a heavy STEEL SKID frame with two
 * angled pads on spring arms, painted safety yellow or a program colour, sitting on
 * runners that gouge the practice field. It is the object every two-a-days memory has
 * a coach standing on.
 */
export const BlockingSled: React.FC<FootballProps & {h?: number; pads?: number}> = ({
  x = 0, y = 0, scale = 1, seed = 46, wear = 0.45, h = 150, pads = 2, facing = 1,
  colours = ['#d8a41f', '#2a2f37'],
}) => {
  const L = useLight();
  const K = fit('blockingSled', h);
  const frame = tones(colours[1], L);
  const pad = tones(colours[0], L);
  const w = h * 1.7;
  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {/* the runner skids */}
      <path fill="none" stroke={frame.core} strokeWidth={h * 0.05}
        d={`M${-w * 0.5},0 L${w * 0.36},0 q${h * 0.12},0 ${h * 0.14},${-h * 0.1}`} />
      <path fill="none" stroke={frame.shade} strokeWidth={h * 0.05}
        d={`M${-w * 0.42},${-h * 0.06} L${w * 0.42},${-h * 0.06}`} opacity={0.7} />
      {/* the upright back frame */}
      <line x1={-w * 0.36} y1={0} x2={-w * 0.3} y2={-h * 0.9} stroke={frame.core}
        strokeWidth={h * 0.05} />
      {Array.from({length: pads}).map((_, i) => {
        const px = -w * 0.28 + i * (w * 0.5);
        return (
          <g key={i}>
            {/* spring arm */}
            <line x1={-w * 0.3} y1={-h * 0.7} x2={px} y2={-h * 0.66}
              stroke={frame.shade} strokeWidth={h * 0.04} />
            {/* the angled pad */}
            <path fill={pad.core} d={
              `M${px},${-h * 0.24} L${px + w * 0.22},${-h * 0.34} ` +
              `L${px + w * 0.22},${-h * 0.94} L${px},${-h * 0.84} Z`} />
            <path fill={pad.key} opacity={0.4} d={
              `M${px + w * 0.02},${-h * 0.3} L${px + w * 0.2},${-h * 0.38} ` +
              `L${px + w * 0.2},${-h * 0.5} L${px + w * 0.02},${-h * 0.44} Z`} />
          </g>
        );
      })}
    </g>
  );
};

// ------------------------------------------------------------------ WATER COOLER
/**
 * THE MISTAKE: the orange cooler with the bolt. That colour-and-mark is trade dress.
 * The FORM is free and universal: an insulated cylinder with a hinged domed lid, a
 * push spigot at the base, and carry handles, sitting on a wheeled sideline cart with
 * a shelf of cone cups. Draw it in a neutral colour or a program colour, never the
 * orange, and the object still reads as exactly what it is.
 */
export const WaterCooler: React.FC<FootballProps & {h?: number; cart?: boolean; cups?: boolean}> = ({
  x = 0, y = 0, scale = 1, seed = 47, wear = 0.3, h = 150, cart = true, cups = true,
  colours = ['#3f7c6a', '#e7e1d4'],
}) => {
  const L = useLight();
  const K = fit('waterCooler', h);
  const body = tones(colours[0], L);
  const metal = tones('#8b9098', L);
  const cw = h * 0.44;
  const coolerBase = cart ? -h * 0.36 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      {cart && (
        <>
          {/* wheeled stand */}
          <rect x={-cw * 0.7} y={coolerBase} width={cw * 1.4} height={h * 0.03} fill={metal.shade} />
          {[-1, 1].map((s) => (
            <line key={s} x1={s * cw * 0.55} y1={coolerBase} x2={s * cw * 0.5} y2={-h * 0.06}
              stroke={metal.core} strokeWidth={h * 0.02} />
          ))}
          {[-1, 1].map((s) => (
            <circle key={s} cx={s * cw * 0.5} cy={-h * 0.03} r={h * 0.035} fill={INK} opacity={0.7} />
          ))}
        </>
      )}
      {/* the insulated cylinder */}
      <rect x={-cw * 0.5} y={coolerBase - h * 0.5} width={cw} height={h * 0.5} rx={h * 0.03}
        fill={body.core} />
      <rect x={-cw * 0.5} y={coolerBase - h * 0.5} width={cw * 0.28} height={h * 0.5}
        fill={body.key} opacity={0.25} />
      {/* domed lid */}
      <path fill={body.shade} d={
        `M${-cw * 0.52},${coolerBase - h * 0.5} Q0,${coolerBase - h * 0.62} ${cw * 0.52},${coolerBase - h * 0.5} Z`} />
      {/* push spigot */}
      <rect x={-h * 0.03} y={coolerBase - h * 0.08} width={h * 0.1} height={h * 0.04}
        fill={metal.core} />
      {/* the stack of cone cups on the shelf */}
      {cups && cart && (
        <g transform={`translate(${cw * 0.6} ${coolerBase - h * 0.02})`}>
          {Array.from({length: 5}).map((_, i) => (
            <path key={i} fill="#f2ede1" opacity={0.9} d={
              `M${-h * 0.03 - i * 0.6},${-h * 0.12 - i * h * 0.006} l${h * 0.06},0 ` +
              `l${-h * 0.03},${h * 0.1} Z`} />
          ))}
        </g>
      )}
    </g>
  );
};

// ------------------------------------------------------------------ DRILL TEAM
/**
 * THE MISTAKE: cheerleaders with pom-poms. The Texas drill team is a KICK LINE in the
 * Kilgore Rangerette lineage: a precise row of dancers at a high kick, hats and boots,
 * arms locked at the shoulders, the line dead straight. The FORM is the line and the
 * kick, drawn generically, not any troupe's specific uniform or logo.
 */
export const DrillTeam: React.FC<FootballProps & {
  h?: number; count?: number; spread?: number; kick?: number;
}> = ({
  x = 0, y = 0, scale = 1, seed = 48, wear = 0.25, h = 300, count = 6, spread = 900, kick = 1,
  colours = ['#b12a3a', '#f2ead6'],
}) => {
  const L = useLight();
  const K = fit('kicker', h);
  const uni = tones(colours[0], L);
  const boot = tones(colours[1], L);
  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      {Array.from({length: count}, (_, i) => {
        const px = (i - (count - 1) / 2) * (spread / count);
        const up = kick * (0.5 + 0.5 * rnd(seed, i)); // each kick a hair different
        return (
          <g key={i} transform={`translate(${px} 0)`}>
            {/* the standing leg and the boot */}
            <line x1={0} y1={0} x2={0} y2={-h * 0.5} stroke={uni.shade} strokeWidth={h * 0.05} />
            <rect x={-h * 0.05} y={-h * 0.06} width={h * 0.14} height={h * 0.06} rx={h * 0.01}
              fill={boot.core} />
            {/* the kicking leg, up toward horizontal */}
            <line x1={0} y1={-h * 0.5} x2={h * 0.42} y2={-h * (0.5 + up * 0.34)}
              stroke={uni.shade} strokeWidth={h * 0.05} />
            <rect x={h * 0.4} y={-h * (0.5 + up * 0.34) - h * 0.02} width={h * 0.12} height={h * 0.05}
              rx={h * 0.01} fill={boot.core} transform={`rotate(${-30 - up * 20} ${h * 0.42} ${-h * (0.5 + up * 0.34)})`} />
            {/* torso, arms locked to the neighbours, head with a hat */}
            <rect x={-h * 0.06} y={-h * 0.82} width={h * 0.12} height={h * 0.34} rx={h * 0.02}
              fill={uni.core} />
            <line x1={-h * 0.06} y1={-h * 0.78} x2={-spread / count * 0.5} y2={-h * 0.78}
              stroke={uni.core} strokeWidth={h * 0.04} />
            <line x1={h * 0.06} y1={-h * 0.78} x2={spread / count * 0.5} y2={-h * 0.78}
              stroke={uni.core} strokeWidth={h * 0.04} />
            <circle cx={0} cy={-h * 0.9} r={h * 0.06} fill="#e8c9a8" />
            <path fill={uni.shade} d={`M${-h * 0.09},${-h * 0.94} l${h * 0.18},0 l${-h * 0.02},${-h * 0.05} l${-h * 0.14},0 Z`} />
          </g>
        );
      })}
    </g>
  );
};

// ------------------------------------------------------------------ LETTER JACKET
/**
 * THE MISTAKE: a varsity jacket from a costume shop, all leather and a big felt
 * letter. The Texas letter jacket is WOOL BODY, LEATHER SLEEVES, knit collar cuff and
 * hem in the school's two colours, and a CHENILLE letter on the left chest crusted
 * with metal pins and bars. Draw the letter BLANK or as a plain block initial, never
 * a school's actual monogram.
 */
export const LettermanJacket: React.FC<FootballProps & {h?: number; initial?: string}> = ({
  x = 0, y = 0, scale = 1, seed = 49, wear = 0.3, h = 170, initial = '',
  colours = ['#2a2f37', '#c9a13a'],
}) => {
  const L = useLight();
  const K = fit('lettermanJacket', h);
  const wool = tones(colours[0], L);
  const leather = tones('#e9e2d2', L);
  const knit = tones(colours[1], L);
  const w = h * 0.86;
  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      {/* hanger */}
      <path fill="none" stroke={tones('#8b8578', L).core} strokeWidth={h * 0.012}
        d={`M0,${-h} l${-h * 0.16},${h * 0.1} M0,${-h} l${h * 0.16},${h * 0.1}`} />
      <circle cx={0} cy={-h} r={h * 0.02} fill="none" stroke={tones('#8b8578', L).core}
        strokeWidth={h * 0.01} />
      {/* leather sleeves */}
      {[-1, 1].map((s) => (
        <path key={s} fill={leather.core} d={
          `M${s * w * 0.28},${-h * 0.9} L${s * w * 0.6},${-h * 0.5} ` +
          `L${s * w * 0.5},${-h * 0.16} L${s * w * 0.36},${-h * 0.2} ` +
          `L${s * w * 0.4},${-h * 0.5} L${s * w * 0.2},${-h * 0.8} Z`} />
      ))}
      {/* knit cuffs */}
      {[-1, 1].map((s) => (
        <rect key={s} x={s * w * 0.5 - w * 0.08} y={-h * 0.22} width={w * 0.14} height={h * 0.08}
          fill={knit.core} />
      ))}
      {/* wool body */}
      <path fill={wool.core} d={
        `M${-w * 0.3},${-h * 0.9} Q0,${-h * 0.98} ${w * 0.3},${-h * 0.9} ` +
        `L${w * 0.34},${-h * 0.12} L${-w * 0.34},${-h * 0.12} Z`} />
      {/* snap placket */}
      <line x1={0} y1={-h * 0.86} x2={0} y2={-h * 0.14} stroke={wool.shade} strokeWidth={h * 0.01} />
      {Array.from({length: 5}).map((_, i) => (
        <circle key={i} cx={0} cy={-h * 0.78 + i * h * 0.15} r={h * 0.012} fill={knit.core} />
      ))}
      {/* knit collar and hem */}
      <path fill={knit.core} d={`M${-w * 0.16},${-h * 0.92} Q0,${-h * 0.8} ${w * 0.16},${-h * 0.92} L0,${-h * 0.86} Z`} />
      <rect x={-w * 0.34} y={-h * 0.16} width={w * 0.68} height={h * 0.06} fill={knit.core} />
      {/* the chenille letter, blank felt with a pin, on the left chest */}
      <rect x={-w * 0.24} y={-h * 0.66} width={w * 0.18} height={h * 0.26} rx={h * 0.01}
        fill={knit.shade} />
      {initial && (
        <text x={-w * 0.15} y={-h * 0.46} fontSize={h * 0.2} fill={wool.core} textAnchor="middle"
          fontFamily="Georgia, serif" fontWeight={700}>{initial}</text>
      )}
      <circle cx={-w * 0.15} cy={-h * 0.6} r={h * 0.014} fill="#d8d2c4" />
    </g>
  );
};

// ------------------------------------------------------------------ THE ANNUAL
/**
 * THE MISTAKE: lettering the cover. The preseason Texas football annual is a THICK
 * newsprint magazine with a photographic cover, a price in the top corner, a year on
 * the spine, and hundreds of pages of small-type district previews. It is the object
 * that sat on every counter in July. Draw the FORM: the thick block, the photo panel,
 * the price and year as neutral marks, and NO title, because the title is live.
 */
export const FootballAnnual: React.FC<FootballProps & {h?: number; year?: string}> = ({
  x = 0, y = 0, scale = 1, seed = 50, wear = 0.35, h = 150, year = "'26",
}) => {
  const L = useLight();
  const K = fit('annual', h);
  const cover = tones('#c7b48a', L);
  const w = h * 0.7;
  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      {/* the thick block of pages behind the cover */}
      <rect x={-w * 0.5 + h * 0.03} y={-h + h * 0.02} width={w} height={h} fill="#e7e0cd" />
      <rect x={-w * 0.5 + h * 0.05} y={-h + h * 0.04} width={w} height={h} fill="#d8d0ba" />
      {/* the cover */}
      <rect x={-w * 0.5} y={-h} width={w} height={h} fill={cover.core} stroke={cover.shade}
        strokeWidth={h * 0.008} />
      {/* the photographic cover panel */}
      <rect x={-w * 0.4} y={-h * 0.86} width={w * 0.8} height={h * 0.62} fill={tones('#3a4a30', L).core} />
      <ellipse cx={0} cy={-h * 0.5} rx={w * 0.18} ry={h * 0.18} fill="#8a1a24" opacity={0.8} />
      <circle cx={0} cy={-h * 0.58} r={h * 0.08} fill="#e8c9a8" opacity={0.9} />
      {/* the masthead band, drawn as a BLANK bar because the title is a live mark */}
      <rect x={-w * 0.5} y={-h} width={w} height={h * 0.14} fill={tones('#8a1a24', L).core} />
      {/* price and year, neutral */}
      <text x={w * 0.36} y={-h * 0.9} fontSize={h * 0.06} fill="#f2ead6" textAnchor="middle"
        fontFamily="'JetBrains Mono', monospace">{year}</text>
      {/* the block of tiny type at the foot, the district previews */}
      {Array.from({length: 6}).map((_, i) => (
        <line key={i} x1={-w * 0.4} y1={-h * 0.2 + i * h * 0.025} x2={w * 0.4}
          y2={-h * 0.2 + i * h * 0.025} stroke={INK} strokeWidth={h * 0.006} opacity={0.4} />
      ))}
    </g>
  );
};

// ------------------------------------------------------------------ TROPHY
/**
 * THE MISTAKE: a generic loving cup. Texas has a specific trophy vocabulary and the
 * highest-recognition FORM is the metal ten-gallon HAT on a plinth, the shape the
 * Red River rivalry trophy made famous. Draw the hat form on a base, not any specific
 * trophy's engraving or logo. A plain figure-on-a-column district trophy is the other.
 */
export const Trophy: React.FC<FootballProps & {h?: number; kind?: 'hat' | 'cup'}> = ({
  x = 0, y = 0, scale = 1, seed = 51, wear = 0.2, h = 130, kind = 'hat',
}) => {
  const L = useLight();
  const K = fit('trophy', h);
  const gold = tones('#c9a63a', L);
  const wood = tones('#5a3b26', L);
  const bw = h * 0.5;
  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      {/* the wooden plinth */}
      <rect x={-bw * 0.5} y={-h * 0.22} width={bw} height={h * 0.22} fill={wood.core} />
      <rect x={-bw * 0.5} y={-h * 0.22} width={bw} height={h * 0.04} fill={wood.key} opacity={0.5} />
      {/* the little engraved plate, blank */}
      <rect x={-bw * 0.3} y={-h * 0.16} width={bw * 0.6} height={h * 0.09} fill={gold.key} opacity={0.7} />
      {kind === 'hat' ? (
        <g>
          {/* the ten-gallon hat, in metal */}
          <ellipse cx={0} cy={-h * 0.24} rx={bw * 0.62} ry={h * 0.05} fill={gold.core} />
          <path fill={gold.core} d={
            `M${-bw * 0.3},${-h * 0.26} Q${-bw * 0.34},${-h * 0.7} ${-bw * 0.12},${-h * 0.86} ` +
            `Q0,${-h * 0.94} ${bw * 0.12},${-h * 0.86} Q${bw * 0.34},${-h * 0.7} ${bw * 0.3},${-h * 0.26} ` +
            `Q0,${-h * 0.34} ${-bw * 0.3},${-h * 0.26} Z`} />
          <path fill={gold.key} opacity={0.5} d={
            `M${-bw * 0.14},${-h * 0.3} Q${-bw * 0.16},${-h * 0.66} ${-bw * 0.04},${-h * 0.82}`} />
          {/* crease down the crown */}
          <line x1={0} y1={-h * 0.9} x2={0} y2={-h * 0.34} stroke={gold.shade} strokeWidth={h * 0.012} />
        </g>
      ) : (
        <g>
          {/* a figure on a column */}
          <rect x={-h * 0.02} y={-h * 0.62} width={h * 0.04} height={h * 0.4} fill={gold.shade} />
          <circle cx={0} cy={-h * 0.7} r={h * 0.06} fill={gold.core} />
          <path fill={gold.core} d={`M${-h * 0.06},${-h * 0.64} q${h * 0.06},${-h * 0.06} ${h * 0.12},0 l0,${h * 0.1} l${-h * 0.12},0 Z`} />
        </g>
      )}
    </g>
  );
};

// ------------------------------------------------------------------ END-ZONE PYLON
/**
 * THE MISTAKE: skipping the small objects. The orange pylon at each corner of the end
 * zone and goal line is eighteen inches of weighted foam, and it is one of the most
 * recognizable small objects on the field. This one IS supposed to be orange, because
 * the colour is a rule and not a mark.
 */
export const EndZonePylon: React.FC<FootballProps & {h?: number}> = ({
  x = 0, y = 0, scale = 1, seed = 52, wear = 0.3, h = 90,
}) => {
  const L = useLight();
  const K = fit('pylon', h);
  const o = tones('#e8631a', L);
  const w = h * 0.28;
  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <ellipse cx={0} cy={0} rx={w * 0.6} ry={h * 0.04} fill={INK} opacity={0.18} />
      <path fill={o.core} d={`M${-w * 0.5},0 L${-w * 0.42},${-h} L${w * 0.42},${-h} L${w * 0.5},0 Z`} />
      <path fill={o.key} opacity={0.4} d={`M${-w * 0.5},0 L${-w * 0.42},${-h} L${-w * 0.2},${-h} L${-w * 0.28},0 Z`} />
      {/* the reflective band near the top */}
      <rect x={-w * 0.46} y={-h * 0.82} width={w * 0.9} height={h * 0.1} fill="#f2ede1" opacity={0.85} />
    </g>
  );
};

// ------------------------------------------------------------------ GRANDSTAND BOWL
/**
 * THE MISTAKE: drawing only the dusty 2A field, or only the megastadium. Both are
 * true. This is the mid-to-large home grandstand seen from the field corner: a raked
 * bank of seats on a steel or concrete structure, a press box riding the top, the
 * light masts standing behind, and the crowd as a field of dots. It is the WALL of
 * people the research says a visiting team feels before it sees.
 */
export const GrandstandBowl: React.FC<FootballProps & {
  h?: number; w?: number; rows?: number; crowd?: number; masts?: number;
}> = ({
  x = 0, y = 0, scale = 1, seed = 53, wear = 0.35, h = 420, w = 1500, rows = 22,
  crowd = 0.8, masts = 2, night = true, led = false,
}) => {
  const L = useLight();
  const K = fit('grandstand', h);
  const steel = tones('#7c8088', L);
  const seat = tones(night ? '#2b3550' : '#9aa2ac', L);
  const cone = led ? '#eaf2ff' : '#fff2d2';
  const seats = Array.from({length: rows});
  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      {/* the light masts behind, with their cones */}
      {Array.from({length: masts}, (_, i) => {
        const mx = (i - (masts - 1) / 2) * (w * 0.62);
        return (
          <g key={i}>
            <rect x={mx - h * 0.012} y={-h * 1.5} width={h * 0.024} height={h * 1.5} fill={steel.shade} />
            <rect x={mx - h * 0.14} y={-h * 1.56} width={h * 0.28} height={h * 0.1} rx={h * 0.01}
              fill={steel.core} />
            {night && (
              <path fill={cone} opacity={0.14} d={
                `M${mx},${-h * 1.5} L${mx - w * 0.5},${-h * 0.1} L${mx + w * 0.5},${-h * 0.1} Z`} />
            )}
          </g>
        );
      })}
      {/* the raked seating bank */}
      <path fill={steel.core} d={
        `M${-w * 0.5},0 L${w * 0.5},0 L${w * 0.42},${-h * 0.86} L${-w * 0.42},${-h * 0.86} Z`} />
      {seats.map((_, i) => {
        const t = i / rows;
        const yy = -h * 0.06 - t * h * 0.78;
        const rowW = w * (0.5 - t * 0.08);
        return (
          <g key={i}>
            <rect x={-rowW} y={yy} width={rowW * 2} height={h * 0.02} fill={seat.shade} opacity={0.6} />
            {/* the crowd as dots, thinned by the crowd factor and jittered per seat */}
            {crowd > 0 && Array.from({length: Math.round(rowW / (h * 0.03))}, (_, j) => {
              const on = rnd(seed + i * 7, j) < crowd;
              if (!on) return null;
              const cx = -rowW + j * h * 0.06 + rnd(seed + i, j + 40) * h * 0.02;
              return <circle key={j} cx={cx} cy={yy - h * 0.015}
                r={h * 0.009} fill={night ? '#c9bfa8' : '#3a3f47'}
                opacity={night ? 0.5 : 0.7} />;
            })}
          </g>
        );
      })}
      {/* the press box riding the top */}
      <rect x={-w * 0.22} y={-h * 1.02} width={w * 0.44} height={h * 0.18} rx={h * 0.01}
        fill={steel.key} stroke={steel.shade} strokeWidth={h * 0.01} />
      {Array.from({length: 7}).map((_, i) => (
        <rect key={i} x={-w * 0.19 + i * w * 0.055} y={-h * 0.98} width={w * 0.04} height={h * 0.1}
          fill={night ? cone : '#26303f'} opacity={night ? 0.8 : 0.6} />
      ))}
    </g>
  );
};

// ------------------------------------------------------------------ OFFICIAL
/**
 * THE MISTAKE: a referee in solid black. The on-field official wears a VERTICAL
 * black-and-white STRIPE shirt, white knickers with a black belt, a black cap (white
 * for the referee), a whistle on a lanyard and a gold penalty flag at the hip. The
 * stripes are the whole read at any distance.
 */
export const Official: React.FC<FootballProps & {h?: number; head?: boolean}> = ({
  x = 0, y = 0, scale = 1, seed = 54, wear = 0.25, h = 300, facing = 1, head = true,
}) => {
  const L = useLight();
  const K = fit('official', h);
  const dark = tones('#20242c', L);
  const knicker = tones('#e7e1d4', L);
  const skin = '#c98a5a';
  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {/* legs, white knickers to the knee then dark socks */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <rect x={s * h * 0.05 - h * 0.03} y={-h * 0.44} width={h * 0.06} height={h * 0.2}
            fill={knicker.core} />
          <rect x={s * h * 0.05 - h * 0.03} y={-h * 0.24} width={h * 0.06} height={h * 0.2}
            fill={dark.core} />
          <rect x={s * h * 0.05 - h * 0.04} y={-h * 0.05} width={h * 0.09} height={h * 0.05}
            rx={h * 0.01} fill="#f2ede1" />
        </g>
      ))}
      {/* the striped shirt */}
      <g>
        <path fill={knicker.core} d={
          `M${-h * 0.13},${-h * 0.46} Q0,${-h * 0.5} ${h * 0.13},${-h * 0.46} ` +
          `L${h * 0.11},${-h * 0.74} Q0,${-h * 0.8} ${-h * 0.11},${-h * 0.74} Z`} />
        {Array.from({length: 5}).map((_, i) => (
          <rect key={i} x={-h * 0.12 + i * h * 0.05} y={-h * 0.78} width={h * 0.025} height={h * 0.32}
            fill={dark.core} opacity={0.92} />
        ))}
      </g>
      {/* arms */}
      {[-1, 1].map((s) => (
        <line key={s} x1={s * h * 0.1} y1={-h * 0.72} x2={s * h * 0.16} y2={-h * 0.48}
          stroke={knicker.shade} strokeWidth={h * 0.04} />
      ))}
      {/* the gold flag at the hip */}
      <circle cx={h * 0.12} cy={-h * 0.46} r={h * 0.03} fill="#e7c53a" />
      {head && (
        <>
          <circle cx={0} cy={-h * 0.86} r={h * 0.07} fill={skin} />
          {/* black cap */}
          <path fill={dark.core} d={`M${-h * 0.08},${-h * 0.9} q${h * 0.08},${-h * 0.05} ${h * 0.16},0 l${h * 0.03},${h * 0.01} l${-h * 0.22},0 Z`} />
          {/* whistle lanyard */}
          <path fill="none" stroke={INK} strokeWidth={h * 0.008} opacity={0.6}
            d={`M${-h * 0.04},${-h * 0.8} Q0,${-h * 0.66} ${h * 0.04},${-h * 0.7}`} />
        </>
      )}
    </g>
  );
};
