import React from 'react';
import {FONT} from '../../../lib/type';
import {useUid} from '../../../lib/uid';

/**
 * StudyRecordSupport, the fresh authored support group for the 2026-10-24 edition (room-clock-v1).
 *
 * The room's records, each drawn as a finished object on warm paper against the room's cool steel:
 *
 *  - s4  a hospital study card with worn corners whose solid teal suite line and dashed gray line for
 *        other Houston Methodist sites draw across it, the suite line climbing away after the cameras go
 *        on; the gap between them pours case tiles into a tray until it holds 25, and the counter reads
 *        about 25 more surgeries a month.
 *  - s5  the counter again, a round teal badge reading 7% rise stamped beside it, an axis labelled 95%
 *        confidence interval, and a whisker that draws from 8.3 to 41.0 with end caps and a unit tag.
 *  - s6  a placebo test over 11 units: a row of ten gray placebo bars rises, the teal suite bar joins as the
 *        eleventh, every bar the same height so no rank is asserted, and a crooked amber stamp lands across.
 *  - s7  a camera rollout tag, a card reading associated with the rollout, a dashed link to the counter
 *        and a solid arrow marked caused that is struck through.
 *  - s8  the rollout tag bundled by a kraft band with four workflow review notes; a camera company tag
 *        with an empty ownership ring, a Houston Methodist tag, and a minority slice with no number.
 *  - s9  a future work card that tags the turnover marker on a small copy of the room clock.
 *  - s10 the dashed blank box beside the turnover marker, which stays blank, and a small result card that
 *        carries the counter and the dashed associated link from the rollout tag into the closing picture.
 *  - a wall-mounted camera record panel whose rows the wall cameras stamp (B's s2 record, not a ledger).
 *  - a laminate records desk in the suite (a sanitizer pump on it) and a ruled ledger page for B's desk views.
 *
 * Every board is drawn in its own local units, 1000 wide and 900 tall, so the episode can lay it on the
 * desk, on the ledger or close up without changing what it shows. Every numeral printed here is one the
 * validated claims quote: 25, 7%, 95%, 8.3 and 41.0. No other number is drawn, and the ownership slice
 * carries no size. Amber here is only the stamp and (in the hero group) the text alert and camera lamps.
 *
 * Pure function of its props: no clock, no state, no random input.
 */

export type Pt=[number,number];
type Rect4=[number,number,number,number];
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
const f2=(v:number)=>v.toFixed(2);
const smooth=(p:number)=>{const q=clamp(p);return q*q*(3-2*q);};
const ease5=(p:number)=>{const x=clamp(p);return x*x*x*(10+x*(-15+6*x));};
const contactQ=(p:number)=>{const x=clamp(p);return x*x*x*(20+x*(-45+x*(36-10*x)));};

export const PAPER={paper:'#F1EEE4',paperLit:'#FBF9F2',paperShade:'#DCD6C6',edge:'#C2BBA8',ink:'#16242A',trim:'#33474D',
 soft:'#5D6B70',gray:'#8E9A9E',grayLight:'#C2CACC',teal:'#2A7C77',tealLit:'#3FA39C',tealPale:'#BFDCD8',amber:'#E0A21B',
 kraft:'#C29A64',kraftDeep:'#93703F',desk:'#A9A497',deskLit:'#C4BFB2',deskDeep:'#7E7A6F',shadow:'#13201F',rule:'#AFC6CB'};
const C=PAPER;
/** Board size in local units. */
export const BOARD={w:1000,h:900};

// ---- shared paper things ---------------------------------------------------------------------------------
/** A paper card with two worn corners, a soft shadow and a faint grain line. */
const Card:React.FC<{w:number;h:number;tone?:string;children?:React.ReactNode;lift?:number}>=({w,h,tone=C.paper,children,lift=0})=>{
 const id=useUid('srcard');
 return <g data-part="paper-card">
  <defs><linearGradient id={id+'g'} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={C.paperLit}/><stop offset=".6" stopColor={tone}/><stop offset="1" stopColor={C.paperShade}/></linearGradient></defs>
  <path d={`M${10+lift*14} ${14+lift*20}H${w+8+lift*14}V${h+12+lift*20}H${10+lift*14}Z`} fill={C.shadow} opacity={.18-.06*lift}/>
  <path d={`M0 10Q0 0 12 0H${w-18}L${w} 16V${h-10}Q${w} ${h} ${w-12} ${h}H18L0 ${h-14}Z`} fill={`url(#${id}g)`} stroke={C.ink} strokeWidth={2.6} strokeLinejoin="round"/>
  <path d={`M${w-18} 0L${w-16} 14L${w} 16`} fill="none" stroke={C.edge} strokeWidth={2}/>
  <path d={`M18 ${h}L16 ${h-12}L0 ${h-14}`} fill="none" stroke={C.edge} strokeWidth={2}/>
  <path d={`M${w*.12} ${h*.93}Q${w*.5} ${h*.9} ${w*.84} ${h*.94}`} stroke={C.edge} strokeWidth={1.4} opacity={.6} fill="none"/>
  {children}
 </g>;
};
const Txt:React.FC<{x:number;y:number;s:number;w?:number;fill?:string;anchor?:'start'|'middle'|'end';children:React.ReactNode;o?:number}>=
 ({x,y,s,w=800,fill=C.ink,anchor='start',children,o=1})=>
 <text x={f2(x)} y={f2(y)} fontFamily={FONT.body} fontSize={s} fontWeight={w} fill={fill} textAnchor={anchor} opacity={o}>{children}</text>;
/** A luggage tag with its eyelet at the left, lines of text and an optional glyph. */
const Tag:React.FC<{w:number;h:number;lines:string[];size:number;tone?:string;ink?:string;glyph?:React.ReactNode}>=({w,h,lines,size,tone=C.paper,ink=C.ink,glyph})=>{
 return <g data-part="tag">
  <path d={`M10 14H${w+8}V${h+14}H10L-12 ${h/2+14}Z`} fill={C.shadow} opacity={.16}/>
  <path d={`M28 0H${w}Q${w+4} 0 ${w+4} 6V${h-6}Q${w+4} ${h} ${w} ${h}H28L0 ${h/2}Z`} fill={tone} stroke={C.ink} strokeWidth={2.6} strokeLinejoin="round"/>
  <circle cx={30} cy={h/2} r={9} fill={C.paperShade} stroke={C.ink} strokeWidth={2.2}/>
  {glyph}
  {lines.map((l,i)=><Txt key={i} x={glyph?110:54} y={h/2-(lines.length-1)*size*.6+size*.36+i*size*1.2} s={size} fill={ink}>{l}</Txt>)}
 </g>;
};
/** The camera glyph used on tags: a small version of the hero's housing silhouette. */
const CamGlyph:React.FC<{x:number;y:number;s:number}>=({x,y,s})=><g transform={`translate(${x} ${y}) scale(${s})`}>
 <path d="M-14 -20Q-14 -29 -3 -29L56 -29Q86 -29 89 -1Q86 27 56 27L-3 27Q-14 27 -14 18Z" fill="#E6EEF0" stroke={C.ink} strokeWidth={4}/>
 <circle cx={80} cy={4} r={13} fill="#0D171C"/><rect x={2} y={-37} width={18} height={9} rx={4.5} fill={C.amber} stroke={C.ink} strokeWidth={2}/>
