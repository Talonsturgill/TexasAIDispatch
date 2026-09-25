import React, {useEffect, useMemo} from 'react';
import {AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useLoader} from '@react-three/fiber';
import * as THREE from 'three';
import {CinematicStage} from './lib/cinema/CinematicStage';
import {actionProgress, actionWindows, requireAction} from './lib/direction';
import {mix, type V3} from './lib/cinema/motion';
import {CreditsCard, SubtitleTrack, type DispatchProps, type Scene} from './Dispatch';
import {FONT} from './lib/type';
import {COUNTY_PATHS} from './data/tx-counties';

const PAPER='#f2ede1', INK='#102532', BLUE='#74c6d2', COPPER='#d7955a';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const NAMED_FIRST=new Set(COUNTY_PATHS.filter(c=>c.named).slice(0,9).map(c=>c.name));
const NAMED_ORDER=new Map(COUNTY_PATHS.filter(c=>c.named).map((c,i)=>[c.name,i]));
const box=(color:string,metalness=.2,roughness=.58)=><meshStandardMaterial color={color} metalness={metalness} roughness={roughness}/>;

const Bench:React.FC=()=> <>
  <mesh position={[0,-2.62,-.7]} receiveShadow><boxGeometry args={[8,.2,5]}/>{box('#263d3c',.45,.57)}</mesh>
  <mesh position={[0,0,-2.1]} receiveShadow><boxGeometry args={[8,7,.1]}/>{box('#0b2630',.2,.74)}</mesh>
  {[-2.1,2.1].map(x=><mesh key={x} position={[x,-1.45,-1.72]} castShadow>
    <boxGeometry args={[.075,2.2,.12]}/>{box('#916b4e',.74,.31)}
  </mesh>)}
</>;

const FormPlate:React.FC<{open:number;tilt?:number;source:string}>=({open,tilt=0,source})=>{
  const texture=useLoader(THREE.TextureLoader,staticFile('source/'+source));
  texture.colorSpace=THREE.SRGBColorSpace;
  return <group position={[0,mix(-3,.0,open),.0]}
    rotation={[-.11,tilt,mix(-.1,0,open)]}>
    <mesh castShadow receiveShadow><boxGeometry args={[3.1,2.85,.085]}/>{box('#d7d0bd',.1,.82)}</mesh>
    <mesh position={[0,0,.052]}><planeGeometry args={[2.94,2.7]}/>
      <meshBasicMaterial map={texture} toneMapped={false}/></mesh>
    <mesh position={[.1,mix(.92,-.65,open),.085]} scale={[Math.max(.02,open),1,1]}>
      <boxGeometry args={[2.6,.045,.025]}/><meshBasicMaterial color={COPPER}/></mesh>
    <mesh position={[-1.49,-1.45,.12]}><sphereGeometry args={[.085,16,16]}/>{box(COPPER,.7,.25)}</mesh>
  </group>;
};

const releaseTexture=()=>{
 const c=document.createElement('canvas');c.width=800;c.height=1040;
 const g=c.getContext('2d');if(!g)throw new Error('release canvas unavailable');
 g.fillStyle='#f1eee6';g.fillRect(0,0,800,1040);
 g.fillStyle='#163f50';g.fillRect(0,0,800,160);
 g.fillStyle='#f1eee6';g.font='bold 37px Arial';g.fillText('OFFICE OF THE',52,67);
 g.fillText('ATTORNEY GENERAL',52,116);
 g.fillStyle='#aa6b43';g.fillRect(52,215,240,10);
 g.fillStyle='#1c4855';g.font='bold 34px Arial';g.fillText('SEPTEMBER 24, 2026',52,290);
 g.font='bold 51px Arial';g.fillText('INVESTIGATION',52,385);
 g.fillText('ANNOUNCED',52,451);
 g.fillStyle='#1c4855';g.font='bold 46px Arial';
 g.fillText('HUNDREDS OF DATA-CENTER',52,578);
 g.fillText('DEVELOPMENTS',52,637);
 g.fillStyle='#9b6242';g.fillRect(52,683,690,8);
 g.fillStyle='#1c4855';g.fillText('SURVEY RETURNS MISSING',52,755);
 g.fillStyle='#45606a';g.font='29px Arial';
 g.fillText('Counties named; no operator or site volume listed',52,851);
 g.fillStyle='#b48b66';g.fillRect(50,935,695,7);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
};

