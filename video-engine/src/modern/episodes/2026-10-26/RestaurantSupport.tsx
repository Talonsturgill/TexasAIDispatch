import React from 'react';
import {useUid} from '../../../lib/uid';
import {FONT,widthOf} from '../../../lib/type';

/**
 * RestaurantSupport, the fresh authored support group for the 2026-10-26 edition (order-pass-v1).
 *
 * The order rig's world and its records, drawn new for this story:
 *  - a small family restaurant in a strip of shops: terracotta quarry tile, an aluminium glass storefront
 *    door with a brass bell on a spring arm, a walnut host stand with a side hook, a server apron that
 *    hangs from that hook by its neck strap, a corded desk phone whose handset rattles in its cradle, a
 *    guest check pad whose top sheet curls and stays blank, laminate pedestal tables, bentwood chairs,
 *    plates, a menu tent, water glasses, a wall clock with no numerals, warm pendant lamps;
 *  - generic seated guests in one even shape language: skin, hair and shirt are fills, never line work;
 *  - an empty acrylic sign frame hanging on the glass by one suction cup, its lone push pin unused;
 *  - a flat host panel on a pole stand whose screen lights and writes the name Haniya, with a lanyard
 *    eyelet at its corner, and a later order card;
 *  - luggage tags that carry the film's attributions and qualifiers;
 *  - a kitchen pass: a steel shelf, a heat lamp, a range hood;
 *  - the back office: a desk, a ledger card headed with the source's own words and ruled rows left empty,
 *    a rubber stamp seen side on or from above and its crooked owner count mark, a bulldog receipt clip
 *    that stays bare, a cork board, a federal rule card whose no tip credit box is only ever drawn, never
 *    ticked, a writing hand with a pen, a manila folder whose one box stays blank under a question mark,
 *    a customer quote card and a mug;
 *  - plan pieces for the overhead shots: the room's walls, windows, door leaf and swing, tables, chairs,
 *    guests from above, the host stand and the counter.
 *
 * Warm paper and terracotta against steel. Nothing is symmetric; everything is maintained but worn. No
 * logo, no brand mark, no restaurant name, no real person, no pay record and no payment screen. The chili
 * red belongs to the paid mark and the stamps only. Pure function of its props; the episode drives every
 * prop from the film frame clock.
 */

export type Pt=[number,number];
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
const f2=(v:number)=>v.toFixed(2);
export const hash=(i:number)=>{const x=Math.sin(i*91.7+57.3)*43758.5453;return x-Math.floor(x);};

export const RS={ink:'#1E1612',inkSoft:'#4A3F38',paper:'#F5EEDC',paperLit:'#FCF8EE',paperShade:'#DDD2BB',kraft:'#D7B98C',kraftDeep:'#A9875A',
 tile:'#A0674A',tileDeep:'#7C4A33',tileLit:'#B97C5C',grout:'#5E3A2A',wood:'#8A5A3C',woodLit:'#A9734F',woodDeep:'#5F3C27',walnut:'#6A4430',
 steel:'#B6BCBE',steelLit:'#E3E6E6',steelDeep:'#7B8487',steelDark:'#525A5E',charcoal:'#2C3034',brass:'#C59A4A',brassLit:'#E8C882',brassDeep:'#8C6A28',
 laminate:'#EFE4CF',laminateEdge:'#B7AC97',apron:'#3A2F2B',apronLit:'#56463F',screenOff:'#11171B',screenLit:'#2B4B57',screenGlow:'#9FD3DC',
 red:'#D2402A',redInk:'#B8321F',penInk:'#23344A',butter:'#F3CF79',green:'#6D8A4E',glassTint:'#DCEBEE',wall:'#E8D9BE',line:'#B3A68E',
 skin:['#8B5A3C','#C58B5E','#E1B48E','#5D3B28','#A86F47'],shirt:['#3F6E7A','#B5653F','#6B5A8C','#D9B44A','#4E7D55']};

const Txt:React.FC<{x:number;y:number;size:number;bold?:boolean;fill?:string;anchor?:'start'|'middle'|'end';children:React.ReactNode;opacity?:number;font?:string}>=
 ({x,y,size,bold=false,fill=RS.ink,anchor='start',children,opacity=1,font=FONT.body})=>
 <text x={f2(x)} y={f2(y)} fontFamily={font} fontSize={size} fontWeight={bold?700:500} fill={fill} textAnchor={anchor} opacity={opacity}>{children}</text>;

// ---- the room -----------------------------------------------------------------------------------------------
/** Terracotta quarry tile from the frame row y down past the frame, its grout converging on vp. */
const Floor:React.FC<{y:number;vp?:number}>=({y,vp=540})=>{
 const id=useUid('rsfl');
 const rows=Array.from({length:9},(_,k)=>y+Math.pow(k+1,1.55)*14);
 return <g data-part="floor">
  <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={RS.tileDeep}/><stop offset=".35" stopColor={RS.tile}/><stop offset="1" stopColor={RS.tileLit}/></linearGradient></defs>
  <rect x={-60} y={y} width={1200} height={1980-y} fill={`url(#${id})`}/>
  {rows.map((r,k)=><path key={'h'+k} d={`M-60 ${f2(r)}H1140`} stroke={RS.grout} strokeWidth={1.4+k*.35} opacity={.45}/>)}
  {Array.from({length:21},(_,k)=>{const x=-900+k*140;return <path key={'v'+k} d={`M${f2(vp+(x-vp)*.28)} ${y}L${f2(x)} 1980`} stroke={RS.grout} strokeWidth={2} opacity={.4}/>;})}
  {Array.from({length:7},(_,k)=><ellipse key={'w'+k} cx={f2(120+k*150+40*hash(k))} cy={f2(y+90+hash(k+5)*300)} rx={f2(30+20*hash(k+2))} ry={6} fill="#FFFFFF" opacity={.06}/>)}
  <rect x={-60} y={y-16} width={1200} height={18} fill={RS.woodDeep}/>
  <path d={`M-60 ${y-14}H1140`} stroke={RS.woodLit} strokeWidth={2} opacity={.6}/>
 </g>;
};
/** The storefront door's leaf geometry: hinge bottom at the origin, `open` 0 closed to 1 swung in 72 deg. */
export const DOOR={w:300,h:660};
export function doorQuad(open:number){
 const th=clamp(open)*72*Math.PI/180,w=DOOR.w*Math.cos(th),dy=36*Math.sin(th);
 return {tl:[0,-DOOR.h] as Pt,tr:[w,-DOOR.h-dy] as Pt,br:[w,dy] as Pt,bl:[0,0] as Pt,w};
}
const quadPt=(q:ReturnType<typeof doorQuad>,u:number,v:number):Pt=>{
 const top:Pt=[lerp(q.tl[0],q.tr[0],u),lerp(q.tl[1],q.tr[1],u)],bot:Pt=[lerp(q.bl[0],q.br[0],u),lerp(q.bl[1],q.br[1],u)];
 return [lerp(top[0],bot[0],v),lerp(top[1],bot[1],v)];
};
const poly=(pts:Pt[])=>'M'+pts.map(p=>f2(p[0])+' '+f2(p[1])).join('L')+'Z';
/** Where the bell's arm meets the header, in door units: the bell hangs from it. */
export const BELL_PIVOT:Pt=[262,-676];
const Door:React.FC<{open:number;bell?:number;children?:React.ReactNode}>=({open,bell=0,children})=>{
 const id=useUid('rsdr');
 const q=doorQuad(open),a=.1,b=.07,c=.16;
 const glass=[quadPt(q,a,b),quadPt(q,1-a,b),quadPt(q,1-a,1-c),quadPt(q,a,1-c)];
 const bar=[quadPt(q,.1,.52),quadPt(q,.9,.52)];
 return <g data-part="door">
  <defs><clipPath id={id}><path d={poly(glass)}/></clipPath></defs>
  <rect x={-18} y={-DOOR.h-18} width={DOOR.w+36} height={18} fill={RS.steelDeep} stroke={RS.ink} strokeWidth={3}/>
  <rect x={-18} y={-DOOR.h} width={18} height={DOOR.h} fill={RS.steel} stroke={RS.ink} strokeWidth={3}/>
  <rect x={DOOR.w} y={-DOOR.h} width={18} height={DOOR.h} fill={RS.steel} stroke={RS.ink} strokeWidth={3}/>
  <path d={`M${DOOR.w+4} ${-DOOR.h+30}V-30`} stroke={RS.steelLit} strokeWidth={3} opacity={.6}/>
  <rect x={DOOR.w-2} y={-DOOR.h*.52-16} width={8} height={32} rx={2} fill={RS.steelDark}/>
  <path d={poly([q.tl,q.tr,q.br,q.bl])} fill={RS.steel} stroke={RS.ink} strokeWidth={3.4}/>
  <g clipPath={`url(#${id})`}>{children}</g>
  <path d={poly(glass)} fill={RS.glassTint} opacity={.16} stroke={RS.ink} strokeWidth={2.4}/>
  <path d={`M${f2(quadPt(q,.25,.12)[0])} ${f2(quadPt(q,.25,.12)[1])}L${f2(quadPt(q,.55,.5)[0])} ${f2(quadPt(q,.55,.5)[1])}`} stroke="#FFFFFF" strokeWidth={10} opacity={.22} strokeLinecap="round"/>
  <path d={`M${f2(bar[0][0])} ${f2(bar[0][1])}L${f2(bar[1][0])} ${f2(bar[1][1])}`} stroke={RS.steelDark} strokeWidth={12} strokeLinecap="round"/>
  <path d={`M${f2(bar[0][0])} ${f2(bar[0][1]-3)}L${f2(bar[1][0])} ${f2(bar[1][1]-3)}`} stroke={RS.steelLit} strokeWidth={3} strokeLinecap="round"/>
  <path d={`M${f2(quadPt(q,.06,.9)[0])} ${f2(quadPt(q,.06,.9)[1])}L${f2(quadPt(q,.2,.95)[0])} ${f2(quadPt(q,.2,.95)[1])}`} stroke={RS.steelDark} strokeWidth={3} opacity={.6}/>
  <path d={`M${BELL_PIVOT[0]-40} ${-DOOR.h-18}C${BELL_PIVOT[0]-40} ${BELL_PIVOT[1]+14} ${BELL_PIVOT[0]-10} ${BELL_PIVOT[1]+18} ${BELL_PIVOT[0]} ${BELL_PIVOT[1]}`}
   stroke={RS.brassDeep} strokeWidth={4} fill="none" transform={`translate(0 18)`}/>
  <g transform={`translate(${BELL_PIVOT[0]} ${BELL_PIVOT[1]+18}) rotate(${f2(bell)})`}>
   <path d="M0 0V8" stroke={RS.brassDeep} strokeWidth={3}/>
   <path d="M-16 34C-16 18 -10 8 0 8C10 8 16 18 16 34Z" fill={RS.brass} stroke={RS.ink} strokeWidth={2.4}/>
   <path d="M-10 26C-9 18 -6 13 -1 12" stroke={RS.brassLit} strokeWidth={2.4} fill="none"/>
   <circle cx={f2(4*Math.sin(bell*.08))} cy={37} r={4} fill={RS.brassDeep} stroke={RS.ink} strokeWidth={1.4}/>
  </g>
 </g>;
};
/** The brass hook on its walnut plaque; its tip is the origin, which is where the apron's strap hangs. */
const ApronHook:React.FC<{}>=()=><g data-part="apron-hook">
 <rect x={-26} y={-30} width={36} height={70} rx={6} fill={RS.walnut} stroke={RS.ink} strokeWidth={2.4}/>
 <circle cx={-8} cy={-18} r={3} fill={RS.brassDeep}/><circle cx={-8} cy={28} r={3} fill={RS.brassDeep}/>
 <path d="M-8 18C-8 4 2 -2 6 -8C8 -12 6 -14 2 -14" stroke={RS.brassDeep} strokeWidth={8} fill="none" strokeLinecap="round"/>
 <path d="M-8 18C-8 4 2 -2 6 -8" stroke={RS.brassLit} strokeWidth={3} fill="none" strokeLinecap="round"/>
