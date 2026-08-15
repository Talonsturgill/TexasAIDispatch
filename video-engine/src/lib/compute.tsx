import React from 'react';
import {useUid} from './uid';
import {M} from './scale';
import {tones, FormGradient, ContactShadow, useLight, Galvanized, RustStreak,
        BrushedMetal, INK} from './lighting';

// =============================================================================
// COMPUTE — the inside of the building the whole docket is about.
//
// The engine could draw a data centre from the outside, and getting that right was
// worth doing: a LOW WINDOWLESS SLAB ON CALICHE rather than a glass tech campus is
// most of what makes the beat look honest. But the outside is a shed. Every story
// on this beat -- the load, the water, the chips, the machine that Texas academic
// research runs on -- happens inside it, and inside it did not exist.
//
// WHAT MAKES A MACHINE ROOM READ, and it is not the blinking lights:
//
// THE AISLE. Racks are drawn in a receding row with a floor between them, because
// the space is a corridor and the corridor is the image. A flat wall of cabinets is
// a server rack in a cupboard.
//
// THE CONTAINMENT. Modern rooms have the cold aisle roofed and doored so the cold
// air cannot escape over the top. That roof is the single detail that separates a
// 2015 render from a room built this year, and it is the reason the aisle glows.
//
// THE CABLE. Overhead trays and the bundles dropping into each cabinet. A room
// without cable is a diagram of a room.
//
// AND THE THING WITH NO PICTURE OF IT. Per-site large-load metering is
// confidential in ERCOT, so nobody outside a company knows what any one of these
// buildings draws. The honest visual for that is a rack in the row rendered as an
// OUTLINE with nothing inside it -- `unknown` on `RackRow` -- and it says the size
// of the gap without asserting a number, which is what this project publishes
// instead of an estimate dressed as a measurement.
// =============================================================================


export const COMPUTE_M: Record<string, {h: number; note: string}> = {
  cabinet: {h: 2.0, note: 'a 42U rack, floor to the top of the frame'},
  rackRow: {h: 2.6, note: 'to the top of the containment roof over the aisle'},
  coolingTower: {h: 9.0, note: 'one cell, ground to the top of the fan stack'},
  generatorSet: {h: 3.2, note: 'a containerised genset, to the top of the enclosure'},
  switchgear: {h: 2.3, note: 'a medium-voltage line-up'},
  coolingDistributionUnit: {h: 1.9, note: 'a CDU cabinet on the room floor'},
};

const fit = (k: keyof typeof COMPUTE_M, local: number) => (COMPUTE_M[k].h * M) / local;

const rnd = (seed: number, ch: number) => {
  const k = ((seed * 2654435761) ^ (ch * 40503)) >>> 0;
  return ((k >>> 8) % 10000) / 10000;
};

interface Rig {
  x?: number; y?: number; scale?: number; frame?: number; facing?: 1 | -1;
  seed?: number; wear?: number;
}

