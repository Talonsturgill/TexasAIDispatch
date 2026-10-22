import React from 'react';
import {CinematicStage} from './lib/cinema/CinematicStage';
import type {V3} from './lib/cinema/motion';

// Generic explanatory plot. No actual farm, crop measurement or model output is recreated.
const Plant:React.FC<{x:number;z:number;growth?:number;ghost?:boolean;color?:string}>=({x,z,growth=1,ghost=false,color='#9dcbd0'})=><group position={[x,.12,z]} scale={[1,growth,1]}>
 <mesh position={[0,.48,0]} castShadow={!ghost}><cylinderGeometry args={[.018,.025,.96,12]}/><meshStandardMaterial color={ghost?color:'#79904c'} roughness={.85} transparent={ghost} opacity={ghost?.45:1} wireframe={ghost}/></mesh>
 {[-1,1].map((side,i)=><group key={side} position={[0,.35+i*.19,0]} rotation={[0,.35*side,.6*side]}><mesh position={[side*.15,.1,0]} scale={[.31,.11,.09]} castShadow={!ghost}><sphereGeometry args={[1,18,10]}/><meshStandardMaterial color={ghost?color:i?'#91a957':'#688849'} roughness={.82} transparent={ghost} opacity={ghost?.45:1} wireframe={ghost}/></mesh></group>)}
 <mesh position={[0,.95,0]} scale={[.09,.25,.07]} rotation={[0,0,-.2]}><sphereGeometry args={[1,18,10]}/><meshStandardMaterial color={ghost?color:'#8da251'} transparent={ghost} opacity={ghost?.45:1} wireframe={ghost}/></mesh>
</group>;
const Pipe:React.FC<{water:number}>=({water})=><group>
 <mesh position={[0,-.34,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.055,.055,2.8,24]}/><meshStandardMaterial color="#293940" roughness={.67}/></mesh>
 {[-.8,0,.8].map((x,i)=><group key={x}><mesh position={[x,-.34,.06]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.021,.021,.07,16]}/><meshStandardMaterial color="#829997"/></mesh>
 {Array.from({length:7},(_,j)=>{const p=Math.max(0,Math.min(1,(water-j*.045)*1.35));return p>0?<mesh key={j} position={[x+(j%2?1:-1)*.12*p,-.34-.24*p,.08+.13*p]} scale={[.055,.04,.04]}><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color="#87cdd1" metalness={.1} roughness={.23}/></mesh>:null;})}
 <mesh position={[x,-.5,.16]} scale={[.46*water,.3*water,.34*water]}><sphereGeometry args={[1,20,12]}/><meshStandardMaterial color="#438fa2" roughness={.83}/></mesh></group>)}
 <mesh position={[-1.35,-.27,0]}><boxGeometry args={[.14,.21,.17]}/><meshStandardMaterial color="#a2a9a3" metalness={.55} roughness={.4}/></mesh>
 <group position={[-1.35,-.11,0]} rotation={[0,water*Math.PI/2,0]}><mesh><boxGeometry args={[.29,.035,.045]}/><meshStandardMaterial color="#cc794d"/></mesh></group>
</group>;
const Plot:React.FC<{water:number;cutaway?:boolean;growth?:number}>=({water,cutaway=false,growth=1})=><group>
 <mesh position={[0,-.6,cutaway?-.4:-.22]} receiveShadow><boxGeometry args={[3,.95,cutaway?.56:1.55]}/><meshStandardMaterial color="#816344" roughness={1}/></mesh>
 <mesh position={[0,-.08,cutaway?-.4:-.22]} receiveShadow><boxGeometry args={[3,.09,cutaway?.56:1.55]}/><meshStandardMaterial color="#ad8759" roughness={1}/></mesh>
 {[-.8,0,.8].map(x=><group key={x}><Plant x={x} z={cutaway?0:-.12} growth={growth}/>
 <mesh position={[x,-.03,cutaway?0:-.12]}><cylinderGeometry args={[.022,.017,.3,12]}/><meshStandardMaterial color="#b8b37b"/></mesh>
 {[-1,1].map(side=><mesh key={side} position={[x+side*.07,-.28,cutaway?0:-.12]} rotation={[0,0,side*.45]}><cylinderGeometry args={[.013,.004,.58,12]}/><meshStandardMaterial color="#d5bd88"/></mesh>)}</group>)}
 {cutaway&&<Pipe water={water}/>}
 {[-1.24,-.5,.45,1.12].map((x,i)=><mesh key={i} position={[x,-.01,-.45]} scale={[.075,.035,.09]}><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color="#76674f"/></mesh>)}
