import React,{useMemo} from 'react';
import * as THREE from 'three';
import {CinematicStage} from './lib/cinema/CinematicStage';
import {useArtDirection} from './lib/artDirection';
import type {V3} from './lib/cinema/motion';

// Original conceptual tabletop example from NSF award 2535276. Paths are authored
// illustrations of the proposal, never a recorded controller output or safety bound.
const colors={background:'#101c2d',midground:'#26384b',foreground:'#344557',ink:'#08101c',paper:'#eee6d3',hero:'#b88961',accent:'#92cfbc'};
const CORAL='#df847b',AMBER='#e6b45f';
const lerp3=(a:V3,b:V3,p:number):V3=>a.map((v,i)=>v+(b[i]-v)*p) as V3;
const route=(p0:number,p1:number,p2:number,points:V3[]):V3=>p2>0?lerp3(points[2],points[3],p2):p1>0?lerp3(points[1],points[2],p1):lerp3(points[0],points[1],p0);
const START:V3=[-1.12,.61,.55],APPROACH:V3=[-.47,.61,.55],TURN:V3=[.12,.61,.90],GOAL:V3=[1.25,.61,.55],BOUNDARY:V3=[-.30,.61,.20];
const SAFE:V3[]=[START,APPROACH,TURN,GOAL];
export const robotSafetyView=(phase:number,option:'a'|'b'):{position:V3;target:V3;fov:number}=>({
 position:option==='a'?[3.3,3.5,7.7]:[.8,7.1,6.0],target:[0,.68,.06],fov:phase===4?36:39,
});
const Metal:React.FC<{color:string;ghost?:boolean}>=({color,ghost=false})=><meshStandardMaterial color={color} metalness={.7} roughness={.24} transparent={ghost} opacity={ghost?.24:1} depthWrite={!ghost}/>;
const Beam:React.FC<{from:V3;to:V3;width:number;color:string;ghost?:boolean}>=({from,to,width,color,ghost})=>{
 const start=new THREE.Vector3(...from),end=new THREE.Vector3(...to),delta=end.clone().sub(start);
 const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize());
 return <group position={start.clone().add(end).multiplyScalar(.5)} quaternion={q}>
  <mesh castShadow={!ghost}><boxGeometry args={[width,delta.length(),width*.68]}/><Metal color={color} ghost={ghost}/></mesh>
  <mesh position={[0,0,width*.36]}><boxGeometry args={[width*.60,delta.length()*.76,.013]}/><Metal color={ghost?color:'#e2bc8a'} ghost={ghost}/></mesh>
 </group>;
};
const Joint:React.FC<{position:V3;color:string;ghost?:boolean}>=({position,color,ghost})=><group position={position}>
 <mesh rotation={[Math.PI/2,0,0]} castShadow={!ghost}><cylinderGeometry args={[.20,.20,.22,32]}/><Metal color={color} ghost={ghost}/></mesh>
 <mesh rotation={[Math.PI/2,0,0]} position={[0,0,.12]}><torusGeometry args={[.145,.025,10,32]}/><Metal color={ghost?color:'#ead5b0'} ghost={ghost}/></mesh>
 <mesh rotation={[Math.PI/2,0,0]} position={[0,0,.145]}><cylinderGeometry args={[.064,.064,.028,6]}/><Metal color={ghost?color:'#344557'} ghost={ghost}/></mesh>
</group>;
const Cube:React.FC<{position:V3;ghost?:boolean;color?:string}>=({position,ghost=false,color='#92cfbc'})=><group position={position}>
 <mesh castShadow={!ghost}><boxGeometry args={[.42,.42,.42]}/><meshStandardMaterial color={ghost?color:AMBER} roughness={.44} transparent={ghost} opacity={ghost?.23:1} depthWrite={!ghost}/></mesh>
 {!ghost&&<>
  <mesh position={[0,.212,0]}><boxGeometry args={[.32,.012,.32]}/><meshStandardMaterial color="#f1cb82" roughness={.55}/></mesh>
  <mesh position={[0,0,.212]}><boxGeometry args={[.32,.29,.008]}/><meshStandardMaterial color="#d59f4a" roughness={.48}/></mesh>
  <mesh position={[.213,0,0]}><boxGeometry args={[.008,.28,.28]}/><meshStandardMaterial color="#edbd68" roughness={.5}/></mesh>
 </>}
