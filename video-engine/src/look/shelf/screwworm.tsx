import React from 'react';
import {M} from '../../lib/scale';
import {FONT} from '../../lib/type';
import {light, line, mix, shade} from '../color';
import {ContactShadow, Glow, useUid} from '../Kit';
import type {Place} from '../machines';
import {taper} from '../props';

/**
 * SCREWWORM, LOOK V2 (November 14th, 2026).
 *
 * The six screwworm diagram scenes from lib/screwworm.tsx redrawn in the v2 idiom, with the same props
 * (label, mode, a, b, c, frame, date) and the same screen frame, so a board that called the library
 * scene calls the V2 with nothing else changed. Every scene is round, lit from the upper left, outlined
 * in its own deep hue and alive on `frame`.
 *
 * THE FLY is the hero, so it is drawn with real anatomy and a face. A dorsal view of Cochliomyia
 * hominivorax, a metallic body with THREE DARK STRIPES down the thorax (the field mark that tells it
 * from a green bottle fly), big red-orange compound eyes, clear veined wings, six jointed legs. It is
 * built in millimetres and true to size (about 10 mm long), so `ScrewwormFlyV2` at scale 1 stands at
 * its real size beside anything else in the library, and the diagrams magnify it as the library did.
 * As in the library, colour marks the ROLE and not the sex, teal for the sterile male and coral for the
 * wild female. The sterile fly looks calm, the wild one is menacing by its brows, never gory.
 */
const C = {ink: '#1d3b47', paper: '#fbf3df', teal: '#14b3a3', coral: '#f2664c', soil: '#c98a52', top: '#d9c27a', leaf: '#4f9e58',
  water: '#5cbce6', steel: '#c9d1e4', gate: '#e2c27e'};
type Pt = [number, number];
type P = {label?: string; mode?: string; a?: number; b?: number; c?: number; frame?: number; date?: string};
const f1 = (p: Pt) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
const ell = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
/** a polygon with every corner rounded by a quadratic of radius r */
const roundPoly = (pts: Pt[], r: number) => {
  const n = pts.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
    const l0 = Math.hypot(p0[0] - p1[0], p0[1] - p1[1]) || 1, l2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) || 1;
    const k0 = Math.min(r / l0, 0.5), k2 = Math.min(r / l2, 0.5);
    const a: Pt = [p1[0] + (p0[0] - p1[0]) * k0, p1[1] + (p0[1] - p1[1]) * k0];
    const b: Pt = [p1[0] + (p2[0] - p1[0]) * k2, p1[1] + (p2[1] - p1[1]) * k2];
    d += `${i === 0 ? 'M' : 'L'}${f1(a)} Q${f1(p1)} ${f1(b)} `;
  }
  return d + 'Z';
};
const Lit: React.FC<{id: string; c: string; k?: number; v?: boolean}> = ({id, c, k = 1, v}) => (
  <linearGradient id={id} x1="0" y1="0" x2={v ? '0' : '0.4'} y2="1">
    <stop offset="0%" stopColor={light(c, 0.42 * k)} /><stop offset="50%" stopColor={c} /><stop offset="100%" stopColor={shade(c, 0.32 * k)} />
  </linearGradient>
);
const Orb: React.FC<{id: string; c: string; hi?: string}> = ({id, c, hi}) => (
  <radialGradient id={id} cx="34%" cy="26%" r="88%">
    <stop offset="0%" stopColor={hi ?? light(c, 0.45)} /><stop offset="52%" stopColor={c} /><stop offset="100%" stopColor={shade(c, 0.38)} />
  </radialGradient>
);
type Pc = {d: string; f: string; k: string; t?: string};
const Pass: React.FC<{list: Pc[]; ow: number}> = ({list, ow}) => <>
  {list.map((p, i) => <path key={`o${i}`} d={p.d} transform={p.t} fill={p.k} stroke={p.k} strokeWidth={ow * 2} strokeLinejoin="round" />)}
  {list.map((p, i) => <path key={`f${i}`} d={p.d} transform={p.t} fill={p.f} />)}
</>;

// ============================================================================ the fly

/**
 * The fly in millimetres, dorsal, head toward the top, the thorax at the origin. `wing` is the
 * library's buzz angle in degrees. `ow` is half the outline width in millimetres.
 */
