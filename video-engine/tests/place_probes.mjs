import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {renderPlaceProbes} from '../../scripts/place_probes.mjs';
const require = createRequire(import.meta.url);
const loader = require('../../scripts/place_probe_loader.cjs');
const stage = path.resolve('src/modern/PlaceStage.tsx');
const original = fs.readFileSync(stage, 'utf8');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-place-pair-'));
try {
  const props = path.join(root, 'props.json');
  fs.writeFileSync(props, JSON.stringify({cinematic_template: 'daily-actions-v1', __placeProbe: true}));
  const spec = {jobs: [{kind: 'still', props, frame: 1542, output: path.join(root, 's9-shot-2.png')}]};
  const captures = [], tones = [];
  let opens = 0, closes = 0;
  const api = {
    bundle: async options => {
      assert.equal(options.enableCaching, false);
      const config = options.webpackOverride({module: {rules: [{existing: true}]}});
      assert.deepEqual(config.module.rules[0], {existing: true});
      const rule = config.module.rules[1];
      assert.equal(rule.include, stage);
      assert.equal(rule.enforce, 'pre');
      const options2 = rule.use[0].options;
      tones.push(options2.tone);
      const modified = loader.call({resourcePath: stage, getOptions: () => options2}, original);
      assert.equal(modified, original.replace("const PROBE='#ff00ff';",
        `const PROBE='${options2.tone === 'black' ? '#000000' : '#ffffff'}';`));
      return '/diagnostic-bundle';
    },
    openBrowser: async () => { opens++; return {close: async () => { closes++; }}; },
    selectComposition: async () => ({width: 1080, height: 1920, fps: 30}),
    renderStill: async options => { captures.push(options); },
    renderMedia: async () => { throw new Error('Diagnostic tried to render a movie'); },
  };
  const result = await renderPlaceProbes(spec, api);
  assert.equal(result.method, 'paired-black-white');
  assert.deepEqual(tones, ['black', 'white']);
  assert.equal(opens, 2); assert.equal(closes, 2);
  assert.deepEqual(captures.map(x => path.basename(x.output)), ['s9-shot-2-black.png', 's9-shot-2-white.png']);
  for (const shot of captures) {
    assert.equal(shot.frame, 1542); assert.equal(shot.imageFormat, 'png');
    assert.equal(shot.inputProps.__placeProbe, true);
  }
  assert.equal(fs.readFileSync(stage, 'utf8'), original, 'Production source changed');
  assert.deepEqual(spec.jobs[0], {kind: 'still', props, frame: 1542, output: path.join(root, 's9-shot-2.png')});
  for (const update of [{kind: 'video'}, {preview: true}, {frame: -1}, {frame: .5}, {output: 'bad.jpeg'}]) {
    await assert.rejects(() => renderPlaceProbes({jobs: [{...spec.jobs[0], ...update}]}, api));
  }
  fs.writeFileSync(props, JSON.stringify({__placeProbe: false}));
  await assert.rejects(() => renderPlaceProbes(spec, api), /__placeProbe=true/);
  fs.writeFileSync(props, JSON.stringify({cinematic_template: 'daily-actions-v1', __placeProbe: true}));
  await assert.rejects(() => renderPlaceProbes(spec, {...api,
    renderStill: async () => {throw new Error('capture failed');}}), /capture failed/);
  assert.equal(opens, 3); assert.equal(closes, 3);
  const context = {resourcePath: stage, getOptions: () => ({stage, tone: 'black'})};
  assert.throws(() => loader.call(context, original.replace("const PROBE='#ff00ff';", '')), /exactly one/);
  assert.throws(() => loader.call(context, original + "const PROBE='#ff00ff';"), /exactly one/);
  assert.throws(() => loader.call({...context, resourcePath: stage + '.other'}, original), /unexpected module/);
  assert.throws(() => loader.call({...context, getOptions: () => ({stage, tone: 'magenta'})}, original), /unexpected module/);
  console.log('PASS paired diagnostic native stills; production bytes unchanged; fail-closed substitution and cleanup');
} finally {
  fs.rmSync(root, {recursive: true, force: true});
}
