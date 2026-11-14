import React from 'react';
import {FONT} from '../../lib/type';
import {light, line, shade} from '../color';
import {ContactShadow, Glow, useUid} from '../Kit';
import {Visor} from '../machines';
import {Figure, castV2} from '../Figure';
import {Lit, Pass, Sheen, WheelV, f1, pt, rp, rr, st} from './compute';

/**
 * FREIGHT INVITATION, LOOK V2 (November 14th, 2026).
 *
 * The autonomous freight story from lib/freightinvitation.tsx, redrawn on the v2 rules. These are SCREEN
 * LAYERS, not placed props. Each one draws in the 1080 by 1920 frame and takes the library's Visual props
 * (`mode`, `label`, `status`, `value`, `progress`, `secondary`, `tertiary`) plus `frame`, so a beat written
 * against the library swaps names and nothing else. The modes are the library's. Inside the cab ('cab',
 * 'invite', 'close', 'drive') the frame is the empty driver's seat looking through the windshield, and
 * outside it ('route', 'mileage', 'dock', anything else) it is a map, a gauge or the dock.
 *
 * Screen units stay screen units here, so outlines are a flat 3.4 each side, about 6.8 pixels.
 *
 * The truck is the HERO of this story (the thing that was invited), so it gets the Visor face on its
 * windshield and a lidar dome that turns. The people at the dock are v2 Figures.
 */
export interface FreightVisualV2 {
  mode?: string; label?: string; status?: string; value?: string;
  progress?: number; secondary?: number; tertiary?: number; frame?: number;
}

const INK = '#1c1d45', PAPER = '#fff4e0', COPPER = '#ff9a5a', CYAN = '#38e0f0', CLAY = '#e0876a', ROAD = '#545a96';
const OW = 3.4;
const ease = (n: number) => Math.max(0, Math.min(1, n));
const INTERIOR = ['cab', 'invite', 'close', 'drive'];
const isInterior = (mode: string) => INTERIOR.includes(mode);
const WINDOW = rp([[90, 250], [990, 250], [940, 1200], [140, 1200]], 56);

