import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {Img, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useLoader} from '@react-three/fiber';
import {CinematicStage} from './lib/cinema/CinematicStage';
import {actionProgress, actionWindows, requireAction} from './lib/direction';
import {cue, mix, type V3} from './lib/cinema/motion';
import {GradeLayer} from './lib/lighting';
import {FONT} from './lib/type';
import {CreditsCard, SubtitleTrack, type DispatchProps, type Scene} from './Dispatch';

const cream='#eee4cb', ink='#17323d', copper='#df956a', green='#396a5f';
const Box:React.FC<{p:V3;s:V3;c:string;r?:V3;round?:number;metal?:number}>=({p,s,c,r=[0,0,0],round=0,metal=0})=>{
 const geometry=useMemo(()=>round?new RoundedBoxGeometry(...s,2,round):new THREE.BoxGeometry(...s),[...s,round]);
 return <mesh geometry={geometry} position={p} rotation={r} castShadow receiveShadow><meshStandardMaterial color={c} roughness={metal?.36:.76} metalness={metal}/></mesh>;
};
const Ball:React.FC<{p:V3;s:V3;c:string}>=({p,s,c})=><mesh position={p} scale={s} castShadow><sphereGeometry args={[1,24,16]}/><meshStandardMaterial color={c} roughness={.78}/></mesh>;
const Rod:React.FC<{from:V3;to:V3;radius:number;c:string}>=({from,to,radius,c})=>{
 const v=new THREE.Vector3(...to).sub(new THREE.Vector3(...from));
 const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.clone().normalize());
 return <mesh position={from.map((x,i)=>(x+to[i])/2) as V3} quaternion={q} castShadow><cylinderGeometry args={[radius,radius,v.length(),16]}/><meshStandardMaterial color={c} roughness={.68}/></mesh>;
};
const Gable:React.FC=()=>{
 const geometry=useMemo(()=>{
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute([-1.65,1.41,.75,1.65,1.41,.75,0,1.96,.75],3));g.computeVertexNormals();return g;
 },[]);
 return <mesh geometry={geometry} castShadow><meshStandardMaterial color="#c0b294" side={THREE.DoubleSide}/></mesh>;
};
const Ring:React.FC<{p:V3;radius:number;tube:number;c:string}>=({p,radius,tube,c})=><mesh position={p} castShadow><torusGeometry args={[radius,tube,10,40]}/><meshStandardMaterial color={c} metalness={.6} roughness={.29}/></mesh>;

// A finished residential model, with continuous roof/wall joints and attached flashing.
const House:React.FC<{scale?:number;p?:V3;flat?:boolean}>=({scale=1,p=[0,0,-1.15],flat=false})=><group position={p} scale={scale}>
 <Box p={[0,.62,0]} s={[3.3,1.9,1.48]} c="#a17962" round={.025}/>
 {Array.from({length:12},(_,row)=>Array.from({length:8},(_,col)=><Box key={`${row}-${col}`} p={[-1.49+col*.39+(row%2)*.12,-.24+row*.145,.748]} s={[.35,.118,.019]} c={['#a17a64','#96715f','#b1886d','#a78068'][(row*7+col*3)%4]}/>))}
 {[-.95,.95].map(x=><group key={x} position={[x,.62,.79]}>
  <Box p={[0,0,0]} s={[.72,.88,.075]} c={cream}/><Box p={[0,0,.05]} s={[.60,.76,.027]} c="#608087" metal={.3}/>
  <Box p={[0,0,.075]} s={[.035,.76,.03]} c={cream}/><Box p={[0,-.10,.075]} s={[.60,.035,.03]} c={cream}/>
  <Box p={[0,-.46,.08]} s={[.85,.055,.16]} c="#cfbba0"/>
  <Box p={[-.17,.11,.09]} s={[.16,.34,.008]} c="#abc1bc"/>
 </group>)}
 <Box p={[0,.32,.79]} s={[.59,1.34,.09]} c="#4b5f55" round={.018}/>
 <Box p={[0,1.01,.84]} s={[.49,.05,.09]} c={cream}/>
 <Box p={[0,.50,.85]} s={[.4,.39,.015]} c="#43584f"/>
 <Ball p={[.20,.28,.86]} s={[.033,.033,.026]} c="#ccb678"/>
 <Box p={[0,-.37,1.02]} s={[.91,.13,.65]} c="#a4a498"/>
 <Box p={[0,-.47,1.40]} s={[1.12,.08,.38]} c="#b9b3a2"/>
 {flat?<group position={[0,1.64,0]}><Box p={[0,0,0]} s={[3.46,.14,1.72]} c="#737b6a"/><Box p={[0,.13,.86]} s={[3.48,.23,.12]} c="#a99b80"/><Box p={[0,.27,.86]} s={[3.58,.045,.19]} c="#d0d5c5" metal={.7}/><Box p={[0,.15,.945]} s={[3.56,.24,.024]} c="#aebead" metal={.65}/></group>:<group position={[0,1.70,0]}>
  {[-1,1].map(side=><group key={side} position={[side*.88,0,0]} rotation={[0,0,-side*.30]}>
   <Box p={[0,0,0]} s={[1.87,.10,1.85]} c="#4a4d45"/>
   {Array.from({length:8},(_,j)=><Box key={j} p={[0,.057,-.81+j*.23]} s={[1.86,.022,.013]} c="#75766a"/>)}
   {Array.from({length:6},(_,j)=><Box key={j} p={[-.78+j*.31,.058,0]} s={[.012,.021,1.84]} c="#606359"/>)}
  </group>)}
  <Rod from={[0,.29,-.94]} to={[0,.29,.94]} radius={.04} c="#73796a"/>
 </group>}
 {!flat&&<Gable/>}
 <Box p={[0,1.405,.93]} s={[3.62,.12,.13]} c="#b1b5a9" metal={.55}/>
 <Box p={[1.64,.48,.95]} s={[.07,1.84,.07]} c="#a6aca1" metal={.35}/>
 <Box p={[-.69,1.50,.94]} s={[.73,.07,.12]} c="#dde1cd" metal={.68}/>
 <Box p={[0,-.52,0]} s={[4.15,.14,3.1]} c="#6c7658" round={.05}/>
 {[-1.45,1.40].map((x,i)=><group key={x}><Ball p={[x,-.16,.85]} s={[.36,.28,.30]} c={i?'#4d6851':'#57744c'}/><Ball p={[x+.21,-.20,.80]} s={[.21,.23,.25]} c="#687f54"/></group>)}
 <Box p={[0,-.43,1.37]} s={[.93,.04,.95]} c="#b4b2a0"/>
