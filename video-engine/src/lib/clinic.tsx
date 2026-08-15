import React from 'react';
import {useUid} from './uid';
import {tones, FormGradient, ContactShadow, useLight, INK} from './lighting';
import {M, subber} from './scale';

// =============================================================================
// CLINIC — the largest medical centre in the world is in Houston, and the engine
// could not draw a hospital.
//
// THE ONE RULE THIS FILE IS BUILT AROUND: NO PATIENT IS EVER IDENTIFIABLE, and no
// scan on any screen here is a real anatomy.
//
// That is not squeamishness, it is the only version of this beat that can ship. A
// drawn chest CT with a drawn tumour on it is a picture a viewer will read as a
// finding, and this show does not get to publish a finding. So the imaging on
// these screens is ABSTRACT BY CONSTRUCTION -- a contour over a soft field, a
// slice with no organ in it -- and where a story needs a real image it uses a
// sourced still with its own credit rather than something this file invented.
//
// The second rule follows from the first: THE MACHINE IS THE SUBJECT AND THE
// PERSON IS THE SCALE. A gantry drawn without a person beside it could be any
// size, and the whole point of a linac or a CT is that a human being fits inside
// it. Every component here is at true scale so the Character rig can stand next to
// it and be right.
//
// The AI in this beat is contouring: the model draws the outline a physicist would
// have drawn by hand, in minutes rather than hours. `ContourPlan` is that, and it
// draws the outline over a field with nothing in it, which is honest about being a
// diagram of the workflow rather than a picture of a patient.
// =============================================================================


export const CLINIC_M: Record<string, {h: number; note: string}> = {
  gantry: {h: 2.4, note: 'a linac gantry, floor to the top of the ring'},
  ctGantry: {h: 1.98, note: 'a CT gantry, which is a shorter machine than a linac'},
  couch: {h: 0.75, note: 'the patient couch at its working height'},
  treatmentCouch: {h: 1.2, note: 'a linac couch raised so the target sits at isocentre'},
  towerBlock: {h: 46, note: 'a hospital tower, twelve floors to the parapet'},
  readingStation: {h: 1.3, note: 'the desk and its two displays'},
  infusionPole: {h: 1.9, note: 'an IV pole at working height'},
};

const fit = (k: keyof typeof CLINIC_M, local: number) => (CLINIC_M[k].h * M) / local;

const rnd = (seed: number, ch: number) => {
  const k = ((seed * 2654435761) ^ (ch * 40503)) >>> 0;
  return ((k >>> 8) % 10000) / 10000;
};

interface Rig {
  x?: number; y?: number; scale?: number; frame?: number; facing?: 1 | -1;
  seed?: number; wear?: number;
}

