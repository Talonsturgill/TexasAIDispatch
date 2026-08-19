import React from 'react';
import {useUid} from './uid';
import {tones, useLight, INK} from './lighting';
import {M, fitter, rnd} from './scale';

// =============================================================================
// FLORA — the plants a Texan places a frame by, before reading a single word.
//
// WHY THIS IS ITS OWN MODULE AND NOT MORE OF `kit`.
//
// `biomes.tsx` drew its own vegetation inline, per region, in a switch statement.
// That was right when there were three regions and it is wrong at ten, for one
// structural reason: a plant drawn inside a biome can only ever appear in that
// biome. A live oak is a Gulf tree AND a Hill Country tree AND the tree in a
// Blackland front yard, and inline vegetation makes that three drawings that drift
// apart. Worse, none of them can be placed by a board, so a scene that wants one
// live oak in the near plane cannot have it.
//
// So the plants come out, get true scale, get registered, and `biomes` composes
// them. Regions still differ, and now they differ in WHICH plants and HOW MANY
// rather than in three separate drawings of the same species.
//
// THE RULE THIS MODULE IS BUILT ON — RECOGNITION OVER DECORATION.
//
// An artifact earns its place by being recognised, not by being pretty. A Texan
// looks at a mesquite and thinks *I have been there*; at a generic round tree they
// think nothing at all, which is worse than a bad drawing because it costs the
// frame its location. `knowledge/texas/NOSTALGIA.md` is the doctrine and
// `FAUNA_AND_FLORA.md` carries the species notes. Every component below leads with
// THE MISTAKE, because the mistake is what gets drawn by default.
//
// SEASON IS A PROP, NOT A SEPARATE DRAWING. Half the recognition in Texas flora is
// seasonal: little bluestem goes rust in October, bald cypress turns orange and
// drops, post oak holds dead brown leaves all winter, bluebonnets are six weeks
// long. A library with one evergreen state per species can only draw one Texas.
// =============================================================================

/**
 * True heights in metres, of ORDINARY examples rather than record holders.
 *
 * The champion live oak in Texas is over 13 m at the crown and 30 m across, and
 * drawing that one makes every frame it stands in look like a park. A yard live oak
 * is the one people know.
 */
export const FLORA_M: Record<string, {h: number; note: string}> = {
  liveOak: {h: 14, note: 'a mature yard or pasture live oak, ground to crown top'},
  pecan: {h: 24, note: 'a bottomland pecan. The state tree, and the yard tree.'},
  loblolly: {h: 30, note: 'a plantation loblolly at merchantable age'},
  postOak: {h: 12, note: 'a Cross Timbers post oak, which is short for an oak'},
  boisDArc: {h: 12, note: 'a fence-row bois d arc, usually topped by a century of hedging'},
  cottonwood: {h: 25, note: 'a plains cottonwood, which grows only where there is water'},
  baldCypress: {h: 30, note: 'a Hill Country river cypress, measured to the leader'},
  asheJuniper: {h: 8, note: 'a mature Ashe juniper, called cedar by everyone who lives near one'},
  crepeMyrtle: {h: 6, note: 'a town crepe myrtle, older and taller than people expect'},
  huisache: {h: 6, note: 'a huisache in the brush country'},
  sabalPalm: {h: 15, note: 'a Rio Grande sabal palm, the native one'},
  peachTree: {h: 4, note: 'an orchard peach, kept low so it can be picked from the ground'},
  citrusTree: {h: 4, note: 'a Valley grapefruit, kept round and low'},
  ocotillo: {h: 5, note: 'the tallest whips of a mature ocotillo'},
  yucca: {h: 2.6, note: 'a Torrey yucca to the top of the bloom stalk'},
  sotol: {h: 4.2, note: 'the bloom stalk, which is most of the plant s height and none of its bulk'},
  lechuguilla: {h: 0.5, note: 'a lechuguilla rosette, which is knee high and hurts'},
  sunflower: {h: 2, note: 'a roadside common sunflower after a wet spring'},
  sorghum: {h: 1.5, note: 'grain sorghum at heading'},
  cottonPlant: {h: 1.1, note: 'cotton at defoliation, before the stripper goes through'},
  cordgrass: {h: 1.5, note: 'smooth cordgrass in a coastal marsh'},
  bluestem: {h: 1.2, note: 'little bluestem in autumn, seed heads included'},
  bluebonnet: {h: 0.4, note: 'a bluebonnet spike, which is ankle high and photographs enormous'},
  paintbrush: {h: 0.4, note: 'Indian paintbrush, the same height as what it grows beside'},
  tumbleweed: {h: 0.7, note: 'Russian thistle, dried and detached'},
};

const fit = fitter(FLORA_M);

export interface FloraProps {
  x?: number;
  y?: number;
  scale?: number;
  seed?: number;
  /** 0 new, 1 dying. Trees spend it on dead limbs and thinned crowns. */
  wear?: number;
  facing?: 1 | -1;
  /**
   * SEASON IS HALF THE RECOGNITION. A Texas year is not four equal quarters and the
   * library should not pretend it is: 'spring' is the six weeks of wildflowers,
   * 'summer' is five months, 'fall' is the two weeks the grasses turn, and 'winter'
   * is brown with occasional ice. Default is summer because that is most of the year.
   */
  season?: 'spring' | 'summer' | 'fall' | 'winter';
}

/** A canopy mass drawn as OVERLAPPING LOBES rather than one blob.
 *
 *  This is the single technique that separates a tree from a lollipop. A real crown
 *  is a stack of limb-sized masses catching light at different angles, so the outline
 *  is bumpy and the interior has value changes. One ellipse has neither and reads as
 *  a shape with a stick under it, which is what a child draws and what a vector
 *  library reaches for unless told otherwise. */
const Canopy: React.FC<{
  seed: number; cx: number; cy: number; rx: number; ry: number;
  lobes?: number; fill: string; hi: string; lo: string; spread?: number;
}> = ({seed, cx, cy, rx, ry, lobes = 6, fill, hi, lo, spread = 0.62}) => {
  // ONE SILHOUETTE MADE OF LOBES, DRAWN THE SAME WAY THE BIOME'S OAK DRAWS ITS OWN.
  //
  // This component and `LimbedOak` in `lib/biomes.tsx` draw the SAME SPECIES, and a panel
  // read both in one frame and said so: the mid-ground oaks had splayed limbs and a
  // scalloped crown while the far treeline directly behind them was still an opaque blob.
  // A rebuild that reaches one of two call sites is the four-times-repeated fault of this
  // engine wearing a new hat, and the cure is that both files now use the same
  // construction rather than that somebody remembers to edit both.
  //
  // The construction: every lobe is drawn twice, once fat in ink underneath and once in
  // leaf colour on top. The ink pass leaves ONE continuous edge around the union of the
  // lobes and no rings inside it, so the crown reads as a single scalloped mass with
  // value changes in it rather than as a soft cloud or as a bag of circles. In a
  // thick-outline idiom a shape with no outline reads as fog, and the far treeline was
  // reading as fog.
  const strokeW = Math.max(1.6, rx * 0.075);
  const shapes: {x: number; y: number; rx: number; ry: number; fill: string}[] = [];
  for (let i = 0; i < lobes; i++) {
    const a = (i / lobes) * Math.PI * 2 + rnd(seed, i) * 0.9;
    const d = spread * (0.45 + rnd(seed, 20 + i) * 0.55);
    const ly = cy + Math.sin(a) * ry * d * 0.8;
    const lr = rx * (0.40 + rnd(seed, 40 + i) * 0.26);
    // Lobes above the centre catch the key, lobes below sit in the mass's own shade.
    const shade = ly < cy ? hi : lo;
    shapes.push({
      x: cx + Math.cos(a) * rx * d, y: ly,
      rx: lr, ry: lr * (0.72 + rnd(seed, 60 + i) * 0.3),
      fill: i % 3 === 0 ? shade : fill,
    });
  }
  // NO SOLID CENTRE. A filled ellipse under the lobes is what turned every crown in the
  // film into a dome: the lobes gave it an irregular edge and this gave it an opaque
  // middle, so at any scale under about 0.2 the lobes vanished into it and what survived
  // was a flat disc on a stick. Scorers called it a lollipop and lily pads on a stick
  // across four rounds. The two ties below are deliberately SMALLER than the lobes they
  // tie, because a tie wide enough to touch both sides is the solid centre again under
  // another name, which is the mistake this same paragraph had to be written about twice.
  for (let k = 0; k < 2; k++) {
    shapes.push({
      x: cx + (rnd(seed, 80 + k) - 0.5) * rx * 0.5,
      y: cy + (rnd(seed, 90 + k) - 0.5) * ry * 0.4,
      rx: rx * (0.22 + rnd(seed, 100 + k) * 0.10),
      ry: ry * (0.26 + rnd(seed, 110 + k) * 0.12),
      fill: k ? fill : hi,
    });
  }
  return (
    <g>
      {shapes.map((l, k) => (
        <ellipse key={`o${k}`} cx={l.x} cy={l.y} rx={l.rx} ry={l.ry}
          fill={INK} stroke={INK} strokeWidth={strokeW} strokeLinejoin="round" />
      ))}
      {shapes.map((l, k) => (
        <ellipse key={`f${k}`} cx={l.x} cy={l.y} rx={l.rx} ry={l.ry} fill={l.fill} />
      ))}
    </g>
  );
};

/** A limb that TAPERS. A stroked path is a constant-width tube, and a tree branch
 *  that does not narrow toward its tip is the second tell after the lollipop crown.
 *  Drawn as a filled quad so the taper is real geometry. */