</group>;
const Lens:React.FC<{closed:number}>=({closed})=><group>
 <Box p={[0,0,-.19]} s={[.59,.48,.45]} c="#283b3b" round={.06} metal={.25}/>
 <Ring p={[0,0,.07]} radius={.205} tube={.045} c="#a8b2a4"/>
 <mesh position={[0,0,.075]}><circleGeometry args={[.168,40]}/><meshPhysicalMaterial color="#193e48" metalness={.3} roughness={.10} clearcoat={1}/></mesh>
 <Ring p={[0,0,.083]} radius={.108} tube={.012} c="#4d999f"/>
 <Ball p={[-.046,.056,.089]} s={[.05,.02,.008]} c="#b6e5df"/>
 <Box p={[0,.22-closed*.18,.10]} s={[.34,closed*.37+.002,.018]} c="#192e34"/>
 {[-.23,.23].map(x=>[-.17,.17].map(y=><Ball key={`${x}-${y}`} p={[x,y,.045]} s={[.02,.02,.009]} c="#bbbba6"/>))}
</group>;
const Truck:React.FC<{x:number;closed:number;travel:number}>=({x,closed,travel})=><group position={[x,-.04,1.6]} scale={.57}>
 <Box p={[.3,.40,0]} s={[3.35,1.5,1.45]} c={green} round={.085} metal={.2}/>
 {Array.from({length:7},(_,i)=><Box key={i} p={[-1.08+i*.47,.40,.752]} s={[.045,1.24,.035]} c="#658675" metal={.2}/>)}
 <Box p={[.22,1.17,0]} s={[3.3,.07,1.51]} c="#97a392" metal={.4}/>
 <Box p={[-1.97,.21,0]} s={[1.20,1.20,1.35]} c="#d4cdb5" round={.12} metal={.2}/>
 <Box p={[-1.98,.58,.69]} s={[.84,.47,.036]} c="#467783" round={.04} metal={.25}/>
 <Box p={[-2.61,.20,0]} s={[.14,.51,1.40]} c="#9fa698" round={.035} metal={.7}/>
 {[-.48,.48].map(z=><Box key={z} p={[-2.70,.32,z]} s={[.018,.14,.22]} c="#ffe1a2"/>)}
 <Box p={[-1.54,.12,.72]} s={[.14,.045,.03]} c="#607168"/>
 <Box p={[-1.95,-.51,.78]} s={[1.08,.08,.25]} c="#8c9b91" metal={.55}/>
 <Box p={[-.03,-.54,0]} s={[4.70,.18,1.4]} c="#203638"/>
 {[-1.90,1.22].map(wx=>[-.78,.78].map(z=><group key={`${wx}-${z}`} position={[wx,-.51,z]} rotation={[0,0,travel*5]}>
  <mesh rotation={[Math.PI/2,0,0]} castShadow><cylinderGeometry args={[.42,.42,.22,32]}/><meshStandardMaterial color="#243438" roughness={.94}/></mesh>
  <Ring p={[0,0,z>0?.12:-.12]} radius={.26} tube={.045} c="#73867e"/>
  <Ball p={[0,0,z>0?.13:-.13]} s={[.13,.13,.035]} c="#bbbdad"/>
  {[0,1,2,3,4,5].map(i=><Ball key={i} p={[.18*Math.cos(i*Math.PI/3),.18*Math.sin(i*Math.PI/3),z>0?.14:-.14]} s={[.027,.027,.012]} c="#c0c4b4"/>)}</group>))}
 <group position={[.6,1.30,-.42]} rotation={[0,Math.PI,0]} scale={1.4}><Box p={[0,-.13,-.28]} s={[.13,.28,.12]} c="#9cae9b" metal={.6}/><Lens closed={closed}/></group>
 <Box p={[1.3,.17,.79]} s={[.64,.12,.02]} c="#a8b593"/>
 <Box p={[1.65,-.10,.79]} s={[.08,.09,.025]} c="#cf7650"/>
