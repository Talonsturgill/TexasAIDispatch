import React from 'react';
import {useCurrentFrame} from 'remotion';
import {FONT} from '../../../lib/type';
import {actionProgress, actionWindows, type DirectedScene} from '../../../lib/direction';
import {AutonomousRig, CabView, DockDoors, Lane} from '../../../lib/freight';
import {PlaceSubject} from '../../../modern/PlaceStage';
import type {FilmRenderProps} from '../../../modern/types';

/**
 * empty-seat-1111 (2026-11-11): Kodiak AI plans to haul IKEA freight on Interstate 45 with nobody in
 * the cab. One generic autonomous rig (the library's AutonomousRig) and its cab carry the film.
 *
 *  s1  a rig idles at a distribution dock in Harris County and rolls out as the event runs.
 *  s2  the cab: a driver's silhouette sits in the seat, then slides out and the seat is empty.
 *  s3  the road wide, the rig holding still while the ground moves (speed is drawn in the ground).
 *  s4  an overhead route: a 292 mile line with a 219 mile stretch inked over it, then the rig again.
 *  s5  a readiness bar fills from 93 to 96 (the numerals are the claims' own figures).
 *  s6  the same bar fills on to 99.
 *  s7  a plain store dock, no marks, and the rig arrives and stops.
 *  s8  the empty cab once more, then the road wide.
 *
 * Every state is a closed function of the film clock or an event window. No random input, no wall
 * clock. Outdoor shots are seated on the county's region plate by PlaceSubject and no full-frame
 * background is painted. Disclosed illustration: a generic truck, generic buildings, no brand mark.
 */
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (p: number) => { const q = clamp(p); return q * q * (3 - 2 * q); };
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const INK = '#23201d';
const AMBER = '#d9892b';
const STEEL = '#2f4a63';
const PAPER = '#efe6d2';

const Label: React.FC<{x: number; y: number; size?: number; children: React.ReactNode; fill?: string;
  anchor?: 'start' | 'middle' | 'end'; mono?: boolean}> =
  ({x, y, size = 40, children, fill = INK, anchor = 'middle', mono = false}) => (
    <text paintOrder="stroke" stroke={fill === INK ? 'none' : '#14110f'} strokeWidth={fill === INK ? 0 : 10} x={x} y={y} fontSize={size} textAnchor={anchor} fontFamily={mono ? FONT.mono : FONT.display}
      fontWeight={700} letterSpacing={mono ? 3 : 0} fill={fill}>{children}</text>
  );

const Building: React.FC<{x: number; w: number; h: number; baseY: number; fill: string; roof: string;
  doors?: number}> = ({x, w, h, baseY, fill, roof, doors = 0}) => (
  <g>
    <rect x={x} y={baseY - h} width={w} height={h} fill={fill} stroke={INK} strokeWidth={5} />
    <rect x={x - 8} y={baseY - h - 18} width={w + 16} height={18} fill={roof} stroke={INK} strokeWidth={5} />
    {Array.from({length: doors}, (_, i) => (
      <rect key={i} x={x + 40 + i * ((w - 80) / Math.max(1, doors))} y={baseY - 120}
        width={(w - 80) / Math.max(1, doors) - 24} height={120} fill="#4a4540" stroke={INK} strokeWidth={4} />
    ))}
    <path d={`M${x + 6},${baseY - h + 46} l${w - 14},3`} stroke="#000000" strokeOpacity={0.2} strokeWidth={4} />
  </g>
);