// =============================================================================
// GANTRY — a CT or a linear accelerator, which from the front are the same
// silhouette to everyone who is not a physicist: a torus you go through, on a
// pedestal, with a couch running into it.
//
// The `bore` is the whole drawing. Get its diameter wrong relative to the couch and
// the machine stops reading as something a person goes inside.
//
// WHICH IS EXACTLY WHAT HAPPENED. The first version drew ONE shell, ONE aperture and
// ONE couch height for both machines, and the numbers it picked were a linac's: a
// 1.41 m aperture centred 1.56 m off the floor. A CT bore is 0.70 m and its centre
// is a metre up. A couch at its declared 0.75 m could not have reached that aperture
// at all, so the couch had quietly been raised to 1.06 m to meet it, which put the
// patient table at the chest of the clinician standing beside it.
//
// The lesson is not about CT scanners. A shared component whose two cases have
// genuinely different dimensions will be drawn to ONE of them, and the other case
// then bends whatever is adjacent until the picture closes. It closed here by
// moving a dimension the table had already measured.
// =============================================================================
export const Gantry: React.FC<Rig & {
  kind?: 'ct' | 'linac';
  /** 0 parked, 1 mid-acquisition. Rotates the ring and lights the bore. */
  scanning?: number;
  /** how far the couch has run in, 0 to 1. */
  couch?: number;
}> = ({
  x = 0, y = 0, scale = 1, frame = 0, seed = 1, kind = 'ct', scanning = 0.6, couch = 0.35,
}) => {
  const L = useLight();
  const uid = useUid('gy');
  const K = fit('gantry', 140);               // local frame: 140 units to the linac's ring top
  const sub = subber(CLINIC_M);
  const shell = tones('#e6e3dc', L);
  const ring = scanning > 0.05 ? (frame / 30) * 260 * scanning : rnd(seed, 1) * 360;

  // EVERY HEIGHT HERE IS DERIVED, and the ones that differ between the machines
  // differ because the machines do. The frame is the linac's, so the CT's shell and
  // couch come back through `sub` rather than being typed at a fraction of it.
  const ct = kind !== 'linac';
  const top = ct ? sub('ctGantry', 'gantry', 140) : 140;   // 115.5 or 140: 1.98 m or 2.4 m
  const halfW = ct ? 62 : 84;                              // 2.12 m across, or the linac's 2.88
  const eye = ct ? 58 : 91;                                // aperture centre: 1.0 m isocentre, or the drum
  const rBore = ct ? 20.4 : 41;                            // a 0.70 m bore, or the linac's drum face
  const barY = ct ? 94 : 134;                              // the status strip sits ABOVE the aperture
  const barW = ct ? 78 : 112;
  // The couch. A CT scans at its working height and a linac couch is RAISED so the
  // target sits at isocentre, so this is two dimensions and not one.
  const deck = sub(ct ? 'couch' : 'treatmentCouch', 'gantry', 140);

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <defs>
        <FormGradient id={`${uid}_s`} t={shell} softness={0.5} />
        <radialGradient id={`${uid}_bore`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1a2026" />
          <stop offset="72%" stopColor="#2c343c" />
          <stop offset="100%" stopColor="#4a545e" />
        </radialGradient>
      </defs>
      <ContactShadow cx={0} cy={2} rx={halfW * 1.14} opacity={0.3} blur={11} />

      {/* The ring. A rounded square in front elevation, not a circle: the housing is
          a box and only the bore is round, and that difference is what stops it
          looking like a washing machine.

          A CT MEETS THE FLOOR. It is one monolith, rounded at the top and square at
          the bottom, with a base cover seam near the floor. The pedestal it used to
          stand on was the linac's stand, and a CT standing on a stand reads as an
          appliance somebody wheeled in. A linac keeps the stand, because it has one. */}
      {ct ? (
        <>
          <path d={`M${-halfW},0 L${-halfW},${-top + 22} Q${-halfW},${-top} ${-halfW + 22},${-top} `
            + `L${halfW - 22},${-top} Q${halfW},${-top} ${halfW},${-top + 22} L${halfW},0 Z`}
            fill={`url(#${uid}_s)`} stroke={INK} strokeWidth={4.6} strokeLinejoin="round" />
          <path d={`M${-halfW + 4},-9 L${halfW - 4},-9`} stroke={INK} strokeWidth={2.4}
            opacity={0.42} />
        </>
      ) : (
        <>
          <rect x={-halfW} y={-46} width={halfW * 2} height={46} rx={4} fill={shell.core}
            stroke={INK} strokeWidth={4} />
          <rect x={-halfW} y={-top} width={halfW * 2} height={top - 42} rx={22}
            fill={`url(#${uid}_s)`} stroke={INK} strokeWidth={4.6} />
        </>
      )}
      <circle cx={0} cy={-eye} r={rBore} fill={`url(#${uid}_bore)`} stroke={INK}
        strokeWidth={4} />
      {/* the rotating assembly inside the bore, seen as a faint arc */}
      <g transform={`translate(0 ${-eye}) rotate(${ring})`} opacity={0.5}>
        <path d={`M0,${-rBore * 0.8} a${rBore * 0.8},${rBore * 0.8} 0 0 1 ${rBore * 0.58},${rBore * 0.24}`}
          fill="none" stroke="#8fb6cb" strokeWidth={5} strokeLinecap="round" />
      </g>
      {scanning > 0.05 && (
        <circle cx={0} cy={-eye} r={rBore * 1.075} fill="none" stroke="#8fd4e4" strokeWidth={3}
          opacity={0.28 + Math.abs(Math.sin(frame / 17)) * 0.2 * scanning} />
      )}
      {/* the status bar on the face, and the two indicator lamps every one of these
          has above the bore */}
      <rect x={-barW / 2} y={-barY} width={barW} height={11} rx={3} fill="#20262c" />
      <circle cx={-barW * 0.357} cy={-barY + 5.5} r={3.2}
        fill={scanning > 0.05 ? '#c8543a' : '#3f464c'} />
      <circle cx={-barW * 0.25} cy={-barY + 5.5} r={3.2} fill="#5d9a63" />

      {/* the linac's head and its couch arm, which is what makes the two machines
          different at a glance */}
      {kind === 'linac' && (
        <g>
          <rect x={-30} y={-186} width={60} height={48} rx={6} fill={shell.base}
            stroke={INK} strokeWidth={4} />
          <path d="M-16,-138 L-9,-116 L9,-116 L16,-138 Z" fill="#4c545c" stroke={INK}
            strokeWidth={3.4} />
        </g>
      )}

      {/* the couch. It is the human-sized object in the frame and the reason the
          aperture reads as something a person goes into.

          THE BASE DOES NOT MOVE. On a real machine the cradle slides out of a table
          that stays where it is, so the column is outside the animated group. It
          used to travel with the couch, which meant the whole table walked into the
          gantry. */}
      <rect x={halfW + 8} y={-deck + 5} width={48} height={deck - 5} fill="#9aa0a6"
        stroke={INK} strokeWidth={3} />
      <g transform={`translate(${-couch * 40} 0)`}>
        {/* the cradle is THIN, because the clearance under it is a few centimetres:
            all that separates the tabletop from the bottom of a 0.70 m bore. */}
        <rect x={-16} y={-deck} width={150} height={5} rx={2.5} fill="#c9c4bb"
          stroke={INK} strokeWidth={2.6} />
        <rect x={20} y={-deck + 1.2} width={110} height={2.6} rx={1.3} fill="#7f8f9c"
          opacity={0.7} />
      </g>
    </g>
  );
};

