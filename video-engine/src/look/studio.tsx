import React from 'react';

/**
 * THE MOTION STUDIO (November 15th, 2026). The layer that makes a look v2 film move like motion
 * design instead of a slideshow of good drawings.
 *
 * The owner pointed at a motion-design stack (Disney's twelve principles as a skill, GSAP timelines,
 * react-postprocessing, three.quarks particles, librosa beat sync) and asked for the Texas films
 * to move ten times better. The daily film is 2D and every frame is a pure function of the board
 * clock, so each idea is rebuilt here in that idiom, with no new dependency:
 *
 *  1. HITS. Every visual event is a hit. The camera dips a little the other way first
 *     (anticipation), punches past its mark (overshoot) and settles on a damped spring, with a
 *     three-frame shake on the impact. Nothing moves in a straight line.
 *  2. BEATS. `board.beats` is the music bed's measured beat grid (scripts/beat_grid.py, stamped by
 *     `lean.py time`). With none, a 120 BPM grid from zero. Label chips and the hook's words land on
 *     the nearest beat, and a soft light pulse breathes on every beat.
 *  3. WHIP CUTS. A cut is a whip pan: the outgoing shot smears out sideways with horizontal motion
 *     blur and the new one smears in from the other side and settles, alternating direction.
 *  4. DEPTH. Far dust drifts slower than the camera and near bokeh faster (parallax), light shafts
 *     sweep from the key side, and a ring of light blooms out on each hit.
 *  5. SQUASH AND STRETCH. `squash` gives an element landing on a hit the classic squash, rebound
 *     stretch and settle, for chips, stamps and drawings.
 *  6. ANIMATED DIAGRAMS. `CountUp` and `DrawOn` let an episode count a number up and draw a line
 *     on with an overshoot, the way an explainer animates a figure instead of showing a card.
 *
 * A board with `motion: 'off'` renders exactly as look v2 did before this layer, for comparison.
 * Every value is deterministic from the frame.
 */

export type StudioBoard = {motion?: string; beats?: number[]; runtime_s?: number;
  scenes?: {start_s: number; duration_s?: number; visual_events?: unknown[]}[]};

export const studioOn = (board: StudioBoard): boolean => board.motion !== 'off';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** 120 BPM is one beat every half second, the grid trending sounds sit on. */
export const FALLBACK_BPM = 120;

export const beatGrid = (board: StudioBoard): number[] => {
  const measured = (board.beats ?? []).filter((b) => Number.isFinite(b));
  if (measured.length >= 4) return measured;
  const end = Math.max(10, board.runtime_s ?? 0, ...(board.scenes ?? []).map((s) => s.start_s + (s.duration_s ?? 0)));
  const step = 60 / FALLBACK_BPM;
  const out: number[] = [];
  for (let t = 0; t <= end + step; t += step) out.push(Math.round(t * 1000) / 1000);
  return out;
};

/** The nearest beat within `window` seconds, or t itself. */
export const snapBeat = (t: number, beats: number[], window = 0.16): number => {
  let best = t, gap = window;
  for (const b of beats) {
    const d = Math.abs(b - t);
    if (d <= gap) { gap = d; best = b; }
    if (b > t + window) break;
  }
  return best;
};

/** Seconds since the last beat at or before t (Infinity before the first). */
export const sinceBeat = (t: number, beats: number[]): number => {
  let last = -Infinity;
  for (const b of beats) { if (b <= t) last = b; else break; }
  return t - last;
};

/** A damped spring step response with overshoot: 0 at s=0, about 1.12 at its peak, 1 at rest. */
export const overshoot = (s: number, freq = 4.2, damp = 5.5): number => {
  if (s <= 0) return 0;
  return 1 - Math.exp(-damp * s) * Math.cos(2 * Math.PI * freq * s);
};

/** Decaying ring after an impact: 0 at s=0, rises and dies within about 0.6 s. */
export const ring = (s: number, freq = 3.4, damp = 6.5): number =>
  s <= 0 ? 0 : Math.exp(-damp * s) * Math.sin(2 * Math.PI * freq * s);

/**
 * SQUASH AND STRETCH for a thing landing at s = 0: it squashes wide and low, rebounds tall and
 * thin, settles. Volume is kept (sx * sy stays near 1). Returns CSS scale factors.
 */