</group>;
const Street:React.FC<{a:number;b:number}>=({a,b})=><>
 <Box p={[0,-.65,0]} s={[15,.15,12]} c="#5d685d"/>
 <Box p={[0,-.51,1.47]} s={[15,.08,2.7]} c="#515f61"/>
 <Box p={[0,-.42,.03]} s={[15,.18,.14]} c="#b6b5a3"/>
 <Box p={[0,-.47,.21]} s={[15,.04,.25]} c="#858d81"/>
 <House scale={.76} p={[0,0,-1.20]}/>
 {a>.03&&<group position={[0,.46,-.57]} scale={Math.min(1,a*2)}>
 {[-1,1].map(sign=><React.Fragment key={sign}><Box p={[sign*1.13,0,0]} s={[.022,1.12,.01]} c="#dceac6"/><Box p={[0,sign*.56,0]} s={[2.28,.022,.01]} c="#dceac6"/></React.Fragment>)}
 </group>}
 <Truck x={mix(.72,-1.65,a*.48+b*.52)} closed={Math.sin(a*Math.PI)**12} travel={a+b}/>
</>;
const PhotoSurface:React.FC=()=>{
 const texture=useLoader(THREE.TextureLoader,staticFile('evidence/dallas-captured-facade.png'));
 texture.colorSpace=THREE.SRGBColorSpace;
 return <mesh><planeGeometry args={[2.8,1.89]}/><meshBasicMaterial map={texture}/></mesh>;
};
// The camera view is an attached optical viewport. No photograph floats into the street.
const Capture:React.FC<{a:number;b:number;scan?:boolean}>=({a,b,scan=false})=><>
 <Box p={[0,-.57,0]} s={[15,.12,10]} c="#667558"/>
 {scan?<group position={[0,.48,.15]}>
 <Box p={[0,0,-.08]} s={[3.06,2.12,.14]} c="#364d55" round={.06}/>
 <PhotoSurface/>
 <Box p={[0,-1.15,-.11]} s={[.25,.38,.23]} c="#364d55"/>
 <Box p={[0,-1.34,.10]} s={[1.4,.10,.72]} c="#4a6264"/>
 </group>:<group position={[mix(.65,-.35,Math.min(1,a*.55+b*.45)),0,0]}><House scale={.83}/></group>}
 <Box p={[0,-.51,1.6]} s={[15,.05,2.1]} c="#556467"/>
 <Box p={[0,-.40,.52]} s={[15,.16,.14]} c="#bec0ac"/>
 {scan&&<>
  {Array.from({length:8},(_,col)=>Array.from({length:4},(_,row)=>{
   const visible=a>(col+1)/8; return visible?<mesh key={col+'-'+row} position={[-1.225+col*.35,-.22+row*.44,.20]}><planeGeometry args={[.32,.40]}/><meshBasicMaterial color="#8fddc3" transparent opacity={.16}/></mesh>:null;
  }))}

  <Box p={[mix(-1.39,1.39,a),.48,.22]} s={[.035,1.89,.02]} c="#b3e4ce"/>
  {b>.01&&<group position={[-1.095,.682,.24]} scale={b}>
   {[-1,1].map(sign=><React.Fragment key={sign}><Box p={[sign*.31,0,0]} s={[.055,.79,.02]} c={copper}/><Box p={[0,sign*.385,0]} s={[.66,.055,.02]} c={copper}/></React.Fragment>)}
  </group>}
 </>}
