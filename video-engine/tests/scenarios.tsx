import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ELEMENTS, ELEMENT_NAMES, REQUIRED, Element, seedFor} from '../src/lib/registry';
import {Longhorn} from '../src/lib/fauna';

// =============================================================================
// THE SCENARIOS the paint-id test renders. Kept as TSX rather than generated as a
// string so they read as staging and so `tsc` sees them.
// =============================================================================

/** Minimal honest data for the elements that are made OF data. */
const FIXTURES: Record<string, Record<string, unknown>> = {
  conductor: {x1: 100, y1: 400, x2: 900, y2: 430},
  detections: {items: [
    {x: 100, y: 200, w: 90, h: 60, label: 'pumping unit', conf: 0.82, track: 1},
    {x: 260, y: 240, w: 70, h: 50, label: 'stock tank', conf: 0.41, track: 2},
  ]},
  mask: {cx: 400, cy: 500, rx: 120, ry: 80},
  sweep: {x: 60, y: 300, w: 900, h: 220, p: 0.5},
  plume: {x: 500, y: 700},
  readout: {x: 80, y: 120, rows: [['load', '78,412 MW']]},
  confidenceSpread: {x: 80, y: 900, values: [0.2, 0.5, 0.8]},
};

/**
 * EVERY placeable element, staged TWICE with no seed, in one document.
 *
 * Twice is the whole point. One of anything cannot collide with itself, and every
 * drawn thing in this library used to build its paint-server ids out of `seed`,
 * which carries a per-species default. The second one was painted with the first
 * one's gradient, and the only surface that would have shown it -- the fauna
 * sheet's herd row -- passes explicit seeds, so it could not.
 */
export function everyElementTwice(): string {
  const parts = ELEMENT_NAMES.map((name) => {
    const C = ELEMENTS[name];
    const fx = FIXTURES[name] ?? {};
    return (
      <g key={name}>
        <C frame={0} {...fx} />
        <C frame={0} {...fx} />
      </g>
    );
  });
  return renderToStaticMarkup(<svg width={1080} height={1920}>{parts}</svg>);
}

/** The reviewer's exact reproduction: two unseeded longhorns, two different hides. */
export function twoHides(): string {
  return renderToStaticMarkup(
    <svg><Longhorn frame={0} hide="#8a4a24" /><Longhorn frame={0} hide="#d9c39a" /></svg>);
}

/** Two identical board items at two addresses. Different seeds, so not twins. */
export function twoUnseededFromBoard(): string {
  return renderToStaticMarkup(
    <svg>
      <Element item={{kind: 'longhorn', x: 200, y: 900}} frame={0}
        at={{scene: 's1', plane: 0, item: 0}} />
      <Element item={{kind: 'longhorn', x: 600, y: 900}} frame={0}
        at={{scene: 's1', plane: 0, item: 1}} />
    </svg>);
}

/** A board seed always wins over the derived one. */
export function boardSeedWins(): string {
  return renderToStaticMarkup(
    <svg>
      <Element item={{kind: 'longhorn', x: 200, y: 900, seed: 77}} frame={0}
        at={{scene: 's1', plane: 0, item: 0}} />
      <Element item={{kind: 'longhorn', x: 600, y: 900, seed: 77}} frame={0}
        at={{scene: 's9', plane: 4, item: 3}} />
    </svg>);
}

/** Placing an element that is made of data, without the data. */
export function missingRequired(kind: string): string {
  return renderToStaticMarkup(
    <svg><Element item={{kind}} frame={0} at={{scene: 's1', plane: 0, item: 0}} /></svg>);
}

export const REQUIRED_KINDS = Object.keys(REQUIRED);
export const PLACEABLE = ELEMENT_NAMES.length;
export {seedFor};

/**
 * KNOWN-BAD markup for the self-test.
 *
 * The scanner is the thing being tested here, so it is handed a document with the
 * defect already in it. A checker that has never been shown going red is a checker
 * nobody has tested.
 */
export const PLANTED_DUPLICATE =
  '<svg>' +
  '<defs><linearGradient id="lh5_c"><stop stop-color="#8a4a24"/></linearGradient></defs>' +
  '<path fill="url(#lh5_c)"/>' +
  '<defs><linearGradient id="lh5_c"><stop stop-color="#d9c39a"/></linearGradient></defs>' +
  '<path fill="url(#lh5_c)"/>' +
  '</svg>';

export const PLANTED_DANGLING =
  '<svg><defs><linearGradient id="a1"/></defs><path fill="url(#a2)"/></svg>';
