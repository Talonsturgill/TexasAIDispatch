import React from 'react';
import {useUid} from './uid';
import {INK} from './lighting';
import {FONT} from './type';

// =============================================================================
// SENSING — how you draw a machine LOOKING at something.
//
// knowledge/texas/APPLICATIONS.md moved this show onto the application layer, and
// the application layer has one recurring visual problem: AI is invisible. A
// pumpjack looks like a pumpjack whether or not a model is choosing its stroke. A
// cow looks like a cow. A scan looks like a scan.
//
// What you can actually draw is THE MACHINE'S OUTPUT LAID OVER THE WORLD: the box,
// the mask, the track, the confidence, the plume the camera can see and the eye
// cannot. That overlay is the grammar of this entire show, and it works over every
// beat: a weed, a leak, a calf, a truck, a tumour, a rising creek.
//
// THREE RULES, and the third is the one that makes this honest rather than
// decorative.
//
//   IT IS A MACHINE'S OUTPUT, NOT A GRAPHIC. It jitters between frames because
//   trackers jitter. It has a label and a number. It is drawn in a hairline that
//   sits ON the picture rather than in the picture, and it never gets a drop
//   shadow, because it is not an object in the world.
//
//   CONFIDENCE IS NEVER ALL 0.99. A frame of uniformly certain detections is a
//   product demo. Real output is a spread, and the spread is the story: the model
//   is sure about the near cow and unsure about the far one.
//
//   DRAW THE FALSE POSITIVE. A box around a rock labelled "calf 0.61" is the most
//   honest thing available in this whole library, and APPLICATIONS.md requires an
//   honest counter-image from every story. `wrong` marks a detection as a miss and
//   the component draws it DIFFERENTLY, so a scene cannot show one by accident and
//   cannot hide one either.
// =============================================================================

// The overlay's own colours. Deliberately NOT the brand palette: this layer is a
// machine talking, and it should read as a different register from the world.
const SEE = '#3fd6c8';          // a detection the model is confident about
const SOFT = '#e0b23f';         // a detection it is not sure about
const MISS = '#e0631f';         // a detection that is WRONG, and we say so
const HAIR = 1.6;

const rnd = (seed: number, ch: number) => {
  const k = ((seed * 2654435761) ^ (ch * 40503)) >>> 0;
  return ((k >>> 8) % 10000) / 10000;
};

export interface Detection {
  x: number; y: number; w: number; h: number;
  label: string;
  /** 0..1. Never make these all the same, and never make them all high. */
  conf: number;
  /** THE COUNTER-IMAGE. A detection that is simply wrong, drawn as such. */
  wrong?: boolean;
  /** an id for the tracker readout, because a real tracker keeps identity */
  track?: number;
}

const hue = (d: Detection) => (d.wrong ? MISS : d.conf >= 0.8 ? SEE : SOFT);

/**
 * DETECTION BOXES over whatever is behind them.
 *
 * `settle` runs 0 to 1: at 0 the boxes are still hunting and jitter hard, at 1 the
 * tracker has locked. A scene that shows the lock happening is showing the machine
 * work, which is more interesting than a frame where it has already worked.
 */
