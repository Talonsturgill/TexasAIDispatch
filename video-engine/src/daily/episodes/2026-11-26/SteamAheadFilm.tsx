import React from 'react';
import {useCurrentFrame} from 'remotion';
import type {FilmRenderProps} from '../../../modern/types';
import {actionWindows, type DirectedScene} from '../../../lib/direction';
import {Figure, castV2, figureHands, type FigureEmotion, type FigurePose, type FigureProps} from '../../../look/Figure';
import {Burst, ContactShadow, Glow, clamp01, ease, lerp} from '../../../look/Kit';
import {PickupV2} from '../../../look/props';
import {line, light, shade} from '../../../look/color';
import {FONT} from '../../../lib/type';
import {
  ACCENT, Boiler, CYAN, CokerUnit, Compressor, Counter, Drum, Flare, Gauge, LitBox, Monitor, STEEL, Steam, SteamLine, Trend, Word, after, pop,
} from './parts';

/**
 * steam-ahead-1126 (November 26th, 2026): "The screen reads next". At TotalEnergies' Port Arthur refinery in Jefferson
 * County, console operators on the delayed coker piloted a Honeywell AI tool whose models predicted steam pressure dips
 * 10 to 18 minutes earlier than before. One model was dropped and the alarm guide is still in evaluation. Every fact is
 * in claims.json.
 *
 * Hero: the delayed coker with a face. Throughline: the brass steam gauge, steady with a ghost needle, falling into the
 * red, pointing ahead with a ring of minutes, holding in the green. People are illustrative from the v2 cast. No real
 * person's likeness and no company's mark. Disclosed illustration.
 */
const OP: Partial<FigureProps> = {...castV2('technician'), glasses: true};
const FIELD: Partial<FigureProps> = {...castV2('engineer')};
const NEWER: Partial<FigureProps> = {...castV2('dctech')};
const KLEIN: Partial<FigureProps> = {...castV2('operator'), hat: 'none', top: 'polo', shirt: '#5a6fa8', trim: '#f4f4ef', pants: '#3a4050'};
const GREEN = '#3ddc84';

const move = (t: number, at: number, before: FigurePose, after2: FigurePose) => (
  t < at ? {pose: before} : {pose: after2, fromPose: before, poseBlend: clamp01((t - at) / 0.35)}
);

/** the coffee cup, with a ripple that rings out from `ripple` seconds */
const Cup: React.FC<{x: number; y: number; s?: number; ripple?: number; frame: number}> = ({x, y, s = 1, ripple = -1, frame}) => {
  const r = ripple >= 0 && ripple < 1.4 ? ripple / 1.4 : -1;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ContactShadow x={0} y={4} w={150} opacity={0.35} />
      <path d="M-55 -120 L55 -120 L44 -6 Q40 0 30 0 L-30 0 Q-40 0 -44 -6 Z" fill="#f2efe6" stroke={line('#f2efe6')} strokeWidth={6} strokeLinejoin="round" />
      <path d="M55 -96 Q100 -90 92 -54 Q86 -30 48 -34" stroke="#f2efe6" strokeWidth={14} fill="none" strokeLinecap="round" />
      <ellipse cx={0} cy={-118} rx={52} ry={12} fill="#5a3420" />
      {r >= 0 && <ellipse cx={0} cy={-118} rx={10 + 40 * r} ry={3 + 8 * r} fill="none" stroke="#c99a6a" strokeWidth={4} opacity={1 - r} />}
      {r >= 0 && <ellipse cx={0} cy={-118} rx={6 + 20 * r} ry={2 + 4 * r} fill="none" stroke="#c99a6a" strokeWidth={3} opacity={1 - r} />}
      <path d="M-40 -100 L-34 -20" stroke="#ffffff" strokeWidth={8} strokeLinecap="round" opacity={0.6} />
      <path d={`M-14 -150 q-10 ${-20 - 4 * Math.sin(frame / 9)} 4 -40 M14 -150 q10 ${-24 + 4 * Math.sin(frame / 8)} -4 -44`} stroke="#ffffff" strokeWidth={5}
        fill="none" strokeLinecap="round" opacity={0.4} />
    </g>
  );
};

/** a ring of minutes round a gauge: k 0 to 1 filled, a tick per minute out of `of` */
const MinuteRing: React.FC<{x: number; y: number; r: number; k: number; of?: number; c?: string; text?: string}> = ({x, y, r, k, of = 18, c = ACCENT, text}) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r} fill="none" stroke="#2a2558" strokeWidth={r * 0.09} opacity={0.5} />
    <circle r={r} fill="none" stroke={c} strokeWidth={r * 0.09} strokeDasharray={`${2 * Math.PI * r * clamp01(k)} ${2 * Math.PI * r}`} strokeLinecap="round"
      transform="rotate(-90)" />
    {Array.from({length: of}, (_, i) => {
      const a = (i / of) * Math.PI * 2 - Math.PI / 2;
      return <circle key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r} r={r * 0.022} fill="#fff6e6" opacity={i / of < k ? 1 : 0.35} />;
    })}
    {text && <Word x={0} y={r + r * 0.32} t={text} size={r * 0.24} c="#fff6e6" />}
  </g>
);

/** the 10 to 18 minute band on a ring of 18: labels at 10 and 18, the arc between them lit by `band` */
const TenToEighteen: React.FC<{x: number; y: number; r: number; band: number}> = ({x, y, r, band}) => {
  const at = (m: number, rr: number) => [Math.cos((m / 18) * Math.PI * 2 - Math.PI / 2) * rr, Math.sin((m / 18) * Math.PI * 2 - Math.PI / 2) * rr] as const;
  const [x10, y10] = at(10, r), [x18, y18] = at(17.99, r);
  const [lx10, ly10] = at(10, r + 70), [lx18, ly18] = at(0, r + 70);
  return (
    <g transform={`translate(${x} ${y})`}>
      {band > 0 && <path d={`M${x10} ${y10} A${r} ${r} 0 0 1 ${lerp(x10, x18, 1) * 1} ${y18}`} stroke="#ffd34d" strokeWidth={r * 0.13} fill="none" strokeLinecap="round"
        strokeDasharray={`${2 * Math.PI * r * (8 / 18) * band} 4000`} />}
      <circle cx={lx10} cy={ly10} r={46} fill="#2a2558" stroke="#ffd34d" strokeWidth={6} />
      <text x={lx10} y={ly10 + 16} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={44} fill="#fff6e6">10</text>
      <circle cx={lx18} cy={ly18} r={46} fill="#2a2558" stroke="#ffd34d" strokeWidth={6} />
      <text x={lx18} y={ly18 + 16} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={44} fill="#fff6e6">18</text>
    </g>
  );
};

/** a Gulf refinery skyline: columns, tanks, a pipe rack and stacks, base line at y */
const Skyline: React.FC<{y: number; frame: number; s?: number; tint?: number}> = ({y, frame, s = 1, tint = 0}) => {
  const C = '#b8c2d8';
  return (
    <g transform={`translate(0 ${y}) scale(1 ${s})`}>
      <defs>
        <linearGradient id="sa-haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f4ead8" stopOpacity={0} /><stop offset="70%" stopColor="#eef0ec" stopOpacity={0.95} /><stop offset="100%" stopColor="#eef0ec" stopOpacity={1} /></linearGradient>
      </defs>
      <rect x={0} y={-560} width={1080} height={262} fill="url(#sa-haze)" />
      <rect x={0} y={-300} width={1080} height={160} fill="#9cc4c8" />
      {Array.from({length: 9}, (_, i) => <path key={`w${i}`} d={`M${i * 130 - 40 + ((frame * 0.6) % 130)} -230 l60 0`} stroke="#d8eef0" strokeWidth={5} strokeLinecap="round" opacity={0.7} />)}
      <path d="M0 -300 Q120 -326 260 -308 T540 -316 T820 -306 T1080 -318 L1080 -290 L0 -290 Z" fill="#8a9a5a" />
      <rect x={0} y={-190} width={1080} height={44} fill="#8a9a5a" />
      {Array.from({length: 22}, (_, i) => <path key={`m${i}`} d={`M${i * 50 + 10} -300 q4 -22 8 0 M${i * 50 + 22} -300 q5 -28 10 -2`} stroke="#6f7e46" strokeWidth={4} fill="none" strokeLinecap="round" />)}
      {[[90, 520, 70], [230, 680, 84], [360, 460, 60], [820, 600, 76], [960, 500, 64]].map(([x, h, w], i) => (
        <g key={i}>
          <rect x={x - w / 2} y={-h} width={w} height={h} rx={w / 2} fill={shade(C, 0.1 + tint)} stroke={line(C)} strokeWidth={5} />
          <rect x={x - w / 2 + 10} y={-h + 20} width={w * 0.22} height={h - 40} rx={6} fill="#ffffff" opacity={0.3} />
          {[0.3, 0.55, 0.8].map((k) => <rect key={k} x={x - w / 2 - 10} y={-h * k} width={w + 20} height={10} rx={5} fill={shade(C, 0.3)} />)}
          <circle cx={x} cy={-h - 10} r={8} fill={i % 2 ? '#ff5d5d' : '#ffd34d'} opacity={0.6 + 0.4 * Math.sin(frame / 8 + i)} />
        </g>
      ))}
      {[[520, 260, 230], [700, 200, 190]].map(([x, w, h], i) => (
        <g key={`t${i}`}>
          <rect x={x - w / 2} y={-h} width={w} height={h} rx={34} fill={shade('#e8e2d6', 0.1 + tint)} stroke={line('#e8e2d6')} strokeWidth={5} />
          <ellipse cx={x} cy={-h} rx={w / 2} ry={22} fill="#f4efe6" stroke={line('#e8e2d6')} strokeWidth={5} />
          <path d={`M${x - w / 2 + 20} ${-h + 50} L${x - w / 2 + 20} ${-20}`} stroke="#ffffff" strokeWidth={10} strokeLinecap="round" opacity={0.4} />
        </g>
      ))}
      <rect x={0} y={-150} width={1080} height={22} rx={10} fill={shade(STEEL, 0.25 + tint)} />
      <rect x={0} y={-118} width={1080} height={14} rx={7} fill={shade(STEEL, 0.35 + tint)} />
      <Steam x={230} y={-690} s={0.6} p={0.8} frame={frame} />
      <Steam x={820} y={-610} s={0.5} p={0.8} frame={frame + 30} />
    </g>
  );
};

