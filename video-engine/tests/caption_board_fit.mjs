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
  const {captionLayout, widthOf, CAPTION_TEXT_WIDTH} = createRequire(import.meta.url)(outfile);
  const width = CAPTION_TEXT_WIDTH;
  const check = (cue) => {
    if (typeof cue.text !== "string" || !cue.text.trim()) throw new Error("caption text is missing");
    const fit = captionLayout(cue.text, width);
    if (fit.lines.length > 2 || fit.size < 29 ||
        fit.lines.join(' ') !== cue.text.trim().replace(/\s+/g, ' ') ||
        fit.lines.some((line) => widthOf(line, fit.size, true) > width)) {
      throw new Error(`caption ${cue.id} would exceed the lower two-line band`);
    }
  };
  if (process.argv.includes('--self-test')) {
    check({id: 'known-fit', text: 'The proposed local gate stayed open.'});
    let rejected = false;
    try { check({id: 'dense', text: 'A very long narration cue '.repeat(18).trim()}); }
    catch { rejected = true; }
    if (!rejected) throw new Error('an overfull cue was accepted');
    console.log('caption_board_fit: a real cue fits and an overfull cue fails before render');
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
    for (const cue of cues) check(cue);
    console.log(`caption_board_fit: ${cues.length} exact board cues fit the lower two-line band`);
  }
} finally {
  await rm(temp, {recursive: true, force: true});
}
