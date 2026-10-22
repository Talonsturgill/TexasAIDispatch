import React from 'react';
import {Sequence,useCurrentFrame,useVideoConfig} from 'remotion';
import type {DispatchProps,Scene} from './Dispatch';
import {CreditsCard,SubtitleTrack} from './Dispatch';
import {Stage3D,Plane,Camera} from './lib/stage3d';
import {Element} from './lib/registry';
import {FONT} from './lib/type';
import {actionWindows,actionProgress,requireAction} from './lib/direction';

// One storyboard clock drives both performed subjects and the review seek targets.
// The cutaways illustrate a proposal. No bore dimension or signal is measured project data.
export const MineralProvingGroundEpisode: React.FC<DispatchProps>=({scenes,captions=[],credits='',credits_s=5})=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),time=frame/fps;
 const end=Math.max(...scenes.map(s=>s.start_s+s.duration_s));
 const windows=actionWindows(scenes);
 const index=Math.max(0,scenes.findIndex(s=>time>=s.start_s&&time<s.start_s+s.duration_s));
 const scene=scenes[index];
 const shot=(s:Scene,opacity:number)=>{
  const local=Math.max(0,Math.min(1,(time-s.start_s)/s.duration_s));
  const camera:Camera=s.camera_strategy==='craneDown'?{y:-7+local*14,rotX:.6}:
    s.camera_strategy==='riseWith'?{y:7-local*14}:
    s.camera_strategy==='truckAcross'?{x:-9+local*18,rotY:-.6+local*1.2}:
    s.camera_strategy==='orbitReveal'?{rotY:-1.7+local*3.4}:{z:local*11};
  const actions:Record<string,number>={a:0,b:0,c:0};
  for(const event of s.visual_events??[]){
   const typed=event as typeof event&{slot?:string};
   if(typed.id&&typed.slot)actions[typed.slot]=actionProgress(requireAction(windows,typed.id),time);
  }
  return <div key={s.id} style={{position:'absolute',inset:0,opacity}}>
   <Stage3D camera={camera} background="#15282e">
    {s.planes.map((plane,pi)=><Plane key={pi} z={plane.z}><svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{overflow:'visible'}}>
     {plane.items.map((item,ii)=><Element key={item.id??ii} item={{...item, props:{...item.props,...(item.kind==='provingGroundRig'?actions:{}),frame}}}
      frame={frame} at={{scene:s.id,plane:pi,item:ii}}/>)}
    </svg></Plane>)}
   </Stage3D>
  </div>;
 };
 const dissolve=Number((scene as Scene&{transition_s?:number}).transition_s??.24);
 const entry=Math.max(0,Math.min(1,(time-scene.start_s)/dissolve));
 return <div style={{position:'absolute',inset:0,background:'#15282e'}}>
  {time<end&&<>
   {index>0&&entry<1&&shot(scenes[index-1],1)}
   {shot(scene,index===0?1:entry)}
   <svg width={1080} height={1920} style={{position:'absolute',inset:0,pointerEvents:'none'}}>
    <text x={70} y={113} fill="#ed9859" fontFamily={FONT.mono} fontSize={27} letterSpacing={3}>ILLUSTRATED PROPOSAL</text>
    <text x={70} y={178} fill="#f2e7ce" fontFamily={FONT.display} fontSize={49}>The rock goes in</text>
    <path d="M70 223 H290" stroke="#ed9859" strokeWidth={4}/>
   </svg>
   <SubtitleTrack cues={captions} fps={fps}/>
  </>}
  {credits&&<Sequence from={Math.round(end*fps)} durationInFrames={Math.round(credits_s*fps)}><CreditsCard text={credits}/></Sequence>}
 </div>;
};
