import React from 'react';
import {useCurrentFrame} from 'remotion';
import {FONT} from '../../../../lib/type';
import type {FilmRenderProps} from '../../../../modern/types';
import {
  CameraArray, CaptureFrame, CaptureZone, DeploymentDecision, HumanFactors, MetricsBlind, OptOutLane, PergolaWalkway, SourceReveal,
  SuitabilityPipeline, TravelerFlow,
} from '../../../../lib/biometrics';
import {ContourPlan, Gantry, ReadingStation, TowerBlock} from '../../../../lib/clinic';
import {AssociationDiagram, DataJoin, DocumentStream, InspectionMap} from '../../../../lib/evidence';
import {FaxChart, FaxClinic, FaxDesk, FaxDocument, FaxReport} from '../../../../lib/faxwork';
import {
  CameraArrayV2, CaptureFrameV2, CaptureZoneV2, DeploymentDecisionV2, HumanFactorsV2, MetricsBlindV2, OptOutLaneV2, PergolaWalkwayV2,
  SourceRevealV2, SuitabilityPipelineV2, TravelerFlowV2,
} from '../../../../look/shelf/biometrics';
import {ContourPlanV2, GantryV2, ReadingStationV2, TowerBlockV2} from '../../../../look/shelf/clinic';
import {AssociationDiagramV2, DataJoinV2, DocumentStreamV2, InspectionMapV2} from '../../../../look/shelf/evidence';
import {FaxChartV2, FaxClinicV2, FaxDeskV2, FaxDocumentV2, FaxReportV2} from '../../../../look/shelf/faxwork';
import {lookActive} from '../../../../look/tokens';

/**
 * look-v2-shelf-clinic (written November 14th, 2026). The before and after sheet for the clinic set,
 * health care, identity checks, evidence and office paperwork. lib/biometrics.tsx, lib/clinic.tsx,
 * lib/evidence.tsx and lib/faxwork.tsx, twenty four drawings. Each cell hands the library drawing and
 * its V2 the very same props, so the place, the scale and the story state match exactly, and only the
 * look changes. Screen pieces are fitted to the cell from a box in their own frame, true size pieces
 * stand on the ground line. Eight cells a page, a page a second. Not an edition.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFC = React.FC<any>;
type At = (left: number, gy: number, top: number) => Record<string, number>;
type Cell = {name: string; old: AnyFC; v2: AnyFC; at: At; props?: Record<string, unknown>; fo?: number; clip?: boolean};

/** fit a box of the drawing's own frame (x0, y0, x1, y1) into the cell between `top` and the ground line, centred */
const fit = (b: [number, number, number, number]): At => (left, gy, top) => {
  const hh = gy - 20 - top, s = Math.min(500 / (b[2] - b[0]), hh / (b[3] - b[1]));
  return {x: left + 270 - (b[0] + b[2]) / 2 * s, y: top + 14 + hh / 2 - (b[1] + b[3]) / 2 * s, scale: s};
};
/** a true size drawing standing on the ground line */
const stand = (s: number, ox = 0): At => (left, gy) => ({x: left + 270 + ox, y: gy, scale: s});

