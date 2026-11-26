import React from 'react';
import {useCurrentFrame} from 'remotion';
import type {FilmRenderProps} from '../../../modern/types';
import {actionWindows, type DirectedScene} from '../../../lib/direction';
import {Figure, castV2, figureHands, type FigureEmotion, type FigurePose, type FigureProps} from '../../../look/Figure';
import {Burst, ContactShadow, Glow, ScanBox, clamp01, ease, lerp} from '../../../look/Kit';
import {line, light, shade} from '../../../look/color';
import {Bush} from '../../../look/Kit';
import {Pumpjack} from '../../../look/regions';
import {
  BrushTruck, Counter, LitBox, Lookout, Monitor, PanoView, PhoneRing, Post, SmokeWisp, TriMap, Word, after, pop,
} from './parts';

/**
 * smoke-watch-1125 (November 25th, 2026): "Two eyes on the smoke". Across the Texas Panhandle, after the Smokehouse
 * Creek fire, Xcel Energy and Pano AI put AI camera stations on communication towers: 57 stations, two cameras each,
 * a 360 degree sweep every minute, a human analyst checks each flag, two cameras triangulate, Pano calls 911. Every
 * fact is in claims.json.
 *
 * Hero: the camera station whose two camera heads are its two eyes. Throughline: the smoke curl, a thin curl on the
 * horizon, boxed on the screen, a pin where two sightlines cross, hosed out to a wet black patch. People are
 * illustrative from the v2 cast. No real person's likeness and no company's mark.
 */
const RANCH: Partial<FigureProps> = {...castV2('rancher')};
const LINE: Partial<FigureProps> = {...castV2('lineworker')};
const ANALYST: Partial<FigureProps> = {...castV2('technician'), glasses: true};
const CALLER: Partial<FigureProps> = {...castV2('coder')};
const FIRE: Partial<FigureProps> = {...castV2('engineer'), top: 'jacket', shirt: '#e8b923', pants: '#3d5a3a', hat: 'hardhat', hatColor: '#ffd23a',
  trim: '#d9d9d9'};
const RES: Partial<FigureProps> = {...castV2('resident')};
const FARMER: Partial<FigureProps> = {...castV2('farmer')};
const ORANGE = '#ff7a2f';
const CYAN = '#38f2e0';

const move = (t: number, at: number, before: FigurePose, after2: FigurePose) => (
  t < at ? {pose: before} : {pose: after2, fromPose: before, poseBlend: clamp01((t - at) / 0.35)}
);

/** rolling plains ground in front: red dirt and tan grass, with tufts */
const Ground: React.FC<{y: number; c?: string; burnt?: number}> = ({y, c = '#c8a25e', burnt = 0}) => (
  <g>
    <path d={`M0 ${y} Q540 ${y - 26} 1080 ${y} L1080 1920 L0 1920 Z`} fill={c} />
    <path d={`M0 ${y + 60} Q540 ${y + 30} 1080 ${y + 60} L1080 1920 L0 1920 Z`} fill={shade(c, 0.08)} />
    {Array.from({length: 26}, (_, i) => (
      <path key={i} d={`M${(i * 61) % 1080} ${y + 90 + (i * 83) % 700} q8 -34 16 0 M${(i * 61) % 1080 + 10} ${y + 90 + (i * 83) % 700} q10 -42 22 -6`}
        stroke={shade(c, 0.3)} strokeWidth={6} fill="none" strokeLinecap="round" />
    ))}
    {burnt > 0 && <path d={`M0 ${y + 10} Q540 ${y - 16} 1080 ${y + 10} L1080 1920 L0 1920 Z`} fill="#3a3036" opacity={burnt * 0.85} />}
  </g>
);

/** a galvanized stock tank */
const Tank: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ContactShadow x={0} y={4} w={360} opacity={0.35} />
    <rect x={-170} y={-120} width={340} height={120} rx={30} fill="#aeb8c6" stroke={line('#aeb8c6')} strokeWidth={6} />
    {[-110, -40, 30, 100].map((rx) => <rect key={rx} x={rx} y={-116} width={10} height={112} rx={5} fill="#cdd5e0" opacity={0.7} />)}
    <ellipse cx={0} cy={-120} rx={170} ry={26} fill="#6fa4d8" stroke={line('#aeb8c6')} strokeWidth={6} />
    <ellipse cx={-40} cy={-124} rx={60} ry={8} fill="#ffffff" opacity={0.5} />
  </g>
);

