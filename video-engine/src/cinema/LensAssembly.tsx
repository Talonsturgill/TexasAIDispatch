import React,{useMemo,useEffect} from 'react';
import * as THREE from 'three';
import {cue} from '../lib/cinema/motion';
import {stateAt} from './plan';

const metal={color:'#b2b8b4',metalness:.94,roughness:.24};
const dark={color:'#14252b',metalness:.8,roughness:.3};
const brass={color:'#b57b42',metalness:.88,roughness:.25};
const ringShape=(inner:number,outer:number,thickness:number)=>{
  const p=[[inner,-thickness/2],[outer-.03,-thickness/2],[outer,-thickness/2+.03],
    [outer,thickness/2-.03],[outer-.03,thickness/2],[inner,thickness/2],[inner,-thickness/2]];
  return new THREE.LatheGeometry(p.map(([x,y])=>new THREE.Vector2(x,y)),96);
};
const Ring:React.FC<{z:number;r:number;inside?:number;thickness?:number;warm?:boolean;black?:boolean}>=
({z,r,inside=r-.14,thickness=.14,warm=false,black=false})=>{
  const geo=useMemo(()=>ringShape(inside,r,thickness),[inside,r,thickness]);
  useEffect(()=>()=>geo.dispose(),[geo]);
  return <mesh geometry={geo} rotation={[Math.PI/2,0,0]} position={[0,0,z]} castShadow receiveShadow>
    <meshStandardMaterial {...(warm?brass:black?dark:metal)}/>
  </mesh>;
};
const Screw:React.FC<{x:number;y:number;z:number}> = ({x,y,z})=><group position={[x,y,z]}>
  <mesh rotation={[Math.PI/2,0,0]} castShadow><cylinderGeometry args={[.075,.075,.055,12]}/><meshStandardMaterial {...metal}/></mesh>
  <mesh position={[0,0,.03]}><boxGeometry args={[.08,.016,.01]}/><meshStandardMaterial color="#152329"/></mesh>