</g>;
/** A bib apron hanging from its neck strap, the strap's apex at the origin (the hook's tip). */
export const APRON_LEN=470;
const Apron:React.FC<{}>=()=>{
 const id=useUid('rsap');
 return <g data-part="apron">
  <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={RS.apronLit}/><stop offset="1" stopColor={RS.apron}/></linearGradient></defs>
  <path d="M0 0L-46 98M0 0L46 98" stroke={RS.apron} strokeWidth={9} strokeLinecap="round"/>
  <path d="M0 0L-44 94" stroke={RS.apronLit} strokeWidth={3} strokeLinecap="round"/>
  <path d="M-50 96H50L66 232H-66Z" fill={`url(#${id})`} stroke={RS.ink} strokeWidth={3}/>
  <path d="M-72 232H74V248H-72Z" fill={RS.apron} stroke={RS.ink} strokeWidth={3}/>
  <path d="M-70 244C-86 270 -80 300 -92 336M74 244C86 276 84 304 96 330" stroke={RS.apron} strokeWidth={8} fill="none" strokeLinecap="round"/>
  <path d="M-80 248H82L96 462Q50 474 0 466Q-52 474 -94 462Z" fill={`url(#${id})`} stroke={RS.ink} strokeWidth={3}/>
  <path d="M-30 260C-34 330 -40 400 -46 458M24 262C30 330 34 400 40 460" stroke="#000" strokeWidth={3} opacity={.15} fill="none"/>
  <rect x={-58} y={296} width={118} height={74} rx={6} fill={RS.apronLit} stroke={RS.ink} strokeWidth={2.4}/>
  <path d="M-52 302H54M2 296V370" stroke={RS.tile} strokeWidth={2} strokeDasharray="6 4"/>
  <rect x={-40} y={270} width={10} height={44} rx={3} fill={RS.paper} stroke={RS.ink} strokeWidth={1.6} transform="rotate(-8 -35 290)"/>
  <rect x={-36} y={262} width={4} height={14} fill={RS.steelDark} transform="rotate(-8 -35 290)"/>
  <path d="M-46 110L46 110" stroke={RS.tile} strokeWidth={2} strokeDasharray="6 4"/>
  <path d="M60 420q16 6 24 -4" stroke={RS.apronLit} strokeWidth={3} fill="none"/>
 </g>;
};
/** The walnut host stand. Its top surface centre line is STAND.top; the side hook is at STAND.hook. */
export const STAND={top:-438,front:-426,half:150,hook:[-140,-372] as Pt,h:426};
const HostStand:React.FC<{children?:React.ReactNode}>=({children})=>{
 const id=useUid('rshs');
 return <g data-part="host-stand">
  <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={RS.woodLit}/><stop offset=".6" stopColor={RS.wood}/><stop offset="1" stopColor={RS.woodDeep}/></linearGradient></defs>
  <ellipse cx={14} cy={4} rx={150} ry={14} fill="#1A1410" opacity={.25}/>
  <path d="M-116 0H116L132 -400H-132Z" fill={`url(#${id})`} stroke={RS.ink} strokeWidth={3.4}/>
  <path d="M-92 -40H92L104 -200H-104Z M-104 -230H104L112 -370H-112Z" fill={RS.woodDeep} opacity={.35} stroke={RS.ink} strokeWidth={2} strokeOpacity={.5}/>
  <path d="M-96 -46L-106 -196M-108 -236L-114 -364" stroke={RS.woodLit} strokeWidth={3} opacity={.7}/>
  <path d="M70 -120q14 4 24 -2" stroke={RS.woodLit} strokeWidth={3} opacity={.5} fill="none"/>
  <path d="M-150 -470H150L150 -426H-150Z" fill={RS.woodLit} stroke={RS.ink} strokeWidth={3}/>
  <path d="M-150 -426H150V-404H-150Z" fill={RS.woodDeep} stroke={RS.ink} strokeWidth={3}/>
  <path d="M-140 -462H120" stroke="#FFFFFF" strokeWidth={2.4} opacity={.3}/>
  <g transform={`translate(${STAND.hook[0]} ${STAND.hook[1]})`}><ApronHook/></g>
  {children}
 </g>;
};
/** A corded desk phone on a surface at y 0. `ring` 0 to 1 is how hard it rings; `t` drives the rattle.
 * The handset never leaves its cradle forks: its lift is under the forks' height. */
export const PHONE_DESK={handset:[0,-74] as Pt,forks:[[-64,-62],[64,-56]] as Pt[]};
const DeskPhone:React.FC<{ring:number;t:number}>=({ring,t})=>{
 const r=clamp(ring),beat=r*(Math.sin(2*Math.PI*t/1.2)>-.3?1:0);
 const jig=beat*3.2*Math.sin(2*Math.PI*9*t),lift=beat*1.8*Math.abs(Math.sin(2*Math.PI*9*t));
 return <g data-part="desk-phone">
  <ellipse cx={8} cy={4} rx={100} ry={10} fill="#1A1410" opacity={.25}/>
  <path d="M-94 0H94L80 -48L-80 -64Z" fill={RS.charcoal} stroke={RS.ink} strokeWidth={3}/>
  <path d="M-80 -60L80 -46" stroke="#5A6168" strokeWidth={3}/>
  {Array.from({length:12},(_,i)=><rect key={i} x={-30+(i%3)*18} y={-42+Math.floor(i/3)*9+(i%3)*-1.2} width={13} height={6} rx={2} fill="#6E767C"/>)}
  <circle cx={58} cy={-28} r={6} fill={r>0&&Math.sin(2*Math.PI*t*2.5)>0?'#F2B544':'#6E6250'} stroke={RS.ink} strokeWidth={1.4}/>
  {PHONE_DESK.forks.map((p,k)=><rect key={k} x={p[0]-10} y={p[1]-8} width={20} height={10} rx={4} fill="#3F464C" stroke={RS.ink} strokeWidth={1.6}/>)}
  <path d="M-88 -30C-110 -10 -96 10 -116 20C-130 30 -112 46 -128 56" stroke="#3F464C" strokeWidth={5} fill="none"/>
  <g transform={`translate(${PHONE_DESK.handset[0]} ${f2(PHONE_DESK.handset[1]-lift)}) rotate(${f2(jig)})`}>
   <path d="M-108 6C-112 -10 -100 -20 -84 -18L84 -12C100 -12 112 -4 108 10C104 22 84 22 70 14L-70 10C-86 18 -104 20 -108 6Z" fill={RS.charcoal} stroke={RS.ink} strokeWidth={3}/>
   <path d="M-80 -12L80 -6" stroke="#5E666D" strokeWidth={3}/>
  </g>
  {r>0&&[0,1,2].map(i=>{const o=beat*(.25+.75*Math.abs(Math.sin(2*Math.PI*(t*2.2-i*.18))));
   return <g key={i} opacity={f2(o)} stroke={RS.ink} strokeWidth={4} fill="none" strokeLinecap="round">
    <path d={`M${-122-i*16} ${-98-i*6}q-12 22 0 44`}/><path d={`M${122+i*16} ${-92-i*6}q12 22 0 44`}/></g>;})}
 </g>;
};
/** A guest check pad lying flat; `curl` lifts its top sheet's lower corner. Blank: ruling, no writing. */
const OrderPad:React.FC<{curl?:number;fy?:number}>=({curl=0,fy=.42})=>{
 const w=150,h=190,c=clamp(curl);
 const sheet=(k:number)=><rect key={k} x={-w/2+k*2} y={-h/2+k*3} width={w} height={h} rx={4} fill={k?RS.paperShade:RS.paper} stroke={RS.ink} strokeWidth={2.4/fy*.6}/>;
 const lx=w/2,ly=h/2,up=c*80;
 return <g data-part="order-pad" transform={`scale(1 ${fy})`}>
  <ellipse cx={8} cy={h/2+10} rx={w*.6} ry={14} fill="#1A1410" opacity={.2}/>
  {[3,2,1].map(sheet)}
  <path d={`M${-w/2} ${-h/2}H${w/2}V${f2(ly-up*.9)}Q${f2(lx-30*c)} ${f2(ly-up*.2)} ${f2(-w/2+40*c)} ${f2(ly-up*.25)}L${-w/2} ${ly}Z`} fill={RS.paperLit} stroke={RS.ink} strokeWidth={2.4/fy*.6}/>
  <rect x={-w/2} y={-h/2} width={w} height={26} fill={RS.tile} opacity={.8}/>
  {Array.from({length:6},(_,k)=><path key={k} d={`M${-w/2+10} ${-h/2+46+k*22}H${w/2-10-(k>4?up*.4:0)}`} stroke={RS.line} strokeWidth={2/fy*.6}/>)}
  <path d={`M${-w/2+40} ${-h/2+30}V${f2(ly-up*.3)}`} stroke={RS.line} strokeWidth={2/fy*.6}/>
  {c>0&&<path d={`M${f2(lx)} ${f2(ly-up*.9)}Q${f2(lx-30*c)} ${f2(ly-up*.2)} ${f2(-w/2+40*c)} ${f2(ly-up*.25)}`} stroke={RS.paperShade} strokeWidth={8/fy*.5} fill="none" opacity={.8}/>}
  <g transform={`translate(${w/2+18} ${-10}) rotate(78)`}><rect x={-90} y={-6} width={180} height={12} rx={3} fill={RS.butter} stroke={RS.ink} strokeWidth={2}/><path d="M90 -6L108 0L90 6Z" fill={RS.woodLit} stroke={RS.ink} strokeWidth={2}/></g>
 </g>;
};
/** A laminate pedestal table standing on the floor at the origin. Its top surface is at TABLE.top. */
export const TABLE={top:-330,half:190,front:-312};
const Table:React.FC<{children?:React.ReactNode;w?:number}>=({children,w=380})=>{
 const h=w/2;
 return <g data-part="table">
  <ellipse cx={10} cy={4} rx={h*.7} ry={12} fill="#1A1410" opacity={.25}/>
  <path d="M-100 0L-14 -24H14L100 0" stroke={RS.charcoal} strokeWidth={12} strokeLinecap="round" fill="none"/>
  <rect x={-14} y={-300} width={28} height={280} fill={RS.charcoal} stroke={RS.ink} strokeWidth={2.4}/>
  <path d={`M${-h} -312H${h}L${h-18} -352H${-h+18}Z`} fill={RS.laminate} stroke={RS.ink} strokeWidth={3}/>
  <rect x={-h} y={-312} width={w} height={16} fill={RS.laminateEdge} stroke={RS.ink} strokeWidth={3}/>
  <path d={`M${-h+30} -346H${h-80}`} stroke="#FFFFFF" strokeWidth={3} opacity={.5}/>
  {children}
 </g>;
};
const Chair:React.FC<{flip?:boolean}>=({flip=false})=><g data-part="chair" transform={flip?'scale(-1 1)':undefined}>
 <path d="M-60 0L-50 -170M50 0L44 -170M-40 -170L-50 -400" stroke={RS.woodDeep} strokeWidth={10} strokeLinecap="round" fill="none"/>
 <path d="M-62 -176H58L50 -160H-56Z" fill={RS.wood} stroke={RS.ink} strokeWidth={2.4}/>
 <path d="M-52 -400Q-10 -420 30 -396" stroke={RS.woodDeep} strokeWidth={14} fill="none" strokeLinecap="round"/>
