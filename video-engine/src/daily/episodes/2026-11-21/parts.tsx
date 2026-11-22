import React from 'react';
import {ContactShadow, Glow, clamp01, ease, easeOutBack, lerp} from '../../../look/Kit';
import {Visor, type MachineMood} from '../../../look/machines';
import {line, light, shade} from '../../../look/color';
import {FONT} from '../../../lib/type';

/**
 * curb-camera-1121 parts. Every drawing here is original and follows LOOK_V2: round corners, a key from the upper
 * left, shade toward violet, hue-tinted line, a contact shadow under anything that stands. The truck, the houses,
 * the office and the notice are illustrative, never a real site, and no product's or city's mark is drawn.
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

export const Tyre: React.FC<{cx: number; cy: number; r: number; spin: number}> = ({cx, cy, r, spin}) => (
  <g transform={`translate(${cx} ${cy})`}>
    <circle r={r} fill="#26223d" stroke={line('#26223d')} strokeWidth={r * 0.08} />
    <circle r={r * 0.6} fill="#dfe3ee" stroke={shade('#dfe3ee', 0.4)} strokeWidth={r * 0.06} />
    <g transform={`rotate(${spin})`}>{[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={Math.cos(a * Math.PI / 180) * r * 0.34}
      cy={Math.sin(a * Math.PI / 180) * r * 0.34} r={r * 0.08} fill="#8a90a8" />)}</g>
    <circle r={r * 0.16} fill="#8a90a8" />
    <path d={`M${-r * 0.5} ${-r * 0.3} A${r * 0.6} ${r * 0.6} 0 0 1 ${r * 0.1} ${-r * 0.56}`} stroke="#ffffff" strokeWidth={r * 0.08}
      fill="none" strokeLinecap="round" opacity={0.7} />
  </g>
);

/**
 * THE HERO. The camera on the truck's roof, with a face. A rounded white housing on a short mast, a big lens that is
 * its one eye, brows that act, and a flash that fires when it takes a still. `look` -1 to 1 turns the eye.
 */
