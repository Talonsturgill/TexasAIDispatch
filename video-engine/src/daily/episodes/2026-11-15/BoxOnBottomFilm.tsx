import React from 'react';
import {useCurrentFrame} from 'remotion';
import type {FilmRenderProps} from '../../../modern/types';
import {actionWindows, type DirectedScene} from '../../../lib/direction';
import {Figure, castV2, figureHands, type FigureEmotion, type FigurePose, type FigureProps} from '../../../look/Figure';
import {Burst, ContactShadow, GlassPanel, Glow, clamp01, ease, easeOutBack, lerp} from '../../../look/Kit';
import {MapPinV2} from '../../../look/props';
import {line, light, shade} from '../../../look/color';
import {FONT} from '../../../lib/type';
import {BOX_COLORS, Box, HERO_BOX, MoveCard, QuayCrane, RTG, Ship, Truck, YardApron, YardMap} from './parts';

/**
 * box-on-bottom-1115 (November 15th, 2026): "The box on the bottom". At Port Houston's Barbours Cut
 * and Bayport container terminals, Kaleris RTG Optimization plans the order of yard crane moves to
 * avoid blocked stacks, and ILA operators still run the cranes.
 *
 * The hero is the rubber-tired gantry crane with a face (parts.tsx RTG). The person is a crane
 * operator, illustrative, drawn from the v2 cast. The throughline is one orange container: buried,
 * dug out on the fourth lift, set down last so it lands on top, lifted once onto the truck. Every
 * state comes from the film clock through the board's event windows. Disclosed illustration, no
 * brand marks.
 */
const ZOOM: Record<string, number> = {wide: 1, split: 1.04, medium: 1.08, close: 1.18, detail: 1.3, overhead: 1};

const OP: Partial<FigureProps> = {...castV2('operator'), hat: 'hardhat', hatColor: '#ffffff', top: 'hivis', shirt: '#ff8a1f',
  trim: '#eef3fa', glasses: false};
const OP2: Partial<FigureProps> = {...castV2('engineer'), top: 'hivis', shirt: '#2f6fb8', trim: '#f7e04a'};
const DRIVER = castV2('trucker');
const DISPATCH = castV2('technician');
const OP_SKIN = String(OP.skin);
const DRIVER_SKIN = String(DRIVER.skin);

/** a pose change that travels from the last pose over 0.35 s */
const move = (t: number, at: number, before: FigurePose, after: FigurePose) => (
  t < at ? {pose: before} : {pose: after, fromPose: before, poseBlend: clamp01((t - at) / 0.35)}
);

type BoxMood = 'worried' | 'happy' | 'beam' | 'flinch';
/** the orange box's face, drawn over a box whose centre is x, y */
const BoxFace: React.FC<{x: number; y: number; s?: number; mood: BoxMood; frame: number}> = ({x, y, s = 1, mood, frame}) => {
  const blink = (frame % 84) < 4 ? 0.2 : 1;
  const ey = mood === 'flinch' ? 0.25 : blink;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[-24, 24].map((ex) => <g key={ex}>
        <ellipse cx={ex} cy={-8} rx={15} ry={18 * ey} fill="#ffffff" stroke={line(HERO_BOX)} strokeWidth={4} />
        <circle cx={ex + (mood === 'worried' ? 0 : 3)} cy={mood === 'worried' ? -14 : -6} r={8 * Math.min(1, ey + 0.2)} fill="#2a1a3a" />
        <circle cx={ex + 5} cy={-12} r={3} fill="#ffffff" opacity={ey} />
      </g>)}
      {mood === 'worried' && <path d="M-40 -34 L-12 -28 M40 -34 L12 -28" stroke="#5a2410" strokeWidth={6} strokeLinecap="round" />}
      {mood === 'worried' || mood === 'flinch'
        ? <path d="M-14 24 Q0 16 14 24" stroke="#5a2410" strokeWidth={6} fill="none" strokeLinecap="round" />
        : <path d={mood === 'beam' ? 'M-22 16 Q0 44 22 16 Z' : 'M-16 18 Q0 32 16 18'} stroke="#5a2410" strokeWidth={6}
          fill={mood === 'beam' ? '#7a2a14' : 'none'} strokeLinecap="round" strokeLinejoin="round" />}
    </g>
  );
};

/** a big count that lands, in SVG: number text with a squash on arrival */
const Count: React.FC<{x: number; y: number; value: number; p: number; size?: number; color?: string; sub?: string;
  prefix?: string; away?: number}> = ({x, y, value, p, size = 150, color = '#ffffff', sub, prefix = '', away = 0}) => {
  const q = clamp01(p);
  const n = value;
  const sq = q >= 1 ? 1 : lerp(1.5, 1, easeOutBack(q, 1.8));
  return (
    <g transform={`translate(${x + away * 200} ${y - away * 120}) scale(${sq * (1 - away * 0.5)})`} opacity={clamp01(p * 4)}>
      <text x={0} y={0} textAnchor="middle" fontFamily={FONT.mono} fontWeight={800} fontSize={size} fill={color}
        stroke="#1a1236" strokeWidth={size * 0.12} paintOrder="stroke">{prefix}{n.toLocaleString('en-US')}</text>
      {sub && <text x={0} y={size * 0.55} textAnchor="middle" fontFamily={FONT.mono} fontWeight={700} fontSize={Math.max(44, size * 0.3)}
        fill="#fff4dc" stroke="#1a1236" strokeWidth={size * 0.06} paintOrder="stroke">{sub}</text>}
    </g>
  );
};

/** a lift in crane space: grab at (fromX, fromTier), hoist, travel, set at (toX, toTier). */
const TIER = 116;
const hookAt = (tier: number) => -tier * TIER - 136;
type Lift = {t0: number; dur: number; fromX: number; fromTier: number; toX: number; toTier: number; hold?: boolean};
const liftState = (t: number, L: Lift, rest: number) => {
  const u = (t - L.t0) / L.dur;
  if (u < 0) return null;
  if (u < 0.25) return {x: L.fromX, y: lerp(rest, hookAt(L.fromTier), ease(u / 0.25)), carrying: false, latch: 0};
  if (u < 0.5 || L.hold) return {x: L.fromX, y: lerp(hookAt(L.fromTier), rest, ease((u - 0.25) / 0.25)), carrying: true, latch: 1};
  if (u < 0.75) return {x: lerp(L.fromX, L.toX, ease((u - 0.5) / 0.25)), y: rest, carrying: true, latch: 1};
  if (u < 1) return {x: L.toX, y: lerp(rest, hookAt(L.toTier), ease((u - 0.75) / 0.25)), carrying: true, latch: 1};
  return null;
};

/** a windshield or cab frame, drawn over the world: thick rounded mullions and a glass sheen */
const CabFrame: React.FC<{tint?: string}> = ({tint = '#9fd6ff'}) => (
  <g>
    <path d="M-40 -40 L1120 -40 L1120 360 Q540 300 -40 360 Z" fill="#2c2b44" />
    <rect x={-40} y={300} width={110} height={1700} rx={50} fill="#34334f" />
    <rect x={1010} y={300} width={110} height={1700} rx={50} fill="#34334f" />
    <rect x={-40} y={1460} width={1160} height={520} rx={60} fill="#3d3b5c" />
    <path d="M90 380 L300 380" stroke="#ffffff" strokeWidth={14} strokeLinecap="round" opacity={0.25} />
    <rect x={70} y={330} width={940} height={1130} rx={60} fill={tint} opacity={0.08} />
    <path d="M160 520 L360 420 M200 640 L460 500" stroke="#ffffff" strokeWidth={22} strokeLinecap="round" opacity={0.12} />
  </g>
);

