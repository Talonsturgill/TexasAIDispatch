import React from 'react';
import {FONT, widthOf} from '../../../lib/type';
import {useUid} from '../../../lib/uid';

/**
 * FloodStationHero, the fresh authored hero group for the 2026-10-15 edition.
 *
 * ONE solar flood station carries the film, drawn as the design UT San Antonio describes and never
 * as an installed unit. A weathered galvanized pipe post stands in a small concrete footing at a
 * San Antonio curb. Low on its front a slotted strut rail holds FOUR optical water-level pods at
 * four different heights, each a small housing with a round lens and a ring lamp that lights as the
 * water reaches it. A grey flexible conduit runs up the right side of the post, sags once, and
 * enters the instrument housing near the top. The housing is a fibreglass enclosure, hung a few
 * degrees off level, with a dented overhanging cap, hinges on the left, a latch on the right, a
 * battery bar window, a row of four small weather lamps (rain, temperature, humidity, light) and one
 * hooded amber risk lamp. On top sit a rain funnel and a light dome; a louvred shield for the
 * temperature and humidity sensor hangs from an arm on the right. A small dark blue solar panel with
 * a worn corner tilts toward the low sun from a bracket at the post top, and a short black whip
 * antenna leans off the cap.
 *
 * The same group draws the cutaway of that housing for the chip scene: the mounting plate, a small
 * board whose thin traces carry readings in from the four water pods and the four weather sensors to
 * one small chip marked TinyML, the battery and two backup storage cans, the radio can whose coax
 * runs to the antenna, and the amber risk lamp. No network cable leaves the box. It also draws the
 * pinned paper tags that carry the film's few words.
 *
 * Light: late afternoon storm light low from the upper left, cool sky fill from the right, a long
 * soft shadow falling right. Nothing is symmetric: the post leans a little, the housing hangs off
 * level, the conduit sags, the pods step left and right, the antenna is bent, the panel corner is
 * chipped and there is a rust drip under the clamp. Maintained but worn.
 *
 * Disclosed illustration of the described prototype. No logo, brand, real site or measured value.
 * Pure function of its props; the episode drives every prop from the film frame clock.
 */

export type Pal = Record<'background'|'midground'|'foreground'|'ink'|'paper'|'hero'|'accent', string>;
export type Pt = [number, number];
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
/** A seeded generator: the same seed draws the same spangle on every frame and every render. */
function rng(seed: number) {
 let a = seed >>> 0;
 return () => {a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296;};
}

/** Galvanized steel and enclosure plastic under a low warm sun from the upper left. */
export const STEEL = {lit: '#E6E1D5', mid: '#AAB1B3', shade: '#6E777B', deep: '#41484C', spangle: '#8F989B',
 rust: '#9C5A2C', rustDark: '#5F3518', box: '#D9D5CA', boxShade: '#A8A498', boxDeep: '#77746B',
 glass: '#1B2329', cell: '#1C2D4A', cellLit: '#3E5E8E', concrete: '#B9B2A4', concreteDark: '#857E70'};
export const LAMP = {amber: '#F2A92A', amberHot: '#FFE3A1', ring: '#FFF2C9', off: '#4A4E4F', weatherOn: '#BFE6C9'};

/** Station geometry in its own units: the post foot at (0,0), up is negative y. */
export const STATION = {
 /** The four optical pods, centre heights from the ground, deliberately uneven. */
 pods: [-58, -136, -230, -344] as const,
 /** Their small sideways steps on the rail, so the column never reads as a ruler. */
 podDx: [3, -4, 2, -3] as const,
 housing: {x: -64, y: -936, w: 156, h: 142, tilt: -2.6},
 antennaTip: [110, -1146] as Pt,
 panel: [-28, -1062] as Pt,
 batteryWindow: [-42, -879] as Pt,
 riskLamp: [62, -878] as Pt,
 weatherRow: [-34, -844] as Pt,
 top: -1150,
};
/** The screen point of pod i in station units, for the episode's water and glow placement. */
export const podPoint = (i: number): Pt => [10 + STATION.podDx[i], STATION.pods[i]];

type StationProps = {
 /** each pod's lamp, 0 dark to 1 fully lit */
 pods?: number[];
 /** battery bar fill, 0 to 1 */
 battery?: number;
 /** sunlight glint travelling across the panel, 0 to 1, and its strength */
 sun?: number; sunStrength?: number;
 /** the amber risk lamp, 0 to 1 */
 risk?: number;
 /** the four weather lamps: rain, temperature, humidity, light */
 weather?: number[];
 /** a short flash at the antenna tip as a pulse leaves, 0 to 1 */
 transmit?: number;
 /** a glowing cutaway window cut into the housing face, 0 closed to 1 open */
 window?: number;
 /** how wet and dark the post is below a water line given in station units (negative y) */
 wetTo?: number;
 /** cast shadow length multiplier; 0 hides it */
 shadow?: number;
 time?: number;
};