const Limb: React.FC<{
  x1: number; y1: number; x2: number; y2: number; w1: number; w2: number; fill: string;
  bow?: number;
}> = ({x1, y1, x2, y2, w1, w2, fill, bow = 0}) => {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / len, ny = dx / len;
  const mx = (x1 + x2) / 2 + nx * bow, my = (y1 + y2) / 2 + ny * bow;
  return (
    <path fill={fill} d={
      `M${x1 + nx * w1},${y1 + ny * w1}` +
      ` Q${mx + nx * (w1 + w2) / 2},${my + ny * (w1 + w2) / 2} ${x2 + nx * w2},${y2 + ny * w2}` +
      ` L${x2 - nx * w2},${y2 - ny * w2}` +
      ` Q${mx - nx * (w1 + w2) / 2},${my - ny * (w1 + w2) / 2} ${x1 - nx * w1},${y1 - ny * w1} Z`
    } />
  );
};

// =============================================================================
// LIVE OAK — the tree of the Gulf, the Blackland yard and the Hill Country pasture.
//
// THE MISTAKE: drawn tall. A live oak is WIDER THAN IT IS TALL, by a lot, and the
// limbs go OUT before they go up. The big ones rest a limb on the ground and keep
// growing, and a cemetery or courthouse live oak usually has one propped or cabled.
//
// The second mistake is drawing it deciduous. It is evergreen and it is DARK, which
// is why a live oak in a summer pasture reads almost black against dry grass. It
// does drop and re-leaf in about three weeks in March and nobody outside Texas
// believes that, so it is not drawn here.
//
// `leaned` is the coastal form. The prevailing southeast wind off the Gulf shapes
// them permanently, so a Galveston or Rockport live oak is combed inland and a San
// Antonio one is not. Getting that backwards puts the frame on the wrong coast.
// =============================================================================
export const LiveOak: React.FC<FloraProps & {
  h?: number; leaned?: boolean; propped?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 3, wear = 0.3, facing = 1, season = 'summer',
       h = 120, leaned = false, propped = false}) => {
  const L = useLight();
  const K = fit('liveOak', h);
  // EVERGREEN. A live oak holds its leaf through the winter and its green is a dark
  // blue green, not the yellow green this was sharing with the grass under it.
  const t = tones(season === 'winter' ? '#263f36' : '#284439', L);
  const bark = tones('#5a4a3c', L);
  const lean = leaned ? 13 * facing : (rnd(seed, 1) - 0.5) * 5;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {/* the trunk is SHORT and thick and divides low. A live oak with three metres of
          clean trunk is an urban street tree that has been pruned up for traffic. */}
      <Limb x1={0} y1={0} x2={lean * 0.7} y2={-h * 0.25} w1={h * 0.085} w2={h * 0.070}
        fill={bark.core} />
      {/* THE LIVE OAK, BUILT TO THE SPEC A SCORER FINALLY WROTE DOWN.
          Four rounds called this a lollipop, then a recoloured mesquite, and each fix moved
          a lobe rather than the architecture. The four things that actually separate a live
          oak from every other tree in this library, all of them structural:

          ONE. IT IS WIDER THAN IT IS TALL. Spread runs 1.3 to 2 times height. This was
          taller than wide, which is the single reason it kept reading as somebody else's
          tree no matter what the crown did.
          TWO. THE TRUNK DIVIDES LOW, around a quarter of tree height, into three to five
          limbs of TRUNK-LIKE THICKNESS that run near horizontal and dip at the tips. Thin
          diverging stems of equal weight are a mesquite, which is exactly what a scorer
          said this was.
          THREE. FOLIAGE RIDES ALONG THE LIMBS in overlapping clumps, with sky at the crown
          edge. A pad capping the end of each stem is the broccoli this drew before.
          FOUR. IT IS EVERGREEN. Dark blue green all year, never the yellow green it was
          sharing with the grass it stands in. */}
      {Array.from({length: 4}, (_, i) => {
        // near horizontal, fanned across the full spread rather than radiating evenly
        const side = i % 2 === 0 ? -1 : 1;
        const rank = Math.floor(i / 2) / 1;
        const reach = h * (0.66 + rank * 0.30 + (rnd(seed, 30 + i) - 0.5) * 0.14) * side;
        const rise = -h * (0.10 + rank * 0.16 + rnd(seed, 40 + i) * 0.10);
        const x0 = lean * 0.7, y0 = -h * 0.25;
        const tipX = x0 + reach, tipY = y0 + rise;
        return (
          <g key={i}>
            {/* THE LIMB IS TRUNK-THICK AND DARK, not a pale armature. A scorer read the
                old thin tan limb as a stick and the crown as pads sitting on it, so the
                whole tree read as an African acacia. It carries the bark colour at real
                oak weight and dips, sagging under its own load and lifting at the tip. */}
            <Limb x1={x0} y1={y0} x2={tipX} y2={tipY}
              w1={h * 0.11} w2={h * 0.05} fill={bark.core}
              bow={Math.abs(reach) * 0.22} />
            {/* THE FOLIAGE IS A CONTINUOUS MASS RIDING THE WHOLE LIMB, NOT PADS ON THE END.
                Three separated clumps left the bare splay showing between them, which is the
                exact defect the spec names: a pad capping a stick. Five overlapping clumps
                that grow from near the fork to past the tip close over the limb into one
                lumpy crown edge, with sky only at the outer margin. Bigger, denser, and set
                lower over the limb so the mass sits ON the branch rather than floating. */}
            {[0.30, 0.48, 0.66, 0.83, 1.0].map((u, k) => (
              <Canopy key={k} seed={seed + i * 17 + k * 5}
                cx={x0 + reach * u}
                cy={y0 + rise * u - h * (0.02 + 0.05 * u) + Math.abs(reach) * 0.22 * (1 - Math.abs(2 * u - 1)) * 0.5}
                rx={h * (0.20 + 0.12 * u)} ry={h * (0.15 + 0.08 * u)}
                lobes={5} fill={t.core} hi={t.base} lo={t.shade} spread={0.72} />
            ))}
          </g>
        );
      })}
      {/* the interior over the fork, small, so the crown has a middle without a dome */}
      <Canopy seed={seed + 3} cx={lean * 0.5} cy={-h * 0.40} rx={h * 0.22} ry={h * 0.13}
        lobes={3} fill={t.core} hi={t.base} lo={t.shade} spread={0.6} />
      {propped && (
        /* the cedar prop under a resting limb. It is a real thing on a courthouse
           square tree and it says the town has been looking after this one. */
        <g>
          <rect x={h * 0.44} y={-h * 0.30} width={h * 0.022} height={h * 0.30}
            fill={bark.shade} />
          <rect x={h * 0.40} y={-h * 0.32} width={h * 0.10} height={h * 0.028}
            fill={bark.base} />
        </g>
      )}
      {wear > 0.5 && (
        /* one dead limb, bare, going the wrong way. Every old live oak has one. */
        <Limb x1={lean * 0.7} y1={-h * 0.32} x2={-h * 0.5} y2={-h * 0.78}
          w1={h * 0.014} w2={h * 0.004} fill={bark.shade} />
      )}
    </g>
  );
};

// =============================================================================
// PECAN — the state tree, and more importantly the tree in the yard.
//
// THE MISTAKE: drawn like an oak. A pecan is an UPRIGHT VASE. The limbs leave the
// trunk going up and outward at maybe forty degrees and the crown is taller than it
// is wide, which is the opposite of the live oak standing next to it. Two trees
// drawn with the same silhouette and different greens is the tell that a library has
// one tree in it.
//
// It is deciduous and it leafs out LATE, which is the piece of folk knowledge every
// Texas gardener has: don't plant until the pecans bud. So a spring pecan is bare
// while everything around it is green, and that is a real and drawable April frame.
//
// The nuts fall in November and the ground under a yard pecan is a hazard.
// =============================================================================
export const Pecan: React.FC<FloraProps & {h?: number; nuts?: boolean}> = ({
  x = 0, y = 0, scale = 1, seed = 4, wear = 0.3, facing = 1, season = 'summer',
  h = 200, nuts = false,
}) => {
  const L = useLight();
  const K = fit('pecan', h);
  const bare = season === 'winter' || season === 'spring';
  const t = tones(season === 'fall' ? '#b09a41' : '#6f8a49', L);
  const bark = tones('#6b5a4a', L);

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      <Limb x1={0} y1={0} x2={(rnd(seed, 1) - 0.5) * h * 0.03} y2={-h * 0.40}
        w1={h * 0.038} w2={h * 0.026} fill={bark.core} />
      {Array.from({length: 6}, (_, i) => {
        // THE VASE: every scaffold limb leaves at a STEEP angle. Spread across the
        // upper half of the compass and never below horizontal.
        const a = (-0.62 - (i / 5) * 0.56 + (rnd(seed, 10 + i) - 0.5) * 0.14) * Math.PI;
        const reach = h * (0.34 + rnd(seed, 30 + i) * 0.20);
        const bx = Math.cos(a) * reach;
        const by = -h * 0.40 + Math.sin(a) * reach;
        return (
          <g key={i}>
            <Limb x1={0} y1={-h * 0.40} x2={bx} y2={by} w1={h * 0.022} w2={h * 0.008}
              fill={bark.core} bow={reach * 0.06} />
            {/* the secondaries, which are what make a bare winter pecan read as a pecan
                rather than as a stick figure of a tree */}
            {bare && Array.from({length: 4}, (_, k) => (
              <Limb key={k} x1={bx * 0.6} y1={-h * 0.40 + (by + h * 0.40) * 0.6}
                x2={bx * (0.8 + k * 0.12)} y2={by - h * (0.04 + k * 0.05)}
                w1={h * 0.006} w2={h * 0.0018} fill={bark.shade} />
            ))}
            {!bare && (
              <Canopy seed={seed + i * 23} cx={bx} cy={by - h * 0.05}
                rx={h * 0.20} ry={h * 0.17} lobes={5}
                fill={t.core} hi={t.base} lo={t.shade} />
            )}
          </g>
        );
      })}
      {!bare && (
        <Canopy seed={seed + 91} cx={0} cy={-h * 0.68} rx={h * 0.40} ry={h * 0.34}
          lobes={8} fill={t.core} hi={t.base} lo={t.shade} spread={0.78} />
      )}
      {nuts && Array.from({length: 14}, (_, i) => (
        <ellipse key={i} cx={(rnd(seed, 70 + i) - 0.5) * h * 0.70}
          cy={-h * 0.004 - rnd(seed, 80 + i) * h * 0.012}
          rx={h * 0.009} ry={h * 0.006} fill="#5c4a33" />
      ))}
    </g>
  );
};