</group>;
const Drone:React.FC<{x:number;z:number}>=({x,z})=><group position={[x,1.9,z]}>
 <mesh castShadow><boxGeometry args={[.27,.11,.2]}/><meshStandardMaterial color="#deded0" metalness={.35}/></mesh>
 {[-1,1].flatMap(a=>[-1,1].map(b=><group key={`${a}${b}`}><mesh position={[a*.18,0,b*.18]} rotation={[0,-a*b*Math.PI/4,0]}><boxGeometry args={[.36,.04,.05]}/><meshStandardMaterial color="#3c4645"/></mesh><mesh position={[a*.32,.04,b*.32]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.13,.012,8,24]}/><meshStandardMaterial color="#414b49"/></mesh><mesh position={[a*.32,.04,b*.32]}><boxGeometry args={[.25,.012,.033]}/><meshStandardMaterial color="#c9d0ca"/></mesh></group>))}
 <mesh position={[0,-.09,0]}><sphereGeometry args={[.055,16,12]}/><meshStandardMaterial color="#263f47" metalness={.7}/></mesh>
</group>;
const GroundSensor:React.FC<{rise:number}>=({rise})=><group position={[1.22,-.1+.12*(1-rise),-.22]}>
 <mesh position={[0,.08,0]}><boxGeometry args={[.13,.22,.12]}/><meshStandardMaterial color="#cccdbb"/></mesh>
 <mesh position={[0,-.28,0]}><cylinderGeometry args={[.022,.022,.5,12]}/><meshStandardMaterial color="#677c7b" metalness={.65}/></mesh>
 <mesh position={[0,.2,.066]}><sphereGeometry args={[.025,12,8]}/><meshStandardMaterial color="#b7cc7d" emissive="#768e42" emissiveIntensity={.15}/></mesh>
</group>;
const SampleMap:React.FC<{index:number;join:number;fill:number;color:string}>=({index,join,fill,color})=><group position={[(index-1)*1.1*(1-join),1.55+index*.05,(index-1)*.75*(1-join)-.35]} scale={[.7,.7,.7]}>
 <mesh><boxGeometry args={[2.45,.025,1.15]}/><meshStandardMaterial color="#d3c7a0" roughness={.9}/></mesh>
 {Array.from({length:12},(_,i)=>{const on=fill>i/13;return <mesh key={i} position={[-.96+(i%4)*.64,.022,-.38+Math.floor(i/4)*.38]}><boxGeometry args={[.54,.017,.29]}/><meshStandardMaterial color={on?color:'#b7b297'} roughness={.9}/></mesh>;})}
