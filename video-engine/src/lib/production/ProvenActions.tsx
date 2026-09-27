// Retained approved action geometry. Provenance and limits live in config/production_actions.json.
import React, {useEffect,useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useLoader} from '@react-three/fiber';
import {CinematicStage} from '../cinema/CinematicStage';
import {cue, mix, type V3} from '../cinema/motion';
import {GradeLayer} from '../lighting';
import {FONT} from '../type';

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

const House:React.FC<{scale?:number;p?:V3;flat?:boolean;site?:boolean}>=({scale=1,p=[0,0,-1.15],flat=false,site=false})=><group position={p} scale={scale}>
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
 {!site&&<>
 <Box p={[0,-.37,1.02]} s={[.91,.13,.65]} c="#a4a498"/>
 <Box p={[0,-.47,1.40]} s={[1.12,.08,.38]} c="#b9b3a2"/>
 </>}
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
 {!site&&<>
 <Box p={[0,-.52,0]} s={[4.15,.14,3.1]} c="#6c7658" round={.05}/>
 {[-1.45,1.40].map((x,i)=><group key={x}><Ball p={[x,-.16,.85]} s={[.36,.28,.30]} c={i?'#4d6851':'#57744c'}/><Ball p={[x+.21,-.20,.80]} s={[.21,.23,.25]} c="#687f54"/></group>)}
 <Box p={[0,-.43,1.37]} s={[.93,.04,.95]} c="#b4b2a0"/>
 </>}
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

const Truck:React.FC<{x:number;closed:number;travel:number;cameraPitch?:number;detailSide?:boolean}>=({x,closed,travel,cameraPitch=0,detailSide=false})=><group position={[x,-.04,1.6]} scale={.57}>
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
 {detailSide&&<>
  {Array.from({length:7},(_,i)=><Box key={'rib'+i} p={[-1.08+i*.47,.40,-.752]} s={[.055,1.24,.045]} c='#7d9483' round={.015} metal={.32}/>)}
  <Box p={[.22,1.17,-.775]} s={[3.3,.09,.08]} c='#adb5a1' round={.02} metal={.55}/>
  <Box p={[.3,-.30,-.776]} s={[3.30,.09,.055]} c='#9dac98' metal={.35}/>
  <Box p={[-1.98,.58,-.69]} s={[.84,.47,.036]} c='#467783' round={.04} metal={.25}/>
  <Box p={[-1.52,.08,-.708]} s={[.025,.84,.022]} c='#778a7f'/>
  <Box p={[-1.68,.13,-.728]} s={[.20,.045,.035]} c='#9eada2' round={.009} metal={.65}/>
  <Box p={[-1.95,-.51,-.78]} s={[1.08,.08,.25]} c='#8c9b91' round={.025} metal={.55}/>
  <Rod from={[-2.38,.72,-.70]} to={[-2.42,.64,-.93]} radius={.025} c='#60746d'/>
  <Box p={[-2.43,.66,-.98]} s={[.15,.23,.06]} c='#273f43' round={.025} metal={.25}/>
  <Box p={[1.52,-.10,-.794]} s={[.35,.10,.030]} c='#d5bd81'/>
  <Box p={[.6,1.11,-.80]} s={[.20,.26,.16]} c='#92a394' round={.025} metal={.6}/>
  <Rod from={[.6,1.16027584,-.78]} to={[.6,1.16027584,-.99]} radius={.035} c='#a0b0a0'/>
 </>}
 <group position={detailSide?[.6,1.16027584,-.96614853]:[.6,1.30,-.42]} rotation={[cameraPitch,Math.PI,0]} scale={detailSide?1.1:1.4}><Box p={[0,-.13,-.28]} s={[.13,.28,.12]} c="#9cae9b" metal={.6}/><Lens closed={closed}/></group>
 <Box p={[1.3,.17,.79]} s={[.64,.12,.02]} c="#a8b593"/>
 <Box p={[1.65,-.10,.79]} s={[.08,.09,.025]} c="#cf7650"/>
</group>;

