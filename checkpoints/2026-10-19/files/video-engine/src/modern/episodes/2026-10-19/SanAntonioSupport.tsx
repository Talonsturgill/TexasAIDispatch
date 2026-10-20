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
 *    rust drip under its bolt, a steel bench, a hard shell suitcase, worn bollards, a dry laid limestone
 *    planter with a young live oak leaning out of it, and a painted bay box on the asphalt. No real
 *    signage text.
 *  - a worn phone whose plain map screen carries a ride request pin that turns to arriving. No brand.
 *  - a flat street map on a weathered picnic table: the river line, the street grid, a loop road,
 *    an outlined limited area that traces closed with a sixty square miles tag, a February calendar.
 *  - Salado Creek as a limestone bank of broken pale ledges under live oaks, fast brown water running
 *    left, downstream, a near bank edge with brush and a live oak, and rain; a flooded residential street of one-storey stucco
 *    and limestone houses, a live oak and a leaning blank street sign; a higher speed roadway with a
 *    median barrier, live oaks and mesquite beyond it, dark blackland clay in the verge, lane dashes and a
 *    sheet of standing water; a fleet lot behind a chain link fence on a dry laid limestone wall, with a
 *    live oak and a mesquite behind it.
 *  - a desk and the federal recall record card, each row's label stacked over its value in type sized for
 *    a phone, a lit remedy row, a header slot and a remedy slot where the stamps land clear of the words,
 *    and a wooden rubber stamp seen from above, as the card is; a grid of
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
/** A smooth closed (or open) curve through points, Catmull-Rom as cubic Beziers. Water edges are drawn
 * with it so no sheet of water ever has a straight side or a square corner. */
export function smoothPath(pts: P[], closed = true): string {
 const n = pts.length, at = (i: number) => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
 let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
 for (let i = 0; i < (closed ? n : n - 1); i++) {
  const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
  d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
 }
 return d + (closed ? 'Z' : '');
}
/** The footprint of floodwater spreading along a street from the left, in elevation: its far side lies
 * along the far gutter (y0), its near side along the near gutter (y1), and its leading edge at about
 * `front` is a lobed tongue that runs ahead along both gutters and lags over the crown of the road.
 * The lobes breathe slowly on the film clock. Never a vertical edge. */
export function floodFoot(front: number, y0: number, y1: number, t: number, left = -160): string {
 const edge: P[] = Array.from({length: 9}, (_, i) => {
  const v = i / 8, y = lerp(y0, y1, v), gutter = 110 * Math.pow(Math.abs(2 * v - 1), 3);
  return [front + gutter - 40 + 26 * Math.sin(v * 9.1 + 1.3 + .9 * t) + 14 * Math.sin(v * 23 + 2 * t), y];
 });
 // the near side laps against the foot of the near curb: a slow uneven line, never ruled
 const near: P[] = Array.from({length: 10}, (_, i) => {const x = lerp(edge[8][0] - 40, left, i / 9);
  return [x, y1 - 3 - 4 * Math.sin(x * .021 + .7 * t) - 2.5 * Math.sin(x * .07 + 1.1)];});
 return `M${left} ${y0 - 2}L${edge[0][0].toFixed(1)} ${edge[0][1].toFixed(1)}` + smoothPath([...edge, ...near], false).replace(/^M[^C]*/, '') + 'Z';
}
/** A sheet of standing water lying across a lane, x0 to x1 and y0 (far) to y1 (near), with rounded,
 * irregular ends and edges: the shape a puddle actually takes. `grow` inflates it for its wet halo. */
export function puddleFoot(x0: number, x1: number, y0: number, y1: number, seed = 5, grow = 0): string {
 const r = rng(seed), cy = (y0 + y1) / 2, ry = (y1 - y0) / 2 + grow, end = Math.min(150, (x1 - x0) / 4), n = Math.max(5, Math.round((x1 - x0) / 150));
 const top: P[] = Array.from({length: n + 1}, (_, i) => [lerp(x0 + end * .7, x1 - end * .7, i / n), cy - ry + (r() - .5) * 12]);
 const bot: P[] = Array.from({length: n + 1}, (_, i) => [lerp(x1 - end * .7, x0 + end * .7, i / n), cy + ry + (r() - .5) * 9]);
 const right: P[] = [[x1 - end * .2 + grow, cy - ry * .45], [x1 + grow + (r() - .5) * 16, cy + 4], [x1 - end * .3 + grow, cy + ry * .55]];
 const left: P[] = [[x0 + end * .35 - grow, cy + ry * .5], [x0 - grow + (r() - .5) * 16, cy - 2], [x0 + end * .15 - grow, cy - ry * .5]];
 return smoothPath([...top, ...right, ...bot, ...left], true);
}
export type SheetTone = 'mud' | 'sky';
const SHEET: Record<SheetTone, {top: string; mid: string; midAt: number; deep: string; streak: string; fleck: string; edge: string}> = {
 mud: {top: SA.waterLit, mid: SA.water, midAt: .08, deep: SA.waterDeep, streak: '#A88E68', fleck: SA.foam, edge: '#D9CCB2'},
 sky: {top: '#B9C3C8', mid: '#8E989E', midAt: .5, deep: '#6F6A5E', streak: '#E4E9EC', fleck: '#F1F4F5', edge: '#DDE3E6'},
};
/** ONE continuous sheet of water with a subject standing in it. The footprint `foot` is filled by one
 * gradient keyed to fixed rows (y0 far to y1 near), so the sheet has no seams or panels. Drawn in two
 * layers around the subject: `back` lies behind it, `front` is the same sheet, the same gradient and the
 * same ripples, clipped to the rows nearer than the subject's waterline `line.y`, so the water closes
 * over the wheels and lower body instead of stopping at them. The front layer carries the subject's
 * reflection and, across the subject's span, the foam line where water meets it. Ripples drift at
 * `drift` units a second (negative runs left) on the film clock and fade as the water calms. `lit` sets how far
 * down the sheet its pale top colour reaches (a share of y0 to y1, the tone's own by default); a sheet whose
 * far edge meets an irregular bank passes a hair's breadth, so no pale band runs along its top and the bank's
 * own toe layer lights and shades that edge instead. */
export const FloodSheet: React.FC<{foot: string; x0: number; x1: number; y0: number; y1: number; t: number; layer: 'back' | 'front';
 drift?: number; tone?: SheetTone; calm?: number; seed?: number; opacity?: number; marks?: number; edge?: string;
 reflect?: React.ReactNode; line?: {y: number; x0: number; x1: number}; press?: number; lit?: number}> =
 ({foot, x0, x1, y0, y1, t, layer, drift = 0, tone = 'mud', calm = 0, seed = 7, opacity = 1, marks = 46, edge, reflect, line, press = 0, lit}) => {
 const id = useUid('saf'), c = SHEET[tone], amp = 1 - .85 * clamp(calm), W = Math.max(1, x1 - x0), r = rng(seed);
 const ripples = <g data-part="ripples">{Array.from({length: marks}, (_, i) => {
  const u = r(), v = r(), len = lerp(40, 130, r()), sp = lerp(.7, 1.3, r()), near = Math.pow(v, 1.2);
  const xx = x0 + frac(u + t * drift * sp * (.55 + .9 * near) / W) * W, yy = lerp(y0 + 6, y1, near);
  const fleck = i % 4 === 0;
  return <path key={i} d={`M${xx.toFixed(1)} ${yy.toFixed(1)}c${(len * .3).toFixed(1)} ${(-2 - 3 * near).toFixed(1)} ${(len * .7).toFixed(1)} ${(2 + 2 * near).toFixed(1)} ${(len * (.5 + near)).toFixed(1)} 0`}
   stroke={fleck ? c.fleck : c.streak} strokeWidth={1.4 + 2.6 * near} strokeOpacity={(fleck ? .38 : .44) * amp} strokeLinecap="round" fill="none"/>;
 })}</g>;
 const body = <rect x={x0 - 400} y={y0 - 400} width={W + 800} height={y1 - y0 + 800} fill={`url(#${id}g)`}/>;
 const defs = <defs>
  <linearGradient id={`${id}g`} x1="0" y1={y0} x2="0" y2={y1} gradientUnits="userSpaceOnUse">
   <stop offset="0" stopColor={c.top}/><stop offset={lit ?? c.midAt} stopColor={c.mid}/><stop offset="1" stopColor={c.deep}/>
  </linearGradient>
  <clipPath id={`${id}f`}><path d={foot}/></clipPath>
 </defs>;
 if (layer === 'back') return <g data-part="water-sheet" opacity={opacity}>{defs}
  <g clipPath={`url(#${id}f)`}>{body}{ripples}</g>
  {edge && <path d={edge} stroke={c.edge} strokeWidth={2.5} fill="none" opacity={.6 * amp + .15}/>}
 </g>;
 if (!line) return null;
 // the waterline rows: a gentle swell across the whole sheet, so the front layer has no straight top
 const wl = Array.from({length: 31}, (_, i) => {const x = lerp(x0 - 400, x1 + 400, i / 30); return `${i ? 'L' : 'M'}${x.toFixed(1)} ${(line.y + 1.8 * amp * Math.sin(x * .045 + t * 4.2 + seed)).toFixed(1)}`;}).join('');
 const span = Math.max(1, line.x1 - line.x0);
 const foam = Array.from({length: 17}, (_, i) => {const x = lerp(line.x0, line.x1, i / 16); return `${i ? 'L' : 'M'}${x.toFixed(1)} ${(line.y + 1.6 * Math.sin(x * .09 + t * 6 + seed)).toFixed(1)}`;}).join('');
 return <g data-part="water-sheet-front" opacity={opacity}>{defs}
  <defs>
   <clipPath id={`${id}w`}><path d={`${wl}L${x1 + 400} ${y1 + 400}L${x0 - 400} ${y1 + 400}Z`}/></clipPath>
   <linearGradient id={`${id}l`} x1={line.x0} y1="0" x2={line.x1} y2="0" gradientUnits="userSpaceOnUse">
    <stop offset="0" stopColor={c.fleck} stopOpacity={0}/><stop offset=".1" stopColor={c.fleck} stopOpacity={.85}/>
    <stop offset=".9" stopColor={c.fleck} stopOpacity={.85}/><stop offset="1" stopColor={c.fleck} stopOpacity={0}/>
   </linearGradient>
  </defs>
  <g clipPath={`url(#${id}f)`}><g clipPath={`url(#${id}w)`} data-part="water-over-subject">
   {body}
   {reflect && <g opacity={.3}>{reflect}</g>}
   {ripples}
   <path d={foam} transform="translate(0 5)" stroke={c.deep} strokeWidth={6} strokeOpacity={.35} fill="none"/>
  </g></g>
  <g data-part="waterline-contact">
   <path d={foam} stroke={`url(#${id}l)`} strokeWidth={3.4 + 2 * clamp(press)} fill="none" strokeLinecap="round"/>
   {[0, 1].map(k => {const ph = frac(t * .9 + k * .5), x = k ? line.x1 : line.x0, rr = lerp(span * .06, span * .2, ph);
    return <ellipse key={k} cx={x} cy={line.y + 3} rx={rr} ry={rr * .12} fill="none" stroke={c.fleck} strokeWidth={2} opacity={.5 * (1 - ph) * amp}/>;})}
  </g>
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
  {/* a dry laid limestone planter with a young live oak leaning out of it */}
  <g transform={`translate(${CURB.planter[0]} ${CURB.planter[1]})`} data-part="limestone-planter">
   <g transform="translate(62 -58)"><Oak h={240} seed={6} flip/></g>
   {[0, 1, 2].map(row => [0, 1, 2].map(i => <rect key={row + '-' + i} x={(row % 2 ? -14 : 0) + i * 48} y={-60 + row * 20} width={row % 2 && i === 0 ? 34 : 46} height={19} rx={3}
    fill={(i + row) % 2 ? SA.limestone : '#CEC4AE'} stroke={SA.limestoneShade} strokeWidth={1.5}/>))}
   <path d="M0 -60h140" stroke="#8A8171" strokeWidth={2}/>
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
  {/* the pickup lane runs on under the frame bottom, so a raised or closer camera never shows the plate
   * below the curb (the deep asphalt colour pads past the gradient's last row) */}
  <path d={`M-80 ${roadY}H1160V2900H-80Z`} fill={`url(#${id}r)`}/>
  {Array.from({length: 5}, (_, i) => <path key={'p' + i} d={`M${60 + i * 230} ${1560 + (i % 2) * 90}c40 -6 90 4 130 -2`} stroke="#2E3135" strokeWidth={4} fill="none" opacity={.55}/>)}
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
   {/* the loop road and the radial highways are drawn as roads, thin and pale like the grid, so the
    * limited area's outline is the only ring on the map */}
   <path d={d(loop)} stroke="#D6C29C" strokeWidth={3.5} fill="none" strokeLinejoin="round" {...dash(draw)}/>
   {[[[.5, .46], [.95, .02]], [[.5, .46], [.06, .94]], [[.5, .46], [.02, .2]], [[.5, .46], [.98, .78]], [[.5, .46], [.52, 0]]].map((ps, i) =>
    <path key={'r' + i} d={d(ps as P[])} stroke="#D6C29C" strokeWidth={4} fill="none" {...dash(draw)}/>)}
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
/** The creek in elevation. The channel runs across the frame and DOWNSTREAM IS LEFT: the brown sheet
 * (the episode's FloodSheet) starts at the far bank's foot, `waterY` is its surface where the car sits,
 * and the near bank stands in the right foreground, upstream. */
export const CREEK = {bankY: 1092, carY: 1236, waterY: 1170, nearBank: {x1: 330, y0: 1150, mirror: 1290}};
/** The creek's FIXED landmarks, in creek world units, which a locked camera holds while the current carries
 * the car past them: the submerged limestone shelf at the near bank's shallow edge runs upstream (right) from
 * its broken lip at `lip`, its top `shelf` car units under the surface; the far bank's landmark live oak stands
 * at `oak`, `oakH` tall; and a pale limestone ledge juts from the far bank's foot into the water across
 * `ledge`. Nothing shows a crossing or how the car came to be at the edge. */
export const CREEK_MARKS = {lip: 570, oak: 420, oakH: 380, ledge: [90, 250] as P};
/** The far bank's live oaks: world x, height and seed. Uneven spacing and heights, never a row. The one at
 * CREEK_MARKS.oak is the landmark, taller than the rest. */
const CREEK_OAKS: [number, number, number][] = [[-640, 290, 27], [-250, 240, 28], [-60, 300, 29], [CREEK_MARKS.oak, CREEK_MARKS.oakH, 22], [930, 300, 23], [1400, 270, 24]];
/** Slumped limestone blocks lying at the far bank's foot, standing out into the water (world x). None sits in
 * the landmark ledge's span. */
export const CREEK_SLUMPS = [-150, 360, 700, 985, 1265];
/** The far bank's toe: the row where the water meets the bank at world x. Never ruled: it wanders with the
 * bank by up to about 13 units and pushes out round each slumped block. The water's far edge, the lowest stone
 * course and the bank's shadow on the water all follow it. */
export const creekToe = (x: number) => CREEK.bankY - 6 + 7 * Math.sin(x * .013 + .4) + 4 * Math.sin(x * .047 + 1.9) + 2.5 * Math.sin(x * .13 + .6)
 + CREEK_SLUMPS.reduce((s, c) => s + 13 * Math.exp(-(((x - c) / 42) ** 2)), 0);
/** The toe sampled every `step` units from x0 to x1, for a smooth path through it. */
export const creekToePts = (x0: number, x1: number, step = 24): P[] => {const n = Math.max(2, Math.ceil((x1 - x0) / step));
 return Array.from({length: n + 1}, (_, i) => {const x = lerp(x0, x1, i / n); return [x, creekToe(x)] as P;});};
const polyD = (pts: P[], close = true) => 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L') + (close ? 'Z' : '');
const turn = (pts: P[], deg: number, dy: number): P[] => {const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
 const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
 return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + dy + (x - cx) * s + (y - cy) * c] as P);};
