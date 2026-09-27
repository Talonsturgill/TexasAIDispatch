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
// Both views are authored explanatory drawings, never the resident's actual records.
const RoofComparison:React.FC<{a:number;b:number;c:number}>=({a,b,c})=>{
 const leftX=mix(-2.8,-.66,a),rightX=mix(2.9,.66,b);
 return <>
 <Table/>
 <group position={[leftX,.027,-.10]} rotation={[0,.04,0]} scale={.74}>
  <Paper p={[0,0,0]} roof scale={1.38}/>
  <Hand p={[-.67-b*1.7,.087,.39]} r={[0,-Math.PI/2,0]} scale={.85}/>
 </group>
 <group position={[rightX,.036,-.08]} rotation={[0,-.035,0]} scale={.74}>
  <Box p={[0,0,0]} s={[1.63,.023,2.08]} c={cream} round={.016}/>
  <Box p={[-.37,.02,-.77]} s={[.53,.008,.09]} c={ink}/>
  {/* Enlarged bent sheet and masonry repeat the same profile in RoofDiagram. */}
  <Box p={[-.07,.025,.12]} s={[1.25,.012,.79]} c="#a78262"/>
  {[-.12,.10,.32].map(z=><Box key={z} p={[-.07,.034,z]} s={[1.24,.005,.018]} c="#c2a383"/>)}
  <Box p={[-.18,.05,-.05]} s={[1.16,.015,.12]} c="#dce5d5"/>
  <Box p={[.35,.051,.13]} s={[.12,.017,.46]} c="#dce5d5"/>
  <Box p={[.43,.051,.40]} s={[.13,.017,.28]} r={[0,-.65,0]} c="#dce5d5"/>
  <Box p={[-.18,.063,-.115]} s={[1.17,.006,.021]} c={ink}/>
  <Box p={[.41,.064,.15]} s={[.022,.006,.51]} c={ink}/>
  <Box p={[.49,.064,.405]} s={[.022,.006,.27]} r={[0,-.65,0]} c={ink}/>
  <Box p={[-.38,.021,.82]} s={[.50,.006,.035]} c={copper}/>
  <Hand p={[.89,.10,mix(-.10,.46,c)]} r={[0,Math.PI/2,0]} scale={.85}/>
  <Rod from={[1.51,.12,mix(-.10,.46,c)]} to={[4,.12,.10]} radius={.105} c="#477080"/>
 </group>
 </>;
};
const Limb:React.FC<{shoulder:V3;elbow:V3;hand:V3;skin:string;sleeve?:string}>=({shoulder,elbow,hand,skin,sleeve})=><>
 <Rod from={shoulder} to={elbow} radius={.075} c={sleeve??skin}/>
 <Ball p={elbow} s={[.077,.077,.077]} c={skin}/>
 <Rod from={elbow} to={hand} radius={.058} c={skin}/>
 <Ball p={hand} s={[.075,.051,.071]} c={skin}/>