const OpticalEdge:React.FC<{from:V3;to:V3;radius?:number}>=({from,to,radius=.025})=>{
 const v=new THREE.Vector3(...to).sub(new THREE.Vector3(...from));
 const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.clone().normalize());
 return <mesh position={from.map((x,i)=>(x+to[i])/2) as V3} quaternion={q}>
  <cylinderGeometry args={[radius,radius,v.length(),12]}/><meshBasicMaterial color="#ffd58a"/>
 </mesh>;
};

const OpticalPhoto:React.FC<{reveal:number}>=({reveal})=>{
 const texture=useLoader(THREE.TextureLoader,staticFile('evidence/dallas-captured-facade.png'));
 texture.colorSpace=THREE.SRGBColorSpace;
 const geometry=useMemo(()=>{
  const g=new THREE.PlaneGeometry(2.5*Math.max(.001,reveal),1.69);
  const uv=g.getAttribute('uv');
  for(let i=0;i<uv.count;i++)uv.setX(i,uv.getX(i)*reveal);
  return g;
 },[reveal]);
 return <mesh position={[-1.25*(1-reveal),0,.015]} geometry={geometry}>
  <meshBasicMaterial map={texture} side={THREE.DoubleSide}/>
 </mesh>;
};

const Street:React.FC<{a:number;b:number;c:number;d:number;drive:number}>=({a,b,c,d,drive})=>{
 const truckX=mix(.72,-1.65,drive);
 const lens:V3=[truckX+.342,.701,1.294];
 const position:V3=[mix(0,1.1,c),mix(.65,1.55,c)+.35*Math.sin(Math.PI*c),mix(-.53,2.2,c)];
 const rotation:V3=[-.38*d,.52*d,0];
 const scale=mix(1,1.05,c);
 const matrix=new THREE.Matrix4().compose(new THREE.Vector3(...position),
  new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),new THREE.Vector3(scale,scale,scale));
 const corners:V3[]=[[-1.25,-.845,0],[1.25,-.845,0],[1.25,.845,0],[-1.25,.845,0]].map(p=>{
  const v=new THREE.Vector3(...p).applyMatrix4(matrix);return [v.x,v.y,v.z] as V3;
 });
 return <>
 <Box p={[0,-.65,0]} s={[15,.15,12]} c="#5d685d"/>
 <Box p={[0,-.51,1.47]} s={[15,.08,2.7]} c="#515f61"/>
 <Box p={[0,-.42,.03]} s={[15,.18,.14]} c="#b6b5a3"/>
 <Box p={[0,-.47,.21]} s={[15,.04,.25]} c="#858d81"/>
 <House scale={.76} p={[0,0,-1.20]}/>
 {a>0&&corners.map((corner,i)=>{
  const tip=lens.map((v,j)=>mix(v,corner[j],a)) as V3;
  return <React.Fragment key={i}>
   <OpticalEdge from={lens} to={tip} radius={.024}/>
   {a>.55&&<OpticalEdge from={corner} to={corners[(i+1)%4]} radius={.033}/>}
  </React.Fragment>;
 })}
 {b>0&&<group position={position} rotation={rotation} scale={scale}><OpticalPhoto reveal={b}/></group>}
 <Truck x={truckX} closed={Math.sin(a*Math.PI)**12} travel={drive*2}/>
 </>;
};

const roofDiagramSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="480" viewBox="300 250 250 230"><rect width="600" height="480" fill="#e8dfc6"/><path d="M35 48H550V303H35Z" fill="#456258"/><path d="M45 95H540M45 150H540M45 205H540M145 48V300M350 48V300" fill="none" stroke="#718579" stroke-width="4"/><path d="M35 300H550V414H35Z" fill="#967458"/><path d="M35 320H550M35 353H550M35 386H550M135 320V353M380 320V353M245 353V386M470 353V386" fill="none" stroke="#bc9c76" stroke-width="4"/><path d="M35 350H455V408L480 437L450 467L405 424V416H35Z" fill="#e2e8d8" stroke="#173d36" stroke-width="9"/><path d="M45 361H442V417L466 440" fill="none" stroke="#f7f3d5" stroke-width="5"/><path d="M45 338H435" stroke="#243c36" stroke-width="8"/><path d="M340 320H505V473H340Z" fill="none" stroke="#ca8759" stroke-width="8" stroke-dasharray="15 8"/></svg>';

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

