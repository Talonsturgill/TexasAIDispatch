import React from 'react';
import {useCurrentFrame} from 'remotion';
import type {FilmRenderProps} from '../../../modern/types';
import {actionWindows, type DirectedScene} from '../../../lib/direction';
import {Figure, castV2, type FigureEmotion, type FigurePose, type FigureProps} from '../../../look/Figure';
import {Burst, ContactShadow, Glow, clamp01, ease, easeOutBack, lerp} from '../../../look/Kit';
import {line, light, shade} from '../../../look/color';
import {BrickRanchV2, PierBeamHouseV2} from '../../../look/shelf/homeplace';
import {Oak} from '../../../look/regions';
import {TabletV2} from '../../../look/machines';
import {BulkyTruck, TruckSide, Yard, LitBox, Monitor, Mug, Notice, Office, Photo, RoofCam, WIN, Word, after, pop} from './parts';

/**
 * curb-camera-1121 (November 21st, 2026): "The camera sees the curb". Dallas put AI cameras from City Detect on 50
 * bulky trash trucks. They snap still photos of the curb, software blurs faces and plates and scores each photo, and a
 * person decides whether anything happens. Every fact is in claims.json. The truck, the houses, the analyst, the
 * officer, the director and the residents are illustrative, from the v2 cast. No real person's likeness, no city mark.
 *
 * Hero: the side camera with a face. Throughline: one instant photo of a brick ranch with tall grass. Snapped, blurred,
 * scored, stamped courtesy notice, and at the end a new photo of the same yard with the grass cut.
 */
const RES: Partial<FigureProps> = {...castV2('resident'), shirt: '#e2574c', glasses: false, hair: 'short', hairColor: '#2a1a10'};
const ANALYST: Partial<FigureProps> = {...castV2('technician'), hair: 'long', hairColor: '#2a1610', shirt: '#2f7fe0'};
const OFFICER: Partial<FigureProps> = {...castV2('hydrologist')};
const DIRECTOR: Partial<FigureProps> = {...castV2('executive')};
const ELDER: Partial<FigureProps> = {...castV2('owner'), hair: 'bald', top: 'snap', shirt: '#8b5fbf', glasses: true, build: 0.6};
const NEIGHBOUR: Partial<FigureProps> = {...castV2('farmer'), hat: 'none', hair: 'curly', shirt: '#36b37e'};

const move = (t: number, at: number, before: FigurePose, after2: FigurePose) => (
  t < at ? {pose: before} : {pose: after2, fromPose: before, poseBlend: clamp01((t - at) / 0.35)}
);

/** tall grass tufts along a strip, `cut` 0 to 1 mows them left to right */
const Grass: React.FC<{x0: number; x1: number; y: number; h?: number; cut?: number; frame: number}> = ({x0, x1, y, h = 90, cut = 0, frame}) => {
  const n = Math.round((x1 - x0) / 22);
  return <g>{Array.from({length: n}, (_, i) => {
    const x = x0 + i * 22;
    const mown = (i / n) < cut;
    const hh = mown ? h * 0.18 : h * (0.8 + 0.3 * Math.sin(i * 1.7));
    const sw = Math.sin(frame / 12 + i) * 6;
    return <path key={i} d={`M${x} ${y} Q${x + 4 + sw * 0.5} ${y - hh * 0.6} ${x + 8 + sw} ${y - hh}`} stroke={i % 3 ? '#4f9e3c' : '#6cbf4a'}
      strokeWidth={10} strokeLinecap="round" fill="none" />;
  })}</g>;
};

/** a mailbox on a post, `flag` 0 to 1 raises the red flag, `door` 0 to 1 opens it */
const Mailbox: React.FC<{x: number; y: number; s?: number; flag?: number; door?: number}> = ({x, y, s = 1, flag = 0, door = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ContactShadow x={0} y={4} w={120} opacity={0.35} />
    <rect x={-14} y={-300} width={28} height={300} rx={10} fill="#8a5a3c" stroke={line('#8a5a3c')} strokeWidth={5} />
    <path d="M-120 -300 L-120 -400 Q-120 -460 -60 -460 L100 -460 Q140 -460 140 -400 L140 -300 Z" fill="#5b6ee1" stroke={line('#5b6ee1')} strokeWidth={7} />
    <path d="M-100 -440 Q0 -456 110 -444" stroke="#ffffff" strokeWidth={10} strokeLinecap="round" opacity={0.6} fill="none" />
    <g transform={`translate(140 -300) rotate(${-80 * door})`}><rect x={-6} y={-160} width={20} height={160} rx={8} fill={shade('#5b6ee1', 0.3)} /></g>
    <g transform={`translate(-110 -360) rotate(${-90 * flag})`}>
      <rect x={-8} y={-6} width={16} height={110} rx={6} fill="#ff4d4d" />
      <rect x={-8} y={86} width={60} height={34} rx={8} fill="#ff4d4d" />
    </g>
  </g>
);

/** the round stamp, `on` 0 to 1 lights it */
const Stamp: React.FC<{x: number; y: number; label: string; c: string; on: number; press?: number}> = ({x, y, label, c, on, press = 0}) => (
  <g transform={`translate(${x} ${y - 30 * on + 20 * press}) scale(${1 + 0.12 * Math.sin(clamp01(on) * Math.PI)})`}>
    <ContactShadow x={0} y={60 + 30 * on} w={130} opacity={0.3} />
    <rect x={-22} y={-90} width={44} height={70} rx={18} fill={shade(c, 0.2)} stroke={line(c)} strokeWidth={5} />
    <circle cx={0} cy={-104} r={30} fill={c} stroke={line(c)} strokeWidth={5} />
    <rect x={-74} y={-24} width={148} height={60} rx={22} fill={on > 0.5 ? c : '#cfd6e6'} stroke={line(c)} strokeWidth={6} />
    {on > 0.3 && <Glow x={0} y={6} r={120} color={c} opacity={0.35 * on} />}
    <text x={0} y={16} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={900} fontSize={24} fill={on > 0.5 ? '#ffffff' : '#5a6078'}>{label}</text>
  </g>
);

/** the city as a rounded blob with the Trinity running through it; drawn in a 900 wide box at (x,y) */
const CityMap: React.FC<{x: number; y: number; children?: React.ReactNode}> = ({x, y, children}) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M80 120 Q160 20 340 40 Q520 0 700 60 Q860 120 840 320 Q880 520 800 700 Q720 880 480 860 Q240 900 120 760 Q20 600 50 400 Q20 240 80 120 Z"
      fill="#eef3fb" stroke="#9fb0d6" strokeWidth={10} />
    <path d="M140 160 Q300 300 420 420 Q520 520 560 600 Q600 700 760 760" stroke="#7cc4f2" strokeWidth={26} strokeLinecap="round" fill="none" />
    <path d="M60 470 Q450 430 850 480" stroke="#2b1d5e" strokeWidth={6} strokeDasharray="22 16" opacity={0.5} fill="none" />
    {children}
  </g>
);

/** a jar of photo chips: fill 0 to 1, `slice` is the fraction drawn as green notices at the bottom */
const Jar: React.FC<{x: number; y: number; fill: number; slice: number; label: string}> = ({x, y, fill, slice, label}) => {
  const H = 560, W = 300;
  const top = H * fill;
  return (
    <g transform={`translate(${x} ${y})`}>
      <ContactShadow x={0} y={10} w={360} opacity={0.35} />
      <clipPath id={`jar-${x}`}><rect x={-W / 2 + 10} y={-H} width={W - 20} height={H - 10} rx={40} /></clipPath>
      <g clipPath={`url(#jar-${x})`}>
        {Array.from({length: 40}, (_, i) => {
          const r = Math.floor(i / 4), c = i % 4;
          const yy = -20 - r * 56;
          if (-yy > top) return null;
          return <rect key={i} x={-W / 2 + 20 + c * 66 + (r % 2) * 10} y={yy - 46} width={58} height={46} rx={10}
            fill={['#fffaf0', '#ffe7a6', '#e8eefc'][i % 3]} stroke="#9aa3bd" strokeWidth={3} />;
        })}
        <rect x={-W / 2} y={-10 - H * slice * fill} width={W} height={H * slice * fill} fill="#36b37e" opacity={0.9} />
      </g>
      <rect x={-W / 2} y={-H - 10} width={W} height={H + 10} rx={50} fill="#bfe3ff" opacity={0.18} stroke="#e8f4ff" strokeWidth={10} />
      <path d={`M${-W / 2 + 30} ${-H + 30} Q${-W / 2 + 20} ${-H / 2} ${-W / 2 + 34} -40`} stroke="#ffffff" strokeWidth={14} strokeLinecap="round" opacity={0.6} fill="none" />
      <rect x={-W / 2 - 20} y={-H - 50} width={W + 40} height={50} rx={22} fill="#5a6078" />
      <Word x={0} y={-H - 80} t={label} size={32} c="#fff6e6" />
    </g>
  );
};

