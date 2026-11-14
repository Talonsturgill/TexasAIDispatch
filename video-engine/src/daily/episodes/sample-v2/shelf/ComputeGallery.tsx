import React from 'react';
import {useCurrentFrame} from 'remotion';
import {FONT} from '../../../../lib/type';
import type {FilmRenderProps} from '../../../../modern/types';
import {Cabinet, CoolingDistributionUnit, CoolingTower, GeneratorBank, HallShell, RackRow, Switchgear} from '../../../../lib/compute';
import {BucketTruck, Pickup, Slab, StockTrailer, Tanker, TransformerHaul} from '../../../../lib/vehicles';
import {Conveyor, InspectionHead, RobotArm, ToolBay} from '../../../../lib/plantfloor';
import {FreightBackdrop, FreightCab, FreightEvidence, FreightRoute} from '../../../../lib/freightinvitation';
import {ProvingGroundRig, TestbenchBackdrop} from '../../../../lib/provingground';
import {CabinetV2, CoolingDistributionUnitV2, CoolingTowerV2, GeneratorBankV2, HallShellV2, RackRowV2, SwitchgearV2} from '../../../../look/shelf/compute';
import {BucketTruckV2, SlabV2, StockTrailerV2, TankerV2, TransformerHaulV2, WorkPickupV2} from '../../../../look/shelf/vehicles';
import {CellArmV2, ConveyorV2, InspectionHeadV2, ToolBayV2} from '../../../../look/shelf/plantfloor';
import {FreightBackdropV2, FreightCabV2, FreightEvidenceV2, FreightRouteV2} from '../../../../look/shelf/freightinvitation';
import {ProvingGroundRigV2, TestbenchBackdropV2} from '../../../../look/shelf/provingground';
import {lookActive} from '../../../../look/tokens';

/**
 * look-v2-shelf-compute (written November 14th, 2026). The before and after sheet for the compute set,
 * which gathers the machine room (lib/compute.tsx), the working vehicles (lib/vehicles.tsx), the plant
 * floor (lib/plantfloor.tsx), the driverless freight scene (lib/freightinvitation.tsx) and the proving
 * ground cutaways (lib/provingground.tsx). Each cell stands the library drawing under the old look and
 * the v2 redraw under the new, at the same place and scale with the same props. A screen scene is drawn
 * at its own board size and shrunk into its cell through a window on the frame. Eight cells a page, one
 * page a second. Not an edition.
 */
type Draw = (f: number, x: number, y: number, s: number) => React.ReactNode;
type Scene = (f: number) => React.ReactNode;
type Win = {x0: number; y0: number; w: number; h: number};
type Cell = {name: string; s: number; ox?: number; old?: Draw; v2?: Draw; sOld?: Scene; sV2?: Scene; win?: Win};

const loop = (f: number, n: number) => (f % n) / n;
const FULL: Win = {x0: 0, y0: 180, w: 1080, h: 1420};

