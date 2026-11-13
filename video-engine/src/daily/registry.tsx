import type React from 'react';
import type {FilmRenderProps} from '../modern/types';
import {SampleFilm} from './episodes/sample/SampleFilm';
import {EmptySeatFilm} from './episodes/2026-11-11/EmptySeatFilm';
import {BrushHidesFilm} from './episodes/2026-11-12/BrushHidesFilm';
import {BrushHidesV2} from './episodes/sample-v2/BrushHidesV2';
import {RegionsGallery} from './episodes/sample-v2/RegionsGallery';
import {LeakReviewFilm} from '../modern/episodes/2026-10-21/LeakReviewFilm';

/**
 * THE DAILY LANE'S EPISODES. One import and one line per edition, added by that day's run.
 *
 * An episode is a React component taking FilmRenderProps: the timed board, the scene and shot on
 * screen, the film clock (`time_s`) and the shot clock (`shot_s`). It draws the story. The stage
 * around it (the county's region plate, captions, credits) is DailyFilm's.
 *
 * `daily-sample` is the smallest episode that renders and is the skeleton to copy.
 * `look-v2-sample-1112` redraws the first 24 seconds of brush-hides-1112 with the look v2 kit
 * (src/look/), the side by side reference for the new standard. Not an edition.
 * `look-v2-regions` stands one person in whichever of the ten v2 regions a board names, the
 * reference sheet for src/look/regions.tsx. Not an edition.
 * `reference-2026-10-21` is the last film the old lane shipped, kept here so the daily lane can be
 * rendered end to end from a real board at any time (`scripts/lean.py selftest --render`).
 */
export const dailyEpisodes: Record<string, React.FC<FilmRenderProps>> = {
  'daily-sample': SampleFilm,
  'empty-seat-1111': EmptySeatFilm,
  'brush-hides-1112': BrushHidesFilm,
  'reference-2026-10-21': LeakReviewFilm,
  'look-v2-sample-1112': BrushHidesV2,
  'look-v2-regions': RegionsGallery,
};
