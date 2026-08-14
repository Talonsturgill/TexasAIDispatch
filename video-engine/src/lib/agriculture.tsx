import React from 'react';
import {useUid} from './uid';
import {M} from './scale';
import {tones, FormGradient, ContactShadow, useLight, Galvanized, RustStreak,
        CalicheDust, INK} from './lighting';

// =============================================================================
// AGRICULTURE — the second beat, and the one the engine could not draw at all.
//
// `knowledge/texas/APPLICATIONS.md` ranks farm and ranch second by how Texas it
// is, and the engine had a windmill, a stock tank and a cattle guard. Those are
// the FURNITURE of the beat. The SUBJECT of it -- a variable-rate centre pivot
// over a shrinking aquifer -- had no component at all, so every board about the
// most documented AI-in-agriculture story in the state had to be staged as a
// landscape with a caption over it.
//
// THREE THINGS THIS FILE GETS RIGHT ON PURPOSE, because each is the difference
// between a Texan recognising the place and a Texan recognising a stock image.
//
// DROP HOSES, NEVER TOP GUNS. A pivot drawn with an impact sprinkler throwing an
// arc off the top of the pipe is a 1970s pivot. On the High Plains, over the
// Ogallala, almost every pivot runs LEPA or LESA drops hanging to just above the
// crop, precisely because water thrown into hot dry air evaporates before it
// lands. Drawing the arc would say the opposite of what the beat is about.
//
// THE PIVOT RECEDES. It is a quarter-mile machine. Drawn flat it reads as a
// fence, and the whole visual idea -- one machine standing over an entire section
// of land -- is lost. Every span here steps back in depth, gets smaller, pales
// into the haze and rises toward the horizon.
//
// VARIABLE RATE IS DRAWN, NOT ASSERTED. The AI in this beat is a prescription
// map: different nozzles at different rates over different soil, in the same
// pass. So `prescription` drives spray density span by span, and a scene that
// wants a viewer to KNOW that is what they are seeing composes a `readout` beside
// it rather than this file printing a number it was not given.
// =============================================================================


/**
 * Real dimensions, so `scale={1}` beside a person is right without anyone thinking
 * about it. These are measurements and they belong in the source where the drawing
 * can be checked against them.
 */
export const AG_M: Record<string, {h: number; note: string}> = {
  centrePivot: {h: 4.3, note: 'high-clearance tower, ground to the top of the pipe'},
  grainElevator: {h: 38, note: 'concrete silo bank to the top of the headhouse'},
  feedlotPen: {h: 1.6, note: 'to the top rail of the pen fence'},
  soilProbe: {h: 1.4, note: 'stake, solar panel and antenna above the row'},
  herdSensor: {h: 0.075, note: 'a cattle ear tag, across the face of the panel'},
  cropRows: {h: 1.1, note: 'mature cotton at the top of the canopy'},
};

const fit = (k: keyof typeof AG_M, local: number) => (AG_M[k].h * M) / local;

const rnd = (seed: number, ch: number) => {
  const k = ((seed * 2654435761) ^ (ch * 40503)) >>> 0;
  return ((k >>> 8) % 10000) / 10000;
};

interface Rig {
  x?: number; y?: number; scale?: number; frame?: number; facing?: 1 | -1;
  seed?: number; wear?: number;
}

