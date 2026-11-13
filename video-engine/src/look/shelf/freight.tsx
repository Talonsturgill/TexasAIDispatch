import React from 'react';
import {M} from '../../lib/scale';
import {FONT} from '../../lib/type';
import {light, line, mix, shade} from '../color';
import {ContactShadow, Glow, useUid} from '../Kit';
import {Figure} from '../Figure';
import type {Place} from '../machines';

/**
 * FREIGHT, LOOK V2 (November 13th, 2026). The driverless lane, end to end.
 *
 * The roof pod, the empty cab seen from inside, the road that moves under a truck held still, the
 * weigh station gantry and the terminal dock. The truck itself is `AutoTruckV2` in look/machines.tsx,
 * which already replaces the library's AutonomousRig, so it is not drawn again here.
 *
 * Placement is the library's. The true-size pieces (SensorPodV2, WeighStationV2, DockDoorsV2) take
 * x, y at the ground and `scale` 1 as true size through lib/scale.ts, drawn in centimetres, with the
 * same origin as the library drawing so a scene can swap one for the other. CabViewV2 and LaneV2 are
 * screen pieces in the library's own box (x, y, w, h).
 *
 * `SensorPodV2` is the truck's roof pod (the library's freight SensorMast). It has its own name so it
 * never clashes with the weather mast `SensorMastV2` in look/machines.tsx.
 */
const CM = M / 100;
const at = (p: Place) => `translate(${p.x ?? 0} ${p.y ?? 0}) scale(${(p.scale ?? 1) * CM * (p.facing ?? 1)} ${(p.scale ?? 1) * CM})`;
/** about 6.5 film pixels of line, in local centimetres, at any staging scale */
const lineW = (p: Place) => 6.5 / ((p.scale ?? 1) * CM);
const CYAN = '#38f2e0';

const rnd = (seed: number, ch: number) => {
  const k = ((seed * 2654435761) ^ (ch * 40503)) >>> 0;
  return ((k >>> 8) % 10000) / 10000;
};

/** a lit material, light upper left through the fill to a violet shade */
const Lit: React.FC<{id: string; c: string; v?: boolean; k?: number}> = ({id, c, v = false, k = 1}) => (
  <linearGradient id={id} x1="0" y1="0" x2={v ? '0' : '0.4'} y2="1">
    <stop offset="0%" stopColor={light(c, 0.42 * k)} /><stop offset="48%" stopColor={c} /><stop offset="100%" stopColor={shade(c, 0.34 * k)} />
  </linearGradient>
);

// ---------------------------------------------------------------------------------- the roof pod

/**
 * THE ROOF POD, a rounded housing, the lidar drum with its glowing aperture band turning, a camera bar of
 * three lenses (the outer pair is the stereo baseline) and the low radar stub. About 0.6 m wide and
 * 0.25 m to the top of the drum, as the library measured. The drum turns slowly, as a real one reads.
 */
