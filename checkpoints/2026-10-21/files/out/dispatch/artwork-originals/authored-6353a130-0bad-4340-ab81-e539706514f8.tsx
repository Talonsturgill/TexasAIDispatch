import React from 'react';
import {useUid} from '../../../lib/uid';
import {FONT,widthOf} from '../../../lib/type';
import texas from '../../texasCounties.json';

/**
 * LeakReviewSupport, the fresh authored support group for the 2026-10-21 edition (leak-review-v1).
 *
 * The drone's world and its records, drawn new for this story:
 *  - a Permian well pad on caliche: tire tracks, gravel, a mesquite and creosote at its edge, a
 *    galvanized horizontal separator on saddles with a sight glass and a gauge, a valve manifold with
 *    handwheel gate valves (the point of interest), a stock tank with a ladder, a rail and a thief
 *    hatch, pipe runs between them, and a far pumpjack whose beam rocks on the film clock; the same pad
 *    straight down; a small far version seen through the review room's window; a round field vignette
 *    of the valve the follow-up goes to;
 *  - the flight plan in the air (a dashed route and point of interest rings);
 *  - a flat Texas locator with an Austin pin and a Permian Basin pin joined by a line, drawn from the
 *    committed county map;
 *  - a rugged field tablet that stands on a kickstand or lies flat, with the flight screen (status row,
 *    pad map, anomaly marker, amber alert flag) and the review screen (survey footage, filmstrip, a
 *    certified inspector mark, a dashed outline, a blank dashed AI box);
 *  - an illustrated infrared valve view whose warm shimmer is illustrative and labelled so;
 *  - paper: an unsealed approval letter with worn corners and lines that write in, a crooked date
 *    stamp and an approved mark, a rubber stamp seen from the side or above, a long letter page with the
 *    protocol title, a luggage tag, a delayed bar, an easel desk calendar and a tear-off day block that
 *    flip, a release card, a proposal tag's empty dashed stamp box, a paper clip, a desk, a hard hat, a
 *    mug and a pen.
 *
 * Warm paper against cool galvanized gray, one amber for the alert lamp, the stamps and the highlighted
 * AI. Nothing is symmetric, everything is maintained but worn. No agency seal, no logo, no brand mark,
 * no real letter page, site, leak, plume or person: the inspector appears only as a mark and a line.
 * Pure function of its props; the episode drives every prop from the film frame clock.
 */

export type Pt=[number,number];
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
const smooth=(p:number)=>{const q=clamp(p);return q*q*(3-2*q);};
const f2=(v:number)=>v.toFixed(2);
/** A fixed scatter: the same value for the same index on every frame and every render. */
export const hash=(i:number)=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);};

export const LR={caliche:'#D9C9A3',calicheLit:'#E8DCBE',calicheShade:'#B9A57E',track:'#CDBB93',steel:'#A9B1B5',steelLit:'#DCE0E0',steelDeep:'#6E777C',
 paper:'#F0E8D4',paperLit:'#FBF6EA',paperShade:'#D9CDB1',ink:'#1E262B',inkSoft:'#4C565C',line:'#9A9384',amber:'#E8A11C',amberInk:'#9C6206',
 rust:'#9A5B32',screen:'#16202A',mesquite:'#5F6B45',desk:'#8C7A63',deskLit:'#A8957C',deskShade:'#6C5C49'};

// ---- small shared pieces --------------------------------------------------------------------------------
const Txt:React.FC<{x:number;y:number;size:number;bold?:boolean;fill?:string;anchor?:'start'|'middle'|'end';children:React.ReactNode;font?:string;opacity?:number}>=
 ({x,y,size,bold=false,fill=LR.ink,anchor='start',children,font=FONT.body,opacity=1})=>
 <text x={f2(x)} y={f2(y)} fontFamily={font} fontSize={size} fontWeight={bold?700:500} fill={fill} textAnchor={anchor} opacity={opacity}>{children}</text>;

/** A block of gray text bars that write in from the left: `p` 0 to 1 across all of them in order. */
const Lines:React.FC<{x:number;y:number;w:number;n:number;gap:number;p?:number;seed:number;h?:number;fill?:string}>=({x,y,w,n,gap,p=1,seed,h=9,fill=LR.line})=>
 <g>{Array.from({length:n},(_,i)=>{const len=w*(i===n-1?.45+.25*hash(seed+i):.78+.22*hash(seed+i)),q=clamp(p*n-i);
  return q>0?<rect key={i} x={x} y={f2(y+i*gap)} width={f2(len*q)} height={h} rx={h/2} fill={fill} opacity={.8}/>:null;})}</g>;

// ---- the well pad, side on (world units are film pixels at the wide) --------------------------------------
/** Where the pad's equipment stands in the side world, shared with the episode's cameras and the bound
 * check. The valve handwheel is the point of interest the drone flies to and the follow-up goes to. */
export const PAD={horizon:995,far:1006,stationX:300,stationY:1186,equipY:1080,
 separator:{x0:470,x1:735,cy:1012,r:40},tank:{x0:892,x1:1034,top:842,base:1074},
 valve:{x:812,y:1032,base:1100},pump:{x:150,y:1013},mesquite:{x:72,y:1118}};
const Pumpjack:React.FC<{x:number;y:number;s:number;t:number}>=({x,y,s,t})=>{
 const a=9*Math.sin(2*Math.PI*t/6.4+1.2),ar=a*Math.PI/180;
 return <g transform={`translate(${x} ${y}) scale(${s})`} data-part="pumpjack" opacity={.9}>
  <path d="M-40 0L-10 -62L16 0" stroke="#4A4F50" strokeWidth={5} fill="none"/>
  <rect x={-56} y={-4} width={110} height={6} fill="#4A4F50"/>
  <g transform={`translate(-10 -62) rotate(${f2(a)})`}>
   <rect x={-56} y={-6} width={92} height={10} rx={2} fill="#3F4446"/>
   <path d="M36 -12q18 2 18 18q0 14 -12 18" fill="#3F4446"/>
  </g>
  <path d={`M${f2(-10-56*Math.cos(ar))} ${f2(-62-56*Math.sin(ar))}L-62 -10`} stroke="#3F4446" strokeWidth={4}/>
  <rect x={38} y={-34} width={20} height={34} fill="#4A4F50"/>
 </g>;
};
/** A mesquite: a few crooked trunks and a lopsided crown of small leaf clumps, never balanced. */
const Mesquite:React.FC<{x:number;y:number;s:number}>=({x,y,s})=>
 <g transform={`translate(${x} ${y}) scale(${s})`} data-part="mesquite">
  <path d="M0 0C-4 -30 -18 -50 -40 -70M2 0C8 -36 30 -52 50 -80M0 -2C2 -40 -6 -70 4 -96" stroke="#4B3A2A" strokeWidth={6} fill="none" strokeLinecap="round"/>
  {Array.from({length:16},(_,i)=>{const a=-2.9+2.5*hash(i+7),r=50+42*hash(i+31);
   return <ellipse key={i} cx={f2(r*Math.cos(a)+8)} cy={f2(-70+r*Math.sin(a)*.55)} rx={f2(20+10*hash(i+3))} ry={f2(11+5*hash(i+9))} fill={i%3?LR.mesquite:'#6F7B52'} opacity={.92}/>;})}
 </g>;
const Separator:React.FC<{}>=()=>{
 const id=useUid('lrsep'),S=PAD.separator,len=S.x1-S.x0;
 return <g data-part="separator">
  <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={LR.steelLit}/><stop offset=".45" stopColor={LR.steel}/><stop offset="1" stopColor={LR.steelDeep}/></linearGradient></defs>
  <ellipse cx={(S.x0+S.x1)/2+24} cy={PAD.equipY+3} rx={len*.58} ry={9} fill="#1A1410" opacity={.3}/>
  {[S.x0+50,S.x1-60].map((x,k)=><path key={k} d={`M${x-26} ${PAD.equipY}L${x-18} ${S.cy+16}H${x+18}L${x+26} ${PAD.equipY}Z`} fill="#7D868B" stroke={LR.ink} strokeWidth={1.6}/>)}
  <rect x={S.x0} y={S.cy-S.r} width={len} height={S.r*2} fill={`url(#${id})`} stroke={LR.ink} strokeWidth={2}/>
  <ellipse cx={S.x0} cy={S.cy} rx={14} ry={S.r} fill="#C3C9CB" stroke={LR.ink} strokeWidth={2}/>
  <ellipse cx={S.x1} cy={S.cy} rx={14} ry={S.r} fill="#8C959A" stroke={LR.ink} strokeWidth={2}/>
  {[.33,.66].map((u,k)=><path key={k} d={`M${S.x0+len*u} ${S.cy-S.r}v${S.r*2}`} stroke="#8D969A" strokeWidth={1.6}/>)}
  <rect x={S.x0+40} y={S.cy-14} width={10} height={30} rx={3} fill="#3A4247"/><rect x={S.x0+42} y={S.cy-2} width={6} height={14} rx={2} fill="#8DA19A"/>
  <circle cx={S.x0+160} cy={S.cy-S.r-14} r={11} fill="#F2EFE6" stroke={LR.ink} strokeWidth={2}/><path d={`M${S.x0+160} ${S.cy-S.r-14}l6 -5`} stroke={LR.ink} strokeWidth={2}/>
  <path d={`M${S.x0+160} ${S.cy-S.r-3}v4`} stroke={LR.ink} strokeWidth={3}/>
  <path d={`M${S.x0+210} ${S.cy+4}q2 14 -2 28`} stroke={LR.rust} strokeWidth={3} opacity={.6} fill="none"/>
 </g>;
};
const Tank:React.FC<{}>=()=>{
 const id=useUid('lrtank'),T=PAD.tank,w=T.x1-T.x0;
 return <g data-part="tank">
  <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={LR.steelLit}/><stop offset=".4" stopColor={LR.steel}/><stop offset="1" stopColor={LR.steelDeep}/></linearGradient></defs>
  <ellipse cx={T.x0+w*.62} cy={T.base+3} rx={w*.7} ry={8} fill="#1A1410" opacity={.3}/>
  <path d={`M${T.x0} ${T.base}V${T.top}L${T.x0+w*.5} ${T.top-16}L${T.x1} ${T.top}V${T.base}Z`} fill={`url(#${id})`} stroke={LR.ink} strokeWidth={2}/>
  {[1,2,3,4].map(k=><path key={k} d={`M${T.x0} ${T.top+k*46}H${T.x1}`} stroke="#8E979B" strokeWidth={1.4} opacity={.8}/>)}
  <path d={`M${T.x0+12} ${T.base}V${T.top-4}M${T.x0+30} ${T.base}V${T.top-4}`} stroke="#4C5459" strokeWidth={3}/>
  {Array.from({length:10},(_,k)=><path key={k} d={`M${T.x0+12} ${T.base-12-k*22}h18`} stroke="#4C5459" strokeWidth={2.4}/>)}
  <path d={`M${T.x0+4} ${T.top-6}V${T.top-34}H${T.x0+w*.62}V${T.top-22}`} stroke="#4C5459" strokeWidth={2.6} fill="none"/>
  <rect x={T.x0+w*.62} y={T.top-24} width={18} height={10} rx={2} fill="#5E676C"/>
  <path d={`M${T.x1-30} ${T.top+60}q3 22 -2 52`} stroke={LR.rust} strokeWidth={3.4} opacity={.7} fill="none"/>
  <path d={`M${T.x1-58} ${T.top+140}q10 -4 20 2`} stroke="#6E777C" strokeWidth={3} fill="none"/>
 </g>;
};
/** The valve manifold: a riser, a run of pipe and two gate valves with handwheels. `hot` warms the point
 * of interest valve's stem a little when the follow-up reaches it. */
