import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {renderBatch,entryFor} from '../scripts/render-batch.mjs';
await import('./direction.mjs');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'dispatch-batch-'));
try{
  const props=path.join(root,'board.json'), off=path.join(root,'off.json');
  fs.writeFileSync(props,JSON.stringify({cinematic_template:'daily-actions-v1'}));
  fs.writeFileSync(off,JSON.stringify({cinematic_template:'daily-actions-v1',__cinemaProofWithoutStage:true}));
  const counts={},options=[];
  const api=Object.fromEntries(['bundle','openBrowser','selectComposition','renderStill','renderMedia'].map(name=>[name,async (...args)=>{
    counts[name]=(counts[name]??0)+1;options.push([name,...args]);
    if(name==='bundle')return '/synthetic-bundle';
    if(name==='openBrowser')return {close:async()=>{counts.close=(counts.close??0)+1;}};
    if(name==='selectComposition')return {width:1080,height:1920,fps:30,durationInFrames:90};
  }]));
  const jobs=[
    {kind:'video',props,output:path.join(root,'hero.mp4'),frames:[0,29]},
    ...[0,29].flatMap(frame=>[props,off].map(p=>({kind:'still',props:p,output:path.join(root,frame+'-'+path.basename(p)+'.png'),frame})))
  ];
  const result=await renderBatch({jobs},api);
  assert.equal(result.jobs,5);assert.equal(counts.bundle,1);assert.equal(counts.openBrowser,1);
  assert.equal(counts.selectComposition,2);assert.equal(counts.close,1);
  for(const [kind,args] of options.filter(x=>['renderMedia','renderStill'].includes(x[0]))){
    assert.equal(args.imageFormat,'png');assert.equal(args.composition.width,1080);assert.ok(args.puppeteerInstance);
    if(kind==='renderMedia'){assert.equal(args.crf,16);assert.equal(args.scale,1);assert.deepEqual(args.frameRange,[0,29]);}
  }
  await assert.rejects(()=>renderBatch({jobs}, {...api,renderStill:async()=>{throw new Error('test failure')}}),/test failure/);
  assert.equal(counts.close,2);
  await assert.rejects(()=>renderBatch({jobs:[{...jobs[0],kind:'unknown'}]},api),/Unknown/);
  assert.ok(fs.existsSync(entryFor({cinematic_template:'daily-actions-v1'})));
  assert.ok(fs.existsSync(entryFor({cinematic_template:'legacy'})));
  assert.ok(entryFor({cinematic_template:'daily-actions-v1'}).endsWith('/daily.tsx'));
  assert.ok(entryFor({cinematic_template:'brush-camera-v1'}).endsWith('/index.ts'));
  const source=fs.readFileSync(new URL('../src/Dispatch.tsx',import.meta.url),'utf8');
  const daily=fs.readFileSync(new URL('../src/daily.tsx',import.meta.url),'utf8');
  const metadata=text=>text.match(/export const dispatchMetadata =[\s\S]*?\n};/)[0];
  assert.equal(metadata(source),metadata(daily),'isolated route must retain exact composition timing');
  console.log('PASS one setup per batch, native capture, route, timing and failure cleanup');
}finally{fs.rmSync(root,{recursive:true,force:true});}
