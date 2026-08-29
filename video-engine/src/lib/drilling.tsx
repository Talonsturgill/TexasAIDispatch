import React from 'react';
import {useUid} from './uid';
import {
  tones, FormGradient, ContactShadow, useLight, BrushedMetal, RustStreak, CalicheDust, INK,
} from './lighting';
import {M, fitter} from './scale';
import {FONT} from './type';

// =============================================================================
// DRILLING — the rig floor, and the beat this engine could not draw.
//
// WHY THIS FILE EXISTS. `knowledge/texas/APPLICATIONS.md` ranks the oilfield FIRST
// of the eight application beats, on the grounds that the Permian trains more
// models per square mile than anywhere on earth. The engine could draw a pumpjack,
// which is PRODUCTION, and nothing at all of DRILLING. So the top-ranked beat had
// no derrick, no floor, no pipe and no driller's cabin, and a Dispatch about an
// automated rig would have had to be staged as a pumpjack with a caption over it.
//
// A drawing nothing can stage is dead weight, and a beat nothing can draw is worse:
// it silently reroutes every story toward whatever the library already has.
//
// THREE THINGS THAT MAKE A RIG READ, and each is a mistake this file is avoiding.
//
//   THE MAST IS A TAPERED LATTICE, NOT A TOWER. Draw it with parallel legs and it
//   reads as a transmission tower or a fire lookout. The taper is most of the
//   silhouette: roughly 12 m across the base and 2 m at the crown, so the legs
//   converge hard and the X-bracing gets visibly tighter with height.
//
//   THE FLOOR IS UP IN THE AIR. A modern land rig sits on a substructure and the
//   drill floor is eight or nine metres off the ground, reached by a stair. Drawn
//   at ground level the whole machine loses its scale and its danger, and the
//   danger is the story: the RED ZONE is a raised steel square you climb to.
//
//   NOTHING IS SYMMETRIC, per CLAUDE.md. A derrick is structurally symmetric and
//   the drawing must not be: the stair goes up one side, the travelling block hangs
//   off the centreline, the rust runs where the water actually runs, and the sign
//   on the gate is wired on slightly crooked because a person wired it on.
//
// THE GRIM REAPER IS NOT DECORATION AND IT IS NOT A RETIRED MOTIF. Reuters found a
// hand-painted one on the gate around an Exxon drilling floor beside the words RED
// ZONE, and it is drawn here as what it is: a hooded figure with a scythe, in flat
// silhouette, on a safety placard. It is deliberately NOT a decorated skull.
// `knowledge/texas/CULTURE.md` retires calavera imagery as appropriation, and the
// distinction matters. An industrial hazard placard and Day of the Dead iconography
// are different things and this file draws only the first.
// =============================================================================

export const DRILL_M: Record<string, {h: number; note: string}> = {
  derrick: {h: 44, note: 'a modern land rig, ground to the top of the crown block'},
  rigFloor: {h: 1.12, note: 'the handrail and gate around the drill floor, above the deck'},
  redZoneSign: {h: 0.62, note: 'the placard wired to the gate, panel only'},
  ironRoughneck: {h: 3.2, note: 'the pipe-handling machine, deck to the top of its column'},
  doghouse: {h: 3.0, note: 'the driller cabin, a skidded box, deck to its roof'},
  pipeRack: {h: 1.5, note: 'tubulars stacked on the ground rack, to the top of the stack'},
};

const fit = fitter(DRILL_M);

const rnd = (seed: number, ch: number) => {
  const k = ((seed * 2654435761) ^ (ch * 40503)) >>> 0;
  return ((k >>> 8) % 10000) / 10000;
};

export interface Rig {
  x?: number; y?: number; scale?: number; frame?: number; facing?: 1 | -1;
  seed?: number; wear?: number;
}

