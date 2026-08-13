import React from 'react';
import {useUid} from './uid';
import {tones, FormGradient, RimLight, ContactShadow, useLight, RustStreak, INK} from './lighting';

// =============================================================================
// FREIGHT — the third beat, and the one where Texas is genuinely first.
//
// Aurora ran the first commercial driverless Class 8 deliveries between Dallas and
// Houston in May 2025, opened Fort Worth to El Paso six months later, and passed a
// hundred thousand driverless miles. `knowledge/texas/APPLICATIONS.md` carries the
// sourcing. The engine could draw a pickup, a stock trailer and a slab, and could
// not draw the truck the story is about.
//
// THE HARD PART IS THE EMPTY SEAT, and it is a composition problem rather than a
// drawing one. A tractor-trailer drawn from the side has a cab window the size of
// a postage stamp, so the one detail that matters -- nobody in it -- is invisible
// at the size the vehicle wants to be drawn at. Three answers, and this file
// offers all three rather than picking one:
//
//   `sensorMast`, because the roof rack is what a viewer actually reads as "this
//   one is different" at highway distance. It is the silhouette change.
//
//   `cabView`, a separate near component that shows the seat at a size where empty
//   is legible. A scene cuts to it.
//
//   `AutonomyBadge`, the small marker these trucks carry by regulation and
//   convention. Available and OFF by default, because a scene that needs a label
//   to tell the story has not told the story.
//
// SPEED IS DRAWN IN THE GROUND, NOT THE TRUCK. A vehicle translating across the
// frame at highway speed leaves the frame in half a second. Everything here moves
// the ROAD instead and holds the truck still, which is how the shot is actually
// made and also the only way a sixty-second film can spend four seconds on it.
// =============================================================================

/** Draw units per metre, from the Character rig: 610 units sole to crown at 1.70 m. */
const M = 610 / 1.7;

export const FREIGHT_M: Record<string, {h: number; note: string}> = {
  tractor: {h: 4.0, note: 'day cab, ground to the top of the roof fairing'},
  autonomousRig: {h: 4.15, note: 'tractor and van trailer, to the top of the sensor mast'},
  sensorMast: {h: 0.42, note: 'the roof pod itself, across its housing'},
  weighStation: {h: 5.6, note: 'to the top of the gantry sign'},
  dockDoor: {h: 4.3, note: 'a terminal dock door with its leveller'},
};

const fit = (k: keyof typeof FREIGHT_M, local: number) => (FREIGHT_M[k].h * M) / local;

const rnd = (seed: number, ch: number) => {
  const k = ((seed * 2654435761) ^ (ch * 40503)) >>> 0;
  return ((k >>> 8) % 10000) / 10000;
};

interface Rig {
  x?: number; y?: number; scale?: number; frame?: number; facing?: 1 | -1;
  seed?: number; wear?: number;
}

// =============================================================================
// SENSOR MAST — the roof pod. Lidar drum, a camera bar and the radar stub.
//
// Usable on its own for a close shot, and mounted by `AutonomousRig` for the wide.
// The sweep is deliberately SLOW and CONTINUOUS: a lidar that spins fast enough to
// see in a 30fps render is a lighthouse, and a lighthouse is a different machine.
// =============================================================================
export const SensorMast: React.FC<Rig & {sweeping?: boolean}> = ({
  x = 0, y = 0, scale = 1, frame = 0, seed = 1, sweeping = true,
}) => {
  const L = useLight();
  const uid = useUid('sm');
  const K = fit('sensorMast', 100);
  const t = tones('#d8d4cc', L);
  const a = sweeping ? (frame / 30) * 150 : rnd(seed, 1) * 360;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <defs><FormGradient id={`${uid}_h`} t={t} softness={0.5} /></defs>
      {/* the housing */}
      <path d="M-96,0 q0,-30 34,-32 l124,0 q34,2 34,32 Z" fill={`url(#${uid}_h)`}
        stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      {/* the lidar drum, and the band that is its actual aperture */}
      <g transform="translate(0 -46)">
        <ellipse cx={0} cy={0} rx={30} ry={11} fill="#3a4149" stroke={INK} strokeWidth={4} />
        <rect x={-30} y={-26} width={60} height={26} fill="#2b3138" stroke={INK}
          strokeWidth={4} />
        <ellipse cx={0} cy={-26} rx={30} ry={11} fill="#4c545d" stroke={INK} strokeWidth={4} />
        <rect x={-30} y={-19} width={60} height={9} fill="#6f8ea3" opacity={0.65} />
        {/* the return, drawn as ONE faint wedge rather than a fan of beams. A fan
            reads as a cartoon sensor; a single soft sweep reads as an instrument. */}
        {sweeping && (
          <g transform={`rotate(${a})`} opacity={0.28}>
            <path d="M0,-15 L104,-40 L104,10 Z" fill="#8fc3d8" />
          </g>
        )}
      </g>
      {/* camera bar across the front face, three apertures, unevenly spaced because
          the outer pair is the stereo baseline and the middle one is not centred */}
      <rect x={-72} y={-22} width={144} height={13} rx={3} fill="#2b3138" stroke={INK}
        strokeWidth={3.4} />
      {[-52, -6, 52].map((cx) => (
        <circle key={cx} cx={cx} cy={-15.5} r={4.4} fill="#7fa6c0" stroke="#1b2026"
          strokeWidth={1.6} />
      ))}
      {/* radar stub, low and forward */}
      <rect x={-16} y={-6} width={32} height={8} rx={2} fill="#535a62" stroke={INK}
        strokeWidth={2.6} />
    </g>
  );
};

