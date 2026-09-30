import React from 'react';
import {CinematicStage} from './lib/cinema/CinematicStage';
import {cue, mix} from './lib/cinema/motion';
import type {V3} from './lib/cinema/motion';

const chalk='#eee8cf', iron='#24424b', rust='#b36d43', gold='#dfb456';
const Solid:React.FC<{p:V3;s:V3;c:string;r?:V3}>=({p,s,c,r=[0,0,0]})=><mesh position={p} rotation={r} castShadow receiveShadow><boxGeometry args={s}/><meshStandardMaterial color={c} roughness={.74}/></mesh>;
const Tower:React.FC<{angle:number}>=({angle})=><group>
 <Solid p={[0,1.0,0]} s={[.16,3.8,.16]} c='#788b88'/>
 <Solid p={[0,-.82,0]} s={[.9,.2,.8]} c='#bcb292'/>
 <Solid p={[0,1.97,0]} s={[.78,.06,.52]} c='#626f6b'/>
 <group position={[0,2.14,0]} rotation={[0,angle,0]}>
 <Solid p={[0,0,0]} s={[.7,.42,.56]} c={chalk}/>
 <mesh position={[0,0,.34]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.18,.18,.2,32]}/><meshStandardMaterial color={iron} metalness={.5} roughness={.2}/></mesh>
 <mesh position={[0,0,.45]}><circleGeometry args={[.14,32]}/><meshPhysicalMaterial color='#37616c' roughness={.12} metalness={.3} clearcoat={1}/></mesh>
 <Solid p={[-.28,-.13,.29]} s={[.03,.025,.018]} c={gold}/>
 </group>
</group>;
const Smoke:React.FC<{p:number;flat?:boolean}>=({p,flat=false})=><group position={flat?[0,-.8,0]:[-2.45,-.64,-1.0]}>
 {Array.from({length:9},(_,i)=>{const k=cue(p,i*.035,.52+i*.035), h=.23+i*.24, sx=.18+i*.033;return <mesh key={i} position={[Math.sin(i*1.8)*.13+h*.18,h*k,0]} scale={[sx*k,.27*k,sx*k]}>
 <sphereGeometry args={[1,16,12]}/><meshStandardMaterial color={i%2?'#8e877b':'#696c66'} transparent opacity={.82} roughness={1}/></mesh>;})}
 <Solid p={[0,-.2,0]} s={[.46,.12,.36]} c={rust}/>
</group>;
const Frame:React.FC<{p:number;x?:number}>=({p,x=0})=><group position={[x,.5,0]} scale={[Math.max(.001,p),Math.max(.001,p),1]}>
 <Solid p={[0,0,0]} s={[2.30,1.72,.12]} c={iron}/>
 <Solid p={[0,0,.08]} s={[2.05,1.48,.06]} c='#b6ab90'/>
 <Solid p={[0,-.55,.13]} s={[2.02,.30,.025]} c='#958665'/>
 <group position={[-.2,-.3,.18]} scale={.50}><Smoke p={1} flat/></group>
 <Solid p={[0,-.22,.20]} s={[1.95,.025,.018]} c={chalk}/>
</group>;
const CameraToken:React.FC<{p:V3;scale?:number}>=({p,scale=1})=><group position={p} scale={scale}>
 <Solid p={[0,0,0]} s={[.60,.42,.36]} c={chalk}/>
 <mesh position={[0,0,.23]}><circleGeometry args={[.13,24]}/><meshStandardMaterial color={iron} roughness={.2}/></mesh>
 <Solid p={[0,-.31,0]} s={[.09,.22,.09]} c='#788b88'/>
 <Solid p={[0,-.45,0]} s={[.84,.07,.6]} c={iron}/>
