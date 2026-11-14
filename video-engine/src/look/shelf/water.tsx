import React from 'react';
import {M} from '../../lib/scale';
import {FONT, wrapToWidth} from '../../lib/type';
import {light, line, mix, shade} from '../color';
import {ContactShadow, Glow, useUid} from '../Kit';
import {taper} from '../props';
import {Bloom, Bolt, Cloud, Rain, hash, heap, rr} from './skies';

/**
 * WATER, LOOK V2 (November 14th, 2026).
 *
 * The flood warning set from lib/water.tsx redrawn in the v2 idiom. A stream gauge, a low water
 * crossing, a siren mast, a rain cell and a phone with an alert on it. Round, lit from the upper left,
 * outlined in each fill's own deep hue, grounded, and alive (water ripples and glints, a light
 * blinks, the siren head turns, rain falls and lightning strikes now and then).
 *
 * THE FOUR RULES of the library file still hold and are not style. No water with people in it and no
 * vehicle carried, so nothing here draws one. The gauge is the subject. No number is invented, so a
 * stage reading, a headline and a body come only from props and a gauge with none reads nothing. And
 * the warning is never a verdict, so there is no all clear state and no red zone, only a threshold
 * line. None of these drawings has a face. It is the one beat where a character would make light of
 * somebody's worst day.
 *
 * PLACEMENT is the library's. x, y at the ground, `scale` 1 is true size through the one metre in
 * lib/scale.ts, and each drawing is built in centimetres at the same overall size as the library
 * drawing it replaces. `RainCell` stays in the frame's own units, like a sky.
 */
const CM = M / 100;
export const WATER_V2_M: Record<string, {h: number; note: string}> = {
  streamGauge: {h: 4.5, note: 'ground to the antenna tip, the staff plate about 2.2 m of it'},
  lowWaterCrossing: {h: 1.35, note: 'the depth marker post beside the slab'},
  sirenMast: {h: 9.0, note: 'ground to the top of the siren head'},
  handset: {h: 0.29, note: 'the phone as the library draws it, held in the hand'},
};

interface RigV2 {x?: number; y?: number; scale?: number; frame?: number; facing?: 1 | -1; seed?: number; wear?: number}
const at = (p: RigV2, unit = 1) =>
  `translate(${p.x ?? 0} ${p.y ?? 0}) scale(${(p.scale ?? 1) * CM * unit * (p.facing ?? 1)} ${(p.scale ?? 1) * CM * unit})`;
/** outline half width in local units, about 3.4 film pixels a side at any scale */
const owOf = (scale?: number, unit = 1) => 3.4 / ((scale ?? 1) * CM * unit);
const f1 = (n: number) => n.toFixed(1);

/** a lit material, light at the upper left through the fill to violet shade at the lower right */
const Lit: React.FC<{id: string; c: string; dir?: 'h' | 'v' | 'd'; k?: number}> = ({id, c, dir = 'd', k = 0.4}) => (
  <linearGradient id={id} x1="0" y1="0" x2={dir === 'v' ? '0' : dir === 'h' ? '1' : '0.4'} y2={dir === 'h' ? '0' : '1'}>
    <stop offset="0%" stopColor={light(c, 0.5)} /><stop offset="42%" stopColor={c} /><stop offset="100%" stopColor={shade(c, k)} />
  </linearGradient>
);

/**
 * A BODY OF WATER seen from the side, from `x0` to `x1` with its surface at `y` and its bed at
 * `bed`. Lit depth (a pale sky reflection at the top falling to deep blue), a surface line that
 * ripples, a bright stripe just under it, glints that come and go, and a soft caustic shimmer.
 */
