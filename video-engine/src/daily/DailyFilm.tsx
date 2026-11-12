import React from 'react';
import {Sequence, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {DispatchProps, Scene} from '../Dispatch';
import {CreditsCard, SubtitleTrack} from '../lib/DispatchOverlays';
import {ArtDirectionProvider} from '../lib/artDirection';
import {FONT, wrapToWidth} from '../lib/type';
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

/**
 * THE LABEL CHIP. The sibling Alaska film puts a boxed label on nearly every beat: the number, the
 * name, the date the narration just said. A muted viewer reads the story off them. The first Texas
 * daily film had none. A board event that carries `label` gets one here, so every film has the
 * layer and every chip looks the same: it pops in on the event and holds until the next labelled
 * event or the end of its scene.
 */
type LabelledEvent = {id?: string; at_s: number; duration_s?: number; label?: string};
const CHIP_Y = 268, CHIP_MAX_W = 780, CHIP_SIZE = 40;

const LabelChip: React.FC<{scene: Scene; time: number; fps: number}> = ({scene, time, fps}) => {
  const events = ((scene.visual_events ?? []) as LabelledEvent[]).filter((e) => (e.label ?? '').trim());
  const local = time - scene.start_s;
  const live = events.filter((e) => e.at_s <= local);
  if (!live.length) return null;
  const event = live[live.length - 1];
  const text = String(event.label).trim().toUpperCase();
  const lines = wrapToWidth(text, (CHIP_MAX_W - 56) * 0.72, CHIP_SIZE, true).slice(0, 2)   // mono runs wide;
  const pop = spring({frame: Math.round((local - event.at_s) * fps), fps, config: {damping: 11, stiffness: 170}});
  const height = 26 + lines.length * (CHIP_SIZE + 8);
  return (
    <div style={{position: 'absolute', left: 64, top: CHIP_Y, transformOrigin: '0 50%',
      transform: `scale(${0.6 + 0.4 * pop}) rotate(${(1 - pop) * -4 - 1}deg)`, opacity: Math.min(1, pop * 1.6),
      background: '#f4ecd8', border: '5px solid #1d1a17', borderRadius: 8, boxShadow: '7px 8px 0 rgba(20,16,12,.55)',
      padding: '10px 26px 12px', maxWidth: CHIP_MAX_W, height}}>
      {lines.map((line, i) => (
        <div key={i} style={{fontFamily: FONT.mono, fontWeight: 700, fontSize: CHIP_SIZE, letterSpacing: 2,
          lineHeight: `${CHIP_SIZE + 8}px`, color: '#1d1a17', whiteSpace: 'pre'}}>{line}</div>
      ))}
    </div>
  );
};

/** No frame is ever a held slide. Every shot gets a slow push, the picture and its place together. */
const PUSH = 0.055;
const pushScale = (shot: FilmShot, time: number) => {
  const u = Math.min(1, Math.max(0, (time - shot.start_s) / Math.max(0.5, shot.duration_s)));
  return 1 + PUSH * (u * u * (3 - 2 * u));
};

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
      <div style={{position: 'absolute', inset: 0, transformOrigin: '50% 42%',
        transform: `scale(${pushScale(shot, time)})`}}>
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
      </div>
      <LabelChip scene={scene} time={time} fps={fps} />
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
