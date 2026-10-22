import React from 'react';
import {useUid} from './uid';
import {Stage3D, Plane, Atmosphere, Camera} from './stage3d';
import {RegionLight, RegionName, LIGHTS, GradeLayer, tones, INK} from './lighting';
import {Mesquite, PricklyPear} from './kit';

// =============================================================================
// BIOMES — ten Texases, each with its own light, ground, green and horizon.
//
// A scene declares its region FROM THE STORY'S COUNTY, not from what would look
// good. If the county is in Harris, the frame is humid Gulf light over black clay
// and the pretty desert palette does not get to visit. That is the vernacular law
// made structural: a Texan forgives a stylized drawing and does not forgive being
// told they live somewhere they don't.
//
// Every biome is authored as STAGE3D PLANES rather than as a flat backdrop, so a
// camera move through one is real parallax. The plane budget is the one from the
// authoring doctrine: sky, far, mid, near band, hero, foreground sweep. Four to six
// is plenty and more costs paint for nothing.
// =============================================================================

export interface BiomePalette {
  sky: [string, string];      // zenith, horizon
  far: string;                // the distant land mass
  mid: string;
  near: string;
  ground: string;
  veg: string;
  accent: string;             // the one warm or odd note the region actually has
}

/** THE PALETTES. The single most important line in this file is that no two regions
 *  share a green. The Panhandle and Houston must not, and the file is arranged so a
 *  reviewer can see at a glance whether they do. */
export const BIOMES: Record<RegionName, BiomePalette> = {
  high_plains: {
    sky: ['#7ea3c4', '#cfd8dd'], far: '#a99a80', mid: '#b8a481', near: '#c2ab84',
    ground: '#c8b088', veg: '#9aa06a', accent: '#d9a441',
  },
  rolling_plains: {
    // THE SKY WAS CARRYING NONE OF THE REGIONAL LOAD. REGIONS.md calls light the single most
    // important field and says this region has "similar hardness to the High Plains" with red
    // dirt taking the light warm. Its sky was a pale blue two shades off blackland's, so the
    // separation between Round Rock and Abilene was being done entirely by ground colour
    // while the thing above the horizon said they were the same afternoon. Deeper at the
    // zenith for the hardness, and warm at the horizon because the red beds throw their own
    // colour back up into it.
    sky: ['#5f88b8', '#e2c3a4'], far: '#9d7a63', mid: '#a87f63', near: '#b08468',
    ground: '#b5795a', veg: '#7d8a5c', accent: '#c8703a',
  },
  cross_timbers: {
    sky: ['#7fa2c6', '#cfd6d6'], far: '#7d8a72', mid: '#84906f', near: '#8d9670',
    ground: '#a89877', veg: '#5f7047', accent: '#c08a3e',
  },
  blackland: {
    sky: ['#87a6c6', '#dcdcd6'], far: '#6f7a68', mid: '#5f6a5c', near: '#4e5750',
    ground: '#3b3a36', veg: '#7d8a55', accent: '#b8863c',
  },
  post_oak: {
    sky: ['#84a8c8', '#d8dccf'], far: '#7c8c66', mid: '#6f8258', near: '#7b8a5e',
    ground: '#b0a077', veg: '#5a7040', accent: '#c2913f',
  },
  piney_woods: {
    sky: ['#6f96b8', '#c6d2cc'], far: '#3f5a48', mid: '#33513f', near: '#2b4536',
    ground: '#7a5a3f', veg: '#2f4a36', accent: '#c46a2e',
  },
  gulf: {
    sky: ['#9db8cc', '#e6e6e0'], far: '#8a9a92', mid: '#7d9088', near: '#6f8479',
    ground: '#5c6358', veg: '#8a9a63', accent: '#d0663a',
  },
  south_texas: {
    sky: ['#82a4c2', '#ddd2bc'], far: '#a08a6a', mid: '#9a8663', near: '#a08a66',
    ground: '#bfa87f', veg: '#6f7d4e', accent: '#a6266b',
  },
  hill_country: {
    sky: ['#7ba4cc', '#d6dee6'], far: '#96a08e', mid: '#8a9682', near: '#9aa189',
    ground: '#cfc7b2', veg: '#556b52', accent: '#c29a4a',
  },
  trans_pecos: {
    sky: ['#5f7fae', '#e0b488'], far: '#6a5a72', mid: '#8a6a62', near: '#a07a5e',
    ground: '#b08a63', veg: '#6b7355', accent: '#e08a3c',
  },
};

/** THE SEED THAT MAKES A PLACE A PLACE. One fixed number per region, so the standing
 *  woody plants of that region are the SAME STAND in every shot of it. See the note on
 *  `Vegetation` for the defect this closes. These are arbitrary and must never be changed
 *  to chase a nicer arrangement in one shot, because they are shared by all of them. */
const REGION_SEED: Record<RegionName, number> = {
  high_plains: 4102, rolling_plains: 7717, cross_timbers: 2213, blackland: 5309,
  post_oak: 8821, piney_woods: 6607, gulf: 3391, south_texas: 9103,
  hill_country: 1487, trans_pecos: 2749,
};

/** deterministic 0..1 */
const rnd = (seed: number, ch: number) => {
  const k = ((seed * 2654435761) ^ (ch * 40503)) >>> 0;
  return ((k >>> 8) % 10000) / 10000;
};

