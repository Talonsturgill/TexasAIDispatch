import React from 'react';
import {Sequence,useCurrentFrame,useVideoConfig} from 'remotion';
import {CoolingInspectionAction} from './CoolingInspectionAction';
import {actionProgress,actionWindows,requireAction} from './lib/direction';
import {CreditsCard,SubtitleTrack} from './lib/DispatchOverlays';
import {FONT} from './lib/type';
import {useArtDirection} from './lib/artDirection';
import type {DispatchProps,Scene} from './Dispatch';
type CoolingScene=Scene&{cooling_phase?:number;treatment?:'a'|'b';cooling_annotation?:string};
export const CoolingInspectionEpisode:React.FC<DispatchProps>=(props)=>{
 const {scenes,captions=[],credits='',credits_s=5,__cinemaProofWithoutStage=false}=props;
 const {fps}=useVideoConfig(),time=useCurrentFrame()/fps,end=Math.max(...scenes.map(s=>s.start_s+s.duration_s)),art=useArtDirection();
 const scene=(scenes.find(s=>time>=s.start_s&&time<s.start_s+s.duration_s)??scenes[scenes.length-1]) as CoolingScene;
 const phase=scene.cooling_phase??scenes.indexOf(scene),windows=actionWindows(scenes);
 const p=(n:number)=>actionProgress(requireAction(windows,scene.visual_events![n].id!),time);
 const second=requireAction(windows,scene.visual_events![1].id!),third=requireAction(windows,scene.visual_events![2].id!);
 // Reserve the same fractions of the actual stationary gap as the authored
 // hold. Read current windows, including retime rounding and duration clamps.
 const gap=third.start-second.end;
 const steeringProgress=(time-(second.end+gap*2/33))/(gap*18/33);
 const settle=(third.motion?.settle??0)*(third.end-third.start);
 const parkingProgress=settle>0?(time-(third.end-settle))/settle:time>=third.end?1:0;
 return <div style={{position:'absolute',inset:0,background:art?.palette.background??'#19333c',color:art?.palette.paper??'#f1e7ce'}}>
 {time<end?<>
 {!__cinemaProofWithoutStage&&<CoolingInspectionAction phase={phase} option={scene.treatment??'a'} steeringProgress={steeringProgress} parkingProgress={parkingProgress} a={p(0)} b={p(1)} c={p(2)}/>}
 <div style={{position:'absolute',top:0,left:0,right:0,height:340,background:'linear-gradient(#16303c,#16303ced,transparent)'}}/>
 <div style={{position:'absolute',left:62,right:190,top:75,fontFamily:FONT.mono,fontSize:24}}>TEXAS AI DISPATCH</div>
 <div style={{position:'absolute',left:62,right:190,top:120,fontFamily:FONT.body,fontSize:27}}>{scene.production_disclosure}</div>
 <div style={{position:'absolute',left:62,right:190,top:187,fontFamily:FONT.display,fontSize:45,lineHeight:1.08}}>{scene.super}</div>
 <div style={{position:'absolute',left:62,right:190,top:1240,fontFamily:FONT.body,fontSize:29,lineHeight:1.15}}>{scene.cooling_annotation}</div>
 <SubtitleTrack cues={captions} fps={fps}/>
 </>:<Sequence from={Math.round(end*fps)} durationInFrames={Math.round(credits_s*fps)}><CreditsCard text={credits}/></Sequence>}
 </div>;
};