/** The far limestone bank of Salado Creek under live oaks, built as a real cut bank rather than ruled bands:
 * four courses of broken limestone blocks of uneven length and thickness, each block stepped up or down from
 * its neighbour, some missing so the shaded bank shows through the joint, a few slumped and tilted, brush
 * growing over the joints, and a ragged grass edge hanging over the top course. The lowest course runs down to
 * the wandering toe (creekToe), where the episode's water sheet meets it. No block or edge runs more than about
 * 150 units straight. No crossing, no gauge: nothing says how a car came to be in the water. */
export const CreekBack: React.FC<{t: number; flow: number; width?: [number, number]}> = ({width = [-80, 1160]}) => {
 const {bankY} = CREEK, [x0, x1] = width, r = rng(12), xa = x0 - 60, xb = x1 + 60;
 const nG = Math.ceil((xb - xa) / 38);
 const gTop: P[] = Array.from({length: nG + 1}, (_, i) => {const x = lerp(xa, xb, i / nG); return [x, bankY - 116 + 5 * Math.sin(x * .021 + .3) + 4 * Math.sin(x * .067) + 3 * Math.sin(x * .19 + 1) + (r() - .5) * 12] as P;});
 const gLow: P[] = Array.from({length: nG + 1}, (_, i) => {const x = lerp(xb, xa, i / nG); return [x, bankY - 88 + 5 * Math.sin(x * .017 + 1.2) + 4 * Math.sin(x * .09 + .5) + (r() - .5) * 14 + (i % 3 === 0 ? 8 * r() : 0)] as P;});
 const body: P[] = [...gLow.slice().reverse().map(([x, y], i) => [x, y - 6 + 5 * Math.sin(x * .13 + .7) + (i % 2 ? 4 : -4)] as P), ...creekToePts(xa, xb, 40).reverse().map(([x, y]) => [x, y + 24] as P)];
 const fills = [SA.limestone, '#CEC4AE', '#D6CCB4', '#C8BDA4'];
 const blocks: {pts: P[]; fill: string}[] = [];
 for (let c = 0; c < 4; c++) {
  let x = xa - r() * 60;
  while (x < xb) {
   const L = 70 + r() * 80, skip = r() < .14, y = bankY - 96 + c * 22 + (r() - .5) * 12, th = 19 + r() * 9;
   const j = () => (r() - .5) * 5, xe = x + L;
   const bot = (xx: number) => c === 3 ? creekToe(xx) + 16 : y + th + j();
   const pts: P[] = [[x + 2 + j(), y + 3 + j()], [x + L * .3, y + j()], [x + L * .62, y + j() + (r() < .3 ? 4 : 0)], [xe - 3, y + 2 + j()], [xe + 1, y + th * .5 + j()],
    [xe - 2, bot(xe)], [x + L * .55, bot(x + L * .55)], [x + 4, bot(x)], [x - 1, y + th * .45 + j()]];
   const slump = r() < .1, tilt = (r() - .5) * 7;
   if (!skip) blocks.push({pts: slump && c < 3 ? turn(pts, tilt, 4) : pts, fill: fills[Math.floor(r() * 4)]});
   x = xe + (r() < .25 ? 6 + r() * 16 : -3);
  }
 }
 const cracks = Array.from({length: 26}, () => {const x = lerp(x0, x1, r()), y = lerp(bankY - 92, bankY - 8, r()), l = lerp(10, 34, r()), a = (r() - .5) * 1.1;
  return `M${x.toFixed(1)} ${y.toFixed(1)}l${(l * Math.cos(a)).toFixed(1)} ${(l * Math.sin(a)).toFixed(1)}` + (r() < .35 ? `m${(-l * .4).toFixed(1)} 0l${(6 + r() * 8).toFixed(1)} ${(4 + r() * 6).toFixed(1)}` : '');});
 const brush = Array.from({length: Math.ceil((xb - xa) / 110)}, (_, i) => ({x: xa + i * 110 + r() * 80, y: bankY - 92 + r() * 52, n: 3 + Math.floor(r() * 3), s: .7 + r() * .6}));
 const tufts = gLow.filter((_, i) => i % 2 === 0).map(([x, y]) => `M${x.toFixed(1)} ${(y - 3).toFixed(1)}l${(-3 - r() * 4).toFixed(1)} ${(8 + r() * 10).toFixed(1)}M${(x + 6).toFixed(1)} ${(y - 3).toFixed(1)}l${(2 + r() * 3).toFixed(1)} ${(6 + r() * 9).toFixed(1)}`).join('');
 return <g data-part="creek-back">
  <g data-part="limestone-bank">
   <path d={polyD(body)} fill={SA.limestoneDeep}/>
   {blocks.map((b, i) => <path key={i} d={polyD(b.pts)} fill={b.fill} stroke={SA.limestoneShade} strokeWidth={2} strokeLinejoin="round"/>)}
   <path d={cracks.join('')} stroke={SA.limestoneDeep} strokeWidth={2} opacity={.55} fill="none"/>
   {brush.map((b, i) => <g key={'br' + i} transform={`translate(${b.x.toFixed(1)} ${b.y.toFixed(1)}) scale(${b.s.toFixed(2)})`}>
    {Array.from({length: b.n}, (_, k) => <ellipse key={k} cx={(k - b.n / 2) * 13 + (k % 2) * 4} cy={-(k % 3) * 7} rx={15 - (k % 2) * 4} ry={10 - (k % 3) * 2} fill={k % 2 ? '#6F7F55' : '#5E6E46'}/>)}</g>)}
   <path d={smoothPath([...gTop, ...gLow], true)} fill={SA.grass}/>
   <path d={tufts} stroke="#7E8450" strokeWidth={3} strokeLinecap="round" fill="none"/>
   {/* live oaks stand along the whole bank; the one at CREEK_MARKS.oak is the landmark */}
   {CREEK_OAKS.filter(([x]) => x > x0 - 100 && x < x1 + 100).map(([x, h, seed], i) =>
    <g key={i} transform={`translate(${x} ${bankY - 100 - (i % 2) * 8})`}><Oak h={h} seed={seed} flip={i % 2 === 0}/></g>)}
  </g>
 </g>;
};
/** The water at the far bank's toe, drawn on the sheet: the bank's shadow as overlapping soft pools of uneven
 * depth, broken pale reflections of the stone courses and dark ones under the oaks, slumped blocks standing in
 * the current with foam collars and eddies shed downstream, and broken foam along the toe. Nothing here runs
 * as one band across the creek. */
