import React from 'react';
import {ContactShadow, Glow, clamp01, ease, easeOutBack, lerp} from '../../../look/Kit';
import {line, light, shade} from '../../../look/color';
import {FONT} from '../../../lib/type';

/**
 * drone-dinner-1124 parts. Every drawing here is original and follows LOOK_V2: round corners, a key from the upper
 * left, shade toward violet, hue-tinted line, a contact shadow under anything that stands and a ground shadow under
 * anything that flies. The delivery drone, its pod, the kitchen, the app and the yard are illustrative. No company's,
 * restaurant's or app's mark is drawn, and no real person's likeness.
 */

export const after = (since: number, dur: number) => (since < 0 ? 0 : ease(since / dur));
export const pop = (since: number, dur = 0.5, k = 1.7) => (since < 0 ? 0 : easeOutBack(clamp01(since / dur), k));

/** bold text with a deep rim of its own hue, readable on bright and dark */
export const Word: React.FC<{x: number; y: number; t: string; size?: number; c?: string; anchor?: 'start' | 'middle' | 'end'; op?: number;
  rot?: number}> = ({x, y, t, size = 48, c = '#fff6e6', anchor = 'middle', op = 1, rot = 0}) => (
  <g opacity={op} transform={`rotate(${rot} ${x} ${y})`}>
    <text x={x} y={y} textAnchor={anchor} fontFamily={FONT.body} fontWeight={900} fontSize={size} fill={line(c)} stroke={line(c)}
      strokeWidth={size * 0.2} strokeLinejoin="round">{t}</text>
    <text x={x} y={y} textAnchor={anchor} fontFamily={FONT.body} fontWeight={900} fontSize={size} fill={c}>{t}</text>
  </g>
);

/** a lit rounded box, the way every cabinet, sign and panel here is built */
export const LitBox: React.FC<{x: number; y: number; w: number; h: number; r?: number; c: string; sw?: number; op?: number}> = ({
  x, y, w, h, r = 24, c, sw = 7, op = 1}) => (
  <g opacity={op}>
    <rect x={x} y={y} width={w} height={h} rx={r} fill={shade(c, 0.25)} stroke={line(c)} strokeWidth={sw} />
    <rect x={x + sw * 0.6} y={y + sw * 0.6} width={w * 0.92 - sw} height={h * 0.88 - sw} rx={Math.max(4, r - sw)} fill={c} />
    <rect x={x + w * 0.08} y={y + h * 0.08} width={w * 0.5} height={Math.max(4, h * 0.06)} rx={Math.max(2, h * 0.03)} fill={light(c, 0.55)} opacity={0.7} />
  </g>
);

export type ZipMood = 'curious' | 'happy' | 'focused' | 'worried' | 'proud' | 'listening';

const BODY = '#f4f1ec';
const ACCENT = '#ff7a2f';

/**
 * THE HERO. A delivery drone seen from the front: a round white nose with a dark visor face, long wings with a little
 * dihedral, a lift rotor at each wingtip boom, a tail fin standing up behind, and a belly hatch. `tether` 0 to 1 pays
 * the line out to `drop` (in the drone's own units) with the pod on the end. `bank` tilts it in a turn. `ears` lights
 * the little microphones that listen for aircraft.
 */