// =============================================================================
// DERRICK — the mast, the substructure, and a travelling block that is somewhere.
//
// `block` is the travelling block's height, 0 at the floor and 1 at the crown. It
// is a PROP rather than an animation, because a rig making a connection and a rig
// drilling ahead are two different facts and a board should be able to state which.
// When `hoisting` is set the block runs, slowly, the way a real one does.
// =============================================================================
export const Derrick: React.FC<Rig & {
  /** 0 at the floor, 1 at the crown. Where the travelling block is hanging. */
  block?: number;
  /** run the block instead of holding it. Seconds per full round trip. */
  hoisting?: number;
  /** the racked stands in the fingerboard. A rig that has pipe in the derrick is
   *  tripping, which is a different shift from drilling ahead. */
  racked?: number;
  lit?: boolean;
}> = ({
  x = 0, y = 0, scale = 1, frame = 0, facing = 1, seed = 3, wear = 0.3,
  block = 0.22, hoisting, racked = 0, lit = false,
}) => {
  const L = useLight();
  const uid = useUid('dk');
  const K = fit('derrick', 620);
  const steel = tones('#8d949b', L);
  const deck = tones('#6a7078', L);

  // Local frame: y = 0 is the ground, y = -620 is the crown.
  const GROUND = 0;
  const SUB_TOP = -128;              // the drill floor, about 9 m up
  const CROWN = -620;
  const legBase = 84;                // half-width at the substructure top
  const legTop = 15;                 // half-width at the crown

  const bx = (t: number) => legBase + (legTop - legBase) * t;
  const by = (t: number) => SUB_TOP + (CROWN - SUB_TOP) * t;

  const bt = hoisting
    ? (Math.sin((frame / 30) * (Math.PI * 2) / hoisting) * 0.5 + 0.5) * 0.86 + 0.07
    : Math.min(0.97, Math.max(0.03, block));
  const blockY = by(bt);

  // The bracing tightens with height because the bay length follows the taper.
  const bays = 9;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      <defs>
        <FormGradient id={`${uid}_s`} t={steel} softness={0.55} />
        <FormGradient id={`${uid}_d`} t={deck} softness={0.5} />
      </defs>
      <ContactShadow cx={0} cy={GROUND + 4} rx={150} ry={22} opacity={0.3} blur={14} />

      {/* the location: a caliche pad the whole machine sits on */}
      <rect x={-176} y={GROUND - 6} width={352} height={12} fill="#bdb3a3"
        stroke={INK} strokeWidth={4} />

      {/* -------- substructure, the box that holds the floor in the air */}
      <path d={`M-96,${GROUND} L-84,${SUB_TOP} L84,${SUB_TOP} L96,${GROUND} Z`}
        fill={`url(#${uid}_d)`} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      {/* its own bracing, drawn as a real X so the box is not a slab */}
      <path d={`M-92,${GROUND} L80,${SUB_TOP} M92,${GROUND} L-80,${SUB_TOP}`}
        stroke={INK} strokeWidth={3.4} opacity={0.5} fill="none" />
      <rect x={-88} y={SUB_TOP - 9} width={176} height={10} fill={`url(#${uid}_s)`}
        stroke={INK} strokeWidth={4} />

      {/* the stair, UP ONE SIDE ONLY. This is the asymmetry that sells it, and it is
          also the way a person actually reaches the red zone. */}
      <path d={`M104,${GROUND} L${legBase + 4},${SUB_TOP}`} stroke={INK} strokeWidth={5} />
      <path d={`M118,${GROUND} L${legBase + 18},${SUB_TOP}`} stroke={INK} strokeWidth={3.4} />
      {Array.from({length: 11}, (_, i) => {
        const t = (i + 0.5) / 11;
        const sx = 104 + (legBase + 4 - 104) * t;
        const sy = GROUND + (SUB_TOP - GROUND) * t;
        return <path key={i} d={`M${sx},${sy} L${sx + 14},${sy}`} stroke={INK} strokeWidth={2.6} />;
      })}

      {/* -------- the mast: two converging legs and the bracing between them */}
      <path d={`M${-legBase},${SUB_TOP} L${-legTop},${CROWN}`} stroke={`url(#${uid}_s)`}
        strokeWidth={11} fill="none" strokeLinecap="round" />
      <path d={`M${legBase},${SUB_TOP} L${legTop},${CROWN}`} stroke={`url(#${uid}_s)`}
        strokeWidth={11} fill="none" strokeLinecap="round" />
      <path d={`M${-legBase},${SUB_TOP} L${-legTop},${CROWN}`} stroke={INK} strokeWidth={4}
        fill="none" opacity={0.9} />
      <path d={`M${legBase},${SUB_TOP} L${legTop},${CROWN}`} stroke={INK} strokeWidth={4}
        fill="none" opacity={0.9} />

      {Array.from({length: bays}, (_, i) => {
        const t0 = i / bays, t1 = (i + 1) / bays;
        const y0 = by(t0), y1 = by(t1);
        const w0 = bx(t0), w1 = bx(t1);
        // alternate the diagonal so the lattice zigzags rather than combing one way
        const d = i % 2 === 0
          ? `M${-w0},${y0} L${w1},${y1}`
          : `M${w0},${y0} L${-w1},${y1}`;
        return (
          <g key={i}>
            <path d={d} stroke={INK} strokeWidth={3.2} opacity={0.78} fill="none" />
            <path d={`M${-w1},${y1} L${w1},${y1}`} stroke={INK} strokeWidth={3.6} fill="none" />
          </g>
        );
      })}

      {/* crown block on top, and the water table it sits on */}
      <rect x={-legTop - 9} y={CROWN - 20} width={(legTop + 9) * 2} height={20} rx={2}
        fill={`url(#${uid}_s)`} stroke={INK} strokeWidth={4.5} />
      <circle cx={0} cy={CROWN - 10} r={7} fill="#3f4a58" stroke={INK} strokeWidth={3} />

      {/* the drilling line, down to the travelling block. Off the centreline,
          because the fast line runs down one side to the drawworks. */}
      <path d={`M-5,${CROWN - 4} L-5,${blockY}`} stroke={INK} strokeWidth={2.6} />
      <path d={`M6,${CROWN - 4} L6,${blockY}`} stroke={INK} strokeWidth={2.6} />
      <rect x={-19} y={blockY} width={38} height={34} rx={4} fill="#4a5560"
        stroke={INK} strokeWidth={4.5} />
      <path d={`M0,${blockY + 34} L0,${blockY + 58}`} stroke={INK} strokeWidth={5} />

      {/* racked stands in the fingerboard, leaning against one side */}
      {racked > 0 && Array.from({length: Math.min(14, racked)}, (_, i) => {
        const px = -legBase + 22 + i * 7 + rnd(seed, i) * 2;
        return (
          <path key={i} d={`M${px},${SUB_TOP - 4} L${px + 5},${SUB_TOP - 300}`}
            stroke="#7d6a55" strokeWidth={4} opacity={0.9} />
        );
      })}

      {/* the drawworks, a shed on the floor at the back */}
      <rect x={-78} y={SUB_TOP - 44} width={54} height={36} rx={2} fill="#6f7a5e"
        stroke={INK} strokeWidth={4.5} />

      {lit && (
        <g opacity={0.9}>
          {[0.18, 0.46, 0.74].map((t, i) => (
            <circle key={i} cx={i % 2 ? bx(t) - 4 : -bx(t) + 4} cy={by(t)} r={5}
              fill="#ffd89a" stroke={INK} strokeWidth={2} />
          ))}
          <circle cx={0} cy={CROWN - 26} r={5} fill="#e2564a" stroke={INK} strokeWidth={2} />
        </g>
      )}

      {wear > 0.2 && <RustStreak x={-90} y={SUB_TOP} w={180} h={120} seed={seed}
        opacity={wear * 0.85} />}
      <BrushedMetal x={-88} y={SUB_TOP - 9} w={176} h={10} opacity={0.14} />
    </g>
  );
};

