import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import type {DispatchProps} from './Dispatch';
import {SubtitleTrack,CreditsCard} from './Dispatch';
import {Element} from './lib/registry';
import {actionWindows,actionProgress,requireAction} from './lib/direction';
import {castProps,pointingArm,palmPoint,FEET_Y} from "./lib/Character";
import {FONT} from './lib/type';
import {SAFE_RIGHT} from './lib/safearea';
import {RegionLight} from './lib/lighting';
export const ScrewwormForecastEpisode:React.FC<DispatchProps>=(props)=>{
 const frame=useCurrentFrame();const {fps}=useVideoConfig();const t=frame/fps;
 const {scenes,runtime_s,captions,credits,credits_s}=props;
 const windows=actionWindows(scenes);const scene=scenes.find(s=>t>=s.start_s&&t<s.start_s+s.duration_s)??scenes[scenes.length-1];
 const events=scene.visual_events??[];const values=events.map(e=>actionProgress(requireAction(windows,e.id!),Math.min(t,runtime_s)));
 return <div style={{width:'100%',height:'100%',background:'#efe8d4'}}>
 <svg width="1080" height="1920" viewBox="0 0 1080 1920">
 <defs><linearGradient id="screw-paper" x2="0" y2="1"><stop stopColor="#f4eedc"/><stop offset="1" stopColor="#d0c8ad"/></linearGradient><pattern id="screw-grain" width="23" height="29" patternUnits="userSpaceOnUse"><circle cx="3" cy="8" r="1" fill="#142e34" opacity=".08"/><path d="M13 21h4" stroke="#142e34" opacity=".04"/></pattern></defs>
 <rect width="1080" height="1920" fill="url(#screw-paper)"/><rect width="1080" height="1920" fill="url(#screw-grain)"/>
 <RegionLight region={scene.region}>
 {scene.planes.flatMap(p=>p.items).map(item=>{
  const a=values[0]??0,b=values[1]??0,c=values[2]??0;
  let additions:Record<string,unknown>={a,b,c};
  if(item.id==='researcher') additions={gesture:b};
  if(item.id==='rancher') {
   const gesture=a*.75+b*.25;
   const cast=castProps("rancher");
   const palm=palmPoint(pointingArm(cast.build??.5,cast.age??.4,gesture));
   const x=item.x??0,y=item.y??0;
   return <g key={item.id} transform={`rotate(${5*a*(1-b)} ${x} ${y})`}>
    <Element item={{...item,props:{...item.props,gesture,idleGain:0}}} frame={frame}/>
    <g opacity={b} transform={`translate(${x+palm.x} ${y-FEET_Y+palm.y}) rotate(-14)`}>
     <rect x={-23} y={-48} width={46} height={76} rx={7} fill="#142e34"/>
     <rect x={-16} y={-39} width={32} height={48} fill="#35b8b0"/>
    </g>
   </g>;
  }
  return <Element key={item.id} item={{...item,props:{...item.props,...additions}}} frame={frame}/>;
 })}
 </RegionLight>
 </svg>
 <SubtitleTrack cues={captions??[]} fps={fps}/>
 {t>=runtime_s&&<CreditsCard text={credits??''}/>}
 </div>;
};