const Valves:React.FC<{hot?:number}>=({hot=0})=>{
 const V=PAD.valve,S=PAD.separator,T=PAD.tank;
 const wheel=(x:number,y:number,k:number)=><g key={k}>
  <path d={`M${x} ${y+16}v18`} stroke="#4A5257" strokeWidth={5}/>
  <ellipse cx={x} cy={y} rx={7} ry={17} fill="none" stroke={k===0?'#B64B33':'#3C6E8F'} strokeWidth={5}/>
  <path d={`M${x} ${y-15}v30`} stroke={k===0?'#8F3A27':'#2E5670'} strokeWidth={2.4}/>
 </g>;
 return <g data-part="valves">
  <path d={`M${S.x1} ${S.cy+18}H${V.x-40}V${V.y+40}H${T.x0-10}V${T.base-40}H${T.x0}`} stroke="#7A8388" strokeWidth={13} fill="none" strokeLinejoin="round"/>
  <path d={`M${S.x1} ${S.cy+14}H${V.x-44}V${V.y+36}H${T.x0-14}`} stroke="#C2C8CA" strokeWidth={3} fill="none" opacity={.8}/>
  <path d={`M${V.x-40} ${V.base}V${V.y+40}`} stroke="#6E777C" strokeWidth={14}/>
  <rect x={V.x-62} y={V.base-6} width={44} height={8} fill="#8F8770"/>
  {[V.x-22,V.x+46].map((x,k)=><g key={k}><rect x={x-14} y={V.y+30} width={28} height={22} rx={3} fill="#6A7378" stroke={LR.ink} strokeWidth={1.6}/>
   {[0,1,2].map(j=><circle key={j} cx={x-9+j*9} cy={V.y+34} r={1.8} fill="#C9CECF"/>)}</g>)}
  {wheel(V.x-22,V.y,1)}
  {wheel(V.x+46,V.y-2,0)}
  {hot>0&&<circle cx={V.x+46} cy={V.y+26} r={f2(6+6*hot)} fill={LR.amber} opacity={f2(.35*hot)}/>}
 </g>;
};
/** The point of interest handwheel's centre in the side world. */
export const VALVE_POI:Pt=[PAD.valve.x+46,PAD.valve.y-2];

/** The pad seen from the side, behind the station: caliche with tracks and gravel, the far edge's berm,
 * a mesquite, the pumpjack, then the equipment. */
const PadSide:React.FC<{t:number;hot?:number;equipment?:boolean}>=({t,hot=0,equipment=true})=>{
 const id=useUid('lrpad');
 const edge=Array.from({length:14},(_,i)=>[-120+i*100,PAD.far+6*Math.sin(i*1.7)+4*hash(i)] as Pt);
 const d=`M-160 1980L${edge.map(([x,y])=>`${f2(x)} ${f2(y)}`).join('L')}L1240 ${PAD.far}L1240 1980Z`;
 return <g data-part="pad-side">
  <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={LR.calicheShade}/><stop offset=".25" stopColor={LR.caliche}/><stop offset="1" stopColor={LR.calicheLit}/></linearGradient></defs>
  <Pumpjack x={PAD.pump.x} y={PAD.pump.y} s={.55} t={t}/>
  <path d={d} fill={`url(#${id})`}/>
  <path d={edge.map(([x,y],i)=>`${i?'L':'M'}${f2(x)} ${f2(y)}`).join('')} stroke="#A8936B" strokeWidth={4} fill="none" opacity={.7}/>
  <path d="M-80 1980C120 1500 300 1210 520 1040" stroke={LR.track} strokeWidth={70} fill="none" opacity={.55}/>
  <path d="M120 1980C300 1520 420 1220 600 1040" stroke={LR.track} strokeWidth={60} fill="none" opacity={.5}/>
  {Array.from({length:70},(_,i)=>{const x=-60+1200*hash(i+101),y=PAD.far+12+900*Math.pow(hash(i+202),1.6),r=1.5+3.5*hash(i+303)*(y-PAD.far)/500;
   return <ellipse key={i} cx={f2(x)} cy={f2(y)} rx={f2(r*1.4)} ry={f2(r)} fill={i%4?'#BFAE87':'#F1E7CF'} opacity={.8}/>;})}
  <Mesquite x={PAD.mesquite.x} y={PAD.mesquite.y} s={.9}/>
  {[[1020,1132],[690,1120],[160,1040]].map(([x,y],k)=><g key={k} transform={`translate(${x} ${y})`}>
   {Array.from({length:7},(_,j)=><path key={j} d={`M0 0q${f2(-14+28*hash(k*9+j))} -18 ${f2(-18+36*hash(k*9+j+4))} -${f2(20+14*hash(j+k))}`} stroke="#7D7A55" strokeWidth={3} fill="none"/>)}</g>)}
  <path d="M410 1150q30 6 64 0" stroke={LR.rust} strokeWidth={6} opacity={.18} fill="none"/>
  {equipment&&<g data-part="equipment"><Separator/><Tank/><Valves hot={hot}/></g>}
 </g>;
};
// ---- the pad straight down ------------------------------------------------------------------------------
export const PAD_TOP={station:[300,1080] as Pt,stationS:.62,separator:{c:[640,720] as Pt,w:300,h:92,rot:8},tank:{c:[850,460] as Pt,r:84},
 valve:[790,880] as Pt,valve2:[840,700] as Pt,mesquite:[150,1210] as Pt};
