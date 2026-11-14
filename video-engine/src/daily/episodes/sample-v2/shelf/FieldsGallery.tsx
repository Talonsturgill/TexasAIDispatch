import React from 'react';
import {useCurrentFrame} from 'remotion';
import {FONT} from '../../../../lib/type';
import type {FilmRenderProps} from '../../../../modern/types';
import {CentrePivot, CropRows, FeedlotPen, GrainElevator, GroundSection, HerdSensor, SoilProbe} from '../../../../lib/agriculture';
import {CentrePivotDepthV2, CropRowsV2, FeedlotPenV2, GrainElevatorV2, GroundSectionV2, HerdSensorV2, SoilProbeV2} from '../../../../look/shelf/agriculture';
import {Derrick, Doghouse, IronRoughneck, PipeRack, RedZoneSign, RigFloor} from '../../../../lib/drilling';
import {DerrickV2, DoghouseV2, IronRoughneckV2, PipeRackV2, RedZoneSignV2, RigFloorV2} from '../../../../look/shelf/drilling';
import {FarmlandLayer, FieldDayNotice, FieldObservations, IrrigationAdvice, PivotRig, RadarEstimate} from '../../../../lib/irrigation';
import {FarmlandLayerV2, FieldDayNoticeV2, FieldObservationsV2, IrrigationAdviceV2, PivotRigV2, RadarEstimateV2} from '../../../../look/shelf/irrigation';
import {lookActive} from '../../../../look/tokens';

/**
 * look-v2-shelf-fields (written November 14th, 2026). The fields set's before and after sheet, farm
 * machines, crops, oilfield drilling and irrigation. Each cell stands one drawing on a ground line,
 * the library's under the old look and the v2 redraw under the new, at the same place and scale.
 * Nineteen drawings on three pages of eight, a page a second. Frame sized drawings (crop rows, the
 * ground section, the farmland plates) and the screen space cards are shrunk into their cells. The
 * hero machines are shown with a face. Not an edition.
 */

type Draw = (f: number, x: number, y: number, s: number) => React.ReactNode;
type Cell = {name: string; s: number; ox?: number; old: Draw; v2: Draw};
/** the three farmland plates stacked as a scene uses them, the whole frame shrunk into a rounded window */
const plates = (f: number, x: number, y: number, s: number, v2: boolean) => <g transform={`translate(${x - 540 * s} ${y - 1920 * s}) scale(${s})`}>
  <defs><clipPath id={`fl${v2 ? 2 : 1}`}><rect x={0} y={0} width={1080} height={1920} rx={60} /></clipPath></defs>
  <g clipPath={`url(#fl${v2 ? 2 : 1})`}>{v2 ? <><FarmlandLayerV2 frame={f} layer="sky" /><FarmlandLayerV2 frame={f} layer="soil" />
    <FarmlandLayerV2 frame={f} layer="edge" /></> : <><FarmlandLayer frame={f} layer="sky" /><FarmlandLayer frame={f} layer="soil" />
    <FarmlandLayer frame={f} layer="edge" /></>}</g>
</g>;
const box = (x: number, y: number, s: number, w: number, h: number, node: React.ReactNode) =>
  <g transform={`translate(${x - (w * s) / 2} ${y - h * s}) scale(${s})`}>{node}</g>;