</g>;

// ---- the case tally --------------------------------------------------------------------------------------
/** The tray of case tiles. `fill` 0 to 1 brings in 25 tiles one at a time; `pitch` is the tile spacing. */
export function tileOrder(k:number){return {r:Math.floor(k/5),c:k%5};}
const Tally:React.FC<{fill:number;pitch:number;glow?:number}>=({fill,pitch,glow=0})=>{
 const id=useUid('srtally'),pad=pitch*.4,size=pitch*5+pad*2,t=pitch*.82;
 return <g data-part="case-tally">
  <defs><linearGradient id={id+'t'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.tealLit}/><stop offset="1" stopColor={C.teal}/></linearGradient></defs>
  {glow>0&&<rect x={-pad*1.6} y={-pad*1.6} width={size+pad*3.2} height={size+pad*3.2} rx={pitch*.6} fill={C.tealLit} opacity={.28*glow}/>}
  <rect x={6} y={10} width={size} height={size} rx={pitch*.35} fill={C.shadow} opacity={.15}/>
  <rect x={0} y={0} width={size} height={size} rx={pitch*.35} fill={C.paperShade} stroke={C.ink} strokeWidth={2.6}/>
  <rect x={pad*.5} y={pad*.5} width={size-pad} height={size-pad} rx={pitch*.25} fill="none" stroke={C.edge} strokeWidth={2} strokeDasharray="8 7"/>
  {Array.from({length:25},(_,k)=>{
   const {r,c}=tileOrder(k),at=k/25*.88,q=clamp((fill-at)/.12);
   if(q<=0)return null;
   const e=ease5(q),x=pad+c*pitch+(pitch-t)/2,y=pad+r*pitch+(pitch-t)/2-(1-e)*pitch*.6;
   return <g key={k} opacity={f2(clamp(q*2.5))}>
    <rect x={f2(x)} y={f2(y)} width={f2(t)} height={f2(t)} rx={t*.18} fill={`url(#${id}t)`} stroke={C.ink} strokeWidth={1.8}/>
    {/* a tiny table glyph: one case */}
    <path d={`M${f2(x+t*.2)} ${f2(y+t*.52)}H${f2(x+t*.8)}M${f2(x+t*.5)} ${f2(y+t*.52)}V${f2(y+t*.78)}`} stroke={C.paperLit} strokeWidth={Math.max(2,t*.08)} strokeLinecap="round"/>
    <ellipse cx={f2(x+t*.4)} cy={f2(y+t*.42)} rx={f2(t*.17)} ry={f2(t*.08)} fill={C.paperLit}/>
   </g>;})}
 </g>;
};
export const tallySize=(pitch:number)=>pitch*5+pitch*.8;
/** The counter's words. `num` 0 to 1 lands the number; before that its slot is a dashed blank. */
const CounterLabel:React.FC<{num:number;big:number;small:number;lines?:string[]}>=({num,big,small,lines=['more surgeries','a month']})=>{
 const q=clamp(num),w=big*2.9;
 return <g data-part="counter-label">
  {q<1&&<rect x={0} y={-big*.92} width={w} height={big*1.04} rx={12} fill="none" stroke={C.gray} strokeWidth={3} strokeDasharray="12 10" opacity={1-q}/>}
  {q>0&&<g transform={`translate(0 ${f2(-(1-contactQ(q))*big*.5)})`} opacity={f2(clamp(q*3))}>
   <Txt x={0} y={-big*.62} s={big*.34} w={800} fill={C.teal}>about</Txt>
   <Txt x={big*1.08} y={0} s={big} w={900} fill={C.teal}>25</Txt>
  </g>}
  {lines.map((l,i)=><Txt key={i} x={0} y={small*1.25*(i+1)+6} s={small} w={800}>{l}</Txt>)}
 </g>;
};

// ---- s4: the study card, its two lines and the tally ----------------------------------------------------
export const S4B={card:[20,20,960,500],chart:[80,180,760,470],roll:420,tray:[600,548],pitch:60,label:[230,744],
 focus:{card:[0,0,1000,540],lines:[40,180,1000,520],counter:[200,150,1000,900]}};
