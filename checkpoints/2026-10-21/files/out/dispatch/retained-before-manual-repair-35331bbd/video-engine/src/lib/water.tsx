import React from 'react';
import {useUid} from './uid';
import {tones, FormGradient, ContactShadow, useLight, RustStreak, INK} from './lighting';
import {M} from './scale';
import {FONT, wrapToWidth} from './type';

// =============================================================================
// WATER — the beat this file exists to let the show handle CAREFULLY.
//
// More than a hundred people died in the Hill Country floods of July 2025. The AI
// story that followed -- a state grant for a real-time warning system, sensors and
// models on the Guadalupe, sirens that sounded in July 2026 -- is a real and
// important one, and it is the beat where a wrong visual choice does the most harm.
//
// FOUR RULES, and they are not style preferences.
//
// NO WATER WITH PEOPLE IN IT. Nothing in this file draws a person in or near
// floodwater, and nothing draws a vehicle being carried. Those images exist, they
// are somebody's worst day, and a stylised version of one is worse than useless.
//
// THE GAUGE IS THE SUBJECT. What is genuinely new here is measurement and warning:
// a stage reading, a threshold, a siren, a phone. Those are drawable without
// drawing the disaster, and they are the actual content of the story.
//
// NO NUMBER IS INVENTED HERE. A stage reading is a measurement, and this repo's law
// is that a published numeral traces to a computation. Every figure on these
// components comes from props. The default gauge shows a level and NO NUMERAL, so a
// scene that forgets to pass one gets an honest blank rather than a plausible lie.
//
// AND THE WARNING IS NEVER A VERDICT. The Grid Watch rule applies here for the same
// reason: this project does not publish a safety call. A component can show that a
// threshold was crossed and that an alert went out. It does not show that anyone is
// safe, and there is no all-clear state in this file.
// =============================================================================


// `ref: true` marks an entry that is REFERENCE rather than a scale input, for a component
// sized to the FRAME instead of to the world. See rainCell below.
export const WATER_M: Record<string, {h: number; note: string; ref?: boolean}> = {
  streamGauge: {h: 3.4, note: 'the staff plate and instrument shelter on its pile'},
  lowWaterCrossing: {h: 1.2, note: 'the depth marker post beside the slab'},
  sirenMast: {h: 9.0, note: 'ground to the top of the siren head'},
  // REFERENCE, not a scale input, and this one could not be anything else. A convective
  // cell really is about 900 m from cloud base to anvil, which at true scale is 322,938
  // draw units in a 1080 wide frame. RainCell is sized to the frame like sky and ground.
  // The number is here because a storm is the one thing in this module people guess about.
  rainCell: {h: 900, ref: true, note: 'a convective cell, cloud base to anvil'},
  handset: {h: 0.15, note: 'a phone, in the hand'},
};

const fit = (k: keyof typeof WATER_M, local: number) => (WATER_M[k].h * M) / local;

const rnd = (seed: number, ch: number) => {
  const k = ((seed * 2654435761) ^ (ch * 40503)) >>> 0;
  return ((k >>> 8) % 10000) / 10000;
};

interface Rig {
  x?: number; y?: number; scale?: number; frame?: number; facing?: 1 | -1;
  seed?: number; wear?: number;
}