export const RoofCam: React.FC<{x: number; y: number; s?: number; frame: number; mood?: 'curious' | 'happy' | 'worried' | 'focused' | 'sleepy';
  flash?: number; look?: number; blur?: number}> = ({x, y, s = 1, frame, mood = 'curious', flash = 0, look = 0, blur = 0}) => {
  const blink = (frame % 97) < 4 ? [1, 0.35, 0.1, 0.6][frame % 97] : 1;
  const bob = Math.sin(frame / 11) * 3;
  const browL = mood === 'worried' ? 'M-62 -78 L-18 -66' : mood === 'focused' ? 'M-62 -66 L-18 -78' : mood === 'happy' ? 'M-62 -78 Q-40 -92 -18 -80' : 'M-62 -80 Q-40 -88 -18 -78';
  const browR = mood === 'worried' ? 'M62 -78 L18 -66' : mood === 'focused' ? 'M62 -66 L18 -78' : mood === 'happy' ? 'M62 -78 Q40 -92 18 -80' : 'M62 -74 Q40 -82 18 -76';
  const eyeR = mood === 'sleepy' ? 0.5 : 1;
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${s})`}>
      <rect x={-12} y={-10} width={24} height={70} rx={10} fill="#8a90a8" stroke={line('#8a90a8')} strokeWidth={5} />
      <rect x={-96} y={-120} width={192} height={124} rx={56} fill="#f4f6fb" stroke={line('#c9d0e4')} strokeWidth={7} />
      <rect x={-96} y={-56} width={192} height={60} rx={30} fill={shade('#f4f6fb', 0.18)} />
      <path d="M-70 -104 Q-20 -116 30 -108" stroke="#ffffff" strokeWidth={10} strokeLinecap="round" opacity={0.9} fill="none" />
      {/* the lens is the eye */}
      <circle cx={look * 8} cy={-56} r={44} fill="#1d2150" stroke={line('#1d2150')} strokeWidth={6} />
      <g transform={`translate(${look * 14} -56) scale(1 ${blink * eyeR})`}>
        <circle r={30} fill="#2f6bff" />
        <circle r={18} fill="#0c0e29" />
        <circle cx={-10} cy={-12} r={8} fill="#ffffff" opacity={0.9} />
        <circle cx={9} cy={8} r={3.5} fill="#ffffff" opacity={0.7} />
      </g>
      <path d={browL} stroke="#3b3f63" strokeWidth={9} strokeLinecap="round" fill="none" transform="translate(-6 0)" />
      <path d={browR} stroke="#3b3f63" strokeWidth={9} strokeLinecap="round" fill="none" transform="translate(6 0)" />
      {/* the little red record light */}
      <circle cx={70} cy={-96} r={8} fill={Math.floor(frame / 15) % 2 ? '#ff5d5d' : '#ffb0b0'} />
      {flash > 0 && <g opacity={clamp01(1 - flash)}>
        <Glow x={look * 14} y={-56} r={260} color="#ffffff" opacity={0.9} />
        {Array.from({length: 8}, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          const r0 = 60 + flash * 60, r1 = 110 + flash * 140;
          return <path key={i} d={`M${Math.cos(a) * r0} ${-56 + Math.sin(a) * r0} L${Math.cos(a) * r1} ${-56 + Math.sin(a) * r1}`}
            stroke="#fff6c8" strokeWidth={10} strokeLinecap="round" />;
        })}
      </g>}
      {blur > 0 && <Glow x={0} y={-56} r={120} color="#7dd3fc" opacity={0.4 * blur} />}
    </g>
  );
};

/**
 * THE SANITATION TRUCK, side on, facing right. A blue cab-over with a rounded nose, the bulky-item body with a
 * knuckle boom and a grapple folded on top, and the RoofCam on the cab. `speed` spins wheels and adds wind lines.
 * The truck itself gets a face in its windscreen only when `mood` is given. Units are pixels at `s` 1, about 900 wide.
 */
export const BulkyTruck: React.FC<{x: number; y: number; s?: number; frame: number; speed?: number; mood?: MachineMood;
  cam?: React.ComponentProps<typeof RoofCam> | null; grapple?: number; load?: number; facing?: 1 | -1}> = ({
  x, y, s = 1, frame, speed = 0, mood, cam, grapple = 0, load = 0, facing = 1}) => {
  const spin = frame * speed * 16;
  const bounce = Math.sin(frame * 0.8) * 3 * speed;
  const paint = '#2f7fe0';
  const body = '#f2f4f8';
  return (
    <g transform={`translate(${x} ${y}) scale(${s * facing} ${s})`}>
      <ContactShadow x={-40} y={8} w={1000} opacity={0.34} />
      <g transform={`translate(0 ${bounce})`}>
        <rect x={-470} y={-130} width={900} height={46} rx={20} fill="#3a3550" />
        {/* the body: an open rounded bin with a load inside */}
        <path d="M-470 -120 L-470 -330 Q-470 -360 -440 -360 L60 -360 Q90 -360 90 -330 L90 -120 Z" fill={body} stroke={line(body)} strokeWidth={8}
          strokeLinejoin="round" />
        <rect x={-460} y={-250} width={540} height={46} rx={22} fill={paint} />
        <rect x={-460} y={-196} width={540} height={14} rx={7} fill="#36b37e" />
        <path d="M-440 -340 Q-200 -352 60 -344" stroke="#ffffff" strokeWidth={12} strokeLinecap="round" opacity={0.85} fill="none" />
        {load > 0 && <g opacity={clamp01(load * 2)}>
          <rect x={-420} y={-360 - 70 * load} width={160} height={80} rx={22} fill="#b5733f" stroke={line('#b5733f')} strokeWidth={6} />
          <rect x={-240} y={-360 - 50 * load} width={110} height={60} rx={16} fill="#8bb174" stroke={line('#8bb174')} strokeWidth={6} />
          <path d={`M-110 ${-360 - 60 * load} l70 30 l-20 30`} stroke="#9aa3bd" strokeWidth={14} strokeLinecap="round" fill="none" />
        </g>}
        {/* the knuckle boom, folded down by default, raised by grapple 0 to 1 */}
        <g transform={`translate(70 -360) rotate(${-lerp(8, 62, grapple)})`}>
          <rect x={-300} y={-22} width={320} height={44} rx={22} fill="#ffc93c" stroke={line('#ffc93c')} strokeWidth={6} />
          <g transform={`translate(-290 0) rotate(${lerp(-170, -100, grapple)})`}>
            <rect x={0} y={-18} width={220} height={36} rx={18} fill="#ffc93c" stroke={line('#ffc93c')} strokeWidth={6} />
            <g transform="translate(220 0)">
              <circle r={22} fill="#3a3550" />
              {[-1, 1].map((k) => <path key={k} d={`M0 0 Q${30 * k} 40 ${14 * k} 80`} stroke="#3a3550" strokeWidth={14} strokeLinecap="round" fill="none" />)}
            </g>
          </g>
          <circle cx={0} cy={0} r={26} fill={shade('#ffc93c', 0.3)} stroke={line('#ffc93c')} strokeWidth={6} />
        </g>
        {/* the cab-over: a tall rounded box with a big windscreen */}
        <path d="M110 -120 L110 -430 Q110 -470 150 -470 L370 -470 Q420 -470 428 -420 L440 -170 Q442 -120 400 -120 Z" fill={paint}
          stroke={line(paint)} strokeWidth={9} strokeLinejoin="round" />
        <path d="M130 -446 Q240 -460 380 -452" stroke="#ffffff" strokeWidth={12} strokeLinecap="round" opacity={0.55} fill="none" />
        <path d="M250 -440 L396 -440 Q414 -440 416 -420 L424 -300 L250 -300 Q236 -300 236 -314 L236 -426 Q236 -440 250 -440 Z" fill="#1d2150"
          stroke={line(paint)} strokeWidth={7} />
        {mood ? <Visor x={330} y={-370} w={150} h={84} mood={mood} frame={frame} />
          : <path d="M262 -424 L330 -424" stroke="#ffffff" strokeWidth={10} strokeLinecap="round" opacity={0.3} />}
        <rect x={130} y={-410} width={86} height={110} rx={20} fill="#1d2150" opacity={0.85} />
        <rect x={150} y={-280} width={14} height={60} rx={7} fill={shade(paint, 0.4)} />
        <rect x={420} y={-200} width={30} height={60} rx={12} fill="#fff6c8" />
        <Glow x={450} y={-170} r={70} color="#fff3b0" opacity={0.35} />
        <rect x={380} y={-150} width={80} height={30} rx={12} fill="#d9dde8" stroke={line('#d9dde8')} strokeWidth={5} />
        {/* amber beacon */}
        <rect x={140} y={-500} width={60} height={30} rx={14} fill="#ffb020" />
        <Glow x={170} y={-486} r={60} color="#ffb020" opacity={0.3 + 0.3 * Math.sin(frame * 0.5)} />
        {cam && <RoofCam {...cam} x={330} y={-488} s={(cam.s ?? 1) * 0.8} />}
      </g>
      <Tyre cx={330} cy={-70} r={74} spin={spin} />
      <Tyre cx={-250} cy={-70} r={74} spin={spin} />
      <Tyre cx={-400} cy={-70} r={74} spin={spin} />
      {speed > 0.2 && [0, 1, 2].map((i) => <path key={i} d={`M-520 ${-170 - i * 90} l${-150 - i * 40} 0`} stroke="#ffffff" strokeWidth={14}
        strokeLinecap="round" opacity={0.4 * speed} />)}
    </g>
  );
};

/**
 * THE PHOTO. A still from the roof camera: a rounded white print with a house in it, an optional curb object, a car
 * whose plate is a blur bar, and an optional person whose face is a blur disc. `box` 0 to 1 draws the AI's flag
 * around the curb object, `check` 0 to 1 stamps the analyst's decision.
 */
export const Photo: React.FC<{x: number; y: number; s?: number; rot?: number; frame: number; box?: number; boxLabel?: string;
  blur?: number; item?: 'couch' | 'grass' | 'fence' | 'none'; verdict?: 'yes' | 'no' | null; stamp?: number; seed?: number}> = ({
  x, y, s = 1, rot = 0, frame, box = 0, boxLabel = 'POSSIBLE ISSUE', blur = 1, item = 'couch', verdict = null, stamp = 0, seed = 1}) => {
  const brick = ['#c0603e', '#b5733f', '#a65a48'][seed % 3];
  const sky = '#8fc7ff';
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <rect x={-250} y={-200} width={520} height={440} rx={34} fill="#2b1d5e" opacity={0.25} transform="translate(14 18)" />
      <rect x={-260} y={-210} width={520} height={440} rx={34} fill="#fffaf0" stroke={line('#fffaf0')} strokeWidth={6} />
      <clipPath id={`ph-${seed}`}><rect x={-230} y={-180} width={460} height={330} rx={22} /></clipPath>
      <g clipPath={`url(#ph-${seed})`}>
        <rect x={-230} y={-180} width={460} height={330} fill={sky} />
        <rect x={-230} y={40} width={460} height={110} fill="#7cbf5a" />
        <rect x={-230} y={110} width={460} height={40} fill="#c9c3bb" />
        {/* the house */}
        <path d="M-190 40 L-190 -60 L-200 -60 L-60 -140 L120 -140 L220 -60 L210 -60 L210 40 Z" fill={brick} stroke={line(brick)} strokeWidth={5} />
        <path d="M-200 -60 L-60 -140 L120 -140 L220 -60 Z" fill="#5a4a6b" />
        <rect x={-150} y={-40} width={70} height={50} rx={10} fill="#ffe7a6" stroke={line(brick)} strokeWidth={4} />
        <rect x={110} y={-40} width={70} height={50} rx={10} fill="#ffe7a6" stroke={line(brick)} strokeWidth={4} />
        <rect x={-10} y={-50} width={60} height={90} rx={14} fill="#7a3b2a" />
        {item === 'grass' && Array.from({length: 18}, (_, i) => <path key={i} d={`M${-220 + i * 26} 110 q6 -60 14 -80`} stroke="#3f8f3a"
          strokeWidth={10} strokeLinecap="round" fill="none" />)}
        {item === 'fence' && <path d="M-230 60 L-120 60 L-90 90 L-40 50 L40 60" stroke="#a07040" strokeWidth={14} strokeLinecap="round" fill="none" />}
        {item === 'couch' && <g transform="translate(-130 116)">
          <rect x={-60} y={-46} width={120} height={50} rx={16} fill="#c06b8f" stroke={line('#c06b8f')} strokeWidth={4} />
          <rect x={-70} y={-30} width={22} height={40} rx={10} fill="#a85579" />
          <rect x={48} y={-30} width={22} height={40} rx={10} fill="#a85579" />
        </g>}
        {/* the car at the curb, plate blurred */}
        <g transform="translate(120 128)">
          <rect x={-70} y={-44} width={140} height={44} rx={18} fill="#e06b4a" />
          <rect x={-46} y={-70} width={92} height={34} rx={14} fill="#e06b4a" />
          <rect x={-20} y={-22} width={40} height={16} rx={6} fill="#ffffff" />
          {blur > 0 && <rect x={-26} y={-26} width={52} height={24} rx={10} fill="#c7d2fe" opacity={0.95 * blur} />}
        </g>
        {/* a neighbour walking a dog, face blurred */}
        <g transform="translate(40 110)">
          <rect x={-10} y={-70} width={20} height={60} rx={10} fill="#3d5a8a" />
          <circle cx={0} cy={-86} r={16} fill="#8a5a3c" />
          {blur > 0 && <circle cx={0} cy={-86} r={22} fill="#c7d2fe" opacity={0.95 * blur} />}
        </g>
      </g>
      {/* the AI's flag */}
      {box > 0 && item !== 'none' && <g opacity={clamp01(box * 2)}>
        <rect x={lerp(-240, -210, box)} y={lerp(30, 60, box)} width={lerp(240, 170, box)} height={lerp(150, 90, box)} rx={14} fill="none"
          stroke="#ffcc00" strokeWidth={8} strokeDasharray={box < 1 ? '22 12' : '0'} />
        <rect x={-214} y={14} width={Math.max(150, boxLabel.length * 15 + 26)} height={40} rx={20} fill="#ffcc00" />
        <text x={-200} y={42} fontFamily={FONT.body} fontWeight={900} fontSize={24} fill="#3a2a00">{boxLabel}</text>
      </g>}
      {/* the time strip at the bottom of the print */}
      <rect x={-230} y={170} width={200} height={26} rx={13} fill="#e8e2d6" />
      <circle cx={210} cy={183} r={12} fill={Math.floor(frame / 20) % 2 ? '#ff5d5d' : '#ffb0b0'} />
      {verdict && stamp > 0 && <g transform={`translate(150 -110) scale(${easeOutBack(clamp01(stamp), 2)}) rotate(-12)`}>
        <circle r={62} fill={verdict === 'yes' ? '#36b37e' : '#ff6b6b'} stroke={line(verdict === 'yes' ? '#36b37e' : '#ff6b6b')} strokeWidth={7} />
        {verdict === 'yes' ? <path d="M-26 0 L-6 22 L30 -22" stroke="#ffffff" strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          : <path d="M-22 -22 L22 22 M22 -22 L-22 22" stroke="#ffffff" strokeWidth={14} strokeLinecap="round" />}
      </g>}
    </g>
  );
};

