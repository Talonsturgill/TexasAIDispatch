import React from 'react';
import {useUid} from './uid';

// =============================================================================
// LIGHTING / SHADOW / TEXTURE — the depth engine, lit by REGION.
// -----------------------------------------------------------------------------
// The colour maths, the four-stop ramp, the rim, the contact shadow and the grade
// are PORTED VERBATIM from the sibling engine. They are correct, they were paid
// for across dozens of shipped films, and rewriting them to look original would
// throw away the only part of a port that is already right. Where a comment below
// records a defect, that defect happened, and the number in it is load-bearing.
//
// WHAT IS NOT PORTED IS THE LIGHT ITSELF.
//
// The sibling has ONE global key: a low dawn sun, screen-left, warm. That is a
// correct decision for a place with a long low sun and one signature hour, and it
// is the wrong decision here. Texas does not have one light. It has hard vertical
// noon on the High Plains, milky humid glare on the Gulf, slate under a blue
// norther, dust-brown in a Panhandle spring, and, in the Hill Country, limestone
// that bounces light UP into the shadows so shade there is brighter and cooler
// than anywhere else in the state.
//
// knowledge/texas/REGIONS.md is the source, and its first law is the reason this
// module is shaped this way: a Texan forgives a stylized drawing and does not
// forgive being told they live somewhere they don't. One global key would make
// every region the same place.
//
// So `LIGHT` is a REGIONAL LOOKUP with a default, `tones()` takes an optional
// light, and scenes wrap their world in <RegionLight region="..."> once. Nothing
// mutates: a render is deterministic or it cannot be reviewed.
// =============================================================================

export const INK = '#101423';

export interface Light {
  /** unit vector pointing TOWARD the light source. y is negative for "above". */
  dir: {x: number; y: number};
  key: string;      // the direct highlight
  fill: string;     // the bounce into the shadow side
  rim: string;      // the bright contour
  keyLift: number;  // how far key/shade push from base, in HSL lightness
  coreDrop: number;
  shadeDrop: number;
}