// =============================================================================
// CABINET — one rack, close enough to see what is in it.
//
// The LEDs are the trap. A wall of randomly blinking lights is a 1960s computer,
// and a modern accelerator rack at load is mostly STEADY: link lights on, activity
// lights flickering in a narrow band, one amber somewhere because there is always
// one amber somewhere. So `load` drives how much of the panel is lit and how much
// it moves, and `fault` puts the amber where a caller asks for it rather than at
// random.
// =============================================================================
export const Cabinet: React.FC<Rig & {
  /** 0 idle, 1 flat out. Drives the lit fraction and the activity flicker. */
  load?: number;
  /** the door. Open shows the blades, which is the shot for a chip story. */
  open?: boolean;
  /** an amber somewhere. -1 for none. */
  fault?: number;
  /** draw it as an empty outline: the honest picture of a machine nobody outside
   *  the company has a number for. */
  unknown?: boolean;
}> = ({
  x = 0, y = 0, scale = 1, frame = 0, seed = 1, wear = 0.12,
  load = 0.7, open = false, fault = -1, unknown = false,
}) => {
  const L = useLight();
  const uid = useUid('cb');
  const K = fit('cabinet', 100);              // local frame: 100 units to the frame top
  const t = tones('#2b3138', L);
  const slots = 21;

  if (unknown) {
    return (
      <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
        <rect x={-19} y={-100} width={38} height={100} fill="none" stroke="#8d97a1"
          strokeWidth={3} strokeDasharray="7 6" opacity={0.8} />
        <path d="M-19,-100 L19,0 M19,-100 L-19,0" stroke="#8d97a1" strokeWidth={1.6}
          opacity={0.28} />
      </g>
    );
  }

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <defs><FormGradient id={`${uid}_f`} t={t} softness={0.42} /></defs>
      <ContactShadow cx={0} cy={1} rx={22} opacity={0.3} blur={6} />
      <rect x={-19} y={-100} width={38} height={100} fill={`url(#${uid}_f)`}
        stroke={INK} strokeWidth={3.4} />

      {open ? (
        // the blades, pulled forward a little so the row reads as depth
        Array.from({length: slots}, (_, i) => {
          const k = rnd(seed, i);
          const lit = k < load;
          return (
            <g key={i}>
              <rect x={-15} y={-96 + i * 4.4} width={30} height={3.6} fill="#39424c"
                stroke="#151a1f" strokeWidth={0.8} />
              {Array.from({length: 7}, (_, j) => (
                <rect key={j} x={-13 + j * 3.8} y={-95.4 + i * 4.4} width={2.4} height={2.4}
                  fill="#1d242b" opacity={0.85} />
              ))}
              {lit && (
                <circle cx={12} cy={-94.2 + i * 4.4} r={1} fill="#6fd8b0"
                  opacity={0.55 + Math.abs(Math.sin(frame / 6 + i * 1.3)) * 0.45 * load} />
              )}
              {i === fault && <circle cx={12} cy={-94.2 + i * 4.4} r={1.2} fill="#e0a13c" />}
            </g>
          );
        })
      ) : (
        // the perforated front door, and the LEDs read THROUGH it, dimmer
        <g>
          <rect x={-16} y={-96} width={32} height={92} fill="#1f252b" opacity={0.9} />
          {Array.from({length: 24}, (_, r) =>
            Array.from({length: 9}, (_, c) => (
              <circle key={`${r}-${c}`} cx={-14 + c * 3.5} cy={-93 + r * 3.8} r={1.1}
                fill="#12171c" opacity={0.75} />
            )))}
          {Array.from({length: slots}, (_, i) => {
            const k = rnd(seed, i);
            if (k >= load) return null;
            return (
              <circle key={i} cx={11} cy={-92 + i * 4.3} r={1.1} fill="#6fd8b0"
                opacity={(0.2 + Math.abs(Math.sin(frame / 7 + i * 1.7)) * 0.35) * (0.4 + load)} />
            );
          })}
          {fault >= 0 && (
            <circle cx={11} cy={-92 + fault * 4.3} r={1.3} fill="#e0a13c" opacity={0.75} />
          )}
        </g>
      )}

      {/* the frame rails and the top cable entry, which is where the bundles land */}
      <rect x={-19} y={-104} width={38} height={5} fill={t.key} stroke={INK} strokeWidth={2.6} />
      <rect x={-9} y={-108} width={18} height={5} rx={2} fill="#3c454f" />
      {wear > 0.1 && <BrushedMetal x={-19} y={-104} w={38} h={6} opacity={wear * 2} />}
    </g>
  );
};

