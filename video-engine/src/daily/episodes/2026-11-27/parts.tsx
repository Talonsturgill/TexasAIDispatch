import React from 'react';
import {ContactShadow, Glow, clamp01, ease, easeOutBack, lerp} from '../../../look/Kit';
import {line, light, shade} from '../../../look/color';
import {FONT} from '../../../lib/type';

/**
 * scan-line-1127 parts. Every drawing is original and follows LOOK_V2: round corners, a key from the upper left,
 * shade toward violet, hue-tinted line, a contact shadow under anything that stands. The reading room, the
 * scanner, the router and the screens are illustrative, not the real hospital. No company's mark is drawn and
 * no real person's likeness.
 */

export const after = (since: number, dur: number) => (since < 0 ? 0 : ease(since / dur));
export const pop = (since: number, dur = 0.5, k = 1.7) => (since < 0 ? 0 : easeOutBack(clamp01(since / dur), k));

export const HEAT = '#ff8a3d';
export const CYAN = '#38e0f2';
export const CARD = '#f3f6ff';
export const SLICE = '#1c2448';

/** bold text with a deep rim of its own hue */
export const Word: React.FC<{x: number; y: number; t: string; size?: number; c?: string; anchor?: 'start' | 'middle' | 'end'; op?: number;
  rot?: number; weight?: number}> = ({x, y, t, size = 48, c = '#fff6e6', anchor = 'middle', op = 1, rot = 0, weight = 900}) => (
  <g opacity={op} transform={`rotate(${rot} ${x} ${y})`}>
    <text x={x} y={y} textAnchor={anchor} fontFamily={FONT.body} fontWeight={weight} fontSize={size} fill={line(c)} stroke={line(c)}
      strokeWidth={size * 0.18} strokeLinejoin="round">{t}</text>
    <text x={x} y={y} textAnchor={anchor} fontFamily={FONT.body} fontWeight={weight} fontSize={size} fill={c}>{t}</text>
  </g>
);

/** plain dark text on paper */
export const Ink: React.FC<{x: number; y: number; t: string; size?: number; c?: string; anchor?: 'start' | 'middle' | 'end'; weight?: number;
  op?: number}> = ({x, y, t, size = 40, c = '#26304f', anchor = 'start', weight = 700, op = 1}) => (
  <text x={x} y={y} textAnchor={anchor} fontFamily={FONT.body} fontWeight={weight} fontSize={size} fill={c} opacity={op}>{t}</text>
);

/** a lit rounded box */
export const LitBox: React.FC<{x: number; y: number; w: number; h: number; r?: number; c: string; sw?: number; op?: number}> = ({
  x, y, w, h, r = 24, c, sw = 7, op = 1}) => (
  <g opacity={op}>
    <rect x={x} y={y} width={w} height={h} rx={r} fill={shade(c, 0.25)} stroke={line(c)} strokeWidth={sw} />
    <rect x={x + sw * 0.6} y={y + sw * 0.6} width={w * 0.94 - sw} height={h * 0.9 - sw} rx={Math.max(4, r - sw)} fill={c} />
    <rect x={x + w * 0.08} y={y + h * 0.08} width={w * 0.5} height={Math.max(4, h * 0.05)} rx={Math.max(2, h * 0.025)} fill={light(c, 0.55)} opacity={0.7} />
  </g>
);

