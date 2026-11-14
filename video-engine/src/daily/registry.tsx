import type React from 'react';
import type {FilmRenderProps} from '../modern/types';
import {SampleFilm} from './episodes/sample/SampleFilm';
import {EmptySeatFilm} from './episodes/2026-11-11/EmptySeatFilm';
import {BrushHidesFilm} from './episodes/2026-11-12/BrushHidesFilm';
import {BrushHidesV2} from './episodes/sample-v2/BrushHidesV2';
import {RegionsGallery} from './episodes/sample-v2/RegionsGallery';
import {CastGallery} from './episodes/sample-v2/CastGallery';
import {MachineGallery} from './episodes/sample-v2/MachineGallery';
import {PropsGallery} from './episodes/sample-v2/PropsGallery';
import {KitShelfGallery} from './episodes/sample-v2/shelf/KitGallery';
import {SensingShelfGallery} from './episodes/sample-v2/shelf/SensingGallery';
import {FootballShelfGallery} from './episodes/sample-v2/shelf/FootballGallery';
import {RoadsideShelfGallery} from './episodes/sample-v2/shelf/RoadsideGallery';
import {HometownShelfGallery} from './episodes/sample-v2/shelf/HometownGallery';
import {FloraShelfGallery} from './episodes/sample-v2/shelf/FloraGallery';
import {FaunaShelfGallery} from './episodes/sample-v2/shelf/FaunaGallery';
import {SkiesShelfGallery} from './episodes/sample-v2/shelf/SkiesGallery';
import {HomeplaceShelfGallery} from './episodes/sample-v2/shelf/HomeplaceGallery';
import {TejanoShelfGallery} from './episodes/sample-v2/shelf/TejanoGallery';
import {BlacktexasShelfGallery} from './episodes/sample-v2/shelf/BlacktexasGallery';
import {ClinicShelfGallery} from './episodes/sample-v2/shelf/ClinicGallery';
import {ComputeShelfGallery} from './episodes/sample-v2/shelf/ComputeGallery';
import {FieldsShelfGallery} from './episodes/sample-v2/shelf/FieldsGallery';
import {ScienceShelfGallery} from './episodes/sample-v2/shelf/ScienceGallery';
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
 * `look-v2-machines` stands each hero machine, library drawing or v2 by the board's look.
 * `look-v2-props` stands each common animal and prop, library drawing or v2 by the board's look.
 * `look-v2-shelf-kit` stands the kit set, library drawing or v2 by the board's look.
 * `look-v2-shelf-sensing` stands the sensing set, library drawing or v2 by the board's look.
 * `look-v2-shelf-football` stands the football set, library drawing or v2 by the board's look.
 * `look-v2-shelf-roadside` stands the roadside set, library drawing or v2 by the board's look.
 * `look-v2-shelf-hometown` stands the hometown set, library drawing or v2 by the board's look.
 * `look-v2-shelf-flora` stands the flora set, library drawing or v2 by the board's look.
 * `look-v2-shelf-fauna` stands the fauna set, library drawing or v2 by the board's look.
 * `look-v2-shelf-skies` stands the skies set, library drawing or v2 by the board's look.
 * `look-v2-shelf-homeplace` stands the homeplace set, library drawing or v2 by the board's look.
 * `look-v2-shelf-tejano` stands the tejano set, library drawing or v2 by the board's look.
 * `look-v2-shelf-blacktexas` stands the blacktexas set, library drawing or v2 by the board's look.
 * `look-v2-shelf-clinic` stands the clinic set, library drawing or v2 by the board's look.
 * `look-v2-shelf-compute` stands the compute set, library drawing or v2 by the board's look.
 * `look-v2-shelf-fields` stands the fields set, library drawing or v2 by the board's look.
 * `look-v2-shelf-science` stands the science set, library drawing or v2 by the board's look.
 * `look-v2-cast` draws the roster and every old pose and emotion, old rig or v2 by the board's look.
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
  'look-v2-cast': CastGallery,
  'look-v2-machines': MachineGallery,
  'look-v2-props': PropsGallery,
  'look-v2-shelf-kit': KitShelfGallery,
  'look-v2-shelf-sensing': SensingShelfGallery,
  'look-v2-shelf-football': FootballShelfGallery,
  'look-v2-shelf-roadside': RoadsideShelfGallery,
  'look-v2-shelf-hometown': HometownShelfGallery,
  'look-v2-shelf-flora': FloraShelfGallery,
  'look-v2-shelf-fauna': FaunaShelfGallery,
  'look-v2-shelf-skies': SkiesShelfGallery,
  'look-v2-shelf-homeplace': HomeplaceShelfGallery,
  'look-v2-shelf-tejano': TejanoShelfGallery,
  'look-v2-shelf-blacktexas': BlacktexasShelfGallery,
  'look-v2-shelf-clinic': ClinicShelfGallery,
  'look-v2-shelf-compute': ComputeShelfGallery,
  'look-v2-shelf-fields': FieldsShelfGallery,
  'look-v2-shelf-science': ScienceShelfGallery,
};
