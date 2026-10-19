import React from 'react';
import {FONT, widthOf} from '../../../lib/type';
import {useUid} from '../../../lib/uid';

/**
 * SanAntonioSupport, the fresh authored support group for the 2026-10-19 edition.
 *
 * It gives the one white car a believable San Antonio world and the federal record a paper body:
 *
 *  - a generic airport pickup curb: a concrete canopy on two columns, a stained sidewalk with
 *    expansion joints, a leaning bay sign carrying only pictograms (a plane, a car, an arrow) with a
 *    rust drip under its bolt, a steel bench, a hard shell suitcase, worn bollards, a planter with a
 *    lopsided mesquite, and a painted bay box on the asphalt. No real signage text.
 *  - a worn phone whose plain map screen carries a ride request pin that turns to arriving. No brand.
 *  - a flat street map on a weathered picnic table: the river line, the street grid, a loop road,
 *    an outlined limited area that traces closed with a sixty square miles tag, a February calendar.
 *  - Salado Creek as a limestone bank of stacked pale ledges under live oaks, fast brown water running
 *    toward the viewer, a near bank edge with brush and a live oak, and rain; a flooded residential street of one-storey stucco
 *    and limestone houses, a live oak and a leaning blank street sign; a higher speed roadway with a
 *    median barrier, lane dashes and a sheet of standing water; a fleet lot behind a chain link fence.
 *  - a desk and the federal recall record card with field rows, a lit remedy row and stamps; a grid of
 *    small white car icons that fills; a counter tag; the recall sentence card whose word may lights;
 *    a pen; a tear-off calendar that flips to April 20; check marks; a weather limits tag; a small
 *    updated vehicle map card; and the plans of the same places seen straight down.
 *
 * Every printed word is the source's or a plain label. Maintained but worn, nothing symmetric: the
 * sign leans, a bollard is chipped, the stamp lands crooked, the mesquite reaches one way.
 * Disclosed illustration. Not a real airport, creek, street, road, lot, record page or app screen.
 * Pure function of its props; the episode drives every prop from the film frame clock.
 */

export type P = [number, number];
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const ease = (p: number) => {const q = clamp(p); return q * q * (3 - 2 * q);};
/** A seeded generator, so speckle and rain are the same on every frame and every render. */
export function rng(seed: number) {
 let a = seed >>> 0;
 return () => {a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296;};
}
const frac = (v: number) => v - Math.floor(v);

/** The world's material values under late sodium light from the upper left and a cool storm fill. */
export const SA = {
 concrete: '#CFC6B6', concreteLit: '#E2DACB', concreteDark: '#9E9584', asphalt: '#4A4D52', asphaltDeep: '#36393D',
 paint: '#ECE8DE', limestone: '#D9D0BC', limestoneShade: '#AFA48C', limestoneDeep: '#7F765F',
 oak: '#6F7F55', oakDark: '#4B5A3A', oakLit: '#93A26F', mesquite: '#8A9A5E', bark: '#4A3B2E',
 water: '#7A6343', waterDeep: '#4E3D29', waterLit: '#B39B76', foam: '#E9E1CF', stucco: '#E6D9BF', roof: '#7A6F66',
 signBlue: '#2E4A62', steel: '#A3ABB0', paper: '#F4EFE2', paperEdge: '#CFC5B0', ink: '#1F2630', amber: '#E8A11C',
 amberInk: '#B9730B', grass: '#8E9157', clay: '#5B5145', wood: '#9C7A55', woodDark: '#6E5238',
};

const wrap = (text: string, size: number, maxW: number, bold = false) => {
 const out: string[] = []; let cur = '';
 for (const w of text.split(' ')) {const n = cur ? cur + ' ' + w : w; if (cur && widthOf(n, size, bold) > maxW) {out.push(cur); cur = w;} else cur = n;}
 if (cur) out.push(cur); return out;
};

// ---------------------------------------------------------------- small vernacular -----------------
/** A live oak: a broad, lopsided grey-green crown on a short leaning trunk. Base at (0,0). */
const Oak: React.FC<{h: number; seed?: number; flip?: boolean}> = ({h, seed = 1, flip}) => {
 const r = rng(seed), s = h / 300, puffs = Array.from({length: 11}, () => [lerp(-150, 160, r()), lerp(-300, -170, r()), lerp(46, 82, r())]);
 return <g transform={`scale(${flip ? -s : s} ${s})`} data-part="live-oak">
  <path d="M-10 0C-8 -60 -14 -110 -30 -160M-4 -90C20 -120 50 -150 90 -170M-20 -130C-60 -150 -90 -170 -120 -190" stroke={SA.bark} strokeWidth={16} strokeLinecap="round" fill="none"/>
  <path d="M-14 0C-12 -60 -18 -110 -34 -160" stroke="#2F261D" strokeWidth={5} fill="none" opacity={.5}/>
  {puffs.map(([x, y, rr], i) => <ellipse key={'d' + i} cx={x + 8} cy={y + 10} rx={rr} ry={rr * .62} fill={SA.oakDark}/>)}
  {puffs.map(([x, y, rr], i) => <ellipse key={'m' + i} cx={x} cy={y} rx={rr * .92} ry={rr * .56} fill={SA.oak}/>)}
  {puffs.slice(0, 6).map(([x, y, rr], i) => <ellipse key={'l' + i} cx={x - rr * .3} cy={y - rr * .22} rx={rr * .45} ry={rr * .26} fill={SA.oakLit} opacity={.8}/>)}
  <ellipse cx={20} cy={4} rx={150} ry={10} fill="#1A1814" opacity={.18}/>
 </g>;
};
/** A mesquite: open, feathery and reaching one way. Base at (0,0). */
const Mesquite: React.FC<{h: number; seed?: number}> = ({h, seed = 4}) => {
 const r = rng(seed), s = h / 220;
 const tufts = Array.from({length: 16}, () => [lerp(-40, 150, r()), lerp(-230, -120, r()), lerp(14, 30, r())]);
 return <g transform={`scale(${s})`} data-part="mesquite">
  <path d="M0 0C6 -40 2 -80 20 -120C30 -150 60 -170 100 -190M10 -70C-20 -100 -30 -130 -26 -170M20 -120C60 -130 110 -140 140 -150" stroke={SA.bark} strokeWidth={7} strokeLinecap="round" fill="none"/>
  {tufts.map(([x, y, rr], i) => <ellipse key={i} cx={x} cy={y} rx={rr * 1.5} ry={rr * .55} fill={i % 3 ? SA.mesquite : '#76874E'} opacity={.92}/>)}
 </g>;
};
/** Rain as streaks falling on the film clock. */
export const Rain: React.FC<{t: number; w?: number; h?: number; amount?: number; seed?: number; slant?: number}> = ({t, w = 1080, h = 1920, amount = 1, seed = 31, slant = .18}) => {
 const r = rng(seed), n = Math.round(150 * clamp(amount));
 return <g data-part="rain" opacity={.55}>{Array.from({length: 150}, (_, i) => {
  const x0 = r() * (w + 300) - 150, y0 = r() * h, sp = lerp(1500, 2300, r()), len = lerp(30, 60, r());
  if (i >= n) return null;
  const y = frac((y0 + sp * t) / h) * h, x = x0 - slant * (y - y0);
  return <path key={i} d={`M${x.toFixed(1)} ${y.toFixed(1)}l${(-slant * len).toFixed(1)} ${len.toFixed(1)}`} stroke="#E8EEF2" strokeWidth={2} strokeLinecap="round"/>;
 })}</g>;
};

// ---------------------------------------------------------------- water --------------------------------
/** Brown floodwater in elevation: a lit far edge, a muddy body, ripple streaks moving with the flow
 * (toward the viewer when `toward`, sideways otherwise), foam flecks, and an optional reflection. */
export const Water: React.FC<{x0: number; x1: number; y: number; depth: number; t: number; flow?: number; toward?: boolean;
 reflect?: React.ReactNode; seed?: number; calm?: number; opacity?: number}> =
 ({x0, x1, y, depth, t, flow = 1, toward = false, reflect, seed = 7, calm = 0, opacity = 1}) => {
 const id = useUid('saw'), r = rng(seed), amp = 1 - .85 * clamp(calm);
 const edge = Array.from({length: 25}, (_, i) => {const x = lerp(x0, x1, i / 24); return `${i ? 'L' : 'M'}${x.toFixed(1)} ${(y + 2.5 * amp * Math.sin(x * .03 + t * 3 * flow + seed)).toFixed(1)}`;}).join('');
 return <g data-part="floodwater" opacity={opacity}>
  <defs>
   <linearGradient id={`${id}g`} x1="0" y1={y} x2="0" y2={y + depth} gradientUnits="userSpaceOnUse">
    <stop offset="0" stopColor={SA.waterLit}/><stop offset=".08" stopColor={SA.water}/><stop offset="1" stopColor={SA.waterDeep}/>
   </linearGradient>
   <clipPath id={`${id}c`}><path d={`${edge}L${x1} ${y + depth}L${x0} ${y + depth}Z`}/></clipPath>
  </defs>
  <path d={`${edge}L${x1} ${y + depth}L${x0} ${y + depth}Z`} fill={`url(#${id}g)`}/>
  <g clipPath={`url(#${id}c)`}>
   {reflect && <g opacity={.28}>{reflect}</g>}
   {Array.from({length: 40}, (_, i) => {
    const u = r(), v = r(), len = lerp(40, 140, r()), sp = lerp(.25, .6, r());
    const yy = toward ? y + frac(v + t * sp * flow * .35) * depth : y + v * depth;
    const xx = toward ? lerp(x0, x1, u) : x0 + frac(u + t * sp * flow * .12) * (x1 - x0);
    const near = clamp((yy - y) / Math.max(1, depth));
    return <path key={i} d={`M${xx.toFixed(1)} ${yy.toFixed(1)}h${(len * (.5 + near)).toFixed(1)}`} stroke={i % 4 ? '#A88E68' : SA.foam}
     strokeWidth={1.5 + 2.5 * near} strokeOpacity={(i % 4 ? .45 : .35) * amp} strokeLinecap="round"/>;
   })}
  </g>
  <path d={edge} stroke="#D9CCB2" strokeWidth={2.5} fill="none" opacity={.7}/>
 </g>;
};
/** Spray and a V wake where a wheel meets standing water. Origin at the tyre's contact point. */
export const Wake: React.FC<{amount: number; t: number; scale?: number; dir?: 1 | -1}> = ({amount, t, scale = 1, dir = 1}) => {
 if (amount <= 0) return null;
 const r = rng(77), a = clamp(amount);
 return <g data-part="wake" transform={`scale(${dir * scale} ${scale})`} opacity={a}>
  <path d={`M10 2C-60 ${8 + 6 * a} -160 ${14 + 10 * a} -260 ${18 + 12 * a}`} stroke={SA.foam} strokeWidth={5} fill="none" strokeLinecap="round" opacity={.8}/>
  <path d={`M30 4C-20 ${20 + 6 * a} -120 ${34 + 10 * a} -230 ${44 + 12 * a}`} stroke="#D7CBB4" strokeWidth={3.5} fill="none" strokeLinecap="round" opacity={.6}/>
  {Array.from({length: 26}, (_, i) => {
   const ph = frac(r() + t * lerp(1.4, 2.4, r())), ang = lerp(.25, 1.25, r()), sp = lerp(70, 150, r()) * a;
   const x = 34 + Math.cos(ang) * sp * ph * .9, y = -Math.sin(ang) * sp * ph + 120 * ph * ph;
   return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={(2 + 3 * r()) * (1 - .5 * ph)} fill={SA.foam} opacity={.85 * (1 - ph)}/>;
  })}
  <path d={`M-10 -2C20 ${-30 * a} 50 ${-46 * a} 80 ${-34 * a}`} stroke={SA.foam} strokeWidth={4} fill="none" opacity={.7}/>
 </g>;
};

