import React from 'react';
import {CinematicStage} from './lib/cinema/CinematicStage';
import {mix} from './lib/cinema/motion';
import type {V3} from './lib/cinema/motion';

const cream='#efe8d7', navy='#243c49', clay='#6f7062', grass='#677459', gold='#e6ae63';
const Box:React.FC<{p:V3;s:V3;c:string;r?:V3}>=({p,s,c,r=[0,0,0]})=>
 <mesh position={p} rotation={r} castShadow receiveShadow><boxGeometry args={s}/><meshStandardMaterial color={c} roughness={.72}/></mesh>;

/** Original explanatory capsule, not a measured manufacturer model. */
const Pod:React.FC<{x:number;y:number;cutaway:boolean}>=({x,y,cutaway})=><group position={[x,y,.18]}>
 <Box p={[0,0,0]} s={[2.05,.84,1.0]} c={cream}/>
 <Box p={[0,.45,0]} s={[1.53,.12,.88]} c='#c6d1cb'/>
 <Box p={[0,-.44,0]} s={[1.88,.08,.92]} c={navy}/>
 <Box p={[-1.17,.06,0]} s={[.32,.52,.25]} c={navy}/>
 <Box p={[1.17,.06,0]} s={[.32,.52,.25]} c={navy}/>
 <Box p={[0,.62,0]} s={[.24,.24,.24]} c={navy}/>
 <Box p={[0,.74,0]} s={[.39,.04,.32]} c='#99a9a4'/>
 {[-.68,.68].map((k)=><group key={k} position={[k,-.5,.1]}>
  <mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.13,.13,.16,24]}/><meshStandardMaterial color='#121f27' roughness={.2} metalness={.45}/></mesh>
  <mesh position={[0,-.085,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.09,24]}/><meshPhysicalMaterial color='#68a5ae' roughness={.13} metalness={.55} clearcoat={1}/></mesh>
 </group>)}
 <Box p={[0,-.14,.507]} s={[1.25,.025,.018]} c='#aaa89c'/>
 <Box p={[-.64,.1,.51]} s={[.028,.32,.018]} c='#aaa89c'/>
 <Box p={[.64,.1,.51]} s={[.028,.32,.018]} c='#aaa89c'/>
 {/* The exposed bay is an explanatory section in both treatments, not a claim about shell transparency. */}
 <Box p={[0,.08,.54]} s={[1.12,.48,.1]} c={navy}/>
 <Box p={[0,.08,.61]} s={[.69,.34,.07]} c={gold}/>
 <Box p={[0,.08,.654]} s={[.065,.34,.012]} c='#a87943'/>
 <Box p={[0,.24,.654]} s={[.69,.02,.012]} c='#f5cd8d'/>
 {cutaway&&<Box p={[-.68,.08,.54]} s={[.035,.48,.025]} c={gold}/>}
 {[0,1,2,3].map(i=><Box key={i} p={[-.42+i*.27,.45,.459]} s={[.034,.016,.016]} c='#89978f'/>)}
</group>;

const Tether:React.FC<{x:number;y:number;cutaway:boolean}>=({x,y,cutaway})=>{
 const top:V3=[0,cutaway?2.75:3.9,.18],bottom:V3=[x,y+.75,.18];
 const dx=bottom[0]-top[0],dy=bottom[1]-top[1],length=Math.sqrt(dx*dx+dy*dy);
 return <mesh position={[(top[0]+bottom[0])/2,(top[1]+bottom[1])/2,.18]} rotation={[0,0,-Math.atan2(dx,dy)]}>
  <cylinderGeometry args={[.022,.022,Math.max(.02,length),16]}/><meshStandardMaterial color='#394c54' metalness={.6} roughness={.36}/>
 </mesh>;
};

/** Blackland residential ground, generic geometry with no actual address or claimed site. */
const Yard:React.FC<{cutaway:boolean;blocked:number;inspection:number}>=({cutaway,blocked,inspection})=><group>
 <Box p={[0,-1.05,0]} s={[7.0,.16,5]} c={cutaway?'#425c64':grass}/>
 <Box p={[0,-.945,.35]} s={[3.50,.08,2.5]} c={cutaway?'#b9c8c2':clay}/>
 <Box p={[-2.5,-.945,0]} s={[.62,.09,5]} c='#b5b1a1'/>
 {!cutaway&&<>
  <Box p={[0,-.64,-2.20]} s={[6.2,.64,.17]} c='#ad806b'/>
  {[-2.8,-1.7,-.5,.7,1.9,2.8].map((x,i)=><Box key={x} p={[x,-.65,-2.1]} s={[.045,.59,.025]} c={i%2?'#967362':'#b38c76'}/>)}
  {[-1.32,-.47,.42,1.35].map((x,i)=><Box key={x} p={[x,-.898,.28+i*.23]} s={[.013,.012,.78]} c='#4b5149' r={[0,.31*i,0]}/>)}
 </>}
 {/* A geometric footprint explains inspection. It is not a proprietary detection interface. */}
 {[-1,1].map(k=><React.Fragment key={k}>
  <Box p={[k*mix(.15,1.58,inspection),-.889,.35]} s={[.038,.026,2.15]} c={gold}/>
  <Box p={[0,-.889,.35+k*mix(.12,1.10,inspection)]} s={[3.16,.026,.038]} c={gold}/>
 </React.Fragment>)}
 {blocked>0&&<group position={[mix(2.4,.45,blocked),-.69,.40]}>
  <Box p={[0,0,0]} s={[1.40,.50,.72]} c='#986f52'/>
  <Box p={[0,.265,0]} s={[1.46,.03,.76]} c='#c3986b'/>
  <Box p={[0,0,.373]} s={[.035,.50,.02]} c='#6e5946'/>
 </group>}