// =============================================================================
// STREAM GAUGE — a staff plate on a pile, the instrument shelter above it, and the
// antenna that gets the reading out. This is the physical object the whole warning
// system is built on and almost nobody has looked at one closely.
//
// `stage` is a FRACTION of the plate, 0 at the datum and 1 at the top of it, and it
// is the caller's measurement. `stageLabel` is the only text and it is also the
// caller's. Passing neither draws a real gauge reading nothing, which is exactly
// what a gauge that has stopped reporting looks like.
// =============================================================================
export const StreamGauge: React.FC<Rig & {
  /** 0 at the datum, 1 at the top of the staff plate. The caller's measurement. */
  stage?: number;
  /** the flood stage marker, same scale. Drawn as a line, never as a colour ramp:
   *  a red zone below the line would be a verdict about what is safe. */
  threshold?: number;
  /** the reading, as text. This file never formats a number of its own. */
  stageLabel?: string;
  reporting?: boolean;
}> = ({
  x = 0, y = 0, scale = 1, frame = 0, seed = 1, wear = 0.5,
  stage, threshold, stageLabel, reporting = true,
}) => {
  const L = useLight();
  const uid = useUid('sg');
  const K = fit('streamGauge', 200);
  const t = tones('#8d9298', L);
  const plateTop = -150;
  const plateBottom = -18;
  const lvl = stage === undefined
    ? undefined
    : plateBottom + (plateTop - plateBottom) * Math.max(0, Math.min(1, stage));
  const thr = threshold === undefined
    ? undefined
    : plateBottom + (plateTop - plateBottom) * Math.max(0, Math.min(1, threshold));

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <defs><FormGradient id={`${uid}_p`} t={t} softness={0.4} /></defs>
      <ContactShadow cx={0} cy={2} rx={26} opacity={0.24} blur={7} />

      {/* the pile, driven into the bank */}
      <rect x={-7} y={-160} width={14} height={160} fill={`url(#${uid}_p)`}
        stroke={INK} strokeWidth={3} />
      {/* the staff plate: enamelled, numbered, and the numbering is DRAWN AS TICKS
          rather than as digits, because digits here would be a number this file
          made up */}
      <rect x={7} y={plateTop} width={19} height={plateBottom - plateTop} fill="#efeae0"
        stroke={INK} strokeWidth={2.6} />
      {Array.from({length: 22}, (_, i) => {
        const yy = plateTop + (i / 21) * (plateBottom - plateTop);
        const major = i % 5 === 0;
        return <path key={i} d={`M7,${yy} L${major ? 26 : 18},${yy}`} stroke={INK}
          strokeWidth={major ? 2.4 : 1.4} opacity={0.85} />;
      })}
      {/* THE WATER, and it is a SURFACE rather than a swatch. The first version was a
          flat rectangle butted against the plate, which reads as a colour sample
          somebody left on the drawing. Water has a bright meniscus where it meets the
          plate, a body you can see the plate through, and a far edge that recedes,
          and all three are cheap. */}
      {lvl !== undefined && (
        <g>
          <ellipse cx={12} cy={lvl} rx={130} ry={11} fill="#3f6273" opacity={0.42} />
          <rect x={-118} y={lvl} width={260} height={-lvl + 6} fill="#4d7386" opacity={0.4} />
          <path d={`M-118,${lvl} q30,${Math.sin(frame / 13) * 2.4} 62,0
                     t62,0 t62,0 t62,0`} fill="none" stroke="#bcdae4" strokeWidth={3}
            opacity={0.9} />
          {/* the stripe of light that always sits just under a water line */}
          <rect x={-118} y={lvl + 4} width={260} height={5} fill="#cfe6ef" opacity={0.28} />
        </g>
      )}
      {/* the flood-stage line. A LINE, never a shaded zone. */}
      {thr !== undefined && (
        <g>
          <path d={`M-30,${thr} L44,${thr}`} stroke="#c8703a" strokeWidth={3}
            strokeDasharray="8 6" />
        </g>
      )}

      {/* the shelter and the antenna */}
      <rect x={-30} y={-206} width={54} height={40} rx={3} fill={t.core} stroke={INK}
        strokeWidth={3.4} />
      <path d="M-30,-206 L-3,-222 L24,-206" fill={t.key} stroke={INK} strokeWidth={3.4}
        strokeLinejoin="round" />
      <path d="M12,-222 L12,-262" stroke={t.base} strokeWidth={3} />
      <circle cx={12} cy={-264} r={3.4}
        fill={reporting && Math.sin(frame / 11) > 0.6 ? '#6fd8b0' : '#4a534f'} />
      {/* the solar panel, angled south */}
      <g transform="translate(-34 -232) rotate(-24)">
        <rect x={-17} y={-9} width={34} height={18} fill="#2f3f52" stroke={INK}
          strokeWidth={2.4} />
      </g>

      {stageLabel && (
        <text x={44} y={plateTop + 26} fontSize={20} fill="#2f3830"
          fontFamily={FONT.body}>{stageLabel}</text>
      )}
      {wear > 0.3 && <RustStreak x={-7} y={-160} w={14} h={150} seed={seed}
        opacity={wear * 0.6} />}
    </g>
  );
};

