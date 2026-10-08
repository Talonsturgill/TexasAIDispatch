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
export function filmShotAt(plan:FilmDirection,time:number):FilmShot{
  const shot=plan.shots.find(s=>time>=s.start_s&&time<s.start_s+s.duration_s);
  if(!shot)throw new Error('Modern shot timeline has an uncovered frame');
  return shot;
}
export const DirectedFilm:React.FC<DispatchProps>=(board)=>{
  assertFilmRoute(board);
  const {fps}=useVideoConfig(),time=useCurrentFrame()/fps;
  const plan=board.film_direction!;
  const end=Math.max(...board.scenes.map(s=>s.start_s+s.duration_s));
  if(time>=end)return <Sequence from={Math.round(end*fps)} durationInFrames={Math.round((board.credits_s??5)*fps)}><CreditsCard text={board.credits??''}/></Sequence>;
  const shot=filmShotAt(plan,time);
  const scene=board.scenes.find(s=>s.id===shot.scene_id);
  const Episode=modernEpisodes[plan.episode];
  if(!scene||!Episode)throw new Error('Modern film scene or renderer is unavailable');
  return <div style={{position:'absolute',inset:0,overflow:'hidden'}}>
    {!board.__cinemaProofWithoutStage&&<StoryArtProvider plan={board.story_art}><Episode board={board} scene={scene} shot={shot}
      time_s={time} shot_s={time-shot.start_s} variant={plan.variant}/></StoryArtProvider>}
    <SubtitleTrack cues={board.captions??[]} fps={fps}/>
  </div>;
};