// ---------------------------------------------------------------- the ten lights
// One per region in knowledge/texas/REGIONS.md. The three fields that carry the
// difference are `dir` (how high the sun is), `fill` (what the shadow side picks
// up) and `shadeDrop` (how deep a shadow gets before the air fills it in).
//
// A humid region has a SMALL shadeDrop because the air fills the shadow. A clear
// dry region has a large one. That single relationship is most of why a Gulf frame
// and a Trans-Pecos frame read as different places even at the same hue.
export const LIGHTS: Record<string, Light> = {
  // High Plains — enormous sky, sun high and unfiltered, shadows short and hard.
  high_plains: {
    dir: {x: -0.18, y: -0.98}, key: '#fff3d6', fill: '#c2cddd', rim: '#fffaf0',
    keyLift: 0.17, coreDrop: 0.05, shadeDrop: 0.19,
  },
  // Rolling Plains — red beds take the light warm, so the shade side goes violet.
  rolling_plains: {
    dir: {x: -0.34, y: -0.94}, key: '#ffe9c0', fill: '#b7a2b8', rim: '#fff2dd',
    keyLift: 0.16, coreDrop: 0.05, shadeDrop: 0.18,
  },
  // Cross Timbers — broken oak over prairie, so the light is dappled where the
  // timber is. Mid everything; this is the state's most neutral light.
  cross_timbers: {
    dir: {x: -0.38, y: -0.92}, key: '#ffeecb', fill: '#a8b6c6', rim: '#fff5e4',
    keyLift: 0.15, coreDrop: 0.05, shadeDrop: 0.16,
  },
  // Blackland Prairie — open and humid. Summer light goes milky by afternoon.
  blackland: {
    dir: {x: -0.30, y: -0.95}, key: '#fff0d8', fill: '#b9c4d2', rim: '#fff8ec',
    keyLift: 0.14, coreDrop: 0.04, shadeDrop: 0.14,
  },
  // Post Oak Savannah — the gentlest light in the state, filtered through open
  // canopy.
  post_oak: {
    dir: {x: -0.40, y: -0.91}, key: '#ffeecd', fill: '#aebfae', rim: '#fff6e6',
    keyLift: 0.14, coreDrop: 0.04, shadeDrop: 0.15,
  },
  // Piney Woods — closed canopy. The ONLY region where light comes down in
  // columns rather than across, so the direction is near vertical and the fill is
  // green from the canopy bounce.
  piney_woods: {
    dir: {x: -0.10, y: -0.99}, key: '#fdf0cf', fill: '#8aa07f', rim: '#fff7e0',
    keyLift: 0.15, coreDrop: 0.06, shadeDrop: 0.20,
  },
  // Gulf Prairies and Marshes — humid, hazy, high glare, sky often white rather
  // than blue. The smallest shadeDrop in the set: the air fills every shadow.
  gulf: {
    dir: {x: -0.24, y: -0.97}, key: '#fffaf0', fill: '#cdd6dc', rim: '#ffffff',
    keyLift: 0.13, coreDrop: 0.03, shadeDrop: 0.11,
  },
  // South Texas Plains — hard, bright, dusty. Heat shimmer is constant.
  south_texas: {
    dir: {x: -0.26, y: -0.96}, key: '#ffeec2', fill: '#c0b39a', rim: '#fff6d8',
    keyLift: 0.17, coreDrop: 0.05, shadeDrop: 0.18,
  },
  // Edwards Plateau — THE DISTINCTIVE ONE. Limestone bounces light UP into the
  // shadows, so the fill is bright and cool and the shadeDrop is small despite the
  // air being clear. Almost nobody draws this and it is the region's whole tell.
  hill_country: {
    dir: {x: -0.36, y: -0.93}, key: '#fff2d4', fill: '#d6dee6', rim: '#fffaea',
    keyLift: 0.16, coreDrop: 0.04, shadeDrop: 0.12,
  },
  // Trans-Pecos — the cleanest air in Texas. Enormous visual range, long alpenglow,
  // and the deepest shadows in the set because nothing fills them.
  trans_pecos: {
    dir: {x: -0.48, y: -0.88}, key: '#ffd9a8', fill: '#6d7fa4', rim: '#ffe9c8',
    keyLift: 0.18, coreDrop: 0.06, shadeDrop: 0.24,
  },
};

export type RegionName = keyof typeof LIGHTS;

// ---------------------------------------------------------------- weather overrides
// Not a region but a condition, applied on top. The vernacular doc names four
// Texas lights and two of them are weather rather than place: the blue norther's
// slate, and the spring dust that hazes the low sky brown.
export const WEATHER: Record<string, Partial<Light>> = {
  norther: {key: '#dfe6ef', fill: '#8e9bab', rim: '#eef3f8', keyLift: 0.09, shadeDrop: 0.12},
  dust:    {key: '#f3d9a6', fill: '#b9a488', rim: '#f8e6c2', keyLift: 0.11, shadeDrop: 0.13},
  overcast:{key: '#e8e6e0', fill: '#a9adb2', rim: '#f2f1ee', keyLift: 0.07, shadeDrop: 0.09},
  night:   {key: '#9fb6d8', fill: '#2b3a52', rim: '#c9dcf5', keyLift: 0.10, shadeDrop: 0.26},
};

/** The default when a scene has not declared a region. Deliberately the most
 *  neutral light in the set rather than the prettiest one: an undeclared scene
 *  should look unremarkable, not accidentally like Big Bend. */
export const LIGHT_DEFAULT: Light = LIGHTS.cross_timbers;

const LightContext = React.createContext<Light>(LIGHT_DEFAULT);

/** Wrap a scene's world once. Everything inside shades to this region's sun. */
export const RegionLight: React.FC<{
  region?: RegionName; weather?: keyof typeof WEATHER; light?: Light;
  children: React.ReactNode;
}> = ({region, weather, light, children}) => {
  const base = light ?? (region ? LIGHTS[region] : LIGHT_DEFAULT);
  const value = weather ? {...base, ...WEATHER[weather]} : base;
  return <LightContext.Provider value={value}>{children}</LightContext.Provider>;
};