</g>;
export type GuestLook={skin:string;hair:string;shirt:string;style:'short'|'bun'|'curly'|'wave'};
export const GUESTS:GuestLook[]=[{skin:RS.skin[1],hair:'#2B1D16',shirt:RS.shirt[0],style:'short'},{skin:RS.skin[3],hair:'#1A1210',shirt:RS.shirt[1],style:'curly'},
 {skin:RS.skin[2],hair:'#6A4A2E',shirt:RS.shirt[2],style:'bun'},{skin:RS.skin[4],hair:'#24180F',shirt:RS.shirt[4],style:'wave'}];
/** A seated guest, the seat at the origin; the table top is 130 above the seat. `layer` body draws the figure
 * behind a table, arms the forearms resting on the table in front of it. `raise` lifts the right hand. */
const Guest:React.FC<GuestLook&{layer:'body'|'arms';raise?:number;look?:number;menu?:boolean}>=({skin,hair,shirt,style,layer,raise=0,look=0,menu=false})=>{
 const rz=clamp(raise),hx=6*look;
 if(layer==='arms'){
  const elbowR:Pt=[lerp(70,92,rz),lerp(-118,-170,rz)],handR:Pt=[lerp(40,108,rz),lerp(-142,-318,rz)];
  return <g data-part="guest-arms">
   {menu?<g>
    <path d={`M-74 -176L-92 -126L-50 -176`} stroke={shirt} strokeWidth={36} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <g transform="translate(-46 -186)"><path d="M-62 -96L0 -84L0 20L-62 8Z" fill={RS.paperLit} stroke={RS.ink} strokeWidth={2.4}/><path d="M0 -84L56 -100L56 4L0 20Z" fill={RS.paper} stroke={RS.ink} strokeWidth={2.4}/>
     {[0,1,2,3].map(k=><path key={k} d={`M-52 ${-66+k*18}L-10 ${-58+k*18}M10 ${-62+k*18}L46 ${-72+k*18}`} stroke={RS.line} strokeWidth={3}/>)}
     <path d="M-62 -96L0 -84L56 -100" stroke={RS.tile} strokeWidth={5} fill="none"/></g>
    <ellipse cx={-48} cy={-178} rx={16} ry={20} fill={skin} stroke={RS.ink} strokeWidth={2.4}/></g>:<g>
   <path d={`M-74 -176L-78 -122L-30 -140`} stroke={shirt} strokeWidth={36} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
   <path d={`M-74 -176L-78 -122L-30 -140`} stroke={RS.ink} strokeWidth={2} fill="none" opacity={.4}/>
   <ellipse cx={-22} cy={-142} rx={20} ry={13} fill={skin} stroke={RS.ink} strokeWidth={2.4}/></g>}
   <path d={`M74 -176L${f2(elbowR[0])} ${f2(elbowR[1])}L${f2(handR[0])} ${f2(handR[1])}`} stroke={shirt} strokeWidth={36} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
   {rz>.05?<g transform={`translate(${f2(handR[0])} ${f2(handR[1])})`}><path d="M-14 6C-18 -10 -14 -34 -8 -38C-2 -40 0 -30 0 -24C2 -36 8 -40 12 -34C16 -24 16 -4 12 8Z" fill={skin} stroke={RS.ink} strokeWidth={2.4}/></g>:
    <ellipse cx={f2(handR[0])} cy={f2(handR[1])} rx={20} ry={13} fill={skin} stroke={RS.ink} strokeWidth={2.4}/>}
  </g>;
 }
 return <g data-part="guest">
  <path d="M-78 0C-82 -80 -86 -150 -70 -186C-40 -204 40 -204 70 -186C86 -150 82 -80 78 0Z" fill={shirt} stroke={RS.ink} strokeWidth={3}/>
  <path d="M-50 -190Q0 -170 50 -190" stroke="#000" strokeWidth={3} opacity={.15} fill="none"/>
  <path d="M-16 -204V-222H16V-204Z" fill={skin} stroke={RS.ink} strokeWidth={2.4}/>
  {style==='curly'&&<circle cx={0} cy={-268} r={56} fill={hair}/>}
  {style==='bun'&&<circle cx={18} cy={-318} r={22} fill={hair} stroke={RS.ink} strokeWidth={2}/>}
  <ellipse cx={0} cy={-262} rx={42} ry={48} fill={skin} stroke={RS.ink} strokeWidth={3}/>
  <ellipse cx={-42+hx*.4} cy={-258} rx={7} ry={11} fill={skin} stroke={RS.ink} strokeWidth={2}/>
  {style==='short'&&<path d="M-44 -266C-46 -306 -20 -318 4 -316C30 -314 46 -298 44 -268C34 -286 10 -292 -18 -286C-30 -284 -40 -278 -44 -266Z" fill={hair}/>}
  {style==='bun'&&<path d="M-44 -258C-48 -300 -16 -318 10 -314C36 -310 48 -288 44 -256C38 -280 20 -292 -6 -292C-26 -292 -40 -280 -44 -258Z" fill={hair}/>}
  {style==='curly'&&<path d="M-44 -262C-40 -300 -10 -316 14 -312C36 -306 46 -290 44 -262C30 -286 4 -294 -20 -286Z" fill={hair}/>}
  {style==='wave'&&<path d="M-46 -240C-52 -300 -18 -320 8 -316C38 -312 50 -290 46 -236C40 -270 24 -290 -4 -290C-28 -290 -40 -270 -46 -240Z" fill={hair}/>}
  <ellipse cx={-12+hx} cy={-258} rx={4} ry={5.5} fill={RS.ink}/><ellipse cx={14+hx} cy={-258} rx={4} ry={5.5} fill={RS.ink}/>
  <path d={`M${-20+hx} ${-272}h14M${8+hx} ${-273}h13`} stroke={RS.ink} strokeWidth={3} strokeLinecap="round" opacity={.8}/>
  <path d={`M${-6+hx} ${-234}q6 3 12 0`} stroke={RS.ink} strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={.7}/>
 </g>;
};
/** A plate on a surface at y 0, side on: a rim ellipse and a mound of food. */
export type Food='none'|'noodle'|'rice'|'dumpling';
const Plate:React.FC<{food?:Food;s?:number}>=({food='none'})=><g data-part="plate">
 <ellipse cx={4} cy={4} rx={56} ry={10} fill="#1A1410" opacity={.2}/>
 <ellipse cx={0} cy={0} rx={56} ry={13} fill="#F8F4EA" stroke={RS.ink} strokeWidth={2.4}/>
 <ellipse cx={0} cy={-1} rx={38} ry={8} fill="#EDE6D6"/>
 {food==='none'&&<g><path d="M-22 -6L4 -12L22 -5L-4 1Z" fill="#FFFFFF" stroke={RS.ink} strokeWidth={1.4}/><path d="M-30 4L34 -4M-28 7L36 -1" stroke={RS.woodDeep} strokeWidth={2.4} strokeLinecap="round"/></g>}
 {food==='rice'&&<path d="M-30 -2C-28 -22 26 -24 30 -2Z" fill="#F4EFE2" stroke={RS.ink} strokeWidth={1.6}/>}
 {food==='rice'&&<g><circle cx={-8} cy={-12} r={4} fill="#5E9A4A"/><circle cx={10} cy={-8} r={4} fill="#E07B39"/></g>}
 {food==='noodle'&&<path d="M-30 -2C-24 -24 24 -26 30 -2Z" fill="#D9A653" stroke={RS.ink} strokeWidth={1.6}/>}
 {food==='noodle'&&<path d="M-20 -8q10 -10 20 0t20 0" stroke="#A3712F" strokeWidth={3} fill="none"/>}
 {food==='dumpling'&&[-16,6,24].map((x,i)=><path key={i} d={`M${x-12} -2q12 -22 24 0z`} fill="#F1E3C4" stroke={RS.ink} strokeWidth={1.6}/>)}
