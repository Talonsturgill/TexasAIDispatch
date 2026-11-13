import React from 'react';
import {light, line, mix, shade} from './color';
import {usePlace} from '../modern/PlaceStage';
import {Bush, ContactShadow, Landscape, useUid, type Land} from './Kit';

/**
 * THE TEN REGIONS, LOOK V2 (November 13th, 2026).
 *
 * The baked place plates (modern/placePlates.json) are real-geometry renders: right in what stands
 * where, but grey, hazy and photographic, which is the "faded" the owner named. These are the same
 * ten places redrawn in the v2 idiom. Each region keeps what its own plate shows (read off the
 * plate's sky, ground and cards on November 13th, 2026) and nothing that belongs to one town:
 *
 *  blackland       dark crop rows, a few shade trees, an elevator and water tower far off
 *  cross_timbers   tan grass, a fence line, a wall of oaks
 *  gulf            marsh grass along a bayou, a low causeway and turbines on the horizon
 *  high_plains     flat to the edge, a caliche road, a green field, turbines and an elevator
 *  hill_country    blue hills, live oaks and juniper, limestone, a ranch fence
 *  piney_woods     tall pines both sides of a red dirt road, understory brush
 *  post_oak        gold grass and lone post oaks
 *  rolling_plains  red dirt, mesquite, a pumpjack, a mesa far off
 *  south_texas     a pale caliche road, prickly pear and brush
 *  trans_pecos     red mesas under a violet sky, yucca, sotol and stone
 *
 * Ground colours start from each plate's measured ground and are pushed to v2 chroma. Every part
 * follows the kit's rules (round, lit, grounded, deep, alive). `pan` slides the layers at three
 * speeds for parallax. Region ids are config/county_regions.json's.
 */
export type RegionId = 'blackland' | 'cross_timbers' | 'gulf' | 'high_plains' | 'hill_country' | 'piney_woods' |
  'post_oak' | 'rolling_plains' | 'south_texas' | 'trans_pecos';

const SKY_DAY = {skyTop: '#4f97f2', skyLow: '#ffe7bf', sun: '#fff3c4', haze: '#ffe0b8'};
export const LANDS: Record<RegionId, Land> = {
  blackland: {...SKY_DAY, far: '#a8b3df', mid: '#7fae4f', near: '#4b3a2a'},
  cross_timbers: {...SKY_DAY, far: '#a7b0e0', mid: '#c4b768', near: '#b89c50'},
  gulf: {...SKY_DAY, skyLow: '#ffe9d0', far: '#a9bde6', mid: '#7fa86e', near: '#5f8a5c'},
  high_plains: {...SKY_DAY, skyTop: '#3f8ff5', far: '#b4bde6', mid: '#d6b86a', near: '#e3c886'},
  hill_country: {...SKY_DAY, far: '#8fa6dc', mid: '#a7b36a', near: '#c7bb84'},
  piney_woods: {...SKY_DAY, skyLow: '#f6ecd0', far: '#8fae9a', mid: '#5f8a4a', near: '#6f8a44'},
  post_oak: {...SKY_DAY, skyLow: '#ffe2b0', far: '#b2aedc', mid: '#d9a84e', near: '#c98f3c'},
  rolling_plains: {...SKY_DAY, skyLow: '#ffd9b4', far: '#c79a8e', mid: '#c07848', near: '#a8503a'},
  south_texas: {...SKY_DAY, far: '#b9a7e8', mid: '#e3c27a', near: '#e9cf96'},
  trans_pecos: {skyTop: '#4054b0', skyLow: '#ffae86', sun: '#ffe1a8', haze: '#ffb894', far: '#c4553a', mid: '#8a5244',
    near: '#6b4440'},
};

const hash = (seed: number, ch: number) => {
  let t = (Math.imul(seed + 1, 374761393) + Math.imul(ch + 1, 668265263)) >>> 0;
  t = Math.imul(t ^ (t >>> 13), 1274126177) >>> 0;
  t = (t ^ (t >>> 16)) >>> 0;
  return (t % 100000) / 100000;
};
/** a stable scatter, spread evenly across the width (one slot each, jittered), that slides with
 * `pan` and wraps, so a slow camera never runs out of world and nothing bunches on one side */
const scatter = (n: number, seed: number, y0: number, y1: number, pan: number, speed: number) =>
  Array.from({length: n}).map((_, i) => {
    const raw = ((i + 0.15 + hash(seed, i) * 0.7) / n) * 1400 - 160 - pan * speed;
    const x = ((raw + 160) % 1400 + 1400) % 1400 - 160;
    const t = hash(seed, i + 50);
    return {x, y: y0 + (y1 - y0) * t, t, k: hash(seed, i + 99), i};
  }).sort((a, b) => a.y - b.y);

/** ground that recedes: soft bands closing up toward the horizon and pools of light, so a field
 * reads as distance and never as a flat fill */
