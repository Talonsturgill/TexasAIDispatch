import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const out=path.resolve('../out/enforcement/stage-probe');
fs.mkdirSync(out,{recursive:true});
const serveUrl=await bundle({entryPoint:path.resolve('tests/cinema-proof-entry.tsx')});
const browser=await openBrowser('chrome',{chromiumOptions:{gl:'angle'}});
try {
  for (const omitStage of [false,true]) {
    const inputProps={omitStage};
    const composition=await selectComposition({serveUrl,id:'CinemaContractTest',inputProps,puppeteerInstance:browser});
    await renderStill({serveUrl,composition,inputProps,frame:240,puppeteerInstance:browser,
      output:path.join(out,omitStage?'without.png':'normal.png'),imageFormat:'png',chromiumOptions:{gl:'angle'}});
  }
} finally {await browser.close({silent:true});}
console.log('Rendered actual shared stage and its ablation at full delivery resolution.');

execFileSync('python3',['-c', "import sys; sys.path.insert(0, 'scripts'); from production_quality import image; import numpy as np; from pathlib import Path; p=Path('out/enforcement/stage-probe'); a=image(p/'normal.png'); b=image(p/'without.png'); assert (np.max(np.abs(a-b),axis=2)>12).mean() > .1, 'shared cinematic stage is disconnected'"], {cwd:path.resolve('..'),stdio:'inherit'});
