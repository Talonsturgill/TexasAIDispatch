import React from 'react';
import {useCurrentFrame} from 'remotion';
import type {FilmRenderProps} from '../../../modern/types';
import {actionWindows, type DirectedScene} from '../../../lib/direction';
import {Figure, castV2, type FigureEmotion, type FigurePose, type FigureProps} from '../../../look/Figure';
import {Burst, ContactShadow, Glow, clamp01, ease, easeOutBack, lerp} from '../../../look/Kit';
import {line, light, shade} from '../../../look/color';
import {DogV2} from '../../../look/props';
import {TabletV2} from '../../../look/machines';
import {BrickRanchV2} from '../../../look/shelf/homeplace';
import {
  CityMap, CrewTruck, Headphones, Jug, ListeningRod, LitBox, Mark, Orbit, Poi, Satellite, StreetSection, ValveLid, Wave, Word,
  after, pop,
} from './parts';

/**
 * leak-satellite-1122 (November 22nd, 2026): "The satellite points". Arlington Water Utilities in Tarrant County
 * piloted satellite leak detection. ASTERRA scans the whole city, an algorithm turns the scan into points of
 * interest, and the city's three-person leak team listens with acoustic gear before anyone digs. A second pilot,
 * Paradigm, puts people on the data. A dog named Splash sniffs for chlorine. Every fact is in claims.json.
 *
 * Hero: the satellite with a face. Throughline: the leak technician's tablet map, blank, one pin, 340 pins with 34
 * green checks, and at the end one pin turned to a green check over a dry street. People are illustrative from the
 * v2 cast. No real person's likeness, no city or vendor mark.
 */
const TECH: Partial<FigureProps> = {...castV2('hydrologist'), hair: 'bun', hairColor: '#1c1512'};
const CREW: Partial<FigureProps> = {...castV2('engineer')};
const MATE: Partial<FigureProps> = {...castV2('technician'), top: 'hivis', shirt: '#22406b', trim: '#eef3fa'};
const RES: Partial<FigureProps> = {...castV2('resident')};
const ANALYST: Partial<FigureProps> = {...castV2('technician')};
const ANALYST2: Partial<FigureProps> = {...castV2('coder')};
const SUPER: Partial<FigureProps> = {...castV2('dctech')};

const move = (t: number, at: number, before: FigurePose, after2: FigurePose) => (
  t < at ? {pose: before} : {pose: after2, fromPose: before, poseBlend: clamp01((t - at) / 0.35)}
);

/** the tablet's screen: the city map with pins, drawn in the tablet's own screen box */
const TabletMap: React.FC<{frame: number; lines: number; pins: number; checks: number; one?: number; oneDone?: number}> = ({
  frame, lines, pins, checks, one = 0, oneDone = 0}) => {
  const pts = Array.from({length: 340}, (_, i) => [90 + ((i * 137) % 720), 110 + ((i * 271) % 680)]);
  const shown = Math.round(340 * clamp01(pins));
  const green = Math.round(34 * clamp01(checks));
  return (
    <CityMap x={0} y={0} w={900} h={900} grid={lines}>
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <path key={k} d={`M${100 + k * 130} 120 Q${160 + k * 120} 460 ${120 + k * 130} 820`} stroke="#2f86d6" strokeWidth={8} fill="none"
          strokeDasharray="1400" strokeDashoffset={1400 * (1 - clamp01(lines * 1.2 - k * 0.04))} strokeLinecap="round" opacity={0.85} />
      ))}
      {[0, 1, 2, 3, 4].map((k) => (
        <path key={`h${k}`} d={`M90 ${170 + k * 150} Q450 ${140 + k * 150} 820 ${190 + k * 150}`} stroke="#2f86d6" strokeWidth={8} fill="none"
          strokeDasharray="1400" strokeDashoffset={1400 * (1 - clamp01(lines * 1.2 - 0.1 - k * 0.04))} strokeLinecap="round" opacity={0.85} />
      ))}
      {pts.slice(0, shown).map(([px, py], i) => {
        const isGreen = i % 10 === 3 && Math.floor(i / 10) < green;
        const grey = checks > 0 && !isGreen;
        return <circle key={i} cx={px} cy={py} r={isGreen ? 16 : 9} fill={isGreen ? '#2fbf71' : grey ? '#b9bfcf' : '#f2b43c'}
          stroke={isGreen ? '#16643b' : grey ? '#8e95a8' : '#a8721a'} strokeWidth={3} />;
      })}
      {one > 0 && (
        <g transform={`translate(450 ${lerp(-200, 470, ease(clamp01(one * 1.4)))})`}>
          {oneDone > 0 ? <Mark x={0} y={-40} on={oneDone} ok s={1.6} /> : (
            <g transform={`scale(${1 + 0.15 * Math.sin(clamp01(one) * Math.PI * 2)})`}>
              <Poi x={0} y={0} on={1} c="#f2b43c" r={48} frame={frame} />
              <path d="M0 -10 C-50 -80 -54 -150 0 -164 C54 -150 50 -80 0 -10Z" fill="#f2b43c" stroke="#8a5a10" strokeWidth={8} />
              <circle cx={0} cy={-110} r={22} fill="#fff6e6" />
            </g>
          )}
        </g>
      )}
    </CityMap>
  );
};

/** a calendar block whose pages flip, `flip` counts pages turned */
const Calendar: React.FC<{x: number; y: number; flip: number; s?: number}> = ({x, y, flip, s = 1}) => {
  const n = Math.floor(flip);
  const f = flip - n;
  const label = n < 3 ? 'WEEKS' : 'MONTHS';
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ContactShadow x={0} y={160} w={260} opacity={0.3} />
      <LitBox x={-130} y={-150} w={260} h={300} r={30} c="#fffaf0" />
      <rect x={-130} y={-150} width={260} height={70} rx={28} fill="#e2574c" />
      <Word x={0} y={40} t={label} size={44} c="#2b2f45" />
      {f > 0 && f < 0.3 && <g transform={`translate(0 -80) scale(1 ${1 - f / 0.15})`}><rect x={-120} y={0} width={240} height={220} rx={24} fill="#fff" opacity={0.9} /></g>}
    </g>
  );
};

