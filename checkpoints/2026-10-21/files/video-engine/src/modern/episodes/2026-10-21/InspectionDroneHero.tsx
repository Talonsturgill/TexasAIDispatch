import React from 'react';
import {useUid} from '../../../lib/uid';

/**
 * InspectionDroneHero, the fresh authored hero group for the 2026-10-21 edition (leak-review-v1).
 *
 * ONE generic inspection drone and its weatherproof station carry the film. Neither is a real model:
 * no logo, badge, wordmark, livery or serial. The drone is compact and four rotored: a pale gray
 * painted shell that bulges at the nose, a darker belly plate with a seam and vent slots, four arms to
 * squat motors, rotors that are two blades at rest and a translucent disc with streaks at speed, thin
 * scuffed rotor guards, short splayed landing legs with rubber feet, a slung gimbal with an infrared
 * camera pod whose dark lens carries a small reflection, a white nose lamp, a red tail lamp, a status
 * strip on the spine and a short antenna stub at the rear. Nothing is symmetric: the antenna is behind
 * the spine's centre, the near rear guard carries a scuff, a shallow dent sits low on the shell.
 *
 * The station is a galvanized cabinet on two steel skids with a clamshell hood whose two leaves swing
 * outward on their own hinges (the left leaf opens a little further than the right and carries a dent),
 * a recessed landing deck with a painted ring, a status lamp, a bolt with a rust drip, and a leaning
 * post beside it with a cup anemometer, an antenna and a small tilted solar panel on a sagging cable.
 *
 * Views: `side` (the drone facing +x, feet on y 0), `top` (the drone seen straight down, facing +x),
 * `station` (the cabinet seen from the side, base centre on y 0, with the drone docked or lifting out
 * as a child), `stationTop` (the cabinet straight down) and `windowStation` (a soft, small far version
 * seen through the review room's window at the close).
 *
 * Light: low warm desert light from the upper left warms the shell and the steel, a cool fill from the
 * right shades the lower right, and the episode lays the soft contact shadow on the ground.
 *
 * Pure function of its props. The episode drives every prop from the film frame clock and the board's
 * event windows; this file holds no clock, no state and no random input.
 *
 * Disclosed illustration of a generic inspection drone and station. Not a Percepto or Chevron drone,
 * not the approved Air Max, and no real site, rotor count, size or flight height.
 */

export type Pt=[number,number];
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
const smooth=(p:number)=>{const q=clamp(p);return q*q*(3-2*q);};
const f2=(v:number)=>v.toFixed(2);
const RAD=Math.PI/180;

/** The drone's paint and lamp values. No amber, green or blue on the machine: amber is the approval stamp's,
 * the highlighted AI's and the delay bar's, green is the inspector's confirmation, blue is the companies' claim. */
export const DRONE_PAINT={lit:'#F7F8F8',shell:'#E4E8EA',shade:'#BCC4CA',deep:'#8E989F',belly:'#6F7880',trim:'#2B3339',
 ink:'#1E262B',lens:'#10161B',lensRing:'#47525B',rotor:'#2F393F',guard:'#9AA3A9',lamp:'#C9D3D8',deck:'#E2DDCE',red:'#C8553D',white:'#FFF8E8'};
/** Side geometry in drone units: facing +x, feet on y 0, up is negative y. */
export const DRONE={bodyTop:-92,bodyBottom:-36,rotorY:-102,rotorRx:52,rotorRy:8,nearArm:[-114,112] as Pt,farArm:[-96,98] as Pt,
 pivot:[40,-26] as Pt,podLen:30,podR:12};
/** The side drawing's box in drone units (rotor discs and guards included), for frame-edge checks. */
export const DRONE_SIDE_BOX:[number,number,number,number]=[-172,-118,172,2];
/** The plan drawing's box in drone units (facing +x, rotor discs included). */
export const DRONE_TOP_BOX:[number,number,number,number]=[-166,-166,166,166];
/** Station geometry in station units: base centre on y 0. The drone docks with its feet on DECK_Y. */
export const STATION={half:180,cabinetTop:-110,deckY:-70,hinge:[-180,-110] as Pt,hingeR:[180,-110] as Pt,leafL:102,leafR:97,postX:-252};
export const STATION_BOX:[number,number,number,number]=[-300,-420,300,4];