// =============================================================================
// RIG FLOOR — the red zone, drawn from OUTSIDE the gate.
//
// This is the shot the story needs and the wide cannot give: a steel deck with a
// handrail and a gate across it, and behind the gate the rotary table and nobody
// standing on it. The gate is the whole composition. `open` swings it, because a
// gate standing open on an empty floor and a gate latched shut are different facts.
// =============================================================================
export const RigFloor: React.FC<Rig & {
  /** how far the gate stands open, 0 latched to 1 wide. */
  open?: number;
  /** the rotary table turning under it. Seconds per revolution. */
  turning?: number;
  /** draw the placard wired to the gate. */
  sign?: boolean;
  /** deck width in local units, so a board can run it past the frame edge. */
  w?: number;
}> = ({
  x = 0, y = 0, scale = 1, frame = 0, facing = 1, seed = 5, wear = 0.35,
  open = 0, turning, sign = true, w = 760,
}) => {
  const L = useLight();
  const uid = useUid('rf');
  const K = fit('rigFloor', 120);
  const steel = tones('#7f868d', L);
  const rail = tones('#c9a227', L);          // safety yellow, the one bright colour
  const half = w / 2;

  const spin = turning ? ((frame / 30) * (360 / turning)) % 360 : 0;
  // A GATE STANDING AJAR, NOT ONE LYING DOWN. At 68 degrees of swing a half-open
  // gate presents its placard almost face-on and low in frame, and it reads as a
  // sign that has fallen off rather than as a way in. 44 keeps the gate legible as
  // a gate at every value the board uses.
  const gateDeg = -44 * Math.max(0, Math.min(1, open));

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      <defs>
        <FormGradient id={`${uid}_s`} t={steel} softness={0.5} />
        <FormGradient id={`${uid}_r`} t={rail} softness={0.6} />
      </defs>

      {/* THE DECK IS A PLANE, NOT A KERB. This drew a 26 unit strip, which is a side
          elevation, so the film's own central image, the square of steel with nobody
          standing on it, could not read at ANY depth. Moving it in z only made the
          same strip bigger, which is exactly what round two reported. It is now a
          foreshortened quad receding from the near edge, with the tread plate
          distributed across it. */}
      <path d={`M${-half},26 L${half},26 L${half * 0.52},-120 L${-half * 0.52},-120 Z`}
        fill={`url(#${uid}_s)`} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <BrushedMetal x={-half * 0.52} y={-120} w={w * 0.52} h={146} opacity={0.16} />
      {/* non-slip tread, converging with the deck so the plane reads as receding */}
      {Array.from({length: Math.floor(w / 34)}, (_, i) => {
        const u = (i + 0.5) / Math.floor(w / 34);
        const nx = -half + u * w;
        const fx = -half * 0.52 + u * w * 0.52;
        return <path key={i} d={`M${nx},22 L${fx},-116`} stroke={INK} strokeWidth={1.9}
          opacity={0.26} />;
      })}
      {/* the far edge of the floor, so the square has a back to it */}
      {/* THE FAR HANDRAIL, and it is what actually makes the plane read as horizontal.
          Three rounds asked for this floor and the first two diagnoses both said DEPTH.
          Depth was never the problem. A receding quad with a rail along its NEAR edge
          only has no way to prove it is a floor rather than a wall, and deepening it to
          300 units put its far edge 1.88 m ABOVE the top of the 1.12 m rail enclosing
          it, which no horizontal surface can do. So the quad now stops just above the
          rail line and a SECOND rail stands on its far edge. A plane between two rails
          is a floor; a plane behind one rail is a ramp. */}
      {Array.from({length: Math.max(2, Math.floor(w / 190))}, (_, i) => {
        const n = Math.max(2, Math.floor(w / 190));
        const px = -half * 0.52 + (i / (n - 1)) * w * 0.52;
        return <path key={`fp${i}`} d={`M${px},-120 L${px},-178`} stroke={`url(#${uid}_r)`}
          strokeWidth={5} strokeLinecap="round" />;
      })}
      <path d={`M${-half * 0.52},-178 L${half * 0.52},-176`} stroke={`url(#${uid}_r)`}
        strokeWidth={6} strokeLinecap="round" fill="none" />
      <path d={`M${-half * 0.52},-120 L${half * 0.52},-120`} stroke={INK} strokeWidth={4}
        opacity={0.75} />

      {/* rotary table, set into the deck behind the rail */}
      <ellipse cx={-30} cy={-70} rx={66} ry={20} fill="#3f4750" stroke={INK} strokeWidth={4.5} />
      <g transform={`rotate(${spin} -30 -70)`} opacity={0.9}>
        <ellipse cx={-30} cy={-70} rx={42} ry={13} fill="#59636e" stroke={INK} strokeWidth={3} />
        <path d="M-72,-70 L12,-70" stroke={INK} strokeWidth={3} />
      </g>

      {/* the handrail: posts, top rail, mid rail, and a kick plate */}
      {Array.from({length: Math.floor(w / 120) + 1}, (_, i) => {
        const px = -half + 20 + i * 120;
        // a post that got backed into, because maintained but worn
        const lean = i === 2 ? 3.5 : 0;
        return (
          <path key={i} d={`M${px},0 L${px + lean},-112`} stroke={`url(#${uid}_r)`}
            strokeWidth={9} strokeLinecap="round" />
        );
      })}
      <path d={`M${-half + 18},-112 L${half - 18},-110`} stroke={`url(#${uid}_r)`}
        strokeWidth={10} strokeLinecap="round" fill="none" />
      <path d={`M${-half + 18},-60 L${half - 18},-59`} stroke={`url(#${uid}_r)`}
        strokeWidth={7} strokeLinecap="round" fill="none" />
      <path d={`M${-half + 14},-6 L${half - 14},-6`} stroke={INK} strokeWidth={7}
        opacity={0.75} />

      {/* THE GATE. It hinges at its right post and swings toward the camera. */}
      <g transform={`rotate(${gateDeg} 150 -56)`}>
        <path d="M40,0 L40,-112" stroke={`url(#${uid}_r)`} strokeWidth={9} strokeLinecap="round" />
        <path d="M40,-112 L150,-112 M40,-60 L150,-60" stroke={`url(#${uid}_r)`}
          strokeWidth={8} strokeLinecap="round" fill="none" />
        <path d="M46,-108 L146,-64" stroke={`url(#${uid}_r)`} strokeWidth={5} opacity={0.85} />
        {sign && <RedZoneSign x={95} y={-86} scale={0.62} seed={seed} tilt={-3.2} />}
      </g>

      {wear > 0.25 && <RustStreak x={-half} y={0} w={w} h={26} seed={seed + 3}
        opacity={wear * 0.7} />}
    </g>
  );
};

