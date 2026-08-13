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
    sky: ['#7b9ec2', '#d6cfc4'], far: '#9d7a63', mid: '#a87f63', near: '#b08468',
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
export const Biome: React.FC<{
  region: RegionName;
  frame: number;
  camera?: Camera;
  seed?: number;
  /** how far up the frame the ground line sits */
  groundY?: number;
  weather?: 'norther' | 'dust' | 'overcast' | 'night';
  children?: React.ReactNode;
}> = ({region, frame, camera = {}, seed = 1, groundY = 1290, weather, children}) => {
  const p = BIOMES[region];
  // The sky, horizon-haze and ground gradients used to be keyed by REGION, so two
  // biomes of one region in a frame shared three paint servers. Identical palettes
  // made that invisible, which is the worst kind of latent: it would have surfaced
  // the first time a second biome of the same region carried a different groundY.
  const uid = useUid('bio');

  // ROUGHNESS BY REGION. This is the shape half of what makes a region itself, and it
  // is as important as the palette: a flat horizon under a Trans-Pecos palette still
  // reads as the Panhandle.
  const rough: Record<RegionName, number> = {
    high_plains: 0.06, rolling_plains: 0.34, cross_timbers: 0.30, blackland: 0.12,
    post_oak: 0.22, piney_woods: 0.30, gulf: 0.05, south_texas: 0.18,
    hill_country: 0.62, trans_pecos: 1.0,
  };
  const r = rough[region];

  return (
    <RegionLight region={region} weather={weather}>
      <Stage3D camera={camera}>
        {/* ---- sky ---------------------------------------------------------- */}
        <Plane z={2200} fill>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            <defs>
              <linearGradient id={`${uid}sky`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={p.sky[0]} />
                <stop offset="100%" stopColor={p.sky[1]} />
              </linearGradient>
            </defs>
            <rect width={W} height={H} fill={`url(#${uid}sky)`} />
          </svg>
        </Plane>

        {/* ---- far land ------------------------------------------------------ */}
        <Plane z={1500} fill>
          <Atmosphere z={1500} skyTint={p.sky[1]} strength={region === 'trans_pecos' ? 0.35 : 1}>
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
          <Atmosphere z={900} skyTint={p.sky[1]}>
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
              <path d={ridgePath(seed + 31, groundY - 96, r * 0.8)} fill={p.mid} />
            </svg>
          </Atmosphere>
        </Plane>

        {/* ---- near band + ground -------------------------------------------- */}
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
                <stop offset="0%" stopColor={p.sky[1]} stopOpacity="0.55" />
                <stop offset="100%" stopColor={p.sky[1]} stopOpacity="0" />
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

        {/* ---- vegetation, per region ---------------------------------------- */}
        <Plane z={210}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            <Vegetation region={region} seed={seed} groundY={groundY} />
          </svg>
        </Plane>

        {children}
      </Stage3D>
    </RegionLight>
  );
};

/** The plants that make a region itself. Mesquite is the default across west and south
 *  Texas and it is LOW, CROOKED, WIDE AND LACY. The Piney Woods is the one region where
 *  verticals dominate, because the trees are genuinely tall and straight. */
const Vegetation: React.FC<{region: RegionName; seed: number; groundY: number}> = ({
  region, seed, groundY,
}) => {
  switch (region) {
    case 'high_plains':
      // Almost no trees. A LONE TREE IS A LANDMARK, not scenery, so there is exactly one.
      return (
        <g>
          <Mesquite x={188} y={groundY + 30} scale={1.0} seed={seed} />
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
              scale={0.75 + rnd(seed, 30 + i) * 0.7} seed={seed + i * 13} />
          ))}
          {Array.from({length: 6}, (_, i) => (
            <PricklyPear key={i} x={rnd(seed, 60 + i) * W} y={groundY + 40 + rnd(seed, 70 + i) * 80}
              scale={0.9 + rnd(seed, 80 + i) * 0.7} seed={seed + i * 7} />
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
    default:
      return (
        <g>
          {Array.from({length: 7}, (_, i) => (
            <Mesquite key={i} x={rnd(seed, i) * W} y={groundY + 14 + rnd(seed, 20 + i) * 70}
              scale={0.8 + rnd(seed, 30 + i) * 0.7} seed={seed + i * 11} />
          ))}
        </g>
      );
  }
};