// =============================================================================
// LOBLOLLY PINE — the Piney Woods, and the reason East Texas has a paper industry.
//
// THE MISTAKE: drawn as a Christmas tree. A mature loblolly has NO LOWER LIMBS.
// The crown sits in the top quarter and everything below it is clean trunk, because
// a planted stand shades its own lower branches off. That bare-trunk proportion is
// the whole reason a Piney Woods frame reads as a corridor of verticals rather than
// as a forest of triangles, and it is the one thing every generic pine gets wrong.
//
// A YARD loblolly, grown open, keeps limbs further down. `open` draws that one.
// =============================================================================
export const Loblolly: React.FC<FloraProps & {h?: number; open?: boolean}> = ({
  x = 0, y = 0, scale = 1, seed = 5, wear = 0.3, facing = 1,
  h = 300, open = false,
}) => {
  const L = useLight();
  const K = fit('loblolly', h);
  const t = tones('#2f4a36', L);
  const bark = tones('#6a4f3e', L);
  const crownTop = open ? 0.52 : 0.24;   // fraction of height where limbs begin

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {/* THE TRUNK IS THE DRAWING. Straight, and it tapers over the whole length. */}
      <Limb x1={0} y1={0} x2={(rnd(seed, 1) - 0.5) * h * 0.02} y2={-h}
        w1={h * 0.021} w2={h * 0.005} fill={bark.core} />
      {Array.from({length: open ? 12 : 8}, (_, i) => {
        const f = i / (open ? 11 : 7);
        const ly = -h * (crownTop + f * (0.98 - crownTop));
        const side = i % 2 ? 1 : -1;
        const reach = h * (0.20 - f * 0.15) * (0.7 + rnd(seed, 10 + i) * 0.6);
        return (
          <g key={i}>
            <Limb x1={0} y1={ly} x2={side * reach} y2={ly - reach * 0.28}
              w1={h * 0.007} w2={h * 0.002} fill={bark.shade} />
            {/* needle mass: a loose tuft at the limb end, never a filled triangle */}
            <Canopy seed={seed + i * 13} cx={side * reach * 0.78} cy={ly - reach * 0.24}
              rx={reach * 0.62} ry={reach * 0.36} lobes={4}
              fill={t.core} hi={t.base} lo={t.shade} />
          </g>
        );
      })}
      <Canopy seed={seed + 77} cx={0} cy={-h * 0.94} rx={h * 0.09} ry={h * 0.07}
        lobes={4} fill={t.core} hi={t.base} lo={t.shade} />
    </g>
  );
};

// =============================================================================
// POST OAK — the Cross Timbers, which is the belt that stopped westward wagons.
//
// THE MISTAKE: drawn as a small live oak. A post oak is SHORT, THICK, CROOKED and
// DENSE, with a crown that looks chopped off flat on top and limbs that turn at hard
// angles rather than sweeping. It is the tree of a hot, poor, sandy site and it
// looks like it.
//
// THE WINTER TELL: post oak is MARCESCENT. It holds its dead brown leaves through
// winter instead of dropping them, so a January Cross Timbers hillside is rust and
// tan rather than grey. Almost nobody draws that and everybody who grew up in
// Palo Pinto or Erath county has looked at it every winter of their life.
// =============================================================================
export const PostOak: React.FC<FloraProps & {h?: number}> = ({
  x = 0, y = 0, scale = 1, seed = 6, wear = 0.35, facing = 1, season = 'summer',
  h = 110,
}) => {
  const L = useLight();
  const K = fit('postOak', h);
  const leaf = season === 'winter' ? '#8a6440'      // held dead leaves, not bare
    : season === 'fall' ? '#9a7a3e' : '#4f6a3c';
  const t = tones(leaf, L);
  const bark = tones('#544437', L);

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      <Limb x1={0} y1={0} x2={(rnd(seed, 1) - 0.5) * h * 0.08} y2={-h * 0.36}
        w1={h * 0.060} w2={h * 0.046} fill={bark.core} />
      {Array.from({length: 4}, (_, i) => {
        const a = (-0.24 - i * 0.34) * Math.PI;
        const r1 = h * 0.26;
        const jx = Math.cos(a) * r1, jy = -h * 0.36 + Math.sin(a) * r1 * 0.9;
        // THE HARD TURN. Post oak limbs elbow. Two segments at different angles, not
        // one bowed sweep, and that is the difference from the live oak above.
        const a2 = a - 0.30 + rnd(seed, 20 + i) * 0.6;
        const kx = jx + Math.cos(a2) * h * 0.22, ky = jy + Math.sin(a2) * h * 0.22;
        return (
          <g key={i}>
            <Limb x1={0} y1={-h * 0.36} x2={jx} y2={jy} w1={h * 0.030} w2={h * 0.018}
              fill={bark.core} />
            <Limb x1={jx} y1={jy} x2={kx} y2={ky} w1={h * 0.018} w2={h * 0.007}
              fill={bark.core} />
            <Canopy seed={seed + i * 29} cx={kx} cy={ky - h * 0.06} rx={h * 0.26}
              ry={h * 0.19} lobes={5} fill={t.core} hi={t.base} lo={t.shade} />
          </g>
        );
      })}
      {/* the flat top. A post oak crown is cut off level by wind and poor soil. */}
      <Canopy seed={seed + 51} cx={0} cy={-h * 0.72} rx={h * 0.46} ry={h * 0.20}
        lobes={7} fill={t.core} hi={t.base} lo={t.shade} spread={0.86} />
    </g>
  );
};

// =============================================================================
// BOIS D'ARC — the Blackland fence row, and a deep cut that lands hard.
//
// Osage orange. Planted in hedge rows across the Blackland Prairie before barbed
// wire, then topped for fence posts for a century, so the shape is a low mass of
// suckers on a butchered trunk rather than a tree. The posts outlast the fences and
// a rotten bois d'arc post is a genuinely hard thing to find.
//
// THE TELL: the horse apples. Green, softball-sized, bumpy, all over the ground in
// autumn, and every North Texas kid has thrown one. Nothing eats them. Drawing them
// on the ground is the recognition; drawing the tree without them is just a tree.
// =============================================================================
export const BoisDArc: React.FC<FloraProps & {h?: number; apples?: boolean}> = ({
  x = 0, y = 0, scale = 1, seed = 7, wear = 0.5, facing = 1, season = 'summer',
  h = 100, apples = true,
}) => {
  const L = useLight();
  const K = fit('boisDArc', h);
  const t = tones(season === 'fall' ? '#c2b048' : '#5d7a3e', L);
  const bark = tones('#6a5236', L);
  const bare = season === 'winter';

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {/* the topped trunk: short, fat, and cut flat where somebody took a post out */}
      <Limb x1={0} y1={0} x2={0} y2={-h * 0.30} w1={h * 0.070} w2={h * 0.062}
        fill={bark.core} />
      <ellipse cx={0} cy={-h * 0.30} rx={h * 0.062} ry={h * 0.016} fill={bark.shade} />
      {Array.from({length: 7}, (_, i) => {
        // suckers: a fan of near-vertical shoots off the cut, which is what a topped
        // tree does and what makes a hedge row look like a wall rather than a line
        const a = (-0.30 - (i / 6) * 0.40) * Math.PI;
        const reach = h * (0.44 + rnd(seed, 10 + i) * 0.34);
        const bx = Math.cos(a) * reach, by = -h * 0.30 + Math.sin(a) * reach;
        return (
          <g key={i}>
            <Limb x1={(rnd(seed, 40 + i) - 0.5) * h * 0.08} y1={-h * 0.30} x2={bx} y2={by}
              w1={h * 0.014} w2={h * 0.005} fill={bark.core} bow={reach * 0.08} />
            {!bare && (
              <Canopy seed={seed + i * 31} cx={bx} cy={by} rx={h * 0.19} ry={h * 0.15}
                lobes={4} fill={t.core} hi={t.base} lo={t.shade} />
            )}
          </g>
        );
      })}
      {apples && Array.from({length: 9}, (_, i) => {
        const ax = (rnd(seed, 60 + i) - 0.5) * h * 0.9;
        const ay = -h * 0.012 - rnd(seed, 70 + i) * h * 0.02;
        const r = h * 0.028;
        return (
          <g key={i}>
            <ellipse cx={ax} cy={ay} rx={r} ry={r * 0.92} fill="#9db44a" />
            {/* the bumps. A smooth green ball is a lime. */}
            {Array.from({length: 5}, (_, k) => (
              <circle key={k} cx={ax + (rnd(seed, 80 + i * 5 + k) - 0.5) * r * 1.2}
                cy={ay + (rnd(seed, 90 + i * 5 + k) - 0.5) * r} r={r * 0.22}
                fill="#8aa03c" />
            ))}
          </g>
        );
      })}
    </g>
  );
};