</group>;
export const CropWaterAction:React.FC<{phase:number;option:'a'|'b';a:number;b:number;c:number}>=({phase,option,a,b,c})=>{
 const close=phase===0||phase===2,overhead=option==='b';
 const positions:V3[]=overhead?[[.2,3.6,4.8],[.4,5.8,5.3],[.2,2.1,4.8],[.1,3.1,9.2],[.2,5.5,5.7],[.2,3.6,6],[.2,3.3,5.4],[.2,2.4,5.5]]:[[3,1.9,4.9],[3.8,3.1,6.2],[2.1,.85,3.6],[1.2,2.8,9.2],[3,3.8,5.6],[3.4,2.5,6.2],[2.9,2,5.3],[2.8,1.6,4.8]];
 const target:V3=[0,phase===4?.8:phase===3?.9:.35,0];
 const water=phase===0?a*(.65+.35*c):phase===2?.15+.6*a+.2*c:phase>2?.95:0;
 return <CinematicStage position={positions[phase]} target={target} fov={close?40:42} exposure={1.2}>
 <mesh position={[0,-1.11,0]} receiveShadow><boxGeometry args={[8,.12,6]}/><meshStandardMaterial color="#ac936d" roughness={1}/></mesh>
 {phase===1?<><group position={[-1.6,0,-.15]} scale={.75}><Plot water={0} cutaway/></group><group position={[1.4,0,-.15]} scale={.75}><Plot water={a*(.65+.35*b)} cutaway/></group></>:<Plot water={water} cutaway={phase!==3&&phase!==4}/>} 
 {phase===0&&b>0&&<GroundSensor rise={b}/>}
 {phase===1&&c>0&&<GroundSensor rise={c}/>}
 {phase===2&&b>0&&<GroundSensor rise={b}/>}
 {phase===3&&<><Drone x={-1.1+2.2*a} z={-.2}/><mesh position={[-1.1+2.2*a,.96,-.2]}><coneGeometry args={[.65,1.8,32]}/><meshStandardMaterial color="#80bdc0" transparent opacity={.22} depthWrite={false}/></mesh><mesh position={[-1.1+2.2*a,.02,-.2]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.65,32]}/><meshStandardMaterial color="#80bdc0" transparent opacity={.5} depthWrite={false}/></mesh><GroundSensor rise={b}/>{c>0&&<group position={[-.65-.65*(1-c),2.1+.25*(1-c),-.65]} scale={.75}><mesh><boxGeometry args={[.35,.24,.3]}/><meshStandardMaterial color="#c8c2a8" metalness={.6}/></mesh>{[-1,1].map(x=><mesh key={x} position={[x*.65,0,0]}><boxGeometry args={[.9,.05,.4]}/><meshStandardMaterial color="#35495b" metalness={.5}/></mesh>)}</group>}</>}
 {phase>=4&&<><SampleMap index={0} join={phase===4?a:1} fill={phase===4?a:1} color="#97ad6a"/><SampleMap index={1} join={phase===4?b:1} fill={phase===4?b:1} color="#80bdc0"/><SampleMap index={2} join={phase===4?c:1} fill={phase===4?c:1} color="#c7965d"/></>}
 {phase===5&&<>{a>0&&<Plant x={-.1} z={.07} growth={1+.5*a} ghost color="#b5dedb"/>}{b>0&&<Plant x={.1} z={.07} growth={1+.85*b} ghost color="#e4bb78"/>}<group position={[0,2.0,.2]} scale={[c,c,c]}><mesh><torusGeometry args={[.21,.035,12,36,Math.PI*1.6]}/><meshStandardMaterial color="#d2b777"/></mesh><mesh position={[0,-.34,0]}><sphereGeometry args={[.04,12,8]}/><meshStandardMaterial color="#d2b777"/></mesh></group></>}
 {phase===6&&<><GroundSensor rise={a}/><group position={[0,1.4,0]} scale={[.4*b,.7*b,.4*b]}><mesh><sphereGeometry args={[.38,24,16]}/><meshStandardMaterial color="#92ced1" roughness={.28}/></mesh><mesh position={[0,.35,0]} rotation={[0,0,Math.PI/4]}><coneGeometry args={[.25,.5,24]}/><meshStandardMaterial color="#92ced1"/></mesh></group>{c>0&&<mesh position={[0,1.2,.35]} rotation={[0,0,-.2]}><boxGeometry args={[1,.025,.04]}/><meshStandardMaterial color="#edc58a"/></mesh>}</>}
 {phase===7&&<><GroundSensor rise={a}/><mesh position={[0,-.4-.9*b,.29]}><boxGeometry args={[3,.75,.025]}/><meshStandardMaterial color="#ad8759" roughness={1}/></mesh><group position={[0,1.45,0]} scale={[.8*c,.8*c,.8*c]}><mesh><torusGeometry args={[.23,.038,12,36,Math.PI*1.6]}/><meshStandardMaterial color="#e2bd7c"/></mesh><mesh position={[0,-.38,0]}><sphereGeometry args={[.045,12,8]}/><meshStandardMaterial color="#e2bd7c"/></mesh></group></>}
 </CinematicStage>;
};
