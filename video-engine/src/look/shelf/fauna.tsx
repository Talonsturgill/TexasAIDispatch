import React from 'react';
import {M} from '../../lib/scale';
import {light, line, shade} from '../color';
import {ContactShadow, useUid} from '../Kit';
import type {Place} from '../machines';
import {CowV2, HogV2, taper, type AnimalMood} from '../props';

/**
 * FAUNA, LOOK V2 (November 14th, 2026).
 *
 * The Texas animals from lib/fauna.tsx redrawn in the v2 idiom. Every animal is a hero, so every one
 * gets a face that acts (a white eye, a dark pupil, a catchlight and a brow), is lit from the upper
 * left, outlined in its own deep hue, grounded with a contact shadow and alive on `frame`.
 *
 * The field marks the library fought for are kept, because they are what makes a Texan nod. The
 * grackle's long blade of a tail and pale eye, the mockingbird's white wing flash, the armadillo's
 * three-part shell with nine bands across the middle, the pronghorn's black prong and white rump, the
 * vulture's two-tone underwing and tiny red head, the whitetail's flag, the jackrabbit's black-tipped
 * ears, the roadrunner's crest and blue and orange skin patch, the horned lizard's crown, the hog's
 * bristled ridge and the torn ground, the javelina's pale collar, the coyote's tail carried low.
 *
 * FOUR-LEGGED ANIMALS. The longhorn and the feral hog are the props.tsx `Quad` rig itself, through
 * CowV2 and HogV2, scaled to the library's true shoulder heights. `Quad` and its SPECIES table are not
 * exported, so the pronghorn, the whitetail, the javelina and the coyote, whose horns, tails and coat
 * marks that table cannot carry, stand on `Quad2` below. It is the same construction line for line
 * (the same body, neck, tapered legs, outline pass then fill pass, counter-rotated eye) with a second
 * species table, so all six read as one family.
 *
 * PLACEMENT is the library's. x and y sit at the ground (a flyer at its body), `scale` 1 is true size
 * through the one metre in lib/scale.ts, and every drawing is built in centimetres. True sizes follow
 * the library's SIZE_M (grackle 22 cm perched, armadillo 22 cm at the shell, pronghorn 87 cm at the
 * shoulder, vulture 1.7 m across, longhorn 1.45 m, roadrunner 30 cm, egret 50 cm, mockingbird 16 cm,
 * jackrabbit 55 cm ears up, whitetail 95 cm, horned lizard 11 cm long, feral hog 85 cm, javelina
 * 55 cm, coyote 60 cm). The bat column keeps the library's screen units.
 */
const CM = M / 100;
type Pt = [number, number];
const at = (p: Place, k = 1) =>
  `translate(${p.x ?? 0} ${p.y ?? 0}) scale(${(p.scale ?? 1) * k * CM * (p.facing ?? 1)} ${(p.scale ?? 1) * k * CM})`;
/** half the film line width in a drawing's centimetres (about 6.8 film pixels), capped so a small animal is not drowned */
const owOf = (p: Place, cap = 99) => Math.min(3.4 / ((p.scale ?? 1) * CM), cap);
const f1 = (p: Pt) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
const ell = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
const rnd = (s: number, i: number) => {
  const v = Math.sin(s * 127.1 + i * 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const lerpPt = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const densify = (pts: Pt[], k = 6): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) for (let j = 0; j < k; j++) out.push(lerpPt(pts[i], pts[i + 1], j / k));
  out.push(pts[pts.length - 1]);
  return out;
};
const quadPts = (a: Pt, c: Pt, b: Pt, n = 10): Pt[] => Array.from({length: n + 1}, (_, i) => {
  const t = i / n, u = 1 - t;
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]] as Pt;
});
const rot = (p: Pt, deg: number): Pt => {
  const a = deg * Math.PI / 180;
  return [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
};

/** one piece of a joined drawing, outlined first in its own deep hue (k) and filled after (f), so no seam shows */
type Pc = {d: string; f: string; k: string; t?: string};
const Pass: React.FC<{list: Pc[]; ow: number}> = ({list, ow}) => <>
  {list.map((p, i) => <path key={`o${i}`} d={p.d} transform={p.t} fill={p.k} stroke={p.k} strokeWidth={ow * 2} strokeLinejoin="round" />)}
  {list.map((p, i) => <path key={`f${i}`} d={p.d} transform={p.t} fill={p.f} />)}
</>;
/** a round lit form, the key at the upper left, shade pushed toward violet. `hi` overrides the light colour. */
const Orb: React.FC<{id: string; c: string; hi?: string; k?: number}> = ({id, c, hi, k = 1}) => (
  <radialGradient id={id} cx="34%" cy="26%" r="88%">
    <stop offset="0%" stopColor={hi ?? light(c, 0.42 * k)} /><stop offset="52%" stopColor={c} /><stop offset="100%" stopColor={shade(c, 0.34 * k)} />
  </radialGradient>
);
const Lit: React.FC<{id: string; c: string; k?: number}> = ({id, c, k = 1}) => (
  <linearGradient id={id} x1="0" y1="0" x2="0.4" y2="1">
    <stop offset="0%" stopColor={light(c, 0.42 * k)} /><stop offset="50%" stopColor={c} /><stop offset="100%" stopColor={shade(c, 0.34 * k)} />
  </linearGradient>
);
const blinking = (frame: number, seed: number, period = 110) => (frame + seed * 13) % period < 4;

/**
 * THE ACTING EYE. A white eye with an outline in the coat's deep hue, a dark pupil (on a coloured iris
 * where the species has one, the grackle's pale yellow), a catchlight, and a brow. `tilt` lowers the
 * front end of the brow (stern) when positive and raises it (worried) when negative, `raise` lifts it.
 */
const Eye: React.FC<{x: number; y: number; r: number; ink: string; browC: string; ow: number; blink?: boolean; tilt?: number;
  raise?: number; white?: string; iris?: string; look?: number; rot?: number; noBrow?: boolean}> = ({
  x, y, r, ink, browC, ow, blink = false, tilt = 0, raise = 0, white = '#ffffff', iris, look = 0, rot: rr = 0, noBrow = false,
}) => {
  const sw = Math.min(ow * 0.7, r * 0.42);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rr})`}>
      {blink
        ? <path d={`M${-r} ${0} Q0 ${r * 0.7} ${r} 0`} stroke={ink} strokeWidth={sw * 1.3} fill="none" strokeLinecap="round" />
        : <>
          <ellipse cx={0} cy={0} rx={r} ry={r * 1.06} fill={white} stroke={ink} strokeWidth={sw} />
          {iris && <circle cx={r * 0.18 + look * r * 0.2} cy={r * 0.06} r={r * 0.68} fill={iris} />}
          <circle cx={r * 0.22 + look * r * 0.25} cy={r * 0.08} r={r * (iris ? 0.38 : 0.62)} fill="#1f1736" />
          <circle cx={-r * 0.08 + look * r * 0.2} cy={-r * 0.26} r={r * 0.24} fill="#ffffff" />
        </>}
      {!noBrow && <path d={`M${-r * 1.15} ${-r * 1.5 - raise * r - tilt * r * 0.35} Q0 ${-r * 1.78 - raise * r} ${r * 1.15} ${-r * 1.5 - raise * r + tilt * r * 0.45}`}
        stroke={browC} strokeWidth={Math.min(ow * 0.85, r * 0.5)} strokeLinecap="round" fill="none" />}
    </g>
  );
};
const moodBrow = (mood: AnimalMood | undefined): {tilt: number; raise: number} =>
  mood === 'worried' ? {tilt: -1, raise: 0.1} : mood === 'alert' ? {tilt: 0, raise: 0.35} : mood === 'happy' ? {tilt: -0.3, raise: 0.25}
    : {tilt: 0, raise: 0};

// ============================================================================ birds

/**
 * A perched or standing bird in centimetres, feet at the origin, facing +x. Body, neck, head, bill and
 * tail are one outline, the wing sits on the body with its own thinner line, the legs are tapers with
 * toes. Overlays go in `inBody` (clipped to the body), `over` and `headOver` (in the head's frame).
 */
type BirdSpec = {
  c: string; hi?: string; belly?: string; head?: string; legC: string; legW: number; feet: [number, number]; hipY: number;
  body: {cx: number; cy: number; rx: number; ry: number; rot: number};
  hd: {cx: number; cy: number; r: number; rot?: number}; neckW: number;
  tail: {pts: Pt[]; w0: number; w1: number; c: string};
  wing: {d: string; c: string};
  bill: {len: number; h: number; c: string; hook?: number; gape?: number; droop?: number};
  eye: {dx: number; dy: number; r: number; white?: string; iris?: string};
  stride?: number; toes?: 'perch' | 'zygo'; k?: number;
};
const BirdArt: React.FC<{sp: BirdSpec; ow: number; frame: number; seed: number; mood?: AnimalMood; inBody?: React.ReactNode;
  over?: React.ReactNode; headOver?: React.ReactNode; under?: React.ReactNode; shadow?: boolean}> = ({
  sp, ow, frame, seed, mood, inBody, over, headOver, under, shadow = true,
}) => {
  const id = useUid();
  const {body: b, hd, tail, bill} = sp;
  const ink = line(sp.c), legInk = line(sp.legC);
  const bodyD = `M${b.cx - b.rx} ${b.cy} A${b.rx} ${b.ry} 0 1 0 ${b.cx + b.rx} ${b.cy} A${b.rx} ${b.ry} 0 1 0 ${b.cx - b.rx} ${b.cy} Z`;
  const bodyT = `rotate(${b.rot} ${b.cx} ${b.cy})`;
  const neckFrom = rot([b.rx * 0.55, -b.ry * 0.35], b.rot);
  const neck = taper([[b.cx + neckFrom[0], b.cy + neckFrom[1]], [hd.cx, hd.cy]], sp.neckW * 1.25, sp.neckW);
  const hT = `translate(${hd.cx} ${hd.cy}) rotate(${hd.rot ?? 0})`;
  const g = bill.gape ?? 0, bx = hd.r * 0.72, L = bill.len, h = bill.h, hk = bill.hook ?? 0, dr = bill.droop ?? 0;
  const upper = `M${bx} ${-h * 0.55} C${bx + L * 0.45} ${-h * 0.62} ${bx + L * 0.85} ${-h * 0.2 + dr * 0.5} ${bx + L} ${dr + hk}`
    + ` C${bx + L * 0.7} ${h * 0.06 + dr * 0.6} ${bx + L * 0.35} ${h * 0.08} ${bx - h * 0.1} ${h * 0.12} Z`;
  const lower = `M${bx - h * 0.1} ${h * 0.1} C${bx + L * 0.35} ${h * 0.14} ${bx + L * 0.7} ${h * 0.12 + dr * 0.6} ${bx + L * 0.9} ${dr + h * 0.06}`
    + ` C${bx + L * 0.6} ${h * 0.5} ${bx + L * 0.3} ${h * 0.55} ${bx - h * 0.05} ${h * 0.5} Z`;
  const lowerT = `${hT} rotate(${g} ${bx} ${h * 0.1})`;
  const leg = (fx: number, k: number) => {
    const s = (sp.stride ?? 0) * k, hip: Pt = [b.cx + fx * 0.5, sp.hipY], foot: Pt = [fx + s, 0];
    const knee: Pt = [lerpPt(hip, foot, 0.5)[0] - sp.legW * 1.2 + s * 0.2, lerpPt(hip, foot, 0.5)[1] - Math.abs(s) * 0.15];
    return {d: taper(densify([hip, knee, [foot[0], -sp.legW * 0.5]], 4), sp.legW * 1.5, sp.legW * 0.9), foot};
  };
  const legs = [leg(sp.feet[0], 1), leg(sp.feet[1], -1)];
  const toes = (f: Pt, i: number) => {
    const fw = sp.legW * 0.8;
    const list: [number, number][] = sp.toes === 'zygo' ? [[1, 0.9], [0.55, 0.2], [-1, 0.9], [-0.55, 0.2]] : [[1, 1], [0.5, 0.3], [-0.7, 0.8]];
    return <g key={i}>{list.map(([dx, dy], j) => <path key={j} d={`M${f[0]} ${-fw * 0.4} l${dx * sp.legW * 2.6} ${dy * fw * 0.5}`}
      stroke={i === 0 ? shade(sp.legC, 0.2) : sp.legC} strokeWidth={fw} strokeLinecap="round" fill="none" />)}</g>;
  };
  const brow = moodBrow(mood);
  const blink = blinking(frame, seed, 96);
  return (
    <g>
      <defs>
        <Orb id={`${id}-b`} c={sp.c} hi={sp.hi} k={sp.k} />
        <Orb id={`${id}-h`} c={sp.head ?? sp.c} hi={sp.hi} k={sp.k} />
        <Lit id={`${id}-t`} c={tail.c} k={sp.k} />
        <Lit id={`${id}-w`} c={sp.wing.c} k={sp.k} />
        <Lit id={`${id}-k`} c={bill.c} />
        <clipPath id={`${id}-c`}><path d={bodyD} transform={bodyT} /></clipPath>
      </defs>
      {shadow && <ContactShadow x={(sp.feet[0] + sp.feet[1]) / 2} y={0.4} w={Math.max(b.rx * 2.6, 6)} opacity={0.3} />}
      {under}
      {/* the far leg, then the near one, toes on the ground */}
      {legs.map((l, i) => <g key={i}>
        <path d={l.d} fill={i === 0 ? shade(sp.legC, 0.2) : sp.legC} stroke={legInk} strokeWidth={ow * 1.1} strokeLinejoin="round" paintOrder="stroke" />
        {toes(l.foot, i)}
      </g>)}
      <Pass ow={ow} list={[
        {d: taper(tail.pts, tail.w0, tail.w1), f: `url(#${id}-t)`, k: line(tail.c)},
        {d: neck, f: sp.head ?? sp.c, k: ink},
        {d: bodyD, f: `url(#${id}-b)`, k: ink, t: bodyT},
        {d: lower, f: `url(#${id}-k)`, k: line(bill.c), t: lowerT},
        {d: upper, f: `url(#${id}-k)`, k: line(bill.c), t: hT},
        {d: ell(0, 0, hd.r, hd.r), f: `url(#${id}-h)`, k: ink, t: hT},
      ]} />
      {g > 1 && <path d={`M${bx} ${h * 0.12} L${bx + L * 0.7} ${h * 0.14}`} transform={hT} stroke="#e8607a" strokeWidth={h * 0.35}
        strokeLinecap="round" />}
      <g clipPath={`url(#${id}-c)`}>
        {sp.belly && <ellipse cx={b.cx + b.rx * 0.15} cy={b.cy + b.ry * 0.85} rx={b.rx * 0.95} ry={b.ry * 0.62} fill={sp.belly} transform={bodyT} />}
        {inBody}
        <ellipse cx={b.cx - b.rx * 0.2} cy={b.cy - b.ry * 0.62} rx={b.rx * 0.55} ry={b.ry * 0.22} fill="#ffffff" opacity={0.22} transform={bodyT} />
      </g>
      <path d={sp.wing.d} fill={`url(#${id}-w)`} stroke={line(sp.wing.c)} strokeWidth={ow * 1.2} strokeLinejoin="round" paintOrder="stroke" />
      {over}
      <g transform={hT}>
        <ellipse cx={-hd.r * 0.3} cy={-hd.r * 0.5} rx={hd.r * 0.42} ry={hd.r * 0.2} fill="#ffffff" opacity={0.25} />
        {headOver}
        <Eye x={sp.eye.dx} y={sp.eye.dy} r={sp.eye.r} ink={ink} browC={shade(sp.head ?? sp.c, 0.45)} ow={ow} blink={blink}
          white={sp.eye.white} iris={sp.eye.iris} tilt={brow.tilt} raise={brow.raise} />
      </g>
    </g>
  );
};