const Table:React.FC<{home?:boolean;rightExtension?:number}>=({home=false,rightExtension=0})=><>
 <Box p={[rightExtension/2,-.11,0]} s={[5+rightExtension,.19,4]} c={home?'#857357':'#586c6a'} round={.055}/>
 {Array.from({length:6+Math.floor(rightExtension/.65)},(_,i)=><Box key={i} p={[-2.25+i*.85,-.011,0]} s={[.016,.003,3.90]} c={home?'#665c47':'#607772'}/>)}
 {home?<><Box p={[-1.98,.82,-2.0]} s={[1.90,2.1,.12]} c="#c8bda1"/><Box p={[2.51,.82,-2.0]} s={[.95,2.1,.12]} c="#c8bda1"/><Box p={[.54,-.01,-2.0]} s={[3.4,.38,.12]} c="#c8bda1"/><Box p={[.54,1.82,-2.0]} s={[3.4,.26,.12]} c="#c8bda1"/><House flat scale={.73} p={[.45,.12,-3.3]}/></>:<Box p={[rightExtension/2,.82,-2.0]} s={[6+rightExtension,2.1,.12]} c="#8caaa4"/>}
 {home&&<group position={[.74,1.02,-1.88]}>
  {[-.86,.86].map(x=><Box key={x} p={[x,0,0]} s={[.075,1.32,.08]} c={cream}/>)}
  <Box p={[0,-.24,.055]} s={[1.53,.055,.015]} c="#c1c5b3" metal={.4}/>
  <Box p={[0,0,.062]} s={[.055,1.23,.035]} c={cream}/>
 </group>}
</>;

type SurfaceKind='asphalt'|'concrete'|'cardboard'|'bark';
const SurfaceMaterial:React.FC<{kind:SurfaceKind;color:string}>=({kind,color})=>{
 const texture=useMemo(()=>{
  const size=256,data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const hash=Math.sin(x*127.1+y*311.7)*43758.5453,noise=hash-Math.floor(hash);
   const grain=kind==='bark'?Math.sin(x*.55+Math.sin(y*.043)*2)*.20:
    kind==='cardboard'?Math.sin(x*1.2)*.07+Math.sin(y*.19)*.025:0;
   const value=Math.max(0,Math.min(255,170+noise*70+grain*160));
   const i=(y*size+x)*4;data[i]=data[i+1]=data[i+2]=value;data[i+3]=255;
  }
  const t=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);
  t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(kind==='asphalt'?18:kind==='concrete'?8:kind==='bark'?2:3,kind==='bark'?1:kind==='asphalt'?12:3);
  t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;return t;
 },[kind]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 return <meshStandardMaterial color={color} map={texture} bumpMap={texture} bumpScale={kind==='bark'?.015:kind==='asphalt'?.025:.008} roughness={kind==='cardboard'?.92:.96}/>;
};

const SurfaceBox:React.FC<{p:V3;s:V3;c:string;kind:SurfaceKind;r?:V3}>=({p,s,c,kind,r=[0,0,0]})=><mesh position={p} rotation={r} castShadow receiveShadow><boxGeometry args={s}/><SurfaceMaterial kind={kind} color={c}/></mesh>;

const BarkBranch:React.FC<{from:V3;to:V3;radius:number;c:string}>=({from,to,radius,c})=>{
 const delta=new THREE.Vector3(...to).sub(new THREE.Vector3(...from)),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize());
 return <group position={from.map((v,i)=>(v+to[i])/2) as V3} quaternion={q}>
  <mesh castShadow receiveShadow><cylinderGeometry args={[radius*.58,radius,delta.length(),24,5]}/><SurfaceMaterial kind='bark' color={c}/></mesh>
  <mesh position={[0,delta.length()/2+.001,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[radius*.58,24]}/><meshStandardMaterial color='#bd9968' roughness={.93}/></mesh>
 </group>;
};

const FoldedLeaf:React.FC<{c:string}>=({c})=>{
 const geometry=useMemo(()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([-.10,0,0,0,.018,-.045,.13,0,0,-.10,0,0,.13,0,0,0,.018,.045],3));g.computeVertexNormals();return g;},[]);
 return <group><mesh geometry={geometry} castShadow><meshStandardMaterial color={c} side={THREE.DoubleSide} roughness={.9}/></mesh><Rod from={[-.09,.004,0]} to={[.12,.005,0]} radius={.0025} c='#b4a37a'/></group>;
};

