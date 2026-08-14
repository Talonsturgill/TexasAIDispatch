import React from 'react';
import {useUid} from './uid';
import {tones, useLight, INK, RustStreak, CalicheDust} from './lighting';
import {matFill} from './materials';
import {fitter, rnd} from './scale';

// =============================================================================
// HOMETOWN — school, Friday night, and the year's rituals.
//
// WHY THIS IS THE MODULE THAT MATTERS MOST FOR NOSTALGIA
//
// Every other module here draws where a Texan lives or works. This one draws the
// four years everybody's memory keeps in higher resolution than the rest of their
// life, and it draws them as OBJECTS rather than as feelings, which is the only way
// a vector library can hold them.
//
// THE LIGHT IS THE SUBJECT ON FRIDAY NIGHT. From two miles out you see the glow
// before you see the town, and that glow is the only thing happening for a hundred
// miles. Metal halide before roughly 2015 is a warm white with an amber edge and LED
// after is markedly cooler and bluer, and the switch is visible in a single still
// frame, which makes it one of the cleanest era markers in the whole library.
//
// FIELD GREEN UNDER ARTIFICIAL LIGHT GOES ACID, closer to chartreuse than to a lawn
// green, and everything outside the light cone is near black with a deep blue violet
// just above the horizon. Drawing a stadium in daylight colours at night is the tell.
//
// TWO CORRECTIONS FROM THE RESEARCH, BOTH OF WHICH CHANGE WHAT GETS DRAWN.
//
// THE BAND OUTNUMBERS THE TEAM AND PRACTISED LONGER. Texas band participation is the
// largest in the country. So `MarchingBlock` is a first-class artifact here, not a
// detail behind the football, and the drill FORM is the drawable object rather than
// any individual player.
//
// THE SMALL TOWN FIELD AND THE SUBURBAN MEGASTADIUM ARE BOTH TRUE and they look
// nothing alike. A 2A field with poured concrete embankments in the end zones and a
// two lane road running past is one building. A 6A district that spent tens of
// millions on a video board and a parking structure is another. Drawing only the
// dusty one is a nostalgia that flatters itself.
//
// AND THE RULE THAT GOVERNS THE WHOLE MODULE: draw these STRAIGHT. Texans joke about
// the mum and the pledge and the stock show themselves. An outsider doing it reads as
// condescension and nothing after it lands. Let the absurdity be visible on its own.
// =============================================================================

export const TOWN_M: Record<string, {h: number; note: string}> = {
  lightMast: {h: 24, note: 'a high school field light mast to the bottom of the head bank'},
  bleacher: {h: 7, note: 'a home-side bleacher stack at the top row'},
  pressBox: {h: 3.2, note: 'the box itself, sitting on top of the bleacher'},
  marquee: {h: 2.6, note: 'a school changeable-letter sign to the top of the cabinet'},
  portable: {h: 3.4, note: 'a portable classroom on blocks, grade to the eave'},
  schoolBus: {h: 3.1, note: 'a conventional school bus at the roof'},
  mum: {h: 0.95, note: 'a senior mum, disc top to the lowest bell'},
  showBarn: {h: 7.5, note: 'a livestock barn at the eave of a clear span'},
  showSteer: {h: 1.35, note: 'a market steer at the shoulder, at show weight'},
  runThrough: {h: 3.4, note: 'a butcher-paper run-through banner on its frame'},
  goalPost: {h: 9, note: 'a goal post to the top of the uprights'},
  drumMajorStand: {h: 1.6, note: 'a drum major podium at the platform'},
  shako: {h: 0.30, note: 'a marching shako, crown only, without the plume'},
  chainLink: {h: 1.2, note: 'the field-level fence around a track'},
};

const fit = fitter(TOWN_M);

export interface TownProps {
  x?: number; y?: number; scale?: number; seed?: number; wear?: number;
  facing?: 1 | -1;
  /** Friday night is the default for this module. Daylight is the exception. */
  night?: boolean;
  /**
   * THE ERA MARKER THAT SHOWS IN ONE FRAME. Metal halide is a warm white with an
   * amber edge and reads pre-2015. LED is markedly cooler and bluer. Anyone who sat
   * in those stands through the change can see it instantly.
   */
  led?: boolean;
  /** the two colours a school has, and it never has three */
  school?: [string, string];
}

const HALIDE = '#FFF2D2';
const LED = '#EAF2FF';

// =============================================================================
// THE LIGHT MAST — the object the whole night is built on.
//
// A slender pole carrying a horizontal or slightly canted head bank of twelve to
// thirty individual fixtures in two or three rows. The pole is tall enough that the
// head reads as a small bright CLUSTER against black rather than as a lamp, and that
// cluster plus the cone under it is the entire drawing.
//
// THE BEAMS ARE VISIBLE. In humid air the cones show, pale warm white with a faint
// amber edge on halide, and that is what makes a Texas stadium look like a Texas
// stadium rather than a lit rectangle. On the coast and in East Texas they are
// obvious. In the Panhandle in November they are barely there, so `humidity` is a
// prop and not a constant.
// =============================================================================
export const LightMast: React.FC<TownProps & {
  h?: number; fixtures?: number; rows?: number; humidity?: number; on?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 81, wear = 0.4, facing = 1,
       night = true, led = false, h = 300, fixtures = 18, rows = 3,
       humidity = 0.5, on = true}) => {
  const L = useLight();
  const K = fit('lightMast', h);
  const steel = tones('#6a6a66', L);
  const lamp = led ? LED : HALIDE;
  const per = Math.ceil(fixtures / rows);
  const bankW = h * 0.36;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      <rect x={-h * 0.016} y={-h} width={h * 0.032} height={h} fill={steel.core} />
      <path d={`M${-h * 0.05},0 L${-h * 0.016},${-h * 0.14} L${h * 0.016},${-h * 0.14} L${h * 0.05},0 Z`}
        fill={steel.shade} />
      {wear > 0.3 && <RustStreak x={-h * 0.020} y={-h * 0.4} w={h * 0.040} h={h * 0.4}
        opacity={wear * 0.5} />}
      {/* THE HEAD BANK: a crossarm carrying rows of fixtures, canted slightly down */}
      <g transform={`translate(0 ${-h}) rotate(-8)`}>
        <rect x={-bankW / 2} y={-h * 0.010} width={bankW} height={h * 0.020}
          fill={steel.core} />
        {Array.from({length: rows}, (_, r) => (
          <g key={r}>
            <rect x={-bankW / 2} y={-h * 0.030 - r * h * 0.036} width={bankW}
              height={h * 0.012} fill={steel.shade} />
            {Array.from({length: per}, (_, i) => {
              const fx = -bankW / 2 + (i + 0.5) * (bankW / per);
              return (
                <g key={i}>
                  {/* a fixture is a shallow cone with a bright face, never a bulb */}
                  <path fill={steel.base} d={
                    `M${fx - h * 0.014},${-h * 0.030 - r * h * 0.036}` +
                    ` L${fx - h * 0.020},${-h * 0.052 - r * h * 0.036}` +
                    ` L${fx + h * 0.020},${-h * 0.052 - r * h * 0.036}` +
                    ` L${fx + h * 0.014},${-h * 0.030 - r * h * 0.036} Z`} />
                  {on && night && (
                    <ellipse cx={fx} cy={-h * 0.030 - r * h * 0.036} rx={h * 0.015}
                      ry={h * 0.007} fill={lamp} />
                  )}
                </g>
              );
            })}
          </g>
        ))}
      </g>
      {on && night && (
        <>
          {/* the cluster, read as one bright object from two miles out */}
          <ellipse cx={0} cy={-h * 1.01} rx={bankW * 0.6} ry={h * 0.05} fill={lamp}
            opacity={0.5} />
          {/* THE CONE. Visible in humid air, nearly absent in the dry Panhandle. */}
          <path fill={lamp} opacity={0.10 * humidity}
            d={`M${-bankW * 0.5},${-h * 1.0} L${bankW * 0.5},${-h * 1.0}` +
               ` L${bankW * 3.4},${h * 0.4} L${-bankW * 2.2},${h * 0.4} Z`} />
        </>
      )}
    </g>
  );
};

