import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import {useArtDirection} from '../artDirection';
import type {V3} from '../cinema/motion';

/** Corrugated packaging with thickness, pressed edges and restrained wear. */
export const CartonHero:React.FC<{position:V3; width?:number; identified?:boolean}> =
({position,width=.95,identified=false})=>{
  const art=useArtDirection();
  const geometry=useMemo(()=>{
    const shape=new THREE.Shape(),w=width/2,h=.45;
    shape.moveTo(-w,-h);shape.lineTo(w,-h);shape.lineTo(w,h);shape.lineTo(-w,h);shape.closePath();
    const result=new THREE.ExtrudeGeometry(shape,{depth:.92,steps:1,bevelEnabled:true,
      bevelSize:.014,bevelThickness:.014,bevelSegments:3,curveSegments:3});
    result.translate(0,0,-.46);return result;
  },[width]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  const paper=art?.palette.paper??'#d6c6a9',ink=art?.palette.ink??'#283a43';
  return <group position={position}>
    <mesh geometry={geometry} castShadow receiveShadow><meshStandardMaterial color={identified?(art?.palette.hero??'#c18544'):paper} roughness={.93}/></mesh>
    <mesh position={[0,.468,0]}><boxGeometry args={[.12,.005,.93]}/><meshStandardMaterial color="#e8dcb8" roughness={.72}/></mesh>
    <mesh position={[0,0,.478]}><boxGeometry args={[.12,.9,.004]}/><meshStandardMaterial color="#e8dcb8" roughness={.72}/></mesh>
    <mesh position={[0,.471,-.24]}><boxGeometry args={[width,.005,.006]}/><meshStandardMaterial color={ink}/></mesh>
    {[-1,1].map(side=><mesh key={side} position={[side*(width/2-.035),0,.477]}><boxGeometry args={[.009,.84,.004]}/><meshStandardMaterial color="#906b42" roughness={1}/></mesh>)}
    {[.21,.27,.34].map((y,i)=><mesh key={i} position={[-width/2+.15,y,.479]} rotation={[0,0,i*.015]}><boxGeometry args={[.15-i*.02,.011,.003]}/><meshStandardMaterial color={ink}/></mesh>)}
    {Array.from({length:12},(_,i)=><mesh key={i} position={[-width/2+.08+i*(width-.16)/12,-.37+(i%3)*.008,.479]} rotation={[0,0,.08+(i%2)*.03]}><boxGeometry args={[.027,.007,.003]}/><meshStandardMaterial color="#ab8054" roughness={1}/></mesh>)}
    {identified&&<group position={[.22,-.19,.48]}>
      <mesh><boxGeometry args={[.24,.22,.004]}/><meshStandardMaterial color="#f2eddd" roughness={.96}/></mesh>
      {Array.from({length:9},(_,i)=><mesh key={i} position={[-.086+i*.021,-.032,.003]}><boxGeometry args={[i%3===0?.011:.005,.09,.002]}/><meshStandardMaterial color={ink}/></mesh>)}
      <mesh position={[-.035,.061,.003]}><boxGeometry args={[.13,.014,.002]}/><meshStandardMaterial color={ink}/></mesh>
    </group>}
  </group>;
};

/** A compliant cup has a metal mount, rubber rim and open contact face. */
export const VacuumCup:React.FC<{x:number;y:number}> = ({x,y})=>{
  const art=useArtDirection();
  return <group position={[x,y,.033]}>
    <mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.092,.073,.067,32]}/><meshStandardMaterial color={art?.palette.foreground??'#35434b'} metalness={.2} roughness={.7}/></mesh>
    <mesh position={[0,0,-.014]}><torusGeometry args={[.07,.018,12,32]}/><meshStandardMaterial color="#292d2d" roughness={.94}/></mesh>
    <mesh position={[0,0,.037]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.048,.048,.008,24]}/><meshStandardMaterial color="#879396" metalness={.75} roughness={.36}/></mesh>
    <mesh position={[0,0,.043]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.012,.012,.008,16]}/><meshStandardMaterial color="#2e3435" roughness={.9}/></mesh>
  </group>;
};