// ---------------------------------------------------------------- the airport curb -----------------------
/** World coordinates of the curb every eye-level curb shot stands in. */
export const CURB = {farY: 1052, curbY: 1150, roadY: 1170, bay: [490, 900] as P, sign: [820, 1118] as P, bench: [250, 1112] as P,
 suitcase: [488, 1114] as P, canopy: {x0: -80, x1: 720, y: 300}, columns: [110, 610], bollards: [160, 726], planter: [-6, 1090] as P};
const BaySign: React.FC<{lean?: number}> = ({lean = 3.5}) => {
 const [x, y] = CURB.sign;
 return <g transform={`rotate(${lean} ${x} ${y})`} data-part="bay-sign">
  <rect x={x - 6} y={y - 430} width={12} height={430} fill="#6D7479"/><rect x={x - 6} y={y - 430} width={4} height={430} fill="#9AA2A7"/>
  <rect x={x - 82} y={y - 440} width={164} height={176} rx={12} fill={SA.signBlue} stroke="#1E3346" strokeWidth={3}/>
  <rect x={x - 74} y={y - 432} width={148} height={160} rx={8} fill="none" stroke="#E9EEF2" strokeWidth={3}/>
  {/* a plane over a car: pictograms only */}
  <path d={`M${x - 40} ${y - 382}l34 -4l20 -24l9 2l-10 22l26 -2l8 -10l7 1l-5 13l5 13l-7 1l-8 -10l-26 -2l10 22l-9 2l-20 -24l-34 -4Z`} fill="#E9EEF2"/>
  <path d={`M${x - 48} ${y - 304}l8 -20c4 -8 12 -12 22 -12h36c10 0 18 4 22 12l8 20v14h-96Z`} fill="#E9EEF2"/>
  <circle cx={x - 28} cy={y - 288} r={7} fill={SA.signBlue}/><circle cx={x + 28} cy={y - 288} r={7} fill={SA.signBlue}/>
  <rect x={x - 46} y={y - 250} width={92} height={56} rx={6} fill="#E9EEF2"/>
  <path d={`M${x} ${y - 242}v30m-14 -14l14 16l14 -16`} stroke={SA.signBlue} strokeWidth={7} fill="none" strokeLinecap="round"/>
  <circle cx={x} cy={y - 262} r={4} fill="#7B6A55"/>
  <path d={`M${x + 1} ${y - 258}c1 8 -1 16 2 26`} stroke="#9C5A2C" strokeWidth={2.5} opacity={.75} fill="none"/>
 </g>;
};
const Bench: React.FC = () => {
 const [x, y] = CURB.bench;
 return <g data-part="bench">
  <ellipse cx={x + 110} cy={y + 3} rx={120} ry={7} fill="#1A1814" opacity={.22}/>
  {[x + 14, x + 186].map(px => <path key={px} d={`M${px} ${y}l4 -48h10l-2 48Z`} fill="#5E666B"/>)}
  <path d={`M${x} ${y - 50}h204l-6 14h-196Z`} fill={SA.steel} stroke="#6F777D" strokeWidth={1.5}/>
  {[0, 1, 2].map(k => <rect key={k} x={x + 4} y={y - 112 + k * 18} width={196} height={11} rx={3} fill={k === 0 ? '#C3CACE' : SA.steel} stroke="#6F777D" strokeWidth={1}/>)}
  <path d={`M${x + 20} ${y - 118}v70M${x + 184} ${y - 116}v68`} stroke="#5E666B" strokeWidth={6}/>
 </g>;
};
const Suitcase: React.FC<{at?: P}> = ({at}) => {
 const [x, y] = at ?? CURB.suitcase;
 return <g data-part="suitcase">
  <ellipse cx={x + 6} cy={y + 2} rx={44} ry={6} fill="#1A1814" opacity={.25}/>
  <path d={`M${x - 14} ${y - 150}v-40h28v40`} stroke="#4E555B" strokeWidth={5} fill="none"/>
  <rect x={x - 36} y={y - 120} width={72} height={112} rx={12} fill="#2F6E73" stroke="#1F4C50" strokeWidth={2}/>
  {[-18, 0, 18].map(dx => <path key={dx} d={`M${x + dx} ${y - 114}v100`} stroke="#25585C" strokeWidth={3}/>)}
  <path d={`M${x - 30} ${y - 110}h22`} stroke="#6FA6AA" strokeWidth={3} opacity={.7}/>
  <circle cx={x - 24} cy={y - 4} r={6} fill="#1C1F22"/><circle cx={x + 24} cy={y - 4} r={6} fill="#1C1F22"/>
  <path d={`M${x + 30} ${y - 104}l14 26`} stroke="#B49A6A" strokeWidth={2}/><rect x={x + 38} y={y - 80} width={14} height={20} rx={2} fill="#E3D3A6"/>
 </g>;
};
/** The pickup curb in elevation: canopy and columns, sidewalk, props, curb face, road and bay box. */
export const Curb: React.FC<{phone?: React.ReactNode}> = ({phone}) => {
 const id = useUid('sac'), {farY, curbY, roadY, bay, canopy} = CURB;
 const r = rng(5);
 return <g data-part="pickup-curb">
  <defs>
   <linearGradient id={`${id}s`} x1="0" y1={farY} x2="0" y2={curbY} gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#BDB4A3"/><stop offset="1" stopColor={SA.concreteLit}/></linearGradient>
   <linearGradient id={`${id}r`} x1="0" y1={roadY} x2="0" y2="1920" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#56595E"/><stop offset="1" stopColor={SA.asphaltDeep}/></linearGradient>
   <linearGradient id={`${id}c`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#D7D1C5"/><stop offset="1" stopColor="#A9A193"/></linearGradient>
  </defs>
  {/* the canopy: a concrete fascia on two columns, its soffit in shade */}
  <path d={`M${canopy.x0} ${canopy.y}H${canopy.x1}l8 52H${canopy.x0}Z`} fill={`url(#${id}c)`}/>
  <path d={`M${canopy.x0} ${canopy.y + 52}H${canopy.x1 + 8}l-30 22H${canopy.x0}Z`} fill="#8C8578"/>
  <path d={`M${canopy.x0} ${canopy.y + 4}H${canopy.x1 + 2}`} stroke="#F1ECE2" strokeWidth={3}/>
  {[200, 420, 620].map(x => <path key={x} d={`M${x} ${canopy.y + 52}v6`} stroke="#6F695E" strokeWidth={2}/>)}
  {CURB.columns.map(x => <g key={x}><rect x={x - 17} y={canopy.y + 74} width={34} height={farY + 40 - canopy.y - 74} fill="#C9C1B2"/>
   <rect x={x + 7} y={canopy.y + 74} width={10} height={farY + 40 - canopy.y - 74} fill="#9F978A"/></g>)}
  <path d={`M${CURB.columns[0] + 17} ${canopy.y + 200}c2 10 0 20 3 34`} stroke="#9C5A2C" strokeWidth={2} opacity={.6} fill="none"/>
  {/* sidewalk */}
  <path d={`M-80 ${farY}H1160V${curbY}H-80Z`} fill={`url(#${id}s)`}/>
  <path d={`M-80 ${farY}H1160V${farY + 34}H-80Z`} fill="#000000" opacity={.08}/>
  {Array.from({length: 9}, (_, i) => {const x = -60 + i * 150; return <path key={i} d={`M${x} ${farY}L${x + (x - 540) * .14} ${curbY}`} stroke="#A89F8E" strokeWidth={1.6}/>;})}
  {Array.from({length: 12}, () => [r() * 1100, lerp(farY + 10, curbY - 8, r()), lerp(6, 18, r())]).map(([x, y, s], i) =>
   <ellipse key={i} cx={x} cy={y} rx={s} ry={s * .35} fill="#8F8676" opacity={.25}/>)}
  {/* planter with a lopsided mesquite */}
  <g transform={`translate(${CURB.planter[0]} ${CURB.planter[1]})`}>
   <rect x={0} y={-60} width={130} height={60} fill="#B8AE9C"/><rect x={0} y={-60} width={130} height={8} fill="#D4CCBC"/>
   <path d="M0 -60h130" stroke="#8A8171" strokeWidth={2}/><g transform="translate(58 -58)"><Mesquite h={250} seed={4}/></g>
  </g>
  <BaySign/><Bench/><Suitcase/>
  {phone}
  {CURB.bollards.map((x, i) => <g key={x} data-part="bollard">
   <rect x={x - 14} y={curbY - 92} width={28} height={92} rx={12} fill="#9C9C93"/>
   <rect x={x - 14} y={curbY - 76} width={28} height={10} fill={i ? '#D9B53D' : '#C9A639'} opacity={.85}/>
   <rect x={x + 4} y={curbY - 92} width={8} height={92} rx={4} fill="#7E7D75"/>
   {i === 0 && <path d={`M${x - 14} ${curbY - 60}l8 4l-8 6Z`} fill="#6F6E66"/>}
  </g>)}
  {/* curb face and road */}
  <path d={`M-80 ${curbY}H1160V${roadY}H-80Z`} fill={SA.concreteLit}/>
  <path d={`M-80 ${curbY}H1160`} stroke="#F2EDE3" strokeWidth={3}/>
  <path d={`M-80 ${roadY}H1160V1940H-80Z`} fill={`url(#${id}r)`}/>
  <path d={`M-80 ${roadY}H1160`} stroke="#2A2C30" strokeWidth={4} opacity={.5}/>
  {Array.from({length: 6}, (_, i) => <path key={i} d={`M${-40 + i * 210} 1396h120`} stroke={SA.paint} strokeWidth={9} opacity={.75}/>)}
  <path d={`M${bay[0]} ${roadY + 6}L${bay[1]} ${roadY + 6}L${bay[1] + 24} ${roadY + 66}L${bay[0] - 24} ${roadY + 66}Z`} fill="none" stroke={SA.paint} strokeWidth={6} opacity={.8}/>
  <path d={`M${bay[0] + 120} ${roadY + 50}l40 -26l40 26`} stroke={SA.paint} strokeWidth={6} fill="none" opacity={.6}/>
  <ellipse cx={720} cy={roadY + 40} rx={90} ry={10} fill="#2C2E31" opacity={.35}/>
  <path d="M120 1250l180 -6l40 14M600 1290l200 8" stroke="#3A3D41" strokeWidth={3} fill="none" opacity={.6}/>
 </g>;
};
/** The curb straight down from above: road, curb line, bay box, sidewalk, bench, case, sign, planters. */
export const CURB_PLAN = {curbX: 640, bay: [560, 1060] as P, roadX: [60, 640] as P, walkX: [640, 1010] as P};
export const CurbPlan: React.FC<{phone?: React.ReactNode}> = ({phone}) => {
 const {curbX, bay, roadX, walkX} = CURB_PLAN, r = rng(9);
 return <g data-part="curb-plan">
  <rect x={roadX[0]} y={-40} width={roadX[1] - roadX[0]} height={2000} fill={SA.asphalt}/>
  {Array.from({length: 30}, () => [lerp(roadX[0], roadX[1], r()), r() * 1900, lerp(20, 60, r())]).map(([x, y, s], i) =>
   <ellipse key={i} cx={x} cy={y} rx={s} ry={s * .4} fill="#3E4146" opacity={.5}/>)}
  {Array.from({length: 7}, (_, i) => <rect key={i} x={318} y={i * 300 - 60} width={10} height={150} fill={SA.paint} opacity={.7}/>)}
  <rect x={curbX - 170} y={bay[0]} width={160} height={bay[1] - bay[0]} fill="none" stroke={SA.paint} strokeWidth={6} opacity={.8}/>
  <rect x={walkX[0]} y={-40} width={walkX[1] - walkX[0]} height={2000} fill={SA.concrete}/>
  {Array.from({length: 14}, (_, i) => <path key={i} d={`M${walkX[0]} ${i * 150}H${walkX[1]}`} stroke="#ABA290" strokeWidth={2}/>)}
  <rect x={curbX} y={-40} width={14} height={2000} fill={SA.concreteLit}/>
  <rect x={walkX[0] + 60} y={-40} width={300} height={2000} fill="#2A2620" opacity={.14}/>
  {[[700, 420], [700, 1300]].map(([x, y], i) => <rect key={i} x={x - 17} y={y - 17} width={34} height={34} fill="#BDB5A6" stroke="#8D8577" strokeWidth={2}/>)}
  {[[660, 300], [660, 1240]].map(([x, y], i) => <g key={i}><circle cx={x + 6} cy={y + 6} r={15} fill="#000000" opacity={.2}/><circle cx={x} cy={y} r={14} fill="#9C9C93"/></g>)}
  <g data-part="bench-plan"><rect x={760} y={640} width={70} height={210} rx={6} fill={SA.steel} stroke="#6F777D" strokeWidth={2}/>
   {[0, 1, 2, 3].map(k => <path key={k} d={`M${772 + k * 15} 650v190`} stroke="#7E868B" strokeWidth={3}/>)}</g>
  <rect x={862} y={870} width={70} height={46} rx={8} fill="#2F6E73" stroke="#1F4C50" strokeWidth={2}/>
  <g data-part="sign-plan"><circle cx={668} cy={500} r={9} fill="#6D7479"/><rect x={650} y={516} width={58} height={10} rx={3} fill={SA.signBlue} transform="rotate(4 668 520)"/></g>
  {[[930, 260], [930, 1460]].map(([x, y], i) => <g key={i}><rect x={x - 60} y={y - 60} width={120} height={120} fill="#B8AE9C"/>
   <g opacity={.95}>{Array.from({length: 9}, (_, k) => <ellipse key={k} cx={x - 40 + (k * 37) % 90} cy={y - 50 + (k * 53) % 100} rx={34} ry={22} fill={k % 2 ? SA.mesquite : '#76874E'}/>)}</g></g>)}
  {phone}
 </g>;
};

// ---------------------------------------------------------------- phone ------------------------------
/** A worn phone with a plain map screen: a route, a bay pin, a car pin, a status card that turns
 * from a ride request to arriving. `w` wide, `w*2.05` tall, top left at (0,0). No brand. */
export const Phone: React.FC<{w: number; pin: number; status: number; t: number}> = ({w, pin, status, t}) => {
 const id = useUid('sap'), h = w * 2.05, m = w * .045, sw = w - 2 * m, sh = h - 2 * m;
 const route: P[] = [[.18, .1], [.24, .32], [.5, .36], [.56, .58], [.78, .62]];
 const at = (q: number): P => {const n = route.length - 1, f = clamp(q) * n, i = Math.min(n - 1, Math.floor(f)), u = f - i;
  return [lerp(route[i][0], route[i + 1][0], u), lerp(route[i][1], route[i + 1][1], u)];};
 const c = at(pin), s = clamp(status), title = s < .5 ? 'Ride requested' : 'Arriving', sub = s < .5 ? 'Finding a car' : 'At the curb';
 const fs = w * .1, mapH = sh * .7;
 return <g data-part="phone">
  <defs><clipPath id={`${id}s`}><rect x={m} y={m} width={sw} height={sh} rx={w * .08}/></clipPath></defs>
  <rect x={0} y={0} width={w} height={h} rx={w * .12} fill="#22262B"/>
  <rect x={w * .02} y={w * .02} width={w * .96} height={h - w * .04} rx={w * .11} fill="none" stroke="#4A5057" strokeWidth={w * .012}/>
  <path d={`M${w * .06} ${h * .9}q${w * .05} ${h * .06} ${w * .16} ${h * .08}M${w * .92} ${h * .06}q${-w * .02} ${-h * .03} ${-w * .1} ${-h * .045}`} stroke="#8A9096" strokeWidth={w * .01} fill="none" opacity={.6}/>
  <g clipPath={`url(#${id}s)`}>
   <rect x={m} y={m} width={sw} height={sh} fill="#EDEFEA"/>
   <rect x={m} y={m + mapH * .55} width={sw * .5} height={mapH * .22} fill="#D6E3C8"/>
   {[.12, .34, .52, .74].map(f => <path key={'h' + f} d={`M${m} ${m + mapH * f}L${m + sw} ${m + mapH * f + 12}`} stroke="#FFFFFF" strokeWidth={w * .035}/>)}
   {[.22, .5, .8].map(f => <path key={'v' + f} d={`M${m + sw * f} ${m}L${m + sw * f - 10} ${m + mapH}`} stroke="#FFFFFF" strokeWidth={w * .035}/>)}
   <path d={'M' + route.map(([u, v]) => `${(m + u * sw).toFixed(1)} ${(m + v * mapH).toFixed(1)}`).join('L')} stroke="#2F7BBF" strokeWidth={w * .028} fill="none" strokeLinejoin="round"/>
   <g transform={`translate(${m + .78 * sw} ${m + .62 * mapH})`} data-part="bay-pin">
    <path d={`M0 0c${-w * .06} ${-w * .08} ${-w * .06} ${-w * .16} 0 ${-w * .16}c${w * .06} 0 ${w * .06} ${w * .08} 0 ${w * .16}Z`} fill={SA.ink} stroke="#FFFFFF" strokeWidth={w * .012}/>
    <circle cx={0} cy={-w * .1} r={w * .022} fill="#FFFFFF"/>
    {s > 0 && <circle cx={0} cy={0} r={w * (.04 + .08 * frac(t * 1.4))} fill="none" stroke={SA.ink} strokeWidth={w * .01} opacity={s * (1 - frac(t * 1.4))}/>}
   </g>
   <g transform={`translate(${m + c[0] * sw} ${m + c[1] * mapH})`} data-part="car-pin">
    <circle r={w * .055} fill="#FFFFFF" stroke={SA.ink} strokeWidth={w * .012}/>
    <path d={`M${-w * .03} ${w * .012}h${w * .06}l${-w * .008} ${-w * .022}h${-w * .044}Z`} fill={SA.ink}/>
    <circle cy={-w * .022} r={w * .009} fill={SA.ink}/>
   </g>
   <g data-part="status-card" transform={`translate(0 ${(sh * .04 * (1 - Math.abs(s * 2 - 1))).toFixed(2)})`}>
    <rect x={m + sw * .05} y={m + mapH + sh * .03} width={sw * .9} height={sh * .24} rx={w * .05} fill="#FFFFFF"/>
    <text x={m + sw * .12} y={m + mapH + sh * .03 + fs * 1.5} fontFamily={FONT.body} fontWeight={800} fontSize={fs} fill={SA.ink}>{title}</text>
    <text x={m + sw * .12} y={m + mapH + sh * .03 + fs * 2.7} fontFamily={FONT.body} fontWeight={600} fontSize={fs * .72} fill="#5A626B">{sub}</text>
    <rect x={m + sw * .12} y={m + mapH + sh * .2} width={sw * .76} height={w * .02} rx={w * .01} fill="#DCE1E5"/>
    <rect x={m + sw * .12} y={m + mapH + sh * .2} width={sw * .76 * lerp(.35, 1, s)} height={w * .02} rx={w * .01} fill={s < .5 ? '#2F7BBF' : SA.ink}/>
   </g>
   <path d={`M${m} ${m + w * .3}l${w * .1} ${-w * .06}l${w * .04} ${w * .05}l${w * .1} ${-w * .12}`} stroke="#FFFFFF" strokeWidth={w * .008} fill="none" opacity={.7}/>
   <rect x={m} y={m} width={sw} height={sh} fill="#FFFFFF" opacity={.06}/>
  </g>
 </g>;
};

// ---------------------------------------------------------------- map and calendar ------------------
/** The service-area outline in map units: an editorial shape, never the operator's own map. */
export const ZONE: P[] = [[.3, .26], [.46, .2], [.62, .24], [.7, .36], [.68, .52], [.6, .64], [.48, .7], [.36, .66], [.27, .54], [.25, .4]];
const MAP_PINS: P[][] = [[[.38, .36], [.5, .34], [.56, .46], [.44, .5]], [[.58, .58], [.48, .6], [.42, .52], [.54, .5]], [[.34, .5], [.36, .6], [.44, .62], [.4, .46]]];
export const pinAt = (k: number, t: number): P => {const path = MAP_PINS[k], f = frac(t * .06 + k * .31) * path.length, i = Math.floor(f), u = ease(f - i), b = path[(i + 1) % path.length];
 return [lerp(path[i][0], b[0], u), lerp(path[i][1], b[1], u)];};
/** A flat paper street map of San Antonio, `w` by `h`: the river line, a street grid, a loop road and
 * radial highways, Salado Creek in the northeast, the outlined limited area, car pins inside it. */
export const StreetMap: React.FC<{w: number; h: number; draw: number; zone: number; fill: number; t: number; pins?: number; layer?: 'base' | 'zone' | 'pins'}> = ({w, h, draw, zone, fill, t, pins = 1, layer = 'base'}) => {
 const id = useUid('sam'), X = (u: number) => u * w, Y = (v: number) => v * h;
 const d = (ps: P[], close = false) => 'M' + ps.map(([u, v]) => `${X(u).toFixed(1)} ${Y(v).toFixed(1)}`).join('L') + (close ? 'Z' : '');
 const river: P[] = [[.44, 0], [.47, .12], [.45, .24], [.5, .34], [.48, .42], [.52, .5], [.5, .6], [.56, .72], [.54, .86], [.6, 1]];
 const salado: P[] = [[.86, .04], [.8, .18], [.74, .3], [.76, .44], [.7, .58], [.66, .76], [.58, .96]];
 const loop: P[] = Array.from({length: 25}, (_, i) => {const a = i / 24 * Math.PI * 2; return [.5 + .34 * Math.cos(a) * (1 + .06 * Math.sin(a * 3)), .48 + .3 * Math.sin(a) * (1 + .05 * Math.cos(a * 2))];});
 const dash = (p: number) => ({pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: (1 - clamp(p)).toFixed(4)});
 const base = <g data-part="street-map">
  <defs><clipPath id={`${id}c`}><rect x={0} y={0} width={w} height={h}/></clipPath></defs>
  <rect x={6} y={8} width={w} height={h} fill="#1A1814" opacity={.2}/>
  <path d={`M0 0H${w}V${h - 30}L${w - 34} ${h}H0Z`} fill="#EEE7D6"/>
  <path d={`M${w} ${h - 30}L${w - 34} ${h}L${w - 30} ${h - 26}Z`} fill="#D3C9B2"/>
  <g clipPath={`url(#${id}c)`}>
   <ellipse cx={X(.3)} cy={Y(.28)} rx={X(.06)} ry={Y(.04)} fill="#D6E2C3"/><ellipse cx={X(.62)} cy={Y(.74)} rx={X(.07)} ry={Y(.035)} fill="#D6E2C3"/>
   <g stroke="#CDBFA4" strokeWidth={2} {...dash(draw)}>
    {Array.from({length: 13}, (_, i) => <path key={'a' + i} d={d([[0, .04 + i * .08], [1, .06 + i * .08]])} fill="none"/>)}
    {Array.from({length: 11}, (_, i) => <path key={'b' + i} d={d([[.04 + i * .095, 0], [.02 + i * .095, 1]])} fill="none"/>)}
   </g>
   <g transform={`rotate(-14 ${X(.5)} ${Y(.46)})`} stroke="#BFAF92" strokeWidth={2.4} {...dash(draw)}>
    {Array.from({length: 6}, (_, i) => <path key={'c' + i} d={d([[.4, .38 + i * .025], [.6, .38 + i * .025]])} fill="none"/>)}
    {Array.from({length: 6}, (_, i) => <path key={'e' + i} d={d([[.42 + i * .03, .37], [.42 + i * .03, .52]])} fill="none"/>)}
   </g>
   <path d={d(loop)} stroke="#E0B067" strokeWidth={9} fill="none" strokeLinejoin="round" {...dash(draw)}/>
   {[[[.5, .46], [.95, .02]], [[.5, .46], [.06, .94]], [[.5, .46], [.02, .2]], [[.5, .46], [.98, .78]], [[.5, .46], [.52, 0]]].map((ps, i) =>
    <path key={'r' + i} d={d(ps as P[])} stroke="#E0B067" strokeWidth={7} fill="none" {...dash(draw)}/>)}
   <path d={d(river)} stroke="#6FA3C4" strokeWidth={8} fill="none" strokeLinejoin="round" strokeLinecap="round" {...dash(draw)}/>
   <path d={d(salado)} stroke="#88B4CF" strokeWidth={4} fill="none" strokeLinejoin="round" {...dash(draw)}/>
  </g>
 </g>;
 if (layer === 'zone') return <g data-part="zone-layer">
  <path d={d(ZONE, true)} fill="#8C8F94" opacity={.24 * clamp(fill)}/>
  {zone > 0 && <path d={d(ZONE, true)} stroke={SA.ink} strokeWidth={6} fill="none" strokeLinejoin="round" strokeDasharray={`${clamp(zone).toFixed(4)} 1`} pathLength={1} data-part="zone-outline"/>}
 </g>;
 if (layer === 'pins') return <g data-part="pins-layer">{pins > 0 && [0, 1, 2].map(k => {const [u, v] = pinAt(k, t); return <g key={k} transform={`translate(${X(u).toFixed(1)} ${Y(v).toFixed(1)})`} opacity={pins} data-part="map-pin">
  <circle r={13} fill="#FFFFFF" stroke={SA.ink} strokeWidth={3}/><path d="M-7 3h14l-2 -6h-10Z" fill={SA.ink}/></g>;})}</g>;
 return <g data-part="street-map-base">
  {base}
  <path d={`M${w * .5} 0V${h}M0 ${h * .5}H${w}`} stroke="#D7CCB4" strokeWidth={2} opacity={.8}/>
  <path d={`M0 0H${w}V${h - 30}L${w - 34} ${h}H0Z`} fill="none" stroke="#C2B699" strokeWidth={2}/>
 </g>;
};
/** A paper tag pinned at its top: lines of words, paper or accent, swinging about its pin. */
/** A tag's drawn width and height (below its pin), shared with the episode's frame-edge check. */
export function tagSize(lines: string[], size = 40, sub = 1, icon?: 'rain') {
 const pad = size * .55, iconW = icon ? size * 2.1 : 0, sizes = lines.map((_, i) => i < sub ? size : size * .68);
 return {w: Math.max(...lines.map((l, i) => widthOf(l, sizes[i], true))) + 2 * pad + iconW, h: sizes.reduce((a, b) => a + b * 1.22, 0) + pad * 1.6 + 8, pad, iconW, sizes};
}
export const Tag: React.FC<{lines: string[]; size?: number; tone?: 'paper' | 'accent' | 'ink'; swing?: number; icon?: 'rain'; sub?: number}> =
 ({lines, size = 40, tone = 'paper', swing = 0, icon, sub = 1}) => {
 const {w, pad, iconW, sizes} = tagSize(lines, size, sub, icon), h = sizes.reduce((a, b) => a + b * 1.22, 0) + pad * 1.6;
 const fill = tone === 'accent' ? SA.amber : tone === 'ink' ? SA.ink : SA.paper, ink = tone === 'ink' ? SA.paper : SA.ink;
 let y = pad * .8;
 return <g transform={`rotate(${swing.toFixed(2)})`} data-part="tag">
  <rect x={-w / 2 + 6} y={14} width={w} height={h} rx={10} fill="#1A1814" opacity={.22}/>
  <rect x={-w / 2} y={8} width={w} height={h} rx={10} fill={fill} stroke={tone === 'paper' ? SA.paperEdge : '#3B3F46'} strokeOpacity={tone === 'paper' ? 1 : .3} strokeWidth={2}/>
  {icon === 'rain' && <g transform={`translate(${-w / 2 + pad + iconW * .42} ${8 + h / 2})`} data-part="cloud-rain-icon">
   <path d={`M${-size * .8} ${size * .1}a${size * .36} ${size * .36} 0 0 1 ${size * .2} ${-size * .62}a${size * .48} ${size * .48} 0 0 1 ${size * .9} ${size * .02}a${size * .32} ${size * .32} 0 0 1 ${size * .3} ${size * .6}Z`} fill={SA.ink}/>
   {[-.45, -.05, .35].map(dx => <path key={dx} d={`M${size * dx} ${size * .3}l${-size * .12} ${size * .36}`} stroke={SA.ink} strokeWidth={size * .1} strokeLinecap="round"/>)}
  </g>}
  {lines.map((l, i) => {y += sizes[i] * 1.12; return <text key={i} x={-w / 2 + pad + iconW} y={8 + y} fontFamily={FONT.body} fontWeight={i < sub ? 800 : 600} fontSize={sizes[i]} fill={ink}>{l}</text>;})}
  <circle cx={0} cy={8} r={9} fill="#C84B3A" stroke="#7E2A1F" strokeWidth={2}/>
 </g>;
};
/** A tear-off calendar page: a cover with the month, and under it the day. `flip` turns the cover
 * up over the top edge, 0 to 1. Top centre at (0,0). */
export const Calendar: React.FC<{month: string; day?: string; flip?: number; w?: number}> = ({month, day, flip = 0, w = 220}) => {
 const h = w * 1.12, f = clamp(flip), c = Math.cos(Math.PI * f);
 const page = (front: boolean) => <g>
  <rect x={-w / 2} y={0} width={w} height={h} rx={8} fill={front ? SA.paper : '#E7E0CF'} stroke={SA.paperEdge} strokeWidth={2}/>
  <rect x={-w / 2} y={0} width={w} height={h * .26} rx={8} fill={front ? SA.ink : '#B9A88A'}/>
  {front && <text x={0} y={h * .19} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={w * .17} fill="#F7F1E3">{month}</text>}
 </g>;
 return <g data-part="calendar">
  <rect x={-w / 2 + 6} y={8} width={w} height={h} rx={8} fill="#1A1814" opacity={.2}/>
  <g>
   <rect x={-w / 2} y={0} width={w} height={h} rx={8} fill={SA.paper} stroke={SA.paperEdge} strokeWidth={2}/>
   <rect x={-w / 2} y={0} width={w} height={h * .26} rx={8} fill={SA.ink}/>
   <text x={0} y={h * .19} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={w * .17} fill="#F7F1E3">{month}</text>
   {day && <text x={0} y={h * .82} textAnchor="middle" fontFamily={FONT.display} fontWeight={800} fontSize={w * .5} fill={SA.ink}>{day}</text>}
  </g>
  {day && f < 1 && <g transform={`scale(1 ${c.toFixed(4)})`}>{page(c > 0)}
   {c > 0 && <g><rect x={-w * .34} y={h * .42} width={w * .68} height={h * .38} rx={6} fill="#E9E2D1"/>
    {[0, 1, 2].map(k => <path key={k} d={`M${-w * .28} ${h * (.52 + k * .1)}h${w * .56}`} stroke="#CFC5B0" strokeWidth={3}/>)}</g>}</g>}
  {[-w * .3, w * .3].map(x => <rect key={x} x={x - 5} y={-10} width={10} height={22} rx={4} fill="#6F777D"/>)}
 </g>;
};

// ---------------------------------------------------------------- creek -----------------------------
export const CREEK = {bankY: 1092, carY: 1236, nearBank: {x1: 330, y0: 1150}};
/** The far limestone bank of Salado Creek under live oaks, and the fast brown channel running toward
 * the viewer. No crossing, no gauge: nothing says how a car came to be in it. */
export const CreekBack: React.FC<{t: number; flow: number; width?: [number, number]}> = ({t, flow, width = [-80, 1160]}) => {
 const {bankY} = CREEK, [x0, x1] = width, r = rng(12);
 const ledges = [0, 1, 2, 3].map(k => bankY - 24 - k * 22);
 return <g data-part="creek-back">
  <g data-part="limestone-bank">
   {ledges.map((y, k) => <path key={k} d={`M${x0} ${y}C${x0 + 200} ${y - 6 - k * 2} ${x0 + 500} ${y + 4} ${x1} ${y - 3}L${x1} ${y + 26}L${x0} ${y + 26}Z`}
    fill={k % 2 ? SA.limestone : '#CEC4AE'} stroke={SA.limestoneShade} strokeWidth={2}/>)}
   {Array.from({length: 26}, () => [lerp(x0, x1, r()), lerp(bankY - 92, bankY - 4, r()), lerp(12, 40, r())]).map(([x, y, l], i) =>
    <path key={i} d={`M${x} ${y}l${l} ${(r() - .5) * 6}`} stroke={SA.limestoneDeep} strokeWidth={2} opacity={.55}/>)}
   <path d={`M${x0} ${bankY - 110}C${x0 + 260} ${bankY - 126} ${x1 - 400} ${bankY - 104} ${x1} ${bankY - 118}L${x1} ${bankY - 90}L${x0} ${bankY - 88}Z`} fill={SA.grass}/>
   <g transform={`translate(420 ${bankY - 100})`}><Oak h={250} seed={22} flip/></g>
   <g transform={`translate(930 ${bankY - 108})`}><Oak h={330} seed={23}/></g>
  </g>
  <Water x0={x0} x1={x1} y={bankY - 6} depth={1940 - bankY + 6} t={t} flow={flow} toward/>
  {Array.from({length: 18}, (_, i) => {const ph = frac(i * .37 + t * .9 * flow), x = lerp(x0, x1, (i * .61) % 1), y = bankY + 10 + ph * 700;
   return <path key={i} d={`M${x.toFixed(1)} ${y.toFixed(1)}q30 -8 60 0`} stroke={SA.foam} strokeWidth={3 + 3 * ph} fill="none" opacity={.5 * (1 - ph)}/>;})}
 </g>;
};
/** The near creek bank edge in the left foreground: stacked limestone ledges, brush and a live oak. */
export const CreekBank: React.FC<{t: number}> = ({t}) => {
 const {x1, y0} = CREEK.nearBank, r = rng(19);
 return <g data-part="near-bank-edge">
  {[0, 1, 2, 3, 4].map(k => {const y = y0 + k * 60, w = x1 - k * 34 + (k % 2) * 20;
   return <path key={k} d={`M-90 ${y}L${w} ${y + 8}C${w + 24} ${y + 20} ${w + 18} ${y + 52} ${w - 8} ${y + 62}L-90 ${y + 62}Z`} fill={k % 2 ? SA.limestone : '#CEC4AE'} stroke={SA.limestoneShade} strokeWidth={2.5}/>;})}
  {Array.from({length: 14}, () => [lerp(-60, x1 - 40, r()), lerp(y0 + 10, y0 + 290, r())]).map(([x, y], i) =>
   <path key={'c' + i} d={`M${x} ${y}l${20 + r() * 30} ${(r() - .5) * 5}`} stroke={SA.limestoneDeep} strokeWidth={2} opacity={.6}/>)}
  <path d={`M${x1 - 10} ${y0 + 10}C${x1 + 30} ${y0 + 80} ${x1 - 6} ${y0 + 200} ${x1 - 70} ${y0 + 300}`} stroke={SA.foam} strokeWidth={6} fill="none" opacity={.55 + .2 * Math.sin(t * 7)}/>
  <g transform={`translate(150 ${y0 + 6})`}><Oak h={380} seed={26}/></g>
  {[[10, y0 + 4], [70, y0 + 2], [250, y0 + 6], [300, y0 + 60]].map(([x, y], i) => <g key={'b' + i} transform={`translate(${x} ${y})`}>
   {[0, 1, 2, 3, 4].map(j => <ellipse key={j} cx={(j - 2) * 14 + (i % 2) * 6} cy={-14 - (j % 3) * 10} rx={20} ry={13} fill={j % 2 ? '#6F7F55' : '#5E6E46'}/>)}</g>)}
 </g>;
};
/** Water piling against a car's upstream side: plumes at both ends and spray over the roof. Origin at
 * the car's base centre in car units, `len` its half length, `p` how hard the current presses. */
export const Pile: React.FC<{p: number; t: number; len: number; h: number}> = ({p, t, len, h}) => {
 if (p <= 0) return null;
 const r = rng(91);
 return <g data-part="current-pressing" opacity={clamp(p * 1.5)}>
  {[-1, 1].map(sd => <path key={sd} d={`M${sd * (len - 10)} ${-h * .35}c${sd * 40} ${-30 * p} ${sd * 90} ${-24 * p} ${sd * 130} ${8}`} stroke={SA.foam} strokeWidth={10} fill="none" strokeLinecap="round" opacity={.8}/>)}
  {Array.from({length: 22}, (_, i) => {const ph = frac(r() + t * lerp(1.1, 1.9, r())), x = lerp(-len * .8, len * .8, r());
   return <circle key={i} cx={x.toFixed(1)} cy={(-h * .5 - 70 * p * Math.sin(Math.PI * ph)).toFixed(1)} r={3 + 3 * r()} fill={SA.foam} opacity={.8 * (1 - ph) * p}/>;})}
  <path d={`M${-len} ${-h * .42}Q0 ${-h * .42 - 26 * p} ${len} ${-h * .42}`} stroke="#D7CBB4" strokeWidth={6} fill="none" opacity={.6}/>
 </g>;
};

// ---------------------------------------------------------------- street ----------------------------
export const STREET = {farCurb: 1062, nearCurb: 1336, sign: [910, 1066] as P};
const House: React.FC<{x: number; w: number; kind: 'stucco' | 'stone'; seed: number}> = ({x, w, kind, seed}) => {
 const y = STREET.farCurb - 40, hh = 170, r = rng(seed);
 return <g data-part={'house-' + kind}>
  <path d={`M${x - 20} ${y - hh}L${x + w * .5} ${y - hh - 70}L${x + w + 20} ${y - hh}Z`} fill={SA.roof}/>
  <path d={`M${x - 20} ${y - hh}H${x + w + 20}`} stroke="#5B524B" strokeWidth={4}/>
  <rect x={x} y={y - hh} width={w} height={hh} fill={kind === 'stucco' ? SA.stucco : '#D4C7A8'}/>
  {kind === 'stone' && Array.from({length: 22}, (_, i) => <rect key={i} x={x + (i * 47) % (w - 30)} y={y - hh + 10 + Math.floor(i / 5) * 32} width={34 + r() * 14} height={22} fill="#C6B795" opacity={.7}/>)}
  <rect x={x + w * .12} y={y - hh + 50} width={w * .22} height={70} fill="#4C5560" stroke="#F1EDE4" strokeWidth={5}/>
  <rect x={x + w * .62} y={y - hh + 50} width={w * .2} height={70} fill="#4C5560" stroke="#F1EDE4" strokeWidth={5}/>
  <rect x={x + w * .42} y={y - hh + 60} width={w * .14} height={hh - 60} fill="#6E5A47"/>
  <path d={`M${x - 6} ${y - hh + 30}H${x + w + 6}`} stroke="#5B524B" strokeWidth={6}/>
  {[x + 4, x + w * .38, x + w * .6, x + w - 8].map(px => <rect key={px} x={px} y={y - hh + 30} width={6} height={hh - 30} fill="#E9E2D3"/>)}
  {kind === 'stucco' && <rect x={x + w * .66} y={y - hh + 92} width={40} height={24} fill="#A9ADAD" stroke="#6F7375" strokeWidth={2}/>}
  {kind === 'stucco' && <path d={`M${x + w * .7} ${y - hh + 116}c0 8 -2 14 0 22`} stroke="#9C5A2C" strokeWidth={2} opacity={.6} fill="none"/>}
  <rect x={x - 10} y={y} width={w + 20} height={40} fill={SA.grass}/>
 </g>;
};
/** A residential San Antonio street in elevation: houses, a live oak, a chain link fence, a blank
 * leaning street sign, the far curb and the asphalt. The water is the episode's to place. A closer
 * lens keeps the houses soft behind the car (`soft`, a blur in units). */
export const StreetBack: React.FC<{soft?: number}> = ({soft = 0}) => {
 const {farCurb, nearCurb, sign} = STREET, id = useUid('sas');
 return <g data-part="flooded-street">
  {soft > 0 && <defs><filter id={`${id}f`} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation={soft}/></filter></defs>}
  <g filter={soft > 0 ? `url(#${id}f)` : undefined} data-part="houses"><House x={30} w={420} kind="stucco" seed={41}/><House x={590} w={420} kind="stone" seed={42}/>
   <g transform={`translate(516 ${farCurb - 30})`}><Oak h={360} seed={44}/></g></g>
  <g data-part="chain-link"><path d={`M-60 ${farCurb - 92}H1160`} stroke="#8E959A" strokeWidth={4}/>
   {Array.from({length: 9}, (_, i) => <path key={i} d={`M${-40 + i * 150} ${farCurb - 94}v84`} stroke="#7C8388" strokeWidth={5}/>)}
   <path d={Array.from({length: 60}, (_, i) => `M${-60 + i * 21} ${farCurb - 90}l21 80`).join('')} stroke="#A3AAAE" strokeWidth={1.2} opacity={.7}/></g>
  <rect x={-80} y={farCurb - 12} width={1240} height={12} fill={SA.concrete}/>
  <rect x={-80} y={farCurb} width={1240} height={14} fill={SA.concreteLit}/>
  <path d={`M-80 ${farCurb + 14}H1160V${nearCurb}H-80Z`} fill={SA.asphalt}/>
  <rect x={-80} y={nearCurb} width={1240} height={18} fill={SA.concreteLit}/>
  <g transform={`rotate(-4 ${sign[0]} ${sign[1]})`} data-part="street-sign">
   <rect x={sign[0] - 5} y={sign[1] - 300} width={10} height={300} fill="#6D7479"/>
   <rect x={sign[0] - 70} y={sign[1] - 300} width={140} height={28} rx={4} fill="#2F6B45"/>
   <rect x={sign[0] - 14} y={sign[1] - 268} width={28} height={110} rx={4} fill="#2F6B45" transform={`rotate(90 ${sign[0]} ${sign[1] - 213})`}/>
   <path d={`M${sign[0] - 60} ${sign[1] - 286}h120`} stroke="#E9EEF2" strokeWidth={2} opacity={.5}/>
  </g>
 </g>;
};

// ---------------------------------------------------------------- higher speed road -----------------
export const LANE = {barrierY: 1004, farLane: 1066, dashY: 1168, laneY: 1252, shoulderY: 1304, dash: 600};
/** A higher speed roadway in elevation, drawn for the world span [xa, xb]: a median barrier, a far
 * lane, lane dashes every 600 units, our lane, the shoulder line and a grass verge with mesquite. */
export const LaneBack: React.FC<{xa: number; xb: number}> = ({xa, xb}) => {
 const {barrierY, farLane, dashY, shoulderY, dash} = LANE, k0 = Math.floor(xa / dash) - 1, k1 = Math.ceil(xb / dash) + 1;
 const ks = Array.from({length: k1 - k0 + 1}, (_, i) => k0 + i);
 return <g data-part="higher-speed-road">
  <path d={`M${xa} ${barrierY + 8}H${xb}V${farLane}H${xa}Z`} fill="#55585C"/>
  <path d={`M${xa} ${barrierY - 40}H${xb}V${barrierY}H${xa}Z`} fill="#C9C2B4"/>
  <path d={`M${xa} ${barrierY}H${xb}V${barrierY + 10}H${xa}Z`} fill="#A39B8C"/>
  {ks.map(k => <path key={'j' + k} d={`M${k * dash} ${barrierY - 40}v50`} stroke="#9E9686" strokeWidth={2}/>)}
  {ks.filter(k => k % 3 === 0).map(k => <g key={'p' + k}><rect x={k * dash + 200} y={barrierY - 330} width={9} height={290} fill="#7E858A"/>
   <path d={`M${k * dash + 204} ${barrierY - 330}q30 -14 70 -10`} stroke="#7E858A" strokeWidth={7} fill="none"/><rect x={k * dash + 266} y={barrierY - 346} width={30} height={12} rx={4} fill="#4F555A"/></g>)}
  <path d={`M${xa} ${farLane}H${xb}V${shoulderY}H${xa}Z`} fill={SA.asphalt}/>
  {ks.map(k => <path key={'d' + k} d={`M${k * dash} ${dashY}h260`} stroke={SA.paint} strokeWidth={8} opacity={.85}/>)}
  {ks.map(k => <path key={'s' + k} d={`M${k * dash + 90} ${dashY + 50}l120 4M${k * dash + 380} ${shoulderY - 20}l90 -3`} stroke="#3E4146" strokeWidth={3} opacity={.6}/>)}
  <path d={`M${xa} ${shoulderY - 8}H${xb}`} stroke={SA.paint} strokeWidth={8}/>
  <path d={`M${xa} ${shoulderY}H${xb}V${shoulderY + 70}H${xa}Z`} fill="#6A6B62"/>
  <path d={`M${xa} ${shoulderY + 70}H${xb}V1940H${xa}Z`} fill={SA.grass}/>
  {ks.filter(k => k % 4 === 1).map(k => <g key={'m' + k} transform={`translate(${k * dash + 150} ${shoulderY + 130})`}><Mesquite h={200} seed={k}/></g>)}
 </g>;
};
/** A sheet of standing water lying across the lane, seen from the shoulder: a sky-lit surface with a
 * soft ragged edge and the mirror image of whatever stands over it. */
export const StandingWater: React.FC<{x0: number; x1: number; y0: number; y1: number; t: number; reflect?: React.ReactNode}> = ({x0, x1, y0, y1, t, reflect}) => {
 const id = useUid('sas'), n = 18;
 const top = Array.from({length: n + 1}, (_, i) => {const x = lerp(x0, x1, i / n); return `${i ? 'L' : 'M'}${x.toFixed(1)} ${(y0 + 6 * Math.sin(i * 1.7) + 3 * Math.sin(i * 3.1)).toFixed(1)}`;}).join('');
 const bot = Array.from({length: n + 1}, (_, i) => {const x = lerp(x1, x0, i / n); return `L${x.toFixed(1)} ${(y1 + 5 * Math.sin(i * 2.3)).toFixed(1)}`;}).join('');
 const d = `${top}${bot}Z`;
 return <g data-part="standing-water">
  <defs><linearGradient id={`${id}g`} x1="0" y1={y0} x2="0" y2={y1} gradientUnits="userSpaceOnUse">
   <stop offset="0" stopColor="#B9C3C8"/><stop offset=".5" stopColor="#8E989E"/><stop offset="1" stopColor="#6F6A5E"/></linearGradient>
   <clipPath id={`${id}c`}><path d={d}/></clipPath></defs>
  <path d={d} fill={`url(#${id}g)`} opacity={.92}/>
  <g clipPath={`url(#${id}c)`}>{reflect && <g opacity={.35}>{reflect}</g>}
   {Array.from({length: 14}, (_, i) => <path key={i} d={`M${lerp(x0, x1, frac(i * .37 + t * .05))} ${lerp(y0 + 8, y1 - 6, (i * .53) % 1)}h${40 + (i % 5) * 18}`} stroke="#E4E9EC" strokeWidth={2} opacity={.5}/>)}</g>
  <path d={top} stroke="#DDE3E6" strokeWidth={2.5} fill="none" opacity={.8}/>
 </g>;
};

// ---------------------------------------------------------------- lot --------------------------------
export const LOT = {fenceY: 1086, carY: 1190, cordY: 520, poles: [60, 1020]};
/** A fleet lot in elevation: chain link fence with a mesquite behind it, two poles with a cord
 * between them for the tag, parking stall lines on worn asphalt. */
export const LotBack: React.FC = () => {
 const {fenceY, cordY, poles} = LOT;
 return <g data-part="fleet-lot">
  <g transform={`translate(860 ${fenceY - 6})`}><Mesquite h={260} seed={8}/></g>
  <path d={`M-60 ${fenceY - 150}H1160`} stroke="#8E959A" strokeWidth={4}/>
  <path d={Array.from({length: 60}, (_, i) => `M${-60 + i * 21} ${fenceY - 148}l21 140`).join('')} stroke="#A3AAAE" strokeWidth={1.2} opacity={.6}/>
  {Array.from({length: 8}, (_, i) => <path key={i} d={`M${-20 + i * 160} ${fenceY - 152}v150`} stroke="#7C8388" strokeWidth={5}/>)}
  {poles.map(x => <g key={x}><rect x={x - 6} y={cordY - 40} width={12} height={fenceY - cordY + 40} fill="#6D7479"/><rect x={x - 6} y={cordY - 40} width={4} height={fenceY - cordY + 40} fill="#9AA2A7"/></g>)}
  <path d={`M${poles[0]} ${cordY}Q540 ${cordY + 60} ${poles[1]} ${cordY}`} stroke="#3B3F46" strokeWidth={3} fill="none"/>
  <path d={`M-80 ${fenceY}H1160V1940H-80Z`} fill="#56595D"/>
  {Array.from({length: 8}, (_, i) => {const x = -20 + i * 190; return <path key={i} d={`M${x} ${fenceY + 30}L${x + (x - 540) * .4} 1300`} stroke={SA.paint} strokeWidth={6} opacity={.55}/>;})}
  <path d="M100 1250l160 -6M640 1270l140 4" stroke="#45484C" strokeWidth={3} opacity={.7}/>
 </g>;
};

// ---------------------------------------------------------------- documents -------------------------
/** The federal recall record card. Rows are the source's own words or plain labels. */
export const RECORD_ROWS: {label: string; value: string}[] = [
 {label: 'Recall type', value: 'Software'},
 {label: 'Potential units affected', value: '3,791'},
 {label: 'Summary', value: 'The software may allow the vehicle to slow and then drive into standing water on higher speed roadways.'},
 {label: 'Remedy', value: 'The remedy is currently under development.'},
 {label: 'Interim remedy', value: 'Weather-related constraints increased. Vehicle maps updated.'},
 {label: 'Interim update', value: 'All affected vehicles by April 20th, 2026'},
];
export const REMEDY_ROW = 3;
/** Row geometry for a card `w` wide: each row's top, its height and its value lines. */
export function recordLayout(w = 760) {
 const head = 112, labelW = w * .3, vx = labelW + 44, vw = w - vx - 34, size = 25, lead = 31;
 let y = head + 14;
 const rows = RECORD_ROWS.map(r => {const lines = wrap(r.value, size, vw, true); const h = Math.max(56, lines.length * lead + 26); const row = {...r, y, h, lines, vx}; y += h; return row;});
 return {w, h: y + 26, head, labelW, vx, vw, size, lead, rows};
}
export type Imprint = {text: string; p: number; x: number; y: number; rot: number; size?: number};
const ImprintMark: React.FC<Imprint & {id: string}> = ({text, p, x, y, rot, size = 34, id}) => {
 if (p <= 0) return null;
 const w = widthOf(text, size, true) + size * 1.2, h = size * 1.9, r = rng(text.length * 13);
 return <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={clamp(p)} data-part="stamp-imprint">
  <defs><mask id={`${id}m`} maskUnits="userSpaceOnUse" x={-w} y={-h} width={2 * w} height={2 * h}>
   <rect x={-w} y={-h} width={2 * w} height={2 * h} fill="#FFFFFF"/>
   {Array.from({length: 46}, (_, i) => <circle key={i} cx={(r() - .5) * w} cy={(r() - .5) * h} r={1 + r() * 3} fill="#000000"/>)}
  </mask></defs>
  <g mask={`url(#${id}m)`}>
   <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={8} fill="none" stroke={SA.amberInk} strokeWidth={5}/>
   <rect x={-w / 2 + 8} y={-h / 2 + 8} width={w - 16} height={h - 16} rx={4} fill="none" stroke={SA.amberInk} strokeWidth={2}/>
   <text x={0} y={size * .36} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={size} fill={SA.amberInk} letterSpacing={1}>{text}</text>
  </g>
 </g>;
};
export const RecordCard: React.FC<{w?: number; rows: number; remedyLit?: number; underline?: number; imprints?: Imprint[]}> =
 ({w = 760, rows, remedyLit = 0, underline = 0, imprints = []}) => {
 const id = useUid('sar'), L = recordLayout(w), n = RECORD_ROWS.length;
 return <g data-part="recall-record">
  <rect x={10} y={14} width={w} height={L.h} rx={10} fill="#1A1814" opacity={.22}/>
  <path d={`M0 10Q0 0 10 0H${w - 30}L${w} 30V${L.h - 10}Q${w} ${L.h} ${w - 10} ${L.h}H10Q0 ${L.h} 0 ${L.h - 10}Z`} fill={SA.paper} stroke={SA.paperEdge} strokeWidth={2}/>
  <path d={`M${w - 30} 0L${w} 30H${w - 30}Z`} fill="#DDD3BE"/>
  <rect x={26} y={24} width={14} height={64} fill={SA.ink}/>
  <text x={56} y={62} fontFamily={FONT.body} fontWeight={800} fontSize={36} fill={SA.ink}>Federal recall record</text>
  <text x={57} y={92} fontFamily={FONT.mono} fontWeight={500} fontSize={19} fill="#5A626B">Vehicle safety recall</text>
  <path d={`M26 ${L.head}H${w - 26}`} stroke={SA.ink} strokeWidth={2.5}/>
  {L.rows.map((row, i) => {
   const shown = clamp(rows * n - i), lit = i === REMEDY_ROW ? clamp(remedyLit) : 0;
   return <g key={i} data-part={i === REMEDY_ROW ? 'remedy-row' : 'record-row'}>
    {lit > 0 && <rect x={18} y={row.y + 4} width={w - 36} height={row.h - 8} rx={8} fill="#FFE2B6" opacity={.85 * lit}/>}
    {lit > 0 && <rect x={18} y={row.y + 4} width={7} height={row.h - 8} rx={3} fill={SA.ink} opacity={lit}/>}
    <defs><clipPath id={`${id}r${i}`}><rect x={0} y={row.y} width={w * ease(shown)} height={row.h}/></clipPath></defs>
    <g clipPath={`url(#${id}r${i})`}>
     <text x={34} y={row.y + 36} fontFamily={FONT.mono} fontWeight={600} fontSize={19} fill="#4F5862">{row.label}</text>
     {row.lines.map((l, k) => <text key={k} x={row.vx} y={row.y + 36 + k * L.lead} fontFamily={FONT.body} fontWeight={i === REMEDY_ROW ? 800 : 700} fontSize={L.size} fill={SA.ink}>{l}</text>)}
    </g>
    {shown < 1 && shown > 0 && <rect x={w * ease(shown) - 3} y={row.y + 12} width={4} height={row.h - 22} fill={SA.ink} opacity={.7}/>}
    <path d={`M26 ${row.y + row.h}H${w - 26}`} stroke="#D9CFBA" strokeWidth={1.5}/>
    {i === REMEDY_ROW && underline > 0 && <path d={`M${row.vx} ${row.y + row.h - 12}h${(w - row.vx - 40) * clamp(underline)}`} stroke={SA.ink} strokeWidth={6} strokeLinecap="round"/>}
   </g>;
  })}
  {imprints.map((im, i) => <ImprintMark key={i} {...im} id={`${id}i${i}`}/>)}
 </g>;
};
/** A wooden rubber stamp; the base's centre is at (0,0). */
export const Stamp: React.FC = () => <g data-part="rubber-stamp">
 <rect x={-92} y={-18} width={184} height={18} rx={4} fill="#3B2F26"/>
 <rect x={-86} y={-60} width={172} height={44} rx={8} fill={SA.wood} stroke={SA.woodDark} strokeWidth={2}/>
 <path d="M-80 -54h150" stroke="#C49B70" strokeWidth={4} opacity={.7}/>
 <path d="M-26 -60C-30 -100 -40 -120 -36 -140C-30 -170 30 -170 36 -140C40 -120 30 -100 26 -60Z" fill="#7E5B3C" stroke={SA.woodDark} strokeWidth={2}/>
 <ellipse cx={0} cy={-150} rx={42} ry={28} fill="#8E6845" stroke={SA.woodDark} strokeWidth={2}/>
 <ellipse cx={-12} cy={-160} rx={16} ry={8} fill="#B38962" opacity={.8}/>
</g>;
/** A ballpoint pen with its tip at (0,0), lying up and to the right. */
export const Pen: React.FC = () => <g data-part="pen" transform="rotate(-38)">
 <path d="M0 0L18 -6L18 6Z" fill="#B9BEC2"/><path d="M0 0L6 -2L6 2Z" fill="#2B2F33"/>
 <rect x={18} y={-9} width={60} height={18} rx={3} fill="#C9CED2"/>
 <rect x={76} y={-12} width={300} height={24} rx={10} fill="#2C3E57"/>
 <rect x={90} y={-12} width={260} height={7} rx={3} fill="#4A6283" opacity={.8}/>
 <rect x={300} y={-18} width={70} height={7} rx={3} fill="#B9BEC2"/>
</g>;
/** A desk top seen at an angle, its near edge at y0 + h. Not a full-frame background. */
export const Desk: React.FC<{x0: number; x1: number; y0: number; h: number; top?: boolean}> = ({x0, x1, y0, h, top}) => {
 const id = useUid('sad');
 return <g data-part="desk">
  <defs><linearGradient id={`${id}g`} x1="0" y1={y0} x2="0" y2={y0 + h} gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#8A6A49"/><stop offset="1" stopColor="#6E5238"/></linearGradient></defs>
  <rect x={x0} y={y0} width={x1 - x0} height={h} rx={top ? 24 : 0} fill={`url(#${id}g)`}/>
  {Array.from({length: 7}, (_, i) => <path key={i} d={top ? `M${x0 + 20} ${y0 + (i + 1) * h / 8}H${x1 - 20}` : `M${x0} ${y0 + (i + 1) * h / 8}C${x0 + 300} ${y0 + (i + 1) * h / 8 - 6} ${x1 - 300} ${y0 + (i + 1) * h / 8 + 6} ${x1} ${y0 + (i + 1) * h / 8}`}
   stroke="#5E452E" strokeWidth={2} opacity={.5} fill="none"/>)}
  <ellipse cx={x1 - 220} cy={y0 + h * .3} rx={60} ry={top ? 60 : 22} fill="none" stroke="#4E3A28" strokeWidth={4} opacity={.35}/>
  {!top && <path d={`M${x0} ${y0}H${x1}`} stroke="#B38D66" strokeWidth={4}/>}
 </g>;
};
/** A small white car icon, 64 wide, its base centre at (0,0). `fill` grows it in. */
export const CarIcon: React.FC<{fill?: number}> = ({fill = 1}) => {
 const f = clamp(fill);
 if (f <= 0) return <rect x={-30} y={-28} width={60} height={28} rx={8} fill="none" stroke="#B8AE98" strokeWidth={2} strokeDasharray="5 5"/>;
 return <g transform={`scale(${(.6 + .4 * ease(f)).toFixed(3)})`} opacity={clamp(f * 2)} data-part="car-icon">
  <path d="M-31 -4C-32 -12 -30 -18 -24 -20L-14 -30C-10 -33 8 -33 12 -30L22 -20C30 -18 32 -12 31 -4Z" fill="#F7F9FA" stroke="#5E6872" strokeWidth={2}/>
  <path d="M-12 -28L-18 -20H18L10 -28Z" fill="#2B333C"/>
  <rect x={-6} y={-38} width={12} height={7} rx={3} fill="#F7F9FA" stroke="#5E6872" strokeWidth={1.5}/>
  <circle cx={-18} cy={-3} r={6} fill="#1C1F22"/><circle cx={18} cy={-3} r={6} fill="#1C1F22"/>
 </g>;
};
/** A grid of car icons that fills row by row, `fill` 0 to 1. Top left at (0,0). */
export const IconGrid: React.FC<{cols: number; rows: number; fill: number; dx?: number; dy?: number}> = ({cols, rows, fill, dx = 78, dy = 52}) => {
 const n = cols * rows, f = clamp(fill) * n;
 return <g data-part="car-icon-grid">{Array.from({length: n}, (_, i) => <g key={i} transform={`translate(${(i % cols) * dx + 36} ${Math.floor(i / cols) * dy + 44})`}>
  <CarIcon fill={clamp(f - i)}/></g>)}</g>;
};
/** The recall sentence, the source's words, with may lit. Top left at (0,0). */
export const QUOTE_TEXT = 'The software may allow the vehicle to slow and then drive into standing water on higher speed roadways.';
export const QuoteCard: React.FC<{w: number; lit: number; size?: number}> = ({w, lit, size = 36}) => {
 const pad = 34, lines = wrap(QUOTE_TEXT, size, w - 2 * pad, true), lead = size * 1.3, h = lines.length * lead + pad * 2 + 46;
 const sp = widthOf(' ', size, true);
 return <g data-part="recall-sentence">
  <rect x={8} y={10} width={w} height={h} rx={12} fill="#1A1814" opacity={.22}/>
  <rect x={0} y={0} width={w} height={h} rx={12} fill={SA.paper} stroke={SA.paperEdge} strokeWidth={2}/>
  <text x={pad} y={pad + 18} fontFamily={FONT.mono} fontWeight={600} fontSize={20} fill="#5A626B">Federal recall record</text>
  {lines.map((line, k) => {let x = pad; const y = pad + 46 + (k + 1) * lead - size * .3;
   return <g key={k}>{line.split(' ').map((word, j) => {const ww = widthOf(word, size, true), x0 = x; x += ww + sp;
    const may = word === 'may';
    return <g key={j}>{may && lit > 0 && <rect x={x0 - 8} y={y - size * .95} width={ww + 16} height={size * 1.25} rx={6} fill={SA.amber} opacity={lit} data-part="may-highlight"/>}
     <text x={x0} y={y} fontFamily={FONT.body} fontWeight={may ? 800 : 700} fontSize={size} fill={SA.ink}>{word}</text>
     {may && lit > 0 && <path d={`M${x0} ${y + 8}h${ww * clamp(lit * 1.4)}`} stroke={SA.amberInk} strokeWidth={5} strokeLinecap="round"/>}</g>;})}</g>;})}
 </g>;
};
/** A check badge popping onto a car, 0 to 1. Centre at (0,0). */
export const Check: React.FC<{p: number; r?: number}> = ({p, r = 26}) => {
 if (p <= 0) return null;
 const s = .5 + .5 * ease(clamp(p * 1.6)), d = clamp((p - .3) / .5);
 return <g transform={`scale(${s.toFixed(3)})`} data-part="check">
  <circle r={r} fill={SA.paper} stroke={SA.ink} strokeWidth={3}/>
  <path d={`M${-r * .45} 0L${-r * .1} ${r * .35}L${r * .5} ${-r * .38}`} stroke={SA.ink} strokeWidth={r * .2} fill="none" strokeLinecap="round" strokeLinejoin="round"
   pathLength={1} strokeDasharray="1 1" strokeDashoffset={(1 - d).toFixed(3)}/>
 </g>;
};
/** The small vehicle map card that is marked updated. Top left at (0,0). */
export const MapCard: React.FC<{updated: number; w?: number}> = ({updated, w = 300}) => {
 const h = w * .7;
 return <g data-part="vehicle-map-card">
  <rect x={6} y={8} width={w} height={h} rx={10} fill="#1A1814" opacity={.2}/>
  <rect x={0} y={0} width={w} height={h} rx={10} fill={SA.paper} stroke={SA.paperEdge} strokeWidth={2}/>
  <rect x={16} y={16} width={w - 32} height={h * .5} rx={6} fill="#E3E8E0"/>
  {[.2, .45, .7].map(f => <path key={f} d={`M16 ${16 + h * .5 * f}H${w - 16}`} stroke="#FFFFFF" strokeWidth={6}/>)}
  {[.3, .65].map(f => <path key={f} d={`M${16 + (w - 32) * f} 16v${h * .5}`} stroke="#FFFFFF" strokeWidth={6}/>)}
  <path d={`M30 ${16 + h * .38}C${w * .3} ${h * .2} ${w * .55} ${h * .5} ${w - 40} ${h * .2}`} stroke="#6FA3C4" strokeWidth={5} fill="none"/>
  <text x={18} y={h * .5 + 54} fontFamily={FONT.body} fontWeight={800} fontSize={w * .085} fill={SA.ink}>Vehicle maps</text>
  <text x={18} y={h * .5 + 54 + w * .1} fontFamily={FONT.body} fontWeight={600} fontSize={w * .075} fill={SA.ink} opacity={clamp(updated * 2)}>updated</text>
  <g transform={`translate(${w - 42} ${h * .5 + 46})`}><Check p={updated} r={22}/></g>
 </g>;
};

/** The record's remedy row on its own card, large enough to read on a phone: the header, the label and
 * the source's sentence, lit, with the under development mark and an underline. Top left at (0,0). */
export function remedyLayout(w = 760, size = 46) {
 const lines = wrap(RECORD_ROWS[REMEDY_ROW].value, size, w - 80, true), lead = size * 1.22, top = 196;
 return {w, size, lead, lines, top, h: top + lines.length * lead + 40};
}
export const RemedyCard: React.FC<{w?: number; lit?: number; underline?: number; imprint?: number}> = ({w = 760, lit = 0, underline = 0, imprint = 0}) => {
 const id = useUid('srm'), R = remedyLayout(w), last = R.top + (R.lines.length - 1) * R.lead;
 return <g data-part="remedy-card">
  <rect x={10} y={14} width={w} height={R.h} rx={10} fill="#1A1814" opacity={.24}/>
  <path d={`M0 10Q0 0 10 0H${w - 30}L${w} 30V${R.h - 10}Q${w} ${R.h} ${w - 10} ${R.h}H10Q0 ${R.h} 0 ${R.h - 10}Z`} fill={SA.paper} stroke={SA.paperEdge} strokeWidth={2}/>
  <rect x={26} y={24} width={14} height={64} fill={SA.ink}/>
  <text x={56} y={62} fontFamily={FONT.body} fontWeight={800} fontSize={36} fill={SA.ink}>Federal recall record</text>
  <text x={57} y={92} fontFamily={FONT.mono} fontWeight={500} fontSize={19} fill="#5A626B">Vehicle safety recall</text>
  <path d={`M26 112H${w - 26}`} stroke={SA.ink} strokeWidth={2.5}/>
  {lit > 0 && <rect x={18} y={124} width={w - 36} height={R.h - 140} rx={8} fill="#FFE2B6" opacity={.85 * clamp(lit)}/>}
  {lit > 0 && <rect x={18} y={124} width={7} height={R.h - 140} rx={3} fill={SA.ink} opacity={clamp(lit)} data-part="remedy-row"/>}
  <text x={40} y={160} fontFamily={FONT.mono} fontWeight={700} fontSize={26} fill="#4F5862" data-part="remedy-row">Remedy</text>
  {R.lines.map((l, k) => <text key={k} x={40} y={R.top + k * R.lead} fontFamily={FONT.body} fontWeight={800} fontSize={R.size} fill={SA.ink}>{l}</text>)}
  {underline > 0 && <path d={`M40 ${last + 14}h${(w - 120) * clamp(underline)}`} stroke={SA.ink} strokeWidth={7} strokeLinecap="round"/>}
  <ImprintMark text="Under development" p={imprint} x={w - 230} y={R.h - 38} rot={-6} size={30} id={`${id}i`}/>
 </g>;
};
/** A plain working hand and sleeve holding a stamp knob or a pen at (0,0); the arm runs off toward
 * `dir` (a unit direction). Skin is a fill value; the line work is the same for any hand. */
export const Hand: React.FC<{dir: P; grip: 'knob' | 'pen'; skin?: string; scale?: number}> = ({dir, grip, skin = '#A8744F', scale = 1}) => {
 const a = Math.atan2(dir[1], dir[0]) * 180 / Math.PI, k = scale;
 return <g data-part="hand" transform={`rotate(${a.toFixed(2)}) scale(${k})`}>
  <path d="M60 -30L1100 -44L1100 44L60 30Z" fill="#3B4A5C"/>
  <path d="M60 -30L1100 -44" stroke="#5A6A7E" strokeWidth={4}/>
  <rect x={48} y={-34} width={26} height={68} rx={8} fill="#2E3A48"/>
  {grip === 'knob' ? <g>
   <path d="M50 -30C20 -44 -18 -40 -34 -20C-44 -6 -44 10 -34 22C-18 40 22 44 50 30Z" fill={skin} stroke="#6A4630" strokeWidth={2.5}/>
   {[-22, -8, 6, 20].map(y => <path key={y} d={`M-30 ${y}C-40 ${y + 2} -42 ${y + 8} -34 ${y + 10}`} stroke="#6A4630" strokeWidth={2.5} fill="none"/>)}
  </g> : <g>
   <path d="M50 -24C24 -34 0 -28 -12 -14L-20 2C-16 12 -4 16 8 12C24 26 44 24 50 20Z" fill={skin} stroke="#6A4630" strokeWidth={2.5}/>
   <path d="M-12 -14C-24 -10 -30 -2 -24 6" stroke="#6A4630" strokeWidth={2.5} fill="none"/>
  </g>}
 </g>;
};

// ---------------------------------------------------------------- plans from above ------------------
/** Salado Creek straight down: the fast brown channel running down the frame between limestone
 * ledges, brush and oak crowns on both banks, rain rings on the water. No crossing. */
export const CREEK_PLAN = {creek: [300, 820] as P, carY: 820};
export const CreekPlan: React.FC<{t: number; rain: number; flow: number}> = ({t, rain, flow}) => {
 const id = useUid('scp'), {creek} = CREEK_PLAN, r = rng(15);
 return <g data-part="creek-plan">
  <defs><clipPath id={`${id}c`}><rect x={creek[0]} y={-40} width={creek[1] - creek[0]} height={2000}/></clipPath></defs>
  <rect x={20} y={-40} width={1040} height={2000} fill={SA.grass} opacity={.9}/>
  <rect x={creek[0] - 120} y={-40} width={creek[1] - creek[0] + 240} height={2000} fill={SA.limestone}/>
  {Array.from({length: 40}, () => [lerp(creek[0] - 110, creek[1] + 110, r()), r() * 1900]).map(([x, y], i) => <path key={i} d={`M${x} ${y}h${30 + r() * 40}`} stroke={SA.limestoneShade} strokeWidth={3}/>)}
  <path d={`M${creek[0]} -40V1960H${creek[1]}V-40Z`} fill={SA.water}/>
  <g clipPath={`url(#${id}c)`}>{Array.from({length: 34}, (_, i) => {const x = lerp(creek[0], creek[1], (i * .37) % 1), y = frac(i * .29 + t * .25 * flow) * 2000 - 40;
   return <path key={i} d={`M${x} ${y}v${40 + (i % 4) * 20}`} stroke={SA.foam} strokeWidth={3} opacity={.4}/>;})}</g>
  {[[200, 420, 120], [880, 300, 150], [170, 1380, 140], [900, 1500, 120], [960, 760, 90], [150, 860, 110]].map(([x, y, rr], i) => <g key={i}>
   <ellipse cx={x + 22} cy={y + 18} rx={rr} ry={rr * .85} fill="#000000" opacity={.18}/>
   <ellipse cx={x} cy={y} rx={rr} ry={rr * .85} fill={SA.oakDark}/><ellipse cx={x - rr * .2} cy={y - rr * .18} rx={rr * .7} ry={rr * .55} fill={SA.oak}/>
   <ellipse cx={x - rr * .4} cy={y - rr * .35} rx={rr * .3} ry={rr * .2} fill={SA.oakLit}/></g>)}
  {rain > 0 && Array.from({length: 24}, (_, i) => {const ph = frac(i * .61 + t * 1.3), x = lerp(creek[0], creek[1], (i * .43) % 1), y = (i * 173) % 1800 + 60;
   return <circle key={i} cx={x} cy={y} r={6 + 26 * ph} fill="none" stroke="#E9E1CF" strokeWidth={2} opacity={rain * .6 * (1 - ph)}/>;})}
 </g>;
};
/** A residential street straight down: roofs, yards, oaks, the street and water spreading along it. */
export const STREET_PLAN = {y0: 800, y1: 1120};
export const StreetPlan: React.FC<{t: number; front: number; calm?: number}> = ({t, front, calm = 0}) => {
 const {y0, y1} = STREET_PLAN;
 return <g data-part="street-plan">
  <rect x={20} y={300} width={1040} height={y0 - 300} fill={SA.grass}/>
  <rect x={20} y={y1} width={1040} height={560} fill={SA.grass}/>
  {[[60, 360, 360, 300], [560, 340, 400, 320], [80, 1200, 380, 320], [600, 1210, 380, 320]].map(([x, y, w, h], i) => <g key={i} data-part="roof-plan">
   <rect x={x + 16} y={y + 16} width={w} height={h} fill="#000000" opacity={.2}/>
   <rect x={x} y={y} width={w} height={h} fill={i % 2 ? '#8A7E72' : SA.roof}/>
   <path d={`M${x} ${y}L${x + w / 2} ${y + h / 2}L${x + w} ${y}M${x} ${y + h}L${x + w / 2} ${y + h / 2}L${x + w} ${y + h}`} stroke="#5B524B" strokeWidth={3}/></g>)}
  <path d={`M20 ${y0 - 60}H1060`} stroke="#8E959A" strokeWidth={4} strokeDasharray="10 6"/>
  <rect x={20} y={y0 - 26} width={1040} height={26} fill={SA.concrete}/><rect x={20} y={y1} width={1040} height={26} fill={SA.concrete}/>
  <rect x={20} y={y0} width={1040} height={y1 - y0} fill={SA.asphalt}/>
  <g data-part="water-plan"><rect x={20} y={y0 - 20 - 30 * calm} width={Math.max(0, front - 20)} height={y1 - y0 + 40 + 60 * calm} fill={SA.water} opacity={.88}/>
   {Array.from({length: 18}, (_, i) => {const x = 20 + frac(i * .37 + t * .04) * Math.max(0, front - 40), y = y0 + ((i * 61) % (y1 - y0));
    return <path key={i} d={`M${x} ${y}h${50 + (i % 3) * 20}`} stroke={SA.foam} strokeWidth={3} opacity={.4 * (1 - .7 * calm)}/>;})}</g>
  {[[540, 620, 150], [980, 1480, 120]].map(([x, y, rr], i) => <g key={i}><ellipse cx={x + 24} cy={y + 20} rx={rr} ry={rr * .8} fill="#000000" opacity={.2}/>
   <ellipse cx={x} cy={y} rx={rr} ry={rr * .8} fill={SA.oakDark}/><ellipse cx={x - rr * .2} cy={y - rr * .15} rx={rr * .65} ry={rr * .5} fill={SA.oak}/></g>)}
 </g>;
};
/** A higher speed roadway straight down, running up the frame: barrier, lanes, dashes, shoulder,
 * drawn for the world span [ya, yb] (smaller y is further along). */
export const LANE_PLAN = {barrierX: 150, lanes: [190, 470, 750] as [number, number, number], shoulderX: 760, dash: 560};
export const LanePlan: React.FC<{ya: number; yb: number}> = ({ya, yb}) => {
 const {barrierX, lanes, shoulderX, dash} = LANE_PLAN, k0 = Math.floor(ya / dash) - 1, k1 = Math.ceil(yb / dash) + 1;
 const ks = Array.from({length: k1 - k0 + 1}, (_, i) => k0 + i);
 return <g data-part="lane-plan">
  <rect x={20} y={ya} width={barrierX - 40} height={yb - ya} fill={SA.grass}/>
  <rect x={barrierX - 20} y={ya} width={40} height={yb - ya} fill="#C9C2B4"/>
  <rect x={lanes[0]} y={ya} width={shoulderX + 80 - lanes[0]} height={yb - ya} fill={SA.asphalt}/>
  {ks.map(k => <rect key={k} x={lanes[1] - 5} y={k * dash} width={10} height={240} fill={SA.paint} opacity={.85}/>)}
  <rect x={shoulderX - 6} y={ya} width={10} height={yb - ya} fill={SA.paint}/>
  <rect x={shoulderX + 80} y={ya} width={1060 - shoulderX - 80} height={yb - ya} fill={SA.grass}/>
  {ks.filter(k => k % 3 === 0).map(k => <g key={'m' + k}>{[0, 1, 2, 3, 4].map(j => <ellipse key={j} cx={shoulderX + 160 + (j * 37) % 90} cy={k * dash + 100 + (j * 53) % 120} rx={40} ry={26} fill={j % 2 ? SA.mesquite : '#76874E'}/>)}</g>)}
 </g>;
};
/** A puddle of standing water lying across the lanes, from above. */
export const PuddlePlan: React.FC<{x0: number; x1: number; y0: number; y1: number; t: number}> = ({x0, x1, y0, y1, t}) => {
 const n = 16, pts = Array.from({length: n}, (_, i) => {const a = i / n * Math.PI * 2; return [(x0 + x1) / 2 + Math.cos(a) * (x1 - x0) / 2 * (1 + .08 * Math.sin(a * 3)), (y0 + y1) / 2 + Math.sin(a) * (y1 - y0) / 2 * (1 + .1 * Math.cos(a * 5))];});
 return <g data-part="standing-water-plan">
  <path d={'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L') + 'Z'} fill="#9BA6AC" opacity={.9} stroke="#DDE3E6" strokeWidth={3}/>
  {Array.from({length: 10}, (_, i) => <path key={i} d={`M${lerp(x0 + 40, x1 - 120, (i * .37) % 1)} ${lerp(y0 + 30, y1 - 30, frac(i * .29 + t * .03))}h${60 + (i % 3) * 30}`} stroke="#E4E9EC" strokeWidth={3} opacity={.5}/>)}
 </g>;
};
/** A fleet lot straight down: stall lines in two rows. */
export const LOT_PLAN = {rows: [560, 1000] as P, stall: 170, x0: 90};
export const LotPlan: React.FC = () => {
 const {rows, stall, x0} = LOT_PLAN;
 return <g data-part="lot-plan">
  <rect x={40} y={260} width={1000} height={1160} rx={12} fill="#56595D"/>
  <path d="M40 300H1040" stroke="#8E959A" strokeWidth={4} strokeDasharray="10 6"/>
  {rows.map(y => Array.from({length: 6}, (_, i) => <path key={y + '-' + i} d={`M${x0 + i * stall} ${y - 140}v280`} stroke={SA.paint} strokeWidth={6} opacity={.6}/>))}
  <g transform="translate(980 330)"><Mesquite h={160} seed={8}/></g>
 </g>;
};

