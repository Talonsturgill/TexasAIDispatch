import React from 'react';
import {useCurrentFrame} from 'remotion';
import type {FilmRenderProps} from '../../../modern/types';
import {actionWindows, type DirectedScene} from '../../../lib/direction';
import {Figure, castV2, type FigureEmotion, type FigurePose, type FigureProps} from '../../../look/Figure';
import {Burst, ContactShadow, Glow, ScanBox, clamp01, ease, easeOutBack, lerp} from '../../../look/Kit';
import {TabletV2} from '../../../look/machines';
import {MapPinV2} from '../../../look/props';
import {line, light, shade} from '../../../look/color';
import {FONT} from '../../../lib/type';
import {BigNumber, Conveyor, PanelBot, Posts, Rover, SolarTable, SunFace} from './parts';

/**
 * sets-it-down-1114 (November 14th, 2026): "Who sets it down". At Tormes Solar in Navarro County a
 * factory line parked in the field builds solar tables with robots and an AI check, rovers carry them
 * out, and people still set each one on its supports.
 *
 * The hero is the gantry robot with a face (parts.tsx PanelBot). The person is a SOLV crew member,
 * illustrative, drawn from the v2 cast (`engineer`). The throughline is one solar table: a bare tube,
 * fastened, checked green, on a rover, set on posts, tilted to the sun. Every state comes from the
 * film clock through the board's event windows. Disclosed illustration, no brand marks.
 */
const svg = (children: React.ReactNode) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>{children}</svg>
);

const LEAD = castV2('engineer');
const CREW2: Partial<FigureProps> = {...castV2('technician'), hat: 'hardhat', hatColor: '#ffffff', top: 'hivis', shirt: '#ff8a1f',
  trim: '#eef3fa'};
const CREW3: Partial<FigureProps> = {...castV2('trucker'), hat: 'hardhat', hatColor: '#ff8a1f', top: 'hivis', shirt: '#2f6fb8',
  trim: '#f7e04a'};
const EXTRA: Partial<FigureProps>[] = [
  {...castV2('farmer'), hat: 'hardhat', hatColor: '#ffc93c', top: 'hivis', shirt: '#2fa36b', trim: '#eef3fa'},
  {...castV2('resident'), hat: 'hardhat', hatColor: '#ffffff', top: 'coveralls', shirt: '#7a5bd1', pants: '#7a5bd1', glasses: false},
  {...castV2('hydrologist'), hat: 'hardhat', hatColor: '#ff8a1f'},
  {...castV2('lineworker')},
  {...castV2('nurse'), hat: 'hardhat', hatColor: '#ffc93c', top: 'hivis', shirt: '#e85d75', trim: '#eef3fa'},
  {...castV2('coder'), hat: 'hardhat', hatColor: '#ffffff', top: 'coveralls', shirt: '#2f6fb8', pants: '#2f6fb8'},
];

/** a pose change that travels from the last pose over 0.35 s */
const move = (t: number, at: number, before: FigurePose, after: FigurePose) => (
  t < at ? {pose: before} : {pose: after, fromPose: before, poseBlend: clamp01((t - at) / 0.35)}
);

/** a panel in two hands, in figure units */
const HeldPanel: React.FC<{w?: number}> = ({w = 300}) => (
  <g transform="translate(0 -20)">
    <path d={`M${-w / 2} 30 L${w / 2} 30 L${w / 2 + 40} -60 L${-w / 2 + 40} -60 Z`} fill="#24306b" stroke="#141a40" strokeWidth={10}
      strokeLinejoin="round" />
    <path d={`M${-w / 4} 10 L${-w / 4 + 30} -40`} stroke="#bcd3ff" strokeWidth={14} strokeLinecap="round" opacity={0.3} />
  </g>
);

/** a crate of panels, for the mountain */
const Crate: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-80} y={-70} width={160} height={70} rx={16} fill="#c99a5b" stroke={line('#c99a5b')} strokeWidth={6} />
    {[-50, -20, 10, 40].map((k) => <rect key={k} x={k} y={-64} width={18} height={58} rx={6} fill="#24306b" />)}
    <rect x={-80} y={-70} width={160} height={14} rx={7} fill={light('#c99a5b', 0.4)} />
  </g>
);

/** sweat drops that fall from a head, for straining people */
const Sweat: React.FC<{x: number; y: number; t: number}> = ({x, y, t}) => (
  <g>{[0, 1].map((i) => {
    const k = ((t * 1.3 + i * 0.5) % 1);
    return <path key={i} d={`M${x + i * 40} ${y + k * 60} q8 14 0 20 q-8 -6 0 -20Z`} fill="#8fd3ff" opacity={1 - k} />;
  })}</g>
);

/** the canopy and line, the "factory in the field": conveyor, gantry, table. Ground at y. */
const FactoryLine: React.FC<{x: number; y: number; s?: number; frame: number; botCx: number; drop: number; holding: boolean;
  modules: number; checked?: number; flag?: number; tableX?: number; mood?: 'happy' | 'focused' | 'worried' | 'surprised';
  canopy?: number; wheels?: boolean; belt?: number}> = ({x, y, s = 1, frame, botCx, drop, holding, modules, checked = 0, flag = 0,
  tableX = 0, mood = 'focused', canopy = 1, wheels = false, belt = 0.6}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {canopy > 0 && <g transform={`translate(0 -1180) scale(1 ${canopy})`}>
      <path d="M-700 60 Q0 -110 700 60 L700 110 L-700 110 Z" fill="#f2f4fb" stroke={line('#dfe4f2')} strokeWidth={8} strokeLinejoin="round" />
      <path d="M-640 54 Q0 -80 640 54" stroke="#ffffff" strokeWidth={14} fill="none" strokeLinecap="round" opacity={0.7} />
    </g>}
    {canopy > 0 && [-660, 660].map((k) => <rect key={k} x={k - 16} y={-1080 * canopy} width={32} height={1080 * canopy} rx={14}
      fill="#c9cfe3" stroke={line('#c9cfe3')} strokeWidth={5} />)}
    <Conveyor x={-640} y={0} w={1280} frame={frame} speed={belt} />
    <SolarTable x={tableX} y={-262} s={0.82} modules={modules} checked={checked} flag={flag} />
    <PanelBot x={0} y={0} s={1} frame={frame} cx={botCx} drop={drop} holding={holding} mood={mood} />
    {wheels && [-520, -200, 200, 520].map((k) => <g key={k} transform={`translate(${k} 20)`}>
      <circle r={44} fill="#24213a" /><circle r={22} fill="#d9dde8" /></g>)}
  </g>
);

