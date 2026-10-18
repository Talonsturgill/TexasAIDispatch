import React from 'react';
import {FONT, widthOf} from '../../../lib/type';
import {useUid} from '../../../lib/uid';

/**
 * StreetHubSupport, the fresh authored support group for the 2026-10-15 edition.
 *
 * The San Antonio world around the flood station and the places its warning goes. A wet asphalt
 * street with a hand-cut limestone curb and a dark gutter, a St. Augustine lawn with dormant brown
 * patches, a chain link fence whose second post carries an orange ankle-high paint band and a
 * swinging orange flagging tag, a live oak edge with low spreading limbs and grey ball moss, and the
 * corner of a painted bungalow porch with two steps and a rail where a worn phone lies screen up.
 *
 * FLOOD WATER IS FINISHED WATER. It is a surface, never a fill: the pale storm sky reflected near
 * its far edge, muddy brown under it, the mirrored posts, boots and lamps standing in it broken by
 * drifting ripple bands, a foam line along the far edge, a bright meniscus and a dark wet halo
 * along a spreading near edge, and drifting leaves and foam.
 *
 * The places the warning goes: a far cell tower; a distant, dark, windowless server building that
 * nothing reaches; a long street of bungalows that ends at the hub; a low limestone hub building
 * whose rooftop mast lamp and window light when a signal lands; the hub desk with a complete
 * seated responder (articulated shoulder, elbow, wrist and fingers, a head that turns to the
 * screen) and a flood path map of creek, streets, blocks and low points; a curb notice board
 * holding the validation card and the blank field result card; the paper street map with its
 * blank pin holes; and the curb folding table with a technician, a printed deployment plan and the
 * prototype's hard carry case with its front pocket and latch.
 *
 * Light matches the hero: low warm storm light from the upper left, cool fill from the right, long
 * soft shadows falling right. Nothing is symmetric. No logos, names, real streets, addresses,
 * agencies or measured values; the only figure drawn is the university's own reported validation
 * accuracy, passed in by the episode from its claim. People share one shape language: the same head
 * geometry for everyone, skin a fill that never changes the line work.
 *
 * Pure function of its props; the episode drives every prop from the film frame clock.
 */

type Pal = Record<'background'|'midground'|'foreground'|'ink'|'paper'|'hero'|'accent', string>;
export type P = [number, number];
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
 sky: '#CDD0C8', water: '#8E7856', waterDeep: '#6B5539', waterLit: '#B3AA92', foam: '#EFE8D8',
 oak: '#47552F', oakDark: '#2E3A20', oakLit: '#6F7E46', bark: '#4A3E33', barkLit: '#7C6C5C', moss: '#A7A895',
 siding: '#E6DDCB', sidingShade: '#BDB2A0', trim: '#F4F0E6', porchFloor: '#8F7A5E', step: '#B9AC94',
 chain: '#9AA1A3', chainShade: '#6E7578', paint: '#E8742A',
 screen: '#151A1E', banner: '#F0E7D4', alert: '#E3A32B',
 street: '#FAF8F2', creek: '#5F98AC',
 paper: '#F1EBDD', paperShade: '#D9D0BC', ink: '#232A30', line: '#2A2622',
 glove: '#2A2724', sleeve: '#2F3F56', sleeveShade: '#1F2B3C', reflect: '#CFCFC6',
 desk: '#8B6F51', deskLit: '#A88B69', deskShade: '#5E4935',
 cork: '#B98D5E', corkDark: '#93693F', wood: '#6B4E33', woodLit: '#8C6A49',
 case: '#2F3336', caseLit: '#4A5054', caseEdge: '#1A1C1E',
};
/** Where a phone lies on the porch rail, in the porch's own units. */
export const PORCH = {railTop: [168, -248] as P, w: 360};
/** The fence post that carries the ankle-high paint band and tag, in the fence's own units. */
export const FENCE = {markPostX: 128, markY: -26};
/** Mirror a drawing about a horizontal line: what a still water surface at y shows. */
export const mirrorAbout = (y: number, node: React.ReactNode) => <g transform={`matrix(1 0 0 -1 0 ${2 * y})`}>{node}</g>;

// ---- ground ------------------------------------------------------------------------------------
const Street: React.FC<{x0: number; x1: number; yFar: number; yNear: number; t?: number}> = ({x0, x1, yFar, yNear, t = 0}) => {
 const id = useUid('sas');
 const r = rng(7);
 return <g data-part="street">
  <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
   <stop offset="0" stopColor={SA.asphaltLit}/><stop offset=".35" stopColor={SA.asphalt}/><stop offset="1" stopColor={SA.asphaltWet}/>
  </linearGradient></defs>
  <rect x={x0} y={yFar} width={x1 - x0} height={yNear - yFar} fill={`url(#${id})`}/>
  <path d={`M${x0 + (x1 - x0) * .3} ${yFar + 4}Q${x0 + (x1 - x0) * .36} ${(yFar + yNear) / 2} ${x0 + (x1 - x0) * .33} ${yNear - 2}`} stroke="#2E2C2A" strokeWidth={2} fill="none" opacity={.6}/>
  {Array.from({length: 6}, (_, i) => {const x = x0 + r() * (x1 - x0), w = 40 + r() * 120, y = yFar + (.2 + r() * .6) * (yNear - yFar);
   return <ellipse key={i} cx={x + 6 * Math.sin(t * .8 + i)} cy={y} rx={w} ry={2 + r() * 3} fill="#CFD8DD" opacity={.18 + r() * .12}/>;})}
 </g>;
};

const Curb: React.FC<{x0: number; y0: number; x1: number; y1: number; h?: number; seed?: number}> = ({x0, y0, x1, y1, h = 22, seed = 3}) => {
 const r = rng(seed);
 const n = Math.max(3, Math.round(Math.hypot(x1 - x0, y1 - y0) / 140));
 const joints = Array.from({length: n - 1}, (_, i) => (i + 1 + (r() - .5) * .5) / n);
 const at = (u: number): P => [lerp(x0, x1, u), lerp(y0, y1, u)];
 return <g data-part="limestone-curb">
  <path d={`M${x0} ${y0 + h + 2}L${x1} ${y1 + h + 2}`} stroke="#2A2724" strokeWidth={6} opacity={.55}/>
  <path d={`M${x0} ${y0 - h * .55}L${x1} ${y1 - h * .55}L${x1} ${y1}L${x0} ${y0}Z`} fill={SA.lime}/>
  <path d={`M${x0} ${y0}L${x1} ${y1}L${x1} ${y1 + h}L${x0} ${y0 + h}Z`} fill={SA.limeFace}/>
  <path d={`M${x0} ${y0 - h * .55}L${x1} ${y1 - h * .55}`} stroke="#F6EEDB" strokeWidth={2} opacity={.8}/>
  {joints.map((u, i) => {const [x, y] = at(u); return <path key={i} d={`M${x} ${y - h * .55}L${x + 2} ${y + h}`} stroke={SA.limeShade} strokeWidth={2}/>;})}
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
   {Array.from({length: 140}, (_, i) => {const x = bx + r() * bw, y = by + r() * bh, s = 4 + (y - by) / bh * 12;
    return <path key={i} d={`M${x} ${y}l${-s * .3} ${-s}M${x + 2} ${y}l${s * .2} ${-s * .9}`} stroke={r() > .5 ? SA.grassDark : SA.grassLit} strokeWidth={1.6} opacity={.7}/>;})}
  </g>
 </g>;
};

/** Chain link fence. The mark post carries an orange ankle-high paint band and, hung from a wire
 * twist at that height, an orange flagging tag that swings by `sway` degrees. */
const Fence: React.FC<{x0: number; x1: number; h?: number; posts?: number; lean?: number; mark?: number; sway?: number}> = ({x0, x1, h = 300, posts = 3, lean = 2.5, mark = 1, sway = 0}) => {
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
     <rect x={x - 13} y={FENCE.markY - 11} width={26} height={22} fill={SA.paint} stroke="#F6EBDA" strokeWidth={2}/>
     <path d={`M${x - 2} ${FENCE.markY + 11}Q${x - 1} ${FENCE.markY + 19} ${x - 3} ${FENCE.markY + 26}`} stroke={SA.paint} strokeWidth={3.4} fill="none" strokeLinecap="round"/>
     <g data-part="ankle-tag" transform={`rotate(${sway} ${x + 12} ${FENCE.markY - 4})`}>
      <path d={`M${x + 7} ${FENCE.markY - 6}Q${x + 12} ${FENCE.markY - 12} ${x + 16} ${FENCE.markY - 5}`} stroke="#5E6468" strokeWidth={2.2} fill="none"/>
      <path d={`M${x + 12} ${FENCE.markY - 4}L${x + 12} ${FENCE.markY + 2}`} stroke="#5E6468" strokeWidth={1.8}/>
      <rect x={x + 3} y={FENCE.markY + 2} width={19} height={34} rx={3} fill={SA.paint} stroke="#9C4A16" strokeWidth={1.6}/>
      <rect x={x + 3} y={FENCE.markY + 2} width={6} height={34} rx={2} fill="#FFFFFF" opacity={.22}/>
      <circle cx={x + 12.5} cy={FENCE.markY + 8} r={2} fill="#F6EBDA"/>
     </g>
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
  <path d={`M${-h * .05} 0Q${-h * .02} ${-h * .25} ${h * .04} ${-h * .42}L${h * .1} ${-h * .4}Q${h * .06} ${-h * .22} ${h * .08} 0Z`} fill={SA.bark}/>
  <path d={`M${-h * .03} -6Q${-h * .01} ${-h * .25} ${h * .045} ${-h * .4}`} stroke={SA.barkLit} strokeWidth={h * .012} fill="none" opacity={.7}/>
  {[[-.5, -.55, .2], [.55, -.6, .16], [.25, -.75, .12], [-.2, -.78, .1]].map(([dx, dy, w], i) =>
   <path key={i} d={`M${h * .05} ${-h * .4}Q${h * dx * .5} ${-h * (.45 + i * .03)} ${h * dx} ${h * dy}`} stroke={SA.bark} strokeWidth={h * w * .18} fill="none" strokeLinecap="round"/>)}
  {[0, 1, 2, 3].map(k => <path key={'f' + k} d={`M${h * (.0 + k * .02)} ${-h * .05}Q${h * (.01 + k * .02)} ${-h * .2} ${h * (.04 + k * .015)} ${-h * .36}`} stroke="#2F2620" strokeWidth={1.6} fill="none" opacity={.6}/>)}
  {lobes.map(([x, y, rx, ry], i) => <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill={`url(#${id})`} opacity={.96}/>)}
  {lobes.slice(0, 14).map(([x, y, rx, ry], i) => <ellipse key={'l' + i} cx={x - rx * .25} cy={y - ry * .3} rx={rx * .45} ry={ry * .35} fill={SA.oakLit} opacity={.35}/>)}
  {Array.from({length: 7}, (_, i) => <circle key={'m' + i} cx={(r() - .3) * h * .8} cy={-h * (.42 + r() * .2)} r={h * .012 + r() * 4} fill={SA.moss} opacity={.85}/>)}
 </g>;
};

const Porch: React.FC<{w?: number}> = ({w = PORCH.w}) => {
 const id = useUid('sap');
 return <g data-part="porch">
  <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
   <stop offset="0" stopColor={SA.siding}/><stop offset="1" stopColor={SA.sidingShade}/>
  </linearGradient></defs>
  <rect x={-40} y={-620} width={w * .62} height={540} fill={`url(#${id})`}/>
  {Array.from({length: 18}, (_, i) => <path key={i} d={`M-40 ${-610 + i * 30}H${w * .62 - 40}`} stroke={SA.sidingShade} strokeWidth={2} opacity={.8}/>)}
  <rect x={20} y={-560} width={110} height={170} fill="#5F6F74" stroke={SA.trim} strokeWidth={10}/>
  <path d="M28 -552L120 -400" stroke="#9FB2B8" strokeWidth={8} opacity={.35}/>
  <path d={`M-40 -90H${w}L${w - 8} -64H-40Z`} fill={SA.porchFloor}/>
  <path d={`M-40 -90H${w}`} stroke="#B49B7B" strokeWidth={3}/>
  <path d={`M${w * .55} -64H${w * .92}V-34H${w * .55}Z`} fill={SA.step} stroke={SA.limeShade} strokeWidth={2}/>
  <path d={`M${w * .5} -34H${w * .97}V0H${w * .5}Z`} fill={SA.lime} stroke={SA.limeShade} strokeWidth={2}/>
  <rect x={w - 26} y={-330} width={22} height={240} fill={SA.trim} stroke={SA.sidingShade} strokeWidth={2}/>
  <rect x={-40} y={-262} width={w - 14} height={16} fill={SA.trim} stroke={SA.sidingShade} strokeWidth={2}/>
  <rect x={-40} y={-248} width={w - 14} height={4} fill={SA.sidingShade}/>
  {Array.from({length: 9}, (_, i) => <rect key={i} x={-10 + i * 30} y={-244} width={9} height={152} fill={i === 5 ? '#D8C9A9' : SA.trim} stroke={SA.sidingShade} strokeWidth={1.2}/>)}
  <rect x={-40} y={-104} width={w - 14} height={10} fill={SA.trim} stroke={SA.sidingShade} strokeWidth={1.4}/>
  <ellipse cx={w * .7} cy={2} rx={w * .4} ry={10} fill="#1E1A16" opacity={.18}/>
 </g>;
};