/**
 * THE BLEACHER STACK, in three-quarter view, which is the only angle where it reads.
 *
 * A long parallelogram rising away from the field, with a horizontal ladder of seat
 * lines and a VERTICAL STAIR BREAK every fifteen to twenty feet. Those breaks are
 * what stop it reading as a striped ramp.
 *
 * The press box sits on top of the home side as a horizontal box with a band of dark
 * windows, and it is about a third the width of the bleacher under it. Bigger than
 * that and the drawing is a college.
 *
 * `concrete` is the WPA-era West Texas form: poured tiered embankments in the end
 * zones instead of steel, which is a completely different and older building.
 */
export const Bleachers: React.FC<TownProps & {
  h?: number; w?: number; rows?: number; pressBox?: boolean; concrete?: boolean;
  crowd?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 82, wear = 0.35, facing = 1,
       night = true, school = ['#5C1A33', '#E8E4D8'], h = 120, w = 520,
       rows = 14, pressBox = true, concrete = false, crowd = 0.8}) => {
  const L = useLight();
  const K = fit('bleacher', h);
  const alu = tones(concrete ? '#b8b2a4' : '#aab2b8', L);
  const [c1, c2] = school;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {/* the wedge, rising away from the field */}
      <path fill={alu.shade} d={`M${-w / 2},0 L${w / 2},0 L${w / 2},${-h} L${-w / 2},${-h * 0.24} Z`} />
      {Array.from({length: rows}, (_, i) => {
        const f = i / (rows - 1);
        const ry = -h * (0.24 + f * 0.76);
        return (
          <rect key={i} x={-w / 2 + f * w * 0.02} y={ry} width={w * (0.98 - f * 0.02)}
            height={h * 0.026} fill={i % 2 ? alu.core : alu.base} />
        );
      })}
      {/* THE STAIR BREAKS. Without them this is a striped ramp. */}
      {Array.from({length: 4}, (_, i) => (
        <path key={i} fill={alu.shade} opacity={0.85} d={
          `M${-w * 0.42 + i * w * 0.28},${-h * 0.24}` +
          ` L${-w * 0.40 + i * w * 0.28},${-h}` +
          ` L${-w * 0.36 + i * w * 0.28},${-h} L${-w * 0.38 + i * w * 0.28},${-h * 0.24} Z`} />
      ))}
      {crowd > 0 && Array.from({length: Math.round(240 * crowd)}, (_, i) => {
        const f = rnd(seed, i);
        const g = rnd(seed, 500 + i);
        // a crowd is a DOT FIELD of two school colours with grey and white through it
        const col = g < 0.36 ? c1 : g < 0.62 ? c2 : g < 0.82 ? '#9a9a96' : '#d8d4cc';
        return (
          <circle key={i} cx={(f - 0.5) * w * 0.96}
            cy={-h * (0.28 + rnd(seed, 900 + i) * 0.70) + (f - 0.5) * w * 0.0}
            r={h * 0.013} fill={col} opacity={0.9} />
        );
      })}
      {pressBox && (
        <g transform={`translate(0 ${-h})`}>
          <rect x={-w * 0.17} y={-h * 0.30} width={w * 0.34} height={h * 0.30}
            fill={alu.base} />
          <rect x={-w * 0.155} y={-h * 0.24} width={w * 0.31} height={h * 0.13}
            fill={night ? '#2A3038' : '#39424c'} />
          <rect x={-w * 0.17} y={-h * 0.34} width={w * 0.34} height={h * 0.05}
            fill={c1} />
        </g>
      )}
      {wear > 0.3 && <CalicheDust x={-w / 2} y={-h * 0.12} w={w} h={h * 0.12}
        opacity={wear * 0.4} />}
    </g>
  );
};

/**
 * THE FIELD, seen from the press-box side, which is the only angle where a drill
 * form or a yard-line grid is legible.
 *
 * A hundred yards of white lines every five yards, four columns of hash marks, and
 * an end zone with a word painted in it. This library paints the end zone as a solid
 * colour block rather than lettering, for the same reason the marker and the
 * billboard carry no words: a viewer will try to read it.
 *
 * THE GREEN GOES ACID UNDER ARTIFICIAL LIGHT. That is the single colour decision
 * that makes a night field read as a night field.
 */
