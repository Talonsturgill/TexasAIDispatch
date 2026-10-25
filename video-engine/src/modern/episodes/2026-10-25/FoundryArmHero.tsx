import React from 'react';
import {useUid} from '../../../lib/uid';

/**
 * FoundryArmHero, the fresh authored hero group for the 2026-10-25 edition (alloy-foundry-v1).
 *
 * ONE generic multi-axis robotic arm and the short sample line it works along carry the film. The
 * release says computer-controlled arms will work along an assembly line that takes samples, so the
 * arm rides a carriage on a rail behind the line bed, with its cable carrier lying along the rail to
 * the controller end. None of it is a real model: no logo, badge, wordmark, serial or livery.
 *
 *  - The arm: a warm gray rounded shell over two links (shoulder, elbow, wrist housings with dark
 *    joint rings and bolt circles), a cable loop down the upper link, a wrist flange and a two finger
 *    gripper whose long fingers are tong blades with heat pads. The carriage is scuffed and the near
 *    cover plate on the upper link sits a little crooked.
 *  - A rack of five glass element tubes with coloured pellets. The recipe takes the middle three.
 *  - A ceramic crucible with a pour lip, soot at the foot and a glaze highlight.
 *  - A top-loading furnace seen a little from above: refractory box, port in its top plate, a slid
 *    back lid, vents, a lamp, a rust drip, scorch round the port, and a glow with heat shimmer.
 *  - A clamp test rig: two columns, a crosshead with a dial gauge, a ram, two anvils and two clamps.
 *  - The sample bar (gray when cold, amber when hot, bending under the ram) and a small sample mold.
 *  - The line bed: a worn steel top, its front face, legs, and the rail behind it.
 *
 * The same objects are also drawn from straight above for treatment B's floor plan (PlanArm, PlanStations,
 * PlanCrucible, PlanTubes, PlanBar), sharing the line's x so a station sits at one x in both views.
 *
 * Coordinates are line units, x to the right, y down, the bed's working surface on y 0. Every
 * object takes its base centre at its origin. The arm is posed by armPose (two link inverse
 * kinematics, elbow up, the gripper hanging down unless tilted), a pure function the episode and its
 * bound checks share. Light: soft window key from the upper left, cool fill from the right, the
 * amber melt adding its own warm light on the arm (warm). Pure function of props: no clock, no state
 * and no random input. Disclosed illustration of a planned lab, not a Texas A&M facility, arm,
 * furnace, rig or melting method, and no measured result.
 */

export type Pt=[number,number];
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
const f2=(v:number)=>v.toFixed(2);
const RAD=Math.PI/180;

/** Paint. Amber belongs to the melt alone on this group; the shell stays warm gray. */
export const HERO_PAINT={lit:'#F2EEE6',shell:'#D8D2C7',shade:'#ABA498',deep:'#7F796F',joint:'#353C42',ring:'#565F66',
 trim:'#262C31',steel:'#8D959B',steelLit:'#BEC5CA',steelDark:'#5C646A',steelDeep:'#3E464C',bed:'#9AA2A7',bedTop:'#B9BFC2',
 refractory:'#BDB4A6',refLit:'#D8D0C3',refShade:'#958C80',ceramic:'#E6DCC8',ceramicShade:'#BBAE97',soot:'#4A4540',
 amber:'#E48A1C',hot:'#FFB648',core:'#FFE7B0',glass:'#D7E7EA',rubber:'#2E3438',rust:'#9A5A3A',cable:'#30373C'};

/** The element tubes in the rack, left to right; the recipe is the middle three. */
export const TUBES=['#9C8C7A','#4F67A8','#7FA06A','#8A5A86','#5B6167'];
export const RECIPE=[1,2,3];
export const TUBE={pitch:22,w:14,top:-74,bottom:-8,grip:-60};

/** Arm geometry in line units. */
export const ARM={L1:170,L2:160,grip:54,shoulderY:-176,carriageTop:-62,carriageBottom:-26,carriageW:96,rail:[-26,-14] as Pt};
export type ArmPose={c:number;S:Pt;E:Pt;W:Pt;P:Pt;th1:number;th2:number;tilt:number};
/** Pose the arm on carriage x `c` so its grip point (between the finger tips) sits on P, the gripper
 * rotated `tilt` degrees clockwise from hanging straight down. Elbow up; the target must lie to the
 * right of the carriage, which every station does, so the solution never flips. Pure. */
export function armPose(c:number,P:Pt,tilt=0):ArmPose{
 const a=tilt*RAD,S:Pt=[c,ARM.shoulderY];
 const W:Pt=[P[0]+ARM.grip*Math.sin(a),P[1]-ARM.grip*Math.cos(a)];
 const vx=W[0]-S[0],vy=W[1]-S[1],{L1,L2}=ARM;
 const d=Math.min(L1+L2-.5,Math.max(Math.abs(L1-L2)+1,Math.hypot(vx,vy)));
 const base=Math.atan2(vy,vx),b=Math.acos(clamp((L1*L1+d*d-L2*L2)/(2*L1*d)));
 const th1=base-b,E:Pt=[S[0]+L1*Math.cos(th1),S[1]+L1*Math.sin(th1)];
 const th2=Math.atan2(W[1]-E[1],W[0]-E[0]);
 return {c,S,E,W,P,th1,th2,tilt};
}
/** The gripper finger tips' half gap when open and when holding each object. */
export const GAP={open:46,tubes:33,crucible:36,sample:7,closed:5,release:20,port:38};

/** Furnace and rig geometry, base centre at the origin. */
export const FURNACE={half:70,top:-128,back:-150,portY:-139,portRx:46,portRy:9};
/** The ram rests high (its pad at -232, touching the bar's top at -106) and the open clamps sit at -164, so the arm can hold a sample on
 * the anvils with its wrist and gripper below the ram and clear of the crosshead and dial. `clampP` 1 brings
 * the pads to -110, just over the bar, and `seat` (1.074) seats them on it; a negative `clampP` draws the
 * clamps up toward the crosshead (`lift`, -1.6, puts the pads at -262 to -250) to clear the rig for a mold and a pour.
 * The frame is open front and back: the workpiece leaves and arrives through the rear feed (`feedY`, a slot
 * behind the base), never sideways through a column. */
export const RIG={half:80,col:64,crossY:-304,anvil:36,anvilTop:-96,dial:[0,-338] as Pt,dialR:30,ramRest:-232,ramContact:-106,clampUp:-164,clampDown:-110,sampleLen:84,clampX:40,
 seat:1.074,lift:-1.6,feedY:-58,
 /** past contact (ram 1) the pad follows the sag of the bar under its flat face (14.3 units at bend 1, which the film reaches at ram 1.85) */
 press:14.3/.85,
 /** the frame is not symmetric: the left column stands wider out (centre -92), so a tipped crucible fits
  * between it and the right column (centre col) */
 colL:-92,crossL:-107,baseL:-102};
/** Where a workpiece is drawn while it moves through the rear feed: `back` 0 on the anvils, 1 slid back
 * behind the frame (raised a little and smaller with depth), 2 dropped out of sight into the feed. */
export function feedTransform(back:number,y0:number):string{const d=Math.min(back,1),h=Math.max(0,back-1);
 return `translate(0 ${(y0-10*d+80*h).toFixed(2)}) scale(${(1-.12*d).toFixed(4)})`;}
export const CRUCIBLE={h:64,top:38,bottom:26,hold:-46};

// ---- small shared drawings -------------------------------------------------------------------------
const Bolt:React.FC<{x:number;y:number;r?:number;rust?:boolean}>=({x,y,r=3.4,rust=false})=><g>
 <circle cx={x} cy={y} r={r} fill={HERO_PAINT.steelDark}/><circle cx={x-r*.3} cy={y-r*.3} r={r*.45} fill={HERO_PAINT.steelLit}/>
 {rust&&<path d={`M${f2(x+r*.4)} ${f2(y+r)}q1 6 -.6 11`} stroke={HERO_PAINT.rust} strokeWidth={1.6} fill="none" opacity={.75}/>}
