import React from 'react';
import {FONT} from '../../lib/type';
import {light, line, mix, shade} from '../color';
import {ContactShadow, Glow, useUid} from '../Kit';
import {DogV2} from '../props';
import {Figure, castV2} from '../Figure';
import {CM, Cyl, Lit, Pass, Sheen, WheelV, at, f1, owOf, pt, rnd, rp, rr, st} from './compute';
import type {Pt, RigV2} from './compute';

/**
 * VEHICLES, LOOK V2 (November 14th, 2026).
 *
 * What is actually parked in a Texas frame, from lib/vehicles.tsx, redrawn on the v2 rules. The working
 * pickup, the gooseneck stock trailer, the transformer on its lowboy, the tanker, the Houston slab and
 * the bucket truck. Every body is one rounded silhouette, lit from the upper left with the shade pushed
 * toward violet, outlined in its paint's own deep hue, sitting on a contact shadow, and alive (an idle
 * shiver, wheels that turn on `speed`, a whip that sways, a beacon that turns, candy flake that glints).
 *
 * The library's one rule is kept because it is the truth about a working truck. CLEAN ABOVE THE DOOR
 * HANDLES AND CAKED BELOW THEM. The dirt is a soft band clipped to each body, derived from the handle
 * height, never painted on as a stripe.
 *
 * These are plain hardware, so none of them has a face. The bucket truck can carry its lineworker
 * (`crew`), a v2 Figure in the bucket, because it is the one vehicle that puts a person at the height of
 * the problem.
 *
 * NAMES. look/props.tsx already has `PickupV2` (the generic red pickup), so the library's working Pickup
 * with its toolbox, headache rack, lease-road whip, dog and door decal is `WorkPickupV2` here.
 *
 * PLACEMENT is the library's. x, y at the ground, `scale` 1 is true size through lib/scale.ts, `facing`
 * flips, each body built in centimetres to the library's measured heights.
 */
export const VEHICLE_V2_M: Record<string, {h: number; note: string}> = {
  pickup: {h: 2.0, note: 'full-size crew cab, three-quarter ton'},
  stockTrailer: {h: 2.6, note: 'gooseneck, to the top of the slats'},
  tanker: {h: 3.9, note: 'tractor and tank, to the top of the barrel'},
  transformerHaul: {h: 4.6, note: 'lowboy with a distribution transformer on it'},
  bucketTruck: {h: 3.4, note: 'boom stowed'},
  slab: {h: 1.45, note: 'a full-size sedan on swangas'},
};
/** a working fleet's paint, the library's list pushed to v2 chroma */
export const TRUCK_PAINT_V2 = ['#d9dde8', '#c8343c', '#2f62c0', '#2f3350', '#efe6d2', '#3f9060', '#b8904f'] as const;

type VehicleRig = RigV2 & {speed?: number};
const spinOf = (frame: number, speed = 0, r = 40) => frame * speed * 900 / r;
const idle = (frame: number, seed: number) => Math.sin(frame * 1.7 + seed) * 0.5;
/** text inside a flipped vehicle, turned back so it still reads left to right */
const unflip = (p: RigV2, cx: number) => (p.facing ?? 1) < 0 ? `translate(${2 * cx} 0) scale(-1 1)` : undefined;