// =============================================================================
// CENTRE PIVOT — the machine on the Panhandle skyline, and the subject of the
// beat rather than the scenery behind it.
//
// The pivot point is at the LEFT of the local frame and the machine walks away
// from the camera to the right, which is the composition that shows what it is.
// Each span is a truss, a tower and a run of drop hoses, drawn one depth step
// further back than the last.
// =============================================================================
export const CentrePivot: React.FC<Rig & {
  /** how many spans are visible. A quarter-section machine is 7 to 9. */
  spans?: number;
  /** per-span application rate, 0 to 1. THE PRESCRIPTION, and the AI in the beat.
   *  Given fewer entries than spans it repeats; given none it derives a varied one
   *  from the seed, because a pivot running one flat rate is the thing this beat
   *  is about NOT doing. */
  prescription?: number[];
  /** false parks the machine. A parked pivot with dry ground under it is its own
   *  story and the caller has to ask for it. */
  running?: boolean;
  /** the end gun, which throws the corner a drop hose cannot reach. Off by default:
   *  it is the one place an arc of water is honest, and it is not the common case. */
  endGun?: boolean;
}> = ({
  x = 0, y = 0, scale = 1, frame = 0, facing = 1, seed = 1, wear = 0.4,
  spans = 6, prescription, running = true, endGun = false,
}) => {
  const L = useLight();
  const uid = useUid('cp');
  const K = fit('centrePivot', 100);          // local frame: 100 units to the pipe

  const steel = tones('#9aa39b', L);          // faded galvanised, the Zimmatic green gone grey
  const rx = prescription && prescription.length
    ? prescription
    : Array.from({length: spans}, (_, i) => 0.25 + rnd(seed, 30 + i) * 0.75);
  const rate = (i: number) => Math.max(0, Math.min(1, rx[i % rx.length]));

  // The machine creeps. A quarter-section pivot takes most of a day for one
  // revolution, so at 30fps the honest motion is almost imperceptible, and the
  // wheels are what carry it: a tower that has not moved but whose wheel has
  // turned reads as motion where a translated tower reads as a slide.
  const creep = running ? (frame / 30) * 0.9 : 0;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      <defs>
        <FormGradient id={`${uid}_s`} t={steel} softness={0.45} />
        {/* THE WATER, and it took a render to get right. The first version was a wide
            ellipse at 0.42, which reads as a white RING under every nozzle rather than
            as spray: an ellipse filled with a vertical gradient shows its own edge
            wherever the gradient has not yet reached zero. Narrow, faint and fading
            from BOTH ends is what a LEPA drop actually looks like from twenty yards. */}
        <linearGradient id={`${uid}_mist`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dfeaef" stopOpacity="0" />
          <stop offset="22%" stopColor="#dfeaef" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#dfeaef" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ---- the pivot point: a concrete pad, the riser and the collector ring */}
      <ContactShadow cx={0} cy={2} rx={34} opacity={0.3} blur={9} />
      <ellipse cx={0} cy={0} rx={30} ry={7} fill="#b9b0a2" stroke={INK} strokeWidth={2.6} />
      <rect x={-7} y={-100} width={14} height={100} fill={`url(#${uid}_s)`}
        stroke={INK} strokeWidth={3} />
      <rect x={-13} y={-104} width={26} height={12} rx={3} fill="#5d6a63"
        stroke={INK} strokeWidth={3} />
      {wear > 0.25 && <RustStreak x={-7} y={-96} w={14} h={92} seed={seed} opacity={wear * 0.7} />}

      {Array.from({length: spans}, (_, i) => {
        // DEPTH. Each span is smaller, higher and paler than the one before it.
        // The near span is full size; the far one is a little over a third.
        const d0 = 1 - (i / spans) * 0.62;
        const d1 = 1 - ((i + 1) / spans) * 0.62;
        const x0 = 28 + (i / spans) * 470;
        const x1 = 28 + ((i + 1) / spans) * 470;
        const lift0 = (1 - d0) * 46;
        const lift1 = (1 - d1) * 46;
        const pipe0 = -100 * d0 - lift0;
        const pipe1 = -100 * d1 - lift1;
        const r = rate(i);
        const k = rnd(seed, 60 + i);

        return (
          <g key={i} opacity={0.5 + d0 * 0.5}>
            {/* the truss: top chord is the water pipe, and the bracing below it is
                what makes a quarter mile of pipe hold itself up. Draw the pipe
                without the truss and it reads as a wire. */}
            <path d={`M${x0},${pipe0} L${x1},${pipe1}`} stroke={`url(#${uid}_s)`}
              strokeWidth={7 * d0} strokeLinecap="round" />
            <path d={`M${x0},${pipe0} L${x1},${pipe1}`} stroke={INK}
              strokeWidth={8.4 * d0} fill="none" opacity={0.28} />
            <path d={`M${x0},${pipe0 + 3} L${(x0 + x1) / 2},${(pipe0 + pipe1) / 2 + 26 * d0}
                      L${x1},${pipe1 + 3}`}
              fill="none" stroke="#7d8781" strokeWidth={2.4 * d0} />
            {Array.from({length: 4}, (_, j) => {
              const u = (j + 0.5) / 4;
              const px = x0 + (x1 - x0) * u;
              const py = pipe0 + (pipe1 - pipe0) * u;
              const sag = 26 * d0 * (1 - Math.abs(u - 0.5) * 2) + 6 * d0;
              return <path key={j} d={`M${px},${py + 3} L${px},${py + sag}`}
                stroke="#7d8781" strokeWidth={1.8 * d0} />;
            })}

            {/* ---- DROP HOSES. Hanging to just above the canopy, never an arc off
                    the top. The sway is the wind, and it is what stops a row of
                    identical verticals from reading as a comb. */}
            {Array.from({length: 5}, (_, j) => {
              const u = (j + 0.5) / 5;
              const px = x0 + (x1 - x0) * u;
              const py = pipe0 + (pipe1 - pipe0) * u;
              const drop = (72 * d0) * (0.72 + r * 0.28);
              const sway = Math.sin(frame / 23 + i * 1.7 + j * 0.9 + rnd(seed, 90 + j) * 6)
                * 3.2 * d0;
              return (
                <g key={j}>
                  <path d={`M${px},${py + 4} q${sway},${drop * 0.55} ${sway * 1.6},${drop}`}
                    fill="none" stroke="#4d5a55" strokeWidth={2.2 * d0} strokeLinecap="round" />
                  <circle cx={px + sway * 1.6} cy={py + drop} r={2.6 * d0} fill="#3a4541" />
                  {/* the water. Density and reach are the PRESCRIPTION, so a span
                      running low is visibly running low rather than annotated. */}
                  {running && r > 0.08 && (
                    <ellipse cx={px + sway * 1.6} cy={py + drop + 13 * d0 * r}
                      rx={3.4 * d0 * (0.5 + r)} ry={16 * d0 * (0.5 + r)}
                      fill={`url(#${uid}_mist)`} />
                  )}
                </g>
              );
            })}

            {/* ---- the tower at the far end of the span, on its two narrow wheels */}
            <g transform={`translate(${x1} 0)`}>
              <ContactShadow cx={0} cy={-lift1 + 1} rx={17 * d1} opacity={0.26} blur={7} />
              <path d={`M${-15 * d1},${-lift1} L${-3 * d1},${pipe1 + 4}
                        M${15 * d1},${-lift1} L${3 * d1},${pipe1 + 4}`}
                stroke={`url(#${uid}_s)`} strokeWidth={5 * d1} fill="none" />
              <path d={`M${-11 * d1},${pipe1 * 0.45 - lift1 * 0.5}
                        L${11 * d1},${pipe1 * 0.45 - lift1 * 0.5}`}
                stroke="#7d8781" strokeWidth={3 * d1} />
              {/* the drive wheel. It TURNS, and the tower does not translate, which
                  is the honest way to draw a machine that moves a metre a minute. */}
              {[-1, 1].map((s) => (
                <g key={s} transform={`translate(${s * 15 * d1} ${-lift1 - 9 * d1})`}>
                  <circle cx={0} cy={0} r={9 * d1} fill="#3f4a45" stroke={INK}
                    strokeWidth={2.6 * d1} />
                  <g transform={`rotate(${creep * 40 + k * 90})`}>
                    {[0, 60, 120].map((a) => (
                      <path key={a} d={`M0,0 L${Math.cos((a * Math.PI) / 180) * 9 * d1},${
                        Math.sin((a * Math.PI) / 180) * 9 * d1}`}
                        stroke="#7d8781" strokeWidth={1.6 * d1} />
                    ))}
                  </g>
                </g>
              ))}
              {/* the rut the wheel has worn, which is the thing that says the machine
                  has been going round this circle for twenty years */}
              <ellipse cx={0} cy={-lift1 + 2} rx={19 * d1} ry={3 * d1}
                fill="#8f8375" opacity={0.5} />
            </g>
          </g>
        );
      })}

      {/* ---- the end gun, off by default. The one arc of water that is honest,
              because the corner of a square field is outside every drop hose. */}
      {endGun && running && (
        <g opacity={0.7}>
          <path d="M498,-62 q46,-26 84,26" fill="none" stroke="#cfe0e6"
            strokeWidth={5} strokeLinecap="round" opacity={0.5} />
          <path d="M498,-62 q40,-16 70,30" fill="none" stroke="#cfe0e6"
            strokeWidth={2.4} strokeLinecap="round" opacity={0.35} />
        </g>
      )}
      {wear > 0.5 && <CalicheDust x={-20} y={-30} w={540} h={34} opacity={wear * 0.5} />}
    </g>
  );
};

