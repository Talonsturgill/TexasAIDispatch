import React from 'react';
import {useCurrentFrame} from 'remotion';
import {FONT} from '../../../../lib/type';
import type {FilmRenderProps} from '../../../../modern/types';
import {BlueNorther, ClearSky, DustHaze, GreenHailSky, GulfOvercast, MonsoonCells, SeaFog, ShelfCloud, Sky, SmokeSky, Starfield, SunsetBands,
  Supercell, Thunderhead} from '../../../../lib/skies';
import {HandsetAlert, LowWaterCrossing, RainCell, SirenMast, StreamGauge} from '../../../../lib/water';
import {FreshwaterBackdrop, FreshwaterSystem} from '../../../../lib/freshwater';
import {BlueNortherV2, ClearSkyV2, DustHazeV2, GreenHailSkyV2, GulfOvercastV2, MonsoonCellsV2, SeaFogV2, ShelfCloudV2, SkyV2, SmokeSkyV2,
  StarfieldV2, SunsetBandsV2, SupercellV2, ThunderheadV2} from '../../../../look/shelf/skies';
import {HandsetAlertV2, LowWaterCrossingV2, RainCellV2, SirenMastV2, StreamGaugeV2} from '../../../../look/shelf/water';
import {FreshwaterBackdropV2, FreshwaterSystemV2} from '../../../../look/shelf/freshwater';
import {lookActive} from '../../../../look/tokens';

/**
 * look-v2-shelf-skies (written November 14th, 2026). The skies, water and freshwater sets' before
 * and after sheet. A sky is a full frame backdrop, so its cell is a rounded window onto the frame at
 * the same crop before and after, the horizon at the window's foot. A standing drawing stands on the
 * ground line, the library's under the old look and the v2 drawing under the new, at the same place
 * and scale. Twenty two cells on three pages of eight, a page a second. Not an edition.
 */
type Draw = (f: number, x: number, y: number, s: number) => React.ReactNode;
/** `win` marks a frame-sized drawing seen through a window, `top` the frame y at the window's top edge, `left` its x */
type Cell = {name: string; s: number; ox?: number; win?: boolean; top?: number; left?: number; old: Draw; v2: Draw};

const HEAD = 'FLASH FLOOD WARNING', BODY = 'Move to higher ground now. Avoid low water crossings.';
const K = 500 / 1080;
const sky = (name: string, old: Draw, v2: Draw, top?: number): Cell => ({name, win: true, s: K, top, old, v2});