// =============================================================================
// COTTONWOOD — on the plains, a cottonwood MEANS WATER, and everybody knows it.
//
// A single big cottonwood on an otherwise treeless horizon is a creek, a spring or
// an old homestead well, and it is legible as such from miles away. That is why it
// is worth having: one drawing that tells a Panhandle audience there is water there
// without a word of narration.
//
// THE TELL: the leaves FLASH. A cottonwood leaf has a flattened stem, so the whole
// crown turns over silver in a breath of wind, and the sound is the other half of
// the memory. `flash` drives the silver, keyed off frame so it moves.
//
// In fall it goes hard yellow, which on the Canadian River breaks is the only colour
// for a hundred miles.
// =============================================================================
export const Cottonwood: React.FC<FloraProps & {
  h?: number; frame?: number; flash?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 8, wear = 0.3, facing = 1, season = 'summer',
       h = 220, frame = 0, flash = 0.35}) => {
  const L = useLight();
  const K = fit('cottonwood', h);
  const t = tones(season === 'fall' ? '#d8b23c' : '#7d9a4e', L);
  const bark = tones('#7a6a58', L);
  const bare = season === 'winter';
  // the turn-over, as a slow uneven pulse rather than a clean sine
  const gust = flash * (0.5 + 0.5 * Math.sin(frame / 17 + rnd(seed, 2) * 6))
                     * (0.6 + 0.4 * Math.sin(frame / 6.5));

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {/* deeply furrowed grey trunk, thick and often forked low */}
      <Limb x1={0} y1={0} x2={0} y2={-h * 0.34} w1={h * 0.048} w2={h * 0.034}
        fill={bark.core} />
      {Array.from({length: 5}, (_, i) => {
        const a = (-0.36 - (i / 4) * 0.48 + (rnd(seed, 10 + i) - 0.5) * 0.2) * Math.PI;
        const reach = h * (0.36 + rnd(seed, 30 + i) * 0.24);
        const bx = Math.cos(a) * reach, by = -h * 0.34 + Math.sin(a) * reach;
        return (
          <g key={i}>
            <Limb x1={0} y1={-h * 0.34} x2={bx} y2={by} w1={h * 0.024} w2={h * 0.008}
              fill={bark.core} bow={reach * 0.07} />
            {!bare && (
              <Canopy seed={seed + i * 19} cx={bx} cy={by - h * 0.04} rx={h * 0.24}
                ry={h * 0.20} lobes={5} fill={t.core} hi={t.base} lo={t.shade} />
            )}
          </g>
        );
      })}
      {!bare && (
        <>
          <Canopy seed={seed + 61} cx={0} cy={-h * 0.66} rx={h * 0.44} ry={h * 0.32}
            lobes={8} fill={t.core} hi={t.base} lo={t.shade} spread={0.8} />
          {/* THE FLASH: pale undersides showing where the gust has turned the crown */}
          {Array.from({length: 10}, (_, i) => (
            <ellipse key={i}
              cx={(rnd(seed, 100 + i) - 0.5) * h * 0.72}
              cy={-h * (0.46 + rnd(seed, 110 + i) * 0.42)}
              rx={h * 0.05} ry={h * 0.035} fill="#cfd8b0"
              opacity={Math.max(0, gust - rnd(seed, 120 + i) * 0.55) * 0.9} />
          ))}
        </>
      )}
    </g>
  );
};

// =============================================================================
// BALD CYPRESS — the Guadalupe, the Frio, the Comal, and every swimming hole.
//
// THE MISTAKE: drawn evergreen, because of the name and because it looks like a
// conifer. It is DECIDUOUS, and in November a Hill Country river is a line of rust
// orange running through grey limestone. That colour is a whole season of memory for
// anyone who has been to Garner or Landa Park.
//
// THE OTHER TELL: the KNEES. Woody cones pushing up out of the water and the bank
// around the base. Everyone who has waded a Hill Country river has barked a shin on
// one. A cypress without knees is a bald cypress somebody drew from a photograph of
// the top half.
//
// The base is BUTTRESSED, flaring wide at the water line.
// =============================================================================
export const BaldCypress: React.FC<FloraProps & {
  h?: number; knees?: number; waterY?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 9, wear = 0.3, facing = 1, season = 'summer',
       h = 260, knees = 6, waterY = 0}) => {
  const L = useLight();
  const K = fit('baldCypress', h);
  const t = tones(season === 'fall' ? '#b5623a' : season === 'spring' ? '#8fb069' : '#5f7a4a', L);
  const bark = tones('#7d6250', L);
  const bare = season === 'winter';

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {/* THE BUTTRESS. A straight-sided trunk to the ground is the tell. */}
      <path fill={bark.core} d={
        `M${-h * 0.085},0 Q${-h * 0.040},${-h * 0.10} ${-h * 0.026},${-h * 0.26}` +
        ` L${h * 0.026},${-h * 0.26} Q${h * 0.042},${-h * 0.10} ${h * 0.090},0 Z`} />
      <Limb x1={0} y1={-h * 0.24} x2={(rnd(seed, 1) - 0.5) * h * 0.02} y2={-h * 0.95}
        w1={h * 0.026} w2={h * 0.006} fill={bark.core} />
      {Array.from({length: 9}, (_, i) => {
        const f = i / 8;
        const ly = -h * (0.34 + f * 0.60);
        const side = i % 2 ? 1 : -1;
        const reach = h * (0.26 - f * 0.19) * (0.75 + rnd(seed, 10 + i) * 0.5);
        return (
          <g key={i}>
            <Limb x1={0} y1={ly} x2={side * reach} y2={ly - reach * 0.16}
              w1={h * 0.008} w2={h * 0.002} fill={bark.shade} />
            {!bare && (
              /* the foliage is FEATHERY and hangs, so the lobes sit BELOW the limb */
              <Canopy seed={seed + i * 23} cx={side * reach * 0.68} cy={ly + reach * 0.06}
                rx={reach * 0.60} ry={reach * 0.30} lobes={4}
                fill={t.core} hi={t.base} lo={t.shade} />
            )}
          </g>
        );
      })}
      {/* THE KNEES, in a ring around the base, none of them the same height */}
      {Array.from({length: knees}, (_, i) => {
        const kx = (rnd(seed, 50 + i) - 0.5) * h * 0.44;
        const kh = h * (0.02 + rnd(seed, 60 + i) * 0.045);
        return (
          <path key={i} fill={bark.shade} d={
            `M${kx - kh * 0.42},${waterY} Q${kx - kh * 0.30},${waterY - kh * 0.8} ${kx},${waterY - kh}` +
            ` Q${kx + kh * 0.30},${waterY - kh * 0.8} ${kx + kh * 0.42},${waterY} Z`} />
        );
      })}
    </g>
  );
};

// =============================================================================
// ASHE JUNIPER — called cedar by everybody, and blamed for everything.
//
// THE MISTAKE: drawn as a conical evergreen. An Ashe juniper is a ROUND, DENSE,
// MULTI-TRUNKED shrub-tree that branches at or below ground level, so it reads as a
// dark green mound with several stems going into it. A single-trunk cone is a
// nursery spruce.
//
// It is the darkest green in the Hill Country and the contrast against pale
// limestone and dry grass is what makes that region look like itself. Cedar fever
// is real, it peaks in December and January, and a male tree in pollen release
// visibly SMOKES when the wind hits it, which is drawable and which every Central
// Texan has watched with resentment.
// =============================================================================
export const AsheJuniper: React.FC<FloraProps & {
  h?: number; pollen?: boolean; frame?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 11, wear = 0.3, facing = 1,
       h = 90, pollen = false, frame = 0}) => {
  const L = useLight();
  const K = fit('asheJuniper', h);
  const t = tones('#3d5540', L);
  const bark = tones('#6b5340', L);

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {/* MULTI-TRUNKED at the ground. This is the whole identification. */}
      {Array.from({length: 3}, (_, i) => (
        <Limb key={i} x1={(i - 1) * h * 0.045} y1={0}
          x2={(i - 1) * h * 0.10 + (rnd(seed, i) - 0.5) * h * 0.06} y2={-h * 0.34}
          w1={h * 0.030} w2={h * 0.018} fill={bark.core} />
      ))}
      <Canopy seed={seed} cx={0} cy={-h * 0.58} rx={h * 0.40} ry={h * 0.40}
        lobes={9} fill={t.core} hi={t.base} lo={t.shade} spread={0.72} />
      <Canopy seed={seed + 41} cx={0} cy={-h * 0.34} rx={h * 0.34} ry={h * 0.22}
        lobes={6} fill={t.shade} hi={t.core} lo={t.shade} spread={0.8} />
      {pollen && (
        /* the smoke. Released in puffs when the wind moves the tree, drifting off in
           the light. Not a cloud around the whole crown. */
        Array.from({length: 5}, (_, i) => {
          const p = ((frame / 30 + rnd(seed, 70 + i) * 3) % 3) / 3;
          return (
            <ellipse key={i} cx={h * (0.1 + p * 0.9) + rnd(seed, 80 + i) * h * 0.2}
              cy={-h * (0.55 + rnd(seed, 90 + i) * 0.3) - p * h * 0.22}
              rx={h * (0.06 + p * 0.16)} ry={h * (0.04 + p * 0.10)}
              fill="#c8b48a" opacity={(1 - p) * 0.36} />
          );
        })
      )}
    </g>
  );
};