const FlyArt: React.FC<{sterile: boolean; wing: number; frame: number; ow: number}> = ({sterile, wing, frame, ow}) => {
  const id = useUid();
  const c = sterile ? '#18b3a2' : '#ee5a52', hi = sterile ? '#9ef8e6' : '#ffc2a6';
  const ink = line(c), legC = '#283048';
  const eye = '#ff6a2c';
  const twitch = Math.sin(frame * 0.7) * 0.15;
  const legs: [Pt, Pt, Pt][] = [
    [[1.0, -0.9], [3.2, -2.6 + twitch], [4.0, -4.6]],
    [[1.3, 0.3], [3.8, 0.6], [4.9, 2.6 - twitch]],
    [[1.0, 1.4], [3.0, 3.4 + twitch], [3.8, 6.2]],
  ];
  const blink = frame % 120 < 3;
  const thorax = ell(0, 0.1, 2.05, 2.1), abdomen = ell(0, 4.3, 2.15, 2.65), head = ell(0, -2.45, 2.15, 1.3);
  return (
    <g>
      <defs>
        <Orb id={`${id}-b`} c={c} hi={hi} /><Orb id={`${id}-e`} c={eye} hi="#ffd08a" />
        <radialGradient id={`${id}-w`} cx="30%" cy="20%" r="90%"><stop offset="0%" stopColor="#ffffff" stopOpacity={0.85} />
          <stop offset="100%" stopColor="#bfe4ff" stopOpacity={0.35} /></radialGradient>
        <clipPath id={`${id}-t`}><path d={thorax} /></clipPath>
      </defs>
      {/* six jointed legs, behind the body */}
      {[-1, 1].map((sd) => legs.map((l, i) => {
        const pts = l.map(([x, y]) => [sd * x, y] as Pt);
        return <path key={`${sd}${i}`} d={taper(pts, 0.6, 0.32)} fill={legC} stroke={line(legC)} strokeWidth={ow * 1.2} strokeLinejoin="round"
          paintOrder="stroke" />;
      }))}
      {/* clear, veined wings */}
      {[-1, 1].map((sd) => <g key={sd} transform={`rotate(${sd * (40 + wing)} ${sd * 0.6} -0.4)`}>
        <ellipse cx={sd * 2.2} cy={3.4} rx={1.75} ry={4.4} fill={`url(#${id}-w)`} stroke="#8fb9de" strokeWidth={ow * 0.9} />
        <path d={`M${sd * 0.8} -0.4 Q${sd * 2.4} 3 ${sd * 2.6} 7.4 M${sd * 1.2} 0.6 Q${sd * 3.2} 3.4 ${sd * 3.4} 6.4`} stroke="#8fb9de" strokeWidth={ow * 0.5}
          fill="none" strokeLinecap="round" />
        <ellipse cx={sd * 1.6} cy={1.6} rx={0.5} ry={1.4} fill="#ffffff" opacity={0.6} />
      </g>)}
      <Pass ow={ow} list={[
        {d: abdomen, f: `url(#${id}-b)`, k: ink},
        {d: thorax, f: `url(#${id}-b)`, k: ink},
        {d: head, f: shade(c, 0.45), k: ink},
      ]} />
      {/* abdomen segments, and the three dark thorax stripes that name the species */}
      {[3.1, 4.5, 5.8].map((y, i) => <path key={i} d={`M${-1.8 + i * 0.25} ${y} Q0 ${y + 0.7} ${1.8 - i * 0.25} ${y}`} stroke={shade(c, 0.4)} strokeWidth={0.28}
        fill="none" strokeLinecap="round" />)}
      <g clipPath={`url(#${id}-t)`}>
        {[-0.85, 0, 0.85].map((x) => <path key={x} d={`M${x} -1.7 L${x * 1.1} 2`} stroke={shade(c, 0.62)} strokeWidth={0.42} strokeLinecap="round" />)}
        <ellipse cx={-0.7} cy={-0.9} rx={0.9} ry={0.45} fill="#ffffff" opacity={0.4} />
      </g>
      <ellipse cx={-0.8} cy={3.4} rx={0.8} ry={0.4} fill="#ffffff" opacity={0.35} />
      {/* the face, compound eyes with a pupil and a catchlight, and brows that act */}
      {[-1, 1].map((sd) => <g key={sd}>
        <path d={ell(sd * 1.12, -2.6, 1.02, 1.08)} fill={`url(#${id}-e)`} stroke={line(eye)} strokeWidth={ow * 1.1} />
        {blink ? <path d={`M${sd * 1.12 - 0.8} -2.5 Q${sd * 1.12} -2 ${sd * 1.12 + 0.8} -2.5`} stroke={line(eye)} strokeWidth={0.3} fill="none" strokeLinecap="round" />
          : <><circle cx={sd * 1.0} cy={-2.45} r={0.42} fill="#2a0f22" /><circle cx={sd * 1.12 - 0.32} cy={-2.95} r={0.22} fill="#ffffff" /></>}
        <path d={sterile ? `M${sd * 0.4} -3.95 Q${sd * 1.1} -4.35 ${sd * 1.9} -3.95` : `M${sd * 0.35} -3.55 L${sd * 1.95} -4.25`} stroke={shade(c, 0.6)}
          strokeWidth={0.36} strokeLinecap="round" fill="none" />
      </g>)}
      <path d="M-0.25 -3.6 l-0.35 -0.7 M0.25 -3.6 l0.35 -0.7" stroke={legC} strokeWidth={0.22} strokeLinecap="round" />
    </g>
  );
};
/** the fly placed in the library's screen frame: `s` 1 is the library's diagram size */
const SFly: React.FC<{x: number; y: number; s?: number; sterile?: boolean; wing?: number; frame?: number}> = ({x, y, s = 1, sterile = true, wing = 0,
  frame = 0}) => {
  const k = 15 * s;
  const buzz = Math.sin(frame * 0.9 + x * 0.01) * 0.6;
  return (
    <g transform={`translate(${x} ${y + buzz * s * 4}) scale(${k})`}>
      <FlyArt sterile={sterile} wing={wing} frame={frame} ow={Math.min(3.2 / k, 0.3)} />
    </g>
  );
};
/**
 * THE SCREWWORM FLY at true size, about 10 mm long, placed like any library drawing (x, y, scale 1 true
 * size, facing). An extra beside the six scenes, so a scene can set a real fly beside a real animal.
 */
export const ScrewwormFlyV2: React.FC<Place & {sterile?: boolean; landed?: boolean}> = (p) => {
  const {frame = 0, sterile = true, landed = false} = p;
  const k = (p.scale ?? 1) * M / 1000;
  const wing = landed ? 0 : Math.sin(frame * 2.4) * 10;
  return (
    <g transform={`translate(${p.x ?? 0} ${p.y ?? 0}) scale(${k * (p.facing ?? 1)} ${k})`}>
      {landed && <ContactShadow x={0} y={2} w={9} opacity={0.3} />}
      <g transform={landed ? 'translate(0 -3)' : undefined}><FlyArt sterile={sterile} wing={wing} frame={frame} ow={Math.min(3.4 / k, 0.3)} /></g>
    </g>
  );
};

