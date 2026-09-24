import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {CinematicStage} from '../lib/cinema/CinematicStage';
import {cue,mix} from '../lib/cinema/motion';
import {LensAssembly} from './LensAssembly';
import {stateAt,STUDY} from './plan';
import {FONT} from '../lib/type';
import {DocketMark} from '../branding/DocketMark';

export type Treatment='vector'|'dimensional'|'hybrid';
const VectorLens:React.FC<{t:number}>=({t})=>{
 const s=stateAt(t),e=s.apart;
 const turn=cue(t,2.4,4.8)*(1-cue(t,16.7,19.2));
 const sx=mix(1,.56,turn),zoom=mix(1.4,.77,turn);
 return <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0}}>
  <defs>
   <radialGradient id="vl"><stop stopColor="#78cfc7"/><stop offset=".4" stopColor="#163b43"/><stop offset="1" stopColor="#081720"/></radialGradient>
   <linearGradient id="vm"><stop stopColor="#173039"/><stop offset=".5" stopColor="#71878a"/><stop offset="1" stopColor="#20343e"/></linearGradient>
  </defs>
  <g transform={'translate('+(540-60*turn)+' 890) scale('+zoom+')'}>
   <g transform={'translate('+(-130*turn-e*150)+' 0) scale('+sx+' 1)'}>
    <rect x={-235} y={-205} width={470} height={410} rx={18} fill="#112d33" stroke="#648184" strokeWidth={3}/>
    {Array.from({length:18},(_,i)=><path key={i} d={'M'+(-208+i*24)+' -192 V192'} stroke="#31565b" strokeWidth={7}/>)}
    <rect x={-150} y={-133} width={300} height={266} rx={4} fill="#a67b4d"/>
    <rect x={-135} y={-118} width={270} height={236} fill="url(#vl)"/>
    {Array.from({length:100},(_,i)=><rect key={i} x={-116+(i%10)*24} y={-99+Math.floor(i/10)*20}
      width={15} height={12} fill="#8debd0" opacity={.15+.65*s.sensor}/>)}
   </g>
   {[0,1,2,3,4].map(i=><g key={i} transform={'translate('+(turn*(i*52-40)+e*(i*125-100))+' '+(-turn*(i*14)+e*(i*-31))+') scale('+sx+' 1)'}>
     <circle r={220+i*10} fill="url(#vm)" stroke={i%2?'#bf9464':'#7b9398'} strokeWidth={5}/>
     <circle r={183} fill="url(#vl)" stroke="#0d1b22" strokeWidth={12}/>
     {i===4&&Array.from({length:60},(_,k)=>{
       const a=k*Math.PI/30;
       return <path key={k} d={'M'+Math.cos(a)*243+' '+Math.sin(a)*243+' L'+Math.cos(a)*257+' '+Math.sin(a)*257} stroke="#afbdba" strokeWidth={2}/>;
     })}
     {i===4&&<g transform={'rotate('+mix(-35,0,cue(t,.25,1.45))+')'}>
      {Array.from({length:9},(_,j)=><path key={j} transform={'rotate('+j*40+')'}
        d={'M'+s.iris*180+' 0 Q170 -70 181 39 L78 128Z'} fill="#506973" stroke="#10222a" strokeWidth={3}/>)}
      <circle r={s.iris*135} fill="#031419"/>
     </g>}
   </g>)}
   {s.light>0&&<g opacity={s.light}>
    {[-120,-60,0,60,120].map(y=><path key={y} d={'M660 '+(y-145)+' L130 '+y+' L-210 0'}
      stroke="#a8f2d5" strokeWidth={2} fill="none"/>)}
   </g>}
  </g>
 </svg>;
};