/**
 * THE COURTESY NOTICE. A door hanger in warm cream with a rounded cut-out, a heading bar, lines, and a QR square.
 * `qr` 0 to 1 draws the QR in. `es` adds a second language tab peeking out behind it.
 */
export const Notice: React.FC<{x: number; y: number; s?: number; rot?: number; qr?: number; es?: number; title?: string; frame: number}> = ({
  x, y, s = 1, rot = 0, qr = 0, es = 0, title = 'COURTESY NOTICE', frame}) => {
  const sway = Math.sin(frame / 14) * 2;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot + sway}) scale(${s})`}>
      {es > 0 && <g transform={`translate(${30 * es} ${-20 * es}) rotate(${8 * es})`} opacity={clamp01(es * 2)}>
        <rect x={-150} y={-260} width={300} height={560} rx={40} fill="#ffd9a8" stroke={line('#ffd9a8')} strokeWidth={6} />
        <text x={120} y={-200} textAnchor="end" fontFamily={FONT.body} fontWeight={900} fontSize={34} fill={line('#ffd9a8')}>ES</text>
      </g>}
      <rect x={-150} y={-260} width={300} height={560} rx={40} fill="#2b1d5e" opacity={0.22} transform="translate(12 16)" />
      <path d="M-150 -220 Q-150 -260 -110 -260 L110 -260 Q150 -260 150 -220 L150 260 Q150 300 110 300 L-110 300 Q-150 300 -150 260 Z"
        fill="#fff8e8" stroke={line('#fff8e8')} strokeWidth={6} />
      <circle cx={0} cy={-190} r={46} fill="#5a4a6b" opacity={0.85} />
      <circle cx={0} cy={-190} r={38} fill={shade('#5a4a6b', 0.3)} />
      <rect x={-120} y={-120} width={240} height={56} rx={20} fill="#2f7fe0" />
      <text x={0} y={-82} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={title.length > 14 ? 22 : 28} fill="#ffffff">{title}</text>
      {[0, 1, 2, 3].map((i) => <rect key={i} x={-110} y={-36 + i * 34} width={i === 3 ? 140 : 220} height={14} rx={7} fill="#cfc6b6" />)}
      {qr > 0 && <g transform="translate(0 200)" opacity={clamp01(qr * 1.5)}>
        <rect x={-74} y={-74} width={148} height={148} rx={18} fill="#ffffff" stroke="#3a3550" strokeWidth={6} />
        {Array.from({length: 36}, (_, i) => {
          const cx = i % 6, cy = Math.floor(i / 6);
          const on = ((cx * 7 + cy * 13 + cx * cy) % 3) === 0 && i / 36 < qr;
          return on ? <rect key={i} x={-60 + cx * 20} y={-60 + cy * 20} width={18} height={18} rx={4} fill="#3a3550" /> : null;
        })}
        {[[-60, -60], [24, -60], [-60, 24]].map(([a, b], i) => <rect key={`f${i}`} x={a} y={b} width={36} height={36} rx={8} fill="none"
          stroke="#3a3550" strokeWidth={8} />)}
      </g>}
    </g>
  );
};

/** a monitor on a desk with children drawn on its screen (screen space is 0..w, 0..h) */
export const Monitor: React.FC<{x: number; y: number; w?: number; h?: number; children?: React.ReactNode; glow?: string}> = ({
  x, y, w = 640, h = 400, children, glow = '#7dd3fc'}) => (
  <g transform={`translate(${x} ${y})`}>
    <Glow x={w / 2} y={h / 2} r={w * 0.7} color={glow} opacity={0.25} />
    <rect x={w / 2 - 30} y={h} width={60} height={90} rx={14} fill="#5a5f7a" />
    <rect x={w / 2 - 120} y={h + 80} width={240} height={30} rx={15} fill="#4a4f6a" />
    <rect x={-22} y={-22} width={w + 44} height={h + 44} rx={34} fill="#2a2d4a" stroke={line('#2a2d4a')} strokeWidth={6} />
    <clipPath id={`mon-${x}-${y}`}><rect x={0} y={0} width={w} height={h} rx={18} /></clipPath>
    <rect x={0} y={0} width={w} height={h} rx={18} fill="#132046" />
    <g clipPath={`url(#mon-${x}-${y})`}>{children}</g>
    <path d={`M14 18 Q${w * 0.3} 6 ${w * 0.6} 14`} stroke="#ffffff" strokeWidth={8} strokeLinecap="round" opacity={0.18} fill="none" />
  </g>
);

