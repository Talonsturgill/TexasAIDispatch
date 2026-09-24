import React,{useEffect,useLayoutEffect,useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import type {V3} from './motion';

/** Authored light cards. No remote HDRI, canvas texture, randomness or wall clock. */
function studioMap() {
  const w=256,h=128,data=new Float32Array(w*h*4);
  for(let y=0;y<h;y++) for(let x=0;x<w;x++) {
    const u=x/w,v=y/h;
    const card=(cx:number,cy:number,sx:number,sy:number,power:number)=>
      power*Math.exp(-Math.pow((u-cx)/sx,8)-Math.pow((v-cy)/sy,8));
    const key=card(.31,.32,.09,.19,4.8);
    const rim=card(.76,.43,.022,.22,6);
    const warm=card(.08,.47,.09,.07,2.2);
    const i=(y*w+x)*4;
    data[i]=.035+key+rim*.3+warm;
    data[i+1]=.045+key*.95+rim*.85+warm*.44;
    data[i+2]=.055+key*.86+rim+warm*.16;
    data[i+3]=1;
  }
  const texture=new THREE.DataTexture(data,w,h,THREE.RGBAFormat,THREE.FloatType);
  texture.mapping=THREE.EquirectangularReflectionMapping;
  texture.needsUpdate=true;
  return texture;
}
export const Studio:React.FC<{position:V3;target:V3}> = ({position,target})=>{
  const {camera,scene,gl}=useThree();
  const environment=useMemo(()=>{
    const map=studioMap(),pmrem=new THREE.PMREMGenerator(gl);
    const result=pmrem.fromEquirectangular(map); map.dispose(); pmrem.dispose();
    return result;
  },[gl]);
  useLayoutEffect(()=>{
    camera.position.set(...position); camera.lookAt(...target);
    camera.updateMatrixWorld();
    scene.environment=environment.texture;
  },[camera,scene,environment,position,target]);
  useEffect(()=>()=>{environment.dispose();},[environment]);
  return <>
    <ambientLight intensity={.22}/>
    <spotLight position={[2,6,6]} intensity={100} angle={.55} penumbra={.6}
      color="#fff1d7" castShadow shadow-mapSize={[1024,1024]} shadow-bias={-.0002}/>
    <directionalLight position={[-4,1,-3]} intensity={3} color="#4dd9dd"/>
    <pointLight position={[1,-1,3]} intensity={5} color="#ff9c53"/>
  </>;
};