// ============================================================================ shared scene pieces

const Egg: React.FC<{x: number; y: number; opacity?: number}> = ({x, y, opacity = 1}) => {
  const id = useUid();
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity}>
      <defs><Orb id={`${id}-e`} c="#fbf0d4" hi="#ffffff" /></defs>
      <ellipse rx={15} ry={36} fill={`url(#${id}-e)`} stroke={line('#e8d6a8')} strokeWidth={6} />
      <path d="M-5 -22 Q-9 0 -5 22" fill="none" stroke="#e6d2a4" strokeWidth={3} strokeLinecap="round" />
      <ellipse cx={-5} cy={-18} rx={4} ry={8} fill="#ffffff" opacity={0.7} />
    </g>
  );
};

/** the caption, big and centred on a rounded paper pill, in the deep ink */
const Caption: React.FC<{label?: string; y?: number}> = ({label = '', y = 1120}) => {
  if (!label) return null;
  const w = label.length * 42 * 0.56 + 70;
  return (
    <g>
      <rect x={465 - w / 2} y={y - 50} width={w} height={70} rx={35} fill="#fffaf0" stroke={line('#efe2c4')} strokeWidth={5} />
      <rect x={465 - w / 2 + 14} y={y - 36} width={10} height={42} rx={5} fill={C.teal} />
      <text x={472} y={y} textAnchor="middle" fill={C.ink} fontFamily={FONT.body} fontSize={42} fontWeight={800}>{label}</text>
    </g>
  );
};

/** a small lit mesquite on the land, swaying, scaled from nothing to full by `s` */
const Tree: React.FC<{x: number; y: number; s: number; frame: number; seed: number}> = ({x, y, s, frame, seed}) => {
  const id = useUid();
  const sw = Math.sin(frame / 30 * 1.3 + seed) * 2.4;
  const blobs: [number, number, number][] = [[-30, -62, 22], [-8, -76, 27], [20, -70, 24], [36, -56, 18], [4, -56, 22]];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs><Orb id={`${id}-l`} c={C.leaf} /></defs>
      <ContactShadow x={2} y={2} w={90} opacity={0.3} />
      <path d={taper([[0, 0], [-2, -26], [-10 + sw * 0.3, -50]], 12, 6)} fill="#7a5236" stroke={line('#7a5236')} strokeWidth={6} paintOrder="stroke" />
      <path d={taper([[-1, -24], [16 + sw * 0.3, -48]], 7, 4)} fill="#7a5236" stroke={line('#7a5236')} strokeWidth={6} paintOrder="stroke" />
      <g transform={`translate(${sw} 0)`}>
        {blobs.map(([bx, by, r], i) => <circle key={`o${i}`} cx={bx} cy={by} r={r + 5} fill={line(C.leaf)} />)}
        {blobs.map(([bx, by, r], i) => <circle key={i} cx={bx} cy={by} r={r} fill={`url(#${id}-l)`} />)}
        <ellipse cx={-14} cy={-86} rx={14} ry={6} fill="#ffffff" opacity={0.25} />
      </g>
    </g>
  );
};

/** a coral map pin, a past outbreak */
const Pin: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => {
  const id = useUid();
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs><Orb id={`${id}-p`} c={C.coral} /></defs>
      <ellipse cx={0} cy={2} rx={16} ry={5} fill="#1a1236" opacity={0.25} />
      <path d="M0 0 C-6 -14 -24 -26 -24 -44 A24 24 0 1 1 24 -44 C24 -26 6 -14 0 0 Z" fill={`url(#${id}-p)`} stroke={line(C.coral)} strokeWidth={5}
        strokeLinejoin="round" />
      <circle cx={0} cy={-44} r={9} fill="#fffaf0" />
    </g>
  );
};

/**
 * THE LAND, the library's isometric block of brush country, lit. Rounded corners, a grass top lit from
 * the upper left, soil sides with strata, blue creeks, swaying mesquites that grow with `habitat`, a sun
 * and rain for `weather`, coral pins for `history` and a glowing teal ring for the `target`.
 */