const SelectionStroke:React.FC<{from:V3;to:V3;radius:number}>=({from,to,radius})=>{
 const delta=new THREE.Vector3(...to).sub(new THREE.Vector3(...from));
 const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize());
 return <mesh position={from.map((v,i)=>(v+to[i])/2) as V3} quaternion={q}>
  <cylinderGeometry args={[radius,radius,delta.length(),16]}/>
  <meshBasicMaterial color='#d99139' transparent opacity={.52} depthWrite={false}/>
 </mesh>;
};

const DebrisPile:React.FC<{analysis?:number}>=({analysis=0})=> <group position={[0,-.42,-.58]}>
 {analysis>0&&[[-.46,.12],[-.44,-.43],[-.12,-.54],[.24,-.54],[.46,-.36],[.46,0],[.40,.33],[.02,.37],[-.40,.37]].map((p,i,points)=>{
  const end=points[(i+1)%points.length],q=Math.max(0,Math.min(1,analysis*points.length-i));
  return q>0?<OpticalEdge key={'region'+i} from={[p[0],.025,p[1]]} to={[mix(p[0],end[0],q),.025,mix(p[1],end[1],q)]} radius={.018}/>:null;
 })}
 <group position={[.19,.31,-.20]} rotation={[0,0,0]}>
  <SurfaceBox p={[0,-.30,0]} s={[.46,.02,.48]} c='#8a623d' kind='cardboard'/>
  {[-1,1].map(side=><React.Fragment key={side}>
   <SurfaceBox p={[side*.222,0,0]} s={[.016,.62,.48]} c='#a47749' kind='cardboard'/>
   <SurfaceBox p={[0,0,side*.232]} s={[.46,.62,.016]} c='#a47749' kind='cardboard'/>
  </React.Fragment>)}
  <SurfaceBox p={[-.29,.36,0]} s={[.16,.016,.46]} c='#b18a5b' r={[0,0,-.52]} kind='cardboard'/>
  <SurfaceBox p={[.29,.34,0]} s={[.16,.016,.46]} c='#b18a5b' r={[0,0,.45]} kind='cardboard'/>
  <Box p={[0,.0,.245]} s={[.038,.58,.007]} c='#c49d65'/>
  {Array.from({length:20},(_,i)=><Box key={'corrugation'+i} p={[-.217+i*.023,.312,.24]} s={[.008,.009,.006]} c='#684d30'/>)}
  <Box p={[.21,0,.246]} s={[.009,.59,.003]} c='#694a2e'/>
  <Box p={[0,-.09,.246]} s={[.44,.004,.003]} c='#8a653f' r={[0,0,.06]}/>
  {analysis>0&&[[-.23,-.31,-.24],[.23,-.31,-.24],[.23,-.31,.24],[-.23,-.31,.24]].map((p,i)=>{
   const a=p as V3,b:[number,number,number]=[p[0],.31,p[2]],q=Math.min(1,analysis*2);
   return <React.Fragment key={'box-analysis'+i}>
    <OpticalEdge from={a} to={a.map((v,j)=>mix(v,b[j],q)) as V3} radius={.019}/>
    <OpticalEdge from={b} to={[mix(b[0],i===0||i===3?.23:-.23,q),.31,b[2]]} radius={.019}/>
   </React.Fragment>;
  })}
 </group>
 {[
  {a:[-.36,.056,.30],b:[.27,.657,.065],r:.075},
  {a:[-.30,.0364,.35],b:[.0,.651,.065],r:.065},
  {a:[-.40,.055,-.38],b:[-.12,.055,.26],r:.055},
 ].map((branch,i)=>{
  const a=branch.a as V3,b=branch.b as V3;
  const join=a.map((v,j)=>mix(v,b[j],.57)) as V3;
  return <group key={i}>
   <BarkBranch from={a} to={b} radius={branch.r} c={i%2?'#594633':'#6b4e31'}/>
   <BarkBranch from={join} to={[join[0]-.10,join[1]+.14,join[2]-.08]} radius={branch.r*.53} c='#655035'/>
   {analysis>0&&<SelectionStroke from={a} to={a.map((v,j)=>mix(v,b[j],Math.max(0,Math.min(1,analysis*1.5-i*.16)))) as V3} radius={branch.r+.007}/>}
   {[-1,1].map((side,j)=><group key={side} position={[join[0]-.10+side*.055,join[1]+.16,join[2]-.08+j*.06]} rotation={[.3,side*.6,.4]}>
    <FoldedLeaf c={i%2?'#4e633c':'#778051'}/>
   </group>)}
  </group>;
 })}
 </group>;

