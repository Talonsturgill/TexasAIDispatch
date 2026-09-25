import React, {useEffect, useMemo} from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {CinematicStage} from './lib/cinema/CinematicStage';
import {actionProgress, actionWindows, requireAction} from './lib/direction';
import {mix, type V3} from './lib/cinema/motion';
import {CreditsCard, SubtitleTrack, type DispatchProps, type Scene} from './Dispatch';
import {FONT} from './lib/type';

const INK = '#07191c';
const TEAL = '#86d2c9';
const PAPER = '#e8dfca';
const COPPER = '#c88e56';
const clamp = (v:number) => Math.max(0,Math.min(1,v));

const makeChartTexture=()=>{
  const canvas=document.createElement('canvas');
  canvas.width=720; canvas.height=960;
  const ctx=canvas.getContext('2d');
  if(!ctx) throw new Error('Clinical chart canvas is unavailable');
  const fill=(x:number,y:number,w:number,h:number,color:string)=>{
    ctx.fillStyle=color;ctx.fillRect(x,y,w,h);
  };
  const label=(text:string,x:number,y:number,size:number,color:string)=>{
    ctx.font=`600 ${size}px Arial, sans-serif`;ctx.fillStyle=color;ctx.fillText(text,x,y);
  };
  fill(0,0,720,960,'#12353b');
  fill(0,0,720,100,'#17484c');
  label('CLINICAL RECORD',44,60,35,'#e8dfca');
  label('CHART',44,92,16,'#86d2c9');
  label('ASK EVIDENCE',207,92,16,'#e8dfca');
  label('CITATIONS',448,92,16,'#86d2c9');
  fill(44,126,632,3,'#457b78');
  label('QUESTION IN THE RECORD',44,182,22,'#86d2c9');
  fill(44,208,632,150,'#0b2b31');
  label('CLINICAL QUESTION',66,245,19,'#c6dfd6');
  fill(66,269,535,10,'#557d7b');fill(66,300,412,10,'#557d7b');
  fill(44,392,632,3,'#457b78');
  label('AI ANSWER / CITED',44,445,23,'#c88e56');
  fill(44,470,632,236,'#1c555a');
  label('EVIDENCE SUMMARY',67,507,19,'#e8dfca');
  fill(67,530,562,11,'#a0c7bd');fill(67,559,496,11,'#a0c7bd');
  fill(67,581,532,11,'#a0c7bd');fill(67,618,414,11,'#a0c7bd');
  fill(44,735,632,3,'#457b78');
  label('CITED SOURCES',44,787,23,'#86d2c9');
  fill(44,807,300,86,'#255e62');
  fill(365,807,311,86,'#255e62');
  label('LITERATURE',61,856,21,'#e8dfca');
  label('GUIDELINES',382,856,21,'#e8dfca');
  fill(44,923,200,6,'#c88e56');
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=8;
  return texture;
};

const makeStationTexture=(index:number)=>{
  const canvas=document.createElement('canvas');
  canvas.width=360; canvas.height=580;
  const ctx=canvas.getContext('2d');
  if(!ctx) throw new Error('Clinic station canvas is unavailable');
  const headings=['CHART VIEW','ASK EVIDENCE','CITED SOURCE'];
  ctx.fillStyle='#113a40';ctx.fillRect(0,0,360,580);
  ctx.fillStyle='#1a565a';ctx.fillRect(0,0,360,80);
  ctx.font='bold 26px Arial, sans-serif';ctx.fillStyle='#e8dfca';
  ctx.fillText(headings[index],23,49);
  ctx.fillStyle='#86d2c9';ctx.fillRect(24,109,140,6);
  ctx.fillStyle='#0b2b31';ctx.fillRect(22,138,316,150);
  ctx.font='bold 18px Arial, sans-serif';ctx.fillStyle='#a7cbc2';
  ctx.fillText(index===0?'QUESTION IN CHART':index===1?'GUIDELINE QUERY':'SOURCE DETAIL',37,170);
  for(let i=0;i<3;i++){
    ctx.fillStyle='#769d96';ctx.fillRect(37,192+i*27,250-i*24,7);
  }
  ctx.fillStyle='#c88e56';ctx.fillRect(22,325,316,6);
  ctx.fillStyle='#255e62';ctx.fillRect(22,356,316,150);
  ctx.font='bold 18px Arial, sans-serif';ctx.fillStyle='#e8dfca';
  ctx.fillText(index===2?'LITERATURE / GUIDELINES':'ANSWER WITH CITATIONS',37,389);
  for(let i=0;i<3;i++){
    ctx.fillStyle='#a7cbc2';ctx.fillRect(37,412+i*29,250-i*31,7);
  }
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=8;
  return texture;
};