const Pod: React.FC<{x: number; y: number; lit: number; id: string; i: number}> = ({x, y, lit, id, i}) => {
 const glow = clamp(lit);
 return <g transform={`translate(${x} ${y}) rotate(${[-1.5, 1, -0.5, 2][i]})`} data-part={'pod-' + (i + 1)}>
  {/* clamp bracket onto the strut rail */}
  <rect x={-24} y={-6} width={12} height={12} rx={2} fill={STEEL.mid} stroke={STEEL.deep} strokeWidth={1.2}/>
  {/* pod housing: lit top-left, shaded bottom-right */}
  <rect x={-14} y={-15} width={40} height={30} rx={8} fill={`url(#${id}pod)`} stroke={STEEL.deep} strokeWidth={1.6}/>
  <path d="M-10 -12H20" stroke="#FFFFFF" strokeWidth={1.4} opacity={.55} strokeLinecap="round"/>
  {/* lens bezel, glass and the ring lamp that lights when water reaches it */}
  <circle cx={6} cy={0} r={11.5} fill={STEEL.deep}/>
  <circle cx={6} cy={0} r={9.5} fill={glow > 0 ? `url(#${id}lens)` : STEEL.glass} opacity={1}/>
  {glow > 0 && <circle cx={6} cy={0} r={9.5} fill={LAMP.ring} opacity={.85 * glow}/>}
  <circle cx={6} cy={0} r={11.5} fill="none" stroke={glow > 0 ? LAMP.amber : '#5D6468'} strokeWidth={2.4} opacity={glow > 0 ? .5 + .5 * glow : 1}/>
  <ellipse cx={2.5} cy={-4} rx={3.2} ry={2} fill="#FFFFFF" opacity={.7}/>
  {/* cable tail into the rail */}
  <path d={`M26 4Q34 8 33 16`} stroke="#3B3F42" strokeWidth={2.4} fill="none" strokeLinecap="round"/>
 </g>;
};

/** The weather lamp glyphs: rain drop, thermometer, humidity drop with a wave, sun. */
const WeatherGlyph: React.FC<{k: number; on: number}> = ({k, on}) => {
 const c = on > .5 ? '#1F3A2B' : '#9EA39C';
 if (k === 0) return <path d="M0 -6Q4 -1 4 2A4 4 0 0 1 -4 2Q-4 -1 0 -6Z" fill={c}/>;
 if (k === 1) return <g><rect x={-1.6} y={-6} width={3.2} height={8} rx={1.6} fill={c}/><circle cx={0} cy={3} r={3} fill={c}/></g>;
 if (k === 2) return <g><path d="M-1 -6Q3 -1 3 2A3.4 3.4 0 0 1 -4 2Q-4 -1 -1 -6Z" fill={c}/><path d="M-6 6Q-3 4 0 6T6 6" stroke={c} strokeWidth={1.4} fill="none"/></g>;
 return <g><circle cx={0} cy={0} r={2.8} fill={c}/>{[0, 60, 120, 180, 240, 300].map(a => <path key={a} d={`M${4.5 * Math.cos(a * Math.PI / 180)} ${4.5 * Math.sin(a * Math.PI / 180)}L${6.5 * Math.cos(a * Math.PI / 180)} ${6.5 * Math.sin(a * Math.PI / 180)}`} stroke={c} strokeWidth={1.2}/>)}</g>;
};