export const Zip: React.FC<{x: number; y: number; s?: number; frame: number; mood?: ZipMood; bank?: number; tether?: number;
  drop?: number; look?: number; ears?: number; pod?: boolean; podMood?: PodMood; podSwing?: number; shadowY?: number; rotors?: boolean;
  bag?: boolean}> = ({x, y, s = 1, frame, mood = 'curious', bank = 0, tether = 0, drop = 900, look = 0, ears = 0, pod = true,
  podMood = 'happy', podSwing = 0, shadowY, rotors = true, bag = true}) => {
  const blink = (frame % 97) < 4 ? [1, 0.3, 0.1, 0.6][frame % 97] : 1;
  const bob = Math.sin(frame / 13) * 6;
  const eyeH = (mood === 'focused' ? 16 : mood === 'worried' ? 22 : mood === 'listening' ? 20 : 30) * blink;
  const brow: Record<ZipMood, [string, string]> = {
    curious: ['M-72 -40 Q-50 -54 -26 -44', 'M72 -48 Q50 -58 26 -48'],
    happy: ['M-72 -44 Q-50 -60 -26 -46', 'M72 -44 Q50 -60 26 -46'],
    focused: ['M-72 -36 L-26 -46', 'M72 -36 L26 -46'],
    worried: ['M-72 -48 L-26 -36', 'M72 -48 L26 -36'],
    proud: ['M-72 -50 Q-50 -64 -26 -52', 'M72 -50 Q50 -64 26 -52'],
    listening: ['M-72 -42 Q-50 -50 -26 -46', 'M72 -50 Q50 -62 26 -52'],
  };
  const mouth = mood === 'worried' ? 'M-20 40 Q0 30 20 40' : mood === 'focused' || mood === 'listening' ? 'M-16 38 L16 38' : 'M-24 32 Q0 54 24 32';
  const len = drop * clamp01(tether);
  const rotor = (cx: number, k: number) => (
    <g transform={`translate(${cx} -34)`}>
      <rect x={-9} y={-6} width={18} height={40} rx={9} fill={shade(BODY, 0.3)} />
      {rotors && <ellipse cx={0} cy={-10} rx={120} ry={12} fill="#dfe8ff" opacity={0.35 + 0.2 * Math.sin(frame * 2.1 + k)} />}
      {rotors && <ellipse cx={0} cy={-10} rx={120} ry={12} fill="none" stroke="#ffffff" strokeWidth={3} opacity={0.4} />}
      <ellipse cx={0} cy={-10} rx={16} ry={9} fill={shade(BODY, 0.45)} />
    </g>
  );
  return (
    <g>
      {shadowY !== undefined && <ContactShadow x={x} y={shadowY} w={420 * s} opacity={0.18} />}
      <g transform={`translate(${x} ${y + bob}) scale(${s}) rotate(${bank})`}>
        {/* the tether and the pod hang from the belly, drawn first so the body sits over the line */}
        {tether > 0 && (
          <g transform={`rotate(${podSwing})`}>
            <line x1={0} y1={70} x2={0} y2={70 + len} stroke="#2b2f45" strokeWidth={4} strokeLinecap="round" />
            {pod && <Pod x={0} y={70 + len} frame={frame} mood={podMood} bag={bag} />}
          </g>
        )}
        {/* the tail fin behind */}
        <path d="M-14 -60 Q-6 -170 30 -178 Q40 -120 22 -56 Z" fill={shade(BODY, 0.18)} stroke={line(BODY)} strokeWidth={6} strokeLinejoin="round" />
        <path d="M2 -150 Q18 -168 28 -170 L24 -140 Z" fill={ACCENT} />
        {/* wings */}
        {[-1, 1].map((side) => (
          <g key={side}>
            <path d={`M${side * 70} -18 Q${side * 260} -46 ${side * 430} -64 Q${side * 446} -50 ${side * 430} -40 Q${side * 260} -12 ${side * 70} 18 Z`}
              fill={BODY} stroke={line(BODY)} strokeWidth={6} strokeLinejoin="round" />
            <path d={`M${side * 80} -12 Q${side * 260} -38 ${side * 420} -56`} stroke="#ffffff" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.9} />
            <path d={`M${side * 80} 10 Q${side * 260} -18 ${side * 420} -44`} stroke={shade(BODY, 0.3)} strokeWidth={5} fill="none" strokeLinecap="round" />
            <rect x={side * 250 - 14} y={-44} width={28} height={30} rx={10} fill={ACCENT} />
          </g>
        ))}
        {rotor(-250, 0)}
        {rotor(250, 1.4)}
        {/* microphones, small dots on the wings that glow when it listens */}
        {[-150, 150].map((mx) => (
          <g key={mx}>
            <circle cx={mx} cy={-26} r={9} fill="#2b2f45" />
            {ears > 0 && <circle cx={mx} cy={-26} r={9 + 10 * ears} fill="none" stroke="#7cf0ff" strokeWidth={4} opacity={ears} />}
          </g>
        ))}
        {/* the round nose */}
        <ellipse cx={0} cy={8} rx={104} ry={88} fill={shade(BODY, 0.22)} stroke={line(BODY)} strokeWidth={7} />
        <ellipse cx={-10} cy={-2} rx={92} ry={76} fill={BODY} />
        <ellipse cx={-42} cy={-48} rx={36} ry={14} fill="#ffffff" opacity={0.9} />
        <path d="M84 30 Q70 80 10 92" stroke={light('#9fb6ff', 0.2)} strokeWidth={6} fill="none" opacity={0.6} strokeLinecap="round" />
        {/* the visor face */}
        <rect x={-82} y={-34} width={164} height={78} rx={38} fill="#20243a" />
        <rect x={-74} y={-28} width={60} height={10} rx={5} fill="#ffffff" opacity={0.18} />
        {[-34, 34].map((ex) => (
          <g key={ex}>
            <ellipse cx={ex + look * 10} cy={4} rx={15} ry={eyeH / 2} fill="#62f0ff" />
            <circle cx={ex + look * 10 - 5} cy={4 - eyeH / 5} r={4} fill="#ffffff" />
          </g>
        ))}
        <path d={brow[mood][0]} stroke="#62f0ff" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.8} />
        <path d={brow[mood][1]} stroke="#62f0ff" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.8} />
        <path d={mouth} stroke="#62f0ff" strokeWidth={6} fill="none" strokeLinecap="round" />
        {/* the belly hatch */}
        <rect x={-30} y={70} width={60} height={20} rx={10} fill={shade(BODY, 0.4)} />
      </g>
    </g>
  );
};

