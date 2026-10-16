import React from 'react';
import {FONT, widthOf} from '../../../lib/type';
import {useUid} from '../../../lib/uid';

/**
 * StreetHubSupport, the fresh authored support group for the 2026-10-15 edition.
 *
 * The San Antonio world around the flood station and the places its warning goes. A wet asphalt
 * street with a hand-cut limestone curb and a dark gutter, a St. Augustine lawn with dormant brown
 * patches, a chain link fence whose second post carries an orange ankle-high spray mark and leans a
 * little, a live oak edge with low spreading limbs, furrowed bark and grey ball moss, and the corner
 * of a painted bungalow porch with two steps and a rail where a worn phone lies screen up. Brown
 * flood water with a hand-drawn, lobed edge, drifting leaves and foam. A far cell tower and the
 * dashed outline of a central server, which both stay unconnected. A short street of bungalows, the
 * open country beyond it, thin radio rings with a half-mile tag and a five-mile tag, a small
 * limestone hub building with a rooftop mast, the hub desk with its monitor and a responder's
 * sleeved forearm in a dark work glove, the dashboard map with station dots, shaded flood paths and
 * dashed higher-risk outlines, the validation card, the blank field result card and the paper street
 * map with no pin on it.
 *
 * Light matches the hero: low warm storm light from the upper left, cool fill from the right, long
 * soft shadows falling right. Nothing is symmetric: the fence post leans, the curb blocks differ, the
 * oak is lopsided, the phone case is scuffed on one corner. No logos, names, faces, real streets,
 * addresses, agencies or measured values; the only figure drawn is the university's own reported
 * validation accuracy, passed in by the episode from its claim.
 *
 * Pure function of its props; the episode drives every prop from the film frame clock.
 */

type Pal = Record<'background'|'midground'|'foreground'|'ink'|'paper'|'hero'|'accent', string>;
type Pt = [number, number];
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const ease = (p: number) => {const q = clamp(p); return q * q * q * (10 + q * (-15 + 6 * q));};
/** A seeded generator: the same seed draws the same lawn, oak and debris on every frame. */
function rng(seed: number) {
 let a = seed >>> 0;
 return () => {a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296;};
}

export const SA = {
 asphalt: '#4A4744', asphaltWet: '#3A3836', asphaltLit: '#6E6A64',
 lime: '#E4D6B8', limeFace: '#C9B794', limeShade: '#9E8C6C', limeDeep: '#7A6A50',
 grass: '#6F7E45', grassDark: '#4E5C30', grassLit: '#97A35F', dormant: '#A99766',
 water: '#7B5B3A', waterDeep: '#58402A', waterLit: '#B39065', foam: '#E8DCC4',
 oak: '#47552F', oakDark: '#2E3A20', oakLit: '#6F7E46', bark: '#4A3E33', barkLit: '#7C6C5C', moss: '#A7A895',
 siding: '#E6DDCB', sidingShade: '#BDB2A0', trim: '#F4F0E6', porchFloor: '#8F7A5E', step: '#B9AC94',
 chain: '#9AA1A3', chainShade: '#6E7578', paint: '#E8742A',
 screen: '#151A1E', banner: '#F0E7D4', alert: '#E3A32B',
 slate: '#1F2A2E', slateLit: '#2C3A3F', street: '#7F8E92', creek: '#5D8794',
 paper: '#F1EBDD', paperShade: '#D9D0BC', ink: '#232A30',
 glove: '#2A2724', sleeve: '#2F3F56', sleeveShade: '#1F2B3C', reflect: '#CFCFC6',
 desk: '#8B6F51', deskLit: '#A88B69', deskShade: '#5E4935',
};
/** Where a phone lies on the porch rail, in the porch's own units. */
export const PORCH = {railTop: [168, -248] as Pt, w: 360};
/** The fence post that carries the ankle-high paint mark, in the fence's own units. */
export const FENCE = {markPostX: 128, markY: -26};

// ---- ground ------------------------------------------------------------------------------------
const Street: React.FC<{x0: number; x1: number; yFar: number; yNear: number; t?: number}> = ({x0, x1, yFar, yNear, t = 0}) => {
 const id = useUid('sas');
 const r = rng(7);
 return <g data-part="street">
  <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
   <stop offset="0" stopColor={SA.asphaltLit}/><stop offset=".35" stopColor={SA.asphalt}/><stop offset="1" stopColor={SA.asphaltWet}/>
  </linearGradient></defs>
  <rect x={x0} y={yFar} width={x1 - x0} height={yNear - yFar} fill={`url(#${id})`}/>
  {/* a patched crack and a sheen of standing water reflecting the sky */}
  <path d={`M${x0 + (x1 - x0) * .3} ${yFar + 4}Q${x0 + (x1 - x0) * .36} ${(yFar + yNear) / 2} ${x0 + (x1 - x0) * .33} ${yNear - 2}`} stroke="#2E2C2A" strokeWidth={2} fill="none" opacity={.6}/>
  <rect x={x0 + (x1 - x0) * .58} y={yFar + (yNear - yFar) * .3} width={(x1 - x0) * .12} height={(yNear - yFar) * .4} rx={4} fill="#3F3C39" opacity={.8}/>
  {Array.from({length: 6}, (_, i) => {const x = x0 + r() * (x1 - x0), w = 40 + r() * 120, y = yFar + (.2 + r() * .6) * (yNear - yFar);
   return <ellipse key={i} cx={x + 6 * Math.sin(t * .8 + i)} cy={y} rx={w} ry={2 + r() * 3} fill="#CFD8DD" opacity={.18 + r() * .12}/>;})}
 </g>;
};

const Curb: React.FC<{x0: number; y0: number; x1: number; y1: number; h?: number; seed?: number}> = ({x0, y0, x1, y1, h = 22, seed = 3}) => {
 const r = rng(seed);
 const n = Math.max(3, Math.round(Math.hypot(x1 - x0, y1 - y0) / 140));
 const joints = Array.from({length: n - 1}, (_, i) => (i + 1 + (r() - .5) * .5) / n);
 const at = (u: number): Pt => [lerp(x0, x1, u), lerp(y0, y1, u)];
 return <g data-part="limestone-curb">
  {/* gutter line, top face lit by the low sun, front face in its own shade */}
  <path d={`M${x0} ${y0 + h + 2}L${x1} ${y1 + h + 2}`} stroke="#2A2724" strokeWidth={6} opacity={.55}/>
  <path d={`M${x0} ${y0 - h * .55}L${x1} ${y1 - h * .55}L${x1} ${y1}L${x0} ${y0}Z`} fill={SA.lime}/>
  <path d={`M${x0} ${y0}L${x1} ${y1}L${x1} ${y1 + h}L${x0} ${y0 + h}Z`} fill={SA.limeFace}/>
  <path d={`M${x0} ${y0 - h * .55}L${x1} ${y1 - h * .55}`} stroke="#F6EEDB" strokeWidth={2} opacity={.8}/>
  {joints.map((u, i) => {const [x, y] = at(u); return <path key={i} d={`M${x} ${y - h * .55}L${x + 2} ${y + h}`} stroke={SA.limeShade} strokeWidth={2}/>;})}
  {/* chips and fossil pits in the soft stone */}
  {Array.from({length: n * 2}, (_, i) => {const [x, y] = at(r()); return <ellipse key={'c' + i} cx={x} cy={y + h * (.2 + r() * .6)} rx={2 + r() * 5} ry={1.5 + r() * 2} fill={SA.limeDeep} opacity={.35}/>;})}
  {(() => {const [x, y] = at(.62); return <path d={`M${x} ${y - h * .55}L${x + 18} ${y - h * .5}L${x + 10} ${y + 6}Z`} fill={SA.limeShade}/>;})()}
 </g>;
};