export const squash = (s: number, amount = 0.16): {sx: number; sy: number} => {
  if (s < 0) return {sx: 1, sy: 1};
  const k = Math.exp(-7 * s) * Math.cos(2 * Math.PI * 3.2 * s);
  const sy = 1 - amount * k;
  return {sx: 1 / Math.max(0.6, sy), sy};
};

export type Hit = {t: number; strength: number};

/** Every visual event in the film, in film time. The first half second belongs to the hook. */
export const hitsFor = (board: StudioBoard): Hit[] => {
  const out: Hit[] = [];
  for (const scene of board.scenes ?? []) {
    for (const e of (scene.visual_events ?? []) as {at_s?: number; sound?: string}[]) {
      if (typeof e.at_s !== 'number') continue;
      const t = scene.start_s + e.at_s;
      if (t < 0.5) continue;
      out.push({t, strength: e.sound ? 1 : 0.7});
    }
  }
  return out.sort((a, b) => a.t - b.t);
};

/** Deterministic jitter for the shake, -1..1. */
const jitter = (n: number) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
};

/**
 * THE HIT CAMERA. The sum of every hit near now: anticipation in the 0.14 s before it (a pull back
 * and a lean the other way), the punch and its damped overshoot after, and a three-frame shake on
 * the impact itself. Returned as offsets the film adds to its own camera.
 */
export const hitCamera = (time: number, fps: number, hits: Hit[]) => {
  let scale = 0, x = 0, y = 0, rot = 0, glow = 0;
  for (const h of hits) {
    const s = time - h.t;
    if (s < -0.14 || s > 0.9) continue;
    if (s < 0) {
      const a = Math.sin(Math.PI * clamp((s + 0.14) / 0.14));   // in and out of the wind-up
      scale -= 0.014 * a * h.strength;
      y += 7 * a * h.strength;
      continue;
    }
    scale += 0.034 * ring(s) * h.strength + 0.004 * Math.exp(-4 * s) * h.strength;
    glow = Math.max(glow, Math.exp(-5 * s) * h.strength);
    const f = Math.floor(s * fps + 1e-6);
    if (f <= 2) {
      const amp = [16, 9, 4][f] * h.strength;
      const n = Math.round(h.t * 1000) + f * 7;
      x += amp * jitter(n);
      y += amp * 0.7 * jitter(n + 3);
      rot += 0.5 * jitter(n + 5) * h.strength * (3 - f) / 3;
    }
  }
  return {scale, x, y, rot, glow};
};

/**
 * ACTING. The studio camera moves the frame. This moves the people in it. The film puts the clock,
 * the beat grid and the hits in context, and every look v2 Figure reads them, so each person on
 * screen acts in every shot without an episode asking:
 *  - a slow weight shift and lean, so a held figure stands like a person, not a cut-out
 *  - a head nod on the beat, so the cast moves with the music
 *  - a take on every hit: a small crouch before it (anticipation), a stretch up with the head
 *    popping and the brows lifting after it (overshoot), settling on a spring
 *  - a pose change that winds back first and overshoots its mark, instead of sliding
 * Outside a studio film there is no context and a Figure moves exactly as before.
 */
export type Acting = {time: number; beats: number[]; hits: Hit[]};
export const ActingContext = React.createContext<Acting | null>(null);

export type Take = {sx: number; sy: number; shiftX: number; lean: number; bob: number; brow: number};
const STILL: Take = {sx: 1, sy: 1, shiftX: 0, lean: 0, bob: 0, brow: 0};

/** What a figure's body does at this moment, from the acting context and its own seed. */
export const takeFor = (act: Acting | null, seed: number, carrying: boolean): Take => {
  if (!act) return STILL;
  const t = act.time;
  const phase = seed * 0.7;
  let sx = 1, sy = 1, bob = 0, brow = 0;
  // weight shift: a 5.2 s side to side with the lean trailing it (follow through)
  let shiftX = Math.sin(t * 2 * Math.PI / 5.2 + phase) * 7;
  let lean = Math.sin(t * 2 * Math.PI / 5.2 + phase - 0.6) * 1.5;
  // the beat nod, offset a frame per seed so a crowd does not move as one
  const sb = sinceBeat(t - (seed % 3) / 30, act.beats);
  bob += 5 * Math.exp(-sb / 0.13);
  for (const h of act.hits) {
    const s = t - h.t;
    if (s < -0.14 || s > 0.8) continue;
    if (s < 0) {   // the crouch before the hit
      const a = Math.sin(Math.PI / 2 * clamp((s + 0.14) / 0.14));
      sy -= 0.045 * a * h.strength; sx += 0.03 * a * h.strength; bob += 9 * a * h.strength;
      continue;
    }
    const q = squash(s, -0.06 * h.strength);   // negative amount: stretch up first, then settle
    sx *= q.sx; sy *= q.sy;
    bob -= 16 * ring(s, 2.6, 6) * h.strength;
    brow = Math.max(brow, 8 * Math.exp(-3 * s) * h.strength);
    lean += 2.4 * ring(s, 2.2, 5) * h.strength * (seed % 2 ? 1 : -1);
  }
  if (carrying) { sx = 1; sy = 1; shiftX *= 0.3; lean *= 0.3; }
  return {sx, sy, shiftX, lean, bob, brow};
};

