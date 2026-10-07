import React from 'react';
import {Sequence,useCurrentFrame,useVideoConfig} from 'remotion';
import {RobotSafetyAction} from './RobotSafetyAction';
import {actionProgress,actionWindows,requireAction} from './lib/direction';
import {useArtDirection} from './lib/artDirection';
import {CreditsCard,SubtitleTrack} from './lib/DispatchOverlays';
import {FONT} from './lib/type';
import type {DispatchProps,Scene} from './Dispatch';
type RobotScene=Scene&{robot_safety_phase?:number;treatment?:'a'|'b';robot_safety_labels?:string[]};
export const RobotSafetyEpisode:React.FC<DispatchProps>=({scenes,captions=[],credits='',credits_s=5,__cinemaProofWithoutStage=false})=>{
 const {fps}=useVideoConfig(),time=useCurrentFrame()/fps,art=useArtDirection();
 const end=Math.max(...scenes.map(s=>s.start_s+s.duration_s));
 const scene=(scenes.find(s=>time>=s.start_s&&time<s.start_s+s.duration_s)??scenes[scenes.length-1]) as RobotScene;
 const windows=actionWindows(scenes);
 const progress=(n:number)=>actionProgress(requireAction(windows,scene.visual_events?.[n]?.id??''),time);
 const background=art?.palette.background??'#101c2d',paper=art?.palette.paper??'#eee6d3';
 return <div style={{position:'absolute',inset:0,background,color:paper}}>
 {time<end?<>
  {!__cinemaProofWithoutStage&&<RobotSafetyAction phase={scene.robot_safety_phase??([0,2,4,5,7,8][scenes.indexOf(scene)]??0)} option={scene.treatment??'a'} p0={progress(0)} p1={progress(1)} p2={progress(2)}/>}
  <div style={{position:'absolute',left:62,right:170,top:74,fontFamily:FONT.mono,fontSize:24}}>TEXAS AI DISPATCH</div>
  <div style={{position:'absolute',left:62,right:170,top:117,fontFamily:FONT.mono,fontSize:23,lineHeight:1.22}}>{scene.production_disclosure}</div>
  <div style={{position:'absolute',left:62,right:170,top:190,fontFamily:FONT.display,fontSize:51,lineHeight:1.1}}>{scene.super}</div>
  {scene.caption&&<div style={{position:'absolute',left:62,right:180,top:314,fontFamily:FONT.body,fontSize:31,lineHeight:1.25}}>{scene.caption}</div>}
  {scene.robot_safety_labels&&<div style={{position:'absolute',left:70,right:175,top:1295,fontFamily:FONT.body,fontSize:31,lineHeight:1.22,textAlign:'center'}}>{scene.robot_safety_labels.join('   /   ')}</div>}
  <SubtitleTrack cues={captions} fps={fps}/>
 </>:<Sequence from={Math.round(end*fps)} durationInFrames={Math.round(credits_s*fps)}><CreditsCard text={credits}/></Sequence>}
 </div>;
};
