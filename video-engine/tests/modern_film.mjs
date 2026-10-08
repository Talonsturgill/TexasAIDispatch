import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
const engine=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const folder=fs.mkdtempSync(path.join(engine,'.modern-route-test-'));
let restoreRemotion;
try{
 const outfile=path.join(folder,'probe.cjs');
 await build({stdin:{contents:"export {assertFilmRoute,filmShotAt,MODERN_EFFECTIVE_DATE} from './src/modern/DirectedFilm'; export {StoryArtProvider} from './src/modern/StoryArt'; export {Condenser,Handheld} from './src/modern/CoolingAssets'; export {FlyGeneFilm,narrationState,clauseForView,travelAt,footAt,comparisonSpeed} from './src/modern/FlyGeneFilm'; export {ArtDirectionProvider} from './src/lib/artDirection';",resolveDir:engine},
  outfile,bundle:true,platform:'node',format:'cjs',packages:'external',logLevel:'silent'});
 const require=createRequire(import.meta.url),React=require('react');
 // Static markup probes supply composition hooks; no frames or pixels are captured.
 const remotionPath=require.resolve('remotion'),remotion=require(remotionPath);
 require.cache[remotionPath].exports={...remotion,useCurrentFrame:()=>0,useVideoConfig:()=>({fps:30,width:1080,height:1920,durationInFrames:1300})};
 restoreRemotion=()=>{require.cache[remotionPath].exports=remotion;};
 const api=require(outfile);
 const {renderToStaticMarkup}=require('react-dom/server');
 const board=JSON.parse(fs.readFileSync(path.join(engine,'../experiments/modern-film-2026-10-07/board-a.json'),'utf8'));
 const policy=JSON.parse(fs.readFileSync(path.join(engine,'../config/modern_film.json'),'utf8'));
 assert.equal(api.MODERN_EFFECTIVE_DATE,policy.effective_date);
 assert.throws(()=>api.assertFilmRoute({date:policy.effective_date,cinematic_template:'cooling-inspection-v1'}),/requires directed/);
 assert.throws(()=>api.assertFilmRoute({date:policy.effective_date}),/requires directed/);
 assert.doesNotThrow(()=>api.assertFilmRoute({date:'2026-10-07',cinematic_template:'cooling-inspection-v1'}));
 assert.doesNotThrow(()=>api.assertFilmRoute(board));
 assert.throws(()=>api.assertFilmRoute({...board,film_direction:{...board.film_direction,episode:'old-stage'}}),/Unregistered/);
 const fps=30;
 const nativeMatches=(plan,frame,rate=fps)=>plan.shots.filter(s=>frame>=Math.round(s.start_s*rate)&&frame<Math.round((s.start_s+s.duration_s)*rate));
 const checkCoverage=(fixture,rate=fps)=>{
  const plan=fixture.film_direction;
  const end=Math.round(Math.max(...fixture.scenes.map(s=>s.start_s+s.duration_s))*rate);
  for(let frame=0;frame<end;frame++){
   const matches=nativeMatches(plan,frame,rate);
   assert.equal(matches.length,1,'fixture ambiguous frame '+frame);
   assert.equal(api.filmShotAt(plan,frame/rate,rate).id,matches[0].id);
  }
  for(const frame of [end-1,0,Math.floor(end/2),1,end-2,0]){
   assert.equal(api.filmShotAt(plan,frame/rate,rate).id,nativeMatches(plan,frame,rate)[0].id);
  }
  assert.throws(()=>api.filmShotAt(plan,end/rate,rate),/uncovered/);
 };
 for(const shot of board.film_direction.shots){
  const start=Math.round(shot.start_s*fps),end=Math.round((shot.start_s+shot.duration_s)*fps);
  assert.equal(api.filmShotAt(board.film_direction,start/fps,fps).id,shot.id);
  assert.equal(api.filmShotAt(board.film_direction,(end-1)/fps,fps).id,shot.id);
 }
 checkCoverage(board);
 const flawed={shots:[{id:'before',start_s:0,duration_s:17.6666},{id:'after',start_s:17.6667,duration_s:7.6667},{id:'tail',start_s:25.3333,duration_s:1}]};
 const rawMatches=(plan,time)=>plan.shots.filter(s=>time>=s.start_s&&time<s.start_s+s.duration_s);
 assert.equal(rawMatches(flawed,530/30).length,0,'original frame530 gap remains reproduced');
 assert.equal(rawMatches(flawed,760/30).length,2,'original frame760 overlap remains reproduced');
 assert.equal(api.filmShotAt(flawed,530/30,30).id,'after');
 assert.equal(api.filmShotAt(flawed,760/30,30).id,'tail');
 assert.equal(api.filmShotAt(flawed,529.9/30,30).id,'before');
 assert.equal(api.filmShotAt(flawed,759.9/30,30).id,'after');
 const gap={shots:[{id:'left',start_s:0,duration_s:1},{id:'right',start_s:1.1,duration_s:1}]};
 const overlap={shots:[{id:'left',start_s:0,duration_s:1.1},{id:'right',start_s:1,duration_s:1}]};
 assert.throws(()=>api.filmShotAt(gap,1.05,30),/uncovered/);
 assert.throws(()=>api.filmShotAt(overlap,1.05,30),/overlapping/);
 const currentRoot=path.join(engine,'../runs/2026-10-08');
 for(const name of ['a.json','b.json']){
  const file=path.join(currentRoot,'openings',name);
  const current=JSON.parse(fs.readFileSync(file,'utf8'));
  checkCoverage(current);
  const scaled=structuredClone(current);
  for(const scene of scaled.scenes){scene.start_s*=1.137;scene.duration_s*=1.137;}
  for(const shot of scaled.film_direction.shots){shot.start_s*=1.137;shot.duration_s*=1.137;}
  checkCoverage(scaled);checkCoverage(scaled,24);
  const retimed=structuredClone(current);let cursor=0;
  for(let i=0;i<retimed.scenes.length;i++){
   const scene=retimed.scenes[i];scene.start_s=cursor;
   scene.duration_s=Math.round(scene.duration_s*(.92+i*.019)*10000)/10000;cursor+=scene.duration_s;
   for(const shot of retimed.film_direction.shots.filter(s=>s.scene_id===scene.id)){
    const start=scene.start_s+scene.duration_s*shot.scene_fraction_start;
    const end=scene.start_s+scene.duration_s*shot.scene_fraction_end;
    shot.start_s=Math.round(start*10000)/10000;shot.duration_s=Math.round((end-start)*10000)/10000;
   }
  }
  checkCoverage(retimed);
  console.log(name+' every native frame and scaled/measured retime covered once');
 }
 assert.throws(()=>api.filmShotAt(board.film_direction,100),/uncovered/);
 const c=board.art_direction.palette;
 const rendered=renderToStaticMarkup(React.createElement(api.StoryArtProvider,{plan:board.story_art},
  React.createElement(React.Fragment,null,React.createElement(api.Condenser,{x:0,y:0,heat:.5,identity:'a',c}),React.createElement(api.Handheld,{x:0,y:0,c}))));
 assert.match(rendered,/generated\/story-art\/2026-10-07\/hero.png/);
 assert.match(rendered,/generated\/story-art\/2026-10-07\/support.png/);
 assert.doesNotMatch(rendered,/public\/modern|cooling-inspection|VectorCondenser/);
 assert.match(rendered,/<foreignObject/);
 assert.match(rendered,/<img /);
 assert.doesNotMatch(rendered,/<image /,'Unmanaged SVG images caused missing native props at a cold shot mount');
 assert.throws(()=>renderToStaticMarkup(React.createElement(api.Condenser,{x:0,y:0,heat:.5,identity:'a',c})),/no old prop fallback/);
 // Renderer regression: actual measured clauses own performed states and final holds.
 const clauseTimes=[[.6,3.3],[3.68,8.52],[8.68,11.78],[12.3,15.28],[15.64,18.64],[19.2,22],[22.32,24.68],[25.24,28.78],[29.26,30.8],[31.1,32.26],[32.74,35.66]];
 const clauseActions=['living-test','discover-candidate','standard-analysis','select-candidate','restrict-movement','restore-normal','restore-partial','support-diagnosis','select-candidate','living-test','clinical-limit'];
 const fixture=JSON.parse(fs.readFileSync(path.join(currentRoot,'storyboard.json'),'utf8'));
 fixture.narration_picture={...(fixture.narration_picture??{}),version:"narration-picture-v1",timing_mode:"measured",clauses:clauseTimes.map(([start_s,end_s],i)=>({id:'c'+(i+1),text:'fixture',start_s,end_s,scene_id:'s1',subject_ids:['fixture'],action_id:clauseActions[i],view_ids:[],event_ids:[],claim_ids:[]}))};
 const same=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,a+' differs from '+b);
 const normalEnd=api.narrationState(fixture,22).normal,partialEnd=api.narrationState(fixture,24.68).partial;
 same(normalEnd,4);same(partialEnd,4);
 for(const t of [28,25.24,35.66,22,33.01,30.3,28]){
  const state=api.narrationState(fixture,t);same(state.normal,normalEnd);
  if(t>=24.68)same(state.partial,partialEnd);
 }
 same(api.narrationState(fixture,19.2).normal,0);
 same(api.narrationState(fixture,22.32).partial,0);
 assert.ok(api.narrationState(fixture,20).normal>0);
 assert.equal(api.narrationState(fixture,20).partial,0,'variant restoration cannot precede its clause');
 for(const [index,key] of [[0,'opening'],[4,'disabled'],[5,'normal'],[6,'partial'],[9,'recapTest']]){
  const [start,end]=clauseTimes[index];let previous=-1;
  for(let frame=Math.ceil(start*30);frame<=Math.ceil(end*30);frame++){
   const value=api.narrationState(fixture,frame/30)[key];
   assert.ok(value>=previous&&value>=0&&value<=4);previous=value;
  }
  const changed=structuredClone(fixture);let cursor=.23;
  for(let j=0;j<changed.narration_picture.clauses.length;j++){
   const c=changed.narration_picture.clauses[j],duration=(c.end_s-c.start_s)*(.73+j*.053);
   c.start_s=cursor;c.end_s=cursor+duration;cursor=c.end_s+.17;
  }
  const c=changed.narration_picture.clauses[index];
  for(const fraction of [1,.1,.75,0,.499,.92,.1]){
   same(api.narrationState(fixture,start+(end-start)*fraction)[key],
    api.narrationState(changed,c.start_s+(c.end_s-c.start_s)*fraction)[key]);
  }
 }
 for(const normal of [true,false]){
  const speed=t=>api.comparisonSpeed(normal,t);assert.ok(api.travelAt(4,speed)>0);
  for(const offset of [0,.5,1,1.5]){
   for(let frame=0;frame<120;frame++){
    const t=frame/30,p=api.footAt(t,offset,speed,2),next=api.footAt(t+1e-6,offset,speed,2);
    assert.ok(Number.isFinite(p.worldX)&&p.lift>=-1e-9&&p.lift<=28);
    if(((t*2+offset)%1)<.619&&((t*2+offset)%1)>1e-5)same(p.worldX,next.worldX);
   }
   for(const cycle of [1,2,3,4,5,6,7]){
    const join=(cycle-offset)/2;if(join<0||join>4)continue;
    const before=api.footAt(join-1e-7,offset,speed,2),after=api.footAt(join+1e-7,offset,speed,2);
    assert.ok(Math.abs(before.worldX-after.worldX)<.001);
   }
   same(api.footAt(4,offset,speed,2).lift,0);
  }
 }
 assert.ok(api.travelAt(4,t=>api.comparisonSpeed(true,t))>8*api.travelAt(4,t=>api.comparisonSpeed(false,t)));
 const renderView=(view,time,variant='a',currentFixture=fixture)=>{
  const scene=currentFixture.scenes[0],shot={id:'test-'+view,scene_id:scene.id,view,framing:'medium'};
  return renderToStaticMarkup(React.createElement(api.ArtDirectionProvider,{profile:currentFixture.art_direction},
   React.createElement(api.StoryArtProvider,{plan:currentFixture.story_art},
    React.createElement(api.FlyGeneFilm,{board:currentFixture,scene,shot,time_s:time,shot_s:0,variant}))));
 };
 const unresolved=renderView('standard-analysis',11.78);
 assert.match(unresolved,/Parent/);assert.match(unresolved,/Child/);assert.match(unresolved,/No answer/);
 assert.match(unresolved,/data-action="standard-analysis"/);
 assert.match(unresolved,/Illustration/);assert.doesNotMatch(unresolved,/data-subject="fly"/);
 const earlyCandidate=renderView('candidate-clue',8);
 assert.match(earlyCandidate,/Promising gene change/);assert.doesNotMatch(earlyCandidate,/AI-MARRVEL|BRSK1/);
 assert.match(renderView('gene-detail',8.4),/data-action="discover-candidate"/);
 const chosen=renderView('candidate-clue',15.28);
 assert.match(chosen,/AI-MARRVEL/);assert.match(chosen,/BRSK1/);
 for(const view of ['normal-condition','rescue-movement'])assert.equal(api.clauseForView(fixture,view,20.5),'c6');
 assert.equal(api.clauseForView(fixture,'paired-result',23),'c7');
 assert.equal(api.clauseForView(fixture,'paired-result',26),'c8');
 assert.equal(api.clauseForView(fixture,'candidate-clue',30),'c9');
 assert.equal(api.clauseForView(fixture,'living-test',31.5),'c10');
 for(const variant of ['a','b']){
  const end=renderView('honest-answer',35.66,variant),diagnosis=renderView('diagnostic-clue',28.78,variant);
  for(const rendered of [end,diagnosis]){
   assert.match(rendered,/normal-fly variant-fly/);assert.match(rendered,/Likely diagnosis/);
   assert.match(rendered,/ 420\) scale\(1.1\)/);
   assert.match(rendered,/ 880\) scale\(1.1\)/);
  }
  assert.match(end,/Not a clinical treatment/);
 }
 const flyPositions=html=>[...html.matchAll(/translate\(([\d.]+) (420|880)\) scale\(1.1\)/g)].map(m=>({x:Number(m[1]),y:Number(m[2])}));
 const pairedHold=flyPositions(renderView('paired-result',24.68));
 assert.equal(pairedHold.length,2);
 for(const [view,t] of [['paired-result',26.3],['diagnostic-clue',28.78],['honest-answer',33.2],['honest-answer',35.66]]){
  assert.deepEqual(flyPositions(renderView(view,t)),pairedHold,'actual rendered fly transforms cannot reset in a later view');
 }
 const partialBefore=flyPositions(renderView('paired-result',22.32));
 assert.equal(partialBefore[0].x,pairedHold[0].x,'normal result persists while variant starts');
 assert.ok(partialBefore[1].x<pairedHold[1].x,'variant performs within its own narration');
 assert.throws(()=>api.narrationState({...fixture,narration_picture:undefined},20),/Missing narration/);
 const missing=structuredClone(fixture);missing.narration_picture.clauses=missing.narration_picture.clauses.filter(c=>c.id!=='c7');
 assert.throws(()=>api.narrationState(missing,25),/narration clause c7/);
 // Actual geometry must perform in every spoken selection, not just advertise its action.
 const selectionGeometry=html=>{
  const choices=[...html.matchAll(/<g transform="translate\(([\d.]+) ([\d.]+)\) scale\(1\)">/g)].filter(m=>Number(m[1])>50);
  assert.equal(choices.length,1,'one selected gene glyph');
  const opacities=[...html.matchAll(/<g opacity="([\d.]+)">/g)].map(m=>Number(m[1]));
  assert.equal(opacities.length,3,'three compared candidates');
  const trace=html.match(/M600 600V([\d.]+)/);
  return {x:Number(choices[0][1]),y:Number(choices[0][2]),opacities,traceEnd:trace?Number(trace[1]):null};
 };
 for(const variant of ['a','b'])for(const index of [1,3,8]){
  const [start,end]=clauseTimes[index],xx=variant==='a'?390:140,yy=variant==='a'?620:745;
  const initial=selectionGeometry(renderView('candidate-clue',start,variant));
  const middle=selectionGeometry(renderView('candidate-clue',(start+end)/2,variant));
  const final=selectionGeometry(renderView('candidate-clue',end,variant));
  same(initial.x,xx);same(initial.y,yy);
  same(middle.x,(xx+540)/2);same(middle.y,(yy+1020)/2);
  same(final.x,540);same(final.y,1020);
  same(initial.opacities[0],1);same(middle.opacities[0],.625);same(final.opacities[0],.25);
  same(initial.opacities[2],1);same(middle.opacities[2],.625);same(final.opacities[2],.25);
  assert.deepEqual(selectionGeometry(renderView('candidate-clue',end+.02,variant)),final,'completed state persists across the same clause');
  if(index===1){
   assert.equal(middle.traceEnd,null,'c2 must not imply the later named tool');
   assert.doesNotMatch(renderView('candidate-clue',(start+end)/2,variant),/BRSK1|AI-MARRVEL/);
  }else{
   same(initial.traceEnd,600);same(middle.traceEnd,790);same(final.traceEnd,980);
   assert.match(renderView('candidate-clue',(start+end)/2,variant),/BRSK1/);
  }
  let previousX=xx,previousY=yy;
  for(let frame=Math.ceil(start*30);frame<=Math.floor(end*30);frame++){
   const t=frame/30,geometry=selectionGeometry(renderView('candidate-clue',t,variant));
   assert.ok(geometry.x>=previousX-1e-8&&geometry.y>=previousY-1e-8);
   assert.ok(geometry.x<=540+1e-8&&geometry.y<=1020+1e-8);
   previousX=geometry.x;previousY=geometry.y;
  }
  const retimed=structuredClone(fixture),c=retimed.narration_picture.clauses[index];
  c.start_s=start+.07;c.end_s=c.start_s+(end-start)*.83;
  const retimedGeometry=selectionGeometry(renderView('candidate-clue',(c.start_s+c.end_s)/2,variant,retimed));
  same(retimedGeometry.x,middle.x);same(retimedGeometry.y,middle.y);
  retimedGeometry.opacities.forEach((v,i)=>same(v,middle.opacities[i]));
  if(middle.traceEnd===null)assert.equal(retimedGeometry.traceEnd,null);else same(retimedGeometry.traceEnd,middle.traceEnd);
 }
 const cut=6.045,pAtCut=api.narrationState(fixture,cut).candidate;
 const atCut=selectionGeometry(renderView('candidate-clue',cut));
 same(atCut.x,390+150*pAtCut);
 assert.match(renderView('gene-detail',cut),new RegExp('scale\\('+String(2.6+.2*pAtCut).replaceAll('.','\\.')+'\\)'),'same clause framing uses its unchanged phase');
 const analysisGeometry=html=>{
  const inputs=[...html.matchAll(/data-genetic-input="abstract" transform="translate\(([\d.]+) ([\d.]+)\) scale\(([\d.]+)\)"/g)].map(m=>({x:Number(m[1]),y:Number(m[2]),scale:Number(m[3])}));
  const search=html.match(/<g transform="translate\(([\d.]+) 985\)">/);
  const output=html.match(/data-analysis-result="unresolved" opacity="([\d.]+)"/);
  assert.equal(inputs.length,8,'both records supply recognizable genetic emblems and two processing packets');
  return {packets:inputs.filter(x=>x.scale===.55),searchX:Number(search[1]),outputOpacity:Number(output[1])};
 };
 const startAnalysis=analysisGeometry(renderView('standard-analysis',8.68));
 const midAnalysis=analysisGeometry(renderView('standard-analysis',10.23));
 const endAnalysis=analysisGeometry(renderView('standard-analysis',11.78));
 assert.equal(startAnalysis.outputOpacity,0);assert.equal(endAnalysis.outputOpacity,1);
 assert.ok(midAnalysis.packets[0].x>startAnalysis.packets[0].x&&midAnalysis.packets[0].y>startAnalysis.packets[0].y);
 assert.ok(midAnalysis.packets[1].x<startAnalysis.packets[1].x);
 assert.ok(midAnalysis.searchX>startAnalysis.searchX&&endAnalysis.searchX>midAnalysis.searchX);
 assert.deepEqual(analysisGeometry(renderView('standard-analysis',11.9)),endAnalysis,'unresolved outcome retains its final comparison state');
 const source=fs.readFileSync(path.join(engine,'src/modern/FlyGeneFilm.tsx'),'utf8');
 assert.doesNotMatch(source,/time_s-scene.start_s|comparisonRun|shot_s\s*[*/+-]/,'performance cannot reset at scene or shot boundary');
 assert.match(source,/requireNarration/);
 console.log('Fly renderer uses measured clauses, retains supported results, performs parent-child analysis and qualified paired closing.');
 console.log('Modern runtime refuses legacy fallback and missing current artwork; every shot supports random-access rendering.');
}finally{restoreRemotion?.();fs.rmSync(folder,{recursive:true,force:true});}