const PadTop:React.FC<{t:number;hot?:number}>=({t,hot=0})=>{
 const id=useUid('lrpadtop'),S=PAD_TOP.separator,T=PAD_TOP.tank,V=PAD_TOP.valve,V2=PAD_TOP.valve2;
 const pts:Pt[]=[[86,300],[520,262],[1012,318],[1046,860],[1018,1330],[560,1372],[52,1338],[30,820]];
 const d=pts.map(([x,y],i)=>`${i?'L':'M'}${f2(x+10*Math.sin(i*2.3))} ${y}`).join('')+'Z';
 return <g data-part="pad-top">
  <defs><radialGradient id={id} cx=".4" cy=".35" r=".8"><stop offset="0" stopColor={LR.calicheLit}/><stop offset="1" stopColor={LR.calicheShade}/></radialGradient></defs>
  <path d={d} fill={`url(#${id})`} stroke="#A8936B" strokeWidth={5}/>
  <path d="M120 1360C260 1160 520 1000 700 820" stroke={LR.track} strokeWidth={56} fill="none" opacity={.6}/>
  {Array.from({length:60},(_,i)=><circle key={i} cx={f2(80+920*hash(i+11))} cy={f2(320+1000*hash(i+29))} r={f2(2+3*hash(i+47))} fill={i%3?'#BFAE87':'#F3E9D2'} opacity={.8}/>)}
  <path d={`M${S.c[0]+150} ${S.c[1]+20}L${V[0]} ${V[1]}L${V2[0]+40} ${V[1]}L${V2[0]+40} ${T.c[1]+70}`} stroke="#7A8388" strokeWidth={14} fill="none" strokeLinejoin="round"/>
  <path d={`M${S.c[0]+150} ${S.c[1]+16}L${V[0]-4} ${V[1]-4}`} stroke="#C2C8CA" strokeWidth={3} opacity={.8}/>
  <g transform={`translate(${S.c[0]} ${S.c[1]}) rotate(${S.rot})`}>
   <rect x={-S.w/2+10} y={S.h/2-6} width={S.w} height={20} rx={10} fill="#1A1410" opacity={.22}/>
   <rect x={-S.w/2} y={-S.h/2} width={S.w} height={S.h} rx={S.h/2} fill="#C9CFD1" stroke={LR.ink} strokeWidth={3}/>
   <rect x={-S.w/2+20} y={-S.h/2+12} width={S.w-60} height={14} rx={7} fill={LR.steelLit} opacity={.9}/>
   <circle cx={-40} cy={-6} r={11} fill="#F2EFE6" stroke={LR.ink} strokeWidth={2}/>
  </g>
  <circle cx={T.c[0]+12} cy={T.c[1]+14} r={T.r} fill="#1A1410" opacity={.22}/>
  <circle cx={T.c[0]} cy={T.c[1]} r={T.r} fill="#B3BBBF" stroke={LR.ink} strokeWidth={3}/>
  <circle cx={T.c[0]-14} cy={T.c[1]-16} r={T.r*.62} fill={LR.steelLit} opacity={.7}/>
  <rect x={T.c[0]+18} y={T.c[1]-12} width={26} height={22} rx={3} fill="#5E676C"/>
  <path d={`M${T.c[0]-T.r} ${T.c[1]}a${T.r} ${T.r} 0 0 0 30 58`} stroke={LR.rust} strokeWidth={4} fill="none" opacity={.5}/>
  {[V,V2].map(([x,y],k)=><g key={k}>
   <circle cx={x} cy={y} r={20} fill="none" stroke={k===0?'#B64B33':'#3C6E8F'} strokeWidth={6}/>
   <path d={`M${x-18} ${y}h36M${x} ${y-18}v36`} stroke={k===0?'#8F3A27':'#2E5670'} strokeWidth={3}/>
  </g>)}
  {hot>0&&<circle cx={V[0]} cy={V[1]} r={f2(28+8*hot)} fill={LR.amber} opacity={f2(.3*hot)}/>}
  <g transform={`translate(${PAD_TOP.mesquite[0]} ${PAD_TOP.mesquite[1]})`}>
   {Array.from({length:12},(_,i)=>{const a=6.28*hash(i+5),r=30+40*hash(i+8);return <circle key={i} cx={f2(r*Math.cos(a))} cy={f2(r*Math.sin(a)*.8)} r={f2(18+10*hash(i))} fill={i%3?LR.mesquite:'#6F7B52'}/>;})}
  </g>
  <g transform="translate(150 420) rotate(-20)" opacity={.85} data-part="pumpjack-top">
   <rect x={-60} y={-8} width={110} height={16} rx={3} fill="#3F4446"/><circle cx={-6} cy={0} r={12} fill="#4A4F50"/>
   <rect x={40} y={-20} width={26} height={40} fill="#4A4F50"/><path d={`M${f2(-56+6*Math.sin(2*Math.PI*t/6.4+1.2))} 0h-14`} stroke="#3F4446" strokeWidth={8}/>
  </g>
 </g>;
};

// ---- the flight plan in the air -------------------------------------------------------------------------
/** A dashed route through points, drawn to `p` of its length. */
const Route:React.FC<{pts:Pt[];p:number;w?:number}>=({pts,p,w=5})=>{
 const segs=pts.slice(1).map((q,i)=>Math.hypot(q[0]-pts[i][0],q[1]-pts[i][1])),L=segs.reduce((a,b)=>a+b,0);
 let left=L*clamp(p);const d:string[]=[`M${f2(pts[0][0])} ${f2(pts[0][1])}`];
 for(let i=0;i<segs.length&&left>0;i++){const u=Math.min(1,left/segs[i]);left-=segs[i];
  d.push(`L${f2(lerp(pts[i][0],pts[i+1][0],u))} ${f2(lerp(pts[i][1],pts[i+1][1],u))}`);}
 const path=d.join('');
 return <g data-part="route"><path d={path} stroke={LR.ink} strokeWidth={w+4} strokeDasharray={`${w*4} ${w*3}`} fill="none" opacity={.35} strokeLinecap="round"/>
  <path d={path} stroke={LR.paperLit} strokeWidth={w} strokeDasharray={`${w*4} ${w*3}`} fill="none" strokeLinecap="round"/></g>;
};
/** A point of interest ring hanging in the air: a ring and a centre dot, with a dashed drop to what it
 * marks. `on` lights it amber when the drone arrives; `pulse` swells it once. */
const PoiRing:React.FC<{r:number;on:number;pulse:number;drop?:number;show?:number}>=({r,on,pulse,drop=0,show=1})=>{
 const s=1+.18*Math.sin(Math.PI*clamp(pulse)),lit=on>.5;
 return <g data-part="poi" opacity={f2(show)}>
  {drop>0&&<path d={`M0 ${r}V${drop}`} stroke={LR.paperLit} strokeWidth={3} strokeDasharray="6 7" opacity={.85}/>}
  <g transform={`scale(${f2(s)})`}>
   <circle r={r+4} fill="none" stroke={LR.ink} strokeWidth={4} opacity={.35}/>
   <circle r={r} fill={LR.amber} fillOpacity={f2(.14*on)} stroke={lit?LR.amber:LR.paperLit} strokeWidth={6}/>
   <circle r={r*.22} fill={lit?LR.amber:LR.paperLit}/>
  </g>
 </g>;
};

// ---- the Texas locator ----------------------------------------------------------------------------------
type CountyMap={width:number;height:number;outline:string;counties:Record<string,{label:[number,number]}>};
const MAP=texas as unknown as CountyMap;
/** A flat card with the state's outline, the Permian Basin pin (Ector County) and the Austin pin
 * (Travis County). The line between them draws with `p`; each pin drops as the line reaches it. */
const Locator:React.FC<{w:number;p:number}>=({w,p})=>{
 const k=(w-40)/MAP.width,h=locatorHeight(w),A=MAP.counties['Travis'].label,B=MAP.counties['Ector'].label;
 const at=(q:[number,number]):Pt=>[20+q[0]*k,20+q[1]*k];
 const a=at(B),b=at(A),u=smooth(p),m:Pt=[lerp(a[0],b[0],u),lerp(a[1],b[1],u)];
 const pin=(q:Pt,s:number,label:string,lx:number,ly:number)=><g opacity={f2(clamp(s*3))}>
  <g transform={`translate(${f2(q[0])} ${f2(q[1]-16*(1-smooth(s)))})`}>
   <path d="M0 0C-12 -16 -14 -24 -14 -30A14 14 0 1 1 14 -30C14 -24 12 -16 0 0Z" fill={LR.amber} stroke={LR.ink} strokeWidth={2.5}/>
   <circle cx={0} cy={-30} r={5} fill={LR.ink}/>
  </g>
  <Txt x={lx} y={ly} size={32} bold>{label}</Txt>
 </g>;
 return <g data-part="locator">
  <rect x={6} y={8} width={w} height={h} rx={14} fill={LR.ink} opacity={.18}/>
  <rect x={0} y={0} width={w} height={h} rx={14} fill={LR.paper} stroke={LR.ink} strokeWidth={3}/>
  <g transform={`translate(20 20) scale(${f2(k)})`}><path d={MAP.outline} fill="#E4D8BC" stroke={LR.ink} strokeWidth={f2(2.4/k)} strokeLinejoin="round"/></g>
  {p>0&&<path d={`M${f2(a[0])} ${f2(a[1])}L${f2(m[0])} ${f2(m[1])}`} stroke={LR.ink} strokeWidth={4} strokeDasharray="12 8" fill="none"/>}
  {pin(a,clamp(p*4),'Permian Basin',20,h-56)}
  {pin(b,clamp((p-.75)*4),'Austin',w-24-widthOf('Austin',32,true),h-20)}
 </g>;
};
/** The locator card's height for a width. */
export const locatorHeight=(w:number)=>MAP.height*(w-40)/MAP.width+96;
// ---- outline helpers: drawn strokes need real paths, so pathLength reveals them evenly ---------------------
const ellipsePath=(cx:number,cy:number,rx:number,ry:number)=>
 `M${f2(cx)} ${f2(cy-ry)}A${f2(rx)} ${f2(ry)} 0 1 1 ${f2(cx-.01)} ${f2(cy-ry)}Z`;
const rrectPath=(x:number,y:number,w:number,h:number,r:number)=>
 `M${f2(x+r)} ${f2(y)}H${f2(x+w-r)}Q${f2(x+w)} ${f2(y)} ${f2(x+w)} ${f2(y+r)}V${f2(y+h-r)}Q${f2(x+w)} ${f2(y+h)} ${f2(x+w-r)} ${f2(y+h)}H${f2(x+r)}Q${f2(x)} ${f2(y+h)} ${f2(x)} ${f2(y+h-r)}V${f2(y+r)}Q${f2(x)} ${f2(y)} ${f2(x+r)} ${f2(y)}Z`;
/** A dashed outline revealed round its length by `p`: the dashes stay put, a mask uncovers them. */
const DrawnDashes:React.FC<{d:string;p:number;stroke:string;width:number;dash:string;id:string}>=({d,p,stroke,width,dash,id})=>
 <g><defs><mask id={id} maskUnits="userSpaceOnUse" x={-4000} y={-4000} width={8000} height={8000}>
  <path d={d} fill="none" stroke="#fff" strokeWidth={width*4} pathLength={1} strokeDasharray="1 1" strokeDashoffset={f2(1-clamp(p))}/></mask></defs>
  <path d={d} fill="none" stroke={stroke} strokeWidth={width} strokeDasharray={dash} mask={`url(#${id})`} strokeLinecap="round"/></g>;

// ---- the field tablet and its screens ---------------------------------------------------------------------
/** A rugged field tablet, screen W by H in its own units, with rubber bumper corners. `stand` shows its
 * kickstand and a shadow on the desk; otherwise it lies flat. `pulse` rings its bezel amber once. */