</group>;
const Robot:React.FC<{tip:V3;open?:number;color:string;ghost?:boolean}>=({tip,open=0,color,ghost=false})=>{
 // Two-link inverse kinematics. Links stay attached at each deterministic frame.
 const base:V3=[-1.85,1.70,-1.10],dx=tip[0]-base[0],dz=tip[2]-base[2],d=Math.hypot(dx,dz),l1=1.85,l2=1.72;
 const bend=Math.acos(Math.max(-1,Math.min(1,(l1*l1+d*d-l2*l2)/(2*l1*d))));
 const angle=Math.atan2(dz,dx)+bend,elbow:V3=[base[0]+Math.cos(angle)*l1,1.70,base[2]+Math.sin(angle)*l1],wrist:V3=[tip[0],1.70,tip[2]],jaw=.27+open*.19;
 return <group>
  <group position={[-1.85,0,-1.10]}>
   <mesh position={[0,.09,0]} castShadow><cylinderGeometry args={[.42,.47,.18,40]}/><Metal color={color} ghost={ghost}/></mesh>
   <mesh position={[0,.84,0]} castShadow><cylinderGeometry args={[.17,.24,1.50,32]}/><Metal color={color} ghost={ghost}/></mesh>
   {[0,1,2,3].map(i=><mesh key={i} position={[Math.cos(i*Math.PI/2)*.34,.19,Math.sin(i*Math.PI/2)*.34]}><cylinderGeometry args={[.044,.044,.035,6]}/><Metal color="#e8d8b8" ghost={ghost}/></mesh>)}
   <mesh position={[0,.27,0]}><torusGeometry args={[.22,.032,10,40]}/><Metal color="#344557" ghost={ghost}/></mesh>
  </group>
  <Beam from={base} to={elbow} width={.24} color={color} ghost={ghost}/><Beam from={elbow} to={wrist} width={.20} color={color} ghost={ghost}/>
  {[base,elbow,wrist].map((p,i)=><Joint key={i} position={p} color={color} ghost={ghost}/>)}
  <Beam from={wrist} to={[tip[0],tip[1]+.38,tip[2]]} width={.12} color={color} ghost={ghost}/>
  <group position={[tip[0],tip[1]+.36,tip[2]]}>
   <mesh castShadow={!ghost}><boxGeometry args={[.65,.16,.28]}/><Metal color={color} ghost={ghost}/></mesh>
   {[-1,1].map(side=><group key={side} position={[side*jaw,-.22,0]}>
    <mesh castShadow={!ghost}><boxGeometry args={[.10,.37,.22]}/><Metal color={color} ghost={ghost}/></mesh>
    <mesh position={[-side*.059,-.12,0]}><boxGeometry args={[.025,.15,.23]}/><meshStandardMaterial color={ghost?color:'#18232b'} transparent={ghost} opacity={ghost?.3:1}/></mesh>
    <mesh rotation={[Math.PI/2,0,0]} position={[0,.10,.12]}><cylinderGeometry args={[.035,.035,.025,6]}/><Metal color="#e8d8b8" ghost={ghost}/></mesh>
   </group>)}
  </group>
 </group>;
};
const Vase:React.FC<{color:string}>=({color})=>{
 const points=useMemo(()=>[[.18,.025],[.27,.08],[.31,.28],[.28,.47],[.16,.65],[.13,.79],[.13,1.02],[.105,1.02],[.105,.79],[.135,.65],[.255,.47],[.285,.28],[.245,.10],[.16,.055]].map(([x,y])=>new THREE.Vector2(x,y)),[]);
 const reflection=useMemo(()=>new THREE.CatmullRomCurve3([[-.16,.08,.17],[-.21,.23,.21],[-.20,.40,.20],[-.12,.61,.13],[-.078,.78,.08],[-.078,.98,.08]].map(p=>new THREE.Vector3(...p))),[]);
 return <group position={[.35,0,0]}>
  <mesh castShadow receiveShadow><latheGeometry args={[points,64]}/><meshPhysicalMaterial color={color} transparent opacity={.24} roughness={.055} metalness={0} clearcoat={1} clearcoatRoughness={.035} side={THREE.DoubleSide} depthWrite={false}/></mesh>
  {[.025,1.02].map((y,i)=><mesh key={y} position={[0,y,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[i?.118:.18,.016,12,64]}/><meshPhysicalMaterial color={color} transparent opacity={.62} roughness={.06} clearcoat={1}/></mesh>)}
  <mesh><tubeGeometry args={[reflection,32,.008,8,false]}/><meshStandardMaterial color="#fff5dd" transparent opacity={.72} roughness={.12}/></mesh>
  <mesh position={[.091,.88,.087]}><boxGeometry args={[.008,.23,.008]}/><meshStandardMaterial color="#c4dee5" transparent opacity={.66}/></mesh>
  <mesh position={[0,.032,0]}><cylinderGeometry args={[.178,.178,.015,48]}/><meshPhysicalMaterial color={color} transparent opacity={.32} roughness={.06}/></mesh>
 </group>;
};
const Trace:React.FC<{points:V3[];color:string;progress:number;wide?:boolean;offset?:number}>=({points,color,progress,wide=false,offset=0})=>{
 const curve=useMemo(()=>new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],.035,p[2]+offset)),false,'centripetal'),[points,offset]);
 const geometry=useMemo(()=>new THREE.TubeGeometry(curve,64,wide?.065:.014,8,false),[curve,wide]);
 const visible=Math.max(0,Math.min(1,progress));geometry.setDrawRange(0,Math.floor(64*8*6*visible));
 return <mesh geometry={geometry}><meshStandardMaterial color={color} emissive={color} emissiveIntensity={.12} transparent opacity={wide?.20:.75} depthWrite={false}/></mesh>;
};
export const robotSafetyPose=(phase:number,p0:number,p1:number,p2:number)=>{
 let cube:V3=START,tip:V3=START,ghost:V3|undefined,open=0;
 if(phase===0){cube=route(p0,p1,p2,[[-1.65,.76,.80],[-1.48,.70,.70],[-1.27,.64,.60],START]);}
 if(phase===1){ghost=route(p0,p1,p2,SAFE);cube=START;}
 if(phase===2){ghost=route(p0,p1,p2,SAFE);cube=START;}
 if(phase===3){cube=START;ghost=route(p0,p1,p2,[START,[-.72,.61,.36],[-.48,.61,.23],BOUNDARY]);}
 if(phase===4){cube=p2>0?lerp3(APPROACH,TURN,p2):lerp3(START,APPROACH,p1);ghost=BOUNDARY;}
 if(phase===5){cube=route(p0,p1,p2,[TURN,[.32,.61,.84],[.65,.61,.735],GOAL]);ghost=lerp3(TURN,GOAL,Math.min(1,p0+p1+p2));}
 if(phase===6){cube=route(p0,p1,p2,SAFE);ghost=route(p0,p1,p2,[START,[-.47,.61,.80],[.12,.61,1.15],[1.25,.61,.85]]);}
 if(phase===7){cube=route(p0,p1,p2,[GOAL,[1.25,.45,.55],[1.25,.31,.55],[1.25,.215,.55]]);}
 if(phase===8){cube=[1.25,.215,.55];open=p0;}
 tip=phase===8?(p2>0?lerp3([1.25,.62,.55],[1.25,1.02,.55],p2):lerp3(cube,[1.25,.62,.55],p1)):cube;
 return {cube,tip,ghost,open};
};
export const RobotSafetyAction:React.FC<{phase:number;option:'a'|'b';p0:number;p1:number;p2:number}>=({phase,option,p0,p1,p2})=>{
 const art=useArtDirection(),palette=art?.palette??colors,view=robotSafetyView(phase,option);
 const {cube,tip,ghost,open}=robotSafetyPose(phase,p0,p1,p2);
 const demonstrated=phase===0?0:phase===1||phase===2?(p0+p1+p2)/3:1;
 const unsafe:V3[]=[START,[-.72,.61,.36],[-.48,.61,.23],BOUNDARY];
 return <CinematicStage {...view}>
  <group rotation={[0,Math.PI/2,0]}>
  <mesh position={[0,-.15,0]} receiveShadow castShadow><boxGeometry args={[5.15,.30,3.45]}/><meshStandardMaterial color={palette.midground} roughness={.66} metalness={.18}/></mesh>
  <mesh position={[0,.005,0]} receiveShadow><boxGeometry args={[4.98,.012,3.28]}/><meshStandardMaterial color={palette.foreground} roughness={.73}/></mesh>
  {[[-2,-.9,-1.25],[2,-.9,-1.25],[-2,-.9,1.25],[2,-.9,1.25]].map((p,i)=><mesh key={i} position={p as V3}><boxGeometry args={[.16,1.5,.16]}/><Metal color={palette.midground}/></mesh>)}
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-1.67,0]} receiveShadow><planeGeometry args={[200,200]}/><meshStandardMaterial color={palette.background} roughness={.82}/></mesh>
  <Trace points={SAFE} color={palette.accent} progress={demonstrated} wide={option==='b'}/>
  {option==='b'&&<><Trace points={SAFE} color={palette.accent} progress={demonstrated} offset={.12}/><Trace points={SAFE} color={palette.accent} progress={demonstrated} offset={-.12}/></>}
  {phase===2&&option==='a'&&[-.08,.10].map((o,i)=><Trace key={i} points={SAFE} color={palette.accent} progress={p2} offset={o}/>)}
  {(phase===3||phase===4)&&<Trace points={unsafe} color={CORAL} progress={phase===3?(p0+p1+p2)/3:1}/>}
  {phase===4&&<Trace points={[START,lerp3([-.72,.61,.36],APPROACH,p0),lerp3([-.48,.61,.23],TURN,p0),lerp3(BOUNDARY,GOAL,p0)]} color={palette.accent} progress={1} wide={option==='b'}/>}
  {phase===6&&<Trace points={[START,[-.47,.61,.80],[.12,.61,1.15],[1.25,.61,.85]]} color={palette.paper} progress={(p0+p1+p2)/3}/>}
  <Vase color={palette.paper}/>
  {ghost&&<><Robot tip={ghost} color={phase===3||phase===4?CORAL:palette.accent} ghost/><Cube position={ghost} color={phase===3||phase===4?CORAL:palette.accent} ghost/></>}
  <Robot tip={tip} open={open} color={palette.hero}/><Cube position={cube}/>
  <group position={[1.25,.014,.55]}><mesh rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.34,.36,48]}/><meshStandardMaterial color={palette.paper} transparent opacity={.40} side={THREE.DoubleSide}/></mesh></group>
  </group>
 </CinematicStage>;
};