/** a dust devil: a tan funnel of rings, spinning; `p` grows it, `fade` collapses it */
const DustDevil: React.FC<{x: number; y: number; s?: number; frame: number; fade?: number}> = ({x, y, s = 1, frame, fade = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={1 - fade}>
    {Array.from({length: 9}, (_, i) => {
      const k = i / 8;
      const w = lerp(30, 170, k) * (1 - fade * 0.5);
      const dx = Math.sin(frame / 5 + i * 0.8) * 22 * k;
      return <ellipse key={i} cx={dx} cy={-k * 520 * (1 - fade * 0.6)} rx={w} ry={w * 0.28} fill="none" stroke={i % 2 ? '#d9b58a' : '#c49a6c'} strokeWidth={14 - k * 4}
        opacity={0.85 - k * 0.3} />;
    })}
    <ellipse cx={0} cy={0} rx={90} ry={20} fill="#c49a6c" opacity={0.5} />
  </g>
);

/** a hand-held tablet with a live view inside */
const Tablet: React.FC<{x: number; y: number; s?: number; children?: React.ReactNode; tilt?: number}> = ({x, y, s = 1, children, tilt = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${tilt}) scale(${s})`}>
    <rect x={-250} y={-170} width={500} height={340} rx={40} fill="#23273d" stroke={line('#23273d')} strokeWidth={8} />
    <g transform="translate(-225 -145)">
      <svg x={0} y={0} width={450} height={290} viewBox="0 0 900 520" preserveAspectRatio="none" overflow="hidden">{children}</svg>
    </g>
    <circle cx={-170} cy={-120} r={14} fill="#ff3b3b" />
    <path d="M-220 -150 L-80 -150" stroke="#ffffff" strokeWidth={8} strokeLinecap="round" opacity={0.2} />
  </g>
);

/** a rough outline of Texas in a w x h box, the Panhandle at the top left */
const TX: [number, number][] = [[0.28, 0], [0.47, 0], [0.47, 0.28], [0.62, 0.33], [0.75, 0.32], [0.86, 0.36], [0.92, 0.37], [0.93, 0.55], [0.98, 0.68],
  [0.9, 0.73], [0.78, 0.82], [0.7, 0.9], [0.66, 1], [0.58, 0.98], [0.5, 0.87], [0.44, 0.75], [0.37, 0.66], [0.3, 0.69], [0.22, 0.6], [0.12, 0.52],
  [0, 0.42], [0.28, 0.42]];
const txPath = (x: number, y: number, w: number, h: number) => `M${TX.map(([u, v]) => `${x + u * w} ${y + v * h}`).join(' L')} Z`;
const hash = (i: number, k: number) => {
  const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

export const SmokeWatchFilm: React.FC<FilmRenderProps> = ({board, shot, time_s, shot_s}) => {
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
  const room = (c1 = '#2b3a6e', c2 = '#18204a') => (
    <g>
      <defs>
        <linearGradient id="sw-room" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c1} /><stop offset="100%" stopColor={c2} /></linearGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#sw-room)" />
      <rect x={0} y={1480} width={1080} height={440} fill={shade(c2, 0.2)} />
      <rect x={0} y={1470} width={1080} height={20} fill={light(c1, 0.2)} opacity={0.5} />
    </g>
  );
  const desk = (y: number) => (
    <g>
      <rect x={-20} y={y} width={1120} height={60} rx={24} fill="#8a6a4a" stroke={line('#8a6a4a')} strokeWidth={6} />
      <rect x={0} y={y + 6} width={1080} height={14} rx={7} fill="#b08a62" />
    </g>
  );
  const bushes = (y: number, n = 5, s = 0.5) => (
    <g>{Array.from({length: n}, (_, i) => <Bush key={i} x={80 + i * (920 / Math.max(1, n - 1))} y={y + (i % 2) * 24} s={s + (i % 3) * 0.08} seed={i + 3}
      color="#7f9a4a" depth={0.25} frame={frame} />)}</g>
  );

  switch (shot.view) {
    // ------------------------------------------------------------------ s1 the hook
    case 'tower-hook': {
      const turn = ease(clamp01((t - 0.3) / 0.9));
      const lock = after(t - 1.2, 0.5);
      const look = lerp(-0.8, 0.85, turn);
      return svg(<g>
        <SmokeWisp x={500} y={1160} s={1.25} p={clamp01(0.45 + t / 2)} frame={frame} c="#8d8399" heat={0.6} />
        <Lookout x={250} y={1830} s={0.62} frame={frame} look={look} mood={lock > 0.5 ? 'squint' : turn > 0.3 ? 'scan' : 'calm'} beam={lock} beamDir={1} />
        <Ground y={1560} />
        <Tank x={700} y={1720} s={0.9} />
        {person(RANCH, 930, 1600, 1.8, move(t, 1.0, 'reach', 'point'), t > 1.0 ? 'surprised' : 'neutral', t > 0.8 ? 0.7 : -0.4, 4)}
        <Burst x={500} y={1000} p={(t - 1.3) / 0.6} color="#ffd34d" r={200} />
      </g>);
    }
    case 'eyes-close': {
      if (shot.scene_id === 's6') {
        const fl = since('s6-flag');
        const al = after(fl, 0.25);
        return svg(<g>
          <rect x={0} y={0} width={1080} height={1920} fill="#7fb6f0" />
          <Glow x={900} y={300} r={500} color="#fff3c4" opacity={0.6} />
          <Lookout x={540} y={900 + 1570 * 2.1} s={2.1} frame={frame} look={0.5} mood={al > 0.5 ? 'alert' : 'scan'} beam={0} />
          <g transform={`translate(780 ${lerp(1500, 1380, pop(fl, 0.4))})`} opacity={clamp01(fl * 4)}>
            <LitBox x={-200} y={-120} w={400} h={240} r={50} c="#2a2558" />
            <ScanBox x={-150} y={-90} w={300} h={180} lock={al} frame={frame} color={ORANGE} lockColor={ORANGE} />
            <SmokeWisp x={0} y={70} s={0.18} p={1} frame={frame} />
          </g>
          <Burst x={540} y={760} p={(fl - 0.05) / 0.5} color={ORANGE} r={420} />
        </g>);
      }
      const lk = since('s1-lock');
      const sq = after(lk, 0.3);
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#8fc0f2" />
        <rect x={0} y={1200} width={1080} height={720} fill="#d6b27a" />
        <Lookout x={420} y={980 + 1570 * 1.7} s={1.7} frame={frame} look={lerp(-0.4, 0.9, ease(clamp01(lk / 0.4)))} mood={sq > 0.5 ? 'squint' : 'scan'}
          beam={sq} beamDir={1} />
        <SmokeWisp x={980} y={1240} s={0.35} p={1} frame={frame} />
      </g>);
    }
    // ------------------------------------------------------------------ s2 the fire
    case 'burn-map': {
      const pn = since('s2-pin');
      const sc = 1.25 * after(since('s2-scar'), 6.0);
      const mx = 90, my = 430, mw = 900, mh = 700;
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#2b2650" />
        <rect x={mx} y={my} width={mw} height={mh} rx={60} fill="#e2c890" stroke={line('#e2c890')} strokeWidth={10} />
        {[1, 2, 3].map((i) => <path key={`v${i}`} d={`M${mx + i * mw / 4} ${my} L${mx + i * mw / 4} ${my + mh}`} stroke="#c9ab72" strokeWidth={5} />)}
        {[1, 2, 3, 4].map((i) => <path key={`h${i}`} d={`M${mx} ${my + i * mh / 5} L${mx + mw} ${my + i * mh / 5}`} stroke="#c9ab72" strokeWidth={5} />)}
        <path d={`M${mx} ${my + 380} Q${mx + 300} ${my + 300} ${mx + 460} ${my + 420} T${mx + mw} ${my + 340}`} stroke="#6fa4d8" strokeWidth={16} fill="none"
          strokeLinecap="round" />
        <defs><clipPath id="sw-map"><rect x={mx} y={my} width={mw} height={mh} rx={60} /></clipPath></defs>
        <g clipPath="url(#sw-map)"><g transform={`translate(${mx + 330} ${my + 520})`}>
          <path d={`M0 0 C${120 * sc} ${-160 * sc} ${520 * sc} ${-180 * sc} ${620 * sc} ${-60 * sc} C${700 * sc} ${80 * sc} ${520 * sc} ${300 * sc} ${300 * sc} ${260 * sc}
            C${120 * sc} ${360 * sc} ${-160 * sc} ${200 * sc} ${-120 * sc} ${60 * sc} Z`} fill="#33282e" opacity={0.85} />
          <path d={`M0 0 C${120 * sc} ${-160 * sc} ${520 * sc} ${-180 * sc} ${620 * sc} ${-60 * sc}`} stroke={ORANGE} strokeWidth={10} fill="none" opacity={sc}
            strokeLinecap="round" />
          {Array.from({length: 8}, (_, i) => <circle key={i} cx={(120 + i * 70) * sc} cy={(-150 + 20 * Math.sin(i + frame / 4)) * sc} r={10 + 6 * Math.sin(frame / 3 + i)}
            fill="#ffb347" opacity={sc * 0.8} />)}
        </g></g>
        <g transform={`translate(${mx + 330} ${my + 520 - 60 * (1 - pop(Math.max(since('s2-scar'), 0), 0.5))}) scale(${1 + 0.4 * Math.max(0, 1 - Math.abs(pn - 0.3) * 3)})`}>
          <path d="M0 0 C-30 -40 -36 -60 -36 -76 A36 36 0 1 1 36 -76 C36 -60 30 -40 0 0 Z" fill={ORANGE} stroke={line(ORANGE)} strokeWidth={6} />
          <circle cx={0} cy={-76} r={14} fill="#ffffff" />
        </g>
        <Word x={mx + 330} y={my + 640} t="STINNETT" size={54} c="#ffffff" />
        <Word x={540} y={my + 90} t="SMOKEHOUSE CREEK" size={70} c="#ff9a5a" op={clamp01(0.4 + sc * 3)} />
      </g>);
    }
    case 'charred-post': {
      const p = since('s2-post');
      return svg(<g>
        <Ground y={1300} c="#9a8060" burnt={0.6} />
        <Post x={760} y={1760} s={1.8} burnt={1} />
        <path d="M0 1260 Q400 1290 760 1230" stroke="#4a4048" strokeWidth={5} fill="none" />
        <path d="M0 1400 Q400 1440 760 1380" stroke="#4a4048" strokeWidth={5} fill="none" />
        {person(RANCH, 400, 1760 + 120 * after(p, 0.5), 1.9, p > 0 ? move(p, 0, 'think', 'reach') : {pose: 'think'}, p > 0.4 ? 'worried' : 'thinking', 0.6, 4)}
        <path d="M-20 1600 Q260 1520 560 1590 Q820 1640 1100 1580 L1100 1940 L-20 1940 Z" fill="#4a3d40" />
        <path d="M-20 1600 Q260 1520 560 1590 Q820 1640 1100 1580" stroke="#6a5a58" strokeWidth={14} fill="none" />
        {Array.from({length: 12}, (_, i) => <path key={i} d={`M${i * 95} 1640 q10 -60 20 -10`} stroke="#2a2228" strokeWidth={10} fill="none" strokeLinecap="round" />)}
        {Array.from({length: 7}, (_, i) => <circle key={i} cx={600 + (i * 97) % 400} cy={1200 - ((frame * 2 + i * 120) % 700)} r={6} fill="#6a6066" opacity={0.6} />)}
      </g>);
    }
    // ------------------------------------------------------------------ s3 the acres and the line
    case 'acre-counter': {
      const a = since('s3-acres');
      const k = after(a, 5.6);
      const n = Math.round(1058482 * after(a, 1.9));
      return svg(<g>
        <Ground y={1180} />
        {Array.from({length: 120}, (_, i) => {
          const row = Math.floor(i / 12), col = i % 12;
          const y0 = 1190 + Math.pow(row / 10, 1.6) * 730, y1 = 1190 + Math.pow((row + 1) / 10, 1.6) * 730;
          const wr = lerp(70, 150, row / 10);
          const xx = 540 + (col - 5.5) * wr;
          const order = Math.abs(col - 5.5) * 0.6 + (9 - row) * 0.4;
          const on = clamp01(k * 9 - order * 0.9);
          return <rect key={i} x={xx - wr / 2 + 3} y={y0 + 2} width={wr - 6} height={y1 - y0 - 4} rx={8} fill="#2e2630" opacity={on * 0.92} />;
        })}
        {person(RANCH, 200, 1688, 2.05, since('s3-land') > 0 ? move(since('s3-land'), 0, 'stand', 'crossed') : {pose: 'stand'}, since('s3-land') > 0 ? 'worried' : 'surprised', since('s3-land') > 0 ? -0.5 : 0.4, 4)}
        <Counter x={600} y={720} value={n.toLocaleString('en-US')} size={120} w={760} sub="ACRES" op={clamp01(a * 3)} />
      </g>);
    }
    case 'line-scar': {
      const l = since('s3-line');
      return svg(<g>
        <Ground y={1250} c="#9a8060" burnt={0.7} />
        {[160, 960].map((px, i) => (
          <g key={px}>
            <rect x={px - 18} y={560 + i * 30} width={36} height={760} rx={16} fill="#7a5a3a" stroke={line('#7a5a3a')} strokeWidth={6} />
            <rect x={px - 110} y={590 + i * 30} width={220} height={24} rx={12} fill="#6a4a2a" />
            {[-90, 90].map((ix) => <rect key={ix} x={px + ix - 10} y={560 + i * 30} width={20} height={34} rx={8} fill="#9fc6be" />)}
          </g>
        ))}
        <path d={`M70 578 Q560 ${700 + 10 * Math.sin(frame / 20)} 1050 608`} stroke="#2b2f45" strokeWidth={6} fill="none" />
        <path d={`M250 578 Q560 ${740 + 10 * Math.sin(frame / 20)} 870 608`} stroke="#2b2f45" strokeWidth={6} fill="none" />
        {person(LINE, 520, 1634, 1.9, l > 0 ? move(l, 0, 'point', 'think') : {pose: 'point'}, l > 0.3 ? 'worried' : 'thinking', 0.3, 5)}
      </g>);
    }
    // ------------------------------------------------------------------ s4 the build and the 57
    case 'tower-build': {
      const tm = since('s4-wake');
      const awake = tm > 0;
      const S = 1.15, base = 2560;
      const plat = base - 1500 * S + 30 * S;
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#88bdf2" opacity={0.25} />
        <Lookout x={560} y={base} s={S} frame={frame} look={awake ? Math.sin(frame / 25) * 0.6 : 0} mood={awake ? 'proud' : 'sleepy'} />
        {!awake && <g transform={`translate(660 ${plat - 250}) rotate(${Math.sin(frame / 3) * 40})`}><rect x={-8} y={-60} width={16} height={80} rx={8} fill="#7a8090" /></g>}
        {person(LINE, 740, plat, 0.75, awake ? move(tm, 0, 'reach', 'cheer') : {pose: 'reach'}, awake ? 'happy' : 'determined', -0.6, 5)}
        <Burst x={560} y={plat - 160} p={tm / 0.6} color={CYAN} r={320} />
        {awake && <Word x={560} y={plat + 300} t="Pano AI" size={64} c="#ffffff" op={clamp01(tm * 3)} />}
      </g>);
    }
    case 'station-map': {
      const mx = 60, my = 420, mw = 960, mh = 1000;
      const panX = mx + 0.28 * mw, panY = my, panW = 0.19 * mw, panH = 0.28 * mh;
      const c4 = since('s4-count');
      const c13 = since('s13-more');
      const pl = since('s13-plan');
      const late = shot.scene_id === 's13';
      const old = Array.from({length: 57}, (_, i) => [panX + 20 + hash(i, 1) * (panW - 40), panY + 20 + hash(i, 2) * (panH - 40)] as const);
      const fresh = Array.from({length: 68}, (_, i) => [mx + (0.15 + hash(i, 3) * 0.75) * mw, my + (0.35 + hash(i, 4) * 0.55) * mh] as const);
      const shown57 = late ? 57 : Math.min(57, Math.floor(clamp01(c4 / 1.8) * 57));
      const shown68 = late ? Math.min(68, Math.floor(clamp01(c13 / 2.0) * 68)) : 0;
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#2b2650" />
        <path d={txPath(mx, my, mw, mh)} fill="#e2c890" stroke={line('#e2c890')} strokeWidth={10} strokeLinejoin="round" />
        <rect x={panX} y={panY} width={panW} height={panH} fill={late ? 'none' : '#f3dcaa'} stroke={late ? 'none' : ORANGE} strokeWidth={6}
          strokeDasharray="18 12" />
        {old.slice(0, shown57).map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r={(late ? 9 : 13) + 3 * Math.sin(frame / 5 + i)} fill="#2a3160" stroke={CYAN} strokeWidth={4} />
          {!late && <circle cx={x} cy={y} r={14 + ((frame + i * 7) % 40)} fill="none" stroke={CYAN} strokeWidth={3} opacity={1 - ((frame + i * 7) % 40) / 40} />}</g>)}
        {fresh.slice(0, shown68).map(([x, y], i) => {
          const d = c13 - (i / 68) * 2.0;
          return <circle key={`f${i}`} cx={x} cy={y - 40 * (1 - clamp01(d / 0.25))} r={12} fill={ORANGE} stroke="#ffffff" strokeWidth={4} />;
        })}
        {!late && <Counter x={780} y={330} value={String(shown57)} size={150} w={420} sub="STATIONS" op={clamp01(c4 * 3)} />}
        {late && <Counter x={360} y={1640} value={`+${shown68}`} size={130} w={420} sub="PLANNED" op={clamp01(c13 * 3)} />}
        {late && pl > 0 && (
          <g transform={`translate(800 ${lerp(1200, 1760, ease(clamp01(pl / 0.5)))})`}>
            {Array.from({length: 7}, (_, i) => <ellipse key={i} cx={0} cy={-i * 34} rx={110} ry={30} fill={i % 2 ? '#ffcf3a' : '#f2b81e'}
              stroke={line('#ffcf3a')} strokeWidth={5} />)}
            <Word x={0} y={90} t="$490 MILLION" size={52} c="#ffffff" />
          </g>
        )}
        {late && <Burst x={800} y={1700} p={(pl - 0.5) / 0.5} color="#ffcf3a" r={220} />}
      </g>);
    }
    // ------------------------------------------------------------------ s5 the sweep and the ring
    case 'sweep-clock': {
      const sw = since('s5-sweep');
      const ang = (sw * 120) % 360;
      const cx = 540, cy = 1000, R = 430;
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#c8a25e" />
        <circle cx={cx} cy={cy} r={R + 40} fill="#d6b376" stroke={line('#d6b376')} strokeWidth={8} />
        {Array.from({length: 60}, (_, i) => {
          const a = (i / 60) * Math.PI * 2;
          const r0 = i % 5 === 0 ? R - 50 : R - 22;
          return <path key={i} d={`M${cx + Math.cos(a) * r0} ${cy + Math.sin(a) * r0} L${cx + Math.cos(a) * R} ${cy + Math.sin(a) * R}`} stroke="#7a5a3a"
            strokeWidth={i % 5 === 0 ? 10 : 5} strokeLinecap="round" />;
        })}
        {Array.from({length: 9}, (_, i) => <ellipse key={i} cx={cx + Math.cos(i * 2.3) * (180 + i * 22)} cy={cy + Math.sin(i * 2.3) * (180 + i * 22)} rx={22} ry={13}
          fill="#3a2a2a" />)}
        <path d={`M${cx} ${cy} L${cx + Math.cos((ang - 90) * Math.PI / 180) * R} ${cy + Math.sin((ang - 90) * Math.PI / 180) * R}
          A${R} ${R} 0 0 0 ${cx + Math.cos((ang - 130) * Math.PI / 180) * R} ${cy + Math.sin((ang - 130) * Math.PI / 180) * R} Z`} fill={CYAN} opacity={0.35} />
        <path d={`M${cx} ${cy} L${cx + Math.cos((ang - 90) * Math.PI / 180) * R} ${cy + Math.sin((ang - 90) * Math.PI / 180) * R}`} stroke={CYAN}
          strokeWidth={14} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={70} fill="#c9d2e4" stroke={line('#c9d2e4')} strokeWidth={6} />
        <circle cx={cx - 26} cy={cy} r={20} fill="#14183a" /><circle cx={cx + 26} cy={cy} r={20} fill="#14183a" />
        <circle cx={cx - 26} cy={cy} r={9} fill={CYAN} /><circle cx={cx + 26} cy={cy} r={9} fill={CYAN} />
        <Word x={800} y={430} t="360" size={130} c="#ffffff" op={clamp01(sw * 3)} />
        <Word x={800} y={500} t="EVERY MINUTE" size={46} c="#fff6e6" op={clamp01(sw * 3)} />
      </g>);
    }
    case 'ring-wide': {
      const r = since('s5-ring');
      const k = after(r, 1.2);
      const len = 3200;
      return svg(<g>
        <Ground y={1100} />
        <ellipse cx={600} cy={1240} rx={560} ry={140} fill="none" stroke={CYAN} strokeWidth={14} strokeDasharray={`${len * k} ${len}`} />
        <ellipse cx={600} cy={1240} rx={560} ry={140} fill={CYAN} opacity={0.08 * k} />
        {person(RANCH, 760, 1270, 0.9, move(t, 0.6, 'stand', 'wave'), k > 0.4 ? 'happy' : 'surprised', -0.8, 4)}
        <Lookout x={270} y={2350} s={1.05} frame={frame} look={0.7} mood="proud" beam={k} beamDir={1} />
      </g>);
    }
    // ------------------------------------------------------------------ s6 the camera's view
    case 'camera-view': {
      const sc = since('s6-scan');
      const fl = since('s6-flag');
      const box = after(fl, 0.25);
      return svg(<g>
        {room('#1d2448', '#10142e')}
        <g transform="translate(40 560) scale(1.111)">
          <rect x={-10} y={-10} width={920} height={540} rx={36} fill="#2b3157" />
          <svg x={0} y={0} width={900} height={520} viewBox="0 0 900 520" overflow="hidden">
            <PanoView frame={frame} smoke={since('s6-smoke') > 0 ? clamp01(0.15 + since('s6-smoke') / 1.2) : 0} sx={640} pan={sc * 40} />
            {fl > 0 && <ScanBox x={560} y={150} w={180} h={200} lock={box} frame={frame} color={ORANGE} lockColor={ORANGE} />}
          </svg>
          <circle cx={40} cy={40} r={14} fill="#ff3b3b" opacity={Math.floor(frame / 15) % 2 ? 1 : 0.3} />
          <text x={64} y={52} fontFamily="Inter, sans-serif" fontWeight={900} fontSize={34} fill="#ffffff">LIVE</text>
          <rect x={0} y={500} width={900 * ((sc / 3) % 1)} height={10} rx={5} fill={CYAN} />
        </g>
        <Lookout x={540} y={1400 + 1570 * 0.9} s={0.9} frame={frame} look={0.6} mood={box > 0.5 ? 'alert' : 'scan'} />
        <Burst x={760} y={830} p={(fl - 0.05) / 0.5} color={ORANGE} r={200} />
      </g>);
    }
    // ------------------------------------------------------------------ s7 and s11 the analyst
    case 'analyst-desk': {
      if (shot.scene_id === 's11') {
        const nd = since('s11-nod');
        return svg(<g>
          {room()}
          <Monitor x={700} y={960} s={0.62}>
            <rect width={900} height={520} fill="#0f1430" />
            {Array.from({length: 6}, (_, i) => (
              <g key={i} transform={`translate(${40 + (i % 3) * 280} ${40 + Math.floor(i / 3) * 240})`} opacity={i === 5 && nd > 0 ? 1 : 0.35}>
                <rect width={250} height={200} rx={24} fill={i === 5 ? ORANGE : '#6a7090'} />
                <text x={125} y={115} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={900} fontSize={34} fill="#ffffff">SMOKE?</text>
              </g>
            ))}
          </Monitor>
          {desk(1380)}
          {person(ANALYST, 290, 1723, 2.15, nd > 0 ? move(nd, 0, 'think', 'reach') : {pose: 'think'}, nd > 0.2 ? 'determined' : 'worried', 0.6, 6)}
        </g>);
      }
      const ln = since('s7-lean');
      return svg(<g>
        {room()}
        <Monitor x={700} y={960} s={0.62}>
          <PanoView frame={frame} smoke={1} sx={640} />
          <ScanBox x={560} y={150} w={180} h={200} lock={1} frame={frame} color={ORANGE} lockColor={ORANGE} />
        </Monitor>
        {desk(1380)}
        {person(ANALYST, 300 + 40 * after(ln, 0.6), 1980, 2.15, move(t, 0.5, 'stand', 'think'), 'thinking', 0.7, 6)}
      </g>);
    }
    case 'analyst-close': {
      const ck = since('s7-check');
      const ok = after(ck, 0.3);
      return svg(<g>
        {room()}
        <Monitor x={680} y={820} s={0.85} glow={0.3 + 0.3 * ok}>
          <PanoView frame={frame} smoke={1} sx={640} />
          <ScanBox x={560} y={150} w={180} h={200} lock={1} frame={frame} color={ok > 0.5 ? '#3ddc84' : ORANGE} lockColor={ok > 0.5 ? '#3ddc84' : ORANGE} />
          {ok > 0 && <path d={`M590 260 L640 ${310} L730 190`} stroke="#3ddc84" strokeWidth={22} fill="none" strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={260} strokeDashoffset={260 * (1 - ok)} />}
        </Monitor>
        {person(ANALYST, 250, 2007, 2.95, ck > 0 ? move(ck, 0, 'think', 'point') : {pose: 'think'}, ck > 0.2 ? 'proud' : 'thinking', 0.8, 6)}
        <Burst x={850} y={820} p={(ck - 0.1) / 0.5} color="#3ddc84" r={260} />
      </g>);
    }
    // ------------------------------------------------------------------ s8 the second tower and the cross
    case 'two-towers': {
      const sd = since('s8-second');
      const sw = ease(clamp01(sd / 0.8));
      const tx = 640, ty = 1180;
      return svg(<g>
        <Lookout x={880} y={1140} s={0.32} frame={frame} look={lerp(0.6, -1, sw)} mood={sw > 0.6 ? 'squint' : 'scan'} />
        <Ground y={1150} />
        <SmokeWisp x={tx} y={ty} s={0.4} p={1} frame={frame} />
        <path d={`M300 ${1820 - 1570 * 0.62} L${tx} ${ty - 40}`} stroke={CYAN} strokeWidth={10} strokeDasharray="26 16" strokeLinecap="round" />
        {sw > 0.5 && <path d={`M880 ${1140 - 1570 * 0.32} L${lerp(880, tx, (sw - 0.5) * 2)} ${lerp(1140 - 1570 * 0.32, ty - 40, (sw - 0.5) * 2)}`} stroke={CYAN}
          strokeWidth={10} strokeDasharray="26 16" strokeLinecap="round" />}
        <Lookout x={300} y={1820} s={0.62} frame={frame} look={0.9} mood="squint" />
        <Burst x={tx} y={ty - 40} p={(sd - 0.8) / 0.5} color={CYAN} r={160} />
      </g>);
    }
    case 'tri-map': {
      const cr = since('s8-cross');
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#2b2650" />
        <TriMap x={70} y={460} w={940} h={1080} frame={frame} a={clamp01(0.5 + t / 1.2)} b={clamp01(t / 1.4)} pin={clamp01(cr / 0.5)} />
        <SmokeWisp x={70 + 0.56 * 940} y={460 + 0.3 * 1080 - 90} s={0.12} p={clamp01(1 - cr)} frame={frame} />
        {cr > 0 && [0, 1, 2].map((i) => { const q = ((frame / 30) * 0.8 + i / 3) % 1; return <circle key={i} cx={70 + 0.56 * 940} cy={460 + 0.3 * 1080 - 100} r={40 + q * 260} fill="none" stroke={ORANGE} strokeWidth={10 * (1 - q)} opacity={1 - q} />; })}
        
      </g>);
    }
    // ------------------------------------------------------------------ s9 the call and the truck
    case 'dispatch-call': {
      const c = since('s9-call');
      return svg(<g>
        {room('#24305e', '#141a3c')}
        {Array.from({length: 3}, (_, i) => (
          <g key={i} transform={`translate(${200 + i * 340} 640) scale(0.32)`}>
            <rect x={-470} y={-290} width={940} height={580} rx={42} fill="#232842" />
            <g transform="translate(-450 -270)"><svg width={900} height={520} viewBox="0 0 900 520"><PanoView frame={frame} smoke={i === 1 ? 1 : 0} sx={600} pan={i * 200} /></svg></g>
          </g>
        ))}
        {desk(1380)}
        {(() => {
          const fx = 330, sc = 2.15, fy = 1723;
          const up = c > 0.45;
          const hd = figureHands('think');
          const hand = hd.l.y < hd.r.y ? hd.l : hd.r;
          const hx = fx + hand.x * sc, hy = fy + hand.y * sc;
          const bx = up ? hx : 760, by = up ? hy : 1240;
          return (
            <g>
              <PhoneRing x={760} y={1150} s={1.1} frame={frame} ring={c > 0 && !up ? 1 : 0} text={up ? 'LIVE' : '911'} />
              <path d={`M760 1300 Q${(bx + 760) / 2} ${Math.max(by, 1300) + 160} ${bx} ${by + 40}`} stroke="#2b2f45" strokeWidth={8} fill="none" />
              {person(CALLER, fx, fy, sc, up ? move(c, 0.45, 'reach', 'think') : (c > 0 ? {pose: 'reach'} : {pose: 'stand'}), c > 0.2 ? 'determined' : 'neutral', 0.5, 7)}
              <g transform={`translate(${bx} ${by}) rotate(${up ? -30 : 0})`}>
                <rect x={-34} y={-90} width={68} height={180} rx={30} fill="#2b2f45" stroke={line('#2b2f45')} strokeWidth={6} />
                <rect x={-22} y={-80} width={44} height={40} rx={14} fill="#4a5070" />
              </g>
            </g>
          );
        })()}
      </g>);
    }
    case 'truck-roll': {
      const r = since('s9-roll');
      const k = ease(clamp01(r / 1.6));
      return svg(<g>
        <Pumpjack x={180} y={1130} s={0.45} frame={frame} depth={0.4} />
        <Ground y={1180} />
        {bushes(1260, 4, 0.45)}
        <BrushTruck x={lerp(-200, 420, k)} y={1620} s={0.72} frame={frame} lights roll={r * 1.4} dust={k} />
        {person(FIRE, 820, 1652, 1.95, {pose: 'hold'}, 'determined', -0.4, 8, {
          holding: <Tablet x={0} y={-10} s={0.32}><PanoView frame={frame} smoke={1} sx={640} /></Tablet>})}
      </g>);
    }
    // ------------------------------------------------------------------ s10 the test
    case 'tablet-close': {
      const sh = since('s10-shrug');
      const sw = after(sh, 1.0);
      const card = (i: number, label: string, c: string, gone: number) => (
        <g key={i} transform={`translate(${lerp(0, -900, gone)} ${i * 150}) rotate(${(i % 2 ? 1 : -1) * 2})`} opacity={1 - gone}>
          <rect x={60} y={40} width={780} height={120} rx={36} fill={c} />
          <text x={450} y={120} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={900} fontSize={60} fill="#ffffff">{label}</text>
        </g>
      );
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#88bdf2" />
        <rect x={0} y={1260} width={1080} height={660} fill="#c8a25e" />
        <Tablet x={620} y={700} s={1.4} tilt={-4}>
          <rect width={900} height={520} fill="#0f1430" />
          {card(0, 'NOTHING', '#8d8fa6', clamp01(sw * 1.6))}
          {card(1, 'SMOKE? CONFIRMED', ORANGE, 0)}
          {card(2, 'NOTHING', '#8d8fa6', clamp01(sw * 1.6 - 0.3))}
        </Tablet>
        <Burst x={620} y={700} p={(sh - 0.9) / 0.5} color={ORANGE} r={300} />
        {person(FIRE, 230, 1901, 2.65, sh > 0 ? move(sh, 0, 'think', 'point') : {pose: 'think'}, sh > 0.9 ? 'determined' : 'smug', 0.8, 8)}
      </g>);
    }
    case 'devil-field': {
      const d = since('s10-devil');
      const lockOn = after(d - 0.7, 0.3);
      return svg(<g>
        <Lookout x={980} y={1190} s={0.3} frame={frame} look={-0.9} mood="alert" beam={0.7} beamDir={-1} />
        <Ground y={1180} c="#c9a866" />
        {Array.from({length: 6}, (_, i) => <path key={i} d={`M0 ${1260 + i * 60} Q540 ${1230 + i * 60} 1080 ${1260 + i * 60}`} stroke="#b08a4c" strokeWidth={8}
          fill="none" opacity={0.6} />)}
        <DustDevil x={lerp(640, 760, after(d, 2.4))} y={1170} s={0.95} frame={frame} />
        {lockOn > 0 && <ScanBox x={lerp(640, 760, after(d, 2.4)) - 190} y={580} w={380} h={620} lock={lockOn} frame={frame} color={ORANGE} lockColor={ORANGE} />}
        {person(FARMER, 250, 1688, 2.05, move(t, 0.5, 'think', 'point'), t > 0.5 ? 'surprised' : 'thinking', 0.8, 10)}
      </g>);
    }
    // ------------------------------------------------------------------ s11 the pile of alerts
    case 'card-pile': {
      const pl = since('s11-pile');
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#8a6a4a" />
        <rect x={0} y={0} width={1080} height={1920} fill="#b08a62" opacity={0.35} />
        {Array.from({length: 9}, (_, i) => {
          const d = pl - i * 0.16;
          if (d < 0) return null;
          const k = ease(clamp01(d / 0.35));
          const grey = i < 8 ? after(d - 0.6, 0.6) : 0;
          return (
            <g key={i} transform={`translate(${lerp(1300, 520 + (i % 3) * 30 - 30, k)} ${700 + i * 50}) rotate(${(i % 2 ? 1 : -1) * (4 + i)})`}>
              <LitBox x={-280} y={-140} w={560} h={280} r={44} c={grey > 0.5 ? '#8d8fa6' : ORANGE} />
              <text x={0} y={20} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={900} fontSize={60} fill="#ffffff">
                {grey > 0.5 ? 'NOTHING' : 'SMOKE?'}</text>
            </g>
          );
        })}
        {person(FIRE, 880, 1741, 2.2, {pose: 'think'}, pl > 1 ? 'worried' : 'thinking', -0.7, 8)}
      </g>);
    }
    // ------------------------------------------------------------------ s12 the town
    case 'town-gaze': {
      const gz = since('s12-town');
      const sweep = ease(clamp01(gz / 1.6));
      return svg(<g>
        <Lookout x={960} y={1300} s={0.45} frame={frame} look={lerp(-0.2, -1, sweep)} mood="scan" beam={0.6} beamDir={-1} />
        <Ground y={1220} />
        <g transform="translate(560 1260)">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <g key={i} transform={`translate(${(i - 2.5) * 120} 0)`}>
              <rect x={-50} y={-90 - (i % 3) * 30} width={100} height={90 + (i % 3) * 30} rx={14}
                fill={['#e6d3b0', '#d7a07a', '#f0e6d0', '#c98a6a', '#e0c49a', '#d9b8a0'][i]} stroke={line('#d7a07a')} strokeWidth={5} />
              <path d={`M-60 ${-90 - (i % 3) * 30} L0 ${-140 - (i % 3) * 30} L60 ${-90 - (i % 3) * 30} Z`} fill="#b8604a" />
            </g>
          ))}
          <rect x={300} y={-300} width={20} height={300} rx={8} fill="#bfc6d4" />
          <rect x={360} y={-300} width={20} height={300} rx={8} fill="#a9b0c0" />
          <ellipse cx={340} cy={-320} rx={90} ry={56} fill="#d0d6e2" stroke={line('#d0d6e2')} strokeWidth={6} />
        </g>
        <path d={`M880 ${1300 - 1570 * 0.45} L${lerp(780, 0, sweep)} 1150`} stroke={CYAN} strokeWidth={8} strokeDasharray="22 14" />
        {person(RES, 230, 1688, 2.05, move(t, 0.8, 'stand', 'point'), t > 0.8 ? 'surprised' : 'thinking', 0.8, 9)}
      </g>);
    }
    case 'pixel-view': {
      const px = since('s12-pixel');
      const k = after(px, 0.6);
      return svg(<g>
        {room('#1d2448', '#10142e')}
        <g transform="translate(40 520) scale(1.111)">
          <rect x={-10} y={-10} width={920} height={540} rx={36} fill="#2b3157" />
          <svg x={0} y={0} width={900} height={520} viewBox="0 0 900 520" overflow="hidden">
            <PanoView frame={frame} smoke={0} town={1} pixel={k} pan={40} />
          </svg>
        </g>
        <Lookout x={540} y={1450 + 1570 * 0.9} s={0.9} frame={frame} look={lerp(0.3, -0.8, k)} mood={k > 0.4 ? 'sleepy' : 'scan'} />
        {k > 0.4 && <Word x={540} y={1240} t="PIXELATED" size={70} c="#ffffff" op={k} />}
      </g>);
    }
    // ------------------------------------------------------------------ s13 the bill
    case 'bill-table': {
      const b = since('s13-bill');
      const flip = ease(clamp01(b / 0.5));
      const st = pop(b - 0.6, 0.4, 2.2);
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#f2dcc0" />
        <rect x={560} y={300} width={440} height={520} rx={40} fill="#9fc6f2" stroke="#c9a37a" strokeWidth={24} />
        <rect x={576} y={640} width={408} height={160} fill="#c07848" />
        <rect x={576} y={600} width={408} height={50} fill="#d9a070" />
        <path d="M780 300 L780 820 M560 560 L1000 560" stroke="#c9a37a" strokeWidth={16} />
        <rect x={0} y={1380} width={1080} height={540} fill="#c79a6a" />
        <rect x={0} y={1370} width={1080} height={26} fill="#a87a4a" />
        {person(RES, 260, 1741, 2.2, {pose: 'hold'}, st > 0.5 ? 'surprised' : 'thinking', 0.6, 9)}
        <g transform={`translate(720 930) scale(${lerp(0.2, 1, flip)} 1) rotate(-6)`}>
          <LitBox x={-200} y={-260} w={400} h={520} r={30} c="#ffffff" />
          {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={-150} y={-180 + i * 60} width={i === 0 ? 200 : 300} height={20} rx={10} fill="#c9cede" />)}
          <text x={-150} y={-200} fontFamily="Inter, sans-serif" fontWeight={900} fontSize={40} fill="#2b2f45">POWER BILL</text>
        </g>
        {st > 0 && (
          <g transform={`translate(740 1010) rotate(-14) scale(${st})`}>
            <rect x={-190} y={-70} width={380} height={140} rx={30} fill="none" stroke="#e2574c" strokeWidth={14} />
            <text x={0} y={26} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={900} fontSize={76} fill="#e2574c">NOT YET</text>
          </g>
        )}
      </g>);
    }
    // ------------------------------------------------------------------ s14 the button
    case 'hose-out': {
      const o = since('s14-out');
      const k = after(o, 4.2);
      return svg(<g>
        <Ground y={1180} />
        <ellipse cx={800} cy={1560} rx={60 + 140 * k} ry={20 + 40 * k} fill="#2e2830" opacity={0.9} />
        <SmokeWisp x={800} y={1550} s={0.75} p={clamp01(1 - k)} frame={frame} heat={clamp01(1 - k * 1.3)} c="#8d8399" />
        {since('s14-steam') > 0 && Array.from({length: 7}, (_, i) => { const q = clamp01(since('s14-steam') / 1.6); return <circle key={`sm${i}`} cx={800 + Math.cos(i) * 140 * q} cy={1500 - q * 300 - i * 30} r={50 + q * 60} fill="#ffffff" opacity={0.7 * (1 - q)} />; })}
        {o > 0 && k < 1 && Array.from({length: 4}, (_, i) => <circle key={`st${i}`} cx={760 + i * 30} cy={1460 - ((frame * 5 + i * 60) % 240)} r={30 + i * 6}
          fill="#ffffff" opacity={0.35 * (1 - k)} />)}
        {(() => {
          const fx = 300, sc = 2.0, fy = Math.round(960 + 355 * sc);
          const h = figureHands('reach');
          const hx = fx + ((h.l.x + h.r.x) / 2) * sc, hy = fy + ((h.l.y + h.r.y) / 2) * sc;
          return (
            <g>
              <path d={`M${hx - 30} ${hy + 10} Q${hx - 180} ${hy + 320} 120 1920`} stroke="#c0392b" strokeWidth={26} fill="none" strokeLinecap="round" />
              {Array.from({length: 18}, (_, i) => {
                const u = ((frame / 30) * 2 + i / 18) % 1;
                return <circle key={i} cx={lerp(hx + 150, 790, u)} cy={lerp(hy + 40, 1540, u) - Math.sin(u * Math.PI) * 180} r={12} fill="#7cc4ff"
                  opacity={0.85} />;
              })}
              {person(FIRE, fx, fy, sc, {pose: 'reach'}, k > 0.8 ? 'happy' : 'determined', 0.8, 8)}
              <g transform={`translate(${hx} ${hy}) rotate(18)`}>
                <rect x={-40} y={-24} width={110} height={48} rx={20} fill="#c0392b" stroke={line('#c0392b')} strokeWidth={6} />
                <rect x={60} y={-20} width={70} height={40} rx={14} fill="#d9b44a" stroke={line('#d9b44a')} strokeWidth={6} />
                <rect x={120} y={-14} width={24} height={28} rx={8} fill="#8a6a2a" />
              </g>
            </g>
          );
        })()}
      </g>);
    }
    case 'tower-end': {
      const w = since('s14-watch');
      const sweep = (Math.max(0, w) / 2.0) % 1;
      const k = ease(clamp01(t / 2.2));
      return svg(<g>
        <Ground y={1400} />
        <SmokeWisp x={880} y={1410} s={0.55} p={1} frame={frame} c="#8d8399" heat={0.6} />
        <path d="M0 1700 Q500 1500 880 1420" stroke="#d9c08a" strokeWidth={60} fill="none" opacity={0.6} />
        <BrushTruck x={lerp(120, 560, k)} y={lerp(1760, 1560, k)} s={lerp(0.62, 0.42, k)} frame={frame} lights roll={t * 1.5} dust={0.9} />
        <Lookout x={160} y={2700} s={1.25} frame={frame} look={0.8} mood="calm" sweep={sweep} beam={0.6} beamDir={1} />
      </g>);
    }
    case 'behind-head': {
      const fl = since('s6-flag');
      const box = after(fl, 0.25);
      return svg(<g>
        <SmokeWisp x={680} y={1150} s={0.7} p={1} frame={frame} c="#8d8399" heat={0.5} />
        {fl > 0 && <ScanBox x={560} y={760} w={300} h={380} lock={box} frame={frame} color={ORANGE} lockColor={ORANGE} />}
        <path d={`M420 1560 L560 760 L860 760 L640 1640 Z`} fill={CYAN} opacity={0.12} />
        <Burst x={710} y={950} p={(fl - 0.05) / 0.5} color={ORANGE} r={240} />
      </g>);
    }
    case 'firehouse-nod': {
      const nd = since('s11-nod');
      return svg(<g>
        {room('#7a3a32', '#4a2226')}
        <rect x={560} y={420} width={460} height={1060} rx={40} fill="#3a2a2e" />
        <BrushTruck x={1020} y={1470} s={0.6} frame={frame} />
        <rect x={80} y={700} width={300} height={22} rx={11} fill="#a87a4a" />
        <Tablet x={230} y={640} s={0.4}><PanoView frame={frame} smoke={1} sx={640} /></Tablet>
        {person(FIRE, 420, 1723, 2.15, nd > 0 ? move(nd, 0, 'think', 'reach') : {pose: 'think'}, nd > 0.2 ? 'determined' : 'thinking', 0.4, 8)}
      </g>);
    }
    case 'new-towers': {
      const m = since('s13-more');
      const pl = since('s13-plan');
      const n = Math.min(68, Math.floor(clamp01(m / 2.0) * 68));
      return svg(<g>
        <Ground y={1150} />
        <path d="M500 1150 L580 1150 L900 1920 L180 1920 Z" fill="#8a8a96" />
        <path d="M540 1160 L540 1920" stroke="#f2e6c8" strokeWidth={10} strokeDasharray="40 40" />
        {Array.from({length: Math.min(n, 14)}, (_, i) => {
          const k = i / 14;
          const side = i % 2 ? 1 : -1;
          const x = 540 + side * lerp(80, 460, 1 - k);
          const y = lerp(1700, 1170, k);
          const rise = ease(clamp01((m - (i / 68) * 2.0) / 0.4));
          return <g key={i} transform={`translate(0 ${(1 - rise) * 200})`} opacity={rise}>
            <g transform={`translate(${x} ${y}) scale(${lerp(1.0, 0.2, k)})`}>
              <ContactShadow x={0} y={4} w={120} opacity={0.3} />
              <rect x={-10} y={-260} width={20} height={260} rx={10} fill="#c9d2e4" />
              <ellipse cx={0} cy={-300} rx={62} ry={54} fill="#f3f5fb" stroke={line('#f3f5fb')} strokeWidth={6} />
              <circle cx={side * -14} cy={-296} r={26} fill="#14183a" /><circle cx={side * -16} cy={-296} r={13} fill={CYAN} />
            </g>
          </g>;
        })}
        {person(LINE, 860, 1422, 1.3, move(Math.max(m, 0), 0.3, 'stand', 'point'), 'happy', -0.5, 5)}
        <Counter x={300} y={620} value={`+${n}`} size={130} w={420} sub="CAMERAS" op={clamp01(m * 3)} />
        {pl > 0 && (
          <g transform={`translate(300 ${lerp(700, 1080, ease(clamp01(pl / 0.5)))})`}>
            {Array.from({length: 6}, (_, i) => <ellipse key={i} cx={0} cy={-i * 30} rx={100} ry={28} fill={i % 2 ? '#ffcf3a' : '#f2b81e'}
              stroke={line('#ffcf3a')} strokeWidth={5} />)}
          </g>
        )}
        <Burst x={300} y={1040} p={(pl - 0.5) / 0.5} color="#ffcf3a" r={200} />
      </g>);
    }
    case 'stinnett-close': {
      const pn = since('s2-pin');
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#e2c890" />
        {[0, 1, 2, 3].map((i) => <path key={i} d={`M${i * 360} 0 L${i * 360} 1920`} stroke="#c9ab72" strokeWidth={8} />)}
        {[0, 1, 2, 3, 4].map((i) => <path key={`h${i}`} d={`M0 ${i * 420} L1080 ${i * 420}`} stroke="#c9ab72" strokeWidth={8} />)}
        <path d="M0 560 Q400 420 700 620 T1080 520" stroke="#6fa4d8" strokeWidth={36} fill="none" strokeLinecap="round" />
        <path d={`M300 900 C${500 + 300 * after(pn, 1.4)} 640 ${900 + 200 * after(pn, 1.4)} 700 1100 820 L1100 1500 C800 ${1300 + 60 * Math.sin(frame / 9)} 500 1250 300 900 Z`}
          fill="#33282e" opacity={0.9} />
        {Array.from({length: 10}, (_, i) => <circle key={i} cx={420 + i * 70} cy={800 + Math.sin(i + frame / 5) * 40 - i * 4} r={12 + 6 * Math.sin(frame / 3 + i)}
          fill="#ffb347" opacity={0.85} />)}
        <g transform={`translate(330 ${900 - 90 * (1 - pop(pn, 0.5))}) scale(2.2)`}>
          <path d="M0 0 C-30 -40 -36 -60 -36 -76 A36 36 0 1 1 36 -76 C36 -60 30 -40 0 0 Z" fill={ORANGE} stroke={line(ORANGE)} strokeWidth={4} />
          <circle cx={0} cy={-76} r={14} fill="#ffffff" />
        </g>
        <g transform="translate(330 1010)">
          <rect x={-200} y={-60} width={400} height={96} rx={48} fill="#2b2650" />
          <Word x={0} y={10} t="STINNETT" size={60} c="#ffffff" />
        </g>
      </g>);
    }
    case 'smoke-close': {
      const sm = since('s6-smoke');
      const p = sm > 0 ? clamp01(0.2 + sm / 1.4) : 0.05;
      return svg(<g>
        <Ground y={1250} c="#c8a25e" />
        <SmokeWisp x={520} y={1420} s={1.5} p={p} frame={frame} c="#8d8399" heat={clamp01(sm)} />
        {Array.from({length: 14}, (_, i) => (
          <path key={i} d={`M${i * 82 - 20} 1920 q20 -${180 + (i % 3) * 60} 46 -${260 + (i % 4) * 40} M${i * 82 + 10} 1920 q30 -${140 + (i % 2) * 70} 70 -${200 + (i % 3) * 30}`}
            stroke={i % 2 ? '#b0894a' : '#9a7a3e'} strokeWidth={16} fill="none" strokeLinecap="round" />
        ))}
        {since('s6-flag') > 0 || sm > 2.4 ? <ScanBox x={300} y={500} w={480} h={900} lock={0} frame={frame} color={ORANGE} lockColor={ORANGE} /> : null}
      </g>);
    }
    case 'bill-close': {
      const k = t;
      const st = pop(k - 0.35, 0.35, 2.4);
      const skin = (RES.skin as string) || '#c98c5e';
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#c79a6a" />
        <rect x={0} y={0} width={1080} height={1920} fill="#a87a4a" opacity={0.25} />
        <g transform="translate(540 820) rotate(-4)">
          <LitBox x={-380} y={-460} w={760} h={920} r={40} c="#ffffff" />
          <text x={-300} y={-340} fontFamily="Inter, sans-serif" fontWeight={900} fontSize={70} fill="#2b2f45">POWER BILL</text>
          {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={-300} y={-260 + i * 90} width={i % 2 ? 420 : 560} height={28} rx={14} fill="#c9cede" />)}
          {[-1, 1].map((side) => <ellipse key={side} cx={side * 400} cy={260} rx={80} ry={110} fill={skin} stroke={line(skin)} strokeWidth={6} />)}
        </g>
        {st > 0 && (
          <g transform={`translate(560 760) rotate(-14) scale(${lerp(1.6, 1, clamp01(st))})`} opacity={clamp01(st * 2)}>
            <rect x={-300} y={-110} width={600} height={220} rx={44} fill="none" stroke="#e2574c" strokeWidth={22} />
            <text x={0} y={42} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={900} fontSize={128} fill="#e2574c">NOT YET</text>
          </g>
        )}
        <Burst x={560} y={760} p={(k - 0.6) / 0.5} color="#e2574c" r={360} />
      </g>);
    }
    case 'steam-close': {
      const sm = since('s14-steam');
      const q = clamp01(sm / 2.2);
      return svg(<g>
        <Ground y={1100} />
        <ellipse cx={680} cy={1300} rx={360} ry={110} fill="#2e2830" opacity={0.92} />
        <ellipse cx={600} cy={1270} rx={120} ry={22} fill="#7cc4ff" opacity={0.35} />
        <SmokeWisp x={700} y={1290} s={0.9} p={clamp01(0.35 - q * 0.35)} frame={frame} c="#8d8399" heat={clamp01(0.4 - q)} />
        {sm > 0 && Array.from({length: 9}, (_, i) => {
          const u = ((frame / 30) * 0.5 + i / 9) % 1;
          return <circle key={i} cx={640 + Math.sin(i * 2.1) * 120 + u * 60} cy={1250 - u * 600} r={50 + u * 90} fill="#ffffff" opacity={0.75 * (1 - u) * (1 - q * 0.5)} />;
        })}
        {Array.from({length: 14}, (_, i) => {
          const u = ((frame / 30) * 2 + i / 14) % 1;
          return <circle key={`w${i}`} cx={lerp(380, 660, u)} cy={lerp(1040, 1270, u) - Math.sin(u * Math.PI) * 120} r={12} fill="#7cc4ff" opacity={0.85 * (1 - q)} />;
        })}
        {person(FIRE, 180, 2025, 3.0, {pose: 'reach'}, q > 0.4 ? 'happy' : 'determined', 0.8, 8)}
      </g>);
    }
    case 'tower-low': {
      const sw = ease(clamp01(t / 1.0));
      return svg(<g>
        <Ground y={1650} />
        <SmokeWisp x={900} y={1660} s={0.5} p={1} frame={frame} c="#8d8399" heat={0.6} />
        <Lookout x={470} y={2500} s={1.15} frame={frame} look={lerp(-0.6, 0.95, sw)} mood={sw > 0.8 ? 'squint' : 'scan'} beam={sw} beamDir={1} />
        {Array.from({length: 12}, (_, i) => <path key={i} d={`M${i * 95 - 10} 1920 q18 -${120 + (i % 3) * 50} 40 -${190 + (i % 4) * 30}`} stroke="#9a7a3e"
          strokeWidth={14} fill="none" strokeLinecap="round" />)}
      </g>);
    }
    case 'sweep-eye': {
      const a = (t * 2.4) % (Math.PI * 2);
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#7fb6f0" />
        <circle cx={540} cy={820} r={460} fill="none" stroke={CYAN} strokeWidth={10} strokeDasharray="30 22" opacity={0.6}
          transform={`rotate(${t * 140} 540 820)`} />
        <ellipse cx={540} cy={820} rx={330} ry={300} fill="#dfe4ef" stroke={line('#f3f5fb')} strokeWidth={12} />
        <ellipse cx={510} cy={790} rx={290} ry={260} fill="#f3f5fb" />
        <ellipse cx={420} cy={660} rx={90} ry={34} fill="#ffffff" />
        <circle cx={540 + Math.cos(a) * 90} cy={820 + Math.sin(a) * 70} r={150} fill="#14183a" />
        <circle cx={540 + Math.cos(a) * 100} cy={820 + Math.sin(a) * 78} r={80} fill={CYAN} />
        <circle cx={510 + Math.cos(a) * 100} cy={790 + Math.sin(a) * 78} r={26} fill="#ffffff" />
        <path d={`M${540 + Math.cos(a) * 470} ${820 + Math.sin(a) * 470} A470 470 0 0 0 ${540 + Math.cos(a - 0.9) * 470} ${820 + Math.sin(a - 0.9) * 470}`}
          stroke={CYAN} strokeWidth={26} fill="none" strokeLinecap="round" />
      </g>);
    }
    case 'far-tower-close': {
      const sd = since('s8-second');
      const sw = ease(clamp01((sd - 0.6) / 0.8));
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#8fc0f2" />
        <rect x={0} y={1300} width={1080} height={620} fill="#d6b27a" />
        <Lookout x={620} y={900 + 1570 * 1.5} s={1.5} frame={frame} look={lerp(0.7, -1, sw)} mood={sw > 0.7 ? 'squint' : 'scan'} beam={sw} beamDir={-1} />
      </g>);
    }
    default:
      return svg(<g><Lookout x={540} y={1800} s={0.8} frame={frame} /></g>);
  }
};
