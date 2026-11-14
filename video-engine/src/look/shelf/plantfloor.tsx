import React from 'react';
import {light, line, shade} from '../color';
import {ContactShadow, Glow, useUid} from '../Kit';
import {Visor} from '../machines';
import type {MachineMood} from '../machines';
import {Cyl, Lit, Pass, Sheen, at, f1, owOf, pt, rnd, rp, rr, st} from './compute';
import type {RigV2} from './compute';

/**
 * PLANT FLOOR, LOOK V2 (November 14th, 2026).
 *
 * What Texas now makes, from lib/plantfloor.tsx, redrawn on the v2 rules. The fenced arm cell, the belt,
 * the camera that says pass or fail, and the fab tool bay. Rounded, lit from the upper left, outlined in
 * each material's own deep hue, saturated (a plant floor is grey-green machines with one bright safety
 * colour on whatever moves, and here the grey-green is pushed to a clean teal and the safety colour to
 * a hot orange).
 *
 * THE LIBRARY'S RULE STANDS. A real arm moves in fast straight segments with hard stops, it is fenced and
 * a light curtain spans the opening, so `CellArmV2` keeps the hold, snap, hold motion and the guarding,
 * and it has NO face. look/machines.tsx already has `RobotArmV2`, the friendly hero arm with a camera eye
 * for explainer beats, so this one is named for what it is, the arm in its cell.
 *
 * The inspection camera is the one machine here that can be the character of a beat (the model that says
 * FAIL), so it takes an optional `mood` that puts the Visor face on its body. Leave it off for a plain
 * floor shot.
 *
 * PLACEMENT is the library's. `scale` 1 is true size through lib/scale.ts, drawn in centimetres.
 */
export const PLANT_V2_M: Record<string, {h: number; note: string}> = {
  cellArm: {h: 1.7, note: 'a mid-payload six-axis arm at rest, base to wrist'},
  conveyor: {h: 0.9, note: 'the belt surface, working height'},
  inspectionHead: {h: 0.55, note: 'the camera and its ring light on the gantry'},
  toolBay: {h: 3.4, note: 'a process tool with its enclosure'},
};

const TEAL = '#3f8f8a', SAFETY = '#ff7a1f', STEEL = '#c3cbe2', DARK = '#2b2d52';

/** hold, snap, hold. The library's motion primitive, the reason the arm does not read as stock art */
export const segmentedV2 = (frame: number, cycle: number, dwell = 0.34, phase = 0): number => {
  const u = ((((frame + phase) % cycle) + cycle) % cycle) / cycle;
  const move = (1 - dwell * 2) / 2;
  const ease = (t: number) => t * t * (3 - 2 * t);
  if (u < dwell) return 0;
  if (u < dwell + move) return ease((u - dwell) / move);
  if (u < dwell * 2 + move) return 1;
  return 1 - ease((u - dwell * 2 - move) / move);
};

/** a stack light, three lit capsules on a post, the one part a viewer reads from across the room */
const StackLight: React.FC<{x: number; y: number; w: number; on: 'run' | 'idle' | 'down' | null; frame: number; ow: number}> = ({
  x, y, w, on, frame, ow,
}) => {
  const segs: ['down' | 'idle' | 'run', string][] = [['down', '#ff4d5e'], ['idle', '#ffb13b'], ['run', '#38e08a']];
  const h = w * 0.9;
  const blink = on === 'down' ? 0.55 + 0.45 * Math.abs(Math.sin(frame / 7)) : 1;
  return (
    <g transform={`translate(${x} ${y})`}>
      <Pass ow={ow} parts={[st(`M0 0 L0 ${f1(-h * 0.4)}`, '#7d84a8', w * 0.3, '#7d84a8'),
        pt(rr(-w * 0.6, -h * 3 - h * 0.4 - w * 0.3, w * 1.2, w * 0.4, w * 0.2), '#5a6080', '#5a6080'),
        ...segs.map(([k, c], i) => pt(rr(-w / 2, -h * 3.4 + i * h, w, h, w * 0.3), on === k ? light(c, 0.2) : shade(c, 0.6), c, 0.8))]} />
      {segs.map(([k, c], i) => on === k && <g key={k}>
        <Glow x={0} y={-h * 2.9 + i * h} r={w * 2.4} color={c} opacity={0.55 * blink} />
        <path d={`M${f1(-w * 0.22)} ${f1(-h * 3.4 + i * h + h * 0.28)} L${f1(-w * 0.22)} ${f1(-h * 3.4 + i * h + h * 0.72)}`} stroke="#ffffff"
          strokeWidth={w * 0.14} strokeLinecap="round" opacity={0.75 * blink} />
      </g>)}
    </g>
  );
};

