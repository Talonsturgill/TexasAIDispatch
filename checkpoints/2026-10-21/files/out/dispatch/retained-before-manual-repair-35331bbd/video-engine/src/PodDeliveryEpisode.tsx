import React from 'react';
import {Sequence,useCurrentFrame,useVideoConfig} from 'remotion';
import {PodDeliveryAction} from './PodDeliveryAction';
import {actionProgress,actionWindows,requireAction} from './lib/direction';
import {CreditsCard,SubtitleTrack} from './lib/DispatchOverlays';
import {FONT} from './lib/type';
import type {DispatchProps,Scene} from './Dispatch';

type PodScene=Scene&{pod_phase?:number;treatment?:'a'|'b';pod_annotation?:string;pod_limit_labels?:{proposal:string;approval:string;comment?:string}};
export const PodDeliveryEpisode:React.FC<DispatchProps>=(props)=>{
 const {scenes,captions=[],credits='',credits_s=5,__cinemaProofWithoutStage=false}=props;
 const {fps}=useVideoConfig(),time=useCurrentFrame()/fps;
 const end=Math.max(...scenes.map(s=>s.start_s+s.duration_s));
 const scene=(scenes.find(s=>time>=s.start_s&&time<s.start_s+s.duration_s)??scenes[scenes.length-1]) as PodScene;
 const phase=scene.pod_phase??scenes.indexOf(scene),option=scene.treatment??'a';
 const windows=actionWindows(scenes);
 const progress=(n:number)=>{
  const id=scene.visual_events?.[n]?.id;
  if(!id)throw new Error('Pod delivery scene requires three bound action events');
  return actionProgress(requireAction(windows,id),time);
 };
 return <div style={{position:'absolute',inset:0,background:option==='b'?'#223a46':'#c2c9bf',color:'#efe8d7'}}>
  {time<end?<>
   {!__cinemaProofWithoutStage&&<PodDeliveryAction phase={phase} option={option} a={progress(0)} b={progress(1)} c={progress(2)}/>}
   <div style={{position:'absolute',top:0,left:0,right:0,height:320,background:'linear-gradient(#18313e,#18313ef2,transparent)'}}/>
   <div style={{position:'absolute',left:62,right:190,top:77,fontFamily:FONT.mono,fontSize:24,letterSpacing:1}}>TEXAS AI DISPATCH</div>
   <div style={{position:'absolute',left:62,right:190,top:122,fontFamily:FONT.mono,fontSize:24,lineHeight:1.2}}>{scene.production_disclosure}</div>
   <div style={{position:'absolute',left:62,right:190,top:187,fontFamily:FONT.display,fontSize:45,lineHeight:1.08}}>{scene.super}</div>
   {scene.pod_annotation&&<div style={{position:'absolute',left:80,right:190,top:phase===3?1260:350,fontFamily:FONT.body,fontSize:32,lineHeight:1.15,whiteSpace:'pre-line',color:option==='b'?'#efe8d7':'#203744'}}>{scene.pod_annotation}</div>}
   {(phase===5||phase===6)&&scene.pod_limit_labels&&<>
    <div style={{position:'absolute',left:95,top:970,width:360,fontFamily:FONT.body,fontSize:30,lineHeight:1.1,color:option==='b'?'#efe8d7':'#203744'}}>{scene.pod_limit_labels.proposal}</div>
    <div style={{position:'absolute',left:545,top:880,width:300,fontFamily:FONT.body,fontSize:30,lineHeight:1.1,color:option==='b'?'#efe8d7':'#203744'}}>{scene.pod_limit_labels.approval}</div>
    {phase===6&&scene.pod_limit_labels.comment&&<div style={{position:'absolute',left:95,top:1260,width:500,fontFamily:FONT.body,fontSize:30,lineHeight:1.1,color:option==='b'?'#efe8d7':'#203744'}}>{scene.pod_limit_labels.comment}</div>}
   </>}
   <SubtitleTrack cues={captions} fps={fps}/>
  </>:<Sequence from={Math.round(end*fps)} durationInFrames={Math.round(credits_s*fps)}><CreditsCard text={credits}/></Sequence>}
 </div>;
};