// =============================================================================
// RACK ROW — the aisle. This is the picture of the beat.
//
// Two ranks of cabinets facing each other down a receding corridor, the containment
// roof over the top, and the cable tray above that. The floor between them is what
// makes it a room a person could walk into, so it is drawn with its own perspective
// and its own tile grid rather than left as background.
// =============================================================================
export const RackRow: React.FC<Rig & {
  /** cabinets per rank. */
  depth?: number;
  load?: number;
  /** which cabinets are drawn as unmetered outlines. Indices into the near rank. */
  unknown?: number[];
  /** the cold-aisle containment roof and its glow. */
  contained?: boolean;
  /** open one door in the near rank, for a shot about what is inside. */
  openDoor?: number;
}> = ({
  x = 0, y = 0, scale = 1, frame = 0, seed = 2,
  depth = 7, load = 0.72, unknown = [], contained = true, openDoor = -1,
}) => {
  const uid = useUid('rr');
  const K = fit('rackRow', 130);

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <defs>
        <linearGradient id={`${uid}_aisle`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7fd8f0" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#7fd8f0" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id={`${uid}_floor`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4c545c" />
          <stop offset="100%" stopColor="#767f87" />
        </linearGradient>
      </defs>

      {/* the floor, converging. Raised-floor tiles are 600 mm and the grid of them
          is the cheapest honest depth cue in the room. */}
      <path d="M-250,0 L250,0 L96,-96 L-96,-96 Z" fill={`url(#${uid}_floor)`} />
      {Array.from({length: 8}, (_, i) => {
        const u = i / 7;
        const yy = -u * 96;
        const hw = 250 - u * 154;
        return <path key={i} d={`M${-hw},${yy} L${hw},${yy}`} stroke="#5c646c"
          strokeWidth={1.4} opacity={0.6} />;
      })}
      {[-1, 1].map((s) => (
        <path key={s} d={`M${s * 250},0 L${s * 96},-96`} stroke="#5c646c"
          strokeWidth={1.4} opacity={0.6} />
      ))}

      {/* the containment glow rising out of the aisle */}
      {contained && <path d="M-250,0 L250,0 L96,-96 L-96,-96 Z"
        fill={`url(#${uid}_aisle)`} opacity={0.75} />}

      {/* the two ranks, far to near so the near ones overlap correctly */}
      {Array.from({length: depth}, (_, i) => {
        const j = depth - 1 - i;                 // draw far first
        const u = j / Math.max(1, depth - 1);
        const d = 0.44 + (1 - u) * 0.56;
        const cx = 96 + (250 - 96) * (1 - u);
        const yy = -96 * u;
        return (
          <g key={j}>
            {[-1, 1].map((s) => (
              <g key={s} transform={`translate(${s * cx} ${yy})`} opacity={0.55 + d * 0.45}>
                {/* `/ K` and NOT `/ (K * scale)`. Dividing by the staging scale too
                    cancelled it, so the cabinets held a fixed size on the page while
                    the room around them shrank: at the review sheet's 0.17 the row
                    rendered 8.51 m against a declared 2.6 m, nearly four times a rack.
                    Cancel the parent's fit and nothing else, and the cabinets ride the
                    room. Same defect as the truck's roof pod, same cure.

                    `d` alone, with no 0.62 on top, because `d` IS the perspective
                    depth and the near rank at d = 1 is a full size cabinet standing
                    under the containment roof, which is where a rack actually is. */}
                <Cabinet frame={frame} scale={d / K}
                  seed={seed * 7 + j * 13 + (s > 0 ? 101 : 0)} load={load}
                  open={s < 0 && j === openDoor}
                  unknown={s < 0 && unknown.includes(j)}
                  fault={j === Math.floor(depth * 0.4) && s > 0 ? 9 : -1} />
              </g>
            ))}
          </g>
        );
      })}

      {/* the containment roof, and the doors at the near end of the aisle */}
      {contained && (
        <g>
          <path d="M-96,-96 L96,-96 L88,-104 L-88,-104 Z" fill="#39424c"
            stroke={INK} strokeWidth={2.6} />
          <path d="M-250,-118 L250,-118" stroke="#39424c" strokeWidth={5} opacity={0.55} />
        </g>
      )}

      {/* the cable tray overhead, with bundles dropping into the ranks. A room
          without cable is a diagram of a room. */}
      <g opacity={0.9}>
        <path d="M-250,-134 L250,-134 M-250,-126 L250,-126" stroke="#6a737c"
          strokeWidth={3.4} />
        {Array.from({length: 12}, (_, i) => (
          <path key={i} d={`M${-236 + i * 42},-134 L${-236 + i * 42},-126`}
            stroke="#6a737c" strokeWidth={2} />
        ))}
        {Array.from({length: depth}, (_, j) => {
          const u = j / Math.max(1, depth - 1);
          const d = 0.44 + (1 - u) * 0.56;
          const cx = 96 + (250 - 96) * (1 - u);
          const yy = -96 * u;
          // The bundle leaves the tray, bellies out, and lands on the top of the
          // cabinet. The landing point is the rank's own depth ramp rather than a
          // number reverse-engineered from the nested transform, because a drop that
          // is two units off reads as a cable and a formula nobody can follow reads
          // as a bug waiting to be edited.
          const top = yy - 128 * d * 0.62;
          return [-1, 1].map((s) => (
            <path key={`${j}-${s}`}
              d={`M${s * cx},-126 q${s * 9 * d},${(top + 126) * 0.55} ${s * 3 * d},${top + 126}`}
              stroke="#4a525a" strokeWidth={2.6 * d} fill="none" opacity={0.7} />
          ));
        })}
      </g>
    </g>
  );
};

// =============================================================================
// COOLING TOWER — the water half of the beat, standing outdoors where a viewer can
// see it. Evaporative cells with their fan stacks, the drift, and the basin.
//
// The plume is the honest part and it needs care: what leaves a cooling tower is
// water vapour, it is visible mostly in cool air, and drawing a black smokestack
// plume over one would be a straightforward lie about what the building emits. So
// the drift here is WHITE, THIN AND SHORT, and `humidity` is what makes it visible
// at all.
// =============================================================================
export const CoolingTower: React.FC<Rig & {cells?: number; running?: boolean;
  /** 0 dry desert air, 1 Gulf Coast. How much of the drift is visible. */
  humidity?: number;
}> = ({
  x = 0, y = 0, scale = 1, frame = 0, seed = 3, wear = 0.4,
  cells = 3, running = true, humidity = 0.35,
}) => {
  const L = useLight();
  const uid = useUid('ct');
  const K = fit('coolingTower', 130);
  const t = tones('#b0b6ba', L);
  const cw = 86;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <defs>
        <FormGradient id={`${uid}_s`} t={t} softness={0.4} />
        <linearGradient id={`${uid}_drift`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#eef4f6" stopOpacity={0.55 * humidity} />
          <stop offset="100%" stopColor="#eef4f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ContactShadow cx={(cells * cw) / 2} cy={2} rx={cells * cw * 0.6} opacity={0.3}
        blur={11} />

      {/* the concrete basin the whole thing sits in */}
      <rect x={-10} y={-22} width={cells * cw + 20} height={22} fill="#a9a49a"
        stroke={INK} strokeWidth={3.4} />

      {Array.from({length: cells}, (_, i) => {
        const k = rnd(seed, i);
        const spin = running ? (frame / 30) * (110 + k * 30) : 0;
        return (
          <g key={i} transform={`translate(${i * cw} 0)`}>
            {/* the cell: louvred sides, because that is where the air goes in */}
            <rect x={0} y={-112} width={cw - 8} height={90} fill={`url(#${uid}_s)`}
              stroke={INK} strokeWidth={3.4} />
            {Array.from({length: 7}, (_, j) => (
              <path key={j} d={`M2,${-108 + j * 12} L${cw - 10},${-104 + j * 12}`}
                stroke={t.shade} strokeWidth={3} opacity={0.6} />
            ))}
            {/* the fan stack and the fan in it */}
            <path d={`M4,-112 L${cw - 12},-112 L${cw - 20},-130 L12,-130 Z`}
              fill={t.core} stroke={INK} strokeWidth={3.4} strokeLinejoin="round" />
            <ellipse cx={(cw - 8) / 2} cy={-130} rx={(cw - 32) / 2} ry={7}
              fill="#3f464c" stroke={INK} strokeWidth={2.6} />
            <g transform={`translate(${(cw - 8) / 2} -130) rotate(${spin})`}>
              {[0, 90, 180, 270].map((a) => (
                <ellipse key={a} cx={Math.cos((a * Math.PI) / 180) * 12}
                  cy={Math.sin((a * Math.PI) / 180) * 4} rx={11} ry={3} fill="#6d757c"
                  opacity={running ? 0.5 : 0.85} />
              ))}
            </g>
            {/* the drift. White, thin, short. */}
            {running && humidity > 0.08 && (
              <ellipse cx={(cw - 8) / 2 + Math.sin(frame / 43 + i) * 7}
                cy={-158 - humidity * 26} rx={26 + humidity * 14}
                ry={30 + humidity * 34} fill={`url(#${uid}_drift)`} />
            )}
            {wear > 0.3 && <RustStreak x={0} y={-112} w={cw - 8} h={90} seed={seed + i}
              opacity={wear * 0.5} />}
          </g>
        );
      })}
      {/* the header pipe running along the front, which is the thing that says
          this is plumbing and not a building */}
      <rect x={-6} y={-34} width={cells * cw + 12} height={11} rx={5} fill="#7d858c"
        stroke={INK} strokeWidth={2.6} />
      <Galvanized x={-6} y={-34} w={cells * cw + 12} h={11} opacity={0.4} />
    </g>
  );
};

// =============================================================================
// GENERATOR BANK — the row of containerised diesels outside every one of these
// buildings, and the reason air permits are part of this beat.
//
// They are almost always OFF, which is the honest default. A running bank is a
// specific and newsworthy event, so `running` has to be asked for and the exhaust
// haze only appears when it is.
// =============================================================================
export const GeneratorBank: React.FC<Rig & {units?: number; running?: boolean}> = ({
  x = 0, y = 0, scale = 1, frame = 0, seed = 4, wear = 0.3, units = 5, running = false,
}) => {
  const L = useLight();
  const uid = useUid('gb');
  const K = fit('generatorSet', 100);
  const t = tones('#8a9086', L);
  const uw = 168;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <defs><FormGradient id={`${uid}_e`} t={t} softness={0.42} /></defs>
      <ContactShadow cx={(units * uw) / 2} cy={2} rx={units * uw * 0.55} opacity={0.28}
        blur={10} />
      {Array.from({length: units}, (_, i) => {
        const k = rnd(seed, i);
        return (
          <g key={i} transform={`translate(${i * uw} 0)`}>
            {/* the enclosure */}
            <rect x={0} y={-72} width={uw - 14} height={72} rx={3} fill={`url(#${uid}_e)`}
              stroke={INK} strokeWidth={3.6} />
            {/* the intake louvres at one end and the radiator grille at the other */}
            {Array.from({length: 8}, (_, j) => (
              <path key={j} d={`M8,${-66 + j * 8} L46,${-66 + j * 8}`} stroke={t.shade}
                strokeWidth={3} opacity={0.65} />
            ))}
            <rect x={uw - 62} y={-64} width={40} height={56} fill="#4c534d"
              stroke={INK} strokeWidth={2.6} />
            {Array.from({length: 6}, (_, j) => (
              <path key={j} d={`M${uw - 58},${-60 + j * 9} L${uw - 26},${-60 + j * 9}`}
                stroke="#707a73" strokeWidth={2.4} />
            ))}
            {/* the exhaust stack */}
            <rect x={uw * 0.45} y={-104} width={13} height={34} fill="#5d635e"
              stroke={INK} strokeWidth={2.6} />
            <ellipse cx={uw * 0.45 + 6.5} cy={-104} rx={7} ry={3} fill="#3a3f3b" />
            {running && (
              <ellipse cx={uw * 0.45 + 6.5 + Math.sin(frame / 21 + i) * 5}
                cy={-124 - (k * 8)} rx={13} ry={19} fill="#9aa0a4" opacity={0.22} />
            )}
            {/* the fuel fill and the small control door, which is where a person
                actually interacts with this thing */}
            <rect x={uw * 0.68} y={-52} width={26} height={38} fill={t.core}
              stroke={INK} strokeWidth={2.4} />
            <circle cx={uw * 0.68 + 20} cy={-33} r={1.8} fill="#3a3f3b" />
            <rect x={12} y={-8} width={uw - 38} height={8} fill="#9a938a" />
            {wear > 0.25 && <RustStreak x={0} y={-72} w={uw - 14} h={72} seed={seed + i}
              opacity={wear * 0.5} />}
          </g>
        );
      })}
    </g>
  );
};

