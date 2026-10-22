import React from "react";
import {CinematicStage} from "./lib/cinema/CinematicStage";
import type {V3} from "./lib/cinema/motion";
// Original generic apparatus and qualitative model. No Rice machine or measured outcome.
const Metal:React.FC<{model?:boolean}>=({model=false})=><meshStandardMaterial color={model?"#53bfb8":"#9ca8ac"} metalness={model?.35:.78} roughness={.28}/>;
const Sample:React.FC<{model?:boolean}>=({model=false})=><group>
 <mesh position={[0,.035,0]}><cylinderGeometry args={[.31,.31,.07,40]}/><meshStandardMaterial color={model?"#83e9dc":"#d0a25b"} metalness={.55} roughness={.25}/></mesh>
 <mesh position={[0,.073,0]}><cylinderGeometry args={[.27,.27,.007,40]}/><meshStandardMaterial color={model?"#aaf3eb":"#484960"} metalness={.45} roughness={.2}/></mesh>
</group>;
const Dial:React.FC<{position:V3;turn:number;color:string;model:boolean}>=({position,turn,color,model})=><group position={position}>
 <mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.27,.27,.06,40]}/><meshStandardMaterial color={model?"#123c43":"#d1d5ce"} metalness={.15} roughness={.45}/></mesh>
 <mesh rotation={[0,0,-1.05+turn*2.1]} position={[0,0,.042]}><boxGeometry args={[.044,.4,.025]}/><meshStandardMaterial color={color} emissive={color} emissiveIntensity={.35}/></mesh>
</group>;
const Valve:React.FC<{turn:number;model:boolean}>=({turn,model})=><group position={[-1.05,.66,0]}>
 <mesh><cylinderGeometry args={[.075,.075,.22,20]}/><Metal model={model}/></mesh>
 <group position={[0,.16,0]} rotation={[0,0,turn*Math.PI*.55]}>
  <mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[.25,.043,12,40]}/><meshStandardMaterial color={model?"#7ffff1":"#cb8054"} metalness={.4} roughness={.3}/></mesh>
  {[0,Math.PI/2].map(r=><mesh key={r} rotation={[0,0,r]}><boxGeometry args={[.46,.041,.044]}/><meshStandardMaterial color={model?"#7ffff1":"#cb8054"}/></mesh>)}
 </group>