export const SensorPodV2: React.FC<Place & {sweeping?: boolean}> = (p) => {
  const {frame = 0, seed = 1, sweeping = true} = p;
  const id = useUid();
  const ow = lineW(p);
  const hous = '#f4f6fb', dark = '#3a3f73';
  const a = sweeping ? (frame / 30) * 150 : rnd(seed, 1) * 360;
  const band = ((a % 360) + 360) % 360 / 360;                 // where the bright window is on the drum, 0..1
  const face = Math.cos(a * Math.PI / 180);                  // the beam faces us at 1, away at -1
  return (
    <g transform={at(p)}>
      <defs>
        <Lit id={`${id}-h`} c={hous} v />
        <linearGradient id={`${id}-d`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={light(dark, 0.25)} />
          <stop offset="35%" stopColor={dark} /><stop offset="100%" stopColor={shade(dark, 0.4)} /></linearGradient>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={CYAN} stopOpacity={0.55} />
          <stop offset="100%" stopColor={CYAN} stopOpacity={0} /></linearGradient>
        <clipPath id={`${id}-dc`}><rect x={-9} y={-21.5} width={18} height={8} rx={2} /></clipPath>
      </defs>
      <ContactShadow x={0} y={0.6} w={70} opacity={0.3} />
      {/* the faint sweep, fanning toward the viewer as the drum turns past us */}
      {sweeping && face > 0 && <path d={`M8 -17.5 L${8 + 34 * face} -24 Q${10 + 37 * face} -17.5 ${8 + 34 * face} -11 Z`}
        fill={`url(#${id}-b)`} opacity={0.45 * face} />}
      {/* outline pass, then fills, so the drum and the housing join with no seam */}
      {[`M-30 0 L-30 -4 Q-30 -11 -22 -11.5 L22 -11.5 Q30 -11 30 -4 L30 0 Z`, `M-9 -11 L-9 -22 A9 3 0 0 1 9 -22 L9 -11 Z`].map((d, i) =>
        <path key={i} d={d} fill={line(hous)} stroke={line(i ? dark : hous)} strokeWidth={ow * 2} strokeLinejoin="round" />)}
      <path d="M-30 0 L-30 -4 Q-30 -11 -22 -11.5 L22 -11.5 Q30 -11 30 -4 L30 0 Z" fill={`url(#${id}-h)`} />
      <path d="M-9 -11 L-9 -22 A9 3 0 0 1 9 -22 L9 -11 Z" fill={`url(#${id}-d)`} />
      <ellipse cx={0} cy={-22} rx={9} ry={3} fill={light(dark, 0.35)} />
      <ellipse cx={-2.5} cy={-22.6} rx={4} ry={1} fill="#ffffff" opacity={0.4} />
      {/* the aperture band, and the brighter window on it that travels round as the drum turns */}
      <rect x={-9} y={-20} width={18} height={4.6} rx={2.3} fill="#1d2150" />
      <g clipPath={`url(#${id}-dc)`}>
        <rect x={-9} y={-20} width={18} height={4.6} rx={2.3} fill={CYAN} opacity={0.35} />
        <rect x={-14 + band * 28} y={-20} width={6} height={4.6} rx={2.3} fill={CYAN} opacity={0.95} />
      </g>
      {/* sheen along the housing top */}
      <path d="M-24 -9.6 Q-6 -10.6 14 -10" stroke="#ffffff" strokeWidth={1.6} strokeLinecap="round" opacity={0.75} fill="none" />
      {/* camera bar with three lenses, unevenly spaced, each with a catchlight */}
      <rect x={-22} y={-7.4} width={44} height={4.6} rx={2.3} fill={dark} stroke={line(dark)} strokeWidth={ow * 0.8} />
      {[-15.5, -2, 15.5].map((cx) => <g key={cx}>
        <circle cx={cx} cy={-5.1} r={1.7} fill="#5aa2ff" /><circle cx={cx - 0.5} cy={-5.6} r={0.55} fill="#ffffff" /></g>)}
      {/* radar stub, low and forward */}
      <rect x={-5} y={-2.2} width={10} height={2.6} rx={1.3} fill="#8a90b0" stroke={line('#8a90b0')} strokeWidth={ow * 0.6} />
    </g>
  );
};

// ---------------------------------------------------------------------------------- the empty seat

/**
 * THE CAB FROM INSIDE, the empty seat at a size where empty is legible. Rounded glass with the road
 * running in it, a lit dash, a seat with its belt hanging slack against the pillar, and a wheel that
 * turns a little with nobody on it while the autonomy lamp on the cluster breathes. `occupied` seats a
 * safety driver, a different fact rather than a different drawing. Screen units, the library's box.
 */
export const CabViewV2: React.FC<{x?: number; y?: number; w?: number; h?: number; frame?: number; seed?: number; occupied?: boolean;
  speed?: number}> = ({x = 0, y = 0, w = 720, h = 460, frame = 0, seed = 3, occupied = false, speed = 1}) => {
  const id = useUid();
  const k = Math.min(w / 640, h / 340);                       // seat and wheel grow with the box, so empty stays legible
  const ow = 6.5;
  const cab = '#3f4377', seatC = '#c0603a';
  const wheelDeg = Math.sin(frame / 47) * 4 * speed;
  const march = (frame * speed * 0.03) % 1;
  // the windshield, a rounded trapezoid
  const g = {l: w * 0.08, r: w * 0.92, bl: w * 0.14, br: w * 0.86, t: h * 0.06, b: h * 0.52}, rr = Math.min(w, h) * 0.06;
  const glass = `M${g.l + rr} ${g.t} L${g.r - rr} ${g.t} Q${g.r} ${g.t} ${g.r - 2} ${g.t + rr} L${g.br + 2} ${g.b - rr} Q${g.br} ${g.b} ${g.br - rr} ${g.b}`
    + ` L${g.bl + rr} ${g.b} Q${g.bl} ${g.b} ${g.bl - 2} ${g.b - rr} L${g.l + 2} ${g.t + rr} Q${g.l} ${g.t} ${g.l + rr} ${g.t} Z`;
  const vx = w * 0.5, vy = h * 0.3;                            // the vanishing point on the horizon
  const roadW = w * 0.62;
  const dashes = Array.from({length: 7}, (_, i) => {
    const u = ((i / 7) + march) % 1;                           // 0 at the horizon, 1 at the glass bottom
    const e = u * u;
    const yy = vy + (h * 0.56 - vy) * e, ww = 2 + 16 * e * k, hh = 3 + 22 * e * k;
    return <rect key={i} x={vx - ww / 2} y={yy - hh / 2} width={ww} height={hh} rx={ww / 2} fill="#fff6dc" opacity={0.95} />;
  });
  const seatX = w * 0.3, seatY = h * 0.52;
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5aa2ff" />
          <stop offset="100%" stopColor="#ffe6b8" /></linearGradient>
        <linearGradient id={`${id}-land`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e8b25e" />
          <stop offset="100%" stopColor="#c9853a" /></linearGradient>
        <linearGradient id={`${id}-road`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8a84a8" />
          <stop offset="100%" stopColor="#4e4868" /></linearGradient>
        <linearGradient id={`${id}-int`} x1="0" y1="0" x2="0.3" y2="1"><stop offset="0%" stopColor={light(cab, 0.18)} />
          <stop offset="55%" stopColor={cab} /><stop offset="100%" stopColor={shade(cab, 0.4)} /></linearGradient>
        <Lit id={`${id}-seat`} c={seatC} />
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#ffffff" stopOpacity={0.32} />
          <stop offset="45%" stopColor="#ffffff" stopOpacity={0.04} /><stop offset="100%" stopColor="#ffffff" stopOpacity={0} /></linearGradient>
        <clipPath id={`${id}-g`}><path d={glass} /></clipPath>
        <clipPath id={`${id}-all`}><rect x={0} y={0} width={w} height={h} rx={rr * 1.2} /></clipPath>
        <clipPath id={`${id}-up`}><path d={`M-10 -10 L${w + 10} -10 L${w + 10} ${h * 0.5} Q${w * 0.5} ${h * 0.46} -10 ${h * 0.5} Z`} /></clipPath>
      </defs>
      <g clipPath={`url(#${id}-all)`}>
        <rect x={0} y={0} width={w} height={h} fill={`url(#${id}-int)`} />
        {/* the world through the glass, paler with distance */}
        <g clipPath={`url(#${id}-g)`}>
          <rect x={0} y={0} width={w} height={h} fill={`url(#${id}-sky)`} />
          <Glow x={w * 0.72} y={h * 0.16} r={h * 0.22} color="#fff3c4" opacity={0.9} />
          <circle cx={w * 0.72} cy={h * 0.16} r={h * 0.04} fill="#fff6dc" />
          <path d={`M0 ${vy} Q${w * 0.2} ${vy - h * 0.05} ${w * 0.4} ${vy - h * 0.01} T${w} ${vy - h * 0.03} L${w} ${h} L0 ${h} Z`} fill="#c9b8ef" />
          <rect x={0} y={vy} width={w} height={h} fill={`url(#${id}-land)`} />
          <path d={`M${vx - 4} ${vy} L${vx + 4} ${vy} L${vx + roadW / 2} ${h * 0.6} L${vx - roadW / 2} ${h * 0.6} Z`} fill={`url(#${id}-road)`} />
          <path d={`M${vx - 6} ${vy} L${vx - roadW * 0.46} ${h * 0.6} M${vx + 6} ${vy} L${vx + roadW * 0.46} ${h * 0.6}`} stroke="#fff6dc"
            strokeWidth={4 * k} strokeLinecap="round" opacity={0.9} />
          {dashes}
          <rect x={0} y={0} width={w} height={h} fill={`url(#${id}-sheen)`} />
          <path d={`M${w * 0.62} ${g.t + 8} L${w * 0.5} ${g.b - 8}`} stroke="#ffffff" strokeWidth={14 * k} strokeLinecap="round" opacity={0.12} />
        </g>
        <path d={glass} fill="none" stroke={line(cab)} strokeWidth={ow * 1.6} strokeLinejoin="round" />
        <path d={glass} fill="none" stroke={light(cab, 0.3)} strokeWidth={ow * 0.5} strokeLinejoin="round" opacity={0.6} />
        {/* the dash, a rounded lip under the glass, lit along its top */}
        <path d={`M-10 ${h * 0.5} Q${w * 0.5} ${h * 0.46} ${w + 10} ${h * 0.5} L${w + 10} ${h + 10} L-10 ${h + 10} Z`} fill={`url(#${id}-int)`}
          stroke={line(cab)} strokeWidth={ow} />
        <path d={`M${w * 0.04} ${h * 0.505} Q${w * 0.5} ${h * 0.47} ${w * 0.96} ${h * 0.505}`} stroke={light(cab, 0.45)} strokeWidth={5 * k}
          strokeLinecap="round" fill="none" opacity={0.7} />
        {/* the seat back and whoever is or is not in it, both cut by the dash line so the dash stands in front */}
        <g clipPath={`url(#${id}-up)`}>
        <g transform={`translate(${seatX} ${seatY}) scale(${k})`}>
          <path d="M-62 0 Q-70 -112 -40 -128 Q0 -138 34 -128 Q62 -112 58 0 Z" fill={`url(#${id}-seat)`} stroke={line(seatC)} strokeWidth={ow / k}
            strokeLinejoin="round" />
          <path d="M-26 -150 Q0 -158 26 -150 Q32 -126 22 -122 L-22 -122 Q-32 -126 -26 -150 Z" fill={`url(#${id}-seat)`} stroke={line(seatC)}
            strokeWidth={ow / k} strokeLinejoin="round" />
          <path d="M-44 -100 Q-4 -112 40 -100 M-48 -60 Q-4 -72 44 -60" stroke={shade(seatC, 0.3)} strokeWidth={5} strokeLinecap="round" fill="none" />
          <path d="M-50 -108 Q-44 -120 -30 -124" stroke={light(seatC, 0.5)} strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.8} />
        </g>
        {occupied
          ? <g>
            <Figure frame={frame} x={seatX} y={seatY + 80 * k} scale={0.42 * k} pose="stand" emotion="determined" top="hivis"
              shirt="#ffb020" hat="cap" hatColor="#2a6fdb" turn={0.5} seed={seed} />
            <path d={`M${seatX + 28 * k} ${seatY - 60 * k} L${seatX - 24 * k} ${seatY - 2 * k}`} stroke="#24213a" strokeWidth={9 * k}
              strokeLinecap="round" opacity={0.85} />
          </g>
          : <g>
            {/* the belt, hanging slack against the pillar, what a viewer reads before the empty cushion */}
            <path d={`M${seatX + 46 * k} ${seatY - 124 * k} Q${seatX + 60 * k} ${seatY - 60 * k} ${seatX + 44 * k} ${seatY - 4 * k}`}
              stroke={line('#3a3550')} strokeWidth={13 * k} strokeLinecap="round" fill="none" />
            <path d={`M${seatX + 46 * k} ${seatY - 124 * k} Q${seatX + 60 * k} ${seatY - 60 * k} ${seatX + 44 * k} ${seatY - 4 * k}`}
              stroke="#5b5578" strokeWidth={7 * k} strokeLinecap="round" fill="none" />
            <rect x={seatX + 37 * k} y={seatY - 30 * k} width={14 * k} height={22 * k} rx={4 * k} fill="#d9dde8" stroke={line('#d9dde8')}
              strokeWidth={3} />
          </g>}
        </g>
        {/* the A pillars, soft and rounded */}
        {[[g.l, g.bl, -1], [g.r, g.br, 1]].map(([t, b, sd]) => (
          <path key={sd} d={`M${t} ${g.t - 20} L${b} ${g.b + 4} L${b + sd * w * 0.09} ${g.b + 4} L${t + sd * w * 0.09} ${g.t - 20} Z`}
            fill={sd < 0 ? light(cab, 0.1) : shade(cab, 0.25)} stroke={line(cab)} strokeWidth={ow} strokeLinejoin="round" />))}
        {/* the cluster, lit gauges and the autonomy lamp, breathing because the truck is awake */}
        <g transform={`translate(${seatX} ${h * 0.55}) scale(${k})`}>
          <rect x={-78} y={-6} width={156} height={34} rx={17} fill="#141634" stroke={line('#141634')} strokeWidth={3} />
          {[-46, 46].map((cx) => <g key={cx}><circle cx={cx} cy={11} r={11} fill="#1d2150" stroke="#5aa2ff" strokeWidth={3} />
            <path d={`M${cx} 11 L${cx + 7 * Math.cos(frame / 20 + cx)} ${11 - 7 * Math.abs(Math.sin(frame / 20 + cx))}`} stroke="#ffcc66"
              strokeWidth={2.4} strokeLinecap="round" /></g>)}
          <rect x={-18} y={3} width={36} height={16} rx={8} fill={CYAN} opacity={occupied ? 0.25 : 0.55 + 0.45 * Math.sin(frame / 9)} />
        </g>
        {/* the route screen on the dash, the lane ahead as a line, and the truck's dot riding it */}
        <g transform={`translate(${w * 0.72} ${h * 0.6}) scale(${k})`}>
          <rect x={-62} y={-30} width={124} height={74} rx={18} fill="#141634" stroke={line('#141634')} strokeWidth={4} />
          <rect x={-54} y={-22} width={108} height={58} rx={12} fill="#1d2a6a" />
          <path d="M-40 26 Q-10 10 0 -2 Q12 -16 42 -16" stroke={CYAN} strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.85} />
          {(() => {
            const u = (frame / 90) % 1, q = 1 - u;
            const px = q * q * -40 + 2 * q * u * -2 + u * u * 42, py = q * q * 26 + 2 * q * u * 0 + u * u * -16;
            return <circle cx={px} cy={py} r={7} fill="#ffffff" stroke={CYAN} strokeWidth={3} />;
          })()}
          <rect x={-46} y={-16} width={40} height={8} rx={4} fill="#ffffff" opacity={0.25} />
        </g>
        {/* the wheel, turning a little even with nobody on it */}
        <g transform={`translate(${seatX} ${h * 0.64}) scale(${k}) rotate(${wheelDeg})`}>
          <circle r={64} fill="none" stroke={line('#24213a')} strokeWidth={22} />
          <circle r={64} fill="none" stroke="#2f2b4d" strokeWidth={14} />
          <path d="M-46 -40 A64 64 0 0 1 30 -56" stroke="#7d78a8" strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.8} />
          <path d="M-56 12 Q0 4 56 12 M0 12 L0 56" stroke={line('#24213a')} strokeWidth={17} strokeLinecap="round" />
          <path d="M-56 12 Q0 4 56 12 M0 12 L0 56" stroke="#2f2b4d" strokeWidth={10} strokeLinecap="round" />
          <circle cx={0} cy={20} r={20} fill="#2f2b4d" stroke={line('#24213a')} strokeWidth={4} />
          <circle cx={0} cy={20} r={9} fill={CYAN} opacity={occupied ? 0.2 : 0.75} />
        </g>
        {/* the folded mirror arm, side chosen by the seed so two cab shots are not one cab */}
        <path d={`M${w * (rnd(seed, 2) > 0.5 ? 0.06 : 0.94)} ${h * 0.2} l${rnd(seed, 2) > 0.5 ? -26 : 26} 0`} stroke={line(cab)} strokeWidth={10}
          strokeLinecap="round" />
      </g>
      <rect x={0} y={0} width={w} height={h} rx={rr * 1.2} fill="none" stroke={line(cab)} strokeWidth={ow} />
    </g>
  );
};