/** a dashed fence round a patch of yard, in perspective */
const Fence: React.FC<{pts: string; p: number}> = ({pts, p}) => (
  <polygon points={pts} fill="#3ef0a0" fillOpacity={0.18 * p} stroke="#3ef0a0" strokeWidth={10} strokeDasharray="30 22"
    strokeLinejoin="round" opacity={clamp01(p * 2)} />
);

export const BoxOnBottomFilm: React.FC<FilmRenderProps> = ({board, shot, time_s, shot_s}) => {
  const frame = useCurrentFrame();
  const W = actionWindows(board.scenes as DirectedScene[]);
  /** eased progress of a beat's window, 0 before it, 1 after */
  const p = (id: string) => {
    const w = W[id];
    if (!w) return 0;
    const q = clamp01((time_s - w.start) / Math.max(0.2, w.end - w.start));
    return q * q * (3 - 2 * q);
  };
  /** seconds since a beat opened (negative before) */
  const since = (id: string) => (W[id] ? time_s - W[id].start : -1);
  const t = shot_s;
  const horizon = 960 + (ZOOM[shot.framing] ?? 1) * 73;
  const svg = (children: React.ReactNode) => (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      {shot.view !== 'quote-card' && <YardApron h={horizon} frame={frame} />}
      {children}
    </svg>
  );
  const op = (x: number, y: number, scale: number, pose: object, emotion: FigureEmotion, turn = 0.4, extra: Partial<FigureProps> = {}) => (
    <Figure frame={frame} x={x} y={y} scale={scale} {...OP} {...pose} emotion={emotion} turn={turn} seed={5} {...extra} />
  );
  const driver = (x: number, y: number, scale: number, pose: object, emotion: FigureEmotion, turn = 0.4, extra: Partial<FigureProps> = {}) => (
    <Figure frame={frame} x={x} y={y} scale={scale} {...DRIVER} {...pose} emotion={emotion} turn={turn} seed={9} {...extra} />
  );
  const opSeat = {skin: OP_SKIN, hat: '#ffffff'};

  switch (shot.view) {
    case 'cold-open': {
      // the truck rolls in under the crane, the driver holds up the orange slip, a blue box thunks onto the orange one
      const roll = easeOutBack(clamp01(t / 1.5), 1.1);
      const tx = lerp(-520, 330, roll);
      const thunk = since('s1-thunk');
      const dropping = thunk < 0;
      const hook = dropping ? lerp(-680, hookAt(2), ease(clamp01((t - 1.2) / 1.6))) : lerp(hookAt(2), -560, ease(thunk / 0.9));
      const bury = p('s1-bury');
      const sq = thunk >= 0 && thunk < 0.4 ? 1 - Math.sin((thunk / 0.4) * Math.PI) * 0.14 : 1;
      return svg(
        <g>
          <g transform="translate(540 1210) scale(0.8)">
            <ContactShadow x={-200} y={8} w={420} />
            {['#2fae7a', '#e8573c', ''].map((c, i) => c && <Box key={i} x={-200} y={-i * TIER} w={150} c={c} />)}
            <g transform={`translate(0 ${thunk >= 0 ? (1 - sq) * 40 : 0}) scale(1 ${sq})`} style={{transformOrigin: '0px 0px'}}>
              <Box x={200} y={0} w={150} c={HERO_BOX} glow={0.2} />
              <BoxFace x={200} y={-56} s={0.9} mood={thunk < 0 ? 'happy' : thunk < 0.6 ? 'flinch' : 'worried'} frame={frame} />
              <Box x={200} y={-TIER} w={150} c="#8a5bd6" />
              {!dropping && <Box x={200} y={-2 * TIER} w={150} c="#2f7fd8" />}
            </g>
            {bury > 0 && [1, 2].map((k) => <rect key={k} x={200 - 85} y={-k * TIER - 118} width={170} height={124} rx={18}
              fill="none" stroke="#ff4d5e" strokeWidth={10} opacity={clamp01(bury * 3 - (k - 1))} />)}
          </g>
          <RTG x={540} y={1210} s={0.8} span={760} tall={720} frame={frame} trolley={200 / 260} hookY={hook}
            carry={dropping ? '#2f7fd8' : null} carryW={150} mood={thunk < 0 ? 'happy' : 'surprised'} latch={dropping ? 1 : 0}
            operator={opSeat} />
          <Burst x={700} y={950} p={thunk / 0.6} color="#ffe066" />
          <Truck x={tx} y={1700} s={0.95} frame={frame} speed={1 - roll * 0.9} driver={DRIVER_SKIN} paint="#3a7be0" />
          <g transform={`translate(${tx + 160} ${1700 - 370}) rotate(${-8 + Math.sin(frame * 0.3) * 4})`}>
            <rect x={-46} y={-34} width={92} height={68} rx={14} fill="#fff4dc" stroke="#5a3a00" strokeWidth={5} />
            <rect x={-30} y={-18} width={60} height={36} rx={8} fill={HERO_BOX} />
          </g>
        </g>,
      );
    }
    case 'stack-cut': {
      if (shot.id === 's6-b') {
        // the plan rewinds the stack and rebuilds it with the orange box set down last, so it lands on top
        const r = p('s6-avoid');
        // phase one (r 0 to 0.4): the old stack lifts away. Phase two: it rebuilds, the orange box set down last.
        const away = ease(clamp01(r / 0.4));
        const land = (k: number) => easeOutBack(clamp01((r - 0.4 - k * 0.13) / 0.2), 1.4);
        const rebuilt = ['#2fae7a', '#e8573c', '#2f7fd8'];
        const ol = land(3);
        return svg(
          <g>
            <g transform="translate(540 1200) scale(1.3)">
              <ContactShadow x={0} y={8} w={520} />
              <Box x={-170} y={0} w={150} c="#e2e6f0" />
              <Box x={170} y={0} w={150} c="#f2b33d" />
              <Box x={170} y={-TIER} w={150} c="#8a5bd6" />
              {r < 0.4 && [HERO_BOX, ...rebuilt].map((c, i) => (
                <g key={`o${c}`} opacity={1 - away}><Box x={0} y={-i * TIER - away * 500} w={150} c={c} /></g>))}
              {r < 0.4 && <BoxFace x={0} y={-56 - away * 500} s={0.95} mood="worried" frame={frame} />}
              {rebuilt.map((c, i) => land(i) > 0 && (
                <g key={c} opacity={clamp01(land(i) * 3)}><Box x={0} y={-i * TIER - (1 - land(i)) * 300} w={150} c={c} /></g>))}
              {ol > 0 && <g opacity={clamp01(ol * 3)} transform={`translate(0 ${-(1 - ol) * 300})`}>
                <Box x={0} y={-3 * TIER} w={150} c={HERO_BOX} glow={ol} />
                <BoxFace x={0} y={-3 * TIER - 56} s={0.95} mood="happy" frame={frame} />
              </g>}
              {ol > 0.6 && <g transform={`translate(110 ${-3 * TIER - 130}) scale(${easeOutBack(clamp01((ol - 0.6) / 0.4))})`}>
                <circle r={34} fill="#3ef0a0" stroke="#0d5a3a" strokeWidth={5} />
                <path d="M-14 0 L-3 12 L16 -12" stroke="#0d2a1e" strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g>}
            </g>
            <g transform={`translate(860 640) rotate(${-r * 340})`} opacity={clamp01(1 - Math.abs(r - 0.4) * 2.2)}>
              <path d="M-70 0 A70 70 0 1 1 0 70" stroke="#ffffff" strokeWidth={16} fill="none" strokeLinecap="round" />
              <path d="M-96 -10 L-70 30 L-44 -10 Z" fill="#ffffff" />
            </g>
            <Burst x={540} y={900} p={(r - 0.7) / 0.3} color="#3ef0a0" />
          </g>,
        );
      }
      // the stack cut open: the orange box at the bottom under three, each blocker ringing red in turn
      const bury = p('s1-bury');
      const peek = Math.sin(frame * 0.12) * 6;
      return svg(
        <g>
          <g transform="translate(540 1200) scale(1.35)">
            <ContactShadow x={0} y={8} w={520} />
            <Box x={-170} y={0} w={150} c="#2fae7a" />
            <Box x={-170} y={-TIER} w={150} c="#e2e6f0" />
            <Box x={0} y={0} w={150} c={HERO_BOX} glow={0.3} />
            <BoxFace x={peek} y={-56} s={0.95} mood="worried" frame={frame} />
            {['#8a5bd6', '#2f7fd8', '#e8573c'].map((c, i) => <g key={c}>
              <Box x={0} y={-(i + 1) * TIER} w={150} c={c} />
              <rect x={-85} y={-(i + 1) * TIER - 118} width={170} height={124} rx={18} fill="none" stroke="#ff4d5e"
                strokeWidth={10} opacity={clamp01(bury * 3 - i)} />
            </g>)}
            <Box x={170} y={0} w={150} c="#f2b33d" />
          </g>
          {bury > 0.9 && <text x={540} y={560} textAnchor="middle" fontFamily={FONT.mono} fontWeight={800} fontSize={90} fill="#ff4d5e"
            stroke="#1a1236" strokeWidth={12} paintOrder="stroke">BLOCKED</text>}
        </g>,
      );
    }
    case 'dig': {
      // the crane digs: three boxes off the orange one, a count ticks, and the orange box swings up on the fourth lift
      const rest = -860 + 260;
      const lifts: Lift[] = [
        {t0: 0.0, dur: 1.1, fromX: -200, fromTier: 3, toX: 200, toTier: 0},
        {t0: 1.15, dur: 0.95, fromX: -200, fromTier: 2, toX: 200, toTier: 1},
        {t0: 2.15, dur: 0.95, fromX: -200, fromTier: 1, toX: 200, toTier: 2},
        {t0: 3.15, dur: 1.0, fromX: -200, fromTier: 0, toX: -200, toTier: 0, hold: true},
      ];
      const colors = [HERO_BOX, '#2fae7a', '#e8573c', '#2f7fd8'];
      const done = lifts.filter((L) => t >= L.t0 + L.dur && !L.hold).length;
      const active = lifts.map((L, i) => ({i, s: liftState(t, L, rest)})).find((a) => a.s);
      const carried = active && active.s && active.s.carrying ? 3 - active.i : -1;
      const source = colors.filter((_, k) => k < 4 - done && k !== carried);
      const dest = colors.slice(4 - done).reverse();
      const hook = active?.s ? active.s.y : rest;
      const trolleyX = active?.s ? active.s.x : -200;
      const count = Math.min(4, done + (active && active.s?.carrying ? 1 : 0));
      return svg(
        <g>
          <g transform="translate(540 1230) scale(0.8)">
            <ContactShadow x={-200} y={8} w={360} /><ContactShadow x={200} y={8} w={360} />
            {source.map((c, k) => <Box key={c} x={-200} y={-k * TIER} w={150} c={c} />)}
            {source.includes(HERO_BOX) && <BoxFace x={-200} y={-56} s={0.85} mood="worried" frame={frame} />}
            {dest.map((c, k) => <Box key={c} x={200} y={-k * TIER} w={150} c={c} />)}
          </g>
          <RTG x={540} y={1230} s={0.8} span={760} tall={860} frame={frame} trolley={trolleyX / 260} hookY={hook}
            carry={carried >= 0 ? colors[carried] : null} carryW={150} carryGlow={carried === 0 ? 0.5 : 0}
            mood={carried === 0 ? 'happy' : 'focused'} latch={active?.s?.latch ?? 0} operator={opSeat} />
          {carried === 0 && active?.s && <BoxFace x={540 + trolleyX * 0.8} y={1230 + (hook + 136 - 56) * 0.8} s={0.75} mood="happy"
            frame={frame} />}
          {count > 0 && <g transform={`translate(985 820) scale(${0.75 * easeOutBack(clamp01(((t - (lifts[count - 1]?.t0 ?? 0)) - 0.3) / 0.3))})`}>
            <rect x={-60} y={-190} width={120} height={300} rx={40} fill="#fff4dc" stroke="#1a1236" strokeWidth={8} />
            {Array.from({length: count}).map((_, k) => <rect key={k} x={-38} y={60 - k * 62} width={76} height={50} rx={12}
              fill={k === 3 ? HERO_BOX : colors[3 - k]} stroke="#1a1236" strokeWidth={4} />)}
          </g>}
        </g>,
      );
    }
    case 'truck-cab': {
      // the driver drums on the wheel and checks the clock while the crane digs above
      const drum = Math.abs(Math.sin(frame * 0.5)) * 8;
      const clock = easeOutBack(clamp01((t - 0.3) / 0.5));
      return svg(
        <g>
          <RTG x={760} y={1500} s={0.7} span={760} tall={900} frame={frame} trolley={-0.6} hoist={0.3 + 0.2 * Math.sin(t * 2)}
            carry="#e8573c" carryW={150} mood="focused" operator={opSeat} />
          <CabFrame />
          {driver(360, 1780, 2.1, {pose: 'hold'}, 'angry', 0.5)}
          <rect x={-40} y={1420} width={1160} height={560} rx={60} fill="#3d3b5c" />
          <rect x={-40} y={1420} width={1160} height={24} rx={12} fill="#5a5880" />
          <g transform={`translate(380 ${1340 - drum})`}>
            <ellipse cx={0} cy={0} rx={230} ry={110} fill="none" stroke="#24213a" strokeWidth={38} />
            <ellipse cx={0} cy={-6} rx={230} ry={110} fill="none" stroke="#4b4766" strokeWidth={20} />
            <path d="M-220 0 L220 0 M0 0 L0 110" stroke="#24213a" strokeWidth={26} strokeLinecap="round" />
          </g>
          <g transform={`translate(800 620) scale(${clock})`}>
            <circle r={96} fill="#fff4dc" stroke="#1a1236" strokeWidth={10} />
            <path d={`M0 0 L${Math.sin(t * 3) * 64} ${-Math.cos(t * 3) * 64}`} stroke="#ff4d5e" strokeWidth={12} strokeLinecap="round" />
            <path d="M0 0 L0 -44" stroke="#1a1236" strokeWidth={14} strokeLinecap="round" />
            <circle r={12} fill="#1a1236" />
          </g>
        </g>,
      );
    }
    case 'channel-wide': {
      // a container ship glides up the channel past the quay cranes
      const go = ease(t / 2.4);
      return svg(
        <g>
          <path d="M-60 1160 Q540 1120 1140 1170 L1140 1300 Q540 1270 -60 1310 Z" fill="#3c8fd6" />
          <path d="M-60 1180 Q540 1140 1140 1190" stroke="#bfe6ff" strokeWidth={10} fill="none" opacity={0.6} />
          <Ship x={lerp(1350, 760, go)} y={1240} s={0.55} frame={frame} rows={4} />
          {[{x: 160, s: 0.75}, {x: 420, s: 0.62}].map((q, i) => <QuayCrane key={i} x={q.x} y={1420} s={q.s} frame={frame + i * 40} />)}
          {[0, 1, 2].map((i) => <path key={i} d={`M${lerp(1350, 760, go) + 500 + i * 60} ${1250 + i * 12} l90 0`} stroke="#ffffff"
            strokeWidth={10} strokeLinecap="round" opacity={0.5} />)}
        </g>,
      );
    }
    case 'crane-army': {
      // rows of cranes pop up across the yard as the count climbs to 142, then two pins name the terminals
      const pop = since('s3-142');
      const rows = [{y: 820, s: 0.2, n: 6}, {y: 1010, s: 0.26, n: 5}, {y: 1250, s: 0.34, n: 4}];
      let k = 0;
      const pins = p('s3-names');
      return svg(
        <g>
          {rows.map((r, ri) => Array.from({length: r.n}).map((_, i) => {
            const idx = k++;
            const q = easeOutBack(clamp01((pop - idx * 0.07) / 0.45), 1.5);
            const x = 540 + (i - (r.n - 1) / 2) * (1080 / r.n) * 0.95;
            return <g key={`${ri}-${i}`} transform={`translate(${x} ${r.y}) scale(1 ${q})`} opacity={clamp01(q * 3)}>
              {[-1, 1].map((c) => <rect key={c} x={c * 90 - 40} y={-90} width={80} height={90} rx={10} fill={BOX_COLORS[(idx + c + 4) % 8]}
                transform={`scale(${r.s / 0.34})`} />)}
              <RTG x={0} y={0} s={r.s} span={760} tall={760} frame={frame + idx * 7} trolley={Math.sin(idx) * 0.6}
                hoist={0.4} mood={(frame + idx * 13) % 70 < 6 ? 'sleepy' : 'happy'} operator={opSeat} />
            </g>;
          }))}
          <Count x={540} y={620} value={142} p={pop / 0.35} away={ease(clamp01((pop - 1.8) / 0.5))} size={190} sub="RUBBER-TIRED GANTRY CRANES" />
          <path d="M-60 1420 Q300 1380 540 1430 T1140 1410 L1140 1480 Q800 1500 540 1490 T-60 1490 Z" fill="#3c8fd6" opacity={clamp01(pins * 3)} />
          <MapPinV2 x={230} y={1420} s={1} p={pins} color="#ff4d6d" label="BARBOURS CUT" />
          <MapPinV2 x={820} y={1420} s={1} p={clamp01(pins * 1.3 - 0.3)} color="#ff4d6d" label="BAYPORT" />
        </g>,
      );
    }
    case 'gate-line': {
      // the line of trucks stretches back from the gate as headlights stream in and the count runs to 12,000
      const c = since('s4-line');
      const creep = (t * 30) % 220;
      return svg(
        <g>
          {Array.from({length: 7}).map((_, i) => {
            const d = 6 - i;
            const s = lerp(0.18, 0.62, i / 6);
            const x = lerp(160, 760, i / 6) + creep * s;
            const y = lerp(1000, 1500, i / 6);
            return <g key={i}>
              <Glow x={x + 300 * s} y={y - 150 * s} r={120 * s + 30} color="#fff3b0" opacity={0.5} />
              <Truck x={x} y={y} s={s} frame={frame + d * 9} speed={0.25} paint={BOX_COLORS[(i * 3) % 8]}
                box={BOX_COLORS[(i * 5 + 2) % 8]} driver={i === 6 ? DRIVER_SKIN : undefined} />
            </g>;
          })}
          <g transform="translate(960 1440)">
            <rect x={-60} y={-260} width={120} height={260} rx={30} fill="#eef2fb" stroke={line('#eef2fb')} strokeWidth={6} />
            <rect x={-40} y={-220} width={80} height={70} rx={14} fill="#9fd6ff" />
            <path d="M-60 -120 L-460 -120" stroke="#ff4d5e" strokeWidth={22} strokeLinecap="round" strokeDasharray="60 40" />
          </g>
          <Count x={540} y={620} value={12000} p={c / 0.35} away={ease(clamp01((c - 1.8) / 0.5))} size={112} prefix="UP TO " sub="TRUCK VISITS A DAY" />
          {driver(140, 1500, 1.15, move(t, 0.6, 'stand', 'wave'), 'happy', 0.5)}
        </g>,
      );
    }
    case 'slip-close': {
      // a driver picking up holds up the orange slip and grins; behind, every cab shows a different box
      const up = easeOutBack(clamp01(t / 0.5));
      return svg(
        <g>
          {[0, 1, 2].map((i) => <g key={i} opacity={0.85}>
            <Truck x={lerp(980, 640, i / 2)} y={1180 + i * 40} s={0.32 + i * 0.04} frame={frame + i * 11} paint={BOX_COLORS[i + 1]} />
            <rect x={lerp(980, 640, i / 2) + 30} y={1050 + i * 40} width={58} height={44} rx={10} fill={BOX_COLORS[(i * 3 + 1) % 8]}
              stroke="#ffffff" strokeWidth={5} />
          </g>)}
          {driver(380, 1760, 2.0, move(t, 0.25, 'stand', 'raise'), 'excited', 0.3)}
          <g transform={`translate(${380 + 64 * 2.0 + 120} ${1760 - 2.0 * 560 + (1 - up) * 300}) rotate(${-6 + Math.sin(frame * 0.25) * 5})`}>
            <rect x={-110} y={-80} width={220} height={160} rx={26} fill="#fff4dc" stroke="#5a3a00" strokeWidth={8} />
            <rect x={-74} y={-44} width={148} height={88} rx={16} fill={HERO_BOX} />
            <path d="M-50 -20 L-50 30 M-20 -20 L-20 30 M10 -20 L10 30 M40 -20 L40 30" stroke={shade(HERO_BOX, 0.3)} strokeWidth={8}
              strokeLinecap="round" />
          </g>
        </g>,
      );
    }
    case 'stacks-rise': {
      // the yard stacks rise a tier past the crane's visor while a ship noses in behind
      const r = easeOutBack(clamp01((t - 0.2) / 1.4), 1.2);
      return svg(
        <g>
          <Ship x={lerp(1500, 900, ease(t / 3))} y={1000} s={0.42} frame={frame} rows={5} />
          <RTG x={540} y={1700} s={1.15} span={760} tall={900} frame={frame} trolley={0.2} hoist={0.25} mood={r > 0.6 ? 'surprised' : 'happy'}
            operator={opSeat} />
          {[-1, 1].map((side) => <g key={side} transform={`translate(${540 + side * 330} 1700) scale(0.95)`}>
            {Array.from({length: 6}).map((_, i) => {
              const show = i < 4 ? 1 : clamp01(r * 2 - (i - 4));
              const drop = (1 - show) * -300;
              return <g key={i} transform={`translate(0 ${drop})`} opacity={show}>
                <Box x={0} y={-i * TIER} w={150} c={BOX_COLORS[(i * 3 + (side > 0 ? 2 : 5)) % 8]} />
              </g>;
            })}
          </g>)}
        </g>,
      );
    }
    case 'ship-count': {
      // containers stream off the ship and the year's count runs up to 4,303,345
      const c = since('s12-record');
      const grow = p('s12-grow');
      return svg(
        <g>
          <path d="M-60 1080 Q540 1050 1140 1090 L1140 1200 Q540 1170 -60 1210 Z" fill="#3c8fd6" />
          <Ship x={560} y={1140} s={0.62} frame={frame} rows={5} />
          {Array.from({length: 7}).map((_, i) => {
            const u = ((t * 0.6 + i / 7) % 1);
            const x = lerp(700, 120 + (i % 4) * 90, u), y = lerp(860, 1300, u) - Math.sin(u * Math.PI) * 220;
            return <rect key={i} x={x - 40} y={y - 30} width={80} height={60} rx={12} fill={BOX_COLORS[i % 8]} stroke="#1a1236"
              strokeOpacity={0.4} strokeWidth={4} />;
          })}
          <g transform="translate(540 1460) scale(0.7)">
            {[-3, -2, -1, 0, 1, 2, 3].map((k) => Array.from({length: 4}).map((_, i) => {
              const show = i < 2 ? 1 : i < 3 ? ease(clamp01((c - 0.3 - (k + 3) * 0.08) / 0.3)) : grow;
              return <g key={`${k}-${i}`} opacity={show} transform={`translate(0 ${(1 - show) * -200})`}>
                <Box x={k * 160} y={-i * TIER} w={150} c={BOX_COLORS[(i * 5 + k + 9) % 8]} />
              </g>;
            }))}
          </g>
          {op(150, 1560, 1.15, move(t, 0.5, 'stand', 'cheer'), c > 0 ? 'surprised' : 'happy', 0.6)}
          <Count x={540} y={600} value={4303345} p={c / 0.35} away={ease(clamp01((c - 1.6) / 0.5))} size={128} sub="TEUS IN 2025, TWENTY-FOOT UNITS" />
        </g>,
      );
    }
    case 'cab-window': {
      // in the cab: a jumbled list of jobs; the screen lights and they snap into a neat column
      const lit = p('s5-kaleris');
      const order = [3, 1, 4, 2, 5];
      return svg(
        <g>
          <RTG x={760} y={1260} s={0.7} span={760} tall={900} frame={frame} trolley={Math.sin(t) * 0.5} hoist={0.35} carry="#2f7fd8"
            carryW={150} mood={lit > 0.5 ? 'happy' : 'worried'} operator={opSeat} />
          <CabFrame />
          <GlassPanel x={90} y={440} w={640} h={780} rot={2} tint={lit > 0 ? '#1a2a5e' : '#2a2c44'}>
            {order.map((n, i) => {
              const jx = 40 + ((i * 97) % 140), jy = 50 + i * 128 + ((i * 53) % 40), jr = ((i * 37) % 30) - 15;
              const nx = 60, ny = 60 + (n - 1) * 135;
              const k = easeOutBack(clamp01(lit * 1.3 - i * 0.06), 1.3);
              return <g key={n} transform={`translate(${lerp(jx, nx, k)} ${lerp(jy, ny, k)}) rotate(${lerp(jr, 0, k)})`}>
                <MoveCard x={0} y={0} s={1} n={n} state={k > 0.9 && n === 1 ? 1 : 0} text={n === 1 ? 'ORANGE' : 'JOB'}
                  c={n === 1 ? HERO_BOX : BOX_COLORS[n]} />
              </g>;
            })}
          </GlassPanel>
          <Glow x={410} y={880} r={380} color="#7fc8ff" opacity={0.35 * lit} />
          {op(860, 1680, 1.75, lit > 0.2 ? move(t, 3.93, 'think', 'point') : {pose: 'think'},
            lit > 0.5 ? 'surprised' : 'thinking', -0.8)}
        </g>,
      );
    }
    case 'card-deal': {
      // a fan of job cards spreads like a dealt hand, then shuffles into order with the orange card on top
      const fan = easeOutBack(clamp01(t / 0.6));
      const deal = p('s6-deal');
      const cards = [{n: 2, c: BOX_COLORS[1]}, {n: 4, c: BOX_COLORS[2]}, {n: 1, c: HERO_BOX}, {n: 5, c: BOX_COLORS[4]}, {n: 3, c: BOX_COLORS[3]}];
      return svg(
        <g>
          <g transform="translate(800 1180) scale(0.62)">
            {['#2fae7a', '#e8573c', '#2f7fd8'].map((c, i) => <Box key={c} x={-200} y={-(deal > 0.5 ? i : i + 1) * TIER} w={150} c={c} />)}
            <Box x={-200} y={deal > 0.5 ? -3 * TIER : 0} w={150} c={HERO_BOX} glow={deal} />
            <BoxFace x={-200} y={(deal > 0.5 ? -3 * TIER : 0) - 56} s={0.85} mood={deal > 0.5 ? 'happy' : 'worried'} frame={frame} />
          </g>
          <RTG x={800} y={1180} s={0.62} span={760} tall={900} frame={frame} trolley={-0.77} hoist={0.25} mood={deal > 0.5 ? 'happy' : 'focused'}
            operator={opSeat} />
          {cards.map((cd, i) => {
            const a = (i - 2) * 16 * fan;
            const fx = 540 + Math.sin(a * Math.PI / 180) * 420 - 190, fy = 1260 - Math.cos(a * Math.PI / 180) * 420 + 200;
            const ox = 240, oy = 440 + (cd.n - 1) * 138;
            const k = easeOutBack(clamp01(deal * 1.4 - Math.abs(i - 2) * 0.1), 1.2);
            return <g key={cd.n} transform={`translate(${lerp(fx, ox, k)} ${lerp(fy, oy, k)}) rotate(${lerp(a, 0, k)}) scale(${lerp(1.05, 1.25, k)})`}>
              <MoveCard x={0} y={0} s={1} n={cd.n} state={k > 0.95 && cd.n === 1 ? 1 : 0} text={cd.n === 1 ? 'ORANGE BOX' : 'NEXT BOX'}
                c={cd.c} />
            </g>;
          })}
          {op(150, 2080, 1.7, move(t, 3.4, 'think', 'cheer'), deal > 0.6 ? 'happy' : 'thinking', 0.6)}
        </g>,
      );
    }
    case 'yard-map': {
      // the dispatcher's map: the cranes unbunch from one red block and spread across the yard
      const spread = p('s7-spread');
      return svg(
        <g>
          <YardMap x={70} y={430} w={940} h={1020} frame={frame} jam={1 - spread} spread={spread} route={0} />
          <Figure frame={frame} x={900} y={1640} scale={1.15} {...DISPATCH} {...move(t, 0.05, 'stand', 'point')} emotion={spread > 0.5 ? 'happy' : 'worried'}
            turn={-0.6} seed={2} />
        </g>,
      );
    }
    case 'dispatch-desk': {
      // the dispatcher taps the screen and a green route draws from a crane to the orange box
      const route = p('s7-route');
      return svg(
        <g>
          <g transform="translate(420 470) scale(0.6)">
            <YardMap x={0} y={0} w={940} h={1020} frame={frame} jam={0} spread={1} route={route} pick={clamp01((route - 0.7) / 0.3)} />
          </g>
          <Figure frame={frame} x={250} y={1650} scale={1.7} {...DISPATCH} {...move(t, 0.2, 'stand', 'point')}
            emotion={route > 0.5 ? 'proud' : 'thinking'} turn={0.6} seed={2} />
        </g>,
      );
    }
    case 'pilot-cab': {
      // at yard level: a dashed fence drops round one small section, its crane wakes, two trucks roll in under it, the driver waves
      const fence = p('s8-fence');
      const trucks = since('s8-trucks');
      const wake = clamp01((trucks + 0.4) / 0.6);
      const drop = easeOutBack(clamp01(fence * 1.3));
      return svg(
        <g>
          {[-1, 1].map((side) => <g key={side} transform={`translate(${540 + side * 420} 1180) scale(0.55)`}>
            {[0, 1, 2].map((i) => <Box key={i} x={0} y={-i * TIER} w={150} c={BOX_COLORS[(i * 3 + (side > 0 ? 1 : 4)) % 8]} />)}
          </g>)}
          <g transform={`translate(0 ${(1 - drop) * -220})`} opacity={clamp01(fence * 3)}>
            <polygon points="170,1250 910,1250 800,1030 280,1030" fill="#3ef0a0" fillOpacity={0.22} stroke="#3ef0a0" strokeWidth={12}
              strokeDasharray="34 22" strokeLinejoin="round" />
          </g>
          <RTG x={540} y={1190} s={0.62} span={760} tall={900} frame={frame} trolley={0.3} hoist={0.35} mood={wake > 0.5 ? 'happy' : 'sleepy'}
            operator={opSeat} />
          <Glow x={540} y={1000} r={360} color="#3ef0a0" opacity={0.25 * fence} />
          {[0, 1].map((k) => {
            const u = ease(clamp01((trucks + 1.2 - k * 0.7) / 1.8));
            return <Truck key={k} x={lerp(-500, 560 + k * 200, u)} y={1300 + k * 90} s={0.66 - k * 0.06} frame={frame + k * 9}
              speed={1 - u} paint={k ? '#2fae7a' : '#3a7be0'} box={k ? '#f2b33d' : '#8a5bd6'} driver={DRIVER_SKIN} />;
          })}
          {driver(110, 1560, 1.05, trucks > 0 ? move(trucks, 0, 'point', 'wave') : {pose: 'point'}, trucks > 0 ? 'excited' : 'happy', 0.6)}
          <Burst x={540} y={900} p={(trucks - 0.2) / 0.6} color="#3ef0a0" />
        </g>,
      );
    }
    case 'joystick': {
      if (shot.id === 's10-c') {
        // the operator grips both joysticks; below, a box rises; hard hats bob along the bottom for the ILA
        const ila = p('s10-ila');
        const sway = Math.sin(t * 1.2);
        return svg(
          <g>
            <RTG x={720} y={2170} s={1.6} span={760} tall={900} frame={frame} trolley={0.02 * sway} hoist={0.5 + 0.12 * sway}
              carry="#2fae7a" carryW={150} mood="focused" operator={opSeat} />
            <Glow x={480} y={960} r={220} color="#fff4b0" opacity={0.25} />
            <Figure frame={frame} x={190} y={1960} scale={1.55} {...OP2} {...move(t, 0.4, 'stand', 'point')} emotion="proud" turn={0.5} seed={11} />
            {op(900, 1990, 1.5, move(t, 1.2, 'stand', 'wave'), 'happy', -0.5)}
            {Array.from({length: 7}).map((_, i) => (
              <g key={i} transform={`translate(${160 + i * 126} ${640 - easeOutBack(clamp01(t * 1.2 - i * 0.12)) * 70 - ila * 30 + Math.sin(frame * 0.3 + i) * 8})`}>
                <path d="M-50 0 Q0 -70 50 0 Z" fill={i % 2 ? '#ffffff' : '#ffc93c'} stroke="#1a1236" strokeWidth={6} />
              </g>))}
          </g>,
        );
      }
      // the operator marks a card; a funnel drops and the clutter falls away to three clean cards
      const f = p('s9-filter');
      return svg(
        <g>
          <RTG x={380} y={1240} s={0.62} span={760} tall={900} frame={frame} trolley={0.4} hoist={0.3 + 0.2 * f} carry={HERO_BOX}
            carryW={150} mood={f > 0.5 ? 'happy' : 'focused'} operator={opSeat} />
          <CabFrame />
          <GlassPanel x={400} y={440} w={620} h={900} rot={-4}>
            {[1, 2, 3, 4, 5, 6].map((n, i) => {
              const keep = n <= 3;
              const fall = keep ? 0 : f;
              return <g key={n} transform={`translate(70 ${70 + (keep ? i : i) * 130 + fall * 500}) rotate(${fall * 30})`} opacity={1 - fall}>
                <MoveCard x={0} y={0} s={0.95} n={n} state={n === 1 && f > 0.6 ? 1 : 0} text={n === 1 ? 'ORANGE' : 'JOB'}
                  c={n === 1 ? HERO_BOX : BOX_COLORS[n]} />
              </g>;
            })}
            <g transform={`translate(430 ${lerp(-200, 80, easeOutBack(f))})`} opacity={clamp01(f * 3)}>
              <path d="M-70 0 L70 0 L18 70 L18 130 L-18 110 L-18 70 Z" fill="#3ef0a0" stroke="#0d5a3a" strokeWidth={8} strokeLinejoin="round" />
            </g>
          </GlassPanel>
          {op(150, 1900, 2.4, move(t, 0.2, 'stand', 'point'), f > 0.5 ? 'happy' : 'thinking', 0.9)}
        </g>,
      );
    }
    case 'cab-pov': {
      // inside the crane cab, the operator seated at the console with both hands on the joysticks; the yard behind the glass.
      // s9-a: the side screen filters the list. s10-c: hard hats bob up along the window for the ILA.
      const filterShot = shot.id === 's9-a';
      const f = p('s9-filter');
      const ila = p('s10-ila');
      const hands = figureHands('reach');
      const S = 1.5, FX = 470, FY = 1500;
      const push = Math.sin(t * 2.2) * 6;
      return svg(
        <g>
          <RTG x={820} y={1180} s={0.5} span={760} tall={900} frame={frame} trolley={Math.sin(t * 0.9) * 0.6} hoist={0.35 + 0.15 * Math.sin(t)}
            carry="#2f7fd8" carryW={150} mood="focused" operator={opSeat} />
          <path d="M-40 -40 L1120 -40 L1120 330 Q540 280 -40 330 Z" fill="#2c2b44" />
          <rect x={-40} y={300} width={90} height={1700} rx={40} fill="#34334f" />
          <rect x={1030} y={300} width={90} height={1700} rx={40} fill="#34334f" />
          <path d="M150 520 L360 420" stroke="#ffffff" strokeWidth={22} strokeLinecap="round" opacity={0.12} />
          <rect x={60} y={1150} width={960} height={70} rx={30} fill="#4b4766" />
          {op(FX, FY, S, {pose: 'reach'}, filterShot ? (f > 0.5 ? 'happy' : 'thinking') : 'determined', filterShot ? 0.4 : 0)}
          {[hands.l, hands.r].map((h, k) => (
            <g key={k} transform={`translate(${FX + h.x * S + (k ? push : -push)} ${FY + h.y * S})`}>
              <rect x={-14} y={0} width={28} height={140} rx={14} fill="#24213a" />
              <circle cx={0} cy={0} r={30} fill="#ff4d5e" stroke={line('#ff4d5e')} strokeWidth={6} />
            </g>))}
          <path d={`M-40 ${FY + hands.l.y * S + 60} Q540 ${FY + hands.l.y * S + 20} 1120 ${FY + hands.l.y * S + 60} L1120 1980 L-40 1980 Z`}
            fill="#3d3b5c" />
          <path d={`M-40 ${FY + hands.l.y * S + 60} Q540 ${FY + hands.l.y * S + 20} 1120 ${FY + hands.l.y * S + 60}`} stroke="#6a6890"
            strokeWidth={16} fill="none" />
          {[0, 1, 2].map((k) => <circle key={k} cx={300 + k * 60} cy={FY + hands.l.y * S + 140} r={14}
            fill={['#3ef0a0', '#ffc23d', '#ff4d5e'][k]} opacity={0.6 + 0.4 * Math.sin(frame * 0.2 + k)} />)}
          {filterShot && <g>
            <rect x={690} y={420} width={330} height={560} rx={36} fill="#13163a" stroke="#4b4766" strokeWidth={10} />
            {[1, 2, 3, 4, 5].map((n, i) => {
              const keep = n <= 3;
              const fall = keep ? 0 : f;
              return <g key={n} transform={`translate(712 ${450 + i * 100 + fall * 300})`} opacity={1 - fall}>
                <MoveCard x={0} y={0} s={0.72} n={n} state={n === 1 && f > 0.6 ? 1 : 0} text={n === 1 ? 'ORANGE' : 'JOB'}
                  c={n === 1 ? HERO_BOX : BOX_COLORS[n]} />
              </g>;
            })}
            <g transform={`translate(950 ${lerp(300, 470, easeOutBack(f))})`} opacity={clamp01(f * 3)}>
              <path d="M-50 0 L50 0 L14 50 L14 96 L-14 82 L-14 50 Z" fill="#3ef0a0" stroke="#0d5a3a" strokeWidth={7} strokeLinejoin="round" />
            </g>
          </g>}
          {!filterShot && Array.from({length: 7}).map((_, i) => (
            <g key={i} transform={`translate(${160 + i * 126} ${520 - easeOutBack(clamp01(t * 1.2 - i * 0.12)) * 70 - ila * 30 + Math.sin(frame * 0.3 + i) * 8})`}>
              <path d="M-50 0 Q0 -70 50 0 Z" fill={i % 2 ? '#ffffff' : '#ffc93c'} stroke="#1a1236" strokeWidth={6} />
            </g>))}
        </g>,
      );
    }
    case 'union-crew': {
      // two operators stride to the crane's ladder and the lead climbs on, grinning back
      const walk = t;
      const climb = clamp01((t - 2.6) / 1.8);
      const lx = lerp(160, 700, ease(clamp01(t / 2.6)));
      return svg(
        <g>
          <RTG x={600} y={1500} s={1.0} span={760} tall={900} frame={frame} trolley={-0.3} hoist={0.2} mood="happy" operator={opSeat} />
          <g transform="translate(980 1500)">
            {Array.from({length: 9}).map((_, i) => <path key={i} d={`M-40 ${-i * 90} L40 ${-i * 90}`} stroke="#2a2740" strokeWidth={10}
              strokeLinecap="round" />)}
            <path d="M-40 0 L-40 -820 M40 0 L40 -820" stroke="#2a2740" strokeWidth={12} strokeLinecap="round" />
          </g>
          <Figure frame={frame} x={lerp(60, 560, ease(clamp01(t / 3)))} y={1600} scale={1.35} {...OP2} pose="wave" emotion="happy"
            walk={t < 3 ? walk : undefined} turn={0.4} seed={11} />
          {op(climb > 0 ? 960 : lx, 1640 - climb * 480, 1.45, climb > 0 ? {pose: 'reach'} : {pose: 'stand'}, 'happy', climb > 0 ? -0.5 : 0.5,
            {walk: climb > 0 || t > 2.6 ? undefined : walk})}
        </g>,
      );
    }
    case 'quote-card': {
      // the quote card slides up and IN TANDEM stamps onto it
      const card = easeOutBack(clamp01(t / 0.5), 1.2);
      const stamp = clamp01(since('s10-quote') / 0.35);
      const words = ['RTG-O works in tandem', 'with the skilled labor', 'of the ILA'];
      return svg(
        <g>
          <g transform={`translate(540 ${lerp(1500, 900, card)}) rotate(-2)`}>
            <rect x={-430} y={-340} width={860} height={680} rx={48} fill="#fff4dc" stroke="#c9a96b" strokeWidth={8} />
            <text x={-370} y={-200} fontFamily={FONT.mono} fontWeight={800} fontSize={120} fill={HERO_BOX}>"</text>
            {words.map((w, i) => <text key={i} x={-370} y={-110 + i * 90} fontFamily={FONT.mono} fontWeight={800} fontSize={58}
              fill="#2b2d4a">{w}</text>)}
            <text x={-370} y={290} fontFamily={FONT.mono} fontWeight={700} fontSize={40} fill="#6a6f8a">Ryan Mariacher, Port Houston</text>
            {stamp > 0 && <g transform={`translate(200 165) rotate(-6) scale(${lerp(1.5, 0.8, easeOutBack(stamp))})`} opacity={stamp}>
              <rect x={-200} y={-58} width={400} height={116} rx={22} fill="none" stroke="#e8573c" strokeWidth={12} />
              <text y={22} textAnchor="middle" fontFamily={FONT.mono} fontWeight={800} fontSize={64} fill="#e8573c">IN TANDEM</text>
            </g>}
          </g>
        </g>,
      );
    }
    case 'ceiling-bar': {
      // the productivity bar shoots up, VENDOR FIGURE stamps on it, and it bonks its head on the dashed ceiling
      const close = shot.id === 's11-b';
      const rise = p('s11-bar');
      const stamp = clamp01(since('s11-own') / 0.35);
      const bonk = since('s11-bonk');
      const ceil = 640;
      const wob = bonk > 0 ? Math.sin(bonk * 22) * Math.exp(-bonk * 4) * 40 : 0;
      const top = lerp(1400, ceil + 4, easeOutBack(rise, 1.4)) + (bonk > 0 && bonk < 0.15 ? 18 : 0);
      return svg(
        <g transform={close ? 'translate(-630 -520) scale(1.9)' : undefined}>
          {!close && <RTG x={250} y={1450} s={0.5} span={760} tall={900} frame={frame} trolley={0} hoist={0.3}
            mood={bonk > 0 ? 'surprised' : 'happy'} operator={opSeat} />}
          <path d={`M420 ${ceil} L980 ${ceil}`} stroke="#ffffff" strokeWidth={12} strokeDasharray="34 22" strokeLinecap="round" />
          <text x={700} y={ceil - 30} textAnchor="middle" fontFamily={FONT.mono} fontWeight={800} fontSize={60} fill="#ffffff"
            stroke="#1a1236" strokeWidth={10} paintOrder="stroke">UP TO 20%</text>
          <g transform={`rotate(${wob * 0.2} 700 1400)`}>
            <rect x={600} y={top} width={200} height={1400 - top} rx={40} fill="#2fc4b2" stroke={line('#2fc4b2')} strokeWidth={8} />
            <rect x={622} y={top + 20} width={40} height={Math.max(0, 1400 - top - 60)} rx={20} fill={light('#2fc4b2', 0.5)} opacity={0.6} />
            {stamp > 0 && <g transform={`translate(700 ${top + 200}) rotate(-14) scale(${lerp(1.8, 1, easeOutBack(stamp))})`} opacity={stamp}>
              <rect x={-190} y={-44} width={380} height={88} rx={18} fill="#fff4dc" stroke="#1a1236" strokeWidth={8} />
              <text y={16} textAnchor="middle" fontFamily={FONT.mono} fontWeight={800} fontSize={40} fill="#1a1236">VENDOR FIGURE</text>
            </g>}
          </g>
          <Burst x={700} y={ceil} p={bonk / 0.5} color="#ffe066" />
          {!close && op(190, 1640, 1.6, bonk > 0 ? move(bonk, 0, 'point', 'panic') : rise > 0.1 ? move(rise, 0.1, 'crossed', 'point') : {pose: 'crossed'}, bonk > 0 ? 'surprised' : stamp > 0 ? 'smug' : 'thinking', 0.6)}
        </g>,
      );
    }
    case 'orange-top': {
      // the truck pulls in and this time the orange box is already on top, bouncing
      const roll = easeOutBack(clamp01(t / 1.8), 1.1);
      const top = since('s13-top');
      const bounce = top > 0 ? Math.abs(Math.sin(top * 9)) * Math.exp(-top * 3) * 40 : 0;
      return svg(
        <g>
          <g transform="translate(540 1140) scale(1.05)">
            <ContactShadow x={0} y={8} w={520} />
            {['#8a5bd6', '#2f7fd8', '#e8573c'].map((c, i) => <Box key={c} x={0} y={-i * TIER} w={150} c={c} />)}
            <Box x={-170} y={0} w={150} c="#2fae7a" /><Box x={170} y={0} w={150} c="#f2b33d" />
            <g transform={`translate(0 ${-bounce})`}>
              <Box x={0} y={-3 * TIER} w={150} c={HERO_BOX} glow={0.6} />
              <BoxFace x={0} y={-3 * TIER - 56} s={0.95} mood={top > 0 ? 'beam' : 'happy'} frame={frame} />
            </g>
          </g>
          <Truck x={lerp(-500, 380, roll)} y={1690} s={0.7} frame={frame} speed={1 - roll} driver={DRIVER_SKIN} paint="#3a7be0" />
          <Burst x={540} y={900} p={top / 0.6} color="#ffe066" />
        </g>,
      );
    }
    case 'one-lift': {
      // one lift: the crane takes the orange box off the top and sets it on the chassis
      const rest = -860 + 260;
      const u = clamp01((t - 0.1) / 0.95);
      const hook = u < 0.3 ? lerp(rest, hookAt(3), ease(u / 0.3)) : u < 0.6 ? lerp(hookAt(3), rest, ease((u - 0.3) / 0.3))
        : lerp(rest, -60 - 136, ease((u - 0.6) / 0.4));
      const tr = u < 0.6 ? -200 : lerp(-200, 200, ease((u - 0.6) / 0.3));
      const carrying = u >= 0.3 && u < 0.98;
      return svg(
        <g>
          <g transform="translate(540 1230) scale(0.8)">
            {['#8a5bd6', '#2f7fd8', '#e8573c'].map((c, i) => <Box key={c} x={-200} y={-i * TIER} w={150} c={c} />)}
            {!carrying && u < 0.3 && <Box x={-200} y={-3 * TIER} w={150} c={HERO_BOX} />}
            {u >= 0.98 && <Box x={200} y={-60} w={150} c={HERO_BOX} glow={0.5} />}
          </g>
          <Truck x={560 + 200 * 0.8 + 60} y={1600} s={0.6} frame={frame} speed={0} driver={DRIVER_SKIN} />
          <RTG x={540} y={1230} s={0.8} span={760} tall={860} frame={frame} trolley={tr / 260} hookY={hook} carry={carrying ? HERO_BOX : null}
            carryW={150} carryGlow={0.5} mood="happy" latch={carrying ? 1 : 0} operator={opSeat} />
          <defs><clipPath id="ol-face"><circle cx={850} cy={560} r={140} /></clipPath></defs>
          <circle cx={850} cy={560} r={152} fill="#fff4dc" stroke="#1a1236" strokeWidth={8} />
          <circle cx={850} cy={560} r={140} fill="#9fd6ff" />
          <g clipPath="url(#ol-face)">{op(850, 1040, 1.45, {pose: 'reach'}, u > 0.9 ? 'proud' : 'determined', 0)}</g>
          <path d="M760 690 L940 690" stroke="#3d3b5c" strokeWidth={60} />
        </g>,
      );
    }
    case 'gate-out': {
      // the truck rolls out through the gate with the orange box as the boom lifts; the driver waves
      const boom = easeOutBack(clamp01(t / 0.6));
      const go = ease(clamp01((t - 0.3) / 2));
      return svg(
        <g>
          <g transform="translate(700 1460)">
            <rect x={-50} y={-240} width={100} height={240} rx={26} fill="#eef2fb" stroke={line('#eef2fb')} strokeWidth={6} />
            <rect x={-34} y={-210} width={68} height={60} rx={12} fill="#9fd6ff" />
            <g transform={`rotate(${80 * boom} 0 -110)`}>
              <path d="M0 -110 L-460 -110" stroke="#ff4d5e" strokeWidth={22} strokeLinecap="round" strokeDasharray="60 40" />
            </g>
          </g>
          <Truck x={lerp(200, 1300, go)} y={1560} s={0.75} frame={frame} speed={0.8} box={HERO_BOX} boxGlow={0.4} driver={DRIVER_SKIN} />
          {driver(180, 1520, 1.2, {pose: 'wave'}, 'happy', 0.5)}
        </g>,
      );
    }
    default:
      return svg(<RTG x={540} y={1420} s={0.8} frame={frame} operator={opSeat} />);
  }
};
