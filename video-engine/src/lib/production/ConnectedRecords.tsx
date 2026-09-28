import React from 'react';
import * as THREE from 'three';
import {mix,type V3} from '../cinema/motion';

export type RecordsBeat = 'separated' | 'connect' | 'retrieve' | 'answer';
export type RecordsClock={beat:RecordsBeat;a:number;b:number;c:number};
export type PaperPose={at:V3;tilt:number;turn:number};
const WELL='#55b6bc',LEASE='#d5a664';
const Slab:React.FC<{at:V3;size:V3;color:string}>=({at,size,color})=>
 <mesh position={at} castShadow receiveShadow><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={.82}/></mesh>;

/** Conserved paper identities and poses, shared with native projected typography. */
export const dossierPose=({beat,a,b,c}:RecordsClock)=>{
 const separated=beat==='separated',connect=beat==='connect',retrieve=beat==='retrieve',answer=beat==='answer';
 const fold=separated?0:connect?c*1.18:retrieve?1.18*(1-a):0;
 const folderZ=separated?-.60:connect?mix(-.60,0,a):0;
 // Lift above the front retaining lip before a whole sheet leaves the sleeve.
 const lift=Math.min(1,b*5),travel=Math.max(0,Math.min(1,(b-.2)/.8));
 const well:PaperPose={at:answer?[-.84,.075+.22*a-.27*c,2.3*b]:
  [-.84,separated?mix(1.5,.075,a):.075,folderZ+(separated?mix(-1.35,0,a):0)],tilt:separated?mix(-.25,0,a):0,turn:0};
 const lease:PaperPose={at:separated?[mix(.78,.74,c),.08+Math.sin(c*Math.PI)*.32,mix(1.70,1.50,c)]:
  connect?[mix(.74,.84,b),.075+Math.sin(b*Math.PI)*.72,mix(1.50,0,b)]:
  retrieve?[.84,.075+.22*lift-.27*c,2.3*travel]:[.84,.025,2.3],tilt:0,turn:separated?mix(-.12,0,c):0};
 return {well,lease,fold,folderZ,loose:separated||(connect&&b<1),corner:0,reveal:separated?b:1};
};
const paperGeometry=(points:[number,number][])=>{
 const shape=new THREE.Shape(points.map(([x,z])=>new THREE.Vector2(x,z)));
 shape.closePath();
 const geometry=new THREE.ExtrudeGeometry(shape,{depth:.008,steps:1,bevelEnabled:false,curveSegments:1});
 geometry.rotateX(Math.PI/2);geometry.translate(0,.004,0);
 return geometry;
};
const Sheet:React.FC<{pose:PaperPose;color:string;corner?:number}>=({pose,color,corner=0})=>{
 // The top page is partitioned along a real diagonal hinge. Lower sheets stay intact.
 const body=React.useMemo(()=>paperGeometry([[-.71,-1.01],[.40,-1.01],[.71,-.70],[.71,1.01],[-.71,1.01]]),[]);
 const tip=React.useMemo(()=>paperGeometry([[0,0],[.31,0],[.31,.31]]),[]);
 const hinge=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,1).normalize(),corner*.78);
 return <group position={pose.at} rotation={[pose.tilt,pose.turn,0]}>
  {[0,1].map(i=><Slab key={i} at={[i*.003,i*.009,0]} size={[1.42,.008,2.02]} color="#d0cbb9"/>)}
  <mesh position={[0,.018,0]} geometry={body} castShadow receiveShadow>
   <meshStandardMaterial color="#f1ecdc" roughness={.82}/>
  </mesh>
  <group position={[.40,.018,-1.01]} quaternion={hinge}>
   <mesh geometry={tip} castShadow receiveShadow><meshStandardMaterial color="#f1ecdc" roughness={.82}/></mesh>
  </group>
  <Slab at={[0,.031,-.50]} size={[1.38,.009,.39]} color={color}/>
  {/* Category strip and blank ruling stay clear of the lifting rear corner. */}
  {[0,1,2,3,4].map(i=><Slab key={i} at={[-.06,.030,-.20+i*.18]} size={[i===4?.68:1.10,.003,.017]} color="#b9b9ab"/>)}
 </group>;
};
const Leaf:React.FC<{side:number}>=({side})=><group>
 <Slab at={[side*.84,.018,0]} size={[1.65,.035,2.36]} color="#ad9773"/>
 <Slab at={[side*.84,.041,.82]} size={[1.57,.016,.63]} color="#bcaa88"/>
 <Slab at={[side*.84,.105,1.14]} size={[1.57,.026,.06]} color="#c5b493"/>
 <Slab at={[side*1.635,.074,0]} size={[.025,.07,2.32]} color="#cbb996"/>