export const Field: React.FC<TownProps & {
  w?: number; depth?: number; track?: boolean; turf?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 83, night = true, led = false,
       school = ['#5C1A33', '#E8E4D8'], w = 1000, depth = 300, track = true,
       turf = false}) => {
  const uid = useUid('fld');
  const green = night ? (led ? '#5E8A46' : '#6E9440') : (turf ? '#3E6B38' : '#4E7A3C');
  const line = night ? '#F4F2E8' : '#E8E6DC';

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {track && (
        <path fill="#8C3A2E" d={
          `M${-w * 0.60},${depth * 0.06} L${w * 0.60},${depth * 0.06}` +
          ` L${w * 0.44},${-depth} L${-w * 0.44},${-depth} Z`} />
      )}
      <path fill={green} d={
        `M${-w / 2},0 L${w / 2},0 L${w * 0.38},${-depth * 0.86} L${-w * 0.38},${-depth * 0.86} Z`} />
      {/* the yard lines, converging with the field's own perspective */}
      {Array.from({length: 21}, (_, i) => {
        const f = i / 20;
        const x0 = -w / 2 + f * w, x1 = -w * 0.38 + f * w * 0.76;
        return (
          <line key={i} x1={x0} y1={0} x2={x1} y2={-depth * 0.86} stroke={line}
            strokeWidth={i % 2 ? 2 : 4} opacity={i % 2 ? 0.6 : 0.95} />
        );
      })}
      {/* the hash marks, in four columns, which is what says football and not soccer */}
      {Array.from({length: 4}, (_, r) => {
        const v = 0.16 + r * 0.22;
        return Array.from({length: 40}, (_, i) => {
          const f = i / 39;
          const hx = (-w / 2 + f * w) * (1 - v * 0.24);
          return (
            <line key={`${r}-${i}`} x1={hx} y1={-depth * 0.86 * v}
              x2={hx} y2={-depth * 0.86 * v - depth * 0.014} stroke={line}
              strokeWidth={1.6} opacity={0.55} />
          );
        });
      })}
      {/* the end zones as COLOUR BLOCKS. This library never paints a word. */}
      <path fill={school[0]} opacity={0.75} d={
        `M${-w / 2},0 L${-w * 0.34},0 L${-w * 0.27},${-depth * 0.86} L${-w * 0.38},${-depth * 0.86} Z`} />
      <path fill={school[0]} opacity={0.75} d={
        `M${w / 2},0 L${w * 0.34},0 L${w * 0.27},${-depth * 0.86} L${w * 0.38},${-depth * 0.86} Z`} />
    </g>
  );
};

/**
 * THE MARCHING BLOCK, and the reason it is here rather than as scenery.
 *
 * At a Texas high school the band is a larger organisation than the football team and
 * practised through July on asphalt-hot turf. So the drawable object is the DRILL
 * FORM, sixty to two hundred small identical figures in a curve, arc, block or
 * scattered set, all aligned on one axis. The individual is a narrow vertical with
 * squared shoulders and the instrument bell forward.
 *
 * THE SHAKO IS THE IDENTIFICATION and it is the one thing to get right at this
 * scale: a truncated cone slightly wider at the top, flat crown, hard visor angled
 * down, chin strap ON THE POINT OF THE CHIN, and a plume standing straight up that is
 * roughly the height of the hat again.
 *
 * THE COLOUR RELATIONSHIP THAT MAKES THE SHOT: under stadium light the whole band
 * goes cool and the BRASS GOES HOT. That contrast is the picture. The sousaphone is
 * the largest silhouette available, a big circle around the body with the bell
 * forward and up, and it is the best compositional anchor in the module.
 *
 * `corps` drops the shako entirely, which is what a modern show does, and it is a
 * real era marker rather than an error.
 */