</>;
const Hand:React.FC<{p:V3;r?:V3;scale?:number}>=({p,r=[0,0,0],scale=1})=><group position={p} rotation={r} scale={scale}>
 <Box p={[0,0,0]} s={[.31,.12,.37]} c="#b28265" round={.048}/>
 {[0,1,2,3].map(i=><Box key={i} p={[-.112+i*.074,-.003,-.24+(i===0?.035:0)]} s={[.064,.105,.22]} c="#bc8b6b" round={.025}/>)}
 <Box p={[.19,-.01,-.04]} s={[.15,.12,.11]} c="#b28265" r={[0,.45,0]} round={.035}/>
 <Box p={[0,.015,.37]} s={[.25,.16,.43]} c="#b28265" round={.055}/>
 <Box p={[0,.025,.70]} s={[.33,.22,.34]} c="#477080" round={.04}/>
</group>;
const Paper:React.FC<{p:V3;r?:V3;roof?:boolean;house?:boolean;scale?:number}>=({p,r=[0,0,0],roof=false,house=false,scale=1})=><group position={p} rotation={r} scale={scale}>
 <Box p={[0,0,0]} s={[1.19,.018,1.54]} c={cream} round={.009}/>
 <Box p={[-.29,.014,-.53]} s={[.45,.004,.075]} c={ink}/>
 {house?<>
  <Box p={[0,.015,-.04]} s={[.98,.005,.84]} c="#829485"/>
  <Box p={[0,.025,.02]} s={[.82,.01,.43]} c="#ae876b"/>
  <Box p={[0,.031,-.22]} s={[.90,.01,.12]} c="#4a5b50"/>
  {[-.27,.27].map(x=><Box key={x} p={[x,.039,.02]} s={[.17,.012,.19]} c="#456d77"/>)}
  <Box p={[0,.039,.07]} s={[.14,.012,.28]} c="#4b5f55"/>
 </>:roof?<>
  <Box p={[0,.015,-.03]} s={[.98,.005,.78]} c="#66685a"/>
  {Array.from({length:5},(_,i)=><Box key={i} p={[0,.021,-.31+i*.14]} s={[.97,.003,.01]} c="#879183"/>)}
  <Box p={[0,.025,.19]} s={[.95,.014,.085]} c="#c8d0bf" metal={.6}/>
 </>:Array.from({length:6},(_,i)=><Box key={i} p={[-.08,.014,-.29+i*.11]} s={[i===5?.62:.84,.003,.017]} c="#7a8880"/>)}
 <Box p={[-.26,.013,.57]} s={[.46,.003,.035]} c={copper}/>
</group>;
const Table:React.FC<{home?:boolean}>=({home=false})=><>
 <Box p={[0,-.11,0]} s={[5,.19,4]} c={home?'#857357':'#586c6a'} round={.055}/>
 {Array.from({length:6},(_,i)=><Box key={i} p={[-2.25+i*.85,-.011,0]} s={[.016,.003,3.90]} c={home?'#665c47':'#607772'}/>)}
 {home?<><Box p={[-1.98,.82,-2.0]} s={[1.90,2.1,.12]} c="#c8bda1"/><Box p={[2.51,.82,-2.0]} s={[.95,2.1,.12]} c="#c8bda1"/><Box p={[.54,-.01,-2.0]} s={[3.4,.38,.12]} c="#c8bda1"/><Box p={[.54,1.82,-2.0]} s={[3.4,.26,.12]} c="#c8bda1"/><House flat scale={.73} p={[.45,.12,-3.3]}/></>:<Box p={[0,.82,-2.0]} s={[6,2.1,.12]} c="#8caaa4"/>}
 {home&&<group position={[.74,1.02,-1.88]}>
  {[-.86,.86].map(x=><Box key={x} p={[x,0,0]} s={[.075,1.32,.08]} c={cream}/>)}
  <Box p={[0,-.24,.055]} s={[1.53,.055,.015]} c="#c1c5b3" metal={.4}/>
  <Box p={[0,0,.062]} s={[.055,1.23,.035]} c={cream}/>
 </group>}
