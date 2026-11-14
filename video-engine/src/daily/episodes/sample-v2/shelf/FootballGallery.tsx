import React from 'react';
import {useCurrentFrame} from 'remotion';
import {FONT} from '../../../../lib/type';
import type {FilmRenderProps} from '../../../../modern/types';
import {
  BlockingSled, ChainGang, DrillTeam, EndZonePylon, Football, FootballAnnual, GrandstandBowl, Helmet, LettermanJacket, Official,
  Scoreboard, ShoulderPads, Trophy, WaterCooler,
} from '../../../../lib/football';
import {
  BlockingSledV2, ChainGangV2, DrillTeamV2, EndZonePylonV2, FootballAnnualV2, FootballV2, GrandstandBowlV2, HelmetV2,
  LettermanJacketV2, OfficialV2, ScoreboardV2, ShoulderPadsV2, TrophyV2, WaterCoolerV2,
} from '../../../../look/shelf/football';
import {lookActive} from '../../../../look/tokens';

/**
 * look-v2-shelf-football (written November 13th, 2026). The before and after sheet for the football set.
 * Each cell stands one drawing on a ground line, the library's under the old look and the v2 drawing
 * under the new, at the same x, y and scale. Eight cells to a page, a page a second. Not an edition.
 */
type Draw = (f: number, x: number, y: number, s: number) => React.ReactNode;
type Cell = {name: string; s: number; ox?: number; old: Draw; v2: Draw};
const CELLS: Cell[] = [
  {name: 'helmet', s: 1.75, ox: -20, old: (f, x, y, s) => <Helmet x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <HelmetV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'football', s: 2.9, old: (f, x, y, s) => <Football x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <FootballV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'shoulder pads', s: 1.55, old: (f, x, y, s) => <ShoulderPads x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <ShoulderPadsV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'scoreboard', s: 0.13, old: (f, x, y, s) => <Scoreboard x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <ScoreboardV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'chain gang', s: 0.24, ox: -50, old: (f, x, y, s) => <ChainGang x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <ChainGangV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'blocking sled', s: 0.42, old: (f, x, y, s) => <BlockingSled x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <BlockingSledV2 frame={f} x={x} y={y} scale={s} coach />},
  {name: 'water cooler', s: 0.9, old: (f, x, y, s) => <WaterCooler x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <WaterCoolerV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'drill team', s: 0.27, old: (f, x, y, s) => <DrillTeam x={x} y={y} scale={s} count={4} spread={812} />,
    v2: (f, x, y, s) => <DrillTeamV2 frame={f} x={x} y={y} scale={s} count={4} spread={460} />},
  {name: 'letter jacket', s: 0.86, old: (f, x, y, s) => <LettermanJacket x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <LettermanJacketV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'preseason annual', s: 2.2, old: (f, x, y, s) => <FootballAnnual x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <FootballAnnualV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'trophy', s: 1.6, old: (f, x, y, s) => <Trophy x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <TrophyV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'end-zone pylon', s: 1.75, old: (f, x, y, s) => <EndZonePylon x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <EndZonePylonV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'grandstand', s: 0.04, old: (f, x, y, s) => <GrandstandBowl x={x} y={y} scale={s} w={900} />,
    v2: (f, x, y, s) => <GrandstandBowlV2 frame={f} x={x} y={y} scale={s} w={3000} />},
  {name: 'official', s: 0.45, old: (f, x, y, s) => <Official x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <OfficialV2 frame={f} x={x} y={y} scale={s} />},
];

export const FootballShelfGallery: React.FC<FilmRenderProps> = ({board}) => {
  const frame = useCurrentFrame();
  const v2 = lookActive(board as never);
  const pages = Math.ceil(CELLS.length / 8);
  const page = Math.floor(frame / 30) % pages;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      {CELLS.slice(page * 8, page * 8 + 8).map((c, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const x = 270 + col * 540 + (c.ox ?? 0), y = 600 + row * 400;
        return <g key={c.name}>
          <rect x={col * 540 + 20} y={y} width={500} height={6} rx={3} fill="#2b2440" opacity={0.15} />
          {v2 ? c.v2(frame, x, y, c.s) : c.old(frame, x, y, c.s)}
          <text x={col * 540 + 270} y={y + 52} textAnchor="middle" fontFamily={FONT.body} fontWeight={700}
            fontSize={28} fill="#2b2440">{c.name}</text>
        </g>;
      })}
    </svg>
  );
};