const GroundBands: React.FC<{horizon: number; color: string; pan: number; seed?: number}> = ({horizon, color, pan, seed = 1}) => {
  const id = useUid();
  const N = 14, span = 1960 - horizon;
  const ys = Array.from({length: N + 1}).map((_, k) => horizon + span * Math.pow(k / N, 1.9));
  return (
    <g>
      <defs><radialGradient id={`${id}-pool`}><stop offset="0%" stopColor="#fff6dc" stopOpacity={0.32} />
        <stop offset="100%" stopColor="#fff6dc" stopOpacity={0} /></radialGradient></defs>
      {ys.slice(0, -1).map((y, k) => k % 2 ? null : <rect key={k} x={-200} y={y} width={1480} height={ys[k + 1] - y}
        fill={shade(color, 0.12)} opacity={0.22} />)}
      {[0, 1, 2].map((i) => {
        const yy = horizon + span * (0.18 + i * 0.3);
        const xx = ((hash(seed, i) * 1300 - pan * (0.4 + i * 0.3)) % 1400 + 1400) % 1400 - 160;
        return <ellipse key={i} cx={xx} cy={yy} rx={260 + i * 160} ry={40 + i * 40} fill={`url(#${id}-pool)`} />;
      })}
    </g>
  );
};

/** the nearest layer: tall soft grass along the bottom edge, a little out of focus, which puts the
 * camera inside the place rather than looking at a picture of it */
const Foreground: React.FC<{color: string; frame: number; seed?: number}> = ({color, frame, seed = 1}) => {
  const id = useUid();
  return (
    <g filter={`url(#${id}-dof)`}>
      <defs><filter id={`${id}-dof`} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation={3.5} /></filter></defs>
      {Array.from({length: 16}).map((_, i) => {
        const x = -40 + i * 76 + (hash(seed, i) - 0.5) * 40;
        const h = 90 + hash(seed, i + 20) * 120 + (i < 3 || i > 12 ? 90 : 0);
        const lean = (hash(seed, i + 40) - 0.5) * 60 + Math.sin(frame / 30 * 1.3 + i) * 6;
        const c = i % 3 ? color : shade(color, 0.25);
        return <path key={i} d={`M${x - 14} 1930 Q${x + lean * 0.4} ${1930 - h * 0.6} ${x + lean} ${1930 - h} Q${x + lean * 0.3 + 10}
          ${1930 - h * 0.5} ${x + 16} 1930 Z`} fill={c} />;
      })}
      <rect x={-20} y={1924} width={1120} height={20} fill={shade(color, 0.3)} />
    </g>
  );
};

// ------------------------------------------------------------------------------------------- parts

/** a loblolly pine: a tall bare trunk, then a crown of flat needle pads stacked on short side
 * branches, wider than tall, the silhouette that tells a pine from an oak at a glance */
export const Pine: React.FC<{x: number; y: number; s?: number; depth?: number; seed?: number; frame?: number}> = ({
  x, y, s = 1, depth = 0, seed = 1, frame = 0,
}) => {
  const id = useUid();
  const c = mix('#3d7448', '#a8bfd8', depth * 0.6), bark = mix('#7a4a30', '#a8bfd8', depth * 0.5);
  const sway = Math.sin(frame / 30 * 0.9 + seed) * 3;
  // pads from the top down: [side, height up the trunk, half width, half height]
  const pads: number[][] = [[0, -600, 46, 26]];
  for (let j = 0; j < 5; j++) {
    const side = (j + seed) % 2 ? 1 : -1, y0 = -560 + j * 52;
    pads.push([side * (40 + hash(seed, j) * 30), y0, 62 + hash(seed, j + 9) * 26, 30 + hash(seed, j + 17) * 8]);
    if (hash(seed, j + 30) > 0.35) pads.push([-side * (34 + hash(seed, j + 3) * 26), y0 + 20, 54 + hash(seed, j + 11) * 20, 28]);
  }
  const top = -600;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs><linearGradient id={`${id}-n`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={light(c, 0.32)} />
        <stop offset="55%" stopColor={c} /><stop offset="100%" stopColor={shade(c, 0.45)} /></linearGradient></defs>
      <ContactShadow x={0} y={4} w={150} opacity={0.25 * (1 - depth)} />
      <path d={`M-13 0 Q-9 -260 ${-3 + sway * 0.4} ${top + 20} L${3 + sway * 0.4} ${top + 20} Q9 -260 13 0 Z`} fill={bark}
        stroke={line(bark)} strokeWidth={4} />
      <path d="M-4 -40 Q-2 -200 -3 -420" stroke={light(bark, 0.3)} strokeWidth={3} opacity={0.5} fill="none" />
      <g transform={`translate(${sway} 0)`}>
        {pads.map(([px, py], i) => i ? <path key={`b${i}`} d={`M0 ${py + 12} Q${px * 0.5} ${py + 4} ${px * 0.8} ${py}`} stroke={bark}
          strokeWidth={7} strokeLinecap="round" fill="none" /> : null)}
        {(() => {
          // each pad is a lumpy needle cluster: four or five round lobes along a line, wider than tall
          const lobes = pads.flatMap(([px, py, rx, ry], i) => [-0.62, -0.24, 0.16, 0.56, i % 2 ? 0.86 : -0.9].map((f, k) => ({
            cx: px + f * rx * 0.9, cy: py + (hash(seed, i * 7 + k) - 0.5) * ry * 0.5,
            r: ry * (0.78 + hash(seed, i * 11 + k) * 0.42) * (k === 4 ? 0.7 : 1), i, k})));
          return <>
            {lobes.map((l, j) => <circle key={`o${j}`} cx={l.cx} cy={l.cy} r={l.r + 4.5} fill={line(c)} />)}
            {lobes.map((l, j) => <circle key={j} cx={l.cx} cy={l.cy} r={l.r} fill={`url(#${id}-n)`} />)}
            {pads.map(([px, py, rx, ry], i) => <ellipse key={`h${i}`} cx={px - rx * 0.3} cy={py - ry * 0.55} rx={rx * 0.32}
              ry={ry * 0.22} fill={light(c, 0.5)} opacity={0.3 * (1 - depth * 0.5)} />)}
          </>;
        })()}
      </g>
    </g>
  );
};