// =============================================================================
// CROP ROWS — the ground the pivot stands on, in perspective.
//
// A flat green rectangle is a lawn. Rows converging toward a vanishing point are a
// FIELD, and the row spacing is a real number: cotton on the High Plains goes in
// at 30 or 40 inches, so the rows are close and the bare soil between them shows
// through until the canopy closes. That gap is most of what makes the colour read
// as agriculture rather than as grass.
// =============================================================================
export const CropRows: React.FC<{
  x?: number; y?: number; w?: number; h?: number; frame?: number; seed?: number;
  crop?: 'cotton' | 'sorghum' | 'corn' | 'wheat' | 'fallow';
  /** 0 emergent, 1 mature canopy. Drives how much soil still shows. */
  growth?: number;
  /** the vanishing point, as a fraction across `w`. Off-centre reads as a real
   *  camera; dead centre reads as a diagram. */
  vanish?: number;
}> = ({
  x = 0, y = 0, w = 1080, h = 420, frame = 0, seed = 4,
  crop = 'cotton', growth = 0.7, vanish = 0.42,
}) => {
  const L = useLight();
  const uid = useUid('cr');
  const PALETTE = {
    cotton: {leaf: '#6f8a56', soil: '#a98963', boll: '#efe9dc'},
    sorghum: {leaf: '#7e8f4e', soil: '#a08258', boll: '#9c5f3a'},
    corn: {leaf: '#5f8a4a', soil: '#9d8059', boll: '#d8c473'},
    wheat: {leaf: '#c2b170', soil: '#a58a63', boll: '#d9c98c'},
    fallow: {leaf: '#a4906f', soil: '#a98963', boll: '#a4906f'},
  }[crop];
  const t = tones(PALETTE.leaf, L);
  const vx = x + w * vanish;
  const rows = 46;

  return (
    <g clipPath={`url(#${uid}_box)`}>
      {/* CLIPPED TO ITS OWN BOX. The rows fan out to two and a half times the width
          so the near end reaches past the frame, and the soil is only `w` wide, so
          without this the outer rows hang in the air on both sides with nothing
          under them. It shows on a flat sheet immediately and on a staged plane not
          at all, which is why it needed a sheet to find. */}
      <defs>
        <clipPath id={`${uid}_box`}>
          <rect x={x} y={y} width={w} height={h} />
        </clipPath>
      </defs>
      <rect x={x} y={y} width={w} height={h} fill={PALETTE.soil} />
      {Array.from({length: rows}, (_, i) => {
        const u = i / (rows - 1);
        // The near end fans out well past the frame; the far end converges. That
        // spread is the perspective and it is why the rows are drawn as a fan
        // rather than as a grid squeezed at one end.
        const nearX = x + (u - 0.5) * w * 2.6 + w * 0.5;
        const k = rnd(seed, i);
        const green = growth * (0.72 + k * 0.28);
        return (
          <g key={i}>
            <path d={`M${nearX},${y + h} L${vx},${y}`} stroke={PALETTE.soil}
              strokeWidth={2.4} opacity={0.9} />
            <path d={`M${nearX},${y + h} L${vx},${y}`} stroke={t.base}
              strokeWidth={7 * green} strokeLinecap="round" opacity={0.55 + green * 0.4} />
            {/* the canopy only closes near the camera, which is where a viewer can
                see individual plants at all */}
            {growth > 0.45 && Array.from({length: 5}, (_, j) => {
              const v = 0.62 + (j / 5) * 0.38;
              const px = nearX + (vx - nearX) * v;
              const py = y + h - h * v;
              const puff = Math.sin(frame / 37 + i * 0.4 + j) * 1.4;
              return (
                <ellipse key={j} cx={px + puff} cy={py} rx={5.5 * (1 - v) * 3.2 * green}
                  ry={3.4 * (1 - v) * 3.2 * green}
                  fill={j % 3 === 0 && crop === 'cotton' && growth > 0.8 ? PALETTE.boll : t.key}
                  opacity={0.72} />
              );
            })}
          </g>
        );
      })}
    </g>
  );
};

