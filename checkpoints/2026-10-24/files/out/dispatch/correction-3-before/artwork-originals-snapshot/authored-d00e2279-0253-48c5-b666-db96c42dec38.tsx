import React from 'react';
import {FONT} from '../../../lib/type';
import {useUid} from '../../../lib/uid';

/**
 * RoomCameraHero, the fresh authored hero group for the 2026-10-24 edition (room-clock-v1).
 *
 * ONE generic cardiothoracic operating room carries the film, drawn as a disclosed illustration. It is
 * not the Walter Tower suite and shows no vendor interface, logo, staff member, patient identity or
 * second level timing. Its parts:
 *
 *  - four rounded wall cameras: a pale shell housing on a short steel arm, a dark lens with a small
 *    reflection, a sun visor, vent slots, a drooping cable and a small lamp on the spine that is the only
 *    amber in the room. Each head can turn to follow what it watches.
 *  - a fixed surgical table on a bellows column under a ceiling surgical light, a wheeled transport
 *    gurney that brings the patient shape, a pale patient shape with no face, and a blue green surgical
 *    drape that lowers with a lopsided fall over an anaesthesia screen bar at the head end.
 *  - a round room clock ring with ticks and no numerals, a sweeping hand, and event markers that stamp
 *    onto the bezel where the hand stands when the event is seen, each with a short worded tag.
 *  - the suite name plate, a surgeon phone with its text thread, and the gloved hand that holds it.
 *  - a top down plan of the same room for the overhead views.
 *
 * Light: cool overhead surgical light from the upper left, a soft cool fill from the right, the warm
 * amber camera lamps as small practicals, soft contact shadows to the lower right. Nothing is symmetric:
 * the plate hangs a degree off, the far camera's cable droops lower, the table's head section is raised,
 * the drape's near hem hangs longer at the head end, a scuff sits on the gurney rail.
 *
 * Pure function of its props. The episode drives every prop from the film frame clock and the board's
 * event windows; this file holds no clock, no state and no random input.
 */

export type Pt=[number,number];
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
const f2=(v:number)=>v.toFixed(2);
const RAD=Math.PI/180;
const mix=(a:string,b:string,p:number)=>{
 const h=(s:string)=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
 const x=h(a),y=h(b),q=clamp(p);
 return '#'+x.map((v,i)=>Math.round(lerp(v,y[i],q)).toString(16).padStart(2,'0')).join('');
};

/** The room's paint. Amber belongs to the camera lamps alone here (and, in the support group, to the stamp
 * and the text alert). Teal marks the suite and its record. */
export const ROOM_PAINT={
 tileLit:'#E4ECEC',tile:'#CCD8D9',tileShade:'#A9B9BB',grout:'#9AAEB1',
 floorLit:'#BFCCCB',floor:'#A3B3B2',floorDeep:'#7F9291',
 steelLit:'#F1F4F5',steel:'#C6CED2',steelShade:'#8F9AA0',steelDeep:'#5D6970',
 shell:'#E6EEF0',shellShade:'#B5C2C7',shellDeep:'#8797A0',ink:'#16242A',trim:'#33474D',
 lens:'#0D171C',lensRing:'#3E4F58',lamp:'#E0A21B',lampGlow:'#FFD27A',lampOff:'#6E7470',
 pad:'#6A8A94',padLit:'#8EAAB2',padDeep:'#4C6A74',sheet:'#EEF2EE',sheetShade:'#C8D2CD',
 gown:'#DCE4E1',gownShade:'#AEBDB9',gownDeep:'#8D9E9A',
 drape:'#4F8D84',drapeLit:'#71ADA3',drapeDeep:'#2F665F',
 glove:'#86AFD0',gloveShade:'#5F88AC',gloveDeep:'#456F93',sleeve:'#5C8A86',
 paper:'#F1EEE4',teal:'#2A7C77',tealLit:'#3FA39C',shadow:'#13201F',rust:'#9A5B3C'};
const P=ROOM_PAINT;

// ---- the wall camera ---------------------------------------------------------------------------------------
/** Camera geometry in camera units. The mount sits on the wall at the origin; the head pivots at HEAD and
 * points along +x, turned by `aim` degrees (positive turns the lens down). */