/** The lens's direction in drone units for a pod tilt (degrees, 0 level forward, positive down). */
export function lensPoint(pod:number):{p:Pt;dir:Pt}{
 const a=pod*RAD,[px,py]=DRONE.pivot,l=DRONE.podLen*.62;
 return {p:[px+Math.cos(a)*l,py+Math.sin(a)*l],dir:[Math.cos(a),Math.sin(a)]};
}

// ---- rotors -----------------------------------------------------------------------------------------
/** A side-on rotor at (cx, cy): two blades at rest, a translucent disc with streaks at speed. `phase` is
 * the blade angle in radians; `spin` 0 to 1 is how fast. Far rotors are dimmer. */
const RotorSide:React.FC<{cx:number;cy:number;rx:number;phase:number;spin:number;far?:boolean;guard?:boolean;scuff?:boolean}>=
 ({cx,cy,rx,phase,spin,far=false,guard=true,scuff=false})=>{
 const blades=1-smooth(spin*2.2),disc=smooth((spin-.18)/.55),P=DRONE_PAINT,ry=DRONE.rotorRy*(far?.8:1);
 const blade=(a:number,k:number)=>{const half=rx*.94*Math.abs(Math.cos(a));
  return <path key={k} d={`M${f2(cx-half)} ${f2(cy+.6)}Q${f2(cx)} ${f2(cy-2.2)} ${f2(cx+half)} ${f2(cy-.6)}`} stroke={P.rotor} strokeWidth={far?3:4} strokeLinecap="round" fill="none"/>;};
 const streak=(k:number)=>{const a0=phase*.35+k*2.1;
  const x1=cx+rx*.92*Math.cos(a0),y1=cy+ry*.92*Math.sin(a0),x2=cx+rx*.92*Math.cos(a0+.9),y2=cy+ry*.92*Math.sin(a0+.9);
  return <path key={k} d={`M${f2(x1)} ${f2(y1)}A${f2(rx*.92)} ${f2(ry*.92)} 0 0 1 ${f2(x2)} ${f2(y2)}`} stroke={P.lit} strokeWidth={2.4} opacity={.55*disc} fill="none" strokeLinecap="round"/>;};
 return <g opacity={far?.82:1}>
  {guard&&<path d={`M${f2(cx-rx-5)} ${f2(cy)}A${f2(rx+5)} ${f2(ry+4)} 0 0 1 ${f2(cx+rx+5)} ${f2(cy)}`} stroke={P.guard} strokeWidth={2.4} fill="none" opacity={.85}/>}
  {disc>0&&<ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={P.rotor} opacity={.2*disc}/>}
  {disc>0&&<ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={P.trim} strokeWidth={1.4} opacity={.35*disc}/>}
  {disc>0&&[0,1,2].map(streak)}
  {blades>0&&<g opacity={blades}>{blade(phase,0)}{blade(phase+Math.PI/2,1)}</g>}
  <rect x={cx-5} y={cy-3} width={10} height={7} rx={2.5} fill={P.trim}/>
  {guard&&<path d={`M${f2(cx+rx+5)} ${f2(cy)}A${f2(rx+5)} ${f2(ry+4)} 0 0 1 ${f2(cx-rx-5)} ${f2(cy)}`} stroke={P.guard} strokeWidth={3} fill="none"/>}
  {guard&&scuff&&<path d={`M${f2(cx-rx*.55)} ${f2(cy+ry+2.5)}l14 .6`} stroke={P.trim} strokeWidth={3} opacity={.55} strokeLinecap="round"/>}
 </g>;
};