// =============================================================================
// GRAIN ELEVATOR — the vertical landmark of every town out here, visible twenty
// miles before the town is. Concrete silo bank, headhouse on top, the name of the
// co-op down the side.
// =============================================================================
export const GrainElevator: React.FC<Rig & {silos?: number; label?: string}> = ({
  x = 0, y = 0, scale = 1, seed = 5, wear = 0.45, silos = 6, label,
}) => {
  const L = useLight();
  const uid = useUid('ge');
  const K = fit('grainElevator', 200);        // local frame: 200 units to the headhouse
  const t = tones('#cfc7b8', L);              // weathered concrete
  const sw = 30;
  const w = silos * sw;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <defs><FormGradient id={`${uid}_c`} t={t} softness={0.5} /></defs>
      <ContactShadow cx={w / 2} cy={2} rx={w * 0.62} opacity={0.32} blur={13} />

      {/* the silo bank. Each cylinder is shaded from the same light, and the seam
          between two of them is a dark line rather than a gap, because they are
          poured against one another. */}
      {Array.from({length: silos}, (_, i) => (
        <g key={i}>
          <rect x={i * sw} y={-150} width={sw} height={150} fill={`url(#${uid}_c)`} />
          <rect x={i * sw} y={-150} width={sw * 0.34} height={150} fill={t.shade}
            opacity={0.34} />
          <path d={`M${i * sw},-150 L${i * sw},0`} stroke={INK} strokeWidth={1.6}
            opacity={0.5} />
        </g>
      ))}
      <rect x={0} y={-150} width={w} height={150} fill="none" stroke={INK} strokeWidth={3.4} />
      <ellipse cx={w / 2} cy={-150} rx={w / 2} ry={7} fill={t.key} stroke={INK}
        strokeWidth={3} />

      {/* headhouse: the tall narrow box the leg runs up into, always off-centre */}
      <rect x={w * 0.28} y={-200} width={sw * 1.5} height={52} fill={`url(#${uid}_c)`}
        stroke={INK} strokeWidth={3.4} />
      <rect x={w * 0.28 + 5} y={-192} width={sw * 1.5 - 10} height={12} fill="#4a5560"
        opacity={0.7} />
      <path d={`M${w * 0.28 + sw * 0.6},-148 L${w * 0.28 + sw * 0.6},-6`}
        stroke="#8d8474" strokeWidth={5} />

      {/* the truck bay cut into the base, which is the only part at human scale and
          the thing that gives the whole stack its size */}
      <rect x={w * 0.6} y={-34} width={44} height={34} fill="#3f4741" opacity={0.85} />
      {wear > 0.3 && <RustStreak x={w * 0.28} y={-200} w={sw * 1.5} h={52}
        seed={seed} opacity={wear * 0.55} />}
      {label && (
        <text x={w / 2} y={-74} textAnchor="middle" fontSize={17} fontWeight={700}
          fill="#8b8172" opacity={0.72} fontFamily="Georgia, serif"
          transform={`rotate(-90 ${w / 2} -74)`}>{label}</text>
      )}
    </g>
  );
};