const Station: React.FC<StationProps> = ({pods = [0, 0, 0, 0], battery = .55, sun = 0, sunStrength = 0, risk = 0,
 weather = [0, 0, 0, 0], transmit = 0, window = 0, wetTo, shadow = 1, time = 0}) => {
 const id = useUid('fsh');
 const r = rng(15);
 const H = STATION.housing;
 // the post leans 1.1 degrees right; its centre line drifts that much as it climbs
 const lean = (y: number) => -y * 0.019;
 const postTop = -1040;
 const spangles = Array.from({length: 26}, () => [r() * 22 - 11, -r() * 1000, 3 + r() * 9, .08 + r() * .12]);
 const wet = wetTo !== undefined ? Math.min(0, wetTo) : 0;
 return <g data-part="flood-station">
  <defs>
   <linearGradient id={id + 'post'} x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stopColor={STEEL.lit}/><stop offset=".28" stopColor={STEEL.mid}/>
    <stop offset=".7" stopColor={STEEL.shade}/><stop offset="1" stopColor={STEEL.deep}/>
   </linearGradient>
   <linearGradient id={id + 'box'} x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stopColor="#F1EEE6"/><stop offset=".45" stopColor={STEEL.box}/><stop offset="1" stopColor={STEEL.boxShade}/>
   </linearGradient>
   <linearGradient id={id + 'cap'} x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stopColor="#F4F1EA"/><stop offset=".6" stopColor="#CFCBC0"/><stop offset="1" stopColor="#9C988D"/>
   </linearGradient>
   <linearGradient id={id + 'pod'} x1="0" y1="0" x2=".6" y2="1">
    <stop offset="0" stopColor="#5E6569"/><stop offset="1" stopColor="#2F3437"/>
   </linearGradient>
   <radialGradient id={id + 'lens'} cx=".4" cy=".4" r=".7">
    <stop offset="0" stopColor={LAMP.amberHot}/><stop offset=".6" stopColor={LAMP.amber}/><stop offset="1" stopColor="#8A5A12"/>
   </radialGradient>
   <linearGradient id={id + 'panel'} x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stopColor={STEEL.cellLit}/><stop offset=".55" stopColor={STEEL.cell}/><stop offset="1" stopColor="#111B2C"/>
   </linearGradient>
   <linearGradient id={id + 'glint'} x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stopColor="#FFF4DA" stopOpacity={0}/><stop offset=".5" stopColor="#FFF4DA" stopOpacity={.75}/><stop offset="1" stopColor="#FFF4DA" stopOpacity={0}/>
   </linearGradient>
   <radialGradient id={id + 'shadow'} cx=".5" cy=".5" r=".5">
    <stop offset="0" stopColor="#1E1A16" stopOpacity={.42}/><stop offset="1" stopColor="#1E1A16" stopOpacity={0}/>
   </radialGradient>
   <linearGradient id={id + 'cast'} x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stopColor="#1E1A16" stopOpacity={.34}/><stop offset="1" stopColor="#1E1A16" stopOpacity={0}/>
   </linearGradient>
   <radialGradient id={id + 'risk'} cx=".5" cy=".5" r=".5">
    <stop offset="0" stopColor={LAMP.amberHot} stopOpacity={.9}/><stop offset=".4" stopColor={LAMP.amber} stopOpacity={.55}/><stop offset="1" stopColor={LAMP.amber} stopOpacity={0}/>
   </radialGradient>
  </defs>

  {/* the long soft shadow falls right, away from the low sun at the upper left */}
  {shadow > 0 && <g opacity={shadow}>
   <path d={`M-6 4L${640 * shadow} 40L${660 * shadow} 58L4 14Z`} fill={`url(#${id}cast)`}/>
   <path d={`M${560 * shadow} 34L${760 * shadow} 30L${790 * shadow} 70L${560 * shadow} 66Z`} fill={`url(#${id}cast)`} opacity={.55}/>
   <ellipse cx={8} cy={8} rx={70} ry={16} fill={`url(#${id}shadow)`}/>
  </g>}

  {/* concrete footing, chipped on the shaded side, a rust stain where the post enters */}
  <path d="M-46 10L-40 -10Q0 -16 44 -9L50 12Q2 20 -46 10Z" fill={STEEL.concrete} stroke={STEEL.concreteDark} strokeWidth={2}/>
  <path d="M30 -8L44 -9L50 12L36 10Z" fill={STEEL.concreteDark} opacity={.5}/>
  <path d="M-40 -10Q0 -16 44 -9" stroke="#E4DED2" strokeWidth={2} fill="none" opacity={.7}/>
  <path d="M6 -10Q9 0 7 9" stroke={STEEL.rust} strokeWidth={4} opacity={.55} fill="none" strokeLinecap="round"/>

  {/* the galvanized post: round pipe shading, spangle and a collar */}
  <path d={`M-15 -8L${-15 + lean(postTop)} ${postTop}L${15 + lean(postTop)} ${postTop}L15 -8Z`} fill={`url(#${id}post)`} stroke={STEEL.deep} strokeWidth={1.6}/>
  {spangles.map(([x, y, s, o], i) => <ellipse key={i} cx={x + lean(y)} cy={y} rx={s * .5} ry={s} fill={STEEL.spangle} opacity={o}/>)}
  <path d={`M-9 -10L${-9 + lean(postTop)} ${postTop}`} stroke="#FFFFFF" strokeWidth={2.2} opacity={.42}/>
  <rect x={-18} y={-22} width={36} height={12} rx={2} fill={STEEL.mid} stroke={STEEL.deep} strokeWidth={1.4}/>
  {/* wet, darker steel below the water line */}
  {wet < 0 && <path d={`M-15 -8L${-15 + lean(wet)} ${wet}L${15 + lean(wet)} ${wet}L15 -8Z`} fill="#2C2620" opacity={.28}/>}

  {/* strut rail holding the four pods, slotted, with painted height ticks beside each pod */}
  <g data-part="sensor-column">
   <rect x={-4 + lean(-200)} y={-392} width={14} height={372} fill={STEEL.mid} stroke={STEEL.deep} strokeWidth={1.4}/>
   {Array.from({length: 15}, (_, i) => <rect key={i} x={-0.5 + lean(-200)} y={-382 + i * 24} width={6} height={12} rx={3} fill={STEEL.deep} opacity={.7}/>)}
   {STATION.pods.map((y, i) => <path key={'tick' + i} d={`M${-14 + lean(y)} ${y}H${-4 + lean(y)}`} stroke="#F4EFE2" strokeWidth={3}/>)}
   <rect x={-20 + lean(-30)} y={-398} width={44} height={10} rx={2} fill={STEEL.mid} stroke={STEEL.deep} strokeWidth={1.2}/>
   <rect x={-20 + lean(-30)} y={-30} width={44} height={10} rx={2} fill={STEEL.mid} stroke={STEEL.deep} strokeWidth={1.2}/>
   {STATION.pods.map((y, i) => <Pod key={i} i={i} id={id} x={14 + STATION.podDx[i] + lean(y)} y={y} lit={pods[i] ?? 0}/>)}
  </g>

  {/* the conduit up the right of the post, one sag, into the housing gland */}
  <path d={`M30 -400Q40 -560 26 -640Q16 -700 30 -760Q36 -780 34 -800`} stroke="#5D6468" strokeWidth={9} fill="none" strokeLinecap="round"/>
  <path d={`M28 -400Q38 -560 24 -640Q14 -700 28 -760`} stroke="#8C9599" strokeWidth={3} fill="none" opacity={.6}/>
  {[-470, -590, -720].map((y, i) => <rect key={i} x={16 + lean(y)} y={y - 4} width={24} height={8} rx={2} fill={STEEL.deep}/>)}

  {/* clamp band under the housing and its rust drip */}
  <rect x={-22 + lean(-780)} y={-790} width={44} height={14} rx={3} fill={STEEL.mid} stroke={STEEL.deep} strokeWidth={1.4}/>
  <path d={`M${-6 + lean(-776)} -776Q-4 -752 -7 -728Q-8 -718 -5 -712`} stroke={STEEL.rust} strokeWidth={3.4} fill="none" opacity={.75} strokeLinecap="round"/>
  <circle cx={-5 + lean(-712)} cy={-709} r={2.6} fill={STEEL.rustDark} opacity={.7}/>

  {/* temperature and humidity shield on its arm, right of the housing */}
  <path d={`M${74} -812H134`} stroke={STEEL.deep} strokeWidth={5}/>
  {[0, 1, 2, 3, 4].map(k => <g key={k} transform={`translate(140 ${-830 + k * 10})`}>
   <ellipse cx={0} cy={0} rx={22 - k} ry={5} fill={k === 0 ? '#F5F2EA' : '#E6E2D7'} stroke={STEEL.boxDeep} strokeWidth={1.1}/>
  </g>)}
  <rect x={135} y={-826} width={10} height={44} fill="#C9C5BA" opacity={.6}/>

  {/* the instrument housing, hung a little off level */}
  <g transform={`rotate(${H.tilt} 0 ${H.y + H.h / 2})`} data-part="housing">
   <rect x={H.x + 6} y={H.y + 8} width={H.w} height={H.h} rx={8} fill="#1E1A16" opacity={.22}/>
   <rect x={H.x} y={H.y} width={H.w} height={H.h} rx={8} fill={`url(#${id}box)`} stroke={STEEL.boxDeep} strokeWidth={2}/>
   <path d={`M${H.x + 6} ${H.y + 10}V${H.y + H.h - 10}`} stroke="#FFFFFF" strokeWidth={2.4} opacity={.6}/>
   {/* hinges left, latch right */}
   {[H.y + 24, H.y + H.h - 30].map(y => <rect key={y} x={H.x - 6} y={y} width={10} height={20} rx={2} fill={STEEL.boxShade} stroke={STEEL.boxDeep} strokeWidth={1.2}/>)}
   <rect x={H.x + H.w - 4} y={H.y + 56} width={10} height={28} rx={3} fill={STEEL.boxShade} stroke={STEEL.boxDeep} strokeWidth={1.2}/>
   {/* blank label plate, scuffed */}
   <rect x={H.x + 22} y={H.y + 112} width={60} height={16} rx={2} fill="#ECE7DA" stroke={STEEL.boxShade} strokeWidth={1}/>
   <path d={`M${H.x + 30} ${H.y + 120}H${H.x + 64}`} stroke={STEEL.boxShade} strokeWidth={1.4} opacity={.6}/>
   {/* battery bar window: five cells that fill left to right */}
   <rect x={H.x + 22} y={H.y + 46} width={78} height={22} rx={4} fill="#20272A" stroke={STEEL.boxDeep} strokeWidth={1.4}/>
   {[0, 1, 2, 3, 4].map(k => {const f = clamp(battery * 5 - k);
    return <g key={k}><rect x={H.x + 26 + k * 14.6} y={H.y + 50} width={12} height={14} rx={1.5} fill="#2E3A33"/>
     {f > 0 && <rect x={H.x + 26 + k * 14.6} y={H.y + 50} width={12 * f} height={14} rx={1.5} fill={k === 0 && battery < .25 ? '#D9822B' : '#8FD6A0'}/>}</g>;})}
   <rect x={H.x + 100} y={H.y + 52} width={4} height={10} rx={1} fill={STEEL.boxDeep}/>
   {/* weather lamps: rain, temperature, humidity, light */}
   {[0, 1, 2, 3].map(k => {const on = clamp(weather[k] ?? 0);
    return <g key={k} transform={`translate(${H.x + 30 + k * 26} ${H.y + 92})`} data-part={'weather-lamp-' + (k + 1)}>
     <circle cx={0} cy={0} r={10} fill={on > 0 ? LAMP.weatherOn : '#3F4544'} opacity={on > 0 ? .35 + .65 * on : 1} stroke={STEEL.boxDeep} strokeWidth={1.2}/>
     <WeatherGlyph k={k} on={on}/>
    </g>;})}
   {/* hooded amber risk lamp */}
   <g transform={`translate(${H.x + H.w - 30} ${H.y + 58})`} data-part="risk-lamp">
    {risk > 0 && <circle cx={0} cy={0} r={46 * (.6 + .4 * risk)} fill={`url(#${id}risk)`} opacity={risk}/>}
    <circle cx={0} cy={0} r={13} fill={risk > 0 ? LAMP.amber : LAMP.off} stroke={STEEL.boxDeep} strokeWidth={1.6}/>
    {risk > 0 && <circle cx={-3} cy={-3} r={5} fill={LAMP.amberHot} opacity={risk}/>}
    <path d="M-17 -8Q0 -24 17 -8" stroke={STEEL.boxDeep} strokeWidth={5} fill="none" strokeLinecap="round"/>
   </g>
   {/* cutaway window: the glowing board seen through the housing face */}
   {window > 0 && <g opacity={window}>
    <rect x={H.x + 14} y={H.y + 20} width={H.w - 28} height={H.h - 40} rx={6} fill="#173A35" stroke="#0E201D" strokeWidth={2}/>
    <rect x={H.x + 66} y={H.y + 56} width={24} height={24} rx={2} fill="#111" stroke={LAMP.amber} strokeWidth={1.6 + 2 * risk}/>
    {[0, 1, 2, 3].map(k => <path key={k} d={`M${H.x + 22} ${H.y + 34 + k * 18}H${H.x + 50}L${H.x + 66} ${H.y + 64 + k * 2}`} stroke="#C9A24A" strokeWidth={1.6} fill="none"/>)}
    <circle cx={H.x + 78} cy={H.y + 68} r={18 + 10 * risk} fill={LAMP.amber} opacity={.25 * risk}/>
   </g>}
   {/* cap: overhanging, dented near its left third */}
   <path d={`M${H.x - 12} ${H.y + 4}L${H.x - 6} ${H.y - 14}Q${H.x + 40} ${H.y - 22} ${H.x + 52} ${H.y - 17}Q${H.x + 62} ${H.y - 10} ${H.x + 74} ${H.y - 18}Q${H.x + 120} ${H.y - 24} ${H.x + H.w + 8} ${H.y - 14}L${H.x + H.w + 14} ${H.y + 6}Z`}
    fill={`url(#${id}cap)`} stroke={STEEL.boxDeep} strokeWidth={2}/>
   <path d={`M${H.x - 4} ${H.y - 12}Q${H.x + 40} ${H.y - 20} ${H.x + 50} ${H.y - 15}`} stroke="#FFFFFF" strokeWidth={2.4} opacity={.75} fill="none"/>
   <path d={`M${H.x + 54} ${H.y - 14}Q${H.x + 62} ${H.y - 8} ${H.x + 70} ${H.y - 15}`} stroke={STEEL.boxDeep} strokeWidth={1.6} opacity={.7} fill="none"/>
   {/* cable glands under the box, where the conduit enters */}
   {[H.x + 98, H.x + 122].map(x => <rect key={x} x={x} y={H.y + H.h - 2} width={14} height={12} rx={2} fill={STEEL.deep}/>)}
   {/* the rain funnel and the light dome on the cap */}
   <g transform={`translate(${H.x + 26} ${H.y - 18})`} data-part="rain-funnel">
    <path d="M-16 -26L16 -26L10 -8L-10 -8Z" fill="#E9E5DA" stroke={STEEL.boxDeep} strokeWidth={1.4}/>
    <rect x={-10} y={-8} width={20} height={10} fill="#D6D2C6" stroke={STEEL.boxDeep} strokeWidth={1.2}/>
    <ellipse cx={0} cy={-26} rx={16} ry={4} fill="#2B3134"/>
   </g>
   <g transform={`translate(${H.x + 104} ${H.y - 20})`} data-part="light-dome">
    <rect x={-9} y={-4} width={18} height={6} fill="#D6D2C6" stroke={STEEL.boxDeep} strokeWidth={1}/>
    <path d="M-8 -4A8 8 0 0 1 8 -4Z" fill="#F7F5EE" stroke={STEEL.boxDeep} strokeWidth={1}/>
    <path d="M-4 -8A4 4 0 0 1 1 -10" stroke="#FFFFFF" strokeWidth={1.4} fill="none"/>
   </g>
   {/* the short whip antenna, bent a little at the top */}
   <g data-part="antenna">
    <rect x={H.x + H.w - 26} y={H.y - 30} width={12} height={14} rx={2} fill={STEEL.deep}/>
    <path d={`M${H.x + H.w - 20} ${H.y - 30}L${H.x + H.w - 12} ${H.y - 150}Q${H.x + H.w - 9} ${H.y - 196} ${H.x + H.w + 4} ${H.y - 210}`} stroke="#1E2224" strokeWidth={5} fill="none" strokeLinecap="round"/>
    <path d={`M${H.x + H.w - 22} ${H.y - 34}L${H.x + H.w - 15} ${H.y - 140}`} stroke="#6D7579" strokeWidth={1.6} fill="none" opacity={.8}/>
    {transmit > 0 && <circle cx={H.x + H.w + 4} cy={H.y - 210} r={8 + 18 * transmit} fill={LAMP.amberHot} opacity={.7 * (1 - transmit)}/>}
   </g>
  </g>

  {/* the post's top, the panel bracket and the small dark solar panel with its worn corner */}
  <g data-part="solar-panel">
   <path d={`M${lean(postTop) - 6} ${postTop}L${-18} ${-1068}`} stroke={STEEL.deep} strokeWidth={8} strokeLinecap="round"/>
   <circle cx={lean(postTop)} cy={postTop} r={9} fill={STEEL.mid} stroke={STEEL.deep} strokeWidth={1.4}/>
   <g transform={`translate(${STATION.panel[0]} ${STATION.panel[1]}) rotate(-14) skewX(-10)`}>
    <rect x={-104} y={-62} width={190} height={92} rx={3} fill="#C8CDCF" stroke={STEEL.deep} strokeWidth={2}/>
    <path d={`M-98 -56H80V24H-80L-98 6Z`} fill={`url(#${id}panel)`}/>
    {[0, 1, 2, 3, 4, 5].map(k => <path key={'v' + k} d={`M${-98 + k * 29.6} -56V24`} stroke="#8DA2C2" strokeWidth={.9} opacity={.45}/>)}
    {[0, 1, 2].map(k => <path key={'h' + k} d={`M-98 ${-56 + k * 26.6}H80`} stroke="#8DA2C2" strokeWidth={.9} opacity={.45}/>)}
    {/* chipped, worn corner bottom left and a smear of dust */}
    <path d="M-104 30L-104 8L-84 30Z" fill="#9AA0A3" stroke={STEEL.deep} strokeWidth={1.2}/>
    <ellipse cx={40} cy={14} rx={26} ry={6} fill="#B9A98A" opacity={.25}/>
    {sun > 0 && sunStrength > 0 && <rect x={-140 + 260 * sun} y={-58} width={60} height={86} fill={`url(#${id}glint)`} opacity={sunStrength}/>}
    <path d="M-100 -60H84" stroke="#FFFFFF" strokeWidth={2} opacity={.7}/>
   </g>
  </g>
  {/* a few drops shaken loose from the cap, on the film clock */}
  {[0, 1, 2].map(k => {const ph = ((time * .7 + k * .37) % 1); return <circle key={k} cx={H.x + 20 + k * 52} cy={H.y + H.h + 20 + ph * 60} r={2.2} fill="#CFE0EA" opacity={.5 * (1 - ph)}/>;})}
 </g>;
};