// =============================================================================
// LOW WATER CROSSING — the most Texas piece of hydrology there is. A concrete slab
// through a creek bed, a depth marker beside it, and the gate that swings across
// when it is closed.
//
// Drawn DRY by default. A dry crossing with a closed gate tells the story of a
// warning that worked, and it does it without drawing water anyone has to imagine
// themselves in.
// =============================================================================
export const LowWaterCrossing: React.FC<Rig & {
  /** 0 dry, up to 1. Kept well under the marker: this file does not draw a crossing
   *  a person could drown at. */
  depth?: number;
  /** the swing gate across the road. */
  closed?: boolean;
}> = ({x = 0, y = 0, scale = 1, frame = 0, seed = 2, wear = 0.5, depth = 0, closed = true}) => {
  const L = useLight();
  const uid = useUid('lw');
  const K = fit('lowWaterCrossing', 100);
  const t = tones('#b3aa9c', L);
  const d = Math.max(0, Math.min(0.45, depth));

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <defs><FormGradient id={`${uid}_s`} t={t} softness={0.3} /></defs>
      {/* the creek bed and the slab through it */}
      <path d="M-300,0 q60,26 130,30 l40,0 q70,-4 130,-30 L300,0 L300,60 L-300,60 Z"
        fill="#8d8171" />
      <path d="M-300,0 q60,26 130,30 l40,0 q70,-4 130,-30" fill="none" stroke={INK}
        strokeWidth={3} opacity={0.5} />
      <rect x={-300} y={16} width={600} height={16} fill={`url(#${uid}_s)`}
        stroke={INK} strokeWidth={3} />
      {/* gravel and the two ruts worn into the approach */}
      {Array.from({length: 40}, (_, i) => {
        const k = rnd(seed, i);
        const k2 = rnd(seed, 100 + i);
        return <ellipse key={i} cx={-290 + k * 580} cy={34 + k2 * 24}
          rx={2 + k * 6} ry={1.4 + k2 * 3} fill="#a0937f" opacity={0.4 + k * 0.3} />;
      })}
      {d > 0.01 && (
        <g>
          <rect x={-160} y={30 - d * 26} width={320} height={d * 26 + 4} fill="#4d7386"
            opacity={0.6} />
          <path d={`M-160,${30 - d * 26} q40,${Math.sin(frame / 15) * 1.6} 80,0 t80,0 t80,0 t80,0`}
            fill="none" stroke="#a9cdd9" strokeWidth={2.4} opacity={0.8} />
        </g>
      )}

      {/* the depth marker. Ticks, no digits: the numbers on a real one are feet and
          this file does not get to print a measurement. */}
      <g transform="translate(150 0)">
        <rect x={-4} y={-96} width={8} height={112} fill="#efeae0" stroke={INK}
          strokeWidth={2.6} />
        {Array.from({length: 8}, (_, i) => (
          <rect key={i} x={-4} y={-92 + i * 14} width={8} height={7}
            fill={i % 2 ? '#c8543a' : '#efeae0'} />
        ))}
      </g>

      {/* the swing gate */}
      <g transform="translate(-210 0)">
        <rect x={-5} y={-84} width={10} height={84} fill="#6f757c" stroke={INK}
          strokeWidth={2.6} />
        <g transform={`rotate(${closed ? 0 : -78} 0 -66)`}>
          <rect x={0} y={-72} width={196} height={13} rx={3} fill="#d8a13c"
            stroke={INK} strokeWidth={3} />
          {Array.from({length: 6}, (_, i) => (
            <path key={i} d={`M${14 + i * 32},-72 L${28 + i * 32},-59`} stroke="#2b2519"
              strokeWidth={5} opacity={0.75} />
          ))}
        </g>
        {closed && (
          <circle cx={0} cy={-96} r={5}
            fill={Math.sin(frame / 7) > 0 ? '#c8543a' : '#4a2f2a'} />
        )}
      </g>
      {wear > 0.3 && <RustStreak x={-215} y={-84} w={10} h={84} seed={seed}
        opacity={wear * 0.5} />}
    </g>
  );
};

