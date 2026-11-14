import React from 'react';
import {useCurrentFrame} from 'remotion';
import {FONT} from '../../../../lib/type';
import type {FilmRenderProps} from '../../../../modern/types';
import {
  Bleachers, DrumMajorStand, Field, GoalPost, HomecomingMum, LightMast, MarchingBlock, PortableClassroom, RunThrough,
  SchoolBus, SchoolMarquee, ShowBarn, ShowSteer,
} from '../../../../lib/hometown';
import {
  BleachersV2, DrumMajorStandV2, FieldV2, GoalPostV2, HomecomingMumV2, LightMastV2, MarchingBlockV2, PortableClassroomV2,
  RunThroughV2, SchoolBusV2, SchoolMarqueeV2, ShowBarnV2, ShowSteerV2,
} from '../../../../look/shelf/hometown';
import {lookActive} from '../../../../look/tokens';

/**
 * look-v2-shelf-hometown (written November 13th, 2026). The reference sheet for the hometown set, the
 * school and Friday night drawings. Each cell stands one drawing on a ground line, the library's under
 * the old look and the v2 redraw under the new, at the same place and scale. Thirteen drawings, so two
 * pages of eight, one page a second. Not an edition.
 */
type Draw = (f: number, x: number, y: number, s: number) => React.ReactNode;
type Cell = {name: string; s: number; ox?: number; old: Draw; v2: Draw};
const CELLS: Cell[] = [
  {name: 'field', s: 0.4, old: (_f, x, y, s) => <Field x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <FieldV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'bleachers', s: 0.042, old: (_f, x, y, s) => <Bleachers x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <BleachersV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'light mast', s: 0.032, ox: -60, old: (_f, x, y, s) => <LightMast x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <LightMastV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'marching block', s: 0.1, old: (f, x, y, s) => <MarchingBlock frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <MarchingBlockV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'drum major stand', s: 0.21, old: (_f, x, y, s) => <DrumMajorStand x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <DrumMajorStandV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'homecoming mum', s: 0.85, old: (f, x, y, s) => <HomecomingMum frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <HomecomingMumV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'portable classroom', s: 0.075, ox: 40, old: (_f, x, y, s) => <PortableClassroom x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <PortableClassroomV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'school marquee', s: 0.27, old: (_f, x, y, s) => <SchoolMarquee x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <SchoolMarqueeV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'school bus', s: 0.11, old: (_f, x, y, s) => <SchoolBus x={x} y={y} scale={s} stopArm />,
    v2: (f, x, y, s) => <SchoolBusV2 frame={f} x={x} y={y} scale={s} stopArm />},
  {name: 'run-through banner', s: 0.15, old: (_f, x, y, s) => <RunThrough x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <RunThroughV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'show barn', s: 0.055, old: (_f, x, y, s) => <ShowBarn x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <ShowBarnV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'show steer', s: 0.4, old: (f, x, y, s) => <ShowSteer frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <ShowSteerV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'goal post', s: 0.09, old: (_f, x, y, s) => <GoalPost x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <GoalPostV2 frame={f} x={x} y={y} scale={s} />},
];
const PER_PAGE = 8;

export const HometownShelfGallery: React.FC<FilmRenderProps> = ({board}) => {
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
          {v2 ? c.v2(frame, x, y, c.s) : c.old(frame, x, y, c.s)}
          <text x={col * 540 + 270} y={y + 52} textAnchor="middle" fontFamily={FONT.body} fontWeight={700}
            fontSize={28} fill="#2b2440">{c.name}</text>
        </g>;
      })}
    </svg>
  );
};