// =============================================================================
// CREPE MYRTLE — the tree of every Texas town, and nobody puts it in a drawing.
//
// It is in the median, the church parking lot, the bank drive-through and the front
// yard, in every town in the eastern two thirds of the state, and it blooms for a
// hundred days through the worst of the summer, which is exactly when nothing else
// does. That is why it is everywhere.
//
// THE TELLS: multiple smooth trunks that lean out from the base, mottled cinnamon
// bark that PEELS, and a bloom colour that is specific and slightly awful in the way
// people are fond of. Watermelon, lavender, or white.
//
// The other thing everyone recognises is crepe murder: topped back to knuckled
// stumps every February by somebody who was told to. `topped` draws that.
// =============================================================================
export const CrepeMyrtle: React.FC<FloraProps & {
  h?: number; bloom?: 'watermelon' | 'lavender' | 'white' | 'none'; topped?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 12, wear = 0.3, facing = 1, season = 'summer',
       h = 90, bloom = 'watermelon', topped = false}) => {
  const L = useLight();
  const K = fit('crepeMyrtle', h);
  const leaf = tones(season === 'fall' ? '#c2703a' : '#4f6f42', L);
  const bark = tones('#a08464', L);
  const bare = season === 'winter';
  const flower = bloom === 'lavender' ? '#9d78bd' : bloom === 'white' ? '#efe6dc' : '#cf5b86';
  const showBloom = bloom !== 'none' && season === 'summer' && !bare;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {Array.from({length: 4}, (_, i) => {
        const a = (-0.5 + (i - 1.5) * 0.10) * Math.PI;
        const top = topped ? h * 0.44 : h * 0.66;
        const bx = Math.cos(a) * top * 0.5, by = -top;
        return (
          <g key={i}>
            {/* the trunks LEAN OUT from a common base and are smooth, not furrowed */}
            <Limb x1={(i - 1.5) * h * 0.02} y1={0} x2={bx} y2={by}
              w1={h * 0.024} w2={h * 0.013} fill={bark.core} bow={h * 0.02} />
            {/* the peel: a patch of paler inner bark, which is the identification */}
            <ellipse cx={bx * 0.55} cy={by * 0.5} rx={h * 0.011} ry={h * 0.06}
              fill={bark.base} opacity={0.8} />
            {topped ? (
              <g>
                {/* the knuckle, and the whip growth off it */}
                <ellipse cx={bx} cy={by} rx={h * 0.030} ry={h * 0.022} fill={bark.shade} />
                {!bare && Array.from({length: 5}, (_, k) => (
                  <Limb key={k} x1={bx} y1={by} x2={bx + (k - 2) * h * 0.05}
                    y2={by - h * (0.14 + rnd(seed, k) * 0.08)}
                    w1={h * 0.004} w2={h * 0.001} fill={bark.shade} />
                ))}
              </g>
            ) : !bare && (
              <Canopy seed={seed + i * 27} cx={bx} cy={by - h * 0.08} rx={h * 0.20}
                ry={h * 0.16} lobes={5} fill={leaf.core} hi={leaf.base} lo={leaf.shade} />
            )}
          </g>
        );
      })}
      {showBloom && Array.from({length: topped ? 7 : 12}, (_, i) => {
        const bx = (rnd(seed, 40 + i) - 0.5) * h * (topped ? 0.5 : 0.74);
        const by = -h * ((topped ? 0.52 : 0.62) + rnd(seed, 50 + i) * 0.24);
        // a crepe myrtle bloom is a CONE of crinkled florets standing up off the twig
        return (
          <g key={i}>
            <path d={`M${bx},${by} l${h * 0.032},${h * 0.10} l${-h * 0.064},0 Z`}
              fill={flower} opacity={0.92} />
            <ellipse cx={bx} cy={by + h * 0.02} rx={h * 0.026} ry={h * 0.030}
              fill={flower} />
          </g>
        );
      })}
    </g>
  );
};

// =============================================================================
// HUISACHE — the brush country tree that turns orange for two weeks in February.
//
// Feathery like a mesquite and often mistaken for one at a distance, but it leafs
// out EARLIER and it blooms in ORANGE PUFFBALLS, thousands of them, and a South
// Texas fence line in late winter is the one time that country is not brown. The
// smell is the other half and cannot be drawn.
// =============================================================================
export const Huisache: React.FC<FloraProps & {h?: number}> = ({
  x = 0, y = 0, scale = 1, seed = 13, wear = 0.3, facing = 1, season = 'summer',
  h = 90,
}) => {
  const L = useLight();
  const K = fit('huisache', h);
  const t = tones('#6f8a52', L);
  const bark = tones('#4a3a2c', L);
  const blooming = season === 'winter' || season === 'spring';

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {Array.from({length: 3}, (_, i) => {
        const a = (-0.34 - i * 0.28) * Math.PI;
        const reach = h * (0.5 + rnd(seed, 10 + i) * 0.3);
        const bx = Math.cos(a) * reach, by = Math.sin(a) * reach;
        return (
          <g key={i}>
            <Limb x1={0} y1={0} x2={bx} y2={by} w1={h * 0.034} w2={h * 0.008}
              fill={bark.core} bow={reach * 0.10} />
            <Canopy seed={seed + i * 33} cx={bx} cy={by - h * 0.05} rx={h * 0.30}
              ry={h * 0.19} lobes={5} fill={t.core} hi={t.base} lo={t.shade} />
          </g>
        );
      })}
      <Canopy seed={seed} cx={0} cy={-h * 0.60} rx={h * 0.52} ry={h * 0.26}
        lobes={7} fill={t.core} hi={t.base} lo={t.shade} spread={0.8} />
      {blooming && Array.from({length: 26}, (_, i) => (
        <circle key={i} cx={(rnd(seed, 60 + i) - 0.5) * h * 1.0}
          cy={-h * (0.42 + rnd(seed, 70 + i) * 0.42)}
          r={h * 0.014} fill="#e08a2c" opacity={0.92} />
      ))}
    </g>
  );
};

// =============================================================================
// SABAL PALM — the NATIVE Valley palm, not the ones planted along a Houston street.
//
// THE MISTAKE: drawing a tall, slim, curved coconut palm, which is Florida and is
// not here. A Texas sabal is SHORT, THICK and STRAIGHT, with a heavy round crown of
// stiff fan fronds and, if it has never been trimmed, a SHAG of dead fronds hanging
// down the trunk. That skirt is the recognition. A clean trunk means somebody with a
// chainsaw has been up it, which is what happens on a resort and does not happen in
// a Rio Grande bottom.
//
// Fan fronds, not feather. The blade is a pleated half-circle on a long stem.
// =============================================================================
export const SabalPalm: React.FC<FloraProps & {h?: number; skirt?: boolean}> = ({
  x = 0, y = 0, scale = 1, seed = 14, wear = 0.35, facing = 1,
  h = 160, skirt = true,
}) => {
  const L = useLight();
  const K = fit('sabalPalm', h);
  const t = tones('#4f7048', L);
  const trunk = tones('#8a7358', L);
  const dead = tones('#8a6a45', L);

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {/* THICK and STRAIGHT. A sabal barely tapers. */}
      <Limb x1={0} y1={0} x2={(rnd(seed, 1) - 0.5) * h * 0.03} y2={-h * 0.72}
        w1={h * 0.060} w2={h * 0.052} fill={trunk.core} />
      {/* the old leaf bases: a criss-cross pattern up the trunk, the boot jack */}
      {Array.from({length: 9}, (_, i) => (
        <path key={i} d={`M${-h * 0.05},${-h * (0.08 + i * 0.07)} l${h * 0.10},${-h * 0.02}`}
          stroke={trunk.shade} strokeWidth={h * 0.006} fill="none" />
      ))}
      {skirt && Array.from({length: 11}, (_, i) => {
        const a = (i / 10 - 0.5) * Math.PI * 0.9;
        return (
          <path key={i} fill={dead.core} opacity={0.9} d={
            `M${Math.sin(a) * h * 0.04},${-h * 0.72}` +
            ` Q${Math.sin(a) * h * 0.16},${-h * 0.62} ${Math.sin(a) * h * 0.13},${-h * 0.46}` +
            ` L${Math.sin(a) * h * 0.06},${-h * 0.48} Z`} />
        );
      })}
      {/* FAN fronds: a pleated half disc on a stem, radiating from one point */}
      {Array.from({length: 13}, (_, i) => {
        const a = (i / 12 - 0.5) * Math.PI * 1.25 - Math.PI / 2;
        const r = h * (0.22 + rnd(seed, 20 + i) * 0.08);
        const ex = Math.cos(a) * r, ey = -h * 0.74 + Math.sin(a) * r;
        return (
          <g key={i}>
            <Limb x1={0} y1={-h * 0.74} x2={ex} y2={ey} w1={h * 0.006} w2={h * 0.003}
              fill={t.shade} />
            {Array.from({length: 7}, (_, k) => {
              const aa = a + (k - 3) * 0.14;
              const rr = r * (0.72 + rnd(seed, 40 + i * 7 + k) * 0.5);
              return (
                <path key={k} fill="none" stroke={k % 2 ? t.core : t.base}
                  strokeWidth={h * 0.008} strokeLinecap="round"
                  d={`M${ex},${ey} L${Math.cos(aa) * (r + rr)},${-h * 0.74 + Math.sin(aa) * (r + rr)}`} />
              );
            })}
          </g>
        );
      })}
    </g>
  );
};

// =============================================================================
// OCOTILLO — the Trans-Pecos plant that is not a cactus and is not dead.
//
// THE MISTAKE: drawn as a cactus, or drawn leafed and green all the time. Ocotillo
// is a bundle of BARE GREY WHIPS from a single crown at the ground, and it stands
// that way for most of the year. Within days of a rain it leafs out completely, and
// after a good spring the tips carry hard red flame-shaped flowers.
//
// So `leafed` is not decoration, it is a WEATHER REPORT: a leafed ocotillo says it
// rained here in the last two weeks. That is the kind of thing a Big Bend audience
// reads instantly and an outsider does not know is being said.
// =============================================================================
export const Ocotillo: React.FC<FloraProps & {
  h?: number; canes?: number; leafed?: boolean; blooming?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 15, wear = 0.3, facing = 1,
       h = 120, canes = 11, leafed = false, blooming = false}) => {
  const L = useLight();
  const K = fit('ocotillo', h);
  const t = tones('#6b7355', L);
  const green = tones('#7f9a52', L);

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {Array.from({length: canes}, (_, i) => {
        const f = (i / (canes - 1) - 0.5) * 2;              // -1..1 across the fan
        const lean = f * h * (0.24 + rnd(seed, i) * 0.12);
        const top = -h * (0.72 + rnd(seed, 20 + i) * 0.28);
        const d = `M0,0 Q${lean * 0.30},${top * 0.55} ${lean},${top}`;
        return (
          <g key={i}>
            <path d={d} stroke={t.core} strokeWidth={h * 0.020} fill="none"
              strokeLinecap="round" />
            {/* the whips are THORNED along their whole length, which is why the
                silhouette is furry rather than clean */}
            {Array.from({length: 9}, (_, k) => {
              const u = (k + 1) / 10;
              const px = lean * (0.30 * 2 * u * (1 - u) + u * u);
              const py = top * (0.55 * 2 * u * (1 - u) + u * u);
              return leafed ? (
                <ellipse key={k} cx={px + (f > 0 ? 1 : -1) * h * 0.012} cy={py}
                  rx={h * 0.016} ry={h * 0.009} fill={green.core} />
              ) : (
                <line key={k} x1={px} y1={py} x2={px + (f > 0 ? 1 : -1) * h * 0.014}
                  y2={py - h * 0.006} stroke={t.shade} strokeWidth={h * 0.004} />
              );
            })}
            {blooming && (
              <path d={`M${lean},${top} l${h * 0.014},${-h * 0.05} l${-h * 0.028},0 Z`}
                fill="#c9382f" />
            )}
          </g>
        );
      })}
    </g>
  );
};