const Meter:React.FC<{p:number;empty?:boolean;settle?:number}>=({p,empty=true,settle=0})=><group position={[0,.35,.55]}>
  <mesh castShadow rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[1.48,1.48,.28,56]}/>
    {box('#886d52',.82,.27)}</mesh>
  <mesh position={[0,0,.155]}><circleGeometry args={[1.27,56]}/>
    <meshStandardMaterial color="#163c45" metalness={.68} roughness={.24}/></mesh>
  {[0,1,2,3,4,5,6,7].map(i=>{
    const a=i*Math.PI/4;
    return <mesh key={i} position={[Math.cos(a)*1.33,Math.sin(a)*1.33,.19]}>
      <sphereGeometry args={[.055,12,12]}/>{box('#e5b98e',.8,.26)}
    </mesh>;
  })}
  <mesh position={[0,-.05,.22]}><boxGeometry args={[1.43,.54,.08]}/>{box('#051c25',.45,.31)}</mesh>
  <mesh position={[0,-.05,.266]}><planeGeometry args={[1.26,.34]}/>
    <meshBasicMaterial color={empty?'#203a41':'#81bcc3'}/></mesh>
  <mesh position={[mix(-.54,.52,p),-.05,.282]}>
    <boxGeometry args={[.035,.3,.01]}/><meshBasicMaterial color={COPPER}/></mesh>
  <group rotation={[0,0,mix(-2.3,.25,p)]} position={[0,0,.29]}>
    <mesh position={[0,.83,0]}><boxGeometry args={[.05,.73,.04]}/>{box(COPPER,.7,.3)}</mesh>
    <mesh position={[0,.47,0]}><sphereGeometry args={[.085,16,16]}/>{box(COPPER,.7,.3)}</mesh>
  </group>
  <mesh position={[0,-.44,.31]} scale={[Math.max(.02,settle),1,1]}>
    <boxGeometry args={[1.32,.07,.03]}/><meshBasicMaterial color={COPPER}/></mesh>
</group>;

const ReturnSlot:React.FC<{reveal:number;separate:number;open:number;opening?:boolean}>=({reveal,separate,open,opening=false})=><group
  position={[mix(opening?1.65:2.8,.9,reveal),mix(opening?-.65:-2.15,-.8,reveal),.8]}
  rotation={[0,mix(.35,-.14,reveal),mix(.13,0,reveal)]}>
  <mesh castShadow><boxGeometry args={[2.75,2.05,.32]}/>{box('#9b7758',.7,.35)}</mesh>
  <mesh position={[0,.08,.175]}><boxGeometry args={[2.39,1.61,.04]}/>
    <meshBasicMaterial color="#102e37"/></mesh>
  <mesh position={[0,.08,.2]}><boxGeometry args={[2.06,1.25,.018]}/>
    <meshBasicMaterial color="#061c25"/></mesh>
  {[-1,1].map(side=><group key={side}
    position={[side*mix(.52,1.56,open),.08,.27]}>
    <mesh castShadow><boxGeometry args={[1.05,1.25,.085]}/>
      {box('#65858a',.67,.31)}</mesh>
    <mesh position={[0,-.47,.05]}><boxGeometry args={[.84,.045,.015]}/>
      <meshBasicMaterial color={COPPER}/></mesh>
  </group>)}
  {[-.87,.87].map(x=><mesh key={x} position={[x,.08,.24]}>
    <boxGeometry args={[.065,1.19,.04]}/><meshBasicMaterial color="#78a7a9"/></mesh>)}
  <mesh position={[0,mix(.67,-.31,separate),.27]}>
    <boxGeometry args={[1.93,.04,.02]}/><meshBasicMaterial color={COPPER}/></mesh>
  <group position={[0,mix(.05,-.62,open),mix(.27,.58,open)]}>
    <mesh castShadow><boxGeometry args={[2.18,.23,.48]}/>{box('#506e71',.7,.35)}</mesh>
    <mesh position={[0,.13,.03]}><boxGeometry args={[1.82,.045,.1]}/>
      <meshBasicMaterial color={COPPER}/></mesh>
  </group>
</group>;