const WaterBody: React.FC<{x0: number; x1: number; y: number; bed: number; frame: number; ow: number; seed?: number;
  c?: string; opacity?: number; amp?: number; basin?: boolean}> = ({x0, x1, y, bed, frame, ow, seed = 1, c = '#2f8ec8', opacity = 0.82, amp = 2.4,
  basin = false}) => {
  const id = useUid();
  const t = frame / 30, w = x1 - x0, n = 12;
  const surf = Array.from({length: n + 1}, (_, i) => {
    const x = x0 + (w * i) / n;
    return [x, y + Math.sin(t * 2.2 + i * 1.3 + seed) * amp] as [number, number];
  });
  const sd = `M${surf.map((p) => `${f1(p[0])} ${f1(p[1])}`).join(' L')}`;
  const r = Math.min((bed - y) * 0.9, w * 0.2);
  const body = basin
    ? `${sd} C${f1(x1 + r * 0.2)} ${f1(y + r * 0.6)} ${f1(x1 - r * 0.3)} ${f1(bed)} ${f1(x1 - r * 1.2)} ${f1(bed)} L${f1(x0 + r * 1.2)} ${f1(bed)}`
      + ` C${f1(x0 + r * 0.3)} ${f1(bed)} ${f1(x0 - r * 0.2)} ${f1(y + r * 0.6)} ${f1(x0)} ${f1(y)} Z`
    : `${sd} L${f1(x1)} ${f1(bed)} L${f1(x0)} ${f1(bed)} Z`;
  return <g>
    <defs>
      <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={light(c, 0.55)} stopOpacity={opacity} /><stop offset="35%" stopColor={c} stopOpacity={opacity} />
        <stop offset="100%" stopColor={shade(c, 0.55)} stopOpacity={Math.min(1, opacity + 0.1)} />
      </linearGradient>
      <clipPath id={`${id}c`}><path d={body} /></clipPath>
    </defs>
    {basin && <path d={body} fill="none" stroke={line(c)} strokeWidth={ow * 2} strokeLinejoin="round" />}
    <path d={body} fill={`url(#${id}w)`} />
    <g clipPath={`url(#${id}c)`}>
      {Array.from({length: 5}, (_, i) => {
        const x = x0 + ((hash(seed, i) * w + t * 18 * (i % 2 ? 1 : -1)) % w + w) % w;
        return <ellipse key={i} cx={x} cy={y + (bed - y) * (0.35 + hash(seed, 10 + i) * 0.4)} rx={w * 0.08} ry={(bed - y) * 0.05}
          fill="#ffffff" opacity={0.1} />;
      })}
      <path d={sd} transform={`translate(0 ${f1((bed - y) * 0.12)})`} stroke="#ffffff" strokeWidth={ow * 1.4} fill="none" opacity={0.22}
        strokeLinecap="round" />
    </g>
    <path d={sd} stroke={line(c)} strokeWidth={ow * 2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d={sd} stroke={light(c, 0.8)} strokeWidth={ow * 1.1} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    {Array.from({length: 4}, (_, k) => {
      const tw = Math.max(0, Math.sin(t * 2.6 + k * 1.9 + seed));
      const gx = x0 + w * (0.15 + k * 0.22);
      return <ellipse key={k} cx={gx} cy={y + 1.5} rx={ow * 3 * tw} ry={ow * 0.9 * tw} fill="#ffffff" />;
    })}
  </g>;
};

// ================================================================================== STREAM GAUGE

/** THE STREAM GAUGE. An enamelled staff plate on a steel pile driven into the bank, the instrument
 *  shelter above it with its solar panel and antenna, a status light that blinks while it reports.
 *  `stage` and `threshold` are fractions of the plate from the caller, `stageLabel` the caller's text. */
export const StreamGaugeV2: React.FC<RigV2 & {stage?: number; threshold?: number; stageLabel?: string; reporting?: boolean}> = (p) => {
  const {frame = 0, seed = 1, wear = 0.5, stage, threshold, stageLabel, reporting = true} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const steel = '#9aa6c4', enamel = '#f6f1e6', shelter = '#d8dfee', roof = '#5a6aa8', panel = '#2c4aa8', mark = '#2a2a5c';
  const dirt = '#b8875a', grass = '#6aa84a';
  const plateTop = -255, plateBot = -31;
  const lv = (v: number) => plateBot + (plateTop - plateBot) * Math.max(0, Math.min(1, v));
  const lvl = stage === undefined ? undefined : lv(stage);
  const thr = threshold === undefined ? undefined : lv(threshold);
  const blink = reporting && Math.sin(frame / 11) > 0.6;
  const label = stageLabel ? wrapToWidth(stageLabel, 220, 34) : [];
  return (
    <g transform={at(p)}>
      <defs>
        <Lit id={`${id}s`} c={steel} dir="h" /><Lit id={`${id}e`} c={enamel} k={0.18} /><Lit id={`${id}b`} c={shelter} />
        <Lit id={`${id}r`} c={roof} /><Lit id={`${id}d`} c={dirt} dir="v" /><linearGradient id={`${id}p`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6a8cf0" />
          <stop offset="100%" stopColor="#1c2c7a" /></linearGradient>
      </defs>
      <ContactShadow x={0} y={3} w={130} opacity={0.32} />
      {lvl !== undefined && <g>
        {/* the channel cut into its bank, so the water sits in the ground and not in the air */}
        <ContactShadow x={25} y={18} w={1000} opacity={0.22} />
        <path d={`M-490 18 C-410 18 -350 ${lvl - 12} -262 ${lvl - 12} L312 ${lvl - 12} C400 ${lvl - 12} 460 18 540 18 Q25 34 -490 18 Z`} fill={`url(#${id}d)`}
          stroke={line(dirt)} strokeWidth={ow * 2} strokeLinejoin="round" paintOrder="stroke" />
        {[-270, -238, 300, 326].map((x, i) => <path key={x} d={taper([[x, lvl - 10], [x + Math.sin(frame / 25 + i) * 3 + (i % 2 ? 4 : -4), lvl - 34]], 6, 2)}
          fill={grass} stroke={line(grass)} strokeWidth={ow} paintOrder="stroke" />)}
        <WaterBody x0={-210} x1={260} y={lvl} bed={14} frame={frame} ow={ow} seed={seed} opacity={0.75} c="#2a78b8" basin />
      </g>}
      {/* outline pass of every joined part, then the fills */}
      <g fill={line(steel)} stroke={line(steel)} strokeWidth={ow * 2} strokeLinejoin="round">
        <rect x={-12} y={-276} width={24} height={278} rx={12} />
        <rect x={-6} y={-445} width={12} height={110} rx={6} />
        <path d="M-10 -300 L-70 -384" strokeWidth={ow * 2 + 12} strokeLinecap="round" />
      </g>
      <rect x={-12} y={-276} width={24} height={278} rx={12} fill={`url(#${id}s)`} />
      <rect x={-6} y={-445} width={12} height={110} rx={6} fill={`url(#${id}s)`} />
      <path d="M-10 -300 L-70 -384" stroke={shade(steel, 0.15)} strokeWidth={12} strokeLinecap="round" />
      {/* the staff plate, ticks and no digits, because digits here would be a number nobody measured */}
      <rect x={12} y={plateTop - 6} width={36} height={plateBot - plateTop + 12} rx={8} fill={`url(#${id}e)`} stroke={line(enamel)}
        strokeWidth={ow * 2} paintOrder="stroke" />
      {Array.from({length: 23}, (_, i) => {
        const yy = plateTop + (i / 22) * (plateBot - plateTop), major = i % 5 === 0;
        return <path key={i} d={`M17 ${f1(yy)} L${major ? 42 : 30} ${f1(yy)}`} stroke={mark} strokeWidth={major ? 4.4 : 2.6} strokeLinecap="round" />;
      })}
      <path d={`M16 ${plateTop + 4} L16 ${plateBot - 4}`} stroke="#ffffff" strokeWidth={3} strokeLinecap="round" opacity={0.7} />
      {/* the near water in front, see-through so the plate reads through it */}
      {lvl !== undefined && <g>
        <ellipse cx={18} cy={lvl} rx={40} ry={4} fill="#ffffff" opacity={0.75} />
      </g>}
      {/* the flood stage line, a line and never a shaded zone */}
      {thr !== undefined && <g>
        <path d={`M-40 ${thr} L74 ${thr}`} stroke={line('#ff8a3a')} strokeWidth={8 + ow * 2} strokeLinecap="round" />
        <path d={`M-40 ${thr} L74 ${thr}`} stroke="#ff9a4a" strokeWidth={8} strokeLinecap="round" />
        <path d={`M-34 ${thr - 1.6} L20 ${thr - 1.6}`} stroke="#ffe0b0" strokeWidth={2.4} strokeLinecap="round" />
      </g>}
      {/* the shelter, the roof and the panel */}
      <path d={rr(-56, -352, 100, 72, 14)} fill={`url(#${id}b)`} stroke={line(shelter)} strokeWidth={ow * 2} paintOrder="stroke" />
      {[-330, -316, -302].map((yy) => <path key={yy} d={`M-38 ${yy} L-6 ${yy}`} stroke={shade(shelter, 0.3)} strokeWidth={4} strokeLinecap="round" />)}
      <circle cx={24} cy={-316} r={5} fill={shade(shelter, 0.4)} />
      <path d="M-66 -350 Q-6 -392 54 -350 Q-6 -366 -66 -350 Z" fill={`url(#${id}r)`} stroke={line(roof)} strokeWidth={ow * 2}
        strokeLinejoin="round" paintOrder="stroke" />
      <path d="M-48 -356 Q-14 -378 18 -372" stroke={light(roof, 0.6)} strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.7} />
      <g transform="translate(-74 -398) rotate(-24)">
        <path d={rr(-34, -18, 68, 36, 8)} fill={`url(#${id}p)`} stroke={line(panel)} strokeWidth={ow * 2} paintOrder="stroke" />
        <path d="M-11 -17 L-11 17 M12 -17 L12 17 M-33 0 L33 0" stroke="#8aa4ff" strokeWidth={2.4} opacity={0.6} />
        <path d="M-26 -11 L-4 -11" stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.6} />
      </g>
      {/* the antenna and the light that says it is still reporting */}
      <circle cx={0} cy={-452} r={9} fill={blink ? '#5affc0' : '#3e5a58'} stroke={line('#3e5a58')} strokeWidth={ow * 1.4} paintOrder="stroke" />
      {blink && <Glow x={0} y={-452} r={40} color="#5affc0" opacity={0.8} />}
      {wear > 0.3 && <path d={`M-4 -260 q3 ${40 + hash(seed, 1) * 30} -1 ${90 + hash(seed, 2) * 40}`} stroke="#b8643a" strokeWidth={4}
        strokeLinecap="round" fill="none" opacity={wear * 0.6} />}
      {label.length > 0 && <g transform={`translate(70 ${plateTop})`}>
        <path d={rr(0, -8, Math.max(...label.map((l) => l.length)) * 20 + 36, label.length * 42 + 20, 22)} fill="#ffffff"
          stroke={line('#ffffff')} strokeWidth={ow * 1.6} paintOrder="stroke" />
        {label.map((l, i) => <text key={i} x={18} y={30 + i * 42} fontSize={34} fontWeight={700} fill="#2b2440" fontFamily={FONT.body}>{l}</text>)}
      </g>}
    </g>
  );
};

