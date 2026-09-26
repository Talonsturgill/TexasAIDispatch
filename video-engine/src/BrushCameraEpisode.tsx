import React, {useMemo} from 'react';
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
const Street:React.FC<{a:number;b:number;drive:number}>=({a,b,drive})=><>
 <Box p={[0,-.65,0]} s={[15,.15,12]} c="#5d685d"/>
 <Box p={[0,-.51,1.47]} s={[15,.08,2.7]} c="#515f61"/>
 <Box p={[0,-.42,.03]} s={[15,.18,.14]} c="#b6b5a3"/>
 <Box p={[0,-.47,.21]} s={[15,.04,.25]} c="#858d81"/>
 <House scale={.76} p={[0,0,-1.20]}/>
 {a>.03&&<group position={[0,.46,-.57]} scale={Math.min(1,a*2)}>
 {[-1,1].map(sign=><React.Fragment key={sign}><Box p={[sign*1.13,0,0]} s={[.022,1.12,.01]} c="#dceac6"/><Box p={[0,sign*.56,0]} s={[2.28,.022,.01]} c="#dceac6"/></React.Fragment>)}
 </group>}
 <Truck x={mix(.72,-1.65,drive)} closed={Math.sin(a*Math.PI)**12} travel={drive*2}/>
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
 <Ball p={[0,0,-.005]} s={[.165,.060,.190]} c="#b28265"/>
 {[0,1,2,3].map(i=>{const x=-.112+i*.074,z=i===0?.025:0;return <group key={i}>
  <Ball p={[x,-.003,-.202+z]} s={[.035,.051,.075]} c="#bc8b6b"/>
  <Ball p={[x,-.005,-.292+z]} s={[.031,.047,.058]} c="#bc8b6b"/>
  <Ball p={[x,.039,-.178+z]} s={[.034,.017,.025]} c="#c19374"/>
  <Ball p={[x,.041,-.308+z]} s={[.021,.005,.021]} c="#d3aa8b"/>
 </group>;})}
 <group position={[.158,-.005,-.05]} rotation={[0,.52,0]}>
  <Ball p={[0,0,0]} s={[.07,.053,.045]} c="#b28265"/>
  <Ball p={[.047,0,-.019]} s={[.042,.047,.037]} c="#bc8b6b"/>
 </group>
 <Ball p={[0,.015,.36]} s={[.125,.08,.235]} c="#b28265"/>
 <Box p={[0,.025,.70]} s={[.33,.22,.34]} c="#477080" round={.095}/>
