/** Paired still-only diagnostics, using unchanged production files and frame capture. */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {renderBatch} from '../video-engine/scripts/render-batch.mjs';
const require = createRequire(new URL('../video-engine/package.json', import.meta.url));
const {bundle} = require('@remotion/bundler');
const {openBrowser, renderMedia, renderStill, selectComposition} = require('@remotion/renderer');
const stage = fileURLToPath(new URL('../video-engine/src/modern/PlaceStage.tsx', import.meta.url));
const loader = fileURLToPath(new URL('./place_probe_loader.cjs', import.meta.url));

export async function renderPlaceProbes(spec, api={bundle, openBrowser, renderMedia, renderStill, selectComposition}) {
  if (!Array.isArray(spec.jobs) || !spec.jobs.length) throw new Error('Place probes need still jobs');
  for (const job of spec.jobs) {
    if (job.kind !== 'still' || job.preview || !Number.isInteger(job.frame) || job.frame < 0 ||
        JSON.parse(fs.readFileSync(job.props, 'utf8')).__placeProbe !== true) {
      throw new Error('Place probes accept only native stills with __placeProbe=true');
    }
    if (!job.output.endsWith('.png')) throw new Error('Place probes require PNG output');
  }
  const reports = [];
  for (const tone of ['black', 'white']) {
    const jobs = spec.jobs.map(job => ({...job, output: job.output.slice(0, -4) + `-${tone}.png`}));
    reports.push(await renderBatch({jobs}, {...api, bundle: options => api.bundle({...options,
      enableCaching: false,
      webpackOverride: config => ({...config, module: {...config.module,
        rules: [...(config.module?.rules ?? []), {test: /PlaceStage\.tsx$/, include: stage,
          enforce: 'pre', use: [{loader, options: {tone, stage}}]}]}})
    })}));
  }
  return {schema: 'dispatch-place-probes/1', method: 'paired-black-white', reports};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await renderPlaceProbes(JSON.parse(fs.readFileSync(process.argv[2], 'utf8')));
  console.log(JSON.stringify(result));
}