const CategorySlip:React.FC<{index:number;p:number;settle:number}>=({index,p,settle})=>{
 const xs=[-1.05,-.35,.35,1.05], colors=['#7ebcd6','#66a6b9','#8bd1b9','#80d6b4'];
 const x=xs[index];
 return <group position={[x,-.1,.6]} scale={.9} rotation={[0,-.16,0]}>
  <mesh position={[0,-.24,-.21]} castShadow><boxGeometry args={[.72,2.45,.12]}/>{box('#24434c',.68,.37)}</mesh>
  {[-.37,.37].map((edge,i)=><mesh key={i} position={[edge,-.24,.12]} castShadow>
    <boxGeometry args={[.06,2.5,.72]}/>{box('#8faeb1',.51,.32)}</mesh>)}
  <mesh position={[0,-1.48,.12]} castShadow><boxGeometry args={[.78,.13,.73]}/>{box('#9a7959',.62,.35)}</mesh>
  <mesh position={[0,.96,-.09]} castShadow><boxGeometry args={[.72,.21,.2]}/>{box(colors[index],.38,.39)}</mesh>
  <group position={[mix(-x,0,p),mix(2.22,-.41,p),mix(1.38,.29,p)]}
    rotation={[mix(-.52,0,p),mix(.42,0,p),mix(.16,0,p)]} scale={clamp(p*5)}>
    <mesh castShadow><boxGeometry args={[.62,1.22,.045]}/>{box(PAPER,.05,.8)}</mesh>
    <mesh position={[0,.4,.027]}><boxGeometry args={[.5,.08,.006]}/><meshBasicMaterial color={colors[index]}/></mesh>
    {[0,1,2].map(j=><mesh key={j} position={[0,.16-j*.25,.028]}>
      <boxGeometry args={[.49,.018,.006]}/><meshBasicMaterial color="#83938e"/></mesh>)}
  </group>
  <mesh position={[0,-1.43,.54]} scale={[Math.max(.01,p),1,1]}>
    <boxGeometry args={[.58,.08,.04]}/><meshBasicMaterial color={COPPER}/></mesh>
 </group>;
};

const SurveyLeaf:React.FC=()=>{
 const surveyTexture=useLoader(THREE.TextureLoader,staticFile('source/groundwater-detail.png'));
 surveyTexture.colorSpace=THREE.SRGBColorSpace;
 return <>
  <mesh castShadow><boxGeometry args={[1.4,2.1,.07]}/>{box('#dcd2bf',.1,.79)}</mesh>
  <mesh position={[0,0,.04]}><planeGeometry args={[1.32,2.01]}/>
    <meshBasicMaterial map={surveyTexture} toneMapped={false}/></mesh>
  <mesh position={[-.72,0,.045]}><boxGeometry args={[.055,2.03,.025]}/>
    <meshBasicMaterial color={COPPER}/></mesh>
 </>;
};