</>;
// One conserved image joins capture, candidate marking and manual inspection.
const CapturedPrint:React.FC=()=>{
 return <>
 <Box p={[0,0,0]} s={[3.06,.035,2.12]} c={cream} round={.025}/>
 <group position={[0,.022,0]} rotation={[-Math.PI/2,0,0]}><PhotoSurface/></group>
 {[-1,1].map(sign=><React.Fragment key={sign}>
  <Box p={[-1.095+sign*.31,.035,-.202]} s={[.055,.013,.79]} c={copper}/>
  <Box p={[-1.095,.035,-.202+sign*.385]} s={[.66,.013,.055]} c={copper}/>
 </React.Fragment>)}
 </>;
};
const ReviewDesk:React.FC<{a:number;b:number;c:number}>=({a,b,c})=>{
 return <>
 <Table/>
 <group position={[0,.06+c*.30,-.20]} rotation={[c*.18,0,0]}>
  <CapturedPrint/>
  <Hand p={[mix(-2.30,-1.57,a),.11,mix(-.37,.06,b)]} r={[0,-Math.PI/2,0]} scale={.78}/>
 </group>
 <Box p={[1.94,.09,-.56]} s={[.18,.17,.88]} c="#334f57" round={.04}/>
 </>;
};
const Notice:React.FC<{a:number;b:number}>=({a,b})=>{
 const pull=a*.65+b*.35;return <>
 <Box p={[0,.18,-1.12]} s={[4,3.7,.2]} c="#a58269"/>
 {Array.from({length:16},(_,r)=><Box key={r} p={[0,-1.45+r*.21,-1.008]} s={[4,.013,.01]} c="#bc9d82"/>)}
 <Box p={[.84,.21,-.96]} s={[1.22,2.81,.11]} c="#4b655b" round={.03}/>
 <Box p={[-.77,.38,-.84]} s={[1.06,.68,.36]} c="#2c4348" round={.045} metal={.18}/>
 <Box p={[-.77,.63,-.635]} s={[.84,.075,.035]} c="#132e36"/>
 <group position={[mix(-.77,-.15,pull),mix(.57,.19,pull),mix(-.54,.48,pull)]} rotation={[mix(1.40,.7,pull),0,.08]}>
  <Paper p={[0,0,0]} scale={.57}/>
  <Hand p={[.26,.07,.09]} r={[0,1.25,0]} scale={.65}/>
 </group>
 <Ball p={[1.25,.15,-.87]} s={[.06,.06,.04]} c="#c8b877"/>
 </>;
};
const WaterPath:React.FC<{progress:number;section?:boolean}>=({progress,section=false})=>{
 const points:V3[]=section?
  [[0,.15,-.65],[0,.15,.28],[0,.16,.62],[0,.12,.96],[0,-.03,1.08],[0,-.42,1.10],[0,-.67,1.24]]:
  [[0,.045,.70],[0,.045,1.14],[0,.045,1.40],[0,.01,1.56],[0,-.21,1.61],[0,-.58,1.68]];
 const curve=useMemo(()=>new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),[section]);
 const geometry=useMemo(()=>new THREE.TubeGeometry(curve,60,.035,8,false),[curve]);
 geometry.setDrawRange(0,Math.floor(Math.min(1,progress)*60)*48);
 return <>{[-.75,0,.75].map(x=><mesh key={x} position={[x,0,0]} geometry={geometry}><meshStandardMaterial color="#4fcde1" roughness={.18} metalness={.15}/></mesh>)}</>;
};
const Flashing:React.FC<{a:number;b:number}>=({a,b})=><>
 <Box p={[0,-.36,-.05]} s={[4,.17,3]} c="#354848"/>
 {[-1.25,0,1.25].map(x=><Box key={x} p={[x,-.261,-.05]} s={[1.21,.018,2.75]} c="#43574f"/>)}
 <Box p={[0,-.26,1.44]} s={[4,.42,.11]} c="#a39275"/>
 <Box p={[0,-.031,1.41]} s={[4,.043,.31]} c="#c6cbbc" metal={.7}/>
 <Box p={[0,-.15,1.55]} s={[4,.25,.035]} c="#bac3b2" metal={.72}/>
 <Box p={[0,-.28,1.58]} s={[4,.026,.09]} c="#96a99b" metal={.7}/>
 {[-1.5,-.75,0,.75,1.5].map(x=><Ball key={x} p={[x,-.001,1.40]} s={[.025,.012,.025]} c="#53665d"/>)}
 <group position={[0,0,mix(0,-1.05,a)]}>
  <Box p={[0,-.04,1.13]} s={[3.84,.025,.67]} c="#53695c"/>
 </group>
 <WaterPath progress={b}/>