/** the algorithm machine: a rounded box with gears and a chute, `run` spins the gears */
const AlgoBox: React.FC<{x: number; y: number; s?: number; run: number; out?: number; frame: number}> = ({x, y, s = 1, run, out = 0, frame}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ContactShadow x={0} y={230} w={500} opacity={0.35} />
    <LitBox x={-230} y={-200} w={460} h={420} r={60} c="#7b5cf0" />
    {[[-90, -60, 70], [70, -20, 54], [-10, 80, 44]].map(([gx, gy, r], i) => (
      <g key={i} transform={`translate(${gx} ${gy}) rotate(${(i % 2 ? -1 : 1) * run * 360 + frame * (run > 0 ? 3 : 0.3)})`}>
        {Array.from({length: 8}, (_, k) => <rect key={k} x={-10} y={-r - 14} width={20} height={28} rx={6} fill="#ffd34d"
          transform={`rotate(${k * 45})`} />)}
        <circle r={r} fill="#ffd34d" stroke={line('#ffd34d')} strokeWidth={6} />
        <circle r={r * 0.35} fill="#7b5cf0" />
      </g>
    ))}
    <rect x={150} y={150} width={140} height={60} rx={24} fill={shade('#7b5cf0', 0.3)} />
    <Glow x={0} y={0} r={260} color="#b9a7ff" opacity={0.25 + 0.2 * run} />
    {out > 0 && (
      <g transform={`translate(${lerp(220, 380, ease(out))} ${lerp(180, 260, out) - 140 * Math.sin(clamp01(out) * Math.PI)})`}>
        <path d="M0 0 C-30 -48 -32 -90 0 -98 C32 -90 30 -48 0 0Z" fill="#f2b43c" stroke="#8a5a10" strokeWidth={6} />
        <circle cx={0} cy={-66} r={13} fill="#fff6e6" />
      </g>
    )}
  </g>
);

/** a small rounded red planet with its own glow */
const Mars: React.FC<{x: number; y: number; r?: number}> = ({x, y, r = 90}) => (
  <g>
    <Glow x={x} y={y} r={r * 2} color="#ff7a4a" opacity={0.35} />
    <circle cx={x} cy={y} r={r} fill={shade('#e2603c', 0.3)} />
    <circle cx={x - r * 0.1} cy={y - r * 0.1} r={r * 0.9} fill="#ec7046" />
    <ellipse cx={x - r * 0.3} cy={y - r * 0.35} rx={r * 0.3} ry={r * 0.16} fill="#ffb08a" opacity={0.7} />
    <circle cx={x + r * 0.3} cy={y + r * 0.2} r={r * 0.15} fill="#c4502e" />
  </g>
);

/** a hydrant, the round lit kind */
const Hydrant: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ContactShadow x={0} y={4} w={130} opacity={0.35} />
    <rect x={-44} y={-160} width={88} height={160} rx={30} fill={shade('#e8402f', 0.25)} stroke={line('#e8402f')} strokeWidth={6} />
    <rect x={-38} y={-154} width={66} height={140} rx={24} fill="#f05a3f" />
    <rect x={-66} y={-110} width={132} height={34} rx={16} fill="#d43a2b" />
    <path d="M-44 -160 Q0 -220 44 -160 Z" fill="#d43a2b" />
    <rect x={-28} y={-150} width={18} height={100} rx={9} fill="#ffb3a0" opacity={0.6} />
  </g>
);