</g>;
const WaterGlass:React.FC<{}>=()=><g data-part="water-glass">
 <path d="M-16 0L-20 -70H20L16 0Z" fill={RS.glassTint} opacity={.5} stroke={RS.ink} strokeWidth={2} strokeOpacity={.6}/>
 <path d="M-18 -40H18" stroke="#9CC4CF" strokeWidth={2} opacity={.8}/><path d="M-12 -62V-8" stroke="#FFFFFF" strokeWidth={3} opacity={.6}/>
</g>;
const MenuTent:React.FC<{}>=()=><g data-part="menu-tent">
 <path d="M-34 0L-6 -86L8 0Z" fill={RS.tile} stroke={RS.ink} strokeWidth={2.4}/>
 <path d="M8 0L-6 -86L30 0Z" fill={RS.tileDeep} stroke={RS.ink} strokeWidth={2.4}/>
 <path d="M-22 -24l12 -40" stroke={RS.paper} strokeWidth={3} opacity={.7}/>
</g>;
/** A wall clock with ticks and no numerals; `minute` and `hour` are angles in degrees. */
const Clock:React.FC<{r:number;minute:number;hour:number}>=({r,minute,hour})=><g data-part="clock">
 <circle cx={4} cy={6} r={r} fill="#1A1410" opacity={.15}/>
 <circle r={r} fill={RS.paperLit} stroke={RS.brassDeep} strokeWidth={r*.12}/>
 {Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return <path key={i} d={`M${f2(Math.sin(a)*r*.78)} ${f2(-Math.cos(a)*r*.78)}L${f2(Math.sin(a)*r*.9)} ${f2(-Math.cos(a)*r*.9)}`} stroke={RS.ink} strokeWidth={i%3?2:4}/>;})}
 <path d={`M0 0L${f2(Math.sin(hour*Math.PI/180)*r*.5)} ${f2(-Math.cos(hour*Math.PI/180)*r*.5)}`} stroke={RS.ink} strokeWidth={r*.09} strokeLinecap="round"/>
 <path d={`M0 0L${f2(Math.sin(minute*Math.PI/180)*r*.74)} ${f2(-Math.cos(minute*Math.PI/180)*r*.74)}`} stroke={RS.ink} strokeWidth={r*.05} strokeLinecap="round"/>
 <circle r={r*.06} fill={RS.brassDeep}/>
</g>;
/** A warm pendant lamp hanging `len` from the origin, with the cone of light it throws. */
const Pendant:React.FC<{len:number;glow?:number}>=({len,glow=1})=>{
 const id=useUid('rspd');
 return <g data-part="pendant">
  <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFE2B0" stopOpacity={.45*glow}/><stop offset="1" stopColor="#FFE2B0" stopOpacity={0}/></linearGradient></defs>
  <path d={`M0 0V${len}`} stroke={RS.ink} strokeWidth={3}/>
  <path d={`M-150 ${len+60}L-34 ${len+40}H34L150 ${len+60}V${len+420}H-150Z`} fill={`url(#${id})`}/>
  <path d={`M-46 ${len+44}C-40 ${len+10} -20 ${len} 0 ${len}C20 ${len} 40 ${len+10} 46 ${len+44}Z`} fill={RS.tile} stroke={RS.ink} strokeWidth={3}/>
  <ellipse cx={0} cy={len+44} rx={46} ry={8} fill="#FFE8BE" stroke={RS.ink} strokeWidth={2}/>
  <path d={`M-30 ${len+30}C-26 ${len+16} -14 ${len+8} -4 ${len+6}`} stroke={RS.tileLit} strokeWidth={4} fill="none"/>
 </g>;
};
/** The empty sign frame hanging on the glass from one suction cup at the origin. `shine` sweeps light
 * across its empty acrylic. Its lone push pin holds nothing. */
export const SIGN={w:200,h:280,top:52};
const SignFrame:React.FC<{shine?:number}>=({shine=0})=>{
 const id=useUid('rssf');
 const W=SIGN.w,H=SIGN.h,T=SIGN.top,s=-W/2-60+(W+120)*clamp(shine);
 return <g data-part="sign-frame">
  <defs><clipPath id={id}><rect x={-W/2} y={T} width={W} height={H} rx={8}/></clipPath></defs>
  <circle r={16} fill={RS.glassTint} opacity={.6} stroke={RS.ink} strokeWidth={2.4}/>
  <circle r={6} fill={RS.steelDark}/>
  <path d={`M0 6L${-W/2+10} ${T+4}M0 6L${W/2-10} ${T+4}`} stroke={RS.steelDark} strokeWidth={3}/>
  <rect x={-W/2} y={T} width={W} height={H} rx={8} fill={RS.glassTint} opacity={.22} stroke={RS.ink} strokeWidth={3}/>
  <rect x={-W/2+14} y={T+14} width={W-28} height={H-28} rx={4} fill={RS.paperLit} opacity={.9} stroke={RS.line} strokeWidth={2}/>
  <rect x={-W/2+26} y={T+26} width={W-52} height={H-52} rx={3} fill="none" stroke={RS.line} strokeWidth={1.6} strokeDasharray="8 6" opacity={.7}/>
  <g transform={`translate(0 ${T+34})`}><circle r={8} fill={RS.tile} stroke={RS.ink} strokeWidth={2}/><circle cx={-2} cy={-2} r={2.6} fill={RS.tileLit}/></g>
  {shine>0&&shine<1&&<g clipPath={`url(#${id})`}><path d={`M${f2(s)} ${T}l60 0l-90 ${H}l-60 0Z`} fill="#FFFFFF" opacity={.35}/></g>}
  <path d={`M${-W/2+6} ${T+H-30}V${T+20}`} stroke="#FFFFFF" strokeWidth={4} opacity={.4}/>
 </g>;
};
/** The flat host panel on its pole stand, the base on the floor at the origin. EYELET is the lanyard eyelet
 * at the bezel's top right corner, where a tag's string hangs. `lit` wipes light across the screen from the
 * left, `name` writes Haniya, `order` slides an order card up into its lower half. */