/** THE OFFICE. A cool blue wall with a window cut through (the stage draws the county behind) and a long desk */
export type Win = {x: number; y: number; w: number; h: number};
export const WIN: Record<'wide' | 'medium', Win> = {wide: {x: 96, y: 440, w: 888, h: 540}, medium: {x: 40, y: 410, w: 1000, h: 640}};
export const Office: React.FC<{frame: number; win?: Win | null; deskY?: number; wall?: string}> = ({frame, win = WIN.wide, deskY = 1300,
  wall = '#7aa6e8'}) => {
  const r = 46;
  const hole = win ? `M${win.x + r} ${win.y} H${win.x + win.w - r} Q${win.x + win.w} ${win.y} ${win.x + win.w} ${win.y + r} V${win.y + win.h - r} Q${win.x + win.w} ${win.y + win.h} ${win.x + win.w - r} ${win.y + win.h} H${win.x + r} Q${win.x} ${win.y + win.h} ${win.x} ${win.y + win.h - r} V${win.y + r} Q${win.x} ${win.y} ${win.x + r} ${win.y} Z` : '';
  return (
    <g>
      <defs>
        <linearGradient id="of-wall" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={light(wall, 0.25)} /><stop offset="1" stopColor={shade(wall, 0.3)} />
        </linearGradient>
        <linearGradient id="of-desk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9a46a" /><stop offset="1" stopColor={shade('#d9a46a', 0.35)} />
        </linearGradient>
      </defs>
      <path d={`M-60 -60 H1140 V1980 H-60 Z ${hole}`} fill="url(#of-wall)" fillRule="evenodd" />
      {win && <rect x={win.x} y={win.y} width={win.w} height={win.h} rx={r} fill="none" stroke="#f4f6fb" strokeWidth={22} />}
      {win && <path d={`M${win.x + win.w / 2} ${win.y} V${win.y + win.h}`} stroke="#f4f6fb" strokeWidth={14} />}
      {/* a cork strip with a city map and pinned photos */}
      <rect x={120} y={win ? win.y + win.h + 40 : 300} width={360} height={140} rx={22} fill="#c9925e" stroke={line('#c9925e')} strokeWidth={5} />
      {[0, 1, 2].map((i) => <rect key={i} x={140 + i * 110} y={(win ? win.y + win.h + 60 : 320) + (i % 2) * 10} width={90} height={70} rx={10}
        fill={['#fffaf0', '#ffe7a6', '#d5f5e3'][i]} transform={`rotate(${(i - 1) * 5} ${185 + i * 110} ${(win ? win.y + win.h + 95 : 355)})`} />)}
      <rect x={-60} y={deskY} width={1200} height={760} fill="url(#of-desk)" />
      <rect x={-60} y={deskY} width={1200} height={22} fill={light('#d9a46a', 0.45)} />
      <Glow x={900} y={deskY - 300} r={300} color="#fff3c4" opacity={0.18 + 0.03 * Math.sin(frame / 20)} />
    </g>
  );
};