/** The warning banner's words, measured with the engine's own type metrics. */
export const BANNER_TEXT = {title: ['Flash Flood', 'Warning'], note: 'Emergency alert'};
/** Lay out the warning banner inside a phone `w` wide, in the phone's own units. ONE CALCULATION:
 * the drawing below and the episode's bound check both call this. The words keep their size and
 * reflow instead: the warning icon takes its own row whenever the old icon-beside-text row would
 * leave less than `margin` between the longest word and the banner's inner edge. Each row reports
 * its measured width so a check can hold it inside the banner. */
export function bannerLayout(w: number, font = 25, margin = 8) {
 const pad = 14, x0 = -w / 2 + pad, x1 = w / 2 - pad, small = Math.round(font * .76);
 const tw = Math.max(...BANNER_TEXT.title.map(s => widthOf(s, font, true)));
 const inline = x0 + 76 + tw <= x1 - margin;
 const tx = inline ? x0 + 76 : x0 + 12;
 const top = inline ? 44 : 56 + font + 6;
 const rows = [
  {text: BANNER_TEXT.title[0], x: tx, y: top, size: font},
  {text: BANNER_TEXT.title[1], x: tx, y: top + font + 5, size: font},
  {text: BANNER_TEXT.note, x: x0 + 14, y: top + 2 * font + 5 + small + 14, size: small},
 ].map(r => ({...r, width: widthOf(r.text, r.size, true)}));
 const height = rows[2].y + 18;
 return {x0, x1, height, inline, rows, icon: inline ? {x: x0 + 6, y: 20} : {x: x0 + 8, y: 10}, fits: rows.every(r => r.x >= x0 + margin && r.x + r.width <= x1 - margin)};
}