export const PANEL={cx:0,cy:-770,w:300,h:420,screen:{x:-132,y:-962,w:264,h:384},eyelet:[134,-962] as Pt};
const HostPanel:React.FC<{lit:number;name:number;order?:number;t:number}>=({lit,name,order=0,t})=>{
 const id=useUid('rshp');
 const P=PANEL,S=P.screen,L=clamp(lit),N=clamp(name),O=clamp(order);
 const nameW=widthOf('Haniya',56,true);
 const pulse=.5+.5*Math.sin(2*Math.PI*t*.9);
 return <g data-part="host-panel">
  <defs>
   <clipPath id={id+'s'}><rect x={S.x} y={S.y} width={S.w} height={S.h} rx={14}/></clipPath>
   <clipPath id={id+'l'}><rect x={S.x-40} y={S.y} width={f2((S.w+80)*L)} height={S.h}/></clipPath>
   <clipPath id={id+'n'}><rect x={f2(-nameW/2-4)} y={S.y+170} width={f2((nameW+8)*N)} height={90}/></clipPath>
   <linearGradient id={id+'g'} x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stopColor="#3B6573"/><stop offset="1" stopColor={RS.screenLit}/></linearGradient>
   <linearGradient id={id+'p'} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={RS.steelLit}/><stop offset="1" stopColor={RS.steelDeep}/></linearGradient>
  </defs>
  <ellipse cx={10} cy={4} rx={100} ry={14} fill="#1A1410" opacity={.28}/>
  <ellipse cx={0} cy={0} rx={86} ry={16} fill={RS.charcoal} stroke={RS.ink} strokeWidth={3}/>
  <rect x={-12} y={-570} width={24} height={566} fill={`url(#${id}p)`} stroke={RS.ink} strokeWidth={2.4}/>
  <path d="M-30 -560H30L22 -590H-22Z" fill={RS.steelDark} stroke={RS.ink} strokeWidth={2.4}/>
  {L>0&&<ellipse cx={0} cy={P.cy} rx={f2(220+30*pulse)} ry={f2(290+20*pulse)} fill={RS.screenGlow} opacity={f2(.16*L)}/>}
  <rect x={-P.w/2} y={P.cy-P.h/2} width={P.w} height={P.h} rx={26} fill={RS.charcoal} stroke={RS.ink} strokeWidth={3.4}/>
  <path d={`M${-P.w/2+12} ${P.cy-P.h/2+30}V${P.cy+P.h/2-40}`} stroke="#5A6268" strokeWidth={4} opacity={.8}/>
  <rect x={S.x} y={S.y} width={S.w} height={S.h} rx={14} fill={RS.screenOff}/>
  <g clipPath={`url(#${id}s)`}>
   <g clipPath={`url(#${id}l)`}>
    <rect x={S.x} y={S.y} width={S.w} height={S.h} fill={`url(#${id}g)`}/>
    {[0,1,2].map(i=><ellipse key={i} cx={0} cy={S.y+100} rx={f2(30+i*20+6*pulse)} ry={f2(30+i*20+6*pulse)} fill="none" stroke={RS.screenGlow} strokeWidth={4-i} opacity={f2(.8-.22*i)}/>)}
    <circle cx={0} cy={S.y+100} r={18} fill={RS.screenGlow}/>
    {[-1,1].map(s=><path key={s} d={`M${s*86} ${S.y+100}h${s*14}M${s*96} ${S.y+90}v20`} stroke={RS.screenGlow} strokeWidth={3} opacity={.5}/>)}
    <g clipPath={`url(#${id}n)`}><Txt x={0} y={S.y+232} size={56} bold anchor="middle" fill="#F4FBFC">Haniya</Txt></g>
    <rect x={-70} y={S.y+258} width={140} height={8} rx={4} fill={RS.screenGlow} opacity={f2(.5*N)}/>
    <rect x={-50} y={S.y+276} width={100} height={8} rx={4} fill={RS.screenGlow} opacity={f2(.35*N)}/>
    {O>0&&<g transform={`translate(0 ${f2(S.y+S.h+20-104*O)})`} opacity={f2(Math.min(1,O*2))}>
     <rect x={-114} y={0} width={228} height={76} rx={14} fill={RS.paperLit} stroke={RS.ink} strokeWidth={2}/>
     <g transform="translate(-82 38)"><path d="M-16 -2a16 12 0 0 0 32 0z" fill="#D9A653" stroke={RS.ink} strokeWidth={1.6}/><path d="M-10 -6q4 -10 0 -14M2 -6q4 -10 0 -14" stroke={RS.inkSoft} strokeWidth={2} fill="none"/></g>
     <Txt x={-56} y={46} size={Math.min(22,118/widthOf('Chow mein',1,true))} bold>Chow mein</Txt>
     <g transform="translate(86 38)"><circle r={14} fill={RS.red} stroke="#9A2918" strokeWidth={1.6}/><path d="M-6 0l4 4l8 -8" stroke="#FFFDF6" strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round"/></g>
    </g>}
   </g>
   <path d={`M${S.x} ${S.y+40}L${S.x+80} ${S.y}H${S.x+120}L${S.x} ${S.y+90}Z`} fill="#FFFFFF" opacity={.06}/>
  </g>
  <circle cx={P.eyelet[0]} cy={P.eyelet[1]} r={9} fill={RS.charcoal} stroke={RS.steelLit} strokeWidth={4}/>
  <circle cx={P.eyelet[0]} cy={P.eyelet[1]} r={3.5} fill="#0B0D0F"/>
  <circle cx={0} cy={P.cy+P.h/2-12} r={4} fill={L>0?RS.screenGlow:'#3A4248'}/>
 </g>;
};
/** A luggage tag hanging from its hole at the origin; the episode draws the string from the hole. */
export function tagSize(lines:string[],size:number){
 const w=Math.max(...lines.map(l=>widthOf(l,size,true)))+size*1.4,h=lines.length*size*1.22+size*.9+34;
 return {w,h};
}
/** The tag's outline about its hole, shared by the tag and by any shadow it casts, so the two always match. */
export function tagPath(lines:string[],size:number){const {w,h}=tagSize(lines,size),ch=Math.min(26,w*.12),top=-18;
 return `M${f2(-w/2+ch)} ${top}H${f2(w/2-ch)}L${f2(w/2)} ${top+ch}V${f2(top+h)}H${f2(-w/2)}V${top+ch}Z`;}
const Tag:React.FC<{lines:string[];size:number;swing?:number;tone?:'kraft'|'cream'|'slate'}>=({lines,size,swing=0,tone='kraft'})=>{
 const {w,h}=tagSize(lines,size),top=-18;
 const fill=tone==='kraft'?RS.kraft:tone==='slate'?'#DCE6E8':RS.paperLit,edge=tone==='kraft'?RS.kraftDeep:tone==='slate'?'#7E9AA2':RS.line;
 return <g data-part="tag" transform={`rotate(${f2(swing)})`}>
  <path d={tagPath(lines,size)} fill={fill} stroke={RS.ink} strokeWidth={2.6}/>
  <path d={`M${f2(-w/2+6)} ${f2(top+h-6)}H${f2(w/2-6)}`} stroke={edge} strokeWidth={3} opacity={.6}/>
  <circle r={11} fill={edge} opacity={.7}/><circle r={6} fill="#1A1410" opacity={.75}/>
  <path d="M-4 -4C-10 -18 6 -20 4 -6" stroke="#EDE3CF" strokeWidth={3} fill="none"/>
  {lines.map((l,i)=><Txt key={i} x={0} y={top+30+size*.9+i*size*1.22} size={size} bold anchor="middle">{l}</Txt>)}
 </g>;
};

// ---- the kitchen ------------------------------------------------------------------------------------------
/** The stainless pass shelf, its front top edge from (0,0) to (w,0); the surface recedes 40 above. */
const PassShelf:React.FC<{w:number}>=({w})=>{
 const id=useUid('rsps');
 return <g data-part="pass-shelf">
  <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={RS.steelLit}/><stop offset="1" stopColor={RS.steel}/></linearGradient></defs>
  <path d={`M10 -40H${w-10}L${w} 0H0Z`} fill={`url(#${id})`} stroke={RS.ink} strokeWidth={3}/>
  <rect x={0} y={0} width={w} height={22} fill={RS.steelDeep} stroke={RS.ink} strokeWidth={3}/>
  <path d={`M8 6H${w-8}`} stroke={RS.steelLit} strokeWidth={2} opacity={.7}/>
  <rect x={0} y={22} width={w} height={60} fill="#1A1410" opacity={.16}/>
  {Array.from({length:Math.floor(w/90)},(_,k)=><path key={k} d={`M${30+k*90} -30q20 6 40 0`} stroke="#FFFFFF" strokeWidth={2} opacity={.3} fill="none"/>)}
  <path d={`M${w*.7} 8q6 8 2 14`} stroke="#8E6A4A" strokeWidth={2} opacity={.5} fill="none"/>
 </g>;
};
/** A heat lamp bar `w` wide hanging on two rods from above; its glow falls below. */
const HeatLamp:React.FC<{w:number;rod:number}>=({w,rod})=><g data-part="heat-lamp">
 <path d={`M30 ${-rod}V0M${w-30} ${-rod}V0`} stroke={RS.steelDark} strokeWidth={6}/>
 <rect x={0} y={0} width={w} height={34} rx={8} fill={RS.steel} stroke={RS.ink} strokeWidth={3}/>
 <rect x={14} y={28} width={w-28} height={8} rx={4} fill="#FFB46A"/>
 <path d={`M14 36L-40 300H${w+40}L${w-14} 36Z`} fill="#FFB46A" opacity={.12}/>
</g>;
const Hood:React.FC<{w:number}>=({w})=><g data-part="hood">
 <path d={`M0 0H${w}L${w-60} -150H60Z`} fill={RS.steel} stroke={RS.ink} strokeWidth={3}/>
 <rect x={-10} y={0} width={w+20} height={26} fill={RS.steelDeep} stroke={RS.ink} strokeWidth={3}/>
 {Array.from({length:6},(_,k)=><path key={k} d={`M${80+k*(w-160)/5} -130V-20`} stroke={RS.steelDeep} strokeWidth={3} opacity={.6}/>)}
</g>;

// ---- the back office -------------------------------------------------------------------------------------
/** A desk seen from the front: its top surface from row y (back edge) to y+depth, then its front edge. */
const Desk:React.FC<{y:number;depth?:number}>=({y,depth=220})=>{
 const id=useUid('rsdk');
 return <g data-part="desk">
  <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={RS.woodDeep}/><stop offset=".25" stopColor={RS.wood}/><stop offset="1" stopColor={RS.woodLit}/></linearGradient></defs>
  <rect x={-60} y={y} width={1200} height={depth} fill={`url(#${id})`}/>
  {Array.from({length:8},(_,k)=><path key={k} d={`M-60 ${f2(y+depth*(k+.5)/8+6*Math.sin(k))}C300 ${f2(y+depth*(k+.4)/8)} 700 ${f2(y+depth*(k+.7)/8)} 1140 ${f2(y+depth*(k+.5)/8)}`} stroke={RS.woodDeep} strokeWidth={2} opacity={.25} fill="none"/>)}
  <rect x={-60} y={y+depth} width={1200} height={30} fill={RS.woodDeep} stroke={RS.ink} strokeWidth={3}/>
  <rect x={-60} y={y+depth+30} width={1200} height={1920-y-depth} fill="#4A2F20"/>
  <path d={`M-60 ${y+depth+4}H1140`} stroke={RS.woodLit} strokeWidth={2.4} opacity={.7}/>
 </g>;
};
/** The same desk from above, filling a rectangle. */
const DeskTop:React.FC<{x:number;y:number;w:number;h:number}>=({x,y,w,h})=>{
 const id=useUid('rsdt');
 return <g data-part="desk-top">
  <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={RS.woodLit}/><stop offset="1" stopColor={RS.wood}/></linearGradient></defs>
  <rect x={x} y={y} width={w} height={h} rx={10} fill={`url(#${id})`} stroke={RS.ink} strokeWidth={4}/>
  {Array.from({length:14},(_,k)=><path key={k} d={`M${x+10} ${f2(y+(k+.5)*h/14)}C${x+w*.3} ${f2(y+(k+.3)*h/14+8*Math.sin(k*1.7))} ${x+w*.7} ${f2(y+(k+.7)*h/14)} ${x+w-10} ${f2(y+(k+.5)*h/14)}`} stroke={RS.woodDeep} strokeWidth={2} opacity={.22} fill="none"/>)}
  <path d={`M${x+w*.72} ${y+h*.2}a26 20 0 1 0 1 0`} stroke={RS.woodDeep} strokeWidth={2} opacity={.25} fill="none"/>
 </g>;
};
/** The ledger card, flat in card units 420 by 300 from its top left. Its header is the source's own words;
 * its rows are ruled and empty. `mark` inks the crooked owner count stamp at LEDGER.mark. */