export type PodMood = 'happy' | 'sleepy' | 'excited' | 'worried';

/** THE POD: a small rounded orange pod with fins and a tiny face, carrying the bag inside a window. Anchored at its top. */
export const Pod: React.FC<{x: number; y: number; s?: number; frame: number; mood?: PodMood; bag?: boolean; open?: number}> = ({
  x, y, s = 1, frame, mood = 'happy', bag = true, open = 0}) => {
  const blink = (frame % 83) < 4 ? 0.2 : 1;
  const spin = Math.sin(frame / 11) * 4;
  const eyeR = mood === 'excited' ? 9 : 7;
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${spin})`}>
      <rect x={-6} y={0} width={12} height={22} rx={6} fill="#2b2f45" />
      <path d="M0 18 C-70 26 -84 120 -60 170 Q0 210 60 170 C84 120 70 26 0 18Z" fill={shade(ACCENT, 0.2)} stroke={line(ACCENT)} strokeWidth={6} />
      <path d="M-6 26 C-64 36 -74 120 -54 160 Q-4 192 48 160 C64 110 56 40 -6 26Z" fill={ACCENT} />
      <ellipse cx={-26} cy={64} rx={14} ry={26} fill="#ffd2b0" opacity={0.7} />
      {/* fins */}
      <path d="M-58 150 L-86 196 L-40 182 Z" fill={shade(ACCENT, 0.3)} stroke={line(ACCENT)} strokeWidth={5} strokeLinejoin="round" />
      <path d="M58 150 L86 196 L40 182 Z" fill={shade(ACCENT, 0.3)} stroke={line(ACCENT)} strokeWidth={5} strokeLinejoin="round" />
      {/* face */}
      <ellipse cx={-16} cy={86} rx={eyeR} ry={eyeR * blink * (mood === 'sleepy' ? 0.4 : 1)} fill="#2b1d14" />
      <ellipse cx={16} cy={86} rx={eyeR} ry={eyeR * blink * (mood === 'sleepy' ? 0.4 : 1)} fill="#2b1d14" />
      <path d={mood === 'worried' ? 'M-10 112 Q0 104 10 112' : 'M-12 106 Q0 118 12 106'} stroke="#2b1d14" strokeWidth={5} fill="none" strokeLinecap="round" />
      {/* a round window in the belly shows the folded sack top inside */}
      {bag && open === 0 && <g>
        <circle cx={0} cy={146} r={26} fill="#fff1dd" stroke={line(ACCENT)} strokeWidth={5} />
        <path d="M-18 150 L18 150 L14 136 L-14 136 Z" fill="#d8a76a" stroke="#8a5a2a" strokeWidth={3} />
        <path d="M-12 143 L12 143" stroke="#8a5a2a" strokeWidth={3} />
      </g>}
      {/* the bag peeks out when the pod opens */}
      {bag && open > 0 && <g transform={`translate(0 ${130 - 60 * open})`}><FoodBag x={0} y={0} s={0.5} /></g>}
    </g>
  );
};

/** a paper food bag with the top folded, no restaurant mark */
export const FoodBag: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = '#d8a76a'}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ContactShadow x={0} y={150} w={200} opacity={0.3} />
    <path d="M-80 -60 L80 -60 L92 150 L-92 150 Z" fill={shade(c, 0.2)} stroke={line(c)} strokeWidth={7} strokeLinejoin="round" />
    <path d="M-74 -54 L60 -54 L70 140 L-84 140 Z" fill={c} />
    <path d="M-80 -60 L-70 -110 L70 -110 L80 -60 Z" fill={light(c, 0.15)} stroke={line(c)} strokeWidth={7} strokeLinejoin="round" />
    <path d="M-60 -84 L60 -84" stroke={shade(c, 0.3)} strokeWidth={6} strokeLinecap="round" />
    <rect x={-40} y={10} width={80} height={56} rx={18} fill="#fff6e6" opacity={0.85} />
    <circle cx={0} cy={38} r={14} fill={ACCENT} />
  </g>
);

/** a phone held up, its screen drawn by children in a 300 by 560 box */
export const Phone: React.FC<{x: number; y: number; s?: number; tilt?: number; children?: React.ReactNode}> = ({x, y, s = 1, tilt = 0, children}) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${tilt})`}>
    <rect x={-170} y={-320} width={340} height={640} rx={56} fill="#22263a" stroke="#141726" strokeWidth={8} />
    <rect x={-150} y={-290} width={300} height={580} rx={40} fill="#f7f4ff" />
    <g transform="translate(-150 -290)">{children}</g>
    <rect x={-40} y={-306} width={80} height={10} rx={5} fill="#0e1020" />
    <path d="M-140 -280 L-40 -280 L-140 -120 Z" fill="#ffffff" opacity={0.12} />
  </g>
);

