// Source geometry only. This starts no browser and captures no image.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),crypto=require('node:crypto');
const root=process.cwd(),engine=path.join(root,'video-engine');
const req=Module.createRequire(path.join(engine,'package.json'));
const {buildSync}=req('esbuild');
const result=buildSync({stdin:{contents:`export {LETTER_AT,TABLET,paperPt,tabletPt,leakState} from './src/modern/episodes/2026-10-21/LeakReviewFilm'; export {LETTER,tagSize,flagHook} from './src/modern/episodes/2026-10-21/LeakReviewSupport'; export {DRONE_SIDE_BOX} from './src/modern/episodes/2026-10-21/InspectionDroneHero'; export {actionWindows} from './src/lib/direction'; export {widthOf} from './src/lib/type'; export {captionLayout,captionBandHeight,CAPTION_ENTRANCE_PX} from './src/lib/editorial'; export {SAFE_BOTTOM} from './src/lib/safearea';`,resolveDir:engine},bundle:true,platform:'node',format:'cjs',packages:'external',write:false,logLevel:'silent'});
const m=new Module(path.join(engine,'.source-bounds.cjs'));m.filename=path.join(engine,'.source-bounds.cjs');m.paths=Module._nodeModulePaths(engine);m._compile(result.outputFiles[0].text,m.filename);
const A=m.exports, observations=[],errors=[];
const box=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const rotate=(points,r)=>points.map(([x,y])=>{const a=r*Math.PI/180;return[x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a)];});
const bound=points=>[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))];
const add=(name,points,ceiling,metadata={})=>{const b=bound(points),pass=b[0]>=40&&b[2]<=1040&&b[1]>=100&&b[3]<=ceiling;observations.push({name,bounds:b,caption_top:ceiling,pass,...metadata});if(!pass)errors.push(name);};
for(const name of ['opening-a','opening-b']){
 const board=JSON.parse(fs.readFileSync(path.join(root,'out/dispatch',name+'.json'))),W=A.actionWindows(board.scenes),N=Object.fromEntries(board.narration_picture.clauses.map(c=>[c.id,{start:c.start_s,end:c.end_s}]));
 const capTop=sid=>Math.min(...board.captions.filter(c=>{const n=board.narration_picture.clauses.find(n=>n.cue_ids.includes(c.id));return n?.scene_id===sid;}).map(c=>A.SAFE_BOTTOM-A.captionBandHeight(A.captionLayout(c.text,842,c.max_lines===3?3:2))-A.CAPTION_ENTRANCE_PX));
 const flat=board.art_direction.flat_shots.s3;if(flat.scale!==1||flat.x!==0||flat.y!==0)throw Error('recompute flat transform');
 // Interior paper is outside CamG and PlaceSubject. paperPt composes its actual translation,
 // rotation, scale and foreshortening. Test every callable paper view, once at the settled extrema.
 for(const [view,L]of Object.entries(A.LETTER_AT)){
  const p=(pts)=>pts.map(q=>A.paperPt(L,q));
  for(const key of ['date','approved']){const d=A.LETTER[key];add(name+'/'+view+'/'+key,p(rotate(box(0,0,d.w,d.h),d.rot).map(([x,y])=>[x+d.x,y+d.y])),capTop('s3'));}
  const G=A.LETTER.tag;add(name+'/'+view+'/scope',p(rotate(box(0,0,G.w,G.h),-2).map(([x,y])=>[x+G.x,y+G.y])),capTop('s3'));
  add(name+'/'+view+'/identity',p(box(302,292,264,132)),capTop('s3'));
  const d=A.DRONE_SIDE_BOX;add(name+'/'+view+'/generic-drone',p(box(154+.55*d[0],414+.55*d[1],.55*(d[2]-d[0]),.55*(d[3]-d[1]))),capTop('s3'));
 }
 // Attribution uses the same on-screen resting position before its attachment stroke.
 // Inspect every delivered frame plus both endpoints, with actual event-clock progress/swing.
 for(const view of ['panel-wide','alert-panel','room-monitor']){
  const T=A.TABLET[view],size=view==='alert-panel'?38:32,z=A.tagSize(['The companies','say'],size),corner=A.tabletPt(T,A.flagHook(T.W,T.H)),hole=[corner[0]-4,corner[1]+72],flip=hole[0]+z.w+44>905,all=[];
  const scene=board.scenes.find(s=>s.id==='s2');
  for(let frame=Math.floor(scene.start_s*30);frame<=Math.ceil((scene.start_s+scene.duration_s)*30);frame++){
   const s=A.leakState(W,frame/30,N).s2,p=s.tag,pos=[hole[0]-80*(1-p),hole[1]+180*(1-p)-70*Math.sin(Math.PI*p)],r=(flip?-1:1)*16*(1-p)+s.swing;
   const pts=box(flip?-(z.w+44):-18,-z.h/2,z.w+62,z.h+9);all.push(...rotate(pts,r).map(([x,y])=>[x+pos[0],y+pos[1]]));
  }
  add(name+'/'+view+'/company-attribution-all-frames',all,capTop('s2'),{first_frame_visible:true,cam_transform:'none',place_subject_transform:'none'});
 }
 for(const[text,size,max]of [['Air Max',38,232],['Record name',21,232],['Generic drone',22,232],['AI alert',24,130]]){
  const width=A.widthOf(text,size,true),pass=width<=max;observations.push({name:name+'/text/'+text,width,max,pass});if(!pass)errors.push(text);
 }
}
const inputs=['out/dispatch/opening-a.json','out/dispatch/opening-b.json','out/dispatch/captions.json','video-engine/src/modern/episodes/2026-10-21/LeakReviewFilm.tsx','video-engine/src/modern/episodes/2026-10-21/LeakReviewSupport.tsx','video-engine/src/modern/episodes/2026-10-21/InspectionDroneHero.tsx','video-engine/src/lib/direction.ts','video-engine/src/lib/type.ts','video-engine/src/lib/editorial.ts','video-engine/src/lib/safearea.ts'].map(file=>({path:file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')}));
console.log(JSON.stringify({schema:'dispatch_source_composed_bounds/1',capture:false,approval:false,pass:!errors.length,errors,inputs,observations},null,2));
process.exitCode=errors.length?1:0;