// ============================================================================= LOW WATER CROSSING

/** THE LOW WATER CROSSING. A concrete slab through a creek bed, gravel and grass on the banks, a
 *  banded depth marker, and the swing gate across the road with its light blinking when closed.
 *  Drawn dry by default, and `depth` is held well under the marker. */
export const LowWaterCrossingV2: React.FC<RigV2 & {depth?: number; closed?: boolean}> = (p) => {
  const {frame = 0, seed = 2, wear = 0.5, depth = 0, closed = true} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const t = frame / 30;
  const dirt = '#c8945a', gate = '#ffc23a', post = '#8a96b8', grass = '#6aa84a';
  const d = Math.max(0, Math.min(0.45, depth));
  // the road's profile, level on the approaches and dipping to the slab through the creek bed
  const ry = (x: number) => {
    const u = Math.max(0, Math.min(1, (Math.abs(x) - 110) / 190));
    return 36 * (1 - u * u * (3 - 2 * u));
  };
  const xs = Array.from({length: 46}, (_, i) => -360 + i * 16);
  const topE = xs.map((x) => `L${x} ${f1(ry(x))}`).join(' ');
  const bank = `M-376 12 Q-376 0 -360 0 ${topE} Q376 0 376 12 L376 66 Q376 82 360 82 Q0 92 -360 82 Q-376 82 -376 66 Z`;
  const road = `M-366 7 ${xs.map((x) => `L${x} ${f1(ry(x) + 7)}`).join(' ')} L366 7`;
  const asph = '#6a6a8e', wl = 36 - d * 40;
  // the drawing is lifted so the bank's foot, not the road, meets the ground line at the origin
  return (
    <g transform={at(p)}><g transform="translate(0 -64)">
      <defs><Lit id={`${id}d`} c={dirt} dir="v" /><Lit id={`${id}p`} c={post} dir="h" />
        <clipPath id={`${id}arm`}><path d={rr(0, -88, 236, 18, 9)} /></clipPath>
        <clipPath id={`${id}slab`}><rect x={-130} y={-20} width={260} height={100} /></clipPath></defs>
      <ContactShadow x={0} y={84} w={820} opacity={0.22} />
      <path d={bank} fill={`url(#${id}d)`} stroke={line(dirt)} strokeWidth={ow * 2} strokeLinejoin="round" paintOrder="stroke" />
      {Array.from({length: 34}, (_, i) => {
        const k = hash(seed, i), k2 = hash(seed, 100 + i), x = -350 + k * 700;
        return <ellipse key={i} cx={x} cy={ry(x) + 24 + k2 * (50 - ry(x) * 0.5)} rx={3 + k * 6} ry={2 + k2 * 3} fill={i % 3 ? light(dirt, 0.25) : shade(dirt, 0.2)} />;
      })}
      {/* the road down to the slab and up again, asphalt on the approaches and concrete through the bed */}
      <path d={road} stroke={line(asph)} strokeWidth={14 + ow * 2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={road} stroke={asph} strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <g clipPath={`url(#${id}slab)`}><path d={road} stroke="#e2dccf" strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>
      <path d={road} stroke="#ffffff" strokeWidth={2.6} fill="none" strokeLinejoin="round" transform="translate(0 -4)" opacity={0.45} />
      {d > 0.01 && <WaterBody x0={-178} x1={178} y={wl} bed={52} frame={frame} ow={ow} seed={seed} amp={1.4} opacity={0.72} basin />}
      {d > 0.01 && Array.from({length: 5}, (_, i) => {
        const x = ((t * 50 + i * 70) % 300) - 150;
        return <path key={i} d={`M${x} ${wl + 6} q8 -4 16 0`} stroke="#ffffff" strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.7} />;
      })}
      {[-350, -318, 318, 350].map((x, i) => {
        const s = Math.sin(t * 1.3 + i) * 2;
        return <g key={x} transform={`translate(${x} ${2})`}>{[-6, 0, 6].map((dx, j) => <path key={j} d={taper([[dx * 0.4, 0], [dx + s, -16 - j * 3]], 4.4, 1.6)}
          fill={j === 1 ? light(grass, 0.25) : grass} stroke={line(grass)} strokeWidth={ow} paintOrder="stroke" />)}</g>;
      })}
      {/* the depth marker, banded and without digits */}
      <g transform={`translate(180 ${f1(ry(180))})`}>
        <ContactShadow x={0} y={20} w={40} opacity={0.3} />
        <path d={rr(-6, -118, 12, 140, 6)} fill="#fbf7ee" stroke={line('#f0e8d8')} strokeWidth={ow * 2} paintOrder="stroke" />
        {Array.from({length: 7}, (_, i) => <path key={i} d={rr(-6, -112 + i * 17, 12, 8.5, 2)} fill={i % 2 ? '#e8484a' : '#fbf7ee'} />)}
        <path d="M-3 -114 L-3 16" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" opacity={0.7} />
      </g>
      {/* the swing gate */}
      <g transform={`translate(-252 ${f1(ry(252))})`}>
        <ContactShadow x={0} y={4} w={50} opacity={0.32} />
        <path d={rr(-6, -102, 12, 104, 6)} fill={`url(#${id}p)`} stroke={line(post)} strokeWidth={ow * 2} paintOrder="stroke" />
        <g transform={`rotate(${closed ? 0 : -78} 0 -80)`}>
          <path d={rr(0, -88, 236, 18, 9)} fill={gate} stroke={line(gate)} strokeWidth={ow * 2} paintOrder="stroke" />
          <g clipPath={`url(#${id}arm)`}>{Array.from({length: 8}, (_, i) => <path key={i} d={`M${12 + i * 32} -92 L${30 + i * 32} -66`}
            stroke="#2b2440" strokeWidth={10} />)}
            <path d="M0 -84 L236 -84" stroke="#ffffff" strokeWidth={3} opacity={0.5} /></g>
          <path d={rr(0, -88, 236, 18, 9)} fill="none" stroke={line(gate)} strokeWidth={ow} />
        </g>
        <circle cx={0} cy={-104} r={8} fill={post} stroke={line(post)} strokeWidth={ow * 1.6} paintOrder="stroke" />
        {closed && <>
          <circle cx={0} cy={-118} r={7} fill={Math.sin(frame / 7) > 0 ? '#ff4d5a' : '#6a2a3a'} stroke={line('#6a2a3a')} strokeWidth={ow * 1.4}
            paintOrder="stroke" />
          {Math.sin(frame / 7) > 0 && <Glow x={0} y={-118} r={34} color="#ff4d5a" opacity={0.8} />}
        </>}
        {wear > 0.3 && <path d="M2 -90 q2 30 -1 70" stroke="#b8643a" strokeWidth={3} fill="none" strokeLinecap="round" opacity={wear * 0.5} />}
      </g>
    </g></g>
  );
};