/** a hand-turned valve wheel, big, for the close shots */
const Wheel: React.FC<{x: number; y: number; r: number; turn: number; c?: string}> = ({x, y, r, turn, c = '#e2b04a'}) => (
  <g transform={`translate(${x} ${y}) rotate(${turn * 360})`}>
    <circle r={r} fill="none" stroke={shade(c, 0.2)} strokeWidth={r * 0.2} />
    <circle r={r} fill="none" stroke={c} strokeWidth={r * 0.14} />
    {[0, 60, 120].map((a) => <path key={a} d={`M${-r} 0 L${r} 0`} stroke={c} strokeWidth={r * 0.12} strokeLinecap="round" transform={`rotate(${a})`} />)}
    <circle r={r * 0.22} fill="#6b6f86" />
    <circle cx={-r * 0.3} cy={-r * 0.9} r={r * 0.06} fill="#ffffff" opacity={0.6} />
  </g>
);

export const SteamAheadFilm: React.FC<FilmRenderProps> = ({board, shot, time_s, shot_s}) => {
  const frame = useCurrentFrame();
  const W = actionWindows(board.scenes as DirectedScene[]);
  const since = (id: string) => (W[id] ? time_s - W[id].start : -1);
  const t = shot_s;
  const svg = (children: React.ReactNode) => (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>{children}</svg>
  );
  const person = (who: Partial<FigureProps>, x: number, y: number, scale: number, pose: object, emotion: FigureEmotion, turn = 0, seed = 3,
    extra: Partial<FigureProps> = {}) => (
    <g>
      <ContactShadow x={x} y={y + 4} w={210 * scale} opacity={0.38} />
      <Figure frame={frame} x={x} y={y} scale={scale} {...who} {...pose} emotion={emotion} turn={turn} seed={seed} {...extra} />
    </g>
  );
  /** the control room: deep blue walls with a window cut through them, so the Gulf region shows behind */
  const room = (dark = 0) => (
    <g>
      <defs>
        <linearGradient id="sa-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={shade('#34478a', dark)} /><stop offset="100%" stopColor={shade('#1d2758', dark)} /></linearGradient>
      </defs>
      <rect x={570} y={170} width={470} height={380} fill="#9fd0f0" />
      <rect x={570} y={400} width={470} height={150} fill="#6fa8c8" />
      <rect x={570} y={380} width={470} height={24} fill="#8a9a5a" />
      <rect x={640} y={250} width={44} height={150} rx={20} fill="#c3cbe0" stroke="#7d88a8" strokeWidth={4} />
      <rect x={700} y={250} width={44} height={150} rx={20} fill="#c3cbe0" stroke="#7d88a8" strokeWidth={4} />
      <rect x={630} y={240} width={124} height={14} rx={7} fill="#e9b949" />
      <path d="M660 240 L672 196 L684 240 M720 240 L732 196 L744 240" stroke="#e9b949" strokeWidth={5} fill="none" />
      <rect x={905} y={200} width={14} height={200} rx={6} fill="#aab4cc" />
      <path d={`M904 200 Q900 ${178 - 6 * Math.sin(frame / 4)} 912 160 Q924 ${180 - 5 * Math.sin(frame / 3)} 920 200 Z`} fill="#ff8a3d" />
      <rect x={820} y={330} width={60} height={70} rx={14} fill="#d8d2c4" />
      <rect x={570} y={170} width={470} height={240} fill="#f4ead8" opacity={0.25} />
      <path d="M570 400 L1040 400" stroke="#4f8fb0" strokeWidth={4} />
      <circle cx={980} cy={240} r={30} fill="#fff1b8" opacity={0.9} />
      <path d="M0 0 L1080 0 L1080 1920 L0 1920 Z M600 170 L1010 170 Q1040 170 1040 200 L1040 520 Q1040 550 1010 550 L600 550 Q570 550 570 520 L570 200 Q570 170 600 170 Z"
        fill="url(#sa-wall)" fillRule="evenodd" />
      <rect x={570} y={170} width={470} height={380} rx={30} fill="none" stroke="#5a6aa8" strokeWidth={16} />
      <path d="M805 170 L805 550" stroke="#5a6aa8" strokeWidth={10} />
      <rect x={0} y={1480} width={1080} height={440} fill="#151c40" />
      <rect x={0} y={1470} width={1080} height={20} fill="#4a5a9a" opacity={0.5} />
      <Glow x={300} y={900} r={700} color="#38c8f2" opacity={0.12} />
    </g>
  );
  const desk = (y: number) => (
    <g>
      <rect x={-20} y={y} width={1120} height={70} rx={28} fill="#5d6a8c" stroke={line('#5d6a8c')} strokeWidth={6} />
      <rect x={0} y={y + 8} width={1080} height={16} rx={8} fill="#8b97b8" />
    </g>
  );
  const ground = (y: number, c = '#9aa3a8') => (
    <g>
      <path d={`M0 ${y} L1080 ${y} L1080 1920 L0 1920 Z`} fill={c} />
      <path d={`M0 ${y} L1080 ${y}`} stroke={light(c, 0.3)} strokeWidth={8} />
      {Array.from({length: 7}, (_, i) => <path key={i} d={`M${i * 170 - 40} ${y + 40 + (i % 3) * 120} l120 0`} stroke={shade(c, 0.12)} strokeWidth={6} strokeLinecap="round" />)}
    </g>
  );

  switch (shot.view) {
    // ------------------------------------------------------------------ s1 the hook
    case 'console-hook': {
      const g = since('s1-ghost');
      const ghostV = lerp(0.72, 0.12, ease(clamp01((g - 0.15) / 1.1)));
      const rg = since('s1-ring');
      const lean = after(g - 0.6, 0.6);
      return svg(<g>
        {room()}
        <Gauge x={730} y={820} r={210} v={0.7 + Math.sin(frame / 20) * 0.015} frame={frame} ghost={clamp01(g * 3)} ghostV={ghostV} mood={ghostV < 0.3 ? 'worried' : 'calm'} />
        {rg > 0 && <MinuteRing x={730} y={820} r={265} k={1 - clamp01(rg / 8)} />}
        <Monitor x={720} y={1290} s={0.5} glow={0.35}>
          <Trend p={1} forecast={clamp01(g / 1.2)} frame={frame} />
        </Monitor>
        {desk(1470)}
        <Cup x={560} y={1480} s={0.9} ripple={g - 0.4} frame={frame} />
        {person(OP, 270 + 40 * lean, 1820, 2.0, move(g, 0.7, 'stand', 'point'), g > 0.7 ? 'surprised' : 'neutral', 0.7, 6)}
        <Burst x={730} y={820} p={(g - 1.2) / 0.6} color={ACCENT} r={300} />
      </g>);
    }
    case 'gauge-close': {
      // the cold open: the gauge fills the frame, the operator's face in its glass, the cup rippling in front
      const g = since('s1-ghost');
      const ghostV = lerp(0.72, 0.12, ease(clamp01((g - 0.1) / 1.0)));
      const rg = since('s1-ring');
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#26306a" />
        <Glow x={540} y={880} r={700} color="#38c8f2" opacity={0.15} />
        <Gauge x={540} y={880} r={340} v={0.7 + Math.sin(frame / 18) * 0.01} frame={frame} ghost={clamp01(g * 4)} ghostV={ghostV}
          mood={ghostV < 0.3 ? 'worried' : 'calm'} />
        {/* the operator's face reflected in the glass, faint, eyebrows going up */}
        <g opacity={0.16} transform="translate(700 700) scale(0.9)">
          <circle r={120} fill="#e0a97e" />
          <path d={`M-60 ${-50 - 14 * clamp01(g)} L-20 ${-56 - 14 * clamp01(g)} M20 ${-56 - 14 * clamp01(g)} L60 ${-50 - 14 * clamp01(g)}`} stroke="#1a1236" strokeWidth={12} strokeLinecap="round" />
          <circle cx={-40} cy={-20} r={14} fill="#1a1236" /><circle cx={40} cy={-20} r={14} fill="#1a1236" />
        </g>
        {rg > 0 && <MinuteRing x={540} y={880} r={430} k={1 - clamp01(rg / 10) * 0.3} of={18} />}
        <path d="M-40 1460 L1120 1460 L1120 1920 L-40 1920 Z" fill="#3d4a78" />
        <path d="M-40 1460 L1120 1460" stroke="#6a7aa8" strokeWidth={12} />
        <Cup x={820} y={1560} s={1.6} ripple={g - 0.3} frame={frame} />
        {person(OP, 190, 2150, 2.4, {pose: 'hold', holding: null}, g > 0.4 ? 'surprised' : 'thinking', 0.7, 6)}
        <Burst x={540} y={1180} p={(g - 1.0) / 0.6} color={ACCENT} r={300} />
      </g>);
    }
    // ------------------------------------------------------------------ s2 the refinery
    case 'refinery-wide': {
      const r = since('s2-roll');
      const drive = ease(clamp01(r / 3.2));
      return svg(<g>
        <Skyline y={1260} frame={frame} />
        {ground(1260)}
        <path d="M0 1500 L1080 1500" stroke="#f4efe6" strokeWidth={10} strokeDasharray="60 50" opacity={0.6} />
        <PickupV2 frame={frame} x={lerp(-200, 560, drive)} y={1560} scale={0.9} speed={drive < 1 ? 0.8 : 0} />
        {person(FIELD, 170, 1720, 1.35, move(r, 0.6, 'stand', 'wave'), r > 0.6 ? 'happy' : 'neutral', 0.7, 2, {walk: r < 0.6 ? r : undefined})}
      </g>);
    }
    case 'barrel-wall': {
      const c = since('s2-count');
      const u = since('s2-units');
      const n = 238000;
      const stacked = Math.floor(clamp01(c / 1.6) * 28);
      return svg(<g>
        <Skyline y={1100} frame={frame} tint={0.15} />
        {ground(1100, '#a7aeb2')}
        {Array.from({length: 28}, (_, i) => {
          const row = Math.floor(i / 7), col = i % 7;
          if (i >= stacked) return null;
          const bx = 150 + col * 130, by = 1420 - row * 150;
          return (
            <g key={i} transform={`translate(${bx} ${by})`}>
              <rect x={-55} y={-140} width={110} height={140} rx={22} fill={i % 3 ? '#3a6fc4' : '#c4513a'} stroke={line('#3a6fc4')} strokeWidth={5} />
              <rect x={-55} y={-100} width={110} height={10} rx={5} fill="#ffffff" opacity={0.35} />
              <rect x={-55} y={-50} width={110} height={10} rx={5} fill="#ffffff" opacity={0.35} />
            </g>
          );
        })}
        <g transform={`translate(600 560) scale(${0.6 + 0.4 * pop(c, 0.4, 2)}) translate(-600 -560)`}><Counter x={600} y={560} value={n.toLocaleString('en-US')} size={120} w={700} sub="BARRELS A DAY" op={clamp01(c * 4)} /></g>
        {u > 0 && (
          <g transform="translate(140 820)">
            {Array.from({length: 47}, (_, i) => {
              const on = clamp01(u * 4 - i * 0.06);
              return <rect key={i} x={(i % 16) * 52} y={Math.floor(i / 16) * 52} width={44} height={44} rx={12} fill={i === 23 ? ACCENT : '#e8ecf6'}
                opacity={on} transform={`translate(0 ${(1 - on) * -30})`} />;
            })}
          </g>
        )}
        {person(FIELD, 860, 1820, 1.9, move(c, 0.3, 'think', 'raise'), c > 0.3 ? 'excited' : 'surprised', -0.4, 2)}
      </g>);
    }
    // ------------------------------------------------------------------ s3 the coker
    case 'coker-hero': {
      const h = since('s3-hero');
      const rise = pop(h, 0.9, 1.2);
      return svg(<g>
        {ground(1700, '#8f989e')}
        <CokerUnit x={460} y={1700 + (1 - rise) * 500} s={0.8} frame={frame} heat={0.5} steam={rise} mood={h > 0.9 ? 'proud' : 'calm'} look={0.6} />
        {person(FIELD, 880, 1820, 1.3, move(h, 0.6, 'hips', 'point'), h > 0.6 ? 'excited' : 'surprised', -0.8, 2)}
      </g>);
    }
    case 'crack-cutaway': {
      const cr = since('s3-crack');
      const li = since('s3-light');
      const fall = clamp01(cr / 0.7);
      const split = after(cr - 0.7, 0.5);
      const fill = after(li, 1.4);
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#f3ead8" />
        <g transform="translate(540 760) scale(0.78)">
          <rect x={-260} y={-460} width={520} height={760} rx={160} fill="#3a3550" stroke={line('#3a3550')} strokeWidth={10} />
          <rect x={-230} y={-430} width={460} height={700} rx={140} fill="#251f3e" />
          <rect x={-200} y={-120} width={400} height={360} rx={110} fill="#ff6a2a" opacity={0.35 + 0.1 * Math.sin(frame / 5)} />
          <Glow x={0} y={60} r={300} color="#ff8a3d" opacity={0.55} />
          {[-120, 0, 120].map((fx) => <path key={fx} d={`M${fx - 30} 260 Q${fx - 10} ${200 - 20 * Math.sin(frame / 4 + fx)} ${fx} 230 Q${fx + 14} ${190 - 16 * Math.sin(frame / 3 + fx)} ${fx + 30} 260 Z`} fill="#ffb347" />)}
          {split < 1 && <ellipse cx={0} cy={lerp(-720, -60, fall)} rx={70 * (1 - split * 0.5)} ry={90 * (1 - split * 0.5)} fill="#1a1420" stroke="#4a3f5e" strokeWidth={6} />}
          {split > 0 && [-1, 1].map((sd) => <ellipse key={sd} cx={sd * 120 * split} cy={-60 - 180 * split} rx={30} ry={36} fill="#e9a23b" opacity={split} />)}
          <Burst x={0} y={-60} p={(cr - 0.7) / 0.6} color="#ffd34d" r={240} />
          <Word x={0} y={-500} t="HEAVY OIL" size={56} c="#3a3550" op={clamp01(cr * 3) * (1 - split)} />
        </g>
        {li > 0 && [[180, 'NAPHTHA'], [900, 'GAS OIL']].map(([jx, name], i) => (
          <g key={i} transform={`translate(${jx} 1130)`}>
            <path d={`M${i ? -340 : 340} -420 Q${i ? -160 : 160} -420 0 -260`} stroke="#f0b24a" strokeWidth={22 * clamp01(li * 2)} fill="none" strokeLinecap="round" opacity={0.9} />
            <rect x={-110} y={-260} width={220} height={260} rx={50} fill="#e8f2ff" opacity={0.6} stroke="#9ab0d0" strokeWidth={8} />
            <rect x={-96} y={-246 + 232 * (1 - fill)} width={192} height={232 * fill} rx={40} fill="#f0b24a" />
            <Word x={0} y={-290} t={name as string} size={40} c="#3a3550" />
          </g>
        ))}
      </g>);
    }
    // ------------------------------------------------------------------ s4 steam
    case 'steam-line': {
      const f = since('s4-flow');
      const go = clamp01(f * 2);
      return svg(<g>
        <Skyline y={1200} frame={frame} tint={0.2} />
        {ground(1200, '#9aa3a8')}
        {[120, 540, 960].map((px) => <rect key={px} x={px - 18} y={760} width={36} height={460} rx={12} fill={shade(STEEL, 0.25)} stroke={line(STEEL)} strokeWidth={5} />)}
        <SteamLine x0={-40} x1={1120} y={720} frame={frame} flow={go} valveX={760} />
        <SteamLine x0={-40} x1={1120} y={860} frame={frame + 15} flow={go * 0.7} valveX={300} r={28} />
        {person(FIELD, 160 + 520 * ease(clamp01(f / 2.0)), 1700, 1.5, f < 2.0 ? {pose: 'point'} : move(f, 2.0, 'point', 'reach'), f < 2.0 ? 'determined' : 'proud', 0.8, 2, {walk: f < 2.0 ? f : undefined})}
        <Steam x={1000} y={680} s={0.6} p={go} frame={frame} />
      </g>);
    }
    case 'turbine-close': {
      const tb = since('s4-turbine');
      const spin = frame * (10 + 18 * clamp01(tb * 1.5));
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#2c3570" />
        <g transform="translate(540 980)">
          <circle r={440} fill={shade(STEEL, 0.3)} stroke={line(STEEL)} strokeWidth={12} />
          <circle r={400} fill="#1a2148" />
          <g transform={`rotate(${spin})`}>
            {Array.from({length: 18}, (_, i) => <path key={i} d="M0 -90 Q60 -220 30 -370 L-20 -370 Q10 -220 -30 -90 Z" fill={i % 2 ? '#c9d2e8' : '#aeb9d6'}
              stroke={line('#aeb9d6')} strokeWidth={4} transform={`rotate(${i * 20})`} />)}
          </g>
          <circle r={96} fill="#e2b04a" stroke={line('#e2b04a')} strokeWidth={8} />
          <circle cx={-30} cy={-30} r={28} fill="#fff1c4" opacity={0.5} />
        </g>
        {tb > 0 && [0, 1, 2].map((i) => <path key={i} d={`M-40 ${700 + i * 120} L${lerp(-40, 420, clamp01(tb * 2 - i * 0.2))} ${760 + i * 100}`} stroke={CYAN} strokeWidth={30}
          strokeDasharray="40 30" strokeDashoffset={-frame * 10} strokeLinecap="round" opacity={0.75} />)}
        <Glow x={540} y={980} r={500} color={CYAN} opacity={0.15 * clamp01(tb * 2)} />
      </g>);
    }
    // ------------------------------------------------------------------ s5 the chain
    case 'boiler-falter': {
      const fa = since('s5-falter');
      const falter = clamp01(fa / 0.6);
      return svg(<g>
        <Skyline y={1150} frame={frame} tint={0.25} />
        {ground(1150, '#8f989e')}
        <Boiler x={680} y={1640} s={1.15} frame={frame} flame={1 - falter * 0.6} falter={falter} />
        {person(FIELD, lerp(120, 300, ease(clamp01(fa / 0.8))), 1840, 2.1, move(fa, 0.3, 'hold', 'panic'), fa > 0.3 ? 'surprised' : 'thinking', 0.8, 2, {walk: fa < 0.8 ? fa : undefined})}
        {falter > 0.3 && <Word x={680} y={1030} t="?!" size={110} c={ACCENT} op={falter} />}
      </g>);
    }
    case 'compressor-trip': {
      const dp = since('s5-dip');
      const tr = since('s5-trip');
      const v = lerp(0.7, 0.12, ease(clamp01(dp / 0.9)));
      const shake = tr > 0 && tr < 0.5 ? Math.sin(frame * 3) * 10 : 0;
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#3a3f78" />
        <rect x={0} y={1450} width={1080} height={470} fill="#262a52" />
        <Gauge x={760} y={600} r={190} v={v} frame={frame} mood={v < 0.3 ? 'panic' : 'calm'} />
        <g transform={`translate(${shake} 0)`}>
          <Compressor x={480} y={1500} s={1.3} frame={frame} tripped={tr > 0.2 ? 1 : 0} worried={dp > 0.4} />
        </g>
        <Burst x={560} y={1150} p={(tr - 0.2) / 0.6} color="#ff5d5d" r={300} />
      </g>);
    }
    case 'flare-wide': {
      const fl = since('s5-flare');
      const flame = 0.15 + 0.85 * after(fl, 0.6);
      return svg(<g>
        <Glow x={720} y={420} r={600} color="#ff8a3d" opacity={0.35 * after(fl, 0.6)} />
        <Skyline y={1250} frame={frame} tint={0.2} />
        <Flare x={720} y={1250} s={0.68} frame={frame} flame={flame} />
        {ground(1250, '#8a8f98')}
        {person(FIELD, lerp(420, 200, ease(clamp01(fl / 1.0))), 1700, 1.2, move(fl, 0.2, 'point', 'panic'), fl > 0.2 ? 'worried' : 'neutral', 0.9, 2, {walk: fl > 0 && fl < 1 ? fl : undefined})}
      </g>);
    }
    // ------------------------------------------------------------------ s6 the squeeze
    case 'console-alarm': {
      const al = since('s6-alarm');
      const red = al > 0 && Math.floor(frame / 6) % 2 === 0;
      return svg(<g>
        {room(red ? 0 : 0.15)}
        {[[230, 900, 0.36], [560, 840, 0.4], [880, 900, 0.36]].map(([mx, my, ms], i) => (
          <Monitor key={i} x={mx} y={my} s={ms} glow={red ? 0.45 : 0.2} alert={red}>
            <rect width={900} height={520} fill={red ? '#7a1f2c' : '#101634'} />
            <text x={450} y={300} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={120} fill="#fff6e6" opacity={red ? 1 : 0.3}>ALARM</text>
          </Monitor>
        ))}
        {desk(1300)}
        {person(OP, 540, 1840, 2.1, move(al, 0.2, 'stand', 'panic'), al > 0.2 ? 'worried' : 'neutral', al > 0.2 ? 0 : 0.6, 6)}
      </g>);
    }
    case 'choice-screen': {
      const ch = since('s6-choose');
      const drain = clamp01(1 - ch / 3.0);
      const names = ['PUMP B', 'HEATER 2', 'TURBINE C', 'BLOWER'];
      return svg(<g>
        {room(0.1)}
        <Monitor x={600} y={820} s={0.88}>
          <rect width={900} height={520} fill="#101634" />
          {names.map((n, i) => {
            const sh = Math.sin(ch * 6 + i * 1.7) * 30 * clamp01(ch);
            return (
              <g key={i} transform={`translate(${40 + i * 212} ${150 + sh})`}>
                <rect width={190} height={220} rx={30} fill={i === Math.floor(ch * 2) % 4 ? ACCENT : '#3a4580'} stroke="#8fa0d8" strokeWidth={4} />
                <text x={95} y={125} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={30} fill="#fff6e6">{n}</text>
              </g>
            );
          })}
          <rect x={40} y={430} width={820} height={40} rx={20} fill="#26305a" />
          <rect x={40} y={430} width={820 * drain} height={40} rx={20} fill={drain < 0.35 ? '#ff5d5d' : '#ffd34d'} />
        </Monitor>
        {person(OP, 150, 2050, 2.0, move(ch, 0.4, 'think', 'point'), ch > 0.4 ? 'worried' : 'thinking', 0.6, 6)}
      </g>);
    }
    // ------------------------------------------------------------------ s7 the pilot
    case 'pilot-calendar': {
      const cl = since('s7-cal');
      const flip = clamp01(cl / 0.6);
      const pin = pop(cl - 0.7, 0.35);
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#f3ead8" />
        <g transform="translate(470 920)">
          <ContactShadow x={0} y={520} w={520} opacity={0.25} />
          <rect x={-330} y={-470} width={660} height={940} rx={50} fill="#ffffff" stroke="#c9bfa8" strokeWidth={8} />
          <rect x={-330} y={-470} width={660} height={190} rx={50} fill={ACCENT} />
          <g transform={`scale(1 ${flip < 0.5 ? 1 - flip * 2 : (flip - 0.5) * 2})`}>
            <Word x={0} y={-350} t={flip < 0.5 ? 'SEPTEMBER' : 'OCTOBER'} size={78} c="#fff6e6" />
          </g>
          <Word x={0} y={-150} t="2024" size={120} c="#3a3550" />
          {Array.from({length: 31}, (_, i) => <rect key={i} x={-280 + (i % 7) * 82} y={-40 + Math.floor(i / 7) * 82} width={64} height={64} rx={16}
            fill={i === 0 && pin > 0 ? ACCENT : '#ece4d2'} />)}
          <g transform={`translate(-250 ${-10 - (1 - pin) * 160})`} opacity={clamp01(pin * 2)}>
            <circle r={34} fill="#d23a3a" stroke={line('#d23a3a')} strokeWidth={5} />
            <circle cx={-10} cy={-10} r={10} fill="#ffffff" opacity={0.6} />
          </g>
        </g>
        {person(OP, 900, 1800, 1.5, {pose: 'crossed'}, 'thinking', -0.6, 6)}
      </g>);
    }
    case 'panel-install': {
      const ins = since('s7-install');
      const slide = pop(ins, 0.6, 1.3);
      return svg(<g>
        {room()}
        <Monitor x={600} y={880} s={0.85} glow={0.25 + 0.3 * slide}>
          <Trend p={1} frame={frame} />
          <g transform={`translate(${lerp(960, 520, slide)} 40)`}>
            <rect width={350} height={440} rx={36} fill="#18245a" stroke={CYAN} strokeWidth={6} />
            <circle cx={175} cy={140} r={70} fill="none" stroke={CYAN} strokeWidth={10} />
            <circle cx={150} cy={130} r={12} fill={CYAN} /><circle cx={200} cy={130} r={12} fill={CYAN} />
            <path d="M140 170 Q175 195 210 170" stroke={CYAN} strokeWidth={8} fill="none" strokeLinecap="round" />
            <text x={175} y={290} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={44} fill="#fff6e6">AI ASSIST</text>
            <text x={175} y={350} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={28} fill="#8fa0d8">PILOT</text>
          </g>
        </Monitor>
        {desk(1330)}
        {person(OP, 230, 1860, 2.1, move(ins, 0.8, 'crossed', 'think'), ins > 0.8 ? 'thinking' : 'smug', 0.7, 6)}
        <Burst x={780} y={860} p={(ins - 0.5) / 0.6} color={CYAN} r={260} />
      </g>);
    }
    // ------------------------------------------------------------------ s8 the forecast
    case 'bell-close': {
      const tw = since('s9-twelve');
      const ring = tw > 0.4 ? Math.sin(frame * 1.1) * 18 * Math.exp(-(tw - 0.4) * 0.8) : 0;
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#f3ead8" />
        <g transform={`translate(540 820) scale(0.9) rotate(${ring})`}>
          <path d="M-230 160 Q-230 -200 0 -230 Q230 -200 230 160 L270 220 L-270 220 Z" fill="#e2b04a" stroke={line('#e2b04a')} strokeWidth={10} strokeLinejoin="round" />
          <path d="M-150 120 Q-160 -120 -40 -170" stroke="#fff1c4" strokeWidth={22} fill="none" strokeLinecap="round" opacity={0.6} />
          <circle cx={0} cy={260} r={50} fill="#c48a2a" stroke={line('#c48a2a')} strokeWidth={8} />
          <rect x={-30} y={-290} width={60} height={70} rx={20} fill="#8a90a8" />
        </g>
        {tw > 0.4 && [0, 1, 2].map((i) => <path key={i} d={`M${300 - i * 60} ${620 - i * 40} q-60 140 0 280 M${780 + i * 60} ${620 - i * 40} q60 140 0 280`} stroke="#d23a3a"
          strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.6 + 0.4 * Math.sin(frame / 3 + i)} />)}
        {Array.from({length: 5}, (_, i) => {
          const p = pop(tw - i * 0.12, 0.3);
          const x = 260 + i * 140;
          return (
            <g key={i} transform={`translate(${x} 1090) scale(${p})`}>
              <rect x={-64} y={-40} width={128} height={80} rx={24} fill={ACCENT} stroke={line(ACCENT)} strokeWidth={5} />
              <text x={0} y={11} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={30} fill="#fff6e6">12 MIN</text>
            </g>
          );
        })}
        <Word x={540} y={500} t="BEFORE THE ALARM" size={66} c="#3a3550" op={clamp01(tw * 3)} />
      </g>);
    }
    case 'gauge-ahead': {
      const fc = since('s8-forecast');
      const ghostV = lerp(0.72, 0.1, ease(clamp01(fc / 1.0)));
      const rg8 = since('s8-ring');
      const k = rg8 > 0 ? lerp(10 / 18, 1, ease(clamp01(rg8 / 1.0))) : (10 / 18) * clamp01((fc - 0.6) / 2.0);
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#1d2758" />
        <Glow x={540} y={800} r={700} color="#ff9a5a" opacity={0.16} />
        <Gauge x={540} y={800} r={225} v={0.7 + Math.sin(frame / 18) * 0.01} frame={frame} ghost={1} ghostV={ghostV} mood={k > 0.8 ? 'relieved' : 'worried'} />
        <MinuteRing x={540} y={800} r={290} k={k} of={18} />
        <TenToEighteen x={540} y={800} r={290} band={after(rg8, 1.0)} />
        {person(OP, 900, 1980, 1.7, rg8 > 0.6 ? {pose: 'cheer', fromPose: 'hold', poseBlend: clamp01((rg8 - 0.6) / 0.35)} : {pose: 'hold', holding: null},
          rg8 > 0.6 ? 'excited' : 'thinking', -0.6, 6)}
        
        <Burst x={540} y={400} p={(rg8 - 1.0) / 0.6} color={ACCENT} r={260} />
      </g>);
    }
    case 'trend-forecast': {
      const fc = since('s8-forecast');
      const k = clamp01(fc / 1.6);
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#1d2758" />
        <Monitor x={540} y={950} s={1.08} glow={0.3}>
          <Trend p={1} forecast={k} alert={after(fc - 1.4, 0.4)} minutes="10 to 18 min" frame={frame} />
          {k > 0.5 && (
            <g opacity={clamp01((k - 0.5) * 3)}>
              <path d="M520 470 L860 470" stroke={ACCENT} strokeWidth={6} />
              <path d="M520 450 L520 490 M860 450 L860 490" stroke={ACCENT} strokeWidth={6} />
            </g>
          )}
        </Monitor>
      </g>);
    }
    case 'desk-runway': {
      const rw = since('s8-runway');
      const roll = ease(clamp01(rw / 1.4));
      const cupSet = clamp01((rw - 1.6) / 0.4);
      return svg(<g>
        {room(0.1)}
        <Monitor x={540} y={620} s={0.6}>
          <Trend p={1} forecast={1} frame={frame} />
        </Monitor>
        <path d="M-60 1060 L1140 1060 L1140 1920 L-60 1920 Z" fill="#5d6a8c" />
        <path d="M-60 1060 L1140 1060" stroke="#8b97b8" strokeWidth={14} />
        {/* the runway rolling out of the screen across the desk, toward the viewer */}
        <g opacity={clamp01(rw * 3)}>
          <path d={`M470 1060 L610 1060 L${lerp(610, 860, roll)} ${lerp(1060, 1700, roll)} L${lerp(470, 220, roll)} ${lerp(1060, 1700, roll)} Z`} fill="#2a2558" opacity={0.85} />
          <path d={`M540 1060 L540 ${lerp(1060, 1700, roll)}`} stroke={ACCENT} strokeWidth={14} strokeDasharray="40 30" strokeDashoffset={-frame * 4} />
          {Array.from({length: 19}, (_, i) => {
            const k = i / 18;
            if (k > roll) return null;
            const y = lerp(1060, 1700, k), hw = lerp(70, 320, k);
            return (
              <g key={i}>
                <path d={`M${540 - hw} ${y} L${540 - hw + 30 + 30 * k} ${y}`} stroke="#fff6e6" strokeWidth={4 + 6 * k} strokeLinecap="round" />
                {(i === 10 || i === 18) && <Word x={540 + hw + 40} y={y + 14} t={`${i} MIN`} size={30 + 30 * k} c={ACCENT} anchor="start" />}
              </g>
            );
          })}
        </g>
        <Cup x={lerp(860, 600, cupSet)} y={lerp(1640, 1420, cupSet) - 60 * Math.sin(cupSet * Math.PI)} s={1.2} ripple={rw - 2.0} frame={frame} />
        {person(OP, 150, 2050, 2.0, move(rw, 1.2, 'stand', 'reach'), rw > 1.2 ? 'happy' : 'surprised', 0.5, 6)}
      </g>);
    }
    // ------------------------------------------------------------------ s9 the count
    case 'five-events': {
      const fv = since('s9-five');
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#f3ead8" />
        <path d="M80 1100 L1000 1100" stroke="#3a3550" strokeWidth={14} strokeLinecap="round" />
        {Array.from({length: 9}, (_, i) => <path key={i} d={`M${100 + i * 110} 1080 L${100 + i * 110} 1120`} stroke="#3a3550" strokeWidth={8} strokeLinecap="round" />)}
        {[140, 300, 460, 620, 780].map((px, i) => {
          const d = fv - i * 0.32;
          const p = pop(d, 0.4, 1.8);
          return (
            <g key={i} transform={`translate(${px} ${1090 - (1 - p) * 300})`} opacity={clamp01(d * 4)}>
              <ContactShadow x={0} y={14} w={90} />
              <path d="M0 0 C-40 -56 -44 -104 0 -114 C44 -104 40 -56 0 0Z" fill={ACCENT} stroke={line(ACCENT)} strokeWidth={6} />
              <circle cx={0} cy={-72} r={20} fill="#fff4dc" />
              <Word x={0} y={-62} t={String(i + 1)} size={30} c="#3a3550" />
            </g>
          );
        })}
        {[140, 300, 460, 620, 780].map((px, i) => {
          const fl = pop(since('s9-twelve') - i * 0.15, 0.35);
          return fl > 0 ? (
            <g key={`f${i}`} transform={`translate(${px} 940) scale(${fl})`}>
              <path d="M0 0 L0 -110" stroke="#3a3550" strokeWidth={6} />
              <rect x={0} y={-110} width={110} height={56} rx={14} fill="#3a3550" />
              <text x={55} y={-72} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={28} fill="#fff6e6">12 MIN</text>
            </g>
          ) : null;
        })}
        {since('s9-twelve') > 0 && (
          <g transform={`translate(960 1360) rotate(${Math.sin(frame * 1.2) * 14})`}>
            <path d="M-70 40 Q-70 -70 0 -80 Q70 -70 70 40 Z" fill="#e2b04a" stroke={line('#e2b04a')} strokeWidth={6} />
            <circle cx={0} cy={56} r={18} fill="#e2b04a" />
            <Word x={-180} y={20} t="ALARM" size={44} c="#d23a3a" />
          </g>
        )}
        <Word x={540} y={700} t="FIVE EVENTS" size={110} c="#3a3550" op={clamp01(fv * 2)} />
        {person(OP, 985, 1930, 1.45, move(fv, 0.4, 'stand', 'point'), fv > 0.4 ? 'surprised' : 'thinking', -0.7, 6)}
        {since('s9-date') > 0 && (
          <g transform={`translate(${lerp(1300, 760, pop(since('s9-date'), 0.5, 1.3))} 330) rotate(4)`}>
            <rect x={-200} y={-150} width={400} height={300} rx={34} fill="#ffffff" stroke="#c9bfa8" strokeWidth={6} />
            {[0, 1, 2].map((i) => <rect key={i} x={-160} y={-90 + i * 50} width={i === 2 ? 200 : 320} height={20} rx={10} fill="#d9d1c0" />)}
            <rect x={-170} y={70} width={340} height={60} rx={18} fill={ACCENT} />
            <text x={0} y={112} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={34} fill="#fff6e6">NOVEMBER 2025</text>
          </g>
        )}
      </g>);
    }
    // ------------------------------------------------------------------ s10 acting on it
    case 'console-act': {
      const ac = since('s10-act');
      const sc = since('s10-second');
      const tap = pop(ac - 0.4, 0.4);
      return svg(<g>
        {room()}
        <Monitor x={640} y={860} s={0.8} glow={0.3}>
          <Trend p={1} forecast={1} frame={frame} />
          <g transform="translate(560 90)">
            <rect width={320} height={120} rx={28} fill={tap > 0.5 ? GREEN : ACCENT} stroke="#fff6e6" strokeWidth={4} />
            <text x={160} y={76} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={40} fill="#fff6e6">{tap > 0.5 ? 'ACTED' : 'DIP AHEAD'}</text>
          </g>
          {[0, 1].map((i) => {
            const p = i === 0 ? tap : pop(sc, 0.35);
            return (
              <g key={i} transform={`translate(${620 + i * 130} 330) scale(${p})`}>
                <circle r={50} fill={GREEN} stroke="#fff6e6" strokeWidth={5} />
                <path d="M-22 0 L-6 18 L24 -18" stroke="#fff6e6" strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            );
          })}
        </Monitor>
        {desk(1300)}
        {person(OP, 260, 1840, 2.1, move(ac, 0.2, 'think', 'point'), ac > 0.6 ? 'proud' : 'determined', 0.7, 6)}
        <Burst x={880} y={760} p={(ac - 0.6) / 0.6} color={GREEN} r={240} />
      </g>);
    }
    case 'alert-tap': {
      const ac = since('s10-act');
      const sc = since('s10-second');
      const tap = pop(ac - 0.5, 0.3);
      const press = ac > 0.3 && ac < 0.6 ? 1 : 0;
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#101634" />
        <Glow x={540} y={760} r={600} color={tap > 0.5 ? GREEN : ACCENT} opacity={0.2} />
        <g transform="translate(540 760)">
          <rect x={-420} y={-300} width={840} height={600} rx={50} fill="#18245a" stroke="#3a4a8a" strokeWidth={8} />
          <rect x={-300} y={-200} width={600} height={190} rx={44} fill={tap > 0.5 ? GREEN : ACCENT} stroke="#fff6e6" strokeWidth={6} />
          <Word x={0} y={-80} t={tap > 0.5 ? 'ACTED ON' : 'DIP AHEAD'} size={78} c="#fff6e6" />
          {[0, 1].map((i) => {
            const p = i === 0 ? tap : pop(sc, 0.35);
            return (
              <g key={i} transform={`translate(${-80 + i * 160} 150) scale(${p})`}>
                <circle r={62} fill={GREEN} stroke="#fff6e6" strokeWidth={6} />
                <path d="M-28 0 L-8 22 L30 -22" stroke="#fff6e6" strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            );
          })}
        </g>
        {/* the operator's hand and sleeve reaching in from the lower right, the finger landing on the alert */}
        <g transform={`translate(${lerp(1200, 760, ease(clamp01(ac / 0.4)))} ${lerp(1500, 960 + press * 14, ease(clamp01(ac / 0.4)))}) rotate(-35)`}>
          <rect x={60} y={-60} width={600} height={170} rx={80} fill="#3d5a8a" stroke={line('#3d5a8a')} strokeWidth={6} />
          <rect x={-20} y={-50} width={150} height={140} rx={60} fill="#8c5733" stroke={line('#8c5733')} strokeWidth={6} />
          <rect x={-120} y={-30} width={140} height={44} rx={22} fill="#8c5733" stroke={line('#8c5733')} strokeWidth={6} />
          <rect x={20} y={50} width={90} height={40} rx={20} fill={shade('#8c5733', 0.15)} />
        </g>
        <Burst x={540} y={660} p={(ac - 0.6) / 0.6} color={GREEN} r={260} />
      </g>);
    }
    case 'klein-screen': {
      const kl = since('s10-klein');
      const mt = since('s10-match');
      const join = ease(clamp01(mt / 0.8));
      return svg(<g>
        {room()}
        <Monitor x={540} y={820} s={0.85} glow={0.3}>
          <rect width={900} height={520} fill="#101634" />
          <path d="M40 300 L880 300" stroke="#26305a" strokeWidth={3} />
          <path d={`M60 ${200 - 120 * (1 - join)} Q300 ${200 - 120 * (1 - join)} 450 ${380 - 60 * (1 - join)} T840 ${210 - 120 * (1 - join)}`} stroke={ACCENT} strokeWidth={10}
            strokeDasharray="22 14" fill="none" />
          <path d="M60 200 Q300 200 450 380 T840 210" stroke={CYAN} strokeWidth={10} fill="none" opacity={0.9} />
          {join > 0.95 && <circle cx={450} cy={380} r={40 + 10 * Math.sin(frame / 4)} fill="none" stroke={GREEN} strokeWidth={8} />}
          <text x={60} y={80} fontFamily={FONT.body} fontWeight={800} fontSize={34} fill={ACCENT}>FORECAST</text>
          <text x={60} y={480} fontFamily={FONT.body} fontWeight={800} fontSize={34} fill={CYAN}>WHAT HAPPENED</text>
        </Monitor>
        {desk(1310)}
        {person(OP, 200, 1840, 1.9, {pose: 'stand'}, kl > 1 ? 'happy' : 'thinking', 0.6, 6)}
        {person(KLEIN, lerp(1180, 860, ease(clamp01(kl / 0.8))), 1860, 2.0, move(kl, 0.8, 'stand', 'point'), mt > 0.8 ? 'happy' : 'surprised', -0.6, 9,
          {walk: kl > 0 && kl < 0.8 ? kl : undefined})}
        <Burst x={540} y={900} p={(mt - 0.8) / 0.6} color={GREEN} r={260} />
      </g>);
    }
    case 'panel-shoulder': {
      // over the operator's shoulder: the new panel slides onto the screen, big
      const ins = since('s7-install');
      const slide = pop(ins, 0.6, 1.3);
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#16204a" />
        <g transform="translate(560 760) scale(1.05)">
          <rect x={-470} y={-300} width={940} height={600} rx={44} fill="#232842" stroke={line('#232842')} strokeWidth={8} />
          <g transform="translate(-450 -280)"><svg width={900} height={560} viewBox="0 0 900 520" preserveAspectRatio="none"><Trend p={1} frame={frame} /></svg></g>
          <g transform={`translate(${lerp(600, 40, slide)} -250)`}>
            <rect width={400} height={500} rx={40} fill="#18245a" stroke={CYAN} strokeWidth={7} />
            <circle cx={200} cy={170} r={84} fill="none" stroke={CYAN} strokeWidth={12} />
            <circle cx={170} cy={158} r={14} fill={CYAN} /><circle cx={230} cy={158} r={14} fill={CYAN} />
            <path d="M160 205 Q200 235 240 205" stroke={CYAN} strokeWidth={10} fill="none" strokeLinecap="round" />
            <text x={200} y={340} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={52} fill="#fff6e6">AI ASSIST</text>
            <text x={200} y={410} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={34} fill="#8fa0d8">PILOT</text>
          </g>
        </g>
        <Burst x={700} y={700} p={(ins - 0.5) / 0.6} color={CYAN} r={300} />
        <Glow x={860} y={1500} r={420} color={CYAN} opacity={0.25 * after(ins - 0.3, 0.5)} />
        {person(OP, 870, 2000, 2.0, move(ins, 0.7, 'crossed', 'think'), ins > 0.7 ? 'surprised' : 'smug', -0.6, 6)}
      </g>);
    }
    case 'lines-lock': {
      const mt = since('s10-match');
      const join = ease(clamp01(mt / 0.8));
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#101634" />
        <g transform="translate(0 420) scale(1.2 1.6)">
          <path d={`M40 ${220 - 140 * (1 - join)} Q300 ${220 - 140 * (1 - join)} 450 ${400 - 80 * (1 - join)} T860 ${230 - 140 * (1 - join)}`} stroke={ACCENT}
            strokeWidth={14} strokeDasharray="26 16" fill="none" />
          <path d="M40 220 Q300 220 450 400 T860 230" stroke={CYAN} strokeWidth={14} fill="none" />
        </g>
        {join > 0.95 && <g transform="translate(540 1060)"><circle r={80 + 12 * Math.sin(frame / 4)} fill="none" stroke={GREEN} strokeWidth={12} />
          <path d="M-36 0 L-10 28 L40 -30" stroke={GREEN} strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>}
        <Word x={540} y={560} t="PREDICTED" size={70} c={ACCENT} />
        <Word x={540} y={680} t="THEN SEEN" size={70} c={CYAN} op={clamp01(join * 2)} />
        <Burst x={540} y={1060} p={(mt - 0.8) / 0.6} color={GREEN} r={300} />
      </g>);
    }
    case 'card-close': {
      const nw = since('s12-newer');
      const flip = clamp01(nw / 0.5);
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#16204a" />
        <g transform={`translate(560 760) rotate(-3) scale(${flip < 0.5 ? 1 - flip * 2 : (flip - 0.5) * 2} 1)`}>
          <rect x={-380} y={-280} width={760} height={560} rx={50} fill={flip < 0.5 ? '#3a4580' : '#fff6e6'} stroke="#8fa0d8" strokeWidth={6} />
          {flip < 0.5 ? <text y={20} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={70} fill="#fff6e6">PAST ALARM</text> : (
            <>
              <text y={-140} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={54} fill="#3a3550">LAST TIME</text>
              <text y={-50} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={48} fill={GREEN}>WHAT WORKED</text>
              <rect x={-280} y={20} width={560} height={26} rx={13} fill="#c9bfa8" />
              <rect x={-280} y={80} width={420} height={26} rx={13} fill="#c9bfa8" />
              <rect x={-280} y={140} width={500} height={26} rx={13} fill="#c9bfa8" />
            </>
          )}
        </g>
        {person(NEWER, 860, 2050, 2.6, move(nw, 0.6, 'think', 'cheer'), nw > 0.6 ? 'excited' : 'thinking', -0.6, 4)}
      </g>);
    }
    case 'klein-arms': {
      const dt = since('s13-doubt');
      const rm = since('s13-room');
      return svg(<g>
        {room(0.15)}
        <Monitor x={820} y={700} s={0.4}><Trend p={1} forecast={1} frame={frame} /></Monitor>
        {person(KLEIN, 460, 2500, 3.4, move(rm, 0.1, 'crossed', 'reach'), rm > 0.3 ? 'smug' : dt > 0 ? 'angry' : 'neutral', 0.3, 9)}
        {rm > 0 && <Glow x={820} y={700} r={300} color={CYAN} opacity={0.35 * after(rm, 0.5)} />}
      </g>);
    }
    // ------------------------------------------------------------------ s11 the test
    case 'drum-switch': {
      const sw = since('s11-switch');
      const ph = (Math.sin(t * 2.2) + 1) / 2;
      return svg(<g>
        {ground(1720, '#8f989e')}
        <CokerUnit x={470} y={1720} s={0.88} frame={frame} heat={0.3 + 0.6 * ph} steam={0.7} mood="worried" look={Math.sin(t * 2.2) * 0.8} />
        <g transform={`translate(${470 + 230 * 0.88} ${1720 - 900 * 0.88}) rotate(${Math.sin(frame / 10) * 6})`} opacity={clamp01(sw * 3)}>
          <path d="M0 -60 L0 0" stroke="#3a3550" strokeWidth={6} />
          <rect x={-120} y={0} width={240} height={110} rx={28} fill="#fff6e6" stroke="#3a3550" strokeWidth={6} />
          <text x={0} y={50} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={30} fill="#3a3550">DRUM LEVEL</text>
          <text x={0} y={90} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={26} fill={ACCENT}>forecast</text>
        </g>
        {person(FIELD, 920, 1820, 1.4, move(sw, 0.5, 'hips', 'think'), 'thinking', -0.6, 2)}
      </g>);
    }
    case 'drum-deck': {
      const sw = since('s11-switch');
      const ph = (Math.sin(t * 2.2) + 1) / 2;
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#9fc4ea" opacity={0.25} />
        <g transform="translate(0 0)">
          <path d="M60 1920 L250 300 L470 300 L520 1920 Z" fill="#c9cfdc" />
          <Drum x={150} y={260} w={360} h={1700} c="#d9dde8" heat={0.25 + 0.7 * ph} />
          <Drum x={600} y={260} w={360} h={1700} c="#d9dde8" heat={0.25 + 0.7 * (1 - ph)} />
          <rect x={60} y={180} width={960} height={90} rx={36} fill={shade('#e9b949', 0.1)} stroke={line('#e9b949')} strokeWidth={8} />
          <Steam x={330} y={160} s={1.2} p={ph} frame={frame} />
          <Steam x={780} y={160} s={1.2} p={1 - ph} frame={frame + 30} />
        </g>
        <g transform={`translate(330 ${lerp(-200, 700, pop(since('s11-tag'), 0.6, 1.4))}) rotate(${Math.sin(frame / 10) * 8})`} opacity={clamp01(since('s11-tag') * 4)}>
          <path d="M0 -80 L0 0" stroke="#3a3550" strokeWidth={8} />
          <rect x={-170} y={0} width={340} height={150} rx={36} fill="#fff6e6" stroke="#3a3550" strokeWidth={8} />
          <text x={0} y={68} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={42} fill="#3a3550">DRUM LEVEL</text>
          <text x={0} y={120} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={36} fill={ACCENT}>forecast</text>
        </g>
        {person(FIELD, 840, 1960, 1.9, move(since('s11-tag'), 0.3, 'think', 'point'), since('s11-tag') > 0.3 ? 'surprised' : 'thinking', -0.7, 2)}
      </g>);
    }
    case 'score-stamp': {
      const sc = since('s11-score');
      const dr = since('s11-drop');
      const n = 75;
      const st = pop(dr, 0.25, 2.2);
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#2a3270" />
        <g transform="translate(540 820) rotate(-3)">
          <LitBox x={-380} y={-360} w={760} h={720} r={60} c="#fff6e6" />
          <Word x={0} y={-220} t="DRUM LEVEL MODEL" size={50} c="#3a3550" />
          <g transform={`scale(${0.5 + 0.5 * pop(sc, 0.4, 2)})`}><Word x={0} y={60} t={`${n}%`} size={230} c={ACCENT} op={clamp01(sc * 4)} /></g>
          <Word x={0} y={200} t="right" size={56} c="#3a3550" />
          {dr > 0 && (
            <g transform={`rotate(-14) scale(${lerp(1.8, 1, st)})`} opacity={clamp01(st)}>
              <rect x={-330} y={-80} width={660} height={160} rx={30} fill="none" stroke="#d23a3a" strokeWidth={18} />
              <text x={0} y={36} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={100} fill="#d23a3a">NOT KEPT</text>
            </g>
          )}
        </g>
        {person(FIELD, 820, 1880, 1.8, move(dr, 0.2, 'stand', 'shrug'), dr > 0.2 ? 'neutral' : 'thinking', -0.5, 2)}
        <Burst x={540} y={820} p={(dr - 0.1) / 0.5} color="#ff5d5d" r={300} />
      </g>);
    }
    case 'outside-box': {
      const os = since('s11-outside');
      const box = ease(clamp01(os / 0.8));
      const per = 2 * (420 + 360);
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#c9cfd6" />
        <path d="M0 0 L1080 0 L1080 1920 L0 1920 Z" fill="#b3bac4" opacity={0.4} />
        {/* the model in the middle */}
        <g transform="translate(540 760)">
          <LitBox x={-160} y={-120} w={320} h={240} r={50} c="#2a3270" />
          <Word x={0} y={20} t="MODEL" size={64} c={CYAN} />
          <rect x={-210} y={-180} width={420} height={360} rx={50} fill="none" stroke={ACCENT} strokeWidth={10} strokeDasharray={`${per * box} ${per}`} />
        </g>
        {/* what sits outside it: a crane, a crew and a schedule */}
        <g transform={`translate(170 ${1100 - 30 * pop(os - 0.8, 0.4)})`}>
          <rect x={-14} y={-300} width={28} height={300} rx={10} fill="#e9b949" />
          <rect x={-14} y={-300} width={220} height={26} rx={10} fill="#e9b949" />
          <path d="M190 -276 L190 -150" stroke="#3a3550" strokeWidth={5} />
          <rect x={170} y={-150} width={40} height={30} rx={8} fill="#3a3550" />
          <Word x={60} y={70} t="crane" size={44} c="#3a3550" />
        </g>
        <g transform={`translate(890 ${1100 - 30 * pop(os - 1.0, 0.4)})`}>
          <rect x={-120} y={-260} width={240} height={300} rx={30} fill="#fff6e6" stroke="#3a3550" strokeWidth={6} />
          {[0, 1, 2, 3].map((i) => <rect key={i} x={-90} y={-220 + i * 60} width={180} height={20} rx={10} fill={i === 1 ? ACCENT : '#c9bfa8'} />)}
          <Word x={0} y={110} t="schedule" size={44} c="#3a3550" />
        </g>
        {person(FIELD, 640, 1800, 1.4, move(os, 1.2, 'stand', 'point'), 'thinking', 0.6, 2)}
        {person(NEWER, 400, 1820, 1.3, {pose: 'shrug'}, 'neutral', 0.4, 4)}
      </g>);
    }
    // ------------------------------------------------------------------ s12 the alarm guide
    case 'tag-wall': {
      const tg = since('s12-tags');
      const n = Math.round(300 * after(tg, 1.6));
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#1d2758" />
        {Array.from({length: 300}, (_, i) => {
          const col = i % 15, row = Math.floor(i / 15);
          const on = i < n;
          return <rect key={i} x={110 + col * 58} y={760 + row * 22} width={48} height={16} rx={6} fill={on ? (i % 23 === 0 ? ACCENT : CYAN) : '#2e3a78'} opacity={on ? 0.95 : 0.6} />;
        })}
        <Counter x={600} y={560} value="300+" size={120} w={520} sub="COKER TAGS" op={clamp01(tg * 3)} />
      </g>);
    }
    case 'mentor-screen': {
      const ex = since('s12-example');
      const nw = since('s12-newer');
      const ev = since('s12-eval');
      const flip = clamp01((Math.max(ex, nw) + 0.2) / 0.6);
      const swing = ev > 0 ? Math.sin(ev * 6) * 20 * Math.exp(-ev * 1.5) : 0;
      return svg(<g>
        {room()}
        <Monitor x={560} y={820} s={0.82}>
          <rect width={900} height={520} fill="#101634" />
          <g transform={`translate(450 260) scale(${flip < 0.5 ? 1 - flip * 2 : (flip - 0.5) * 2} 1)`}>
            <rect x={-330} y={-200} width={660} height={400} rx={40} fill={flip < 0.5 ? '#3a4580' : '#fff6e6'} />
            {flip < 0.5 ? (
              <text x={0} y={20} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={60} fill="#fff6e6">PAST ALARM</text>
            ) : (
              <>
                <text x={0} y={-90} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={46} fill="#3a3550">LAST TIME</text>
                <text x={0} y={0} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={40} fill={GREEN}>WHAT WORKED</text>
                <rect x={-240} y={60} width={480} height={22} rx={11} fill="#c9bfa8" />
                <rect x={-240} y={110} width={340} height={22} rx={11} fill="#c9bfa8" />
              </>
            )}
          </g>
          {ev > 0 && (
            <g transform={`translate(760 20) rotate(${swing})`}>
              <path d="M0 0 L0 40" stroke="#fff6e6" strokeWidth={4} />
              <rect x={-100} y={40} width={200} height={70} rx={20} fill="#ffd34d" />
              <text x={0} y={86} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={26} fill="#3a3550">EVALUATING</text>
            </g>
          )}
        </Monitor>
        {desk(1310)}
        {person(NEWER, 330, 1860, 2.0, move(nw, 0.6, 'think', 'point'), nw > 0.6 ? 'happy' : 'worried', 0.6, 4)}
        {since('s12-conf') < 0 ? person(OP, 860, 1880, 1.9, move(nw, 0.3, 'crossed', 'stand'), nw > 0.3 ? 'proud' : 'neutral', -0.7, 6) : (
          <g>
            <path d={`M760 0 L${860 - 200} 1900 L${860 + 200} 1900 L960 0 Z`} fill="#fff4c4" opacity={0.18 * after(since('s12-conf'), 0.4)} />
            {person(KLEIN, 860, 1880, 1.9, {pose: 'wave'}, 'happy', -0.7, 9)}
            <g transform={`translate(860 ${lerp(1100, 1880 - 1.9 * 270, pop(since('s12-conf'), 0.5))})`}>
              <path d="M-50 -60 L0 40 L50 -60" stroke="#ffd34d" strokeWidth={10} fill="none" />
              <rect x={-40} y={40} width={80} height={100} rx={14} fill="#fff6e6" stroke="#3a3550" strokeWidth={4} />
              <rect x={-26} y={70} width={52} height={12} rx={6} fill={ACCENT} />
            </g>
          </g>
        )}
      </g>);
    }
    case 'conference-stage': {
      const cf = since('s12-conf');
      const lit = after(cf, 0.5);
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#1a1440" />
        <path d={`M440 0 L640 0 L900 1500 L180 1500 Z`} fill="#fff4c4" opacity={0.08 + 0.16 * lit} />
        <rect x={140} y={420} width={800} height={460} rx={40} fill="#2a2f6a" stroke="#4a5aa8" strokeWidth={8} />
        <g transform="translate(140 420) scale(0.889)"><Trend p={1} forecast={1} frame={frame} /></g>
        <rect x={-40} y={1500} width={1160} height={420} fill="#3a2f6a" />
        <path d="M-40 1500 L1120 1500" stroke="#6a5aa8" strokeWidth={14} />
        <rect x={700} y={1240} width={200} height={260} rx={30} fill="#5a4a8a" stroke={line('#5a4a8a')} strokeWidth={6} />
        {person(KLEIN, 480, 1520, 2.0, move(cf, 0.3, 'stand', 'point'), lit > 0.5 ? 'happy' : 'neutral', 0.3, 9)}
        <g transform={`translate(480 ${lerp(900, 1520 - 2.0 * 270, pop(cf, 0.5))})`}>
          <path d="M-50 -60 L0 40 L50 -60" stroke="#ffd34d" strokeWidth={10} fill="none" />
          <rect x={-40} y={40} width={80} height={100} rx={14} fill="#fff6e6" stroke="#3a3550" strokeWidth={4} />
          <rect x={-26} y={70} width={52} height={12} rx={6} fill={ACCENT} />
        </g>
        {Array.from({length: 9}, (_, i) => <circle key={i} cx={60 + i * 120} cy={1840 - (i % 2) * 30} r={70} fill="#120c30" />)}
      </g>);
    }
    // ------------------------------------------------------------------ s13 the honest word
    case 'klein-doubt': {
      const dt = since('s13-doubt');
      const rm = since('s13-room');
      return svg(<g>
        {room()}
        <Monitor x={560} y={860} s={0.62}><Trend p={1} forecast={1} frame={frame} /></Monitor>
        {desk(1220)}
        {rm > 0 && <Glow x={560} y={860} r={380} color={CYAN} opacity={0.3 * after(rm, 0.5)} />}
        {person(KLEIN, 560, 1900, 2.2, move(rm, 0.1, 'crossed', 'reach'), rm > 0.3 ? 'smug' : dt > 0 ? 'angry' : 'neutral', rm > 0 ? 0.4 : 0, 9)}
      </g>);
    }
    case 'plug-socket': {
      const pl = since('s13-plug');
      const miss = pl < 1.0;
      const px = miss ? lerp(220, 520, ease(clamp01(pl / 0.6))) + (pl > 0.6 ? Math.sin(pl * 20) * 14 : 0) : lerp(520, 640, ease(clamp01((pl - 1.0) / 0.5)));
      const py = miss ? 760 : lerp(760, 900, ease(clamp01((pl - 1.0) / 0.5)));
      const seated = pl > 1.5;
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#2a3270" />
        <g transform="translate(800 900)">
          <LitBox x={-160} y={-200} w={320} h={400} r={50} c="#c3cbe0" />
          <rect x={-70} y={-60} width={140} height={120} rx={30} fill="#1d2340" />
          {[-30, 30].map((sx) => <rect key={sx} x={sx - 10} y={-30} width={20} height={60} rx={8} fill="#000" />)}
          {seated && <Glow x={0} y={0} r={200} color={GREEN} opacity={0.5} />}
        </g>
        <path d={`M-60 1300 Q200 1200 ${px - 160} ${py}`} stroke="#3a3550" strokeWidth={30} fill="none" strokeLinecap="round" />
        <g transform={`translate(${px} ${py}) rotate(${miss ? -12 : 0})`}>
          <rect x={-160} y={-70} width={200} height={140} rx={40} fill="#e9b949" stroke={line('#e9b949')} strokeWidth={6} />
          {[-30, 30].map((sy) => <rect key={sy} x={40} y={sy - 10} width={80} height={20} rx={8} fill="#c3cbe0" />)}
        </g>
        <g transform="translate(260 1350) rotate(-20)">
          <rect x={-150} y={-22} width={300} height={44} rx={22} fill="#8a90a8" />
          <circle cx={-150} cy={0} r={46} fill="none" stroke="#8a90a8" strokeWidth={26} />
        </g>
        <Word x={540} y={560} t="NOT PLUG AND PLAY" size={72} c="#fff6e6" op={clamp01(pl * 2)} />
        {person(KLEIN, 330, 1900, 1.9, move(pl, 0.9, 'stand', 'reach'), pl > 0.9 ? 'smug' : 'surprised', 0.6, 9)}
        <Burst x={800} y={900} p={(pl - 1.5) / 0.6} color={GREEN} r={240} />
      </g>);
    }
    // ------------------------------------------------------------------ s14 the button
    case 'chairs-overhead': {
      // two operators roll in on chairs from either side and settle at the console, the cup on the desk between them
      const tm = since('s14-team');
      const come = ease(clamp01((tm + 0.3) / 0.6));
      const chair = (x: number, c: string) => (
        <g transform={`translate(${x} 1300)`}>
          <rect x={-150} y={-420} width={300} height={360} rx={90} fill={c} stroke={line(c)} strokeWidth={8} />
          <rect x={-130} y={-400} width={120} height={300} rx={60} fill={light(c, 0.3)} opacity={0.35} />
        </g>
      );
      return svg(<g>
        {room()}
        {chair(lerp(-160, 300, come), '#3a4270')}
        {chair(lerp(1240, 780, come), '#3a4270')}
        {person(OP, lerp(-160, 300, come), 1380, 1.45, {pose: come < 1 ? 'cheer' : 'stand'}, 'happy', 0.6, 6)}
        {person(NEWER, lerp(1240, 780, come), 1390, 1.45, {pose: come < 1 ? 'wave' : 'stand'}, 'happy', -0.6, 4)}
        <path d="M-40 1100 L1120 1100 L1120 1920 L-40 1920 Z" fill="#5d6a8c" />
        <path d="M-40 1100 L1120 1100" stroke="#8b97b8" strokeWidth={16} />
        <Monitor x={540} y={980} s={0.22}><Trend p={1} forecast={1} frame={frame} /></Monitor>
        <Cup x={760} y={1180} s={0.9} ripple={tm - 1.0} frame={frame} />
        <Gauge x={420} y={1080} r={120} v={0.7} frame={frame} ghost={1} ghostV={0.2} mood="calm" />
        {come < 1 && [0, 1].map((i) => <path key={i} d={`M${i ? lerp(1400, 950, come) : lerp(-320, 130, come)} ${1000 + i * 20} l${i ? 120 : -120} 0`}
          stroke="#8fa0d8" strokeWidth={12} strokeLinecap="round" opacity={0.7 * (1 - come)} />)}
      </g>);
    }
    case 'gauge-end': {
      const cl = since('s14-call');
      const tap = pop(cl - 0.2, 0.3);
      const ghostV = 0.7 - 0.55 * Math.abs(Math.sin(t * 1.4));
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#26306a" />
        <Glow x={540} y={720} r={600} color={GREEN} opacity={0.12 * tap} />
        <Gauge x={540} y={720} r={290} v={0.7 + Math.sin(frame / 18) * 0.01} frame={frame} ghost={1} ghostV={ghostV} mood={tap > 0.6 ? 'relieved' : 'worried'} />
        <Word x={540} y={330} t="NOW" size={60} c={CYAN} />
        <Word x={880} y={1060} t="NEXT" size={50} c={ACCENT} />
        <g transform="translate(330 1250)">
          <rect x={-170} y={-60} width={340} height={120} rx={30} fill={tap > 0.5 ? GREEN : ACCENT} stroke="#fff6e6" strokeWidth={5} />
          <text y={16} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={40} fill="#fff6e6">{tap > 0.5 ? 'ON IT' : 'DIP AHEAD'}</text>
        </g>
        {person(OP, 760, 1940, 2.0, move(cl, 0.1, 'stand', 'hold'), tap > 0.5 ? 'determined' : 'thinking', -0.4, 6, {holding: (
          <g><rect x={-30} y={-110} width={60} height={130} rx={18} fill="#2a2a3a" /><rect x={-10} y={-150} width={10} height={50} rx={5} fill="#2a2a3a" />
            <circle cx={0} cy={-70} r={12} fill={Math.floor(frame / 8) % 2 ? '#3ddc84' : '#1a5a3a'} /></g>)})}
        {tap > 0.5 && [0, 1, 2].map((i) => <path key={i} d={`M${640 - i * 30} ${1420 - i * 40} q-40 -40 0 -80`} stroke={GREEN} strokeWidth={6} fill="none"
          opacity={0.5 + 0.5 * Math.sin(frame / 4 - i)} />)}
      </g>);
    }
    case 'operator-close': {
      const hd = since('s14-hold');
      const calm = after(hd, 0.8);
      const wink = hd > 0.8 && hd < 1.2;
      return svg(<g>
        {room()}
        <defs><clipPath id="sa-win"><rect x={570} y={170} width={470} height={380} rx={30} /></clipPath></defs>
        <g clipPath="url(#sa-win)">
          <CokerUnit x={800} y={600} s={0.28} frame={frame} heat={0.4} steam={0.7} mood={wink ? 'relieved' : 'proud'} look={-0.6} />
        </g>
        {person(OP, 540, 2400, 3.4, {pose: 'stand'}, calm > 0.5 ? 'happy' : 'thinking', 0.2, 6)}
        <path d="M-40 1500 L1120 1500 L1120 1920 L-40 1920 Z" fill="#3d4a78" />
        <Gauge x={250} y={1360} r={200} v={0.7} frame={frame} ghost={1 - calm} ghostV={0.2} mood={calm > 0.5 ? 'relieved' : 'calm'} />
        <Cup x={850} y={1560} s={1.3} ripple={calm < 0.5 ? (frame % 40) / 30 : -1} frame={frame} />
      </g>);
    }
    case 'coker-dusk': {
      const hd = since('s14-hold');
      const wink = hd > 0.6 && hd < 1.0;
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#ff9a5a" opacity={0.12} />
        {ground(1720, '#8a8f98')}
        <CokerUnit x={460} y={1720} s={0.9} frame={frame} heat={0.4} steam={0.8} mood={wink ? 'relieved' : 'proud'} look={0.5} />
        {person(FIELD, 920, 1820, 1.45, move(hd, 0.4, 'stand', 'wave'), 'happy', -0.6, 2)}
        <Glow x={820} y={400} r={420} color="#ffd9a0" opacity={0.35} />
      </g>);
    }
    default:
      return svg(<g>{room()}<Monitor x={540} y={900} s={0.8}><Trend p={1} frame={frame} /></Monitor>{desk(1300)}</g>);
  }
};
