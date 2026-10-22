import React from 'react';
import {Sequence,useCurrentFrame,useVideoConfig} from 'remotion';
import type {DispatchProps,Scene} from './Dispatch';
import {CropWaterAction} from './CropWaterAction';
import {CreditsCard,SubtitleTrack} from './lib/DispatchOverlays';
import {actionWindows,actionProgress,requireAction} from './lib/direction';
import {FONT} from './lib/type';
type CropScene=Scene&{crop_phase?:number;treatment?:'a'|'b'};
export const CropWaterEpisode:React.FC<DispatchProps>=({scenes,captions=[],credits='',credits_s=5,__cinemaProofWithoutStage=false})=>{
 const {fps}=useVideoConfig(),t=useCurrentFrame()/fps,end=Math.max(...scenes.map(s=>s.start_s+s.duration_s));
 const scene=(scenes.find(s=>t>=s.start_s&&t<s.start_s+s.duration_s)??scenes[scenes.length-1]) as CropScene;
 const phase=scene.crop_phase??scenes.indexOf(scene),windows=actionWindows(scenes);
 const p=(i:number)=>actionProgress(requireAction(windows,scene.visual_events![i].id!),t);
 const labels=['Controlled water','Different trial conditions','Below the roots','Air, ground and orbit','Combine observations','Prediction to test','Advice for growers','Savings goal'];
 return <div style={{position:'absolute',inset:0,background:'#354948',color:'#f4ead5'}}>{t<end?<>
 {!__cinemaProofWithoutStage&&<CropWaterAction phase={phase} option={scene.treatment??'a'} a={p(0)} b={p(1)} c={p(2)}/>}
 <div style={{position:'absolute',inset:'0 0 auto',height:300,background:'linear-gradient(#354948,#354948ee,transparent)'}}/>
 <div style={{position:'absolute',left:62,right:190,top:72,fontFamily:FONT.mono,fontSize:24}}>TEXAS AI DISPATCH</div>
 <div style={{position:'absolute',left:62,right:190,top:116,fontFamily:FONT.mono,fontSize:24}}>{scene.production_disclosure}</div>
 <div style={{position:'absolute',left:62,right:190,top:185,fontFamily:FONT.display,fontSize:48,lineHeight:1.1}}>{scene.super}</div>
 <div style={{position:'absolute',left:80,right:190,top:1370,fontFamily:FONT.body,fontSize:31,padding:'12px 16px',background:'#354948',color:'#ead6ac'}}>{labels[phase]}</div>
 {phase>=4&&<div style={{position:'absolute',left:80,right:190,top:330,fontFamily:FONT.mono,fontSize:27,color:'#e7ddbd'}}>Drone + ground + satellite observations</div>}
 {phase===5&&<div style={{position:'absolute',left:80,right:190,top:1260,fontFamily:FONT.mono,fontSize:25}}>Hypothetical outlines. No model output</div>}
 {phase===6&&<div style={{position:'absolute',left:80,right:190,top:1260,fontFamily:FONT.mono,fontSize:25}}>Goal only. No irrigation order</div>}
 <SubtitleTrack cues={captions} fps={fps}/>
 </>:<Sequence from={Math.round(end*fps)} durationInFrames={Math.ceil((end+credits_s)*fps)-Math.round(end*fps)}><CreditsCard text={credits}/></Sequence>}</div>;
};