// =============================================================================
// YUCCA — the rosette that stands where nothing else will.
//
// A ball of stiff sword leaves radiating from one point at the ground, with a thick
// creamy bloom panicle standing above it in spring. Torrey yucca builds a short
// woody trunk over decades, so an old one is a rosette on a stump with a beard of
// dead leaves hanging down. The dead skirt is worth drawing for the same reason the
// palm's is: it is what an untended one looks like.
// =============================================================================
export const Yucca: React.FC<FloraProps & {
  h?: number; leaves?: number; trunked?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 16, wear = 0.35, facing = 1, season = 'summer',
       h = 100, leaves = 22, trunked = false}) => {
  const L = useLight();
  const K = fit('yucca', h);
  const t = tones('#7d8a5c', L);
  const dead = tones('#8a6f4a', L);
  const trunkH = trunked ? h * 0.30 : 0;
  const blooming = season === 'spring';

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {trunked && (
        <>
          <Limb x1={0} y1={0} x2={0} y2={-trunkH} w1={h * 0.042} w2={h * 0.038}
            fill={dead.shade} />
          {Array.from({length: 10}, (_, i) => (
            <path key={i} d={`M${(rnd(seed, i) - 0.5) * h * 0.07},${-trunkH * (0.2 + i * 0.08)}
                              l${(rnd(seed, 20 + i) - 0.5) * h * 0.06},${h * 0.07}`}
              stroke={dead.core} strokeWidth={h * 0.010} fill="none" strokeLinecap="round" />
          ))}
        </>
      )}
      {Array.from({length: leaves}, (_, i) => {
        const a = (i / leaves) * Math.PI * 2;
        const droop = Math.abs(Math.cos(a)) * 0.35;         // outer leaves fall away
        const len = h * (0.28 + rnd(seed, 30 + i) * 0.10);
        const ex = Math.cos(a) * len;
        const ey = -trunkH + Math.sin(a) * len * 0.55 + droop * len * 0.5 - h * 0.10;
        return (
          <path key={i} fill={i % 4 === 0 ? t.base : t.core} d={
            `M0,${-trunkH} L${ex + Math.sin(a) * h * 0.015},${ey}` +
            ` L${ex},${ey + h * 0.006} L${ex - Math.sin(a) * h * 0.015},${ey} Z`} />
        );
      })}
      {blooming && (
        <g>
          <rect x={-h * 0.008} y={-h * 0.94 - trunkH} width={h * 0.016}
            height={h * 0.62} fill={t.shade} />
          {Array.from({length: 16}, (_, i) => {
            const f = i / 15;
            return (
              <ellipse key={i}
                cx={(rnd(seed, 60 + i) - 0.5) * h * 0.16 * (1 - f * 0.5)}
                cy={-h * (0.42 + f * 0.50) - trunkH}
                rx={h * 0.030 * (1 - f * 0.4)} ry={h * 0.024 * (1 - f * 0.4)}
                fill="#efe6d2" />
            );
          })}
        </g>
      )}
    </g>
  );
};

/** SOTOL — mistaken for yucca constantly, and different in one visible way: the
 *  leaves are thin RIBBONS with saw teeth along the edge, and they curl. The bloom
 *  stalk is absurd, five metres of thin pole with a narrow plume, and it stands dead
 *  for years afterward, which is why a Trans-Pecos hillside is dotted with bare poles.
 *  Those dead stalks are the recognition; drawing only live plants misses it. */
export const Sotol: React.FC<FloraProps & {h?: number; deadStalk?: boolean}> = ({
  x = 0, y = 0, scale = 1, seed = 17, wear = 0.4, facing = 1, season = 'summer',
  h = 100, deadStalk = false,
}) => {
  const L = useLight();
  const K = fit('sotol', h);
  const t = tones('#8a9a7a', L);              // GREY green, paler than yucca
  const dry = tones('#a89066', L);
  const stalk = deadStalk || season === 'fall' || season === 'winter';

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {Array.from({length: 30}, (_, i) => {
        const a = (i / 30) * Math.PI * 2 + rnd(seed, i) * 0.2;
        const len = h * (0.13 + rnd(seed, 30 + i) * 0.06);
        const curl = (rnd(seed, 60 + i) - 0.5) * len * 0.9;
        const ex = Math.cos(a) * len, ey = Math.sin(a) * len * 0.5 - h * 0.05;
        return (
          <path key={i} fill="none" stroke={i % 5 === 0 ? dry.core : t.core}
            strokeWidth={h * 0.006} strokeLinecap="round"
            d={`M0,${-h * 0.04} Q${ex * 0.6},${ey * 0.6} ${ex},${ey} q${curl * 0.3},${len * 0.2} ${curl},${len * 0.16}`} />
        );
      })}
      {stalk && (
        <g>
          <rect x={-h * 0.005} y={-h} width={h * 0.010} height={h * 0.94}
            fill={dry.core} />
          {Array.from({length: 22}, (_, i) => {
            const f = i / 21;
            return (
              <ellipse key={i} cx={(rnd(seed, 80 + i) - 0.5) * h * 0.05}
                cy={-h * (0.46 + f * 0.52)} rx={h * 0.016} ry={h * 0.011}
                fill={dry.base} opacity={deadStalk ? 0.7 : 1} />
            );
          })}
        </g>
      )}
    </g>
  );
};

/** LECHUGUILLA — knee high, and it is the reason you do not walk off a Big Bend trail
 *  in shorts. Each stiff leaf ends in a hard black spine at exactly shin height, and
 *  the plant grows in dense colonies. It is the INDICATOR SPECIES of the Chihuahuan
 *  Desert: where it grows, that is where the desert is, which makes it a small and
 *  precise way to put a frame in the Trans-Pecos and nowhere else. */
