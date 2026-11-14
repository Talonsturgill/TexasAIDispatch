import React from 'react';
import {FONT} from '../../lib/type';
import {light, line, mix, shade} from '../color';
import {ContactShadow, Glow, clamp01, useUid} from '../Kit';
import {Visor, type MachineMood} from '../machines';
import {Ball, CM, Cyl, Label, Lit, Pass, Sheen, Tyre, ell, f1, owOf, rr} from './agriculture';

/**
 * IRRIGATION, LOOK V2 (November 14th, 2026).
 *
 * The irrigation advice beat of lib/irrigation.tsx redrawn in the v2 idiom. Six drawings. One is a
 * machine at true size (the pivot rig close up), the rest are the beat's editorial pictures in the
 * library's own screen units (a radar estimate cutaway, the observations that feed it, the farmland
 * plates a scene stands on, the advice card and the field day notice), so a scene that swaps a
 * library call for its V2 keeps every coordinate, every `progress` beat and every caption string.
 *
 * The library's restraint is kept. The machine is illustrative and not a named producer's
 * installation, the cutaway's depths are editorial and not a measurement, and every word on a card
 * comes from the caller. What changes is the hand, rounded lit panels, saturated working colours,
 * deep lines of each fill's own hue in place of one ink, text with a deep rim so it reads on a bright
 * plate or a dark one, and something alive on `frame` in each.
 *
 * The pivot rig's sensor pod is the hero of its shot, so it takes the machines' Visor face when a
 * board gives `mood`, and none by default. The satellite in the radar estimate takes one the same way.
 */
export const IRRIGATION_V2_M: Record<string, {h: number; note: string}> = {
  pivotRig: {h: 4.5, note: 'a pivot tower close up, ground to the top of the arched pipe'},
};

type At = {x?: number; y?: number; scale?: number; frame?: number; progress?: number};
const cap = clamp01;
const C = {steel: '#c9d3e6', rust: '#d0703a', soil: '#9a6038', earth: '#d9a45a', leaf: '#5f9e3a', water: '#2aa6e8', paper: '#fbf5e3',
  ink: '#2a2440', sky: '#5aa2ff'};
/** the stroke that reads on any plate, its own deep line under it, then the bright stroke */
const Duo: React.FC<{d: string; c: string; w: number; op?: number; dash?: string; off?: number}> = ({d, c, w, op = 1, dash, off}) => (
  <g opacity={op}>
    <path d={d} fill="none" stroke={line(c)} strokeWidth={w * 2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} strokeDashoffset={off} />
    <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} strokeDashoffset={off} />
  </g>
);
/** a lit leaf, a pointed blade along a curve, its outline under it */
const leafD = (x0: number, y0: number, x1: number, y1: number, wd: number) => {
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, nx = -(y1 - y0), ny = x1 - x0, nl = Math.hypot(nx, ny) || 1;
  const k = wd / nl;
  return `M${f1(x0)} ${f1(y0)} Q${f1(mx + nx * k)} ${f1(my + ny * k)} ${f1(x1)} ${f1(y1)} Q${f1(mx - nx * k * 0.4)} ${f1(my - ny * k * 0.4)} ${f1(x0)} ${f1(y0)} Z`;
};
/** a young crop plant in screen units, a stem and four lit blades, nodding on `frame` */
const Sprout: React.FC<{x: number; y: number; s: number; frame: number; k: number; c?: string; lw?: number}> = ({x, y, s, frame, k, c = C.leaf, lw = 3}) => {
  const nod = Math.sin(frame / 30 * 1.4 + k) * 4;
  const blades = [[-1, -30, 46], [1, -40, 42], [-1, -54, 34], [1, -62, 28]].map(([sd, yy, l], j) =>
    leafD(nod * (yy / -70), yy, sd * l + nod, yy - l * 0.45, (j % 2 ? -1 : 1) * l * 0.32 * sd));
  const stem = `M0 0 Q${f1(nod * 0.4)} -40 ${f1(nod)} -74`;
  return <g transform={`translate(${f1(x)} ${f1(y)}) scale(${s})`}>
    <path d={stem} stroke={line(c)} strokeWidth={5 + lw * 2} fill="none" strokeLinecap="round" />
    {blades.map((d, j) => <path key={`o${j}`} d={d} fill={line(c)} stroke={line(c)} strokeWidth={lw * 2} strokeLinejoin="round" />)}
    <path d={stem} stroke={shade(c, 0.1)} strokeWidth={5} fill="none" strokeLinecap="round" />
    {blades.map((d, j) => <path key={j} d={d} fill={j % 2 ? c : light(c, 0.18)} />)}
  </g>;
};

// ===================================================================================== PIVOT RIG

/**
 * A PIVOT TOWER, CLOSE UP. One arched span of pipe across the frame on its truss, the A frame tower
 * on two big turning tyres with the gearbox between them, drop hoses with weighted yellow nozzles and
 * water falling from each, and with `sensor` a sensor pod hung from the pipe looking down at the crop
 * with radio rings leaving it (the pod is the face when `mood` is given). `progress` drifts the rig
 * across the frame as the library's does. True size 4.5 m to the top of the arch.
 */