// =============================================================================
// AUTONOMOUS RIG — a day-cab tractor and a van trailer, with the mast on the roof.
//
// The proportions are the whole job. A tractor-trailer drawn short reads as a box
// truck and drawn long reads as a train, and the tell is the gap between the drive
// axles and the trailer bogie: about half the trailer's length of empty road under
// the middle of it, where the frame rails run and nothing else does.
// =============================================================================
export const AutonomousRig: React.FC<Rig & {
  /** 0 parked, 1 highway. Drives wheel spin, body settle and the road blur. */
  speed?: number;
  /** the roof pod. Without it this is simply a truck, which is a legitimate thing
   *  to want and is why it is a prop rather than baked in. */
  autonomous?: boolean;
  /** the small marker. OFF by default: a scene that needs a label to tell the story
   *  has not told the story. */
  badge?: boolean;
  livery?: string;
  trailerLivery?: string;
}> = ({
  x = 0, y = 0, scale = 1, frame = 0, facing = 1, seed = 2, wear = 0.3,
  speed = 1, autonomous = true, badge = false, livery = '#2f4a63',
  trailerLivery = '#dcd7cd',
}) => {
  const L = useLight();
  const uid = useUid('ar');
  const K = fit('autonomousRig', 100);        // local frame: 100 units to the mast top
  const cab = tones(livery, L);
  const box = tones(trailerLivery, L);
  const spin = (frame / 30) * speed * 900;
  // The body settles on its air suspension at speed, and rocks a little. Two pixels
  // of it is the difference between a vehicle and a decal.
  const bob = Math.sin(frame / 19 + rnd(seed, 1) * 6) * 0.9 * speed;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      <defs>
        <FormGradient id={`${uid}_c`} t={cab} softness={0.55} />
        <FormGradient id={`${uid}_t`} t={box} softness={0.35} />
      </defs>
      <ContactShadow cx={-179} cy={2} rx={262} opacity={0.34} blur={11} />

      <g transform={`translate(0 ${bob})`}>
        {/* ---- the trailer. A 53-foot van, and the LENGTH is a measurement rather
                than a look: at 100 local units to 4.15 m, 16.2 m of trailer is 390
                units. The whole rig comes out about 21 m, which is what one is.

                A FLAT BOX, NOT A TUBE. It used to carry the same form gradient as
                the tractor and rendered as a cylinder -- a tanker, on the beat about
                dry vans. A box has one plane facing the camera, so it takes a flat
                fill with the ribs and a single top highlight doing the work. Same
                law as the storm: a paint is a property of the form, and a gradient
                that curves across a face says the face is curved. */}
        <rect x={-436} y={-78} width={390} height={56} rx={2} fill={box.base}
          stroke={INK} strokeWidth={4.4} />
        <rect x={-436} y={-78} width={390} height={9} fill={box.key} opacity={0.75} />
        <rect x={-436} y={-31} width={390} height={9} fill={box.shade} opacity={0.5} />
        {Array.from({length: 20}, (_, i) => (
          <path key={i} d={`M${-428 + i * 19.5},-76 L${-428 + i * 19.5},-24`}
            stroke={box.shade} strokeWidth={1.6} opacity={0.42} />
        ))}
        {/* the underride bar, which every trailer has and no drawing remembers */}
        <path d="M-436,-22 L-436,-9 L-402,-9" stroke={INK} strokeWidth={4} fill="none" />
        <path d="M-46,-22 L-46,-30" stroke={INK} strokeWidth={4} />
        {/* the landing gear, up */}
        <path d="M-118,-22 L-118,-13 M-124,-13 L-112,-13" stroke="#5c6169"
          strokeWidth={3.4} fill="none" />

        {/* ---- THE TRACTOR, AND IT IS A CONVENTIONAL.

                The first version drew a cab-over: flat front, windshield straight
                above the bumper, no hood. That is a EUROPEAN truck. Every Class 8
                lane-haul tractor on a Texas interstate has a LONG HOOD ahead of the
                windshield -- the fleet this beat is actually about runs Peterbilt
                579s and Volvo VNLs -- and the hood is not a detail, it is most of
                the silhouette. A Texan reads a cab-over as "not from here" as fast
                as they read a straw hat on a High Plains farmer.

                A DAY CAB, though: no sleeper box behind the doors, because a
                driverless lane-haul truck has nobody to sleep in one, and the
                shorter back end is the real tell that this one is different. */}

        {/* EVERY COORDINATE HERE IS ABSOLUTE. The first pass used relative `l` and `q`
            segments and one of them ran the cab wall 119 units DOWN from the roof,
            which put a slab of blue below the road. A long relative path is a chain
            where one wrong link moves everything after it, and there is no reason to
            take that on for a shape somebody has to reason about. */}

        {/* the cab: -56 to 4 along the frame, roof at -108, windshield RAKED BACK
            from the roof edge down to the hood line */}
        <path d="M-56,-22 L-56,-100 Q-56,-108 -48,-108 L-16,-108 L4,-80 L4,-22 Z"
          fill={`url(#${uid}_c)`} stroke={INK} strokeWidth={4.6} strokeLinejoin="round" />
        <path d="M-14,-104 L-3,-104 L2,-84 L-14,-84 Z" fill="#7f97a8"
          stroke={INK} strokeWidth={3.4} strokeLinejoin="round" opacity={0.92} />
        <path d="M-13,-101 L-7,-101 L-5,-87 L-13,-87 Z" fill="#a9bcc8" opacity={0.55} />
        {/* the side window and the door line, which is what says CAB rather than box */}
        <rect x={-48} y={-96} width={30} height={26} rx={3} fill="#6f8798"
          stroke={INK} strokeWidth={3} opacity={0.9} />
        <path d="M-52,-68 L-52,-24" stroke={INK} strokeWidth={2.6} opacity={0.7} />
        <circle cx={-22} cy={-62} r={2.6} fill="#3f464d" />
        {/* the roof fairing, and the rim on the windshield edge */}
        <path d="M-54,-108 L-18,-108" stroke={cab.key} strokeWidth={4} opacity={0.8} />
        <RimLight d="M-16,-108 L4,-80" w={2.6} opacity={0.5} />

        {/* the hood: from the cab front at 4 out to the bumper at 80, dropping
            slightly toward the nose the way a conventional's does, with the fender
            arched over the steer tyre */}
        <path d="M4,-24 L4,-78 L56,-72 Q66,-71 68,-64 L74,-40 L74,-24 Z"
          fill={`url(#${uid}_c)`} stroke={INK} strokeWidth={4.4} strokeLinejoin="round" />
        <path d="M34,-24 Q34,-52 56,-52 Q76,-52 76,-24" fill="none" stroke={INK}
          strokeWidth={3.4} opacity={0.55} />
        {/* the grille, standing proud of the nose */}
        <path d="M74,-64 L84,-60 L86,-30 L74,-26 Z" fill="#b9c0c6"
          stroke={INK} strokeWidth={3.4} strokeLinejoin="round" />
        {Array.from({length: 4}, (_, i) => (
          <path key={i} d={`M76,${-56 + i * 8} L84,${-54 + i * 8}`} stroke="#6c737a"
            strokeWidth={2.4} />
        ))}
        {/* the bumper and the headlamp */}
        <rect x={70} y={-26} width={20} height={10} rx={2} fill="#9aa1a8"
          stroke={INK} strokeWidth={3} />
        <ellipse cx={73} cy={-38} rx={5} ry={6} fill="#e8e2cf" stroke={INK}
          strokeWidth={2.6} />
        {/* the exhaust stack, which on a conventional runs UP THE BACK OF THE CAB
            beside the fairing rather than out of the roof, and the mirror arm on the
            A pillar where a driver who is not there would need it */}
        <path d="M-58,-118 L-58,-34" stroke="#8c9298" strokeWidth={5} />
        <path d="M-58,-118 l0,-6" stroke="#5b6167" strokeWidth={7} />
        <path d="M2,-92 L12,-95 L12,-70" stroke="#4a5158" strokeWidth={3.4} fill="none" />
        {/* the fifth wheel, under the trailer nose and behind the drives */}
        <rect x={-70} y={-30} width={44} height={9} fill="#41474e" stroke={INK}
          strokeWidth={2.6} />
        {/* the fuel tank, a horizontal cylinder slung between the axles under the
            cab door, always polished even when the rest of the truck is not */}
        <rect x={-30} y={-21} width={44} height={15} rx={7} fill="#b9c0c6"
          stroke={INK} strokeWidth={3.4} />

        {/* ---- wheels. The steer sits under the HOOD on a conventional, well ahead
                of the cab, which is the axle spacing that makes the shape read.
                Drives are duals close together; the trailer bogie is set forward of
                the rear end rather than at it. */}
        {[[52, 15], [-34, 15], [-58, 15], [-390, 14], [-414, 14]].map(([cx, r], i) => (
          <g key={i} transform={`translate(${cx} ${-r})`}>
            <circle cx={0} cy={0} r={r} fill="#22262b" stroke={INK} strokeWidth={3.4} />
            <circle cx={0} cy={0} r={r * 0.52} fill="#8d949b" stroke={INK} strokeWidth={2.4} />
            <g transform={`rotate(${spin})`}>
              {[0, 72, 144, 216, 288].map((a) => (
                <circle key={a} cx={Math.cos((a * Math.PI) / 180) * r * 0.33}
                  cy={Math.sin((a * Math.PI) / 180) * r * 0.33} r={r * 0.09}
                  fill="#3e444a" />
              ))}
            </g>
          </g>
        ))}

        {autonomous && (
          <g transform="translate(-30 -110)">
            <SensorMast frame={frame} scale={0.42 / (K * scale)} seed={seed} sweeping={speed > 0} />
          </g>
        )}
        {badge && (
          <g transform="translate(-400 -50)">
            <rect x={-19} y={-11} width={38} height={22} rx={3} fill="#1d232b"
              stroke="#e4ded2" strokeWidth={2} />
            <path d="M-9,0 l6,6 l12,-13" fill="none" stroke="#8fc3d8" strokeWidth={3}
              strokeLinecap="round" />
          </g>
        )}
        {wear > 0.2 && <RustStreak x={-436} y={-78} w={390} h={56} seed={seed}
          opacity={wear * 0.4} />}
      </g>
    </g>
  );
};