const Phone: React.FC<{banner?: number; t?: number; pal: Pal; w?: number; h?: number; font?: number; buzz?: number}> = ({banner = 0, t = 0, pal, w = 220, h: hh, font = 25, buzz = 0}) => {
 const id = useUid('saph');
 const h = hh ?? w * 2.05, b = clamp(banner), L = bannerLayout(w, font);
 const by = -h / 2 + 30 - 60 * (1 - ease(b));
 const shake = buzz > 0 && buzz < 1 ? 3 * Math.sin(2 * Math.PI * 9 * buzz) * Math.sin(Math.PI * buzz) : 0;
 return <g data-part="porch-phone" transform={shake ? `translate(${shake.toFixed(2)} 0)` : undefined}>
  <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
   <stop offset="0" stopColor="#3A4A55"/><stop offset=".35" stopColor={SA.screen}/><stop offset="1" stopColor="#0B0E10"/>
  </linearGradient><clipPath id={id + 'c'}><rect x={-w / 2 + 12} y={-h / 2 + 12} width={w - 24} height={h - 24} rx={22}/></clipPath></defs>
  <rect x={-w / 2 + 10} y={-h / 2 + 14} width={w} height={h} rx={34} fill="#1E1A16" opacity={.35}/>
  <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={32} fill="#5B4A3A" stroke="#2F261D" strokeWidth={3}/>
  <path d={`M${w / 2 - 34} ${h / 2 - 4}Q${w / 2 - 6} ${h / 2 - 8} ${w / 2 - 3} ${h / 2 - 34}`} stroke="#8B7660" strokeWidth={6} fill="none" opacity={.8}/>
  <rect x={-w / 2 + 12} y={-h / 2 + 12} width={w - 24} height={h - 24} rx={22} fill={`url(#${id})`}/>
  <g clipPath={`url(#${id}c)`}>
   <path d={`M${-w / 2} ${-h / 2 + 40}L${w / 2} ${-h / 2 + 120}V${-h / 2 + 170}L${-w / 2} ${-h / 2 + 90}Z`} fill="#9FB0B8" opacity={.16}/>
   {[[-50, 40], [30, -80], [60, 120], [-20, 160]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={5 + i} fill="#DCE8EE" opacity={.35}/>)}
   {b > 0 && <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#E9C27A" opacity={.12 * b}/>}
   {b > 0 && <g transform={`translate(0 ${by})`} opacity={clamp(b * 2.5)} data-part="warning-banner">
    <rect x={L.x0} y={0} width={L.x1 - L.x0} height={L.height} rx={16} fill={SA.banner} stroke={SA.alert} strokeWidth={5}/>
    <g transform={`translate(${L.icon.x} ${L.icon.y})`} data-part="warning-icon">
     <path d="M30 0L60 50H0Z" fill={SA.alert} stroke={pal.ink} strokeWidth={2}/>
     <rect x={28} y={16} width={5} height={18} fill={pal.ink}/><circle cx={30.5} cy={42} r={3} fill={pal.ink}/>
    </g>
    {L.rows.map((r, i) => <text key={i} x={r.x} y={r.y} fontFamily={FONT.body} fontSize={r.size} fontWeight={i < 2 ? 800 : 700} fill={i < 2 ? pal.ink : '#5A5249'}>{r.text}</text>)}
   </g>}
  </g>
  <rect x={-24} y={-h / 2 + 4} width={48} height={5} rx={2.5} fill="#2F261D"/>
  <rect x={w / 2} y={-h / 2 + 80} width={4} height={40} rx={2} fill="#2F261D"/>
  {b > 0 && b < 1 && <g opacity={Math.sin(Math.PI * b)}>{[0, 1].map(k => <path key={k} d={`M${-w / 2 - 14 - k * 12} ${-40}Q${-w / 2 - 24 - k * 12} 0 ${-w / 2 - 14 - k * 12} 40`} stroke={pal.accent} strokeWidth={4} fill="none"/>)}</g>}
  {buzz > 0 && buzz < 1 && <g opacity={Math.sin(Math.PI * buzz)} data-part="buzz">{[0, 1].map(k => <g key={k}>
   <path d={`M${-w / 2 - 14 - k * 12} ${-40}Q${-w / 2 - 24 - k * 12} 0 ${-w / 2 - 14 - k * 12} 40`} stroke={pal.accent} strokeWidth={4} fill="none"/>
   <path d={`M${w / 2 + 14 + k * 12} ${-40}Q${w / 2 + 24 + k * 12} 0 ${w / 2 + 14 + k * 12} 40`} stroke={pal.accent} strokeWidth={4} fill="none"/></g>)}</g>}
  <path d={`M${-w / 2 + 6} ${-h / 2 + 30}V${h / 2 - 30}`} stroke="#8B7660" strokeWidth={2} opacity={.4 + .1 * Math.sin(t)}/>
 </g>;
};

/**
 * Finished flood water: a SURFACE from its far edge `y` down to its near edge `y + depth`.
 * The far band reflects the pale storm sky and the body below it is muddy brown, as water seen at a
 * low angle is. Whatever stands in it is passed in as `reflect`, already mirrored about its own
 * waterline by the caller, and drifting ripple bands break those reflections. The far edge carries a
 * foam line; a spreading (`lobed`) near edge carries a bright meniscus and darkens the ground just
 * beyond it, where it has wetted the grass. Leaves and foam drift on the film clock.
 */
const Water: React.FC<{x0: number; x1: number; y: number; depth: number; t: number; seed?: number; edge?: 'lobed' | 'straight'; opacity?: number; reflect?: React.ReactNode}> =
 ({x0, x1, y, depth, t, seed = 11, edge = 'lobed', opacity = 1, reflect}) => {
 const id = useUid('saw');
 const r = rng(seed);
 const n = 28;
 const phases = Array.from({length: n + 1}, () => r() * 6.28);
 const lobes = Array.from({length: n + 1}, () => r());
 const top = Array.from({length: n + 1}, (_, i) => {const x = lerp(x0, x1, i / n); return [x, y + 1.6 * Math.sin(t * 2.1 + phases[i]) + 1.0 * Math.sin(x * .05 + t * 1.3)] as P;});
 const bot = Array.from({length: n + 1}, (_, i) => {const x = lerp(x1, x0, i / n);
  const k = n - i; const lobe = edge === 'lobed' ? Math.min(40, depth) * (.5 * Math.sin(k * 1.7 + 1) + .5 * (lobes[k] - .5)) + 2 * Math.sin(t * 1.4 + phases[k]) : 0;
  return [x, y + depth + lobe] as P;});
 const pts = (a: P[]) => a.map(p => p.map(v => v.toFixed(1)).join(' ')).join('L');
 const d = 'M' + pts([...top, ...bot]) + 'Z';
 const debris = Array.from({length: 7}, () => [r(), r(), r()]);
 const D = Math.max(depth, 30);
 const bands = Math.max(4, Math.min(22, Math.round(D / 26)));
 return <g data-part="flood-water" opacity={opacity}>
  <defs>
   <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={y} x2="0" y2={y + D}>
    <stop offset="0" stopColor={SA.sky}/><stop offset=".1" stopColor={SA.waterLit}/>
    <stop offset=".42" stopColor={SA.water}/><stop offset="1" stopColor={SA.waterDeep}/>
   </linearGradient>
   <clipPath id={id + 'c'}><path d={d}/></clipPath>
  </defs>
  {edge === 'lobed' && <path d={'M' + pts(bot)} stroke="#2A2318" strokeOpacity={.24} strokeWidth={16} fill="none" strokeLinejoin="round"/>}
  <path d={d} fill={`url(#${id})`}/>
  <g clipPath={`url(#${id}c)`}>
   {reflect && <g opacity={.62} data-part="reflections">{reflect}</g>}
   {/* drifting ripple bands, thinner and denser toward the far edge, break the reflections */}
   {Array.from({length: bands}, (_, k) => {const u = Math.pow((k + .5) / bands, 1.5), yy = y + D * u, hgt = 1.2 + 4.5 * u;
    return <g key={'b' + k}>
     <path d={`M${x0} ${yy}H${x1}`} stroke={SA.water} strokeWidth={hgt} strokeDasharray={`${60 + 90 * u} ${30 + 50 * u}`}
      strokeDashoffset={-(t * (14 + 9 * k) + k * 37)} opacity={.55}/>
     <path d={`M${x0} ${yy + hgt}H${x1}`} stroke={SA.foam} strokeWidth={1 + 1.4 * u} strokeDasharray={`${18 + 40 * u} ${80 + 60 * u}`}
      strokeDashoffset={t * (10 + 5 * k) + k * 23} opacity={.34}/>
    </g>;})}
   {debris.map(([a, b, c], i) => {const x = lerp(x0, x1, (a + t * .015 * (1 + c)) % 1), yy = y + 6 + b * D * .7;
    return i % 2 ? <ellipse key={i} cx={x} cy={yy} rx={8 + c * 6} ry={2.6} fill={SA.foam} opacity={.55}/>
     : <path key={i} d={`M${x} ${yy}q6 -5 12 0q-6 4 -12 0Z`} fill={i % 4 ? '#6B6A34' : '#8A5A2E'} opacity={.85}/>;})}
  </g>
  <path d={'M' + pts(top)} stroke={SA.foam} strokeWidth={2.6} fill="none" opacity={.85}/>
  <path d={'M' + pts(top.map(([px, py]) => [px, py + 3] as P))} stroke="#5A4A33" strokeWidth={1.4} fill="none" opacity={.35}/>
  {edge === 'lobed' && <path d={'M' + pts(bot)} stroke="#F3EEE2" strokeWidth={2.4} fill="none" opacity={.75} strokeLinejoin="round"/>}
 </g>;
};

/** Ripple rings where something stands in water: a waterline at (x, y) around a thing w wide. */
const Waterline: React.FC<{x: number; y: number; w: number; t: number}> = ({x, y, w, t}) => <g data-part="waterline">
 {[0, 1].map(k => {const ph = ((t * .8 + k * .5) % 1); return <ellipse key={k} cx={x} cy={y} rx={w * (1 + ph * .9)} ry={w * (1 + ph * .9) * .2} fill="none" stroke="#EFE4CC" strokeWidth={2.6} opacity={.85 * (1 - ph)}/>;})}
 <ellipse cx={x} cy={y} rx={w} ry={w * .2} fill="none" stroke="#F6EEDC" strokeWidth={3} opacity={.9}/>
</g>;

const CellTower: React.FC<{h?: number; dim?: number}> = ({h = 420, dim = 0}) => <g data-part="cell-tower" opacity={1 - .5 * dim}>
 <path d={`M-30 0L-6 ${-h}M30 0L6 ${-h}`} stroke="#5E6468" strokeWidth={5}/>
 {Array.from({length: 9}, (_, i) => {const y0 = -h * i / 9, y1 = -h * (i + 1) / 9, w0 = lerp(30, 6, i / 9), w1 = lerp(30, 6, (i + 1) / 9);
  return <path key={i} d={`M${-w0} ${y0}L${w1} ${y1}M${w0} ${y0}L${-w1} ${y1}M${-w0} ${y0}H${w0}`} stroke="#6E7579" strokeWidth={2}/>;})}
 {[-1, 0, 1].map(k => <rect key={k} x={k * 16 - 5} y={-h - 30} width={10} height={36} rx={2} fill="#B9BEC0" stroke="#5E6468" strokeWidth={1.4}/>)}
 <circle cx={0} cy={-h - 40} r={5} fill="#7A2A20"/>
</g>;

/** A distant, dark, windowless server building: a low block with louvred vents, rooftop units and a
 * shut steel door. Every lamp on it is off. Base centre at (0,0), w wide. */
const Server: React.FC<{w?: number}> = ({w = 260}) => {
 const id = useUid('sasv');
 const h = w * .52, side = w * .22;
 return <g data-part="central-server-building">
  <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
   <stop offset="0" stopColor="#4A5257"/><stop offset="1" stopColor="#2C3236"/>
  </linearGradient></defs>
  <path d={`M${-w / 2} 4L${w / 2 + side + 90} 14L${w / 2 + side + 110} 26L${-w / 2 + 20} 18Z`} fill="#1E1A16" opacity={.25}/>
  {/* the side face in shade, then the front face */}
  <path d={`M${w / 2} 0L${w / 2 + side} ${-side * .35}L${w / 2 + side} ${-h - side * .35}L${w / 2} ${-h}Z`} fill="#22282B"/>
  <rect x={-w / 2} y={-h} width={w} height={h} fill={`url(#${id})`} stroke="#1A1E21" strokeWidth={2}/>
  <path d={`M${-w / 2} ${-h}L${-w / 2 + side} ${-h - side * .35}L${w / 2 + side} ${-h - side * .35}L${w / 2} ${-h}Z`} fill="#5C6569"/>
  {/* louvred vents across the facade, no windows */}
  {Array.from({length: 4}, (_, c) => Array.from({length: 5}, (_, k) => <path key={c + '-' + k} d={`M${-w / 2 + 18 + c * w * .2} ${-h + 22 + k * 11}h${w * .14}`} stroke="#1B2023" strokeWidth={3}/>))}
  {/* shut steel door and its dark lamp */}
  <rect x={w * .22} y={-h * .55} width={w * .14} height={h * .55} fill="#22282B" stroke="#15191B" strokeWidth={2}/>
  <circle cx={w * .29} cy={-h * .62} r={4} fill="#3A4043"/>
  {/* rooftop units */}
  {[-.32, .02].map((u, i) => <g key={i} transform={`translate(${w * u} ${-h - 8})`}>
   <rect x={0} y={-26} width={w * .2} height={26} fill="#5E676B" stroke="#2C3236" strokeWidth={1.6}/>
   <circle cx={w * .1} cy={-13} r={8} fill="#3A4245" stroke="#2C3236" strokeWidth={1.4}/>
  </g>)}
  {/* a status lamp row, all dark */}
  {[0, 1, 2].map(k => <circle key={k} cx={-w / 2 + 22 + k * 14} cy={-h + 10} r={3.2} fill="#30373A"/>)}
 </g>;
};

/** The small limestone hub with its rooftop mast. `lamp` lights the mast tip when a signal lands;
 * `glow` lights the window and the receiver box under the mast, the building's own reaction. */
const Hub: React.FC<{lamp?: number; glow?: number; pal: Pal}> = ({lamp = 0, glow = 0, pal}) => {
 const id = useUid('sah');
 return <g data-part="hub-building">
  <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
   <stop offset="0" stopColor={SA.lime}/><stop offset=".7" stopColor={SA.limeFace}/><stop offset="1" stopColor={SA.limeShade}/>
  </linearGradient></defs>
  <path d="M-40 6L520 30L540 50L-30 24Z" fill="#1E1A16" opacity={.22}/>
  <rect x={-200} y={-220} width={400} height={224} fill={`url(#${id})`} stroke={SA.limeDeep} strokeWidth={2}/>
  {Array.from({length: 7}, (_, i) => <path key={i} d={`M-200 ${-190 + i * 30}H200`} stroke={SA.limeShade} strokeWidth={1.4} opacity={.6}/>)}
  {Array.from({length: 14}, (_, i) => <path key={'v' + i} d={`M${-190 + (i * 57) % 380} ${-220 + Math.floor(i / 2) * 30}v30`} stroke={SA.limeShade} strokeWidth={1.2} opacity={.5}/>)}
  <rect x={-214} y={-238} width={428} height={22} fill={SA.limeFace} stroke={SA.limeDeep} strokeWidth={2}/>
  <rect x={-150} y={-150} width={74} height={154} fill="#5B6468" stroke="#3B4246" strokeWidth={3}/>
  <circle cx={-88} cy={-74} r={4} fill="#C9C5BA"/>
  <rect x={0} y={-160} width={130} height={80} fill="#6C7E86" stroke={SA.trim} strokeWidth={8}/>
  {glow > 0 && <rect x={4} y={-156} width={122} height={72} fill="#FFD98A" opacity={.85 * glow}/>}
  {glow > 0 && <rect x={36} y={-120} width={52} height={30} fill="#F7F1DF" opacity={glow}/>}
  <path d="M8 -152L120 -88" stroke="#B9CBD2" strokeWidth={6} opacity={.35}/>
  <rect x={130} y={-276} width={56} height={38} rx={4} fill="#B7BCBC" stroke="#6E7578" strokeWidth={2}/>
  <rect x={-60} y={-196} width={86} height={34} rx={4} fill={pal.paper} stroke={pal.ink} strokeWidth={2}/>
  <text x={-17} y={-171} textAnchor="middle" fontFamily={FONT.body} fontSize={22} fontWeight={800} fill={pal.ink}>Hub</text>
  <g transform="translate(-130 -238)" data-part="hub-mast">
   <rect x={-22} y={-26} width={44} height={26} rx={3} fill="#9DA3A5" stroke="#5E6468" strokeWidth={2}/>
   <circle cx={12} cy={-13} r={4} fill={glow > 0 ? pal.accent : '#4A4E4F'} opacity={glow > 0 ? .5 + .5 * glow : 1}/>
   <path d="M-12 -26L-3 -300M12 -26L3 -300" stroke="#5E6468" strokeWidth={4}/>
   {Array.from({length: 8}, (_, i) => {const y0 = -26 - 274 * i / 8, y1 = -26 - 274 * (i + 1) / 8, a = lerp(12, 3, i / 8), b2 = lerp(12, 3, (i + 1) / 8);
    return <path key={i} d={`M${-a} ${y0}L${b2} ${y1}M${a} ${y0}L${-b2} ${y1}`} stroke="#7B8285" strokeWidth={1.6}/>;})}
   <path d="M0 -300L4 -380" stroke="#1E2224" strokeWidth={4} strokeLinecap="round"/>
   {lamp > 0 && <circle cx={4} cy={-384} r={14 + 46 * lamp} fill={pal.accent} opacity={.42 * lamp}/>}
   <circle cx={4} cy={-384} r={10} fill={lamp > 0 ? pal.accent : '#5A3A2A'}/>
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
  <rect x={w * .12} y={-h * .7} width={w * .24} height={h * .38} fill="#56656B" stroke="#F1ECE0" strokeWidth={Math.max(1.5, w * .016)}/>
  <rect x={w * .58} y={-h * .72} width={w * .2} height={h * .72} fill="#6A4E38" stroke="#F1ECE0" strokeWidth={Math.max(1.2, w * .013)}/>
  <path d={`M${w * .02} ${-h * .12}H${w * .98}`} stroke="#F1ECE0" strokeWidth={Math.max(1.5, w * .016)}/>
 </g>;
};

const Rings: React.FC<{p: number; rx: number; ry: number; n?: number; pal: Pal; width?: number}> = ({p, rx, ry, n = 3, pal, width = 5}) =>
 <g data-part="radio-rings">
  {Array.from({length: n}, (_, i) => {const u = clamp(p * (1 + (n - 1) * .22) - i * .22); if (u <= 0 || u >= 1) return null;
   return <ellipse key={i} cx={0} cy={0} rx={rx * u} ry={ry * u} fill="none" stroke={pal.accent} strokeWidth={width * (1.4 - .6 * u)} opacity={.9 * (1 - u * .7)}/>;})}
 </g>;

// ---- people: one shape language for everyone ----------------------------------------------------
/** Two-bone reach: shoulder S to a hand target T with segment lengths L1 and L2. The elbow takes the
 * lower of the two solutions, as a real arm hangs. Returns elbow, wrist and the forearm angle. */
export function reach(S: P, T: P, L1: number, L2: number): {E: P; W: P; deg: number} {
 const dx = T[0] - S[0], dy = T[1] - S[1], d0 = Math.hypot(dx, dy) || 1e-6;
 const d = Math.min(Math.max(d0, Math.abs(L1 - L2) + 1e-3), L1 + L2 - 1e-3);
 const a = Math.atan2(dy, dx), th = Math.acos(Math.min(1, Math.max(-1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))));
 const e1: P = [S[0] + L1 * Math.cos(a + th), S[1] + L1 * Math.sin(a + th)];
 const e2: P = [S[0] + L1 * Math.cos(a - th), S[1] + L1 * Math.sin(a - th)];
 const E = e1[1] >= e2[1] ? e1 : e2;
 const W: P = [S[0] + d * Math.cos(a), S[1] + d * Math.sin(a)];
 return {E, W, deg: Math.atan2(W[1] - E[1], W[0] - E[0]) * 180 / Math.PI};
}
const capsule = (a: P, b: P, ra: number, rb: number) => {
 const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1e-6, nx = -dy / L, ny = dx / L;
 return `M${a[0] + nx * ra} ${a[1] + ny * ra}L${b[0] + nx * rb} ${b[1] + ny * rb}A${rb} ${rb} 0 0 0 ${b[0] - nx * rb} ${b[1] - ny * rb}L${a[0] - nx * ra} ${a[1] - ny * ra}A${ra} ${ra} 0 0 0 ${a[0] + nx * ra} ${a[1] + ny * ra}Z`;
};
/** A limb or a sleeve between two joints, outlined in the shared ink. */
const Limb: React.FC<{a: P; b: P; wa: number; wb: number; fill: string}> = ({a, b, wa, wb, fill}) =>
 <g><path d={capsule(a, b, wa / 2 + 2.6, wb / 2 + 2.6)} fill={SA.line}/><path d={capsule(a, b, wa / 2, wb / 2)} fill={fill}/></g>;