</g>;
/** A capsule link from a to b: a shaded shell with a highlight toward the window and a seam. */
const Link:React.FC<{a:Pt;b:Pt;w0:number;w1:number;warm:number}>=({a,b,w0,w1,warm})=>{
 const P=HERO_PAINT,dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L;
 // the normal that faces the window (up and left)
 let nx=-uy,ny=ux;if(nx*-.7+ny*-.7<0){nx=-nx;ny=-ny;}
 const pts=(o:number,wa:number,wb:number)=>`M${f2(a[0]+nx*wa*o)} ${f2(a[1]+ny*wa*o)}L${f2(b[0]+nx*wb*o)} ${f2(b[1]+ny*wb*o)}`;
 // the joint housings drawn over each end round the shell off
 const body=`M${f2(a[0]+nx*w0/2)} ${f2(a[1]+ny*w0/2)}L${f2(b[0]+nx*w1/2)} ${f2(b[1]+ny*w1/2)}L${f2(b[0]-nx*w1/2)} ${f2(b[1]-ny*w1/2)}L${f2(a[0]-nx*w0/2)} ${f2(a[1]-ny*w0/2)}Z`;
 return <g>
  <path d={body} fill={P.shell} stroke={P.trim} strokeWidth={2.6} strokeLinejoin="round"/>
  <path d={pts(-.3,w0,w1)} stroke={P.shade} strokeWidth={Math.min(w0,w1)*.36} strokeLinecap="round" opacity={.85}/>
  <path d={pts(.26,w0,w1)} stroke={P.lit} strokeWidth={Math.min(w0,w1)*.22} strokeLinecap="round"/>
  {warm>0&&<path d={pts(-.38,w0,w1)} stroke={P.hot} strokeWidth={Math.min(w0,w1)*.16} strokeLinecap="round" opacity={.55*warm}/>}
  <path d={pts(-.05,w0*.6,w1*.6)} stroke={P.deep} strokeWidth={1.4} opacity={.5} strokeDasharray="22 7"/>
 </g>;
};
const Joint:React.FC<{c:Pt;r:number;rot:number;warm:number}>=({c,r,rot,warm})=>{const P=HERO_PAINT;
 return <g>
  <circle cx={c[0]} cy={c[1]} r={r} fill={P.shell} stroke={P.trim} strokeWidth={2.6}/>
  <path d={`M${f2(c[0]-r*.78)} ${f2(c[1]-r*.15)}A${f2(r*.8)} ${f2(r*.8)} 0 0 1 ${f2(c[0]+r*.2)} ${f2(c[1]-r*.78)}`} stroke={P.lit} strokeWidth={r*.22} fill="none" strokeLinecap="round"/>
  <circle cx={c[0]} cy={c[1]} r={r*.62} fill={P.ring} stroke={P.trim} strokeWidth={1.6}/>
  <circle cx={c[0]} cy={c[1]} r={r*.42} fill={P.joint}/>
  {[0,1,2,3,4,5].map(k=>{const a=rot+k*60*RAD;return <circle key={k} cx={f2(c[0]+Math.cos(a)*r*.52)} cy={f2(c[1]+Math.sin(a)*r*.52)} r={r*.06+.6} fill={P.steelLit}/>;})}
  {warm>0&&<path d={`M${f2(c[0]+r*.9)} ${f2(c[1]-r*.3)}A${f2(r*.95)} ${f2(r*.95)} 0 0 1 ${f2(c[0]+r*.2)} ${f2(c[1]+r*.9)}`} stroke={P.hot} strokeWidth={r*.14} fill="none" opacity={.6*warm}/>}
 </g>;};

/** The cable carrier along the rail: a lower run from the fixed end, a loop, an upper run to the
 * carriage. Links are drawn at a fixed pitch along the path, so the chain reads as a chain. */
const CableCarrier:React.FC<{fixedX:number;c:number}>=({fixedX,c})=>{
 // the carriage rides to the left of the fixed end: the chain lies along the rail from the fixed end,
 // bends up just behind the carriage and runs back into the carriage's left side
 const P=HERO_PAINT,y0=-34,r=13,loop=c-ARM.carriageW/2-26,low=y0,up=y0-2*r;
 const links:React.ReactNode[]=[];
 const pitch=11;
 for(let x=fixedX;x>loop;x-=pitch)links.push(<rect key={'l'+x} x={f2(x-pitch+1)} y={low-5} width={pitch-2} height={10} rx={2} fill={P.trim} stroke={P.steelDeep} strokeWidth={1}/>);
 for(let x=loop;x<c-ARM.carriageW/2;x+=pitch)links.push(<rect key={'u'+x} x={f2(x+1)} y={up-5} width={pitch-2} height={10} rx={2} fill={P.rubber} stroke={P.steelDeep} strokeWidth={1}/>);
 return <g data-part="cable-carrier">
  {links}
  <path d={`M${f2(loop)} ${low}A${r} ${r} 0 0 1 ${f2(loop)} ${up}`} stroke={P.trim} strokeWidth={10} fill="none"/>
  <rect x={fixedX-6} y={low-9} width={16} height={18} rx={3} fill={P.steelDark}/>
 </g>;
};

// ---- the arm ---------------------------------------------------------------------------------------
const Arm:React.FC<{pose:ArmPose;gap:number;held?:React.ReactNode;warm?:number;chainX?:number;front?:React.ReactNode}>=
 ({pose,gap,held,warm=0,chainX=360,front})=>{
 const P=HERO_PAINT,{c,S,E,W,tilt}=pose,id=useUid('fah-arm');
 const cw=ARM.carriageW;
 const g=clamp(gap/GAP.open);
 const tipX=gap,rootX=15;
 return <g data-part="arm">
  <defs><linearGradient id={id+'col'} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={P.lit}/><stop offset=".45" stopColor={P.shell}/><stop offset="1" stopColor={P.shade}/></linearGradient></defs>
  <CableCarrier fixedX={chainX} c={c}/>
  {/* carriage on the rail */}
  <rect x={c-cw/2} y={ARM.carriageTop} width={cw} height={ARM.carriageBottom-ARM.carriageTop} rx={7} fill={P.steelDark} stroke={P.trim} strokeWidth={2.6}/>
  <rect x={c-cw/2+6} y={ARM.carriageTop+5} width={cw-12} height={7} rx={3} fill={P.steelLit} opacity={.7}/>
  <path d={`M${c+cw/2-18} ${ARM.carriageTop+20}l9 4`} stroke={P.steelLit} strokeWidth={1.6} opacity={.6}/>
  <Bolt x={c-cw/2+12} y={ARM.carriageBottom-9}/><Bolt x={c+cw/2-12} y={ARM.carriageBottom-9} rust/>
  {/* base turret and column */}
  <path d={`M${c-30} ${ARM.carriageTop}L${c-22} ${S[1]+18}L${c+22} ${S[1]+18}L${c+30} ${ARM.carriageTop}Z`} fill={`url(#${id}col)`} stroke={P.trim} strokeWidth={2.6} strokeLinejoin="round"/>
  <ellipse cx={c} cy={ARM.carriageTop} rx={36} ry={7} fill={P.shade} stroke={P.trim} strokeWidth={2.2}/>
  <path d={`M${c-12} ${ARM.carriageTop-12}V${S[1]+30}`} stroke={P.lit} strokeWidth={5} strokeLinecap="round" opacity={.8}/>
  {/* the cable from the column up the upper link */}
  <path d={`M${f2(c+20)} ${ARM.carriageTop-6}C${f2(c+44)} ${f2(S[1]+40)} ${f2((S[0]+E[0])/2+18)} ${f2((S[1]+E[1])/2+26)} ${f2(E[0]+8)} ${f2(E[1]+16)}`} stroke={P.cable} strokeWidth={6} fill="none" strokeLinecap="round"/>
  <Link a={S} b={E} w0={48} w1={40} warm={warm}/>
  <Joint c={S} r={32} rot={pose.th1} warm={warm}/>
  {/* the crooked cover plate on the upper link */}
  <g transform={`translate(${f2((S[0]+E[0])/2)} ${f2((S[1]+E[1])/2)}) rotate(${f2(pose.th1/RAD+2.5)})`}>
   <rect x={-34} y={-11} width={68} height={22} rx={6} fill={P.shell} stroke={P.deep} strokeWidth={1.6}/>
   <circle cx={-27} cy={-5} r={1.8} fill={P.deep}/><circle cx={27} cy={5} r={1.8} fill={P.deep}/>
  </g>
  <Link a={E} b={W} w0={38} w1={30} warm={warm}/>
  <Joint c={E} r={25} rot={pose.th2} warm={warm}/>
  {/* wrist and gripper, in the tool frame (origin at the wrist, the tool axis along +y) */}
  <g transform={`translate(${f2(W[0])} ${f2(W[1])}) rotate(${f2(tilt)})`}>
   <circle cx={0} cy={0} r={19} fill={P.shell} stroke={P.trim} strokeWidth={2.4}/>
   <circle cx={0} cy={0} r={10} fill={P.joint}/><circle cx={-3} cy={-3} r={3} fill={P.steelLit}/>
   <rect x={-23} y={10} width={46} height={10} rx={3} fill={P.steelDark} stroke={P.trim} strokeWidth={2}/>
   <rect x={-21} y={19} width={42} height={16} rx={4} fill={P.steel} stroke={P.trim} strokeWidth={2}/>
   <rect x={-18} y={21} width={14} height={4} rx={2} fill={P.steelLit}/>
   {[-1,1].map(s=>{const flare=lerp(2,5,g);return <g key={s}>
    {/* a tong blade from the gripper body to its pad, splayed a little more when open */}
    <path d={`M${f2(s*(rootX+6))} 33L${f2(s*(tipX+flare))} ${ARM.grip-4}L${f2(s*(tipX+1))} ${ARM.grip+3}L${f2(s*(tipX-2))} ${ARM.grip-2}L${f2(s*(rootX-6))} 33Z`}
     fill={P.steelDeep} stroke={P.trim} strokeWidth={1.8} strokeLinejoin="round"/>
    <path d={`M${f2(s*rootX)} 36L${f2(s*(tipX+flare*.5))} ${ARM.grip-8}`} stroke={P.steelLit} strokeWidth={1.6} opacity={.7}/>
    <rect x={f2(s>0?tipX-5:-tipX-1)} y={ARM.grip-9} width={6} height={10} rx={2} fill={P.rubber}/>
   </g>;})}
   {held&&<g transform={`translate(0 ${ARM.grip})`}>{held}</g>}
  </g>
  {front}
 </g>;
};

