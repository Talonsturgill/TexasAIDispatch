import React from 'react';
import {useCurrentFrame} from 'remotion';
import {FONT} from '../../../../lib/type';
import type {FilmRenderProps} from '../../../../modern/types';
import {
  AboveGroundPool, BrickRanch, BurnBarrel, Carport, ChestFreezer, Clothesline, PierBeamHouse, PorchGlider, PropaneTank, SatelliteDish,
  TrailerHouse, Washateria, WindowUnit, Yard,
} from '../../../../lib/homeplace';
import {
  EvidenceLoupe, FixedRoofFlashing, ReviewDesk, ReviewHand, ReviewWall, RoofBackdrop, RoofDriver, RoofEdgeIllustration, RoofFascia,
  RoofSubstrate,
} from '../../../../lib/roofsection';
import {
  AboveGroundPoolV2, BrickRanchV2, BurnBarrelV2, CarportV2, ChestFreezerV2, ClotheslineV2, PierBeamHouseV2, PorchGliderV2, PropaneTankV2,
  SatelliteDishV2, TrailerHouseV2, WashateriaV2, WindowUnitV2, YardV2,
} from '../../../../look/shelf/homeplace';
import {
  EvidenceLoupeV2, FixedRoofFlashingV2, ReviewDeskV2, ReviewHandV2, ReviewWallV2, RoofBackdropV2, RoofDriverV2, RoofEdgeIllustrationV2,
  RoofFasciaV2, RoofSubstrateV2,
} from '../../../../look/shelf/roofsection';
import {lookActive} from '../../../../look/tokens';

/**
 * look-v2-shelf-homeplace (written November 14th, 2026), the before and after sheet for the homeplace
 * set and the roof section drawings. Each cell stands one drawing on a ground line, the library's under
 * the old look and the v2 redraw under the new, at the same place and scale. Twenty-four drawings,
 * eight to a page, a page a second. The roof section drawings were laid out in screen units with no
 * placement of their own, so their old cells wrap them in the same translate and scale the v2 takes.
 * Not an edition.
 */
type Draw = (f: number, x: number, y: number, s: number) => React.ReactNode;
type Cell = {name: string; s: number; dx?: number; dy?: number; old: Draw; v2: Draw};
const wrap = (x: number, y: number, s: number, el: React.ReactNode) => <g transform={`translate(${x} ${y}) scale(${s})`}>{el}</g>;