// =============================================================================
// CAB VIEW — the empty seat, at a size where empty is legible.
//
// This is the shot the beat needs and the wide cannot give. Interior three-quarter:
// the wheel, the seat, the belt hanging slack, and the windshield with the road
// moving in it. The `occupied` case exists because the same lane runs both ways in
// this story and a safety driver in the seat is a different fact, not a different
// drawing.
// =============================================================================
export const CabView: React.FC<{
  x?: number; y?: number; w?: number; h?: number; frame?: number; seed?: number;
  occupied?: boolean;
  /** 0 parked, 1 rolling. Moves the road in the glass and turns the wheel a little. */
  speed?: number;
}> = ({x = 0, y = 0, w = 720, h = 460, frame = 0, seed = 3, occupied = false, speed = 1}) => {
  const L = useLight();
  const uid = useUid('cv');
  const t = tones('#3a4048', L);
  const road = ((frame * speed * 9) % 120);
  const wheelDeg = Math.sin(frame / 47) * 4 * speed;

  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <FormGradient id={`${uid}_i`} t={t} softness={0.5} />
        <clipPath id={`${uid}_glass`}>
          <path d={`M${w * 0.08},${h * 0.06} L${w * 0.92},${h * 0.06}
                    L${w * 0.86},${h * 0.52} L${w * 0.14},${h * 0.52} Z`} />
        </clipPath>
      </defs>

      {/* ---- through the windshield: horizon, lane, and the shoulder rushing */}
      <g clipPath={`url(#${uid}_glass)`}>
        <rect x={0} y={0} width={w} height={h} fill="#93a7b4" />
        <rect x={0} y={h * 0.3} width={w} height={h * 0.3} fill="#a3907a" />
        <rect x={0} y={h * 0.34} width={w} height={h * 0.2} fill="#5f5c58" />
        {Array.from({length: 6}, (_, i) => (
          <rect key={i} x={w * 0.46} y={h * 0.36 + ((i * 40 + road) % 120) * (h * 0.0016)}
            width={w * 0.03 * (1 + i * 0.25)} height={5 + i * 2} fill="#e4ded2" opacity={0.85} />
        ))}
      </g>
      <path d={`M${w * 0.08},${h * 0.06} L${w * 0.92},${h * 0.06}
                L${w * 0.86},${h * 0.52} L${w * 0.14},${h * 0.52} Z`}
        fill="none" stroke={INK} strokeWidth={6} strokeLinejoin="round" />

      {/* ---- the dash and the A pillars */}
      <path d={`M0,${h * 0.5} L${w},${h * 0.5} L${w},${h} L0,${h} Z`}
        fill={`url(#${uid}_i)`} />
      <path d={`M${w * 0.08},${h * 0.06} L${w * 0.14},${h * 0.52} L${w * 0.05},${h * 0.52}
                L${w * 0.01},${h * 0.06} Z`} fill={t.core} stroke={INK} strokeWidth={4} />
      <path d={`M${w * 0.92},${h * 0.06} L${w * 0.86},${h * 0.52} L${w * 0.95},${h * 0.52}
                L${w * 0.99},${h * 0.06} Z`} fill={t.shade} stroke={INK} strokeWidth={4} />

      {/* ---- the seat. Empty is drawn as a seat with its BELT HANGING SLACK against
              the pillar, which is what an unbuckled belt does and what a viewer
              reads before they read the empty cushion. */}
      <g transform={`translate(${w * 0.3} ${h * 0.52})`}>
        <path d="M-58,0 q-6,-118 20,-126 l58,0 q22,10 18,126 Z" fill={t.core}
          stroke={INK} strokeWidth={4.6} strokeLinejoin="round" />
        <path d="M-40,-16 q40,-12 78,0" fill="none" stroke={t.shade} strokeWidth={3.4} />
        <path d="M-34,-58 q36,-10 66,0" fill="none" stroke={t.shade} strokeWidth={3} />
        {occupied ? (
          <g>
            <ellipse cx={4} cy={-96} rx={26} ry={29} fill="#c99a76" stroke={INK}
              strokeWidth={4} />
            <path d="M-30,-70 q34,-14 68,0 l4,70 l-76,0 Z" fill="#4a6076" stroke={INK}
              strokeWidth={4} strokeLinejoin="round" />
            <path d="M28,-64 L-14,4" stroke="#2a2f36" strokeWidth={7} opacity={0.9} />
          </g>
        ) : (
          <path d="M44,-118 q10,60 -2,116" fill="none" stroke="#2a2f36" strokeWidth={7}
            strokeLinecap="round" opacity={0.9} />
        )}
      </g>

      {/* ---- the wheel, turning a little even with nobody on it */}
      <g transform={`translate(${w * 0.3} ${h * 0.62}) rotate(${wheelDeg})`}>
        <circle cx={0} cy={0} r={64} fill="none" stroke="#23282e" strokeWidth={15} />
        <circle cx={0} cy={0} r={64} fill="none" stroke="#3d434a" strokeWidth={5} />
        <path d="M-52,10 L52,10 M0,10 L0,52" stroke="#23282e" strokeWidth={11} />
        <circle cx={0} cy={22} r={17} fill="#2b3138" stroke={INK} strokeWidth={3.4} />
      </g>

      {/* ---- the instrument cluster, lit. Deliberately unreadable at this size: it
              is a glow that says the truck is awake, not a panel of numbers this
              file would have had to invent. */}
      <g transform={`translate(${w * 0.3} ${h * 0.53})`} opacity={0.85}>
        <rect x={-72} y={-4} width={144} height={26} rx={5} fill="#161b21" />
        <circle cx={-40} cy={9} r={9} fill="none" stroke="#7fa6c0" strokeWidth={2.4}
          opacity={0.8} />
        <circle cx={40} cy={9} r={9} fill="none" stroke="#7fa6c0" strokeWidth={2.4}
          opacity={0.8} />
        <rect x={-16} y={4} width={32} height={10} rx={2} fill="#25313c" />
      </g>
      {/* the seed decides which way the mirror arm is folded, so two cab shots in
          one film are not the same cab */}
      <path d={`M${w * (rnd(seed, 2) > 0.5 ? 0.04 : 0.96)},${h * 0.2}
                l${rnd(seed, 2) > 0.5 ? -18 : 18},0`}
        stroke="#3d434a" strokeWidth={6} />
    </g>
  );
};