export const useLight = (): Light => React.useContext(LightContext);

/** Back-compat alias so ported modules that reference a single LIGHT still read.
 *  New code should take a light from useLight() or pass one explicitly. */
export const LIGHT = LIGHT_DEFAULT;

// ------------------------------------------------------------- color utilities
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0, s = 0; const l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l];
}
function hslToHex(h: number, s: number, l: number): string {
  let r: number, g: number, b: number;
  if (s === 0) { r = g = b = l; } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3);
  }
  return rgbToHex(r * 255, g * 255, b * 255);
}

export interface Tones {key: string; base: string; core: string; shade: string; }

// Derive a consistent 4-stop shading ramp from ONE base color. Key warms slightly,
// shade cools slightly, so forms don't just get lighter and darker, they get a
// temperature shift like real lighting.
export function tones(base: string, light: Light = LIGHT_DEFAULT): Tones {
  const [h, s, l] = rgbToHsl(...hexToRgb(base));
  const warm = (dh: number) => (h + dh + 1) % 1;
  return {
    key: hslToHex(warm(-0.015), Math.min(1, s * 0.92), Math.min(1, l + light.keyLift)),
    base,
    core: hslToHex(h, s, Math.max(0, l - light.coreDrop)),
    shade: hslToHex(warm(0.02), Math.min(1, s * 1.05), Math.max(0, l - light.shadeDrop)),
  };
}

// PALE-SURFACE TONES. tones() multiplies saturation by 1.05 on the shade stop, which is
// right for a mid-value base and wrong for a near-white one. A near-white tint sits at
// almost no lightness headroom, so the shadeDrop lands on a vivid colour and the surface
// reads as coloured glass instead of a white object with a shadow on it. Real white
// surfaces do pick up a slightly cooler, slightly more saturated shadow, just an order of
// magnitude less than that.
//
// THIS MATTERS MORE HERE THAN IT DID IN THE SOURCE. Alaska's pale surfaces are ice and
// snow. Texas's are limestone, caliche, galvanized steel, a white water tower, a
// tilt-wall data centre and a bleached sky, and they are in almost every frame we shoot.
export function paleTones(base: string, light: Light = LIGHT_DEFAULT): Tones {
  const [h, s, l] = rgbToHsl(...hexToRgb(base));
  // 1.0 at l=0.80 and below, falling to ~0.25 at pure white
  const damp = Math.max(0.25, Math.min(1, (1 - l) / 0.2));
  const warm = (dh: number) => (h + dh + 1) % 1;
  const sd = s * damp;
  return {
    key: hslToHex(warm(-0.015), Math.min(1, sd * 0.92), Math.min(1, l + light.keyLift * 0.4)),
    base,
    core: hslToHex(h, sd, Math.max(0, l - light.coreDrop)),
    shade: hslToHex(warm(0.02), Math.min(1, sd * 1.05), Math.max(0, l - light.shadeDrop * 0.8)),
  };
}

/** Hook forms of the two ramps, for components inside a RegionLight. */
export const useTones = (base: string) => tones(base, useLight());
export const usePaleTones = (base: string) => paleTones(base, useLight());