const Lawn: React.FC<{d: string; seed?: number; box: [number, number, number, number]}> = ({d, seed = 5, box}) => {
 const id = useUid('sal');
 const r = rng(seed);
 const [bx, by, bw, bh] = box;
 return <g data-part="lawn">
  <defs><linearGradient id={id} x1="0" y1="0" x2=".3" y2="1">
   <stop offset="0" stopColor={SA.grassLit}/><stop offset=".5" stopColor={SA.grass}/><stop offset="1" stopColor={SA.grassDark}/>
  </linearGradient><clipPath id={id + 'c'}><path d={d}/></clipPath></defs>
  <path d={d} fill={`url(#${id})`}/>
  <g clipPath={`url(#${id}c)`}>
   {Array.from({length: 7}, (_, i) => <ellipse key={'d' + i} cx={bx + r() * bw} cy={by + r() * bh} rx={30 + r() * 70} ry={8 + r() * 16} fill={SA.dormant} opacity={.35}/>)}
   {Array.from({length: 120}, (_, i) => {const x = bx + r() * bw, y = by + r() * bh, s = 4 + (y - by) / bh * 10;
    return <path key={i} d={`M${x} ${y}l${-s * .3} ${-s}M${x + 2} ${y}l${s * .2} ${-s * .9}`} stroke={r() > .5 ? SA.grassDark : SA.grassLit} strokeWidth={1.6} opacity={.7}/>;})}
  </g>
 </g>;
};

const Fence: React.FC<{x0: number; x1: number; h?: number; posts?: number; lean?: number; mark?: number}> = ({x0, x1, h = 300, posts = 3, lean = 2.5, mark = 1}) => {
 const id = useUid('saf');
 const xs = Array.from({length: posts}, (_, i) => lerp(x0, x1, i / (posts - 1)));
 return <g data-part="chain-link-fence">
  <defs><pattern id={id} width={16} height={16} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
   <path d="M0 0H16M0 0V16" stroke={SA.chain} strokeWidth={1.6} fill="none"/>
  </pattern></defs>
  <path d={`M${x0} ${-h}L${x1} ${-h + 6}L${x1} 0L${x0} 0Z`} fill={`url(#${id})`} opacity={.85}/>
  <path d={`M${x0} ${-h}L${x1} ${-h + 6}`} stroke={SA.chainShade} strokeWidth={7} strokeLinecap="round"/>
  <path d={`M${x0} ${-h - 2}L${x1} ${-h + 4}`} stroke="#D9DEDF" strokeWidth={2} opacity={.7}/>
  {xs.map((x, i) => {const tilt = i === mark ? lean : i === 0 ? -.6 : .4;
   return <g key={i} transform={`rotate(${tilt} ${x} 0)`} data-part={i === mark ? 'ankle-mark-post' : 'fence-post'}>
    <ellipse cx={x + 30} cy={3} rx={40} ry={7} fill="#1E1A16" opacity={.25}/>
    <rect x={x - 8} y={-h - 14} width={16} height={h + 14} rx={4} fill={SA.chain} opacity={.9}/>
    <rect x={x - 8} y={-h - 14} width={5} height={h + 14} rx={2} fill="#E3E7E8" opacity={.7}/>
    <rect x={x + 3} y={-h - 14} width={5} height={h + 14} rx={2} fill={SA.chainShade} opacity={.8}/>
    <ellipse cx={x} cy={-h - 14} rx={10} ry={5} fill="#C7CCCD" stroke={SA.chainShade} strokeWidth={1.4}/>
    {i === mark && <g data-part="ankle-mark">
     <rect x={x - 12} y={FENCE.markY - 9} width={24} height={18} fill={SA.paint} stroke="#F6EBDA" strokeWidth={2}/>
     <path d={`M${x - 2} ${FENCE.markY + 9}Q${x - 1} ${FENCE.markY + 17} ${x - 3} ${FENCE.markY + 24}`} stroke={SA.paint} strokeWidth={3.4} fill="none" strokeLinecap="round"/>
    </g>}
   </g>;})}
 </g>;
};

const Oak: React.FC<{h?: number; seed?: number; flip?: boolean}> = ({h = 700, seed = 9, flip = false}) => {
 const r = rng(seed);
 const id = useUid('sao');
 const lobes = Array.from({length: 22}, () => [(r() - .35) * h * 1.1, -h * (.48 + r() * .45), h * (.1 + r() * .12), h * (.07 + r() * .07)]);
 return <g transform={flip ? 'scale(-1 1)' : undefined} data-part="live-oak">
  <defs><radialGradient id={id} cx=".3" cy=".25" r=".9">
   <stop offset="0" stopColor={SA.oakLit}/><stop offset=".55" stopColor={SA.oak}/><stop offset="1" stopColor={SA.oakDark}/>
  </radialGradient></defs>
  <ellipse cx={h * .35} cy={6} rx={h * .6} ry={h * .05} fill="#1E1A16" opacity={.22}/>
  {/* a low, spreading live oak: a stout leaning trunk and long near-horizontal limbs */}
  <path d={`M${-h * .05} 0Q${-h * .02} ${-h * .25} ${h * .04} ${-h * .42}L${h * .1} ${-h * .4}Q${h * .06} ${-h * .22} ${h * .08} 0Z`} fill={SA.bark}/>
  <path d={`M${-h * .03} -6Q${-h * .01} ${-h * .25} ${h * .045} ${-h * .4}`} stroke={SA.barkLit} strokeWidth={h * .012} fill="none" opacity={.7}/>
  {[[-.5, -.55, .2], [.55, -.6, .16], [.25, -.75, .12], [-.2, -.78, .1]].map(([dx, dy, w], i) =>
   <path key={i} d={`M${h * .05} ${-h * .4}Q${h * dx * .5} ${-h * (.45 + i * .03)} ${h * dx} ${h * dy}`} stroke={SA.bark} strokeWidth={h * w * .18} fill="none" strokeLinecap="round"/>)}
  {/* furrowed bark lines */}
  {[0, 1, 2, 3].map(k => <path key={'f' + k} d={`M${h * (.0 + k * .02)} ${-h * .05}Q${h * (.01 + k * .02)} ${-h * .2} ${h * (.04 + k * .015)} ${-h * .36}`} stroke="#2F2620" strokeWidth={1.6} fill="none" opacity={.6}/>)}
  {lobes.map(([x, y, rx, ry], i) => <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill={`url(#${id})`} opacity={.96}/>)}
  {lobes.slice(0, 14).map(([x, y, rx, ry], i) => <ellipse key={'l' + i} cx={x - rx * .25} cy={y - ry * .3} rx={rx * .45} ry={ry * .35} fill={SA.oakLit} opacity={.35}/>)}
  {/* ball moss tufts on the limbs */}
  {Array.from({length: 7}, (_, i) => <circle key={'m' + i} cx={(r() - .3) * h * .8} cy={-h * (.42 + r() * .2)} r={h * .012 + r() * 4} fill={SA.moss} opacity={.85}/>)}
 </g>;
};

