#!/usr/bin/env node
// =============================================================================
// THE CAST ROSTER, AND THE TWO RULES ABOUT WHAT A PERSON HAS ON THEIR HEAD.
//
// THE DEFECT THIS EXISTS FOR. `headgearConflict()` and `seasonalHat()` are two
// carefully written, carefully documented functions in `lib/Character.tsx`, and
// a review found that NEITHER HAS A SINGLE CALL SITE anywhere in the repo. Not
// in Character itself, not in CastElement, not in a gate. The routine prompt
// says outright that `headgearConflict()` "refuses that pairing" and
// `ship_gate.py` said in a comment that it "guards the engine". Both sentences
// described a function nothing calls.
//
// That is worse than a missing check, because two documents and a gate comment
// all asserted the protection existed. The board-side half is now fixed in
// `ship_gate.py`, which resolves the hat off the actual placement through the
// roster. This is the engine-side half: the roster is DATA, a person editing it
// is one keystroke from putting a felt hat on FR coveralls, and the function
// written to catch exactly that was not reachable from anything.
//
// So the roster is now held to its own rule, every entry, every run.
//
//   NO ROSTER ENTRY PAIRS A BRIMMED HAT WITH SITE-WORK CLOTHING.
//   THE SEASONAL RULE IS TOTAL: every month resolves to felt or straw.
//
// A drawing nobody has looked at is not finished, and a rule nothing calls is
// not a rule.
//
// Usage:
//   node tests/cast_safety.mjs              hold the roster to the rules
//   node tests/cast_safety.mjs --self-test  prove the rules can go red
// =============================================================================

import {build} from 'esbuild';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

let failures = 0;
const ok = (label, cond, detail = '') => {
  if (cond) {
    console.log(`  ok   ${label}`);
  } else {
    failures++;
    console.log(`  FAIL ${label}${detail ? `\n       ${detail}` : ''}`);
  }
};

const here = path.dirname(fileURLToPath(import.meta.url));

function run(C) {
  const {CAST, headgearConflict, seasonalHat} = C;

  // The roster is real and whole. A parse that quietly returns three people would
  // pass every rule below by having almost nothing to check.
  ok(`the roster has a plausible number of people (${CAST.length})`, CAST.length >= 13,
     `only ${CAST.length} cast members were bundled`);
  ok('every member carries an id, an outfit and headgear',
     CAST.every((c) => c.id && c.outfit && c.headgear),
     JSON.stringify(CAST.filter((c) => !(c.id && c.outfit && c.headgear))));

  // THE SAFETY RULE, applied to every entry rather than described in a comment.
  const conflicts = CAST
    .map((c) => [c.id, headgearConflict(c.outfit, c.headgear)])
    .filter(([, reason]) => reason);
  ok('no roster entry wears a brimmed hat with site-work clothing',
     conflicts.length === 0,
     conflicts.map(([id, r]) => `${id}: ${r}`).join('\n       '));

  // The two the roster is most likely to get wrong, named so a future edit that
  // breaks them says which person changed rather than only that something did.
  const by = Object.fromEntries(CAST.map((c) => [c.id, c]));
  ok('the operator is in a hard hat over an FR hood, which is sour service',
     by.operator?.headgear === 'hard-hat-hood', String(by.operator?.headgear));
  ok('the farmer wears a gimme cap, not the cattle country straw next door',
     by.farmer?.headgear === 'gimme-cap', String(by.farmer?.headgear));

  // THE SEASONAL RULE IS TOTAL. Not "usually returns something": every month of
  // the year resolves, because a scene does not get to guess and an undefined
  // return would render as no hat at all.
  const months = Array.from({length: 12}, (_, i) => `2026-${String(i + 1).padStart(2, '0')}-15`);
  const hats = months.map(seasonalHat);
  ok('every month of the year resolves to a real hat',
     hats.every((h) => h === 'felt-hat' || h === 'straw-hat'), hats.join(','));
  ok('January is felt, and a straw working hat in January is simply wrong',
     seasonalHat('2026-01-15') === 'felt-hat', seasonalHat('2026-01-15'));
  ok('July is straw', seasonalHat('2026-07-15') === 'straw-hat', seasonalHat('2026-07-15'));
  ok('the year turns over exactly twice, so there is one straw season and one felt',
     hats.filter((h, i) => i > 0 && h !== hats[i - 1]).length === 2, hats.join(','));

  return failures;
}

function selfTest(C) {
  const {headgearConflict, seasonalHat} = C;

  // THE RULE CAN GO RED. Each of these is a pairing a person could type into the
  // roster in one keystroke.
  ok('a felt hat on FR coveralls is refused',
     Boolean(headgearConflict('fr-coveralls', 'felt-hat')));
  ok('a straw hat on FR coveralls is refused',
     Boolean(headgearConflict('fr-coveralls', 'straw-hat')));
  ok('a palm straw on line FR is refused', Boolean(headgearConflict('line-fr', 'palm-straw')));
  ok('a brimmed hat with scrubs is refused, because it is a costume',
     Boolean(headgearConflict('scrubs', 'straw-hat')));

  // AND IT STAYS QUIET WHERE IT SHOULD. A gate that refuses a correct drawing is
  // how a gate gets switched off.
  ok('a hard hat with pearl snaps is fine, that is a rancher at a construction site',
     headgearConflict('pearl-snaps', 'hard-hat') === null);
  ok('a straw hat with pearl snaps is fine, that is just a rancher',
     headgearConflict('pearl-snaps', 'straw-hat') === null);
  ok('a hard hat over an FR hood is the correct rig-floor pairing',
     headgearConflict('fr-coveralls', 'hard-hat-hood') === null);

  // The reason is actionable, not a boolean. Somebody has to be able to fix it.
  const why = headgearConflict('fr-coveralls', 'felt-hat') ?? '';
  ok('the refusal says what to wear instead', /hard hat/i.test(why), why);

  ok('the seasonal boundary is at the ends of the season, not mid-month',
     seasonalHat('2026-03-31') === 'felt-hat' && seasonalHat('2026-04-01') === 'straw-hat'
     && seasonalHat('2026-09-30') === 'straw-hat' && seasonalHat('2026-10-01') === 'felt-hat',
     [3, 4, 9, 10].map((m) => `${m}:${seasonalHat(`2026-${String(m).padStart(2, '0')}-15`)}`)
       .join(' '));

  return failures;
}

const dir = await mkdtemp(path.join(tmpdir(), 'castsafety-'));
try {
  const outfile = path.join(dir, 'character.cjs');
  await build({
    entryPoints: [path.join(here, '..', 'src', 'lib', 'Character.tsx')],
    // Nothing is external. The bundle is written to a temp dir, so anything left
    // unresolved there cannot be found at require time, which is how the first
    // version of this file failed. Same arrangement as tests/paint_ids.mjs.
    bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic',
    outfile, logLevel: 'error',
  });
  const C = createRequire(import.meta.url)(outfile);

  const selfing = process.argv.includes('--self-test');
  const n = selfing ? selfTest(C) : run(C);
  console.log(n === 0
    ? `cast safety ${selfing ? 'self-test' : 'check'}: all passed`
    : `cast safety ${selfing ? 'self-test' : 'check'}: ${n} FAILED`);
  process.exit(n === 0 ? 0 : 1);
} finally {
  await rm(dir, {recursive: true, force: true});
}