const StationMonitor:React.FC<{index:number;lit:number}>=({index,lit})=>{
  const texture=useMemo(()=>makeStationTexture(index),[index]);
  useEffect(()=>()=>texture.dispose(),[texture]);
  return <>
    <mesh castShadow><boxGeometry args={[.86,1.35,.17]}/>
      <meshStandardMaterial color="#193b3f" metalness={.54} roughness={.4}/></mesh>
    <mesh position={[0,.07,.1]}><planeGeometry args={[.72,1.12]}/>
      <meshBasicMaterial map={texture} color={new THREE.Color().setScalar(.35+lit*.65)} toneMapped={false}/></mesh>
    <mesh position={[0,-.57,.11]}><boxGeometry args={[.5,.025,.01]}/>
      <meshBasicMaterial color={TEAL}/></mesh>
  </>;
};

const makeSourceTexture=()=>{
  const canvas=document.createElement('canvas');
  canvas.width=420;canvas.height=560;
  const ctx=canvas.getContext('2d');
  if(!ctx) throw new Error('Source leaf canvas is unavailable');
  ctx.fillStyle='#ece7d9';ctx.fillRect(0,0,420,560);
  ctx.fillStyle='#1f716d';ctx.fillRect(24,28,372,66);
  ctx.font='bold 32px Arial, sans-serif';ctx.fillStyle='#f4f0e5';
  ctx.fillText('CITED SOURCE',41,72);
  ctx.fillStyle='#bb8753';ctx.fillRect(34,128,150,7);
  ctx.font='bold 23px Arial, sans-serif';ctx.fillStyle='#245d5a';
  ctx.fillText('LITERATURE / GUIDELINE',34,178);
  for(let i=0;i<5;i++){
    ctx.fillStyle='#73928a';ctx.fillRect(36,225+i*44,320-(i%3)*33,8);
  }
  ctx.fillStyle='#c88e56';ctx.fillRect(34,495,352,11);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=8;
  return texture;
};

const makeLimitTexture=(kind:'use'|'test')=>{
  const canvas=document.createElement('canvas');
  canvas.width=600;canvas.height=900;
  const ctx=canvas.getContext('2d');
  if(!ctx) throw new Error('Evidence comparison canvas is unavailable');
  ctx.fillStyle='#15363b';ctx.fillRect(0,0,600,900);
  ctx.fillStyle='#22605f';ctx.fillRect(30,45,540,110);
  ctx.font='bold 39px Arial, sans-serif';ctx.fillStyle='#e8dfca';
  ctx.fillText(kind==='use'?'REPORTED USE':'ANSWER ACCURACY',52,111);
  ctx.fillStyle='#85c9bb';ctx.fillRect(50,220,500,4);
  ctx.font='bold 79px Arial, sans-serif';ctx.fillStyle=kind==='use'?'#e0a36b':'#e8dfca';
  ctx.fillText(kind==='use'?'> HALF':'NO TEST',55,365);
  ctx.font='bold 29px Arial, sans-serif';ctx.fillStyle='#b2d2c9';
  ctx.fillText(kind==='use'?'OF CLINICIANS':'IN THE RELEASE',57,425);
  if(kind==='use'){
    ctx.fillStyle='#376766';ctx.fillRect(52,530,496,44);
    ctx.fillStyle='#c88e56';ctx.fillRect(52,530,272,44);
    ctx.fillStyle='#e8dfca';ctx.fillRect(300,513,4,78);
    ctx.font='bold 23px Arial, sans-serif';ctx.fillText('UTMB SELF REPORT',52,690);
    ctx.fillText('NO COUNT SUPPLIED',52,730);
  } else {
    ctx.strokeStyle='#658d86';ctx.lineWidth=5;
    ctx.strokeRect(52,515,496,168);
    ctx.font='bold 25px Arial, sans-serif';ctx.fillStyle='#91b9ad';
    ctx.fillText('ACCURACY RESULT',75,567);
    ctx.fillText('—',75,640);
    ctx.font='bold 23px Arial, sans-serif';ctx.fillText('EVIDENCE GAP',52,766);
  }
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=8;
  return texture;
};