</group>;
const Apparatus:React.FC<{model:boolean;valve:number;front:number;heat:number;pressure:number;mixture:number;lid:number;seat:number}>=({model,valve,front,heat,pressure,mixture,lid,seat})=><group>
 <mesh position={[0,-.94,0]}><boxGeometry args={[1.74,.16,1.16]}/><Metal model={model}/></mesh>
 {[[-.55,-1.1,.36],[.55,-1.1,.36],[-.55,-1.1,-.36],[.55,-1.1,-.36]].map((p,i)=><mesh key={i} position={p as V3}><cylinderGeometry args={[.07,.08,.19,18]}/><Metal model={model}/></mesh>)}
 <mesh position={[0,-.2,0]}><cylinderGeometry args={[.62,.62,1.2,48,1,true]}/><meshPhysicalMaterial color={model?"#60d7d0":"#b7d0d6"} transparent opacity={model?.25:.21} metalness={.05} roughness={.13} side={2}/></mesh>
 <mesh position={[0,.45+lid*.65,0]}><cylinderGeometry args={[.68,.68,.13,48]}/><Metal model={model}/></mesh>
 {Array.from({length:6},(_,i)=>{const an=i*Math.PI/3;return <mesh key={i} position={[Math.cos(an)*.55,.54+lid*.65,Math.sin(an)*.55]}><cylinderGeometry args={[.038,.038,.045,6]}/><Metal model={model}/></mesh>;})}
 <mesh position={[0,-.82,0]}><cylinderGeometry args={[.66,.66,.14,48]}/><Metal model={model}/></mesh>
 {Array.from({length:7},(_,i)=><mesh key={i} position={[0,-.67+i*.145,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.66,.029,12,64]}/><meshStandardMaterial color={model?"#ffa66a":"#617782"} emissive={model?"#fa4d15":"#000000"} emissiveIntensity={model?heat*2.2:0} metalness={.3} roughness={.3}/></mesh>)}
 <mesh position={[-1.05,-.08,0]}><cylinderGeometry args={[.23,.23,1.12,32]}/><Metal model={model}/></mesh>
 <Valve turn={valve} model={model}/>
 <mesh position={[-.83,.36,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.061,.061,.52,20]}/><Metal model={model}/></mesh>
 {/* The platform supports the conserved sample throughout the virtual seating action. */}
 <group position={[0,-.69+(1-seat)*.35,0]}>
  <mesh position={[0,-.04,0]}><cylinderGeometry args={[.38,.38,.08,40]}/><Metal model={model}/></mesh><Sample model={model}/>
 </group>
 <Dial position={[.95,.2,.25]} turn={heat} model={model} color="#ffad73"/>
 <Dial position={[.95,-.38,.25]} turn={pressure} model={model} color="#88eee4"/>
 {model&&<>
  {/* One finite, visibly substantial inlet front. It arrives and stays, never loops. */}
  <mesh position={[-1.05+front*.25,.38,.06]} rotation={[0,0,Math.PI/2]} scale={[1,Math.max(.001,front),1]}><cylinderGeometry args={[.11,.11,.54,24]}/><meshStandardMaterial color="#a1fff0" emissive="#2a9f9b" emissiveIntensity={.55}/></mesh>
  <mesh position={[0,.33-front*.47,0]} scale={[1,Math.max(.001,front),1]}><cylinderGeometry args={[.48,.48,.92,40]}/><meshPhysicalMaterial color="#39ddd0" transparent opacity={.16+front*.28} roughness={.3}/></mesh>
  {/* A separately entering qualitative composition, not a material being synthesized. */}
  <mesh position={[.17,.33-mixture*.47,.05]} scale={[1,Math.max(.001,mixture),1]}><cylinderGeometry args={[.3,.3,.92,32]}/><meshPhysicalMaterial color="#ffc27c" transparent opacity={.12+mixture*.3} roughness={.4}/></mesh>
 </>}
