import React from 'react';
import {FONT} from '../../../lib/type';
import {useCurrentFrame} from 'remotion';
import type {FilmRenderProps} from '../../../modern/types';
import {FeralHog, Longhorn, Whitetail} from '../../../lib/fauna';
import {Pickup} from '../../../lib/vehicles';
import {Windmill} from '../../../lib/kit';
import {ShowBarn} from '../../../lib/hometown';
import {BarnV2, CowV2, DeerV2, DocumentV2, DogV2, HogV2, MapPinV2, PickupV2, WindmillV2} from '../../../look/props';
import {lookActive} from '../../../look/tokens';

/**
 * look-v2-props (written November 13th, 2026): the reference sheet for the common animals and props.
 * Each cell stands one thing on a ground line, the library's drawing under the old look and the v2
 * drawing under the new, at the same place and scale. A v2 prop with no library counterpart leaves its
 * before cell empty. Not an edition.
 */
type Draw = (f: number, x: number, y: number, s: number) => React.ReactNode;
type Cell = {name: string; s: number; ox: number; old?: Draw; v2: Draw};
const CELLS: Cell[] = [
  {name: 'longhorn', s: 0.44, ox: 0, old: (f, x, y, s) => <Longhorn frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <CowV2 frame={f} x={x} y={y} scale={s} longhorn mood="calm" />},
  {name: 'feral hog', s: 0.7, ox: 0, old: (f, x, y, s) => <FeralHog frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <HogV2 frame={f} x={x} y={y} scale={s} mood="alert" />},
  {name: 'white-tailed deer', s: 0.64, ox: 0, old: (f, x, y, s) => <Whitetail frame={f} x={x} y={y} scale={s} points={8} />,
    v2: (f, x, y, s) => <DeerV2 frame={f} x={x} y={y} scale={s} mood="alert" />},
  {name: 'ranch dog', s: 1.1, ox: 0, v2: (f, x, y, s) => <DogV2 frame={f} x={x} y={y} scale={s} mood="happy" />},
  {name: 'pickup', s: 0.21, ox: 0, old: (f, x, y, s) => <Pickup frame={f} x={x} y={y} scale={s} paint="#8c1f22" />,
    v2: (f, x, y, s) => <PickupV2 frame={f} x={x} y={y} scale={s} paint="#d64545" />},
  {name: 'windmill', s: 0.082, ox: 0, old: (f, x, y, s) => <Windmill frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <WindmillV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'barn', s: 0.07, ox: 0, old: (_f, x, y, s) => <ShowBarn x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <BarnV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'map pin and document', s: 1, ox: 0, v2: (f, x, y) => <g>
    <MapPinV2 x={x - 120} y={y - 10} s={1} p={Math.min(1, f / 20)} label="Abilene" />
    <DocumentV2 x={x + 120} y={y - 150} s={0.5} title="Order" stamp="FILED" />
  </g>},
];

export const PropsGallery: React.FC<FilmRenderProps> = ({board}) => {
  const frame = useCurrentFrame();
  const v2 = lookActive(board as never);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      {CELLS.map((c, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const x = 270 + col * 540 + c.ox, y = 600 + row * 400;
        return <g key={c.name}>
          <rect x={col * 540 + 20} y={y} width={500} height={6} rx={3} fill="#2b2440" opacity={0.15} />
          {v2 ? c.v2(frame, x, y, c.s) : c.old?.(frame, x, y, c.s)}
          <text x={col * 540 + 270} y={y + 52} textAnchor="middle" fontFamily={FONT.body} fontWeight={700}
            fontSize={28} fill="#2b2440">{c.name}</text>
        </g>;
      })}
    </svg>
  );
};
