import React from 'react';
import {FONT} from '../../../lib/type';
import {actionProgress, actionWindows, type DirectedScene} from '../../../lib/direction';
import {PlaceSubject} from '../../../modern/PlaceStage';
import type {FilmRenderProps} from '../../../modern/types';

/**
 * daily-sample: the smallest daily episode that renders, and the skeleton to copy.
 *
 * What an episode gets: `board` (the timed board), `scene` and `shot` (what is on screen now),
 * `time_s` (the film clock) and `shot_s` (seconds into this shot). What it must do:
 *
 *  - Draw one picture per `shot.view`. A view is a camera position on the story's action.
 *  - Drive every movement from the clocks or from a board event window (`actionWindows`), never
 *    from a wall clock or random input, so any frame renders alone and the same twice.
 *  - Leave the frame's background alone outdoors. DailyFilm stands the shot in its county's region
 *    plate, and `PlaceSubject` seats a drawing on that plate's ground at a frame row.
 *  - Keep clear of the caption band at the bottom and the feed overlay at the top
 *    (lib/safearea.ts has the numbers).
 *
 * A real episode replaces the sign below with the story's own subject and action. The films under
 * src/modern/episodes/ are full examples of the same component contract.
 */
export const SampleFilm: React.FC<FilmRenderProps> = ({board, scene, shot, time_s, shot_s}) => {
  const windows = actionWindows(board.scenes as DirectedScene[]);
  const event = windows[shot.event_id];
  const p = event ? actionProgress(event, time_s) : Math.min(1, shot_s / Math.max(0.1, shot.duration_s));
  const close = shot.framing === 'close' || shot.framing === 'detail';
  const w = close ? 760 : 560, h = close ? 420 : 320, x = (1080 - w) / 2, baseY = 1180;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <PlaceSubject baseY={baseY}>
        {/* two posts and a hand-lettered sign, leaning a little, because nothing is symmetric */}
        <g transform={`rotate(-1.2 540 ${baseY})`}>
          <rect x={x + 60} y={baseY - h - 40} width={18} height={h + 40} fill="#5b4632" />
          <rect x={x + w - 84} y={baseY - h - 28} width={18} height={h + 28} fill="#4f3c2a" />
          <rect x={x} y={baseY - h - 120} width={w} height={h} rx={10} fill="#efe6d2"
            stroke="#2a2622" strokeWidth={6} />
          <text x={x + 36} y={baseY - h - 40} fontFamily={FONT.display} fontWeight={700}
            fontSize={close ? 64 : 48} fill="#2a2622">{String(board.title ?? 'Texas AI Dispatch').slice(0, 22)}</text>
          <text x={x + 36} y={baseY - h + 30} fontFamily={FONT.mono} fontSize={26} letterSpacing={2}
            fill="#8a5a36">{`${scene.county ?? ''} COUNTY`.toUpperCase()}</text>
          {/* the one performed action: a bar that fills over the shot's event window */}
          <rect x={x + 36} y={baseY - 190} width={w - 72} height={22} rx={11} fill="#d8cdb6" />
          <rect x={x + 36} y={baseY - 190} width={(w - 72) * p} height={22} rx={11} fill="#c8703a" />
        </g>
      </PlaceSubject>
    </svg>
  );
};