// =============================================================================
// LANE — the road under it all, and the thing that actually moves.
//
// Drawn as a receding strip with the skip line marching, so a rig held still in the
// frame reads as travelling. The shoulder rumble strip is the detail that sells it:
// it is the only part of a highway with a visible texture at speed.
// =============================================================================
export const Lane: React.FC<{
  x?: number; y?: number; w?: number; h?: number; frame?: number; speed?: number;
  seed?: number;
  /** a second carriageway across the median, for an interstate rather than a
   *  farm-to-market road. */
  divided?: boolean;
}> = ({x = 0, y = 0, w = 1080, h = 300, frame = 0, speed = 1, seed = 4, divided = true}) => {
  const march = (frame * speed * 22) % 220;

  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#5f5c58" />
      {/* the seam between the two paving lanes, which is never quite straight */}
      <path d={`M${x},${y + h * 0.52} q${w * 0.3},${1.5} ${w * 0.55},0 t${w * 0.45},0`}
        stroke="#514e4b" strokeWidth={3} fill="none" />
      {/* the skip line, marching */}
      {Array.from({length: 9}, (_, i) => (
        <rect key={i} x={x - 220 + ((i * 220 + march) % (w + 440))} y={y + h * 0.5 - 5}
          width={112} height={10} fill="#e8e2d6" opacity={0.9} />
      ))}
      {/* the shoulder line and the rumble strip cut into it */}
      <rect x={x} y={y + h * 0.86} width={w} height={7} fill="#e8e2d6" opacity={0.85} />
      {Array.from({length: 64}, (_, i) => (
        <rect key={i} x={x + i * (w / 64)} y={y + h * 0.93} width={w / 64 * 0.55} height={9}
          fill="#4c4946" opacity={0.8} />
      ))}
      {divided && (
        <g>
          <rect x={x} y={y - h * 0.42} width={w} height={h * 0.3} fill="#615e5a" />
          <rect x={x} y={y - h * 0.13} width={w} height={h * 0.14} fill="#8a8f6e" />
          {Array.from({length: 5}, (_, i) => (
            <rect key={i} x={x - 300 + ((i * 300 - march * 0.7) % (w + 600))}
              y={y - h * 0.28} width={90} height={7} fill="#e8e2d6" opacity={0.55} />
          ))}
        </g>
      )}
      {/* a caliche pull-off, seeded so no two shots of the same road match */}
      <ellipse cx={x + w * (0.2 + rnd(seed, 1) * 0.6)} cy={y + h * 0.99}
        rx={w * 0.13} ry={h * 0.06} fill="#a08d72" opacity={0.6} />
    </g>
  );
};