export const LEDGER={w:420,h:300,tag:[300,92] as Pt,mark:{x:150,y:256,rot:-8}};
export const STAMP_TEXT='OWNER COUNT',STAMP_SIZE=22;
export const stampSize=()=>({w:widthOf(STAMP_TEXT,STAMP_SIZE,true)*1.08+34,h:STAMP_SIZE+28});
const StampMark:React.FC<{p?:number}>=({p=1})=>{
 const {w,h}=stampSize();
 return <g data-part="stamp-mark" opacity={f2(clamp(p))}>
  <rect x={-w/2} y={-h/2} width={w} height={h} rx={8} fill="none" stroke={RS.redInk} strokeWidth={4}/>
  <text x={0} y={STAMP_SIZE*.36} textAnchor="middle" fontFamily={FONT.body} fontSize={STAMP_SIZE} fontWeight={700} fill={RS.redInk} letterSpacing={2}>{STAMP_TEXT}</text>
  {Array.from({length:9},(_,i)=><path key={i} d={`M${f2(-w/2+10+i*w/9)} ${f2(-h/2+4+hash(i)*h*.7)}l${f2(10+8*hash(i+3))} ${f2(2*hash(i+5))}`} stroke={RS.paperLit} strokeWidth={3} opacity={.7}/>)}
 </g>;
};
const LedgerCard:React.FC<{mark?:number}>=({mark=0})=>{
 const L=LEDGER;
 return <g data-part="ledger-card">
  <path d={`M0 0H${L.w-34}L${L.w} 34V${L.h}H0Z`} fill={RS.paperLit} stroke={RS.ink} strokeWidth={3}/>
  <path d={`M${L.w-34} 0V34H${L.w}Z`} fill={RS.paperShade} stroke={RS.ink} strokeWidth={2.4}/>
  <Txt x={24} y={46} size={Math.min(27,350/widthOf('Saving or winning back',1,true))} bold>Saving or winning back</Txt>
  <path d="M20 64H390" stroke={RS.ink} strokeWidth={2.4}/>
  {Array.from({length:6},(_,k)=><path key={k} d={`M20 ${100+k*32}H400`} stroke={RS.line} strokeWidth={2}/>)}
  <path d="M120 70V286M320 70V286" stroke={RS.line} strokeWidth={2}/>
  <circle cx={340} cy={250} r={26} fill="none" stroke="#B59A73" strokeWidth={3} opacity={.25}/>
  <path d="M4 290l18 -6" stroke={RS.paperShade} strokeWidth={3}/>
  {mark>0&&<g transform={`translate(${L.mark.x} ${L.mark.y}) rotate(${L.mark.rot})`}><StampMark p={mark}/></g>}
 </g>;
};
/** A rubber stamp, side on with its rubber face's centre at the origin, or from above (`top`). */
const Stamp:React.FC<{top?:boolean}>=({top=false})=>{
 const id=useUid('rsst');
 if(top)return <g data-part="stamp-top">
  <rect x={-66} y={-23} width={132} height={46} rx={8} fill={RS.woodLit} stroke={RS.ink} strokeWidth={3}/>
  <path d="M-62 20H62" stroke={RS.redInk} strokeWidth={4} opacity={.8}/>
  <circle r={22} fill={RS.wood} stroke={RS.ink} strokeWidth={3}/><circle cx={-7} cy={-7} r={7} fill={RS.woodLit} opacity={.8}/>
 </g>;
 return <g data-part="stamp">
  <defs><radialGradient id={id} cx="0.35" cy="0.3" r="0.8"><stop offset="0" stopColor={RS.woodLit}/><stop offset="1" stopColor={RS.woodDeep}/></radialGradient></defs>
  <rect x={-66} y={-12} width={132} height={12} rx={2} fill="#7A2A1E" stroke={RS.ink} strokeWidth={2.4}/>
  <rect x={-74} y={-54} width={148} height={42} rx={6} fill={RS.woodLit} stroke={RS.ink} strokeWidth={3}/>
  <path d="M-66 -46H40" stroke="#FFFFFF" strokeWidth={2.4} opacity={.35}/>
  <path d="M-18 -54L-12 -92H12L18 -54Z" fill={RS.wood} stroke={RS.ink} strokeWidth={2.6}/>
  <ellipse cx={0} cy={-118} rx={36} ry={30} fill={`url(#${id})`} stroke={RS.ink} strokeWidth={3}/>
 </g>;
};
/** A bulldog receipt clip hanging from a nail at the origin; `open` parts its jaws on nothing. */
const ReceiptClip:React.FC<{open?:number;top?:boolean}>=({open=0,top=false})=>{
 const o=clamp(open);
 if(top)return <g data-part="clip-top">
  <rect x={-46} y={-24} width={92} height={48} rx={6} fill={RS.charcoal} stroke={RS.ink} strokeWidth={3}/>
  <path d={`M-34 -24C-40 ${f2(-60-20*o)} 40 ${f2(-60-20*o)} 34 -24`} stroke={RS.steelLit} strokeWidth={5} fill="none"/>
  <path d="M-40 -14H40" stroke="#5A6168" strokeWidth={3}/>
 </g>;
 return <g data-part="receipt-clip">
  <circle r={6} fill={RS.steelDark} stroke={RS.ink} strokeWidth={2}/>
  <path d={`M-24 ${f2(56-10*o)}C${f2(-30-14*o)} 20 ${f2(-14-8*o)} 2 0 2C${f2(14+8*o)} 2 ${f2(30+14*o)} 20 24 ${f2(56-10*o)}`} stroke={RS.steelLit} strokeWidth={5} fill="none"/>
  <path d={`M-24 ${f2(56-10*o)}C${f2(-30-14*o)} 20 ${f2(-14-8*o)} 2 0 2`} stroke={RS.ink} strokeWidth={1.4} fill="none" opacity={.5}/>
  <path d="M-46 52H46L40 104H-40Z" fill={RS.charcoal} stroke={RS.ink} strokeWidth={3}/>
  <path d="M-40 60H40" stroke="#5A6168" strokeWidth={3}/>
  <path d={`M-40 104L-36 ${f2(110+10*o)}H36L40 104Z`} fill={o>.05?'#0E1012':RS.charcoal} stroke={RS.ink} strokeWidth={2}/>
  <path d={`M-36 ${f2(110+10*o)}H36`} stroke="#6A7279" strokeWidth={3}/>
  <path d="M-30 70l10 0" stroke="#FFFFFF" strokeWidth={2} opacity={.3}/>
 </g>;
};
const CorkBoard:React.FC<{w:number;h:number}>=({w,h})=><g data-part="cork-board">
 <rect x={8} y={10} width={w} height={h} rx={6} fill="#1A1410" opacity={.2}/>
 <rect x={0} y={0} width={w} height={h} rx={6} fill={RS.woodDeep} stroke={RS.ink} strokeWidth={3}/>
 <rect x={14} y={14} width={w-28} height={h-28} fill="#B98E5E"/>
 {Array.from({length:60},(_,i)=><circle key={i} cx={f2(20+hash(i)*(w-40))} cy={f2(20+hash(i+60)*(h-40))} r={f2(1.5+2*hash(i+9))} fill="#8E6A42" opacity={.6}/>)}
 <rect x={30} y={h-80} width={70} height={46} fill={RS.paperShade} opacity={.5} transform={`rotate(-6 60 ${h-60})`}/>
</g>;
/** The federal rule card, flat in card units 520 by 380. Its box is only ever drawn (`box`), never ticked. */
export const RULE={w:520,h:380,box:{x:428,y:118,s:54},cooks:{x:16,y:236,w:488,h:92},lasso:{cx:266,cy:214,rx:240,ry:134,rot:-4,a0:-160,turns:1.06}};
export function rulePenPoint(u:number):Pt{
 const L=RULE.lasso,a=(L.a0+360*L.turns*clamp(u))*Math.PI/180,r=L.rot*Math.PI/180;
 const x=L.rx*Math.cos(a),y=L.ry*Math.sin(a);
 return [L.cx+x*Math.cos(r)-y*Math.sin(r),L.cy+x*Math.sin(r)+y*Math.cos(r)];
}
const lassoPath=(u:number)=>{const n=Math.max(2,Math.ceil(80*clamp(u)));
 return 'M'+Array.from({length:n+1},(_,i)=>{const p=rulePenPoint(u*i/n);return f2(p[0])+' '+f2(p[1]);}).join('L');};