// =============================================================================
// SWITCHGEAR — the line-up in the electrical room, where the campus meets its own
// distribution. Cubicle after cubicle of the same door, which is exactly what it
// looks like and exactly why it reads as infrastructure.
// =============================================================================
export const Switchgear: React.FC<Rig & {bays?: number; energised?: boolean}> = ({
  x = 0, y = 0, scale = 1, frame = 0, seed = 5, wear = 0.1, bays = 6, energised = true,
}) => {
  const L = useLight();
  const uid = useUid('sg');
  const K = fit('switchgear', 100);
  const t = tones('#9fa5a9', L);
  const bw = 52;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <defs><FormGradient id={`${uid}_p`} t={t} softness={0.35} /></defs>
      <ContactShadow cx={(bays * bw) / 2} cy={1} rx={bays * bw * 0.55} opacity={0.26}
        blur={7} />
      {Array.from({length: bays}, (_, i) => {
        const k = rnd(seed, i);
        return (
          <g key={i} transform={`translate(${i * bw} 0)`}>
            <rect x={0} y={-100} width={bw - 3} height={100} fill={`url(#${uid}_p)`}
              stroke={INK} strokeWidth={3} />
            {/* the instrument panel at eye height, the handle below it, and the
                cubicle number plate. Three details, and they are the three a person
                who has stood in front of one of these would look for. */}
            <rect x={7} y={-88} width={bw - 17} height={22} rx={2} fill="#20262b"
              stroke={INK} strokeWidth={2.2} />
            <circle cx={16} cy={-77} r={4} fill={energised ? '#c8543a' : '#3c4145'}
              opacity={energised ? 0.6 + Math.abs(Math.sin(frame / 31 + k * 6)) * 0.4 : 1} />
            <circle cx={30} cy={-77} r={4} fill={energised ? '#3c4145' : '#5d9a63'} />
            <rect x={12} y={-56} width={bw - 26} height={7} rx={3} fill="#5a6167" />
            <path d={`M${bw / 2 - 8},-40 L${bw / 2 + 8},-40`} stroke="#5a6167"
              strokeWidth={5} strokeLinecap="round" />
            <rect x={bw / 2 - 11} y={-26} width={22} height={9} rx={1} fill="#e4ded2"
              opacity={0.7} />
          </g>
        );
      })}
      {/* the overhead bus duct feeding the line-up */}
      <rect x={-8} y={-116} width={bays * bw + 16} height={15} fill="#767d83"
        stroke={INK} strokeWidth={2.6} />
      <BrushedMetal x={-8} y={-116} w={bays * bw + 16} h={15} opacity={0.5} />
      {wear > 0.15 && <RustStreak x={0} y={-100} w={bays * bw} h={100} seed={seed}
        opacity={wear * 0.4} />}
    </g>
  );
};

