import React from 'react';
import {useCurrentFrame} from 'remotion';
import type {FilmRenderProps} from '../../../modern/types';
import {actionWindows, type DirectedScene} from '../../../lib/direction';
import {Figure, castV2, type FigureEmotion, type FigurePose, type FigureProps} from '../../../look/Figure';
import {Burst, ContactShadow, Glow, ScanBox, clamp01, ease, easeOutBack, lerp} from '../../../look/Kit';
import {Visor} from '../../../look/machines';
import {TabletV2} from '../../../look/machines';
import {line, light, shade} from '../../../look/color';
import {FONT} from '../../../lib/type';
import {Badge, Bubble, ClockRing, EdgeBox, EyeCam, FetchArm, HabWall, Hourglass, LabFloor, Locker, MedBag, Planet, Space, Tube, Word, after,
  eyeLens, fetchHand} from './parts';

/**
 * fetch-bag-1118 (November 18th, 2026): "The bag is already here". At NASA's Johnson Space Center in
 * Houston, Google Public Sector, the Johnson robotics team, NASA's Human Research Program and JPL built a
 * proof-of-concept robot that found and moved a medical bag 85 percent of the time in early lab tests.
 * Every fact is in claims.json. People are illustrative, from the v2 cast. The robot is drawn, not the rig.
 *
 * Hero: the fetch arm with its visor face, and its eye, a camera on a stand across the room.
 * Throughline: the red medical bag. Out of reach, a ghost in the simulator, gripped, dropped, opened by the
 * crew medical officer, open in the crew member's lap while Earth's reply is still on its way.
 */
const CREW: Partial<FigureProps> = {...castV2('technician'), top: 'coveralls', shirt: '#3d5fa8', pants: '#3d5fa8', trim: '#ffb347'};
const ENG: Partial<FigureProps> = {...castV2('engineer'), hat: 'none', top: 'polo', shirt: '#1f8f8a', trim: '#f4e8d0', pants: '#33405e'};
const CMO: Partial<FigureProps> = {...castV2('clinician'), hat: 'none'};

const move = (t: number, at: number, before: FigurePose, after2: FigurePose) => (
  t < at ? {pose: before} : {pose: after2, fromPose: before, poseBlend: clamp01((t - at) / 0.35)}
);