const RuleCard:React.FC<{box:number;lit:number;circle:number}>=({box,lit,circle})=>{
 const R=RULE,B=R.box,C=R.cooks,bp=clamp(box);
 return <g data-part="rule-card">
  <rect x={0} y={0} width={R.w} height={R.h} rx={10} fill={RS.paperLit} stroke={RS.ink} strokeWidth={3}/>
  <path d={`M0 10Q0 0 10 0H${R.w-10}Q${R.w} 0 ${R.w} 10V72H0Z`} fill="#E3D7BE"/>
  <Txt x={26} y={48} size={Math.min(30,460/widthOf('Federal tip pool rule',1,true))} bold>Federal tip pool rule</Txt>
  <path d={`M0 72H${R.w}`} stroke={RS.ink} strokeWidth={2.4}/>
  <Txt x={28} y={136} size={Math.min(28,380/widthOf('If the employer takes',1,false))}>If the employer takes</Txt>
  <Txt x={28} y={176} size={30} bold>no tip credit</Txt>
  {bp>0&&<path d={`M${B.x} ${B.y}h${B.s}v${B.s}h${-B.s}Z`} fill="none" stroke={RS.ink} strokeWidth={4} strokeDasharray={4*B.s} strokeDashoffset={f2(4*B.s*(1-bp))} strokeLinejoin="round"/>}
  <path d={`M20 214H${R.w-20}`} stroke={RS.line} strokeWidth={2.4} strokeDasharray="10 8"/>
  {lit>0&&<rect x={C.x} y={C.y} width={f2(C.w*clamp(lit))} height={C.h} rx={10} fill={RS.butter} opacity={.85}/>}
  <Txt x={28} y={276} size={28}>a tip pool may</Txt>
  <Txt x={28} y={316} size={30} bold>include cooks</Txt>
  <g transform="translate(440 286)" opacity={.9}>
   <path d="M-26 6C-34 -10 -22 -26 -8 -20C-4 -34 14 -34 18 -20C32 -26 40 -8 28 6Z" fill="#FFFFFF" stroke={RS.ink} strokeWidth={2.4}/>
   <rect x={-22} y={6} width={46} height={16} rx={3} fill="#FFFFFF" stroke={RS.ink} strokeWidth={2.4}/>
  </g>
  <path d={`M${R.w-8} ${R.h-40}l-14 32`} stroke={RS.paperShade} strokeWidth={3}/>
  {circle>0&&<path d={lassoPath(circle)} stroke={RS.penInk} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={.9}/>}
 </g>;
};
/** A writing hand holding a pen, the pen's tip at the origin, leaning up and right. */
const PenHand:React.FC<{skin:string}>=({skin})=><g data-part="pen-hand">
 <path d="M0 0L14 -26L190 -250L176 -262L-2 -36Z" fill={RS.penInk} stroke={RS.ink} strokeWidth={2.4}/>
 <path d="M0 0L14 -26L4 -32Z" fill={RS.steelLit} stroke={RS.ink} strokeWidth={1.6}/>
 <path d="M60 -96L176 -244" stroke="#4E6380" strokeWidth={4} opacity={.8}/>
 <path d="M70 -60C60 -96 96 -130 132 -128C176 -126 230 -96 260 -40C280 0 270 60 240 90H120C96 60 80 -20 70 -60Z" fill={skin} stroke={RS.ink} strokeWidth={3.4}/>
 <path d="M36 -64C30 -82 46 -92 60 -84L104 -58C116 -48 108 -32 94 -36Z" fill={skin} stroke={RS.ink} strokeWidth={3}/>
 <path d="M150 -110C180 -100 210 -76 226 -46" stroke="#000" strokeWidth={3} opacity={.12} fill="none"/>
 <path d="M112 80L262 80L600 1500H330Z" fill="#5E4A6A" stroke={RS.ink} strokeWidth={3}/>
</g>;
/** The restaurant folder, flat in folder units 460 by 320 under a tab; `open` turns its cover about the left
 * spine and `q` draws the question mark beside the one box, which stays blank. */
export const FOLDER={w:460,h:320,box:{x:46,y:132,s:58},q:[150,196] as Pt};
const Folder:React.FC<{open:number;q:number}>=({open,q})=>{
 const F=FOLDER,c=Math.cos(Math.PI*clamp(open)),cw=F.w*c;
 return <g data-part="folder">
  <path d={`M0 -6L14 -48H${f2(30+widthOf('Restaurant',24,true))}L${f2(46+widthOf('Restaurant',24,true))} -6Z`} fill="#C9A86A" stroke={RS.ink} strokeWidth={2.6}/>
  <Txt x={24} y={-16} size={24} bold>Restaurant</Txt>
  <rect x={0} y={-6} width={F.w} height={F.h+6} rx={8} fill="#CDAE72" stroke={RS.ink} strokeWidth={3}/>
  <rect x={12} y={8} width={F.w-26} height={F.h-22} rx={4} fill={RS.paperLit} stroke={RS.ink} strokeWidth={2.4}/>
  <Txt x={34} y={88} size={Math.min(30,396/widthOf('Takes no tip credit?',1,true))} bold>Takes no tip credit?</Txt>
  <rect x={F.box.x} y={F.box.y} width={F.box.s} height={F.box.s} fill="none" stroke={RS.ink} strokeWidth={4}/>
  {q>0&&<text x={F.q[0]} y={F.q[1]} fontFamily={FONT.display} fontSize={110} fontWeight={700} fill={RS.ink} opacity={f2(clamp(q))}
   transform={`translate(${F.q[0]} ${F.q[1]}) scale(${f2(.7+.3*clamp(q))}) translate(${-F.q[0]} ${-F.q[1]})`}>?</text>}
  {Array.from({length:3},(_,k)=><path key={k} d={`M${240} ${150+k*34}H${F.w-40}`} stroke={RS.line} strokeWidth={2}/>)}
  {Math.abs(cw)>1&&<g>
   <rect x={f2(Math.min(0,cw))} y={-6} width={f2(Math.abs(cw))} height={F.h+6} rx={8} fill={c>0?'#D8BA7E':'#E3CA94'} stroke={RS.ink} strokeWidth={3}/>
   {c>0&&<path d={`M${f2(cw*.08)} 20H${f2(cw*.6)}`} stroke="#B39256" strokeWidth={3} opacity={.7}/>}
   {c<0&&<path d={`M${f2(cw*.1)} 30V${F.h-30}`} stroke="#B39256" strokeWidth={2} opacity={.6}/>}
  </g>}
 </g>;
};
/** The customer quote card, flat in card units 600 by 290: a verbatim excerpt and its plain attribution. */
export const QUOTE={w:600,h:290};
const QUOTE_SIZE=Math.min(36,520/widthOf('for every kind of people"',1,true));
const QuoteCard:React.FC<{}>=()=><g data-part="quote-card">
 <rect x={0} y={0} width={QUOTE.w} height={QUOTE.h} rx={12} fill={RS.paperLit} stroke={RS.ink} strokeWidth={3}/>
 <rect x={0} y={0} width={16} height={QUOTE.h} rx={6} fill={RS.tile}/>
 <Txt x={44} y={92} size={QUOTE_SIZE} bold>"not very convenient</Txt>
 <Txt x={44} y={146} size={QUOTE_SIZE} bold>for every kind of people"</Txt>
 <path d="M44 190H300" stroke={RS.line} strokeWidth={2.4}/>
 <Txt x={44} y={236} size={28} fill={RS.inkSoft}>One customer</Txt>
 <path d={`M${QUOTE.w-30} 14l18 18`} stroke={RS.paperShade} strokeWidth={3}/>
</g>;
const Mug:React.FC<{top?:boolean}>=({top=false})=>top?<g data-part="mug-top"><circle r={48} fill="#3F6E7A" stroke={RS.ink} strokeWidth={3}/><circle r={38} fill="#5A3A26"/>
 <path d="M48 -8h22v16h-22" stroke={RS.ink} strokeWidth={3} fill="#3F6E7A"/></g>:
 <g data-part="mug"><path d="M-40 0V-90H40V0Q0 10 -40 0Z" fill="#3F6E7A" stroke={RS.ink} strokeWidth={3}/><path d="M40 -70q30 0 30 26t-30 26" stroke={RS.ink} strokeWidth={8} fill="none"/>
 <ellipse cx={0} cy={-90} rx={40} ry={8} fill="#5A3A26" stroke={RS.ink} strokeWidth={2}/><path d="M-30 -80V-12" stroke="#FFFFFF" strokeWidth={4} opacity={.3}/></g>;

// ---- plan pieces for the overhead shots -----------------------------------------------------------------------
/** The dining room in plan, screen units. Its door is on the left wall, hinged at DOOR_PLAN.hinge. */
export const ROOM_PLAN={x:110,y:330,w:860,h:900,wall:20};
export const DOOR_PLAN={hinge:[110,980] as Pt,len:170};
export const TABLES_PLAN:Pt[]=[[470,640],[690,960]];
export const STAND_PLAN:Pt=[250,760];
export const PASS_PLAN={x:840,y:420,w:110,h:560,printer:[895,540] as Pt,jar:[895,690] as Pt,wok:[1010,860] as Pt};
const RoomPlan:React.FC<{door:number}>=({door})=>{
 const R=ROOM_PLAN,D=DOOR_PLAN,a=(-80*clamp(door))*Math.PI/180;
 const leaf:Pt=[D.hinge[0]+D.len*Math.sin(-a)*1,D.hinge[1]-D.len*Math.cos(a)];
 return <g data-part="room-plan">
  <rect x={R.x} y={R.y} width={R.w} height={R.h} fill="#E9DCC3"/>
  {Array.from({length:12},(_,k)=><path key={'g'+k} d={`M${R.x} ${R.y+k*75}H${R.x+R.w}`} stroke={RS.line} strokeWidth={1.4} opacity={.5}/>)}
  {Array.from({length:12},(_,k)=><path key={'v'+k} d={`M${R.x+k*75} ${R.y}V${R.y+R.h}`} stroke={RS.line} strokeWidth={1.4} opacity={.5}/>)}
  <path d={`M${R.x} ${D.hinge[1]-D.len}V${R.y}H${R.x+R.w}V${R.y+R.h}H${R.x}V${D.hinge[1]}`} fill="none" stroke={RS.ink} strokeWidth={R.wall} strokeLinejoin="miter"/>
  {[[R.x+90,R.x+330],[R.x+430,R.x+690]].map(([a0,a1],k)=><g key={k}><rect x={a0} y={R.y-R.wall/2} width={a1-a0} height={R.wall} fill={RS.glassTint}/>
   <path d={`M${a0} ${R.y-3}H${a1}M${a0} ${R.y+3}H${a1}`} stroke={RS.ink} strokeWidth={2}/></g>)}
  <path d={`M${D.hinge[0]} ${D.hinge[1]}m0 ${-D.len}A${D.len} ${D.len} 0 0 1 ${D.hinge[0]+D.len*Math.sin(80*Math.PI/180)} ${f2(D.hinge[1]-D.len*Math.cos(80*Math.PI/180))}`}
   stroke={RS.ink} strokeWidth={2.4} strokeDasharray="8 7" fill="none" opacity={.6}/>
  <path d={`M${D.hinge[0]} ${D.hinge[1]}L${f2(leaf[0])} ${f2(leaf[1])}`} stroke={RS.steelDark} strokeWidth={10} strokeLinecap="round"/>
  <circle cx={D.hinge[0]} cy={D.hinge[1]} r={7} fill={RS.ink}/>
 </g>;
};
const TableTop:React.FC<{r?:number;foods?:Food[]}>=({r=110,foods=['none','none']})=><g data-part="table-top">
 <circle cx={8} cy={10} r={r} fill="#1A1410" opacity={.18}/>
 <circle r={r} fill={RS.laminate} stroke={RS.ink} strokeWidth={4}/>
 <circle r={r-10} fill="none" stroke={RS.laminateEdge} strokeWidth={3}/>
 {foods.map((f,i)=>{const a=-.6+i*2.6,x=r*.5*Math.cos(a),y=r*.5*Math.sin(a);
  return <g key={i} transform={`translate(${f2(x)} ${f2(y)})`}><circle r={34} fill="#F8F4EA" stroke={RS.ink} strokeWidth={2.4}/>
   {f==='none'?<circle r={22} fill="none" stroke="#E2D9C6" strokeWidth={3}/>:<g><circle r={20} fill={f==='noodle'?'#D9A653':f==='rice'?'#F4EFE2':'#F1E3C4'} stroke={RS.ink} strokeWidth={1.4}/>
   <circle cx={-6} cy={-4} r={4} fill="#5E9A4A"/></g>}</g>;})}
 <g transform={`translate(${f2(-r*.55)} ${f2(-r*.2)}) rotate(-20)`}><rect x={-22} y={-30} width={44} height={60} rx={4} fill={RS.tile} stroke={RS.ink} strokeWidth={2}/><rect x={-14} y={-20} width={28} height={6} rx={3} fill={RS.paper} opacity={.8}/></g>
 <circle cx={-r*.15} cy={r*.55} r={14} fill={RS.glassTint} stroke={RS.ink} strokeWidth={2}/>
 <path d={`M${r*.2} ${-r*.2}L${r*.62} ${-r*.5}M${r*.24} ${-r*.14}L${r*.66} ${-r*.44}`} stroke={RS.woodDeep} strokeWidth={4} strokeLinecap="round"/>