export const MarchingBlock: React.FC<TownProps & {
  ranks?: number; files?: number; form?: 'block' | 'arc' | 'scatter'; spread?: number;
  corps?: boolean; sousaphones?: number; frame?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 84, night = true,
       school = ['#1E2A52', '#C8A23C'], ranks = 6, files = 14, form = 'arc',
       spread = 520, corps = false, sousaphones = 4, frame = 0}) => {
  const L = useLight();
  const K = fit('shako', 30);
  const [uniform, braid] = school;
  const u = tones(uniform, L);
  const brass = '#D8A83C';
  const step = Math.sin(frame / 7) * 0.5;

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {Array.from({length: ranks * files}, (_, i) => {
        const r = Math.floor(i / files), f = i % files;
        const fx = (f / (files - 1) - 0.5) * spread;
        // the FORM is the drawing. An arc bows away from the press box.
        const bow = form === 'arc' ? Math.pow(Math.abs(f / (files - 1) - 0.5) * 2, 2) * 70
          : form === 'scatter' ? (rnd(seed, i) - 0.5) * 90 : 0;
        const fy = -r * 46 - bow + (form === 'scatter' ? (rnd(seed, 500 + i) - 0.5) * 40 : 0);
        const s = K * (1 - r * 0.045);
        const isSousa = i < sousaphones;
        return (
          <g key={i} transform={`translate(${fx} ${fy}) scale(${s})`}>
            {/* the figure: a narrow vertical, shoulders squared, bell forward */}
            <rect x={-11} y={-96} width={22} height={96} fill={u.core} />
            <rect x={-11} y={-58} width={22} height={7} fill={braid} />
            <rect x={-13} y={-72} width={26} height={5} fill={braid} />
            <circle cx={0} cy={-104} r={11} fill="#a8825e" />
            {!corps && (
              <g>
                {/* THE SHAKO: truncated cone, WIDER AT THE TOP, flat crown */}
                <path fill={u.shade} d="M-11,-112 L-13,-134 L13,-134 L11,-112 Z" />
                <rect x={-13} y={-136} width={26} height={4} fill={u.base} />
                {/* the visor, angled DOWN */}
                <path fill={INK} d="M-12,-112 L12,-112 L14,-107 L-14,-107 Z" />
                {/* the chin strap ON THE POINT OF THE CHIN */}
                <path d="M-10,-110 Q0,-95 10,-110" stroke={INK} strokeWidth={2}
                  fill="none" />
                {/* the plume, as tall as the hat again */}
                <rect x={-3} y={-160} width={6} height={26} fill={braid} />
              </g>
            )}
            {isSousa ? (
              /* the biggest circle in the frame, and the best anchor available */
              <g>
                <circle cx={2} cy={-92} r={40} fill="none" stroke={brass} strokeWidth={9} />
                <ellipse cx={16} cy={-132} rx={26} ry={12} fill={brass} />
              </g>
            ) : (
              <g>
                <rect x={8} y={-84 + step} width={20} height={7} fill={brass} />
                <path d={`M28,${-88 + step} l14,-6 l0,18 l-14,-6 Z`} fill={brass} />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};

/** THE DRUM MAJOR PODIUM. A plain A-frame platform on the front sideline, four to
 *  six feet up, and whoever is on it is the show. The high strut and the deep back
 *  bend are the two poses, and the bend is the one everybody remembers. */
export const DrumMajorStand: React.FC<TownProps & {h?: number; occupied?: boolean}> = ({
  x = 0, y = 0, scale = 1, seed = 85, school = ['#1E2A52', '#C8A23C'],
  h = 60, occupied = true,
}) => {
  const L = useLight();
  const K = fit('drumMajorStand', h);
  const steel = tones('#8a8880', L);
  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      {[-1, 1].map((s) => (
        <line key={s} x1={s * h * 0.34} y1={0} x2={s * h * 0.10} y2={-h}
          stroke={steel.core} strokeWidth={h * 0.05} />
      ))}
      {Array.from({length: 4}, (_, i) => (
        <line key={i} x1={-h * (0.30 - i * 0.06)} y1={-h * (0.14 + i * 0.24)}
          x2={h * (0.30 - i * 0.06)} y2={-h * (0.14 + i * 0.24)}
          stroke={steel.shade} strokeWidth={h * 0.03} />
      ))}
      <rect x={-h * 0.20} y={-h * 1.04} width={h * 0.40} height={h * 0.06}
        fill={steel.base} />
      {occupied && (
        <g transform={`translate(0 ${-h * 1.04})`}>
          <rect x={-h * 0.09} y={-h * 0.62} width={h * 0.18} height={h * 0.62}
            fill={school[0]} />
          <rect x={-h * 0.11} y={-h * 0.46} width={h * 0.22} height={h * 0.05}
            fill={school[1]} />
          <circle cx={0} cy={-h * 0.70} r={h * 0.09} fill="#a8825e" />
          <path fill={school[0]} d={`M${-h * 0.09},${-h * 0.76} L${-h * 0.11},${-h * 0.94} L${h * 0.11},${-h * 0.94} L${h * 0.09},${-h * 0.76} Z`} />
          <rect x={-h * 0.024} y={-h * 1.14} width={h * 0.048} height={h * 0.20}
            fill={school[1]} />
          {/* the mace, held out and up */}
          <line x1={h * 0.10} y1={-h * 0.50} x2={h * 0.50} y2={-h * 0.90}
            stroke="#d8d4c8" strokeWidth={h * 0.026} />
          <circle cx={h * 0.50} cy={-h * 0.90} r={h * 0.05} fill={school[1]} />
        </g>
      )}
    </g>
  );
};

// =============================================================================
// THE HOMECOMING MUM — and the geometry rule that decides whether it reads.
//
// IF A TEXAN CAN SEE THE WEARER'S WHOLE TORSO, THE MUM IS TOO SMALL for anything
// past freshman year. It is not a corsage and it is not a flower pinned to a wrist.
// It is a construction, and drawing it as a corsage is the single fastest way to
// announce that nobody here went to a Texas high school.
//
// The silhouette is a circle sitting on a long tapering rectangle. A stiff disc six
// to ten inches across for a single, the silk pom standing proud of it as a flat
// faced hemisphere of forty to eighty narrow petals, a halo collar of ribbon loops in
// two or three concentric rings giving a scalloped outer edge, and then THE CURTAIN:
// six to twenty ribbon streamers hanging straight down to at least knee length, with
// trinkets along them and cowbells at the lowest point.
//
// WHY IT IS HEAVY IS WHY IT IS REMEMBERED. It pulls on the shirt all day, the bells
// announce every step down a hallway, and it cannot be set down or it gets stepped
// on. It is also a public scoreboard worn on the body: who made it, who paid for it,
// and how many strands you have against the girl at the next locker.
//
// A triple spans shoulder to shoulder and is not pinned at all, it HANGS FROM A WIDE
// NECK RIBBON, because a pin would tear the shirt. That detail is the one that proves
// the artist knew.
//
// `tier` is the era AND the class year in one prop: a 1988 mum is a single flower
// with modest ribbon that reads as a corsage, and a 2015 senior triple hides the
// wearer. Same object, thirty years apart.
// =============================================================================
export const HomecomingMum: React.FC<TownProps & {
  h?: number; tier?: 1 | 2 | 3; streamers?: number; bells?: number; boa?: boolean;
  trinkets?: number; frame?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 86, school = ['#5C1A33', '#E8E4D8'],
       h = 200, tier = 2, streamers = 12, bells = 3, boa = false, trinkets = 8,
       frame = 0}) => {
  const L = useLight();
  const K = fit('mum', h);
  const [c1, c2] = school;
  const discR = h * 0.16;
  const sway = Math.sin(frame / 21) * 2.2;

  return (
    <g transform={`translate(${x} ${y - h}) scale(${K * scale}) rotate(${sway})`}>
      {tier >= 3 && (
        /* the wide NECK RIBBON. A triple is too heavy to pin. */
        <path fill={c1} opacity={0.9} d={
          `M${-discR * 1.4},${-h * 0.10} L${-discR * 0.9},${-h * 0.36}` +
          ` L${discR * 0.9},${-h * 0.36} L${discR * 1.4},${-h * 0.10} Z`} />
      )}
      {Array.from({length: tier}, (_, t) => {
        const ox = (t - (tier - 1) / 2) * discR * 2.05;
        return (
          <g key={t} transform={`translate(${ox} 0)`}>
            {boa && (
              <circle cx={0} cy={0} r={discR * 1.34} fill={c2} opacity={0.55} />
            )}
            {/* the HALO COLLAR: two or three concentric rings of ribbon loops, which
                is what gives the outer edge its scallop */}
            {[1.20, 1.02].map((rr, ri) => (
              <g key={ri}>
                {Array.from({length: 14 + ri * 4}, (_, i) => {
                  const a = (i / (14 + ri * 4)) * Math.PI * 2;
                  return (
                    <ellipse key={i} cx={Math.cos(a) * discR * rr}
                      cy={Math.sin(a) * discR * rr} rx={discR * 0.26} ry={discR * 0.17}
                      transform={`rotate(${(a * 180) / Math.PI} ${Math.cos(a) * discR * rr} ${Math.sin(a) * discR * rr})`}
                      fill={ri ? c1 : c2} stroke={INK} strokeWidth={discR * 0.02} />
                  );
                })}
              </g>
            ))}
            <circle cx={0} cy={0} r={discR * 0.92} fill={c1} />
            {/* THE POM: a flat-faced hemisphere of many NARROW petals from one centre.
                Forty to eighty of them, and the mum head is often cream even when the
                school colours are dark, which is what makes it pop off the chest. */}
            {Array.from({length: 52}, (_, i) => {
              const a = (i / 52) * Math.PI * 2;
              const rr = discR * (0.52 + rnd(seed, i) * 0.34);
              return (
                <ellipse key={i} cx={Math.cos(a) * rr * 0.55} cy={Math.sin(a) * rr * 0.55}
                  rx={rr * 0.52} ry={discR * 0.075}
                  transform={`rotate(${(a * 180) / Math.PI} ${Math.cos(a) * rr * 0.55} ${Math.sin(a) * rr * 0.55})`}
                  fill={i % 5 === 0 ? '#e8e0cc' : '#f4efe2'} />
              );
            })}
            <circle cx={0} cy={0} r={discR * 0.14} fill={c1} />
          </g>
        );
      })}
      {/* THE CURTAIN. Straight down, at least knee length, and it is most of the
          object. A mum without it is a corsage. */}
      {Array.from({length: streamers * tier}, (_, i) => {
        const sx = ((i / (streamers * tier - 1)) - 0.5) * discR * 2.0 * tier;
        const len = h * (0.52 + rnd(seed, 40 + i) * 0.42);
        const braided = rnd(seed, 60 + i) > 0.68;
        return (
          <g key={i}>
            <path fill="none" stroke={i % 2 ? c1 : c2} strokeWidth={discR * 0.13}
              d={braided
                ? `M${sx},${discR * 0.9} ` + Array.from({length: 7}, (_, k) =>
                    `Q${sx + (k % 2 ? 5 : -5)},${discR * 0.9 + (k + 0.5) * len / 7} ${sx},${discR * 0.9 + (k + 1) * len / 7}`).join(' ')
                : `M${sx},${discR * 0.9} q${sway * 0.6},${len * 0.5} ${sway},${len}`} />
            {/* the satin needs its specular fold or it reads as felt */}
            <path fill="none" stroke="#ffffff" strokeWidth={discR * 0.03} opacity={0.4}
              d={`M${sx - discR * 0.03},${discR * 0.9} q${sway * 0.6},${len * 0.5} ${sway},${len}`} />
          </g>
        );
      })}
      {Array.from({length: trinkets}, (_, i) => {
        const tx = (rnd(seed, 90 + i) - 0.5) * discR * 1.9 * tier;
        const ty = discR * 0.9 + rnd(seed, 110 + i) * h * 0.44;
        return (
          <rect key={i} x={tx - discR * 0.09} y={ty} width={discR * 0.18}
            height={discR * 0.13} rx={discR * 0.03}
            fill={i % 3 === 0 ? c2 : c1} stroke={INK} strokeWidth={discR * 0.018} />
        );
      })}
      {Array.from({length: bells}, (_, i) => {
        const bx = ((i / Math.max(1, bells - 1)) - 0.5) * discR * 1.5 * tier;
        const by = discR * 0.9 + h * (0.60 + rnd(seed, 130 + i) * 0.36);
        return (
          /* the cowbells, at the LOWEST point, which is why every step is announced */
          <g key={i}>
            <path fill="#C8A860" stroke={INK} strokeWidth={discR * 0.02} d={
              `M${bx - discR * 0.07},${by} L${bx - discR * 0.11},${by + discR * 0.20}` +
              ` L${bx + discR * 0.11},${by + discR * 0.20} L${bx + discR * 0.07},${by} Z`} />
            <rect x={bx - discR * 0.03} y={by - discR * 0.05} width={discR * 0.06}
              height={discR * 0.06} fill="#A88840" />
          </g>
        );
      })}
    </g>
  );
};

// =============================================================================
// THE PORTABLE CLASSROOM — temporary for eleven years, and the most honest
// establishing shot for Texas suburban schooling in the growth decades.
//
// It rains and you get soaked walking to fourth period. The floor bounces when
// somebody walks past your desk. It is either freezing or roasting because the wall
// unit has two settings. Katy, Cy-Fair and Fort Bend were running hundreds of them at
// a time, so this is not a marginal memory.
//
// THE SHAPE: a single wide box, twenty four by thirty six or forty feet, so a LONG
// LOW rectangle. A very shallow roof, almost flat. Small windows high on one long
// side, sometimes none. Skirting hiding the axles and the gap underneath, WHICH IS
// WHERE THE BALLS GO. And the ramp with a pipe handrail up to a single steel door,
// with a switchback landing if code required one.
//
// It sits on BLOCKS with a few inches of air underneath, which is the detail that
// says temporary even after eleven years.
// =============================================================================
export const PortableClassroom: React.FC<TownProps & {
  h?: number; w?: number; ramp?: boolean; windows?: number; rain?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 87, wear = 0.4, facing = 1, night = false,
       h = 90, w = 340, ramp = true, windows = 3, rain = false}) => {
  const L = useLight();
  const K = fit('portable', h);
  const body = tones('#cec4ac', L);
  const roof = tones('#d8d8d4', L);
  const lift = h * 0.10;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {/* the block piers and the gap under the floor */}
      <rect x={-w / 2} y={-lift} width={w} height={lift} fill="#3a3630" opacity={0.75} />
      {Array.from({length: 5}, (_, i) => (
        <rect key={i} x={-w * 0.44 + i * w * 0.22} y={-lift} width={w * 0.03}
          height={lift} fill="#8a8580" />
      ))}
      <rect x={-w * 0.48} y={-lift * 0.86} width={w * 0.96} height={lift * 0.86}
        fill={body.shade} opacity={0.9} />
      <g>
        <rect x={-w / 2} y={-h * 0.86} width={w} height={h * 0.86 - lift} fill={body.core} />
        {/* horizontal lap lines, which is the whole surface articulation */}
        {Array.from({length: 9}, (_, i) => (
          <line key={i} x1={-w / 2} y1={-h * 0.82 + i * h * 0.082} x2={w / 2}
            y2={-h * 0.82 + i * h * 0.082} stroke={body.shade} strokeWidth={h * 0.008}
            opacity={0.6} />
        ))}
      </g>
      {/* the roof: VERY shallow, almost flat, with a slight overhang */}
      <path fill={roof.core} d={
        `M${-w / 2 - w * 0.02},${-h * 0.86} L0,${-h} L${w / 2 + w * 0.02},${-h * 0.86} Z`} />
      {Array.from({length: windows}, (_, i) => (
        /* small, and HIGH on the wall, which is why the room feels like a box */
        <rect key={i} x={-w * 0.32 + i * w * 0.24} y={-h * 0.72} width={w * 0.15}
          height={h * 0.22} fill={night ? '#f0e2b4' : '#4A5560'}
          stroke={body.shade} strokeWidth={h * 0.010} />
      ))}
      {/* the through-wall HVAC bulging from the end */}
      <rect x={w * 0.42} y={-h * 0.50} width={w * 0.07} height={h * 0.24}
        fill="#a8aca8" stroke={INK} strokeWidth={h * 0.006} />
      <g>
        <rect x={-w * 0.48} y={-h * 0.74} width={w * 0.10} height={h * 0.64}
          fill="#6a625a" />
        <rect x={-w * 0.455} y={-h * 0.66} width={w * 0.05} height={h * 0.08}
          fill={night ? '#f0e2b4' : '#2E343A'} />
      </g>
      {ramp && (
        <g>
          {/* pressure treated lumber weathered to silver grey, with a pipe rail */}
          <path fill="#9a968c" d={
            `M${-w * 0.38},${-lift} L${-w * 0.86},${h * 0.06}` +
            ` L${-w * 0.86},${h * 0.10} L${-w * 0.38},${-lift + h * 0.04} Z`} />
          <line x1={-w * 0.38} y1={-lift - h * 0.22} x2={-w * 0.86} y2={h * 0.06 - h * 0.22}
            stroke="#8a8880" strokeWidth={h * 0.018} />
          {Array.from({length: 5}, (_, i) => {
            const f = i / 4;
            return (
              <line key={i} x1={-w * (0.38 + f * 0.48)} y1={-lift + f * (h * 0.06 + lift)}
                x2={-w * (0.38 + f * 0.48)} y2={-lift + f * (h * 0.06 + lift) - h * 0.22}
                stroke="#8a8880" strokeWidth={h * 0.012} />
            );
          })}
        </g>
      )}
      {rain && Array.from({length: 60}, (_, i) => (
        <line key={i} x1={rnd(seed, i) * w - w / 2} y1={-h - rnd(seed, 40 + i) * h * 0.4}
          x2={rnd(seed, i) * w - w / 2 - h * 0.05} y2={-h * 0.2 - rnd(seed, 40 + i) * h * 0.4}
          stroke="#c8d4dc" strokeWidth={1.6} opacity={0.4} />
      ))}
      {wear > 0.3 && <CalicheDust x={-w / 2} y={-h * 0.24} w={w} h={h * 0.24}
        opacity={wear * 0.4} />}
    </g>
  );
};

/** THE SCHOOL MARQUEE. A backlit cabinet on two posts with changeable plastic
 *  letters, and the letters are always slightly uneven because a person on a ladder
 *  put them there with a suction pole. Drawn as rules, never as words: this library
 *  does not write copy a viewer will try to read. */
export const SchoolMarquee: React.FC<TownProps & {
  h?: number; lines?: number; brick?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 88, wear = 0.3, facing = 1, night = false,
       school = ['#5C1A33', '#E8E4D8'], h = 80, lines = 3, brick = true}) => {
  const L = useLight();
  const K = fit('marquee', h);
  const cab = tones('#e4e0d4', L);
  const base = tones('#a8664c', L);
  const cw = h * 1.5, ch = h * 0.52;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {brick ? (
        <g>
          <rect x={-cw * 0.42} y={-h * 0.48} width={cw * 0.84} height={h * 0.48}
            fill={base.core} />
          <rect x={-cw * 0.42} y={-h * 0.48} width={cw * 0.84} height={h * 0.48}
            fill={matFill('granite')} opacity={0.7} />
        </g>
      ) : (
        [-1, 1].map((s) => (
          <rect key={s} x={s * cw * 0.30 - h * 0.02} y={-h * 0.48} width={h * 0.04}
            height={h * 0.48} fill="#8a857c" />
        ))
      )}
      <rect x={-cw / 2} y={-h * 0.48 - ch} width={cw} height={ch}
        fill={night ? '#f6efd8' : cab.core} stroke={school[0]}
        strokeWidth={h * 0.038} />
      {/* the school name band across the top, as a colour block */}
      <rect x={-cw / 2} y={-h * 0.48 - ch} width={cw} height={ch * 0.24}
        fill={school[0]} />
      {Array.from({length: lines}, (_, i) => (
        <rect key={i} x={-cw * (0.20 + rnd(seed, i) * 0.20)}
          y={-h * 0.48 - ch * (0.68 - i * 0.20)}
          width={cw * (0.40 + rnd(seed, 20 + i) * 0.40)} height={ch * 0.11}
          fill="#3a3630" opacity={0.85} />
      ))}
      {wear > 0.3 && (
        <ellipse cx={cw * 0.3} cy={-h * 0.48 - ch * 0.4} rx={h * 0.05} ry={h * 0.04}
          fill="#8a8580" opacity={wear * 0.3} />
      )}
    </g>
  );
};