/** a soft cloud, three lobes and a flat base, drifting */
const Cloud: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${f1(x)} ${y}) scale(${s})`} opacity={0.85}>
    <path d="M-90 20 Q-110 -14 -70 -24 Q-60 -64 -10 -56 Q20 -90 60 -50 Q104 -50 100 -6 Q120 20 90 26 Z" fill="#ffffff" />
    <path d="M-80 18 Q0 8 90 20" stroke="#d8d4f4" strokeWidth={8} fill="none" strokeLinecap="round" />
  </g>
);

// ===================================================================================== BACKDROP

/**
 * THE BACKDROP. Outside, a lit sky over violet plains, the red clay band and the shoulder line, with the
 * loading dock's lit building and rolling shutter in 'dock' and a low sun in 'route'. Inside, the cab's
 * windshield over a lit dashboard, and in 'drive' the road rushing in through the glass with an overhead
 * gantry coming over as `secondary` runs.
 */
export const FreightBackdropV2: React.FC<FreightVisualV2> = ({mode = 'cab', progress = 0, secondary = 0, frame = 0}) => {
  const id = useUid();
  const p = ease(progress), q = ease(secondary);
  const inside = isInterior(mode);
  const drift = (frame * 0.6) % 1400;
  return <g>
    <defs>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6f8fe4" /><stop offset="55%" stopColor="#b8b4f0" />
        <stop offset="100%" stopColor="#f7c8b6" /></linearGradient>
      <linearGradient id={`${id}-gr`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#b3b6e6" /><stop offset="100%" stopColor="#8a8fca" /></linearGradient>
      <Lit id={`${id}-clay`} c={CLAY} x2={0} />
      <linearGradient id={`${id}-in`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#33397a" /><stop offset="100%" stopColor="#1f2254" /></linearGradient>
      <linearGradient id={`${id}-dash`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3a3f82" /><stop offset="100%" stopColor="#1a1c48" /></linearGradient>
      <linearGradient id={`${id}-road`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7a7fb8" /><stop offset="100%" stopColor={ROAD} /></linearGradient>
      <Lit id={`${id}-wall`} c="#5f6fb8" />
      <clipPath id={`${id}-win`}><path d={WINDOW} /></clipPath>
    </defs>
    {!inside && <g>
      <rect width={1080} height={1920} fill={`url(#${id}-sky)`} />
      {mode === 'route' && <g><Glow x={850} y={300} r={240 + p * 30} color="#ffd6a8" opacity={0.6} />
        <circle cx={850} cy={300} r={90 + p * 15} fill="#ffe2b8" /><circle cx={826} cy={276} r={40} fill="#ffffff" opacity={0.45} /></g>}
      <Cloud x={(160 + drift) % 1400 - 160} y={330} s={1.1} /><Cloud x={(760 + drift * 0.7) % 1400 - 160} y={420} s={0.8} />
      <path d="M0 470 Q240 420 520 462 T1080 450 L1080 600 L0 600 Z" fill="#a39be0" opacity={0.6} />
      <rect y={450} width={1080} height={1130} fill={`url(#${id}-gr)`} />
      {mode !== 'dock' && <path d="M0 980 H1080" stroke="#fff0dc" strokeWidth={9} opacity={0.6} strokeLinecap="round" />}
      <path d="M0 1060 Q250 1010 480 1060 T1080 1060 L1080 1450 L0 1450 Z" fill={line(CLAY)} transform="translate(0 -6)" />
      <path d="M0 1060 Q250 1010 480 1060 T1080 1060 L1080 1450 L0 1450 Z" fill={`url(#${id}-clay)`} />
      <path d="M0 1066 Q250 1016 480 1066 T1080 1066" stroke="#ffd2bc" strokeWidth={6} fill="none" opacity={0.55} />
      {mode === 'route' && <path d="M0 700 L1080 600 M0 760 L1080 660" stroke="#fff4e0" strokeWidth={6} opacity={0.3} strokeLinecap="round" />}
      {mode === 'dock' && <g>
        <Pass ow={OW} parts={[pt(rr(70, 580, 940, 720, 40), `url(#${id}-wall)`, '#5f6fb8'), pt(rr(250, 670, 580, 580, 26), '#cdd3ee', '#cdd3ee'),
          pt(rr(272, 692, 536, 536, 14), '#262a5e', '#262a5e')]} />
        {Array.from({length: 6}, (_, i) => <g key={i}><path d={`M276 ${712 + i * 84} H804`} stroke="#3f4590" strokeWidth={14} strokeLinecap="round" />
          <path d={`M276 ${704 + i * 84} H804`} stroke="#5a62b0" strokeWidth={3} strokeLinecap="round" /></g>)}
        <path d={rr(272, 1206, 536, 22, 6)} fill="#ffc22e" />
        {Array.from({length: 9}, (_, i) => <path key={i} d={`M${290 + i * 60} 1228 l22 -22`} stroke={INK} strokeWidth={9} strokeLinecap="round" />)}
        {[214, 830].map((bx) => <Pass key={bx} ow={OW} parts={[pt(rr(bx, 1150, 36, 110, 12), '#2f2f58', '#2f2f58')]} />)}
        <Pass ow={OW} parts={[pt(rr(500, 618, 80, 30, 12), '#4a4f80', '#4a4f80')]} />
        <Glow x={540} y={660} r={130} color="#fff1b0" opacity={0.55} />
        <path d={rr(512, 640, 56, 10, 5)} fill="#fff6d0" />
        <Sheen d="M110 610 L970 610" w={10} op={0.35} />
        <path d={rr(110, 640, 100, 60, 14)} fill="#ffc22e" /><text x={160} y={682} fontSize={34} textAnchor="middle" fill={INK} fontFamily={FONT.body}
          fontWeight={800}>12</text>
      </g>}
    </g>}
    {inside && <g>
      <rect width={1080} height={1920} fill={`url(#${id}-in)`} />
      <g clipPath={`url(#${id}-win)`}>
        <rect x={80} y={240} width={920} height={980} fill={`url(#${id}-sky)`} />
        <Cloud x={(300 + drift * 0.5) % 1100} y={420} s={0.9} />
        <path d="M80 860 Q300 820 540 846 T1000 830 L1000 1220 L80 1220 Z" fill="#9a96dc" />
        <path d="M80 900 Q320 870 560 890 T1000 880 L1000 1220 L80 1220 Z" fill={`url(#${id}-gr)`} />
        {mode === 'drive' && <g>
          <path d="M508 870 L140 1220 L960 1220 L568 870 Z" fill={`url(#${id}-road)`} />
          <path d="M508 870 L170 1210 M568 870 L930 1210" stroke="#fff4e0" strokeWidth={8} opacity={0.6} />
          <path d="M538 880 L538 1220" stroke={PAPER} strokeWidth={12} strokeDasharray="45 65" strokeDashoffset={-p * 100 - frame * 6} opacity={0.9} />
          <g transform={`translate(0 ${f1(q * 330)})`}>
            <path d="M125 475 H960" stroke={line('#3f4a90')} strokeWidth={96} strokeLinecap="round" />
            <path d="M125 475 H960" stroke="#3f4a90" strokeWidth={88} strokeLinecap="round" />
            <path d={rr(380, 448, 320, 64, 14)} fill="#2f9f6a" stroke={line('#2f9f6a')} strokeWidth={OW * 2} />
            <path d="M410 470 H560 M410 492 H520" stroke="#ffffff" strokeWidth={8} strokeLinecap="round" />
            <path d="M640 466 l20 14 l-20 14" stroke="#ffffff" strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M125 440 H960" stroke="#ffffff" strokeWidth={8} opacity={0.35} strokeLinecap="round" />
            <path d="M225 520 V860 M855 520 V860" stroke={line('#3f4a90')} strokeWidth={36} strokeLinecap="round" />
            <path d="M225 520 V860 M855 520 V860" stroke="#3f4a90" strokeWidth={28} strokeLinecap="round" />
          </g>
        </g>}
      </g>
      <path d={WINDOW} fill="none" stroke="#15163a" strokeWidth={30} />
      <path d={WINDOW} fill="none" stroke="#4a4f98" strokeWidth={6} opacity={0.6} />
      <path d="M470 250 L510 1210" stroke="#15163a" strokeWidth={26} strokeLinecap="round" />
      <path d="M490 280 L600 1170" stroke="#ffffff" strokeWidth={10} opacity={0.18} strokeLinecap="round" />
      <path d="M150 300 L230 300" stroke="#ffffff" strokeWidth={10} opacity={0.3} strokeLinecap="round" />
      <path d="M90 1200 H990 L1080 1590 H0 Z" fill={`url(#${id}-dash)`} />
      <path d="M130 1100 Q540 970 950 1100" fill="none" stroke={line('#4a4f98')} strokeWidth={30} strokeLinecap="round" />
      <path d="M130 1100 Q540 970 950 1100" fill="none" stroke="#4a4f98" strokeWidth={22} strokeLinecap="round" />
      <path d="M90 1204 H990" stroke="#5a62b8" strokeWidth={8} strokeLinecap="round" />
    </g>}
    <rect y={1580} width={1080} height={340} fill={INK} />
    <path d="M0 1582 H1080" stroke="#3a3f82" strokeWidth={6} />
  </g>;
};