const Land: React.FC<{weather?: number; history?: number; target?: number; habitat?: number; targetX?: number; frame?: number}> = ({
  weather = 0, history = 0, target = 0, habitat = 1, targetX = 594, frame = 0,
}) => {
  const id = useUid();
  const top: Pt[] = [[92, 535], [570, 345], [889, 575], [410, 834]];
  const left: Pt[] = [[92, 535], [410, 834], [410, 926], [92, 632]];
  const right: Pt[] = [[410, 834], [889, 575], [889, 671], [410, 926]];
  const ink = line(C.soil);
  const spin = frame * 1.2;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-t`} gradientUnits="userSpaceOnUse" x1={150} y1={380} x2={760} y2={820}>
          <stop offset="0%" stopColor={light(C.top, 0.35)} /><stop offset="55%" stopColor={C.top} /><stop offset="100%" stopColor={shade(C.top, 0.2)} />
        </linearGradient>
        <Lit id={`${id}-l`} c={shade(C.soil, 0.12)} v /><Lit id={`${id}-r`} c={C.soil} v />
        <radialGradient id={`${id}-g`}><stop offset="0%" stopColor={C.teal} stopOpacity={0.45} /><stop offset="100%" stopColor={C.teal} stopOpacity={0.08} />
        </radialGradient>
      </defs>
      <ContactShadow x={490} y={930} w={900} opacity={0.25} />
      <Pass ow={6} list={[
        {d: roundPoly(left, 18), f: `url(#${id}-l)`, k: ink},
        {d: roundPoly(right, 18), f: `url(#${id}-r)`, k: ink},
        {d: roundPoly(top, 26), f: `url(#${id}-t)`, k: line(C.top)},
      ]} />
      {/* strata in the soil faces */}
      <path d="M110 575 L405 852 M110 600 L405 880" stroke={light(C.soil, 0.25)} strokeWidth={5} opacity={0.6} strokeLinecap="round" />
      <path d="M418 852 L870 604 M418 880 L870 632" stroke={shade(C.soil, 0.2)} strokeWidth={5} opacity={0.5} strokeLinecap="round" />
      {/* creeks */}
      {['M160 544Q310 596 425 730', 'M316 454Q411 549 577 652', 'M579 405Q655 460 760 579'].map((d, i) => <g key={i}>
        <path d={d} fill="none" stroke={line(C.water)} strokeWidth={18} strokeLinecap="round" />
        <path d={d} fill="none" stroke={C.water} strokeWidth={11} strokeLinecap="round" />
        <path d={d} fill="none" stroke="#d8f2ff" strokeWidth={3} strokeLinecap="round" strokeDasharray="18 30" strokeDashoffset={-frame * 2} />
      </g>)}
      <ellipse cx={target > 0 ? targetX : -999} cy={622} rx={Math.max(0.01, 135 * target)} ry={Math.max(0.01, 68 * target)} fill={`url(#${id}-g)`} />
      {[0, 1, 2, 3, 4].map((i) => <Tree key={i} x={220 + i * 120} y={530 + (i % 2) * 115} s={0.05 + 0.95 * habitat} frame={frame} seed={i} />)}
      {weather > 0 && <g opacity={weather}>
        <Glow x={710 - weather * 42} y={285 + weather * 18} r={150} color="#ffd36a" opacity={0.8} />
        <circle cx={710 - weather * 42} cy={285 + weather * 18} r={50} fill="#ffc94a" stroke={line('#ffc94a')} strokeWidth={6} />
        <ellipse cx={696 - weather * 42} cy={270 + weather * 18} rx={18} ry={10} fill="#ffffff" opacity={0.5} />
        {[0, 1, 2, 3, 4].map((i) => {
          const fall = ((frame * 4 + i * 37) % 60);
          const x0 = 180 + i * 54, y0 = 175 + (i % 2) * 35 + weather * 115 + fall;
          return <path key={i} d={`M${x0} ${y0} C${x0 - 10} ${y0 + 14} ${x0 - 12} ${y0 + 26} ${x0} ${y0 + 28} C${x0 + 12} ${y0 + 26} ${x0 + 10} ${y0 + 14} ${x0} ${y0} Z`}
            fill="#6cc4ec" stroke={line('#6cc4ec')} strokeWidth={4} strokeLinejoin="round" />;
        })}
      </g>}
      {history > 0 && <g opacity={history}>{[0, 1, 2].map((i) => <Pin key={i} x={353 + i * 123} y={440 + (i % 2) * 80 + 140 * history} s={0.9} />)}</g>}
      {target > 0 && <g>
        <ellipse cx={targetX} cy={622} rx={125 * target} ry={62 * target} fill="none" stroke={line(C.teal)} strokeWidth={16} />
        <ellipse cx={targetX} cy={622} rx={125 * target} ry={62 * target} fill="none" stroke={C.teal} strokeWidth={9} />
        <ellipse cx={targetX} cy={622} rx={96 * target} ry={46 * target} fill="none" stroke="#e8fffb" strokeWidth={4} strokeDasharray="20 18"
          strokeDashoffset={spin} strokeLinecap="round" />
      </g>}
    </g>
  );
};

/** the cattle gate: two lit posts and a rounded panel that swings shut with `closed` */
const Gate: React.FC<{closed?: number; x?: number; y?: number}> = ({closed = 0, x = 165, y = 908}) => {
  const id = useUid();
  const sx = 0.06 + 0.94 * closed;
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs><Lit id={`${id}-p`} c="#8a6a4a" /><Lit id={`${id}-g`} c={C.gate} v /></defs>
      <ContactShadow x={250} y={92} w={620} opacity={0.25} />
      {[0, 500].map((px) => <rect key={px} x={px - 16} y={-100} width={32} height={192} rx={14} fill={`url(#${id}-p)`} stroke={line('#8a6a4a')} strokeWidth={7} />)}
      <g transform={`translate(10 0) scale(${sx} 1)`}>
        {[-58, -14, 30].map((ry) => <rect key={ry} x={0} y={ry} width={480} height={26} rx={13} fill={`url(#${id}-g)`} stroke={line(C.gate)}
          strokeWidth={6 / Math.max(sx, 0.3)} />)}
        {[110, 240, 370].map((vx) => <rect key={vx} x={vx - 9} y={-64} width={18} height={124} rx={9} fill={shade(C.gate, 0.12)} stroke={line(C.gate)}
          strokeWidth={5} />)}
        <path d="M10 -50 L470 -50" stroke="#ffffff" strokeWidth={5} opacity={0.45} strokeLinecap="round" />
      </g>
    </g>
  );
};