export const EmptySeatFilm: React.FC<FilmRenderProps> = ({board, scene, shot, time_s, shot_s}) => {
  const frame = useCurrentFrame();
  const windows = actionWindows(board.scenes as DirectedScene[]);
  const event = windows[shot.event_id];
  const ev = event ? smooth(actionProgress(event, time_s)) : clamp(shot_s / Math.max(0.1, shot.duration_s));
  const within = clamp(shot_s / Math.max(0.1, shot.duration_s));
  const baseY = 1180;

  const ground = <rect x={0} y={baseY - 4} width={1080} height={10} fill="none" />;
  void ground;

  switch (shot.view) {
    case 'dock-wide': {
      const rigX = lerp(420, 1250, ev);
      return (
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
          <PlaceSubject baseY={baseY}>
            <DockDoors x={30} y={baseY - 110} scale={0.14} doors={5} occupied={[2]} />
            <Lane x={-100} y={baseY - 120} w={1300} h={260} frame={frame} speed={ev * 0.9} divided={false} />
            <AutonomousRig x={rigX} y={baseY + 70} scale={0.16} frame={frame} speed={ev} />
          </PlaceSubject>
          <Label x={540} y={330} size={46} mono fill="#f4efe3">BAYTOWN, HARRIS COUNTY</Label>
        </svg>
      );
    }
    case 'rig-side': {
      const sway = Math.sin(time_s * 1.7) * 3;
      return (
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
          <PlaceSubject baseY={baseY}>
            <Lane x={-100} y={baseY - 120} w={1300} h={300} frame={frame} speed={1} />
            <AutonomousRig x={920} y={baseY + 90 + sway} scale={0.19} frame={frame} speed={1} />
          </PlaceSubject>
        </svg>
      );
    }
    case 'road-wide': {
      return (
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
          <PlaceSubject baseY={baseY}>
            <Lane x={-100} y={baseY - 100} w={1300} h={300} frame={frame} speed={1.2} />
            <AutonomousRig x={lerp(720, 840, within)} y={baseY + 90} scale={0.15} frame={frame} speed={1.2} />
          </PlaceSubject>
        </svg>
      );
    }
    case 'cab-driver':
    case 'cab-empty': {
      const driverPresent = shot.view === 'cab-driver';
      // the driver sits in the seat, then the seat is empty from the event on
      const seated = driverPresent && ev < 0.5;
      return (
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
          <g transform="translate(-81 -190) scale(1.15)">
            <rect x={90} y={380} width={900} height={760} rx={26} fill="#1d2228" stroke={INK} strokeWidth={8} />
            <CabView x={130} y={420} w={820} h={640} frame={frame} occupied={seated} speed={1} />
          </g>
          <Label x={540} y={310} size={48} mono fill="#f4efe3">{driverPresent ? 'TODAY' : 'THE PLAN'}</Label>
        </svg>
      );
    }
    case 'route-map': {
      const draw = ev;
      const pts: [number, number][] = [[200, 1180], [330, 980], [470, 860], [560, 700], [640, 560], [800, 450], [880, 360]];
      const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
      const segLen = 1400;
      return (
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
          <rect x={70} y={240} width={940} height={1080} rx={22} fill={PAPER} stroke={INK} strokeWidth={6} />
          <path d={d} fill="none" stroke="#8d887d" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
          <path d={d} fill="none" stroke={AMBER} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={segLen} strokeDashoffset={segLen * (1 - draw)} />
          <circle cx={pts[0][0]} cy={pts[0][1]} r={22} fill={STEEL} stroke={INK} strokeWidth={5} />
          <circle cx={pts[6][0]} cy={pts[6][1]} r={22} fill={STEEL} stroke={INK} strokeWidth={5} />
          <Label x={pts[0][0] + 40} y={pts[0][1] + 70} size={40} anchor="start" mono>BAYTOWN</Label>
          <Label x={pts[6][0] + 20} y={pts[6][1] + 80} size={40} anchor="end" mono>FRISCO</Label>
          <Label x={540} y={330} size={64}>292 miles</Label>
          <g opacity={smooth((draw - 0.5) / 0.4)}>
            <Label x={540} y={1250} size={58} fill={AMBER}>219 driverless</Label>
          </g>
        </svg>
      );
    }
    case 'gauge-96':
    case 'gauge-93':
    case 'gauge-99': {
      const first = shot.view !== 'gauge-99';
      const from = shot.view === 'gauge-96' ? 90 : 96;
      const to = first ? 96 : 99;
      const value = Math.round(lerp(from, to, smooth(shot_s / 1.1)));
      const bx = 140, bw = 800, by = 760;
      return (
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
          <rect x={70} y={380} width={940} height={800} rx={22} fill={PAPER} stroke={INK} strokeWidth={6} />
          <Label x={540} y={480} size={38} mono>SAFETY CASE READINESS</Label>
          <Label x={540} y={690} size={170}>{`${value}%`}</Label>
          <rect x={bx} y={by} width={bw} height={64} rx={32} fill="#d8cdb6" stroke={INK} strokeWidth={5} />
          <rect x={bx} y={by} width={bw * (value / 100)} height={64} rx={32} fill={AMBER} stroke={INK} strokeWidth={5} />
          {Array.from({length: 11}, (_, i) => (
            <rect key={i} x={bx + (bw * i) / 10 - 2} y={by + 78} width={4} height={i % 5 === 0 ? 30 : 16} fill={INK} />
          ))}
          <Label x={bx} y={by + 150} size={32} mono anchor="start">0</Label>
          <Label x={bx + bw} y={by + 150} size={32} mono anchor="end">100</Label>
          {shot.view === 'gauge-93' && (
            <g>
              <rect x={bx + bw * 0.93 - 3} y={by - 10} width={6} height={250} fill={STEEL} />
              <Label x={bx + bw * 0.93 + 6} y={by + 275} size={30} mono anchor="end">END OF AUGUST 93</Label>
            </g>
          )}
          <Label x={540} y={1100} size={34} mono>{first ? 'END OF SEPTEMBER' : 'OCTOBER 30TH'}</Label>
        </svg>
      );
    }
    case 'store-dock': {
      const rigX = lerp(1400, 900, ev);
      return (
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
          <PlaceSubject baseY={baseY}>
            <Building x={-40} w={820} h={300} baseY={baseY - 120} fill="#c9bf9f" roof="#8d887d" doors={0} />
            <Lane x={-100} y={baseY - 120} w={1300} h={260} frame={frame} speed={(1 - ev) * 0.9} divided={false} />
            <DockDoors x={60} y={baseY - 110} scale={0.14} doors={4} occupied={[1]} />
            <AutonomousRig x={rigX} y={baseY + 70} scale={0.16} frame={frame} speed={1 - ev} />
          </PlaceSubject>
          <Label x={540} y={330} size={46} mono fill="#f4efe3">FRISCO, COLLIN COUNTY</Label>
        </svg>
      );
    }
    default:
      return (
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
          <PlaceSubject baseY={baseY}>
            <Lane x={-100} y={baseY - 120} w={1300} h={300} frame={frame} speed={1} />
            <AutonomousRig x={800} y={baseY + 90} scale={0.16} frame={frame} speed={1} />
          </PlaceSubject>
          <Label x={540} y={300} size={40} mono>{`${scene.county ?? ''} COUNTY`.toUpperCase()}</Label>
        </svg>
      );
  }
};