export type HandPose = 'open' | 'grip' | 'point' | 'press' | 'pinch' | 'rest' | 'flat';
const FINGERS = [{y: -11, l: [13, 11]}, {y: -4, l: [15, 13]}, {y: 3, l: [14, 12]}, {y: 10, l: [11, 9]}];
const BEND: Record<HandPose, [number, number][]> = {
 open: [[-8, 6], [-2, 6], [4, 6], [10, 8]], grip: [[70, 80], [72, 82], [74, 84], [76, 80]],
 point: [[0, 0], [72, 84], [74, 84], [76, 80]], press: [[10, 8], [12, 8], [14, 8], [16, 10]],
 pinch: [[38, 42], [60, 70], [66, 74], [70, 76]], rest: [[24, 30], [28, 32], [30, 34], [34, 34]],
 flat: [[2, 2], [3, 2], [4, 2], [6, 4]],
};
/** Finger joints in hand space (wrist at 0,0, pointing along +x). `side` mirrors top and bottom. */
function fingerChain(k: number, pose: HandPose, side: 1 | -1): P[] {
 const f = FINGERS[k], [b1, b2] = BEND[pose][k];
 const base: P = [30, f.y * side];
 const a1 = b1 * side * Math.PI / 180, a2 = (b1 + b2) * side * Math.PI / 180;
 const j: P = [base[0] + f.l[0] * Math.cos(a1), base[1] + f.l[0] * Math.sin(a1)];
 const tip: P = [j[0] + f.l[1] * Math.cos(a2), j[1] + f.l[1] * Math.sin(a2)];
 return [base, j, tip];
}
/** Where the index fingertip lands, in frame space, for a hand at `at` turned `deg`, scale s. */
export function indexTip(at: P, deg: number, s: number, pose: HandPose, side: 1 | -1 = 1): P {
 const tip = fingerChain(0, pose, side)[2], a = deg * Math.PI / 180;
 return [at[0] + s * (tip[0] * Math.cos(a) - tip[1] * Math.sin(a)), at[1] + s * (tip[0] * Math.sin(a) + tip[1] * Math.cos(a))];
}
/** An articulated hand: palm, four two-joint fingers and a thumb, outlined in the shared ink. */
const Hand: React.FC<{at: P; deg: number; s?: number; pose: HandPose; skin: string; side?: 1 | -1}> = ({at, deg, s = 1, pose, skin, side = 1}) => {
 const thumbA = (pose === 'grip' ? 60 : pose === 'pinch' ? 30 : pose === 'press' || pose === 'flat' ? 70 : 52) * -side;
 const tb: P = [8, -12 * side], tj: P = [tb[0] + 13 * Math.cos(thumbA * Math.PI / 180), tb[1] + 13 * Math.sin(thumbA * Math.PI / 180)];
 const tt: P = [tj[0] + 11 * Math.cos((thumbA + 25 * side) * Math.PI / 180), tj[1] + 11 * Math.sin((thumbA + 25 * side) * Math.PI / 180)];
 const order = side === 1 ? [3, 2, 1, 0] : [0, 1, 2, 3];
 return <g transform={`translate(${at[0]} ${at[1]}) rotate(${deg}) scale(${s})`} data-part="hand">
  {order.map(k => {const [b, j, tip] = fingerChain(k, pose, side); return <g key={k}>
   <Limb a={b} b={j} wa={9} wb={8} fill={skin}/><Limb a={j} b={tip} wa={8} wb={7} fill={skin}/></g>;})}
  <path d={`M-2 -12Q14 -17 32 -13Q38 0 32 13Q14 17 -2 12Z`} fill={SA.line} transform="scale(1.08)"/>
  <path d={`M-2 -12Q14 -17 32 -13Q38 0 32 13Q14 17 -2 12Z`} fill={skin}/>
  <path d={`M4 ${6 * side}Q16 ${10 * side} 28 ${7 * side}`} stroke="#000000" strokeWidth={1.4} fill="none" opacity={.18}/>
  <Limb a={tb} b={tj} wa={10} wb={9} fill={skin}/><Limb a={tj} b={tt} wa={9} wb={8} fill={skin}/>
 </g>;
};

/** One head geometry for every person: skull, jaw, ear, hair and features placed by yaw (-1 facing
 * screen left in profile, 0 facing camera, 1 facing screen right) and pitch (-1 down, 1 up). */
const Head: React.FC<{c: P; r: number; yaw: number; pitch?: number; skin: string; shade: string; hair: string; style?: 'short' | 'bun'}> =
 ({c, r, yaw, pitch = 0, skin, shade, hair, style = 'short'}) => {
 const id = useUid('sahd');
 const [x, y] = c, ay = Math.abs(yaw), sg = yaw < 0 ? -1 : 1;
 const ey = y - .02 * r + pitch * .14 * r;
 const eyes = [-1, 1].map(k => x + yaw * .5 * r + k * .34 * r * (1 - ay * .55)).filter((_, i) => !(ay > .62 && (i === 0 ? sg > 0 : sg < 0)));
 const earX = x - yaw * .78 * r;
 return <g data-part="head" transform={`rotate(${-pitch * 14} ${x} ${y + r * .6})`}>
  <defs><clipPath id={id}><ellipse cx={x} cy={y} rx={r} ry={r * 1.06}/></clipPath></defs>
  <ellipse cx={x} cy={y} rx={r + 3} ry={r * 1.06 + 3} fill={SA.line}/>
  <ellipse cx={x} cy={y} rx={r} ry={r * 1.06} fill={skin}/>
  <g clipPath={`url(#${id})`}>
   <ellipse cx={x + r * .7} cy={y + r * .2} rx={r * .55} ry={r * 1.1} fill={shade} opacity={.32}/>
   <ellipse cx={x - yaw * .32 * r} cy={y - .5 * r - pitch * .1 * r} rx={r * 1.12} ry={r * .72} fill={hair}/>
   <ellipse cx={x + yaw * .3 * r} cy={y + .16 * r} rx={r * (.86 - ay * .2)} ry={r * .8} fill={skin}/>
   <ellipse cx={x + yaw * .3 * r + r * .5} cy={y + .3 * r} rx={r * .3} ry={r * .7} fill={shade} opacity={.22}/>
  </g>
  {style === 'bun' && <circle cx={x - yaw * .9 * r} cy={y - .62 * r} r={r * .34} fill={hair} stroke={SA.line} strokeWidth={2.4}/>}
  {ay > .18 ? <g>
   <ellipse cx={earX} cy={y + .08 * r} rx={r * .17} ry={r * .25} fill={skin} stroke={SA.line} strokeWidth={2.4}/>
   <path d={`M${earX - r * .05} ${y}q${r * .07} ${r * .08} 0 ${r * .16}`} stroke={shade} strokeWidth={2} fill="none"/>
  </g> : [-1, 1].map(k => <ellipse key={k} cx={x + k * r * .98} cy={y + .08 * r} rx={r * .13} ry={r * .22} fill={skin} stroke={SA.line} strokeWidth={2.4}/>)}
  {/* EYES STAY OPEN. A seated or typing person looks down at the work, and the old rule drew
      closed lid arcs below pitch -0.45, so the responder and the technician read as asleep. A
      downward look now keeps the open eye, lowered a little, under a heavier upper lid. */}
  {eyes.map((ex, i) => {const down = clamp((-pitch - .3) / .4), cy = ey + r * .03 * down;
   return <g key={i}>
    <ellipse cx={ex} cy={cy} rx={r * .07} ry={r * (.09 - .025 * down)} fill={SA.line}/>
    {down > 0 && <path d={`M${ex - r * .11} ${cy - r * .05}q${r * .11} ${-r * .07} ${r * .22} 0`} stroke={SA.line} strokeWidth={3} fill="none" strokeLinecap="round" opacity={down}/>}
   </g>;})}
  {eyes.map((ex, i) => <path key={'b' + i} d={`M${ex - r * .13} ${ey - r * .2}q${r * .13} ${-r * .07} ${r * .26} 0`} stroke={SA.line} strokeWidth={3} fill="none" strokeLinecap="round"/>)}
  {ay < .5
   ? <path d={`M${x + yaw * .55 * r} ${y + .06 * r}q${r * .05} ${r * .18} ${-r * .04} ${r * .24}`} stroke={shade} strokeWidth={2.6} fill="none" strokeLinecap="round"/>
   : <path d={`M${x + sg * r * .96} ${y - .02 * r}q${sg * r * .2} ${r * .2} ${sg * r * .02} ${r * .3}`} fill={skin} stroke={SA.line} strokeWidth={2.4}/>}
  <path d={`M${x + yaw * .48 * r - r * .13 * (1 - ay * .4)} ${y + .5 * r}q${r * .13} ${r * .05} ${r * .26 * (1 - ay * .4)} 0`} stroke={SA.line} strokeWidth={2.6} fill="none" strokeLinecap="round"/>
 </g>;
};

/** A complete responder seated at the hub desk, seen from his left side, turned toward the monitor.
 * `hand` is the target for the near (left) hand, `pose` its fingers, `look` turns the head from the
 * keyboard (0) to the map on the screen (1). */
const Responder: React.FC<{hand: P; pose: HandPose; look: number; t: number}> = ({hand, pose, look, t}) => {
 const skin = '#C98C5E', shade = '#A86F45', hair = '#2B1F18', jacket = SA.sleeve;
 const breathe = 2 * Math.sin(t * 2 * Math.PI / 4.2);
 const S: P = [872, 902 + breathe * .4];
 const arm = reach(S, hand, 190, 176);
 return <g data-part="seated-responder">
  {/* far arm, resting on the desk edge beyond the body */}
  <Limb a={[848, 912]} b={[790, 1040]} wa={44} wb={38} fill={SA.sleeveShade}/>
  <Limb a={[790, 1040]} b={[700, 1128]} wa={38} wb={32} fill={SA.sleeveShade}/>
  <Hand at={[700, 1128]} deg={160} s={1.15} pose="rest" skin={shade} side={-1}/>
  {/* legs under the desk end: thigh, shin, a work boot on the floor */}
  <Limb a={[912, 1196]} b={[780, 1222]} wa={70} wb={58} fill="#2E3542"/>
  <Limb a={[780, 1222]} b={[792, 1610]} wa={56} wb={44} fill="#2E3542"/>
  <path d="M760 1606Q760 1586 790 1586L828 1590Q846 1620 846 1640L742 1642Q740 1616 760 1606Z" fill="#3B2E24" stroke={SA.line} strokeWidth={3}/>
  {/* torso in a navy work jacket with a reflective band */}
  <path d={`M842 ${870 + breathe}Q800 904 798 984L806 1120Q812 1188 884 1196L962 1196Q988 1100 978 990Q970 904 930 ${870 + breathe}Q886 ${852 + breathe} 842 ${870 + breathe}Z`}
   fill={SA.line} transform="translate(-3 -3) scale(1.006)"/>
  <path d={`M842 ${870 + breathe}Q800 904 798 984L806 1120Q812 1188 884 1196L962 1196Q988 1100 978 990Q970 904 930 ${870 + breathe}Q886 ${852 + breathe} 842 ${870 + breathe}Z`} fill={jacket}/>
  <path d="M930 900Q968 960 966 1060L960 1190" stroke={SA.sleeveShade} strokeWidth={22} fill="none" opacity={.8}/>
  <path d="M802 1036Q890 1046 978 1040" stroke={SA.reflect} strokeWidth={18} fill="none"/>
  <path d="M846 880Q870 900 900 884" stroke="#41567A" strokeWidth={8} fill="none"/>
  {/* neck and head, turning from the keyboard to the screen */}
  <Limb a={[884, 846]} b={[880, 872]} wa={40} wb={44} fill={skin}/>
  <Head c={[884 - 12 * look, 778]} r={62} yaw={lerp(-.62, -.86, look)} pitch={lerp(-.62, .18, look)} skin={skin} shade={shade} hair={hair}/>
  {/* near arm: shoulder, elbow, wrist and fingers reaching where the episode sends them */}
  <Limb a={S} b={arm.E} wa={52} wb={44} fill={jacket}/>
  <Limb a={arm.E} b={arm.W} wa={44} wb={36} fill={jacket}/>
  <Limb a={[lerp(arm.E[0], arm.W[0], .62), lerp(arm.E[1], arm.W[1], .62)]} b={[lerp(arm.E[0], arm.W[0], .74), lerp(arm.E[1], arm.W[1], .74)]} wa={38} wb={36} fill={SA.reflect}/>
  <Limb a={[lerp(arm.E[0], arm.W[0], .9), lerp(arm.E[1], arm.W[1], .9)]} b={arm.W} wa={34} wb={30} fill={skin}/>
  <Hand at={arm.W} deg={arm.deg} s={1.3} pose={pose} skin={skin} side={1}/>
 </g>;
};

