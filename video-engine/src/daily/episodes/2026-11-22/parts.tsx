import React from 'react';
import {ContactShadow, Glow, clamp01, ease, easeOutBack, lerp} from '../../../look/Kit';
import {line, light, shade} from '../../../look/color';
import {FONT} from '../../../lib/type';

/**
 * leak-satellite-1122 parts. Every drawing here is original and follows LOOK_V2: round corners, a key from the
 * upper left, shade toward violet, hue-tinted line, a contact shadow under anything that stands. The satellite,
 * the street, the pipe, the crew truck and the map are illustrative, never a real site, and no product's,
 * vendor's or city's mark is drawn.
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

export type SatMood = 'curious' | 'happy' | 'focused' | 'worried' | 'proud';

/**
 * THE HERO. A small round satellite with a face: a lit gold body, two blue solar wings that flap a little, a radar
 * dish under its chin, and one big eye. `beam` 0 to 1 sends a radar cone down to `beamY` (in the satellite's own
 * units, before scale). `look` -1 to 1 turns the eye.
 */
export const Satellite: React.FC<{x: number; y: number; s?: number; frame: number; mood?: SatMood; beam?: number; beamLen?: number;
  look?: number; tilt?: number}> = ({x, y, s = 1, frame, mood = 'curious', beam = 0, beamLen = 900, look = 0, tilt = 0}) => {
  const blink = (frame % 101) < 4 ? [1, 0.3, 0.1, 0.6][frame % 101] : 1;
  const bob = Math.sin(frame / 14) * 6;
  const flap = Math.sin(frame / 9) * 4;
  const brow = {
    curious: ['M-58 -70 Q-36 -84 -14 -74', 'M58 -78 Q36 -88 14 -78'],
    happy: ['M-58 -74 Q-36 -90 -14 -76', 'M58 -74 Q36 -90 14 -76'],
    focused: ['M-58 -66 L-14 -76', 'M58 -66 L14 -76'],
    worried: ['M-58 -76 L-14 -64', 'M58 -76 L14 -64'],
    proud: ['M-58 -80 Q-36 -92 -14 -82', 'M58 -80 Q36 -92 14 -82'],
  }[mood];
  const mouth = mood === 'worried' ? 'M-22 52 Q0 40 22 52' : mood === 'focused' ? 'M-18 48 L18 48' : 'M-26 42 Q0 66 26 42';
  const wing = (side: 1 | -1) => (
    <g transform={`rotate(${side * flap})`}>
      <rect x={side > 0 ? 112 : -112 - 18} y={-6} width={18} height={12} rx={5} fill="#9aa3bd" />
      <g transform={`translate(${side * 250} 0)`}>
        <rect x={-120} y={-62} width={240} height={124} rx={26} fill={shade('#2f6fe0', 0.3)} stroke={line('#2f6fe0')} strokeWidth={7} />
        <rect x={-112} y={-56} width={224} height={104} rx={20} fill="#3f86f2" />
        {[-60, 0, 60].map((gx) => <line key={gx} x1={gx} y1={-52} x2={gx} y2={46} stroke="#2a5cc2" strokeWidth={5} />)}
        <line x1={-110} y1={-4} x2={110} y2={-4} stroke="#2a5cc2" strokeWidth={5} />
        <rect x={-100} y={-48} width={110} height={14} rx={7} fill="#cfe4ff" opacity={0.6} />
      </g>
    </g>
  );
  return (
    <g transform={`translate(${x} ${y + bob}) rotate(${tilt}) scale(${s})`}>
      {beam > 0 && (
        <g opacity={0.85 * clamp01(beam * 1.4)}>
          <path d={`M-40 120 L${-260 * beam} ${120 + beamLen * beam} L${260 * beam} ${120 + beamLen * beam} L40 120 Z`} fill="#7cf0ff" opacity={0.22} />
          {[0, 1, 2, 3].map((i) => {
            const ph = ((frame / 18 + i / 4) % 1);
            const yy = 120 + beamLen * beam * ph;
            const ww = 40 + 220 * beam * ph;
            return <path key={i} d={`M${-ww} ${yy} Q0 ${yy + 30} ${ww} ${yy}`} stroke="#bff8ff" strokeWidth={8} fill="none" strokeLinecap="round"
              opacity={0.9 * (1 - ph)} />;
          })}
        </g>
      )}
      {wing(-1)}{wing(1)}
      {/* dish under the chin */}
      <path d="M-46 104 Q0 150 46 104 Z" fill="#e8ecf6" stroke={line('#e8ecf6')} strokeWidth={6} />
      <circle cx={0} cy={126} r={8} fill="#ff5d5d" />
      {/* body */}
      <circle cx={0} cy={0} r={118} fill={shade('#f2b43c', 0.35)} stroke={line('#f2b43c')} strokeWidth={8} />
      <circle cx={-10} cy={-10} r={104} fill="#f6c24e" />
      <ellipse cx={-48} cy={-62} rx={40} ry={20} fill="#fff1c6" opacity={0.75} transform="rotate(-30 -48 -62)" />
      <path d="M84 -70 A110 110 0 0 1 96 60" stroke="#fff8e0" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.7} />
      {/* antenna */}
      <line x1={30} y1={-114} x2={52} y2={-176} stroke="#9aa3bd" strokeWidth={7} strokeLinecap="round" />
      <circle cx={54} cy={-182} r={12} fill="#ff5d5d" stroke={line('#ff5d5d')} strokeWidth={4} />
      {/* the eye */}
      <circle cx={0} cy={-8} r={52} fill="#ffffff" stroke={line('#f2b43c')} strokeWidth={6} />
      <g transform={`scale(1 ${blink})`} style={{transformOrigin: '0px -8px'}}>
        <circle cx={look * 16} cy={-8} r={30} fill="#1d2a6b" />
        <circle cx={look * 16} cy={-8} r={18} fill="#2f6fe0" />
        <circle cx={look * 16 - 10} cy={-20} r={9} fill="#ffffff" />
      </g>
      {brow.map((d, i) => <path key={i} d={d} stroke="#6b3b10" strokeWidth={10} strokeLinecap="round" fill="none" />)}
      <path d={mouth} stroke="#6b3b10" strokeWidth={8} strokeLinecap="round" fill="none" />
    </g>
  );
};

