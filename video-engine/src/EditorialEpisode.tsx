import React from 'react';
import {Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {DailyActionsEpisode} from './DailyActionsEpisode';
import {CreditsCard, SubtitleTrack} from './lib/DispatchOverlays';
import {FONT} from './lib/type';
import type {DispatchProps} from './Dispatch';

/** Actual source pictures and restrained evidence diagrams share the same native proof path. */
export const EditorialEpisode: React.FC<DispatchProps> = (props) => {
  const frame=useCurrentFrame(), {fps}=useVideoConfig(), time=frame/fps;
  const {scenes,captions=[],credits='',credits_s=5,native_media=[],__cinemaProofWithoutStage=false}=props;
  const end=Math.max(...scenes.map(s=>s.start_s+s.duration_s));
  const scene=scenes.find(s=>time>=s.start_s&&time<s.start_s+s.duration_s)??scenes[scenes.length-1];
  if(time<end&&!scene.picture)return <DailyActionsEpisode {...props}/>;
  const p=scene.picture;
  const event=scene.visual_events?.find(e=>e.id===p?.event_id);
  const progress=event?Math.max(0,Math.min(1,(time-scene.start_s-event.at_s)/(event.duration_s??1))):0;
  if(time<end&&(!p||!event))throw new Error('Editorial picture needs its scheduled reveal');
  if(time<end&&p?.medium!=='diagram'&&(!native_media.some(m=>m.file===p?.file&&m.sha256===p?.sha256)||
    !/^evidence\/[A-Za-z0-9._/-]+\.(png|jpg|jpeg|webp|mp4|mov|webm)$/.test(p?.file??'')||p?.file?.includes('..'))){
    throw new Error('Editorial picture is missing its inspected native source binding');
  }
  const crop=p?.crop??{x:50,y:50};
  const framing=p?.source_transform??{scale:1,translate_x:0,translate_y:0};
  const stage=p?.medium==='diagram'?{x:0,y:0,width:1080,height:1920}:(p?.source_stage??{x:60,y:300,width:830,height:940});
  return <div style={{position:'absolute',inset:0,background:'#111e25',color:'#f3ecdc'}}>
    {time<end&&p&&<>
      {!__cinemaProofWithoutStage&&<div data-picture-id={p.id} data-source-stage={p.medium!=='diagram'} style={{position:'absolute',left:stage.x,top:stage.y,width:stage.width,height:stage.height,overflow:'hidden'}}>
        <div style={{position:'absolute',left:-stage.x,top:-stage.y,width:1080,height:1920}}>
        {p.medium==='source-footage'?<Sequence from={Math.round(scene.start_s*fps)} durationInFrames={Math.round(scene.duration_s*fps)}>
          <OffthreadVideo src={staticFile(p.file!)} trimBefore={Math.round((p.trim_start_s??0)*fps)}
            muted playbackRate={1} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:`${crop.x}% ${crop.y}%`, transform:`translate(${framing.translate_x}px, ${framing.translate_y}px) scale(${framing.scale})`}}/>
        </Sequence>:p.medium!=='diagram'?<>
          <Img src={staticFile(p.file!)} style={{width:'100%',height:'100%',objectFit:p.medium==='source-excerpt'?'contain':'cover',
            objectPosition:`${crop.x}% ${crop.y}%`, transform:`translate(${framing.translate_x}px, ${framing.translate_y}px) scale(${framing.scale})`}}/>
          {p.focus&&<div style={{position:'absolute',left:`${p.focus.x}%`,top:`${p.focus.y}%`,width:`${p.focus.width*progress}%`,
            height:`${p.focus.height}%`,borderBottom:'10px solid #edb565',background:'rgba(237,181,101,0.18)'}}/>}
        </>:<svg viewBox="0 0 1080 1920" style={{width:'100%',height:'100%'}}>
          {(p.nodes??[]).map((node,i,all)=>{
            const y=410+i*295, revealed=Math.max(0,Math.min(1,p.relationship==='parallel'?progress:progress*all.length-i+1));
            return <g key={node.claim_id+String(i)} opacity={revealed}>
              {i>0&&p.relationship!=='parallel'&&<path d={`M 475 ${y-125} V ${y-103} l -10 -12 m 10 12 l 10 -12`} fill="none" stroke="#edb565" strokeWidth={5}/>}
              <rect x={65} y={y-100} width={820} height={270} rx={12} fill="#243c44" stroke="#839a99" strokeWidth={2}/>
              <text x={475} y={y+48} textAnchor="middle" fontFamily={FONT.body} fontSize={42} fill="#f3ecdc">{node.label}</text>
            </g>;
          })}
        </svg>}
        </div>
      </div>}
      <div style={{position:'absolute',left:0,right:0,top:0,height:280,background:'#111e25'}}/>
      <div style={{position:'absolute',left:62,right:190,top:83,fontFamily:FONT.mono,fontSize:23}}>TEXAS AI DISPATCH</div>
      <div style={{position:'absolute',left:62,right:190,top:132,fontFamily:FONT.mono,fontSize:27}}>{scene.production_disclosure ?? p.disclosure}</div>
      {p.attribution&&<div style={{position:'absolute',left:62,right:190,top:178,fontFamily:FONT.mono,fontSize:27}}>{p.attribution}</div>}
      <SubtitleTrack cues={captions} fps={fps}/>
    </>}
    {time>=end&&<Sequence from={Math.round(end*fps)} durationInFrames={Math.round(credits_s*fps)}><CreditsCard text={credits}/></Sequence>}
  </div>;
};