/**
 * GREAT-TAILED GRACKLE. Iridescent black reading purple and blue-green, a pale yellow eye, a stout
 * bill as long as the head, long legs, and THE BLADE TAIL, nearly the length of the body, held clear of
 * the ground. The female is brown and smaller, her tail shorter in proportion. `calling` opens the bill
 * and tips the head up.
 */
export const GrackleV2: React.FC<Place & {female?: boolean; calling?: boolean; tailUp?: boolean; mood?: AnimalMood}> = (p) => {
  const {frame = 0, seed = 1, female = false, calling = false, tailUp = false, mood = 'alert'} = p;
  const k = female ? 0.78 : 1;
  const ow = owOf(p, 0.7) / k;
  const bob = Math.sin(frame / 7 + seed * 6) * 0.3;
  const gape = calling ? 14 + Math.sin(frame / 5) * 8 : 0;
  const rise = tailUp ? 7 : 0, tl = female ? 13 : 18;
  const c = female ? '#8a6446' : '#2c2350';
  const sp: BirdSpec = {
    c, hi: female ? '#c7a07a' : '#6a58c8', belly: female ? '#b79470' : undefined, legC: '#3a3346', legW: 0.75, feet: [-0.8, 2.4], hipY: -7.6,
    body: {cx: 0, cy: -11, rx: 8.8, ry: 5.5, rot: -14}, hd: {cx: 8.4, cy: -18.2, r: 3.9, rot: calling ? -16 : 0}, neckW: 4.6,
    tail: {pts: densify([[-5.5, -11.4], [-6 - tl * 0.55, -9.6 - rise * 0.6], [-6 - tl, -7.6 - rise]], 3), w0: 4.0, w1: female ? 2.2 : 2.6, c: shade(c, 0.12)},
    wing: {d: `M-6 -12.6 C-2 -16.6 5 -16.4 6.6 -12.6 C4 -9.4 -2 -8.2 -7.4 -9.8 Z`, c: female ? '#76553a' : '#33296a'},
    bill: {len: 4.3, h: 2.1, c: '#2e2838', gape, droop: 0.5},
    eye: {dx: 0.9, dy: -0.8, r: 1.35, white: female ? '#f2e2b8' : '#fff1a6'},
  };
  return (
    <g transform={at(p, k)}>
      <g transform={`translate(0 ${bob})`}>
        <BirdArt sp={sp} ow={ow} frame={frame} seed={seed} mood={mood}
          inBody={!female && <>
            <ellipse cx={3} cy={-14} rx={6} ry={2.6} fill="#7a5ce0" opacity={0.55} transform="rotate(-14 0 -11)" />
            <ellipse cx={-2} cy={-8} rx={6} ry={2.2} fill="#2a8aa0" opacity={0.3} transform="rotate(-14 0 -11)" />
          </>}
          over={<path d={`M-8 -10.6 L${-6 - tl * 0.95} ${-8.2 - rise * 0.95}`} stroke={female ? '#a88462' : '#5a4aa8'} strokeWidth={0.5}
            strokeLinecap="round" opacity={0.8} />}
          headOver={!female && <path d="M-3 -1.6 Q0 -3.8 3 -2.6" stroke="#4fb0c8" strokeWidth={0.9} strokeLinecap="round" fill="none" opacity={0.7} />} />
      </g>
    </g>
  );
};

/**
 * NORTHERN MOCKINGBIRD, the state bird. Grey above, pale below, a long tail with white outer feathers,
 * a dark line through the eye, and THE WHITE WING FLASH, a white slash on the folded wing, a bold flash
 * when `flashing` lifts and opens it. `singing` lifts the head and works the bill.
 */
export const MockingbirdV2: React.FC<Place & {singing?: boolean; flashing?: boolean; mood?: AnimalMood}> = (p) => {
  const {frame = 0, seed = 8, singing = false, flashing = false, mood = 'happy'} = p;
  const ow = owOf(p, 0.5);
  const bob = Math.sin(frame / 9 + seed * 6) * 0.22;
  const gape = singing ? 10 + Math.sin(frame / 4) * 9 : 0;
  const lift = singing ? 1.1 : 0;
  const fl = flashing ? 0.5 + Math.sin(frame / 6) * 0.5 : 0;
  const c = '#8f97ad', wingC = '#5d6582';
  const sp: BirdSpec = {
    c, belly: '#f5f0e6', legC: '#3e3c4c', legW: 0.55, feet: [-0.4, 1.8], hipY: -5,
    body: {cx: 0, cy: -8.2, rx: 6.4, ry: 4.3, rot: -20}, hd: {cx: 5.5, cy: -12.6 - lift, r: 2.95, rot: singing ? -18 : -4}, neckW: 3.6,
    tail: {pts: densify([[-4, -7.8], [-9.5, -4.6], [-15, -1.8]], 3), w0: 3.4, w1: 2.8, c: '#5a6078'},
    wing: {d: '', c: wingC},
    bill: {len: 2.3, h: 1.05, c: '#2e2d3a', gape, droop: 0.25},
    eye: {dx: 0.6, dy: -0.5, r: 0.95, white: '#ffffff', iris: '#e2c04a'},
  };
  // the wing, folded or lifted open about the shoulder
  const wing = <g transform={`rotate(${-fl * 48} 1.6 -10.2)`}>
    <path d={`M-5.6 -9.4 C-2.4 -12.8 3 -12.6 3.8 -9.6 C1 -7 -3 -6.4 -6.8 -7.6 Z`} fill={wingC} stroke={line(wingC)} strokeWidth={ow * 1.2}
      strokeLinejoin="round" paintOrder="stroke" />
    <path d={`M-3.2 -9.8 Q${-0.6 + fl * 1.5} ${-10.9 - fl * 0.8} ${1.6 + fl * 1.6} ${-10.2 - fl * 0.4}`} stroke="#ffffff"
      strokeWidth={0.9 + fl * 1.1} strokeLinecap="round" fill="none" />
    {fl > 0.15 && <path d="M-4.6 -8.4 Q-1.6 -8.8 0.8 -8.2" stroke="#ffffff" strokeWidth={0.8 + fl * 0.9} strokeLinecap="round" fill="none" opacity={fl} />}
  </g>;
  return (
    <g transform={at(p)}>
      <g transform={`translate(0 ${bob})`}>
        <BirdArt sp={{...sp, wing: {d: 'M0 0', c: wingC}}} ow={ow} frame={frame} seed={seed} mood={mood}
          over={<>
            <path d="M-4.6 -7 L-14.6 -1.2" stroke="#f4f2ec" strokeWidth={0.75} strokeLinecap="round" />
            {wing}
          </>}
          headOver={<path d="M-1.8 -0.4 Q0.6 -1.1 2.4 -0.2" stroke="#3a3f52" strokeWidth={0.7} strokeLinecap="round" fill="none" />} />
      </g>
    </g>
  );
};