/** a CT slice: the body outline, two lungs, the spine; `heat` blooms an orange map at (hx, hy), in a 200 x 160 box */
export const Slice: React.FC<{heat?: number; hx?: number; hy?: number; frame: number; red?: number}> = ({heat = 0, hx = 136, hy = 92, frame, red = 0}) => (
  <g>
    <rect x={0} y={0} width={200} height={160} rx={18} fill={SLICE} />
    <ellipse cx={100} cy={84} rx={84} ry={62} fill="#8790b4" />
    <ellipse cx={100} cy={84} rx={76} ry={55} fill="#a9b1d1" />
    <path d="M58 46 C34 60 34 112 60 124 C76 128 86 112 86 92 C86 66 78 46 58 46Z" fill="#2a2f55" />
    <path d="M142 46 C166 60 166 112 140 124 C124 128 114 112 114 92 C114 66 122 46 142 46Z" fill="#2a2f55" />
    {[0, 1, 2].map((i) => <path key={i} d={`M${56 + i * 6} ${70 + i * 18} q12 -6 22 4`} stroke="#4a5384" strokeWidth={3} fill="none" strokeLinecap="round" />)}
    {[0, 1, 2].map((i) => <path key={`r${i}`} d={`M${122 + i * 4} ${74 + i * 16} q12 -6 22 4`} stroke="#4a5384" strokeWidth={3} fill="none" strokeLinecap="round" />)}
    <circle cx={100} cy={124} r={12} fill="#eef1ff" />
    <ellipse cx={100} cy={70} rx={12} ry={16} fill="#c9cfe8" />
    {heat > 0 && (
      <g opacity={clamp01(heat)}>
        <circle cx={hx} cy={hy} r={34 * heat + Math.sin(frame / 6) * 2} fill={HEAT} opacity={0.35} />
        <circle cx={hx} cy={hy} r={22 * heat} fill="#ffb347" opacity={0.6} />
        <circle cx={hx} cy={hy} r={11 * heat} fill="#fff1a8" opacity={0.9} />
      </g>
    )}
    {red > 0 && <rect x={0} y={0} width={200} height={160} rx={18} fill="#ff4d5e" opacity={red * 0.25} />}
  </g>
);

export type CardMood = 'sleepy' | 'worried' | 'sweat' | 'blush' | 'happy' | 'calm' | 'sheepish' | 'proud';

/**
 * THE HERO. A scan card: a rounded white card with a CT slice on its screen and a face on its lower panel. `heat`
 * blooms the heat map and turns the card's rim orange, `flag` pops a little red flag on its corner, `stamp` lands
 * a READ stamp. Centred at (x, y), 240 x 310 at s 1.
 */
export const ScanCard: React.FC<{x: number; y: number; s?: number; frame: number; mood?: CardMood; heat?: number; flag?: number;
  stamp?: number; tilt?: number; tint?: string; hx?: number; hy?: number; grey?: number}> = ({
  x, y, s = 1, frame, mood = 'calm', heat = 0, flag = 0, stamp = 0, tilt = 0, tint = CARD, hx, hy, grey = 0}) => {
  const blink = (frame % 97) < 4 ? 0.2 : 1;
  const bob = Math.sin(frame / 9) * (mood === 'sweat' || mood === 'worried' ? 3 : 1.5);
  const body = grey > 0 ? shade(tint, 0.18 * grey) : tint;
  const eyeR = mood === 'sleepy' ? 0.3 : mood === 'worried' || mood === 'sweat' ? 1.15 : 1;
  const mouth = mood === 'happy' || mood === 'proud' ? 'M-26 0 Q0 22 26 0' : mood === 'sheepish' ? 'M-20 6 Q0 -2 20 8' :
    mood === 'worried' || mood === 'sweat' ? 'M-22 10 Q0 -6 22 10' : mood === 'blush' ? 'M-14 2 Q0 14 14 2' : 'M-18 4 L18 4';
  const brow = mood === 'worried' || mood === 'sweat' ? 10 : mood === 'proud' ? -8 : mood === 'sheepish' ? 12 : 0;
  return (
    <g transform={`translate(${x} ${y + bob}) rotate(${tilt}) scale(${s})`}>
      {heat > 0 && <Glow x={0} y={0} r={240} color={HEAT} opacity={0.45 * heat} />}
      <rect x={-124} y={-150} width={248} height={316} rx={34} fill={shade(body, 0.3)} />
      <rect x={-120} y={-155} width={240} height={310} rx={32} fill={body} stroke={heat > 0.4 ? HEAT : line(body)}
        strokeWidth={heat > 0.4 ? 10 : 7} />
      <rect x={-104} y={-142} width={120} height={10} rx={5} fill="#ffffff" opacity={0.8} />
      <g transform="translate(-100 -126)"><Slice heat={heat} hx={hx} hy={hy} frame={frame} /></g>
      {/* the face */}
      <g transform="translate(0 92)">
        {[-1, 1].map((k) => (
          <g key={k}>
            <ellipse cx={k * 38} cy={-6} rx={15} ry={17 * eyeR * blink} fill="#1d2140" />
            <circle cx={k * 38 - 5} cy={-11} r={5 * blink} fill="#ffffff" />
            <path d={`M${k * 38 - 18} ${-30 - (k > 0 ? brow : -brow) * 0.4} L${k * 38 + 18} ${-30 + (k > 0 ? brow : -brow) * 0.4}`}
              stroke="#1d2140" strokeWidth={6} strokeLinecap="round" />
          </g>
        ))}
        <path d={mouth} transform="translate(0 26)" stroke="#1d2140" strokeWidth={6} fill="none" strokeLinecap="round" />
        {(mood === 'blush' || mood === 'sheepish' || heat > 0.5) && [-1, 1].map((k) => <ellipse key={`b${k}`} cx={k * 62} cy={16} rx={16} ry={9} fill={HEAT} opacity={0.6} />)}
        {mood === 'sweat' && <path d={`M86 ${-34 + (frame % 30)} q8 14 0 20 q-8 -6 0 -20Z`} fill={CYAN} opacity={1 - (frame % 30) / 30} />}
      </g>
      {/* the flag */}
      {flag > 0 && (
        <g transform={`translate(104 -150) scale(${flag})`}>
          <path d="M0 0 L0 -96" stroke="#5a3a2a" strokeWidth={8} strokeLinecap="round" />
          <path d={`M0 -96 Q${30 + Math.sin(frame / 3) * 8} ${-104 + Math.sin(frame / 4) * 4} 60 -88 Q${30 + Math.sin(frame / 3 + 1) * 8} -70 0 -58 Z`} fill="#ff4d5e"
            stroke={line('#ff4d5e')} strokeWidth={5} strokeLinejoin="round" />
        </g>
      )}
      {stamp > 0 && (
        <g transform={`translate(10 20) rotate(-14) scale(${lerp(1.8, 1, ease(stamp))})`} opacity={clamp01(stamp * 2)}>
          <rect x={-100} y={-40} width={200} height={80} rx={20} fill="none" stroke="#2fbf71" strokeWidth={10} />
          <text x={0} y={22} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={58} fill="#2fbf71">READ</text>
        </g>
      )}
    </g>
  );
};