// =============================================================================
// FEEDLOT PEN — the Panhandle's other landscape. Pipe fence, a feed bunk along the
// alley, and cattle standing at it. Drawn as a RECEDING RANK of pens, because one
// pen is a corral and a rank of them is a feedyard.
// =============================================================================
export const FeedlotPen: React.FC<Rig & {pens?: number; head?: number}> = ({
  x = 0, y = 0, scale = 1, frame = 0, seed = 6, wear = 0.5, pens = 4, head = 7,
}) => {
  const L = useLight();
  const K = fit('feedlotPen', 100);           // local frame: 100 units to the top rail
  const rail = tones('#8d9490', L);

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      {Array.from({length: pens}, (_, p) => {
        const d = 1 - (p / pens) * 0.55;
        const py = -(p * 46);
        const pw = 300 * d;
        const px = p * 34;
        return (
          <g key={p} opacity={0.55 + d * 0.45} transform={`translate(${px} ${py})`}>
            {/* the feed bunk: a continuous concrete trough, the thing every animal
                in the pen is pointed at */}
            <rect x={0} y={-16 * d} width={pw} height={13 * d} rx={3 * d}
              fill="#b8b0a3" stroke={INK} strokeWidth={2.4 * d} />
            {/* cattle at the bunk, heads down, at intervals that are not regular */}
            {Array.from({length: head}, (_, i) => {
              const k = rnd(seed, p * 20 + i);
              const cx = 12 * d + (i / head) * (pw - 24 * d) + (k - 0.5) * 14 * d;
              const breathe = Math.sin(frame / 27 + k * 6) * 0.9 * d;
              const coat = ['#4a3a2c', '#6d5540', '#2f2822', '#8a7358'][Math.floor(k * 4)];
              return (
                <g key={i} transform={`translate(${cx} ${-18 * d + breathe})`}>
                  <ellipse cx={0} cy={-13 * d} rx={13 * d} ry={9 * d} fill={coat}
                    stroke={INK} strokeWidth={2 * d} />
                  <path d={`M${-11 * d},${-15 * d} q${-7 * d},${5 * d} ${-4 * d},${11 * d}`}
                    stroke={coat} strokeWidth={6 * d} fill="none" strokeLinecap="round" />
                </g>
              );
            })}
            {/* pipe fence: two rails and posts, and the rails sag between posts */}
            <path d={`M0,${-34 * d} L${pw},${-34 * d} M0,${-18 * d} L${pw},${-18 * d}`}
              stroke={rail.base} strokeWidth={3.2 * d} />
            {Array.from({length: 7}, (_, i) => (
              <path key={i} d={`M${(i / 6) * pw},${-38 * d} L${(i / 6) * pw},0`}
                stroke={rail.core} strokeWidth={3.6 * d} />
            ))}
            {wear > 0.35 && (
              <CalicheDust x={0} y={-10 * d} w={pw} h={16 * d} opacity={wear * 0.6} />
            )}
          </g>
        );
      })}
    </g>
  );
};

