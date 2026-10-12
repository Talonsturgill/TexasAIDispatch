import React from 'react';
import {FONT, widthOf} from '../../../lib/type';
import {useUid} from '../../../lib/uid';

/**
 * WestTexasSupport, the fresh authored support group for the 2026-10-11 edition.
 *
 * The dry rolling country around the tower and the working things around its alert. Honey
 * mesquite with several twisted dark trunks and a lacy dusty crown, bunch grass gone to straw with
 * seed heads, a pale caliche road, a windmill whose fan is a full disc while its tail vane swings,
 * a galvanised stock tank, a chain-link compound fence with one leaning post, the prefab equipment
 * shelter at the tower foot, a small metal volunteer fire station with a plain helmet emblem, a
 * white utility pickup with a ladder rack, an amber light bar, a dent and red dust on its rocker
 * panels, its cab from the inside with the region seen through the windshield, a rugged crew phone
 * in a leather work glove with a masked chat, the watch on that wrist and the dash clock, the card
 * of fifty six tower slots, the calendar strip since launch, the blank response record, the plan
 * folder and the commission desk with its open approval slot, the lowered tailgate where the blank
 * record lies on the utility's side, and the camera's own panoramic picture for its lens display.
 *
 * Light matches the hero: a low warm sun from the upper left, cool shade on the right, long soft
 * shadows falling right. Nothing is symmetric: every plant is seeded, the fence leans, the truck
 * has one dent. Workwear is plain and anonymous. No logos, names, faces, real phones or screens,
 * and the fire station carries no department name. The slot card shows AEP Texas's own reported
 * sixteen and its plan of fifty six as slots, never as places or counties.
 *
 * Pure function of its props; the episode drives every prop from the film frame clock.
 */

type Pal = Record<'background'|'midground'|'foreground'|'ink'|'paper'|'hero'|'accent', string>;
type Pt=[number,number];
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
const ease=(p:number)=>{const q=clamp(p);return q*q*q*(10+q*(-15+6*q));};
const rad=(d:number)=>d*Math.PI/180;
/** A seeded generator: the same seed draws the same plant on every frame and every render. */
function rng(seed:number){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}

export const WT={soil:'#8C5640',soilDark:'#5E3628',caliche:'#E4D3B4',calicheShade:'#BFA986',straw:'#CDB57D',strawDark:'#977B48',
 olive:'#7C8352',oliveDark:'#4E5636',oliveLit:'#A9AA72',bark:'#3E2B20',white:'#ECE8DF',glass:'#2E3A44',leather:'#B48A55',leatherDark:'#7A5733',
 shirt:'#8C8A70',shirtDark:'#5F5E4B',dash:'#2B2C2D',dashLit:'#545454'};

// ---- plants ------------------------------------------------------------------------------------
const Mesquite:React.FC<{seed:number;h?:number;lean?:number}>=({seed,h=300,lean=0})=>{
 const r=rng(seed);
 const stems:React.ReactNode[]=[], leaves:React.ReactNode[]=[], tips:Pt[]=[];
 const branch=(x:number,y:number,ang:number,len:number,w:number,depth:number,k:string)=>{
  const a=rad(ang), mx=x+Math.cos(a)*len*.5+(r()-.5)*len*.3, my=y+Math.sin(a)*len*.5;
  const ex=x+Math.cos(a)*len, ey=y+Math.sin(a)*len;
  stems.push(<path key={k} d={`M${x} ${y}Q${mx} ${my} ${ex} ${ey}`} stroke={WT.bark} strokeWidth={w} strokeLinecap="round" fill="none"/>);
  if(w>4)stems.push(<path key={k+'l'} d={`M${x-w*.25} ${y}Q${mx-w*.3} ${my} ${ex-w*.2} ${ey}`} stroke="#6E5240" strokeWidth={w*.25} strokeLinecap="round" fill="none" opacity={.7}/>);
  if(depth<=0||len<h*.08){tips.push([ex,ey]);return;}
  const n=depth>2?2:2+Math.floor(r()*2);
  for(let i=0;i<n;i++)branch(ex,ey,ang+(r()-.5)*70+(i-(n-1)/2)*26,len*(.62+r()*.2),w*.62,depth-1,k+i);
 };
 const trunks=3+Math.floor(r()*2);
 for(let i=0;i<trunks;i++)branch((i-(trunks-1)/2)*h*.03,0,-90+(i-(trunks-1)/2)*24+lean+(r()-.5)*12,h*(.3+r()*.1),h*.045,4,'t'+i);
 tips.forEach(([x,y],i)=>{
  const n=5+Math.floor(r()*4);
  for(let j=0;j<n;j++){
   const cx=x+(r()-.5)*h*.2, cy=y+(r()-.4)*h*.1, rr=h*(.03+r()*.035);
   const lit=cx<x&&cy<y;
   leaves.push(<ellipse key={i+'-'+j} cx={cx} cy={cy} rx={rr*1.5} ry={rr} fill={lit?WT.oliveLit:j%3?WT.olive:WT.oliveDark} opacity={.55+r()*.3}/>);
  }
 });
 return <g data-part="mesquite">
  <ellipse cx={h*.18} cy={3} rx={h*.42} ry={h*.035} fill="#2A160E" opacity={.28}/>
  {stems}{leaves}
 </g>;
};

const Grass:React.FC<{seed:number;w?:number;h?:number;sway?:number}>=({seed,w=120,h=90,sway=0})=>{
 const r=rng(seed);
 const blades=Array.from({length:26},(_,i)=>{
  const x=(r()-.5)*w*.5, top=-h*(.55+r()*.45), bend=(r()-.5)*w*.6+sway*h*.2, col=r()<.3?WT.strawDark:r()<.6?WT.straw:'#E2CF9C';
  return <path key={i} d={`M${x} 0Q${x+bend*.3} ${top*.55} ${x+bend} ${top}`} stroke={col} strokeWidth={1.4+r()*1.6} fill="none" strokeLinecap="round"/>;
 });
 const heads=Array.from({length:7},(_,i)=>{const x=(r()-.5)*w*.6+sway*h*.2, y=-h*(.9+r()*.3);
  return <path key={'h'+i} d={`M${x} ${y}q${3+r()*4} -10 ${2+r()*6} -22`} stroke="#E9D8A8" strokeWidth={2.4} fill="none" strokeDasharray="3 2"/>;});
 return <g data-part="bunch-grass"><ellipse cx={w*.12} cy={2} rx={w*.5} ry={6} fill="#2A160E" opacity={.22}/>{blades}{heads}</g>;
};

/** A pale caliche road from the foreground to the horizon. Points are in the caller's frame. */
const Road:React.FC<{near:[number,number,number];far:[number,number,number];bend?:number}>=({near,far,bend=0})=>{
 const [nx,ny,nw]=near,[fx,fy,fw]=far, mx=(nx+fx)/2+bend, my=(ny+fy)/2;
 return <g data-part="caliche-road">
  <path d={`M${nx-nw/2} ${ny}Q${mx-(nw+fw)/4} ${my} ${fx-fw/2} ${fy}L${fx+fw/2} ${fy}Q${mx+(nw+fw)/4} ${my} ${nx+nw/2} ${ny}Z`} fill={WT.caliche} opacity={.92}/>
  <path d={`M${nx+nw*.1} ${ny}Q${mx+(nw+fw)*.05} ${my} ${fx+fw*.1} ${fy}`} stroke={WT.calicheShade} strokeWidth={nw*.04} fill="none" opacity={.6}/>
  <path d={`M${nx-nw*.28} ${ny}Q${mx-(nw+fw)*.14} ${my} ${fx-fw*.28} ${fy}`} stroke={WT.calicheShade} strokeWidth={nw*.03} fill="none" opacity={.5}/>
 </g>;
};

