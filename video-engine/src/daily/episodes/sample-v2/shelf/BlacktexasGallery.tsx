import React from 'react';
import {useCurrentFrame} from 'remotion';
import {M} from '../../../../lib/scale';
import {FONT} from '../../../../lib/type';
import type {FilmRenderProps} from '../../../../modern/types';
import {
  BarbecuePit, BuckingChute, ChurchFan, EmancipationPark, FanField, Frottoir, HBCUBand, RedDrink, Sanctuary, ShotgunHouse, TrailRideColumn,
} from '../../../../lib/blacktexas';
import {Capitol, Courthouse, GreatWalk, HearingDais, Podium, WitnessTable} from '../../../../lib/civics';
import {
  BarbecuePitV2, BuckingChuteV2, ChurchFanV2, EmancipationParkV2, FanFieldV2, FrottoirV2, HBCUBandV2, RedDrinkV2, SanctuaryV2, ShotgunHouseV2,
  TrailRideColumnV2,
} from '../../../../look/shelf/blacktexas';
import {CapitolV2, CourthouseV2, GreatWalkV2, HearingDaisV2, PodiumV2, WitnessTableV2} from '../../../../look/shelf/civics';
import {lookActive} from '../../../../look/tokens';

/**
 * look-v2-shelf-blacktexas (written November 14th, 2026). The reference sheet for the Black Texas set and
 * the civics set, the community places and objects and the rooms where rules are made. Each cell stands
 * one drawing on a ground line, the library's under the old look and the v2 redraw under the new, at the
 * same place and scale. Seventeen drawings, so three pages of eight, one page a second. The church fan
 * is placed at the hand that holds it and the fan field and the park hang below their origin, as the
 * library places them, so those cells lift them. The library's trail ride and band take their spread in
 * screen units, so their cells pass the v2 spread converted through the metre, and both sides cover the
 * same ground. Not an edition.
 */
type Draw = (f: number, x: number, y: number, s: number) => React.ReactNode;
type Cell = {name: string; s: number; ox?: number; oy?: number; old: Draw; v2: Draw};
const CELLS: Cell[] = [
  {name: 'barbecue pit', s: 0.27, ox: 20, old: (f, x, y, s) => <BarbecuePit frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <BarbecuePitV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'church fan', s: 2.2, oy: -90, old: (f, x, y, s) => <ChurchFan frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <ChurchFanV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'fan field', s: 0.5, oy: -134, old: (f, x, y, s) => <FanField frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <FanFieldV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'sanctuary', s: 0.53, old: (f, x, y, s) => <Sanctuary frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <SanctuaryV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'trail ride', s: 0.085, ox: -34, old: (f, x, y, s) => <TrailRideColumn frame={f} x={x} y={y} scale={s} riders={3} wagons={1}
    span={1300 * M / 100} />,
  v2: (f, x, y, s) => <TrailRideColumnV2 frame={f} x={x} y={y} scale={s} riders={3} wagons={1} span={1300} />},
  {name: 'bucking chute', s: 0.18, old: (f, x, y, s) => <BuckingChute frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <BuckingChuteV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'frottoir', s: 1.5, old: (f, x, y, s) => <Frottoir frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <FrottoirV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'shotgun house', s: 0.14, oy: -36, old: (f, x, y, s) => <ShotgunHouse frame={f} x={x} y={y} scale={s} row={2} />,
    v2: (f, x, y, s) => <ShotgunHouseV2 frame={f} x={x} y={y} scale={s} row={2} />},
  {name: 'HBCU band', s: 0.125, oy: -30, old: (f, x, y, s) => <HBCUBand frame={f} x={x} y={y} scale={s} spread={760 * M / 100} />,
    v2: (f, x, y, s) => <HBCUBandV2 frame={f} x={x} y={y} scale={s} spread={760} />},
  {name: 'Emancipation Park', s: 0.46, oy: -70, old: (f, x, y, s) => <EmancipationPark frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <EmancipationParkV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'red drink', s: 3.5, old: (f, x, y, s) => <RedDrink frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <RedDrinkV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'Capitol', s: 0.0095, old: (f, x, y, s) => <Capitol frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <CapitolV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'Great Walk', s: 1, old: (_f, x, y) => <GreatWalk x={x} y={y} w={460} rows={6} />,
    v2: (f, x, y) => <GreatWalkV2 frame={f} x={x} y={y} w={460} rows={6} />},
  {name: 'courthouse', s: 0.02, old: (f, x, y, s) => <Courthouse frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <CourthouseV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'hearing dais', s: 0.25, old: (f, x, y, s) => <HearingDais frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <HearingDaisV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'witness table', s: 0.75, old: (f, x, y, s) => <WitnessTable frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <WitnessTableV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'podium', s: 0.4, old: (f, x, y, s) => <Podium frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <PodiumV2 frame={f} x={x} y={y} scale={s} />},
];
const PER_PAGE = 8;

export const BlacktexasShelfGallery: React.FC<FilmRenderProps> = ({board}) => {
  const frame = useCurrentFrame();
  const v2 = lookActive(board as never);
  const pages = Math.ceil(CELLS.length / PER_PAGE);
  const page = Math.floor(frame / 30) % pages;
  const shown = CELLS.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      {shown.map((c, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const x = 270 + col * 540 + (c.ox ?? 0), y = 600 + row * 400;
        return <g key={c.name}>
          <rect x={col * 540 + 20} y={y} width={500} height={6} rx={3} fill="#2b2440" opacity={0.15} />
          {v2 ? c.v2(frame, x, y + (c.oy ?? 0), c.s) : c.old(frame, x, y + (c.oy ?? 0), c.s)}
          <text x={col * 540 + 270} y={y + 52} textAnchor="middle" fontFamily={FONT.body} fontWeight={700}
            fontSize={28} fill="#2b2440">{c.name}</text>
        </g>;
      })}
    </svg>
  );
};
