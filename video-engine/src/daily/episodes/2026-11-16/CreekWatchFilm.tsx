import React from 'react';
import {useCurrentFrame} from 'remotion';
import type {FilmRenderProps} from '../../../modern/types';
import {actionWindows, type DirectedScene} from '../../../lib/direction';
import {Figure, castV2, figureHands, type FigureEmotion, type FigurePose, type FigureProps} from '../../../look/Figure';
import {Burst, ContactShadow, GlassPanel, Glow, clamp01, ease, easeOutBack, lerp} from '../../../look/Kit';
import {Oak, Pine} from '../../../look/regions';
import {BrickRanchV2, PorchGliderV2} from '../../../look/shelf/homeplace';
import {StreamGaugeV2} from '../../../look/shelf/water';
import {Bolt, Cumulus, Rain} from '../../../look/shelf/skies';
import {line, light, shade} from '../../../look/color';
import {FONT} from '../../../lib/type';
import {BigNumber, Creek, FloodSensor, WatershedMap, type DotState} from './parts';
import {Keys, LawnChair, Mug, Phone, SoilSponge, Tag} from './props';

/**
 * creek-watch-1116 (November 16th, 2026): "The eighth watcher". In Friendswood and League City the
 * Galveston County Consolidated Drainage District switched on seven radar flood sensors. AI tools
 * combine their readings with rain, gauge, weather and soil data to help predict how a flood could
 * develop, on a colour-coded public map with text alerts. The choice to stay or go stays human.
 *
 * The hero is the creek sensor with a face (parts.tsx FloodSensor). The person is a Clear Creek
 * resident, illustrative, from the v2 cast. The throughline is her lawn chair: on the bank with her
 * mug, empty in the rain, folded by the door beside her keys, back on the bank with a green phone.
 * Nobody is ever drawn in water and the creek never leaves its banks. Disclosed illustration.
 */
const RES: Partial<FigureProps> = castV2('resident');
const RES_SKIN = String(RES.skin);
const NEIGHBOR: Partial<FigureProps> = {...castV2('teacher')};
const JONES: Partial<FigureProps> = {...castV2('technician'), top: 'polo', shirt: '#3d6a5a'};
const BURKETT: Partial<FigureProps> = {...castV2('executive')};
const CREW: Partial<FigureProps> = {...castV2('hydrologist')};
const BAILEY: Partial<FigureProps> = {...castV2('engineer'), hat: 'none', top: 'jacket', shirt: '#2f6fb8'};

/** a pose change that travels from the last pose over 0.35 s */
const move = (t: number, at: number, before: FigurePose, after: FigurePose) => (
  t < at ? {pose: before} : {pose: after, fromPose: before, poseBlend: clamp01((t - at) / 0.35)}
);

const SKY_GREY = '#9fb2d8';
const wobble = (frame: number, k = 1) => Math.sin(frame / 30 * 2.4) * 4 * k;

/** a big map panel in a glass frame, the county seen from above */
const MapPanel: React.FC<{x?: number; y?: number; w?: number; h?: number; children: React.ReactNode; tint?: string}> = ({
  x = 60, y = 430, w = 960, h = 760, children, tint = '#1b2350'}) => (
  <GlassPanel x={x} y={y} w={w} h={h} r={56} tint={tint}>{children}</GlassPanel>
);

/** the seven sensor positions on the watershed map, in 0..1 of the map box; the last is Dickinson Bayou */
const SEVEN: [number, number][] = [[0.12, 0.27], [0.24, 0.24], [0.36, 0.36], [0.5, 0.41], [0.62, 0.35], [0.8, 0.26], [0.5, 0.86]];

