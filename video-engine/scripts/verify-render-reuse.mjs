/** Development parity check. These renders are not editorial approvals. Reserve before running. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {bundle} from '@remotion/bundler';
import {openBrowser,renderMedia,renderStill,selectComposition} from '@remotion/renderer';
import {renderBatch} from './render-batch.mjs';
const root=path.resolve(process.argv[2]??'../out/runtime-efficiency-proof');
const repo=path.resolve(import.meta.dirname,'../..');
const base=JSON.parse(fs.readFileSync(path.join(repo,'runs/2026-09-26/storyboard.json'),'utf8'));
base.cinematic_template='daily-actions-v1';
const ids={s1:'street-capture-v1',s3:'curb-selection-v1',s2:'document-accumulation-v1'};
base.scenes.forEach(s=>{if(ids[s.id])s.production_action=ids[s.id]});
const board=path.join(root,'board.json'),ending=path.join(root,'ending.json'),removed=path.join(root,'removed.json');
fs.writeFileSync(board,JSON.stringify(base));
const changed=structuredClone(base);changed.scenes.at(-1).super='A changed ending for the code test';changed.credits='Different code-test credit';
fs.writeFileSync(ending,JSON.stringify(changed));
fs.writeFileSync(removed,JSON.stringify({...base,__cinemaProofWithoutStage:true}));
const frames=[36,246,570,1080];
const makeJobs=label=>frames.map(frame=>({kind:'still',props:board,output:path.join(root,label+'-'+frame+'.png'),frame}));
const dailyJobs=[...makeJobs('daily'),{kind:'still',props:ending,output:path.join(root,'ending-36.png'),frame:36},
  {kind:'still',props:removed,output:path.join(root,'removed-36.png'),frame:36},
  {kind:'video',props:board,output:path.join(root,'native.mp4'),frames:[30,41]}];
const daily=process.argv.includes("--legacy-only") ? {retained_native_suite:true} : await renderBatch({jobs:dailyJobs});
const legacy=await renderBatch({jobs:makeJobs('legacy')},{bundle:opts=>bundle({...opts,entryPoint:path.join(repo,'video-engine/src/index.ts')}),
  openBrowser,renderMedia,renderStill,selectComposition});
for(const frame of frames)assert.deepEqual(fs.readFileSync(path.join(root,'daily-'+frame+'.png')),
  fs.readFileSync(path.join(root,'legacy-'+frame+'.png')),'rendered frame parity at '+frame);
assert.deepEqual(fs.readFileSync(path.join(root,'daily-36.png')),fs.readFileSync(path.join(root,'ending-36.png')));
assert.notDeepEqual(fs.readFileSync(path.join(root,'daily-36.png')),fs.readFileSync(path.join(root,'removed-36.png')));
fs.writeFileSync(path.join(root,'report.json'),JSON.stringify({scope:'code verification, no editorial verdict',frames,parity:true,ending_hero_unchanged:true,daily,legacy},null,2)+'\n');
console.log('PASS actual native frame parity, unchanged hero and stage removal');