// ---------------------------------------------------------------- picnic table for the map ------------
/** A weathered picnic table top in oblique view, far edge at y0, near edge below the frame. */
export const Table: React.FC<{y0: number}> = ({y0}) => {
 const id = useUid('sat');
 return <g data-part="picnic-table">
  <defs><linearGradient id={`${id}g`} x1="0" y1={y0} x2="0" y2="1940" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#8E7556"/><stop offset="1" stopColor="#6A5540"/></linearGradient></defs>
  <path d={`M60 ${y0}H1020L1180 1940H-100Z`} fill={`url(#${id}g)`}/>
  {Array.from({length: 6}, (_, i) => {const u = (i + 1) / 7, x0 = 60 + u * 960; return <path key={i} d={`M${x0} ${y0}L${lerp(-100, 1180, u)} 1940`} stroke="#4E3E2D" strokeWidth={5}/>;})}
  <path d={`M60 ${y0}H1020`} stroke="#A88D6C" strokeWidth={5}/>
  {[[240, y0 + 300], [760, y0 + 520]].map(([x, y], i) => <path key={i} d={`M${x} ${y}c30 -6 60 4 90 -2`} stroke="#5A4734" strokeWidth={3} fill="none"/>)}
 </g>;
};

// ---------------------------------------------------------------- the one export --------------------
type SupportProps =
 | {part: 'curb'; phone?: React.ReactNode}
 | {part: 'curbplan'; phone?: React.ReactNode}
 | {part: 'phone'; w: number; pin: number; status: number; t: number}
 | {part: 'map'; w: number; h: number; draw: number; zone: number; fill: number; t: number; pins?: number; layer?: 'base' | 'zone' | 'pins'}
 | {part: 'tag'; lines: string[]; size?: number; tone?: 'paper' | 'accent' | 'ink'; swing?: number; icon?: 'rain'; sub?: number}
 | {part: 'calendar'; month: string; day?: string; flip?: number; w?: number}
 | {part: 'creekback'; t: number; flow: number}
 | {part: 'creekbank'; t: number}
 | {part: 'pile'; p: number; t: number; len: number; h: number}
 | {part: 'creekplan'; t: number; rain: number; flow: number}
 | {part: 'remedycard'; w?: number; lit?: number; underline?: number; imprint?: number}
 | {part: 'hand'; dir: P; grip: 'knob' | 'pen'; skin?: string; scale?: number}
 | {part: 'water'; x0: number; x1: number; y: number; depth: number; t: number; flow?: number; toward?: boolean; reflect?: React.ReactNode; seed?: number; calm?: number; opacity?: number}
 | {part: 'wake'; amount: number; t: number; scale?: number; dir?: 1 | -1}
 | {part: 'rain'; t: number; w?: number; h?: number; amount?: number; seed?: number}
 | {part: 'street'; soft?: number}
 | {part: 'streetplan'; t: number; front: number; calm?: number}
 | {part: 'lane'; xa: number; xb: number}
 | {part: 'laneplan'; ya: number; yb: number}
 | {part: 'standing'; x0: number; x1: number; y0: number; y1: number; t: number; reflect?: React.ReactNode}
 | {part: 'puddleplan'; x0: number; x1: number; y0: number; y1: number; t: number}
 | {part: 'lot'}
 | {part: 'lotplan'}
 | {part: 'record'; w?: number; rows: number; remedyLit?: number; underline?: number; imprints?: Imprint[]}
 | {part: 'stamp'}
 | {part: 'pen'}
 | {part: 'desk'; x0: number; x1: number; y0: number; h: number; top?: boolean}
 | {part: 'grid'; cols: number; rows: number; fill: number; dx?: number; dy?: number}
 | {part: 'caricon'; fill?: number}
 | {part: 'quote'; w: number; lit: number; size?: number}
 | {part: 'check'; p: number; r?: number}
 | {part: 'mapcard'; updated: number; w?: number}
 | {part: 'table'; y0: number};

