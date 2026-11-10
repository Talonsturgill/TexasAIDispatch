/** Engineering equivalence only. No controller, production edition or editorial verdict. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderMedia} from '@remotion/renderer';
import {boundedPngRender} from './bounded-png-render.mjs';
import {withCompleteCredits} from './credit-tail-render.mjs';
const repo=path.resolve(import.meta.dirname,'../..');
const output=process.argv[2]??fs.mkdtempSync(path.join(os.tmpdir(),'dispatch-bounded-proof-'));
fs.mkdirSync(output,{recursive:true});
const board=JSON.parse(fs.readFileSync(path.join(repo,'experiments/modern-film-2026-10-07/board-a.json'),'utf8'));
// Derive a real-scene ending with ceil(frame) != round(frame); preserve frozen source bytes.
const oldEnd=Math.max(board.runtime_s,...board.scenes.map(scene=>scene.start_s+scene.duration_s));
const newEnd=(Math.floor(oldEnd*30)+.2)/30;
board.runtime_s=newEnd;
for(const scene of board.scenes)if(Math.abs(scene.start_s+scene.duration_s-oldEnd)<.001)scene.duration_s=newEnd-scene.start_s;
for(const shot of board.film_direction.shots)if(Math.abs(shot.start_s+shot.duration_s-oldEnd)<.001)shot.duration_s=newEnd-shot.start_s;
const serveUrl=await bundle({entryPoint:path.join(repo,'video-engine/src/index.ts'),publicDir:path.join(repo,'video-engine/public'),enableCaching:true});
const browser=await openBrowser('chrome',{logLevel:'verbose',chromeMode:'headless-shell',chromiumOptions:{gl:'angle'}});
const common={serveUrl,puppeteerInstance:browser,chromiumOptions:{gl:'angle'},logLevel:'error',timeoutInMilliseconds:120000};
const rows=[];
try{
 console.log('Selecting native composition');
 const original=await selectComposition({...common,id:'Dispatch',inputProps:board});
 const composition=withCompleteCredits(original,board);
 const end=Math.max(Number(board.runtime_s),...board.scenes.map(s=>Number(s.start_s)+Number(s.duration_s)));
 const gap=Math.ceil(end*30)-Math.round(end*30);
 assert.equal(gap,1,'This real-scene fixture must exercise the extra credit frame');
 const inputProps={...board,credits_s:(Math.ceil(board.credits_s*30)+gap)/30};
 composition.props={...composition.props,...inputProps};
 const cases=[['shot-transition',[30,120],false],['nonzero-boundary',[59,121],false],['fractional-credit-tail',[Math.ceil(end*30)-10,composition.durationInFrames-1],false],['preview-opening',[30,120],true]];
 for(const [name,frameRange,preview] of cases){
  const options={...common,composition,inputProps,frameRange,codec:'h264',imageFormat:preview?'jpeg':'png',crf:preview?32:16,pixelFormat:'yuv420p',muted:true,scale:preview?.25:1,concurrency:1};
  const legacy=path.join(output,name+'-legacy.mp4'),bounded=path.join(output,name+'-bounded.mp4');
  // Force the existing worst-case disk path, not the RAM-dependent streaming shortcut.
  console.log('Rendering legacy '+name);
  await renderMedia({...options,disallowParallelEncoding:true,outputLocation:legacy});
  console.log('Rendering bounded '+name);
  await boundedPngRender({...options,outputLocation:bounded});
  const frames=file=>execFileSync('ffmpeg',['-v','error','-i',file,'-map','0:v:0','-f','framemd5','-'],{encoding:'utf8'}).split('\n').filter(line=>line&&!line.startsWith('#')).join('\n');
  assert.equal(frames(bounded),frames(legacy),'Exact decoded frame parity: '+name);
  const probe=file=>JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_entries','stream=width,height,r_frame_rate,nb_read_frames,pix_fmt,color_space,color_range,color_transfer,color_primaries,duration','-of','json',file],{encoding:'utf8'})).streams;
  assert.deepEqual(probe(bounded),probe(legacy),'Timing/color/native metadata parity: '+name);
  assert.equal(Number(probe(bounded)[0].nb_read_frames),frameRange[1]-frameRange[0]+1);
  rows.push({name,frameRange,credit_gap:gap,preview,exact_decoded_parity:true,metadata:probe(bounded),decoded_sha256:crypto.createHash('sha256').update(frames(bounded)).digest('hex'),bounded_receipt:JSON.parse(fs.readFileSync(bounded+'.bounded-png.json','utf8'))});
  console.log('PASS '+name);
 }
}finally{await browser.close({silent:true});}
fs.writeFileSync(path.join(output,'equivalence.json'),JSON.stringify({schema:'dispatch-bounded-png-equivalence/1',scope:'real retained modern scene engineering regression, not a production capture or editorial approval',rows},null,2)+'\n');
console.log('PASS exact real-scene PNG encoding equivalence: '+output);