export const PivotRigV2: React.FC<At & {sensor?: boolean; spray?: boolean; label?: string; opacity?: number; mood?: MachineMood}> = ({
  x = 540, y = 1450, scale = 1, frame = 0, progress = 0, sensor = false, spray = true, label = '', opacity = 1, mood,
}) => {
  const id = useUid();
  const ow = owOf(scale);
  const t = frame / 30;
  const drift = Math.sin(progress * Math.PI * 0.6) * 35;
  const steel = C.steel, pod = '#3d7bd9';
  const pipeY = (px: number) => px <= 352 ? -466 + 0.000279 * (px + 104) ** 2 : -408 + (px - 352) * (86 / 348);
  const xs = Array.from({length: 33}, (_, i) => -620 + i * 41);
  const pipe = `M${xs.map((px) => `${px} ${f1(pipeY(px))}`).join(' L')}`;
  const chord = `M${xs.map((px) => `${px} ${f1(pipeY(px) + 64)}`).join(' L')}`;
  const zig = Array.from({length: 15}, (_, i) => {
    const px = -600 + i * 88;
    return `${i ? 'L' : 'M'}${px} ${f1(pipeY(px) + (i % 2 ? 64 : 6))}`;
  }).join(' ');
  const drops = [-420, 18, 352, 630];
  return (
    <g opacity={opacity} transform={`translate(${f1(x + drift)} ${y}) scale(${scale * CM})`}>
      <defs><Lit id={`${id}-s`} c={steel} /><Lit id={`${id}-pod`} c={pod} /><Lit id={`${id}-gb`} c="#3d7bd9" />
        <linearGradient id={`${id}-w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={light(C.water, 0.4)} stopOpacity={0.9} />
          <stop offset="100%" stopColor={C.water} stopOpacity={0.05} /></linearGradient></defs>
      <ContactShadow x={-166} y={4} w={560} opacity={0.34} />
      <Pass ow={ow} parts={[
        {d: chord, stroke: shade(steel, 0.18), w: 9, ink: line(steel), o: 0.5},
        {d: zig, stroke: shade(steel, 0.1), w: 8, ink: line(steel), o: 0.45},
      ]} />
      {/* the drops and the water off each */}
      {drops.map((px, i) => {
        const py = pipeY(px), sw = Math.sin(t * 2.2 + i * 1.3) * 6, L = 150 - i * 6, nx = px + sw, ny = py + L;
        return <g key={px}>
          <path d={`M${px} ${f1(py)} Q${f1(px + sw * 0.4)} ${f1(py + L * 0.5)} ${f1(nx)} ${f1(ny)}`} stroke={line('#46507a')} strokeWidth={4 + ow * 1.2} fill="none"
            strokeLinecap="round" />
          <path d={`M${px} ${f1(py)} Q${f1(px + sw * 0.4)} ${f1(py + L * 0.5)} ${f1(nx)} ${f1(ny)}`} stroke="#46507a" strokeWidth={4} fill="none" strokeLinecap="round" />
          {spray && <g>
            <path d={`M${f1(nx - 3)} ${f1(ny + 10)} Q${f1(nx - 26)} ${f1(ny + 110)} ${f1(nx - 52)} ${f1(ny + 210)} A52 14 0 0 0 ${f1(nx + 52)} ${f1(ny + 210)} `
              + `Q${f1(nx + 26)} ${f1(ny + 110)} ${f1(nx + 3)} ${f1(ny + 10)} Z`} fill={`url(#${id}-w)`} />
            {Array.from({length: 9}, (_, j) => {
              const ph = (frame * 0.027 + j / 9 + i * 0.17) % 1;
              return <path key={j} d={`M${f1(nx + (j - 4) * 9 * ph)} ${f1(ny + 14 + ph * 230)} l${f1((j - 4) * 0.6)} 9`} stroke={light(C.water, 0.35)} strokeWidth={4}
                strokeLinecap="round" opacity={f1((1 - ph) * 0.9)} />;
            })}
          </g>}
          <path d={rr(nx - 10, ny - 4, 20, 22, 9)} fill="#f2b630" stroke={line('#f2b630')} strokeWidth={ow * 1.2} />
        </g>;
      })}
      {/* the arched pipe */}
      <path d={pipe} stroke={line(steel)} strokeWidth={26 + ow * 2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={pipe} stroke={steel} strokeWidth={26} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={pipe} stroke={shade(steel, 0.25)} strokeWidth={8} fill="none" strokeLinecap="round" transform="translate(0 8)" />
      <path d={pipe} stroke="#ffffff" strokeWidth={6} fill="none" strokeLinecap="round" transform="translate(0 -7)" opacity={0.65} />
      {/* the tower on its tyres, the gearbox between them */}
      <Pass ow={ow} parts={[
        {d: `M-258 -67 L-176 ${f1(pipeY(-176) + 10)} M-74 -67 L-156 ${f1(pipeY(-156) + 10)}`, stroke: `url(#${id}-s)`, w: 16, ink: line(steel)},
        {d: 'M-226 -190 L-106 -190', stroke: shade(steel, 0.12), w: 10, ink: line(steel), o: 0.6},
        {d: 'M-212 -300 L-120 -300', stroke: shade(steel, 0.12), w: 8, ink: line(steel), o: 0.5},
        {d: rr(-268, -110, 204, 24, 12), fill: shade(steel, 0.2), ink: line(steel)},
        {d: rr(-196, -132, 60, 54, 18), fill: `url(#${id}-gb)`, ink: line('#3d7bd9')},
        {d: 'M-226 -98 L-120 -98', stroke: '#3a3550', w: 7, ink: line('#3a3550'), o: 0.5},
      ]} />
      <Tyre cx={-258} cy={-67} r={67} spin={frame * 0.45} ow={ow} rim="#f2b630" />
      <Tyre cx={-74} cy={-67} r={67} spin={frame * 0.45} ow={ow} rim="#f2b630" />
      {sensor && <g transform="translate(96 0)">
        <path d={`M0 ${f1(pipeY(96))} L0 -398`} stroke={line('#3a3550')} strokeWidth={6 + ow * 1.2} strokeLinecap="round" />
        <path d={`M0 ${f1(pipeY(96))} L0 -398`} stroke="#3a3550" strokeWidth={6} strokeLinecap="round" />
        <Pass ow={ow} parts={[{d: rr(-52, -402, 104, 74, 28), fill: `url(#${id}-pod)`, ink: line(pod)}]} />
        <Sheen d="M-36 -390 Q-10 -396 20 -392" w={5} op={0.5} />
        {mood ? <Visor x={0} y={-366} w={74} h={38} mood={mood} frame={frame} />
          : <><circle cx={22} cy={-352} r={13} fill="#0c0e29" /><circle cx={22} cy={-352} r={7} fill="#38f2e0" /></>}
        {[0, 1, 2].map((i) => {
          const ph = (frame / 38 + i / 3) % 1;
          return <path key={i} d={`M${f1(-30 - ph * 60)} ${f1(-316 + ph * 120)} Q0 ${f1(-290 + ph * 150)} ${f1(30 + ph * 60)} ${f1(-316 + ph * 120)}`}
            stroke="#38f2e0" strokeWidth={4} fill="none" strokeLinecap="round" opacity={f1((1 - ph) * 0.85)} />;
        })}
      </g>}
      {label && <Label x={-90} y={-530} text={label} fs={24} />}
    </g>
  );
};