const Tablet:React.FC<{W:number;H:number;stand?:boolean;pulse?:number;children?:React.ReactNode}>=({W,H,stand=true,pulse=0,children})=>{
 const id=useUid('lrtab'),b=26;
 return <g data-part="tablet">
  <defs><clipPath id={id+'c'}><rect x={0} y={0} width={W} height={H} rx={6}/></clipPath>
   <linearGradient id={id+'g'} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3A444B"/><stop offset="1" stopColor="#1C2328"/></linearGradient></defs>
  {stand?<path d={`M${W*.08} ${H+b}L${W*.02} ${H+b+50}H${W*1.06}L${W*.96} ${H+b}Z`} fill="#1A1410" opacity={.28}/>:
   <rect x={-b+14} y={-b+18} width={W+2*b} height={H+2*b} rx={30} fill="#1A1410" opacity={.25}/>}
  {stand&&<path d={`M${W*.66} ${H*.55}L${W*.74} ${H+b+34}`} stroke="#22292E" strokeWidth={16} strokeLinecap="round"/>}
  <rect x={-b} y={-b} width={W+2*b} height={H+2*b} rx={30} fill={`url(#${id}g)`} stroke={LR.ink} strokeWidth={3}/>
  {[[-b,-b],[W+b,-b],[-b,H+b],[W+b,H+b]].map(([x,y],k)=><circle key={k} cx={x+(x<0?16:-16)} cy={y+(y<0?16:-16)} r={22} fill="#2B2F31" stroke={LR.ink} strokeWidth={2}/>)}
  {pulse>0&&<rect x={-b+5} y={-b+5} width={W+2*b-10} height={H+2*b-10} rx={26} fill="none" stroke={LR.amber} strokeWidth={8} opacity={f2(pulse)}/>}
  <rect x={0} y={0} width={W} height={H} rx={6} fill={LR.screen}/>
  <g clipPath={`url(#${id}c)`}>{children}</g>
  <path d={`M${-b+30} ${-b+9}H${W*.4}`} stroke="#6B757C" strokeWidth={3} opacity={.6} strokeLinecap="round"/>
  <path d={`M${W*.7} ${H+b-7}l40 -2`} stroke="#5A646B" strokeWidth={3} opacity={.7}/>
 </g>;
};
/** The flight screen. `lit` lights it (the status row, then the pad map), the anomaly marker sits on the
 * point of interest valve, `flag` raises and lights the amber alert flag on it, `t` moves the drone dot. */
export const FLIGHT_FLAG={u:.36,v:.62,pole:58,cloth:[170,48] as Pt};
const flightMap=(W:number,H:number)=>{const row=Math.round(H*.16),mapY=row+14;return {row,mapY,mapH:H-mapY-14};};
const FlightScreen:React.FC<{W:number;H:number;lit:number;flag:number;t:number;sway?:number}>=({W,H,lit,flag,t,sway=0})=>{
 const id=useUid('lrfs'),{row,mapY,mapH}=flightMap(W,H);
 const fx=W*FLIGHT_FLAG.u,fy=mapY+mapH*FLIGHT_FLAG.v;
 const route:Pt[]=[[W*.14,mapY+mapH*.88],[fx,fy],[W*.55,mapY+mapH*.34],[W*.72,mapY+mapH*.22],[W*.88,mapY+mapH*.34]];
 const u=(t*.06)%1,seg=Math.min(3,Math.floor(u*4)),v=u*4-seg;
 const dot:Pt=[lerp(route[seg][0],route[seg+1][0],v),lerp(route[seg][1],route[seg+1][1],v)];
 const fl=smooth(flag),pole=FLIGHT_FLAG.pole*clamp(flag*2.2),cloth=clamp(flag*2.2-1),ring=smooth((flag-.4)/.6);
 const scale=row/90;
 return <g data-part="flight-screen" opacity={f2(.12+.88*smooth(lit*1.4))}>
  <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2A3A47"/><stop offset="1" stopColor="#1A2630"/></linearGradient></defs>
  <rect x={0} y={0} width={W} height={H} fill={`url(#${id})`}/>
  <g opacity={f2(smooth(lit*2))}>
   <rect x={0} y={0} width={W} height={row} fill="#0F171E"/>
   <g transform={`translate(${f2(row*.55)} ${f2(row*.5)}) scale(${f2(scale)})`}>
    <path d="M-26 -10h52M-26 10h52M-16 -10l-10 -8M16 -10l10 -8M-16 10l-10 8M16 10l10 8" stroke={LR.paperLit} strokeWidth={5} strokeLinecap="round"/>
    <rect x={-12} y={-12} width={24} height={24} rx={7} fill={LR.paperLit}/>
   </g>
   <Txt x={row*1.15} y={row*.66} size={Math.round(row*.42)} bold fill={LR.paperLit}>Survey flight</Txt>
   {[0,1,2,3].map(k=><rect key={k} x={f2(W-row*1.9+k*row*.2)} y={f2(row*.72-k*row*.12)} width={f2(row*.13)} height={f2(row*.12+k*row*.12)} rx={2} fill={LR.paperLit} opacity={k<3?.9:.35}/>)}
   <rect x={W-row*.95} y={row*.32} width={row*.62} height={row*.36} rx={4} fill="none" stroke={LR.paperLit} strokeWidth={3}/>
   <rect x={W-row*.9} y={row*.37} width={row*.42} height={row*.26} rx={2} fill="#6BC27A"/>
  </g>
  <g opacity={f2(smooth(lit*1.6-.4))}>
   <rect x={14} y={mapY} width={W-28} height={mapH} rx={8} fill="#2D3B33"/>
   <path d={`M${W*.08} ${mapY+mapH*.12}L${W*.92} ${mapY+mapH*.08}L${W*.95} ${mapY+mapH*.9}L${W*.06} ${mapY+mapH*.94}Z`} fill="#8E8467" opacity={.9}/>
   <path d={`M${W*.04} ${mapY+mapH*.98}C${W*.2} ${mapY+mapH*.7} ${W*.3} ${mapY+mapH*.62} ${W*.42} ${mapY+mapH*.5}`} stroke="#A99E7E" strokeWidth={H*.05} fill="none"/>
   <rect x={W*.46} y={mapY+mapH*.4} width={W*.22} height={mapH*.1} rx={mapH*.05} fill="#AAB2B6" transform={`rotate(6 ${W*.57} ${mapY+mapH*.45})`}/>
   <circle cx={W*.78} cy={mapY+mapH*.24} r={mapH*.12} fill="#AAB2B6"/>
   <path d={`M${fx-30} ${fy}h60M${fx} ${fy+20}v-40`} stroke="#C9CFD1" strokeWidth={6} opacity={.7}/>
   <rect x={W*.1} y={mapY+mapH*.7} width={W*.08} height={mapH*.14} rx={4} fill="#C9CFD1"/>
   <path d={route.map(([x,y],i)=>`${i?'L':'M'}${f2(x)} ${f2(y)}`).join('')} stroke={LR.paperLit} strokeWidth={4} strokeDasharray="12 9" fill="none" opacity={.9}/>
   {route.slice(2,4).map(([x,y],k)=><circle key={k} cx={f2(x)} cy={f2(y)} r={11} fill="none" stroke={LR.paperLit} strokeWidth={3.4}/>)}
   <g transform={`translate(${f2(dot[0])} ${f2(dot[1])})`}><circle r={13} fill={LR.paperLit}/><circle r={6} fill="#2B3339"/></g>
  </g>
  {/* the anomaly marker on the valve, then the alert flag rising from it and lighting amber */}
  <g transform={`translate(${f2(fx)} ${f2(fy)})`} opacity={f2(smooth(lit*1.6-.6))}>
   {fl>.4&&<circle r={f2(15+34*ring)} fill="none" stroke={LR.amber} strokeWidth={4} opacity={f2(.85*(1-ring))}/>}
   <path d="M0 -15L15 0L0 15L-15 0Z" fill={fl>.3?LR.amber:'#DDE3E6'} stroke={LR.ink} strokeWidth={2.5}/>
   {pole>0&&<path d={`M0 -15V${f2(-15-pole)}`} stroke={LR.paperLit} strokeWidth={5} strokeLinecap="round"/>}
   {cloth>0&&<g transform={`translate(0 ${f2(-15-pole)}) rotate(${f2(sway)}) scale(${f2(.3+.7*smooth(cloth))} 1)`}>
    <path d={`M0 0H${FLIGHT_FLAG.cloth[0]}l-16 24l16 24H0Z`} fill={LR.amber} stroke={LR.ink} strokeWidth={2.5}/>
    <Txt x={12} y={34} size={26} bold opacity={clamp(cloth*2-1)}>Anomaly</Txt>
   </g>}
  </g>
 </g>;
};
/** The point the claim tag's string hooks onto: the top of the alert flag's pole, in screen units. */
export const flagTop=(W:number,H:number):Pt=>{const {mapY,mapH}=flightMap(W,H);return [W*FLIGHT_FLAG.u,mapY+mapH*FLIGHT_FLAG.v-15-FLIGHT_FLAG.pole];};

// ---- the infrared view (illustrative) --------------------------------------------------------------------
/** An illustrated infrared view of the point of interest valve: grayscale steel on a dark field and a
 * warm shimmer rising from the stem, moving on the film clock. It is illustrative, not a measured plume,
 * and says so on its own label. `outline` draws a dashed ring round the shimmer. */