// ---- the element tubes ------------------------------------------------------------------------------
const Tube:React.FC<{x:number;color:string;y0?:number}>=({x,color,y0=0})=>{const P=HERO_PAINT,w=TUBE.w,top=TUBE.top+y0,bot=TUBE.bottom+y0;
 return <g>
  <rect x={x-w/2} y={top+8} width={w} height={bot-top-8} rx={w/2} fill={P.glass} stroke={P.trim} strokeWidth={1.8} opacity={.92}/>
  <rect x={x-w/2+2} y={top+30} width={w-4} height={bot-top-34} rx={(w-4)/2} fill={color}/>
  {[0,1,2].map(k=><circle key={k} cx={x-3+k*3} cy={top+32+k*5} r={1.6} fill="#FFFFFF" opacity={.35}/>)}
  <rect x={x-w/2+2.5} y={top+12} width={2.6} height={bot-top-22} rx={1.3} fill="#FFFFFF" opacity={.75}/>
  <rect x={x-w/2-1.5} y={top} width={w+3} height={10} rx={2.5} fill={P.rubber}/>
 </g>;};
/** The recipe's three tubes, drawn in the gripper's frame (grip point at the origin). */
export const RecipeTubes:React.FC<{}>=()=><g data-part="recipe-tubes">
 {RECIPE.map((k,i)=><Tube key={k} x={(i-1)*TUBE.pitch} color={TUBES[k]} y0={-TUBE.grip}/>)}
</g>;
const Rack:React.FC<{taken:boolean}>=({taken})=>{const P=HERO_PAINT,half=62;
 return <g data-part="tube-rack">
  <ellipse cx={8} cy={2} rx={72} ry={7} fill="#1A1D20" opacity={.22}/>
  {TUBES.map((c,k)=>(taken&&RECIPE.includes(k))?null:<Tube key={k} x={(k-2)*TUBE.pitch} color={c}/>)}
  <path d={`M${-half} -34L${half} -34L${half+4} 0L${-half-2} 0Z`} fill={P.steel} stroke={P.trim} strokeWidth={2.4} strokeLinejoin="round"/>
  <rect x={-half+4} y={-31} width={2*half-14} height={6} rx={3} fill={P.steelLit} opacity={.75}/>
  {TUBES.map((_,k)=><ellipse key={k} cx={(k-2)*TUBE.pitch} cy={-30} rx={8} ry={2.6} fill={P.steelDeep}/>)}
  <path d={`M${half-20} -10l12 3`} stroke={P.steelLit} strokeWidth={1.4}/>
  <Bolt x={-half+9} y={-12} r={3}/><Bolt x={half-9} y={-12} r={3} rust/>
 </g>;};

// ---- crucible ---------------------------------------------------------------------------------------
/** Base centre at the origin. `fill` 0..1 how full, `glow` 0..1 molten, `mixed` 0..1 the pellets settled. */
const Crucible:React.FC<{fill:number;glow:number;mixed?:number;lip?:boolean}>=({fill,glow,mixed=1,lip=true})=>{
 const P=HERO_PAINT,{h,top,bottom}=CRUCIBLE,id=useUid('fah-cru');
 const outer=`M${-bottom} 0Q${-bottom-4} ${-h*.45} ${-top} ${-h}L${top} ${-h}Q${bottom+4} ${-h*.45} ${bottom} 0Z`;
 const level=-h+4+(1-fill)*10;
 return <g data-part="crucible">
  <defs><linearGradient id={id+'g'} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={P.ceramic}/><stop offset=".55" stopColor={P.ceramic}/><stop offset="1" stopColor={P.ceramicShade}/></linearGradient>
   <radialGradient id={id+'h'} cx=".5" cy=".5" r=".5"><stop offset="0" stopColor={P.core} stopOpacity={.9}/><stop offset=".5" stopColor={P.hot} stopOpacity={.45}/><stop offset="1" stopColor={P.amber} stopOpacity={0}/></radialGradient></defs>
  {glow>0&&<ellipse cx={0} cy={-h} rx={top*2.4} ry={top*1.7} fill={`url(#${id}h)`} opacity={glow}/>}
  <path d={outer} fill={`url(#${id}g)`} stroke={P.trim} strokeWidth={2.6} strokeLinejoin="round"/>
  <path d={`M${-bottom+3} -4Q${-bottom} ${-h*.2} ${-bottom-3} ${-h*.34}L${bottom+3} ${-h*.34}Q${bottom} ${-h*.2} ${bottom-3} -4Z`} fill={P.soot} opacity={.38}/>
  <path d={`M${-top+9} ${-h+8}Q${-bottom-1} ${-h*.5} ${-bottom+5} ${-h*.18}`} stroke="#FFFFFF" strokeWidth={5} fill="none" strokeLinecap="round" opacity={.5}/>
  {glow>0&&<path d={outer} fill={P.hot} opacity={.22*glow}/>}
  <ellipse cx={0} cy={-h} rx={top} ry={7.5} fill={P.ceramicShade} stroke={P.trim} strokeWidth={2.4}/>
  <ellipse cx={0} cy={-h+1} rx={top-6} ry={5} fill="#2C2622"/>
  {fill>0&&<g>
   <ellipse cx={0} cy={level} rx={(top-7)*(.9+.1*fill)} ry={4.4} fill={glow>.02?P.hot:TUBES[RECIPE[1]]} opacity={glow>.02?1:.95}/>
   {glow<.98&&mixed<1&&RECIPE.map((k,i)=><ellipse key={k} cx={(i-1)*12} cy={level} rx={7} ry={3} fill={TUBES[k]} opacity={(1-glow)*(1-mixed)}/>)}
   {glow<.98&&mixed>=1&&RECIPE.map((k,i)=><circle key={k} cx={(i-1)*11+3} cy={level-.5} r={2.6} fill={TUBES[k]} opacity={1-glow}/>)}
   {glow>0&&<ellipse cx={0} cy={level} rx={(top-7)*.9} ry={4.4} fill={P.core} opacity={glow*.8}/>}
  </g>}
  {lip&&<path d={`M${top-4} ${-h-3}l13 -6l3 6l-10 5Z`} fill={P.ceramic} stroke={P.trim} strokeWidth={2}/>}
 </g>;};