/** A pose blend that winds back a little, travels, overshoots and settles (0..1 in, about 1.1 peak). */
export const actedBlend = (b: number): number => {
  if (b <= 0) return 0;
  if (b >= 1) return 1;
  if (b < 0.18) return -0.08 * Math.sin(Math.PI * b / 0.18);
  const u = (b - 0.18) / 0.82;
  const c = 1.9;
  return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2);
};

/**
 * THE WHIP CUT. In the first 0.22 s of a shot it slides in from the side with a horizontal smear
 * and settles past its mark; in the last 0.12 s of the shot before, it smears out the other way.
 * Odd cuts go left, even go right. Returns the slide, the blur and a little extra scale so the
 * edges of the plate never show.
 */
export const WHIP_IN = 0.2, WHIP_OUT = 0.1;
export const whip = (time: number, starts: number[]) => {
  let x = 0, blur = 0, scale = 0;
  const idx = starts.findIndex((s, i) => time >= s && (i === starts.length - 1 || time < starts[i + 1]));
  if (idx < 0) return {x, blur, scale};
  const since = time - starts[idx];
  const next = idx + 1 < starts.length ? starts[idx + 1] - time : Infinity;
  if (idx > 0 && since < WHIP_IN) {
    const dir = idx % 2 ? 1 : -1;
    const u = since / WHIP_IN;
    const settle = 1 - overshoot(since, 3.6, 9);   // 1 -> slightly past 0 -> 0
    x += dir * 120 * settle;
    blur += 30 * Math.pow(1 - u, 3);
    scale += 0.12 * Math.pow(1 - u, 2);
  }
  if (next < WHIP_OUT) {
    const dir = (idx + 1) % 2 ? 1 : -1;
    const u = 1 - next / WHIP_OUT;
    x -= dir * 110 * u * u;
    blur += 26 * u * u * u;
    scale += 0.12 * u * u;
  }
  return {x, blur, scale};
};

/** The SVG filter that makes a horizontal smear. One per blur value so each frame names its own. */
export const MotionBlurDefs: React.FC<{id: string; blur: number}> = ({id, blur}) => (
  <svg width={0} height={0} style={{position: 'absolute'}} aria-hidden>
    <filter id={id} x="-10%" y="-2%" width="120%" height="104%" colorInterpolationFilters="sRGB">
      <feGaussianBlur stdDeviation={`${blur.toFixed(1)} 0`} edgeMode="duplicate" />
    </filter>
  </svg>
);

/**
 * ATMOSPHERE. Depth a flat plate does not have: far dust at 0.4 of the camera's drift, near bokeh
 * at 1.7 times it, two light shafts sweeping from the key side, a light pulse on every beat, and a
 * ring of light blooming out of the frame's centre on each hit.
 */