/** a pickup pulling a stock trailer, round and lit, in the library's screen frame */
const Trailer: React.FC<{x?: number; y?: number; s?: number; frame?: number}> = ({x = 120, y = 560, s = 1, frame = 0}) => {
  const id = useUid();
  const spin = frame * 9;
  const wheel = (cx: number, cy: number, r: number) => <g transform={`translate(${cx} ${cy})`}>
    <circle r={r} fill="#2a2742" /><circle r={r * 0.55} fill="#d9dde8" />
    <g transform={`rotate(${spin})`}>{[0, 120, 240].map((a) => <circle key={a} cx={Math.cos(a * Math.PI / 180) * r * 0.3} cy={Math.sin(a * Math.PI / 180) * r * 0.3}
      r={r * 0.1} fill="#7a7f99" />)}</g></g>;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs><Lit id={`${id}-t`} c={C.steel} v /><Lit id={`${id}-c`} c={C.coral} /></defs>
      <ContactShadow x={190} y={168} w={420} opacity={0.3} />
      <path d="M200 112 L232 112" stroke="#5a5a72" strokeWidth={10} strokeLinecap="round" />
      <rect x={0} y={0} width={206} height={128} rx={26} fill={`url(#${id}-t)`} stroke={line(C.steel)} strokeWidth={7} />
      {[24, 48, 72].map((sy) => <rect key={sy} x={16} y={sy} width={174} height={10} rx={5} fill={shade(C.steel, 0.3)} />)}
      <path d="M18 12 L188 12" stroke="#ffffff" strokeWidth={6} opacity={0.5} strokeLinecap="round" />
      <path d="M212 108 L212 74 Q212 58 228 58 L264 58 L290 22 Q298 12 312 12 L348 12 Q362 12 368 26 L384 66 Q394 70 394 86 L394 124 Q394 140 378 140 L228 140 Q212 140 212 124 Z"
        fill={`url(#${id}-c)`} stroke={line(C.coral)} strokeWidth={7} strokeLinejoin="round" />
      <path d="M296 28 Q302 22 312 22 L344 22 Q352 22 356 30 L368 60 L282 60 Z" fill="#2a3a6e" />
      <path d="M302 30 L334 30" stroke="#ffffff" strokeWidth={5} opacity={0.4} strokeLinecap="round" />
      <ellipse cx={388} cy={92} rx={6} ry={9} fill="#fff4c4" />
      {wheel(52, 140, 24)}{wheel(150, 140, 24)}{wheel(330, 146, 27)}
    </g>
  );
};

// ============================================================================ the scenes

/**
 * THE STERILE INSECT CYCLE. `release` lifts the lid of a release box and lets the sterile flies out
 * toward a wild female (a, b). `cycle` pairs a sterile male with a wild female, lays her eggs (a) and
 * strikes them with the coral bar, "no next generation" (b).
 */
export const ScrewwormCycleV2: React.FC<P> = ({label = 'Illustrated cycle', mode = 'release', a = 0, b = 0, frame = 0}) => {
  const id = useUid();
  const second = mode === 'cycle';
  const wings = Math.sin(frame * 0.65) * 3;
  const box = '#8fb4c2';
  return (
    <g>
      <defs><Lit id={`${id}-b`} c={box} /><Lit id={`${id}-l`} c={light(box, 0.2)} /><Lit id={`${id}-x`} c={C.coral} v /></defs>
      {!second && <g>
        <ContactShadow x={254} y={1004} w={330} opacity={0.3} />
        <path d={roundPoly([[126, 675], [381, 675], [364, 1002], [140, 1002]], 22)} fill={`url(#${id}-b)`} stroke={line(box)} strokeWidth={7} />
        <rect x={168} y={880} width={172} height={64} rx={18} fill="#fffaf0" stroke={line('#efe2c4')} strokeWidth={4} />
        <path d="M188 902 H316 M188 924 H284" stroke="#9ab0bc" strokeWidth={8} strokeLinecap="round" />
        <circle cx={326} cy={902} r={9} fill={C.teal} />
        <path d="M144 700 L156 980" stroke="#ffffff" strokeWidth={8} opacity={0.35} strokeLinecap="round" />
        <g transform={`translate(0 ${-a * 128}) rotate(${-a * 12} 126 675)`}>
          <path d={roundPoly([[118, 660], [389, 660], [374, 700], [132, 700]], 14)} fill={`url(#${id}-l)`} stroke={line(box)} strokeWidth={7} />
          <rect x={236} y={646} width={36} height={16} rx={8} fill={shade(box, 0.3)} />
        </g>
        <SFly x={255 + a * 130 - b * 35} y={835 - a * 340 - b * 35} s={0.8 + b * 0.4} wing={wings} frame={frame} />
        <SFly x={286 + a * 170} y={865 - a * 400} s={0.42} wing={wings} frame={frame + 7} />
      </g>}
      {second && <SFly x={350 + a * 70} y={460} s={1.2} wing={wings} frame={frame} />}
      <SFly x={second ? 670 - a * 90 : 770 - b * 100} y={second ? 460 : 550 - b * 90} s={second ? 1.2 : 0.92 + b * 0.28} sterile={false} wing={wings}
        frame={frame + 3} />
      <text x={250} y={second ? 310 : 1088} fontFamily={FONT.body} fontSize={31} fontWeight={800} textAnchor="middle" fill={C.ink}>
        {second ? 'STERILE MALE' : label.toUpperCase()}</text>
      {second && <text x={690} y={310} fontFamily={FONT.body} fontSize={31} fontWeight={800} textAnchor="middle" fill={C.ink}>WILD FEMALE</text>}
      {second && <g>
        <path d="M425 619Q485 655 555 620L555 721" fill="none" stroke={line('#b8c4d0')} strokeWidth={9} strokeDasharray="450" strokeDashoffset={450 * (1 - a)}
          strokeLinecap="round" />
        <g opacity={a}>{[0, 1, 2, 3, 4].map((i) => <Egg key={i} x={430 + i * 43} y={780 + (i % 2) * 15} />)}</g>
        <path d="M540 850V945" stroke={line(C.coral)} strokeWidth={14} strokeDasharray="95" strokeDashoffset={95 * (1 - b)} strokeLinecap="round" />
        <path d="M540 850V945" stroke={C.coral} strokeWidth={8} strokeDasharray="95" strokeDashoffset={95 * (1 - b)} strokeLinecap="round" />
        {b > 0.02 && <rect x={465 + 75 * (1 - b)} y={938} width={Math.max(1, 150 * b)} height={20} rx={10} fill={`url(#${id}-x)`} stroke={line(C.coral)}
          strokeWidth={5} />}
        <text x={540} y={1010} opacity={b} fill={C.ink} textAnchor="middle" fontFamily={FONT.body} fontSize={38} fontWeight={800}>NO NEXT GENERATION</text>
      </g>}
      {!second && <text x={695} y={710} fontFamily={FONT.body} fontSize={29} fontWeight={700} fill={C.ink} textAnchor="middle">WILD FEMALE</text>}
      {second && <Caption label={label} />}
    </g>
  );
};

