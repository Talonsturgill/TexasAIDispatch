// Static-markup bounds probe for note-check-v1. No frames, pixels or video are captured: React renders
// SVG markup to a string and this script composes the transforms to measure screen-space bounds.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
const [,,engine,boardPath,outJson,stepArg]=process.argv;
const step=Number(stepArg||3);
const folder=fs.mkdtempSync(path.join(engine,'.nc1110-probe-'));
const require=createRequire(path.join(engine,'package.json'));
let report;
try{
 const outfile=path.join(folder,'probe.cjs');
 await build({stdin:{contents:"export {NoteCheckFilm,viewCameras,viewSpec,disclosureBox,PANES} from './src/modern/episodes/2026-11-10/NoteCheckFilm'; export {filmShotAt} from './src/modern/DirectedFilm'; export {ArtDirectionProvider} from './src/lib/artDirection'; export {widthOf} from './src/lib/type';",resolveDir:engine},
  outfile,bundle:true,platform:'node',format:'cjs',packages:'external',logLevel:'silent'});
 const React=require('react');
 const remotionPath=require.resolve('remotion'),remotion=require(remotionPath);
 let FRAME=0;
 require.cache[remotionPath].exports={...remotion,useCurrentFrame:()=>FRAME,useVideoConfig:()=>({fps:30,width:1080,height:1920,durationInFrames:2000})};
 const api=require(outfile);
 const {renderToStaticMarkup}=require('react-dom/server');
 const board=JSON.parse(fs.readFileSync(boardPath,'utf8'));
 const plan=board.film_direction;
 const end=Math.round(Math.max(...board.scenes.map(s=>s.start_s+s.duration_s))*30);
 // ---- tiny SVG parser ----
 function parse(xml){
  const root={tag:'root',attrs:{},children:[]};const stack=[root];
  const re=/<(\/)?([a-zA-Z][\w:-]*)([^>]*?)(\/)?>|([^<]+)/g;let m;
  while((m=re.exec(xml))){
   if(m[5]!==undefined){const t=m[5];if(t.trim())stack[stack.length-1].children.push({tag:'#text',text:t});continue;}
   if(m[1]){stack.pop();continue;}
   const attrs={};const ar=/([\w:-]+)="([^"]*)"/g;let a;while((a=ar.exec(m[3])))attrs[a[1]]=a[2].replace(/&amp;/g,'&').replace(/&#x27;/g,"'").replace(/&quot;/g,'"');
   const node={tag:m[2],attrs,children:[]};stack[stack.length-1].children.push(node);
   if(!m[4])stack.push(node);
  }
  return root;
 }
 const I=[1,0,0,1,0,0];
 const mul=(A,B)=>[A[0]*B[0]+A[2]*B[1],A[1]*B[0]+A[3]*B[1],A[0]*B[2]+A[2]*B[3],A[1]*B[2]+A[3]*B[3],A[0]*B[4]+A[2]*B[5]+A[4],A[1]*B[4]+A[3]*B[5]+A[5]];
 function tf(s){let M=I;if(!s)return M;const re=/(translate|rotate|scale)\(([^)]*)\)/g;let m;
  while((m=re.exec(s))){const v=m[2].split(/[ ,]+/).filter(Boolean).map(Number);
   if(m[1]==='translate')M=mul(M,[1,0,0,1,v[0],v[1]||0]);
   else if(m[1]==='scale')M=mul(M,[v[0],0,0,v.length>1?v[1]:v[0],0,0]);
   else{const r=v[0]*Math.PI/180,c=Math.cos(r),s2=Math.sin(r);const R=[c,s2,-s2,c,0,0];
    if(v.length>=3){M=mul(M,[1,0,0,1,v[1],v[2]]);M=mul(M,R);M=mul(M,[1,0,0,1,-v[1],-v[2]]);}else M=mul(M,R);}
  }return M;}
 const ap=(M,x,y)=>[M[0]*x+M[2]*y+M[4],M[1]*x+M[3]*y+M[5]];
 const scaleOf=M=>Math.sqrt(Math.abs(M[0]*M[3]-M[1]*M[2]));
 function pathPts(d){const pts=[];const tok=d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g)||[];let i=0,cmd='',cx=0,cy=0,sx=0,sy=0;
  const num=()=>Number(tok[i++]);
  while(i<tok.length){if(/[a-zA-Z]/.test(tok[i]))cmd=tok[i++];const rel=cmd===cmd.toLowerCase();const C=cmd.toUpperCase();
   if(C==='Z'){cx=sx;cy=sy;continue;}
   if(C==='H'){const x=num();cx=rel?cx+x:x;pts.push([cx,cy]);continue;}
   if(C==='V'){const y=num();cy=rel?cy+y:y;pts.push([cx,cy]);continue;}
   const n={M:2,L:2,Q:4,C:6,T:2,S:4,A:7}[C];if(!n){i++;continue;}
   const v=[];for(let k=0;k<n;k++)v.push(num());if(v.some(Number.isNaN))break;
   if(C==='A'){const x=rel?cx+v[5]:v[5],y=rel?cy+v[6]:v[6];pts.push([x,y]);cx=x;cy=y;continue;}
   for(let k=0;k<n;k+=2){const x=rel?cx+v[k]:v[k],y=rel?cy+v[k+1]:v[k+1];pts.push([x,y]);}
   const lx=pts[pts.length-1];cx=lx[0];cy=lx[1];if(C==='M'){sx=cx;sy=cy;cmd=rel?'l':'L';}
  }return pts;}
 function walk(node,M,op,ctx,out){
  if(node.tag==='#text')return;
  const a=node.attrs;const M2=a.transform?mul(M,tf(a.transform)):M;
  const op2=op*(a.opacity!==undefined?Number(a.opacity):1);
  const c2={...ctx};
  if(a['data-pane']!==undefined)c2.pane=Number(a['data-pane']);
  if(a['data-part'])c2.parts=[...(ctx.parts||[]),a['data-part']];
  if(a['data-item'])c2.items=[...(ctx.items||[]),...(a['data-items']?a['data-items'].split(' '):[a['data-item']])];
  if(a['data-item'])c2.group={key:a['data-item'],ids:a['data-items']?a['data-items'].split(' '):[a['data-item']]};
  if(a['data-disclosure'])c2.disclosure=true;
  if(a.filter)c2.shadow=true;
  if(node.tag==='defs'||node.tag==='clipPath'||node.tag==='radialGradient'||node.tag==='linearGradient')return;
  let pts=null;const n=k=>Number(a[k]||0);
  if(node.tag==='rect')pts=[[n('x'),n('y')],[n('x')+n('width'),n('y')],[n('x'),n('y')+n('height')],[n('x')+n('width'),n('y')+n('height')]];
  else if(node.tag==='circle')pts=[[n('cx')-n('r'),n('cy')-n('r')],[n('cx')+n('r'),n('cy')+n('r')]];
  else if(node.tag==='ellipse')pts=[[n('cx')-n('rx'),n('cy')-n('ry')],[n('cx')+n('rx'),n('cy')+n('ry')]];
  else if(node.tag==='path'&&a.d)pts=pathPts(a.d);
  else if(node.tag==='text'){
   const txt=node.children.filter(c=>c.tag==='#text').map(c=>c.text).join('');
   const size=Number(a['font-size']||a.fontSize||20),bold=Number(a['font-weight']||600)>=700;
   const w=api.widthOf(txt,size,bold);const anchor=a['text-anchor']||'start';const x=n('x'),y=n('y');
   const x0=anchor==='middle'?x-w/2:anchor==='end'?x-w:x;
   pts=[[x0,y-size*.78],[x0+w,y-size*.78],[x0,y+size*.22],[x0+w,y+size*.22]];
   const sp=pts.map(p=>ap(M2,p[0],p[1]));
   out.push({kind:'text',text:txt,size:size*scaleOf(M2),bbox:bb(sp),op:op2,pane:c2.pane,items:c2.items||[],group:c2.group,parts:c2.parts||[],disclosure:!!c2.disclosure});
   return;
  }
  if(pts&&pts.length){const sp=pts.map(p=>ap(M2,p[0],p[1]));
   const sw=Number(a['stroke-width']||a.strokeWidth||0)*scaleOf(M2);
   out.push({kind:node.tag,bbox:bb(sp),op:op2*(a['fill-opacity']!==undefined&&a.fill!=='none'?Number(a['fill-opacity']):1),pane:c2.pane,items:c2.items||[],
    shadow:!!c2.shadow,disclosure:!!c2.disclosure,fill:a.fill,stroke:a.stroke,sw,clipped:!!a['clip-path'],parts:c2.parts||[],group:c2.group});}
  for(const ch of node.children)walk(ch,M2,op2,c2,out);
 }
 const bb=sp=>[Math.min(...sp.map(p=>p[0])),Math.min(...sp.map(p=>p[1])),Math.max(...sp.map(p=>p[0])),Math.max(...sp.map(p=>p[1]))];
 const union=(a,b)=>a?[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[2],b[2]),Math.max(a[3],b[3])]:b;
 const inter=(a,b)=>!(a[2]<=b[0]||b[2]<=a[0]||a[3]<=b[1]||b[3]<=a[1]);
 const findings=[];const textLog=new Map();const summary={};
 const objects=[];
 for(const shot of plan.shots){
  const fEnd=Math.round((shot.start_s+shot.duration_s)*30)-1;FRAME=fEnd;const t=fEnd/30;
  const scene=board.scenes.find(s=>s.id===shot.scene_id);
  const el=React.createElement(api.ArtDirectionProvider,{profile:board.art_direction,scenes:board.scenes},
   React.createElement(api.NoteCheckFilm,{board,scene,shot,time_s:t,shot_s:t-shot.start_s,variant:plan.variant}));
  const out=[];walk(parse(renderToStaticMarkup(el)),I,1,{},out);
  const cams=api.viewCameras(shot.view);
  const objs={};
  for(const e of out){
   if(e.disclosure||e.shadow)continue;
   const c=cams[e.pane??0];
   const key=e.parts.includes('evidence-tags')?'tabs':e.parts.includes('slot-reticle')?'reticle':e.parts.includes('arm')?'arm':(e.group?e.group.key:(e.parts.includes('note-screen')?'screen':e.parts.includes('source-strip')?'strip':e.parts.includes('how-well')?'howwell-card':e.parts.includes('source-cards')?'source-cards':null));
   if(!key)continue;
   const wb=[(e.bbox[0]-c.tx)/c.z,(e.bbox[1]-c.ty)/c.z,(e.bbox[2]-c.tx)/c.z,(e.bbox[3]-c.ty)/c.z];
   const o=objs[key]||(objs[key]={key,items:new Set(),bbox:null,minText:1e9,texts:[]});
   if(e.group)e.group.ids.forEach(i=>o.items.add(i));o.bbox=union(o.bbox,wb);
   if(e.kind==='text'){o.minText=Math.min(o.minText,e.size/c.z);o.texts.push({t:e.text,size:+(e.size/c.z).toFixed(2),bbox:wb.map(v=>+v.toFixed(1))});}
  }
  const clause=board.narration_picture.clauses.find(c=>shot.narration_ids.includes(c.id));
  objects.push({cams,shot:shot.id,view:shot.view,scene:shot.scene_id,start:shot.start_s,end:shot.start_s+shot.duration_s,subjects:clause.subject_ids,
   objects:Object.values(objs).map(o=>({key:o.key,items:[...o.items],bbox:o.bbox.map(v=>+v.toFixed(1)),minText:o.minText<1e8?+o.minText.toFixed(1):null,texts:o.texts}))});
 }
 const COUNTY={x0:704,y0:80,x1:904,y1:277};
 for(let f=0;f<end;f+=step){
  FRAME=f;const t=f/30;
  const shot=api.filmShotAt(plan,t,30);const scene=board.scenes.find(s=>s.id===shot.scene_id);
  const el=React.createElement(api.ArtDirectionProvider,{profile:board.art_direction,scenes:board.scenes},
   React.createElement(api.NoteCheckFilm,{board,scene,shot,time_s:t,shot_s:t-shot.start_s,variant:plan.variant}));
  const xml=renderToStaticMarkup(el);
  const out=[];walk(parse(xml),I,1,{},out);
  const clause=board.narration_picture.clauses.find(c=>t>=c.start_s&&t<c.end_s);
  const disc=api.disclosureBox(scene.production_disclosure||'Illustration');
  const discRect=[disc[0],disc[1],disc[2],disc[3]];
  const panes=api.viewSpec(shot.view).kind==='split'?api.PANES:null;
  const visibleRect=e=>{const r=e.pane!==undefined&&panes?panes[e.pane]:[0,0,1080,1920];return r;};
  const vis=e=>{const r=visibleRect(e);return inter(e.bbox,r);};
  const tag=`${t.toFixed(2)} ${shot.id} ${shot.view}`;
  // 1. subjects
  if(clause){
   for(const id of clause.subject_ids){
    const els=out.filter(e=>!e.shadow&&!e.disclosure&&e.items.includes(id)&&vis(e));
    if(!els.length){summary['absent '+shot.id+' '+id]=(summary['absent '+shot.id+' '+id]||0)+1;continue;}
    let B=null;for(const e of els){const r=visibleRect(e);B=union(B,[Math.max(e.bbox[0],r[0]),Math.max(e.bbox[1],r[1]),Math.min(e.bbox[2],r[2]),Math.min(e.bbox[3],r[3])]);}
    const full=els.reduce((a,e)=>union(a,e.bbox),null);
    const probs=[];
    if(full[0]<20)probs.push('cut left '+full[0].toFixed(0));
    if(full[2]>930)probs.push('under feed/right '+full[2].toFixed(0));
    if(full[3]>1288)probs.push('reaches caption band '+full[3].toFixed(0));
    if(full[1]<discRect[3]+6&&full[0]<discRect[2])probs.push('under disclosure '+full[1].toFixed(0));
    if(probs.length)findings.push({t:tag,id,kind:'subject',probs:probs.join('; ')});
   }
  }
  // 2. text size
  for(const e of out.filter(e=>e.kind==='text'&&!e.disclosure&&vis(e))){
   const r=visibleRect(e);
   if(e.bbox[3]<0||e.bbox[1]>1920)continue;
   const key=shot.id+'|'+e.text;
   const rec=textLog.get(key)||{shot:shot.id,view:shot.view,text:e.text,min:1e9,max:0};rec.min=Math.min(rec.min,e.size);rec.max=Math.max(rec.max,e.size);
   rec.underCaption=rec.underCaption||(e.bbox[3]>1290&&e.bbox[1]<1425&&e.bbox[0]<918);
   rec.underDisc=rec.underDisc||inter(e.bbox,discRect);
   const isCut=(e.bbox[0]<r[0]-1||e.bbox[2]>r[2]+1);if(isCut&&!rec.cutAt)rec.cutAt=t.toFixed(2)+' '+e.bbox.map(v=>v.toFixed(0)).join(',');
   rec.cut=rec.cut||isCut;
   rec.underFeed=rec.underFeed||(e.bbox[2]>930);
   rec.county=rec.county||(t>=2&&t<8.6&&inter(e.bbox,[COUNTY.x0,COUNTY.y0,COUNTY.x1,COUNTY.y1]));
   textLog.set(key,rec);
  }
  // 3. anything under the disclosure chip
  for(const e of out.filter(e=>!e.disclosure&&!e.shadow&&vis(e)&&e.items.length&&!e.items.some(i=>/-room$|-desk$/.test(i)))){
   if(inter(e.bbox,discRect)){summary['under-disclosure '+shot.id+' '+e.items.join(',')]=(summary['under-disclosure '+shot.id+' '+e.items.join(',')]||0)+1;}
  }
  // 4. translucent non-shadow elements of real size
  for(const e of out.filter(e=>!e.shadow&&!e.disclosure&&vis(e)&&e.op>0.02&&e.op<0.97)){
   const area=(e.bbox[2]-e.bbox[0])*(e.bbox[3]-e.bbox[1]);
   if(area<1500||e.kind==='text')continue;
   const key='translucent '+shot.id+' '+(e.items.join(',')||'-')+' '+e.kind+' op '+e.op.toFixed(2);
   summary[key]=(summary[key]||0)+1;
  }
  // 5. split duplication
  if(panes){
   const seen=[new Set(),new Set()];
   for(const e of out.filter(e=>!e.shadow&&e.pane!==undefined&&vis(e)))for(const i of e.items)if(!/-room$|-desk$/.test(i))seen[e.pane].add(i);
   for(const i of seen[0])if(seen[1].has(i)){const k='split-duplicate '+shot.id+' '+i;summary[k]=(summary[k]||0)+1;}
  }
 }
 const small=[...textLog.values()].filter(r=>r.min<26||r.underCaption||r.underDisc||r.cut||r.underFeed||r.county);
 report={objects,board:boardPath,frames_sampled:Math.ceil(end/step),subject_findings:findings,text_findings:small.map(r=>({...r,min:+r.min.toFixed(1),max:+r.max.toFixed(1)})),summary};
}finally{fs.rmSync(folder,{recursive:true,force:true});}
fs.writeFileSync(outJson,JSON.stringify(report,null,1));
console.log(JSON.stringify({subjects:report.subject_findings.length,text:report.text_findings.length,summary:Object.keys(report.summary).length}));