// ===================================================================================== ROUTE

/** a map pin, a teardrop with a lit face and a hole, for a city on the route */
const Pin: React.FC<{x: number; y: number; c: string}> = ({x, y, c}) => (
  <g transform={`translate(${x} ${y})`}>
    <Pass ow={OW} parts={[pt('M0 0 C-30 -40 -40 -56 -40 -76 A40 40 0 1 1 40 -76 C40 -56 30 -40 0 0 Z', c, c)]} />
    <circle cx={0} cy={-76} r={15} fill={shade(c, 0.35)} /><circle cx={-12} cy={-92} r={8} fill="#ffffff" opacity={0.6} />
  </g>
);

/**
 * THE ROUTE LAYER. Inside the cab it is the road ahead through the glass and the navigation chevron, the
 * dashes rushing in 'drive' and the copper line of the offered segment in 'close'. Outside it is the map
 * from Dallas to Houston with the one segment lit in copper and the truck's dot on it ('route'), the
 * mileage ring ('mileage'), the dock plate ('dock') or the plain ribbon of road.
 */
export const FreightRouteV2: React.FC<FreightVisualV2> = ({mode = 'cab', progress = 0, secondary = 0, frame = 0}) => {
  const id = useUid();
  const p = ease(progress), q = ease(secondary);
  if (isInterior(mode)) return <g>
    <defs><clipPath id={`${id}-dw`}><path d="M190 330 H900 L870 1120 H215 Z" /></clipPath></defs>
    {mode !== 'drive' && <g opacity={0.85}>
      <path d="M525 630 Q610 740 555 980" fill="none" stroke={line(ROAD)} strokeWidth={84} strokeLinecap="round" />
      <path d="M525 630 Q610 740 555 980" fill="none" stroke={ROAD} strokeWidth={74} strokeLinecap="round" />
      <path d="M540 690 L560 735 M555 825 L560 875" stroke={PAPER} strokeWidth={9} strokeLinecap="round" />
    </g>}
    {mode === 'drive' && <g clipPath={`url(#${id}-dw)`}>
      {[0, 1, 2].map((i) => {
        const y = 530 + i * 185 + q * 260, w = 14 + i * 12 + q * 17;
        return <g key={i}>
          <path d={rp([[540 - w, y], [540 + w, y], [555 + w * 1.6, y + 75], [555 - w * 1.6, y + 75]], 6)} fill={PAPER} opacity={0.8} />
          <path d={`M${f1(735 + i * 38 + q * 65)} ${f1(y - 22)} L${f1(735 + i * 38 + q * 65)} ${f1(y + 80)}`} stroke="#ffffff" strokeWidth={8 + i * 4}
            opacity={0.55} strokeLinecap="round" />
          <circle cx={f1(735 + i * 38 + q * 65)} cy={f1(y - 22)} r={6 + i * 2} fill="#ff4d5e" opacity={0.8} />
        </g>;
      })}
    </g>}
    {mode === 'close' && <path d={`M525 720 Q620 835 ${f1(570 + q * 280)} 1060`} fill="none" stroke={COPPER} strokeWidth={14} strokeLinecap="round" />}
    <g transform={`translate(${f1(p * 190)} 0)`}>
      <Glow x={622} y={614} r={46} color={CYAN} opacity={0.5 + 0.2 * Math.sin(frame / 6)} />
      <path d="M606 588 L640 612 L620 642" fill="none" stroke={line(CYAN)} strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M606 588 L640 612 L620 642" fill="none" stroke={CYAN} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </g>;
  if (mode === 'route') {
    const dot = {x: 400 + 55 * p, y: 650 + 180 * p};
    return <g>
      <path d="M225 390 C610 410 180 950 760 1160" fill="none" stroke={line('#2a2f63')} strokeWidth={164} strokeLinecap="round" />
      <path d="M225 390 C610 410 180 950 760 1160" fill="none" stroke="#2f3470" strokeWidth={150} strokeLinecap="round" />
      <path d="M225 390 C610 410 180 950 760 1160" fill="none" stroke="#4a4f98" strokeWidth={130} strokeLinecap="round" opacity={0.5} />
      <path d="M225 390 C610 410 180 950 760 1160" fill="none" stroke={PAPER} strokeWidth={10} strokeDasharray="16 24" strokeDashoffset={-frame * 2}
        strokeLinecap="round" opacity={0.75} />
      <path d="M390 620 Q360 800 480 875" fill="none" stroke={line(COPPER)} strokeWidth={30} strokeLinecap="round"
        strokeDasharray={`${Math.max(1, q * 310)} 400`} />
      <path d="M390 620 Q360 800 480 875" fill="none" stroke={COPPER} strokeWidth={22} strokeLinecap="round" strokeDasharray={`${Math.max(1, q * 310)} 400`} />
      <Pin x={225} y={410} c={PAPER} /><Pin x={760} y={1180} c={PAPER} />
      <text x={282} y={372} fill={PAPER} fontSize={49} fontWeight={800} fontFamily={FONT.body} letterSpacing={1}>DALLAS</text>
      <text x={610} y={1252} fill={PAPER} fontSize={49} fontWeight={800} fontFamily={FONT.body} letterSpacing={1}>HOUSTON</text>
      {p > 0.02 && <g><Glow x={dot.x} y={dot.y} r={60} color={CYAN} opacity={0.6} />
        <circle cx={f1(dot.x)} cy={f1(dot.y)} r={22 + OW} fill={line(CYAN)} /><circle cx={f1(dot.x)} cy={f1(dot.y)} r={22} fill={CYAN} />
        <circle cx={f1(dot.x - 7)} cy={f1(dot.y - 7)} r={7} fill="#ffffff" opacity={0.7} /></g>}
    </g>;
  }
  if (mode === 'mileage') return <g>
    <circle cx={540} cy={860} r={425} fill="none" stroke={line('#2f3470')} strokeWidth={98} />
    <circle cx={540} cy={860} r={425} fill="none" stroke="#2f3470" strokeWidth={90} />
    <circle cx={540} cy={860} r={445} fill="none" stroke="#4a4f98" strokeWidth={10} opacity={0.6} />
    <circle cx={540} cy={860} r={425} fill="none" stroke={COPPER} strokeWidth={42} strokeLinecap="round" strokeDasharray={`${Math.max(1, p * 2680)} 2700`}
      transform="rotate(-90 540 860)" />
    {Array.from({length: 12}, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return <circle key={i} cx={f1(540 + 425 * Math.cos(a))} cy={f1(860 + 425 * Math.sin(a))} r={10} fill={PAPER} opacity={0.85} />;
    })}
  </g>;
  if (mode === 'dock') return <g>
    <Pass ow={OW} parts={[pt(rr(150, 1184, 780, 34, 14), '#e8c8a8', '#e8c8a8'), pt(rr(155, 1214, 770, 146, 18), '#4f568f', '#4f568f')]} />
    <Sheen d="M170 1192 L910 1192" w={6} op={0.5} />
    <path d="M530 1180 L530 1320" stroke={COPPER} strokeWidth={20} strokeDasharray="35 25" strokeDashoffset={-p * 55 - frame * 2} strokeLinecap="round" />
  </g>;
  return <g>
    <path d="M110 500 Q510 430 950 1080" fill="none" stroke={line('#344a8a')} strokeWidth={178} strokeLinecap="round" />
    <path d="M110 500 Q510 430 950 1080" fill="none" stroke="#3a4490" strokeWidth={165} strokeLinecap="round" />
    <path d="M110 500 Q510 430 950 1080" fill="none" stroke={COPPER} strokeWidth={18} strokeLinecap="round" strokeDasharray={`${Math.max(1, p * 390)} 1400`} />
    <path d="M565 720 L890 1100" stroke={PAPER} strokeWidth={8} strokeDasharray="20 27" opacity={0.25 + 0.55 * q} strokeLinecap="round" />
  </g>;
};