// ---------------------------------------------------------------------------------- the road

/**
 * THE LANE, the thing that actually moves. Warm violet asphalt lit from above, round-ended skip
 * dashes marching, a shoulder line and its rumble strip, a grass median and the far carriageway paler
 * across it. Screen units, the library's box.
 */
export const LaneV2: React.FC<{x?: number; y?: number; w?: number; h?: number; frame?: number; speed?: number; seed?: number;
  divided?: boolean}> = ({x = 0, y = 0, w = 1080, h = 300, frame = 0, speed = 1, seed = 4, divided = true}) => {
  const id = useUid();
  const march = (frame * speed * 22) % 220;
  const tar = '#6a6288', grass = '#7fae4a';
  const r = Math.min(26, h * 0.1);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-t`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={light(tar, 0.18)} />
          <stop offset="55%" stopColor={tar} /><stop offset="100%" stopColor={shade(tar, 0.3)} /></linearGradient>
        <linearGradient id={`${id}-far`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={mix(light(tar, 0.3), '#b9b4e8', 0.35)} />
          <stop offset="100%" stopColor={mix(tar, '#b9b4e8', 0.3)} /></linearGradient>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={light(grass, 0.25)} />
          <stop offset="100%" stopColor={shade(grass, 0.2)} /></linearGradient>
        <clipPath id={`${id}-c`}><rect x={x} y={divided ? y - h * 0.42 : y} width={w} height={divided ? h * 1.42 : h} rx={r} /></clipPath>
      </defs>
      <g clipPath={`url(#${id}-c)`}>
        {divided && <g>
          <rect x={x} y={y - h * 0.42} width={w} height={h * 0.32} fill={`url(#${id}-far)`} />
          {Array.from({length: 6}, (_, i) => <rect key={i} x={x - 300 + ((i * 300 - march * 0.7) % (w + 600) + (w + 600)) % (w + 600)}
            y={y - h * 0.28} width={90} height={7} rx={3.5} fill="#f6f1ff" opacity={0.6} />)}
          <rect x={x} y={y - h * 0.12} width={w} height={h * 0.15} fill={`url(#${id}-g)`} />
          {Array.from({length: Math.ceil(w / 46)}, (_, i) => {
            const q = rnd(seed, i);
            return <ellipse key={i} cx={x + i * 46 + q * 20} cy={y - h * 0.02 - q * h * 0.04} rx={10 + q * 8} ry={5 + q * 3} fill={light(grass, 0.35)}
              opacity={0.55} />;
          })}
        </g>}
        <rect x={x} y={y} width={w} height={h} fill={`url(#${id}-t)`} />
        {/* the lit near edge of the carriageway and the soft occlusion under the median curb */}
        <rect x={x} y={y} width={w} height={Math.max(4, h * 0.03)} fill={shade(tar, 0.45)} opacity={0.5} />
        <rect x={x} y={y + h * 0.04} width={w} height={h * 0.03} fill="#ffffff" opacity={0.1} />
        {/* the seam between the two paving lanes */}
        <path d={`M${x} ${y + h * 0.52 + 8} q${w * 0.3} 2 ${w * 0.55} 0 t${w * 0.45} 0`} stroke={shade(tar, 0.18)} strokeWidth={3}
          strokeLinecap="round" fill="none" opacity={0.7} />
        {/* the skip line, marching, round ended */}
        {Array.from({length: Math.ceil((w + 440) / 220)}, (_, i) => <rect key={i} x={x - 220 + ((i * 220 + march) % (w + 440))}
          y={y + h * 0.5 - 6} width={112} height={12} rx={6} fill="#fff6dc" stroke={shade('#fff6dc', 0.25)} strokeWidth={1.5} />)}
        {/* speed streaks in the tar, only at speed */}
        {speed > 0.4 && Array.from({length: 4}, (_, i) => {
          const sx = x + ((i * 397 + frame * speed * 40) % (w + 300)) - 150;
          return <path key={i} d={`M${sx} ${y + h * (0.22 + i * 0.17)} l-${90 + i * 20} 0`} stroke="#ffffff" strokeWidth={5} strokeLinecap="round"
            opacity={0.12 * speed} />;
        })}
        {/* the shoulder line and the rumble strip cut into it */}
        <rect x={x - 10} y={y + h * 0.86} width={w + 20} height={8} rx={4} fill="#fff6dc" />
        {Array.from({length: Math.ceil(w / 17)}, (_, i) => <rect key={i} x={x + i * 17} y={y + h * 0.925} width={9} height={10} rx={4.5}
          fill={shade(tar, 0.35)} opacity={0.8} />)}
        {/* a caliche pull-off, seeded so no two shots of one road match */}
        <ellipse cx={x + w * (0.2 + rnd(seed, 1) * 0.6)} cy={y + h * 0.99} rx={w * 0.13} ry={h * 0.06} fill="#e2c49a" opacity={0.75} />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------------- the weigh station

/**
 * THE WEIGH STATION, two rounded posts and a truss over the lane, a sign that says OPEN or CLOSED in
 * light (the open lamps pulse), and the scale deck set into the pavement, which is the instrument. 5.6 m
 * to the top of the gantry, the left post at the origin as in the library.
 */
export const WeighStationV2: React.FC<Place & {open?: boolean; wear?: number}> = (p) => {
  const {frame = 0, open = true} = p;
  const id = useUid();
  const ow = lineW(p);
  const steel = '#b8c0dc', sign = '#1d2150', lamp = open ? '#ffb020' : '#7a7f99';
  const pulse = open ? 0.75 + 0.25 * Math.sin(frame / 30 * 2 * Math.PI * 0.7) : 0.5;
  const posts = [[0, 0], [490, 0]];
  return (
    <g transform={at(p)}>
      <defs><Lit id={`${id}-s`} c={steel} /><Lit id={`${id}-n`} c={sign} />
        <linearGradient id={`${id}-d`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8a84a8" /><stop offset="100%" stopColor="#5b5578" />
        </linearGradient></defs>
      <ContactShadow x={0} y={4} w={150} opacity={0.32} />
      <ContactShadow x={490} y={4} w={150} opacity={0.32} />
      {/* the scale deck, set into the pavement */}
      <rect x={80} y={-22} width={330} height={26} rx={13} fill={`url(#${id}-d)`} stroke={line('#6a6288')} strokeWidth={ow} />
      <path d="M100 -14 L390 -14" stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.25} />
      {/* outline pass for the posts and the truss, then their fills */}
      {posts.map(([px], i) => <rect key={`o${i}`} x={px - 24} y={-540} width={48} height={540} rx={24} fill={line(steel)} stroke={line(steel)}
        strokeWidth={ow * 2} />)}
      <rect x={-30} y={-562} width={550} height={60} rx={30} fill={line(steel)} stroke={line(steel)} strokeWidth={ow * 2} />
      {posts.map(([px], i) => <rect key={`f${i}`} x={px - 24} y={-540} width={48} height={540} rx={24} fill={`url(#${id}-s)`} />)}
      <rect x={-30} y={-562} width={550} height={60} rx={30} fill={`url(#${id}-s)`} />
      {/* the truss web inside the beam */}
      {Array.from({length: 7}, (_, i) => <path key={i} d={`M${20 + i * 70} -514 L${55 + i * 70} -550 L${90 + i * 70} -514`} stroke={shade(steel, 0.3)}
        strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" />)}
      <path d="M-10 -552 L500 -552" stroke="#ffffff" strokeWidth={7} strokeLinecap="round" opacity={0.55} />
      {posts.map(([px], i) => <path key={`h${i}`} d={`M${px - 10} -500 L${px - 10} -40`} stroke="#ffffff" strokeWidth={7} strokeLinecap="round"
        opacity={0.4} />)}
      {/* the sign, hung on two short drops */}
      {[160, 330].map((hx) => <path key={hx} d={`M${hx} -504 L${hx} -476`} stroke={shade(steel, 0.35)} strokeWidth={12} strokeLinecap="round" />)}
      <rect x={110} y={-478} width={270} height={130} rx={34} fill={`url(#${id}-n)`} stroke={line(sign)} strokeWidth={ow} />
      <rect x={124} y={-468} width={242} height={26} rx={13} fill="#ffffff" opacity={0.1} />
      <Glow x={245} y={-412} r={150} color={lamp} opacity={open ? 0.35 * pulse : 0.05} />
      <text x={245} y={-394} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={open ? 62 : 52} letterSpacing={4}
        fill={lamp} opacity={open ? pulse : 0.8}>{open ? 'OPEN' : 'CLOSED'}</text>
      {[136, 354].map((cx) => <circle key={cx} cx={cx} cy={-412} r={10} fill={lamp} opacity={open ? (Math.floor(frame / 15) % 2 === (cx > 200 ? 1 : 0) ? 1 : 0.3) : 0.4} />)}
    </g>
  );
};

// ---------------------------------------------------------------------------------- the dock

/**
 * THE TERMINAL DOCK, a warm wall with a rounded parapet and a rank of roll-up doors on raised aprons,
 * rubber bumpers, a lamp over each bay (green free, amber busy) and, where a bay is `occupied`, the
 * door rolled up on a trailer's rounded tail backed in. 4.3 m to the top of a door's frame, the wall
 * starting where the library's does.
 */
export const DockDoorsV2: React.FC<Place & {doors?: number; occupied?: number[]; wear?: number}> = (p) => {
  const {frame = 0, doors = 5, occupied = [1, 3]} = p;
  const id = useUid();
  const ow = lineW(p);
  const u = 4.3;                                              // centimetres per library unit (4.3 m over 100 units)
  const wall = '#e0b48a', door = '#c9cfe8', trailer = '#f4f6fb';
  const W = (doors * 62 + 28) * u, x0 = -14 * u, H = 104 * u;
  const dw = 46 * u, pitch = 62 * u;
  return (
    <g transform={at(p)}>
      <defs><Lit id={`${id}-w`} c={wall} /><Lit id={`${id}-d`} c={door} v /><Lit id={`${id}-t`} c={trailer} v />
        <linearGradient id={`${id}-in`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#141634" /><stop offset="100%" stopColor="#2b2d4a" />
        </linearGradient></defs>
      <ContactShadow x={x0 + W / 2} y={6} w={W * 1.08} opacity={0.3} />
      {/* the wall and its parapet cap */}
      <rect x={x0} y={-H} width={W} height={H} rx={40} fill={`url(#${id}-w)`} stroke={line(wall)} strokeWidth={ow} />
      <rect x={x0 - 20} y={-H - 18} width={W + 40} height={50} rx={25} fill={shade(wall, 0.15)} stroke={line(wall)} strokeWidth={ow} />
      <path d={`M${x0 + 10} ${-H - 4} L${x0 + W - 10} ${-H - 4}`} stroke="#ffffff" strokeWidth={8} strokeLinecap="round" opacity={0.45} />
      {Array.from({length: doors}, (_, i) => {
        const dx = (i * 62 + 8) * u, busy = occupied.includes(i);
        const lampC = busy ? '#ffb020' : '#5ee08a';
        const on = busy ? 0.7 + 0.3 * Math.sin(frame / 30 * 2 * Math.PI * 0.9 + i) : 1;
        return (
          <g key={i}>
            {/* the raised apron and its leveller lip */}
            <rect x={dx - 10} y={-22 * u} width={dw + 20} height={22 * u} rx={18} fill={shade(wall, 0.25)} stroke={line(wall)} strokeWidth={ow * 0.8} />
            <rect x={dx} y={-22 * u - 6} width={dw} height={14} rx={7} fill="#8a90b0" />
            {/* the door frame and the door or the open bay */}
            <rect x={dx - 12} y={-88 * u} width={dw + 24} height={67 * u} rx={22} fill={shade(wall, 0.32)} />
            {busy ? <g>
              <rect x={dx} y={-86 * u} width={dw} height={64 * u} rx={14} fill={`url(#${id}-in)`} />
              <rect x={dx} y={-86 * u} width={dw} height={20 * u} rx={14} fill={`url(#${id}-d)`} stroke={line(door)} strokeWidth={ow * 0.7} />
              {/* the trailer tail backed into the bay, rounded, with its doors and lamps */}
              <rect x={dx - 10} y={-66 * u} width={dw + 20} height={66 * u - 22 * u + 10} rx={20} fill={`url(#${id}-t)`} stroke={line(trailer)}
                strokeWidth={ow} />
              <path d={`M${dx + dw / 2} ${-64 * u} L${dx + dw / 2} ${-24 * u}`} stroke={shade(trailer, 0.3)} strokeWidth={6} strokeLinecap="round" />
              {[0.32, 0.68].map((t) => <rect key={t} x={dx + dw * t - 5} y={-50 * u} width={10} height={60} rx={5} fill="#7a7f99" />)}
              {[dx + 6, dx + dw - 22].map((lx) => <rect key={lx} x={lx} y={-28 * u} width={16} height={22} rx={8} fill="#ff5a5a" />)}
            </g> : <g>
              <rect x={dx} y={-86 * u} width={dw} height={64 * u} rx={14} fill={`url(#${id}-d)`} stroke={line(door)} strokeWidth={ow * 0.8} />
              {Array.from({length: 6}, (_, j) => <path key={j} d={`M${dx + 12} ${(-78 + j * 10) * u} L${dx + dw - 12} ${(-78 + j * 10) * u}`}
                stroke={shade(door, 0.25)} strokeWidth={5} strokeLinecap="round" />)}
              <rect x={dx + dw / 2 - 18} y={-30 * u} width={36} height={12} rx={6} fill={shade(door, 0.4)} />
              <path d={`M${dx + 16} ${-82 * u} L${dx + dw * 0.45} ${-82 * u}`} stroke="#ffffff" strokeWidth={6} strokeLinecap="round" opacity={0.5} />
            </g>}
            {/* rubber bumpers */}
            {[dx - 6, dx + dw - 22].map((bx) => <rect key={bx} x={bx} y={-27 * u} width={28} height={14 * u} rx={12} fill="#2b2d4a"
              stroke={line('#2b2d4a')} strokeWidth={ow * 0.6} />)}
            {/* the bay lamp */}
            <rect x={dx + dw / 2 - 30} y={-97 * u} width={60} height={30} rx={15} fill="#2b2d4a" />
            <circle cx={dx + dw / 2} cy={-97 * u + 15} r={10} fill={lampC} opacity={on} />
            <Glow x={dx + dw / 2} y={-97 * u + 15} r={50} color={lampC} opacity={0.4 * on} />
          </g>
        );
      })}
    </g>
  );
};

export const FREIGHT_V2 = ['SensorPodV2', 'CabViewV2', 'LaneV2', 'WeighStationV2', 'DockDoorsV2'] as const;