/**
 * THE FORECAST CLUES. `question` raises the land and sends a fly over it toward the target (a, b).
 * `inputs` grows the habitat (a), the weather (b) and the past outbreaks with the target (c), each
 * named under the land. Marked as a model illustration, never a live forecast.
 */
export const ScrewwormForecastV2: React.FC<P> = ({label = 'Forecast clues', mode = 'question', a = 0, b = 0, c = 0, frame = 0}) => {
  const q = mode === 'question';
  return (
    <g>
      <g transform={`translate(0 ${q ? (1 - a) * 180 : 0}) translate(0 620) scale(1 ${q ? 0.12 + 0.88 * a : 1}) translate(0 -620)`}>
        <Land targetX={q ? 330 + b * 264 : 594} habitat={mode === 'inputs' ? a : 1} weather={mode === 'inputs' ? b : 0} history={mode === 'inputs' ? c : 0}
          target={mode === 'inputs' ? c : b} frame={frame} />
      </g>
      <SFly x={q ? 420 + a * 310 : 730} y={q ? 460 - a * 60 : 360} s={q ? 1.2 - a * 0.7 : 0.5} wing={Math.sin(frame * 0.6) * 3} frame={frame} />
      {q && <g opacity={1 - a}><SFly x={580 + a * 165} y={460 - a * 85} s={1.2 - a * 0.8} sterile={false} frame={frame + 4} /></g>}
      {mode === 'inputs' && <g fontFamily={FONT.body} fontSize={29} fontWeight={800}>
        {([[115, 'HABITAT', a, C.leaf], [369, 'WEATHER', b, '#f0a83a'], [610, 'PAST OUTBREAKS', c, C.coral]] as [number, string, number, string][]).map(([x, t, o, col]) =>
          <g key={t} opacity={o}><circle cx={x - 18} cy={1005} r={9} fill={col} /><text x={x} y={1015} fill={C.ink}>{t}</text></g>)}
      </g>}
      <Caption label={label} />
      <text x={465} y={1180} textAnchor="middle" fill={C.ink} fontFamily={FONT.body} fontSize={32} fontWeight={600}>Model illustration. No live forecast.</text>
    </g>
  );
};

/** THE RESEARCH CARD. A lit paper slides in (a) with the agency, the date and a small land whose target glows (b). */
export const ScrewwormResearchV2: React.FC<P> = ({label = 'Kerrville', date = '', a = 0, b = 0, frame = 0}) => {
  const id = useUid();
  const ground = '#c79a62';
  return (
    <g>
      <defs><Lit id={`${id}-g`} c={ground} /><Lit id={`${id}-p`} c="#fffaf0" k={0.5} /></defs>
      <path d={roundPoly([[40, 1080], [861, 970], [907, 1094], [84, 1205]], 30)} fill={`url(#${id}-g)`} stroke={line(ground)} strokeWidth={7} />
      <g transform={`translate(${(1 - a) * 470} 0) rotate(-5 575 605)`}>
        <ContactShadow x={575} y={945} w={520} opacity={0.3} />
        <path d="M352 283 H745 L810 347 V903 Q810 931 782 931 H352 Q324 931 324 903 V311 Q324 283 352 283 Z" fill={`url(#${id}-p)`}
          stroke={line('#efe2c4')} strokeWidth={7} strokeLinejoin="round" />
        <path d="M745 283 V327 Q745 347 765 347 H810 Z" fill="#ecdfc2" stroke={line('#efe2c4')} strokeWidth={5} strokeLinejoin="round" />
        <rect x={369} y={318} width={130} height={22} rx={11} fill={C.teal} />
        <g fill={C.ink} fontFamily={FONT.body}>
          <text x={369} y={405} fontSize={36} fontWeight={800}>USDA ARS</text>
          <text x={369} y={457} fontSize={30} fontWeight={600}>{date}</text>
          <text x={369} y={535} fontSize={34} fontWeight={800}>Reported use</text>
        </g>
        <path d="M369 577H744M369 602H699" stroke="#d6d0e2" strokeWidth={12} strokeLinecap="round" />
        <g transform="translate(383 657) scale(.36)"><Land target={b} history={1} frame={frame} /></g>
        <SFly x={701} y={736 - b * 48} s={0.52} frame={frame} wing={Math.sin(frame * 0.6) * 3} />
      </g>
      <Caption label={label} />
    </g>
  );
};

/**
 * THE TARGETED INTERVENTION. `intervention` lowers a release canister over the land (a) and flies a
 * release plane across it dropping sterile flies (b). `close` follows a wild fly onto the land (a) and
 * shuts the gate on a trailer (b), the suspect animal stays.
 */
