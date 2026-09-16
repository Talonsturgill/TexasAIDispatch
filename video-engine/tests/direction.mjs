import assert from 'node:assert/strict';
import {build} from 'esbuild';
const bundled=await build({entryPoints:['src/lib/direction.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {actionWindows,requireAction,actionProgress}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
const scenes=[{id:'second',start_s:8,duration_s:4,visual_events:[{id:'reveal',at_s:1,duration_s:.8,item_ids:['subject']}]}];
const w=requireAction(actionWindows(scenes),'reveal');
assert.equal(w.start,9);assert.equal(w.end,9.8);
assert.equal(actionProgress(w,8),0);assert.equal(actionProgress(w,11),1);
assert.ok(Math.abs(actionProgress(w,9.4)-.5)<1e-10);
const retimed=structuredClone(scenes);retimed[0].start_s=12;retimed[0].visual_events[0].at_s=.5;retimed[0].visual_events[0].duration_s=.4;
const shifted=requireAction(actionWindows(retimed),'reveal');
assert.equal(shifted.start,12.5);assert.equal(shifted.end,12.9);
assert.throws(()=>requireAction(actionWindows(scenes),'missing'),/Missing board action/);
assert.throws(()=>actionWindows([...scenes,...scenes]),/Duplicate/);
for(const mutation of [{at_s:NaN},{at_s:3.7},{duration_s:0},{duration_s:Infinity}]){
 const bad=structuredClone(scenes);Object.assign(bad[0].visual_events[0],mutation);
 assert.throws(()=>actionWindows(bad),/outside its scene/);
}
const special=structuredClone(scenes);special[0].visual_events[0].id='constructor';
assert.equal(requireAction(actionWindows(special),'constructor').start,9);
console.log('direction: real board retiming, boundary clamping and invalid actions verified');