/** a live oak or post oak: a broad, low, rounded crown on a short dark trunk */
export const Oak: React.FC<{x: number; y: number; s?: number; depth?: number; seed?: number; frame?: number;
  color?: string; spread?: number}> = ({x, y, s = 1, depth = 0, seed = 1, frame = 0, color = '#4f8a3c', spread = 1}) => {
  const id = useUid();
  const c = mix(color, '#aab4e0', depth * 0.6), bark = mix('#4a3326', '#aab4e0', depth * 0.5);
  const sway = Math.sin(frame / 30 * 1.1 + seed) * 2.5;
  const lobes = [[-170, -210, 78], [-95, -270, 92], [0, -295, 100], [100, -270, 92], [175, -210, 76], [-60, -205, 86],
    [60, -205, 88], [0, -230, 92]].map(([lx, ly, r], i) => [lx * spread + (hash(seed, i) - 0.5) * 26, ly + (hash(seed, i + 7) - 0.5) * 20,
    r * (0.9 + hash(seed, i + 13) * 0.2)]);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs><radialGradient id={`${id}-l`} cx="35%" cy="22%" r="85%"><stop offset="0%" stopColor={light(c, 0.4)} />
        <stop offset="55%" stopColor={c} /><stop offset="100%" stopColor={shade(c, 0.42)} /></radialGradient></defs>
      <ContactShadow x={0} y={4} w={420 * spread} opacity={0.3 * (1 - depth * 0.7)} />
      <path d={`M-22 0 Q-26 -90 -90 -170 M22 0 Q30 -90 100 -170 M0 -20 Q6 -120 0 -200`} stroke={bark} strokeWidth={30}
        strokeLinecap="round" fill="none" />
      <g transform={`translate(${sway} 0)`}>
        {lobes.map(([lx, ly, r], i) => <circle key={`o${i}`} cx={lx} cy={ly} r={r + 6} fill={line(c)} opacity={1 - depth * 0.6} />)}
        {lobes.map(([lx, ly, r], i) => <circle key={i} cx={lx} cy={ly} r={r} fill={`url(#${id}-l)`} />)}
        {lobes.slice(1, 4).map(([lx, ly, r], i) => <ellipse key={`h${i}`} cx={lx - r * 0.25} cy={ly - r * 0.42} rx={r * 0.42}
          ry={r * 0.2} fill={light(c, 0.65)} opacity={0.4 * (1 - depth * 0.5)} />)}
      </g>
    </g>
  );
};

/** an Ashe juniper (the Hill Country "cedar"): a dense blue-green rounded cone */
export const Juniper: React.FC<{x: number; y: number; s?: number; depth?: number; seed?: number}> = ({x, y, s = 1, depth = 0, seed = 1}) => {
  const id = useUid();
  const c = mix('#3f7468', '#a8b4dc', depth * 0.6);
  const lobes = [[0, -260, 52], [-34, -200, 60], [36, -205, 58], [-50, -120, 66], [52, -125, 64], [0, -150, 70], [0, -70, 70]];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs><radialGradient id={`${id}-j`} cx="35%" cy="25%" r="85%"><stop offset="0%" stopColor={light(c, 0.35)} />
        <stop offset="60%" stopColor={c} /><stop offset="100%" stopColor={shade(c, 0.4)} /></radialGradient></defs>
      <ContactShadow x={0} y={2} w={200} opacity={0.28 * (1 - depth)} />
      {lobes.map(([lx, ly, r], i) => <circle key={`o${i}`} cx={lx + (hash(seed, i) - 0.5) * 12} cy={ly} r={r + 5} fill={line(c)} />)}
      {lobes.map(([lx, ly, r], i) => <circle key={i} cx={lx + (hash(seed, i) - 0.5) * 12} cy={ly} r={r} fill={`url(#${id}-j)`} />)}
    </g>
  );
};