const CELLS: Cell[] = [
  // page one
  {name: 'low water crossing', s: 0.15, old: (f, x, y, s) => <LowWaterCrossing frame={f} x={x} y={y - 12} scale={s} depth={0.3} />,
    v2: (f, x, y, s) => <LowWaterCrossingV2 frame={f} x={x} y={y - 12} scale={s} depth={0.3} />},
  {name: 'rain cell', s: 1, old: (f, x, y) => <RainCell frame={f} x={x - 240} y={y - 236} w={480} h={232} lightning />,
    v2: (f, x, y) => <RainCellV2 frame={f} x={x - 240} y={y - 236} w={480} h={232} lightning />},
  sky('thunderhead', (f) => <Thunderhead frame={f} intensity={0.66} />, (f) => <ThunderheadV2 frame={f} intensity={0.66} />, 560),
  sky('supercell', (f) => <Supercell frame={f} />, (f) => <SupercellV2 frame={f} />),
  sky('shelf cloud', (f) => <ShelfCloud frame={f} />, (f) => <ShelfCloudV2 frame={f} />),
  sky('blue norther', (f) => <BlueNorther frame={f} />, (f) => <BlueNortherV2 frame={f} />),
  sky('sunset bands', (f) => <SunsetBands frame={f} />, (f) => <SunsetBandsV2 frame={f} />),
  sky('dust haze and haboob', (f) => <DustHaze frame={f} wall={0.45} />, (f) => <DustHazeV2 frame={f} wall={0.45} />),
  // page two
  {name: 'handset alert', s: 1.9, old: (f, x, y, s) => <HandsetAlert frame={f} x={x} y={y - 140} scale={s} headline={HEAD} body={BODY} />,
    v2: (f, x, y, s) => <HandsetAlertV2 frame={f} x={x} y={y - 140} scale={s} headline={HEAD} body={BODY} />},
  {name: 'stream gauge', s: 0.135, old: (f, x, y, s) => <StreamGauge frame={f} x={x} y={y} scale={s} stage={0.45} threshold={0.72} stageLabel="Rising" />,
    v2: (f, x, y, s) => <StreamGaugeV2 frame={f} x={x} y={y} scale={s} stage={0.45} threshold={0.72} stageLabel="Rising" />},
  sky('gulf overcast', (f) => <GulfOvercast frame={f} />, (f) => <GulfOvercastV2 frame={f} />),
  sky('sea fog', (f) => <SeaFog frame={f} ceiling={420} lamps={[{x: 300, y: 1180}, {x: 760, y: 1220}]} />,
    (f) => <SeaFogV2 frame={f} ceiling={420} lamps={[{x: 300, y: 1180}, {x: 760, y: 1220}]} />),
  sky('green hail sky', (f) => <GreenHailSky frame={f} />, (f) => <GreenHailSkyV2 frame={f} />),
  sky('wildfire smoke', (f) => <SmokeSky frame={f} />, (f) => <SmokeSkyV2 frame={f} />),
  sky('starfield', (f) => <Starfield frame={f} />, (f) => <StarfieldV2 frame={f} />),
  sky('monsoon cells', (f) => <MonsoonCells frame={f} />, (f) => <MonsoonCellsV2 frame={f} />, 380),
  // page three
  sky('clear sky, summer', (f) => <ClearSky frame={f} cumulus={5} />, (f) => <ClearSkyV2 frame={f} cumulus={5} />, 420),
  sky('sky by name, winter', (f) => <Sky frame={f} state="winterClear" />, (f) => <SkyV2 frame={f} state="winterClear" />, 100),
  {name: 'siren mast', s: 0.082, old: (f, x, y, s) => <SirenMast frame={f} x={x} y={y} scale={s} sounding />,
    v2: (f, x, y, s) => <SirenMastV2 frame={f} x={x} y={y} scale={s} sounding />},
  {name: 'freshwater backdrop', win: true, s: K, top: 330, old: () => <FreshwaterBackdrop mode="window" />,
    v2: (f) => <FreshwaterBackdropV2 mode="window" frame={f} />},
  {name: 'freshwater system, stop', s: 0.5, ox: -235, old: (f, x, y, s) => <FreshwaterSystem frame={f} x={x} y={y - 300} scale={s} progress={0.6} mode="stop" />,
    v2: (f, x, y, s) => <FreshwaterSystemV2 frame={f} x={x} y={y - 300} scale={s} progress={0.6} mode="stop" />},
  {name: 'freshwater system, twin', s: 0.5, ox: -235, old: (f, x, y, s) => <FreshwaterSystem frame={f} x={x} y={y - 300} scale={s} progress={0.6} mode="twin" />,
    v2: (f, x, y, s) => <FreshwaterSystemV2 frame={f} x={x} y={y - 300} scale={s} progress={0.6} mode="twin" />},
];

const PER = 8;
export const SkiesShelfGallery: React.FC<FilmRenderProps> = ({board}) => {
  const frame = useCurrentFrame();
  const v2 = lookActive(board as never);
  const pages = Math.ceil(CELLS.length / PER);
  const page = Math.floor(frame / 30) % pages;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      {CELLS.slice(page * PER, page * PER + PER).map((c, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const x = 270 + col * 540 + (c.ox ?? 0), y = 600 + row * 400;
        const draw = v2 ? c.v2 : c.old;
        let body: React.ReactNode;
        if (c.win) {
          // a rounded window onto the frame, the horizon (1290 by default) near its foot
          const wx = col * 540 + 20, wy = row === 0 ? 364 : y - 334, wh = y - 6 - wy, k = c.s;
          const top = c.top ?? 1330 - wh / k, left = c.left ?? 0;
          const id = `skw${page}${i}`;
          body = <g>
            <defs><clipPath id={id}><rect x={wx} y={wy} width={500} height={wh} rx={28} /></clipPath></defs>
            <g clipPath={`url(#${id})`}><g transform={`translate(${wx - left * k} ${wy - top * k}) scale(${k})`}>{draw(frame, 0, 0, 1)}</g></g>
            <rect x={wx} y={wy} width={500} height={wh} rx={28} fill="none" stroke="#2b2440" strokeOpacity={0.18} strokeWidth={4} />
          </g>;
        } else {
          body = draw(frame, x, y, c.s);
        }
        return <g key={c.name}>
          <rect x={col * 540 + 20} y={y} width={500} height={6} rx={3} fill="#2b2440" opacity={0.15} />
          {body}
          <text x={col * 540 + 270} y={y + 52} textAnchor="middle" fontFamily={FONT.body} fontWeight={700}
            fontSize={28} fill="#2b2440">{c.name}</text>
        </g>;
      })}
    </svg>
  );
};
