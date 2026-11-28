import React from 'react';
import {useCurrentFrame} from 'remotion';
import type {FilmRenderProps} from '../../../modern/types';
import {actionWindows, type DirectedScene} from '../../../lib/direction';
import {Figure, castV2, figureHands, type FigureEmotion, type FigurePose, type FigureProps} from '../../../look/Figure';
import {Burst, ContactShadow, Glow, ScanBox, clamp01, ease, easeOutBack, lerp} from '../../../look/Kit';
import {line, shade} from '../../../look/color';
import {FONT} from '../../../lib/type';
import {
  CARD, CYAN, Desk, HEAT, Hourglass, Ink, Lens, LitBox, Lungs, Monitor, Phone, PlainCard, Room, Router, ScanCard, Scanner, Slice, Stack,
  Word, after, pop, stackAt,
} from './parts';

/**
 * scan-line-1127 (November 27th, 2026): "The scan that cuts the line". At Houston Methodist in the Texas Medical
 * Center (Harris County), a router sends the right studies to an AI tool called Aidoc, which flags a possible problem
 * with a heat map and lifts that exam to the top of a radiologist's worklist. The radiologist still reads it and makes
 * the call, and the tool is not perfect. Every fact is in claims.json.
 *
 * Hero: the scan card with a face. Throughline: that card, grey and buried, glowing with a heat map, on top of the
 * worklist, then stamped READ. People are illustrative from the v2 cast. No real person's likeness, no company's
 * mark, and the hospital is not drawn as documentary.
 */
const RAD: Partial<FigureProps> = {...castV2('clinician'), hat: 'none', top: 'labcoat', shirt: '#f4f6fb', glasses: true};
const TECH: Partial<FigureProps> = {...castV2('technician')};
const NURSE: Partial<FigureProps> = {...castV2('nurse')};
const RAD2: Partial<FigureProps> = {...castV2('scientist')};

const move = (t: number, at: number, before: FigurePose, after2: FigurePose) => (
  t < at ? {pose: before} : {pose: after2, fromPose: before, poseBlend: clamp01((t - at) / 0.35)}
);