</group>;
const Sheet:React.FC<{p:number;side:number;count?:boolean;spread?:number}>=({p,side,count=false,spread=0})=><group position={[side*(1.08+spread*.18),mix(3,.415,p),.02]}>
 <Solid p={[0,0,0]} s={[1.78,2.65,.05]} c={chalk}/>
 <Solid p={[0,.94,.04]} s={[1.35,.045,.015]} c={iron}/>
 {count?<CameraToken p={[0,.10,.15]} scale={1.1}/>:<>
 <Solid p={[-.66,-.4,.09]} s={[.025,1.25,.02]} c={iron}/>
 <Solid p={[.66,-.4,.09]} s={[.025,1.25,.02]} c={iron}/>
 <Solid p={[0,-1.02,.09]} s={[1.34,.025,.02]} c={iron}/>
 </>}
</group>;
/** Flat explanatory signal construction, distinct from the horizon-and-supported-paper sequence. */
const DiagramChain:React.FC<{phase:number;a:number;b:number;c:number}>=({phase,a,b,c})=>{
 const trayY=-.69, imageBottom=-.615;
 return <>
 <Solid p={[0,-1,0]} s={[12,.18,5]} c='#31484c'/>
 {phase===0?<>
 <group position={[-1.8,-.20,0]} scale={1.2}><Smoke p={a} flat/></group>
 <CameraToken p={[1.1,.75,0]} scale={2.0}/>
 <Solid p={[mix(-1.6,.75,b),.45,.25]} s={[.22,.05,.05]} c={gold}/>
 <group position={[1.1,mix(1.0,1.55,c),.0]} scale={.55}><Frame p={c}/></group>
 </>:phase===1?<>
 <group position={[-1.8,-.20,0]} scale={1.2}><Smoke p={1} flat/></group>
 <CameraToken p={[0,.75,-.3]} scale={1.5}/>
 <group position={[mix(-1.65,1.25,a),mix(.25,.45,b),.7]} scale={mix(.35,.85,c)}><Frame p={1}/></group>
 <Solid p={[0,-.65,.5]} s={[4.5,.12,.7]} c={iron}/>
 </>:phase===2?<>
 <Solid p={[0,trayY,.5]} s={[4.2,.15,1.2]} c={iron}/>
 <group position={[mix(-1.25,1.05,a),mix(.5,-.31,b),.5]} scale={.85}><Frame p={1}/></group>
 <Solid p={[1.10,mix(1.85,.12,c),.74]} s={[1.8,.10,.075]} c={gold}/>
 </>:phase===3?<>
 <Solid p={[-1.1,-.69,0]} s={[1.9,.15,1.4]} c={chalk}/>
 <Solid p={[1.1,-.69,0]} s={[1.9,.15,1.4]} c={chalk}/>
 <CameraToken p={[-1.1,mix(2.2,-.165,a),.0]} scale={1}/>
 <Solid p={[1.1,mix(2.2,.21,b),-.50]} s={[1.70,1.65,.07]} c={chalk}/>
 <Solid p={[mix(.2,-.05,c),.22,.10]} s={[.10,2.2,.35]} c={iron}/>
 </>:phase===4?<>
 <group position={[mix(-1.1,-1.3,a),0,0]}>
 <Solid p={[0,-.69,0]} s={[1.9,.15,1.4]} c={chalk}/>
 <CameraToken p={[0,-.165,0]}/>
 </group>
 <group position={[mix(1.1,1.3,b),0,0]}>
 <Solid p={[0,-.69,0]} s={[1.9,.15,1.4]} c={chalk}/>
 <Solid p={[0,.21,-.50]} s={[1.70,1.65,.07]} c={chalk}/>
 </group>
 <Solid p={[mix(.2,-.05,c),.22,.10]} s={[.10,2.2,.35]} c={iron}/>
 </>:phase===5?<>
 <Solid p={[0,trayY,.5]} s={[4.4,.15,1.2]} c={iron}/>
 <group position={[mix(-1.2,.0,a),mix(.1,-.31,b),.5]} scale={.85}><Frame p={1}/></group>
 <Solid p={[mix(1.9,1.25,c),.35,.85]} s={[.85,1.25,.05]} c={gold}/>
 </>:phase===6?<>
 <Solid p={[-1.1,-.69,0]} s={[1.9,.15,1.4]} c={chalk}/>
 <CameraToken p={[-1.1,mix(1.8,-.165,a),.0]}/>
 <Sheet p={b} side={1}/>
 <Solid p={[mix(-.1,.0,c),.5,.2]} s={[.08,2.75,.12]} c={iron}/>
 </>:<>
 <group position={[mix(-1.1,-1.3,a),0,0]}>
 <Solid p={[0,-.69,0]} s={[1.9,.15,1.4]} c={chalk}/>
 <CameraToken p={[0,-.165,0]}/>
 </group>
 <Sheet p={1} side={1} spread={b}/>
 <Solid p={[mix(-.15,.0,c),.5,.2]} s={[.08,2.75,.12]} c={iron}/>
 </>}
 </>;
};
/** Intended workflow and reporting comparison. No incident, proprietary interface or successful response. */
export const SmokeCameraAction:React.FC<{phase:number;option:string;a:number;b:number;c:number}>=({phase,option,a,b,c})=>{
 const cutaway=option==='b';
 const position:V3=cutaway?[0,1.6,8.3]:phase===0?[5.8,3.3,8]:phase===1?[2.4,3.1,6.5]:phase===2?[0,1.5,7.4]:[0,1.5,7.8];
 return <CinematicStage position={position} target={[0,.55,0]} fov={42} exposure={1.05}>
 <ambientLight intensity={.6}/><directionalLight position={[-3,8,4]} intensity={2} color='#ffe4b3'/>
 {cutaway?<group position={[0,phase>=2?.55:0,0]}><DiagramChain phase={phase} a={a} b={b} c={c}/></group>:<>
 <Solid p={[0,-1,0]} s={[16,.18,12]} c='#ae9269'/>
 {phase===0||phase===1?<>
 <group position={[1.1,0,-.9]}><Tower angle={mix(.65,-.52,phase===0?b:1)}/></group>
 <Smoke p={phase===0?a:1}/>
 <group position={[phase===0?-.6:mix(-.6,.10,a),phase===0?mix(.25,.55,c):mix(.55,.75,b),1.15]} scale={phase===0?.7:mix(.7,1,c)}><Frame p={phase===0?c:1}/></group>
 </>:phase===2?<>
 <Solid p={[1.15,-.69,0]} s={[2.1,.15,1.2]} c={iron}/>
 <group position={[mix(.10,1.15,a),mix(.75,-.31,b),.3]} scale={.85}><Frame p={1}/></group>
 <Solid p={[1.15,mix(1.5,.12,c),.56]} s={[1.9,.08,.06]} c={gold}/>
 </>:phase===3?<>
 <Sheet p={a} side={-1} count spread={c}/><Sheet p={b} side={1} spread={c}/>
 </>:phase===4?<>
 <Sheet p={1} side={-1} count spread={a}/><Sheet p={1} side={1} spread={b}/>
 <Solid p={[mix(-.10,0,c),.5,.2]} s={[.08,2.75,.12]} c={iron}/>
 </>:phase===5?<>
 <Solid p={[0,-.69,.3]} s={[4.4,.15,1.2]} c={iron}/>
 <group position={[mix(1.15,0,a),mix(-.31,-.31,b),.3]} scale={.85}><Frame p={1}/></group>
 <Solid p={[mix(2.5,1.3,b),.35,.60]} s={[.85,1.25,.05]} c={gold}/>
 <Solid p={[1.3,mix(1.6,1.01,c),.60]} s={[.85,.09,.05]} c={chalk}/>
 </>:phase===6?<>
 <group position={[mix(0,-1.2,a),.0,.0]} scale={.85}><Frame p={1}/></group>
 <Sheet p={b} side={1} spread={c}/>
 </>:<>
 <Sheet p={1} side={-1} count spread={a}/><Sheet p={1} side={1} spread={b}/>
 <Solid p={[mix(-.10,0,c),.5,.2]} s={[.08,2.75,.12]} c={iron}/>
 </>}
 </>}
 </CinematicStage>;
};