/** THE RUN-THROUGH BANNER. Butcher paper on a frame, hand painted, held by two rows
 *  of cheerleaders, and destroyed on purpose thirty seconds after it is finished.
 *  Paint runs where the brush was too wet, which is the detail that makes it read as
 *  made by teenagers rather than printed. */
export const RunThrough: React.FC<TownProps & {
  h?: number; w?: number; torn?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 89, school = ['#5C1A33', '#E8E4D8'],
       h = 120, w = 300, torn = 0}) => {
  const L = useLight();
  const K = fit('runThrough', h);
  const frame = tones('#8a8880', L);

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      {[-1, 1].map((s) => (
        <rect key={s} x={s * w * 0.5 - h * 0.02} y={-h} width={h * 0.04} height={h}
          fill={frame.core} />
      ))}
      <rect x={-w * 0.5} y={-h} width={w} height={h * 0.03} fill={frame.core} />
      {torn < 0.5 ? (
        <g>
          <rect x={-w * 0.48} y={-h * 0.96} width={w * 0.96} height={h * 0.86}
            fill="#f2ede0" />
          {/* the paint, in blocks, with a RUN under one of them */}
          {Array.from({length: 3}, (_, i) => (
            <rect key={i} x={-w * (0.34 - i * 0.02)} y={-h * (0.78 - i * 0.24)}
              width={w * (0.60 + rnd(seed, i) * 0.10)} height={h * 0.16}
              fill={i % 2 ? school[1] : school[0]} />
          ))}
          <rect x={-w * 0.12} y={-h * 0.60} width={h * 0.02} height={h * 0.20}
            fill={school[0]} opacity={0.8} />
        </g>
      ) : (
        /* after: two ragged halves hanging off the frame */
        [-1, 1].map((s) => (
          <path key={s} fill="#f2ede0" d={
            `M${s * w * 0.48},${-h * 0.96} L${s * w * 0.06},${-h * 0.96}` +
            Array.from({length: 6}, (_, i) =>
              ` L${s * w * (0.06 + rnd(seed, s + i * 3) * 0.14)},${-h * (0.86 - i * 0.14)}`).join('') +
            ` L${s * w * 0.48},${-h * 0.10} Z`} />
        ))
      )}
    </g>
  );
};