export const CreekToe: React.FC<{t: number; width?: [number, number]}> = ({t, width = [-80, 1160]}) => {
 const [x0, x1] = width, r = rng(73), xa = x0 - 60, xb = x1 + 60;
 const pools = Array.from({length: Math.ceil((xb - xa) / 70)}, (_, i) => {const x = xa + i * 70 + (r() - .5) * 40; return {x, w: 50 + r() * 70, d: 10 + r() * 22, o: .16 + r() * .2};});
 const refl = Array.from({length: Math.ceil((xb - xa) / 55)}, () => ({x: lerp(xa, xb, r()), l: 30 + r() * 80, dy: 8 + r() * 26, h: 2.5 + r() * 3.5, o: .16 + r() * .2, ph: r() * 6}));
 return <g data-part="creek-toe">
  {pools.map((p, i) => <ellipse key={'s' + i} cx={p.x.toFixed(1)} cy={(creekToe(p.x) + p.d * .45).toFixed(1)} rx={p.w.toFixed(1)} ry={p.d.toFixed(1)} fill="#3B2C1C" opacity={p.o}/>)}
  {CREEK_OAKS.map(([x, h], i) => <ellipse key={'o' + i} cx={x + 10} cy={(creekToe(x) + 22).toFixed(1)} rx={h * .3} ry={9} fill="#3F4A2C" opacity={.22}/>)}
  {refl.map((q, i) => {const y = creekToe(q.x) + q.dy, s = 3 * Math.sin(t * 2.1 + q.ph);
   return <path key={'r' + i} d={`M${(q.x + s).toFixed(1)} ${y.toFixed(1)}q${(q.l * .5).toFixed(1)} ${(-q.h).toFixed(1)} ${q.l.toFixed(1)} 0`} stroke="#CBBE9F" strokeWidth={q.h} strokeLinecap="round" fill="none" opacity={q.o}/>;})}
  {CREEK_SLUMPS.map((x, i) => {const y = creekToe(x), w = 40 + (i * 13) % 28, h = 20 + (i * 7) % 12, rot = ((i * 37) % 9) - 4;
   return <g key={'b' + i} data-part="slumped-block">
    <path transform={`rotate(${rot} ${x.toFixed(1)} ${y.toFixed(1)})`} d={polyD([[x - w / 2, y + 8], [x - w / 2 + 4, y - h + 4], [x - 4, y - h], [x + w / 2 - 2, y - h + 6], [x + w / 2, y + 8]])}
     fill={i % 2 ? SA.limestone : '#CEC4AE'} stroke={SA.limestoneShade} strokeWidth={2}/>
    <path d={`M${(x - w / 2 - 10).toFixed(1)} ${(y + 6).toFixed(1)}q${w / 2 + 10} -7 ${w + 20} 0`} stroke={SA.foam} strokeWidth={4} fill="none" opacity={.8}/>
    {[0, 1].map(k => {const ph = frac(t * 1.1 + k * .5 + i * .23), ex = x - w / 2 - 14 - 70 * ph;
     return <path key={k} d={`M${ex.toFixed(1)} ${(y + 10 + 4 * k).toFixed(1)}c-14 -6 -30 -6 -44 2`} stroke={SA.foam} strokeWidth={3} fill="none" strokeLinecap="round" opacity={.6 * (1 - ph)}/>;})}
   </g>;})}
  {Array.from({length: Math.ceil((xb - xa) / 90)}, (_, i) => {const xs = xa + i * 90 + ((i * 53) % 40), l = 24 + (i * 29) % 40, ph = Math.sin(t * 3 + i);
   const pts = [0, .5, 1].map(u => [xs + u * l, creekToe(xs + u * l) + 3 + ph * .8] as P);
   return <path key={'f' + i} d={smoothPath(pts, false)} stroke={SA.foam} strokeWidth={3} fill="none" opacity={.5} strokeLinecap="round"/>;})}
 </g>;
};
/** The near creek bank edge in the right foreground, upstream of the car: stacked limestone ledges with
 * hand-cut, stepped tops and broken undersides, brush and a live oak, drawn as the left-hand bank mirrored about
 * `mirror` so the open water lies downstream. */
export const CreekBank: React.FC<{t: number}> = ({t}) => {
 const {x1, y0, mirror} = CREEK.nearBank, r = rng(19);
 return <g data-part="near-bank-edge" transform={`translate(${mirror} 0) scale(-1 1)`}>
  {[0, 1, 2, 3, 4].map(k => {const y = y0 + k * 60, w = x1 - k * 34 + (k % 2) * 20, rk = rng(70 + k), n = Math.ceil((w + 90) / 55);
   const topPts: P[] = Array.from({length: n + 1}, (_, i) => [lerp(-90, w, i / n), y + 8 * (i / n) + (rk() - .5) * 10 + (i % 2 ? 6 : -5) + 3 * Math.sin(i * 2.3 + k)] as P);
   const botPts: P[] = Array.from({length: n + 1}, (_, i) => [lerp(w - 8, -90, i / n), y + 62 + (rk() - .5) * 10 + (i % 2 ? -6 : 5) + 3 * Math.sin(i * 1.7 + k)] as P);
   const d = polyD(topPts, false) + `C${w + 24} ${y + 20} ${w + 18} ${y + 52} ${w - 8} ${(y + 62).toFixed(1)}` + botPts.slice(1).map(([x, yy]) => `L${x.toFixed(1)} ${yy.toFixed(1)}`).join('') + 'Z';
   return <path key={k} d={d} fill={k % 2 ? SA.limestone : '#CEC4AE'} stroke={SA.limestoneShade} strokeWidth={2.5} strokeLinejoin="round"/>;})}
  {Array.from({length: 14}, () => [lerp(-60, x1 - 40, r()), lerp(y0 + 10, y0 + 290, r())]).map(([x, y], i) =>
   <path key={'c' + i} d={`M${x} ${y}l${20 + r() * 30} ${(r() - .5) * 12}`} stroke={SA.limestoneDeep} strokeWidth={2} opacity={.6}/>)}
  {/* white water working down the bank face, broken where it catches on the courses */}
  {[[[x1 - 10, y0 + 10], [x1 + 14, y0 + 48], [x1 + 10, y0 + 92]], [[x1 + 6, y0 + 118], [x1 - 4, y0 + 168], [x1 - 22, y0 + 214]], [[x1 - 34, y0 + 236], [x1 - 50, y0 + 270], [x1 - 70, y0 + 300]]].map((pts, i) =>
   <path key={'fw' + i} d={smoothPath(pts as P[], false)} stroke={SA.foam} strokeWidth={6} fill="none" strokeLinecap="round" opacity={.55 + .2 * Math.sin(t * 7 + i)}/>)}
  <g transform={`translate(150 ${y0 + 6})`}><Oak h={380} seed={26}/></g>
  {[[10, y0 + 4], [70, y0 + 2], [250, y0 + 6], [300, y0 + 60], [120, y0 + 122], [210, y0 + 184]].map(([x, y], i) => <g key={'b' + i} transform={`translate(${x} ${y})`}>
   {[0, 1, 2, 3, 4].map(j => <ellipse key={j} cx={(j - 2) * 14 + (i % 2) * 6} cy={-14 - (j % 3) * 10} rx={20} ry={13} fill={j % 2 ? '#6F7F55' : '#5E6E46'}/>)}</g>)}
 </g>;
};
/** The far bank's landmark ledge: a pale limestone slab jutting from the bank's foot into the current across
 * CREEK_MARKS.ledge, its top hand cut and stepped, its face undercut dark at a waterline that wanders and is
 * broken by a block slumped from its middle, the current piling white against its upstream (right) end and a
 * standing wave trailing off it downstream. It lies on the water behind the car. */
export const CreekLedge: React.FC<{t: number}> = ({t}) => {
 const [a, b] = CREEK_MARKS.ledge, top = CREEK.bankY - 30, face = CREEK.bankY + 14, r = rng(57), mid = (a + b) / 2 + 10;
 const wl = (x: number) => face + 4 * Math.sin(x * .08 + 1) + 3 * Math.sin(x * .21) + 9 * Math.exp(-(((x - mid) / 18) ** 2));
 const water: P[] = Array.from({length: 13}, (_, i) => {const x = lerp(b + 26, a - 22, i / 12); return [x, wl(x)] as P;});
 const topPts: P[] = [[a - 8, top + 12], [a + 26, top + 5], [a + 62, top + 9], [a + 92, top + 2], [a + 118, top + 6], [b - 22, top + 11], [b + 6, top + 8]];
 const under: P[] = Array.from({length: 9}, (_, i) => {const x = lerp(a - 18, b + 22, i / 8); return [x, face - 13 + 3 * Math.sin(x * .11) + (r() - .5) * 6] as P;});
 const pulse = (k: number) => frac(t * 1.7 + k * .37);
 const blockAt: P[] = turn([[mid - 16, face - 12], [mid + 14, face - 15], [mid + 17, face + 10], [mid - 14, face + 12]], 8, 3);
 return <g data-part="creek-ledge">
  <path d={polyD([[a - 22, wl(a - 22)], ...topPts, [b + 26, wl(b + 26)], ...water.slice(1)])} fill={SA.limestone} stroke={SA.limestoneShade} strokeWidth={2.5} strokeLinejoin="round"/>
  <path d={polyD([[a - 4, top + 20], [a + 40, top + 15], [a + 80, top + 22], [b - 30, top + 17], [b + 14, top + 19]], false)} stroke={SA.limestoneShade} strokeWidth={2} fill="none"/>
  <path d={polyD([...under, [b + 26, wl(b + 26)], ...water.slice(1)])} fill={SA.limestoneDeep} opacity={.85}/>
  <path d={polyD(blockAt)} fill="#CEC4AE" stroke={SA.limestoneShade} strokeWidth={2}/>
  {Array.from({length: 7}, () => [lerp(a, b, r()), lerp(top + 14, face - 16, r()), lerp(14, 34, r())]).map(([x, y, l], i) =>
   <path key={i} d={`M${x} ${y}l${l} ${(r() - .5) * 8}`} stroke={SA.limestoneDeep} strokeWidth={2} opacity={.55}/>)}
  {/* the current piling against the upstream end, and the standing wave it sheds downstream */}
  {[0, 1, 2].map(k => {const ph = pulse(k), x = b + 24 + 30 * ph;
   return <path key={'p' + k} d={`M${x} ${face - 20 - 10 * (1 - ph)}q14 12 4 24`} stroke={SA.foam} strokeWidth={5 - 2 * ph} fill="none" strokeLinecap="round" opacity={.85 * (1 - ph)}/>;})}
  {/* broken foam along its waterline, never one stroke */}
  {[0, 1, 2, 3].map(k => <path key={'f' + k} d={smoothPath(water.slice(k * 3, k * 3 + 3).map(([x, y]) => [x, y + 2] as P), false)} stroke={SA.foam} strokeWidth={4} fill="none" opacity={.7} strokeLinecap="round"/>)}
  {[0, 1, 2, 3].map(k => {const ph = frac(t * .9 + k * .25), x = a - 30 - 160 * ph;
   return <path key={'w' + k} d={`M${x} ${face + 4 + 6 * k % 12}c-20 -8 -44 -8 -64 2`} stroke={SA.foam} strokeWidth={3.5} fill="none" strokeLinecap="round" opacity={.6 * (1 - ph)}/>;})}
 </g>;
};
/** The shallow edge of the near bank in elevation: a limestone shelf a little under the surface, running
 * upstream (right) from its broken lip at CREEK_MARKS.lip, the water over it paler and riffled, the current
 * pouring white over the lip into the deep brown channel downstream. It has no ruled side: its far and near
 * sides wander, hand cut, and a vertical mask dissolves it into the channel toward both, so only the lip reads
 * as an edge. Its tint is OPAQUE, the colour the old translucent tint made over this water, so it can be drawn
 * twice without a mark: the back layer is drawn whole behind the car (the FloodSheet's front layer covers its
 * lower rows), and the front layer, clipped to the rows below the SAME waterline swell the FloodSheet closes over
 * the car with (that sheet's span `span`, seed `seed`, calm water) less 1.5 units, redraws them over the car's
 * wheels. The two overlap across the swell, so no antialiased hairline or seam can show where they meet. `drift` is the current's speed (negative runs left). */
