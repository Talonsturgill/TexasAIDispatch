import React from 'react';
import {Sequence, useCurrentFrame, useVideoConfig, Easing, interpolate} from 'remotion';
import type {DispatchProps, Scene} from './Dispatch';
import {CreditsCard, SubtitleTrack} from './Dispatch';
import {Element} from './lib/registry';
import {Stage3D, Plane, CameraMoves, composeCams} from './lib/stage3d';
import {FONT} from './lib/type';
import {SAFE_RIGHT, SAFE_BOTTOM} from './lib/safearea';

// A specimen stays a candidate throughout. Every staged noun and label comes from the board.
const MagnetShot:React.FC<{scene:Scene}>=({scene})=>{
 const f=useCurrentFrame(); const {fps}=useVideoConfig();
 const p=Math.min(1,f/Math.max(1,scene.duration_s*fps-1));
 const q=Easing.inOut(Easing.cubic)(p);
 const move=scene.camera_strategy==='truckAcross'?CameraMoves.truckAcross(q,80):
   scene.camera_strategy==='craneDown'?CameraMoves.craneDown(q,70):
   scene.camera_strategy==='riseWith'?CameraMoves.riseWith(q,65):
   scene.camera_strategy==='dollyThrough'?{z:70*q}:CameraMoves.orbitReveal(q,6);
 const camera=composeCams(move,{y:-60,z:90});
 const light=scene.id==='s1'||scene.id==='s6'||scene.id==='s8';
 return <div style={{position:'absolute',inset:0,background:light?'#cdd8c9':'#e2dfcf'}}>
   <Stage3D camera={camera}>
    <Plane z={900} fill><svg width={1080} height={1920}><rect width={1080} height={1920} fill={light?'#cdd8c9':'#e2dfcf'}/><path d="M0,1160 H1080 M0,1280 H1080" stroke="#acb9aa" strokeWidth={3}/><rect x={170} y={200} width={150} height={700} fill="#f5f0de" opacity={.38}/><path d="M30,1050 H940" stroke="#8caa9a" strokeWidth={8}/></svg></Plane>
    {scene.planes.map((plane,pi)=><Plane key={pi} z={plane.z}><svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{overflow:'visible'}}>{plane.items.map((item,ii)=><Element key={item.id||ii} item={item} frame={Math.round(p*150)}/>)}</svg></Plane>)}
   </Stage3D>
   <div style={{position:'absolute',left:64,top:78,width:SAFE_RIGHT-88,fontFamily:FONT.mono,fontSize:24,color:'#374d44',letterSpacing:2}}>TEXAS AI DISPATCH</div>
   <div style={{position:'absolute',left:64,top:125,width:SAFE_RIGHT-96,fontFamily:FONT.display,fontSize:49,lineHeight:1.09,color:'#182628',fontWeight:650}}>{scene.super}</div>
   <div style={{position:'absolute',left:64,top:265,width:SAFE_RIGHT-100,fontFamily:FONT.body,fontSize:24,color:'#526b5d'}}>{scene.caption}</div>
   <div style={{position:'absolute',left:64,top:SAFE_BOTTOM-310,width:SAFE_RIGHT-105,fontFamily:FONT.mono,fontSize:19,color:'#526b5d',opacity:interpolate(f,[0,12],[0,1],{extrapolateRight:'clamp'})}}>HOUSTON · HARRIS COUNTY</div>
 </div>;
};

export const MagnetCandidateEpisode:React.FC<DispatchProps>=({scenes,captions,credits,credits_s=5})=>{
 const {fps}=useVideoConfig(); const end=Math.max(...scenes.map(s=>s.start_s+s.duration_s));
 return <>{scenes.map(s=><Sequence key={s.id} from={Math.round(s.start_s*fps)} durationInFrames={Math.max(1,Math.round(s.duration_s*fps))}><MagnetShot scene={s}/></Sequence>)}
 {captions&&<Sequence durationInFrames={Math.round(end*fps)}><SubtitleTrack cues={captions} fps={fps}/></Sequence>}
 {credits&&<Sequence from={Math.round(end*fps)} durationInFrames={Math.round(credits_s*fps)}><CreditsCard text={credits}/></Sequence>}</>;
};