const LimitPanel:React.FC<{kind:'use'|'test'}>=({kind})=>{
  const texture=useMemo(()=>makeLimitTexture(kind),[kind]);
  useEffect(()=>()=>texture.dispose(),[texture]);
  return <group>
    <mesh castShadow receiveShadow><boxGeometry args={[2.18,3.28,.17]}/>
      <meshStandardMaterial color="#587674" metalness={.55} roughness={.4}/></mesh>
    <mesh position={[0,0,.092]}><planeGeometry args={[2.04,3.12]}/>
      <meshBasicMaterial map={texture} toneMapped={false}/></mesh>
  </group>;
};

// A physical chart, source leaf, and clinician gesture make the board's evidence
// path visible. The room and hand are illustrations; no clinical encounter is shown.
const ChartFrame:React.FC<{active?:number;compact?:boolean;sourceReveal?:number}>=({active=0,compact=false,sourceReveal=0})=>{
  const texture=useMemo(makeChartTexture,[]);
  useEffect(()=>()=>texture.dispose(),[texture]);
  return <group scale={compact?.72:1}>
    <mesh castShadow receiveShadow><boxGeometry args={[2.64,3.55,.16]}/>
      <meshStandardMaterial color="#17383d" metalness={.65} roughness={.3}/></mesh>
    <mesh position={[0,0,.094]}><planeGeometry args={[2.44,3.26]}/>
      <meshBasicMaterial map={texture} toneMapped={false}/></mesh>
    <mesh position={[.7,-1.08,.102]}><boxGeometry args={[.34,.045,.012]}/>
      <meshBasicMaterial color={COPPER} transparent opacity={.35+active*.65}/></mesh>
    {sourceReveal>.01&&<group position={[-.69,-1.32,.14]}>
      <mesh scale={[Math.max(.01,sourceReveal),1,1]}>
        <boxGeometry args={[1.08,.34,.06]}/>
        <meshStandardMaterial color="#286d67" emissive="#5fb8a8"
          emissiveIntensity={.2+sourceReveal*.65} roughness={.4}/>
      </mesh>
      <mesh position={[mix(-.48,.3,sourceReveal),0,.04]}>
        <boxGeometry args={[.1,.07,.02]}/><meshBasicMaterial color={PAPER}/>
      </mesh>
    </group>}
  </group>;
};

const SourceLeaf:React.FC<{open:number;reveal?:number;small?:boolean}>=({open,reveal=0,small=false})=>{
  const texture=useMemo(makeSourceTexture,[]);
  useEffect(()=>()=>texture.dispose(),[texture]);
  return <group scale={small?.7:1} rotation={[0,-.28*(1-open),0]}>
    <mesh castShadow receiveShadow><boxGeometry args={[1.18,1.48,.055]}/>
      <meshStandardMaterial color={COPPER} metalness={.62} roughness={.33}/></mesh>
    <mesh position={[0,0,.036]}><planeGeometry args={[1.1,1.39]}/>
      <meshBasicMaterial map={texture} toneMapped={false}/></mesh>
    <group position={[mix(0,.62,reveal),mix(0,.37,reveal),-.035]} rotation={[0,mix(0,-.32,reveal),0]}>
      <mesh castShadow><boxGeometry args={[.74,1.04,.025]}/>
        <meshStandardMaterial color="#ede8d9" roughness={.82}/></mesh>
      <mesh position={[0,.31,.018]}><boxGeometry args={[.52,.035,.005]}/>
        <meshBasicMaterial color="#298881"/></mesh>
      {[0,1,2,3].map(i=><mesh key={i} position={[-.04,.15-i*.16,.018]}>
        <boxGeometry args={[.48-i*.04,.015,.005]}/><meshBasicMaterial color="#748e86"/>
      </mesh>)}
    </group>
  </group>;
};

