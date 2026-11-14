import React from 'react';
import {useCurrentFrame} from 'remotion';
import {FONT} from '../../../../lib/type';
import type {FilmRenderProps} from '../../../../modern/types';
import {
  Armadillo, BatColumn, CattleEgret, Coyote, FeralHog, Grackle, HornedLizard, Jackrabbit, Javelina, Longhorn, Mockingbird, Pronghorn,
  Roadrunner, TurkeyVulture, Whitetail,
} from '../../../../lib/fauna';
import {
  ArmadilloV2, BatColumnV2, CattleEgretV2, CoyoteV2, FeralHogV2, GrackleV2, HornedLizardV2, JackrabbitV2, JavelinaV2, LonghornV2, MockingbirdV2,
  PronghornV2, RoadrunnerV2, TurkeyVultureV2, WhitetailV2,
} from '../../../../look/shelf/fauna';
import {Biome} from '../../../../lib/biomes';
import {ScrewwormCycle, ScrewwormDispatch, ScrewwormForecast, ScrewwormResearch, ScrewwormRoute, ScrewwormSurface} from '../../../../lib/screwworm';
import {BiomeV2} from '../../../../look/shelf/biomes';
import {
  ScrewwormCycleV2, ScrewwormDispatchV2, ScrewwormForecastV2, ScrewwormResearchV2, ScrewwormRouteV2, ScrewwormSurfaceV2,
} from '../../../../look/shelf/screwworm';
import {lookActive} from '../../../../look/tokens';

/**
 * look-v2-shelf-fauna (written November 14th, 2026). The reference sheet for the fauna set, the animals
 * of lib/fauna.tsx, the biome backdrop of lib/biomes.tsx and the screwworm diagrams of lib/screwworm.tsx.
 * Each cell stands the library drawing under the old look and the v2 redraw under the new, at the same
 * place and scale, with the same props. Eight cells a page, one page a second. Not an edition.
 */