export const Detections: React.FC<{
  items: Detection[]; frame: number; seed?: number; settle?: number; showConf?: boolean;
}> = ({items, frame, seed = 1, settle = 1, showConf = true}) => {
  const s = Math.max(0, Math.min(1, settle));
  return (
    <g>
      {items.map((d, i) => {
        // A tracker jitters. A graphic does not. This is most of what sells it.
        const j = (1 - s) * 6 + 0.7;
        const dx = Math.sin(frame / 3.1 + rnd(seed, i) * 9) * j;
        const dy = Math.cos(frame / 2.7 + rnd(seed, 40 + i) * 9) * j;
        const c = hue(d);
        const on = s > 0.15 || i % 2 === 0;              // late boxes appear as it converges
        if (!on) return null;
        const cl = Math.min(14, d.w * 0.22);
        return (
          <g key={i} transform={`translate(${d.x + dx} ${d.y + dy})`} opacity={0.55 + s * 0.45}>
            {/* CORNERS, not a full rectangle. A closed box reads as a frame around a
                picture; corner ticks read as something being measured. */}
            <path d={`M0,${cl} L0,0 L${cl},0 M${d.w - cl},0 L${d.w},0 L${d.w},${cl}
                      M${d.w},${d.h - cl} L${d.w},${d.h} L${d.w - cl},${d.h}
                      M${cl},${d.h} L0,${d.h} L0,${d.h - cl}`}
              fill="none" stroke={c} strokeWidth={HAIR * 1.6} strokeLinecap="square" />
            <rect x={0} y={0} width={d.w} height={d.h} fill={c} opacity={d.wrong ? 0.1 : 0.06} />
            {d.wrong && (
              // A wrong detection is CROSSED. Nobody can mistake it for a hit and
              // nobody can quietly leave it out either.
              <path d={`M0,0 L${d.w},${d.h} M${d.w},0 L0,${d.h}`} stroke={MISS}
                strokeWidth={HAIR} opacity={0.5} />
            )}
            <g transform={`translate(0 ${-6})`}>
              <rect x={-1} y={-11} width={d.label.length * 6.4 + (showConf ? 30 : 8)} height={13}
                fill={c} opacity={0.88} />
              <text x={2} y={-1.5} fontSize={9.5} fill="#0d1220" fontWeight={700}
                fontFamily={FONT.mono}>
                {d.label}{showConf ? ` ${d.conf.toFixed(2)}` : ''}
              </text>
            </g>
            {d.track !== undefined && (
              <text x={d.w - 2} y={d.h - 4} fontSize={8} fill={c} textAnchor="end"
                fontFamily={FONT.mono} opacity={0.8}>#{d.track}</text>
            )}
          </g>
        );
      })}
    </g>
  );
};

/**
 * A SEGMENTATION MASK, with a RAGGED edge.
 *
 * The tell of a fake one is a smooth outline. A real mask follows a grid of
 * predictions and its boundary is slightly wrong in a way that is characteristic:
 * it steps, it bulges, it clips a corner. `noise` is how uncertain the model is,
 * and turning it to zero should look wrong to anybody who has seen real output.
 */
export const Mask: React.FC<{
  cx: number; cy: number; rx: number; ry: number; frame: number;
  seed?: number; noise?: number; color?: string; label?: string;
}> = ({cx, cy, rx, ry, frame, seed = 2, noise = 0.16, color = SEE, label}) => {
  const N = 40;
  const pts = Array.from({length: N}, (_, i) => {
    const a = (i / N) * Math.PI * 2;
    const w = 1 + (rnd(seed, i) - 0.5) * noise * 2
      + Math.sin(frame / 9 + i * 0.7) * noise * 0.18;
    return `${(cx + Math.cos(a) * rx * w).toFixed(1)},${(cy + Math.sin(a) * ry * w).toFixed(1)}`;
  });
  return (
    <g>
      <path d={`M${pts.join(' L')} Z`} fill={color} opacity={0.17} />
      <path d={`M${pts.join(' L')} Z`} fill="none" stroke={color} strokeWidth={HAIR * 1.4}
        strokeLinejoin="round" opacity={0.92} />
      {label && (
        <text x={cx} y={cy - ry - 8} fontSize={10} fill={color} textAnchor="middle"
          fontFamily={FONT.mono} fontWeight={700}>{label}</text>
      )}
    </g>
  );
};

/**
 * A SWEEP. A sensor pass over a field, a pipe run, a scan.
 *
 * The line is not the point. What is behind the line is: everything the sweep has
 * already passed is CLASSIFIED and everything ahead of it is not, so the picture
 * shows work being done rather than a decoration moving.
 */
export const Sweep: React.FC<{
  x: number; y: number; w: number; h: number; p: number; color?: string; vertical?: boolean;
}> = ({x, y, w, h, p, color = SEE, vertical = false}) => {
  const t = Math.max(0, Math.min(1, p));
  const id = useUid('sw');
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2={vertical ? '0' : '1'} y2={vertical ? '1' : '0'}>
          <stop offset="0" stopColor={color} stopOpacity="0.02" />
          <stop offset="0.82" stopColor={color} stopOpacity="0.16" />
          <stop offset="1" stopColor={color} stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={vertical ? w : w * t} height={vertical ? h * t : h}
        fill={`url(#${id})`} />
      {vertical
        ? <path d={`M${x},${y + h * t} L${x + w},${y + h * t}`} stroke={color}
            strokeWidth={HAIR * 1.8} opacity={0.9} />
        : <path d={`M${x + w * t},${y} L${x + w * t},${y + h}`} stroke={color}
            strokeWidth={HAIR * 1.8} opacity={0.9} />}
    </g>
  );
};