/** a plain card in a stack, no face, a thumbnail slice */
export const PlainCard: React.FC<{x: number; y: number; s?: number; tilt?: number; c?: string; frame: number}> = ({x, y, s = 1, tilt = 0, c = '#dfe5f7', frame}) => (
  <g transform={`translate(${x} ${y}) rotate(${tilt}) scale(${s})`}>
    <rect x={-124} y={-26} width={248} height={60} rx={20} fill={shade(c, 0.3)} />
    <rect x={-120} y={-30} width={240} height={58} rx={20} fill={c} stroke={line(c)} strokeWidth={5} />
    <rect x={-104} y={-20} width={56} height={38} rx={9} fill={SLICE} />
    <ellipse cx={-76} cy={-1} rx={20} ry={13} fill="#8790b4" opacity={0.8 + Math.sin(frame / 20) * 0.05} />
    <rect x={-36} y={-14} width={120} height={10} rx={5} fill={shade(c, 0.25)} />
    <rect x={-36} y={4} width={80} height={8} rx={4} fill={shade(c, 0.18)} />
  </g>
);

/** a leaning stack of cards, bottom at (x, y); index 0 is the bottom card */
export const Stack: React.FC<{x: number; y: number; n: number; frame: number; s?: number; lean?: number; gap?: number; skip?: number[]}> = ({
  x, y, n, frame, s = 1, lean = 1, gap = 54, skip = []}) => (
  <g>
    <ContactShadow x={x} y={y + 34 * s} w={300 * s} opacity={0.4} />
    {Array.from({length: n}, (_, i) => skip.includes(i) ? null : (
      <PlainCard key={i} x={x + Math.sin(i * 1.7) * 10 * s + i * i * 0.22 * lean * s} y={y - i * gap * s} s={s}
        tilt={Math.sin(i * 2.3) * 3 + i * 0.25 * lean} c={i % 3 === 0 ? '#dfe5f7' : i % 3 === 1 ? '#e8e2f7' : '#dceff2'} frame={frame} />
    ))}
  </g>
);

/** where card i of a Stack sits */
export const stackAt = (x: number, y: number, i: number, s = 1, lean = 1, gap = 54) => ({
  x: x + Math.sin(i * 1.7) * 10 * s + i * i * 0.22 * lean * s, y: y - i * gap * s});

/**
 * THE CT SCANNER with a face: a rounded gantry ring standing on its base, the bore its mouth, two sleepy eyes above
 * it, and a patient bed sliding in front. `puff` 0 to 1 yawns the mouth open and pushes a card out. Base at (x, y),
 * about 700 wide at s 1.
 */