const ClinicianHand:React.FC<{touch:number}>=({touch})=>
  <group position={[mix(-1.55,.25,touch),mix(-1.75,-1.65,touch),.72]} rotation={[0,0,-.35]}>
    <mesh castShadow rotation={[0,0,-.3]}><capsuleGeometry args={[.16,.85,8,12]}/>
      <meshStandardMaterial color="#a56e58" roughness={.85}/></mesh>
    <mesh position={[.13,.45,.04]} rotation={[0,0,.38]} castShadow>
      <capsuleGeometry args={[.075,.38,6,10]}/><meshStandardMaterial color="#b47c64" roughness={.85}/>
    </mesh>
    <mesh position={[-.2,-.53,-.03]}><boxGeometry args={[.56,.42,.31]}/>
      <meshStandardMaterial color="#d8ded5" roughness={.83}/></mesh>
  </group>;

const ClinicalStage:React.FC<{scene:Scene; progress:(name:string)=>number}>=({scene,progress})=>{
  const s=scene.id;
  const first=scene.visual_events?.[0]?.id;
  const second=scene.visual_events?.[1]?.id;
  const p=first?progress(first):0;
  const q=second?progress(second):0;
  const r=scene.visual_events?.[2]?.id?progress(scene.visual_events[2].id!):0;
  const u=scene.visual_events?.[3]?.id?progress(scene.visual_events[3].id!):0;
  const heroTrack=clamp(q*.45+r*.55);
  const camera:V3 = s==='s2'?[.8,.32,7.8]:s==='s3'?[-.45,.1,7.2]:s==='s4'?[.6,.1,7.8]:s==='s5'?[0,1.1,8.5]:
    s==='s6'?[0,.18,8.2]:s==='s7'?[.85,.25,7.1]:
    [mix(1.25,1.56,heroTrack),mix(.65,.4,heroTrack),mix(6.3,6.55,heroTrack)];
  const target:V3 = [0,0,0];
  return <CinematicStage position={camera} target={target}>
    <mesh position={[0,0,-1.35]} receiveShadow><boxGeometry args={[5,6,.06]}/>
      <meshStandardMaterial color="#0e2c30" metalness={.35} roughness={.64}/></mesh>
    <mesh position={[0,-2.18,-.05]} rotation={[-.22,0,0]} receiveShadow>
      <boxGeometry args={[5,.18,3]}/><meshStandardMaterial color="#254448" metalness={.38} roughness={.52}/>
    </mesh>
    {s==='s1'&&<>
      <group position={[-.4,.12,-.45]} rotation={[0,-.22,0]} scale={.87}>
        <ChartFrame active={p} sourceReveal={r}/>
        <mesh position={[0,-2.04,-.17]} castShadow>
          <boxGeometry args={[.2,.68,.22]}/>
          <meshStandardMaterial color="#637977" metalness={.65} roughness={.35}/>
        </mesh>
        <mesh position={[0,-2.38,-.05]} castShadow>
          <boxGeometry args={[1.1,.055,.65]}/>
          <meshStandardMaterial color="#526765" metalness={.6} roughness={.4}/>
        </mesh>
      </group>
      <group position={[-.25,-2.13,.65]} rotation={[-.25,0,0]}>
        <mesh castShadow><boxGeometry args={[2.05,.055,.68]}/>
          <meshStandardMaterial color="#536c69" metalness={.48} roughness={.52}/>
        </mesh>
        {[0,1,2,3].map(i=><mesh key={i} position={[-.71+i*.46,.04,.02]}>
          <boxGeometry args={[.34,.018,.38]}/><meshBasicMaterial color="#274443"/>
        </mesh>)}
      </group>
      <group position={[mix(2.2,.62,p),mix(-.72,-.7,p),.44]}>
        <SourceLeaf open={q} reveal={r} small/>
      </group>
      {[0,1].map(i=><group key={i} visible={u>.01}
        position={[mix(.62,i===0?-.24:1.42,u),mix(-.7,i===0?-.15:-.24,u),.77+i*.02]}
        rotation={[0,0,mix(0,i===0?-.13:.12,u)]}>
        <mesh castShadow><boxGeometry args={[.72,.54,.028]}/>
          <meshStandardMaterial color={i===0?'#e5dac4':'#c6ddd4'} roughness={.74}/></mesh>
        <mesh position={[-.05,.14,.018]}><boxGeometry args={[.5,.045,.005]}/>
          <meshBasicMaterial color={i===0?COPPER:TEAL}/></mesh>
        <mesh position={[-.06,-.02,.018]}><boxGeometry args={[.48,.017,.004]}/>
          <meshBasicMaterial color="#628d87"/></mesh>
        <mesh position={[-.09,-.12,.018]}><boxGeometry args={[.39,.017,.004]}/>
          <meshBasicMaterial color="#628d87"/></mesh>
      </group>)}
      <ClinicianHand touch={q}/>
    </>}
    {s==='s2'&&<>
      <group position={[.27,mix(1.7,-.1,p),-.28]} rotation={[0,mix(-.38,.1,p),0]}>
        <ChartFrame compact/>
      </group>
      <group position={[mix(-1.9,-.62,q),.1,.12]} rotation={[0,-.2,0]}>
        <SourceLeaf open={q} small/>
      </group>
      <group position={[.89,-1.28,.3]}><SourceLeaf open={1} small/></group>
    </>}
    {s==='s3'&&<>
      <group position={[.1,0,-.2]} rotation={[0,.08,0]}><ChartFrame active={q}/></group>
      <mesh position={[mix(-1.8,-.83,p),mix(.78,.6,p),.32]} castShadow>
        <boxGeometry args={[.5,.36,.1]}/><meshStandardMaterial color={COPPER} metalness={.7} roughness={.27}/>
      </mesh>
      <group position={[mix(-1.8,.38,q),mix(-1.2,-.85,q),.42]}><SourceLeaf open={q} small/></group>
      <ClinicianHand touch={q*.7}/>
    </>}
    {s==='s4'&&<>
      <group position={[-.5,0,-.4]} rotation={[0,-.17,0]}><ChartFrame active={p}/></group>
      {[0,1,2].map(i=><group key={i}
        position={[mix(1.85,.38+i*.34,p),mix(-1.4,.18-i*.58,p),.12+i*.16]}>
        <SourceLeaf open={i===1?q:p} reveal={i===1?q:0} small/>
      </group>)}
      <ClinicianHand touch={q}/>
    </>}
    {s==='s5'&&<>
      {[-1.1,0,1.1].map((x,i)=>{
        const lit=clamp(p*2.3-i*.54);
        return <group key={i} position={[x,mix(-.62,.05,lit),-.2-i*.18]}>
          <StationMonitor index={i} lit={lit}/>
      </group>})}
      <group position={[1.06,mix(-1.8,-1.28,q),.5]}><SourceLeaf open={1} small/></group>
    </>}
    {s==='s6'&&<>
      <group position={[mix(-1.65,-.86,p),.02,-.32]} rotation={[0,-.16,0]} scale={.67}>
        <LimitPanel kind="use"/>
      </group>
      <group position={[.86,.02,-.42]} rotation={[0,.14,0]} scale={.67}>
        <LimitPanel kind="test"/>
      </group>
      <group position={[mix(-.5,.17,p),mix(-1.72,-1.31,p),.55]} rotation={[0,0,mix(-.13,.08,p)]}>
        <SourceLeaf open={1} small/>
      </group>
      <mesh position={[.05,-1.86,.08]} scale={[Math.max(.02,q),1,1]}>
        <boxGeometry args={[1.25,.045,.04]}/><meshBasicMaterial color={COPPER}/>
      </mesh>
    </>}
    {s==='s7'&&<>
      <group position={[-.44,.03,-.32]} rotation={[0,-.14,0]} scale={.79}>
        <ChartFrame active={p} sourceReveal={p}/>
      </group>
      <group position={[mix(1.72,.68,p),mix(-1.42,-.43,p),.42]}>
        <SourceLeaf open={p} reveal={p} small/>
      </group>
      <ClinicianHand touch={p}/>
      <mesh position={[-.05,-2.13,.42]} scale={[Math.max(.02,q),1,1]}>
        <boxGeometry args={[2.75,.06,.045]}/><meshBasicMaterial color={COPPER}/>
      </mesh>
    </>}
  </CinematicStage>;
};