// ===================================================================================== CELL ARM

/**
 * THE ARM IN ITS CELL, six axes in a hot safety orange on a teal casting, moving in segments with a dwell
 * at each end. The dress pack (the cable loom strapped down the outside, which every real arm has) runs
 * along the upper link. Behind it the mesh guarding, at the opening the light curtain with its beams, and
 * the stack light on the post that turns red when the cell is `halted`.
 */
export const CellArmV2: React.FC<RigV2 & {cycle?: number; halted?: boolean; fenced?: boolean; livery?: string}> = (p) => {
  const {frame = 0, seed = 1, cycle = 74, halted = false, fenced = true, livery = SAFETY} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const u = halted ? 0.5 : segmentedV2(frame, cycle, 0.34, rnd(seed, 1) * cycle);
  const shoulder = -62 + u * 44, elbow = 84 - u * 62, wristA = -22 + u * 40;
  const grip = 7 + u * 7;
  const scan = Math.floor(frame / 2) % 7;
  const disc = (r: number) => `M${-r} 0 a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
  return (
    <g transform={at(p)}>
      <defs><Lit id={`${id}-a`} c={livery} x2={0.8} y2={0.6} /><Lit id={`${id}-t`} c={TEAL} /><Cyl id={`${id}-p`} c="#ffc22e" />
        <Cyl id={`${id}-s`} c={STEEL} /></defs>
      {fenced && <g>
        {/* the mesh guarding behind the arm, a framed panel the eye reads as a cage, not a texture */}
        <path d={rr(-126, -164, 252, 150, 10)} fill="#dfe6f8" opacity={0.28} />
        <g opacity={0.5}>
          {Array.from({length: 13}, (_, i) => <path key={`v${i}`} d={`M${f1(-116 + i * 19.3)} -158 L${f1(-116 + i * 19.3)} -20`} stroke="#8592c4"
            strokeWidth={1.6} />)}
          {Array.from({length: 8}, (_, i) => <path key={`h${i}`} d={`M-120 ${f1(-150 + i * 18.5)} L120 ${f1(-150 + i * 18.5)}`} stroke="#8592c4"
            strokeWidth={1.6} />)}
        </g>
        <path d={rr(-126, -164, 252, 150, 10)} fill="none" stroke={line('#ffc22e')} strokeWidth={6 + ow * 2} />
        <path d={rr(-126, -164, 252, 150, 10)} fill="none" stroke="#ffc22e" strokeWidth={6} />
        <Pass ow={ow} parts={[pt(rr(-132, -172, 12, 172, 6), `url(#${id}-p)`, '#ffc22e'), pt(rr(120, -172, 12, 172, 6), `url(#${id}-p)`, '#ffc22e')]} />
      </g>}
      <ContactShadow x={0} y={2} w={200} opacity={0.32} />
      {/* base plate, casting and turntable */}
      <Pass ow={ow} parts={[
        pt(rr(-60, -14, 120, 14, 7), DARK, DARK),
        pt(rp([[-46, -12], [46, -12], [36, -42], [-36, -42]], 9), `url(#${id}-t)`, TEAL),
        pt(rr(-34, -64, 68, 26, 12), `url(#${id}-a)`, livery),
      ]} />
      {[-30, 30].map((bx) => <circle key={bx} cx={bx} cy={-7} r={3} fill="#7d84a8" />)}
      <Sheen d="M-26 -58 L22 -58" w={4} op={0.55} />
      <g transform={`translate(0 -58) rotate(${f1(shoulder)})`}>
        <Pass ow={ow} parts={[pt(rp([[-22, 8], [22, 8], [16, -96], [-16, -96]], [16, 16, 14, 14]), `url(#${id}-a)`, livery)]} />
        <path d="M-12 -14 L-9 -84" stroke="#ffffff" strokeWidth={5} strokeLinecap="round" opacity={0.4} />
        {/* the dress pack down the outside of the upper arm */}
        <path d="M18 -86 q24 30 10 80" fill="none" stroke={line('#3b3f66')} strokeWidth={6 + ow * 1.6} strokeLinecap="round" />
        <path d="M18 -86 q24 30 10 80" fill="none" stroke="#4a4f80" strokeWidth={6} strokeLinecap="round" />
        {[-70, -46, -24].map((cy) => <path key={cy} d={`M${f1(24 + (cy + 86) * 0.1)} ${cy} l9 3`} stroke="#9aa3c6" strokeWidth={2.4} strokeLinecap="round" />)}
        <Pass ow={ow} parts={[pt(disc(27), `url(#${id}-t)`, TEAL)]} />
        <circle r={12} fill={shade(livery, 0.2)} /><circle cx={-4} cy={-4} r={4} fill="#ffffff" opacity={0.5} />
        <g transform={`translate(0 -96) rotate(${f1(elbow)})`}>
          <Pass ow={ow} parts={[pt(rp([[-17, 6], [17, 6], [12, -82], [-12, -82]], [13, 13, 10, 10]), `url(#${id}-a)`, livery)]} />
          <path d="M-9 -12 L-6 -72" stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.4} />
          <Pass ow={ow} parts={[pt(disc(21), `url(#${id}-t)`, TEAL)]} />
          <circle r={9} fill={shade(livery, 0.2)} />
          <g transform={`translate(0 -82) rotate(${f1(wristA)})`}>
            <Pass ow={ow} parts={[
              pt(rr(-12, -24, 24, 30, 10), `url(#${id}-t)`, TEAL),
              pt(rr(-17, -32, 34, 9, 4.5), `url(#${id}-s)`, STEEL),
              pt(rr(-grip - 4, -52, 8, 22, 4), `url(#${id}-s)`, STEEL),
              pt(rr(grip - 4, -52, 8, 22, 4), `url(#${id}-s)`, STEEL),
            ]} />
            <circle cx={0} cy={-10} r={3.4} fill={halted ? '#ff4d5e' : '#38e08a'} />
          </g>
        </g>
      </g>
      {fenced && <g>
        {/* the light curtain at the opening, emitter and receiver in front, beams scanning */}
        <Pass ow={ow} parts={[pt(rr(-152, -150, 14, 150, 6), DARK, DARK), pt(rr(138, -150, 14, 150, 6), DARK, DARK)]} />
        {Array.from({length: 7}, (_, i) => <g key={i}>
          <circle cx={-145} cy={-138 + i * 20} r={3} fill={halted ? '#5a6080' : '#ff4d5e'} />
          <circle cx={145} cy={-138 + i * 20} r={3} fill={halted ? '#5a6080' : '#ff8a96'} />
          {!halted && <path d={`M-140 ${-138 + i * 20} L140 ${-138 + i * 20}`} stroke="#ff4d5e" strokeWidth={1.4}
            opacity={i === scan ? 0.35 : 0.08} />}
        </g>)}
        <StackLight x={-126} y={-172} w={12} on={halted ? 'down' : 'run'} frame={frame} ow={ow} />
      </g>}
    </g>
  );
};

