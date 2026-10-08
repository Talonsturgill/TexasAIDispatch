import React from 'react';
import {Sequence,useCurrentFrame,useVideoConfig} from 'remotion';
import type {DispatchProps} from '../Dispatch';
import {CreditsCard,SubtitleTrack} from '../lib/DispatchOverlays';
import {modernEpisodes} from './registry';
import {StoryArtProvider} from './StoryArt';
import type {FilmDirection,FilmShot} from './types';

export const MODERN_EFFECTIVE_DATE='2026-10-08';
export function assertFilmRoute(board:Pick<DispatchProps,'date'|'cinematic_template'|'film_direction'>){
  if ((/^\d{4}-\d{2}-\d{2}/.test(board.date??'')&&(board.date??'')>=MODERN_EFFECTIVE_DATE)||board.film_direction){
    if(board.cinematic_template!=='directed-film-v2'||board.film_direction?.version!=='directed-film-v2'){
      throw new Error('Current production requires directed-film-v2. Legacy episodes are historical only.');
    }
    if(!modernEpisodes[board.film_direction.episode])throw new Error('Unregistered modern film episode');
  }
}
type FrameInterval={shot:FilmShot;start:number;end:number};
const frameIntervals=new WeakMap<FilmDirection,Map<number,FrameInterval[]>>();
export function filmShotAt(plan:FilmDirection,time:number,fps=30):FilmShot{
 if(!Number.isFinite(fps)||fps<=0||!Number.isFinite(time))throw new Error('Invalid modern frame clock');
 let byRate=frameIntervals.get(plan);
 if(!byRate){byRate=new Map();frameIntervals.set(plan,byRate);}
 let intervals=byRate.get(fps);
 if(!intervals){
  intervals=plan.shots.map(shot=>{
   const start=Math.round(shot.start_s*fps),end=Math.round((shot.start_s+shot.duration_s)*fps);
   if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)throw new Error('Invalid modern native shot interval');
   return {shot,start,end};
  });
  byRate.set(fps,intervals);
 }
 const frame=Math.floor(time*fps+1e-7);
 const matches=intervals.filter(row=>frame>=row.start&&frame<row.end);
 if(matches.length!==1)throw new Error(matches.length?'Modern shot timeline has overlapping native frames':'Modern shot timeline has an uncovered frame');
 return matches[0].shot;
}
export const DirectedFilm:React.FC<DispatchProps>=(board)=>{
  assertFilmRoute(board);
  const {fps}=useVideoConfig(),frame=useCurrentFrame(),time=frame/fps;
  const plan=board.film_direction!;
  const end=Math.max(...board.scenes.map(s=>s.start_s+s.duration_s));
  if(frame>=Math.round(end*fps))return <Sequence from={Math.round(end*fps)} durationInFrames={Math.round((board.credits_s??5)*fps)}><CreditsCard text={board.credits??''}/></Sequence>;
  const shot=filmShotAt(plan,time,fps);
  if(board.narration_picture){
    const active=board.narration_picture.clauses.filter(c=>time>=c.start_s&&time<c.end_s);
    const ids=(shot as FilmShot&{narration_ids?:string[]}).narration_ids??[];
    if(active.some(c=>!ids.includes(c.id)))throw new Error('Picture cut leaves its active spoken clause');
  }
  const scene=board.scenes.find(s=>s.id===shot.scene_id);
  const Episode=modernEpisodes[plan.episode];
  if(!scene||!Episode)throw new Error('Modern film scene or renderer is unavailable');
  return <div style={{position:'absolute',inset:0,overflow:'hidden'}}>
    {!board.__cinemaProofWithoutStage&&<StoryArtProvider plan={board.story_art}><Episode board={board} scene={scene} shot={shot}
      time_s={time} shot_s={time-shot.start_s} variant={plan.variant}/></StoryArtProvider>}
    <SubtitleTrack cues={board.captions??[]} fps={fps}/>
  </div>;
};