export const Scanner: React.FC<{x: number; y: number; s?: number; frame: number; puff?: number; mood?: 'sleepy' | 'awake' | 'happy'}> = ({
  x, y, s = 1, frame, puff = 0, mood = 'sleepy'}) => {
  const body = '#e7ecf8';
  const yawn = Math.sin(clamp01(puff) * Math.PI);
  const eye = mood === 'sleepy' ? 0.25 + yawn * 0.1 : mood === 'happy' ? 0.7 : 1;
  const breathe = Math.sin(frame / 20) * 4;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ContactShadow x={0} y={6} w={760} opacity={0.4} />
      <rect x={-260} y={-120} width={520} height={120} rx={40} fill={shade(body, 0.2)} stroke={line(body)} strokeWidth={8} />
      <rect x={-340} y={-640 - breathe} width={680} height={560 + breathe} rx={200} fill={shade(body, 0.22)} stroke={line(body)} strokeWidth={9} />
      <rect x={-326} y={-632 - breathe} width={640} height={520 + breathe} rx={190} fill={body} />
      <rect x={-260} y={-610 - breathe} width={260} height={22} rx={11} fill="#ffffff" opacity={0.85} />
      {/* the bore, the mouth */}
      <ellipse cx={0} cy={-330} rx={170} ry={130 + yawn * 40} fill="#3a4170" stroke={line(body)} strokeWidth={8} />
      <ellipse cx={0} cy={-312} rx={140} ry={100 + yawn * 34} fill="#232a52" />
      <ellipse cx={0} cy={-330} rx={190} ry={150 + yawn * 40} fill="none" stroke={CYAN} strokeWidth={6} opacity={0.5 + Math.sin(frame / 8) * 0.2} />
      {/* the eyes */}
      {[-1, 1].map((k) => (
        <g key={k} transform={`translate(${k * 130} -540)`}>
          <ellipse cx={0} cy={0} rx={34} ry={34 * eye} fill="#1d2140" />
          {eye > 0.4 && <circle cx={-9} cy={-10 * eye} r={9} fill="#ffffff" />}
          <path d={`M-34 ${-6 - 34 * eye} Q0 ${-30 - 34 * eye} 34 ${-6 - 34 * eye}`} stroke={shade(body, 0.5)} strokeWidth={10} fill="none" strokeLinecap="round" />
        </g>
      ))}
      {/* the bed */}
      <rect x={-320} y={-200} width={640} height={50} rx={25} fill="#b8c2de" stroke={line('#b8c2de')} strokeWidth={6} />
      <rect x={-300} y={-196} width={300} height={14} rx={7} fill="#ffffff" opacity={0.6} />
      <circle cx={-260} cy={-28} r={12} fill="#38c86f" />
    </g>
  );
};

/**
 * THE ROUTER: a glass cabinet with three brass tracks. `route` 0 to 1 slides cards in from the left and sends them down
 * the right track; the switch points flip. Centred at (x, y), 760 x 640.
 */