// ===================================================================================== CONVEYOR

/**
 * THE BELT, working height, the belt surface moving WITH the parts on it (a still belt under sliding parts
 * reads as parts skidding). `w` is the library's length unit, so a call written for the library is the
 * same length here. Flagged parts glow orange with a tag above them, and they keep moving, because a flag
 * is not a stop. Origin at the left end, as in the library.
 */
export const ConveyorV2: React.FC<RigV2 & {w?: number; speed?: number; parts?: number; flagged?: number[]}> = (p) => {
  const {frame = 0, seed = 2, w = 420, speed = 1, parts = 6, flagged = []} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const W = w * 0.9;
  const march = (frame * speed * 2.4 * 0.9) % 30;
  const spin = frame * speed * 30;
  return (
    <g transform={at(p, false)}>
      <defs><Lit id={`${id}-f`} c={TEAL} x2={0} /><Lit id={`${id}-p`} c="#b8c4ea" /><Lit id={`${id}-x`} c={SAFETY} /></defs>
      <ContactShadow x={W / 2} y={2} w={W * 1.05} opacity={0.14} />
      <Pass ow={ow} parts={[
        ...[0.06, 0.5, 0.94].flatMap((k) => [pt(rr(W * k - 5, -80, 10, 78, 4), shade(TEAL, 0.3), TEAL), pt(rr(W * k - 12, -6, 24, 6, 3), DARK, DARK)]),
        pt(rr(-8, -100, W + 16, 22, 11), `url(#${id}-f)`, TEAL),
        pt(rr(-2, -104, W + 4, 8, 4), '#2f2f58', '#2f2f58'),
      ]} />
      {/* the belt's cleats, MOVING */}
      <g clipPath={`url(#${id}-c)`}>
        <defs><clipPath id={`${id}-c`}><rect x={0} y={-104} width={W} height={8} /></clipPath></defs>
        {Array.from({length: Math.ceil(W / 30) + 2}, (_, i) => <path key={i} d={`M${f1(i * 30 + march - 30)} -103 l0 6`} stroke="#5a5a90" strokeWidth={2.4} />)}
      </g>
      {/* end drums turning, and the rollers on the return side */}
      {[2, W - 2].map((dx) => <g key={dx} transform={`translate(${f1(dx)} -90) rotate(${f1(spin)})`}>
        <circle r={10 + ow} fill={line(STEEL)} /><circle r={10} fill={STEEL} /><path d="M-7 0 L7 0" stroke="#7d84a8" strokeWidth={2.4} /></g>)}
      {Array.from({length: Math.floor(W / 42)}, (_, i) => <circle key={i} cx={24 + i * 42} cy={-78} r={4.5} fill={light(TEAL, 0.3)} stroke={line(TEAL)}
        strokeWidth={ow} />)}
      <path d={`M6 -96 L${f1(W - 6)} -96`} stroke="#ffffff" strokeWidth={2.6} strokeLinecap="round" opacity={0.35} />
      <path d={rr(W * 0.25, -92, W * 0.5, 6, 3)} fill={`url(#${id}-x)`} opacity={0.9} />
      {/* the parts */}
      {Array.from({length: parts}, (_, i) => {
        const step = W / parts;
        const px = ((i * step + march * 2.2) % (W + step)) - step * 0.5;
        if (px < -10 || px > W + 10) return null;
        const bad = flagged.includes(i);
        const k = rnd(seed, i);
        const c = bad ? SAFETY : '#b8c4ea';
        return <g key={i} transform={`translate(${f1(px)} -104)`}>
          {bad && <Glow x={0} y={-10} r={30} color={SAFETY} opacity={0.45} />}
          <Pass ow={ow} parts={[pt(rr(-14, -20, 28, 20, 6), bad ? `url(#${id}-x)` : `url(#${id}-p)`, c)]} />
          <path d={rr(-9, -15, 18, 4, 2)} fill={shade(c, 0.25)} />
          <circle cx={f1(-6 + k * 12)} cy={-7} r={2} fill={shade(c, 0.4)} />
          <Sheen d="M-9 -17 L4 -17" w={2.4} op={0.6} />
          {bad && <g transform={`rotate(${f1(Math.sin(frame / 6 + i) * 6)} 0 -20)`}>
            <path d="M0 -20 L0 -40" stroke="#7d84a8" strokeWidth={2} strokeLinecap="round" />
            <path d={rp([[0, -44], [16, -40], [0, -34]], 2)} fill="#ffc22e" stroke={line('#ffc22e')} strokeWidth={ow} />
          </g>}
        </g>;
      })}
    </g>
  );
};