// =============================================================================
// CONTOUR PLAN — the AI in this beat, drawn without a patient in it.
//
// A radiotherapy plan is a set of outlines: the target, and the organs the beam
// must not cook. Drawing those over a soft abstract field says exactly what the
// work is -- a boundary decision, made many times, that used to take a person
// hours -- and says nothing about any person's anatomy, because there is no
// anatomy on the screen.
//
// `auto` draws the model's outline and `manual` the hand one, and where both are
// present the DISAGREEMENT is the interesting part, so it is drawn rather than
// smoothed away. A tool that always agrees with the clinician is a tool nobody
// needed.
// =============================================================================
export const ContourPlan: React.FC<{
  x?: number; y?: number; w?: number; h?: number; frame?: number; seed?: number;
  /** 0 to 1, how much of the model's outline has been laid down. */
  progress?: number;
  /** draw the hand-drawn outline beside it. */
  manual?: boolean;
  label?: string;
}> = ({x = 0, y = 0, w = 420, h = 420, frame = 0, seed = 2, progress = 1,
       manual = true, label}) => {
  const uid = useUid('cp');
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = Math.min(w, h) * 0.26;

  // A closed blob, deterministic from the seed. Deliberately NOT an organ: it is a
  // region on a field, and it is drawn as one.
  const blob = (rad: number, wobble: number, off: number) => {
    const pts = Array.from({length: 22}, (_, i) => {
      const a = (i / 22) * Math.PI * 2;
      const k = rnd(seed, Math.floor(off) + i);
      const rr = rad * (1 + (k - 0.5) * wobble);
      return [cx + Math.cos(a) * rr * 1.14, cy + Math.sin(a) * rr];
    });
    return pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`)
      .join(' ') + ' Z';
  };

  const auto = blob(r, 0.26, 0);
  const hand = blob(r * 1.04, 0.3, 60);
  const dash = Math.PI * 2 * r * 1.3;

  return (
    <g>
      <defs>
        <radialGradient id={`${uid}_field`} cx="50%" cy="50%" r="62%">
          <stop offset="0%" stopColor="#4a5460" />
          <stop offset="100%" stopColor="#1b2027" />
        </radialGradient>
      </defs>
      <rect x={x} y={y} width={w} height={h} fill={`url(#${uid}_field)`} stroke={INK}
        strokeWidth={4} />
      {/* the field texture: a soft grain with no structure in it, so a viewer reads
          "an image" without reading "a body" */}
      {Array.from({length: 130}, (_, i) => {
        const k = rnd(seed, 300 + i);
        const k2 = rnd(seed, 500 + i);
        return <circle key={i} cx={x + k * w} cy={y + k2 * h} r={3 + k * 22}
          fill="#7c8794" opacity={0.035 + k2 * 0.05} />;
      })}
      {/* the crosshair a workstation puts on every slice */}
      <path d={`M${cx},${y + 12} L${cx},${y + h - 12} M${x + 12},${cy} L${x + w - 12},${cy}`}
        stroke="#8fb6cb" strokeWidth={1} opacity={0.28} />

      {manual && (
        <path d={hand} fill="none" stroke="#e4ded2" strokeWidth={3} opacity={0.55}
          strokeDasharray="8 7" />
      )}
      {/* the model's outline, LAID DOWN over time. The drawing of it is the event. */}
      <path d={auto} fill="none" stroke="#6fd8b0" strokeWidth={4}
        strokeDasharray={`${dash * progress} ${dash}`} strokeLinecap="round" />
      <path d={auto} fill="#6fd8b0" opacity={0.09 * progress} />
      {/* the caret that is drawing it */}
      {progress > 0.02 && progress < 0.99 && (
        <circle cx={cx + Math.cos(progress * Math.PI * 2 - Math.PI / 2) * r * 1.14}
          cy={cy + Math.sin(progress * Math.PI * 2 - Math.PI / 2) * r} r={4}
          fill="#dff6ee" opacity={0.6 + Math.abs(Math.sin(frame / 5)) * 0.4} />
      )}
      {label && (
        <text x={x + 16} y={y + h - 18} fontSize={19} fill="#cfd8de" opacity={0.85}
          fontFamily="Georgia, serif">{label}</text>
      )}
    </g>
  );
};

// =============================================================================
// READING STATION — the desk. Two displays, a dictation mic and the chair, which
// is where the decision actually gets made whatever the model produced.
// =============================================================================
export const ReadingStation: React.FC<Rig & {lit?: boolean; alerts?: number}> = ({
  x = 0, y = 0, scale = 1, frame = 0, seed = 3, lit = true, alerts = 0,
}) => {
  const L = useLight();
  const uid = useUid('rs');
  const K = fit('readingStation', 100);
  const desk = tones('#8a7d6c', L);

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <defs><FormGradient id={`${uid}_d`} t={desk} softness={0.4} /></defs>
      <ContactShadow cx={0} cy={1} rx={104} opacity={0.26} blur={8} />
      {/* the desk */}
      <rect x={-104} y={-56} width={208} height={11} rx={3} fill={`url(#${uid}_d)`}
        stroke={INK} strokeWidth={3.4} />
      <rect x={-92} y={-45} width={9} height={45} fill={desk.shade} />
      <rect x={83} y={-45} width={9} height={45} fill={desk.shade} />

      {/* two displays, angled toward the seat, because a reading room is set up for
          one person and it shows */}
      {[[-52, -8], [52, 8]].map(([dx, skew], i) => (
        <g key={i} transform={`translate(${dx} -56) skewX(${skew})`}>
          <rect x={-46} y={-62} width={92} height={58} rx={2} fill="#171d23"
            stroke={INK} strokeWidth={3} />
          <rect x={-42} y={-58} width={84} height={50} fill={lit ? '#28323c' : '#1b2127'} />
          {lit && Array.from({length: 7}, (_, j) => (
            <rect key={j} x={-38} y={-53 + j * 6.6} width={30 + rnd(seed, i * 10 + j) * 44}
              height={3} rx={1.5} fill="#6f93aa" opacity={0.5} />
          ))}
          <rect x={-5} y={-4} width={10} height={9} fill="#2a3138" />
          <rect x={-17} y={5} width={34} height={4} rx={2} fill="#2a3138" />
        </g>
      ))}

      {/* the dictation mic, which is the actual interface most of the time */}
      <rect x={-8} y={-64} width={16} height={9} rx={4} fill="#3a424a" stroke={INK}
        strokeWidth={2.2} />
      {/* the queue badge. A number the CALLER supplies, never one invented here. */}
      {alerts > 0 && (
        <g transform="translate(84 -122)">
          <circle cx={0} cy={0} r={13} fill="#c8703a" stroke={INK} strokeWidth={2.6} />
          <text x={0} y={5} textAnchor="middle" fontSize={15} fontWeight={700}
            fill="#1b1512" fontFamily="Georgia, serif">{alerts}</text>
        </g>
      )}
      {/* the chair, empty or not is the caller's business; drawn as a back and a
          post so it never becomes a person */}
      <g transform="translate(0 0)" opacity={0.9}>
        <rect x={-26} y={-40} width={52} height={9} rx={4} fill="#3c434a" />
        <rect x={-4} y={-31} width={8} height={26} fill="#4a525a" />
        <path d="M-24,-5 L24,-5" stroke="#3c434a" strokeWidth={5} strokeLinecap="round" />
      </g>
    </g>
  );
};