const LaterPicture:React.FC<{scene:Scene; progress:(name:string)=>number}>=({scene,progress})=>{
  const a=scene.visual_events?.[0]?.id?progress(scene.visual_events[0].id!):0;
  const b=scene.visual_events?.[1]?.id?progress(scene.visual_events[1].id!):0;
  if(scene.id==='s6') return <svg width="1080" height="1920" viewBox="0 0 1080 1920"
    style={{position:'absolute',inset:0}}>
    <rect x="116" y="540" width="375" height="610" rx="24" fill="#17373a" stroke="#658f87" strokeWidth="3"/>
    <rect x="145" y="580" width="316" height="71" fill="#2c7770"/>
    <text x="161" y="627" fill={PAPER} fontSize="31" fontFamily={FONT.mono}>REPORTED USE</text>
    {[0,1,2,3].map(i=><rect key={i} x="155" y={720+i*82} width={270-i*28} height="14" fill="#89bbb0" opacity=".68"/>)}
    <rect x="380" y="1050" width="130" height="175" rx="5" fill={PAPER} stroke={COPPER} strokeWidth="11"/>
    {[0,1,2].map(i=><rect key={i} x="404" y={1090+i*37} width={84-i*11} height="7" fill="#71968e"/>)}
    <g transform={`translate(${mix(1030,716,a)} 849) rotate(${mix(-25,0,a)}) scale(${Math.abs(1-2*b)+.02} 1)`}>
      <circle r="175" fill="#113337" stroke={COPPER} strokeWidth="18"/>
      <circle r="141" fill="#123b41" stroke="#81b8ae" strokeWidth="4"/>
      <text x="-110" y="-12" fill={PAPER} fontSize="27" fontFamily={FONT.mono}>{b<.5?'ANSWER':'NO TEST'}</text>
      <text x="-110" y="35" fill={PAPER} fontSize="27" fontFamily={FONT.mono}>{b<.5?'ACCURACY':'REPORTED'}</text>
      <path d="M -73 74 H 75" stroke={COPPER} strokeWidth="3" opacity={b}/>
    </g>
    <text x="580" y="1170" fill={COPPER} fontSize="29" fontFamily={FONT.mono} opacity={b}>NO TEST IN RELEASE</text>
  </svg>;
  if(scene.id==='s7') return <svg width="1080" height="1920" viewBox="0 0 1080 1920"
    style={{position:'absolute',inset:0}}>
    <rect x="145" y="500" width="755" height="800" rx="22" fill="#17373a" stroke="#6b9f98" strokeWidth="4"/>
    <rect x="185" y="570" width="675" height="600" fill="#09282d"/>
    <rect x="255" y="675" width="365" height="315" rx="12" fill="#1c5457"/>
    <g transform={`translate(${mix(900,660,a)} ${mix(1150,795,a)}) rotate(${mix(18,-5,a)})`}>
      <rect x="0" y="0" width="175" height="225" rx="6" fill={PAPER} stroke={COPPER} strokeWidth="13"/>
      {[0,1,2,3].map(i=><rect key={i} x="27" y={45+i*34} width={115-i*13} height="8" fill="#67918a"/>)}
    </g>
    <g transform={`translate(${mix(90,690,a)} ${mix(1450,1050,a)}) rotate(-35)`}>
      <rect x="-66" y="55" width="132" height="160" rx="20" fill="#dce3da"/>
      <rect x="-47" y="-105" width="94" height="195" rx="43" fill="#b67e65"/>
      <rect x="27" y="-155" width="37" height="145" rx="18" fill="#bd866d"/>
    </g>
    <text x="236" y="1215" fill={TEAL} fontSize="26" fontFamily={FONT.mono} opacity={a}>ANSWER  ↔  CITED SOURCE</text>
    <path d="M 330 1100 H 590" stroke={TEAL} strokeWidth="8"/>
    <path d="M 350 1358 H 730" stroke="#597c78" strokeWidth="5"/>
    <path d={`M 350 1358 H ${mix(350,730,b)}`} stroke={COPPER} strokeWidth="8"/>
    <circle cx={mix(350,730,b)} cy="1358" r="14" fill={COPPER}/>
    <text x="298" y="1430" fill={PAPER} fontSize="31" fontFamily={FONT.mono}>EVALUATION ONGOING</text>
  </svg>;
  return <svg width="1080" height="1920" viewBox="0 0 1080 1920"
    style={{position:'absolute',inset:0}}>
    <rect x="130" y="455" width="790" height="935" rx="24" fill="#17373a" stroke="#74aaa0" strokeWidth="5"/>
    <rect x="170" y="515" width="710" height="815" fill="#0b2d33"/>
    <rect x="205" y="615" width="390" height="520" fill="#25575b"/>
    {[0,1,2,3].map(i=><rect key={i} x="250" y={690+i*84} width={280-i*20} height="13" fill="#9ac4b5"/>)}
    <g transform={`translate(${mix(1030,580,a)} 745) rotate(${mix(14,0,a)})`}>
      <rect x="0" y="0" width="250" height="330" rx="8" fill={PAPER} stroke={COPPER} strokeWidth="15"/>
      {[0,1,2,3,4].map(i=><rect key={i} x="35" y={62+i*44} width={174-i*15} height="10" fill="#6b8c84"/>)}
      <g transform={`translate(${mix(0,153,a)} ${mix(0,-39,a)})`}>
        <rect x="0" y="0" width="220" height="295" rx="7" fill="#f3eedf" stroke={COPPER} strokeWidth="6" opacity={a}/>
        {[0,1,2].map(i=><rect key={i} x="30" y={67+i*54} width={160-i*25} height="8" fill="#628f86" opacity={a}/>)}
      </g>
    </g>
    <g transform={`translate(${mix(80,632,a)} ${mix(1460,1135,a)}) rotate(-37)`}>
      <rect x="-66" y="55" width="132" height="160" rx="20" fill="#dce3da"/>
      <rect x="-47" y="-105" width="94" height="195" rx="43" fill="#b67e65"/>
      <rect x="27" y="-155" width="37" height="145" rx="18" fill="#bd866d"/>
    </g>
    <rect x="272" y="1180" width="530" height="74" rx="8" fill="none" stroke={COPPER} strokeWidth="4" opacity={b}/>
    <text x="304" y="1226" fill={PAPER} fontSize="26" fontFamily={FONT.mono} opacity={b}>PATIENT OUTCOME / NOT REPORTED</text>
  </svg>;
};