// =============================================================================
// SOIL PROBE — the sensor the prescription is built out of. A stake, a small solar
// panel and a stub antenna, standing between two rows.
//
// Small on purpose. This is a thing a viewer should have to notice, and a scene
// that wants it read composes a `mask` or a `readout` around it.
// =============================================================================
export const SoilProbe: React.FC<Rig & {reporting?: boolean}> = ({
  x = 0, y = 0, scale = 1, frame = 0, seed = 7, wear = 0.3, reporting = true,
}) => {
  const L = useLight();
  const K = fit('soilProbe', 100);
  const t = tones('#7d8890', L);
  const blink = reporting && Math.sin(frame / 9) > 0.72;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <ContactShadow cx={0} cy={1} rx={9} opacity={0.24} blur={5} />
      <rect x={-2.4} y={-78} width={4.8} height={78} fill={t.base} stroke={INK}
        strokeWidth={1.8} />
      <g transform="rotate(-14)">
        <rect x={-15} y={-98} width={30} height={17} rx={2} fill="#2f3f52"
          stroke={INK} strokeWidth={2} />
        <path d="M-11,-95 L11,-95 M-11,-90 L11,-90 M-11,-85 L11,-85"
          stroke="#4d6a86" strokeWidth={1.4} />
      </g>
      <path d="M3,-78 L9,-100" stroke={t.core} strokeWidth={1.8} />
      <circle cx={9} cy={-101} r={2.2} fill={blink ? '#c8703a' : '#6b6055'} />
      {/* the buried half, drawn as a dashed continuation. It is the part that does
          the measuring and it is the part nobody can see. */}
      <path d="M0,0 L0,26" stroke={t.shade} strokeWidth={3.4} strokeDasharray="4 4"
        opacity={0.55} />
      {wear > 0.25 && <RustStreak x={-2.4} y={-60} w={5} h={58} seed={seed} opacity={wear} />}
    </g>
  );
};