// ---- furnace ----------------------------------------------------------------------------------------
/** The back layer: the top plate behind the port, the slid back lid, the port's hot interior. Objects
 * lowered into the port are drawn between this and FurnaceFront. */
const FurnaceBack:React.FC<{glow:number;t:number}>=({glow,t})=>{
 const P=HERO_PAINT,{half,top,back,portY,portRx,portRy}=FURNACE,id=useUid('fah-fb');
 return <g data-part="furnace-back">
  <defs><radialGradient id={id+'p'} cx=".5" cy=".6" r=".6"><stop offset="0" stopColor={P.core}/><stop offset=".45" stopColor={P.hot}/><stop offset="1" stopColor={P.amber}/></radialGradient>
   <radialGradient id={id+'s'} cx=".5" cy="1" r="1"><stop offset="0" stopColor={P.hot} stopOpacity={.55}/><stop offset="1" stopColor={P.amber} stopOpacity={0}/></radialGradient></defs>
  {glow>0&&<ellipse cx={0} cy={portY-40} rx={140} ry={120} fill={`url(#${id}s)`} opacity={glow}/>}
  <path d={`M${-half} ${top}L${-half+20} ${back}L${half-6} ${back}L${half} ${top}Z`} fill={P.refLit} stroke={P.trim} strokeWidth={2.6} strokeLinejoin="round"/>
  <ellipse cx={0} cy={portY} rx={portRx+8} ry={portRy+3} fill={P.refShade} opacity={.9}/>
  <path d={`M${-portRx-14} ${portY+2}q20 -9 46 -12`} stroke={P.soot} strokeWidth={5} opacity={.28} fill="none"/>
  <ellipse cx={0} cy={portY} rx={portRx} ry={portRy} fill="#2A1E16" stroke={P.trim} strokeWidth={2.4}/>
  {glow>0&&<ellipse cx={0} cy={portY+1} rx={portRx-4} ry={portRy-2} fill={`url(#${id}p)`} opacity={glow}/>}
  {/* the lid, slid back on its rails */}
  <path d={`M${portRx+4} ${back-6}L${half+4} ${back-6}L${half+8} ${back+8}L${portRx+2} ${back+8}Z`} fill={P.refractory} stroke={P.trim} strokeWidth={2.2}/>
  <rect x={portRx+16} y={back-12} width={24} height={7} rx={3} fill={P.steelDark}/>
  {/* heat shimmer, deterministic in t */}
  {glow>.05&&[0,1,2].map(k=>{const ph=t*3.1+k*2.1,x=-24+k*24,a=6*Math.sin(ph);
   return <path key={k} d={`M${f2(x)} ${portY-12}c${f2(a)} -16 ${f2(-a)} -30 ${f2(a*.6)} -46s${f2(-a)} -30 ${f2(a*.4)} -46`} stroke={P.core} strokeWidth={2.4} fill="none" opacity={.35*glow} strokeLinecap="round"/>;})}
 </g>;};
const FurnaceFront:React.FC<{glow:number}>=({glow})=>{
 const P=HERO_PAINT,{half,top,portY,portRx,portRy}=FURNACE,id=useUid('fah-ff');
 return <g data-part="furnace-front">
  <defs><linearGradient id={id+'b'} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={P.refLit}/><stop offset=".5" stopColor={P.refractory}/><stop offset="1" stopColor={P.refShade}/></linearGradient></defs>
  {/* the top plate in front of the port, cut to the port's near rim */}
  <path d={`M${-half} ${top}L${-portRx} ${portY}A${portRx} ${portRy} 0 0 0 ${portRx} ${portY}L${half} ${top}Z`} fill={P.refLit} stroke={P.trim} strokeWidth={2.4} strokeLinejoin="round"/>
  {glow>0&&<path d={`M${-portRx+3} ${portY+1}A${portRx-3} ${portRy-1} 0 0 0 ${portRx-3} ${portY+1}`} stroke={P.hot} strokeWidth={3} fill="none" opacity={glow}/>}
  <rect x={-half} y={top} width={2*half} height={-top} rx={6} fill={`url(#${id}b)`} stroke={P.trim} strokeWidth={2.8}/>
  <rect x={-half+14} y={top+18} width={2*half-28} height={-top-44} rx={8} fill="none" stroke={P.refShade} strokeWidth={3}/>
  {[0,1,2,3,4].map(k=><path key={k} d={`M${-half+30+k*14} ${top+34}l8 26`} stroke={P.steelDeep} strokeWidth={4} strokeLinecap="round" opacity={.7}/>)}
  <circle cx={half-30} cy={top+40} r={7} fill={glow>.3?P.hot:P.steelDark} stroke={P.trim} strokeWidth={2}/>
  {glow>.3&&<circle cx={half-30} cy={top+40} r={14} fill={P.hot} opacity={.25*glow}/>}
  <rect x={half-48} y={top+70} width={30} height={8} rx={3} fill={P.steelDark}/>
  <path d={`M${-half+8} ${top+8}H${half-20}`} stroke="#FFFFFF" strokeWidth={4} opacity={.35} strokeLinecap="round"/>
  <Bolt x={-half+12} y={-14}/><Bolt x={half-12} y={-14} rust/><Bolt x={-half+12} y={top+12}/>
  <path d={`M${-24} ${top+6}q6 9 2 18`} stroke={P.soot} strokeWidth={3} opacity={.25} fill="none"/>
  <rect x={-half-4} y={-8} width={2*half+8} height={8} rx={2} fill={P.steelDeep}/>
 </g>;};

// ---- sample, mold and stream ------------------------------------------------------------------------
/** Centre of the bar at the origin, lying along x. `temp` 0 gray to 1 glowing amber; `bend` 0..1 the
 * mid-span sag under the ram, between the anvils' inner edges only: over the anvils the bar stays flat. */
const Sample:React.FC<{temp:number;bend?:number;len?:number}>=({temp,bend=0,len=RIG.sampleLen})=>{
 const P=HERO_PAINT,h=10,s=bend*15,L=len/2,id=useUid('fah-s');
 const col=temp>0?mix('#9AA0A4',temp<.5?'#C9603A':P.hot,clamp(temp*1.4)):'#9AA0A4';
 const xi=Math.min(L,RIG.anvil-7),top=`M${-L} ${-h/2}L${-xi} ${-h/2}Q0 ${f2(-h/2+2*s)} ${xi} ${-h/2}L${L} ${-h/2}`,bot=`L${L} ${h/2}L${xi} ${h/2}Q0 ${f2(h/2+2*s)} ${-xi} ${h/2}L${-L} ${h/2}Z`;
 return <g data-part="sample">
  <defs><radialGradient id={id} cx=".5" cy=".5" r=".5"><stop offset="0" stopColor={P.hot} stopOpacity={.6}/><stop offset="1" stopColor={P.amber} stopOpacity={0}/></radialGradient></defs>
  {temp>.05&&<ellipse cx={0} cy={s} rx={L*1.5} ry={34} fill={`url(#${id})`} opacity={temp}/>}
  <path d={top+bot} fill={col} stroke={P.trim} strokeWidth={2}/>
  <path d={`M${-L+5} ${-h/2+2}L${-xi} ${-h/2+2}Q0 ${f2(-h/2+2+2*s)} ${xi} ${-h/2+2}L${L-5} ${-h/2+2}`} stroke={temp>.3?P.core:'#D7DCDF'} strokeWidth={2} fill="none" opacity={.85}/>
  {[-.6,-.2,.25].map((u,k)=><path key={k} d={`M${f2(u*L)} ${f2(-1+s*(1-u*u))}l6 2`} stroke={P.steelDark} strokeWidth={1} opacity={.4*(1-temp)}/>)}
 </g>;};
