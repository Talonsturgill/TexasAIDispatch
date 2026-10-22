import React from 'react';
import {useCurrentFrame,useVideoConfig,Sequence} from 'remotion';
import type {DispatchProps} from './Dispatch';
import {SubtitleTrack,CreditsCard} from './Dispatch';
import {Element} from './lib/registry';
import {Stage3D,Plane} from './lib/stage3d';
import {actionWindows,requireAction,actionProgress} from './lib/direction';
import {FONT} from './lib/type';
import {pointingArm,palmPoint,castProps,FEET_Y} from './lib/Character';
import {SAFE_BOTTOM,SAFE_RIGHT} from './lib/safearea';

/** Every action uses the board clock. One persistent handoff state survives the cuts. */
export const CoadaptHandoffEpisode: React.FC<DispatchProps> = ({runtime_s,scenes,captions=[],credits='',credits_s=5}) => {
 const f=useCurrentFrame(),{fps}=useVideoConfig(),t=f/fps;
 const windows=actionWindows(scenes);
 const p=(id:string)=>actionProgress(requireAction(windows,id),t);
 const scene=scenes.find(s=>t>=s.start_s&&t<s.start_s+s.duration_s)??scenes[scenes.length-1];
 const n=scenes.indexOf(scene);
 // The cup remains in the robot's gripper until the supported transfer is complete.
 const adjust=p('arm-adjust'),transfer=p('cup-deliver'),release=p('gripper-release');
 const lower=p('reach-changes'),yielding=p('robot-yield'),finish=p('finish-hand');
 const gesture=.05+.95*p('reach-stop')-.88*lower+.6*p('support-reveal');
 const cast=castProps('resident');
 const hand=palmPoint(pointingArm(cast.build??.6,cast.age??.82,gesture));
 const handX=760-hand.x,handY=1345-FEET_Y+hand.y;
 const approach=325+60*p('reach-stop')+30*p('gap-reveal')+65*adjust;
 const cupX=approach*(1-transfer)+(handX-66)*transfer;
 const cupY=(1050-45*adjust)*(1-transfer)+(handY-35)*transfer;
 const robotX=230-90*yielding-28*finish;
 const wristX=cupX-45*release-70*yielding-25*finish;
 const wristY=cupY+30*release;
 // Framing follows a changing relationship; it does not count as an attention beat.
 const close=n===0||n===3||n===8;
 const camera={x:close?100:0,y:close?(-90):0,z:close?(n===8?530:530):100,
   rotY:n===4?(-2+4*p('home-open')):0};
 const sheetEvent=n===1?'award-enter':n===5?'frame-reveal':'page-open';
 const page=n===1||n===5||n===6?p(sheetEvent):0;
 return <div style={{position:'absolute',inset:0,background:'#e4ddc9'}}>
  {t<runtime_s&&<>
   <Stage3D camera={camera} background="#e4ddc9">
    {scene.planes.map((plane,pi)=><Plane key={pi} z={plane.z} fill={plane.items.some(i=>i.id==='room')}>
     <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{overflow:'visible'}}>
      {plane.items.map((item,ii)=>{
       let props={...(item.props??{})};let x=item.x??0,y=item.y??0;
       if(item.id==='room')props={...props,open:.65*p('room-reveal')+.35*p('home-open')};
       if(item.id==='robot'){x=robotX;props={...props,wristX,wristY,release};}
       if(item.id==='cup'){x=cupX;y=cupY;}
       if(item.id==='participant'){props={...props,gesture,emotion:n===0?'worried':n>=3?'wry':'neutral',idleGain:0,farGesture:.8*p('person-respond')*(1-transfer)+p('person-choose')};}
       if(item.id==='evidence'){y=(item.y??475)-320*(1-page);props={...props,progress:n===5?p('boundary-reveal'):page};}
       if(item.id==='door')props={...props,open:.5*p('choice-open')+.5*p('person-choose')};
       const opacity=item.id==='evidence'?page:1;
       return <g key={item.id??ii} opacity={opacity}><Element item={{...item,x,y,props}} frame={f}/></g>;
      })}
     </svg>
    </Plane>)}
   </Stage3D>
   <div style={{position:'absolute',inset:'0 0 auto',height:330,background:'linear-gradient(#e4ddc9 86%,transparent)',pointerEvents:'none'}}/>
   <div style={{position:'absolute',left:42,top:98,width:SAFE_RIGHT-70,fontFamily:FONT.body,fontSize:36,fontWeight:800,letterSpacing:1.2,color:'#344c43'}}>ILLUSTRATION / RESEARCH GOAL</div>
   <div style={{position:'absolute',left:42,top:166,width:SAFE_RIGHT-72,fontFamily:FONT.display,fontWeight:700,fontSize:58,lineHeight:1.1,color:'#243632'}}>{scene.super}</div>
   <SubtitleTrack cues={captions} fps={fps}/>
   <div style={{position:'absolute',left:0,top:SAFE_BOTTOM,width:'100%',height:1920-SAFE_BOTTOM,background:'linear-gradient(transparent,rgba(33,49,43,.3))',pointerEvents:'none'}}/>
  </>}
  {t>=runtime_s&&<Sequence from={Math.round(runtime_s*fps)} durationInFrames={Math.round(credits_s*fps)}><CreditsCard text={credits}/></Sequence>}
 </div>;
};