/** a steaming coffee mug */
export const Mug: React.FC<{x: number; y: number; s?: number; frame: number}> = ({x, y, s = 1, frame}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ContactShadow x={0} y={4} w={110} opacity={0.3} />
    <rect x={-40} y={-90} width={80} height={90} rx={20} fill="#ff8a5b" stroke={line('#ff8a5b')} strokeWidth={6} />
    <path d="M40 -66 Q74 -60 70 -36 Q66 -16 40 -20" stroke={line('#ff8a5b')} strokeWidth={10} fill="none" />
    {[0, 1].map((i) => <path key={i} d={`M${-12 + i * 22} -100 q${10 * Math.sin(frame / 10 + i)} -20 0 -40`} stroke="#ffffff" strokeWidth={6}
      strokeLinecap="round" fill="none" opacity={0.5} />)}
  </g>
);

/** the side of the truck seen up close, below a band at `y`: a stripe, rivets, a wheel arch and a turning tyre */
export const TruckSide: React.FC<{y: number; frame: number; speed?: number}> = ({y, frame, speed = 0.6}) => (
  <g>
    <rect x={-40} y={y} width={1160} height={1000} fill="#2f7fe0" />
    <rect x={-40} y={y} width={1160} height={24} fill={light('#2f7fe0', 0.4)} />
    <rect x={-40} y={y + 120} width={1160} height={44} rx={20} fill="#36b37e" />
    <rect x={-40} y={y + 176} width={1160} height={16} rx={8} fill="#f2f4f8" opacity={0.8} />
    {Array.from({length: 12}, (_, i) => <circle key={i} cx={40 + i * 92} cy={y + 60} r={7} fill={shade('#2f7fe0', 0.3)} />)}
    <path d={`M600 ${y + 640} A230 230 0 0 1 1060 ${y + 640} Z`} fill="#1d2150" />
    <Tyre cx={830} cy={y + 640} r={200} spin={frame * speed * 10} />
    <rect x={80} y={y + 260} width={260} height={90} rx={30} fill="#f2f4f8" opacity={0.9} />
    <rect x={110} y={y + 290} width={200} height={30} rx={15} fill="#9aa3bd" />
  </g>
);