// ------------------------------------------------------------- form-shade gradient
// A linear gradient across a shape's bounding box, oriented to the light, ramping
// key -> base -> core -> shade.
//
// THE DEFAULT IS THE VALUE NOBODY SHOULD USE, WHICH IS WHY IT IS NOT 1.
//
// At softness 1 the key stop sits on one bbox corner and the shade stop on the
// opposite one, and for any shape that is not a rectangle those corners are OUTSIDE
// the shape. The form then only ever shows the two middle stops, which is the
// definition of flat. In the source engine this cost five separate review rounds,
// four of them citing "the characters read as flat clip-art next to harder-lit
// props" without anyone finding the cause.
//
// The evidence that 1 was always wrong is in the call sites: across 56 places where
// an author stopped and CHOSE a value, the range was 0.42 to 0.9 with a median of
// 0.7, and not one picked 1, while 62 call sites took the default. A default that
// every deliberate user overrides is not a default, it is a trap with a docstring.
// So the default is the median of what authors actually chose.
export const FormGradient: React.FC<{id: string; t: Tones; softness?: number; light?: Light}> = ({
  id, t, softness = 0.7, light,
}) => {
  const L = light ?? React.useContext(LightContext);
  const dx = L.dir.x, dy = L.dir.y;
  const x1 = (0.5 - dx * 0.5 * softness) * 100;
  const y1 = (0.5 + dy * 0.5 * softness) * 100; // svg y is down; light points up so the lit edge is high
  const x2 = (0.5 + dx * 0.5 * softness) * 100;
  const y2 = (0.5 - dy * 0.5 * softness) * 100;
  return (
    <linearGradient id={id} x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`}>
      <stop offset="0%" stopColor={t.key} />
      <stop offset="42%" stopColor={t.base} />
      <stop offset="78%" stopColor={t.core} />
      <stop offset="100%" stopColor={t.shade} />
    </linearGradient>
  );
};

/** Declare many gradients at once, keyed by name. */
export const FormGradients: React.FC<{bases: Record<string, string>; softness?: number}> = ({
  bases, softness,
}) => {
  const L = useLight();
  return (
    <>
      {Object.entries(bases).map(([id, base]) => (
        <FormGradient key={id} id={id} t={tones(base, L)} softness={softness} light={L} />
      ))}
    </>
  );
};

// ------------------------------------------------------------- rim light
export const RimLight: React.FC<{d: string; w?: number; color?: string; opacity?: number}> = ({
  d, w = 4, color, opacity = 0.7,
}) => {
  const L = useLight();
  return (
    <path d={d} fill="none" stroke={color ?? L.rim} strokeWidth={w} strokeLinecap="round"
      strokeLinejoin="round" opacity={opacity} style={{mixBlendMode: 'screen'}} />
  );
};

// ------------------------------------------------------------- contact shadow / AO
// A soft dark ellipse under a form, offset along the light direction so it falls
// opposite the light.
//
// THE REGIONAL PART: a shadow's LENGTH is a function of how high the sun is, and
// Texas noon is high. The offset scales with the light's horizontal component, so a
// High Plains midday shadow sits almost under the object and a Trans-Pecos evening
// shadow reaches. Nothing else has to change for that to read.
export const ContactShadow: React.FC<{
  cx: number; cy: number; rx: number; ry?: number; opacity?: number; blur?: number;
}> = ({cx, cy, rx, ry, opacity = 0.32, blur = 10}) => {
  const L = useLight();
  const id = useUid('cs');
  const offX = -L.dir.x * rx * 0.5;
  return (
    <g>
      <filter id={id} x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation={blur} />
      </filter>
      <ellipse cx={cx + offX} cy={cy} rx={rx} ry={ry ?? rx * 0.24} fill={INK} opacity={opacity}
        filter={`url(#${id})`} />
    </g>
  );
};

// ------------------------------------------------------------- material textures
// All deterministic geometry. No feTurbulence: a per-frame filter wrecks a long
// headless render, and these are cheap shapes that draw once per frame.
//
// THE SET IS TEXAS'S, NOT THE SOURCE'S. Alaska needs bark fiber and boreal foliage
// speckle. We need the surfaces our beat is actually made of.

/** Brushed metal — switchgear, tank walls, a stock trailer, a silo. */
export const BrushedMetal: React.FC<{x: number; y: number; w: number; h: number; opacity?: number}> = ({
  x, y, w, h, opacity = 0.16,
}) => (
  <g opacity={opacity}>
    {Array.from({length: Math.max(3, Math.floor(w / 9))}, (_, i) => {
      const px = x + (i + 0.5) * (w / Math.max(3, Math.floor(w / 9)));
      const a = 0.35 + ((i * 37) % 11) / 22;
      return <rect key={i} x={px} y={y} width={1.5} height={h} fill="#ffffff" opacity={a} />;
    })}
  </g>
);

/** Galvanized — the dull spangled zinc of a stock tank, a cattle guard, a windmill
 *  tower. Reads different from brushed metal because the marks are patches, not
 *  streaks, and it is the single most common metal in rural Texas. */
export const Galvanized: React.FC<{
  x: number; y: number; w: number; h: number; seed?: number; opacity?: number;
}> = ({x, y, w, h, seed = 1, opacity = 0.14}) => {
  const n = Math.max(6, Math.floor((w * h) / 900));
  return (
    <g opacity={opacity}>
      {Array.from({length: n}, (_, i) => {
        const k = (i * 2654435761 + seed * 40503) >>> 0;
        const px = x + ((k >>> 3) % 1000) / 1000 * w;
        const py = y + ((k >>> 13) % 1000) / 1000 * h;
        const r = 3 + ((k >>> 23) % 7);
        return <ellipse key={i} cx={px} cy={py} rx={r} ry={r * 0.72} fill="#ffffff"
          opacity={0.25 + ((k >>> 5) % 40) / 100} />;
      })}
    </g>
  );
};

/** Rust — the streak that runs DOWN from a fastener or a seam. Maintained but worn
 *  is the house rule, and this is what does most of the work of selling it. */
export const RustStreak: React.FC<{
  x: number; y: number; w: number; h: number; seed?: number; opacity?: number;
}> = ({x, y, w, h, seed = 1, opacity = 0.5}) => {
  const n = Math.max(2, Math.floor(w / 26));
  return (
    <g opacity={opacity}>
      {Array.from({length: n}, (_, i) => {
        const k = (i * 1103515245 + seed * 12345) >>> 0;
        const px = x + ((k >>> 7) % 1000) / 1000 * w;
        const len = h * (0.3 + ((k >>> 17) % 60) / 100);
        const wd = 2 + ((k >>> 11) % 4);
        return (
          <path key={i} d={`M${px} ${y} q${wd * 0.4} ${len * 0.5} ${wd * 0.1} ${len}`}
            stroke="#8a4a24" strokeWidth={wd} fill="none" strokeLinecap="round"
            opacity={0.35 + ((k >>> 19) % 45) / 100} />
        );
      })}
    </g>
  );
};

/** Caliche dust — the pale film that sits on the lower half of everything west of
 *  I-35. Paired with the truck rule: clean above the door handles, caked below. */
export const CalicheDust: React.FC<{
  x: number; y: number; w: number; h: number; opacity?: number;
}> = ({x, y, w, h, opacity = 0.34}) => {
  const id = useUid('cal');
  return (
    <g opacity={opacity}>
      <linearGradient id={id} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#cbb68f" stopOpacity="0" />
        <stop offset="55%" stopColor="#cbb68f" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#d8c6a2" stopOpacity="0.8" />
      </linearGradient>
      <rect x={x} y={y} width={w} height={h} fill={`url(#${id})`} />
    </g>
  );
};

/** Limestone — the Hill Country's ground and its buildings. Bedded, so the marks
 *  are horizontal courses with vertical joints that do not line up. */
export const Limestone: React.FC<{
  x: number; y: number; w: number; h: number; seed?: number; opacity?: number;
}> = ({x, y, w, h, seed = 1, opacity = 0.22}) => {
  const rows = Math.max(2, Math.floor(h / 26));
  return (
    <g opacity={opacity}>
      {Array.from({length: rows}, (_, r) => {
        const ry = y + (r + 1) * (h / rows);
        const k = (r * 2246822519 + seed * 668265263) >>> 0;
        const jitter = ((k >>> 9) % 100) / 100 * 3 - 1.5;
        return (
          <g key={r}>
            <line x1={x} y1={ry + jitter} x2={x + w} y2={ry + jitter} stroke={INK}
              strokeWidth={1.2} opacity={0.5} />
            <line x1={x + ((k >>> 15) % 1000) / 1000 * w} y1={ry - h / rows} x2={x + ((k >>> 15) % 1000) / 1000 * w}
              y2={ry} stroke={INK} strokeWidth={1} opacity={0.32} />
          </g>
        );
      })}
    </g>
  );
};

/** Mesquite canopy speckle — LOW, CROOKED, WIDE AND LACY, per the flora doc. Light
 *  comes through the whole crown, which is what separates it from a generic round
 *  tree and therefore what makes most of west Texas read correctly. */
export const MesquiteLace: React.FC<{
  cx: number; cy: number; rx: number; ry: number; dark: string; light: string;
  seed?: number; opacity?: number;
}> = ({cx, cy, rx, ry, dark, light, seed = 1, opacity = 0.9}) => {
  const n = Math.max(24, Math.floor((rx * ry) / 220));
  return (
    <g opacity={opacity}>
      {Array.from({length: n}, (_, i) => {
        const k = (i * 22695477 + seed * 1013904223) >>> 0;
        const a = ((k >>> 4) % 1000) / 1000 * Math.PI * 2;
        const rr = Math.sqrt(((k >>> 14) % 1000) / 1000);
        const px = cx + Math.cos(a) * rx * rr;
        const py = cy + Math.sin(a) * ry * rr;
        const s = 1.4 + ((k >>> 24) % 5) * 0.5;
        return <ellipse key={i} cx={px} cy={py} rx={s} ry={s * 0.55}
          fill={(k >>> 9) % 3 === 0 ? light : dark} opacity={0.55 + ((k >>> 6) % 40) / 100} />;
      })}
    </g>
  );
};

// ------------------------------------------------------------- the grade
// One full-frame finish per scene: vignette, bloom, grain, dither. The single
// biggest "expensive look" for the least cost, applied last.
//
// Grade LIGHTER than a flat engine when the scene is inside Stage3D: the depth
// already separates the hero, and a heavy vignette on top reads as a dark oval in
// the middle of the frame rather than as atmosphere.
export const GradeLayer: React.FC<{
  f: number; bloom?: number; vignette?: number; grain?: number; warmth?: number;
}> = ({f, bloom = 0.16, vignette = 0.24, grain = 0.05, warmth = 0.06}) => {
  const id = useUid('grade');
  // Grain drifts on a 3-frame cycle so it reads as film rather than as a static
  // overlay, and it is deterministic from f so a re-render is identical.
  const gx = (f % 3) * 7, gy = (f % 5) * 5;
  return (
    <g style={{pointerEvents: 'none'}}>
      <radialGradient id={`${id}v`} cx="50%" cy="46%" r="72%">
        <stop offset="55%" stopColor="#000000" stopOpacity="0" />
        <stop offset="100%" stopColor="#000000" stopOpacity={vignette} />
      </radialGradient>
      <rect x={0} y={0} width={1080} height={1920} fill={`url(#${id}v)`} />
      <rect x={0} y={0} width={1080} height={1920} fill="#ffd9a0" opacity={warmth}
        style={{mixBlendMode: 'overlay'}} />
      <rect x={0} y={0} width={1080} height={1920} fill="#ffffff" opacity={bloom * 0.25}
        style={{mixBlendMode: 'soft-light'}} />
      <g opacity={grain} transform={`translate(${gx} ${gy})`}>
        {Array.from({length: 220}, (_, i) => {
          const k = (i * 2654435761 + f * 40503) >>> 0;
          const px = ((k >>> 3) % 1100);
          const py = ((k >>> 13) % 1960);
          return <rect key={i} x={px} y={py} width={2} height={2} fill="#ffffff"
            opacity={((k >>> 23) % 60) / 100} />;
        })}
      </g>
    </g>
  );
};