/** a dark sky with stars and the curve of the earth, for the orbit shots */
export const Orbit: React.FC<{frame: number; curve?: number}> = ({frame, curve = 1500}) => (
  <g>
    <rect x={0} y={0} width={1080} height={1920} fill="#1b1f5e" />
    <rect x={0} y={0} width={1080} height={1920} fill="url(#orbitfade)" />
    <defs>
      <linearGradient id="orbitfade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2a1f6e" /><stop offset="1" stopColor="#3a63c9" />
      </linearGradient>
      <radialGradient id="earthlit" cx="0.35" cy="0.2" r="0.8">
        <stop offset="0" stopColor="#7fd3ff" /><stop offset="0.5" stopColor="#3b8fe0" /><stop offset="1" stopColor="#24408f" />
      </radialGradient>
    </defs>
    {Array.from({length: 40}, (_, i) => {
      const sx = (i * 263) % 1080, sy = (i * 151) % 1300;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(frame / 20 + i));
      return <circle key={i} cx={sx} cy={sy} r={i % 5 ? 3 : 5} fill="#fff8e0" opacity={tw} />;
    })}
    <ellipse cx={540} cy={curve + 1400} rx={1600} ry={1500} fill="url(#earthlit)" />
    <ellipse cx={540} cy={curve + 1400} rx={1610} ry={1510} fill="none" stroke="#bfefff" strokeWidth={18} opacity={0.6} />
    {/* Texas-ish land patch, deliberately abstract */}
    <path d={`M300 ${curve + 60} Q420 ${curve + 20} 560 ${curve + 50} Q700 ${curve + 40} 780 ${curve + 110} Q720 ${curve + 200} 600 ${curve + 260} Q460 ${curve + 220} 380 ${curve + 170} Q300 ${curve + 130} 300 ${curve + 60} Z`}
      fill="#c9b46a" opacity={0.85} />
  </g>
);