const CELLS: Cell[] = [
  {name: 'brick ranch', s: 0.072, old: (_f, x, y, s) => <BrickRanch x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <BrickRanchV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'carport', s: 0.14, old: (_f, x, y, s) => <Carport x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <CarportV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'pier and beam house', s: 0.1, old: (_f, x, y, s) => <PierBeamHouse x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <PierBeamHouseV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'trailer house', s: 0.057, old: (_f, x, y, s) => <TrailerHouse x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <TrailerHouseV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'washateria', s: 0.084, old: (_f, x, y, s) => <Washateria x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <WashateriaV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'yard', s: 0.18, old: (_f, x, y, s) => <Yard x={x} y={y} scale={s} w={2600} depth={520} />,
    v2: (f, x, y, s) => <YardV2 frame={f} x={x} y={y} scale={s} w={2600} depth={520} />},
  {name: 'above ground pool', s: 0.2, dy: -60, old: (_f, x, y, s) => <AboveGroundPool x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <AboveGroundPoolV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'propane tank', s: 0.33, old: (_f, x, y, s) => <PropaneTank x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <PropaneTankV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'chest freezer', s: 0.62, old: (_f, x, y, s) => <ChestFreezer x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <ChestFreezerV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'window unit', s: 1.5, dy: -60, old: (f, x, y, s) => <WindowUnit frame={f} x={x} y={y} scale={s} ribbon />,
    v2: (f, x, y, s) => <WindowUnitV2 frame={f} x={x} y={y} scale={s} ribbon />},
  {name: 'clothesline', s: 0.2, old: (f, x, y, s) => <Clothesline frame={f} x={x} y={y} scale={s} load={1} />,
    v2: (f, x, y, s) => <ClotheslineV2 frame={f} x={x} y={y} scale={s} load={1} />},
  {name: 'porch glider', s: 0.85, old: (f, x, y, s) => <PorchGlider frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <PorchGliderV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'satellite dish', s: 0.33, old: (_f, x, y, s) => <SatelliteDish x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <SatelliteDishV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'burn barrel', s: 0.8, old: (f, x, y, s) => <BurnBarrel frame={f} x={x} y={y} scale={s} lit />,
    v2: (f, x, y, s) => <BurnBarrelV2 frame={f} x={x} y={y} scale={s} lit />},
  {name: 'roof edge', s: 0.8, old: (_f, x, y, s) => wrap(x, y, s, <RoofEdgeIllustration />),
    v2: (f, x, y, s) => <RoofEdgeIllustrationV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'roof driver', s: 1.15, dx: -110, old: (_f, x, y, s) => wrap(x, y - 22 * s, s, <RoofDriver />),
    v2: (f, x, y, s) => <RoofDriverV2 frame={f} x={x} y={y - 22 * s} scale={s} />},
  {name: 'evidence loupe', s: 0.72, dx: -30, old: (_f, x, y, s) => wrap(x, y - 120 * s, s, <EvidenceLoupe />),
    v2: (f, x, y, s) => <EvidenceLoupeV2 frame={f} x={x} y={y - 120 * s} scale={s} />},
  {name: 'review hand', s: 0.9, old: (_f, x, y, s) => wrap(x, y - 184 * s, s, <ReviewHand />),
    v2: (f, x, y, s) => <ReviewHandV2 frame={f} x={x} y={y - 184 * s} scale={s} />},
  {name: 'fixed roof flashing', s: 1, old: (_f, x, y, s) => wrap(x, y - 90 * s, s, <FixedRoofFlashing />),
    v2: (f, x, y, s) => <FixedRoofFlashingV2 frame={f} x={x} y={y - 90 * s} scale={s} />},
  {name: 'roof fascia', s: 1, old: (_f, x, y, s) => wrap(x, y - 115 * s, s, <RoofFascia />),
    v2: (f, x, y, s) => <RoofFasciaV2 frame={f} x={x} y={y - 115 * s} scale={s} />},
  {name: 'roof substrate', s: 1, old: (_f, x, y, s) => wrap(x, y - 66 * s, s, <RoofSubstrate />),
    v2: (f, x, y, s) => <RoofSubstrateV2 frame={f} x={x} y={y - 66 * s} scale={s} />},
  {name: 'review desk', s: 0.44, old: (_f, x, y, s) => wrap(x, y - 262 * s, s, <ReviewDesk />),
    v2: (f, x, y, s) => <ReviewDeskV2 frame={f} x={x} y={y - 262 * s} scale={s} />},
  {name: 'roof backdrop', s: 0.3, old: (_f, x, y, s) => wrap(x, y - 500 * s, s, <RoofBackdrop />),
    v2: (f, x, y, s) => <RoofBackdropV2 frame={f} x={x} y={y - 500 * s} scale={s} />},
  {name: 'review wall', s: 0.3, old: (_f, x, y, s) => wrap(x, y - 500 * s, s, <ReviewWall />),
    v2: (f, x, y, s) => <ReviewWallV2 frame={f} x={x} y={y - 500 * s} scale={s} />},
];

const PER = 8;
export const HomeplaceShelfGallery: React.FC<FilmRenderProps> = ({board}) => {
  const frame = useCurrentFrame();
  const v2 = lookActive(board as never);
  const pages = Math.ceil(CELLS.length / PER);
  const page = Math.floor(frame / 30) % pages;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      {CELLS.slice(page * PER, page * PER + PER).map((c, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const x = 270 + col * 540 + (c.dx ?? 0), y = 600 + row * 400, gy = y + (c.dy ?? 0);
        return <g key={c.name}>
          <rect x={col * 540 + 20} y={y} width={500} height={6} rx={3} fill="#2b2440" opacity={0.15} />
          {v2 ? c.v2(frame, x, gy, c.s) : c.old(frame, x, gy, c.s)}
          <text x={col * 540 + 270} y={y + 52} textAnchor="middle" fontFamily={FONT.body} fontWeight={700}
            fontSize={28} fill="#2b2440">{c.name}</text>
        </g>;
      })}
    </svg>
  );
};
