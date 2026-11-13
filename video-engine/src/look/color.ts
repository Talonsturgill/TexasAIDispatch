/**
 * Colour helpers for look v2. Shade toward a deep violet and light toward a warm cream, never toward
 * black and white, so shadows keep their chroma. A shadow mixed toward black is the single biggest
 * reason a vector drawing reads muddy and printed.
 */
const hex = (c: string) => {
  const h = c.replace('#', '');
  const v = h.length === 3 ? h.split('').map((x) => x + x).join('') : h;
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
};
const out = (rgb: number[]) => '#' + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16)
  .padStart(2, '0')).join('');
export const mix = (a: string, b: string, t: number) => {
  const x = hex(a), y = hex(b);
  return out(x.map((v, i) => v + (y[i] - v) * t));
};
export const SHADE_TO = '#2b1d5e';
export const LIGHT_TO = '#fff4dc';
export const shade = (c: string, t = 0.32) => mix(c, SHADE_TO, t);
export const light = (c: string, t = 0.3) => mix(c, LIGHT_TO, t);
/** the outline colour for a fill: its own hue, much deeper. No black ink. */
export const line = (c: string) => mix(c, '#1a1236', 0.62);