/**
 * ROADRUNNER. A big ground cuckoo and a predator, not the cartoon. Streaked brown, a shaggy raised
 * crest, a heavy faintly hooked bill, long strong legs with two toes forward and two back, a tail
 * longer than the body, and the bare skin behind the eye, blue in front and orange behind. `running`
 * drops the head level and streams the tail.
 */
export const RoadrunnerV2: React.FC<Place & {running?: boolean; mood?: AnimalMood}> = (p) => {
  const {frame = 0, seed = 6, running = false, mood = 'alert'} = p;
  const ow = owOf(p, 0.9);
  const st = running ? Math.sin(frame / 3.2) * 6 : 0;
  const bob = running ? Math.abs(Math.cos(frame / 3.2)) * 1.2 : Math.sin(frame / 19) * 0.3;
  const run = running ? 1 : 0;
  const c = '#9c7a4c';
  const sp: BirdSpec = {
    c, belly: '#f2e4c4', legC: '#7f93a8', legW: 1.1, feet: [-1, 3], hipY: -15, stride: st, toes: 'zygo',
    body: {cx: 0, cy: -18.5, rx: 11.6, ry: 6.2, rot: -8 + run * 4}, hd: {cx: 13.6, cy: -25.5 + run * 4, r: 4.6, rot: run * 6}, neckW: 5.6,
    tail: {pts: densify([[-8.5, -20], [-21, -22.5 + run * 4], [-34, -24.5 + run * 8]], 3), w0: 5.2, w1: 4.6, c: '#5f4a2e'},
    wing: {d: `M-8.6 -20.4 C-4 -24.6 6 -24.4 8.6 -19.6 C5 -15.6 -3 -14.6 -9.8 -16.6 Z`, c: '#7a5c36'},
    bill: {len: 6.4, h: 2.5, c: '#3e3830', hook: 0.7, droop: 0.4},
    eye: {dx: 1.1, dy: -0.9, r: 1.45, white: '#ffffff', iris: '#d9b45a'},
  };
  return (
    <g transform={at(p)}>
      <g transform={`translate(0 ${-bob})`}>
        <BirdArt sp={sp} ow={ow} frame={frame} seed={seed} mood={mood}
          inBody={[-9, -5, -1, 3, 7].map((sx) => <path key={sx} d={`M${sx} -24.4 q0.8 3.4 0.2 6`} stroke="#4a3a22" strokeWidth={0.9}
            strokeLinecap="round" fill="none" opacity={0.7} />)}
          over={<>
            {[-6, -2, 2, 5.5].map((sx) => <path key={sx} d={`M${sx} -21.4 q2 0.6 3 2.6`} stroke="#e8d6a8" strokeWidth={0.8} strokeLinecap="round"
              fill="none" opacity={0.85} />)}
            <path d={`M-31.4 ${-26.6 + run * 7.6} Q-33.6 ${-24.4 + run * 8} -31.8 ${-22.2 + run * 8.2}`} stroke="#fbf4e0" strokeWidth={1.3} strokeLinecap="round"
              fill="none" />
          </>}
          headOver={<>
            {/* the shaggy crest, raised */}
            <path d="M-3.6 -3.2 Q-3.8 -8.6 -1.4 -9.4 Q-1 -6.8 0 -6 Q0.6 -9.6 3 -10 Q2.4 -6.8 2.6 -5.2 Q4.4 -7.6 6 -7.2 Q4.2 -5 3.6 -3.2 Z"
              fill="#4a3a24" stroke={line('#4a3a24')} strokeWidth={ow * 1.1} strokeLinejoin="round" paintOrder="stroke" />
            {/* the bare skin patch behind the eye, blue in front and orange behind */}
            <path d="M-0.6 0.6 Q-3.2 0 -4.2 1.6 Q-2.4 2.8 -0.6 2.2 Z" fill="#3f86c8" />
            <path d="M-3.4 1.4 Q-5.4 1 -5.6 2.6 Q-4.4 3.4 -3.2 2.8 Z" fill="#f0863a" />
            {[-2, 0, 2].map((dx) => <path key={dx} d={`M${dx} -3.6 l0.4 1.4`} stroke="#4a3a24" strokeWidth={0.6} strokeLinecap="round" />)}
          </>} />
      </g>
    </g>
  );
};

/**
 * CATTLE EGRET, the detail that says a pasture is working land. White, compact, a short thick neck, a
 * short yellow bill and dark legs, with buff plumes on the crown, breast and back when `breeding`.
 */
export const CattleEgretV2: React.FC<Place & {breeding?: boolean; mood?: AnimalMood}> = (p) => {
  const {frame = 0, seed = 7, breeding = false, mood = 'calm'} = p;
  const ow = owOf(p, 1.1);
  const shift = Math.sin(frame / 33 + seed * 6) * 1.2;
  const buff = '#eba45a';
  const c = '#fbf7ee';
  const sp: BirdSpec = {
    c, hi: '#ffffff', k: 0.55, legC: breeding ? '#c7724a' : '#4a4636', legW: 1.15, feet: [-1.2, 3], hipY: -19,
    body: {cx: 0, cy: -27, rx: 11, ry: 8, rot: -18}, hd: {cx: 10.4, cy: -42, r: 4.6, rot: -4}, neckW: 6.2,
    tail: {pts: [[-8, -25], [-13.4, -21.6]], w0: 5.6, w1: 4.6, c: '#efeadf'},
    wing: {d: `M-8.4 -27.6 C-4 -33.6 5 -33.4 7.4 -28.4 C4 -23.4 -3 -21.6 -9.8 -23.6 Z`, c: '#f1ece2'},
    bill: {len: 6.4, h: 1.9, c: breeding ? '#f08a2a' : '#f5c23a'},
    eye: {dx: 0.6, dy: -0.8, r: 1.4, white: '#ffffff', iris: '#f2cf3a'},
  };
  return (
    <g transform={at(p)}>
      <g transform={`rotate(${shift} 0 0)`}>
        <BirdArt sp={sp} ow={ow} frame={frame} seed={seed} mood={mood}
          inBody={breeding && <>
            <ellipse cx={-3} cy={-33.5} rx={8} ry={3} fill={buff} opacity={0.8} transform="rotate(-18 0 -27)" />
            <ellipse cx={8.6} cy={-30} rx={4.4} ry={6.4} fill={buff} opacity={0.85} />
          </>}
          over={breeding && <ellipse cx={8.4} cy={-35.4} rx={3.6} ry={3.2} fill={buff} opacity={0.85} />}
          headOver={breeding && <path d="M-3.8 -2.6 Q-1 -6 2.4 -4.4 Q-0.4 -3 -3.8 -1.6 Z" fill={buff} />} />
      </g>
    </g>
  );
};

/**
 * TURKEY VULTURE, teetering on a shallow V, rocking and rarely flapping. Seen from in front and below,
 * the dark forewing and the silver flight feathers along the whole trailing half are one wing with one
 * outline, the primaries are fingered at the tips, the tail is long, and the head is TINY and red with
 * an ivory bill. `shadowY` drops its shadow that many screen pixels below it, on the ground.
 */