const CELLS: Cell[] = [
  // page one, the machine room
  {name: 'rack row, the cold aisle', s: 0.14, old: (f, x, y, s) => <RackRow frame={f} x={x} y={y} scale={s} unknown={[2]} />,
    v2: (f, x, y, s) => <RackRowV2 frame={f} x={x} y={y} scale={s} unknown={[2]} />},
  {name: 'generator bank, running', s: 0.085, ox: -246, old: (f, x, y, s) => <GeneratorBank frame={f} x={x} y={y} scale={s} units={3} running />,
    v2: (f, x, y, s) => <GeneratorBankV2 frame={f} x={x} y={y} scale={s} units={3} running />},
  {name: 'cabinet', s: 0.4, old: (f, x, y, s) => <Cabinet frame={f} x={x} y={y} scale={s} load={0.8} fault={6} />,
    v2: (f, x, y, s) => <CabinetV2 frame={f} x={x} y={y} scale={s} load={0.8} fault={6} mood="focused" />},
  {name: 'cooling tower', s: 0.075, ox: -240, old: (f, x, y, s) => <CoolingTower frame={f} x={x} y={y} scale={s} humidity={0.6} />,
    v2: (f, x, y, s) => <CoolingTowerV2 frame={f} x={x} y={y} scale={s} humidity={0.6} />},
  {name: 'switchgear', s: 0.27, ox: -232, old: (f, x, y, s) => <Switchgear frame={f} x={x} y={y} scale={s} bays={4} />,
    v2: (f, x, y, s) => <SwitchgearV2 frame={f} x={x} y={y} scale={s} bays={4} />},
  {name: 'coolant distribution unit', s: 0.45, ox: -50, old: (f, x, y, s) => <CoolingDistributionUnit frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <CoolingDistributionUnitV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'hall backdrop', s: 1, win: {x0: 0, y0: 560, w: 1080, h: 1000}, sOld: (f) => <HallShell frame={f} />,
    sV2: (f) => <HallShellV2 frame={f} />},
  {name: 'work pickup', s: 0.2, old: (f, x, y, s) => <Pickup frame={f} x={x} y={y} scale={s} paint="#8c1f22" flagWhip dog />,
    v2: (f, x, y, s) => <WorkPickupV2 frame={f} x={x} y={y} scale={s} paint="#8c1f22" flagWhip dog />},
  // page two, the road and the plant floor
  {name: 'stock trailer, loaded', s: 0.17, old: (f, x, y, s) => <StockTrailer frame={f} x={x} y={y} scale={s} loaded />,
    v2: (f, x, y, s) => <StockTrailerV2 frame={f} x={x} y={y} scale={s} loaded />},
  {name: 'transformer haul', s: 0.095, old: (f, x, y, s) => <TransformerHaul frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <TransformerHaulV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'water tanker', s: 0.135, ox: 10, old: (f, x, y, s) => <Tanker frame={f} x={x} y={y} scale={s} water />,
    v2: (f, x, y, s) => <TankerV2 frame={f} x={x} y={y} scale={s} water />},
  {name: 'slab', s: 0.27, old: (f, x, y, s) => <Slab frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <SlabV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'bucket truck, boom up', s: 0.17, ox: 20, old: (f, x, y, s) => <BucketTruck frame={f} x={x} y={y} scale={s} boom={0.45} />,
    v2: (f, x, y, s) => <BucketTruckV2 frame={f} x={x} y={y} scale={s} boom={0.45} crew />},
  {name: 'robot arm cell, halted', s: 0.4, old: (f, x, y, s) => <RobotArm frame={f} x={x} y={y} scale={s} halted />,
    v2: (f, x, y, s) => <CellArmV2 frame={f} x={x} y={y} scale={s} halted />},
  {name: 'conveyor', s: 0.33, ox: -224, old: (f, x, y, s) => <Conveyor frame={f} x={x} y={y} scale={s} flagged={[2]} />,
    v2: (f, x, y, s) => <ConveyorV2 frame={f} x={x} y={y} scale={s} flagged={[2]} />},
  {name: 'inspection head, fail', s: 1.1, old: (f, x, y, s) => <InspectionHead frame={f} x={x} y={y - 60} scale={s} verdict="fail" />,
    v2: (f, x, y, s) => <InspectionHeadV2 frame={f} x={x} y={y - 60} scale={s} verdict="fail" mood="worried" />},
  // page three, the fab, the freight scene and the proving ground
  {name: 'tool bay', s: 0.13, ox: -228, old: (f, x, y, s) => <ToolBay frame={f} x={x} y={y} scale={s} bays={3} state={['run', 'idle', 'down']} />,
    v2: (f, x, y, s) => <ToolBayV2 frame={f} x={x} y={y} scale={s} bays={3} state={['run', 'idle', 'down']} />},
  {name: 'freight backdrop, drive', s: 1, win: FULL, sOld: (f) => <FreightBackdrop mode="drive" progress={loop(f, 60)} secondary={0.3} />,
    sV2: (f) => <FreightBackdropV2 mode="drive" progress={loop(f, 60)} secondary={0.3} frame={f} />},
  {name: 'freight route, map', s: 1, win: FULL, sOld: () => <g><FreightBackdrop mode="route" progress={0.6} />
    <FreightRoute mode="route" progress={0.6} secondary={0.7} /></g>,
  sV2: (f) => <g><FreightBackdropV2 mode="route" progress={0.6} frame={f} /><FreightRouteV2 mode="route" progress={0.6} secondary={0.7} frame={f} /></g>},
  {name: 'freight cab, dock', s: 1, win: FULL, sOld: () => <g><FreightBackdrop mode="dock" progress={0.4} />
    <FreightCab mode="dock" progress={0.4} secondary={0.5} /></g>,
  sV2: (f) => <g><FreightBackdropV2 mode="dock" progress={0.4} frame={f} /><FreightCabV2 mode="dock" progress={0.4} secondary={0.5} frame={f} /></g>},
  {name: 'freight evidence, invite', s: 1, win: FULL, sOld: () => <g><FreightBackdrop mode="invite" />
    <FreightCab mode="invite" /><FreightEvidence mode="invite" label="THE INVITATION" status="DALLAS TO HOUSTON, ONE SEGMENT" progress={0.7} /></g>,
  sV2: (f) => <g><FreightBackdropV2 mode="invite" frame={f} /><FreightCabV2 mode="invite" frame={f} />
    <FreightEvidenceV2 mode="invite" label="THE INVITATION" status="DALLAS TO HOUSTON, ONE SEGMENT" progress={0.7} frame={f} /></g>},
  {name: 'testbench backdrop, oak', s: 1, win: {x0: -100, y0: 700, w: 1280, h: 900}, sOld: () => <g><TestbenchBackdrop mode="haze" />
    <TestbenchBackdrop mode="oak" /><TestbenchBackdrop mode="bench" /></g>,
  sV2: (f) => <g><TestbenchBackdropV2 mode="haze" frame={f} /><TestbenchBackdropV2 mode="oak" frame={f} /><TestbenchBackdropV2 mode="bench" frame={f} /></g>},
  {name: 'proving ground, drill', s: 1, win: {x0: 40, y0: 420, w: 1000, h: 860}, sOld: (f) => <g><TestbenchBackdrop mode="haze" />
    <ProvingGroundRig x={90} y={500} frame={f} mode="drill" a={0.7} b={0.8} c={0} /></g>,
  sV2: (f) => <g><TestbenchBackdropV2 mode="haze" frame={f} /><ProvingGroundRigV2 x={90} y={500} frame={f} mode="drill" a={0.7} b={0.8} c={0} /></g>},
  {name: 'proving ground, field', s: 1, win: {x0: 40, y0: 420, w: 1000, h: 860}, sOld: (f) => <g><TestbenchBackdrop mode="haze" />
    <ProvingGroundRig x={90} y={500} frame={f} mode="field" a={1} b={1} /></g>,
  sV2: (f) => <g><TestbenchBackdropV2 mode="haze" frame={f} /><ProvingGroundRigV2 x={90} y={500} frame={f} mode="field" a={1} b={1} /></g>},
];

