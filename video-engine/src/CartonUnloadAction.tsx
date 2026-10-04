import React from "react";
import {Euler} from "three";
import {CinematicStage} from "./lib/cinema/CinematicStage";
import {mix,type V3} from "./lib/cinema/motion";
const Box:React.FC<{p:V3;identified?:boolean;width?:number}>=({p,identified=false,width=.95})=><group position={p}>
 <mesh castShadow receiveShadow><boxGeometry args={[width,.9,.92]}/><meshStandardMaterial color={identified?"#c48b49":"#927044"} roughness={.92}/></mesh>
 {/* Packing tape and seam conserve the one carton through every cut. */}
 <mesh position={[0,.453,0]}><boxGeometry args={[.12,.006,.92]}/><meshStandardMaterial color="#e1c598" roughness={.7}/></mesh>
 <mesh position={[0,0,.463]}><boxGeometry args={[.12,.9,.007]}/><meshStandardMaterial color="#e1c598"/></mesh>
 {[.17,.24,.31].map((y,i)=><mesh key={i} position={[-.29,y,.468]}><boxGeometry args={[.14,.014,.006]}/><meshStandardMaterial color="#55412a"/></mesh>)}
 {identified&&<mesh position={[.22,-.18,.468]}><boxGeometry args={[.24,.22,.008]}/><meshStandardMaterial color="#f2e7c7"/></mesh>}
 {/* Narrow seams and pressed edge marks make corrugated packaging legible. */}
 {[-width/2+.035,width/2-.035].map(x=><mesh key={x} position={[x,0,.468]}><boxGeometry args={[.012,.86,.006]}/><meshStandardMaterial color="#73512d"/></mesh>)}
</group>;
const Beam:React.FC<{from:V3;to:V3;color?:string;radius?:number}>=({from,to,color="#7fd9cf",radius=.012})=>{
 const dx=to[0]-from[0],dy=to[1]-from[1],dz=to[2]-from[2],length=Math.sqrt(dx*dx+dy*dy+dz*dz);
 // Explicit world endpoints, deterministic orientation with no incremental simulation.
 const yaw=Math.atan2(dx,dz),pitch=Math.acos(dy/Math.max(length,.001));
 return <mesh position={from.map((v,i)=>(v+to[i])/2) as V3} rotation={[0,yaw,0]}><group rotation={[pitch,0,0]}><mesh><cylinderGeometry args={[radius,radius,length,12]}/><meshStandardMaterial color={color} emissive={color} emissiveIntensity={.18}/></mesh></group></mesh>;
};
const Plate:React.FC<{side?:boolean;engage:number}>=({side=false,engage})=><group position={side?[.475+.18*(1-engage),0,0]:[0,0,.46+.23*(1-engage)]} rotation={side?[0,Math.PI/2,0]:[0,0,0]}>
 <mesh position={[0,0,.1]}><boxGeometry args={[.55,.58,.09]}/><meshStandardMaterial color="#263438" metalness={.65} roughness={.35}/></mesh>
 {[-.17,.17].flatMap(x=>[-.18,.18].map(y=><group key={`${x}-${y}`} position={[x,y,.033]}><mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.09,.065,.065,24]}/><meshStandardMaterial color="#d1ae59" roughness={.75}/></mesh><mesh position={[0,0,-.014]} rotation={[0,0,0]}><torusGeometry args={[.069,.018,10,24]}/><meshStandardMaterial color="#3b3730"/></mesh></group>))}