/** The hub desk: a monitor carrying the flood path map, keyboard, mug and notes on the desk, a
 * drawer pedestal, the responder's chair and the floor, so the room fills the lower frame. */
const Desk: React.FC<{children?: React.ReactNode; screen: [number, number, number, number]; hand: P; pose: HandPose; look: number; t: number; press?: number}> =
 ({children, screen, hand, pose, look, t, press = 0}) => {
 const id = useUid('sad');
 const [sx, sy, sw, sh] = screen;
 return <g data-part="hub-desk">
  <defs>
   <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={SA.deskLit}/><stop offset="1" stopColor={SA.desk}/></linearGradient>
   <linearGradient id={id + 'f'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6F6A62"/><stop offset="1" stopColor="#4A4640"/></linearGradient>
  </defs>
  {/* floor tiles running back to the desk */}
  <path d="M-60 1560L1140 1540L1140 1980L-60 1980Z" fill={`url(#${id}f)`}/>
  {Array.from({length: 7}, (_, i) => <path key={i} d={`M${-60 + i * 200} 1980L${120 + i * 150} 1556`} stroke="#3E3A35" strokeWidth={2} opacity={.5}/>)}
  {[1640, 1760, 1900].map(y => <path key={y} d={`M-60 ${y}L1140 ${y - 14}`} stroke="#3E3A35" strokeWidth={2} opacity={.45}/>)}
  {/* the chair: star base, gas column, seat and back */}
  <g data-part="chair">
   {[[840, 1700], [1030, 1696], [880, 1740], [1000, 1738], [932, 1712]].map(([x, y], i) => <g key={i}>
    <path d={`M934 1640L${x} ${y}`} stroke="#25282B" strokeWidth={12} strokeLinecap="round"/><circle cx={x} cy={y + 6} r={11} fill="#1A1C1E"/></g>)}
   <rect x={922} y={1222} width={22} height={420} fill="#3A3E41" stroke="#202325" strokeWidth={2}/>
   <rect x={850} y={1192} width={178} height={36} rx={14} fill="#2B2E31" stroke="#17191B" strokeWidth={3}/>
   <rect x={968} y={880} width={74} height={318} rx={26} fill="#2B2E31" stroke="#17191B" strokeWidth={3}/>
   <path d="M984 900V1170" stroke="#45494C" strokeWidth={6} opacity={.7}/>
  </g>
  {/* desk top, front edge and the drawer pedestal */}
  <path d="M-60 1000L770 984L792 1176L-60 1196Z" fill={`url(#${id})`}/>
  <path d="M-60 1000L770 984" stroke="#C9AE8C" strokeWidth={4}/>
  <path d="M-60 1196L792 1176L792 1250L-60 1272Z" fill={SA.deskShade}/>
  <path d="M770 984L800 990L812 1180L792 1176Z" fill="#6E563D"/>
  <path d="M760 1250L790 1250L790 1600L760 1604Z" fill="#4E3C2B"/>
  <g data-part="drawer-pedestal">
   <path d="M40 1268L380 1262L380 1600L40 1606Z" fill="#7C6247" stroke="#4E3C2B" strokeWidth={3}/>
   {[1290, 1400, 1500].map((y, i) => <g key={y}><path d={`M58 ${y}L362 ${y - 4}L362 ${y + 92}L58 ${y + 96}Z`} fill="#8B6F51" stroke="#5E4935" strokeWidth={2}/>
    <rect x={180} y={y + 40} width={70} height={10} rx={5} fill="#C9C3B2" stroke="#6E6A61" strokeWidth={1.4}/>{i === 0 && <rect x={70} y={y + 10} width={40} height={16} fill="#F1ECDF" opacity={.8}/>}</g>)}
  </g>
  {/* a wastebasket under the desk */}
  <path d="M470 1520L590 1520L578 1640L482 1640Z" fill="#4A5357" stroke="#2C3236" strokeWidth={3}/>
  <path d="M478 1530H582" stroke="#6C767A" strokeWidth={3}/>
  {/* monitor on its stand */}
  <path d={`M${sx + sw / 2 - 90} 1010L${sx + sw / 2 + 110} 1006L${sx + sw / 2 + 86} 982L${sx + sw / 2 - 66} 984Z`} fill="#2B2E30"/>
  <rect x={sx + sw / 2 - 20} y={sy + sh} width={44} height={984 - sy - sh} fill="#33373A"/>
  <rect x={sx - 24} y={sy - 24} width={sw + 48} height={sh + 48} rx={16} fill="#26292B" stroke="#121415" strokeWidth={3}/>
  <rect x={sx - 24} y={sy - 24} width={sw + 48} height={10} rx={5} fill="#4A4F52" opacity={.6}/>
  <svg x={sx} y={sy} width={sw} height={sh} viewBox={`0 0 ${sw} ${sh}`} overflow="hidden">{children}</svg>
  <rect x={sx} y={sy} width={sw} height={sh} fill="none" stroke="#000" strokeOpacity={.4} strokeWidth={2}/>
  {/* keyboard (one key goes down under the fingertip), mouse, mug and a note pad with a pencil */}
  <path d="M300 1084L708 1076L722 1140L292 1150Z" fill="#3A3E41" stroke="#202325" strokeWidth={2}/>
  {Array.from({length: 4}, (_, row) => <path key={row} d={`M${312 + row * 2} ${1092 + row * 14}L${704 + row * 3} ${1084 + row * 14}`} stroke="#5C6164" strokeWidth={8} strokeDasharray="24 6"/>)}
  {press > 0 && <rect x={520} y={1096 + 3 * press} width={30} height={10} rx={2} fill="#2A2D30"/>}
  <ellipse cx={630} cy={1170} rx={22} ry={12} fill="#2F3336" stroke="#17191B" strokeWidth={2}/>
  <g transform="translate(130 1060)">
   <ellipse cx={0} cy={60} rx={56} ry={12} fill="#1E1A16" opacity={.25}/>
   <path d="M-40 0V56Q0 70 40 56V0Z" fill="#E8E2D2" stroke="#9C9384" strokeWidth={2}/>
   <ellipse cx={0} cy={0} rx={40} ry={10} fill="#4A3020"/>
   <path d="M40 12Q66 16 62 34Q58 48 40 46" stroke="#E8E2D2" strokeWidth={9} fill="none"/>
   <path d="M-40 6L-34 0L-30 8Z" fill="#9C9384"/>
  </g>
  <g transform="translate(20 1110) rotate(-5)">
   <rect x={0} y={0} width={150} height={70} fill="#F4EEDC" stroke="#B9AE96" strokeWidth={2}/>
   {[0, 1, 2].map(k => <path key={k} d={`M14 ${20 + k * 18}H${120 - k * 14}`} stroke="#9EB4C8" strokeWidth={2}/>)}
   <path d="M120 62L190 30" stroke="#D9A23A" strokeWidth={8} strokeLinecap="round"/>
  </g>
  <Responder hand={hand} pose={pose} look={look} t={t}/>
 </g>;
};

/** A polyline's length, for drawing a path progressively with an exact dash. */
const lengthOf = (pts: P[]) => pts.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]), 0);
const poly = (pts: P[]) => 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(' ')).join('L');

/** The hub's flood path map in screen units w by h: blocks with building footprints, streets, a park,
 * the creek with its banks, low points, station dots, orange flood paths that spread along the creek
 * and then into the low streets, and dashed higher-risk zones. */