// ===================================================================================== INSPECTION HEAD

/**
 * THE INSPECTION CAMERA on its gantry, and its ring light. The ring is what makes it read as machine
 * vision and not a security camera, a bright even annulus that fires once per `cycle` and throws a soft
 * pool on the part below. `verdict` draws pass or fail beside it (nothing by default, because a verdict
 * on every part is a claim about a model's output). `mood` is optional and puts the Visor face on the
 * camera body, for the beat where the model is the character.
 */
export const InspectionHeadV2: React.FC<RigV2 & {verdict?: 'pass' | 'fail' | null; cycle?: number; mood?: MachineMood}> = (p) => {
  const {frame = 0, seed = 3, verdict = null, cycle = 48, mood} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const phase = ((frame + rnd(seed, 1) * cycle) % cycle) / cycle;
  const strobe = phase < 0.1;
  const body = '#3f4fa8';
  const pulse = 0.5 + 0.5 * Math.sin(frame / 5);
  return (
    <g transform={at(p, false)}>
      <defs><Lit id={`${id}-b`} c={body} /><Cyl id={`${id}-r`} c={STEEL} vertical />
        <radialGradient id={`${id}-pool`} cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#eaf6ff" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#eaf6ff" stopOpacity={0} /></radialGradient>
        <linearGradient id={`${id}-cone`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#eaf6ff" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#eaf6ff" stopOpacity={0} /></linearGradient></defs>
      {/* the cone and pool of the strobe, under everything */}
      <path d="M-12 -4 L12 -4 L30 22 L-30 22 Z" fill={`url(#${id}-cone)`} opacity={strobe ? 1 : 0.25} />
      <ellipse cx={0} cy={22} rx={28} ry={6} fill={`url(#${id}-pool)`} opacity={strobe ? 0.9 : 0.25} />
      <path d="M11 -30 q14 -4 12 -19" fill="none" stroke={line('#3b3f66')} strokeWidth={2.2 + ow * 1.4} strokeLinecap="round" />
      <path d="M11 -30 q14 -4 12 -19" fill="none" stroke="#4a4f80" strokeWidth={2.2} strokeLinecap="round" />
      <Pass ow={ow} parts={[
        pt(rr(-53, -56, 106, 7, 3.5), `url(#${id}-r)`, STEEL),
        pt(rr(-5, -50, 10, 16, 3), shade(body, 0.2), body),
        pt(rr(-15, -37, 30, 24, 8), `url(#${id}-b)`, body),
        pt(rr(-7, -15, 14, 8, 3), DARK, DARK),
      ]} />
      {[-40, -20, 20, 40].map((bx) => <circle key={bx} cx={bx} cy={-52.5} r={1.2} fill="#7d84a8" />)}
      <Sheen d="M-50 -54.5 L50 -54.5" w={1.4} op={0.6} />
      <Sheen d="M-10 -34 L6 -34" w={2} op={0.5} />
      {mood ? <Visor x={0} y={-25} w={22} h={11} mood={mood} frame={frame} /> : <g>
        <path d={rr(-10, -30, 20, 8, 4)} fill="#1f2a66" /><circle cx={6} cy={-26} r={1.6} fill="#38e08a" /></g>}
      {/* the ring light */}
      <circle cx={0} cy={-5} r={14} fill="none" stroke={line(STEEL)} strokeWidth={4.4 + ow * 2} />
      <circle cx={0} cy={-5} r={14} fill="none" stroke={strobe ? '#ffffff' : '#dfe8ff'} strokeWidth={4.4} />
      {Array.from({length: 12}, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <circle key={i} cx={f1(Math.cos(a) * 14)} cy={f1(-5 + Math.sin(a) * 14)} r={1} fill={strobe ? '#ffffff' : '#a8b8e8'} />;
      })}
      {strobe && <Glow x={0} y={-5} r={30} color="#eaf6ff" opacity={0.7} />}
      {verdict && <g transform="translate(31 -30)">
        {verdict === 'fail' && <Glow x={0} y={0} r={18} color="#ff4d5e" opacity={0.35 + 0.3 * pulse} />}
        <Pass ow={ow} parts={[pt(rr(-9, -8, 18, 16, 5), verdict === 'pass' ? '#2fbf71' : '#ff4d5e', verdict === 'pass' ? '#2fbf71' : '#ff4d5e')]} />
        {verdict === 'pass'
          ? <path d="M-4 0 l3 3.4 l5.4 -7" fill="none" stroke="#ffffff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          : <path d="M-3.6 -3.6 l7.2 7.2 M3.6 -3.6 l-7.2 7.2" stroke="#ffffff" strokeWidth={2.2} strokeLinecap="round" />}
        <path d="M-6 -6 L2 -6" stroke="#ffffff" strokeWidth={1.4} strokeLinecap="round" opacity={0.5} />
      </g>}
    </g>
  );
};

// ===================================================================================== TOOL BAY

/**
 * THE FAB TOOL BAY, the wall of process tools a fab floor is made of. A clean white enclosure with a
 * coloured accent band, a window with the wafer robot swinging behind it (a disc on a two-link arm), the
 * load port at waist height with its pod, and the stack light on top that carries the state across the
 * room ('run' green, 'idle' amber, 'down' red and blinking). The painted lane in front is scuffed.
 */
export const ToolBayV2: React.FC<RigV2 & {bays?: number; state?: (('run' | 'idle' | 'down') | null)[]}> = (p) => {
  const {frame = 0, seed = 4, bays = 4, state = []} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const bw = 326, tw = 300, H = 340;
  const accents = ['#3f6fd8', '#2fb3a8', '#7a5bd8', '#e0569a'];
  const shell = '#eceff8';
  return (
    <g transform={at(p, false)}>
      <defs><Lit id={`${id}-e`} c={shell} x2={0.6} a={0.3} b={0.22} /><Lit id={`${id}-pod`} c="#4f63c8" />
        <linearGradient id={`${id}-w`} x1="0" y1="0" x2="0.3" y2="1"><stop offset="0%" stopColor="#3a4a9a" /><stop offset="100%" stopColor="#161a48" />
        </linearGradient></defs>
      <ContactShadow x={(bays * bw) / 2} y={3} w={bays * bw * 1.08} opacity={0.26} />
      {/* the painted lane, scuffed */}
      <path d={rr(-80, 8, bays * bw + 160, 28, 14)} fill="#ffc22e" opacity={0.75} />
      {Array.from({length: 22}, (_, i) => {
        const k = rnd(seed, 200 + i);
        return k > 0.55 ? <path key={i} d={rr(-70 + i * ((bays * bw + 140) / 22), 12, 20 + k * 30, 20, 10)} fill="#d8cfc0" opacity={0.7} /> : null;
      })}
      {Array.from({length: bays}, (_, i) => {
        const on = state[i] ?? null;
        const k = rnd(seed, i);
        const acc = accents[i % accents.length];
        const swing = Math.sin(frame / 26 + k * 6);
        const sh: [number, number] = [150, -214];
        const el: [number, number] = [sh[0] + Math.cos(-0.6 + swing * 0.9) * 54, sh[1] + Math.sin(-0.6 + swing * 0.9) * 20];
        const wf: [number, number] = [el[0] + Math.cos(0.4 - swing * 1.4) * 50, el[1] + Math.sin(0.4 - swing * 1.4) * 14];
        return <g key={i} transform={`translate(${i * bw} 0)`}>
          <Pass ow={ow} parts={[
            pt(rr(0, -H, tw, H, 22), `url(#${id}-e)`, shell),
            pt(rr(54, -150, 192, 34, 10), shade(shell, 0.12), shell),
            pt(rr(84, -196, 132, 50, 12), `url(#${id}-pod)`, '#4f63c8'),
          ]} />
          <path d={rr(10, -H + 12, tw - 20, 40, 16)} fill={acc} /><path d={`M30 ${-H + 22} L150 ${-H + 22}`} stroke="#ffffff" strokeWidth={6} strokeLinecap="round" opacity={0.4} />
          <path d={rr(10, -44, tw - 20, 32, 14)} fill="#5a6090" /><path d={rr(tw - 44, -H + 64, 30, H - 120, 15)} fill={shade(shell, 0.18)} />
          {/* the window and the wafer robot behind it */}
          <path d={rr(40, -296, 220, 98, 16)} fill={line(shell)} />
          <path d={rr(44, -292, 212, 90, 13)} fill={`url(#${id}-w)`} />
          <path d={`M${sh[0]} ${sh[1]} L${f1(el[0])} ${f1(el[1])} L${f1(wf[0])} ${f1(wf[1])}`} stroke="#9aa8dc" strokeWidth={9} fill="none"
            strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={sh[0]} cy={sh[1]} r={10} fill="#7d8ac4" />
          <ellipse cx={f1(wf[0])} cy={f1(wf[1] - 4)} rx={30} ry={8} fill="#c8b8ff" opacity={0.9} />
          <ellipse cx={f1(wf[0] - 8)} cy={f1(wf[1] - 6)} rx={12} ry={2.4} fill="#ffffff" opacity={0.7} />
          <path d="M60 -282 L130 -282" stroke="#ffffff" strokeWidth={6} strokeLinecap="round" opacity={0.25} />
          {/* the small screen and the pod's handle */}
          <path d={rr(226, -186, 54, 40, 8)} fill="#1f2a66" />
          <path d={`M234 -174 L${f1(234 + 24 + 12 * Math.sin(frame / 20 + k * 5))} -174 M234 -160 L258 -160`} stroke={acc} strokeWidth={4} strokeLinecap="round" />
          <path d={rr(124, -208, 52, 12, 6)} fill={shade('#4f63c8', 0.2)} stroke={line('#4f63c8')} strokeWidth={ow} />
          <Sheen d="M24 -300 L24 -60" w={8} op={0.35} />
          <StackLight x={tw / 2} y={-H} w={30} on={on} frame={frame} ow={ow} />
        </g>;
      })}
    </g>
  );
};

/** every v2 plant floor drawing by name, for the shelf index */
export const PLANTFLOOR_V2 = ['CellArmV2', 'ConveyorV2', 'InspectionHeadV2', 'ToolBayV2'] as const;