/** the order screen: a meal tile and a big round "by drone" toggle that lights on `on` */
export const OrderScreen: React.FC<{on: number; frame: number; eta?: string}> = ({on, frame, eta}) => (
  <g>
    <rect x={20} y={30} width={260} height={180} rx={30} fill="#ffe2c4" />
    <g transform="translate(150 140) scale(0.55)"><FoodBag x={0} y={-40} /></g>
    <rect x={20} y={230} width={260} height={30} rx={15} fill="#d7d3ea" />
    <rect x={20} y={274} width={180} height={24} rx={12} fill="#e6e2f4" />
    <g transform={`translate(150 400) scale(${1 + 0.12 * Math.sin(clamp01(on) * Math.PI)})`}>
      <rect x={-120} y={-56} width={240} height={112} rx={56} fill={on > 0.5 ? ACCENT : '#c9c4dc'} />
      <text x={0} y={14} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={40} fill="#ffffff">by drone</text>
    </g>
    {eta && <text x={150} y={530} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={34} fill="#3a3550"
      opacity={clamp01(on * 2 - 1)}>{eta}</text>}
    {on > 0.5 && <circle cx={150} cy={400} r={60 + 80 * ((frame % 30) / 30)} fill="none" stroke={ACCENT} strokeWidth={6} opacity={1 - (frame % 30) / 30} />}
  </g>
);

/** expanding sound rings from a point, for the drone listening or a plane's hum */
export const Rings: React.FC<{x: number; y: number; frame: number; c?: string; n?: number; r?: number; op?: number}> = ({x, y, frame, c = '#7cf0ff', n = 3,
  r = 260, op = 1}) => (
  <g opacity={op}>
    {Array.from({length: n}, (_, i) => {
      const p = ((frame / 40) + i / n) % 1;
      return <circle key={i} cx={x} cy={y} r={30 + r * p} fill="none" stroke={c} strokeWidth={6} opacity={(1 - p) * 0.8} />;
    })}
  </g>
);

/** a small single-engine plane, side view, facing left, with a gentle face-free silhouette */
export const Plane: React.FC<{x: number; y: number; s?: number; frame: number}> = ({x, y, s = 1, frame}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-160 0 Q-150 -40 -60 -40 L140 -30 Q170 -28 170 0 Q170 22 140 24 L-60 30 Q-150 30 -160 0Z" fill="#e9eefb" stroke={line('#e9eefb')} strokeWidth={6} />
    <path d="M100 -28 L160 -100 L184 -100 L160 -26Z" fill="#3f7bdc" stroke={line('#3f7bdc')} strokeWidth={5} strokeLinejoin="round" />
    <path d="M-40 4 L60 4 L20 70 L-10 70Z" fill="#3f7bdc" stroke={line('#3f7bdc')} strokeWidth={5} strokeLinejoin="round" />
    <rect x={-120} y={-30} width={70} height={24} rx={10} fill="#5c84c6" />
    <ellipse cx={-172} cy={0} rx={8} ry={50 * Math.abs(Math.sin(frame * 1.7))} fill="#9aa3bd" opacity={0.7} />
  </g>
);