const SourceSignoff:React.FC=()=>{
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  const arrive=clamp((frame/fps-.12)/1.15);
  const open=clamp((frame/fps-1.25)/1.25);
  return <svg width="1080" height="1920" viewBox="0 0 1080 1920"
    style={{position:'absolute',inset:0,pointerEvents:'none'}} aria-hidden="true">
    <g transform={`translate(${mix(1120,780,arrive)} 375) rotate(${mix(14,-5,arrive)})`}>
      <rect x="0" y="0" width="165" height="210" rx="5" fill={PAPER}
        stroke={COPPER} strokeWidth="10"/>
      <path d="M 25 45 H 99 M 25 73 H 130 M 25 101 H 119 M 25 129 H 135"
        stroke="#5a8b84" strokeWidth="6"/>
      <g transform={`translate(${mix(0,-82,open)} ${mix(0,30,open)}) rotate(${mix(0,-12,open)})`}
        opacity={open}>
        <rect x="0" y="0" width="152" height="195" rx="5" fill="#f3eedf"
          stroke={COPPER} strokeWidth="6"/>
        <path d="M 22 42 H 93 M 22 73 H 123 M 22 104 H 115 M 22 135 H 101"
          stroke="#5a8b84" strokeWidth="6"/>
      </g>
    </g>
  </svg>;
};