/** The support group's one export: every place, document and tag the film draws around the car. */
export const SanAntonioSupport: React.FC<SupportProps> = (props) => {
 switch (props.part) {
 case 'curb': return <Curb {...props}/>;
 case 'curbplan': return <CurbPlan {...props}/>;
 case 'phone': return <Phone {...props}/>;
 case 'map': return <StreetMap {...props}/>;
 case 'tag': return <Tag {...props}/>;
 case 'calendar': return <Calendar {...props}/>;
 case 'creekback': return <CreekBack {...props}/>;
 case 'creekplan': return <CreekPlan {...props}/>;
 case 'creekbank': return <CreekBank {...props}/>;
 case 'pile': return <Pile {...props}/>;
 case 'remedycard': return <RemedyCard {...props}/>;
 case 'hand': return <Hand {...props}/>;
 case 'water': return <Water {...props}/>;
 case 'wake': return <Wake {...props}/>;
 case 'rain': return <Rain {...props}/>;
 case 'street': return <StreetBack {...props}/>;
 case 'streetplan': return <StreetPlan {...props}/>;
 case 'lane': return <LaneBack {...props}/>;
 case 'laneplan': return <LanePlan {...props}/>;
 case 'standing': return <StandingWater {...props}/>;
 case 'puddleplan': return <PuddlePlan {...props}/>;
 case 'lot': return <LotBack/>;
 case 'lotplan': return <LotPlan/>;
 case 'record': return <RecordCard {...props}/>;
 case 'stamp': return <Stamp/>;
 case 'pen': return <Pen/>;
 case 'desk': return <Desk {...props}/>;
 case 'grid': return <IconGrid {...props}/>;
 case 'caricon': return <CarIcon {...props}/>;
 case 'quote': return <QuoteCard {...props}/>;
 case 'check': return <Check {...props}/>;
 case 'mapcard': return <MapCard {...props}/>;
 case 'table': return <Table {...props}/>;
 }
 throw new Error('Unknown San Antonio support part');
};