export const Router: React.FC<{x: number; y: number; s?: number; frame: number; route?: number; gear?: number}> = ({x, y, s = 1, frame, route = 0, gear = 0}) => {
  const brass = '#e9b949';
  const tracks = [-200, 0, 200];
  const flip = Math.floor(route * 6) % 3;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ContactShadow x={0} y={340} w={780} opacity={0.4} />
      <rect x={-380} y={-320} width={760} height={660} rx={60} fill="#2a3a78" stroke="#7d8fd8" strokeWidth={10} />
      <rect x={-360} y={-300} width={720} height={620} rx={48} fill="#3a4fa0" opacity={0.6} />
      <rect x={-340} y={-290} width={300} height={18} rx={9} fill="#ffffff" opacity={0.4} />
      {/* the inlet */}
      <path d="M-380 -200 L-120 -200" stroke={brass} strokeWidth={16} strokeLinecap="round" />
      {tracks.map((ty, i) => (
        <g key={i}>
          <path d={`M-120 -200 C0 -200 40 ${ty} 120 ${ty} L380 ${ty}`} stroke={i === flip ? brass : shade(brass, 0.35)} strokeWidth={i === flip ? 16 : 10}
            fill="none" strokeLinecap="round" opacity={i === flip ? 1 : 0.6} />
          <circle cx={360} cy={ty} r={22} fill={i === flip ? '#38c86f' : '#55607f'} />
        </g>
      ))}
      {/* the switch lever */}
      <g transform={`translate(-120 -200) rotate(${[-30, 0, 30][flip]})`}>
        <rect x={-14} y={-14} width={110} height={28} rx={14} fill={brass} stroke={line(brass)} strokeWidth={5} />
        <circle cx={0} cy={0} r={24} fill={shade(brass, 0.2)} stroke={line(brass)} strokeWidth={5} />
      </g>
      {/* cards in flight */}
      {[0, 1, 2, 3].map((k) => {
        const p = ((route * 2.4 + k * 0.25) % 1);
        const lane = tracks[(k + Math.floor(route * 2.4 + k * 0.25)) % 3];
        const px = p < 0.35 ? lerp(-380, -120, p / 0.35) : lerp(-120, 380, (p - 0.35) / 0.65);
        const py = p < 0.35 ? -200 : lerp(-200, lane, ease((p - 0.35) / 0.3));
        return route > 0 ? <PlainCard key={k} x={px} y={py - 40} s={0.42} frame={frame} tilt={Math.sin(frame / 6 + k) * 4} /> : null;
      })}
      {/* a gear that turns */}
      <g transform={`translate(240 230) rotate(${gear * 360 + frame * 0.6})`}>
        {Array.from({length: 8}, (_, i) => <rect key={i} x={-12} y={-74} width={24} height={30} rx={8} fill={brass} transform={`rotate(${i * 45})`} />)}
        <circle r={52} fill={brass} stroke={line(brass)} strokeWidth={6} />
        <circle r={18} fill="#3a4fa0" />
      </g>
      <Word x={180} y={-238} t="ROUTER" size={46} c="#cfe0ff" />
    </g>
  );
};

/** a big magnifying lens with a handle, a cyan ring of light; centred on the glass */
export const Lens: React.FC<{x: number; y: number; r?: number; frame: number; rot?: number; focus?: number; children?: React.ReactNode}> = ({
  x, y, r = 200, frame, rot = 35, focus = 0, children}) => (
  <g transform={`translate(${x} ${y})`}>
    <g transform={`rotate(${rot})`}>
      <rect x={-r * 0.16} y={r * 0.95} width={r * 0.32} height={r * 1.3} rx={r * 0.16} fill="#4a3a8a" stroke={line('#4a3a8a')} strokeWidth={8} />
      <rect x={-r * 0.1} y={r * 1.0} width={r * 0.08} height={r * 1.1} rx={r * 0.04} fill="#7f6ad0" />
    </g>
    <circle r={r + 22} fill="#c9d2ee" stroke={line('#c9d2ee')} strokeWidth={8} />
    <circle r={r} fill="#bfe9ff" opacity={0.25} />
    {children}
    <circle r={r} fill="none" stroke={CYAN} strokeWidth={6} opacity={0.7} />
    {focus > 0 && <circle r={r * (1 + focus * 0.5)} fill="none" stroke={CYAN} strokeWidth={10 * (1 - focus)} opacity={1 - focus} />}
    <path d={`M${-r * 0.6} ${-r * 0.45} A${r * 0.8} ${r * 0.8} 0 0 1 ${-r * 0.1} ${-r * 0.75}`} stroke="#ffffff" strokeWidth={14} strokeLinecap="round" fill="none" opacity={0.8} />
    <path d={`M${-r} 0 L${r} 0`} stroke={CYAN} strokeWidth={4} opacity={0.4 + Math.sin(frame / 4) * 0.3} transform={`translate(0 ${Math.sin(frame / 10) * r * 0.8})`} />
  </g>
);

