import React from 'react';
import {CinematicStage} from './lib/cinema/CinematicStage';
import {useArtDirection} from './lib/artDirection';
import type {V3} from './lib/cinema/motion';
const Box:React.FC<{p:V3;s:V3;c:string;r?:V3;unlit?:boolean}>=({p,s,c,r=[0,0,0],unlit=false})=><mesh position={p} rotation={r} castShadow receiveShadow><boxGeometry args={s}/>{unlit?<meshBasicMaterial color={c} toneMapped={false}/>:<meshStandardMaterial color={c} roughness={.78} metalness={.10} envMapIntensity={.18}/>}</mesh>;
const Cyl:React.FC<{p:V3;radius:number;length:number;c:string;r?:V3}>=({p,radius,length,c,r=[Math.PI/2,0,0]})=><mesh position={p} rotation={r} castShadow receiveShadow><cylinderGeometry args={[radius,radius,length,32]}/><meshStandardMaterial color={c} roughness={.5} metalness={.35}/></mesh>;
/** Generic condenser housing, no measured data or CRSC equipment configuration. */
const Unit:React.FC<{x:number;heat:number;identity:number}>=({x,heat,identity})=>{
 const art=useArtDirection();
 return <group position={[x,.02,0]} scale={[.65,1.25,1]}>
 <Box p={[0,.95,0]} s={[1.38,1.75,.9]} c='#38545c'/><Box p={[0,.95,.47]} s={[1.24,1.58,.08]} c={art?.palette.hero??'#56a8aa'} unlit/>
 {Array.from({length:15},(_,i)=><Box key={i} p={[-.56+i*.08,.95,.525]} s={[.018,1.48,.025]} c='#7d9296'/>)}
 {[-.45,.45].map(y=><group key={y} position={[0,.95+y,.58]}>
 <Cyl p={[0,0,0]} radius={.36} length={.06} c='#152a31'/>
 {[0,1,2,3,4].map(i=><Box key={i} p={[.10*Math.cos(i*1.256),.10*Math.sin(i*1.256),.045]} s={[.32,.09,.025]} c='#879ea1' r={[0,0,i*1.256]}/>)}
 <Cyl p={[0,0,.075]} radius={.065} length={.07} c='#bdc8c6'/>
 {[.18,.29,.37].map(radius=><mesh key={radius} position={[0,0,.11]}><torusGeometry args={[radius,.012,8,40]}/><meshStandardMaterial color='#b3bfbc' roughness={.4} metalness={.5}/></mesh>)}
 </group>)}
 {[-.62,.62].flatMap(xx=>[-.76,.76].map(yy=><Cyl key={`${xx}-${yy}`} p={[xx,.95+yy,.53]} radius={.027} length={.035} c='#d5dcd6'/>))}
 <Box p={[0,1.875,0]} s={[1.5,.10,1]} c='#cad2cb'/>
 {[-.43,.43].map(xx=><Box key={xx} p={[xx,.005,0]} s={[.15,.17,1]} c='#263b43'/>)}
 <Cyl p={[.83,.54,-.08]} radius={.044} length={1} c='#aa9072' r={[0,0,0]}/>
 <Cyl p={[.73,.94,-.08]} radius={.044} length={.25} c='#aa9072' r={[0,0,Math.PI/2]}/>
 {/* Schematic heat sits behind fin bars; their fronts remain visible. */}
 <Box p={[0,.215+.735*heat,.515]} s={[1.18,1.47*Math.max(.001,heat),.010]} c={art?.palette.accent??'#ee987c'} unlit/>
 <Box p={[0,1.78,.57]} s={[.28,.10,.025]} c={identity===1?'#f1e7ce':'#5d797c'}/>
 </group>;
};
const Sensor:React.FC<{x:number;aim:number;tilt:number;z?:number;steer:number;roll:number}>=({x,aim,tilt,z=1.45,steer,roll})=><group position={[x,-.12,z]}>
 <Box p={[0,.45,0]} s={[.82,.24,.57]} c='#263f48'/><Box p={[0,.61,0]} s={[.67,.08,.49]} c='#b1c3bd'/>
 {[-.30,.30].flatMap(xx=>[-.2,.2].map(zz=><group key={`${xx}-${zz}`} position={[xx,.17,zz]} rotation={[0,steer,0]}>
 <Cyl p={[0,.17,0]} radius={.045} length={.12} c='#a2b4b1' r={[0,0,0]}/>
 {[-.065,.065].map(side=><Box key={side} p={[side,.075,0]} s={[.025,.15,.055]} c='#7e969a'/>)}
 <group rotation={[roll,0,0]}><Cyl p={[0,0,0]} radius={.13} length={.10} c='#111f26' r={[0,0,Math.PI/2]}/>
 {[-.056,.056].map(side=><Box key={side} p={[side,0,0]} s={[.012,.17,.028]} c='#b1c3bd'/>)}</group>
 </group>))}
 <Cyl p={[0,.80,0]} radius={.047} length={.65} c='#a2b4b1' r={[0,0,0]}/>
 <group position={[0,1.13,0]} rotation={[tilt,aim,0]}><Box p={[0,0,0]} s={[.30,.21,.30]} c='#b9cac2'/><Cyl p={[0,0,-.175]} radius={.072} length={.08} c='#101d27'/><Cyl p={[0,0,-.22]} radius={.048} length={.015} c='#62abae'/></group>
 </group>;