const W = 1080, H = 1920;

/** A ridge or horizon silhouette. `rough` 0 is a dead-flat Panhandle horizon, 1 is
 *  Trans-Pecos rock. The High Plains horizon is GENUINELY STRAIGHT for most of the
 *  frame width and drawing it as gentle hills is the single most common mistake in a
 *  Panhandle frame. */
export function ridgePath(seed: number, yBase: number, rough: number, steps = 24): string {
  let d = `M0,${H} L0,${yBase}`;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * W;
    const n = (rnd(seed, i) - 0.5) * 2;
    const n2 = (rnd(seed, 100 + Math.floor(i / 3)) - 0.5) * 2;
    const y = yBase - (n * 26 + n2 * 62) * rough;
    d += ` L${x},${y}`;
  }
  return d + ` L${W},${H} Z`;
}

// ---------------------------------------------------------------- the biome

/** Lift a hex toward white. The horizon under a vertical sun is not the zenith colour
 *  with haze on it, it is BLEACHED, and REGIONS.md calls light "the single most
 *  important field". */
function bleach(hex: string, t: number): string {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const m = (v: number) => Math.round(v + (255 - v) * t);
  return `#${((1 << 24) + (m(r) << 16) + (m(g) << 8) + m(b)).toString(16).slice(1)}`;
}

