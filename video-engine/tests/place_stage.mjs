/* PlaceStage moves the region's layers by the same arithmetic place_bake.py checked them with. The bake
 * measures a plate's limits and checks every camera profile's ends against cover, slide and scale; a
 * stage that moved the layers by a different formula would ship moves nobody checked. So this asks the
 * bake for every plate's ground and card matrices at every profile's ends and requires the stage's own
 * to agree, and then renders the stage to markup to prove it switches on, off and between its modes the
 * way place_check.py assumes. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
const engine=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const repo=path.resolve(engine,'..');
const folder=fs.mkdtempSync(path.join(engine,'.place-stage-test-'));
let restoreRemotion;
try{
 const outfile=path.join(folder,'probe.cjs');
 await build({stdin:{contents:"export * from './src/modern/PlaceStage'; export {countyKey,CountyLocator,LOCATOR_START_S,LOCATOR_END_S} from './src/modern/CountyLocator'; export {ArtDirectionProvider} from './src/lib/artDirection';",
  resolveDir:engine,loader:'tsx'},outfile,bundle:true,platform:'node',format:'cjs',packages:'external',logLevel:'silent',
  loader:{'.json':'json'}});
 const require=createRequire(import.meta.url),React=require('react');
 const remotionPath=require.resolve('remotion'),remotion=require(remotionPath);
 require.cache[remotionPath].exports={...remotion,useCurrentFrame:()=>0,useVideoConfig:()=>({fps:30,width:1080,height:1920,durationInFrames:900}),
  Img:(p)=>React.createElement('img',{src:p.src,style:p.style,'data-place-layer':p['data-place-layer']}),staticFile:(f)=>'/'+f};
 restoreRemotion=()=>{require.cache[remotionPath].exports=remotion;};
 const api=require(outfile);
 const {renderToStaticMarkup}=require('react-dom/server');
 const manifest=JSON.parse(fs.readFileSync(path.join(engine,'src/modern/placePlates.json'),'utf8'));

 // 1. the stage's matrices are the bake's, at every profile's ends, for every plate
 const rows=JSON.parse(execFileSync('python3',[path.join(repo,'scripts/place_bake.py'),'--matrices'],{encoding:'utf8',maxBuffer:64<<20}));
 assert.ok(rows.length>=Object.keys(manifest.plates).length,'the bake returned no matrices');
 const close=(a,b,what)=>{a.forEach((v,i)=>assert.ok(Math.abs(v-b[i])<=1e-9*Math.max(1,Math.abs(b[i])),`${what}: element ${i} ${v} != ${b[i]}`));};
 for(const r of rows){
  const plate=manifest.plates[r.plate];
  close(api.groundHomography(plate.camera,r.move),r.ground,`${r.plate} ${r.profile} ground`);
  plate.cards.forEach((c,i)=>close(api.cardMatrix(plate.camera,c.depth_m,r.move),r.cards[i],`${r.plate} ${r.profile} card ${i}`));
 }
 // and a profile's move at its ends is the share of the limit the bake checked
 const plate=api.plateFor({region:'gulf'});
 assert.equal(api.plateFor({region:'gulf',county:'Harris County'}).id,'gulf-houston','Harris did not stand in Houston');
 assert.equal(api.plateFor({region:'gulf',county:'Matagorda'}).id,'gulf-wide','Matagorda did not get the region');
 assert.equal(api.plateFor({region:'gulf',county:'Harris',place_plate:'gulf-shipchannel'}).id,'gulf-shipchannel');
 assert.throws(()=>api.plateFor({region:'gulf',county:'Cameron',place_plate:'gulf-shipchannel'}),/not for Cameron/);
 for(const p of Object.values(manifest.plates))if(!p.counties?.length&&!p.also?.length)
  assert.equal(api.plateFor({region:p.region,county:'Nowhere'}).id,p.id,'a region did not fall back to its own plate');
 for(const [name,prof] of Object.entries(manifest.moves.profiles)){
  for(const [u,end] of [[0,0],[1,1]]){
   const m=api.placeMove(plate,name,u);
   for(const axis of ['dolly','truck','rise']){
    const want=prof[axis]?manifest.moves.share*plate.limits[axis+'_m']*prof[axis][end]:0;
    assert.ok(Math.abs(m[axis]-want)<1e-12,`${name} ${axis} at ${u}: ${m[axis]} != ${want}`);
   }
  }
 }
 assert.deepEqual(api.placeMove(plate,'sourcePicture',.5),{dolly:0,truck:0,rise:0},'a source scene moved the camera');
 // a ground pixel under the horizon stays on the ground's own row when nothing moves
 const still=api.groundHomography(plate.camera,{dolly:0,truck:0,rise:0});
 close(still,[1,0,0,0,1,0,0,0,1],'a still camera moved the ground');

 // 2. on, off and the modes
 assert.equal(api.PLACE_EFFECTIVE_DATE,manifest.policy.effective_date);
 assert.equal(api.PLACE_VERSION,manifest.policy.version);
 assert.equal(api.placeActive({date:'2026-10-08'}),false,'an October 8th film was put on the stage');
 assert.equal(api.placeActive({date:manifest.policy.effective_date}),true);
 assert.equal(api.placeActive({date:'2026-10-08',place:{version:manifest.policy.version}}),true,'the opt-in was ignored');
 assert.throws(()=>api.plateFor({region:'nowhere'}),/No place plate/);
 const board=JSON.parse(fs.readFileSync(path.join(repo,'experiments/modern-film-2026-10-07/board-a.json'),'utf8'));
 const scene={...board.scenes[0],region:'gulf'};
 const shot={...board.film_direction.shots[0]};
 const draw=(b,sc,sh,t=1)=>renderToStaticMarkup(React.createElement(api.ArtDirectionProvider,{profile:board.art_direction,scenes:board.scenes},
  React.createElement(api.PlaceStage,{board:b,scene:sc,shot:sh,time_s:t},React.createElement('i',{id:'episode'}))));
 const off=draw(board,scene,shot);
 assert.ok(!off.includes('data-place-plate')&&off.includes('id="episode"'),'an October 7th film changed under the stage');
 const on={...board,place:{version:manifest.policy.version}};
 const inside=draw(on,{...scene,interior:true},{...shot,framing:'wide'});
 assert.ok(inside.includes('data-place-mode="interior"')&&inside.includes('data-place-window'),'an interior had no window');
 assert.ok(inside.indexOf('data-place-plate')<inside.indexOf('id="episode"'),'the stage drew over the episode');
 const outside=draw(on,{...scene,interior:false,camera_strategy:'truckAcross'},{...shot,framing:'wide'});
 assert.ok(outside.includes('data-place-mode="exterior"')&&outside.includes('matrix3d('),'an exterior was not moved by its matrices');
 const wash=draw(on,{...scene,interior:true},{...shot,framing:'detail'});
 assert.ok(wash.includes('data-place-wash')&&!wash.includes('data-place-window'),'a detail shot drew a window frame');
 const down=draw(on,{...scene,interior:true},{...shot,framing:'overhead'});
 assert.ok(down.includes('data-place-mode="overhead"')&&!down.includes('data-place-layer'),'an overhead shot drew a horizon');
 const flyBoard={...on,film_direction:{...on.film_direction,episode:'fly-gene-test-v2'}};
 const diagram=draw(flyBoard,{...scene,interior:true},{...shot,framing:'close',view:'gene-detail'});
 assert.ok(diagram.includes('data-place-mode="wall"')&&!diagram.includes('data-place-window'),'a declared wall view drew a window');
 assert.ok(draw(flyBoard,{...scene,interior:true},{...shot,framing:'wide',view:'fly-question'}).includes('data-place-window'),
  'an undeclared view lost its window');
 const washed=draw(flyBoard,{...scene,interior:true},{...shot,framing:'split',view:'paired-result'});
 assert.ok(washed.includes('data-place-wash')&&!washed.includes('data-place-window'),'a declared wash view drew a window');
 const probe=draw({...on,__placeProbe:true},{...scene,interior:true},{...shot,framing:'wide'});
 assert.ok(probe.includes('data-place-probe')&&probe.includes('#ff00ff')&&!probe.includes('data-place-layer'),'the probe still drew the plate');

 // 3. the locator
 assert.equal(api.countyKey('Harris County'),'Harris');
 assert.equal(api.countyKey(' harris '),'Harris');
 assert.throws(()=>api.countyKey('Tayler'),/not on the Texas county map/);
 const loc=(t)=>renderToStaticMarkup(React.createElement(api.CountyLocator,{county:'Harris',time_s:t,ink:'#000',paper:'#fff',accent:'#c00'}));
 assert.equal(loc(api.LOCATOR_START_S-.01),'','the locator showed before its start');
 assert.equal(loc(api.LOCATOR_END_S),'','the locator stayed past its end');
 assert.ok(loc(api.LOCATOR_START_S+3).includes('data-county-locator="Harris"'));
 const withLocator=draw(on,{...scene,interior:true},{...shot,framing:'wide'},api.LOCATOR_START_S+3);
 assert.ok(withLocator.indexOf('data-county-locator')>withLocator.indexOf('id="episode"'),'the locator drew under the episode');
 console.log(`place stage: ${rows.length} profile ends on ${Object.keys(manifest.plates).length} plates match the bake; modes, opt-in and locator ok`);
}finally{
 restoreRemotion?.();
 fs.rmSync(folder,{recursive:true,force:true});
}
