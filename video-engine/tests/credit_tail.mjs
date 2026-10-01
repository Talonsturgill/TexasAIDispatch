import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {withCompleteCredits,renderCompleteCredits} from '../scripts/credit-tail-render.mjs';
const composition={width:1080,height:1920,fps:30,durationInFrames:1364,id:'Dispatch'};
const board={cinematic_template:'pod-delivery-v1',runtime_s:40.467,credits_s:5,scenes:[{start_s:33.96,duration_s:6.507}]};
assert.equal(withCompleteCredits(composition,board).durationInFrames,1365);
assert.equal(1365-Math.ceil(40.467*30),150);
assert.equal(withCompleteCredits({...composition,durationInFrames:1400},board).durationInFrames,1400);
assert.equal(withCompleteCredits(composition,{...board,runtime_s:40,scenes:[]}).durationInFrames,1364);
assert.throws(()=>withCompleteCredits(composition,{...board,credits_s:-1}),/Invalid/);
const root=fs.mkdtempSync(path.join(os.tmpdir(),'dispatch-credit-tail-'));
try{
 const props=path.join(root,'board.json');fs.writeFileSync(props,JSON.stringify(board));
 let renders=0,closed=0,bundles=0;
 const api={bundle:async()=>{bundles++;return 'bundle';},openBrowser:async()=>({close:async()=>{closed++;}}),
 selectComposition:async()=>composition,renderStill:async()=>{throw Error('No extra still jobs');},renderMedia:async options=>{
  renders++;assert.equal(options.composition.durationInFrames,1365);assert.deepEqual(options.inputProps,board);
  assert.equal(options.imageFormat,'png');assert.equal(options.crf,16);assert.equal(options.scale,1);
 }};
 await renderCompleteCredits(props,path.join(root,'silent.mp4'),api);
 assert.equal(renders,1);assert.equal(bundles,1);assert.equal(closed,1);
 console.log('PASS fractional story ending keeps 150 native credit frames and shared batch');
}finally{fs.rmSync(root,{recursive:true,force:true});}