</group>;

/** Paper insertion, seating and conserved whole-sheet extraction. No machine, key or simulated software status. */
export const ConnectedRecords:React.FC<RecordsClock&{ids:{well:string;lease:string;folder:string;cover:string;desk:string}}>=({beat,a,b,c,ids})=>{
 const p=dossierPose({beat,a,b,c});
 return <group>
  <group name={ids.desk}><Slab at={[0,-.20,.3]} size={[7,.36,7]} color="#294246"/>
   <Slab at={[0,-.013,.3]} size={[6.95,.014,6.95]} color="#435b56"/></group>
  <group name={ids.folder} position={[0,0,p.folderZ]}>
   <Leaf side={-1}/><Slab at={[0,.020,0]} size={[.075,.042,2.36]} color="#887454"/>
   <group rotation={[0,0,p.fold]}><Leaf side={1}/></group>
  </group>
  <group name={ids.well}><Sheet pose={p.well} color={WELL}/></group>
  <group name={ids.lease} rotation={p.loose?[0,0,0]:[0,0,p.fold]}>
   <Sheet pose={p.lease} color={LEASE} corner={p.corner}/>
  </group>
  {/* Full paper cover lifts to expose the separate lease at the opening. */}
  <group name={ids.cover} position={[.78+p.reveal*3,.12+Math.sin(p.reveal*Math.PI)*.7,1.70]} rotation={[0,0,-p.reveal*1.65]}>
   {beat==='separated'&&<Slab at={[0,0,0]} size={[1.48,.021,2.09]} color="#ad9773"/>}
  </group>
 </group>;
};

/** Local projection keeps the small category strip on its moving paper surface. */
export const paperLabelMatrix=(pose:PaperPose,fold:number,camera:{position:V3;target:V3;fov:number},width:number,height:number)=>{
 const view=new THREE.PerspectiveCamera(camera.fov,width/height,.05,100);
 view.position.set(...camera.position);view.lookAt(...camera.target);view.updateMatrixWorld();
 const local=new THREE.Matrix4().compose(new THREE.Vector3(...pose.at),new THREE.Quaternion().setFromEuler(new THREE.Euler(pose.tilt,pose.turn,0)),new THREE.Vector3(1,1,1));
 local.premultiply(new THREE.Matrix4().makeRotationZ(fold));
 const project=(x:number,z:number)=>{const v=new THREE.Vector3(x,.048,z).applyMatrix4(local).project(view);return [(v.x+1)*width/2,(1-v.y)*height/2];};
 const o=project(-.63,-.63),x=project(.63,-.63),y=project(-.63,-.37);
 // Projected ink shares the paper header occlusion; reveal only after the full strip clears it.
 if(Math.min(o[1],x[1],y[1],x[1]+y[1]-o[1])<410)return 'matrix(0 0 0 0 0 0)';
 return `matrix(${(x[0]-o[0])/400} ${(x[1]-o[1])/400} ${(y[0]-o[0])/80} ${(y[1]-o[1])/80} ${o[0]} ${o[1]})`;
};