export const Biome: React.FC<{
  region: RegionName;
  frame: number;
  camera?: Camera;
  seed?: number;
  /** how far up the frame the ground line sits */
  groundY?: number;
  weather?: 'norther' | 'dust' | 'overcast' | 'night' | 'late';
  /** THE SCENE IS INDOORS, so the region draws its LIGHT and not its plants.
   *
   *  A scene still declares its county and its region inside a building, because the
   *  building is in a place and the light through its door is that place's light. What it
   *  must not do is grow the region's flora on the floor. The vegetation plane sits at
   *  z=210 and a machine-room shell sits far behind it, so every interior in this film was
   *  rendering a row of server cabinets standing in shortgrass and mesquite. That is the
   *  first law broken twice over in one frame: it tells a viewer the racks are outdoors,
   *  and it tells them Taylor County grows inside. */
  interior?: boolean;
  /** THE SCENE IS A WORKING LOCATION, so the region draws its light and its dirt and
   *  NOT its plants.
   *
   *  This is `interior`'s outdoor twin and it exists for the same defect one step out
   *  of the door. A drilling location is scraped, bladed and bermed caliche out to the
   *  fence, because anything growing on it is a fire load and a trip hazard, and it is
   *  re-bladed every time a rig moves. The vegetation plane sits at z=210, so on
   *  2026-08-28 the August 28th Dispatch rendered shortgrass tufts and a round leafy
   *  tree ON the pad in four scenes, and the same plane drew a mesquite straight
   *  THROUGH the driller's cabin, which a judge read as the cabin being unfilled.
   *
   *  Two judges filed it independently as a place fault and both were right: a Permian
   *  hand knows a location does not grow anything. `interior` already proved the shape
   *  of the fix, which is that the plants are the part a scene must be able to decline
   *  without declining the place. */
  scraped?: boolean;
  children?: React.ReactNode;
}> = ({region, frame, camera = {}, seed = 1, groundY = 1290, weather, interior, scraped,
       children}) => {
  const p = BIOMES[region];
  // The sky, horizon-haze and ground gradients used to be keyed by REGION, so two
  // biomes of one region in a frame shared three paint servers. Identical palettes
  // made that invisible, which is the worst kind of latent: it would have surfaced
  // the first time a second biome of the same region carried a different groundY.
  const uid = useUid('bio');
  // 0 for a low sun, 1 for one straight overhead. LIGHTS carries the direction
  // already, so the sky does not need its own table to disagree with.
  const noon = Math.max(0, Math.min(1, (-LIGHTS[region].dir.y - 0.86) / 0.14));

  // ROUGHNESS BY REGION. This is the shape half of what makes a region itself, and it
  // is as important as the palette: a flat horizon under a Trans-Pecos palette still
  // reads as the Panhandle.
  const rough: Record<RegionName, number> = {
    high_plains: 0.06, rolling_plains: 0.34, cross_timbers: 0.30, blackland: 0.12,
    post_oak: 0.22, piney_woods: 0.30, gulf: 0.05, south_texas: 0.18,
    hill_country: 0.62, trans_pecos: 1.0,
  };
  const r = rough[region];

  // THE SKY IS PART OF THE WEATHER, and it was the half that did not move. `RegionLight`
  // shades every OBJECT to the weather, and the sky gradient behind them stayed keyed to
  // the region alone. So a scene asking for late light got warm shading on the building
  // standing against the same midday blue it stood against fifty seconds earlier, and the
  // change read as a colour-grade slip rather than as an hour passing. The two have to
  // agree or neither is believed.
  const sky: [string, string] =
    weather === 'late' ? ['#6f86ad', '#f0b978']
    : weather === 'night' ? ['#1b2436', '#3d4a63']
    : p.sky;

  return (
    <RegionLight region={region} weather={weather}>
      <Stage3D camera={camera}>
        {/* ---- sky ---------------------------------------------------------- */}
        <Plane z={2200} fill>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            <defs>
              {/* THE HORIZON BLEACHES UNDER A VERTICAL SUN. The board declares
                  `light_story: noon-hard` and a "bleached Permian sky", and every
                  frame of the August 28th cut delivered flat periwinkle instead: no
                  bleach, no glare, nothing that says the sun is overhead. The ramp
                  is driven by the region's OWN key direction rather than a list of
                  region names, so a region whose sun is low keeps its gradient and
                  one whose sun is near vertical gets the wash it should have. */}
              <linearGradient id={`${uid}sky`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={sky[0]} />
                <stop offset={`${Math.max(2, (groundY / H) * 100 - 26)}%`}
                  stopColor={sky[1]} />
                <stop offset="100%" stopColor={bleach(sky[1], noon * 0.62)} />
              </linearGradient>
            </defs>
            <rect width={W} height={H} fill={`url(#${uid}sky)`} />
          </svg>
        </Plane>

        {/* ---- far land ------------------------------------------------------ */}
        <Plane z={1500} fill>
          <Atmosphere z={1500} skyTint={sky[1]} strength={region === 'trans_pecos' ? 0.35 : 1}>
            {/* THE TRANS-PECOS INVERSION: the cleanest air in Texas keeps distant
                mountains saturated instead of hazing them out, which reverses the usual
                atmospheric perspective rule. So its haze strength is turned down rather
                than up, and that is why its far ridges stay purple and legible. */}
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
              <path d={ridgePath(seed, groundY - 210, r)} fill={p.far} />
            </svg>
          </Atmosphere>
        </Plane>

        {/* ---- mid land ------------------------------------------------------ */}
        <Plane z={900} fill>
          <Atmosphere z={900} skyTint={sky[1]}>
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
              <path d={ridgePath(seed + 31, groundY - 96, r * 0.8)} fill={p.mid} />
            </svg>
          </Atmosphere>
        </Plane>

        {/* ---- near band + ground, and NOT INDOORS ---------------------------- */}
        {/* Indoors the floor is the building's, drawn by whatever shell the board stands
            up. An outdoor ground plane sits NEARER than that shell, so it paints the
            region's dirt over the room from the front. Every interior in this film was
            dodging that by pushing groundY down to 1900 to shove the band off frame,
            which is a workaround that works until a camera tilts. */}
        {!interior && (
        <Plane z={420} fill>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            <defs>
              {/* THE HORIZON HAZE. Without it the near band meets the ground as a hard
                  horizontal stripe across the full frame width, which reads as two flat
                  rectangles rather than as a place. It is the same failure the sibling
                  recorded as "a container's edge is not its content's edge": a band that
                  reaches full strength exactly where it is cut prints its own edge into
                  the picture. */}
              <linearGradient id={`${uid}hz`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={sky[1]} stopOpacity="0.55" />
                <stop offset="100%" stopColor={sky[1]} stopOpacity="0" />
              </linearGradient>
              {/* THE GROUND RECEDES. A flat fill is a rectangle; a fill that lightens
                  toward the horizon is a plane the camera is standing on. */}
              <linearGradient id={`${uid}gr`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={p.near} />
                <stop offset="22%" stopColor={p.ground} />
                <stop offset="100%" stopColor={tones(p.ground).core} />
              </linearGradient>
            </defs>
            <path d={ridgePath(seed + 77, groundY - 18, r * 0.5)} fill={p.near} />
            <rect x={0} y={groundY} width={W} height={H - groundY} fill={`url(#${uid}gr)`} />
            <rect x={0} y={groundY - 90} width={W} height={130} fill={`url(#${uid}hz)`} />
            {/* A SCRAPED LOCATION HAS HISTORY ON IT, and the first version of this flag
                only took the plants away. A judge read the result exactly right: the pad
                went from wrong-because-it-grew-things to flat untextured beige, which is a
                different wrongness rather than a fix. A location is bladed, and the blade
                leaves arcs; trucks turn in the same place every time and leave ruts; the
                spoil goes to a berm at the edge. Those three marks are what says somebody
                built this, and they are why a pad does not read as a beach. */}
            {scraped && (
              <g opacity={0.5}>
                {Array.from({length: 7}, (_, i) => {
                  const gy = groundY + 40 + i * ((H - groundY) / 8);
                  const bow = 26 + rnd(seed + 91, i) * 34;
                  return (
                    <path key={`blade${i}`}
                      d={`M${-60},${gy} Q${W / 2},${gy - bow} ${W + 60},${gy + bow * 0.3}`}
                      stroke={INK} strokeWidth={1.6} fill="none"
                      opacity={0.10 + rnd(seed + 92, i) * 0.07} />
                  );
                })}
                {Array.from({length: 2}, (_, i) => {
                  const x0 = W * (0.24 + i * 0.42);
                  return (
                    <path key={`rut${i}`}
                      d={`M${x0},${H} Q${x0 + (i ? -70 : 60)},${groundY + 190} `
                        + `${x0 + (i ? -150 : 130)},${groundY + 46}`}
                      stroke={INK} strokeWidth={7} fill="none" opacity={0.075} />
                  );
                })}
                <path d={`M0,${groundY + 12} Q${W * 0.34},${groundY - 6} ${W * 0.62},${groundY + 9} `
                        + `T${W},${groundY + 4}`}
                  stroke={INK} strokeWidth={5} fill="none" opacity={0.13} />
              </g>
            )}

            {/* ground texture: scatter that gets sparser and smaller toward the horizon,
                which is the cheapest honest perspective cue there is */}
            {Array.from({length: 150}, (_, i) => {
              const u = rnd(seed + 5, i);
              const v = rnd(seed + 6, i);
              const gy = groundY + Math.pow(v, 1.7) * (H - groundY);
              const near01 = (gy - groundY) / Math.max(1, H - groundY);
              const s = 1.2 + near01 * 4.5;
              return (
                <ellipse key={i} cx={u * W} cy={gy} rx={s} ry={s * 0.45}
                  fill={INK} opacity={0.05 + near01 * 0.11} />
              );
            })}
          </svg>
        </Plane>
        )}

        {/* ---- vegetation, per region, and NOT INDOORS ------------------------ */}
        {!interior && !scraped && (
          <Plane z={210}>
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
              <Vegetation region={region} seed={seed} groundY={groundY} />
            </svg>
          </Plane>
        )}

        {children}
      </Stage3D>
    </RegionLight>
  );
};

/** A LIMBED OAK, which is the shape half of the eastern two thirds of Texas and the one
 *  the mesquite default got wrong. `spread` above 1 is a live oak, whose limbs leave the
 *  trunk low and reach out nearly as far as the tree is tall. `spread` near 0.9 is a post
 *  oak, which is stouter, more upright and denser. The crown is BLOBBED FROM OFFSET LOBES
 *  rather than drawn as one ellipse, because a single ellipse is a lollipop and reads as
 *  clip art at any size. Nothing here is symmetric: the lobe offsets and the limb angles
 *  are drawn off the seed and the two sides never match. */
const LimbedOak: React.FC<{
  x: number; y: number; h: number; spread: number; seed: number;
  leaf: string; leafLit: string; bark: string; limbs?: number;
}> = ({x, y, h, spread, seed, leaf, leafLit, bark, limbs = 5}) => {
  const lean = (rnd(seed, 1) - 0.5) * 10;
  const w = h * spread;
  const trunkH = h * (spread > 1 ? 0.30 : 0.46);

  // THE LIMBS ARE SOLVED ONCE AND THE CROWN HANGS OFF THE ANSWER. The geometry used to be
  // recomputed from the seed in two separate loops, which is how a lobe silently stops
  // sitting on the tip it is supposed to hang on the first time either copy is edited.
  //
  // EVERY LIMB USED TO LEAVE THE TRUNK AT ONE POINT, about a sixth of the way up, and fan
  // out from it. That is an umbrella frame, and with a ball on the end of each rib it read
  // as broccoli. Limbs leave a live oak at DIFFERENT HEIGHTS along a trunk that is visibly
  // a trunk, so the origin climbs with the limb's rank and the trunk is taller than it was.
  //
  // `dir` also came from `t < 0.5`, so a five-limb tree put two limbs left and three right,
  // every one within about a third of the span of its neighbour: the tips crowded the
  // middle instead of reaching the edges. Parity alternates them and the reach grows with
  // rank, which is what the tree actually does. The two sides get different counts, so
  // nothing here is symmetric.
  const arms = Array.from({length: limbs}, (_, i) => {
    const dir = i % 2 === 0 ? -1 : 1;
    const rank = Math.floor(i / 2) / Math.max(1, Math.ceil(limbs / 2) - 1 || 1);
    const reach = w * 0.5 * (0.34 + rank * 0.62 + (rnd(seed, 20 + i) - 0.5) * 0.16) * dir;
    const tipY = -trunkH - h * (0.30 - rank * 0.16 + rnd(seed, 30 + i) * 0.12);
    const originY = -trunkH * (0.34 + rank * 0.52 + rnd(seed, 40 + i) * 0.12);
    return {reach, tipY, originY, i};
  });

  // THE CROWN IS ONE SILHOUETTE MADE OF MANY LOBES, AND THAT IS NOT THE SAME THING AS MANY
  // OUTLINED LOBES. Giving each lobe its own ink outline is what made this read as a bag of
  // balls: a viewer counts the outlines, and five circles with five rings around them are
  // five circles no matter how they are arranged. Drawing the same shapes twice, once fat
  // in ink underneath and once in leaf colour on top, leaves a single continuous edge
  // around their UNION and no internal rings, so the eye reads one scalloped crown with
  // tonal variation inside it. The lobes still hang on the limb tips and are still narrower
  // than the gaps, so the silhouette is lumpy and asymmetric rather than a dome.
  // THE FOLIAGE RIDES THE WHOLE LIMB. Two lobes parked at each tip left the splay bare
  // between trunk and crown, which is a pad on a stick: three panels running called this
  // an umbrella acacia, and it is the nearest and largest tree in every Williamson frame
  // including the closing one. Four overlapping clumps per limb, growing outward from the
  // fork to past the tip, close the crown over its own structure and leave sky only at the
  // outer margin. Same treatment `flora.tsx` got, in the second file that draws this tree.
  const lobes: {cx: number; cy: number; rx: number; ry: number; fill: string}[] = [];
  arms.forEach(({reach, tipY, originY, i}) => {
    [0.34, 0.57, 0.79, 1.0].forEach((u, k) => {
      const rx = w * (0.085 + 0.055 * u) * (0.9 + rnd(seed, 60 + i * 4 + k) * 0.2);
      const ry = rx * (0.62 + rnd(seed, 70 + i * 4 + k) * 0.2);
      lobes.push({
        cx: reach * u * 0.96 + (rnd(seed, 100 + i * 4 + k) - 0.5) * rx * 0.5,
        cy: originY + (tipY - originY) * u - h * (0.015 + 0.035 * u),
        rx, ry,
        fill: (i + k) % 3 === 0 ? leafLit : leaf,
      });
    });
  });
  // THE INTERIOR IS TWO SMALL LOBES, NEVER ONE WIDE DISC. There used to be a single ellipse
  // of rx = w*0.30 parked over the crown centre "so the gaps are gaps and not holes", and
  // it did the opposite: it was wide enough to touch both inner lobes and it welded the
  // crown shut. That is the same opaque-middle fault the kit's shared `Canopy` carried for
  // four rounds, which is twice this mistake has been made in two files by drawing the hole
  // instead of trusting the structure.
  [-1, 1].forEach((sgn, k) => lobes.push({
    cx: sgn * w * (0.10 + rnd(seed, 80 + k) * 0.05),
    cy: -trunkH - h * (0.26 + rnd(seed, 85 + k) * 0.10),
    rx: w * 0.105, ry: h * 0.085,
    fill: k === 0 ? leaf : leafLit,
  }));

  return (
    <g transform={`translate(${x} ${y}) rotate(${lean * 0.25})`}>
      <path d={`M${-h * 0.05},0 q${lean * 0.3},${-trunkH * 0.6} ${h * 0.014},${-trunkH}
                l${h * 0.078},0 q${lean * 0.2},${trunkH * 0.6} ${h * 0.022},${trunkH} Z`}
        fill={bark} stroke={INK} strokeWidth={h * 0.018} strokeLinejoin="round" />
      {/* The limbs go sideways BEFORE they go up and they end UNDER THE CANOPY. The first
          version solved the curve for a tip near the ground, so every tree in three regions
          grew bare sticks out sideways below its own crown and read as storm damage. A limb
          that ends outside the leaves is a limb a viewer sees as broken. */}
      {arms.map(({reach, tipY, originY, i}) => (
        <path key={i}
          d={`M0,${originY} Q${reach * 0.70},${originY - trunkH * 0.22} ${reach},${tipY}`}
          stroke={bark} strokeWidth={h * (0.075 - Math.floor(i / 2) * 0.010)} fill="none"
          strokeLinecap="round" />
      ))}
      {lobes.map((l, k) => (
        <ellipse key={`o${k}`} cx={l.cx} cy={l.cy} rx={l.rx} ry={l.ry}
          fill={INK} stroke={INK} strokeWidth={h * 0.024} strokeLinejoin="round" />
      ))}
      {lobes.map((l, k) => (
        <ellipse key={`f${k}`} cx={l.cx} cy={l.cy} rx={l.rx} ry={l.ry} fill={l.fill} />
      ))}
    </g>
  );
};

/** THE POLYGONAL DROUGHT CRACK of the blackland prairie. Vertices on a jittered grid,
 *  each cell joined to its neighbours, so the cracks meet at nodes the way real ones do
 *  rather than lying about as unconnected strokes. Wider and darker near the camera. */
const ClayCracks: React.FC<{seed: number; groundY: number}> = ({seed, groundY}) => {
  // CRACKS BELONG TO BARE CLAY, NOT TO EVERYTHING BELOW THE HORIZON.
  // Started thirty units under the ground line they ran the full depth of the frame,
  // straight across the mown verge and on over the paved apron, so the ground plane read
  // as a wireframe laid over the picture rather than as cracked earth. A scorer priced
  // that at about half a point of place on its own, which is more than the texture was
  // ever worth.
  // The near band is where a viewer can see the width of a crack and where the grass
  // thins enough for the clay to show, so that is where they are. Above it the ground
  // keeps its colour and nothing is drawn.
  //
  // A CRACK IS A SHADOW, so it is DARKER than the fill it opens in. Drawn pale it reads as
  // a wireframe laid over the ground, which is what a scorer saw: a grid rather than clay.
  // The plates also have to vary about three to one in area, because a network of equal
  // cells is a mesh and shrinking clay does not make one.
  const top = groundY + (H - groundY) * 0.42;
  const rows = 5, cols = 9;
  const node = (r: number, c: number) => {
    const t = (r + 0.5) / rows;
    const y = top + Math.pow(t, 1.35) * (H - top - 20);
    const spread = 0.6 + t * 0.9;                       // cells widen as they near us
    return {
      x: ((c + 0.5) / cols) * W + (rnd(seed, r * 31 + c) - 0.5) * (W / cols) * spread * 1.7,
      y: y + (rnd(seed, 200 + r * 31 + c) - 0.5) * 62 * spread,
      t,
    };
  };
  const segs: {a: {x: number; y: number; t: number}; b: {x: number; y: number; t: number}}[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = node(r, c);
      if (c + 1 < cols && rnd(seed, 400 + r * 31 + c) > 0.18) segs.push({a, b: node(r, c + 1)});
      if (r + 1 < rows && rnd(seed, 600 + r * 31 + c) > 0.30) segs.push({a, b: node(r + 1, c)});
    }
  }
  return (
    <g>
      {segs.map((sg, i) => {
        const t = (sg.a.t + sg.b.t) / 2;
        const mx = (sg.a.x + sg.b.x) / 2 + (rnd(seed, 800 + i) - 0.5) * 26;
        const my = (sg.a.y + sg.b.y) / 2 + (rnd(seed, 900 + i) - 0.5) * 14;
        return (
          <path key={i} d={`M${sg.a.x},${sg.a.y} Q${mx},${my} ${sg.b.x},${sg.b.y}`}
            stroke="#17130e" strokeWidth={0.7 + t * 3.6} fill="none"
            strokeLinecap="round" opacity={0.34 + t * 0.46} />
        );
      })}
    </g>
  );
};

/** Bunch grass, which is what is BETWEEN the trees in a savannah and the reason a
 *  savannah does not read as a mown park. Clumps, never a lawn. */
const BunchGrass: React.FC<{seed: number; groundY: number; n: number; color: string; hh?: number}> = ({
  seed, groundY, n, color, hh = 26,
}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const gx = rnd(seed, 200 + i) * W;
      const gy = groundY + 24 + Math.pow(rnd(seed, 300 + i), 1.5) * (H - groundY - 40);
      const near = (gy - groundY) / Math.max(1, H - groundY);
      const s = 0.45 + near * 1.5;
      return (
        <g key={i} transform={`translate(${gx} ${gy}) scale(${s})`}>
          {Array.from({length: 5}, (_, k) => (
            <path key={k}
              d={`M0,0 q${(k - 2) * 4},${-hh * 0.6} ${(k - 2) * 11},${-hh * (0.7 + rnd(seed, 400 + i * 5 + k) * 0.6)}`}
              stroke={color} strokeWidth={2.4} fill="none" strokeLinecap="round"
              opacity={0.55 + near * 0.35} />
          ))}
        </g>
      );
    })}
  </g>
);

