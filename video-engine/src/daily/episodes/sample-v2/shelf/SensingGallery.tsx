import React from 'react';
import {useCurrentFrame} from 'remotion';
import {FONT} from '../../../../lib/type';
import type {FilmRenderProps} from '../../../../modern/types';
import {ConfidenceSpread, Detections, Mask, Plume, Readout, Sweep} from '../../../../lib/sensing';
import type {Detection} from '../../../../lib/sensing';
import {AutonomousRig, CabView, DockDoors, Lane, SensorMast, WeighStation} from '../../../../lib/freight';
import {CastShadow3D, Extrude, Solidify} from '../../../../lib/stage3d';
import {ConfidenceSpreadV2, DetectionsV2, MaskV2, PlumeV2, ReadoutV2, SweepV2} from '../../../../look/shelf/sensing';
import {CabViewV2, DockDoorsV2, LaneV2, SensorPodV2, WeighStationV2} from '../../../../look/shelf/freight';
import {CastShadow3DV2, ExtrudeV2, SolidifyV2} from '../../../../look/shelf/stage3d';
import {AutoTruckV2} from '../../../../look/machines';
import {CowV2} from '../../../../look/props';
import {Figure} from '../../../../look/Figure';
import {light, line, shade} from '../../../../look/color';
import {lookActive} from '../../../../look/tokens';

/**
 * look-v2-shelf-sensing (written November 13th, 2026), the before and after sheet for the sensing set,
 * lib/sensing.tsx, lib/freight.tsx and the painting pieces of lib/stage3d.tsx. Each cell stands the
 * library drawing under the old look and its V2 under the new, at the same place and scale. The
 * overlays sit on one plain field plate drawn the same in both, so only the overlay changes. The
 * library's AutonomousRig is shown against AutoTruckV2, which replaces it. Eight cells a page, a page a
 * second. Not an edition.
 */
type Draw = (f: number, x: number, y: number, s: number, left: number) => React.ReactNode;
type Html = (f: number, v2: boolean) => React.ReactNode;
type Cell = {name: string; s: number; ox?: number; plate?: boolean; back?: Draw; old?: Draw; v2?: Draw; html?: Html};

/** the field plate under the overlays, a rounded sky and ground, identical before and after */
const Plate: React.FC<{left: number; y: number}> = ({left, y}) => (
  <g>
    <defs><linearGradient id="sgp-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9cc6f2" />
      <stop offset="100%" stopColor="#f3e2c2" /></linearGradient>
      <linearGradient id="sgp-gnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d9b46e" /><stop offset="100%" stopColor="#b98a4a" />
      </linearGradient>
      <clipPath id={`sgp-c${left}-${y}`}><rect x={left + 30} y={y - 236} width={480} height={228} rx={30} /></clipPath></defs>
    <g clipPath={`url(#sgp-c${left}-${y})`}>
      <rect x={left + 30} y={y - 236} width={480} height={228} fill="url(#sgp-sky)" />
      <rect x={left + 30} y={y - 110} width={480} height={110} fill="url(#sgp-gnd)" />
    </g>
  </g>
);

const DETS: Detection[] = [
  {x: 0, y: 0, w: 170, h: 118, label: 'cow', conf: 0.94, track: 1},
  {x: 190, y: 28, w: 128, h: 90, label: 'cow', conf: 0.71, track: 2},
  {x: 340, y: 64, w: 76, h: 58, label: 'calf', conf: 0.61, wrong: true, track: 9},
];
const shift = (ds: Detection[], dx: number, dy: number) => ds.map((d) => ({...d, x: d.x + dx, y: d.y + dy}));
const ROWS: [string, string][] = [['tiles', '1,024'], ['flagged', '17'], ['above thr', '9'], ['dwell', '2.4 s']];
const SPREAD = [0.94, 0.83, 0.71, 0.61, 0.55, 0.42, 0.38, 0.29, 0.22, 0.14];

/** a small wellhead under the plume, the same in both */
const Wellhead: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-26} y={-16} width={52} height={16} rx={6} fill="#8a90b0" />
    <rect x={-8} y={-62} width={16} height={50} rx={6} fill="#d64545" />
    <rect x={-18} y={-50} width={36} height={10} rx={5} fill="#b23a3a" />
  </g>
);

/** a 3D cell host, a perspective box on the cell, the content orbiting a little so the depth shows. The world turns
 * opposite the camera, as in Stage3D, so the pieces are told the camera orbit as minus this angle. */
