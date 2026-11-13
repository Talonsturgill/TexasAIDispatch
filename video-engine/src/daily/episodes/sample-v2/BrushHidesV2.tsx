import React from 'react';
import {useCurrentFrame} from 'remotion';
import type {FilmRenderProps} from '../../../modern/types';
import {Figure, castV2, type FigureEmotion, type FigurePose} from '../../../look/Figure';
import {
  Burst, Bush, CalfV2, ContactShadow, FlyV2, GlassPanel, Glow, HeroDrone, Landscape, SOUTH_TEXAS, ScanBox,
  clamp01, ease, easeOutBack, lerp,
} from '../../../look/Kit';

/**
 * look-v2-sample-1112 (written November 13th, 2026): the first 24 seconds of the November 12th film
 * (brush-hides-1112), redrawn with the look v2 kit, to show the owner the new standard side by side
 * with what shipped. Same board, same narration, same shot list and timing, so the only difference
 * is the drawing. Not an edition. The views it draws are the November 12th board's first five.
 *
 * The hero is the drone, with a face. The ranch hand is a v2 Figure (attached limbs, lit volume,
 * contact shadow). Every state is a function of the shot clock. Disclosed illustration.
 */
const svg = (children: React.ReactNode) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>{children}</svg>
);

/** a pose change that moves rather than pops: the arms travel over 0.35 s from the last pose */
const beat = (shot_s: number, at: number, before: FigurePose, after: FigurePose) => (
  shot_s < at ? {pose: before} : {pose: after, fromPose: before, poseBlend: clamp01((shot_s - at) / 0.35)}
);