const Dashboard: React.FC<{w: number; h: number; dots?: number; paths?: number; zones?: number; t?: number; pal: Pal; header?: boolean}> =
 ({w, h, dots = 0, paths = 0, zones = 0, t = 0, pal, header = true}) => {
 const id = useUid('sadb');
 const r = rng(21);
 const X = (u: number) => u * w, Y = (v: number) => v * h;
 const creek: P[] = [[-.04, .58], [.14, .55], [.26, .63], [.42, .6], [.55, .69], [.7, .64], [.84, .72], [1.04, .7]].map(([u, v]) => [X(u), Y(v)]);
 const streetsX = [.1, .26, .44, .6, .78, .92].map(u => X(u + (r() - .5) * .02));
 const streetsY = [.22, .36, .48, .8, .92].map(v => Y(v + (r() - .5) * .02));
 const stations: P[] = [[.14, .55], [.33, .62], [.52, .67], [.7, .64], [.88, .72], [.44, .44]].map(([u, v]) => [X(u), Y(v)]);
 const low: P[] = [[.27, .8], [.6, .8], [.45, .36]].map(([u, v]) => [X(u), Y(v)]);
 // flood paths: along the creek first, then down two low streets and up one, each from a creek point
 const routes: {pts: P[]; delay: number; w: number}[] = [
  {pts: creek, delay: 0, w: .045},
  {pts: [[X(.26), Y(.63)], [X(.26), Y(.8)], [X(.12), Y(.8)]], delay: .35, w: .03},
  {pts: [[X(.6), Y(.67)], [X(.6), Y(.8)], [X(.78), Y(.8)]], delay: .45, w: .03},
  {pts: [[X(.44), Y(.6)], [X(.44), Y(.48)], [X(.45), Y(.36)]], delay: .6, w: .026},
 ];
 const spread = clamp(paths);
 const zonesPoly: P[][] = [[[.05, .72], [.32, .72], [.34, .88], [.06, .9]], [[.52, .73], [.84, .72], [.86, .87], [.54, .88]], [[.38, .3], [.52, .3], [.52, .52], [.38, .52]]]
  .map(z => z.map(([u, v]) => [X(u), Y(v)] as P));
 const hd = Math.max(h * .085, 60);
 return <g data-part="flood-path-map">
  <defs><clipPath id={id}><rect x={0} y={0} width={w} height={h}/></clipPath></defs>
  <rect x={0} y={0} width={w} height={h} fill="#E7E2D3"/>
  <g clipPath={`url(#${id})`}>
   {/* blocks and their building footprints */}
   {streetsX.slice(0, -1).map((x0, i) => streetsY.slice(0, -1).map((y0, j) => {const x1 = streetsX[i + 1], y1 = streetsY[j + 1];
    return <g key={i + '-' + j}><rect x={x0 + 8} y={y0 + 8} width={x1 - x0 - 16} height={y1 - y0 - 16} rx={4} fill="#DCD5C2"/>
     {Array.from({length: 4}, (_, k) => <rect key={k} x={x0 + 14 + (k % 2) * (x1 - x0 - 28) * .5} y={y0 + 14 + Math.floor(k / 2) * (y1 - y0 - 28) * .5}
      width={(x1 - x0 - 28) * .38} height={(y1 - y0 - 28) * .34} fill="#C8BFA8"/>)}</g>;}))}
   {/* a park along the creek */}
   <path d={`M${X(.62)} ${Y(.5)}L${X(.78)} ${Y(.5)}L${X(.8)} ${Y(.62)}L${X(.64)} ${Y(.6)}Z`} fill="#B6C796"/>
   {/* streets with casings */}
   {streetsX.map((x, i) => <g key={'sx' + i}><path d={`M${x} 0V${h}`} stroke="#B9B09C" strokeWidth={i === 2 ? 18 : 13}/>
    <path d={`M${x} 0V${h}`} stroke={i === 2 ? '#F2DCA2' : SA.street} strokeWidth={i === 2 ? 12 : 8}/></g>)}
   {streetsY.map((y, i) => <g key={'sy' + i}><path d={`M0 ${y}H${w}`} stroke="#B9B09C" strokeWidth={13}/><path d={`M0 ${y}H${w}`} stroke={SA.street} strokeWidth={8}/></g>)}
   {/* the creek: green banks, then water */}
   <path d={poly(creek)} stroke="#C2D3B6" strokeWidth={w * .07} fill="none" strokeLinejoin="round" strokeLinecap="round"/>
   <path d={poly(creek)} stroke={SA.creek} strokeWidth={w * .022} fill="none" strokeLinejoin="round" strokeLinecap="round"/>
   {/* low points, the dips where water collects */}
   {low.map(([x, y], i) => <g key={'l' + i}><ellipse cx={x} cy={y} rx={w * .035} ry={w * .022} fill="#7FA6B6" opacity={.55}/>
    <ellipse cx={x} cy={y} rx={w * .018} ry={w * .011} fill="#5F8798" opacity={.7}/></g>)}
   {/* flood paths spreading, each drawn along its own route from the creek */}
   {routes.map((rt, i) => {const g = clamp((spread - rt.delay) / (1 - rt.delay)), L = lengthOf(rt.pts); return g > 0 && <g key={'f' + i}>
    <path d={poly(rt.pts)} stroke="#E8812C" strokeWidth={w * rt.w * 1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={.32}
     strokeDasharray={`${L} ${L}`} strokeDashoffset={L * (1 - ease(g))}/>
    <path d={poly(rt.pts)} stroke="#D9681C" strokeWidth={w * rt.w * .8} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={.9}
     strokeDasharray={`${L} ${L}`} strokeDashoffset={L * (1 - ease(g))}/></g>;})}
   {zones > 0 && zonesPoly.map((z, i) => {const g = clamp(zones * 1.5 - i * .25);
    return g > 0 && <path key={'z' + i} d={poly(z) + 'Z'} fill={pal.accent} fillOpacity={.1 * g} stroke={pal.accent} strokeWidth={6}
     strokeDasharray={`${22 * g} 14`} strokeLinejoin="round" opacity={g}/>;})}
   {stations.map(([x, y], i) => {const g = clamp(dots * 1.6 - i * .12); return g > 0 && <g key={'s' + i} transform={`translate(${x} ${y}) scale(${ease(g)})`}>
    <circle cx={0} cy={0} r={22 * (1 + .2 * Math.sin(t * 3 + i))} fill={pal.accent} opacity={.2}/>
    <circle cx={0} cy={0} r={12} fill="#F5F0E3" stroke={pal.accent} strokeWidth={5}/>
   </g>;})}
   {/* north arrow and an unnumbered scale bar, so it reads as a map */}
   <g transform={`translate(${w - 60} ${h - 90})`}><path d="M0 -34L12 6L0 0L-12 6Z" fill="#4A4E50"/><text x={0} y={30} textAnchor="middle" fontFamily={FONT.body} fontSize={22} fontWeight={800} fill="#4A4E50">N</text></g>
   <g transform={`translate(30 ${h - 40})`}><rect x={0} y={0} width={60} height={10} fill="#4A4E50"/><rect x={60} y={0} width={60} height={10} fill="#F5F0E3" stroke="#4A4E50" strokeWidth={2}/></g>
  </g>
  {header && <g>
   <rect x={0} y={0} width={w} height={hd} fill="#1E2A2E" opacity={.9}/>
   <text x={w * .04} y={hd * .7} fontFamily={FONT.body} fontSize={Math.max(h * .05, 34)} fontWeight={800} fill="#F2EEE2">Flood path map</text>
   {zones > 0 && <g opacity={clamp(zones * 2)}>
    <rect x={w * .66} y={hd * .28} width={w * .04} height={hd * .44} rx={4} fill="none" stroke={pal.accent} strokeWidth={3} strokeDasharray="8 5"/>
    <text x={w * .72} y={hd * .68} fontFamily={FONT.body} fontSize={Math.max(h * .038, 26)} fontWeight={700} fill="#F2EEE2">Higher risk</text>
   </g>}
  </g>}
 </g>;
};

/** The overhead radio map: a city grid upper left, open country lower right, the station and the hub. */
const RadioMap: React.FC<{w: number; h: number; ring?: number; half?: number; five?: number; hub?: number; pal: Pal; station: P; hubAt: P}> =
 ({w, h, ring = 0, half = 0, five = 0, hub = 0, pal, station, hubAt}) => {
 const id = useUid('sarm');
 const r = rng(31);
 const reachR = Math.hypot(hubAt[0] - station[0], hubAt[1] - station[1]);
 const halfR = reachR * .1;
 return <g data-part="radio-map">
  <defs><clipPath id={id}><rect x={0} y={0} width={w} height={h} rx={18}/></clipPath></defs>
  <rect x={6} y={10} width={w} height={h} rx={18} fill="#1E1A16" opacity={.2}/>
  <rect x={0} y={0} width={w} height={h} rx={18} fill="#E9E2CF" stroke={pal.ink} strokeWidth={3}/>
  <g clipPath={`url(#${id})`}>
   {Array.from({length: 9}, (_, i) => <path key={'f' + i} d={`M${w * .35 + i * 70} ${h}L${w * .5 + i * 90} ${h * .3}`} stroke="#C9C09A" strokeWidth={30} opacity={.35}/>)}
   <path d={`M0 ${h * .55}Q${w * .5} ${h * .5} ${w} ${h * .62}`} stroke="#B9AE8E" strokeWidth={10} fill="none"/>
   {Array.from({length: 8}, (_, i) => <path key={'gx' + i} d={`M${station[0] - 260 + i * 70 + r() * 8} ${station[1] - 300}V${station[1] + 280}`} stroke="#B3AA92" strokeWidth={6}/>)}
   {Array.from({length: 9}, (_, i) => <path key={'gy' + i} d={`M${station[0] - 280} ${station[1] - 300 + i * 66 + r() * 8}H${station[0] + 250}`} stroke="#B3AA92" strokeWidth={6}/>)}
   {Array.from({length: 18}, (_, i) => <rect key={'b' + i} x={station[0] - 252 + (i % 6) * 70 + 8} y={station[1] - 290 + Math.floor(i / 6) * 132 + 10} width={50} height={40} fill="#D3C8AE" opacity={.8}/>)}
   <path d={`M${-20} ${h * .2}Q${w * .3} ${h * .34} ${w * .45} ${h * .3}T${w + 20} ${h * .46}`} stroke={SA.creek} strokeWidth={9} fill="none" opacity={.8}/>
   {ring > 0 && [0, 1, 2].map(k => {const u = clamp(ring * 1.3 - k * .15); return u > 0 && u < 1 &&
    <circle key={k} cx={station[0]} cy={station[1]} r={reachR * 1.05 * u} fill="none" stroke={pal.accent} strokeWidth={6 - 3 * u} opacity={.9 * (1 - .6 * u)}/>;})}
   {half > 0 && <circle cx={station[0]} cy={station[1]} r={halfR} fill="none" stroke={pal.ink} strokeWidth={3} strokeDasharray="10 8" opacity={half}/>}
   {five > 0 && <circle cx={station[0]} cy={station[1]} r={reachR} fill="none" stroke={pal.ink} strokeWidth={3} strokeDasharray="14 10" opacity={five}/>}
  </g>
  <circle cx={station[0]} cy={station[1]} r={16} fill={pal.paper} stroke={pal.ink} strokeWidth={4}/>
  <circle cx={station[0]} cy={station[1]} r={7} fill={pal.accent}/>
  <g transform={`translate(${hubAt[0]} ${hubAt[1]})`}>
   {hub > 0 && <circle cx={0} cy={0} r={30 + 30 * hub} fill={pal.accent} opacity={.3 * hub}/>}
   <rect x={-22} y={-16} width={44} height={32} rx={4} fill={pal.paper} stroke={pal.ink} strokeWidth={4}/>
   <path d="M-8 -16V-40M-8 -40L-2 -50" stroke={pal.ink} strokeWidth={4}/>
  </g>
 </g>;
};

/** A round pushpin; `press` 0 hovers above the cork, 1 is pressed home. */
const Pin: React.FC<{color: string; press?: number}> = ({color, press = 1}) => {
 const k = lerp(1.35, 1, ease(press));
 return <g data-part="pushpin" transform={`translate(0 ${-10 * (1 - ease(press))}) scale(${k})`}>
  <ellipse cx={4} cy={5} rx={13} ry={7} fill="#1E1A16" opacity={.25 * press}/>
  <circle cx={0} cy={0} r={13} fill={color} stroke={SA.line} strokeWidth={2.4}/>
  <circle cx={-4} cy={-4} r={4} fill="#FFFFFF" opacity={.5}/>
 </g>;
};

/** The validation card: title, the reported figure (passed in verbatim from the claim) and its bar.
 * The bar is filled by an orange tape strip pressed along it from a roll that rides its end. */
/** `figure`, when given, reveals the printed figure on its own clock (0 hidden, 1 shown), so the
 * episode can bring the number in with the clause that speaks it; otherwise it follows the fill. */
const Card: React.FC<{fill?: number; value: string; share: number; pal: Pal; figure?: number; rollOut?: number}> = ({fill = 0, value, share, pal, figure, rollOut = 0}) => {
 const w = 640, h = 380, f = clamp(fill), end = 40 + (w - 80) * share * f;
 const shown = figure === undefined ? clamp((f - .3) * 2.5) : clamp(figure);
 // once the strip is laid, the spent roll rolls off the bar's end and drops away
 const ro = f >= 1 ? clamp(rollOut) : 0;
 return <g data-part="validation-card">
  <rect x={10} y={14} width={w} height={h} rx={14} fill="#1E1A16" opacity={.25}/>
  <rect x={0} y={0} width={w} height={h} rx={14} fill={SA.paper} stroke={pal.ink} strokeWidth={3}/>
  <path d={`M${w - 46} 0L${w} 0L${w} 40Z`} fill={SA.paperShade}/>
  <text x={40} y={74} fontFamily={FONT.body} fontSize={44} fontWeight={800} fill={pal.ink}>Validation accuracy</text>
  <rect x={40} y={210} width={w - 80} height={56} rx={10} fill="#D9D0BC" stroke={pal.ink} strokeWidth={2.4}/>
  {f > 0 && <rect x={40} y={212} width={end - 40} height={52} rx={9} fill={pal.accent}/>}
  {f > 0 && <path d={`M44 222H${end - 6}`} stroke="#FFFFFF" strokeWidth={4} opacity={.35}/>}
  {f > 0 && f < 1 && <g data-part="tape-roll" transform={`translate(${end} 238) rotate(${f * 720})`}>
   <circle cx={0} cy={0} r={40} fill={pal.accent} stroke={SA.line} strokeWidth={3}/>
   <circle cx={0} cy={0} r={22} fill="#D8C7A4" stroke={SA.line} strokeWidth={2.4}/>
   <circle cx={0} cy={0} r={14} fill={SA.paper}/>
   <path d="M-30 -20L-16 -10" stroke="#FFFFFF" strokeWidth={4} opacity={.45}/>
  </g>}
  {ro > 0 && ro < 1 && <g data-part="tape-roll-off" opacity={1 - ro} transform={`translate(${end + 70 * ro} ${238 + 150 * ro * ro}) rotate(${720 + 300 * ro})`}>
   <circle cx={0} cy={0} r={40} fill={pal.accent} stroke={SA.line} strokeWidth={3}/>
   <circle cx={0} cy={0} r={22} fill="#D8C7A4" stroke={SA.line} strokeWidth={2.4}/>
   <circle cx={0} cy={0} r={14} fill={SA.paper}/>
  </g>}
  {shown > 0 && <text x={40} y={176} fontFamily={FONT.body} fontSize={84} fontWeight={800} fill={pal.ink} opacity={shown}
   transform={figure === undefined ? undefined : `translate(40 176) scale(${lerp(1.18, 1, ease(shown))}) translate(-40 -176)`}>{value}</text>}
  <text x={40} y={330} fontFamily={FONT.body} fontSize={30} fontWeight={600} fill="#5A5249">Reported by the university</text>
 </g>;
};

const Result: React.FC<{stamp?: number; pal: Pal}> = ({stamp = 0, pal}) => {
 const w = 560, h = 420, s = clamp(stamp);
 return <g data-part="field-result-card">
  <rect x={10} y={14} width={w} height={h} rx={14} fill="#1E1A16" opacity={.25}/>
  <rect x={0} y={0} width={w} height={h} rx={14} fill="#F6F1E4" stroke={pal.ink} strokeWidth={3}/>
  <text x={40} y={74} fontFamily={FONT.body} fontSize={44} fontWeight={800} fill={pal.ink}>Field result</text>
  {[0, 1, 2, 3].map(i => <path key={i} d={`M40 ${150 + i * 56}H${w - 50 - (i % 2) * 40}`} stroke="#C9BFA8" strokeWidth={3}/>)}
  {s > 0 && <g transform={`translate(${w / 2} 250) rotate(-6)`} opacity={.25 + .75 * s} data-part="none-reported-stamp">
   <rect x={-200} y={-50} width={400} height={100} rx={12} fill="none" stroke="#3B4A6B" strokeWidth={7}/>
   <text x={0} y={18} textAnchor="middle" fontFamily={FONT.body} fontSize={50} fontWeight={800} fill="#3B4A6B">None reported</text>
  </g>}
 </g>;
};

/** A rubber stamp: a turned wooden knob on a block with its inked face, base centre at (0,0). */
const Stamp: React.FC = () => <g data-part="rubber-stamp">
 <rect x={-150} y={-30} width={300} height={30} rx={6} fill="#3B4A6B" stroke={SA.line} strokeWidth={3}/>
 <rect x={-140} y={-74} width={280} height={46} rx={8} fill={SA.woodLit} stroke={SA.line} strokeWidth={3}/>
 <path d="M-128 -64H120" stroke="#FFFFFF" strokeWidth={4} opacity={.3}/>
 <path d="M-26 -74Q-34 -120 -18 -138L18 -138Q34 -120 26 -74Z" fill={SA.wood} stroke={SA.line} strokeWidth={3}/>
 <ellipse cx={0} cy={-150} rx={46} ry={24} fill={SA.woodLit} stroke={SA.line} strokeWidth={3}/>
</g>;

/** A curb notice board on two weathered posts with a little shingled cap; cork in a wood frame.
 * Its panel spans x0..x1 by y0..y1 and its posts stand on the ground at `ground`. */
const NoticeBoard: React.FC<{x0: number; x1: number; y0: number; y1: number; ground: number}> = ({x0, x1, y0, y1, ground}) => {
 const id = useUid('sanb');
 const r = rng(61);
 return <g data-part="curb-notice-board">
  <defs><pattern id={id} width={24} height={24} patternUnits="userSpaceOnUse">
   <rect width={24} height={24} fill={SA.cork}/><circle cx={5} cy={7} r={1.6} fill={SA.corkDark} opacity={.6}/><circle cx={17} cy={15} r={1.3} fill={SA.corkDark} opacity={.5}/><circle cx={11} cy={20} r={1} fill="#D4AC7C"/>
  </pattern></defs>
  {[x0 + 50, x1 - 56].map((x, i) => <g key={i}>
   <ellipse cx={x + 40} cy={ground + 4} rx={60} ry={9} fill="#1E1A16" opacity={.25}/>
   <rect x={x - 16} y={y0 - 10} width={34} height={ground - y0 + 10} fill={SA.wood} stroke={SA.line} strokeWidth={3} transform={`rotate(${i ? .8 : -.5} ${x} ${ground})`}/>
   <path d={`M${x - 8} ${y1 + 20}V${ground - 6}`} stroke={SA.woodLit} strokeWidth={4} opacity={.6}/>
  </g>)}
  <rect x={x0 + 8} y={y0 + 10} width={x1 - x0} height={y1 - y0} fill="#1E1A16" opacity={.3}/>
  <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={SA.wood} stroke={SA.line} strokeWidth={3}/>
  <rect x={x0 + 20} y={y0 + 20} width={x1 - x0 - 40} height={y1 - y0 - 40} fill={`url(#${id})`}/>
  <path d={`M${x0 + 20} ${y0 + 22}H${x1 - 20}`} stroke="#1E1A16" strokeWidth={8} opacity={.18}/>
  {/* old staple marks and a torn paper corner left by earlier notices */}
  {Array.from({length: 9}, (_, i) => <rect key={i} x={x0 + 40 + r() * (x1 - x0 - 80)} y={y0 + 40 + r() * (y1 - y0 - 80)} width={7} height={2} fill="#6E6A61" opacity={.6}/>)}
  <path d={`M${x1 - 60} ${y1 - 22}l30 -6l-6 -22Z`} fill="#EDE5D2" opacity={.9}/>
  {/* the shingled cap, a little crooked */}
  <path d={`M${x0 - 30} ${y0 + 2}L${x0 + 10} ${y0 - 36}L${x1 - 6} ${y0 - 42}L${x1 + 30} ${y0 - 2}Z`} fill="#5E5650" stroke={SA.line} strokeWidth={3}/>
  {Array.from({length: 9}, (_, i) => <path key={'s' + i} d={`M${x0 - 10 + i * (x1 - x0 + 40) / 9} ${y0 - 18 - i * .6}v16`} stroke="#3E3833" strokeWidth={2}/>)}
 </g>;
};

/** The paper street map with no pin on it: blocks, streets, the creek with its banks, a park, and a
 * few blank pin holes where pins were once pushed and taken out. */
const MapCard: React.FC<{w: number; h: number; pal: Pal; seed?: number}> = ({w, h, pal, seed = 41}) => {
 const id = useUid('samc');
 const r = rng(seed);
 const xs = Array.from({length: 6}, (_, i) => w * (.08 + i * .17 + (r() - .5) * .03));
 const ys = Array.from({length: 6}, (_, i) => h * (.1 + i * .16 + (r() - .5) * .03));
 return <g data-part="paper-street-map">
  <defs><clipPath id={id}><rect x={0} y={0} width={w} height={h} rx={12}/></clipPath></defs>
  <rect x={8} y={12} width={w} height={h} rx={12} fill="#1E1A16" opacity={.22}/>
  <rect x={0} y={0} width={w} height={h} rx={12} fill={SA.paper} stroke={pal.ink} strokeWidth={3}/>
  <g clipPath={`url(#${id})`}>
   {xs.slice(0, -1).map((x0, i) => ys.slice(0, -1).map((y0, j) => <rect key={i + '-' + j} x={x0 + w * .02} y={y0 + h * .02} width={xs[i + 1] - x0 - w * .04} height={ys[j + 1] - y0 - h * .04} rx={3} fill="#E3D9C2"/>))}
   <path d={`M${w * .6} ${h * .42}L${w * .78} ${h * .42}L${w * .8} ${h * .56}L${w * .62} ${h * .55}Z`} fill="#C9D3AE"/>
   {xs.map((x, i) => <path key={'x' + i} d={`M${x} 0V${h}`} stroke="#CFC4AA" strokeWidth={i === 2 ? w * .014 : w * .008}/>)}
   {ys.map((y, i) => <path key={'y' + i} d={`M0 ${y}H${w}`} stroke="#CFC4AA" strokeWidth={i === 3 ? w * .014 : w * .008}/>)}
   <path d={`M-10 ${h * .66}Q${w * .25} ${h * .58} ${w * .45} ${h * .7}T${w + 10} ${h * .62}`} stroke="#C7D3BE" strokeWidth={w * .05} fill="none"/>
   <path d={`M-10 ${h * .66}Q${w * .25} ${h * .58} ${w * .45} ${h * .7}T${w + 10} ${h * .62}`} stroke={SA.creek} strokeWidth={w * .016} fill="none" opacity={.85}/>
  </g>
  {[[.28, .3], [.55, .48], [.72, .76]].map(([u, v], i) => <g key={'h' + i} data-part="blank-pin-hole">
   <circle cx={w * u} cy={h * v} r={Math.max(3, w * .008)} fill="#E8DFCB" stroke="#9C9384" strokeWidth={1.4}/>
   <circle cx={w * u} cy={h * v} r={Math.max(1.4, w * .0035)} fill="#4A443C"/>
  </g>)}
 </g>;
};
/** The map's creek and the street it meets, in map units (0..1), for a finger to read along. */
export const MAP_TRACE: P[] = [[.06, .64], [.2, .61], [.33, .64], [.45, .7], [.62, .66], [.62, .48], [.62, .3]];

/** A folding table on its A-frame legs, top seen from a little above. Top front edge from x0 to x1
 * at y; depth px of top; legs to `ground`. */
const FoldingTable: React.FC<{x0: number; x1: number; y: number; depth: number; ground: number}> = ({x0, x1, y, depth, ground}) => <g data-part="folding-table">
 <ellipse cx={(x0 + x1) / 2 + 60} cy={ground + 4} rx={(x1 - x0) * .6} ry={14} fill="#1E1A16" opacity={.25}/>
 {[[x0 + 40, x0 + 90], [x1 - 40, x1 - 90]].map(([a, b], i) => <g key={i} stroke="#5E6468" strokeWidth={8} strokeLinecap="round">
  <path d={`M${a} ${y + 14}L${b} ${ground}`}/><path d={`M${b} ${y + 14}L${a} ${ground - (ground - y) * .12}`}/></g>)}
 <path d={`M${x0 + 26} ${y - depth}L${x1 - 26} ${y - depth}L${x1} ${y}L${x0} ${y}Z`} fill="#E3DED2" stroke={SA.line} strokeWidth={3}/>
 <path d={`M${x0} ${y}L${x1} ${y}L${x1} ${y + 16}L${x0} ${y + 16}Z`} fill="#B9B3A6" stroke={SA.line} strokeWidth={3}/>
 <path d={`M${x0 + 40} ${y - depth * .3}L${x1 - 60} ${y - depth * .32}`} stroke="#FFFFFF" strokeWidth={3} opacity={.4}/>
 <ellipse cx={x0 + (x1 - x0) * .22} cy={y - depth * .5} rx={30} ry={6} fill="#C7C1B4" opacity={.6}/>
</g>;

/** The prototype's hard carry case standing on the table: ribbed shell, handle, two latches across
 * the top front, and a fabric pocket on its front. The left latch is shut; the right latch closes
 * as `latch` goes from 0 (open, flipped up) to 1 (pressed shut). Base centre at (0,0). */
export const CASE = {w: 300, h: 300, pocket: [-118, -190, 236, 150] as [number, number, number, number], latchR: [96, -276] as P, handle: [0, -322] as P};
const CarryCase: React.FC<{latch: number}> = ({latch}) => {
 const id = useUid('sacc');
 const {w, h} = CASE, [px, py, pw, ph] = CASE.pocket;
 const a = lerp(-118, 0, ease(latch));
 return <g data-part="carry-case">
  <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={SA.caseLit}/><stop offset=".6" stopColor={SA.case}/><stop offset="1" stopColor={SA.caseEdge}/></linearGradient></defs>
  <ellipse cx={30} cy={2} rx={w * .62} ry={12} fill="#1E1A16" opacity={.3}/>
  <rect x={-w / 2} y={-h} width={w} height={h} rx={22} fill={`url(#${id})`} stroke={SA.line} strokeWidth={4}/>
  {[-.3, 0, .3].map(u => <path key={u} d={`M${w * u} ${-h + 40}V-20`} stroke="#1E2124" strokeWidth={6} opacity={.5}/>)}
  <path d={`M${-w / 2} ${-h + 34}H${w / 2}`} stroke={SA.caseEdge} strokeWidth={6}/>
  <path d={`M${-w / 2 + 14} ${-h + 10}H${w / 2 - 30}`} stroke="#FFFFFF" strokeWidth={3} opacity={.25}/>
  {/* handle */}
  <path d={`M-56 ${-h}Q-56 ${-h - 38} -20 ${-h - 38}L20 ${-h - 38}Q56 ${-h - 38} 56 ${-h}`} stroke={SA.line} strokeWidth={18} fill="none" strokeLinecap="round"/>
  <path d={`M-56 ${-h}Q-56 ${-h - 38} -20 ${-h - 38}L20 ${-h - 38}Q56 ${-h - 38} 56 ${-h}`} stroke="#3A3F43" strokeWidth={11} fill="none" strokeLinecap="round"/>
  {/* latches: left shut, right closing about its lower hinge */}
  <g transform={`translate(${-CASE.latchR[0]} ${CASE.latchR[1]})`}><rect x={-20} y={-6} width={40} height={40} rx={5} fill="#9DA3A5" stroke={SA.line} strokeWidth={3}/><rect x={-12} y={4} width={24} height={8} fill="#5E6468"/></g>
  <g transform={`translate(${CASE.latchR[0]} ${CASE.latchR[1] + 34}) rotate(${a})`} data-part="case-latch">
   <rect x={-20} y={-40} width={40} height={40} rx={5} fill="#B7BCBE" stroke={SA.line} strokeWidth={3}/><rect x={-12} y={-30} width={24} height={8} fill="#5E6468"/>
  </g>
  {/* the front pocket */}
  <path d={`M${px} ${py}H${px + pw}V${py + ph - 14}Q${px + pw} ${py + ph} ${px + pw - 14} ${py + ph}H${px + 14}Q${px} ${py + ph} ${px} ${py + ph - 14}Z`} fill="#3E4448" stroke={SA.line} strokeWidth={3}/>
  <path d={`M${px + 6} ${py + 10}H${px + pw - 6}`} stroke="#6A7176" strokeWidth={3} strokeDasharray="10 7"/>
 </g>;
};

/** The printed deployment plan, folded in three. `fold` runs 0 flat, 1 the lower third folded up,
 * 2 the upper third folded down. Drawn about the middle panel's centre, w wide, panel height ph. */
const Plan: React.FC<{fold: number; w?: number; ph?: number; pal: Pal}> = ({fold, w = 200, ph = 86, pal}) => {
 const f1 = clamp(fold), f2 = clamp(fold - 1);
 const c1 = Math.cos(Math.PI * ease(f1)), c2 = Math.cos(Math.PI * ease(f2));
 const sheet = (back: boolean) => back ? '#E2DACA' : '#FBF8F1';
 const lines = (y0: number, k: number) => Array.from({length: k}, (_, i) => <path key={i} d={`M${-w / 2 + 20} ${y0 + 20 + i * 18}H${w / 2 - 24 - (i % 2) * 30}`} stroke="#9EB4C8" strokeWidth={4}/>);
 return <g data-part="deployment-plan">
  {/* middle panel: the plan's heading and a small sketch of the station */}
  <rect x={-w / 2} y={-ph / 2} width={w} height={ph} fill={sheet(false)} stroke={SA.line} strokeWidth={2.4}/>
  <path d={`M${-w / 2 + 16} ${-ph / 2 + 18}H${w / 2 - 50}`} stroke={pal.ink} strokeWidth={8} opacity={.8}/>
  {lines(-ph / 2 + 18, 2)}
  <path d={`M${w / 2 - 34} ${ph / 2 - 10}V${-ph / 2 + 30}M${w / 2 - 46} ${-ph / 2 + 30}h24`} stroke={pal.ink} strokeWidth={3}/>
  {/* lower third, hinged on the lower crease */}
  <g transform={`translate(0 ${ph / 2}) scale(1 ${c1})`}>
   <rect x={-w / 2} y={0} width={w} height={ph} fill={sheet(c1 < 0)} stroke={SA.line} strokeWidth={2.4}/>
   {c1 > 0 && lines(0, 3)}
  </g>
  {/* upper third, hinged on the upper crease */}
  <g transform={`translate(0 ${-ph / 2}) scale(1 ${c2})`}>
   <rect x={-w / 2} y={-ph} width={w} height={ph} fill={sheet(c2 < 0)} stroke={SA.line} strokeWidth={2.4}/>
   {c2 > 0 && <g><text x={-w / 2 + 16} y={-ph + 34} fontFamily={FONT.body} fontSize={Math.min(22, (w - 32) / widthOf('Deployment plan', 1, true))} fontWeight={800} fill={pal.ink}>Deployment plan</text>{lines(-ph + 30, 2)}</g>}
  </g>
  <path d={`M${-w / 2} ${-ph / 2}H${w / 2}M${-w / 2} ${ph / 2}H${w / 2}`} stroke="#B9AE96" strokeWidth={1.6} strokeDasharray="6 5"/>
 </g>;
};

/** A complete technician standing behind the curb table, facing the camera, in a work shirt. The two
 * hands go where the episode sends them; `look` tips the head from the hands (-1) to level (0). */
/** The technician's rig in her own units: shoulders, arm bones, hand scale, the floor row she is
 * drawn for and her outline, so an episode can solve where her hands go and place her in a shot. */
export const TECH = {SL: [392, 610] as P, SR: [562, 612] as P, upper: 132, fore: 122, hand: 1.25, ground: 1150,
 head: [477, 486] as P, headR: 58, box: [364, 424, 590, 1150] as [number, number, number, number]};
/** `only` draws one arm of the arms layer, so an episode can put a carried object between them. */
const Technician: React.FC<{left: P; right: P; leftPose: HandPose; rightPose: HandPose; look: P; t: number; ground: number; layer: 'body' | 'arms'; only?: 'left' | 'right'}> = ({left, right, leftPose, rightPose, look, t, ground, layer, only}) => {
 const skin = '#8C5733', shade = '#6F4326', hair = '#1C1512', shirt = '#5F6E58', shirtShade = '#47533F', pants = '#3A4250';
 const b = 1.5 * Math.sin(t * 2 * Math.PI / 4.4);
 const SL: P = [TECH.SL[0], TECH.SL[1] + b * .4], SR: P = [TECH.SR[0], TECH.SR[1] + b * .4];
 const aL = reach(SL, left, TECH.upper, TECH.fore), aR = reach(SR, right, TECH.upper, TECH.fore);
 if (layer === 'arms') return <g data-part="technician-arms">
  {only !== 'right' && <g>
   <Limb a={SL} b={aL.E} wa={50} wb={42} fill={shirt}/><Limb a={aL.E} b={aL.W} wa={42} wb={34} fill={shirt}/>
   <Limb a={[lerp(aL.E[0], aL.W[0], .86), lerp(aL.E[1], aL.W[1], .86)]} b={aL.W} wa={30} wb={28} fill={skin}/>
   <Hand at={aL.W} deg={aL.deg} s={TECH.hand} pose={leftPose} skin={skin} side={-1}/></g>}
  {only !== 'left' && <g>
   <Limb a={SR} b={aR.E} wa={50} wb={42} fill={shirt}/><Limb a={aR.E} b={aR.W} wa={42} wb={34} fill={shirt}/>
   <Limb a={[lerp(aR.E[0], aR.W[0], .86), lerp(aR.E[1], aR.W[1], .86)]} b={aR.W} wa={30} wb={28} fill={skin}/>
   <Hand at={aR.W} deg={aR.deg} s={TECH.hand} pose={rightPose} skin={skin} side={1}/></g>}
 </g>;
 return <g data-part="technician">
  {/* legs to the ground behind the table */}
  <Limb a={[436, 940]} b={[430, ground - 24]} wa={64} wb={50} fill={pants}/>
  <Limb a={[520, 940]} b={[534, ground - 24]} wa={64} wb={50} fill={pants}/>
  <path d={`M398 ${ground - 30}Q400 ${ground - 46} 432 ${ground - 46}L456 ${ground - 40}Q462 ${ground - 18} 460 ${ground}L392 ${ground}Z`} fill="#3B2E24" stroke={SA.line} strokeWidth={3}/>
  <path d={`M512 ${ground - 40}L540 ${ground - 46}Q568 ${ground - 46} 570 ${ground - 30}L572 ${ground}L506 ${ground}Q504 ${ground - 18} 512 ${ground - 40}Z`} fill="#3B2E24" stroke={SA.line} strokeWidth={3}/>
  {/* torso */}
  <path d={`M380 ${602 + b}Q476 ${574 + b} 574 ${604 + b}Q592 700 572 960L384 962Q364 700 380 ${602 + b}Z`} fill={SA.line} transform="translate(0 -3)"/>
  <path d={`M383 ${604 + b}Q476 ${578 + b} 571 ${606 + b}Q588 700 569 958L387 960Q368 700 383 ${604 + b}Z`} fill={shirt}/>
  <path d="M540 640Q566 760 556 950" stroke={shirtShade} strokeWidth={26} fill="none" opacity={.7}/>
  <path d={`M444 ${590 + b}L476 ${640 + b}L508 ${590 + b}`} stroke={shirtShade} strokeWidth={8} fill="none"/>
  {[680, 740, 800, 860].map(y => <circle key={y} cx={477} cy={y} r={4} fill="#D8D2C2"/>)}
  <rect x={410} y={690} width={46} height={40} rx={4} fill={shirtShade} opacity={.7}/>
  {/* neck and head, looking down at the hands */}
  <Limb a={[477, 548]} b={[477, 590]} wa={44} wb={50} fill={skin}/>
  <Head c={[477 + look[0] * 10, 486]} r={58} yaw={look[0] * .3} pitch={look[1]} skin={skin} shade={shade} hair={hair} style="bun"/>
  {/* shoulder caps; the arms are drawn in their own layer, in front of the table and the case */}
  <circle cx={SL[0]} cy={SL[1]} r={25} fill={shirt} stroke={SA.line} strokeWidth={2.6}/>
  <circle cx={SR[0]} cy={SR[1]} r={25} fill={shirt} stroke={SA.line} strokeWidth={2.6}/>
 </g>;
};

/** A forearm and hand entering from a frame edge, in a work sleeve: the hand that stamps and reads. */
const Reacher: React.FC<{from: P; at: P; pose: HandPose; skin?: string; sleeve?: string; s?: number}> = ({from, at, pose, skin = '#A96F45', sleeve = '#6B7A86', s = 1.4}) => {
 const deg = Math.atan2(at[1] - from[1], at[0] - from[0]) * 180 / Math.PI;
 const cuff: P = [lerp(from[0], at[0], .82), lerp(from[1], at[1], .82)];
 return <g data-part="reaching-hand">
  <Limb a={from} b={cuff} wa={70 * s / 1.4} wb={58 * s / 1.4} fill={sleeve}/>
  <Limb a={cuff} b={at} wa={42 * s / 1.4} wb={38 * s / 1.4} fill={skin}/>
  <Hand at={at} deg={deg} s={s} pose={pose} skin={skin}/>
 </g>;
};

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
 | {part: 'fence'; x0: number; x1: number; h?: number; posts?: number; lean?: number; mark?: number; sway?: number}
 | {part: 'oak'; h?: number; seed?: number; flip?: boolean}
 | {part: 'porch'; w?: number}
 | {part: 'phone'; banner?: number; t?: number; pal: Pal; w?: number; h?: number; font?: number; buzz?: number}
 | {part: 'water'; x0: number; x1: number; y: number; depth: number; t: number; seed?: number; edge?: 'lobed' | 'straight'; opacity?: number; reflect?: React.ReactNode}
 | {part: 'waterline'; x: number; y: number; w: number; t: number}
 | {part: 'tower'; h?: number; dim?: number}
 | {part: 'server'; w?: number}
 | {part: 'hub'; lamp?: number; glow?: number; pal: Pal}
 | {part: 'house'; w?: number; seed?: number; color?: string}
 | {part: 'rings'; p: number; rx: number; ry: number; n?: number; pal: Pal; width?: number}
 | {part: 'desk'; children?: React.ReactNode; screen: [number, number, number, number]; hand: P; pose: HandPose; look: number; t: number; press?: number}
 | {part: 'dashboard'; w: number; h: number; dots?: number; paths?: number; zones?: number; t?: number; pal: Pal; header?: boolean}
 | {part: 'radiomap'; w: number; h: number; ring?: number; half?: number; five?: number; hub?: number; pal: Pal; station: P; hubAt: P}
 | {part: 'card'; fill?: number; value: string; share: number; pal: Pal; figure?: number; rollOut?: number}
 | {part: 'result'; stamp?: number; pal: Pal}
 | {part: 'stamp'}
 | {part: 'pin'; color: string; press?: number}
 | {part: 'board'; x0: number; x1: number; y0: number; y1: number; ground: number}
 | {part: 'mapcard'; w: number; h: number; pal: Pal; seed?: number}
 | {part: 'table'; x0: number; x1: number; y: number; depth: number; ground: number}
 | {part: 'case'; latch: number}
 | {part: 'plan'; fold: number; w?: number; ph?: number; pal: Pal}
 | {part: 'technician'; left: P; right: P; leftPose: HandPose; rightPose: HandPose; look: P; t: number; ground: number; layer: 'body' | 'arms'; only?: 'left' | 'right'}
 | {part: 'reacher'; from: P; at: P; pose: HandPose; skin?: string; sleeve?: string; s?: number}
 | {part: 'boots'; seed?: number}
 | {part: 'rain'; t: number; w: number; h: number; seed?: number; n?: number; opacity?: number}
 | {part: 'label'; text: string; pal: Pal; size?: number; tone?: 'paper' | 'accent' | 'ink'};

/** The support group's one export: the street, the yard, the hub and its papers, and the curb table. */
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
 case 'waterline': return <Waterline {...props}/>;
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
 case 'stamp': return <Stamp/>;
 case 'pin': return <Pin {...props}/>;
 case 'board': return <NoticeBoard {...props}/>;
 case 'mapcard': return <MapCard {...props}/>;
 case 'table': return <FoldingTable {...props}/>;
 case 'case': return <CarryCase {...props}/>;
 case 'plan': return <Plan {...props}/>;
 case 'technician': return <Technician {...props}/>;
 case 'reacher': return <Reacher {...props}/>;
 case 'boots': return <Boots/>;
 case 'rain': return <Rain {...props}/>;
 case 'label': return <SupportTag {...props}/>;
 }
 throw new Error('Unknown street and hub part');
};