// =============================================================================
// WEIGH STATION — the gantry, and the sign that is either open or closed.
//
// It earns its place because it is where the regulatory half of this beat is
// physically located. The state has to be able to stop one of these trucks, and
// this is the building where that happens.
// =============================================================================
export const WeighStation: React.FC<Rig & {open?: boolean}> = ({
  x = 0, y = 0, scale = 1, seed = 5, wear = 0.45, open = true,
}) => {
  const L = useLight();
  const uid = useUid('ws');
  const K = fit('weighStation', 160);
  const t = tones('#8e9298', L);

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <defs><FormGradient id={`${uid}_p`} t={t} softness={0.4} /></defs>
      <ContactShadow cx={70} cy={2} rx={100} opacity={0.28} blur={10} />
      {/* the gantry: two posts and a truss over the lane */}
      <rect x={-6} y={-152} width={13} height={152} fill={`url(#${uid}_p)`}
        stroke={INK} strokeWidth={3.4} />
      <rect x={134} y={-152} width={13} height={152} fill={`url(#${uid}_p)`}
        stroke={INK} strokeWidth={3.4} />
      <rect x={-6} y={-160} width={153} height={16} fill={t.core} stroke={INK}
        strokeWidth={3.4} />
      <path d="M0,-146 L140,-146 M0,-146 L70,-160 M140,-146 L70,-160" stroke={t.shade}
        strokeWidth={2.6} fill="none" />
      {/* the sign, and it says one of two things */}
      <rect x={34} y={-136} width={74} height={34} rx={3} fill="#171b20" stroke={INK}
        strokeWidth={3} />
      <rect x={40} y={-129} width={62} height={9} rx={2}
        fill={open ? '#d8a13c' : '#3c4148'} opacity={open ? 0.95 : 0.7} />
      <rect x={40} y={-116} width={44} height={9} rx={2}
        fill={open ? '#d8a13c' : '#3c4148'} opacity={open ? 0.95 : 0.7} />
      {/* the scale deck set into the pavement, which is the actual instrument */}
      <rect x={22} y={-9} width={102} height={9} fill="#6d7278" stroke={INK}
        strokeWidth={2.6} />
      {wear > 0.3 && <RustStreak x={-6} y={-152} w={13} h={150} seed={seed}
        opacity={wear * 0.6} />}
    </g>
  );
};