/** The sample mold, its base centre at the origin (it sits on the rig's anvils). */
const Mold:React.FC<{fill:number;glow:number}>=({fill,glow})=>{const P=HERO_PAINT,id=useUid('fah-m');
 return <g data-part="mold">
  <defs><radialGradient id={id} cx=".5" cy=".5" r=".5"><stop offset="0" stopColor={P.core} stopOpacity={.75}/><stop offset=".5" stopColor={P.hot} stopOpacity={.35}/><stop offset="1" stopColor={P.amber} stopOpacity={0}/></radialGradient></defs>
  {glow>0&&<ellipse cx={0} cy={-26} rx={120} ry={70} fill={`url(#${id})`} opacity={glow}/>}
  <path d={`M-52 0L-50 -30L50 -30L52 0Z`} fill={P.steelDark} stroke={P.trim} strokeWidth={2.4} strokeLinejoin="round"/>
  <path d={`M-46 -27H40`} stroke={P.steelLit} strokeWidth={3} opacity={.7}/>
  <rect x={-38} y={-31} width={76} height={14} rx={3} fill="#1E2226" stroke={P.trim} strokeWidth={1.6}/>
  {fill>0&&<rect x={-36} y={f2(-18-12*fill)} width={72} height={f2(12*fill)} rx={3} fill={glow>.02?P.hot:'#9AA0A4'}/>}
  {fill>0&&glow>0&&<rect x={-30} y={f2(-18-12*fill)} width={60} height={3} rx={1.5} fill={P.core} opacity={glow}/>}
  <Bolt x={-44} y={-9} r={2.6}/><Bolt x={44} y={-9} r={2.6}/>
 </g>;};
const Stream:React.FC<{from:Pt;to:Pt;p:number;t:number}>=({from,to,p,t})=>{
 const P=HERO_PAINT;if(p<=0)return null;
 const y=lerp(from[1],to[1],clamp(p*1.6)),x=lerp(from[0],to[0],.85);
 const wob=1.6*Math.sin(t*19);
 return <g data-part="melt-stream">
  <path d={`M${f2(from[0])} ${f2(from[1])}Q${f2(from[0]+(x-from[0])*.9+wob)} ${f2(from[1]+4)} ${f2(x+wob*.5)} ${f2(y)}`} stroke={P.hot} strokeWidth={9} fill="none" strokeLinecap="round"/>
  <path d={`M${f2(from[0])} ${f2(from[1])}Q${f2(from[0]+(x-from[0])*.9+wob)} ${f2(from[1]+4)} ${f2(x+wob*.5)} ${f2(y)}`} stroke={P.core} strokeWidth={3.4} fill="none" strokeLinecap="round"/>
  <circle cx={f2(x+wob*.5)} cy={f2(y)} r={18} fill={P.hot} opacity={.25}/>
 </g>;};
function mix(a:string,b:string,p:number){
 const h=(s:string)=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));const A=h(a),B=h(b);
 return '#'+A.map((v,i)=>Math.round(lerp(v,B[i],clamp(p))).toString(16).padStart(2,'0')).join('');
}

// ---- rig --------------------------------------------------------------------------------------------
/** Base centre at the origin. `ram` 0 at rest to 1 in contact (beyond 1 it presses: the sample bends),
 * `clamp` 0 open to 1 closed, `needle` degrees from rest. The rig carries the sample or the mold that
 * the arm has set on it. */
type RigSample={temp:number;bend:number;back?:number};
type RigMold={fill:number;glow:number;back?:number};
const Rig:React.FC<{ram:number;clampP:number;needle:number;sample?:RigSample|null;mold?:RigMold|null;warm?:number;feed?:number;ratchet?:number}>=
 ({ram,clampP,needle,sample,mold,warm=0,feed=0,ratchet=0})=>{
 const P=HERO_PAINT,{half,col,crossY,anvil,anvilTop,dial,dialR}=RIG,id=useUid('fah-rig');
 const ramTip=lerp(RIG.ramRest,RIG.ramContact,Math.min(ram,1))+Math.max(0,ram-1)*RIG.press;
 const clampY=lerp(RIG.clampUp,RIG.clampDown,clampP);
 return <g data-part="test-rig">
  <defs><linearGradient id={id+'c'} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={P.steelLit}/><stop offset=".5" stopColor={P.steel}/><stop offset="1" stopColor={P.steelDark}/></linearGradient></defs>
  <ellipse cx={(RIG.baseL+half)/2+10} cy={2} rx={(half-RIG.baseL)/2+16} ry={7} fill="#1A1D20" opacity={.22}/>
  {/* behind the frame: the rear feed slot and anything travelling through it, cut off at the base */}
  <defs><clipPath id={id+'k'}><rect x={RIG.baseL} y={crossY} width={half-RIG.baseL} height={-16-crossY}/></clipPath></defs>
  {feed>0&&<g opacity={f2(clamp(feed))} data-part="rig-rear-feed">
   <rect x={-50} y={RIG.feedY} width={100} height={-16-RIG.feedY} rx={4} fill="#1E2226" stroke={P.trim} strokeWidth={2}/>
   <path d={`M-46 ${RIG.feedY+4}H46`} stroke={P.steelLit} strokeWidth={2} opacity={.5}/></g>}
  <g clipPath={`url(#${id}k)`}>
   {mold&&(mold.back??0)>0&&<g transform={feedTransform(mold.back??0,anvilTop)}><Mold fill={mold.fill} glow={mold.glow}/></g>}
   {sample&&(sample.back??0)>0&&<g transform={feedTransform(sample.back??0,anvilTop-5)}><Sample temp={sample.temp} bend={sample.bend}/></g>}
  </g>
  {[RIG.colL,col].map(x=><rect key={x} x={x-9} y={crossY} width={18} height={-crossY} fill={`url(#${id}c)`} stroke={P.trim} strokeWidth={2.2}/>)}
  <rect x={RIG.baseL} y={-16} width={half-RIG.baseL} height={16} rx={3} fill={P.steelDark} stroke={P.trim} strokeWidth={2.4}/>
  {[-anvil,anvil].map(x=><path key={x} d={`M${x-12} -16L${x-7} ${anvilTop}L${x+7} ${anvilTop}L${x+12} -16Z`} fill={P.steel} stroke={P.trim} strokeWidth={2}/>)}
  {mold&&!((mold.back??0)>0)&&<g transform={`translate(0 ${anvilTop})`}><Mold fill={mold.fill} glow={mold.glow}/></g>}
  {sample&&!((sample.back??0)>0)&&<g transform={`translate(0 ${anvilTop-5})`}><Sample temp={sample.temp} bend={sample.bend}/></g>}
  {/* the clamps over each end */}
  {[-1,1].map(s=><g key={s}>
   <rect x={s*RIG.clampX-8} y={crossY+40} width={16} height={f2(Math.max(0,clampY-crossY-40))} fill={P.steelDark} opacity={.9}/>
   <rect x={s*RIG.clampX-14} y={f2(clampY-12)} width={28} height={12} rx={3} fill={P.steelDeep} stroke={P.trim} strokeWidth={2}/>
  </g>)}
  {/* the ram */}
  <rect x={-11} y={crossY+20} width={22} height={ramTip-crossY-28} fill={`url(#${id}c)`} stroke={P.trim} strokeWidth={2}/>
  <path d={`M-16 ${ramTip-10}H16L6 ${ramTip}H-6Z`} fill={P.steelDeep} stroke={P.trim} strokeWidth={2}/>
  <rect x={RIG.crossL} y={crossY-4} width={half+6-RIG.crossL} height={30} rx={5} fill={P.steel} stroke={P.trim} strokeWidth={2.6}/>
  <path d={`M${RIG.crossL+6} ${crossY+3}H${half-10}`} stroke={P.steelLit} strokeWidth={4} strokeLinecap="round"/>
  <Bolt x={RIG.crossL+10} y={crossY+16}/><Bolt x={half-4} y={crossY+16} rust/>
  {/* each clamp's ratchet wheel on the crosshead's face, over its screw: it turns a tooth per click as the
     pad is screwed down, with its pawl dropping into the teeth */}
  {[-1,1].map(s=><g key={'r'+s}>
   <g transform={`translate(${s*RIG.clampX} ${crossY+11}) rotate(${f2(s*45*ratchet)})`}>
    <circle cx={0} cy={0} r={8} fill={P.steelDark} stroke={P.trim} strokeWidth={1.8}/>
    {Array.from({length:8},(_,k)=>{const a=k*45*RAD;return <path key={k} d={`M${f2(Math.cos(a)*8)} ${f2(Math.sin(a)*8)}L${f2(Math.cos(a+.3)*11)} ${f2(Math.sin(a+.3)*11)}L${f2(Math.cos(a+.6)*8)} ${f2(Math.sin(a+.6)*8)}`} fill={P.steelDark} stroke={P.trim} strokeWidth={1.2}/>;})}
    <circle cx={0} cy={0} r={2.6} fill={P.steelLit}/></g>
   <path d={`M${s*(RIG.clampX+20)} ${crossY+2}l${s*-8} 6`} stroke={P.trim} strokeWidth={3} strokeLinecap="round"/>
   {/* the ratchet's lever: each click it swings out and back while the wheel advances a tooth */}
   <g transform={`translate(${s*RIG.clampX} ${crossY+11}) rotate(${f2(s*(20+34*Math.sin(Math.PI*(ratchet-Math.floor(ratchet)))))})`}>
    <rect x={-3} y={-32} width={6} height={32} rx={3} fill={P.steel} stroke={P.trim} strokeWidth={1.6}/>
    <circle cx={0} cy={-32} r={5} fill={P.rubber} stroke={P.trim} strokeWidth={1.4}/></g>
  </g>)}
  {warm>0&&<path d={`M${col+9} ${crossY+30}V-20`} stroke={P.hot} strokeWidth={3} opacity={.4*warm}/>}
  {/* the dial gauge on the crosshead */}
  <rect x={-6} y={dial[1]+dialR-4} width={12} height={crossY-dial[1]-dialR+6} fill={P.steelDark}/>
  <circle cx={dial[0]} cy={dial[1]} r={dialR+5} fill={P.steelDark} stroke={P.trim} strokeWidth={2.4}/>
  <circle cx={dial[0]} cy={dial[1]} r={dialR} fill="#F4EFE4"/>
  {Array.from({length:11},(_,k)=>{const a=(-210+k*24)*RAD;return <path key={k} d={`M${f2(Math.cos(a)*dialR*.78)} ${f2(dial[1]+Math.sin(a)*dialR*.78)}L${f2(Math.cos(a)*dialR*.92)} ${f2(dial[1]+Math.sin(a)*dialR*.92)}`} stroke={P.trim} strokeWidth={k%5===0?2.4:1.4}/>;})}
  <g transform={`translate(${dial[0]} ${dial[1]}) rotate(${f2(-210+90+needle)})`}><path d={`M-2.4 4L0 ${-dialR*.86}L2.4 4Z`} fill="#B5432F"/></g>
  <circle cx={dial[0]} cy={dial[1]} r={4} fill={P.trim}/>
  <path d={`M${-dialR*.7} ${dial[1]-dialR*.5}A${dialR*.85} ${dialR*.85} 0 0 1 ${-dialR*.1} ${dial[1]-dialR*.84}`} stroke="#FFFFFF" strokeWidth={3} fill="none" opacity={.7}/>
 </g>;};

