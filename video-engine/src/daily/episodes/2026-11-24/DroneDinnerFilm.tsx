import React from 'react';
import {useCurrentFrame} from 'remotion';
import type {FilmRenderProps} from '../../../modern/types';
import {actionWindows, type DirectedScene} from '../../../lib/direction';
import {Figure, castV2, type FigureEmotion, type FigurePose, type FigureProps} from '../../../look/Figure';
import {Burst, ContactShadow, Glow, clamp01, ease, lerp} from '../../../look/Kit';
import {line, shade} from '../../../look/color';
import {DogV2} from '../../../look/props';
import {Pine} from '../../../look/regions';
import {BrickRanchV2} from '../../../look/shelf/homeplace';
import {
  Console, Counter, FoodBag, HeightBar, LitBox, OrderScreen, Phone, Plane, Pod, RadiusMap, Rain, Rings, Scale, WindLines, Word,
  Zip, after, pop,
} from './parts';

/**
 * drone-dinner-1124 (November 24th, 2026): "Dinner refuses to land". On Tuesday, November 17th, Uber Eats customers in
 * Spring, in Harris County north of Houston, became the first in the country to get food by Zipline drone. The drone
 * cruises at about 300 feet, hovers high over the yard and lowers the order in a pod on a tether. Every fact is in
 * claims.json.
 *
 * Hero: the delivery drone with a visor face and its orange pod. Throughline: the paper sack, a picture on the phone,
 * sealed into the pod, swinging on the tether, in the customer's hands. People are illustrative from the v2 cast. No
 * real person's likeness, no company's, restaurant's or app's mark.
 */
const CUST: Partial<FigureProps> = {...castV2('resident')};
const COOK: Partial<FigureProps> = {...castV2('owner'), hat: 'cap', hatColor: '#e2574c'};
const NEIGH: Partial<FigureProps> = {...castV2('hand'), hat: 'cap', hatColor: '#2f6fe0'};
const DAL: Partial<FigureProps> = {...castV2('engineer'), hat: 'none', top: 'tee', shirt: '#e2574c'};
const PILOT: Partial<FigureProps> = {...castV2('technician'), glasses: true};
const KID1: Partial<FigureProps> = {...castV2('coder'), top: 'tee', shirt: '#2f86d6', trim: '#ffcf3a'};
const KID2: Partial<FigureProps> = {...castV2('teacher'), top: 'tee', shirt: '#1f8a5b'};
const DOG = '#7a5134';

const move = (t: number, at: number, before: FigurePose, after2: FigurePose) => (
  t < at ? {pose: before} : {pose: after2, fromPose: before, poseBlend: clamp01((t - at) / 0.35)}
);

/** a wooden backyard fence with a gate, baseline y */
const Fence: React.FC<{y: number; gateX: number; open?: number}> = ({y, gateX, open = 0}) => {
  const wood = '#c79a63';
  return (
    <g>
      <rect x={0} y={y - 250} width={1080} height={250} fill={shade(wood, 0.12)} />
      {Array.from({length: 18}, (_, i) => (
        <rect key={i} x={i * 62} y={y - 262 + (i % 3) * 6} width={56} height={262 - (i % 3) * 6} rx={14} fill={i % 2 ? wood : shade(wood, 0.06)}
          stroke={line(wood)} strokeWidth={5} />
      ))}
      <rect x={0} y={y - 190} width={1080} height={22} rx={10} fill={shade(wood, 0.3)} />
      <rect x={0} y={y - 80} width={1080} height={22} rx={10} fill={shade(wood, 0.3)} />
      <g transform={`translate(${gateX} ${y}) scale(${1 - 0.3 * open} 1)`}>
        <rect x={-90} y={-280} width={180} height={280} rx={18} fill="#d8ad74" stroke={line(wood)} strokeWidth={7} />
        <path d="M-80 -30 L80 -250" stroke={shade(wood, 0.3)} strokeWidth={16} strokeLinecap="round" />
        <rect x={56} y={-160} width={30} height={22} rx={8} fill="#5a6078" />
      </g>
      <rect x={0} y={y - 4} width={1080} height={10} fill={shade('#5f9a3c', 0.3)} opacity={0.5} />
    </g>
  );
};

/** a lawn band in front, so the dog and the pod have ground */
const Lawn: React.FC<{y: number}> = ({y}) => (
  <g>
    <path d={`M0 ${y} Q540 ${y - 30} 1080 ${y} L1080 1920 L0 1920 Z`} fill="#6fb04a" />
    <path d={`M0 ${y + 40} Q540 ${y + 10} 1080 ${y + 40}`} stroke="#8fcc5e" strokeWidth={14} fill="none" opacity={0.6} />
    {Array.from({length: 22}, (_, i) => (
      <path key={i} d={`M${(i * 53) % 1080} ${y + 140 + (i * 71) % 500} q6 -26 12 0`} stroke="#4f8f35" strokeWidth={6} fill="none" strokeLinecap="round" />
    ))}
  </g>
);

/** a bark: three bold arcs out of the dog's mouth */
const Bark: React.FC<{x: number; y: number; p: number; rot?: number}> = ({x, y, p, rot = -40}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={p > 0 ? 1 - p * 0.6 : 0}>
    {[0, 1, 2].map((i) => <path key={i} d={`M${30 + i * 34 + p * 40} -40 Q${50 + i * 34 + p * 40} 0 ${30 + i * 34 + p * 40} 40`} stroke="#ffffff"
      strokeWidth={12} fill="none" strokeLinecap="round" />)}
  </g>
);

