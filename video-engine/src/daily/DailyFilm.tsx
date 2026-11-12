import React from 'react';
import {Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import type {DispatchProps, Scene} from '../Dispatch';
import {CreditsCard, SubtitleTrack} from '../lib/DispatchOverlays';
import {ArtDirectionProvider} from '../lib/artDirection';
import {PlaceStage} from '../modern/PlaceStage';
import type {FilmShot} from '../modern/types';
import {dailyEpisodes} from './registry';

/**
 * THE DAILY FILM (November 12th, 2026). The composition the daily routine renders.
 *
 * It takes the timed board `scripts/lean.py time` writes and nothing else: scenes and shots on the
 * narration's measured clock, the captions forced alignment produced, and the credits. It finds the
 * shot on screen, stands it in its county's region (PlaceStage), hands it to the day's episode, and
 * draws captions over it and the credits card after it.
 *
 * It asks for no receipts, hashes or review evidence. A board that names an episode the registry
 * lacks, or a region with no plate, throws with the fix in the message, because a film that renders
 * the wrong thing silently is worse than one that stops and says why.
 */
type DailyBoard = DispatchProps & {episode?: string; shots?: FilmShot[]; wall_views?: string[]};

/** A diagram or a document is not in a room. A view the board lists in `wall_views` gets plain
 * paper behind it instead of the region, so no skyline runs through thin lines and small labels. */
const WALL = 'linear-gradient(160deg, #efe8d8 0%, #ddd3bd 100%)';

const storyEnd = (scenes: Scene[]) => scenes.reduce((m, s) => Math.max(m, s.start_s + s.duration_s), 0);

export const dailyEpisodeId = (board: DailyBoard): string =>
  String(board.episode ?? board.film_direction?.episode ?? '');

export const dailyShots = (board: DailyBoard): FilmShot[] =>
  ((board.shots ?? board.film_direction?.shots ?? []) as FilmShot[]);

export const DailyFilm: React.FC<DispatchProps> = (props) => {
  const board = props as DailyBoard;
  const {fps} = useVideoConfig(), frame = useCurrentFrame(), time = frame / fps;
  const scenes = board.scenes ?? [];
  const endFrame = Math.ceil(storyEnd(scenes) * fps - 1e-6);
  const creditFrames = (board.credits ?? '').trim() ? Math.ceil((board.credits_s ?? 5) * fps) : 0;
  if (frame >= endFrame) {
    return (
      <Sequence from={endFrame} durationInFrames={Math.max(1, creditFrames)}>
        <CreditsCard text={board.credits ?? ''} />
      </Sequence>
    );
  }
  const id = dailyEpisodeId(board);
  const Episode = dailyEpisodes[id];
  if (!Episode) {
    throw new Error(`Daily episode "${id}" is not registered. Add its import and one line to ` +
      'video-engine/src/daily/registry.tsx.');
  }
  const shots = dailyShots(board);
  if (!shots.length) throw new Error('The daily board has no shots. Run scripts/lean.py time.');
  // The shot on screen is the last one that has started. No frame is ever uncovered.
  const started = shots.filter((s) => Math.round(s.start_s * fps) <= frame);
  const shot = started.length ? started[started.length - 1] : shots[0];
  const scene = scenes.find((s) => s.id === shot.scene_id) ??
    scenes.find((s) => time >= s.start_s && time < s.start_s + s.duration_s) ?? scenes[0];
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: '#0b0d14'}}>
      <ArtDirectionProvider profile={board.art_direction as never} scenes={scenes as never}>
        {(board.wall_views ?? []).includes(shot.view) ? (
          <div style={{position: 'absolute', inset: 0, background: WALL}}>
            <Episode board={board} scene={scene} shot={shot} time_s={time}
              shot_s={time - shot.start_s} variant="a" />
          </div>
        ) : (
          <PlaceStage board={board} scene={scene} shot={shot} time_s={time}>
            <Episode board={board} scene={scene} shot={shot} time_s={time}
              shot_s={time - shot.start_s} variant="a" />
          </PlaceStage>
        )}
      </ArtDirectionProvider>
      <SubtitleTrack cues={board.captions ?? []} fps={fps} />
    </div>
  );
};

/** The film's length comes from the timed board: the story to its last frame, then the credits. */
export const dailyMetadata = ({props}: {props: Record<string, unknown>}) => {
  const board = props as unknown as DailyBoard;
  const end = storyEnd(board.scenes ?? []);
  if (end <= 0) throw new Error('Daily: the board has no timed scenes, so there is nothing to render.');
  const credits = (board.credits ?? '').trim() ? Math.ceil((board.credits_s ?? 5) * 30) : 0;
  return {durationInFrames: Math.ceil(end * 30 - 1e-6) + credits};
};