/**
 * THE SHOW BARN, and the animal in it, drawn as a working place rather than a fair.
 *
 * A long clear-span shed with a concrete alley down the middle and wood shavings on
 * either side, animals tied in rows along a head-height pipe rail ALL FACING THE SAME
 * WAY with tails toward the alley. Behind the stalls, a wall of fans, a rolling
 * blower, tack boxes used as stools.
 *
 * THE ANIMAL COLOUR IS NOT WHAT OUTSIDERS EXPECT. A Texas market steer is most often
 * SOLID BLACK, then black with a white face, then red, then a white Charolais cross,
 * then a grey Brahman cross on the Gulf. Longhorns are almost never market steers,
 * and a barn full of longhorns is the tell.
 *
 * FITTED IS A SHAPE, NOT A TEXTURE: the hair on the legs is combed upward and out so
 * the legs look thicker and the whole profile is smoother than a real animal.
 *
 * The ending is what gives this weight. The kid has fed it twice a day for ten
 * months, walked it, slept in the barn with it, and it is sold by the pound at the
 * end of the week. Everybody involved knows that, and the library draws it straight.
 */
export const ShowBarn: React.FC<TownProps & {
  h?: number; w?: number; stalls?: number; fans?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 90, wear = 0.35, facing = 1, night = false,
       h = 180, w = 560, stalls = 6, fans = true}) => {
  const L = useLight();
  const K = fit('showBarn', h);
  const steel = tones('#b4bab6', L);
  const shavings = tones('#ddd0b0', L);

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      <rect x={-w / 2} y={-h * 0.62} width={w} height={h * 0.62} fill="#3a4048"
        opacity={0.28} />
      {/* the truss roof of a clear span, which is what makes it a barn not a shed */}
      <path fill={steel.core} d={
        `M${-w / 2 - w * 0.02},${-h * 0.62} L0,${-h} L${w / 2 + w * 0.02},${-h * 0.62} Z`} />
      <path fill={matFill('corrugated')} opacity={0.6} d={
        `M${-w / 2 - w * 0.02},${-h * 0.62} L0,${-h} L${w / 2 + w * 0.02},${-h * 0.62} Z`} />
      {Array.from({length: 6}, (_, i) => (
        <line key={i} x1={-w * 0.42 + i * w * 0.168} y1={-h * 0.62}
          x2={-w * 0.42 + i * w * 0.168} y2={0} stroke={steel.shade}
          strokeWidth={h * 0.014} />
      ))}
      {/* the shavings bed and the concrete alley */}
      <rect x={-w / 2} y={-h * 0.10} width={w} height={h * 0.10} fill={shavings.core} />
      <rect x={-w * 0.16} y={-h * 0.10} width={w * 0.32} height={h * 0.10}
        fill="#a8a49c" />
      {/* the tie rail at head height, and every animal facing the same way */}
      <line x1={-w * 0.46} y1={-h * 0.34} x2={-w * 0.20} y2={-h * 0.34}
        stroke="#8a8f8c" strokeWidth={h * 0.014} />
      <line x1={w * 0.20} y1={-h * 0.34} x2={w * 0.46} y2={-h * 0.34}
        stroke="#8a8f8c" strokeWidth={h * 0.014} />
      {Array.from({length: stalls}, (_, i) => {
        const side = i < stalls / 2 ? -1 : 1;
        const k = i % Math.ceil(stalls / 2);
        const sx = side * (w * 0.44 - k * w * 0.115);
        const coat = ['#1c1c1e', '#1c1c1e', '#2a1c18', '#7a2a1e', '#e2ded2', '#9a9a96'];
        return (
          <ShowSteer key={i} x={sx} y={-h * 0.10} scale={0.30} seed={seed + i * 13}
            coat={coat[i % coat.length]} facing={side === -1 ? 1 : -1}
            whiteFace={i % 4 === 1} />
        );
      })}
      {fans && Array.from({length: 4}, (_, i) => (
        <g key={i} transform={`translate(${-w * 0.36 + i * w * 0.24} ${-h * 0.50})`}>
          <rect x={-h * 0.05} y={-h * 0.05} width={h * 0.10} height={h * 0.10}
            fill="#8a8f8c" stroke={INK} strokeWidth={h * 0.006} />
          <circle cx={0} cy={0} r={h * 0.036} fill="#5a5f5c" />
        </g>
      ))}
      {night && (
        <ellipse cx={0} cy={-h * 0.40} rx={w * 0.5} ry={h * 0.4} fill="#e8f0f4"
          opacity={0.08} />
      )}
    </g>
  );
};