/**
 * A CUT THROUGH A NEIGHBOURHOOD STREET. Asphalt on top with a lane line, a curb and sidewalk, soil beneath, and a
 * blue water main running across. `leak` 0 to 1 opens a crack that sprays and soaks a dark plume into the soil.
 * `dig` 0 to 1 cuts a trench down to the pipe. `clamp` 0 to 1 bolts a repair clamp over the crack. Drawn in a
 * 1080 wide band whose surface is at y.
 */
export const StreetSection: React.FC<{y: number; frame: number; leak?: number; dig?: number; clamp?: number; pipeY?: number; crackX?: number;
  sidewalk?: boolean; jet?: number}> = ({y, frame, leak = 0, dig = 0, clamp = 0, pipeY = 360, crackX = 560, sidewalk = true, jet = 1}) => {
  const py = y + pipeY;
  const plume = leak * (1 - clamp * 0.85);
  const trenchW = 300;
  return (
    <g>
      {/* soil */}
      <rect x={0} y={y + 40} width={1080} height={1920 - y} fill="#b9794a" />
      <rect x={0} y={y + 40} width={1080} height={120} fill="#c98a56" />
      {Array.from({length: 26}, (_, i) => (
        <ellipse key={i} cx={(i * 197) % 1080} cy={y + 180 + ((i * 89) % 520)} rx={10 + (i % 4) * 5} ry={7 + (i % 3) * 3} fill="#9e6238" opacity={0.6} />
      ))}
      {/* soaked plume */}
      {plume > 0 && (
        <g>
          <ellipse cx={crackX} cy={py - 20} rx={60 + 230 * plume} ry={40 + 150 * plume} fill="#5b3b2a" opacity={0.55} />
          <ellipse cx={crackX} cy={py - 10} rx={30 + 150 * plume} ry={20 + 90 * plume} fill="#4a2f22" opacity={0.6} />
        </g>
      )}
      {/* the pipe */}
      <rect x={-20} y={py - 34} width={1120} height={68} rx={34} fill={shade('#2f86d6', 0.3)} stroke={line('#2f86d6')} strokeWidth={8} />
      <rect x={-20} y={py - 28} width={1120} height={40} rx={20} fill="#3f9cf0" />
      <rect x={-20} y={py - 24} width={1120} height={10} rx={5} fill="#bfe6ff" opacity={0.6} />
      {[120, 420, 760].map((jx) => <rect key={jx} x={jx} y={py - 42} width={30} height={84} rx={10} fill="#2a6fb8" stroke={line('#2a6fb8')} strokeWidth={5} />)}
      {/* the crack and the spray */}
      {leak > 0 && clamp < 0.6 && (
        <g>
          <path d={`M${crackX - 22} ${py - 30} l10 14 l-8 10 l14 12`} stroke="#123a6b" strokeWidth={7} fill="none" strokeLinecap="round" />
          {[-0.5, 0, 0.45].map((k, j) => {
            const wob = Math.sin(frame / 3 + j) * 10;
            const hgt = (150 + 60 * j % 2) * leak * jet;
            return <path key={`j${j}`} d={`M${crackX} ${py - 30} Q${crackX + k * 120 + wob} ${py - 30 - hgt} ${crackX + k * 260} ${py - 40 - hgt * 0.3}`}
              stroke="#9fe0ff" strokeWidth={(22 - j * 4) * Math.sqrt(jet)} strokeLinecap="round" fill="none" opacity={0.9} />;
          })}
          {Array.from({length: 12}, (_, i) => {
            const ph = (frame / 8 + i / 12) % 1;
            const a = -Math.PI / 2 + (i - 5.5) * 0.22;
            const r = 40 + 220 * ph * leak * jet;
            return <circle key={i} cx={crackX + Math.cos(a) * r} cy={py - 34 + Math.sin(a) * r + ph * ph * 120} r={(14 * (1 - ph) + 5) * Math.sqrt(jet)} fill="#bff0ff" opacity={1 - ph * 0.8} />;
          })}
          <circle cx={crackX} cy={py - 34} r={26 * leak} fill="#e8fbff" opacity={0.8} />
        </g>
      )}
      {clamp > 0 && (
        <g transform={`translate(${crackX} ${py}) scale(${1.45 * easeOutBack(clamp, 1.4)})`}>
          <rect x={-62} y={-50} width={124} height={100} rx={22} fill={shade('#9aa3bd', 0.3)} stroke={line('#9aa3bd')} strokeWidth={7} />
          <rect x={-56} y={-44} width={112} height={78} rx={18} fill="#c7cede" />
          {[-36, 0, 36].map((bx) => <circle key={bx} cx={bx} cy={-52} r={10} fill="#5a6078" />)}
          {[-36, 0, 36].map((bx) => <circle key={bx} cx={bx} cy={52} r={10} fill="#5a6078" />)}
          <rect x={-46} y={-38} width={50} height={10} rx={5} fill="#ffffff" opacity={0.6} />
        </g>
      )}
      {/* the trench */}
      {dig > 0 && (
        <g>
          <path d={`M${crackX - trenchW / 2} ${y} L${crackX - trenchW / 2 + 20} ${y + (pipeY + 60) * dig} L${crackX + trenchW / 2 - 20} ${y + (pipeY + 60) * dig} L${crackX + trenchW / 2} ${y} Z`}
            fill="#6e4428" />
          <path d={`M${crackX - trenchW / 2 + 20} ${y + (pipeY + 60) * dig} L${crackX + trenchW / 2 - 20} ${y + (pipeY + 60) * dig}`} stroke="#4a2d1c" strokeWidth={10} />
          {/* spoil pile */}
          <path d={`M${crackX + trenchW / 2 + 10} ${y} Q${crackX + trenchW / 2 + 110} ${y - 140 * dig} ${crackX + trenchW / 2 + 240} ${y} Z`} fill="#a86a3e"
            stroke={line('#a86a3e')} strokeWidth={6} />
        </g>
      )}
      {/* pavement */}
      <rect x={0} y={y} width={dig > 0 ? crackX - trenchW / 2 : 1080} height={44} fill="#4d5266" />
      {dig > 0 && <rect x={crackX + trenchW / 2} y={y} width={1080} height={44} fill="#4d5266" />}
      <rect x={0} y={y} width={1080} height={8} fill="#7a8098" opacity={dig > 0 ? 0 : 1} />
      {Array.from({length: 6}, (_, i) => {
        const lx = i * 200 + 40;
        if (dig > 0 && lx > crackX - trenchW / 2 - 100 && lx < crackX + trenchW / 2) return null;
        return <rect key={i} x={lx} y={y - 4} width={100} height={10} rx={5} fill="#ffd34d" />;
      })}
      {sidewalk && (
        <g>
          <rect x={0} y={y - 28} width={150} height={32} rx={8} fill="#d9dbe4" stroke={line('#d9dbe4')} strokeWidth={5} />
          <rect x={146} y={y - 34} width={18} height={40} rx={6} fill="#b8bccb" />
        </g>
      )}
      {/* a damp patch on the surface when the leak has gone on a while */}
      {plume > 0.5 && dig === 0 && <ellipse cx={crackX + 40} cy={y + 4} rx={140 * (plume - 0.4)} ry={10} fill="#2a3a5a" opacity={0.5} />}
    </g>
  );
};