/**
 * A PLUME the camera can see and the eye cannot.
 *
 * Methane is invisible. That is the entire reason there is a computer-vision story
 * in the Permian at all, and it is a gift to a film: the frame can show the world
 * as a person sees it and the same world as the sensor sees it, and the difference
 * IS the technology. Draw this over an otherwise ordinary wellhead.
 */
export const Plume: React.FC<{
  x: number; y: number; frame: number; seed?: number; strength?: number; rate?: string;
  /** true when the frame behind it is dark. See the note below: this is not cosmetic. */
  onDark?: boolean;
}> = ({x, y, frame, seed = 3, strength = 1, rate, onDark = false}) => {
  const s = Math.max(0, Math.min(1, strength));
  // A SCREEN BLEND IS INVISIBLE ON A LIGHT GROUND, and the first version used one
  // unconditionally. Screen only ever brightens, so over a near-white frame it does
  // nothing at all: the plume rendered as a faint smudge and the leak rate was
  // unreadable. A day scene in this show is light far more often than it is dark, so
  // the default is a normal blend in a colour that reads on both, and `onDark`
  // switches to screen where screen is actually the better answer.
  const blend = onDark ? ('screen' as const) : ('normal' as const);
  const ink = onDark ? SOFT : '#b07a2a';
  return (
    <g transform={`translate(${x} ${y})`} style={{mixBlendMode: blend}}>
      {Array.from({length: 7}, (_, i) => {
        const q = rnd(seed, i);
        const ph = frame / (26 + q * 20) + q * 8;
        const w = 16 + q * 40;
        return (
          <path key={i}
            d={`M${Math.sin(ph) * 6},0
                C${Math.sin(ph + 0.7) * 24 - 8},${-40 - q * 30}
                 ${Math.sin(ph + 1.6) * 40 + 14},${-90 - q * 50}
                 ${Math.sin(ph + 2.4) * 56 + 26},${-150 - q * 70}`}
            stroke={ink} strokeWidth={w} fill="none" strokeLinecap="round"
            opacity={(onDark ? 0.05 + q * 0.07 : 0.09 + q * 0.1) * s} />
        );
      })}
      {rate && (
        <g transform="translate(46 -156)">
          <rect x={-4} y={-11} width={rate.length * 7.4 + 10} height={15} fill={ink}
            opacity={0.92} />
          <text x={1} y={0} fontSize={11} fill="#0d1220" fontFamily={FONT.mono}
            fontWeight={700}>{rate}</text>
        </g>
      )}
    </g>
  );
};

/**
 * A READOUT PANEL. The corner of the frame where the machine says what it thinks.
 *
 * Rows are (label, value) pairs the SCENE passes in, which matters: every numeral
 * this project publishes traces to a computed value, and a readout that invents
 * plausible-looking telemetry is the exact failure `ship_gate` exists to catch. If
 * a row has no computed value behind it, it does not go on screen.
 */
