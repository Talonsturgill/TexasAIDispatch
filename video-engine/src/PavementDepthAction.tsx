import React from 'react';
import {CinematicStage} from './lib/cinema/CinematicStage';
import {mix} from './lib/cinema/motion';
import type {V3} from './lib/cinema/motion';
const Box:React.FC<{p:V3;s:V3;c:string;rotation?:V3}>=({p,s,c,rotation=[0,0,0]})=><mesh position={p} rotation={rotation} castShadow receiveShadow><boxGeometry args={s}/><meshStandardMaterial color={c} roughness={.92}/></mesh>;
const asphalt='#59616a',sand='#b5aa92',ink='#182733',amber='#e4b16a',cream='#e9e2d2';
/** Original enlarged explanatory road sample. No measured dimensions or actual road location. */
const Sample:React.FC<{x:number;crack:boolean;lift:number;scan:number}>=({x,crack,lift,scan})=><group position={[x,0,0]}>
 <Box p={[0,-.4,0]} s={[2.45,.65,2.2]} c={sand}/>
 {crack?<>
  <Box p={[-.72,0,0]} s={[1.01,.18,2.2]} c={asphalt}/>
  <Box p={[.58,0,0]} s={[1.29,.18,2.2]} c={asphalt}/>
  <Box p={[-.135,-.20,0]} s={[.39,.08,2.2]} c={ink}/>
 </>:<Box p={[0,0,0]} s={[2.45,.18,2.2]} c={asphalt}/>}
 {!crack&&<group position={[0,.102,0]}>
  {[-.68,-.31,.12,.54].map((z,i)=><Box key={z} p={[-.2+(i%2)*.15,0,z]} s={[.43,.016,.48]} c='#252f37' rotation={[0,.12*(i-1),0]}/>)}
 </group>}
 {/* Deterministic aggregate and worn edge detail without random texture or photographic inserts. */}
 {Array.from({length:24},(_,i)=>{
  const xx=-1.08+(i%6)*.42,zz=-.91+Math.floor(i/6)*.58;
  if(crack&&xx>-.3&&xx<.11)return null;
  return <Box key={i} p={[xx,.102,zz]} s={[.052+(i%3)*.02,.013,.038]} c={i%3===0?'#8a9091':'#434d55'} rotation={[0,i*.29,0]}/>;
 })}
 <group position={[0,.16+lift*1.25,0]}>
  {/* Profile follows the actual shown sample: one flat trace and one recessed notch. */}
  <Box p={[-.70,0,0]} s={[1.05,.055,.075]} c={amber}/>
  <Box p={[.60,0,0]} s={[1.25,.055,.075]} c={amber}/>
  {crack?<>
   <Box p={[-.23,-.15,0]} s={[.052,.35,.075]} c={amber}/>
   <Box p={[.02,-.15,0]} s={[.052,.35,.075]} c={amber}/>
   <Box p={[-.105,-.32,0]} s={[.30,.055,.075]} c={amber}/>
  </>:<Box p={[-.105,0,0]} s={[.30,.055,.075]} c={amber}/>}
 </group>
 <Box p={[0,.24,mix(-1.20,1.20,scan)]} s={[2.48,.025,.06]} c='#91c5c6'/>
</group>;
const Sheet:React.FC<{x:number;y:number;z:number;crack:boolean;tilt?:number}>=({x,y,z,crack,tilt=0})=><group position={[x,y,z]} rotation={[-Math.PI/2+tilt,0,0]}>
 <Box p={[0,0,0]} s={[1.25,1.65,.055]} c={cream}/>
 <Box p={[0,.35,.037]} s={[1.02,.52,.035]} c={asphalt}/>
 <Box p={[-.1,.35,.07]} s={[crack?.085:.34,.48,.035]} c={ink}/>
 {[0,1,2].map(i=><Box key={i} p={[-.12,-.09-i*.25,.038]} s={[.77-i*.12,.055,.02]} c={i===0?amber:'#64717a'}/>)}