export const Atmosphere: React.FC<{frame: number; fps: number; camX: number; camY: number; tint: string;
  beatPulse: number; hitGlow: number; wall?: boolean}> = ({frame, fps, camX, camY, tint, beatPulse, hitGlow, wall}) => {
  const t = frame / fps;
  const far = Array.from({length: 26}, (_, i) => {
    const sx = (jitter(i * 3 + 1) * 0.5 + 0.5) * 1080, sy = (jitter(i * 3 + 2) * 0.5 + 0.5) * 1500 + 120;
    const r = 2.2 + 2.6 * (jitter(i * 3 + 3) * 0.5 + 0.5);
    const x = ((sx + t * (8 + i % 5 * 3) + camX * 0.4) % 1120 + 1120) % 1120 - 20;
    const y = sy + 18 * Math.sin(t * 0.6 + i) + camY * 0.4;
    const tw = 0.35 + 0.35 * Math.sin(t * 1.3 + i * 2.1);
    return <circle key={i} cx={x} cy={y} r={r} fill="#fffbe8" opacity={tw * (wall ? 0.35 : 0.7)} />;
  });
  const near = Array.from({length: 7}, (_, i) => {
    const sx = (jitter(i * 5 + 40) * 0.5 + 0.5) * 1080, sy = (jitter(i * 5 + 41) * 0.5 + 0.5) * 1700 + 100;
    const r = 46 + 60 * (jitter(i * 5 + 42) * 0.5 + 0.5);
    const x = ((sx - t * (14 + i * 4) + camX * 1.7) % 1300 + 1300) % 1300 - 110;
    const y = sy + 30 * Math.sin(t * 0.35 + i * 1.3) + camY * 1.7;
    return <circle key={i} cx={x} cy={y} r={r * (1 + 0.06 * beatPulse)} fill="url(#studio-bokeh)"
      opacity={(wall ? 0.12 : 0.24) + 0.08 * beatPulse} />;
  });
  const sweep = Math.sin(t * 0.21);
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      {!wall && (
        <div style={{position: 'absolute', inset: -200, mixBlendMode: 'screen', opacity: 0.22 + 0.08 * beatPulse,
          transform: `rotate(${-24 + 6 * sweep}deg) translateX(${sweep * 60}px)`,
          background: `repeating-linear-gradient(90deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 150px, ${tint} 230px, rgba(0,0,0,0) 330px, rgba(0,0,0,0) 520px)`,
          maskImage: 'linear-gradient(180deg, #000 0%, rgba(0,0,0,.6) 40%, rgba(0,0,0,0) 75%)',
          WebkitMaskImage: 'linear-gradient(180deg, #000 0%, rgba(0,0,0,.6) 40%, rgba(0,0,0,0) 75%)'}} />
      )}
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen'}}>
        <defs>
          <radialGradient id="studio-bokeh">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.9} />
            <stop offset="55%" stopColor={tint} stopOpacity={0.45} />
            <stop offset="100%" stopColor={tint} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="studio-ring">
            <stop offset="70%" stopColor={tint} stopOpacity={0} />
            <stop offset="88%" stopColor="#ffffff" stopOpacity={0.55} />
            <stop offset="100%" stopColor={tint} stopOpacity={0} />
          </radialGradient>
        </defs>
        {far}
        {near}
        {hitGlow > 0.02 && (
          <circle cx={540} cy={900} r={260 + 900 * (1 - hitGlow)} fill="url(#studio-ring)" opacity={hitGlow * 0.8} />
        )}
      </svg>
    </div>
  );
};

/**
 * COUNT UP. A number that counts to its value with an overshoot ease instead of sitting on a card.
 * `at` and `t` are seconds on the same clock. Keeps the target's decimals and any prefix or suffix.
 */
export const CountUp: React.FC<{value: number; t: number; at?: number; dur?: number; prefix?: string;
  suffix?: string; decimals?: number; style?: React.CSSProperties}> = ({
  value, t, at = 0, dur = 0.9, prefix = '', suffix = '', decimals = 0, style,
}) => {
  const s = t - at;
  const u = clamp(s / dur);
  const eased = 1 - Math.pow(1 - u, 3);
  const n = value * eased;
  const sq = squash(s - dur, 0.1);
  return (
    <span style={{display: 'inline-block', transform: `scale(${sq.sx}, ${sq.sy})`, transformOrigin: '50% 90%',
      fontVariantNumeric: 'tabular-nums', ...style}}>
      {prefix}{n.toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals})}{suffix}
    </span>
  );
};

/**
 * DRAW ON. An SVG path that draws itself from 0 to its full length with an ease-out, the way an
 * explainer draws an arrow or a chart line. `length` is the path length in user units (an
 * overestimate is fine).
 */
export const DrawOn: React.FC<{d: string; t: number; at?: number; dur?: number; length?: number;
  stroke?: string; width?: number}> = ({d, t, at = 0, dur = 0.7, length = 2000, stroke = '#2a2156', width = 10}) => {
  const u = clamp((t - at) / dur);
  const eased = 1 - Math.pow(1 - u, 3);
  return (
    <path d={d} fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round"
      strokeDasharray={length} strokeDashoffset={length * (1 - eased)} />
  );
};
