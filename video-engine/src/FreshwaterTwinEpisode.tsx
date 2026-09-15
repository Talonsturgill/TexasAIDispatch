import React from "react";
import {Sequence,useCurrentFrame,useVideoConfig} from "remotion";
import {Stage3D,Plane,CameraMoves} from "./lib/stage3d";
import {Element} from "./lib/registry";
import {FONT} from "./lib/type";
import {CreditsCard,SubtitleTrack} from "./Dispatch";
import type {DispatchProps,Scene} from "./Dispatch";
const Shot:React.FC<{scene:Scene}>=({scene})=>{
 const frame=useCurrentFrame();const {fps}=useVideoConfig();const progress=Math.min(1,frame/(scene.duration_s*fps));
 const camera=CameraMoves[scene.camera_strategy](progress);
 return <><Stage3D camera={{...camera,z:(camera.z??0)+70}} background="#f1ead8">
 {scene.planes.map((plane,pi)=><Plane z={plane.z} key={pi}><svg width={1080} height={1920} viewBox="0 0 1080 1920">{plane.items.map((item,ii)=><Element key={item.id??ii} item={{...item,props:{...item.props,progress}}} frame={frame} at={{scene:scene.id,plane:pi,item:ii}}/>)}</svg></Plane>)}
 </Stage3D><svg width={1080} height={1920} style={{position:"absolute",inset:0}}><text x={60} y={128} fontSize={28} fill="#203f3c" fontFamily={FONT.body}>TEXAS AI DOCKET</text><text x={60} y={187} fontSize={43} fill="#203f3c" fontFamily={FONT.display}>Before the trouble travels</text><text x={60} y={240} fontSize={26} fill="#52664f" fontFamily={FONT.body}>COLLEGE STATION · RESEARCH PROJECT</text></svg></>;
};
export const FreshwaterTwinEpisode:React.FC<DispatchProps>=({scenes,captions=[],runtime_s,credits="",credits_s=5})=>{const {fps}=useVideoConfig();return <>{scenes.map((scene,i)=><Sequence key={scene.id} from={Math.round(scene.start_s*fps)} durationInFrames={Math.max(1,Math.round(((scenes[i+1]?.start_s??runtime_s)-scene.start_s)*fps))}><Shot scene={scene}/></Sequence>)}<SubtitleTrack cues={captions} fps={fps}/><Sequence from={Math.round(runtime_s*fps)} durationInFrames={Math.round(credits_s*fps)}><CreditsCard text={credits}/></Sequence></>};