// =============================================================================
// RED ZONE SIGN — the placard, and the reason the floor is empty.
//
// A hazard placard, wired on slightly crooked. The figure is a HOODED SHAPE WITH A
// SCYTHE in flat silhouette and nothing else: no skull, no decoration, no marigold.
// See the file header. This is an industrial warning sign, and the distinction from
// retired iconography is deliberate and load bearing.
// =============================================================================
export const RedZoneSign: React.FC<Rig & {
  /** degrees off level. Never zero by default, because a person hung it. */
  tilt?: number;
  label?: string;
  sub?: string;
}> = ({
  x = 0, y = 0, scale = 1, seed = 2, wear = 0.3, tilt = -2.6,
  label = 'RED ZONE', sub = 'RESTRICTED AREA',
}) => {
  const uid = useUid('rz');
  const K = fit('redZoneSign', 92);

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale}) rotate(${tilt})`}>
      {/* the panel */}
      <rect x={-62} y={-46} width={124} height={92} rx={4} fill="#f0ece2"
        stroke={INK} strokeWidth={5} />
      <rect x={-62} y={-46} width={124} height={26} rx={3} fill="#b3372c"
        stroke={INK} strokeWidth={5} />
      <text x={0} y={-26} textAnchor="middle" fontSize={17} fontWeight={800}
        fill="#f4efe6" fontFamily={FONT.body} letterSpacing={0.6}>{label}</text>

      {/* THE REAPER. Read from a rendered frame rather than from the code: the first
          pass was a lumpy blob that read as a chess pawn, because the robe was as
          wide as it was tall and the hood was a circle stuck on top. What makes it
          legible small is a NARROW robe with a flared hem, a hood that overhangs a
          void where a face would be, and a scythe whose staff clears the body. */}
      <g transform="translate(-32 30) scale(0.86)">
        {/* THE ROBE, narrow. Second correction off a rendered frame: the previous
            pass still read as a thermos, because the hood ran straight into the
            shoulders with no break and the hem flared like a base. The three things
            that make it a figure are a hood WIDER than the neck, a visible notch
            under it, and a hem that is ragged rather than rounded. */}
        <path d="M-6,2 q-3,-20 -1,-30 q1,-6 7,-6 q6,0 7,6 q2,10 -1,30 Z" fill={INK} />
        {/* ragged hem, uneven on purpose */}
        <path d="M-6,2 l2,5 l3,-4 l3,6 l3,-5 l2,4 l1,-6 Z" fill={INK} />
        {/* the notch: a shoulder line cut in the panel colour, so hood and body read
            as two things rather than one silhouette */}
        <path d="M-7,-32 q7,4 14,0" stroke="#f0ece2" strokeWidth={1.6} fill="none" />
        {/* hood, overhanging, wider than the neck it sits on */}
        <path d="M-10,-33 q-2,-16 10,-16 q12,0 10,16 q-10,5 -20,0 Z" fill={INK} />
        {/* the face void, which is what a hood is for */}
        <path d="M-4,-38 q0,-7 4,-7 q4,0 4,7 q-4,3 -8,0 Z" fill="#f0ece2" opacity={0.9} />
        {/* one sleeve, across the body, holding the staff */}
        <path d="M-3,-24 q9,3 14,-4" stroke={INK} strokeWidth={4} fill="none"
          strokeLinecap="round" />
        {/* scythe: a long staff and a FILLED crescent, because an outline hook at
            this size disappears */}
        <path d="M15,12 L8,-54" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
        <path d="M8,-54 q-15,0 -22,11 q10,-6 21,-5 Z" fill={INK} />
      </g>

      <text x={22} y={6} textAnchor="middle" fontSize={10} fontWeight={800}
        fill="#2a2723" fontFamily={FONT.body}
        letterSpacing={0.2}>{sub.split(' ')[0]}</text>
      <text x={22} y={20} textAnchor="middle" fontSize={10} fontWeight={800}
        fill="#2a2723" fontFamily={FONT.body}
        letterSpacing={0.2}>{sub.split(' ')[1] ?? ''}</text>

      {/* wired on through two corner holes, one wire slacker than the other */}
      <circle cx={-54} cy={-38} r={3} fill="#2a2723" />
      <circle cx={54} cy={-38} r={3} fill="#2a2723" />
      {/* from the two wire holes and nowhere else. Streaks across the printed face were
          crossing RESTRICTED AREA on the one frame that has to stop a scroll. */}
      {wear > 0.2 && <RustStreak x={-58} y={-40} w={116} h={16} seed={seed}
        opacity={wear * 0.5} />}
    </g>
  );
};

// =============================================================================
// IRON ROUGHNECK — the machine that took the job.
//
// The pipe handler: a column on a track, a boom out to the spinning wrench. It is
// drawn HEAVY and INDUSTRIAL rather than sleek, because it is a hydraulic machine
// on a drill floor and not a consumer robot. Same rule as `plantfloor`: no face, no
// smooth arc. It moves in and out on the track and the wrench spins when it bites.
// =============================================================================
export const IronRoughneck: React.FC<Rig & {
  /** seconds per in-and-out cycle. */
  cycle?: number;
  /** stopped, mid-shift. */
  halted?: boolean;
  livery?: string;
}> = ({
  x = 0, y = 0, scale = 1, frame = 0, facing = 1, seed = 4, wear = 0.3,
  cycle = 5.5, halted = false, livery = '#c8703a',
}) => {
  const L = useLight();
  const uid = useUid('ir');
  const K = fit('ironRoughneck', 172);
  const body = tones(livery, L);
  const steel = tones('#79808a', L);

  // Well centre in the local frame. The jaws travel to it and the joint stands in it.
  const WELL_X = 106;
  const u = halted ? 0.34 : (frame / 30 / cycle) % 1;
  // hold, drive in fast, bite, withdraw. A hydraulic machine does not ease.
  const reach = u < 0.16 ? 0 : u < 0.3 ? (u - 0.16) / 0.14
    : u < 0.66 ? 1 : u < 0.8 ? 1 - (u - 0.66) / 0.14 : 0;
  const biting = u >= 0.3 && u < 0.66;
  const spin = biting && !halted ? (frame * 22) % 360 : 0;
  const ext = reach * 40;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      <defs>
        <FormGradient id={`${uid}_b`} t={body} softness={0.6} />
        <FormGradient id={`${uid}_s`} t={steel} softness={0.5} />
      </defs>
      <ContactShadow cx={0} cy={2} rx={46} ry={9} opacity={0.32} blur={8} />

      {/* the track it runs on, bolted to the deck */}
      <rect x={-52} y={-10} width={104} height={10} fill={`url(#${uid}_s)`}
        stroke={INK} strokeWidth={4} />

      {/* column */}
      <rect x={-22} y={-150} width={44} height={142} rx={4} fill={`url(#${uid}_b)`}
        stroke={INK} strokeWidth={5} />
      <path d="M-22,-96 L22,-96 M-22,-52 L22,-52" stroke={INK} strokeWidth={2.6} opacity={0.5} />
      {/* hydraulic hoses, which is most of what one of these looks like up close */}
      <path d="M-18,-140 q-16,26 -10,58 q5,26 -2,44" stroke="#2f2a26" strokeWidth={4}
        fill="none" opacity={0.8} />
      <path d="M-11,-142 q-13,28 -7,60 q4,24 -1,40" stroke="#2f2a26" strokeWidth={3.2}
        fill="none" opacity={0.65} />

      {/* THE TELESCOPING SLEEVE, which is what stops this reading as two objects.
          The boom slides out on `ext` and the column does not, so at full reach the
          old drawing left 48 local units of open sky between them and a judge read
          the scene as "two unrelated orange objects". A real arm telescopes: the
          sleeve is anchored to the column and GROWS with the reach, so the machine
          is continuous at every point in its cycle. */}
      <rect x={14} y={-116} width={26 + ext} height={15} rx={3} fill={`url(#${uid}_s)`}
        stroke={INK} strokeWidth={4} />
      <path d={`M${18},-112 L${34 + ext},-112`} stroke={INK} strokeWidth={2} opacity={0.4} />

      {/* the boom and the wrench, running out on the track */}
      <g transform={`translate(${ext} 0)`}>
        <rect x={6} y={-122} width={56} height={26} rx={4} fill={`url(#${uid}_b)`}
          stroke={INK} strokeWidth={5} />
        <rect x={46} y={-134} width={38} height={50} rx={5} fill={`url(#${uid}_s)`}
          stroke={INK} strokeWidth={5} />
        <g transform={`rotate(${spin} 66 -109)`}>
          <circle cx={66} cy={-109} r={16} fill="#4a5560" stroke={INK} strokeWidth={4} />
          <path d="M52,-109 L80,-109 M66,-123 L66,-95" stroke={INK} strokeWidth={3.4} />
        </g>
        {biting && !halted && (
          <g opacity={0.55}>
            <path d="M80,-118 q10,-7 17,-4 M80,-100 q11,6 18,3" stroke="#e8e2d6"
              strokeWidth={2.6} fill="none" strokeLinecap="round" />
          </g>
        )}
      </g>

      {/* THE JOINT OF PIPE, AT WELL CENTRE, WHERE THE JAWS ACTUALLY REACH.
          It was drawn at x=112 while the wrench travels to 90 + 54 = 144 at full
          reach, so the machine closed on nothing and opened on nothing and a judge
          read the whole scene as two unrelated orange objects. The tongs and the
          pipe now share one number. */}
      <path d={`M${WELL_X},-186 L${WELL_X},-6`} stroke="#7d6a55" strokeWidth={15} />
      <path d={`M${WELL_X - 5},-186 L${WELL_X - 5},-6`} stroke="#6b5a48" strokeWidth={4}
        opacity={0.7} />
      <path d={`M${WELL_X},-186 L${WELL_X},-6`} stroke={INK} strokeWidth={3.4} opacity={0.6}
        fill="none" />
      {/* the tool joint, the upset collar every stand has at its box end */}
      <rect x={WELL_X - 11} y={-120} width={22} height={26} rx={3} fill="#8a7660"
        stroke={INK} strokeWidth={3} />

      {wear > 0.2 && <RustStreak x={-22} y={-150} w={44} h={142} seed={seed} opacity={wear * 0.6} />}
    </g>
  );
};