const COMPARE:Pt[]=[[80,380],[160,372],[240,384],[320,376],[420,378],[500,370],[580,374],[660,366],[760,370]];
const SUITE0:Pt[]=[[80,372],[160,365],[240,378],[320,368],[420,371],[500,368],[580,371],[660,364],[760,367]];
const CLIMB=[0,0,0,0,0,44,84,112,140];
/** The suite line's points for climb c (0 tracks the comparison, 1 has climbed away). Pure. */
export const suitePts=(c:number):Pt[]=>SUITE0.map((p,i)=>[p[0],p[1]-CLIMB[i]*clamp(c)]);
const linePath=(pts:Pt[])=>pts.map((p,i)=>(i?'L':'M')+f2(p[0])+' '+f2(p[1])).join('');
const S4Board:React.FC<{card:number;draw:number;climb:number;fill:number;num:number}>=({card,draw,climb,fill,num})=>{
 const id=useUid('srs4'),[cx,cy,cw,ch]=S4B.card,[x0,y0,x1,y1]=S4B.chart,d=clamp(draw),suite=suitePts(climb);
 const clipW=lerp(0,x1-x0+20,ease5(d));
 const se=suite[suite.length-1],ce=COMPARE[COMPARE.length-1];
 return <g data-part="s4-board">
  <defs><clipPath id={id+'c'}><rect x={x0-10} y={y0-60} width={f2(clipW)} height={y1-y0+120}/></clipPath></defs>
  {card>0&&<g data-item-part="study-card" opacity={f2(clamp(card*4))}>
   <g transform={`translate(${cx} ${cy})`}><Card w={cw} h={ch} lift={1-clamp(card)}>
    <Txt x={40} y={64} s={42}>Hospital study</Txt>
    <Txt x={420} y={62} s={26} w={700} fill={C.soft}>cases a month</Txt>
    <g transform="translate(676 26)" data-part="suite-legend">
     <rect x={0} y={0} width={110} height={62} rx={8} fill="#DCE5E6" stroke={C.ink} strokeWidth={2}/>
     <rect x={30} y={34} width={52} height={14} rx={4} fill="#6A8A94"/>
     {[[10,10],[98,10],[8,40],[100,42]].map(([x,y],k)=><circle key={k} cx={x} cy={y} r={6} fill={C.amber} stroke={C.ink} strokeWidth={1.4}/>)}
     <Txt x={124} y={30} s={26} fill={C.teal}>This suite</Txt>
     <path d="M126 46H240" stroke={C.teal} strokeWidth={8} strokeLinecap="round"/>
    </g>
   </Card></g>
   {/* chart frame, gridlines and the rollout marker */}
   {[0,1,2].map(k=><path key={k} d={`M${x0} ${y0+60+k*100}H${x1}`} stroke={C.grayLight} strokeWidth={2}/>)}
   <path d={`M${x0} ${y1}H${x1}`} stroke={C.trim} strokeWidth={3}/>
   <path d={`M${S4B.roll} ${y0-6}V${y1}`} stroke={C.soft} strokeWidth={3} strokeDasharray="10 9"/>
   <rect x={S4B.roll-6} y={y0-46} width={196} height={38} rx={10} fill={C.trim}/>
   <CamGlyph x={S4B.roll+14} y={y0-28} s={.26}/>
   <Txt x={S4B.roll+46} y={y0-19} s={24} fill={C.paper}>Cameras on</Txt>
  </g>}
  {d>0&&<g clipPath={`url(#${id}c)`}>
   {climb>0&&<path d={linePath(suite.slice(4))+linePath(COMPARE.slice(4).reverse()).replace('M','L')+'Z'} fill={C.tealPale} opacity={.75*clamp(climb)}/>}
   <path d={linePath(COMPARE)} stroke={C.gray} strokeWidth={8} fill="none" strokeDasharray="18 12" strokeLinecap="round"/>
   <path d={linePath(suite)} stroke={C.teal} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
   <circle cx={se[0]} cy={f2(se[1])} r={11} fill={C.teal} stroke={C.ink} strokeWidth={2}/>
  </g>}
  {d>.85&&<g opacity={f2(clamp((d-.85)*7))}>
   <CamGlyph x={x1+18} y={se[1]-6} s={.24}/>
   <Txt x={x1+48} y={se[1]+4} s={30} fill={C.teal}>This suite</Txt>
   <Txt x={x1+18} y={ce[1]+30} s={24} w={800} fill={C.soft}>Other Houston</Txt>
   <Txt x={x1+18} y={ce[1]+58} s={24} w={800} fill={C.soft}>Methodist sites</Txt>
  </g>}
  {/* the tray and its counter words, empty until the gap pours tiles into it */}
  <g transform={`translate(${S4B.tray[0]} ${S4B.tray[1]})`}><Tally fill={fill} pitch={S4B.pitch}/></g>
  {fill>0&&fill<1&&<path d={`M${x1-30} ${f2((se[1]+ce[1])/2)}Q${x1+40} ${S4B.tray[1]-60} ${S4B.tray[0]+180} ${S4B.tray[1]-8}`} stroke={C.teal} strokeWidth={4} strokeDasharray="10 9" fill="none" opacity={f2(Math.sin(Math.PI*fill))}/>}
  <g transform={`translate(${S4B.label[0]} ${S4B.label[1]})`}><CounterLabel num={num} big={124} small={40}/></g>
 </g>;
};

// ---- s5: the badge, the axis and the interval whisker --------------------------------------------------
export const S5B={tray:[40,40],pitch:44,label:[330,170],badge:[836,160],axisY:640,x0:80,x1:920,
 focus:{badge:[0,0,1000,360],axis:[20,20,1000,820],whisker:[150,480,1000,880]}};
/** Interval value to axis x: the axis spans 0 to 50 cases a month without printing either end. Pure. */
export const axisX=(v:number)=>S5B.x0+(v/50)*(S5B.x1-S5B.x0);
const S5Board:React.FC<{badge:number;glow:number;axis:number;whisker:number;cap:number}>=({badge,glow,axis,whisker,cap})=>{
 const id=useUid('srs5'),Y=S5B.axisY,a=ease5(axis),xl=axisX(8.3),xr=axisX(41),xm=axisX(25),w=clamp(whisker),xw=lerp(xl,xr,w);
 const b=clamp(badge),bs=lerp(1.35,1,contactQ(b)),c=clamp(cap);
 return <g data-part="s5-board">
  <defs><radialGradient id={id+'b'} cx=".4" cy=".35"><stop offset="0" stopColor={C.tealLit}/><stop offset="1" stopColor={C.teal}/></radialGradient></defs>
  <g transform={`translate(${S5B.tray[0]} ${S5B.tray[1]})`}><Tally fill={1} pitch={S5B.pitch} glow={glow}/></g>
  <g transform={`translate(${S5B.label[0]} ${S5B.label[1]})`}><CounterLabel num={1} big={96} small={32}/></g>
  {b>0&&<g transform={`translate(${S5B.badge[0]} ${S5B.badge[1]}) scale(${f2(bs)}) rotate(${f2(-8+4*b)})`} opacity={f2(clamp(b*3))} data-part="percent-badge">
   <circle cx={6} cy={10} r={118} fill={C.shadow} opacity={.2*b}/>
   <circle cx={0} cy={0} r={118} fill={`url(#${id}b)`} stroke={C.ink} strokeWidth={3}/>
   <circle cx={0} cy={0} r={100} fill="none" stroke={C.paper} strokeWidth={3} strokeDasharray="6 7" opacity={.8}/>
   <Txt x={0} y={20} s={88} w={900} fill={C.paperLit} anchor="middle">7%</Txt>
   <Txt x={0} y={62} s={34} w={800} fill={C.paperLit} anchor="middle">rise</Txt>
  </g>}
  {a>0&&<g data-part="interval-axis">
   <Txt x={axisX(8.3)-30} y={Y-74} s={38} o={clamp(a*2)}>95% confidence interval</Txt>
   <path d={`M${S5B.x0} ${Y}H${f2(lerp(S5B.x0,S5B.x1,a))}`} stroke={C.trim} strokeWidth={5} strokeLinecap="round"/>
   {Array.from({length:11},(_,k)=>{const x=S5B.x0+k*(S5B.x1-S5B.x0)/10;return x<=lerp(S5B.x0,S5B.x1,a)+1?<path key={k} d={`M${f2(x)} ${Y-10}V${Y+10}`} stroke={C.trim} strokeWidth={3}/>:null;})}
  </g>}
  {w>0&&<g data-part="interval-whisker">
   <path d={`M${f2(xl)} ${Y}H${f2(xw)}`} stroke={C.teal} strokeWidth={14} strokeLinecap="round"/>
   <path d={`M${f2(xl)} ${Y-40}V${Y+40}`} stroke={C.teal} strokeWidth={10} strokeLinecap="round"/>
   <Txt x={xl} y={Y+92} s={44} w={900} fill={C.teal} anchor="middle">8.3</Txt>
   {xw>=xm&&<circle cx={f2(xm)} cy={Y} r={17} fill={C.paperLit} stroke={C.teal} strokeWidth={6}/>}
  </g>}
  {c>0&&<g opacity={f2(clamp(c*3))}>
   <path d={`M${f2(xr)} ${f2(Y-40-60*(1-contactQ(c)))}V${f2(Y+40-60*(1-contactQ(c)))}`} stroke={C.teal} strokeWidth={10} strokeLinecap="round"/>
   <Txt x={xr} y={Y+92} s={44} w={900} fill={C.teal} anchor="middle">41.0</Txt>
   <g transform={`translate(${f2(xm-150)} ${f2(Y+130-30*(1-contactQ(c)))})`}>
    <rect x={6} y={8} width={300} height={64} rx={14} fill={C.shadow} opacity={.15}/>
    <rect x={0} y={0} width={300} height={64} rx={14} fill={C.paperLit} stroke={C.ink} strokeWidth={2.6}/>
    <Txt x={150} y={44} s={36} anchor="middle">cases a month</Txt>
   </g>
  </g>}
 </g>;
};