const Porch: React.FC<{w?: number}> = ({w = PORCH.w}) => {
 const id = useUid('sap');
 return <g data-part="porch">
  <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
   <stop offset="0" stopColor={SA.siding}/><stop offset="1" stopColor={SA.sidingShade}/>
  </linearGradient></defs>
  {/* the bungalow wall behind the porch, lap siding, a window edge */}
  <rect x={-40} y={-620} width={w * .62} height={540} fill={`url(#${id})`}/>
  {Array.from({length: 18}, (_, i) => <path key={i} d={`M-40 ${-610 + i * 30}H${w * .62 - 40}`} stroke={SA.sidingShade} strokeWidth={2} opacity={.8}/>)}
  <rect x={20} y={-560} width={110} height={170} fill="#5F6F74" stroke={SA.trim} strokeWidth={10}/>
  <path d="M28 -552L120 -400" stroke="#9FB2B8" strokeWidth={8} opacity={.35}/>
  {/* porch floor and its front edge */}
  <path d={`M-40 -90H${w}L${w - 8} -64H-40Z`} fill={SA.porchFloor}/>
  <path d={`M-40 -90H${w}`} stroke="#B49B7B" strokeWidth={3}/>
  {/* two limestone steps */}
  <path d={`M${w * .55} -64H${w * .92}V-34H${w * .55}Z`} fill={SA.step} stroke={SA.limeShade} strokeWidth={2}/>
  <path d={`M${w * .5} -34H${w * .97}V0H${w * .5}Z`} fill={SA.lime} stroke={SA.limeShade} strokeWidth={2}/>
  {/* the rail: a corner post, top rail, balusters, one baluster replaced and unpainted */}
  <rect x={w - 26} y={-330} width={22} height={240} fill={SA.trim} stroke={SA.sidingShade} strokeWidth={2}/>
  <rect x={-40} y={-262} width={w - 14} height={16} fill={SA.trim} stroke={SA.sidingShade} strokeWidth={2}/>
  <rect x={-40} y={-248} width={w - 14} height={4} fill={SA.sidingShade}/>
  {Array.from({length: 9}, (_, i) => <rect key={i} x={-10 + i * 30} y={-244} width={9} height={152} fill={i === 5 ? '#D8C9A9' : SA.trim} stroke={SA.sidingShade} strokeWidth={1.2}/>)}
  <rect x={-40} y={-104} width={w - 14} height={10} fill={SA.trim} stroke={SA.sidingShade} strokeWidth={1.4}/>
  <ellipse cx={w * .7} cy={2} rx={w * .4} ry={10} fill="#1E1A16" opacity={.18}/>
 </g>;
};