export const FetchBagFilm: React.FC<FilmRenderProps> = ({board, shot, time_s, shot_s}) => {
  const frame = useCurrentFrame();
  const W = actionWindows(board.scenes as DirectedScene[]);
  const since = (id: string) => (W[id] ? time_s - W[id].start : -1);
  const p = (id: string, dur = 0.7) => after(since(id), dur);
  const pb = (id: string, dur = 0.6, k = 1.6) => (since(id) < 0 ? 0 : easeOutBack(clamp01(since(id) / dur), k));
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
  const late = shot.scene_id === 's14';
  const WV: Record<string, string> = {'s2-a': 'plain', 's2-b': 'hull', 's3-a': 'plain', 's4-a': 'bench', 's4-b': 'plain', 's5-b': 'none', 's6-a': 'bench',
    's6-b': 'bay', 's7-a': 'bay', 's8-a': 'door', 's8-b': 'hull', 's9-b': 'bay', 's10-a': 'hull', 's10-b': 'hull', 's11-a': 'bay', 's11-b': 'door',
    's12-a': 'bay', 's12-b': 'hull', 's13-a': 'banner', 's13-b': 'plain'};
  const wv = WV[shot.id] ?? 'plain';

  switch (shot.view) {
    case 'mars-reach': {
      if (!late) {
        // s1: in the habitat, the crew member doubles over; a white gripper tip stretches in from the right toward the bag
        const w = p('s1-wince', 0.5);
        const reach = ease(clamp01(t / 3.2));
        const tipX = lerp(990, 880, reach), tipY = lerp(560, 690, reach);
        return svg(<g>
          <HabWall frame={frame} port={{x: 300, y: 560, r: 180}} />
          <Locker x={820} y={1520} s={1.0} />
          <MedBag x={820} y={800} s={0.62} rot={-4} />
          {/* the crew seat */}
          <rect x={120} y={1380} width={420} height={110} rx={50} fill="#5a6290" stroke={line('#5a6290')} strokeWidth={7} />
          <rect x={150} y={1060} width={110} height={360} rx={50} fill="#5a6290" stroke={line('#5a6290')} strokeWidth={7} />
          <g transform={`rotate(${lerp(0, -16, w)} 400 1640)`}>
            {person(CREW, 400, 1640, 1.4, move(since('s1-wince'), 0.4, 'raise', 'hips'), 'worried', 0.5, 5)}
          </g>
          {w > 0 && [0, 1, 2].map((k) => <path key={k} d={`M${300 + k * 40} ${1010 - k * 30} l18 -30`} stroke="#ff7a6a" strokeWidth={9} strokeLinecap="round"
            opacity={0.5 + 0.5 * Math.sin(frame / 4 + k)} />)}
          <Tube x1={1200} y1={tipY - 120} x2={tipX + 30} y2={tipY} w={64} c="#eef2f8" />
          <g transform={`translate(${tipX} ${tipY}) rotate(-70)`}>
            {[-1, 1].map((sd) => <path key={sd} d={`M${sd * 34} 10 L${sd * 34} 70 Q${sd * 34} 86 ${sd * 18} 88`} stroke="#dfe5f2" strokeWidth={16}
              strokeLinecap="round" fill="none" />)}
          </g>
        </g>);
      }
      // s14 close: the bag open in her lap, the robot's visor blinking back, the crew medical officer behind
      const here = since('s14-here');
      return svg(<g>
        <HabWall frame={frame} port={{x: 820, y: 560, r: 200}} />
        <Bubble x={lerp(760, 820, ease(t / 3.5))} y={500} s={0.38} t="REPLY" frame={frame} />
        {person(CMO, 760, 1500, 1.15, {pose: 'crossed'}, here >= 0 ? 'happy' : 'neutral', -0.4, 9)}
        <rect x={40} y={1450} width={560} height={120} rx={56} fill="#5a6290" stroke={line('#5a6290')} strokeWidth={7} />
        {person(CREW, 330, 1820, 2.0, here >= 0 ? move(here, 0, 'hold', 'cheer') : {pose: 'hold'}, 'happy', 0.3, 5,
          {holding: here < 0 ? <MedBag x={0} y={60} s={0.5} open={1} /> : undefined})}
        {here >= 0 && <MedBag x={330} y={1430} s={1.0} open={1} />}
        <g transform="translate(900 1120)">
          <rect x={-150} y={-110} width={300} height={200} rx={80} fill="#eef2f8" stroke={line('#eef2f8')} strokeWidth={8} />
          <Visor x={0} y={-6} w={230} h={110} mood={here >= 0 ? 'happy' : 'focused'} frame={frame} look={-0.8} />
        </g>
        <Burst x={420} y={1180} p={(here - 0.15) / 0.6} color="#ffd24a" />
      </g>);
    }
    case 'signal-trip': {
      if (!late) {
        // s1: the call leaves Mars and crawls toward a tiny Earth while a clock ring sweeps
        const c = since('s1-call');
        const u = c < 0 ? 0 : 0.04 + 0.08 * ease(c / 6);
        const bx = lerp(260, 820, u), by = lerp(1260, 600, u) - Math.sin(u * Math.PI) * 140;
        return svg(<g>
          <Space frame={frame} />
          <path d="M260 1260 Q600 760 820 600" stroke="#9ff0ff" strokeWidth={6} strokeDasharray="4 22" strokeLinecap="round" fill="none" opacity={0.7} />
          <Planet x={240} y={1300} r={190} kind="mars" frame={frame} />
          <Planet x={840} y={580} r={70} kind="earth" frame={frame} />
          <ClockRing x={840} y={580} r={140} p={since('s1-44') < 0 ? 0 : clamp01(since('s1-44') / 9) * 0.35} />
          {c >= 0 && <Bubble x={bx} y={by - 120} s={easeOutBack(clamp01(c / 0.5), 1.8)} t="HELP?" frame={frame} />}
          {since('s1-44') >= 0 && <Word x={840} y={820} t="UP TO 44 MIN" size={54} c="#ffd24a" op={clamp01(since('s1-44') * 3)} />}
          <Word x={240} y={1560} t="MARS" size={44} />
          <Word x={840} y={400} t="EARTH" size={40} />
        </g>);
      }
      // s14 extreme wide: Mars fills the frame, the reply bubble a dot partway home, the ring still sweeping
      const u = 0.42 + 0.2 * ease(t / 3.6);
      const bx = lerp(840, 520, u), by = lerp(420, 1180, u);
      return svg(<g>
        <Space frame={frame} />
        <Planet x={540} y={2050} r={860} kind="mars" frame={frame} />
        <Planet x={840} y={400} r={46} kind="earth" frame={frame} />
        <ClockRing x={840} y={400} r={100} p={0.4 + 0.25 * ease(t / 3.6)} />
        <g transform={`translate(${-40 * ease(t / 3.6)} 0)`}>{[0, 1, 2].map((k) => <ellipse key={k} cx={300 + k * 260} cy={1500 + k * 90} rx={160} ry={40} fill="#ffcf9a" opacity={0.25 + 0.1 * Math.sin(frame / 8 + k)} />)}</g>
        <path d="M840 420 Q760 900 540 1200" stroke="#9ff0ff" strokeWidth={6} strokeDasharray="4 22" strokeLinecap="round" fill="none" opacity={0.7} />
        <Bubble x={bx} y={by - 60} s={0.45} t="REPLY" frame={frame} />
        <Glow x={540} y={1240} r={120} color="#ffd24a" opacity={0.5 + 0.2 * Math.sin(frame / 6)} />
      </g>);
    }
    case 'pullback-lab': {
      // s2: pull back from the porthole. The habitat is a hull mockup on a lab floor, and a robot is reaching for the bag
      const pull = p('s2-pull', 1.4);
      const z = lerp(lerp(2.7, 2.4, ease(t / 2.5)), 1, pull);
      const sign = since('s2-jsc');
      const rb = since('s2-robot');
      const hand = fetchHand(860, 1560, 0.72, 140, 30, -1, 1);
      return svg(<g>
        <g transform={`translate(${lerp(330, 540, pull)} ${lerp(900, 760, pull)}) scale(${z}) translate(${-lerp(330, 540, pull)} ${-lerp(900, 760, pull)})`}>
          <LabFloor v={wv} frame={frame} y={1240} />
          {/* the hull mockup, cut open on its near side */}
          <path d="M-60 420 Q300 300 640 420 L640 1300 L-60 1300 Z" fill="#e8edf5" stroke={line('#e8edf5')} strokeWidth={10} />
          <path d="M-60 470 Q300 360 600 470" stroke="#ffffff" strokeWidth={10} fill="none" opacity={0.8} />
          <circle cx={300} cy={640} r={110} fill="#c9d0e0" stroke={line('#c9d0e0')} strokeWidth={6} />
          <clipPath id="pull-port"><circle cx={300} cy={640} r={88} /></clipPath><g clipPath="url(#pull-port)"><rect x={200} y={540} width={200} height={200} fill="#e98a5a" />
          <path d="M212 660 Q300 610 388 670 L388 728 L212 728 Z" fill="#9e3f25" />
          {pull > 0.5 && <path d="M332 556 l56 0 l0 56 Z" fill="#f4ead2" stroke="#b89a70" strokeWidth={4} opacity={clamp01((pull - 0.5) * 3)} />}</g>
          <rect x={60} y={1120} width={300} height={90} rx={44} fill="#5a6290" stroke={line('#5a6290')} strokeWidth={6} />
          {person(CREW, 210, 1290, 0.75, move(since('s2-pull'), 0.6, 'hips', 'shrug'), pull > 0.5 ? 'smug' : 'worried', 0.4, 5)}
          <Locker x={540} y={1300} s={0.62} />
          <MedBag x={540} y={880} s={0.4} />
          <FetchArm x={860} y={1560} s={0.72} frame={frame} facing={-1} sh={140 + (pull < 1 ? 14 * Math.sin(t * 5) * (1 - pull) : 0)} el={30} grip={0.1 + 0.4 * (0.5 + 0.5 * Math.sin(t * 5)) * (1 - pull)} mood={rb >= 0 ? 'happy' : 'sleepy'}
            wake={rb < 0 ? 0.55 : lerp(0.55, 1, easeOutBack(clamp01(rb / 0.7), 1.4))} look={-0.6} />
          {person(ENG, 980, 1700, 0.95, {pose: 'point'}, 'excited', -0.6, 11)}
        </g>
        {sign >= 0 && <g transform={`translate(560 ${lerp(-200, 560, easeOutBack(clamp01(sign / 0.6), 1.3))}) rotate(${Math.sin(sign * 6) * 8 * Math.exp(-sign * 1.5)})`}>
          <path d="M-180 -200 L-150 -40 M180 -200 L150 -40" stroke="#7d86a8" strokeWidth={6} />
          <rect x={-300} y={-50} width={600} height={120} rx={50} fill="#1d3b8a" stroke={line('#1d3b8a')} strokeWidth={8} />
          <text x={0} y={28} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={46} fill="#ffffff">JOHNSON SPACE CENTER</text>
        </g>}
        <Burst x={hand.x} y={hand.y} p={(rb - 0.2) / 0.6} color="#9ff0ff" />
      </g>);
    }
    case 'arm-wake': {
      if (shot.scene_id === 's4') {
        // s4 detail: the visor fills the frame, the bag reflected in it, the gripper below opening wide
        const f = since('s4-find');
        const open = f < 0 ? 0 : easeOutBack(clamp01(f / 0.5), 1.8);
        const g = 30 + open * 90;
        return svg(<g>
          <LabFloor v={wv} frame={frame} y={1500} />
          <rect x={60} y={420} width={960} height={720} rx={300} fill="#eef2f8" stroke={line('#eef2f8')} strokeWidth={12} />
          <Visor x={540} y={780} w={820} h={420} mood={f >= 0 ? 'surprised' : 'focused'} frame={frame} look={0.5} />
          <g opacity={0.45}><MedBag x={700} y={760} s={0.55} rot={6} /></g>
          <path d="M240 560 Q420 480 600 520" stroke="#ffffff" strokeWidth={22} strokeLinecap="round" fill="none" opacity={0.35} />
          <g transform="translate(540 1300)">
            <rect x={-130} y={-80} width={260} height={150} rx={60} fill="#3a4166" stroke={line('#3a4166')} strokeWidth={8} />
            {[-1, 1].map((sd) => <path key={sd} d={`M${sd * g} 50 L${sd * g} 210 Q${sd * g} 250 ${sd * (g - 40)} 254`} stroke="#dfe5f2" strokeWidth={44}
              strokeLinecap="round" fill="none" />)}
          </g>
          <Burst x={540} y={1460} p={(f - 0.1) / 0.6} color="#9ff0ff" />
        </g>);
      }
      // s2 close: the robot uncurls and its visor blinks open at the bag
      const rb = Math.max(0, since('s2-robot'));
      const wake = easeOutBack(clamp01(rb / 0.9), 1.3);
      return svg(<g>
        <LabFloor v={wv} frame={frame} y={1420} />
        <Locker x={930} y={1500} s={0.95} />
        <MedBag x={930} y={830} s={0.6} />
        <FetchArm x={380} y={1880} s={1.7} frame={frame} sh={lerp(20, 120, wake)} el={lerp(130, 10, wake)} grip={0.1} wake={lerp(0.4, 1, wake)}
          mood={rb < 0.3 ? 'sleepy' : rb < 1.2 ? 'surprised' : 'happy'} look={0.9} />
        <Burst x={380} y={1000} p={(rb - 0.2) / 0.6} color="#9ff0ff" />
      </g>);
    }
    case 'team-build': {
      // s3: three teams finish the robot, each a whole person at work. The engineer bolts the visor on from a step,
      // the technician snaps the orange cable into the shoulder, a third builder kneels and seats the base.
      const g = since('s3-google'), n = since('s3-nasa'), j = since('s3-jpl');
      const rise = j < 0 ? 0.75 : lerp(0.75, 1, easeOutBack(clamp01(j / 0.8), 1.4));
      const visorIn = g < 0 ? 0 : easeOutBack(clamp01(g / 0.5), 1.6);
      const patch = (x: number, y: number, t2: string, c: string, p2: number) => p2 <= 0 ? null : <g transform={`translate(${x} ${y}) scale(${easeOutBack(clamp01(p2 / 0.4), 2)})`}>
        <rect x={-80} y={-26} width={160} height={52} rx={24} fill={c} stroke={line(c)} strokeWidth={5} />
        <text x={0} y={10} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={26} fill="#ffffff">{t2}</text></g>;
      const BUILDER: Partial<FigureProps> = {...castV2('scientist'), hat: 'none'};
      return svg(<g>
        <LabFloor v={wv} frame={frame} y={1300} />
        <FetchArm x={540} y={1640} s={1.25} frame={frame} sh={60} el={50} grip={0.4} wake={rise} mood={visorIn < 0.6 ? 'sleepy' : j >= 0 ? 'happy' : 'focused'}
          look={0} glow={n >= 0 ? 1 : 0} />
        {/* the engineer on a step stool, reaching to the visor */}
        <rect x={110} y={1700} width={220} height={60} rx={20} fill="#f5c02c" stroke={line('#f5c02c')} strokeWidth={6} />
        {person(ENG, 220, 1700, 1.15, move(g, 0, 'stand', 'reach'), j >= 0 ? 'proud' : 'determined', 0.7, 11)}
        {patch(220, 900, 'GOOGLE', '#3b6fd1', g + 0.4)}
        {/* the technician at the right, cable in hand */}
        {n >= -0.3 && <path d={`M1140 1500 Q960 1460 ${lerp(860, 680, ease(clamp01((n + 0.3) / 0.5)))} 1150`} stroke="#ff8a3a" strokeWidth={18} fill="none"
          strokeLinecap="round" />}
        {person(CREW, 880, 1760, 1.15, move(n, 0, 'stand', 'reach'), n >= 0 ? 'happy' : 'thinking', -0.7, 5)}
        {patch(880, 960, 'JSC', '#d6453d', n + 0.4)}
        {/* the third builder kneels at the base */}
        {j >= -0.2 && <g transform={`translate(0 ${lerp(60, 0, ease(clamp01((j + 0.2) / 0.4)))})`}>
          {person(BUILDER, 640, 1900, 0.95, move(j, 0, 'stand', 'reach'), j >= 0.3 ? 'excited' : 'determined', -0.4, 7)}
        </g>}
        {patch(640, 1250, 'JPL', '#5b4bd6', j + 0.1)}
        <Burst x={540} y={1640 - 520 * 1.25} p={(g - 0.1) / 0.6} color="#9ff0ff" />
        <Burst x={660} y={1150} p={(n - 0.1) / 0.5} color="#ffb347" />
      </g>);
    }
    case 'task-card': {
      // s4 detail: the tablet flips up a task card with the bag drawn on it
      const c = pb('s4-card', 0.6, 1.4);
      return svg(<g>
        <LabFloor v={wv} frame={frame} y={1500} />
        {person(ENG, 170, 2300, 2.6, {pose: 'think'}, c > 0.5 ? 'surprised' : 'thinking', 0.7, 11)}
        <g transform={`translate(600 820) scale(1 ${Math.max(0.05, c)})`}>
          <TabletV2 x={0} y={0} scale={0.74} tilt={-6}>
            <g transform="translate(500 370) scale(1.9)">
              <text x={0} y={-150} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={34} fill="#3a2a6e">JOB ONE</text>
              <MedBag x={0} y={-20} s={0.5} />
              <text x={0} y={120} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={26} fill="#3a2a6e">LOCATE AND MOVE</text>
              <text x={0} y={154} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={26} fill="#3a2a6e">A MEDICAL BAG</text>
            </g>
          </TabletV2>
        </g>
        <Burst x={600} y={860} p={(since('s4-card') - 0.2) / 0.6} color="#ffd24a" />
      </g>);
    }
    case 'sim-ghost': {
      const grid = p('s5-grid', 1.2);
      const d = since('s5-drop');
      const room = (
        <g>
          <rect x={-60} y={-60} width={1200} height={2040} fill="#0f1a4a" />
          {Array.from({length: 14}, (_, i) => <path key={`v${i}`} d={`M${540 + (i - 7) * 60} 1000 L${540 + (i - 7) * 220} 1980`} stroke="#3aa0ff" strokeWidth={3}
            opacity={0.5} strokeDasharray="1400" strokeDashoffset={1400 * (1 - grid)} />)}
          {Array.from({length: 10}, (_, i) => { const yy = 1000 + Math.pow(i / 9, 1.8) * 980;
            return <path key={`h${i}`} d={`M-60 ${yy} L1140 ${yy}`} stroke="#3aa0ff" strokeWidth={3} opacity={0.5 * grid} />; })}
          <path d="M140 1000 L140 340 Q540 200 940 340 L940 1000" stroke="#9ff0ff" strokeWidth={5} fill="none" strokeDasharray="2400"
            strokeDashoffset={2400 * (1 - grid)} />
          <rect x={700} y={560} width={180} height={440} rx={20} stroke="#9ff0ff" strokeWidth={5} fill="none" opacity={grid} strokeDasharray="14 10" />
          <g opacity={0.55 * grid} style={{filter: 'hue-rotate(160deg) saturate(2)'}}>
            <FetchArm x={420} y={1500} s={0.9} frame={frame} sh={110 + 25 * Math.sin(frame / 10)} el={20} grip={0.5} mood="focused" look={0.6} />
          </g>
          {d >= 0 && [0, 1, 2, 3].map((k) => {
            const ph = ((d * 0.9 + k * 0.27) % 1);
            const y = lerp(640, 1420, ph * ph);
            return <MedBag key={k} ghost x={720 - k * 60} y={y} s={0.5} rot={ph * 90 * (k % 2 ? 1 : -1)} op={ph > 0.85 ? (1 - ph) * 6 : 1} />;
          })}
          {d < 0 && <MedBag ghost x={790} y={640} s={0.5} op={grid} />}
          {shot.framing === 'wide' && <Word x={540} y={500} t="DROPS COST NOTHING" size={44} c="#9ff0ff" op={d >= 0 ? clamp01(d * 2) : 0} />}
        </g>
      );
      if (shot.framing === 'wide') return svg(room);
      // s5 medium: the engineer watches the simulator on a big screen, chin in hand
      return svg(<g>
        <rect x={-60} y={-60} width={1200} height={2040} fill="#283058" />
        <LabFloor v={wv} frame={frame} y={1500} tint="#5a6290" />
        <g transform="translate(110 360) scale(0.8)">
          <rect x={-30} y={-30} width={1140} height={1360} rx={60} fill="#1a1f3a" stroke={line('#1a1f3a')} strokeWidth={10} />
          <clipPath id="sim-screen"><rect x={0} y={0} width={1080} height={1300} rx={40} /></clipPath>
          <g clipPath="url(#sim-screen)"><g transform="translate(0 -480)">{room}</g></g>
        </g>
        <Glow x={540} y={900} r={600} color="#3aa0ff" opacity={0.3} />
        {person(ENG, 280, 1900, 1.6, {pose: 'think'}, d >= 0 && (d % 1.2) < 0.4 ? 'surprised' : 'thinking', 0.4, 11)}
      </g>);
    }
    case 'brain-chip': {
      if (shot.framing === 'detail') {
        // s6 detail, low at robot height: a solid hourglass fills the frame, flips and drains in a blink
        const h = since('s6-hour');
        return svg(<g>
          <LabFloor v={wv} frame={frame} y={1300} />
          <Glow x={540} y={900} r={560} color="#ffd24a" opacity={0.45} />
          <rect x={160} y={1380} width={760} height={60} rx={28} fill="#8a6644" stroke={line('#8a6644')} strokeWidth={6} />
          <g style={{filter: 'saturate(1.4)'}}>
            <Hourglass x={540} y={960} s={2.2} p={h < 0 ? 0 : clamp01((h - 0.4) / 0.8)} flip={h < 0 ? 0 : clamp01(h / 0.4)} />
          </g>
          <Word x={540} y={470} t="2.5 HOURS" size={110} c="#ffd24a" op={h < 0 ? 0 : clamp01((h - 1.0) * 3)} />
          {person(ENG, 960, 2050, 1.9, {pose: 'raise'}, h >= 1.0 ? 'surprised' : 'thinking', -0.7, 11)}
          <Burst x={540} y={700} p={(h - 1.1) / 0.6} color="#ffd24a" />
        </g>);
      }
      // s6 close: the engineer, in frame, presses the glowing Pi0 chip into the robot's shoulder; the visor lights,
      // the maker's tag flips over above them
      const c = since('s6-chip'), m = since('s6-pi');
      const push = c < 0 ? 0 : easeOutBack(clamp01(c / 0.6), 1.4);
      const flip = m < 0 ? 0 : clamp01(m / 0.4);
      const lit = clamp01((c - 0.5) / 0.3);
      const shX = 330 + 96 * 1.4, shY = 1560 - 400 * 1.4;
      const chipX = lerp(700, shX, push), chipY = lerp(1080, shY, push);
      return svg(<g>
        <LabFloor v={wv} frame={frame} y={1300} />
        <FetchArm x={330} y={1560} s={1.4} frame={frame} sh={40} el={30} grip={0.3} chip={lit} mood={lit > 0.5 ? 'surprised' : 'sleepy'} look={0.7} glow={lit} />
        {person(ENG, 800, 1760, 1.45, {pose: 'reach'}, lit > 0.5 ? 'excited' : 'determined', -0.7, 11)}
        <Tube x1={760} y1={1180} x2={chipX + 40} y2={chipY + 10} w={40} c="#1f8f8a" />
        <circle cx={chipX + 34} cy={chipY + 8} r={30} fill="#c98a5a" stroke={line('#c98a5a')} strokeWidth={5} />
        <g transform={`translate(${chipX} ${chipY})`}>
          <rect x={-46} y={-46} width={92} height={92} rx={18} fill="#5b4bd6" stroke="#c8beff" strokeWidth={6} />
          <text x={0} y={14} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={36} fill="#ffffff">Pi0</text>
        </g>
        <g transform={`translate(700 560) scale(1 ${Math.max(0.06, Math.abs(Math.cos(flip * Math.PI)))})`}>
          <rect x={-260} y={-70} width={520} height={140} rx={50} fill={flip < 0.5 ? '#5b4bd6' : '#fff6e6'} stroke={line('#5b4bd6')} strokeWidth={8} />
          <text x={0} y={22} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={flip < 0.5 ? 64 : 40}
            fill={flip < 0.5 ? '#ffffff' : '#3a2a6e'}>{flip < 0.5 ? 'Pi0' : 'PHYSICAL INTELLIGENCE'}</text>
        </g>
        <Burst x={shX} y={shY} p={(c - 0.5) / 0.6} color="#c8beff" />
      </g>);
    }
    case 'chip-tag': {
      // s6 detail: the chip, huge in the socket, its tag flipping to the maker's name; the engineer's face at the edge, delighted
      const m = Math.max(0, since('s6-pi'));
      const flip = clamp01(m / 0.5);
      return svg(<g>
        <LabFloor v="bay" frame={frame} y={1700} />
        <circle cx={540} cy={900} r={420} fill="#eef2f8" stroke={line('#eef2f8')} strokeWidth={12} />
        <Glow x={540} y={900} r={380} color="#7dd8ff" opacity={0.55} />
        <rect x={340} y={700} width={400} height={400} rx={70} fill="#5b4bd6" stroke="#c8beff" strokeWidth={10} />
        <text x={540} y={940} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={140} fill="#ffffff">Pi0</text>
        <g transform={`translate(540 560) rotate(${Math.sin(m * 6) * 6 * Math.exp(-m * 2)}) scale(1 ${Math.max(0.06, Math.abs(Math.cos(flip * Math.PI)))})`}>
          <path d="M0 140 L0 60" stroke="#9aa3bd" strokeWidth={6} />
          <rect x={-300} y={-60} width={600} height={120} rx={44} fill={flip < 0.5 ? '#3a4166' : '#fff6e6'} stroke={line('#5b4bd6')} strokeWidth={8} />
          <text x={0} y={18} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={44} fill={flip < 0.5 ? '#ffffff' : '#3a2a6e'}>
            {flip < 0.5 ? 'OPEN MODEL' : 'PHYSICAL INTELLIGENCE'}</text>
        </g>
        {person(ENG, 900, 2150, 1.9, {pose: 'cheer'}, 'excited', -0.7, 11)}
        <Burst x={540} y={560} p={(m - 0.25) / 0.6} color="#ffd24a" />
      </g>);
    }
    case 'edge-shelf': {
      if (shot.framing === 'detail') {
        // s7 detail at shelf height: the technician's probe touches each box and it blinks on, row after row
        const test = Math.max(0, since('s7-test'));
        const at = Math.min(4.6, test * 2.2);
        const px = 130 + at * 190;
        return svg(<g>
          <LabFloor v="none" frame={frame} y={1500} />
          <rect x={-60} y={-60} width={1200} height={1560} fill="#e6e1f2" />
          <rect x={-60} y={1120} width={1200} height={50} rx={10} fill="#b88a5a" stroke={line('#b88a5a')} strokeWidth={6} />
          {[0, 1, 2, 3, 4].map((k) => <EdgeBox key={k} x={130 + k * 190} y={1120} w={170 - k * 12} frame={frame} on={at >= k ? 1 : 0}
            gauge={0.3 + 0.12 * k} />)}
          {person(CREW, Math.min(px - 300, 500), 1900, 1.35, {pose: 'reach'}, 'determined', 0.6, 5)}
          <Tube x1={Math.min(px - 300, 500) + 150} y1={1180} x2={px - 30} y2={1000} w={36} c="#3d5fa8" />
          <circle cx={px - 20} cy={990} r={30} fill="#6e4428" stroke={line('#6e4428')} strokeWidth={5} />
          <Tube x1={px - 10} y1={980} x2={px + 30} y2={1040} w={14} c="#ffd24a" />
          <circle cx={px + 34} cy={1046} r={10} fill="#ff5d5d" />
          <Burst x={px + 30} y={1050} p={(test * 2.2 % 1) * 1.2} color="#7dffb0" n={6} r={80} />
          {since('s7-pick') >= 0 && (() => { const q = easeOutBack(clamp01(since('s7-pick') / 0.5), 1.6); return <g transform={`translate(810 760) scale(${q})`}>
            <Glow x={0} y={0} r={240} color="#7dffb0" opacity={0.55} />
            <rect x={-150} y={-80} width={280} height={160} rx={36} fill="#2b2f4a" stroke="#7dffb0" strokeWidth={10} />
            <rect x={130} y={-34} width={34} height={68} rx={10} fill="#7dffb0" />
            <rect x={-126} y={-56} width={234 * (1 - 0.05 * clamp01(since('s7-pick') / 1.5))} height={112} rx={22} fill="#7dffb0" />
            <path d="M-20 -40 L-50 8 L-6 8 L-30 52 L40 -10 L0 -10 L22 -40 Z" fill="#2b2f4a" />
          </g>; })()}
        </g>);
      }
      // s7: about 15 small computers slide onto the shelves; the smallest lights while its gauge barely dips
      const b = Math.max(0, since('s7-boxes'));
      const pick = since('s7-pick');
      const test = since('s7-test');
      const sizes = Array.from({length: 15}, (_, i) => 220 - i * 9);
      const slot = (i: number) => ({x: 180 + (i % 5) * 180, y: [640, 960, 1280][Math.floor(i / 5)]});
      return svg(<g>
        <LabFloor v={wv} frame={frame} y={1300} />
        {[640, 960, 1280].map((sy) => <g key={sy}><rect x={60} y={sy} width={960} height={30} rx={14} fill="#b88a5a" stroke={line('#b88a5a')} strokeWidth={6} />
          <rect x={80} y={sy + 30} width={30} height={120} rx={10} fill="#8a6644" /><rect x={970} y={sy + 30} width={30} height={120} rx={10} fill="#8a6644" /></g>)}
        {sizes.map((w, i) => {
          const {x: x0, y: y0} = slot(i);
          const k = clamp01((b - i * 0.09) / 0.35);
          const smallest = i === 14;
          return <g key={i} transform={`translate(${lerp(1300, x0, easeOutBack(k, 1.3))} ${y0})`}>
            <EdgeBox x={0} y={0} w={w * 0.75} frame={frame} on={smallest && pick >= 0 ? clamp01(pick / 0.3) : (test >= 0 && Math.abs(test * 9 - i) < 1.2 ? 1 : 0)}
              gauge={smallest && pick >= 0 ? 1 - 0.06 * clamp01(pick / 1) : 0.4 + (i % 4) * 0.15} />
          </g>;
        })}
        {pick >= 0 && <ScanBox x={900 - 75} y={1280 - 120} w={150} h={130} lock={1} frame={frame} />}
        {person(CREW, 150, 1700, 1.5, pick >= 0 ? move(pick, 0, 'reach', 'point') : move(test, 0, 'think', 'reach'), pick >= 0 ? 'happy' : test >= 0 ? 'determined' : 'thinking', 0.5, 5)}
        <Burst x={900} y={1220} p={(pick - 0.2) / 0.6} color="#7dffb0" />
      </g>);
    }
    case 'eye-to-hand': {
      const e = since('s8-eye'), wtc = since('s8-watch');
      if (shot.framing === 'wide') {
        // s8 wide: the camera stands across the room from the robot; a dotted sightline runs to the gripper and locks
        const hand = fetchHand(820, 1760, 1.15, 95, 10, -1);
        const lens = eyeLens(190, 1760, 1.3, 8);
        const k = wtc < 0 ? 0 : ease(clamp01(wtc / 0.6));
        return svg(<g>
          <LabFloor v={wv} frame={frame} y={1220} />
          <EyeCam x={190} y={1760} s={1.3} frame={frame} open={e < 0 ? 0.1 : clamp01(e / 0.5)} aim={8} />
          <FetchArm x={820} y={1760} s={1.15} frame={frame} facing={-1} sh={95} el={10} grip={0.3} mood="focused" look={-0.6} />
          {person(ENG, 990, 1560, 0.95, move(wtc, 0, 'stand', 'point'), 'thinking', -0.6, 11)}
          {k > 0 && <path d={`M${lens.x} ${lens.y} L${lerp(lens.x, hand.x, k)} ${lerp(lens.y, hand.y, k)}`} stroke="#ffd24a" strokeWidth={8}
            strokeDasharray="6 18" strokeLinecap="round" />}
          {k >= 1 && <ScanBox x={hand.x - 80} y={hand.y - 60} w={160} h={160} lock={1} frame={frame} />}
          <Burst x={hand.x} y={hand.y} p={(wtc - 0.5) / 0.6} color="#ffd24a" />
        </g>);
      }
      // s8 close: the eye fills the left; the sightline runs across to a gripper at the right edge and locks
      const k = wtc < 0 ? 0 : ease(clamp01(wtc / 0.5));
      return svg(<g>
        <LabFloor v={wv} frame={frame} y={1500} />
        <EyeCam x={250} y={2050} s={1.65} frame={frame} open={1} aim={-6} />
        <Tube x1={1200} y1={980} x2={930} y2={1020} w={60} c="#eef2f8" />
        <g transform="translate(900 1030) rotate(-90)">
          <rect x={-46} y={-34} width={92} height={64} rx={24} fill="#3a4166" />
          {[-1, 1].map((sd) => <path key={sd} d={`M${sd * 30} 24 L${sd * 30} 90 Q${sd * 30} 106 ${sd * 14} 108`} stroke="#dfe5f2" strokeWidth={16}
            strokeLinecap="round" fill="none" />)}
        </g>
        {k > 0 && <path d={`M${250 + 1.65 * 150} ${2050 - 1.65 * 716} L${lerp(497, 830, k)} ${lerp(869, 1030, k)}`} stroke="#ffd24a" strokeWidth={10}
          strokeDasharray="6 20" strokeLinecap="round" />}
        {k >= 1 && <ScanBox x={760} y={940} w={190} h={190} lock={1} frame={frame} />}
        <Burst x={830} y={1030} p={(wtc - 0.4) / 0.6} color="#ffd24a" />
      </g>);
    }
    case 'orbit-rings': {
      if (shot.framing === 'wide') {
        // s9 wide: orbit rings spin around a small Earth with satellites riding them
        const o = 0.45 + 0.55 * p('s9-orbit', 0.8);
        return svg(<g>
          <Space frame={frame} />
          <Planet x={540} y={900} r={170} kind="earth" frame={frame} />
          {[0, 1, 2].map((k) => {
            const rx = 300 + k * 90, ry = 90 + k * 34, rot = -20 + k * 26;
            const a = frame / (20 + k * 8) + k;
            return <g key={k} transform={`translate(540 900) rotate(${rot}) scale(${o})`}>
              <ellipse cx={0} cy={0} rx={rx} ry={ry} stroke="#9ff0ff" strokeWidth={5} fill="none" opacity={0.75} />
              <g transform={`translate(${Math.cos(a) * rx} ${Math.sin(a) * ry})`}>
                <rect x={-26} y={-12} width={52} height={24} rx={8} fill="#ffd24a" />
                <rect x={-60} y={-8} width={28} height={16} rx={4} fill="#3b82f6" /><rect x={32} y={-8} width={28} height={16} rx={4} fill="#3b82f6" />
              </g>
            </g>;
          })}
          <Word x={540} y={500} t="BUILT FOR ORBIT" size={56} c="#9ff0ff" op={o} />
        </g>);
      }
      // s9 medium: the rings shrink into the lab and wrap the locker until they lock on the bag
      const r = since('s9-room');
      const k = r < 0 ? 0 : ease(clamp01(r / 1.0));
      return svg(<g>
        <LabFloor v={wv} frame={frame} y={1260} />
        <Locker x={720} y={1460} s={0.9} />
        <MedBag x={720} y={840} s={0.55} />
        {[0, 1, 2].map((i) => {
          const rx = lerp(900 + i * 120, 170 + i * 40, k), ry = lerp(300 + i * 40, 60 + i * 18, k);
          return <ellipse key={i} cx={720} cy={840} rx={rx} ry={ry} stroke="#9ff0ff" strokeWidth={6} fill="none" opacity={0.8}
            transform={`rotate(${-18 + i * 22 + (1 - k) * frame * 0.6} 720 840)`} />;
        })}
        {k >= 1 && <ScanBox x={600} y={740} w={240} h={190} lock={1} frame={frame} />}
        <FetchArm x={300} y={1700} s={1.0} frame={frame} sh={70} el={30} grip={0.3} mood={k >= 1 ? 'happy' : 'focused'} look={0.8} />
        {person(CREW, 980, 1820, 1.15, r >= 0 ? move(r, 0.1, 'stand', 'raise') : {pose: 'stand'}, r >= 0 ? 'happy' : 'surprised', -0.5, 5)}
        <Burst x={720} y={840} p={(r - 0.9) / 0.6} color="#9ff0ff" />
      </g>);
    }
    case 'grip-lift': {
      if (shot.framing === 'medium') {
        // s10: the arm grips the bag off the shelf, lifts and swings it over to the crew seat
        const g = Math.max(0, since('s10-grip'));
        const sw = ease(clamp01((g - 0.6) / 1.6));
        const sh = lerp(150, 215, sw), el = lerp(10, -10, sw);
        const hand = fetchHand(560, 1620, 0.9, sh, el, -1);
        return svg(<g>
          <LabFloor v={wv} frame={frame} y={1240} />
          <Locker x={190} y={1420} s={0.85} />
          <rect x={760} y={1380} width={300} height={90} rx={44} fill="#5a6290" stroke={line('#5a6290')} strokeWidth={6} />
          {person(CREW, 920, 1400, 0.95, {pose: 'hold'}, sw > 0.9 ? 'happy' : 'thinking', -0.5, 5)}
          <FetchArm x={560} y={1620} s={0.9} frame={frame} facing={-1} sh={sh} el={el} grip={clamp01(g / 0.5)} mood="focused" look={sw > 0.5 ? 0.6 : -0.6} />
          <MedBag x={hand.x} y={hand.y + 70} s={0.5} rot={Math.sin(g * 5) * 10 * (1 - sw * 0.5)} />
          {person(ENG, 170, 1900, 1.5, {pose: 'crossed'}, sw > 0.95 ? 'excited' : 'worried', 0.5, 11)}
          {[0, 1, 2].map((k) => <path key={k} d={`M${hand.x + 40 + k * 20} ${hand.y + 30} q20 20 0 40`} stroke="#ffffff" strokeWidth={6} fill="none"
            opacity={sw > 0 && sw < 1 ? 0.6 - k * 0.15 : 0} />)}
        </g>);
      }
      // s10 close: runs fan out behind the arm, most bags landing red, a few flopping grey, and the ring fills to 85
      const c = since('s10-85');
      const VALUE = 85;
      const fill = c < 0 ? 0 : clamp01(c / 1.0) * VALUE / 100;
      const shown = VALUE;
      return svg(<g>
        <LabFloor v={wv} frame={frame} y={1300} />
        {Array.from({length: 9}, (_, i) => {
          const miss = i === 2 || i === 6;
          const k = c < 0 ? 0 : clamp01((c - i * 0.08) / 0.5);
          const x0 = 330, x1 = 420 + i * 72, yEnd = miss ? 1130 : 1020;
          return <g key={i} opacity={k}>
            <path d={`M${x0} 760 Q${(x0 + x1) / 2} ${560 - i * 16} ${x1} ${yEnd - 40}`} stroke={miss ? '#9aa3bd' : '#ff8a8a'} strokeWidth={5}
              strokeDasharray="8 14" fill="none" />
            <g style={{filter: miss ? 'grayscale(1) brightness(1.2)' : undefined}}><MedBag x={x1} y={yEnd - 20} s={0.32} rot={miss ? 80 : 0} /></g>
          </g>;
        })}
        <g transform="translate(780 640) scale(0.8)">
          <circle r={230} fill="#2b2156" opacity={0.85} />
          <circle r={190} stroke="#ffffff" strokeOpacity={0.2} strokeWidth={36} fill="none" />
          {fill > 0 && <path d={`M0 -190 A190 190 0 ${fill > 0.5 ? 1 : 0} 1 ${Math.sin(fill * 2 * Math.PI) * 190} ${-Math.cos(fill * 2 * Math.PI) * 190}`}
            stroke="#ff5d6c" strokeWidth={36} fill="none" strokeLinecap="round" />}
          <text x={0} y={40} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={124} fill="#ffffff"
            transform={`scale(${c < 0 ? 0 : easeOutBack(clamp01(c / 0.5), 2)})`}>{shown}%</text>
        </g>
        <FetchArm x={200} y={1960} s={1.35} frame={frame} sh={95 + 8 * Math.sin(t * 3)} el={-20} grip={1} mood="happy" look={0.6}>
          <MedBag x={0} y={10} s={0.55} rot={Math.sin(t * 3) * 8} />
        </FetchArm>
        {person(ENG, 900, 1720, 1.5, move(c, 1.0, 'crossed', 'cheer'), c >= 1.0 ? 'excited' : 'thinking', -0.5, 11)}
        <Burst x={980} y={520} p={(c - 1.0) / 0.6} color="#ffd24a" />
      </g>);
    }
    case 'drop': {
      const m = since('s11-miss');
      if (shot.framing === 'medium') {
        // s11: the bag slips out of the gripper and flops onto the floor; the engineer winces, the visor droops
        const fall = m < 0 ? 0 : clamp01((m - 0.2) / 0.5);
        const hand = fetchHand(620, 1600, 0.95, 120, 20, -1);
        const y = lerp(hand.y + 70, 1520, fall * fall);
        const land = m - 0.7;
        return svg(<g>
          <LabFloor v={wv} frame={frame} y={1240} />
          <FetchArm x={620} y={1600} s={0.95} frame={frame} facing={-1} sh={120} el={20} grip={m < 0.2 ? 1 : 0.1} mood={land > 0 ? 'worried' : 'focused'}
            droop={land > 0 ? clamp01(land / 0.4) : 0} look={0.4} />
          <MedBag x={hand.x - fall * 60} y={y} s={0.55} rot={fall * 80} squash={land > 0 ? Math.exp(-land * 6) : 0} />
          {person(ENG, 200, 1880, 1.5, move(land, 0, 'stand', 'panic'), land > 0 ? 'worried' : 'thinking', 0.5, 11)}
          <Burst x={hand.x - 60} y={1540} p={land / 0.5} color="#c9d0e0" />
        </g>);
      }
      // s11 close: a sticky note slaps onto the robot's head. Proof of concept
      const nt = since('s11-note');
      return svg(<g>
        <LabFloor v={wv} frame={frame} y={1500} />
        <MedBag x={820} y={1600} s={0.7} rot={80} />
        <FetchArm x={560} y={2000} s={1.9} frame={frame} sh={40} el={30} grip={0.1} mood="worried" droop={0.8} note={nt < 0 ? 0 : clamp01(nt / 0.3)} look={0.3} />
        {person(ENG, 110, 2140, 1.9, {pose: 'think'}, 'thinking', 0.6, 11)}
        <Burst x={510} y={760} p={(nt - 0.05) / 0.5} color="#ffe36a" />
      </g>);
    }
    case 'rocket-ghost': {
      // s11: a rocket window with a dashed robot outline that flickers and stays empty
      const g = Math.max(0, since('s11-ghost'));
      const fl = 0.35 + 0.35 * Math.abs(Math.sin(frame / 3.5));
      return svg(<g>
        <Space frame={frame} />
        <g transform={`translate(540 ${960 - 10 * Math.sin(frame / 20)})`}>
          <path d="M0 -620 Q240 -380 240 120 L240 520 L-240 520 L-240 120 Q-240 -380 0 -620 Z" fill="#eef2f8" stroke={line('#eef2f8')} strokeWidth={10} />
          <path d="M-240 300 L-420 560 L-240 520 Z M240 300 L420 560 L240 520 Z" fill="#d6453d" stroke={line('#d6453d')} strokeWidth={8} />
          <circle cx={0} cy={-80} r={170} fill="#1a1452" stroke="#9aa3bd" strokeWidth={18} />
          <g opacity={fl}>
            <rect x={-60} y={-180} width={120} height={80} rx={34} fill="none" stroke="#9ff0ff" strokeWidth={6} strokeDasharray="12 10" />
            <path d="M0 -100 L0 40 M0 -60 L80 -10" stroke="#9ff0ff" strokeWidth={6} strokeDasharray="12 10" fill="none" />
            <rect x={-70} y={40} width={140} height={40} rx={18} fill="none" stroke="#9ff0ff" strokeWidth={6} strokeDasharray="12 10" />
          </g>
          <path d="M-120 520 Q0 760 120 520" fill="#ffb347" opacity={0.6 + 0.3 * Math.sin(frame / 2)} />
        </g>
        <Word x={540} y={1660} t="SPACE READY? NOT CONFIRMED" size={46} c="#ffe36a" op={clamp01(g * 2)} />
      </g>);
    }
    case 'ultrasound': {
      const v = since('s12-voice'), u = since('s12-us');
      const roll = u < 0 ? 0 : ease(clamp01(u / 1.0));
      const cart = (x: number, y: number, s: number) => (
        <g transform={`translate(${x} ${y}) scale(${s})`} opacity={0.95}>
          <rect x={-90} y={-360} width={180} height={130} rx={24} fill="#9ff0ff" fillOpacity={0.25} stroke="#9ff0ff" strokeWidth={6} strokeDasharray="14 10" />
          <path d="M0 -230 L0 -40 M-80 -40 L80 -40" stroke="#9ff0ff" strokeWidth={6} strokeDasharray="14 10" />
          <circle cx={-60} cy={-10} r={22} fill="none" stroke="#9ff0ff" strokeWidth={6} strokeDasharray="8 8" />
          <circle cx={60} cy={-10} r={22} fill="none" stroke="#9ff0ff" strokeWidth={6} strokeDasharray="8 8" />
        </g>
      );
      if (shot.framing !== 'close') {
        // s12 wide, low at floor level: the technician sweeps a hand to an empty taped spot; a dashed ultrasound cart rolls in, an outline only
        const goal = since('s12-goal');
        return svg(<g>
          <LabFloor v={wv} frame={frame} y={1180} />
          <path d="M520 1640 L1060 1640 L1160 1960 L420 1960 Z" stroke="#f5c02c" strokeWidth={12} strokeDasharray="26 18" fill="none" />
          {person(CREW, 230, 1500, 1.0, move(goal, 0, 'stand', 'point'), 'happy', 0.6, 5)}
          <FetchArm x={760} y={1380} s={0.6} frame={frame} facing={-1} sh={100} el={30} grip={0.3} mood={u >= 0 ? 'happy' : 'focused'} look={0.8} />
          {cart(lerp(1400, 790, roll), 1880, 1.9)}
        </g>);
      }
      // s12 close: she talks with her hands, a sound wave ripples to the robot, and it nods
      const nod = v < 0 ? 0 : Math.max(0, Math.sin(v * 7)) * Math.exp(-v * 0.8);
      return svg(<g>
        <LabFloor v={wv} frame={frame} y={1500} />
        {cart(880, 1700, 0.9)}
        <FetchArm x={820} y={2050} s={1.5} frame={frame} facing={-1} sh={60} el={30} grip={0.3} mood={v >= 0 ? 'happy' : 'focused'} nod={nod} look={-0.7} />
        {person(CREW, 250, 1880, 2.0, v >= 0 ? move(v, 0, 'stand', 'shrug') : {pose: 'stand'}, v >= 0 ? 'excited' : 'happy', 0.6, 5)}
        {v >= 0 && [0, 1, 2, 3].map((k) => { const ph = ((v * 1.2 + k * 0.25) % 1);
          return <path key={k} d={`M${lerp(380, 700, ph)} ${860 - 70} q30 70 0 140`} stroke="#ffd24a" strokeWidth={10} fill="none" strokeLinecap="round"
            opacity={1 - ph} />; })}
      </g>);
    }
    case 'crew-opens': {
      const o = since('s13-open'), f = since('s13-fold');
      if (shot.framing === 'medium') {
        // s13: the robot sets the bag down and folds back; the crew medical officer opens it and decides
        const fold = f < 0 ? 0 : ease(clamp01(f / 1.0));
        return svg(<g>
          <LabFloor v={wv} frame={frame} y={1240} />
          <FetchArm x={230} y={1580} s={0.85} frame={frame} sh={lerp(100, 20, fold)} el={lerp(20, 140, fold)} grip={0.1} mood={fold > 0.8 ? 'sleepy' : 'happy'}
            wake={lerp(1, 0.6, fold)} look={0.6} />
          <rect x={780} y={1380} width={280} height={90} rx={44} fill="#5a6290" stroke={line('#5a6290')} strokeWidth={6} />
          {person(CREW, 930, 1400, 0.95, {pose: 'hips'}, 'worried', -0.5, 5)}
          {person(CMO, 600, 1740, 1.4, o >= 0 ? move(o, 0, 'stand', 'hold') : {pose: 'stand'}, o >= 0 ? 'determined' : 'thinking', 0, 9,
            {holding: o >= 0 ? <MedBag x={0} y={80} s={0.42} open={clamp01(o / 0.6)} /> : undefined})}
          {o < 0 && <MedBag x={470} y={1660} s={0.5} />}
        </g>);
      }
      // s13 detail: two gloved hands from below unzip the bag and lift the scanner out
      const k = o < 0 ? 0.75 : 0.75 + 0.25 * clamp01(o / 0.4);
      return svg(<g>
        <LabFloor v={wv} frame={frame} y={1100} tint="#7d86a8" />
        <Figure frame={frame} x={540} y={2020} scale={2.3} {...CMO} pose="hold" emotion={k > 0.7 ? 'proud' : 'neutral'} turn={0} seed={9} />
        <MedBag x={540} y={1640} s={1.5} open={k} />
        <Burst x={540} y={700} p={(o - 0.5) / 0.6} color="#7dffb0" />
      </g>);
    }
    default:
      return svg(<g><LabFloor v={wv} frame={frame} y={1240} /><FetchArm x={540} y={1600} s={1} frame={frame} sh={90} el={20} mood="happy" />
        <MedBag x={760} y={1500} s={0.5} /></g>);
  }
};
