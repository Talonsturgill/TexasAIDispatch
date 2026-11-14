import React from 'react';
import {useCurrentFrame} from 'remotion';
import {FONT} from '../../../../lib/type';
import type {FilmRenderProps} from '../../../../modern/types';
import {AsheJuniper, BaldCypress, Bluebonnet, Bluestem, BoisDArc, Cordgrass, CottonField, Cottonwood, CrepeMyrtle, GrassTuft, Huisache,
  Lechuguilla, LiveOak, Loblolly, Ocotillo, OrchardRow, Pecan, PostOak, SabalPalm, Sorghum, Sotol, Sunflower, Tumbleweed,
  WildflowerVerge, Yucca} from '../../../../lib/flora';
import {AsheJuniperV2, BaldCypressV2, BluebonnetV2, BluestemV2, BoisDArcV2, CordgrassV2, CottonFieldV2, CottonwoodV2, CrepeMyrtleV2,
  GrassTuftV2, HuisacheV2, LechuguillaV2, LiveOakV2, LoblollyV2, OcotilloV2, OrchardRowV2, PecanV2, PostOakV2, SabalPalmV2, SorghumV2,
  SotolV2, SunflowerV2, TumbleweedV2, WildflowerVergeV2, YuccaV2} from '../../../../look/shelf/flora';
import {lookActive} from '../../../../look/tokens';

/**
 * look-v2-shelf-flora (written November 14th, 2026). The flora set's before and after sheet. Each
 * cell stands one plant on a ground line, the library's under the old look and the v2 drawing under
 * the new, at the same place, scale and season. Twenty five drawings on four pages of eight, a page
 * a second, ordered so the short and wide plants take the top row under the county chip. Field
 * drawings (the verge, the grasses and the crops) are laid as a strip that ends at the ground line. Seasons are picked so each plant shows its tell (huisache and yucca in bloom, the
 * sotol pole, the rust bluestem). Not an edition.
 */
type Draw = (f: number, x: number, y: number, s: number) => React.ReactNode;
type Cell = {name: string; s: number; ox?: number; old: Draw; v2: Draw};

const FW = 430;
const CELLS: Cell[] = [
  {name: 'live oak', s: 0.047, old: (_f, x, y, s) => <LiveOak x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <LiveOakV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'post oak', s: 0.056, old: (_f, x, y, s) => <PostOak x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <PostOakV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'pecan', s: 0.037, old: (_f, x, y, s) => <Pecan x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <PecanV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'loblolly pine', s: 0.03, old: (_f, x, y, s) => <Loblolly x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <LoblollyV2 frame={f} x={x} y={y} scale={s} />},
  {name: "bois d'arc", s: 0.07, old: (_f, x, y, s) => <BoisDArc x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <BoisDArcV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'cottonwood', s: 0.035, old: (f, x, y, s) => <Cottonwood frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <CottonwoodV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'bald cypress (fall)', s: 0.031, old: (_f, x, y, s) => <BaldCypress x={x} y={y} scale={s} season="fall" />,
    v2: (f, x, y, s) => <BaldCypressV2 frame={f} x={x} y={y} scale={s} season="fall" />},
  {name: 'ashe juniper (cedar)', s: 0.11, old: (f, x, y, s) => <AsheJuniper frame={f} x={x} y={y} scale={s} pollen />,
    v2: (f, x, y, s) => <AsheJuniperV2 frame={f} x={x} y={y} scale={s} pollen />},
  {name: 'huisache (spring)', s: 0.1, old: (_f, x, y, s) => <Huisache x={x} y={y} scale={s} season="spring" />,
    v2: (f, x, y, s) => <HuisacheV2 frame={f} x={x} y={y} scale={s} season="spring" />},
  {name: 'lechuguilla', s: 0.9, old: (_f, x, y, s) => <Lechuguilla x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <LechuguillaV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'crepe myrtle', s: 0.12, old: (_f, x, y, s) => <CrepeMyrtle x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <CrepeMyrtleV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'sabal palm', s: 0.058, old: (_f, x, y, s) => <SabalPalm x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <SabalPalmV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'ocotillo (in bloom)', s: 0.17, old: (_f, x, y, s) => <Ocotillo x={x} y={y} scale={s} blooming />,
    v2: (f, x, y, s) => <OcotilloV2 frame={f} x={x} y={y} scale={s} blooming />},
  {name: 'yucca (spring)', s: 0.34, old: (_f, x, y, s) => <Yucca x={x} y={y} scale={s} season="spring" />,
    v2: (f, x, y, s) => <YuccaV2 frame={f} x={x} y={y} scale={s} season="spring" />},
  {name: 'sotol', s: 0.21, old: (_f, x, y, s) => <Sotol x={x} y={y} scale={s} season="fall" />,
    v2: (f, x, y, s) => <SotolV2 frame={f} x={x} y={y} scale={s} season="fall" />},
  {name: 'sunflower', s: 0.45, old: (_f, x, y, s) => <Sunflower x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <SunflowerV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'wildflower verge', s: 0.8, old: (_f, x, y, s) => <WildflowerVerge x={x} y={y - 110} scale={s} w={FW} depth={110} density={0.7} />,
    v2: (f, x, y, s) => <WildflowerVergeV2 frame={f} x={x} y={y - 110} scale={s} w={FW} depth={110} density={0.7} />},
  {name: 'little bluestem (fall)', s: 0.4, old: (f, x, y, s) => <Bluestem frame={f} x={x} y={y - 100} scale={s} w={FW} depth={100} density={0.4} />,
    v2: (f, x, y, s) => <BluestemV2 frame={f} x={x} y={y - 100} scale={s} w={FW} depth={100} density={0.4} />},
  {name: 'bluebonnet', s: 2.1, old: (_f, x, y, s) => <Bluebonnet x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <BluebonnetV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'grass tuft', s: 1.3, old: (_f, x, y, s) => <GrassTuft x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <GrassTuftV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'cordgrass', s: 0.36, old: (f, x, y, s) => <Cordgrass frame={f} x={x} y={y - 90} scale={s} w={FW} depth={90} density={0.4} />,
    v2: (f, x, y, s) => <CordgrassV2 frame={f} x={x} y={y - 90} scale={s} w={FW} depth={90} density={0.4} />},
  {name: 'sorghum', s: 0.24, old: (f, x, y, s) => <Sorghum frame={f} x={x} y={y - 120} scale={s} w={FW} depth={120} rows={4} />,
    v2: (f, x, y, s) => <SorghumV2 frame={f} x={x} y={y - 120} scale={s} w={FW} depth={120} rows={4} />},
  {name: 'cotton field', s: 0.34, old: (_f, x, y, s) => <CottonField x={x} y={y - 120} scale={s} w={FW} depth={120} rows={4} />,
    v2: (f, x, y, s) => <CottonFieldV2 frame={f} x={x} y={y - 120} scale={s} w={FW} depth={120} rows={4} />},
  {name: 'peach orchard', s: 0.075, old: (_f, x, y, s) => <OrchardRow x={x} y={y - 100} scale={s} w={FW} depth={100} rows={3} />,
    v2: (f, x, y, s) => <OrchardRowV2 frame={f} x={x} y={y - 100} scale={s} w={FW} depth={100} rows={3} />},
  {name: 'tumbleweed', s: 0.8, old: (f, x, y, s) => <Tumbleweed frame={f} x={x} y={y - 120 * s} scale={s} />,
    v2: (f, x, y, s) => <TumbleweedV2 frame={f} x={x} y={y} scale={s} />},
];

const PER = 8;
export const FloraShelfGallery: React.FC<FilmRenderProps> = ({board}) => {
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
