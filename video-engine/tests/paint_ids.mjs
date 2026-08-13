#!/usr/bin/env node
// =============================================================================
// PAINT-SERVER IDS AND PER-INSTANCE VARIATION, checked on rendered markup.
//
// THE DEFECT THIS EXISTS FOR. An SVG gradient, clip path or filter is referenced
// by DOCUMENT-GLOBAL id, and the browser silently takes the FIRST match. Every
// drawn thing in this library built its ids out of `seed`:
//
//     const uid = `lh${seed}`;              // Longhorn, seed defaults to 5
//
// so two longhorns staged without explicit distinct seeds both emitted
// `id="lh5_c"` and the second animal was painted with the first animal's coat.
// The tags collided ACROSS modules too: a whitetail and a civics water tower both
// used `wt`, so a deer and a tank at the same seed shared a gradient.
//
// WHY NOTHING CAUGHT IT. `tsc` is clean, because an id is a string. `engine_lint`
// reads colour literals. The fauna review sheet's herd row passes
// `seed={51 + i * 7}`, so THE ONE SURFACE THAT WOULD HAVE SHOWN IT CANNOT
// REPRODUCE IT -- and the board `Dispatch.tsx` renders makes `seed` optional, so
// unseeded duplicates went from unlikely to ordinary at the same moment.
//
// So this renders the library to markup and reads the markup. Two invariants:
//
//   NO ID IS DEFINED TWICE in one document.
//   EVERY url(#x) RESOLVES to an id defined in that document.
//
// plus the variation rules that make a herd a herd rather than one animal
// stamped twice, and the boundary check that a data-driven element placed
// without its data fails LOUD rather than computing NaN and drawing nothing.
//
// Usage:
//   node tests/paint_ids.mjs              run the checks
//   node tests/paint_ids.mjs --self-test  prove the scanner can go red
// =============================================================================

import {build} from 'esbuild';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';

let failures = 0;
const ok = (label, cond, detail = '') => {
  if (cond) {
    console.log(`  ok   ${label}`);
  } else {
    failures++;
    console.log(`  FAIL ${label}${detail ? `\n       ${detail}` : ''}`);
  }
};

// ---------------------------------------------------------------- the scanner
/**
 * Read a rendered document's paint servers.
 * @returns {{dupes: string[], dangling: string[], ids: string[], refs: string[]}}
 */
