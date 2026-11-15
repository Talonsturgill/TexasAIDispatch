#!/usr/bin/env node
// Mounting text before its shipped face arrives can crash the host fallback font
// renderer. A delayRender hold alone postpones capture, not that first layout.
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const engine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(engine);
const work = await mkdtemp(path.join(tmpdir(), 'dispatch-fonts-'));
const entry = path.join(work, 'entry.tsx');
const quote = JSON.stringify;
const logs = [];
const onBrowserLog = (event) => logs.push(event.text);
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE;
try {
  await writeFile(entry, `
import React from ${quote(path.join(engine, 'node_modules/react'))};
import {Composition, registerRoot} from ${quote(path.join(engine, 'node_modules/remotion'))};
import {withFonts, FACES} from ${quote(path.join(engine, 'src/lib/fonts'))};
const Picture = () => {
  const faces = Array.from(document.fonts);
  const loaded = FACES.every(expected => faces.some(face =>
    face.family.replaceAll('"', '') === expected.family &&
    face.weight === expected.weight && face.status === 'loaded'));
  if (!loaded) throw new Error('composition mounted before its shipped fonts loaded: '+
    JSON.stringify(faces.map(face => ({family: face.family, weight: face.weight, status: face.status}))));
  React.useEffect(() => { console.log('FONTS_FIRST_COMMIT_READY'); }, []);
  return <div style={{fontFamily: 'Manrope', fontSize: 44, fontWeight: 700}}>
    The camera on the pole finds a cracked insulator.
  </div>;
};
const Component = withFonts(Picture);
registerRoot(() => <Composition id="Fonts" component={Component}
  durationInFrames={30} fps={30} width={1080} height={1920}/>);
`);
  const serveUrl = await bundle({entryPoint: entry, outDir: path.join(work, 'bundle'),
    publicDir: path.join(engine, 'public')});
  const composition = await selectComposition({serveUrl, id: 'Fonts', onBrowserLog, browserExecutable});
  const output = path.join(work, 'fonts.png');
  await renderStill({serveUrl, composition, output, frame: 0, scale: 0.25, onBrowserLog, browserExecutable});
  assert.ok(logs.includes('FONTS_FIRST_COMMIT_READY'), 'the ready composition actually committed');
  assert.ok((await readFile(output)).length > 1000, 'the loaded text was captured');
  console.log('ok: all four shipped faces load before the first composition mount');

  // Remove only the bundle's copied font. A failed load must cancel clearly,
  // without mounting text in a substitute face or capturing an empty frame.
  await rm(path.join(serveUrl, 'public/fonts/Manrope-Var.ttf'));
  logs.length = 0;
  await assert.rejects(renderStill({serveUrl, composition, output: path.join(work, 'missing.png'),
    frame: 0, scale: 0.25, onBrowserLog, browserExecutable}), /Could not load the shipped fonts/);
  assert.ok(!logs.includes('FONTS_FIRST_COMMIT_READY'), 'missing fonts never mount the composition');
  console.log('ok: a missing shipped face cancels with a clear load error');
} finally {
  await rm(work, {recursive: true, force: true});
}