/**
 * The leak listening rod: a steel rod with a round sensor foot and a small amplifier box, the way a technician
 * presses it to a valve or the pavement. Drawn from its grip at (0,0) down to the foot at (0, len).
 */
export const ListeningRod: React.FC<{len?: number; pulse?: number}> = ({len = 260, pulse = 0}) => (
  <g>
    <rect x={-8} y={0} width={16} height={len} rx={8} fill="#c7cede" stroke={line('#c7cede')} strokeWidth={4} />
    <rect x={-28} y={40} width={56} height={70} rx={16} fill="#ff7a3c" stroke={line('#ff7a3c')} strokeWidth={5} />
    <circle cx={0} cy={66} r={10} fill={pulse > 0.5 ? '#7cff9e' : '#3a3f52'} />
    <ellipse cx={0} cy={len + 8} rx={30} ry={14} fill="#5a6078" stroke={line('#5a6078')} strokeWidth={4} />
    {pulse > 0 && [0, 1, 2].map((i) => (
      <ellipse key={i} cx={0} cy={len + 10} rx={30 + i * 34 * pulse} ry={10 + i * 10 * pulse} fill="none" stroke="#7cf0ff" strokeWidth={5}
        opacity={(1 - i / 3) * pulse} />
    ))}
  </g>
);

