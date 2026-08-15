#!/usr/bin/env node
// =============================================================================
// TYPE FIT — text that has a box has to be inside it.
//
// THE DEFECT THIS EXISTS FOR. `HandsetAlert` drew "FLASH FLOOD WARNING" as one line
// at font size 9 inside a panel 70 units wide. The string is about 111 units, so on
// the one beat this show has about an emergency message, the message ran off the
// glass. The body line went with it.
//
// It shipped through every gate the repo has. `tsc` sees a string. `engine_lint`
// reads colour literals. `scale_check` and `true_scale` measure drawings and treat
// text as an opaque node. **Nothing in this repo had ever read a character.**
//
// TWO THINGS, and the first is what makes the second worth believing.
//
//   THE ESTIMATE ERRS LONG. `lib/type.ts` adds up per-class advance widths, and the
//   class numbers were set from ink measured off a real render at font size 30. Those
//   measurements are the fixtures below. If a change makes the estimator optimistic
//   about any real string, this fails, and every fit check downstream is worthless
//   the moment that stops being true.
//
//   THE REAL STRINGS FIT. Every headline and body this repo passes to HandsetAlert is
//   run through the same layout the drawing uses, and no line may exceed the panel.
//   The strings are read out of the TSX rather than restated here, because a fixture
//   copy of the product is a fixture that goes stale.
//
// WHAT IT CANNOT DO, said plainly. The engine asks for `Georgia, serif` and this repo
// ships no font, so the renderer substitutes whatever the machine has and these
// numbers came from that substitute. A proportional estimate is also under-count for
// a pathological string of capital Ms. Wrapping is what makes both survivable: a bad
// estimate moves a line break, where the hand-set font size it replaced moved text
// off the edge.
//
// Usage:
//   node tests/type_fit.mjs              check the strings the repo ships
//   node tests/type_fit.mjs --self-test  prove the estimate errs long, and can go red
// =============================================================================

import {build} from 'esbuild';
import {mkdtemp, rm, readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

let failures = 0;
const ok = (label, cond, detail = '') => {
  if (cond) console.log(`  ok   ${label}`);
  else { failures++; console.log(`  FAIL ${label}${detail ? `\n       ${detail}` : ''}`); }
};

// INK MEASURED OFF A REAL RENDER at font size 30, one row per string. These are the
// calibration, and the estimator is only allowed to sit above them.
const MEASURED = [
  {s: 'FLASH FLOOD WARNING', bold: true, px: 369},
  {s: 'FLASH FLOOD', bold: true, px: 213},
  {s: 'WARNING', bold: true, px: 147},
  {s: 'CO-OP', bold: true, px: 96},
  {s: 'Move to higher ground now.', bold: false, px: 340},
  {s: 'Move to higher', bold: false, px: 185},
  {s: 'ground now.', bold: false, px: 148},
  {s: 'nnnnnnnnnn', bold: false, px: 149},
];

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..');
const dir = await mkdtemp(path.join(tmpdir(), 'typefit-'));
try {
  const outfile = path.join(dir, 'probe.cjs');
  await build({
    entryPoints: [path.join(here, 'type_fit_probe.tsx')],
    bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic',
    outfile, logLevel: 'error',
  });
  const P = createRequire(import.meta.url)(outfile);

  if (process.argv.includes('--self-test')) {
    for (const m of MEASURED) {
      const est = P.widthOf(m.s, 30, m.bold);
      ok(`${JSON.stringify(m.s).slice(0, 30)} estimates ${est.toFixed(0)} px against ${m.px} measured`,
         est >= m.px, 'the estimate is UNDER the ink, so every fit check below is worthless');
    }
    // ...and not so long that it wraps everything to one word per line.
    const worst = Math.max(...MEASURED.map((m) => P.widthOf(m.s, 30, m.bold) / m.px));
    ok(`the longest over-estimate is ${worst.toFixed(2)}x, which is close enough to be useful`,
       worst < 1.35, `${worst.toFixed(2)}x wraps text far earlier than it needs to`);

    ok('a string that fits stays on one line',
       P.wrapToWidth('WARNING', 58, 9, true).length === 1);
    ok('a string that does not fit is broken at a space',
       P.wrapToWidth('FLASH FLOOD WARNING', 58, 9, true).length === 3);
    ok('an unbreakable word is kept whole and REPORTED rather than silently cut',
       P.overflows('ANTIDISESTABLISHMENTARIANISM', 58, 9, true).length === 1);
    ok('empty text is no lines rather than a crash', P.wrapToWidth('', 58, 9).length === 1);

    // THE MEASUREMENT CAN GO RED. The shipped layout is replayed: one line, no wrap.
    const before = P.widthOf('FLASH FLOOD WARNING', 9, true);
    ok(`the pre-fix banner needed ${before.toFixed(0)} units in a 58 unit panel`, before > 58);
    ok('...and the panel now holds every line it is given',
       P.overflows('FLASH FLOOD WARNING', P.BANNER_INNER, 9, true).length === 0);

    console.log(failures === 0 ? '\ntype fit self-test: all passed'
                               : `\ntype fit self-test: ${failures} FAILED`);
    process.exit(failures === 0 ? 0 : 1);
  }

  // ---- the strings the repo actually passes, read out of the source.
  const sheets = path.join(repo, 'video-engine', 'src', 'ApplicationSheets.tsx');
  const src = await readFile(sheets, 'utf8');
  const calls = [...src.matchAll(/<Water\.HandsetAlert\b[\s\S]*?\/>/g)].map((m) => m[0]);
  if (calls.length === 0) {
    console.log('  FAIL no HandsetAlert call was found, so this checker read nothing at all');
    process.exit(1);
  }
  for (const call of calls) {
    const headline = /headline="([^"]*)"/.exec(call)?.[1];
    const body = /body="([^"]*)"/.exec(call)?.[1];
    const b = P.alertBanner(headline, body);
    const over = [...b.head, ...b.body].filter(
      (l, i) => P.widthOf(l, i < b.head.length ? 9 : 7.4, i < b.head.length) > P.BANNER_INNER);
    ok(`${JSON.stringify(headline ?? '(none)')} lays out in ${b.head.length + b.body.length} `
       + `line(s) inside the panel`, over.length === 0, `over: ${JSON.stringify(over)}`);
    // A BANNER THAT GROWS PUSHES THE LOCK SCREEN DOWN. The bound is not the glass,
    // which a 13 line banner clears while swamping the phone, but the home indicator:
    // the furniture has to still have somewhere to be. Both numbers come from the
    // component, so this cannot pass while the picture collides.
    ok(`...and the furniture ends at ${b.furnitureFoot.toFixed(1)}, above the home bar `
       + `at ${P.HOME_BAR}`, b.furnitureFoot < P.HOME_BAR,
       'the banner has outgrown the phone and the lock screen is drawn through it');
  }

  console.log(failures === 0 ? '\ntype fit: every boxed string is inside its box'
                             : `\ntype fit: ${failures} FAILED`);
  process.exit(failures === 0 ? 0 : 1);
} finally {
  await rm(dir, {recursive: true, force: true});
}