export const ScanLineFilm: React.FC<FilmRenderProps> = ({board, shot, time_s, shot_s}) => {
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
  const paper = (c1 = '#fff4e2', c2 = '#f6e2c4') => (
    <g>
      <defs>
        <linearGradient id="sl-paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c1} /><stop offset="100%" stopColor={c2} /></linearGradient>
      </defs>
      <rect x={-240} y={-240} width={1560} height={2400} fill="url(#sl-paper)" />
      <Glow x={300} y={500} r={700} color="#ffffff" opacity={0.4} />
    </g>
  );
  /** a mini worklist screen: rows, one glowing at index `hot` */
  const worklist = (hot: number, glow = 0) => (
    <g>
      <rect x={0} y={0} width={400} height={260} fill="#0f1534" />
      {Array.from({length: 6}, (_, i) => (
        <g key={i}>
          <rect x={16} y={14 + i * 40} width={368} height={30} rx={10} fill={i === hot ? HEAT : '#283166'} opacity={i === hot ? 0.6 + glow * 0.4 : 1} />
          <rect x={30} y={24 + i * 40} width={120} height={10} rx={5} fill="#c9d2ee" opacity={0.7} />
        </g>
      ))}
    </g>
  );

  switch (shot.view) {
    // ------------------------------------------------------------------ s1 / s13 the stack
    case 'stack-hook':
    case 'stamp-close': {
      const end = shot.scene_id === 's13';
      const sx = 700, sy = 1330;
      if (!end) {
        const g = since('s1-glow');
        const wave = pop(g - 0.4, 0.5);
        const lift = after(g - 1.8, 1.2);
        const cx = 860;
        return svg(<g>
          <Room frame={frame} win={{x: 80, y: 520, w: 420, h: 330}} />
          <Desk y={1060} />
          <ContactShadow x={cx} y={1062} w={420} opacity={0.5} />
          <ScanCard x={cx - lift * 30} y={850 - lift * 20} s={1.3} frame={frame} mood="sweat" flag={wave} grey={1}
            tilt={-3 + Math.sin(frame / 4) * 3 * wave - lift * 5} />
          {/* the stack sits ON the buried card and runs off the top of the frame */}
          {Array.from({length: 11}, (_, i) => <PlainCard key={i} x={cx + Math.sin(i * 1.7) * 12 + i * 3} y={620 - i * 62} s={1.25}
            tilt={Math.sin(i * 2.3) * 3 + Math.sin(frame / 9 + i) * wave * 1.5} frame={frame} c={i % 2 ? '#e8e2f7' : '#dfe5f7'} />)}
          <Burst x={cx + 120} y={660} p={(g - 0.4) / 0.6} color="#ff4d5e" />
          {person(RAD, 260, 1780, 2.2, move(t, 1.2, 'think', 'reach'), t < 1.2 ? 'thinking' : 'surprised', 0.8, 7)}
        </g>);
      }
      const n = since('s13-new');
      const st = since('s13-stamp');
      const down = st < 0 ? -0.2 * Math.sin(t * 3) : 1 - Math.abs(1 - clamp01(st / 0.25) * 2) * 0;
      const p1 = t < 0.15 ? t / 0.15 : 1 - 0.35 * clamp01((t - 0.15) / 0.5);
      const press = st < 0 ? p1 : st < 0.12 ? lerp(0.65, 1, st / 0.12) : 1 - 0.3 * clamp01((st - 0.12) / 0.5);
      const handY = lerp(330, 790, press);
      const rise = after(n - 0.2, 2.0);
      return svg(<g>
        <rect x={-240} y={-240} width={1560} height={2400} fill="#8a7050" />
        {Array.from({length: 8}, (_, i) => <path key={i} d={`M-240 ${200 + i * 220} Q540 ${180 + i * 220} 1320 ${210 + i * 220}`} stroke="#6a5038" strokeWidth={6} opacity={0.4} fill="none" />)}
        <Glow x={540} y={820} r={600} color={HEAT} opacity={0.15} />
        <ScanCard x={930} y={lerp(1150, 960, rise)} s={0.6} frame={frame} mood="worried" heat={clamp01(n * 2)} tilt={8} />
        {person(RAD, 150, 1820, 2.1, {pose: 'point'}, st > 0 ? 'proud' : 'happy', 0.8, 7)}
        <ContactShadow x={600} y={1090} w={560} opacity={0.45} />
        <ScanCard x={600} y={820} s={1.65} frame={frame} mood={st > 0 ? 'proud' : 'calm'} heat={0.35} stamp={clamp01((t - 0.1) / 0.25)} tilt={-4} />
        <Burst x={600} y={850} p={(st - 0.1) / 0.6} color="#2fbf71" />
        <Burst x={600} y={850} p={(t - 0.1) / 0.6} color="#2fbf71" />
        {/* her arm, sleeve from the top right, the stamp in her hand */}
        <path d={`M1300 -100 Q1000 ${handY - 420} 700 ${handY - 300}`} stroke="#f4f6fb" strokeWidth={160} fill="none" strokeLinecap="round" />
        <g transform={`translate(620 ${handY}) scale(1.6)`}>
          <rect x={-60} y={-40} width={120} height={60} rx={20} fill="#2fbf71" stroke={line('#2fbf71')} strokeWidth={6} />
          <rect x={-22} y={-180} width={44} height={150} rx={22} fill="#7a4a2a" stroke={line('#7a4a2a')} strokeWidth={6} />
          <circle cx={0} cy={-190} r={46} fill="#f6d3b3" stroke={line('#f6d3b3')} strokeWidth={6} />
        </g>
        {down > 2 && <g />}
      </g>);
    }
    // ------------------------------------------------------------------ s1 the wide room
    case 'tmc-window': {
      const w = since('s1-window');
      const pull = ease(clamp01(w / 2.8));
      const sc = lerp(1.35, 1, pull);
      const cards = 6 + Math.floor(clamp01(t / 3) * 10);
      return svg(<g transform={`translate(540 960) scale(${sc}) translate(-540 -960)`}>
        <Room frame={frame} win={{x: 120, y: 200, w: 840, h: 640}} />
        <Desk y={1130} />
        <Monitor x={330} y={1130} s={0.75} glow={0.25}>{worklist(5)}</Monitor>
        <Stack x={800} y={1000} n={cards} frame={frame} s={0.7} lean={1.3} />
        <ScanCard x={stackAt(800, 1000, 0, 0.7).x} y={1075} s={0.42} frame={frame} mood="sweat" grey={1} flag={0.8} />
        {person(RAD, 560, 1560, 1.25, {pose: 'think'}, 'thinking', -0.3, 7)}
      </g>);
    }
    // ------------------------------------------------------------------ s2 reading in order
    case 'reading-room': {
      const g = since('s2-scroll');
      const pick = after(g - 0.1, 0.9);
      const read = after(g - 1.4, 0.6);
      return svg(<g>
        <Room frame={frame} win={{x: 60, y: 180, w: 420, h: 360}} />
        <Desk y={1130} />
        <Monitor x={330} y={1130} s={0.8}>{worklist(0)}</Monitor>
        <Stack x={360} y={1060} n={7} frame={frame} s={0.55} skip={[6]} />
        <PlainCard x={lerp(380, 640, pick)} y={lerp(1060 - 6 * 30, 860, pick)} s={lerp(0.55, 1.1, pick)} frame={frame} tilt={lerp(0, -10, read)} />
        {person(RAD, 860, 2150, 2.7, move(t, 0.2, 'stand', 'reach'), read > 0.5 ? 'thinking' : 'neutral', -0.8, 7)}
      </g>);
    }
    // ------------------------------------------------------------------ s2 / s5 the chute, overhead
    case 'queue-chute': {
      const pan = t * 120;
      return svg(<g>
        <rect x={-240} y={-240} width={1560} height={2400} fill="#1b2456" />
        <Glow x={540} y={400} r={700} color={CYAN} opacity={0.12} />
        <g transform={`translate(0 ${-pan})`}>
          <rect x={300} y={-200} width={480} height={3400} rx={60} fill="#2a3a78" stroke="#5a6aa8" strokeWidth={12} />
          {Array.from({length: 26}, (_, i) => i === 14 ? null : <PlainCard key={i} x={540 + Math.sin(i) * 14} y={i * 120 + 100} s={1.2} frame={frame} tilt={Math.sin(i * 1.3) * 4} />)}
          <ScanCard x={540} y={14 * 120 + 100} s={0.7} frame={frame} mood="sweat" grey={1} tilt={90} />
                  </g>
        <Word x={540} y={560} t="TOP" size={64} c="#fff6e6" op={clamp01(1 - pan / 400)} />
      </g>);
    }
    // ------------------------------------------------------------------ s3 the scanner
    case 'scanner-face': {
      const p = since('s3-puff');
      const puff = clamp01(p / 1.2);
      const out = easeOutBack(clamp01((p - 0.6) / 0.8), 1.4);
      return svg(<g>
        <Room frame={frame} dark={0.1} win={{x: 680, y: 200, w: 340, h: 300}} />
        <rect x={-240} y={1440} width={1560} height={720} fill="#202a5e" />
        <Scanner x={560} y={1450} s={1.05} frame={frame} puff={puff} mood={puff > 0.9 ? 'awake' : 'sleepy'} />
        <ScanCard x={lerp(560, 760, out)} y={lerp(1110, 760, out)} s={0.55 * clamp01(out + 0.2)} frame={frame} mood="sweat" grey={1} tilt={lerp(0, 12, out)} />
        {person(TECH, 170, 1660, 1.5, {pose: 'hold'}, 'happy', 0.6, 5,
          {holding: <g><rect x={-45} y={-110} width={90} height={110} rx={20} fill="#f4f6fb" stroke={line('#f4f6fb')} strokeWidth={6} />
            <rect x={-45} y={-80} width={90} height={26} fill={HEAT} opacity={0.8} />
            <path d={`M-14 ${-130 - (frame % 20)} q14 -18 0 -34`} stroke="#ffffff" strokeWidth={6} fill="none" opacity={0.6} /></g>})}
      </g>);
    }
    // ------------------------------------------------------------------ s3 / s11 the router
    case 'router-yard': {
      const r = since('s3-route');
      const route = clamp01(r / 5.5);
      return svg(<g>
        <Room frame={frame} dark={0.15} win={{x: 60, y: 160, w: 320, h: 300}} />
        <rect x={-240} y={1460} width={1560} height={700} fill="#202a5e" />
        <Router x={600} y={980} s={1.05} frame={frame} route={route} />
        <Burst x={475} y={770} p={(r - 0.1) / 0.6} color="#e9b949" />
        {person(TECH, 190, 1660, 1.45, {pose: 'hold'}, route > 0.15 ? 'happy' : 'neutral', 0.7, 5, {holding: <g><rect x={-45} y={-110} width={90} height={110} rx={20} fill="#f4f6fb" stroke={line('#f4f6fb')} strokeWidth={6} />
            <rect x={-45} y={-80} width={90} height={26} fill={HEAT} opacity={0.8} />
            <path d={`M-14 ${-130 - (frame % 20)} q14 -18 0 -34`} stroke="#ffffff" strokeWidth={6} fill="none" opacity={0.6} /></g>})}
              </g>);
    }
    // ------------------------------------------------------------------ s3 the old way
    case 'knob-flashback': {
      const o = since('s3-old');
      const walkX = lerp(180, 860, clamp01(t / 3.2));
      const at = Math.min(2, Math.floor(clamp01(t / 3.2) * 3));
      return svg(<g>
        <rect x={-240} y={-240} width={1560} height={2400} fill="#5a4a6e" />
        <Glow x={540} y={700} r={800} color="#ffcf9a" opacity={0.25} />
        <rect x={-240} y={1420} width={1560} height={740} fill="#3e3254" />
        {[200, 540, 880].map((x, i) => (
          <g key={i}>
            <Scanner x={x} y={1130} s={0.4} frame={frame} mood={i === at ? 'awake' : 'sleepy'} />
            <g transform={`translate(${x + 110} 890) rotate(${i === at ? frame * 8 : 0})`}>
              <circle r={30} fill="#e9b949" stroke={line('#e9b949')} strokeWidth={5} />
              <rect x={-5} y={-30} width={10} height={24} rx={5} fill="#5a3a2a" />
            </g>
          </g>
        ))}
        {person(TECH, walkX, 1640, 1.25, {pose: 'reach', walk: t}, 'worried', 0.6, 5)}
        {o > 0 && <path d={`M${walkX + 70} ${1100 - (frame % 24)} q10 16 0 24 q-10 -8 0 -24Z`} fill={CYAN} transform="translate(0 -140)" />}
        <LitBox x={70} y={480} w={330} h={110} r={40} c="#3a2a5e" op={pop(o, 0.4)} />
        <Word x={235} y={555} t="BEFORE" size={60} c="#fff6e6" op={pop(o, 0.4)} />
        <rect x={-240} y={-240} width={1560} height={2400} fill="#d9b48a" opacity={0.12} />
      </g>);
    }
    // ------------------------------------------------------------------ s4 / s11 the lens reads
    case 'lens-read': {
      if (shot.scene_id === 's11') {
        const f = since('s11-feedback');
        const fly = ease(clamp01(f / 2.2));
        const focus = clamp01((f - 2.2) / 0.8);
        return svg(<g>
          <rect x={-240} y={-240} width={1560} height={2400} fill="#1b2456" />
          <Glow x={540} y={900} r={700} color={CYAN} opacity={0.14} />
          <Lens x={560} y={860} r={250} frame={frame} rot={30} focus={focus}>
            <g transform="translate(-200 -160) scale(2)"><Slice frame={frame} heat={0.4} /></g>
          </Lens>
          {f > 0 && <g transform={`translate(${lerp(120, 560, fly)} ${lerp(1100, 860, fly) - Math.sin(fly * Math.PI) * 300}) rotate(${fly * 360}) scale(${lerp(1.6, 0.8, fly)})`} opacity={1 - clamp01((f - 2.6) / 0.6)}>
            <rect x={-60} y={-40} width={120} height={80} rx={14} fill="#fff4dc" stroke={line('#fff4dc')} strokeWidth={5} />
            <path d="M-40 -14 L40 -14 M-40 8 L24 8" stroke="#8a7a5a" strokeWidth={6} strokeLinecap="round" />
          </g>}
          <g transform={`translate(860 1340) rotate(${focus * 360 + frame})`}>
            {Array.from({length: 8}, (_, i) => <rect key={i} x={-12} y={-74} width={24} height={30} rx={8} fill="#e9b949" transform={`rotate(${i * 45})`} />)}
            <circle r={52} fill="#e9b949" stroke={line('#e9b949')} strokeWidth={6} />
          </g>
          <Word x={540} y={1300} t="feedback" size={54} c="#fff4dc" op={after(f - 0.2, 0.5)} />
        </g>);
      }
      const l = since('s4-lens');
      const fl = since('s4-flag');
      const sweep = (Math.sin(t * 1.6) + 1) / 2;
      const blush = after(fl, 0.6);
      return svg(<g>
        <rect x={-240} y={-240} width={1560} height={2400} fill="#1b2456" />
        <Glow x={540} y={1000} r={720} color={blush > 0 ? HEAT : CYAN} opacity={0.12 + blush * 0.1} />
        <ScanCard x={540} y={860} s={1.6} frame={frame} mood={blush > 0 ? 'blush' : 'worried'} grey={1 - blush} heat={blush * 0.9}
          flag={pop(fl, 0.4)} tilt={-3} />
        <g opacity={clamp01(l * 3)}>
          <Lens x={lerp(380, 700, sweep)} y={lerp(600, 720, sweep)} r={170} frame={frame} rot={40} />
        </g>
        <Burst x={700} y={590} p={fl / 0.6} color={HEAT} />
        <Word x={540} y={1090} t="AI READS" size={64} c="#cfe0ff" op={after(l - 0.5, 0.5) * (1 - blush)} />
      </g>);
    }
    // ------------------------------------------------------------------ s4 / s10 the heat map, close
    case 'heatmap-close': {
      const h = since('s4-heat');
      const heat = after(h, 1.2);
      return svg(<g>
        <rect x={-240} y={-240} width={1560} height={2400} fill="#0f1534" />
        <g transform="translate(40 560) scale(5)"><Slice frame={frame} heat={heat} hx={136} hy={92} /></g>
        {heat > 0 && [0, 1, 2].map((k) => (
          <circle key={k} cx={40 + 136 * 5} cy={560 + 92 * 5} r={(90 + k * 70) * heat + ((frame * 2 + k * 30) % 60)} fill="none" stroke={HEAT}
            strokeWidth={6} opacity={0.5 - k * 0.12} />
        ))}
        <ScanBox x={40 + 136 * 5 - 150} y={560 + 92 * 5 - 150} w={300} h={300} lock={heat} frame={frame} />
        <Word x={540} y={470} t="a spot worth a look" size={56} c="#ffd7b0" op={after(h - 0.8, 0.5)} />
      </g>);
    }
    // ------------------------------------------------------------------ s5 the climb, low angle
    case 'chute-up': {
      const c = since('s5-climb');
      const climb = ease(clamp01(c / 3.0));
      const cy = lerp(1750, 520, climb);
      return svg(<g>
        <rect x={-240} y={-240} width={1560} height={2400} fill="#1b2456" />
        <path d="M180 1920 L420 0 L660 0 L900 1920 Z" fill="#2a3a78" stroke="#5a6aa8" strokeWidth={12} />
        {Array.from({length: 12}, (_, i) => {
          const y = 1800 - i * 150;
          const k = 1 - y / 2400;
          const near = Math.abs(y - cy) < 200;
          const side = i % 2 ? 1 : -1;
          return <PlainCard key={i} x={540 + (near ? side * 230 * (1 - Math.abs(y - cy) / 200) : 0)} y={y} s={1.5 * k + 0.3} frame={frame}
            tilt={near ? side * 18 : 0} />;
        })}
        <ScanCard x={540} y={cy} s={lerp(1.1, 0.7, climb)} frame={frame} mood="blush" heat={0.9} flag={1} tilt={Math.sin(frame / 4) * 4} />
        {Array.from({length: 6}, (_, i) => <path key={i} d={`M${470 + i * 28} ${cy + 220 + i * 10} l0 ${80 + i * 10}`} stroke={HEAT} strokeWidth={8}
          strokeLinecap="round" opacity={0.6 * (1 - climb * 0.5)} />)}
        <Word x={540} y={440} t="TOP" size={72} c="#fff6e6" op={after(c - 2.0, 0.6)} />
      </g>);
    }
    // ------------------------------------------------------------------ s5 / s6 the radiologist, close
    case 'radiologist-close': {
      const s6 = shot.scene_id === 's6';
      const land = s6 ? 1 : since('s5-land');
      const lp = s6 ? 1 : easeOutBack(clamp01(land / 0.6), 1.8);
      const eyes = s6 ? since('s6-eyes') : -1;
      const emo: FigureEmotion = s6 ? (eyes > 0.1 ? 'surprised' : 'worried') : land > 0.2 ? 'surprised' : 'thinking';
      return svg(<g>
        <Room frame={frame} win={{x: 620, y: 200, w: 400, h: 380}} />
        <Desk y={1460} />
        <Stack x={760} y={1390} n={5} frame={frame} s={0.8} />
        <ScanCard x={790} y={lerp(700, 1390 - 5 * 43 - 120, lp)} s={0.8} frame={frame} mood={s6 ? 'worried' : 'blush'} heat={0.9} flag={1}
          tilt={lerp(-20, 4, clamp01(lp))} />
        <Burst x={790} y={1060} p={land / 0.6} color={HEAT} />
        {person(RAD, 330, 2050, 2.4, move(t, 0.3, 'think', s6 ? 'raise' : 'point'), emo, 0.7, 7)}
        {s6 && <Glow x={330} y={980} r={260} color="#ff4d5e" opacity={after(eyes, 0.4) * 0.25} />}
      </g>);
    }
    // ------------------------------------------------------------------ s6 the clot
    case 'clot-path': {
      const c = since('s6-clot');
      const lg = since('s6-lung');
      const clot = ease(clamp01(c / 1.7));
      const beatS = 1 + Math.max(0, Math.sin(t * 7)) * 0.04;
      const red = after(lg, 0.8);
      return svg(<g>
        <Room frame={frame} dark={0.2} win={{x: 700, y: 200, w: 330, h: 300}} />
        <Desk y={1240} />
        {/* the reading room's big wall screen, lit, with the diagram on it */}
        <rect x={170} y={260} width={760} height={900} rx={50} fill="#0f1534" stroke="#5a6aa8" strokeWidth={12} />
        <Glow x={550} y={760} r={520} color={red > 0 ? '#ff4d5e' : CYAN} opacity={0.18} />
        <Lungs x={560} y={560} s={0.74 * beatS} frame={frame} clot={clot} red={red} />
        <Burst x={560 + 170 * 0.74} y={560 + 40 * 0.74} p={lg / 0.6} color="#ff4d5e" />
        {person(RAD, 150, 1800, 2.0, move(lg, 0.1, 'point', 'raise'), lg > 0 ? 'surprised' : 'worried', 0.7, 7)}
      </g>);
    }
    // ------------------------------------------------------------------ s7 the hourglass
    case 'hourglass': {
      const g = since('s7-glass');
      const cn = since('s7-count');
      const flip = ease(clamp01(g / 1.0));
      const pour = clamp01((t - 1.0) / 7.5);
      const count = clamp01((cn + 0.25) / 0.45);
      const val = (1.9 * ease(count)).toFixed(1);
      return svg(<g>
        <rect x={-240} y={-240} width={1560} height={2400} fill="#1b2456" />
        <Glow x={420} y={900} r={700} color="#fff1a8" opacity={0.12} />
        <Hourglass x={400} y={1340} s={1.35} p={pour} flip={flip} frame={frame} />
        {cn > 0 && <g>
          <LitBox x={150} y={430} w={560} h={190} r={50} c="#2a3150" />
          <Word x={430} y={530} t={`${val} million`} size={78} c="#fff1a8" />
          <Word x={430} y={598} t="neurons a minute" size={38} c="#cfe0ff" />
        </g>}
        {person(RAD, 900, 2150, 2.5, move(g, 0.05, 'reach', 'raise'), cn > 0.2 ? 'worried' : 'surprised', -0.8, 7)}
      </g>);
    }
    // ------------------------------------------------------------------ s8 the desks fill
    case 'team-grow': {
      const e = since('s8-eighteen');
      const h = since('s8-hundred');
      const cols = 10, rows = 10;
      const lit = (i: number) => (i < 18 ? pop(e - i * 0.04, 0.4) : pop(h - (i - 18) * 0.012, 0.35));
      const slide = 1 - easeOutBack(clamp01(since('s8-desks') / 1.2), 1.2);
      return svg(<g>
        <Room frame={frame} dark={0.25} win={{x: 760, y: 120, w: 280, h: 220}} />
        <rect x={60} y={480} width={960} height={980} rx={50} fill="#141a3c" stroke="#5a6aa8" strokeWidth={10} opacity={0.9} />
        {Array.from({length: rows * cols}, (_, i) => {
          const r = Math.floor(i / cols), c = i % cols;
          const k = lit(i);
          const x = 110 + c * 96, y = 560 + r * 92;
          return (
            <g key={i} transform={`translate(${x} ${y + slide * (500 + r * 40) - (k > 0.5 ? Math.abs(Math.sin(frame / 6 + i)) * 10 : 0)}) scale(${0.3 + k * 0.7})`} opacity={0.25 + k * 0.75}>
              <rect x={-36} y={8} width={72} height={16} rx={8} fill="#7d88a8" />
              <rect x={-30} y={-34} width={60} height={40} rx={10} fill={k > 0.5 ? '#2a3150' : '#9aa3c8'} />
              {k > 0.5 && <rect x={-24} y={-28} width={48} height={28} rx={6} fill={(i + Math.floor(frame / 8)) % 7 === 0 ? HEAT : CYAN} opacity={0.6} />}
              <circle cx={0} cy={-48} r={14} fill={k > 0.5 ? ['#f6d3b3', '#c98a5a', '#6e4428', '#e8b48a', '#9a6440'][i % 5] : '#b8c0dc'} />
            </g>
          );
        })}
        {person(RAD, lerp(140, 860, clamp01(t / 8)), 1660, 1.6, {pose: h > 0 ? 'cheer' : 'reach', walk: h > 0 ? undefined : t}, h > 0 ? 'excited' : 'happy', 0.5, 7)}
      </g>);
    }
    // ------------------------------------------------------------------ s9 the skeptic
    case 'skeptic': {
      const c = since('s9-cross');
      return svg(<g>
        <rect x={-240} y={-240} width={1560} height={2400} fill="#2a3a78" />
        <Glow x={300} y={600} r={600} color={HEAT} opacity={0.15} />
        <ScanCard x={260} y={640} s={0.9} frame={frame} mood="blush" heat={0.85} flag={1} tilt={-8} />
        {person(RAD, 640, 2500, 3.4, move(c, 0.1, 'stand', 'crossed'), 'smug', -0.7, 7)}
        <Word x={240} y={430} t="?" size={120} c="#cfe0ff" op={pop(c - 0.4, 0.4)} rot={-10} />
      </g>);
    }
    // ------------------------------------------------------------------ s9 / s10 the quote card
    case 'quote-card': {
      const s9 = shot.scene_id === 's9';
      const q = s9 ? since('s9-quote') : since('s10-upfront');
      const nod = s9 ? since('s9-nod') : -1;
      const inP = easeOutBack(clamp01(q / 0.6), 1.3);
      return svg(<g>
        <Room frame={frame} dark={0.15} win={{x: 700, y: 140, w: 330, h: 260}} />
        <Desk y={1300} />
        <g transform={`translate(${lerp(1200, 0, inP)} 0) rotate(${(1 - inP) * 8} 540 760)`}>
          <rect x={60} y={440} width={820} height={660} rx={50} fill="#fffdf6" stroke="#e2cfa8" strokeWidth={8} />
          <g transform="translate(190 540)">{[0, 60].map((dx) => <path key={dx} d={`M${dx} 0 a22 22 0 1 1 22 22 q0 30 -26 44`} stroke={HEAT} strokeWidth={16} fill="none" strokeLinecap="round" />)}</g>
          {s9 ? (<g>
            <Ink x={170} y={700} t="Even the most skeptical" size={54} weight={800} />
            <Ink x={170} y={772} t="radiologist said, 'This" size={54} weight={800} />
            <Ink x={170} y={844} t="is a great tool.'" size={54} weight={800} />
          </g>) : (<g>
            <Ink x={170} y={720} t="It's not perfect, but" size={58} weight={800} />
            <Ink x={170} y={800} t="they're upfront about that." size={58} weight={800} />
          </g>)}
          <rect x={170} y={920} width={320} height={6} rx={3} fill="#e2cfa8" />
          <Ink x={170} y={990} t="Ginny Torno, Houston Methodist" size={34} c="#5a4a6e" />
          <Ink x={170} y={1040} t="Sr. Director of IT and Innovation" size={32} c="#8a7a8e" weight={600} />
        </g>
        {s9
          ? person(RAD, 900, 1700, 1.3, move(nod, 0, 'crossed', 'raise'), nod > 0 ? 'happy' : 'smug', -0.5, 7)
          : person(RAD, 900, 1700, 1.3, {pose: 'think'}, 'thinking', -0.5, 7)}
      </g>);
    }
    // ------------------------------------------------------------------ s10 the false flag
    case 'false-flag': {
      const f = since('s10-false');
      const glow = after(f, 0.6);
      return svg(<g>
        <Room frame={frame} dark={0.1} win={{x: 640, y: 180, w: 380, h: 340}} />
        <Desk y={1440} />
        <ScanCard x={690} y={820} s={1.25} frame={frame} mood="sheepish" heat={glow} hx={22} hy={146} tint="#ffe9d6" flag={glow} tilt={6} />
        {glow > 0.5 && <circle cx={690 + (22 - 100) * 1.25} cy={820 + (146 - 126 - 155 + 29) * 1.25 + 160} r={80} fill="none" stroke="#fff6e6" strokeWidth={8} strokeDasharray="20 14" />}
        {glow > 0.5 && <Word x={690 + (22 - 100) * 1.25 - 120} y={1010} t="?" size={110} c="#fff6e6" />}
                {person(RAD, 250, 1860, 1.7, move(f, 0.6, 'stand', 'hips'), f > 0.6 ? 'angry' : 'thinking', 0.7, 7)}
      </g>);
    }
    // ------------------------------------------------------------------ s10 the magnifier over the shoulder
    case 'magnifier-shoulder': {
      const l = since('s10-look');
      const sw = ease(clamp01(l / 0.9));
      const shrink = 1 - after(l - 0.6, 0.6) * 0.75;
      return svg(<g>
        <rect x={-240} y={-240} width={1560} height={2400} fill="#1b2456" />
        <Glow x={620} y={900} r={700} color={CYAN} opacity={0.12} />
        <ScanCard x={620} y={960} s={1.6} frame={frame} mood="calm" heat={0.5} flag={shrink} />
        {shrink < 0.6 && <path d={`M${820} ${640} l60 -60 m-60 60 l0 -50 m0 50 l50 0`} stroke={HEAT} strokeWidth={14} strokeLinecap="round" fill="none" transform="rotate(180 840 620)" />}
        <Lens x={lerp(1000, 700, sw)} y={lerp(1300, 760, sw)} r={180} frame={frame} rot={20} />
        {person(RAD, 120, 2140, 2.6, move(l, 0.1, 'think', 'point'), 'determined', 0.9, 7)}
        <Word x={620} y={470} t="look first" size={60} c="#fff6e6" op={after(l - 0.4, 0.4)} />
      </g>);
    }
    // ------------------------------------------------------------------ s11 she reads it
    case 'read-desk': {
      const r = since('s11-read');
      const open = ease(clamp01(r / 1.0));
      const pen = Math.sin(t * 5) * 30;
      return svg(<g>
        <rect x={-240} y={-240} width={1560} height={2400} fill="#6e5a8a" />
        <rect x={-240} y={-240} width={1560} height={2400} fill="#8a7050" opacity={0.5} />
        {Array.from({length: 8}, (_, i) => <path key={i} d={`M0 ${200 + i * 220} Q540 ${180 + i * 220} 1080 ${210 + i * 220}`} stroke="#6a5038" strokeWidth={6} opacity={0.4} fill="none" />)}
        <ContactShadow x={540} y={1180} w={900} opacity={0.4} />
        <g transform={`translate(540 760) scale(${lerp(0.6, 1, open)}) rotate(${lerp(-12, -3, open)})`}>
          <rect x={-380} y={-330} width={760} height={640} rx={40} fill={CARD} stroke={line(CARD)} strokeWidth={8} />
          <g transform="translate(-340 -290) scale(3.4)"><Slice frame={frame} heat={0.35} /></g>
        </g>
        {/* her two hands, sleeves from the bottom of the frame: one steadies the sheet, one marks it */}
        {[[-1, 240, 1040], [1, 660 + pen, 980]].map(([k, hx, hy], i) => (
          <g key={i}>
            <path d={`M${k < 0 ? 120 : 960} 1920 Q${(k < 0 ? 120 : 960) + (hx - (k < 0 ? 120 : 960)) * 0.3} ${hy + 300} ${hx} ${hy}`} stroke="#f4f6fb" strokeWidth={130} fill="none" strokeLinecap="round" />
            <path d={`M${k < 0 ? 120 : 960} 1920 Q${(k < 0 ? 120 : 960) + (hx - (k < 0 ? 120 : 960)) * 0.3} ${hy + 300} ${hx} ${hy}`} stroke="#d9dde8" strokeWidth={130} fill="none" strokeLinecap="round" strokeDasharray="0 2000" />
            <circle cx={hx} cy={hy} r={58} fill="#f6d3b3" stroke={line('#f6d3b3')} strokeWidth={6} />
            {k > 0 && <g transform={`translate(${hx} ${hy}) rotate(-35)`}><rect x={-10} y={-150} width={20} height={150} rx={10} fill="#ffcf3a" stroke={line('#ffcf3a')} strokeWidth={4} /><path d="M-10 -150 L0 -180 L10 -150Z" fill="#2a2a2a" /></g>}
          </g>
        ))}
        <circle cx={540 + 136 * 3.4 * 0.0 + 120} cy={660} r={70 * open} fill="none" stroke="#2fbf71" strokeWidth={10} opacity={open} />
      </g>);
    }
    // ------------------------------------------------------------------ s12 the phone
    case 'phone-alert': {
      const b = since('s12-buzz');
      const buzz = clamp01(b / 1.0);
      const look = after(b - 0.3, 0.4);
      const screen = (
        <g>
          <rect x={0} y={0} width={300} height={560} fill="#101839" />
          <rect x={20} y={30} width={260} height={80} rx={20} fill={b > 0 ? HEAT : '#283166'} opacity={0.9} />
          <text x={150} y={82} textAnchor="middle" fontFamily="sans-serif" fontWeight={900} fontSize={30} fill="#fff6e6">{b > 0 ? 'ALERT' : ''}</text>
          {b > 0.6 && <g transform={`translate(50 ${lerp(600, 180, ease(clamp01((b - 0.6) / 0.6)))})`}><Slice frame={frame} heat={0.9} /></g>}
        </g>
      );
      return svg(<g>
        <rect x={-240} y={-240} width={1560} height={2400} fill="#23305f" />
        <rect x={-240} y={1500} width={1560} height={660} fill="#1a2350" />
        {[0, 1, 2, 3].map((i) => <rect key={i} x={i * 290 - 20} y={300} width={180} height={1000} rx={30} fill="#2d3c74" />)}
        <Glow x={600} y={1000} r={500} color={b > 0 ? HEAT : CYAN} opacity={0.18 + 0.1 * buzz} />
        {b > 0 && [0, 1, 2].map((k) => <circle key={k} cx={600} cy={880} r={180 + k * 70 + ((frame * 4) % 70)} fill="none" stroke={HEAT} strokeWidth={6} opacity={0.4 - k * 0.12} />)}
        {person(NURSE, 600, 1480, 2.1, {pose: 'hold'}, b > 0 ? 'surprised' : 'neutral', -0.2 + look * 0.1, 9,
          {holding: <g transform={`rotate(${Math.sin(buzz * 40) * 6 * (buzz < 1 ? 1 : 0)})`}><Phone x={0} y={-55} s={0.32} dotted={b > 0}>{screen}</Phone></g>})}
        <LitBox x={700} y={430} w={260} h={90} r={40} c={CYAN} op={pop(b, 0.4)} />
        <Word x={830} y={492} t="NEXT" size={50} c="#0f2a3a" op={pop(b, 0.4)} />
      </g>);
    }
    // ------------------------------------------------------------------ s12 the team moves
    case 'team-run': {
      const r = since('s12-team');
      const go = clamp01(r / 2.4);
      return svg(<g>
        <rect x={-240} y={-240} width={1560} height={2400} fill="#2d3c74" />
        <path d="M-240 1300 L1320 1300 L1320 2160 L-240 2160 Z" fill="#c9d2ee" />
        <path d="M0 1300 L1080 1300" stroke="#ffffff" strokeWidth={10} opacity={0.6} />
        {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={((i * 300 - go * 400) % 1500 + 1500) % 1500 - 200} y={380} width={160} height={640} rx={26} fill="#3d4f8f" />)}
        {[0, 1, 2].map((i) => <rect key={`l${i}`} x={((i * 420 - go * 900) % 1300 + 1300) % 1300 - 100} y={180} width={220} height={40} rx={20} fill="#fff1b8" opacity={0.8} />)}
        {person(RAD2, lerp(330, 470, go), 1560, 1.35, {pose: 'stand', walk: t * 1.6}, 'determined', 0.8, 4)}
        {person(RAD, lerp(150, 300, go), 1600, 1.4, {pose: 'stand', walk: t * 1.6 + 0.3}, 'determined', 0.8, 7)}
        {person(NURSE, lerp(640, 800, go), 1640, 1.65, {pose: 'wave'}, 'determined', -0.8, 9)}
        <Word x={540} y={560} t="response team" size={66} c="#fff6e6" op={after(r - 0.2, 0.5)} />
      </g>);
    }
    // ------------------------------------------------------------------ s7 the neurons go dark
    case 'neuron-field': {
      const d = since('s7-dark');
      const dark = clamp01(d / 2.4);
      return svg(<g>
        <rect x={-240} y={-240} width={1560} height={2400} fill="#141a3c" />
        <Glow x={540} y={820} r={700} color="#fff1a8" opacity={0.12 * (1 - dark)} />
        {Array.from({length: 18 * 9}, (_, i) => {
          const c = i % 18, r = Math.floor(i / 18);
          const off = ((c * 7 + r * 13) % 29) / 29 < dark;
          return <circle key={i} cx={70 + c * 55 + (r % 2) * 26} cy={460 + r * 55} r={off ? 7 : 11 + Math.sin(frame / 5 + i) * 2}
            fill={off ? '#3a4068' : i % 4 ? '#fff1a8' : CYAN} opacity={off ? 0.7 : 0.95} />;
        })}
        <rect x={150} y={990} width={780} height={150} rx={75} fill={HEAT} stroke={line(HEAT)} strokeWidth={8} />
        <text x={540} y={1090} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={70} fill="#1a1236">1.9 million a minute</text>
        <g transform="translate(540 600) scale(0.8)">
          <circle r={120} fill="#2a3150" stroke="#cfe0ff" strokeWidth={10} />
          <path d={`M0 0 L${Math.sin(dark * Math.PI * 2) * 95} ${-Math.cos(dark * Math.PI * 2) * 95}`} stroke={HEAT} strokeWidth={12} strokeLinecap="round" />
          <circle r={14} fill="#cfe0ff" />
        </g>
      </g>);
    }
    // ------------------------------------------------------------------ s12 the phone, close
    case 'phone-close': {
      const tg = since('s12-tag');
      const cd = since('s12-card');
      return svg(<g>
        <rect x={-240} y={-240} width={1560} height={2400} fill="#23305f" />
        <Glow x={540} y={800} r={700} color={CYAN} opacity={0.18} />
        <Phone x={600} y={820} s={1.55} rot={-3} buzz={clamp01(tg / 0.8)} dotted>
          <rect x={0} y={0} width={300} height={560} fill="#101839" />
          <rect x={20} y={30} width={260} height={80} rx={20} fill={HEAT} opacity={0.9} />
          <text x={150} y={82} textAnchor="middle" fontFamily="sans-serif" fontWeight={900} fontSize={30} fill="#fff6e6">ALERT</text>
          <g transform="translate(50 140)"><Slice frame={frame} heat={0.9} /></g>
          {cd > 0 && <g transform={`translate(${lerp(340, 150, ease(clamp01(cd / 0.6)))} 300) scale(${1 + Math.max(0, 0.15 - cd * 0.1)})`}><ScanCard x={0} y={0} s={0.55} frame={frame} mood="worried" heat={0.9} /></g>}
          {tg > 0 && <g transform={`translate(150 495) scale(${lerp(1.8, 1, ease(clamp01(tg / 0.3)))}) rotate(-6)`} opacity={clamp01(tg * 3)}>
            <rect x={-130} y={-36} width={260} height={72} rx={22} fill="#2fbf71" />
            <text x={0} y={12} textAnchor="middle" fontFamily="sans-serif" fontWeight={900} fontSize={34} fill="#ffffff">TRIAGE</text>
          </g>}
        </Phone>
        <path d="M1000 2000 Q900 1500 760 1290" stroke="#14b8a6" strokeWidth={150} fill="none" strokeLinecap="round" />
        <ellipse cx={740} cy={1270} rx={95} ry={70} fill="#6e4428" stroke={line('#6e4428')} strokeWidth={6} />
        {[0, 1, 2].map((k) => <rect key={k} x={640 + k * 50} y={1180} width={40} height={80} rx={20} fill="#6e4428" stroke={line('#6e4428')} strokeWidth={5} />)}
        <Burst x={600} y={1240} p={tg / 0.6} color="#2fbf71" />
        {person(NURSE, 140, 2000, 2.3, {pose: 'point'}, cd > 0 ? 'determined' : 'thinking', 0.9, 9)}
      </g>);
    }
    default:
      return svg(<g><Room frame={frame} /><ScanCard x={540} y={960} s={1} frame={frame} /></g>);
  }
};