// ---- the windmill ------------------------------------------------------------------------------
const Windmill:React.FC<{fan:number;vane:number}>=({fan,vane})=>{
 const id=useUid('wtw');
 const legs:[Pt,Pt][]=[[[-44,0],[-8,-300]],[[46,0],[9,-300]]];
 const xs=(l:[Pt,Pt],y:number)=>lerp(l[0][0],l[1][0],-y/300);
 const lv=[0,-80,-150,-210,-260,-300];
 const yaw=Math.cos(rad(vane*.6))*.82;
 return <g data-part="windmill">
  <defs><linearGradient id={`${id}t`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#CBD0CC"/><stop offset="1" stopColor="#7C8384"/></linearGradient></defs>
  <path d="M-40 3L50 4L260 -12L200 -15Z" fill="#2A160E" opacity={.2}/>
  {lv.slice(0,-1).map((y,i)=>{const y2=lv[i+1];return <g key={i}>
   <line x1={xs(legs[0],y)} y1={y} x2={xs(legs[1],y2)} y2={y2} stroke="#8D9393" strokeWidth={2}/>
   <line x1={xs(legs[1],y)} y1={y} x2={xs(legs[0],y2)} y2={y2} stroke="#8D9393" strokeWidth={2}/>
   <line x1={xs(legs[0],y2)} y1={y2} x2={xs(legs[1],y2)} y2={y2} stroke="#9EA4A3" strokeWidth={2.4}/>
  </g>;})}
  {legs.map((l,i)=><line key={i} x1={l[0][0]} y1={0} x2={l[1][0]} y2={-300} stroke={i?'#6D7373':'#C7CBC6'} strokeWidth={5}/>)}
  <line x1={2} y1={-300} x2={0} y2={-18} stroke="#5B5F60" strokeWidth={2}/>
  <rect x={-24} y={-306} width={50} height={7} fill="#6D7373"/>
  {/* tail vane swings on its boom; the fan always shows a full disc */}
  <g transform={`translate(4 -332) rotate(${vane})`}>
   <line x1={0} y1={0} x2={92} y2={-6} stroke="#6D7373" strokeWidth={4}/>
   <path d="M70 -36L118 -30L116 18L72 6Z" fill={`url(#${id}t)`} stroke="#4F5455" strokeWidth={1.4}/>
   <path d="M86 -30l2 40" stroke="#A35E2E" strokeWidth={3} opacity={.5}/>
  </g>
  <g transform={`translate(-6 -332) scale(${yaw} 1)`}>
   <circle cx={0} cy={0} r={74} fill="none" stroke="#7E8585" strokeWidth={3}/>
   {Array.from({length:18},(_,i)=>{const a=rad(fan+i*20);const b=rad(fan+i*20+13);
    return <path key={i} d={`M${16*Math.cos(a)} ${16*Math.sin(a)}L${72*Math.cos(a)} ${72*Math.sin(a)}L${72*Math.cos(b)} ${72*Math.sin(b)}L${16*Math.cos(b)} ${16*Math.sin(b)}Z`}
     fill={i===5?'#A9714A':i%2?'#C5CAC5':'#A8AEAB'} stroke="#5D6262" strokeWidth={.8}/>;})}
   <circle cx={0} cy={0} r={46} fill="none" stroke="#6D7373" strokeWidth={2}/>
   <circle cx={0} cy={0} r={13} fill="#5D6262" stroke="#3B3F40" strokeWidth={1.4}/>
  </g>
  {/* stock tank, galvanised and dented */}
  <g transform="translate(96 0)">
   <path d="M-56 -4L-54 -38L56 -40L58 -4Z" fill="#9EA4A1" stroke="#5E6463" strokeWidth={1.4}/>
   {[-28,0,28].map(x=><line key={x} x1={x} y1={-39} x2={x+1} y2={-4} stroke="#7E8483" strokeWidth={1.6}/>)}
   <ellipse cx={1} cy={-39} rx={55} ry={9} fill="#5E7D86" stroke="#5E6463" strokeWidth={1.4}/>
   <ellipse cx={-14} cy={-41} rx={20} ry={3} fill="#C9D8D8" opacity={.6}/>
   <ellipse cx={4} cy={0} rx={70} ry={7} fill="#2A160E" opacity={.25}/>
  </g>
 </g>;
};

// ---- smoke -------------------------------------------------------------------------------------
/** A small grass fire's smoke, rising and leaning in the wind; a pure function of the film time. */
const Plume:React.FC<{t:number;grow:number;lean?:number;h?:number}>=({t,grow,lean=.55,h=300})=>{
 if(grow<=0)return null;
 const N=16, puffs=Array.from({length:N},(_,i)=>{
  const ph=((t*.28+i/N)%1+1)%1, k=ph*grow;
  const y=-k*h, x=lean*Math.pow(k,1.35)*h+Math.sin(t*1.3+i*2.1)*6*k;
  const rr=(10+48*k)*(.6+.4*grow);
  const o=Math.pow(1-ph,.9)*.75*clamp(grow*1.6);
  const tone=ph<.25?'#6F675F':ph<.6?'#948B80':'#B7B3AE';
  return {x,y,rr,o,tone,ph};
 }).sort((a,b)=>b.ph-a.ph);
 return <g data-part="plume">
  {puffs.map((p,i)=><g key={i}>
   <circle cx={p.x} cy={p.y} r={p.rr} fill={p.tone} opacity={p.o}/>
   <circle cx={p.x-p.rr*.3} cy={p.y-p.rr*.3} r={p.rr*.55} fill="#E8DCCB" opacity={p.o*.35}/>
  </g>)}
  <path d={`M-26 0Q-12 ${-10-4*Math.sin(t*9)} 0 -3Q12 ${-12-4*Math.sin(t*7+1)} 28 0Z`} fill="#F08A2E" opacity={.85*clamp(grow*2)}/>
  <path d="M-30 1H32" stroke="#3A1F12" strokeWidth={4} strokeLinecap="round" opacity={.7}/>
 </g>;
};

// ---- buildings and fence ------------------------------------------------------------------------
const Shelter:React.FC<{w?:number}>=({w=300})=>{
 const id=useUid('wts');
 const L=-w/2, R=w/2;
 return <g data-part="equipment-shelter">
  <defs><linearGradient id={`${id}w`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#E6DCC8"/><stop offset="1" stopColor="#B7AB95"/></linearGradient></defs>
  <path d={`M${L+140} 4L${R} 6L${R+220} -18L${R+30} -20Z`} fill="#2A160E" opacity={.24}/>
  <rect x={L} y={-230} width={w} height={230} fill={`url(#${id}w)`} stroke="#6F655A" strokeWidth={2}/>
  {Array.from({length:Math.floor(w/60)},(_,i)=>L+60*(i+1)).filter(x=>x<R-10).map(x=><line key={x} x1={x} y1={-230} x2={x} y2={0} stroke="#A99D87" strokeWidth={1.4}/>)}
  <path d={`M${L-12} -230H${R+12}L${R+6} -248H${L-8}Z`} fill="#9C9180" stroke="#6F655A" strokeWidth={1.6}/>
  <rect x={L+32} y={-168} width={74} height={168} fill="#8D9492" stroke="#4F5455" strokeWidth={2}/>
  <rect x={L+92} y={-92} width={8} height={18} rx={2} fill="#3B3F40"/>
  <path d={`M${L+32} -20h74`} stroke="#A35E2E" strokeWidth={6} opacity={.35}/>
  {/* air conditioner and a rust run under it */}
  <rect x={R-88} y={-170} width={70} height={64} fill="#C9C6BC" stroke="#6F6C64" strokeWidth={1.6}/>
  {[0,1,2,3,4].map(i=><line key={i} x1={R-82} y1={-162+i*12} x2={R-24} y2={-162+i*12} stroke="#8C887E" strokeWidth={2}/>)}
  <path d={`M${R-60} -106q2 30 -2 60`} stroke="#A35E2E" strokeWidth={3} opacity={.45} fill="none"/>
  {/* weathering: a few dust stains rising from the ground */}
  {Array.from({length:Math.max(2,Math.floor(w/140))},(_,i)=><path key={'st'+i} d={`M${L+120+i*140} -4q8 -30 2 -${40+(i*17)%30}`} stroke="#A37A5C" strokeWidth={14} opacity={.12} fill="none" strokeLinecap="round"/>)}
  <rect x={L} y={-6} width={w} height={6} fill="#8C8170"/>
 </g>;
};

const Fence:React.FC<{w:number;seed?:number}>=({w,seed=7})=>{
 const r=rng(seed);
 const n=Math.max(2,Math.round(w/110));
 const posts=Array.from({length:n+1},(_,i)=>({x:i*w/n,lean:i===2?7:(r()-.5)*2}));
 return <g data-part="fence">
  {Array.from({length:Math.round(w/14)},(_,i)=><g key={i} opacity={.28}>
   <line x1={i*14} y1={-110} x2={i*14+60} y2={0} stroke="#9AA1A1" strokeWidth={1}/>
   <line x1={i*14+60} y1={-110} x2={i*14} y2={0} stroke="#9AA1A1" strokeWidth={1}/>
  </g>)}
  <path d={`M0 -112Q${w/2} -106 ${w} -112`} stroke="#A4ABAA" strokeWidth={3} fill="none"/>
  {posts.map((p,i)=><g key={i}>
   <line x1={p.x} y1={0} x2={p.x+p.lean} y2={-128} stroke="#7E8585" strokeWidth={4.5}/>
   <line x1={p.x+p.lean} y1={-128} x2={p.x+p.lean+16} y2={-142} stroke="#7E8585" strokeWidth={2.4}/>
  </g>)}
  {[-132,-140].map(y=><path key={y} d={`M0 ${y}Q${w/2} ${y+5} ${w} ${y}`} stroke="#6D7373" strokeWidth={1.4} strokeDasharray="2 6" fill="none"/>)}
 </g>;
};

const Station:React.FC<{}>=()=>{
 const id=useUid('wtf');
 return <g data-part="fire-station">
  <defs><linearGradient id={`${id}m`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#E5E2D9"/><stop offset="1" stopColor="#A9A79E"/></linearGradient></defs>
  <path d="M-150 3L150 5L330 -10L170 -12Z" fill="#2A160E" opacity={.22}/>
  <path d="M-150 0V-130L0 -200L150 -130V0Z" fill={`url(#${id}m)`} stroke="#666660" strokeWidth={2}/>
  {Array.from({length:15},(_,i)=><line key={i} x1={-140+i*20} y1={-5} x2={-140+i*20} y2={-130-Math.max(0,70-Math.abs(-140+i*20)*.47)} stroke="#B9B6AC" strokeWidth={1.2}/>)}
  <path d="M-160 -126L0 -206L160 -126" stroke="#8C3A2A" strokeWidth={9} fill="none" strokeLinejoin="round"/>
  {[-110,-6].map((x,i)=><g key={x}>
   <rect x={x} y={-104} width={86} height={104} fill={i?'#3A3634':'#C9C6BC'} stroke="#666660" strokeWidth={1.6}/>
   {i===0&&Array.from({length:9},(_,k)=><line key={k} x1={x} y1={-96+k*11} x2={x+86} y2={-96+k*11} stroke="#9F9C93" strokeWidth={1.4}/>)}
   {i===1&&<><rect x={x} y={-104} width={86} height={40} fill="#C9C6BC" stroke="#666660" strokeWidth={1.2}/>
    <path d={`M${x+14} -8V-48H${x+70}L${x+80} -30V-8Z`} fill="#B33A2B"/><rect x={x+20} y={-44} width={22} height={14} fill="#2E3A44"/></>}
  </g>)}
  <rect x={100} y={-74} width={30} height={74} fill="#8D9492" stroke="#4F5455" strokeWidth={1.4}/>
  {/* a plain emblem: a helmet in a round badge, no name */}
  <g transform="translate(0 -158)">
   <circle r={24} fill="#B33A2B" stroke="#F2EBDD" strokeWidth={4}/>
   <path d="M-13 6Q-13 -12 0 -12Q13 -12 13 6H18V9H-18V6Z" fill="#F2EBDD"/>
  </g>
  <line x1={-176} y1={0} x2={-174} y2={-180} stroke="#6D7373" strokeWidth={4}/>
  <path d="M-174 -180h18" stroke="#6D7373" strokeWidth={4}/><circle cx={-154} cy={-176} r={6} fill="#F6E6B8"/>
 </g>;
};

// ---- the truck, outside and in -----------------------------------------------------------------
/** A white utility pickup, side view facing left. Origin on the ground under its middle. */
const Truck:React.FC<{glow?:number}>=({glow=0})=>{
 const id=useUid('wtk');
 const wheel=(x:number)=><g key={x}>
  <circle cx={x} cy={-44} r={44} fill="#1E1E1F"/><circle cx={x} cy={-44} r={26} fill="#8E9293" stroke="#4B4F50" strokeWidth={2}/>
  {Array.from({length:6},(_,i)=>{const a=rad(i*60+14);return <circle key={i} cx={x+15*Math.cos(a)} cy={-44+15*Math.sin(a)} r={3} fill="#4B4F50"/>;})}
  <path d={`M${x-40} -20a44 44 0 0 0 80 0`} stroke="#8C5640" strokeWidth={8} fill="none" opacity={.55}/>
 </g>;
 return <g data-part="utility-truck">
  <defs>
   <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FAF8F2"/><stop offset=".62" stopColor={WT.white}/><stop offset="1" stopColor="#C9A48C"/></linearGradient>
   <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#C7D2D8"/><stop offset=".4" stopColor={WT.glass}/><stop offset="1" stopColor="#1B232A"/></linearGradient>
  </defs>
  <ellipse cx={20} cy={2} rx={300} ry={12} fill="#2A160E" opacity={.32}/>
  <path d="M-200 2L280 4L480 -14L80 -16Z" fill="#2A160E" opacity={.18}/>
  {/* body: hood and cab at left, service body at right */}
  <path d="M-270 -60L-268 -118Q-262 -132 -236 -136L-150 -142L-110 -214Q-102 -226 -86 -226H-6Q8 -226 10 -210L14 -142H262V-60Z" fill={`url(#${id}b)`} stroke="#8D877C" strokeWidth={2}/>
  <path d="M-98 -208L-66 -146H4L2 -206Z" fill={`url(#${id}g)`} stroke="#5A5F62" strokeWidth={1.6}/>
  {glow>0&&<rect x={-60} y={-196} width={40} height={40} rx={6} fill="#9FD0F0" opacity={.6*glow}/>}
  <path d="M-106 -146L-110 -214" stroke="#8D877C" strokeWidth={2}/>
  <rect x={-60} y={-138} width={26} height={6} rx={2} fill="#9B9890"/>
  {/* service body compartments with handles and one dent */}
  {[30,108,186].map(x=><g key={x}><rect x={x} y={-136} width={70} height={72} fill="none" stroke="#B3AEA4" strokeWidth={1.6}/>
   <rect x={x+28} y={-108} width={16} height={5} rx={2} fill="#8D877C"/></g>)}
  <path d="M214 -96q8 6 2 14" stroke="#B3AEA4" strokeWidth={2} fill="none"/>
  {/* ladder rack and ladder */}
  <path d="M30 -142V-174M252 -142V-174M24 -174H258" stroke="#8D9293" strokeWidth={5} fill="none"/>
  <rect x={-40} y={-188} width={290} height={10} fill="#C9AE5A" stroke="#8E7A3A" strokeWidth={1.2}/>
  {Array.from({length:12},(_,i)=><line key={i} x1={-30+i*24} y1={-188} x2={-30+i*24} y2={-178} stroke="#8E7A3A" strokeWidth={2}/>)}
  {/* amber light bar */}
  <rect x={-84} y={-238} width={84} height={12} rx={4} fill="#E59A2A" stroke="#7A4F12" strokeWidth={1.4}/>
  <rect x={-80} y={-236} width={30} height={5} rx={2} fill="#FFD27A" opacity={.8}/>
  {/* mirror, grille and bumper */}
  <path d="M-112 -170h-18v26h18" fill="#3B3F40" stroke="#2A2C2D" strokeWidth={1.4}/>
  <rect x={-276} y={-104} width={18} height={40} rx={3} fill="#3B3F40"/>
  <rect x={-282} y={-66} width={40} height={16} rx={3} fill="#5D6262"/>
  <rect x={250} y={-68} width={22} height={14} rx={2} fill="#5D6262"/>
  <path d="M-266 -64H262" stroke="#C49A82" strokeWidth={10} opacity={.45}/>
  {wheel(-188)}{wheel(178)}
 </g>;
};

/** The pickup cab from the driver's seat, in film coordinates. The windshield is left open so the
 * region shows through it; roof liner, pillars, dash and wheel frame it. */
export const CAB={dashY:1110, mount:[686,1010] as Pt, gauge:[300,1200] as Pt, visor:[560,395] as Pt, dashTop:1080};
const Cab:React.FC<{visorDown?:number;wide?:number}>=({visorDown=0,wide=0})=>{
 const R=1120+wide;
 const id=useUid('wtc');
 return <g data-part="truck-cab">
  <defs>
   <linearGradient id={`${id}d`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4A4A49"/><stop offset=".25" stopColor={WT.dash}/><stop offset="1" stopColor="#151616"/></linearGradient>
   <linearGradient id={`${id}r`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4C4A46"/><stop offset="1" stopColor="#7A766E"/></linearGradient>
  </defs>
  {/* roof liner and the pillars */}
  <path d={`M-40 -40H${R}V250Q${760+wide} 300 ${540+wide/2} 302Q300 300 -40 252Z`} fill={`url(#${id}r)`}/>
  <path d={`M-40 252Q300 300 ${540+wide/2} 302Q${760+wide} 300 ${R} 250`} stroke="#2A2927" strokeWidth={10} fill="none"/>
  <path d="M-40 250L140 300L40 1100H-40Z" fill="#3E3D3A"/>
  <path d={`M${R} 250L${940+wide} 300L${1040+wide} 1100H${R}Z`} fill="#3E3D3A"/>
  <path d="M140 300L40 1100" stroke="#5F5C57" strokeWidth={6}/>
  {/* rearview mirror */}
  <rect x={500} y={300} width={10} height={40} fill="#2A2927"/>
  <rect x={430} y={336} width={160} height={52} rx={12} fill="#1F1F1F" stroke="#4E4C48" strokeWidth={3}/>
  <rect x={442} y={346} width={136} height={32} rx={8} fill="#8A97A0" opacity={.55}/>
  {/* driver sun visor, down with the passenger one when the calendar hangs under them */}
  {visorDown>0&&<path d={`M150 296H470L${466} ${330+60*visorDown}H${154}Z`} fill="#6D6961" stroke="#3E3D3A" strokeWidth={3}/>}
  {/* passenger sun visor */}
  <path d={`M620 296H${930+wide}L${930+wide-8*visorDown} ${330+60*visorDown}H${620+4*visorDown}Z`} fill="#6D6961" stroke="#3E3D3A" strokeWidth={3}/>
  {/* the dash: top shelf, a vent, the binnacle and centre stack */}
  <path d={`M-40 ${CAB.dashTop}Q${540+wide/2} 1010 ${R} ${CAB.dashTop}V1980H-40Z`} fill={`url(#${id}d)`}/>
  <path d={`M-40 ${CAB.dashTop}Q${540+wide/2} 1010 ${R} ${CAB.dashTop}`} stroke="#7B7A77" strokeWidth={4} fill="none" opacity={.8}/>
  <path d="M120 1130Q300 1104 460 1130V1290Q300 1272 120 1290Z" fill="#1A1B1B" stroke="#3F3F3E" strokeWidth={3}/>
  <rect x={560} y={1150} width={200} height={70} rx={10} fill="#1A1B1B" stroke="#3F3F3E" strokeWidth={3}/>
  {[0,1,2,3,4,5].map(i=><line key={i} x1={576} y1={1162+i*10} x2={744} y2={1162+i*10} stroke="#3C3C3B" strokeWidth={3}/>)}
  {/* dust lying on the dash shelf in the low sun */}
  <path d="M600 1060Q760 1052 980 1072" stroke="#C69C7D" strokeWidth={10} opacity={.18} fill="none"/>
  {/* the steering wheel, cut by the frame edge */}
  <g transform="translate(250 1520)">
   <circle r={300} fill="none" stroke="#202020" strokeWidth={46}/>
   <circle r={300} fill="none" stroke="#4A4A49" strokeWidth={6} strokeDasharray="40 30" opacity={.6}/>
   <path d="M-300 30Q0 -20 300 30" stroke="#202020" strokeWidth={40} fill="none"/>
   <circle r={70} fill="#2B2C2D" stroke="#3F3F3E" strokeWidth={4}/>
  </g>
 </g>;
};

// ---- the phone and the hand that holds it -------------------------------------------------------
export const PHONE={w:300,h:600, bubble:[0,40] as Pt};
/** A rugged crew phone. Old messages are masked bars; the new alert lands as a bubble that keeps
 * the alert card's look, its signal strip and flag. Origin at the phone's centre. */
const Phone:React.FC<{bubble?:number;buzz?:number;pal:Pal;time?:number}>=({bubble=0,buzz=0,pal,time=0})=>{
 const id=useUid('wtp');
 const {w,h}=PHONE, sx=Math.sin(time*80)*4*buzz;
 const b=ease(bubble);
 return <g data-part="crew-phone" transform={`translate(${sx} 0)`}>
  <defs><linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#243442"/><stop offset="1" stopColor="#0E151C"/></linearGradient></defs>
  <rect x={-w/2-14} y={-h/2-14} width={w+28} height={h+28} rx={46} fill="#3E4433" stroke="#262A20" strokeWidth={3}/>
  {[[-w/2-14,-h/2+40],[w/2+8,-h/2+40],[-w/2-14,h/2-70],[w/2+8,h/2-70]].map(([x,y],i)=><rect key={i} x={x} y={y} width={6} height={30} rx={2} fill="#2A2E22"/>)}
  <rect x={-w/2} y={-h/2} width={w} height={h} rx={34} fill={`url(#${id}s)`}/>
  <rect x={-w/2+18} y={-h/2+16} width={60} height={8} rx={4} fill="#5A6B78"/>
  <circle cx={w/2-30} cy={-h/2+20} r={5} fill="#5A6B78"/>
  {/* the masked thread: earlier messages are bars, nothing readable */}
  {[[-110,-200,170],[-70,-130,150],[-110,-60,120]].map(([x,y,ww],i)=><g key={i} opacity={1-.6*b}>
   <rect x={x} y={y} width={ww} height={46} rx={18} fill="#3A4C5A"/>
   <rect x={x+16} y={y+18} width={ww-60} height={10} rx={5} fill="#7E93A2"/>
  </g>)}
  {bubble>0&&<g transform={`translate(${PHONE.bubble[0]} ${lerp(-h*.7,PHONE.bubble[1],b)}) scale(${lerp(1.25,1,b)})`} opacity={clamp(bubble*3)}>
   <rect x={-120} y={-58} width={240} height={150} rx={22} fill={pal.paper}/>
   <rect x={-120} y={-58} width={240} height={36} rx={18} fill={pal.accent}/>
   <rect x={-120} y={-36} width={240} height={14} fill={pal.accent}/>
   <line x1={-96} y1={-26} x2={-96} y2={-48} stroke={pal.paper} strokeWidth={3}/><path d="M-95 -48L-79 -43L-95 -37Z" fill={pal.paper}/>
   <text x={-68} y={-32} fontFamily={FONT.body} fontWeight={800} fontSize={22} fill={pal.paper} letterSpacing={1.5}>ALERT</text>
   <g transform="translate(-82 50)"><circle cx={0} cy={0} r={10} fill="#8B857C"/><circle cx={7} cy={-15} r={12} fill="#9E978C"/><circle cx={16} cy={-33} r={13} fill="#B5AEA2"/></g>
   {[0,1].map(i=><rect key={i} x={-40} y={2+i*28} width={i?110:140} height={12} rx={6} fill="#B9AD98"/>)}
  </g>}
  {bubble>=1&&buzz>0&&<rect x={-w/2-24} y={-h/2-24} width={w+48} height={h+48} rx={54} fill="none" stroke={pal.accent} strokeWidth={6} opacity={.5*buzz}/>}
  <rect x={-w/2+6} y={-h/2+6} width={w*.4} height={h*.5} rx={28} fill="#FFFFFF" opacity={.06}/>
 </g>;
};

/** A leather work glove holding the phone from below, thumb over its left edge, fingertips round
 * its right edge, a khaki work sleeve and the watch on that wrist. Origin at the phone's centre;
 * draw the phone between part 'gloveBack' and part 'glove'. */
const Glove:React.FC<{layer:'back'|'front'}>=({layer})=>{
 const id=useUid('wtg');
 if(layer==='back')return <g data-part="glove-back">
  <path d="M120 120Q230 150 260 330L300 760H40L60 300Z" fill={WT.leatherDark}/>
  {[0,1,2,3].map(i=><path key={i} d={`M${150} ${-160+i*78}q46 6 48 34q-2 26 -48 30`} fill={WT.leather} stroke={WT.leatherDark} strokeWidth={3}/>)}
 </g>;
 return <g data-part="glove">
  <defs><linearGradient id={`${id}l`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#D8B07A"/><stop offset=".5" stopColor={WT.leather}/><stop offset="1" stopColor={WT.leatherDark}/></linearGradient></defs>
  {/* palm heel and thumb over the left edge */}
  <path d="M-200 360Q-210 200 -170 120Q-150 70 -130 40Q-112 14 -98 34Q-88 52 -110 110Q-122 150 -100 210Q-40 300 60 320L120 340L140 560H-180Z" fill={`url(#${id}l)`} stroke={WT.leatherDark} strokeWidth={3}/>
  <path d="M-128 46Q-116 30 -104 40" stroke="#EBCB98" strokeWidth={4} fill="none" opacity={.8}/>
  <path d="M-150 150Q-120 230 -40 280" stroke={WT.leatherDark} strokeWidth={2.4} strokeDasharray="8 6" fill="none"/>
  {/* fingertips round the right edge */}
  {[0,1,2].map(i=><path key={i} d={`M${148} ${-120+i*82}q30 -2 34 26q2 28 -30 32q-10 0 -12 -6`} fill={`url(#${id}l)`} stroke={WT.leatherDark} strokeWidth={3}/>)}
  {/* cuff, the watch on the wrist and the sleeve */}
  <path d="M-200 520H150L160 600H-210Z" fill="#9C774A" stroke={WT.leatherDark} strokeWidth={3}/>
  <rect x={-176} y={600} width={300} height={60} rx={10} fill="#2C2B28"/>
  <circle cx={-26} cy={630} r={40} fill="#E9E2D2" stroke="#3C3B37" strokeWidth={8}/>
  <path d="M-26 630V600M-26 630L-6 642" stroke="#2A211C" strokeWidth={4} strokeLinecap="round"/>
  {/* the work sleeve runs on past the frame's bottom edge, so the arm is never cut off in the air */}
  <path d="M-230 660H180L232 1500H-300Z" fill={WT.shirt}/>
  <path d="M-230 660H180" stroke={WT.shirtDark} strokeWidth={8}/>
  <path d="M-150 700q34 220 6 780" stroke={WT.shirtDark} strokeWidth={4} fill="none" opacity={.6}/>
  <path d="M120 720q24 300 40 760" stroke="#A9A788" strokeWidth={6} fill="none" opacity={.5}/>
 </g>;
};

/** A watch or dash clock face with a ten minute window from the flag mark to the message mark.
 * It shows a window, not a measurement: the outer edge of the window is dashed for "within". */
const Clock:React.FC<{r:number;style:'wrist'|'dash';fill:number;bound:number;pal:Pal}>=({r,style,fill,bound,pal})=>{
 const id=useUid('wtcl');
 const face=style==='wrist'?'#F1EADA':'#141617', tick=style==='wrist'?'#2A211C':'#E9E2D2';
 const arcPath=(r0:number,r1:number,deg:number)=>{
  if(deg<=.01)return '';
  const a0=rad(-90),a1=rad(-90+deg),large=deg>180?1:0;
  return `M${r0*Math.cos(a0)} ${r0*Math.sin(a0)}L${r1*Math.cos(a0)} ${r1*Math.sin(a0)}A${r1} ${r1} 0 ${large} 1 ${r1*Math.cos(a1)} ${r1*Math.sin(a1)}L${r0*Math.cos(a1)} ${r0*Math.sin(a1)}A${r0} ${r0} 0 ${large} 0 ${r0*Math.cos(a0)} ${r0*Math.sin(a0)}Z`;
 };
 const end=rad(-90+60);
 return <g data-part="clock-face">
  <defs><radialGradient id={`${id}f`} cx=".42" cy=".38" r=".7"><stop offset="0" stopColor={style==='wrist'?'#FFFDF6':'#26292B'}/><stop offset="1" stopColor={face}/></radialGradient></defs>
  {style==='wrist'?<>
   <rect x={-r*.62} y={-r*1.28} width={r*1.24} height={r*2.56} rx={r*.12} fill="#2C2B28"/>
   {[-1.2,-1.14,1.14,1.2].map(k=><line key={k} x1={-r*.55} y1={r*k} x2={r*.55} y2={r*k} stroke="#45433E" strokeWidth={4}/>)}
  </>:<circle r={r*1.18} fill="#0E0F10" stroke="#3F3F3E" strokeWidth={8}/>}
  <circle r={r*1.08} fill={style==='wrist'?'#A9A69C':'#2B2C2D'} stroke="#3C3B37" strokeWidth={4}/>
  <circle r={r} fill={`url(#${id}f)`}/>
  {Array.from({length:60},(_,i)=>{const a=rad(i*6-90),big=i%5===0;return <line key={i} x1={(r-6)*Math.cos(a)} y1={(r-6)*Math.sin(a)}
   x2={(r-(big?30:16))*Math.cos(a)} y2={(r-(big?30:16))*Math.sin(a)} stroke={tick} strokeWidth={big?5:2}/>;})}
  {/* the window is a hatched, unfilled zone up to a dashed bound: an estimate of "within", never a
    measured time, so nothing in it is drawn as elapsed */}
  <defs><pattern id={`${id}h`} patternUnits="userSpaceOnUse" width={14} height={14} patternTransform="rotate(35)">
   <line x1={0} y1={0} x2={0} y2={14} stroke={pal.accent} strokeWidth={4}/></pattern></defs>
  {fill>0&&<path d={arcPath(r*.18,r*.86,60*fill)} fill={`url(#${id}h)`} opacity={.85}/>}
  {fill>0&&<path d={arcPath(r*.18,r*.86,60*fill)} fill={pal.accent} opacity={.1}/>}
  {bound>0&&<path d={arcPath(r*.18,r*.86,60*ease(bound))} fill="none" stroke={pal.accent} strokeWidth={5} strokeDasharray="12 8"/>}
  {/* hands rest low and to the left, off the window */}
  <path d={`M0 0L${-r*.42} ${r*.28}`} stroke={tick} strokeWidth={9} strokeLinecap="round"/>
  <path d={`M0 0L${-r*.18} ${r*.7}`} stroke={tick} strokeWidth={6} strokeLinecap="round"/>
  <circle r={10} fill={tick}/>
  {/* the flag mark at the top and the message mark at the window's end */}
  <g transform={`translate(${r*1.02*Math.cos(rad(-96))} ${r*1.02*Math.sin(rad(-96))-r*.14}) scale(${r/220})`}>
   <circle r={30} fill={pal.paper} stroke={pal.ink} strokeWidth={3}/>
   <line x1={-8} y1={16} x2={-8} y2={-18} stroke={pal.ink} strokeWidth={4}/><path d="M-7 -18L14 -11L-7 -4Z" fill={pal.accent}/>
  </g>
  {bound>.5&&<g transform={`translate(${r*1.12*Math.cos(end)} ${r*1.12*Math.sin(end)}) scale(${r/220*ease((bound-.5)/.5)})`}>
   <circle r={34} fill={pal.paper} stroke={pal.ink} strokeWidth={3}/>
   <rect x={-12} y={-20} width={24} height={40} rx={5} fill={pal.ink}/>
   <rect x={-8} y={-12} width={16} height={10} rx={2} fill={pal.accent}/>
  </g>}
  <ellipse cx={-r*.3} cy={-r*.45} rx={r*.4} ry={r*.16} fill="#FFFFFF" opacity={style==='wrist'?.22:.06} transform={`rotate(-24 ${-r*.3} ${-r*.45})`}/>
 </g>;
};

// ---- documents: the slot card, the calendar strip, the record card, the folder and desk ---------
export const SLOTS={cols:8,rows:7,cell:96,w:8*96+60,h:7*96+250,footer:7*96+130};
/** AEP Texas's reported sixteen cameras up and plan of fifty six, as slots. Lit slots carry a
 * camera; planned slots are dashed outlines. Origin at the card's top-left. */
const Slots:React.FC<{lit:number;style:'tower'|'lens';planned?:number;labels?:number;pal:Pal}>=({lit,style,planned=0,labels=0,pal})=>{
 const {cols,rows,cell,w,h}=SLOTS;
 return <g data-part="camera-slots">
  <rect x={10} y={14} width={w} height={h} rx={14} fill="#1C120B" opacity={.25}/>
  <rect x={0} y={0} width={w} height={h} rx={14} fill={pal.paper} stroke="#8E8170" strokeWidth={2}/>
  <path d={`M${w-46} 0L${w} 0L${w} 40Z`} fill="#D9CCB2"/>
  {Array.from({length:cols*rows},(_,i)=>{
   const c=i%cols,r=Math.floor(i/cols), x=30+c*cell+cell/2, y=110+r*cell+cell/2;
   const on=clamp(lit-i), isPlan=i>=16;
   const glow=on>0&&on<1?1-on:0;
   if(style==='lens')return <g key={i} transform={`translate(${x} ${y})`}>
    <circle r={34} fill={on>0?'#1B3446':'none'} stroke={on>0?pal.ink:'#8E8170'} strokeWidth={on>0?5:2.6} strokeDasharray={on>0?undefined:'7 6'} opacity={on>0?1:.55+.45*planned*(isPlan?1:0)}/>
    {on>0&&<><circle r={20} fill="#3E6C86" opacity={on}/><circle cx={-8} cy={-9} r={6} fill="#FFF6E2" opacity={.8*on}/></>}
    {glow>0&&<circle r={44} fill={pal.accent} opacity={.35*glow}/>}
   </g>;
   return <g key={i} transform={`translate(${x} ${y})`}>
    <path d="M-16 36L-4 -30H4L18 36" fill="none" stroke={on>0?pal.ink:'#8E8170'} strokeWidth={on>0?4.5:2.4} strokeDasharray={on>0?undefined:'6 5'} opacity={on>0?1:.55+.45*planned*(isPlan?1:0)}/>
    {on>0&&<><path d="M-12 18H13M-9 2H9M-6 -14H6" stroke={pal.ink} strokeWidth={2.4}/>
     <rect x={-11} y={-44} width={22} height={15} rx={6} fill={pal.accent} opacity={on}/></>}
    {glow>0&&<circle cx={0} cy={-36} r={22} fill={pal.accent} opacity={.4*glow}/>}
   </g>;
  })}
  {labels>0&&<g opacity={clamp(labels*2)}>
   <text x={30} y={78} fontFamily={FONT.display} fontWeight={700} fontSize={58} fill={pal.ink}>16</text>
   <text x={30+widthOf('16',58,true)+14} y={74} fontFamily={FONT.body} fontWeight={800} fontSize={30} fill={pal.ink}>installed</text>
  </g>}
 </g>;
};

export const CAL={block:228,blocks:9,h:200};
/** A calendar strip since launch: plain month blocks of day cells with no names and no red mark.
 * Its start fades out, because the launch date is not published. Origin at the strip's left end.
 * `scan` (0 to 1) passes a band of low sun along it; labels sit on paper chips so they read on a
 * wall, a visor or the sky. */
const Calendar:React.FC<{pal:Pal;now?:number;blocks?:number;scan?:number}>=({pal,now=1,blocks=CAL.blocks,scan=-1})=>{
 const id=useUid('wtcal');
 const {block,h}=CAL, W=block*blocks;
 const label='Launch, earlier this year', lw=widthOf(label,54,true);
 return <g data-part="launch-calendar">
  <defs><linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="0">
   <stop offset="0" stopColor="#fff" stopOpacity={0}/><stop offset={.24*9/blocks} stopColor="#fff" stopOpacity={1}/><stop offset="1" stopColor="#fff" stopOpacity={1}/>
  </linearGradient><mask id={`${id}m`}><rect x={-10} y={-10} width={W+20} height={h+40} fill={`url(#${id}f)`}/></mask>
  <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFE7B8" stopOpacity={0}/><stop offset=".5" stopColor="#FFE7B8" stopOpacity={.75}/><stop offset="1" stopColor="#FFE7B8" stopOpacity={0}/></linearGradient></defs>
  <g mask={`url(#${id}m)`}>
   <rect x={8} y={12} width={W} height={h} fill="#1C120B" opacity={.22}/>
   <rect x={0} y={0} width={W} height={h} fill={pal.paper} stroke="#8E8170" strokeWidth={2}/>
   {Array.from({length:blocks},(_,b)=><g key={b} transform={`translate(${b*block} 0)`}>
    <line x1={0} y1={0} x2={0} y2={h} stroke="#6F6455" strokeWidth={4}/>
    <rect x={10} y={12} width={block-20} height={22} rx={4} fill="#D9CCB2"/>
    {Array.from({length:35},(_,d)=><rect key={d} x={12+(d%7)*29} y={44+Math.floor(d/7)*30} width={23} height={23} rx={3} fill="none" stroke="#B3A68F" strokeWidth={1.6}/>)}
   </g>)}
   {scan>=0&&scan<=1&&<rect x={-260+scan*(W+260)} y={0} width={260} height={h} fill={`url(#${id}s)`}/>}
  </g>
  <rect x={6} y={-86} width={lw+40} height={70} rx={10} fill={pal.paper} opacity={.92}/>
  <text x={26} y={-34} fontFamily={FONT.body} fontWeight={800} fontSize={54} fill={pal.ink}>{label}</text>
  {/* the present end of the strip */}
  <g transform={`translate(${W} 0)`} opacity={now}>
   <rect x={-150} y={-96} width={136} height={70} rx={10} fill={pal.paper} opacity={.92}/>
   <path d={`M0 -26V${h+26}`} stroke={pal.ink} strokeWidth={8}/>
   <path d="M-20 -46H20L0 -22Z" fill={pal.ink}/>
   <text x={-26} y={-42} textAnchor="end" fontFamily={FONT.body} fontWeight={800} fontSize={54} fill={pal.ink}>Now</text>
  </g>
 </g>;
};

/** A spring binder clip, its jaw at (0,0) gripping the edge below it. */
const Clip:React.FC<{}>=()=><g data-part="binder-clip">
 <path d="M-22 -6H22L18 18H-18Z" fill="#26282A" stroke="#0F1011" strokeWidth={1.4}/>
 <path d="M-14 -6Q-16 -30 0 -34Q16 -30 14 -6" stroke="#B8BDBE" strokeWidth={3.4} fill="none"/>
 <path d="M-18 2H18" stroke="#5B5F61" strokeWidth={2}/>
</g>;

/** The lowered tailgate of the crew's white pickup seen from above: painted steel with pressed ribs,
 * a latch and red dust. The response record lies on it, on the utility's side, with no desk props.
 * Film coordinates, drawn across the lower frame only. */
const Tailgate:React.FC<{top:number}>=({top})=>{
 const id=useUid('wttg');
 return <g data-part="tailgate">
  <defs><linearGradient id={`${id}t`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F4F2EC"/><stop offset=".8" stopColor="#DAD5CA"/><stop offset="1" stopColor="#B99A84"/></linearGradient></defs>
  <path d={`M-40 ${top}H1120V${top+640}H-40Z`} fill={`url(#${id}t)`}/>
  {Array.from({length:6},(_,i)=><g key={i}>
   <rect x={-40} y={top+70+i*96} width={1160} height={22} fill="#C9C4B8" opacity={.6}/>
   <rect x={-40} y={top+70+i*96} width={1160} height={4} fill="#FFFFFF" opacity={.7}/></g>)}
  <path d={`M-40 ${top}H1120`} stroke="#8D877C" strokeWidth={8}/>
  <rect x={470} y={top+16} width={140} height={34} rx={8} fill="#3B3F40"/>
  <rect x={482} y={top+24} width={116} height={16} rx={6} fill="#7E8585"/>
  <path d={`M60 ${top+560}q300 -40 640 10`} stroke="#B98A6C" strokeWidth={34} opacity={.22} fill="none"/>
  <rect x={950} y={top+30} width={50} height={22} rx={4} fill="#A3241B"/>
 </g>;
};

/** The camera's own 360 degree picture of the dry country, laid out around the heading: far
 * mesas, a rolling ridge, scattered mesquite, a windmill, a fire station, another tower, the low
 * sun in the west and, when there is one, the plume. Every item sits at its own compass heading,
 * so a turn of the head pans the whole picture consistently. Origin at the display centre. */
const Panorama:React.FC<{heading:number;r:number;horizon?:number;ppd?:number;plume?:{heading:number;grow:number};t:number}>=
 ({heading,r,horizon=50,ppd=2.5,plume,t})=>{
 const id=useUid('wtpn');
 const span=r+60;
 const X=(h:number)=>(((h-heading)%360+540)%360-180)*ppd;
 const vis=(h:number,m=80)=>Math.abs(X(h))<span+m;
 const H=horizon;
 const prof=(h:number,k:number,a:number,b:number)=>Math.max(0,Math.min(1,(Math.sin(rad(k*h+a))+.4*Math.sin(rad(3*k*h+b)))*1.6-.5));
 const line=(f:(h:number)=>number)=>{const pts:string[]=[];for(let x=-span;x<=span;x+=6){pts.push(`${x} ${f(heading+x/ppd)}`);}return pts;};
 const mesa=line(h=>H-4-34*prof(h,2,30,70));
 const ridge=line(h=>H+2-10*prof(h,4,110,10));
 const hash=(n:number)=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
 const tufts:React.ReactNode[]=[];
 const b0=Math.floor((heading-span/ppd)/4), b1=Math.ceil((heading+span/ppd)/4);
 for(let b=b0;b<=b1;b++){const n=((b%90)+90)%90;if(hash(n)<.45)continue;const x=X(b*4+hash(n+7)*4), y=H+14+hash(n+3)*(r-20);
  const s=.4+.9*(y-H)/r;tufts.push(<path key={'g'+b} d={`M${x-8*s} ${y}q${4*s} ${-14*s} ${2*s} ${-22*s}M${x} ${y}q0 ${-16*s} ${6*s} ${-26*s}M${x+8*s} ${y}q${-2*s} ${-12*s} ${4*s} ${-18*s}`} stroke={WT.straw} strokeWidth={2.2} fill="none" opacity={.8}/>);}
 const clumps=[[18,1.1],[64,.8],[96,1.3],[132,.7],[188,1],[226,1.4],[266,.9],[312,1.2],[346,.8]].filter(([h])=>vis(h)).map(([h,k],i)=>{
  const x=X(h);return <g key={'m'+i} transform={`translate(${x} ${H+6}) scale(${k})`}>
   <ellipse cx={0} cy={-10} rx={22} ry={11} fill={WT.olive}/><ellipse cx={-10} cy={-14} rx={10} ry={7} fill={WT.oliveLit}/>
   <ellipse cx={12} cy={-8} rx={12} ry={7} fill={WT.oliveDark}/><path d="M-2 0V-6M4 0V-5" stroke={WT.bark} strokeWidth={2}/></g>;});
 const sun=vis(258,200)&&<circle cx={X(258)} cy={H-120} r={90} fill={`url(#${id}sun)`}/>;
 return <g data-part="panorama">
  <defs>
   <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#AEB8C9"/><stop offset=".75" stopColor="#E3C9A4"/><stop offset="1" stopColor="#EDCC9C"/></linearGradient>
   <linearGradient id={`${id}gr`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#A86E4E"/><stop offset="1" stopColor="#6A3E2D"/></linearGradient>
   <radialGradient id={`${id}sun`}><stop offset="0" stopColor="#FFF4D6" stopOpacity={.95}/><stop offset=".25" stopColor="#FFE2A8" stopOpacity={.6}/><stop offset="1" stopColor="#FFE2A8" stopOpacity={0}/></radialGradient>
  </defs>
  <rect x={-span} y={-r-60} width={2*span} height={r+60+H} fill={`url(#${id}sky)`}/>
  {sun}
  <path d={`M${-span} ${H}L${mesa.join('L')}L${span} ${H}Z`} fill="#8E8C98" opacity={.75}/>
  <rect x={-span} y={H} width={2*span} height={r+80} fill={`url(#${id}gr)`}/>
  <path d={`M${-span} ${H+14}L${ridge.join('L')}L${span} ${H+14}Z`} fill="#9C6A4C"/>
  {vis(196)&&<g transform={`translate(${X(196)} ${H})`}><path d="M-7 0L-1.5 -64H1.5L7 0M-5 -18H5M-3.5 -38H3.5" stroke="#5D6468" strokeWidth={1.8} fill="none"/><rect x={-3} y={-72} width={6} height={6} fill="#5D6468"/></g>}
  {vis(58)&&<g transform={`translate(${X(58)} ${H+8})`}><path d="M-9 0L-2 -40H2L9 0" stroke="#6D7373" strokeWidth={2} fill="none"/><circle cx={0} cy={-44} r={11} fill="none" stroke="#7E8585" strokeWidth={2}/></g>}
  {vis(350)&&<g transform={`translate(${X(350)} ${H+10})`}><path d="M-30 0V-24L0 -38L30 -24V0Z" fill="#D6D3CA"/><path d="M-32 -24L0 -40L32 -24" stroke="#8C3A2A" strokeWidth={3} fill="none"/><circle cx={0} cy={-28} r={5} fill="#B33A2B"/></g>}
  {clumps}
  {tufts}
  {plume&&plume.grow>0&&vis(plume.heading)&&<g transform={`translate(${X(plume.heading)} ${H+4}) scale(.62)`}><Plume t={t} grow={plume.grow} h={260}/></g>}
 </g>;
};

export const RECORD={w:620,h:420, field:[300,268,270,76] as [number,number,number,number]};
/** The response record AEP does not publish: a blank card with two empty fields. Origin top-left. */
const RecordCard:React.FC<{pulse?:number;pal:Pal}>=({pulse=0,pal})=>{
 const id=useUid('wtr');
 const {w,h,field}=RECORD;
 return <g data-part="response-record">
  <defs><linearGradient id={`${id}p`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFBF1"/><stop offset="1" stopColor="#E3D6BC"/></linearGradient></defs>
  <path d={`M10 16h${w}v${h}H10Z`} fill="#1C120B" opacity={.26}/>
  <path d={`M0 0H${w-4}L${w} 6V${h}H4L0 ${h-4}Z`} fill={`url(#${id}p)`} stroke="#8E8170" strokeWidth={2}/>
  <rect x={0} y={0} width={w} height={62} fill={pal.ink}/>
  <text x={30} y={45} fontFamily={FONT.body} fontWeight={800} fontSize={36} fill={pal.paper}>Response record</text>
  {Array.from({length:8},(_,i)=><line key={i} x1={30} y1={100+i*38} x2={w-30} y2={100+i*38} stroke="#D6CAB2" strokeWidth={1.4}/>)}
  {[[30,160,'Arrival',[300,124,270,64]],[30,300,'How much sooner',field]].map(([x,y,label,f],i)=>{
   const [fx,fy,fw,fh]=f as number[];
   return <g key={i}>
    <text x={x as number} y={y as number} fontFamily={FONT.body} fontWeight={800} fontSize={34} fill={pal.ink}>{label as string}</text>
    <rect x={fx} y={fy} width={fw} height={fh} rx={6} fill="#FFFDF7" stroke={pal.ink} strokeWidth={2.4} strokeDasharray="10 7"/>
   </g>;
  })}
  {pulse>0&&<rect x={field[0]-8} y={field[1]-8} width={field[2]+16} height={field[3]+16} rx={10} fill="none" stroke={pal.accent} strokeWidth={6} opacity={Math.sin(Math.PI*clamp(pulse))}/>}
  <path d={`M${w-90} -18v62q0 10 10 10h10`} stroke="#9AA0A2" strokeWidth={6} fill="none" strokeLinecap="round"/>
 </g>;
};

export const FOLDER={w:600,h:430, slot:[330,190,220,150] as [number,number,number,number], clip:[520,40] as Pt};
/** The filed wildfire plan in a manila folder with its open approval slot. Origin top-left. */
const Folder:React.FC<{pal:Pal;slotGlow?:number}>=({pal,slotGlow=0})=>{
 const id=useUid('wtfo');
 const {w,h,slot}=FOLDER;
 return <g data-part="plan-folder">
  <defs><linearGradient id={`${id}m`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#EED9A6"/><stop offset="1" stopColor="#C9AE72"/></linearGradient></defs>
  <path d={`M12 22h${w}v${h}H12Z`} fill="#1C120B" opacity={.28}/>
  <path d={`M0 30H40L60 0H372L390 30H${w}V${h}H0Z`} fill="#BFA265" stroke="#7E6838" strokeWidth={2}/>
  <rect x={0} y={34} width={w} height={h-34} fill={`url(#${id}m)`} stroke="#7E6838" strokeWidth={2}/>
  <rect x={6} y={26} width={w-30} height={14} fill="#F6EFE0"/>
  <text x={74} y={27} fontFamily={FONT.body} fontWeight={800} fontSize={34} fill="#4E3F1E">Wildfire plan</text>
  <g transform="translate(40 116) rotate(-4)">
   <rect x={0} y={0} width={268} height={100} rx={6} fill="none" stroke="#3E5A7A" strokeWidth={4}/>
   <text x={18} y={42} fontFamily={FONT.body} fontWeight={800} fontSize={36} fill="#3E5A7A">Filed</text>
   <text x={18} y={84} fontFamily={FONT.body} fontWeight={800} fontSize={34} fill="#3E5A7A">August 24th</text>
  </g>
  {slotGlow>0&&<rect x={slot[0]-10} y={slot[1]-10} width={slot[2]+20} height={slot[3]+20} rx={12} fill={pal.accent} opacity={.22*slotGlow}/>}
  <rect x={slot[0]} y={slot[1]} width={slot[2]} height={slot[3]} rx={8} fill="#F6EFE0" fillOpacity={.55} stroke={pal.ink} strokeWidth={3} strokeDasharray="12 8"/>
  <text x={slot[0]+slot[2]/2} y={slot[1]+slot[3]+44} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={34} fill={pal.ink}>State approval</text>
  <path d={`M40 ${h-40}q120 -8 240 4`} stroke="#A98F5A" strokeWidth={3} fill="none" opacity={.6}/>
  <circle cx={w-60} cy={h-50} r={26} fill="#B98F4A" opacity={.18}/>
  <path d={`M${FOLDER.clip[0]-16} ${FOLDER.clip[1]-60}h34v82h-34z`} fill="none" stroke="#9AA0A2" strokeWidth={6} strokeLinejoin="round"/>
 </g>;
};

/** The commission desk: a dark wood top in perspective, an inbox tray and an idle stamp on its
 * rack. Drawn across the lower frame only; the wall above stays the stage's. Film coordinates. */
const Desk:React.FC<{top:number}>=({top})=>{
 const id=useUid('wtd');
 return <g data-part="commission-desk">
  <defs><linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7A4E32"/><stop offset="1" stopColor="#4A2D1C"/></linearGradient></defs>
  <path d={`M-40 ${top}H1120V${top+620}H-40Z`} fill={`url(#${id}w)`}/>
  {Array.from({length:9},(_,i)=><path key={i} d={`M-40 ${top+30+i*60}Q540 ${top+20+i*60} 1120 ${top+34+i*60}`} stroke="#8A5C3D" strokeWidth={2} fill="none" opacity={.45}/>)}
  <path d={`M-40 ${top}H1120`} stroke="#B07A52" strokeWidth={6}/>
  <path d={`M-40 ${top+620}H1120V${top+700}H-40Z`} fill="#3A2216"/>
  {/* inbox tray at the left, a stamp idle on its rack at the right */}
  <g transform={`translate(40 ${top-10})`}>
   <path d="M0 0H220L240 -50H-20Z" fill="#6B6F70" stroke="#3B3F40" strokeWidth={2}/>
   <rect x={10} y={-62} width={200} height={14} fill="#F2EBDD"/>
  </g>
  <g transform={`translate(900 ${top+40})`}>
   <rect x={-60} y={-12} width={120} height={18} rx={4} fill="#3B2A1E"/>
   <rect x={-14} y={-92} width={28} height={80} rx={8} fill="#7A3A2A"/>
   <rect x={-34} y={-30} width={68} height={20} rx={3} fill="#2A211C"/>
  </g>
 </g>;
};

export type WestTexasSupportProps=
 | {part:'mesquite';seed:number;h?:number;lean?:number}
 | {part:'grass';seed:number;w?:number;h?:number;sway?:number}
 | {part:'road';near:[number,number,number];far:[number,number,number];bend?:number}
 | {part:'windmill';fan:number;vane:number}
 | {part:'plume';t:number;grow:number;lean?:number;h?:number}
 | {part:'shelter';w?:number}
 | {part:'fence';w:number;seed?:number}
 | {part:'station'}
 | {part:'truck';glow?:number}
 | {part:'cab';visorDown?:number;wide?:number}
 | {part:'phone';bubble?:number;buzz?:number;pal:Pal;time?:number}
 | {part:'glove';layer:'back'|'front'}
 | {part:'clock';r:number;style:'wrist'|'dash';fill:number;bound:number;pal:Pal}
 | {part:'slots';lit:number;style:'tower'|'lens';planned?:number;labels?:number;pal:Pal}
 | {part:'calendar';pal:Pal;now?:number;blocks?:number;scan?:number}
 | {part:'clip'}
 | {part:'tailgate';top:number}
 | {part:'panorama';heading:number;r:number;horizon?:number;ppd?:number;plume?:{heading:number;grow:number};t:number}
 | {part:'record';pulse?:number;pal:Pal}
 | {part:'folder';pal:Pal;slotGlow?:number}
 | {part:'desk';top:number};

/** The support group's one executable export. */
export const WestTexasSupport:React.FC<WestTexasSupportProps>=(props)=>{
 switch(props.part){
 case 'mesquite':return <Mesquite {...props}/>;
 case 'grass':return <Grass {...props}/>;
 case 'road':return <Road {...props}/>;
 case 'windmill':return <Windmill {...props}/>;
 case 'plume':return <Plume {...props}/>;
 case 'shelter':return <Shelter {...props}/>;
 case 'fence':return <Fence {...props}/>;
 case 'station':return <Station/>;
 case 'truck':return <Truck {...props}/>;
 case 'cab':return <Cab {...props}/>;
 case 'phone':return <Phone {...props}/>;
 case 'glove':return <Glove {...props}/>;
 case 'clock':return <Clock {...props}/>;
 case 'slots':return <Slots {...props}/>;
 case 'calendar':return <Calendar {...props}/>;
 case 'clip':return <Clip/>;
 case 'tailgate':return <Tailgate {...props}/>;
 case 'panorama':return <Panorama {...props}/>;
 case 'record':return <RecordCard {...props}/>;
 case 'folder':return <Folder {...props}/>;
 case 'desk':return <Desk {...props}/>;
 default:throw new Error('Unknown west Texas support part');
 }
};
