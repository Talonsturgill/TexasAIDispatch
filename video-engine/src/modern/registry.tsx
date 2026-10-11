import type React from 'react';
import {FlyGeneFilm} from './FlyGeneFilm';
import {CoolingFilm} from './CoolingFilm';
import {FreightFilm} from './FreightFilm';
import {ClinicAnswerFilm} from './episodes/2026-10-09-claude-pilot/ClinicAnswerFilm';
import {TowerAlertFilm} from './episodes/2026-10-11/TowerAlertFilm';
import type {FilmRenderProps} from './types';
// A future mechanism adds an authored episode here and in the checked registry.
// Unknown episodes throw. Archived whole-episode components are never a fallback.
const authoredEpisodes={
  'cooling-check-v2':CoolingFilm,
  'fly-gene-test-v2':FlyGeneFilm,
  'freight-customer-v2':FreightFilm,
  'clinic-answer-v1':ClinicAnswerFilm,
  'tower-alert-v1':TowerAlertFilm,
} satisfies Record<string,React.FC<FilmRenderProps>>;
export const modernEpisodes:typeof authoredEpisodes & Partial<Record<string,React.FC<FilmRenderProps>>>=authoredEpisodes;