</>;
const Body:React.FC<{p:V3;yaw?:number;bend?:number;step?:number;travel?:V3;look?:number;torsoTurn?:number;shirt?:string;skin?:string}>=({p,yaw=0,bend=0,step=0,travel=[0,0,0],look=0,torsoTurn=0,shirt="#5a6d77",skin="#ad7e63"})=>{
 const stride=Math.sin(step*Math.PI);
 const localTravel:V3=[Math.cos(yaw)*travel[0]-Math.sin(yaw)*travel[2],travel[1],Math.sin(yaw)*travel[0]+Math.cos(yaw)*travel[2]];
 const ankle=(side:number):V3=>{
  const swing=Math.max(0,Math.min(1,step*2-(side>0?1:0))), q=swing*swing*(3-2*swing);
  return [side*.16+(q-step)*localTravel[0],-.405+Math.sin(swing*Math.PI)*.09,.055+(q-step)*localTravel[2]];
 };
 const ankleL=ankle(-1),ankleR=ankle(1);
 return <group position={p} rotation={[0,yaw,0]}>
 {[[-1,ankleL],[1,ankleR]].map(([side,ankle])=>{
  const sign=side as number,foot=ankle as V3,knee:V3=[sign*.145,-.035-bend*.07,.10+Math.abs(stride)*.08+bend*.15];
  return <group key={sign}><Rod from={[sign*.14,.35-bend*.10,0]} to={knee} radius={.09} c="#3e4c52"/><Rod from={knee} to={foot} radius={.073} c="#3e4c52"/><Box p={[foot[0],foot[1]-.052,foot[2]+.065]} s={[.19,.12,.34]} c="#303835" round={.035}/></group>;
 })}
 <group position={[0,.69-bend*.10,bend*.11]} rotation={[bend*.12,torsoTurn,0]}>
  <Box p={[0,0,0]} s={[.48,.68,.28]} c={shirt} round={.07}/>
  <Box p={[0,-.31,0]} s={[.46,.065,.30]} c="#353d39" round={.016}/>
  <Box p={[.02,-.31,.163]} s={[.075,.044,.02]} c="#a1a99e" metal={.35}/>
  <Rod from={[0,.30,0]} to={[0,.42,0]} radius={.075} c={skin}/>
  <group position={[0,.42,0]} rotation={[0,look,0]}><group position={[0,-.42,0]}><Ball p={[0,.59,.006]} s={[.157,.218,.153]} c={skin}/>
  <Ball p={[0,.72,-.035]} s={[.159,.105,.14]} c="#403f36"/>
  <Ball p={[0,.59,.161]} s={[.032,.042,.044]} c={skin}/>
  {[-1,1].map(side=><group key={side}><Ball p={[side*.156,.59,.006]} s={[.022,.043,.027]} c={skin}/><Ball p={[side*.058,.64,.147]} s={[.017,.012,.008]} c="#333b36"/><Box p={[side*.08,.323,.118]} s={[.13,.024,.09]} r={[0,0,side*.28]} c="#afbbb4"/></group>)}
  </group></group><Box p={[.11,.13,.154]} s={[.115,.13,.009]} c={shirt}/>
  <Box p={[.11,.20,.163]} s={[.13,.018,.007]} c="#b5c0b5"/>
 </group>
 </group>;
};
const Cleanup:React.FC<{a:number;b:number}>=({a,b})=>{
 const sweep=mix(.60,-.64,b), foot:V3=[sweep,-.46,.77],top:V3=[sweep+.23,.90,.43];
 const grip=(t:number)=>foot.map((v,i)=>mix(v,top[i],t)) as V3;
 const h1=grip(.83),h2=grip(.58),lean=.65*a+.18*Math.sin(b*Math.PI);
 return <>
 <Box p={[0,-.59,0]} s={[7,.13,6]} c="#9d9b76"/>
 <House flat scale={.65} p={[0,0,-2.6]}/>
 <Body p={[-.10,0,0]} bend={lean} shirt="#476d79"/>
 <Limb shoulder={[-.34,.91-lean*.10,.07+lean*.14]} elbow={[-.49+.20*b,.55,.32]} hand={h2} skin="#ad7e63" sleeve="#476d79"/>
 <Limb shoulder={[.14,.91-lean*.10,.07+lean*.14]} elbow={[.40-.22*b,.62,.25]} hand={h1} skin="#ad7e63" sleeve="#476d79"/>
 <Rod from={foot} to={top} radius={.025} c="#bda06f"/>
 <Box p={[sweep,-.46,.77]} s={[.60,.10,.19]} c="#8b6f49" round={.014}/>
 {Array.from({length:17},(_,i)=><Rod key={i} from={[sweep-.27+i*.034,-.47,.78]} to={[sweep-.29+i*.036,-.526,.85]} radius={.008} c="#ba9e64"/>)}
 {/* Leaves stay on the ground and gather at the leading edge of the traveling bristles. */}
 {Array.from({length:19},(_,i)=>{
  const original=.40-(i%7)*.15, z=.63+Math.floor(i/7)*.12;
  const x=Math.min(original,sweep-.30-(i%5)*.045);
  return <Box key={i} p={[x,-.516,z]} s={[.045+(i%3)*.014,.013,.028]} r={[0,i*1.7,.08]} c={["#655b3b","#826843","#76663d"][i%3]} round={.006}/>;
 })}
 </>;
};
// Anatomy follows the existing contact clock; sleeve caps remain beyond the picture.
const HandBone:React.FC<{from:V3;to:V3;r0:number;r1:number;color:string}>=({from,to,r0,r1,color})=>{
 const delta=new THREE.Vector3(...to).sub(new THREE.Vector3(...from));
 const rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize());
 return <mesh position={from.map((v,i)=>(v+to[i])/2) as V3} quaternion={rotation} castShadow receiveShadow>
  <cylinderGeometry args={[r1,r0,delta.length(),20,1]}/><meshStandardMaterial color={color} roughness={.68}/>
 </mesh>;
};
const EncounterHand:React.FC<{contact:V3;approach:V3;cuff:V3;skin:string;shirt:string;closed?:number;pointing?:number;normal?:V3;handedness?:number;flex?:number;elbow?:V3}>=({contact,approach,cuff,skin,shirt,closed=0,pointing=0,normal=[0,0,1],handedness=1,flex=0,elbow})=>{
 const u=new THREE.Vector3(...approach).normalize(),n=new THREE.Vector3(...normal).normalize();
 const side=new THREE.Vector3().crossVectors(n,u).normalize().multiplyScalar(handedness);
 const depth=new THREE.Vector3().crossVectors(u,side).normalize();
 const local=(distance:number,width=0,out=0):V3=>new THREE.Vector3(...contact).addScaledVector(new THREE.Vector3(...approach),distance).addScaledVector(side,width).addScaledVector(n,out).toArray() as V3;
 const palm=local(.175),wrist=local(.31);
 const blend=(p:V3,q:V3,t:number)=>p.map((v,i)=>mix(v,q[i],t)) as V3;
 const sleeve=useMemo(()=>{
  const end=new THREE.Vector3(...cuff),begin=new THREE.Vector3(...wrist);
  const mid=elbow?new THREE.Vector3(...elbow):begin.clone().lerp(end,.43).addScaledVector(side,.08+.18*flex).addScaledVector(n,.055*flex);
  const curve=new THREE.CatmullRomCurve3([begin,mid,end]);
  const frames=curve.computeFrenetFrames(36,false),positions:number[]=[],indices:number[]=[];
  for(let j=0;j<=36;j++){
   const t=j/36,center=curve.getPoint(t);
   const fold=.008*Math.exp(-(((t-.055)/.025)**2))-.006*Math.exp(-(((t-.105)/.027)**2))+.006*Math.exp(-(((t-.165)/.035)**2));
   const radius=.078+.065*Math.sin(Math.min(1,t*1.7)*Math.PI/2)+fold;
   for(let i=0;i<=24;i++){
    const angle=i/24*Math.PI*2,p=center.clone().addScaledVector(frames.normals[j],Math.cos(angle)*radius).addScaledVector(frames.binormals[j],Math.sin(angle)*radius*.78);
    positions.push(p.x,p.y,p.z);
    if(j<36&&i<24){const k=j*25+i;indices.push(k,k+1,k+25,k+1,k+26,k+25);}
   }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
 },[...wrist,...cuff,...side.toArray(),...normal,flex,...(elbow??[0,0,0])]);
 const palmGeometry=useMemo(()=>{
  // A tapered metacarpal volume widens at the knuckles and narrows into the wrist.
  const rings=[{d:.105,w:.073,h:.031},{d:.15,w:.086,h:.043},{d:.205,w:.077,h:.047},{d:.255,w:.056,h:.034},{d:.31,w:.048,h:.029}];
  const positions:number[]=[],indices:number[]=[];
  rings.forEach((ring,j)=>{
   const center=new THREE.Vector3(...local(ring.d));
   for(let i=0;i<=28;i++){
    const angle=i/28*Math.PI*2,asymmetry=1+.09*Math.sin(angle);
    const p=center.clone().addScaledVector(side,Math.cos(angle)*ring.w*asymmetry).addScaledVector(depth,Math.sin(angle)*ring.h);
    positions.push(p.x,p.y,p.z);
    if(j<rings.length-1&&i<28){const k=j*29+i;indices.push(k,k+1,k+29,k+1,k+30,k+29);}
   }
  });
  const firstCenter=positions.length/3;positions.push(...local(rings[0].d),...local(rings[rings.length-1].d));
  for(let i=0;i<28;i++){indices.push(firstCenter,i+1,i);const k=(rings.length-1)*29+i;indices.push(firstCenter+1,k,k+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
 },[...contact,...approach,...normal,handedness]);
 const sleeveEdge=new THREE.Color(shirt).multiplyScalar(.82).getStyle();
 const nailColor=new THREE.Color(skin).lerp(new THREE.Color('#dcc1ac'),.40).getStyle();
 const nail=(tip:V3,previous:V3,radius:number)=>{
  const direction=new THREE.Vector3(...tip).sub(new THREE.Vector3(...previous)).normalize();
  const z=depth.clone().addScaledVector(direction,-depth.dot(direction)).normalize();
  const x=new THREE.Vector3().crossVectors(direction,z).normalize();
  const orientation=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,direction,z));
  const pos=new THREE.Vector3(...tip).lerp(new THREE.Vector3(...previous),.23).addScaledVector(z,radius*.84);
  return <mesh position={pos} quaternion={orientation} scale={[radius*.66,radius*.89,.003]}><sphereGeometry args={[1,16,10]}/><meshStandardMaterial color={nailColor} roughness={.48}/></mesh>;
 };
 const indexBase=local(.112,-.047);
 const indexPip=blend(local(.058,-.035),local(.062,-.039,-.090),closed);
 const indexDip=blend(local(.024,-.013),local(.025,-.020,-.070),closed);
 const relaxedTip=local(.10,-.045,.027);
 const behindEdge=new THREE.Vector3(...contact).addScaledVector(n,-.052).toArray() as V3;
 const indexTip=blend(blend(relaxedTip,contact,pointing),behindEdge,closed);
 const index1=blend(local(.12,-.044,.060),indexPip,Math.max(pointing,closed));
 const index2=blend(local(.095,-.045,.058),indexDip,Math.max(pointing,closed));
 const thumbBase=local(.217,-.065),thumbKnuckle=local(.135,-.078,.025);
 const thumbOpposed=contact;
 const thumbEnd=blend(local(.095,-.071,.014),thumbOpposed,closed);
 const thumbMid=blend(local(.12,-.095,.028),local(.065,-.043,.070),closed);
 return <>
 <mesh geometry={sleeve} castShadow receiveShadow><meshStandardMaterial color={shirt} roughness={.93}/></mesh>
 <HandBone from={local(.32)} to={local(.287)} r0={.080} r1={.069} color={sleeveEdge}/>
 <mesh geometry={palmGeometry} castShadow receiveShadow><meshStandardMaterial color={skin} roughness={.69}/></mesh>
 <Ball p={local(.19,-.05,.007)} s={[.042,.059,.036]} c={skin}/>
 <HandBone from={indexBase} to={index1} r0={.024} r1={.020} color={skin}/>
 <HandBone from={index1} to={index2} r0={.020} r1={.017} color={skin}/>
 <HandBone from={index2} to={indexTip} r0={.017} r1={.0145} color={skin}/>
 {[indexBase,index1,index2].map((p,i)=><Ball key={i} p={p} s={[.022-i*.002,.023-i*.002,.021-i*.002]} c={skin}/>)}
 <Ball p={indexTip} s={[.016,.020,.024]} c={skin}/>{nail(indexTip,index2,.018)}
 {[0,1,2].map(i=>{
  const width=-.004+i*.035,length=[1,.92,.76][i],curl=.65+.35*closed;
  const base=local(.118,width),pip=local(.118-.050*length,width,-.055*curl);
  const dip=local(.138+.012*curl,width,-.085*curl);
  const tip=local(.180+.018*curl,width,-.018*curl);
  return <group key={i}>
   <HandBone from={base} to={pip} r0={.023-i*.002} r1={.019-i*.002} color={skin}/>
   <HandBone from={pip} to={dip} r0={.019-i*.002} r1={.016-i*.0015} color={skin}/>
   <HandBone from={dip} to={tip} r0={.016-i*.0015} r1={.014-i*.001} color={skin}/>
   {[base,pip,dip].map((p,j)=><Ball key={j} p={p} s={[.021-i*.002,.021-i*.002,.020-i*.002]} c={skin}/>)}
   <Ball p={tip} s={[.015-i*.001,.018-i*.001,.016-i*.001]} c={skin}/>{nail(tip,dip,.017-i*.0015)}
  </group>;
 })}
 <HandBone from={thumbBase} to={thumbKnuckle} r0={.034} r1={.027} color={skin}/>
 <HandBone from={thumbKnuckle} to={thumbMid} r0={.027} r1={.022} color={skin}/>
 <HandBone from={thumbMid} to={thumbEnd} r0={.022} r1={.018} color={skin}/>
 <Ball p={thumbKnuckle} s={[.028,.029,.027]} c={skin}/><Ball p={thumbMid} s={[.023,.024,.022]} c={skin}/>
 <Ball p={thumbEnd} s={[.022,.023,.019]} c={skin}/>{nail(thumbEnd,thumbMid,.022)}
 </>;
};
const EncounterTorso:React.FC<{p:V3;yaw:number;lean:number;shirt:string;skin:string;headTurn:number}>=({p,yaw,lean,shirt,skin,headTurn})=><>
 <group position={p} rotation={[lean,yaw,0]}>
 {/* A fitted shirt ends at the belt; the planted lower body supports the upper-body lean. */}
 <Box p={[0,-.005,0]} s={[.58,1.21,.38]} c={shirt} round={.10}/>
 <Box p={[0,.46,0]} s={[.66,.25,.37]} c={shirt} round={.10}/>
 <Box p={[.025,-.13,.201]} s={[.024,1.05,.010]} c="#425b57"/>
 <Box p={[-.13,.23,.206]} s={[.16,.16,.016]} c={shirt} round={.009}/>
 <Rod from={[0,.55,0]} to={[0,.76,0]} radius={.085} c={skin}/>
 {[-1,1].map(sign=><Box key={sign} p={[sign*.10,.565,.10]} s={[.15,.055,.17]} r={[0,0,sign*.30]} c="#b8bcb0" round={.012}/>)}
 <group position={[0,.90,0]} rotation={[0,headTurn,0]}>
  <Ball p={[0,0,0]} s={[.163,.22,.157]} c={skin}/>
  <Ball p={[0,.14,-.033]} s={[.168,.10,.143]} c="#45453c"/>
  <Ball p={[0,-.002,.158]} s={[.032,.042,.042]} c={skin}/>
  {[-1,1].map(sign=><group key={sign}><Ball p={[sign*.163,-.01,0]} s={[.021,.043,.026]} c={skin}/><Ball p={[sign*.058,.044,.15]} s={[.014,.008,.006]} c="#3a3c34"/></group>)}
 </group>
 </group>
 <group position={p} rotation={[0,yaw,0]}>
  <Box p={[0,-.60,0]} s={[.55,.095,.37]} c="#353e3d" round={.025}/>
  <Box p={[.015,-.598,.194]} s={[.10,.054,.020]} c="#9b9e8c" metal={.30}/>
  <Box p={[0,-.765,0]} s={[.55,.28,.37]} c="#404c50" round={.06}/>
  {[-1,1].map(sign=>{
   const hip:V3=[sign*.145,-.84,0],knee:V3=[sign*.17,-1.38,.028],ankle:V3=[sign*.185,-1.90-p[1],.035];
   return <group key={sign}>
    <HandBone from={hip} to={knee} r0={.142} r1={.108} color="#404c50"/>
    <Ball p={knee} s={[.109,.116,.106]} c="#404c50"/>
    <HandBone from={knee} to={ankle} r0={.108} r1={.078} color="#3b484d"/>
    <Box p={[ankle[0],-1.970-p[1],.115]} s={[.225,.13,.405]} c="#303734" round={.045}/>
    <Box p={[ankle[0],-2.027-p[1],.115]} s={[.232,.018,.409]} c="#242e2d" round={.008}/>
   </group>;
  })}
 </group>
</>;
const encounterElbow=(shoulder:V3,wrist:V3,bend:number):V3=>{
 const root=new THREE.Vector3(...shoulder),end=new THREE.Vector3(...wrist),axis=end.clone().sub(root),distance=axis.length();
 axis.normalize();
 const upper=.72,lower=.74,along=(upper*upper-lower*lower+distance*distance)/(2*Math.max(.001,distance));
 const height=Math.sqrt(Math.max(.025,upper*upper-along*along));
 const bendAxis=new THREE.Vector3(.10,-1,.45+bend).addScaledVector(axis,-new THREE.Vector3(.10,-1,.45+bend).dot(axis)).normalize();
 return root.addScaledVector(axis,along).addScaledVector(bendAxis,height).toArray() as V3;
};
const SiteInspection:React.FC<{a:number;b:number;c:number;d:number}>=({a,b,c,d})=>{
 const smooth=(value:number)=>{const t=Math.max(0,Math.min(1,value));return t*t*t*(10-15*t+6*t*t);};
 const clearWindow=.34*smooth(b/.30);
 const boardPos:V3=[-.12,.38+.20*a+.035*Math.sin(a*Math.PI)-clearWindow,mix(.85,.60,a)];
 const boardTilt=mix(.80,1.15,a);
 const world=(x:number,y:number,z:number):V3=>[boardPos[0]+x,boardPos[1]+y*Math.cos(boardTilt)-z*Math.sin(boardTilt),boardPos[2]+y*Math.sin(boardTilt)+z*Math.cos(boardTilt)];
 const photoPos=world(.355,.028,-.10),restNotice=world(-.40,.035,.08);
 const pickup=smooth(c/.32),present=smooth((c-.32)/.68),receive=smooth(d/.45),pull=smooth((d-.45)/.55),release=smooth((d-.62)/.38);
 const noticePos:V3=[mix(restNotice[0],-.02,present)+.30*pull,mix(restNotice[1],.48,present)+.055*Math.sin(present*Math.PI)-.035*pull,mix(restNotice[2],1.0,present)+.08*pull];
 const noticeTilt=mix(boardTilt,1.10,present)+.06*pull;
 const photoMarker=world(.355-1.095*.27,.045,-.10-.202*.27+.14*smooth(b/.30));
 const windowPoint:V3=[-.817,.885,-1.045];
 const compare=smooth((b-.30)/.70);
 // Lift toward the viewer, clear the board top, then reach back to the upper window.
 const control1:V3=[photoMarker[0]-.10,.85,.95],control2:V3=[-.76,1.16,-.25];
 const finger:V3=photoMarker.map((v,i)=>(1-compare)**3*v+3*(1-compare)**2*compare*control1[i]+3*(1-compare)*compare**2*control2[i]+compare**3*windowPoint[i]) as V3;
 const edge:V3=[noticePos[0]-.226,noticePos[1]+.012,noticePos[2]+.027];
 const returnHigh:V3=[-.76,1.16,-.25],returnFront:V3=[edge[0],.85,.95];
 const pointing:V3=finger.map((v,i)=>(1-pickup)**3*v+3*(1-pickup)**2*pickup*returnHigh[i]+3*(1-pickup)*pickup**2*returnFront[i]+pickup**3*edge[i]) as V3;
 const officerContact:V3=[pointing[0]-.30*release,pointing[1]-.15*release,pointing[2]+.10*release];
 const ownerEdge:V3=[noticePos[0]+.226,noticePos[1]+.012,noticePos[2]+.027];
 const ownerContact:V3=[mix(1.10,ownerEdge[0],receive),mix(.12,ownerEdge[1],receive)+.10*Math.sin(receive*Math.PI),mix(.55,ownerEdge[2],receive)];
 // Wrist extension follows the reach; a separate forearm bend carries the elbow response.
 const reachBend=Math.sin(compare*Math.PI)*(1-pickup);
 const inspectionApproach:V3=[mix(.35,-.22,compare)-.10*reachBend,mix(-.90,-.42,compare)+.08*reachBend,mix(1.10,1.28,compare)];
 const gripTurn=pickup*(1-.25*release);
 const workingApproach:V3=inspectionApproach.map((v,i)=>mix(v,[-1.05,-.18,.20][i],gripTurn)) as V3;
 const windowOrientation=compare*(1-pickup);
 const workingNormal=new THREE.Vector3(0,Math.cos(noticeTilt)*(1-windowOrientation),mix(Math.sin(noticeTilt),1,windowOrientation)).normalize().toArray() as V3;
 const forearmFlex=.65*reachBend+.45*Math.sin(pickup*Math.PI)+.16*Math.sin(present*Math.PI);
 const officerTorso:V3=[-1.04-.035*compare,.025-.025*compare,.12-.12*compare+.08*present];
 const ownerTorso:V3=[.98-.065*receive+.025*pull,.015-.025*receive,.12+.065*receive];
 const officerYaw=.22-.27*compare+.34*pickup,officerLean=.035+.055*compare-.025*present;
 const ownerYaw=-.34-.20*receive,ownerLean=.025+.06*receive;
 const shoulder=(p:V3,yaw:number,lean:number,x:number):V3=>new THREE.Vector3(x,.48,0).applyEuler(new THREE.Euler(lean,yaw,0)).add(new THREE.Vector3(...p)).toArray() as V3;
 const holdShoulder=shoulder(officerTorso,officerYaw,officerLean,-.28),workShoulder=shoulder(officerTorso,officerYaw,officerLean,.28),receiveShoulder=shoulder(ownerTorso,ownerYaw,ownerLean,-.28);
 const heldContact=world(-.74,.025,.25),holdApproach:V3=[-.5,-.85,.3],receiverApproach:V3=[1.05,-.18,.20];
 const wrist=(contact:V3,approach:V3)=>contact.map((v,i)=>v+approach[i]*.31) as V3;
 const holdElbow=encounterElbow(holdShoulder,wrist(heldContact,holdApproach),.05+.12*a);
 const workElbow=encounterElbow(workShoulder,wrist(officerContact,workingApproach),.25*compare-.12*pickup);
 const receiveElbow=encounterElbow(receiveShoulder,wrist(ownerContact,receiverApproach),.15*receive);
 const restingShoulder=shoulder(ownerTorso,ownerYaw,ownerLean,.28);
 const restingContact:V3=[ownerTorso[0]+.34,ownerTorso[1]-.37,ownerTorso[2]+.10];
 const restingApproach:V3=[.08,.85,.04];
 const restingElbow:V3=[restingShoulder[0]+.08,ownerTorso[1]+.02,restingShoulder[2]+.02];



 return <>
 <Box p={[0,-2.1,0]} s={[12,.13,12]} c="#75795f"/>
 {/* A continuous masonry foundation supports the raised house platform down to the lawn. */}
 <Box p={[0,-1.271,-1.75]} s={[3.58,1.528,2.67]} c="#a18d74"/>
 {Array.from({length:8},(_,row)=><group key={row}>
  <Box p={[0,-1.95+row*.19,-.407]} s={[3.57,.014,.012]} c="#867760"/>
  {Array.from({length:8},(_,col)=><Box key={col} p={[-1.65+col*.45+(row%2)*.15,-1.865+row*.19,-.407]} s={[.013,.172,.012]} c="#867760"/>)}
 </group>)}
 <EncounterTorso p={officerTorso} yaw={officerYaw} lean={officerLean} headTurn={-.4+.35*compare+.4*pickup} shirt="#627b70" skin="#ad7e63"/>
 <EncounterTorso p={ownerTorso} yaw={ownerYaw} lean={ownerLean} headTurn={-.35-.25*receive} shirt="#83684f" skin="#b78666"/>
 <spotLight position={[2.6,4.3,3.7]} intensity={1.3} angle={.64} penumbra={.65} castShadow shadow-mapSize={[1024,1024]} shadow-bias={-.00015} shadow-normalBias={.018}/>
 <House scale={.86} p={[0,0,-1.75]}/>
 <group position={boardPos} rotation={[boardTilt,0,0]}>
  <Box p={[0,-.014,0]} s={[1.61,.045,.92]} c="#765c43" round={.035}/>
  <Box p={[-.40,.028,-.20]} s={[.23,.045,.10]} c="#a6b4a7" metal={.55} round={.012}/>
 </group>
 <group position={photoPos} rotation={[boardTilt,0,0]} scale={.27}><CapturedPrint/></group>
 <group position={noticePos} rotation={[noticeTilt,0,0]}><Paper p={[0,0,0]} scale={.38}/></group>
 <EncounterHand contact={heldContact} approach={holdApproach} cuff={holdShoulder} elbow={holdElbow} skin="#ad7e63" shirt="#627b70" closed={1} normal={[0,Math.cos(boardTilt),Math.sin(boardTilt)]}/>
 <EncounterHand contact={officerContact} approach={workingApproach} flex={forearmFlex} cuff={workShoulder} elbow={workElbow} skin="#ad7e63" shirt="#627b70" closed={smooth((pickup-.60)/.40)*(1-release)} pointing={(1-pickup)*(1-release)} normal={workingNormal}/>
 <EncounterHand contact={restingContact} approach={restingApproach} cuff={restingShoulder} elbow={restingElbow} skin="#b78666" shirt="#83684f" normal={[0,0,1]} handedness={-1}/>
 <EncounterHand contact={ownerContact} approach={receiverApproach} cuff={receiveShoulder} elbow={receiveElbow} skin="#b78666" shirt="#83684f" closed={smooth((receive-.65)/.35)} normal={[0,Math.cos(noticeTilt),Math.sin(noticeTilt)]} handedness={-1}/>
 {b>0&&[-1,1].map(sign=><React.Fragment key={sign}><Box p={[-.817+sign*.32,.54,-1.061]} s={[.025,.77*b,.014]} c={copper}/><Box p={[-.817,.54+sign*.385,-1.061]} s={[.64*b,.025,.014]} c={copper}/></React.Fragment>)}
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
const PhysicalStory:React.FC<{scene:Scene;time:number;windows:ReturnType<typeof actionWindows>}>=({scene,time,windows})=>{
 const progress=(i:number)=>scene.visual_events?.[i]?.id?actionProgress(requireAction(windows,scene.visual_events[i].id),time):0;
 const a=progress(0),b=progress(1),c=progress(2),d=progress(3),id=scene.id;
 const camera:{position:V3;target:V3;fov:number}=id==='s1'?{position:[7,6,10],target:[-.15,-.35,.15],fov:36}:
 id==='s2'?{position:[.15,4.8,5.9],target:[-.10,-.25,-.20],fov:38}:
 id==='s3'?{position:[.15,4.8,5.9],target:[-.10,-.25,-.20],fov:42}:
 id==='s4'?{position:[.15,4.8,5.9],target:[-.10,-.25,-.20],fov:42}:
 id==='s5'?{position:[1.6,1.25,5.4],target:[0,.20,-.2],fov:39}:
 id==='s6'?{position:[.28,5.2,5.3],target:[.18,-.18,-.05],fov:38}:
 id==='s7'?{position:[2.7,2.9,7.4],target:[0,-.35,.1],fov:38}:
 id==='s9'?{position:[.25,1.7,5.4],target:[-.05,0,-.60],fov:42}:
 id==='s8'?{position:[.5,5.4,5.8],target:[.10,0,.08],fov:40}:
 {position:[1.2,3.8,5.3],target:[0,-.28,-.16],fov:42};
 return <CinematicStage {...camera} exposure={1.15}>
 <directionalLight position={[3,8,2]} intensity={1.4} color="#fff1c9"/>
 <hemisphereLight intensity={.75} args={['#d4e5e0','#7a7961',.75]}/>
 {id==='s1'&&<Street a={a} b={b} drive={Math.min(1,(time-scene.start_s)/scene.duration_s)}/>}
 {id==='s2'&&<NoticeQueue a={a} b={b}/>}
 {id==='s3'&&<ReviewArrival a={a} b={b}/>}
 {id==='s4'&&<ReviewDesk a={a} b={b} c={c}/>}
 {id==='s5'&&<Notice a={a} b={b}/>}
 {id==='s6'&&<RoofComparison a={a} b={b} c={c}/>}
 {id==='s7'&&<Cleanup a={a} b={b}/>}
 {id==='s8'&&<Evidence a={a} b={b} c={c}/>}
 {id==='s9'&&<SiteInspection a={a} b={b} c={c} d={d}/>}
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
 {scene.id==='s2'&&<div style={{position:'absolute',left:70,top:410,fontFamily:FONT.mono,fontSize:25,color:cream}}>ILLUSTRATIVE NOTICE VOLUME / NBC DFW</div>}
 {['s6','s7','s8'].includes(scene.id)&&<div style={{position:'absolute',left:70,top:386,fontFamily:FONT.mono,fontSize:19,letterSpacing:1.2,color:'#eac39f'}}>SEPARATE REPORTED CASE / NBC DFW</div>}
 {scene.id==='s3'&&<div style={{position:'absolute',left:70,top:410,fontFamily:FONT.mono,fontSize:25,color:cream}}>ILLUSTRATED IMAGE HANDOFF</div>}
 {scene.id==='s6'&&<div style={{position:'absolute',left:70,top:426,fontFamily:FONT.mono,fontSize:28,color:cream}}>ILLUSTRATIVE ROOF COMPARISON</div>}
 {scene.id==='s9'&&<div style={{position:'absolute',left:70,top:386,fontFamily:FONT.mono,fontSize:24,letterSpacing:.7,color:'#e2e8d7',background:'rgba(9,32,39,.90)',padding:'8px 12px'}}>REPORTED CITY REQUIREMENT / FOX</div>}
 <GradeLayer f={frame} vignette={.09} grain={.009} bloom={.01}/><SubtitleTrack cues={captions} fps={fps}/>
 </>}
 <Sequence from={Math.round(runtime_s*fps)} durationInFrames={Math.round(credits_s*fps)}><CreditsCard text={credits}/></Sequence>
 </div>;
};