// =============================================================================
// DOCK DOOR — the terminal end of the lane. A rank of roll-up doors with their
// levellers and bumpers, and one trailer backed into a bay.
//
// A driverless lane still ends at a dock, and the dock is where a person is, which
// is the fact the beat should not lose: the truck runs the middle and the humans
// are at both ends of it.
// =============================================================================
export const DockDoors: React.FC<Rig & {doors?: number; occupied?: number[]}> = ({
  x = 0, y = 0, scale = 1, seed = 6, wear = 0.35, doors = 5, occupied = [1, 3],
}) => {
  const L = useLight();
  const uid = useUid('dd');
  const K = fit('dockDoor', 100);
  const wall = tones('#b6b1a7', L);
  const dw = 62;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <defs><FormGradient id={`${uid}_w`} t={wall} softness={0.3} /></defs>
      <rect x={-14} y={-104} width={doors * dw + 28} height={104} fill={`url(#${uid}_w)`}
        stroke={INK} strokeWidth={4} />
      {Array.from({length: doors}, (_, i) => {
        const dx = i * dw + 8;
        const busy = occupied.includes(i);
        return (
          <g key={i}>
            {/* the raised dock apron */}
            <rect x={dx} y={-22} width={dw - 16} height={22} fill="#8f8b83" />
            {/* the door itself: ribbed roll-up, open where a trailer is in the bay */}
            <rect x={dx} y={-86} width={dw - 16} height={busy ? 22 : 64}
              fill={busy ? '#23282d' : '#9aa0a6'} stroke={INK} strokeWidth={3} />
            {!busy && Array.from({length: 6}, (_, j) => (
              <path key={j} d={`M${dx},${-82 + j * 10} L${dx + dw - 16},${-82 + j * 10}`}
                stroke={wall.shade} strokeWidth={1.6} opacity={0.5} />
            ))}
            {busy && (
              <rect x={dx - 3} y={-64} width={dw - 10} height={64} fill="#d3cec4"
                stroke={INK} strokeWidth={3} />
            )}
            {/* rubber bumpers, the two black blocks every dock has */}
            <rect x={dx - 4} y={-26} width={9} height={13} fill="#22252a" />
            <rect x={dx + dw - 21} y={-26} width={9} height={13} fill="#22252a" />
            <rect x={dx + (dw - 16) / 2 - 8} y={-96} width={16} height={9} rx={2}
              fill={busy ? '#c8703a' : '#5d7f52'} />
          </g>
        );
      })}
      {wear > 0.25 && <RustStreak x={-14} y={-104} w={doors * dw + 28} h={104}
        seed={seed} opacity={wear * 0.35} />}
    </g>
  );
};