// =============================================================================
// HERD SENSOR — a cattle ear tag, 75 mm across, at true scale.
//
// The beat is disease predicted from herd behaviour before symptoms show, and this
// is the whole hardware of it. At `scale={1}` beside an animal it is correctly
// almost too small to see, which is the honest picture: the intervention is
// invisible and the model is the part that is doing the work.
// =============================================================================
export const HerdSensor: React.FC<Rig & {tint?: string; alert?: boolean}> = ({
  x = 0, y = 0, scale = 1, frame = 0, tint = '#e0c341', alert = false,
}) => {
  const K = fit('herdSensor', 100);
  const pulse = alert ? 0.55 + Math.abs(Math.sin(frame / 12)) * 0.45 : 0;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <path d="M-42,-46 q42,-16 84,0 l0,64 q-42,18 -84,0 Z" fill={tint}
        stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <circle cx={0} cy={-34} r={9} fill="#3a3529" opacity={0.7} />
      <rect x={-26} y={-8} width={52} height={7} rx={2} fill="#5d5334" opacity={0.75} />
      <rect x={-26} y={7} width={36} height={7} rx={2} fill="#5d5334" opacity={0.75} />
      {alert && (
        <circle cx={0} cy={0} r={62} fill="none" stroke="#c8703a" strokeWidth={5}
          opacity={pulse * 0.6} />
      )}
    </g>
  );
};