/** prickly pear: rounded paddles on paddles, with pink tunas on the top edge */
export const PricklyPear: React.FC<{x: number; y: number; s?: number; seed?: number; depth?: number}> = ({x, y, s = 1, seed = 1, depth = 0}) => {
  const id = useUid();
  const c = mix('#5f9e4a', '#b4b8e0', depth * 0.55);
  const pads = [[0, -60, 0], [-50, -120, -24], [46, -130, 22], [0, -180, 4], [-78, -190, -36], [70, -200, 30]]
    .slice(0, 4 + Math.round(hash(seed, 1) * 2));
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs><radialGradient id={`${id}-p`} cx="35%" cy="25%" r="80%"><stop offset="0%" stopColor={light(c, 0.4)} />
        <stop offset="65%" stopColor={c} /><stop offset="100%" stopColor={shade(c, 0.35)} /></radialGradient></defs>
      <ContactShadow x={0} y={2} w={180} opacity={0.28 * (1 - depth)} />
      {pads.map(([px, py, r], i) => (
        <g key={i} transform={`translate(${px} ${py}) rotate(${r})`}>
          <ellipse cx={0} cy={0} rx={38} ry={58} fill={`url(#${id}-p)`} stroke={line(c)} strokeWidth={6} />
          {[[-12, -20], [14, -6], [-6, 16], [12, 26]].map(([dx, dy], j) => <circle key={j} cx={dx} cy={dy} r={3} fill={light(c, 0.7)} />)}
          {i >= 3 && <circle cx={0} cy={-58} r={11} fill="#e8457a" stroke="#8a1a44" strokeWidth={4} />}
        </g>
      ))}
    </g>
  );
};

/** a yucca or sotol: a round rosette of soft blades, a flower spike on the yucca */
export const Yucca: React.FC<{x: number; y: number; s?: number; seed?: number; depth?: number; spike?: boolean}> = ({
  x, y, s = 1, seed = 1, depth = 0, spike = true,
}) => {
  const c = mix('#6f9a5a', '#c2a0b0', depth * 0.5);
  const n = 11;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ContactShadow x={0} y={2} w={150} opacity={0.28 * (1 - depth)} />
      {spike && <><path d="M0 -60 Q6 -200 0 -300" stroke="#8a6a3a" strokeWidth={8} fill="none" strokeLinecap="round" />
        {[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={(i % 2 ? 10 : -10)} cy={-300 + i * 22} r={13} fill="#fff4dc" stroke="#c9a46a" strokeWidth={3} />)}</>}
      {Array.from({length: n}).map((_, i) => {
        const a = -170 + (i / (n - 1)) * 160 + (hash(seed, i) - 0.5) * 8;
        const len = 90 + hash(seed, i + 3) * 40;
        const r = (a * Math.PI) / 180;
        return <path key={i} d={`M0 -20 Q${Math.cos(r) * len * 0.5} ${-20 + Math.sin(r) * len * 0.6} ${Math.cos(r) * len} ${-20 + Math.sin(r) * len}`}
          stroke={i % 2 ? c : shade(c, 0.2)} strokeWidth={12} strokeLinecap="round" fill="none" />;
      })}
    </g>
  );
};

/** a grass tuft, the texture every ground gets so it never reads as a flat fill */
const Tuft: React.FC<{x: number; y: number; s: number; color: string}> = ({x, y, s, color}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[-18, -8, 2, 12, 20].map((a, i) => <path key={i} d={`M${a * 0.4} 0 Q${a * 0.8} -18 ${a * 1.3} ${-34 - (i % 2) * 10}`}
      stroke={i % 2 ? color : shade(color, 0.18)} strokeWidth={6} strokeLinecap="round" fill="none" />)}
  </g>
);

/** a ranch fence: rounded cedar posts and two soft wires, drawn in perspective along a line */
export const Fence: React.FC<{y: number; x0?: number; x1?: number; pan?: number; color?: string; s?: number}> = ({
  y, x0 = -60, x1 = 1140, pan = 0, color = '#7a5a3e', s = 1,
}) => {
  const gap = 150 * s, off = ((pan % gap) + gap) % gap;
  const posts = [];
  for (let x = x0 - off; x <= x1; x += gap) posts.push(x);
  return (
    <g>
      <path d={`M${x0} ${y - 52 * s} L${x1} ${y - 52 * s} M${x0} ${y - 28 * s} L${x1} ${y - 28 * s}`} stroke={shade(color, 0.2)}
        strokeWidth={3 * s} opacity={0.8} />
      {posts.map((x, i) => <rect key={i} x={x - 7 * s} y={y - 74 * s} width={14 * s} height={78 * s} rx={7 * s} fill={color}
        stroke={line(color)} strokeWidth={3 * s} />)}
    </g>
  );
};

