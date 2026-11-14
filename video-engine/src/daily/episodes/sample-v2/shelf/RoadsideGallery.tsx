import React from 'react';
import {useCurrentFrame} from 'remotion';
import {FONT} from '../../../../lib/type';
import type {FilmRenderProps} from '../../../../modern/types';
import {
  Bandstand, Billboard, BootFence, CityLimitSign, CottonGin, CountryChurch, DanceHall, DeerBlind, DriveInStalls, FeedStore, GhostSign,
  HistoricalMarker, Icehouse, MansardBox, ModuleYard, MotorCourt, PoleSign, RanchGate, RoadsideMemorial, StorefrontBlock, StripedAFrame, TwoLane,
} from '../../../../lib/roadside';
import {
  BandstandV2, BillboardV2, BootFenceV2, CityLimitSignV2, CottonGinV2, CountryChurchV2, DanceHallV2, DeerBlindV2, DriveInStallsV2, FeedStoreV2,
  GhostSignV2, HistoricalMarkerV2, IcehouseV2, MansardBoxV2, ModuleYardV2, MotorCourtV2, PoleSignV2, RanchGateV2, RoadsideMemorialV2,
  StorefrontBlockV2, StripedAFrameV2, TwoLaneV2,
} from '../../../../look/shelf/roadside';
import {lookActive} from '../../../../look/tokens';

/**
 * look-v2-shelf-roadside (written November 13th, 2026), the before and after sheet for the Texas roadside set.
 * Each cell stands one drawing on a ground line, the library's under the old look and the v2 redraw under the
 * new, at the same place and scale. Twenty-two drawings, eight to a page, a page a second. Not an edition.
 */
type Draw = (f: number, x: number, y: number, s: number) => React.ReactNode;
type Cell = {name: string; s: number; old: Draw; v2: Draw};
const CELLS: Cell[] = [
  {name: 'striped A-frame', s: 0.064, old: (_f, x, y, s) => <StripedAFrame x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <StripedAFrameV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'mansard box', s: 0.085, old: (_f, x, y, s) => <MansardBox x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <MansardBoxV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'drive-in stalls', s: 0.11, old: (_f, x, y, s) => <DriveInStalls x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <DriveInStallsV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'dance hall', s: 0.054, old: (_f, x, y, s) => <DanceHall x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <DanceHallV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'icehouse', s: 0.078, old: (_f, x, y, s) => <Icehouse x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <IcehouseV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'cotton gin', s: 0.038, old: (f, x, y, s) => <CottonGin frame={f} x={x + 20} y={y} scale={s} running />,
    v2: (f, x, y, s) => <CottonGinV2 frame={f} x={x + 20} y={y} scale={s} running />},
  {name: 'module yard', s: 0.03, old: (_f, x, y, s) => <ModuleYard x={x} y={y - 150} scale={s} w={330} depth={140} />,
    v2: (f, x, y, s) => <ModuleYardV2 frame={f} x={x} y={y - 150} scale={s} w={330} depth={140} />},
  {name: 'feed store', s: 0.076, old: (_f, x, y, s) => <FeedStore x={x} y={y} scale={s} chicks />,
    v2: (f, x, y, s) => <FeedStoreV2 frame={f} x={x} y={y} scale={s} chicks />},
  {name: 'historical marker', s: 0.55, old: (_f, x, y, s) => <HistoricalMarker x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <HistoricalMarkerV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'ranch gate', s: 0.14, old: (_f, x, y, s) => <RanchGate x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <RanchGateV2 frame={f} x={x} y={y} scale={s} name="RIO SECO" />},
  {name: 'boot fence', s: 0.5, old: (_f, x, y, s) => <BootFence x={x} y={y} scale={s} span={420} posts={6} boots={5} />,
    v2: (f, x, y, s) => <BootFenceV2 frame={f} x={x} y={y} scale={s} span={420} posts={6} boots={5} />},
  {name: 'ghost sign', s: 1, old: (_f, x, y, s) => <GhostSign x={x - 180} y={y} scale={s} w={360} h={300} />,
    v2: (f, x, y, s) => <GhostSignV2 frame={f} x={x - 180} y={y} scale={s} w={360} h={300} />},
  {name: 'roadside memorial', s: 0.9, old: (_f, x, y, s) => <RoadsideMemorial x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <RoadsideMemorialV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'motor court', s: 0.077, old: (_f, x, y, s) => <MotorCourt x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <MotorCourtV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'pole sign', s: 0.058, old: (_f, x, y, s) => <PoleSign x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <PoleSignV2 frame={f} x={x} y={y} scale={s} word="MOTEL" />},
  {name: 'billboard', s: 0.095, old: (_f, x, y, s) => <Billboard x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <BillboardV2 frame={f} x={x} y={y} scale={s} copy="NEXT EXIT" />},
  {name: 'storefront block', s: 0.043, old: (_f, x, y, s) => <StorefrontBlock x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <StorefrontBlockV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'two-lane', s: 1, old: (_f, x, y, s) => <TwoLane x={x} y={y} scale={s} w={300} horizonY={-220} />,
    v2: (f, x, y, s) => <TwoLaneV2 frame={f} x={x} y={y} scale={s} w={300} horizonY={-220} speed={1} />},
  {name: 'deer blind', s: 0.19, old: (_f, x, y, s) => <DeerBlind x={x + 40} y={y} scale={s} />,
    v2: (f, x, y, s) => <DeerBlindV2 frame={f} x={x + 40} y={y} scale={s} />},
  {name: 'city limit sign', s: 0.33, old: (_f, x, y, s) => <CityLimitSign x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <CityLimitSignV2 frame={f} x={x} y={y} scale={s} name="COTTONWOOD" />},
  {name: 'country church', s: 0.1, old: (_f, x, y, s) => <CountryChurch x={x - 50} y={y} scale={s} graves={6} />,
    v2: (f, x, y, s) => <CountryChurchV2 frame={f} x={x - 50} y={y} scale={s} graves={6} />},
  {name: 'bandstand', s: 0.15, old: (_f, x, y, s) => <Bandstand x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <BandstandV2 frame={f} x={x} y={y} scale={s} />},
];

export const RoadsideShelfGallery: React.FC<FilmRenderProps> = ({board}) => {
  const frame = useCurrentFrame();
  const v2 = lookActive(board as never);
  const pages = Math.ceil(CELLS.length / 8);
  const page = Math.floor(frame / 30) % pages;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      {CELLS.slice(page * 8, page * 8 + 8).map((c, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const x = 270 + col * 540, y = 600 + row * 400;
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