// ---- s6: the placebo test and its stamp -------------------------------------------------------------------
/** The placebo test as eleven unit tokens, one for each unit the test tried: ten gray placebo units and the teal
 * suite unit. Tokens carry no height or size, so the row pictures neither a rank nor an equality; the stamp is
 * the only verdict on it. */
export const S6B={row:600,x0:70,step:70,tok:58,units:10,stamp:[490,470] as Pt,focus:{row:[0,0,1000,820],stamp:[130,300,880,740]}};
/** One unit token: a rounded tile with a small site glyph (a block of windows), never two exactly alike. */
const UnitToken:React.FC<{x:number;y:number;s:number;fill:string;ink?:string;k:number}>=({x,y,s,fill,ink=C.ink,k})=>{
 const tilt=[-2,1.5,-1,2,-1.5,1,-2.5,1.8,-.8,1.2,0][k%11];
 return <g transform={`translate(${f2(x)} ${f2(y)}) rotate(${tilt})`}>
  <rect x={-s/2+4} y={-s/2+5} width={s} height={s} rx={12} fill={C.shadow} opacity={.13}/>
  <rect x={-s/2} y={-s/2} width={s} height={s} rx={12} fill={fill} stroke={ink} strokeWidth={2.4}/>
  <rect x={-s*.24} y={-s*.24} width={s*.48} height={s*.5} rx={3} fill="none" stroke={ink} strokeWidth={2} opacity={.55}/>
  {[0,1].map(r=>[0,1].map(c=><rect key={r*2+c} x={f2(-s*.17+c*s*.2)} y={f2(-s*.16+r*s*.2)} width={f2(s*.12)} height={f2(s*.12)} fill={ink} opacity={.4}/>))}
 </g>;
};
const S6Board:React.FC<{rise:number;suite:number;stamp:number;press:number;away:number}>=({rise,suite,stamp,press,away})=>{
 const B=S6B,s=ease5(suite),sx=B.x0+B.units*B.step+10;
 return <g data-part="s6-board">
  <Txt x={40} y={84} s={44}>Placebo test</Txt>
  {/* ten placebo units drop into the row one after another */}
  {Array.from({length:B.units},(_,k)=>{const r=ease5(clamp((rise-k*.05)/.5));
   return r>0?<g key={k} opacity={f2(clamp(r*2))}><UnitToken x={B.x0+k*B.step+B.tok/2} y={B.row-70*(1-r)} s={B.tok} fill={C.grayLight} k={k}/></g>:null;})}
  {rise>.3&&<g opacity={f2(clamp((rise-.3)*2))}>
   <path d={`M${B.x0} ${B.row+44}V${B.row+56}H${B.x0+(B.units-1)*B.step+B.tok}V${B.row+44}`} stroke={C.soft} strokeWidth={3} fill="none"/>
   <Txt x={B.x0+((B.units-1)*B.step+B.tok)/2} y={B.row+98} s={30} w={800} fill={C.soft} anchor="middle">Placebo runs</Txt>
  </g>}
  {/* the suite joins as the eleventh unit, marked in teal and ringed */}
  {s>0&&<g transform={`translate(${f2(220*(1-s))} 0)`} opacity={f2(clamp(s*3))} data-part="suite-unit">
   <circle cx={sx+B.tok/2} cy={B.row} r={B.tok*.78} fill="none" stroke={C.teal} strokeWidth={4} strokeDasharray="10 7"/>
   <UnitToken x={sx+B.tok/2} y={B.row} s={B.tok} fill={C.teal} k={10}/>
   <Txt x={sx+B.tok/2} y={B.row+98} s={30} fill={C.teal} anchor="middle">Suite</Txt>
  </g>}
  {stamp>0&&<RubberStamp at={B.stamp} lines={['SHORT OF','CONVENTIONAL SIGNIFICANCE']} w={640} h={160} rot={-7} inked={stamp} press={press} away={away}/>}
 </g>;
};
/** A rubber stamp mark (amber ink, crooked) and the stamp block that presses it. `press` is the block's
 * descent (1 down), `inked` reveals the mark once the block is down, `away` lifts the block clear. */
const RubberStamp:React.FC<{at:Pt;lines:string[];w:number;h:number;rot:number;inked:number;press:number;away:number}>=({at,lines,w,h,rot,inked,press,away})=>{
 const p=clamp(press),a=clamp(away),lift=(1-p)*140+a*420;
 return <g transform={`translate(${at[0]} ${at[1]}) rotate(${rot})`} data-part="rubber-stamp">
  {inked>0&&<g opacity={f2(.92*clamp(inked))}>
   <rect x={-w/2} y={-h/2} width={w} height={h} rx={14} fill={C.paperLit} opacity={.78}/>
   <rect x={-w/2} y={-h/2} width={w} height={h} rx={14} fill="none" stroke={C.amber} strokeWidth={10}/>
   <rect x={-w/2+14} y={-h/2+14} width={w-28} height={h-28} rx={8} fill="none" stroke={C.amber} strokeWidth={3}/>
   {lines.map((l,i)=><Txt key={i} x={0} y={-h/2+h*(i+1)/(lines.length+1)+h*.12} s={i?h*.24:h*.27} w={900} fill="#B07A0C" anchor="middle">{l}</Txt>)}
   <path d={`M${-w*.3} ${h*.36}h${w*.08}M${w*.18} ${-h*.38}h${w*.06}`} stroke={C.paperLit} strokeWidth={4} opacity={.8}/>
  </g>}
  {a<1&&<g transform={`translate(${f2(a*120)} ${f2(-lift)})`} opacity={f2(1-a)}>
   <rect x={-w/2-8+16} y={-h/2-8+24+lift*.25} width={w+16} height={h+16} rx={18} fill={C.shadow} opacity={.2*(1-a)}/>
   <rect x={-w/2-8} y={-h/2-8} width={w+16} height={h+16} rx={18} fill="#5E4A33" stroke={C.ink} strokeWidth={3}/>
   <rect x={-w/2+6} y={-h/2+6} width={w-12} height={h*.34} rx={12} fill="#7A6247"/>
   <rect x={-70} y={-h/2-60} width={140} height={64} rx={24} fill="#3F3124" stroke={C.ink} strokeWidth={3}/>
   <ellipse cx={0} cy={-h/2-60} rx={60} ry={18} fill="#58463A" stroke={C.ink} strokeWidth={2.6}/>
  </g>}
 </g>;
};