// ==================================================================================== SIREN MAST

/** THE SIREN MAST. A pole with climbing pegs, a horn cluster that turns about the pole when it
 *  sounds (the horns swing round in depth), sound drawn as two thin arcs that fade, and the solar
 *  panel and battery cabinet that keep it working when the power has gone */
export const SirenMastV2: React.FC<RigV2 & {sounding?: boolean}> = (p) => {
  const {frame = 0, seed = 3, wear = 0.4, sounding = false} = p;
  const id = useUid();
  const ow = owOf(p.scale);
  const steel = '#a8b2cc', horn = '#d8dcea', box = '#8a9cc8', amber = '#ffb43a';
  const spin = sounding ? (frame / 30) * 200 : hash(seed, 1) * 360;
  const ring = (frame % 60) / 60;
  const horns = [0, 120, 240].map((a) => {
    const r = (a + spin) * Math.PI / 180;
    return {c: Math.cos(r), s: Math.sin(r), a};
  }).sort((u, v) => u.s - v.s);
  const hornPath = (c: number, s: number) => {
    const L = 132 * c, mouth = 40, mx = L, mrx = Math.max(4, mouth * Math.abs(s));
    return {body: `M0 -16 C${f1(L * 0.5)} -16 ${f1(L * 0.8)} ${-mouth} ${f1(mx)} ${-mouth} L${f1(mx)} ${mouth} C${f1(L * 0.8)} ${mouth} ${f1(L * 0.5)} 16 0 16 Z`,
      mx, mrx, mouth, front: s > 0};
  };
  const Horn = ({c, s}: {c: number; s: number}) => {
    const h = hornPath(c, s);
    const col = mix(horn, '#7a84b0', (1 - s) * 0.25);
    return <g>
      <path d={h.body} fill={col} stroke={line(horn)} strokeWidth={ow * 2} strokeLinejoin="round" paintOrder="stroke" />
      <path d={`M${f1(h.mx * 0.15)} -10 C${f1(h.mx * 0.5)} -12 ${f1(h.mx * 0.75)} ${-h.mouth * 0.8} ${f1(h.mx * 0.95)} ${-h.mouth * 0.85}`} stroke="#ffffff"
        strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.55} />
      <ellipse cx={h.mx} cy={0} rx={h.mrx} ry={h.mouth} fill={h.front ? '#2b2850' : shade(col, 0.2)} stroke={line(horn)} strokeWidth={ow * 1.6}
        paintOrder="stroke" />
    </g>;
  };
  return (
    <g transform={at(p)}>
      <defs><Lit id={`${id}s`} c={steel} dir="h" /><Lit id={`${id}b`} c={box} />
        <linearGradient id={`${id}pv`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6a8cf0" /><stop offset="100%" stopColor="#1c2c7a" /></linearGradient></defs>
      <ContactShadow x={0} y={4} w={200} opacity={0.32} />
      {/* outline pass of pole, arm and cabinet, then the fills */}
      <g fill={line(steel)} stroke={line(steel)} strokeWidth={ow * 2} strokeLinejoin="round">
        <path d="M-30 0 L-22 -800 Q0 -812 22 -800 L30 0 Z" />
        <path d="M10 -640 L100 -680" strokeWidth={ow * 2 + 16} strokeLinecap="round" />
      </g>
      <path d="M-30 0 L-22 -800 Q0 -812 22 -800 L30 0 Z" fill={`url(#${id}s)`} />
      <path d="M-16 -20 L-12 -790" stroke="#ffffff" strokeWidth={6} strokeLinecap="round" opacity={0.35} />
      <path d="M10 -640 L100 -680" stroke={shade(steel, 0.15)} strokeWidth={16} strokeLinecap="round" />
      {Array.from({length: 11}, (_, i) => {
        const y = -110 - i * 58, sd = i % 2 ? 1 : -1;
        return <path key={i} d={`M${sd * 20} ${y} l${sd * 26} 0`} stroke={line(steel)} strokeWidth={ow * 2 + 7} strokeLinecap="round" />;
      })}
      {Array.from({length: 11}, (_, i) => {
        const y = -110 - i * 58, sd = i % 2 ? 1 : -1;
        return <path key={`p${i}`} d={`M${sd * 20} ${y} l${sd * 26} 0`} stroke={light(steel, 0.2)} strokeWidth={7} strokeLinecap="round" />;
      })}
      {/* the solar panel */}
      <g transform="translate(120 -690) rotate(-22)">
        <path d={rr(-74, -40, 148, 80, 12)} fill={`url(#${id}pv)`} stroke={line('#2c4aa8')} strokeWidth={ow * 2} paintOrder="stroke" />
        <path d="M-25 -39 L-25 39 M25 -39 L25 39 M-73 0 L73 0" stroke="#8aa4ff" strokeWidth={3} opacity={0.55} />
        <path d="M-58 -26 L-10 -26" stroke="#ffffff" strokeWidth={6} strokeLinecap="round" opacity={0.55} />
      </g>
      {/* the head, horns behind the hub, the hub, then horns in front */}
      <g transform="translate(0 -858)">
        <ellipse cx={0} cy={50} rx={56} ry={16} fill={shade(steel, 0.2)} stroke={line(steel)} strokeWidth={ow * 2} paintOrder="stroke" />
        {horns.filter((h) => h.s <= 0).map((h) => <Horn key={h.a} c={h.c} s={h.s} />)}
        <path d={rr(-34, -46, 68, 96, 30)} fill={`url(#${id}b)`} stroke={line(box)} strokeWidth={ow * 2} paintOrder="stroke" />
        <path d="M-20 -30 Q-22 0 -18 30" stroke="#ffffff" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.5} />
        {horns.filter((h) => h.s > 0).map((h) => <Horn key={h.a} c={h.c} s={h.s} />)}
        <ellipse cx={0} cy={-50} rx={26} ry={9} fill={light(box, 0.3)} stroke={line(box)} strokeWidth={ow * 1.6} paintOrder="stroke" />
        {sounding && [0, 1].map((i) => {
          const q = (ring + i * 0.5) % 1, r = 180 + q * 300;
          return <g key={i} opacity={0.75 * (1 - q)}>
            <path d={`M${-r * 0.7} ${-r * 0.55} A${r} ${r} 0 0 0 ${-r * 0.7} ${r * 0.55}`} stroke={amber} strokeWidth={9} fill="none" strokeLinecap="round" />
            <path d={`M${r * 0.7} ${-r * 0.55} A${r} ${r} 0 0 1 ${r * 0.7} ${r * 0.55}`} stroke={amber} strokeWidth={9} fill="none" strokeLinecap="round" />
          </g>;
        })}
      </g>
      {/* the battery cabinet at the foot */}
      <path d={rr(-96, -224, 130, 224, 18)} fill={`url(#${id}b)`} stroke={line(box)} strokeWidth={ow * 2} paintOrder="stroke" />
      <path d={rr(-80, -206, 98, 186, 10)} fill="none" stroke={shade(box, 0.25)} strokeWidth={4} />
      {[-150, -136, -122].map((y) => <path key={y} d={`M-62 ${y} L0 ${y}`} stroke={shade(box, 0.3)} strokeWidth={5} strokeLinecap="round" />)}
      <circle cx={-62} cy={-184} r={9} fill={sounding ? (frame % 20 < 10 ? '#ff4d5a' : '#7a2a3a') : '#5ae08a'} />
      {sounding && frame % 20 < 10 && <Glow x={-62} y={-184} r={40} color="#ff4d5a" opacity={0.7} />}
      <path d="M-84 -212 L-30 -212" stroke="#ffffff" strokeWidth={6} strokeLinecap="round" opacity={0.45} />
      {wear > 0.25 && <path d={`M6 -760 q4 ${120 + hash(seed, 2) * 80} -2 ${300 + hash(seed, 3) * 100}`} stroke="#b8643a" strokeWidth={5}
        strokeLinecap="round" fill="none" opacity={wear * 0.5} />}
    </g>
  );
};