</>;
const Cleanup:React.FC<{a:number;b:number}>=({a,b})=>{
 const sweep=mix(.60,-.60,b), foot:V3=[sweep,-.51,.87], top:V3=[sweep+.30,.88,.52];
 const grip=(t:number)=>foot.map((v,i)=>mix(v,top[i],t)) as V3;
 const h1=grip(.83),h2=grip(.58);
 return <>
 <Box p={[0,-.59,0]} s={[7,.13,6]} c="#9d9b76"/>
 <House flat scale={.65} p={[0,.0,-2.6]}/>
 <group position={[-.12,0,0]}>
  <Box p={[-.28,-.41,.1]} s={[.34,.16,.59]} c="#3c4d48" round={.07}/><Box p={[.31,-.41,.04]} s={[.34,.16,.59]} c="#3c4d48" round={.07}/>
  <Rod from={[-.26,-.32,.02]} to={[-.21,.32,-.06]} radius={.13} c="#3c5362"/><Rod from={[.30,-.32,.0]} to={[.18,.32,-.06]} radius={.13} c="#3c5362"/>
  <group position={[0,.53,.07+a*.13]} rotation={[a*.15,0,-.06]}>
   <Box p={[0,0,0]} s={[.66,.76,.39]} c="#397285" round={.14}/>
   <Rod from={[0,.26,0]} to={[0,.47,0]} radius={.12} c="#ad7b60"/>
   <Ball p={[0,.64,.01]} s={[.24,.29,.235]} c="#b58769"/>
   <Ball p={[0,.77,-.06]} s={[.25,.18,.21]} c="#4b4940"/>
   <Ball p={[.20,.70,-.17]} s={[.12,.14,.12]} c="#4b4940"/>
   <Ball p={[0,.64,.233]} s={[.06,.066,.041]} c="#b58769"/>
  </group>
 </group>
 <Rod from={[-.40,.69,.20]} to={[-.52,.32,.53]} radius={.09} c="#b58769"/><Rod from={[-.52,.32,.53]} to={h2} radius={.074} c="#b58769"/>
 <Rod from={[.18,.71,.20]} to={[.47,.50,.35]} radius={.09} c="#b58769"/><Rod from={[.47,.50,.35]} to={h1} radius={.074} c="#b58769"/>
 <Rod from={foot} to={top} radius={.027} c="#c2a06d"/>
 {[h1,h2].map((p,i)=><Ball key={i} p={p} s={[.10,.075,.075]} c="#ba8a6b"/>)}
 <Box p={[sweep,-.46,.87]} s={[.62,.11,.22]} c="#a7834f" round={.018}/>
 {Array.from({length:13},(_,i)=><Rod key={i} from={[sweep-.28+i*.046,-.47,.90]} to={[sweep-.31+i*.049,-.55,.97]} radius={.012} c="#d6bb80"/>)}
 </>;
};
const Evidence:React.FC<{a:number;b:number;closing?:boolean}>=({a,b,closing=false})=>{
 const move=closing?1:a*.35+b*.65;
 return <>
 <Table home/>
 <group position={[-.62,closing?mix(.028,.44,a)*(1-b)+.028*b:.028,.08]} rotation={[closing?.25*a*(1-b):0,-.06,0]}>
 <Paper p={[0,0,0]} scale={.9}/>
 {closing&&<Hand p={[.44,.08,.25]} r={[0,1.2,0]} scale={.72}/>}
 </group>
 <group position={[mix(1.61,.57,move),.045,-.02]} rotation={[0,.08,0]}>
  <Paper p={[0,0,0]} roof scale={.85}/>
  <Hand p={[.48,.09,.31]} r={[0,1.18,0]} scale={.72}/>
 </group>

 <Box p={[-1.74,.11,-.76]} s={[.07,.07,.71]} c="#c09e62" round={.018}/>
 </>;
};
const RunoffSheet:React.FC<{progress:number;elapsed:number;spread:number}>=({progress,elapsed,spread})=>{
 // Separate falling ribbons keep the facade visible. Highlights travel with gravity.
 const paths=useMemo(()=>Array.from({length:5},(_,i)=>new THREE.CatmullRomCurve3([
  [ .62+i*.18,.49,1.35],[.62+i*.18,.46,1.58],[.62+i*.18,.08,1.63],
  [.62+i*.18,-.10,1.92],[.62+i*.18,-.20-i*.015,2.25]
 ].map(v=>new THREE.Vector3(...v)))),[]);
 const geometries=useMemo(()=>paths.map(curve=>new THREE.TubeGeometry(curve,40,.033+spread*.030,7,false)),[paths,spread]);
 useEffect(()=>()=>geometries.forEach(g=>g.dispose()),[geometries]);
 return <>{paths.map((curve,i)=>{
  const live=Math.min(1,progress*(1.16-i*.035))*(i>=3?spread:1);
  const geometry=geometries[i];
  geometry.setDrawRange(0,Math.floor(live*40)*42);
  return <group key={i}>
   <mesh geometry={geometry}><meshStandardMaterial color="#65c9d6" transparent opacity={.72} roughness={.14} metalness={.13}/></mesh>
   {Array.from({length:3},(_,j)=>{
    const t=(elapsed*.72+i*.137+j/3)%1,p=curve.getPoint(t),q=curve.getPoint(Math.max(0,t-.085));
    return t<=live?<Rod key={j} from={[p.x,p.y+.006,p.z+.013]} to={[q.x,q.y+.006,q.z+.013]} radius={.020} c="#cff3ed"/>:null;
   })}
  </group>;
 })}</>;
};
const RainRoof:React.FC<{a:number;b:number;c:number;d:number;elapsed:number}>=({a,b,c,d,elapsed})=>{
 const wetEnd=mix(-.75,1.46,b),wetDepth=wetEnd+1.65;
 return <>
 <Box p={[0,3,-6]} s={[50,35,.2]} c="#7b989b"/>
 <Box p={[0,-2.05,1.29]} s={[8,4.8,.32]} c="#92745e"/>
 {Array.from({length:19},(_,row)=>Array.from({length:13},(_,col)=>
  <Box key={row+'-'+col} p={[-3.85+col*.63+(row%2)*.20,.19-row*.247,1.46]} s={[.594,.213,.045]} c={['#a2795e','#9c735c','#b08766','#956c55'][(row*5+col*7)%4]} round={.008}/>
 ))}
 <Box p={[0,.29,-.62]} s={[8.2,.22,4.08]} c="#867d64"/>
 <Box p={[0,.43,-.64]} s={[8.24,.058,4.12]} c="#3c5b55"/>
 {[-3.2,-1.6,0,1.6,3.2].map(x=><Box key={x} p={[x,.464,-.68]} s={[.019,.009,3.90]} c="#526d62"/>)}
 <Box p={[0,.456,1.23]} s={[8.32,.050,.64]} c="#c9d1c2" metal={.70} round={.008}/>
 <Box p={[0,.205,1.55]} s={[8.32,.49,.055]} c="#b6c4b9" metal={.68} round={.008}/>
 <Box p={[0,-.045,1.63]} s={[8.32,.054,.20]} c="#c4d1c4" r={[-.18,0,0]} metal={.70}/>
 <group position={[-.50,-.55,1.55]} scale={.54}>
  <Box p={[0,0,0]} s={[1.53,2.02,.16]} c="#d1c3a5" round={.022}/>
  <Box p={[0,0,.095]} s={[1.32,1.81,.055]} c="#4d7481" metal={.35}/>
  <Box p={[0,0,.137]} s={[.055,1.80,.046]} c="#c8ba9f"/><Box p={[0,0,.137]} s={[1.31,.055,.046]} c="#c8ba9f"/>
  <Box p={[0,-1.03,.15]} s={[1.72,.095,.32]} c="#b1a287"/>
 </group>
 {b>0&&<mesh position={[.98,.483,-1.65+wetDepth/2]} rotation={[-Math.PI/2,0,0]}>
  <planeGeometry args={[1.14,wetDepth]}/><meshStandardMaterial color="#4fbccc" transparent opacity={.55*b} roughness={.13} metalness={.23}/>
 </mesh>}
 {b>0&&<Rod from={[.41,.493,wetEnd]} to={[1.55,.493,wetEnd]} radius={.024} c="#a0e2df"/>}
 {Array.from({length:42},(_,i)=>{
  const x=-3.6+((i*37)%97)/97*7.2,z=-2.4+((i*53)%89)/89*3.85,phase=(elapsed*1.27+i*.381)%1,y=.50+(1-phase)*3.8;
  return <group key={i}>
   {a>0&&<Rod from={[x,y,z]} to={[x-.026,y+.22,z-.032]} radius={.014} c="#a2d5d7"/>}
   {a>.2&&phase>.80&&<mesh position={[x,.492,z]} rotation={[-Math.PI/2,0,0]} scale={[(phase-.80)*2.2,(phase-.80)*2.2,1]}><ringGeometry args={[.13,.17,20]}/><meshBasicMaterial color="#b9e7e5" transparent opacity={(1-phase)*3} side={THREE.DoubleSide}/></mesh>}
  </group>;
 })}
 {c>0&&<RunoffSheet progress={c} elapsed={elapsed} spread={d}/>}
 </>;
};
const PhysicalStory:React.FC<{scene:Scene;time:number;windows:ReturnType<typeof actionWindows>}>=({scene,time,windows})=>{
 const progress=(i:number)=>scene.visual_events?.[i]?.id?actionProgress(requireAction(windows,scene.visual_events[i].id),time):0;
 const a=progress(0),b=progress(1),c=progress(2),d=progress(3),id=scene.id;
 const camera:{position:V3;target:V3;fov:number}=id==='s1'?{position:[7,6,10],target:[-.15,-.35,.15],fov:36}:
 id==='s2'?{position:[0,2.1,8.6],target:[0,-.05,-.4],fov:38}:
 id==='s3'?{position:[0,2.1,8.6],target:[.10,-.05,-.4],fov:42}:
 id==='s4'?{position:[.15,4.8,5.9],target:[-.10,-.25,-.20],fov:42}:
 id==='s5'?{position:[1.6,1.25,5.4],target:[0,.20,-.2],fov:39}:
 id==='s6'?{position:[2.3,4.5,7.4],target:[0,-.85,.70],fov:43}:
 id==='s7'?{position:[2.7,2.9,7.4],target:[0,-.35,.1],fov:38}:
 id==='s9'?{position:[3.2,2.7,7.4],target:[.20,-.20,.8],fov:44}:
 {position:[1.2,3.8,5.3],target:[0,-.28,-.16],fov:42};
 return <CinematicStage {...camera} exposure={1.15}>
 <directionalLight position={[3,8,2]} intensity={1.4} color="#fff1c9"/>
 <hemisphereLight intensity={.75} args={['#d4e5e0','#7a7961',.75]}/>
 {id==='s1'&&<Street a={a} b={b}/>}
 {['s2','s3'].includes(id)&&<Capture a={a} b={b} scan={id==='s3'}/>}
 {id==='s4'&&<ReviewDesk a={a} b={b} c={c}/>}
 {id==='s5'&&<Notice a={a} b={b}/>}
 {id==='s6'&&<Flashing a={a} b={b}/>}
 {id==='s7'&&<Cleanup a={a} b={b}/>}
 {id==='s8'&&<Evidence a={a} b={b}/>}
 {id==='s9'&&<RainRoof a={a} b={b} c={c} d={d} elapsed={time-scene.start_s}/>}
 </CinematicStage>;
};
export const BrushCameraEpisode:React.FC<DispatchProps>=({runtime_s,scenes,captions=[],credits='',credits_s=5,__cinemaProofWithoutStage=false})=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),time=frame/fps,windows=actionWindows(scenes);
 const scene=scenes.find(s=>time>=s.start_s&&time<s.start_s+s.duration_s)??scenes[scenes.length-1];
 const p=(i:number)=>scene.visual_events?.[i]?.id?actionProgress(requireAction(windows,scene.visual_events[i].id),time):0;
 return <div style={{position:'absolute',inset:0,background:ink,color:cream}}>
 {time<runtime_s&&<>
 {!__cinemaProofWithoutStage&&<PhysicalStory scene={scene} time={time} windows={windows}/>}
 <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,#17323de8 0%,#17323d33 23%,transparent 38%,transparent 65%,#17323d66 100%)',pointerEvents:'none'}}/>
 <div style={{position:'absolute',left:70,top:93,fontFamily:FONT.mono,fontSize:25,letterSpacing:3,color:cream}}>TEXAS AI DISPATCH</div>
 <div style={{position:'absolute',left:70,top:140,fontFamily:FONT.mono,fontSize:18,letterSpacing:1.8,color:'#c0d5c4'}}>DALLAS / ILLUSTRATED RECONSTRUCTION</div>
 <div style={{position:'absolute',left:70,right:118,top:222,fontFamily:FONT.display,fontSize:65,lineHeight:1.03,textShadow:'0 3px 15px #17323d'}}>{scene.super}</div>
 {scene.id==='s2'&&p(1)>.12&&<div style={{position:'absolute',left:106,top:575,width:830,height:560,overflow:'hidden',border:'6px solid #eee4cb'}}>
 <Img src={staticFile('evidence/dallas-captured-facade.png')} style={{width:'100%',height:'100%',objectFit:'fill'}}/>
 </div>}
 {['s2','s3'].includes(scene.id)&&<div style={{position:'absolute',left:94,right:130,top:510,height:650,border:'3px solid #d8e0c280',borderRadius:18,boxShadow:scene.id==='s2'&&p(1)>.4?'inset 0 0 0 8px #e1e1cb':'none'}}>
 <div style={{position:'absolute',left:20,top:20,fontFamily:FONT.mono,fontSize:23,color:cream}}>{scene.id==='s2'?'SIDE CAMERA / ILLUSTRATION':'COMPUTER VISION / ILLUSTRATION'}</div></div>}
 {['s6','s7','s8','s9'].includes(scene.id)&&<div style={{position:'absolute',left:70,top:386,fontFamily:FONT.mono,fontSize:19,letterSpacing:1.2,color:'#eac39f'}}>SEPARATE REPORTED CASE / NBC 5</div>}
 {scene.id==='s9'&&<div style={{position:'absolute',left:58,top:426,fontFamily:FONT.mono,fontSize:32,letterSpacing:.7,color:'#e2e8d7',background:'rgba(9,32,39,.90)',padding:'8px 12px'}}>ILLUSTRATIVE ROOF EDGE</div>}
 <GradeLayer f={frame} vignette={.09} grain={.009} bloom={.01}/><SubtitleTrack cues={captions} fps={fps}/>
 </>}
 <Sequence from={Math.round(runtime_s*fps)} durationInFrames={Math.round(credits_s*fps)}><CreditsCard text={credits}/></Sequence>
 </div>;
};