export const CAMERA={head:[38,26] as Pt,lens:[80,4] as Pt,box:[-24,-40,128,92] as [number,number,number,number]};
/** Where a camera's lens sits in its parent's units, for a mount at `at`, scale `s`, aim and mirror. Pure. */
export function cameraLens(at:Pt,s:number,aim:number,mirror=false):Pt{
 const a=aim*RAD,[hx,hy]=CAMERA.head,[lx,ly]=CAMERA.lens;
 const x=hx+lx*Math.cos(a)-ly*Math.sin(a),y=hy+lx*Math.sin(a)+ly*Math.cos(a);
 return [at[0]+(mirror?-1:1)*s*x,at[1]+s*y];
}
/** The aim (degrees) that points a camera's lens at a target, in the parent's units. Pure. */
export function aimAt(at:Pt,s:number,target:Pt,mirror=false):number{
 const hx=at[0]+(mirror?-1:1)*s*CAMERA.head[0],hy=at[1]+s*CAMERA.head[1];
 const dx=(target[0]-hx)*(mirror?-1:1),dy=target[1]-hy;
 return Math.atan2(dy,dx)/RAD;
}
type CameraProps={lamp:number;aim:number;mirror?:boolean;droop?:number;flash?:number};
const WallCamera:React.FC<CameraProps>=({lamp,aim,mirror=false,droop=1,flash=0})=>{
 const id=useUid('rccam'),on=clamp(lamp),[hx,hy]=CAMERA.head;
 const housing='M-14 -20Q-14 -29 -3 -29L56 -29Q86 -29 89 -1Q86 27 56 27L-3 27Q-14 27 -14 18Z';
 return <g transform={mirror?'scale(-1 1)':undefined} data-part="wall-camera">
  <defs>
   <linearGradient id={id+'s'} x1="0" y1="0" x2=".35" y2="1">
    <stop offset="0" stopColor={P.steelLit}/><stop offset=".5" stopColor={P.shell}/><stop offset="1" stopColor={P.shellDeep}/>
   </linearGradient>
   <linearGradient id={id+'p'} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={P.steelLit}/><stop offset="1" stopColor={P.steelShade}/></linearGradient>
   <radialGradient id={id+'l'} cx=".36" cy=".34" r=".72"><stop offset="0" stopColor="#3A505C"/><stop offset=".55" stopColor={P.lens}/><stop offset="1" stopColor="#03070A"/></radialGradient>
   <radialGradient id={id+'g'}><stop offset="0" stopColor={P.lampGlow} stopOpacity={.85}/><stop offset="1" stopColor={P.lampGlow} stopOpacity={0}/></radialGradient>
  </defs>
  {/* the cable, drooping from the plate and out of the housing's back */}
  <path d={`M-4 22C-10 ${f2(48+14*droop)} -30 ${f2(56+18*droop)} -34 ${f2(96+20*droop)}`} stroke={P.trim} strokeWidth={4.5} fill="none" strokeLinecap="round" opacity={.85}/>
  {/* the wall plate and its two screws, one a touch rusted */}
  <rect x={-22} y={-30} width={30} height={58} rx={7} fill={`url(#${id}p)`} stroke={P.ink} strokeWidth={2}/>
  <circle cx={-12} cy={-20} r={3} fill={P.steelDeep}/><circle cx={-3} cy={18} r={3} fill={P.steelDeep}/>
  <path d="M-3 21v6" stroke={P.rust} strokeWidth={1.6} opacity={.6} strokeLinecap="round"/>
  {/* the arm and its ball joint */}
  <path d={`M0 0L${hx-6} ${hy-4}`} stroke={P.steelShade} strokeWidth={11} strokeLinecap="round"/>
  <path d={`M2 -3L${hx-8} ${hy-8}`} stroke={P.steelLit} strokeWidth={3} strokeLinecap="round" opacity={.8}/>
  <circle cx={hx} cy={hy} r={10} fill={`url(#${id}p)`} stroke={P.ink} strokeWidth={2}/>
  <g transform={`translate(${hx} ${hy}) rotate(${f2(aim)})`}>
   {/* soft glow of the lit lamp, behind the housing */}
   {on>0&&<circle cx={10} cy={-33} r={30} fill={`url(#${id}g)`} opacity={on*(.7+.3*flash)}/>}
   <path d={housing} fill={`url(#${id}s)`} stroke={P.ink} strokeWidth={2.6} strokeLinejoin="round"/>
   <path d="M-6 -22Q20 -26 54 -25" stroke="#FFFFFF" strokeWidth={4} opacity={.75} fill="none" strokeLinecap="round"/>
   <path d="M38 -28V26" stroke={P.shellDeep} strokeWidth={1.8} opacity={.8}/>
   {[0,1,2].map(k=><path key={k} d={`M${-6+k*7} -10v18`} stroke={P.trim} strokeWidth={2.6} strokeLinecap="round" opacity={.7}/>)}
   <path d="M60 -29L96 -24L93 -15L64 -19Z" fill={P.trim} stroke={P.ink} strokeWidth={1.6} strokeLinejoin="round"/>
   <circle cx={CAMERA.lens[0]} cy={CAMERA.lens[1]} r={17} fill={P.lensRing} stroke={P.ink} strokeWidth={2}/>
   <circle cx={CAMERA.lens[0]+1} cy={CAMERA.lens[1]} r={12} fill={`url(#${id}l)`}/>
   <ellipse cx={CAMERA.lens[0]-3} cy={CAMERA.lens[1]-5} rx={4} ry={2.6} fill="#FFFFFF" opacity={.8}/>
   {/* the lamp on the spine */}
   <rect x={2} y={-37} width={18} height={9} rx={4.5} fill={mix(P.lampOff,P.lamp,on)} stroke={P.ink} strokeWidth={1.6}/>
   {on>.05&&<rect x={5} y={-35.5} width={7} height={3} rx={1.5} fill="#FFF3D0" opacity={on}/>}
   <path d="M18 23Q40 26 70 22" stroke={P.shellDeep} strokeWidth={2} opacity={.6} fill="none"/>
  </g>
 </g>;
};