/** an hourglass of tiny lights; `p` 0 to 1 is how much has poured, `flip` 0 to 1 turns it over */
export const Hourglass: React.FC<{x: number; y: number; s?: number; p: number; flip?: number; frame: number}> = ({x, y, s = 1, p, flip = 1, frame}) => {
  const glass = '#cfe6ff';
  const top = 1 - p;
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${(1 - ease(flip)) * 180} 0 -300)`}>
      <ContactShadow x={0} y={10} w={360} opacity={0.4} />
      <rect x={-190} y={-40} width={380} height={50} rx={25} fill="#8a5a3a" stroke={line('#8a5a3a')} strokeWidth={6} />
      <rect x={-190} y={-610} width={380} height={50} rx={25} fill="#8a5a3a" stroke={line('#8a5a3a')} strokeWidth={6} />
      <path d="M-150 -560 C-150 -400 -24 -340 -24 -300 C-24 -260 -150 -200 -150 -40 L150 -40 C150 -200 24 -260 24 -300 C24 -340 150 -400 150 -560 Z"
        fill={glass} opacity={0.25} stroke={glass} strokeWidth={8} />
      {/* lights in the top bulb */}
      {Array.from({length: 46}, (_, i) => {
        const gx = ((i * 37) % 220) - 110, gy = -540 + ((i * 53) % 200);
        const keep = (i / 46) < top;
        return keep ? <circle key={i} cx={gx * (1 - (gy + 540) / 300)} cy={gy + (1 - top) * 160} r={8} fill={i % 3 ? CYAN : '#fff1a8'} /> : null;
      })}
      {/* the stream */}
      {p > 0 && p < 1 && Array.from({length: 6}, (_, i) => <circle key={`s${i}`} cx={0} cy={-300 + ((frame * 7 + i * 40) % 240)} r={6} fill="#fff1a8" />)}
      {/* lights in the bottom bulb, going grey */}
      {Array.from({length: 46}, (_, i) => {
        const keep = (i / 46) < p;
        const gx = ((i * 41) % 240) - 120, gy = -60 - ((i * 29) % 160) * (i / 46);
        return keep ? <circle key={`b${i}`} cx={gx} cy={gy} r={8} fill="#6a7090" opacity={0.85} /> : null;
      })}
      <path d="M-120 -540 C-120 -420 -40 -370 -40 -330" stroke="#ffffff" strokeWidth={8} fill="none" opacity={0.6} strokeLinecap="round" />
    </g>
  );
};

/**
 * THE LUNGS AND THE VEIN, a diagram on paper. `clot` 0 to 1 moves the clot from the vein wall up into a lung branch,
 * `red` flushes the lung where it lodges. Centred at (x, y), lungs top, vein at the bottom.
 */
export const Lungs: React.FC<{x: number; y: number; s?: number; frame: number; clot: number; red: number}> = ({x, y, s = 1, frame, clot, red}) => {
  const lung = '#f29aa8';
  const breathe = 1 + Math.sin(frame / 14) * 0.02 * (1 - red);
  const path = (k: number) => {
    // vein bottom (0, 760) up to the heart (0, 300) then out to the right lung (170, 40)
    if (k < 0.6) return {x: Math.sin(k * 10) * 12, y: lerp(760, 300, k / 0.6)};
    const u = (k - 0.6) / 0.4;
    return {x: lerp(0, 170, u), y: lerp(300, 40, u)};
  };
  const c = path(clot);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 -330 L0 -150" stroke="#c9d2ee" strokeWidth={46} strokeLinecap="round" />
      <path d="M0 -150 Q-40 -110 -110 -90 M0 -150 Q40 -110 110 -90" stroke="#c9d2ee" strokeWidth={30} strokeLinecap="round" fill="none" />
      <g transform={`scale(${breathe})`}>
        <defs>
          <radialGradient id="sl-lung" cx="35%" cy="25%" r="85%"><stop offset="0%" stopColor="#ffd0d8" /><stop offset="55%" stopColor={lung} /><stop offset="100%" stopColor="#a8507a" /></radialGradient>
        </defs>
        <path d="M-60 -200 C-200 -220 -300 -40 -280 160 C-270 260 -150 280 -80 220 C-40 160 -40 0 -60 -200Z" fill="url(#sl-lung)" stroke={line(lung)} strokeWidth={8} />
        <path d="M60 -200 C200 -220 300 -40 280 160 C270 260 150 280 80 220 C40 160 40 0 60 -200Z" fill="url(#sl-lung)" stroke={line(lung)} strokeWidth={8} />
        <path d="M-250 120 C-240 220 -150 250 -90 200" stroke="#ffe6ec" strokeWidth={10} fill="none" opacity={0.5} strokeLinecap="round" />
        <path d="M250 120 C240 220 150 250 90 200" stroke="#ffe6ec" strokeWidth={10} fill="none" opacity={0.5} strokeLinecap="round" />
        <path d="M120 -10 C170 0 230 40 250 120 C230 200 160 220 110 180 C90 120 90 40 120 -10Z" fill="#7a1f3a" opacity={red * 0.75} />
        <path d="M-210 -120 Q-170 -160 -120 -150" stroke="#ffffff" strokeWidth={14} opacity={0.6} fill="none" strokeLinecap="round" />
      </g>
      <path d="M0 760 Q-12 600 10 450 Q20 360 0 300 L170 40" stroke="#4a6ad8" strokeWidth={34} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M0 760 Q-12 600 10 450 Q20 360 0 300 L170 40" stroke="#7d9cff" strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
      <ellipse cx={-8} cy={300} rx={70} ry={60} fill="#e2546a" stroke={line('#e2546a')} strokeWidth={7} />
      <g transform={`translate(${c.x} ${c.y}) rotate(${frame * 6})`}>
        <circle r={28} fill="#b5162e" stroke="#5a0a18" strokeWidth={6} />
        <circle cx={-8} cy={-8} r={8} fill="#ff6b80" />
      </g>
    </g>
  );
};

/** a phone in portrait with a screen; children draw in a 300 x 560 screen box */
export const Phone: React.FC<{x: number; y: number; s?: number; rot?: number; buzz?: number; children?: React.ReactNode; dotted?: boolean}> = ({
  x, y, s = 1, rot = 0, buzz = 0, children, dotted = false}) => (
  <g transform={`translate(${x + Math.sin(buzz * 60) * 8 * (buzz > 0 && buzz < 1 ? 1 : 0)} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-176} y={-316} width={352} height={632} rx={56} fill="#1f2340" stroke={line('#1f2340')} strokeWidth={8} />
    <rect x={-150} y={-280} width={300} height={560} rx={30} fill="#0f1430" />
    <g transform="translate(-150 -280)">
      <svg x={0} y={0} width={300} height={560} viewBox="0 0 300 560" overflow="hidden">{children}</svg>
    </g>
    <rect x={-40} y={-302} width={80} height={12} rx={6} fill="#3a3f66" />
    <path d="M-130 -260 L-60 -260" stroke="#ffffff" strokeWidth={8} strokeLinecap="round" opacity={0.2} />
    {dotted && <rect x={-196} y={-336} width={392} height={672} rx={70} fill="none" stroke={CYAN} strokeWidth={6} strokeDasharray="22 16" />}
  </g>
);

