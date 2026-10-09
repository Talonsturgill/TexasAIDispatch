import type React from 'react';
import {FlyGeneFilm} from './FlyGeneFilm';
import {CoolingFilm} from './CoolingFilm';
import {FreightFilm} from './FreightFilm';
import type {FilmRenderProps} from './types';
// A future mechanism adds an authored episode here and in the checked registry.
// Unknown episodes throw. Archived whole-episode components are never a fallback.
const authoredEpisodes={
  'cooling-check-v2':CoolingFilm,
  'fly-gene-test-v2':FlyGeneFilm,
  'freight-customer-v2':FreightFilm,
} satisfies Record<string,React.FC<FilmRenderProps>>;
export const modernEpisodes:typeof authoredEpisodes & Partial<Record<string,React.FC<FilmRenderProps>>>=authoredEpisodes;