// ===================================================================================== THE TRUCK

/**
 * THE AUTONOMOUS TRUCK, the hero. A white trailer with a cyan stripe, a rounded cab-over in cobalt with
 * the Visor face on its windshield, the sensor mast and its lidar dome turning, and wheels that roll with
 * `wheel`. Local units are the library's, so the library's placements hold.
 */
export const FreightTruckV2: React.FC<{x: number; y: number; scale?: number; wheel?: number; frame?: number; mood?: 'happy' | 'focused'}> = ({
  x, y, scale = 1, wheel = 0, frame = 0, mood = 'focused',
}) => {
  const id = useUid();
  const ow = OW / scale;
  const cab = '#2f62c0', trailer = '#eef1f8';
  const sweep = (frame * 9) % 360;
  return <g transform={`translate(${f1(x)} ${f1(y)}) scale(${scale})`}>
    <defs><Lit id={`${id}-t`} c={trailer} x2={0.2} a={0.3} b={0.3} /><Lit id={`${id}-c`} c={cab} x2={0.6} />
      <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0.4" y2="1"><stop offset="0%" stopColor="#4a5ab0" /><stop offset="100%" stopColor="#1f2a66" /></linearGradient>
      <radialGradient id={`${id}-d`} cx="35%" cy="30%" r="70%"><stop offset="0%" stopColor="#d8fbff" /><stop offset="60%" stopColor={CYAN} />
        <stop offset="100%" stopColor="#1f8fb0" /></radialGradient></defs>
    <ContactShadow x={-40} y={74} w={720} opacity={0.32} />
    <Pass ow={ow} parts={[
      st('M120 -104 L120 -150 L183 -150 L183 -104', '#5a6080', 10, '#5a6080'),
      pt(rr(-354, -128, 400, 150, 24), `url(#${id}-t)`, trailer),
      pt(rr(30, 4, 30, 18, 6), '#3d4370', '#3d4370'),
      pt(rp([[45, -104], [188, -104], [258, -24], [258, 28], [45, 28]], [12, 30, 16, 12, 12]), `url(#${id}-c)`, cab),
      pt(rr(238, -14, 54, 36, 12), COPPER, COPPER),
    ]} />
    <path d={rr(-340, -40, 372, 22, 11)} fill={CYAN} />
    <path d="M-330 -112 L20 -112" stroke="#ffffff" strokeWidth={8} strokeLinecap="round" opacity={0.6} />
    <path d="M-190 -88 l26 22 l-26 22" stroke={CYAN} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
    {[-250, -120, 155].map((w) => <path key={w} d={`M${w - 52} 28 A52 52 0 0 1 ${w + 52} 28 Z`} fill="#1d1838" opacity={0.7} />)}
    <path d={rp([[140, -94], [186, -94], [238, -30], [140, -30]], [10, 18, 8, 8])} fill={`url(#${id}-g)`} />
    <Visor x={186} y={-60} w={62} h={30} mood={mood} frame={frame} />
    <path d={rr(60, -86, 60, 46, 10)} fill={shade(cab, 0.2)} />
    <path d="M70 -76 L104 -76" stroke="#ffffff" strokeWidth={5} strokeLinecap="round" opacity={0.3} />
    <Sheen d="M60 -98 L180 -98" w={6} op={0.5} />
    <Glow x={292} y={4} r={44} color="#fff1b0" opacity={0.5} />
    <circle cx={151} cy={-160} r={24 + ow} fill={line(CYAN)} /><circle cx={151} cy={-160} r={24} fill={`url(#${id}-d)`} />
    <g transform={`translate(151 -160) rotate(${sweep})`}><path d="M0 0 L20 -6 A21 21 0 0 1 20 6 Z" fill="#ffffff" opacity={0.75} /></g>
    <Glow x={151} y={-160} r={50} color={CYAN} opacity={0.35} />
    {[-250, -120, 155].map((w) => <WheelV key={w} cx={w} cy={32} r={40} spin={wheel * 360} ow={ow} rim="#c9cfe0" />)}
  </g>;
};