export const CreekShelf: React.FC<{t: number; layer: 'back' | 'front'; drift: number; seed?: number; span?: [number, number]}> =
 ({t, layer, drift, seed = 17, span = [-300, 1500]}) => {
 const id = useUid('scs'), {lip} = CREEK_MARKS, wy = CREEK.waterY, y0 = wy - 46, y1 = wy + 150, x1 = 1500, r = rng(61);
 // the lip runs a little leftward as it comes nearer, broken into short steps
 const lipAt = (y: number) => lip + 14 - 34 * (y - y0) / (y1 - y0) + 6 * Math.sin(y * .09);
 const edge: P[] = Array.from({length: 11}, (_, i) => {const y = lerp(y0 + 6, y1 - 6, i / 10); return [lipAt(y), y];});
 // the far and near sides wander like a cut stone shelf seen through water, never along a row
 const far: P[] = Array.from({length: 14}, (_, i) => {const x = lerp(x1 + 60, lipAt(y0) + 40, i / 13); return [x, y0 + 8 * Math.sin(x * .013 + 1.1) + 6 * Math.sin(x * .041) + 4 * Math.sin(x * .11 + 2) + (i % 2 ? 7 : -6)];});
 const near: P[] = Array.from({length: 14}, (_, i) => {const x = lerp(lipAt(y1) + 40, x1 + 60, i / 13); return [x, y1 + 10 * Math.sin(x * .011 + 2.3) + 7 * Math.sin(x * .037 + .4) + 4 * Math.sin(x * .12 + 1.3) + (i % 2 ? -7 : 6)];});
 const area = smoothPath([...far, ...edge, ...near], true);
 // the FloodSheet's waterline swell, sampled at the same 31 points across the same span as that sheet draws it,
 // lifted 1.5 units so the front layer overlaps the sheet's own split
 const swell = Array.from({length: 31}, (_, i) => {const x = lerp(span[0] - 400, span[1] + 400, i / 30);
  return `${i ? 'L' : 'M'}${x.toFixed(1)} ${(wy - 1.5 + 1.8 * Math.sin(x * .045 + t * 4.2 + seed)).toFixed(1)}`;}).join('');
 const side = layer === 'back' ? `M${span[0] - 400} ${y0 - 400}H${span[1] + 400}V${y1 + 400}H${span[0] - 400}Z` : `${swell}L${span[1] + 400} ${y1 + 400}L${span[0] - 400} ${y1 + 400}Z`;
 return <g data-part={'shallow-shelf-' + layer}>
  <defs><clipPath id={`${id}c`}><path d={side}/></clipPath>
   <clipPath id={`${id}a`}><path d={area}/></clipPath>
   <linearGradient id={`${id}g`} x1="0" y1={y0 - 12} x2="0" y2={y1 + 14} gradientUnits="userSpaceOnUse">
    <stop offset="0" stopColor="#FFFFFF" stopOpacity={0}/><stop offset=".2" stopColor="#FFFFFF" stopOpacity={1}/>
    <stop offset=".62" stopColor="#FFFFFF" stopOpacity={1}/><stop offset="1" stopColor="#FFFFFF" stopOpacity={0}/></linearGradient>
   <mask id={`${id}m`} maskUnits="userSpaceOnUse" x={-400} y={y0 - 60} width={2400} height={y1 - y0 + 120}>
    <rect x={-400} y={y0 - 60} width={2400} height={y1 - y0 + 120} fill={`url(#${id}g)`}/></mask></defs>
  <g clipPath={`url(#${id}c)`}><g mask={`url(#${id}m)`}>
   <path d={area} fill="#977E58"/>
   <g clipPath={`url(#${id}a)`} data-part="riffles">{Array.from({length: 34}, (_, i) => {
    const u = r(), v = r(), sp = lerp(.8, 1.2, r()), W = x1 - lip + 200;
    const x = lip - 100 + frac(u + t * drift * sp / W) * W, y = lerp(y0 + 4, y1 - 4, v), l = lerp(24, 60, r());
    return <path key={i} d={`M${x.toFixed(1)} ${y.toFixed(1)}l${(l * .5).toFixed(1)} -5l${(l * .5).toFixed(1)} 5`} stroke={SA.foam} strokeWidth={2 + 2 * v} fill="none" opacity={.55} strokeLinecap="round"/>;})}</g>
   {/* the lip: the stone edge, the white water pouring over it and its spray falling downstream */}
   <path d={smoothPath(edge, false)} stroke={SA.limestoneShade} strokeWidth={7} fill="none"/>
   <path d={smoothPath(edge, false)} transform="translate(-6 0)" stroke={SA.foam} strokeWidth={6} fill="none" opacity={.75 + .15 * Math.sin(t * 8)}/>
   {Array.from({length: 22}, (_, i) => {const ph = frac(r() + t * lerp(1.3, 2.2, r())), [ex, ey] = edge[i % edge.length];
    return <circle key={'s' + i} cx={(ex - 8 - 46 * ph).toFixed(1)} cy={(ey - 6 + 14 * ph * ph).toFixed(1)} r={2.5 + 2.5 * (1 - ph)} fill={SA.foam} opacity={.8 * (1 - ph)}/>;})}
  </g></g>
  {/* broken limestone blocks standing just out of the water along the lip */}
  {layer === 'back' && [[lip + 30, wy - 30, 46], [lip + 120, wy - 26, 34]].map(([x, y, w], i) => <g key={'b' + i}>
   <path d={`M${x - w / 2} ${y + 10}L${x - w / 2 + 6} ${y - 6}L${x + w / 2 - 4} ${y - 8}L${x + w / 2} ${y + 10}Z`} fill={SA.limestone} stroke={SA.limestoneShade} strokeWidth={2}/>
   <path d={`M${x - w / 2 - 8} ${y + 10}q${w / 2 + 8} -6 ${w + 16} 0`} stroke={SA.foam} strokeWidth={4} fill="none" opacity={.8}/></g>)}
 </g>;
};
/** Water piling against a car's upstream end. Origin at the waterline point where the current meets
 * the body (car units, up is negative y); `dir` points upstream (+1 right). A bow of brown water climbs
 * the body and folds back over itself, spray lifts from it, and a lighter eddy trails the far end at
 * `len` downstream. `p` is how hard the current presses. */
export const Pile: React.FC<{p: number; t: number; len: number; h: number; dir?: 1 | -1}> = ({p, t, len, h, dir = 1}) => {
 if (p <= 0) return null;
 const r = rng(91), a = clamp(p);
 return <g data-part="current-pressing" transform={`scale(${dir} 1)`} opacity={clamp(p * 1.6)}>
  <path d={`M-30 4C-12 ${-h * .3 * a} 16 ${-h * .42 * a} 46 ${-h * .3 * a}C70 ${-h * .2 * a} 92 -6 128 6Z`} fill={SA.water} opacity={.95}/>
  <path d={`M-30 4C-12 ${-h * .3 * a} 16 ${-h * .42 * a} 46 ${-h * .3 * a}C70 ${-h * .2 * a} 92 -6 128 6`} stroke={SA.foam} strokeWidth={7} fill="none" strokeLinecap="round" opacity={.85}/>
  {Array.from({length: 18}, (_, i) => {const ph = frac(r() + t * lerp(1.2, 2.1, r())), x = lerp(-10, 70, r());
   return <circle key={i} cx={(x + 50 * ph).toFixed(1)} cy={(-h * .4 * a - 60 * a * Math.sin(Math.PI * ph)).toFixed(1)} r={3 + 3 * r()} fill={SA.foam} opacity={.8 * (1 - ph) * a}/>;})}
  <path d={`M${-2 * len + 20} 2c-30 -10 -60 -8 -90 4`} stroke={SA.foam} strokeWidth={4} fill="none" strokeLinecap="round" opacity={.55 * a}/>
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
  <g data-part="near-sidewalk">
   <defs><linearGradient id={`${id}w`} x1="0" y1={nearCurb + 18} x2="0" y2={nearCurb + 700} gradientUnits="userSpaceOnUse">
    <stop offset="0" stopColor="#B7AE9D"/><stop offset=".25" stopColor={SA.concrete}/><stop offset="1" stopColor="#A89F8E"/></linearGradient></defs>
   <path d={`M-80 ${nearCurb + 18}H1160V2600H-80Z`} fill={`url(#${id}w)`}/>
   <path d={`M-80 ${nearCurb + 18}H1160V${nearCurb + 34}H-80Z`} fill="#6E6656" opacity={.28}/>
   {Array.from({length: 9}, (_, i) => {const x = -40 + i * 150; return <path key={i} d={`M${x} ${nearCurb + 18}L${x + (x - 540) * .9} 2600`} stroke="#8F8676" strokeWidth={2}/>;})}
   <path d={`M-80 ${nearCurb + 190}C300 ${nearCurb + 186} 700 ${nearCurb + 194} 1160 ${nearCurb + 188}`} stroke="#8F8676" strokeWidth={2} fill="none"/>
   <path d="M180 1452c40 -4 90 6 140 0M720 1500c30 4 70 -2 110 3" stroke="#7F7666" strokeWidth={2} fill="none" opacity={.6}/>
  </g>
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
  {/* behind the barrier: live oaks and mesquite on the blackland verge, never in a row */}
  {ks.filter(k => k % 4 === 1).map(k => <g key={'m' + k} transform={`translate(${k * dash + 330} ${barrierY - 30})`}><Mesquite h={120} seed={k}/></g>)}
  {ks.filter(k => k % 4 === 3).map(k => <g key={'o' + k} transform={`translate(${k * dash + 210} ${barrierY - 34})`}><Oak h={200 + 30 * ((k * 7) % 3)} seed={50 + k} flip={k % 8 === 3}/></g>)}
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
  {/* the dark blackland clay showing through the verge grass after rain */}
  {ks.map(k => <path key={'c' + k} d={`M${k * dash + 70} ${shoulderY + 84}c60 -8 150 -6 220 2c-40 14 -150 16 -220 -2Z`} fill={SA.clay} opacity={.55}/>)}
  {/* low bunch grass on the verge, every blade below the shoulder, so nothing of the roadside ever rises
   * in front of the car's wheels; the mesquites stand behind the median barrier instead */}
  {ks.map(k => <g key={'g' + k} data-part="verge-grass">{[0, 1, 2, 3].map(j => {const x = k * dash + 40 + j * 150 + (j % 2) * 37, y = shoulderY + 96 + ((k + j) % 3) * 34;
   return <path key={j} d={`M${x} ${y}l-10 -22M${x + 6} ${y}l2 -28M${x + 12} ${y}l12 -20M${x + 18} ${y}l-4 -16`} stroke={j % 2 ? '#6D7343' : '#7E8450'} strokeWidth={4} strokeLinecap="round"/>;})}</g>)}
 </g>;
};
// ---------------------------------------------------------------- lot --------------------------------
export const LOT = {fenceY: 930, cordY: 430, poles: [60, 1020], sag: 30};
/** The cord's height at x for a mid-span sag: the quadratic the cord is drawn with, exactly. */
export const cordAt = (x: number, sag = LOT.sag) => {const [a, b] = LOT.poles, u = (x - (a + b) / 2) / ((b - a) / 2); return LOT.cordY + sag * (1 - u * u);};
/** Painted stall lines on the lot, in elevation, laid out by the episode under its row of cars: the cars
 * stand side on, so each divider between two stalls runs level, parallel to their bodies (`dividers`, x0 to
 * x1 at row y), while the painted line along the stall ends runs away from the camera through `ends`. */
export type Stalls = {dividers: [number, number, number][]; ends: P[]};
const StallLines: React.FC<Stalls & {width?: number}> = ({dividers, ends, width = 6}) =>
 <g data-part="stall-lines">
  {dividers.map(([x0, x1, y], i) => <path key={i} d={`M${x0.toFixed(1)} ${y.toFixed(1)}L${x1.toFixed(1)} ${(y - 3).toFixed(1)}`} stroke={SA.paint} strokeWidth={width} opacity={.55} strokeLinecap="round"/>)}
  {ends.length > 1 && <path d={smoothPath(ends, false)} stroke={SA.paint} strokeWidth={width * .8} opacity={.45} fill="none" strokeLinecap="round"/>}
 </g>;
/** A fleet lot in elevation, wet after rain: a dry laid limestone wall under a chain link fence, a live oak
 * and a mesquite behind it, two poles with a cord between them for the tag (it sags `sag` at mid-span, and
 * pulls tight when the tag's weight is taken up), stall lines on worn asphalt running away toward the upper
 * right, with an oil stain and a patched seam. */