/** THE MARKET STEER, fitted for show. A deep RECTANGULAR body on short legs, about
 *  two and a half times as long as it is tall at the shoulder, level topline, deep
 *  brisket, heavy hindquarter. The leg hair is combed up and out so the legs read
 *  thicker and the profile smoother than a real animal, which is what fitting is for.
 *
 *  Solid black is the most common market colour by a wide margin. Not a longhorn. */
export const ShowSteer: React.FC<TownProps & {
  h?: number; coat?: string; whiteFace?: boolean; halter?: boolean; frame?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 91, facing = 1, h = 120,
       coat = '#1c1c1e', whiteFace = false, halter = true, frame = 0}) => {
  const L = useLight();
  const K = fit('showSteer', h);
  const t = tones(coat, L);
  const breathe = Math.sin(frame / 26 + rnd(seed, 1) * 6) * h * 0.006;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {/* the LEVEL TOPLINE and the deep rectangular body */}
      <path fill={t.core} d={
        `M${-h * 1.10},${-h * 0.52} L${h * 0.95},${-h * 0.54 + breathe}` +
        ` Q${h * 1.16},${-h * 0.52} ${h * 1.14},${-h * 0.30}` +
        ` L${h * 1.10},${-h * 0.04} L${h * 0.80},${-h * 0.04} L${h * 0.78},${-h * 0.26}` +
        ` L${-h * 0.86},${-h * 0.26} L${-h * 0.88},${-h * 0.04} L${-h * 1.14},${-h * 0.04}` +
        ` Q${-h * 1.22},${-h * 0.30} ${-h * 1.10},${-h * 0.52} Z`} />
      {/* the brisket, deep and forward */}
      <path fill={t.shade} d={
        `M${-h * 1.10},${-h * 0.30} Q${-h * 1.24},${-h * 0.20} ${-h * 1.06},${-h * 0.16} Z`} />
      {/* THE FITTED LEGS: combed up and out, so they are wider than the bone */}
      {[-1.02, -0.90, 0.86, 1.00].map((lx, i) => (
        <path key={i} fill={t.base} d={
          `M${h * lx - h * 0.09},${-h * 0.04} L${h * lx - h * 0.05},${-h * 0.24}` +
          ` L${h * lx + h * 0.05},${-h * 0.24} L${h * lx + h * 0.09},${-h * 0.04} Z`} />
      ))}
      {/* the head, low and forward, with a small poll */}
      <path fill={whiteFace ? '#e8e2d4' : t.core} d={
        `M${-h * 1.10},${-h * 0.50} L${-h * 1.44},${-h * 0.44}` +
        ` Q${-h * 1.58},${-h * 0.40} ${-h * 1.54},${-h * 0.28}` +
        ` L${-h * 1.40},${-h * 0.24} L${-h * 1.10},${-h * 0.32} Z`} />
      <circle cx={-h * 1.32} cy={-h * 0.40} r={h * 0.026} fill={INK} />
      {/* polled, or small scur horns. NEVER the postcard sweep. */}
      <path fill={t.shade} d={`M${-h * 1.16},${-h * 0.52} l${h * 0.05},${-h * 0.05} l${h * 0.03},${h * 0.04} Z`} />
      <path fill={t.core} d={
        `M${h * 1.10},${-h * 0.42} q${h * 0.12},${h * 0.20} ${h * 0.04},${h * 0.34}` } />
      {halter && (
        <g>
          <path fill="none" stroke="#6a4a2c" strokeWidth={h * 0.026}
            d={`M${-h * 1.44},${-h * 0.42} L${-h * 1.20},${-h * 0.36}`} />
          <path fill="none" stroke="#6a4a2c" strokeWidth={h * 0.022}
            d={`M${-h * 1.42},${-h * 0.30} q${-h * 0.18},${h * 0.14} ${-h * 0.30},${h * 0.26}`} />
        </g>
      )}
    </g>
  );
};