const Thermometer:React.FC<{advance:number;confirm:number}>=({advance,confirm})=><group position={[-.22+.42*advance,1.35,1.25]}>
 <Box p={[0,-.51,0]} s={[.70,.07,.64]} c='#7e9190'/>
 <Box p={[0,-.92,0]} s={[.07,.75,.07]} c='#7e9190'/>
 <Box p={[0,-1.325,0]} s={[.70,.06,.62]} c='#293e45'/>
 {[-.29,.29].flatMap(x=>[-.25,.25].map(z=><Cyl key={`${x}-${z}`} p={[x,-1.375,z]} radius={.055} length={.05} c='#17262c' r={[0,0,Math.PI/2]}/>))}
 <Box p={[0,-.38,0]} s={[.29,.24,.30]} c='#52696e'/>
 <group scale={1.6} rotation={[-.10-.18*advance,.35,.10]}>
 <Box p={[0,0,0]} s={[.16,.48,.18]} c='#d7cfb4' r={[0,0,-.15]}/><Box p={[0,.23,-.12]} s={[.48,.32,.55]} c='#e7dabc'/>
 <Cyl p={[0,.23,-.41]} radius={.09} length={.07} c='#142831'/><Box p={[0,.25,.17]} s={[.40,.25,.018]} c='#152a31' unlit/>
 <Box p={[0,.145+.10*confirm,.184]} s={[.36,.20*Math.max(.001,confirm),.012]} c='#ee987c' unlit/>
 <Box p={[.07,.1,0]} s={[.03,.08,.11]} c='#6b8184'/>
 </group></group>;
export const CoolingInspectionAction:React.FC<{phase:number;a:number;b:number;c:number;option:'a'|'b';steeringProgress:number;parkingProgress:number}>=({phase,a,b,c,option,steeringProgress,parkingProgress})=>{
 const art=useArtDirection();
 const heat=phase===0?.95*a+.025*b+.025*c:phase<3?1:phase===3?1-.35*a-.35*b-.30*c:0;
 const second=phase===4?a*(1-b):0;
 const x=phase===0?-.24:phase===1?.55-1.10*a+1.10*b-.61*c:phase===2?-.06:phase===3?-.06+.2*a:phase===4?.14+.16*a:.3;
 // Independent steering occurs only while the chassis is stationary. Local +z
 // is the rolling direction, and rotation about local +x equals distance/radius.
 const smooth=(p:number)=>{const q=Math.max(0,Math.min(1,p));return q*q*q*(10+q*(-15+6*q));};
 const diagonal=Math.atan2(.61,.65),returnDistance=Math.hypot(.61,.65);
 const steer=phase===1?(Math.PI/2+(diagonal-Math.PI/2)*smooth(steeringProgress))*(1-smooth(parkingProgress)):phase>=3?Math.PI/2:0;
 const roll=phase===1?(-1.10*a+1.10*b-returnDistance*c)/.13:phase===3?(-returnDistance+.2*a)/.13:phase===4?(-returnDistance+.2+.16*a)/.13:(-returnDistance+(phase===5?.36:0))/.13;
 return <CinematicStage position={option==='a'?[1.2,2.8,9.2]:[-.4,4.8,8.6]} target={[.18,.95,.35]} fov={39}>
 <Box p={[0,-.17,0]} s={[6,.18,5]} c={art?.palette.midground??'#374d55'}/><Box p={[0,1.8,-1.8]} s={[6,4,.10]} c={art?.palette.background??'#18353d'}/>
 {[-2.4,2.4].map(xx=><Box key={xx} p={[xx,1.8,-1.71]} s={[.06,3.5,.04]} c='#51666b'/>)}
 <Box p={[0,3.6,-.65]} s={[2,.045,.30]} c='#dbdecf'/>
 <Unit x={phase===0?-.52:-.62} heat={heat} identity={1}/><Unit x={phase===0?.52:.62} heat={second} identity={2}/>
 {phase>0&&<Sensor x={x} z={phase===1?2.10-.65*c:1.45} aim={phase===1?.50-.47*a-.06*b+.38*c:phase>=4?-.5*b:0} tilt={phase===1?.18*a-.03*b+.05*c:0} steer={steer} roll={roll}/>}
 {phase===2&&<Thermometer advance={a} confirm={.5*b+.5*c}/>}
 {phase>=4&&<group position={[.62,1.95,.54]}>
 <Box p={[0,.01,0]} s={[.15,.06,.15]} c='#607a7e'/>
 <group rotation={[0,phase===4?(1-c)*Math.PI/2:0,phase===5?.07*c:0]}><Box p={[0,.10,0]} s={[.04,.20,.04]} c='#ecd6a4'/><Box p={[.17,.18,0]} s={[.40,.24,.035]} c='#e7b06c' unlit/></group>
 </group>}
 {phase===5&&<Thermometer advance={a*.4} confirm={0}/>}
 </CinematicStage>;
};
