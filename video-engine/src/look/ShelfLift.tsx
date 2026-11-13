import React from 'react';
import {LIGHTS, LIGHT_DEFAULT, RegionLight} from '../lib/lighting';
import type {Light, RegionName} from '../lib/lighting';

/**
 * THE SHELF LIFT (November 13th, 2026). What a library drawing gets on a v2 board, with no redraw.
 *
 * Three hundred drawings in src/lib were drawn in the old idiom and older films replay their exact
 * bytes, so they cannot change. On a v2 board this lifts all of them at once, from outside.
 *
 *  1. ROUND. A scoped stylesheet sets round joins and round caps on every stroke in the frame. CSS
 *     outranks an SVG presentation attribute, so a mitred corner drawn anywhere in the library comes
 *     out round.
 *  2. HUE-TINTED INK. The library's ink is one near-black (`INK`, about five hundred strokes) plus a
 *     few pure blacks. Attribute selectors repaint exactly those strokes a deep violet, the colour
 *     `look/color.ts` `line` gives a mid-value fill, so outlines stop reading as printed clip art.
 *  3. A STRONGER KEY. Library drawings shade through `useLight()`. `ShelfLight` hands them their
 *     region's own light with the key lifted and the shade deepened, so forms carry more volume.
 *
 * Deterministic and outside src/lib, so every v1 board still renders from its exact bytes.
 */
export const SHELF_CLASS = 'v2shelf';
export const SHELF_INK = '#2a2156';

const STROKES = 'path, polyline, polygon, line, rect, circle, ellipse';
const css = `.${SHELF_CLASS} :is(${STROKES}) { stroke-linejoin: round; stroke-linecap: round; }
.${SHELF_CLASS} [stroke="#101423"], .${SHELF_CLASS} [stroke="#000"], .${SHELF_CLASS} [stroke="#000000"],
.${SHELF_CLASS} [stroke="black"] { stroke: ${SHELF_INK}; }`;

/** The stylesheet. Mount once inside the element that carries `SHELF_CLASS`. */
export const ShelfStyle: React.FC = () => <style>{css}</style>;

/** A region's light with more key and deeper shade, the v2 way. */
export const liftLight = (base: Light): Light => ({
  ...base,
  keyLift: Math.min(0.32, base.keyLift * 1.4),
  shadeDrop: Math.min(0.34, base.shadeDrop * 1.25),
});

export const ShelfLight: React.FC<{region?: string; children: React.ReactNode}> = ({region, children}) => {
  const base = region && region in LIGHTS ? LIGHTS[region as RegionName] : LIGHT_DEFAULT;
  return <RegionLight light={liftLight(base)}>{children}</RegionLight>;
};