// ---- the line bed and its rail ----------------------------------------------------------------------
const Bed:React.FC<{x0:number;x1:number;floor:number;glowX?:number;glow?:number}>=({x0,x1,floor,glowX=0,glow=0})=>{
 const P=HERO_PAINT,id=useUid('fah-bed');
 return <g data-part="line-bed">
  <defs><radialGradient id={id+'w'} cx=".5" cy=".5" r=".5"><stop offset="0" stopColor={P.hot} stopOpacity={.5}/><stop offset="1" stopColor={P.amber} stopOpacity={0}/></radialGradient>
   <linearGradient id={id+'f'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={P.steel}/><stop offset="1" stopColor={P.steelDark}/></linearGradient></defs>
  {/* legs to the floor, a stretcher, levelling feet */}
  {[x0+30,x1-40,(x0+x1)/2-12].map((x,k)=><g key={k}><rect x={x-11} y={60} width={22} height={floor-60} fill={P.steelDark} stroke={P.trim} strokeWidth={2}/>
   <rect x={x-17} y={floor-8} width={34} height={8} rx={2} fill={P.rubber}/></g>)}
  <rect x={x0+30} y={floor-80} width={x1-x0-70} height={10} fill={P.steelDeep} opacity={.8}/>
  <ellipse cx={(x0+x1)/2+20} cy={floor} rx={(x1-x0)*.55} ry={14} fill="#16191C" opacity={.22}/>
  {/* the rail behind the bed */}
  <rect x={x0+6} y={ARM.rail[0]} width={x1-x0-12} height={ARM.rail[1]-ARM.rail[0]} fill={P.steelDeep} stroke={P.trim} strokeWidth={2}/>
  <path d={`M${x0+10} ${ARM.rail[0]+3}H${x1-10}`} stroke={P.steelLit} strokeWidth={2} opacity={.6}/>
  {/* the working top, a little from above, and its front face */}
  <path d={`M${x0} 6L${x0+8} -14L${x1-6} -14L${x1} 6Z`} fill={P.bedTop} stroke={P.trim} strokeWidth={2.4} strokeLinejoin="round"/>
  {glow>0&&<ellipse cx={glowX} cy={-4} rx={150} ry={16} fill={`url(#${id}w)`} opacity={glow}/>}
  {[[x0+80,-6,60],[x0+220,-2,40],[x1-160,-8,70]].map(([x,y,w],k)=><path key={k} d={`M${x} ${y}l${w} ${k===1?-2:1}`} stroke={P.steelLit} strokeWidth={1.4} opacity={.7}/>)}
  <rect x={x0} y={6} width={x1-x0} height={56} fill={`url(#${id}f)`} stroke={P.trim} strokeWidth={2.4}/>
  <path d={`M${x0+4} 10H${x1-4}`} stroke={P.steelLit} strokeWidth={3} opacity={.55}/>
  <path d={`M${x0+150} 40q14 5 26 -1`} stroke={P.steelDeep} strokeWidth={2} fill="none" opacity={.7}/>
  {Array.from({length:Math.floor((x1-x0)/140)},(_,k)=><Bolt key={k} x={x0+40+k*140} y={34} rust={k===2}/>)}
 </g>;};


// ---- the plan view: the same line from straight above (treatment B) ---------------------------------
/** Plan units share the line's x; y is depth (the bed's centre line on y 0, the rail behind at negative
 * y). The arm is drawn from above as its carriage, two articulated segments and a gripper; height shows
 * only as the offset of the shadow under the wrist and what it holds. */
export const PLAN={bedHalf:60,railY:-104,wireY:-150,L1:170,L2:160,x0:-440,x1:440,panel:[330,-6] as Pt,cru:-170,furn:-40,rig:142};
export type PlanPose={c:number;S:Pt;E:Pt;W:Pt};
/** Two-link plan inverse kinematics from the carriage's shoulder to the wrist, the elbow always on the rail
 * side (behind), so the drawing never flips. Pure. */
export function planPose(c:number,W:Pt):PlanPose{
 const S:Pt=[c,PLAN.railY],vx=W[0]-S[0],vy=W[1]-S[1],{L1,L2}=PLAN;
 const d=Math.min(L1+L2-.5,Math.max(Math.abs(L1-L2)+1,Math.hypot(vx,vy)));
 const base=Math.atan2(vy,vx),b=Math.acos(clamp((L1*L1+d*d-L2*L2)/(2*L1*d)));
 const e1:Pt=[S[0]+L1*Math.cos(base-b),S[1]+L1*Math.sin(base-b)],e2:Pt=[S[0]+L1*Math.cos(base+b),S[1]+L1*Math.sin(base+b)];
 return {c,S,E:e1[1]<e2[1]?e1:e2,W};
}
const PlanSegment:React.FC<{a:Pt;b:Pt;w:number}>=({a,b,w})=>{const P=HERO_PAINT;
 return <g><path d={`M${f2(a[0])} ${f2(a[1])}L${f2(b[0])} ${f2(b[1])}`} stroke={P.trim} strokeWidth={w+5} strokeLinecap="round"/>
  <path d={`M${f2(a[0])} ${f2(a[1])}L${f2(b[0])} ${f2(b[1])}`} stroke={P.shell} strokeWidth={w} strokeLinecap="round"/>
  <path d={`M${f2(a[0])} ${f2(a[1]-w*.22)}L${f2(b[0])} ${f2(b[1]-w*.22)}`} stroke={P.lit} strokeWidth={w*.3} strokeLinecap="round"/></g>;};
/** The arm from above. `lift` is the grip's height above the bed (line units), which only moves the shadow;
 * `held` is drawn at the wrist in plan units. */
const PlanArm:React.FC<{pose:PlanPose;gap:number;lift:number;held?:React.ReactNode;warm?:number}>=({pose,gap,lift,held,warm=0})=>{
 const P=HERO_PAINT,{c,S,E,W}=pose,sh=Math.max(0,lift)*.16;
 return <g data-part="plan-arm">
  <rect x={c-48} y={PLAN.railY-16} width={96} height={32} rx={6} fill={P.steelDark} stroke={P.trim} strokeWidth={2.4}/>
  <rect x={c-42} y={PLAN.railY-12} width={84} height={6} rx={3} fill={P.steelLit} opacity={.6}/>
  {/* the shadow of what the gripper holds, falling down and right with height */}
  <g transform={`translate(${f2(sh)} ${f2(sh*1.3)})`} opacity={.32}>{held&&<g transform={`translate(${f2(W[0])} ${f2(W[1])})`}><g style={{filter:'brightness(0)'}}>{held}</g></g>}
   <circle cx={W[0]} cy={W[1]} r={18} fill="#0B1014"/></g>
  <PlanSegment a={S} b={E} w={40}/>
  <PlanSegment a={E} b={W} w={32}/>
  {warm>0&&<path d={`M${f2(E[0])} ${f2(E[1]+12)}L${f2(W[0])} ${f2(W[1]+10)}`} stroke={P.hot} strokeWidth={5} opacity={.45*warm} strokeLinecap="round"/>}
  {[S,E].map((j,k)=><g key={k}><circle cx={j[0]} cy={j[1]} r={k?22:28} fill={P.shell} stroke={P.trim} strokeWidth={2.4}/>
   <circle cx={j[0]} cy={j[1]} r={k?12:15} fill={P.joint}/><circle cx={j[0]-4} cy={j[1]-4} r={4} fill={P.steelLit}/></g>)}
  {held&&<g transform={`translate(${f2(W[0])} ${f2(W[1])})`}>{held}</g>}
  {/* the gripper seen from above: its flange and two tong tips closing across the line */}
  <circle cx={W[0]} cy={W[1]} r={17} fill={P.shell} stroke={P.trim} strokeWidth={2.2}/>
  {[-1,1].map(s=><rect key={s} x={W[0]-5} y={f2(W[1]+s*(gap*.55+6)-4)} width={10} height={8} rx={2} fill={P.steelDeep} stroke={P.trim} strokeWidth={1.4}/>)}
  <circle cx={W[0]} cy={W[1]} r={7} fill={P.joint}/>
 </g>;};
/** The stations from above: bed and rail, the tube rack, the crucible pad (and crucible if it is there),
 * the furnace with its port glowing, and the test rig turned so its crosshead runs front to back over the
 * sample, which stays visible on both sides. */
export type PlanState={rackTaken:boolean;crucible:{where:'pad'|'held'|'furnace'|'none';fill:number;glow:number;mixed:number};furnace:number;
 rig:{ram:number;clampP:number;needle:number;sample:{temp:number;bend:number;back?:number}|null;mold:{fill:number;glow:number;back?:number}|null;feed?:number}};
export const PlanCrucible:React.FC<{fill:number;glow:number;tilt?:number}>=({fill,glow,tilt=0})=>{const P=HERO_PAINT,sq=Math.max(.35,Math.cos(tilt*RAD));
 return <g transform={`rotate(${f2(tilt*.15)}) scale(${f2(sq)} 1)`} data-part="plan-crucible">
  {glow>0&&<circle cx={0} cy={0} r={58} fill={P.hot} opacity={.22*glow}/>}
  <circle cx={0} cy={0} r={36} fill={P.ceramic} stroke={P.trim} strokeWidth={2.4}/>
  <circle cx={0} cy={0} r={28} fill="#2C2622"/>
  {fill>0&&<circle cx={0} cy={0} r={f2(10+16*fill)} fill={glow>.02?P.hot:TUBES[RECIPE[1]]}/>}
  {fill>0&&glow<.98&&RECIPE.map((k,i)=><circle key={k} cx={(i-1)*9} cy={3} r={4} fill={TUBES[k]} opacity={1-glow}/>)}
  {fill>0&&glow>0&&<circle cx={-4} cy={-4} r={f2(6+8*fill)} fill={P.core} opacity={glow*.8}/>}
  <path d="M-22 -18A28 28 0 0 1 10 -27" stroke="#FFFFFF" strokeWidth={4} fill="none" opacity={.45} strokeLinecap="round"/>
  <path d="M34 -8l12 -2l0 10l-12 -2Z" fill={P.ceramic} stroke={P.trim} strokeWidth={1.6}/>
 </g>;};
export const PlanTubes:React.FC<{}>=()=><g data-part="plan-tubes">{RECIPE.map((k,i)=><g key={k}>
 <circle cx={(i-1)*TUBE.pitch} cy={0} r={8} fill={P_GLASS} stroke={HERO_PAINT.trim} strokeWidth={1.6}/><circle cx={(i-1)*TUBE.pitch} cy={0} r={5} fill={TUBES[k]}/></g>)}</g>;
const P_GLASS='#D7E7EA';
export const PlanBar:React.FC<{temp:number;len?:number}>=({temp,len=RIG.sampleLen})=>{const P=HERO_PAINT,col=temp>0?mix('#9AA0A4',temp<.5?'#C9603A':P.hot,clamp(temp*1.4)):'#9AA0A4';
 return <g data-part="plan-bar">{temp>.05&&<rect x={-len/2-14} y={-18} width={len+28} height={36} rx={18} fill={P.hot} opacity={.22*temp}/>}
  <rect x={-len/2} y={-7} width={len} height={14} rx={3} fill={col} stroke={P.trim} strokeWidth={2}/>
  <path d={`M${-len/2+5} -3H${len/2-5}`} stroke={temp>.3?P.core:'#D7DCDF'} strokeWidth={2} opacity={.8}/></g>;};
const PlanStations:React.FC<{st:PlanState;t:number}>=({st,t})=>{
 const P=HERO_PAINT,R=RIG,rig=st.rig,clampOff=lerp(10,0,rig.clampP);
 return <g data-part="plan-stations">
  <rect x={PLAN.x0} y={PLAN.railY-12} width={PLAN.x1-PLAN.x0} height={24} rx={4} fill={P.steelDeep} stroke={P.trim} strokeWidth={2}/>
  <path d={`M${PLAN.x0+8} ${PLAN.railY-6}H${PLAN.x1-8}`} stroke={P.steelLit} strokeWidth={2} opacity={.5}/>
  <rect x={PLAN.x0} y={-PLAN.bedHalf} width={PLAN.x1-PLAN.x0} height={2*PLAN.bedHalf} rx={6} fill={P.bedTop} stroke={P.trim} strokeWidth={2.6}/>
  <path d={`M${PLAN.x0+10} ${-PLAN.bedHalf+6}H${PLAN.x1-10}`} stroke="#FFFFFF" strokeWidth={3} opacity={.35}/>
  {st.furnace>0&&<ellipse cx={PLAN.furn} cy={0} rx={190} ry={90} fill={P.hot} opacity={.16*st.furnace}/>}
  {/* the tube rack */}
  <g transform="translate(-290 0)"><rect x={-62} y={-24} width={124} height={48} rx={6} fill={P.steel} stroke={P.trim} strokeWidth={2.2}/>
   {TUBES.map((c,k)=><g key={k}><circle cx={(k-2)*TUBE.pitch} cy={0} r={8} fill={P.steelDeep}/>
    {!(st.rackTaken&&RECIPE.includes(k))&&<g><circle cx={(k-2)*TUBE.pitch} cy={0} r={8} fill={P_GLASS} stroke={P.trim} strokeWidth={1.4}/><circle cx={(k-2)*TUBE.pitch} cy={0} r={5} fill={c}/></g>}</g>)}</g>
  {/* the crucible pad and, when it is there, the crucible */}
  <rect x={PLAN.cru-42} y={-42} width={84} height={84} rx={8} fill="#7B6E62" stroke={P.trim} strokeWidth={2}/>
  {st.crucible.where==='pad'&&<g transform={`translate(${PLAN.cru} 0)`}><PlanCrucible fill={st.crucible.fill} glow={st.crucible.glow}/></g>}
  {/* the furnace and its port */}
  <g transform={`translate(${PLAN.furn} 0)`}><rect x={-70} y={-70} width={140} height={140} rx={10} fill={P.refractory} stroke={P.trim} strokeWidth={2.6}/>
   <rect x={-62} y={-62} width={124} height={124} rx={8} fill="none" stroke={P.refShade} strokeWidth={3}/>
   <circle cx={0} cy={0} r={46} fill="#2A1E16" stroke={P.trim} strokeWidth={2.4}/>
   {st.furnace>0&&<circle cx={0} cy={0} r={40} fill={P.hot} opacity={st.furnace}/>}
   {st.furnace>0&&<circle cx={-6} cy={-6} r={20+3*Math.sin(t*5)} fill={P.core} opacity={.8*st.furnace}/>}
   <rect x={50} y={-62} width={14} height={124} rx={4} fill={P.refShade}/></g>
  {/* the test rig, crosshead front to back over the sample */}
  <g transform={`translate(${PLAN.rig} 0)`}>
   <rect x={R.baseL} y={-50} width={R.half-R.baseL} height={100} rx={6} fill={P.steelDark} stroke={P.trim} strokeWidth={2.4}/>
   {[-R.anvil,R.anvil].map(x=><rect key={x} x={x-9} y={-22} width={18} height={44} rx={3} fill={P.steel} stroke={P.trim} strokeWidth={1.6}/>)}
   {/* the rear feed at the rig's back edge: the bar leaves and the mold arrives through it, front to back */}
   {(rig.feed??0)>0&&<g opacity={f2(clamp(rig.feed??0))}><rect x={-54} y={-62} width={108} height={14} rx={4} fill="#1E2226" stroke={P.trim} strokeWidth={2}/></g>}
   {rig.mold&&<g transform={`translate(0 ${f2(-56*Math.min(rig.mold.back??0,1))})`} opacity={f2(1-clamp((rig.mold.back??0)-1))}><rect x={-50} y={-26} width={100} height={52} rx={5} fill={P.steelDark} stroke={P.trim} strokeWidth={2}/>
    <rect x={-38} y={-12} width={76} height={24} rx={3} fill="#1E2226"/>{rig.mold.fill>0&&<rect x={-36} y={-10} width={f2(72*rig.mold.fill)} height={20} rx={3} fill={P.hot}/>}
    {rig.mold.glow>0&&<rect x={-60} y={-36} width={120} height={72} rx={30} fill={P.hot} opacity={.25*rig.mold.glow}/>}</g>}
   {rig.sample&&<g transform={`translate(0 ${f2(-56*Math.min(rig.sample.back??0,1))})`} opacity={f2(1-clamp((rig.sample.back??0)-1))}><PlanBar temp={rig.sample.temp}/></g>}
   {[-1,1].map(s=><rect key={s} x={s*R.clampX-12} y={f2(-30-clampOff)} width={24} height={f2(60+2*clampOff)} rx={4} fill="none" stroke={P.steelDeep} strokeWidth={5}/>)}
   {[-1,1].map(s=><rect key={'c'+s} x={-9} y={s>0?40:-58} width={18} height={18} rx={3} fill={P.steel} stroke={P.trim} strokeWidth={2}/>)}
   <rect x={-11} y={-66} width={22} height={132} rx={5} fill={P.steel} stroke={P.trim} strokeWidth={2.4} opacity={.92}/>
   <circle cx={0} cy={0} r={f2(13+4*clamp(rig.ram))} fill={P.steelDeep} stroke={P.trim} strokeWidth={2}/>
   {rig.ram>1&&<circle cx={0} cy={0} r={f2(20+8*clamp(rig.ram-1))} fill="none" stroke={P.hot} strokeWidth={3} opacity={.6}/>}
   {/* the dial gauge at the crosshead's back end */}
   <g transform="translate(0 -92)"><circle cx={0} cy={0} r={28} fill={P.steelDark} stroke={P.trim} strokeWidth={2.2}/><circle cx={0} cy={0} r={23} fill="#F4EFE4"/>
    {Array.from({length:11},(_,k)=>{const a=(-210+k*24)*RAD;return <path key={k} d={`M${f2(Math.cos(a)*17)} ${f2(Math.sin(a)*17)}L${f2(Math.cos(a)*21)} ${f2(Math.sin(a)*21)}`} stroke={P.trim} strokeWidth={k%5===0?2:1.2}/>;})}
    <g transform={`rotate(${f2(-120+rig.needle)})`}><path d="M-2 3L0 -19L2 3Z" fill="#B5432F"/></g><circle cx={0} cy={0} r={3} fill={P.trim}/></g>
  </g>
 </g>;};

// ---- the exported group -----------------------------------------------------------------------------
export type FoundryArmHeroProps=
 |{part:'arm';pose:ArmPose;gap:number;held?:React.ReactNode;warm?:number;chainX?:number;front?:React.ReactNode}
 |{part:'rack';taken:boolean}
 |{part:'tubes'}
 |{part:'crucible';fill:number;glow:number;mixed?:number}
 |{part:'furnaceBack';glow:number;t:number}
 |{part:'furnaceFront';glow:number}
 |{part:'rig';ram:number;clampP:number;needle:number;sample?:RigSample|null;mold?:RigMold|null;warm?:number;feed?:number;ratchet?:number}
 |{part:'planArm';pose:PlanPose;gap:number;lift:number;held?:React.ReactNode;warm?:number}
 |{part:'planStations';st:PlanState;t:number}
 |{part:'planCrucible';fill:number;glow:number;tilt?:number}
 |{part:'planTubes'}
 |{part:'planBar';temp:number;len?:number}
 |{part:'sample';temp:number;bend?:number}
 |{part:'stream';from:Pt;to:Pt;p:number;t:number}
 |{part:'bed';x0:number;x1:number;floor:number;glowX?:number;glow?:number};
export const FoundryArmHero:React.FC<FoundryArmHeroProps>=(props)=>{
 switch(props.part){
 case 'arm':return <Arm pose={props.pose} gap={props.gap} held={props.held} warm={props.warm} chainX={props.chainX} front={props.front}/>;
 case 'rack':return <Rack taken={props.taken}/>;
 case 'tubes':return <RecipeTubes/>;
 case 'crucible':return <Crucible fill={props.fill} glow={props.glow} mixed={props.mixed}/>;
 case 'furnaceBack':return <FurnaceBack glow={props.glow} t={props.t}/>;
 case 'furnaceFront':return <FurnaceFront glow={props.glow}/>;
 case 'rig':return <Rig ram={props.ram} clampP={props.clampP} needle={props.needle} sample={props.sample} mold={props.mold} warm={props.warm} feed={props.feed} ratchet={props.ratchet}/>;
 case 'planArm':return <PlanArm pose={props.pose} gap={props.gap} lift={props.lift} held={props.held} warm={props.warm}/>;
 case 'planStations':return <PlanStations st={props.st} t={props.t}/>;
 case 'planCrucible':return <PlanCrucible fill={props.fill} glow={props.glow} tilt={props.tilt}/>;
 case 'planTubes':return <PlanTubes/>;
 case 'planBar':return <PlanBar temp={props.temp} len={props.len}/>;
 case 'sample':return <Sample temp={props.temp} bend={props.bend}/>;
 case 'stream':return <Stream from={props.from} to={props.to} p={props.p} t={props.t}/>;
 case 'bed':return <Bed x0={props.x0} x1={props.x1} floor={props.floor} glowX={props.glowX} glow={props.glow}/>;
 }
};
