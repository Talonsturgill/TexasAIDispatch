import type React from 'react';
import {FlyGeneFilm} from './FlyGeneFilm';
import {CoolingFilm} from './CoolingFilm';
import type {FilmRenderProps} from './types';
// A future mechanism adds an authored episode here and in the checked registry.
// Unknown episodes throw. Archived whole-episode components are never a fallback.
export const modernEpisodes:Record<string,React.FC<FilmRenderProps>>={
  'cooling-check-v2':CoolingFilm,
  'fly-gene-test-v2':FlyGeneFilm,
};