</group>;

const ImageCard:React.FC<{x:number;y:number;rotation:number}>=({x,y,rotation})=><group position={[x,y,.85]} rotation={[0,rotation,0]} scale={.8}>
 <Box p={[0,0,0]} s={[1.9,1.37,.07]} c={cream}/>
 <Box p={[0,0,.046]} s={[1.68,1.15,.025]} c={grass}/>
 <Box p={[.12,-.05,.067]} s={[1.02,.67,.015]} c={clay}/>
 <Box p={[.34,-.1,.09]} s={[.50,.32,.016]} c='#986f52'/>
 <Box p={[-.71,.0,.068]} s={[.17,1.12,.016]} c='#b5b1a1'/>
 {/* Reduced visual contrast signals ambiguity without inventing analysis results. */}
 <Box p={[0,0,.111]} s={[1.68,.034,.01]} c='#bac0a4'/>
 <Box p={[0,.28,.111]} s={[1.68,.034,.01]} c='#bac0a4'/>
</group>;

/** A visibly closed editorial gate separates proposed operation from approval.
 * It represents the unresolved expansion decision, not hardware at a delivery site.
 * The comment token illustrates participation; it is not a reported submission.
 */
const ProposalGate:React.FC<{phase:number;a:number;b:number;c:number}>=({phase,a,b,c})=>{
 const advance=phase===5?.4*a+.3*b+.3*c:1;
 return <group>
  <Box p={[.65,-.71,1.12]} s={[1.06,.12,.60]} c={navy}/>
  {[-1,1].map(k=><Box key={k} p={[.65+k*.46,-.04,1.12]} s={[.075,1.32,.18]} c={navy}/>)}
  <Box p={[.65,.63,1.12]} s={[1.0,.09,.18]} c={navy}/>
  {/* Solid closed leaves never open, show approval or receive the comment token. */}
  {[-1,1].map(k=><Box key={k} p={[.65+k*.22,-.02,1.13]} s={[.43,1.18,.055]} c='#a2aba5'/>)}
  <Box p={[.65,-.02,1.17]} s={[.035,1.18,.025]} c={navy}/>
  <Box p={[.65,.10,1.21]} s={[.18,.18,.08]} c={gold}/>
  <group position={[mix(-1.2,-.40,advance),-.30,1.13]}>
   <Box p={[0,0,0]} s={[.84,.58,.09]} c={cream}/>
   <Box p={[0,.10,.06]} s={[.64,.12,.035]} c={navy}/>
   <Box p={[0,-.08,.06]} s={[.38,.045,.035]} c={gold}/>
  </group>
  {phase>=6&&<>
   <Box p={[-.65,-.64,1.45]} s={[1.0,.12,.75]} c={navy}/>
   <Box p={[-.65,-.555,1.45]} s={[.88,.05,.62]} c='#829f9c'/>
   <mesh position={phase===6?[-1.35+.35*a+.25*b+.10*c,.36-.12*a-.42*b-.21*c,1.45]:[-.65,-.39,1.45]}>
    <sphereGeometry args={[.14,24,16]}/><meshStandardMaterial color={cream} roughness={.64}/>
   </mesh>
  </>}
 </group>;
};

/** Conserved world pose. Adjacent scenes meet exactly, including the failed landing area. */
function podPose(phase:number,a:number,b:number,c:number,cutaway=false){
 let x=0,y=0;
 if(phase===0){x=.30-.30*c;y=.25+1.00*a+.24*b+.12*c;}
 if(phase===1){x=-.18*a+.18*c;y=1.61-.38*a-.40*b-.30*c;}
 if(phase===2){x=-.30*a+.50*b-.20*c;y=.53+.12*c;}
 if(phase===3){x=-.30*c;y=.65+.12*a+.12*b+.12*c;}
 if(phase===4){x=-.30-.12*a+.24*c;y=1.01+.13*a+.45*b+.15*c;}
 if(phase===5){x=-.18-.15*a+.20*b-.17*c;y=1.74;}
 if(phase===6){x=-.30+.15*a-.20*b+.17*c;y=1.74;}
 if(phase===7){x=-.18-.12*a+.12*c;y=1.74-.75*a+.12*b+(cutaway?.77:1.13)*c;}
 return {x,y,inspection:1,blocked:1};
}