/** a ghost drone, the 2029 target: a pale see-through drone inside a dashed ring */
const Ghost: React.FC<{x: number; y: number; s: number; op: number; frame: number}> = ({x, y, s, op, frame}) => (
  <g opacity={op}>
    <circle cx={x} cy={y} r={520 * s} fill="#ffffff" fillOpacity={0.18} stroke="#5b4bd6" strokeWidth={8} strokeDasharray="22 16" />
    <g opacity={0.8}><Zip x={x} y={y} s={s * 1.3} frame={frame} mood="curious" rotors={false} /></g>
  </g>
);

/** the restaurant's back wall, a stucco box with a steel door and a little awning, standing on the region's ground */
const BackWall: React.FC<{frame: number}> = ({frame}) => (
  <g>
    <g transform="translate(0 1060)">
      <rect x={-20} y={0} width={1120} height={700} rx={30} fill={shade('#b8604a', 0.12)} stroke={line('#b8604a')} strokeWidth={7} />
      <rect x={-10} y={10} width={1100} height={640} rx={24} fill="#b8604a" />
      {Array.from({length: 13}, (_, r) => <rect key={r} x={-10} y={30 + r * 48} width={1100} height={5} fill="#d98a6e" opacity={0.6} />)}
      {Array.from({length: 13}, (_, r) => Array.from({length: 9}, (_, c) => <rect key={`${r}-${c}`} x={(r % 2) * 60 + c * 125} y={35 + r * 48} width={5} height={43}
        fill="#d98a6e" opacity={0.5} />))}
      <rect x={130} y={180} width={260} height={480} rx={26} fill="#7d8aa3" stroke={line('#7d8aa3')} strokeWidth={7} />
      <rect x={150} y={200} width={90} height={440} rx={16} fill="#98a5bd" opacity={0.6} />
      <circle cx={350} cy={440} r={14} fill="#3c4258" />
      <path d="M100 150 L420 150 L390 90 L130 90 Z" fill="#e2574c" stroke={line('#e2574c')} strokeWidth={6} strokeLinejoin="round" />
      <rect x={560} y={160} width={380} height={200} rx={30} fill="#ffcf9a" stroke="#5a4a3f" strokeWidth={14} />
      <rect x={743} y={160} width={14} height={200} fill="#5a4a3f" />
      <rect x={560} y={253} width={380} height={14} fill="#5a4a3f" />
      <Glow x={750} y={260} r={220} color="#ffb347" opacity={0.3 + 0.05 * Math.sin(frame / 7)} />
      <rect x={-20} y={650} width={1120} height={40} fill="#a99b88" />
    </g>
  </g>
);