/** a wind turbine on the horizon, blades turning */
export const Turbine: React.FC<{x: number; y: number; s?: number; frame: number; seed?: number}> = ({x, y, s = 1, frame, seed = 1}) => {
  const a = (frame * 2.2 + seed * 47) % 360;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={0.85}>
      <path d="M-5 0 L-2 -220 L2 -220 L5 0 Z" fill="#eef1fb" stroke="#b3bce0" strokeWidth={2} />
      <g transform={`translate(0 -222) rotate(${a})`}>
        {[0, 120, 240].map((r) => <path key={r} transform={`rotate(${r})`} d="M0 0 Q6 -40 2 -110 Q-2 -110 -4 -40 Z" fill="#f6f7ff"
          stroke="#b3bce0" strokeWidth={2} />)}
        <circle r={6} fill="#dfe4f7" />
      </g>
    </g>
  );
};

/** a country grain elevator: rounded concrete silos with a headhouse */
export const Elevator: React.FC<{x: number; y: number; s?: number; depth?: number}> = ({x, y, s = 1, depth = 0.6}) => {
  const c = mix('#efe7d6', '#b8c0e6', depth * 0.6);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[-60, -20, 20].map((sx, i) => <rect key={i} x={sx} y={-170} width={40} height={170} rx={20} fill={i === 2 ? shade(c, 0.12) : c}
        stroke={line(c)} strokeWidth={3} opacity={0.95} />)}
      <rect x={-20} y={-220} width={44} height={60} rx={10} fill={shade(c, 0.08)} stroke={line(c)} strokeWidth={3} />
    </g>
  );
};

/** a pumpjack nodding, rounded and lit, the Rolling Plains' and Permian's landmark */
export const Pumpjack: React.FC<{x: number; y: number; s?: number; frame: number; depth?: number}> = ({x, y, s = 1, frame, depth = 0}) => {
  const c = mix('#3a3f5c', '#b8a8c0', depth * 0.5), hd = mix('#e8a43a', '#b8a8c0', depth * 0.5);
  const nod = Math.sin(frame / 30 * 2 * Math.PI * 0.35) * 12;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ContactShadow x={0} y={4} w={360} opacity={0.3 * (1 - depth)} />
      <rect x={-150} y={-24} width={300} height={24} rx={12} fill={shade(c, 0.1)} />
      <path d="M-30 -24 L0 -170 L30 -24" stroke={c} strokeWidth={18} strokeLinejoin="round" strokeLinecap="round" fill="none" />
      <g transform={`translate(0 -172) rotate(${nod})`}>
        <rect x={-150} y={-14} width={260} height={28} rx={14} fill={c} stroke={line(c)} strokeWidth={4} />
        <path d="M110 -40 Q160 -10 110 40 L96 40 L96 -40 Z" fill={hd} stroke={line(hd)} strokeWidth={4} />
        <circle cx={0} cy={0} r={12} fill={light(c, 0.4)} />
      </g>
      <circle cx={-110} cy={-70} r={34} fill={shade(c, 0.05)} stroke={line(c)} strokeWidth={4} />
      <path d={`M150 ${-172 + nod * 1.6} L150 -24`} stroke="#2a2840" strokeWidth={4} />
    </g>
  );
};

// --------------------------------------------------------------------------------------- the stage

