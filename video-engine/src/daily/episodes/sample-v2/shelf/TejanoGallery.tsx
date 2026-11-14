import React from 'react';
import {useCurrentFrame} from 'remotion';
import {FONT} from '../../../../lib/type';
import type {FilmRenderProps} from '../../../../modern/types';
import {
  Comal, ColoniaBlock, ConjuntoPair, EscaramuzaRider, Lowrider, PaleteroCart, PanaderiaRack, PedestrianBridge, PhotoWall, RaspaCup,
  RaspaStand, StarPinata, Tiendita, YardShrine,
} from '../../../../lib/tejano';
import {
  ComalV2, ColoniaBlockV2, ConjuntoPairV2, EscaramuzaRiderV2, LowriderV2, PaleteroCartV2, PanaderiaRackV2, PedestrianBridgeV2, PhotoWallV2,
  RaspaCupV2, RaspaStandV2, StarPinataV2, TienditaV2, YardShrineV2,
} from '../../../../look/shelf/tejano';
import {lookActive} from '../../../../look/tokens';

/**
 * look-v2-shelf-tejano (written November 14th, 2026). The reference sheet for the tejano set, the
 * Mexican-American and border Texas drawings. Each cell stands one drawing on a ground line, the
 * library's under the old look and the v2 redraw under the new, at the same place and scale. Fourteen
 * drawings, so two pages of eight, one page a second. The accordion, the comal and the pinata are
 * placed at their centres, as the library places them, so their cells lift them off the line. Not an
 * edition.
 */
type Draw = (f: number, x: number, y: number, s: number) => React.ReactNode;
type Cell = {name: string; s: number; ox?: number; oy?: number; old: Draw; v2: Draw};
const CELLS: Cell[] = [
  {name: 'lowrider', s: 0.22, old: (f, x, y, s) => <Lowrider frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <LowriderV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'comal', s: 1.9, ox: -50, oy: -60, old: (f, x, y, s) => <Comal frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <ComalV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'paletero cart', s: 0.4, ox: 10, old: (f, x, y, s) => <PaleteroCart frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <PaleteroCartV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'raspa cup', s: 2.5, old: (f, x, y, s) => <RaspaCup frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <RaspaCupV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'raspa stand', s: 0.28, old: (f, x, y, s) => <RaspaStand frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <RaspaStandV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'panaderia rack', s: 0.45, old: (f, x, y, s) => <PanaderiaRack frame={f} x={x} y={y} scale={s} charola />,
    v2: (f, x, y, s) => <PanaderiaRackV2 frame={f} x={x} y={y} scale={s} charola />},
  {name: 'conjunto pair', s: 0.8, ox: 40, oy: -110, old: (f, x, y, s) => <ConjuntoPair frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <ConjuntoPairV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'yard shrine', s: 0.55, old: (f, x, y, s) => <YardShrine frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <YardShrineV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'colonia block', s: 0.05, old: (f, x, y, s) => <ColoniaBlock frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <ColoniaBlockV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'pedestrian bridge', s: 0.073, old: (f, x, y, s) => <PedestrianBridge frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <PedestrianBridgeV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'tiendita', s: 0.145, old: (f, x, y, s) => <Tiendita frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <TienditaV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'star pinata', s: 0.9, oy: -185, old: (f, x, y, s) => <StarPinata frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <StarPinataV2 frame={f} x={x} y={y} scale={s} rope={30} />},
  {name: 'escaramuza rider', s: 0.32, ox: 30, old: (f, x, y, s) => <EscaramuzaRider frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <EscaramuzaRiderV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'photograph wall', s: 0.38, old: (f, x, y, s) => <PhotoWall frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <PhotoWallV2 frame={f} x={x} y={y} scale={s} />},
];
const PER_PAGE = 8;

export const TejanoShelfGallery: React.FC<FilmRenderProps> = ({board}) => {
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