export const SetsItDownFilm: React.FC<FilmRenderProps> = ({board, shot, time_s, shot_s}) => {
  const frame = useCurrentFrame();
  const W = actionWindows(board.scenes as DirectedScene[]);
  /** eased progress of a beat's window, 0 before it, 1 after */
  const p = (id: string) => {
    const w = W[id];
    if (!w) return 0;
    const q = clamp01((time_s - w.start) / (w.end - w.start));
    return q * q * (3 - 2 * q);
  };
  /** seconds since a beat opened (negative before) */
  const since = (id: string) => (W[id] ? time_s - W[id].start : -1);
  const lead = (x: number, y: number, scale: number, pose: object, emotion: FigureEmotion, turn = 0.4, extra: Partial<FigureProps> = {}) => (
    <Figure frame={frame} x={x} y={y} scale={scale} {...LEAD} {...pose} emotion={emotion} turn={turn} seed={3} {...extra} />
  );

  switch (shot.view) {
    case 'hand-off': {
      // she holds the panel, the gantry's cups come down, take it, carry it right and lay it on the bare tube
      const t = shot_s;
      const GRAB = 0.7, LAY = 2.0;
      const toTube = ease((t - GRAB) / (LAY - GRAB));
      const botCx = t < GRAB ? -0.85 : lerp(-0.85, 0.15, toTube);
      const drop = t < GRAB ? lerp(0.3, 0.75, ease(t / GRAB)) : t < LAY ? lerp(0.75, 0.35, Math.sin(toTube * Math.PI)) + 0.0 : lerp(0.75, 0.2, ease((t - LAY) / 0.8));
      const laid = t >= LAY;
      return svg(
        <g>
          <FactoryLine x={640} y={1460} s={0.78} frame={frame} botCx={botCx} drop={laid ? drop : drop} holding={t >= GRAB && !laid}
            modules={laid ? 1 : 0} tableX={120} canopy={0} mood={laid ? 'happy' : 'focused'} belt={0} />
          <Burst x={640 + 0.78 * (120 - 3 * 158 + 75)} y={1460 - 0.78 * 300} p={(t - LAY) / 0.6} color="#ffe066" />
          {lead(250, 1700, 1.75, t < GRAB ? {pose: 'hold', holding: <HeldPanel />} : move(t, GRAB, 'hold', 'raise'),
            t < GRAB ? 'determined' : t < LAY + 0.4 ? 'surprised' : 'happy', 0.7)}
          {t < GRAB && <Sweat x={300} y={760} t={t} />}
        </g>,
      );
    }
    case 'prairie-wide': {
      // rows of steel posts on the prairie; a pin drops near Barry. At the end the row carries tables tilted to the sun
      const ending = shot.scene_id === 's13';
      const pin = easeOutBack(clamp01(since('s1-pin') / 0.7));
      const tilt = ending ? -16 * ease(since('s13-row') / 1.6) : 0;
      return svg(
        <g>
          {ending && <SunFace x={860} y={560} r={90} frame={frame} smile={1} />}
          {[[180, 1090, 0.42, 7], [60, 1220, 0.62, 6], [-80, 1420, 0.95, 5]].map(([x, y, s, n], r) => (
            <g key={r}>
              <Posts x={x} y={y} s={s} n={n} gap={260} />
              {ending && Array.from({length: n}).map((_, i) => (
                <SolarTable key={i} x={x + (i * 260 + 130) * s} y={y - 240 * s} s={s * 0.3} modules={6} checked={1} tilt={tilt} shadow={false} />
              ))}
            </g>
          ))}
          {!ending && <MapPinV2 x={700} y={1060} s={1.3} p={pin} label="NEAR BARRY" />}
          {lead(820, 1700, 1.45, ending ? {pose: 'hips'} : move(shot_s, 0.8, 'stand', 'point'),
            ending ? 'proud' : 'determined', -0.5)}
        </g>,
      );
    }
    case 'site-sign': {
      // a site sign swings up; two crew members walk past with a tablet
      const up = shot.id === 's2-d' ? 1 : easeOutBack(clamp01(shot_s / 0.9), 1.4);
      const walk = shot_s;
      const x1 = shot.id === 's2-d' ? lerp(330, 470, ease(shot_s / 3)) : lerp(150, 330, ease(shot_s / 4));
      const grin = since('s2-crew') > 0;
      return svg(
        <g>
          <g transform={`translate(620 1300) rotate(${(1 - up) * -80})`}>
            <ContactShadow x={0} y={10} w={560} />
            {[-200, 200].map((k) => <rect key={k} x={k - 18} y={-420} width={36} height={430} rx={16} fill="#9aa6c4" stroke={line('#9aa6c4')} strokeWidth={6} />)}
            <rect x={-290} y={-700} width={580} height={320} rx={48} fill="#1d3c78" stroke={line('#1d3c78')} strokeWidth={10} />
            <rect x={-270} y={-680} width={540} height={60} rx={30} fill={light('#1d3c78', 0.3)} opacity={0.5} />
            <text x={0} y={-570} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={64} fill="#ffffff">TORMES SOLAR</text>
            <text x={0} y={-470} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={84} fill="#ffcc33">457 MW</text>
          </g>
          <Figure frame={frame} x={x1 + 210} y={1680} scale={1.25} {...CREW2} pose="stand" walk={walk} emotion="happy" turn={-0.4} seed={9} />
          {lead(x1, 1720, 1.35, {pose: 'hold', holding: <g transform="scale(0.25)"><TabletV2 x={0} y={0} /></g>}, grin ? 'excited' : 'happy', 0.5,
            {walk})}
        </g>,
      );
    }
    case 'rows-overhead': {
      // overhead: the field of post rows; the 457 counter counts up over it
      const c = p('s2-mw');
      const drift = shot_s * 14;
      return svg(
        <g>
          <defs><radialGradient id="ro-g" cx="40%" cy="30%" r="90%"><stop offset="0%" stopColor="#5a4636" /><stop offset="100%" stopColor="#2e2420" />
          </radialGradient></defs>
          <rect x={-100} y={-100} width={1280} height={2120} fill="url(#ro-g)" />
          {Array.from({length: 14}).map((_, r) => (
            <g key={r} transform={`translate(${-60 - drift} ${200 + r * 120})`}>
              <rect x={0} y={-6} width={1300} height={12} rx={6} fill="#9aa6c4" opacity={0.75} />
              {Array.from({length: 14}).map((__, i) => <circle key={i} cx={i * 100 + (r % 2) * 50} cy={0} r={11} fill="#cfd6ea" />)}
              {r < 5 && <rect x={40} y={-34} width={260 + r * 120} height={68} rx={14} fill="#24306b" stroke="#3c63c9" strokeWidth={4} />}
            </g>
          ))}
          <ellipse cx={760} cy={1120} rx={180} ry={110} fill="#d6b56a" opacity={0.25} />
          <BigNumber x={540} y={1020} value={457} p={c} unit="MW" caption="TORMES SOLAR" />
        </g>,
      );
    }
    case 'old-way': {
      // two workers heave a panel onto a tube already standing in the field; one slides and they catch it
      const slip = p('s3-one');
      const slide = Math.sin(slip * Math.PI) * 50;
      const t = shot_s;
      return svg(
        <g>
          <Posts x={300} y={1420} s={1.1} n={3} gap={240} />
          <rect x={200} y={1140} width={720} height={30} rx={15} fill="#9aa6c4" stroke={line('#9aa6c4')} strokeWidth={6} />
          <g transform={`translate(${540 + slide} ${960 - 60 * p('s3-heave') + 60 * slip + Math.sin(t * 3) * 6}) rotate(${-4 + slide * 0.12})`}>
            <path d="M-200 60 L200 60 L250 -60 L-150 -60 Z" fill="#24306b" stroke="#141a40" strokeWidth={10} strokeLinejoin="round" />
            <path d="M-60 40 L-20 -40" stroke="#bcd3ff" strokeWidth={16} strokeLinecap="round" opacity={0.3} />
          </g>
          <Figure frame={frame} x={250} y={1660} scale={1.35} {...CREW2} {...move(t, W['s3-one'] ? W['s3-one'].start - (time_s - t) : 99, 'cheer', 'panic')}
            emotion={slip > 0 && slip < 1 ? 'surprised' : 'worried'} turn={0.6} seed={5} />
          <Figure frame={frame} x={840} y={1680} scale={1.4} {...CREW3} pose="cheer" emotion="worried" turn={-0.6} seed={8} />
          <Sweat x={240} y={850} t={t} /><Sweat x={830} y={850} t={t + 0.4} />
          <Burst x={540} y={1000} p={since('s3-heave') / 0.7} color="#ffffff" n={8} r={160} />
        </g>,
      );
    }
    case 'panel-mountain': {
      // crates of panels tower out of the field until they dwarf her
      const g = ease(0.45 + shot_s / 2.2);
      const rows = 9;
      const crates: React.ReactNode[] = [];
      for (let r = 0; r < rows; r++) {
        const n = rows - r;
        const show = clamp01(g * rows * 1.1 - r);
        for (let i = 0; i < n; i++) {
          const x = 640 + (i - (n - 1) / 2) * 200;
          crates.push(<g key={`${r}-${i}`} opacity={show}><Crate x={x} y={1430 - r * 96 - (1 - show) * 60} s={1.35} /></g>);
        }
      }
      return svg(
        <g>
          <ContactShadow x={640} y={1470} w={1500} opacity={0.35} />
          {crates}
          {lead(170, 1720, 1.3, move(shot_s, 1.0, 'stand', 'shrug'), shot_s < 1.0 ? 'worried' : 'surprised', 0.8)}
        </g>,
      );
    }
    case 'flip-diagram': {
      // the order flips: old way on top, new way below; then a pin on Berkeley with a dashed line to Texas
      const f = ease(clamp01((shot_s - 2.0) / 1.0));
      const berk = clamp01((shot_s - 3.2) / 0.8);
      const card = (y: number, title: string, a: string, b: string, color: string, k: number) => (
        <g transform={`translate(540 ${y}) scale(1.12 ${(Math.abs(Math.cos(k * Math.PI)) * 0.98 + 0.02) * 1.12})`}>
          <rect x={-440} y={-170} width={880} height={340} rx={56} fill="#ffffff" stroke={line('#ffffff')} strokeWidth={5} />
          <rect x={-440} y={-170} width={880} height={70} rx={35} fill={color} />
          <text x={0} y={-118} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={42} fill="#ffffff">{title}</text>
          <text x={-220} y={30} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={40} fill="#2b2440">{a}</text>
          <text x={220} y={30} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={40} fill="#2b2440">{b}</text>
          <path d="M-60 16 L40 16 M20 -6 L50 16 L20 38" stroke={color} strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <text x={-220} y={90} textAnchor="middle" fontFamily={FONT.body} fontWeight={700} fontSize={30} fill="#6b6788">step 1</text>
          <text x={220} y={90} textAnchor="middle" fontFamily={FONT.body} fontWeight={700} fontSize={30} fill="#6b6788">step 2</text>
        </g>
      );
      return svg(
        <g>
          {card(720, f < 0.5 ? 'THE OLD WAY' : 'TERAFAB', f < 0.5 ? 'Tubes in field' : 'Build table', f < 0.5 ? 'Panels by hand' : 'Carry it out',
            f < 0.5 ? '#9a7bd1' : '#2fa36b', f)}
          <g opacity={berk}>
            <MapPinV2 x={220} y={1260} s={0.9} p={berk} label="BERKELEY, CA" color="#3d7bd9" />
            <MapPinV2 x={860} y={1300} s={0.9} p={clamp01(berk * 1.3 - 0.3)} label="NAVARRO COUNTY" />
            <path d={`M220 1240 Q540 ${1000} 860 1280`} stroke="#3d7bd9" strokeWidth={10} strokeDasharray="26 22" fill="none"
              strokeLinecap="round" strokeDashoffset={-frame * 2} opacity={berk} />
          </g>
        </g>,
      );
    }
    case 'factory-arrive': {
      // the line rolls in on wheels and the canopy unfolds; she points, amazed
      const roll = ease(clamp01(0.35 + shot_s / 2.0));
      const cano = easeOutBack(clamp01((shot_s - 0.9) / 0.8), 1.3);
      return svg(
        <g>
          <FactoryLine x={lerp(1150, 620, roll)} y={1400} s={0.78} frame={frame} botCx={0} drop={0.2} holding={false} modules={0}
            canopy={Math.max(0.02, cano)} wheels mood={roll < 1 ? 'happy' : 'focused'} belt={0} />
          {lead(170, 1720, 1.35, move(shot_s, 0.6, 'stand', 'point'), shot_s < 0.6 ? 'thinking' : 'excited', 0.7)}
        </g>,
      );
    }
    case 'bot-close': {
      // close on the gantry: it lowers panel after panel, each one clicks down; the tube's light ring runs
      const cyc = 1.1;
      const n = Math.min(6, Math.floor(shot_s / cyc) + 1);
      const ph = (shot_s % cyc) / cyc;
      const drop = Math.sin(ph * Math.PI);
      const cx = lerp(-0.7, 0.7, (n - 1) / 5);
      const ring = p('s5-tube');
      return svg(
        <g>
          <FactoryLine x={560} y={1420} s={1.15} frame={frame} botCx={cx} drop={drop} holding={ph < 0.5} modules={n - 1 + (ph >= 0.5 ? 1 : 0)}
            canopy={0} tableX={-30} belt={0} mood="focused" />
          {ring > 0 && ring < 1 && <Glow x={lerp(100, 1000, ring)} y={1120} r={140} color="#7ff5ff" opacity={0.8} />}
          <Burst x={560 + 1.15 * (-30 + (-3 * 158 + 75 + (n - 1) * 158) * 0.82)} y={1420 - 1.15 * 320} p={(ph - 0.5) / 0.4} color="#ffe066" n={8} r={90} />
        </g>,
      );
    }
    case 'line-medium': {
      // the finished table slides along the line past her; she nods
      const slide = ease(shot_s / 3.0);
      return svg(
        <g>
          <FactoryLine x={460} y={1200} s={0.62} frame={frame} botCx={-0.8} drop={0.15} holding={false} modules={6}
            tableX={lerp(-200, 380, slide)} canopy={1} belt={1} mood="happy" />
          {lead(870, 1740, 1.45, move(shot_s, 0.7, 'think', 'hips'), shot_s < 0.7 ? 'surprised' : 'proud', -0.7)}
        </g>,
      );
    }
    case 'scan': {
      // detail: a scan box sweeps panel by panel and each one turns green
      const sw = clamp01(shot_s / 2.4);
      const bx = lerp(90, 830, sw);
      return svg(
        <g>
          <SolarTable x={540} y={930} s={1.05} modules={6} checked={sw} />
          <ScanBox x={bx - 20} y={730} w={190} h={210} frame={frame} lock={0} />
          <rect x={bx + 75} y={650} width={6} height={360} rx={3} fill="#7ff5ff" opacity={0.8} />
          <Glow x={bx + 78} y={830} r={180} color="#7ff5ff" opacity={0.45} />
        </g>,
      );
    }
    case 'tablet-check': {
      // her tablet shows the table; one crooked panel flashes amber, gets nudged square and turns green
      const f = p('s6-flag');
      const fixed = f >= 0.7;
      return svg(
        <g>
          {lead(270, 1880, 2.0, {pose: 'point'}, fixed ? 'happy' : 'thinking', 0.8)}
          <TabletV2 x={700} y={880} scale={0.5} tilt={-5}>
            <rect x={0} y={0} width={1000} height={700} fill="#10173d" />
            {Array.from({length: 6}).map((_, i) => {
              const bad = i === 4 && !fixed;
              return <g key={i} transform={`translate(${90 + i * 140} 260) rotate(${i === 4 && !fixed ? 12 * (f > 0 ? 1 : 0) : 0})`}>
                <rect x={0} y={0} width={120} height={180} rx={18} fill={bad && f > 0 ? (Math.floor(frame / 6) % 2 ? '#ffb020' : '#ffd27a') : '#2fbf71'} />
                {!(bad && f > 0) && <path d="M30 95 L52 120 L92 66" stroke="#ffffff" strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
              </g>;
            })}
            <rect x={90} y={500} width={820} height={18} rx={9} fill="#9aa6c4" />
            <text x={90} y={140} fontFamily={FONT.body} fontWeight={900} fontSize={64} fill="#ffffff">{fixed ? 'ALL OK' : f > 0 ? 'CHECK PANEL' : 'CHECKING'}</text>
          </TabletV2>
          <Burst x={740} y={880} p={(f - 0.7) / 0.3} color="#3ef0a0" />
        </g>,
      );
    }
    case 'hourglass': {
      // an hourglass on the line flips and a finished table slides out on every flip
      const per = 1.6;
      const k = shot_s / per, flip = Math.floor(k), ph = k - flip;
      const rot = ph > 0.85 ? (ph - 0.85) / 0.15 * 180 : 0;
      const sand = clamp01(ph / 0.85);
      return svg(
        <g>
          <FactoryLine x={600} y={1340} s={0.55} frame={frame} botCx={0.6} drop={0.2} holding={false} modules={6} checked={1}
            tableX={lerp(-300, 400, ph)} canopy={1} belt={1.4} mood="happy" />
          {Array.from({length: Math.min(5, flip)}).map((_, i) => <SolarTable key={i} x={900} y={1500 - i * 40} s={0.25} modules={6} checked={1} shadow={i === 0} />)}
          <g transform={`translate(330 800) rotate(${rot})`}>
            <rect x={-130} y={-230} width={260} height={36} rx={18} fill="#c99a5b" stroke={line('#c99a5b')} strokeWidth={6} />
            <rect x={-130} y={194} width={260} height={36} rx={18} fill="#c99a5b" stroke={line('#c99a5b')} strokeWidth={6} />
            <path d="M-100 -194 Q-100 -40 -12 0 Q-100 40 -100 194 L100 194 Q100 40 12 0 Q100 -40 100 -194 Z" fill="#dff3ff" opacity={0.75}
              stroke="#9cc7e6" strokeWidth={6} />
            <path d={`M${-90 * (1 - sand)} ${-194 + 160 * sand} L${90 * (1 - sand)} ${-194 + 160 * sand} L0 -10 Z`} fill="#ffcc4d" />
            <path d={`M-90 190 L90 190 L${90 * (1 - sand * 0.6)} ${190 - 150 * sand} L${-90 * (1 - sand * 0.6)} ${190 - 150 * sand} Z`} fill="#ffcc4d" />
            <path d="M-80 -170 Q-80 -80 -20 -20" stroke="#ffffff" strokeWidth={10} fill="none" opacity={0.6} strokeLinecap="round" />
          </g>
          {lead(880, 1720, 1.3, {pose: 'think'}, flip >= 1 ? 'surprised' : 'thinking', -0.7)}
        </g>,
      );
    }
    case 'stack-count': {
      // day and night spin past while tables keep stacking, then 20 lands with a hit
      const spin = shot_s * 1.4;
      const night = (1 - Math.cos(spin * Math.PI)) / 2;
      const n = Math.min(9, Math.floor(shot_s * 3.2) + 1);
      const num = p('s7-mw');
      return svg(
        <g>
          <rect x={-100} y={-100} width={1280} height={2120} fill="#0d1240" opacity={night * 0.55} />
          <g transform={`translate(540 1500) rotate(${spin * 180})`}>
            <circle cx={0} cy={-900} r={70} fill="#ffd34d" /><circle cx={0} cy={900} r={60} fill="#eef0ff" />
          </g>
          {Array.from({length: n}).map((_, i) => (
            <SolarTable key={i} x={540 + (i % 2 ? 18 : -18)} y={1150 - i * 60} s={0.85} modules={6} checked={1} shadow={i === 0} />
          ))}
          {num > 0 && <BigNumber x={540} y={560} value={20} p={num} unit="MW" plus caption="A WEEK, TERABASE SAYS" />}
          <Burst x={540} y={560} p={(num - 0.95) / 0.05 * 0 + (since('s7-mw') - 2.0) / 0.6} color="#ffcc00" />
        </g>,
      );
    }
    case 'rover-load': {
      // the gantry sets the green table onto the rover; the rover bounces and smiles
      const down = ease(clamp01(shot_s / 1.6));
      const landed = down >= 1;
      const bounce = landed ? Math.sin(clamp01((shot_s - 1.6) / 0.6) * Math.PI) * 14 : 0;
      return svg(
        <g>
          <Rover x={560} y={1150} s={0.95} frame={frame} speed={0} mood={landed ? 'happy' : 'focused'}
            load={landed ? <g transform={`translate(0 ${bounce})`}><SolarTable x={0} y={0} s={0.72} modules={6} checked={1} shadow={false} /></g> : undefined} />
          {!landed && <SolarTable x={500} y={lerp(560, 1150 - 0.95 * 206, down)} s={0.68} modules={6} checked={1} shadow={false} />}
          <g transform="translate(540 1180) scale(0.8)">
            {[-1, 1].map((sd) => <rect key={sd} x={sd * 470 - 30} y={-1020} width={60} height={1020} rx={30} fill="#ffb21f" stroke={line('#ffb21f')} strokeWidth={7} />)}
            <rect x={-530} y={-1080} width={1060} height={80} rx={40} fill="#ffb21f" stroke={line('#ffb21f')} strokeWidth={8} />
            <rect x={-30} y={-1010} width={60} height={lerp(80, 460, down) - (landed ? lerp(0, 380, clamp01((shot_s - 1.7) / 0.6)) : 0)} rx={26} fill="#5a628c" />
          </g>
        </g>,
      );
    }
    case 'rover-ride': {
      // the rover rolls off down the row with the table; she waves; more rovers follow like ducklings
      const go = shot_s;
      const lead1 = lerp(-200, 1250, clamp01(go / 4.5));
      const ducks = p('s8-first') > 0 ? 2 : 0;
      return svg(
        <g>
          <Posts x={120} y={1060} s={0.5} n={6} gap={300} />
          {Array.from({length: 1 + ducks}).map((_, i) => (
            <Rover key={i} x={lead1 - i * 520} y={1140} s={0.6} frame={frame} speed={0.8} mood="happy"
              load={<SolarTable x={0} y={0} s={0.72} modules={6} checked={1} shadow={false} />} />
          ))}
          {lead(160, 1740, 1.35, {pose: 'wave'}, 'happy', 0.7)}
        </g>,
      );
    }
    case 'picky': {
      // the gantry lowers toward an odd panel, stops and shakes its head; the right panel slides in and it grabs it
      const match = p('s5-match');
      const shake = match > 0 ? 0 : Math.sin(shot_s * 18) * 0.06 * clamp01((shot_s - 0.8) / 0.3);
      const drop = match > 0 ? lerp(0.45, 0.85, match) : lerp(0.2, 0.45, ease(shot_s / 0.8));
      return svg(
        <g>
          <PanelBot x={560} y={2100} s={1.7} frame={frame} cx={shake} drop={drop} holding={match >= 1} mood={match > 0 ? 'happy' : 'worried'} />
          <g transform={`translate(${match > 0 ? lerp(560, 1400, match) : 560} 1150) scale(1.5)`}>
            <rect x={-170} y={-60} width={340} height={120} rx={16} fill="#8fc4ff" stroke="#ff7a3c" strokeWidth={14} />
            {Array.from({length: 8}).map((_, i) => <line key={i} x1={-150 + i * 40} y1={-55} x2={-150 + i * 40} y2={55} stroke="#ffffff" strokeWidth={4} opacity={0.7} />)}
          </g>
          {match > 0 && match < 1 && <g transform={`translate(${lerp(-300, 560, match)} 1150) scale(1.5)`}>
            <path d="M-170 60 L170 60 L210 -60 L-130 -60 Z" fill="#24306b" stroke="#141a40" strokeWidth={10} strokeLinejoin="round" /></g>}
          {lead(170, 1800, 1.5, match > 0 ? move(since('s5-match'), 0, 'crossed', 'point') : {pose: 'crossed'}, match > 0 ? 'happy' : 'smug', 0.8)}
          <Burst x={540} y={1020} p={since('s5-odd') > 0 && since('s5-odd') < 0.6 ? since('s5-odd') / 0.6 : -1} color="#ff7a3c" n={6} r={120} />
          <Burst x={540} y={1020} p={(match - 0.9) / 0.1 * 0 + (since('s5-match') - 1.6) / 0.5} color="#ffe066" />
        </g>,
      );
    }
    case 'site-map': {
      // the map zooms out until the robot patch is one small square; a TEST stamp slams on it
      const z = lerp(3.2, 1, ease(shot_s / 2.2));
      const st = clamp01(since('s10-proof') / 0.4);
      return svg(
        <g>
          <g transform={`translate(540 960) scale(${z}) translate(-540 -960)`}>
            <rect x={90} y={460} width={900} height={1000} rx={60} fill="#3a2e28" stroke={line('#3a2e28')} strokeWidth={8} />
            {Array.from({length: 22}).map((_, r) => <rect key={r} x={130} y={500 + r * 43} width={820} height={18} rx={9} fill="#3c63c9" opacity={0.7} />)}
            <rect x={420} y={820} width={170} height={150} rx={20} fill="#ffcc33" stroke="#7a5200" strokeWidth={6} />
            <circle cx={505} cy={895} r={30} fill="#7a5200" />
          </g>
          {st > 0 && <g transform={`translate(560 760) rotate(-12) scale(${lerp(2.2, 1, st)})`} opacity={st}>
            <rect x={-150} y={-60} width={300} height={120} rx={28} fill="none" stroke="#e5484d" strokeWidth={14} />
            <text x={0} y={26} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={80} fill="#e5484d">TEST</text>
          </g>}
          <text x={540} y={1560} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={40} fill="#2b2440" opacity={ease(shot_s / 2)}>Tormes Solar, 457 MW</text>
        </g>,
      );
    }
    case 'fine-print': {
      // a magnifier slides over the fine print under the big two minute number; she squints and shrugs
      const m = ease(clamp01(shot_s / 1.6));
      return svg(
        <g>
          <g transform="translate(560 760)">
            <rect x={-400} y={-300} width={800} height={600} rx={60} fill="#ffffff" stroke={line('#ffffff')} strokeWidth={5} />
            <text x={0} y={-60} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={180} fill="#2b2440">2 MIN</text>
            <text x={0} y={80} textAnchor="middle" fontFamily={FONT.body} fontWeight={700} fontSize={34} fill="#6b6788">Terabase figure, running 24/7</text>
            <text x={0} y={140} textAnchor="middle" fontFamily={FONT.body} fontWeight={700} fontSize={34} fill="#6b6788">Real output depends on the site</text>
          </g>
          <g transform={`translate(${lerp(1000, 610, m)} ${lerp(1100, 900, m)})`}>
            <circle r={130} fill="#dff3ff" opacity={0.35} stroke="#4a3a6a" strokeWidth={18} />
            <path d="M92 92 L190 190" stroke="#4a3a6a" strokeWidth={34} strokeLinecap="round" />
            <path d="M-70 -60 Q-40 -100 10 -104" stroke="#ffffff" strokeWidth={12} fill="none" strokeLinecap="round" opacity={0.7} />
          </g>
          {lead(250, 1820, 1.45, move(shot_s, 1.2, 'think', 'shrug'), shot_s < 1.2 ? 'thinking' : 'smug', 0.6)}
        </g>,
      );
    }
    case 'crew-set': {
      // over their shoulders: both workers grip the ends of the table with both hands, carry it off the rover and set it
      // down on the post caps. The table's ends sit exactly at their hands (Figure 'hold' puts both hands at (0, -200)).
      const t = shot_s;
      const SC = 1.2, FEET = 1290, HANDY = FEET - 200 * SC;
      const carry = ease(clamp01((t - 1.5) / 1.8));
      const down = ease(clamp01((t - 3.2) / 1.6));
      const released = t > 5.7;
      const half = 350;
      const tx = lerp(400, 560, carry);
      const lift = Math.sin(carry * Math.PI) * 40;
      const ty = HANDY - lift + down * 12;
      const walking = carry > 0 && carry < 1 ? t : undefined;
      const workerY = FEET + down * 12;
      const roverX = lerp(-300, 330, ease(clamp01(t / 0.9)));
      const pick = ease(clamp01((t - 1.2) / 0.4));
      return svg(
        <g>
          <Rover x={roverX} y={1250} s={0.55} frame={frame} speed={t < 0.9 ? 0.9 : 0} mood={carry > 0.2 ? 'happy' : 'surprised'} />
          <Posts x={380} y={HANDY + 16 + 236 * 0.9 + 12} s={0.9} n={2} gap={360} />
          {released ? <>
            <Figure frame={frame} x={tx - half - 60} y={FEET + 12} scale={SC} {...LEAD} pose="hips" emotion="happy" turn={0.6} seed={3} />
            <Figure frame={frame} x={tx + half + 60} y={FEET + 12} scale={SC} {...CREW2} pose="cheer" emotion="excited" turn={-0.6} seed={6} />
          </> : null}
          {!released ? <>
            <Figure frame={frame} x={tx - half} y={workerY} scale={SC} {...LEAD} pose={pick < 1 ? 'reach' : 'hold'} walk={walking}
              emotion={t < 1.0 ? 'thinking' : down > 0.5 ? 'happy' : 'determined'} turn={0.7} seed={3} />
            <Figure frame={frame} x={tx + half} y={workerY} scale={SC} {...CREW2} pose={pick < 1 ? 'reach' : 'hold'} walk={walking}
              emotion={down > 0.5 ? 'excited' : 'determined'} turn={-0.7} seed={6} />
          </> : null}
          <SolarTable x={lerp(roverX, tx, pick)} y={lerp(1250 - 0.55 * 206 - 20, ty, pick)} s={0.7} modules={6} checked={1} shadow={false} />
          <Burst x={tx} y={ty} p={(t - 4.8) / 0.6} color="#ffe066" r={200} />
        </g>,
      );
    }
    case 'hands-close': {
      // gloved hands press the table flat on the bearing until it clicks
      const press = Math.sin(clamp01(shot_s / 0.8) * Math.PI / 2);
      const click = shot_s > 0.8;
      const hand = (x: number, sd: number) => (
        <g transform={`translate(${x} ${lerp(900, 980, press)})`}>
          <path d={`M${sd * 160} 900 Q${sd * 60} 500 0 60`} stroke={line('#2f6fb8')} strokeWidth={150} fill="none" strokeLinecap="round" />
          <path d={`M${sd * 160} 900 Q${sd * 60} 500 0 60`} stroke="#2f6fb8" strokeWidth={130} fill="none" strokeLinecap="round" />
          <ellipse cx={0} cy={20} rx={110} ry={80} fill="#f2c94c" stroke={line('#f2c94c')} strokeWidth={8} />
          <ellipse cx={-30} cy={-10} rx={40} ry={20} fill="#fff1b8" opacity={0.6} />
        </g>
      );
      return svg(
        <g transform="translate(0 -260)">
          <rect x={460} y={1000} width={160} height={700} rx={50} fill="#9aa6c4" stroke={line('#9aa6c4')} strokeWidth={8} />
          <rect x={400} y={920} width={280} height={120} rx={50} fill={shade('#9aa6c4', 0.15)} stroke={line('#9aa6c4')} strokeWidth={8} />
          <rect x={-60} y={850} width={1200} height={90} rx={45} fill="#b4bed6" stroke={line('#9aa6c4')} strokeWidth={8} />
          <path d="M-60 850 L1140 850 L1140 700 L-60 700 Z" fill="#24306b" stroke="#141a40" strokeWidth={10} />
          {hand(300, -1)}{hand(780, 1)}
          <Burst x={540} y={900} p={(shot_s - 0.8) / 0.6} color="#ffe066" r={220} />
          {click && <text x={540} y={640} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={90} fill="#ffffff"
            opacity={1 - clamp01((shot_s - 1.3) / 0.6)}>CLICK</text>}
        </g>,
      );
    }
    case 'ghost-arm': {
      // a dashed blueprint robot arm draws itself beside her and copies her reach, still unbuilt
      const draw = ease(clamp01(shot_s / 0.9));
      const reach = (Math.sin(shot_s * 2.4) + 1) / 2;
      const poseNow: FigurePose = reach > 0.5 ? 'reach' : 'hold';
      const sx = 780, sy = 820, ex = 900 + reach * 40, ey = 620 - reach * 60;
      return svg(
        <g>
          <Posts x={560} y={1160} s={0.9} n={2} gap={300} />
          <Glow x={sx} y={sy} r={320} color="#4fd8ff" opacity={0.35 * draw} />
          <g opacity={draw} fill="none" strokeLinecap="round" strokeLinejoin="round">
            {[['#0c3a66', 40, undefined], ['#7fe9ff', 18, '38 22']].map(([c, w, d], i) => (
              <g key={i} stroke={c as string} strokeWidth={w as number} strokeDasharray={d as string | undefined} strokeDashoffset={-frame * 3}>
                <path d={`M${sx} 1150 L${sx} ${sy}`} />
                <path d={`M${sx} ${sy} L${ex} ${ey}`} />
                <rect x={sx - 130} y={1120} width={260} height={70} rx={35} />
                <circle cx={sx} cy={sy} r={56} />
                <circle cx={ex} cy={ey} r={40} />
                <path d={`M${ex} ${ey} l-70 -70 M${ex} ${ey} l70 -70`} />
              </g>
            ))}
          </g>
          <text x={sx} y={500} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={40} fill="#ffffff" stroke="#0c3a66" strokeWidth={8}
            paintOrder="stroke" opacity={draw}>IN DEVELOPMENT</text>
          {lead(300, 1760, 1.5, {pose: poseNow, fromPose: poseNow === 'reach' ? 'hold' : 'reach', poseBlend: clamp01(Math.abs(reach - 0.5) * 4)},
            'thinking', 0.8)}
        </g>,
      );
    }
    case 'crew-wide': {
      // the row fills with crew behind her, hardhats bobbing; she turns and grins
      const fill = p('s2-jobs');
      const n = 3 + Math.round(fill * (EXTRA.length - 3));
      return svg(
        <g>
          {EXTRA.slice(0, n).map((c, i) => (
            <Figure key={i} frame={frame} x={130 + i * 165} y={1250 + (i % 2) * 40} scale={0.8} {...c} pose={i % 3 ? 'stand' : 'wave'}
              emotion="happy" turn={-0.2} seed={11 + i} />
          ))}
          <Figure frame={frame} x={880} y={1640} scale={1.15} {...CREW3} pose="cheer" emotion="excited" turn={-0.4} seed={8} />
          <Figure frame={frame} x={640} y={1680} scale={1.15} {...CREW2} pose="wave" emotion="happy" turn={-0.3} seed={6} />
          {lead(260, 1740, 1.35, fill > 0 ? move(since('s2-jobs'), 0, 'hips', 'cheer') : {pose: 'hips'}, fill > 0 ? 'excited' : 'happy', 0.6)}
        </g>,
      );
    }
    case 'crew-walk': {
      // low and close: the two crew stride down the post row with the tablet, grinning at each other
      const x0 = lerp(260, 420, ease(shot_s / 3));
      return svg(
        <g>
          <Posts x={-120} y={1180} s={1.05} n={6} gap={260} />
          <Figure frame={frame} x={x0 + 380} y={1900} scale={2.0} {...CREW2} pose="point" walk={shot_s} emotion="excited" turn={-0.6} seed={9} />
          {lead(x0, 1960, 2.1, {pose: 'hold', holding: <g transform="scale(0.22)"><TabletV2 x={0} y={0} /></g>}, 'happy', 0.6, {walk: shot_s})}
        </g>,
      );
    }
    case 'strain-close': {
      // close and low: two straining faces and four hands push the heavy glass the last few inches
      const push = ease(clamp01(shot_s / 1.6));
      return svg(
        <g>
          <g transform={`translate(540 ${lerp(1010, 930, push)}) rotate(-3)`}>
            <path d="M-420 60 L420 60 L500 -90 L-340 -90 Z" fill="#24306b" stroke="#141a40" strokeWidth={12} strokeLinejoin="round" />
            <path d="M-120 40 L-60 -70" stroke="#bcd3ff" strokeWidth={22} strokeLinecap="round" opacity={0.3} />
          </g>
          <Figure frame={frame} x={250} y={2250} scale={2.5} {...CREW2} pose="cheer" emotion="worried" turn={0.5} seed={5} />
          <Figure frame={frame} x={830} y={2270} scale={2.5} {...CREW3} pose="cheer" emotion={push > 0.9 ? 'determined' : 'worried'} turn={-0.5} seed={8} />
          <Sweat x={250} y={700} t={shot_s} /><Sweat x={820} y={700} t={shot_s + 0.4} />
        </g>,
      );
    }
    case 'sun-tilt': {
      // the table she set down tilts on its posts to face the smiling sun; she wipes her brow
      const tilt = -18 * ease(clamp01(shot_s / 2.2));
      return svg(
        <g>
          <SunFace x={830} y={560} r={110 * (1 + 0.15 * p('s13-sun'))} frame={frame} smile={clamp01(shot_s / 2) + 0.4 * p('s13-sun')} />
          {p('s13-sun') > 0 && p('s13-sun') < 1 && <Glow x={lerp(400, 820, p('s13-sun'))} y={1120} r={160} color="#ffffff" opacity={0.8} />}
          <Posts x={420} y={1440} s={1.1} n={2} gap={340} />
          <SolarTable x={610} y={1180} s={0.72} modules={6} checked={1} tilt={tilt} shadow={false} />
          {lead(200, 1740, 1.45, since('s13-sun') > 0 ? move(since('s13-sun'), 0, 'hips', 'cheer') : move(shot_s, 1.2, 'stand', 'hips'), since('s13-sun') > 0 ? 'excited' : shot_s < 1.2 ? 'happy' : 'proud', 0.7)}
        </g>,
      );
    }
    case 'cold-open': {
      // the rover brakes at bare posts with a finished table; its eyes look up at her; she steps in, gloves up
      const t = shot_s;
      const BRAKE = 1.1;
      const arrive = ease(clamp01(t / BRAKE));
      const rx = lerp(-300, 420, arrive);
      const rock = t > BRAKE ? Math.sin(clamp01((t - BRAKE) / 0.7) * Math.PI * 2) * 8 * (1 - clamp01((t - BRAKE) / 0.7)) : 0;
      const step = ease(clamp01((t - 0.3) / 1.2));
      return svg(
        <g>
          <Posts x={300} y={1180} s={0.75} n={4} gap={300} />
          <Rover x={rx} y={1160} s={0.95} frame={frame} speed={t < BRAKE ? 0.9 : 0} mood={t < BRAKE ? 'focused' : 'surprised'}
            load={<g transform={`rotate(${rock})`}><SolarTable x={0} y={0} s={0.74} modules={6} checked={1} shadow={false} /></g>} />
          <Burst x={rx + 60} y={950} p={(t - BRAKE) / 0.6} color="#ffe066" />
          {t > BRAKE && <path d={`M${rx + 300} 840 q20 -40 0 -80`} stroke="#ffffff" strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.8 - clamp01((t - BRAKE) / 1)} />}
          {lead(lerp(1000, 930, step), 1760, 1.6, move(t, 0.3, 'stand', 'reach'), t < 0.3 ? 'thinking' : 'determined', -0.7)}
        </g>,
      );
    }
    case 'patch-field': {
      // the yellow factory line shrinks to a small patch at the edge of a huge field; a stamp slams on it
      const z = lerp(1.0, 0.32, ease(clamp01(shot_s / 2.2)));
      const st = clamp01(since('s10-proof') / 0.4);
      const px = lerp(560, 760, ease(clamp01(shot_s / 2.2))), py = lerp(1320, 1100, ease(clamp01(shot_s / 2.2)));
      return svg(
        <g>
          {[[0, 1110, 0.36, 9], [-60, 1180, 0.48, 8], [-120, 1290, 0.66, 7]].map(([x, y, s2, n], r) => (
            <Posts key={r} x={x} y={y} s={s2} n={n} gap={300} />))}
          <FactoryLine x={px} y={py} s={0.55 * z} frame={frame} botCx={Math.sin(shot_s * 2) * 0.5} drop={0.4} holding={false} modules={4}
            canopy={1} belt={1} mood="focused" />
          {st > 0 && <g transform={`translate(${px} ${py - 330 * z}) rotate(-10) scale(${lerp(2.2, 1, st)})`} opacity={st}>
            <rect x={-230} y={-56} width={460} height={112} rx={28} fill="#ffffff" opacity={0.85} />
            <rect x={-230} y={-56} width={460} height={112} rx={28} fill="none" stroke="#e5484d" strokeWidth={12} />
            <text x={0} y={-6} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={44} fill="#e5484d">PROOF OF</text>
            <text x={0} y={40} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={44} fill="#e5484d">CONCEPT</text>
          </g>}
          {lead(190, 1780, 1.55, {pose: 'think'}, 'thinking', 0.8)}
        </g>,
      );
    }
    case 'row-crane': {
      // crane up and away: her table is one of a long receding row, all tilting toward the sun
      const up = ease(clamp01(shot_s / 3));
      const tilt = -14 * ease(clamp01(since('s13-row') / 1.4));
      const sc = lerp(1, 0.7, up);
      return svg(
        <g>
          <defs><linearGradient id="rc-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8cc4ff" /><stop offset="22%" stopColor="#5a4a3e" />
            <stop offset="100%" stopColor="#241e1b" /></linearGradient></defs>
          <rect x={-100} y={-100} width={1280} height={2120} fill="url(#rc-g)" />
          <SunFace x={860} y={260} r={80} frame={frame} smile={1} />
          <g transform={`translate(540 1000) scale(${sc}) translate(-540 -1000)`}>
            {Array.from({length: 7}).map((_, r) => {
              const y = 600 + r * 180, s2 = 0.3 + r * 0.09;
              return <g key={r}>{Array.from({length: 4}).map((__, i) => (
                <g key={i}><Posts x={540 + (i - 1.5) * 1000 * s2 * 0.95 - 200 * s2} y={y + 230 * s2} s={s2} n={2} gap={400} />
                  <SolarTable x={540 + (i - 1.5) * 1000 * s2 * 0.95} y={y} s={s2} modules={6} checked={1} tilt={tilt} /></g>))}</g>;
            })}
            <Figure frame={frame} x={430} y={1820} scale={0.9} {...LEAD} pose="wave" emotion="happy" turn={0.3} seed={3} />
          </g>
        </g>,
      );
    }
    default:
      return svg(<g>{lead(540, 1700, 1.4, {pose: 'stand'}, 'neutral')}</g>);
  }
};