export const TurkeyVultureV2: React.FC<Place & {span?: number; shadowY?: number; mood?: AnimalMood}> = (p) => {
  const {frame = 0, seed = 4, span, shadowY, mood = 'calm'} = p;
  const id = useUid();
  const k = (span ?? 200) / 200;
  const ow = owOf(p) / k;
  const rock = Math.sin(frame / 23 + seed * 6) * 8;
  const dx = Math.sin(frame / 61 + seed * 3) * 9, dy = Math.sin(frame / 47 + seed * 5) * 4;
  const DARK = '#2f2840', PALE = '#c4c0d8', HEAD = '#e2483e';
  const wingD = 'M5 -6 C22 -12 50 -22 76 -31 C80 -32 83 -31 84 -28 C80 -22 70 -12 56 -4 C40 4 22 9 7 9 Z';
  const pale = 'M8 9 C22 9 40 4 56 -4 C68 -10 78 -19 83 -27 L80 -20 C70 -14 54 -10 38 -6 C24 -3 14 0 8 2 Z';
  const fingers = [0, 1, 2, 3, 4].map((i) => taper([[78 - i * 2.4, -28 + i * 3.4], [88 - i * 1.6, -30 + i * 4.6]], 3.6 - i * 0.2, 2.2));
  const wing = (dir: 1 | -1) => (
    <g transform={`scale(${dir} 1)`}>
      <g fill={line(DARK)} stroke={line(DARK)} strokeWidth={ow * 2} strokeLinejoin="round">
        {fingers.map((d, i) => <path key={i} d={d} />)}<path d={wingD} />
      </g>
      {fingers.map((d, i) => <path key={i} d={d} fill={i > 1 ? PALE : DARK} />)}
      <path d={wingD} fill={`url(#${id}-d)`} />
      <path d={pale} fill={`url(#${id}-p)`} />
      <path d="M12 -2 C30 -8 52 -17 74 -26" stroke={light(DARK, 0.35)} strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={0.6} />
    </g>
  );
  const brow = moodBrow(mood), blink = blinking(frame, seed, 120);
  return (
    <g>
      {shadowY !== undefined && <ContactShadow x={(p.x ?? 0) + dx} y={(p.y ?? 0) + shadowY} w={170 * k * (p.scale ?? 1) * CM * 0.7}
        opacity={0.16} />}
      <g transform={`translate(${(p.x ?? 0) + dx} ${(p.y ?? 0) + dy}) scale(${(p.scale ?? 1) * CM * k}) rotate(${rock})`}>
        <defs>
          <linearGradient id={`${id}-d`} x1="0" y1="0" x2="0.3" y2="1"><stop offset="0%" stopColor={light(DARK, 0.3)} />
            <stop offset="60%" stopColor={DARK} /><stop offset="100%" stopColor={shade(DARK, 0.3)} /></linearGradient>
          <linearGradient id={`${id}-p`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={light(PALE, 0.4)} />
            <stop offset="100%" stopColor={shade(PALE, 0.25)} /></linearGradient>
          <Orb id={`${id}-b`} c={DARK} k={0.8} />
          <Orb id={`${id}-h`} c={HEAD} />
        </defs>
        {wing(1)}{wing(-1)}
        <Pass ow={ow} list={[
          {d: 'M-6 6 C-9.4 13 -10.6 19 -9 22.6 Q0 25.6 9 22.6 C10.6 19 9.4 13 6 6 Z', f: DARK, k: line(DARK)},
          {d: ell(0, 0, 10.6, 11.6), f: `url(#${id}-b)`, k: line(DARK)},
          {d: ell(0, -13.4, 6.6, 6.4), f: `url(#${id}-h)`, k: line(HEAD)},
          {d: 'M-2.2 -9.4 Q0 -7 2.2 -9.4 L1.2 -4 Q0 -2.6 -1.2 -4 Z', f: '#f4ead2', k: line('#f4ead2')},
        ]} />
        <path d="M-6 -4 Q-2 -8 4 -6" stroke={light(DARK, 0.4)} strokeWidth={1.2} fill="none" strokeLinecap="round" opacity={0.6} />
        {[-1, 1].map((s) => <Eye key={s} x={s * 2.9} y={-14.6} r={1.9} ink={line(HEAD)} browC={shade(HEAD, 0.55)} ow={ow} blink={blink}
          tilt={s === 1 ? brow.tilt : brow.tilt} raise={brow.raise} rot={s * -8} />)}
      </g>
    </g>
  );
};

// ============================================================================ four-legged, the Quad family

/**
 * QUAD2, the props.tsx `Quad` rig with a second species table, for the animals whose horns, tails and
 * coat marks SPECIES cannot carry. The construction is Quad's, one body path, a neck from withers to
 * poll, tapered legs that start inside the body, an outline pass of every joined part and then the
 * fills, a head in its own rotated frame and a counter-rotated eye.
 */
type Sp2 = {
  B: number; H: number; D: number; hump: number; sag: number; legW: number; legW2: number; Lh: number; Hh: number; angle: number;
  poll: Pt; body: string; belly?: string; ears: 'tall' | 'prick' | 'round'; muzzle: 'long' | 'narrow' | 'blunt'; nose: string;
};
const SPECIES2: Record<'pronghorn' | 'whitetail' | 'javelina' | 'coyote', Sp2> = {
  pronghorn: {B: 104, H: 87, D: 40, hump: 3, sag: 3, legW: 11, legW2: 5, Lh: 30, Hh: 16, angle: 42, poll: [22, -44], body: '#d48a46',
    belly: '#fdf6ea', ears: 'tall', muzzle: 'long', nose: '#3a2a26'},
  whitetail: {B: 100, H: 95, D: 42, hump: 3, sag: 4, legW: 12, legW2: 5.5, Lh: 33, Hh: 18, angle: 48, poll: [20, -40], body: '#b8784a',
    belly: '#fbf3e6', ears: 'tall', muzzle: 'long', nose: '#2b2028'},
  javelina: {B: 88, H: 55, D: 32, hump: 2, sag: 3, legW: 11, legW2: 6, Lh: 27, Hh: 17, angle: 22, poll: [8, 4], body: '#6a6058',
    ears: 'round', muzzle: 'blunt', nose: '#3a302c'},
  coyote: {B: 78, H: 60, D: 27, hump: 0, sag: 2, legW: 9.5, legW2: 5, Lh: 27, Hh: 14, angle: 16, poll: [10, -20], body: '#bd8f5c',
    belly: '#f6ead2', ears: 'prick', muzzle: 'narrow', nose: '#2b2028'},
};
type Q2Props = Place & {kind: keyof typeof SPECIES2; mood?: AnimalMood; walk?: number; graze?: number; color?: string;
  flag?: boolean; points?: number; alarmed?: boolean; duck?: number; doe?: boolean; howl?: number; k?: number};
const Quad2: React.FC<Q2Props> = (p) => {
  const {kind, mood = 'calm', walk, graze = 0, frame = 0, seed = 1, flag = false, points = 0, alarmed = false, doe = false} = p;
  const sp = SPECIES2[kind];
  const id = useUid();
  const c = p.color ?? sp.body, cs = shade(c, 0.32), cd = shade(c, 0.5), cl = light(c, 0.32), ink = line(c);
  const K = p.k ?? 1;
  const ow = 3.4 / ((p.scale ?? 1) * K * CM);
  const t = frame / 30;
  const {B, H, D, hump, Lh, Hh} = sp;
  const duck = Math.max(0, Math.min(1, p.duck ?? 0)), howl = Math.max(0, Math.min(1, p.howl ?? 0));
  const breath = Math.sin(t * 2 * Math.PI / 3.4 + seed) * D * 0.012;
  const top = -H + breath, x0 = -B / 2, x1 = B / 2, legLen = H - D;
  const dF = duck * (H - D * 0.5 - 14);                                  // the front drops this far to get under a wire
  const blink = blinking(frame, seed);
  const ph = walk !== undefined ? walk * 2 * Math.PI * 1.3 : 0;
  const sw = (o: number) => walk !== undefined ? Math.sin(ph + o) * legLen * 0.28 : 0;
  const g = Math.max(0, Math.min(1, graze));
  const px = x1 - D * 0.3 + sp.poll[0] + g * Lh * 0.3 + duck * 26, py = top + sp.poll[1] + g * (H - Hh * 0.6 - sp.poll[1] - 6) + dF + duck * 22
    - howl * 12;
  const ang = sp.angle + g * (78 - sp.angle) + duck * (12 - sp.angle) - howl * (sp.angle + 46);
  const headT = `translate(${px} ${py}) rotate(${ang})`;
  const throat = rot([Lh * 0.3, Hh * 0.98], ang);
  const fy = (y: number) => y + dF;
  const body = `M${x0 + D * 0.3} ${top + 2} C${x0 + B * 0.3} ${top - 2} ${x1 - B * 0.35} ${fy(top - hump) - dF * 0.4} ${x1 - D * 0.35} ${fy(top - hump)}`
    + ` C${x1 + D * 0.12} ${fy(top - hump)} ${x1 + D * 0.22} ${fy(top + D * 0.45)} ${x1 - D * 0.08} ${fy(top + D)}`
    + ` Q0 ${top + D + sp.sag + dF * 0.5} ${x0 + D * 0.2} ${top + D * 0.92}`
    + ` C${x0 - D * 0.22} ${top + D * 0.8} ${x0 - D * 0.25} ${top + D * 0.15} ${x0 + D * 0.3} ${top + 2} Z`;
  const fx = x1 - D * 0.42, hx = x0 + D * 0.42;
  const limb = (k: number) => (u: number) => u < 0.5 ? sp.legW * k + (sp.legW2 * 1.05 - sp.legW * k) * (u / 0.5) ** 0.8
    : sp.legW2 * (1.05 + 0.12 * Math.max(0, 1 - Math.abs(u - 0.53) / 0.06)) - (u - 0.5) * sp.legW2 * 0.2;
  const frontLeg = (x: number, s: number, gy = 0) => {
    const sh: Pt = [x, fy(top + D * 0.42)], hoof: Pt = [x + s + duck * 30, -sp.legW2 * 0.6 - gy];
    const len = -legLen * 0.44 - gy;
    const knee: Pt = duck > 0 ? [x + 2 + duck * 26, Math.min(len, sh[1] + (hoof[1] - sh[1]) * 0.5 - duck * 4)] : [x + 2 + s * 0.4, len];
    return taper(densify([sh, knee, hoof], 8), 0, 0, limb(1.25));
  };
  const hindLeg = (x: number, s: number, gy = 0) => taper(densify([[x, top + D * 0.3], [x + legLen * 0.12 + s * 0.3, -legLen * 0.64 - gy],
    [x - legLen * 0.14 + s * 0.6, -legLen * 0.4 - gy], [x + 1 + s, -sp.legW2 * 0.6 - gy]], 6), 0, 0,
    (u) => u < 0.42 ? sp.legW * 1.6 + (sp.legW2 * 1.1 - sp.legW * 1.6) * (u / 0.42) : sp.legW2 * (1.1 - (u - 0.42) * 0.25));
  const W: Pt = [x1 - D * 0.75, fy(top - hump * 0.4) - dF * 0.3], P: Pt = [px, py], T: Pt = [px + throat[0], py + throat[1]],
    C: Pt = [x1 - D * 0.02, fy(top + D * 0.66)];
  const nl = Math.hypot(P[0] - W[0], P[1] - W[1]) || 1, nx = (P[1] - W[1]) / nl, ny = -(P[0] - W[0]) / nl;
  const cTop: Pt = [(W[0] + P[0]) / 2 + nx * nl * 0.12, (W[1] + P[1]) / 2 + ny * nl * 0.12];
  const cBot: Pt = [(T[0] + C[0]) / 2 + nx * nl * 0.1, (T[1] + C[1]) / 2 + ny * nl * 0.1];
  const neck = `M${f1(W)} Q${f1(cTop)} ${f1(P)} L${f1(T)} Q${f1(cBot)} ${f1(C)} Z`;
  const cran = ell(Lh * 0.3, Hh * 0.46, Lh * 0.32, Hh * 0.56);
  const muz = sp.muzzle === 'blunt' ? taper([[Lh * 0.4, Hh * 0.5], [Lh * 0.95, Hh * 0.6]], Hh * 0.9, Hh * 0.72)
    : sp.muzzle === 'narrow' ? taper([[Lh * 0.4, Hh * 0.46], [Lh * 1.0, Hh * 0.62]], Hh * 0.82, Hh * 0.42)
      : ell(Lh * 0.74, Hh * 0.58, Lh * 0.28, Hh * 0.38);
  const bridge = `M${Lh * 0.28} ${-Hh * 0.04} L${Lh * 0.78} ${Hh * 0.22} L${Lh * 0.78} ${Hh * 0.9} L${Lh * 0.28} ${Hh * 0.98} Z`;
  const mass: Pc[] = [
    {d: neck, f: `url(#${id}-g)`, k: ink},
    {d: body, f: `url(#${id}-g)`, k: ink},
    {d: ell(hx, top + D * 0.4, D * 0.36, D * 0.46), f: `url(#${id}-g)`, k: ink},
    {d: hindLeg(hx, sw(0)), f: `url(#${id}-g)`, k: ink},
    {d: frontLeg(fx, sw(Math.PI)), f: `url(#${id}-g)`, k: ink},
    {d: bridge, f: c, k: ink, t: headT}, {d: cran, f: `url(#${id}-h)`, k: ink, t: headT},
    {d: muz, f: sp.muzzle === 'blunt' ? light(c, 0.08) : light(c, 0.14), k: ink, t: headT},
  ];
  const far: Pc[] = [{d: hindLeg(hx - B * 0.09, sw(Math.PI), 3), f: cs, k: ink}, {d: frontLeg(fx + B * 0.07, sw(0), 3), f: cs, k: ink}];
  const hooves = (list: [number, number, string, boolean][], gy = 0) => list.map(([x, s, col, front], i) => {
    const hx2 = x + s + (front ? duck * 30 : 0);
    return kind === 'coyote'
      ? <ellipse key={i} cx={hx2 + 2} cy={-sp.legW2 * 0.4 - gy} rx={sp.legW2 * 0.85} ry={sp.legW2 * 0.48} fill={shade(c, 0.1)} stroke={ink} strokeWidth={ow} />
      : <rect key={i} x={hx2 - sp.legW2 * 0.62} y={-sp.legW2 * 0.95 - gy} width={sp.legW2 * 1.24} height={sp.legW2 * 0.95} rx={sp.legW2 * 0.3} fill={col} />;
  });
  const swing = Math.sin(t * 2 * Math.PI * 0.55 + seed);
  const brow = moodBrow(alarmed && mood === 'calm' ? 'alert' : mood);
  const ex = Lh * 0.36, ey = Hh * 0.32, er = Math.max(Hh * (kind === 'pronghorn' ? 0.22 : 0.18), 3.2);
  const pale = sp.belly ?? light(c, 0.5);
  // the tail, behind the body, a flag, a bushy brush carried low, or a stub
  const tail = (() => {
    if (kind === 'whitetail') {
      return flag
        ? <path d={taper(quadPts([x0 + 4, top + 8], [x0 - 12, top - 4], [x0 - 10 + swing, top - 22], 6), 13, 15)} fill="#ffffff" stroke={ink}
          strokeWidth={ow * 2} strokeLinejoin="round" paintOrder="stroke" />
        : <path d={taper(quadPts([x0 + 4, top + 8], [x0 - 9, top + 10], [x0 - 7 + swing * 3, top + 24], 6), 9, 8)} fill={c} stroke={ink}
          strokeWidth={ow * 2} strokeLinejoin="round" paintOrder="stroke" />;
    }
    if (kind === 'coyote') {
      const tip: Pt = [x0 - 10 + swing * 2, top + D + 18];
      return <g>
        <path d={taper(quadPts([x0 + 4, top + 5], [x0 - 14, top + 10], tip, 10), 7, 9, (u) => 6 + Math.sin(u * Math.PI * 0.85) * 8)}
          fill={`url(#${id}-g)`} stroke={ink} strokeWidth={ow * 2} strokeLinejoin="round" paintOrder="stroke" />
        <ellipse cx={tip[0]} cy={tip[1] - 2} rx={4.4} ry={6} fill="#2b2230" />
      </g>;
    }
    return <path d={taper([[x0 + 4, top + 8], [x0 - 4, top + 12]], 6, 4.4)} fill={kind === 'pronghorn' ? '#fffaf0' : cd} stroke={ink}
      strokeWidth={ow * 2} strokeLinejoin="round" paintOrder="stroke" />;
  })();
  const hornC = '#2c2632';
  return (
    <g transform={at(p, K)}>
      <defs>
        <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1={x0} y1={top - D * 0.4} x2={x1 * 0.4} y2={-legLen * 0.2}>
          <stop offset="0%" stopColor={cl} /><stop offset="45%" stopColor={c} /><stop offset="100%" stopColor={cs} /></linearGradient>
        <radialGradient id={`${id}-h`} cx="35%" cy="25%" r="85%"><stop offset="0%" stopColor={cl} /><stop offset="70%" stopColor={c} />
          <stop offset="100%" stopColor={cs} /></radialGradient>
        <clipPath id={`${id}-c`}><path d={body} /></clipPath>
        <clipPath id={`${id}-n`}><path d={neck} /></clipPath>
      </defs>
      <ContactShadow x={duck * 10} y={2} w={B * 1.35} opacity={0.3} />
      <Pass ow={ow} list={far} />
      {hooves([[hx - B * 0.09, sw(Math.PI), cd, false], [fx + B * 0.07, sw(0), cd, true]], 3)}
      {tail}
      {kind === 'pronghorn' && alarmed && <Pass ow={ow} list={[0, 1, 2, 3, 4].map((i) => ({
        d: ell(x0 + 2 - Math.sin((i / 4) * Math.PI) * 6, top + D * (0.08 + i * 0.2), 5.4, 5), f: '#fffaf0', k: line('#e8dcc8')}))} />}
      <Pass ow={ow} list={mass} />
      {hooves([[hx, sw(0), '#2b2028', false], [fx, sw(Math.PI), '#2b2028', true]])}
      {/* coat marks inside the body line */}
      <g clipPath={`url(#${id}-c)`}>
        {sp.belly && <ellipse cx={x1 * 0.1} cy={top + D * 1.02 + dF * 0.4} rx={B * 0.38} ry={D * (kind === 'pronghorn' ? 0.42 : 0.3)} fill={pale} opacity={0.95} />}
        {kind === 'pronghorn' && <ellipse cx={x0 + 2} cy={top + D * 0.5} rx={D * (alarmed ? 0.5 : 0.36)} ry={D * (alarmed ? 0.62 : 0.5)} fill="#fffaf0" />}
        {kind === 'javelina' && Array.from({length: 40}).map((_, i) => <circle key={i} cx={x0 + rnd(seed, i) * B} cy={top + rnd(seed, i + 50) * D}
          r={1 + rnd(seed, i + 90) * 1.4} fill={i % 2 ? light(c, 0.35) : shade(c, 0.3)} opacity={0.5} />)}
        {kind === 'javelina' && <path d={`M${x1 - D * 0.62} ${top - 6} C${x1 - D * 0.4} ${top + D * 0.35} ${x1 - D * 0.42} ${top + D * 0.7} ${x1 - D * 0.3} ${top + D + 6}`}
          stroke="#efe6d2" strokeWidth={D * 0.28} fill="none" strokeLinecap="round" />}
        <ellipse cx={-B * 0.08} cy={top + D * 0.12} rx={B * 0.3} ry={D * 0.1} fill="#ffffff" opacity={0.2} />
      </g>
      <g clipPath={`url(#${id}-n)`}>
        {kind === 'pronghorn' && [0.42, 0.7].map((u, i) => {
          const a = lerpPt(W, P, u), b2 = lerpPt(C, T, u);
          return <path key={i} d={`M${f1(lerpPt(a, b2, -0.2))} L${f1(lerpPt(a, b2, 1.2))}`} stroke="#fffaf0" strokeWidth={4.6} />;
        })}
        {kind === 'whitetail' && <ellipse cx={T[0]} cy={T[1] + 4} rx={7} ry={6} fill="#fbf3e6" />}
        {kind === 'coyote' && <path d={`M${f1(lerpPt(C, T, 0.1))} L${f1(T)}`} stroke={pale} strokeWidth={Lh * 0.35} strokeLinecap="round" />}
      </g>

      {/* the mane, raised along the spine when alarmed */}
      {kind === 'javelina' && <g fill={shade(c, 0.4)} stroke={line(c)} strokeWidth={ow * 1.2} strokeLinejoin="round" paintOrder="stroke">
        {Array.from({length: 12}).map((_, i) => {
          const x = x0 + B * (0.16 + i * 0.062), y = top + 3 - Math.sin((i / 14) * Math.PI) * 1.5;
          const len = ((alarmed ? 6 : 2.5) + rnd(seed, 70 + i) * (alarmed ? 4 : 1.5)) * (0.6 + Math.sin(((i + 1) / 16) * Math.PI) * 0.5);
          return <path key={i} d={taper([[x, y], [x - len * 0.45, y - len]], 3.2, 1)} />;
        })}
      </g>}
      {kind === 'coyote' && <path d={`M${x0 + D * 0.3} ${top + 3} Q0 ${top - 3} ${x1 - D * 0.5} ${top + 1}`} stroke={shade(c, 0.28)} strokeWidth={4}
        strokeLinecap="round" fill="none" opacity={0.6} />}
      {/* ears, horns and antlers, world-aligned at the poll */}
      <g transform={`translate(${px} ${py}) rotate(${-howl * 20 + duck * 18})`}>
        {kind === 'whitetail' && points > 0 && <g fill="#f1e4c8" stroke={line('#e8d6b4')} strokeWidth={ow * 1.6} strokeLinejoin="round" paintOrder="stroke">
          {(() => {
            const beam = quadPts([0, -4], [-14, -30], [16, -40], 10);
            const n = Math.max(1, Math.min(6, Math.round(points / 2)));
            return <>
              <path d={taper(beam, 6, 3.4)} />
              {Array.from({length: n}).map((_, i) => {
                const q = beam[Math.round(3 + i * (6 / Math.max(1, n)))];
                return <path key={i} d={taper([q, [q[0] + 1.5, q[1] - 11 - (i === 0 ? 2 : 0)]], 4, 2.2)} />;
              })}
            </>;
          })()}
        </g>}
        {sp.ears === 'tall' && <>
          <ellipse cx={-6} cy={-10} rx={kind === 'pronghorn' ? 4.2 : 5.6} ry={kind === 'pronghorn' ? 9.5 : 13} transform={`rotate(${kind === 'pronghorn' ? -52 : -32} -6 -10)`} fill={c} stroke={ink}
            strokeWidth={ow * 2} paintOrder="stroke" />
          <ellipse cx={-6} cy={-10} rx={2.2} ry={kind === 'pronghorn' ? 6 : 8} transform={`rotate(${kind === 'pronghorn' ? -52 : -32} -6 -10)`} fill="#f6dccb" />
        </>}
        {sp.ears === 'prick' && <>
          <path d="M-5 3 Q-3 -9 1.6 -14 Q6 -6 7 2 Z" fill={c} stroke={ink} strokeWidth={ow * 2} strokeLinejoin="round" paintOrder="stroke" />
          <path d="M-2.4 1.4 Q-1 -6.4 1.8 -9.6 Q4.2 -4.6 4.6 1 Z" fill="#f2c0a8" />
        </>}
        {sp.ears === 'round' && <ellipse cx={-2} cy={-4} rx={5} ry={6.4} transform="rotate(-20 -2 -4)" fill={shade(c, 0.1)} stroke={ink}
          strokeWidth={ow * 2} paintOrder="stroke" />}
        {kind === 'pronghorn' && (doe
          ? <path d={taper(quadPts([4, -2], [3, -9], [5, -15], 4), 5, 2.4)} fill={hornC} stroke={line(hornC)} strokeWidth={ow * 1.6} paintOrder="stroke" />
          : <g fill={hornC} stroke={line('#5a4a6a')} strokeWidth={ow * 1.6} strokeLinejoin="round" paintOrder="stroke">
            <path d={taper([[1, 0], [0.6, -9], [-0.6, -16], [-3, -20.4], [-5.6, -20.8]], 5, 2.2)} fill={light(hornC, 0.14)} />
            <path d={taper([[6, 0], [7, -10], [7.2, -18], [5.4, -25], [2, -29], [-1.6, -28.4]], 8.6, 2.6)} />
            <path d={taper([[6.6, -10], [10.2, -11.6], [12.8, -15.4]], 5.4, 2.4)} />
            <path d={taper([[5, -2], [5.6, -10], [5.4, -18], [3.8, -24]], 1.4, 0.8)} fill="#8a7a9c" stroke="none" />
          </g>)}
      </g>
      {/* the face */}
      <g transform={headT}>
        {kind === 'pronghorn' && <ellipse cx={Lh * 0.62} cy={Hh * 0.9} rx={Lh * 0.26} ry={Hh * 0.2} fill="#fffaf0" />}
        {(kind === 'pronghorn' || kind === 'whitetail') && <ellipse cx={Lh * 0.96} cy={Hh * 0.54} rx={Lh * 0.1} ry={Hh * 0.2} fill={sp.nose} />}
        {kind === 'whitetail' && <ellipse cx={Lh * 0.8} cy={Hh * 0.86} rx={Lh * 0.12} ry={Hh * 0.12} fill="#fbf3e6" />}
        {kind === 'javelina' && <><ellipse cx={Lh * 0.98} cy={Hh * 0.6} rx={Hh * 0.13} ry={Hh * 0.3} fill={light(c, 0.2)} stroke={ink} strokeWidth={ow * 0.9} />
          <circle cx={Lh * 0.99} cy={Hh * 0.5} r={1.4} fill="#3a2a2a" /><circle cx={Lh * 0.99} cy={Hh * 0.7} r={1.4} fill="#3a2a2a" /></>}
        {kind === 'coyote' && <>
          <ellipse cx={Lh * 0.62} cy={Hh * 0.8} rx={Lh * 0.26} ry={Hh * 0.24} fill={pale} />
          <ellipse cx={Lh * 1.0} cy={Hh * 0.5} rx={Lh * 0.08} ry={Hh * 0.16} fill={sp.nose} />
          {howl > 0.3 && <ellipse cx={Lh * 0.86} cy={Hh * 0.82} rx={Lh * 0.1} ry={Hh * 0.18 * howl} fill="#5a2a3a" />}
        </>}
        {mood === 'happy' && <path d={`M${Lh * 0.7} ${Hh * 0.86} q${Lh * 0.12} ${Hh * 0.12} ${Lh * 0.24} -${Hh * 0.02}`} stroke={ink}
          strokeWidth={ow * 0.9} fill="none" strokeLinecap="round" />}
        <g transform={`translate(${ex} ${ey}) rotate(${-ang})`}>
          {kind === 'whitetail' && <ellipse cx={0} cy={0} rx={er * 1.45} ry={er * 1.3} fill="#fbf3e6" />}
          <Eye x={0} y={0} r={er} ink={ink} browC={cd} ow={ow} blink={blink} tilt={brow.tilt} raise={brow.raise} />
          <circle cx={-er * 0.6} cy={er * 1.7} r={er * 0.6} fill="#ff6b8a" opacity={0.2} />
        </g>
      </g>
    </g>
  );
};

/**
 * PRONGHORN. Not an antelope. Tan above, white belly and flank bite, two white throat bands, an
 * enormous eye, the white rump patch that flares when `alarmed`, and black horns taller than the head
 * with a forward PRONG. It goes UNDER a fence. `underFence` drops the chest nearly to the ground, folds
 * the front legs and carries the neck forward and low.
 */
export const PronghornV2: React.FC<Place & {underFence?: number; alarmed?: boolean; doe?: boolean; mood?: AnimalMood; walk?: number}> = ({
  underFence, ...p}) => <Quad2 {...p} kind="pronghorn" duck={underFence} />;

/**
 * WHITE-TAILED DEER. Up and FLARED when fleeing (`flagging`), the brown tail down and flicking when not.
 * Antlers grow from one main beam sweeping FORWARD with unbranched tines rising off it, `points` of them
 * across the pair. `southTexas` deer are genuinely smaller.
 */
export const WhitetailV2: React.FC<Place & {flagging?: boolean; points?: number; southTexas?: boolean; mood?: AnimalMood; walk?: number;
  graze?: number}> = ({flagging = false, points = 0, southTexas = false, ...p}) =>
  <Quad2 {...p} kind="whitetail" flag={flagging} points={points} k={southTexas ? 0.88 : 1} />;

/**
 * JAVELINA. Not a pig. A straighter back, longer legs, a blunt snout, a grizzled grey coat, the PALE
 * COLLAR across the shoulders, and a mane along the spine that rises when `alarmed`.
 */
export const JavelinaV2: React.FC<Place & {alarmed?: boolean; mood?: AnimalMood; walk?: number}> = (p) => <Quad2 {...p} kind="javelina" />;

/**
 * COYOTE. Lean and light, long legs, a narrow muzzle, tall pointed ears, and THE TAIL CARRIED DOWN with
 * its black tip, which is the whole difference from a dog at a distance. `trotting` walks it, `howling`
 * lifts the head.
 */
export const CoyoteV2: React.FC<Place & {trotting?: boolean; howling?: boolean; mood?: AnimalMood}> = ({trotting, howling, frame = 0, ...p}) =>
  <Quad2 {...p} frame={frame} kind="coyote" walk={trotting ? frame / 30 * 1.4 : undefined} howl={howling ? 1 : 0} />;

/**
 * LONGHORN, on the props.tsx Quad rig (CowV2 longhorn) at the library's 1.45 m shoulder. The hide is
 * any of the library's six, chosen by seed when `hide` is not given, so a herd is varied. `grazing`
 * lowers the head to the grass.
 */
const HIDE_V2 = ['#9a4e2a', '#3a302c', '#d8cbb0', '#74482e', '#c47a3c', '#8a3022'] as const;
export const LonghornV2: React.FC<Place & {hide?: string; horn?: number; grazing?: boolean; mood?: AnimalMood; walk?: number}> = ({
  hide, horn: _horn, grazing = false, ...p}) => {
  const coat = hide ?? HIDE_V2[Math.floor(rnd(p.seed ?? 5, 3) * HIDE_V2.length)];
  return <CowV2 {...p} scale={(p.scale ?? 1) * 145 / 136} longhorn color={coat} graze={grazing ? 1 : 0} mood={p.mood ?? 'calm'} />;
};

/**
 * FERAL HOG, on the props.tsx Quad rig (HogV2) at the library's 85 cm shoulder. Heavy forequarters,
 * the bristled ridge, small tusks, alert rather than monstrous. `rooting` puts the snout to the ground
 * and tears it, and the torn ground is part of the drawing, because the damage is the story.
 */
export const FeralHogV2: React.FC<Place & {rooting?: boolean; boar?: boolean; mood?: AnimalMood; walk?: number}> = ({rooting = false,
  boar: _boar, ...p}) => {
  const {frame = 0} = p;
  const K = 85 / 74;
  const ow = owOf(p) / K;
  const dirt = '#8a5a36';
  const shove = rooting ? Math.sin(frame / 7) : 0;
  return (
    <g>
      {rooting && <g transform={at(p, K)}>
        <path d="M52 2 Q60 -7 74 -6 Q88 -9 100 -4 Q112 -2 116 3 Q90 8 70 6 Q58 6 52 2 Z" fill={dirt} stroke={line(dirt)} strokeWidth={ow * 2}
          strokeLinejoin="round" paintOrder="stroke" />
        {[60, 74, 88, 102].map((cx, i) => <ellipse key={cx} cx={cx} cy={-5 - (i % 2) * 2} rx={5} ry={3.4} fill={light(dirt, 0.25)}
          stroke={line(dirt)} strokeWidth={ow * 1.4} paintOrder="stroke" />)}
      </g>}
      <HogV2 {...p} scale={(p.scale ?? 1) * K} graze={rooting ? 0.45 : 0} mood={p.mood ?? 'alert'} />
      {rooting && <g transform={at(p, K)}>
        {[0, 1, 2].map((i) => {
          const u = ((frame / 14 + i / 3) % 1);
          return <circle key={i} cx={96 + u * 22 + i * 3} cy={-6 - Math.sin(u * Math.PI) * (16 + i * 4) + shove} r={2.6 - i * 0.4} fill={light(dirt, 0.15)}
            stroke={line(dirt)} strokeWidth={ow} />;
        })}
      </g>}
    </g>
  );
};

// ============================================================================ the small ground animals

/**
 * ARMADILLO, housecat-sized, and it JUMPS STRAIGHT UP when startled (`leap` 0 to 1). The shell is a
 * front shield, a banded middle with nine bands and a rear shield, the ears are tall and upright, the
 * snout long, the tail a stiff ringed cone held out. The shadow stays on the ground when it leaps.
 */
export const ArmadilloV2: React.FC<Place & {leap?: number; rooting?: boolean; mood?: AnimalMood}> = (p) => {
  const {frame = 0, seed = 2, leap = 0, rooting = false} = p;
  const mood = p.mood ?? (leap > 0 ? 'worried' : 'calm');
  const id = useUid();
  const ow = owOf(p, 1.1);
  const hop = leap > 0 ? Math.sin(Math.min(1, leap) * Math.PI) : 0;
  const lift = hop * 30, splay = hop * 8;
  const sn = rooting ? Math.sin(frame / 6) * 0.8 : 0;
  const shell = '#d2a07a', band = '#b47c5a', skin = '#eab6a2';
  const shellD = 'M-22 -6.5 C-23.5 -15 -15 -23 -1 -23.4 C13 -23.6 22.5 -16 23 -7.6 Q12 -3.4 0 -3.8 Q-12 -3.6 -22 -6.5 Z';
  const legs = [[-15, -1], [-8, -1], [9, 1], [15.5, 1]].map(([lx, dir]) => taper([[lx, -7], [lx + dir * (1 + splay * 0.4), -2.4]], 5.4, 4.2));
  const headT = `translate(${19.5} ${-10 + sn}) rotate(${rooting ? 16 : -2})`;
  const brow = moodBrow(mood);
  return (
    <g transform={at(p)}>
      <defs><Orb id={`${id}-s`} c={shell} /><Orb id={`${id}-k`} c={skin} /><Lit id={`${id}-t`} c={band} />
        <clipPath id={`${id}-c`}><path d={shellD} /></clipPath></defs>
      <ContactShadow x={-2} y={1} w={56 - hop * 22} opacity={0.32 - hop * 0.14} />
      <g transform={`translate(0 ${-lift})`}>
        <Pass ow={ow} list={[
          ...legs.map((d) => ({d, f: `url(#${id}-k)`, k: line(skin)})),
          {d: taper([[-19, -10], [-34, -6.5], [-48, -3]], 6.2, 1.8), f: `url(#${id}-t)`, k: line(band)},
          {d: ell(0, 0, 9, 4.8), f: `url(#${id}-k)`, k: line(skin), t: `${headT} translate(6 0) rotate(8)`},
          {d: taper([[4, 0.6], [15.5, 3]], 6.6, 2.6), f: `url(#${id}-k)`, k: line(skin), t: headT},
          {d: ell(-1, -9.5, 2.3, 5.6), f: skin, k: line(skin), t: `${headT} rotate(-14 -1 -9.5)`},
          {d: ell(3, -9, 2.3, 5.6), f: `url(#${id}-k)`, k: line(skin), t: `${headT} rotate(8 3 -9)`},
          {d: shellD, f: `url(#${id}-s)`, k: line(shell)},
        ]} />
        {legs.map((_, i) => {
          const [lx, dir] = [[-15, -1], [-8, -1], [9, 1], [15.5, 1]][i];
          return <path key={i} d={`M${lx + dir * (1 + splay * 0.4) - 1.6} -0.6 l${dir * 2.4 + 2} 0.6 M${lx + dir * (1 + splay * 0.4)} -0.6 l${dir * 2.4 + 2} 0.6`}
            stroke="#f6e6da" strokeWidth={0.7} strokeLinecap="round" />;
        })}
        {/* the ringed tail */}
        {[0.25, 0.48, 0.7].map((u) => <path key={u} d={`M${-19 - 29 * u} ${-12.6 + 9 * u} l0 ${5 - 3.4 * u}`} stroke={shade(band, 0.3)} strokeWidth={0.8}
          strokeLinecap="round" />)}
        {/* the three-part shell, shields fore and aft with their scale rosettes, nine bands across the middle */}
        <g clipPath={`url(#${id}-c)`}>
          {Array.from({length: 26}).map((_, i) => {
            const front = i % 2 === 0, j = Math.floor(i / 2);
            const cx = front ? 12 + (j % 4) * 3 : -19 + (j % 4) * 3, cy = -20 + Math.floor(j / 4) * 3.4 + (j % 2) * 1.2;
            return <circle key={i} cx={cx} cy={cy} r={1.1} fill={light(shell, 0.3)} stroke={band} strokeWidth={0.4} opacity={0.75} />;
          })}
          {Array.from({length: 9}).map((_, i) => {
            const bx = -9 + i * 2.25;
            return <path key={i} d={`M${bx} -25 Q${bx + 1.2} -14 ${bx + 0.4} -3`} stroke={band} strokeWidth={1.1} fill="none" />;
          })}
          {Array.from({length: 9}).map((_, i) => {
            const bx = -8.3 + i * 2.25;
            return <path key={`h${i}`} d={`M${bx} -24 Q${bx + 1.2} -15 ${bx + 0.6} -6`} stroke={light(shell, 0.45)} strokeWidth={0.5} fill="none" opacity={0.7} />;
          })}
          <path d="M-21 -7.6 Q0 -2.8 22 -8.6" stroke={light(shell, 0.4)} strokeWidth={1.6} fill="none" opacity={0.7} />
          <ellipse cx={-6} cy={-20.5} rx={11} ry={2} fill="#ffffff" opacity={0.28} />
        </g>
        <g transform={headT}>
          <ellipse cx={15.5} cy={3} rx={1.4} ry={1.1} fill={shade(skin, 0.4)} />
          <Eye x={6.4} y={-1.4} r={1.35} ink={line(skin)} browC={shade(skin, 0.5)} ow={ow} blink={blinking(frame, seed)} tilt={brow.tilt}
            raise={brow.raise + (hop > 0.2 ? 0.4 : 0)} />
          <circle cx={9} cy={1} r={0.9} fill="#ff6b8a" opacity={0.25} />
        </g>
      </g>
    </g>
  );
};

/**
 * BLACK-TAILED JACKRABBIT, a hare and not a rabbit. The ears are the animal, enormous and black-tipped,
 * the vessels lit when `backlit`. A big haunch and a long hind foot, the eye set high and far back, the
 * black-topped tail. It LOPES (`loping`), long and low with the ears laid back.
 */
export const JackrabbitV2: React.FC<Place & {loping?: boolean; backlit?: boolean; mood?: AnimalMood}> = (p) => {
  const {frame = 0, seed = 10, loping = false, backlit = false, mood = 'alert'} = p;
  const id = useUid();
  const ow = owOf(p, 1.2);
  const c = '#bfa27c', belly = '#f6ead6', earC = backlit ? '#f7b98e' : '#c9ab86';
  const lope = loping ? 1 : 0, st = loping ? Math.sin(frame / 4) : 0;
  const swivel = Math.sin(frame / 29 + seed * 6) * 4;
  const twitch = Math.sin(frame * 0.9) * 0.3;
  const bodyD = ell(-2 + lope * 2, -20 + lope * 3, 15.5 + lope * 4, 10.5 - lope * 2.4);
  const haunch = ell(-10.5 - lope * 2, -14 + lope * 2, 10 + lope, 11 - lope * 2);
  const hindFoot = taper([[-14 - lope * 3 + st * 3, -2], [2 - lope * 6 + st * 6, -1.6]], 5.2, 3.8);
  const frontLeg = taper([[8 + lope * 4, -17], [10 + lope * 4 + st * 6, -5], [12 + lope * 4 + st * 8, -1.4]], 4.4, 3.2);
  const neck = taper([[6, -22 + lope * 3], [12 + lope * 5, -30 + lope * 6]], 9, 8);
  const hT = `translate(${13 + lope * 6} ${-31 + lope * 7}) rotate(${swivel + lope * 12})`;
  const ear = (i: number) => `${hT} translate(${i ? -2 : 1.5} -4) rotate(${(i ? -10 : 6) + lope * 62 + (i ? 0 : twitch * 10)})`;
  const earD = 'M-2.8 -1 C-4.9 -12 -4.1 -23 0.6 -27 C5.1 -23 5.1 -12 2.8 -1 Z';
  const brow = moodBrow(mood);
  return (
    <g transform={at(p)}>
      <defs><Orb id={`${id}-b`} c={c} /><Lit id={`${id}-e`} c={earC} /><clipPath id={`${id}-c`}><path d={bodyD} /></clipPath></defs>
      <ContactShadow x={-2} y={1} w={48 + lope * 10} opacity={0.3} />
      <Pass ow={ow} list={[{d: taper([[6, -16], [9 + st * -5, -1.4]], 3.8, 3), f: shade(c, 0.25), k: line(c)}]} />
      {/* the black-topped tail */}
      <path d={ell(-17.6 - lope * 3, -22 + lope * 2, 3.6, 3)} fill="#2b2430" stroke={line('#2b2430')} strokeWidth={ow * 2} paintOrder="stroke" />
      <g>{[1, 0].map((i) => <path key={i} d={earD} transform={ear(i)} fill={i ? shade(earC, 0.12) : `url(#${id}-e)`} stroke={line(c)}
        strokeWidth={ow * 2} strokeLinejoin="round" paintOrder="stroke" />)}</g>
      {[1, 0].map((i) => <g key={i} transform={ear(i)}>
        {backlit && <path d="M0 -4 C-0.8 -12 -0.3 -18 0.6 -22.4 M0.6 -6 C1.8 -13 2 -17 1.8 -19.6 M-0.4 -9 C-1.6 -13 -1.8 -15 -1.6 -17" stroke="#c4583c" strokeWidth={0.5} fill="none" opacity={0.75} />}
        {!backlit && <path d="M0.4 -3 C-0.7 -12 -0.5 -18 0.6 -22" stroke="#f2c8b0" strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={0.7} />}
        <path d="M-2.5 -21.8 C-2 -25.4 0 -27 0.6 -27 C2.8 -26.2 3.6 -24 3.2 -21.4 Q0.4 -22.9 -2.5 -21.8 Z" fill="#2b2430" />
      </g>)}
      <Pass ow={ow} list={[
        {d: neck, f: c, k: line(c)},
        {d: bodyD, f: `url(#${id}-b)`, k: line(c)},
        {d: frontLeg, f: c, k: line(c)},
        {d: hindFoot, f: shade(c, 0.08), k: line(c)},
        {d: haunch, f: `url(#${id}-b)`, k: line(c)},
        {d: 'M-7.6 -3.4 C-6 -7 -3.2 -8.4 1 -9.6 C6 -9.6 9.4 -6.2 8.4 -2.4 C7 0.6 0 1.4 -4.6 0.4 C-7.6 -0.4 -8.8 -1.4 -7.6 -3.4 Z', f: `url(#${id}-b)`,
          k: line(c), t: hT},
      ]} />
      <g clipPath={`url(#${id}-c)`}><ellipse cx={4} cy={-11 + lope * 2} rx={14} ry={5} fill={belly} opacity={0.9} />
        <ellipse cx={-4} cy={-27 + lope * 3} rx={9} ry={2} fill="#ffffff" opacity={0.22} /></g>
      <path d={`M-16 ${-18 + lope * 2} Q-11 ${-24 + lope * 2} -4 ${-21 + lope * 2}`} stroke={light(c, 0.5)} strokeWidth={1.4} fill="none" strokeLinecap="round"
        opacity={0.5} />
      <g transform={hT}>
        <ellipse cx={8.2} cy={-3.6} rx={1.2} ry={0.95} fill="#e88a9a" />
        <path d="M5 -0.4 q1.6 1.4 3 0.4" stroke={line(c)} strokeWidth={0.5} fill="none" strokeLinecap="round" />
        <ellipse cx={4} cy={-1} rx={3} ry={1.6} fill={belly} opacity={0.8} />
        <Eye x={1.4} y={-4.8} r={1.9} ink={line(c)} browC={shade(c, 0.45)} ow={ow} blink={blinking(frame, seed)} tilt={brow.tilt} raise={brow.raise} />
      </g>
    </g>
  );
};

/**
 * TEXAS HORNED LIZARD, the state reptile and declining. Flat, round and spiny, seen from a low three
 * quarter above, with a crown of horns whose two central spikes are longest, a fringe of pointed scales
 * down each flank, dark dorsal blotches edged pale, and legs splayed out the way a lizard sits.
 */
export const HornedLizardV2: React.FC<Place & {mood?: AnimalMood}> = (p) => {
  const {frame = 0, seed = 11, mood = 'alert'} = p;
  const id = useUid();
  const ow = owOf(p, 0.2);
  const c = '#d2a26a', blot = '#7e4a34', pale = '#f8e6c0', hornC = '#ead3a0';
  const br = 1 + Math.sin(frame / 15 + seed * 6) * 0.03;
  const leg = (x: number, d: number, s: number) => taper([[x, -1.2], [x + d * 0.9, -1.2 + s * 0.9], [x + d * 1.9, -0.2 + s * 0.4]], 1.1, 0.7);
  const bodyD = ell(0, -1.5, 3.7, 2.2);
  // the fringe of pointed scales along the flank, outlined with the body so they read as part of it
  const fringe = [-2.6, -1.4, -0.2, 1, 2.1].map((fx) => taper([[fx, -0.2], [fx - 0.35, 0.75]], 0.8, 0.2));
  const crown: [number, number, number][] = [[2.9, -2.6, 0.9], [3.3, -3.0, 1.45], [3.9, -3.15, 1.45], [4.5, -3.0, 0.9], [5.0, -2.6, 0.6]];
  const brow = moodBrow(mood);
  return (
    <g transform={at(p)}>
      <defs><Orb id={`${id}-b`} c={c} /><Lit id={`${id}-h`} c={hornC} /><clipPath id={`${id}-c`}><path d={bodyD} /></clipPath></defs>
      <ContactShadow x={0} y={0.4} w={10} opacity={0.32} />
      <g transform={`scale(${br} ${br})`}>
        <Pass ow={ow} list={[
          {d: leg(-2.2, -1, 1), f: shade(c, 0.12), k: line(c)}, {d: leg(2.2, 1, 1), f: shade(c, 0.12), k: line(c)},
          ...fringe.map((d) => ({d, f: pale, k: line(c)})),
          {d: taper([[-3.4, -1.4], [-6.6, -0.6]], 1.6, 0.4), f: c, k: line(c)},
          {d: bodyD, f: `url(#${id}-b)`, k: line(c)},
          {d: ell(4, -1.8, 1.9, 1.35), f: `url(#${id}-b)`, k: line(c)},
        ]} />
        <g clipPath={`url(#${id}-c)`}>
          <path d="M-3.8 -2.7 Q0 -3.5 3.6 -2.5" stroke={pale} strokeWidth={0.38} fill="none" strokeLinecap="round" />
          {[-2.4, -0.6, 1.2].map((bx, i) => <g key={i}>
            <path d={`M${bx - 0.7} -3.3 Q${bx} -3.9 ${bx + 0.7} -3.3 Q${bx + 0.5} -2.7 ${bx} -2.75 Q${bx - 0.55} -2.7 ${bx - 0.7} -3.3 Z`} fill={blot} />
            <path d={`M${bx - 0.6} -2.1 Q${bx + 0.1} -2.6 ${bx + 0.7} -2.1 Q${bx + 0.5} -1.5 ${bx} -1.6 Q${bx - 0.5} -1.6 ${bx - 0.6} -2.1 Z`} fill={blot}
              opacity={0.85} />
          </g>)}
          {Array.from({length: 18}).map((_, i) => <circle key={i} cx={-3.2 + rnd(seed, i) * 6.4} cy={-3.4 + rnd(seed, i + 20) * 3.4} r={0.12 + rnd(seed, i + 40) * 0.08}
            fill={pale} />)}
          <ellipse cx={-0.8} cy={-3.1} rx={2.2} ry={0.4} fill="#ffffff" opacity={0.32} />
        </g>
        {/* the crown of horns at the back of the skull, the two central spikes the longest */}
        {crown.map(([hx, hy, len], i) => <path key={i} d={taper([[hx, hy + 0.35], [hx - len * 0.45, hy - len]], 0.62, 0.18)} fill={`url(#${id}-h)`}
          stroke={line(hornC)} strokeWidth={ow * 1.5} strokeLinejoin="round" paintOrder="stroke" />)}
        <ellipse cx={5.45} cy={-1.5} rx={0.28} ry={0.16} fill={shade(c, 0.5)} />
        <path d="M5.1 -0.9 Q5.6 -0.95 5.8 -1.25" stroke={line(c)} strokeWidth={0.12} fill="none" strokeLinecap="round" />
        <Eye x={4.25} y={-2.0} r={0.5} ink={line(c)} browC={shade(c, 0.55)} ow={ow} blink={blinking(frame, seed, 130)} tilt={brow.tilt + 0.6} raise={brow.raise} />
      </g>
    </g>
  );
};

// ============================================================================ the bat column

/**
 * MEXICAN FREE-TAILED BAT COLUMN, Bracken and Congress Avenue. A ribbon of density, not a sky of
 * little bats, many wide strands streaming on one curve, a cool violet body rimmed by the warm dusk on
 * its lit side, widening as it climbs. Only at the near end do a few animals resolve, and the nearest
 * gets a face. Screen units, as in the library.
 */
export const BatColumnV2: React.FC<{x?: number; y?: number; scale?: number; frame: number; seed?: number; height?: number; density?: number;
  resolved?: number}> = ({x = 0, y = 0, scale = 1, frame, seed = 15, height = 700, density = 1, resolved = 7}) => {
  const id = useUid();
  const H = height;
  const strand = (i: number, rim: boolean) => {
    const p = rnd(seed, 200 + i), q = rnd(seed, 260 + i);
    const amp = 40 + p * 90, ph = frame / (34 + p * 26) + p * 9, w = 34 + p * 62, lean = -70 + q * 250;
    const d = `M${(q - 0.5) * 90} 0 C${Math.sin(ph + 0.6) * amp - 40 + lean * 0.15} ${-H * 0.3} ${Math.sin(ph + 1.4) * amp + 50 + lean * 0.55} ${-H * 0.66}`
      + ` ${Math.sin(ph + 2.2) * amp * 1.2 + lean} ${-H}`;
    return rim
      ? <path key={`r${i}`} d={d} transform="translate(-6 -4)" stroke="#ffb27a" strokeWidth={w} fill="none" strokeLinecap="round" opacity={(0.05 + p * 0.06) * density} />
      : <path key={i} d={d} stroke={`url(#${id}-s)`} strokeWidth={w} fill="none" strokeLinecap="round" opacity={(0.14 + p * 0.18) * density} />;
  };
  const bat = (i: number) => {
    const p = rnd(seed, 300 + i);
    const near = i === 0;
    const bx = near ? 70 : -60 + p * 150, by = near ? -110 : -60 - p * H * 0.34;
    const flap = Math.sin(frame / 3.1 + p * 12) * 0.55 + 0.45;
    const s = near ? 4.2 : 0.7 + p * 0.9;
    const c = '#4a3a5e';
    const wing = (d: 1 | -1) => `M0 -1 C${d * 7} ${-5 - flap * 8} ${d * 17} ${-4 - flap * 7} ${d * 23} ${1 - flap * 4} Q${d * 19} ${2 + flap} ${d * 15} ${1.4 + flap * 1.6}`
      + ` Q${d * 11} ${3 + flap * 2} ${d * 7} ${2.6 + flap * 1.4} Q${d * 3} ${4 + flap} 0 4 Z`;
    return (
      <g key={i} transform={`translate(${bx} ${by}) scale(${s}) rotate(${near ? -8 : -18 + p * 40})`} opacity={near ? 1 : 0.6 + p * 0.35}>
        <g fill={line(c)} stroke={line(c)} strokeWidth={near ? 2.4 : 1.6} strokeLinejoin="round">
          <path d={wing(1)} /><path d={wing(-1)} /><ellipse cx={0} cy={1} rx={3.6} ry={5} />
        </g>
        <path d={wing(1)} fill={`url(#${id}-w)`} /><path d={wing(-1)} fill={`url(#${id}-w)`} />
        <ellipse cx={0} cy={1} rx={3.6} ry={5} fill={`url(#${id}-b)`} />
        <path d="M-2.6 -2.4 L-2.6 -6 L-0.8 -3.4 Z M2.6 -2.4 L2.6 -6 L0.8 -3.4 Z" fill={c} stroke={line(c)} strokeWidth={0.6} strokeLinejoin="round" />
        {near && <>
          {[-1, 1].map((k) => <g key={k}><circle cx={k * 1.3} cy={-0.6} r={1.05} fill="#ffffff" />
            <circle cx={k * 1.3 + 0.2} cy={-0.5} r={0.62} fill="#1f1736" /><circle cx={k * 1.3 - 0.15} cy={-0.95} r={0.25} fill="#ffffff" />
            <path d={`M${k * 0.5} -2.2 L${k * 2.2} -2.5`} stroke={shade(c, 0.4)} strokeWidth={0.45} strokeLinecap="round" /></g>)}
          <path d="M-0.8 1.4 Q0 2.1 0.8 1.4" stroke="#ffb6c8" strokeWidth={0.4} fill="none" strokeLinecap="round" />
        </>}
      </g>
    );
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <linearGradient id={`${id}-s`} gradientUnits="userSpaceOnUse" x1={-200} y1={0} x2={200} y2={-H}>
          <stop offset="0%" stopColor="#3a2a52" /><stop offset="100%" stopColor="#6a5a8e" /></linearGradient>
        <linearGradient id={`${id}-w`} x1="0" y1="0" x2="0.3" y2="1"><stop offset="0%" stopColor="#8a76a8" /><stop offset="100%" stopColor="#3a2c4e" />
        </linearGradient>
        <radialGradient id={`${id}-b`} cx="35%" cy="25%" r="85%"><stop offset="0%" stopColor="#9a7a6a" /><stop offset="100%" stopColor="#3e2e40" /></radialGradient>
        <filter id={`${id}-f`} x="-50%" y="-20%" width="200%" height="140%"><feGaussianBlur stdDeviation={7} /></filter>
      </defs>
      <g filter={`url(#${id}-f)`}>
        {Array.from({length: 26}, (_, i) => strand(i, true))}
        {Array.from({length: 26}, (_, i) => strand(i, false))}
      </g>
      {Array.from({length: resolved}, (_, i) => bat(resolved - 1 - i))}
    </g>
  );
};

export const FAUNA_V2 = ['GrackleV2', 'MockingbirdV2', 'ArmadilloV2', 'PronghornV2', 'TurkeyVultureV2', 'LonghornV2', 'WhitetailV2', 'JackrabbitV2',
  'RoadrunnerV2', 'CattleEgretV2', 'HornedLizardV2', 'FeralHogV2', 'JavelinaV2', 'CoyoteV2', 'BatColumnV2'] as const;