</g>;
const ChairTop:React.FC<{}>=()=><g data-part="chair-top"><rect x={-34} y={-34} width={68} height={68} rx={14} fill={RS.wood} stroke={RS.ink} strokeWidth={3}/>
 <path d="M-34 -30Q0 -56 34 -30" stroke={RS.woodDeep} strokeWidth={10} fill="none" strokeLinecap="round"/></g>;
const GuestTop:React.FC<GuestLook&{raise?:number}>=({skin,hair,shirt,raise=0})=><g data-part="guest-top">
 <ellipse cx={0} cy={0} rx={56} ry={30} fill={shirt} stroke={RS.ink} strokeWidth={3}/>
 <path d={`M40 0L${f2(64+14*clamp(raise))} ${f2(34-80*clamp(raise))}`} stroke={shirt} strokeWidth={22} strokeLinecap="round"/>
 <circle cx={f2(64+14*clamp(raise))} cy={f2(34-80*clamp(raise))} r={11} fill={skin} stroke={RS.ink} strokeWidth={2}/>
 <path d="M-40 0L-56 34" stroke={shirt} strokeWidth={22} strokeLinecap="round"/><circle cx={-56} cy={36} r={11} fill={skin} stroke={RS.ink} strokeWidth={2}/>
 <circle cx={0} cy={-4} r={28} fill={hair} stroke={RS.ink} strokeWidth={3}/>
 <path d="M-12 -20q12 -6 22 2" stroke="#FFFFFF" strokeWidth={3} opacity={.25} fill="none"/>
</g>;
const StandTop:React.FC<{}>=()=><g data-part="stand-top"><rect x={-70} y={-46} width={140} height={92} rx={8} fill={RS.woodLit} stroke={RS.ink} strokeWidth={3}/>
 <path d="M-62 -38H50" stroke="#FFFFFF" strokeWidth={2} opacity={.3}/></g>;
const CounterTop:React.FC<{w:number;h:number}>=({w,h})=>{
 const id=useUid('rsct');
 return <g data-part="counter-top">
  <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={RS.steelLit}/><stop offset="1" stopColor={RS.steel}/></linearGradient></defs>
  <rect x={0} y={0} width={w} height={h} rx={8} fill={`url(#${id})`} stroke={RS.ink} strokeWidth={4}/>
  {Array.from({length:Math.floor(h/120)},(_,k)=><path key={k} d={`M14 ${60+k*120}q${w/3} 10 ${w-28} 0`} stroke="#FFFFFF" strokeWidth={2.4} opacity={.3} fill="none"/>)}
 </g>;
};
const Footprint:React.FC<{flip?:boolean}>=({flip=false})=><g data-part="footprint" transform={flip?'scale(1 -1)':undefined}>
 <ellipse cx={0} cy={0} rx={13} ry={8} fill={RS.inkSoft}/><ellipse cx={18} cy={-1} rx={6} ry={6} fill={RS.inkSoft}/></g>;

type Part=
 {part:'floor';y:number;vp?:number}|{part:'door';open:number;bell?:number;children?:React.ReactNode}|{part:'apronHook'}|{part:'apron'}|
 {part:'hostStand';children?:React.ReactNode}|{part:'deskPhone';ring:number;t:number}|{part:'orderPad';curl?:number;fy?:number}|
 {part:'table';w?:number;children?:React.ReactNode}|{part:'chair';flip?:boolean}|({part:'guest';layer:'body'|'arms';raise?:number;look?:number;menu?:boolean}&GuestLook)|
 {part:'plate';food?:Food}|{part:'waterGlass'}|{part:'menuTent'}|{part:'clock';r:number;minute:number;hour:number}|
 {part:'pendant';len:number;glow?:number}|{part:'signFrame';shine?:number}|{part:'hostPanel';lit:number;name:number;order?:number;t:number}|
 {part:'tag';lines:string[];size:number;swing?:number;tone?:'kraft'|'cream'|'slate'}|{part:'passShelf';w:number}|{part:'heatLamp';w:number;rod:number}|{part:'hood';w:number}|
 {part:'desk';y:number;depth?:number}|{part:'deskTop';x:number;y:number;w:number;h:number}|{part:'ledgerCard';mark?:number}|{part:'stampMark';p?:number}|
 {part:'stamp';top?:boolean}|{part:'receiptClip';open?:number;top?:boolean}|{part:'corkBoard';w:number;h:number}|
 {part:'ruleCard';box:number;lit:number;circle:number}|{part:'penHand';skin:string}|{part:'folder';open:number;q:number}|{part:'quoteCard'}|{part:'mug';top?:boolean}|
 {part:'roomPlan';door:number}|{part:'tableTop';r?:number;foods?:Food[]}|{part:'chairTop'}|({part:'guestTop';raise?:number}&GuestLook)|
 {part:'standTop'}|{part:'counterTop';w:number;h:number}|{part:'footprint';flip?:boolean};
export const RestaurantSupport:React.FC<Part>=(p)=>{
 switch(p.part){
 case 'floor':return <Floor y={p.y} vp={p.vp}/>;
 case 'door':return <Door open={p.open} bell={p.bell}>{p.children}</Door>;
 case 'apronHook':return <ApronHook/>;
 case 'apron':return <Apron/>;
 case 'hostStand':return <HostStand>{p.children}</HostStand>;
 case 'deskPhone':return <DeskPhone ring={p.ring} t={p.t}/>;
 case 'orderPad':return <OrderPad curl={p.curl} fy={p.fy}/>;
 case 'table':return <Table w={p.w}>{p.children}</Table>;
 case 'chair':return <Chair flip={p.flip}/>;
 case 'guest':{const {part:_p,...g}=p;return <Guest {...g}/>;}
 case 'plate':return <Plate food={p.food}/>;
 case 'waterGlass':return <WaterGlass/>;
 case 'menuTent':return <MenuTent/>;
 case 'clock':return <Clock r={p.r} minute={p.minute} hour={p.hour}/>;
 case 'pendant':return <Pendant len={p.len} glow={p.glow}/>;
 case 'signFrame':return <SignFrame shine={p.shine}/>;
 case 'hostPanel':return <HostPanel lit={p.lit} name={p.name} order={p.order} t={p.t}/>;
 case 'tag':return <Tag lines={p.lines} size={p.size} swing={p.swing} tone={p.tone}/>;
 case 'passShelf':return <PassShelf w={p.w}/>;
 case 'heatLamp':return <HeatLamp w={p.w} rod={p.rod}/>;
 case 'hood':return <Hood w={p.w}/>;
 case 'desk':return <Desk y={p.y} depth={p.depth}/>;
 case 'deskTop':return <DeskTop x={p.x} y={p.y} w={p.w} h={p.h}/>;
 case 'ledgerCard':return <LedgerCard mark={p.mark}/>;
 case 'stampMark':return <StampMark p={p.p}/>;
 case 'stamp':return <Stamp top={p.top}/>;
 case 'receiptClip':return <ReceiptClip open={p.open} top={p.top}/>;
 case 'corkBoard':return <CorkBoard w={p.w} h={p.h}/>;
 case 'ruleCard':return <RuleCard box={p.box} lit={p.lit} circle={p.circle}/>;
 case 'penHand':return <PenHand skin={p.skin}/>;
 case 'folder':return <Folder open={p.open} q={p.q}/>;
 case 'quoteCard':return <QuoteCard/>;
 case 'mug':return <Mug top={p.top}/>;
 case 'roomPlan':return <RoomPlan door={p.door}/>;
 case 'tableTop':return <TableTop r={p.r} foods={p.foods}/>;
 case 'chairTop':return <ChairTop/>;
 case 'guestTop':{const {part:_p,...g}=p;return <GuestTop {...g}/>;}
 case 'standTop':return <StandTop/>;
 case 'counterTop':return <CounterTop w={p.w} h={p.h}/>;
 case 'footprint':return <Footprint flip={p.flip}/>;
 }
};
