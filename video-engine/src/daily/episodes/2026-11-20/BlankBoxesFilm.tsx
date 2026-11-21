import React from 'react';
import {useCurrentFrame} from 'remotion';
import type {FilmRenderProps} from '../../../modern/types';
import {actionWindows, type DirectedScene} from '../../../lib/direction';
import {Figure, castV2, type FigureEmotion, type FigurePose, type FigureProps} from '../../../look/Figure';
import {Burst, ContactShadow, Glow, clamp01, ease, easeOutBack, lerp} from '../../../look/Kit';
import {line, light, shade} from '../../../look/color';
import {SchoolBusV2, SchoolMarqueeV2} from '../../../look/shelf/hometown';
import {FONT} from '../../../lib/type';
import {
  AppTile, ClassRoom, Desk, Folder, Highlighter, IEPPage, Laptop, Lines, LitBox, PencilCup, Scale, Sheet, SkyArc, Stopwatch, Vault, WIN, Word,
  after, pop, type BoxState,
} from './parts';

/**
 * blank-boxes-1120 (November 20th, 2026): "The window stays gold". At Mesquite ISD, east of Dallas, special education
 * teachers use an AI tool built with Panorama Education that pulls a student's data into a draft IEP and lights up the
 * template boxes a teacher may have forgotten. Teachers reported drafting fell from up to three hours to about 45
 * minutes per student. Every fact is in claims.json. The teacher, the student, the parent and the classroom are
 * illustrative, from the v2 cast. No real person's likeness, no product mark.
 *
 * Hero: the highlighter with a face. Throughline: the student's folder. Stuffed, fed by three streams, glowing at its
 * blank boxes, closed with a green check. The window's sun keeps the time.
 */
const TEACH: Partial<FigureProps> = {...castV2('teacher')};
const KID: Partial<FigureProps> = {...castV2('resident'), skin: '#c98a5a', hair: 'curly', hairColor: '#2a1a10', top: 'tee', shirt: '#36b37e',
  pants: '#3b4a6b', glasses: false, build: 0.4};
const PARENT: Partial<FigureProps> = {...castV2('owner')};

const move = (t: number, at: number, before: FigurePose, after2: FigurePose) => (
  t < at ? {pose: before} : {pose: after2, fromPose: before, poseBlend: clamp01((t - at) / 0.35)}
);

/** the six box labels on the draft, plain words from the claims */
const LABELS = ['PRESENT LEVELS', 'ACADEMICS', 'ATTENDANCE', 'BEHAVIOR', 'GOALS', 'SERVICES'];