export const Lechuguilla: React.FC<FloraProps & {h?: number; heads?: number}> = ({
  x = 0, y = 0, scale = 1, seed = 18, wear = 0.3, facing = 1,
  h = 44, heads = 3,
}) => {
  const L = useLight();
  const K = fit('lechuguilla', h);
  const t = tones('#6f8a5e', L);

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {Array.from({length: heads}, (_, j) => {
        const ox = (rnd(seed, j) - 0.5) * h * 1.5;
        const oy = -(rnd(seed, 10 + j)) * h * 0.16;
        const s = 0.7 + rnd(seed, 20 + j) * 0.5;
        return (
          <g key={j} transform={`translate(${ox} ${oy}) scale(${s})`}>
            {Array.from({length: 11}, (_, i) => {
              const a = (i / 11) * Math.PI * 2;
              const len = h * (0.7 + rnd(seed, 30 + j * 11 + i) * 0.3);
              const ex = Math.cos(a) * len * 0.55;
              const ey = -Math.abs(Math.sin(a)) * len - h * 0.05;
              return (
                <g key={i}>
                  <path fill={i % 3 === 0 ? t.base : t.core} d={
                    `M0,0 L${ex + h * 0.05},${ey * 0.6} L${ex},${ey} L${ex - h * 0.05},${ey * 0.6} Z`} />
                  {/* THE SPINE. Black, hard, and the entire point of the plant. */}
                  <circle cx={ex} cy={ey} r={h * 0.03} fill={INK} />
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
};

// =============================================================================
// THE WILDFLOWER RIGHT OF WAY — six weeks a year, and the most photographed
// landscape in Texas.
//
// THE THING TO GET RIGHT, from FAUNA_AND_FLORA.md: a bluebonnet spike carries WHITE
// banner spots that turn MAGENTA after pollination, so a real spike shows BOTH on the
// same stalk. Drawing them all white is the tell.
//
// THE SECOND THING: they grow in SHEETS on highway right-of-way because of a mowing
// policy, not by accident, and they grow MIXED with Indian paintbrush. The image
// everybody carries is blue and red together with a fence line behind it, and a pure
// blue field is a calendar photograph rather than a memory.
//
// THE THIRD THING, which is the actual nostalgia: somebody's kid is sitting in them.
// This component draws the flowers. The scene puts the child there.
// =============================================================================
export const WildflowerVerge: React.FC<FloraProps & {
  w?: number; depth?: number; density?: number;
  mix?: {bluebonnet: number; paintbrush: number; coreopsis: number};
}> = ({x = 0, y = 0, scale = 1, seed = 19, w = 1080, depth = 190, density = 1,
       mix = {bluebonnet: 0.55, paintbrush: 0.28, coreopsis: 0.17}}) => {
  const L = useLight();
  const K = (FLORA_M.bluebonnet.h * M) / 40;   // local frame: 40 units to the spike top
  const n = Math.round(190 * density);
  const total = mix.bluebonnet + mix.paintbrush + mix.coreopsis;
  const grass = tones('#6f7d4a', L);

  return (
    <g transform={`translate(${x} ${y})`}>
      {Array.from({length: n}, (_, i) => {
        const u = rnd(seed, i);
        const v = Math.pow(rnd(seed, 500 + i), 0.7);       // more of them toward the front
        const px = (u - 0.5) * w;
        const py = v * depth;
        const s = K * scale * (0.55 + v * 0.85);
        const pick = rnd(seed, 1000 + i) * total;
        return (
          <g key={i} transform={`translate(${px} ${py}) scale(${s})`}>
            <line x1={0} y1={0} x2={(rnd(seed, 2000 + i) - 0.5) * 4} y2={-22}
              stroke={grass.core} strokeWidth={2.2} />
            {pick < mix.bluebonnet ? (
              /* THE SPIKE: a stack of florets narrowing to the top, with the white
                 banners on the UPPER unpollinated ones and magenta below. */
              Array.from({length: 7}, (_, k) => {
                const f = k / 6;
                const fy = -22 - k * 3.1;
                return (
                  <g key={k}>
                    <ellipse cx={0} cy={fy} rx={5.6 * (1 - f * 0.55)} ry={3.0 * (1 - f * 0.4)}
                      fill="#3b5fa8" />
                    <circle cx={0} cy={fy} r={1.5 * (1 - f * 0.4)}
                      fill={k < 3 ? '#b03a6a' : '#f2ece2'} />
                  </g>
                );
              })
            ) : pick < mix.bluebonnet + mix.paintbrush ? (
              /* PAINTBRUSH: the colour is in BRACTS, so it reads as a ragged flame
                 rather than as petals, and it is orange-scarlet not pure red. */
              Array.from({length: 6}, (_, k) => (
                <path key={k} fill="#d1452b"
                  d={`M0,${-22 - k * 3.4} l${(k % 2 ? 5 : -5)},-3 l1,5 Z`} />
              ))
            ) : (
              /* COREOPSIS, which comes in after the bluebonnets and holds the ditches
                 into June. Yellow with a dark centre. */
              <g>
                {Array.from({length: 8}, (_, k) => {
                  const a = (k / 8) * Math.PI * 2;
                  return (
                    <ellipse key={k} cx={Math.cos(a) * 4} cy={-24 + Math.sin(a) * 4}
                      rx={2.6} ry={1.8} transform={`rotate(${(a * 180) / Math.PI} 0 -24)`}
                      fill="#e8bb2e" />
                  );
                })}
                <circle cx={0} cy={-24} r={2} fill="#8a4a2a" />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};

/** A single bluebonnet spike, for when one is the subject rather than a field.
 *  Same banner rule: white on top, magenta below, on the same stalk. */
export const Bluebonnet: React.FC<FloraProps & {h?: number}> = ({
  x = 0, y = 0, scale = 1, seed = 20, facing = 1, h = 40,
}) => {
  const L = useLight();
  const K = fit('bluebonnet', h);
  const t = tones('#6f7d4a', L);
  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {/* PALMATE leaves, which is the other half of the identification */}
      {Array.from({length: 2}, (_, j) => (
        <g key={j} transform={`translate(${(j - 0.5) * h * 0.24} ${-h * 0.10})`}>
          {Array.from({length: 5}, (_, k) => {
            const a = (-0.15 - k * 0.18) * Math.PI;
            return (
              <ellipse key={k} cx={Math.cos(a) * h * 0.10} cy={Math.sin(a) * h * 0.10}
                rx={h * 0.055} ry={h * 0.022}
                transform={`rotate(${(a * 180) / Math.PI} ${Math.cos(a) * h * 0.10} ${Math.sin(a) * h * 0.10})`}
                fill={t.core} />
            );
          })}
        </g>
      ))}
      <line x1={0} y1={0} x2={0} y2={-h * 0.5} stroke={t.shade} strokeWidth={h * 0.045} />
      {Array.from({length: 9}, (_, k) => {
        const f = k / 8;
        const fy = -h * (0.5 + f * 0.48);
        return (
          <g key={k}>
            <ellipse cx={(rnd(seed, k) - 0.5) * h * 0.03} cy={fy}
              rx={h * 0.14 * (1 - f * 0.55)} ry={h * 0.075 * (1 - f * 0.4)} fill="#3b5fa8" />
            <circle cx={0} cy={fy} r={h * 0.038 * (1 - f * 0.4)}
              fill={k < 4 ? '#b03a6a' : '#f2ece2'} />
          </g>
        );
      })}
    </g>
  );
};

// =============================================================================
// THE GRASSES. Three of them, and they carry more of the ground than any tree.
// =============================================================================

/** LITTLE BLUESTEM — the native prairie grass, and the reason an untouched Blackland
 *  or Cross Timbers field in November is RUST ORANGE with silver seed heads catching
 *  the low sun. That colour is the single most beautiful thing the Texas year does
 *  and it lasts about three weeks. A green-all-year grass layer throws it away. */
export const Bluestem: React.FC<FloraProps & {
  w?: number; depth?: number; density?: number; frame?: number; wind?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 21, season = 'fall',
       w = 1080, depth = 170, density = 1, frame = 0, wind = 0.5}) => {
  const L = useLight();
  const K = fit('bluestem', 60);
  const base = season === 'fall' ? '#b06a3c' : season === 'winter' ? '#a89066'
    : season === 'spring' ? '#7d9a58' : '#8a9a5e';
  const t = tones(base, L);
  const n = Math.round(230 * density);

  return (
    <g transform={`translate(${x} ${y})`}>
      {Array.from({length: n}, (_, i) => {
        const u = rnd(seed, i), v = Math.pow(rnd(seed, 500 + i), 0.7);
        const s = K * scale * (0.5 + v * 0.9);
        const sway = Math.sin(frame / 13 + rnd(seed, 900 + i) * 7) * wind * 9;
        return (
          <g key={i} transform={`translate(${(u - 0.5) * w} ${v * depth}) scale(${s})`}>
            {Array.from({length: 4}, (_, k) => (
              <path key={k} fill="none" strokeLinecap="round"
                stroke={k === 3 && season === 'fall' ? '#e0d2b4' : t.core}
                strokeWidth={2.4}
                d={`M0,0 q${(k - 1.5) * 5 + sway * 0.4},-26 ${(k - 1.5) * 11 + sway},-52`} />
            ))}
          </g>
        );
      })}
    </g>
  );
};

/** CORDGRASS — the coastal marsh, in a band. Stiff, upright, uniform, and it goes
 *  right to the water in a hard edge because it is what holds the mud. */
export const Cordgrass: React.FC<FloraProps & {
  w?: number; depth?: number; density?: number; frame?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 22, season = 'summer',
       w = 1080, depth = 130, density = 1, frame = 0}) => {
  const L = useLight();
  const K = fit('cordgrass', 60);
  const t = tones(season === 'winter' ? '#a89a70' : '#8a9a63', L);
  const n = Math.round(260 * density);

  return (
    <g transform={`translate(${x} ${y})`}>
      {Array.from({length: n}, (_, i) => {
        const u = rnd(seed, i), v = Math.pow(rnd(seed, 500 + i), 0.65);
        const s = K * scale * (0.55 + v * 0.8);
        const lean = Math.sin(frame / 21 + v * 3) * 4;
        return (
          <g key={i} transform={`translate(${(u - 0.5) * w} ${v * depth}) scale(${s})`}>
            {Array.from({length: 3}, (_, k) => (
              <path key={k} fill="none" stroke={t.core} strokeWidth={2.8} strokeLinecap="round"
                d={`M0,0 q${(k - 1) * 4 + lean},-24 ${(k - 1) * 9 + lean * 1.6},-46`} />
            ))}
          </g>
        );
      })}
    </g>
  );
};

/** A single grass TUFT for the mid ground, where a field of blades is too much paint.
 *  Buffalo grass in the short-grass country, bunched and grey-green. */
export const GrassTuft: React.FC<FloraProps & {h?: number; blades?: number}> = ({
  x = 0, y = 0, scale = 1, seed = 23, season = 'summer', h = 30, blades = 9,
}) => {
  const L = useLight();
  const K = fit('bluestem', 60) * (h / 30);
  const t = tones(season === 'winter' ? '#a89066' : season === 'fall' ? '#b08a52' : '#8a9a63', L);
  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      {Array.from({length: blades}, (_, i) => {
        const f = (i / (blades - 1) - 0.5) * 2;
        return (
          <path key={i} fill="none" stroke={i % 3 === 0 ? t.base : t.core} strokeWidth={2.2}
            strokeLinecap="round"
            d={`M0,0 q${f * 8},-14 ${f * 18 + (rnd(seed, i) - 0.5) * 6},-${20 + rnd(seed, 20 + i) * 14}`} />
        );
      })}
    </g>
  );
};

// =============================================================================
// THE CROPS. Two, and they are what makes a field READ as a specific place.
// =============================================================================

/** GRAIN SORGHUM, called milo, and the reason a Panhandle or Coastal Bend field is
 *  not a corn field. The head is a dense RED BROWN club standing above the leaves,
 *  and a field of it at heading is a rust-coloured plane, which nobody expects and
 *  everybody from Hereford to Corpus recognises instantly. */
export const Sorghum: React.FC<FloraProps & {
  w?: number; depth?: number; rows?: number; frame?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 24, w = 1080, depth = 200, rows = 9, frame = 0}) => {
  const L = useLight();
  const K = fit('sorghum', 56);
  const leaf = tones('#5f7a3e', L);
  const head = tones('#a2472c', L);

  return (
    <g transform={`translate(${x} ${y})`}>
      {Array.from({length: rows}, (_, r) => {
        const v = r / (rows - 1);
        const ry = Math.pow(v, 1.5) * depth;
        const s = K * scale * (0.42 + v * 0.9);
        const per = Math.round(16 + v * 16);
        return (
          <g key={r} transform={`translate(0 ${ry}) scale(${s})`}>
            {Array.from({length: per}, (_, i) => {
              const px = ((i / (per - 1)) - 0.5) * (w / s);
              const sway = Math.sin(frame / 16 + i * 0.6 + r) * 2.4;
              return (
                <g key={i} transform={`translate(${px} 0)`}>
                  <line x1={0} y1={0} x2={sway} y2={-42} stroke={leaf.core} strokeWidth={3} />
                  {Array.from({length: 3}, (_, k) => (
                    <path key={k} fill="none" stroke={leaf.base} strokeWidth={2.6}
                      d={`M${sway * (k / 3)},${-12 - k * 10} q${k % 2 ? 11 : -11},4 ${k % 2 ? 17 : -17},14`} />
                  ))}
                  <ellipse cx={sway} cy={-50} rx={5} ry={9} fill={head.core} />
                  <ellipse cx={sway - 1.4} cy={-52} rx={2.6} ry={6} fill={head.base} />
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
};

/** COTTON at defoliation, which is what a Texas cotton field looks like in the photo
 *  everybody has: brown sticks, white bolls, and the ground already showing through.
 *  Green leafy cotton exists for two months and nobody photographs it. The module
 *  draws the picked-over stage because that is the one that is remembered. */
export const CottonField: React.FC<FloraProps & {
  w?: number; depth?: number; rows?: number; opened?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 25, w = 1080, depth = 210, rows = 10, opened = 0.8}) => {
  const L = useLight();
  const K = fit('cottonPlant', 40);
  const stem = tones('#7a5a3c', L);

  return (
    <g transform={`translate(${x} ${y})`}>
      {Array.from({length: rows}, (_, r) => {
        const v = r / (rows - 1);
        const ry = Math.pow(v, 1.5) * depth;
        const s = K * scale * (0.40 + v * 0.9);
        const per = Math.round(20 + v * 18);
        return (
          <g key={r} transform={`translate(0 ${ry}) scale(${s})`}>
            {Array.from({length: per}, (_, i) => {
              const px = ((i / (per - 1)) - 0.5) * (w / s);
              const sd = seed + r * 97 + i;
              return (
                <g key={i} transform={`translate(${px} 0)`}>
                  <line x1={0} y1={0} x2={0} y2={-30} stroke={stem.core} strokeWidth={2.6} />
                  {Array.from({length: 4}, (_, k) => {
                    const bx = (k % 2 ? 1 : -1) * (5 + k * 2);
                    const by = -10 - k * 6;
                    return (
                      <g key={k}>
                        <line x1={0} y1={by + 3} x2={bx} y2={by} stroke={stem.shade}
                          strokeWidth={1.8} />
                        {rnd(sd, k) < opened ? (
                          /* THE BOLL: four fluffed lobes, not a cotton ball. The burr
                             underneath stays brown and open like a star. */
                          <g>
                            <path d={`M${bx},${by + 4} l4,-3 l-1,5 Z M${bx},${by + 4} l-4,-3 l1,5 Z`}
                              fill="#6b4a30" />
                            {Array.from({length: 4}, (_, q) => (
                              <ellipse key={q} cx={bx + (q - 1.5) * 2.1} cy={by - 1.4}
                                rx={2.6} ry={2.9} fill="#f0ece2" />
                            ))}
                          </g>
                        ) : (
                          <ellipse cx={bx} cy={by} rx={2.4} ry={3} fill="#5f7a3e" />
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
};

/** A PEACH or CITRUS orchard row: low round crowns in a line, which is a shape that
 *  reads as agriculture from any distance. Hill Country peaches around Stonewall and
 *  Fredericksburg, Valley citrus around Mission and Weslaco, and the difference on
 *  screen is the fruit colour and the ground under it. */
export const OrchardRow: React.FC<FloraProps & {
  w?: number; depth?: number; rows?: number; crop?: 'peach' | 'citrus'; fruit?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 26, w = 1080, depth = 200, rows = 5,
       crop = 'peach', fruit = true}) => {
  const L = useLight();
  const K = fit(crop === 'peach' ? 'peachTree' : 'citrusTree', 70);
  const t = tones(crop === 'peach' ? '#5f7a45' : '#385a38', L);
  const bark = tones('#5a4433', L);
  const fruitFill = crop === 'peach' ? '#e08a52' : '#e8c33c';

  return (
    <g transform={`translate(${x} ${y})`}>
      {Array.from({length: rows}, (_, r) => {
        const v = r / (rows - 1);
        const ry = Math.pow(v, 1.4) * depth;
        const s = K * scale * (0.45 + v * 0.85);
        const per = Math.round(6 + v * 6);
        return (
          <g key={r} transform={`translate(0 ${ry}) scale(${s})`}>
            {Array.from({length: per}, (_, i) => {
              const px = ((i / (per - 1)) - 0.5) * (w / s);
              const sd = seed + r * 53 + i;
              return (
                <g key={i} transform={`translate(${px} 0)`}>
                  <Limb x1={0} y1={0} x2={0} y2={-22} w1={4} w2={3.4} fill={bark.core} />
                  <Canopy seed={sd} cx={0} cy={-46} rx={30} ry={26} lobes={5}
                    fill={t.core} hi={t.base} lo={t.shade} />
                  {fruit && Array.from({length: 6}, (_, k) => (
                    <circle key={k} cx={(rnd(sd, 30 + k) - 0.5) * 46}
                      cy={-46 + (rnd(sd, 40 + k) - 0.5) * 36} r={3.2} fill={fruitFill} />
                  ))}
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
};

/** THE ROADSIDE SUNFLOWER. Common sunflower, not the cultivated one: smaller heads,
 *  many per plant, and it takes over a bar ditch after a wet spring. The heads on one
 *  plant DO NOT all face the same way once they are mature, which is the correction to
 *  the folk belief, but a whole stand does lean east in the morning. */
export const Sunflower: React.FC<FloraProps & {h?: number; heads?: number}> = ({
  x = 0, y = 0, scale = 1, seed = 27, facing = 1, h = 70, heads = 5,
}) => {
  const L = useLight();
  const K = fit('sunflower', h);
  const t = tones('#5f7a45', L);
  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      <line x1={0} y1={0} x2={(rnd(seed, 1) - 0.5) * h * 0.1} y2={-h * 0.86}
        stroke={t.shade} strokeWidth={h * 0.035} />
      {Array.from({length: heads}, (_, i) => {
        const f = i / Math.max(1, heads - 1);
        const hx = (rnd(seed, 10 + i) - 0.5) * h * 0.44;
        const hy = -h * (0.44 + f * 0.50);
        return (
          <g key={i}>
            <line x1={0} y1={hy + h * 0.10} x2={hx} y2={hy} stroke={t.core}
              strokeWidth={h * 0.018} />
            {Array.from({length: 11}, (_, k) => {
              const a = (k / 11) * Math.PI * 2;
              return (
                <ellipse key={k} cx={hx + Math.cos(a) * h * 0.055}
                  cy={hy + Math.sin(a) * h * 0.055} rx={h * 0.036} ry={h * 0.017}
                  transform={`rotate(${(a * 180) / Math.PI} ${hx + Math.cos(a) * h * 0.055} ${hy + Math.sin(a) * h * 0.055})`}
                  fill="#e8bb2e" />
              );
            })}
            <circle cx={hx} cy={hy} r={h * 0.038} fill="#6b4a2a" />
          </g>
        );
      })}
      {Array.from({length: 4}, (_, i) => (
        <path key={i} fill={t.core}
          d={`M0,${-h * (0.16 + i * 0.14)} q${(i % 2 ? 1 : -1) * h * 0.14},${h * 0.02} ${(i % 2 ? 1 : -1) * h * 0.20},${h * 0.10} q${(i % 2 ? -1 : 1) * h * 0.10},${-h * 0.06} ${(i % 2 ? -1 : 1) * h * 0.20},${-h * 0.10} Z`} />
      ))}
    </g>
  );
};

/** TUMBLEWEED — Russian thistle, and the honest note is that it is an INVASIVE that
 *  arrived in the 1870s in contaminated flax seed. It is the most over-used shorthand
 *  for the West and it is also genuinely what piles four feet deep against a Panhandle
 *  fence after a norther, which is a real problem and a real memory. So it is here,
 *  and a scene that uses it as a joke about emptiness is using it wrong. */
export const Tumbleweed: React.FC<FloraProps & {
  h?: number; frame?: number; rolling?: boolean; travel?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 28, h = 40, frame = 0, rolling = false, travel = 320}) => {
  const L = useLight();
  const K = fit('tumbleweed', h);
  const t = tones('#b09a72', L);
  // A tumbleweed does not roll smoothly. It BOUNCES, catching and releasing.
  const p = rolling ? ((frame / 30) * 0.55 + rnd(seed, 1)) % 1 : 0;
  const bounce = rolling ? Math.abs(Math.sin(p * Math.PI * 7)) * h * 0.34 : 0;
  const spin = rolling ? p * 720 : rnd(seed, 2) * 360;

  return (
    <g transform={`translate(${x + p * travel} ${y - bounce}) scale(${K * scale}) rotate(${spin})`}>
      {Array.from({length: 26}, (_, i) => {
        const a = rnd(seed, 10 + i) * Math.PI * 2;
        const r = h * (0.24 + rnd(seed, 40 + i) * 0.26);
        const a2 = a + (rnd(seed, 70 + i) - 0.5) * 1.6;
        const r2 = r * (0.5 + rnd(seed, 90 + i) * 0.6);
        return (
          <path key={i} fill="none" stroke={i % 4 === 0 ? t.base : t.core}
            strokeWidth={h * 0.022} strokeLinecap="round"
            d={`M${Math.cos(a) * r * 0.2},${Math.sin(a) * r * 0.2}` +
               ` Q${Math.cos(a) * r},${Math.sin(a) * r}` +
               ` ${Math.cos(a2) * r2 + Math.cos(a) * r * 0.5},${Math.sin(a2) * r2 + Math.sin(a) * r * 0.5}`} />
        );
      })}
    </g>
  );
};
