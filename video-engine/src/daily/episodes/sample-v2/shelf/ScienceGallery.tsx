import React from 'react';
import {useCurrentFrame} from 'remotion';
import {FONT} from '../../../../lib/type';
import type {FilmRenderProps} from '../../../../modern/types';
import {
  CandidateLattice, CandidateSpecimen, CommercialPath, CompoundRecipe, LabBench, LabWindow, MagnetMeasure, MaterialSupply,
  PermanentMotor, ResearchGrant, SynthesisBench,
} from '../../../../lib/magnets';
import {
  AbsorptionBands, ApplicationRecord, AustinLabEvidence, ContactSensor, FeasibilityBench, PowderSample, SpectralComparison,
  SpectralSurface, TrainingExample,
} from '../../../../lib/spectral';
import {CoadaptEvidence, CoadaptFurnishing, CoadaptRobot, CoadaptRoom, ConsentDoor, HandoffCup} from '../../../../lib/coadaptation';
import {
  CandidateLatticeV2, CandidateSpecimenV2, CommercialPathV2, CompoundRecipeV2, LabBenchV2, LabWindowV2, MagnetMeasureV2,
  MaterialSupplyV2, PermanentMotorV2, ResearchGrantV2, SynthesisBenchV2,
} from '../../../../look/shelf/magnets';
import {
  AbsorptionBandsV2, ApplicationRecordV2, AustinLabEvidenceV2, ContactSensorV2, FeasibilityBenchV2, PowderSampleV2,
  SpectralComparisonV2, SpectralSurfaceV2, TrainingExampleV2,
} from '../../../../look/shelf/spectral';
import {
  CoadaptEvidenceV2, CoadaptFurnishingV2, CoadaptRobotV2, CoadaptRoomV2, ConsentDoorV2, HandoffCupV2,
} from '../../../../look/shelf/coadaptation';
import {lookActive} from '../../../../look/tokens';

/**
 * look-v2-shelf-science (written November 14th, 2026). The before and after sheet for the science set,
 * magnets and the materials hunt, spectra and sensing bands, and the co-adaptation robot study.
 * lib/magnets.tsx, lib/spectral.tsx and lib/coadaptation.tsx, twenty six drawings. Each cell hands the
 * library drawing and its V2 the very same props, so the place, the scale and the story state match
 * and only the look changes. Every piece in this set is a screen space close-up, so each is fitted to
 * its cell from a box in its own frame. The backdrops take no place props and are fitted from outside
 * with a transform. Eight cells a page, a page a second. Not an edition.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFC = React.FC<any>;
type Box = [number, number, number, number];
type At = (left: number, gy: number, top: number) => Record<string, number>;
type Cell = {
  name: string; old: AnyFC; v2: AnyFC; at?: At; props?: Record<string, unknown>; fo?: number; clip?: boolean;
  /** a backdrop with no place props, fitted from this box of its own frame by a transform */
  wrap?: Box; layers?: Record<string, unknown>[];
};

/** the scale and offset that fit a box of the drawing's own frame (x0, y0, x1, y1) into the cell, centred */
const fitOf = (b: Box, left: number, gy: number, top: number) => {
  const hh = gy - 6 - top, s = Math.min(500 / (b[2] - b[0]), hh / (b[3] - b[1]));
  return {x: left + 270 - (b[0] + b[2]) / 2 * s, y: top + hh / 2 - (b[1] + b[3]) / 2 * s, scale: s};
};
const fit = (b: Box): At => (left, gy, top) => fitOf(b, left, gy, top);
/** the robot stands on the ground line and its wrist target moves with it, at the library's default reach */
const robotAt: At = (left, gy, top) => {
  const s = (gy - top - 14) / 540, x = left + 230, y = gy - 4;
  return {x, y, scale: s, wristX: x + 195 * s, wristY: y - 330 * s};
};