// =============================================================================
// SIREN MAST — the outdoor warning siren. A pole, a rotating head, and the solar
// and battery box that keeps it alive when the power has gone.
//
// `sounding` rotates the head and draws SOUND AS THIN EXPANDING ARCS, deliberately
// restrained. A cartoon blast of concentric rings turns an emergency into a
// graphic, and this is the one beat where that would be unforgivable.
// =============================================================================
export const SirenMast: React.FC<Rig & {sounding?: boolean}> = ({
  x = 0, y = 0, scale = 1, frame = 0, seed = 3, wear = 0.4, sounding = false,
}) => {
  const L = useLight();
  const uid = useUid('sn');
  const K = fit('sirenMast', 300);
  const t = tones('#9aa0a6', L);
  const spin = sounding ? (frame / 30) * 200 : rnd(seed, 1) * 360;
  const ring = (frame % 60) / 60;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <defs><FormGradient id={`${uid}_m`} t={t} softness={0.4} /></defs>
      <ContactShadow cx={0} cy={2} rx={22} opacity={0.24} blur={8} />
      <rect x={-9} y={-262} width={18} height={262} fill={`url(#${uid}_m)`}
        stroke={INK} strokeWidth={3.4} />
      {/* the climbing pegs, which are what says this is a mast and not a lamp post */}
      {Array.from({length: 11}, (_, i) => (
        <path key={i} d={`M-14,${-30 - i * 20} L14,${-30 - i * 20}`} stroke={t.shade}
          strokeWidth={2.4} />
      ))}

      {/* the head: a rotating horn cluster */}
      <g transform={`translate(0 -286)`}>
        <ellipse cx={0} cy={16} rx={30} ry={8} fill={t.core} stroke={INK} strokeWidth={3} />
        <g transform={`rotate(${spin})`}>
          {[0, 120, 240].map((a) => (
            <g key={a} transform={`rotate(${a})`}>
              <path d="M0,0 L44,-13 L44,13 Z" fill={t.base} stroke={INK} strokeWidth={3}
                strokeLinejoin="round" />
            </g>
          ))}
        </g>
        <circle cx={0} cy={0} r={12} fill={t.shade} stroke={INK} strokeWidth={3} />
        {/* the sound. Two thin arcs, and they fade. */}
        {sounding && [0, 1].map((i) => (
          <circle key={i} cx={0} cy={0} r={54 + ((ring + i * 0.5) % 1) * 96} fill="none"
            stroke="#d8a13c" strokeWidth={2.6}
            opacity={0.42 * (1 - ((ring + i * 0.5) % 1))} />
        ))}
      </g>

      {/* the solar panel and the battery cabinet at the base, which is the part that
          determines whether it works at three in the morning in a storm */}
      <g transform="translate(30 -222) rotate(-22)">
        <rect x={-24} y={-13} width={48} height={26} fill="#2f3f52" stroke={INK}
          strokeWidth={2.6} />
      </g>
      <rect x={-30} y={-74} width={42} height={74} rx={3} fill={t.core} stroke={INK}
        strokeWidth={3.4} />
      <circle cx={-9} cy={-58} r={3.4}
        fill={sounding ? '#c8543a' : '#5d9a63'} opacity={0.9} />
      {wear > 0.25 && <RustStreak x={-9} y={-262} w={18} h={250} seed={seed}
        opacity={wear * 0.5} />}
    </g>
  );
};