// ===================================================================================== CAB

/**
 * THE CAB LAYER. Inside, the two seats (the driver's is empty, which is the whole story), the steering
 * wheel turning on its own, the cab door sliding away in 'cab', the paper of the invitation coming down,
 * and a cyan ring on it in 'close'. Outside, the truck, on the map, at the gauge, or backing to the dock
 * where a dock hand waves it in.
 */
export const FreightCabV2: React.FC<FreightVisualV2> = ({mode = 'cab', progress = 0, secondary = 0, tertiary = 0, frame = 0}) => {
  const id = useUid();
  const p = ease(progress), q = ease(secondary), z = ease(tertiary);
  if (isInterior(mode)) {
    const seat = '#4a5ab0';
    const seatL = 'M290 1030 Q280 800 405 785 Q530 800 515 1030 L540 1410 H265 Z';
    const seatR = 'M615 1030 Q600 800 730 785 Q855 800 845 1030 L870 1410 H590 Z';
    const steer = 90 * Math.sin(p * 0.9) + Math.sin(frame / 20) * 4;
    return <g>
      <defs><Lit id={`${id}-s`} c={seat} x2={0.5} /><Lit id={`${id}-door`} c="#34407e" /></defs>
      <Pass ow={OW} parts={[pt(seatL, `url(#${id}-s)`, seat), pt(seatR, `url(#${id}-s)`, seat),
        pt(rr(345, 740, 120, 70, 30), light(seat, 0.1), seat), pt(rr(670, 740, 120, 70, 30), light(seat, 0.1), seat)]} />
      {[[405, 0], [730, 0]].map(([cx]) => <g key={cx}>
        <path d={`M${cx - 70} 900 Q${cx} 880 ${cx + 70} 900 M${cx - 76} 1000 Q${cx} 980 ${cx + 76} 1000`} stroke={shade(seat, 0.25)} strokeWidth={6}
          fill="none" strokeLinecap="round" />
        <path d={`M${cx - 70} 840 Q${cx - 60} 810 ${cx - 20} 806`} stroke="#ffffff" strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.35} />
      </g>)}
      <circle cx={400} cy={1000} r={124} fill="none" stroke={line('#2a2f63')} strokeWidth={36} />
      <circle cx={400} cy={1000} r={124} fill="none" stroke="#2a2f63" strokeWidth={28} />
      <path d="M300 930 A124 124 0 0 1 400 876" stroke="#7a84d0" strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.7} />
      <g transform={`rotate(${f1(steer)} 400 1000)`}>
        <path d="M400 1000 L400 890 M400 1000 L300 1050 M400 1000 L500 1050" stroke={line('#2a2f63')} strokeWidth={26} strokeLinecap="round" />
        <path d="M400 1000 L400 890 M400 1000 L300 1050 M400 1000 L500 1050" stroke="#2a2f63" strokeWidth={18} strokeLinecap="round" />
        <circle cx={400} cy={1000} r={34} fill="#2a2f63" stroke={line('#2a2f63')} strokeWidth={OW * 2} />
        <circle cx={400} cy={1000} r={12} fill={CYAN} />
      </g>
      {mode === 'cab' && <g transform={`translate(${f1(-670 * p)} 0)`}>
        <Pass ow={OW} parts={[pt(rp([[0, 230], [650, 230], [730, 1510], [0, 1510]], [0, 40, 30, 0]), `url(#${id}-door)`, '#34407e')]} />
        <path d={rp([[80, 370], [520, 370], [570, 950], [110, 950]], 30)} fill="#8fa8e8" stroke="#c0cef4" strokeWidth={14} />
        <path d="M130 420 L300 420" stroke="#ffffff" strokeWidth={14} strokeLinecap="round" opacity={0.4} />
        <path d={rr(480, 1060, 120, 30, 15)} fill="#5a62b0" />
      </g>}
      {(mode === 'close' || (mode === 'cab' && q > 0.04)) && <g transform={`translate(0 ${f1(-120 + 120 * q)})`} opacity={Math.max(0.1, q)}>
        <Pass ow={OW} parts={[pt(rr(635, 1060, 185, 130, 16), PAPER, COPPER)]} />
        <path d={rr(635, 1060, 185, 130, 16)} fill="none" stroke={COPPER} strokeWidth={7} />
        <path d="M662 1100 H790 M662 1130 H755" stroke={INK} strokeWidth={10} strokeLinecap="round" />
        <circle cx={790} cy={1160} r={10} fill={COPPER} />
      </g>}
      {mode === 'close' && <g><circle cx={760} cy={930} r={95 + 35 * z} fill="none" stroke={CYAN} strokeWidth={10} opacity={0.7 - z * 0.35} />
        <Glow x={760} y={930} r={140} color={CYAN} opacity={0.25 * (1 - z)} /></g>}
    </g>;
  }
  if (mode === 'route') return <FreightTruckV2 x={315 + 180 * p} y={870 + 35 * p} wheel={p} frame={frame} />;
  if (mode === 'mileage') return <FreightTruckV2 x={590} y={1010} scale={0.55} wheel={p * 2} frame={frame} />;
  if (mode === 'dock') return <g>
    <FreightTruckV2 x={360 + 215 * p} y={1100} scale={0.9} wheel={p} frame={frame} />
    <Figure {...castV2('operator')} frame={frame} x={800 + 102 * q} y={1196} scale={0.5} turn={-0.6} pose={q > 0.4 ? 'point' : 'wave'}
      emotion="happy" seed={7} />
    <g opacity={0.7}><Figure {...castV2('hand')} frame={frame} x={1020} y={1150} scale={0.42} turn={-0.4} emotion="neutral" seed={9} /></g>
  </g>;
  return <FreightTruckV2 x={300 + 280 * p} y={1000 + 90 * p} scale={0.7} wheel={p} frame={frame} />;
};

