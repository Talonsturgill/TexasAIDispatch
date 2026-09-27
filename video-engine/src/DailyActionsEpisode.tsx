import React from 'react';
import {OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicStage} from './lib/cinema/CinematicStage';
import {StreetCapture, DocumentAccumulation, CurbCapture, ConditionSelection} from './lib/production/ProvenActions';
import {actionProgress, actionWindows, requireAction} from './lib/direction';
import {FONT} from './lib/type';
import {CreditsCard, SubtitleTrack} from './lib/DispatchOverlays';
import type {DispatchProps} from './Dispatch';

/** Small approved action vocabulary. Current story, timing and evidence still come from the board. */
export const DailyActionsEpisode: React.FC<DispatchProps> = ({
  runtime_s, scenes, captions=[], credits='', credits_s=5, native_media=[],
  __cinemaProofWithoutStage=false,
}) => {
  runtime_s=scenes.reduce((end,s)=>Math.max(end,s.start_s+s.duration_s),0);
  const frame=useCurrentFrame(), {fps}=useVideoConfig(), time=frame/fps;
  const scene=scenes.find(s=>time>=s.start_s&&time<s.start_s+s.duration_s)??scenes[scenes.length-1];
  const windows=actionWindows(scenes), local=time-scene.start_s;
  const progress=(n:number)=>actionProgress(requireAction(windows,scene.visual_events![n].id??''),time);
  const action=scene.production_action;
  const media=scene.source_footage;
  const source=scene.camera_strategy==='sourceFootage';
  if(time<runtime_s&&!source&&!['street-capture-v1','document-accumulation-v1','curb-selection-v1'].includes(action??'')){
    throw new Error('Daily action has no demonstrated component: '+action);
  }
  if(time<runtime_s&&source&&(!media||!native_media.some(m=>m.file===media.file&&m.sha256===media.sha256)||
    media.playback_rate!==1||media.muted!==true||media.file.includes('..')||
    !/^evidence\/[A-Za-z0-9._/-]+\.(mp4|mov|webm)$/.test(media.file)||
    !['static-native/no-digital-motion','source-native/no-digital-motion'].includes(media.camera_motion)||
    !Number.isFinite(media.trim_start_s)||!Number.isFinite(media.trim_end_s)||
    media.trim_start_s<0||media.trim_end_s-media.trim_start_s<scene.duration_s-.05)){
    throw new Error('Source footage lacks its current native media binding');
  }
  const capture=scene.visual_events?.[0];
  const captureWindow=capture?requireAction(windows,capture.id??''):null;
  const capturedAt=captureWindow?captureWindow.start-scene.start_s+.875*(captureWindow.end-captureWindow.start):0;
  const selection=action==='curb-selection-v1'&&local>=capturedAt+.075;
  return <div style={{position:'absolute',inset:0,background:'#17323d',color:'#eee4cb'}}>
    {time<runtime_s&&<>
      {!__cinemaProofWithoutStage&&(source?<Sequence from={Math.ceil(scene.start_s*fps)}
        durationInFrames={Math.ceil((scene.start_s+scene.duration_s)*fps)-Math.ceil(scene.start_s*fps)}>
        <OffthreadVideo src={staticFile(media!.file)} trimBefore={Math.round(media!.trim_start_s*fps)}
          trimAfter={Math.ceil(media!.trim_end_s*fps)} playbackRate={1} muted
          style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'50% 50%'}}/>
      </Sequence>:selection?<ConditionSelection scan={progress(1)} selection={progress(2)}/>:
        <CinematicStage
          position={action==='street-capture-v1'?[7,6,10]:action==='document-accumulation-v1'?[.15,4.8,5.9]:[-3.5,3.2,-6]}
          target={action==='street-capture-v1'?[-.15,-.35,.15]:action==='document-accumulation-v1'?[-.10,-.25,-.20]:[-.25,-.50,-.4]}
          fov={action==='street-capture-v1'?36:action==='document-accumulation-v1'?38:45}
          exposure={action==='curb-selection-v1'?.98:1.15}>
          <directionalLight position={action==='curb-selection-v1'?[-3,6,4]:[3,8,2]}
            intensity={action==='curb-selection-v1'?2.2:1.4} color={action==='curb-selection-v1'?'#ffe3b5':'#fff1c9'}/>
          <hemisphereLight args={['#d4e5e0','#7a7961',action==='curb-selection-v1'?.38:.75]}/>
          {action==='street-capture-v1'&&<StreetCapture a={progress(0)} b={progress(1)} c={progress(2)} d={progress(3)}
            drive={Math.min(1,local/scene.duration_s)}/>}
          {action==='document-accumulation-v1'&&<DocumentAccumulation a={progress(0)} b={progress(1)} c={progress(2)}/>}
          {action==='curb-selection-v1'&&<CurbCapture elapsed={Math.min(scene.duration_s,local)} captureAt={capturedAt}/>}
        </CinematicStage>)}
      <div style={{position:'absolute',inset:'0 0 auto',height:440,background:'linear-gradient(180deg, rgba(14,32,39,0.95), rgba(14,32,39,0.88) 70%, rgba(14,32,39,0))'}}/>
      <div style={{position:'absolute',left:70,right:180,top:93,fontFamily:FONT.mono,fontSize:25,color:'#eee4cb'}}>TEXAS AI DISPATCH</div>
      <div style={{position:'absolute',left:70,right:180,top:140,fontFamily:FONT.mono,fontSize:20,color:'#eee4cb'}}>
        {scene.production_disclosure ?? (source ? (media?.editorial_excerpt ? 'SOURCE EXCERPT' : 'ILLUSTRATIVE FOOTAGE') : 'ILLUSTRATED RECONSTRUCTION')}</div>
      <div style={{position:'absolute',left:70,right:180,top:222,fontFamily:FONT.display,fontSize:62,lineHeight:1.03,color:'#eee4cb'}}>{scene.super}</div>
      <SubtitleTrack cues={captions} fps={fps}/>
    </>}
    {time>=runtime_s&&<Sequence from={Math.round(runtime_s*fps)} durationInFrames={Math.round(credits_s*fps)}><CreditsCard text={credits}/></Sequence>}
  </div>;
};