</group>;
export const LensAssembly:React.FC<{t:number}>=({t})=>{
 const s=stateAt(t),e=s.apart;
 const blade=useMemo(()=>{
   const inner=s.iris*.8,outer=.81,a=Math.PI*2/9;
   const p=new THREE.Shape();
   p.moveTo(inner,0);
   p.quadraticCurveTo(outer*.75,-.19,outer,0);
   p.absarc(0,0,outer,0,a*1.42,false);
   p.lineTo(Math.cos(a*1.42)*inner,Math.sin(a*1.42)*inner);
   p.absarc(0,0,inner,a*1.42,0,true);
   p.closePath();
   return new THREE.ExtrudeGeometry(p,{depth:.012,bevelEnabled:true,bevelSize:.006,bevelThickness:.004,bevelSegments:2,steps:1});
 },[s.iris]);
 const beam=useMemo(()=>{
   const geom=new THREE.BufferGeometry();
   const points:number[]=[];
   for(let k=0;k<18;k++){
     const a=k*Math.PI*2/18,r=.62;
     points.push(Math.cos(a)*r,Math.sin(a)*r,4.3,Math.cos(a)*r*.8,Math.sin(a)*r*.8,1.8,
       Math.cos(a)*r*.8,Math.sin(a)*r*.8,1.8,0,0,-1.05);
   }
   geom.setAttribute('position',new THREE.Float32BufferAttribute(points,3)); return geom;
 },[]);
 useEffect(()=>()=>blade.dispose(),[blade]);
 useEffect(()=>()=>beam.dispose(),[beam]);
 return <group rotation={[0,0,s.spin]}>
   {/* Die-cast body, heat fins and visible fasteners. */}
   <group position={[0,0,-1.1-e*.6]}>
    <mesh castShadow receiveShadow><boxGeometry args={[2.34,2.1,.8]}/><meshStandardMaterial {...dark}/></mesh>
    {Array.from({length:12},(_,i)=><mesh key={i} position={[-1.22+i*.222,0,-.37]} castShadow>
      <boxGeometry args={[.09,2.22,.4]}/><meshStandardMaterial color="#283b40" metalness={.8} roughness={.3}/>
    </mesh>)}
    <mesh position={[1.23,-.35,-.1]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.19,.19,.3,24]}/><meshStandardMaterial {...brass}/></mesh>
    <mesh position={[0,0,.425]}><boxGeometry args={[1.94,1.73,.03]}/><meshStandardMaterial color="#153c33" metalness={.35} roughness={.5}/></mesh>
    {/* Copper traces, ceramic chip package, microscopic sensor grid. */}
    {Array.from({length:22},(_,i)=><group key={i}>
      <mesh position={[-.92+i*.086,0,.45]}><boxGeometry args={[.009,1.6,.004]}/><meshStandardMaterial color="#bb8451" metalness={.8} roughness={.3}/></mesh>
      <mesh position={[0,-.78+i*.07,.453]}><boxGeometry args={[1.84,.009,.004]}/><meshStandardMaterial color="#bb8451" metalness={.8} roughness={.3}/></mesh>
    </group>)}
    <mesh position={[0,0,.48]}><boxGeometry args={[1.26,1.14,.12]}/><meshStandardMaterial color="#1a1d21" roughness={.28} metalness={.4}/></mesh>
    <mesh position={[0,0,.56]}><boxGeometry args={[1.04,.87,.025]}/><meshPhysicalMaterial color="#215d70" metalness={.5} roughness={.13} clearcoat={1}/></mesh>
    {Array.from({length:144},(_,i)=>{
      const x=(i%12-5.5)*.078,y=(Math.floor(i/12)-5.5)*.063;
      const response=cue(t,10.5+(i%12)*.12,11.1+(i%12)*.12);
      return <mesh key={i} position={[x,y,.578]}>
        <boxGeometry args={[.048,.043,.006]}/><meshStandardMaterial color={i%3===0?'#53999c':'#375f85'}
          metalness={.6} roughness={.25} emissive="#75e9d0" emissiveIntensity={response*.65}/>
      </mesh>;
    })}
    {[-1,1].flatMap(x=>[-.87,.87].map(y=><Screw key={x+','+y} x={x} y={y} z={.48}/>))}
   </group>
   {/* Five floating optical groups, with independent staggered separation. */}
   {[0,1,2,3,4].map(i=>{
     const stagger=cue(t,5+i*.14,7.05+i*.14)*(1-cue(t,14+i*.12,16+i*.12));
     const z=-.42+i*.31+stagger*(i*.49+.12);
     const r=i===4?1.33:1.08;
     return <group key={i}>
       <Ring z={z} r={r} inside={i===4?.89:.83} thickness={i===4?.24:.14} black={i===4} warm={i===1||i===3}/>
       <Ring z={z+.08} r={r+.018} inside={r-.025} thickness={.025}/>
       {i<4&&<mesh position={[0,0,z]} scale={[.89,.89,.10]}>
         <sphereGeometry args={[1,48,24]}/>
         <meshPhysicalMaterial color={i%2?'#64a9af':'#69939d'} metalness={.22} roughness={.08}
           transparent opacity={.22} clearcoat={1} clearcoatRoughness={.08} side={THREE.DoubleSide} depthWrite={false}/>
       </mesh>}
       {i===4&&Array.from({length:64},(_,j)=>{
         const a=j*Math.PI/32;
         return <mesh key={j} position={[Math.cos(a)*1.337,Math.sin(a)*1.337,z]} rotation={[0,0,a]}>
           <boxGeometry args={[.024,.023,.23]}/><meshStandardMaterial {...metal} color="#516267"/>
         </mesh>;
       })}
       {i===1&&Array.from({length:9},(_,j)=>{
         const a=j*Math.PI*2/9;
         return <group key={j} position={[0,0,z+.025+j*.001]}
            rotation={[0,0,a+.28]}>
           <mesh geometry={blade} castShadow><meshStandardMaterial color="#506068" metalness={.95} roughness={.26} side={THREE.DoubleSide}/></mesh>
         </group>;
       })}
     </group>;
   })}
   <lineSegments geometry={beam}>
     <lineBasicMaterial color="#c6ffee" transparent opacity={s.light*.52} depthWrite={false}/>
   </lineSegments>
   {/* Tiny packets move only when the optical path is exposed. */}
   {Array.from({length:28},(_,i)=>{
     const travel=((t-8)*.75+i/28)%1;
     const z=4.3-travel*5.35,r=z<1.8?Math.max(0,(z+1.05)/2.85)*.5:.62;
     const a=i*2.399963;
     return <mesh key={i} visible={t>=8&&t<15} position={[Math.cos(a)*r,Math.sin(a)*r,z]}>
       <sphereGeometry args={[.013,6,6]}/><meshBasicMaterial color="#e7fff1" transparent opacity={s.light}/>
     </mesh>;
   })}
 </group>;
};
