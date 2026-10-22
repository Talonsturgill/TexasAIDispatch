import React from 'react';
import {Sequence,useCurrentFrame,useVideoConfig} from 'remotion';
import {PavementDepthAction} from './PavementDepthAction';
import {actionProgress,actionWindows,requireAction} from './lib/direction';
import {CreditsCard,SubtitleTrack} from './lib/DispatchOverlays';
import {FONT} from './lib/type';
import type {DispatchProps,Scene} from './Dispatch';
type PavementScene=Scene&{pavement_phase?:number;treatment?:'a'|'b';pavement_labels?:string[]};
export const PavementDepthEpisode:React.FC<DispatchProps>=(props)=>{
 const {scenes,captions=[],credits='',credits_s=5,__cinemaProofWithoutStage=false}=props;
 const {fps}=useVideoConfig(),time=useCurrentFrame()/fps;
 const end=Math.max(...scenes.map(s=>s.start_s+s.duration_s));
 const scene=(scenes.find(s=>time>=s.start_s&&time<s.start_s+s.duration_s)??scenes[scenes.length-1]) as PavementScene;
 const windows=actionWindows(scenes);
 const progress=(n:number)=>actionProgress(requireAction(windows,scene.visual_events![n].id??''),time);
 return <div style={{position:'absolute',inset:0,background:'#263744',color:'#eee4d1'}}>
  {time<end?<>
   {!__cinemaProofWithoutStage&&<PavementDepthAction phase={scene.pavement_phase??scenes.indexOf(scene)} option={scene.treatment??'a'} a={progress(0)} b={progress(1)} c={progress(2)}/>}
   <div style={{position:'absolute',inset:'0 0 auto',height:315,background:'linear-gradient(#18303f,#18303fee,transparent)'}}/>
   <div style={{position:'absolute',left:62,right:190,top:75,fontFamily:FONT.mono,fontSize:24}}>TEXAS AI DISPATCH</div>
   <div style={{position:'absolute',left:62,right:190,top:118,fontFamily:FONT.mono,fontSize:23}}>{scene.production_disclosure}</div>
   <div style={{position:'absolute',left:62,right:190,top:180,fontFamily:FONT.display,fontSize:45,lineHeight:1.08}}>{scene.super}</div>
   {scene.pavement_labels&&<div style={{position:'absolute',left:72,right:180,top:350,display:'flex',justifyContent:'space-between',fontFamily:FONT.body,fontSize:34}}>{scene.pavement_labels.map(label=><span key={label}>{label}</span>)}</div>}
   <SubtitleTrack cues={captions} fps={fps}/>
  </>:<Sequence from={Math.round(end*fps)} durationInFrames={Math.ceil((end+credits_s)*fps)-Math.round(end*fps)}><CreditsCard text={credits}/></Sequence>}
 </div>;
};