// =============================================================================
// DOGHOUSE — the driller's cabin, and where the person went.
//
// A skidded steel box on the drill floor with one long window. `lit` puts a screen
// glow in it and `occupied` puts a shoulders-and-head silhouette at the console,
// which is the whole point of the shot in an automation story: the floor is empty
// and the person is HERE, four metres away, behind glass.
// =============================================================================
export const Doghouse: React.FC<Rig & {
  lit?: boolean;
  occupied?: boolean;
  /** the screens flicker a little. Set 0 for a still frame. */
  live?: number;
}> = ({
  x = 0, y = 0, scale = 1, frame = 0, facing = 1, seed = 6, wear = 0.3,
  lit = true, occupied = true, live = 1,
}) => {
  const L = useLight();
  const uid = useUid('dh');
  const K = fit('doghouse', 156);
  const body = tones('#7d8a76', L);
  const flick = live ? 0.86 + Math.sin(frame / 5.5) * 0.06 + Math.sin(frame / 2.3) * 0.03 : 0.9;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      <defs><FormGradient id={`${uid}_b`} t={body} softness={0.55} /></defs>
      <ContactShadow cx={0} cy={2} rx={96} ry={12} opacity={0.3} blur={10} />

      {/* the skid it is dragged around on */}
      <rect x={-96} y={-14} width={192} height={14} fill="#5c5f55" stroke={INK} strokeWidth={4} />

      {/* the box */}
      <rect x={-90} y={-152} width={180} height={138} rx={3} fill={`url(#${uid}_b)`}
        stroke={INK} strokeWidth={5.5} />
      {/* a shallow roof with a lip, and it overhangs one end further than the other */}
      <path d="M-98,-152 L96,-152 L92,-164 L-94,-164 Z" fill="#666f60"
        stroke={INK} strokeWidth={5} strokeLinejoin="round" />

      {/* the window, and the light out of it */}
      <rect x={-70} y={-132} width={124} height={54} rx={3}
        fill={lit ? '#2b3b46' : '#39423c'} stroke={INK} strokeWidth={5} />
      {lit && (
        <>
          <rect x={-64} y={-126} width={50} height={42} rx={2} fill="#7fc4d8" opacity={flick} />
          <rect x={-8} y={-126} width={56} height={42} rx={2} fill="#9ad2b4"
            opacity={flick * 0.92} />
          {/* the rows on the screens, which is what makes it a console and not a window */}
          {Array.from({length: 6}, (_, i) => (
            <path key={i} d={`M${-60},${-120 + i * 7} L${-20},${-120 + i * 7}`}
              stroke="#2b3b46" strokeWidth={2} opacity={0.5} />
          ))}
        </>
      )}
      {occupied && (
        <g>
          {/* head and shoulders at the console. Deliberately a silhouette: the cast
              rig is the right tool for a FACE, and this is a person seen through
              glass from outside, which is a different shot. */}
          <path d="M6,-78 q0,-30 26,-30 q26,0 26,30 Z" fill="#22303a" opacity={0.92} />
          <circle cx={32} cy={-116} r={13} fill="#22303a" opacity={0.92} />
        </g>
      )}

      {/* the door, at the other end, with a grab rail */}
      <rect x={62} y={-118} width={26} height={104} rx={2} fill="#6b7565"
        stroke={INK} strokeWidth={4.5} />
      <path d="M66,-66 L66,-52" stroke={INK} strokeWidth={3.4} />

      {/* RUST RUNS ON STEEL, NOT ON GLASS. This was one call across the whole box, so
          the drips crossed the window and both console screens, and two judges read an
          opaque cabin as see-through because of it. Split above and below the glazing:
          the roof-to-window seam, and the sill down to the skid. */}
      {wear > 0.2 && <RustStreak x={-90} y={-152} w={180} h={22} seed={seed}
        opacity={wear * 0.7} />}
      {wear > 0.2 && <RustStreak x={-90} y={-74} w={180} h={60} seed={seed + 4}
        opacity={wear * 0.7} />}
      {wear > 0.3 && <CalicheDust x={-96} y={-40} w={192} h={40} opacity={0.4} />}
    </g>
  );
};