/** a desk with a lit top edge */
export const Desk: React.FC<{y: number; c?: string}> = ({y, c = '#5d6a8c'}) => (
  <g>
    <rect x={-240} y={y} width={1560} height={70} rx={28} fill={c} stroke={line(c)} strokeWidth={6} />
    <rect x={-240} y={y + 8} width={1560} height={16} rx={8} fill={light(c, 0.3)} />
    <rect x={-240} y={y + 70} width={1560} height={2160 - y} fill={shade(c, 0.45)} />
  </g>
);

/** a reading monitor on a stand, children in a 400 x 260 screen */
export const Monitor: React.FC<{x: number; y: number; s?: number; glow?: number; children?: React.ReactNode}> = ({x, y, s = 1, glow = 0.3, children}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Glow x={0} y={-160} r={340} color={CYAN} opacity={glow} />
    <rect x={-20} y={-30} width={40} height={60} rx={14} fill="#3a4466" />
    <rect x={-90} y={20} width={180} height={24} rx={12} fill="#3a4466" />
    <rect x={-230} y={-330} width={460} height={310} rx={30} fill="#2a3150" stroke={line('#2a3150')} strokeWidth={8} />
    <g transform="translate(-200 -305)">
      <svg x={0} y={0} width={400} height={260} viewBox="0 0 400 260" overflow="hidden">{children}</svg>
    </g>
  </g>
);