const CELLS: Cell[] = [
  {name: 'centre pivot', s: 0.05, ox: -190, old: (f, x, y, s) => <CentrePivot frame={f} x={x} y={y} scale={s} endGun />,
    v2: (f, x, y, s) => <CentrePivotDepthV2 frame={f} x={x} y={y} scale={s} endGun mood="happy" />},
  {name: 'crop rows', s: 0.45, old: (f, x, y, s) => box(x, y, s, 1080, 620, <CropRows frame={f} w={1080} h={620} growth={0.9} />),
    v2: (f, x, y, s) => box(x, y, s, 1080, 620, <CropRowsV2 frame={f} w={1080} h={620} growth={0.9} />)},
  {name: 'grain elevator', s: 0.021, ox: -60, old: (_f, x, y, s) => <GrainElevator x={x} y={y} scale={s} label="CO-OP" />,
    v2: (f, x, y, s) => <GrainElevatorV2 frame={f} x={x} y={y} scale={s} label="CO-OP" />},
  {name: 'feedlot pen', s: 0.14, ox: -225, old: (f, x, y, s) => <FeedlotPen frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <FeedlotPenV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'soil probe', s: 0.55, old: (f, x, y, s) => <SoilProbe frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <SoilProbeV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'herd sensor', s: 7.5, old: (f, x, y, s) => <HerdSensor frame={f} x={x} y={y - 140} scale={s} alert />,
    v2: (f, x, y, s) => <HerdSensorV2 frame={f} x={x} y={y - 140} scale={s} alert />},
  {name: 'ground section', s: 0.7, old: (f, x, y, s) => box(x, y, s, 620, 380, <GroundSection frame={f} y={60} w={620} h={320} historicTable={0.3}
    labels={{top: 'SOIL', table: 'WATER TABLE', historic: 'EARLIER LEVEL', base: 'BEDROCK'}} />),
  v2: (f, x, y, s) => box(x, y, s, 620, 380, <GroundSectionV2 frame={f} y={60} w={620} h={320} historicTable={0.3}
    labels={{top: 'SOIL', table: 'WATER TABLE', historic: 'EARLIER LEVEL', base: 'BEDROCK'}} />)},
  {name: 'derrick', s: 0.019, ox: -20, old: (f, x, y, s) => <Derrick frame={f} x={x} y={y} scale={s} racked={8} lit hoisting={6} />,
    v2: (f, x, y, s) => <DerrickV2 frame={f} x={x} y={y} scale={s} racked={8} lit hoisting={6} />},
  {name: 'rig floor', s: 0.19, old: (f, x, y, s) => <RigFloor frame={f} x={x} y={y - 10} scale={s} open={0.4} turning={4} />,
    v2: (f, x, y, s) => <RigFloorV2 frame={f} x={x} y={y - 10} scale={s} open={0.4} turning={4} />},
  {name: 'red zone sign', s: 1.1, old: (f, x, y, s) => <RedZoneSign frame={f} x={x} y={y - 170} scale={s} />,
    v2: (f, x, y, s) => <RedZoneSignV2 frame={f} x={x} y={y - 170} scale={s} />},
  {name: 'iron roughneck', s: 0.25, ox: -70, old: (f, x, y, s) => <IronRoughneck frame={f + 50} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <IronRoughneckV2 frame={f + 50} x={x} y={y} scale={s} mood="focused" />},
  {name: 'doghouse', s: 0.24, old: (f, x, y, s) => <Doghouse frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <DoghouseV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'pipe rack', s: 0.28, old: (f, x, y, s) => <PipeRack frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <PipeRackV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'pivot rig', s: 0.105, ox: -15, old: (f, x, y, s) => <PivotRig frame={f} x={x} y={y} scale={s} sensor label="PIVOT" />,
    v2: (f, x, y, s) => <PivotRigV2 frame={f} x={x} y={y} scale={s} sensor label="PIVOT" mood="happy" />},
  {name: 'radar estimate', s: 0.32, old: (f, x, y, s) => <RadarEstimate frame={f} x={x} y={y - 420 * s} scale={s} progress={0.5} label="SOIL MOISTURE"
    sublabel="estimated from orbit" />,
  v2: (f, x, y, s) => <RadarEstimateV2 frame={f} x={x} y={y - 420 * s} scale={s} progress={0.5} label="SOIL MOISTURE" sublabel="estimated from orbit"
    mood="focused" />},
  {name: 'field observations', s: 0.25, old: (f, x, y, s) => <FieldObservations frame={f} x={x} y={y - 900 * s} scale={s} progress={0.7} label="WHAT IT READS"
    result="IRRIGATE THURSDAY" cropLabel="crop photo" weatherLabel="forecast" />,
  v2: (f, x, y, s) => <FieldObservationsV2 frame={f} x={x} y={y - 900 * s} scale={s} progress={0.7} label="WHAT IT READS" result="IRRIGATE THURSDAY"
    cropLabel="crop photo" weatherLabel="forecast" />},
  {name: 'farmland layers', s: 0.17, old: (f, x, y, s) => plates(f, x, y, s, false), v2: (f, x, y, s) => plates(f, x, y, s, true)},
  {name: 'irrigation advice', s: 0.3, ox: 20, old: (f, x, y, s) => <IrrigationAdvice frame={f} x={x} y={y - 650 * s} scale={s} progress={0.6}
    label="NEXT WATERING" status="ADVICE" mode="limit" />,
  v2: (f, x, y, s) => <IrrigationAdviceV2 frame={f} x={x} y={y - 650 * s} scale={s} progress={0.6} label="NEXT WATERING" status="ADVICE" mode="limit" />},
  {name: 'field day notice', s: 0.6, old: (f, x, y, s) => <FieldDayNotice frame={f} x={x} y={y - 250 * s} scale={s} progress={0.8} title="FIELD DAY"
    date="MARCH 12" place="County barn" detail="Bring questions" />,
  v2: (f, x, y, s) => <FieldDayNoticeV2 frame={f} x={x} y={y - 250 * s} scale={s} progress={0.8} title="FIELD DAY" date="MARCH 12" place="County barn"
    detail="Bring questions" />},
];

const PER = 8;
export const FieldsShelfGallery: React.FC<FilmRenderProps> = ({board}) => {
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