</group>;
export const PavementDepthAction:React.FC<{phase:number;option:'a'|'b';a:number;b:number;c:number}>=({phase,option,a,b,c})=>{
 const strip=option==='b';
 const stain:V3=strip?[0,0,-1.16]:[-1.48,0,0];
 const crack:V3=strip?[0,0,1.16]:[1.48,0,0];
 const tray:V3=strip?[2.56,.0,.2]:[0,.0,2.50];
 // One conserved profile clock: initial reveal, surface recapture, independent depth reveal, retained result.
 const flatLift=phase===0?.7*a+.3*c:phase===1?1-b:phase===2?a:phase>=6?1-b+c:1;
 const crackLift=phase===0?.7*a+.3*c:phase===1?1-b:phase===2?b:phase>=6?1-b+c:1;
 const scanning=Math.min(1,Math.max(0,phase===0?b:phase===1?1-a+c:phase===2?1-c:phase===3?0:phase===4?b:phase===5?1-c:phase===6?a:1-a));
 const [tx,,tz]=tray;
 // The two report sheets have unique sample identities and continuous world-space destinations.
 const crackEnd:V3=[tx-.35,.22,tz-.34],stainEnd:V3=[tx+.35,.28,tz+.34];
 const paperPose=(kind:'crack'|'stain'):V3=>{
  const source=kind==='crack'?crack:stain,end=kind==='crack'?crackEnd:stainEnd;
  if(phase<3)return [source[0],-.18,source[2]];
  if(phase===3){
   const travel=kind==='crack'?a:b,land=kind==='crack'?b:c;
   return [mix(source[0],end[0],travel),mix(.80,end[1],land),mix(source[2],end[2],travel)];
  }
  if(kind==='crack'&&phase>=4)return [end[0],end[1],end[2]-.25*(phase===4?a:1)];
  return end;
 };
 const cp=paperPose('crack'),sp=paperPose('stain');
 const reportView=phase>=3&&phase<=5;
 const base:V3=strip?(reportView?[6.6,5.1,7.2]:[5.8,5.2,7.5]):(reportView?[4.2,6.5,8.8]:[5.2,6.2,7.3]);
 const camera:V3=phase===0?[base[0],base[1]+.22*a,base[2]]:phase===1?[base[0]+.45*a,base[1],base[2]]:phase===2?[base[0]-.75*b,base[1],base[2]+.25*b]:phase===3?[base[0],base[1],base[2]-.35*b]:phase===4?[base[0],base[1]-.35*a,base[2]]:phase===5?[base[0]+.25*a,base[1],base[2]]:phase===6?[base[0]-.35*b,base[1],base[2]]:[base[0],base[1]+.2*c,base[2]];
 const target:V3=reportView?[tx*.35,.2,tz*.4]:[0,.35,0];
 return <CinematicStage position={camera} target={target} fov={reportView?44:42} exposure={1.22}>
  <directionalLight position={[-4,7,4]} intensity={1.7} color='#f5e5c7'/>
  <hemisphereLight args={['#cedfe5','#596573',.85]}/>
  <Box p={[0,-.81,.5]} s={[8,.18,8]} c={strip?'#a59a80':'#394752'}/>
  {strip&&<>
    {/* B is one continuous illustrated road strip, not two laboratory specimen plinths. */}
    <Box p={[0,-.40,0]} s={[2.45,.65,4.55]} c={sand}/>
    <Box p={[.90,.01,0]} s={[.08,.20,4.5]} c='#d5caba'/>
    <Box p={[-1.34,-.18,0]} s={[.16,.18,5.1]} c='#7c806f'/>
    <Box p={[1.34,-.18,0]} s={[.16,.18,5.1]} c='#7c806f'/>
  </>}
  <group position={stain}><Sample x={0} crack={false} lift={Math.min(1,Math.max(0,flatLift))} scan={scanning}/></group>
  <group position={crack}><Sample x={0} crack lift={Math.min(1,Math.max(0,crackLift))} scan={scanning}/></group>
  <Box p={[tx,.02,tz]} s={[2.05,.18,2.15]} c='#253541'/>
  <Box p={[tx,.125,tz]} s={[1.89,.035,1.99]} c='#839296'/>
  {phase>=3&&<>
    <Sheet x={cp[0]} y={cp[1]} z={cp[2]} crack/>
    <Sheet x={sp[0]} y={sp[1]} z={sp[2]} crack={false}/>
  </>}
  {phase>=4&&<Box p={[mix(tx+1.25,tx+.73,phase===4?c:1),.31,tz-.64]} s={[.22,.08,.35]} c={amber}/>}
  {phase>=5&&<group>
    {/* A separate source-record slip approaches without resetting either sample report. */}
    <Sheet x={phase===5?mix(tx-1.2,tx-.5,a):tx-.5} y={phase===5?mix(.7,.39,b):.39} z={tz+.67} crack={false}/>
  </group>}
 </CinematicStage>;
};