const Overlay:React.FC<{t:number;treatment:Treatment}>=({t,treatment})=>{
 const hybrid=treatment==='hybrid';
 const s=stateAt(t);
 const camera=new THREE.PerspectiveCamera(39,1080/1920,.05,100);
 camera.position.set(...s.camera);camera.lookAt(...s.target);camera.updateMatrixWorld();
 const project=(v:[number,number,number])=>{
   const p=new THREE.Vector3(...v).project(camera);return [(p.x+1)*540,(1-p.y)*960];
 };
 const sensor=project([0,.1,-.522-s.apart*.6]);
 const lens=project([0,.9,.2+s.apart*.95]);
 const cut=t<5?'Open to the light.':t<10.5?'Follow its path.':t<14?'A surface responds.':'Everything connects.';
 const reveal=cue(t,.35,1.1);
 const labelOpacity=cue(t,6.4,7)*(1-cue(t,13.6,14));
 return <AbsoluteFill style={{pointerEvents:'none',color:'#e6e7d8'}}>
  <div style={{position:'absolute',left:82,right:82,top:130,display:'flex',alignItems:'center',gap:20}}>
   <div style={{width:42,height:28,overflow:'hidden'}}><div style={{transform:'scale(.2333)',transformOrigin:'top left'}}><DocketMark/></div></div>
   <span style={{fontFamily:FONT.mono,fontSize:20,letterSpacing:5,color:'#abbcb7'}}>TEXAS AI DOCKET</span>
   <div style={{flex:1,height:1,background:'linear-gradient(90deg,#769b9366,transparent)'}}/>
  </div>
  <div style={{position:'absolute',left:82,right:70,top:226,opacity:reveal,transform:'translateY('+mix(18,0,reveal)+'px)'}}>
   <div style={{fontFamily:FONT.display,fontSize:91,lineHeight:1.03,letterSpacing:-3}}>Through<br/>the lens.</div>
   <div style={{fontFamily:FONT.mono,fontSize:21,letterSpacing:3,color:'#b79063',marginTop:30}}>
    LIGHT / OPTICS / SIGNAL
   </div>
  </div>
  {hybrid&&<svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0,opacity:labelOpacity}}>
   <g fill="none" stroke="#d7b478" strokeWidth={1.5}>
    <path d={'M145 704 H310 L'+lens[0]+' '+lens[1]} pathLength={1} strokeDasharray={1} strokeDashoffset={1-cue(t,6.5,7.2)}/>
    <circle cx={lens[0]} cy={lens[1]} r={5}/>
    <path d={'M822 1255 H760 L'+sensor[0]+' '+sensor[1]} pathLength={1} strokeDasharray={1} strokeDashoffset={1-cue(t,10.5,11.3)}/>
    <circle cx={sensor[0]} cy={sensor[1]} r={5} opacity={cue(t,10.5,11.3)}/>
   </g>
   <text x={145} y={679} fontFamily={FONT.mono} fontSize={23} fill="#e1d2ae" letterSpacing={3}>LENS GROUPS</text>
   <text x={723} y={1296} fontFamily={FONT.mono} fontSize={23} fill="#e1d2ae" letterSpacing={3} opacity={cue(t,10.5,11.3)}>SENSOR</text>
  </svg>}
  <div style={{position:'absolute',left:82,right:82,top:1375,opacity:cue(t,1.4,2.2)}}>
   <div style={{fontFamily:FONT.display,fontSize:46,lineHeight:1.2}}>{cut}</div>
   <div style={{width:84,height:2,background:'#c6955b',marginTop:30}}/>
   <div style={{marginTop:25,fontFamily:FONT.mono,fontSize:18,letterSpacing:2.5,color:'#91aaa7'}}>{t>=5&&t<16.7?'EXPLODED VIEW / SCHEMATIC LIGHT PATH':STUDY.disclosure}</div>
  </div>
  <div style={{position:'absolute',left:82,bottom:142,fontFamily:FONT.mono,fontSize:17,letterSpacing:3,color:'#6f8583'}}>
   MOTION STUDY / ORIGINAL CODE AND SOUND
  </div>
 </AbsoluteFill>;
};

export const CinemaStudy:React.FC<{treatment:Treatment}>=({treatment})=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=frame/fps,s=stateAt(t);
 return <AbsoluteFill style={{background:'#071519'}}>
  <AbsoluteFill style={{background:'radial-gradient(ellipse at 58% 48%,#1d393a 0%,#0a1d22 42%,#040d12 90%)'}}/>
  {treatment==='vector'?<VectorLens t={t}/>:<CinematicStage position={s.camera} target={s.target}>
    <group position={[0,.1,0]}><LensAssembly t={t}/></group>
  </CinematicStage>}
  <AbsoluteFill style={{background:'linear-gradient(180deg,#040d12d9 0%,#040d1288 17%,transparent 32%,transparent 68%,#040d12b8 88%,#040d12 100%)'}}/>
  <Overlay t={t} treatment={treatment}/>
 </AbsoluteFill>;
};