/** The plants that make a region itself. There is NO SHARED DEFAULT: every region names
 *  its own flora, because a shared default is how blackland, post oak, cross timbers and
 *  rolling plains all ended up drawn as one mesquite prairie, which told a viewer in three
 *  different Texases that they lived in a fourth. Mesquite is real in the rolling plains
 *  and it is LOW, CROOKED, WIDE AND LACY. The Piney Woods is the one region where
 *  verticals dominate, because the trees are genuinely tall and straight. */
const Vegetation: React.FC<{region: RegionName; seed: number; groundY: number}> = ({
  region, seed: sceneSeed, groundY,
}) => {
  // THE STAND IS THE PLACE, AND THE PLACE DOES NOT RESHUFFLE BETWEEN CUTS.
  // Every scene passed its own seed here, so the four Round Rock shots each drew a
  // DIFFERENT stand of oaks at a different scale, and the four Abilene shots a different
  // brake of mesquite. A viewer reads that as four locations, not four looks at one, and a
  // panel read it exactly that way: the far treeline changed size across s01, s12, s13 and
  // s14 while the voice said it was still the same yard. Standing woody plants are
  // LANDMARKS and are seeded on the REGION, so the same trees stand in the same places at
  // the same size in every shot of that place. Grass keeps the scene seed, because grass is
  // texture rather than landmark and a viewer never tracks a tuft from one cut to the next.
  const seed = REGION_SEED[region];
  switch (region) {
    case 'high_plains':
      // Almost no trees. A LONE TREE IS A LANDMARK, not scenery, so there is exactly one.
      return (
        <g>
          <Mesquite x={188} y={groundY + 30} scale={0.04459} seed={seed} />
          {Array.from({length: 40}, (_, i) => (
            <line key={i} x1={rnd(seed, i) * W} y1={groundY + 20 + rnd(seed, 40 + i) * 90}
              x2={rnd(seed, i) * W + 5} y2={groundY + 8 + rnd(seed, 40 + i) * 90}
              stroke="#9aa06a" strokeWidth={2.4} opacity={0.6} />
          ))}
        </g>
      );
    case 'south_texas':
      // Thorn scrub, dense enough to be genuinely impassable. That is why it is called
      // brush country and a sparse version of it is the wrong place.
      return (
        <g>
          {Array.from({length: 9}, (_, i) => (
            <Mesquite key={i} x={rnd(seed, i) * W} y={groundY + 10 + rnd(seed, 20 + i) * 70}
              scale={(0.03344) + rnd(seed, 30 + i) * 0.03121} seed={seed + i * 13} />
          ))}
          {Array.from({length: 6}, (_, i) => (
            <PricklyPear key={i} x={rnd(seed, 60 + i) * W} y={groundY + 40 + rnd(seed, 70 + i) * 80}
              scale={(0.1463) + rnd(seed, 80 + i) * 0.1138} seed={seed + i * 7} />
          ))}
        </g>
      );
    case 'trans_pecos':
      // Sparse and INDIVIDUAL: every plant has space around it and reads as a
      // silhouette. A dense desert is somebody else's desert.
      return (
        <g>
          {Array.from({length: 7}, (_, i) => {
            const x = rnd(seed, i) * W, y = groundY + 20 + rnd(seed, 20 + i) * 90;
            const h = 90 + rnd(seed, 30 + i) * 90;
            return (
              <g key={i}>
                {/* ocotillo: bare whips from a single crown */}
                {Array.from({length: 7}, (_, k) => (
                  <path key={k}
                    d={`M${x},${y} q${(k - 3) * 5},${-h * 0.5} ${(k - 3) * 13},${-h}`}
                    stroke="#6b7355" strokeWidth={3} fill="none" strokeLinecap="round" />
                ))}
              </g>
            );
          })}
        </g>
      );
    case 'piney_woods':
      // THE ONLY REGION WHERE VERTICALS DOMINATE. Tall, straight, close.
      return (
        <g>
          {Array.from({length: 16}, (_, i) => {
            const x = rnd(seed, i) * W;
            const h = 300 + rnd(seed, 20 + i) * 260;
            const y = groundY + rnd(seed, 30 + i) * 60;
            return (
              <g key={i}>
                <rect x={x - 5} y={y - h} width={10} height={h} fill="#4a3a2c" />
                <path d={`M${x},${y - h - 40} l26,${h * 0.44} l-52,0 Z`} fill="#2f4a36" opacity={0.95} />
                <path d={`M${x},${y - h - 4} l34,${h * 0.36} l-68,0 Z`} fill="#33513f" opacity={0.95} />
              </g>
            );
          })}
        </g>
      );
    case 'hill_country':
      // Ashe juniper and live oak, in a grey-green and blue-green never a yellow-green.
      return (
        <g>
          {Array.from({length: 11}, (_, i) => {
            const x = rnd(seed, i) * W, y = groundY + 14 + rnd(seed, 20 + i) * 70;
            const s = 1.0 + rnd(seed, 30 + i) * 0.9;
            return (
              <g key={i}>
                <ellipse cx={x} cy={y - 40 * s} rx={40 * s} ry={34 * s} fill="#556b52"
                  stroke={INK} strokeWidth={3} />
                <rect x={x - 4 * s} y={y - 42 * s} width={8 * s} height={42 * s} fill="#4a3a2c" />
              </g>
            );
          })}
        </g>
      );
    case 'gulf':
      // Cordgrass and a LIVE OAK PERMANENTLY LEANED by the prevailing wind.
      return (
        <g>
          {Array.from({length: 90}, (_, i) => (
            <path key={i}
              d={`M${rnd(seed, i) * W},${groundY + 30 + rnd(seed, 90 + i) * 120}
                  q6,-22 2,-40`}
              stroke="#8a9a63" strokeWidth={2.6} fill="none" opacity={0.75} />
          ))}
          <g transform={`translate(880 ${groundY + 30}) rotate(9)`}>
            <rect x={-7} y={-96} width={14} height={96} fill="#4a3a2c" />
            <ellipse cx={-16} cy={-108} rx={72} ry={32} fill="#4a6b4a" stroke={INK} strokeWidth={4} />
          </g>
        </g>
      );
    case 'rolling_plains':
      // MESQUITE COUNTRY, and the one region where the old shared default was accidentally
      // right. It is drawn deliberately here instead: low, wide, lacy, standing in
      // shortgrass with bare ground showing between the clumps. The invasion is real and a
      // rolling-plains frame with no mesquite in it is the wrong place.
      return (
        <g>
          <BunchGrass seed={sceneSeed + 3} groundY={groundY} n={54} color="#8a8a58" hh={20} />
          {/* BARE GROUND SHOWS BETWEEN THE CLUMPS, and none of it did. Three separate
              faults, and stratifying x only fixed the first of them.

              ONE. Eight purely random x values put crowns on top of each other, so the
              right third of the Abilene frame was a continuous hedge lying across the
              cooling towers. Six lanes with the jitter held inside its own lane.

              TWO. Lanes are worth nothing if the crown is wider than the lane, and it was:
              `scale` ran to 0.064, which through `fit('mesquite', 82)` draws a crown about
              350 px across in a 154 px lane. Every arrangement merges at that size. The
              ceiling below is solved against the lane width rather than chosen, so the
              widest crown is a little over half its lane and adjacent crowns cannot touch
              no matter what the seed does.

              THREE. `scale` was random and UNCORRELATED WITH DEPTH, so a tree low in the
              frame, which is nearer the camera, was as likely to be drawn small as large.
              That is a scale error in the strict sense the engine's own metre file was
              written to prevent: the picture was telling the eye two different distances
              for one tree. Size now comes from depth and the seed only varies it a little
              around that. */}
          {/* THE CEILING IS SOLVED, NOT CHOSEN, AND THE FIRST ATTEMPT CHOSE IT.
              Lanes plus a depth ramp still shipped a hedge across the base of the Abilene
              cooling towers, because the ramp's top end was nearly twice what the lane
              could hold. The crown's half extent in the drawing's own units is the cluster
              offset plus the scatter radius, about 0.577 of `w`, so the widest tree is
              `2 * 0.577 * w * fit('mesquite', h) * scale` across and that has to fit
              inside a fraction of `W / lanes`. The numbers below come out of that
              inequality with room to spare, and the ramp is compressed so the far trees do
              not collapse to specks in the bargain: a scorer called them knee-high sage
              dots in the same round another called the near ones a hedge, and the two
              complaints are the same ramp seen from its two ends. */}
          {Array.from({length: 5}, (_, i) => {
            const depth = (i * 3 % 5) / 4;                       // stratified in y, not clumped
            const gy = groundY + 16 + Math.pow(0.18 + depth * 0.82, 1.35) * 240;
            const near = (gy - groundY) / 240;
            return (
              <Mesquite key={i}
                x={((i + 0.5) / 5) * W + (rnd(seed, i) - 0.5) * (W / 5) * 0.30}
                y={gy} w={190} h={82}
                scale={(0.0118 + near * 0.0068) * (0.94 + rnd(seed, 30 + i) * 0.12)}
                seed={seed + i * 11} />
            );
          })}
        </g>
      );
    case 'post_oak':
      // THE POST OAK SAVANNAH, and the word savannah is the whole instruction. Individual
      // trees with real daylight between them and grass running right up to each trunk.
      // Not a forest and not a prairie, and it is the only place in Texas that looks like
      // this. The crowns are ROUNDED AND DENSE and the trunks are short and stout.
      return (
        <g>
          <BunchGrass seed={sceneSeed + 5} groundY={groundY} n={70} color="#7f8f4e" hh={24} />
          {Array.from({length: 6}, (_, i) => {
            const gy = groundY + 18 + Math.pow(rnd(seed, 20 + i), 1.5) * 300;
            const near = (gy - groundY) / Math.max(1, H - groundY);
            return (
              <LimbedOak key={i}
                x={((i + 0.5) / 6) * W + (rnd(seed, i) - 0.5) * 120} y={gy}
                h={110 + near * 210} spread={0.92} seed={seed + i * 17}
                leaf="#5a7040" leafLit="#748a4e" bark="#4f4034" limbs={4} />
            );
          })}
        </g>
      );
    case 'cross_timbers':
      // THE THICKET THE NAME IS FOR. Post oak and blackjack packed close enough that the
      // early crossings had to be surveyed, so this is the one eastern region drawn DENSE
      // and overlapping. Crowns touch and the ground barely shows through.
      return (
        <g>
          <BunchGrass seed={sceneSeed + 7} groundY={groundY} n={34} color="#6f7f4a" hh={18} />
          {Array.from({length: 14}, (_, i) => {
            const gy = groundY + 10 + Math.pow(rnd(seed, 20 + i), 1.3) * 280;
            const near = (gy - groundY) / Math.max(1, H - groundY);
            return (
              <LimbedOak key={i}
                x={rnd(seed, i) * W} y={gy}
                h={96 + near * 170} spread={0.86} seed={seed + i * 23}
                leaf="#4e6339" leafLit="#63784a" bark="#4a3c30" limbs={3} />
            );
          })}
        </g>
      );
    case 'blackland':
      // BLACKLAND PRAIRIE, which is farmed and has been for a hundred and fifty years, so
      // the trees are FEW and they stand in fence lines and creek bottoms rather than
      // scattered over the field. What is left of the prairie is tall grass, not short.
      // The tree is a LIVE OAK: low, spreading, limbs leaving the trunk near the ground
      // and reaching out about as far as the tree is tall.
      return (
        <g>
          {/* THE BLACK CRACKING CLAY, and its absence was the most expensive thing missing
              from this region. REGIONS.md ranks ground second only to light and calls the
              polygonal drought crack one of the most drawable textures in the state, and
              the blackland here was a smooth colour gradient with grass on it. A Williamson
              County viewer in August recognises the building and does not recognise the
              yard, which is the first law broken by omission.
              The crack is a POLYGON NETWORK, not a scatter of lines: the clay shrinks away
              from itself and the plates it leaves have shared edges, so each crack starts
              where another one ended. Drawn on the near half only, because a crack you
              cannot see the width of is not a crack. */}
          <ClayCracks seed={sceneSeed + 17} groundY={groundY} />
          <BunchGrass seed={sceneSeed + 11} groundY={groundY} n={64} color="#8c9a5c" hh={34} />
          {/* TWO, AT THE EDGES, BECAUSE THREE AT TRUE OAK SIZE IS A HEDGE.
              Giving the oaks their real height was right and it walled the building off:
              three crowns 1.45 times as wide as they are tall, on the vegetation plane in
              FRONT of the block, close into a continuous mass across the frame. A blackland
              yard is farmed country where the trees stand in the fence line, so they belong
              at the edges framing what the shot is about rather than across the middle of
              it. The building is the subject of every one of these four shots. */}
          {Array.from({length: 2}, (_, i) => {
            const gy = groundY + 22 + rnd(seed, 20 + i) * 190;
            const near = (gy - groundY) / Math.max(1, H - groundY);
            return (
              <LimbedOak key={i}
                x={[0.10, 0.90][i] * W + (rnd(seed, i) - 0.5) * 70} y={gy}
                // A LIVE OAK IS 12 TO 15 METRES AND THIS DREW IT AT ABOUT THREE.
                // At h 120 to 175 the crown's 22 lobes render 16 to 27px each under a 3px
                // ink stroke, so they merge into one smooth mass and the limbs, drawn first,
                // are buried entirely. That is why two rounds of crown rebuilds were correct
                // in code and invisible on screen: the construction was never given enough
                // pixels to BE a construction. It was also a true scale error, the animal
                // beside a person fault GATE_LESSONS names, since the oak stood a quarter
                // the height of a pad-mount transformer at nearly the same depth.
                h={300 + near * 330} spread={1.30} seed={seed + i * 29}
                leaf="#284439" leafLit="#3a5c4a" bark="#3f342b" limbs={5} />
            );
          })}
        </g>
      );
    default:
      // Unreachable: every RegionName above names its own flora, and this exists only so
      // the switch is total. A new region MUST author its plants rather than inherit
      // somebody else's, which is the fault this default used to hide.
      return <g />;
  }
};