/** a person with a contact shadow, the way every figure here stands */
export const CurbCameraFilm: React.FC<FilmRenderProps> = ({board, shot, time_s, shot_s}) => {
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
  const house = (x: number, y: number, s: number, seed: number, brick?: string) => (
    <BrickRanchV2 x={x} y={y} scale={s} frame={frame} seed={seed} w={300} h={130} soil="blackland" brick={brick} />
  );

  switch (shot.view) {
    case 'street-roll': {
      if (shot.scene_id === 's1') {
        // s1 wide: the truck rolls in from the left past the brick ranch, the camera snaps, the neighbour waves
        const sn = 3;
        const roll = clamp01(t / 5.5);
        const tx = lerp(250, 640, roll);
        const flashes = [0.35, 2.6, 4.2].map((a) => (since('s1-snap') - a) / 0.45);
        const pr = pop(since('s1-print'), 0.6, 1.8);
        const lastFlash = flashes.filter((f) => f >= 0 && f < 1).pop() ?? 0;
        return svg(<g>
          <Oak x={930} y={900} s={0.8} frame={frame} seed={3} />
          {house(520, 900, 0.27, 11)}
          <rect x={-60} y={880} width={1200} height={112} fill="#5fae46" />
          <Grass x0={160} x1={940} y={960} h={100} frame={frame} />
          <rect x={-40} y={990} width={1160} height={34} rx={14} fill="#d8d2c6" />
          <rect x={-40} y={1024} width={1160} height={1000} fill="#5b5d73" />
          {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={((i * 280 - t * 120) % 1400) - 100} y={1180} width={140} height={16} rx={8} fill="#f3d36b" opacity={0.8} />)}
          {person(NEIGHBOUR, 200, 990, 1.05, {pose: 'wave'}, 'happy', 0.4, 6)}
          <BulkyTruck x={tx} y={1300} s={0.8} frame={frame} speed={roll < 1 ? 0.8 : 0.1}
            cam={{x: 0, y: 0, frame, mood: pr > 0.5 ? 'happy' : 'curious', flash: lastFlash, look: -0.6, s: 1.9}} />
          {flashes.map((f, i) => f >= 0 && f < 1 ? <circle key={i} cx={tx + 220} cy={860} r={80 + f * 400} fill="none" stroke="#ffffff" strokeWidth={10} opacity={1 - f} /> : null)}
          {pr > 0 && <Photo x={lerp(tx + 220, 740, pr)} y={lerp(900, 560, pr)} s={lerp(0.1, 0.5, pr)} rot={lerp(-30, 6, pr)} frame={frame} item="grass" blur={0} seed={1} />}
          <Burst x={740} y={560} p={(since('s1-print') - 0.5) / 0.6} color="#ffe066" />
        </g>);
      }
      // s14 wide: weeks later, the same yard mowed, the truck passes and the camera snaps, nothing flagged, it winks
      const ps = since('s14-pass');
      const roll = ease(clamp01((ps + 0.6) / 2.4));
      const tx = lerp(-200, 560, roll);
      const fl = (ps - 0.9) / 0.45;
            return svg(<g>
        <Oak x={930} y={900} s={0.8} frame={frame} seed={3} />
        {house(520, 900, 0.27, 11)}
        <rect x={-60} y={880} width={1200} height={112} fill="#5fae46" />
          <Grass x0={160} x1={940} y={960} h={100} cut={1} frame={frame} />
        <rect x={-40} y={990} width={1160} height={34} rx={14} fill="#d8d2c6" />
        <rect x={-40} y={1024} width={1160} height={1000} fill="#5b5d73" />
        {person(RES, 860, 990, 1.0, move(ps, 0.6, 'hold', 'wave'), 'happy', -0.4, 2)}
        <BulkyTruck x={tx} y={1260} s={0.66} frame={frame} speed={roll < 1 ? 0.7 : 0.1}
          cam={{x: 0, y: 0, frame, mood: fl > 0.6 ? 'happy' : 'curious', flash: fl >= 0 && fl < 1 ? fl : 0, look: -0.6}} />
        {fl > 0.8 && <Photo x={760} y={560} s={0.55 * pop(ps - 1.2, 0.5)} rot={6} frame={frame} item="none" blur={1} seed={3} />}
      </g>);
    }
    case 'cam-close': {
      if (shot.scene_id === 's1') {
        // s1 close: the camera's face, it flashes at each house as the street slides behind it
        const sn = 3;
        const fc = since('s1-curb');
        const ph = (t % 1.4) / 1.4;
        const f2 = fc >= 0 && fc < 0.45 ? fc / 0.45 : (ph < 0.3 ? ph / 0.3 : 0);
        const pr = 0;
        return svg(<g>
          {[0, 1, 2].map((i) => {
            const hx = ((i * 520 - t * 260) % 1560) + 900;
            return <g key={i}>{house(hx - 520, 900, 0.22, 20 + i, ['#c0603e', '#b5733f', '#d1a07a'][i])}</g>;
          })}
          <TruckSide y={1040} frame={frame} />
          <RoofCam x={420} y={1010} s={2.4} frame={frame} mood={sn < 0.3 ? 'sleepy' : pr > 0.5 ? 'happy' : 'curious'} flash={f2} look={-0.8} />
          {pr > 0 && <Photo x={lerp(440, 760, pr)} y={lerp(850, 600, pr)} s={lerp(0.12, 0.55, pr)} rot={lerp(-30, 5, pr)} frame={frame} item="grass" blur={0} seed={1} />}
          <Burst x={760} y={600} p={(since('s1-print') - 0.5) / 0.6} color="#ffe066" />
        </g>);
      }
      // s4 close: the camera reads a plate under a black box that says MOTOR VEHICLE and droops
      const bx = since('s4-box');
      const slam = pop(bx, 0.35, 2.2);
      return svg(<g>
        <TruckSide y={1090} frame={frame} speed={0} />
        <g transform="translate(540 600) scale(0.85)">
          <rect x={-470} y={-330} width={940} height={640} rx={44} fill="#fffaf0" stroke={line('#fffaf0')} strokeWidth={8} />
          <rect x={-430} y={-290} width={860} height={500} rx={26} fill="#8fc7ff" />
          <rect x={-430} y={20} width={860} height={190} rx={0} fill="#9a9aa8" />
          <path d="M-250 -150 Q-230 -270 -120 -280 L120 -280 Q230 -270 250 -150 Z" fill="#c95436" stroke={line('#e06b4a')} strokeWidth={8} />
          <path d="M-200 -160 Q-185 -250 -105 -256 L105 -256 Q185 -250 200 -160 Z" fill="#1d2150" />
          <circle cx={-250} cy={170} r={60} fill="#26223d" /><circle cx={250} cy={170} r={60} fill="#26223d" />
          <rect x={-330} y={-150} width={660} height={300} rx={60} fill="#e06b4a" stroke={line('#e06b4a')} strokeWidth={8} />
          <rect x={-300} y={-110} width={90} height={50} rx={18} fill="#ff4d4d" /><rect x={210} y={-110} width={90} height={50} rx={18} fill="#ff4d4d" />
          <rect x={-170} y={-70} width={340} height={140} rx={20} fill="#ffffff" stroke="#9aa3bd" strokeWidth={6} />
          <rect x={-150} y={-40} width={300} height={80} rx={14} fill="#c7d2fe" opacity={0.9} />
          {slam > 0 && <g transform={`translate(0 ${-200 * (1 - slam)}) scale(${slam})`}>
            <rect x={-200} y={-80} width={400} height={160} rx={20} fill="#15122a" />
            <text x={0} y={16} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={900} fontSize={50} fill="#ffffff">MOTOR VEHICLE</text>
          </g>}
        </g>
        <Burst x={540} y={600} p={(bx - 0.3) / 0.6} color="#ffcc00" />
        <RoofCam x={540} y={1080} s={2.2} frame={frame} mood={bx > 0.4 ? 'worried' : 'focused'} look={0} />
      </g>);
    }
    case 'cloud-scan': {
      if (shot.scene_id === 's2') {
        // s2 detail: a film strip tears into stills, the grass photo rises into a cloud and a scan box sweeps it
        const nt = since('s2-not');
        const up = since('s2-up');
        const tear = after(nt - 0.2, 0.5);
        const rise = after(up, 1.0);
        const scan = clamp01((up - 0.9) / 1.6);
        return svg(<g>
          <rect x={-40} y={-40} width={1160} height={2000} fill="#dbe9ff" />
          {[[300, 560, 260], [560, 520, 320], [800, 580, 240]].map(([x, y, r], i) => <g key={i}>
            <circle cx={x} cy={y + 40} r={r} fill={shade('#ffffff', 0.12)} /><circle cx={x} cy={y} r={r} fill="#ffffff" /></g>)}
          <Word x={540} y={500} t="CITY DETECT" size={64} c="#2f7fe0" op={after(up - 0.3, 0.4)} />
          <RoofCam x={300} y={1760} s={1.7} frame={frame} mood={up > 0 ? 'happy' : 'curious'} flash={t < 0.5 ? t / 0.5 : 0} look={0.7} />
          {/* the strip: one long piece before the tear, single frames flying after */}
          {[0, 1, 2, 3].map((i) => {
            const dx = (i - 1.5) * 230;
            const fly = tear * (i % 2 ? 1 : -1);
            return <g key={i} transform={`translate(${540 + dx + fly * 60 * i + Math.sin(t * 1.7 + i) * 18} ${1000 + Math.sin(t * 2.4 + i) * 26 + fly * 40 - (i === 1 ? rise * 300 : 0)}) rotate(${fly * 14 * (i + 1) + Math.sin(t * 2 + i) * 6})`}
              opacity={i === 1 ? 1 : 1 - rise}>
              <rect x={-110} y={-90} width={220} height={180} rx={20} fill="#2a2d4a" />
              {[-80, -40, 0, 40, 80].map((y) => <rect key={y} x={-100} y={y - 6} width={12} height={12} rx={3} fill="#fffaf0" />)}
              <rect x={-80} y={-70} width={170} height={140} rx={12} fill={['#8fc7ff', '#7cbf5a', '#c0603e', '#ffe7a6'][i]} />
            </g>;
          })}
          {rise > 0.6 && <g>
            <Photo x={540} y={1020 - 80 * rise} s={0.9} frame={frame} item="grass" blur={0} box={scan > 0.8 ? (scan - 0.8) * 5 : 0} boxLabel="TALL GRASS" seed={1} />
            {scan > 0 && scan < 1 && <rect x={300 + scan * 380} y={780} width={14} height={440} rx={7} fill="#38f2e0" opacity={0.8} />}
          </g>}
        </g>);
      }
      return svg(<g />);
    }
    case 'score-tag': {
      // s7 detail: a yellow blight score tag clips onto the photo with a bounce
      const tg = pop(since('s7-tag'), 0.5, 2.0);
      return svg(<g>
        <rect x={-40} y={-40} width={1160} height={2000} fill="#dbe9ff" />
        <Photo x={500} y={720 + Math.sin(t * 2) * 14} s={0.95} rot={-3 + Math.sin(t * 1.3) * 2} frame={frame} item="grass" blur={1} box={1} boxLabel="TALL GRASS" seed={1} />
        {[0, 1, 2, 3].map((k) => {
          const a = after(t - 1.2 - k * 1.0, 0.5);
          const n = [4, 1, 3, 2][k];
          return a > 0 ? <g key={k} transform={`translate(${lerp(1300, 960, a)} ${480 + k * 150}) rotate(${(1 - a) * 20 + 4})`}>
            <rect x={-70} y={-55} width={140} height={110} rx={16} fill="#fffaf0" stroke="#9aa3bd" strokeWidth={4} />
            <rect x={-58} y={-44} width={116} height={70} rx={10} fill={['#7cbf5a', '#8fc7ff', '#c0603e', '#ffe7a6'][k]} />
            <g transform={`translate(52 -48) scale(${pop(t - 1.6 - k * 1.0, 0.4, 2)})`}><rect x={-28} y={-22} width={56} height={44} rx={14} fill="#ffcc00" stroke="#8a6a00" strokeWidth={4} />
              <text x={0} y={13} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={900} fontSize={34} fill="#3a2a00">{n}</text></g>
          </g> : null;
        })}
        {[1, 2, 3, 4].map((n) => <g key={n} transform={`translate(${240 + (n - 1) * 200} 1110)`} opacity={0.4 + 0.6 * (n === 2 ? tg : 0)}>
          <rect x={-70} y={-50} width={140} height={100} rx={30} fill={n === 2 ? '#ffcc00' : '#ffffff'} stroke="#c9a400" strokeWidth={6} />
          <text x={0} y={22} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={900} fontSize={60} fill="#3a2a00">{n}</text>
        </g>)}
        {tg > 0 && <g transform={`translate(${lerp(440, 780, tg)} ${lerp(1110, 470, tg)}) rotate(${12 * (1 - tg) + 10}) scale(${0.9 + 0.3 * tg})`}>
          <rect x={-80} y={-60} width={160} height={120} rx={34} fill="#ffcc00" stroke="#8a6a00" strokeWidth={7} />
          <circle cx={-50} cy={-32} r={12} fill="#8a6a00" />
          <text x={10} y={28} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={900} fontSize={80} fill="#3a2a00">2</text>
        </g>}
        <Burst x={780} y={470} p={(since('s7-tag') - 0.45) / 0.6} color="#ffcc00" />
      </g>);
    }
    case 'flag-board': {
      // s3 detail: three photos in a row, a box snaps on each in turn
      const g = since('s3-grass'), c = since('s3-car'), p = since('s3-paint');
      const shift = lerp(0, -260, ease(clamp01((t - 1.2) / 2.4)));
      return svg(<g>
        <rect x={-40} y={-40} width={1160} height={2000} fill="#fdf3e1" />
        <g transform={`translate(${shift} 0)`}>
          <Photo x={360} y={620} s={0.85} rot={-4} frame={frame} item="grass" blur={1} box={after(g, 0.3)} boxLabel="TALL GRASS" seed={4} />
          <g transform="translate(640 1010) rotate(3) scale(0.8)">
            <rect x={-250} y={-200} width={520} height={440} rx={34} fill="#fffaf0" stroke={line('#fffaf0')} strokeWidth={6} />
            <rect x={-220} y={-170} width={460} height={330} rx={22} fill="#7cbf5a" />
            <rect x={-220} y={-170} width={460} height={120} rx={22} fill="#8fc7ff" />
            <g transform="translate(20 60)"><rect x={-120} y={-60} width={240} height={70} rx={28} fill="#5b6ee1" /><rect x={-70} y={-110} width={140} height={60} rx={22} fill="#5b6ee1" />
              <circle cx={-70} cy={20} r={28} fill="#26223d" /><circle cx={70} cy={20} r={28} fill="#26223d" /></g>
            {c > 0 && <g opacity={after(c, 0.2)}><rect x={-130} y={-80} width={300} height={200} rx={16} fill="none" stroke="#ffcc00" strokeWidth={8} />
              <rect x={-130} y={-120} width={250} height={40} rx={20} fill="#ffcc00" />
              <text x={-116} y={-92} fontFamily="Inter, sans-serif" fontWeight={900} fontSize={24} fill="#3a2a00">CAR ON LAWN</text></g>}
          </g>
          <g transform="translate(980 620) rotate(-2) scale(0.85)">
            <rect x={-250} y={-200} width={520} height={440} rx={34} fill="#fffaf0" stroke={line('#fffaf0')} strokeWidth={6} />
            <rect x={-220} y={-170} width={460} height={330} rx={22} fill="#e8c9a0" />
            {Array.from({length: 7}, (_, i) => <path key={i} d={`M${-180 + i * 60} ${-60 + (i % 3) * 40} q20 -10 34 6 q-6 24 -30 20 z`} fill="#fffaf0" stroke="#b08a60" strokeWidth={4} />)}
            {p > 0 && <g opacity={after(p, 0.2)}><rect x={-200} y={-120} width={420} height={220} rx={16} fill="none" stroke="#ffcc00" strokeWidth={8} />
              <rect x={-200} y={-160} width={260} height={40} rx={20} fill="#ffcc00" />
              <text x={-186} y={-132} fontFamily="Inter, sans-serif" fontWeight={900} fontSize={24} fill="#3a2a00">PEELING PAINT</text></g>}
          </g>
        </g>
        {[g, c, p].map((s, i) => <Burst key={i} x={[360, 660, 1000][i] + shift} y={[620, 1010, 620][i]} p={(s - 0.1) / 0.5} color="#ffcc00" />)}
      </g>);
    }
    case 'chimney-yard': {
      // s3 medium: a box and a score tag slap onto a chimney, it coughs smoke, the owner looks up baffled
      const ch = since('s3-chimney');
      const box = after(ch, 0.25);
      const tag = pop(ch - 0.4, 0.4, 2.2);
      return svg(<g>
        <Yard lawn={1060} walk={1330} />
        {house(560, 1110, 0.3, 11)}
        <g transform="translate(520 1050) scale(0.8)">
          {/* the chimney stands behind the roof ridge */}
          <g transform={`translate(260 -440) scale(${1 + 0.08 * Math.sin(clamp01(box) * Math.PI)})`}>
            <rect x={-60} y={-260} width={120} height={300} rx={16} fill="#d58a6a" stroke={line('#d58a6a')} strokeWidth={7} />
            {[0, 1, 2].map((i) => <path key={i} d={`M${-40 + i * 30} ${-200 + i * 50} q14 -10 24 4 q-4 18 -22 14 z`} fill="#f4e6d8" />)}
            <rect x={-74} y={-280} width={148} height={40} rx={14} fill="#8a5a4a" />
            {ch > 0.3 && [0, 1, 2].map((i) => {
              const k = clamp01((ch - 0.3 - i * 0.18) / 1.2);
              return k > 0 && k < 1 ? <circle key={i} cx={-10 + i * 18 + k * 60} cy={-300 - k * 200} r={30 + k * 40} fill="#dfe3ee" opacity={0.8 * (1 - k)} /> : null;
            })}
            {box > 0 && <rect x={-100} y={-310} width={200} height={370} rx={20} fill="none" stroke="#ffcc00" strokeWidth={10} opacity={box} />}
          </g>
        </g>
        {tag > 0 && <g transform={`translate(330 ${520}) scale(${tag}) rotate(-6)`}>
          <rect x={-170} y={-60} width={340} height={120} rx={40} fill="#ffcc00" stroke="#8a6a00" strokeWidth={7} />
          <text x={0} y={-6} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={900} fontSize={34} fill="#3a2a00">CHIMNEY PAINT</text>
          <text x={0} y={40} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={900} fontSize={40} fill="#3a2a00">SCORE 2</text>
        </g>}
        {person(ELDER, 190, 1180, 1.25, move(ch, 0.5, 'think', 'shrug'), ch > 0.5 ? 'surprised' : 'thinking', 0.5, 5)}
        <Burst x={730} y={640} p={(ch - 0.2) / 0.6} color="#ffcc00" />
      </g>);
    }
    case 'blur-porch': {
      // s4 medium: the neighbour waves at the camera, the camera squints and the neighbour fogs; the plate smears
      const fc = since('s4-face'), pl = since('s4-plate');
      const fog = after(fc - 0.3, 0.8);
      const smear = after(pl, 0.5);
      return svg(<g>
        {house(560, 1180, 0.3, 14, '#b5733f')}
        <Grass x0={120} x1={980} y={1240} h={100} frame={frame} />
        <g transform="translate(760 1330)">
          <ContactShadow x={0} y={6} w={420} opacity={0.35} />
          <rect x={-200} y={-120} width={400} height={110} rx={46} fill="#e06b4a" stroke={line('#e06b4a')} strokeWidth={7} />
          <rect x={-120} y={-190} width={240} height={90} rx={36} fill="#e06b4a" stroke={line('#e06b4a')} strokeWidth={7} />
          <rect x={-90} y={-176} width={180} height={60} rx={20} fill="#1d2150" />
          <circle cx={-120} cy={-6} r={44} fill="#26223d" /><circle cx={120} cy={-6} r={44} fill="#26223d" />
          <rect x={-46} y={-80} width={92} height={36} rx={8} fill="#ffffff" stroke="#9aa3bd" strokeWidth={4} />
          <rect x={-56} y={-86} width={112} height={48} rx={14} fill="#c7d2fe" opacity={smear} />
        </g>
        {person(NEIGHBOUR, 330, 1290, 1.25, {pose: 'wave'}, 'happy', 0.3, 6)}
        {fog > 0 && <g opacity={fog}>
          <circle cx={330} cy={1290 - 1.25 * 330} r={95} fill="#dfe6ff" opacity={0.95} />
          <circle cx={330} cy={1290 - 1.25 * 330} r={130} fill="#dfe6ff" opacity={0.4} />
        </g>}
        <rect x={-40} y={1380} width={1160} height={600} fill="#2f7fe0" />
        <rect x={-40} y={1380} width={1160} height={24} fill={light('#2f7fe0', 0.4)} />
        <RoofCam x={540} y={1640} s={1.9} frame={frame} mood={fc > 0.2 ? 'focused' : 'curious'} blur={fog} look={-0.4} />
      </g>);
    }
    case 'analyst-desk': {
      if (shot.scene_id === 's7') {
        // s7 medium: the stack on her screen shuffles so the high scores rise; she leans in
        const so = since('s7-sort');
        const k = after(so, 1.0);
        return svg(<g>
          <Office frame={frame} win={WIN.wide} deskY={1260} />
          <Monitor x={300} y={640} w={620} h={420}>
            {[4, 2, 1, 3, 2].map((n, i) => {
              const sorted = [4, 3, 2, 2, 1].indexOf(n) + (n === 2 && i === 4 ? 1 : 0);
              const yy = lerp(i, sorted, k) * 78 + 20;
              return <g key={i} transform={`translate(30 ${yy})`}>
                <rect x={0} y={0} width={560} height={66} rx={18} fill="#21305e" />
                <rect x={12} y={10} width={80} height={46} rx={10} fill="#7cbf5a" />
                <rect x={110} y={22} width={300} height={20} rx={10} fill="#5a6a9a" />
                <rect x={470} y={10} width={74} height={46} rx={16} fill={n >= 3 ? '#ff8a5b' : '#ffcc00'} />
                <text x={507} y={45} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={900} fontSize={34} fill="#2a1a00">{n}</text>
              </g>;
            })}
          </Monitor>
          <Word x={610} y={600} t="LOOK FIRST" size={46} c="#ffcc00" op={k} />
          <Mug x={900} y={1290} s={0.9} frame={frame} />
          {person(ANALYST, 190, 1700, 1.6, move(so, 0.1, 'stand', 'point'), so > 0.1 ? 'thinking' : 'neutral', 0.5, 8)}
        </g>);
      }
      // s7 medium: she pulls the grass photo off the stack and studies it
      const rv = since('s8-review');
      const pull = after(rv, 0.8);
      return svg(<g>
        <Office frame={frame} win={WIN.wide} deskY={1260} />
        <g transform="translate(760 1250)">{Array.from({length: 6}, (_, i) => <rect key={i} x={-150} y={-30 - i * 22} width={300} height={22} rx={8}
          fill={['#fffaf0', '#ffe7a6', '#e8eefc'][i % 3]} stroke="#9aa3bd" strokeWidth={3} />)}</g>
        <Photo x={lerp(760, 560, pull)} y={lerp(1110, 760, pull)} s={lerp(0.4, 0.95, pull)} rot={lerp(8, -3, pull)} frame={frame} item="grass" blur={1}
          box={1} boxLabel="TALL GRASS" seed={1} />
        {pull > 0.5 && <g transform="translate(830 520) rotate(10)" opacity={pull}>
          <rect x={-60} y={-46} width={120} height={92} rx={30} fill="#ffcc00" stroke="#8a6a00" strokeWidth={6} />
          <text x={0} y={22} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={900} fontSize={60} fill="#3a2a00">2</text>
        </g>}
        {person(ANALYST, 200, 1720, 1.65, move(rv, 0.2, 'reach', 'hold'), rv > 0.4 ? 'thinking' : 'determined', 0.5, 8, {holding: <g transform={`rotate(${Math.sin(t * 2) * 4})`}><rect x={-60} y={-48} width={120} height={96} rx={12} fill="#fffaf0" stroke="#9aa3bd" strokeWidth={4} /><rect x={-50} y={-40} width={100} height={64} rx={8} fill="#7cbf5a" /></g>})}
      </g>);
    }
    case 'photo-storm': {
      // s6 overhead: a storm of photos pours onto the desk and stacks into a leaning tower; she throws her hands up
      const st = since('s6-storm');
      const n = Math.round(lerp(0, 46, after(st, 2.2)));
      return svg(<g>
        <rect x={-40} y={-40} width={1160} height={2000} fill="#c8925e" />
        <rect x={-40} y={-40} width={1160} height={2000} fill="url(#none)" />
        <rect x={80} y={300} width={920} height={1100} rx={40} fill="#d9a46a" stroke={line('#d9a46a')} strokeWidth={8} />
        {Array.from({length: 46}, (_, i) => {
          if (i >= n) return null;
          const fall = clamp01((st - i * 0.045) / 0.35);
          const tx = 540 + Math.sin(i * 2.3) * 300, ty = 820 + Math.cos(i * 1.7) * 360;
          return <g key={i} transform={`translate(${lerp(tx + 300, tx, fall)} ${lerp(ty - 900, ty, fall)}) rotate(${i * 37 % 60 - 30})`}>
            <rect x={-90} y={-70} width={180} height={140} rx={16} fill="#fffaf0" stroke="#9aa3bd" strokeWidth={4} />
            <rect x={-74} y={-56} width={148} height={90} rx={10} fill={['#8fc7ff', '#7cbf5a', '#c0603e'][i % 3]} />
          </g>;
        })}
        <g transform="translate(260 1100)">{Array.from({length: Math.min(14, Math.floor(n / 3))}, (_, i) => <rect key={i} x={-110 + Math.sin(i) * 8 + i * 3}
          y={-i * 34} width={220} height={30} rx={10} fill={['#fffaf0', '#ffe7a6', '#e8eefc'][i % 3]} stroke="#9aa3bd" strokeWidth={3} />)}</g>
        {person(ANALYST, 760, 1720, 1.7, move(st, 0.8, 'stand', 'panic'), st > 0.8 ? 'surprised' : 'neutral', -0.3, 8)}
      </g>);
    }
    case 'stamp-row': {
      if (shot.scene_id === 's14') {
        // s14 close: back at the desk, the new photo of the mowed yard; her hand presses the NOTHING stamp onto it
        const pd = since('s14-person');
        const press = after(pd, 0.25) - after(pd - 0.35, 0.3);
        return svg(<g>
          <Office frame={frame} win={null} deskY={1000} />
          <Photo x={200} y={560} s={0.36} rot={-10} frame={frame} item="grass" blur={1} box={1} boxLabel="TALL GRASS" seed={2} verdict="yes" stamp={1} />
          <Photo x={600} y={760} s={1.0} rot={3} frame={frame} item="none" blur={1} seed={3} />
          {pd > 0.25 && <g transform={`translate(600 980) rotate(-10) scale(${easeOutBack(clamp01((pd - 0.25) / 0.3), 2)})`}>
            <rect x={-190} y={-56} width={380} height={112} rx={36} fill="#ffffff" opacity={0.92} />
            <rect x={-190} y={-56} width={380} height={112} rx={36} fill="none" stroke="#5a6078" strokeWidth={12} />
            <text x={0} y={22} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={900} fontSize={64} fill="#5a6078">NOTHING</text>
          </g>}
          <Stamp x={lerp(300, 720, after(pd + 0.6, 0.6)) + 260 * after(pd - 0.5, 0.4)} y={lerp(1100, 860, press)} label="NOTHING" c="#9aa3bd" on={1} />
          {person(ANALYST, 920, 1820, 1.5, move(pd, 0.5, 'reach', 'cheer'), pd > 0.5 ? 'happy' : 'thinking', -0.4, 8)}
          <Burst x={720} y={760} p={(pd - 0.25) / 0.6} color="#7dffb0" />
        </g>);
      }
      // s8 close: five stamps light one by one, the notice stamp thumps down
      const fv = since('s8-five'), pk = since('s8-pick');
      const labels = ['NOTHING', 'WATCH', 'NOTICE', 'INSPECT', 'CREW'];
      const cols = ['#9aa3bd', '#5b6ee1', '#36b37e', '#ff8a5b', '#e0a030'];
      return svg(<g>
        <Office frame={frame} win={null} deskY={1000} />
        <Photo x={600} y={600} s={0.62} rot={-2} frame={frame} item="grass" blur={1} box={1} boxLabel="TALL GRASS" seed={1}
          verdict={pk > 0.2 ? 'yes' : null} stamp={after(pk - 0.2, 0.3)} />
        {pk > 0.3 && <Word x={600} y={880} t="COURTESY NOTICE" size={56} c="#36b37e" op={after(pk - 0.3, 0.3)} rot={-4} />}
        {labels.map((l, i) => {
          const on = after(fv - i * 0.55, 0.3);
          const press = i === 2 ? after(pk, 0.2) - after(pk - 0.3, 0.3) : 0;
          return <Stamp key={l} x={150 + i * 195} y={1090 + (i % 2) * 30} label={l} c={cols[i]} on={i === 2 && pk > 0 ? 1 : on * (i === 2 ? 1 : 0.8)} press={press} />;
        })}
        {person(ANALYST, 150, 1820, 1.5, {pose: 'reach'}, pk > 0.3 ? 'proud' : 'thinking', 0, 8)}
      </g>);
    }
    case 'mailbox': {
      // s8 medium: the stamped photo slides into the mailbox, the flag flips up, the resident comes down the drive
      const ml = since('s9-mail');
      const slide = after(ml, 0.7);
      return svg(<g>
        <Yard lawn={870} walk={1100} />
        {house(600, 880, 0.26, 11)}
        <Grass x0={140} x1={960} y={940} h={100} frame={frame} />
        <Mailbox x={820} y={1220} s={1.1} flag={after(ml - 0.7, 0.3)} door={1 - after(ml - 0.6, 0.3)} />
        {slide < 1 && <Photo x={lerp(500, 840, slide)} y={lerp(560, 790, slide)} s={lerp(0.55, 0.12, slide)} rot={lerp(-10, 0, slide)} frame={frame}
          item="grass" blur={1} seed={1} verdict="yes" stamp={1} />}
        {person(RES, lerp(200, 380, after(ml - 1.0, 1.2)), 1820, 2.1, ml < 1.0 ? {pose: 'stand' as FigurePose} : move(ml, 2.0, 'point', 'reach'), ml > 1.0 ? 'surprised' : 'neutral', 0.5, 2, {walk: ml > 1.0 && ml < 2.2 ? t * 2 : 0})}
        <Burst x={850} y={770} p={(ml - 0.75) / 0.6} color="#7dffb0" />
      </g>);
    }
    case 'officer-door': {
      // s8 wide: the officer walks up and knocks, the resident opens wary; the officer points at the grass and checks the tablet
      const kn = since('s9-knock'), sl = since('s9-still');
      const walk = ease(clamp01((t + 0.2) / 1.6));
      const ox = lerp(980, 640, walk);
      return svg(<g>
        <Yard lawn={950} walk={1500} />
        <BrickRanchV2 x={620} y={960} scale={0.3} frame={frame} seed={57} w={300} h={130} soil="blackland" brick="#d9c7a0" arch="none" garage={false} />
        <Grass x0={-40} x1={1120} y={1020} h={110} frame={frame} />
        {person(NEIGHBOUR, 230, 1800, 1.9, move(kn, 1.0, 'stand', 'crossed'), sl > 0 ? 'worried' : kn > 0.6 ? 'surprised' : 'neutral', 0.6, 2)}
        <Grass x0={820} x1={1120} y={1120} h={190} frame={frame} />
        {person(OFFICER, ox, 1830, 2.0, sl > 0 ? move(sl, 0, 'hold', 'point') : {pose: walk < 1 ? 'stand' : 'hold', walk: walk < 1 ? t * 2 : 0},
          sl > 0 ? 'determined' : 'neutral', -0.6, 4,
          {holding: <g><rect x={-46} y={-60} width={92} height={120} rx={14} fill="#c98a4a" stroke={line('#c98a4a')} strokeWidth={5} />
            <rect x={-34} y={-44} width={68} height={92} rx={8} fill="#fffaf0" /><path d="M-20 -20 l10 10 l20 -22" stroke="#22a06b" strokeWidth={8} fill="none" strokeLinecap="round" /></g>})}
        {sl > 0 && <g opacity={after(sl, 0.3)}>
          <rect x={800} y={920} width={300} height={220} rx={24} fill="none" stroke="#ffcc00" strokeWidth={10} strokeDasharray="22 12" />
          <rect x={850} y={880} width={200} height={44} rx={22} fill="#ffcc00" />
          <text x={950} y={911} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={900} fontSize={24} fill="#3a2a00">STILL TALL</text>
        </g>}
      </g>);
    }
    case 'photo-blur': {
      // s4 detail: the instant photo fills the frame; the waving neighbour fogs, then the plate smears; the camera squints in the corner
      const fc = since('s4-face'), pl = since('s4-plate');
      const fog = after(fc - 0.2, 0.8), smear = after(pl, 0.5);
      return svg(<g>
        <rect x={-40} y={-40} width={1160} height={2000} fill="#fdf3e1" />
        <Photo x={530} y={790} s={1.55} rot={-2} frame={frame} item="grass" blur={0} seed={1} />
        {/* the blur, drawn over the print at its scale: the neighbour at (40,110) and the plate at (120,128) in print units */}
        <g transform="translate(530 790) rotate(-2) scale(1.55)">
          <circle cx={40} cy={-24} r={30} fill="#dfe6ff" opacity={0.95 * fog} />
          <rect x={20} y={-40} width={40} height={90} rx={20} fill="#dfe6ff" opacity={0.7 * fog} />
          <rect x={94} y={98} width={52} height={24} rx={10} fill="#c7d2fe" opacity={0.98 * smear} />
        </g>
        {fog > 0 && fog < 1 && <circle cx={530 + 1.55 * 40} cy={790 - 1.55 * 24} r={60 + fog * 160} fill="none" stroke="#7dd3fc" strokeWidth={10} opacity={1 - fog} />}
        <RoofCam x={880} y={1520} s={1.2} frame={frame} mood={fc > 0.2 ? 'focused' : 'curious'} blur={fog} look={-0.7} />
      </g>);
    }
    case 'plate-wince': {
      // s5 medium: from beside the truck, the camera stares at a parked car whose plate stays sharp, and winces
      const sl = since('s5-slip');
      const ring = ((Math.max(0, sl) % 0.9) / 0.9);
      return svg(<g>
        <Yard lawn={800} walk={900} />
        {house(560, 820, 0.24, 18, '#d1a07a')}
        <Grass x0={100} x1={1000} y={870} h={50} frame={frame} />
        <g transform="translate(560 1080)">
          <ContactShadow x={0} y={6} w={620} opacity={0.35} />
          <rect x={-300} y={-170} width={600} height={160} rx={60} fill="#e0b13a" stroke={line('#e0b13a')} strokeWidth={8} />
          <rect x={-180} y={-260} width={360} height={120} rx={48} fill="#e0b13a" stroke={line('#e0b13a')} strokeWidth={8} />
          <rect x={-140} y={-244} width={280} height={80} rx={26} fill="#1d2150" />
          <circle cx={-180} cy={-8} r={60} fill="#26223d" /><circle cx={180} cy={-8} r={60} fill="#26223d" />
          <rect x={-70} y={-120} width={140} height={56} rx={10} fill="#ffffff" stroke="#3a3550" strokeWidth={5} />
          <text x={0} y={-80} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={900} fontSize={34} fill="#3a3550">ABC XYZ</text>
          {sl > 0 && <circle cx={0} cy={-92} r={90 + ring * 60} fill="none" stroke="#ff4d4d" strokeWidth={10} opacity={1 - ring} />}
        </g>
        <TruckSide y={1420} frame={frame} speed={0} />
        <RoofCam x={380} y={1700} s={1.9} frame={frame} mood={sl > 0.3 ? 'worried' : 'curious'} look={0} />
        <Burst x={560} y={990} p={(sl - 0.2) / 0.6} color="#ff8a8a" />
      </g>);
    }
    case 'scan-lock': {
      // s2 close: inside the software, the box hunts across the print and locks on the tall grass
      const up = since('s2-up');
      const hunt = clamp01(t / 1.6);
      const lock = after(t - 1.6, 0.4);
      const bx = lerp(lerp(-200, 120, (Math.sin(t * 4) + 1) / 2), -150, lock), by = lerp(lerp(-120, 60, hunt), 70, lock);
      return svg(<g>
        <rect x={-40} y={-40} width={1160} height={2000} fill="#14214a" />
        {Array.from({length: 14}, (_, i) => <rect key={i} x={0} y={420 + i * 52} width={1080} height={2} fill="#2a3d7a" />)}
        <g transform="translate(540 760) scale(1.5)">
          <Photo x={0} y={0} frame={frame} item="grass" blur={0} seed={1} />
          <rect x={bx - 80} y={by - 50} width={lerp(200, 220, lock)} height={lerp(120, 100, lock)} rx={14} fill="none" stroke={lock > 0.5 ? '#ffcc00' : '#38f2e0'} strokeWidth={6} />
          {lock > 0.5 && <g><rect x={bx - 80} y={by - 90} width={170} height={34} rx={17} fill="#ffcc00" />
            <text x={bx - 68} y={by - 66} fontFamily="Inter, sans-serif" fontWeight={900} fontSize={20} fill="#3a2a00">TALL GRASS</text></g>}
        </g>
        <Burst x={540 + 1.5 * (bx + 30)} y={760 + 1.5 * by} p={(t - 1.7) / 0.6} color="#ffcc00" />
        <RoofCam x={860} y={1640} s={1.1} frame={frame} mood={lock > 0.5 ? 'happy' : 'focused'} look={-0.6} />
        {up < -99 && null}
      </g>);
    }
    case 'viewfinder': {
      // s5 detail: what the camera sees, the plate filling the viewfinder, sharp, with a red ring and the 99 percent dial
      const ring = (t % 0.9) / 0.9;
      return svg(<g>
        <rect x={-40} y={-40} width={1160} height={2000} fill="#0f1533" />
        <g transform="translate(540 760)">
          <rect x={-420} y={-300} width={840} height={600} rx={50} fill="#e0b13a" />
          <rect x={-240} y={-90} width={480} height={190} rx={22} fill="#ffffff" stroke="#3a3550" strokeWidth={10} />
          <text x={0} y={36} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={900} fontSize={110} fill="#3a3550">ABC XYZ</text>
          <circle cx={0} cy={0} r={300 + ring * 80} fill="none" stroke="#ff4d4d" strokeWidth={12} opacity={1 - ring} />
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => <path key={i} d={`M${a * 380} ${b * 220} v${-b * 70} M${a * 380} ${b * 220} h${-a * 70}`}
            stroke="#ffffff" strokeWidth={12} strokeLinecap="round" />)}
        </g>
        <Word x={540} y={1110} t="NOT BLURRED" size={64} c="#ff6b6b" op={after(t - 0.4, 0.3)} />
        <RoofCam x={860} y={1660} s={1.2} frame={frame} mood="worried" look={0} />
      </g>);
    }
    case 'sliver-close': {
      // s12 close: the bottom rows of the south grid, one and a half green tiles out of the hundred, circled; the question lands
      const op = since('s12-open');
      const q = pop(op, 0.5, 2.4);
      const cell = 120, gap = 16;
      return svg(<g>
        <rect x={-40} y={-40} width={1160} height={2000} fill="#fdf3e1" />
        <rect x={420} y={410} width={620} height={90} rx={40} fill="#1f2a5a" />
        <text x={730} y={472} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={900} fontSize={42} fill="#7dffb0">SOUTH, UNDER 2 IN 100</text>
        {Array.from({length: 28}, (_, i) => {
          const r = Math.floor(i / 7), c = i % 7;
          const x = 70 + c * (cell + gap), y = 540 + r * (cell + gap);
          const green = i === 27 ? 1 : i === 26 ? 0.5 : 0;
          return <g key={i}>
            <rect x={x} y={y} width={cell} height={cell} rx={22} fill={['#ffe7a6', '#e8eefc', '#fff1c8'][i % 3]} stroke="#c9b27a" strokeWidth={4} />
            {green > 0 && <rect x={x} y={y} width={cell * green} height={cell} rx={22} fill="#22a06b" />}
          </g>;
        })}
        <circle cx={70 + 6 * (cell + gap) - 10} cy={540 + 3 * (cell + gap) + 60} r={170 + 10 * Math.sin(t * 5)} fill="none" stroke="#ff6b6b" strokeWidth={10} />
        {q > 0 && <g transform={`translate(380 ${lerp(300, 760, q)}) rotate(${Math.sin(op * 6) * 12 * (1 - clamp01(op / 2))})`}><Word x={0} y={0} t="?" size={240} c="#ff8a5b" /></g>}
        {person(ANALYST, 880, 1960, 1.15, {pose: 'shrug'}, 'thinking', -0.4, 8)}
      </g>);
    }
    case 'spanish-insert': {
      // s13 detail: the Spanish version slides out beside the English notice, both big
      const es = Math.max(after(t - 0.2, 0.6), after(since('s13-es'), 0.6));
      return svg(<g>
        <rect x={-40} y={-40} width={1160} height={2000} fill="#7aa6e8" />
        <Notice x={lerp(540, 330, es)} y={780} s={0.95} rot={-6} qr={1} frame={frame} />
        <g opacity={es}><Notice x={lerp(540, 760, es)} y={800} s={0.95} rot={6} qr={1} title="AVISO" frame={frame} /></g>
        <Word x={760} y={1150} t="REQUESTED" size={52} c="#ffcc00" op={es} />
      </g>);
    }
    case 'city-map': {
      if (shot.scene_id === 's10') {
        // s10 split: the city fills with flashes, then the photos slide south across the line into one tall leaning stack
        const mp = since('s10-map'), so = since('s10-south');
        const flashes = Math.round(lerp(30, 60, after(mp, 1.2)));
        const slide = after(so, 1.6);
        return svg(<g>
          <rect x={-40} y={-40} width={1160} height={2000} fill="#fdf3e1" />
          <Word x={540} y={470} t="DALLAS" size={60} c="#2f7fe0" op={1 - after(so - 0.2, 0.4)} />
          {person(ELDER, 880, 1990, 1.35, move(so, 0.3, 'think', 'shrug'), so > 0.3 ? 'worried' : 'thinking', -0.5, 5)}
          <g opacity={1 - 0.85 * after(so - 0.2, 0.4)}><CityMap x={90} y={500}>
            {Array.from({length: 60}, (_, i) => {
              if (i >= flashes) return null;
              const south = i % 10 < 7;
              const x = 160 + ((i * 97) % 600), y0 = south ? 520 + ((i * 53) % 300) : 120 + ((i * 61) % 320);
              const y = south ? lerp(y0, 760 + (i % 5) * 10, slide) : y0;
              const xx = south ? lerp(x, 380 + (i % 7) * 6, slide) : x;
              return <g key={i} transform={`translate(${xx} ${south ? y - slide * (i % 42) * 14 : y})`}>
                <rect x={-22} y={-16} width={44} height={32} rx={6} fill={south ? '#ffcc00' : '#ffe7a6'} stroke="#8a6a00" strokeWidth={3} />
              </g>;
            })}
          </CityMap></g>
          {[{x: 330, n: 14, lab: '13,800', sub: 'SOUTH'}, {x: 750, n: 7, lab: '7,300', sub: 'REST OF CITY'}].map((st, j) => {
            const k = after(so - 0.2 - j * 0.25, 0.5);
            return <g key={j} opacity={clamp01(k * 3)} transform={`rotate(${Math.sin(t * 3 + j) * 1.5 * k} ${st.x} 1120)`}>
              {false && [0, 1, 2].map((q) => {
                const ph = ((t * 0.9 + q / 3) % 1);
                return <rect key={`d${q}`} x={st.x - 60 + q * 30} y={lerp(420, 1060 - st.n * 32, ph)} width={120} height={26} rx={8} fill="#ffcc00"
                  stroke="#8a6a00" strokeWidth={3} opacity={1 - ph * 0.6} transform={`rotate(${ph * 160 + q * 40} ${st.x + q * 30} ${lerp(420, 1060 - st.n * 32, ph)})`} />;
              })}
              <ContactShadow x={st.x} y={1124} w={260} opacity={0.35} />
              {Array.from({length: Math.round(st.n * k)}, (_, i) => <rect key={i} x={st.x - 110 + Math.sin(i + j) * 8} y={1090 - i * 32} width={220} height={30} rx={9}
                fill={j ? '#ffe7a6' : '#ffcc00'} stroke="#8a6a00" strokeWidth={3} />)}
              <Word x={st.x} y={1060 - Math.round(st.n * k) * 32 - 70} t={st.lab} size={64} c={j ? '#5b6ee1' : '#ff8a5b'} />
              <Word x={st.x} y={1060 - Math.round(st.n * k) * 32 - 20} t={st.sub} size={34} c="#3a3550" />
            </g>;
          })}
        </g>);
      }
      // s10 split: route lines draw across the whole map, then the complaint map lays over and matches
      const rt = since('s11-routes'), mt = since('s11-match');
      const draw = after(rt, 1.4);
      const over = after(mt, 0.8);
      return svg(<g>
        <rect x={-40} y={-40} width={1160} height={2000} fill="#fdf3e1" />
        {person(DIRECTOR, 160, 1990, 1.35, move(mt, 0.6, 'stand', 'point'), mt > 0.6 ? 'proud' : 'determined', 0.5, 9)}
        <CityMap x={90} y={460}>
          {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${100 + i * 20} ${150 + i * 110} Q450 ${80 + i * 130} ${800 - i * 10} ${180 + i * 105}`}
            stroke="#2f7fe0" strokeWidth={14} strokeLinecap="round" fill="none" strokeDasharray="1200" strokeDashoffset={1200 * (1 - clamp01(draw * 1.4 - i * 0.08))} />)}
          {draw > 0.6 && [0, 1, 2, 3, 4, 5].map((i) => {
            const u = ((t * 0.35 + i * 0.17) % 1);
            const x0 = 100 + i * 20, y0 = 150 + i * 110, x2 = 800 - i * 10, y2 = 180 + i * 105, cx = 450, cy = 80 + i * 130;
            const bx = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x2, by = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy + u * u * y2;
            return <g key={`t${i}`}><circle cx={bx} cy={by} r={18} fill="#ffffff" stroke="#2f7fe0" strokeWidth={6} /><circle cx={bx} cy={by} r={7} fill="#2f7fe0" /></g>;
          })}
          {Array.from({length: 30}, (_, i) => {
            const south = i % 10 < 7;
            const x = 160 + ((i * 97) % 600), y = south ? 520 + ((i * 53) % 300) : 120 + ((i * 61) % 320);
            return <g key={i}>
              <rect x={x - 18} y={y - 14} width={36} height={28} rx={6} fill="#ffcc00" stroke="#8a6a00" strokeWidth={3} />
              {over > 0 && <circle cx={x + (1 - over) * 80} cy={y - (1 - over) * 60} r={26 + (over >= 1 ? 6 * Math.sin(t * 6 + i) : 0)} fill="none" stroke="#e0115f" strokeWidth={9} opacity={over} />}
            </g>;
          })}
        </CityMap>
      </g>);
    }
    case 'south-porch': {
      // s9 medium: an older resident on a south Dallas porch lowers a notice and frowns at the passing truck
      const pc = since('s10-porch');
      return svg(<g>
        <Yard lawn={930} walk={1330} />
        <PierBeamHouseV2 x={560} y={940} scale={0.26} frame={frame} seed={31} soil="blackland" wear={0.6} />
        <rect x={140} y={2900} width={800} height={50} rx={14} fill="#d8c6a8" stroke={line('#d8c6a8')} strokeWidth={5} />
        <Grass x0={100} x1={1000} y={1010} h={80} frame={frame} />
        {person(ELDER, 380, 1800, 2.1, pc < 0.6 ? {pose: 'hold' as FigurePose} : move(pc, 0.6, 'hold', 'shrug'), pc > 0.4 ? 'worried' : 'thinking', pc > 0.6 ? 0.8 : 0.3, 5,
          {holding: <g transform="rotate(-8) scale(0.36)"><rect x={-150} y={-260} width={300} height={560} rx={40} fill="#fff8e8" stroke="#c9b27a" strokeWidth={8} /><rect x={-120} y={-120} width={240} height={56} rx={20} fill="#2f7fe0" /></g>})}
        <g opacity={0.9}><BulkyTruck x={lerp(1300, 900, ease(clamp01(t / 2.4)))} y={1620} s={0.45} frame={frame} speed={0.5}
          cam={{x: 0, y: 0, frame, mood: 'curious', look: -0.8}} /></g>
      </g>);
    }
    case 'director-map': {
      // s10 medium: the director lays the complaint map over the camera map on a big board and taps it
      const mt = since('s11-match');
      const lay = after(mt, 0.8);
      return svg(<g>
        <Office frame={frame} win={null} deskY={1500} wall="#8fb3ec" />
        <g transform="translate(560 960) scale(0.62)">
          <LitBox x={-520} y={-560} w={1040} h={1120} r={50} c="#f4f6fb" />
          <CityMap x={-450} y={-460}>
            {Array.from({length: 24}, (_, i) => <circle key={i} cx={160 + ((i * 97) % 600)} cy={i % 10 < 7 ? 520 + ((i * 53) % 300) : 120 + ((i * 61) % 320)} r={20} fill="#ffcc00" />)}
          </CityMap>
          <g transform={`translate(${lerp(700, 0, lay)} ${lerp(-300, 0, lay)}) rotate(${lerp(14, 0, lay)})`} opacity={0.8}>
            <CityMap x={-450} y={-460}>
              {Array.from({length: 24}, (_, i) => <circle key={i} cx={160 + ((i * 97) % 600)} cy={i % 10 < 7 ? 520 + ((i * 53) % 300) : 120 + ((i * 61) % 320)} r={28}
                fill="none" stroke="#ff5d8f" strokeWidth={8} />)}
            </CityMap>
          </g>
        </g>
        <g transform="translate(560 960) scale(0.62)">
          {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${-350 + i * 20} ${-310 + i * 120} Q0 ${-380 + i * 140} ${350 - i * 10} ${-280 + i * 115}`}
            stroke="#2f7fe0" strokeWidth={16} strokeLinecap="round" fill="none" strokeDasharray="1000"
            strokeDashoffset={1000 * (1 - clamp01(after(since('s11-routes'), 1.0) * 1.4 - i * 0.08))} />)}
        </g>
        {lay > 0.95 && <Burst x={560} y={960} p={(mt - 0.8) / 0.6} color="#7dffb0" />}
        {person(DIRECTOR, 170, 1240, 1.25, since('s11-dir') < 0.4 ? {pose: 'stand' as FigurePose} : move(mt, 0.8, 'point', 'hips'), mt > 0.8 ? 'proud' : 'determined', 0.6, 9)}
      </g>);
    }
    case 'percent-jars': {
      // s12 split: each grid is 100 flagged photos; the green tiles are the share that became courtesy notices,
      // under 2 in the south, over 4 in the rest of the city, drawn to scale and lit on their own lines
      const jr = since('s12-jars'), rs = since('s12-rest'), op = since('s12-open');
      const q = pop(op, 0.5, 2.4);
      const G = (x0: number, label1: string, label2: string, green: number, lit: number, glow: number) => {
        const cell = 40, gap = 6;
        return <g>
          <rect x={x0 - 18} y={560} width={10 * (cell + gap) + 30} height={10 * (cell + gap) + 30} rx={30} fill="#ffffff" stroke="#c9d0e4" strokeWidth={6} />
          {glow > 0 && <Glow x={x0 + 230} y={790} r={300} color="#22a06b" opacity={0.3 * glow} />}
          {Array.from({length: 100}, (_, i) => {
            const r = Math.floor(i / 10), c = i % 10;
            const appear = after(jr + 1.4 - i * 0.008, 0.2);
            const k = 99 - i;
            const isGreen = k < Math.floor(green), half = k === Math.floor(green) && green % 1 > 0;
            const g = lit * (isGreen ? 1 : half ? 0.5 : 0);
            return <g key={i} opacity={appear}>
              <rect x={x0 + c * (cell + gap)} y={575 + r * (cell + gap)} width={cell} height={cell} rx={9} fill={['#ffe7a6', '#e8eefc', '#fff1c8'][i % 3]} stroke="#c9b27a" strokeWidth={2} />
              {g > 0 && <rect x={x0 + c * (cell + gap)} y={575 + r * (cell + gap)} width={cell * (half ? 0.5 : 1)} height={cell} rx={9} fill="#22a06b" />}
            </g>;
          })}
          <rect x={x0 - 18} y={420} width={10 * (cell + gap) + 30} height={120} rx={40} fill="#1f2a5a" />
          <text x={x0 + 222} y={472} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={900} fontSize={34} fill="#ffffff">{label1}</text>
          <text x={x0 + 222} y={522} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={900} fontSize={42} fill="#7dffb0">{label2}</text>
        </g>;
      };
      const litS = after(jr - 0.4, 0.4), litR = after(rs, 0.4);
      return svg(<g>
        <rect x={-40} y={-40} width={1160} height={2000} fill="#fdf3e1" />
        <g transform="translate(0 0) scale(1)">
          <g transform="translate(20 0) scale(0.95)">{G(30, 'SOUTH', 'UNDER 2 IN 100', 1.5, litS, 0)}</g>
          <g transform="translate(20 0) scale(0.95)">{G(590, 'REST OF CITY', 'OVER 4 IN 100', 4.5, litR, after(rs, 0.4) * (1 - after(rs - 1.4, 0.6)))}</g>
        </g>
        <Burst x={830} y={1010} p={(rs - 0.1) / 0.6} color="#7dffb0" />
        {q > 0 && <g transform={`translate(540 ${lerp(300, 820, q)}) rotate(${Math.sin(op * 6) * 10 * (1 - clamp01(op / 2))})`}><Word x={0} y={0} t="?" size={200} c="#ff8a5b" /></g>}
        {person(ANALYST, 300, 1990, 1.4, move(rs, 0.2, 'think', 'point'), rs > 0.2 ? 'surprised' : 'thinking', 0.5, 8)}
      </g>);
    }
    case 'plate-miss': {
      // s12 detail: one plate shows sharp with a red ring, then a wall of photos re-blurs in a wave
      const ms = since('s5-miss'), ag = since('s5-again');
      const wave = after(ag, 1.4);
      return svg(<g>
        <rect x={-40} y={-40} width={1160} height={2000} fill="#e8eefc" />
        {Array.from({length: 9}, (_, i) => {
          const c = i % 3, r = Math.floor(i / 3);
          const x = 200 + c * 340, y = 540 + r * 290;
          const blurred = i !== 4 || wave > c / 3 + 0.2;
          return <g key={i} transform={`translate(${x} ${y}) scale(0.5)`}>
            <Photo x={0} y={0} frame={frame} item={(['grass', 'couch', 'fence'] as const)[i % 3]} blur={blurred ? Math.min(1, wave * 3 - c + (i === 4 ? 0 : 3)) : 0} seed={10 + i} />
            {wave > c / 3 && wave < c / 3 + 0.35 && <rect x={-260} y={-210} width={520} height={440} rx={34} fill="#7dd3fc" opacity={0.35} />}
          </g>;
        })}
        {ms > 0 && wave < 0.5 && <circle cx={540 + 0.5 * 120} cy={830 + 0.5 * 110} r={60 + 20 * Math.sin(ms * 8)} fill="none" stroke="#ff4d4d" strokeWidth={10} />}
        {person(ANALYST, 900, 1850, 1.3, move(ag, 1.0, 'think', 'cheer'), ag > 1.0 ? 'happy' : 'worried', -0.4, 8)}
      </g>);
    }
    case 'notice-hand': {
      // s13 close: the notice on the door draws a QR code in, the resident raises a phone, a Spanish notice slides out
      const qr = since('s13-qr'), es = since('s13-es');
      return svg(<g>
        <Yard lawn={1000} walk={1500} />
        <Mailbox x={170} y={1500} s={1.2} flag={0} door={1} />
        <Notice x={480} y={760} s={1.0} rot={-3} qr={after(qr, 1.2)} es={after(es, 0.6)} frame={frame} />
        {person(RES, 860, 1800, 2.0, move(qr, 0.6, 'stand', 'hold'), qr > 0.6 ? 'happy' : 'thinking', -0.5, 2,
          qr > 0.6 ? {holding: <g transform="rotate(-12)"><rect x={-34} y={-62} width={68} height={124} rx={14} fill="#26223d" />
            <rect x={-27} y={-53} width={54} height={100} rx={9} fill="#7dd3fc" />
            <rect x={-16} y={-30} width={32} height={32} rx={4} fill="#ffffff" opacity={after(qr - 1.0, 0.4)} /></g>} : {})}
      </g>);
    }
    case 'mow-yard': {
      // s14 medium: the resident pushes a mower through the tall grass, leaving a cut stripe
      const mw = since('s14-mow');
      const k = clamp01((mw + 0.2) / 3.6);
      const mx = lerp(420, 1000, k);
      return svg(<g>
        <Yard lawn={850} walk={1250} />
        {house(560, 860, 0.27, 11)}
        <Grass x0={-40} x1={1120} y={1110} h={140} cut={0.36 + 0.64 * k} frame={frame} />
        <rect x={-40} y={1110} width={mx + 40} height={30} rx={12} fill="#6cbf4a" opacity={0.6} />
        <g transform={`translate(${mx} 1130)`}>
          <ContactShadow x={0} y={4} w={220} opacity={0.4} />
          <rect x={-90} y={-80} width={180} height={70} rx={30} fill="#e0303a" stroke={line('#e0303a')} strokeWidth={6} />
          <circle cx={-60} cy={-10} r={24} fill="#26223d" /><circle cx={60} cy={-10} r={24} fill="#26223d" />
          <path d="M-70 -80 L-170 -250" stroke="#3a3550" strokeWidth={14} strokeLinecap="round" />
          <rect x={-200} y={-262} width={70} height={22} rx={11} fill="#3a3550" />
          {Array.from({length: 5}, (_, i) => <circle key={i} cx={90 + i * 20 + Math.sin(frame / 3 + i) * 10} cy={-60 - i * 14} r={6} fill="#6cbf4a" opacity={0.8} />)}
        </g>
        {person(RES, mx - 230, 1150, 1.4, {pose: 'reach'}, k > 0.5 ? 'proud' : 'determined', 0.6, 2, {walk: t * 2.2})}
        <Burst x={980} y={1060} p={(mw - 3.4) / 0.6} color="#7dffb0" />
      </g>);
    }
    default:
      return svg(<g>{house(540, 1200, 0.3, 1)}</g>);
  }
};