/** THE SCHOOL BUS, and the note that matters is the NOSE. A Texas district runs
 *  conventionals with a hood as well as flat-front transits, and the conventional is
 *  the one everybody rode. Black rub rails, the stop arm folded against the side, and
 *  the crossing gate on the front bumper that swings out. */
export const SchoolBus: React.FC<TownProps & {
  h?: number; conventional?: boolean; stopArm?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 92, wear = 0.35, facing = 1, night = false,
       h = 100, conventional = true, stopArm = false}) => {
  const L = useLight();
  const K = fit('schoolBus', h);
  const body = tones('#E8B324', L);
  const w = h * 3.4;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      <rect x={conventional ? -w * 0.34 : -w * 0.48} y={-h} width={conventional ? w * 0.82 : w * 0.96}
        height={h * 0.86} rx={h * 0.05} fill={body.core} />
      {conventional && (
        /* THE HOOD. A flat front is a transit and a different bus. */
        <path fill={body.core} d={
          `M${-w * 0.34},${-h * 0.72} L${-w * 0.34},${-h * 0.30}` +
          ` L${-w * 0.50},${-h * 0.30} L${-w * 0.50},${-h * 0.56}` +
          ` Q${-w * 0.48},${-h * 0.68} ${-w * 0.40},${-h * 0.72} Z`} />
      )}
      {Array.from({length: 7}, (_, i) => (
        <rect key={i} x={-w * (conventional ? 0.30 : 0.44) + i * w * 0.115}
          y={-h * 0.80} width={w * 0.088} height={h * 0.28}
          fill={night ? '#f0e2b4' : '#4A5560'} />
      ))}
      {/* the black rub rails, three of them, which is the identification */}
      {[0.30, 0.44, 0.58].map((f, i) => (
        <rect key={i} x={conventional ? -w * 0.34 : -w * 0.48} y={-h * f}
          width={conventional ? w * 0.82 : w * 0.96} height={h * 0.026} fill="#26282a" />
      ))}
      {[-0.24, 0.34].map((f, i) => (
        <g key={i}>
          <circle cx={w * f} cy={-h * 0.06} r={h * 0.15} fill="#26282a" />
          <circle cx={w * f} cy={-h * 0.06} r={h * 0.07} fill="#8a8f8c" />
        </g>
      ))}
      {stopArm && (
        <g transform={`translate(${-w * 0.14} ${-h * 0.46})`}>
          <rect x={-h * 0.30} y={-h * 0.02} width={h * 0.30} height={h * 0.04}
            fill="#26282a" />
          <path fill="#C02C22" stroke="#f0ece2" strokeWidth={h * 0.014} d={
            Array.from({length: 8}, (_, k) => {
              const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
              return `${k ? 'L' : 'M'}${-h * 0.30 + Math.cos(a) * h * 0.16},${Math.sin(a) * h * 0.16}`;
            }).join(' ') + ' Z'} />
        </g>
      )}
      {wear > 0.3 && <CalicheDust x={-w * 0.5} y={-h * 0.26} w={w} h={h * 0.26}
        opacity={wear * 0.5} />}
    </g>
  );
};

/** THE GOAL POST. A single gooseneck upright on the end line, which is the modern
 *  form, or the older H with two posts on the goal line. The crossbar sits ten feet
 *  up and the uprights run well above it, and drawing them short is the tell. */
export const GoalPost: React.FC<TownProps & {h?: number; gooseneck?: boolean}> = ({
  x = 0, y = 0, scale = 1, seed = 93, wear = 0.3, h = 160, gooseneck = true,
}) => {
  const L = useLight();
  const K = fit('goalPost', h);
  const paint = tones('#E8C63C', L);
  const spanW = h * 0.42;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      {gooseneck ? (
        <path fill="none" stroke={paint.core} strokeWidth={h * 0.036}
          d={`M0,0 L0,${-h * 0.42} Q0,${-h * 0.56} ${-spanW * 0.5},${-h * 0.56}` } />
      ) : (
        [-1, 1].map((s) => (
          <line key={s} x1={s * spanW * 0.5} y1={0} x2={s * spanW * 0.5} y2={-h * 0.56}
            stroke={paint.core} strokeWidth={h * 0.030} />
        ))
      )}
      <line x1={-spanW * 0.5} y1={-h * 0.56} x2={spanW * 0.5} y2={-h * 0.56}
        stroke={paint.core} strokeWidth={h * 0.030} />
      {[-1, 1].map((s) => (
        <line key={s} x1={s * spanW * 0.5} y1={-h * 0.56} x2={s * spanW * 0.5} y2={-h}
          stroke={paint.core} strokeWidth={h * 0.026} />
      ))}
      {/* the ribbon on top of one upright, which is how everybody reads the wind */}
      <path fill="none" stroke="#e8e4d8" strokeWidth={h * 0.010}
        d={`M${spanW * 0.5},${-h} q${h * 0.06},${h * 0.03} ${h * 0.13},${h * 0.01}`} />
    </g>
  );
};