export const BlankBoxesFilm: React.FC<FilmRenderProps> = ({board, shot, time_s, shot_s}) => {
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
  /** the window sun: an overlay inside the window rect, t 0 gold afternoon to 1 night */
  const windowSky = (win: {x: number; y: number; w: number; h: number}, k: number) => (
    <g>
      <clipPath id={`sky-${shot.id}`}><rect x={win.x} y={win.y} width={win.w} height={win.h} rx={46} /></clipPath>
      <g clipPath={`url(#sky-${shot.id})`}>
        <rect x={win.x} y={win.y} width={win.w} height={win.h} fill="#ffb347" opacity={0.25 * (1 - k) * (k > 0.02 ? 1 : 0.6)} />
        <rect x={win.x} y={win.y} width={win.w} height={win.h} fill="#ff7a3d" opacity={0.35 * Math.sin(clamp01(k) * Math.PI)} />
        <rect x={win.x} y={win.y} width={win.w} height={win.h} fill="#1c1a5c" opacity={0.8 * clamp01((k - 0.55) / 0.45)} />
        <SkyArc x={win.x} y={win.y} w={win.w} t={k} />
        {k > 0.8 && [0, 1, 2, 3, 4].map((i) => <circle key={i} cx={win.x + 80 + i * 170} cy={win.y + 60 + (i % 2) * 70} r={4} fill="#ffffff"
          opacity={clamp01((k - 0.8) * 5) * (0.6 + 0.4 * Math.sin(frame / 6 + i))} />)}
      </g>
    </g>
  );

  switch (shot.view) {
    case 'desk-dusk': {
      if (shot.scene_id === 's1') {
        // s1 wide: three folders tumble off the stack and she juggles them for three seconds, then slaps the fat one on the desk
        const c = since('s1-catch') + 0.3;
        const DROP = 3.9;
        const drop = after(c - DROP, 0.35);
        const land = pop(c - DROP - 0.35, 0.4, 2.2);
        const juggling = c < DROP;
        const hands = {x: 560, y: 1000};
        return svg(<g>
          <ClassRoom frame={frame} win={WIN.wide} floorY={1150} />
          {windowSky(WIN.wide, 0)}
          <g transform="translate(0 -230)">
            <Desk x={640} y={1360} w={700} />
            <PencilCup x={880} y={1336} s={0.8} frame={frame} />
            <g transform={`translate(380 1336) rotate(${Math.sin(c * 5) * 6 * (juggling ? 1 : 0.2)})`}>
              {Array.from({length: 5}, (_, k) => <rect key={k} x={-110 + (k % 2) * 8} y={-34 - k * 30} width={220} height={30} rx={10}
                fill={['#f2c46d', '#e8b35a', '#f6d48a'][k % 3]} stroke={line('#f2c46d')} strokeWidth={4} />)}
            </g>
          </g>
          {person(TEACH, 300, 1620, 1.95, juggling ? {pose: Math.sin(c * 4.2) > 0 ? 'reach' : 'raise', fromPose: Math.sin(c * 4.2) > 0 ? 'raise' : 'reach', poseBlend: clamp01(Math.abs(Math.sin(c * 4.2)) * 2)}
            : move(c, DROP, 'reach', 'hips'), juggling ? (c < 1.2 ? 'surprised' : 'determined') : 'worried', 0.4, 4)}
          {juggling && [0, 1, 2].map((k) => {
            const ph = (c * 1.1 + k / 3) % 1;
            const x = hands.x - 60 + ph * 380, y = hands.y - Math.sin(ph * Math.PI) * 360;
            return <g key={k} transform={`translate(${x} ${y}) rotate(${ph * 300 + k * 40}) scale(1.5)`}>
              <rect x={-95} y={-26} width={190} height={52} rx={12} fill={['#f2c46d', '#e8b35a', '#f6d48a'][k]} stroke={line('#f2c46d')} strokeWidth={5} />
              {k === 0 && [0, 1].map((q) => <rect key={q} x={-70 + q * 50} y={-50 - q * 6} width={60} height={34} rx={6} fill="#fffaf0" stroke={line('#fffaf0')} strokeWidth={3} />)}
            </g>;
          })}
          {!juggling && <g transform={`translate(${lerp(460, 660, drop)} ${lerp(900, 1070 - 6 * Math.sin(land * Math.PI), drop)}) scale(${0.62 + 0.05 * (1 - land)} ${0.62 - 0.06 * (1 - land)})`}>
            <Folder x={0} y={0} frame={frame} stack={1} label="STUDENT" />
          </g>}
          <Burst x={660} y={1060} p={(c - DROP - 0.35) / 0.6} color="#ffd36b" />
        </g>);
      }
      // s14 wide: the folder snaps shut with a green check while the window is still gold; the teacher turns to the kid
      const cl = since('s14-close');
      return svg(<g>
        <ClassRoom frame={frame} win={WIN.wide} floorY={1150} />
        {windowSky(WIN.wide, 0.12)}
          <g transform="translate(0 -230)">
        <Desk x={560} y={1360} w={720} />
        <Highlighter x={830} y={1330} s={0.42} frame={frame} mood="proud" cap={0} />
        <g transform="translate(560 1290) scale(0.6)">
          <Folder x={0} y={0} frame={frame} stack={0} sticky={1} ribbon={after(cl, 0.7) + (cl > 0.7 ? 0.01 : 0)} label="STUDENT" open={1 - after(cl, 0.3)} />
        </g>
        {person(KID, 900, 1700, 1.15, {pose: cl > 0.6 ? 'cheer' : 'stand', fromPose: 'stand', poseBlend: clamp01((cl - 0.6) / 0.35)}, cl > 0.6 ? 'excited' : 'happy', -0.6, 9)}
        {person(TEACH, 230, 1730, 1.7, move(cl, 0.4, 'hold', 'wave'), cl > 0.4 ? 'happy' : 'proud', 0.6, 4)}
        <Burst x={560} y={1260} p={(cl - 0.7) / 0.6} color="#7dffb0" />
      </g></g>);
    }
    case 'folder-spill': {
      if (shot.scene_id === 's1') {
        // s1 close: the folder flops open and blank pages spill across the desk; the teacher winces
        const o = since('s1-open');
        const open = after(o, 0.4);
        return svg(<g>
          <ClassRoom frame={frame} win={null} floorY={1500} />
          <rect x={-60} y={1180} width={1200} height={800} rx={0} fill="#b9814f" />
          <rect x={-60} y={1180} width={1200} height={20} fill={light('#b9814f', 0.4)} />
          <Folder x={540} y={1300} s={1.3} frame={frame} stack={1} label="STUDENT" open={open} />
          {Array.from({length: 7}, (_, i) => {
            const p = after(o - 0.15 - i * 0.07, 0.7);
            return p > 0 ? <Sheet key={i} x={540 + (i - 3) * 150 * p} y={1240 - 360 * Math.sin(p * Math.PI) * (0.6 + (i % 3) * 0.2) + 220 * p}
              rot={(i - 3) * 22 * p} s={0.8} /> : null;
          })}
          {person(TEACH, 880, 1900, 2.1, move(o, 0.2, 'hold', 'shrug'), o > 0.2 ? 'worried' : 'thinking', -0.6, 4)}
        </g>);
      }
      // s5 close: three streams of chips pour into the open folder and a draft page rises out of it
      const pr = since('s5-pour');
      const rise = after(pr - 0.6, 1.4);
      const cols = ['#4f8cff', '#ff8a3d', '#b46bff'];
      return svg(<g>
        <ClassRoom frame={frame} win={null} floorY={1500} />
        <rect x={-60} y={1180} width={1200} height={800} fill="#b9814f" />
        {[0, 1, 2].map((k) => {
          const sx = 180 + k * 360;
          const on = pr > k * 0.5;
          return <g key={k}>
            <path d={`M${sx} 300 C${sx} 700 540 700 540 1080`} stroke={shade(cols[k], 0.2)} strokeWidth={48} fill="none" strokeLinecap="round" />
            <path d={`M${sx} 300 C${sx} 700 540 700 540 1080`} stroke={cols[k]} strokeWidth={34} fill="none" strokeLinecap="round" />
            {on && Array.from({length: 6}, (_, i) => {
              const q = ((frame / 26) + i / 6 + k * 0.13) % 1;
              const x = Math.pow(1 - q, 3) * sx + 3 * Math.pow(1 - q, 2) * q * sx + 3 * (1 - q) * q * q * 540 + q * q * q * 540;
              const y = Math.pow(1 - q, 3) * 300 + 3 * Math.pow(1 - q, 2) * q * 700 + 3 * (1 - q) * q * q * 700 + q * q * q * 1080;
              return <rect key={i} x={x - 20} y={y - 20} width={40} height={40} rx={12} fill={light(cols[k], 0.4)} stroke={line(cols[k])} strokeWidth={4} />;
            })}
          </g>;
        })}
        <IEPPage x={540} y={lerp(1300, 980, rise)} s={0.75} frame={frame} p={rise} boxes={['filled', 'filled', 'filled', 'empty', 'empty', 'empty']} />
        <Folder x={540} y={1380} s={1.2} frame={frame} stack={0.2} label="STUDENT" open={1} />
        {person(TEACH, 920, 1900, 2.0, {pose: 'think'}, pr > 0.4 ? 'surprised' : 'thinking', -0.7, 4)}
      </g>);
    }
    case 'page-build': {
      if (shot.scene_id === 's2') {
        // s2 detail: the blank IEP page slides out and its six empty boxes pop into place
        const s = since('s2-iep');
        const p = pop(s, 0.6, 1.4);
        return svg(<g>
          <IEPPage x={540} y={1000} s={1.45} frame={frame} p={p} boxes={['empty', 'empty', 'empty', 'empty', 'empty', 'empty']} labels={LABELS} />
          <Word x={540} y={1640} t="INDIVIDUAL PLAN" size={58} c="#3b6fd1" op={after(s - 0.6, 0.4)} />
        </g>);
      }
      // s6 detail: the top boxes fill with typed lines as data chips drop in
      const f = since('s6-fill');
      const boxes: BoxState[] = ['empty', 'empty', 'empty', 'empty', 'empty', 'empty'];
      const n = Math.floor(clamp01(f / 1.6) * 4);
      for (let i = 0; i < n; i++) boxes[i] = 'filled';
      return svg(<g>
        <IEPPage x={540} y={1000} s={1.45} frame={frame} boxes={boxes} labels={LABELS} />
        {Array.from({length: 4}, (_, i) => {
          const q = after(f - i * 0.4, 0.4);
          const col = i % 2, row = Math.floor(i / 2);
          const tx = 540 + (-260 + 26 + col * 244 + 113) * 1.45, ty = 1000 + (-350 + 116 + row * 182 + 80) * 1.45;
          return q > 0 && q < 1 ? <rect key={i} x={tx - 26} y={lerp(300, ty, q) - 26} width={52} height={52} rx={14}
            fill={['#4f8cff', '#ff8a3d', '#b46bff', '#4f8cff'][i]} stroke="#1a1236" strokeWidth={3} /> : null;
        })}
        <Highlighter x={930} y={1640} s={0.7} frame={frame} mood="curious" look={-1} lean={-10} />
      </g>);
    }
    case 'sun-sink': {
      if (shot.scene_id === 's2') {
        // s2 medium: the window's sun slides from gold to night while the teacher slumps under the lamp
        const sn = since('s2-sun');
        const k = after(sn, 2.6) * (1 - after(sn - 3.3, 0.35));
        const tw = since('s2-tower');
        return svg(<g>
          <ClassRoom frame={frame} win={WIN.medium} floorY={1220} dusk={k} />
          {windowSky(WIN.medium, k)}
          <g transform="translate(0 -230)">
          <Desk x={540} y={1430} w={860} />
          <g transform="translate(330 1380) scale(0.55)"><IEPPage x={0} y={0} frame={frame} boxes={['empty', 'empty', 'empty', 'empty', 'empty', 'empty']} rot={-6} /></g>
          <g transform="translate(780 1300)">
            <path d="M0 80 V-120 L-120 -200" stroke="#4a4a6a" strokeWidth={14} fill="none" strokeLinecap="round" />
            <path d="M-180 -170 L-60 -240 L-30 -180 Z" fill="#ffcf4a" stroke={line('#ffcf4a')} strokeWidth={6} strokeLinejoin="round" />
            {k > 0.3 && <Glow x={-110} y={-150} r={260} color="#ffd66b" opacity={0.5 * k} />}
            <ellipse cx={0} cy={86} rx={70} ry={16} fill="#4a4a6a" />
          </g>
          {person(TEACH, 560, lerp(1780, 1820, k), 1.9, {pose: k > 0.5 ? 'think' : 'hold'}, k > 0.4 ? 'worried' : 'neutral', 0, 4)}
          <Word x={860} y={560} t="UP TO 3 HR" size={68} c="#fff6e6" op={clamp01(k * 3)} />
          {tw > 0 && <g transform={`translate(150 1400) rotate(${Math.sin(frame / 6) * 3 * after(tw - 0.8, 0.3)})`}>
            {Array.from({length: Math.floor(after(tw, 0.9) * 14)}, (_, i) => <rect key={i} x={-90 + (i % 2) * 6} y={-30 - i * 26} width={180} height={24} rx={8}
              fill={['#fffaf0', '#eaf4ff'][i % 2]} stroke={line('#fffaf0')} strokeWidth={3} />)}
          </g>}
        </g></g>);
      }
      // s10 medium: the new way. The sun moves only a quarter, still gold; the teacher throws both arms up
      const nw = since('s10-new');
      const k = 0.25 * after(nw, 1.4);
      return svg(<g>
        <ClassRoom frame={frame} win={WIN.medium} floorY={1220} />
        {windowSky(WIN.medium, k)}
          <g transform="translate(0 -230)">
        <Desk x={540} y={1430} w={860} />
        <g transform="translate(330 1380) scale(0.55)"><IEPPage x={0} y={0} frame={frame} boxes={['filled', 'filled', 'pen', 'filled', 'pen', 'filled']} rot={-6} /></g>
        <Highlighter x={800} y={1400} s={0.5} frame={frame} mood={nw > 1.4 ? 'proud' : 'happy'} squash={nw > 1.4 && nw < 1.7 ? 0.6 : 0} />
        {person(TEACH, 560, 1800, 1.9, move(nw, 1.3, 'hold', 'cheer'), nw > 1.3 ? 'excited' : 'happy', 0, 4)}
        <Word x={860} y={560} t="45 MIN" size={72} c="#fff6e6" op={after(nw - 1.2, 0.3)} />
        <Burst x={540} y={1080} p={(nw - 1.4) / 0.6} color="#ffe14d" />
      </g></g>);
    }
    case 'chips-overhead': {
      // s5 overhead: looking down into the open folder as three colored streams of chips land in it
      const pr = since('s5-pour');
      const cols = ['#4f8cff', '#ff8a3d', '#b46bff'];
      const fill = after(pr - 0.4, 2.0);
      return svg(<g>
        <rect x={-60} y={-60} width={1200} height={2100} fill="#b9814f" />
        {Array.from({length: 8}, (_, i) => <path key={i} d={`M-60 ${200 + i * 240} H1140`} stroke={shade('#b9814f', 0.15)} strokeWidth={4} opacity={0.5} />)}
        <g transform="translate(540 1040)">
          <ContactShadow x={0} y={420} w={800} opacity={0.3} />
          <rect x={-380} y={-460} width={760} height={900} rx={40} fill="#f2c46d" stroke={line('#f2c46d')} strokeWidth={8} />
          <rect x={-330} y={-410} width={660} height={800} rx={26} fill="#fffaf0" />
          <IEPPage x={0} y={0} s={1.1} frame={frame} p={1} boxes={[fill > 0.2 ? 'filled' : 'empty', fill > 0.45 ? 'filled' : 'empty', fill > 0.7 ? 'filled' : 'empty', fill > 0.95 ? 'filled' : 'empty', 'empty', 'empty']} />
        </g>
        {cols.map((c, k) => Array.from({length: 7}, (_, i) => {
          const q = ((frame / 22) + i / 7 + k * 0.21) % 1;
          if (pr < k * 0.3) return null;
          const a = (k / 3) * Math.PI * 2 + 0.6;
          const r = lerp(700, 40, q);
          const x = 540 + Math.cos(a + q * 2) * r, y = 1040 + Math.sin(a + q * 2) * r * 0.9;
          return <rect key={`${k}-${i}`} x={x - 26} y={y - 26} width={52} height={52} rx={14} fill={light(c, 0.3)} stroke={line(c)} strokeWidth={4}
            transform={`rotate(${q * 200} ${x} ${y})`} opacity={1 - q * 0.6} />;
        }))}
        <Burst x={540} y={1040} p={(pr - 0.3) / 0.6} color="#ffd36b" />
      </g>);
    }
    case 'screen-glow': {
      // s6 close, from behind the laptop: the teacher's face lit by the screen as present levels fill in line by line
      const f = since('s6-fill');
      const lit = 0.5 + 0.5 * after(f, 1.2);
      return svg(<g>
        <ClassRoom frame={frame} win={WIN.medium} floorY={1500} />
        {windowSky(WIN.medium, 0.1)}
        {person(TEACH, 560, 1640, 2.3, {pose: 'think'}, f > 1 ? 'happy' : 'thinking', 0, 4)}
        <Glow x={560} y={1050} r={420} color="#cfe0ff" opacity={0.55 * lit} />
        {/* the laptop lid back, in the foreground */}
        <g transform="translate(540 1500)">
          <rect x={-420} y={-260} width={840} height={520} rx={40} fill="#c9cfe0" stroke={line('#c9cfe0')} strokeWidth={9} />
          <rect x={-380} y={-224} width={420} height={18} rx={9} fill="#ffffff" opacity={0.5} />
          <circle cx={0} cy={0} r={46} fill={shade('#c9cfe0', 0.2)} />
          <rect x={-480} y={250} width={960} height={70} rx={24} fill={shade('#c9cfe0', 0.25)} stroke={line('#c9cfe0')} strokeWidth={7} />
        </g>
        {/* the screen's present levels, floating as a glass card toward the viewer */}
        <g transform={`translate(${lerp(200, 160, after(f, 1))} 420)`}>
          <rect x={0} y={0} width={420} height={250} rx={28} fill="#eef3ff" opacity={0.92} stroke="#3b6fd1" strokeWidth={5} />
          <text x={24} y={50} fontFamily={FONT.body} fontWeight={900} fontSize={30} fill="#3b6fd1">PRESENT LEVELS</text>
          <Lines x={24} y={80} w={370} n={4} gap={38} thick={14} c="#8d95bf" p={after(f, 1.6)} />
        </g>
        <Highlighter x={900} y={1180} s={0.55} frame={frame} mood="happy" />
      </g>);
    }
    case 'flag-shoulder': {
      // s7 close over the teacher's shoulder: the highlighter taps a sinking math bar and a yellow ring blooms
      const fl = since('s7-flag');
      const tap = fl > 0 ? Math.max(0, Math.sin(Math.min(fl, 0.6) * Math.PI / 0.6)) : 0;
      const ring = after(fl - 0.3, 0.5);
      const bars = [{l: 'READING', v: 0.8, c: '#4f8cff'}, {l: 'SCIENCE', v: 0.7, c: '#36b37e'}, {l: 'MATH', v: lerp(0.65, 0.3, after(fl, 0.6)), c: '#ff6b6b'}];
      return svg(<g>
        <ClassRoom frame={frame} win={null} floorY={1700} />
        <LitBox x={120} y={460} w={840} h={760} r={40} c="#2c3150" />
        <rect x={160} y={500} width={760} height={680} rx={24} fill="#eef3ff" />
        <text x={190} y={570} fontFamily={FONT.body} fontWeight={900} fontSize={40} fill="#3b6fd1">SUBJECTS</text>
        {bars.map((q, i) => <g key={i}>
          <rect x={220 + i * 230} y={1100 - 440 * q.v} width={150} height={440 * q.v} rx={22} fill={q.c} stroke={line(q.c)} strokeWidth={5} />
          <text x={295 + i * 230} y={1150} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={30} fill="#3a3350">{q.l}</text>
        </g>)}
        {ring > 0 && <circle cx={755} cy={1100 - 440 * bars[2].v - 10} r={60 + 50 * ring} fill="none" stroke="#ffcf2e" strokeWidth={14} opacity={1 - 0.4 * ring} />}
        <Highlighter x={lerp(900, 860, tap)} y={lerp(1000, 940, tap)} s={0.75} frame={frame} mood="curious" lean={lerp(-20, -50, tap)} cap={1} />
        {person(TEACH, 170, 1950, 1.5, {pose: 'think'}, fl > 0.2 ? 'worried' : 'thinking', 0.6, 4)}
      </g>);
    }
    case 'stamp-low': {
      // s9 close, low angle: the teacher lifts the green stamp in both hands and thumps it down on the page
      const dr = since('s9-drive');
      const slam = after(dr - 0.45, 0.16);
      const hit = slam >= 1 && dr < 0.85;
      const stamp = (
        <g transform="translate(0 40)">
          <rect x={-34} y={-150} width={68} height={120} rx={28} fill="#7a4a2a" stroke={line('#7a4a2a')} strokeWidth={6} />
          <rect x={-90} y={-40} width={180} height={78} rx={18} fill="#2bb673" stroke={line('#2bb673')} strokeWidth={6} />
          <rect x={-74} y={-30} width={80} height={10} rx={5} fill="#a8f0c8" opacity={0.7} />
        </g>
      );
      return svg(<g>
        <ClassRoom frame={frame} win={WIN.medium} floorY={1650} />
        {windowSky(WIN.medium, 0.18)}
        <path d="M-60 1180 L1140 1120 V1980 H-60 Z" fill="#b9814f" />
        <path d="M-60 1180 L1140 1120" stroke={light('#b9814f', 0.4)} strokeWidth={14} />
        <g transform="translate(540 1110) scale(1.2 0.5) rotate(-4)"><IEPPage x={0} y={0} frame={frame} boxes={['filled', 'filled', 'pen', 'pen', 'filled', 'filled']} /></g>
        {slam >= 1 && <g transform="translate(560 1060) scale(1.3 0.6) rotate(-6)"><rect x={-170} y={-50} width={340} height={100} rx={20} fill="none" stroke="#2bb673" strokeWidth={12} />
          <text x={0} y={24} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={64} fill="#2bb673">TEACHER</text></g>}
        {person(TEACH, 540, lerp(1230, 1330, slam) + (hit ? 14 : 0), 1.85, dr < 0.45 ? move(dr, 0.05, 'stand', 'raise') : {pose: 'hold', fromPose: 'raise', poseBlend: slam},
          slam >= 1 ? 'proud' : 'determined', 0, 4, {holding: stamp})}
        <Burst x={560} y={1060} p={(dr - 0.6) / 0.6} color="#7dffb0" />
        <Highlighter x={900} y={1300} s={0.7} frame={frame} mood={slam >= 1 ? 'proud' : 'curious'} look={-1} squash={hit ? 0.4 : 0} />
      </g>);
    }
    case 'arms-up': {
      // s10 close: the teacher throws both arms up in front of the still-gold window as 45 MIN lands
      const nw = since('s10-new');
      return svg(<g>
        <ClassRoom frame={frame} win={WIN.medium} floorY={1700} />
        {windowSky(WIN.medium, 0.25)}
        <Glow x={540} y={700} r={700} color="#ffc46b" opacity={0.45} />
        {person(TEACH, 540, 2100, 2.5, move(nw, 0.1, 'think', 'cheer'), 'excited', 0, 4)}
        <Highlighter x={880} y={1700} s={0.7} frame={frame} mood={nw > 1 ? 'proud' : 'happy'} squash={nw > 1 && nw < 1.3 ? 0.6 : 0} />
        <g opacity={after(nw - 0.6, 0.3)}><LitBox x={540} y={640} w={500} h={120} r={56} c="#1f8a4c" /><Word x={790} y={722} t="ABOUT 45 MIN" size={64} c="#ffffff" /></g>
        <Burst x={540} y={540} p={(nw - 0.7) / 0.6} color="#ffe14d" />
      </g>);
    }
    case 'gold-exit': {
      // s14 wide: the folder snaps shut big in the foreground with its yellow note and green check; behind it, under the
      // still-gold window, she clicks off the lamp and strides for the door
      const cl = since('s14-close');
      const walk = after(cl - 0.3, 3.0);
      return svg(<g>
        <ClassRoom frame={frame} win={WIN.wide} floorY={1150} dusk={0} />
        {windowSky(WIN.wide, 0.1)}
        <g transform="translate(0 -230)">
          <rect x={900} y={980} width={170} height={400} rx={18} fill="#7a5a3a" stroke={line('#7a5a3a')} strokeWidth={6} />
          <circle cx={925} cy={1190} r={10} fill="#ffd36b" />
        </g>
        {person(TEACH, lerp(680, 960, walk), 1480, 1.25, {pose: 'hold'}, 'happy', -0.8, 4, {walk: walk > 0 && walk < 1 ? t : undefined})}
        <Glow x={540} y={700} r={600} color="#ffc46b" opacity={0.3} />
        <g transform={`translate(300 900) scale(${0.85 + 0.06 * Math.sin(Math.min(1, after(cl, 0.3)) * Math.PI)})`}>
          <Folder x={0} y={0} frame={frame} stack={0} sticky={1} ribbon={after(cl - 0.2, 0.6) + (cl > 0.8 ? 0.01 : 0)} label="STUDENT" open={1 - after(cl, 0.3)} />
        </g>
        <Highlighter x={560} y={1090} s={0.5} frame={frame} mood="proud" squash={cl > 0.8 && cl < 1.1 ? 0.5 : 0} />
        <Burst x={300} y={940} p={(cl - 0.8) / 0.6} color="#7dffb0" />
      </g>);
    }
    case 'kid-plan': {
      // s2 medium: the teacher points at the plan; a dashed line runs from the student at a desk up to it; the student waves
      const k = since('s2-kid');
      const line2 = after(k, 0.9);
      return svg(<g>
        <ClassRoom frame={frame} win={WIN.medium} floorY={1220} />
        {windowSky(WIN.medium, 0.03)}
        <g transform="translate(560 700) scale(0.62) rotate(3)"><IEPPage x={0} y={0} frame={frame} p={pop(k + 0.6, 0.5)} boxes={['empty', 'empty', 'empty', 'empty', 'empty', 'empty']} title="STUDENT PLAN" /></g>
        <path d="M820 1180 Q860 1000 700 900" stroke="#3b6fd1" strokeWidth={12} strokeDasharray="26 18" fill="none" strokeLinecap="round" opacity={line2} />
        <g transform="translate(0 -120)">
          <rect x={660} y={1300} width={380} height={40} rx={16} fill="#f6c27a" stroke={line('#f6c27a')} strokeWidth={6} />
          <rect x={690} y={1340} width={22} height={170} rx={8} fill="#9aa3bb" /><rect x={990} y={1340} width={22} height={170} rx={8} fill="#9aa3bb" />
          {person(KID, 850, 1530, 1.0, move(k, 0.2, 'think', 'wave'), k > 0.2 ? 'excited' : 'thinking', -0.5, 9)}
          <g transform="translate(760 1290) rotate(-6)"><rect x={-70} y={-20} width={140} height={26} rx={8} fill="#fffaf0" stroke={line('#fffaf0')} strokeWidth={3} /></g>
        </g>
        {person(TEACH, 230, 1560, 1.55, {pose: 'point'}, 'happy', 0.5, 4)}
        <Burst x={560} y={700} p={(k - 0.6) / 0.6} color="#7fc8ff" />
      </g>);
    }
    case 'stopwatch-race': {
      // s13 close: two stopwatches race; the AI plan's stops well short; the teacher, reviewing, gives a thumbs up beside it
      const tm = since('s13-time');
      const pa = 0.25 * after(tm, 0.7), pt = 0.92 * after(tm, 1.6);
      return svg(<g>
        <ClassRoom frame={frame} win={null} floorY={1500} cork={false} wall="#cdb8f0" />
        <Stopwatch x={290} y={660} s={1.45} p={pa} c="#7a5af8" />
        <Stopwatch x={790} y={660} s={1.45} p={pt} c="#ef4444" />
        <Word x={290} y={930} t="AI DRAFT" size={48} c="#3a3350" />
        <Word x={790} y={930} t="TEACHER ONLY" size={48} c="#3a3350" />
        {tm > 0.7 && <Burst x={290} y={660} p={(tm - 0.7) / 0.6} color="#b9a4ff" />}
        {person(TEACH, 540, 1720, 1.4, move(tm, 0.8, 'think', 'cheer'), tm > 0.8 ? 'happy' : 'thinking', 0, 4)}
      </g>);
    }
    case 'campus-bus': {
      // s3 wide, outdoors in the blackland: the bus pulls away from the marquee as the bell rings; a teacher waves
      const b = since('s3-bus');
      const go = ease(clamp01(b / 3.2));
      const ring = b > 0 && b < 1.2 ? Math.sin(frame * 2.2) * 8 : 0;
      return svg(<g>
        <path d="M-60 1460 H1140 V1980 H-60 Z" fill="#8a8a96" opacity={0.6} />
        <path d="M-60 1600 H1140" stroke="#f7d36a" strokeWidth={10} strokeDasharray="60 40" />
        <SchoolMarqueeV2 x={760} y={1330} scale={0.55} frame={frame} school={['#c8102e', '#1d3b8a']} />
        <g transform={`translate(840 ${880}) rotate(${ring})`}>
          <path d="M0 -60 V0" stroke="#5a5e70" strokeWidth={8} />
          <path d="M-50 40 Q-50 -40 0 -40 Q50 -40 50 40 Z" fill="#d9a63a" stroke={line('#d9a63a')} strokeWidth={6} />
          <circle cx={0} cy={48} r={12} fill="#8a6a2a" />
          {b > 0 && b < 1.4 && [0, 1].map((k) => <path key={k} d={`M${70 + k * 30} ${-10} q20 30 0 60`} stroke="#ffe066" strokeWidth={8} fill="none" strokeLinecap="round" />)}
        </g>
        <SchoolBusV2 x={lerp(380, -500, go)} y={1640} scale={0.62} frame={frame} speed={go > 0 ? 0.8 : 0} mood="happy" facing={-1} />
        {person(TEACH, 930, 1780, 1.2, {pose: 'wave'}, 'happy', -0.5, 4)}
      </g>);
    }
    case 'campus-map': {
      // s3 overhead (wall view): fifty two pins rain down across the district, each sprouting a little stack
      const p = since('s3-pins');
      const pins = Array.from({length: 52}, (_, i) => {
        const a = (i * 137.5 * Math.PI) / 180, r = 60 + Math.sqrt(i) * 52;
        return {x: 540 + Math.cos(a) * r * 1.05, y: 1000 + Math.sin(a) * r * 1.25, d: i * 0.025};
      });
      return svg(<g>
        <path d="M200 520 Q540 400 880 540 Q980 900 880 1420 Q540 1560 200 1440 Q80 980 200 520 Z" fill="#cfe6a6" stroke={line('#cfe6a6')} strokeWidth={8} />
        <path d="M150 700 Q540 760 930 680" stroke="#ffffff" strokeWidth={22} fill="none" opacity={0.8} />
        <path d="M600 420 Q560 1000 640 1580" stroke="#ffffff" strokeWidth={22} fill="none" opacity={0.8} />
        {pins.map((q, i) => {
          const g = pop(p - q.d, 0.4, 1.8);
          if (g <= 0) return null;
          return <g key={i} transform={`translate(${q.x} ${lerp(q.y - 300, q.y, Math.min(1, g))})`}>
            <ellipse cx={0} cy={4} rx={14} ry={5} fill="#1b1430" opacity={0.25} />
            <path d="M0 0 C-16 -22 -18 -40 0 -44 C18 -40 16 -22 0 0Z" fill="#ff5d5d" stroke="#7a1430" strokeWidth={3} />
            <circle cx={0} cy={-30} r={6} fill="#fff4dc" />
            {g >= 1 && <rect x={10} y={-26} width={22} height={18} rx={4} fill="#f2c46d" stroke={line('#f2c46d')} strokeWidth={2} />}
          </g>;
        })}
        <Word x={540} y={1700} t="52 CAMPUSES" size={66} c="#3b6fd1" op={clamp01(p * 4)} />
      </g>);
    }
    case 'pencil-cup': {
      // s4 close: the highlighter pops out of the pencil cup, blinks and stretches; the teacher leans back, surprised
      const s = since('s4-pop');
      const up = pop(s - 0.15, 0.5, 2.2);
      const wind = s > 0 && s < 0.15 ? 1 : 0;
      return svg(<g>
        <ClassRoom frame={frame} win={WIN.medium} floorY={1500} />
        {windowSky(WIN.medium, 0.05)}
        <rect x={-60} y={1300} width={1200} height={700} fill="#b9814f" />
        <rect x={-60} y={1300} width={1200} height={20} fill={light('#b9814f', 0.4)} />
        <Highlighter x={560} y={lerp(1300, 1080, up)} s={1.25} frame={frame} mood={s < 0.4 ? 'sleep' : s < 0.9 ? 'curious' : 'happy'} squash={wind ? 0.5 : 0}
          lean={Math.sin(s * 9) * 8 * Math.exp(-Math.max(0, s) * 2)} shadow={false} />
        <PencilCup x={560} y={1420} s={1.6} frame={frame} jiggle={s > 0 && s < 0.6 ? 1 : 0} />
        {person(TEACH, 200, 1900, 2.1, move(s, 0.35, 'hold', 'raise'), s > 0.35 ? 'surprised' : 'neutral', 0.6, 4)}
        <Burst x={560} y={760} p={(s - 0.3) / 0.6} color="#fff27a" />
      </g>);
    }
    case 'laptop-wake': {
      if (shot.scene_id === 's4') {
        // s4 medium: the laptop flips open and wakes; the highlighter hops on top of the lid
        const l = since('s4-lap');
        const open = after(l, 0.5);
        const hop = after(l - 0.3, 0.6);
        return svg(<g>
          <ClassRoom frame={frame} win={WIN.medium} floorY={1220} />
          {windowSky(WIN.medium, 0.05)}
          <g transform="translate(0 -230)">
          <Desk x={540} y={1430} w={880} />
          <Laptop x={560} y={1400} s={1.05} frame={frame} open={0.05 + 0.95 * open} mood={open > 0.9 ? 'calm' : 'sleep'} screen={open > 0.6 ? '#eef3ff' : '#2a2a3e'}>
            {open > 0.6 && <g><rect x={0} y={0} width={520} height={60} fill="#3b6fd1" /><Lines x={40} y={100} w={440} n={5} gap={40} c="#b9c2e6" p={after(l - 0.5, 0.8)} /></g>}
          </Laptop>
          <Highlighter x={lerp(240, 560, hop)} y={lerp(1380, 990, hop) - Math.sin(hop * Math.PI) * 180} s={0.5} frame={frame} mood="happy"
            squash={hop >= 1 && l < 1.3 ? 0.5 : 0} />
          {person(TEACH, 900, 1820, 1.7, {pose: 'hips'}, open > 0.5 ? 'happy' : 'surprised', -0.6, 4)}
          <Glow x={560} y={1150} r={360} color="#bcd4ff" opacity={0.5 * open} />
        </g></g>);
      }
      // s7 medium: the highlighter taps the attendance dip and a yellow ring blooms; the teacher leans in, concerned
      const fl = since('s7-flag');
      const tap = fl > 0 ? Math.max(0, Math.sin(Math.min(fl, 0.6) * Math.PI / 0.6)) : 0;
      return svg(<g>
        <ClassRoom frame={frame} win={WIN.medium} floorY={1220} />
        {windowSky(WIN.medium, 0.1)}
          <g transform="translate(0 -230)">
        <Desk x={540} y={1430} w={880} />
        <Laptop x={540} y={1400} s={1.05} frame={frame} mood="busy">
          <rect x={0} y={0} width={520} height={56} fill="#ff8a3d" />
          <text x={20} y={40} fontFamily={FONT.body} fontWeight={900} fontSize={30} fill="#ffffff">ATTENDANCE</text>
          <path d="M30 140 L120 130 L210 150 L300 140 L380 250 L480 270" stroke="#3b6fd1" strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          {fl > 0.3 && <circle cx={420} cy={258} r={34 + 30 * after(fl - 0.3, 0.5)} fill="none" stroke="#ffcf2e" strokeWidth={10} opacity={1 - 0.5 * after(fl - 0.8, 0.6)} />}
        </Laptop>
        <Highlighter x={lerp(840, 800, tap)} y={lerp(1380, 1280, tap)} s={0.55} frame={frame} mood="curious" lean={lerp(-10, -38, tap)} cap={1}
          glow={fl > 0.3 ? 1 : 0} to={{x: 700, y: 1180}} />
        {person(TEACH, 200, 1820, 1.75, move(fl, 0.2, 'stand', 'think'), fl > 0.2 ? 'worried' : 'thinking', 0.6, 4)}
      </g></g>);
    }
    case 'data-pipes': {
      // s5 wide: three app tiles slam onto the desk and pipes snake from them toward the folder
      const tl = since('s5-tiles');
      const tiles = [{c: '#4f8cff', g: 'book' as const, l: 'ACADEMIC'}, {c: '#ff8a3d', g: 'cal' as const, l: 'ATTENDANCE'}, {c: '#b46bff', g: 'heart' as const, l: 'BEHAVIOR'}];
      return svg(<g>
        <ClassRoom frame={frame} win={WIN.wide} floorY={1150} />
        {windowSky(WIN.wide, 0.08)}
          <g transform="translate(0 -230)">
        <Desk x={600} y={1360} w={860} />
        <g transform="translate(860 1300) scale(0.5)"><Folder x={0} y={0} frame={frame} stack={0.3} label="STUDENT" open={0.6} /></g>
        {tiles.map((q, k) => {
          const p = pop(tl - k * 0.25, 0.45, 2);
          const tx = 250 + k * 190, ty = 1240;
          const draw = after(tl - 0.6 - k * 0.2, 0.8);
          return <g key={k}>
            <path d={`M${tx} ${ty - 40} C${tx} ${ty - 260} 860 ${ty - 260} 860 ${ty - 60}`} stroke={q.c} strokeWidth={18} fill="none" strokeLinecap="round"
              strokeDasharray={900} strokeDashoffset={900 * (1 - draw)} opacity={0.9} />
            <g transform={`translate(${tx} ${lerp(ty - 400, ty, Math.min(1, p))})`}><AppTile x={0} y={0} s={0.6} c={q.c} glyph={q.g} label={q.l} p={p} /></g>
          </g>;
        })}
        {person(TEACH, 150, 1720, 1.55, move(tl, 0.5, 'stand', 'point'), tl > 0.5 ? 'surprised' : 'neutral', 0.6, 4)}
      </g></g>);
    }
    case 'trend-screen': {
      // s7 close: the attendance line draws on the screen and dips sharply; the highlighter raises a brow
      const d = since('s7-dip');
      const draw = after(d, 1.4);
      const pts = [[60, 300], [180, 280], [300, 310], [420, 290], [540, 300], [640, 520], [760, 560]];
      const dpath = pts.map((q, i) => `${i ? 'L' : 'M'}${q[0] + 120} ${q[1] + 640}`).join(' ');
      return svg(<g>
        <ClassRoom frame={frame} win={null} floorY={1600} />
        <LitBox x={120} y={520} w={840} h={620} r={40} c="#2c3150" />
        <rect x={160} y={560} width={760} height={540} rx={24} fill="#eef3ff" />
        <text x={190} y={620} fontFamily={FONT.body} fontWeight={900} fontSize={40} fill="#ff8a3d">ATTENDANCE</text>
        {[0, 1, 2, 3].map((i) => <path key={i} d={`M190 ${700 + i * 100} H890`} stroke="#d0d6f0" strokeWidth={3} />)}
        <path d={dpath} stroke="#3b6fd1" strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1200}
          strokeDashoffset={1200 * (1 - draw)} />
        {draw > 0.85 && <path d="M820 1110 l40 70 l-80 0 Z" fill="#ff5d5d" transform={`translate(0 ${Math.sin(frame / 5) * 6})`} />}
        <Highlighter x={850} y={1580} s={0.95} frame={frame} mood={draw > 0.8 ? 'curious' : 'happy'} look={-1} lean={-6} />
        {person(TEACH, 230, 1940, 2.0, {pose: 'think'}, draw > 0.8 ? 'worried' : 'thinking', 0.5, 4)}
      </g>);
    }
    case 'blank-glow': {
      // s8 close: the highlighter swings its glow across the page and two empty boxes light up yellow with a question mark
      const b = since('s8-beam');
      const sweep = after(b, 1.2);
      const boxes: BoxState[] = ['filled', 'filled', 'filled', sweep > 0.5 ? 'flag' : 'empty', sweep > 0.85 ? 'flag' : 'empty', 'filled'];
      const tgt = {x: lerp(360, 760, sweep), y: lerp(1060, 1240, sweep)};
      return svg(<g>
        <ClassRoom frame={frame} win={WIN.medium} floorY={1600} />
        {windowSky(WIN.medium, 0.15)}
        <IEPPage x={540} y={1040} s={1.15} frame={frame} boxes={boxes} labels={LABELS} rot={-2} />
        <Highlighter x={860} y={1700} s={1.0} frame={frame} mood={sweep > 0.5 ? 'proud' : 'curious'} cap={1} lean={-18 + 24 * sweep} glow={b > 0 ? 1 : 0} to={tgt} />
        {person(TEACH, 190, 1960, 1.9, {pose: 'think'}, sweep > 0.6 ? 'surprised' : 'thinking', 0.5, 4)}
      </g>);
    }
    case 'teacher-writes': {
      if (shot.scene_id === 's8') {
        // s8 close, top-down on the desk: she taps her forehead (a sheepish stamp of the hand), then her pen writes into the glowing box
        const pn = since('s8-pen');
        const write = after(pn - 0.2, 1.1);
        const px = 520 + write * 130, py = 1000 + Math.sin(write * 30) * 8;
        return svg(<g>
          <rect x={-60} y={-60} width={1200} height={2100} fill="#b9814f" />
          {Array.from({length: 9}, (_, k) => <path key={k} d={`M-60 ${160 + k * 220} H1140`} stroke={shade('#b9814f', 0.15)} strokeWidth={4} opacity={0.5} />)}
          <IEPPage x={540} y={810} s={1.1} frame={frame} boxes={['filled', 'filled', 'filled', write > 0.5 ? 'pen' : 'flag', 'flag', 'filled']} labels={LABELS} rot={-4} />
          <Highlighter x={930} y={1040} s={0.62} frame={frame} mood="proud" cap={1} lean={-12} />
          <g>
            <path d={`M${px + 260} 2000 Q${px + 160} ${py + 380} ${px + 60} ${py + 90}`} stroke={line('#ef4444')} strokeWidth={128} fill="none" strokeLinecap="round" />
            <path d={`M${px + 260} 2000 Q${px + 160} ${py + 380} ${px + 60} ${py + 90}`} stroke="#ef4444" strokeWidth={112} fill="none" strokeLinecap="round" />
            <circle cx={px + 50} cy={py + 70} r={58} fill={TEACH.skin as string} stroke={line(TEACH.skin as string)} strokeWidth={6} />
            <path d={`M${px} ${py} L${px + 70} ${py + 110}`} stroke="#1d4ed8" strokeWidth={22} strokeLinecap="round" />
            <path d={`M${px} ${py} L${px + 70} ${py + 110}`} stroke={light('#1d4ed8', 0.4)} strokeWidth={8} strokeLinecap="round" />
          </g>
          <Burst x={px} y={py} p={(pn - 0.3) / 0.5} color="#fff27a" />
        </g>);
      }
      // s9 medium: the teacher lifts the stamp and thumps it down on the page; proud
      const dr = since('s9-drive');
      const lift = after(dr, 0.4), slam = after(dr - 0.5, 0.15);
      const sy = 1150 - 180 * lift + 200 * slam;
      return svg(<g>
        <ClassRoom frame={frame} win={WIN.medium} floorY={1220} />
        {windowSky(WIN.medium, 0.18)}
          <g transform="translate(0 -230)">
        <Desk x={540} y={1430} w={880} />
        <g transform="translate(560 1330) scale(0.62) rotate(-3)"><IEPPage x={0} y={0} frame={frame} boxes={['filled', 'filled', 'pen', 'pen', 'filled', 'filled']} /></g>
        {slam >= 1 && <g transform="translate(600 1350) rotate(-10)"><rect x={-150} y={-40} width={300} height={80} rx={18} fill="none" stroke="#2bb673" strokeWidth={10} />
          <text x={0} y={18} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={50} fill="#2bb673">TEACHER</text></g>}
        <g transform={`translate(600 ${sy})`}>
          <rect x={-40} y={-140} width={80} height={110} rx={30} fill="#7a4a2a" stroke={line('#7a4a2a')} strokeWidth={6} />
          <rect x={-90} y={-40} width={180} height={50} rx={14} fill="#2bb673" stroke={line('#2bb673')} strokeWidth={6} />
        </g>
        {person(TEACH, 300, 1800, 1.85, move(dr, 0.1, 'reach', 'raise'), dr > 0.5 ? 'proud' : 'determined', 0.5, 4)}
        <Highlighter x={900} y={1400} s={0.45} frame={frame} mood="proud" />
        <Burst x={600} y={1340} p={(dr - 0.65) / 0.6} color="#7dffb0" />
      </g></g>);
    }
    case 'stamp-slide': {
      // s9 close: the ELIGIBILITY stamp slides toward the highlighter, which backs away and nudges it across the desk
      const cd = since('s9-cards'), ps = since('s9-push');
      const come = after(ps, 0.5);
      const cardsIn = after(cd, 0.8), cardsOut = after(cd - 1.2, 0.6);
      const push = after(ps - 0.6, 0.6);
      const sx = lerp(-100, 420, come) + lerp(0, 160, push);
      return svg(<g>
        <ClassRoom frame={frame} win={null} floorY={1500} />
        <rect x={-60} y={930} width={1200} height={1100} fill="#b9814f" />
        <rect x={-60} y={930} width={1200} height={20} fill={light('#b9814f', 0.4)} />
        <g transform={`translate(${sx} 1010)`}>
          <ContactShadow x={0} y={60} w={240} opacity={0.4} />
          <rect x={-50} y={-180} width={100} height={150} rx={36} fill="#7a4a2a" stroke={line('#7a4a2a')} strokeWidth={6} />
          <rect x={-120} y={-40} width={240} height={90} rx={20} fill="#c84a4a" stroke={line('#c84a4a')} strokeWidth={6} />
          <text x={0} y={20} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={30} fill="#ffffff">ELIGIBILITY</text>
        </g>
        <Highlighter x={lerp(760, 860, come) - 40 * push} y={1000} s={1.0} frame={frame} mood={push > 0 ? 'happy' : come > 0.5 ? 'alarm' : cd > 0.3 ? 'wary' : 'curious'}
          lean={come > 0.5 && push === 0 ? 14 : cd > 0.3 && cd < 1.4 ? Math.sin(cd * 14) * 10 : -20 * push} look={-1} />
        {/* the teacher's hand reaching in from the right */}
        <g transform={`translate(${lerp(1180, 900, push)} 970)`}>
          <path d="M0 0 H-140" stroke="#ef4444" strokeWidth={70} strokeLinecap="round" />
          <circle cx={-160} cy={0} r={42} fill={TEACH.skin as string} stroke={line(TEACH.skin as string)} strokeWidth={5} />
        </g>
        {cd > 0 && cardsOut < 1 && ['TUTORING', 'SPEECH', 'AIDE'].map((w, i) => (
          <g key={w} transform={`translate(${lerp(-200, 300 + i * 40, cardsIn) + 900 * cardsOut} ${700 + i * 40}) rotate(${(i - 1) * 12})`}>
            <rect x={-140} y={-80} width={280} height={160} rx={24} fill={['#4f8cff', '#36b37e', '#b46bff'][i]} stroke={line('#4f8cff')} strokeWidth={6} />
            <text x={0} y={14} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={40} fill="#ffffff">{w}</text>
          </g>))}
        <g opacity={after(ps, 0.3)}><LitBox x={230} y={470} w={620} h={120} r={56} c="#c84a4a" /><Word x={540} y={552} t="NOT ITS CALL" size={64} c="#ffffff" /></g>
      </g>);
    }
    case 'two-windows': {
      // s10 split: the classroom window as two panes behind a big teacher. Left pane, before: the sun rides all the way down
      // into night, UP TO 3 HR. Right pane, with the tool: it moves a quarter and stops, still gold, ABOUT 45 MIN. She cheers.
      const o = since('s10-old'), nw = since('s10-new');
      const kl = after(o, 2.0), kr = 0.25 * after(o - 2.2, 1.0);
      const L = {x: 40, y: 420, w: 480, h: 540}, R = {x: 560, y: 420, w: 480, h: 540};
      const pane = (w: typeof L, k: number, hrs: string, col: string, show: number) => {
        const arc = (q: number) => ({x: w.x + 70 + q * (w.w - 140), y: w.y + 90 + Math.pow(q, 1.5) * 250});
        const sun = arc(k);
        const n = Math.max(2, Math.round(k * 30));
        const done = Array.from({length: n + 1}, (_, q) => arc((q / n) * k));
        const night = clamp01((k - 0.5) / 0.4);
        return <g>
          <rect x={w.x} y={w.y} width={w.w} height={w.h} rx={40} fill="#ffc96a" />
          <rect x={w.x} y={w.y} width={w.w} height={w.h} rx={40} fill="#1c1a5c" opacity={night} />
          <rect x={w.x + 10} y={w.y + w.h * 0.6} width={w.w - 20} height={w.h * 0.4 - 10} rx={30} fill={night > 0.5 ? '#203a2e' : '#9cc65a'} />
          {done.length > 1 && <path d={done.map((q, m) => `${m ? 'L' : 'M'}${q.x} ${q.y}`).join(' ')} stroke={col} strokeWidth={14} fill="none" strokeLinecap="round" />}
          <circle cx={sun.x} cy={sun.y} r={46} fill={night > 0.5 ? '#ff8a4a' : '#fff1a8'} stroke={line('#fff1a8')} strokeWidth={5} />
          {night > 0.6 && [0, 1, 2].map((m) => <circle key={m} cx={w.x + 110 + m * 130} cy={w.y + 70 + (m % 2) * 40} r={6} fill="#ffffff" />)}
          <rect x={w.x} y={w.y} width={w.w} height={w.h} rx={40} fill="none" stroke="#f6efe2" strokeWidth={20} />
          <g opacity={show} transform={`translate(${w.x + w.w / 2} ${w.y + w.h - 70}) scale(${0.8 + 0.2 * show})`}>
            <rect x={-200} y={-46} width={400} height={92} rx={46} fill={col} stroke={line(col)} strokeWidth={6} />
            <Word x={0} y={20} t={hrs} size={50} c="#ffffff" />
          </g>
        </g>;
      };
      return svg(<g>
        <ClassRoom frame={frame} win={null} floorY={1500} cork={false} />
        {pane(L, kl, 'UP TO 3 HR', '#c8102e', after(o - 1.4, 0.3))}
        {pane(R, kr, 'ABOUT 45 MIN', '#1f8a4c', after(o - 3.0, 0.3))}
        <LitBox x={150} y={445} w={240} h={60} r={28} c="#c8102e" /><Word x={270} y={489} t="BEFORE" size={34} c="#ffffff" />
        <LitBox x={640} y={445} w={320} h={60} r={28} c="#1f8a4c" /><Word x={800} y={489} t="WITH THE TOOL" size={34} c="#ffffff" />
        {person(TEACH, 540, 1995, 1.05, o > 3.0 ? move(o, 3.0, 'think', 'cheer') : {pose: 'think'}, o > 3.0 ? 'excited' : o > 0.8 ? 'worried' : 'thinking', 0, 4)}
        <Burst x={700} y={540} p={(o - 3.2) / 0.6} color="#ffe14d" />
      </g>);
    }
    case 'locker-copies': {
      // s11 wide: copies of the page fly out of the laptop into a row of lockers, one drawer each; the teacher frowns
      const c = since('s11-copy');
      return svg(<g>
        <ClassRoom frame={frame} win={null} floorY={1420} cork={false} wall="#9fb7e8" />
        {Array.from({length: 6}, (_, i) => {
          const x = 90 + i * 160;
          const open = after(c - 0.3 - i * 0.18, 0.3);
          return <g key={i}>
            <LitBox x={x} y={560} w={140} h={840} r={22} c={['#4f8cff', '#5a7be0'][i % 2]} />
            {[0, 1, 2].map((v) => <path key={v} d={`M${x + 30} ${620 + v * 24} H${x + 100}`} stroke={shade('#4f8cff', 0.4)} strokeWidth={6} strokeLinecap="round" />)}
            <g transform={`translate(${x + 70} 1000) scale(0.32)`}><Vault x={0} y={0} frame={frame} copies={1} crack={0} /></g>
            {open > 0 && <rect x={x + 10} y={760} width={120 * open} height={60} rx={10} fill="#fffaf0" opacity={0.9} />}
          </g>;
        })}
        {Array.from({length: 6}, (_, i) => {
          const p = after(c - i * 0.18, 0.6);
          if (p <= 0 || p >= 1) return null;
          return <Sheet key={i} x={lerp(540, 160 + i * 160, p)} y={lerp(1500, 790, p) - Math.sin(p * Math.PI) * 220} s={0.5} rot={p * 360} />;
        })}
        <Laptop x={540} y={1560} s={0.7} frame={frame} mood="shy" />
        {since('s11-quote') > 0 && <g transform={`translate(540 ${lerp(300, 520, pop(since('s11-quote'), 0.4, 1.8))}) rotate(-2)`}>
          <rect x={-500} y={-90} width={1000} height={180} rx={34} fill="#fffaf0" stroke="#3a3350" strokeWidth={7} />
          <text x={0} y={-8} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={38} fill="#3a3350">"THE MORE PLACES THAT INFORMATION SITS,</text>
          <text x={0} y={48} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={38} fill="#c8102e">THE MORE PLACES IT CAN BE BREACHED FROM"</text>
        </g>}
        {person(TEACH, 900, 1840, 1.45, {pose: 'crossed'}, c > 1 ? 'worried' : 'thinking', -0.5, 4)}
      </g>);
    }
    case 'shield-crack': {
      // s11 close: a row of shield locks wobbles and the last one cracks red
      const cr = since('s11-crack');
      return svg(<g>
        <rect x={-60} y={-60} width={1200} height={2100} fill="#2c3150" opacity={0.35} />
        <Vault x={540} y={1080} s={1.15} frame={frame} copies={4} crack={after(cr, 0.6)} />
        {cr > 0.4 && <Glow x={760} y={1060} r={300} color="#ff4a5a" opacity={0.35} />}
        <Word x={540} y={1500} t="MORE PLACES" size={76} c="#fff6e6" />
        <Word x={540} y={1600} t="MORE RISK" size={76} c="#ff8a8a" op={after(cr - 0.3, 0.3)} />
      </g>);
    }
    case 'mailbox': {
      // s12 medium, outdoors: a dashed ghost letter with an opt out box floats down toward a family's mailbox
      const g = since('s12-ghost');
      const fl = after(g, 1.4);
      return svg(<g>
        {/* a Mesquite suburban street: a brick ranch house, a live oak, a lawn and a curb */}
        <g transform="translate(0 0)">
          <path d="M-60 1180 H1140 V1980 H-60 Z" fill="#7cc35a" />
          <path d="M-60 1180 H1140" stroke={line('#7cc35a')} strokeWidth={5} />
          <rect x={-60} y={1820} width={1200} height={200} fill="#9a98a6" />
          <rect x={-60} y={1810} width={1200} height={22} rx={8} fill="#d8d6dc" />
          <g transform="translate(700 1180)">
            <ContactShadow x={0} y={10} w={700} opacity={0.3} />
            <rect x={-330} y={-250} width={660} height={250} rx={20} fill="#b85c3e" stroke={line('#b85c3e')} strokeWidth={7} />
            {Array.from({length: 6}, (_, i) => <path key={i} d={`M-330 ${-220 + i * 40} H330`} stroke={shade('#b85c3e', 0.25)} strokeWidth={3} opacity={0.5} />)}
            <path d="M-380 -240 L0 -400 L380 -240 Z" fill="#5a5470" stroke={line('#5a5470')} strokeWidth={8} strokeLinejoin="round" />
            <rect x={-250} y={-190} width={150} height={110} rx={14} fill="#ffe7a6" stroke="#f6efe2" strokeWidth={10} />
            <rect x={110} y={-190} width={150} height={110} rx={14} fill="#ffe7a6" stroke="#f6efe2" strokeWidth={10} />
            <rect x={-50} y={-170} width={100} height={170} rx={14} fill="#2f5aa8" stroke={line('#2f5aa8')} strokeWidth={6} />
          </g>
          <g transform="translate(140 1200)">
            <path d="M-14 0 Q-6 -160 -30 -260 M10 0 Q20 -140 60 -230" stroke="#6b4a32" strokeWidth={34} fill="none" strokeLinecap="round" />
            {[[-90, -300, 120], [40, -340, 140], [130, -270, 100], [-20, -230, 110]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={['#3f8a3a', '#4f9a44', '#367a34', '#5aa84c'][i]} />)}
          </g>
        </g>
        <g transform="translate(560 1640)">
          <ContactShadow x={0} y={6} w={200} />
          <rect x={-12} y={-360} width={24} height={360} rx={8} fill="#6b4a32" stroke={line('#6b4a32')} strokeWidth={5} />
          <path d="M-120 -360 V-470 Q-120 -540 0 -540 Q120 -540 120 -470 V-360 Z" fill="#3b6fd1" stroke={line('#3b6fd1')} strokeWidth={7} />
          <rect x={100} y={-500} width={18} height={90} rx={6} fill="#e23b3b" />
        </g>
        <g transform={`translate(${lerp(760, 600, fl)} ${lerp(500, 1000, fl) + Math.sin(frame / 8) * 10}) rotate(${Math.sin(frame / 10) * 8})`} opacity={0.9}>
          <rect x={-150} y={-100} width={300} height={200} rx={20} fill="#fffaf0" fillOpacity={0.5} stroke="#3b6fd1" strokeWidth={6} strokeDasharray="20 14" />
          <rect x={-110} y={10} width={44} height={44} rx={8} fill="none" stroke="#3b6fd1" strokeWidth={6} />
          <text x={-50} y={46} fontFamily={FONT.body} fontWeight={900} fontSize={34} fill="#3b6fd1">OPT OUT</text>
          <Lines x={-110} y={-70} w={220} n={2} gap={30} thick={10} c="#9ab3e6" />
        </g>
        {person(PARENT, 250, 1760, 1.6, {pose: 'stand'}, 'neutral', 0.5, 6)}
      </g>);
    }
    case 'mailbox-empty': {
      // s12 close: the parent opens the mailbox and finds it empty while the ghost letter fades; a puzzled shrug
      const e = since('s12-empty');
      const door = after(e, 0.4);
      return svg(<g>
        {/* a Mesquite suburban street: a brick ranch house, a live oak, a lawn and a curb */}
        <g transform="translate(0 0)">
          <path d="M-60 1180 H1140 V1980 H-60 Z" fill="#7cc35a" />
          <path d="M-60 1180 H1140" stroke={line('#7cc35a')} strokeWidth={5} />
          <rect x={-60} y={1820} width={1200} height={200} fill="#9a98a6" />
          <rect x={-60} y={1810} width={1200} height={22} rx={8} fill="#d8d6dc" />
          <g transform="translate(700 1180)">
            <ContactShadow x={0} y={10} w={700} opacity={0.3} />
            <rect x={-330} y={-250} width={660} height={250} rx={20} fill="#b85c3e" stroke={line('#b85c3e')} strokeWidth={7} />
            {Array.from({length: 6}, (_, i) => <path key={i} d={`M-330 ${-220 + i * 40} H330`} stroke={shade('#b85c3e', 0.25)} strokeWidth={3} opacity={0.5} />)}
            <path d="M-380 -240 L0 -400 L380 -240 Z" fill="#5a5470" stroke={line('#5a5470')} strokeWidth={8} strokeLinejoin="round" />
            <rect x={-250} y={-190} width={150} height={110} rx={14} fill="#ffe7a6" stroke="#f6efe2" strokeWidth={10} />
            <rect x={110} y={-190} width={150} height={110} rx={14} fill="#ffe7a6" stroke="#f6efe2" strokeWidth={10} />
            <rect x={-50} y={-170} width={100} height={170} rx={14} fill="#2f5aa8" stroke={line('#2f5aa8')} strokeWidth={6} />
          </g>
          <g transform="translate(140 1200)">
            <path d="M-14 0 Q-6 -160 -30 -260 M10 0 Q20 -140 60 -230" stroke="#6b4a32" strokeWidth={34} fill="none" strokeLinecap="round" />
            {[[-90, -300, 120], [40, -340, 140], [130, -270, 100], [-20, -230, 110]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={['#3f8a3a', '#4f9a44', '#367a34', '#5aa84c'][i]} />)}
          </g>
        </g>
        <g transform="translate(640 1500)">
          <ContactShadow x={0} y={420} w={260} />
          <rect x={-18} y={0} width={36} height={420} rx={10} fill="#6b4a32" stroke={line('#6b4a32')} strokeWidth={6} />
          <path d="M-200 0 V-180 Q-200 -300 0 -300 Q200 -300 200 -180 V0 Z" fill="#3b6fd1" stroke={line('#3b6fd1')} strokeWidth={9} />
          <ellipse cx={-200} cy={-150} rx={30} ry={150} fill="#1a2350" />
          <g transform={`translate(-200 0) rotate(${-door * 80})`}>
            <path d="M0 0 V-300 Q-20 -300 -20 -150 Q-20 0 0 0 Z" fill={light('#3b6fd1', 0.2)} stroke={line('#3b6fd1')} strokeWidth={6} />
          </g>
          <rect x={170} y={-260} width={26} height={130} rx={8} fill="#e23b3b" transform="rotate(0 183 -130)" />
        </g>
        <g opacity={1 - after(e, 1.2)} transform="translate(860 700)">
          <rect x={-130} y={-90} width={260} height={180} rx={20} fill="none" stroke="#3b6fd1" strokeWidth={6} strokeDasharray="20 14" />
        </g>
        {person(PARENT, 230, 1880, 1.9, move(e, 0.6, 'reach', 'shrug'), e > 0.6 ? 'surprised' : 'neutral', 0.6, 6)}
        <Word x={640} y={1050} t="NO SEPARATE NOTICE" size={58} c="#fff6e6" op={after(e - 0.5, 0.3)} />
      </g>);
    }
    case 'study-scales': {
      // s13 detail (wall view): the balance takes an AI drafted plan and a teacher written plan and settles level; stopwatches
      const sc = since('s13-scale'), tm = since('s13-time');
      const settle = sc < 0 ? 0.6 : Math.cos(sc * 6) * Math.exp(-sc * 2.2) * 0.8;
      const plan = (c: string, label: string) => (
        <g transform="translate(0 -10)">
          <rect x={-90} y={-130} width={180} height={130} rx={16} fill="#fffaf0" stroke={line('#fffaf0')} strokeWidth={4} />
          <rect x={-90} y={-130} width={180} height={34} rx={14} fill={c} />
          <text x={0} y={-104} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={24} fill="#ffffff">{label}</text>
          <Lines x={-70} y={-80} w={140} n={3} gap={24} thick={9} c="#b9b4d6" />
        </g>
      );
      return svg(<g>
        <Scale x={540} y={880} s={1.25} tilt={settle} left={plan('#7a5af8', 'AI DRAFT')} right={plan('#ef4444', 'TEACHER')} />
        <Word x={540} y={600} t="SAME QUALITY" size={64} c="#3a3350" op={after(since('s13-check'), 0.3)} />
        {[[160, 1250], [920, 1250]].map(([cx, cy], i) => { const g2 = pop(since('s13-check') - i * 0.15, 0.4, 2); return g2 > 0 ? <g key={i} transform={`translate(${cx} ${cy}) scale(${g2})`}>
          <circle r={50} fill="#2bb673" stroke={line('#2bb673')} strokeWidth={5} /><path d="M-22 0 L-6 18 L24 -18" stroke="#fff" strokeWidth={11} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g> : null; })}
        <Stopwatch x={300} y={1560} s={1.0} p={0.25 * after(tm, 0.8)} c="#7a5af8" />
        <Stopwatch x={780} y={1560} s={1.0} p={0.92 * after(tm, 1.2)} c="#ef4444" />
        <Word x={540} y={1760} t="LESS TIME" size={60} c="#1f8a4c" op={after(tm - 0.6, 0.3)} />
      </g>);
    }
    case 'sign-page': {
      // s14 close, top-down: her pen signs the bottom of the finished page; the highlighter sits capped and proud beside it
      const sg = since('s14-sign');
      const sign = after(sg - 0.2, 1.4);
      const px = 340 + sign * 300, py = 1110 + Math.sin(sign * 26) * 10;
      return svg(<g>
        <rect x={-60} y={-60} width={1200} height={2100} fill="#a8744a" />
        {Array.from({length: 9}, (_, k) => <path key={k} d={`M${-60 + k * 160} -60 L${-260 + k * 160} 2000`} stroke={shade('#a8744a', 0.15)} strokeWidth={4} opacity={0.5} />)}
        <IEPPage x={520} y={800} s={1.1} frame={frame} boxes={['filled', 'filled', 'pen', 'pen', 'filled', 'pen']} labels={LABELS} sign={sign} rot={3} title="IEP" />
        <Highlighter x={930} y={1080} s={0.6} frame={frame} mood="proud" cap={0} lean={14} />
        <path d={`M${px + 300} 2000 Q${px + 200} ${py + 400} ${px + 60} ${py + 90}`} stroke={line('#ef4444')} strokeWidth={128} fill="none" strokeLinecap="round" />
        <path d={`M${px + 300} 2000 Q${px + 200} ${py + 400} ${px + 60} ${py + 90}`} stroke="#ef4444" strokeWidth={112} fill="none" strokeLinecap="round" />
        <circle cx={px + 50} cy={py + 70} r={58} fill={TEACH.skin as string} stroke={line(TEACH.skin as string)} strokeWidth={6} />
        <path d={`M${px} ${py} L${px + 70} ${py + 110}`} stroke="#1d4ed8" strokeWidth={22} strokeLinecap="round" />
      </g>);
    }
    default:
      return svg(<g>
        <ClassRoom frame={frame} win={WIN.wide} floorY={1380} />
        <Desk x={540} y={1360} w={720} />
        {person(TEACH, 300, 1720, 1.6, {pose: 'stand'}, 'neutral', 0.4, 4)}
      </g>);
  }
};