// =============================================================================
// TOWER BLOCK — a hospital from outside, and the Texas Medical Center is a skyline
// rather than a building.
//
// Drawn as a rank of slabs at different depths with a helipad on one, because that
// is the silhouette. The floor bands are the thing that says HOSPITAL rather than
// OFFICE: deep floor plates, small windows, and the mechanical floor a third of the
// way up that no office tower has.
// =============================================================================
export const TowerBlock: React.FC<Rig & {
  towers?: number; night?: boolean; helipad?: boolean;
}> = ({x = 0, y = 0, scale = 1, frame = 0, seed = 4, towers = 3, night = false,
       helipad = true}) => {
  const L = useLight();
  const uid = useUid('tb');
  const K = fit('towerBlock', 300);           // local frame: 300 units to the parapet
  const t = tones(night ? '#3c4550' : '#c2bdb3', L);

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <defs><FormGradient id={`${uid}_f`} t={t} softness={0.35} /></defs>
      {Array.from({length: towers}, (_, i) => {
        const k = rnd(seed, i);
        const d = 1 - (i / towers) * 0.4;
        const w = 110 + k * 70;
        const h = (170 + k * 130) * d;
        const bx = i * 128 - (k - 0.5) * 26;
        const floors = Math.floor(h / 17);
        return (
          <g key={i} opacity={0.6 + d * 0.4}>
            <rect x={bx} y={-h} width={w} height={h} fill={`url(#${uid}_f)`}
              stroke={INK} strokeWidth={3.4} />
            {/* floor bands and the window slots in them */}
            {Array.from({length: floors}, (_, f) => (
              <g key={f}>
                <path d={`M${bx},${-h + f * 17 + 13} L${bx + w},${-h + f * 17 + 13}`}
                  stroke={t.shade} strokeWidth={2} opacity={0.55} />
                {Array.from({length: Math.floor(w / 15)}, (_, c) => {
                  const on = night && rnd(seed, i * 400 + f * 20 + c) < 0.42;
                  return <rect key={c} x={bx + 5 + c * 15} y={-h + f * 17 + 4}
                    width={9} height={8}
                    fill={on ? '#e8d9a8' : night ? '#242b33' : '#8b96a1'}
                    opacity={on ? 0.85 : 0.6} />;
                })}
              </g>
            ))}
            {/* the mechanical floor: a solid louvred band, and no office tower has
                one this low */}
            <rect x={bx} y={-h * 0.66} width={w} height={15} fill={t.core}
              stroke={INK} strokeWidth={2.4} />
            {Array.from({length: Math.floor(w / 9)}, (_, c) => (
              <path key={c} d={`M${bx + 4 + c * 9},${-h * 0.66 + 3}
                                L${bx + 4 + c * 9},${-h * 0.66 + 12}`}
                stroke={t.shade} strokeWidth={2} opacity={0.7} />
            ))}
            {helipad && i === 0 && (
              <g transform={`translate(${bx + w / 2} ${-h - 5})`}>
                <ellipse cx={0} cy={0} rx={w * 0.3} ry={7} fill="#6f757c"
                  stroke={INK} strokeWidth={2.6} />
                <circle cx={0} cy={0} r={w * 0.15} fill="none" stroke="#e4ded2"
                  strokeWidth={2.4} opacity={0.8} />
                <circle cx={0} cy={-11} r={2}
                  fill={Math.sin(frame / 8) > 0 ? '#c8543a' : '#5a3028'} />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};
