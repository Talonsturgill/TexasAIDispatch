#!/usr/bin/env node
// =============================================================================
// TRUE SCALE, MEASURED OFF THE DRAWING rather than read out of the source.
//
// THE DEFECT THIS EXISTS FOR. `scale_check.py` reads TSX and catches the whole
// -component failures: a fit against a missing key, a metre entry nothing draws,
// a fit result multiplied by something that cancels the metre conversion. What it
// structurally cannot see is whether the thing that came out is the right SIZE,
// because that depends on path coordinates it does not evaluate.
//
// Three components shipped wrong and every gate was green:
//
//   a marching band fitted on a SOUSAPHONE and then multiplied by 0.16, which
//   cancelled the conversion and rendered every member 13 cm tall. The drum major
//   stood ankle high on any cast member sharing the plane.
//
//   a comal fitted on an ICE CREAM CART's entry, rendering a 0.92 m tortilla,
//   wider than the cook's shoulders, under a review sheet label reading 30 cm.
//
//   a raspa cup on the same borrowed entry at 1.03 m, and scaling QUADRATICALLY,
//   because every path coordinate is already a multiple of h.
//
// So this renders each one and reads the emitted scale back out of the markup,
// multiplies by the local span the component actually draws, and converts to
// metres. A drawing nobody has measured is not known to be right.
//
// Usage:
//   node tests/true_scale.mjs              measure the library
//   node tests/true_scale.mjs --self-test  prove the measurement can go red
// =============================================================================

import {build} from 'esbuild';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

let failures = 0;
const ok = (label, cond, detail = '') => {
  if (cond) console.log(`  ok   ${label}`);
  else { failures++; console.log(`  FAIL ${label}${detail ? `\n       ${detail}` : ''}`); }
};

/** Every `scale(k)` a rendered document emits, in document order. */
export function scalesIn(markup) {
  return [...markup.matchAll(/scale\(([-\d.]+)\)/g)].map((m) => parseFloat(m[1]));
}

/** Draw units to metres. One metre constant, read from the engine, never restated. */
export const metres = (local, k, M) => (local * k) / M;

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = await mkdtemp(path.join(tmpdir(), 'truescale-'));
try {
  const outfile = path.join(dir, 'probe.cjs');
  await build({
    entryPoints: [path.join(here, 'true_scale_probe.tsx')],
    bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic',
    outfile, logLevel: 'error',
  });
  const P = createRequire(import.meta.url)(outfile);

  if (process.argv.includes('--self-test')) {
    ok('a scale is read out of markup', scalesIn('<g transform="scale(2.5)">')[0] === 2.5);
    ok('every scale is read, in order',
       JSON.stringify(scalesIn('scale(1) scale(3) scale(0.5)')) === '[1,3,0.5]');
    ok('markup with no scale reads as empty', scalesIn('<g/>').length === 0);
    ok('draw units convert to metres', Math.abs(metres(610, 1, 610 / 1.7) - 1.7) < 1e-9);
    ok('...and a doubled scale doubles the metres',
       Math.abs(metres(610, 2, 610 / 1.7) - 3.4) < 1e-9);
    // THE MEASUREMENT CAN GO RED. The band's old code is replayed exactly.
    const bad = P.oldBandScale();
    ok(`the band's pre-fix scale measures 13 cm and is refused (${bad.toFixed(3)} m)`,
       bad < 0.2);
    console.log(failures === 0 ? '\ntrue scale self-test: all passed'
                               : `\ntrue scale self-test: ${failures} FAILED`);
    process.exit(failures === 0 ? 0 : 1);
  }

  for (const r of P.measurements()) {
    const within = r.value >= r.lo && r.value <= r.hi;
    ok(`${r.what} measures ${r.value.toFixed(3)} m`, within,
       `expected ${r.lo} to ${r.hi} m. ${r.why}`);
  }
  console.log(failures === 0 ? '\ntrue scale: all measured right'
                             : `\ntrue scale: ${failures} FAILED`);
  process.exit(failures === 0 ? 0 : 1);
} finally {
  await rm(dir, {recursive: true, force: true});
}