const Orbit: React.FC<{left: number; y: number; deg: number; children: React.ReactNode}> = ({left, y, deg, children}) => (
  <div style={{position: 'absolute', left: left + 20, top: y - 340, width: 500, height: 340, perspective: '900px'}}>
    <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateY(${deg}deg)`}}>{children}</div>
  </div>
);
const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={500} height={340} viewBox="0 0 500 340" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>{children}</svg>
);
const orbitDeg = (f: number) => Math.sin(f / 30 * 0.9 + 0.9) * 26;

const CELLS: Cell[] = [
  {name: 'detections', s: 1, plate: true,
    back: (f, x, y) => <g><CowV2 frame={f} x={x - 140} y={y - 40} scale={0.28} mood="calm" longhorn />
      <CowV2 frame={f} x={x + 15} y={y - 50} scale={0.21} mood="calm" seed={3} />
      <ellipse cx={x + 168} cy={y - 62} rx={30} ry={18} fill="#a08d72" /></g>,
    old: (f, x, y) => <Detections frame={f} seed={7} settle={Math.min(1, 0.72 + (f % 30) / 60)} items={shift(DETS, x - 228, y - 172)} />,
    v2: (f, x, y) => <DetectionsV2 frame={f} seed={7} settle={Math.min(1, 0.72 + (f % 30) / 60)} items={shift(DETS, x - 228, y - 172)} />},
  {name: 'mask', s: 1, plate: true,
    back: (_f, x, y) => <ellipse cx={x} cy={y - 70} rx={150} ry={40} fill="#7fae4a" opacity={0.8} />,
    old: (f, x, y) => <Mask cx={x} cy={y - 70} rx={160} ry={48} frame={f} seed={4} noise={0.3} label="weed patch 0.88" />,
    v2: (f, x, y) => <MaskV2 cx={x} cy={y - 70} rx={160} ry={48} frame={f} seed={4} noise={0.3} label="weed patch 0.88" />},
  {name: 'sweep', s: 1, plate: true,
    old: (f, x, y) => <Sweep x={x - 210} y={y - 218} w={420} h={192} p={((f + 40) % 90) / 90} />,
    v2: (f, x, y) => <SweepV2 x={x - 210} y={y - 218} w={420} h={192} p={((f + 40) % 90) / 90} />},
  {name: 'plume', s: 1, plate: true,
    back: (_f, x, y) => <Wellhead x={x - 80} y={y - 30} />,
    old: (f, x, y) => <Plume x={x - 80} y={y - 88} frame={f} seed={6} strength={1} rate="4.1 kg/h" />,
    v2: (f, x, y) => <PlumeV2 x={x - 80} y={y - 88} frame={f} seed={6} strength={1} rate="4.1 kg/h" />},
  {name: 'readout', s: 1, plate: true,
    old: (f, x, y) => <Readout x={x - 150} y={y - 222} w={300} frame={f} title="pass 3" rows={ROWS} />,
    v2: (f, x, y) => <ReadoutV2 x={x - 150} y={y - 222} w={300} frame={f} title="pass 3" rows={ROWS} />},
  {name: 'confidence spread', s: 1, plate: true,
    old: (_f, x, y) => <ConfidenceSpread x={x - 190} y={y - 200} w={330} h={150} threshold={0.7} values={SPREAD} />,
    v2: (f, x, y) => <ConfidenceSpreadV2 x={x - 190} y={y - 200} w={330} h={150} threshold={0.7} values={SPREAD} frame={f} />},
  {name: 'roof sensor pod', s: 1.9,
    old: (f, x, y, s) => <SensorMast frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <SensorPodV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'driverless truck (AutoTruckV2)', s: 0.058, ox: 160,
    old: (f, x, y, s) => <AutonomousRig frame={f} x={x} y={y} scale={s} speed={0.6} />,
    v2: (f, x, y, s) => <AutoTruckV2 frame={f} x={x} y={y} scale={s} speed={0.6} mood="happy" />},
  // page two
  {name: 'cab view, the empty seat', s: 1,
    old: (f, _x, y, _s, left) => <CabView x={left + 50} y={y - 236} w={440} h={228} frame={f} speed={1} />,
    v2: (f, _x, y, _s, left) => <CabViewV2 x={left + 50} y={y - 236} w={440} h={228} frame={f} speed={1} />},
  {name: 'lane', s: 1,
    old: (f, _x, y, _s, left) => <Lane x={left + 25} y={y - 140} w={490} h={134} frame={f} speed={1} />,
    v2: (f, _x, y, _s, left) => <LaneV2 x={left + 25} y={y - 140} w={490} h={134} frame={f} speed={1} />},
  {name: 'weigh station', s: 0.15, ox: -137,
    old: (f, x, y, s) => <WeighStation frame={f} x={x} y={y} scale={s} />,
    v2: (f, x, y, s) => <WeighStationV2 frame={f} x={x} y={y} scale={s} />},
  {name: 'dock doors', s: 0.088,
    old: (f, _x, y, s, left) => <DockDoors frame={f} x={left + 59} y={y} scale={s} occupied={[1, 3]} />,
    v2: (f, _x, y, s, left) => <DockDoorsV2 frame={f} x={left + 59} y={y} scale={s} occupied={[1, 3]} />},
  {name: 'cast shadow (stage3d)', s: 1, html: (f, v2) => {
    const lean = -1.4 + 0.15 * Math.sin(f / 40);
    const who = <Svg><Figure frame={f} x={250} y={330} scale={0.5} pose="wave" emotion="happy" hat="palm" top="snap" shirt="#3d7bd9" /></Svg>;
    const Shadow = v2 ? CastShadow3DV2 : CastShadow3D;
    return <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 500, height: 340}}>
        <Shadow x={0} y={0} lean={lean} squash={0.3} opacity={0.5}><div style={{width: 500, height: 340, position: 'relative'}}>{who}</div></Shadow>
      </div>
      <div style={{position: 'absolute', left: 0, top: 0, width: 500, height: 340}}>{who}</div>
    </div>;
  }},
  {name: 'solidify (stage3d)', s: 1, html: (f, v2) => {
    const deg = orbitDeg(f);
    const hero = <Svg><AutoTruckV2 frame={f} x={270} y={300} scale={0.11} trailer={false} mood="happy" speed={0} /></Svg>;
    return v2 ? <SolidifyV2 depth={60} slices={6} camRotY={-deg}>{hero}</SolidifyV2>
      : <Solidify depth={60} slices={6} camRotY={-deg}>{hero}</Solidify>;
  }},
  {name: 'extrude (stage3d)', s: 1, html: (f, v2) => {
    const deg = orbitDeg(f);
    const base = '#3d7bd9';
    const render = (face: 'front' | 'side', c: string) => <Svg>
      {face === 'front' ? <g>
        <defs><linearGradient id="sg-ex" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0%" stopColor={light(base, 0.45)} />
          <stop offset="50%" stopColor={base} /><stop offset="100%" stopColor={shade(base, 0.35)} /></linearGradient></defs>
        <rect x={110} y={80} width={280} height={190} rx={56} fill="url(#sg-ex)" stroke={line(base)} strokeWidth={7} />
        <text x={250} y={205} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={96} fill="#ffffff">AI</text>
      </g> : <rect x={110} y={80} width={280} height={190} rx={56} fill={c} />}
    </Svg>;
    return v2 ? <ExtrudeV2 depth={70} slices={12} camRotY={-deg} base={base} render={render} />
      : <Extrude depth={70} slices={12} camRotY={-deg} base={base} render={render} />;
  }},
];

export const SensingShelfGallery: React.FC<FilmRenderProps> = ({board}) => {
  const frame = useCurrentFrame();
  const v2 = lookActive(board as never);
  const pages = Math.ceil(CELLS.length / 8);
  const page = Math.floor(frame / 30) % pages;
  const cells = CELLS.slice(page * 8, page * 8 + 8);
  const place = (i: number) => {
    const col = i % 2, row = Math.floor(i / 2);
    return {col, left: col * 540, y: 600 + row * 400};
  };
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        {cells.map((c, i) => {
          const {left, y} = place(i);
          const x = left + 270 + (c.ox ?? 0);
          return <g key={c.name}>
            {!c.plate && !c.html && <rect x={left + 20} y={y} width={500} height={6} rx={3} fill="#2b2440" opacity={0.15} />}
            {c.plate && <Plate left={left} y={y} />}
            {c.back?.(frame, x, y, c.s, left)}
            {!c.html && (v2 ? c.v2?.(frame, x, y, c.s, left) : c.old?.(frame, x, y, c.s, left))}
            <text x={left + 270} y={y + 52} textAnchor="middle" fontFamily={FONT.body} fontWeight={700} fontSize={28}
              fill="#2b2440">{c.name}</text>
          </g>;
        })}
      </svg>
      {cells.map((c, i) => {
        if (!c.html) return null;
        const {left, y} = place(i);
        const rotating = c.name.startsWith('solidify') || c.name.startsWith('extrude');
        return rotating
          ? <Orbit key={c.name} left={left} y={y} deg={orbitDeg(frame)}>{c.html(frame, v2)}</Orbit>
          : <div key={c.name} style={{position: 'absolute', left: left + 20, top: y - 340, width: 500, height: 340}}>{c.html(frame, v2)}</div>;
      })}
    </div>
  );
};
