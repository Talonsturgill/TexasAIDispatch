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
// Random-access evaluation must equal sequential evaluation and retain old curves.
for(const curve of ['smoothstep','linear','travel','contact','landing']){
 const styled={...w,motion:{curve,anticipation:.1,settle:.2}};
 const samples=Array.from({length:101},(_,i)=>actionProgress(styled,9+i*.008));
 assert.equal(samples[0],0);assert.equal(samples[100],1);
 assert.equal(actionProgress(styled,9.04),0);assert.equal(actionProgress(styled,9.72),1);
 for(const i of [77,8,98,44,0,100])assert.equal(actionProgress(styled,9+i*.008),samples[i]);
 if(curve!=='landing'){
  assert.ok(samples.every(v=>v>=0&&v<=1));
  assert.ok(samples.every((v,i)=>!i||v>=samples[i-1]-1e-12));
 }else assert.ok(samples.every(v=>v>=0&&v<1.04));
}
for(const motion of [{curve:'wrong'},{curve:'travel',anticipation:1},{curve:'contact',settle:NaN}]){
 assert.throws(()=>actionProgress({...w,motion},9.4),/Invalid directed/);
}
const styleBundle=await build({entryPoints:['src/lib/artDirection.tsx'],bundle:true,write:false,format:'cjs',platform:'node'});
const {createRequire}=await import('node:module');const req=createRequire(import.meta.url),mod={exports:{}};
new Function('require','module','exports',styleBundle.outputFiles[0].text)(req,mod,mod.exports);
const {directedShot,artShotAt}=mod.exports;
const pose={position:[3,2,5],target:[0,0,0],fov:40};
const profile={shots:{second:{...pose,event_id:'reveal',to:{position:[4,2,5],target:[1,0,0],fov:36}}}};
assert.equal(directedShot(undefined,'second',{'reveal':w},9.4),undefined);
assert.deepEqual(directedShot(profile,'second',{'reveal':w},8),pose);
assert.deepEqual(directedShot(profile,'second',{'reveal':w},11),{position:[4,2,5],target:[1,0,0],fov:36});
const mid=directedShot(profile,'second',{'reveal':w},9.4);
assert.ok(Math.abs(mid.target[0]-.5)<1e-10);
assert.deepEqual(artShotAt(profile,scenes,{'reveal':w},9.4),mid);
assert.equal(artShotAt(profile,scenes,{'reveal':w},7),undefined);
assert.equal(artShotAt(profile,scenes,{'reveal':w},12),undefined);
console.log('directed art: legacy defaults, bounded timing, random access and event-bound camera verified');