type Draw = (f: number, x: number, y: number, s: number) => React.ReactNode;
type Scene = (f: number) => React.ReactNode;
type Html = (f: number, v2: boolean) => React.ReactNode;
/** A drawing cell (old, v2), a screen scene cell (sOld, sV2, drawn on its own paper and shrunk into the cell) or an HTML cell. */
type Cell = {name: string; s: number; ox?: number; oy?: number; old?: Draw; v2?: Draw; sOld?: Scene; sV2?: Scene; html?: Html};
const CELLS: Cell[] = [
  {name: 'great-tailed grackle', s: 2.6, ox: 40, old: (f, x, y, s) => <Grackle frame={f} x={x} y={y} scale={s} calling />,
    v2: (f, x, y, s) => <GrackleV2 frame={f} x={x} y={y} scale={s} calling />},
  {name: 'mockingbird', s: 3.6, ox: 40, old: (f, x, y, s) => <Mockingbird frame={f} x={x} y={y} scale={s} singing flashing />,
    v2: (f, x, y, s) => <MockingbirdV2 frame={f} x={x} y={y} scale={s} singing flashing />},
  {name: 'armadillo', s: 1.5, ox: 40, old: (f, x, y, s) => <Armadillo frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <ArmadilloV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'pronghorn', s: 0.55, old: (f, x, y, s) => <Pronghorn frame={f} x={x} y={y} scale={s} alarmed />,
    v2: (f, x, y, s) => <PronghornV2 frame={f} x={x} y={y} scale={s} alarmed />},
  {name: 'turkey vulture', s: 0.7, oy: -170, old: (f, x, y, s) => <TurkeyVulture frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <TurkeyVultureV2 frame={f} x={x} y={y} scale={s} shadowY={170} />},
  {name: 'longhorn', s: 0.42, old: (f, x, y, s) => <Longhorn frame={f} x={x} y={y} scale={s} hide="#b8763f" />,
    v2: (f, x, y, s) => <LonghornV2 frame={f} x={x} y={y} scale={s} hide="#b8763f" />},
  {name: 'white-tailed deer', s: 0.5, old: (f, x, y, s) => <Whitetail frame={f} x={x} y={y} scale={s} points={8} flagging />,
    v2: (f, x, y, s) => <WhitetailV2 frame={f} x={x} y={y} scale={s} points={8} flagging />},
  {name: 'jackrabbit', s: 1.45, old: (f, x, y, s) => <Jackrabbit frame={f} x={x} y={y} scale={s} backlit />,
    v2: (f, x, y, s) => <JackrabbitV2 frame={f} x={x} y={y} scale={s} backlit />},
  // page two
  {name: 'roadrunner', s: 2.1, ox: 50, old: (f, x, y, s) => <Roadrunner frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <RoadrunnerV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'cattle egret', s: 1.7, old: (f, x, y, s) => <CattleEgret frame={f} x={x} y={y} scale={s} breeding />,
    v2: (f, x, y, s) => <CattleEgretV2 frame={f} x={x} y={y} scale={s} breeding />},
  {name: 'horned lizard', s: 8, old: (f, x, y, s) => <HornedLizard frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <HornedLizardV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'feral hog, rooting', s: 0.6, ox: -50, old: (f, x, y, s) => <FeralHog frame={f} x={x} y={y} scale={s} rooting boar />,
    v2: (f, x, y, s) => <FeralHogV2 frame={f} x={x} y={y} scale={s} rooting boar />},
  {name: 'javelina', s: 1.15, old: (f, x, y, s) => <Javelina frame={f} x={x} y={y} scale={s} alarmed />,
    v2: (f, x, y, s) => <JavelinaV2 frame={f} x={x} y={y} scale={s} alarmed />},
  {name: 'coyote', s: 0.95, ox: 20, old: (f, x, y, s) => <Coyote frame={f} x={x} y={y} scale={s} trotting />,
    v2: (f, x, y, s) => <CoyoteV2 frame={f} x={x} y={y} scale={s} trotting />},
  {name: 'bat column', s: 0.42, old: (f, x, y, s) => <BatColumn frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <BatColumnV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'biome, south texas', s: 1, html: (f, v2) => v2 ? <BiomeV2 region="south_texas" frame={f} seed={7} />
    : <Biome region="south_texas" frame={f} seed={7} />},
  // page three, the screwworm diagrams
  {name: 'screwworm cycle', s: 1, sOld: (f) => <ScrewwormCycle mode="cycle" label="Sterile flies" a={0.85} b={0.75} frame={f} />,
    sV2: (f) => <ScrewwormCycleV2 mode="cycle" label="Sterile flies" a={0.85} b={0.75} frame={f} />},
  {name: 'screwworm release', s: 1, sOld: (f) => <ScrewwormCycle mode="release" label="Release" a={0.55} b={0.3} frame={f} />,
    sV2: (f) => <ScrewwormCycleV2 mode="release" label="Release" a={0.55} b={0.3} frame={f} />},
  {name: 'screwworm forecast', s: 1, sOld: (f) => <ScrewwormForecast mode="inputs" a={1} b={0.9} c={0.85} frame={f} />,
    sV2: (f) => <ScrewwormForecastV2 mode="inputs" a={1} b={0.9} c={0.85} frame={f} />},
  {name: 'screwworm research', s: 1, sOld: (f) => <ScrewwormResearch date="June 2026" a={1} b={0.8} />,
    sV2: (f) => <ScrewwormResearchV2 date="June 2026" a={1} b={0.8} frame={f} />},
  {name: 'screwworm dispatch', s: 1, sOld: (f) => <ScrewwormDispatch a={0.5} b={0.45} frame={f} />,
    sV2: (f) => <ScrewwormDispatchV2 a={0.5} b={0.45} frame={f} />},
  {name: 'screwworm dispatch, close', s: 1, sOld: (f) => <ScrewwormDispatch mode="close" a={0.6} b={0.8} frame={f} />,
    sV2: (f) => <ScrewwormDispatchV2 mode="close" a={0.6} b={0.8} frame={f} />},
  {name: 'screwworm route', s: 1, sOld: () => <ScrewwormRoute a={0.5} b={0.3} />,
    sV2: (f) => <ScrewwormRouteV2 a={0.5} b={0.3} frame={f} />},
  {name: 'screwworm surface', s: 0.177, sOld: () => <g><ScrewwormSurface mode="setting" /><ScrewwormSurface mode="header" /></g>,
    sV2: (f) => <g><ScrewwormSurfaceV2 mode="setting" frame={f} /><ScrewwormSurfaceV2 mode="header" frame={f} /></g>},
];
/** a screen scene's useful window in the 1080 by 1920 frame, shrunk into a cell 500 by 340 above its ground line */
const WIN = {x0: 30, y0: 260, w: 890, h: 960};
const PER_PAGE = 8;