/** the dirt band, clipped to a body, clean above the handles, caked below, heaviest behind the wheels */
const Dirt: React.FC<{id: string; clip: string; top: number; bottom: number; x0: number; x1: number; dirt: number; wheels: number[]}> = ({
  id, clip, top, bottom, x0, x1, dirt, wheels,
}) => (
  <g clipPath={`url(#${id}-clip)`}>
    <defs><clipPath id={`${id}-clip`}><path d={clip} /></clipPath>
      <linearGradient id={`${id}-dirt`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#b9965f" stopOpacity={0} />
        <stop offset="35%" stopColor="#b9965f" stopOpacity={0.45 * dirt} /><stop offset="100%" stopColor="#8a6a3e" stopOpacity={0.8 * dirt} />
      </linearGradient></defs>
    <rect x={x0} y={top} width={x1 - x0} height={bottom - top} fill={`url(#${id}-dirt)`} />
    {wheels.map((wx) => <ellipse key={wx} cx={wx - 50} cy={bottom - 20} rx={70} ry={30} fill="#7a5a34" opacity={0.4 * dirt} />)}
  </g>
);

// ===================================================================================== WORK PICKUP

/**
 * THE WORK PICKUP, a full-size crew cab with the tall square front that says American and modern, the
 * long overhang at the back where the bed hangs past the axle, and the options that say whose truck it
 * is. `toolbox` (a crossbed box), `headache` (the rack over the back window, ranch and oilfield),
 * `flagWhip` (the tall whip with an orange flag that lease roads require, which says oilfield and
 * nothing else does), `dog` (a v2 ranch dog in the bed), `decal` (a small door decal) and `hauling`.
 */
export const WorkPickupV2: React.FC<VehicleRig & {paint?: string; dirt?: number; toolbox?: boolean; headache?: boolean; flagWhip?: boolean;
  dog?: boolean; decal?: string; hauling?: boolean}> = (p) => {
  const {frame = 0, seed = 1, paint, dirt = 0.55, toolbox = true, headache = false, flagWhip = false, dog = false, decal, hauling = false,
    speed = 0} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const body = paint ?? TRUCK_PAINT_V2[Math.floor(rnd(seed, 3) * TRUCK_PAINT_V2.length)];
  const glass = '#1f2a66', chrome = '#d6dbe9';
  const spin = spinOf(frame, speed, 44), bob = idle(frame, seed);
  const whip = Math.sin(frame / 13 + rnd(seed, 5) * 6) * 8;
  const W = [-162, 236];
  const shell: Pt[] = [[-338, -64], [-340, -140], [-132, -140], [-126, -194], [-110, -202], [70, -202], [118, -148], [292, -142], [340, -132], [342, -64]];
  const shellD = rp(shell, [14, 10, 6, 10, 22, 26, 12, 30, 14, 14]);
  const s = (p.scale ?? 1) * CM, fc = p.facing ?? 1;
  return (
    <g>
      {dog && <DogV2 frame={frame} x={(p.x ?? 0) + fc * -240 * s} y={(p.y ?? 0) + (-120 + bob) * s} scale={(p.scale ?? 1) * 0.95}
        facing={fc} mood="happy" seed={seed + 2} />}
      <g transform={at(p)}>
        <defs><Lit id={`${id}-b`} c={body} x2={0.15} a={0.55} />
          <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0.3" y2="1"><stop offset="0%" stopColor={light(glass, 0.35)} />
            <stop offset="100%" stopColor={shade(glass, 0.3)} /></linearGradient></defs>
        <ContactShadow x={0} y={4} w={760} opacity={0.32} />
        {flagWhip && <g>
          <path d={`M-318 -138 q${f1(whip * 0.4)} -150 ${f1(whip)} -300`} stroke={line('#f2ede0')} strokeWidth={6 + ow * 1.6} fill="none" strokeLinecap="round" />
          <path d={`M-318 -138 q${f1(whip * 0.4)} -150 ${f1(whip)} -300`} stroke="#f2ede0" strokeWidth={6} fill="none" strokeLinecap="round" />
          <path d={`M${f1(whip - 318)} -436 q24 ${f1(4 + Math.sin(frame / 5) * 6)} 48 6 q-22 ${f1(8 - Math.sin(frame / 5) * 5)} -46 20 Z`}
            fill="#ff6a1f" stroke={line('#ff6a1f')} strokeWidth={ow * 1.4} strokeLinejoin="round" />
        </g>}
        {headache && <g>
          <path d="M-128 -138 L-128 -232 Q-128 -244 -116 -244 L-64 -244 Q-52 -244 -52 -232 L-52 -186" stroke={line('#5a6080')}
            strokeWidth={9 + ow * 2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M-128 -138 L-128 -232 Q-128 -244 -116 -244 L-64 -244 Q-52 -244 -52 -232 L-52 -186" stroke="#7d84a8" strokeWidth={9}
            fill="none" strokeLinecap="round" strokeLinejoin="round" />
          {[-108, -90, -72].map((bx) => <path key={bx} d={`M${bx} -240 L${bx} -200`} stroke="#7d84a8" strokeWidth={5} strokeLinecap="round" />)}
        </g>}
        <g transform={`translate(0 ${f1(bob)})`}>
          <Pass ow={ow} parts={[
            pt(shellD, `url(#${id}-b)`, body),
            ...(toolbox ? [pt(rr(-214, -172, 80, 36, 8), '#c8cede', '#c8cede')] : []),
            pt(rr(296, -82, 52, 22, 10), chrome, chrome), pt(rr(-352, -82, 36, 20, 9), chrome, chrome),
            pt(rp([[108, -166], [130, -170], [132, -146], [112, -144]], 5), shade(body, 0.2), body),
          ]} />
          {/* the open bed's far wall, so the bed reads as a bed and not a block */}
          <path d={rr(-330, -138, 194, 10, 5)} fill={shade(body, 0.55)} />
          {/* greenhouse, a crew cab's two door windows split by the B pillar */}
          <path d={rp([[-116, -146], [-112, -188], [64, -190], [104, -146]], [6, 12, 16, 6])} fill={`url(#${id}-g)`} />
          <path d={rr(-22, -192, 14, 50, 5)} fill={shade(body, 0.12)} />
          <path d="M-100 -178 L-40 -182" stroke="#ffffff" strokeWidth={6} strokeLinecap="round" opacity={0.35} />
          <path d="M8 -182 L54 -184" stroke="#ffffff" strokeWidth={6} strokeLinecap="round" opacity={0.35} />
          {/* wheel arches, the eye's clue to where the axles are */}
          {W.map((wx) => <path key={wx} d={`M${wx - 58} -64 A58 58 0 0 1 ${wx + 58} -64 Z`} fill={mix(shade(body, 0.6), '#1d1838', 0.4)} />)}
          <Dirt id={id} clip={shellD} top={-115} bottom={-60} x0={-350} x1={350} dirt={dirt} wheels={W} />
          {/* door seams, handles at 1.15 m, the grille and lamps */}
          {[-122, -14, 106].map((dx) => <path key={dx} d={`M${dx} -138 L${dx} -70`} stroke={shade(body, 0.3)} strokeWidth={3} strokeLinecap="round" />)}
          {[-64, 46].map((hx) => <path key={hx} d={rr(hx, -120, 22, 7, 3.5)} fill={shade(body, 0.4)} />)}
          <path d={rr(312, -134, 30, 54, 8)} fill="#2f3350" />
          {[-124, -112, -100, -88].map((gy) => <path key={gy} d={`M318 ${gy} L338 ${gy}`} stroke="#c8cede" strokeWidth={3.4} strokeLinecap="round" />)}
          <path d={rr(316, -132, 22, 12, 5)} fill="#fff4c4" />
          <Glow x={344} y={-126} r={34} color="#fff1b0" opacity={0.45} />
          <path d={rr(-346, -132, 14, 30, 6)} fill="#ff4d4d" />
          <Sheen d="M-326 -130 L-150 -130" w={7} op={0.45} />
          <Sheen d="M-96 -198 L56 -198" w={6} op={0.5} />
          <Sheen d="M130 -140 L288 -136" w={7} op={0.45} />
          {toolbox && <g><path d="M-208 -160 L-140 -160" stroke="#9aa3c2" strokeWidth={3} strokeLinecap="round" />
            <circle cx={-174} cy={-150} r={4} fill="#5a6080" /><Sheen d="M-206 -168 L-142 -168" w={4} op={0.6} /></g>}
          {decal && <g transform={unflip(p, -70)}>
            <path d={rr(-112, -106, 84, 22, 6)} fill="#ffffff" opacity={0.18} />
            <text x={-70} y={-90} fontSize={14} textAnchor="middle" fill="#ffffff" fontFamily={FONT.body} fontWeight={700} letterSpacing={0.6}>{decal}</text>
          </g>}
          {hauling && <path d="M-352 -74 L-382 -74" stroke={line('#4a4f72')} strokeWidth={12} strokeLinecap="round" />}
          {[-236, 168].map((fx) => <path key={fx} d={rr(fx, -54, 18, 40, 5)} fill="#2a2740" />)}
        </g>
        {W.map((wx) => <WheelV key={wx} cx={wx} cy={-44} r={44} spin={spin} ow={ow} rim="#c9cfe0" />)}
      </g>
    </g>
  );
};

// ===================================================================================== STOCK TRAILER

/**
 * THE STOCK TRAILER, slatted aluminium on a gooseneck, standing dropped on its jack the way most of them
 * stand. The slats are see-through, so with `loaded` the cattle show in the gaps, one of them looking
 * out and flicking an ear.
 */
export const StockTrailerV2: React.FC<VehicleRig & {loaded?: boolean; dirt?: number}> = (p) => {
  const {frame = 0, loaded = false, dirt = 0.5, speed = 0} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const alu = '#cdd4e6', ink = line(alu);
  const shell = rp([[-392, -232], [384, -232], [398, -204], [396, -150], [150, -150], [150, -80], [-392, -80]], [14, 22, 16, 10, 8, 6, 14]);
  const cattle: [number, string][] = [[-330, '#7d4a2e'], [-250, '#3a3150'], [-170, '#c4783f'], [-90, '#5a3a2a'], [-10, '#efe0c8'], [70, '#3a3150']];
  const W = [-250, -150];
  const ear = Math.sin(frame / 9) > 0.85 ? -18 : 0;
  return (
    <g transform={at(p)}>
      <defs><Lit id={`${id}-a`} c={alu} x2={0.1} /></defs>
      <ContactShadow x={-20} y={4} w={860} opacity={0.3} />
      {/* the jack and the coupler post, standing it on the ground */}
      <Pass ow={ow} parts={[st('M350 -150 L350 -18', '#6a7096', 14, '#6a7096'), pt(rr(326, -20, 48, 14, 7), '#4a4f72', '#4a4f72')]} />
      {/* the dark inside, and what stands in it */}
      <path d={rr(-386, -206, 532, 104, 10)} fill="#262445" />
      {loaded && cattle.map(([cx, c], i) => <g key={i}>
        <ellipse cx={cx} cy={-150 + (i % 2) * 6} rx={46} ry={48} fill={c} />
        <ellipse cx={cx - 10} cy={-168} rx={22} ry={12} fill={light(c, 0.35)} opacity={0.6} />
      </g>)}
      {loaded && <g transform="translate(-20 -168)">
        <ellipse cx={0} cy={0} rx={26} ry={22} fill="#efe0c8" />
        <ellipse cx={-26} cy={-12 + ear * 0.4} rx={14} ry={7} fill="#e2cfb2" transform={`rotate(${-20 + ear} -26 -12)`} />
        <circle cx={6} cy={-4} r={7} fill="#ffffff" /><circle cx={8} cy={-3} r={4.4} fill="#1f1736" /><circle cx={6} cy={-5} r={1.6} fill="#ffffff" />
        <ellipse cx={18} cy={10} rx={10} ry={8} fill="#e8a8a0" />
      </g>}
      {/* the slatted shell, rails, slats and the gaps between them */}
      <path d={shell} fill="none" stroke={ink} strokeWidth={ow * 2} strokeLinejoin="round" />
      <path d={rr(-392, -232, 790, 30, 12)} fill={`url(#${id}-a)`} />
      <path d={rp([[150, -232], [384, -232], [398, -204], [396, -150], [150, -150]], [4, 22, 16, 10, 4])} fill={`url(#${id}-a)`} />
      {[-188, -166, -144, -122, -100].map((sy) => <path key={sy} d={rr(-388, sy, 536, 12, 6)} fill={`url(#${id}-a)`} />)}
      <path d={rr(-392, -96, 544, 18, 8)} fill={shade(alu, 0.15)} />
      {[-392, -260, -130, 0, 150].map((px) => <path key={px} d={rr(px - 6, -230, 12, 150, 6)} fill={light(alu, 0.15)} />)}
      <path d={shell} fill="none" stroke={ink} strokeWidth={ow * 1.4} strokeLinejoin="round" />
      {/* the gooseneck nose, the shape that says stock trailer */}
      <path d={rr(178, -214, 110, 40, 12)} fill={shade(alu, 0.25)} />
      <Sheen d="M-380 -224 L380 -224" w={6} op={0.6} />
      {[-380, -200, 0, 140, 300, 380].map((mx, i) => <circle key={mx} cx={mx} cy={-238} r={7} fill={i % 2 ? '#ffb13b' : '#ff4d4d'}
        stroke={line('#ff4d4d')} strokeWidth={2} />)}
      <path d={rr(-400, -150, 12, 40, 5)} fill="#ff4d4d" />
      <path d="M-376 -200 L-376 -100" stroke={shade(alu, 0.4)} strokeWidth={4} strokeLinecap="round" />
      <path d={rr(-372, -160, 18, 10, 4)} fill={shade(alu, 0.5)} />
      <Dirt id={id} clip={shell} top={-140} bottom={-80} x0={-400} x1={400} dirt={dirt} wheels={W} />
      {W.map((wx) => <path key={`f${wx}`} d={`M${wx - 50} -80 A50 50 0 0 1 ${wx + 50} -80 Z`} fill="#2a2744" />)}
      {W.map((wx) => <WheelV key={wx} cx={wx} cy={-40} r={40} spin={spinOf(frame, speed, 40)} ow={ow} rim="#c9cfe0" />)}
    </g>
  );
};

// ===================================================================================== TRANSFORMER HAUL

/**
 * THE TRANSFORMER HAUL, the best picture this show has of its own subject. A data centre needs a
 * connection, a connection needs a transformer, and a transformer is a slow oversize load on a two-lane
 * road. The tank sits DOWN in the lowboy's dropped well with its radiator banks and porcelain bushings,
 * chained and strapped, the axle count under it saying the weight, and `oversize` puts the banner on the
 * cab's roof rack with the orange flags snapping at the corners of the load.
 */
export const TransformerHaulV2: React.FC<VehicleRig & {dirt?: number; oversize?: boolean}> = (p) => {
  const {frame = 0, seed = 3, dirt = 0.45, oversize = true, speed = 0} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const cab = '#d23a3a', deck = '#3d4370', tank = '#6f9e8a', porc = '#b4603a', steel = '#c9cfe0';
  const bob = idle(frame, seed);
  const flap = (k: number) => Math.sin(frame / 4 + k) * 8;
  const deckD = rp([[-700, -186], [-430, -186], [-400, -110], [150, -110], [190, -206], [380, -206], [380, -176], [210, -176], [180, -86],
    [-420, -86], [-450, -150], [-700, -150]], [10, 10, 10, 10, 10, 10, 8, 8, 10, 10, 10, 10]);
  const cabD = rp([[300, -100], [300, -336], [430, -340], [452, -250], [610, -236], [624, -100]], [10, 24, 24, 16, 26, 12]);
  const Wl = [-640, -560, -480], Wt = [400, 470, 566];
  return (
    <g transform={at(p)}>
      <defs><Lit id={`${id}-c`} c={cab} x2={0.15} /><Lit id={`${id}-t`} c={tank} /><Cyl id={`${id}-x`} c={steel} />
        <Cyl id={`${id}-p`} c={porc} /></defs>
      <ContactShadow x={-40} y={4} w={1500} opacity={0.32} />
      <g transform={`translate(0 ${f1(bob)})`}>
        <Pass ow={ow} parts={[
          pt(deckD, deck, deck),
          // the exhaust stack and the cab
          pt(rr(306, -486, 26, 170, 13), `url(#${id}-x)`, steel),
          pt(cabD, `url(#${id}-c)`, cab),
          pt(rr(330, -150, 120, 40, 18), `url(#${id}-x)`, steel),
          // the tank in the well, its radiator banks and its lid
          pt(rr(-396, -400, 440, 290, 24), `url(#${id}-t)`, tank),
          pt(rr(-430, -360, 46, 230, 14), shade(tank, 0.18), tank), pt(rr(32, -360, 46, 230, 14), shade(tank, 0.18), tank),
          pt(rr(-410, -420, 470, 30, 12), light(tank, 0.15), tank),
          ...[-300, -170, -40].map((bx) => pt(rr(bx - 15, -560, 30, 150, 14), `url(#${id}-p)`, porc)),
        ]} />
        {/* radiator fins, porcelain sheds, the nameplate */}
        {[-430, 32].map((rx) => Array.from({length: 5}, (_, i) => <path key={`${rx}${i}`} d={`M${rx + 8 + i * 8} -350 L${rx + 8 + i * 8} -140`}
          stroke={light(tank, 0.25)} strokeWidth={3} strokeLinecap="round" />))}
        {[-300, -170, -40].map((bx) => <g key={bx}>
          {[-540, -512, -484, -456, -428].map((sy) => <path key={sy} d={rr(bx - 24, sy, 48, 10, 5)} fill={light(porc, 0.18)}
            stroke={line(porc)} strokeWidth={ow * 0.8} />)}
          <path d={rr(bx - 9, -576, 18, 20, 6)} fill={steel} stroke={line(steel)} strokeWidth={ow * 0.8} />
        </g>)}
        <path d={rr(-150, -300, 90, 50, 8)} fill="#e9ecf4" opacity={0.85} />
        <Sheen d="M-380 -392 L20 -392" w={8} op={0.5} />
        <Sheen d="M-384 -380 L-384 -140" w={6} op={0.25} />
        {/* the straps and chains, because an unsecured load is the one thing a hauler notices */}
        {[-330, -10].map((sx) => <path key={sx} d={`M${sx} -424 L${sx} -110`} stroke="#ffc22e" strokeWidth={10} strokeLinecap="round" opacity={0.95} />)}
        {[-420, 60].map((cx) => <path key={cx} d={`M${cx} -200 L${cx + (cx < 0 ? -50 : 60)} -112`} stroke="#8a8fb0" strokeWidth={7}
          strokeDasharray="9 6" strokeLinecap="round" />)}
        {/* the cab's glass, mirror, lamp and the steps */}
        <path d={rp([[322, -318], [420, -322], [438, -254], [322, -252]], [6, 10, 8, 6])} fill="#1f2a66" />
        <path d="M334 -306 L400 -308" stroke="#ffffff" strokeWidth={6} strokeLinecap="round" opacity={0.35} />
        <path d={rr(446, -306, 12, 50, 6)} fill="#4a4f72" />
        <path d={rr(600, -200, 24, 24, 8)} fill="#fff4c4" />
        <Glow x={628} y={-190} r={46} color="#fff1b0" opacity={0.45} />
        <path d={rr(316, -132, 88, 14, 7)} fill="#5a6080" />
        <Sheen d="M316 -330 L420 -334" w={6} op={0.5} />
        <Sheen d="M458 -244 L600 -232" w={6} op={0.45} />
        <Dirt id={id} clip={cabD} top={-170} bottom={-96} x0={290} x1={630} dirt={dirt} wheels={[400, 566]} />
        {oversize && <g>
          <path d="M330 -340 L330 -372 M414 -342 L414 -372" stroke="#4a4f72" strokeWidth={6} strokeLinecap="round" />
          <g transform={unflip(p, 372)}>
            <path d={rr(232, -430, 280, 62, 14)} fill="#ffd23a" stroke={line('#ffd23a')} strokeWidth={ow * 1.6} />
            <text x={372} y={-388} fontSize={32} textAnchor="middle" fill="#2b2440" fontFamily={FONT.body} fontWeight={900}>OVERSIZE LOAD</text>
          </g>
          {[[-420, -430, 0], [70, -430, 1], [-700, -192, 2]].map(([fx, fy, k]) => <g key={k}>
            <path d={`M${fx} ${fy} L${fx} ${fy - 70}`} stroke="#4a4f72" strokeWidth={5} strokeLinecap="round" />
            <path d={`M${fx} ${fy - 70} q22 ${f1(flap(k) * 0.4)} 44 ${f1(4 + flap(k))} q-22 ${f1(6 - flap(k) * 0.5)} -44 ${f1(26)} Z`} fill="#ff6a1f"
              stroke={line('#ff6a1f')} strokeWidth={ow} strokeLinejoin="round" />
          </g>)}
        </g>}
      </g>
      {[...Wl, ...Wt].map((wx) => <WheelV key={wx} cx={wx} cy={wx > 0 ? -52 : -40} r={wx > 0 ? 52 : 40} spin={spinOf(frame, speed, 50)} ow={ow}
        rim="#c9cfe0" />)}
    </g>
  );
};

// ===================================================================================== TANKER

/**
 * THE TANKER, the Permian traffic on the two-lane roads and now the water truck too. A polished barrel
 * with real rounded end caps, stiffener rings, the walkway and its hatches along the top, and the valve
 * gear underneath that says liquid rather than grain. `water` makes it the pale water truck with its
 * NON-POTABLE band.
 */
export const TankerV2: React.FC<VehicleRig & {water?: boolean; dirt?: number}> = (p) => {
  const {frame = 0, seed = 4, water = false, dirt = 0.6, speed = 0} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const barrel = water ? '#b9c8dc' : '#3a3f62', cab = '#2f62c0', steel = '#c9cfe0';
  const bob = idle(frame, seed);
  const cabD = rp([[186, -102], [186, -280], [300, -284], [320, -210], [440, -196], [452, -102]], [10, 22, 22, 14, 24, 12]);
  const W = [-330, -236, 262, 372];
  const valve = (frame * 2) % 360;
  return (
    <g transform={at(p)}>
      <defs><Lit id={`${id}-c`} c={cab} x2={0.15} /><Cyl id={`${id}-b`} c={barrel} vertical /><Cyl id={`${id}-x`} c={steel} /></defs>
      <ContactShadow x={-20} y={4} w={1060} opacity={0.32} />
      <g transform={`translate(0 ${f1(bob)})`}>
        <Pass ow={ow} parts={[
          pt(rr(-520, -122, 760, 26, 10), '#3d4370', '#3d4370'),
          pt(rr(196, -404, 24, 128, 12), `url(#${id}-x)`, steel),
          pt(cabD, `url(#${id}-c)`, cab),
          pt(rr(-524, -332, 700, 212, 106), `url(#${id}-b)`, barrel),
          st('M-470 -352 L130 -352', '#9aa3c6', 6, '#9aa3c6', 0.7),
          ...[-460, -300, -140, 20].map((hx) => pt(rr(hx, -350, 56, 22, 10), steel, steel, 0.8)),
        ]} />
        {[-400, -230, -60, 100].map((rx) => <path key={rx} d={`M${rx} -330 Q${rx - 10} -226 ${rx} -122`} stroke={shade(barrel, 0.2)} strokeWidth={10}
          fill="none" strokeLinecap="round" />)}
        {[-470, -270, -70, 130].map((px) => <path key={px} d={`M${px} -334 L${px} -352`} stroke="#9aa3c6" strokeWidth={4} strokeLinecap="round" />)}
        <path d="M-500 -296 Q-180 -318 150 -300" stroke="#ffffff" strokeWidth={14} strokeLinecap="round" fill="none" opacity={0.55} />
        {water && <g>
          <path d={rr(-420, -248, 420, 58, 29)} fill="#2f62c0" opacity={0.9} />
          <g transform={unflip(p, -210)}><text x={-210} y={-208} fontSize={38} textAnchor="middle" fill="#ffffff" fontFamily={FONT.body}
            fontWeight={900} letterSpacing={2}>NON-POTABLE</text></g>
        </g>}
        {/* valve gear underneath, a wheel that someone turns */}
        <path d="M-240 -122 L-240 -84 L-170 -84" stroke={line('#6a7096')} strokeWidth={14 + ow * 1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M-240 -122 L-240 -84 L-170 -84" stroke="#8a90b8" strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <g transform={`translate(-160 -84) rotate(${valve})`}><circle r={18} fill="none" stroke="#ff4d4d" strokeWidth={6} />
          <path d="M-18 0 L18 0 M0 -18 L0 18" stroke="#ff4d4d" strokeWidth={4} strokeLinecap="round" /></g>
        {/* the rear ladder */}
        <path d="M-528 -300 L-528 -110 M-548 -300 L-548 -110" stroke="#8a90b8" strokeWidth={5} strokeLinecap="round" />
        {[-280, -240, -200, -160, -120].map((ly) => <path key={ly} d={`M-548 ${ly} L-528 ${ly}`} stroke="#8a90b8" strokeWidth={4} strokeLinecap="round" />)}
        {/* cab glass, lamp, fuel tank */}
        <path d={rp([[206, -266], [292, -268], [308, -212], [206, -210]], [6, 10, 8, 6])} fill="#1f2a66" />
        <path d="M216 -256 L276 -258" stroke="#ffffff" strokeWidth={6} strokeLinecap="round" opacity={0.35} />
        <path d={rr(428, -180, 22, 22, 8)} fill="#fff4c4" />
        <Glow x={456} y={-170} r={40} color="#fff1b0" opacity={0.45} />
        <path d={rr(214, -150, 110, 36, 18)} fill={`url(#${id}-x)`} stroke={line(steel)} strokeWidth={ow * 1.2} />
        <Sheen d="M206 -276 L292 -280" w={6} op={0.5} />
        <Dirt id={id} clip={cabD} top={-160} bottom={-98} x0={180} x1={460} dirt={dirt} wheels={[262, 372]} />
        <path d={rr(-524, -150, 700, 30, 12)} fill="#b9965f" opacity={dirt * 0.35} />
      </g>
      {W.map((wx) => <WheelV key={wx} cx={wx} cy={-48} r={48} spin={spinOf(frame, speed, 48)} ow={ow} rim="#c9cfe0" />)}
    </g>
  );
};

// ===================================================================================== SLAB

/**
 * THE SLAB, Houston, specific and joyful. A long low candy-painted full-size sedan, the trunk popped on
 * the drive with its neon lid, a fifth wheel on the back, and THE SWANGAS, chrome elbows that stand a foot
 * proud of the tyre. In profile the elbow is drawn the only way a side view can state it, a chrome disc
 * wider than the tyre and over the fender, with its stepped rings shifted toward the viewer so the cone
 * reads. The spokes turn, the flake glints, the neon breathes. `candy` sets the paint.
 */
export const SlabV2: React.FC<VehicleRig & {candy?: string; trunkOpen?: boolean}> = (p) => {
  const {frame = 0, seed = 5, candy = '#7b2fc9', trunkOpen = true, speed = 0} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const chrome = '#e4e8f4';
  const bob = idle(frame, seed);
  const shellD = rp([[-244, -46], [-246, -76], [-200, -86], [-140, -90], [-84, -128], [-50, -136], [70, -136], [100, -126], [146, -90],
    [206, -84], [244, -70], [246, -46]], [10, 14, 20, 12, 14, 18, 16, 12, 14, 16, 12, 10]);
  const W = [-157, 154];
  const spin = frame * 2 + spinOf(frame, speed, 40);
  const neon = 0.7 + 0.3 * Math.sin(frame / 8);
  const glints = Array.from({length: 7}, (_, i) => ({x: -220 + rnd(seed, i) * 440, y: -60 - rnd(seed, i + 9) * 60, k: i}));
  return (
    <g transform={at(p)}>
      <defs><Lit id={`${id}-b`} c={candy} x2={0.1} a={0.6} b={0.45} /><Cyl id={`${id}-c`} c={chrome} vertical />
        <radialGradient id={`${id}-w`} cx="38%" cy="34%" r="70%"><stop offset="0%" stopColor="#ffffff" /><stop offset="55%" stopColor={chrome} />
          <stop offset="100%" stopColor="#9aa3c6" /></radialGradient></defs>
      <ContactShadow x={0} y={4} w={560} opacity={0.32} />
      <g transform={`translate(0 ${f1(bob)})`}>
        {trunkOpen && <g>
          <path d={rp([[-150, -92], [-250, -150], [-262, -132], [-200, -86]], 8)} fill={line(candy)} stroke={line(candy)} strokeWidth={ow * 2} />
          <path d={rp([[-150, -92], [-250, -150], [-262, -132], [-200, -86]], 8)} fill="#2a1f48" />
          <path d="M-168 -100 L-240 -140" stroke="#ff4fd8" strokeWidth={5} strokeLinecap="round" opacity={neon} />
          <path d="M-168 -100 L-240 -140" stroke="#ff4fd8" strokeWidth={14} strokeLinecap="round" opacity={0.25 * neon} />
        </g>}
        <Pass ow={ow} parts={[
          pt(shellD, `url(#${id}-b)`, candy),
          pt(rr(-262, -66, 40, 16, 8), `url(#${id}-c)`, chrome), pt(rr(232, -66, 30, 16, 8), `url(#${id}-c)`, chrome),
          // the fifth wheel on the trunk
          pt(rr(-270, -110, 24, 60, 12), `url(#${id}-c)`, chrome),
        ]} />
        <path d={rp([[-76, -124], [-46, -130], [64, -130], [90, -122], [124, -92], [-122, -92]], [8, 12, 12, 8, 6, 6])} fill="#24245c" />
        <path d={rr(-12, -132, 10, 42, 4)} fill={shade(candy, 0.25)} />
        <path d="M-60 -120 L-24 -122" stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.4} />
        {/* candy is a flake finish, hard highlights, and glints that come and go */}
        <path d="M-232 -74 Q0 -88 236 -68" stroke="#ffffff" strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.55} />
        <path d="M-196 -80 L-150 -84" stroke="#ffffff" strokeWidth={3} strokeLinecap="round" opacity={0.6} />
        <path d="M-230 -56 L230 -54" stroke={light(candy, 0.4)} strokeWidth={2} opacity={0.5} />
        {glints.map((g) => {
          const a = Math.max(0, Math.sin(frame / 6 + g.k * 2.1));
          return a > 0.6 ? <path key={g.k} d={`M${f1(g.x)} ${f1(g.y - 7 * a)} L${f1(g.x + 2)} ${f1(g.y - 2)} L${f1(g.x + 7 * a)} ${f1(g.y)} L${f1(g.x + 2)}
            ${f1(g.y + 2)} L${f1(g.x)} ${f1(g.y + 7 * a)} L${f1(g.x - 2)} ${f1(g.y + 2)} L${f1(g.x - 7 * a)} ${f1(g.y)} L${f1(g.x - 2)} ${f1(g.y - 2)} Z`}
            fill="#ffffff" opacity={a} /> : null;
        })}
        <path d={rr(234, -78, 12, 10, 4)} fill="#fff4c4" />
        <path d={rr(-250, -80, 10, 10, 4)} fill="#ff4d4d" />
        <circle cx={-258} cy={-80} r={9} fill="#2a2740" />
        {W.map((wx) => <path key={wx} d={`M${wx - 50} -46 A50 50 0 0 1 ${wx + 50} -46 Z`} fill="#2a1f48" />)}
      </g>
      {/* the swangas */}
      {W.map((wx) => <g key={wx} transform={`translate(${wx} -38)`}>
        <circle r={38 + ow} fill={line('#2a2740')} />
        <circle r={38} fill="#2a2740" />
        <circle r={33} fill="none" stroke="#f4f4ff" strokeWidth={2.4} />
        <circle r={30} fill="none" stroke="#f2c84b" strokeWidth={1.6} />
        <circle r={46 + ow} fill={line(chrome)} />
        <circle r={46} fill={`url(#${id}-w)`} />
        <g transform={`rotate(${spin})`}>{Array.from({length: 18}, (_, i) => {
          const a = (i / 18) * Math.PI * 2;
          return <path key={i} d={`M${f1(Math.cos(a) * 8)} ${f1(Math.sin(a) * 8)} L${f1(Math.cos(a + 0.5) * 42)} ${f1(Math.sin(a + 0.5) * 42)}`}
            stroke="#ffffff" strokeWidth={1.8} opacity={0.85} />;
        })}</g>
        {[0.78, 0.58, 0.4, 0.24].map((r, i) => <circle key={r} cx={-i * 4} cy={-i * 2.6} r={46 * r} fill={i === 3 ? '#ffffff' : 'none'}
          stroke={i % 2 ? '#ffffff' : '#b7bfd9'} strokeWidth={3 - i * 0.4} />)}
        <circle cx={-16} cy={-10} r={6} fill="#ffffff" opacity={0.9} />
      </g>)}
    </g>
  );
};

// ===================================================================================== BUCKET TRUCK

/**
 * THE BUCKET TRUCK, the utility line truck. Boom stowed in its cradle on the drive (`boom` 0), or raised to
 * the pole (`boom` 1) with the outriggers down, because a boom up on its wheels is a thing no lineworker
 * has ever done. The amber beacon turns whenever the boom is up. `crew` stands a lineworker in the
 * bucket, a v2 Figure in arc-rated clothes and a hard hat.
 */
export const BucketTruckV2: React.FC<VehicleRig & {boom?: number; dirt?: number; crew?: boolean}> = (p) => {
  const {frame = 0, seed = 6, boom = 0, dirt = 0.4, speed = 0, crew = false} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const white = '#eef1f8', stripe = '#ff7a1a', glass = '#1f2a66', fibre = '#f5c43a';
  const b = Math.max(0, Math.min(1, boom));
  const ang = -14 - b * 58 + Math.sin(frame / 40) * b * 1.2, ext = 204 + b * 374;
  const bob = idle(frame, seed);
  const piv: Pt = [-204, -250];
  const r = ang * Math.PI / 180, tip: Pt = [piv[0] + Math.cos(r) * ext, piv[1] + Math.sin(r) * ext];
  const cabD = rp([[136, -96], [136, -248], [266, -258], [290, -170], [346, -160], [350, -96]], [10, 22, 22, 14, 20, 12]);
  const bodyD = rr(-410, -224, 534, 128, 14);
  const W = [238, -258, -340];
  const beacon = b > 0.15 ? (frame * 12) % 360 : -1;
  const bucketTop = tip[1] - 6;
  return (
    <g transform={at(p)}>
      <defs><Lit id={`${id}-w`} c={white} x2={0.15} /><Lit id={`${id}-f`} c={fibre} /></defs>
      <ContactShadow x={-20} y={4} w={900} opacity={0.3} />
      {b > 0.15 && [-430, 104].map((ox) => <Pass key={ox} ow={ow} parts={[
        st(`M${ox} -150 L${ox + (ox < 0 ? -40 : 40)} -60 L${ox + (ox < 0 ? -40 : 40)} -14`, '#ffc22e', 16, '#ffc22e'),
        pt(rr(ox + (ox < 0 ? -72 : 8), -16, 64, 16, 7), '#4a4f72', '#4a4f72')]} />)}
      <g transform={`translate(0 ${f1(bob)})`}>
        <Pass ow={ow} parts={[
          pt(rr(-414, -100, 770, 24, 10), '#3d4370', '#3d4370'),
          pt(bodyD, `url(#${id}-w)`, white),
          pt(cabD, `url(#${id}-w)`, white),
          pt(rp([[-252, -226], [-156, -226], [-174, -280], [-234, -280]], 10), '#c2c8dc', '#c2c8dc'),
        ]} />
        {/* compartment doors, panels with their own fill and handles, never holes */}
        {[-392, -268, -144, -20].map((dx) => <g key={dx}>
          <path d={rr(dx, -210, 112, 96, 10)} fill={shade(white, 0.1)} stroke={shade(white, 0.28)} strokeWidth={3} />
          <path d={rr(dx + 84, -176, 10, 26, 5)} fill="#8a90b8" />
          <path d={`M${dx + 10} -204 L${dx + 100} -204`} stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.7} />
        </g>)}
        <path d={rr(-410, -122, 534, 12, 6)} fill={stripe} />
        <path d={rr(136, -132, 214, 12, 6)} fill={stripe} />
        <path d={rp([[152, -238], [252, -246], [270, -178], [152, -176]], [6, 10, 8, 6])} fill={glass} />
        <path d="M162 -226 L230 -230" stroke="#ffffff" strokeWidth={6} strokeLinecap="round" opacity={0.35} />
        <path d={rr(326, -150, 22, 20, 8)} fill="#fff4c4" />
        <Glow x={352} y={-140} r={40} color="#fff1b0" opacity={0.4} />
        {/* the beacon on the cab roof */}
        <path d={rr(186, -282, 40, 26, 10)} fill="#ffb13b" stroke={line('#ffb13b')} strokeWidth={ow * 1.2} />
        {beacon >= 0 && <><Glow x={206} y={-272} r={70} color="#ffb13b" opacity={0.3 + 0.3 * Math.abs(Math.cos(beacon * Math.PI / 180))} />
          <path d={rr(198 + 12 * Math.sin(beacon * Math.PI / 180), -278, 8, 18, 4)} fill="#fff6d0" /></>}
        <Sheen d="M-400 -216 L114 -216" w={6} op={0.6} />
        <Dirt id={id} clip={bodyD} top={-150} bottom={-96} x0={-420} x1={130} dirt={dirt} wheels={[-258, -340]} />
        <Dirt id={`${id}c`} clip={cabD} top={-150} bottom={-96} x0={130} x1={360} dirt={dirt} wheels={[238]} />
        {/* the boom, lower section white, the insulated upper section fibreglass */}
        <g>
          <path d={`M${piv[0]} ${piv[1]} L${f1(tip[0])} ${f1(tip[1])}`} stroke={line(white)} strokeWidth={44 + ow * 2} strokeLinecap="round" />
          <path d={`M${piv[0]} ${piv[1]} L${f1(piv[0] + Math.cos(r) * ext * 0.55)} ${f1(piv[1] + Math.sin(r) * ext * 0.55)}`} stroke={white}
            strokeWidth={44} strokeLinecap="round" />
          <path d={`M${f1(piv[0] + Math.cos(r) * ext * 0.5)} ${f1(piv[1] + Math.sin(r) * ext * 0.5)} L${f1(tip[0])} ${f1(tip[1])}`}
            stroke={line(fibre)} strokeWidth={32 + ow * 2} strokeLinecap="round" />
          <path d={`M${f1(piv[0] + Math.cos(r) * ext * 0.5)} ${f1(piv[1] + Math.sin(r) * ext * 0.5)} L${f1(tip[0])} ${f1(tip[1])}`}
            stroke={fibre} strokeWidth={32} strokeLinecap="round" />
          <path d={`M${piv[0]} ${piv[1] - 14} L${f1(tip[0] - 6)} ${f1(tip[1] - 14)}`} stroke="#ffffff" strokeWidth={6} strokeLinecap="round" opacity={0.5} />
          <circle cx={piv[0]} cy={piv[1]} r={26} fill="#c2c8dc" stroke={line('#c2c8dc')} strokeWidth={ow * 1.6} />
          <circle cx={piv[0]} cy={piv[1]} r={9} fill="#5a6080" />
        </g>
      </g>
      {/* the lineworker, standing in the bucket */}
      {crew && <Figure {...castV2('lineworker')} frame={frame} x={tip[0] + 14} y={bucketTop + 92 + bob} scale={0.3} pose={b > 0.5 ? 'reach' : 'stand'}
        emotion="determined" turn={0.3} seed={seed} />}
      <g transform={`translate(0 ${f1(bob)})`}>
        <Pass ow={ow} parts={[pt(rp([[tip[0] - 28, bucketTop], [tip[0] + 58, bucketTop], [tip[0] + 52, bucketTop + 96], [tip[0] - 22, bucketTop + 96]],
          [10, 10, 14, 14]), `url(#${id}-f)`, fibre)]} />
        <path d={`M${f1(tip[0] - 24)} ${f1(bucketTop + 22)} L${f1(tip[0] + 54)} ${f1(bucketTop + 22)}`} stroke={shade(fibre, 0.3)} strokeWidth={5} strokeLinecap="round" />
        <Sheen d={`M${f1(tip[0] - 20)} ${f1(bucketTop + 8)} L${f1(tip[0] + 40)} ${f1(bucketTop + 8)}`} w={5} op={0.6} />
      </g>
      {W.map((wx) => <WheelV key={wx} cx={wx} cy={-50} r={50} spin={spinOf(frame, speed, 50)} ow={ow} rim="#c9cfe0" />)}
    </g>
  );
};

/** every v2 vehicle by name, for the shelf index */
export const VEHICLES_V2 = ['WorkPickupV2', 'StockTrailerV2', 'TransformerHaulV2', 'TankerV2', 'SlabV2', 'BucketTruckV2'] as const;