const IrView:React.FC<{W:number;H:number;t:number;outline?:number;label?:number}>=({W,H,t,outline=0,label=26})=>{
 const id=useUid('lrir'),k=Math.min(W,H*1.4)/560,cx=W*.44,cy=H*.66;
 const plume=Array.from({length:7},(_,i)=>{const ph=t*1.7+i*1.3,rise=(t*.5+i/7)%1;
  const x=cx+20*k+Math.sin(ph)*18*k*rise+i*3*k,y=cy-60*k-rise*150*k,r=(16+30*rise)*k;
  return <ellipse key={i} cx={f2(x)} cy={f2(y)} rx={f2(r)} ry={f2(r*.8)} fill={i%2?'#F6C46A':'#FFE9B8'} opacity={f2(.6*(1-rise))}/>;});
 const ring=ellipsePath(cx+26*k,cy-128*k,84*k,96*k);
 return <g data-part="ir-view">
  <defs><radialGradient id={id} cx=".45" cy=".55" r=".75"><stop offset="0" stopColor="#4A4F55"/><stop offset="1" stopColor="#15181B"/></radialGradient>
   <filter id={id+'b'} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={f2(6*k)}/></filter></defs>
  <rect x={0} y={0} width={W} height={H} fill={`url(#${id})`}/>
  <rect x={0} y={cy+44*k} width={W} height={H} fill="#2A2D30"/>
  <rect x={0} y={cy-14*k} width={W} height={30*k} fill="#8A8F94"/><rect x={0} y={cy-14*k} width={W} height={7*k} fill="#B9BEC2"/>
  <rect x={cx-30*k} y={cy-30*k} width={70*k} height={62*k} rx={6*k} fill="#7C8287" stroke="#2A2D30" strokeWidth={3*k}/>
  {[0,1,2,3].map(j=><circle key={j} cx={cx-20*k+j*17*k} cy={cy-22*k} r={3.4*k} fill="#C9CDD0"/>)}
  <rect x={cx+2*k} y={cy-72*k} width={12*k} height={44*k} fill="#9A9FA4"/>
  <ellipse cx={cx+8*k} cy={cy-74*k} rx={42*k} ry={10*k} fill="none" stroke="#D2D6D9" strokeWidth={7*k}/>
  <g filter={`url(#${id}b)`}>{plume}</g>
  {outline>0&&<DrawnDashes d={ring} p={outline} stroke={LR.paperLit} width={5*k} dash={`${f2(14*k)} ${f2(10*k)}`} id={id+'o'}/>}
  <rect x={0} y={H-label*1.9} width={W} height={label*1.9} fill="#0E1114" opacity={.82}/>
  <Txt x={label*.6} y={H-label*.62} size={label} bold fill={LR.paperLit}>Illustrative infrared view</Txt>
 </g>;
};
/** The shimmer's centre in an IR view W by H, so the inspector's outline and the follow-up can find it. */
export const irShimmer=(W:number,H:number):Pt=>{const k=Math.min(W,H*1.4)/560;return [W*.44+26*k,H*.66-128*k];};

// ---- the inspector mark, the AI box --------------------------------------------------------------------
/** The certified inspector's mark: a seal with two words and a signature line, no name, no face. `check`
 * draws a check stroke through it on confirmation. */
const InspectorMark:React.FC<{r:number;check?:number}>=({r,check=0})=>
 <g data-part="inspector-mark">
  <circle r={r+5} fill={LR.ink} opacity={.2} transform="translate(5 7)"/>
  <circle r={r} fill={LR.paperLit} stroke={LR.ink} strokeWidth={f2(r*.06)}/>
  <circle r={r*.84} fill="none" stroke={LR.ink} strokeWidth={f2(r*.025)} strokeDasharray={`${f2(r*.08)} ${f2(r*.05)}`}/>
  <Txt x={0} y={-r*.16} size={Math.round(r*.29)} bold anchor="middle">Certified</Txt>
  <Txt x={0} y={r*.18} size={Math.round(r*.29)} bold anchor="middle">inspector</Txt>
  <path d={`M${f2(-r*.5)} ${f2(r*.5)}H${f2(r*.5)}`} stroke={LR.ink} strokeWidth={f2(r*.03)}/>
  {check>0&&<path d={`M${f2(-r*.62)} ${f2(r*.02)}L${f2(-r*.22)} ${f2(r*.42)}L${f2(r*.72)} ${f2(-r*.6)}`} stroke={LR.amber} strokeWidth={f2(r*.14)} fill="none" strokeLinecap="round" strokeLinejoin="round"
   pathLength={1} strokeDasharray="1 1" strokeDashoffset={f2(1-clamp(check))} opacity={.95}/>}
 </g>;
/** A dashed box labelled AI that draws round its edge with `p` and stays empty. */
const AiBox:React.FC<{w:number;h:number;p:number}>=({w,h,p})=>{
 const id=useUid('lrai'),lab=Math.max(34,Math.min(48,h*.2));
 return <g data-part="ai-box" opacity={f2(clamp(p*6))}>
  <DrawnDashes d={rrectPath(0,0,w,h,16)} p={p} stroke={LR.paperLit} width={6} dash="22 14" id={id}/>
  <g opacity={f2(clamp(p*3))}>
   <rect x={18} y={-lab*.72} width={lab*2.1} height={lab*1.44} rx={10} fill={LR.paperLit} stroke={LR.ink} strokeWidth={3}/>
   <Txt x={18+lab*1.05} y={lab*.36} size={Math.round(lab)} bold anchor="middle">AI</Txt>
  </g>
 </g>;
};

/** The review screen: survey footage with the illustrated infrared valve on the left and a column on the
 * right. The inspector mark lands on the footage, the dashed outline rings the shimmer, the blank AI box
 * draws in the column. `arrive` slides the footage in and fills the filmstrip. `jolt` is the mark's
 * blow passed through the footage (pixels). */
export const REVIEW={footU:.03,footV:.14,footW:.6,footH:.8,markU:.84,markV:.2,markR:.26,boxU:.7,boxV:.6,boxW:.26,boxH:.32};
const ReviewScreen:React.FC<{W:number;H:number;t:number;arrive:number;mark:number;outline:number;check:number;box:number;jolt?:number;press?:number}>=({W,H,t,arrive,mark,outline,check,box,jolt=0,press=0})=>{
 const fx=W*REVIEW.footU,fy=H*REVIEW.footV,fw=W*REVIEW.footW,fh=H*REVIEW.footH,a=smooth(arrive);
const mr=H*REVIEW.markR,ms=(1+.4*(1-smooth(mark)))*(1+press),mo=clamp(mark*2.5),title=Math.round(H*.065);
 return <g data-part="review-screen">
  <rect x={0} y={0} width={W} height={H} fill="#1C2731"/>
  <rect x={0} y={0} width={W} height={H*.11} fill="#0F171E"/>
  <Txt x={W*.03} y={H*.078} size={title} bold fill={LR.paperLit}>Survey footage</Txt>
  <g transform={`translate(${f2(fx+(1-a)*W*.45)} ${f2(fy+jolt)})`} opacity={f2(clamp(a*1.5))}>
   <IrView W={fw} H={fh} t={t} outline={outline} label={Math.round(H*.058)}/>
   <rect x={0} y={0} width={fw} height={fh} fill="none" stroke={LR.paperLit} strokeWidth={3}/>
  </g>
  {Array.from({length:4},(_,k)=><g key={k} opacity={f2(clamp(arrive*5-k))}>
   <rect x={f2(W*.67+k*W*.075)} y={H*.16} width={W*.06} height={H*.12} rx={3} fill="#4A4F55" stroke={LR.paperLit} strokeWidth={2}/>
   <path d={`M${f2(W*.67+k*W*.075+W*.02)} ${f2(H*.25)}q${f2(W*.01)} ${f2(-H*.05)} ${f2(W*.02)} 0`} stroke="#E9C88A" strokeWidth={3} fill="none" opacity={.7}/>
  </g>)}
  <rect x={W*.67} y={H*.32} width={W*.29} height={6} rx={3} fill="#3A4652"/>
  <rect x={W*.67} y={H*.32} width={f2(W*.29*a)} height={6} rx={3} fill={LR.paperLit}/>
  {box>0&&<g transform={`translate(${f2(W*REVIEW.boxU)} ${f2(H*REVIEW.boxV)})`}><AiBox w={W*REVIEW.boxW} h={H*REVIEW.boxH} p={box}/></g>}
  {mark>0&&<g transform={`translate(${f2(reviewMarkAt(W,H)[0])} ${f2(reviewMarkAt(W,H)[1])}) rotate(-8) scale(${f2(ms)})`} opacity={f2(mo)}>
   <InspectorMark r={mr} check={check}/></g>}
 </g>;
};
/** Where the inspector mark sits on a review screen W by H (screen units): the footage's upper right. */
export const reviewMarkAt=(W:number,H:number):Pt=>[W*REVIEW.footU+W*REVIEW.footW*REVIEW.markU,H*REVIEW.footV+H*REVIEW.footH*REVIEW.markV];
/** The shimmer's centre on a review screen W by H, where the footage has fully arrived. */
export const reviewShimmer=(W:number,H:number):Pt=>{const fw=W*REVIEW.footW,fh=H*REVIEW.footH,s=irShimmer(fw,fh);return [W*REVIEW.footU+s[0],H*REVIEW.footV+s[1]];};
// ---- paper ----------------------------------------------------------------------------------------------
/** The approval letter, 600 by 780 letter units, unsealed and plain: a header, lines that write in (`write`),
 * a clipped tag reading periodic methane screening; the date stamp and the approved mark appear as their
 * stamps press (`date`, `approved` 0 to 1). A dog-eared corner, a crease, a faint ring. */
export const LETTER={w:600,h:780,date:{x:66,y:178,rot:-6,w:476,h:70},tag:{x:40,y:452,w:240,h:146},approved:{x:298,y:482,rot:-5,w:252,h:80}};
/** Where a stamp's die centre lands on the letter (letter units): the date stamp and the approved mark. */
export const letterMarks={date:[LETTER.date.x+LETTER.date.w/2,LETTER.date.y+LETTER.date.h/2] as Pt,
 approved:[LETTER.approved.x+LETTER.approved.w/2,LETTER.approved.y+LETTER.approved.h/2] as Pt};