</group>;
export const cartonView=(phase:number,option:"a"|"b",a=0,b=0,c=0):{position:V3;target:V3;fov:number}=>{
 // Close-action staging follows the existing event clock. Detail cuts never replace the physical gesture.
 if(phase===1){
  if(c>0)return option==="a"?{position:[1.8,1.4,2.5],target:[2.3,1.25,1.4],fov:105}:{position:[1.65,1.55,2.7],target:[2.3,1.2,1.4],fov:100};
  return option==="a"?{position:[2.7,1.8,3.9],target:[1.45,.65,1.1],fov:65}:{position:[2.4,2,4],target:[1.45,.65,1.1],fov:68};
 }
 if(phase===4){
  if(c>0)return option==="a"?{position:[2.1,1.8,4.3],target:[1.1,.8,1.7],fov:88}:{position:[1.85,2.3,4.6],target:[1.05,.8,1.65],fov:78};
  return option==="a"?{position:[2.3,1,4],target:[1.85,1,1.5],fov:117}:{position:[2.1,1.3,4.3],target:[1.85,.75,1.5],fov:115};
 }
 const views:[V3,V3,number][] = option==="a"?[
 [[3.5,2.2,5.6],[.35,.9,.8],37],[[3.8,2.2,7.3],[.1,.95,1.45],38],[[2.65,1.8,4.4],[.78,.65,1.05],36],[[3.2,2.2,4.9],[.75,.75,1.65],36],[[3.7,2.5,6.8],[.35,1,1.3],37],[[3.9,2.7,7.3],[.4,.75,2.35],38],[[3.1,2.1,5.6],[.5,.8,2.6],37],[[3.5,2.4,6.6],[.35,.65,3.1],37]
 ]:[
 [[.3,1.55,5.8],[.2,1,.7],36],[[.6,2.8,7.2],[.2,.8,1.45],38],[[2.8,1.7,3.4],[.85,.6,1.05],36],[[2.6,2.8,3.8],[.7,.78,1.6],37],[[.4,3.6,6.2],[.2,.8,1.4],38],[[.4,4.8,6.2],[.2,.65,2.1],38],[[.35,2.1,6.2],[.2,.75,2.8],36],[[.3,3.3,6.2],[.2,.6,3],37]
 ];
 const [position,target,fov]=views[phase];
 // Purposeful opening reveal and a transfer follow, bounded by board events.
 return {position:[position[0]+(phase===0?-.3*a:0),position[1],position[2]],target:[target[0],target[1],target[2]+(phase===5?.25*b:0)],fov};
};
export const CartonUnloadAction:React.FC<{phase:number;option:"a"|"b";a:number;b:number;c:number}>=({phase,option,a,b,c})=>{
 let z=.7,y=.45;
 if(phase===2)z+=.06*b+.06*c;
 if(phase===3){z=.82+.6*a+.28*b;y=.45+.3*c;}
 if(phase===4){z=1.7;y=.75;}
 if(phase===5){z=1.7+1.2*b+.35*c;y=.75+.08*c;}
 if(phase===6){z=3.25;y=.83;}
 if(phase===7){z=3.25+.32*c;y=.83-.08*a;}
 const engage=phase<2?0:phase===2?a:phase===7?1-b:1;
 const p:V3=[.75,y,z],view=cartonView(phase,option,a,b,c);
 const sensor:V3=[2.6,1.9,z+.8];
 // Lens faces local negative Z. YXZ applies pitch before yaw, matching this target vector.
 const sensorTarget:V3=[p[0],p[1],p[2]+.46];
 const sensorDelta=sensorTarget.map((v,i)=>v-sensor[i]) as V3;
 const sensorYaw=Math.atan2(-sensorDelta[0],-sensorDelta[2]);
 const sensorPitch=Math.atan2(sensorDelta[1],Math.hypot(sensorDelta[0],sensorDelta[2]));
 const sensorTurn=phase===1?c:phase>1?1:0;
 const sensorRotation=new Euler(sensorPitch*sensorTurn,sensorYaw*sensorTurn,0,"YXZ");
 const frontGap=.23*(1-(phase===0?a:phase===7?1-b:1));
 const sideShift=phase===0?.6-.15*b-.15*c:phase===1?.3*(1-a):0;
 const sideY=phase===0?.18:phase===1?.18*(1-b):0;
 const sideBack=.75+.615+.18*(1-engage)+sideShift;
 const frontZ=z+.9;
 // All load-bearing segments stay on the outside of carton solids, including their radii.
 return <CinematicStage {...view}>
 <mesh position={[0,-.09,1.9]} receiveShadow><boxGeometry args={[6,.18,6.2]}/><meshStandardMaterial color="#6f7778" roughness={.8}/></mesh>
 <mesh position={[0,1.4,-.13]}><boxGeometry args={[4.1,2.8,.14]}/><meshStandardMaterial color="#929c9c" metalness={.35} roughness={.65}/></mesh>
 {Array.from({length:22},(_,i)=><mesh key={i} position={[-2+i*.19,1.4,-.035]}><boxGeometry args={[.047,2.8,.045]}/><meshStandardMaterial color="#6e7b7e" roughness={.6}/></mesh>)}
 <mesh position={[-2.03,1.4,1.7]}><boxGeometry args={[.08,2.8,3.6]}/><meshStandardMaterial color="#879493" metalness={.3}/></mesh>
 {/* Every remaining carton rests on the floor or an unchanged lower carton. */}
 {[-1.25,-.25].map(x=><Box key={x} p={[x,.45,.7]}/>)}
 {/* Broad upper cartons cover the entire target top; their centers stay over the unchanged left support. */}
 <Box p={[-.25,1.35,.7]} width={3}/><Box p={[-.25,2.25,.7]} width={3}/>
 <Box p={p} identified/>
 {/* Roller bed top is exactly at the conserved carton bottom after lift. */}
 {[.1,1.4].map(x=><group key={x}><mesh position={[x,.12,3.5]}><boxGeometry args={[.09,.25,2.15]}/><meshStandardMaterial color="#293d40" metalness={.65}/></mesh>{[2.55,4.45].map(z=><mesh key={z} position={[x,-.01,z]}><boxGeometry args={[.1,.18,.12]}/><meshStandardMaterial color="#384b4e"/></mesh>)}</group>)}
 {Array.from({length:13},(_,i)=><mesh key={i} position={[.75,.235,2.45+i*.17]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.065,.065,1.32,24]}/><meshStandardMaterial color="#aab4b1" metalness={.8} roughness={.3}/></mesh>)}
 {/* Generic floor-supported external carriage. Its upright and elbow never cross the stack. */}
 <mesh position={[2.6,.22,z+.8]}><boxGeometry args={[.6,.44,.8]}/><meshStandardMaterial color="#3b5559" metalness={.55}/></mesh>
 <mesh position={[2.6,1.11,z+.8]}><boxGeometry args={[.14,1.78,.14]}/><meshStandardMaterial color="#788d8d" metalness={.7}/></mesh>
 <Beam from={[2.6,y,z+.8]} to={[2.6,y,frontZ]} color="#70898c" radius={.06}/>
 {/* Front brace runs wholly beyond the front face before meeting its metal backing. */}
 <Beam from={[2.6,y,frontZ]} to={[.75,y,frontZ]} color="#4d6569" radius={.04}/>
 <Beam from={[.75,y,frontZ]} to={[.75,y,z+.60+frontGap]} color="#4d6569" radius={.04}/>
 {/* Separate side elbow remains beyond side extent, then meets its backing from outside. */}
 <Beam from={[2.6,y,frontZ]} to={[2.6,y+sideY,frontZ]} color="#4d6569" radius={.04}/>
 <Beam from={[2.6,y+sideY,frontZ]} to={[sideBack,y+sideY,frontZ]} color="#4d6569" radius={.04}/>
 <Beam from={[sideBack,y+sideY,frontZ]} to={[sideBack,y+sideY,z]} color="#4d6569" radius={.04}/>
 <group position={p}><Plate engage={phase===0?a:phase===7?1-b:1}/><group position={[sideShift,sideY,0]}><Plate side engage={engage}/></group></group>
 <Beam from={[2.6,1.82,z+.8]} to={sensor} color="#70898c" radius={.045}/>
 <group position={sensor} rotation={sensorRotation}><mesh><boxGeometry args={[.27,.18,.22]}/><meshStandardMaterial color="#24383a"/></mesh><mesh position={[0,0,-.12]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.057,.057,.035,24]}/><meshStandardMaterial color="#8ac8ce" metalness={.5}/></mesh></group>
 {phase===4&&<>
 {/* Source-bound conceptual relationships extend once from the visible sensor to each named physical target. */}
 <Beam from={sensor} to={[mix(sensor[0],p[0],a),mix(sensor[1],p[1],a),mix(sensor[2],p[2]+.46,a)]} radius={.027}/>
 {b>0&&<Beam from={sensor} to={[mix(sensor[0],1.7,b),mix(sensor[1],1.3,b),mix(sensor[2],0,b)]} color="#f0ce8b" radius={.027}/>}
 {/* Corner traces grow along the same box extent; these are qualitative editorial geometry, never measured output. */}
 {c>0&&<>
 {/* Constant-opacity qualitative faces grow across the conserved front/side extents, not a fading annotation or actual customer output. */}
 <mesh position={[p[0]-.49+.49*c,p[1]-.465+.465*c,p[2]+.48]}><boxGeometry args={[.98*c,.93*c,.008]}/><meshBasicMaterial color="#90e3d8" transparent opacity={.22} depthWrite={false}/></mesh>
 <mesh position={[p[0]+.49,p[1]-.465+.465*c,p[2]-.475+.475*c]}><boxGeometry args={[.008,.93*c,.95*c]}/><meshBasicMaterial color="#90e3d8" transparent opacity={.22} depthWrite={false}/></mesh>
 <mesh position={[1.54+.16*c,1.06+.24*c,.016]}><boxGeometry args={[.32*c,.48*c,.008]}/><meshBasicMaterial color="#f0ce8b" transparent opacity={.22} depthWrite={false}/></mesh>
 </>}

 {c>0&&[-1,1].flatMap(x=>[-1,1].flatMap(y=>[-1,1].map(z=>{
  const v:V3=[p[0]+x*.49,p[1]+y*.465,p[2]+z*.475];
  return <group key={`${x}-${y}-${z}`}>
   <Beam from={v} to={[v[0]-x*.49*c,v[1],v[2]]} radius={.018}/>
   <Beam from={v} to={[v[0],v[1]-y*.465*c,v[2]]} radius={.018}/>
   <Beam from={v} to={[v[0],v[1],v[2]-z*.475*c]} radius={.018}/>
  </group>;
 })))}
 {c>0&&[-1,1].flatMap(x=>[-1,1].map(y=>{
  const v:V3=[1.7+x*.16,1.3+y*.24,.015];
  return <group key={`wall-${x}-${y}`}>
   <Beam from={v} to={[v[0]-x*.16*c,v[1],v[2]]} color="#f0ce8b" radius={.018}/>
   <Beam from={v} to={[v[0],v[1]-y*.24*c,v[2]]} color="#f0ce8b" radius={.018}/>
  </group>;
 }))}
 </>}
 {phase===5&&Array.from({length:16},(_,i)=>i/15<=a?<mesh key={i} position={[.75,.78,1.7+i/15*1.55]}><sphereGeometry args={[.025,10,8]}/><meshStandardMaterial color="#90e3d8"/></mesh>:null)}
 {phase===6&&<>
 <Beam from={[.75,1.24,3.25]} to={[mix(.75,-.8,a),mix(1.24,1.6,a),mix(3.25,3.3,a)]} color="#e0b767" radius={.018*a}/>
 <mesh position={[-.8,1.6,3.3]} scale={.07+b*.025+c*.012}><sphereGeometry args={[1,20,16]}/><meshStandardMaterial color="#edc784"/></mesh>
 </>}
 </CinematicStage>;
};