const PER = 8;
export const ComputeShelfGallery: React.FC<FilmRenderProps> = ({board}) => {
  const frame = useCurrentFrame();
  const v2 = lookActive(board as never);
  const pages = Math.ceil(CELLS.length / PER);
  const page = Math.floor(frame / 30) % pages;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      {CELLS.slice(page * PER, page * PER + PER).map((c, i) => {
        const col = i % 2, row = Math.floor(i / 2), left = col * 540;
        const x = 270 + left + (c.ox ?? 0), y = 600 + row * 400;
        const scene = v2 ? c.sV2 : c.sOld;
        let body: React.ReactNode = null;
        if (scene && c.win) {
          const top = Math.max(y - 346, 366), hh = y - top, w = c.win;
          const k = Math.min(500 / w.w, hh / w.h);
          const sx = left + 270 - (w.x0 + w.w / 2) * k, sy = top + hh / 2 - (w.y0 + w.h / 2) * k;
          body = <g>
            <defs><clipPath id={`cg-${page}-${i}`}><rect x={left + 270 - w.w * k / 2} y={top} width={w.w * k} height={hh} rx={26} /></clipPath></defs>
            <g clipPath={`url(#cg-${page}-${i})`}><g transform={`translate(${sx} ${sy}) scale(${k})`}>{scene(frame)}</g></g>
          </g>;
        } else body = v2 ? c.v2?.(frame, x, y, c.s) : c.old?.(frame, x, y, c.s);
        return <g key={c.name}>
          {!scene && <rect x={left + 20} y={y} width={500} height={6} rx={3} fill="#2b2440" opacity={0.15} />}
          {body}
          <text x={left + 270} y={y + 52} textAnchor="middle" fontFamily={FONT.body} fontWeight={700}
            fontSize={28} fill="#2b2440">{c.name}</text>
        </g>;
      })}
    </svg>
  );
};