// ---- s7: associated, not caused --------------------------------------------------------------------------
export const S7B={tag:[50,420,320,150],card:[50,50,560,210],tray:[790,360],pitch:36,link:[[390,495],[778,470]] as [Pt,Pt],
 arrow:[[390,690],[778,640]] as [Pt,Pt],focus:{card:[0,30,700,600],link:[0,30,1000,800],strike:[380,380,1000,820]}};
const S7Board:React.FC<{card:number;link:number;arrow:number;strike:number}>=({card,link,arrow,strike})=>{
 const B=S7B,[tx,ty,tw,th]=B.tag,[cx,cy,cw,ch]=B.card,k=ease5(card),l=clamp(link),ar=clamp(arrow),st=clamp(strike);
 const [a0,a1]=B.arrow,ax=lerp(a0[0],a1[0],ar),ay=lerp(a0[1],a1[1],ar),[l0,l1]=B.link;
 const ang=Math.atan2(a1[1]-a0[1],a1[0]-a0[0])*180/Math.PI;
 return <g data-part="s7-board">
  <g transform={`translate(${tx} ${ty})`}><Tag w={tw} h={th} lines={['Camera','rollout']} size={42} glyph={<CamGlyph x={52} y={th/2+6} s={.4}/>}/></g>
  <g transform={`translate(${B.tray[0]} ${B.tray[1]})`}><Tally fill={1} pitch={B.pitch}/></g>
  <Txt x={B.tray[0]+4} y={B.tray[1]+tallySize(B.pitch)+40} s={26} fill={C.teal}>about 25 more</Txt>
  <Txt x={B.tray[0]+4} y={B.tray[1]+tallySize(B.pitch)+72} s={26}>a month</Txt>
  {k>0&&<g transform={`translate(${f2(cx-260*(1-k))} ${f2(cy)}) rotate(${f2(-2*(1-k)-1)})`} opacity={f2(clamp(k*3))}>
   <Card w={cw} h={ch} lift={1-k}>
    <Txt x={34} y={86} s={50}>Associated with</Txt>
    <Txt x={34} y={150} s={50}>the rollout</Txt>
    <rect x={cw-110} y={22} width={84} height={34} rx={8} fill={C.trim}/>
    <Txt x={cw-68} y={46} s={20} fill={C.paper} anchor="middle">Authors</Txt>
   </Card></g>}
  {l>0&&<g data-part="dashed-link">
   <path d={`M${l0[0]} ${l0[1]}L${f2(lerp(l0[0],l1[0],l))} ${f2(lerp(l0[1],l1[1],l))}`} stroke={C.teal} strokeWidth={8} strokeDasharray="20 14" strokeLinecap="round"/>
   {l>.9&&<circle cx={l1[0]} cy={l1[1]} r={10} fill={C.teal}/>}
   <Txt x={(l0[0]+l1[0])/2} y={(l0[1]+l1[1])/2-22} s={30} fill={C.teal} anchor="middle" o={clamp((l-.5)*3)}>associated</Txt>
  </g>}
  {ar>0&&<g data-part="caused-arrow" opacity={f2(1-.5*st)}>
   <path d={`M${a0[0]} ${a0[1]}L${f2(ax)} ${f2(ay)}`} stroke={C.ink} strokeWidth={9} strokeLinecap="round"/>
   <g transform={`translate(${f2(ax)} ${f2(ay)}) rotate(${f2(ang)})`}><path d="M-6 -20L22 0L-6 20Z" fill={C.ink}/></g>
   <Txt x={(a0[0]+a1[0])/2-20} y={(a0[1]+a1[1])/2-30} s={38} w={900} anchor="middle" o={clamp(ar*2-.4)}>caused</Txt>
  </g>}
  {st>0&&<g data-part="strike">
   <path d={`M470 762L${f2(lerp(470,690,st))} ${f2(lerp(762,600,st))}`} stroke={C.ink} strokeWidth={14} strokeLinecap="round"/>
   <path d={`M475 754L${f2(lerp(475,692,st))} ${f2(lerp(754,594,st))}`} stroke={C.paperLit} strokeWidth={3} strokeLinecap="round" opacity={.5}/>
  </g>}
 </g>;
};

// ---- s8: the bundle and the stake -------------------------------------------------------------------------
export const S8B={loop:[10,128,616,600] as Rect4,tag:[30,370,250,130],notes:[290,190],note:[300,84],ring:[790,520],ringR:140,company:[580,120,380,130],hospital:[560,760,400,96],
 slice:[-160,-96],focus:{bundle:[0,110,640,680],band:[0,110,640,680],stake:[0,80,1000,880],slice:[480,280,1000,880]}};