const CELLS: Cell[] = [
  // page one, the border identity check
  {name: 'pergola walkway', old: PergolaWalkway, v2: PergolaWalkwayV2, at: fit([40, 500, 1040, 1180]), clip: true, props: {night: true}},
  {name: 'camera array', old: CameraArray, v2: CameraArrayV2, at: fit([120, 660, 960, 1490]), fo: 40},
  {name: 'traveler flow', old: TravelerFlow, v2: TravelerFlowV2, at: fit([300, 990, 820, 1590]), props: {progress: 0.5, label: 'TRAVELER'}, fo: 40},
  {name: 'capture frame', old: CaptureFrame, v2: CaptureFrameV2, at: fit([330, 750, 700, 1170]), props: {mode: 'tile', progress: 0.3}},
  {name: 'source reveal', old: SourceReveal, v2: SourceRevealV2, fo: 120,
    at: (left, gy, top) => ({x: left + 270 - 540, y: (top + gy) / 2 - 960, scale: (gy - top) / 880})},
  {name: 'human factors', old: HumanFactors, v2: HumanFactorsV2, at: fit([90, 430, 990, 1430]), fo: 90},
  {name: 'capture zone', old: CaptureZone, v2: CaptureZoneV2, at: fit([180, 420, 900, 1350]), fo: 60},
  {name: 'suitability pipeline', old: SuitabilityPipeline, v2: SuitabilityPipelineV2, at: fit([20, 690, 1060, 1330]), fo: 80},
  // page two, the border decision and the clinic
  {name: 'deployment decision', old: DeploymentDecision, v2: DeploymentDecisionV2, at: fit([100, 700, 980, 1240]), fo: 80},
  {name: 'opt-out lane', old: OptOutLane, v2: OptOutLaneV2, at: fit([260, 640, 1010, 1590]), fo: 60},
  {name: 'metrics blind', old: MetricsBlind, v2: MetricsBlindV2, at: fit([100, 470, 980, 1640]), fo: 120},
  {name: 'CT gantry', old: Gantry, v2: GantryV2, at: stand(0.38, -80), props: {kind: 'ct', scanning: 0.8, couch: 0.4, mood: 'happy'}},
  {name: 'contour plan', old: ContourPlan, v2: ContourPlanV2, at: (left, gy, top) => ({x: left + 270 - (gy - top - 10) / 2, y: top, w: gy - top - 10, h: gy - top - 10}),
    props: {progress: 0.72, label: 'AUTO CONTOUR'}},
  {name: 'reading station', old: ReadingStation, v2: ReadingStationV2, at: stand(0.5), props: {alerts: 3}},
  {name: 'tower block', old: TowerBlock, v2: TowerBlockV2, at: stand(0.0195, -215)},
  {name: 'document stream', old: DocumentStream, v2: DocumentStreamV2, at: fit([0, 0, 820, 600]), fo: 60,
    props: {title: 'Crash narratives', count: '41,206', sample: 'Driver said the sun was low', status: 'parsing to fields'}},
  // page three, evidence and the fax desk
  {name: 'data join', old: DataJoin, v2: DataJoinV2, at: fit([0, 0, 840, 590]), fo: 70,
    props: {leftTitle: 'Permits', leftCount: '1,284', rightTitle: 'Inspections', rightCount: '962', result: '611 matched'}},
  {name: 'association diagram', old: AssociationDiagram, v2: AssociationDiagramV2, at: fit([0, 0, 840, 600]), fo: 60,
    props: {leftLabel: 'More heat', rightLabel: 'More ER visits', relation: 'moves together', limit: 'not shown to cause'}},
  {name: 'inspection map', old: InspectionMap, v2: InspectionMapV2, at: fit([0, 0, 840, 620]), fo: 60,
    props: {title: 'Bridge checks', county: 'Hidalgo', segments: ['FM 495', 'US 281', 'SH 107'], status: 'crew assigned'}},
  {name: 'fax document', old: FaxDocument, v2: FaxDocumentV2, at: fit([-10, -10, 610, 520]),
    props: {mode: 'structured', progress: 0.7, extract: 0.6, label: 'Referral, page 1'}},
  {name: 'fax chart', old: FaxChart, v2: FaxChartV2, at: fit([-110, -20, 480, 600]),
    props: {mode: 'open', progress: 0.5, dock: 1, fan: 0.6, label: 'Patient chart'}},
  {name: 'fax desk', old: FaxDesk, v2: FaxDeskV2, at: fit([0, -60, 910, 440]), clip: true, props: {mode: 'work', progress: 0.5, label: 'Intake desk'}},
  {name: 'fax report', old: FaxReport, v2: FaxReportV2, at: fit([0, 0, 670, 560]),
    props: {mode: 'report', label: 'Fax workflow review', date: '2026-11-12', unfold: 1}},
  {name: 'fax clinic', old: FaxClinic, v2: FaxClinicV2, at: fit([60, 320, 1020, 1180]), clip: true,
    props: {mode: 'waiting', patient: 0.5, question: 1, label: 'Waiting on a fax'}},
];
const PER_PAGE = 8;
/** the county chip sits over the top left cell, so that one cell starts lower */
const topOf = (i: number, gy: number) => (i === 0 ? 372 : gy - 346);

export const ClinicShelfGallery: React.FC<FilmRenderProps> = ({board}) => {
  const frame = useCurrentFrame();
  const v2 = lookActive(board as never);
  const pages = Math.ceil(CELLS.length / PER_PAGE);
  const page = Math.floor(frame / 30) % pages;
  const shown = CELLS.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <defs>{shown.map((c, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const gy = 600 + row * 400, top = topOf(i, gy);
        return <clipPath key={c.name} id={`clinic-cell-${page}-${i}`}>
          <rect x={col * 540 + 20} y={top} width={500} height={gy - top} rx={30} /></clipPath>;
      })}</defs>
      {shown.map((c, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const left = col * 540, gy = 600 + row * 400;
        const Comp = v2 ? c.v2 : c.old;
        const drawn = <Comp frame={frame + (c.fo ?? 0)} {...c.props} {...c.at(left, gy, topOf(i, gy))} />;
        return <g key={c.name}>
          <rect x={left + 20} y={gy} width={500} height={6} rx={3} fill="#2b2440" opacity={0.15} />
          {c.clip ? <g clipPath={`url(#clinic-cell-${page}-${i})`}>{drawn}</g> : drawn}
          <text x={left + 270} y={gy + 52} textAnchor="middle" fontFamily={FONT.body} fontWeight={700}
            fontSize={28} fill="#2b2440">{c.name}</text>
        </g>;
      })}
    </svg>
  );
};
