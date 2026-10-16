// Static markup probe: renders the episode component to a string at every frame with a mocked
// composition clock. No frames, pixels or media are captured. Checks for throws and NaN geometry.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const engine='/home/user/TexasAIDispatch/video-engine';
const {build}=createRequire(engine+'/package.json')('esbuild');
const folder=path.join(engine,'.flood-probe-tmp');
const outfile=path.join(folder,'probe.cjs');
await build({stdin:{contents:"export {FloodStationFilm} from './src/modern/episodes/2026-10-15/FloodStationFilm'; export {filmShotAt} from './src/modern/DirectedFilm'; export {ArtDirectionProvider} from './src/lib/artDirection';",resolveDir:engine},
 outfile,bundle:true,platform:'node',format:'cjs',packages:'external',logLevel:'silent'});
const require=createRequire(path.join(engine,'package.json')),React=require('react');
const remotionPath=require.resolve('remotion'),remotion=require(remotionPath);
let FRAME=0;
require.cache[remotionPath].exports={...remotion,useCurrentFrame:()=>FRAME,useVideoConfig:()=>({fps:30,width:1080,height:1920,durationInFrames:2000})};
const api=require(outfile);
const {renderToStaticMarkup}=require('react-dom/server');
let bad=0;
for(const v of ['a','b']){
 const board=JSON.parse(fs.readFileSync(`/home/user/TexasAIDispatch/out/dispatch/opening-${v}.json`,'utf8'));
 const end=Math.round(Math.max(...board.scenes.map(s=>s.start_s+s.duration_s))*30);
 const views={};let nan=0,errs=0,maxLen=0;
 for(let f=0;f<end;f++){
  FRAME=f;const t=f/30;
  const shot=api.filmShotAt(board.film_direction,t,30);
  const active=board.narration_picture.clauses.filter(c=>t>=c.start_s&&t<c.end_s);
  if(active.some(c=>!shot.narration_ids.includes(c.id))){console.log(v,f,'cut leaves active clause');bad++;}
  const scene=board.scenes.find(s=>s.id===shot.scene_id);
  try{
   const html=renderToStaticMarkup(React.createElement(api.ArtDirectionProvider,{profile:board.art_direction,scenes:board.scenes},
    React.createElement(api.FloodStationFilm,{board,scene,shot,time_s:t,shot_s:t-shot.start_s,variant:v})));
   if(/NaN|Infinity|undefined/.test(html)){nan++;if(nan<4)console.log(v,f,shot.view,'NaN/undefined in markup',html.match(/.{60}(NaN|Infinity|undefined).{40}/)?.[0]);}
   maxLen=Math.max(maxLen,html.length);
   const items=[...html.matchAll(/data-item="([^"]+)"/g)].map(m=>m[1]);
   (views[shot.view]??=new Set());items.forEach(i=>views[shot.view].add(i));
  }catch(e){errs++;if(errs<4)console.log(v,f,shot.view,'THROW',e.message);}
 }
 bad+=nan+errs;
 console.log(v,'frames',end,'throws',errs,'nan',nan,'max markup bytes',maxLen);
 // every event item must be drawn (data-item) in some shot of its scene
 for(const s of board.scenes){
  const drawn=new Set(board.film_direction.shots.filter(x=>x.scene_id===s.id).flatMap(x=>[...(views[x.view]??[])]));
  for(const e of s.visual_events)for(const i of e.item_ids)if(!drawn.has(i)){console.log(v,s.id,e.id,'item not drawn',i);bad++;}
  for(const pl of s.planes)for(const it of pl.items)if(!drawn.has(it.id)){console.log(v,s.id,'plane item not drawn',it.id);bad++;}
 }
}
fs.rmSync(folder,{recursive:true,force:true});
process.exit(bad?1:0);