export const NOTES=['Turnover review','Housekeeping review','Anesthesia review','Surgeon notices'];
/** `only` 'stake' leaves the bundle (notes, tag and band) out of a stake close-up, whose frame starts right of them. */
const S8Board:React.FC<{tag:number;band:number;stake:number;slice:number;only?:'stake'}>=({tag,band,stake,slice,only})=>{
 const B=S8B,[tx,ty,tw,th]=B.tag,t=ease5(tag),b=clamp(band),s=ease5(stake),sl=clamp(slice);
 const [rx,ry]=B.ring,R=B.ringR,[a0,a1]=B.slice;
 const arc=(from:number,to:number,r:number)=>{const p=(a:number)=>[rx+r*Math.cos(a*Math.PI/180),ry+r*Math.sin(a*Math.PI/180)];
  const [x0,y0]=p(from),[x1,y1]=p(to);return `M${f2(x0)} ${f2(y0)}A${r} ${r} 0 ${to-from>180?1:0} 1 ${f2(x1)} ${f2(y1)}`;};
 const mid=(a0+a1)/2*Math.PI/180,sp:Pt=[rx+R*Math.cos(mid),ry+R*Math.sin(mid)];
 const [hx,hy,hw,hh]=B.hospital,[kx,ky,kw,kh]=B.company;
 return <g data-part="s8-board">
  {only!=='stake'&&<g data-part="bundle-group">
  {/* the workflow review notes, a short stack, each a touch off square */}
  <Txt x={B.notes[0]} y={B.notes[1]-24} s={30} w={800} fill={C.soft}>Workflow changes</Txt>
  {NOTES.map((n,k)=><g key={k} transform={`translate(${B.notes[0]+(k%2?8:-4)} ${B.notes[1]+k*(B.note[1]+16)}) rotate(${[-1.5,1,-.6,1.8][k]})`}>
   <rect x={5} y={7} width={B.note[0]} height={B.note[1]} rx={8} fill={C.shadow} opacity={.14}/>
   <rect x={0} y={0} width={B.note[0]} height={B.note[1]} rx={8} fill={k%2?C.paperLit:C.paper} stroke={C.ink} strokeWidth={2.2}/>
   <rect x={0} y={0} width={10} height={B.note[1]} rx={4} fill={C.trim} opacity={.7}/>
   <Txt x={24} y={B.note[1]/2+10} s={k===1?25:27} w={800}>{n}</Txt>
  </g>)}
  {t>0&&<g transform={`translate(${f2(tx-320*(1-t))} ${ty})`} opacity={f2(clamp(t*3))}><Tag w={tw} h={th} lines={['Camera','rollout']} size={36} glyph={<CamGlyph x={50} y={th/2+6} s={.36}/>}/></g>}
  {b>0&&<g data-part="bundle-band">
   {/* a kraft strap wraps the whole stack, the rollout tag and the four notes, round its edge, so it hides no
       label; its Bundled tab hangs from the strap's lower edge */}
   {(()=>{const [x0,y0,x1,y1]=B.loop,per=2*((x1-x0)+(y1-y0)),d=ease5(b);
    const path=`M${(x0+x1)/2} ${y1}H${x0+18}Q${x0} ${y1} ${x0} ${y1-18}V${y0+18}Q${x0} ${y0} ${x0+18} ${y0}H${x1-18}Q${x1} ${y0} ${x1} ${y0+18}V${y1-18}Q${x1} ${y1} ${x1-18} ${y1}Z`;
    return <g>
     <path d={path} fill="none" stroke={C.ink} strokeWidth={22} strokeDasharray={`${f2(per*d)} ${f2(per)}`} strokeLinejoin="round"/>
     <path d={path} fill="none" stroke={C.kraft} strokeWidth={17} strokeDasharray={`${f2(per*d)} ${f2(per)}`} strokeLinejoin="round"/>
     <path d={path} fill="none" stroke={C.kraftDeep} strokeWidth={2} strokeDasharray={`${f2(per*d)} ${f2(per)}`} opacity={.6}/>
     {b>.9&&<g opacity={f2(clamp((b-.9)*10))} transform={`translate(${(x0+x1)/2} ${y1}) rotate(-1.5)`}>
      <rect x={-92} y={-6} width={184} height={58} rx={10} fill={C.kraft} stroke={C.ink} strokeWidth={2.6}/>
      <Txt x={0} y={36} s={36} w={900} fill={C.ink} anchor="middle">Bundled</Txt></g>}
    </g>;})()}
  </g>}
  </g>}
  {s>0&&<g opacity={f2(clamp(s*2))} data-part="stake">
   <g transform={`translate(${kx} ${f2(ky-40*(1-s))})`}><Tag w={kw} h={kh} lines={['Camera company','Apella Technology']} size={32} glyph={<CamGlyph x={52} y={kh/2+6} s={.36}/>}/></g>
   <path d={`M${kx+kw*.6} ${ky+kh}L${rx} ${ry-R-24}`} stroke={C.soft} strokeWidth={3}/>
   <circle cx={rx+6} cy={ry+10} r={R+30} fill={C.shadow} opacity={.12}/>
   <circle cx={rx} cy={ry} r={R} fill="none" stroke={C.grayLight} strokeWidth={56}/>
   <circle cx={rx} cy={ry} r={R+28} fill="none" stroke={C.ink} strokeWidth={2.4}/>
   <circle cx={rx} cy={ry} r={R-28} fill={C.paperLit} stroke={C.ink} strokeWidth={2.4}/>
   <Txt x={rx} y={ry-8} s={28} w={800} fill={C.soft} anchor="middle">Owners</Txt>
   <Txt x={rx} y={ry+28} s={24} w={700} fill={C.soft} anchor="middle">of the company</Txt>
   <g transform={`translate(${hx} ${f2(hy+40*(1-s))})`}><Tag w={hw} h={hh} lines={['Houston Methodist']} size={34} tone={C.tealPale}/></g>
  </g>}
  {sl>0&&<g data-part="stake-slice">
   <path d={arc(a0,lerp(a0,a1,ease5(sl)),R)} stroke={C.teal} strokeWidth={56} fill="none"/>
   <path d={arc(a0,lerp(a0,a1,ease5(sl)),R+22)} stroke={C.tealLit} strokeWidth={4} fill="none" opacity={.8}/>
   <path d={`M${hx+60} ${hy}Q${f2(sp[0]-160)} ${f2(sp[1]+150)} ${f2(sp[0]-30)} ${f2(sp[1]+24)}`} stroke={C.teal} strokeWidth={5} fill="none" strokeDasharray="12 9" opacity={f2(clamp(sl*2-.4))}/>
   <g opacity={f2(clamp(sl*2.2-1.1))} transform={`translate(${f2(sp[0]-200)} ${f2(sp[1]-110)})`}>
    <rect x={0} y={0} width={240} height={56} rx={12} fill={C.teal} stroke={C.ink} strokeWidth={2.4}/>
    <Txt x={120} y={39} s={30} fill={C.paperLit} anchor="middle">Minority stake</Txt>
   </g>
  </g>}
 </g>;
};

// ---- s9: future work tags the turnover marker ---------------------------------------------------------------
export const S9B={card:[40,150,440,360],line:[470,330] as Pt,clock:[730,430],clockR:170,focus:{card:[0,100,1000,680],marker:[470,160,1000,720]}};
const S9Board:React.FC<{card:number;tagged:number;clock:React.ReactNode;marker:Pt}>=({card,tagged,clock,marker})=>{
 const B=S9B,[cx,cy,cw,ch]=B.card,k=ease5(card),g=clamp(tagged),[l0x,l0y]=B.line;
 const end:Pt=[lerp(l0x,marker[0],ease5(g)),lerp(l0y,marker[1],ease5(g))];
 return <g data-part="s9-board">
  {clock}
  {k>0&&<g transform={`translate(${cx} ${f2(cy-120*(1-contactQ(k)))}) rotate(${f2(-3+2*k)})`} opacity={f2(clamp(k*3))}>
   <Card w={cw} h={ch} lift={1-k}>
    <Txt x={30} y={66} s={44}>Future work</Txt>
    <path d="M30 92H400" stroke={C.edge} strokeWidth={2}/>
    <rect x={22} y={124} width={330} height={52} rx={10} fill={C.tealPale} opacity={.9}/>
    <Txt x={34} y={162} s={34}>Turnover time</Txt>
    <Txt x={34} y={232} s={26} w={700} fill={C.soft}>First case start times</Txt>
    <Txt x={34} y={284} s={26} w={700} fill={C.soft}>Other specialties</Txt>
   </Card></g>}
  {g>0&&<g data-part="future-tag">
   <path d={`M${l0x} ${l0y}Q${f2((l0x+end[0])/2)} ${f2(Math.max(l0y,end[1])+60)} ${f2(end[0])} ${f2(end[1])}`} stroke={C.teal} strokeWidth={5} fill="none" strokeDasharray="12 9"/>
   <circle cx={l0x} cy={l0y} r={8} fill={C.teal}/>
   {g>.85&&<circle cx={f2(end[0])} cy={f2(end[1])} r={13} fill="none" stroke={C.teal} strokeWidth={5} opacity={f2(clamp((g-.85)*7))}/>}
  </g>}
 </g>;
};

