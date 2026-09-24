import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';
const result=await build({entryPoints:['src/cinema/plan.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {stateAt,STUDY}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const first=JSON.stringify(stateAt(7.7));
for(const t of [19,0,13,2,7.7]) stateAt(t);
assert.equal(JSON.stringify(stateAt(7.7)),first,'seeking must not change frame state');
assert.ok(stateAt(.2).iris<stateAt(1.5).iris,'the opening must open the iris');
assert.equal(stateAt(0).apart,0);
assert.equal(stateAt(8).apart,1);
assert.equal(stateAt(17).apart,0);
assert.ok(stateAt(9).light>0);
assert.equal(stateAt(17).light,0);
assert.ok(stateAt(13).sensor>stateAt(10).sensor);
for(let frame=0;frame<STUDY.fps*STUDY.seconds;frame++){
 const s=stateAt(frame/STUDY.fps);
 for(const v of [...s.camera,...s.target,s.iris,s.apart,s.light,s.sensor]) assert.ok(Number.isFinite(v));
 assert.ok(s.apart>=0&&s.apart<=1);
 assert.ok(Math.hypot(...s.camera.map((v,i)=>v-s.target[i]))>2,'camera stays outside the optics');
}
for(const file of ['src/lib/cinema/motion.ts','src/lib/cinema/Studio.tsx','src/lib/cinema/CinematicStage.tsx','src/cinema/LensAssembly.tsx','src/cinema/plan.ts']){
 const s=readFileSync(file,'utf8').replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'');
 assert.ok(!/\b(?:useFrame|requestAnimationFrame)\s*\(|(?:Math\.random|Date\.now|performance\.now)\s*\(/.test(s),file+' must be frame-derived');
}
const deps=JSON.parse(readFileSync('package.json','utf8')).dependencies;
assert.equal(deps['@remotion/three'],deps.remotion,'Remotion adapters must have the same pin');
console.log('cinema: deterministic seeking, action progression, all frame states, camera clearance and dependency pins pass');

// The existing CI entry also exercises the actual shared WebGL stage.
await import('./cinema-proof.mjs');