export const Readout: React.FC<{
  x: number; y: number; rows: [string, string][]; title?: string; w?: number; frame?: number;
}> = ({x, y, rows, title, w = 200, frame = 0}) => {
  // TYPE SCALES WITH THE PANEL, and it did not, which is why five scenes of a film shipped
  // their revelations in four physical pixels.
  //
  // This was authored as the corner of the frame where the machine says what it thinks, at
  // a fixed 10.5px against a default width of 200. That is right at 200. A board asking for
  // 460 or 840 is asking for a panel four times the size with the same tiny type in it, and
  // a whole panel of scorers independently reported the same thing: the readouts carry the
  // argument and nobody can read them at feed size.
  //
  // So the size is derived from the width the caller asked for. A small instrument panel is
  // still a small instrument panel; a wide one gets type to match. Clamped at both ends so a
  // 200 unit panel stays an instrument and a 900 unit panel does not become a headline.
  // AND IT MUST ALSO FIT SIDEWAYS, which the first version of that fix did not check.
  // The label sets from the left and the value is anchored to the right, so nothing
  // errors and nothing clips when they collide -- they simply OVERPRINT, and the film
  // rendered "on Vi30ta times faster" where it meant a label and a number. SVG text does
  // not wrap, does not clip and does not push its neighbour, so a layout that assumes a
  // string is narrow enough is a layout that will one day draw two strings in one place.
  //
  // The face is monospaced, which is the one case where a width can be COMPUTED rather
  // than guessed. ADV is the advance as a fraction of the size, held slightly wide on
  // purpose: being a point small costs nothing and being a point large costs the row.
  const ADV = 0.62;
  const PAD = 0.85;                       // side padding, in units of the row size
  const GAP = 1.4;                        // the gutter a reader needs between the two
  const widest = rows.reduce((m, [k, v]) => Math.max(m, k.length + v.length), 0);
  const fits = widest > 0 ? w / (widest * ADV + 2 * PAD + GAP) : 38;
  const fs = Math.max(9, Math.min(38, w * 0.075, fits));
  const lead = fs * 1.5;
  const pad = fs * PAD;
  const tfs = title
    ? Math.max(9, Math.min(fs * 0.68, (w - 2 * pad) / Math.max(1, title.length * ADV)))
    : 0;
  const top = title ? tfs + fs * 0.7 : fs * 0.5;
  const h = top + rows.length * lead + fs * 0.6;
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* OPAQUE, not translucent. A 0.72 fill let the racks behind it through and dropped
          the contrast of the one thing in frame a viewer is asked to read. */}
      <rect x={0} y={0} width={w} height={h} fill="#0b0e15" opacity={0.94} rx={fs * 0.15} />
      <path d={`M0,0 L${w},0 M0,${h} L${w},${h}`} stroke={SEE} strokeWidth={HAIR * 1.6}
        opacity={0.7} />
      {title && (
        <text x={pad} y={tfs + fs * 0.15} fontSize={tfs} fill={SEE} fontFamily={FONT.mono}
          fontWeight={700} letterSpacing={1}>{title.toUpperCase()}</text>
      )}
      {rows.map(([k, v], i) => (
        <g key={k} transform={`translate(0 ${top + lead * (i + 0.8)})`}>
          <text x={pad} y={0} fontSize={fs} fill="#9db2bd" fontFamily={FONT.mono}>{k}</text>
          <text x={w - pad} y={0} fontSize={fs} fill="#f2ede2" textAnchor="end"
            fontFamily={FONT.mono} fontWeight={700}>{v}</text>
        </g>
      ))}
      {/* the cursor, which is the cheapest possible sign that a thing is LIVE */}
      <rect x={w - pad} y={fs * 0.4} width={fs * 0.45} height={fs * 0.16}
        fill={SEE} opacity={Math.sin(frame / 8) > 0 ? 0.9 : 0.15} />
    </g>
  );
};

/**
 * A CONFIDENCE SPREAD, drawn as a strip of bars.
 *
 * Exists to make the second rule visible: a run of identical tall bars is a product
 * demo, and a real distribution has a tail. A scene that puts this next to its
 * detections is showing the viewer how sure the machine actually is, which is the
 * single most under-reported fact about every deployment on this beat.
 */
export const ConfidenceSpread: React.FC<{
  x: number; y: number; values: number[]; w?: number; h?: number; threshold?: number;
}> = ({x, y, values, w = 160, h = 40, threshold}) => {
  const bw = values.length ? w / values.length : w;
  return (
    <g transform={`translate(${x} ${y})`}>
      {values.map((v, i) => (
        <rect key={i} x={i * bw} y={h - h * Math.max(0.02, Math.min(1, v))}
          width={bw - 1.4} height={h * Math.max(0.02, Math.min(1, v))}
          fill={threshold !== undefined && v < threshold ? MISS : v >= 0.8 ? SEE : SOFT}
          opacity={0.85} />
      ))}
      <path d={`M0,${h} L${w},${h}`} stroke="#8fa4ae" strokeWidth={HAIR} opacity={0.6} />
      {threshold !== undefined && (
        <g>
          <path d={`M0,${h - h * threshold} L${w},${h - h * threshold}`} stroke="#e4ded2"
            strokeWidth={HAIR} strokeDasharray="4 3" opacity={0.75} />
          <text x={w + 5} y={h - h * threshold + 3.5} fontSize={9} fill="#e4ded2"
            fontFamily={FONT.mono}>{threshold.toFixed(2)}</text>
        </g>
      )}
    </g>
  );
};