/** the reading room: night-blue walls, a window onto the Gulf prairie city with hospital towers, low warm lamps */
export const Room: React.FC<{frame: number; win?: {x: number; y: number; w: number; h: number}; dark?: number}> = ({frame, win = {x: 560, y: 180, w: 470, h: 420}, dark = 0}) => {
  const {x, y, w, h} = win;
  // the Texas Medical Center cluster in Gulf haze: tall towers of mixed height, a rounded crown or two, a skybridge,
  // live oaks along the street and a palm, under a warm, humid white sky
  const towers: [number, number, number, string][] = [[0.04, 0.46, 0.1, '#9fa6c4'], [0.15, 0.3, 0.12, '#8e98bd'], [0.29, 0.18, 0.11, '#a7afcc'],
    [0.42, 0.36, 0.1, '#959fc2'], [0.54, 0.12, 0.13, '#8a93b8'], [0.69, 0.26, 0.1, '#a2a9c6'], [0.81, 0.4, 0.13, '#939cc0']];
  return (
    <g>
      <defs>
        <linearGradient id="sl-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={shade('#34478a', dark)} /><stop offset="100%" stopColor={shade('#1b2456', dark)} /></linearGradient>
        <linearGradient id="sl-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f2d9c2" /><stop offset="55%" stopColor="#f7e9da" /><stop offset="100%" stopColor="#e6e2d4" /></linearGradient>
      </defs>
      <rect x={x} y={y} width={w} height={h} fill="url(#sl-sky)" />
      <circle cx={x + w * 0.86} cy={y + h * 0.16} r={30} fill="#fff6dc" opacity={0.9} />
      {towers.map(([uu, top, ww, c], i) => (
        <g key={i}>
          <rect x={x + uu * w} y={y + h * top} width={w * ww} height={h * (0.84 - top)} rx={i % 3 === 0 ? w * ww / 2 : 8} fill={c} />
          <rect x={x + uu * w} y={y + h * top} width={w * ww * 0.35} height={h * (0.84 - top)} rx={6} fill="#ffffff" opacity={0.18} />
          {Array.from({length: 6}, (_, j) => <rect key={j} x={x + uu * w + 6} y={y + h * top + 16 + j * 26} width={w * ww - 12} height={6} rx={3}
            fill="#fff0d0" opacity={0.35 + 0.3 * Math.sin(frame / 30 + i + j)} />)}
        </g>
      ))}
      {/* a skybridge between two towers */}
      <rect x={x + w * 0.4} y={y + h * 0.5} width={w * 0.16} height={h * 0.05} rx={6} fill="#c9cde0" stroke="#8a93b8" strokeWidth={3} />
      <rect x={x + w * 0.64} y={y + h * 0.58} width={w * 0.07} height={h * 0.045} rx={6} fill="#c9cde0" stroke="#8a93b8" strokeWidth={3} />
      {/* humid haze over the lower half */}
      <rect x={x} y={y + h * 0.45} width={w} height={h * 0.4} fill="#f4ece0" opacity={0.35} />
      <rect x={x} y={y + h * 0.82} width={w} height={h * 0.18} fill="#7a9a5e" />
      {/* live oaks: wide, low, lopsided canopies */}
      {[0.06, 0.27, 0.5, 0.73, 0.94].map((uu, i) => (
        <g key={i}>
          <rect x={x + uu * w - 5} y={y + h * 0.8} width={10} height={h * 0.06} fill="#5a4630" />
          <ellipse cx={x + uu * w + (i % 2 ? 8 : -8)} cy={y + h * 0.8} rx={w * 0.09} ry={h * 0.05} fill="#3f6a3e" />
          <ellipse cx={x + uu * w - 10} cy={y + h * 0.78} rx={w * 0.05} ry={h * 0.03} fill="#5d8a52" />
        </g>
      ))}
      {/* one palm */}
      <path d={`M${x + w * 0.62} ${y + h * 0.84} Q${x + w * 0.6} ${y + h * 0.66} ${x + w * 0.63} ${y + h * 0.56}`} stroke="#7a6040" strokeWidth={6} fill="none" />
      {[-1, -0.4, 0.3, 1].map((k, i) => <path key={i} d={`M${x + w * 0.63} ${y + h * 0.56} q${k * w * 0.05} ${-h * 0.03} ${k * w * 0.08} ${h * 0.03}`} stroke="#3f6a3e" strokeWidth={7} fill="none" strokeLinecap="round" />)}
      <path d={`M-240 -240 L1320 -240 L1320 2160 L-240 2160 Z M${x + 30} ${y} L${x + w - 30} ${y} Q${x + w} ${y} ${x + w} ${y + 30} L${x + w} ${y + h - 30} Q${x + w} ${y + h} ${x + w - 30} ${y + h} L${x + 30} ${y + h} Q${x} ${y + h} ${x} ${y + h - 30} L${x} ${y + 30} Q${x} ${y} ${x + 30} ${y} Z`}
        fill="url(#sl-wall)" fillRule="evenodd" />
      <rect x={x} y={y} width={w} height={h} rx={30} fill="none" stroke="#5a6aa8" strokeWidth={16} />
      <path d={`M${x + w / 2} ${y} L${x + w / 2} ${y + h}`} stroke="#5a6aa8" strokeWidth={10} />
      <Glow x={260} y={760} r={620} color="#ffb070" opacity={0.12} />
      <Glow x={800} y={1100} r={520} color={CYAN} opacity={0.08} />
    </g>
  );
};