// ---- s10: the blank box ---------------------------------------------------------------------------------
export const BLANK={w:380,h:250};
/** The dashed blank box with its question above it. `draw` traces the dashed outline round; it stays empty. */
const BlankBox:React.FC<{draw:number;pulse?:number;size?:number}>=({draw,pulse=0,size=1})=>{
 const id=useUid('srblank'),w=BLANK.w*size,h=BLANK.h*size,per=2*(w+h),d=ease5(draw);
 return <g data-part="blank-box">
  <defs><linearGradient id={id+'g'} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={C.paperLit}/><stop offset="1" stopColor={C.paperShade}/></linearGradient></defs>
  {d>0&&<>
   <rect x={6} y={8} width={w} height={h} rx={16} fill={C.shadow} opacity={.12*d}/>
   <rect x={0} y={0} width={w} height={h} rx={16} fill={`url(#${id}g)`} opacity={.92*clamp(d*1.5)}/>
   <Txt x={0} y={-62*size} s={34*size} o={clamp(d*2-.3)}>Did the rollout</Txt>
   <Txt x={0} y={-20*size} s={34*size} o={clamp(d*2-.3)}>speed up turnover?</Txt>
  </>}
  <rect x={0} y={0} width={w} height={h} rx={16} fill="none" stroke={C.trim} strokeWidth={5*size} strokeDasharray={`${f2(per*d)} ${f2(per)}`}/>
  {d>=1&&<rect x={0} y={0} width={w} height={h} rx={16} fill="none" stroke={C.trim} strokeWidth={5*size} strokeDasharray="22 16"/>}
  {pulse>0&&<rect x={-8} y={-8} width={w+16} height={h+16} rx={20} fill="none" stroke={C.tealLit} strokeWidth={4} opacity={.5*Math.sin(Math.PI*clamp(pulse))}/>}
 </g>;
};

// ---- B's wall record panel ---------------------------------------------------------------------------------------
/** A steel-framed record panel mounted on the suite wall, w by h from the origin, its rows stamped by the wall
 * cameras (the episode draws the pulses). It is a fixed board, not paper, so nothing reads as hand kept. */
export const PANEL={title:56,row:150};
const RecordPanel:React.FC<{w:number;h:number;rows:{label:string;stamp:number;active:number}[];title?:string}>=({w,h,rows,title='Room clock record'})=>{
 const id=useUid('srpanel');
 return <g data-part="record-panel">
  <defs><linearGradient id={id+'g'} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E3EAEA"/><stop offset="1" stopColor="#C3CFD0"/></linearGradient></defs>
  <rect x={10} y={14} width={w} height={h} rx={14} fill={C.shadow} opacity={.2}/>
  <rect x={0} y={0} width={w} height={h} rx={14} fill="#8E9A9E" stroke={C.ink} strokeWidth={3}/>
  <rect x={12} y={12} width={w-24} height={h-24} rx={8} fill={`url(#${id}g)`} stroke={C.ink} strokeWidth={2}/>
  {[[22,22],[w-22,22],[22,h-22],[w-22,h-22]].map(([x,y],k)=><circle key={k} cx={x} cy={y} r={5} fill="#5D6970"/>)}
  <rect x={12} y={12} width={w-24} height={PANEL.title} rx={8} fill={C.trim}/>
  <Txt x={34} y={12+PANEL.title*.68} s={30} fill={C.paperLit}>{title}</Txt>
  {rows.map((r,k)=>{const y=12+PANEL.title+12+k*PANEL.row,on=clamp(r.stamp),act=clamp(r.active);
   return <g key={k}>
    {act>0&&<rect x={20} y={y} width={w-40} height={PANEL.row-14} rx={10} fill="#D6EBE8" opacity={f2(act)}/>}
    <path d={`M24 ${y+PANEL.row-8}H${w-24}`} stroke="#9FB0B3" strokeWidth={2}/>
    <Txt x={w*.42} y={y+PANEL.row*.56} s={42} fill={on>0?C.ink:'#93A0A3'}>{r.label}</Txt>
    <circle cx={w-70} cy={y+PANEL.row*.42} r={26} fill="none" stroke="#93A0A3" strokeWidth={3} strokeDasharray="6 6"/>
    {on>0&&<g transform={`translate(${w-70} ${f2(y+PANEL.row*.42-(1-contactQ(on))*60)})`} opacity={f2(clamp(on*3))}>
     <path d="M-15 -36L15 -36L8 18L-8 18Z" fill={C.teal} stroke={C.ink} strokeWidth={3}/></g>}
   </g>;})}
 </g>;
};
/** The closing result card: the camera rollout tag, a dashed link marked associated, and the counter's tray of
 * 25 cases with about 25 more a month. `link` draws the dashed link. */
export const RESULT={w:560,h:250};
const ResultCard:React.FC<{link:number}>=({link})=>{
 const l=clamp(link),x0=196,x1=318;
 return <g data-part="result-card">
  <Card w={RESULT.w} h={RESULT.h}>
   <g transform="translate(18 60)"><Tag w={170} h={96} lines={['Camera','rollout']} size={26}/></g>
   <path d={`M${x0} 108L${f2(lerp(x0,x1,ease5(l)))} 108`} stroke={C.teal} strokeWidth={6} strokeDasharray="14 10" strokeLinecap="round"/>
   <Txt x={(x0+x1)/2} y={92} s={22} fill={C.teal} anchor="middle" o={clamp(l*2)}>associated</Txt>
   <g transform="translate(330 22)"><Tally fill={1} pitch={24}/></g>
   <Txt x={330} y={196} s={26} fill={C.teal}>about 25 more</Txt>
   <Txt x={330} y={228} s={26}>a month</Txt>
  </Card>
 </g>;
};

// ---- the settings: the desk in the room, and the ledger page -------------------------------------------------
/** The laminate desk top from its back edge at row y to the frame's bottom, a scuffed front corner, a mug and
 * a pen, never placed symmetrically. */