export const LeakSatelliteFilm: React.FC<FilmRenderProps> = ({board, shot, time_s, shot_s}) => {
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
  // a row of brick ranch houses along a suburban street, baseline y
  const houses = (y: number, s = 0.26, x0 = 180) => <g>{[0, 1, 2].map((i) => <g key={i}><BrickRanchV2 x={x0 + i * 360} y={y} scale={s} frame={frame} seed={30 + i} w={300} h={130}
    brick={['#c0603e', '#b5733f', '#d1a07a'][i]} /></g>)}</g>;
  // a kneeling technician: the figure lowered behind the street line with the rod in hand and headphones on
  const listener = (x: number, y: number, s: number, emotion: FigureEmotion, pulse: number, headY = -470, turn = 0.4) => (
    <g>
      {person(TECH, x, y, s, {pose: 'hold'}, emotion, turn, 5, {holding: <g transform="translate(0 -20)"><ListeningRod len={200} pulse={pulse} /></g>})}
      <Headphones x={x + 6 * s} y={y + headY * s} s={s * 0.95} on={pulse} />
    </g>
  );

  switch (shot.view) {
    // ---------------------------------------------------------------- the street, cut away
    case 'street-cut': {
      if (shot.scene_id === 's1') {
        // THE HOOK, close: her face fills the upper frame, headphones on, rod pressed to the asphalt, squinting, while a
        // big jet bursts out of the main right beside her in the cutaway below the street
        const sp = since('s1-spray');
        const ls = since('s1-listen');
        const sq = clamp01(t / 1.2);
        return svg(<g>
          {houses(1210, 0.22, 760)}
          {person(TECH, 400, 1960, 2.3, {pose: 'hold'}, sq > 0.5 ? 'worried' : 'thinking', 0.35 + Math.sin(t * 2.2) * 0.12, 5,
            {holding: <g transform="translate(0 -10)"><ListeningRod len={300} pulse={0} /></g>})}
          <Headphones x={414} y={1960 - 470 * 2.3} s={2.18} on={0} />
          <StreetSection y={1230} frame={frame} leak={clamp01(0.6 + sp / 0.6)} pipeY={170} crackX={820} jet={2.8} sidewalk={false} />
          <Burst x={820} y={1370} p={sp / 0.6} color="#9fe0ff" r={320} />
          {t > 1.4 && <g transform={`translate(800 ${lerp(760, 700, clamp01((t - 1.4) * 3))})`} opacity={clamp01((t - 1.4) * 3)}>
            <LitBox x={-75} y={-75} w={150} h={150} r={44} c="#ffffff" /><Word x={0} y={42} t="?" size={120} c="#2f86d6" /></g>}
          {ls > -10 && null}
        </g>);
      }
      const end = shot.scene_id === 's13';
      const leak = end ? 0 : clamp01(0.4 + since('s1-spray') / 1.2);
      const listen = end ? since('s13-nod') : since('s1-listen');
      const pulse = end ? (listen > 0.6 ? 1 : 0) : 0;
      const beam = end ? after(since('s13-nod'), 0.8) : 0;
      return svg(<g>
        <rect x={0} y={0} width={1080} height={900} fill="none" />
        {houses(1030, 0.24, 160)}
        <StreetSection y={1060} frame={frame} leak={leak} clamp={end ? 1 : 0} pipeY={300} crackX={600} jet={end ? 1 : 2.2} />
        {!end && <Burst x={600} y={1330} p={since('s1-spray') / 0.6} color="#9fe0ff" r={260} />}
        <ValveLid x={360} y={1070} s={1} />
        {end && <Satellite x={560} y={250} s={0.55} frame={frame} mood={listen > 0.8 ? 'happy' : 'focused'} beam={beam} beamLen={900} look={0} />}
        {end && beam > 0.6 && <g transform={`translate(560 ${lerp(500, 1040, ease((since('s13-nod') - 0.6) / 0.6))})`}>
          <path d="M0 0 C-30 -48 -32 -90 0 -98 C32 -90 30 -48 0 0Z" fill="#2fbf71" stroke="#16643b" strokeWidth={6} />
          <circle cx={0} cy={-66} r={13} fill="#fff6e6" /></g>}
        {end && (() => { const sw2 = Math.abs(Math.sin(t * 5)); return person(CREW, 820, 1060, 0.9, {pose: 'reach'}, 'determined', -0.5, 6, {holding: <g transform={`translate(0 ${-30 + 50 * sw2})`}><rect x={-8} y={-160} width={16} height={240} rx={8} fill="#a8774e" /><rect x={-50} y={80} width={100} height={30} rx={10} fill="#5a6078" /></g>}); })()}
        {listener(380, 1080, 0.85, end ? (listen > 0.5 ? 'excited' : 'happy') : (listen > 0.9 ? 'worried' : 'thinking'), pulse, -470,
          !end && listen > 0.8 && listen < 2 ? Math.sin(listen * 18) * 0.7 : 0.4)}
        {!end && listen > 0.9 && <Word x={200} y={560} t="?" size={120} c="#fff6e6" op={clamp01((listen - 0.9) * 3)} />}
      </g>);
    }
    case 'tech-close': {
      if (shot.scene_id === 's3') {
        // close on the technician, the blank map glowing on her face: before satellites, nothing to go on
        const tk = t;
        return svg(<g>
          <Glow x={540} y={760} r={480} color="#9fd0ff" opacity={0.45} />
          {person(TECH, 560, 2100, 2.4, move(tk, 0.6, 'stand', 'shrug'), tk > 0.6 ? 'worried' : 'thinking', 0.2, 5)}
          <g transform={`translate(860 ${lerp(560, 500, ease(clamp01(tk / 0.8)))}) rotate(8)`}><LitBox x={-140} y={-110} w={280} h={220} r={40} c="#ffffff" />
            <Word x={0} y={30} t="?" size={140} c="#2f86d6" /></g>
        </g>);
      }
      // close on the technician, headphones on, the amplifier flat, she shakes her head
      const s = since('s1-listen');
      const shake = s > 0.8 && s < 1.8 ? Math.sin(s * 22) * 0.6 : 0;
      return svg(<g>
        <rect x={0} y={1180} width={1080} height={740} fill="#4d5266" />
        <rect x={0} y={1180} width={1080} height={10} fill="#7a8098" />
        {person(TECH, 520, 1900, 2.6, {pose: 'hold'}, s > 0.8 ? 'worried' : 'thinking', shake, 5,
          {holding: <g transform="translate(0 -10)"><ListeningRod len={160} pulse={0} /></g>})}
        <Headphones x={526} y={1900 - 470 * 2.6} s={2.4} on={0} />
        <g transform="translate(800 1080)">
          <LitBox x={-170} y={-90} w={340} h={180} r={34} c="#2a2f45" />
          <Wave x={-140} y={0} w={280} amp={0.05} frame={frame} c="#7cff9e" />
        </g>
      </g>);
    }
    case 'soak-plume': {
      // the plume spreads, the calendar flips, a neighbour walks past on the sidewalk above
      const p = after(since('s2-soak'), 4);
      return svg(<g>
        <StreetSection y={760} frame={frame} leak={0.3 + 0.7 * p} pipeY={560} crackX={540} />
        <Calendar x={790} y={640} flip={p * 6.5} s={1.25} />
        {person(RES, lerp(120, 420, clamp01(t / 4)), 740, 0.9, {pose: 'stand', walk: t}, 'happy', 0.5, 2)}
      </g>);
    }
    // ---------------------------------------------------------------- the old way
    case 'map-lines': {
      const p = after(since('s3-miles'), 1.1);
      return svg(<g>
        <g transform="translate(90 430) scale(1)"><TabletMap frame={frame} lines={p} pins={0} checks={0} /></g>
        <g transform={`translate(760 ${lerp(220, 300, pop(since('s3-miles'), 0.5))})`}><LitBox x={-250} y={-70} w={500} h={140} r={44} c="#2f86d6" />
          <Word x={0} y={26} t={`${Math.round(1470 * p).toLocaleString('en-US')} miles`} size={66} c="#ffffff" /></g>
        {(() => { const wk = since('s3-walk'); const w = clamp01(wk / 1.2); return person(TECH, lerp(1250, 880, ease(w)), 1700, 1.1,
          wk > 0 && wk < 1.2 ? {pose: 'stand', walk: wk} : wk >= 1.2 ? move(wk, 1.2, 'stand', 'point') : {pose: 'stand'},
          wk > 1.4 ? 'surprised' : 'thinking', -0.6, 5); })()}
      </g>);
    }
    case 'curb-report': {
      const s = since('s3-call');
      const run = (frame % 30) / 30;
      return svg(<g>
        {houses(1180, 0.26, 140)}
        <rect x={0} y={1180} width={1080} height={60} fill="#d9dbe4" />
        <rect x={0} y={1236} width={1080} height={700} fill="#4d5266" />
        {/* water running down the curb */}
        <path d="M140 1236 Q500 1250 1080 1240" stroke="#9fe0ff" strokeWidth={26} strokeLinecap="round" fill="none" opacity={0.9} />
        {[0, 1, 2, 3, 4].map((i) => <ellipse key={i} cx={140 + ((run + i / 5) % 1) * 940} cy={1242} rx={22} ry={7} fill="#ffffff" opacity={0.8} />)}
        {person(RES, 600, 1210, 1.6, move(t, Math.max(0, s), 'point', 'hold'), s > 0.3 ? 'surprised' : 'thinking', -0.5, 2,
          s > 0.3 ? {holding: <rect x={-30} y={-60} width={60} height={110} rx={14} fill="#2a2f45" />} : {})}
        <Burst x={620} y={500} p={s / 0.6} color="#9fe0ff" />
      </g>);
    }
    case 'truck-crew': {
      const roll = clamp01(t / 1.4);
      const out = clamp01((since('s4-out') + 0.2) / 1.2);
      return svg(<g>
        {houses(1120, 0.24, 160)}
        <rect x={0} y={1120} width={1080} height={800} fill="#4d5266" />
        <rect x={0} y={1110} width={1080} height={30} fill="#d9dbe4" />
        <CrewTruck x={lerp(-200, 600, ease(roll))} y={1260} s={1.1} frame={frame} roll={roll} lights />
        {out > 0 && person(TECH, lerp(560, 180, out), 1480, 1.05, {pose: 'point', walk: t}, 'determined', 0.5, 5)}
        {out > 0.3 && person(CREW, lerp(600, 380, out), 1500, 1.05, {pose: 'hold', walk: t}, 'determined', 0.3, 6,
          {holding: <ListeningRod len={160} />})}
        {out > 0.6 && person(MATE, lerp(640, 880, out), 1490, 1.0, {pose: 'wave', walk: t}, 'happy', -0.4, 7)}
      </g>);
    }
    case 'ring-cross': {
      const r = after(since('s4-rings'), 1.6);
      const valves: [number, number][] = [[200, 720], [880, 780], [520, 1280]];
      const leakAt = [560, 880];
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#5a5f74" />
        {[300, 620, 940].map((yy) => <rect key={yy} x={0} y={yy} width={1080} height={8} fill="#7a8098" />)}
        <path d="M0 880 L1080 880" stroke="#2f86d6" strokeWidth={30} opacity={0.35} />
        {valves.map(([vx, vy], i) => (
          <g key={i}>
            <ValveLid x={vx} y={vy} s={1.1} />
            {[0, 1, 2].map((k) => <circle key={k} cx={vx} cy={vy} r={60 + (k + 1) * 140 * r} fill="none" stroke="#7cf0ff" strokeWidth={8}
              opacity={(0.9 - k * 0.25) * (r > 0 ? 1 : 0)} />)}
          </g>
        ))}
        {(() => { const w = clamp01(t / 2.2); return <g>
          {([[TECH, lerp(-80, 140, ease(w)), 700, 0.3, 5], [CREW, lerp(1160, 820, ease(w)), 760, -0.3, 6], [MATE, 460, lerp(1700, 1260, ease(w)), 0.2, 7]] as const).map(([who, px, py, tn, sd], i) => {
            const ck = since('s4-check');
            const kit = w >= 1 && ck <= 0;
            return <g key={i}>
              {person(who as Partial<FigureProps>, px as number, py as number, 0.75, w < 1 ? {pose: 'stand', walk: t} : ck > 0 ? move(ck, 0, 'hold', i === 1 ? 'raise' : i === 2 ? 'wave' : 'cheer') : {pose: 'hold'},
                ck > 0 ? 'excited' : 'thinking', tn as number, sd as number, kit ? {holding: <g transform="translate(0 -10)"><ListeningRod len={120} pulse={r} /></g>} : {})}
              {w >= 1 && <Headphones x={(px as number) + 4} y={(py as number) - 470 * 0.75} s={0.7} on={r} />}
            </g>;
          })}
          {w >= 1 && r === 0 && valves.map(([vx, vy], i) => { const ph = ((t - 2.2) * 0.8 + i * 0.33) % 1; return <circle key={i} cx={vx} cy={vy} r={60 + ph * 220}
            fill="none" stroke="#7cf0ff" strokeWidth={6} opacity={0.8 * (1 - ph)} />; })}
        </g>; })()}
        {since('s4-check') > 0 && <g><Glow x={leakAt[0]} y={leakAt[1]} r={160} color="#9fe0ff" opacity={0.7} />
          <Mark x={leakAt[0]} y={leakAt[1]} on={since('s4-check') * 2.5} ok s={1.4} /></g>}
      </g>);
    }
    // ---------------------------------------------------------------- orbit
    case 'sat-orbit': {
      const s = since('s5-orbit');
      const open = clamp01((s - 0.5) / 0.5);
      return svg(<g>
        <Orbit frame={frame} curve={1300} />
        <Satellite x={lerp(1300, 560, ease(clamp01(s / 1.2)))} y={700} s={1.5} frame={frame} mood={since('s5-lock') > 0 ? 'focused' : open > 0.5 ? 'curious' : 'focused'}
          tilt={lerp(20, -4, clamp01(s / 1.2))} look={0.2} />
      </g>);
    }
    case 'curb-scan': {
      // low from the curb: the technician looks up as the cyan cone sweeps down her street, block by block
      const sc = since('s5-scan');
      const sweep = clamp01(sc / 2.6);
      return svg(<g>
        {houses(1210, 0.26, 160)}
        <rect x={0} y={1240} width={1080} height={680} fill="#4d5266" />
        <rect x={0} y={1210} width={1080} height={40} fill="#d9dbe4" />
        {[0, 1, 2, 3].map((i) => <rect key={i} x={60 + i * 280} y={1560} width={140} height={14} rx={7} fill="#ffd34d" />)}
        <Satellite x={lerp(780, 600, sweep)} y={300} s={0.75} frame={frame} mood="focused" beam={0.4 + 0.6 * clamp01(sc / 0.6)} beamLen={1250} look={-0.4} />
        <rect x={0} y={lerp(1180, 1620, sweep) - 30} width={1080} height={60} rx={30} fill="#7cf0ff" opacity={0.5} />
        {person(TECH, 300, 1500, 1.35, move(t, Math.max(0, sc), 'stand', 'point'), sc > 0 ? 'surprised' : 'thinking', 0.6, 5)}
      </g>);
    }
    case 'radar-cut': {
      const s = since('s6-radar');
      const glow = after(since('s6-glow'), 0.8);
      return svg(<g>
        <StreetSection y={700} frame={frame} leak={0.9} pipeY={480} crackX={540} />
        {glow > 0 && <g><Glow x={540} y={1160} r={340} color="#3ff0ff" opacity={0.7 * glow} />
          <ellipse cx={540} cy={1160} rx={260} ry={150} fill="none" stroke="#7cf0ff" strokeWidth={10} strokeDasharray="30 20" opacity={glow} /></g>}
        <Satellite x={540} y={250} s={0.55} frame={frame} mood="focused" beam={clamp01(s / 0.6)} beamLen={1600} />
      </g>);
    }
    case 'sat-mars': {
      const s = since('s6-mars');
      const look = s < 0 ? -0.3 : s < 0.8 ? 1 : lerp(1, -0.6, clamp01((s - 0.8) / 0.4));
      return svg(<g>
        <Orbit frame={frame} curve={1500} />
        <Mars x={900} y={330} r={s > 0 ? 90 : 60} />
        <Satellite x={460} y={820} s={1.4} frame={frame} mood={s > 0 && s < 0.9 ? 'curious' : 'proud'} look={look} tilt={s > 0 && s < 0.9 ? 8 : -3} />
      </g>);
    }
    // ---------------------------------------------------------------- the algorithm and the pins
    case 'algo-funnel': {
      const s = since('s7-algo');
      const feed = clamp01(s / 1.2);
      return svg(<g>
        <rect x={lerp(-500, 80, feed)} y={560} width={400} height={120} rx={30} fill="#7cf0ff" opacity={0.85} />
        {[0, 1, 2, 3].map((i) => <rect key={i} x={lerp(-480, 100, feed) + i * 90} y={590} width={60} height={60} rx={14} fill="#3f9cf0" />)}
        <AlgoBox x={560} y={980} s={1} run={feed + Math.max(0, s - 1.2) * 0.6} out={clamp01((s - 1.2) / 0.8)} frame={frame} />
        {s > 2 && <g transform={`translate(${940} ${1240 - Math.abs(Math.sin((s - 2) * 5)) * 80 * Math.max(0, 1 - (s - 2) / 2)})`}><path d="M0 0 C-30 -48 -32 -90 0 -98 C32 -90 30 -48 0 0Z" fill="#f2b43c" stroke="#8a5a10" strokeWidth={6} /><circle cx={0} cy={-66} r={13} fill="#fff6e6" /></g>}
        <Satellite x={850} y={380} s={0.5} frame={frame} mood="curious" look={-0.6} />
      </g>);
    }
    case 'tablet-face': {
      // her face lit from below by the tablet, the pin turning to a green check, a PILOT tag swinging in
      const done = pop(since('s13-pilot'), 0.6);
      return svg(<g>
        {houses(1150, 0.26, 160)}
        <Glow x={760} y={1150} r={420} color="#7cf0ff" opacity={0.35 + 0.25 * done} />
        {person(TECH, 820, 2260, 1.6, done > 0.3 ? move(since('s13-pilot'), 0.2, 'hold', 'cheer') : {pose: 'hold'}, done > 0.3 ? 'excited' : 'thinking', -0.5, 5)}
        <TabletV2 x={500} y={700} scale={0.78} tilt={-2}>
          <g transform="translate(162 12) scale(0.75)"><TabletMap frame={frame} lines={1} pins={0} checks={0} one={1} oneDone={done} /></g>
        </TabletV2>
        {done > 0.1 && <g transform={`translate(240 ${lerp(1000, 1130, clamp01(done))}) rotate(${-8 + Math.sin(t * 3) * 4})`}>
          <LitBox x={-150} y={-50} w={300} h={100} r={34} c="#ffd34d" /><Word x={0} y={18} t="PILOT" size={48} c="#2b2f45" /></g>}
      </g>);
    }
    case 'tablet-pin': {
      const end = shot.scene_id === 's13';
      const pin = end ? 1 : after(since('s7-pin'), 0.9);
      const done = end ? pop(since('s13-pilot'), 0.6) : 0;
      return svg(<g>
        {houses(1150, 0.26, 160)}
        <TabletV2 x={540} y={860} scale={0.86} tilt={-4}>
          <g transform="translate(162 12) scale(0.75)"><TabletMap frame={frame} lines={1} pins={0} checks={0} one={pin} oneDone={done} /></g>
        </TabletV2>
        {person(TECH, 900, 1640, 1.05, pin > 0.6 ? move(since('s7-pin'), 0.5, 'hold', 'raise') : {pose: 'hold'}, (end ? done > 0.3 : pin > 0.6) ? 'excited' : 'thinking', -0.6, 5)}
        {end && done > 0.2 && <g transform={`translate(240 ${lerp(300, 420, clamp01(done))}) rotate(-8)`}>
          <LitBox x={-110} y={-44} w={220} h={88} r={30} c="#ffd34d" /><Word x={0} y={18} t="PILOT" size={46} c="#2b2f45" /></g>}
      </g>);
    }
    case 'tablet-swarm': {
      // over her shoulder: about 340 gold pins land on the tablet in her hands, then 34 turn to green checks
      const sw = after(since('s8-swarm'), 0.8);
      const ck = after(since('s8-fixed'), 1.4);
      const count = Math.round(340 * sw);
      return svg(<g>
        {houses(1150, 0.26, 160)}
        <TabletV2 x={620} y={840} scale={0.8} tilt={-11}>
          <g transform="translate(162 12) scale(0.75)"><TabletMap frame={frame} lines={1} pins={sw} checks={ck} /></g>
        </TabletV2>
        {person(TECH, 130, 2000, 1.9, {pose: 'reach'}, ck > 0 ? 'happy' : sw > 0.3 ? 'surprised' : 'thinking', 0.6, 5)}
        <g transform={`translate(780 ${lerp(250, 330, pop(since('s8-swarm'), 0.5))})`}><LitBox x={-200} y={-66} w={400} h={132} r={44} c={ck > 0 ? '#2fbf71' : '#f2b43c'} />
          <Word x={0} y={26} t={ck > 0 ? `${Math.round(34 * ck)} fixed` : `${count} pins`} size={66} c="#ffffff" /></g>
      </g>);
    }
    case 'crew-pin': {
      // wide: the truck pulls up at one gold pin in the street, a crew member swings a shovel into it
      const k = since('s8-kneel');
      const h = since('s8-hear');
      const roll = clamp01((k + 0.6) / 1.4);
      const swing = h > 0 ? Math.sin(clamp01(h / 0.5) * Math.PI) : 0;
      return svg(<g>
        {houses(1230, 0.26, 160)}
        <rect x={0} y={1260} width={1080} height={660} fill="#4d5266" />
        <rect x={0} y={1230} width={1080} height={40} fill="#d9dbe4" />
        <CrewTruck x={lerp(-400, 160, ease(roll))} y={1380} s={0.95} frame={frame} roll={roll} lights />
        <g transform="translate(840 1420)"><ContactShadow x={0} y={6} w={120} />
          <path d="M0 0 C-44 -70 -48 -132 0 -144 C48 -132 44 -70 0 -10Z" fill="#f2b43c" stroke="#8a5a10" strokeWidth={8} />
          <circle cx={0} cy={-96} r={20} fill="#fff6e6" /></g>
        {h > 0 && <Burst x={840} y={1420} p={(h - 0.3) / 0.6} color="#c98a56" />}
        {person(CREW, 620, 1560, 1.25, {pose: h > 0 ? 'reach' : 'hold'}, h > 0 ? 'determined' : 'thinking', 0.6, 6,
          {holding: <g transform={`rotate(${-30 + 60 * swing})`}><rect x={-6} y={-120} width={12} height={220} rx={6} fill="#a8774e" />
            <path d="M-30 100 L30 100 L24 170 Q0 190 -24 170 Z" fill="#9aa3bd" stroke={line('#9aa3bd')} strokeWidth={5} /></g>})}
        {person(TECH, 990, 1500, 0.85, {pose: 'point'}, 'determined', -0.6, 5)}
      </g>);
    }
    case 'listen-kneel': {
      const k = since('s8-kneel');
      const h = since('s8-hear');
      const spike = h > 0 ? clamp01(h / 0.4) : 0;
      return svg(<g>
        <StreetSection y={1100} frame={frame} leak={0.8} pipeY={420} crackX={600} />
        {listener(560, 1130, 1.5, h > 0 ? 'excited' : k > 0 ? 'thinking' : 'neutral', spike)}
        <g transform="translate(820 560)">
          <LitBox x={-200} y={-110} w={400} h={220} r={38} c="#2a2f45" />
          <Wave x={-170} y={0} w={340} amp={0.08 + spike * 0.9} frame={frame} c={spike > 0.5 ? '#7cff9e' : '#9aa3bd'} />
        </g>
        <Burst x={820} y={560} p={h / 0.6} color="#7cff9e" />
      </g>);
    }
    // ---------------------------------------------------------------- the second pilot
    case 'valve-map': {
      const later = shot.scene_id === 's10';
      const o = later ? 1 : after(since('s9-slide'), 1.4);
      const c = later ? 1 : after(since('s9-check'), 0.8);
      return svg(<g>
        <rect x={0} y={1120} width={1080} height={800} fill="#a8774e" />
        <rect x={0} y={1120} width={1080} height={24} fill="#c9935f" />
        <g transform="translate(140 640) rotate(-3)">
          <LitBox x={0} y={0} w={800} h={480} r={30} c="#fffaf0" />
          {Array.from({length: 12}, (_, i) => <g key={i}><Hydrant x={80 + (i % 6) * 125} y={140 + Math.floor(i / 6) * 220} s={0.35} /></g>)}
          <g transform={`translate(${lerp(-760, c > 0 ? 0 : -30, o)} ${lerp(-60, 0, o)}) rotate(${lerp(-8, 0, o)} 400 240)`}>
            <rect x={20} y={20} width={760} height={440} rx={26} fill="#7cf0ff" opacity={0.4} stroke="#2a8fb8" strokeWidth={6} />
            {[[205, 110], [455, 330], [705, 110]].map(([dx, dy], i) => <g key={i}><circle cx={dx} cy={dy} r={26} fill="#f2b43c" stroke="#8a5a10" strokeWidth={5} />
              {c > 0 && <circle cx={dx} cy={dy} r={26 + 30 * c} fill="none" stroke="#f2b43c" strokeWidth={5} opacity={1 - c} />}</g>)}
          </g>
          {c > 0 && <circle cx={455} cy={330} r={60 * c} fill="none" stroke="#e2574c" strokeWidth={10} />}
        </g>
        {person(ANALYST, 260, 1180, 1.2, later ? {pose: 'point'} : since('s9-check') > 0 ? move(since('s9-check'), 0, 'point', 'reach') : move(t, 1.2, 'stand', 'point'), since('s9-check') > 0 ? 'surprised' : 'thinking', 0.4, 8)}
        {person(ANALYST2, 860, 1190, 1.15, later ? move(t, 0.2, 'hold', 'wave') : since('s9-slide') > 0 ? move(since('s9-slide'), 0, 'hold', 'reach') : {pose: 'think'}, later ? 'proud' : since('s9-slide') > 0 ? 'determined' : 'thinking', -0.4, 9)}
        {later && <g transform={`translate(540 ${lerp(200, 420, pop(since('s10-33'), 0.6))})`}>
          <LitBox x={-210} y={-80} w={420} h={160} r={44} c="#2fbf71" /><Word x={0} y={28} t="33" size={100} c="#ffffff" /></g>}
      </g>);
    }
    case 'split-algo': {
      const s = since('s9-split');
      const slam = pop(s, 0.4, 2);
      return svg(<g>
        <rect x={0} y={0} width={540} height={1920} fill="#3b2d7a" />
        <rect x={540} y={0} width={540} height={1920} fill="#f2b43c" opacity={0.35} />
        <rect x={534} y={lerp(-1920, 0, slam)} width={12} height={1920} fill="#ffffff" />
        <AlgoBox x={270} y={900} s={0.8} run={1} frame={frame} />
        <Word x={270} y={520} t="ALGORITHM" size={52} c="#fff6e6" />
        <Word x={810} y={520} t="PEOPLE" size={52} c="#fff6e6" />
        {person(ANALYST, 720, 1400, 0.95, {pose: 'point'}, 'determined', 0.3, 8)}
        {person(ANALYST2, 930, 1410, 0.9, {pose: 'think'}, 'thinking', -0.3, 9)}
      </g>);
    }
    case 'ten-pins': {
      const s = since('s10-ten');
      const filled = [0, 1, 2, 4, 5, 7, 8];
      return svg(<g>
        {Array.from({length: 10}, (_, i) => {
          const x = 120 + (i % 5) * 210, y = 780 + Math.floor(i / 5) * 360;
          const on = clamp01((s - i * 0.09) / 0.25);
          const wet = filled.includes(i) && on > 0;
          return <g key={i} transform={`translate(${x} ${y + (wet ? Math.sin(frame / 7 + i) * 10 : 0)}) scale(${1 + 0.15 * Math.sin(on * Math.PI)})`}>
            <ContactShadow x={0} y={20} w={120} opacity={0.3} />
            <path d="M0 0 C-50 -80 -54 -150 0 -164 C54 -150 50 -80 0 -10Z" fill={wet ? '#3f9cf0' : '#e8ecf6'} stroke={wet ? '#174d8a' : '#9aa3bd'} strokeWidth={8} />
            {wet && <path d="M0 -130 C-14 -110 -14 -90 0 -86 C14 -90 14 -110 0 -130Z" fill="#bfe6ff" />}
          </g>;
        })}
        <g transform="translate(540 420)"><LitBox x={-200} y={-80} w={400} h={160} r={44} c="#3f9cf0" />
          <Word x={0} y={28} t={`${filled.filter((i) => s - i * 0.09 > 0).length} of 10`} size={84} c="#ffffff" /></g>
        {person(ANALYST, 880, 1660, 0.9, s > 1.2 ? move(s, 1.2, 'point', 'cheer') : {pose: 'point'}, s > 1.2 ? 'excited' : 'thinking', -0.5, 8)}
      </g>);
    }
    case 'tally-board': {
      const s = since('s10-33');
      return svg(<g>
        <LitBox x={160} y={420} w={760} h={700} r={50} c="#2a3f6e" />
        {Array.from({length: 33}, (_, i) => {
          const on = clamp01((s + 1.2 - i * 0.03) / 0.2);
          return <rect key={i} x={230 + (i % 11) * 58} y={520 + Math.floor(i / 11) * 140} width={14} height={100 * on} rx={7} fill="#7cff9e" />;
        })}
        <g transform={`translate(540 ${lerp(1300, 980, pop(s, 0.5))})`}><Word x={0} y={0} t="33 LEAKS" size={110} c="#ffd34d" /></g>
        {person(ANALYST2, 860, 1720, 1.1, move(t, Math.max(0.2, s), 'hold', 'point'), s > 0 ? 'proud' : 'happy', -0.5, 9)}
      </g>);
    }
    // ---------------------------------------------------------------- the fix and the win
    case 'dig-fix': {
      const c = after(since('s11-clamp'), 0.8);
      return svg(<g>
        <StreetSection y={760} frame={frame} leak={1} dig={1} clamp={c} pipeY={520} crackX={540} />
        {person(CREW, 540, 1200, 1.0, {pose: c > 0.5 ? 'raise' : 'reach'}, c > 0.5 ? 'happy' : 'determined', 0, 6)}
        {person(TECH, 200, 770, 0.95, {pose: c > 0.5 ? 'hips' : 'point'}, c > 0.5 ? 'excited' : 'thinking', 0.5, 5)}
        <Burst x={540} y={1280} p={(since('s11-clamp') - 0.5) / 0.6} color="#ffd34d" />
      </g>);
    }
    case 'jug-fill': {
      const j = after(since('s11-jug'), 1.2);
      const tag = pop(since('s11-cash'), 0.7);
      const gallons = Math.round(1130567 * j).toLocaleString('en-US');
      return svg(<g>
        {houses(1500, 0.22, 140)}
        <Jug x={480} y={1490} s={lerp(1.0, 2.0, ease(j))} level={j} frame={frame} />
        {j > 0.3 && Array.from({length: 8}, (_, i) => { const ph = ((frame / 40) + i / 8) % 1; return <circle key={i} cx={320 + (i * 47) % 320} cy={1440 - ph * 900 * j} r={8 + (i % 3) * 4} fill="#e8f6ff" opacity={0.7 * (1 - ph)} />; })}
        <g transform="translate(480 470)"><LitBox x={-330} y={-70} w={660} h={140} r={44} c="#3f9cf0" />
          <Word x={0} y={26} t={`${gallons} gal`} size={64} c="#ffffff" /></g>
        {tag > 0 && <g transform={`translate(700 ${lerp(560, 880, tag)}) rotate(${Math.sin(t * 4) * 8 * (1 - clamp01(since('s11-cash')))})`}>
          <LitBox x={-140} y={-50} w={280} h={100} r={30} c="#2fbf71" /><Word x={0} y={18} t="$440,800" size={50} c="#ffffff" /></g>}
        {person(TECH, 900, 1640 - 60 * Math.max(0, Math.sin(clamp01(since('s11-gal') / 0.5) * Math.PI)), 1.0, move(t, 0.3, 'stand', 'cheer'), j > 0.5 ? 'excited' : 'happy', -0.6, 5)}
      </g>);
    }
    case 'supervisor-desk': {
      const d = after(since('s11-days'), 1.2);
      return svg(<g>
        {houses(1200, 0.26, 160)}
        <rect x={0} y={1200} width={1080} height={720} fill="#a8774e" />
        <g transform="translate(560 640)">
          <LitBox x={-300} y={-260} w={600} h={520} r={40} c="#fffaf0" />
          <rect x={-300} y={-260} width={600} height={90} rx={36} fill="#3f9cf0" />
          <Word x={0} y={-198} t="SEARCH DAYS" size={44} c="#ffffff" />
          {Array.from({length: 10}, (_, i) => {
            const cx = -220 + (i % 5) * 110, cy = -80 + Math.floor(i / 5) * 150;
            const gone = d * 10 > i;
            return <g key={i}><rect x={cx - 44} y={cy - 50} width={88} height={100} rx={18} fill={gone ? '#e7f8ee' : '#ffe2dc'} stroke="#c9cfdd" strokeWidth={4} />
              {!gone && <path d={`M${cx - 30} ${cy - 34} L${cx + 30} ${cy + 34} M${cx + 30} ${cy - 34} L${cx - 30} ${cy + 34}`} stroke="#e2574c" strokeWidth={10} strokeLinecap="round" />}</g>;
          })}
        </g>
        {person(SUPER, 240, 1500, 1.2, since('s11-days') > 0 ? move(since('s11-days'), 0, 'think', 'hips') : move(t, 0.4, 'stand', 'think'), d > 0.5 ? 'happy' : 'worried', 0.5, 4)}
      </g>);
    }
    case 'dog-street': {
      const s = since('s12-trot');
      const x = lerp(-100, 640, clamp01(s / 2.4));
      return svg(<g>
        {houses(1270, 0.26, 160)}
        <rect x={0} y={1300} width={1080} height={620} fill="#4d5266" />
        <rect x={0} y={1270} width={1080} height={40} fill="#d9dbe4" />
        <Hydrant x={180} y={1290} s={0.8} />
        <DogV2 frame={frame} x={x} y={1440} scale={1.4} color="#7a5134" mood="happy" walk={s > 0 && s < 2.4 ? s : undefined} />
        {person(TECH, 860, 1460, 1.1, move(t, 0.4, 'stand', 'wave'), s > 0.4 ? 'happy' : 'surprised', -0.5, 5)}
      </g>);
    }
    case 'dog-nose': {
      const sn = since('s12-sniff');
      const sit = clamp01(sn / 0.4);
      return svg(<g>
        {houses(1290, 0.26, 160)}
        <rect x={0} y={1300} width={1080} height={620} fill="#4d5266" />
        <rect x={0} y={1280} width={1080} height={30} fill="#d9dbe4" />
        <ValveLid x={420} y={1340} s={1.3} />
        <g transform={`rotate(${8 * sit} 250 1400)`}><DogV2 frame={frame} x={250} y={1400 + 20 * sit} scale={1.45} color="#7a5134" mood={sn > 0 ? 'alert' : 'happy'} /></g>
        {sn > 0 && [0, 1, 2].map((i) => <circle key={i} cx={560 + i * 30} cy={1250 - i * 50 - ((frame % 30) * 2)} r={10 + i * 4} fill="#bff8ff" opacity={0.6} />)}
        {person(TECH, 950, 1520, 1.0, move(t, Math.max(0, sn), 'stand', 'point'), sn > 0 ? 'proud' : 'happy', -0.6, 5)}
      </g>);
    }
    case 'sheet-slide': {
      // detail: the satellite sheet slides over the valve and hydrant map, then a red pencil circles a hydrant under a dot
      const sl = after(since('s9-slide'), 1.2);
      const ck = after(since('s9-check'), 0.7);
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#c9935f" />
        <g transform="translate(90 480)">
          <LitBox x={0} y={0} w={900} h={760} r={36} c="#fffaf0" />
          {[200, 450, 700].map((gx) => <line key={gx} x1={gx} y1={40} x2={gx} y2={720} stroke="#d7dbe6" strokeWidth={10} />)}
          {[200, 400, 600].map((gy) => <line key={gy} x1={40} y1={gy} x2={860} y2={gy} stroke="#d7dbe6" strokeWidth={10} />)}
          {[[200, 200], [450, 400], [700, 200], [200, 600], [700, 600]].map(([hx, hy], i) => <Hydrant key={i} x={hx} y={hy + 40} s={0.5} />)}
          <g transform={`translate(${lerp(-980, 0, sl)} ${lerp(-120, 0, sl)}) rotate(${lerp(-10, 0, sl)} 450 380)`}>
            <rect x={20} y={20} width={860} height={720} rx={30} fill="#7cf0ff" opacity={0.42} stroke="#2a8fb8" strokeWidth={8} />
            {[[200, 210], [450, 410], [700, 610]].map(([dx, dy], i) => <circle key={i} cx={dx} cy={dy} r={30} fill="#f2b43c" stroke="#8a5a10" strokeWidth={6} />)}
          </g>
          {ck > 0 && <path d={`M450 ${410 - 90} A90 90 0 ${ck > 0.5 ? 1 : 0} 1 ${450 + 90 * Math.sin(ck * Math.PI * 2)} ${410 - 90 * Math.cos(ck * Math.PI * 2)}`}
            stroke="#e2574c" strokeWidth={14} fill="none" strokeLinecap="round" />}
          <g transform={`translate(${450 + 90 * Math.sin(ck * Math.PI * 2) + 20} ${410 - 90 * Math.cos(ck * Math.PI * 2) - 200}) rotate(25)`} opacity={sl > 0.8 ? 1 : 0}>
            <rect x={-14} y={0} width={28} height={220} rx={10} fill="#e2574c" stroke={line('#e2574c')} strokeWidth={5} />
            <path d="M-14 220 L0 260 L14 220 Z" fill="#f6d3b3" />
            <ellipse cx={20} cy={60} rx={60} ry={44} fill="#9a6440" />
          </g>
        </g>
        {person(ANALYST, 930, 1720, 0.9, {pose: 'point'}, ck > 0.5 ? 'surprised' : 'thinking', -0.6, 8)}
      </g>);
    }
    case 'rod-valve': {
      // detail: a rod foot comes down on an iron valve lid, headphones on, the wave on the amplifier starts to move
      const dn = ease(clamp01(t / 0.6));
      const wv = clamp01((t - 0.7) / 1.2);
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#5a5f74" />
        {Array.from({length: 18}, (_, i) => <circle key={i} cx={(i * 211) % 1080} cy={(i * 347) % 1920} r={6 + (i % 4) * 3} fill="#6c7187" />)}
        <ValveLid x={520} y={1180} s={3.2} />
        <g transform={`translate(520 ${lerp(300, 520, dn)})`}><ListeningRod len={600} pulse={wv} /></g>
        {person(TECH, 220, 2300, 2.0, {pose: 'hold'}, wv > 0.5 ? 'surprised' : 'thinking', 0.5, 5)}
        <Headphones x={232} y={2300 - 470 * 2.0} s={1.9} on={wv} />
        <g transform="translate(820 560)"><LitBox x={-200} y={-100} w={400} h={200} r={36} c="#2a2f45" />
          <Wave x={-170} y={0} w={340} amp={0.05 + 0.5 * wv} frame={frame} c="#7cff9e" /></g>
      </g>);
    }
    case 'tiny-crew': {
      // ground level: three small technicians walk the street above a water main that runs off both edges of the frame
      const wk = t;
      return svg(<g>
        {houses(860, 0.2, 140)}
        <StreetSection y={880} frame={frame} leak={0} pipeY={420} crackX={-400} />
        {[[TECH, 260], [CREW, 540], [MATE, 820]].map(([who, px], i) => { const go = wk < 1.2; return <g key={i}>
          {person(who as Partial<FigureProps>, (px as number) + Math.min(wk, 1.2) * 40, 900 - (go ? 0 : 50 * Math.abs(Math.sin((wk - 1.2) * 4 + i))), 0.72,
            go ? {pose: 'stand', walk: wk + i * 0.3} : move(wk, 1.2, 'stand', ['cheer', 'raise', 'wave'][i] as FigurePose), go ? 'determined' : 'excited', 0.2 - i * 0.2, 5 + i)}</g>; })}
        <Mark x={560} y={1290} on={(wk - 0.9) * 2.5} ok s={1.3} />
        {[0, 1].map((k) => { const ph = ((frame / 30) + k * 0.5) % 1; return <path key={k} d={`M${80 + ph * 900} 1300 l40 0`} stroke="#bfe6ff" strokeWidth={10} strokeLinecap="round" opacity={0.8} />; })}
        <g transform="translate(160 1420)"><path d="M0 0 L-90 0 M-60 -30 L-100 0 L-60 30" stroke="#ffffff" strokeWidth={12} strokeLinecap="round" fill="none" /></g>
        <g transform="translate(920 1420)"><path d="M0 0 L90 0 M60 -30 L100 0 L60 30" stroke="#ffffff" strokeWidth={12} strokeLinecap="round" fill="none" /></g>
        <g transform={`translate(760 ${lerp(420, 500, pop(t, 0.5))})`}><LitBox x={-230} y={-60} w={460} h={120} r={40} c="#e2574c" />
          <Word x={0} y={22} t="three people" size={56} c="#ffffff" /></g>
      </g>);
    }
    case 'checks-close': {
      // detail on the tablet: gold pins flip to green checks one after another, a counter lands on 34
      const ck = after(since('s8-fixed'), 0.45);
      const n = Math.round(34 * ck);
      return svg(<g>
        {houses(1150, 0.26, 160)}
        <TabletV2 x={540} y={900} scale={0.92} tilt={2}>
          <g transform="translate(-120 -260) scale(1.5)"><TabletMap frame={frame} lines={1} pins={1} checks={ck} /></g>
        </TabletV2>
        <g transform={`translate(540 ${lerp(320, 400, pop(since('s8-fixed'), 0.5))})`}><LitBox x={-200} y={-66} w={400} h={132} r={44} c="#2fbf71" />
          <Word x={0} y={26} t={`${n} fixed`} size={66} c="#ffffff" /></g>
        {person(TECH, 900, 1760, 0.9, {pose: 'think'}, 'proud', -0.6, 5)}
      </g>);
    }
    case 'price-tag': {
      // close: the price tag swings onto the jug's neck over the rooftops
      const tg = pop(since('s11-cash'), 0.7);
      const sw = Math.sin(t * 5) * 14 * Math.max(0, 1 - t / 2.5);
      return svg(<g>
        {houses(1700, 0.22, 140)}
        <Jug x={500} y={1690} s={2.1} level={1} frame={frame} />
        <g transform={`translate(640 ${lerp(200, 640, tg)}) rotate(${sw - 6})`}>
          <path d="M-220 -100 L160 -100 L240 0 L160 100 L-220 100 Q-240 100 -240 80 L-240 -80 Q-240 -100 -220 -100 Z" fill="#2fbf71" stroke="#16643b" strokeWidth={8} />
          <circle cx={170} cy={0} r={18} fill="#ffffff" />
          <Word x={-40} y={24} t="$440,800" size={70} c="#ffffff" />
        </g>
        {person(TECH, 920, 1760, 0.85, move(t, 0.5, 'stand', 'point'), 'surprised', -0.6, 5)}
      </g>);
    }
    default:
      return svg(<g>
        <Satellite x={540} y={700} s={1} frame={frame} mood="curious" />
      </g>);
  }
};
