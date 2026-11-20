import React from 'react';
import {useCurrentFrame} from 'remotion';
import type {FilmRenderProps} from '../../../modern/types';
import {actionWindows, type DirectedScene} from '../../../lib/direction';
import {Figure, castV2, figureHands, type FigureEmotion, type FigurePose, type FigureProps} from '../../../look/Figure';
import {Burst, ContactShadow, Glow, clamp01, ease, easeOutBack, lerp} from '../../../look/Kit';
import {line, light, shade} from '../../../look/color';
import {FONT} from '../../../lib/type';
import {Ambulance, CordPath, ERRoom, FlagTablet, Gurney, HospBox, LitBox, MiniTower, Wand, WallClock, WallPhone, Whiteboard, Word, MapPinPop, after,
  pop, type Wedge} from './parts';

/**
 * transfer-call-1119 (November 19th, 2026): "The call comes first". In a rural Texas ER with no trauma surgeon on
 * call, the decision to transfer a badly hurt patient takes 15 to 30 minutes. A UT Health San Antonio led team is
 * building an AI tool that flags severe injury and prompts that call sooner. Every fact is in claims.json.
 * The doctor, the hospital and every person are illustrative, from the v2 cast. No real person's likeness.
 *
 * Hero: the ER wall clock with a face. Throughline: the wall phone and its cord. On its hook, stretched out the
 * door, barely uncoiled, back on its hook and ringing.
 */
const DOC: Partial<FigureProps> = {...castV2('clinician'), skin: '#a96f45', hair: 'bun', hairColor: '#1c1512', hatColor: '#2fa3ad'};
const MEDIC: Partial<FigureProps> = {...castV2('technician'), top: 'jacket', shirt: '#2a4c8a', trim: '#e23b3b', pants: '#2a3550'};
const SURGEON: Partial<FigureProps> = {...castV2('scientist'), top: 'scrubs', shirt: '#3b5fa8', pants: '#3b5fa8', glasses: true};
const RES1: Partial<FigureProps> = {...castV2('coder')};
const RES2: Partial<FigureProps> = {...castV2('dctech')};

// the stage's window for each framing, so the county shows through our wall exactly where the stage puts it
const WIN = {wide: {x: 96, y: 440, w: 888, h: 540}, medium: {x: 40, y: 410, w: 1000, h: 640}} as const;

const move = (t: number, at: number, before: FigurePose, after2: FigurePose) => (
  t < at ? {pose: before} : {pose: after2, fromPose: before, poseBlend: clamp01((t - at) / 0.35)}
);

