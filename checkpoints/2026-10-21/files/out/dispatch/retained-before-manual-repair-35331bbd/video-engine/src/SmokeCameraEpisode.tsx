import React from 'react';
import {Sequence,useCurrentFrame,useVideoConfig} from 'remotion';
import {SmokeCameraAction} from './SmokeCameraAction';
import {actionProgress,actionWindows,requireAction} from './lib/direction';
import {CreditsCard,SubtitleTrack} from './lib/DispatchOverlays';
import {FONT} from './lib/type';
import type {DispatchProps} from './Dispatch';

export const SmokeCameraEpisode:React.FC<DispatchProps>=(props)=>{
 const {scenes,captions=[],credits='',credits_s=5,__cinemaProofWithoutStage=false}=props;
 const {fps}=useVideoConfig(),frame=useCurrentFrame(),time=frame/fps;
 const end=Math.max(...scenes.map(s=>s.start_s+s.duration_s));
 const scene=scenes.find(s=>time>=s.start_s&&time<s.start_s+s.duration_s)??scenes[scenes.length-1];
 const idx=scenes.indexOf(scene), windows=actionWindows(scenes);
 const p=(n:number)=>actionProgress(requireAction(windows,scene.visual_events![n].id!),time);
 const option=(scene as unknown as {treatment:string}).treatment;
 // Picture labels are bound to each treatment's actual objects.
 const labels=scene.planes.flatMap(pl=>pl.items).map(it=>(it.props as {label?:string})?.label??'').filter(Boolean);
 return <div style={{position:'absolute',inset:0,background:option==='b'?'#20343c':'#9b8c75',color:'#f5efd9'}}>
 {time<end?<>
 {!__cinemaProofWithoutStage&&<SmokeCameraAction phase={idx} option={option} a={p(0)} b={p(1)} c={p(2)}/>}
 <div style={{position:'absolute',top:0,left:0,right:0,height:270,background:'linear-gradient(#152d36,rgba(21,45,54,.87),transparent)'}}/>
 <div style={{position:'absolute',left:62,right:190,top:82,fontFamily:FONT.mono,fontSize:24}}>TEXAS AI DISPATCH</div>
 <div style={{position:'absolute',left:62,right:190,top:126,fontFamily:FONT.mono,fontSize:24}}>{scene.production_disclosure}</div>
 <div style={{position:'absolute',left:62,right:190,top:187,fontFamily:FONT.display,fontSize:45,lineHeight:1.08}}>{scene.super}</div>
 {idx>=3&&idx!==5&&(!(idx===3||idx===6)||(p(0)===1&&p(1)===1))&&<div style={{position:'absolute',top:420,left:125,right:220,display:'flex',justifyContent:'space-around',gap:48,fontFamily:FONT.body,fontSize:34,fontWeight:700,lineHeight:1.15}}>
 {labels.slice(1,3).map((label,i)=><div key={i} style={{width:'46%',textAlign:'center',color:i?'#f3c373':'#eee8cf',background:'rgba(20,43,49,.85)',padding:'12px 8px'}}>{label}</div>)}
 </div>}
 {idx===5&&<div style={{position:'absolute',top:1100,left:135,right:220,fontFamily:FONT.body,fontSize:34,textAlign:'center',background:'rgba(20,43,49,.85)',padding:12}}>Illustrated possible-image review. Response unproved.</div>}
 <SubtitleTrack cues={captions} fps={fps}/>
 </>:<Sequence from={Math.round(end*fps)} durationInFrames={Math.round(credits_s*fps)}><CreditsCard text={credits}/></Sequence>}
 </div>;
};