const Letter:React.FC<{write:number;date:number;approved:number}>=({write,date,approved})=>{
 const id=useUid('lrlet'),L=LETTER,D=L.date,A=L.approved,G=L.tag;
 return <g data-part="letter">
  <defs><linearGradient id={id} x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stopColor={LR.paperLit}/><stop offset="1" stopColor={LR.paperShade}/></linearGradient></defs>
  <path d={`M10 14H${L.w+10}V${L.h-50}L${L.w-40} ${L.h+14}H10Z`} fill="#1A1410" opacity={.2}/>
  <path d={`M0 0H${L.w}V${L.h-60}L${L.w-60} ${L.h}H0Z`} fill={`url(#${id})`} stroke="#8C8169" strokeWidth={2}/>
  <path d={`M${L.w} ${L.h-60}L${L.w-48} ${L.h-52}L${L.w-60} ${L.h}Z`} fill="#D8CBAD" stroke="#8C8169" strokeWidth={1.6}/>
  <path d={`M0 ${L.h*.52}Q${L.w*.5} ${L.h*.5+4} ${L.w} ${L.h*.53}`} stroke="#CDBF9F" strokeWidth={2} fill="none"/>
  <circle cx={L.w*.78} cy={L.h*.86} r={46} fill="none" stroke="#B9A57E" strokeWidth={5} opacity={.35}/>
  <rect x={40} y={40} width={L.w-80} height={6} fill={LR.ink}/>
  <Txt x={40} y={98} size={40} bold>Approval letter</Txt>
  <Lines x={40} y={140} w={L.w-80} n={6} gap={28} p={write} seed={11}/>
  <Lines x={40} y={330} w={L.w-80} n={5} gap={28} p={clamp(write*1.2-.2)} seed={41}/>
  <Lines x={40} y={640} w={L.w-160} n={3} gap={28} p={clamp(write*1.2-.2)} seed={71}/>
  <g transform={`translate(${G.x} ${G.y}) rotate(-2)`} data-part="letter-tag">
   <rect x={4} y={6} width={G.w} height={G.h} rx={10} fill="#1A1410" opacity={.15}/>
   <rect x={0} y={0} width={G.w} height={G.h} rx={10} fill="#FFFDF5" stroke={LR.ink} strokeWidth={2.4}/>
   {['Periodic','methane','screening'].map((l,i)=><Txt key={i} x={20} y={40+i*39} size={32} bold>{l}</Txt>)}
   <path d="M30 -16v34q0 10 10 10h6q10 0 10 -10v-30" stroke="#9AA2A6" strokeWidth={4} fill="none"/>
  </g>
  {date>0&&<g transform={`translate(${D.x} ${D.y}) rotate(${D.rot})`} opacity={f2(.92*clamp(date))} data-part="date-stamp">
   <rect x={0} y={0} width={D.w} height={D.h} rx={10} fill="none" stroke={LR.amberInk} strokeWidth={5}/>
   <Txt x={D.w/2} y={D.h*.68} size={34} bold anchor="middle" fill={LR.amberInk}>September 30th, 2025</Txt>
   <path d={`M${D.w*.7} 3h${D.w*.12}`} stroke={LR.paperLit} strokeWidth={4} opacity={.6}/>
  </g>}
  {approved>0&&<g transform={`translate(${A.x} ${A.y}) rotate(${A.rot})`} opacity={f2(.94*clamp(approved))} data-part="approved-mark">
   <rect x={0} y={0} width={A.w} height={A.h} rx={12} fill="none" stroke={LR.amberInk} strokeWidth={5}/>
   <path d="M16 42l12 14l22 -28" stroke={LR.amberInk} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
   <Txt x={58} y={53} size={32} bold fill={LR.amberInk}>Approved</Txt>
  </g>}
 </g>;
};
/** The long letter page for the AI scene: paragraphs of lines and the protocol title, set so that AI
 * begins its line and the highlight lands on it exactly. `hl` 0 to 1 lays the highlight left to right,
 * overshooting its word a little. */
export const LONG={w:600,h:1520,titleY:1000,size:29,lead:40};
export const TITLE_LINES=['Percepto Autonomous OGI UAS &','AI Software Alternative Test','Method'];
/** The highlight's box on the long letter (letter units), shared with the episode's counter tag. */
export const longHighlight=()=>({x:46,y:LONG.titleY+LONG.lead-LONG.size+2,w:widthOf('AI',LONG.size,true)+18,h:LONG.size+12});
const LongLetter:React.FC<{hl:number}>=({hl})=>{
 const id=useUid('lrlong'),L=LONG,ty=L.titleY,H=longHighlight();
 return <g data-part="long-letter">
  <defs><linearGradient id={id} x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stopColor={LR.paperLit}/><stop offset="1" stopColor={LR.paperShade}/></linearGradient></defs>
  <rect x={10} y={14} width={L.w} height={L.h} fill="#1A1410" opacity={.18}/>
  <path d={`M0 0H${L.w}V${L.h}H40L0 ${L.h-40}Z`} fill={`url(#${id})`} stroke="#8C8169" strokeWidth={2}/>
  <rect x={40} y={40} width={L.w-80} height={6} fill={LR.ink}/>
  {[0,1,2,3,4].map(k=><Lines key={k} x={40} y={110+k*170} w={L.w-80} n={k===4?3:4} gap={30} seed={100+k*13}/>)}
  <Txt x={40} y={ty-58} size={24} bold fill={LR.inkSoft}>Protocol title</Txt>
  <rect x={40} y={ty-44} width={L.w-80} height={L.lead*3+30} rx={8} fill="#FFFDF5" stroke="#B9AD90" strokeWidth={2}/>
  {hl>0&&<rect x={H.x} y={H.y} width={f2(H.w*Math.min(1.1,smooth(hl)*1.12))} height={H.h} rx={6} fill={LR.amber} opacity={.8} transform={`rotate(-1.5 ${H.x} ${H.y+H.h})`}/>}
  {TITLE_LINES.map((l,i)=><Txt key={i} x={54} y={ty+i*L.lead} size={L.size} bold>{l}</Txt>)}
  <Lines x={40} y={ty+150} w={L.w-80} n={8} gap={30} seed={211}/>
  <Lines x={40} y={ty+420} w={L.w-80} n={2} gap={30} seed={231}/>
 </g>;
};
/** A rubber stamp. Side on, its handle stands up from a block whose die is inked; `lift` raises it off
 * the paper. From above (`top`), its knob and block grow toward the lens as it lifts and its shadow
 * slides away. */
const StampTool:React.FC<{top?:boolean;lift:number;w:number;h?:number}>=({top=false,lift,w,h})=>{
 const id=useUid('lrstamp'),d=h??w*.7;
 if(top){const s=1+.35*lift,o=10+70*lift,kr=Math.min(w,d)*.3;
  return <g data-part="stamp-top">
   <rect x={f2(-w/2+o)} y={f2(-d/2+o)} width={w} height={d} rx={10} fill="#1A1410" opacity={f2(.3-.15*lift)}/>
   <g transform={`scale(${f2(s)})`}>
    <rect x={-w/2} y={-d/2} width={w} height={d} rx={10} fill="#5B3B26" stroke={LR.ink} strokeWidth={3}/>
    <rect x={-w/2+8} y={-d/2+8} width={w-16} height={d-16} rx={8} fill="#7A5236"/>
    <circle cx={0} cy={0} r={f2(kr)} fill="#8C6242" stroke={LR.ink} strokeWidth={3}/><circle cx={f2(-kr*.3)} cy={f2(-kr*.3)} r={f2(kr*.4)} fill="#B4875F"/>
   </g>
  </g>;}
 return <g data-part="stamp-side">
  <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#B4875F"/><stop offset="1" stopColor="#6E4A2F"/></linearGradient></defs>
  <ellipse cx={0} cy={4} rx={f2(w*.55*(1-.3*lift))} ry={8} fill="#1A1410" opacity={f2(.32*(1-.6*lift))}/>
  <g transform={`translate(0 ${f2(-150*lift)})`}>
   <rect x={-w/2} y={-10} width={w} height={10} fill={LR.amberInk}/>
   <rect x={-w/2-4} y={-40} width={w+8} height={32} rx={4} fill="#5B3B26" stroke={LR.ink} strokeWidth={2.4}/>
   <rect x={-14} y={-118} width={28} height={80} fill={`url(#${id})`} stroke={LR.ink} strokeWidth={2.4}/>
   <ellipse cx={0} cy={-128} rx={34} ry={26} fill={`url(#${id})`} stroke={LR.ink} strokeWidth={2.4}/>
   <ellipse cx={-10} cy={-136} rx={10} ry={6} fill="#D5AE84" opacity={.8}/>
  </g>
 </g>;
};
/** A paper luggage tag hung on its hole: lines of text, a grommet, a worn corner. The origin is the hole;
 * the tag runs to the right of it, turned by `swing` degrees. `extra` adds room below the text. */