const ground = (y: number, color: string, id: string, k: string) => (
  <>
    <defs><linearGradient id={`${id}-${k}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={light(color, 0.06)} />
      <stop offset="100%" stopColor={shade(color, 0.22)} /></linearGradient></defs>
    <rect x={-200} y={y} width={1480} height={2000 - y} fill={`url(#${id}-${k})`} />
  </>
);

/** a road running to the horizon's vanishing point, soft edged, with a lit centre */
const Road: React.FC<{horizon: number; color: string; curve?: number; pan?: number}> = ({horizon, color, curve = 0, pan = 0}) => {
  const vx = 540 + curve * 60 - pan * 0.05;
  return (
    <g>
      <path d={`M${vx - 8} ${horizon + 4} C${vx - 40 + curve * 120} ${horizon + 300} ${260 + curve * 80} 1500 60 1980 L1020 1980
        C${820 + curve * 80} 1500 ${vx + 40 + curve * 120} ${horizon + 300} ${vx + 8} ${horizon + 4} Z`} fill={color} />
      <path d={`M${vx} ${horizon + 10} C${vx + curve * 120} ${horizon + 300} ${540 + curve * 80} 1500 540 1980`} stroke={light(color, 0.4)}
        strokeWidth={60} opacity={0.35} fill="none" />
    </g>
  );
};

const FORE: Record<RegionId, string> = {blackland: '#5f9e3c', cross_timbers: '#c9b25a', gulf: '#6f9a52',
  high_plains: '#c9a454', hill_country: '#a9a85e', piney_woods: '#4f7f3a', post_oak: '#d9a04a', rolling_plains: '#b88a4a',
  south_texas: '#cfa95a', trans_pecos: '#b9925a'};

export const RegionBackdrop: React.FC<{region: string; frame: number; pan?: number; horizon?: number}> = ({
  region, frame, pan = 0, horizon = 1000,
}) => {
  const id = useUid();
  const r = (Object.keys(LANDS).includes(region) ? region : 'south_texas') as RegionId;
  const land = LANDS[r];
  const H = horizon;
  const tufts = (color: string, n = 26, y0 = H + 60, y1 = 1960, seed = 3) => scatter(n, seed, y0, y1, pan, 1)
    .map((p) => <Tuft key={`t${p.i}`} x={p.x} y={p.y} s={0.5 + ((p.y - H) / (1960 - H)) * 1.6} color={color} />);
  const depthAt = (y: number) => Math.max(0, Math.min(1, 1 - (y - H) / 700));

  const scene = (() => {
  switch (r) {
    case 'blackland': {
      const rows = Array.from({length: 22}).map((_, i) => {
        const t = i / 21, x = -900 + t * 2880 - ((pan * 0.6) % 131);
        return <path key={i} d={`M${540 + (x - 540) * 0.02} ${H + 6} L${x} 1980`} stroke="#6fae48" strokeWidth={10 + t * 0}
          strokeLinecap="round" opacity={0.95} />;
      });
      return (
        <g>
          <Landscape land={land} horizon={H} pan={pan} frame={frame} relief={0.12} />
          {ground(H + 4, land.near, id, 'g')}
          <GroundBands horizon={H} color={land.near} pan={pan} seed={9} />
          <g>{rows}</g>
          {Array.from({length: 22}).map((_, i) => {
            const t = i / 21, x = -900 + t * 2880 - ((pan * 0.6) % 131);
            return <path key={`h${i}`} d={`M${540 + (x - 540) * 0.02} ${H + 6} L${x} 1980`} stroke="#b9f08a" strokeWidth={3}
              strokeDasharray="6 40" opacity={0.5} />;
          })}
          <Elevator x={220 - pan * 0.08} y={H + 2} s={0.5} />
          <g transform={`translate(${880 - pan * 0.08} ${H + 2}) scale(0.45)`}><rect x={-6} y={-150} width={12} height={150} fill="#c8cbe6" />
            <ellipse cx={0} cy={-170} rx={44} ry={30} fill="#e6e9fb" stroke="#b3bce0" strokeWidth={4} /></g>
          <Oak x={400 - pan * 0.15} y={H + 10} s={0.32} depth={0.75} seed={4} frame={frame} />
          <Oak x={650 - pan * 0.15} y={H + 14} s={0.36} depth={0.72} seed={9} frame={frame} />
        </g>
      );
    }
    case 'cross_timbers':
      return (
        <g>
          <Landscape land={land} horizon={H} pan={pan} frame={frame} relief={0.4} />
          <GroundBands horizon={H} color={land.near} pan={pan} seed={13} />
          {scatter(13, 21, H - 6, H + 10, pan, 0.25).map((p) => <Oak key={p.i} x={p.x} y={p.y} s={0.42} depth={0.6}
            seed={p.i + 2} frame={frame} color="#5a8a3a" />)}
          {scatter(4, 25, H + 60, H + 170, pan, 0.45).map((p) => <Oak key={`m${p.i}`} x={p.x} y={p.y} s={0.5 + p.t * 0.25}
            depth={depthAt(p.y)} seed={p.i + 30} frame={frame} color="#5a8a3a" />)}
          <Fence y={H + 200} pan={pan * 0.6} s={0.7} />
          {tufts('#d9c46a', 30, H + 120)}
        </g>
      );
    case 'gulf':
      return (
        <g>
          <Landscape land={land} horizon={H} pan={pan} frame={frame} relief={0.05} />
          <GroundBands horizon={H} color={land.near} pan={pan} seed={4} />
          <path d={`M-40 ${H - 4} L1120 ${H - 4}`} stroke="#c8d0ee" strokeWidth={8} />
          {Array.from({length: 9}).map((_, i) => <rect key={i} x={i * 140 - ((pan * 0.1) % 140)} y={H - 4} width={6} height={18} fill="#c8d0ee" />)}
          {[120, 300, 480, 760, 940].map((x, i) => <Turbine key={i} x={x - pan * 0.05} y={H - 2} s={0.28} frame={frame} seed={i} />)}
          <defs><linearGradient id={`${id}-w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#bfe2ff" />
            <stop offset="100%" stopColor="#3f8fd0" /></linearGradient></defs>
          <path d={`M300 ${H + 6} C520 ${H + 200} 980 ${H + 300} 900 ${H + 560} S280 1700 360 1980 L1140 1980 L1140 ${H + 6} Z`}
            fill={`url(#${id}-w)`} transform={`translate(${-pan * 0.3} 0)`} />
          {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${640 + i * 60 - pan * 0.3} ${H + 300 + i * 180} q40 -10 80 0`}
            stroke="#ffffff" strokeWidth={6} strokeLinecap="round" opacity={0.5 + 0.3 * Math.sin(frame / 12 + i)} fill="none" />)}
          {tufts('#9cc06a', 34, H + 80, 1960, 7)}
        </g>
      );
    case 'high_plains':
      return (
        <g>
          <Landscape land={land} horizon={H} pan={pan} frame={frame} relief={0.04} />
          <GroundBands horizon={H} color={land.near} pan={pan} seed={11} />
          <path d={`M-40 ${H + 6} L1120 ${H + 6} L1120 ${H + 140} L620 ${H + 30} Z`} fill="#6fae48" />
          <path d={`M-40 ${H + 6} L1120 ${H + 6} L1120 ${H + 140} L620 ${H + 30} Z`} fill="url(#none)" />
          <Road horizon={H} color="#f4e6c4" pan={pan} />
          {[60, 180, 330, 700, 860, 1010].map((x, i) => <Turbine key={i} x={x - pan * 0.04} y={H + 2} s={0.3} frame={frame} seed={i} />)}
          <Elevator x={470 - pan * 0.04} y={H + 2} s={0.34} />
          {tufts('#d8b564', 30, H + 80, 1960, 11)}
        </g>
      );
    case 'hill_country':
      return (
        <g>
          <Landscape land={land} horizon={H} pan={pan} frame={frame} relief={1.5} />
          <GroundBands horizon={H} color={land.near} pan={pan} seed={12} />
          {scatter(12, 31, H + 30, H + 280, pan, 0.5).map((p) => p.k > 0.5
            ? <Oak key={p.i} x={p.x} y={p.y} s={0.38 + p.t * 0.2} depth={depthAt(p.y)} seed={p.i} frame={frame} color="#4a7f3a" spread={1.2} />
            : <Juniper key={p.i} x={p.x} y={p.y} s={0.45 + p.t * 0.25} depth={depthAt(p.y)} seed={p.i} />)}
          <Fence y={H + 300} pan={pan * 0.8} color="#8a8070" s={0.8} />
          {scatter(10, 37, H + 320, 1940, pan, 1).map((p) => <ellipse key={`r${p.i}`} cx={p.x} cy={p.y} rx={14 + p.t * 30}
            ry={8 + p.t * 16} fill="#e9e3d2" stroke="#a49a86" strokeWidth={3} />)}
          {tufts('#c8c07a', 28, H + 300, 1960, 13)}
        </g>
      );
    case 'piney_woods': {
      const left = scatter(6, 41, H + 40, H + 600, pan, 0.6).map((p) => ({...p, x: -40 + p.k * 220}));
      const right = scatter(6, 43, H + 40, H + 600, pan, 0.6).map((p) => ({...p, x: 860 + p.k * 220}));
      return (
        <g>
          <Landscape land={land} horizon={H} pan={pan} frame={frame} relief={0.3} clouds={false} />
          <GroundBands horizon={H} color={land.near} pan={pan} seed={11} />
          {scatter(16, 47, H - 10, H + 20, pan, 0.2).map((p) => <Pine key={`f${p.i}`} x={p.x} y={p.y} s={0.42} depth={0.75} seed={p.i} frame={frame} />)}
          <Road horizon={H} color="#9a5c4a" pan={pan} />
          {[...left, ...right].sort((a, b) => a.y - b.y).map((p, j) => {
            const s = 0.55 + ((p.y - H) / 600) * 1.1;
            return <g key={j}><Pine x={p.x} y={p.y} s={s} depth={depthAt(p.y) * 0.6} seed={p.i + j} frame={frame} />
              <Bush x={p.x + 60} y={p.y + 6} s={s * 0.35} seed={p.i + 3} color="#4f8a3c" trunk={false} depth={depthAt(p.y) * 0.5} /></g>;
          })}
        </g>
      );
    }
    case 'post_oak':
      return (
        <g>
          <Landscape land={land} horizon={H} pan={pan} frame={frame} relief={0.35} />
          <GroundBands horizon={H} color={land.near} pan={pan} seed={8} />
          {scatter(8, 51, H - 4, H + 220, pan, 0.4).map((p) => <Oak key={p.i} x={p.x} y={p.y} s={0.3 + p.t * 0.35}
            depth={depthAt(p.y)} seed={p.i + 5} frame={frame} color="#6a8a34" />)}
          {tufts('#e9b85a', 40, H + 60, 1960, 17)}
        </g>
      );
    case 'rolling_plains':
      return (
        <g>
          <Landscape land={land} horizon={H} pan={pan} frame={frame} relief={0.5} />
          <GroundBands horizon={H} color={land.near} pan={pan} seed={14} />
          <path d={`M640 ${H - 2} L700 ${H - 70} Q760 ${H - 82} 900 ${H - 76} L960 ${H - 2} Z`} fill="#b0705a"
            transform={`translate(${-pan * 0.1} 0)`} opacity={0.85} />
          <Pumpjack x={760 - pan * 0.35} y={H + 120} s={0.55} frame={frame} depth={0.4} />
          {scatter(8, 57, H + 20, H + 260, pan, 0.5).map((p) => <Bush key={p.i} x={p.x} y={p.y} s={0.3 + p.t * 0.3}
            seed={p.i + 9} depth={depthAt(p.y)} frame={frame} />)}
          <Fence y={H + 160} x0={-60} x1={600} pan={pan * 0.5} s={0.5} />
          {tufts('#c99a5a', 30, H + 160, 1960, 19)}
        </g>
      );
    case 'trans_pecos':
      return (
        <g>
          <Landscape land={land} horizon={H} pan={pan} frame={frame} relief={0.25} sunX={300} sunY={H - 120} clouds={false} />
          <g transform={`translate(${-pan * 0.12} 0)`}>
            <path d={`M-80 ${H + 4} L-60 ${H - 150} L140 ${H - 170} L200 ${H - 120} L420 ${H - 130} L470 ${H - 60} L640 ${H - 70}
              L700 ${H - 190} L960 ${H - 200} L1010 ${H - 140} L1160 ${H - 150} L1160 ${H + 4} Z`} fill="#d0603e" strokeLinejoin="round" />
            {[0, 1, 2].map((i) => <path key={i} d={`M-80 ${H - 120 + i * 40} L1160 ${H - 130 + i * 40}`} stroke="#b04a32" strokeWidth={6}
              opacity={0.5} />)}
            <path d={`M-60 ${H - 150} L140 ${H - 170} M700 ${H - 190} L960 ${H - 200}`} stroke="#ffb27a" strokeWidth={8} strokeLinecap="round" />
          </g>
          {ground(H + 4, land.near, id, 'g')}
          <GroundBands horizon={H} color={land.near} pan={pan} seed={11} />
          {scatter(6, 61, H + 60, H + 500, pan, 0.8).map((p) => <Yucca key={p.i} x={p.x} y={p.y} s={0.35 + p.t * 0.7}
            seed={p.i} depth={depthAt(p.y) * 0.6} spike={p.k > 0.4} />)}
          {scatter(14, 63, H + 80, 1940, pan, 1).map((p) => <ellipse key={`r${p.i}`} cx={p.x} cy={p.y} rx={10 + p.t * 26}
            ry={6 + p.t * 12} fill="#c9846a" stroke="#6b3a30" strokeWidth={3} />)}
        </g>
      );
    case 'south_texas':
    default:
      return (
        <g>
          <Landscape land={land} horizon={H} pan={pan} frame={frame} relief={0.4} />
          <GroundBands horizon={H} color={land.near} pan={pan} seed={11} />
          <Road horizon={H} color="#f6e8c8" curve={0.6} pan={pan} />
          {scatter(11, 71, H + 10, H + 240, pan, 0.4).map((p) => <Bush key={p.i} x={p.x} y={p.y} s={0.25 + p.t * 0.35}
            seed={p.i + 2} depth={depthAt(p.y)} frame={frame} />)}
          {scatter(6, 73, H + 160, H + 460, pan, 0.8).map((p) => <PricklyPear key={`p${p.i}`} x={p.x} y={p.y}
            s={0.45 + p.t * 0.5} seed={p.i} depth={depthAt(p.y) * 0.5} />)}
          {tufts('#e2c070', 28, H + 160, 1960, 23)}
        </g>
      );
  }
  })();
  return <g>{scene}<Foreground color={FORE[r]} frame={frame} seed={r.length} /></g>;
};

/**
 * The v2 region behind an exterior shot. It sits inside PlaceStage as the episode's first sibling, so
 * the plate's camera, its context and everything placed by PlaceSubject still work, and it covers the
 * baked plate with the v2 drawing of the same region. The horizon is the plate's own, mapped into the
 * frame at the shot's zoom, so a subject PlaceSubject stands on the plate's ground stands on this one.
 * Interiors, overheads and wall views keep what PlaceStage drew.
 */
export const RegionStageV2: React.FC<{frame: number; shot_s: number; scene_s: number}> = ({frame, scene_s}) => {
  const place = usePlace();
  if (!place || place.mode !== 'exterior') return null;
  const {plate, zoom} = place;
  const cy = plate.camera.cy, OY = (2208 - 1920) / 2;
  const horizon = Math.round(cy - OY + zoom * (plate.horizon_y - cy));
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}} data-region-v2={plate.region}>
      <RegionBackdrop region={plate.region} frame={frame} horizon={horizon} pan={scene_s * 14} />
    </svg>
  );
};