// =============================================================================
// PIPE RACK — tubulars on the ground, which is where most of a rig's steel is.
//
// Stacked in courses with stripping between them, and the top course never full,
// because a rack is always mid-way through being used.
// =============================================================================
export const PipeRack: React.FC<Rig & {
  courses?: number;
  perCourse?: number;
  w?: number;
}> = ({
  x = 0, y = 0, scale = 1, facing = 1, seed = 8, wear = 0.35,
  courses = 4, perCourse = 13,
}) => {
  const L = useLight();
  const uid = useUid('pr');
  const K = fit('pipeRack', 96);
  const pipe = tones('#8a755c', L);
  const r = 11;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      <defs><FormGradient id={`${uid}_p`} t={pipe} softness={0.75} /></defs>
      <ContactShadow cx={0} cy={2} rx={perCourse * r + 20} ry={10} opacity={0.3} blur={9} />

      {/* the skids the stack sits on */}
      <rect x={-perCourse * r - 14} y={-10} width={perCourse * r * 2 + 28} height={10}
        fill="#5f5a4e" stroke={INK} strokeWidth={4} />

      {Array.from({length: courses}, (_, c) => {
        // the top course is short, and each course is offset half a pipe
        const n = c === courses - 1 ? Math.max(3, Math.floor(perCourse * 0.55)) : perCourse - c;
        const cy = -10 - r - c * (r * 1.74);
        const off = (c % 2) * r;
        return (
          <g key={c}>
            {Array.from({length: n}, (_, i) => {
              const cx = -((n - 1) / 2) * (r * 2) + i * (r * 2) + off;
              return (
                <g key={i}>
                  <circle cx={cx} cy={cy} r={r} fill={`url(#${uid}_p)`}
                    stroke={INK} strokeWidth={3.4} />
                  <circle cx={cx} cy={cy} r={r * 0.52} fill="#4a4034"
                    stroke={INK} strokeWidth={2.4} />
                </g>
              );
            })}
          </g>
        );
      })}
      {wear > 0.25 && (
        <RustStreak x={-perCourse * r} y={-10 - courses * 19} w={perCourse * r * 2}
          h={courses * 19} seed={seed} opacity={wear * 0.45} />
      )}
    </g>
  );
};