/** Original explanatory winch. The free tether length determines actual drum angle.
 * The .24-unit rope core and asymmetric spokes expose payout then take-in.
 * This is a source-supported mechanism illustration, not a measured hardware specification.
 */
const ActiveWinch:React.FC<{x:number;y:number;cutaway:boolean}>=({x,y,cutaway})=>{
 const anchor=cutaway?2.75:3.9,core=.24,center=anchor+core;
 const freeLength=Math.hypot(x,anchor-y-.75);
 const reference=Math.hypot(-.18,anchor-1.74-.75);
 const angle=(reference-freeLength)/core;
 return <group>
  <Box p={[0,anchor+.035,-.45]} s={[1.75,.12,.54]} c={navy}/>
  {[-1,1].map(k=><Box key={k} p={[k*.72,center,-.40]} s={[.12,.70,.22]} c='#81978e'/>)}
  <Box p={[0,center+.36,-.40]} s={[1.57,.10,.22]} c={navy}/>
  <group position={[0,center,-.30]} rotation={[0,0,angle]}>
   <mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[core,core,.32,32]}/><meshStandardMaterial color='#887d64' roughness={.49} metalness={.4}/></mesh>
   {[-1,1].map(k=><mesh key={k} position={[0,0,k*.17]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.52,.52,.065,40]}/><meshStandardMaterial color={navy} roughness={.5} metalness={.45}/></mesh>)}
   {/* Broad unequal spokes make the physical angular change recognizable, without a fake scan. */}
   {[0,1,2].map(i=><group key={i} rotation={[0,0,i*Math.PI*2/3]}>
    <Box p={[0,.24,.212]} s={[i===0?.14:.075,.43,.025]} c={i===0?cream:gold}/>
   </group>)}
   <mesh position={[0,0,.222]}><circleGeometry args={[.11,24]}/><meshStandardMaterial color={gold} roughness={.5}/></mesh>
   {/* The actual rope wraps the core. It shares the drum's paid-in angular displacement. */}
   <mesh position={[0,0,.045]}><torusGeometry args={[core,.022,10,48,Math.PI*1.6]}/><meshStandardMaterial color='#394c54' roughness={.36} metalness={.6}/></mesh>
  </group>
  {/* Fixed guide brings the tether from the rope core to the conserved overhead exit. */}
  <Box p={[0,anchor,-.025]} s={[.044,.044,.41]} c='#394c54'/>
  <Box p={[0,anchor+.06,.18]} s={[.15,.09,.14]} c='#81978e'/>
 </group>;
};

/** Every state is sampled from three current board events. No simulation or success is implied. */
export const PodDeliveryAction:React.FC<{phase:number;option:string;a:number;b:number;c:number}>=({phase,option,a,b,c})=>{
 const cutaway=option==='b';
 const {x,y,inspection,blocked}=podPose(phase,a,b,c,cutaway);
 const spatial:V3[]=[[2.2,2.1,11.9],[3,2.6,12.2],[1.3,3.5,11.8],[.5,2,12.3],[2.8,1.8,11.6],[0,1.5,12.4],[-1.3,2,12.4],[2.2,2.7,17]];
 const diagram:V3[]=[[0,1.4,11.4],[0,1.9,11.9],[0,4.2,12.0],[0,1.7,12.3],[0,1.3,11.4],[0,1.4,12.4],[0,2.2,12.4],[0,2.2,13.2]];
 return <CinematicStage position={(cutaway?diagram:spatial)[phase]} target={phase===7?[.25,cutaway?.60:1.10,0]:[.25,.35,0]} fov={39} exposure={1.03}>
  <hemisphereLight args={['#e5edf1','#58604f',.75]}/>
  <directionalLight position={[-4,7,5]} intensity={2.5} color='#f4ecd9'/>
  <Yard cutaway={cutaway} blocked={blocked} inspection={inspection}/>
  <Tether x={x} y={y} cutaway={cutaway}/><Pod x={x} y={y} cutaway={cutaway}/>
  {cutaway&&phase!==7&&<>
   <Box p={[0,2.79,-.15]} s={[2.95,.14,.55]} c={navy}/>
   <mesh position={[0,2.75,.18]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.21,.21,.18,24]}/><meshStandardMaterial color={gold} roughness={.42} metalness={.5}/></mesh>
  </>}
  {phase===7&&<ActiveWinch x={x} y={y} cutaway={cutaway}/>}
  {phase>=3&&<>
   <Box p={[.80,-.55,.8]} s={[1.75,.12,1.30]} c={navy}/>
   <ImageCard x={phase===3?mix(-.18,.80,b):.80} y={phase===3?mix(.23,.63,a)-.572*c:.058} rotation={phase===3?mix(-.1,.05,c):.05}/>
  </>}
  {phase>=5&&<ProposalGate phase={phase} a={a} b={b} c={c}/>}
 </CinematicStage>;
};