export const TransferCallFilm: React.FC<FilmRenderProps> = ({board, shot, time_s, shot_s}) => {
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
  const room = (framing: 'wide' | 'medium', floorY = 1380, red = 0) => <ERRoom frame={frame} win={WIN[framing]} floorY={floorY} red={red} />;

  switch (shot.view) {
    case 'er-doors': {
      if (shot.scene_id === 's1') {
        // s1 wide: the ambulance swings in under the canopy, the back doors bang open, the gurney rolls out, the doctor runs out
        const d = since('s1-doors');
        const arrive = ease(clamp01(t / 1.0));
        const doors = after(d - 0.6, 0.35);
        const out = after(d - 0.5, 1.6);
        const lv = pop(since('s1-level'), 0.6, 1.5);
        const redOn = Math.floor(frame / 5) % 2 === 0;
        return svg(<g>
          <rect x={-60} y={-60} width={1200} height={2100} fill="#1b2050" opacity={0.32} />
          {/* the ER, a low brick building with a canopy and a sliding door */}
          <rect x={560} y={760} width={560} height={620} rx={30} fill="#b86a4a" stroke={line('#b86a4a')} strokeWidth={8} />
          {Array.from({length: 10}, (_, i) => <path key={i} d={`M560 ${800 + i * 58} H1120`} stroke={shade('#b86a4a', 0.25)} strokeWidth={3} opacity={0.5} />)}
          <rect x={640} y={1000} width={300} height={380} rx={20} fill="#9ed2ea" stroke={line('#9ed2ea')} strokeWidth={7} />
          <rect x={640 + 150 * after(d - 0.8, 0.4) * 0} y={1000} width={150 - 120 * after(d - 0.8, 0.4)} height={380} rx={14} fill="#bfe4f4" opacity={0.85} />
          <rect x={790 + 120 * after(d - 0.8, 0.4)} y={1000} width={150 - 120 * after(d - 0.8, 0.4)} height={380} rx={14} fill="#bfe4f4" opacity={0.85} />
          <path d="M520 940 H1120 L1120 990 H500 Z" fill="#e8e2d4" stroke={line('#e8e2d4')} strokeWidth={8} strokeLinejoin="round" />
          <rect x={560} y={990} width={22} height={390} fill="#d8d0c0" />
          <LitBox x={680} y={860} w={360} h={70} r={30} c="#e23b3b" />
          <Word x={860} y={912} t="EMERGENCY" size={46} c="#ffffff" />
          {lv > 0 && <g transform={`translate(790 ${lerp(600, 790, lv)}) rotate(${Math.sin(since('s1-level') * 7) * 6 * Math.exp(-since('s1-level') * 2)})`}>
            <path d="M-80 -110 V-40 M80 -110 V-40" stroke="#7d86a8" strokeWidth={6} />
            <rect x={-150} y={-44} width={300} height={90} rx={36} fill="#1d3b8a" stroke={line('#1d3b8a')} strokeWidth={7} />
            <text x={0} y={18} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={50} fill="#ffffff">LEVEL IV</text>
          </g>}
          <Ambulance x={lerp(-300, 330, arrive)} y={1250} s={0.85} frame={frame} doors={doors} facing={-1} roll={arrive} />
          {out > 0 && <Gurney x={lerp(420, 600, out)} y={1640} s={1.15} frame={frame} roll={out * 6} />}
          {out > 0 && person(MEDIC, lerp(180, 300, out), 1560, 1.05, {pose: 'reach'}, 'determined', 0.3, 7)}
          {person(DOC, lerp(1000, 760, after(d - 0.2, 2.6)), 1760, 1.75, move(d, 0.3, 'stand', 'reach'), d > 0.3 ? 'determined' : 'surprised', -0.6, 4, {walk: d > 0.2 && d < 2.8 ? t : undefined})}
          <Glow x={redOn ? 220 : 420} y={1000} r={420} color="#ff3b3b" opacity={0.45} />
          <rect x={-60} y={-60} width={1200} height={2100} fill="#ff2a2a" opacity={redOn ? 0.08 : 0.02} />
          <Burst x={480} y={1000} p={(d - 0.6) / 0.6} color="#ff6a5a" />
        </g>);
      }
      // s14 wide: the ambulance pulls away down the two-lane road, the doctor watches from the door
      const l = since('s14-leave');
      const go = ease(clamp01(Math.max(0, l) / 3.6));
      return svg(<g>
        <path d="M-100 1500 Q540 1180 760 1020 L860 1020 Q700 1220 1180 1500 Z" fill="#6f6a72" opacity={0.85} />
        <path d="M540 1500 Q700 1220 810 1020" stroke="#f7d36a" strokeWidth={10} strokeDasharray="40 36" fill="none" />
        <Ambulance x={lerp(560, 790, go)} y={lerp(1420, 1040, go)} s={lerp(0.9, 0.18, go)} frame={frame} facing={1} roll={go * 3} />
        <rect x={-40} y={760} width={360} height={760} rx={30} fill="#b86a4a" stroke={line('#b86a4a')} strokeWidth={8} />
        <rect x={60} y={1050} width={220} height={470} rx={18} fill="#2a3a5a" />
        <path d="M-60 980 H360 V1030 H-60 Z" fill="#e8e2d4" stroke={line('#e8e2d4')} strokeWidth={7} />
        {person(DOC, 180, 1580, 1.25, {pose: 'crossed'}, 'determined', 0.5, 4)}
      </g>);
    }
    case 'oncall-board': {
      // s1 close: the on call board by the door, the TRAUMA SURGEON slot flips to blank; the doctor glances at it
      const b = since('s1-board');
      const flip = after(b, 0.5);
      return svg(<g>
        <rect x={120} y={360} width={760} height={760} rx={40} fill="#2c3150" stroke={line('#2c3150')} strokeWidth={10} />
        <Word x={500} y={460} t="ON CALL TONIGHT" size={54} c="#fff4de" />
        {[['ER DOCTOR', 'ON SITE'], ['NURSE', 'ON SITE'], ['TRAUMA SURGEON', '']].map(([k, v], i) => (
          <g key={k} transform={`translate(180 ${560 + i * 170})`}>
            <rect x={0} y={0} width={640} height={130} rx={30} fill="#3a4166" />
            <text x={30} y={56} fontFamily={FONT.body} fontWeight={800} fontSize={38} fill="#cfd6f0">{k}</text>
            {i < 2 && <text x={30} y={106} fontFamily={FONT.body} fontWeight={900} fontSize={40} fill="#7dffb0">{v}</text>}
            {i === 2 && <g transform={`translate(320 92) scale(1 ${Math.abs(Math.cos(flip * Math.PI))})`}>
              <rect x={-290} y={-34} width={580} height={56} rx={16} fill={flip < 0.5 ? '#7dffb0' : '#4a5175'} />
              {flip >= 0.5 && <path d="M-200 -6 H200" stroke="#ff8a7a" strokeWidth={8} strokeDasharray="22 16" strokeLinecap="round" />}
            </g>}
          </g>
        ))}
        {flip > 0.5 && <Word x={500} y={1080} t="NONE" size={64} c="#ff8a7a" op={clamp01((flip - 0.5) * 4)} />}
        {person(DOC, 900, 1850, 2.0, b < 0 ? {pose: 'stand'} : move(b, 0.2, 'stand', 'think'), b > 0.3 ? 'worried' : 'neutral', -0.7, 4)}
        <Burst x={500} y={900} p={(b - 0.3) / 0.6} color="#ff8a7a" />
      </g>);
    }
    case 'doc-shift': {
      if (shot.scene_id === 's2') {
        // s2 medium: she listens to a coughing kid's chest; the whiteboard fills with STROKE, FLU, FLU, then a small red TRAUMA
        const f = since('s2-flu'), tr = since('s2-trauma');
        const cough = Math.max(0, Math.sin(t * 5)) * (t % 2.2 < 0.8 ? 1 : 0);
        return svg(<g>
          {room('medium', 1420)}
          <Whiteboard x={90} y={480} w={520} h={460} lines={[
            {t: 'STROKE', c: '#2a5bd7', size: 60, p: after(f, 0.6)},
            {t: 'PEDIATRIC FLU', c: '#2a5bd7', size: 52, p: after(f - 0.9, 0.6)},
            {t: 'trauma', c: '#e23b3b', size: 34, p: after(tr, 0.6)}]} />
          {/* the wall phone, quiet on its hook, cord coiled */}
          <WallPhone x={900} y={760} s={0.95} frame={frame} />
          {/* the kid on the exam bed */}
          <rect x={520} y={1290} width={400} height={90} rx={30} fill="#7fb7d8" stroke={line('#7fb7d8')} strokeWidth={6} />
          <rect x={540} y={1380} width={24} height={160} rx={10} fill="#9aa3bb" /><rect x={876} y={1380} width={24} height={160} rx={10} fill="#9aa3bb" />
          <g transform={`translate(760 ${1290 - cough * 8})`}>
            <Figure frame={frame} x={0} y={0} scale={0.62} {...castV2('resident')} skin="#e0a97e" hair="curly" hairColor="#3d2c1e" top="tee" shirt="#ffb347"
              glasses={false} pose="hold" emotion={cough > 0.4 ? 'worried' : 'neutral'} turn={-0.5} seed={2} build={0.3} />
          </g>
          {cough > 0.4 && <g opacity={cough}>{[0, 1, 2].map((k) => <circle key={k} cx={690 - k * 26} cy={1010 - k * 14} r={10 - k * 2} fill="#ffffff" opacity={0.7} />)}</g>}
          {person(DOC, 470, 1600, 1.35, tr >= 0 ? move(tr, 0.3, 'reach', 'think') : {pose: 'reach'}, tr > 0.3 ? 'worried' : 'happy', 0.5, 4)}
          <Burst x={250} y={900} p={(tr - 0.2) / 0.6} color="#ff6a5a" />
        </g>);
      }
      // s12 medium: she runs the ultrasound wand with one hand and taps the tablet with the other, then decides
      const j = since('s12-judge');
      const sweep = Math.sin(t * 2.2) * 40;
      return svg(<g>
        {room('medium', 1420)}
        <Gurney x={640} y={1560} s={1.25} frame={frame} />
        <Wand x={560 + sweep} y={1240} s={0.8} rot={-150} frame={frame} face={false} />
        <FlagTablet x={890} y={900} s={0.9} frame={frame} flag={1} rot={6} />
        <path d="M890 1010 V1300" stroke="#9aa3bb" strokeWidth={14} strokeLinecap="round" />
        {person(DOC, 330, 1620, 1.4, j >= 0 ? move(j, 0.6, 'reach', 'point') : {pose: 'reach'}, j > 0.6 ? 'proud' : 'thinking', 0.4, 4)}
        {j > 0.6 && <g transform={`translate(540 520) scale(${pop(j - 0.6, 0.4)})`}>
          <rect x={-200} y={-60} width={400} height={110} rx={50} fill="#2fb57a" stroke={line('#2fb57a')} strokeWidth={7} />
          <text x={0} y={18} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={50} fill="#ffffff">TRANSFER</text>
        </g>}
        <Burst x={540} y={520} p={(j - 0.6) / 0.6} color="#7dffb0" />
      </g>);
    }
    case 'whiteboard-close': {
      // s2 detail: the whiteboard fills the frame; a marker squeezes a small red "trauma" under STROKE, FLU, FLU
      const tr = since('s2-trauma');
      const wp = after(tr, 0.8);
      return svg(<g>
        <Whiteboard x={40} y={420} w={1000} h={720} lines={[
          {t: 'STROKE', c: '#2a5bd7', size: 110, p: 1}, {t: 'PEDIATRIC FLU', c: '#2a5bd7', size: 96, p: 1},
          {t: 'trauma', c: '#e23b3b', size: 56, p: wp}]} />
        <g transform={`translate(${130 + wp * 230} ${1040 + Math.sin(t * 9) * 6 * (wp < 1 ? 1 : 0)}) rotate(-30)`}>
          <rect x={-22} y={-200} width={44} height={200} rx={16} fill="#e23b3b" stroke={line('#e23b3b')} strokeWidth={5} />
          <rect x={-22} y={-240} width={44} height={50} rx={14} fill="#f4f6fb" />
          <path d="M-14 0 L0 26 L14 0 Z" fill="#7a1a1a" />
        </g>
        <Burst x={420} y={1000} p={(tr - 0.7) / 0.6} color="#ff6a5a" />
      </g>);
    }
    case 'phone-grab': {
      // s9 detail: her hand closes on the receiver and lifts it; the cord barely uncoils; the tablet's flag pulses behind
      const p = since('s9-push');
      const lift = after(p - 0.2, 0.5);
      const hand = {x: lerp(560, 520, lift), y: lerp(900, 640, lift)};
      return svg(<g>
        <FlagTablet x={280} y={560} s={1.0} frame={frame} flag={1} rot={-10} />
        <WallPhone x={620} y={980} s={2.0} frame={frame} off={lift} hand={hand} stretch={0} />
        <g transform={`translate(${hand.x + 70} ${hand.y + (lift > 0 ? 0 : -260 + 260 * after(p, 0.2))})`}>
          <ellipse cx={0} cy={0} rx={90} ry={70} fill={DOC.skin as string} stroke={line(DOC.skin as string)} strokeWidth={8} />
          {[0, 1, 2, 3].map((k) => <rect key={k} x={-80 + k * 40} y={-20} width={34} height={90} rx={16} fill={DOC.skin as string} stroke={line(DOC.skin as string)} strokeWidth={6} />)}
          <path d="M60 60 L180 300" stroke="#2b9aa3" strokeWidth={120} strokeLinecap="round" />
        </g>
        <Burst x={620} y={760} p={(p - 0.3) / 0.6} color="#ffb020" />
      </g>);
    }
    case 'badge-close': {
      // s13 close: the assistant badge beams a thin line down into a small ER tablet far below; seven tiny towers glow along the line
      const a = since('s13-ai');
      const up = pop(a, 0.5, 1.4);
      return svg(<g>
        <g transform={`translate(${540 + Math.sin(t * 1.3) * 40} ${lerp(900, 640, up) + Math.sin(t * 2) * 14}) scale(${0.6 + 0.6 * up + 0.05 * t})`}>
          <Glow x={0} y={0} r={260} color="#9ff0ff" opacity={0.6} />
          <circle r={170} fill="#1e2a4a" stroke="#9ff0ff" strokeWidth={14} />
          {[-1, 1].map((sd) => <ellipse key={sd} cx={sd * 56} cy={-14} rx={22} ry={(frame % 80) < 3 ? 3 : 30} fill="#38f2e0" />)}
          <path d="M-50 56 Q0 90 50 56" stroke="#38f2e0" strokeWidth={14} fill="none" strokeLinecap="round" />
        </g>
        {Array.from({length: 7}, (_, i) => {
          const x = 100 + i * 147, y = 1120 + Math.sin(i * 1.3) * 40;
          return <g key={i}><path d={`M540 ${lerp(900, 640, up) + 150} L${x} ${y - 140}`} stroke="#9ff0ff" strokeWidth={5} strokeDasharray="12 10"
            strokeDashoffset={-frame * 3} opacity={after(a - 0.4 - i * 0.45, 0.3)} />
            <MiniTower x={x} y={y} s={0.55} frame={frame} yes={after(a - 0.5 - i * 0.45, 0.3)} nod={a - 0.5 - i * 0.45 > 0 ? clamp01((a - 0.5 - i * 0.45) / 0.8) : 0} /></g>;
        })}
      </g>);
    }
    case 'level-sign': {
      // s1 close: looking up at the bay doors, the LEVEL IV sign swings down on its chains; the doctor below looks up at it
      const l = since('s1-level');
      const d = pop(l, 0.6, 1.5);
      return svg(<g>
        <rect x={-60} y={-60} width={1200} height={2100} fill="#1b2050" opacity={0.25} />
        <rect x={80} y={980} width={920} height={900} rx={30} fill="#b86a4a" stroke={line('#b86a4a')} strokeWidth={10} />
        <rect x={240} y={1150} width={600} height={760} rx={20} fill="#9ed2ea" stroke={line('#9ed2ea')} strokeWidth={8} />
        <path d="M30 940 H1050 V1010 H30 Z" fill="#e8e2d4" stroke={line('#e8e2d4')} strokeWidth={8} />
        <g transform={`translate(540 ${lerp(200, 640, d)}) rotate(${l < 0 ? 0 : Math.sin(l * 6) * 10 * Math.exp(-l * 1.6)})`}>
          <path d="M-200 -400 V-80 M200 -400 V-80" stroke="#7d86a8" strokeWidth={10} strokeDasharray="22 10" />
          <rect x={-300} y={-90} width={600} height={190} rx={60} fill="#1d3b8a" stroke={line('#1d3b8a')} strokeWidth={10} />
          <text x={0} y={42} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={110} fill="#ffffff">LEVEL IV</text>
        </g>
        {person(DOC, 300, 1960, 2.1, l >= 0 ? move(l, 0.3, 'stand', 'point') : {pose: 'stand'}, 'worried', 0.5, 4)}
        <Burst x={540} y={640} p={(l - 0.4) / 0.6} color="#9fe3ff" />
      </g>);
    }
    case 'top-shelf': {
      // s4 close, looking up: the 22 big Level I boxes light one by one on the top shelf; her hand stretches up and falls short
      const b = since('s4-22');
      const lit = 22 * after(b, 1.2);
      const reach = Math.sin(t * 4) * 20;
      return svg(<g>
        <rect x={-40} y={760} width={1160} height={30} rx={14} fill="#8a6f55" />
        <rect x={-40} y={592} width={1160} height={26} rx={12} fill="#8a6f55" />
        {Array.from({length: 11}, (_, i) => [0, 1].map((r) => {
          const k = r * 11 + i; return <HospBox key={k} x={70 + i * 95} y={r ? 590 : 758} s={r ? 1.0 : 1.25} big lit={k < lit ? 1 : 0} />;
        }))}
        <rect x={-40} y={1180} width={1160} height={24} rx={12} fill="#8a6f55" />
        {Array.from({length: 26}, (_, i) => <HospBox key={i} x={40 + i * 40} y={1178} s={0.9} />)}
        <g transform={`translate(${620} ${1500 + reach})`}>
          <path d="M0 400 L60 -40" stroke="#2b9aa3" strokeWidth={110} strokeLinecap="round" />
          <ellipse cx={70} cy={-90} rx={70} ry={58} fill={DOC.skin as string} stroke={line(DOC.skin as string)} strokeWidth={7} />
          {[0, 1, 2, 3].map((k) => <rect key={k} x={10 + k * 32} y={-190} width={28} height={84} rx={14} fill={DOC.skin as string} stroke={line(DOC.skin as string)} strokeWidth={5} />)}
        </g>
        <Word x={540} y={460} t="22 LEVEL I" size={80} c="#ffe36a" op={after(b - 0.3, 0.4)} />
      </g>);
    }
    case 'watch-close': {
      // s6 close: one row of ten gurneys; eight stay parked under red spinning clocks while two roll out the door; the paramedic checks his watch
      const e = since('s6-80');
      const go = after(e - 0.3, 1.8);
      return svg(<g>
        {room('medium', 900)}
        <rect x={960} y={480} width={160} height={430} rx={14} fill="#f4f6fb" opacity={0.8} />
        {Array.from({length: 10}, (_, i) => {
          const out = i >= 8;
          const x = 75 + i * 98 + (out ? go * (520 - (i - 8) * 80) : 0), y = 900;
          return <g key={i}><Gurney x={x} y={y} s={0.42} frame={frame} roll={out ? go * 6 : 0} blanket={out ? '#2fb57a' : '#5b8fe0'} />
            {!out && e >= 0 && <g transform={`translate(${x} ${y - 150}) scale(${pop(e - i * 0.05, 0.35)})`}><circle r={30} fill="#fff4de" stroke="#d8463a" strokeWidth={8} />
              <path d={`M0 0 V-17 M0 0 L${12 * Math.cos(frame / 5 + i)} ${12 * Math.sin(frame / 5 + i)}`} stroke="#2a2140" strokeWidth={5} strokeLinecap="round" /></g>}</g>;
        })}
        {e >= 0 && <g opacity={after(e - 0.6, 0.4)}>
          <rect x={60} y={930} width={780} height={16} rx={8} fill="#d8463a" />
          <rect x={850} y={930} width={200} height={16} rx={8} fill="#2fb57a" />
        </g>}
        {person(MEDIC, 820, 1700, 1.5, {pose: 'think'}, e >= 0 ? 'worried' : 'neutral', -0.5, 7)}
        <Word x={500} y={600} t="UP TO 80%" size={84} c="#ffe36a" op={after(e - 0.2, 0.4)} />
      </g>);
    }
    case 'flag-close': {
      // s7 close: the flag marked 45 stakes into the ruler's end and the kid at the front looks up at it
      const f = since('s7-45');
      const d = pop(f, 0.5, 1.3);
      return svg(<g>
        <rect x={-60} y={1500} width={1200} height={120} rx={30} fill="#f7c948" stroke={line('#f7c948')} strokeWidth={8} />
        <g transform={`translate(700 ${lerp(700, 1500, d)})`}>
          <path d="M0 0 V-800" stroke="#5a4a20" strokeWidth={22} strokeLinecap="round" />
          <path d={`M10 -800 Q190 ${-760 + Math.sin(frame / 6) * 18} 290 -690 Q190 ${-620 + Math.sin(frame / 6 + 1) * 18} 10 -580 Z`} fill="#e23b3b" stroke={line('#e23b3b')} strokeWidth={8} />
          <text x={130} y={-660} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={110} fill="#ffffff">45</text>
        </g>
        {person({...castV2('resident'), skin: '#c98c5e', hair: 'curly', hairColor: '#2b1f18', top: 'tee', shirt: '#ffb347', glasses: false, build: 0.3}, 300, 1540, 1.5,
          f >= 0 ? move(f, 0.3, 'stand', 'point') : {pose: 'stand'}, f >= 0 ? 'surprised' : 'happy', 0.7, 5)}
        <Burst x={700} y={1500} p={(f - 0.35) / 0.6} color="#ffe36a" />
      </g>);
    }
    case 'kid-close': {
      // s2 close: the stethoscope on the coughing kid's chest; the kid coughs, the doctor's face softens
      const f = since('s2-flu');
      const cough = Math.max(0, Math.sin(t * 5)) * ((t % 1.6) < 0.7 ? 1 : 0);
      return svg(<g>
        {room('medium', 1420)}
        <g transform={`translate(720 ${1900 - cough * 14})`}>
          <Figure frame={frame} x={0} y={0} scale={1.7} {...castV2('resident')} skin="#e0a97e" hair="curly" hairColor="#3d2c1e" top="tee" shirt="#ffb347"
            glasses={false} pose="hold" emotion={cough > 0.4 ? 'worried' : 'neutral'} turn={-0.5} seed={2} build={0.3} />
        </g>
        {cough > 0.4 && <g opacity={cough}>{[0, 1, 2].map((k) => <circle key={k} cx={600 - k * 40} cy={940 - k * 20} r={18 - k * 4} fill="#ffffff" opacity={0.75} />)}</g>}
        {person(DOC, 260, 1980, 2.1, {pose: 'reach'}, f > 1 ? 'happy' : 'thinking', 0.6, 4)}
        <path d={`M430 1150 Q560 ${1200 + Math.sin(t * 2) * 20} 690 1240`} stroke="#3a4166" strokeWidth={10} fill="none" strokeLinecap="round" />
        <circle cx={700} cy={1245 + Math.sin(t * 2) * 6} r={26} fill="#c7cede" stroke="#3a4166" strokeWidth={8} />
      </g>);
    }
    case 'flag-pulse': {
      // s9 detail: the tablet fills the frame; the amber flag pulses and a phone icon slides out of it toward the edge
      const f = since('s9-flag');
      const slide = after(t - 0.4, 1.2);
      return svg(<g>
        <FlagTablet x={540} y={860} s={2.6} frame={frame} flag={1} rot={-4} />
        <Glow x={770} y={640} r={300} color="#ffb020" opacity={0.35 + 0.25 * Math.sin(frame / 4)} />
        <g transform={`translate(${lerp(760, 960, slide)} ${lerp(700, 470, slide)}) scale(${0.6 + 0.6 * slide})`} opacity={slide}>
          <circle r={70} fill="#2fb57a" stroke="#ffffff" strokeWidth={8} />
          <path d="M-26 -30 Q-34 10 0 34 Q16 40 26 26 L14 12 Q4 18 -6 8 Q-14 -2 -10 -14 L-4 -26 Z" fill="#ffffff" />
        </g>
        <Burst x={770} y={640} p={(f - 0.2) / 0.6} color="#ffb020" />
      </g>);
    }
    case 'bay-clock': {
      // s3 close: the clock snaps awake, the red wedge drags behind the minute hand to 15, then sweats on to 30
      const c = since('s3-clock'), w = since('s3-wedge');
      const awake = c >= 0;
      const to = w < 0 ? lerp(0, 8, after(c, 2.4)) : w < 0.6 ? lerp(8, 15, after(w, 0.25)) : lerp(15, 30, after(w - 0.6, 0.35));
      const wedges: Wedge[] = [{from: 0, to, color: '#ff4a3d'}];
      return svg(<g>
        <rect x={-60} y={1250} width={1200} height={800} fill="#2b6f6c" opacity={0.85} />
        <WallClock x={540} y={800} r={360} frame={frame} mood={!awake ? 'asleep' : w >= 0 ? 'sweat' : 'alarmed'} wedges={wedges} hand={to}
          shake={w >= 0 ? 0.25 : 0} look={-0.4} />
        {w >= 0 && <g opacity={after(w - 0.6, 0.4)}>
          <Word x={300} y={580} t="15" size={90} c="#ffe36a" />
          <Word x={790} y={580} t="30" size={90} c="#ff8a7a" />
          <path d="M380 550 H700" stroke="#ffe36a" strokeWidth={10} strokeDasharray="20 16" strokeLinecap="round" />
        </g>}
        <Burst x={540} y={800} p={(c - 0.1) / 0.6} color="#ff6a5a" />
      </g>);
    }
    case 'doc-close': {
      if (shot.scene_id === 's3') {
        // s3 close: phone pinned in view, her hand hovers over the receiver still on its hook
        const h = since('s3-hover');
        const hov = Math.sin(t * 3) * 10;
        return svg(<g>
          <WallPhone x={760} y={760} s={1.6} frame={frame} />
          {person(DOC, 360, 2000, 2.3, {pose: 'reach'}, 'worried', 0.6, 4)}
          <g transform={`translate(${640 + hov} ${980 + hov * 0.4})`}>
            <ellipse cx={0} cy={0} rx={70} ry={54} fill={DOC.skin as string} stroke={line(DOC.skin as string)} strokeWidth={7} />
            {[0, 1, 2, 3].map((k) => <rect key={k} x={-56 + k * 30} y={-80} width={24} height={60} rx={12} fill={DOC.skin as string} stroke={line(DOC.skin as string)} strokeWidth={5} />)}
          </g>
          <Word x={300} y={500} t="?" size={160} c="#ffe36a" op={after(h, 0.4)} rot={-8} />
        </g>);
      }
      // s9 close: she glances at the flag and reaches for the phone at once, worry turning to resolve
      const p = since('s9-push');
      return svg(<g>
        <FlagTablet x={830} y={720} s={1.0} frame={frame} flag={1} rot={-8} />
        <WallPhone x={880} y={1180} s={1.0} frame={frame} off={after(p - 0.3, 0.5)} hand={{x: 620, y: 860}} stretch={0} />
        {person(DOC, 380, 2000, 2.3, p >= 0 ? move(p, 0.2, 'think', 'raise') : {pose: 'think'}, p >= 0 ? 'determined' : 'thinking', 0.5, 4)}
        <Burst x={700} y={900} p={(p - 0.3) / 0.6} color="#ffb020" />
      </g>);
    }
    case 'shelf-aisle': {
      // s4 wide wall: she pushes the gurney like a cart down an aisle; 173 small boxes fill the low shelves, 22 big ones light the top
      const a = since('s4-173'), b = since('s4-22');
      const nSmall = Math.round(173 * after(a, 1.6));
      const lit22 = after(b, 0.8);
      const walk = Math.min(1, t / 4);
      const small = Array.from({length: 173}, (_, i) => ({i, row: Math.floor(i / 25), col: i % 25}));
      return svg(<g>
        {Array.from({length: 7}, (_, r) => <rect key={r} x={30} y={1122 - r * 78} width={1020} height={14} rx={7} fill="#8a6f55" />)}
        <rect x={30} y={556} width={1020} height={20} rx={10} fill="#8a6f55" />
        {[30, 1034].map((x) => <rect key={x} x={x} y={556} width={16} height={600} rx={8} fill="#6e5843" />)}
        {small.filter((q) => q.i < nSmall).map((q) => <HospBox key={q.i} x={78 + q.col * 39} y={1120 - q.row * 78} s={1.0} />)}
        {Array.from({length: 22}, (_, i) => <HospBox key={i} x={84 + i * 43.5} y={554} s={0.58} big lit={lit22} />)}
        <Gurney x={lerp(240, 680, walk)} y={1770} s={1.3} frame={frame} roll={walk * 8} />
        {person(DOC, lerp(0, 330, walk), 1820, 1.9, b >= 0 ? move(b, 0.2, 'reach', 'raise') : {pose: 'reach'}, b >= 0 ? 'worried' : 'determined',
          b >= 0 ? -0.2 : 0.6, 4)}
        <Burst x={540} y={540} p={(b - 0.1) / 0.6} color="#ffe36a" />
      </g>);
    }
    case 'phone-wall': {
      if (shot.scene_id === 's5') {
        // s5 medium: she yanks the phone off its hook, the coiled cord springs straight across the room toward the door
        const ph = since('s5-phone');
        const off = after(ph, 0.35);
        const walk = after(ph - 0.4, 2.4);
        const hx = lerp(300, 120, walk);
        return svg(<g>
          {room('medium', 1420)}
          <rect x={-60} y={700} width={220} height={720} rx={20} fill="#2a3a5a" />
          <WallPhone x={880} y={820} s={1.0} frame={frame} off={off} hand={{x: hx + 120, y: 1010}} stretch={walk} />
          {person(DOC, hx, 1600, 1.35, ph >= 0 ? move(ph, 0, 'stand', 'raise') : {pose: 'stand'}, 'determined', -0.5, 4)}
          <Burst x={880} y={820} p={(ph - 0.1) / 0.6} color="#ffd24a" />
        </g>);
      }
      // s10 medium: she picks up early, the cord barely uncoils, the clock in the corner grins
      const c = since('s10-cord');
      const off = after(c, 0.35);
      return svg(<g>
        {room('medium', 1420)}
        <WallClock x={240} y={600} r={140} frame={frame} mood="grin" wedges={[{from: 0, to: 10, color: '#2a8bf0'}]} hand={10} />
        <WallPhone x={760} y={800} s={1.0} frame={frame} off={off} hand={{x: 600, y: 930}} stretch={0} />
        {person(DOC, 520, 1600, 1.35, c >= 0 ? move(c, 0, 'stand', 'raise') : {pose: 'stand'}, c >= 0 ? 'happy' : 'determined', 0.4, 4)}
        <Burst x={700} y={860} p={(c - 0.2) / 0.6} color="#7dffb0" />
      </g>);
    }
    case 'cord-out': {
      // s5 wide outdoors: the cord snakes out the ER door across the brush to far hospital towers, which shake their heads; the last nods yes
      const cs = since('s5-cord'), y = since('s5-yes');
      const reach = after(cs, 2.2);
      const towers = [{x: 470, y: 1060, s: 0.55}, {x: 690, y: 1000, s: 0.45}, {x: 880, y: 960, s: 0.38}, {x: 1000, y: 1120, s: 0.62}];
      return svg(<g>
        {/* a wall view: the brush country drawn as a plain map strip, the ER on the left and the far hospitals on the horizon */}
        <rect x={-40} y={900} width={1160} height={1100} fill="#e8c98a" />
        <path d="M-40 900 Q300 870 600 905 T1120 890" stroke="#c9a564" strokeWidth={10} fill="none" />
        {[[120, 980], [380, 950], [760, 990], [960, 940], [300, 1700], [820, 1650]].map(([bx, by], k) => <g key={k}>
          <ellipse cx={bx} cy={by} rx={60} ry={34} fill="#7f9a4a" stroke={line('#7f9a4a')} strokeWidth={5} />
          <ellipse cx={bx - 14} cy={by - 10} rx={20} ry={10} fill={light('#7f9a4a', 0.4)} /></g>)}

        <CordPath pts={[{x: 330, y: 960}, {x: 380, y: 1260}, {x: 520, y: 1400}, {x: 480, y: 1180}, {x: 640, y: 1110}, {x: 800, y: 1080}, {x: 920, y: 1150}, {x: 990, y: 1140}]}
          p={reach} frame={frame} w={12} />
        {towers.map((tw, i) => {
          const at = i / (towers.length - 1);
          const reached = reach > at * 0.95 && cs >= 0;
          const last = i === towers.length - 1;
          const shake = !last && reached ? clamp01((reach - at * 0.95) * 3) : 0;
          return <MiniTower key={i} x={tw.x} y={tw.y} s={tw.s * 2} frame={frame} shake={shake} yes={last && y >= 0 ? pop(y, 0.4) : 0}
            nod={last && y >= 0 ? clamp01(y / 0.9) : 0} c={!last && shake >= 1 ? '#b9b4ad' : '#e9e1d2'} />;
        })}
        {person(DOC, 210, 1900, 2.0, {pose: 'raise'}, y >= 0 ? 'happy' : cs >= 0 ? 'worried' : 'determined', 0.6, 4)}
        {(() => { const h = figureHands('raise'); const hx = 210 + h.r.x * 2.0, hy = 1900 + h.r.y * 2.0;
          return <g transform={`translate(${hx} ${hy}) rotate(-25)`}>
            <path d="M-10 -110 Q30 -110 30 -70 L30 70 Q30 110 -10 110" stroke={line('#efe2c4')} strokeWidth={48} fill="none" strokeLinecap="round" />
            <path d="M-10 -110 Q30 -110 30 -70 L30 70 Q30 110 -10 110" stroke="#efe2c4" strokeWidth={36} fill="none" strokeLinecap="round" />
            <rect x={-60} y={-140} width={66} height={70} rx={28} fill="#efe2c4" stroke={line('#efe2c4')} strokeWidth={6} />
            <rect x={-60} y={70} width={66} height={70} rx={28} fill="#efe2c4" stroke={line('#efe2c4')} strokeWidth={6} /></g>; })()}
        {y >= 0 && <g opacity={after(y - 0.3, 0.3)}>
          <Glow x={130} y={1480} r={140} color={Math.floor(frame / 5) % 2 ? '#ff3b3b' : '#3b6bff'} opacity={0.7} />
        </g>}
      </g>);
    }
    case 'ten-gurneys': {
      // s6 wide: ten gurneys line up under a hallway clock; eight stay parked while two roll out the door; the medic checks his watch
      const r = since('s6-row'), e = since('s6-80');
      const go = after(e, 2.4);
      return svg(<g>
        {room('wide', 1100)}
        <WallClock x={790} y={540} r={120} frame={frame} mood={e >= 0 ? 'stern' : 'calm'} hand={(time_s * 6) % 60} />
        <rect x={960} y={880} width={160} height={420} rx={14} fill="#f4f6fb" opacity={0.7} />
        {Array.from({length: 10}, (_, i) => {
          const row = Math.floor(i / 5), col = i % 5;
          const moving = i === 4 || i === 9;
          const enter = after(r - i * 0.32, 0.6);
          const x = 120 + col * 190 + (moving ? go * 400 : 0) + (1 - enter) * -600;
          const yy = 1330 + row * 260, sc = 0.62 + row * 0.12;
          return <g key={i}><Gurney x={x} y={yy} s={sc} frame={frame} roll={moving ? go * 8 : 0} dim={!moving && e >= 0 ? after(e, 0.6) * 0.5 : 0} />
            {!moving && e >= 0 && <g transform={`translate(${x} ${yy - 330 * sc}) scale(${pop(e - i * 0.06, 0.4)})`}><circle r={30} fill="#fff4de" stroke="#d8463a" strokeWidth={8} />
              <path d={`M0 0 V-18 M0 0 L${12 * Math.cos(frame / 8)} ${12 * Math.sin(frame / 8)}`} stroke="#2a2140" strokeWidth={5} strokeLinecap="round" /></g>}
            {moving && e >= 0 && <path d={`M${x + 120} ${yy - 120} l60 0 l-20 -20 M${x + 180} ${yy - 120} l-20 20`} stroke="#2fb57a" strokeWidth={10} strokeLinecap="round" fill="none" opacity={after(e, 0.4)} />}</g>;
        })}
        {person(MEDIC, lerp(1180, 920, after(r, 2.4)), 1560, 1.25, e >= 0 ? move(e, 0.3, 'stand', 'think') : {pose: 'stand'}, e >= 0 ? 'worried' : 'neutral', -0.4, 7, {walk: r >= 0 && r < 2.4 ? t : undefined})}
        {e >= 0 && <Word x={540} y={1060} t="UP TO 80%" size={80} c="#ffe36a" op={after(e - 0.2, 0.4)} />}
      </g>);
    }
    case 'clock-wrap': {
      // s6 detail wall: the hand spins twice around the face, a red ring lap by lap, past two hours
      const w = since('s6-wrap');
      const laps = w < 0 ? 0 : Math.min(2.25, w * 1.1);
      return svg(<g>
        <WallClock x={540} y={860} r={300} frame={frame} mood={laps > 1 ? 'sweat' : 'alarmed'} hand={(laps * 60) % 60} laps={laps}
          wedges={[{from: 0, to: 30, color: '#ff4a3d', op: 0.5}]} shake={laps > 2 ? 0.3 : 0} />
        <Word x={540} y={480} t={laps >= 2 ? 'MORE THAN 2 HOURS' : ''} size={66} c="#ffe36a" />
        <Burst x={540} y={860} p={(w - 1.8) / 0.6} color="#ff6a5a" />
      </g>);
    }
    case 'age-line': {
      // s7 wall: a ruler of ages with a kid, a teen, a young ranch hand and a mother on it from the first frame; a flag marked 45
      // stakes into the ruler's end and everyone turns to it
      const l = since('s7-line'), f = since('s7-45');
      const un = 0.35 + 0.65 * after(l, 0.9);
      const ppl: [Partial<FigureProps>, number, number, number][] = [
        [{...castV2('resident'), skin: '#c98c5e', hair: 'curly', hairColor: '#2b1f18', top: 'tee', shirt: '#ffb347', glasses: false, build: 0.3}, 0.6, 170, 5],
        [{...castV2('coder'), skin: '#f6d9c0', shirt: '#2fb5c9'}, 0.85, 360, 6],
        [{...castV2('hand')}, 1.0, 560, 8],
        [{...castV2('teacher')}, 1.0, 750, 9]];
      return svg(<g>
        <g transform={`translate(60 1500) scale(${un} 1)`}>
          <rect x={0} y={0} width={800} height={90} rx={30} fill="#f7c948" stroke={line('#f7c948')} strokeWidth={7} />
          {Array.from({length: 9}, (_, i) => <path key={i} d={`M${i * 100} 0 V40`} stroke="#5a4a20" strokeWidth={5} />)}
          <text x={14} y={74} fontFamily={FONT.body} fontWeight={800} fontSize={26} fill="#5a4a20">AGE</text>
        </g>
        {ppl.map(([who, sc, x, sd], i) => {
          const hop = Math.max(0, Math.sin((l - i * 0.25) * 4)) * 26 * Math.exp(-Math.max(0, l - i * 0.25) * 0.9);
          return <g key={i}>{person(who, x, 1500 - hop, sc * 1.45, f >= 0 ? move(f, 0.15 + i * 0.08, 'stand', 'point') : {pose: i % 2 ? 'wave' : 'stand'},
            f >= 0 ? 'surprised' : 'happy', f >= 0 ? 0.7 : 0, sd)}</g>;
        })}
        {f >= 0 && <g transform={`translate(880 ${lerp(900, 1500, pop(f, 0.5, 1.2))})`}>
          <path d="M0 0 V-440" stroke="#5a4a20" strokeWidth={12} strokeLinecap="round" />
          <path d={`M6 -440 Q100 ${-420 + Math.sin(frame / 6) * 10} 150 -385 Q100 ${-350 + Math.sin(frame / 6 + 1) * 10} 6 -330 Z`} fill="#e23b3b" stroke={line('#e23b3b')} strokeWidth={5} />
          <text x={66} y={-370} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={52} fill="#ffffff">45</text>
        </g>}
        <Burst x={880} y={1500} p={(f - 0.4) / 0.6} color="#ffe36a" />
      </g>);
    }
    case 'sa-window': {
      // s8 medium: a trauma surgeon walks into frame past a window onto San Antonio
      const s = since('s8-sa');
      const walk = after(s, 3.4);
      return svg(<g>
        <ERRoom frame={frame} win={WIN.medium} floorY={1420} wall="#4a5fa0" floor="#d9dce8" />
        <LitBox x={640} y={1180} w={360} h={240} r={28} c="#c79a6a" />
        <rect x={680} y={1120} width={180} height={70} rx={20} fill="#2c3150" />
        {person(SURGEON, lerp(-120, 420, walk), 1640, 1.45, walk < 1 ? {pose: 'stand'} : move(s - 3.4, 0, 'stand', 'point'), walk < 1 ? 'determined' : 'proud', walk < 1 ? 0.8 : 0.5, 6,
          {walk: walk < 1 ? t : undefined})}
        {walk >= 1 && <MapPinPop x={560} y={620} p={pop(s - 3.6, 0.5)} />}
      </g>);
    }
    case 'field-tent': {
      // s8 medium: the memory. A field tent, a helicopter shadow passes over, the same surgeon younger at work
      const a = since('s8-army');
      const sh = after(a, 1.6);
      return svg(<g>
        <rect x={-60} y={-60} width={1200} height={1600} fill="#e9c58e" />
        <circle cx={820} cy={380} r={110} fill="#fff1c4" opacity={0.9} />
        <path d="M-60 1100 Q300 1040 600 1080 T1140 1060 V1560 H-60 Z" fill="#d6a86a" />
        <path d="M-80 1500 L540 520 L1160 1500 Z" fill="#7b7a4e" stroke={line('#7b7a4e')} strokeWidth={10} strokeLinejoin="round" />
        <path d="M200 1500 L540 860 L880 1500 Z" fill="#3d3b28" opacity={0.9} />
        <path d="M540 520 L540 1500" stroke={shade('#7b7a4e', 0.3)} strokeWidth={8} />
        <rect x={-60} y={1500} width={1200} height={500} fill="#a8946a" />
        <Gurney x={720} y={1640} s={1.0} frame={frame} blanket="#6f8a52" />
        {person({...SURGEON, top: 'coveralls', shirt: '#6f7a4e', pants: '#6f7a4e', hat: 'cap', hatColor: '#5a6440'}, 360, 1630, 1.4, {pose: 'reach'}, 'determined', 0.6, 6)}
        <ellipse cx={lerp(-300, 1400, sh)} cy={1560} rx={260} ry={50} fill="#1b1430" opacity={0.3 * (a >= 0 ? 1 : 0)} />
        <g opacity={a >= 0 ? 0.35 : 0} transform={`translate(${lerp(-300, 1400, sh)} 380)`}>
          <ellipse rx={130} ry={50} fill="#2a2d3d" />
          <path d={`M${-220 * Math.cos(frame)} -60 L${220 * Math.cos(frame)} -60`} stroke="#2a2d3d" strokeWidth={10} />
        </g>
      </g>);
    }
    case 'sa-team': {
      // s8 wide: three researchers gather at a table; a banner drops; a statewide web of lines lights up behind them
      const tm = since('s8-team');
      const drop = pop(tm, 0.6, 1.3);
      const web = after(tm - 0.4, 1.6);
      const nodes = [{x: 220, y: 560}, {x: 420, y: 470}, {x: 640, y: 520}, {x: 860, y: 450}, {x: 330, y: 760}, {x: 560, y: 720}, {x: 800, y: 760}, {x: 680, y: 900}];
      return svg(<g>
        <ERRoom frame={frame} win={WIN.wide} floorY={1300} wall="#4a5fa0" floor="#d9dce8" />
        <g opacity={web}>
          {nodes.map((n, i) => nodes.slice(i + 1, i + 3).map((m, k) => <path key={`${i}-${k}`} d={`M${n.x} ${n.y} L${m.x} ${m.y}`} stroke="#9ff0ff" strokeWidth={6} opacity={0.8} />))}
          {nodes.map((n, i) => <circle key={i} cx={n.x} cy={n.y} r={16 + 4 * Math.sin(frame / 6 + i)} fill="#ffe36a" stroke="#b8860b" strokeWidth={4} />)}
        </g>
        {drop > 0 && <g transform={`translate(540 ${lerp(-100, 490, drop)})`}>
          <rect x={-300} y={-60} width={600} height={120} rx={50} fill="#e8743a" stroke={line('#e8743a')} strokeWidth={8} />
          <text x={0} y={22} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={60} fill="#ffffff">iRemedyACT</text>
        </g>}
        {person(RES1, 200, 1470, 1.05, tm >= 0 ? move(tm, 0.3, 'stand', 'point') : {pose: 'stand'}, 'excited', 0.5, 2)}
        {person(SURGEON, 540, 1490, 1.1, {pose: 'hips'}, tm >= 0 ? 'proud' : 'neutral', 0, 6)}
        {person(RES2, 880, 1470, 1.05, tm >= 0 ? move(tm, 0.5, 'stand', 'cheer') : {pose: 'stand'}, 'happy', -0.5, 3)}
        <LitBox x={120} y={1380} w={840} h={150} r={44} c="#c79a6a" />
        <FlagTablet x={540} y={1370} s={0.6} frame={frame} rot={-4} />
        <Burst x={540} y={490} p={(tm - 0.3) / 0.6} color="#ffd24a" />
      </g>);
    }
    case 'tablet-flag': {
      // s9 close: the bedside tablet, a small amber flag springs up and pulses; her face lit by it
      const f = since('s9-flag');
      const fl = pop(f, 0.5, 2.0);
      return svg(<g>
        {person(DOC, 330, 1950, 2.2, {pose: 'raise'}, f > 0.4 ? 'surprised' : 'thinking', 0.6, 4)}
        {(() => { const h = figureHands('raise'); const hx = 330 + h.r.x * 2.2, hy = 1950 + h.r.y * 2.2;
          return <FlagTablet x={hx + 120} y={hy - 60} s={1.3} frame={frame} flag={fl} rot={-8} />; })()}
        <Glow x={420} y={900} r={340} color="#ffb020" opacity={0.25 * fl} />
        <Burst x={560} y={760} p={(f - 0.2) / 0.6} color="#ffb020" />
      </g>);
    }
    case 'clock-pencil': {
      // s10 close wall: the red wedge shrinks, a pencil sketches a thin dashed 5 to 10 wedge, the clock grins
      const s = since('s10-small');
      const shrink = after(s - 0.2, 1.4);
      const pen = after(s - 0.3, 1.2);
      const tip = {x: 540 + Math.cos((pen * 10 / 60) * Math.PI * 2 - Math.PI / 2) * 260, y: 860 + Math.sin((pen * 10 / 60) * Math.PI * 2 - Math.PI / 2) * 260};
      return svg(<g>
        <WallClock x={540} y={860} r={320} frame={frame} mood={pen > 0.5 ? 'grin' : 'sweat'}
          wedges={[{from: 0, to: 30, color: '#ff4a3d', op: lerp(0.85, 0.55, shrink)}, {from: 0, to: 30, color: '#e23b3b', dashed: true}, ...(pen > 0 ? [{from: 0, to: 5 * clamp01(pen * 2), color: '#1d5bd0', op: 0.95}, ...(pen > 0.5 ? [{from: 5, to: 5 + 5 * clamp01(pen * 2 - 1), color: '#5aa8ff', op: 0.9}] : []), {from: 0, to: 10 * pen, color: '#1d3b8a', dashed: true}] : [])]}
          hand={10 * pen} />
        <Word x={600} y={1120} t="30" size={60} c="#ffffff" />
        {pen > 0.3 && <Word x={540 + Math.sin(Math.PI / 6) * 400} y={860 - Math.cos(Math.PI / 6) * 400 + 20} t="5" size={64} c="#9fe3ff" op={after(pen - 0.3, 0.2)} />}
        {pen > 0.8 && <Word x={540 + Math.sin(Math.PI / 3) * 410} y={860 - Math.cos(Math.PI / 3) * 410 + 20} t="10" size={64} c="#9fe3ff" op={after(pen - 0.8, 0.2)} />}
        {pen > 0 && pen < 1 && <g transform={`translate(${tip.x} ${tip.y}) rotate(35)`}>
          <rect x={-18} y={-260} width={36} height={240} rx={10} fill="#f7c948" stroke={line('#f7c948')} strokeWidth={5} />
          <path d="M-18 -20 L0 30 L18 -20 Z" fill="#f2d7b0" stroke={line('#f2d7b0')} strokeWidth={4} />
          <rect x={-18} y={-280} width={36} height={30} rx={8} fill="#ff8aa0" />
        </g>}
        
      </g>);
    }
    case 'night-road': {
      // s11 wide outdoors: the ambulance runs a long empty two-lane road, lights sweeping the brush
      const r = since('s11-road');
      const go = Math.max(0, r) / 6;
      return svg(<g>
        <path d="M480 980 L600 980 L1200 1980 L-120 1980 Z" fill="#5f5b66" opacity={0.92} />
        <path d="M540 980 L540 1980" stroke="#f7d36a" strokeWidth={12} strokeDasharray={`50 60`} strokeDashoffset={-frame * 12} />
        {[0, 1, 2, 3].map((k) => { const ph = ((go * 2 + k / 4) % 1); return <g key={k} transform={`translate(${lerp(560, 1100, ph)} ${lerp(990, 1600, ph)}) scale(${0.2 + ph})`}>
          <path d="M0 0 V-60" stroke="#e8e2d4" strokeWidth={8} /><rect x={-30} y={-90} width={60} height={34} rx={8} fill="#e8e2d4" /></g>; })}
        <Ambulance x={540} y={1460} s={0.85} frame={frame} facing={-1} roll={t} />
        <Glow x={300} y={1300} r={220} color="#ff4a4a" opacity={0.25 + 0.15 * Math.sin(frame / 3)} />
        
      </g>);
    }
    case 'cab-dash': {
      // s11 medium: inside the cab, the paramedic at the wheel squints as a road sign swings up stamped with a question mark
      const d = since('s11-dash');
      const sign = pop(d, 0.6, 1.4);
      return svg(<g>
        <path d="M60 420 H1020 Q1060 420 1060 470 L1060 1100 H20 L20 470 Q20 420 60 420 Z" fill="none" stroke="#2a2d3d" strokeWidth={70} strokeLinejoin="round" />
        {sign > 0 && <g transform={`translate(760 ${lerp(1200, 700, sign)}) rotate(${Math.sin(d * 6) * 6 * Math.exp(-d * 2)})`}>
          <path d="M0 0 V300" stroke="#9aa3bb" strokeWidth={14} />
          <rect x={-130} y={-130} width={260} height={260} rx={40} fill="#f7c948" stroke={line('#f7c948')} strokeWidth={8} transform="rotate(45)" />
          <text x={0} y={46} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={140} fill="#2a2140">?</text>
        </g>}
        {person(MEDIC, 340, 1850, 1.9, {pose: 'hold'}, d >= 0 ? 'thinking' : 'determined', 0.4, 7)}
        <rect x={-40} y={1460} width={1160} height={600} fill="#2a2d3d" />
        <path d="M-40 1460 Q540 1400 1120 1460" stroke="#3a3f55" strokeWidth={30} fill="none" />
        <g transform="translate(330 1420)">
          <circle r={190} fill="none" stroke="#1d2030" strokeWidth={40} />
          <path d="M-190 0 H190" stroke="#1d2030" strokeWidth={30} />
        </g>
        <g transform="translate(860 1560)">
          <WallClock x={0} y={0} r={90} frame={frame} mood="hope" wedges={[{from: 0, to: 10, color: '#2a5bd7', dashed: true}]} hand={10} />
        </g>
      </g>);
    }
    case 'toolbox': {
      // s12 detail: a supply tray; the AI tablet slots in beside an ultrasound wand that side-eyes it, and a stethoscope
      const d = since('s12-drawer');
      const drop = pop(d, 0.6, 1.5);
      return svg(<g transform="translate(0 -320)">
        <path d="M0 900 L1080 900 L1080 1700 L0 1700 Z" fill="#c7cede" stroke={line('#c7cede')} strokeWidth={10} />
        <rect x={60} y={960} width={960} height={680} rx={30} fill="#e9edf5" />
        <rect x={80} y={980} width={300} height={640} rx={24} fill="#d8dde8" />
        <rect x={400} y={980} width={600} height={300} rx={24} fill="#d8dde8" />
        <rect x={400} y={1300} width={600} height={320} rx={24} fill="#d8dde8" />
        <Wand x={230} y={1100} s={1.3} rot={0} look={drop > 0.3 ? 1 : 0} frame={frame} />
        {/* the stethoscope */}
        <g transform="translate(700 1460)">
          <path d="M-200 -60 Q-220 80 -60 90 Q80 100 120 -20" stroke="#3a4166" strokeWidth={16} fill="none" strokeLinecap="round" />
          <circle cx={130} cy={-40} r={46} fill="#c7cede" stroke="#3a4166" strokeWidth={10} />
          <path d="M-200 -60 L-240 -120 M-200 -60 L-150 -120" stroke="#3a4166" strokeWidth={12} strokeLinecap="round" />
        </g>
        <g transform={`translate(700 ${lerp(500, 1130, drop)})`}>
          <FlagTablet x={0} y={0} s={0.8} frame={frame} flag={0} face={1} rot={lerp(-20, 0, drop)} />
        </g>
        
        <Burst x={700} y={1130} p={(d - 0.5) / 0.6} color="#9ff0ff" />
      </g>);
    }
    case 'seven-sites': {
      // s13 wide outdoors in Bexar: seven hospital towers pop up in a row and light their windows one after another
      const s = since('s13-seven');
      return svg(<g>
        {Array.from({length: 7}, (_, i) => {
          const p = pop(s - i * 0.18, 0.5, 1.6);
          const x = 80 + i * 112, y = 1240 + (i % 2) * 50;
          return p > 0 ? <g key={i} transform={`translate(${x} ${y}) scale(1 ${p}) translate(${-x} ${-y})`}>
            <MiniTower x={x} y={y} s={0.95} frame={frame} yes={after(s - 0.8 - i * 0.15, 0.3)} /></g> : null;
        })}
        {(() => { const ai = since('s13-ai'); const up = pop(ai, 0.6, 1.4); if (up <= 0) return null;
          return <g>
            {Array.from({length: 7}, (_, i) => { const x = 80 + i * 112, y = 1240 + (i % 2) * 50 - 260;
              return <path key={i} d={`M420 820 L${x} ${y}`} stroke="#9ff0ff" strokeWidth={6} strokeDasharray="14 12" strokeDashoffset={-frame * 3}
                opacity={after(ai - 0.3 - i * 0.08, 0.3)} />; })}
            <g transform={`translate(420 ${lerp(1100, 780, up)}) scale(${up})`}>
              <Glow x={0} y={0} r={160} color="#9ff0ff" opacity={0.6} />
              <circle r={90} fill="#1e2a4a" stroke="#9ff0ff" strokeWidth={10} />
              {[-1, 1].map((sd) => <ellipse key={sd} cx={sd * 30} cy={-8} rx={12} ry={(frame % 80) < 3 ? 2 : 16} fill="#38f2e0" />)}
              <path d="M-26 30 Q0 48 26 30" stroke="#38f2e0" strokeWidth={8} fill="none" strokeLinecap="round" />
            </g>
          </g>; })()}
        {person(SURGEON, 880, 1820, 1.55, since('s13-ai') >= 0 ? move(since('s13-ai'), 0.2, 'wave', 'point') : s >= 0 ? move(s, 0.6, 'stand', 'wave') : {pose: 'stand'}, 'happy', -0.5, 6)}
        <Word x={420} y={560} t="BEACON" size={96} c="#ffe36a" op={after(s - 0.3, 0.4)} />
      </g>);
    }
    case 'pilot-tablet': {
      // s13 medium: the surgeon holds a tablet up; a paper tag swings on reading PILOT PLANNED in pencil
      const p = since('s13-pilot');
      const tag = pop(p, 0.6, 1.4);
      return svg(<g>
        {Array.from({length: 4}, (_, i) => <MiniTower key={i} x={150 + i * 260} y={1080} s={0.9} frame={frame} yes={1} dim={0.4} />)}
        {person(SURGEON, 480, 1880, 2.1, {pose: p >= 0 ? 'raise' : 'hold'}, p >= 0 ? 'happy' : 'thinking', 0.3, 6,
          {holding: p < 0 ? <FlagTablet x={0} y={-40} s={0.5} frame={frame} rot={8} face={1} /> : undefined})}
        {p >= 0 && <FlagTablet x={760} y={lerp(1050, 820, after(p, 0.5))} s={1.0} frame={frame} rot={8} face={1} />}
        {tag > 0 && <g transform={`translate(900 ${lerp(1150, 920, after(p, 0.5))}) rotate(${10 + Math.sin(p * 5) * 14 * Math.exp(-p * 1.5)}) scale(${tag})`}>
          <path d="M0 -60 V0" stroke="#8a7656" strokeWidth={5} />
          <rect x={-170} y={0} width={340} height={120} rx={22} fill="#f6e7c4" stroke="#8a7656" strokeWidth={6} />
          <text x={0} y={52} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={40} fill="#5a5e70">PILOT</text>
          <text x={0} y={98} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={40} fill="#5a5e70">PLANNED</text>
        </g>}
      </g>);
    }
    case 'phone-hook': {
      // s14 detail: the phone rattles on its hook, cord coiled short, while the ambulance's tail lights shrink down the road through the door
      const r = since('s14-ring');
      const ring = r >= 0 ? 1 : 0;
      return svg(<g>
        <path d="M-60 -60 H1140 V2000 H-60 Z M80 520 H500 V1500 H80 Z" fill="#3f8f8c" fillRule="evenodd" />
        <path d="M80 520 H500 V1500 H80 Z" fill="none" stroke="#e9edf5" strokeWidth={18} />
        <path d="M80 1500 L240 1080 L340 1080 L500 1500 Z" fill="#5f5b66" opacity={0.9} />
        <g opacity={0.9}>{[-1, 1].map((sd) => <circle key={sd} cx={290 + sd * 14 * (1 - t / 4)} cy={lerp(1260, 1110, clamp01(t / 4))} r={lerp(14, 4, clamp01(t / 4))} fill="#ff3b3b" />)}</g>
        <Glow x={290} y={lerp(1260, 1110, clamp01(t / 4))} r={60} color="#ff3b3b" opacity={0.5} />
        <WallPhone x={780} y={800} s={2.1} frame={frame} ring={ring} />
        <Burst x={780} y={700} p={(r - 0.1) / 0.6} color="#ffd24a" />
      </g>);
    }
    default:
      return svg(<g>{room('medium', 1420)}<WallClock x={540} y={760} r={260} frame={frame} mood="calm" />
        {person(DOC, 540, 1660, 1.3, {pose: 'stand'}, 'neutral', 0, 4)}</g>);
  }
};