const Desk:React.FC<{y:number;mug?:Pt;pen?:Pt}>=({y,mug,pen})=>{
 const id=useUid('srdesk');
 return <g data-part="desk">
  <defs><linearGradient id={id+'g'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.deskLit}/><stop offset="1" stopColor={C.desk}/></linearGradient></defs>
  <path d={`M-30 ${y}H1110V1960H-30Z`} fill={`url(#${id}g)`}/>
  <path d={`M-30 ${y}H1110`} stroke={C.ink} strokeWidth={3}/>
  <path d={`M-30 ${y+6}H1110`} stroke="#FFFFFF" strokeWidth={3} opacity={.4}/>
  {[.2,.5,.8].map((u,k)=><path key={k} d={`M-30 ${f2(y+(1960-y)*u*u)}Q540 ${f2(y+(1960-y)*u*u-6)} 1110 ${f2(y+(1960-y)*u*u+4)}`} stroke={C.deskDeep} strokeWidth={1.4} opacity={.3}/>)}
  {mug&&<g transform={`translate(${mug[0]} ${mug[1]})`} data-part="sanitizer-pump">
   <ellipse cx={8} cy={112} rx={52} ry={11} fill={C.shadow} opacity={.25}/>
   <path d="M-34 30Q-34 18 -22 18H22Q34 18 34 30V100Q34 112 22 112H-22Q-34 112 -34 100Z" fill="#E9EEEE" stroke={C.ink} strokeWidth={2.6}/>
   <path d="M-26 40V96" stroke="#FFFFFF" strokeWidth={5} opacity={.6}/>
   <rect x={-22} y={52} width={44} height={30} rx={4} fill={C.tealPale} stroke={C.ink} strokeWidth={1.6}/>
   <rect x={-8} y={-2} width={16} height={20} fill="#C9CED0" stroke={C.ink} strokeWidth={2}/>
   <path d="M-6 -2H34Q40 -2 40 6" stroke={C.ink} strokeWidth={7} fill="none" strokeLinecap="round"/>
  </g>}
  {pen&&<g transform={`translate(${pen[0]} ${pen[1]}) rotate(-14)`} data-part="pen">
   <rect x={0} y={4} width={200} height={14} rx={7} fill={C.shadow} opacity={.2}/>
   <rect x={0} y={-6} width={200} height={14} rx={7} fill={C.trim} stroke={C.ink} strokeWidth={2}/>
   <path d="M200 -6L224 1L200 8Z" fill="#C9CED0" stroke={C.ink} strokeWidth={2}/>
   <rect x={30} y={-10} width={60} height={6} rx={3} fill="#9AA3A9"/>
  </g>}
 </g>;
};
/** A ruled ledger page w by h from the origin: teal margin rule, faint rows, a binder edge along the top. */
const Ledger:React.FC<{w:number;h:number;rows?:number}>=({w,h,rows=14})=>{
 const id=useUid('srledger');
 return <g data-part="ledger-page">
  <defs><linearGradient id={id+'g'} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={C.paperLit}/><stop offset="1" stopColor={C.paper}/></linearGradient></defs>
  <rect x={14} y={18} width={w} height={h} rx={10} fill={C.shadow} opacity={.2}/>
  <rect x={0} y={0} width={w} height={h} rx={10} fill={`url(#${id}g)`} stroke={C.ink} strokeWidth={2.6}/>
  {Array.from({length:rows},(_,k)=><path key={k} d={`M18 ${f2(90+k*(h-120)/rows)}H${w-18}`} stroke={C.rule} strokeWidth={2} opacity={.7}/>)}
  <path d={`M86 40V${h-20}`} stroke={C.teal} strokeWidth={3} opacity={.6}/>
  <rect x={0} y={0} width={w} height={46} rx={10} fill={C.trim}/>
  {[.18,.42,.7].map((u,k)=><circle key={k} cx={f2(w*u)} cy={23} r={9} fill={C.paperShade} stroke={C.ink} strokeWidth={2}/>)}
  <path d={`M${w*.62} ${h-60}l40 -8`} stroke={C.edge} strokeWidth={2} opacity={.7}/>
 </g>;
};

// ---- the one exported group ---------------------------------------------------------------------------------
export type StudyRecordSupportProps=
 |{part:'s4';card:number;draw:number;climb:number;fill:number;num:number}
 |{part:'s5';badge:number;glow:number;axis:number;whisker:number;cap:number}
 |{part:'s6';rise:number;suite:number;stamp:number;press:number;away:number}
 |{part:'s7';card:number;link:number;arrow:number;strike:number}
 |{part:'s8';tag:number;band:number;stake:number;slice:number;only?:'stake'}
 |{part:'s9';card:number;tagged:number;clock:React.ReactNode;marker:Pt}
 |{part:'blank';draw:number;pulse?:number;size?:number}
 |{part:'tally';fill:number;pitch:number;glow?:number}
 |{part:'counter';num:number;big:number;small:number;lines?:string[]}
 |{part:'tag';w:number;h:number;lines:string[];size:number;camera?:boolean}
 |{part:'desk';y:number;mug?:Pt;pen?:Pt}
 |{part:'ledger';w:number;h:number;rows?:number}
 |{part:'panel';w:number;h:number;rows:{label:string;stamp:number;active:number}[];title?:string}
 |{part:'result';link:number};
export const StudyRecordSupport:React.FC<StudyRecordSupportProps>=(p)=>{
 switch(p.part){
 case 's4':return <S4Board card={p.card} draw={p.draw} climb={p.climb} fill={p.fill} num={p.num}/>;
 case 's5':return <S5Board badge={p.badge} glow={p.glow} axis={p.axis} whisker={p.whisker} cap={p.cap}/>;
 case 's6':return <S6Board rise={p.rise} suite={p.suite} stamp={p.stamp} press={p.press} away={p.away}/>;
 case 's7':return <S7Board card={p.card} link={p.link} arrow={p.arrow} strike={p.strike}/>;
 case 's8':return <S8Board tag={p.tag} band={p.band} stake={p.stake} slice={p.slice} only={p.only}/>;
 case 's9':return <S9Board card={p.card} tagged={p.tagged} clock={p.clock} marker={p.marker}/>;
 case 'blank':return <BlankBox draw={p.draw} pulse={p.pulse} size={p.size}/>;
 case 'tally':return <Tally fill={p.fill} pitch={p.pitch} glow={p.glow}/>;
 case 'counter':return <CounterLabel num={p.num} big={p.big} small={p.small} lines={p.lines}/>;
 case 'tag':return <Tag w={p.w} h={p.h} lines={p.lines} size={p.size} glyph={p.camera?<CamGlyph x={52} y={p.h/2+6} s={.38}/>:undefined}/>;
 case 'desk':return <Desk y={p.y} mug={p.mug} pen={p.pen}/>;
 case 'ledger':return <Ledger w={p.w} h={p.h} rows={p.rows}/>;
 case 'panel':return <RecordPanel w={p.w} h={p.h} rows={p.rows} title={p.title}/>;
 case 'result':return <ResultCard link={p.link}/>;
 }
};