export const ScrewwormDispatchV2: React.FC<P> = ({label = 'Targeted intervention', mode = 'intervention', a = 0, b = 0, frame = 0}) => {
  const id = useUid();
  if (mode === 'close') {
    const road = '#ddd0b0';
    return (
      <g>
        <defs><Lit id={`${id}-r`} c={road} v /></defs>
        <g transform="translate(83 20) scale(.8)"><Land target={1} history={1} frame={frame} /></g>
        <SFly x={190 + a * 365} y={330 + a * 210} s={1.3} wing={Math.sin(frame * 0.65) * 3} frame={frame} sterile={false} />
        <rect x={40} y={965} width={843} height={150} rx={75} fill={`url(#${id}-r)`} stroke={line(road)} strokeWidth={7} />
        <path d="M110 1040H812" stroke="#fffaf0" strokeWidth={8} strokeDasharray="34 26" strokeLinecap="round" />
        <Trailer x={110 + Math.min(b / 0.65, 1) * 175} y={900} s={0.86} frame={frame * Math.min(1, b * 2)} />
        <g transform="translate(680 895) rotate(90) scale(.55)"><Gate x={0} y={0} closed={b} /></g>
        <Caption label={label} y={1200} />
        <text x={465} y={1148} textAnchor="middle" fill={C.ink} fontFamily={FONT.body} fontSize={36} fontWeight={800}>SUSPECT ANIMAL STAYS</text>
      </g>
    );
  }
  const can = '#e8d6a0', plane = '#f4f2ee';
  return (
    <g>
      <defs><Lit id={`${id}-c`} c={can} /><Lit id={`${id}-p`} c={plane} k={0.8} /></defs>
      <Land target={1} history={1} frame={frame} />
      {/* the release canister on its line, swinging a little */}
      <g transform={`translate(288 ${290 + a * 230}) rotate(${Math.sin(frame / 14) * 4})`}>
        <path d="M0 -320 V0" stroke={line(C.steel)} strokeWidth={5} />
        <path d={roundPoly([[-34, 0], [34, 0], [22, 104], [-22, 104]], 14)} fill={`url(#${id}-c)`} stroke={line(can)} strokeWidth={6} />
        <path d={roundPoly([[-21, 12], [21, 12], [13, 70], [-13, 70]], 9)} fill={C.teal} stroke={line(C.teal)} strokeWidth={4} />
        <ellipse cx={-8} cy={30} rx={5} ry={14} fill="#ffffff" opacity={0.4} />
        <rect x={-38} y={-10} width={76} height={16} rx={8} fill={shade(can, 0.2)} stroke={line(can)} strokeWidth={5} />
      </g>
      {/* the release plane, from above */}
      <g transform={`translate(${85 + b * 740} ${380 - b * 110}) rotate(15)`}>
        <ellipse cx={14} cy={150} rx={80} ry={22} fill="#1a1236" opacity={0.12} />
        <Pass ow={4} list={[
          {d: roundPoly([[-95, -6], [-14, -20], [24, -20], [96, -6], [96, 10], [24, 18], [-14, 18], [-95, 10]], 10), f: `url(#${id}-p)`, k: line(plane)},
          {d: roundPoly([[-34, -18], [-30, -40], [34, -40], [30, -18]], 8), f: `url(#${id}-p)`, k: line(plane), t: 'translate(0 -36)'},
          {d: 'M-12 -96 Q0 -112 12 -96 L13 70 Q0 86 -13 70 Z', f: `url(#${id}-p)`, k: line(plane)},
        ]} />
        <path d="M-8 -86 L-8 60" stroke={C.coral} strokeWidth={6} strokeLinecap="round" />
        <path d="M-80 0 L80 0" stroke={C.coral} strokeWidth={5} strokeLinecap="round" opacity={0.8} />
        <ellipse cx={0} cy={-62} rx={7} ry={12} fill="#2a3a6e" />
        <ellipse cx={0} cy={-106} rx={34} ry={6} fill="#ffffff" opacity={0.5 + 0.3 * Math.sin(frame * 2)} />
      </g>
      {[0, 1, 2, 3, 4].map((i) => <SFly key={i} x={470 + i * 49} y={340 + b * (290 + (i % 2) * 49)} s={0.2} wing={Math.sin(frame * 0.65) * 3} frame={frame + i * 5} />)}
      <Caption label={label} />
    </g>
  );
};

/**
 * THE ROUTE. `transport` runs the trailer up a road across the land past teal risk zones (a, b),
 * marked as an illustrative estimate. `inspect` stands a gate at a pasture fence that shuts with `c`.
 */