export const DroneDinnerFilm: React.FC<FilmRenderProps> = ({board, shot, time_s, shot_s}) => {
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
  const dog = (x: number, y: number, s: number, tilt: number, mood: 'calm' | 'happy' | 'alert' | 'worried', facing: 1 | -1 = 1, sit = 0) => (
    <g>
      <ContactShadow x={x} y={y + 4} w={120 * s} opacity={0.38} />
      <g transform={`rotate(${tilt} ${x} ${y}) translate(0 ${sit * 30 * s})`}>
        <DogV2 frame={frame} x={x} y={y} scale={s} color={DOG} mood={mood} facing={facing} />
      </g>
    </g>
  );
  const pines = (y: number, s = 0.7, n = 8, depth = 0.3) => (
    <g>{Array.from({length: n}, (_, i) => <Pine key={i} x={-60 + i * (1200 / n)} y={y + (i % 2) * 20} s={s + (i % 3) * 0.08} depth={depth} seed={i + 4}
      frame={frame} />)}</g>
  );

  switch (shot.view) {
    // ------------------------------------------------------------------ the backyard
    case 'yard-gate': {
      if (shot.scene_id === 's1') {
        // THE HOOK: the pod already halfway down its tether in the middle of the frame, the dog crouched under it
        const pd = since('s1-pod');
        const py = lerp(560, 860, ease(clamp01(t / 3.6)));
        const look = clamp01(0.35 + t / 1.5);
        return svg(<g>
          {pines(1120, 0.75, 7, 0.3)}
          <Fence y={1340} gateX={880} />
          <Lawn y={1330} />
          {person(CUST, 150, 1380, 0.95, move(t, 1.0, 'stand', 'point'), t > 1 ? 'surprised' : 'thinking', 0.6, 2)}
          <line x1={780} y1={-20} x2={780} y2={py} stroke="#2b2f45" strokeWidth={6} />
          <ellipse cx={780} cy={1700} rx={110 + 30 * (py - 760) / 320} ry={22} fill="#22401c" opacity={0.28} />
          <Pod x={780} y={py} s={1.4} frame={frame} mood={pd > 0 ? 'excited' : 'happy'} />
          {dog(400, 1780, 2.4, -24 * look, look > 0.6 ? 'worried' : 'alert', 1, 0.3)}
          <Burst x={780} y={py + 150} p={(t - 0.3) / 0.6} color="#ffd34d" r={300} />
          {pd > 0 && <Word x={300} y={1100} t="?" size={130} c="#fff6e6" op={clamp01(pd * 3)} />}
        </g>);
      }
      // s7: the drone holds high over the yard, the pod slides down to the lawn
      const lw = Math.max(since('s7-lower'), t - 0.6);
      const podY = lerp(330, 1240, ease(clamp01(lw / 3.2)));
      return svg(<g>
        {pines(1080, 0.8, 7, 0.25)}
        <Fence y={1330} gateX={760} />
        <Lawn y={1320} />
        <Zip x={540} y={lerp(140, 260, ease(clamp01(t / 1.2)))} s={0.34} frame={frame} mood="focused" tether={lw > 0 ? 1 : 0} drop={(podY - 260) / 0.34}
          pod={false} />
        <ContactShadow x={540} y={1450} w={140} opacity={0.18 * clamp01(lw)} />
        {lw > 0 && <Pod x={540} y={podY} s={0.7} frame={frame} mood="happy" />}
        {person(CUST, 170, 1300, 0.95, move(t, 0.3, 'stand', lw > 0 ? 'cheer' : 'point'), lw > 0 ? 'excited' : 'surprised', 0.7, 2)}
        {dog(780, 1600, 1.5, -10 - 16 * clamp01(lw / 2), 'alert', -1)}
      </g>);
    }
    case 'dog-close': {
      if (shot.scene_id === 's1') {
        const pd = since('s1-pod');
        const py = lerp(-200, 640, ease(clamp01(pd / 1.6)));
        return svg(<g>
          <Fence y={1100} gateX={900} />
          <Lawn y={1090} />
          <line x1={700} y1={-20} x2={700} y2={py} stroke="#2b2f45" strokeWidth={6} />
          <Pod x={700} y={py} s={1.5} frame={frame} mood="excited" />
          {dog(440, 1600, 2.4, -20 * after(pd, 0.6), 'worried', 1)}
          <Word x={820} y={1000} t="?" size={150} c="#fff6e6" op={clamp01(pd * 2)} />
        </g>);
      }
      // s8: the quote card slides up beside the dog, then the dog yawns and sits
      const nm = since('s8-name');
      const qt = since('s8-quiet');
      const sit = after(qt, 0.6);
      return svg(<g>
        <Fence y={1100} gateX={160} />
        <Lawn y={1090} />
        {person(CUST, 900, 1900, 1.6, qt > 0 ? move(qt, 0.1, 'think', 'hips') : {pose: 'think'}, qt > 0 ? 'happy' : 'neutral', -0.5, 2)}
        {dog(500, 1600, 2.3, -4 * sit, sit > 0.5 ? 'happy' : 'calm', -1, sit)}
        <g transform={`translate(540 ${lerp(900, 520, pop(nm, 0.6))})`} opacity={clamp01(nm * 3)}>
          <LitBox x={-330} y={-130} w={660} h={260} r={60} c="#3a3366" />
          <Word x={-270} y={-40} t={'“'} size={110} c="#ff7a2f" anchor="start" />
          <Word x={40} y={-10} t="very" size={86} c="#ffffff" /><Word x={40} y={90} t="quiet" size={86} c="#ffffff" />
        </g>
        {qt > 0 && qt < 1.2 && <Word x={400} y={1240} t="z" size={80} c="#ffffff" op={1 - qt / 1.2} />}
      </g>);
    }
    case 'porch-phone': {
      const dt = since('s2-date');
      const fs = since('s2-first');
      const step = after(dt, 1);
      return svg(<g>
        <BrickRanchV2 x={540} y={1380} scale={0.62} frame={frame} seed={7} w={300} h={130} brick="#b5733f" />
        {/* the ribbon unrolls over the roof */}
        {fs > 0 && <g transform={`translate(540 ${lerp(380, 520, pop(fs, 0.5))}) scale(${pop(fs, 0.5)} 1)`}>
          <path d="M-420 -60 L420 -60 L380 0 L420 60 L-420 60 L-380 0 Z" fill="#ff7a2f" stroke={line('#ff7a2f')} strokeWidth={8} />
          <Word x={0} y={30} t="FIRST" size={92} c="#ffffff" />
        </g>}
        <Burst x={540} y={520} p={fs / 0.6} color="#ffd34d" r={420} />
        {since('s2-day') > 0 && <g transform={`translate(860 ${lerp(200, 400, pop(since('s2-day'), 0.5))}) rotate(8)`}>
          <LitBox x={-110} y={-110} w={220} h={220} r={40} c="#ffffff" />
          <rect x={-104} y={-104} width={200} height={56} rx={26} fill="#e2574c" />
          <Word x={0} y={70} t="17" size={110} c="#2b2f45" /></g>}
        <Lawn y={1390} />
        {person(CUST, lerp(420, 560, step), 1720, 1.9, dt > 0.8 ? move(dt, 0.8, 'stand', 'hold') : {pose: 'stand', walk: dt > 0 ? dt : undefined},
          fs > 0 ? 'happy' : 'surprised', 0.2, 2, {holding: dt > 0.8 ? <Phone x={0} y={-30} s={0.26} tilt={-8}><OrderScreen on={0} frame={frame} /></Phone> : undefined})}
      </g>);
    }
    case 'phone-screen': {
      const tp = since('s2-tap');
      const on = after(tp, 0.25);
      const thumbY = lerp(1700, 1240, ease(clamp01((tp + 0.6) / 0.6)));
      return svg(<g>
        <Glow x={540} y={900} r={620} color="#ffd7b0" opacity={0.4} />
        {person(CUST, 200, 2400, 2.6, {pose: 'stand'}, on > 0.5 ? 'excited' : 'thinking', 0.6, 2)}
        <Phone x={600} y={900} s={1.6} tilt={-4}>
          <OrderScreen on={on} frame={frame} eta={on > 0.5 ? 'on its way' : undefined} />
        </Phone>
        <g transform={`translate(${620} ${thumbY + (tp > 0 && tp < 0.2 ? 18 : 0)})`}>
          <ellipse cx={0} cy={0} rx={70} ry={92} fill="#9a6440" stroke={line('#9a6440')} strokeWidth={7} />
          <ellipse cx={-6} cy={-30} rx={44} ry={40} fill="#c49072" opacity={0.6} />
          <rect x={-70} y={40} width={140} height={600} rx={60} fill="#9a6440" />
        </g>
        <Burst x={600} y={1240} p={tp / 0.5} color="#ff7a2f" r={300} />
      </g>);
    }
    // ------------------------------------------------------------------ the kitchen
    case 'back-door': {
      const sl = since('s3-seal');
      const walk = clamp01(sl / 1.0);
      const clipped = after(sl - 1.0, 0.4);
      return svg(<g>
        <BackWall frame={frame} />
        <rect x={0} y={1500} width={1080} height={420} fill="#9a9488" />
        <rect x={0} y={1500} width={1080} height={14} fill="#c9c2b4" />
        <line x1={760} y1={-20} x2={760} y2={980} stroke="#2b2f45" strokeWidth={5} />
        <g transform="translate(760 980)">
          <Pod x={0} y={0} s={1.2} frame={frame} mood={clipped > 0.5 ? 'excited' : 'sleepy'} open={clipped > 0.5 ? 0 : 1} bag={clipped > 0.5} />
        </g>
        {person(COOK, lerp(300, 540, ease(walk)), 1520, 1.6, clipped > 0 ? move(sl, 1.0, 'hold', 'point') : {pose: 'hold', walk: walk < 1 ? sl : undefined},
          clipped > 0.5 ? 'proud' : 'determined', 0.4, 4,
          {holding: clipped > 0 ? undefined : <g transform="translate(0 -20)"><FoodBag x={0} y={0} s={0.55} /></g>})}
        <Burst x={760} y={1150} p={(sl - 1.0) / 0.5} color="#ffd34d" r={240} />
      </g>);
    }
    case 'pod-lift': {
      const pk = since('s3-pick');
      const up = after(pk + 0.2, 3.2);
      const py = lerp(980, -320, up * up);
      return svg(<g>
        <BackWall frame={frame} />
        <line x1={680} y1={-40} x2={680} y2={py} stroke="#2b2f45" strokeWidth={7} />
        <g transform={`translate(680 ${py})`}>
          <Pod x={0} y={0} s={1.9} frame={frame} mood={pk > 0 ? 'excited' : 'happy'} />
        </g>
        {person(COOK, 250, 2050, 2.6, move(pk, 0.2, 'hold', 'shrug'), pk > 0.3 ? 'worried' : 'proud', 0.6, 4)}
      </g>);
    }
    // ------------------------------------------------------------------ the flight
    case 'takeoff': {
      const lf = since('s4-lift');
      const rise = after(lf, 2.2);
      return svg(<g>
        <g transform="translate(0 1180)">
          <LitBox x={80} y={0} w={920} h={760} r={40} c="#e8c9a2" />
          <rect x={80} y={-30} width={920} height={60} rx={24} fill="#b8604a" />
          <rect x={160} y={240} width={220} height={420} rx={30} fill="#5a4a3f" />
          <rect x={520} y={200} width={380} height={220} rx={30} fill="#9fd0ff" opacity={0.85} />
        </g>
        <Zip x={560} y={lerp(1100, 520, rise)} s={0.62} frame={frame} mood={rise > 0.6 ? 'happy' : 'focused'} tether={0.08} drop={300} bank={-6 * Math.sin(t * 2)}
          shadowY={1170} />
        {person(COOK, 270, 1600, 1.15, move(lf, 0.3, 'stand', 'think'), rise > 0.5 ? 'surprised' : 'thinking', 0.5, 4)}
      </g>);
    }
    case 'drone-face': {
      if (shot.scene_id === 's6') {
        const rn = since('s6-rain');
        return svg(<g>
          <rect x={0} y={0} width={1080} height={1920} fill="#46557a" opacity={0.35 * clamp01(rn + 1)} />
          <Zip x={540} y={900} s={1.05} frame={frame} mood="focused" bank={Math.sin(t * 3) * 3} tether={0.05} drop={300} />
          <Rain frame={frame} p={clamp01((rn + 0.2) * 2)} />
          {[0, 1, 2].map((k) => <Burst key={k} x={480 + k * 60} y={820} p={((t * 1.5 + k / 3) % 1)} color="#cfe6ff" r={90} n={6} />)}
        </g>);
      }
      const wd = since('s4-wind');
      const lean = Math.sin(clamp01(wd) * Math.PI) * 10;
      return svg(<g>
        <g transform="translate(0 1560)"><LitBox x={-40} y={0} w={1160} h={420} r={30} c="#7d8698" /><rect x={-40} y={-30} width={1160} height={60} rx={24} fill="#5a6078" /></g>
        <Zip x={540} y={860} s={1.1} frame={frame} mood={wd > 0 ? 'focused' : 'curious'} bank={-lean} tether={0.05} drop={300} look={wd > 0 ? -0.6 : 0} />
        <WindLines x={-100} y={640} w={1300} frame={frame} p={clamp01(wd * 2)} />
        <WindLines x={-100} y={1080} w={1300} frame={frame + 15} p={clamp01(wd * 2)} />
      </g>);
    }
    case 'rooftops': {
      const cr = since('s5-cruise');
      const sp = since('s5-speed');
      const x = lerp(-100, 1180, clamp01(t / 4.6));
      const mph = Math.round(70 * after(sp, 0.35));
      return svg(<g>
        {pines(1120, 0.6, 9, 0.35)}
        {[0, 1, 2].map((i) => <BrickRanchV2 key={i} x={180 + i * 360} y={1330} scale={0.3} frame={frame} seed={20 + i} w={300} h={130}
          brick={['#c0603e', '#b5733f', '#d1a07a'][i]} />)}
        <rect x={0} y={1340} width={1080} height={120} fill="#7f8698" />
        <rect x={0} y={1392} width={1080} height={8} fill="#f2f2f2" opacity={0.7} />
        <ellipse cx={x - 40} cy={1400} rx={110} ry={16} fill="#2b2f45" opacity={0.3} />
        {sp > 0 && [0, 1, 2, 3].map((k) => <rect key={k} x={x - 520 - k * 40} y={560 + k * 22} width={360} height={10} rx={5} fill="#ffffff"
          opacity={0.7 * clamp01(sp * 3)} />)}
        <Zip x={x} y={480} s={0.62} frame={frame} mood="happy" bank={-8} tether={0.06} drop={300} />
        {person(NEIGH, 780, 1400, 1.05, move(cr, 0.4, 'stand', 'point'), cr > 0.4 ? 'surprised' : 'neutral', -0.4, 6)}
        {sp > 0 && <Counter x={300} y={960} value={`${mph} mph`} op={clamp01(sp * 4)} w={420} />}
      </g>);
    }
    case 'range-map': {
      const rg = since('s5-range');
      return svg(<g>
        <RadiusMap x={540} y={760} p={after(rg, 1)} frame={frame} />
        <Scale x={540} y={1340} s={1.2} p={after(rg, 0.8) * 0.8} label="8 lb" />
        <g transform={`translate(540 ${1290 - 20 * pop(rg, 0.4)})`}><FoodBag x={0} y={0} s={0.5} /></g>
      </g>);
    }
    case 'listen-plane': {
      const ea = since('s6-ears');
      const pl = after(since('s6-plane'), 1.4);
      return svg(<g>
        <g transform={`rotate(${-18 * pl} 230 520)`}><Plane x={lerp(260, 200, clamp01(t / 4)) - 260 * pl} y={520 - 300 * pl} s={0.55 * (1 - 0.3 * pl)} frame={frame} /></g>
        <Zip x={760 + 60 * pl} y={1060 + 40 * pl} s={0.6} frame={frame} mood={pl > 0.5 ? 'happy' : ea > 0 ? 'listening' : 'curious'} look={pl > 0.5 ? 0 : ea > 0.6 ? -1 : 0}
          bank={8 * Math.sin(pl * Math.PI)} ears={clamp01(ea * 2)} tether={0.05}
          drop={300} />
        {ea > 0 && <Rings x={760} y={1040} frame={frame} r={700} op={clamp01(ea * 2)} />}
        {ea > 1 && <Burst x={240} y={520} p={(ea - 1) / 0.6} color="#7cf0ff" r={220} />}
        {ea > 0.4 && <path d="M720 1000 Q480 760 290 560" stroke="#7cf0ff" strokeWidth={6} strokeDasharray="18 14" fill="none"
          strokeDashoffset={-frame * 2} opacity={clamp01((ea - 0.4) * 3)} />}
      </g>);
    }
    case 'tether-tilt': {
      // the camera rides down the tether with the pod, from the drone to the yard
      const lw = Math.max(since('s7-lower'), t - 0.2);
      const podY = lerp(520, 2950, ease(clamp01(lw / 2.8)));
      const off = -Math.max(0, Math.min(1900, podY - 820));
      return svg(<g transform={`translate(0 ${off})`}>
        <Zip x={540} y={300} s={0.62} frame={frame} mood="focused" tether={0} pod={false} />
        <line x1={540} y1={340} x2={540} y2={podY} stroke="#2b2f45" strokeWidth={6} />
        <g transform="translate(0 1300)">{pines(1300, 0.9, 6, 0.1)}</g>
        <Pod x={540} y={podY} s={1.6} frame={frame} mood="happy" />
        <g transform="translate(0 1700)">
          <Lawn y={1250} />
          {person(CUST, 280, 1820, 1.5, {pose: 'cheer'}, 'excited', 0.5, 2)}
          {dog(800, 1840, 1.9, -26, 'alert', -1)}
        </g>
      </g>);
    }
    case 'height-compare': {
      const tp = since('s8-tape');
      const lo = since('s8-low');
      const ground = 1600;
      const topY = 260;
      const lowY = ground - (ground - topY) * (32 / 330);
      return svg(<g>
        {pines(ground - 40, 0.3, 9, 0.2)}
        <Lawn y={ground} />
        <HeightBar x={360} y={ground} h={ground - topY} p={after(tp, 1.6)} c="#ffcf3a" label="" w={64} />
        {Array.from({length: 11}, (_, i) => <rect key={i} x={392} y={ground - (ground - topY) * (i / 10) * after(tp, 1.6) - 3} width={36} height={6} rx={3}
          fill="#ffffff" />)}
        {after(tp, 1.6) > 0.95 && <g>
          <rect x={300} y={lowY - 4} width={140} height={8} rx={4} fill="#ff5a5a" />
          <Word x={480} y={lowY + 18} t="32 ft" size={52} c="#ffffff" anchor="start" />
          <Word x={420} y={topY + 300} t="330 ft" size={60} c="#ffffff" anchor="start" />
        </g>}
        <Zip x={560} y={topY - 20} s={0.32} frame={frame} mood="proud" tether={after(tp, 1.6)} drop={(ground - topY - 40) / 0.32} pod={true} />
        {lo > 0 && <g transform={`translate(860 ${lowY - 90})`}>
          <g transform={`scale(${pop(lo, 0.4)})`}><Zip x={0} y={0} s={0.42} frame={frame} mood="worried" /></g>
          {[0, 1, 2].map((k) => <path key={k} d={`M${-140 - k * 30} ${-40 + k * 30} q-30 20 0 40`} stroke="#ff5a5a" strokeWidth={8} fill="none"
            strokeLinecap="round" opacity={0.5 + 0.5 * Math.sin(frame * 1.2 + k)} />)}
          <rect x={-80} y={50} width={160} height={8} rx={4} fill="#ff5a5a" />
        </g>}
        {person(CUST, 180, ground + 120, 1.0, lo > 0 ? move(lo, 0.2, 'point', 'panic') : move(t, 0.6, 'stand', 'point'), lo > 0.3 ? 'worried' : 'surprised', lo > 0 ? 0.8 : -0.5, 2)}
      </g>);
    }
    // ------------------------------------------------------------------ the claims
    case 'claim-card': {
      const cl = since('s9-claim');
      return svg(<g>
        <g transform={`translate(540 600) rotate(${-4 + 4 * pop(cl, 0.4)}) scale(${lerp(1.25, 1, pop(cl, 0.35))})`} opacity={clamp01(cl * 4)}>
          <LitBox x={-420} y={-220} w={840} h={440} r={60} c="#ffffff" />
          <Word x={0} y={-30} t="FULLY" size={120} c="#2b2f45" />
          <Word x={0} y={110} t="ROBOTIC" size={120} c="#ff7a2f" />
        </g>
        <Zip x={540} y={1050} s={0.7} frame={frame} mood={cl > 0.3 ? 'proud' : 'curious'} tether={0.05} drop={300} />
        <Word x={540} y={1560} t="Zipline's own words" size={54} c="#3a3550" op={clamp01(cl - 0.6)} />
      </g>);
    }
    case 'stopwatch': {
      const ck = since('s9-clock');
      const wd = since('s9-words');
      const sweep = 60 * after(ck, 0.9);
      const dashed = after(wd, 0.4);
      return svg(<g>
        {[0, 1].map((i) => <BrickRanchV2 key={i} x={250 + i * 560} y={1620} scale={0.3} frame={frame} seed={70 + i} w={300} h={130} brick={['#b5733f', '#c0603e'][i]} />)}
        <g transform="translate(540 900)">
          <circle r={360} fill={dashed > 0.5 ? 'none' : '#ffffff'} stroke={line('#ffffff')} strokeWidth={14} strokeDasharray={dashed > 0.5 ? '40 26' : undefined} />
          {dashed < 0.5 && <circle r={330} fill="#fff8ee" />}
          <rect x={-50} y={-440} width={100} height={70} rx={24} fill="#ff7a2f" />
          {Array.from({length: 12}, (_, i) => <rect key={i} x={-6} y={-320} width={12} height={40} rx={6} fill="#2b2f45" transform={`rotate(${i * 30})`} />)}
          <path d={`M0 0 L0 -300 A300 300 0 ${sweep > 180 ? 1 : 0} 1 ${300 * Math.sin(sweep * Math.PI / 180)} ${-300 * Math.cos(sweep * Math.PI / 180)} Z`}
            fill="#ff7a2f" opacity={0.18} />
          <line x1={0} y1={0} x2={280 * Math.sin(sweep * Math.PI / 180)} y2={-280 * Math.cos(sweep * Math.PI / 180)} stroke="#e2574c" strokeWidth={14}
            strokeLinecap="round" />
          <circle r={26} fill="#2b2f45" />
        </g>
        {ck > 0.9 && <g opacity={clamp01((ck - 0.9) * 4)}>
          <Word x={140} y={780} t={'“'} size={260} c="#ff7a2f" rot={-8} />
          <Word x={940} y={1240} t={'”'} size={260} c="#ff7a2f" rot={8} />
        </g>}
        <g opacity={clamp01(ck * 2)}><LitBox x={40} y={1050} w={600} h={140} r={60} c="#ff7a2f" /><Word x={330} y={1145} t="under 10 minutes" size={66} c="#ffffff" /></g>
        {person(CUST, 800, 1850, 1.7, move(ck, 0.2, 'stand', 'hold'), wd > 0.3 ? 'thinking' : 'happy', -0.5, 2,
          {holding: ck > 0.2 ? <Phone x={0} y={-30} s={0.3} tilt={6}><rect x={20} y={200} width={260} height={120} rx={30} fill="#2b2f45" /></Phone> : undefined})}
      </g>);
    }
    case 'pilot-desk': {
      const pl = since('s10-pilot');
      return svg(<g>
        <rect x={0} y={1440} width={1080} height={480} fill="#c9b79c" />
        <rect x={0} y={1440} width={1080} height={26} fill="#e6d7bf" />
        <Console x={560} y={1060} s={1.2} frame={frame} dot={clamp01(t / 5)} />
        {person(PILOT, 280, 1720, 1.6, move(pl, 0.3, 'stand', 'reach'), 'determined', 0.6, 8)}
      </g>);
    }
    case 'console-close': {
      // extreme close: the pilot's finger comes down on the override key, the screen flashing above
      const ov = since('s10-override');
      const press = ov > 0.7 ? 1 : 0;
      return svg(<g>
        <Console x={540} y={420} s={1.0} frame={frame} dot={clamp01(t / 4)} alert={clamp01(ov * 3)} />
        <g transform="translate(540 1080)">
          <LitBox x={-470} y={-150} w={940} h={360} r={70} c="#3c4258" />
          <g transform={`translate(0 ${press * 18})`}>
            <rect x={-230} y={-90} width={460} height={200} rx={60} fill={press ? '#ffb000' : '#ffcf3a'} stroke={line('#ffcf3a')} strokeWidth={10} />
            <Word x={0} y={36} t="OVERRIDE" size={70} c="#3a2a00" />
          </g>
          <Burst x={0} y={0} p={(ov - 0.7) / 0.5} color="#ffd34d" r={420} />
        </g>
        <g transform={`translate(${lerp(900, 560, after(ov, 0.6))} ${lerp(1700, 1010 + press * 18, after(ov, 0.6))}) scale(1.7)`}>
          <ellipse cx={0} cy={0} rx={80} ry={64} fill="#6e4428" stroke={line('#6e4428')} strokeWidth={7} />
          <rect x={-20} y={-90} width={40} height={90} rx={20} fill="#6e4428" stroke={line('#6e4428')} strokeWidth={6} />
          <rect x={-60} y={30} width={120} height={500} rx={50} fill="#3d5a8a" />
        </g>
      </g>);
    }
    case 'team-catch': {
      const tm = since('s11-team');
      const ct = since('s11-catch');
      const run = clamp01(tm / 1.6);
      const podY = lerp(-200, 1060, ease(clamp01((ct + 1.6) / 2.4)));
      const landed = ct > 0.8 || (shot.id === 's11-b' && t > 1.2);
      const nn = since('s11-notnew');
      const close = shot.id === 's11-b';
      return svg(<g transform={close ? 'translate(540 1100) scale(1.35) translate(-540 -1100)' : undefined}>
        {nn > 0 && nn < 4 && Array.from({length: 7}, (_, k) => {
          const px = lerp(-200, 1300, clamp01((nn - k * 0.18) / 1.8));
          return <g key={k} transform={`translate(${px} ${260 + 40 * Math.sin(k * 1.7)})`}><Zip x={0} y={0} s={0.14} frame={frame + k * 9} mood="happy" bank={-6}
            tether={0.05} drop={300} /></g>;
        })}
        <g transform="translate(540 1220) scale(0.55)">
          <LitBox x={-900} y={-520} w={1800} h={520} r={40} c="#c9a27a" />
          <rect x={-120} y={-260} width={240} height={260} rx={20} fill="#5a6078" />
          {[0, 1, 2, 3, 4, 5].map((i) => i === 2 || i === 3 ? null : <rect key={i} x={-800 + i * 280} y={-420} width={180} height={160} rx={24} fill="#9fd0ff" />)}
          <rect x={700} y={-1100} width={14} height={1100} rx={7} fill="#c9ccd6" />
        </g>
        <Lawn y={1230} />
        <line x1={540} y1={-20} x2={540} y2={podY} stroke="#2b2f45" strokeWidth={5} opacity={landed ? 0.4 : 1} />
        <Pod x={540} y={podY} s={0.9} frame={frame} mood={landed ? 'excited' : 'happy'} />
        <Burst x={540} y={1560} p={(ct - 0.8) / 0.6} color="#ffd34d" r={360} />
        {person(KID1, lerp(80, 320, ease(run)), 1520, 1.05, landed ? move(ct, 0.8, 'point', 'cheer') : {pose: run < 1 ? 'stand' : 'point', walk: run < 1 ? tm : undefined},
          landed ? 'excited' : 'happy', 0.5, 9)}
        {person(KID2, lerp(1000, 780, ease(run)), 1540, 1.05, landed ? move(ct, 0.9, 'point', 'cheer') : {pose: run < 1 ? 'stand' : 'point', walk: run < 1 ? tm : undefined},
          landed ? 'excited' : 'surprised', -0.5, 10)}
      </g>);
    }
    case 'million-map': {
      const cn = since('s12-count');
      const pn = since('s12-pins');
      const v = Math.round(1000000 * after(cn, 1.4));
      return svg(<g>
        <RadiusMap x={540} y={1000} p={0} frame={frame} w={900} />
        {Array.from({length: 160}, (_, i) => {
          const px = 140 + ((i * 137) % 800);
          const py = 620 + ((i * 271) % 760);
          const at = (i % 40) * 0.03;
          const fall = clamp01((pn - at) / 0.35);
          return fall > 0 ? <g key={i} transform={`translate(${px} ${lerp(py - 300, py, ease(fall))})`}>
            <path d="M0 0 C-14 -22 -15 -40 0 -44 C15 -40 14 -22 0 0Z" fill="#ff7a2f" stroke={line('#ff7a2f')} strokeWidth={3} />
          </g> : null;
        })}
        <Counter x={540} y={400} value={v.toLocaleString('en-US')} op={clamp01(cn * 4)} w={760} size={100} />
        <Word x={540} y={1600} t="Dallas area" size={70} c="#2b2f45" op={clamp01(cn)} />
      </g>);
    }
    case 'ghost-sky': {
      const gl = since('s13-goal');
      const gh = since('s13-ghost');
      const flick = gh > 0 ? 0.35 + 0.25 * Math.sin(frame * 0.9) : 1;
      return svg(<g>
        {Array.from({length: 15}, (_, i) => {
          const row = Math.floor(i / 5);
          const col = i % 5;
          const a = clamp01((gl - i * 0.06) * 3);
          return <Ghost key={i} x={130 + col * 205 + (row % 2) * 80} y={480 + row * 200} s={0.2} op={a * flick} frame={frame + i * 5} />;
        })}
        {gh > 0 && <Zip x={lerp(-200, 1300, clamp01(gh / 2.4))} y={560} s={0.32} frame={frame} mood="happy" bank={-6} tether={0.05} drop={300} />}
        <g transform="translate(0 200)"><BackWall frame={frame} /></g>
        <rect x={0} y={1700} width={1080} height={220} fill="#9a9488" />
        {person(COOK, 280, 1640, 1.25, move(gl, 0.3, 'stand', 'think'), gh > 0 ? 'thinking' : 'surprised', 0.4, 4)}
      </g>);
    }
    case 'hand-sack': {
      const tk = since('s14-take');
      const rs = since('s14-rise');
      const lift = after(tk, 0.8);
      const podY = lerp(760, -300, after(rs, 1.0));
      return svg(<g>
        <Fence y={1160} gateX={180} />
        <Lawn y={1150} />
        <line x1={720} y1={-20} x2={720} y2={podY} stroke="#2b2f45" strokeWidth={6} />
        <Pod x={720} y={podY} s={1.4} frame={frame} mood={rs > 0 ? 'happy' : 'excited'} open={rs > 0 ? 0 : Math.max(0.05, 1 - lift)} bag={tk < 0.7} />
        {person(CUST, 420, 2000, 2.3, tk < 0.7 ? {pose: 'cheer'} : move(tk, 0.7, 'cheer', 'hold'), lift > 0.5 ? 'excited' : 'happy', 0.4, 2,
          {holding: <g transform={`translate(0 ${-40 - 40 * lift})`}><FoodBag x={0} y={0} s={0.6} />
            {[0, 1].map((k) => <path key={k} d={`M${-20 + k * 40} -80 q-20 -40 0 -80 t0 -80`} stroke="#ffffff" strokeWidth={10} fill="none"
              strokeLinecap="round" opacity={0.5 * lift * (0.6 + 0.4 * Math.sin(frame / 5 + k))} />)}</g>})}
      </g>);
    }
    case 'dog-sky': {
      const bk = since('s14-bark');
      const barkP = bk > 0 ? (bk * 2.2) % 1 : -1;
      return svg(<g>
        {pines(1100, 0.8, 7, 0.25)}
        <Fence y={1330} gateX={760} />
        <Lawn y={1320} />
        <Zip x={lerp(600, 760, clamp01(t / 4))} y={lerp(260, 140, clamp01(t / 4))} s={0.1} frame={frame} mood="happy" tether={0.3} drop={400} pod={true} />
        {person(CUST, 260, 1440, 1.1, {pose: 'hold', holding: <FoodBag x={0} y={-20} s={0.4} />}, bk > 0 ? 'excited' : 'happy', 0.5, 2)}
        {dog(700, 1640, 1.8, -28, bk > 0 ? 'alert' : 'happy', 1)}
        {bk > 0 && <Bark x={790} y={1450} p={barkP} rot={-70} />}
      </g>);
    }
    case 'rain-street': {
      const rn = since('s6-rain');
      const tip = after(rn - 0.4, 0.8);
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#46557a" opacity={0.3} />
        {pines(1150, 0.6, 9, 0.35)}
        <rect x={0} y={1340} width={1080} height={600} fill="#6d7488" />
        <Zip x={lerp(1250, -250, clamp01(t / 4.4))} y={520} s={0.3} frame={frame} mood="focused" bank={-4} tether={0.05} drop={300} />
        <Rain frame={frame} p={1} />
        <Rain frame={frame + 11} p={0.8} />
        {person(NEIGH, 520, 1720, 1.9, {pose: 'hold'}, tip > 0.5 ? 'surprised' : 'neutral', -0.3, 6,
          {holding: <g transform={`rotate(${-30 * tip}) translate(0 -420)`}>
            <path d="M-360 0 Q0 -300 360 0 Q240 -40 120 0 Q0 -40 -120 0 Q-240 -40 -360 0Z" fill="#2f86d6" stroke={line('#2f86d6')} strokeWidth={8} />
            <rect x={-6} y={0} width={12} height={420} rx={6} fill="#3c4258" /></g>})}
      </g>);
    }
    case 'dallas-yards': {
      const cn = since('s12-count');
      const pn = since('s12-pins');
      const v = Math.round(1000000 * after(cn, 0.3));
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#ff7a4a" opacity={0.28} /><rect x={0} y={0} width={1080} height={700} fill="#5b4bd6" opacity={0.25} />
        {[0, 1, 2].map((r) => <g key={r}>{[0, 1, 2, 3].map((i) => (
          <BrickRanchV2 key={i} x={130 + i * 280 + (r % 2) * 120} y={1000 + r * 300} scale={0.24 + r * 0.05} frame={frame} seed={40 + r * 4 + i} w={300} h={130}
            brick={['#c0603e', '#b5733f', '#d1a07a', '#a8664a'][(i + r) % 4]} />))}</g>)}
        {Array.from({length: 12}, (_, i) => {
          const r = Math.floor(i / 4); const c = i % 4;
          const x = 130 + c * 280 + (r % 2) * 120 + 90;
          const gy = 1040 + r * 300;
          const d = clamp01((pn + 0.6 - i * 0.07) / 1.4);
          const py = lerp(-100, gy - 60, ease(d));
          return <g key={i}><line x1={x} y1={-20} x2={x} y2={py} stroke="#2b2f45" strokeWidth={3} opacity={0.7} />
            <Pod x={x} y={py} s={0.35 + r * 0.06} frame={frame + i * 7} mood="happy" /></g>;
        })}
        {person(DAL, 820, 1880, 1.4, move(pn, 0.3, 'stand', 'wave'), 'happy', -0.4, 11)}
        <Counter x={540} y={560} value={v >= 1000000 ? '1 million' : v.toLocaleString('en-US')} op={clamp01(cn * 4)} w={640} size={100} />
      </g>);
    }
    case 'porch-date': {
      // close: the calendar tag slaps onto the ribbon, she waves her phone at it
      const dy = since('s2-day');
      const tag = pop(dy, 0.45);
      return svg(<g>
        <g transform="translate(540 560)">
          <path d="M-520 -90 L520 -90 L470 0 L520 90 L-520 90 L-470 0 Z" fill="#ff7a2f" stroke={line('#ff7a2f')} strokeWidth={10} />
          <Word x={-120} y={40} t="FIRST" size={130} c="#ffffff" />
          <g transform={`translate(${lerp(700, 300, tag)} ${lerp(-500, 0, tag)}) rotate(${lerp(40, 8, tag)})`}>
            <LitBox x={-140} y={-150} w={280} h={300} r={50} c="#ffffff" />
            <rect x={-132} y={-142} width={248} height={76} rx={34} fill="#e2574c" />
            <Word x={-6} y={110} t="17" size={150} c="#2b2f45" />
          </g>
          <Burst x={300} y={0} p={(dy - 0.3) / 0.5} color="#ffd34d" r={360} />
        </g>
        {person(CUST, 520, 2150, 2.4, dy > 0.2 ? move(dy, 0.2, 'hold', 'wave') : {pose: 'hold'}, dy > 0.3 ? 'excited' : 'happy', -0.2, 2)}
      </g>);
    }
    default:
      return svg(<g><Zip x={540} y={800} s={0.7} frame={frame} mood="curious" /></g>);
  }
};