// ================================================================================ RADAR ESTIMATE

/**
 * THE RADAR ESTIMATE, an editorial cutaway. A rounded block of soil with the crop standing on it, a
 * satellite crossing above on `progress` with its solar wings lit and radar rings leaving its lens,
 * the return signal dashing back up, and the moisture estimate filling in behind a glowing sweep as
 * it crosses the ground. Depths are editorial, not a measurement. Screen units like the library's.
 */
export const RadarEstimateV2: React.FC<At & {label: string; sublabel: string; mood?: MachineMood}> = ({
  x = 540, y = 920, scale = 1, frame = 0, progress = 0, label, sublabel, mood,
}) => {
  const id = useUid();
  const t = frame / 30;
  const sweep = cap((progress - 0.12) / 0.72), sx = -450 + sweep * 900;
  const sat = '#eef1f8', pv = '#2f56c8';
  const bob = Math.sin(t * 1.6) * 6;
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <defs>
      <clipPath id={`${id}-soil`}><path d={rr(-450, 25, 900, 280, 34)} /></clipPath>
      <clipPath id={`${id}-sw`}><rect x={-460} y={0} width={Math.max(0, sx + 460)} height={340} /></clipPath>
      <linearGradient id={`${id}-s`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={light(C.soil, 0.15)} /><stop offset="100%" stopColor={shade(C.soil, 0.3)} />
      </linearGradient>
      <linearGradient id={`${id}-m`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={light(C.water, 0.3)} stopOpacity={0.85} />
        <stop offset="100%" stopColor={shade(C.water, 0.3)} stopOpacity={0.95} /></linearGradient>
      <Lit id={`${id}-sat`} c={sat} /><linearGradient id={`${id}-pv`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={light(pv, 0.35)} />
        <stop offset="100%" stopColor={shade(pv, 0.35)} /></linearGradient>
    </defs>
    <rect x={-444} y={37} width={900} height={280} rx={34} fill="#1a1236" opacity={0.2} />
    <path d={rr(-450, 25, 900, 280, 34)} fill={`url(#${id}-s)`} />
    <g clipPath={`url(#${id}-soil)`}>
      {[0, 1].map((k) => <path key={k} d={`M-460 ${110 + k * 80} Q-200 ${90 + k * 90} 0 ${115 + k * 78} T460 ${105 + k * 84} L460 ${130 + k * 84} L-460 ${130 + k * 80} Z`}
        fill={k ? shade(C.soil, 0.15) : light(C.soil, 0.08)} opacity={0.6} />)}
      {Array.from({length: 36}, (_, i) => <ellipse key={i} cx={-430 + (i * 139) % 880} cy={50 + (i * 43) % 240} rx={5 + (i % 5) * 2} ry={3 + (i % 3) * 1.4}
        fill={i % 3 ? shade(C.soil, 0.35) : light(C.soil, 0.3)} opacity={0.6} />)}
      <g clipPath={`url(#${id}-sw)`}>
        <path d={`M-460,40 Q-160,${145 + sweep * 25} 100,90 T460,170 L460,320 L-460,320 Z`} fill={`url(#${id}-m)`} opacity={0.3 + sweep * 0.5} />
        {Array.from({length: 14}, (_, i) => {
          const tw = Math.max(0, Math.sin(t * 2 + i * 1.7));
          return <circle key={i} cx={-430 + (i * 197) % 880} cy={190 + (i * 61) % 100} r={1.5 + tw * 3} fill="#ffffff" opacity={tw * 0.7} />;
        })}
      </g>
      {sweep > 0 && sweep < 1 && <><Glow x={sx} y={160} r={110} color="#7fe8ff" opacity={0.5} />
        <rect x={sx - 3} y={24} width={6} height={300} rx={3} fill="#bff4ff" /></>}
    </g>
    <path d={rr(-450, 25, 900, 280, 34)} fill="none" stroke={line(C.soil)} strokeWidth={6} />
    <path d={rr(-458, 10, 916, 26, 13)} fill={C.leaf} stroke={line(C.leaf)} strokeWidth={6} />
    <path d="M-440 17 L440 17" stroke={light(C.leaf, 0.5)} strokeWidth={4} strokeLinecap="round" opacity={0.6} />
    {Array.from({length: 12}, (_, i) => <Sprout key={i} x={-420 + i * 77} y={16} s={1} frame={frame} k={i} />)}
    {/* the satellite crossing above, radar rings down, the return dashing back */}
    <g transform={`translate(${f1(-295 + progress * 535)} ${f1(-360 + bob)})`}>
      <path d="M85,310 Q220,190 94,102" fill="none" stroke={line('#bff4ff')} strokeWidth={8} strokeDasharray="12 12" strokeDashoffset={-frame * 1.2}
        strokeLinecap="round" />
      <path d="M85,310 Q220,190 94,102" fill="none" stroke="#bff4ff" strokeWidth={4} strokeDasharray="12 12" strokeDashoffset={-frame * 1.2} strokeLinecap="round" />
      {[0, 1, 2].map((i) => {
        const ph = (frame / 58 + i / 3) % 1;
        return <Duo key={i} d={`M${f1(-25 - ph * 100)},${f1(80 + ph * 205)} Q0,${f1(110 + ph * 205)} ${f1(25 + ph * 100)},${f1(80 + ph * 205)}`} c="#38f2e0" w={6}
          op={1 - ph} />;
      })}
      <Pass ow={4} parts={[
        {d: 'M-150 2 L150 2', stroke: '#9aa6c4', w: 10, ink: line('#9aa6c4'), o: 0.6},
        {d: rr(-250, -30, 124, 64, 14), fill: `url(#${id}-pv)`, ink: line(pv)},
        {d: rr(126, -30, 124, 64, 14), fill: `url(#${id}-pv)`, ink: line(pv)},
        {d: rr(-82, -52, 164, 110, 40), fill: `url(#${id}-sat)`, ink: line(sat)},
        {d: rr(-28, 50, 56, 30, 14), fill: '#4a4f6e', ink: line('#4a4f6e')},
      ]} />
      {[-1, 1].map((sd) => <g key={sd}>{[1, 2].map((k) => <path key={k} d={`M${sd * 126 + sd * k * 41} -28 L${sd * 126 + sd * k * 41} 32`} stroke="#8fb0ff" strokeWidth={3}
        opacity={0.6} />)}<path d={`M${sd > 0 ? 136 : -240} -20 L${sd > 0 ? 176 : -200} -20`} stroke="#ffffff" strokeWidth={6} strokeLinecap="round" opacity={0.5} /></g>)}
      <Sheen d="M-62 -36 Q-20 -46 30 -40" w={8} op={0.6} />
      {mood ? <Visor x={0} y={2} w={120} h={58} mood={mood} frame={frame} />
        : <><circle cx={0} cy={2} r={26} fill="#0c0e29" /><circle cx={0} cy={2} r={14} fill="#38f2e0" /><circle cx={-6} cy={-4} r={5} fill="#ffffff" /></>}
      <circle cx={0} cy={80} r={10} fill="#38f2e0" />
      <Glow x={0} y={84} r={40} color="#38f2e0" opacity={0.5} />
    </g>
    <Label x={-450} y={-505} text={label} fs={46} />
    <Label x={-445} y={405} text={sublabel} fs={35} weight={700} />
  </g>;
};

// ============================================================================= FIELD OBSERVATIONS

/**
 * THE OBSERVATIONS behind the advice. A photo card of the crop with rounded corner brackets and a
 * scan line crossing it, a weather tile (a lit sun with turning rays, a soft cloud, rain falling),
 * two dashed flows running down into a soil estimate chip that fills, and below it the advice card
 * landing. Every word is the caller's. Screen units and `progress` beats like the library's.
 */
export const FieldObservationsV2: React.FC<At & {label: string; result: string; cropLabel: string; weatherLabel: string}> = ({
  x = 540, y = 800, scale = 1, frame = 0, progress = 0, label, result, cropLabel, weatherLabel,
}) => {
  const id = useUid();
  const t = frame / 30;
  const field = '#7fbf4a';
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <defs>
      <clipPath id={`${id}-card`}><path d={rr(-160, -135, 285, 225, 26)} /></clipPath>
      <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={light(C.sky, 0.45)} /><stop offset="34%" stopColor={light(C.sky, 0.6)} />
        <stop offset="35%" stopColor={light(field, 0.2)} /><stop offset="100%" stopColor={shade(field, 0.25)} /></linearGradient>
      <Ball id={`${id}-sun`} c="#ffc93c" a={0.6} b={0.25} />
      <linearGradient id={`${id}-cl`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor="#d6dcf2" /></linearGradient>
      <clipPath id={`${id}-chip`}><path d={rr(-197, -32, 394, 90, 30)} /></clipPath>
    </defs>
    <Label x={-400} y={-325} text={label} fs={44} />
    <g transform={`translate(${f1(-200 + 45 * progress)} -90) rotate(${f1(-5 + progress * 4)})`}>
      <rect x={-152} y={-125} width={285} height={225} rx={26} fill="#1a1236" opacity={0.22} />
      <path d={rr(-160, -135, 285, 225, 26)} fill={line(field)} stroke={line(field)} strokeWidth={12} strokeLinejoin="round" />
      <g clipPath={`url(#${id}-card)`}>
        <rect x={-160} y={-135} width={285} height={225} fill={`url(#${id}-f)`} />
        {[0, 1, 2, 3].map((k) => <path key={k} d={`M${-150 + k * 90} 90 L${-40 + k * 30} -56`} stroke={shade(field, 0.25)} strokeWidth={8} strokeLinecap="round"
          opacity={0.5} />)}
        {[-100, -10, 80].map((cx, i) => <Sprout key={cx} x={cx} y={62} s={1.25} frame={frame} k={i} lw={2.6} />)}
        <rect x={-145 + progress * 231 - 3} y={-124} width={6} height={198} rx={3} fill="#bff4ff" />
        <Glow x={-145 + progress * 231} y={-25} r={70} color="#7fe8ff" opacity={0.45} />
        <path d="M-160 -135 L-40 -135 L-160 0 Z" fill="#ffffff" opacity={0.12} />
      </g>
      <Duo d="M-142 -82 L-142 -110 Q-142 -116 -136 -116 L-106 -116 M105 52 L105 76 Q105 82 99 82 L68 82" c="#ffffff" w={6} />
      <Label x={-140} y={140} text={cropLabel} fs={33} weight={700} />
    </g>
    <g transform={`translate(${f1(260 - progress * 35)} -85)`}>
      <g transform={`translate(0 -60) rotate(${f1(t * 12)})`}>{Array.from({length: 8}, (_, k) => <path key={k} transform={`rotate(${k * 45})`} d="M0 -84 L0 -104"
        stroke="#ffc93c" strokeWidth={12} strokeLinecap="round" />)}</g>
      <Glow x={0} y={-60} r={120} color="#ffd66a" opacity={0.5} />
      <circle cy={-60} r={67 + 6} fill={line('#ffc93c')} /><circle cy={-60} r={67} fill={`url(#${id}-sun)`} />
      <path d="M-99,10 Q-149,-50 -65,-72 Q-34,-132 24,-71 Q82,-88 111,-20 Q150,27 89,49 H-65 Q-125,52 -99,10 Z" fill={line('#d6dcf2')} stroke={line('#d6dcf2')}
        strokeWidth={14} strokeLinejoin="round" />
      <path d="M-99,10 Q-149,-50 -65,-72 Q-34,-132 24,-71 Q82,-88 111,-20 Q150,27 89,49 H-65 Q-125,52 -99,10 Z" fill={`url(#${id}-cl)`} />
      <path d="M-70 -50 Q-40 -70 -10 -60" stroke="#ffffff" strokeWidth={10} strokeLinecap="round" fill="none" opacity={0.9} />
      {[0, 1, 2].map((i) => {
        const ph = ((frame + i * 9) % 32) / 32;
        return <path key={i} d={`M${-48 + i * 58} ${f1(74 + ph * 30)} q-8 14 0 20 q8 -6 0 -20 Z`} fill={light(C.water, 0.2)} stroke={line(C.water)} strokeWidth={4}
          strokeLinejoin="round" opacity={f1(1 - ph * 0.6)} />;
      })}
      <Label x={-108} y={175} text={weatherLabel} fs={33} weight={700} />
    </g>
    <Duo d="M-130,135 C-130,320 30,200 30,350 M245,163 Q245,280 30,350" c="#7fe8ff" w={6} dash="15 12" off={-frame * 2} />
    <g transform="translate(15 250)" opacity={cap((progress - 0.18) * 4)}>
      <path d={rr(-197, -32, 394, 90, 30)} fill={line(C.soil)} stroke={line(C.soil)} strokeWidth={12} strokeLinejoin="round" />
      <g clipPath={`url(#${id}-chip)`}>
        <rect x={-197} y={-32} width={394} height={90} fill={C.soil} />
        <path d={`M-197,${f1(-6 + Math.sin(t * 2) * 3)} q107,30 210,10 t184,12 V70 H-197 Z`} fill={C.water} opacity={0.75} />
        <path d="M-180 -22 L160 -22" stroke="#ffffff" strokeWidth={6} strokeLinecap="round" opacity={0.25} />
      </g>
      <text x={0} y={24} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={28} fill="#fff6e2" letterSpacing={1}>SOIL ESTIMATE</text>
    </g>
    <g opacity={cap((progress - 0.28) * 5)} transform={`translate(0 ${f1(30 * (1 - progress))})`}>
      <IrrigationAdviceV2 x={25} y={530} scale={0.6} frame={frame} progress={progress} label={result} status="" mode="advice" />
    </g>
  </g>;
};

// ================================================================================ FARMLAND LAYER

/**
 * THE FARMLAND PLATES a scene stands on, one `layer` at a time as the library's, the `sky` (a warm
 * dawn gradient with a glowing sun and clouds drifting, or the dark teal of the `technical` look),
 * the `soil` (an earth plane with lit crop rows converging on the horizon and a haze band where they
 * meet it), and the `edge` (big lit foreground leaves framing the bottom corners, swaying). The
 * technical look dims the soil and the edge so a diagram reads over them. Full frame screen units.
 */
export const FarmlandLayerV2: React.FC<At & {layer: 'sky' | 'soil' | 'edge'; technical?: boolean}> = ({layer, frame = 0, technical = false}) => {
  const id = useUid();
  const t = frame / 30;
  if (layer === 'sky') {
    const top = technical ? '#0f2a36' : '#3d86e0', low = technical ? '#245058' : '#ffd29a';
    return <g>
      <defs><linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={top} />
        <stop offset="60%" stopColor={mix(top, low, 0.6)} /><stop offset="100%" stopColor={low} /></linearGradient>
        <linearGradient id={`${id}-cl`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor={mix('#ffffff', top, 0.25)} />
        </linearGradient></defs>
      <rect x={-1200} y={-1400} width={3500} height={4200} fill={`url(#${id}-sky)`} />
      {!technical && <>
        <Glow x={160} y={540} r={420} color="#fff1c4" opacity={0.8} />
        <circle cx={160} cy={540} r={91} fill="#fff3c8" />
        {[[260, 300, 1.1, 0], [820, 200, 0.8, 1], [1120, 430, 0.7, 2]].map(([cx, cy, s, k]) => {
          const dx = ((t * 8 * (0.6 + k * 0.2) + cx) % 1400) - 160;
          return <g key={k} transform={`translate(${f1(dx)} ${cy}) scale(${s})`} opacity={0.92}>
            {[[-80, 10, 52], [-20, -18, 70], [55, -4, 58], [110, 14, 42]].map(([bx, by, br], i) => <circle key={i} cx={bx} cy={by} r={br} fill={`url(#${id}-cl)`} />)}
            <rect x={-130} y={10} width={280} height={46} rx={23} fill={`url(#${id}-cl)`} />
          </g>;
        })}
      </>}
      {technical && Array.from({length: 9}, (_, i) => <path key={i} d={`M-100 ${200 + i * 120} L1180 ${200 + i * 120}`} stroke="#3fd0d8" strokeWidth={2} opacity={0.08} />)}
    </g>;
  }
  if (layer === 'edge') {
    return <g opacity={technical ? 0.25 : 1}>
      {[-80, 50, 990, 1110].map((ex, i) => {
        const sway = Math.sin(t * 0.58 + i) * 2.4, c = i % 2 ? '#4f9636' : '#5fa83e';
        const blades = [leafD(0, 115, -150, 40, 60), leafD(0, 30, 126, -40, -60), leafD(0, -20, -90, -150, 44), leafD(0, -60, 70, -190, -40)];
        return <g key={ex} transform={`translate(${ex} 1660) rotate(${f1(sway)})`}>
          <path d="M0 340 Q4 120 0 -80" stroke={line(c)} strokeWidth={30} fill="none" strokeLinecap="round" />
          {blades.map((d, j) => <path key={`o${j}`} d={d} fill={line(c)} stroke={line(c)} strokeWidth={14} strokeLinejoin="round" />)}
          <path d="M0 340 Q4 120 0 -80" stroke={shade(c, 0.1)} strokeWidth={16} fill="none" strokeLinecap="round" />
          {blades.map((d, j) => <path key={j} d={d} fill={j % 2 ? c : light(c, 0.2)} />)}
          {blades.map((d, j) => <path key={`v${j}`} d={d} fill="none" stroke={light(c, 0.45)} strokeWidth={3} opacity={0.25} />)}
        </g>;
      })}
    </g>;
  }
  const rowC = (i: number) => (i % 3 ? C.leaf : '#e8c36a');
  return <g opacity={technical ? 0.18 : 1}>
    <defs><linearGradient id={`${id}-earth`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={mix('#e2bf72', '#c9c4ea', 0.35)} />
      <stop offset="22%" stopColor="#d9a45a" /><stop offset="100%" stopColor="#8a4f34" /></linearGradient>
      <linearGradient id={`${id}-row`} gradientUnits="userSpaceOnUse" x1={0} y1={960} x2={0} y2={2800}><stop offset="0%" stopColor={mix(C.leaf, '#c9c4ea', 0.5)} />
        <stop offset="100%" stopColor={shade(C.leaf, 0.1)} /></linearGradient>
      <linearGradient id={`${id}-gold`} gradientUnits="userSpaceOnUse" x1={0} y1={960} x2={0} y2={2800}><stop offset="0%" stopColor={mix('#e8c36a', '#c9c4ea', 0.5)} />
        <stop offset="100%" stopColor={shade('#e8c36a', 0.15)} /></linearGradient>
      <linearGradient id={`${id}-haze`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ead8ee" stopOpacity={0.85} />
        <stop offset="100%" stopColor="#ead8ee" stopOpacity={0} /></linearGradient></defs>
    <path d="M-1200,960 L2400,960 L2500,3500 H-1300 Z" fill={`url(#${id}-earth)`} />
    {Array.from({length: 26}, (_, i) => {
      const nx = (i - 13) * 150, hw = 26 + (i % 4) * 4, fx = 500 + (i - 13) * 19;
      return <path key={i} d={`M${fx - 2} 965 L${fx + 2} 965 L${nx + hw} 2800 L${nx - hw} 2800 Z`} fill={`url(#${id}-${rowC(i) === C.leaf ? 'row' : 'gold'})`}
        stroke={line(rowC(i))} strokeWidth={3} strokeLinejoin="round" />;
    })}
    {Array.from({length: 58}, (_, i) => <ellipse key={i} cx={-180 + (i * 113) % 1450} cy={1010 + (i * 83) % 1500} rx={6 + (i % 11) * 0.8} ry={3 + (i % 5) * 0.5}
      fill="#f0dca0" opacity={0.45} />)}
    <rect x={-1200} y={900} width={3600} height={200} fill={`url(#${id}-haze)`} />
  </g>;
};

// =============================================================================== IRRIGATION ADVICE

/**
 * THE ADVICE CARD, a clipboard held up to the camera. A lit teal board with a steel clip, the paper
 * with the caller's `label` and lines that write themselves in on `progress`, and the hand that holds
 * it rising into frame (the palm behind the board, the thumb over its edge). In `limit` mode the
 * lower half says the savings were not reported and a pencil draws a question mark, the library's
 * own words. `status` is the headline above the board. Screen units like the library's.
 */
export const IrrigationAdviceV2: React.FC<At & {label: string; status: string; mode?: 'advice' | 'limit'}> = ({
  x = 510, y = 760, scale = 1, frame = 0, progress = 0, label, status, mode = 'advice',
}) => {
  const id = useUid();
  const t = frame / 30;
  const board = '#3f9aa6', skin = '#c98a5a', sleeve = '#5f9e3a';
  const q = cap((progress - 0.48) * 3);
  return <g transform={`translate(${x} ${f1(y + 85 * (1 - cap(progress * 2)))}) scale(${scale}) rotate(${f1(-6 + progress * 7 + Math.sin(t * 1.1) * 0.5)})`}>
    <defs><Lit id={`${id}-b`} c={board} /><Lit id={`${id}-p`} c={C.paper} a={0.3} b={0.12} /><Cyl id={`${id}-clip`} c="#c9d3e6" vertical />
      <Lit id={`${id}-sk`} c={skin} /><Lit id={`${id}-sl`} c={sleeve} x2={0} /></defs>
    {/* the hand rises with the board. Palm and sleeve first, so the board covers them */}
    <g transform={`translate(${f1(-15 * progress)} ${f1(170 * (1 - cap(progress * 2.3)))})`}>
      <Pass ow={4} parts={[
        {d: rr(-400, 430, 236, 220, 60), fill: `url(#${id}-sl)`, ink: line(sleeve)},
        {d: ell(-300, 360, 84, 104), fill: `url(#${id}-sk)`, ink: line(skin)},
      ]} />
      <path d="M-380 456 Q-280 470 -186 456" stroke={shade(sleeve, 0.3)} strokeWidth={6} strokeLinecap="round" fill="none" />
    </g>
    <path d={rr(-262, -270, 572, 656, 40)} fill="#1a1236" opacity={0.25} />
    <Pass ow={4} parts={[
      {d: rr(-282, -288, 572, 656, 40), fill: `url(#${id}-b)`, ink: line(board)},
      {d: rr(-244, -235, 494, 535, 18), fill: `url(#${id}-p)`, ink: line('#d9cdb4'), o: 0.6},
      {d: rr(-96, -322, 192, 82, 30), fill: `url(#${id}-clip)`, ink: line('#c9d3e6')},
    ]} />
    <circle cx={-56} cy={-282} r={9} fill={shade('#c9d3e6', 0.35)} /><circle cx={56} cy={-282} r={9} fill={shade('#c9d3e6', 0.35)} />
    <Sheen d="M-78 -304 L60 -304" w={8} op={0.6} />
    <Sheen d="M-262 -250 Q-266 0 -262 330" w={10} op={0.3} />
    <path d="M-214,-103 H218 M-213,116 H215" stroke={shade(C.paper, 0.18)} strokeWidth={4} strokeLinecap="round" />
    <text x={-210} y={-155} fontFamily={FONT.body} fontSize={34} fontWeight={800} fill={C.ink}>{label}</text>
    <path d="M-195,-32 h320 m-320,45 h370 m-370,45 h240" stroke={C.leaf} strokeWidth={10} strokeLinecap="round" strokeDasharray="1000"
      strokeDashoffset={1000 * (1 - cap(progress * 2))} />
    {mode === 'limit' ? <g>
      <text x={-204} y={177} fill={C.soil} fontSize={29} fontWeight={800} fontFamily={FONT.body}>WATER SAVINGS</text>
      <text x={-204} y={226} fill={C.rust} fontSize={26} fontWeight={800} fontFamily={FONT.body}>NOT REPORTED</text>
      <text x={-204} y={265} fill={C.soil} fontSize={20} fontWeight={700} fontFamily={FONT.body}>IN THIS ANNOUNCEMENT</text>
      <path d="M133,175 c0,-43 73,-47 80,-5 c10,30 -32,35 -35,59 M176,251 v2" fill="none" stroke={C.rust} strokeWidth={10} strokeLinecap="round"
        strokeDasharray="220" strokeDashoffset={220 * (1 - q)} />
      <g transform={`translate(${f1(133 + 44 * q)} ${f1(175 + 76 * q)}) rotate(28)`} opacity={progress > 0.48 && progress < 0.84 ? 1 : 0}>
        <Pass ow={3.4} parts={[
          {d: rr(-9, -96, 18, 70, 6), fill: '#ffc93c', ink: line('#ffc93c')},
          {d: rr(-9, -112, 18, 20, 8), fill: '#ff8fa3', ink: line('#ff8fa3')},
          {d: 'M-9 -28 L9 -28 L0 0 Z', fill: '#f2d7b0', ink: line('#f2d7b0')},
        ]} />
        <path d="M-3 -9 L3 -9 L0 0 Z" fill={C.ink} />
      </g>
    </g> : <path d="M-195,187 h260 m-260,38 h370 m-370,38 h170" stroke={shade(C.paper, 0.22)} strokeWidth={10} strokeLinecap="round" />}
    {/* the thumb over the board's edge, in front of it */}
    <g transform={`translate(${f1(-15 * progress)} ${f1(170 * (1 - cap(progress * 2.3)))})`}>
      <Pass ow={4} parts={[{d: 'M-330 330 Q-318 268 -268 250 Q-238 242 -232 262 Q-228 282 -258 296 Q-282 308 -290 340 Z', fill: `url(#${id}-sk)`, ink: line(skin)}]} />
      <path d="M-262 256 Q-246 252 -242 262" stroke={light(skin, 0.5)} strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.8} />
    </g>
    {status && <Label x={-298} y={-370} text={status} fs={53} />}
  </g>;
};

// =============================================================================== FIELD DAY NOTICE

/**
 * THE FIELD DAY NOTICE, a printed flyer pinned up. A lit cream card with rounded corners and a green
 * header band, the caller's `title`, `date`, `place` and `detail`, a rule, and an arrow that slides
 * on `progress`. A red pushpin holds it at the top and the card swings a touch on the pin. Screen
 * units like the library's.
 */
export const FieldDayNoticeV2: React.FC<At & {title: string; date: string; place: string; detail: string}> = ({
  x = 520, y = 550, scale = 1, frame = 0, progress = 0, title, date, place, detail,
}) => {
  const id = useUid();
  const t = frame / 30;
  const a = cap((progress - 0.48) * 3);
  return <g transform={`translate(${x} ${y}) scale(${scale}) rotate(${f1(-3 + cap(progress * 2) * 3 + Math.sin(t * 1.2) * 0.6)} 0 -226)`}>
    <defs><Lit id={`${id}-p`} c={C.paper} a={0.35} b={0.14} /><Lit id={`${id}-g`} c={C.leaf} x2={0} /><Ball id={`${id}-pin`} c="#e2483a" a={0.6} />
      <clipPath id={`${id}-c`}><path d={rr(-360, -220, 720, 458, 30)} /></clipPath></defs>
    <path d={rr(-346, -204, 720, 458, 30)} fill="#1a1236" opacity={0.22} />
    <path d={rr(-360, -220, 720, 458, 30)} fill={line('#d9cdb4')} stroke={line('#d9cdb4')} strokeWidth={10} strokeLinejoin="round" />
    <path d={rr(-360, -220, 720, 458, 30)} fill={`url(#${id}-p)`} />
    <g clipPath={`url(#${id}-c)`}>
      <rect x={-360} y={-220} width={720} height={62} fill={`url(#${id}-g)`} />
      <path d="M-360 -158 L360 -158" stroke={shade(C.leaf, 0.3)} strokeWidth={4} />
      <path d="M-200 -240 L-60 -240 L-260 260 L-400 260 Z" fill="#ffffff" opacity={0.14} />
    </g>
    <text x={-327} y={-178} fill="#fff8ec" fontFamily={FONT.body} fontWeight={800} fontSize={27} letterSpacing={2}>{title}</text>
    <text x={-330} y={-60} fill={C.ink} fontFamily={FONT.body} fontSize={75} fontWeight={900}>{date}</text>
    <path d="M-326,-20 h652" stroke={C.rust} strokeWidth={7} strokeLinecap="round" />
    <text x={-330} y={49} fill={C.ink} fontFamily={FONT.body} fontSize={39} fontWeight={800}>{place}</text>
    <text x={-330} y={105} fill={C.soil} fontFamily={FONT.body} fontSize={31} fontWeight={600}>{detail}</text>
    <path d="M-331,166 h461" stroke={shade(C.paper, 0.2)} strokeWidth={3} strokeLinecap="round" />
    <Duo d={`M${f1(-333 + a * 190)},178 h145 l-15,-13 m15,13 l-15,13`} c={C.leaf} w={6} />
    <ellipse cx={8} cy={-210} rx={20} ry={7} fill="#1a1236" opacity={0.25} />
    <circle cx={0} cy={-226} r={22 + 4} fill={line('#e2483a')} />
    <circle cx={0} cy={-226} r={22} fill={`url(#${id}-pin)`} />
    <circle cx={-7} cy={-233} r={6} fill="#ffffff" opacity={0.7} />
  </g>;
};

export const IRRIGATION_V2 = ['PivotRigV2', 'RadarEstimateV2', 'FieldObservationsV2', 'FarmlandLayerV2', 'IrrigationAdviceV2', 'FieldDayNoticeV2'] as const;
