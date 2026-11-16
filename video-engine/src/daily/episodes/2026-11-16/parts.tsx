import React from 'react';
import {line, light, mix, shade} from '../../../look/color';
import {ContactShadow, Glow, clamp01, useUid} from '../../../look/Kit';
import {Visor, type MachineMood} from '../../../look/machines';
import {FONT} from '../../../lib/type';

/**
 * Parts for creek-watch-1116 (November 16th, 2026). Drawn fresh for this film in the look v2 idiom:
 * round, lit from the upper left, hue-tinted line, grounded, alive on `frame`.
 *
 *  FloodSensor  the hero. A creek-side flood sensor on a pole with an arm reaching out over the water,
 *               a solar panel, an antenna whose light blinks when it reports, and a rounded housing
 *               that looks DOWN at the creek with a visor face. `ping` 0 to 1 sends a pulse down.
 *  Creek        a creek in cross-section: two grassy banks and the water between at `level`.
 *  WatershedMap the colour-coded public map: a creek line, its branches and sensor dots.
 *
 * Every state is a function of the film clock. No number is drawn here that a caller did not pass.
 */

const Lit: React.FC<{id: string; c: string; k?: number}> = ({id, c, k = 0.38}) => (
  <linearGradient id={id} x1="0" y1="0" x2="0.4" y2="1">
    <stop offset="0%" stopColor={light(c, 0.5)} /><stop offset="45%" stopColor={c} /><stop offset="100%" stopColor={shade(c, k)} />
  </linearGradient>
);

export const WATER = '#3f8a96';

/**
 * THE FLOOD SENSOR. x, y is the foot of the pole on the bank. The arm reaches `arm` pixels toward
 * `facing` and the housing hangs at its end. `waterY` is the screen y of the water surface below the
 * housing, so the pulse and its return travel the real gap. Scale 1 is about 900 pixels tall.
 */