/** The housing opened for the chip scene, drawn large in its own units centred on (0,0). */
const Cutaway: React.FC<{readings?: number; chip?: number; risk?: number; battery?: number; labels?: number}> =
 ({readings = 0, chip = 0, risk = 0, battery = .8, labels = 1}) => {
 const id = useUid('fsc');
 const chipC: Pt = [36, 20];
 // eight inputs: four water pods enter low left, four weather sensors enter along the top left
 const inputs: {from: Pt; via: Pt[]; kind: 'pod' | 'weather'; k: number}[] = [
  ...[0, 1, 2, 3].map(k => ({from: [-262, 160 - k * 36] as Pt, via: [[-150, 160 - k * 36] as Pt, [-40, 70 - k * 14] as Pt], kind: 'pod' as const, k})),
  ...[0, 1, 2, 3].map(k => ({from: [-200 + k * 46, -214] as Pt, via: [[-200 + k * 46, -120] as Pt, [-20 + k * 12, -60] as Pt], kind: 'weather' as const, k})),
 ];
 const path = (row: typeof inputs[number]) => [row.from, ...row.via, chipC];
 const along = (pts: Pt[], u: number): Pt => {
  const seg = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
  let d = clamp(u) * seg.reduce((a, b) => a + b, 0);
  for (let i = 0; i < seg.length; i++) {if (d <= seg[i] || i === seg.length - 1) {const f = seg[i] ? clamp(d / seg[i]) : 0; return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)];} d -= seg[i];}
  return pts[pts.length - 1];
 };
 return <g data-part="housing-cutaway">
  <defs>
   <linearGradient id={id + 'wall'} x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stopColor="#E9E5DB"/><stop offset="1" stopColor="#B4AFA3"/>
   </linearGradient>
   <linearGradient id={id + 'board'} x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stopColor="#24564C"/><stop offset="1" stopColor="#163A33"/>
   </linearGradient>
   <radialGradient id={id + 'glow'} cx=".5" cy=".5" r=".5">
    <stop offset="0" stopColor={LAMP.amberHot} stopOpacity={.95}/><stop offset=".45" stopColor={LAMP.amber} stopOpacity={.5}/><stop offset="1" stopColor={LAMP.amber} stopOpacity={0}/>
   </radialGradient>
  </defs>
  {/* the open enclosure: thick walls, the door's gasket edge and a cast shadow inside the top lip */}
  <rect x={-330} y={-300} width={660} height={600} rx={26} fill="#8E8A80"/>
  <rect x={-312} y={-282} width={624} height={564} rx={18} fill={`url(#${id}wall)`} stroke="#77746B" strokeWidth={3}/>
  <path d="M-312 -262H312V-230H-312Z" fill="#1E1A16" opacity={.14}/>
  <rect x={-322} y={-292} width={644} height={584} rx={22} fill="none" stroke="#3A3C3B" strokeWidth={6} opacity={.5}/>
  {/* the mounting plate and its four screws, one replaced with a brighter one */}
  <rect x={-280} y={-240} width={560} height={500} rx={8} fill="#CFCAC0" stroke="#9C988D" strokeWidth={2}/>
  {[[-264, -224], [264, -224], [-264, 244], [262, 246]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={7} fill={i === 3 ? '#E8E8E2' : '#A7A399'} stroke="#6E6A61" strokeWidth={1.4}/>)}
  {/* battery and two backup storage cans, lower right */}
  <g data-part="battery">
   <rect x={120} y={120} width={130} height={104} rx={8} fill="#2F3436" stroke="#1B1E20" strokeWidth={2}/>
   <rect x={132} y={134} width={106} height={20} rx={4} fill="#1C2022"/>
   <rect x={132} y={134} width={106 * clamp(battery)} height={20} rx={4} fill="#8FD6A0"/>
   {[0, 1].map(k => <g key={k} transform={`translate(${150 + k * 56} 196)`}>
    <rect x={-16} y={-24} width={32} height={40} rx={14} fill="#3D5A7A" stroke="#1F2F40" strokeWidth={1.6}/>
    <path d="M-12 -18V10" stroke="#7C9BBB" strokeWidth={2} opacity={.7}/>
   </g>)}
  </g>
  {/* the radio can whose coax leaves through the top gland to the antenna; the only line out */}
  <g data-part="radio">
   <rect x={150} y={-200} width={96} height={70} rx={6} fill="#B9BEC0" stroke="#5D6468" strokeWidth={2}/>
   {[0, 1, 2, 3].map(k => <path key={k} d={`M${164 + k * 20} -190V-140`} stroke="#8F969A" strokeWidth={2}/>)}
   <path d="M230 -200Q236 -250 260 -282" stroke="#1E2224" strokeWidth={8} fill="none" strokeLinecap="round"/>
   <rect x={246} y={-298} width={28} height={18} rx={3} fill="#41484C"/>
  </g>
  {/* the board, thin gold traces, input headers */}
  <rect x={-250} y={-180} width={360} height={340} rx={10} fill={`url(#${id}board)`} stroke="#0D221E" strokeWidth={2.4}/>
  {inputs.map((row, i) => <path key={i} d={'M' + path(row).map(q => q.join(' ')).join('L')} stroke="#C9A24A" strokeWidth={3} fill="none" opacity={.85} strokeLinejoin="round"/>)}
  {inputs.map((row, i) => <g key={'h' + i} transform={`translate(${row.from[0]} ${row.from[1]})`}>
   <rect x={-14} y={-9} width={28} height={18} rx={3} fill="#E8E4DA" stroke="#77746B" strokeWidth={1.4}/>
   {row.kind === 'pod'
    ? <circle cx={0} cy={0} r={5} fill={readings > .05 ? LAMP.ring : '#4A4E4F'} stroke="#2F3437" strokeWidth={1.2}/>
    : <g transform="scale(.9)"><WeatherGlyph k={row.k} on={readings > .05 ? 1 : 0}/></g>}
  </g>)}
  {/* the readings travel in along the traces as small bright pulses, staggered by input */}
  {readings > 0 && readings < 1 && inputs.map((row, i) => {const u = clamp(readings * 1.35 - i * .045); const q = along(path(row), u);
   return u > 0 && u < 1 ? <circle key={'p' + i} cx={q[0]} cy={q[1]} r={7} fill={LAMP.ring} opacity={.95}/> : null;})}
  {/* the small chip, marked with its method's name */}
  <g data-part="chip" transform={`translate(${chipC[0]} ${chipC[1]})`}>
   {chip > 0 && <circle cx={0} cy={0} r={90 + 40 * chip} fill={`url(#${id}glow)`} opacity={chip}/>}
   {Array.from({length: 7}, (_, k) => <g key={k}>
    <rect x={-42 + k * 12} y={-56} width={5} height={10} fill="#C9C3B2"/><rect x={-42 + k * 12} y={46} width={5} height={10} fill="#C9C3B2"/>
    <rect x={-56} y={-42 + k * 12} width={10} height={5} fill="#C9C3B2"/><rect x={46} y={-42 + k * 12} width={10} height={5} fill="#C9C3B2"/>
   </g>)}
   <rect x={-46} y={-46} width={92} height={92} rx={6} fill="#151617" stroke={chip > 0 ? LAMP.amber : '#3A3C3D'} strokeWidth={2 + 3 * chip}/>
   <circle cx={-34} cy={-34} r={4} fill="#3A3C3D"/>
   {labels > 0 && <text x={0} y={8} textAnchor="middle" fontFamily={FONT.mono} fontSize={19} fontWeight={700} fill="#D8D2C2" opacity={labels}>TinyML</text>}
  </g>
  {/* the risk lamp on the board edge, amber when the chip judges risk */}
  <g data-part="risk-lamp" transform="translate(70 128)">
   {risk > 0 && <circle cx={0} cy={0} r={60 * (.5 + .5 * risk)} fill={`url(#${id}glow)`} opacity={risk}/>}
   <circle cx={0} cy={0} r={18} fill={risk > 0 ? LAMP.amber : LAMP.off} stroke="#2A2A2A" strokeWidth={2}/>
   {risk > 0 && <circle cx={-5} cy={-5} r={6} fill={LAMP.amberHot} opacity={risk}/>}
  </g>
  {/* the bottom of the box: two cable glands for the sensor leads, and no network port */}
  {[-160, -100].map(x => <rect key={x} x={x} y={262} width={30} height={26} rx={4} fill="#41484C"/>)}
  <path d="M-152 288Q-150 300 -146 318M-92 288Q-94 302 -88 318" stroke="#5D6468" strokeWidth={8} fill="none" strokeLinecap="round"/>
 </g>;
};