const Notice:React.FC<{p:number;detail?:number;reframe?:number;bridge?:number}>=({p,detail=0,reframe=0,bridge=0})=>{
 const texture=useMemo(releaseTexture,[]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 return <group
  position={[mix(mix(3.5,.0,p),-.55,reframe),mix(mix(-1.55,-.72,p),.45,reframe),mix(.7,-.2,reframe)]}
  scale={mix(1,.64,reframe)} rotation={[0,mix(-.55,.03,p),mix(.22,-.04,p)]}>
  <mesh castShadow><boxGeometry args={[3.12,3.95,.1]}/>{box('#e5dbc5',.07,.85)}</mesh>
  <mesh position={[0,0,.061]}><planeGeometry args={[2.98,3.81]}/>
    <meshBasicMaterial map={texture} toneMapped={false}/></mesh>
  <mesh position={[.65,-.99,.07]} rotation={[0,0,mix(.75,0,p)]}>
    <torusGeometry args={[.5,.075,12,60]}/>{box(COPPER,.65,.34)}</mesh>
  <mesh position={[.65,-.99,.075]}><circleGeometry args={[.39,50]}/><meshBasicMaterial color="#75483e"/></mesh>
  <group position={[mix(mix(mix(2.45,3.5,reframe),mix(.62,2,reframe),detail),1.1,bridge),
    mix(mix(-1.35,.3,detail),0,bridge),mix(.19,2.1,bridge)]}
    scale={mix(mix(1,1.5,reframe),2.0,bridge)}
    rotation={[0,mix(.44,-.14,detail),mix(.16,-.02,bridge)]}>
    <SurveyLeaf/>
  </group>
</group>;
};

const Plan:React.FC<{local:number;gap:number}>=({local,gap})=><group position={[0,.1,.2]} rotation={[-.08,0,.05]}>
  {Array.from({length:16},(_,i)=>{
   const col=i%4,row=Math.floor(i/4),middle=i===6;
   const q=clamp((local-.12-(row+col)*.32)/.53);
   return <mesh key={i} position={[(col-1.5)*.91,(1.5-row)*.91,
       middle?mix(-1.1,-2.25,gap):mix(-1.1,.1,q)]} castShadow>
     <boxGeometry args={[.84,.84,.2]}/>
     {box(middle?'#293a3d':(i%3===0?'#4f9aa7':'#5f8890'),.32,.42)}
   </mesh>;
  })}
  {[[-.45,.45],[.45,.45],[-.45,-.45],[.45,-.45]].map(([dx,dy],i)=><mesh key={i}
    position={[.455+dx,.455+dy,.3]} scale={[Math.max(.01,gap),1,1]}>
    <boxGeometry args={[.09,.09,.055]}/><meshBasicMaterial color={COPPER}/>
  </mesh>)}
  <mesh position={[.455,.455,.29]} scale={[Math.max(.01,gap),1,1]}>
    <boxGeometry args={[.79,.06,.05]}/><meshBasicMaterial color={COPPER}/>
  </mesh>
</group>;

const PlannerHand:React.FC<{reach:number;pause:number}>=({reach,pause})=><group
  position={[mix(2.5,.55,reach)+pause*.95,mix(-1.8,.4,reach)-pause*.68,1.0]}
  rotation={[0,0,-.42]} scale={.55}>
  <mesh castShadow position={[1.85,-1.47,-.2]} rotation={[0,0,-.39]}>
    <boxGeometry args={[4.1,.72,.56]}/>{box('#435f6d',.08,.78)}</mesh>
  <mesh castShadow position={[.17,-.72,-.15]} rotation={[0,0,-.39]}>
    <boxGeometry args={[.52,.78,.57]}/>{box('#e4e0d5',.03,.83)}</mesh>
  <mesh castShadow position={[.1,-.62,-.06]}><boxGeometry args={[.55,.8,.42]}/>
    {box('#496173',.08,.8)}</mesh>
  <mesh castShadow position={[0,-.17,0]} rotation={[0,0,-.22]}>
    <capsuleGeometry args={[.24,.62,8,16]}/>{box('#8c5c48',.03,.82)}</mesh>
  {[0,1,2,3].map(i=><mesh key={i} castShadow
     position={[-.19+i*.14,.42-(i===0?.08:0),.03]} rotation={[0,0,-.14+i*.06]}>
    <capsuleGeometry args={[.063,.48+(i===1?.09:0),6,10]}/>{box('#a37055',.02,.79)}
  </mesh>)}
  <group position={[-.19,.7,.27]} rotation={[0,0,-.17]}>
    <mesh castShadow><cylinderGeometry args={[.045,.045,1.44,12]}/>{box('#b98d56',.35,.43)}</mesh>
    <mesh position={[0,.74,0]}><coneGeometry args={[.052,.17,12]}/>{box('#dad2b4',.03,.7)}</mesh>
    <mesh position={[0,-.74,0]}><coneGeometry args={[.036,.12,12]}/>{box('#4d5656',.54,.36)}</mesh>
  </group>
</group>;

const Tray:React.FC<{p:number;arrive:number}>=({p,arrive})=>{
  const texture=useLoader(THREE.TextureLoader,staticFile('source/2025-industrial-form-p1.png'));
  texture.colorSpace=THREE.SRGBColorSpace;
  return <group>
  <mesh position={[.65,-1.3,.4]} castShadow><boxGeometry args={[3.8,.18,2.1]}/>{box('#ad8964',.73,.32)}</mesh>
  <mesh position={[-1.1,-.8,.42]} castShadow><boxGeometry args={[.16,.9,2.1]}/>{box('#8c6b50',.7,.36)}</mesh>
  <group position={[mix(-3,mix(-.55,.6,arrive),p),mix(1.1,mix(.3,-.65,arrive),p),.7]}
    rotation={[0,mix(.55,-.1,p),mix(-.19,0,p)]}>
    <mesh castShadow><boxGeometry args={[2.5,3.18,.07]}/>{box(PAPER,.05,.83)}</mesh>
    <mesh position={[0,0,.042]}><planeGeometry args={[2.4,3.07]}/>
      <meshBasicMaterial map={texture} toneMapped={false}/></mesh>
  </group>
</group>;
};

const Stage:React.FC<{scene:Scene;progress:(id:string)=>number}>=({scene,progress})=>{
 const stageFrame=useCurrentFrame(),stageFps=useVideoConfig().fps;
 const local=stageFrame/stageFps-scene.start_s;
 const id=scene.id, events=scene.visual_events||[];
 const a=events[0]?.id?progress(events[0].id):0;
 const b=id==='s5'?progress('s5-develop-1'):(events[1]?.id?progress(events[1].id):0);
 const c=events[2]?.id?progress(events[2].id):0;
 const d=events[3]?.id?progress(events[3].id):0;
 const handoff=clamp(c*.5+d*.5);
 const camera:V3=id==='s3'?[.55,.95,9.2]:id==='s5'?[.6,.55,7.8]:
   id==='s7'?[-.8,.4,8.4]:[1.05,.68,8.2];
 return <CinematicStage position={camera} target={[0,0,0]} fov={38}>
  {id==='s1'?<mesh position={[0,-2.62,-.7]} receiveShadow>
    <boxGeometry args={[8,.2,5]}/>{box('#263d3c',.45,.57)}</mesh>:<Bench/>}
  {(id==='s1'||id==='s4'||id==='s8')&&<>
    <group position={id==='s1'?[mix(0,-2.2,handoff),mix(0,-.8,handoff),-.45]:[0,0,-.45]}
      rotation={[0,-.13,mix(0,-.16,id==='s1'?handoff:0)]}>
      <FormPlate open={clamp(a*.6+b*.4)} source={id==='s4'?'purchased-detail.png':'groundwater-detail.png'}/>
    </group>
    {id==='s4'?<group position={[.82,-.55,.8]} scale={.7}>
      <Meter p={clamp(a*.35+b*.25)} settle={b}/></group>:
      <group position={id==='s1'?[mix(0,-1.75,handoff),mix(0,-.4,handoff),0]:[0,0,0]}>
        <ReturnSlot reveal={id==='s1'?b:a} separate={b} open={id==='s1'?c:b} opening={id==='s1'}/>
      </group>}
  </>}
  {id==='s1'&&<Notice p={c*.45+d*.45} detail={0}/>}
  {id==='s2'&&<>
    <group position={[mix(-2.2,-4.5,a),mix(-.8,-2.1,a),-.45]}
      rotation={[0,-.13,mix(-.16,-.27,a)]}>
      <FormPlate open={1} source="groundwater-detail.png"/>
    </group>
    <group position={[-1.6,-.8,0]} scale={.7}>
      <ReturnSlot reveal={1} separate={1} open={1}/>
    </group>
    <Notice p={mix(.9,1,a)} detail={b} reframe={a} bridge={d}/>
    <group position={[mix(2.2,1.2,a),-.35,-.35]} rotation={[0,.26,-.05]} scale={.5}>
      <ReturnSlot reveal={a} separate={a} open={a}/>
    </group>
  </>}
  {id==='s3'&&<>
    <group position={[mix(.154,-3,a),mix(.45,-.1,a),mix(1.144,-1,a)]}
      rotation={[0,mix(-.11,-.45,a),mix(-.06,-.28,a)]} scale={mix(1.28,.4,a)}>
      <SurveyLeaf/>
    </group>
    {[0,1,2,3].map((i)=><CategorySlip key={i} index={i}
      p={progress(['s3-groundwater','s3-surface','s3-purchased','s3-develop-1'][i])}
      settle={progress('s3-develop-1')}/>)}
    <mesh position={[0,-1.82,.65]} castShadow><boxGeometry args={[4.9,.33,.8]}/>{box('#9a7959',.74,.31)}</mesh>
    <mesh position={[0,-2.12,.85]} scale={[Math.max(.01,progress('s3-develop-1')),1,1]}>
      <boxGeometry args={[2.4,.06,.04]}/><meshBasicMaterial color={COPPER}/></mesh>
  </>}
  {id==='s5'&&<>
    <Plan local={local} gap={b}/>
    <group position={[-.55,-.9,.82]} rotation={[0,.14,.08]} scale={.65}>
      <FormPlate open={a} source="groundwater-detail.png"/>
    </group>
    <PlannerHand reach={a} pause={b}/>
  </>}
  {id==='s6'&&<>
    <mesh position={[0,.1,-.25]} castShadow><boxGeometry args={[4.7,4.25,.25]}/>{box('#183b44',.58,.38)}</mesh>
    <mesh position={[-1.15,.05,.24]} castShadow><boxGeometry args={[2.55,3.9,.13]}/>
      {box('#204b55',.25,.57)}</mesh>
    <mesh position={[1.07,.06,.13]}><boxGeometry args={[1.72,3.05,.15]}/>{box('#59828b',.48,.33)}</mesh>
    <mesh position={[1.07,.06,.24]}><planeGeometry args={[1.47,2.8]}/>
      <meshBasicMaterial color="#09222e"/></mesh>
    <mesh position={[1.07,mix(.0,-2.1,d),.3]}><boxGeometry args={[1.45,2.7,.09]}/>
      {box('#a8bec0',.7,.29)}</mesh>
    <mesh position={[1.07,-1.5,.32]} scale={[Math.max(.01,d),1,1]}>
      <boxGeometry args={[1.36,.07,.02]}/><meshBasicMaterial color={COPPER}/></mesh>
  </>}
  {id==='s7'&&<Tray p={a} arrive={b}/>}
 </CinematicStage>;
};

const SOURCE_IMAGES:Record<string,string>={s1:'groundwater-detail.png',s4:'purchased-detail.png',s8:'groundwater-detail.png'};
const SUPPORT:Record<string,string>={
 s1:'2025 INDUSTRIAL SURVEY / BLANK TEMPLATE',
 s2:'SEPT 24 / ATTORNEY GENERAL ANNOUNCEMENT',
 s3:'FORM CATEGORIES / NOT OBSERVED SITE FLOWS',
 s4:'2025 FORM / MONTHLY GALLONS',
 s5:'STATE + REGIONAL WATER PLANNING',
 s6:'RELEASE NAMES COUNTIES / NO SITE VOLUME',
 s7:'LATE PDF ROUTE / SAMPLE FORM',
 s8:'TWDB UPDATE TO GOVERNOR / OCT 14',
};
const PATHS=['GROUNDWATER\nMONTHLY','SURFACE\nMONTHLY','PURCHASED\nMONTHLY','REUSE\nANNUAL'];
export const WaterSurveyGapEpisode:React.FC<DispatchProps>=({runtime_s,scenes,captions=[],credits='',credits_s=5})=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),time=frame/fps;
 const windows=actionWindows(scenes);
 const scene=scenes.find(s=>time>=s.start_s&&time<s.start_s+s.duration_s)||scenes[scenes.length-1];
 const progress=(id:string)=>actionProgress(requireAction(windows,id),time);
 const first=scene.visual_events?.[0]?.id;
 const p=first?progress(first):0;
 const secondIndex=scene.id==='s2'?2:scene.id==='s3'?4:scene.id==='s6'?3:1;
 const second=scene.visual_events?.[secondIndex]?.id?progress(scene.visual_events[secondIndex].id):0;
 const local=time-scene.start_s;
 const source=scene.id==='s3'?
   (second>.35?'reuse-detail.png':'groundwater-detail.png'):
   scene.id==='s4'&&second>.35?'purchased-meter-detail.png':SOURCE_IMAGES[scene.id];
 return <AbsoluteFill style={{background:INK,color:PAPER}}>
   {time<runtime_s&&<>
    <AbsoluteFill style={{background:'radial-gradient(ellipse at 50% 38%,#284e55 0%,#142d37 52%,#081c27 100%)'}}/>
    {scene.id==='s1'&&<AbsoluteFill>
      <Img src={staticFile('generated/texas-meter-context.png')}
        style={{width:'100%',height:'100%',objectFit:'cover'}}/>
      <AbsoluteFill style={{background:'linear-gradient(180deg,rgba(8,28,43,0.659) 0%,rgba(8,28,43,0.075) 44%,rgba(8,28,43,0.533) 100%)'}}/>
    </AbsoluteFill>}
    <Stage scene={scene} progress={progress}/>
    {source&&<div style={{position:'absolute',left:145,top:1035,width:790,height:410,
       border:`8px solid ${COPPER}`,background:PAPER,boxShadow:'0 22px 48px rgba(5,24,33,0.788)',
       transform:`translateY(${mix(460,0,clamp(p*1.5))+ (scene.id==='s1'?mix(0,600,clamp((local-1.25)/.7)):0)}px) rotate(${mix(5,-2,p)}deg)`,
       opacity:scene.id==='s1'?1-clamp((local-1.35)/.55):scene.id==='s3'?1-clamp((local-.65)/.5):1,
       overflow:'hidden'}}>
      <Img src={staticFile('source/'+source)} style={{width:'100%',height:'100%',objectFit:'cover',
        objectPosition:source==='purchased-meter-detail.png'?'left center':'center'}}/>
    </div>}
    {scene.id==='s3'&&<div style={{position:'absolute',top:565,left:72,right:72,display:'flex',
       justifyContent:'space-between'}}>
       {PATHS.map((t,i)=><div key={t} style={{fontFamily:FONT.mono,fontSize:30,lineHeight:1.15,
         whiteSpace:'pre-line',width:225,background:'rgba(9,42,50,0.910)',padding:'11px 8px',
         opacity:clamp(progress(['s3-groundwater','s3-surface','s3-purchased','s3-develop-1'][i])*2),
         borderLeft:`4px solid ${i===3?'#80d6b4':BLUE}`}}>{t}</div>)}
    </div>}
    {scene.id==='s3'&&<div style={{position:'absolute',left:155,right:155,top:965,height:200,
      background:PAPER,border:`7px solid ${COPPER}`,boxShadow:'0 22px 48px rgba(5,24,33,0.788)',
      overflow:'hidden',opacity:clamp((progress('s3-develop-1')-.3)*2.8),
      transform:`translateY(${mix(85,0,progress('s3-develop-1'))}px)`}}>
      <Img src={staticFile('source/reuse-detail.png')} style={{width:'100%',height:'100%',
        objectFit:'cover',objectPosition:'top'}}/>
      <div style={{position:'absolute',right:0,bottom:0,padding:'9px 16px',
        background:'rgba(8,37,44,0.949)',color:PAPER,fontFamily:FONT.mono,fontSize:31,
        borderLeft:`5px solid ${COPPER}`}}>REUSE · ANNUAL</div>
    </div>}
    {scene.id==='s2'&&<div style={{position:'absolute',left:635,right:75,top:750,
      padding:'12px 16px',background:'rgba(8,37,44,0.910)',borderLeft:`6px solid ${COPPER}`,
      fontFamily:FONT.mono,fontSize:27,letterSpacing:1.1,opacity:clamp((scene.visual_events?.[1]?.id?progress(scene.visual_events[1].id):0)*2)*(1-clamp(second*4))}}>
      BLANK TWDB TEMPLATE
    </div>}
    {scene.id==='s2'&&<div style={{position:'absolute',left:75,right:645,top:1150,
      padding:'12px 16px',background:'rgba(8,37,44,0.910)',borderLeft:`6px solid ${BLUE}`,
      fontFamily:FONT.mono,fontSize:27,letterSpacing:1.1,opacity:clamp(p*2)}}>
      RESPONSE SLOT EMPTY
    </div>}
    {scene.id==='s2'&&<div style={{position:'absolute',left:130,right:130,top:975,
      padding:'18px 23px',background:'#e6dbc4',color:'#17343d',borderLeft:`8px solid ${COPPER}`,
      fontFamily:FONT.mono,fontSize:27,lineHeight:1.35,
      opacity:second*(1-clamp((scene.visual_events?.[3]?.id?progress(scene.visual_events[3].id):0)-.7)*3.33),
      transform:`translateY(${mix(90,0,second)}px)`}}>
      COUNTIES IN RELEASE: HARRIS · TRAVIS · DALLAS<br/>NO OPERATOR NAMED
    </div>}
    {scene.id==='s5'&&<div style={{position:'absolute',left:70,right:620,top:655,
      padding:'15px 19px',background:'rgba(8,37,44,0.949)',borderTop:`6px solid ${COPPER}`,
      fontFamily:FONT.mono,fontSize:37,lineHeight:1.15,
      opacity:clamp(p*2)}}>DIRECT REPORT<br/>NO RETURN</div>}
    {scene.id==='s1'&&<div style={{position:'absolute',left:680,right:85,top:760,
      padding:'12px',background:'rgba(8,37,44,0.910)',borderTop:`5px solid ${COPPER}`,
      textAlign:'center',fontFamily:FONT.mono,fontSize:35,
      opacity:1-(scene.visual_events?.[2]?.id?progress(scene.visual_events[2].id):0)}}>RESPONSE SLOT</div>}
    {scene.id==='s1'&&<div style={{position:'absolute',left:70,top:445,
      fontFamily:FONT.mono,fontSize:25,letterSpacing:1.4,color:'#e4e8dd',
      background:'rgba(8,37,44,0.722)',padding:'9px 12px',borderLeft:`5px solid ${COPPER}`}}>
      ILLUSTRATIVE WATER SYSTEM
    </div>}
    {scene.id==='s6'&&<>
      <div style={{position:'absolute',left:75,width:525,top:505,height:760,
        background:'rgba(11,48,56,0.937)',padding:'18px 15px',borderTop:`7px solid ${BLUE}`,
        opacity:p,transform:`translateY(${mix(130,0,p)}px)`}}>
        <div style={{fontFamily:FONT.mono,fontSize:30,color:PAPER,letterSpacing:1.2}}>
          COUNTIES NAMED
        </div>
        <svg viewBox="0 0 520 600" width="495" height="570" style={{display:'block',margin:'4px auto 0'}}>
          {COUNTY_PATHS.map(c=><path key={c.name} d={c.d} fill="#245662"
            stroke="#83aeb0" strokeWidth={.75} opacity={.85} fillRule="evenodd"/>)}
          {COUNTY_PATHS.filter(c=>c.named).map(c=>{
            const i=NAMED_ORDER.get(c.name)||0;
            const phase=progress(NAMED_FIRST.has(c.name)?'s6-counties-first':'s6-counties-remaining');
            return <path key={c.name} d={c.d} fill={COPPER} stroke="#ffcf9e"
              strokeWidth={1.8} opacity={clamp(phase*1.8-(i%9)*.09)} fillRule="evenodd"/>;
          })}
        </svg>
        <div style={{fontFamily:FONT.mono,fontSize:23,color:PAPER,marginTop:-3}}>
          HARRIS · TRAVIS · DALLAS + OTHERS
        </div>
        <div style={{fontFamily:FONT.mono,fontSize:17,color:'#9fc4c2',marginTop:13}}>
          AG COUNTY LIST · TXDOT BOUNDARIES · NO SITE PINS
        </div>
      </div>
      <div style={{position:'absolute',left:635,right:75,top:630,color:'#f2ede1',
        background:'rgba(8,37,44,0.929)',padding:'20px 24px',borderTop:`7px solid ${COPPER}`,
        fontFamily:FONT.mono,fontSize:29,lineHeight:1.2}}>
        SITE GALLONS
        <div style={{height:6,background:'#7bb6bb',marginTop:26,marginBottom:23}}/>
        <div style={{fontFamily:FONT.display,fontSize:69,lineHeight:1}}>—</div>
        <div style={{fontFamily:FONT.mono,fontSize:29,marginTop:40,
          color:'#f2ede1',background:'#24515a',padding:'16px 18px',borderLeft:`7px solid ${COPPER}`,
          opacity:second,transform:`translateY(${mix(60,0,second)}px)`}}>
          NO FIGURE<br/>IN RELEASE
        </div>
      </div>
    </>}
    {scene.id==='s7'&&<div style={{position:'absolute',left:135,right:130,top:1060,
      padding:'16px 21px',background:'rgba(8,37,44,0.937)',borderLeft:`7px solid ${COPPER}`,
      fontFamily:FONT.mono,fontSize:29,lineHeight:1.18,
      opacity:p,transform:`translateY(${mix(100,0,p)}px)`}}>
      BLANK SAMPLE · LATE PDF<br/>EMAIL COMPLETE SURVEY TO TWDB
    </div>}
    {scene.id==='s8'&&<div style={{position:'absolute',left:88,right:88,top:575,
      padding:'20px 24px',background:'rgba(8,37,44,0.941)',borderLeft:`8px solid ${COPPER}`,
      fontFamily:FONT.mono,fontSize:39,lineHeight:1.16,
      opacity:second,transform:`translateY(${mix(80,0,second)}px)`}}>
      NO RETURN → NO DIRECT GALLON FIGURE
    </div>}
    {scene.id==='s8'&&<div style={{position:'absolute',left:245,right:245,top:890,
      padding:'14px',background:'#e5dbc5',color:'#14323b',borderLeft:`9px solid ${COPPER}`,
      boxShadow:'0 16px 38px rgba(3,19,28,0.667)',textAlign:'center',fontFamily:FONT.mono,fontSize:24,
      transform:`translateY(${mix(-380,0,scene.visual_events?.[2]?.id?progress(scene.visual_events[2].id):0)}px) rotate(${mix(-8,0,scene.visual_events?.[2]?.id?progress(scene.visual_events[2].id):0)}deg)`}}>
      OCT 14 · UPDATE TO GOVERNOR
    </div>}
    <AbsoluteFill style={{background:'linear-gradient(180deg,rgba(8,27,37,0.961) 0%,transparent 31%,transparent 72%,rgba(8,27,37,0.929) 100%)',pointerEvents:'none'}}/>
    <div style={{position:'absolute',left:70,right:70,top:95,display:'flex',gap:16,alignItems:'center',
       fontFamily:FONT.mono,fontSize:22,letterSpacing:2,color:BLUE}}>
       <span>TEXAS AI DISPATCH</span><span style={{flex:1,height:1,background:'#75a4a7'}}/>
       <span>09.25.26</span>
    </div>
    <div style={{position:'absolute',left:70,right:70,top:225}}>
      <div style={{fontFamily:FONT.mono,fontSize:20,letterSpacing:2,color:COPPER}}>{SUPPORT[scene.id]}</div>
      <div style={{fontFamily:FONT.display,fontSize:scene.id==='s8'?59:71,
        lineHeight:1.03,marginTop:20}}>{scene.super}</div>
    </div>
    <div style={{position:'absolute',left:70,right:70,bottom:210,display:'flex',alignItems:'center',gap:16,
       fontFamily:FONT.mono,fontSize:17,color:'#b5c6bf',letterSpacing:1}}>
       <span>ILLUSTRATED REPORTING PATH</span><span style={{flex:1,height:1,background:'#6b8d8f'}}/>
       <span>0{scene.id.slice(1)} / 08</span>
    </div>
    <SubtitleTrack cues={captions} fps={fps}/>
   </>}
   <Sequence from={Math.round(runtime_s*fps)} durationInFrames={Math.round(credits_s*fps)}>
     <CreditsCard text={credits}/>
   </Sequence>
 </AbsoluteFill>;
};