export const FloodSensor: React.FC<{x: number; y: number; s?: number; frame: number; mood?: MachineMood; ping?: number;
  waterY?: number; arm?: number; facing?: 1 | -1; alert?: boolean; look?: number; tilt?: number}> = ({
  x, y, s = 1, frame, mood = 'happy', ping = -1, waterY, arm = 360, facing = 1, alert = false, look = 0, tilt = 0,
}) => {
  const id = useUid();
  const pole = '#c9d1e3', box = '#f4f6fb', lid = '#3f7fe0', panel = '#2c4aa8';
  const H = 900;
  const hx = arm, hy = -H + 150;
  const bob = Math.sin(frame / 30 * 2.1) * 3;
  const wy = waterY !== undefined ? (waterY - y) / s : 0;
  const gap = Math.max(60, wy - (hy + 120));
  const blink = alert ? (frame % 20 < 10) : (frame % 60 < 6);
  return (
    <g transform={`translate(${x} ${y}) scale(${s * facing} ${s})`}>
      <defs>
        <Lit id={`${id}p`} c={pole} /><Lit id={`${id}b`} c={box} k={0.3} /><Lit id={`${id}l`} c={lid} />
        <linearGradient id={`${id}pv`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6b8bff" />
          <stop offset="100%" stopColor="#1d2a8a" /></linearGradient>
      </defs>
      <ContactShadow x={0} y={6} w={240} opacity={0.34} />
      {/* concrete footing */}
      <rect x={-70} y={-40} width={140} height={50} rx={22} fill="#d8d2c4" stroke={line('#d8d2c4')} strokeWidth={6} />
      {/* the pole */}
      <rect x={-20} y={-H} width={40} height={H - 30} rx={20} fill={`url(#${id}p)`} stroke={line(pole)} strokeWidth={6} />
      <path d={`M-8 ${-H + 30} L-8 -60`} stroke="#ffffff" strokeWidth={6} strokeLinecap="round" opacity={0.45} />
      {/* solar panel, tilted to the sky */}
      <g transform={`translate(-18 ${-H + 40}) rotate(-24)`}>
        <rect x={-210} y={-90} width={200} height={140} rx={22} fill={`url(#${id}pv)`} stroke={line('#2a3a9a')} strokeWidth={6} />
        {[1, 2].map((i) => <path key={i} d={`M${-210 + i * 67} -90 L${-210 + i * 67} 50`} stroke="#9fb2ff" strokeWidth={4} opacity={0.55} />)}
        <path d="M-196 -76 L-120 -76" stroke="#ffffff" strokeWidth={9} strokeLinecap="round" opacity={0.6} />
      </g>
      {/* antenna and its light */}
      <path d={`M0 ${-H} L0 ${-H - 120}`} stroke={shade(pole, 0.3)} strokeWidth={10} strokeLinecap="round" />
      <circle cx={0} cy={-H - 128} r={14} fill={blink ? (alert ? '#ff4d6d' : '#7dff8a') : shade('#7dff8a', 0.5)} />
      {blink && <Glow x={0} y={-H - 128} r={46} color={alert ? '#ff4d6d' : '#7dff8a'} opacity={0.5} />}
      {/* the arm out over the water, with a brace */}
      <path d={`M0 ${-H + 110} L${hx} ${-H + 110}`} stroke={line(pole)} strokeWidth={34} strokeLinecap="round" />
      <path d={`M0 ${-H + 110} L${hx} ${-H + 110}`} stroke={`url(#${id}p)`} strokeWidth={24} strokeLinecap="round" />
      <path d={`M0 ${-H + 260} L${hx * 0.55} ${-H + 116}`} stroke={line(pole)} strokeWidth={16} strokeLinecap="round" />
      <path d={`M0 ${-H + 260} L${hx * 0.55} ${-H + 116}`} stroke={pole} strokeWidth={9} strokeLinecap="round" />
      {/* the housing, hanging at the arm's end, gently alive */}
      <g transform={`translate(${hx} ${hy + bob}) rotate(${tilt})`}>
        <path d="M0 -40 L0 -10" stroke={shade(pole, 0.3)} strokeWidth={14} strokeLinecap="round" />
        <rect x={-120} y={-14} width={240} height={168} rx={64} fill={`url(#${id}b)`} stroke={line(box)} strokeWidth={7} />
        <path d="M-116 30 Q0 -40 116 30 L116 10 Q116 -14 70 -14 L-70 -14 Q-116 -14 -116 10 Z" fill={`url(#${id}l)`} />
        <path d="M-80 4 Q-20 -10 40 -4" stroke="#ffffff" strokeWidth={8} strokeLinecap="round" opacity={0.5} fill="none" />
        <g transform={`scale(${facing} 1)`}><Visor x={0} y={78} w={176} h={72} mood={mood} frame={frame} look={look} /></g>
        {/* the radar eye on the underside */}
        <ellipse cx={0} cy={152} rx={58} ry={16} fill="#1d2150" stroke={line('#1d2150')} strokeWidth={5} />
        <ellipse cx={-14} cy={148} rx={18} ry={5} fill="#ffffff" opacity={0.35} />
        {/* the pulse: rings travel down to the water and a return comes back */}
        {ping >= 0 && ping <= 1 && waterY !== undefined && (() => {
          const down = clamp01(ping / 0.55), up = clamp01((ping - 0.55) / 0.45);
          return <g>
            <path d={`M0 170 L0 ${170 + gap}`} stroke="#38f2e0" strokeWidth={6} strokeDasharray="18 16" opacity={0.55 * (1 - up * 0.6)} />
            {down < 1 && [0, 0.18, 0.36].map((o) => {
              const q = clamp01(down - o);
              return q > 0 ? <path key={o} d={`M${-60 - q * 120} ${170 + q * gap} Q0 ${200 + q * gap} ${60 + q * 120} ${170 + q * gap}`}
                stroke="#38f2e0" strokeWidth={10 - q * 5} fill="none" strokeLinecap="round" opacity={1 - q * 0.5} /> : null;
            })}
            {up > 0 && up < 1 && <path d={`M${-50} ${170 + gap * (1 - up)} Q0 ${140 + gap * (1 - up)} 50 ${170 + gap * (1 - up)}`}
              stroke="#ffe066" strokeWidth={9} fill="none" strokeLinecap="round" />}
            {down >= 1 && <ellipse cx={0} cy={170 + gap} rx={80 + up * 60} ry={14 + up * 8} fill="none" stroke="#38f2e0" strokeWidth={6}
              opacity={1 - up} />}
          </g>;
        })()}
      </g>
    </g>
  );
};

/** A creek in cross-section across the frame: banks top at `bankY`, bed at `bedY`, water at `level`. */
export const Creek: React.FC<{bankY: number; bedY: number; level: number; frame: number; x0?: number; x1?: number;
  muddy?: number}> = ({bankY, bedY, level, frame, x0 = 300, x1 = 780, muddy = 0}) => {
  const id = useUid();
  const t = frame / 30;
  const bank = '#7cb55a', soil = '#a8744a';
  const c = mix(WATER, '#8a6a4a', 0.25 + muddy * 0.5);
  // the channel profile: a soft U from x0 to x1
  const prof = (x: number) => {
    const u = (x - x0) / (x1 - x0);
    if (u <= 0 || u >= 1) return bankY;
    return bankY + (bedY - bankY) * Math.pow(Math.sin(Math.PI * u), 0.7);
  };
  const pts = Array.from({length: 25}, (_, i) => x0 - 40 + ((x1 - x0 + 80) * i) / 24);
  const groundD = `M-40 ${bankY} L${x0 - 40} ${bankY} ${pts.map((x) => `L${x.toFixed(1)} ${prof(x).toFixed(1)}`).join(' ')} L1120 ${bankY} L1120 2000 L-40 2000 Z`;
  // the water fills the channel up to `level` and spills across the banks when level is above bankY
  const lv = level;
  const surf = Array.from({length: 22}, (_, i) => {
    const x = -40 + (1160 * i) / 21;
    return `${x.toFixed(1)} ${(lv + Math.sin(t * 2.3 + i * 1.1) * 4).toFixed(1)}`;
  });
  return (
    <g>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={light(bank, 0.3)} />
          <stop offset="12%" stopColor={bank} /><stop offset="16%" stopColor={soil} /><stop offset="100%" stopColor={shade(soil, 0.5)} /></linearGradient>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={light(c, 0.5)} stopOpacity={0.92} />
          <stop offset="40%" stopColor={c} stopOpacity={0.9} /><stop offset="100%" stopColor={shade(c, 0.55)} stopOpacity={0.95} /></linearGradient>
        <clipPath id={`${id}c`}><path d={`M-40 ${lv} L1120 ${lv} L1120 2000 L-40 2000 Z`} /></clipPath>
        <clipPath id={`${id}ch`}><path d={`M${x0 - 40} ${bankY - 2} ${pts.map((x) => `L${x.toFixed(1)} ${prof(x).toFixed(1)}`).join(' ')} L${x1 + 40} ${bankY - 2} Z`} /></clipPath>
      </defs>
      <path d={groundD} fill={`url(#${id}g)`} stroke={line(bank)} strokeWidth={7} strokeLinejoin="round" />
      {/* water in the channel */}
      <g clipPath={`url(#${id}ch)`}>
        <g clipPath={`url(#${id}c)`}><rect x={-40} y={lv - 10} width={1160} height={2000} fill={`url(#${id}w)`} /></g>
        <path d={`M${surf.join(' L')}`} stroke={light(c, 0.8)} strokeWidth={6} fill="none" strokeLinecap="round" opacity={lv < bedY ? 1 : 0} />
      </g>
      {/* over the banks */}
      {lv < bankY && <g>
        <path d={`M${surf.join(' L')} L1120 ${bankY + 20} L-40 ${bankY + 20} Z`} fill={c} opacity={0.82} />
        <path d={`M${surf.join(' L')}`} stroke={light(c, 0.8)} strokeWidth={6} fill="none" strokeLinecap="round" />
      </g>}
      {/* grass tufts on the bank lip */}
      {[60, 150, 230, 840, 920, 1010].map((gx, i) => <path key={gx} d={`M${gx} ${bankY + 4} q-8 -38 -22 -52 M${gx} ${bankY + 4} q2 -44 10 -58 M${gx} ${bankY + 4} q12 -30 30 -40`}
        stroke={shade(bank, 0.15 + (i % 2) * 0.1)} strokeWidth={7} strokeLinecap="round" fill="none" />)}
    </g>
  );
};

export type DotState = 'green' | 'yellow' | 'red' | 'off';
const DOT: Record<DotState, string> = {green: '#3ee08a', yellow: '#ffcc33', red: '#ff4d5a', off: '#8a90b8'};

/**
 * THE WATERSHED MAP, in a 0..w by 0..h box: a main creek running across, two branches, a second small
 * bayou low on the map, and the sensor dots. `dots` lists [x, y, state, p] where p 0..1 is arrival.
 */
export const WatershedMap: React.FC<{w: number; h: number; frame: number; dots: [number, number, DotState, number][];
  draw?: number; land?: string}> = ({w, h, frame, dots, draw = 1, land = '#2a3a6a'}) => {
  const main = `M${w * 0.02} ${h * 0.3} C${w * 0.25} ${h * 0.18} ${w * 0.4} ${h * 0.46} ${w * 0.6} ${h * 0.36} S${w * 0.85} ${h * 0.24} ${w * 0.98} ${h * 0.4}`;
  const b1 = `M${w * 0.3} ${h * 0.29} C${w * 0.33} ${h * 0.12} ${w * 0.4} ${h * 0.06} ${w * 0.44} ${h * 0.02}`;
  const b2 = `M${w * 0.7} ${h * 0.33} C${w * 0.74} ${h * 0.5} ${w * 0.7} ${h * 0.58} ${w * 0.76} ${h * 0.66}`;
  const bayou = `M${w * 0.1} ${h * 0.86} C${w * 0.35} ${h * 0.78} ${w * 0.6} ${h * 0.94} ${w * 0.95} ${h * 0.82}`;
  const L = 2400;
  return (
    <g>
      <rect x={0} y={0} width={w} height={h} fill={land} />
      {Array.from({length: 7}, (_, i) => <path key={i} d={`M0 ${(h * (i + 1)) / 8} L${w} ${(h * (i + 1)) / 8}`} stroke="#ffffff" strokeWidth={2}
        opacity={0.06} />)}
      {Array.from({length: 5}, (_, i) => <path key={i} d={`M${(w * (i + 1)) / 6} 0 L${(w * (i + 1)) / 6} ${h}`} stroke="#ffffff" strokeWidth={2}
        opacity={0.06} />)}
      {[main, b1, b2, bayou].map((d, i) => <g key={i}>
        <path d={d} stroke="#5ab8ff" strokeWidth={i === 0 ? 26 : 16} fill="none" strokeLinecap="round" opacity={0.25}
          strokeDasharray={L} strokeDashoffset={L * (1 - draw)} />
        <path d={d} stroke="#7fd0ff" strokeWidth={i === 0 ? 12 : 8} fill="none" strokeLinecap="round"
          strokeDasharray={L} strokeDashoffset={L * (1 - draw)} />
      </g>)}
      {dots.map(([x, y, st, p], i) => {
        if (p <= 0) return null;
        const q = clamp01(p);
        const pop = q < 1 ? 1 + Math.sin(q * Math.PI) * 0.5 : 1;
        const pulse = st === 'red' || st === 'yellow' ? 1 + 0.25 * Math.max(0, Math.sin(frame / 30 * 6 + i)) : 1;
        return <g key={i} transform={`translate(${x * w} ${y * h}) scale(${pop})`}>
          <circle r={34 * pulse} fill={DOT[st]} opacity={0.28} />
          <circle r={20} fill={DOT[st]} stroke={line(DOT[st])} strokeWidth={5} />
          <circle cx={-6} cy={-7} r={6} fill="#ffffff" opacity={0.6} />
        </g>;
      })}
    </g>
  );
};

/** a big count in SVG that lands with a squash */
export const BigNumber: React.FC<{x: number; y: number; text: string; p: number; size?: number; color?: string; sub?: string; font?: string}> = ({
  x, y, text, p, size = 220, color = '#ffffff', sub, font,
}) => {
  const q = clamp01(p);
  if (q <= 0) return null;
  const sq = q >= 1 ? 1 : 1 + Math.sin(q * Math.PI) * 0.35;
  return (
    <g transform={`translate(${x} ${y}) scale(${sq} ${2 - sq})`} opacity={clamp01(q * 4)}>
      <text x={0} y={0} textAnchor="middle" fontFamily={font ?? FONT.mono} fontWeight={800} fontSize={size} fill={color}
        stroke="#1a1236" strokeWidth={size * 0.1} paintOrder="stroke">{text}</text>
      {sub && <text x={0} y={size * 0.45} textAnchor="middle" fontFamily={FONT.mono} fontWeight={700} fontSize={Math.max(44, size * 0.26)}
        fill="#fff4dc" stroke="#1a1236" strokeWidth={size * 0.05} paintOrder="stroke">{sub}</text>}
    </g>
  );
};