/**
 * A DALLAS FRONT YARD to the street: a mowed lawn from `lawn` down, a pale sidewalk at `walk`, the curb and the asphalt
 * to the bottom of the frame. It replaces the open field the region plate would otherwise show at a house's feet.
 */
export const Yard: React.FC<{lawn: number; walk: number; frame?: number}> = ({lawn, walk}) => (
  <g>
    <defs><linearGradient id={`yard-${lawn}`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#5fae46" /><stop offset="1" stopColor="#79c257" /></linearGradient></defs>
    <rect x={-60} y={lawn} width={1200} height={walk - lawn + 4} fill={`url(#yard-${lawn})`} />
    {Array.from({length: 9}, (_, i) => <rect key={i} x={-60 + i * 140} y={lawn} width={70} height={walk - lawn} fill="#ffffff" opacity={0.05} />)}
    <rect x={-60} y={walk} width={1200} height={46} fill="#e4ddd0" />
    {Array.from({length: 9}, (_, i) => <rect key={i} x={-40 + i * 140} y={walk} width={4} height={46} fill="#c9c0b0" />)}
    <rect x={-60} y={walk + 46} width={1200} height={20} fill="#f2ede4" />
    <rect x={-60} y={walk + 66} width={1200} height={14} fill="#b8b0a2" />
    <rect x={-60} y={walk + 80} width={1200} height={1200} fill="#5b5d73" />
  </g>
);