</group>;
// A printed explanatory diagram, explicitly not a photograph or the resident's actual document.
const roofDiagramSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="480" viewBox="0 0 600 480"><rect width="600" height="480" fill="#e8dfc6"/><path d="M35 48H550V303H35Z" fill="#456258"/><path d="M45 95H540M45 150H540M45 205H540M145 48V300M350 48V300" fill="none" stroke="#718579" stroke-width="4"/><path d="M35 300H550V414H35Z" fill="#967458"/><path d="M35 320H550M35 353H550M35 386H550M135 320V353M380 320V353M245 353V386M470 353V386" fill="none" stroke="#bc9c76" stroke-width="4"/><path d="M35 350H455V408L480 437L450 467L405 424V416H35Z" fill="#e2e8d8" stroke="#173d36" stroke-width="9"/><path d="M45 361H442V417L466 440" fill="none" stroke="#f7f3d5" stroke-width="5"/><path d="M45 338H435" stroke="#243c36" stroke-width="8"/><path d="M340 320H505V473H340Z" fill="none" stroke="#ca8759" stroke-width="8" stroke-dasharray="15 8"/></svg>';
const RoofDiagram:React.FC<{loupe?:boolean;focus?:[number,number]}>=({loupe=false,focus=[.5,.5]})=>{
 const source=useLoader(THREE.TextureLoader,'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(roofDiagramSvg));
 const texture=useMemo(()=>{const t=source.clone();t.colorSpace=THREE.SRGBColorSpace;if(loupe)t.repeat.set(.43,.43);t.needsUpdate=true;return t;},[source,loupe]);
 if(loupe)texture.offset.set(focus[0]-.215,focus[1]-.215);
 const overPrint=!loupe||(focus[0]>=0&&focus[0]<=1&&focus[1]>=0&&focus[1]<=1);
 return <mesh rotation={[-Math.PI/2,0,0]}>{loupe?<circleGeometry args={[.34,64]}/>:<planeGeometry args={[.98,.78]}/>}<meshBasicMaterial map={texture} transparent={!overPrint} opacity={overPrint?1:0}/></mesh>;
};
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
  <group position={[0,.024,-.03]}><RoofDiagram/></group>
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
const CapturedPrint:React.FC<{marked?:number}>=({marked=1})=>{
 return <>
 <Box p={[0,0,0]} s={[3.06,.035,2.12]} c={cream} round={.025}/>
 <group position={[0,.022,0]} rotation={[-Math.PI/2,0,0]}><PhotoSurface/></group>
 {marked>0&&[-1,1].map(sign=><React.Fragment key={sign}>
  <Box p={[-1.095+sign*.31,.035,-.202]} s={[.055,.013,.79*marked]} c={copper}/>
  <Box p={[-1.095,.035,-.202+sign*.385]} s={[.66*marked,.013,.055]} c={copper}/>
 </React.Fragment>)}
 </>;
};
const ReviewArrival:React.FC<{a:number;b:number}>=({a,b})=><>
 <Table/>
 <group position={[mix(2.75,0,a),.008,-.20]}>
  <CapturedPrint marked={Math.max(0,(b-.50)*2)}/>
  {b>0&&b<.55&&<Box p={[mix(-1.39,1.39,Math.min(1,b*2)),.045,0]} s={[.035,.012,1.89]} c="#b3e4ce"/>}
  <Hand p={[-1.25-b*2.5,.079,.12+b*.20]} r={[0,-Math.PI/2,0]} scale={.78}/>
 </group>
 <Box p={[1.94,.09,-.56]} s={[.18,.17,.88]} c="#334f57" round={.04}/>
</>;
const ReviewDesk:React.FC<{a:number;b:number;c:number}>=({a,b,c})=>{
 return <>
 <Table/>
 <group position={[0,.008+c*.30,-.20]} rotation={[c*.18,0,0]}>
  <CapturedPrint/>
  <Hand p={[mix(-2.30,-1.57,a),.079,mix(-.37,.06,b)]} r={[0,-Math.PI/2,0]} scale={.78}/>
 </group>
 <Box p={[1.94,.09,-.56]} s={[.18,.17,.88]} c="#334f57" round={.04}/>
 </>;
};
const NoticeQueue:React.FC<{a:number;b:number}>=({a,b})=><>
 <Table/>
 {[0,1,2,3,4,5].map(i=><Paper key={i} p={[i%2*.035,.012+i*.020,-.20]} scale={1.35}/>)}
 <group position={[mix(-1.8,0,a),mix(.64,.14,a),-.20]}>
  {[0,1,2].map(i=><Paper key={i} p={[i*.012,i*.025,0]} scale={1.35}/>)}
  <group position={[0,b*.14,b*.85]} rotation={[b*.10,0,0]}>
   <Paper p={[0,.075,0]} scale={1.35}/>
   <Hand p={[.65,.12,.10]} r={[0,Math.PI/2,0]} scale={.8}/>
  </group>
 </group>
</>;
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
const FoldedFlashing:React.FC=()=>{
 const geometry=useMemo(()=>{
  // A continuous extruded sheet wraps the fixed roof edge; profile matches the closing diagram.
  const section=new THREE.Shape();
  const profile=[[-.82,-.065],[-1.55,-.065],[-1.55,-.50],[-1.68,-.64],[-1.655,-.665],[-1.515,-.515],[-1.515,-.10],[-.82,-.10]];
  profile.forEach(([z,y],i)=>i?section.lineTo(z,y):section.moveTo(z,y));section.closePath();
  return new THREE.ExtrudeGeometry(section,{depth:5.8,bevelEnabled:true,bevelThickness:.005,bevelSize:.007,bevelSegments:2,steps:1});
 },[]);
 return <mesh position={[-2.9,0,0]} rotation={[0,Math.PI/2,0]} geometry={geometry} castShadow receiveShadow><meshStandardMaterial color="#d7ded1" metalness={.6} roughness={.28} side={THREE.DoubleSide}/></mesh>;
};
const Flashing:React.FC<{a:number;b:number;c:number;d:number;e:number}>=({a,b,c,d,e})=>{
 const lift=.80*(1-a), forward=.38*(1-a), headY=mix(.25,-.04,c);
 const toolY=headY+d*.90+.08*Math.sin(b*Math.PI)+.20*Math.sin(d*Math.PI), turn=-c*Math.PI*6;
 const toolX=mix(mix(1.25,.10,b),2.70,d), toolZ=mix(mix(.35,1.15,b),.40,d);
 const reach=Math.min(1,e*4), roll=Math.max(0,(e-.25)/.75), rollZ=.60+roll*.82;
 const left:V3=[mix(mix(-.86,-.78,b),-.70,reach),mix(lift+mix(-.02,.04,b),.33,reach),mix(forward+mix(1.15,.40,b),rollZ,reach)];
 const gripAngle=-c*Math.PI*.30;
 const wrist:V3=[toolX+.23*Math.cos(gripAngle)+.04*Math.sin(gripAngle),toolY+.57,toolZ-.23*Math.sin(gripAngle)+.04*Math.cos(gripAngle)];
 const leftWrist:V3=[left[0]-.55,left[1]+.012,left[2]];

 return <>
 <Box p={[0,-2.05,-1.25]} s={[5.8,3.9,5.50]} c="#98735e" round={.008}/>
 {Array.from({length:22},(_,row)=>Array.from({length:13},(_,col)=><Box key={row+'-'+col}
   p={[-2.78+col*.46+(row%2)*.06,-.24-row*.17,1.507]} s={[.42,.142,.016]} round={.005}
   c={['#a27b62','#b18d73','#977059'][(row+col)%3]}/>))}
 <Box p={[0,-1.27,1.555]} s={[1.04,.83,.095]} c={cream} round={.015}/>
 <Box p={[0,-1.27,1.61]} s={[.91,.70,.02]} c="#557c86" metal={.3}/>
 <Box p={[0,-1.27,1.633]} s={[.04,.70,.03]} c={cream}/>
 <Box p={[0,-1.34,1.633]} s={[.91,.035,.03]} c={cream}/>
 <Box p={[-.23,-1.12,1.645]} s={[.14,.26,.008]} c="#a6bfb9"/>
 <Box p={[0,-1.70,1.65]} s={[1.16,.07,.21]} c="#c7b291" round={.012}/>
 <Box p={[0,-.185,.18]} s={[5.8,.17,5.50]} c="#786d57"/>
 <Box p={[0,-.112,.18]} s={[5.8,.024,5.50]} c="#354d45"/>
 <Box p={[0,-.030,-1.5]} s={[5.8,.05,4.88]} c="#45594c" round={.014}/>
 {[-2.4,-1.6,-.8,0,.8,1.6,2.4].map(x=><Box key={x} p={[x,-.002,-1.5]} s={[.018,.006,4.8]} c="#354a3d"/>)}
 <group position={[0,lift,forward]}>
  <FoldedFlashing/>
  {[-.72,.72].map(x=><group key={x}>
   <Ball p={[x,-.052,1.15]} s={[.074,.014,.074]} c="#52675d"/>
   <Box p={[x,-.035,1.15]} s={[.075,.005,.009]} c="#d2d9c9"/>
  </group>)}
  <group position={[.10,headY,1.15]} rotation={[0,turn,0]}>
   <Rod from={[0,-.31,0]} to={[0,-.025,0]} radius={.032} c="#87958a"/>
   {Array.from({length:6},(_,i)=><mesh key={i} position={[0,-.055-i*.046,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.042,.009,6,20]}/><meshStandardMaterial color="#a5b2a8" metalness={.8} roughness={.24}/></mesh>)}
   <mesh><cylinderGeometry args={[.105,.105,.04,32]}/><meshStandardMaterial color="#cad2c7" metalness={.85} roughness={.22}/></mesh>
   <Box p={[0,.023,0]} s={[.15,.004,.025]} c="#334a42"/><Box p={[0,.024,0]} s={[.025,.004,.15]} c="#334a42"/>
  </group>
 </group>
 <group position={[toolX,toolY,toolZ]}>
  <group rotation={[0,turn,0]}>
   <Box p={[0,.13,0]} s={[.033,.21,.033]} c="#b6c1b5" metal={.85}/>
   <mesh position={[0,.30,0]}><cylinderGeometry args={[.10,.06,.14,24]}/><meshStandardMaterial color="#30443d" metalness={.5} roughness={.3}/></mesh>
   <mesh position={[0,.55,0]}><cylinderGeometry args={[.125,.125,.42,32]}/><meshStandardMaterial color="#d59952" roughness={.42}/></mesh>
   {[0,1,2,3,4,5].map(i=><Box key={i} p={[Math.cos(i*Math.PI/3)*.116,.55,Math.sin(i*Math.PI/3)*.116]} s={[.034,.32,.034]} c="#40554c" round={.01}/>)}
   <mesh position={[0,.81,0]}><sphereGeometry args={[.14,24,16]}/><meshStandardMaterial color="#30483f" roughness={.4}/></mesh>
  </group>
  <group rotation={[0,-c*Math.PI*.30,0]}>
   {[.41,.51,.61,.71].map(y=><mesh key={y} position={[0,y,0]} rotation={[Math.PI/2,0,-.28]}><torusGeometry args={[.155,.039,10,24,Math.PI*1.5]}/><meshStandardMaterial color="#ba8c6d" roughness={.72}/></mesh>)}
   <Ball p={[.16,.57,.025]} s={[.11,.24,.12]} c="#b28265"/>
   <Rod from={[.19,.73,.12]} to={[-.015,.60,.18]} radius={.054} c="#c09070"/>

  </group>
 </group>
 {/* The close shot crops connected forearms at the physical frame edges. */}
 <Rod from={[-5,left[1]+.12,left[2]-.05]} to={leftWrist} radius={.115} c="#477080"/>
 <Rod from={leftWrist} to={[left[0]-.22,left[1]+.015,left[2]]} radius={.087} c="#b58769"/>
 <Rod from={[5,toolY+.76,toolZ-.20]} to={[wrist[0]+.30,wrist[1]+.03,wrist[2]]} radius={.13} c="#477080"/>
 <Rod from={[wrist[0]+.30,wrist[1]+.03,wrist[2]]} to={wrist} radius={.095} c="#b58769"/>
 <Hand p={left} r={[0,-Math.PI/2,0]} scale={.82}/>
 {roll>0&&<Box p={[-.25,-.0325,.60+roll*.41]} s={[2.10,.055,Math.max(.002,roll*.82)]} c="#b0b9a0" round={.004}/>}
 <group position={[-.25,.14,rollZ]} rotation={[0,0,Math.PI/2]}>
  <group rotation={[0,roll*3.3,0]}>
   <mesh castShadow><cylinderGeometry args={[.145,.145,2.10,40]}/><meshStandardMaterial color="#b0b9a0" roughness={.79}/></mesh>
   <Box p={[.147,0,0]} s={[.009,2.08,.014]} c="#405745"/>
  </group>
  {[-1.055,1.055].map(y=><mesh key={y} position={[0,y,0]}><cylinderGeometry args={[.105,.105,.012,32]}/><meshStandardMaterial color="#8d927a" roughness={.84}/></mesh>)}
 </group>
 </>;
};
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
const Evidence:React.FC<{a:number;b:number;c?:number;closing?:boolean;settled?:boolean}>=({a,b,c=0,closing=false,settled=false})=>{
 const move=closing?1:a;
 const lift=settled?0:.18*(1-b)+Math.sin(a*Math.PI)*.08;
 const release=settled?0:c;
 return <>
 <Table home/>
 <group position={[-.62,closing?mix(-.0015,.44,a)*(1-b)-.0015*b:-.0015,.08]} rotation={[closing?.25*a*(1-b):0,-.06,0]}>
 <Paper p={[0,0,0]} scale={.9}/>
 {closing&&<Hand p={[.44,.08,.25]} r={[0,1.2,0]} scale={.72}/>}
 </group>
 <group position={[mix(1.14,.57,move),-.002+lift,-.02-.18*Math.sin(a*Math.PI)]} rotation={[settled?0:.16*(1-b),mix(.24,.08,b),0]}>
  <Paper p={[0,0,0]} roof scale={.85}/>
  {!settled&&<Hand p={[-.48-release*2.3,.062+release*.25+.08*Math.sin(release*Math.PI),.31+release*.30]} r={[0,-1.18-release*.12,0]} scale={.72}/>}
 </group>

 <Box p={[-1.74,.11,-.76]} s={[.07,.07,.71]} c="#c09e62" round={.018}/>
 </>;
};
const EvidenceComparison:React.FC<{a:number;b:number;c:number;d:number}>=({a,b,c,d})=>{
 // The table and both documents stay where scene eight left them.
 const loupeX=mix(1.50,.74,b)-c*.08+d*.97, loupeZ=mix(.60,.16,b)-.10*Math.sin(b*Math.PI)+d*.23;
 const dx=loupeX-.57,dz=loupeZ+.02;
 const paperX=(Math.cos(.08)*dx-Math.sin(.08)*dz)/.85;
 const paperZ=(Math.sin(.08)*dx+Math.cos(.08)*dz)/.85;
 const focus:[number,number]=[.5+paperX/.98,.5-(paperZ+.03)/.78];
 return <>
 <Evidence a={1} b={1} settled/>
 <group position={[.57,.010,-.02]} rotation={[0,.08,0]}>
  <mesh position={[mix(.72,0,a),.008,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[1.02,1.05]}/><meshPhysicalMaterial color="#d3e0d4" transparent opacity={.10} roughness={.12} depthWrite={false}/></mesh>
  <group position={[mix(.72,0,a),.02,0]}>
   <Box p={[.26,0,.36]} s={[.52,.008,.035]} c={copper}/>
   <Box p={[.505,0,.22]} s={[.035,.008,.30]} c={copper}/>
   <Box p={[.26,0,.08]} s={[.52,.008,.035]} c={copper}/>
   <Box p={[.015,0,.22]} s={[.035,.008,.30]} c={copper}/>
  </group>
  <Hand p={[mix(1.10,.40,a),.035,.25]} r={[0,1.20,0]} scale={.52}/>
 </group>
 <group position={[loupeX,.193+.07*Math.sin(b*Math.PI)+.035*Math.sin(c*Math.PI)+d*.20,loupeZ]}>
  <mesh rotation={[-Math.PI/2,0,0]} castShadow><torusGeometry args={[.365,.028,12,64]}/><meshStandardMaterial color="#384e4a" metalness={.8} roughness={.25}/></mesh>
  <group position={[0,.002,0]}><RoofDiagram loupe focus={focus}/></group>
  <mesh position={[0,.008,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.34,64]}/><meshPhysicalMaterial color="#e1f0e6" transparent opacity={.055} roughness={.04} depthWrite={false}/></mesh>
  <Rod from={[-.28,0,.27]} to={[-.68,0,.64]} radius={.047} c="#304c4a"/>
  <Hand p={[-.63,.05,.67]} r={[0,-.78,0]} scale={.55}/>
 </group>
 </>;
};
const PhysicalStory:React.FC<{scene:Scene;time:number;windows:ReturnType<typeof actionWindows>}>=({scene,time,windows})=>{
 const progress=(i:number)=>scene.visual_events?.[i]?.id?actionProgress(requireAction(windows,scene.visual_events[i].id),time):0;
 const a=progress(0),b=progress(1),c=progress(2),d=progress(3),e=progress(4),id=scene.id;
 const camera:{position:V3;target:V3;fov:number}=id==='s1'?{position:[7,6,10],target:[-.15,-.35,.15],fov:36}:
 id==='s2'?{position:[.15,4.8,5.9],target:[-.10,-.25,-.20],fov:38}:
 id==='s3'?{position:[.15,4.8,5.9],target:[-.10,-.25,-.20],fov:42}:
 id==='s4'?{position:[.15,4.8,5.9],target:[-.10,-.25,-.20],fov:42}:
 id==='s5'?{position:[1.6,1.25,5.4],target:[0,.20,-.2],fov:39}:
 id==='s6'?{position:[1.6,3.3,6.3],target:[0,-.40,1.0],fov:40}:
 id==='s7'?{position:[2.7,2.9,7.4],target:[0,-.35,.1],fov:38}:
 ['s8','s9'].includes(id)?{position:[.5,5.4,5.8],target:[.10,0,.08],fov:40}:
 {position:[1.2,3.8,5.3],target:[0,-.28,-.16],fov:42};
 return <CinematicStage {...camera} exposure={1.15}>
 <directionalLight position={[3,8,2]} intensity={1.4} color="#fff1c9"/>
 <hemisphereLight intensity={.75} args={['#d4e5e0','#7a7961',.75]}/>
 {id==='s1'&&<Street a={a} b={b} drive={Math.min(1,(time-scene.start_s)/scene.duration_s)}/>}
 {id==='s2'&&<NoticeQueue a={a} b={b}/>}
 {id==='s3'&&<ReviewArrival a={a} b={b}/>}
 {id==='s4'&&<ReviewDesk a={a} b={b} c={c}/>}
 {id==='s5'&&<Notice a={a} b={b}/>}
 {id==='s6'&&<Flashing a={a} b={b} c={c} d={d} e={e}/>}
 {id==='s7'&&<Cleanup a={a} b={b}/>}
 {id==='s8'&&<Evidence a={a} b={b} c={c}/>}
 {id==='s9'&&<EvidenceComparison a={a} b={b} c={c} d={d}/>}
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
 {scene.id==='s2'&&<div style={{position:'absolute',left:70,top:410,fontFamily:FONT.mono,fontSize:25,color:cream}}>ILLUSTRATIVE NOTICE VOLUME / NBC 5</div>}
 {['s6','s7','s8','s9'].includes(scene.id)&&<div style={{position:'absolute',left:70,top:386,fontFamily:FONT.mono,fontSize:19,letterSpacing:1.2,color:'#eac39f'}}>SEPARATE REPORTED CASE / NBC 5</div>}
 {scene.id==='s3'&&<div style={{position:'absolute',left:70,top:410,fontFamily:FONT.mono,fontSize:25,color:cream}}>ILLUSTRATED IMAGE HANDOFF</div>}
 {scene.id==='s6'&&<div style={{position:'absolute',left:70,top:426,fontFamily:FONT.mono,fontSize:28,color:cream}}>ILLUSTRATIVE ATTACHMENT</div>}
 {scene.id==='s9'&&<div style={{position:'absolute',left:58,top:426,fontFamily:FONT.mono,fontSize:34,letterSpacing:.7,color:'#e2e8d7',background:'rgba(9,32,39,.90)',padding:'8px 12px'}}>ILLUSTRATIVE COMPARISON</div>}
 <GradeLayer f={frame} vignette={.09} grain={.009} bloom={.01}/><SubtitleTrack cues={captions} fps={fps}/>
 </>}
 <Sequence from={Math.round(runtime_s*fps)} durationInFrames={Math.round(credits_s*fps)}><CreditsCard text={credits}/></Sequence>
 </div>;
};
