import assert from 'node:assert/strict';
import {build} from 'esbuild';
const bundled=await build({entryPoints:['src/lib/direction.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {actionWindows,requireAction,actionProgress,joinedActionWindow}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
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

// A constrained stroke must join a still pose without a velocity or acceleration
// jump. These measured derivatives fail for the original cubic-out contact and
// two-piece cubic travel, including its discontinuous midpoint acceleration.
for(const curve of ['travel','contact']){
 const win={start:0,end:1,scene:'test',itemIds:[],motion:{curve}},h=1e-4;
 const value=t=>actionProgress(win,t);
 for(const edge of [0,1]){
  const velocity=(value(edge+h)-value(edge-h))/(2*h);
  const acceleration=(value(edge+h)-2*value(edge)+value(edge-h))/(h*h);
  assert.ok(Math.abs(velocity)<1e-5,`${curve} jumps in velocity at ${edge}`);
  assert.ok(Math.abs(acceleration)<.005,`${curve} jumps in acceleration at ${edge}`);
 }
 const left=(value(.5)-2*value(.5-h)+value(.5-2*h))/(h*h);
 const right=(value(.5+2*h)-2*value(.5+h)+value(.5))/(h*h);
 assert.ok(Math.abs(left-right)<.025,`${curve} breaks acceleration inside its stroke`);
}
const continuous={one:{start:0,end:1.35,scene:'withdrawal',itemIds:['load'],motion:{curve:'travel',anticipation:.04}},
 two:{start:1.35,end:2.2,scene:'withdrawal',itemIds:['load'],motion:{curve:'travel',settle:.08}}};
const joined=joinedActionWindow(continuous,['one','two']);
assert.equal(joined.start,0);assert.equal(joined.end,2.2);
const joinValues=[1.35-1/30,1.35,1.35+1/30].map(t=>actionProgress(joined,t));
assert.ok(joinValues[0]<joinValues[1]&&joinValues[1]<joinValues[2],'one stroke stops at its interior event join');
for(const mutation of [{start:1.4},{scene:'other'},{motion:{curve:'travel',anticipation:.1}},{motion:{curve:'contact'}}]){
 const bad=structuredClone(continuous);Object.assign(bad.two,mutation);
 assert.throws(()=>joinedActionWindow(bad,['one','two']),/cannot cross/);
}
assert.throws(()=>joinedActionWindow(continuous,['one','one']),/distinct/);
const resting=structuredClone(continuous);resting.one.motion.settle=.1;
assert.throws(()=>joinedActionWindow(resting,['one','two']),/interior hold/);
// Renderer pose continuity and phone-space speed on the actual corrected board.
const {readFileSync}=await import('node:fs');
const corrected=JSON.parse(readFileSync('../experiments/cinematic-upgrade-2026-10-06/c.json','utf8'));
const poseBundle=await build({entryPoints:['src/lib/production/CartonIllustratedAction.tsx'],bundle:true,write:false,format:'cjs',platform:'node'});
const poseMod={exports:{}};new Function('require','module','exports',poseBundle.outputFiles[0].text)(req,poseMod,poseMod.exports);
const {illustratedCartonPose}=poseMod.exports;
assert.ok(Math.abs(illustratedCartonPose(1,1,1,1).side-illustratedCartonPose(2,0,0,0).side)<1e-12);
assert.equal(illustratedCartonPose(2,1,1,1).dx,illustratedCartonPose(3,0,0,0,0).dx);
const finalScene=corrected.scenes[3],cw=actionWindows(corrected.scenes),stroke=joinedActionWindow(cw,finalScene.continuous_withdrawal_event_ids);
const xs=[];
for(let f=Math.ceil(finalScene.start_s*30);f<Math.floor((finalScene.start_s+finalScene.duration_s)*30);f++){
 const time=f/30,actions=finalScene.visual_events.map(e=>actionProgress(cw[e.id],time));
 const pose=illustratedCartonPose(3,...actions,actionProgress(stroke,time));
 xs.push(pose.dx*corrected.art_direction.flat_shots.s4.scale);
}
const steps=xs.slice(1).map((v,i)=>v-xs[i]);
assert.ok(Math.max(...steps)<10,'loaded withdrawal exceeds 10 native pixels per frame at 30 fps');
assert.equal(corrected.art_direction.flat_shots.s4.follow_load,false,'the withdrawal camera should hold');
console.log('motion: continuous acceleration, explicit stroke joins, retained rests and actual carton pace verified');
