import React from 'react';
import {Sequence,useCurrentFrame,useVideoConfig} from 'remotion';
import {ReadinessAction,readinessView,readinessLayout} from './ReadinessAction';
import {actionProgress,actionWindows,requireAction} from './lib/direction';
import {CreditsCard,SubtitleTrack} from './lib/DispatchOverlays';
import {FONT} from './lib/type';
import type {DispatchProps,Scene} from './Dispatch';
import {PerspectiveCamera,Vector3} from 'three';
type ReadinessScene=Scene&{readiness_phase?:number;treatment?:'a'|'b';readiness_labels?:string[]};
export const ReadinessEpisode:React.FC<DispatchProps>=({scenes,captions=[],credits='',credits_s=5,__cinemaProofWithoutStage=false})=>{
 const {fps}=useVideoConfig(),time=useCurrentFrame()/fps;
 const end=Math.max(...scenes.map(s=>s.start_s+s.duration_s));
 const scene=(scenes.find(s=>time>=s.start_s&&time<s.start_s+s.duration_s)??scenes[scenes.length-1]) as ReadinessScene;
 const windows=actionWindows(scenes);
 const progress=(n:number)=>actionProgress(requireAction(windows,scene.visual_events![n].id??''),time);
 const view=readinessView(scene.readiness_phase??0,scene.treatment??'b');
 const layout=readinessLayout(scene.treatment??'b');
 const reviewCamera=new PerspectiveCamera(view.fov,1080/1920,.05,100);
 reviewCamera.position.set(...view.position);
 reviewCamera.lookAt(new Vector3(...view.target));
 reviewCamera.updateMatrixWorld();
 const reviewPoint=new Vector3(layout.virtual[0]-.74,layout.virtual[1]+.29,.28).project(reviewCamera);
 return <div style={{position:'absolute',inset:0,background:'#132e36',color:'#f3ebd8'}}>
 {time<end?<>
  {!__cinemaProofWithoutStage&&<ReadinessAction phase={scene.readiness_phase??scenes.indexOf(scene)} option={scene.treatment??'a'} a={progress(0)} b={progress(1)} c={progress(2)}/>}
  {!__cinemaProofWithoutStage&&scene.readiness_phase===5&&<div style={{position:'absolute',left:(reviewPoint.x+1)*540,top:(1-reviewPoint.y)*960,transform:'translate(-50%,-50%)',width:250,textAlign:'center',fontFamily:FONT.body,fontSize:34,lineHeight:1.04,color:'#fff3da'}}>Researcher<br/>review<div style={{fontSize:27,marginTop:7,color:'#f2c57c'}}>Question pending</div></div>}
  <div style={{position:'absolute',inset:'0 0 auto',height:340,background:'linear-gradient(#132e36,#132e36ee,transparent)'}}/>
  <div style={{position:'absolute',left:62,right:190,top:72,fontFamily:FONT.mono,fontSize:24}}>TEXAS AI DISPATCH</div>
  <div style={{position:'absolute',left:62,right:190,top:116,fontFamily:FONT.mono,fontSize:23}}>{scene.production_disclosure}</div>
  <div style={{position:'absolute',left:62,right:190,top:178,fontFamily:FONT.display,fontSize:48,lineHeight:1.1}}>{scene.super}</div>
  <div style={{position:'absolute',left:75,right:180,top:365,fontFamily:FONT.body,fontSize:30}}>{[0,1,7].includes(scene.readiness_phase??0)?'Virtual model. Physical trial planned':'Virtual model'}</div>
  {scene.readiness_labels&&<div style={{position:'absolute',left:75,right:180,top:1310,textAlign:'center',fontFamily:FONT.body,fontSize:32,color:'#f4d4a1'}}>{scene.readiness_labels.join('   ·   ')}</div>}
  <SubtitleTrack cues={captions} fps={fps}/>
 </>:<Sequence from={Math.round(end*fps)} durationInFrames={Math.ceil((end+credits_s)*fps)-Math.round(end*fps)}><CreditsCard text={credits}/></Sequence>}
 </div>;
};
