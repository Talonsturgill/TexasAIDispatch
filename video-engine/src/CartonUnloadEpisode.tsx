import React from "react";
import {Sequence,useCurrentFrame,useVideoConfig} from "remotion";
import {CartonUnloadAction} from "./CartonUnloadAction";
import {actionProgress,actionWindows,requireAction} from "./lib/direction";
import {CreditsCard,SubtitleTrack} from "./lib/DispatchOverlays";
import {FONT} from "./lib/type";
import type {DispatchProps,Scene} from "./Dispatch";
import {directedShot,useArtDirection} from './lib/artDirection';
import {CartonIllustratedAction} from './lib/production/CartonIllustratedAction';
// The qualitative relation reaches an exposed wall patch. Its disclosure describes illustrative geometry, never measured sensor output.
type CartonScene=Scene&{carton_phase?:number;treatment?:"a"|"b"};
export const CartonUnloadEpisode:React.FC<DispatchProps>=({scenes,captions=[],credits="",credits_s=5,cinematic_template,__cinemaProofWithoutStage=false})=>{
 const {fps}=useVideoConfig(),time=useCurrentFrame()/fps,end=Math.max(...scenes.map(s=>s.start_s+s.duration_s));
 const art=useArtDirection();
 const scene=(scenes.find(s=>time>=s.start_s&&time<s.start_s+s.duration_s)??scenes[scenes.length-1]) as CartonScene;
 const phase=scene.carton_phase??scenes.indexOf(scene),windows=actionWindows(scenes);
 const p=(n:number)=>actionProgress(requireAction(windows,scene.visual_events![n].id??""),time);
 const background=art?.palette.background??'#20383e',ink=art?.palette.ink??'#f4ead5';
 return <div style={{position:"absolute",inset:0,background,color:ink}}>{time<end?<>
 {!__cinemaProofWithoutStage&&(cinematic_template==='carton-unload-illustrated-v1'?<CartonIllustratedAction phase={phase} a={p(0)} b={p(1)} c={p(2)} sceneId={scene.id}/>:<CartonUnloadAction phase={phase} option={scene.treatment??"a"} a={p(0)} b={p(1)} c={p(2)} shot={directedShot(art,scene.id,windows,time)}/>)}
 <div style={{position:"absolute",inset:"0 0 auto",height:330,background:`linear-gradient(${background},${background}ee,transparent)`}}/>
 <div style={{position:"absolute",left:62,right:190,top:72,fontFamily:FONT.mono,fontSize:24}}>TEXAS AI DISPATCH</div>
 <div style={{position:"absolute",left:62,right:190,top:116,fontFamily:FONT.mono,fontSize:23}}>{scene.production_disclosure}</div>
 <div style={{position:"absolute",left:62,right:190,top:185,fontFamily:FONT.display,fontSize:48,lineHeight:1.1}}>{scene.super}</div>
 {phase===4&&<div style={{position:"absolute",left:85,right:190,top:1200,fontFamily:FONT.body,fontSize:28,color:"#90e3d8",background:"#20383e",padding:"10px 16px",zIndex:4}}>Illustrative geometry. No measured output</div>}
 {phase===5&&<div style={{position:"absolute",left:85,right:190,top:1200,fontFamily:FONT.body,fontSize:28,color:"#90e3d8",background:"#20383e",padding:"10px 16px",zIndex:4}}>Illustrative path. No measured trajectory</div>}
 {phase===6&&<div style={{position:"absolute",left:85,right:190,top:1090,fontFamily:FONT.body,fontSize:36,color:"#edc784",background:"#20383e",padding:"14px 20px",zIndex:4}}><svg width={90} height={90} viewBox="0 0 90 90" style={{verticalAlign:"middle",marginRight:18}}><path d="M18 49V39a27 27 0 0 1 54 0v10 M18 43h9v23h-9z M63 43h9v23h-9z M72 65q0 12-20 12" fill="none" stroke="#edc784" strokeWidth="7"/><circle cx="47" cy="77" r="5" fill="#edc784"/></svg>Remote assistance<div style={{fontSize:27,marginTop:9}}>Editorial boundary. No control screen shown</div></div>}
 <SubtitleTrack cues={captions} fps={fps}/>
 </>:<Sequence from={Math.round(end*fps)} durationInFrames={Math.ceil((end+credits_s)*fps)-Math.round(end*fps)}><CreditsCard text={credits}/></Sequence>}</div>;
};