/** wind arrows that stream across, `p` 0 to 1 sets how strong */
export const WindLines: React.FC<{x: number; y: number; w: number; frame: number; p: number}> = ({x, y, w, frame, p}) => (
  <g opacity={p}>
    {[0, 1, 2, 3].map((i) => {
      const off = ((frame * 9 + i * 170) % (w + 300)) - 150;
      return <path key={i} d={`M${x + off} ${y + i * 70} q60 -26 120 0 t120 0`} stroke="#ffffff" strokeWidth={10} fill="none" strokeLinecap="round"
        opacity={0.75} />;
    })}
  </g>
);

/** a measuring pole with a tick scale, `h` pixels tall standing on `y` */
export const HeightBar: React.FC<{x: number; y: number; h: number; p: number; c: string; label: string; w?: number}> = ({x, y, h, p, c, label, w = 70}) => {
  const hh = h * ease(p);
  return (
    <g>
      <rect x={x - w / 2} y={y - hh} width={w} height={hh} rx={w / 2} fill={shade(c, 0.2)} stroke={line(c)} strokeWidth={6} />
      <rect x={x - w / 2 + 8} y={y - hh + 8} width={w * 0.4} height={Math.max(0, hh - 16)} rx={w * 0.2} fill={light(c, 0.3)} opacity={0.7} />
      {p > 0.8 && <Word x={x} y={y - hh - 30} t={label} size={56} c="#ffffff" op={clamp01((p - 0.8) * 5)} />}
    </g>
  );
};

/** a round counter that ticks and lands */
export const Counter: React.FC<{x: number; y: number; value: string; c?: string; size?: number; w?: number; op?: number}> = ({x, y, value, c = ACCENT,
  size = 84, w = 520, op = 1}) => (
  <g opacity={op}>
    <LitBox x={x - w / 2} y={y - size * 0.95} w={w} h={size * 1.5} r={size * 0.6} c={c} />
    <Word x={x} y={y + size * 0.15} t={value} size={size} c="#ffffff" />
  </g>
);

/** a kitchen pass: a steel counter with a heat lamp, seen straight on, top at `y` */
export const KitchenPass: React.FC<{y: number; frame: number}> = ({y, frame}) => (
  <g>
    <rect x={0} y={y - 700} width={1080} height={700} fill="#ffcf9a" />
    <rect x={0} y={y - 700} width={1080} height={700} fill="url(#none)" />
    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <rect key={i} x={i * 140} y={y - 700} width={136} height={90} rx={12} fill="#fff1dd" opacity={0.6} />)}
    {[0, 1, 2].map((i) => (
      <g key={i}>
        <path d={`M${200 + i * 340} ${y - 700} L${200 + i * 340} ${y - 420}`} stroke="#5a6078" strokeWidth={6} />
        <path d={`M${140 + i * 340} ${y - 420} Q${200 + i * 340} ${y - 480} ${260 + i * 340} ${y - 420} Z`} fill="#3c4258" />
        <Glow x={200 + i * 340} y={y - 360} r={170} color="#ffb347" opacity={0.35 + 0.05 * Math.sin(frame / 7 + i)} />
      </g>
    ))}
    <rect x={0} y={y} width={1080} height={60} rx={0} fill="#c9d0de" stroke={line('#c9d0de')} strokeWidth={6} />
    <rect x={0} y={y + 6} width={1080} height={14} fill="#eef2f8" />
    <rect x={0} y={y + 60} width={1080} height={900} fill="#8a93a8" />
    <rect x={0} y={y + 60} width={1080} height={30} fill="#6f7890" />
  </g>
);

