import React from 'react';
import {Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {CreditsCard, SubtitleTrack} from './Dispatch';
import type {DispatchProps} from './Dispatch';
import {Element} from './lib/registry';
import {Plane, Stage3D, Camera} from './lib/stage3d';
import {actionWindows, actionProgress, requireAction} from './lib/direction';
import {GradeLayer, RegionLight} from './lib/lighting';
import {FONT} from './lib/type';

// The episode performs the contact experiment. All action and camera clocks belong to the board.
export const ContactSensingEpisode: React.FC<DispatchProps> = ({runtime_s,scenes,captions=[],credits='',credits_s=5}) => {
 const frame=useCurrentFrame(), {fps}=useVideoConfig(), t=frame/fps;
 const windows=actionWindows(scenes);
 const scene=scenes.find(s=>t>=s.start_s && t<s.start_s+s.duration_s)??scenes[scenes.length-1];
 const progress=(id:unknown)=>typeof id==='string'?actionProgress(requireAction(windows,id),t):0;
 const camera:Camera={...scene.camera_base};
 if(scene.camera_motion){const p=progress(scene.camera_motion.event_id);for(const key of ['x','y','z'] as const){camera[key]=(camera[key]??0)+(scene.camera_motion.from[key]??0)+((scene.camera_motion.to[key]??0)-(scene.camera_motion.from[key]??0))*p;}}
 const status=scene.id==='s4'?'ILLUSTRATED LIGHT RESPONSE':scene.id==='s5'||scene.id==='s6'?'COMPANY DEMO ILLUSTRATED':scene.id==='s3'||scene.id==='s7'?'APPLICATION PROPOSAL':'ORIGINAL ILLUSTRATION';
 return <div style={{position:'absolute',inset:0,background:'#211b31'}}>
 {t<runtime_s&&<><RegionLight region={scene.region}><Stage3D camera={camera} background="#211b31">
 {scene.planes.map((plane,pi)=><Plane key={pi} z={plane.z}><svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{overflow:'visible'}}>
 {plane.items.map((item,ii)=>{const props=item.props??{};return <Element key={item.id??ii} frame={frame} at={{scene:scene.id,plane:pi,item:ii}} item={{...item,props:{...props,progress:progress(props.primary_event),secondary:progress(props.secondary_event),tertiary:progress(props.tertiary_event)}}}/>;})}
 </svg></Plane>)}
 </Stage3D></RegionLight>
 <svg width={1080} height={1920} style={{position:'absolute',inset:0,pointerEvents:'none'}}><g fontFamily={FONT.mono} fontSize={24} letterSpacing={1.7} fill="#aa9dba"><text x={65} y={247}>TEXAS AI DISPATCH</text><text x={65} y={291}>{status}</text></g></svg>
 <GradeLayer f={frame} vignette={.14} grain={.028} bloom={.035}/>
 <SubtitleTrack cues={captions} fps={fps}/></>}
 <Sequence from={Math.round(runtime_s*fps)} durationInFrames={Math.round(credits_s*fps)}><CreditsCard text={credits}/></Sequence>
 </div>;
};