/** headphones worn over a figure's head; place at the head's centre */
export const Headphones: React.FC<{x: number; y: number; s?: number; on?: number}> = ({x, y, s = 1, on = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-62 4 Q-64 -78 0 -82 Q64 -78 62 4" stroke="#2a2f45" strokeWidth={14} fill="none" strokeLinecap="round" />
    <rect x={-80} y={-14} width={34} height={56} rx={14} fill="#2a2f45" />
    <rect x={46} y={-14} width={34} height={56} rx={14} fill="#2a2f45" />
    <circle cx={-63} cy={14} r={8} fill={on > 0.5 ? '#7cff9e' : '#5a6078'} />
  </g>
);

/** a sound wave line, `amp` 0 to 1, drawn across w at (x, y) */
export const Wave: React.FC<{x: number; y: number; w: number; amp: number; frame: number; c?: string}> = ({x, y, w, amp, frame, c = '#7cff9e'}) => {
  const pts = Array.from({length: 61}, (_, i) => {
    const u = i / 60;
    const env = Math.sin(u * Math.PI);
    const v = Math.sin(u * 40 + frame / 3) * amp * 60 * env + Math.sin(u * 13 + frame / 5) * 6;
    return `${x + u * w},${y + v}`;
  });
  return <polyline points={pts.join(' ')} stroke={c} strokeWidth={7} fill="none" strokeLinejoin="round" strokeLinecap="round" />;
};

/** the crew truck, a white utility body with an amber bar and a toolbox; facing right, wheels on y */
export const CrewTruck: React.FC<{x: number; y: number; s?: number; frame: number; roll?: number; lights?: boolean}> = ({
  x, y, s = 1, frame, roll = 0, lights = false}) => {
  const spin = roll * 600;
  const wheel = (cx: number) => (
    <g transform={`translate(${cx} -50)`}>
      <circle r={50} fill="#26223d" stroke={line('#26223d')} strokeWidth={5} />
      <circle r={28} fill="#dfe3ee" />
      <g transform={`rotate(${spin})`}><rect x={-4} y={-24} width={8} height={48} rx={4} fill="#8a90a8" /></g>
    </g>
  );
  const flash = lights && Math.floor(frame / 6) % 2 === 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ContactShadow x={0} y={4} w={560} opacity={0.4} />
      <rect x={-280} y={-250} width={340} height={200} rx={26} fill={shade('#f2f4fa', 0.2)} stroke={line('#b8bccb')} strokeWidth={7} />
      <rect x={-272} y={-242} width={320} height={170} rx={20} fill="#f7f8fc" />
      {[-250, -150, -50].map((dx) => <rect key={dx} x={dx} y={-220} width={80} height={120} rx={12} fill="#e4e8f2" stroke="#c4c9d8" strokeWidth={4} />)}
      <rect x={-272} y={-140} width={320} height={22} rx={8} fill="#2f86d6" />
      <path d="M60 -50 L60 -210 Q60 -236 90 -236 L190 -236 Q226 -236 246 -200 L282 -130 Q290 -112 290 -90 L290 -50 Z" fill="#f7f8fc"
        stroke={line('#b8bccb')} strokeWidth={7} />
      <path d="M100 -210 L180 -210 Q204 -210 216 -186 L244 -136 L100 -136 Z" fill="#8fd0ff" stroke="#5a8fc0" strokeWidth={5} />
      <path d="M112 -200 L150 -200 L132 -150 L112 -150 Z" fill="#ffffff" opacity={0.5} />
      <rect x={-140} y={-276} width={160} height={26} rx={12} fill={flash ? '#ffb020' : '#c98a2a'} />
      {flash && <Glow x={-60} y={-264} r={120} color="#ffb020" opacity={0.5} />}
      <rect x={-290} y={-60} width={590} height={20} rx={10} fill="#8a90a8" />
      {wheel(-180)}{wheel(200)}
    </g>
  );
};