export const FaunaShelfGallery: React.FC<FilmRenderProps> = ({board}) => {
  const frame = useCurrentFrame();
  const v2 = lookActive(board as never);
  const pages = Math.ceil(CELLS.length / PER_PAGE);
  const page = Math.floor(frame / 30) % pages;
  const shown = CELLS.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        {shown.map((c, i) => {
          const col = i % 2, row = Math.floor(i / 2);
          const left = col * 540, x = 270 + left + (c.ox ?? 0), y = 600 + row * 400;
          const scene = v2 ? c.sV2 : c.sOld;
          const full = c.name.includes('surface');
          const top = Math.max(y - 346, 366), hh = y - top;
          const k = full ? 500 / 1080 : Math.min(500 / WIN.w, (hh - 4) / WIN.h);
          const sx = full ? left + 20 : left + 270 - (WIN.x0 + WIN.w / 2) * k, sy = full ? top : y - 2 - (WIN.y0 + WIN.h) * k;
          return <g key={c.name}>
            {!scene && !c.html && <rect x={left + 20} y={y} width={500} height={6} rx={3} fill="#2b2440" opacity={0.15} />}
            {scene && <g>
              <defs><clipPath id={`fg-c${i}`}><rect x={left + 20} y={top} width={500} height={hh} rx={28} /></clipPath></defs>
              <g clipPath={`url(#fg-c${i})`}>
                <g transform={`translate(${full ? left + 20 : left + 20} ${top}) scale(${500 / 1080})`}>
                  {v2 ? <ScrewwormSurfaceV2 mode="paper" frame={frame} /> : <ScrewwormSurface mode="paper" />}
                </g>
                {full
                  ? <g>
                    {/* the masthead strip at the top and the hills strip at the bottom of the frame, one above the other */}
                    <g transform={`translate(${sx} ${top}) scale(${k}) translate(0 -50)`}>{scene(frame)}</g>
                    <g transform={`translate(${sx} ${y}) scale(${k}) translate(0 -1920)`}>{scene(frame)}</g>
                  </g>
                  : <g transform={`translate(${sx} ${sy}) scale(${k})`}>{scene(frame)}</g>}
              </g>
            </g>}
            {c.old && c.v2 && (v2 ? c.v2(frame, x, y + (c.oy ?? 0), c.s) : c.old(frame, x, y + (c.oy ?? 0), c.s))}
            <text x={left + 270} y={y + 52} textAnchor="middle" fontFamily={FONT.body} fontWeight={700}
              fontSize={28} fill="#2b2440">{c.name}</text>
          </g>;
        })}
      </svg>
      {shown.map((c, i) => {
        if (!c.html) return null;
        const col = i % 2, row = Math.floor(i / 2);
        const left = col * 540, y = 600 + row * 400;
        const k = 500 / 1080;
        return <div key={c.name} style={{position: 'absolute', left: left + 20, top: y - 346, width: 500, height: 346, overflow: 'hidden', borderRadius: 28}}>
          <div style={{position: 'absolute', left: 0, top: -930 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0'}}>
            {c.html(frame, v2)}
          </div>
        </div>;
      })}
    </div>
  );
};