export const ScrewwormRouteV2: React.FC<P> = ({label = 'Inspect before transport', mode = 'transport', a = 0, b = 0, c = 0, frame = 0}) => {
  const id = useUid();
  const land = '#d4b878', hill = '#cfc19a';
  return (
    <g>
      <defs><Lit id={`${id}-l`} c={land} /><Lit id={`${id}-h`} c={hill} v /></defs>
      <defs><clipPath id={`${id}-c`}><path d={roundPoly([[60, 610], [858, 374], [858, 793], [60, 1029]], 34)} /></clipPath></defs>
      {mode === 'transport' ? <>
        <path d={roundPoly([[60, 610], [858, 374], [858, 793], [60, 1029]], 34)} fill={`url(#${id}-l)`} stroke={line(land)} strokeWidth={7} />
        <g clipPath={`url(#${id}-c)`}>
        <path d="M80 837L865 606" stroke={line('#e8e0c6')} strokeWidth={112} strokeLinecap="round" />
        <path d="M80 837L865 606" stroke="#efe8d2" strokeWidth={100} strokeLinecap="round" />
        <path d="M80 837L865 606" stroke="#fffaf0" strokeWidth={7} strokeDasharray="30 24" strokeLinecap="round" />
        {[0, 1, 2, 3].map((i) => <ellipse key={i} cx={208 + i * 72} cy={710 - i * 15} rx={160 - i * 12} ry={191 - i * 20} fill={C.teal}
          opacity={0.06 + (3 - i) * 0.022} />)}
        <ellipse cx={208} cy={710} rx={160} ry={191} fill="none" stroke={C.teal} strokeWidth={5} strokeDasharray="16 14" opacity={0.7}
          strokeDashoffset={frame * 0.8} strokeLinecap="round" />
        </g>
        <path d={roundPoly([[60, 610], [858, 374], [858, 793], [60, 1029]], 34)} fill="none" stroke={line(land)} strokeWidth={7} />
        <Trailer x={130 + a * 375 + b * 73} y={571 - a * 119 - b * 23} s={0.78} frame={frame} />
        <text x={260} y={1060} fill={C.ink} fontFamily={FONT.body} fontSize={29} fontWeight={700}>ILLUSTRATIVE ESTIMATE</text>
      </> : <>
        <path d="M0 1090Q310 1020 600 1050Q830 1000 1080 1025V1460H0Z" fill={`url(#${id}-h)`} stroke={line(hill)} strokeWidth={7} />
        <path d="M60 1080 Q320 1036 600 1064" stroke="#ffffff" strokeWidth={8} opacity={0.4} fill="none" strokeLinecap="round" />
        {[30, 170, 354].map((x, i) => <rect key={x} x={x - 9} y={(i === 1 ? 856 : i === 0 ? 932 : 902) - 4} width={18} height={70} rx={8}
          fill="#8a6a4a" stroke={line('#8a6a4a')} strokeWidth={5} />)}
        {['M30 965L170 886L354 932', 'M30 945L170 866L354 912'].map((d) => <g key={d}>
          <path d={d} fill="none" stroke={line('#7f9a92')} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
          <path d={d} fill="none" stroke="#9ab8ae" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
        </g>)}
        <Gate closed={c} x={180} y={1120} />
      </>}
      <Caption label={label} y={mode === 'inspect' ? 330 : 1150} />
      {mode === 'inspect' && <text x={465} y={410} textAnchor="middle" fontSize={34} fontWeight={800} fontFamily={FONT.body} fill={C.coral}>SUSPECTED INFESTATION</text>}
    </g>
  );
};

/**
 * THE SURFACE. `paper` is the warm ruled ground every scene sits on, lit softly from the upper left.
 * `setting` is the lit hills along the bottom. Any other mode is the masthead.
 */
export const ScrewwormSurfaceV2: React.FC<P> = ({mode = 'paper', frame = 0}) => {
  const id = useUid();
  if (mode === 'paper') {
    return (
      <g>
        <defs>
          <radialGradient id={`${id}-p`} cx="28%" cy="18%" r="95%"><stop offset="0%" stopColor="#fffaf0" /><stop offset="70%" stopColor={C.paper} />
            <stop offset="100%" stopColor={mix(C.paper, '#d8c8e8', 0.35)} /></radialGradient>
        </defs>
        <rect width={1080} height={1920} fill={`url(#${id}-p)`} />
        {Array.from({length: 45}, (_, i) => <path key={i} d={`M40 ${i * 43}h1000`} stroke="#e8dcc2" strokeWidth={2} strokeLinecap="round" />)}
      </g>
    );
  }
  if (mode === 'setting') {
    const back = '#7fae8a', front = '#d4b46e';
    const drift = Math.sin(frame / 90) * 6;
    return (
      <g opacity={0.7}>
        <defs><Lit id={`${id}-b`} c={back} v /><Lit id={`${id}-f`} c={front} v /></defs>
        <path d={`M-20 1610 C120 ${1540 + drift} 240 1540 340 1580 C460 1520 600 1520 730 1565 C820 1500 960 1490 1100 1530 V1940 H-20 Z`} fill={`url(#${id}-b)`}
          stroke={line(back)} strokeWidth={6} />
        <path d={`M-20 1690 C160 1600 300 1600 420 1655 C560 1590 700 1600 830 1690 C920 1620 1010 1600 1100 1610 V1940 H-20 Z`} fill={`url(#${id}-f)`}
          stroke={line(front)} strokeWidth={6} />
        <path d="M40 1660 C180 1612 300 1614 400 1650" stroke="#ffffff" strokeWidth={8} opacity={0.35} fill="none" strokeLinecap="round" />
      </g>
    );
  }
  return (
    <g fontFamily={FONT.body}>
      <rect x={44} y={70} width={430} height={110} rx={30} fill="#fffaf0" stroke={line('#efe2c4')} strokeWidth={5} />
      <rect x={60} y={86} width={10} height={78} rx={5} fill={C.teal} />
      <text x={86} y={115} fontSize={25} letterSpacing={2} fontWeight={800} fill={C.ink}>TEXAS AI DISPATCH</text>
      <text x={86} y={157} fontSize={26} fontWeight={600} fill={light(C.ink, 0.2)}>Kerr County research</text>
      <rect x={705} y={112} width={210} height={62} rx={31} fill={C.coral} stroke={line(C.coral)} strokeWidth={5} />
      <text x={810} y={155} textAnchor="middle" fontSize={32} fontWeight={800} fill="#fffaf0">Illustration</text>
    </g>
  );
};

export const SCREWWORM_V2 = ['ScrewwormCycleV2', 'ScrewwormForecastV2', 'ScrewwormResearchV2', 'ScrewwormDispatchV2', 'ScrewwormRouteV2',
  'ScrewwormSurfaceV2', 'ScrewwormFlyV2'] as const;