/** a fire-hydrant-style flush valve cover in the pavement, the round iron lid a technician listens on */
export const ValveLid: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={0} rx={70} ry={22} fill="#3a3f52" stroke={line('#3a3f52')} strokeWidth={6} />
    <ellipse cx={0} cy={-3} rx={56} ry={15} fill="#5a6078" />
    <path d="M-30 -4 L30 -4 M-20 4 L20 4" stroke="#3a3f52" strokeWidth={5} strokeLinecap="round" />
  </g>
);

/** a rounded neighbourhood-blob map of the city, roads, a river, drawn in a box of w x h at (x, y) */
export const CityMap: React.FC<{x: number; y: number; w?: number; h?: number; children?: React.ReactNode; grid?: number}> = ({
  x, y, w = 900, h = 900, children, grid = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${w / 900} ${h / 900})`}>
    <path d="M80 120 Q160 30 340 50 Q520 10 700 70 Q860 130 840 320 Q880 520 800 700 Q720 870 480 850 Q240 890 120 760 Q30 600 60 400 Q30 240 80 120 Z"
      fill="#eef6ee" stroke="#8fb39a" strokeWidth={10} />
    <g opacity={grid}>
      {[200, 320, 440, 560, 680].map((gx) => <line key={gx} x1={gx} y1={80} x2={gx} y2={840} stroke="#c9d8cf" strokeWidth={6} />)}
      {[220, 340, 460, 580, 700].map((gy) => <line key={gy} x1={70} y1={gy} x2={850} y2={gy} stroke="#c9d8cf" strokeWidth={6} />)}
    </g>
    <path d="M60 250 Q300 300 420 260 Q600 200 860 280" stroke="#7cc4f2" strokeWidth={24} strokeLinecap="round" fill="none" />
    <path d="M450 60 L450 850" stroke="#f2b43c" strokeWidth={14} strokeLinecap="round" opacity={0.8} />
    <path d="M70 520 L850 520" stroke="#f2b43c" strokeWidth={14} strokeLinecap="round" opacity={0.8} />
    {children}
  </g>
);

/** a point of interest drawn as a rounded polygon on the map, `on` 0 to 1 grows it, colour by status */
export const Poi: React.FC<{x: number; y: number; on: number; c?: string; r?: number; frame: number; pulse?: boolean}> = ({
  x, y, on, c = '#ff5d5d', r = 34, frame, pulse = true}) => {
  if (on <= 0) return null;
  const k = easeOutBack(clamp01(on), 1.8);
  const ph = (frame / 24) % 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      {pulse && <circle r={r + ph * 40} fill="none" stroke={c} strokeWidth={5} opacity={1 - ph} />}
      <path d={`M${-r} ${-r * 0.4} Q${-r * 0.8} ${-r} 0 ${-r} Q${r} ${-r * 0.9} ${r} ${-r * 0.1} Q${r * 0.9} ${r} 0 ${r} Q${-r} ${r * 0.8} ${-r} ${-r * 0.4} Z`}
        fill={c} opacity={0.55} stroke={line(c)} strokeWidth={5} />
      <circle r={r * 0.28} fill="#ffffff" />
    </g>
  );
};

/** a big glass water jug with a level, `level` 0 to 1, a counter label underneath */
export const Jug: React.FC<{x: number; y: number; s?: number; level: number; frame: number; label?: string}> = ({x, y, s = 1, level, frame, label}) => {
  const H = 520, W = 360;
  const top = -20 - (H - 60) * clamp01(level);
  const wob = Math.sin(frame / 6) * 8 * (level > 0 && level < 1 ? 1 : 0.3);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ContactShadow x={0} y={8} w={420} opacity={0.38} />
      <clipPath id={`jug-${x}-${y}`}><rect x={-W / 2 + 12} y={-H} width={W - 24} height={H - 12} rx={60} /></clipPath>
      <g clipPath={`url(#jug-${x}-${y})`}>
        <path d={`M${-W / 2} ${top} Q${-W / 4} ${top - wob} 0 ${top} Q${W / 4} ${top + wob} ${W / 2} ${top} L${W / 2} 0 L${-W / 2} 0 Z`} fill="#3f9cf0" />
        <path d={`M${-W / 2} ${top} Q${-W / 4} ${top - wob} 0 ${top} Q${W / 4} ${top + wob} ${W / 2} ${top}`} stroke="#bfe6ff" strokeWidth={10} fill="none" />
      </g>
      <rect x={-W / 2} y={-H} width={W} height={H} rx={70} fill="#d8f0ff" opacity={0.25} />
      <rect x={-W / 2} y={-H} width={W} height={H} rx={70} fill="none" stroke="#2a6fb8" strokeWidth={16} />
      <rect x={-W / 2 + 10} y={-H + 10} width={W - 20} height={H - 20} rx={62} fill="none" stroke="#e8f6ff" strokeWidth={6} opacity={0.8} />
      <path d={`M${W / 2 - 6} ${-H + 120} Q${W / 2 + 110} ${-H + 140} ${W / 2 + 100} ${-H / 2} Q${W / 2 + 90} ${-H / 2 + 120} ${W / 2 - 6} ${-H / 2 + 110}`} stroke="#2a6fb8" strokeWidth={26} fill="none" strokeLinecap="round" />
      <rect x={-70} y={-H - 60} width={140} height={70} rx={24} fill="#c7d8ee" stroke="#9fb5d6" strokeWidth={8} />
      <path d={`M${-W / 2 + 36} ${-H + 40} Q${-W / 2 + 22} ${-H / 2} ${-W / 2 + 40} -50`} stroke="#ffffff" strokeWidth={16} strokeLinecap="round" opacity={0.6} fill="none" />
      {label && <Word x={0} y={70} t={label} size={44} c="#fff6e6" />}
    </g>
  );
};

/** a check or a cross stamp that lands, `on` 0 to 1 */
export const Mark: React.FC<{x: number; y: number; on: number; ok: boolean; s?: number}> = ({x, y, on, ok, s = 1}) => {
  if (on <= 0) return null;
  const k = easeOutBack(clamp01(on), 2);
  const c = ok ? '#2fbf71' : '#9aa3bd';
  return (
    <g transform={`translate(${x} ${y}) scale(${k * s}) rotate(${lerp(-20, 0, clamp01(on))})`}>
      <circle r={56} fill={c} stroke={line(c)} strokeWidth={7} />
      {ok ? <path d="M-26 2 L-6 22 L28 -18" stroke="#ffffff" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        : <path d="M-20 -20 L20 20 M20 -20 L-20 20" stroke="#ffffff" strokeWidth={14} strokeLinecap="round" />}
    </g>
  );
};