const CELLS: Cell[] = [
  // page one, magnets and the materials hunt
  {name: 'permanent motor', old: PermanentMotor, v2: PermanentMotorV2, at: fit([0, 0, 720, 750]), fo: 130,
    props: {label: 'PERMANENT MAGNET MOTOR', status: 'EXISTING MOTOR, BLOWER FAN', mode: 'future'}},
  {name: 'candidate lattice', old: CandidateLattice, v2: CandidateLatticeV2, at: fit([0, 0, 770, 790]), fo: 140,
    props: {label: 'AI MAGNET MATERIALS', status: 'COMPOUND PREDICTIONS', mode: 'recipe'}},
  {name: 'synthesis bench', old: SynthesisBench, v2: SynthesisBenchV2, at: fit([-50, 0, 810, 830]), fo: 130,
    props: {label: 'SYNTHESIZE CANDIDATES', status: 'PROPOSED WORKFLOW'}},
  {name: 'magnet measure', old: MagnetMeasure, v2: MagnetMeasureV2, at: fit([0, 0, 760, 810]), fo: 130,
    props: {label: 'MEASURE PROPERTIES', status: 'NO PROJECT DATA SHOWN'}},
  {name: 'research grant', old: ResearchGrant, v2: ResearchGrantV2, at: fit([20, 20, 720, 740]), fo: 130,
    props: {label: 'September 1st', detail: 'Federal research support', status: 'RESEARCH ANNOUNCED'}},
  {name: 'commercial path', old: CommercialPath, v2: CommercialPathV2, at: fit([0, 0, 760, 720]), fo: 130,
    props: {label: 'FROM CANDIDATE TO MARKET', status: 'SYNTHESIS AND TESTING FIRST'}},
  {name: 'lab window', old: LabWindow, v2: LabWindowV2, at: fit([-60, -10, 780, 720]), clip: true},
  {name: 'lab bench', old: LabBench, v2: LabBenchV2, at: fit([-240, -10, 1120, 460]), clip: true},
  // page two, the rest of the magnets and the first spectral pieces
  {name: 'material supply', old: MaterialSupply, v2: MaterialSupplyV2, at: fit([0, 0, 650, 760]), fo: 130,
    props: {label: 'DOMESTIC SOURCING GOAL', status: 'SOURCE AND MAKE MORE RELIABLY'}},
  {name: 'compound recipe', old: CompoundRecipe, v2: CompoundRecipeV2, at: fit([0, 0, 740, 800]), fo: 130,
    props: {label: 'COMPOUND TO SYNTHESIS', status: 'BOTH ARE PREDICTIONS'}},
  {name: 'candidate specimen', old: CandidateSpecimen, v2: CandidateSpecimenV2, at: fit([0, 0, 520, 530]), fo: 130,
    props: {label: 'CANDIDATE', status: 'MUST BE TESTED'}},
  {name: 'powder sample', old: PowderSample, v2: PowderSampleV2, at: fit([-185, -100, 560, 240]),
    props: {label: 'Powder samples', mode: 'pair', progress: 1}},
  {name: 'contact sensor', old: ContactSensor, v2: ContactSensorV2, at: fit([-200, -490, 330, 40]),
    props: {label: 'Contact sensing', progress: 1, secondary: 1, tertiary: 0}},
  {name: 'absorption bands', old: AbsorptionBands, v2: AbsorptionBandsV2, at: fit([-340, -390, 340, 390]),
    props: {label: 'Light absorption illustrated', progress: 1, secondary: 1, tertiary: 1}},
  {name: 'spectral comparison', old: SpectralComparison, v2: SpectralComparisonV2, at: fit([-350, -200, 350, 470]),
    props: {label: 'Company demonstration illustrated', mode: 'compare', progress: 1, secondary: 1, tertiary: 1}},
  {name: 'feasibility bench', old: FeasibilityBench, v2: FeasibilityBenchV2, at: fit([-370, -380, 380, 470]),
    props: {label: 'Handle or sort after testing', mode: 'sort', progress: 0.6, secondary: 1, tertiary: 1}},
  // page three, the spectral lab and the co-adaptation study
  {name: 'Austin lab evidence', old: AustinLabEvidence, v2: AustinLabEvidenceV2, at: fit([-370, -230, 370, 400]),
    props: {label: 'Austin opening', date: 'September 17th', progress: 1, secondary: 1}},
  {name: 'spectral surface', old: SpectralSurface, v2: SpectralSurfaceV2, wrap: [-100, 900, 1180, 1620], clip: true,
    layers: [{mode: 'wall'}, {mode: 'worktop'}]},
  {name: 'training example', old: TrainingExample, v2: TrainingExampleV2, at: fit([-340, -320, 390, 340]),
    props: {label: 'Unknown sample needs teaching', progress: 1, secondary: 1, tertiary: 1}},
  {name: 'application record', old: ApplicationRecord, v2: ApplicationRecordV2, at: fit([-180, -200, 190, 225]),
    props: {label: 'Application test', progress: 1}},
  {name: 'co-adapt robot', old: CoadaptRobot, v2: CoadaptRobotV2, at: robotAt, props: {release: 0.4}},
  {name: 'handoff cup', old: HandoffCup, v2: HandoffCupV2, at: fit([-50, -20, 100, 100])},
  {name: 'co-adapt room', old: CoadaptRoom, v2: CoadaptRoomV2, wrap: [0, 300, 1080, 1350], clip: true,
    layers: [{mode: 'shared-building', open: 0.5, label: 'Homes and care'}]},
  {name: 'co-adapt evidence', old: CoadaptEvidence, v2: CoadaptEvidenceV2, at: fit([-10, -5, 720, 275]),
    props: {label: 'Simulated apartment', mode: 'source', progress: 1}},
  // page four
  {name: 'co-adapt furnishing', old: CoadaptFurnishing, v2: CoadaptFurnishingV2, wrap: [0, 1380, 1080, 1800], clip: true,
    layers: [{mode: 'floor'}, {mode: 'shelf'}]},
  {name: 'consent door', old: ConsentDoor, v2: ConsentDoorV2, at: fit([-40, -60, 245, 575]), props: {open: 0.5}},
];
const PER_PAGE = 8;
/** the county chip sits over the top left cell, so that one cell starts lower */
const topOf = (i: number, gy: number) => (i === 0 ? 372 : gy - 332);