</group>;
export const readinessLayout=(option:"a"|"b")=>option==="b"?{real:[-.2,-.4,0] as V3,virtual:[.2,1.15,0] as V3,scale:.76}:{real:[-.82,-.03,0] as V3,virtual:[.82,.18,0] as V3,scale:1};
export const readinessView=(phase:number,option:"a"|"b"):{position:V3;target:V3;fov:number}=>{
 const stacked=option==="b",v=readinessLayout(option).virtual;
 if(stacked){
  const views:[V3,V3,number][]=[[[.35,1.7,5.7],[-.38,.96,0],36],[[1.5,1.6,8.4],[0,.47,0],35],[[1.5,2.1,4.65],[.37,1.07,0],38],[[.6,3.5,4.5],[.2,.93,0],38],[[1.7,1.6,6.1],[.45,.85,0],37],[[.45,1.7,4.5],[-.35,1.4,0],36],[[1.3,2.4,3.8],[.2,1.62,0],38],[[1.2,1.5,8.3],[0,.47,0],35]];
  const [position,target,fov]=views[phase];return {position,target,fov};
 }
 const views:[V3,V3,number][]=[[[1.1,1.5,5.7],[-.45,.38,0],38],[[3,2.4,9.3],[0,-.05,0],37],[[3.3,1.8,5.4],[v[0],.06,0],38],[[2.6,3.5,4.5],[v[0],-.25,0],39],[[3.2,1.5,6.7],[.25,.43,0],38],[[1.6,1.5,5.7],[.04,.65,0],37],[[2.8,2.1,3.9],[v[0],.63,0],39],[[3,2.3,9.3],[0,-.05,0],37]];
 const [position,target,fov]=views[phase];return {position,target,fov};
};
export const ReadinessAction:React.FC<{phase:number;option:"a"|"b";a:number;b:number;c:number}>=({phase,option,a,b,c})=>{
 const layout=readinessLayout(option),view=readinessView(phase,option),v=layout.virtual,r=layout.real;
 const front=phase===0?Math.min(1,a*.65+b*.35):1;
 const heat=phase===2?a:phase===4?.2+c*.7:phase>2?.65:.12;
 const pressure=phase===2?b:phase===4?.7-c*.5:phase>2?.65:.12;
 const mixture=phase===2?c:phase>2?1:0;
 const lid=phase===3?a:phase===7?(1-b)*.45:.05;
 const seat=phase===3?b:1;
 const review:V3=[v[0]-.74,v[1]+.29,.2];
 return <CinematicStage {...view}>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-1.2,0]} receiveShadow><planeGeometry args={[200,200]}/><meshStandardMaterial color="#132e36" roughness={.7}/></mesh>
  <group position={r} scale={layout.scale}><Apparatus model={false} valve={0} front={0} heat={0} pressure={0} mixture={0} lid={0} seat={1}/></group>
  <group position={v} scale={layout.scale}><Apparatus model valve={phase===0?a:phase===5?1-c:1} front={front} heat={heat} pressure={pressure} mixture={mixture} lid={lid} seat={seat}/></group>
  {phase===1&&<mesh position={[v[0],v[1]-.2,0]} scale={[1+b*.12,1+a*.15,1+b*.12]}><cylinderGeometry args={[.69,.69,1.35,40,1,true]}/><meshStandardMaterial color="#64e0d5" transparent opacity={.09+c*.06} side={2}/></mesh>}
  {phase===4&&Array.from({length:10},(_,i)=>{
   const p=Math.min(1,Math.max(0,(a+b-i*.04)/1.2));const end:V3=[v[0]+.78+(i%3-1)*.09,v[1]+.65+Math.floor(i/3)*.095,.2];
   return <mesh key={i} position={[r[0]+(end[0]-r[0])*p,r[1]-.3+(end[1]-r[1]+.3)*p+Math.sin(p*Math.PI)*.3,.2]} scale={.085}><octahedronGeometry args={[1]}/><meshStandardMaterial color="#f3c47e" emissive="#c88a3b" emissiveIntensity={.5}/></mesh>;
  })}
  {phase===5&&<>
   <mesh position={review}><boxGeometry args={[1.03,.54,.12]}/><meshStandardMaterial color="#305653" emissive="#57897f" emissiveIntensity={b*.45} roughness={.5}/></mesh>
   {Array.from({length:12},(_,i)=>{const p=i/11;return <mesh key={i} position={[v[0]+.8+(review[0]+.52-v[0]-.8)*p,v[1]+.2+(review[1]-v[1]-.2)*p,.29]} scale={.043*(p<=a?1:.15)}><sphereGeometry args={[1,12,10]}/><meshStandardMaterial color="#efb86c"/></mesh>;})}
   <mesh position={[v[0]+.8+(review[0]+.52-v[0]-.8)*a,v[1]+.2+(review[1]-v[1]-.2)*a,.29]} scale={.14+b*.035}><sphereGeometry args={[1,24,20]}/><meshStandardMaterial color="#f2c57c" emissive="#a87a37" emissiveIntensity={.4}/></mesh>
  </>}
  {phase===6&&<group position={[v[0],v[1]+.45,.22]}>
   <mesh><cylinderGeometry args={[.68,.68,.06,56]}/><meshStandardMaterial color="#3b4f71" metalness={.6} roughness={.23}/></mesh>
   <mesh position={[0,.04+a*.48-c*.16,0]} scale={[1,.45+b*.5,1]}><cylinderGeometry args={[.66,.66,.015,56]}/><meshStandardMaterial color="#b6eae6" metalness={.25} roughness={.18}/></mesh>
   <mesh position={[.8,.04+a*.24,0]} scale={[1,.04+a*.46,1]}><boxGeometry args={[.03,1,.03]}/><meshStandardMaterial color="#b6eae6"/></mesh>
  </group>}
  {phase===7&&<mesh position={[v[0],v[1]-.91,0]} scale={[1+c*.16,1,1+c*.16]}><cylinderGeometry args={[.73,.73,.07,40]}/><meshStandardMaterial color="#5cbdb0" transparent opacity={.18+c*.1}/></mesh>}
 </CinematicStage>;
};