export const CitationInChartEpisode:React.FC<DispatchProps> = ({runtime_s,scenes,captions=[],credits='',credits_s=5})=>{
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  const time=frame/fps;
  const windows=actionWindows(scenes);
  const scene=scenes.find(s=>time>=s.start_s&&time<s.start_s+s.duration_s)??scenes[scenes.length-1];
  const progress=(id:string)=>actionProgress(requireAction(windows,id),time);
  const active=time<runtime_s;
  const dimensional=['s1','s2','s3','s4','s5','s6','s7'].includes(scene.id);
  return <AbsoluteFill style={{background:INK,color:PAPER}}>
    {active&&<>
      <AbsoluteFill style={{background:'radial-gradient(ellipse at 52% 43%,#215053 0%,#102f35 46%,#06171b 95%)'}}/>
      {dimensional?<ClinicalStage scene={scene} progress={progress}/>:<LaterPicture scene={scene} progress={progress}/>}
      <AbsoluteFill style={{background:'linear-gradient(180deg,#06171bf0 0%,transparent 28%,transparent 73%,#06171be8 100%)'}}/>
      {scene.id==='s4'&&<div style={{position:'absolute',left:105,right:105,top:1330,
        display:'flex',justifyContent:'space-between',fontFamily:FONT.mono,fontSize:21,
        letterSpacing:1.3,color:PAPER}}>
        <span style={{background:'rgba(19,54,58,.851)',padding:'12px 16px',borderLeft:`3px solid ${COPPER}`}}>MEDICAL LITERATURE</span>
        <span style={{background:'rgba(19,54,58,.851)',padding:'12px 16px',borderLeft:`3px solid ${COPPER}`}}>CLINICAL GUIDELINES</span>
      </div>}
      {scene.id==='s5'&&<div style={{position:'absolute',left:70,width:565,top:1385,
        fontFamily:FONT.mono,color:PAPER,background:'rgba(8,38,44,.855)',padding:'14px 18px',
        borderLeft:`4px solid ${COPPER}`}}>
        <div style={{fontSize:24,letterSpacing:2,color:TEAL,marginBottom:15}}>UTMB REPORTED ACTIVE USE</div>
        <div style={{height:24,position:'relative',background:'#284a4a',border:'1px solid #83aca2'}}>
          <div style={{position:'absolute',left:'50%',top:-10,bottom:-10,width:2,background:PAPER}}/>
          <div style={{height:'100%',width:'50%',background:COPPER,
            transformOrigin:'left',transform:`scaleX(${progress(scene.visual_events![1].id!)})`}}/>
          <span style={{position:'absolute',left:'51%',top:-12,fontSize:34,color:COPPER,
            opacity:progress(scene.visual_events![1].id!)}}>&gt;</span>
        </div>
        <div style={{fontSize:30,marginTop:16,color:COPPER}}>&gt; HALF OF CLINICIANS</div>
        <div style={{fontSize:17,marginTop:7,color:'#a5bcb3'}}>THRESHOLD ONLY / NO COUNT REPORTED</div>
      </div>}
      <div style={{position:'absolute',left:70,top:95,right:70,display:'flex',alignItems:'center',gap:16}}>
        <span style={{fontFamily:FONT.mono,fontSize:24,letterSpacing:2.5,color:TEAL}}>TEXAS AI DISPATCH</span>
        <span style={{flex:1,height:1,background:'rgba(105,164,155,.467)'}}/>
        <span style={{fontFamily:FONT.mono,fontSize:20,color:TEAL}}>09.25.26</span>
      </div>
      <div style={{position:'absolute',left:70,right:70,top:230}}>
        <div style={{fontFamily:FONT.mono,fontSize:19,letterSpacing:2.5,color:COPPER}}>UTMB / GALVESTON / PUBLIC DISCLOSURE</div>
        <div style={{fontFamily:FONT.display,fontSize:74,lineHeight:1.02,marginTop:20,maxWidth:900}}>{scene.super}</div>
      </div>
      <div style={{position:'absolute',left:70,right:70,bottom:220,display:'flex',alignItems:'center',gap:16}}>
        <span style={{fontFamily:FONT.mono,fontSize:18,letterSpacing:2,color:'#a4bbb2'}}>ILLUSTRATED CLINICAL WORKFLOW</span>
        <span style={{flex:1,height:1,background:'rgba(117,165,155,.4)'}}/>
        <span style={{fontFamily:FONT.mono,fontSize:18,color:COPPER}}>0{scene.id.slice(1)} / 08</span>
      </div>
      <SubtitleTrack cues={captions} fps={fps}/>
    </>}
    <Sequence from={Math.round(runtime_s*fps)} durationInFrames={Math.round(credits_s*fps)}>
      <CreditsCard text={credits}/>
      <SourceSignoff/>
    </Sequence>
  </AbsoluteFill>;
};