export const BrushHidesV2: React.FC<FilmRenderProps> = ({shot, shot_s}) => {
  const frame = useCurrentFrame();
  const hand = castV2('rancher');

  switch (shot.view) {
    case 'thorn-snag': {
      // the drone is snagged in the mesquite, the hand points at it, it pops free on 3.3 s
      const FREE = 3.3;
      const free = clamp01((shot_s - FREE) / 1.4);
      const rise = easeOutBack(free, 1.2);
      const wobble = shot_s < FREE ? Math.sin(frame * 0.9) * 9 : 0;
      const emo: FigureEmotion = shot_s < FREE ? 'worried' : 'excited';
      return svg(
        <g>
          <Landscape frame={frame} horizon={1040} pan={shot_s * 10} sunX={260} sunY={620} />
          <Bush x={150} y={1260} s={0.55} seed={4} depth={0.7} frame={frame} />
          <Bush x={980} y={1300} s={0.6} seed={11} depth={0.55} frame={frame} />
          <Bush x={790} y={1560} s={1.75} seed={3} frame={frame} />
          {/* the snagging branch */}
          <path d={`M860 1330 Q${lerp(800, 860, rise)} ${lerp(1120, 1180, rise)} ${lerp(720, 840, rise) + wobble} ${lerp(1010, 1150, rise)}`} stroke="#6b4a32" strokeWidth={22}
            strokeLinecap="round" fill="none" />
          {rise < 0.2 && [0, 1].map((i) => <path key={i} d={`M${790 - i * 40} ${1080 - i * 30} l-14 -30`} stroke="#6b4a32" strokeWidth={10}
            strokeLinecap="round" />)}
          <HeroDrone x={lerp(740, 700, rise) + wobble} y={lerp(980, 640, rise)} s={1.15} frame={frame}
            tilt={shot_s < FREE ? -14 + wobble : -6 * (1 - free)} mood={shot_s < FREE ? 'worried' : 'happy'} shadowY={1640} />
          <Burst x={730} y={990} p={(shot_s - FREE) / 0.7} color="#ffe066" />
          <Figure frame={frame} x={300} y={1700} scale={1.62} {...hand} {...beat(shot_s, FREE, 'point', 'cheer')} emotion={emo}
            turn={0.5} seed={7} />
        </g>,
      );
    }
    case 'drone-lift': {
      // wide: the drone climbs over the brush, the hand waves it off, a pin drops on the ranch
      const rise = ease(shot_s / 2.6);
      const pin = easeOutBack(clamp01((shot_s - 0.8) / 0.6));
      const ring = ((shot_s - 1.4) % 1.2) / 1.2;
      return svg(
        <g>
          <Landscape frame={frame} horizon={900} pan={40 + shot_s * 30} sunX={830} sunY={520} />
          {[[90, 1040, 0.4, 2, 0.8], [330, 1030, 0.35, 5, 0.85], [560, 1050, 0.38, 8, 0.8], [880, 1040, 0.42, 1, 0.8],
            [200, 1200, 0.7, 6, 0.45], [700, 1210, 0.65, 9, 0.45], [1000, 1230, 0.7, 13, 0.4],
            [60, 1520, 1.1, 3, 0.1], [960, 1560, 1.2, 7, 0.05]].map(([x, y, s, seed, d], i) => (
            <Bush key={i} x={x} y={y} s={s} seed={seed} depth={d} frame={frame} />))}
          <g transform={`translate(820 ${lerp(700, 1130, pin)})`} opacity={clamp01(pin * 2)}>
            {shot_s > 1.4 && <ellipse cx={0} cy={12} rx={40 + ring * 120} ry={(40 + ring * 120) / 3.2} fill="none"
              stroke="#ff5d5d" strokeWidth={8} opacity={1 - ring} />}
            <ContactShadow x={0} y={14} w={90} />
            <path d="M0 0 C-44 -60 -48 -112 0 -122 C48 -112 44 -60 0 0Z" fill="#ff5d5d" stroke="#7a1430" strokeWidth={7} />
            <circle cx={0} cy={-80} r={18} fill="#fff4dc" />
            <ellipse cx={-16} cy={-100} rx={9} ry={14} fill="#ffffff" opacity={0.5} />
          </g>
          <Figure frame={frame} x={330} y={1640} scale={0.95} {...hand} pose="wave" emotion="happy" turn={0.6} seed={7} />
          <HeroDrone x={lerp(520, 720, rise)} y={lerp(1240, 600, rise)} s={lerp(0.85, 0.7, rise)} frame={frame}
            tilt={-8 * (1 - rise)} mood="excited" shadowY={1610} />
        </g>,
      );
    }
    case 'fly-swat': {
      // the fly is the threat: it buzzes north across a border line while a calf watches
      const go = ease(shot_s / 3.0);
      const fx = lerp(330, 640, go) + Math.sin(shot_s * 9) * 22;
      const fy = lerp(1320, 640, go) + Math.cos(shot_s * 11) * 16;
      const crossed = fy < 1040;
      const trail = Array.from({length: 9}).map((_, i) => {
        const s2 = Math.max(0, shot_s - i * 0.12), g = ease(s2 / 3.0);
        return {x: lerp(330, 640, g) + Math.sin(s2 * 9) * 22, y: lerp(1320, 640, g) + Math.cos(s2 * 11) * 16};
      });
      return svg(
        <g>
          <Landscape frame={frame} horizon={1000} pan={90 + shot_s * 12} sunX={860} sunY={600}
            land={{...SOUTH_TEXAS, skyTop: '#6b6ef0', skyLow: '#ffc9a0'}} />
          <Bush x={120} y={1330} s={0.75} seed={12} depth={0.4} frame={frame} />
          <Bush x={1000} y={1380} s={0.9} seed={2} depth={0.3} frame={frame} />
          {/* the border, a dashed line that flushes red the moment the fly crosses it */}
          <path d="M-40 1060 Q540 1010 1120 1070" stroke={crossed ? '#ff5d5d' : '#fff4dc'} strokeWidth={12}
            strokeDasharray="38 30" strokeLinecap="round" fill="none" opacity={0.95} />
          {crossed && <Glow x={540} y={1040} r={360} color="#ff5d5d" opacity={0.35} />}
          {trail.slice(1).map((p, i) => <circle key={i} cx={p.x} cy={p.y + 30} r={12 - i} fill="#8ff5e4" opacity={0.5 - i * 0.05} />)}
          <CalfV2 x={760} y={1720} s={1.2} frame={frame} facing={-1} mood={crossed ? 'worried' : 'calm'} />
          <FlyV2 x={fx} y={fy} s={2.0} frame={frame} rot={Math.sin(shot_s * 6) * 8 + 10} />
        </g>,
      );
    }
    case 'sky-sweep': {
      // overhead from the drone: the box sweeps the brush, and at the end it finds something hidden
      const sweep = shot_s / 5.8;
      const bx = lerp(120, 640, (Math.sin(sweep * Math.PI * 1.5 - Math.PI / 2) + 1) / 2);
      const by = lerp(560, 980, ease(sweep));
      const lock = clamp01((shot_s - 4.6) / 0.5);
      const canopies = [[150, 640, 120], [420, 560, 96], [760, 690, 140], [980, 520, 110], [280, 920, 130], [600, 1000, 150],
        [900, 960, 104], [140, 1240, 140], [480, 1280, 110], [820, 1300, 150], [1040, 1180, 90], [330, 1500, 120],
        [720, 1560, 130], [980, 1600, 110]];
      const calf = {x: lerp(640, 690, lock), y: 1060};
      return svg(
        <g>
          <defs>
            <radialGradient id="ss-ground" cx="40%" cy="30%" r="90%">
              <stop offset="0%" stopColor="#f2c16a" /><stop offset="70%" stopColor="#d9973e" /><stop offset="100%" stopColor="#a8682a" />
            </radialGradient>
            <radialGradient id="ss-can" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#b6d97a" /><stop offset="55%" stopColor="#6f9e3f" /><stop offset="100%" stopColor="#36582c" />
            </radialGradient>
            <filter id="ss-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14" /></filter>
          </defs>
          <rect x={-100} y={-100} width={1280} height={2120} fill="url(#ss-ground)" />
          <path d="M-60 1700 C240 1500 300 1100 560 860 S900 420 1140 300" stroke="#f7dca0" strokeWidth={70} fill="none"
            strokeLinecap="round" opacity={0.8} />
          {/* the calf, tucked under the brush */}
          <g transform={`translate(${calf.x} ${calf.y})`}>
            <ellipse cx={8} cy={14} rx={70} ry={42} fill="#2b1d5e" opacity={0.3} filter="url(#ss-soft)" />
            <ellipse cx={0} cy={0} rx={62} ry={36} fill="#c4692d" stroke="#5a2a14" strokeWidth={6} />
            <circle cx={64} cy={-4} r={26} fill="#c4692d" stroke="#5a2a14" strokeWidth={6} />
            <ellipse cx={-14} cy={-8} rx={20} ry={12} fill="#fff4e6" opacity={0.85} />
          </g>
          {canopies.map(([x, y, r], i) => (
            <g key={i}>
              <circle cx={x + 26} cy={y + 30} r={r} fill="#2b1d5e" opacity={0.3} filter="url(#ss-soft)" />
              {[[0, 0, 0.62], [-0.45, -0.2, 0.5], [0.42, -0.3, 0.48], [0.38, 0.35, 0.5], [-0.35, 0.4, 0.46]].map(([dx, dy, k], j) => (
                <circle key={`o${j}`} cx={x + dx * r} cy={y + dy * r} r={r * k + 6} fill="#2a4a24" />))}
              {[[0, 0, 0.62], [-0.45, -0.2, 0.5], [0.42, -0.3, 0.48], [0.38, 0.35, 0.5], [-0.35, 0.4, 0.46]].map(([dx, dy, k], j) => (
                <circle key={j} cx={x + dx * r} cy={y + dy * r} r={r * k} fill="url(#ss-can)" />))}
              <circle cx={x - r * 0.38} cy={y - r * 0.36} r={r * 0.22} fill="#d7f0a0" opacity={0.4} />
            </g>
          ))}
          {/* the drone's own shadow, gliding */}
          <g transform={`translate(${bx + 120} ${by - 260})`} opacity={0.35}>
            <path d="M-110 -40 L110 40 M110 -40 L-110 40" stroke="#1a1236" strokeWidth={24} strokeLinecap="round" filter="url(#ss-soft)" />
            <ellipse cx={0} cy={0} rx={60} ry={40} fill="#1a1236" filter="url(#ss-soft)" />
          </g>
          <ScanBox x={(lock > 0 ? lerp(bx, calf.x - 110, lock) : bx) - 110} y={(lock > 0 ? lerp(by, calf.y - 90, lock) : by) - 90}
            w={lerp(260, 290, lock)} h={lerp(200, 180, lock)} lock={lock} frame={frame} />
          <Burst x={calf.x + 20} y={calf.y} p={(shot_s - 5.0) / 0.6} color="#ffcc00" />
        </g>,
      );
    }
    case 'hud-calf': {
      // the hand checks the tablet; the box scans, finds the calf in the brush, and locks
      const LOCK = 2.6;
      const lock = clamp01((shot_s - LOCK) / 0.5);
      const pan = shot_s * 18;
      const scanX = lerp(40, 330, (Math.sin(shot_s * 2.2) + 1) / 2);
      const panelIn = easeOutBack(clamp01(shot_s / 0.5), 1.3);
      return svg(
        <g>
          <Landscape frame={frame} horizon={1060} pan={200 + shot_s * 8} sunX={180} sunY={640} />
          <Bush x={960} y={1420} s={0.9} seed={6} depth={0.3} frame={frame} />
          <g transform={`translate(0 ${(1 - panelIn) * 120})`} opacity={clamp01(panelIn)}>
            <GlassPanel x={360} y={440} w={660} h={760} rot={-3}>
              <g transform="translate(0 -560) scale(0.62)">
                <Landscape frame={frame} horizon={1300} pan={pan} sunX={900} sunY={980}
                  land={{...SOUTH_TEXAS, skyTop: '#3b7be8'}} />
              </g>
              <CalfV2 x={300} y={600} s={0.55} frame={frame} facing={1} mood="hurt" wound={lock > 0.5} />
              <Bush x={250} y={640} s={0.95} seed={21} frame={frame} />
              <Bush x={520} y={660} s={0.8} seed={5} frame={frame} />
              <Bush x={70} y={660} s={0.7} seed={14} frame={frame} />
              <ScanBox x={lerp(scanX, 250, lock)} y={lerp(380, 420, lock)} w={lerp(220, 260, lock)} h={200} lock={lock} frame={frame} />
              {lock > 0 && <g transform={`translate(380 360) scale(${easeOutBack(lock)})`}>
                <circle r={34} fill="#ffcc00" stroke="#5a3a00" strokeWidth={5} />
                <path d="M-14 0 L-3 12 L16 -12" stroke="#1a1200" strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g>}
              <rect x={40} y={40} width={150} height={44} rx={22} fill="#0d0f2a" opacity={0.65} />
              <circle cx={68} cy={62} r={9} fill={Math.floor(shot_s * 2) % 2 ? '#ff5d5d' : '#ff9a9a'} />
              <rect x={88} y={54} width={84} height={16} rx={8} fill="#ffffff" opacity={0.8} />
            </GlassPanel>
          </g>
          <Burst x={760} y={810} p={(shot_s - LOCK - 0.2) / 0.6} color="#ffcc00" />
          <Figure frame={frame} x={200} y={1700} scale={1.45} {...hand} {...beat(shot_s, LOCK + 0.3, 'think', 'point')}
            emotion={shot_s < LOCK + 0.3 ? 'thinking' : 'proud'} turn={0.7} seed={7} />
        </g>,
      );
    }
    default:
      return svg(<Landscape frame={frame} />);
  }
};