/** A pinned paper tag on a short string: the few words the film puts on screen. */
const Tag: React.FC<{lines: string[]; tone?: 'ink' | 'accent' | 'paper' | 'outline'; pal: Pal; scale?: number; swing?: number; drop?: number; side?: 'left' | 'right'; size?: number}> =
 ({lines, tone = 'paper', pal, scale = 1, swing = 0, drop = 26, side = 'right', size = 34}) => {
 const w = Math.max(...lines.map(l => widthOf(l, size, true))) + 40, h = lines.length * (size + 8) + 22;
 const fill = tone === 'ink' ? pal.ink : tone === 'accent' ? pal.accent : tone === 'outline' ? pal.paper : pal.paper;
 const text = tone === 'ink' ? pal.paper : pal.ink;
 const x0 = side === 'right' ? -18 : -w + 18;
 return <g transform={`scale(${scale}) rotate(${swing})`} data-part="tag">
  <circle cx={0} cy={0} r={6} fill="#5A5249" stroke={pal.ink} strokeWidth={1.4}/>
  <path d={`M0 0L${x0 + w / 2} ${drop}`} stroke={pal.ink} strokeWidth={2} opacity={.8}/>
  <g transform={`translate(${x0} ${drop})`}>
   <rect x={4} y={6} width={w} height={h} rx={9} fill="#1E1A16" opacity={.22}/>
   <rect x={0} y={0} width={w} height={h} rx={9} fill={fill} stroke={pal.ink} strokeWidth={tone === 'outline' ? 4 : 2}
    strokeDasharray={tone === 'outline' ? '12 8' : undefined}/>
   <circle cx={w / 2} cy={10} r={4} fill="#FFFFFF" stroke={pal.ink} strokeWidth={1.2} opacity={.85}/>
   {lines.map((l, i) => <text key={i} x={20} y={20 + (i + 1) * (size + 8) - 8} fontFamily={FONT.body} fontSize={size} fontWeight={800} fill={text}>{l}</text>)}
  </g>
 </g>;
};

type HeroProps =
 | ({part: 'station'} & StationProps)
 | {part: 'cutaway'; readings?: number; chip?: number; risk?: number; battery?: number; labels?: number}
 | {part: 'tag'; lines: string[]; tone?: 'ink' | 'accent' | 'paper' | 'outline'; pal: Pal; scale?: number; swing?: number; drop?: number; side?: 'left' | 'right'; size?: number};

/** The hero group's one export: every part of the station the film draws. */
export const FloodStationHero: React.FC<HeroProps> = (props) => {
 if (props.part === 'station') return <Station {...props}/>;
 if (props.part === 'cutaway') return <Cutaway {...props}/>;
 if (props.part === 'tag') return <Tag {...props}/>;
 throw new Error('Unknown flood station part');
};