export const CreekWatchFilm: React.FC<FilmRenderProps> = ({board, shot, time_s, shot_s}) => {
  const frame = useCurrentFrame();
  const W = actionWindows(board.scenes as DirectedScene[]);
  const p = (id: string) => {
    const w = W[id];
    if (!w) return 0;
    const q = clamp01((time_s - w.start) / Math.max(0.2, w.end - w.start));
    return q * q * (3 - 2 * q);
  };
  const since = (id: string) => (W[id] ? time_s - W[id].start : -1);
  const t = shot_s;
  const PANEL_VIEWS = ['watershed-split', 'feed-pipes', 'soil-close', 'kitchen-phone',
    'phone-map', 'level-slider', 'door-keys', 'route-phone', 'harvey-post'];
  const hz = 960 + ({wide: 1, split: 1.04, medium: 1.08, close: 1.18, detail: 1.3, overhead: 1}[shot.framing] ?? 1) * 73;
  const treeLine = PANEL_VIEWS.includes(shot.view) ? null : <g>
    {Array.from({length: 9}, (_, i) => i % 3 === 1
      ? <Pine key={i} x={-40 + i * 145} y={hz + 30} s={0.62 + (i % 2) * 0.12} depth={0.55} seed={i + 2} frame={frame} />
      : <Oak key={i} x={-40 + i * 145} y={hz + 34} s={0.5 + (i % 2) * 0.1} depth={0.5} seed={i + 4} frame={frame} />)}
  </g>;
  const svg = (children: React.ReactNode) => (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>{treeLine}{children}</svg>
  );
  const person = (who: Partial<FigureProps>, seed: number) => (x: number, y: number, scale: number, pose: object, emotion: FigureEmotion,
    turn = 0.3, extra: Partial<FigureProps> = {}) => (
    <Figure frame={frame} x={x} y={y} scale={scale} {...who} {...pose} emotion={emotion} turn={turn} seed={seed} {...extra} />
  );
  const res = person(RES, 3), nb = person(NEIGHBOR, 8), jones = person(JONES, 5), burk = person(BURKETT, 11), crew = person(CREW, 13),
    bailey = person(BAILEY, 17);
  /** houses on the far bank, small and pale for depth */
  const farHouses = (y: number, s = 0.32) => <g opacity={0.92}>
    <BrickRanchV2 x={170} y={y} scale={s} frame={frame} seed={101} />
    <BrickRanchV2 x={900} y={y + 6} scale={s * 0.95} frame={frame} seed={103} brick="#b0705a" />
  </g>;

  switch (shot.view) {
    case 'creek-gallery': {
      // the neighbours line the far bank with mugs, gazing down at the creek running across the foreground; the sensor's
      // arm reaches over the water and it tilts its head to match them
      const arrive = p('s1-gallery');
      const tilt = p('s1-tilt');
      const sx = (base: number, k: number) => lerp(base - 260 - k * 80, base, easeOutBack(clamp01(arrive * 1.3 - k * 0.12), 1.2));
      const gal = (who: Partial<FigureProps>, seed: number, x: number, k: number, mug: string, emo: FigureEmotion) =>
        person(who, seed)(sx(x, k), 1400, 1.12, {pose: 'hold', holding: <Mug x={0} y={0} s={0.9} c={mug} steam frame={frame} />}, emo, 0.15 * (k % 2 ? 1 : -1));
      return svg(<g>
        <path d={`M-40 ${hz + 40} L1120 ${hz + 40} L1120 1440 L-40 1440 Z`} fill="#7cb55a" />
        <path d="M-40 1430 Q540 1400 1120 1430 L1120 1470 L-40 1470 Z" fill="#a8744a" />
        <path d={`M-40 1460 ${Array.from({length: 23}, (_, i) => `L${-40 + i * 52} ${(1462 + Math.sin(frame / 9 + i) * 5).toFixed(1)}`).join(' ')} L1120 1760 L-40 1760 Z`}
          fill="#4f8a8a" stroke="#cfe8e6" strokeWidth={6} />
        {[0, 1, 2, 3].map((k) => <path key={k} d={`M${((frame * 3 + k * 300) % 1300) - 120} ${1540 + k * 50} l90 0`} stroke="#d8f0ee" strokeWidth={6}
          strokeLinecap="round" opacity={0.6} />)}
        <path d="M-40 1750 Q540 1720 1120 1750 L1120 2000 L-40 2000 Z" fill="#6aa04a" />
        <LawnChair x={sx(150, 0)} y={1410} s={0.95} mug frame={frame} />
        {gal(NEIGHBOR, 8, 400, 2, '#2f7fd8', 'thinking')}
        {gal({...castV2('farmer'), hat: 'none'}, 21, 545, 3, '#f2c94c', 'worried')}
        {gal(castV2('nurse'), 23, 690, 4, '#3fae6a', 'thinking')}
        {res(sx(255, 1), 1420, 1.2, arrive < 0.9 ? {pose: 'reach'} : move(time_s - W['s1-gallery'].start, 1.45, 'reach', 'hold'), tilt > 0.5 ? 'surprised' : 'worried', 0.1,
          {holding: <Mug x={0} y={0} s={0.9} steam frame={frame} />})}
        <FloodSensor x={1050} y={1440} s={0.8} frame={frame} facing={-1} arm={170} waterY={1500} mood={tilt > 0.2 ? 'happy' : 'sleepy'}
          tilt={-16 * tilt + Math.sin(frame / 20) * 2 * tilt} />
        <Burst x={914} y={850} p={since('s1-tilt') / 0.6} color="#7dff8a" />
      </g>);
    }
    case 'sensor-tilt': {
      // close on the sensor tilting its head to match the people, then blinking
      const tilt = p('s1-tilt');
      return svg(<g>
        <Creek bankY={1560} bedY={1820} level={1700} frame={frame} x0={200} x1={900} />
        <FloodSensor x={1010} y={1570} s={1.35} frame={frame} facing={-1} arm={330} waterY={1700} mood={tilt < 0.4 ? 'focused' : 'happy'}
          tilt={-9 * tilt + Math.sin(frame / 14) * 2} look={-1} />
        {res(160, 2420, 1.9, {pose: 'hold', holding: <Mug x={0} y={0} s={1} steam frame={frame} />}, 'surprised', 0.8)}
      </g>);
    }
    case 'jones-bank': {
      // Jones walks up to the bridge rail and looks down, worried
      const walk = ease(clamp01(t / 1.4));
      return svg(<g>
        {farHouses(1130, 0.28)}
        <Creek bankY={1300} bedY={1520} level={1440} frame={frame} x0={560} x1={1000} />
        <Cumulus cx={780} baseY={700} w={420} h={170} seed={4} frame={frame} />
        {/* bridge rail */}
        <rect x={520} y={1120} width={600} height={34} rx={17} fill="#d8d2c4" stroke={line('#d8d2c4')} strokeWidth={6} />
        {[600, 760, 920, 1060].map((bx) => <rect key={bx} x={bx - 14} y={1150} width={28} height={160} rx={12} fill="#cfc8b8" stroke={line('#cfc8b8')} strokeWidth={5} />)}
        {jones(lerp(120, 600, walk), 1616, 1.6, t < 1.4 ? {pose: 'stand', walk: t} : move(t, 1.4, 'stand', 'reach'), t < 1.2 ? 'neutral' : 'worried', 0.6)}
      </g>);
    }
    case 'harvey-post': {
      // close on the resident on her porch; a grey storm memory named Harvey and Allison rolls over her
      const mem = p('s2-harvey');
      return svg(<g>
        <rect x={-20} y={1500} width={1120} height={500} rx={30} fill="#c9a77e" stroke={line('#c9a77e')} strokeWidth={6} />
        <rect x={860} y={300} width={70} height={1220} rx={30} fill="#f3e8cf" stroke={line('#f3e8cf')} strokeWidth={6} />
        <g opacity={mem} transform={`translate(${lerp(-200, 0, mem)} 0)`}>
          <ellipse cx={500} cy={490} rx={380} ry={120} fill="#6b7290" opacity={0.85} />
          <ellipse cx={330} cy={460} rx={170} ry={95} fill="#7d84a3" />
          <ellipse cx={680} cy={455} rx={190} ry={100} fill="#7d84a3" />
          <Rain a={180} b={860} c={150} d={830} y0={560} y1={640} frame={frame} n={30} />
          <Tag x={300} y={470} text="Harvey" p={mem} size={50} />
          <Tag x={760} y={500} text="Allison" p={clamp01(mem * 1.4 - 0.3)} size={44} />
        </g>
        {res(560, 1783, 2.1, move(t, 0.05, 'hold', 'think'), mem > 0.3 ? 'worried' : 'thinking', 0.2)}
      </g>);
    }
    case 'quote-burkett': {
      const card = easeOutBack(p('s3-card'), 1.3);
      return svg(<g>
        <g transform={`translate(0 ${(1 - card) * 400})`} opacity={clamp01(card * 2)}>
          <GlassPanel x={380} y={440} w={660} h={640} r={50} tint="#24305e">
            <text x={50} y={110} fontFamily={FONT.display} fontWeight={700} fontSize={140} fill="#7fd0ff">{'“'}</text>
            {['Flooding and drainage', '[are] the number one', 'threat to lives and', 'property in', 'Galveston County.'].map((l, i) =>
              <g key={i}><text x={60} y={190 + i * 72} fontFamily={FONT.body} fontWeight={800} fontSize={54} fill="#ffffff">{l}</text>
                <path d={`M60 ${204 + i * 72} l${520 * clamp01(p('s3-name') * 5 - i)} 0`} stroke="#ffcc33" strokeWidth={8} strokeLinecap="round" /></g>)}
            <text x={60} y={580} fontFamily={FONT.body} fontWeight={700} fontSize={32} fill="#bfe6ff">Rusty Burkett, board president</text>
          </GlassPanel>
        </g>
        {burk(200, 1599, 1.55, since('s3-name') < 0 ? move(t, 0.6, 'stand', 'crossed') : move(since('s3-name'), 0, 'crossed', 'point'), since('s3-name') < 0 ? 'neutral' : 'determined', 0.5)}
      </g>);
    }
    case 'number-one': {
      // close on Burkett, grave, as the number one slams in beside him and shakes
      const hit = since('s3-one');
      const shake = hit > 0 && hit < 0.35 ? Math.sin(hit * 80) * 14 * (1 - hit / 0.35) : 0;
      return svg(<g transform={`translate(${shake} 0)`}>
        {burk(330, 1880, 2.4, hit < 0 ? {pose: 'crossed'} : move(hit, 0, 'crossed', 'point'), 'determined', 0.6)}
        <BigNumber x={780} y={800} text="No. 1" p={clamp01(hit / 0.3)} size={190} color="#ffcc33" font={FONT.body} />
        <Tag x={780} y={940} text="threat to lives and property" p={clamp01((hit - 0.3) / 0.4)} size={34} />
        <Burst x={780} y={720} p={hit / 0.6} color="#ffcc33" />
      </g>);
    }
    case 'dark-map': {
      // at the creek: a bare pole with an empty bracket where a sensor could hang, nothing on it; Jones looks up at it and shrugs
      const shrug = since('s4-shrug');
      const chirp = Math.sin(frame / 3) > 0.6;
      const swing = Math.sin(frame / 18) * 4;
      return svg(<g>
        <Creek bankY={1420} bedY={1700} level={1600} frame={frame} x0={380} x1={900} />
        <g transform="translate(940 1430)">
          <rect x={-60} y={-40} width={120} height={50} rx={22} fill="#d8d2c4" />
          <rect x={-18} y={-820} width={36} height={790} rx={18} fill="#c9d1e3" stroke={line('#c9d1e3')} strokeWidth={6} />
          <path d={`M0 -760 L-300 -760`} stroke={line('#c9d1e3')} strokeWidth={30} strokeLinecap="round" />
          <path d={`M0 -760 L-300 -760`} stroke="#c9d1e3" strokeWidth={20} strokeLinecap="round" />
          <g transform={`translate(-300 -760) rotate(${swing})`}>
            <path d="M0 0 L0 60" stroke="#9aa6c4" strokeWidth={10} />
            <rect x={-80} y={60} width={160} height={100} rx={40} fill="none" stroke="#ffffff" strokeWidth={8} strokeDasharray="18 14" opacity={0.8} />
          </g>
        </g>
        <Tag x={640} y={560} text="Nothing here yet" p={clamp01(since('s4-dark') / 0.4)} size={46} />
        <g transform="translate(200 1500)">
          <ellipse cx={0} cy={0} rx={30} ry={14} fill="#3a8a4a" /><circle cx={26} cy={-6} r={11} fill="#3a8a4a" />
          {chirp && <path d="M46 -26 q14 -10 0 -24 M60 -32 q18 -14 0 -32" stroke="#ffffff" strokeWidth={4} fill="none" opacity={0.7} />}
        </g>
        {jones(420, 1616, 1.6, shrug < 0 ? move(t, 0.3, 'stand', 'point') : move(shrug, 0, 'point', 'shrug'), 'worried', 0.6)}
      </g>);
    }
    case 'bridge-eyes': {
      // seven sensors along the creek open their eyes one after another, receding downstream
      const go = since('s5-seven');
      const pts = Array.from({length: 7}, (_, i) => ({x: 1000 - i * 132, y: 1330 - i * 50, s: 0.95 - i * 0.1}));
      return svg(<g>
        <path d="M-40 1200 Q300 1080 700 1000 L1120 940 L1120 1500 L-40 1500 Z" fill="#7cb55a" opacity={0.9} />
        <path d="M1120 1340 Q700 1220 380 1060 Q200 980 -40 960 L-40 1010 Q220 1040 380 1110 Q700 1270 1120 1420 Z" fill="#3a9ad6" stroke={line('#3a9ad6')} strokeWidth={6} />
        <path d="M1120 1360 Q700 1240 380 1080" stroke="#bfe6ff" strokeWidth={6} fill="none" opacity={0.7} />
        {pts.slice().reverse().map((q, k) => {
          const i = 6 - k;
          const on = go - i * 0.85;
          const mood = on > 0 ? 'happy' : 'sleepy';
          return <g key={i}>
            <FloodSensor x={q.x + 80 * q.s} y={q.y + 30} s={q.s} frame={frame + i * 9} facing={-1} arm={260} mood={mood} />
            {on > 0 && on < 0.6 && <Burst x={q.x - 130 * q.s} y={q.y - 640 * q.s} p={on / 0.6} color="#7dff8a" r={90 * q.s + 30} />}
          </g>;
        })}
        {since('s5-april') > 0 && (() => { const f = easeOutBack(clamp01(since('s5-april') / 0.5), 1.6); return (
          <g transform={`translate(820 560) rotate(${(1 - f) * -40}) scale(${f})`}>
            <rect x={-120} y={-110} width={240} height={220} rx={34} fill="#fffaf0" stroke={line('#fffaf0')} strokeWidth={6} />
            <rect x={-120} y={-110} width={240} height={70} rx={34} fill="#e8573c" />
            <rect x={-120} y={-70} width={240} height={30} fill="#e8573c" />
            <text x={0} y={-58} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={40} fill="#ffffff">APRIL</text>
            {Array.from({length: 12}, (_, k) => <circle key={k} cx={-80 + (k % 4) * 53} cy={0 + Math.floor(k / 4) * 36} r={9} fill="#c9cfe0" />)}
          </g>); })()}
        <g transform="translate(170 620)">{Array.from({length: 7}, (_, i) => <circle key={i} cx={i * 46} cy={0} r={16} fill={go - i * 0.85 > 0 ? '#3ee08a' : '#3a4060'} stroke="#1a1236" strokeWidth={4} />)}</g>
      </g>);
    }
    case 'watershed-split': {
      // two creeks side by side: six sensors blink along Clear Creek, one alone on Dickinson Bayou waves its light
      const q = p('s5-split');
      const wave = Math.sin(frame / 5) * 12;
      return svg(<g>
        <GlassPanel x={50} y={430} w={980} h={420} r={50} tint="#1b3a5e">
          <text x={40} y={70} fontFamily={FONT.body} fontWeight={800} fontSize={48} fill="#ffffff">Clear Creek watershed</text>
          <path d="M20 260 C200 180 360 320 520 240 S800 180 940 250" stroke="#7fd0ff" strokeWidth={16} fill="none" strokeLinecap="round" />
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const a = easeOutBack(clamp01(q * 1.6 - i * 0.1), 1.6);
            const x = 90 + i * 150, y = 250 + Math.sin(i * 1.3) * 30;
            return a > 0 ? <g key={i} transform={`translate(${x} ${y}) scale(${a})`}><circle r={34} fill="#3ee08a" opacity={0.3} />
              <circle r={22} fill="#3ee08a" stroke={line('#3ee08a')} strokeWidth={5} /></g> : null;
          })}
          <text x={880} y={370} textAnchor="end" fontFamily={FONT.mono} fontWeight={800} fontSize={70} fill="#3ee08a">{q > 0.5 ? 'SIX' : ''}</text>
        </GlassPanel>
        <GlassPanel x={50} y={880} w={980} h={330} r={50} tint="#2b2a5e">
          <text x={40} y={70} fontFamily={FONT.body} fontWeight={800} fontSize={48} fill="#ffffff">Dickinson Bayou watershed</text>
          <path d="M20 210 C260 160 500 260 940 190" stroke="#7fd0ff" strokeWidth={16} fill="none" strokeLinecap="round" />
          {q > 0.55 && <g transform={`translate(480 ${200 - Math.abs(wave)}) scale(${easeOutBack(clamp01((q - 0.55) * 3), 1.8)})`}>
            <circle r={40} fill="#3ee08a" opacity={0.3} /><circle r={24} fill="#3ee08a" stroke={line('#3ee08a')} strokeWidth={5} />
            <path d={`M24 -10 Q48 ${-40 + wave} 60 ${-56 + wave}`} stroke="#3ee08a" strokeWidth={9} strokeLinecap="round" fill="none" />
          </g>}
          <text x={880} y={300} textAnchor="end" fontFamily={FONT.mono} fontWeight={800} fontSize={70} fill="#3ee08a">{q > 0.6 ? 'ONE' : ''}</text>
        </GlassPanel>
      </g>);
    }
    case 'install': {
      // the crew member bolts the sensor on, hangs a price tag on it, and the sensor opens its eyes
      const bolt = since('s5-bolt');
      const turn = bolt > 0 ? Math.sin(bolt * 12) * 25 : 0;
      const tag = easeOutBack(clamp01((bolt - 0.6) / 0.5), 1.6);
      return svg(<g>
        <Creek bankY={1440} bedY={1700} level={1600} frame={frame} x0={80} x1={560} />
        <FloodSensor x={760} y={1450} s={1.0} frame={frame} facing={-1} arm={300} waterY={1600} mood={bolt < 0.5 ? 'sleepy' : 'happy'}
          tilt={bolt > 0.5 && bolt < 1 ? Math.sin(bolt * 20) * 6 : 0} />
        <Burst x={460} y={700} p={(bolt - 0.5) / 0.6} color="#7dff8a" />
        {tag > 0 && <g transform={`translate(560 ${880}) rotate(${Math.sin(frame / 10) * 8}) scale(${tag})`}>
          <path d="M-20 -110 L0 -60 L20 -110" stroke="#c9cfe0" strokeWidth={5} fill="none" />
          <rect x={-150} y={-60} width={300} height={120} rx={30} fill="#fff4dc" stroke={line('#fff4dc')} strokeWidth={6} />
          <circle cx={-118} cy={0} r={10} fill="#1a1236" />
          <text x={14} y={-6} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={34} fill="#1a1236">UNDER</text>
          <text x={14} y={40} textAnchor="middle" fontFamily={FONT.mono} fontWeight={800} fontSize={46} fill="#1a1236">$10,000</text>
        </g>}
        {crew(880, 1616, 1.6, {pose: 'reach', holding: <g transform={`rotate(${turn})`}><rect x={-10} y={-70} width={20} height={110} rx={10} fill="#9aa6c4" stroke={line('#9aa6c4')} strokeWidth={4} /></g>},
          bolt < 0.5 ? 'determined' : 'happy', -0.6)}
      </g>);
    }
    case 'sensor-ping': {
      // the sensor fires radar down to the water and catches the echo; the crew member looks up; one spot lights alone
      const ping = (since('s6-ping') % 1.3) / 1.3;
      const one = p('s6-one');
      return svg(<g>
        <Creek bankY={1500} bedY={1800} level={1660} frame={frame} x0={150} x1={820} />
        <FloodSensor x={980} y={1510} s={1.25} frame={frame} facing={-1} arm={360} waterY={1660} mood="focused" ping={ping} />
        {one > 0 && <g transform={`translate(530 1660) scale(${easeOutBack(one, 1.6)})`}><circle r={60} fill="#3ee08a" opacity={0.25} />
          <circle r={30} fill="#3ee08a" stroke={line('#3ee08a')} strokeWidth={6} /></g>}
        <Tag x={540} y={480} text="One spot, one creek" p={one} size={46} />
        {crew(960, 2170, 1.5, {pose: 'point'}, 'surprised', -0.7)}
      </g>);
    }
    case 'feed-pipes': {
      // four pipes fill one by one and pour rain, gauge, weather and soil into the glass box with the sensor in it
      const q = p('s6-pipes');
      const src = [
        {x: 190, y: 660, label: 'Rainfall', c: '#7fd0ff'},
        {x: 890, y: 660, label: 'Stream gauges', c: '#5ab8ff'},
        {x: 170, y: 1150, label: 'Weather', c: '#ffe066'},
        {x: 910, y: 1150, label: 'Soil', c: '#c9946a'},
      ];
      return svg(<g>
        {src.map((s, i) => {
          const f = clamp01(q * 4 - i);
          const d = `M${s.x} ${s.y} C${s.x} 860 ${540 + (s.x < 540 ? -120 : 120)} 860 540 860`;
          return <g key={i}>
            <path d={d} stroke="#3a3f6a" strokeWidth={46} fill="none" strokeLinecap="round" />
            <path d={d} stroke={s.c} strokeWidth={26} fill="none" strokeLinecap="round" strokeDasharray={900} strokeDashoffset={900 * (1 - f)} />
            {f >= 1 && [0, 1, 2].map((k) => {
              const u = ((frame / 30) * 0.9 + k / 3) % 1;
              return <circle key={k} cx={lerp(s.x, 540, u)} cy={lerp(s.y, 860, Math.sqrt(u))} r={12} fill="#ffffff" opacity={0.8 * (1 - u)} />;
            })}
          </g>;
        })}
        {/* the four sources */}
        <g transform="translate(190 620)"><Cumulus cx={0} baseY={0} w={220} h={110} seed={2} frame={frame} />
          <Rain a={-80} b={80} c={-90} d={70} y0={10} y1={120} frame={frame} n={14} /></g>
        <g transform="translate(890 640)">
          <rect x={-40} y={-150} width={80} height={200} rx={20} fill="#f6f1e6" stroke={line('#f6f1e6')} strokeWidth={6} />
          {[0, 1, 2, 3, 4].map((k) => <path key={k} d={`M-40 ${-120 + k * 36} l30 0`} stroke="#2a2a5c" strokeWidth={6} />)}
          <rect x={-120} y={10} width={240} height={50} rx={24} fill="#3a9ad6" opacity={0.85} /></g>
        <g transform="translate(170 1150)">
          <rect x={-8} y={-160} width={16} height={160} rx={8} fill="#c9d1e3" />
          <g transform={`rotate(${frame * 9} 0 -160)`}>{[0, 120, 240].map((a) => <g key={a} transform={`rotate(${a} 0 -160)`}>
            <path d="M0 -160 L60 -160" stroke="#c9d1e3" strokeWidth={8} /><circle cx={66} cy={-160} r={16} fill="#ffe066" /></g>)}</g>
        </g>
        <SoilSponge x={910} y={1090} s={0.8} wet={p('s6-soil') > 0 ? 1 : 0.6} frame={frame} />
        {crew(540, 1850, 1.3, move(t, 0.4, 'stand', 'point'), 'thinking', 0.2)}
        {src.map((s, i) => <Tag key={s.label} x={s.x} y={s.y + (s.y < 800 ? -150 : 130)} text={s.label} p={clamp01(q * 4 - i + 0.5)} size={40} />)}
        {/* the glass box with the sensor's face */}
        <g transform={`translate(540 860) scale(${1.25 + Math.sin(frame / 6) * 0.03 * q})`}>
          <rect x={-170} y={-150} width={340} height={300} rx={70} fill="#7fd0ff" opacity={0.18} stroke="#bfe6ff" strokeWidth={8} />
          <FloodSensor x={150} y={560} s={0.6} frame={frame} facing={-1} arm={250} mood={q > 0.5 ? 'focused' : 'happy'} />
          <Glow x={0} y={0} r={200} color="#7fd0ff" opacity={0.2 * q} />
        </g>
      </g>);
    }
    case 'soil-close': {
      // the soaked soil drips, and a raindrop runs straight off it; the crew member presses it
      const s = since('s6-soil');
      const drop = clamp01(s / 1.2);
      return svg(<g>
        <SoilSponge x={540} y={900} s={2.2} wet={1} frame={frame} />
        <g transform={`translate(${540 + drop * 260} ${lerp(420, 700, Math.min(1, drop * 2)) + Math.max(0, drop - 0.5) * 400})`}>
          <path d="M0 -40 Q30 0 0 30 Q-30 0 0 -40 Z" fill="#7fd0ff" stroke={line('#7fd0ff')} strokeWidth={5} /></g>
        <Tag x={540} y={560} text="Already soaked" p={clamp01(s * 2)} size={52} />
        {crew(170, 1632, 1.65, {pose: 'point'}, 'thinking', 0.6)}
      </g>);
    }
    case 'kitchen-phone': {
      // at her kitchen table, dotted could-paths spread across the resident's phone
      const q = p('s7-think');
      const paths = ['M80 600 C180 480 200 380 300 260', 'M80 600 C200 560 280 520 360 420', 'M80 600 C120 440 100 320 140 180'];
      return svg(<g>
        <path d="M-40 -40 L1120 -40 L1120 1920 L-40 1920 Z M140 420 L560 420 L560 980 L140 980 Z" fillRule="evenodd" fill="#f2e2c4" />
        <rect x={130} y={410} width={440} height={580} rx={30} fill="none" stroke="#fffaf0" strokeWidth={22} />
        <path d="M350 420 L350 980 M140 700 L560 700" stroke="#fffaf0" strokeWidth={14} />
        <rect x={-40} y={1420} width={1160} height={600} fill="#b98a5e" />
        <Mug x={880} y={1440} s={1.6} steam frame={frame} c="#3fae6a" />
        {res(420, 1760, 2.0, {pose: 'hold', holding: <Phone x={10} y={70} w={150} h={250} tilt={4}>
          <WatershedMap w={106} h={206} frame={frame} dots={SEVEN.slice(0, 6).map(([x, y]) => [x, y * 0.6 + 0.4, 'green', 1] as [number, number, DotState, number])} />
          {paths.map((d, i) => <path key={i} d={d} transform="scale(0.32)" stroke="#ffcc33" strokeWidth={20} strokeDasharray="20 16" fill="none"
            strokeLinecap="round" opacity={clamp01(q * 3 - i)} />)}
        </Phone>}, q > 0.3 ? 'surprised' : 'thinking', 0.2)}
        <Tag x={760} y={600} text="could..." p={q} size={56} c="#ffcc33" />
      </g>);
    }
    case 'bank-swell': {
      // a low swell rolls down the creek past the near-bank houses, staying inside its banks; the resident watches it on her phone
      const q = p('s7-flow');
      const swellX = lerp(-250, 1350, clamp01(t / Math.max(1, shot.duration_s)));
      const surf = (yy: number, amp: number) => Array.from({length: 26}, (_, i) => {
        const x = -40 + i * 48; const bump = Math.exp(-Math.pow((x - swellX) / 170, 2)) * amp;
        return `L${x} ${(yy - bump + Math.sin(frame / 8 + i) * 4).toFixed(1)}`;
      }).join(' ');
      return svg(<g>
        <BrickRanchV2 x={230} y={1010} scale={0.3} frame={frame} seed={107} />
        <BrickRanchV2 x={820} y={1015} scale={0.29} frame={frame} seed={109} brick="#a8674c" />
        <Oak x={530} y={1020} s={0.4} frame={frame} seed={6} depth={0.3} />
        <path d="M-40 1020 L1120 1020 L1120 1110 L-40 1110 Z" fill="#7cb55a" stroke={line('#7cb55a')} strokeWidth={6} />
        <path d={`M-40 1130 ${surf(1130, 170)} L1120 1430 L-40 1430 Z`} fill="#4f8a8a" stroke="#e8fbff" strokeWidth={12} />
        <path d={`M-40 1200 ${surf(1200, 60)}`} stroke="#bfe6ff" strokeWidth={5} fill="none" opacity={0.5} />
        <path d="M-40 1420 L1120 1420 L1120 2000 L-40 2000 Z" fill="#7cb55a" stroke={line('#7cb55a')} strokeWidth={6} />
        <g transform={`translate(${swellX} 900)`} opacity={Math.sin(clamp01(t / Math.max(1, shot.duration_s)) * Math.PI)}><path d="M-70 0 L50 0 M20 -40 L60 0 L20 40" stroke="#ffffff" strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" fill="none" /></g>
        <Tag x={200} y={820} text="Upstream" p={1} size={40} /><Tag x={640} y={820} text="Downstream" p={q} size={40} />
        {res(860, 1650, 1.7, {pose: 'hold', holding: <Phone x={0} y={-20} w={80} h={150} tilt={-8}><rect x={0} y={0} width={36} height={106} fill="#3ee08a" opacity={0.7} /></Phone>},
          q > 0.4 ? 'surprised' : 'thinking', -0.5)}
      </g>);
    }
    case 'porch-glider': {
      // the resident steps onto her porch past the glider and lifts her phone
      const lift = p('s8-glider');
      return svg(<g>
        <BrickRanchV2 x={600} y={1420} scale={0.62} frame={frame} seed={111} />
        <PorchGliderV2 x={820} y={1560} scale={1.1} frame={frame} />
        {res(lerp(200, 380, ease(clamp01(t / 1))), 1616, 1.6, move(t, 0.7, 'stand', 'hold'), lift > 0.5 ? 'thinking' : 'neutral', 0.3,
          {holding: lift > 0.4 ? <Phone x={0} y={-30} w={70} h={130} tilt={-10}><rect x={0} y={0} width={26} height={86} fill="#3ee08a" opacity={0.6} /></Phone> : undefined})}
      </g>);
    }
    case 'thumb-tap':
    case 'phone-map': {
      if (shot.scene_id === 's9') {
        const sign = p('s9-sign');
        const press = sign > 0.3 && sign < 0.6 ? 1 : 0;
        return svg(<g>
          <g transform="translate(540 820) scale(1.9) translate(-258 -478)">
            <rect x={0} y={0} width={516} height={956} rx={60} fill="#16204a" stroke="#2b2d4a" strokeWidth={30} />
            <g transform="translate(0 120)"><WatershedMap w={516} h={520} frame={frame} dots={SEVEN.map(([x, y]) => [x, y, 'green', 1] as [number, number, DotState, number])} /></g>
          </g>
          <g transform={`translate(${540 + (SEVEN[2][0] - 0.5) * 516 * 1.9} ${820 + (120 + SEVEN[2][1] * 520 - 478) * 1.9})`}>
            <circle r={60 + sign * 40} fill="none" stroke="#3ee08a" strokeWidth={10} opacity={1 - sign} />
          </g>
          <g transform={`translate(${lerp(980, 380, ease(clamp01(sign * 1.6)))} ${lerp(1500, 690 + press * 12, ease(clamp01(sign * 1.6)))}) rotate(-28)`}>
            <rect x={-70} y={0} width={140} height={600} rx={70} fill={RES_SKIN} stroke={line(RES_SKIN)} strokeWidth={8} />
            <rect x={-46} y={14} width={92} height={80} rx={34} fill={light(RES_SKIN, 0.4)} opacity={0.8} />
            <rect x={-90} y={360} width={180} height={400} rx={60} fill="#8b5fbf" stroke={line('#8b5fbf')} strokeWidth={8} />
          </g>
          <g transform={`translate(820 520) scale(${sign > 0.5 ? easeOutBack(clamp01((sign - 0.5) * 3), 1.8) : 0.001})`}>
            <path d="M-50 30 Q-50 -50 0 -54 Q50 -50 50 30 L64 46 L-64 46 Z" fill="#ffcc33" stroke={line('#ffcc33')} strokeWidth={6} />
            <circle cx={0} cy={62} r={14} fill="#ffcc33" />
          </g>
          <Tag x={540} y={1080} text={sign > 0.5 ? 'Alerts on for Clear Creek' : 'Clear Creek'} p={1} size={44} c={sign > 0.5 ? '#3ee08a' : '#ffffff'} />
        </g>);
      }
      // close on the phone: the map, then the legend lights green, yellow, red, then the thumb signs up for alerts on one creek
      const g = p('s8-green'), y = p('s8-yellow'), r = p('s8-red');
      const sign = p('s9-sign');
      const isSign = shot.scene_id === 's9';
      const dots = SEVEN.map(([x, yy], i) => [x, yy, !isSign && i === 3 && r > 0 ? 'red' : !isSign && i === 4 && y > 0 ? 'yellow' : 'green', 1] as [number, number, DotState, number]);
      return svg(<g>
        {res(isSign ? 900 : 150, 1783, 2.1, isSign ? move(t, 0.2, 'hold', 'point') : move(t, 0.4, 'hold', 'think'), isSign ? 'happy' : 'thinking', isSign ? -0.7 : 0.7)}
        <Phone x={isSign ? 420 : 620} y={760} w={540} h={960} tilt={isSign ? 6 : -4}>
          <rect x={0} y={0} width={516} height={956} fill="#16204a" />
          <g transform="translate(0 90)"><WatershedMap w={516} h={520} frame={frame} dots={dots} /></g>
          <text x={258} y={64} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={38} fill="#ffffff">Clear Creek</text>
          {!isSign && [{c: '#3ee08a', t: 'Safe', v: g}, {c: '#ffcc33', t: 'Flooding possible', v: y}, {c: '#ff4d5a', t: 'Flooding likely', v: r}].map((row, i) => (
            row.v > 0 ? <g key={i} transform={`translate(40 ${600 + i * 80}) scale(${easeOutBack(clamp01(row.v * 1.5), 1.8)})`}>
              <circle cx={24} cy={0} r={24} fill={row.c} /><text x={70} y={14} fontFamily={FONT.body} fontWeight={800} fontSize={38} fill="#ffffff">{row.t}</text>
            </g> : null))}
          {isSign && <g transform="translate(40 610)">
            <rect x={0} y={0} width={436} height={110} rx={40} fill={sign > 0.4 ? '#3ee08a' : '#2c3a7a'} />
            <text x={218} y={70} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={40} fill="#ffffff">{sign > 0.4 ? 'Alerts on' : 'Get alerts'}</text>
          </g>}
        </Phone>
        {isSign && <Burst x={600} y={1260} p={(sign - 0.4) / 0.5} color="#3ee08a" />}
      </g>);
    }
    case 'level-slider': {
      // a crew member drags the alert slider on a laptop to the line officials chose
      const q = p('s9-slide');
      return svg(<g>
        <rect x={140} y={560} width={800} height={520} rx={40} fill="#2b2d4a" stroke={line('#2b2d4a')} strokeWidth={8} />
        <rect x={170} y={590} width={740} height={460} rx={24} fill="#16204a" />
        <path d="M60 1080 L1020 1080 L1060 1140 L20 1140 Z" fill="#c9cfe0" stroke={line('#c9cfe0')} strokeWidth={6} strokeLinejoin="round" />
        <text x={540} y={660} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={40} fill="#ffffff">Alert level</text>
        <rect x={500} y={700} width={80} height={320} rx={40} fill="#2c3a7a" />
        <rect x={510} y={lerp(980, 780, ease(q))} width={60} height={lerp(30, 230, ease(q))} rx={30} fill="#38c2f2" />
        <g transform={`translate(540 ${lerp(980, 780, ease(q))})`}>
          <rect x={-90} y={-20} width={180} height={40} rx={20} fill="#ffcc33" stroke={line('#ffcc33')} strokeWidth={5} />
        </g>
        {crew(930, 1616, 1.6, {pose: 'reach'}, 'determined', -0.6)}
      </g>);
    }
    case 'rain-chair': {
      // the rain sweeps over the empty lawn chair as the creek climbs, and the phone buzzes at the resident on her porch
      const q = p('s9-rain');
      const lvl = lerp(1610, 1490, ease(clamp01(t / 1.6)));
      return svg(<g>
        <rect x={-40} y={300} width={1160} height={900} fill="#6f7ea8" opacity={0.35} />
        <Creek bankY={1420} bedY={1680} level={lvl} frame={frame} x0={360} x1={780} muddy={0} />
        <Rain a={-40} b={1120} c={-120} d={1040} y0={300} y1={1700} frame={frame} n={80} opacity={0.6} />
        <LawnChair x={300} y={1660} s={1.0} wet frame={frame} />
        <BrickRanchV2 x={980} y={1420} scale={0.3} frame={frame} seed={113} />
        <path d="M330 1500 L810 1500" stroke="#ffcc33" strokeWidth={8} strokeDasharray="24 16" />
        <Tag x={570} y={1340} text="Alert level" p={1} size={36} c="#ffcc33" />
        <path d="M1160 2000 L1160 1560 Q1000 1500 860 1080 L760 1120 Q860 1600 960 2000 Z" fill="#8b5fbf" stroke={line('#8b5fbf')} strokeWidth={8} />
        <ellipse cx={800} cy={1060} rx={80} ry={100} fill={RES_SKIN} stroke={line(RES_SKIN)} strokeWidth={7} />
        <Phone x={800} y={830} w={300} h={440} tilt={-8} buzz={t > 0.6 ? Math.sin(frame * 2.2) * 6 : 0} screen="#1e1e52">
          <rect x={20} y={110} width={216} height={170} rx={24} fill="#ffcc33" opacity={t > 0.6 ? 1 : 0.2} />
          <text x={128} y={180} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={30} fill="#1a1236" opacity={t > 0.6 ? 1 : 0}>Clear Creek</text>
          <text x={128} y={226} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={26} fill="#1a1236" opacity={t > 0.6 ? 1 : 0}>alert level</text>
        </Phone>
        <Bolt x={760} y0={260} y1={700} frame={frame} period={70} seed={3} />
      </g>);
    }
    case 'door-keys': {
      // at her door with the folded chair, she lifts her keys and weighs it, then closes her hand on them
      const keys = p('s10-keys');
      const go = since('s10-go');
      return svg(<g>
        <rect x={-40} y={260} width={1160} height={1360} fill="#c0603e" />
        {Array.from({length: 26}, (_, r) => <path key={r} d={`M-40 ${300 + r * 52} L1120 ${300 + r * 52}`} stroke="#e8c9b0" strokeWidth={4} opacity={0.5} />)}
        {Array.from({length: 26}, (_, r) => Array.from({length: 9}, (_, c) => <path key={`${r}-${c}`} d={`M${(r % 2 ? 60 : 0) + c * 130} ${300 + r * 52} l0 52`}
          stroke="#e8c9b0" strokeWidth={4} opacity={0.5} />))}
        <rect x={400} y={400} width={460} height={1220} rx={30} fill="#f7eedb" />
        <rect x={420} y={420} width={420} height={1180} rx={40} fill="#b9633a" stroke={line('#b9633a')} strokeWidth={8} />
        <rect x={380} y={380} width={500} height={60} rx={24} fill="#f7eedb" stroke={line('#f7eedb')} strokeWidth={6} />
        <circle cx={780} cy={1020} r={20} fill="#f2c94c" />
        <rect x={-40} y={1600} width={1160} height={400} fill="#c9a77e" />
        <LawnChair x={950} y={1830} s={1.35} folded={1} frame={frame} facing={-1} />
        {res(330, 1616, 1.6, go > 0 ? move(go, 0, 'raise', 'hips') : move(t, 0.2, 'stand', 'raise'), go > 0 ? 'determined' : 'thinking', 0.4)}
        {go < 0 && t > 0.55 && (() => { const h = figureHands('raise').r; return <Keys x={330 + h.x * 1.6} y={1616 + h.y * 1.6 + 30} s={1.6} frame={frame} />; })()}
        {go >= 0 && <Burst x={330} y={1250} p={go / 0.5} color="#ffe066" />}
      </g>);
    }
    case 'route-phone': {
      // a route line on her phone draws around the low street toward high ground, and she nods
      const q = p('s10-route');
      return svg(<g>
        {res(190, 1783, 2.1, move(t, 0.3, 'hold', 'point'), q > 0.6 ? 'determined' : 'thinking', 0.7)}
        <Phone x={620} y={870} w={560} h={980} tilt={3}>
          <rect x={0} y={0} width={516} height={936} fill="#e9eef7" />
          {[150, 330, 510, 690].map((yy) => <rect key={yy} x={0} y={yy} width={516} height={40} fill="#c9d1e3" />)}
          {[120, 330].map((xx) => <rect key={xx} x={xx} y={0} width={40} height={936} fill="#c9d1e3" />)}
          <rect x={0} y={500} width={516} height={60} fill="#5ab8ff" opacity={0.7} />
          <text x={258} y={480} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={30} fill="#2a4a8a">low street</text>
          <path d="M140 860 L140 710 L350 710 L350 350 L350 170" stroke="#3ee08a" strokeWidth={18} fill="none" strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={1200} strokeDashoffset={1200 * (1 - q)} />
          <circle cx={140} cy={860} r={20} fill="#2f7fd8" />
          {q > 0.9 && <g transform="translate(350 150)"><circle r={30} fill="#3ee08a" /><text x={0} y={-50} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={30} fill="#1a6a3a">high ground</text></g>}
        </Phone>
      </g>);
    }
    case 'eighty-miles': {
      // overhead: the camera rises off one sensor until the whole branching network of creeks, ditches and bayous fills the
      // frame and the seven lights are specks, the lone Dickinson light far off by itself
      const q = p('s11-ribbon');
      const m = p('s11-miles');
      const z = lerp(4.2, 1, ease(clamp01(q * 0.8 + m * 0.6)));
      const main = (u: number): [number, number] => [-60 + u * 1200, 760 + Math.sin(u * 9) * 140 + Math.sin(u * 23) * 30];
      const pts = Array.from({length: 61}, (_, i) => main(i / 60));
      const mainD = `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L')}`;
      const kids = Array.from({length: 26}, (_, i) => {
        const u = 0.03 + i * 0.037, [x, y] = main(u), up = i % 2 ? -1 : 1, len = 180 + ((i * 53) % 140);
        const d = `M${x} ${y} C${x + 30} ${y + up * len * 0.4} ${x - 40} ${y + up * len * 0.7} ${x + 20} ${y + up * len}`;
        const d2 = `M${x + 8} ${y + up * len * 0.55} q${up * 40} ${up * 30} ${90} ${up * 70}`;
        return {d, d2, i};
      });
      const bayou = 'M-60 1250 C200 1200 420 1300 640 1240 S960 1190 1140 1260';
      const lit: [number, number][] = [0.18, 0.3, 0.42, 0.55, 0.67, 0.8].map((u) => main(u));
      const lone: [number, number] = [640, 1240];
      const fx = lit[0][0], fy = lit[0][1];
      return svg(<g>
        <rect x={30} y={430} width={1020} height={1000} rx={50} fill="#1a2a4a" stroke="#fffaf0" strokeWidth={14} />
        <defs><clipPath id="brd80"><rect x={37} y={437} width={1006} height={986} rx={44} /></clipPath></defs>
        <g clipPath="url(#brd80)"><g transform={`translate(${lerp(540, 540, q)} 800) scale(${z}) translate(${-lerp(fx, 540, ease(q))} ${-lerp(fy, 800, ease(q))})`}>
          <rect x={-200} y={200} width={1500} height={1400} fill="#24406a" />
          {kids.map(({d, d2, i}) => <g key={i} opacity={clamp01(0.35 + m * 2 - i * 0.05)}>
            <path d={d} stroke="#5a9ad0" strokeWidth={7} fill="none" strokeLinecap="round" />
            <path d={d2} stroke="#5a9ad0" strokeWidth={4} fill="none" strokeLinecap="round" />
          </g>)}
          <path d={mainD} stroke="#7fd0ff" strokeWidth={18} fill="none" strokeLinecap="round" />
          <path d={bayou} stroke="#7fd0ff" strokeWidth={14} fill="none" strokeLinecap="round" />
          {[...lit, lone].map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r={22 / Math.sqrt(z)} fill="#3ee08a" opacity={0.35} />
            <circle cx={x} cy={y} r={10 / Math.sqrt(z) + 2} fill="#3ee08a" /></g>)}
        </g></g>
        <BigNumber x={600} y={560} text="80+ miles" p={clamp01(q * 1.5)} size={110} color="#ffffff" />
        {bailey(lerp(-120, 230, ease(clamp01(t / 2.5))), 1640, 1.3, t < 2.5 ? {pose: 'stand', walk: t} : move(t, 2.5, 'stand', 'point'), 'thinking', 0.5)}
      </g>);
    }
    case 'ghost-pins': {
      // Bailey plants a dashed ghost stake on the bank, then dashed rings pop up where more gauges are needed
      const stake = p('s11-stake');
      const ghost = p('s11-ghost');
      const rings: [number, number][] = [[0.18, 0.5], [0.44, 0.22], [0.7, 0.6], [0.86, 0.36], [0.3, 0.78]];
      return svg(<g>
        <MapPanel x={300} y={440} w={740} h={620} tint="#1b2350">
          <WatershedMap w={704} h={584} frame={frame} dots={SEVEN.map(([x, y]) => [x, y, 'green', 1] as [number, number, DotState, number])} />
          {rings.map(([x, y], i) => {
            const a = easeOutBack(clamp01(ghost * 2 - i * 0.2), 1.8);
            return a > 0 ? <circle key={i} cx={x * 704} cy={y * 584} r={30 * a} fill="none" stroke="#ffffff" strokeWidth={6} strokeDasharray="10 8" /> : null;
          })}
        </MapPanel>
        <path d="M-40 1500 L1120 1500 L1120 2000 L-40 2000 Z" fill="#6a9a4a" />
        <g transform={`translate(${220 + figureHands('reach').r.x * 1.6 + 40} ${lerp(1380, 1560, easeOutBack(stake, 1.6))})`} opacity={clamp01(stake * 3)}>
          <rect x={-10} y={-200} width={20} height={200} rx={10} fill="none" stroke="#ffffff" strokeWidth={6} strokeDasharray="14 10" />
          <circle cx={0} cy={-220} r={26} fill="none" stroke="#ffffff" strokeWidth={6} strokeDasharray="10 8" />
        </g>
        {bailey(220, 1616, 1.6, ghost > 0 ? move(since('s11-ghost'), 0, 'reach', 'cheer') : move(since('s11-stake'), 0.1, 'raise', 'reach'), ghost > 0 ? 'proud' : 'determined', 0.6)}
      </g>);
    }
    case 'two-towns': {
      // two town pins glow while the rest of the county stays grey
      const q = p('s12-two');
      return svg(<g>
        <MapPanel tint="#202842">
          <path d="M80 120 L760 80 L860 300 L820 600 L400 680 L120 560 Z" fill="#3a4060" stroke="#6a7090" strokeWidth={6} strokeLinejoin="round" />
          <circle cx={300} cy={250} r={lerp(0, 120, ease(q))} fill="#3ee08a" opacity={0.3} />
          <circle cx={520} cy={330} r={lerp(0, 120, ease(clamp01(q * 1.3 - 0.2)))} fill="#3ee08a" opacity={0.3} />
        </MapPanel>
        <Tag x={360} y={620} text="Friendswood" p={q} size={50} />
        <Tag x={600} y={830} text="League City" p={clamp01(q * 1.3 - 0.2)} size={50} />
        <Tag x={540} y={1080} text="Rest of the county, not yet" p={clamp01(q * 1.5 - 0.5)} size={40} c="#c9cfe0" />
      </g>);
    }
    case 'creek-dawn': {
      // next dawn: the resident sets the chair back on the bank with her green phone on the armrest, the neighbour waves
      const q = p('s12-dawn');
      return svg(<g>
        {farHouses(1150, 0.3)}
        <Creek bankY={1330} bedY={1560} level={1490} frame={frame} x0={470} x1={860} />
        <FloodSensor x={960} y={1330} s={0.72} frame={frame} facing={-1} arm={380} waterY={1490} mood="happy" />
        <LawnChair x={lerp(460, 560, ease(q))} y={1820} s={1.25} folded={1 - ease(clamp01(q * 1.6))} phone={q > 0.6 ? 'green' : null} mug={q > 0.6} frame={frame} />
        {nb(900, 1532, 1.35, move(t, 0.8, 'hold', 'wave'), 'happy', 0.5, {holding: undefined})}
        {res(200, 1616, 1.6, move(t, 0.3, 'reach', 'point'), q > 0.5 ? 'happy' : 'neutral', 0.6)}
      </g>);
    }
    case 'sensor-wave': {
      // the sensor blinks green and waves back at the neighbours over the chair with its green phone
      const w = since('s12-wave');
      const sway = w > 0 ? Math.sin(w * 9) * 14 * Math.max(0, 1 - w / 1.6) : 0;
      return svg(<g>
        <Creek bankY={1560} bedY={1820} level={1720} frame={frame} x0={240} x1={900} />
        <FloodSensor x={1010} y={1570} s={1.3} frame={frame} facing={-1} arm={330} waterY={1720} mood="happy" tilt={sway} />
        <LawnChair x={150} y={1620} s={1.05} phone="green" mug frame={frame} />
        {res(330, 1616, 1.6, {pose: 'wave'}, 'happy', 0.8)}
        <Glow x={1010} y={1570 - 1028 * 1.3} r={90} color="#7dff8a" opacity={0.4} />
      </g>);
    }
    default:
      return svg(<g>
        <Creek bankY={1330} bedY={1560} level={1480} frame={frame} />
        <FloodSensor x={960} y={1330} s={0.72} frame={frame} facing={-1} arm={380} waterY={1480} mood="happy" />
      </g>);
  }
};

export default CreekWatchFilm;
// keep a few kit names referenced for future passes without tripping the linter
void ContactShadow; void light; void shade; void SKY_GREY; void wobble; void RES_SKIN;