export const LotBack: React.FC<{sag?: number; stalls?: Stalls}> = ({sag = LOT.sag, stalls}) => {
 const {fenceY, cordY, poles} = LOT, r = rng(33), id = useUid('slb');
 return <g data-part="fleet-lot">
  <g transform={`translate(330 ${fenceY - 40})`}><Oak h={330} seed={36}/></g>
  <g transform={`translate(760 ${fenceY - 34})`}><Mesquite h={230} seed={8}/></g>
  <g data-part="limestone-wall">{Array.from({length: 2}, (_, row) => Array.from({length: 14}, (_, i) => {
   const w = 70 + r() * 40, x = -70 + i * 92 + (row ? 40 : 0) + (r() - .5) * 10, y = fenceY - 40 + row * 20;
   return <rect key={row + '-' + i} x={x} y={y} width={w} height={19} rx={4} fill={(i + row) % 3 ? SA.limestone : '#CEC4AE'} stroke={SA.limestoneShade} strokeWidth={1.5}/>;}))}</g>
  <path d={`M-60 ${fenceY - 190}H1160`} stroke="#8E959A" strokeWidth={4}/>
  <path d={Array.from({length: 60}, (_, i) => `M${-60 + i * 21} ${fenceY - 188}l21 148`).join('')} stroke="#A3AAAE" strokeWidth={1.2} opacity={.6}/>
  {Array.from({length: 8}, (_, i) => <path key={i} d={`M${-20 + i * 160} ${fenceY - 192}v152`} stroke="#7C8388" strokeWidth={5}/>)}
  {poles.map(x => <g key={x}><rect x={x - 6} y={cordY - 40} width={12} height={fenceY - cordY + 40} fill="#6D7479"/><rect x={x - 6} y={cordY - 40} width={4} height={fenceY - cordY + 40} fill="#9AA2A7"/></g>)}
  <path d={`M${poles[0]} ${cordY}Q540 ${(cordY + 2 * sag).toFixed(2)} ${poles[1]} ${cordY}`} stroke="#3B3F46" strokeWidth={3} fill="none"/>
  <defs><linearGradient id={`${id}a`} x1="0" y1={fenceY} x2="0" y2="1940" gradientUnits="userSpaceOnUse">
   <stop offset="0" stopColor="#5E6165"/><stop offset=".45" stopColor="#4C4F53"/><stop offset="1" stopColor="#3B3E42"/></linearGradient></defs>
  <path d={`M-80 ${fenceY}H1160V1940H-80Z`} fill={`url(#${id}a)`}/>
  {stalls && <StallLines {...stalls}/>}
  <path d="M60 1560l220 -10M520 1700l180 6" stroke="#36393C" strokeWidth={4} opacity={.7}/>
  <ellipse cx={700} cy={1520} rx={120} ry={22} fill="#33363A" opacity={.5}/>
 </g>;
};
/** s8's close: a separately staged view at the near end of the same lot row, the eye at door height. The
 * eye line is `horizon`; the far fence and wall stand small on it, the far pole carries the tear-off
 * calendar, and the cord runs from the near pole above the lens (off the frame's top left) down to the far
 * pole, taut once the tag is clipped on. Screen pixels. */
export const LOT_CLOSE = {horizon: 1016, cord: {x0: -60, y0: 300, x1: 1012, y1: 560}, farPole: 1012};
/** The close cord's height at x: a straight run between its ends, lifted by a slight sag `sag`. */
export const cordAtClose = (x: number, sag = 0) => {const {x0, y0, x1, y1} = LOT_CLOSE.cord, u = (x - x0) / (x1 - x0);
 return lerp(y0, y1, u) + 4 * sag * u * (1 - u);};
