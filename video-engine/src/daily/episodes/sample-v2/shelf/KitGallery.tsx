import React from 'react';
import {useCurrentFrame} from 'remotion';
import {FONT} from '../../../../lib/type';
import {M} from '../../../../lib/scale';
import type {FilmRenderProps} from '../../../../modern/types';
import {CattleGuard, Conductor, DataCentre, LatticeTower, Mesquite, PricklyPear, Pumpjack, PumpjackField, StockTank, Transformer,
  WaterTower, WindTurbine, Windmill} from '../../../../lib/kit';
import {CattleGuardV2, ConductorV2, DataCentreV2, LatticeTowerV2, MesquiteV2, PricklyPearV2, PumpjackFieldV2, PumpjackV2, StockTankV2,
  TransformerV2, WaterTowerV2, WindTurbineV2, WindmillV2} from '../../../../look/shelf/kit';
import {lookActive} from '../../../../look/tokens';

/**
 * look-v2-shelf-kit (written November 13th, 2026). The kit set's before and after sheet. Each cell
 * stands one drawing on a ground line, the library's under the old look and the v2 drawing under the
 * new, at the same place and scale. Thirteen drawings on two pages of eight, a page a second. The
 * conductor cell strings two cables between a pair of towers, and the field cell shrinks the whole
 * field into its cell. Not an edition.
 */
type Draw = (f: number, x: number, y: number, s: number) => React.ReactNode;
type Cell = {name: string; s: number; ox?: number; old: Draw; v2: Draw};

/** two towers and the conductors between their arm tips, at the towers' scale */
const span = (f: number, x: number, y: number, s: number, v2: boolean) => {
  const H = 45 * M * s, W = H * 0.34, a = x - 170, b = x + 170;
  const tips = [0.8, 0.92].map((u) => [a + W * 0.66, b - W * 0.66, y - H * u + H * 0.067]);
  return <g>
    {v2 ? <><LatticeTowerV2 frame={f} x={a} y={y} scale={s} /><LatticeTowerV2 frame={f} x={b} y={y} scale={s} seed={2} /></>
      : <><LatticeTower x={a} y={y} scale={s} /><LatticeTower x={b} y={y} scale={s} /></>}
    {tips.map(([x1, x2, yy], i) => v2 ? <ConductorV2 key={i} frame={f} x1={x1} y1={yy} x2={x2} y2={yy} sag={0.1} />
      : <Conductor key={i} x1={x1} y1={yy} x2={x2} y2={yy} sag={0.1} />)}
  </g>;
};

const CELLS: Cell[] = [
  {name: 'prickly pear', s: 0.56, old: (_f, x, y, s) => <PricklyPear x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <PricklyPearV2 frame={f} x={x} y={y} scale={s} bloom />},
  {name: 'stock tank', s: 0.13, old: (_f, x, y, s) => <StockTank x={x} y={y - 30} scale={s} drought={0.3} />,
    v2: (f, x, y, s) => <StockTankV2 frame={f} x={x} y={y - 30} scale={s} drought={0.3} />},
  {name: 'mesquite', s: 0.12, old: (_f, x, y, s) => <Mesquite x={x} y={y} scale={s} seed={9} />,
    v2: (f, x, y, s) => <MesquiteV2 frame={f} x={x} y={y} scale={s} seed={9} />},
  {name: 'pumpjack', s: 0.08, ox: 10, old: (f, x, y, s) => <Pumpjack frame={f} x={x} y={y} scale={s} seed={4} />,
    v2: (f, x, y, s) => <PumpjackV2 frame={f} x={x} y={y} scale={s} seed={4} />},
  {name: 'windmill', s: 0.07, old: (f, x, y, s) => <Windmill frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <WindmillV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'pumpjack field', s: 0.065, old: (f, x, y, s) => <g transform={`translate(${x - 164} ${y}) scale(${s})`}>
    <PumpjackField frame={f} spread={4000} /></g>,
  v2: (f, x, y, s) => <g transform={`translate(${x - 164} ${y}) scale(${s})`}><PumpjackFieldV2 frame={f} spread={4000} /></g>},
  {name: 'water tower', s: 0.022, old: (_f, x, y, s) => <WaterTower x={x} y={y} scale={s} town="ALBANY" year="STATE 1998" />,
    v2: (f, x, y, s) => <WaterTowerV2 frame={f} x={x} y={y} scale={s} town="ALBANY" year="STATE 1998" />},
  {name: 'wind turbine', s: 0.0062, old: (f, x, y, s) => <WindTurbine frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <WindTurbineV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'data centre', s: 0.0216, ox: -240, old: (_f, x, y, s) => <DataCentre x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <DataCentreV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'cattle guard', s: 0.34, old: (_f, x, y, s) => <CattleGuard x={x} y={y - 20} scale={s} />,
    v2: (f, x, y, s) => <CattleGuardV2 frame={f} x={x} y={y - 20} scale={s} />},
  {name: 'transformer', s: 0.12, old: (_f, x, y, s) => <Transformer x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <TransformerV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'lattice tower', s: 0.019, old: (_f, x, y, s) => <LatticeTower x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <LatticeTowerV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'conductor', s: 0.016, old: (f, x, y, s) => span(f, x, y, s, false), v2: (f, x, y, s) => span(f, x, y, s, true)},
];

const PER = 8;
export const KitShelfGallery: React.FC<FilmRenderProps> = ({board}) => {
  const frame = useCurrentFrame();
  const v2 = lookActive(board as never);
  const pages = Math.ceil(CELLS.length / PER);
  const page = Math.floor(frame / 30) % pages;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      {CELLS.slice(page * PER, page * PER + PER).map((c, i) => {
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