const DebrisGround:React.FC<{selection?:number}>=({selection=0})=>{
 const selected=(color:string)=>new THREE.Color(color).lerp(new THREE.Color('#273b3e'),selection*.65).getStyle();
 return <>
 <SurfaceBox p={[0,-.58,.5]} s={[15,.16,9]} c={selected('#424b4e')} kind='asphalt'/>
 <SurfaceBox p={[0,-.46,-.75]} s={[15,.08,1.28]} c={selected('#a29984')} kind='concrete'/>
 <Box p={[0,-.43,.02]} s={[15,.14,.16]} c='#c0b69c' round={.012}/>
 <Box p={[0,-.49,.16]} s={[15,.025,.23]} c='#818978'/>
 <Box p={[0,-.47,-2.1]} s={[15,.10,1.42]} c={selected('#697650')}/>
 {[-2.6,2.0].map(x=><Box key={x} p={[x,-.405,-.72]} s={[.018,.005,1.20]} c='#858776'/>)}
</>;
};

const DebrisCapture:React.FC<{elapsed:number;captureAt:number}>=({elapsed,captureAt})=> <>
 <DebrisGround/><DebrisPile/>
 <Truck x={.39-.35*elapsed} closed={Math.exp(-(((elapsed-captureAt)/.07)**2))} travel={.35*elapsed/1.197} cameraPitch={-.47143755} detailSide/>
</>;

const CapturedDebrisAnalysis:React.FC<{scan:number;selection:number}>=({scan,selection})=><>
 <CinematicStage position={[.02325,.60,1.0074]} target={[.02325,-.25,-.66]} fov={84} exposure={.98}>
  <directionalLight position={[-3,6,4]} intensity={2.2} color='#ffe3b5'/>
  <hemisphereLight args={['#b7d1da','#544b39',.38]}/>
  <DebrisGround selection={selection}/><DebrisPile analysis={selection}/>
 </CinematicStage>
 {scan>0&&scan<1&&<div style={{position:'absolute',left:mix(20,1040,scan),top:470,width:12,height:730,background:'#d4e6ba',boxShadow:'0 0 22px #dcf5be',opacity:.65}}/>}
 <div style={{position:'absolute',left:70,top:380,padding:'10px 16px',fontFamily:FONT.mono,fontSize:30,lineHeight:1.2,color:cream,background:'#17323de8'}}>CAPTURED IMAGE / ILLUSTRATION</div>
 {selection>=1&&<div style={{position:'absolute',left:70,top:545,padding:'9px 20px',fontFamily:FONT.mono,fontWeight:700,fontSize:58,lineHeight:1,color:'#f1c276',background:'#102b31',border:'3px solid #f1c276'}}>DEBRIS</div>}
</>;

const NoticeQueue:React.FC<{a:number;b:number;c:number}>=({a,b,c})=><>
 <Table rightExtension={1.3}/>
 {[0,1,2,3,4,5].map(i=><Paper key={i} p={[i%2*.035,.012+i*.020,-.20]} scale={1.35}/>)}
 <group position={[0,mix(.64,.14,a),-.20]}>
  {[0,1,2,3].map(i=><Paper key={i} p={[i*.012,i*.025,0]} scale={1.35}/>)}
 </group>
 {b>0&&<group position={[.035,mix(3.5,.241,b),-.20]}>
  {[0,1,2].map(i=><Paper key={i} p={[i*.012,i*.025,0]} scale={1.35}/>)}
  <Paper p={[0,.075,c*.26]} scale={1.35}/>
 </group>}
</>;

export {Street as StreetCapture, NoticeQueue as DocumentAccumulation, DebrisCapture as CurbCapture, CapturedDebrisAnalysis as ConditionSelection};
