import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
const engine=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const folder=fs.mkdtempSync(path.join(engine,'.modern-route-test-'));
try{
 const outfile=path.join(folder,'probe.cjs');
 await build({stdin:{contents:"export {assertFilmRoute,filmShotAt,MODERN_EFFECTIVE_DATE} from './src/modern/DirectedFilm'; export {StoryArtProvider} from './src/modern/StoryArt'; export {Condenser,Handheld} from './src/modern/CoolingAssets';",resolveDir:engine},
  outfile,bundle:true,platform:'node',format:'cjs',packages:'external',logLevel:'silent'});
 const require=createRequire(import.meta.url),api=require(outfile),React=require('react');
 const {renderToStaticMarkup}=require('react-dom/server');
 const board=JSON.parse(fs.readFileSync(path.join(engine,'../experiments/modern-film-2026-10-07/board-a.json'),'utf8'));
 const policy=JSON.parse(fs.readFileSync(path.join(engine,'../config/modern_film.json'),'utf8'));
 assert.equal(api.MODERN_EFFECTIVE_DATE,policy.effective_date);
 assert.throws(()=>api.assertFilmRoute({date:policy.effective_date,cinematic_template:'cooling-inspection-v1'}),/requires directed/);
 assert.throws(()=>api.assertFilmRoute({date:policy.effective_date}),/requires directed/);
 assert.doesNotThrow(()=>api.assertFilmRoute({date:'2026-10-07',cinematic_template:'cooling-inspection-v1'}));
 assert.doesNotThrow(()=>api.assertFilmRoute(board));
 assert.throws(()=>api.assertFilmRoute({...board,film_direction:{...board.film_direction,episode:'old-stage'}}),/Unregistered/);
 for(const shot of board.film_direction.shots){
  assert.equal(api.filmShotAt(board.film_direction,shot.start_s+.01).id,shot.id);
  assert.equal(api.filmShotAt(board.film_direction,shot.start_s+shot.duration_s-.01).id,shot.id);
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
 console.log('Modern runtime refuses legacy fallback and missing current artwork; every shot supports random-access rendering.');
}finally{fs.rmSync(folder,{recursive:true,force:true});}