// =============================================================================
// COOLING DISTRIBUTION UNIT — direct-to-chip liquid, which is the current story
// and the reason these rooms changed shape. A cabinet with a pump skid in it and
// two fat hoses going out to the row.
// =============================================================================
export const CoolingDistributionUnit: React.FC<Rig & {flowing?: boolean}> = ({
  x = 0, y = 0, scale = 1, frame = 0, seed = 6, wear = 0.1, flowing = true,
}) => {
  const L = useLight();
  const uid = useUid('cdu');
  const K = fit('coolingDistributionUnit', 100);
  const t = tones('#454d55', L);
  // The flow is drawn as a slow march along the hose rather than as an arrow,
  // because an arrow is a diagram and a moving highlight is plumbing.
  const march = flowing ? (frame * 1.6) % 26 : 0;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <defs><FormGradient id={`${uid}_b`} t={t} softness={0.45} /></defs>
      <ContactShadow cx={0} cy={1} rx={30} opacity={0.28} blur={6} />
      <rect x={-26} y={-100} width={52} height={100} rx={2} fill={`url(#${uid}_b)`}
        stroke={INK} strokeWidth={3.4} />
      {/* the sight glass, which is the one place the liquid is actually visible */}
      <rect x={-16} y={-88} width={32} height={26} rx={2} fill="#1b2126" stroke={INK}
        strokeWidth={2.4} />
      <rect x={-13} y={-74} width={26} height={9} fill="#4d93a8" opacity={0.75} />
      <path d={`M-13,${-74 + Math.sin(frame / 29) * 0.8} q6,-1.4 13,0 t13,0`}
        stroke="#8fd4e4" strokeWidth={1.8} fill="none" opacity={0.9} />
      {/* pump skid behind a grille */}
      {Array.from({length: 9}, (_, i) => (
        <path key={i} d={`M-20,${-52 + i * 5} L20,${-52 + i * 5}`} stroke={t.shade}
          strokeWidth={2.4} opacity={0.7} />
      ))}
      {/* the two hoses out to the row, supply and return, one warmer than the other */}
      {[['#5f8fa6', -6], ['#a3705f', 6]].map(([col, dy], i) => (
        <g key={i}>
          <path d={`M26,${-70 + (dy as number)} q30,0 44,${18 + (dy as number)}`}
            fill="none" stroke={col as string} strokeWidth={9} strokeLinecap="round" />
          <path d={`M26,${-70 + (dy as number)} q30,0 44,${18 + (dy as number)}`}
            fill="none" stroke={INK} strokeWidth={10.6} opacity={0.22} />
          {flowing && (
            <circle cx={26 + march * 1.7} cy={-70 + (dy as number) + march * 0.5} r={2.2}
              fill="#dff1f6" opacity={0.6} />
          )}
        </g>
      ))}
      {wear > 0.12 && <BrushedMetal x={-26} y={-100} w={52} h={100} opacity={wear * 2} />}
    </g>
  );
};
