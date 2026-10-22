import React from 'react';
import {OffthreadVideo,Sequence,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import type {DispatchProps} from './Dispatch';
import {CinematicStage} from './lib/cinema/CinematicStage';
import {ConnectedRecords,dossierPose,paperLabelMatrix,type RecordsBeat} from './lib/production/ConnectedRecords';
import {actionProgress,actionWindows,requireAction} from './lib/direction';
import {SubtitleTrack,CreditsCard} from './lib/DispatchOverlays';
import {FONT} from './lib/type';
import type {V3} from './lib/cinema/motion';

const framing:Record<RecordsBeat,{position:V3;target:V3;fov:number}>={
 separated:{position:[.15,11,6],target:[.15,0,.45],fov:37},
 connect:{position:[.15,10.5,5.7],target:[.15,0,.10],fov:39},
 retrieve:{position:[.15,10.5,5.7],target:[.15,0,1.45],fov:39},
 answer:{position:[.15,10.5,5.7],target:[.15,0,1.45],fov:39},
};
const nativePhases=['separated','connect','retrieve','answer'];

/** One source-bound proposed workflow, with documentary evidence between its actions. */
export const ConnectedRecordsEpisode:React.FC<DispatchProps>=({scenes,captions=[],credits='',credits_s=5,native_media=[],
 __cinemaProofWithoutStage=false})=>{
 const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig(),time=frame/fps;
 const end=Math.max(...scenes.map(s=>s.start_s+s.duration_s));
 if(time>=end)return <Sequence from={Math.round(end*fps)} durationInFrames={Math.round(credits_s*fps)}><CreditsCard text={credits}/></Sequence>;
 const scene=scenes.find(s=>time>=s.start_s&&time<s.start_s+s.duration_s);
 if(!scene)throw new Error('Connected records has an uncovered scene clock');
 const phase=scene.record_phase;
 if(!phase)throw new Error('Connected records scene lacks record_phase');
 const native=nativePhases.includes(phase);
 const source=scene.camera_strategy==='sourceFootage';
 const media=scene.source_footage;
 if(source&&(native||!scene.production_disclosure||!media||
  !native_media.some(m=>m.file===media.file&&m.sha256===media.sha256)||
  media.playback_rate!==1||media.muted!==true||media.file.includes('..')||
  !/^evidence\/[A-Za-z0-9._/-]+\.(mp4|mov|webm)$/.test(media.file)||
  !['static-native/no-digital-motion','source-native/no-digital-motion'].includes(media.camera_motion)||
  !Number.isFinite(media.trim_start_s)||!Number.isFinite(media.trim_end_s)||
  media.trim_start_s<0||media.trim_end_s-media.trim_start_s<scene.duration_s-.05))
  throw new Error('Illustrative reader lacks current native media binding or disclosure');
 const items=scene.planes.flatMap(p=>p.items);
 const bound=(role:string)=>{
  const item=items.find(i=>i.id===`${scene.id}-${role}`);
  if(!item)throw new Error(`Connected records scene lacks ${role} object binding`);
  return item;
 };
 const windows=actionWindows(scenes);
 const progress=(n:number)=>actionProgress(requireAction(windows,scene.visual_events?.[n]?.id??''),time);
 if(native&&(scene.production_action!=='paper-dossier-v1'||!scene.production_disclosure||
  (scene.visual_events?.length??0)<3))throw new Error('Connected records action needs disclosure and three board events');
 if(!native&&(!scene.source_evidence?.quote||!scene.source_evidence?.attribution))
  throw new Error('Evidence scene requires its source-bound quote and attribution');
 if(!native&&(String(bound('evidence').props?.value)!==scene.source_evidence!.quote||
  String(bound('heading').props?.value)!==scene.super))
  throw new Error('Evidence object and source-bound displayed copy disagree');
 const attribution=scene.source_evidence?.attribution??'';
 const detail=scene.source_evidence?.detail??'';
 const evidenceEmphasis=phase==='limit'?progress(1):1;
 const pose=native?dossierPose({beat:phase as RecordsBeat,a:progress(0),b:progress(1),c:progress(2)}):null;
 const evidenceReveal=native?1:progress(0);
 return <div style={{position:'absolute',inset:0,background:'#10282f',color:'#eee9d8'}}>
  {source&&!__cinemaProofWithoutStage&&<Sequence from={Math.ceil(scene.start_s*fps)}
   durationInFrames={Math.ceil((scene.start_s+scene.duration_s)*fps)-Math.ceil(scene.start_s*fps)}>
   <OffthreadVideo data-record-id={bound('person').id} src={staticFile(media!.file)} trimBefore={Math.round(media!.trim_start_s*fps)}
    trimAfter={Math.ceil(media!.trim_end_s*fps)} playbackRate={1} muted
    style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'50% 50%'}}/>
  </Sequence>}
  {native&&!__cinemaProofWithoutStage&&<CinematicStage {...framing[phase as RecordsBeat]} exposure={1.06}>
   <directionalLight position={[-2,7,5]} color="#dce9df" intensity={1.4} castShadow
    shadow-mapSize={[2048,2048]} shadow-bias={-.0003}/>
   <hemisphereLight args={['#dae6dc','#223536',.5]}/>
   <ConnectedRecords beat={phase as RecordsBeat} a={progress(0)} b={progress(1)} c={progress(2)}
    ids={{well:bound('well').id!,lease:bound('lease').id!,folder:bound('folder').id!,cover:bound('cover').id!,desk:bound('desk').id!}}/>
  </CinematicStage>}
  <div style={{position:'absolute',top:0,left:0,right:0,height:410,
   background:'linear-gradient(#10282f 72%,transparent)'}}/>
  <div style={{position:'absolute',left:70,top:92,fontFamily:FONT.mono,fontSize:24,letterSpacing:2}}>{native?'TEXAS AI DISPATCH':String(bound('masthead').props?.value)}</div>
  {(native||source)&&<div style={{position:'absolute',left:70,right:178,top:145,fontFamily:FONT.body,fontSize:27,lineHeight:1.2,color:'#c8d7cb'}}>{scene.production_disclosure}</div>}
  <div data-record-id={native?undefined:bound('heading').id} style={{position:'absolute',left:70,right:178,top:222,fontFamily:FONT.display,fontSize:60,lineHeight:1.06,opacity:native?1:evidenceReveal}}>{native?scene.super:String(bound('heading').props?.value)}</div>
  {!native&&!source&&<div data-record-id={bound('attribution').id} style={{position:'absolute',left:70,right:178,top:145,fontFamily:FONT.body,fontSize:27,color:'#c8d7cb'}}>{String(bound('attribution').props?.value)}</div>}
  {native?<>
   {!__cinemaProofWithoutStage&&pose&&<svg width={width} height={height} style={{position:'absolute',inset:0,pointerEvents:'none'}}>
    {(['well','lease'] as const).map(role=><g key={role} data-record-id={bound(role).id}
     opacity={role==='lease'&&phase==='separated'?pose.reveal:1}
     transform={paperLabelMatrix(pose[role],role==='lease'&&!pose.loose?pose.fold:0,framing[phase as RecordsBeat],width,height)}>
      <text x={200} y={58} textAnchor="middle" fill="#122c30" fontFamily={FONT.display} fontSize={66}>{role==='well'?'WELL FILE':'LEASE'}</text>
    </g>)}
   </svg>}
   {phase==='answer'&&<div data-record-id={bound('evidence').id} style={{position:'absolute',left:70,right:178,top:1250,padding:'20px 24px',
    borderLeft:'5px solid #d5a664',background:'#10282f',opacity:progress(2)}}>
    <div style={{fontFamily:FONT.mono,fontSize:22,color:'#d5a664',marginBottom:12}}>COMPANY CAVEAT</div>
    <div style={{fontFamily:FONT.body,fontSize:34,lineHeight:1.2}}>{scene.source_evidence?.detail??scene.source_evidence?.quote}</div>
    <div style={{fontFamily:FONT.mono,fontSize:20,marginTop:14,color:'#c8d7cb'}}>{scene.source_evidence?.attribution}</div>
   </div>}
  </>:<div style={{position:'absolute',left:70,right:178,top:source?1080:phase==='place'?475:440,
   ...(source?{background:'rgba(8,26,32,.93)',padding:22,borderLeft:'4px solid #d5a664'}:{})}}>
   {source?<div data-record-id={bound('attribution').id} style={{fontFamily:FONT.mono,fontSize:23,color:'#c8d7cb',marginBottom:12}}>{String(bound('attribution').props?.value)}</div>:<div style={{width:90,height:5,background:'#d5a664',marginBottom:40}}/>}
   <div data-record-id={bound('evidence').id} style={{fontFamily:phase==='place'?FONT.display:FONT.body,fontSize:source?35:phase==='place'?69:phase==='limit'?64:47,lineHeight:1.22,whiteSpace:'pre-line',opacity:evidenceReveal,transform:`translateY(${(1-evidenceReveal)*18}px)`}}>{String(bound('evidence').props?.value)}</div>
   {detail&&<div style={{fontFamily:FONT.body,fontSize:31,lineHeight:1.35,color:'#c8d7cb',marginTop:30,opacity:evidenceEmphasis,clipPath:`inset(0 ${(1-evidenceEmphasis)*100}% 0 0)`,padding:'22px 20px',background:phase==='limit'?'#294246':'transparent',borderLeft:phase==='limit'?'5px solid #d5a664':undefined}}>{detail}</div>}
   <div style={{fontFamily:FONT.mono,fontSize:source?20:23,lineHeight:1.35,color:'#b5c9c3',marginTop:source?12:25}}>{attribution}</div>
  </div>}
  <SubtitleTrack cues={captions} fps={fps}/>
 </div>;
};