// ===================================================================================== EVIDENCE

/** a dark rounded card with a lit rim, the panel every evidence line sits on */
const Card: React.FC<{x: number; y: number; w: number; h: number; r?: number; rim?: string; dash?: boolean; op?: number}> = ({
  x, y, w, h, r = 22, rim = '#4a4f98', dash, op = 0.95,
}) => <g opacity={op}>
  <path d={rr(x, y, w, h, r)} fill={INK} stroke={line(INK)} strokeWidth={OW * 2} />
  <path d={rr(x + 5, y + 5, w - 10, h - 10, r - 4)} fill="none" stroke={rim} strokeWidth={dash ? 7 : 5} strokeDasharray={dash ? '18 16' : undefined} />
  <path d={`M${x + r} ${y + 12} L${x + w * 0.45} ${y + 12}`} stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.2} />
</g>;

/**
 * THE EVIDENCE LAYER, the words. The header card with its copper rule, the status line in cyan, and per
 * mode the mileage value, the two invitation cards (OFFERED lit and solid, COMPLETED dashed and dim,
 * the paper sliding into OFFERED), the distance and safety comparison rows, or the closing bar.
 */
export const FreightEvidenceV2: React.FC<FreightVisualV2> = ({mode = 'cab', label = '', status = '', value = '', progress = 0, secondary = 0,
  tertiary = 0}) => {
  const p = ease(progress), q = ease(secondary), r = ease(tertiary);
  const headerOpacity = mode === 'cab' ? Math.max(0.06, q) : 1;
  const statusOpacity = mode === 'invite' || mode === 'limit' ? Math.max(0.04, p) : 1;
  return <g>
    <g opacity={headerOpacity}>
      <Card x={64} y={160} w={952} h={130} r={26} />
      <path d={rr(64, 284, 952, 10, 5)} fill={COPPER} />
      <text x={98} y={240} fill={PAPER} fontFamily={FONT.body} fontWeight={800} fontSize={label.length > 29 ? 38 : 49} letterSpacing={1}>{label}</text>
    </g>
    {status && <g opacity={statusOpacity}>
      <path d={rr(64, 304, 952, 66, 20)} fill={INK} opacity={0.92} />
      <circle cx={96} cy={337} r={9} fill={CYAN} />
      <text x={120} y={348} fill={CYAN} fontFamily={FONT.body} fontWeight={700} fontSize={status.length > 38 ? 25 : 30} letterSpacing={1.4}>{status}</text>
    </g>}
    {mode === 'cab' && <path d={`M700 450 L${f1(860 + 90 * q)} 450`} stroke={COPPER} strokeWidth={14} strokeLinecap="round" />}
    {mode === 'mileage' && <g opacity={Math.max(0.08, p)}>
      <Card x={335} y={570} w={510} h={200} r={36} rim={PAPER} />
      <text x={590} y={700} fill={PAPER} fontFamily={FONT.body} fontWeight={800} fontSize={90} textAnchor="middle">{value}</text>
    </g>}
    {mode === 'invite' && <g>
      <Glow x={307} y={1010} r={260} color={COPPER} opacity={0.2 + 0.25 * p} />
      <Card x={110} y={880} w={395} h={260} rim={COPPER} />
      <Card x={570} y={880} w={395} h={260} rim={PAPER} dash op={0.62} />
      <text x={307} y={1100} fill={PAPER} fontFamily={FONT.body} fontWeight={800} fontSize={42} textAnchor="middle">OFFERED</text>
      <text x={767} y={1100} fill={PAPER} fontFamily={FONT.body} fontWeight={800} fontSize={40} textAnchor="middle" opacity={0.7}>COMPLETED</text>
      <g transform={`translate(${f1(190 + 65 * p)} ${f1(655 + 230 * p)})`}>
        <Pass ow={OW} parts={[pt(rr(0, 0, 235, 117, 18), PAPER, COPPER)]} />
        <path d={rr(0, 0, 235, 117, 18)} fill="none" stroke={COPPER} strokeWidth={7} />
        <path d="M28 43 H205 M28 75 H175" stroke={INK} strokeWidth={10} strokeLinecap="round" />
        <path d="M20 14 L100 14" stroke="#ffffff" strokeWidth={5} strokeLinecap="round" opacity={0.7} />
      </g>
    </g>}
    {mode === 'limit' && <g>
      <Card x={145} y={810} w={790} h={103} r={22} />
      <text x={190} y={876} fill={PAPER} fontFamily={FONT.body} fontWeight={700} fontSize={36}>DISTANCE REPORTED</text>
      <path d={`M610 862 H${f1(610 + 275 * q)}`} stroke={COPPER} strokeWidth={18} strokeLinecap="round" />
      <g opacity={Math.max(0.05, p)}>
        <Card x={145} y={950} w={790} h={230} r={22} rim={PAPER} dash />
        <text x={540} y={1030} fill={PAPER} fontFamily={FONT.body} fontWeight={700} fontSize={40} textAnchor="middle">SAFETY COMPARISON</text>
        <g opacity={r} transform={`translate(${f1((1 - r) * 170)} 0)`}>
          <path d={rr(225, 1082, 630, 58, 16)} fill="none" stroke={PAPER} strokeWidth={6} strokeDasharray="12 16" />
          <path d="M500 1092 V1130" stroke={PAPER} strokeWidth={5} strokeDasharray="9 9" />
        </g>
      </g>
    </g>}
    {mode === 'close' && <g>
      <Card x={245} y={1085} w={650} h={158} r={24} />
      <path d={`M290 1150 H${f1(290 + 140 * p)}`} stroke={COPPER} strokeWidth={20} strokeLinecap="round" />
      <path d="M450 1150 H850" stroke={PAPER} strokeWidth={9} strokeDasharray="14 22" opacity={0.6} strokeLinecap="round" />
      <text x={290} y={1212} fill={PAPER} fontFamily={FONT.body} fontWeight={700} fontSize={25}>OFFERED SEGMENT  /  OPEN COMPARISON</text>
    </g>}
  </g>;
};

/** every v2 freight layer by name, for the shelf index */
export const FREIGHT_V2 = ['FreightBackdropV2', 'FreightRouteV2', 'FreightCabV2', 'FreightEvidenceV2', 'FreightTruckV2'] as const;
