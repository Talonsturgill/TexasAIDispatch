import React from 'react';
import {useCurrentFrame} from 'remotion';
import type {FilmRenderProps} from '../../../modern/types';
import {AutonomousRig} from '../../../lib/freight';
import {CentrePivot} from '../../../lib/agriculture';
import {Derrick} from '../../../lib/drilling';
import {RobotArm} from '../../../lib/plantfloor';
import {RackRow} from '../../../lib/compute';
import {ReadingStation} from '../../../lib/clinic';
import {
  AutoTruckV2, CentrePivotV2, ClinicScreenV2, DrillRigV2, RobotArmV2, RobotaxiV2, SensorMastV2, ServerRackV2,
} from '../../../look/machines';
import {lookActive} from '../../../look/tokens';

/**
 * look-v2-machines (written November 13th, 2026): the reference sheet for the hero machines. Each cell
 * stands one machine on a ground line, the library's own drawing under the old look and the v2 drawing
 * under the new, at the same place and scale, so one board gives the before and the after. A v2
 * machine with no library counterpart leaves its before cell empty. Not an edition.
 */
type Cell = {name: string; s: number; ox: number; old?: (f: number, x: number, y: number, s: number) => React.ReactNode;
  v2: (f: number, x: number, y: number, s: number) => React.ReactNode};
const CELLS: Cell[] = [
  {name: 'driverless truck', s: 0.058, ox: 160, old: (f, x, y, s) => <AutonomousRig frame={f} x={x} y={y} scale={s} speed={0.6} />,
    v2: (f, x, y, s) => <AutoTruckV2 frame={f} x={x} y={y} scale={s} mood="happy" />},
  {name: 'robotaxi', s: 0.16, ox: 0, v2: (f, x, y, s) => <RobotaxiV2 frame={f} x={x} y={y} scale={s} mood="focused" />},
  {name: 'drilling rig', s: 0.021, ox: 90, old: (f, x, y, s) => <Derrick frame={f} x={x} y={y} scale={s} hoisting={8} />,
    v2: (f, x, y, s) => <DrillRigV2 frame={f} x={x} y={y} scale={s} mood="focused" />},
  {name: 'centre pivot', s: 0.026, ox: -150, old: (f, x, y, s) => <CentrePivot frame={f} x={x} y={y} scale={s} spans={3} />,
    v2: (f, x, y, s) => <CentrePivotV2 frame={f} x={x} y={y} scale={s} spans={3} mood="happy" />},
  {name: 'robot arm', s: 0.32, ox: -40, old: (f, x, y, s) => <RobotArm frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <RobotArmV2 frame={f} x={x} y={y} scale={s} mood="focused" />},
  {name: 'data hall row', s: 0.38, ox: -150, old: (f, x, y, s) => <RackRow frame={f} x={x} y={y} scale={s} depth={5} load={0.8} />,
    v2: (f, x, y, s) => <ServerRackV2 frame={f} x={x} y={y} scale={s} count={5} mood="happy" />},
  {name: 'sensor mast', s: 0.062, ox: -60, v2: (f, x, y, s) => <SensorMastV2 frame={f} x={x} y={y} scale={s} mood="focused" />},
  {name: 'clinic screen', s: 0.55, ox: 0, old: (f, x, y, s) => <ReadingStation frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <ClinicScreenV2 frame={f} x={x} y={y} scale={s} mood="happy" />},
];

export const MachineGallery: React.FC<FilmRenderProps> = ({board}) => {
  const frame = useCurrentFrame();
  const v2 = lookActive(board as never);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      {CELLS.map((c, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const x = 270 + col * 540 + c.ox, y = 330 + row * 440 + 120;
        return <g key={c.name}>
          <rect x={col * 540 + 20} y={y} width={500} height={6} rx={3} fill="#2b2440" opacity={0.15} />
          {v2 ? c.v2(frame, x, y, c.s) : c.old?.(frame, x, y, c.s)}
          <text x={col * 540 + 270} y={y + 52} textAnchor="middle" fontFamily="Inter, Helvetica, Arial, sans-serif" fontWeight={700}
            fontSize={28} fill="#2b2440">{c.name}</text>
        </g>;
      })}
    </svg>
  );
};