export const LotClose: React.FC<{sag?: number; stalls?: Stalls}> = ({sag = 0, stalls}) => {
 const {horizon: H, cord, farPole} = LOT_CLOSE, id = useUid('slc'), r = rng(35);
 const mid = (cord.x0 + cord.x1) / 2;
 return <g data-part="fleet-lot-close">
  <defs><linearGradient id={`${id}a`} x1="0" y1={H} x2="0" y2="1940" gradientUnits="userSpaceOnUse">
   <stop offset="0" stopColor="#6A6C6E"/><stop offset=".2" stopColor="#555859"/><stop offset="1" stopColor="#36393C"/></linearGradient></defs>
  {/* the far side of the lot on the eye line: a live oak, the chain link and the limestone wall, small */}
  <g transform={`translate(250 ${H - 46})`}><Oak h={190} seed={36}/></g>
  <g transform={`translate(700 ${H - 40})`}><Mesquite h={120} seed={8}/></g>
  <path d={`M-60 ${H - 92}H1160`} stroke="#8E959A" strokeWidth={3}/>
  <path d={Array.from({length: 80}, (_, i) => `M${-60 + i * 16} ${H - 90}l16 66`).join('')} stroke="#A3AAAE" strokeWidth={1} opacity={.55}/>
  {Array.from({length: 22}, (_, i) => <rect key={i} x={-60 + i * 56 + (i % 3) * 3} y={H - 24 - (i % 2) * 2} width={50} height={12} rx={3} fill={i % 3 ? SA.limestone : '#CEC4AE'} stroke={SA.limestoneShade} strokeWidth={1}/>)}
  <path d={`M-80 ${H - 12}H1160V1940H-80Z`} fill={`url(#${id}a)`}/>
  {stalls && <StallLines {...stalls} width={8}/>}
  <path d={`M-80 ${H + 380}C200 ${H + 372} 600 ${H + 392} 1160 ${H + 384}`} stroke="#3F4245" strokeWidth={5} fill="none" opacity={.8}/>
  {Array.from({length: 8}, () => [lerp(-40, 1100, r()), lerp(H + 420, 1880, r()), lerp(40, 120, r())]).map(([x, y, w], i) =>
   <ellipse key={i} cx={x} cy={y} rx={w} ry={w * .16} fill="#2F3235" opacity={.4}/>)}
  {/* the far pole, and the cord from the near pole above the lens, taut */}
  <rect x={farPole - 7} y={cord.y1 - 50} width={14} height={H - cord.y1 + 40} fill="#6D7479"/>
  <rect x={farPole - 7} y={cord.y1 - 50} width={5} height={H - cord.y1 + 40} fill="#9AA2A7"/>
  <path d={`M${cord.x0} ${cord.y0}Q${mid} ${(lerp(cord.y0, cord.y1, .5) + 2 * sag).toFixed(2)} ${cord.x1} ${cord.y1}`} stroke="#2E3238" strokeWidth={6} fill="none"/>
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
/** The card's type, sized for a phone: each row stacks its label over its value, so a long label can
 * never run into the value beside it, and the value takes the whole width. At the card's on-screen
 * scale of 1 or more, a label is about 11.5 px and a value about 16 px on a 390 px phone. */
export const RECORD_TYPE = {label: 32, value: 44, lead: 54, head: 226, pad: 34, labelY: 42, valueY: 98,
 title: 42, titleY: 64, sub: 30, subY: 108};
/** The two stamp marks' sizes in card units. */
export const STAMP_SIZE = {header: 30, remedy: 32};
/** Which of the record's rows a card shows: the first n, or the listed indices in order. */
export type RowPick = number | number[];
const picked = (pick: RowPick) => typeof pick === 'number' ? RECORD_ROWS.map((_, i) => i).slice(0, pick) : pick;
/** Row geometry for a card `w` wide showing the picked rows: each row's top, its height, its value lines
 * and baselines. The remedy row carries a stamp slot under its words, so its mark lands on the row and
 * never on the sentence. The header's right side carries the software recall slot, under the title's
 * line and right of its subtitle, off every data row. */
export function recordLayout(w = 760, pick: RowPick = RECORD_ROWS.length) {
 const {head, pad, label, value: size, lead, labelY, valueY} = RECORD_TYPE, vx = pad, vw = w - 2 * pad;
 let y = head + 14;
 const rows = picked(pick).map(index => {
  const r = RECORD_ROWS[index], lines = wrap(r.value, size, vw, true), last = y + valueY + (lines.length - 1) * lead;
  // the slot sits far enough under the words that the raised stamp and the hand on its knob clear them
  const slot = index === REMEDY_ROW ? {y: last + 112, h: 100} : undefined;
  const h = slot ? slot.y - y + slot.h / 2 + 12 : valueY + (lines.length - 1) * lead + 26;
  const row = {...r, index, y, h, lines, vx, labelY: y + labelY, baselines: lines.map((_, k) => y + valueY + k * lead), last, slot};
  y += h; return row;
 });
 const hw = imprintSize('Software recall', STAMP_SIZE.header).w;
 const header = {x: w - 24 - hw / 2, y: head - 50};
 return {w, h: y + 26, head, vx, vw, size, label, lead, rows, header};
}
const remedyOf = (w: number, pick: RowPick) => {
 const rem = recordLayout(w, pick).rows.find(r => r.index === REMEDY_ROW);
 if (!rem) throw new Error('This record card does not show the remedy row');
 return rem;
};
/** Where the stamp marks land in card units: the header slot, and the remedy row's slot under its words. */
export function stampSlots(w = 760, pick: RowPick = REMEDY_ROW + 1) {
 const rem = remedyOf(w, pick), uw = imprintSize('Under development', STAMP_SIZE.remedy).w;
 return {header: recordLayout(w, pick).header, remedy: {x: rem.vx + uw / 2 + 6, y: rem.slot!.y}};
}
/** Where a pen tip rests at the end of the remedy sentence, in card units: just past its last word, at
 * the middle of that line's letters. */
export function remedyPenTip(w = 760, pick: RowPick = REMEDY_ROW + 1) {
 const rem = remedyOf(w, pick);
 return {x: rem.vx + widthOf(rem.lines[rem.lines.length - 1], RECORD_TYPE.value, true) + 16, y: rem.last - 14};
}
/** A stamp mark in card units. `solid` stamps carry an inked plate tone inside the border, so the mark
 * reads as one block over the printed row rather than as a second line of type tangled in it. */
export type Imprint = {text: string; p: number; x: number; y: number; rot: number; size?: number; solid?: boolean};
/** An imprint's width and height in card units, shared with the stamp that makes it. */
export const imprintSize = (text: string, size = 34) => ({w: widthOf(text, size, true) + size * 1.2, h: size * 1.9});
const ImprintMark: React.FC<Imprint & {id: string}> = ({text, p, x, y, rot, size = 34, id, solid}) => {
 if (p <= 0) return null;
 const {w, h} = imprintSize(text, size), r = rng(text.length * 13);
 return <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={clamp(p)} data-part="stamp-imprint">
  <defs><mask id={`${id}m`} maskUnits="userSpaceOnUse" x={-w} y={-h} width={2 * w} height={2 * h}>
   <rect x={-w} y={-h} width={2 * w} height={2 * h} fill="#FFFFFF"/>
   {Array.from({length: 46}, (_, i) => <circle key={i} cx={(r() - .5) * w} cy={(r() - .5) * h} r={1 + r() * 3} fill="#000000"/>)}
  </mask></defs>
  <g mask={`url(#${id}m)`}>
   {solid && <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={8} fill="#F7E2B8" opacity={.9}/>}
   <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={8} fill="none" stroke={SA.amberInk} strokeWidth={5}/>
   <rect x={-w / 2 + 8} y={-h / 2 + 8} width={w - 16} height={h - 16} rx={4} fill="none" stroke={SA.amberInk} strokeWidth={2}/>
   <text x={0} y={size * .36} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={size} fill={SA.amberInk} letterSpacing={1}>{text}</text>
  </g>
 </g>;
};
/** The record card showing the picked rows; `rows` writes them in, 0 to 1. Rows not picked are not on the
 * card at all, so a fact is never on screen before its clause. */
export const RecordCard: React.FC<{w?: number; rows: number; pick?: RowPick; remedyLit?: number; underline?: number; imprints?: Imprint[]}> =
 ({w = 760, rows, pick = RECORD_ROWS.length, remedyLit = 0, underline = 0, imprints = []}) => {
 const id = useUid('sar'), L = recordLayout(w, pick), n = L.rows.length, T = RECORD_TYPE;
 return <g data-part="recall-record">
  <rect x={10} y={14} width={w} height={L.h} rx={10} fill="#1A1814" opacity={.22}/>
  <path d={`M0 10Q0 0 10 0H${w - 30}L${w} 30V${L.h - 10}Q${w} ${L.h} ${w - 10} ${L.h}H10Q0 ${L.h} 0 ${L.h - 10}Z`} fill={SA.paper} stroke={SA.paperEdge} strokeWidth={2}/>
  <path d={`M${w - 30} 0L${w} 30H${w - 30}Z`} fill="#DDD3BE"/>
  <rect x={26} y={24} width={14} height={92} fill={SA.ink}/>
  <text x={56} y={T.titleY} fontFamily={FONT.body} fontWeight={800} fontSize={T.title} fill={SA.ink}>Federal recall record</text>
  <text x={57} y={T.subY} fontFamily={FONT.mono} fontWeight={500} fontSize={T.sub} fill="#5A626B">Vehicle safety recall</text>
  <path d={`M26 ${L.head}H${w - 26}`} stroke={SA.ink} strokeWidth={2.5}/>
  {L.rows.map((row, i) => {
   const remedy = row.index === REMEDY_ROW, shown = clamp(rows * n - i), lit = remedy ? clamp(remedyLit) : 0;
   return <g key={row.index} data-part={remedy ? 'remedy-row' : 'record-row'}>
    {lit > 0 && <rect x={18} y={row.y + 4} width={w - 36} height={row.h - 8} rx={8} fill="#FFE2B6" opacity={.85 * lit}/>}
    {lit > 0 && <rect x={18} y={row.y + 4} width={7} height={row.h - 8} rx={3} fill={SA.ink} opacity={lit}/>}
    <defs><clipPath id={`${id}r${i}`}><rect x={0} y={row.y} width={w * ease(shown)} height={row.h}/></clipPath></defs>
    <g clipPath={`url(#${id}r${i})`}>
     <text x={row.vx} y={row.labelY} fontFamily={FONT.mono} fontWeight={600} fontSize={L.label} fill="#4F5862">{row.label}</text>
     {row.lines.map((l, k) => <text key={k} x={row.vx} y={row.baselines[k]} fontFamily={FONT.body} fontWeight={remedy ? 800 : 700} fontSize={L.size} fill={SA.ink}>{l}</text>)}
    </g>
    {shown < 1 && shown > 0 && <rect x={w * ease(shown) - 3} y={row.y + 12} width={4} height={row.h - 22} fill={SA.ink} opacity={.7}/>}
    {i + 1 < n && <path d={`M26 ${row.y + row.h}H${w - 26}`} stroke="#D9CFBA" strokeWidth={1.5}/>}
    {remedy && underline > 0 && <path d={`M${row.vx} ${row.last + 14}h${(w - row.vx - 40) * clamp(underline)}`} stroke={SA.ink} strokeWidth={6} strokeLinecap="round"/>}
   </g>;
  })}
  {imprints.map((im, i) => <ImprintMark key={i} {...im} id={`${id}i${i}`}/>)}
 </g>;
};
/** A wooden office rubber stamp seen from above and a little in front, as the card is: its footprint is
 * the mark it leaves (`w` by `h`, centred at (0,0)), its block's top face and front edge, and a turned
 * neck and knob rising from the middle. `lift` raises it off the paper toward the camera: the stamp
 * grows a little and rides up, and its shadow drops away down and to the right of the light. */
export const Stamp: React.FC<{w: number; h: number; lift?: number}> = ({w, h, lift = 0}) => {
 const L = clamp(lift), up = 24 * L, k = 1 + .07 * L, face = Math.max(10, h * .26), kr = Math.min(h * .62, 46);
 return <g data-part="rubber-stamp">
  <g data-part="stamp-shadow" transform={`translate(${(5 + 26 * L).toFixed(2)} ${(7 + 30 * L).toFixed(2)})`}>
   <rect x={-w / 2 - 6} y={-h / 2 - 4} width={w + 12} height={h + 10} rx={10} fill="#1A1814" opacity={.16 + .06 * (1 - L)}/>
   <rect x={-w / 2} y={-h / 2} width={w} height={h + 2} rx={8} fill="#1A1814" opacity={.18 * (1 - .6 * L)}/>
  </g>
  <g transform={`translate(0 ${(-up).toFixed(2)}) scale(${k.toFixed(4)})`}>
   {/* the rubber's inked edge, only a hairline from this angle */}
   <rect x={-w / 2 + 2} y={h / 2 - 3} width={w - 4} height={5} rx={2} fill={SA.amberInk} opacity={.85}/>
   {/* the block's front edge in shade, then its top face lit from the upper left */}
   <rect x={-w / 2} y={h / 2 - face - 2} width={w} height={face} rx={5} fill={SA.woodDark}/>
   <rect x={-w / 2} y={-h / 2 - 4} width={w} height={h - face + 4} rx={7} fill={SA.wood} stroke={SA.woodDark} strokeWidth={2}/>
   {[.22, .5, .76].map((f, i) => <path key={i} d={`M${-w / 2 + 14} ${-h / 2 + (h - face) * f}c${w * .3} ${-3 + i} ${w * .6} ${3 - i} ${w - 28} ${i - 1}`} stroke="#B58C62" strokeWidth={2} fill="none" opacity={.55}/>)}
   <path d={`M${-w / 2 + 10} ${-h / 2}h${w * .55}`} stroke="#D2AE84" strokeWidth={3} opacity={.7}/>
   {/* the neck and knob */}
   <ellipse cx={4} cy={-h * .08 + 6} rx={kr * .7} ry={kr * .32} fill="#1A1814" opacity={.25}/>
   <path d={`M${-kr * .42} ${-h * .08}L${-kr * .3} ${-h * .08 - kr * .5}H${kr * .3}L${kr * .42} ${-h * .08}Z`} fill="#6E4F33"/>
   <ellipse cx={0} cy={-h * .08 - kr * .55} rx={kr} ry={kr * .7} fill="#8E6845" stroke={SA.woodDark} strokeWidth={2}/>
   <ellipse cx={-kr * .3} cy={-h * .08 - kr * .75} rx={kr * .42} ry={kr * .22} fill="#B38962" opacity={.8}/>
  </g>
 </g>;
};
/** How far above the footprint's centre the knob sits, at a lift, for a stamp of footprint height `h`:
 * where the hand closes. */
export const stampKnob = (h: number, lift = 0) => -24 * clamp(lift) - (1 + .07 * clamp(lift)) * (h * .08 + Math.min(h * .62, 46) * .55);
/** A ballpoint pen with its tip at (0,0), its body running along angle `rot` (degrees; -38 lies up and
 * to the right). */
export const Pen: React.FC<{rot?: number}> = ({rot = -38}) => <g data-part="pen" transform={`rotate(${rot})`}>
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
/** The highlight band around a marked word, in ems of the line's size from its baseline: the amber box
 * from `top` to `bottom`, the underline from `ulTop` to `ulBottom`, and the box's side margin. */
export const MARK_BAND = {top: -.95, bottom: .3, ulTop: .16, ulBottom: .3, side: 8};
/** One line of type with one word marked. The mark is NOT placed from an estimated width: the line is set
 * twice, as two identical runs (same x, y, face, size, the same words and per-word weights), so the
 * browser lays both out the same way. In the second run only the marked word is painted; an SVG
 * morphology filter dilates that word's own glyphs and a clip keeps the dilation to the line's band, so
 * the amber box and the underline sit exactly on the word as it is actually laid out, at any size, scale
 * or font. `lit` fades both in. */
export const MarkedLine: React.FC<{text: string; mark: string; x: number; y: number; size: number; lit: number; ink: string}> =
 ({text, mark, x, y, size, lit, ink}) => {
 const id = useUid('sml'), words = text.split(' '), W = 4000, B = MARK_BAND;
 const run = (paint: 'line' | 'mark') => <text x={x} y={y} fontFamily={FONT.body} fontWeight={700} fontSize={size}
  fill={paint === 'line' ? ink : 'none'} data-run={paint}>{words.map((word, i) => <tspan key={i} fontWeight={word === mark ? 800 : 700}
  fill={paint === 'line' ? undefined : word === mark ? '#000000' : 'none'}>{(i ? ' ' : '') + word}</tspan>)}</text>;
 const band = (key: string, top: number, bottom: number, side: number, color: string, opacity: number) => <g key={key} opacity={opacity}>
  <defs>
   <filter id={`${id}${key}f`} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" x={x - 400} y={y - size * 2.5} width={W} height={size * 4}
    colorInterpolationFilters="sRGB">
    <feMorphology in="SourceAlpha" operator="dilate" radius={`${side} ${(size * 1.3).toFixed(2)}`} result="d"/>
    <feFlood floodColor={color} result="c"/><feComposite in="c" in2="d" operator="in"/>
   </filter>
   <clipPath id={`${id}${key}c`}><rect x={x - 400} y={y + top * size} width={W} height={(bottom - top) * size}/></clipPath>
  </defs>
  <g clipPath={`url(#${id}${key}c)`}><g filter={`url(#${id}${key}f)`}>{run('mark')}</g></g>
 </g>;
 const has = words.includes(mark);
 return <g data-part="marked-line">
  {has && lit > 0 && <g data-part="may-highlight">{band('box', B.top, B.bottom, B.side, SA.amber, clamp(lit))}</g>}
  {run('line')}
  {has && lit > 0 && <g data-part="may-underline">{band('ul', B.ulTop, B.ulBottom, 0, SA.amberInk, clamp(lit * 1.4))}</g>}
 </g>;
};
export const QuoteCard: React.FC<{w: number; lit: number; size?: number}> = ({w, lit, size = 36}) => {
 const pad = 34, lines = wrap(QUOTE_TEXT, size, w - 2 * pad, true), lead = size * 1.3, h = lines.length * lead + pad * 2 + 46;
 return <g data-part="recall-sentence">
  <rect x={8} y={10} width={w} height={h} rx={12} fill="#1A1814" opacity={.22}/>
  <rect x={0} y={0} width={w} height={h} rx={12} fill={SA.paper} stroke={SA.paperEdge} strokeWidth={2}/>
  <text x={pad} y={pad + 18} fontFamily={FONT.mono} fontWeight={600} fontSize={20} fill="#5A626B">Federal recall record</text>
  {/* each line is ONE run of type, so the font's own spacing sets every word gap, and the word may is
    * marked from that same run's layout, never from an estimate */}
  {lines.map((line, k) => <MarkedLine key={k} text={line} mark="may" x={pad} y={pad + 46 + (k + 1) * lead - size * .3} size={size} lit={lit} ink={SA.ink}/>)}
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
export function remedyLayout(w = REMEDY_W, size = 50) {
 const lines = wrap(RECORD_ROWS[REMEDY_ROW].value, size, w - 80, true), lead = size * 1.22, top = 254;
 // the bottom band under the sentence holds the under development mark clear of the words
 return {w, size, lead, lines, top, h: top + (lines.length - 1) * lead + 132};
}
/** The remedy card's width and type: at its on-screen scale of about 0.84 its label reads at about 11.5 px
 * and its sentence at about 15.5 px on a 390 px phone. */
export const REMEDY_W = 860, REMEDY_TYPE = {title: 42, sub: 36, label: 38};
export const RemedyCard: React.FC<{w?: number; lit?: number; underline?: number; imprint?: number}> = ({w = REMEDY_W, lit = 0, underline = 0, imprint = 0}) => {
 const id = useUid('srm'), R = remedyLayout(w), last = R.top + (R.lines.length - 1) * R.lead, T = REMEDY_TYPE;
 return <g data-part="remedy-card">
  <rect x={10} y={14} width={w} height={R.h} rx={10} fill="#1A1814" opacity={.24}/>
  <path d={`M0 10Q0 0 10 0H${w - 30}L${w} 30V${R.h - 10}Q${w} ${R.h} ${w - 10} ${R.h}H10Q0 ${R.h} 0 ${R.h - 10}Z`} fill={SA.paper} stroke={SA.paperEdge} strokeWidth={2}/>
  <rect x={26} y={24} width={14} height={96} fill={SA.ink}/>
  <text x={56} y={64} fontFamily={FONT.body} fontWeight={800} fontSize={T.title} fill={SA.ink}>Federal recall record</text>
  <text x={57} y={112} fontFamily={FONT.mono} fontWeight={500} fontSize={T.sub} fill="#5A626B">Vehicle safety recall</text>
  <path d={`M26 132H${w - 26}`} stroke={SA.ink} strokeWidth={2.5}/>
  {lit > 0 && <rect x={18} y={144} width={w - 36} height={R.h - 160} rx={8} fill="#FFE2B6" opacity={.85 * clamp(lit)}/>}
  {lit > 0 && <rect x={18} y={144} width={7} height={R.h - 160} rx={3} fill={SA.ink} opacity={clamp(lit)} data-part="remedy-row"/>}
  <text x={40} y={190} fontFamily={FONT.mono} fontWeight={700} fontSize={T.label} fill="#4F5862" data-part="remedy-row">Remedy</text>
  {R.lines.map((l, k) => <text key={k} x={40} y={R.top + k * R.lead} fontFamily={FONT.body} fontWeight={800} fontSize={R.size} fill={SA.ink}>{l}</text>)}
  {underline > 0 && <path d={`M40 ${last + 16}h${(w - 120) * clamp(underline)}`} stroke={SA.ink} strokeWidth={7} strokeLinecap="round"/>}
  <ImprintMark text="Under development" p={imprint} x={w - 240} y={R.h - 64} rot={-4} size={32} id={`${id}i`}/>
 </g>;
};
/** A working hand and forearm holding a stamp knob or a pen at (0,0), the arm running off toward `dir`
 * (a unit direction) to a shoulder outside the frame. A real arm: the fist closes round the knob with
 * its knuckles and thumb, the wrist is the narrowest part, the forearm swells toward a rolled shirt cuff
 * and the sleeve carries folds. Shaded as a cylinder lit from the upper left whatever way it points.
 * Skin is a fill value; the line work is the same for any hand. */
export const Arm: React.FC<{dir: P; grip: 'knob' | 'pen'; skin?: string; shirt?: string; scale?: number; shadow?: number}> =
 ({dir, grip, skin = '#A8744F', shirt = '#5B6E80', scale = 1, shadow = 1}) => {
 const id = useUid('sarm'), ang = Math.atan2(dir[1], dir[0]), deg = (ang * 180 / Math.PI).toFixed(2);
 // the local +y side faces the upper-left key when it points up-left in the frame
 const plusLit = -Math.sin(ang) * -.7 + Math.cos(ang) * -.7 > 0;
 const shade = (light: string, dark: string, key: string) => <linearGradient id={`${id}${key}`} x1="0" y1={plusLit ? 60 : -60} x2="0" y2={plusLit ? -60 : 60} gradientUnits="userSpaceOnUse">
  <stop offset="0" stopColor={light}/><stop offset=".5" stopColor={light}/><stop offset="1" stopColor={dark}/></linearGradient>;
 const skinDark = '#6A4630', skinLit = '#C9946B';
 // a forearm, not a tube: narrow at the wrist, swelling over the muscle toward the elbow, then the
 // rolled cuff and a sleeve that keeps its folds out of the frame
 const forearm = 'M44 -21C80 -23 120 -30 170 -38C215 -45 255 -46 296 -44L296 46C255 48 215 46 170 39C120 31 80 24 44 22Z';
 const sleeve = 'M326 -54C520 -58 900 -64 1500 -68L1500 68C900 64 520 60 326 56Z';
 // the hand closing over the knob from above: the back of the hand from the wrist to the knuckles,
 // four fingers curled down round the far side of the knob, the thumb hooked under the near side
 const knobHand = 'M50 -26C34 -36 6 -40 -16 -36C-34 -32 -46 -20 -48 -4C-50 14 -40 28 -22 34C0 40 30 36 50 26Z';
 const silhouette = <g>
  <path d={sleeve}/><path d="M290 -52L346 -56L346 58L290 52Z"/><path d={forearm}/>
  {grip === 'knob' ? <path d={knobHand}/> : <path d="M50 -24C26 -34 2 -30 -12 -16L-22 2C-18 14 -6 18 8 14C24 28 44 26 50 22Z"/>}
 </g>;
 return <g data-part="arm">
  {/* the arm is above the paper, so its shadow falls down and to the right of the light */}
  {shadow > 0 && <g transform={`translate(${(16 * scale).toFixed(1)} ${(20 * scale).toFixed(1)}) rotate(${deg}) scale(${scale})`} fill="#1A1814" opacity={.2 * shadow} data-part="arm-shadow">{silhouette}</g>}
  <g transform={`rotate(${deg}) scale(${scale})`}>
  <defs>{shade(skinLit, '#7C5134', 's')}{shade('#7A8DA0', '#3C4B5B', 'c')}</defs>
  {/* sleeve to the shoulder, with folds */}
  <path d={sleeve} fill={`url(#${id}c)`}/>
  {[440, 590, 790].map((x, k) => <path key={x} d={`M${x} ${-50 - k * 2}c18 26 14 70 -6 ${100 + k * 4}`} stroke="#33414F" strokeWidth={3} fill="none" opacity={.5}/>)}
  {/* the rolled cuff */}
  <path d="M290 -52C306 -56 332 -58 346 -56L346 58C332 60 306 56 290 52Z" fill={shirt} stroke="#33414F" strokeWidth={2.5}/>
  <path d="M306 -54L308 54" stroke="#8A9CAE" strokeWidth={3} opacity={.7}/>
  {/* forearm, with the long line of the ulna and the tendon toward the wrist */}
  <path d={forearm} fill={`url(#${id}s)`} stroke={skinDark} strokeWidth={2}/>
  <path d="M70 -14C130 -20 200 -28 280 -32" stroke={skinDark} strokeWidth={1.5} opacity={.3} fill="none"/>
  <path d="M60 10C110 14 150 16 190 20" stroke={skinLit} strokeWidth={3} opacity={.35} fill="none"/>
  {grip === 'knob' ? <g data-part="hand-on-knob">
   <path d={knobHand} fill={`url(#${id}s)`} stroke={skinDark} strokeWidth={2.5}/>
   {/* the knuckles across the back of the hand, then each curled finger's joint over the knob's rim */}
   {[-24, -10, 4, 18].map((y, k) => <ellipse key={'k' + y} cx={-14 - (k % 2) * 3} cy={y + 2} rx={7} ry={5.5} fill={skinLit} opacity={.55}/>)}
   {[-24, -10, 4, 18].map(y => <path key={y} d={`M-36 ${y - 3}C-48 ${y} -50 ${y + 8} -40 ${y + 11}`} stroke={skinDark} strokeWidth={2.5} fill="none"/>)}
   {/* the thumb hooked under the near side */}
   <path d="M38 26C26 40 4 44 -12 38C-4 34 10 30 20 22Z" fill={`url(#${id}s)`} stroke={skinDark} strokeWidth={2.2}/>
   <path d="M44 -20C30 -12 22 2 26 16" stroke={skinDark} strokeWidth={1.5} opacity={.4} fill="none"/>
  </g> : <g data-part="hand-on-pen">
   {/* fingers pinching the barrel: thumb over, index along it, the rest curled under */}
   <path d="M50 -24C26 -34 2 -30 -12 -16L-22 2C-18 14 -6 18 8 14C24 28 44 26 50 22Z" fill={`url(#${id}s)`} stroke={skinDark} strokeWidth={2.5}/>
   <path d="M-12 -16C-26 -12 -32 -2 -26 8" stroke={skinDark} strokeWidth={2.5} fill="none"/>
   <path d="M2 10C10 16 22 18 32 14" stroke={skinDark} strokeWidth={2} fill="none" opacity={.7}/>
  </g>}
  </g>
 </g>;
};

// ---------------------------------------------------------------- plans from above ------------------
/** Salado Creek straight down. The channel runs ACROSS the frame and its current runs LEFT, the same way
 * as the elevation shots, so a cut between them keeps the flow. Meandering banks, smooth limestone shelves
 * along both banks, mottled ground with oaks, light rain rings on the water. No crossing. `creek` is the
 * channel's mean far (top) and near (bottom) bank rows; the far bank's pale landmark ledge slab spans plan x
 * `ledge`, and the landmark oak's crown stands at plan x 520. The car's own path, its stand at the near bank's
 * edge in shallow flood water and its carry downstream, belong to the episode (S3_PLAN_PATH, s3PlanPose); this
 * drawing holds only the creek, which never moves. Every shape here is a filled ellipse or one smooth curve:
 * no tooth, chevron, dash, tick, zigzag or wobbling stroke. */
export const CREEK_PLAN = {creek: [620, 1140] as P, ledge: [297, 408] as P};
/** The current's own speed on the plan, plan pixels a second, faster than the carried car's peak (500), so the
 * water visibly passes it (peak 540). */
export const CREEK_PLAN_FLOW = 700;
export const CreekPlan: React.FC<{t: number; rain: number; flow: number}> = ({t, rain}) => {
 const id = useUid('scp'), {creek} = CREEK_PLAN, r = rng(15);
 // each bank meanders on its own: two slow waves and a short one, so the channel narrows and widens
 const bank = (y: number, ph: number, k: number): P[] => Array.from({length: 14}, (_, i) => {const x = -180 + i * 110;
  return [x, y + 40 * Math.sin(x * .0052 + ph) + 16 * Math.sin(x * .016 + 2 * ph) + 6 * Math.sin(x * .047 + k)];});
 const T = bank(creek[0], .4, 1), B = bank(creek[1], 1.7, 2);
 const shelf = (b: P[], sgn: number, w: number): P[] => b.map(([x, y], i) => [x, y + sgn * (w + 24 * Math.sin(x * .019 + i))] as P);
 const water = smoothPath([...T, ...B.slice().reverse()]);
 // the banks' edges as the sampled banks trace them, for the current between them and the landmark ledge slab
 const farEdge = (x: number) => creek[0] + 40 * Math.sin(x * .0052 + .4) + 16 * Math.sin(x * .016 + .8) + 6 * Math.sin(x * .047 + 1);
 const nearEdge = (x: number) => creek[1] + 40 * Math.sin(x * .0052 + 1.7) + 16 * Math.sin(x * .016 + 3.4) + 6 * Math.sin(x * .047 + 2);
 const [la, lb] = CREEK_PLAN.ledge, lxs = [la, la + 21, la + 45, la + 69, la + 91, lb];
 const ledgeWater: P[] = lxs.map((x, i) => [x, farEdge(x) + 34 + [6, 14, 9, 17, 8, 4][i]] as P);
 const ledgeBank: P[] = lxs.slice().reverse().map((x, i) => [x + (i % 2 ? 4 : -3), farEdge(x) - 26 - (i % 3) * 5] as P);
 const ledgeSlab: P[] = [[la - 7, farEdge(la - 7) + 6], ...ledgeWater, [lb + 6, farEdge(lb + 6) + 4], ...ledgeBank];
 const stone = smoothPath([...shelf(T, -1, 92), ...shelf(B, 1, 100).reverse()]);
 return <g data-part="creek-plan">
  <defs><clipPath id={`${id}c`}><path d={water}/></clipPath>
   <linearGradient id={`${id}w`} x1="0" y1={creek[0] - 60} x2="0" y2={creek[1] + 60} gradientUnits="userSpaceOnUse">
    <stop offset="0" stopColor={SA.waterDeep}/><stop offset=".22" stopColor={SA.water}/><stop offset=".55" stopColor="#866D4B"/>
    <stop offset=".85" stopColor={SA.water}/><stop offset="1" stopColor={SA.waterDeep}/></linearGradient></defs>
  {/* the ground either side: grass mottled with bare caliche, leaf litter and a worn path, not a flat field */}
  <rect x={-40} y={-40} width={1160} height={2000} fill={SA.grass}/>
  {Array.from({length: 26}, () => [r() * 1080, r() * 1920, lerp(50, 140, r()), r()]).map(([x, y, rr, k], i) =>
   <ellipse key={'m' + i} cx={x} cy={y} rx={rr} ry={rr * lerp(.5, .9, k)} fill={k < .4 ? '#7D8049' : k < .75 ? '#A3A26B' : '#B9AE8E'} opacity={.55}/>)}
  <path d={smoothPath([[-40, 1440], [60, 1372], [150, 1414], [236, 1346], [312, 1318], [384, 1262]], false) + 'M700 420C760 380 900 360 1120 372'} stroke="#BBAF90" strokeWidth={26} fill="none" strokeLinecap="round" opacity={.7}/>
  {/* smooth limestone shelves along both banks */}
  <path d={stone} fill={SA.limestone} stroke={SA.limestoneShade} strokeWidth={3}/>
  {/* the brown channel, deeper at its banks */}
  <path d={water} fill={`url(#${id}w)`}/>
  {/* the current: five long, thick stripes between the banks, each at its own share of the channel's width,
    * following only the banks' slow meander, running left faster than the carried car so they overtake it */}
  <g clipPath={`url(#${id}c)`} data-part="current-streamlines">{[.30, .42, .55, .68, .80].map((u, i) => {const L = [900, 700, 820, 640, 760][i], W = 2600;
   const x0 = frac(i * .37 - t * CREEK_PLAN_FLOW / W) * W - 1000;
   const pts: P[] = Array.from({length: 13}, (_, j) => {const x = x0 + L * j / 12;
    return [x, lerp(creek[0] + 40 * Math.sin(x * .0052 + .4), creek[1] + 40 * Math.sin(x * .0052 + 1.7), u)] as P;});
   return <path key={i} d={smoothPath(pts, false)} stroke="#E3D8C2" strokeWidth={13} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={.5}/>;})}</g>
  {[T, B].map((b, i) => <path key={'e' + i} d={smoothPath(b, false)} stroke={SA.foam} strokeWidth={5} fill="none" opacity={.55 + .15 * Math.sin(t * 5 + i)}/>)}
  {/* the far bank's pale landmark ledge slab, jutting into the channel: hand cut, undercut dark on its water side,
    * and soft foam piling against its upstream (right) end */}
  <g data-part="ledge-slab-plan">
   <path d={smoothPath(ledgeWater.map(([x, y]) => [x, y + 9] as P), false)} stroke="#3E2F20" strokeWidth={12} fill="none" opacity={.55} strokeLinecap="round"/>
   <path d={smoothPath(ledgeSlab, true)} fill={SA.limestone} stroke={SA.limestoneShade} strokeWidth={3}/>
   {[0, 1, 2, 3].map(k => {const ph = Math.sin(t * 1.6 + k * 1.4), y = farEdge(lb) + 14 + 13 * k;
    return <ellipse key={'lf' + k} cx={(lb + 16 + 6 * k + 3 * ph).toFixed(1)} cy={y.toFixed(1)} rx={(20 - 2 * k + 3 * ph).toFixed(1)} ry={(11 - k + 2 * ph).toFixed(1)} fill={SA.foam} opacity={.75}/>;})}
  </g>
  {[[180, 330, 120], [880, 260, 150], [520, 380, 90], [150, 1460, 140], [930, 1420, 120], [600, 1540, 100]].map(([x, y, rr], i) => <g key={i}>
   <ellipse cx={x + 22} cy={y + 18} rx={rr} ry={rr * .85} fill="#000000" opacity={.18}/>
   <ellipse cx={x} cy={y} rx={rr} ry={rr * .85} fill={SA.oakDark}/><ellipse cx={x - rr * .2} cy={y - rr * .18} rx={rr * .7} ry={rr * .55} fill={SA.oak}/>
   <ellipse cx={x - rr * .4} cy={y - rr * .35} rx={rr * .3} ry={rr * .2} fill={SA.oakLit}/></g>)}
  {/* heavy rain rings: a few large faint rings away from the car's path, each fading in already wide, so none
    * ever shows as a dot and they never out-read the current */}
  {rain > 0 && <g clipPath={`url(#${id}c)`} data-part="rain-rings">{[[180, 700], [330, 1060], [900, 700], [1000, 1000], [90, 900], [620, 690]].map(([x, y], i) => {const ph = frac(i * .17 + t * 1.3);
   return <circle key={i} cx={x} cy={y} r={(30 + 50 * ph).toFixed(1)} fill="none" stroke="#EEE7D8" strokeWidth={2} opacity={(rain * .28 * Math.sin(Math.PI * ph)).toFixed(3)}/>;})}</g>}
 </g>;
};
/** The plan's water front: water spreads from the left along the street, its leading edge a lobed
 * tongue (ahead along both gutters) and its sides lapping a little onto the verges. */
export function floodFootPlan(front: number, y0: number, y1: number, t: number): string {
 const edge: P[] = Array.from({length: 9}, (_, i) => {const v = i / 8;
  return [front - 30 + 90 * Math.pow(Math.abs(2 * v - 1), 3) + 22 * Math.sin(v * 8.3 + .8 * t) + 10 * Math.sin(v * 21 + 1.7 * t), lerp(y0, y1, v)];});
 const side = (y: number, s: number) => Array.from({length: 7}, (_, i) => {const x = lerp(20, edge[s ? 8 : 0][0] - 40, i / 6);
  return [x, y + (s ? 1 : -1) * (6 + 6 * Math.sin(x * .02 + s * 2))] as P;});
 return smoothPath([...side(y0, 0), ...edge, ...side(y1, 1).reverse()], false).replace(/^M/, `M20 ${y1}L`) + 'Z';
}
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
  <g data-part="water-plan">{front > 20 && <path d={floodFootPlan(front, y0 - 20 - 30 * calm, y1 + 20 + 30 * calm, t)} fill={SA.water} opacity={.88}/>}
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
/** The fleet lot from above: ONE row of four stalls, the same four cars the elevation shows, filling the
 * lot's width. `cordY` is where the tag's cord crosses the lot. B's overhead stands in this lot. */
export const LOT_PLAN = {row: 900, cars: 4, stall: 255, x0: 30, scale: .95, cordY: 380};
/** B's s8 close, a separately staged view straight down from just over the nearest roof: three of the same
 * stalls at a larger scale, the nearest roof's pod under the lens, the cord crossing near the lens at
 * `cordY` with the tag clipped at `tagX` and the vehicle map card at `mapX`, the calendar lying at the lot's
 * edge. Screen pixels. */
export const LOT_PLAN_CLOSE = {row: 1030, cars: 4, stall: 290, x0: 155, scale: 1.15, cordY: 330, tagX: 330, mapX: 752, mapW: 210,
 calendar: [985, 470] as P, calendarW: 150};
export type LotPlanLayout = {row: number; cars: number; stall: number; x0: number; cordY: number};
export const LotPlan: React.FC<{lay?: LotPlanLayout; close?: boolean}> = ({lay = LOT_PLAN, close = false}) => {
 const {row, cars, stall, x0, cordY} = lay, half = close ? 360 : 280;
 return <g data-part={close ? 'lot-plan-close' : 'lot-plan'}>
  <rect x={close ? -60 : 30} y={close ? 160 : 220} width={close ? 1200 : 1020} height={close ? 1760 : 1200} rx={close ? 0 : 12} fill="#56595D"/>
  {/* the same dry laid limestone wall under the chain link that the elevation shows, seen from above */}
  {!close && <g data-part="limestone-wall-plan">{Array.from({length: 13}, (_, i) => <rect key={i} x={34 + i * 78 + (i % 3) * 3} y={226} width={72 + (i % 2) * 4} height={18} rx={3}
   fill={i % 3 ? SA.limestone : '#CEC4AE'} stroke={SA.limestoneShade} strokeWidth={1.5}/>)}</g>}
  {!close && <path d="M30 248H1050" stroke="#8E959A" strokeWidth={4} strokeDasharray="10 6"/>}
  {Array.from({length: cars + 1}, (_, i) => <path key={i} d={`M${x0 + i * stall + (i % 2) * 3} ${row - half}v${2 * half}`} stroke={SA.paint} strokeWidth={close ? 9 : 6} opacity={.6}/>)}
  <path d={`M${x0} ${row + half}H${x0 + cars * stall}`} stroke={SA.paint} strokeWidth={5} opacity={.4}/>
  {/* oil stains, puddles left by the rain and a patched seam: the same worn wet asphalt as the elevation */}
  {[[x0 + stall * .6, row + 60], [x0 + stall * 2.4, row - 40], [x0 + stall * 3.5, row + 90]].map(([x, y], i) => <ellipse key={'o' + i} cx={x} cy={y} rx={46} ry={28} fill="#3E4145" opacity={.45}/>)}
  {[[x0 + stall * 1.1, row + half + 70, 110], [x0 + stall * 3.1, row - half - 60, 80]].map(([x, y, w], i) => <ellipse key={'p' + i} cx={x} cy={y} rx={w} ry={w * .45} fill="#7E878C" opacity={.35}/>)}
  <path d={`M-40 ${row + half + 140}C300 ${row + half + 134} 700 ${row + half + 148} 1120 ${row + half + 140}`} stroke="#45484C" strokeWidth={4} fill="none" opacity={.7}/>
  {/* a live oak's crown over the lot's corner, seen from above */}
  {!close && <g data-part="oak-crown-plan"><ellipse cx={1010} cy={300} rx={120} ry={96} fill="#000000" opacity={.18}/>
   <ellipse cx={990} cy={280} rx={118} ry={94} fill={SA.oakDark}/><ellipse cx={968} cy={262} rx={78} ry={60} fill={SA.oak}/></g>}
  {/* the tag's cord across the lot, its shadow falling on the asphalt below it */}
  <path d={`M-60 ${cordY + (close ? 38 : 16)}H1140`} stroke="#1A1814" strokeWidth={close ? 7 : 4} opacity={.22}/>
  <path d={`M-60 ${cordY}H1140`} stroke="#2E3238" strokeWidth={close ? 7 : 4}/>
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
 | {part: 'creekback'; t: number; flow: number; width?: [number, number]}
 | {part: 'creekbank'; t: number}
 | {part: 'creekledge'; t: number}
 | {part: 'creektoe'; t: number; width?: [number, number]}
 | {part: 'creekshelf'; t: number; layer: 'back' | 'front'; drift: number}
 | {part: 'pile'; p: number; t: number; len: number; h: number; dir?: 1 | -1}
 | {part: 'creekplan'; t: number; rain: number; flow: number}
 | {part: 'remedycard'; w?: number; lit?: number; underline?: number; imprint?: number}
 | {part: 'arm'; dir: P; grip: 'knob' | 'pen'; skin?: string; shirt?: string; scale?: number; shadow?: number}
 | ({part: 'flood'} & React.ComponentProps<typeof FloodSheet>)
 | {part: 'wake'; amount: number; t: number; scale?: number; dir?: 1 | -1}
 | {part: 'rain'; t: number; w?: number; h?: number; amount?: number; seed?: number}
 | {part: 'street'; soft?: number}
 | {part: 'streetplan'; t: number; front: number; calm?: number}
 | {part: 'lane'; xa: number; xb: number}
 | {part: 'laneplan'; ya: number; yb: number}
 | {part: 'puddleplan'; x0: number; x1: number; y0: number; y1: number; t: number}
 | {part: 'lot'; sag?: number; stalls?: Stalls}
 | {part: 'lotclose'; sag?: number; stalls?: Stalls}
 | {part: 'lotplan'; lay?: LotPlanLayout; close?: boolean}
 | {part: 'record'; w?: number; rows: number; pick?: RowPick; remedyLit?: number; underline?: number; imprints?: Imprint[]}
 | {part: 'stamp'; w: number; h: number; lift?: number}
 | {part: 'pen'; rot?: number}
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
 case 'creekledge': return <CreekLedge {...props}/>;
 case 'creektoe': return <CreekToe {...props}/>;
 case 'creekshelf': return <CreekShelf {...props}/>;
 case 'pile': return <Pile {...props}/>;
 case 'remedycard': return <RemedyCard {...props}/>;
 case 'arm': return <Arm {...props}/>;
 case 'flood': return <FloodSheet {...props}/>;
 case 'wake': return <Wake {...props}/>;
 case 'rain': return <Rain {...props}/>;
 case 'street': return <StreetBack {...props}/>;
 case 'streetplan': return <StreetPlan {...props}/>;
 case 'lane': return <LaneBack {...props}/>;
 case 'laneplan': return <LanePlan {...props}/>;
 case 'puddleplan': return <PuddlePlan {...props}/>;
 case 'lot': return <LotBack {...props}/>;
 case 'lotclose': return <LotClose {...props}/>;
 case 'lotplan': return <LotPlan {...props}/>;
 case 'record': return <RecordCard {...props}/>;
 case 'stamp': return <Stamp {...props}/>;
 case 'pen': return <Pen {...props}/>;
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
