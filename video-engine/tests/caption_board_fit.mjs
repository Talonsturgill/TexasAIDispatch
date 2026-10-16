#!/usr/bin/env node
// Check the current board's exact narration cues with the renderer's own layout
// before a preflight render is reserved. A too-long cue cannot spend a render.
import {build} from 'esbuild';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const temp = await mkdtemp(path.join(tmpdir(), 'dispatch-caption-fit-'));
try {
  const outfile = path.join(temp, 'probe.cjs');
  await build({entryPoints: [path.join(here, 'type_fit_probe.tsx')],
    bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic',
    outfile, logLevel: 'error'});
  const {captionLayout, captionBandHeight, creditLayout, widthOf, CAPTION_TEXT_WIDTH, SAFE_RIGHT, SAFE_BOTTOM, CAPTION_ENTRANCE_PX} = createRequire(import.meta.url)(outfile);
  const width = CAPTION_TEXT_WIDTH;
  // A cue may hold three lines only when captions.json declares max_lines 3 on it, the
  // renderer's own layout then gives at least 40, every line fits the safe width and the
  // band is never taller than three lines at the top size. Every other cue keeps two lines.
  const THIRD_LINE_MIN = 40;
  const tallest = captionBandHeight({lines: ['', '', ''], size: 44});
  const verdict = (cue, fit) => {
    const declared = cue.max_lines === undefined ? 2 : cue.max_lines;
    if (declared !== 2 && declared !== 3) return `caption ${cue.id} declares max_lines ${JSON.stringify(cue.max_lines)}; only 2 or 3 is allowed`;
    if (fit.lines.join(' ') !== cue.text.trim().replace(/\s+/g, ' ')) return `caption ${cue.id} would drop or alter spoken words`;
    if (fit.lines.some((line) => widthOf(line, fit.size, true) > width)) return `caption ${cue.id} has a line wider than the safe caption width`;
    if (fit.lines.length > 2) {
      if (declared !== 3) return `caption ${cue.id} takes ${fit.lines.length} lines without declaring max_lines 3`;
      if (fit.lines.length > 3) return `caption ${cue.id} takes ${fit.lines.length} lines; three is the most a declared cue may take`;
      if (fit.size < THIRD_LINE_MIN) return `caption ${cue.id} takes three lines at ${fit.size}, under ${THIRD_LINE_MIN}`;
    } else if (fit.size < 29) {
      return `caption ${cue.id} would exceed the lower two-line band`;
    }
    const top = SAFE_BOTTOM - captionBandHeight(fit) - CAPTION_ENTRANCE_PX;
    if (top < SAFE_BOTTOM - tallest - 1e-6) return `caption ${cue.id} band rises above the three-line caption seat`;
    return null;
  };
  const layoutOf = (cue) => captionLayout(cue.text, width, cue.max_lines === 3 ? 3 : 2);
  const check = (cue, modern = false) => {
    if (typeof cue.text !== "string" || !cue.text.trim()) throw new Error("caption text is missing");
    let fit;
    try { fit = layoutOf(cue); } catch (e) { throw new Error(`caption ${cue.id} would exceed the lower two-line band`); }
    const problem = verdict(cue, fit);
    if (problem) throw new Error(problem);
    if (modern && (fit.lines.length > 2 || fit.size < 40))
      throw new Error(`caption ${cue.id} needs shorter measured clauses for two lines at 40 or more; never drop words or invent a boundary`);
    return fit;
  };
  const checkCredits = (text) => creditLayout(text, SAFE_RIGHT - 78, 850, SAFE_BOTTOM - 28);
  const inspectCues = (cues, modern) => {
    const fits = [], problems = [];
    for (const cue of cues) {
      try { fits.push(check(cue, modern)); }
      catch (error) {
        fits.push(null);
        problems.push(`${error.message}; characters ${typeof cue.text === 'string' ? cue.text.length : 'unknown'}`);
      }
    }
    return {fits, problems};
  };
  if (process.argv.includes('--self-test')) {
    check({id: 'known-fit', text: 'The proposed local gate stayed open.'});
    let rejected = false;
    try { check({id: 'dense', text: 'A very long narration cue '.repeat(18).trim()}); }
    catch { rejected = true; }
    if (!rejected) throw new Error('an overfull cue was accepted');
    // The cue that needed this: one measured sentence with no measured silence inside it.
    const longCue = "The utility's wildfire lead says no major fire has needed an AEP Texas response since launch.";
    const plain = check({id: 'undeclared', text: longCue});
    if (plain.lines.length !== 2) throw new Error('an undeclared cue left two lines');
    const declared = check({id: 'declared', text: longCue, max_lines: 3});
    if (declared.lines.length !== 3 || declared.size < 40) throw new Error('a declared three-line cue did not reach 40 on three lines');
    const same = check({id: 'fits', text: 'The proposed local gate stayed open.', max_lines: 3});
    const base = check({id: 'fits', text: 'The proposed local gate stayed open.'});
    if (JSON.stringify(same) !== JSON.stringify(base)) throw new Error('a declaration changed a cue that already fits on two lines');
    const refuse = (label, cue, fit) => { if (!verdict(cue, fit)) throw new Error(label + ' was accepted'); };
    const seatCue = {id: 'entrance', text: 'One two three', max_lines: 3};
    refuse('a three-line 44px cue lifted above the caption seat on entry', seatCue,
      {lines: ['One', 'two', 'three'], size: 44});
    if (verdict(seatCue, {lines: ['One', 'two', 'three'], size: 42}))
      throw new Error('the valid 42px three-line historical control was refused');
    check({id: 'modern-readable', text: 'The sensor can report rising water.'}, true);
    let denseRejected = false;
    try { check({id: 'modern-dense', text: longCue, max_lines: 3}, true); }
    catch { denseRejected = true; }
    if (!denseRejected) throw new Error('a new three-line cue passed the two-line phone contract');
    const complete = inspectCues([
      {id: 'first-dense', text: longCue},
      {id: 'readable-between', text: 'The sensor can report rising water.'},
      {id: 'later-dense', text: 'A very long narration cue '.repeat(18).trim()},
    ], true);
    if (complete.problems.length !== 2 || !complete.problems[0].includes('first-dense') ||
        !complete.problems[1].includes('later-dense') || complete.fits[0] !== null ||
        !complete.fits[1] || complete.fits[2] !== null)
      throw new Error('caption diagnosis failed to inspect every cue while retaining both failures');
    refuse('a three-line layout without the declaration', {id: 'x', text: longCue}, declared);
    refuse('a declared three-line layout at 38', {id: 'x', text: longCue, max_lines: 3}, {lines: declared.lines, size: 38});
    refuse('a line wider than the safe width', {id: 'x', text: longCue, max_lines: 3},
      {lines: [declared.lines[0] + ' ' + declared.lines[1], declared.lines[2]], size: 44});
    refuse('max_lines 4', {id: 'x', text: longCue, max_lines: 4}, declared);
    rejected = false;
    try { check({id: 'dense3', text: 'A very long narration cue '.repeat(18).trim(), max_lines: 3}); }
    catch { rejected = true; }
    if (!rejected) throw new Error('an overfull declared cue was accepted');
    checkCredits('SOURCES\nCity of Dallas\nNBC DFW'.replaceAll('\\n', '\n'));
    rejected = false;
    try { checkCredits('Source attribution '.repeat(250)); } catch { rejected = true; }
    if (!rejected) throw new Error('overflowing credits were accepted');
    console.log('caption_board_fit: real cues fit, a declared long cue takes three lines at 40 or more, and undeclared, small or overfull layouts fail before render');
  } else {
    const arg = process.argv.indexOf('--board');
    if (arg < 0 || !process.argv[arg + 1]) throw new Error('usage: caption_board_fit.mjs --board FILE');
    const board = JSON.parse(await readFile(process.argv[arg + 1], 'utf8'));
    const cues = board.captions || [];
    const earlyMuted = process.argv.includes('--early-muted-animatic');
    if (String(board.date || "") >= "2026-09-25" && !cues.length) {
      if (!earlyMuted || board.caption_method || board.retimed_to || board.retime_evidence)
        throw new Error("current timed board has no measured narration captions to inspect");
      console.log('caption_board_fit: early muted picture animatic has no cues; final timed board must be checked');
    }
    const {fits, problems} = inspectCues(cues, String(board.date || '') >= '2026-10-15');
    if (board.credits) {
      try { checkCredits(board.credits); }
      catch (error) { problems.push(`credits: ${error.message}`); }
    }
    if (problems.length) {
      for (const problem of problems) console.error(`  FAIL ${problem}`);
      console.error(`caption_board_fit: ${problems.length} failure(s); all ${cues.length} cues inspected`);
      process.exitCode = 1;
    } else {
      const three = fits.filter((fit) => fit.lines.length === 3).length;
      console.log(`caption_board_fit: ${cues.length} exact board cues fit the lower band` +
        (three ? ` (${three} declared three-line cue at ${fits.filter((f) => f.lines.length === 3).map((f) => f.size).join(', ')})` : ' in two lines'));
      if (process.argv.includes('--report')) for (const [i, fit] of fits.entries())
        console.log(`  ${cues[i].id} size ${fit.size} lines ${fit.lines.length} band top ${(SAFE_BOTTOM - captionBandHeight(fit)).toFixed(1)}: ${fit.lines.join(' | ')}`);
    }
  }
} finally {
  await rm(temp, {recursive: true, force: true});
}