const Phone: React.FC<{banner?: number; t?: number; pal: Pal; w?: number}> = ({banner = 0, t = 0, pal, w = 220}) => {
 const id = useUid('saph');
 const h = w * 2.05, b = clamp(banner);
 const by = -h / 2 + 30 - 60 * (1 - ease(b));
 return <g data-part="porch-phone">
  <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
   <stop offset="0" stopColor="#3A4A55"/><stop offset=".35" stopColor={SA.screen}/><stop offset="1" stopColor="#0B0E10"/>
  </linearGradient><clipPath id={id + 'c'}><rect x={-w / 2 + 12} y={-h / 2 + 12} width={w - 24} height={h - 24} rx={22}/></clipPath></defs>
  <rect x={-w / 2 + 10} y={-h / 2 + 14} width={w} height={h} rx={34} fill="#1E1A16" opacity={.35}/>
  {/* worn case, scuffed on one corner */}
  <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={32} fill="#5B4A3A" stroke="#2F261D" strokeWidth={3}/>
  <path d={`M${w / 2 - 34} ${h / 2 - 4}Q${w / 2 - 6} ${h / 2 - 8} ${w / 2 - 3} ${h / 2 - 34}`} stroke="#8B7660" strokeWidth={6} fill="none" opacity={.8}/>
  <rect x={-w / 2 + 12} y={-h / 2 + 12} width={w - 24} height={h - 24} rx={22} fill={`url(#${id})`}/>
  <g clipPath={`url(#${id}c)`}>
   {/* the storm sky reflected in the dark glass, and a few rain drops on it */}
   <path d={`M${-w / 2} ${-h / 2 + 40}L${w / 2} ${-h / 2 + 120}V${-h / 2 + 170}L${-w / 2} ${-h / 2 + 90}Z`} fill="#9FB0B8" opacity={.16}/>
   {[[-50, 40], [30, -80], [60, 120], [-20, 160]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={5 + i} fill="#DCE8EE" opacity={.35}/>)}
   {b > 0 && <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#E9C27A" opacity={.12 * b}/>}
   {b > 0 && <g transform={`translate(0 ${by})`} opacity={clamp(b * 2.5)} data-part="warning-banner">
    <rect x={-w / 2 + 14} y={0} width={w - 28} height={150} rx={16} fill={SA.banner} stroke={SA.alert} strokeWidth={5}/>
    <path d={`M${-w / 2 + 50} 20L${-w / 2 + 80} 70H${-w / 2 + 20}Z`} fill={SA.alert} stroke={pal.ink} strokeWidth={2}/>
    <rect x={-w / 2 + 48} y={36} width={5} height={18} fill={pal.ink}/><circle cx={-w / 2 + 50.5} cy={62} r={3} fill={pal.ink}/>
    <text x={-w / 2 + 90} y={44} fontFamily={FONT.body} fontSize={25} fontWeight={800} fill={pal.ink}>Flash Flood</text>
    <text x={-w / 2 + 90} y={74} fontFamily={FONT.body} fontSize={25} fontWeight={800} fill={pal.ink}>Warning</text>
    <text x={-w / 2 + 28} y={124} fontFamily={FONT.body} fontSize={19} fontWeight={700} fill="#5A5249">Emergency alert</text>
   </g>}
  </g>
  {/* earpiece slot and side buttons */}
  <rect x={-24} y={-h / 2 + 4} width={48} height={5} rx={2.5} fill="#2F261D"/>
  <rect x={w / 2} y={-h / 2 + 80} width={4} height={40} rx={2} fill="#2F261D"/>
  {b > 0 && b < 1 && <g opacity={Math.sin(Math.PI * b)}>{[0, 1].map(k => <path key={k} d={`M${-w / 2 - 14 - k * 12} ${-40}Q${-w / 2 - 24 - k * 12} 0 ${-w / 2 - 14 - k * 12} 40`} stroke={pal.accent} strokeWidth={4} fill="none"/>)}</g>}
  <path d={`M${-w / 2 + 6} ${-h / 2 + 30}V${h / 2 - 30}`} stroke="#8B7660" strokeWidth={2} opacity={.4 + .1 * Math.sin(t)}/>
 </g>;
};

/** Brown flood water: a far surface line with live ripples and a lobed, hand-drawn near edge. */
const Water: React.FC<{x0: number; x1: number; y: number; depth: number; t: number; seed?: number; edge?: 'lobed' | 'straight'; opacity?: number}> =
 ({x0, x1, y, depth, t, seed = 11, edge = 'lobed', opacity = .92}) => {
 const id = useUid('saw');
 const r = rng(seed);
 const n = 28;
 const phases = Array.from({length: n + 1}, () => r() * 6.28);
 const lobes = Array.from({length: n + 1}, () => r());
 const top = Array.from({length: n + 1}, (_, i) => {const x = lerp(x0, x1, i / n); return [x, y + 2.2 * Math.sin(t * 2.1 + phases[i]) + 1.4 * Math.sin(x * .05 + t * 1.3)] as Pt;});
 const bot = Array.from({length: n + 1}, (_, i) => {const x = lerp(x1, x0, i / n);
  const k = n - i; const lobe = edge === 'lobed' ? depth * (.08 * Math.sin(k * 1.7 + 1) + .1 * (lobes[k] - .5)) + 2 * Math.sin(t * 1.4 + phases[k]) : 0;
  return [x, y + depth + lobe] as Pt;});
 const d = 'M' + [...top, ...bot].map(p => p.map(v => v.toFixed(1)).join(' ')).join('L') + 'Z';
 const debris = Array.from({length: 7}, () => [r(), r(), r()]);
 return <g data-part="flood-water" opacity={opacity}>
  <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
   <stop offset="0" stopColor={SA.waterLit}/><stop offset=".18" stopColor={SA.water}/><stop offset="1" stopColor={SA.waterDeep}/>
  </linearGradient></defs>
  <path d={d} fill={`url(#${id})`}/>
  <path d={'M' + top.map(p => p.map(v => v.toFixed(1)).join(' ')).join('L')} stroke={SA.foam} strokeWidth={2.4} fill="none" opacity={.75}/>
  {/* reflected sky streaks drifting on the surface */}
  {[.2, .45, .7].map((u, i) => <path key={i} d={`M${lerp(x0, x1, (u + .03 * Math.sin(t * .6 + i)) % 1)} ${y + depth * (.2 + i * .18)}h${(x1 - x0) * .08}`} stroke="#E2E6E0" strokeWidth={2} opacity={.28}/>)}
  {/* a leaf and foam drift slowly left to right */}
  {debris.map(([a, b, c], i) => {const x = lerp(x0, x1, (a + t * .015 * (1 + c)) % 1), yy = y + 6 + b * depth * .7;
   return i % 2 ? <ellipse key={i} cx={x} cy={yy} rx={8 + c * 6} ry={2.6} fill={SA.foam} opacity={.5}/>
    : <path key={i} d={`M${x} ${yy}q6 -5 12 0q-6 4 -12 0Z`} fill={i % 4 ? '#6B6A34' : '#8A5A2E'} opacity={.85}/>;})}
 </g>;
};

const CellTower: React.FC<{h?: number; dim?: number}> = ({h = 420, dim = 0}) => <g data-part="cell-tower" opacity={1 - .5 * dim}>
 <path d={`M-30 0L-6 ${-h}M30 0L6 ${-h}`} stroke="#5E6468" strokeWidth={5}/>
 {Array.from({length: 9}, (_, i) => {const y0 = -h * i / 9, y1 = -h * (i + 1) / 9, w0 = lerp(30, 6, i / 9), w1 = lerp(30, 6, (i + 1) / 9);
  return <path key={i} d={`M${-w0} ${y0}L${w1} ${y1}M${w0} ${y0}L${-w1} ${y1}M${-w0} ${y0}H${w0}`} stroke="#6E7579" strokeWidth={2}/>;})}
 {[-1, 0, 1].map(k => <rect key={k} x={k * 16 - 5} y={-h - 30} width={10} height={36} rx={2} fill="#B9BEC0" stroke="#5E6468" strokeWidth={1.4}/>)}
 <circle cx={0} cy={-h - 40} r={5} fill="#7A2A20"/>
</g>;

const Server: React.FC<{w?: number; h?: number; dark?: number; pal: Pal}> = ({w = 220, h = 300, dark = 1, pal}) => <g data-part="central-server-outline">
 <rect x={-w / 2} y={-h} width={w} height={h} rx={12} fill={pal.paper} opacity={.18} stroke={pal.ink} strokeWidth={4} strokeDasharray="16 12"/>
 {Array.from({length: 6}, (_, i) => <g key={i}>
  <rect x={-w / 2 + 20} y={-h + 24 + i * 44} width={w - 40} height={30} rx={4} fill="none" stroke={pal.ink} strokeWidth={2.4} strokeDasharray="10 8" opacity={.75}/>
  <circle cx={w / 2 - 36} cy={-h + 39 + i * 44} r={4.5} fill={dark > .5 ? '#3E4446' : '#8FD6A0'}/>
 </g>)}
 <text x={0} y={36} textAnchor="middle" fontFamily={FONT.body} fontSize={32} fontWeight={800} fill={pal.ink}>Central server</text>
</g>;

const Hub: React.FC<{lamp?: number; pal: Pal}> = ({lamp = 0, pal}) => {
 const id = useUid('sah');
 return <g data-part="hub-building">
  <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
   <stop offset="0" stopColor={SA.lime}/><stop offset=".7" stopColor={SA.limeFace}/><stop offset="1" stopColor={SA.limeShade}/>
  </linearGradient></defs>
  <path d="M-40 6L520 30L540 50L-30 24Z" fill="#1E1A16" opacity={.22}/>
  {/* a low limestone block building, flat roof with a parapet, a steel door and one window */}
  <rect x={-200} y={-220} width={400} height={224} fill={`url(#${id})`} stroke={SA.limeDeep} strokeWidth={2}/>
  {Array.from({length: 7}, (_, i) => <path key={i} d={`M-200 ${-190 + i * 30}H200`} stroke={SA.limeShade} strokeWidth={1.4} opacity={.6}/>)}
  {Array.from({length: 14}, (_, i) => <path key={'v' + i} d={`M${-190 + (i * 57) % 380} ${-220 + Math.floor(i / 2) * 30}v30`} stroke={SA.limeShade} strokeWidth={1.2} opacity={.5}/>)}
  <rect x={-214} y={-238} width={428} height={22} fill={SA.limeFace} stroke={SA.limeDeep} strokeWidth={2}/>
  <rect x={-150} y={-150} width={74} height={154} fill="#5B6468" stroke="#3B4246" strokeWidth={3}/>
  <circle cx={-88} cy={-74} r={4} fill="#C9C5BA"/>
  <rect x={0} y={-160} width={130} height={80} fill="#6C7E86" stroke={SA.trim} strokeWidth={8}/>
  <path d="M8 -152L120 -88" stroke="#B9CBD2" strokeWidth={6} opacity={.35}/>
  <rect x={130} y={-276} width={56} height={38} rx={4} fill="#B7BCBC" stroke="#6E7578" strokeWidth={2}/>
  {/* small sign plate */}
  <rect x={-60} y={-196} width={86} height={34} rx={4} fill={pal.paper} stroke={pal.ink} strokeWidth={2}/>
  <text x={-17} y={-171} textAnchor="middle" fontFamily={FONT.body} fontSize={22} fontWeight={800} fill={pal.ink}>Hub</text>
  {/* rooftop lattice mast and its antenna, a lamp that lights when a signal lands */}
  <g transform="translate(-130 -238)" data-part="hub-mast">
   <path d="M-12 0L-3 -300M12 0L3 -300" stroke="#5E6468" strokeWidth={4}/>
   {Array.from({length: 8}, (_, i) => {const y0 = -300 * i / 8, y1 = -300 * (i + 1) / 8, a = lerp(12, 3, i / 8), b2 = lerp(12, 3, (i + 1) / 8);
    return <path key={i} d={`M${-a} ${y0}L${b2} ${y1}M${a} ${y0}L${-b2} ${y1}`} stroke="#7B8285" strokeWidth={1.6}/>;})}
   <path d="M0 -300L4 -380" stroke="#1E2224" strokeWidth={4} strokeLinecap="round"/>
   {lamp > 0 && <circle cx={4} cy={-384} r={10 + 30 * lamp} fill={pal.accent} opacity={.45 * lamp}/>}
   <circle cx={4} cy={-384} r={7} fill={lamp > 0 ? pal.accent : '#5A3A2A'}/>
  </g>
 </g>;
};

const House: React.FC<{w?: number; seed?: number; color?: string}> = ({w = 300, seed = 1, color = '#D8CDB8'}) => {
 const r = rng(seed);
 const h = w * .62, roof = w * .3 + r() * w * .05;
 return <g data-part="bungalow">
  <path d={`M${w * .1} 4L${w * 1.3} 10L${w * 1.25} 22L${w * .1} 16Z`} fill="#1E1A16" opacity={.18}/>
  <rect x={0} y={-h} width={w} height={h} fill={color} stroke="#8E8473" strokeWidth={2}/>
  <rect x={w * .72} y={-h} width={w * .28} height={h} fill="#000" opacity={.12}/>
  <path d={`M${-w * .06} ${-h}L${w * .5} ${-h - roof}L${w * 1.06} ${-h}Z`} fill={r() > .5 ? '#5E5650' : '#6B5D50'} stroke="#3E3833" strokeWidth={2}/>
  <path d={`M${-w * .06} ${-h}L${w * .5} ${-h - roof}`} stroke="#9A8F84" strokeWidth={2} opacity={.6}/>
  <rect x={w * .12} y={-h * .7} width={w * .24} height={h * .38} fill="#56656B" stroke="#F1ECE0" strokeWidth={5}/>
  <rect x={w * .58} y={-h * .72} width={w * .2} height={h * .72} fill="#6A4E38" stroke="#F1ECE0" strokeWidth={4}/>
  <path d={`M${w * .02} ${-h * .12}H${w * .98}`} stroke="#F1ECE0" strokeWidth={5}/>
 </g>;
};

const Rings: React.FC<{p: number; rx: number; ry: number; n?: number; pal: Pal; width?: number}> = ({p, rx, ry, n = 3, pal, width = 5}) =>
 <g data-part="radio-rings">
  {Array.from({length: n}, (_, i) => {const u = clamp(p * (1 + (n - 1) * .22) - i * .22); if (u <= 0 || u >= 1) return null;
   return <ellipse key={i} cx={0} cy={0} rx={rx * u} ry={ry * u} fill="none" stroke={pal.accent} strokeWidth={width * (1.4 - .6 * u)} opacity={.9 * (1 - u * .7)}/>;})}
 </g>;

/** The hub desk: monitor with the dashboard on it, keyboard, mug, notes and a responder's sleeved forearm. */
const Desk: React.FC<{arm?: number; children?: React.ReactNode; screen: [number, number, number, number]}> = ({arm = 1, children, screen}) => {
 const id = useUid('sad');
 const [sx, sy, sw, sh] = screen;
 const a = ease(arm);
 return <g data-part="hub-desk">
  <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
   <stop offset="0" stopColor={SA.deskLit}/><stop offset="1" stopColor={SA.desk}/>
  </linearGradient></defs>
  {/* desk top and its front edge */}
  <path d="M-60 1180L1140 1150L1140 1460L-60 1460Z" fill={`url(#${id})`}/>
  <path d="M-60 1180L1140 1150" stroke="#C9AE8C" strokeWidth={4}/>
  <path d="M-60 1460H1140V1560H-60Z" fill={SA.deskShade}/>
  {/* monitor on its stand */}
  <path d={`M${sx + sw / 2 - 70} 1196L${sx + sw / 2 + 90} 1192L${sx + sw / 2 + 70} 1170L${sx + sw / 2 - 50} 1172Z`} fill="#2B2E30"/>
  <rect x={sx + sw / 2 - 18} y={sy + sh} width={40} height={1172 - sy - sh} fill="#33373A"/>
  <rect x={sx - 22} y={sy - 22} width={sw + 44} height={sh + 44} rx={14} fill="#26292B" stroke="#121415" strokeWidth={3}/>
  <rect x={sx - 22} y={sy - 22} width={sw + 44} height={10} rx={5} fill="#4A4F52" opacity={.6}/>
  <svg x={sx} y={sy} width={sw} height={sh} viewBox={`0 0 ${sw} ${sh}`} overflow="hidden">{children}</svg>
  <rect x={sx} y={sy} width={sw} height={sh} fill="none" stroke="#000" strokeOpacity={.4} strokeWidth={2}/>
  {/* keyboard, a chipped mug and a note pad with a pencil */}
  <path d="M250 1300L690 1290L702 1350L246 1362Z" fill="#3A3E41" stroke="#202325" strokeWidth={2}/>
  {Array.from({length: 4}, (_, row) => <path key={row} d={`M${262 + row * 2} ${1306 + row * 13}L${688 + row * 3} ${1297 + row * 13}`} stroke="#5C6164" strokeWidth={7} strokeDasharray="22 6"/>)}
  <g transform="translate(860 1268)">
   <ellipse cx={0} cy={60} rx={56} ry={12} fill="#1E1A16" opacity={.25}/>
   <path d="M-40 0V56Q0 70 40 56V0Z" fill="#E8E2D2" stroke="#9C9384" strokeWidth={2}/>
   <ellipse cx={0} cy={0} rx={40} ry={10} fill="#4A3020"/>
   <path d="M40 12Q66 16 62 34Q58 48 40 46" stroke="#E8E2D2" strokeWidth={9} fill="none"/>
   <path d="M-40 6L-34 0L-30 8Z" fill="#9C9384"/>
  </g>
  <g transform="translate(70 1250) rotate(-5)">
   <rect x={0} y={0} width={150} height={110} fill="#F4EEDC" stroke="#B9AE96" strokeWidth={2}/>
   {[0, 1, 2, 3].map(k => <path key={k} d={`M14 ${26 + k * 22}H${120 - k * 14}`} stroke="#9EB4C8" strokeWidth={2}/>)}
   <path d="M120 96L190 40" stroke="#D9A23A" strokeWidth={8} strokeLinecap="round"/>
  </g>
  {/* the responder's forearm: a navy work jacket sleeve with a reflective band, a dark work glove */}
  {/* the arm is attached off frame at the right; it swings down about the elbow and comes to rest */}
  <g transform={`rotate(${lerp(-22, 0, a)} 1190 1430) translate(${lerp(40, 0, a)} 0)`} data-part="responder-forearm">
   <ellipse cx={760} cy={1400} rx={170} ry={22} fill="#1E1A16" opacity={.28}/>
   <path d="M1140 1330Q900 1336 760 1360Q720 1368 712 1392Q720 1418 770 1418Q930 1410 1140 1420Z" fill={SA.sleeve}/>
   <path d="M1140 1340Q920 1344 790 1366" stroke="#41567A" strokeWidth={6} fill="none" opacity={.8}/>
   <path d="M880 1352Q872 1386 884 1416" stroke={SA.reflect} strokeWidth={16} fill="none"/>
   <path d="M760 1360Q732 1366 728 1392Q732 1414 768 1416" stroke={SA.sleeveShade} strokeWidth={10} fill="none"/>
   <path d="M716 1366Q660 1360 618 1374Q600 1382 606 1396Q616 1408 660 1406Q700 1406 722 1404Z" fill={SA.glove}/>
   <path d="M622 1376Q600 1382 590 1392Q596 1400 616 1398" stroke="#3E3A36" strokeWidth={8} fill="none" strokeLinecap="round"/>
   <path d="M660 1366Q690 1362 712 1370" stroke="#4E4842" strokeWidth={3} fill="none"/>
  </g>
 </g>;
};

/** The dashboard map drawn in screen units w by h: streets, a creek, station dots, flood paths and zones. */
const Dashboard: React.FC<{w: number; h: number; dots?: number; paths?: number; zones?: number; t?: number; pal: Pal; header?: boolean}> =
 ({w, h, dots = 0, paths = 0, zones = 0, t = 0, pal, header = true}) => {
 const id = useUid('sadb');
 const r = rng(21);
 const creek: Pt[] = [[-.05, .62], [.18, .58], [.32, .66], [.5, .6], [.64, .7], [.82, .64], [1.05, .74]].map(([x, y]) => [x * w, y * h] as Pt);
 const sx = Array.from({length: 7}, (_, i) => w * (.08 + i * .14 + (r() - .5) * .03));
 const sy = Array.from({length: 5}, (_, i) => h * (.2 + i * .17 + (r() - .5) * .03));
 const stations: Pt[] = [[.16, .56], [.36, .64], [.55, .57], [.72, .67], [.86, .62], [.46, .36]].map(([x, y]) => [x * w, y * h] as Pt);
 const spread = ease(paths);
 // flood paths: shaded lobes that grow out from the creek along the low streets, from the first dots
 const lobes: [Pt, number, number, number][] = [[[.2, .6], .16, .07, 0], [[.38, .66], .14, .08, .1], [[.56, .6], .18, .09, .2], [[.74, .68], .15, .07, .3], [[.47, .5], .07, .12, .4], [[.9, .7], .12, .06, .45]]
  .map(([c, rx, ry, delay]) => [[(c as Pt)[0] * w, (c as Pt)[1] * h] as Pt, (rx as number) * w, (ry as number) * h, delay as number]);
 const zonesBox: [number, number, number, number, number][] = [[.1, .5, .24, .2, -3], [.48, .5, .2, .24, 2], [.66, .58, .24, .18, -1]];
 return <g data-part="dashboard-map">
  <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
   <stop offset="0" stopColor={SA.slateLit}/><stop offset="1" stopColor={SA.slate}/>
  </linearGradient>
  <radialGradient id={id + 'f'} cx=".5" cy=".5" r=".5"><stop offset="0" stopColor={SA.water} stopOpacity={.95}/><stop offset=".7" stopColor="#9A6A36" stopOpacity={.7}/><stop offset="1" stopColor="#C88A3A" stopOpacity={0}/></radialGradient></defs>
  <rect x={0} y={0} width={w} height={h} fill={`url(#${id})`}/>
  {/* blocks, streets and the creek */}
  {sx.map((x, i) => <path key={'x' + i} d={`M${x} ${h * .1}L${x + (i % 2 ? 10 : -8)} ${h}`} stroke={SA.street} strokeWidth={i === 3 ? 7 : 4} opacity={.7}/>)}
  {sy.map((y, i) => <path key={'y' + i} d={`M0 ${y}L${w} ${y + (i % 2 ? 12 : -6)}`} stroke={SA.street} strokeWidth={i === 2 ? 7 : 4} opacity={.7}/>)}
  <path d={'M' + creek.map(p => p.join(' ')).join('L')} stroke={SA.creek} strokeWidth={12} fill="none" strokeLinejoin="round" opacity={.9}/>
  {lobes.map(([c, rx, ry, delay], i) => {const g = clamp((spread - delay) / (1 - delay)); return g > 0 &&
   <ellipse key={'f' + i} cx={c[0]} cy={c[1]} rx={rx * g} ry={ry * g} fill={`url(#${id}f)`} opacity={.9}/>;})}
  {zones > 0 && zonesBox.map(([x, y, bw, bh, rot], i) => {const g = clamp(zones * 1.5 - i * .25);
   return g > 0 && <rect key={'z' + i} x={x * w} y={y * h} width={bw * w} height={bh * h} rx={14} fill="none" stroke={pal.accent}
    strokeWidth={5} strokeDasharray={`${20 * g} ${14}`} transform={`rotate(${rot} ${(x + bw / 2) * w} ${(y + bh / 2) * h})`} opacity={g}/>;})}
  {stations.map(([x, y], i) => {const g = clamp(dots * 1.6 - i * .12); return g > 0 && <g key={'s' + i} transform={`translate(${x} ${y}) scale(${ease(g)})`}>
   <circle cx={0} cy={0} r={22 * (1 + .2 * Math.sin(t * 3 + i))} fill={pal.accent} opacity={.18}/>
   <circle cx={0} cy={0} r={11} fill="#F5F0E3" stroke={pal.accent} strokeWidth={4}/>
  </g>;})}
  {header && <g>
   <rect x={0} y={0} width={w} height={Math.max(h * .1, 64)} fill="#121A1D" opacity={.85}/>
   <text x={w * .04} y={Math.max(h * .1, 64) * .7} fontFamily={FONT.body} fontSize={Math.max(h * .055, 38)} fontWeight={800} fill="#E9E4D6">Flood spread map</text>
   {zones > 0 && <g opacity={clamp(zones * 2)}>
    <rect x={w * .64} y={h * .028} width={w * .045} height={h * .045} rx={4} fill="none" stroke={pal.accent} strokeWidth={3} strokeDasharray="8 5"/>
    <text x={w * .7} y={Math.max(h * .1, 64) * .68} fontFamily={FONT.body} fontSize={Math.max(h * .042, 30)} fontWeight={700} fill="#E9E4D6">Higher risk</text>
   </g>}
  </g>}
 </g>;
};

/** The overhead radio map: a city grid upper left, open country lower right, the station and the hub. */
const RadioMap: React.FC<{w: number; h: number; ring?: number; half?: number; five?: number; hub?: number; pal: Pal; station: Pt; hubAt: Pt}> =
 ({w, h, ring = 0, half = 0, five = 0, hub = 0, pal, station, hubAt}) => {
 const id = useUid('sarm');
 const r = rng(31);
 const reach = Math.hypot(hubAt[0] - station[0], hubAt[1] - station[1]);
 const halfR = reach * .1;
 return <g data-part="radio-map">
  <defs><clipPath id={id}><rect x={0} y={0} width={w} height={h} rx={18}/></clipPath></defs>
  <rect x={6} y={10} width={w} height={h} rx={18} fill="#1E1A16" opacity={.2}/>
  <rect x={0} y={0} width={w} height={h} rx={18} fill="#E9E2CF" stroke={pal.ink} strokeWidth={3}/>
  <g clipPath={`url(#${id})`}>
   {/* open country: field strips and a section road */}
   {Array.from({length: 9}, (_, i) => <path key={'f' + i} d={`M${w * .35 + i * 70} ${h}L${w * .5 + i * 90} ${h * .3}`} stroke="#C9C09A" strokeWidth={30} opacity={.35}/>)}
   <path d={`M0 ${h * .55}Q${w * .5} ${h * .5} ${w} ${h * .62}`} stroke="#B9AE8E" strokeWidth={10} fill="none"/>
   {/* the city grid around the station */}
   {Array.from({length: 8}, (_, i) => <path key={'gx' + i} d={`M${station[0] - 260 + i * 70 + r() * 8} ${station[1] - 300}V${station[1] + 280}`} stroke="#B3AA92" strokeWidth={6}/>)}
   {Array.from({length: 9}, (_, i) => <path key={'gy' + i} d={`M${station[0] - 280} ${station[1] - 300 + i * 66 + r() * 8}H${station[0] + 250}`} stroke="#B3AA92" strokeWidth={6}/>)}
   {Array.from({length: 18}, (_, i) => <rect key={'b' + i} x={station[0] - 252 + (i % 6) * 70 + 8} y={station[1] - 290 + Math.floor(i / 6) * 132 + 10} width={50} height={40} fill="#D3C8AE" opacity={.8}/>)}
   <path d={`M${-20} ${h * .2}Q${w * .3} ${h * .34} ${w * .45} ${h * .3}T${w + 20} ${h * .46}`} stroke={SA.creek} strokeWidth={9} fill="none" opacity={.8}/>
   {/* the rings */}
   {ring > 0 && [0, 1, 2].map(k => {const u = clamp(ring * 1.3 - k * .15); return u > 0 && u < 1 &&
    <circle key={k} cx={station[0]} cy={station[1]} r={reach * 1.05 * u} fill="none" stroke={pal.accent} strokeWidth={6 - 3 * u} opacity={.9 * (1 - .6 * u)}/>;})}
   {half > 0 && <circle cx={station[0]} cy={station[1]} r={halfR} fill="none" stroke={pal.ink} strokeWidth={3} strokeDasharray="10 8" opacity={half}/>}
   {five > 0 && <circle cx={station[0]} cy={station[1]} r={reach} fill="none" stroke={pal.ink} strokeWidth={3} strokeDasharray="14 10" opacity={five}/>}
  </g>
  {/* the station dot and the hub */}
  <circle cx={station[0]} cy={station[1]} r={16} fill={pal.paper} stroke={pal.ink} strokeWidth={4}/>
  <circle cx={station[0]} cy={station[1]} r={7} fill={pal.accent}/>
  <g transform={`translate(${hubAt[0]} ${hubAt[1]})`}>
   {hub > 0 && <circle cx={0} cy={0} r={30 + 30 * hub} fill={pal.accent} opacity={.3 * hub}/>}
   <rect x={-22} y={-16} width={44} height={32} rx={4} fill={pal.paper} stroke={pal.ink} strokeWidth={4}/>
   <path d="M-8 -16V-40M-8 -40L-2 -50" stroke={pal.ink} strokeWidth={4}/>
  </g>
 </g>;
};

/** The validation card: title, the reported figure (passed in verbatim from the claim) and its bar. */
const Card: React.FC<{fill?: number; value: string; share: number; pal: Pal}> = ({fill = 0, value, share, pal}) => {
 const w = 640, h = 380, f = clamp(fill);
 return <g data-part="validation-card">
  <rect x={10} y={14} width={w} height={h} rx={14} fill="#1E1A16" opacity={.25}/>
  <rect x={0} y={0} width={w} height={h} rx={14} fill={SA.paper} stroke={pal.ink} strokeWidth={3}/>
  <path d={`M${w - 46} 0L${w} 0L${w} 40Z`} fill={SA.paperShade}/>
  <text x={40} y={74} fontFamily={FONT.body} fontSize={44} fontWeight={800} fill={pal.ink}>Validation accuracy</text>
  <rect x={40} y={210} width={w - 80} height={56} rx={10} fill="#D9D0BC" stroke={pal.ink} strokeWidth={2.4}/>
  <rect x={40} y={210} width={(w - 80) * share * f} height={56} rx={10} fill={pal.accent}/>
  {f > 0 && <rect x={40 + (w - 80) * share * f - 6} y={204} width={6} height={68} fill={pal.ink} opacity={.7}/>}
  <text x={40} y={176} fontFamily={FONT.body} fontSize={84} fontWeight={800} fill={pal.ink} opacity={clamp((f - .3) * 2.5)}>{value}</text>
  <text x={40} y={330} fontFamily={FONT.body} fontSize={30} fontWeight={600} fill="#5A5249">Reported by the university</text>
 </g>;
};

const Result: React.FC<{stamp?: number; pal: Pal}> = ({stamp = 0, pal}) => {
 const w = 560, h = 420, s = clamp(stamp), k = lerp(1.4, 1, ease(s * 1.6));
 return <g data-part="field-result-card">
  <rect x={10} y={14} width={w} height={h} rx={14} fill="#1E1A16" opacity={.25}/>
  <rect x={0} y={0} width={w} height={h} rx={14} fill="#F6F1E4" stroke={pal.ink} strokeWidth={3}/>
  <text x={40} y={74} fontFamily={FONT.body} fontSize={44} fontWeight={800} fill={pal.ink}>Field result</text>
  {[0, 1, 2, 3].map(i => <path key={i} d={`M40 ${150 + i * 56}H${w - 50 - (i % 2) * 40}`} stroke="#C9BFA8" strokeWidth={3}/>)}
  {s > 0 && <g transform={`translate(${w / 2} 250) scale(${k}) rotate(-6)`} opacity={clamp(s * 2.5)} data-part="none-reported-stamp">
   <rect x={-200} y={-50} width={400} height={100} rx={12} fill="none" stroke={pal.ink} strokeWidth={7}/>
   <text x={0} y={18} textAnchor="middle" fontFamily={FONT.body} fontSize={50} fontWeight={800} fill={pal.ink}>None reported</text>
  </g>}
 </g>;
};

/** The paper street map with no pin on it; a search ring and a dashed goal pin come and go. */
const MapCard: React.FC<{w: number; h: number; search?: number; goal?: number; spot?: number; pal: Pal; seed?: number}> = ({w, h, search = 0, goal = 0, spot = 0, pal, seed = 41}) => {
 const id = useUid('samc');
 const r = rng(seed);
 const c: Pt = [w * .55, h * .48];
 return <g data-part="empty-map-card">
  <defs><clipPath id={id}><rect x={0} y={0} width={w} height={h} rx={12}/></clipPath></defs>
  <rect x={8} y={12} width={w} height={h} rx={12} fill="#1E1A16" opacity={.22}/>
  <rect x={0} y={0} width={w} height={h} rx={12} fill={SA.paper} stroke={pal.ink} strokeWidth={3}/>
  <g clipPath={`url(#${id})`}>
   {Array.from({length: 8}, (_, i) => <path key={'x' + i} d={`M${w * (.06 + i * .13 + (r() - .5) * .03)} 0L${w * (.04 + i * .13)} ${h}`} stroke="#CFC4AA" strokeWidth={i === 4 ? 9 : 5}/>)}
   {Array.from({length: 7}, (_, i) => <path key={'y' + i} d={`M0 ${h * (.08 + i * .14 + (r() - .5) * .03)}L${w} ${h * (.1 + i * .14)}`} stroke="#CFC4AA" strokeWidth={i === 3 ? 9 : 5}/>)}
   {Array.from({length: 22}, (_, i) => <rect key={'b' + i} x={w * (.08 + (i % 7) * .13)} y={h * (.11 + Math.floor(i / 7) * .28)} width={w * .08} height={h * .07} fill="#E3D9C2"/>)}
   <path d={`M-10 ${h * .7}Q${w * .25} ${h * .6} ${w * .45} ${h * .72}T${w + 10} ${h * .64}`} stroke={SA.creek} strokeWidth={10} fill="none" opacity={.75}/>
   {search > 0 && search < 1 && <g opacity={Math.sin(Math.PI * search)}>
    <circle cx={c[0]} cy={c[1]} r={Math.max(w, h) * .7 * ease(search)} fill="none" stroke={pal.ink} strokeWidth={4} strokeDasharray="12 10"/>
    <circle cx={c[0]} cy={c[1]} r={Math.max(w, h) * .45 * ease(search)} fill="none" stroke={pal.ink} strokeWidth={2.4} opacity={.6}/>
   </g>}
  </g>
  {spot > 0 && <ellipse cx={c[0]} cy={c[1] + h * .03} rx={w * .09} ry={w * .035} fill="none" stroke={pal.accent} strokeWidth={Math.max(3, w * .008)}
   strokeDasharray={`${w * .02} ${w * .015}`} opacity={clamp(spot * 2)} transform={`rotate(${-8 * (1 - ease(spot))} ${c[0]} ${c[1]})`} data-part="empty-spot"/>}
  {goal > 0 && <g transform={`translate(${c[0]} ${c[1] - (70 + 30 * (1 - ease(goal)) - 6 * Math.sin(goal * 9)) * w / 840}) scale(${w / 840})`} opacity={clamp(goal * 2)} data-part="dashed-goal-pin">
   <path d="M0 64Q-40 10 -40 -14A40 40 0 1 1 40 -14Q40 10 0 64Z" fill={pal.paper} fillOpacity={.35} stroke={pal.accent} strokeWidth={6} strokeDasharray="12 9"/>
   <circle cx={0} cy={-14} r={13} fill="none" stroke={pal.accent} strokeWidth={5} strokeDasharray="7 6"/>
   <ellipse cx={0} cy={76} rx={22} ry={6} fill="none" stroke={pal.accent} strokeWidth={3} strokeDasharray="6 5"/>
  </g>}
 </g>;
};

/** A pair of worn rubber rain boots left on the bottom step: an ankle-height reference with no person. */
const Boots: React.FC = () => <g data-part="rain-boots">
 <ellipse cx={70} cy={4} rx={90} ry={9} fill="#1E1A16" opacity={.25}/>
 {[0, 1].map(k => <g key={k} transform={`translate(${k * 58} ${k * 3}) rotate(${k ? 4 : -3})`}>
  <path d="M0 0V-96Q0 -104 8 -104H40Q46 -104 46 -96V-30Q70 -26 76 -12V0Z" fill="#3E4A3A" stroke="#222A21" strokeWidth={2.4}/>
  <path d="M6 -98H40" stroke="#6C7A62" strokeWidth={4} opacity={.8}/>
  <path d="M2 -6H74" stroke="#222A21" strokeWidth={5}/>
  <path d="M10 -90V-40" stroke="#5B6852" strokeWidth={3} opacity={.7}/>
 </g>)}
</g>;

const Rain: React.FC<{t: number; w: number; h: number; seed?: number; n?: number; opacity?: number}> = ({t, w, h, seed = 51, n = 40, opacity = .35}) => {
 const r = rng(seed);
 const drops = Array.from({length: n}, () => [r(), r(), .7 + r() * .6]);
 return <g data-part="rain" opacity={opacity}>
  {drops.map(([x, y, s], i) => {const yy = ((y + t * .9 * s) % 1) * h, xx = x * w - yy * .18;
   return <path key={i} d={`M${xx} ${yy}l-8 ${30 * s}`} stroke="#DDE6EA" strokeWidth={2} strokeLinecap="round"/>;})}
 </g>;
};

const SupportTag: React.FC<{text: string; pal: Pal; size?: number; tone?: 'paper' | 'accent' | 'ink'}> = ({text, pal, size = 30, tone = 'paper'}) => {
 const w = widthOf(text, size, true) + 34, h = size + 24;
 const fill = tone === 'accent' ? pal.accent : tone === 'ink' ? pal.ink : pal.paper, col = tone === 'ink' ? pal.paper : pal.ink;
 return <g data-part="label">
  <rect x={4} y={6} width={w} height={h} rx={10} fill="#1E1A16" opacity={.2}/>
  <rect x={0} y={0} width={w} height={h} rx={10} fill={fill} stroke={pal.ink} strokeWidth={2.4}/>
  <text x={17} y={h / 2 + size * .36} fontFamily={FONT.body} fontSize={size} fontWeight={800} fill={col}>{text}</text>
 </g>;
};

type SupportProps =
 | {part: 'street'; x0: number; x1: number; yFar: number; yNear: number; t?: number}
 | {part: 'curb'; x0: number; y0: number; x1: number; y1: number; h?: number; seed?: number}
 | {part: 'lawn'; d: string; seed?: number; box: [number, number, number, number]}
 | {part: 'fence'; x0: number; x1: number; h?: number; posts?: number; lean?: number; mark?: number}
 | {part: 'oak'; h?: number; seed?: number; flip?: boolean}
 | {part: 'porch'; w?: number}
 | {part: 'phone'; banner?: number; t?: number; pal: Pal; w?: number}
 | {part: 'water'; x0: number; x1: number; y: number; depth: number; t: number; seed?: number; edge?: 'lobed' | 'straight'; opacity?: number}
 | {part: 'tower'; h?: number; dim?: number}
 | {part: 'server'; w?: number; h?: number; dark?: number; pal: Pal}
 | {part: 'hub'; lamp?: number; pal: Pal}
 | {part: 'house'; w?: number; seed?: number; color?: string}
 | {part: 'rings'; p: number; rx: number; ry: number; n?: number; pal: Pal; width?: number}
 | {part: 'desk'; arm?: number; children?: React.ReactNode; screen: [number, number, number, number]}
 | {part: 'dashboard'; w: number; h: number; dots?: number; paths?: number; zones?: number; t?: number; pal: Pal; header?: boolean}
 | {part: 'radiomap'; w: number; h: number; ring?: number; half?: number; five?: number; hub?: number; pal: Pal; station: Pt; hubAt: Pt}
 | {part: 'card'; fill?: number; value: string; share: number; pal: Pal}
 | {part: 'result'; stamp?: number; pal: Pal}
 | {part: 'mapcard'; w: number; h: number; search?: number; goal?: number; spot?: number; pal: Pal; seed?: number}
 | {part: 'boots'; seed?: number}
 | {part: 'rain'; t: number; w: number; h: number; seed?: number; n?: number; opacity?: number}
 | {part: 'label'; text: string; pal: Pal; size?: number; tone?: 'paper' | 'accent' | 'ink'};

/** The support group's one export: the street, the yard, the hub and its papers. */
export const StreetHubSupport: React.FC<SupportProps> = (props) => {
 switch (props.part) {
 case 'street': return <Street {...props}/>;
 case 'curb': return <Curb {...props}/>;
 case 'lawn': return <Lawn {...props}/>;
 case 'fence': return <Fence {...props}/>;
 case 'oak': return <Oak {...props}/>;
 case 'porch': return <Porch {...props}/>;
 case 'phone': return <Phone {...props}/>;
 case 'water': return <Water {...props}/>;
 case 'tower': return <CellTower {...props}/>;
 case 'server': return <Server {...props}/>;
 case 'hub': return <Hub {...props}/>;
 case 'house': return <House {...props}/>;
 case 'rings': return <Rings {...props}/>;
 case 'desk': return <Desk {...props}/>;
 case 'dashboard': return <Dashboard {...props}/>;
 case 'radiomap': return <RadioMap {...props}/>;
 case 'card': return <Card {...props}/>;
 case 'result': return <Result {...props}/>;
 case 'mapcard': return <MapCard {...props}/>;
 case 'boots': return <Boots/>;
 case 'rain': return <Rain {...props}/>;
 case 'label': return <SupportTag {...props}/>;
 }
 throw new Error('Unknown street and hub part');
};