// =============================================================================
// RAIN CELL — the weather itself, as a convective cell over the horizon.
//
// The one honest visual for a flash flood that harms nobody to look at: the storm
// is drawn from a long way off, over land, doing what a storm does. The shaft of
// rain under the base is the whole image, and the anvil sheared off downwind is
// what makes it read as a real cell rather than a cloud.
// =============================================================================
export const RainCell: React.FC<{
  x?: number; y?: number; w?: number; h?: number; frame?: number; seed?: number;
  /** 0 building, 1 mature with a full shaft under it. */
  intensity?: number;
  /** which way the anvil is blown. */
  shear?: 1 | -1;
  lightning?: boolean;
}> = ({x = 0, y = 0, w = 700, h = 520, frame = 0, seed = 4,
       intensity = 0.75, shear = 1, lightning = false}) => {
  const uid = useUid('rc');
  const cx = x + w / 2;
  const base = y + h * 0.62;
  // A stroke every couple of seconds at most, and only when asked for.
  const flash = lightning && (frame % 71) < 3;

  return (
    <g>
      <defs>
        <linearGradient id={`${uid}_cloud`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8e6e2" />
          <stop offset="62%" stopColor="#9aa0a8" />
          <stop offset="100%" stopColor="#5d6570" />
        </linearGradient>
        <linearGradient id={`${uid}_shaft`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6f7d8a" stopOpacity={0.62 * intensity} />
          <stop offset="100%" stopColor="#6f7d8a" stopOpacity={0.14 * intensity} />
        </linearGradient>
      </defs>

      {/* the shaft first, so the cloud sits over it */}
      <path d={`M${cx - w * 0.19},${base} L${cx + w * 0.17},${base}
                L${cx + w * 0.24},${y + h} L${cx - w * 0.27},${y + h} Z`}
        fill={`url(#${uid}_shaft)`} />
      {/* streaks in the shaft, leaning with the wind */}
      {Array.from({length: 26}, (_, i) => {
        const k = rnd(seed, i);
        const px = cx - w * 0.2 + k * w * 0.4;
        const off = ((frame * (2.4 + k * 2) + i * 30) % (h * 0.38));
        return <path key={i} d={`M${px},${base + off} l${shear * 5},${18 + k * 14}`}
          stroke="#aeb9c2" strokeWidth={1.4} opacity={0.22 * intensity} />;
      })}

      {/* THE CELL, IN TWO PARTS, and the first version got it wrong in a way only a
          render showed: nine overlapping lobes all offset the same way stacked into a
          spiral that read as a nautilus shell. A convective cell is a FLAT DARK BASE
          with a TOWER rising off it, and the flat base is what a storm looks like
          from underneath more than the tower is.

          The base: a rank of wide low lobes at one height, which is the shelf. */}
      {Array.from({length: 5}, (_, i) => {
        const k = rnd(seed, 40 + i);
        const px = cx + (i / 4 - 0.5) * w * 0.4;
        return <ellipse key={`b${i}`} cx={px} cy={base - h * 0.03 - k * h * 0.02}
          rx={w * (0.1 + k * 0.04)} ry={h * (0.018 + k * 0.01)}
          fill="#6b737c" opacity={0.95} />;
      })}
      {/* The tower, and the proportion is the whole thing. The rewrite that fixed the
          nautilus still read as one, because the lobes were a hundred and forty units
          across in a tower a hundred and ninety tall: SIX OVERLAPPING CIRCLES IN A
          SPACE ONE CIRCLE HIGH IS A BLOB whatever you do to the offsets. A cell is
          three or four times taller than one of its lobes, so the tower runs nearly
          the full box and the lobes are small enough to be countable. */}
      {(() => {
        // AND THE THING THAT TOOK FOUR RENDERS TO SEE. A gradient applied PER LOBE
        // runs top to bottom of that lobe's own box, so every lobe in an overlapping
        // cluster arrives with its own dark underside, and a column of dark
        // undersides is a row of visible arcs the eye assembles into a spiral. Three
        // rewrites went at the proportions, the offsets and the count and none of
        // them could work, because the defect was never the geometry: THE CLUSTER
        // WAS PAINTED AS TEN SHAPES INSTEAD OF AS ONE MASS.
        //
        // So the mass is flat and its overlaps are invisible, and the form comes
        // from a second smaller pass up the lit side with a shaded rank along the
        // base. Same shapes, same positions, and it stops being a shell. It is the
        // sibling of the horizon-haze note in biomes.tsx: a fill that reaches full
        // strength exactly where its shape is cut prints its own outline.
        const lobes = Array.from({length: 10}, (_, i) => {
          const k = rnd(seed, 60 + i);
          const u = (i + 1) / 10;
          const r = w * 0.19 * (1 - u * 0.35) * (0.88 + k * 0.24);
          return {
            r, u,
            px: cx + shear * u * u * w * 0.1 + (k - 0.5) * w * 0.08,
            py: base - h * 0.02 - u * (base - (y + h * 0.08)),
          };
        });
        return (
          <g>
            {lobes.map((l, i) => (
              <ellipse key={`m${i}`} cx={l.px} cy={l.py} rx={l.r * 1.25} ry={l.r}
                fill="#9aa2ab" />
            ))}
            {lobes.slice(0, 4).map((l, i) => (
              <ellipse key={`s${i}`} cx={l.px + l.r * 0.12} cy={l.py + l.r * 0.44}
                rx={l.r * 1.02} ry={l.r * 0.52} fill="#717983" opacity={0.55} />
            ))}
            {lobes.map((l, i) => (
              <ellipse key={`l${i}`} cx={l.px - l.r * 0.22} cy={l.py - l.r * 0.26}
                rx={l.r * 1.02} ry={l.r * 0.86} fill="#e0e4e8"
                opacity={0.14 + l.u * 0.22} />
            ))}
          </g>
        );
      })()}
      {/* the anvil, sheared downwind off the top of the tower. The tell that it is a
          real cell and not a cloud. */}
      <ellipse cx={cx + shear * w * 0.26} cy={y + h * 0.11} rx={w * 0.3} ry={h * 0.042}
        fill="#eceae6" opacity={0.9} />
      <ellipse cx={cx + shear * w * 0.1} cy={y + h * 0.145} rx={w * 0.19} ry={h * 0.036}
        fill="#e2e0dc" opacity={0.85} />

      {flash && (
        <g opacity={0.8}>
          <path d={`M${cx - w * 0.04},${base} l${-w * 0.03},${h * 0.1}
                    l${w * 0.035},${-h * 0.01} l${-w * 0.02},${h * 0.13}`}
            fill="none" stroke="#f4f1e6" strokeWidth={3} strokeLinejoin="round" />
          <ellipse cx={cx} cy={base - h * 0.06} rx={w * 0.2} ry={h * 0.08}
            fill="#f4f1e6" opacity={0.18} />
        </g>
      )}
    </g>
  );
};

// =============================================================================
// HANDSET ALERT — the last hundred milliseconds of the whole system. A phone in a
// hand with a banner on it.
//
// The banner text comes from the caller and nothing else does. This component will
// happily draw an empty banner, which is the honest picture of an alert nobody
// wrote.
// =============================================================================

/**
 * WHERE EVERY LINE OF THE BANNER GOES, given whatever the caller passed.
 *
 * Exported so a gate can call it on the real strings without rendering anything, and
 * so the answer is one calculation rather than one in the drawing and another in the
 * checker. `tests/type_fit.mjs` is the caller.
 *
 * THE DEFECT IT EXISTS FOR. The headline drew as ONE line at font size 9 in a panel
 * 70 units wide. "FLASH FLOOD WARNING" is about 111 units, so the one beat this show
 * has about an emergency message ran the message off the glass, and the body line
 * went with it. Shortening that string would have fixed that string: these are props,
 * and the next caller writes a longer warning.
 */
export const BANNER_INNER = 58;   // -29 to 29, the panel's inside width
export const HOME_BAR = 78;       // the home indicator's y, the bottom of the usable screen

export function alertBanner(headline?: string, body?: string) {
  const head = headline ? wrapToWidth(headline, BANNER_INNER, 9, true) : [];
  const rest = body ? wrapToWidth(body, BANNER_INNER, 7.4, false) : [];
  const top = -72;
  const headBase = top + 19;                                   // under the red rule
  const lastHead = head.length ? headBase + (head.length - 1) * 10 : top + 11;
  const bodyBase = lastHead + 10.1;
  const lastBody = rest.length ? bodyBase + (rest.length - 1) * 8.6 : lastHead;
  const bottom = lastBody + 7;                                 // descender plus padding
  // The two furniture bars follow the banner down. The lower one's foot is what
  // decides whether a banner has outgrown the phone, and it is returned rather than
  // restated in the checker, so the gate cannot pass while the picture collides.
  const furniture = [bottom + 13, bottom + 25];
  return {
    head, body: rest, top, headBase, bodyBase, bottom, height: bottom - top,
    furniture, furnitureFoot: furniture[1] + 4,
  };
}

export const HandsetAlert: React.FC<Rig & {
  headline?: string; body?: string; ringing?: boolean;
}> = ({x = 0, y = 0, scale = 1, frame = 0, seed = 5, headline, body, ringing = true}) => {
  const uid = useUid('ha');
  const K = fit('handset', 100);
  const buzz = ringing ? Math.sin(frame / 2.2) * 1.6 : 0;
  const banner = alertBanner(headline, body);

  return (
    <g transform={`translate(${x + buzz} ${y}) scale(${K * scale}) rotate(${
      -4 + rnd(seed, 1) * 8})`}>
      <defs>
        <linearGradient id={`${uid}_scr`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#20262d" />
          <stop offset="100%" stopColor="#161b21" />
        </linearGradient>
      </defs>
      <rect x={-46} y={-96} width={92} height={192} rx={12} fill="#2b3138"
        stroke={INK} strokeWidth={5} />
      <rect x={-40} y={-88} width={80} height={176} rx={7} fill={`url(#${uid}_scr)`} />
      {/* THE BANNER WRAPS, and the panel is sized to what came out of the wrap.

          It used to draw the headline as one line at font size 9 in a panel 70 units
          wide. "FLASH FLOOD WARNING" is about 12.3 ems, which is 111 units, so the
          one beat this show has about an emergency message ran the message off the
          glass. The body line overflowed too.

          Shortening the string would have fixed the string. `headline` and `body` are
          props, so the panel has to survive whatever a caller passes: it wraps at the
          panel's real inside width and then grows to hold the lines. A real alert on
          a real lock screen is several lines deep for exactly this reason. */}
      <g>
        <rect x={-35} y={banner.top} width={70} height={banner.height} rx={6} fill="#e8e3d8" />
        <rect x={-35} y={banner.top} width={70} height={11} rx={6} fill="#c8543a" />
        <rect x={-35} y={banner.top + 6} width={70} height={5} fill="#c8543a" />
        {banner.head.map((l, i) => (
          <text key={`h${i}`} x={-29} y={banner.headBase + i * 10} fontSize={9} fontWeight={700}
            fill="#1f1a16" fontFamily={FONT.body}>{l}</text>
        ))}
        {banner.body.map((l, i) => (
          <text key={`b${i}`} x={-29} y={banner.bodyBase + i * 8.6} fontSize={7.4}
            fill="#3b332a" fontFamily={FONT.body}>{l}</text>
        ))}
      </g>
      {/* the rest of the lock screen, as unreadable furniture. It FOLLOWS the banner,
          which no longer has a fixed height: a longer warning pushes it down rather
          than being drawn over it. */}
      <rect x={-26} y={banner.furniture[0]} width={52} height={5} rx={2.5} fill="#3a434c" />
      <rect x={-32} y={banner.furniture[1]} width={64} height={4} rx={2} fill="#2e363e" />
      <rect x={-18} y={HOME_BAR} width={36} height={4} rx={2} fill="#4a545e" />
    </g>
  );
};