/** a map card of the area with a ring of radius `r` drawn on `p` */
export const RadiusMap: React.FC<{x: number; y: number; p: number; frame: number; w?: number}> = ({x, y, p, frame, w = 820}) => (
  <g transform={`translate(${x} ${y})`}>
    <LitBox x={-w / 2} y={-w / 2} w={w} h={w} r={60} c="#e9f3df" />
    {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${-w / 2 + 40} ${-260 + i * 130} Q0 ${-300 + i * 130} ${w / 2 - 60} ${-240 + i * 130}`}
      stroke="#cfdcc2" strokeWidth={12} fill="none" strokeLinecap="round" />)}
    {[0, 1, 2, 3].map((i) => <path key={`v${i}`} d={`M${-260 + i * 170} ${-w / 2 + 40} Q${-230 + i * 170} 0 ${-270 + i * 170} ${w / 2 - 60}`}
      stroke="#cfdcc2" strokeWidth={12} fill="none" strokeLinecap="round" />)}
    <path d="M-380 120 Q-100 40 120 160 T380 120" stroke="#8cc4ef" strokeWidth={18} fill="none" strokeLinecap="round" />
    <circle cx={0} cy={0} r={300 * ease(p)} fill={ACCENT} opacity={0.12} />
    <circle cx={0} cy={0} r={300 * ease(p)} fill="none" stroke={ACCENT} strokeWidth={8} strokeDasharray="26 18"
      strokeDashoffset={-frame * 2} />
    <circle cx={0} cy={0} r={26} fill={ACCENT} stroke={line(ACCENT)} strokeWidth={6} />
    <path d={`M0 0 L${300 * ease(p)} 0`} stroke="#3a3550" strokeWidth={6} strokeLinecap="round" />
  </g>
);

/** a remote pilot's console: a wide rounded screen with a map and a dot moving on a path */
export const Console: React.FC<{x: number; y: number; s?: number; frame: number; alert?: number; dot?: number}> = ({x, y, s = 1, frame, alert = 0,
  dot = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ContactShadow x={0} y={260} w={600} opacity={0.3} />
    <rect x={-30} y={150} width={60} height={110} rx={20} fill="#3c4258" />
    <rect x={-330} y={-190} width={660} height={360} rx={44} fill="#22263a" stroke="#141726" strokeWidth={8} />
    <rect x={-306} y={-166} width={612} height={312} rx={30} fill="#1b3a4f" />
    <path d="M-260 100 Q-120 -60 0 20 T260 -100" stroke="#62f0ff" strokeWidth={8} fill="none" strokeDasharray="20 14" strokeLinecap="round" />
    {(() => { const t = clamp01(dot); const px = lerp(-260, 260, t); const py = 100 - 200 * t + 60 * Math.sin(t * Math.PI * 2);
      return <g><circle cx={px} cy={py} r={18} fill={ACCENT} /><circle cx={px} cy={py} r={18 + 20 * ((frame % 24) / 24)} fill="none" stroke={ACCENT} strokeWidth={4}
        opacity={1 - (frame % 24) / 24} /></g>; })()}
    {alert > 0 && <g opacity={alert}><rect x={-306} y={-166} width={612} height={312} rx={30} fill="none" stroke="#ffcf3a" strokeWidth={12} />
      <rect x={-160} y={-150} width={320} height={64} rx={32} fill="#ffcf3a" />
      <text x={0} y={-106} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={36} fill="#3a2a00">OVERRIDE</text></g>}
  </g>
);

/** rain streaks over the frame */
export const Rain: React.FC<{frame: number; p: number}> = ({frame, p}) => (
  <g opacity={p}>
    {Array.from({length: 40}, (_, i) => {
      const x0 = (i * 97) % 1100;
      const y0 = ((frame * 38 + i * 211) % 2100) - 100;
      return <line key={i} x1={x0} y1={y0} x2={x0 - 18} y2={y0 + 70} stroke="#cfe6ff" strokeWidth={5} strokeLinecap="round" opacity={0.6} />;
    })}
  </g>
);

/** a kitchen scale with a needle that swings to `p` of full */
export const Scale: React.FC<{x: number; y: number; s?: number; p: number; label?: string}> = ({x, y, s = 1, p, label}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ContactShadow x={0} y={150} w={420} opacity={0.35} />
    <rect x={-200} y={40} width={400} height={110} rx={40} fill={shade('#5ec2a8', 0.2)} stroke={line('#5ec2a8')} strokeWidth={7} />
    <rect x={-190} y={46} width={360} height={90} rx={34} fill="#5ec2a8" />
    <rect x={-220} y={10} width={440} height={36} rx={18} fill="#e8edf6" stroke={line('#e8edf6')} strokeWidth={6} />
    <circle cx={0} cy={95} r={38} fill="#fff6e6" />
    <line x1={0} y1={95} x2={30 * Math.sin((p - 0.5) * 2.4)} y2={95 - 30 * Math.cos((p - 0.5) * 2.4)} stroke="#e2574c" strokeWidth={6} strokeLinecap="round" />
    {label && <Word x={130} y={112} t={label} size={40} c="#ffffff" />}
  </g>
);