export const tagSize=(lines:string[],size:number,extra=0)=>({w:Math.max(...lines.map(l=>widthOf(l,size,true)))+size*1.4,h:lines.length*size*1.22+size*.9+extra});
const Tag:React.FC<{lines:string[];size:number;swing?:number;tone?:'paper'|'amber';extra?:number;children?:React.ReactNode}>=({lines,size,swing=0,tone='paper',extra=0,children})=>{
 const {w,h}=tagSize(lines,size,extra),fill=tone==='amber'?'#F7D48A':'#FFFDF5',top=-h/2;
 const shape=`M14 ${f2(top)}H${f2(w+30)}Q${f2(w+44)} ${f2(top)} ${f2(w+44)} ${f2(top+14)}V${f2(top+h-14)}Q${f2(w+44)} ${f2(top+h)} ${f2(w+30)} ${f2(top+h)}H14L-18 ${f2(top+h-22)}V${f2(top+22)}Z`;
 return <g data-part="tag" transform={`rotate(${f2(swing)})`}>
  <path d={shape} fill="#1A1410" opacity={.16} transform="translate(6 9)"/>
  <path d={shape} fill={fill} stroke={LR.ink} strokeWidth={2.6}/>
  <circle cx={0} cy={0} r={10} fill="#C8B98F" stroke={LR.ink} strokeWidth={2}/><circle cx={0} cy={0} r={4.5} fill="#2B2F31"/>
  <path d={`M${f2(w+10)} ${f2(top+h)}l30 -26`} stroke="#D9CDB1" strokeWidth={3}/>
  {lines.map((l,i)=><Txt key={i} x={30} y={top+size*1.08+i*size*1.22} size={size} bold>{l}</Txt>)}
  {children&&<g transform={`translate(30 ${f2(top+lines.length*size*1.22+size*.55)})`}>{children}</g>}
 </g>;
};
/** The delayed bar: a dark band with its word, laid across a tag. */
const DelayBar:React.FC<{w:number;h:number}>=({w,h})=>
 <g data-part="delay-bar"><rect x={4} y={6} width={w} height={h} rx={8} fill="#1A1410" opacity={.22}/>
  <rect x={0} y={0} width={w} height={h} rx={8} fill={LR.ink}/>
  <path d={`M10 6H${f2(w*.6)}`} stroke="#4C565C" strokeWidth={3}/>
  <Txt x={w/2} y={h*.7} size={Math.round(h*.56)} bold anchor="middle" fill={LR.paperLit}>Delayed</Txt></g>;
/** The easel desk calendar: a kraft cover that flips up over the ring binding (`flip`) to show the page
 * January 22nd, 2027. */
const Calendar:React.FC<{w:number;flip:number}>=({w,flip})=>{
 const h=w*1.12,f=clamp(flip),sy=Math.cos(Math.PI*f);
 return <g data-part="calendar">
  <path d={`M${w*.1} ${h}L${w*.04} ${h+28}H${w*1.04}L${w*.94} ${h}Z`} fill="#1A1410" opacity={.22}/>
  <rect x={0} y={0} width={w} height={h} rx={8} fill="#FFFDF5" stroke={LR.ink} strokeWidth={3}/>
  <rect x={0} y={0} width={w} height={h*.24} rx={8} fill={LR.ink}/>
  <Txt x={w/2} y={h*.17} size={Math.round(w*.15)} bold anchor="middle" fill={LR.paperLit}>January</Txt>
  <Txt x={w/2} y={h*.7} size={Math.round(w*.42)} bold anchor="middle" font={FONT.display}>22</Txt>
  <Txt x={w/2} y={h*.9} size={Math.round(w*.13)} bold anchor="middle" fill={LR.inkSoft}>2027</Txt>
  {f<1&&<g transform={`translate(0 6) scale(1 ${f2(sy)}) translate(0 -6)`}>
   <rect x={0} y={6} width={w} height={h-6} rx={8} fill={sy>0?'#B9A27A':'#8E7B5A'} stroke={LR.ink} strokeWidth={3}/>
   {sy>0&&<path d={`M${w*.12} ${h*.3}H${w*.7}M${w*.12} ${h*.38}H${w*.52}`} stroke="#9C8762" strokeWidth={6} strokeLinecap="round"/>}
  </g>}
  {Array.from({length:7},(_,k)=><rect key={k} x={f2(w*.12+k*w*.12)} y={-10} width={8} height={24} rx={4} fill="#5C656A" stroke={LR.ink} strokeWidth={1.4}/>)}
 </g>;
};
/** A tear-off day block whose blank cover turns up and over its binding to show October 7th. */
const DayBlock:React.FC<{w:number;flip:number}>=({w,flip})=>{
 const h=w*1.05,f=clamp(flip),sy=Math.cos(Math.PI*f);
 return <g data-part="day-block">
  <rect x={6} y={12} width={w} height={h} rx={6} fill="#1A1410" opacity={.2}/>
  <rect x={0} y={8} width={w} height={h} rx={6} fill="#E5DAC0" stroke={LR.ink} strokeWidth={2.4}/>
  <rect x={0} y={0} width={w} height={h} rx={6} fill="#FFFDF5" stroke={LR.ink} strokeWidth={3}/>
  <rect x={0} y={0} width={w} height={h*.24} rx={6} fill={LR.amberInk}/>
  <Txt x={w/2} y={h*.17} size={Math.round(w*.15)} bold anchor="middle" fill={LR.paperLit}>October</Txt>
  <Txt x={w/2} y={h*.8} size={Math.round(w*.5)} bold anchor="middle" font={FONT.display}>7</Txt>
  {f<1&&<g transform={`scale(1 ${f2(sy)})`}><rect x={0} y={0} width={w} height={h} rx={6} fill={sy>0?'#CDBB93':'#A8936B'} stroke={LR.ink} strokeWidth={3}/></g>}
  <rect x={-4} y={-8} width={w+8} height={14} rx={5} fill="#5C656A" stroke={LR.ink} strokeWidth={1.6}/>
 </g>;
};
const ReleaseCard:React.FC<{w:number}>=({w})=>{
 const h=w*.78;
 return <g data-part="release-card"><rect x={6} y={8} width={w} height={h} rx={8} fill="#1A1410" opacity={.18}/>
  <rect x={0} y={0} width={w} height={h} rx={8} fill="#FFFDF5" stroke={LR.ink} strokeWidth={2.6}/>
  <rect x={0} y={0} width={w} height={h*.26} rx={8} fill="#DCE0E0"/>
  <Txt x={w*.08} y={h*.18} size={Math.round(w*.12)} bold>EPA release</Txt>
  <Lines x={w*.08} y={h*.36} w={w*.84} n={4} gap={h*.13} seed={301} h={Math.max(6,h*.05)}/>
 </g>;
};
/** The proposal tag's dashed, empty stamp box: drawn round by `p`, never stamped. */
const EmptyStampBox:React.FC<{w:number;h:number;p:number}>=({w,h,p})=>{
 const id=useUid('lrempty');
 return <g data-part="empty-stamp" opacity={f2(clamp(p*5))}><DrawnDashes d={rrectPath(0,0,w,h,10)} p={p} stroke={LR.inkSoft} width={4} dash="14 10" id={id}/></g>;
};
/** A steel paper clip seen flat. */
const PaperClip:React.FC<{s:number}>=({s})=>
 <g transform={`scale(${s})`} data-part="clip"><path d="M0 0v50q0 12 12 12t12 -12v-44q0 -8 -8 -8t-8 8v38" stroke="#8D969B" strokeWidth={4} fill="none" strokeLinecap="round"/></g>;
// ---- the room ---------------------------------------------------------------------------------------------
/** The desk, from its back edge at y down past the frame: worn laminate in the window's light, scratches,
 * a faint ring. Never a full-frame rect: the wall and the window stand above its back edge. */
const Desk:React.FC<{y:number}>=({y})=>{
 const id=useUid('lrdesk');
 return <g data-part="desk">
  <defs><linearGradient id={id} x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stopColor={LR.deskLit}/><stop offset=".6" stopColor={LR.desk}/><stop offset="1" stopColor={LR.deskShade}/></linearGradient></defs>
  <path d={`M-20 ${y}L1100 ${y-10}L1100 1960L-20 1960Z`} fill={`url(#${id})`}/>
  <path d={`M-20 ${y}L1100 ${y-10}`} stroke="#5E4E3C" strokeWidth={6}/><path d={`M-20 ${y+5}L1100 ${y-5}`} stroke="#C2AE92" strokeWidth={3} opacity={.7}/>
  {Array.from({length:9},(_,k)=><path key={k} d={`M${f2(40+120*k+30*hash(k))} ${f2(y+60+400*hash(k+3))}l${f2(80+60*hash(k+5))} ${f2(-4+8*hash(k+7))}`} stroke="#9C8A70" strokeWidth={2} opacity={.5}/>)}
  <path d={`M720 ${y+330}l120 -18`} stroke="#6C5C49" strokeWidth={2.4} opacity={.6}/>
  <ellipse cx={180} cy={y+420} rx={52} ry={18} fill="none" stroke="#6C5C49" strokeWidth={4} opacity={.25}/>
 </g>;
};
/** A hard hat, side on or from above. No logo. A scuff and a sticker scar. */
const HardHat:React.FC<{top?:boolean}>=({top=false})=>top?
 <g data-part="hardhat"><ellipse cx={8} cy={10} rx={96} ry={80} fill="#1A1410" opacity={.2}/>
  <ellipse cx={0} cy={0} rx={94} ry={78} fill="#E7C54A" stroke={LR.ink} strokeWidth={3}/><ellipse cx={-6} cy={-4} rx={62} ry={52} fill="#F2D768"/>
  <path d="M-60 0H62" stroke="#C9A53A" strokeWidth={8}/><path d="M20 30q10 6 22 2" stroke="#9C7F2B" strokeWidth={3} fill="none"/></g>:
 <g data-part="hardhat"><ellipse cx={6} cy={4} rx={110} ry={12} fill="#1A1410" opacity={.25}/>
  <path d="M-108 0Q-110 -10 -80 -14Q-78 -96 0 -100Q78 -96 84 -14Q112 -10 108 0Z" fill="#E7C54A" stroke={LR.ink} strokeWidth={3}/>
  <path d="M-60 -60Q0 -100 50 -64" stroke="#F6E08A" strokeWidth={8} fill="none" strokeLinecap="round"/><path d="M-6 -98V-16" stroke="#C9A53A" strokeWidth={8}/>
  <path d="M30 -40q10 -2 18 4" stroke="#9C7F2B" strokeWidth={3} fill="none"/></g>;