export function scanPaintServers(markup) {
  const ids = [...markup.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const refs = [...markup.matchAll(/url\(#([^)"']+)\)/g)].map((m) => m[1]);
  const seen = new Map();
  const dupes = [];
  for (const id of ids) {
    seen.set(id, (seen.get(id) ?? 0) + 1);
    if (seen.get(id) === 2) dupes.push(id);
  }
  const defined = new Set(ids);
  const dangling = [...new Set(refs.filter((r) => !defined.has(r)))];
  return {dupes, dangling, ids, refs};
}

/** Every stop colour PRESENT in a document, referenced or not. */
const stops = (markup) => [...markup.matchAll(/stop-color="([^"]+)"/g)].map((m) => m[1]);

/**
 * The stop colours the document actually PAINTS WITH.
 *
 * The difference is the whole defect. When two gradients share an id, both
 * definitions are still in the markup, so a naive "does this colour appear"
 * assertion passes on a document where one of the two colours is never drawn.
 * (It did, on the first version of this file, while the duplicate check beside it
 * was correctly red.) A browser resolves `url(#x)` to the FIRST `id="x"` in
 * document order and ignores the rest, so this resolves it the same way.
 */
export function paintedStops(markup) {
  const refs = [...new Set([...markup.matchAll(/url\(#([^)"']+)\)/g)].map((m) => m[1]))];
  const out = [];
  for (const ref of refs) {
    // the first definition wins, exactly as it does in a browser
    const at = markup.indexOf(` id="${ref}"`);
    if (at < 0) continue;
    const open = markup.lastIndexOf('<', at);
    const tag = /<([A-Za-z]+)/.exec(markup.slice(open, at))?.[1];
    if (!tag) continue;
    const close = markup.indexOf(`</${tag}>`, at);
    const body = close < 0 ? markup.slice(at, markup.indexOf('>', at)) : markup.slice(at, close);
    out.push(...[...body.matchAll(/stop-color="([^"]+)"/g)].map((m) => m[1]));
  }
  return out;
}

// ------------------------------------------------------------------ self-test
function selfTest(S) {
  console.log('paint-id scanner self-test');

  const dup = scanPaintServers(S.PLANTED_DUPLICATE);
  ok('a document that defines one id twice is REJECTED',
    dup.dupes.length === 1 && dup.dupes[0] === 'lh5_c', JSON.stringify(dup.dupes));

  const dangle = scanPaintServers(S.PLANTED_DANGLING);
  ok('a url(#x) with no matching id is REJECTED',
    dangle.dangling.length === 1 && dangle.dangling[0] === 'a2', JSON.stringify(dangle.dangling));

  const clean = scanPaintServers(
    '<svg><defs><linearGradient id="a1"/><linearGradient id="a2"/></defs>' +
    '<path fill="url(#a1)"/><path fill="url(#a2)"/></svg>');
  ok('a correct document is ACCEPTED',
    clean.dupes.length === 0 && clean.dangling.length === 0,
    JSON.stringify(clean));

  // A scanner that finds nothing in an empty string would pass the two rejection
  // cases above by accident. This is what proves it is reading anything at all.
  ok('the scanner reads ids rather than reporting an empty document',
    clean.ids.length === 2 && clean.refs.length === 2,
    `ids ${clean.ids.length} refs ${clean.refs.length}`);

  // paintedStops is the assertion that was WRONG the first time this file ran: it
  // asked whether a colour was present in the markup, and on a document with two
  // gradients sharing an id both colours are present while only one is drawn. So
  // the resolver is pinned against the planted duplicate rather than trusted.
  const painted = paintedStops(S.PLANTED_DUPLICATE);
  ok('a shared id paints ONLY the first definition, as a browser does',
    painted.includes('#8a4a24') && !painted.includes('#d9c39a'),
    `painted: ${painted.join(', ')}`);
  ok('and the second colour really is in the markup, so that was not a miss',
    stops(S.PLANTED_DUPLICATE).includes('#d9c39a'));

  // The seed derivation is the variety half, and a hash that returned a constant
  // would satisfy "different address, some seed" without giving a different one.
  const a = S.seedFor('s1', 0, 0);
  const b = S.seedFor('s1', 0, 1);
  const c = S.seedFor('s1', 0, 0);
  ok('the same address gives the same seed on every frame', a === c, `${a} vs ${c}`);
  ok('a different address gives a different seed', a !== b, `${a} vs ${b}`);
  ok('a different scene gives a different seed',
    S.seedFor('s1', 0, 0) !== S.seedFor('s2', 0, 0),
    `${S.seedFor('s1', 0, 0)} vs ${S.seedFor('s2', 0, 0)}`);

  // The whole point of adding the position inside the modulus rather than hashing
  // the whole address: this is EXHAUSTIVE, not a sample. An FNV hash of the address
  // string collided four times in the first two hundred draws.
  const everyPosition = new Set();
  for (let p = 0; p < 64; p++) for (let i = 0; i < 512; i++) everyPosition.add(S.seedFor('s1', p, i));
  ok('every addressable position in one scene has its own seed, all 32,768 of them',
    everyPosition.size === 64 * 512, `${everyPosition.size} distinct`);

  let threw = '';
  try { S.seedFor('s1', 0, 512); } catch (e) { threw = String(e.message); }
  ok('a position past the addressable range STOPS rather than wrapping onto another',
    threw.includes('addressable range'), threw || 'returned a seed');

  return failures;
}

// ------------------------------------------------------------------ the checks
function run(S) {
  console.log('paint-server ids, on rendered markup');

  const all = S.everyElementTwice();
  const scan = scanPaintServers(all);
  ok(`every placeable element staged twice: no id defined twice ` +
     `(${scan.ids.length} ids across ${S.PLACEABLE} placeable elements)`,
    scan.dupes.length === 0, `duplicated: ${scan.dupes.slice(0, 12).join(', ')}`);
  ok('every url(#x) resolves to an id in the same document',
    scan.dangling.length === 0, `dangling: ${scan.dangling.slice(0, 12).join(', ')}`);
  // The library must actually have emitted paint servers, or the two checks above
  // pass on an empty document. This is GATE_LESSONS lesson 1 applied to itself.
  ok('the render emitted paint servers at all', scan.ids.length > 40, `${scan.ids.length} ids`);

  console.log('the reviewer\'s reproduction');
  const hides = S.twoHides();
  const hs = scanPaintServers(hides);
  ok('two unseeded longhorns emit two distinct coat gradients',
    hs.dupes.length === 0, `duplicated: ${hs.dupes.join(', ')}`);
  const sc = paintedStops(hides);
  ok('and each is PAINTED with its own hide, resolving url(#x) as a browser does',
    sc.includes('#8a4a24') && sc.includes('#d9c39a'),
    `painted: ${[...new Set(sc)].slice(0, 8).join(', ')}` +
    (stops(hides).includes('#d9c39a') && !sc.includes('#d9c39a')
      ? ' -- the second hide is IN the document and never drawn' : ''));

  console.log('variation, so a herd is not one animal stamped twice');
  const board = S.twoUnseededFromBoard();
  const bs = scanPaintServers(board);
  ok('two unseeded board items emit distinct ids', bs.dupes.length === 0, bs.dupes.join(', '));
  const coats = [...new Set(paintedStops(board))];
  ok('and take different coats, because the address is the seed',
    coats.length > 4, `only ${coats.length} distinct painted colours`);

  const pinned = S.boardSeedWins();
  const pinnedCoats = paintedStops(pinned);
  const half = pinnedCoats.length / 2;
  ok('an explicit board seed still wins, so a pinned pair matches',
    JSON.stringify(pinnedCoats.slice(0, half)) === JSON.stringify(pinnedCoats.slice(half)),
    'two items with seed 77 at different addresses painted differently');

  console.log('an element made of data, placed without its data');
  for (const kind of S.REQUIRED_KINDS) {
    let threw = '';
    try {
      S.missingRequired(kind);
    } catch (e) {
      threw = String(e.message);
    }
    ok(`${kind} fails loud rather than drawing NaN`,
      threw.includes('missing') && threw.includes(kind),
      threw ? `threw the wrong thing: ${threw.slice(0, 90)}` : 'rendered silently');
  }

  return failures;
}

// ------------------------------------------------------------------ the driver
const here = path.dirname(new URL(import.meta.url).pathname);
const dir = await mkdtemp(path.join(tmpdir(), 'paintids-'));
try {
  // CJS, not ESM. `react-dom/server` reaches for node's `util` through a bare
  // `require`, which an ESM bundle turns into a thrown "dynamic require is not
  // supported" before a single component renders.
  const outfile = path.join(dir, 'scenarios.cjs');
  await build({
    entryPoints: [path.join(here, 'scenarios.tsx')],
    bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic',
    outfile, logLevel: 'error',
  });
  const S = createRequire(import.meta.url)(outfile);

  const selfing = process.argv.includes('--self-test');
  const n = selfing ? selfTest(S) : run(S);
  console.log(n === 0
    ? `paint-id ${selfing ? 'self-test' : 'check'}: all passed`
    : `paint-id ${selfing ? 'self-test' : 'check'}: ${n} FAILED`);
  process.exit(n === 0 ? 0 : 1);
} finally {
  await rm(dir, {recursive: true, force: true});
}