export const ScienceShelfGallery: React.FC<FilmRenderProps> = ({board}) => {
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
        return <clipPath key={c.name} id={`science-cell-${page}-${i}`}>
          <rect x={col * 540 + 20} y={top} width={500} height={gy - top} rx={30} /></clipPath>;
      })}</defs>
      {shown.map((c, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const left = col * 540, gy = 600 + row * 400, top = topOf(i, gy);
        const Comp = v2 ? c.v2 : c.old;
        const f = frame + (c.fo ?? 0);
        let drawn: React.ReactNode;
        if (c.wrap) {
          const t = fitOf(c.wrap, left, gy, top);
          drawn = <g transform={`translate(${t.x} ${t.y}) scale(${t.scale})`}>
            {(c.layers ?? [{}]).map((l, k) => <Comp key={k} frame={f} {...l} />)}</g>;
        } else {
          drawn = <Comp frame={f} {...c.props} {...c.at!(left, gy, top)} />;
        }
        return <g key={c.name}>
          <rect x={left + 20} y={gy} width={500} height={6} rx={3} fill="#2b2440" opacity={0.15} />
          {c.clip ? <g clipPath={`url(#science-cell-${page}-${i})`}>{drawn}</g> : drawn}
          <text x={left + 270} y={gy + 52} textAnchor="middle" fontFamily={FONT.body} fontWeight={700}
            fontSize={28} fill="#2b2440">{c.name}</text>
        </g>;
      })}
    </svg>
  );
};