// =============================================================================
// GROUND SECTION — a cut through the ground, for the thing under it.
//
// THE OGALLALA IS INVISIBLE AND THE BEAT IS ABOUT IT. A show that can only draw
// what a camera would see cannot draw an aquifer, so it draws a caption about one
// instead, and the audience is asked to take the most important number in West
// Texas agriculture on trust.
//
// So this is a SECTION, and it is drawn as one: a cut face with a hatched edge, a
// horizon between soil and the saturated sand, and a water table line. Being
// visibly a diagram rather than a photograph is the point -- it is honest about
// being a model of the ground rather than a picture of it.
//
// EVERY NUMBER ON IT COMES FROM THE CALLER. This file has no figures in it. The
// repo law is that a published numeral traces to a computation, and a component
// that hardcoded a saturated thickness would be a language model typing a number
// into the most authoritative-looking place on the frame.
// =============================================================================
export const GroundSection: React.FC<{
  x?: number; y?: number; w?: number; h?: number; frame?: number; seed?: number;
  /** 0 at the section top, 1 at the bottom. Where the saturated zone begins. */
  waterTable?: number;
  /** 0 at the water table, 1 at the section bottom. The historic level, drawn as a
   *  ghost line when it is given and simply absent when it is not. */
  historicTable?: number;
  labels?: {top?: string; table?: string; historic?: string; base?: string};
}> = ({
  x = 0, y = 0, w = 620, h = 300, frame = 0, seed = 8,
  waterTable = 0.45, historicTable, labels = {},
}) => {
  const uid = useUid('gs');
  const wt = y + h * Math.max(0.05, Math.min(0.95, waterTable));
  const ht = historicTable === undefined
    ? undefined
    : y + h * Math.max(0.05, Math.min(0.95, historicTable));

  return (
    <g>
      <defs>
        <linearGradient id={`${uid}_sat`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5b7f92" stopOpacity="0.72" />
          <stop offset="100%" stopColor="#3d5b6b" stopOpacity="0.9" />
        </linearGradient>
        <pattern id={`${uid}_hatch`} width={9} height={9} patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)">
          <path d="M0,0 L0,9" stroke={INK} strokeWidth={1.4} opacity={0.35} />
        </pattern>
      </defs>

      {/* unsaturated soil above the table */}
      <rect x={x} y={y} width={w} height={wt - y} fill="#a98963" />
      <rect x={x} y={y} width={w} height={wt - y} fill={`url(#${uid}_hatch)`} opacity={0.5} />
      {/* the saturated sand and gravel below it */}
      <rect x={x} y={wt} width={w} height={y + h - wt} fill={`url(#${uid}_sat)`} />
      {/* grains, so the saturated zone reads as WATER IN SAND and not as a lake */}
      {Array.from({length: 90}, (_, i) => {
        const k = rnd(seed, i);
        const k2 = rnd(seed, 200 + i);
        return <circle key={i} cx={x + k * w} cy={wt + k2 * (y + h - wt)}
          r={1.2 + k * 2.4} fill="#c8ad84" opacity={0.28 + k2 * 0.24} />;
      })}
      {/* bedrock */}
      <rect x={x} y={y + h - 22} width={w} height={22} fill="#5a5148" />

      {/* the table itself, with the faintest movement on it. Still water reads as a
          drawn line; water that breathes reads as water. */}
      <path d={`M${x},${wt} q${w * 0.25},${Math.sin(frame / 41) * 1.6} ${w * 0.5},0
                 t${w * 0.5},0`}
        fill="none" stroke="#cfe6ef" strokeWidth={3.4} opacity={0.9} />
      {ht !== undefined && (
        <g opacity={0.6}>
          <path d={`M${x},${ht} L${x + w},${ht}`} stroke="#e4ded2" strokeWidth={2.2}
            strokeDasharray="9 7" />
        </g>
      )}

      {/* the cut face edge, which is what says SECTION rather than landscape */}
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={INK} strokeWidth={3.4} />

      {labels.top && (
        <text x={x + 14} y={y + 26} fontSize={19} fill="#3b332a" opacity={0.85}
          fontFamily="Georgia, serif">{labels.top}</text>
      )}
      {labels.table && (
        <text x={x + w - 14} y={wt - 12} textAnchor="end" fontSize={19} fill="#eaf3f6"
          fontFamily="Georgia, serif">{labels.table}</text>
      )}
      {labels.historic && ht !== undefined && (
        <text x={x + w - 14} y={ht - 10} textAnchor="end" fontSize={17} fill="#e4ded2"
          opacity={0.8} fontFamily="Georgia, serif">{labels.historic}</text>
      )}
      {labels.base && (
        <text x={x + 14} y={y + h - 30} fontSize={17} fill="#eaf3f6" opacity={0.8}
          fontFamily="Georgia, serif">{labels.base}</text>
      )}
    </g>
  );
};