// ---- the surgical table, the gurney, the patient, the drape ------------------------------------------------
/** Table geometry in table units: the pad top's centre at the origin, long axis along x. */
export const TABLE={L:470,padTop:-14,baseY:180,box:[-250,-20,250,196] as [number,number,number,number]};
/** The gurney: same pad height as the table, so the patient slides across level. */
export const GURNEY={L:430,baseY:178,box:[-225,-80,250,196] as [number,number,number,number]};
/** The patient shape's top contour above the pad (x, height), head end at the left. */
const BODY:Pt[]=[[-205,-6],[-200,-34],[-182,-44],[-160,-40],[-146,-34],[-120,-50],[-80,-62],[-40,-58],[0,-50],[30,-48],[70,-52],[110,-58],[140,-52],[165,-44],[185,-52],[200,-40],[208,-10]];
export const PATIENT_BOX:[number,number,number,number]=[-228,-76,212,0];
const smoothPath=(pts:Pt[])=>{
 let d=`M${f2(pts[0][0])} ${f2(pts[0][1])}`;
 for(let i=1;i<pts.length-1;i++){const m:Pt=[(pts[i][0]+pts[i+1][0])/2,(pts[i][1]+pts[i+1][1])/2];
  d+=`Q${f2(pts[i][0])} ${f2(pts[i][1])} ${f2(m[0])} ${f2(m[1])}`;}
 const l=pts[pts.length-1];return d+`L${f2(l[0])} ${f2(l[1])}`;
};
const SurgicalTable:React.FC<{sheet?:number;light?:number}>=({sheet=0,light=1})=>{
 const id=useUid('rctable'),L=TABLE.L,h=L/2;
 return <g data-part="surgical-table">
  <defs>
   <linearGradient id={id+'c'} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={P.steelShade}/><stop offset=".3" stopColor={P.steelLit}/><stop offset="1" stopColor={P.steelDeep}/></linearGradient>
   <linearGradient id={id+'p'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={P.padLit}/><stop offset=".55" stopColor={P.pad}/><stop offset="1" stopColor={P.padDeep}/></linearGradient>
   <radialGradient id={id+'sh'}><stop offset="0" stopColor={P.shadow} stopOpacity={.42}/><stop offset="1" stopColor={P.shadow} stopOpacity={0}/></radialGradient>
  </defs>
  <ellipse cx={16} cy={TABLE.baseY+2} rx={200} ry={22} fill={`url(#${id}sh)`}/>
  {/* the base, the bellows column and its worn folds */}
  <path d={`M-118 ${TABLE.baseY}L-96 ${TABLE.baseY-26}H100L124 ${TABLE.baseY}Z`} fill={P.steelDeep} stroke={P.ink} strokeWidth={2.4} strokeLinejoin="round"/>
  <path d={`M-90 ${TABLE.baseY-24}H96`} stroke={P.steelShade} strokeWidth={3} opacity={.7}/>
  <rect x={-38} y={26} width={76} height={TABLE.baseY-52} rx={6} fill={`url(#${id}c)`} stroke={P.ink} strokeWidth={2.4}/>
  {Array.from({length:8},(_,k)=><path key={k} d={`M-36 ${42+k*13}H36`} stroke={P.steelDeep} strokeWidth={1.6} opacity={.55-.03*k}/>)}
  {/* the frame rail with its accessory clamp */}
  <rect x={-h+12} y={8} width={L-24} height={18} rx={5} fill={P.steel} stroke={P.ink} strokeWidth={2.2}/>
  <path d={`M${-h+16} 12H${h-16}`} stroke={P.steelLit} strokeWidth={2.4} opacity={.8}/>
  <rect x={118} y={4} width={30} height={26} rx={4} fill={P.steelShade} stroke={P.ink} strokeWidth={2}/>
  {/* the pad, its raised head section and the fresh sheet */}
  <path d={`M${-h} -2Q${-h} -14 ${-h+12} -16L${-h+92} -22L${-h+98} 8L${-h+6} 8Q${-h} 8 ${-h} -2Z`} fill={`url(#${id}p)`} stroke={P.ink} strokeWidth={2.4} strokeLinejoin="round"/>
  <rect x={-h+100} y={-14} width={L-100} height={22} rx={9} fill={`url(#${id}p)`} stroke={P.ink} strokeWidth={2.4}/>
  <path d={`M${-h+108} -9H${h-12}`} stroke="#FFFFFF" strokeWidth={3} opacity={.35*light} strokeLinecap="round"/>
  {sheet>0&&<g opacity={clamp(sheet)}>
   <path d={`M${-h+104} -16H${h-6}Q${h} -16 ${h} -10V-4H${-h+104}Z`} fill={P.sheet} stroke={P.sheetShade} strokeWidth={1.6}/>
   <path d={`M${-h+140} -12H${h-40}`} stroke="#FFFFFF" strokeWidth={2} opacity={.8}/>
  </g>}
 </g>;
};
const Gurney:React.FC<{wheel?:number}>=({wheel=0})=>{
 const id=useUid('rcgurney'),L=GURNEY.L,h=L/2,spoke=wheel*57.3;
 const caster=(x:number,far:boolean)=><g key={x+(far?'f':'n')} opacity={far?.7:1}>
  <path d={`M${x} 136V${GURNEY.baseY-24}`} stroke={P.steelDeep} strokeWidth={5}/>
  <circle cx={x+4} cy={GURNEY.baseY-11} r={far?10:13} fill={P.trim} stroke={P.ink} strokeWidth={2}/>
  <path d={`M${x+4} ${GURNEY.baseY-11}l${f2(8*Math.cos(spoke*RAD))} ${f2(8*Math.sin(spoke*RAD))}`} stroke={P.steelShade} strokeWidth={2.4} strokeLinecap="round"/>
 </g>;
 return <g data-part="gurney">
  <defs><radialGradient id={id+'sh'}><stop offset="0" stopColor={P.shadow} stopOpacity={.34}/><stop offset="1" stopColor={P.shadow} stopOpacity={0}/></radialGradient>
   <linearGradient id={id+'m'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={P.sheet}/><stop offset="1" stopColor={P.sheetShade}/></linearGradient></defs>
  <ellipse cx={12} cy={GURNEY.baseY+1} rx={210} ry={16} fill={`url(#${id}sh)`}/>
  {caster(-h+70,true)}{caster(h-60,true)}
  {/* the scissor legs */}
  <path d={`M${-h+60} 30L${h-70} 136M${h-70} 30L${-h+60} 136`} stroke={P.steelShade} strokeWidth={7} strokeLinecap="round"/>
  <path d={`M${-h+50} 136H${h-50}`} stroke={P.steelDeep} strokeWidth={8} strokeLinecap="round"/>
  {caster(-h+46,false)}{caster(h-46,false)}
  {/* frame, mattress, rail and push handle; a scuff on the rail */}
  <rect x={-h+6} y={6} width={L-12} height={20} rx={6} fill={P.steel} stroke={P.ink} strokeWidth={2.2}/>
  <rect x={-h} y={-12} width={L} height={20} rx={9} fill={`url(#${id}m)`} stroke={P.ink} strokeWidth={2.2}/>
  <path d={`M${-h+30} -34H${h-60}`} stroke={P.steelShade} strokeWidth={6} strokeLinecap="round"/>
  {[-h+30,-h+170,h-60].map((x,k)=><path key={k} d={`M${x} -34V6`} stroke={P.steelShade} strokeWidth={5}/>)}
  <path d={`M${-h+110} -34h26`} stroke={P.trim} strokeWidth={3} opacity={.5} strokeLinecap="round"/>
  <path d={`M${h-4} 10V-66Q${h-4} -76 ${h+8} -76H${h+18}`} stroke={P.steelDeep} strokeWidth={8} fill="none" strokeLinecap="round"/>
 </g>;
};
const PatientShape:React.FC=()=>{
 const id=useUid('rcpatient');
 const top=[[-166,-6] as Pt,...BODY.filter(p=>p[0]>=-146)].map(([x,y])=>[x,y+TABLE.padTop] as Pt);
 return <g data-part="patient-shape">
  <defs><linearGradient id={id+'g'} x1="0" y1="0" x2=".2" y2="1"><stop offset="0" stopColor="#F4F7F5"/><stop offset=".55" stopColor={P.gown}/><stop offset="1" stopColor={P.gownShade}/></linearGradient>
   <radialGradient id={id+'c'} cx=".38" cy=".3"><stop offset="0" stopColor="#B9CEDC"/><stop offset="1" stopColor="#7E9CB2"/></radialGradient></defs>
  {/* the pillow, the head under a blue surgical cap (no face) left of the screen, then the body in its gown */}
  <ellipse cx={-192} cy={TABLE.padTop-6} rx={36} ry={11} fill={P.sheet} stroke={P.ink} strokeWidth={1.8}/>
  <ellipse cx={-190} cy={TABLE.padTop-27} rx={23} ry={21} fill={`url(#${id}c)`} stroke={P.ink} strokeWidth={2.2}/>
  <path d={`M-210 ${TABLE.padTop-30}Q-190 ${TABLE.padTop-40} -170 ${TABLE.padTop-31}`} stroke="#5F7F96" strokeWidth={2} fill="none" opacity={.7}/>
  <path d={`M-176 ${TABLE.padTop-14}Q-168 ${TABLE.padTop-20} -160 ${TABLE.padTop-16}`} stroke={P.gownDeep} strokeWidth={6} strokeLinecap="round" fill="none"/>
  <path d={smoothPath(top)+`L208 ${TABLE.padTop}L-166 ${TABLE.padTop}Z`} fill={`url(#${id}g)`} stroke={P.ink} strokeWidth={2.4} strokeLinejoin="round"/>
  <path d="M-120 -58Q-60 -78 0 -66" stroke="#FFFFFF" strokeWidth={4} opacity={.6} fill="none" strokeLinecap="round"/>
  <path d="M-150 -46Q-148 -30 -140 -18M40 -60Q60 -40 50 -18M140 -64Q150 -44 146 -22" stroke={P.gownDeep} strokeWidth={2} opacity={.5} fill="none"/>
 </g>;
};
/** The drape: `drop` 0 floats flat above the patient, 1 has settled over the screen bar and the body with
 * its sides hanging, the near hem longer at the head end. */
const Drape:React.FC<{drop:number;flutter?:number}>=({drop,flutter=0})=>{
 const id=useUid('rcdrape'),q=clamp(drop);
 const xs=BODY.map(p=>p[0]).filter(x=>x>=-150);
 const settled=xs.map((x,i)=>{const b=BODY.find(p=>p[0]===x)!;return [x,b[1]+TABLE.padTop-7] as Pt;});
 // the screen bar lifts the head end of the drape into a short wall
 const screen:Pt[]=[[-176,-128],[-160,-138]];
 const floatY=-250;
 const floating=xs.map((x,i)=>[x,floatY+8*Math.sin(i*1.3+flutter*6)*(1-q)] as Pt);
 const fscreen:Pt[]=[[-176,floatY-2],[-160,floatY-4]];
 const top=[...screen.map((p,i)=>[lerp(fscreen[i][0],p[0],q),lerp(fscreen[i][1],p[1],q)] as Pt),
  ...settled.map((p,i)=>[p[0],lerp(floating[i][1],p[1],q)] as Pt)];
 const thick=lerp(26,0,q);
 const hemR:Pt=[lerp(232,224,q),lerp(floatY+thick,40,q)],hemL:Pt=[lerp(-182,-188,q),lerp(floatY+thick,64,q)];
 const hem=`L${f2(hemR[0])} ${f2(hemR[1])}Q${f2(lerp(150,120,q))} ${f2(lerp(floatY+thick+4,52,q))} ${f2(lerp(20,10,q))} ${f2(lerp(floatY+thick,46,q))}Q${f2(lerp(-90,-110,q))} ${f2(lerp(floatY+thick-3,70,q))} ${f2(hemL[0])} ${f2(hemL[1])}Z`;
 return <g data-part="drape" opacity={f2(clamp(q/.15))}>
  <defs><linearGradient id={id+'g'} x1="0" y1="0" x2=".25" y2="1"><stop offset="0" stopColor={P.drapeLit}/><stop offset=".5" stopColor={P.drape}/><stop offset="1" stopColor={P.drapeDeep}/></linearGradient></defs>
  {q>.6&&<path d={`M-172 -132V${TABLE.padTop+2}`} stroke={P.steelDeep} strokeWidth={5} opacity={clamp((q-.6)*3)}/>}
  <path d={smoothPath(top)+hem} fill={`url(#${id}g)`} stroke={P.ink} strokeWidth={2.4} strokeLinejoin="round"/>
  <path d={`M${f2(lerp(-60,-70,q))} ${f2(lerp(floatY+6,-70,q))}Q${f2(lerp(20,10,q))} ${f2(lerp(floatY+10,-30,q))} ${f2(lerp(40,30,q))} ${f2(lerp(floatY+14,30,q))}`} stroke={P.drapeDeep} strokeWidth={2.4} opacity={.55} fill="none"/>
  <path d={`M${f2(lerp(120,110,q))} ${f2(lerp(floatY+4,-58,q))}Q${f2(lerp(150,140,q))} ${f2(lerp(floatY+12,-10,q))} ${f2(lerp(160,150,q))} ${f2(lerp(floatY+16,38,q))}`} stroke={P.drapeDeep} strokeWidth={2.2} opacity={.5} fill="none"/>
  <path d={`M-140 ${f2(lerp(floatY-1,-76,q))}Q-60 ${f2(lerp(floatY-4,-84,q))} 20 ${f2(lerp(floatY-2,-72,q))}`} stroke="#FFFFFF" strokeWidth={3.4} opacity={.4} fill="none" strokeLinecap="round"/>
 </g>;
};

// ---- the ceiling light -----------------------------------------------------------------------------------
/** The surgical light. Origin is its ceiling pivot; the head hangs at HEAD. `on` lights it and its pool. */
export const LIGHT={head:[-70,150] as Pt,rx:118,ry:38};
const SurgicalLight:React.FC<{on:number;pool?:Pt;poolW?:number}>=({on,pool,poolW=320})=>{
 const id=useUid('rclight'),[hx,hy]=LIGHT.head,q=clamp(on);
 return <g data-part="surgical-light">
  <defs>
   <linearGradient id={id+'c'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFDF3" stopOpacity={.5*q}/><stop offset="1" stopColor="#FFFDF3" stopOpacity={0}/></linearGradient>
   <radialGradient id={id+'h'} cx=".45" cy=".4"><stop offset="0" stopColor={P.steelLit}/><stop offset="1" stopColor={P.steelShade}/></radialGradient>
  </defs>
  {pool&&q>0&&<path d={`M${hx-LIGHT.rx*.8} ${hy+10}L${f2(pool[0]-poolW/2)} ${f2(pool[1])}L${f2(pool[0]+poolW/2)} ${f2(pool[1])}L${hx+LIGHT.rx*.8} ${hy+10}Z`} fill={`url(#${id}c)`}/>}
  <path d={`M0 -400V0Q0 18 -18 22L${hx+20} ${hy-56}`} stroke={P.steelShade} strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  <path d={`M-4 -400V-4`} stroke={P.steelLit} strokeWidth={3} opacity={.7}/>
  <circle cx={0} cy={0} r={13} fill={P.steel} stroke={P.ink} strokeWidth={2.2}/>
  <circle cx={hx+20} cy={hy-56} r={11} fill={P.steel} stroke={P.ink} strokeWidth={2.2}/>
  <path d={`M${hx+20} ${hy-56}L${hx} ${hy-24}`} stroke={P.steelShade} strokeWidth={12} strokeLinecap="round"/>
  <path d={`M${hx-LIGHT.rx} ${hy}Q${hx-LIGHT.rx+6} ${hy-36} ${hx} ${hy-34}Q${hx+LIGHT.rx-6} ${hy-36} ${hx+LIGHT.rx} ${hy}Z`} fill={`url(#${id}h)`} stroke={P.ink} strokeWidth={2.4}/>
  <ellipse cx={hx} cy={hy} rx={LIGHT.rx} ry={LIGHT.ry*.62} fill={mix('#9AA6AB','#FFFBEA',q)} stroke={P.ink} strokeWidth={2.4}/>
  {[-70,-35,0,35,70].map((dx,k)=><circle key={k} cx={hx+dx} cy={hy+(k%2?3:-2)} r={9} fill={mix('#B8C1C4','#FFFFFF',q)} stroke={P.steelShade} strokeWidth={1.4}/>)}
  <rect x={hx-7} y={hy+12} width={14} height={20} rx={5} fill={P.trim}/>
 </g>;
};

// ---- the room clock ---------------------------------------------------------------------------------------
export type ClockMark={angle:number;stamp:number;label:string;lit?:number;out?:number;tag?:boolean};
/** A marker's pin and tag position for a clock of radius r. Angle 0 is twelve o'clock, clockwise. Pure. */
export function markAt(r:number,angle:number,out=1.32):{pin:Pt;tag:Pt}{
 const a=(angle-90)*RAD;return {pin:[r*Math.cos(a),r*Math.sin(a)],tag:[r*out*Math.cos(a),r*out*Math.sin(a)]};
}
export const tagFont=(r:number)=>Math.min(34,Math.max(20,Math.round(r*.2)));
const ClockRing:React.FC<{r:number;draw:number;hand:number;marks:ClockMark[];pulse?:number;tags?:boolean}>=({r,draw,hand,marks,pulse=0,tags=true})=>{
 const id=useUid('rcclock'),q=clamp(draw),C=2*Math.PI*r,fs=tagFont(r);
 return <g data-part="clock-ring">
  <defs><radialGradient id={id+'f'} cx=".42" cy=".38"><stop offset="0" stopColor="#FBFAF4"/><stop offset="1" stopColor="#DCE3E1"/></radialGradient>
   <linearGradient id={id+'b'} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={P.steelLit}/><stop offset="1" stopColor={P.steelDeep}/></linearGradient></defs>
  <circle cx={6} cy={9} r={r+10} fill={P.shadow} opacity={.18*q}/>
  <circle cx={0} cy={0} r={r} fill={`url(#${id}f)`} opacity={q}/>
  {Array.from({length:12},(_,k)=>{const a=k*30*RAD,l=k%3===0?.16:.09;
   return <path key={k} d={`M${f2(Math.sin(a)*r*(.86-l))} ${f2(-Math.cos(a)*r*(.86-l))}L${f2(Math.sin(a)*r*.86)} ${f2(-Math.cos(a)*r*.86)}`} stroke={P.trim} strokeWidth={k%3===0?4:2.4} strokeLinecap="round" opacity={q}/>;})}
  <circle cx={0} cy={0} r={r} fill="none" stroke={`url(#${id}b)`} strokeWidth={Math.max(10,r*.11)} strokeDasharray={`${f2(C*q)} ${f2(C)}`} transform="rotate(-90)" strokeLinecap="round"/>
  <circle cx={0} cy={0} r={r+Math.max(5,r*.055)} fill="none" stroke={P.ink} strokeWidth={2.2} strokeDasharray={`${f2((C+40)*q)} ${f2(C+60)}`} transform="rotate(-90)" opacity={.8}/>
  {/* the hand */}
  {q>.6&&<g opacity={clamp((q-.6)*2.5)} transform={`rotate(${f2(hand)})`}>
   <path d={`M-4 ${f2(r*.16)}L-2.5 ${f2(-r*.74)}L2.5 ${f2(-r*.74)}L4 ${f2(r*.16)}Z`} fill={P.ink}/>
   <circle cx={0} cy={0} r={Math.max(6,r*.06)} fill={P.trim} stroke={P.ink} strokeWidth={2}/>
  </g>}
  {/* event markers stamp onto the bezel where the hand stood */}
  {marks.map((m,k)=>{
   if(m.stamp<=0)return null;
   const s=clamp(m.stamp),drop=(1-s)*r*.5,{pin}=markAt(r+drop,m.angle),{tag}=markAt(r,m.angle,m.out??1.34);
   const lit=clamp(m.lit??0),glow=lit*(.6+.4*Math.sin(Math.PI*clamp(pulse)));
   const w=m.label.length*fs*.58+26,left=tag[0]<-4?-w:tag[0]>4?0:-w/2;
   return <g key={k} data-part="clock-marker">
    {glow>0&&<circle cx={f2(pin[0])} cy={f2(pin[1])} r={r*.17+r*.1*clamp(pulse)} fill={P.tealLit} opacity={.35*glow}/>}
    <g transform={`translate(${f2(pin[0])} ${f2(pin[1])}) rotate(${f2(m.angle)})`} opacity={clamp(s*3)}>
     <path d={`M-9 ${f2(-r*.12)}L9 ${f2(-r*.12)}L4 ${f2(r*.07)}L-4 ${f2(r*.07)}Z`} fill={lit>0?P.tealLit:P.teal} stroke={P.ink} strokeWidth={2}/>
    </g>
    {tags&&m.tag!==false&&s>.55&&<g opacity={clamp((s-.55)*3)} transform={`translate(${f2(tag[0]+left)} ${f2(tag[1]-fs*.8)})`}>
     <rect x={0} y={0} width={f2(w)} height={f2(fs*1.6)} rx={8} fill={lit>0?P.teal:P.paper} stroke={P.ink} strokeWidth={2}/>
     <text x={13} y={f2(fs*1.13)} fontFamily={FONT.body} fontSize={fs} fontWeight={800} fill={lit>0?P.paper:P.ink}>{m.label}</text>
    </g>}
   </g>;})}
 </g>;
};

// ---- the name plate -----------------------------------------------------------------------------------------
export const PLATE={w:300,h:104};
const NamePlate:React.FC<{w?:number}>=({w=PLATE.w})=>{
 const id=useUid('rcplate'),k=w/PLATE.w,h=PLATE.h*k;
 return <g data-part="name-plate" transform="rotate(-1.2)">
  <defs><linearGradient id={id+'g'} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F7F6EF"/><stop offset="1" stopColor="#D5D9D2"/></linearGradient></defs>
  <rect x={5} y={7} width={w} height={h} rx={10} fill={P.shadow} opacity={.2}/>
  <rect x={0} y={0} width={w} height={h} rx={10} fill={`url(#${id}g)`} stroke={P.ink} strokeWidth={2.4}/>
  <rect x={0} y={0} width={w} height={14*k} rx={7} fill={P.teal}/>
  <circle cx={12*k} cy={h-12*k} r={3.2*k} fill={P.steelDeep}/><circle cx={w-13*k} cy={h-11*k} r={3.2*k} fill={P.steelDeep}/>
  <text x={16*k} y={50*k} fontFamily={FONT.body} fontSize={29*k} fontWeight={800} fill={P.ink}>Cardiothoracic suite</text>
  <text x={16*k} y={84*k} fontFamily={FONT.body} fontSize={21*k} fontWeight={700} fill={P.trim}>Houston Methodist Hospital</text>
 </g>;
};

// ---- the phone and the gloved hand ----------------------------------------------------------------------
export const PHONE={W:300,H:600};
type PhoneProps={lit:number;alert:number;link?:number;scale?:number};
/** The surgeon's phone, top left of its body at the origin. Its thread is from the suite cameras to the
 * surgeon; the alert bubble reading patient draped slides in when `alert` runs. */
const SurgeonPhone:React.FC<PhoneProps>=({lit,alert})=>{
 const id=useUid('rcphone'),{W,H}=PHONE,q=clamp(lit),a=clamp(alert);
 const bx=lerp(W-20,34,a);
 return <g data-part="surgeon-phone">
  <defs><linearGradient id={id+'b'} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4A5961"/><stop offset="1" stopColor="#1A2328"/></linearGradient>
   <linearGradient id={id+'s'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={mix('#11191D','#F4F6F3',q)}/><stop offset="1" stopColor={mix('#0B1114','#E3E9E6',q)}/></linearGradient>
   <clipPath id={id+'c'}><rect x={14} y={14} width={W-28} height={H-28} rx={30}/></clipPath></defs>
  <rect x={10} y={14} width={W} height={H} rx={42} fill={P.shadow} opacity={.25}/>
  <rect x={0} y={0} width={W} height={H} rx={42} fill={`url(#${id}b)`} stroke={P.ink} strokeWidth={3}/>
  <rect x={W-2} y={120} width={6} height={70} rx={3} fill="#2A353B"/>
  <g clipPath={`url(#${id}c)`}>
   <rect x={14} y={14} width={W-28} height={H-28} fill={`url(#${id}s)`}/>
   {q>0&&<g opacity={q}>
    <rect x={14} y={14} width={W-28} height={120} fill={P.trim}/>
    {/* a small camera glyph, then the thread's sender and its recipient */}
    <g transform="translate(40 52) scale(.34)"><path d="M-14 -20Q-14 -29 -3 -29L56 -29Q86 -29 89 -1Q86 27 56 27L-3 27Q-14 27 -14 18Z" fill={P.shell}/><circle cx={80} cy={4} r={12} fill={P.lens}/></g>
    <text x={84} y={66} fontFamily={FONT.body} fontSize={27} fontWeight={800} fill={P.paper}>Suite cameras</text>
    <rect x={34} y={92} width={150} height={32} rx={16} fill={P.paper} opacity={.92}/>
    <text x={48} y={115} fontFamily={FONT.body} fontSize={21} fontWeight={800} fill={P.ink}>To surgeon</text>
    <path d={`M40 ${H-80}H${W-40}`} stroke="#B9C4C1" strokeWidth={2}/>
    <rect x={40} y={H-66} width={W-120} height={34} rx={17} fill="#FFFFFF" stroke="#B9C4C1" strokeWidth={2}/>
   </g>}
   {a>0&&<g transform={`translate(${f2(bx)} 230)`} data-part="text-alert" opacity={f2(clamp(a/.12))}>
    <rect x={4} y={8} width={W-74} height={150} rx={26} fill={P.shadow} opacity={.18}/>
    <path d={`M0 22Q0 0 22 0H${W-96}Q${W-74} 0 ${W-74} 22V126Q${W-74} 148 ${W-96} 148H40L14 170L20 146Q0 142 0 126Z`} fill={P.lamp} stroke={P.ink} strokeWidth={2.6}/>
    <text x={22} y={50} fontFamily={FONT.body} fontSize={22} fontWeight={800} fill={P.ink} opacity={.8}>Text</text>
    <text x={22} y={92} fontFamily={FONT.body} fontSize={33} fontWeight={800} fill={P.ink}>Patient</text>
    <text x={22} y={128} fontFamily={FONT.body} fontSize={33} fontWeight={800} fill={P.ink}>draped</text>
   </g>}
  </g>
  <rect x={W/2-40} y={22} width={80} height={14} rx={7} fill="#0A0F12"/>
 </g>;
};
/** A blue nitrile gloved hand holding the phone from its lower right, the cuff and gown sleeve running out
 * of frame. Drawn in phone units; the fingertips wrap the right edge, the thumb the lower left. */
const GlovedHand:React.FC<{front:boolean}>=({front})=>{
 const id=useUid('rcglove'),{W,H}=PHONE;
 const g=<defs key="d"><linearGradient id={id+'g'} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={P.glove}/><stop offset="1" stopColor={P.gloveDeep}/></linearGradient></defs>;
 if(!front)return <g data-part="gloved-hand-back">{g}
  <path d={`M${W-30} ${H*.42}Q${W+90} ${H*.5} ${W+150} ${H*.95}L${W+260} ${H+240}L${W*.45} ${H+260}L${W*.3} ${H*.92}Q${W*.6} ${H*.7} ${W-30} ${H*.42}Z`} fill={`url(#${id}g)`} stroke={P.ink} strokeWidth={2.6}/>
  <path d={`M${W*.38} ${H+120}L${W+190} ${H+40}L${W+300} ${H+300}L${W*.5} ${H+320}Z`} fill={P.sleeve} stroke={P.ink} strokeWidth={2.6}/>
  <path d={`M${W*.4} ${H+118}L${W+196} ${H+36}`} stroke={P.gloveShade} strokeWidth={12} strokeLinecap="round"/>
 </g>;
 return <g data-part="gloved-hand">{g}
  {/* four fingertips over the right edge, unevenly spaced, then the thumb across the lower left */}
  {[[.44,0],[.55,6],[.66,3],[.76,-4]].map(([y,dx],k)=><path key={k} d={`M${W+6} ${f2(H*y)}Q${W-26+dx} ${f2(H*y+4)} ${W-24+dx} ${f2(H*y+26)}Q${W-22+dx} ${f2(H*y+46)} ${W+8} ${f2(H*y+48)}`} fill={`url(#${id}g)`} stroke={P.ink} strokeWidth={2.4}/>)}
  <path d={`M-30 ${H*.86}Q20 ${H*.74} 66 ${H*.8}Q84 ${H*.86} 64 ${H*.92}Q20 ${H*.98} -26 ${H*1.02}Z`} fill={`url(#${id}g)`} stroke={P.ink} strokeWidth={2.4}/>
  <path d="M30 0" stroke="none"/>
 </g>;
};

// ---- the room's structure ------------------------------------------------------------------------------------
/** A tiled wall panel (the pier that carries the plate and the clock), w by h from the origin, its grout
 * offset so no two courses line up and one tile carries a hairline crack. */
/** `hole` cuts a window out of the panel ([x, y, w, h] in panel units): the stage's region shows through
 * it, framed by a steel surround and a sill. */
const TilePanel:React.FC<{w:number;h:number;tile?:number;light?:number;hole?:[number,number,number,number]}>=({w,h,tile=58,light=1,hole})=>{
 const id=useUid('rctile');
 const rows=Math.ceil(h/tile),cols=Math.ceil(w/tile)+1;
 const cut=hole?`M0 0H${w}V${h}H0Z M${hole[0]} ${hole[1]}V${hole[1]+hole[3]}H${hole[0]+hole[2]}V${hole[1]}Z`:`M0 0H${w}V${h}H0Z`;
 return <g data-part="tile-panel">
  <defs><linearGradient id={id+'g'} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={mix(P.tileShade,P.tileLit,light)}/><stop offset="1" stopColor={mix(P.grout,P.tileShade,light)}/></linearGradient>
   <clipPath id={id+'c'}><path d={cut} clipRule="evenodd"/></clipPath></defs>
  <path d={cut} fillRule="evenodd" fill={`url(#${id}g)`}/>
  {hole&&<g data-part="panel-window">
   <rect x={hole[0]} y={hole[1]} width={hole[2]} height={hole[3]} fill="#FFFFFF" opacity={.12}/>
   <rect x={hole[0]} y={hole[1]} width={hole[2]} height={hole[3]} fill="none" stroke={P.steelShade} strokeWidth={12}/>
   <path d={`M${hole[0]+hole[2]*.55} ${hole[1]}V${hole[1]+hole[3]}`} stroke={P.steelShade} strokeWidth={7}/>
   <rect x={hole[0]-14} y={hole[1]+hole[3]+4} width={hole[2]+28} height={14} rx={3} fill={P.steelLit} stroke={P.ink} strokeWidth={2}/>
  </g>}
  <g clipPath={`url(#${id}c)`} stroke={P.grout} strokeWidth={2} opacity={.7}>
   {Array.from({length:rows},(_,r)=><path key={'r'+r} d={`M0 ${r*tile}H${w}`}/>)}
   {Array.from({length:rows*cols},(_,k)=>{const r=Math.floor(k/cols),c=k%cols,x=c*tile+(r%2?tile*.5:0);
    return <path key={'c'+k} d={`M${f2(x)} ${r*tile}V${(r+1)*tile}`}/>;})}
  </g>
  <path d={`M${f2(tile*1.3)} ${f2(tile*2.2)}l9 14l-4 12l7 10`} stroke={P.grout} strokeWidth={1.4} fill="none" opacity={.8}/>
  <rect x={0} y={0} width={w} height={h} fill="none" stroke={P.ink} strokeWidth={2.4}/>
 </g>;
};
/** The floor from row y0 to the frame's bottom: sheet vinyl with a perspective seam run and a cove base. */
const RoomFloor:React.FC<{y0:number;vx:number;light?:number}>=({y0,vx,light=1})=>{
 const id=useUid('rcfloor');
 return <g data-part="room-floor">
  <defs><linearGradient id={id+'g'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={mix(P.floor,P.floorLit,light)}/><stop offset="1" stopColor={mix(P.floorDeep,P.floor,light)}/></linearGradient></defs>
  <rect x={-40} y={y0} width={1160} height={1960-y0} fill={`url(#${id}g)`}/>
  <rect x={-40} y={y0-16} width={1160} height={18} fill={P.tileShade} stroke={P.ink} strokeWidth={2}/>
  {[-900,-520,-180,160,520,900,1300].map((dx,k)=><path key={k} d={`M${f2(vx+dx*.08)} ${y0}L${f2(vx+dx)} 1960`} stroke={P.floorDeep} strokeWidth={2} opacity={.35}/>)}
  {[0,1,2].map(k=><path key={'h'+k} d={`M-40 ${f2(y0+60*Math.pow(2.1,k))}H1120`} stroke={P.floorDeep} strokeWidth={1.6} opacity={.25}/>)}
  <ellipse cx={f2(vx+150)} cy={f2(y0+150)} rx={260} ry={34} fill="#FFFFFF" opacity={.12*light}/>
 </g>;
};
/** A side wall strip at a frame edge, seen in perspective, x0 to x1, its far edge at row top..bottom. */
const SideWall:React.FC<{x0:number;x1:number;topFar:number;botFar:number;light?:number}>=({x0,x1,topFar,botFar,light=1})=>{
 const id=useUid('rcside'),left=x0<x1;
 return <g data-part="side-wall">
  <defs><linearGradient id={id+'g'} x1={left?'0':'1'} y1="0" x2={left?'1':'0'} y2="0"><stop offset="0" stopColor={mix(P.grout,P.tileShade,light)}/><stop offset="1" stopColor={mix(P.tileShade,P.tile,light)}/></linearGradient></defs>
  <path d={`M${x0} -40L${x1} ${topFar}L${x1} ${botFar}L${x0} ${botFar+130}Z`} fill={`url(#${id}g)`} stroke={P.ink} strokeWidth={2.4}/>
  {[.25,.5,.75].map((u,k)=><path key={k} d={`M${f2(lerp(x0,x1,u))} ${f2(lerp(-40,topFar,u))}V${f2(lerp(botFar+130,botFar,u))}`} stroke={P.grout} strokeWidth={1.6} opacity={.55}/>)}
 </g>;
};

// ---- the plan, straight down ------------------------------------------------------------------------------------
/** Plan geometry in plan units: the room's inside is PLAN.w by PLAN.h from the origin. */
export const PLAN={w:860,h:900,table:[430,470] as Pt,cams:[[70,70],[790,64],[40,560],[826,520]] as Pt[],clock:[40,300] as Pt,door:[860,760] as Pt};
export type PlanProps={light:number;lamps:number[];aim:number[];watch:number;gurney:number;onTable:number;drape:number;
 marks?:ClockMark[];clockDraw?:number;hand?:number;clockTags?:boolean};
/** The gurney's plan position for travel u: 0 outside the door, 1 parked alongside the table's near side.
 * It comes in through the door gap and turns up beside the table. */
export function planGurney(u:number):Pt{
 const q=clamp(u),door:Pt=[PLAN.w+70,PLAN.door[1]],turn:Pt=[PLAN.table[0]+240,PLAN.door[1]-30],park:Pt=[PLAN.table[0]+40,PLAN.table[1]+178];
 const a=(1-q)*(1-q),b=2*q*(1-q),c=q*q;
 return [a*door[0]+b*turn[0]+c*park[0],a*door[1]+b*turn[1]+c*park[1]];
}
const PlanRoom:React.FC<PlanProps>=({light,lamps,aim,watch,gurney,onTable,drape,marks=[],clockDraw=0,hand=0,clockTags=false})=>{
 const id=useUid('rcplan'),{w,h}=PLAN,[tx,ty]=PLAN.table,L=clamp(light);
 const patientTop=(x:number,y:number,k:number)=><g key={'p'+k} transform={`translate(${f2(x)} ${f2(y)})`}>
  <ellipse cx={-150} cy={0} rx={30} ry={26} fill={P.gown} stroke={P.ink} strokeWidth={2}/>
  <path d="M-118 -46Q-40 -64 60 -50Q160 -40 168 0Q160 40 60 50Q-40 64 -118 46Q-132 0 -118 -46Z" fill={P.gown} stroke={P.ink} strokeWidth={2.2}/>
 </g>;
 const g=planGurney(gurney);
 return <g data-part="plan-room">
  <defs><radialGradient id={id+'l'}><stop offset="0" stopColor="#FFFBEA" stopOpacity={.7*L}/><stop offset="1" stopColor="#FFFBEA" stopOpacity={0}/></radialGradient>
   <pattern id={id+'t'} width={60} height={60} patternUnits="userSpaceOnUse"><rect width={60} height={60} fill={mix(P.floor,P.floorLit,L)}/><path d="M60 0H0V60" stroke={P.floorDeep} strokeWidth={1.4} fill="none" opacity={.4}/></pattern></defs>
  <rect x={14} y={18} width={w} height={h} fill={P.shadow} opacity={.18}/>
  <rect x={0} y={0} width={w} height={h} fill={`url(#${id}t)`}/>
  {/* walls with the window band on the top wall and the door gap low on the right */}
  <path d={`M0 0H${w}V${PLAN.door[1]-70}M${w} ${PLAN.door[1]+70}V${h}H0Z`} stroke={P.trim} strokeWidth={26} fill="none" strokeLinejoin="round"/>
  <rect x={300} y={-10} width={460} height={20} fill="#BFD7E3" stroke={P.ink} strokeWidth={2}/>
  <path d={`M${w} ${PLAN.door[1]-70}A140 140 0 0 1 ${w-140} ${PLAN.door[1]+70}`} stroke={P.trim} strokeWidth={3} fill="none" strokeDasharray="10 8"/>
  {/* the clock on the left wall, as the plan's round symbol */}
  {clockDraw>0&&<g transform={`translate(${PLAN.clock[0]+70} ${PLAN.clock[1]})`}><ClockRing r={64} draw={clockDraw} hand={hand} marks={marks} tags={clockTags}/></g>}
  {/* the light's pool, the table and whatever lies on it */}
  <ellipse cx={tx} cy={ty} rx={300} ry={230} fill={`url(#${id}l)`}/>
  <rect x={tx-240} y={ty-70} width={480} height={140} rx={22} fill={P.pad} stroke={P.ink} strokeWidth={2.6}/>
  <rect x={tx-232} y={ty-62} width={86} height={124} rx={16} fill={P.padLit} opacity={.8}/>
  {gurney>0&&<g transform={`translate(${f2(g[0])} ${f2(g[1])})`}>
   <rect x={-210} y={-62} width={420} height={124} rx={18} fill={P.sheet} stroke={P.ink} strokeWidth={2.4}/>
   <path d="M210 -50V50" stroke={P.steelDeep} strokeWidth={10} strokeLinecap="round"/>
  </g>}
  {(gurney>0||onTable>0)&&patientTop(lerp(gurney>0?g[0]:tx,tx,clamp(onTable)),lerp(gurney>0?g[1]:ty,ty,clamp(onTable)),0)}
  {drape>0&&<rect x={tx-128} y={ty-82} width={312} height={164} rx={24} fill={P.drape} stroke={P.ink} strokeWidth={2.4} opacity={clamp(drape)}
   transform={`translate(0 ${f2(-40*(1-clamp(drape)))})`}/>}
  <circle cx={tx-30} cy={ty-10} r={92} fill="none" stroke={P.steelShade} strokeWidth={6} opacity={.55}/>
  {/* the four cameras, each with its sight wedge when it watches; aim is an offset from facing the table */}
  {PLAN.cams.map((c,k)=>{
   const on=clamp(lamps[k]??0),d:Pt=[tx-c[0],ty-c[1]],len=Math.hypot(d[0],d[1]);
   const a=Math.atan2(d[1],d[0])/RAD+(aim[k]??0),u:Pt=[Math.cos(a*RAD),Math.sin(a*RAD)];
   const sp=.2,e1:Pt=[c[0]+len*.86*(u[0]*Math.cos(sp)-u[1]*Math.sin(sp)),c[1]+len*.86*(u[0]*Math.sin(sp)+u[1]*Math.cos(sp))];
   const e2:Pt=[c[0]+len*.86*(u[0]*Math.cos(-sp)-u[1]*Math.sin(-sp)),c[1]+len*.86*(u[0]*Math.sin(-sp)+u[1]*Math.cos(-sp))];
   return <g key={k}>
    {watch>0&&on>0&&<path d={`M${c[0]} ${c[1]}L${f2(e1[0])} ${f2(e1[1])}L${f2(e2[0])} ${f2(e2[1])}Z`} fill={P.lampGlow} opacity={.16*watch*on}/>}
    <g transform={`translate(${c[0]} ${c[1]}) rotate(${f2(a)}) scale(.62)`}>
     {on>0&&<circle cx={6} cy={0} r={44} fill={P.lampGlow} opacity={.35*on}/>}
     <path d="M-14 -20Q-14 -29 -3 -29L56 -29Q86 -29 89 -1Q86 27 56 27L-3 27Q-14 27 -14 18Z" fill={P.shell} stroke={P.ink} strokeWidth={3}/>
     <circle cx={80} cy={0} r={13} fill={P.lens} stroke={P.ink} strokeWidth={2}/>
     <rect x={4} y={-9} width={20} height={18} rx={6} fill={mix(P.lampOff,P.lamp,on)} stroke={P.ink} strokeWidth={2}/>
    </g>
   </g>;})}
 </g>;
};

// ---- the one exported group ---------------------------------------------------------------------------------
export type RoomCameraHeroProps=
 |({part:'camera'}&CameraProps)
 |{part:'table';sheet?:number;light?:number}
 |{part:'gurney';wheel?:number}
 |{part:'patient'}
 |{part:'drape';drop:number;flutter?:number}
 |{part:'light';on:number;pool?:Pt;poolW?:number}
 |{part:'clock';r:number;draw:number;hand:number;marks:ClockMark[];pulse?:number;tags?:boolean}
 |{part:'plate';w?:number}
 |({part:'phone'}&PhoneProps)
 |{part:'glove';front:boolean}
 |{part:'tile';w:number;h:number;tile?:number;light?:number;hole?:[number,number,number,number]}
 |{part:'floor';y0:number;vx:number;light?:number}
 |{part:'sideWall';x0:number;x1:number;topFar:number;botFar:number;light?:number}
 |({part:'plan'}&PlanProps);
export const RoomCameraHero:React.FC<RoomCameraHeroProps>=(p)=>{
 switch(p.part){
 case 'camera':return <WallCamera {...p}/>;
 case 'table':return <SurgicalTable sheet={p.sheet} light={p.light}/>;
 case 'gurney':return <Gurney wheel={p.wheel}/>;
 case 'patient':return <PatientShape/>;
 case 'drape':return <Drape drop={p.drop} flutter={p.flutter}/>;
 case 'light':return <SurgicalLight on={p.on} pool={p.pool} poolW={p.poolW}/>;
 case 'clock':return <ClockRing r={p.r} draw={p.draw} hand={p.hand} marks={p.marks} pulse={p.pulse} tags={p.tags}/>;
 case 'plate':return <NamePlate w={p.w}/>;
 case 'phone':return <SurgeonPhone {...p}/>;
 case 'glove':return <GlovedHand front={p.front}/>;
 case 'tile':return <TilePanel w={p.w} h={p.h} tile={p.tile} light={p.light} hole={p.hole}/>;
 case 'floor':return <RoomFloor y0={p.y0} vx={p.vx} light={p.light}/>;
 case 'sideWall':return <SideWall x0={p.x0} x1={p.x1} topFar={p.topFar} botFar={p.botFar} light={p.light}/>;
 case 'plan':return <PlanRoom {...p}/>;
 }
};