const Mug:React.FC<{top?:boolean}>=({top=false})=>top?
 <g data-part="mug"><circle cx={6} cy={8} r={48} fill="#1A1410" opacity={.2}/><circle r={46} fill="#4F6E7E" stroke={LR.ink} strokeWidth={3}/><circle r={36} fill="#3A2A1E"/>
  <ellipse cx={-10} cy={-10} rx={10} ry={5} fill="#7A5A3E" opacity={.6}/><path d="M44 -12h20q8 0 8 8v8q0 8 -8 8h-20" stroke={LR.ink} strokeWidth={3} fill="#4F6E7E"/></g>:
 <g data-part="mug"><ellipse cx={4} cy={2} rx={58} ry={8} fill="#1A1410" opacity={.25}/>
  <path d="M-46 -120H46V-8Q46 0 38 0H-38Q-46 0 -46 -8Z" fill="#4F6E7E" stroke={LR.ink} strokeWidth={3}/>
  <path d="M46 -96h18q16 0 16 16v28q0 16 -16 16h-18" stroke={LR.ink} strokeWidth={10} fill="none"/>
  <path d="M-30 -110v96" stroke="#6E8E9E" strokeWidth={8} opacity={.6}/><ellipse cx={0} cy={-120} rx={46} ry={8} fill="#3A2A1E" stroke={LR.ink} strokeWidth={2}/></g>;
const Pen:React.FC<{}>=()=>
 <g data-part="pen"><rect x={4} y={6} width={220} height={16} rx={8} fill="#1A1410" opacity={.2}/>
  <rect x={0} y={0} width={200} height={16} rx={8} fill="#2E3A44"/><path d="M200 0l24 8l-24 8Z" fill="#C9CED0"/><rect x={20} y={-4} width={70} height={6} rx={3} fill="#8D969B"/></g>;

// ---- outside, through the window, and the round vignette of the valve ------------------------------------
/** The pad's far equipment as the review room's window sees it: a strip of caliche at the horizon, the
 * separator, the manifold and the stock tank, small. `w` is the window's width, `horizon` its eye row
 * (window units); the episode places the hero's station beside them and hazes the whole as the glass. */
const WindowPad:React.FC<{w:number;horizon:number;t:number;eqU?:number;eqS?:number;ground?:boolean}>=({w,horizon,t,eqU=.62,eqS=.42,ground=true})=>
 <g data-part="window-pad">
  {ground&&<path d={`M-20 ${horizon+8}Q${w*.5} ${horizon+2} ${w+20} ${horizon+10}V${horizon+600}H-20Z`} fill={LR.caliche}/>}
  {ground&&<path d={`M${w*.08} ${horizon+600}C${w*.2} ${horizon+120} ${w*.4} ${horizon+40} ${w*.55} ${horizon+12}`} stroke={LR.track} strokeWidth={30} fill="none" opacity={.6}/>}
  <Pumpjack x={w*.1} y={horizon+12} s={.32} t={t}/>
  <g transform={`translate(${f2(w*eqU)} ${f2(horizon+190*eqS)}) scale(${f2(eqS)}) translate(-760 -1080)`}><Separator/><Tank/><Valves/></g>
 </g>;
/** The valve on the pad inside a round vignette: sky, caliche, the manifold large with the point of
 * interest handwheel at VIGNETTE_WHEEL. The follow-up tag hangs on that handwheel. */
export const VIGNETTE_WHEEL:Pt=[30,-40];
const PadVignette:React.FC<{r:number;hot?:number}>=({r,hot=0})=>{
 const id=useUid('lrvig'),s=r/120;
 return <g data-part="pad-vignette">
  <defs><clipPath id={id}><circle r={r}/></clipPath>
   <linearGradient id={id+'s'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B9C8D6"/><stop offset="1" stopColor="#EDE3CC"/></linearGradient></defs>
  <circle r={r+8} fill="#1A1410" opacity={.2} transform="translate(6 10)"/>
  <g clipPath={`url(#${id})`}>
   <rect x={-r} y={-r} width={2*r} height={2*r} fill={`url(#${id}s)`}/>
   <rect x={-r} y={r*.32} width={2*r} height={r} fill={LR.caliche}/>
   <g transform={`translate(${f2(VIGNETTE_WHEEL[0])} ${f2(VIGNETTE_WHEEL[1])}) scale(${f2(s)}) translate(${-VALVE_POI[0]} ${-VALVE_POI[1]})`}><Valves hot={hot}/></g>
  </g>
  <circle r={r} fill="none" stroke={LR.paperLit} strokeWidth={8}/><circle r={r+4} fill="none" stroke={LR.ink} strokeWidth={3}/>
 </g>;
};

// ---- the one export -------------------------------------------------------------------------------------
type Part=
 {part:'padSide';t:number;hot?:number;equipment?:boolean}|{part:'padTop';t:number;hot?:number}|{part:'route';pts:Pt[];p:number;w?:number}|
 {part:'poi';r:number;on:number;pulse:number;drop?:number;show?:number}|{part:'locator';w:number;p:number}|
 {part:'tablet';W:number;H:number;stand?:boolean;pulse?:number;children?:React.ReactNode}|
 {part:'flightScreen';W:number;H:number;lit:number;flag:number;t:number;sway?:number}|
 {part:'reviewScreen';W:number;H:number;t:number;arrive:number;mark:number;outline:number;check:number;box:number;jolt?:number;press?:number}|
 {part:'irView';W:number;H:number;t:number;outline?:number;label?:number}|{part:'inspectorMark';r:number;check?:number}|
 {part:'aiBox';w:number;h:number;p:number}|{part:'letter';write:number;date:number;approved:number}|{part:'longLetter';hl:number}|
 {part:'stamp';top?:boolean;lift:number;w:number;h?:number}|
 {part:'tag';lines:string[];size:number;swing?:number;tone?:'paper'|'amber';extra?:number;children?:React.ReactNode}|
 {part:'delayBar';w:number;h:number}|{part:'calendar';w:number;flip:number}|{part:'dayBlock';w:number;flip:number}|{part:'releaseCard';w:number}|
 {part:'emptyStamp';w:number;h:number;p:number}|{part:'clip';s:number}|{part:'desk';y:number}|{part:'hardhat';top?:boolean}|{part:'mug';top?:boolean}|
 {part:'pen'}|{part:'windowPad';w:number;horizon:number;t:number;eqU?:number;eqS?:number;ground?:boolean}|{part:'vignette';r:number;hot?:number};
/** The one exported support group: every drawing above, selected by `part`. */
export const LeakReviewSupport:React.FC<Part>=(p)=>{
 switch(p.part){
 case 'padSide':return <PadSide t={p.t} hot={p.hot} equipment={p.equipment}/>;
 case 'padTop':return <PadTop t={p.t} hot={p.hot}/>;
 case 'route':return <Route pts={p.pts} p={p.p} w={p.w}/>;
 case 'poi':return <PoiRing r={p.r} on={p.on} pulse={p.pulse} drop={p.drop} show={p.show}/>;
 case 'locator':return <Locator w={p.w} p={p.p}/>;
 case 'tablet':return <Tablet W={p.W} H={p.H} stand={p.stand} pulse={p.pulse}>{p.children}</Tablet>;
 case 'flightScreen':return <FlightScreen W={p.W} H={p.H} lit={p.lit} flag={p.flag} t={p.t} sway={p.sway}/>;
 case 'reviewScreen':return <ReviewScreen W={p.W} H={p.H} t={p.t} arrive={p.arrive} mark={p.mark} outline={p.outline} check={p.check} box={p.box} jolt={p.jolt} press={p.press}/>;
 case 'irView':return <IrView W={p.W} H={p.H} t={p.t} outline={p.outline} label={p.label}/>;
 case 'inspectorMark':return <InspectorMark r={p.r} check={p.check}/>;
 case 'aiBox':return <AiBox w={p.w} h={p.h} p={p.p}/>;
 case 'letter':return <Letter write={p.write} date={p.date} approved={p.approved}/>;
 case 'longLetter':return <LongLetter hl={p.hl}/>;
 case 'stamp':return <StampTool top={p.top} lift={p.lift} w={p.w} h={p.h}/>;
 case 'tag':return <Tag lines={p.lines} size={p.size} swing={p.swing} tone={p.tone} extra={p.extra}>{p.children}</Tag>;
 case 'delayBar':return <DelayBar w={p.w} h={p.h}/>;
 case 'calendar':return <Calendar w={p.w} flip={p.flip}/>;
 case 'dayBlock':return <DayBlock w={p.w} flip={p.flip}/>;
 case 'releaseCard':return <ReleaseCard w={p.w}/>;
 case 'emptyStamp':return <EmptyStampBox w={p.w} h={p.h} p={p.p}/>;
 case 'clip':return <PaperClip s={p.s}/>;
 case 'desk':return <Desk y={p.y}/>;
 case 'hardhat':return <HardHat top={p.top}/>;
 case 'mug':return <Mug top={p.top}/>;
 case 'pen':return <Pen/>;
 case 'windowPad':return <WindowPad w={p.w} horizon={p.horizon} t={p.t} eqU={p.eqU} eqS={p.eqS} ground={p.ground}/>;
 case 'vignette':return <PadVignette r={p.r} hot={p.hot}/>;
 }
};