// ---- the drone, side on --------------------------------------------------------------------------------
export type DroneSideProps={spin:number;phase:number;pod:number;lamp?:number;ready?:number;cone?:number;coneLen?:number;wear?:number};
const DroneSide:React.FC<DroneSideProps>=({spin,phase,pod,lamp=1,ready=0,cone=0,coneLen=520})=>{
 const id=useUid('lrdrone'),P=DRONE_PAINT,{p:lens,dir}=lensPoint(pod);
 const a=pod*RAD,[px,py]=DRONE.pivot;
 const coneSpread=.32,c1:Pt=[lens[0]+coneLen*Math.cos(a-coneSpread),lens[1]+coneLen*Math.sin(a-coneSpread)],
  c2:Pt=[lens[0]+coneLen*Math.cos(a+coneSpread),lens[1]+coneLen*Math.sin(a+coneSpread)];
 const body='M-66 -60C-66 -84 -44 -94 -10 -94L44 -94C70 -94 90 -84 94 -66C97 -52 90 -40 72 -36L-50 -36C-61 -36 -66 -46 -66 -60Z';
 const belly='M-56 -50C-40 -46 40 -46 86 -50C84 -42 78 -37 70 -36L-48 -36C-54 -38 -56 -44 -56 -50Z';
 return <g data-part="drone-side">
  <defs>
   <linearGradient id={id+'s'} x1="0" y1="0" x2=".55" y2="1">
    <stop offset="0" stopColor={P.lit}/><stop offset=".45" stopColor={P.shell}/><stop offset="1" stopColor={P.shade}/>
   </linearGradient>
   <linearGradient id={id+'m'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5A646B"/><stop offset="1" stopColor="#262E33"/></linearGradient>
   <radialGradient id={id+'l'} cx=".38" cy=".35" r=".7"><stop offset="0" stopColor="#3B4A57"/><stop offset=".55" stopColor={P.lens}/><stop offset="1" stopColor="#05080A"/></radialGradient>
  </defs>
  {/* the camera's view, behind everything, only while the episode asks for it */}
  {cone>0&&<g data-part="view-cone" opacity={cone}>
   <path d={`M${f2(lens[0])} ${f2(lens[1])}L${f2(c1[0])} ${f2(c1[1])}L${f2(c2[0])} ${f2(c2[1])}Z`} fill={P.white} opacity={.16}/>
   <path d={`M${f2(lens[0])} ${f2(lens[1])}L${f2(c1[0])} ${f2(c1[1])}M${f2(lens[0])} ${f2(lens[1])}L${f2(c2[0])} ${f2(c2[1])}`} stroke={P.white} strokeWidth={2.4} strokeDasharray="10 9" opacity={.7}/>
  </g>}
  {/* far legs and far arms, behind the shell and cooler */}
  <g stroke="#5E676E" strokeLinecap="round" fill="none">
   <path d="M24 -38L40 -3" strokeWidth={6}/><path d="M-30 -38L-46 -3" strokeWidth={6}/>
  </g>
  <path d="M34 -82L98 -96" stroke="#59636A" strokeWidth={8} strokeLinecap="round"/>
  <path d="M-36 -80L-96 -94" stroke="#59636A" strokeWidth={8} strokeLinecap="round"/>
  <rect x={88} y={-104} width={18} height={14} rx={4} fill="#4B555C"/><rect x={-106} y={-102} width={18} height={14} rx={4} fill="#4B555C"/>
  <RotorSide cx={97} cy={DRONE.rotorY-6} rx={DRONE.rotorRx*.88} phase={phase+.7} spin={spin} far/>
  <RotorSide cx={-97} cy={DRONE.rotorY-5} rx={DRONE.rotorRx*.88} phase={phase+2.1} spin={spin} far/>
  {/* the gimbal and the infrared camera pod, slung under the nose */}
  <path d={`M${px-10} -36L${px-6} ${py}L${px+8} ${py}L${px+12} -36Z`} fill={P.trim}/>
  <g transform={`translate(${px} ${py}) rotate(${f2(pod)})`}>
   <rect x={-12} y={-DRONE.podR} width={DRONE.podLen+6} height={DRONE.podR*2} rx={DRONE.podR} fill={`url(#${id}m)`} stroke={P.ink} strokeWidth={1.6}/>
   <path d={`M-8 ${-DRONE.podR+4}H${DRONE.podLen-6}`} stroke="#8A949B" strokeWidth={2} opacity={.7} strokeLinecap="round"/>
   <circle cx={DRONE.podLen-4} cy={0} r={10.5} fill={P.lensRing}/>
   <circle cx={DRONE.podLen-3} cy={0} r={8} fill={`url(#${id}l)`}/>
   <ellipse cx={DRONE.podLen-6} cy={-3.5} rx={2.8} ry={1.8} fill={P.white} opacity={.85}/>
   <circle cx={-2} cy={0} r={4} fill="#3A444B"/>
  </g>
  {/* near legs: splayed, rubber feet, the rear one a touch longer */}
  <g strokeLinecap="round" fill="none">
   <path d="M34 -40L56 -4" stroke={P.trim} strokeWidth={7}/><path d="M-40 -40L-62 -3" stroke={P.trim} strokeWidth={7}/>
   <path d="M34 -40L56 -4" stroke="#7D878E" strokeWidth={2} opacity={.6} transform="translate(-2 0)"/>
  </g>
  <rect x={46} y={-6} width={22} height={7} rx={3.5} fill="#151A1E"/><rect x={-74} y={-5} width={23} height={7} rx={3.5} fill="#151A1E"/>
  {/* the shell */}
  <path d={body} fill={`url(#${id}s)`} stroke={P.ink} strokeWidth={2.4} strokeLinejoin="round"/>
  <path d={belly} fill={P.belly} opacity={.85}/>
  <path d="M-60 -60C-30 -64 40 -64 92 -60" stroke={P.deep} strokeWidth={1.8} fill="none" opacity={.8}/>
  <path d="M-40 -88C-20 -92 20 -92 46 -90" stroke={P.lit} strokeWidth={5} fill="none" opacity={.9} strokeLinecap="round"/>
  {[0,1,2,3].map(k=><path key={k} d={`M${-34+k*9} -54v8`} stroke={P.trim} strokeWidth={3} strokeLinecap="round" opacity={.75}/>)}
  <path d="M10 -46q8 -3 16 0" stroke={P.deep} strokeWidth={2} fill="none" opacity={.8}/>
  {/* status strip on the spine, nose and tail lamps */}
  <rect x={-14} y={-98} width={30} height={6} rx={3} fill={P.trim}/>
  <rect x={-11} y={-97} width={24} height={4} rx={2} fill={ready>.5?P.white:P.lamp} opacity={.35+.65*lamp}/>
  <circle cx={89} cy={-62} r={4.2} fill={P.white} opacity={.6+.4*lamp}/>
  <circle cx={-64} cy={-58} r={3.6} fill={P.red} opacity={.4+.6*lamp}/>
  <path d="M-46 -94l-5 -16" stroke={P.trim} strokeWidth={3} strokeLinecap="round"/><circle cx={-51.5} cy={-111} r={2.6} fill={P.trim}/>
  {/* near arms, motors and rotors, in front */}
  <path d="M40 -76L112 -92" stroke={P.trim} strokeWidth={10} strokeLinecap="round"/>
  <path d="M40 -79L110 -95" stroke="#6B757C" strokeWidth={2.4} strokeLinecap="round" opacity={.8}/>
  <path d="M-42 -76L-114 -90" stroke={P.trim} strokeWidth={10} strokeLinecap="round"/>
  <path d="M-42 -79L-112 -93" stroke="#6B757C" strokeWidth={2.4} strokeLinecap="round" opacity={.8}/>
  <rect x={101} y={-101} width={22} height={17} rx={4} fill="#3D474E" stroke={P.ink} strokeWidth={1.4}/>
  <rect x={-125} y={-99} width={22} height={17} rx={4} fill="#3D474E" stroke={P.ink} strokeWidth={1.4}/>
  <RotorSide cx={112} cy={DRONE.rotorY} rx={DRONE.rotorRx} phase={phase} spin={spin}/>
  <RotorSide cx={-114} cy={DRONE.rotorY+2} rx={DRONE.rotorRx} phase={phase+1.3} spin={spin} scuff/>
  {/* a faint glint along the lens's line of sight while the camera looks */}
  {cone>0&&<circle cx={f2(lens[0]+dir[0]*10)} cy={f2(lens[1]+dir[1]*10)} r={3} fill={P.white} opacity={.6*cone}/>}
 </g>;
};

// ---- the drone, straight down ------------------------------------------------------------------------
export type DroneTopProps={spin:number;phase:number;yaw?:number;lamp?:number;ready?:number;cone?:number;coneLen?:number;coneDir?:number};
const RotorTop:React.FC<{cx:number;cy:number;r:number;phase:number;spin:number;scuff?:boolean}>=({cx,cy,r,phase,spin,scuff=false})=>{
 const P=DRONE_PAINT,blades=1-smooth(spin*2.2),disc=smooth((spin-.18)/.55);
 const b=(a:number,k:number)=><path key={k} d={`M${f2(cx-r*.94*Math.cos(a))} ${f2(cy-r*.94*Math.sin(a))}L${f2(cx+r*.94*Math.cos(a))} ${f2(cy+r*.94*Math.sin(a))}`}
  stroke={P.rotor} strokeWidth={7} strokeLinecap="round"/>;
 return <g>
  <circle cx={cx} cy={cy} r={r+6} fill="none" stroke={P.guard} strokeWidth={4}/>
  {scuff&&<path d={`M${f2(cx+r*.4)} ${f2(cy+r+4)}a${r+6} ${r+6} 0 0 0 ${f2(r*.35)} -6`} stroke={P.trim} strokeWidth={4} fill="none" opacity={.5}/>}
  {disc>0&&<circle cx={cx} cy={cy} r={r} fill={P.rotor} opacity={.18*disc}/>}
  {disc>0&&[0,1].map(k=>{const a0=phase*.35+k*Math.PI;return <path key={k} d={`M${f2(cx+r*.85*Math.cos(a0))} ${f2(cy+r*.85*Math.sin(a0))}A${r*.85} ${r*.85} 0 0 1 ${f2(cx+r*.85*Math.cos(a0+1.1))} ${f2(cy+r*.85*Math.sin(a0+1.1))}`}
   stroke={P.lit} strokeWidth={3} opacity={.5*disc} fill="none" strokeLinecap="round"/>;})}
  {blades>0&&<g opacity={blades}>{b(phase,0)}</g>}
  <circle cx={cx} cy={cy} r={9} fill="#3D474E" stroke={P.ink} strokeWidth={1.5}/>
 </g>;
};
const DroneTop:React.FC<DroneTopProps>=({spin,phase,yaw=0,lamp=1,ready=0,cone=0,coneLen=520,coneDir=0})=>{
 const id=useUid('lrdronetop'),P=DRONE_PAINT,a=coneDir*RAD,sp=.34,L:Pt=[90,0];
 return <g data-part="drone-top" transform={`rotate(${f2(yaw)})`}>
  <defs>
   <radialGradient id={id+'s'} cx=".3" cy=".3" r=".9"><stop offset="0" stopColor={P.lit}/><stop offset=".5" stopColor={P.shell}/><stop offset="1" stopColor={P.shade}/></radialGradient>
   <linearGradient id={id+'c'} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={P.white} stopOpacity={.4}/><stop offset="1" stopColor={P.white} stopOpacity={0}/></linearGradient>
  </defs>
  {cone>0&&<g data-part="view-cone" opacity={cone}>
   <path d={`M${L[0]} ${L[1]}L${f2(L[0]+coneLen*Math.cos(a-sp))} ${f2(L[1]+coneLen*Math.sin(a-sp))}L${f2(L[0]+coneLen*Math.cos(a+sp))} ${f2(L[1]+coneLen*Math.sin(a+sp))}Z`} fill={`url(#${id}c)`}/>
   <path d={`M${L[0]} ${L[1]}l${f2(coneLen*Math.cos(a-sp))} ${f2(coneLen*Math.sin(a-sp))}M${L[0]} ${L[1]}l${f2(coneLen*Math.cos(a+sp))} ${f2(coneLen*Math.sin(a+sp))}`}
    stroke={P.white} strokeWidth={3} strokeDasharray="12 10" opacity={.75}/>
  </g>}
  {/* arms */}
  {[[1,1],[1,-1],[-1,1],[-1,-1]].map(([sx,sy],k)=><g key={k}>
   <path d={`M${sx*30} ${sy*26}L${sx*100} ${sy*100}`} stroke={P.trim} strokeWidth={13} strokeLinecap="round"/>
   <path d={`M${sx*30} ${sy*26-3}L${sx*98} ${sy*98-3}`} stroke="#6B757C" strokeWidth={3} strokeLinecap="round" opacity={.8}/>
  </g>)}
  <RotorTop cx={100} cy={100} r={58} phase={phase} spin={spin}/>
  <RotorTop cx={100} cy={-100} r={58} phase={phase+1.1} spin={spin}/>
  <RotorTop cx={-100} cy={100} r={58} phase={phase+2.3} spin={spin} scuff/>
  <RotorTop cx={-100} cy={-100} r={58} phase={phase+.4} spin={spin}/>
  {/* the pod's lens, just ahead of the nose, and the shell */}
  <circle cx={88} cy={2} r={13} fill={P.lensRing}/><circle cx={90} cy={2} r={8} fill={P.lens}/><circle cx={87} cy={-1} r={2.5} fill={P.white} opacity={.8}/>
  <path d="M-62 -34C-62 -46 -52 -50 -38 -50L52 -50C70 -50 82 -36 82 0C82 36 70 50 52 50L-38 50C-52 50 -62 46 -62 34Z" fill={`url(#${id}s)`} stroke={P.ink} strokeWidth={3}/>
  <path d="M-48 -30H58C66 -30 70 -20 70 0" stroke={P.deep} strokeWidth={2} fill="none" opacity={.7}/>
  <circle cx={-30} cy={14} r={13} fill={P.lit} stroke={P.deep} strokeWidth={2}/>
  <rect x={4} y={-8} width={26} height={8} rx={4} fill={P.trim}/>
  <rect x={6} y={-6.5} width={22} height={5} rx={2.5} fill={ready>.5?P.white:P.lamp} opacity={.35+.65*lamp}/>
  <path d="M-58 -10v20" stroke={P.red} strokeWidth={4} strokeLinecap="round" opacity={.4+.6*lamp}/>
  <path d="M20 26q10 4 20 0" stroke={P.deep} strokeWidth={2} fill="none"/>
 </g>;
};

// ---- the station ----------------------------------------------------------------------------------------
export type StationProps={open:number;lamp?:number;ready?:number;t?:number;children?:React.ReactNode;post?:boolean};
/** The station seen from the side. The drone, passed as `children`, is drawn between the deck and the
 * leaves in station units, so a docked drone hides under a closed hood and lifts out of an open one. */
const Station:React.FC<StationProps>=({open,lamp=1,ready=0,t=0,children,post=true})=>{
 const id=useUid('lrstation'),P=DRONE_PAINT;
 const aL=-STATION.leafL*smooth(open),aR=STATION.leafR*smooth(Math.min(1,open*1.06));
 const inner=smooth((open-.35)/.5);
 const cups=t*2.1;
 return <g data-part="station">
  <defs>
   <linearGradient id={id+'g'} x1="0" y1="0" x2="1" y2=".4"><stop offset="0" stopColor="#D8DCDC"/><stop offset=".5" stopColor="#AEB5B8"/><stop offset="1" stopColor="#7E878C"/></linearGradient>
   <linearGradient id={id+'h'} x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stopColor="#E6E9E8"/><stop offset="1" stopColor="#9DA5A9"/></linearGradient>
   <linearGradient id={id+'i'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5D666B"/><stop offset="1" stopColor="#3A4247"/></linearGradient>
  </defs>
  {/* the leaning post: a cup anemometer, an antenna and a small tilted solar panel, cable to the cabinet */}
  {post&&<g data-part="station-post">
   <path d={`M${STATION.postX-16} -2h46l-6 -14h-34Z`} fill="#A9A08D" stroke={P.ink} strokeWidth={1.5}/>
   <g transform={`translate(${STATION.postX} -14) rotate(4)`}>
    <rect x={-5} y={-330} width={10} height={330} fill="#8D969B" stroke={P.ink} strokeWidth={1.5}/>
    <path d="M-2 -322v300" stroke="#C6CCCE" strokeWidth={2} opacity={.7}/>
    <path d="M0 -240l52 -24v16l-48 22Z" fill="#33414D" stroke={P.ink} strokeWidth={1.5}/>
    <path d="M6 -238l42 -19" stroke="#5E7F99" strokeWidth={2} opacity={.8}/>
    <path d="M0 -330v-46" stroke={P.trim} strokeWidth={3}/><circle cx={0} cy={-378} r={3} fill={P.red}/>
    <g transform="translate(0 -330)">
     {[0,1,2].map(k=>{const a=cups+k*2*Math.PI/3,x=26*Math.cos(a),z=Math.sin(a);
      return <g key={k}><path d={`M0 -6L${f2(x)} -6`} stroke={P.trim} strokeWidth={2.2}/>
       <ellipse cx={x} cy={-6} rx={f2(4+4*Math.abs(z))} ry={6} fill={z>0?'#C9CFD1':'#7B858A'} stroke={P.ink} strokeWidth={1}/></g>;})}
     <circle cx={0} cy={-6} r={4} fill={P.trim}/>
    </g>
    <rect x={-9} y={-120} width={18} height={26} rx={3} fill="#B9C0C3" stroke={P.ink} strokeWidth={1.4}/>
   </g>
   <path d={`M${STATION.postX+6} -120Q${STATION.postX+60} -40 -176 -60`} stroke="#22292E" strokeWidth={3.4} fill="none"/>
  </g>}
  {/* the cabinet's soft contact shadow on the pad, thrown right by the low sun */}
  <ellipse cx={34} cy={3} rx={236} ry={15} fill="#1A1410" opacity={.34}/>
  {/* skids */}
  <rect x={-196} y={-10} width={392} height={10} rx={3} fill="#5C656A" stroke={P.ink} strokeWidth={1.5}/>
  {[-160,-40,70,170].map((x,k)=><circle key={k} cx={x} cy={-5} r={2.4} fill="#C4CACC"/>)}
  {/* the open bay behind the deck */}
  <path d="M-172 -110H172V-60H-172Z" fill={`url(#${id}i)`} opacity={inner}/>
  <ellipse cx={0} cy={-72} rx={150} ry={10} fill="#2F373C" opacity={inner}/>
  <ellipse cx={4} cy={-73} rx={92} ry={6} fill="none" stroke={P.deck} strokeWidth={3} opacity={.8*inner}/>
  {/* the drone, docked or lifting */}
  <g data-part="station-bay">{children}</g>
  {/* cabinet */}
  <path d="M-180 -110H180V-10H-180Z" fill={`url(#${id}g)`} stroke={P.ink} strokeWidth={2.4}/>
  {Array.from({length:21},(_,k)=>-170+k*17).map((x,k)=><path key={k} d={`M${x} -104V-16`} stroke={k%3===1?'#8E979B':'#C9CED0'} strokeWidth={k%3===1?1.6:1.1} opacity={.75}/>)}
  <rect x={-150} y={-98} width={140} height={78} rx={4} fill="none" stroke="#6E777C" strokeWidth={2}/>
  <rect x={-36} y={-64} width={16} height={8} rx={2} fill="#4A5358"/>
  <circle cx={118} cy={-44} r={4} fill="#9AA2A6" stroke={P.ink} strokeWidth={1}/>
  <path d="M118 -40q2 10 -1 22" stroke="#9A5B32" strokeWidth={3.4} opacity={.75} strokeLinecap="round" fill="none"/>
  <path d="M-96 -30q14 4 28 0" stroke="#7B8489" strokeWidth={2.4} fill="none" opacity={.8}/>
  <rect x={128} y={-92} width={30} height={14} rx={4} fill={P.trim}/>
  <circle cx={143} cy={-85} r={5} fill={ready>.5?P.white:P.lamp} opacity={.4+.6*lamp}/>
  {/* the two leaves of the hood, each on its own hinge */}
  <g transform={`translate(${STATION.hinge[0]} ${STATION.hinge[1]}) rotate(${f2(aL)})`}>
   <path d="M0 0V-88Q0 -128 40 -128H184V0Z" fill={`url(#${id}h)`} stroke={P.ink} strokeWidth={2.4}/>
   <path d="M0 0V-88Q0 -128 40 -128H184V0Z" fill="#4E575C" opacity={inner*.55}/>
   {[-26,-58,-90].map((y,k)=><path key={k} d={`M${k===2?12:4} ${y}H180`} stroke="#8E979B" strokeWidth={1.6} opacity={.7}/>)}
   <path d="M60 -116q16 6 34 1" stroke="#7E878C" strokeWidth={3} fill="none"/>
  </g>
  <g transform={`translate(${STATION.hingeR[0]} ${STATION.hingeR[1]}) rotate(${f2(aR)})`}>
   <path d="M0 0V-84Q0 -126 -40 -126H-180V0Z" fill={`url(#${id}h)`} stroke={P.ink} strokeWidth={2.4}/>
   <path d="M0 0V-84Q0 -126 -40 -126H-180V0Z" fill="#3F474C" opacity={inner*.6}/>
   {[-24,-56,-88].map((y,k)=><path key={k} d={`M-4 ${y}H-176`} stroke="#8E979B" strokeWidth={1.6} opacity={.7}/>)}
  </g>
 </g>;
};

/** The station seen straight down: the cabinet's deck and ring, the two leaves folded out on their
 * hinges, the post's footing. The drone, as `children`, sits on the deck. */
const StationTop:React.FC<StationProps>=({open,lamp=1,ready=0,children})=>{
 const id=useUid('lrstationtop'),P=DRONE_PAINT,o=smooth(open);
 const leaf=(side:number,max:number)=>{const th=max*o*RAD,A=-180,B=-180+180*Math.cos(th),C=-180-128*Math.sin(th);
  const x0=Math.min(A,B,C),x1=Math.max(A,B,C);return side<0?[x0,x1]:[-x1,-x0];};
 const [l0,l1]=leaf(-1,STATION.leafL),[r0,r1]=leaf(1,STATION.leafR);
 return <g data-part="station-top">
  <defs><linearGradient id={id+'g'} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#D4D9DA"/><stop offset="1" stopColor="#8D969A"/></linearGradient></defs>
  <rect x={-196} y={-140} width={392} height={280} rx={6} fill="#5C656A"/>
  <rect x={-180} y={-130} width={360} height={260} rx={4} fill={`url(#${id}g)`} stroke={P.ink} strokeWidth={3}/>
  <rect x={-160} y={-110} width={320} height={220} rx={6} fill="#3A4247"/>
  <circle cx={0} cy={0} r={96} fill="none" stroke={P.deck} strokeWidth={5} opacity={.85}/>
  <circle cx={146} cy={-112} r={8} fill={ready>.5?P.white:P.lamp} opacity={.4+.6*lamp}/>
  <g data-part="station-bay">{children}</g>
  <rect x={l0} y={-132} width={l1-l0} height={264} rx={5} fill={o>.5?'#6A7378':'#C9CED0'} stroke={P.ink} strokeWidth={3}/>
  <path d={`M${f2(l0+12)} -100q20 10 40 0`} stroke="#5A6368" strokeWidth={3} fill="none" opacity={o}/>
  <rect x={r0} y={-131} width={r1-r0} height={262} rx={5} fill={o>.5?'#636C71':'#C3C9CB'} stroke={P.ink} strokeWidth={3}/>
  <rect x={-282} y={-26} width={48} height={48} rx={4} fill="#A9A08D" stroke={P.ink} strokeWidth={2}/>
  <circle cx={-256} cy={2} r={10} fill="#8D969B" stroke={P.ink} strokeWidth={2}/>
  <path d="M-246 -2Q-214 -40 -184 -60" stroke="#22292E" strokeWidth={4} fill="none"/>
 </g>;
};

/** The station as seen through the review room's window at the close: small, soft, its hood closing
 * over the docked drone and its lamp settling to a steady white. Hazed by the window's light. */
const WindowStation:React.FC<{open:number;ready:number;lamp:number}>=({open,ready,lamp})=>
 <g data-part="window-station">
  <Station open={open} ready={ready} lamp={lamp} post>
   <g transform={`translate(0 ${STATION.deckY})`}><DroneSide spin={0} phase={.6} pod={18} ready={ready} lamp={lamp}/></g>
  </Station>
 </g>;

export type HeroProps=
 ({part:'side'}&DroneSideProps)|({part:'top'}&DroneTopProps)|({part:'station'}&StationProps)|({part:'stationTop'}&StationProps)|
 {part:'windowStation';open:number;ready:number;lamp:number};
/** The one exported hero: every drawing above, selected by `part`. */
export const InspectionDroneHero:React.FC<HeroProps>=(props)=>{
 switch(props.part){
 case 'side':{const {part:_p,...o}=props;return <DroneSide {...o}/>;}
 case 'top':{const {part:_p,...o}=props;return <DroneTop {...o}/>;}
 case 'station':{const {part:_p,...o}=props;return <Station {...o}/>;}
 case 'stationTop':{const {part:_p,...o}=props;return <StationTop {...o}/>;}
 case 'windowStation':return <WindowStation open={props.open} ready={props.ready} lamp={props.lamp}/>;
 }
};
/** The soft contact shadow under a hovering or standing drone, its spread growing and its strength
 * falling with height. `h` is the gap between the feet and the ground in drone units. */
export const DroneShadow:React.FC<{h:number;rx?:number}>=({h,rx=150})=>{
 const k=clamp(h/600);
 return <ellipse cx={f2(lerp(8,48,k))} cy={2} rx={f2(rx*(1+.5*k))} ry={f2(14*(1+.6*k))} fill="#1A1410" opacity={f2(.42*(1-.75*k))}/>;
};