// ===================================================================================== RAIN CELL

/** THE RAIN CELL. A convective cell seen from a long way off, a flat dark base, a tower of lit
 *  lobes, the anvil sheared downwind, a rain shaft with streaks leaning in the wind, and a stroke of
 *  lightning when asked for. Frame units, in the box (x, y, w, h). */
export const RainCellV2: React.FC<{x?: number; y?: number; w?: number; h?: number; frame?: number; seed?: number; intensity?: number;
  shear?: 1 | -1; lightning?: boolean}> = ({x = 0, y = 0, w = 700, h = 520, frame = 0, seed = 7, intensity = 0.75, shear = 1,
  lightning = false}) => {
  const id = useUid();
  const cx = x + w / 2, base = y + h * 0.62;
  const tone = {lit: '#fffaf0', mid: '#e8ecf6', shade: '#a8b4dc', base: '#525c94'};
  const tower = heap(cx, base, w * 0.44, base - (y + h * 0.1), seed, frame, {rows: 4, taper: 0.2, lean: shear * 0.1, boil: 0.03});
  const ow = Math.max(1.6, w / 300);
  const ay = y + h * 0.13, a0 = cx - shear * w * 0.12, a1 = cx + shear * w * 0.5;
  const lo = Math.min(a0, a1), hi = Math.max(a0, a1);
  const anvil = `M${lo} ${ay + h * 0.03} C${lo} ${ay - h * 0.04} ${lo + (hi - lo) * 0.3} ${ay - h * 0.06} ${(lo + hi) / 2} ${ay - h * 0.06}`
    + ` C${hi - (hi - lo) * 0.2} ${ay - h * 0.06} ${hi + w * 0.03} ${ay - h * 0.02} ${hi} ${ay + h * 0.02}`
    + ` C${hi - w * 0.02} ${ay + h * 0.05} ${lo + (hi - lo) * 0.3} ${ay + h * 0.07} ${lo + w * 0.02} ${ay + h * 0.06} C${lo - w * 0.01} ${ay + h * 0.055} ${lo} ${ay + h * 0.04} ${lo} ${ay + h * 0.03} Z`;
  return (
    <g>
      <defs><linearGradient id={`${id}a`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={tone.lit} />
        <stop offset="60%" stopColor={tone.mid} /><stop offset="100%" stopColor={tone.shade} /></linearGradient></defs>
      <Rain a={cx - w * 0.2} b={cx + w * 0.18} c={cx - w * 0.27 + shear * w * 0.04} d={cx + w * 0.22 + shear * w * 0.04} y0={base - h * 0.04}
        y1={y + h} frame={frame} seed={seed} color="#5a62a0" streak="#e0e8ff" n={28} speed={18} opacity={0.4 + intensity * 0.45} />
      {lightning && <>
        <Bolt x={cx - w * 0.04} y0={base} y1={y + h * 0.96} frame={frame} seed={seed} period={71} spread={w * 0.12} flash={false} />
        {(frame + seed * 13) % 71 < 3 && <Bloom x={cx} y={base - h * 0.08} r={w * 0.35} color="#eef2ff" opacity={0.5} />}
      </>}
      <path d={anvil} fill={`url(#${id}a)`} stroke={line(tone.shade)} strokeWidth={ow * 2} strokeLinejoin="round" paintOrder="stroke" />
      <path d={`M${lo + w * 0.04} ${ay - h * 0.01} Q${(lo + hi) / 2} ${ay - h * 0.05} ${hi - w * 0.06} ${ay - h * 0.02}`} stroke="#ffffff"
        strokeWidth={ow * 1.6} strokeLinecap="round" fill="none" opacity={0.7} />
      <Cloud blobs={tower.blobs} base={tower.base} core={tower.core} tone={tone} ow={ow} under="#e8b8c0" underOpacity={0.3} />
    </g>
  );
};

// ================================================================================= HANDSET ALERT

/** where every line of the banner goes, from whatever the caller passed, in millimetres */
export const alertBannerV2 = (headline?: string, body?: string) => {
  const head = headline ? wrapToWidth(headline, 104, 12, true) : [];
  const rest = body ? wrapToWidth(body, 104, 10.5, false) : [];
  const top = -112, headBase = top + 34;
  const lastHead = head.length ? headBase + (head.length - 1) * 14 : top + 18;
  const bodyBase = lastHead + 16;
  const lastBody = rest.length ? bodyBase + (rest.length - 1) * 12.6 : lastHead;
  const bottom = lastBody + 12;
  return {head, body: rest, top, headBase, bodyBase, bottom, height: bottom - top, furniture: [bottom + 18, bottom + 34]};
};

/** THE PHONE WITH THE ALERT, held in a hand. A lit rounded handset, a glowing screen, a frosted
 *  banner that wraps whatever headline and body it is given and grows to hold them, and a buzz with
 *  thin shake marks when it rings. The text is the caller's and nothing else on the screen is text. */
export const HandsetAlertV2: React.FC<RigV2 & {headline?: string; body?: string; ringing?: boolean; hand?: boolean; skin?: string}> = (p) => {
  const {frame = 0, seed = 5, headline, body, ringing = true, hand = true, skin = '#c98a5a'} = p;
  const id = useUid();
  const ow = owOf(p.scale, 0.1);
  const buzz = ringing ? Math.sin(frame / 2.2) * 2.4 : 0;
  const b = alertBannerV2(headline, body);
  const frameC = '#5a6288', red = '#ff4d5a', ink = line(skin);
  const tilt = -4 + hash(seed, 1) * 8;
  const foot = Math.min(b.furniture[1] + 6, 118);
  return (
    <g transform={`translate(${(p.x ?? 0) + buzz} ${p.y ?? 0}) scale(${(p.scale ?? 1) * CM * 0.1}) rotate(${tilt})`}>
      <defs>
        <Lit id={`${id}f`} c={frameC} />
        <Lit id={`${id}k`} c={skin} k={0.35} />
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0.3" y2="1"><stop offset="0%" stopColor="#3a3a8a" /><stop offset="55%" stopColor="#1e1e52" />
          <stop offset="100%" stopColor="#120f34" /></linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#ffffff" stopOpacity={0.3} />
          <stop offset="45%" stopColor="#ffffff" stopOpacity={0.04} /><stop offset="100%" stopColor="#ffffff" stopOpacity={0} /></linearGradient>
        <clipPath id={`${id}c`}><path d={rr(-60, b.top, 120, b.height, 14)} /></clipPath>
        <clipPath id={`${id}scr`}><path d={rr(-61, -132, 122, 264, 18)} /></clipPath>
        <linearGradient id={`${id}fade`} gradientUnits="userSpaceOnUse" x1="0" y1="150" x2="0" y2="250"><stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0} /></linearGradient>
        <mask id={`${id}m`} maskUnits="userSpaceOnUse" x={-200} y={-300} width={400} height={600}><rect x={-200} y={-300} width={400} height={600}
          fill={`url(#${id}fade)`} /></mask>
      </defs>
      {/* the hand behind, wrist, palm and the fingertips that curl round the right edge, outline pass first */}
      {hand && <g mask={`url(#${id}m)`}>
        <g fill={ink} stroke={ink} strokeWidth={ow * 2} strokeLinejoin="round">
          <path d={taper([[-14, 260], [-12, 200], [-6, 130]], 92, 104)} />
          <ellipse cx={-4} cy={112} rx={80} ry={60} />
          {[-2, 32, 64, 94].map((y, i) => <rect key={i} x={40} y={y} width={50 - i * 3} height={28 - i * 2} rx={13 - i} />)}
        </g>
        <path d={taper([[-14, 260], [-12, 200], [-6, 130]], 92, 104)} fill={`url(#${id}k)`} />
        <ellipse cx={-4} cy={112} rx={80} ry={60} fill={`url(#${id}k)`} />
        {[-2, 32, 64, 94].map((y, i) => <g key={i}>
          <rect x={40} y={y} width={50 - i * 3} height={28 - i * 2} rx={13 - i} fill={`url(#${id}k)`} />
          <path d={`M${78 - i * 3} ${y + 6} q5 4 3 ${14 - i * 2}`} stroke={light(skin, 0.5)} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.7} />
        </g>)}
      </g>}
      {/* the handset */}
      <path d={rr(-69, -144, 138, 288, 26)} fill={`url(#${id}f)`} stroke={line(frameC)} strokeWidth={ow * 2} paintOrder="stroke" />
      <path d={rr(-61, -132, 122, 264, 18)} fill={`url(#${id}s)`} />
      <g clipPath={`url(#${id}scr)`}>
        <Bloom x={-10} y={-40} r={120} color="#7a6aff" opacity={0.35} />
        {ringing && <Bloom x={0} y={b.top + b.height / 2} r={110} color={red} opacity={0.18 + 0.12 * Math.sin(frame / 4)} />}
      </g>
      <path d={rr(-18, -128, 36, 9, 4.5)} fill="#0a0a20" />
      {/* the banner, a frosted card, a red head strip, then the caller's words */}
      <path d={rr(-60, b.top, 120, b.height, 14)} fill="#f4f1fa" stroke={line('#f4f1fa')} strokeWidth={ow * 1.4} paintOrder="stroke" />
      <g clipPath={`url(#${id}c)`}><rect x={-60} y={b.top} width={120} height={18} fill={red} /></g>
      <path d={`M-50 ${b.top + 13} l5 -9 l5 9 Z`} fill="#ffffff" stroke="#ffffff" strokeWidth={2} strokeLinejoin="round" />
      <rect x={-34} y={b.top + 7} width={40} height={4} rx={2} fill="#ffffff" opacity={0.7} />
      {b.head.map((l, i) => <text key={`h${i}`} x={-52} y={b.headBase + i * 14} fontSize={12} fontWeight={800} fill="#1f1836"
        fontFamily={FONT.body}>{l}</text>)}
      {b.body.map((l, i) => <text key={`b${i}`} x={-52} y={b.bodyBase + i * 12.6} fontSize={10.5} fill="#3b3456" fontFamily={FONT.body}>{l}</text>)}
      {foot < 118 && <>
        <rect x={-40} y={b.furniture[0]} width={80} height={7} rx={3.5} fill="#4a4a8a" opacity={0.8} />
        <rect x={-50} y={b.furniture[1]} width={100} height={6} rx={3} fill="#3a3a74" opacity={0.8} />
      </>}
      <rect x={-27} y={120} width={54} height={5} rx={2.5} fill="#8a8ac0" />
      <path d={rr(-61, -132, 122, 264, 18)} fill={`url(#${id}g)`} />
      <path d="M-58 -120 L-58 -40" stroke="#ffffff" strokeWidth={3} strokeLinecap="round" opacity={0.35} />
      {/* the thumb, over the left edge */}
      {hand && <g>
        <path d={taper([[-70, 150], [-80, 100], [-62, 50]], 36, 28)} fill={`url(#${id}k)`} stroke={ink} strokeWidth={ow * 2} strokeLinejoin="round"
          paintOrder="stroke" />
        <ellipse cx={-64} cy={62} rx={9} ry={11} fill={light(skin, 0.45)} transform="rotate(20 -64 62)" />
        <path d="M-82 120 q-2 -24 6 -40" stroke={light(skin, 0.5)} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.7} />
      </g>}
      {ringing && [-1, 1].map((sd) => <g key={sd} opacity={0.5 + 0.5 * Math.abs(Math.sin(frame / 3))}>
        <path d={`M${sd * 84} -100 q${sd * 10} 12 0 24 M${sd * 96} -108 q${sd * 14} 20 0 40`} stroke="#ffb43a" strokeWidth={4.5} fill="none"
          strokeLinecap="round" />
      </g>)}
    </g>
  );
};

export const WATER_V2 = ['StreamGaugeV2', 'LowWaterCrossingV2', 'SirenMastV2', 'RainCellV2', 'HandsetAlertV2'] as const;
